/* news99-a: page bodies for TOTALITY! (eclipse), EURO WATCH, DOME WATCH and CRAZE WATCH (lazy, from js/news99.js).
 * Facts (all checked): eclipse 11 Aug 1999, totality ~11:11 BST in Cornwall, ~2 min near Falmouth, Cornwall + part of south
 * Devon + Alderney, London ~97%, Edinburgh ~85%, last mainland total 29 Jun 1927, next 23 Sep 2090, Cornwall mostly cloudy.
 * Euro: 1 Jan 1999, 11 countries, fixed conversion rates (ECB 31 Dec 1998), notes + coins 1 Jan 2002, UK kept the pound;
 * Bank of England EUR/GBP on the first working day of each month. Dome: 365 m across, 12 masts of 100 m, ~50 m high,
 * topped out 22 Jun 1998, 14 zones, Blue Peter time capsule buried 11 Jun 1998, North Greenwich station 14 May 1999,
 * Jubilee line extension phases 14 May / 24 Sep / 20 Nov / Westminster 22 Dec, opening night 31 Dec with the Queen,
 * open to the public 1 Jan 2000. Crazes: Tamagotchi UK 8 May 1997, Furby £29.99 Christmas 1998, Pokemon on Sky One from
 * 29 Mar 1999, Red/Blue 5 Oct 1999, Beanie Babies retirement news 31 Aug 1999, Bob the Builder 12 Apr, Tweenies 6 Sep,
 * Millionaire's peak audience 19.2 million on 7 Mar 1999, Dreamcast 14 Oct 1999. */
(function () {
  'use strict';
  const N = window.N99; if (!N) return;
  const esc = N.esc, store = N.store, nice = N.nice;

  // ================================================================ TOTALITY! (the eclipse)
  const EH = 'www.totality99.cyb', EU = p => 'http://' + EH + p;
  N.css('ecl', `
.ec{background:#05051a radial-gradient(circle at 20% 10%,#1a1a50,#05051a 60%);color:#e8e8ff;font:13px/1.5 Verdana,Arial,sans-serif;padding-bottom:8px}
.ec a{color:#ffd400}
.ec-top{text-align:center;padding:14px 8px 6px;background-image:radial-gradient(1px 1px at 10% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 20%,#fff,transparent),radial-gradient(1px 1px at 40% 70%,#ccf,transparent),radial-gradient(1px 1px at 85% 60%,#fff,transparent),radial-gradient(1px 1px at 25% 85%,#fff,transparent)}
.ec-top b{display:block;font:bold 38px/1 "Arial Black",Impact,sans-serif;letter-spacing:6px;color:#ffd400;text-shadow:0 0 12px #ff8a00,0 0 2px #fff}
.ec-top i{display:block;font:italic 12px Georgia,serif;color:#aab}
.ec-nav{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;padding:6px;border-top:1px solid #334;border-bottom:1px solid #334;font:bold 12px Verdana,sans-serif}
.ec-in{max-width:720px;margin:0 auto;padding:10px 12px}
.ec-sun{display:block;margin:6px auto;width:220px;height:220px}
.ec-big{text-align:center;font:bold 18px Verdana,sans-serif;color:#fff;margin:4px 0 10px}
.ec-warn{background:#600;border:3px solid #ff0;color:#fff;padding:8px 10px;margin:12px 0;font-weight:bold;text-align:center}
.ec-box{border:1px solid #446;background:rgba(40,40,100,.45);padding:8px 10px;margin:10px 0}
.ec-box h3{margin:0 0 4px;color:#ffd400;font-size:14px}
.ec-step{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px dashed #446}
.ec-step input{width:20px;height:20px;flex:none;margin-top:2px}
.ec-step.done span{color:#8f8;text-decoration:line-through}
.ec table{border-collapse:collapse;width:100%;font-size:12px}
.ec td,.ec th{border:1px solid #446;padding:4px 6px;text-align:left}
.ec th{background:#223;color:#ffd400}
.ec .n99-btn{font-weight:bold}
`);
  const sunSvg = (c) => {
    // the Moon creeps across the Sun as the big day gets closer (it is a picture, not a scientific diagram!)
    const u = c.until('08-11');
    let mx = 110 + Math.max(-150, Math.min(150, u * 0.8)), corona = u === 0;
    if (u > 0 && u <= 30) mx = 110 + u * 2.2;
    if (u < 0) mx = 110 - Math.min(150, 40 + (-u) * 1.5);
    return `<svg class="ec-sun" viewBox="0 0 220 220" role="img" aria-label="The Sun and the Moon"><defs><radialGradient id="ecG"><stop offset=".55" stop-color="#fff8c0"/><stop offset=".75" stop-color="#ffcc33"/><stop offset="1" stop-color="#ff8a00" stop-opacity="0"/></radialGradient><radialGradient id="ecC"><stop offset=".4" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#99c" stop-opacity="0"/></radialGradient></defs>
      ${corona ? '<circle cx="110" cy="110" r="105" fill="url(#ecC)"/><g stroke="#fff" stroke-opacity=".5">' + Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<line x1="${110 + Math.cos(a) * 52}" y1="${110 + Math.sin(a) * 52}" x2="${110 + Math.cos(a) * (80 + (i % 3) * 12)}" y2="${110 + Math.sin(a) * (80 + (i % 3) * 12)}"/>`; }).join('') + '</g>' : '<circle cx="110" cy="110" r="80" fill="url(#ecG)"/>'}
      <circle cx="110" cy="110" r="50" fill="${corona ? '#000' : '#ffe680'}"/>
      ${corona ? '' : `<circle cx="${mx}" cy="${110 - (mx - 110) * 0.15}" r="51" fill="#05051a"/>`}</svg>`;
  };
  const ecPage = (c, body) => `<div class="ec"><div class="ec-top"><b>TOTALITY!</b><i>The 1999 Eclipse Countdown &middot; a fan site by Mike (amateur astronomer, owns three telescopes, his wife says that's two too many)</i></div>
    <div class="ec-nav"><a href="${EU('/')}">Countdown</a><a href="${EU('/pinhole.html')}">Make a Pinhole Viewer</a><a href="${EU('/where.html')}">Where To See It</a><a href="${EU('/faq.html')}">FAQ</a></div><div class="ec-in">${body}</div>${N.foot(c, 'TOTALITY! is not affiliated with the Sun, the Moon or any Space Agency')}</div>`;
  const EC_MATES = [
    ['01-20', 'Jack', 'Bookmarked! 203 days to go. I have written it on my bedroom wall. (In pencil. Mom.)'],
    ['03-02', 'Callum', 'My dad says we\'re driving to Cornwall. My mom says we are NOT. Updates as they happen.'],
    ['04-14', 'Dave', 'Will it be dark enough to play Game Lad with the light thing? Asking for science.'],
    ['05-25', 'Luke', 'Our science teacher is doing a whole lesson on it. With a torch and a football.'],
    ['06-30', 'JackK', 'Made the pinhole viewer from this site. Practised on a normal Sun. It is a dot. A good dot though.'],
    ['07-22', 'Callum', 'UPDATE: we are not driving to Cornwall. Mom won.'],
    ['08-04', 'Jack', 'Got my eclipse glasses from the newsagent! You can\'t see ANYTHING through them except the Sun. That\'s the point.'],
    ['08-10', 'Dave', 'TOMORROW!!! If it\'s cloudy I\'m blaming Luke.'],
    ['08-11', 'Luke', 'It went all dim and cold and the birds shut up. 10/10 would eclipse again.'],
    ['08-11', 'Jack', 'Pinhole viewer WORKED!!! A little crescent Sun on the bottom of the cereal box. Science!!!'],
    ['08-13', 'JackK', '2090 for the next one. I\'ll be REALLY old. I\'m going to be there anyway. With a walking frame.'],
    ['09-20', 'Callum', 'Still got my eclipse glasses. Use them as a bookmark now.'],
    ['12-28', 'Jack', 'Best day of 1999? This or Pocket Critters. Tough one.'],
  ];
  N.def(EH, '/', c => {
    const u = c.until('08-11');
    let lead;
    if (u > 30) lead = `<div class="ec-big">${N.countdown(c, '08-11', 'the TOTAL ECLIPSE')}</div><p>On <b>Wednesday 11 August 1999</b> the Moon will pass right in front of the Sun. In <b>Cornwall</b>, part of south <b>Devon</b> and on <b>Alderney</b> it will go properly DARK in the middle of the morning. The first total eclipse on the British mainland since <b>29 June 1927</b>! Everywhere else in the country gets a big bite taken out of the Sun.</p>`;
    else if (u > 0) lead = `<div class="ec-big">${N.countdown(c, '08-11', 'the TOTAL ECLIPSE')}</div><p><b>GET YOUR GLASSES NOW.</b> The shops are running out of proper eclipse viewers. In Cornwall the Moon covers the Sun completely at about <b>11:11 in the morning</b> (summer time) for about <b>two minutes</b>. Pray for no clouds. Then pray again.</p>`;
    else if (u === 0) lead = `<div class="ec-big"><span class="n99-blink">IT'S TODAY!!!</span></div><p>Totality in Cornwall at about <b>11:11</b>. In London about <b>97%</b> of the Sun gets covered; in Edinburgh about <b>85%</b>. Wherever you are: glasses on, pinhole viewer ready, and <b>NEVER LOOK STRAIGHT AT THE SUN</b>. Turn on the telly, it's on every channel.</p>`;
    else lead = `<div class="ec-big">WE SAW IT!!! (Sort of.)</div><p>The eclipse was on <b>11 August 1999</b>. Much of Cornwall was under cloud (of course), but it still went dark at 11 in the morning, the streetlights came on and the birds went quiet. Through the gaps some lucky people saw the corona. The rest of us saw a crescent Sun in our pinhole viewers.</p><p><b>Next total eclipse in Britain: 23 September 2090.</b> Put it in your diary. In pen.</p>`;
    c.after.push(() => { const b = c.q('[data-look]'); if (b) b.addEventListener('click', () => { N.sfx('uhoh'); N.secret('n99.sun'); Desk.msgbox('TOTALITY!', 'NO!!! STOP!!!\n\nNEVER look straight at the Sun, not even a little bit, not even with sunglasses, not even through a camera or a telescope. It can hurt your eyes for ever.\n\nUse proper eclipse viewers, or make a pinhole viewer (see the pinhole page). That\'s how the professionals do it.', 'warn'); }); });
    return ecPage(c, sunSvg(c) + lead + `<div class="ec-warn">&#9888; DON'T LOOK AT THE SUN &#9888;<br><small>Not with sunglasses. Not through binoculars. Not "just for a second". Use a pinhole viewer!</small><br><button type="button" class="n99-btn" data-look>Look at the Sun anyway</button></div>
      <div class="ec-box"><h3>Eclipse '99 in numbers</h3><ul><li>Date: <b>Wednesday 11 August 1999</b></li><li>Totality in Cornwall: about <b>11:11 BST</b></li><li>Longest totality in Britain: just over <b>2 minutes</b>, near Falmouth</li><li>Last total eclipse on the mainland: <b>29 June 1927</b></li><li>Next one: <b>23 September 2090</b></li></ul></div>`
      + N.mates(c, EC_MATES, 'SHOUTBOX'));
  });
  const STEPS = ['Get an empty cereal box (eat the cereal first. That is the best step).', 'Cut a square hole in one end of the top, about 2cm across.', 'Tape a piece of kitchen foil over the hole and poke ONE tiny hole in it with a pin.', 'Tape a sheet of white paper inside the bottom of the box.', 'Cut a peep hole in the other end of the top, so you can look down inside.', 'Stand with your BACK to the Sun, let the sunlight go through the pinhole, and look in the peep hole at the paper. The Sun appears as a little picture on the paper!'];
  N.def(EH, '/pinhole.html', c => {
    const got = store.get('jhp_n99_pin', []);
    c.after.push(() => c.qa('.ec-step input').forEach(cb => cb.addEventListener('change', () => {
      const i = +cb.dataset.i, g = store.get('jhp_n99_pin', []).filter(x => x !== i); if (cb.checked) g.push(i); store.set('jhp_n99_pin', g);
      cb.parentNode.classList.toggle('done', cb.checked); N.sfx('click');
      if (g.length === STEPS.length) { N.secret('n99.pinhole'); const r = c.q('[data-pinres]'); if (r) r.hidden = false; }
    })));
    return ecPage(c, `<h2 style="color:#ffd400">Make a Pinhole Viewer</h2><p>The safest way to watch an eclipse: you never look at the Sun at all, you look at a little picture of it. You need a cereal box, foil, tape, a pin, white paper and scissors (ask a grown-up about the scissors).</p>
      ${STEPS.map((s, i) => `<label class="ec-step${got.includes(i) ? ' done' : ''}"><input type="checkbox" data-i="${i}"${got.includes(i) ? ' checked' : ''}><span><b>Step ${i + 1}.</b> ${s}</span></label>`).join('')}
      <div class="ec-box" data-pinres${got.length === STEPS.length ? '' : ' hidden'}><h3>DONE! It works like this:</h3><svg viewBox="0 0 260 90" style="width:100%;max-width:420px" role="img" aria-label="How a pinhole viewer works"><circle cx="20" cy="45" r="14" fill="#ffd400"/><path d="M34 40 L120 44 M34 50 L120 46" stroke="#ffd400" stroke-dasharray="3 3"/><rect x="120" y="20" width="130" height="50" fill="#c86" stroke="#000"/><rect x="118" y="43" width="4" height="4" fill="#ccc"/><path d="M122 45 L246 30 M122 45 L246 60" stroke="#ffd400" stroke-opacity=".5"/><rect x="246" y="22" width="3" height="46" fill="#fff"/><path d="M247 40 a6 6 0 1 0 0 10 a4 5 0 1 1 0 -10" fill="#ffd400"/><text x="150" y="85" fill="#ccc" font-size="9" font-family="Verdana">the Sun comes out upside down!</text></svg></div>
      <p>During the eclipse the little round Sun on your paper turns into a <b>crescent</b>. Even the gaps between leaves on a tree do it: look at the shadows on the ground!</p>` + N.mates(c, EC_MATES.filter(r => /pinhole|viewer|crescent/i.test(r[2])), 'IT WORKED FOR...'));
  });
  N.def(EH, '/where.html', c => ecPage(c, `<h2 style="color:#ffd400">Where To See It</h2><p>The Moon's shadow comes in from the Atlantic, crosses <b>Cornwall</b>, the bottom of <b>Devon</b> and <b>Alderney</b>, then heads off over France and across Europe. Only inside that strip does the Sun go completely black. Everywhere else in Britain gets a <b>partial eclipse</b>: still amazing, still DON'T LOOK.</p>
    <table><tr><th>Where</th><th>What you get</th></tr><tr><td>Cornwall (near Falmouth)</td><td>TOTAL, just over 2 minutes</td></tr><tr><td>Plymouth</td><td>TOTAL, about 1 minute 40</td></tr><tr><td>Alderney</td><td>TOTAL, about 1 minute 40</td></tr><tr><td>London</td><td>about 97% covered</td></tr><tr><td>Edinburgh / Glasgow</td><td>about 85% covered</td></tr><tr><td>Everywhere else</td><td>somewhere in between. Look it up in the paper!</td></tr></table>
    <p>Totality in Cornwall starts at about <b>11:11</b> in the morning (British Summer Time). The whole thing, from the first nibble to the last, takes over two hours.</p>${c.past('08-11') ? '<p><b>Afterwards:</b> lots of Cornwall was cloudy, with the odd lucky gap. It still went DARK. Next time: 23 September 2090.</p>' : ''}`));
  N.def(EH, '/faq.html', c => ecPage(c, `<h2 style="color:#ffd400">Eclipse FAQ</h2>
    <p><b>Q: What IS an eclipse?</b><br>A: The Moon goes exactly between the Earth and the Sun, and its shadow lands on us. The Sun is 400 times bigger than the Moon but also about 400 times further away, so they look the same size. Handy!</p>
    <p><b>Q: Can I look at it with sunglasses?</b><br>A: <b>NO.</b> Not with sunglasses, not with three pairs of sunglasses, not through a camera, binoculars or a telescope. Proper eclipse viewers or a pinhole box ONLY.</p>
    <p><b>Q: What is the corona?</b><br>A: The Sun's outside layer, a white glow you only see when the Moon covers the bright bit. Only in the path of totality.</p>
    <p><b>Q: Will animals go funny?</b><br>A: Birds often go quiet and go to roost, because they think it's evening. Cows may go and lie down. Your cat will not care.</p>
    <p><b>Q: When was the last one?</b><br>A: The last total eclipse on the British mainland was on <b>29 June 1927</b>. Ask your great-grandad.</p>
    <p><b>Q: When is the next one?</b><br>A: <b>23 September 2090.</b> Yes really.</p>`));

  // ================================================================ EURO WATCH
  const RH = 'www.eurowatch.kidz', RU = p => 'http://' + RH + p;
  N.css('euro', `
.eu{background:#e8f0ff;color:#001a4a;font:13px/1.5 "Trebuchet MS",Verdana,sans-serif;padding-bottom:6px}
.eu a{color:#0030a0;font-weight:bold}
.eu-top{background:#0030a0;color:#ffd400;text-align:center;padding:12px 8px;border-bottom:5px solid #ffd400;position:relative}
.eu-top b{display:block;font:bold 34px/1 "Arial Black",sans-serif;letter-spacing:2px}
.eu-top svg{width:58px;height:58px;vertical-align:middle}
.eu-nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:6px;background:#c8d8ff}
.eu-nav a{background:#fff;border:2px solid #0030a0;padding:2px 10px;border-radius:12px;text-decoration:none;font-size:12px}
.eu-in{max-width:740px;margin:0 auto;padding:10px}
.eu-rate{display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:#fff;border:3px double #0030a0;padding:8px 12px;margin:8px 0}
.eu-rate svg{width:60px;height:60px;flex:none}
.eu-top svg{flex:none}
.eu-rate b.big{font:bold 30px "Arial Black",sans-serif;color:#0030a0}
.eu-news{background:#fff;border-left:6px solid #ffd400;padding:6px 10px;margin:8px 0}
.eu-news small{color:#555}
.eu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.eu-c{background:#fff;border:1px solid #9ab;padding:6px 8px}
.eu-c b{display:block;color:#0030a0}
.eu-conv{background:#fff;border:2px solid #0030a0;padding:10px;display:flex;flex-direction:column;gap:8px;max-width:440px}
.eu-conv input,.eu-conv select{font:14px Arial,sans-serif;padding:3px;min-height:28px;max-width:100%}
.eu-out{font:bold 16px "Courier New",monospace;background:#001a4a;color:#ffd400;padding:8px;min-height:40px;white-space:pre-wrap}
`);
  const STARS = '<svg viewBox="0 0 60 60" aria-hidden="true">' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, x = 30 + Math.cos(a) * 22, y = 30 + Math.sin(a) * 22; return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(.9)" d="M0-4 1.2-1.2 4-1.2 1.8.6 2.6 3.6 0 1.8-2.6 3.6-1.8.6-4-1.2-1.2-1.2z" fill="#ffd400"/>`; }).join('') + '</svg>';
  // the eleven, with their old money and the FIXED rate (how many of them make 1 euro)
  const EURO11 = [['Austria', 'schilling', 13.7603], ['Belgium', 'Belgian franc', 40.3399], ['Finland', 'markka', 5.94573], ['France', 'French franc', 6.55957], ['Germany', 'Deutschmark', 1.95583], ['Ireland', 'Irish pound (punt)', 0.787564], ['Italy', 'lira', 1936.27], ['Luxembourg', 'Luxembourg franc', 40.3399], ['Netherlands', 'guilder', 2.20371], ['Portugal', 'escudo', 200.482], ['Spain', 'peseta', 166.386]];
  // Bank of England: pounds for 1 euro on the first working day of each month of 1999 (Jan = 4 Jan, the first trading day)
  const GBP = [0.7109, 0.6892, 0.6801, 0.6737, 0.6569, 0.6506, 0.6496, 0.6606, 0.6602, 0.6464, 0.6390, 0.6309];
  const rateNow = c => (c.key === '12-31' ? 0.6218 : GBP[c.t.m - 1]);
  const pence = r => (r * 100).toFixed(1).replace(/\.0$/, '') + 'p';
  const EU_NEWS = [
    ['01-01', 'THE EURO IS HERE! From today eleven countries share one currency. For now it\'s only for banks, shops\' price labels and cheques: the real notes and coins come on <b>1 January 2002</b>. Until then everyone keeps their old money too.'],
    ['01-04', 'First day of trading! One euro started at about <b>71p</b>, or about <b>$1.18</b> in American money.'],
    ['01-05', 'Spot the new sign: <b>&euro;</b>. It\'s an E with two lines through it. Your keyboard probably hasn\'t got it. Ours hasn\'t.'],
    ['02-01', 'One month old! The euro has slipped a bit against the pound: about ' + pence(GBP[1]) + ' now. Money goes up and down. Like a yo-yo. Remember yo-yos?'],
    ['04-01', 'Not an April Fool: Britain is STILL keeping the pound for now. The grown-ups are arguing about it on the news.'],
    ['06-01', 'Summer holidays coming! If you go to France, Spain, Italy or any of the Euro Eleven, the prices may say euros AND the old money. Double the sums. Bring a calculator.'],
    ['09-01', 'Back to school. Fact for your teacher: <b>1 euro = 1936.27 Italian lire</b>. FIXED. For ever. Try THAT in your head.'],
    ['12-01', 'UK money corner: there\'s a special <b>Millennium &pound;5 coin</b> dated 1999, with the British Isles on a clock face with the hands at twelve. Grandad has bought three. They are NOT for spending, apparently.'],
    ['12-31', 'The euro\'s first year is done! It ends the year at about <b>62p</b> (it started at 71p) and about <b>$1.00</b>. Two more years till the notes and coins. See you in 2002!'],
  ];
  const EU_MATES = [
    ['01-02', 'JackK', 'Does this mean Pocket Critters cards from Germany are cheaper now? Asking for a friend (Dave).'],
    ['01-15', 'Callum', 'My PC magazine says shops have to change all their computers for it. Bet that was fun.'],
    ['03-10', 'Dave', 'If I got paid my pocket money in lira I\'d be a MILLIONAIRE. Well, nearly. Well, 9,000 lira.'],
    ['06-20', 'Jack', 'Used the converter: my pocket money is about 3 euros. In pesetas it\'s over 500!!! Moving to Spain.'],
    ['08-02', 'Luke', 'Back from France. The price stickers had francs AND euros on. I just pointed at things.'],
    ['12-05', 'Jack', 'My grandad\'s got the Millennium &pound;5 coin in a little plastic box. I\'m not allowed to touch it. Or breathe near it.'],
  ];
  const euPage = (c, body) => `<div class="eu"><div class="eu-top">${STARS}<b>EURO WATCH</b>Money news for kids &middot; by Penny (who likes coins a normal amount)</div>
    <div class="eu-nav"><a href="${RU('/')}">News</a><a href="${RU('/countries.html')}">The Euro Eleven</a><a href="${RU('/convert.html')}">Pocket Money Converter</a></div><div class="eu-in">${body}</div>${N.foot(c, 'EURO WATCH is a fan site. Not a bank. Do not post us your money.')}</div>`;
  N.def(RH, '/', c => {
    const r = rateNow(c), news = EU_NEWS.filter(n => c.past(n[0])).reverse();
    return euPage(c, `<div class="eu-rate">${STARS}<div><small>${c.t.md < 104 ? 'The euro starts trading on Monday 4 January! It launched on 1 January.' : 'One euro was worth about'}</small><br><b class="big">${c.t.md < 104 ? '&euro;1 = ???' : '&euro;1 = ' + pence(r)}</b><br><small>${c.key === '12-31' ? 'on the last day of 1999' : 'at the start of ' + N.MONTHS[c.t.m - 1]} (Bank of England figures). It started at 71p.</small></div></div>
      <h3>Euro News</h3>${news.map(n => `<div class="eu-news"><small>${N.short(n[0])}</small><br>${n[1]}</div>`).join('')}
      <p><b>Quick facts:</b> 11 countries &middot; started <b>1 January 1999</b> &middot; notes and coins on <b>1 January 2002</b> &middot; Britain is not in it (for now) &middot; the sign is &euro;.</p>` + N.mates(c, EU_MATES, 'MONEY TALK'));
  });
  N.def(RH, '/countries.html', c => euPage(c, `<h2>The Euro Eleven</h2><p>These countries started the euro on 1 January 1999. Their old money is now fixed to the euro FOR EVER, at these exact numbers (set on 31 December 1998):</p>
    <div class="eu-grid">${EURO11.map(([n, cur, x]) => `<div class="eu-c"><b>${n}</b>${cur}<br>&euro;1 = ${x} ${cur}${/lira|peseta|escudo|franc|schilling/.test(cur) ? 's' : ''}</div>`).join('')}</div>
    <p><small>Yes, the Belgian franc and the Luxembourg franc are the same. They're mates.</small></p>`));
  N.def(RH, '/convert.html', c => {
    const r = c.t.md < 104 ? GBP[0] : rateNow(c);
    c.after.push(() => {
      const f = c.q('form'), out = c.q('.eu-out');
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const gbp = parseFloat(f.amt.value), cur = EURO11[+f.cur.value];
        if (!(gbp > 0) || gbp > 1e6) { out.textContent = 'Type how many pounds. (Real pounds. Not Monopolly money.)'; return; }
        const eur = gbp / r, loc = eur * cur[2];
        out.textContent = `£${gbp.toFixed(2)} = about €${eur.toFixed(2)}\n€${eur.toFixed(2)} = ${loc.toLocaleString('en-GB', { maximumFractionDigits: cur[2] > 100 ? 0 : 2 })} ${cur[1]}${loc === 1 ? '' : 's'}\n(${cur[0]})`;
        N.sfx('dice'); N.secret('n99.euro');
      });
    });
    return euPage(c, `<h2>Pocket Money Converter</h2><p>How far does your pocket money go in the Euro Eleven? We use about <b>${pence(r)}</b> for one euro (this month's rate) and the fixed rates for the old money.</p>
      <form class="eu-conv"><label>Pounds: <input name="amt" type="number" min="0" step="0.01" value="2.50" inputmode="decimal"></label><label>Into: <select name="cur">${EURO11.map((x, i) => `<option value="${i}"${x[0] === 'Italy' ? ' selected' : ''}>${x[0]} (${x[1]})</option>`).join('')}</select></label><button class="n99-btn" type="submit">CONVERT!</button><div class="eu-out">Press CONVERT!</div></form>
      <p><small>Banks charge you a bit for changing money. We don't. We also don't give you any money.</small></p>`);
  });

  // ================================================================ DOME WATCH
  const DH = 'www.domewatch.jnet', DU = p => 'http://' + DH + p;
  N.css('dome', `
.dw{background:#fffbe6;color:#222;font:13px/1.5 Verdana,Arial,sans-serif}
.dw a{color:#a04000;font-weight:bold}
.dw-tape{height:14px;background:repeating-linear-gradient(-45deg,#ffd400 0 12px,#111 12px 24px)}
.dw-top{background:#333;color:#ffd400;text-align:center;padding:10px 8px}
.dw-top b{display:block;font:bold 32px/1 Impact,"Arial Black",sans-serif;letter-spacing:3px}
.dw-nav{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:center;padding:6px;background:#eee4c0;border-bottom:2px solid #a08000}
.dw-in{max-width:740px;margin:0 auto;padding:10px}
.dw-dome{display:block;margin:0 auto;width:100%;max-width:520px}
.dw-dome .mast{cursor:pointer}
.dw-dome .mast.hit line{stroke:#e10600}
.dw-meter{margin:8px auto;max-width:520px;background:#fff;border:2px solid #333;padding:6px 8px}
.dw-bar{height:22px;border:2px inset #aaa;background:#ddd;position:relative;overflow:hidden}
.dw-bar i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,#000080 0 12px,#c0c0c0 12px 14px)}
.dw-entry{border-bottom:1px dashed #a08000;padding:6px 0}
.dw-entry b{color:#a04000}
.dw-cd{text-align:center;font:bold 16px Verdana,sans-serif;background:#333;color:#ffd400;padding:6px;margin:8px 0}
`);
  const DW_DIARY = [
    ['01-01', 'Happy New Year! Only one year to go. The roof has been on since last summer (they "topped out" on 22 June 1998), so now it\'s the insides: the zones, the stage, the loos. Lots of loos.'],
    ['01-25', 'Drove past on the bus. It looks like a giant white hedgehog lying on its back. Mom says "a jellyfish". We are both right.'],
    ['02-20', 'Did you know a Blue Pedro time capsule is buried there? They put it in on 11 June 1998, to be opened in 2050. I\'ll be ancient.'],
    ['03-15', 'There will be <b>14 zones</b> inside, about all sorts: the body, the mind, money, playing, travel, the Earth and more.'],
    ['04-20', 'The Body Zone is a giant person you can walk through. Inside. Through the insides. I want to go and also I don\'t.'],
    ['05-14', '<b>NEW TUBE STATION!</b> North Greenwich station on the Jubilee line opened today, right next to the Dome. It is MASSIVE and very blue.'],
    ['06-22', 'One year since topping out. One more birthday cake for the builders please.'],
    ['08-11', 'Eclipse day! Did the Dome see it? It\'s a dome. It saw the sky. The sky was mostly cloud.'],
    ['09-24', 'More of the new Jubilee line opened today. Trains to the Dome are getting closer to everywhere.'],
    ['11-20', 'Even more of the Jubilee line extension is open. Nearly there!'],
    ['12-01', 'ONE MONTH TO GO. The builders are working day and night. We can see the lights from the bus.'],
    ['12-22', 'Westminster station opened today, so the whole Jubilee line extension is DONE. You can get a train from the middle of London to the Dome!'],
    ['12-31', 'TONIGHT! The Dome has its big opening night, with the Queen there and fireworks on the river. Everyone else can visit from <b>1 January</b>. Happy New Millennium (nearly)!'],
  ];
  const DW_MATES = [
    ['02-10', 'Dave', 'Can you play football in it? It\'s the biggest roof in the world probably. Penalty shoot-out.'],
    ['04-01', 'Callum', 'My dad says it\'s 365 metres across, one for every day of the year. Then he went quiet because he\'d run out of facts.'],
    ['05-15', 'Luke', 'My uncle went on the new tube to see it. He says the escalators go on FOREVER.'],
    ['07-12', 'Jack', 'Twelve masts, twelve months, twelve hours on a clock. Whoever thought of that is a genius.'],
    ['10-30', 'JackK', 'My aunt has tickets for next year. I am being nice to my aunt.'],
    ['12-31', 'Jack', 'Watching the Dome opening on the telly at Dave\'s. Dave keeps asking if it\'s bigger than his house. Yes, Dave.'],
  ];
  const domePct = c => { if (c.key === '12-31') return 100; return Math.round(62 + 37 * (c.n / 364)); };
  const domeSvg = () => `<svg class="dw-dome" viewBox="0 0 400 170" role="img" aria-label="The Dome with its twelve yellow masts. Click them!"><rect x="0" y="150" width="400" height="20" fill="#7aa0c8"/><path d="M40 150 Q200 30 360 150 Z" fill="#f4f4f4" stroke="#999"/><path d="M80 150 Q200 70 320 150 M120 150 Q200 90 280 150" fill="none" stroke="#ddd"/>${Array.from({ length: 12 }, (_, i) => { const x = 60 + i * 25.5, top = 30 + Math.abs(5.5 - i) * 8; return `<path d="M${x} ${top + 8} L200 95" stroke="#888" stroke-width=".5"/>`; }).join('')}
    ${Array.from({ length: 12 }, (_, i) => { const x = 60 + i * 25.5, top = 30 + Math.abs(5.5 - i) * 8; return `<g class="mast" data-m="${i}" tabindex="0" role="button" aria-label="Mast ${i + 1}"><rect x="${x - 7}" y="${top - 4}" width="14" height="${150 - top}" fill="transparent"/><line x1="${x}" y1="${top}" x2="${x}" y2="${Math.min(150, 150 - (150 - top) * 0.3)}" stroke="#ffd400" stroke-width="3"/></g>`; }).join('')}</svg>`;
  const dwPage = (c, body) => `<div class="dw"><div class="dw-tape"></div><div class="dw-top"><b>DOME WATCH</b>The Greenwich building diary &middot; by Derek, who goes past it on the bus twice a day</div><div class="dw-tape"></div>
    <div class="dw-nav"><a href="${DU('/')}">Dome-o-meter</a><a href="${DU('/diary.html')}">The Diary</a><a href="${DU('/facts.html')}">Dome Facts</a></div><div class="dw-in">${body}</div>${N.foot(c, 'DOME WATCH is a fan site. HARD HATS MUST BE WORN (while reading)')}</div>`;
  N.def(DH, '/', c => {
    const pct = domePct(c), last = DW_DIARY.filter(d => c.past(d[0])).slice(-2).reverse();
    c.after.push(() => {
      const hit = new Set();
      c.qa('.mast').forEach(m => { const go = () => { m.classList.add('hit'); hit.add(m.dataset.m); N.sfx('click'); const s = c.q('[data-masts]'); if (s) s.textContent = hit.size + ' of 12 masts counted'; if (hit.size === 12) { N.secret('n99.dome'); N.sfx('solve'); } }; m.addEventListener('click', go); m.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }); });
    });
    return dwPage(c, domeSvg() + `<p style="text-align:center;margin:2px 0" data-masts>Count the masts! (Click each yellow one.)</p>
      <div class="dw-meter"><b>DOME-O-METER</b> (how finished it looks from the bus: our guess, not official!)<div class="dw-bar"><i style="width:${pct}%"></i></div><b>${pct}%</b> ${pct >= 100 ? 'FINISHED!!!' : pct > 95 ? 'nearly there!' : pct > 80 ? 'getting there' : 'lots of men in hard hats'}</div>
      <div class="dw-cd">${c.key === '12-31' ? 'OPENING NIGHT IS TONIGHT!!!' : N.countdown(c, '12-31', 'the Dome\'s opening night')}</div>
      <h3>Latest from the diary</h3>${last.map(d => `<div class="dw-entry"><b>${N.short(d[0])}</b> ${d[1]}</div>`).join('')}<p><a href="${DU('/diary.html')}">Read the whole diary &raquo;</a></p>` + N.mates(c, DW_MATES, 'COMMENTS'));
  });
  N.def(DH, '/diary.html', c => dwPage(c, `<h2>The Diary</h2>${DW_DIARY.filter(d => c.past(d[0])).reverse().map(d => `<div class="dw-entry"><b>${N.short(d[0])}</b> ${d[1]}</div>`).join('')}`));
  N.def(DH, '/facts.html', c => dwPage(c, `<h2>Dome Facts</h2><ul>
    <li>It is <b>365 metres</b> across: one metre for every day of the year.</li><li>It has <b>12 yellow masts</b>, each about <b>100 metres</b> tall: one for every month (or every hour on a clock).</li>
    <li>It's about <b>50 metres</b> high in the middle. You could fit a LOT of double-decker buses in it. We tried to work out how many. We gave up.</li>
    <li>It sits by the river Thames at Greenwich, where the Prime Meridian is: the line that time is measured from (Greenwich Mean Time!).</li>
    <li>The roof is a giant fabric tent held up by cables. It was "topped out" on <b>22 June 1998</b>.</li><li>Inside there are <b>14 zones</b>, including the Body Zone, a giant figure you can walk through.</li>
    <li>A <b>Blue Pedro</b> time capsule is buried there (since 11 June 1998), to be dug up in 2050.</li><li>It has its own new tube station: <b>North Greenwich</b>, on the Jubilee line (opened 14 May 1999).</li>
    <li>Opening night: <b>31 December 1999</b>. Open to everyone from <b>1 January 2000</b>.</li></ul>`));

  // ================================================================ CRAZE WATCH (the playground hot-or-not list)
  const CH = 'www.crazewatch.kidz', CU = p => 'http://' + CH + p;
  N.css('craze', `
.cw{background:#1e4a2e;color:#f4f4e8;font:14px/1.5 "Comic Sans MS","Chalkboard SE",cursive,sans-serif;padding-bottom:6px;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:6px 6px}
.cw a{color:#ffe680}
.cw-top{text-align:center;padding:12px 8px 6px;border-bottom:8px solid #8a5a2a}
.cw-top b{display:block;font:bold 36px/1.05 "Comic Sans MS",cursive,sans-serif;color:#fff;letter-spacing:2px;text-shadow:2px 2px 0 rgba(0,0,0,.4)}
.cw-nav{display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;padding:6px}
.cw-in{max-width:720px;margin:0 auto;padding:8px 12px}
.cw-row{display:flex;gap:10px;align-items:center;padding:6px 4px;border-bottom:1px dashed rgba(255,255,255,.3);flex-wrap:wrap}
.cw-row .nm{flex:1 1 180px;min-width:0}
.cw-row .nm small{display:block;opacity:.8;font-size:12px}
.cw-heat{flex:none;font:bold 13px Verdana,sans-serif;white-space:nowrap}
.cw-heat i{display:inline-block;width:12px;height:16px;margin-right:1px;background:#ff8a00;clip-path:polygon(50% 0,100% 60%,80% 100%,20% 100%,0 60%);vertical-align:middle}
.cw-heat i.off{background:rgba(255,255,255,.18)}
.cw-up{color:#8f8}.cw-dn{color:#f99}
.cw-cold{opacity:.75}
.cw-tag{font:bold 10px Verdana,sans-serif;background:#8a5a2a;color:#fff;padding:0 4px;border-radius:3px;vertical-align:middle}
.cw-vote{display:flex;gap:6px;flex:none}
.cw-vote button{min-width:64px;min-height:30px;font:bold 12px "Comic Sans MS",cursive;border:2px solid #fff;border-radius:14px;background:transparent;color:#fff;cursor:pointer}
.cw-vote button.on.h{background:#e8501a}.cw-vote button.on.n{background:#3a7ad8}
`);
  // [id, name, note, [[MM-DD, heat 0-5], ...], from 1998?]
  const CRAZES = [
    ['tama', 'Eggberts', 'Came out here on 8 May 1997. Everybody\'s has died by now. RIP.', [['01-01', 1], ['02-01', 0]], 1],
    ['yoyo', 'Yo-yos', 'Last year\'s big one. Walk the Dog, Around the World, banned in the staff room.', [['01-01', 4], ['02-15', 3], ['03-03', 1], ['04-15', 0]], 1],
    ['furby', 'Furbos', 'Christmas 1998\'s must-have (&pound;29.99). Speaks Furbosh. Never sleeps.', [['01-01', 5], ['02-01', 4], ['03-15', 2], ['05-01', 1], ['12-31', 1]], 1],
    ['robot', 'Robo Rumble', 'BBQ Two. Everyone has a favourite house robot.', [['01-01', 4], ['03-05', 5], ['03-25', 3], ['11-20', 3], ['12-03', 5], ['12-31', 5]], 1],
    ['final', '"Is that your last answer?"', 'The quiz show catchphrase. Even teachers say it. 19.2 million people watched on 7 March!', [['01-01', 3], ['03-07', 5], ['06-01', 4], ['12-31', 4]], 1],
    ['beanie', 'Beany Bobbles', 'Collect them, keep the tag on, never play with them. Then on 31 August the makers said they\'d stop making them at the end of 1999!', [['01-01', 3], ['06-01', 2], ['08-30', 2], ['08-31', 4], ['10-15', 3], ['12-31', 4]]],
    ['britney', 'The Brittany dance', '...Baby Two More Times was number one for two weeks. School-corridor choreography.', [['02-14', 2], ['02-21', 5], ['04-01', 3], ['05-15', 1], ['07-01', 0]]],
    ['flat', 'Flat Derek impressions', 'The yellow puppet from the jeans advert, nodding to Flat Feet (number one!).', [['03-20', 2], ['03-28', 5], ['04-25', 3], ['06-01', 0]]],
    ['pokeTV', 'The Pocket Critters cartoon', 'On Sky Won since 29 March. If you haven\'t got Sky, you go round to someone who has.', [['03-28', 0], ['03-29', 3], ['06-01', 4], ['10-05', 5], ['12-31', 5]]],
    ['bob', 'Rob the Builder', 'Started on the BBQ on 12 April. For little brothers and sisters. (CAN WE FIX IT?)', [['04-11', 0], ['04-12', 2], ['07-01', 3], ['12-31', 4]]],
    ['ep1', 'Episode I toys', 'Dark Mole is worth three Qui-Gons in a swap.', [['05-01', 2], ['05-10', 5], ['08-15', 4], ['09-30', 2], ['12-31', 2]]],
    ['saber', 'lightspatula duels', 'Wrapping-paper tubes, after you\'ve seen The Phantom Nuisance (out here 16 July).', [['07-15', 0], ['07-16', 5], ['09-01', 3], ['10-20', 1], ['11-30', 0]]],
    ['glasses', 'Eclipse glasses', 'For 11 August. DON\'T LOOK AT THE SUN.', [['07-10', 1], ['08-01', 4], ['08-11', 5], ['08-14', 1], ['08-31', 0]]],
    ['mambo', 'Bongo No. 5', 'Number one at the end of August. Every grown-up at every barbecue.', [['08-28', 0], ['08-29', 5], ['10-10', 3], ['11-30', 1]]],
    ['tween', 'Tweenettes', 'New on BBQ Two from 6 September. Little cousins LOVE it.', [['09-05', 0], ['09-06', 2], ['12-31', 3]]],
    ['blue', 'Singing "Green (Da Ba Doo)"', 'Number one for three weeks from late September. The music teacher has had enough.', [['09-15', 2], ['09-19', 5], ['10-31', 4], ['11-30', 2]]],
    ['pokeGB', 'Pocket Critters Moss &amp; Puddle', 'Out here on 5 October. Link cables at lunch.', [['09-01', 2], ['10-04', 4], ['10-05', 5], ['12-31', 5]]],
    ['cards', 'Pocket Critters cards', 'Holos are currency. Chargrillizard is a legend. Some schools have banned them.', [['01-01', 0], ['03-15', 1], ['06-01', 2], ['09-01', 3], ['11-01', 5], ['12-31', 5]]],
    ['dc', 'The Daydream', 'Out here on 14 October. It has a MODEM in it.', [['09-09', 2], ['10-13', 3], ['10-14', 4], ['12-31', 4]]],
  ];
  const heatAt = (cr, n) => {
    const pts = cr[3].map(([k, v]) => [N.dayNo(k), v]); if (n < pts[0][0]) return cr[4] ? pts[0][1] : 0;
    for (let i = 0; i < pts.length - 1; i++) if (n >= pts[i][0] && n <= pts[i + 1][0]) { const f = pts[i + 1][0] === pts[i][0] ? 1 : (n - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f; }
    return pts[pts.length - 1][1];
  };
  const flames = h => Array.from({ length: 5 }, (_, i) => `<i class="${i < Math.round(h) ? '' : 'off'}"></i>`).join('');
  const cwPage = (c, body) => `<div class="cw"><div class="cw-top"><b>CRAZE WATCH</b>What's hot in the playground &middot; by the Playground Panel (Year 9, mostly)</div>
    <div class="cw-nav"><a href="${CU('/')}">Hot or Not</a><a href="${CU('/vote.html')}">Vote!</a><a href="${CU('/history.html')}">Craze History</a></div><div class="cw-in">${body}</div>${N.foot(c, 'CRAZE WATCH. If your teacher bans it, it was probably good.')}</div>`;
  const CW_MATES = [
    ['01-11', 'Luke', 'Yo-yos are still hot in our school. Well, warm. Well, Liam still has one.'],
    ['02-22', 'JackK', 'Half our class did the Brittany dance in the dinner queue. Dave did it too. DAVE.'],
    ['04-02', 'Dave', 'Pocket Critters cartoon is the BEST. Ash is rubbish at catching though.'],
    ['05-12', 'Callum', 'Swapped my Jar Jar Jams for a Dark Mole. The kid who did that deal will regret it for ever.'],
    ['07-20', 'Jack', 'lightspatula duel at the park with wrapping-paper tubes. I lost (my tube folded).'],
    ['09-01', 'Luke', 'My cousin heard about the Beany Bobbles stopping and bought eleven in one day.'],
    ['10-06', 'Dave', 'Moss version. Charbroiler. Already naming him. He\'s called DAVE.'],
    ['11-05', 'Jack', 'Our school banned Pocket Critters cards at break. Now we swap them at the bus stop instead.'],
    ['12-14', 'Callum', 'Is the Daydream a craze if only one person in our year has got one? (It\'s me. Come round.)'],
  ];
  N.def(CH, '/', c => {
    const rows = CRAZES.map(cr => ({ cr, h: heatAt(cr, c.n), w: heatAt(cr, c.n - 7) }));
    const hot = rows.filter(r => r.h >= 0.5).sort((a, b) => b.h - a.h);
    const cold = rows.filter(r => r.h < 0.5 && r.w >= 0.5 || (r.h < 0.5 && r.cr[3].some(([k, v]) => v > 0 && c.until(k) <= 0 && c.until(k) > -45)));
    const fresh = r => { const first = r.cr[3].find(p => p[1] > 0); return !r.cr[4] && first && c.until(first[0]) <= 0 && c.until(first[0]) > -14; };
    return cwPage(c, `<p style="text-align:center"><b>THE HOT LIST for ${c.long}</b></p>${hot.map(r => `<div class="cw-row"><div class="nm"><b>${r.cr[1]}</b> ${r.cr[4] && c.t.md < 401 ? '<span class="cw-tag">1998</span>' : ''}${fresh(r) ? ' <span class="n99-new">NEW!</span>' : ''}<small>${r.cr[2]}</small></div><span class="cw-heat">${flames(r.h)} ${r.h - r.w > 0.2 ? '<span class="cw-up">&#9650; hotter</span>' : r.w - r.h > 0.2 ? '<span class="cw-dn">&#9660; cooling</span>' : ''}</span></div>`).join('')}
      ${cold.length ? `<h3>GONE COLD</h3>${cold.map(r => `<div class="cw-row cw-cold"><div class="nm"><b>${r.cr[1]}</b><small>${r.cr[2]}</small></div><span class="cw-heat">&#10052; NOT</span></div>`).join('')}` : ''}` + N.mates(c, CW_MATES, 'THE PANEL SAYS'));
  });
  N.def(CH, '/vote.html', c => {
    const live = CRAZES.filter(cr => heatAt(cr, c.n) >= 0.5), V = store.get('jhp_n99_crazes', {});
    c.after.push(() => c.qa('.cw-vote button').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id, v = store.get('jhp_n99_crazes', {}); v[id] = b.dataset.v; store.set('jhp_n99_crazes', v); N.sfx('click');
      b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      if (live.every(cr => v[cr[0]])) N.secret('n99.craze');
    })));
    return cwPage(c, `<h2>HOT or NOT? You decide!</h2><p>Vote on every craze going this week. (Votes are kept on YOUR computer. The Panel can't see them. The Panel is sad about this.)</p>${live.map(cr => `<div class="cw-row"><div class="nm"><b>${cr[1]}</b></div><span class="cw-vote"><button type="button" class="h${V[cr[0]] === 'h' ? ' on' : ''}" data-id="${cr[0]}" data-v="h">HOT</button><button type="button" class="n${V[cr[0]] === 'n' ? ' on' : ''}" data-id="${cr[0]}" data-v="n">NOT</button></span></div>`).join('')}`);
  });
  N.def(CH, '/history.html', c => {
    const seen = CRAZES.filter(cr => cr[4] || cr[3].some(([k, v]) => v > 0 && c.past(k)));
    return cwPage(c, `<h2>Craze History</h2><p>Every craze the Panel has tracked so far, and how hot it got.</p>${seen.map(cr => { const peak = Math.max(...cr[3].filter(([k]) => c.past(k) || cr[4]).map(p => p[1]), 0); return `<div class="cw-row"><div class="nm"><b>${cr[1]}</b>${cr[4] ? ' <span class="cw-tag">from 1998</span>' : ''}<small>${cr[2]}</small></div><span class="cw-heat">peak: ${flames(peak)}</span></div>`; }).join('')}`);
  });
})();

/* web-p5: more 1999 sites. A start page with horoscopes, the Homepagez neighbourhoods and their residents, Cool Site
 * of the Day, an e-zine, e-cards between visitors, free web tools, chat rooms, a get-rich-quick page (it's a paper round),
 * the Custard Files, pixel-pet adoption, a Flash intro site, a "you have won" page and the Galaxy Ring. All original. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile, M = W.M, A = window.Apps, store = A.store;
  const dayN = c => c.t99.m * 31 + c.t99.d;
  const I3 = id => Cast.first(id).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); // arcade initials for one of the visitor's cast (js/cast.js)
  const seeded = (n, k) => { let x = (n * 9301 + k * 49297) % 233280; return x / 233280; };

  // ================================================================ LookHere! start page
  const SIGNS = [['Aries', '21 Mar - 19 Apr'], ['Taurus', '20 Apr - 20 May'], ['Gemini', '21 May - 20 Jun'], ['Cancer', '21 Jun - 22 Jul'], ['Leo', '23 Jul - 22 Aug'], ['Virgo', '23 Aug - 22 Sep'], ['Libra', '23 Sep - 22 Oct'], ['Scorpio', '23 Oct - 21 Nov'], ['Sagittarius', '22 Nov - 21 Dec'], ['Capricorn', '22 Dec - 19 Jan'], ['Aquarius', '20 Jan - 18 Feb'], ['Pisces', '19 Feb - 20 Mar']];
  const HA = ['A surprise is heading your way', 'Someone at school will say something nice to you', 'Today is a good day to tidy your room (the stars are sorry)', 'An old friend will get back in touch', 'You will find something you lost', 'Your patience will be tested by a slow modem', 'A big decision is coming. Choose the custard', 'Good luck is on your side, especially before lunch', 'Somebody is thinking about you (it might be Dave)', 'Now is the time to start that project you keep talking about'];
  const HB = ['involving a floppy disk', 'near the biscuit tin', 'on the bus home', 'in the last ten minutes of a lesson', 'while the kettle boils', 'during a game of something', 'in an e-mail', 'from behind the sofa', 'just as the page finishes loading', 'when you least expect it'];
  const HC = ['Lucky number: ', 'Lucky colour: ', 'Lucky snack: ', 'Avoid: '];
  const HD = [['7', '13', '42', '99', '3', '56'], ['purple', 'Zapachu yellow', 'teal', 'beige (sorry)', 'glitter'], ['a custard cream', 'crisps', 'a satsuma', 'toast'], ['Mondays', 'puddles', 'the letter Q', 'cheese after 9pm', 'people who say "the Internet is a fad"']];
  const horo = (c, i) => { const n = dayN(c); const r = k => Math.floor(seeded(n + i * 7, k) * 1000); const ci = r(3) % 4; return `${HA[r(1) % HA.length]} ${HB[r(2) % HB.length]}. ${HC[ci]}${HD[ci][r(4) % HD[ci].length]}.`; };
  const TV = [['7:00', 'Wake Up Squad', 'Cartoons, a puppet and someone shouting'], ['9:00', 'Saturday Smash', 'Bands, games and gunge'], ['12:00', 'Grandstand-ish', 'Sport. Nan likes the snooker'], ['16:30', 'Robot Showdown', 'Robots made by dads fight in a cage'], ['17:30', 'Quiz of the Day', 'Answer questions. Win a dictionary'], ['18:30', 'The News', 'Grown-up stuff'], ['19:00', 'Space Squad 7', 'Episode 12: The Planet of Custard'], ['20:00', 'Holiday Programme', 'Somebody goes somewhere hot'], ['21:00', 'Film: The Big Robot', 'Mom says it\'s past your bedtime']];
  W.def('lookhere', {
    css: `.wp-lookhere{background:#fff;color:#000;font:13px/1.4 Verdana,Arial,sans-serif}
.wp-lookhere .lh-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:4px solid #c00;padding-bottom:6px;margin-bottom:8px}
.wp-lookhere .lh-logo{font:bold italic 32px Georgia,serif;color:#c00}.wp-lookhere .lh-logo span{color:#000080}
.wp-lookhere .lh-nav{background:#000080;color:#fff;padding:3px 8px;font-size:12px;margin-bottom:8px}.wp-lookhere .lh-nav a{color:#ff0}
.wp-lookhere table.lh-grid{width:100%;border-collapse:separate;border-spacing:6px}
.wp-lookhere .lh-grid td{vertical-align:top;border:1px solid #999;padding:0}
.wp-lookhere .lh-grid h3{background:#c00;color:#fff;font:bold 12px Verdana,sans-serif;margin:0;padding:3px 6px}
.wp-lookhere .lh-grid .in{padding:6px}
.wp-lookhere .lh-sign{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:4px}
.wp-lookhere .lh-sign a{display:block;border:1px solid #ccc;padding:3px;text-align:center}
.wp-lookhere .lh-h{border:1px solid #c00;padding:6px 10px;margin:8px 0}
.wp-lookhere .lh-tv td,.wp-lookhere .lh-tv th{border:1px solid #999;padding:3px 6px;text-align:left}
@media (max-width:600px){.wp-lookhere .lh-grid,.wp-lookhere .lh-grid tbody,.wp-lookhere .lh-grid tr,.wp-lookhere .lh-grid td{display:block;width:auto!important}.wp-lookhere .lh-grid td{margin-bottom:6px}}`,
    html: c => {
      const wx = W.weather ? W.weather(c.t99) : null;
      return `${c.status('Welcome to LookHere! *** Make LookHere! your home page today! *** Horoscopes updated daily *** Have a nice day!')}
<div class="lh-top"><span class="lh-logo">Look<span>Here!</span></span>${c.gif('globe', 36)}<form class="lh-s" style="margin-left:auto;display:flex;gap:4px"><input type="text" placeholder="Search the web" aria-label="Search" style="width:180px;max-width:50vw"><button class="btn" type="submit">Search</button></form></div>
<div class="lh-nav">${c.a('lookhere', 'Home')} | ${c.s('horoscopes.html', 'Horoscopes')} | ${c.s('tv.html', 'Telly')} | ${c.s('news.html', 'News')} | ${c.a('weather', 'Weather')} | ${c.a('jackmail', 'Free E-mail')} | ${c.a('chatterbox', 'Chat')} | ${c.a('ecardz', 'E-cards')} | ${c.a('hoods', 'Free Homepages')}</div>
${c.ad(10)}
<table class="lh-grid"><tr><td style="width:62%"><h3>TODAY'S TOP STORIES ${c.newb()}</h3><div class="in"><b>${c.a('ezine', 'BYTESIZE e-zine issue 7 is out')}</b> - with an exclusive interview with Gubbinz.<br><br><b>${c.a('csotd', "Today's Cool Site of the Day")}</b> - picked by hand, as always.<br><br><b>${c.a('hamstercam', 'Hamster still running')}</b> - ${Cast.n('hamster')} enters day 400.<br><br><b>${c.a('custard', 'What is in the custard?')}</b> - one website says it knows.<br><br>${c.s('news.html', 'More news &raquo;')}</div></td>
<td><h3>WEATHER</h3><div class="in">${wx ? `<b style="font-size:20px">${wx[0].icon}</b> ${wx[0].desc}, ${wx[0].hi}&deg;C<br>Tomorrow: ${wx[1].icon} ${wx[1].desc}` : ''}<br>${c.a('weather', 'Full forecast')}</div><h3>YOUR STARS</h3><div class="in">${c.s('horoscopes.html', 'Read today\'s horoscopes')} ${c.gif('star', 12)}</div></td></tr>
<tr><td><h3>ON THE TELLY TONIGHT</h3><div class="in">${TV.slice(6, 9).map(t => `<b>${t[0]}</b> ${esc(t[1])}<br>`).join('')}${c.s('tv.html', 'Full listings &raquo;')}</div></td><td><h3>COOL LINKS</h3><div class="in">${['~kim', 'podracing', 'hz-goldie', 'freetoolz', 'adopt', 'megaflash'].map(w => '&#183; ' + c.a(w)).join('<br>')}</div></td></tr>
<tr><td colspan="2"><h3>TIME AND DATE</h3><div class="in c">${c.applet('clock', 300, 60)}</div></td></tr></table>
<p class="c small">Make LookHere! your home page: Tools &gt; Internet Options &gt; Use Current. (Then it's the first thing you see. Every. Time.)</p>
<p class="c small">Visitors today: ${c.counter('plain')} &middot; &copy;1999 LookHere! Ltd (a boy and a modem)</p>`;
    },
    setup(el) { el.querySelector('.lh-s').addEventListener('submit', ev => { ev.preventDefault(); W.pendingQuery = el.querySelector('.lh-s input').value; W.open('search'); }); },
  });
  W.sub('lookhere', {
    'horoscopes.html': { html: c => `<h2 style="font:bold 24px Georgia,serif;color:#c00">${c.gif('star', 24)} Today's Horoscopes</h2><p>Written in the stars (and by a computer) for ${c.today}. Click your sign!</p><div class="lh-sign">${SIGNS.map((s, i) => `<a href="#" data-sg="${i}"><b>${s[0]}</b><br><span class="small">${s[1]}</span></a>`).join('')}</div><div class="lh-h"><b class="hs">Pick your star sign above.</b><p class="ht"></p></div><p class="small">Horoscopes are just for fun. The stars do not know about your maths test.</p>${c.ad(14)}`,
      setup(el, c) { el.querySelectorAll('[data-sg]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const i = +a.dataset.sg; el.querySelector('.hs').textContent = SIGNS[i][0] + ' (' + SIGNS[i][1] + ')'; el.querySelector('.ht').textContent = horo(c, i); Sound.play('pet'); c.secret('web.horoscope'); })); } },
    'tv.html': c => `<h2 style="font:bold 24px Georgia,serif;color:#c00">On the Telly Today</h2><p>All channels, all day (well, the good bits). ${c.today}.</p><table class="lh-tv" style="width:100%;border-collapse:collapse"><tr><th>Time</th><th>Programme</th><th>What happens</th></tr>${TV.map(t => `<tr><td>${t[0]}</td><td><b>${esc(t[1])}</b></td><td>${esc(t[2])}</td></tr>`).join('')}</table><p class="small">Set the video! (Ask Dad. Only Dad knows how.)</p>`,
    'news.html': c => `<h2 style="font:bold 24px Georgia,serif;color:#c00">News</h2>${c.ticker(['Local boy builds website in Notepad', 'Hamster cam passes 400 days', 'Dave denies the duel was "not a draw"', 'Millennium Bug: experts still not sure', 'School printer jams for 3rd time'])}<p><b>MILLENNIUM COUNTDOWN CONTINUES</b> - The year 2000 is getting closer. Some people are building bunkers. Some people are buying party poppers. One website (${c.a('~gaz', Cast.n('kidY2k') + '\'s')}) is doing both.</p><p><b>NEW FREE WEB SPACE</b> - ${c.a('hoods', 'Homepagez')} has opened new neighbourhoods. SpaceCity is "nearly full".</p><p><b>E-CARDS ARE THE NEW LETTERS</b> - why spend a stamp when ${c.a('ecardz', 'eCardz')} will send a dancing birthday cake for free?</p>${c.ad(0)}`,
  });

  // ================================================================ Homepagez neighbourhoods + residents
  const HOODS = {
    SpaceCity: ['rocket', '#000033', '#cfe', 'For homepages about space, science and the future (which is 2000).', { Launchpad: [[4021, 'hz-rory'], [4022, 'dead', 'Moonbase Mike'], [4023, 'rent'], [4030, 'uc', 'Starchild99']], Nebula: [[1999, 'w:~ash', Cast.t("{club2}'s Space Page (moved out, lives on {club2.his} own domain now)")], [2001, 'dead', 'HAL Fan Page'], [2010, 'rent']], Orbit: [[7, 'w:~zed', Cast.t("{club1}'s Sci-Fi (visits on Saturdays)")], [8, 'uc', 'Rocket Boy'], [12, 'dead', 'The Moon Is Cheese (official)']] }],
    Arcadia: ['joystick', '#200030', '#fcf', 'For games, cheats, high scores and the people who play them.', { Joystick: [[2210, 'hz-hiscore'], [2211, 'dead', 'Cheatz R Us'], [2212, 'uc', 'GameBoy Gary']], Pixel: [[3112, 'hz-priya'], [3113, 'rent'], [3120, 'dead', 'Sprite Club']], Cartridge: [[64, 'dead', 'Blow On It (cartridge repair tips)'], [65, 'w:top100cheats', 'Top 100 Cheats (moved to a better neighbourhood)'], [66, 'rent']] }],
    Grotville: ['blob', '#2a3a1a', '#cf9', 'For monsters, aliens, slime, War Hamster, mud and anyone who likes the colour green.', { Mudpit: [[1234, 'hz-snotlin'], [1235, 'uc', 'The Big Mud'], [1236, 'dead', "Slime Time (gunge recipes)"]], Fungus: [[4040, 'hz-fungus'], [4041, 'rent']], Teefstreet: [[1, 'w:teef', 'Gem Exchange (shop)'], [2, 'w:poetree', "Gubbinz's poems (lives in the members bit)"], [3, 'dead', 'WAAAGH (just the word)']] }],
    Tunesville: ['guitar', '#300a00', '#fd9', 'For bands, fans, MIDIs and people learning the recorder (sorry, neighbours).', { Bassline: [[8080, 'hz-fluffy'], [8081, 'dead', 'Boyz On Bikes Fan Club'], [8082, 'uc', 'Kandi K Shrine']], Recorder: [[1212, 'hz-recorder'], [1213, 'rent']], Encore: [[99, 'w:~stu', 'The Mouldy Tangerines (too loud for this street)'], [100, 'w:midi', 'MIDI Heaven']] }],
    PetPark: ['dog', '#1a3a10', '#efc', 'For pets: real ones, pretend ones, and ones that are rocks.', { Goldfish: [[101, 'hz-goldie'], [102, 'rent'], [103, 'dead', 'Bubbles Forever']], Tortoise: [[7070, 'hz-sheldon'], [7071, 'uc', 'Speedy (ironic name)']], Kennel: [[1, 'w:~biscuit', "Biscuit's Homepage"], [2, 'w:~kevin', 'The Pet Rock Page'], [3, 'w:hamstercam', 'Hamster Cam'], [4, 'dead', "Mr Tiddles' Official Page (cats can't type)"]] }],
  };
  const HZ = 'www.homepagez.webcom';
  W.def('hoods', {
    css: `.wp-hoods{background:#fff8e8;color:#000;font:14px/1.45 "Times New Roman",serif}
.wp-hoods .hz-h1{font:bold 30px "Arial Black",Arial,sans-serif;color:#ff6a00;text-align:center;-webkit-text-stroke:1px #000;margin:4px 0}
.wp-hoods table.hz-t{width:100%;border-collapse:separate;border-spacing:6px}
.wp-hoods .hz-t td{border:2px solid #000;padding:8px;vertical-align:top}
.wp-hoods .hz-st{margin:10px 0;border:2px solid currentColor;padding:6px 10px}
.wp-hoods .hz-st h3{margin:0 0 4px}
.wp-hoods .hz-rent{color:#080;font-weight:bold}.wp-hoods .hz-uc{color:#a60}
.wp-hoods.hood-dark{color:var(--hf)}
@media (max-width:600px){.wp-hoods .hz-in{margin:-12px -10px 0!important}}`,
    html: c => `<h1 class="hz-h1">HOMEPAGEZ NEIGHBOURHOODS</h1><p class="c">${c.rainbow('FREE WEB SPACE FOR EVERYONE!!!')} Pick a neighbourhood, pick a street, move in! Your address will be like <tt>http://www.homepagez.webcom/SpaceCity/Launchpad/4021/</tt> (Tell your Nan. She'll never remember it.)</p>
<table class="hz-t">${Object.keys(HOODS).map(h => { const H = HOODS[h]; const n = Object.values(H[4]).reduce((s, l) => s + l.length, 0); return `<tr><td style="background:${H[1]};color:${H[2]};width:56px" class="c">${c.spr(H[0], 4)}</td><td><b style="font-size:18px">${c.s(h + '/', h)}</b> ${h === 'SpaceCity' ? c.hot() : ''}<br>${esc(H[3])}<br><span class="small">${n} homes on ${Object.keys(H[4]).length} streets</span></td></tr>`; }).join('')}</table>
<p class="c">Old-style addresses (with a ~ squiggle) still live at ${c.a('homepagez', 'members.homepagez.webcom')}.</p>${c.ad(9)}<p class="c small">Residents: ${c.counter('odo')}</p>`,
  });
  const hoodSub = h => ({ html: c => { const H = HOODS[h]; return `<div class="hz-in" style="background:${H[1]};color:${H[2]};margin:-18px -18px 0;padding:14px 18px;min-height:560px"><h1 style="font:bold 30px 'Arial Black',sans-serif;margin:0 0 4px">${c.spr(H[0], 4)} ${h}</h1><p>${esc(H[3])}</p>${Object.keys(H[4]).map(st => `<div class="hz-st"><h3>${esc(st)} Street</h3><table class="hz-t" style="color:inherit">${H[4][st].map(([no, kind, name]) => { const url = `${HZ}/${h}/${st}/${no}/`; let what; if (kind === 'rent') what = '<span class="hz-rent">FOR RENT! Move in today. 1 MB, all yours.</span>'; else if (kind === 'uc') what = `<span class="hz-uc">${esc(name)} - UNDER CONSTRUCTION</span> ${c.dead(url, '(visit)')}`; else if (kind === 'dead') what = `${c.dead(url, esc(name))} <span class="small">(moved?)</span>`; else if (kind.startsWith('w:')) what = c.a(kind.slice(2), esc(name)); else what = `${c.a(kind)} ${c.newb()}`; return `<tr><td style="width:60px;border-color:currentColor"><b>#${no}</b></td><td style="border-color:currentColor">${what}</td></tr>`; }).join('')}</table></div>`).join('')}<p class="c">${c.a('hoods', '&laquo; Back to all neighbourhoods')}</p><p class="c small">Neighbourhood visitors: ${c.counter('plain')}</p></div>`; } });
  W.sub('hoods', Object.fromEntries(Object.keys(HOODS).map(h => [h + '/', hoodSub(h)])));

  // ---- residents
  W.def('hz-rory', {
    css: `.wp-hz-rory{background:#001 ${tile('<circle cx="5" cy="8" r=".8" fill="#fff"/><circle cx="30" cy="22" r=".6" fill="#ccf"/>', 40)};color:#fff;font:14px/1.45 Arial,sans-serif}
.wp-hz-rory h1{font:bold 30px Impact,sans-serif;color:#f80;text-align:center;letter-spacing:2px;margin:4px 0}
.wp-hz-rory .rr-pad{position:relative;height:220px;max-width:300px;margin:10px auto;background:linear-gradient(#000 0,#013 70%,#3a3 70%);border:3px ridge #888;overflow:hidden}
.wp-hz-rory .rr-rk{position:absolute;left:calc(50% - 18px);bottom:56px;transition:bottom 2.2s cubic-bezier(.3,.9,.6,1)}
.wp-hz-rory .rr-n{font:bold 34px "Courier New",monospace;color:#0f0;text-align:center;min-height:40px}
.wp-hz-rory .rr-box{border:1px solid #f80;padding:8px 12px;margin:10px auto;max-width:600px}
.wp-hz-rory table{width:100%}.wp-hz-rory td,.wp-hz-rory th{border:1px solid #555;padding:3px 6px;text-align:left}
.wp-hz-rory a{color:#ff0}.wp-hz-rory a.wvis{color:#f9f}`,
    html: c => `<h1>ROCKET RORY'S LAUNCH PAD</h1><p class="c">${c.gif('star', 16)} SpaceCity, Launchpad Street, house 4021 ${c.gif('star', 16)}</p>
<div class="rr-box"><p>I build <b>water rockets</b> with my Dad out of old pop bottles. You fill them a third full of water, pump air in with a bike pump, and WHOOSH. Our record is "higher than the house". Dad says over 30 metres. I say a mile. We agree on "very high".</p><p><b>SAFETY:</b> Always with a grown-up. Always outside, on a field, away from people, cats, jackos and Nan's greenhouse. Never stand over it. Wear old clothes: YOU WILL GET WET.</p></div>
<div class="rr-n">READY</div><div class="rr-pad">${'<span class="rr-rk">' + c.spr('rocket', 3) + '</span>'}</div><p class="c"><button class="btn rr-go" type="button">START COUNTDOWN</button></p>
<p class="c">${c.applet('stars', 300, 80)}</p>
<p class="c">${c.s('launches.html', 'See the LAUNCH LOG &raquo;')}</p>${c.counterLine('Mission control has been visited', 'led')}${c.ring()}`,
    setup(el) { const rk = el.querySelector('.rr-rk'), n = el.querySelector('.rr-n'), b = el.querySelector('.rr-go'); b.addEventListener('click', () => { b.disabled = true; let k = 5; n.textContent = k; const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); k--; Sound.play('beep'); if (k > 0) n.textContent = k; else { clearInterval(t); n.textContent = 'LIFT OFF!!!'; Sound.play('zap'); rk.style.bottom = '260px'; setTimeout(() => { if (!el.isConnected) return; rk.style.transition = 'none'; rk.style.bottom = '56px'; void rk.offsetWidth; rk.style.transition = ''; n.textContent = 'SPLASH! (Dad is soaked)'; b.disabled = false; }, 2600); } }, 800); }); },
  });
  W.sub('hz-rory', { 'launches.html': c => `<h2>LAUNCH LOG</h2><table><tr><th>#</th><th>Rocket</th><th>Height</th><th>Notes</th></tr>${[['Bottle 1', 'about 2 m', 'Too much water. It just sort of fell over.'], ['Bottle 1 (again)', '15 m', 'Better! Landed in next door\'s hedge.'], ['The Red Arrow', '25 m', 'Added fins from a cereal box. Went straight up!'], ['The Red Arrow II', '30+ m', 'HIGHER THAN THE HOUSE. Dad cheered. Dad got wet.'], ['Two-Bottle Monster', '???', 'Taped two bottles together. Exploded on the pad. Everyone got wet.'], ['Parachute Test', '20 m', 'Parachute made from a carrier bag. It worked!!! Floated down slowly. Best launch ever.']].map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table><div class="c">${c.photo('#69f #3a3; house 30 13; bottlerocket 15 0; kid 3 22 bare', 'Launch 4: higher than the house')}${c.photo('#9cf #3a3; kid 30 22 flip bare swap=bn; splash 30 16; text 4 8 SPLASH!', 'Dad, after launch 5')}</div>` });

  W.def('hz-hiscore', {
    css: `.wp-hz-hiscore{background:#000;color:#fff;font:14px/1.4 "Courier New",monospace}
.wp-hz-hiscore h1{font:bold 28px "Courier New",monospace;text-align:center;color:#ff0;text-shadow:3px 3px #f00;margin:4px 0}
.wp-hz-hiscore table{width:100%;max-width:520px;margin:10px auto;border-collapse:separate;border-spacing:2px}
.wp-hz-hiscore td,.wp-hz-hiscore th{padding:2px 8px;text-align:left}.wp-hz-hiscore th{white-space:nowrap}.wp-hz-hiscore th{color:#0ff}
.wp-hz-hiscore tr:nth-child(odd) td{color:#ff0}.wp-hz-hiscore tr:nth-child(even) td{color:#f6f}
.wp-hz-hiscore .hs-f{text-align:center;margin:10px 0}.wp-hz-hiscore input{background:#000;color:#0f0;border:1px solid #0f0;font:14px "Courier New",monospace;text-transform:uppercase}
.wp-hz-hiscore a{color:#0ff}`,
    html: c => `<h1>HIGH SCORE HALL OF FAME</h1><p class="c">${c.gif('joystick', 24)} INSERT COIN ${c.gif('joystick', 24)}</p>${c.splat()}
<h3 class="c" style="color:#0f0">THE SEASIDE ARCADE</h3><table><tr><th>GAME</th><th>NAME</th><th>SCORE</th></tr>${[['SAUCER INVADERS', 'JAK', '48,210'], ['PAC-MAN', 'DAV', '12,050'], ['ROAD RAGE RALLY', I3('club4'), '1:42.6'], ['WHACK-A-ROBOT', I3('cousin'), '96'], ['ROBOT BOXING', I3('club1'), 'K.O. ROUND 2'], ['TWO-PENNY FALLS', 'NAN', '£0.40 (net loss)']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>
<h3 class="c" style="color:#0f0">LIVE HALL OF FAME (enter yours!)</h3><table class="hs-live"><tr><td>LOADING...</td></tr></table>
<form class="hs-f"><input type="text" maxlength="3" size="3" placeholder="AAA" aria-label="Initials"> <input type="text" maxlength="7" size="7" placeholder="score" aria-label="Score" inputmode="numeric"> <button class="btn" type="submit">ENTER</button></form><p class="c small">(Honest scores only. The arcade man is watching.)</p>${c.counterLine('PLAYERS', 'green')}${c.ring()}`,
    setup(el, c) {
      const K = 'web.hiscore', tb = el.querySelector('.hs-live');
      const draw = arr => { const rows = (Array.isArray(arr) ? arr : []).map(e => { const m = /^([A-Z0-9]{1,3}) (\d{1,7})$/.exec(e.text || ''); return m ? [m[1], +m[2], e.by] : null; }).filter(Boolean).sort((a, b) => b[1] - a[1]).slice(0, 10); tb.innerHTML = rows.length ? rows.map((r, i) => `<tr><td>${i + 1}.</td><td>${esc(r[0])}</td><td>${r[1].toLocaleString('en-GB')}</td><td class="small">${esc(r[2])}</td></tr>`).join('') : '<tr><td>NO SCORES YET. BE THE FIRST!</td></tr>'; };
      const load = () => c.get([K]).then(v => draw(v[K])); load(); c.watch(K, ev => { if (ev.type === 'push') load(); });
      el.querySelector('.hs-f').addEventListener('submit', ev => { ev.preventDefault(); const [a, b] = el.querySelectorAll('.hs-f input'); const ini = a.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3), sc = parseInt(b.value, 10); if (!ini || !(sc > 0) || sc > 9999999) return; if (Net.kv.push(K, ini + ' ' + sc)) { a.value = b.value = ''; Sound.play('solve'); } });
    },
  });

  const PRIYA16 = ['#ffffff', '#000000', '#808080', '#c0c0c0', '#800000', '#ff0000', '#808000', '#ffff00', '#008000', '#00ff00', '#008080', '#00ffff', '#000080', '#0000ff', '#800080', '#ff00ff'];
  W.def('hz-priya', {
    css: `.wp-hz-priya{background:#fff ${tile('<rect width="8" height="8" fill="#f0f0ff"/><rect x="8" y="8" width="8" height="8" fill="#f0f0ff"/>', 16)};color:#000;font:14px/1.45 Verdana,Arial,sans-serif}
.wp-hz-priya h1{text-align:center;font:bold 30px "Courier New",monospace;margin:4px 0}
.wp-hz-priya .pp-pal{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;max-width:300px;margin:8px auto}
.wp-hz-priya .pp-pal button{width:22px;height:22px;border:2px outset #fff;padding:0;cursor:pointer}
.wp-hz-priya .pp-pal button.on{border-style:inset;outline:2px solid #000}
.wp-hz-priya .pp-grid{display:grid;grid-template-columns:repeat(16,1fr);width:min(320px,90vw);aspect-ratio:1;margin:8px auto;border:2px solid #000;background:#fff;touch-action:none}
.wp-hz-priya .pp-grid i{border:1px solid rgba(0,0,0,.08);cursor:crosshair}
.wp-hz-priya .tips li{margin:4px 0}`,
    html: c => `<h1>${c.rainbow(Cast.t("PIXEL {club4.NAME}'S ART CORNER"))}</h1><p class="c">Arcadia, Pixel Street, house 3112. Everything here is drawn one dot at a time. In 16 colours. Because that's all the computer at school can do.</p>
<div class="c">${c.photo('#fff -; cat 4 4; dog 18 4; hamster 32 4; blob 4 20; robot 18 20; rocket 32 20', 'My sprite sheet')}${c.photo('#000 -; star 4 4; planet 18 10; ufo 30 2; rocket 34 20', Cast.t('Space (for {club2})'))}${c.photo('#9cf #3a3; house 18 13; tree 4 13; tree 32 13; flower 30 22', 'My house (not really)')}</div>
<h3>PIXEL TIPS</h3><ol class="tips"><li>Start with a black outline. Then fill it in.</li><li>Put a white dot in the eyes. Instant life!</li><li>Shading: one colour darker on the bottom and right.</li><li>Don't use all 16 colours at once. It looks like a sweet shop exploded.</li><li>Zoom in all the way in Paint. Then zoom in more. (You can't. But you want to.)</li></ol>
<p class="c"><b>${c.s('draw.html', 'DRAW ON MY SHARED PIXEL GRID &raquo;')}</b> ${c.newb()} (everyone draws on the same one, live!)</p>${c.counterLine('Art fans:', 'flip')}${c.ring()}`,
  });
  W.sub('hz-priya', { 'draw.html': { html: c => `<h2 class="c">THE SHARED PIXEL GRID</h2><p class="c">16 by 16. 16 colours. Everyone on JackNet draws on the SAME grid, live. Be nice. Draw something good. (Not rude things. I can see you.)</p><div class="pp-pal">${PRIYA16.map((col, i) => `<button type="button" data-ci="${i}" style="background:${col}" aria-label="Colour ${i}"${i === 1 ? ' class="on"' : ''}></button>`).join('')}</div><div class="pp-grid">${Array.from({ length: 256 }, (_, i) => `<i data-p="${i}"></i>`).join('')}</div><p class="c small pp-who">Loading the grid...</p>`,
    setup(el, c) {
      const K = 'web.priya.px', cells = [...el.querySelectorAll('.pp-grid i')]; let ci = 1, down = false;
      const paint = (i, v) => { const cell = cells[i]; if (cell) cell.style.background = PRIYA16[parseInt(v, 16)] || '#fff'; };
      c.get([K]).then(v => { const o = v[K] || {}; for (const f in o) { const m = /^p(\d+)$/.exec(f); if (m) paint(+m[1], o[f]); } el.querySelector('.pp-who').textContent = 'Click or drag to draw. Live with everyone!'; });
      c.watch(K, ev => { if (ev.type === 'put') { const m = /^p(\d+)$/.exec(ev.f); if (m) paint(+m[1], ev.v); if (ev.by && ev.by !== Net.me.nick) el.querySelector('.pp-who').textContent = ev.by + ' is drawing...'; } });
      el.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => { el.querySelectorAll('[data-ci]').forEach(x => x.classList.remove('on')); b.classList.add('on'); ci = +b.dataset.ci; }));
      const put = t => { const p = t && t.dataset && t.dataset.p; if (p == null) return; paint(+p, ci.toString(16)); Net.kv.put(K, 'p' + p, ci ? ci.toString(16) : ''); };
      const grid = el.querySelector('.pp-grid');
      grid.addEventListener('pointerdown', ev => { down = true; put(ev.target); });
      grid.addEventListener('pointermove', ev => { if (down) put(document.elementFromPoint(ev.clientX, ev.clientY)); });
      const up = () => { down = false; }; document.addEventListener('pointerup', up); return () => document.removeEventListener('pointerup', up);
    } } });

  W.def('hz-snotlin', {
    css: `.wp-hz-snotlin{background:#5a4a2a ${tile('<ellipse cx="10" cy="10" rx="8" ry="4" fill="#4a3a1a"/><ellipse cx="28" cy="26" rx="6" ry="3" fill="#6a5a3a"/>', 36)};color:#cf9;font:bold 16px "Comic Sans MS",cursive}
.wp-hz-snotlin h1{font:bold 34px "Comic Sans MS",cursive;color:#b6ff00;text-shadow:3px 3px #000;text-align:center;margin:4px 0;transform:rotate(1deg)}
.wp-hz-snotlin .sk-b{background:rgba(0,0,0,.4);border:3px dashed #b6ff00;padding:10px;margin:10px auto;max-width:560px}
.wp-hz-snotlin a{color:#ff0}`,
    html: c => `<h1>LITTLE GREEN KEVIN'S HOME</h1><p class="c">${c.spr('ufo', 3)} Grotville, Mudpit, 1234 ${c.spr('ufo', 3, { flip: 1 })}</p><div class="sk-b">HELLO EARTHLINGS. this is my home page. i am Kevin. i am a little green alien from the planet Mudpit (it is past Mars, turn left at the big rock). my saucer broke down in Jacktown. Gubbinz is my mate. he showed me the komputer. i think it is a box with a light in.</div><div class="sk-b"><b>THINGS I LIKE:</b><br>1. mud<br>2. MORE mud<br>3. my pet Blobbit (he is called Kevin as well)<br>4. Gubbinz (when he shares)<br>5. the telly programme with the robots fighting</div><div class="sk-b"><b>MY FOTO:</b><br>${c.broken('me_in_the_mud.gif', 180, 120, '#663 #5a4a2a; blob 18 14; text 2 8 KEVIN')} <span class="small">(click it, it is shy)</span></div><div class="sk-b"><b>MY MATES:</b> ${c.a('poetree', 'Gubbinz (poems)')} &middot; ${c.a('hz-fungus', 'the mushroom page (next door)')} &middot; ${c.a('teef', 'the gem shop')}</div><p class="c">earthlings who looked: ${c.counter('tally')}</p>${c.ring()}`,
  });
  W.def('hz-fungus', {
    css: `.wp-hz-fungus{background:#1e2a14 ${tile('<path d="M6 14q6-10 12 0z" fill="#3a2a1a"/><rect x="11" y="14" width="2" height="5" fill="#3a2a1a"/>', 30)};color:#efe;font:14px/1.5 Georgia,serif}
.wp-hz-fungus h1{text-align:center;font:bold 32px Georgia,serif;color:#f66;margin:4px 0}
.wp-hz-fungus .fg{background:rgba(255,255,240,.95);color:#222;padding:10px 16px;max-width:600px;margin:10px auto;border:2px solid #a33}
.wp-hz-fungus .fg h3{margin:0 0 6px;color:#a33}
.wp-hz-fungus .warn{background:#ff0;color:#000;border:3px solid #c00;padding:8px;font:bold 14px Arial,sans-serif;text-align:center;max-width:600px;margin:10px auto}
.wp-hz-fungus a{color:#fc6}`,
    html: c => `<h1>${c.spr('mushroom', 3)} THE MUSHROOM PAGE ${c.spr('mushroom', 3, { flip: 1 })}</h1><p class="c">Grotville, Fungus Street, 4040. Marlo loves mushrooms. This page is about real ones. (Made with help from my big sister, who does biology.)</p>
<div class="warn">NEVER EAT A MUSHROOM YOU FIND OUTSIDE. Some look nice and are deadly poisonous. Even experts get it wrong. Look, don't touch, wash your hands.</div>
<div class="fg"><h3>REAL FACTS</h3><ul><li>Fungi are <b>not plants</b>. They can't make their own food from sunlight. They're their own separate kingdom.</li><li>A mushroom is only the "fruit" of the fungus. The main part is a web of tiny threads underground called <b>mycelium</b>, which can be HUGE.</li><li>Mushrooms spread by <b>spores</b>, millions of them, like dust. Put a mushroom cap on paper overnight and you get a "spore print".</li><li><b>Fairy rings</b> are circles of mushrooms. They grow in a ring because the fungus spreads outwards from the middle.</li><li><b>Yeast</b> is a fungus. It makes bread rise. So every sandwich you've eaten is a bit fungus. Sorry.</li><li><b>Penicillin</b>, the medicine, came from a mould. Alexander Fleming noticed it in 1928 when mould killed the germs in one of his dishes.</li><li>The red one with white spots is the one in all the fairy tales. It's poisonous. In games, Marlo eats them to grow bigger. Do NOT try this. Marlo is not a real plumber.</li></ul></div>
<div class="fg"><h3>MY MUSHROOM SPOTTING LOG</h3><table style="width:100%">${[['Field behind school', 'Little brown ones', 'Did not touch'], ['Under the oak tree', 'A fairy ring!', 'Counted 23'], ['Our garden', 'One big white one', 'Dad mowed it'], ['Grotville', 'The red spotty kind', 'A garden gnome was sat on it']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table></div>
<p class="c">${c.a('hz-snotlin', '&laquo; next door: Little Green Kevin')}</p>${c.counterLine('Spore counter:', 'green')}${c.ring()}`,
  });
  W.def('hz-fluffy', {
    css: `.wp-hz-fluffy{background:#ffe0f6 ${tile('<circle cx="12" cy="12" r="7" fill="#fff"/><circle cx="8" cy="9" r="4" fill="#fff"/><circle cx="16" cy="9" r="4" fill="#fff"/>', 30)};color:#8a006a;font:15px/1.5 "Comic Sans MS",cursive}
.wp-hz-fluffy h1{text-align:center;font:bold 34px "Comic Sans MS",cursive;margin:4px 0}
.wp-hz-fluffy .ff-c{background:#fff;border:4px dotted #f6a;border-radius:20px;padding:10px 16px;max-width:560px;margin:10px auto}
.wp-hz-fluffy a{color:#c0f}`,
    html: c => `<h1>${c.rainbow('DJ FLUFFY FAN CLUB')}</h1><p class="c">Tunesville, Bassline Street, 8080. Run by ${Cast.n('cousin')} (president, secretary and only member). ${c.gif('new')}</p>
<div class="ff-c"><b>WHO IS DJ FLUFFY?</b><br>DJ Fluffy is the best DJ in the world. He has big fluffy headphones and he wears a bobble hat even in summer. His song "Bounce Bounce Bounce (Radio Edit)" is number 4 in my chart (see ${c.a('~kim', 'my main page')}). Nobody knows his real name. I think it's Graham.</div>
<div class="ff-c"><b>FAN CLUB RULES</b><ol><li>Must love DJ Fluffy.</li><li>Must bounce when the song comes on.</li><li>Must not say "it's just the same beat over and over". (Dave.)</li></ol><b>MEMBERS:</b> ${Cast.n('cousin')}. ${c.pop('fluffyjoin', '<b>Click here to JOIN!!!</b>')}</div>
<div class="ff-c c">${c.plugin('DJ Fluffy dancing movie', 120)}</div>
<p class="c">${c.midi('web-rave', 'bounce_bounce_bounce_fan_mix.mid', { auto: 1 })}</p>${c.counterLine('Bouncers so far:', 'flip')}${c.ring()}`,
  });
  W.POPS.fluffyjoin = { title: 'JOIN THE FAN CLUB!!!', url: 'http://www.homepagez.webcom/Tunesville/Bassline/8080/join.html', w: 300, h: 230, style: 'background:#ffe0f6;color:#8a006a;font-family:Comic Sans MS,cursive', html: '<h3 style="margin:4px 0">THANK YOU!!!</h3><p>You are now member number 2 of the DJ Fluffy Fan Club!!!</p><p>Your membership card is in the post. (There is no card. There is no post. But you are a member in your HEART.)</p><p><a data-close="1">Close this window</a></p>' };
  W.def('hz-recorder', {
    css: `.wp-hz-recorder{background:#fffbe8;color:#222;font:14px/1.5 "Times New Roman",serif}
.wp-hz-recorder h1{text-align:center;font:bold 30px "Times New Roman",serif;margin:4px 0}
.wp-hz-recorder .rc-ch{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin:10px 0}
.wp-hz-recorder .rc-n{text-align:center}.wp-hz-recorder .rc-n svg{width:40px;height:150px;display:block;margin:0 auto}
.wp-hz-recorder .rc-n button{margin-top:4px;min-width:40px}`,
    html: c => `<h1>&#9835; Recorder Club &#9835;</h1><p class="c">Tunesville, Recorder Street, 1212. Practice: Wednesday lunchtime, music room. Bring your recorder and a hanky.</p>
<p>The first three notes everybody learns are <b>B</b>, <b>A</b> and <b>G</b>, all with your LEFT hand at the top. Cover the holes with the pads of your fingers, not the tips, and blow gently. GENTLY. Like you're cooling soup. If it squeaks, you are blowing like a hairdryer.</p>
<div class="rc-ch">${[['B', [1, 1, 0, 0, 0, 0, 0, 0], 71], ['A', [1, 1, 1, 0, 0, 0, 0, 0], 69], ['G', [1, 1, 1, 1, 0, 0, 0, 0], 67], ["C'", [1, 0, 1, 0, 0, 0, 0, 0], 72], ["D'", [0, 0, 1, 0, 0, 0, 0, 0], 74]].map(([n, h, midi]) => `<div class="rc-n"><svg viewBox="0 0 40 150" aria-label="Fingering for ${n}"><rect x="12" y="2" width="16" height="146" rx="6" fill="#f2e8c8" stroke="#7a5a00"/>${h.map((v, i) => `<circle cx="${i === 0 ? 8 : 20}" cy="${i === 0 ? 20 : 22 + i * 15}" r="5" fill="${v ? '#000' : '#fff'}" stroke="#000"/>`).join('')}</svg><b>${n}</b><br><button class="btn" type="button" data-m="${midi}">Play</button></div>`).join('')}</div>
<p class="small c">The hole on the left (sticking out) is the thumb hole at the back. Black = covered.</p>
<p><b>Club news:</b> We are learning a new tune for the Christmas concert. Mrs Okafor says we are "nearly there". She has said this since September. Our neighbours have asked if we could practise "somewhere else, perhaps the moon".</p>${c.counterLine('Squeaks so far:', 'odo')}${c.ring()}`,
    setup(el) { el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { if (!Sound.on) { Sound.on = true; document.dispatchEvent(new Event('sfxchange')); } const f = 440 * Math.pow(2, (+b.dataset.m - 69) / 12); Sound.note(f, 0.7, 'triangle'); if (Math.random() < 0.15) setTimeout(() => Sound.note(f * 2.02, 0.15, 'square'), 200); })); },
  });
  W.def('hz-goldie', {
    css: `.wp-hz-goldie{background:#0a1a3a ${tile('<circle cx="12" cy="12" r="1.2" fill="#6af" opacity=".5"/><circle cx="34" cy="28" r="2" fill="#6af" opacity=".3"/>', 44)};color:#e8f0ff;font:15px/1.6 Georgia,"Times New Roman",serif}
.wp-hz-goldie .gd-w{max-width:560px;margin:0 auto;text-align:center}
.wp-hz-goldie h1{font:italic bold 30px Georgia,serif;color:#ffd700;margin:6px 0}
.wp-hz-goldie .gd-bowl{display:block;margin:10px auto;width:220px;height:183px}
.wp-hz-goldie .gd-bub{animation:gdbub 3s linear infinite}.wp-hz-goldie .gd-bub.b2{animation-delay:-1s}.wp-hz-goldie .gd-bub.b3{animation-delay:-2s}
@keyframes gdbub{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-60px);opacity:0}}
.wp-hz-goldie .gd-fish{animation:gdswim 6s ease-in-out infinite alternate}
@keyframes gdswim{0%{transform:translateX(-24px)}100%{transform:translateX(24px)}}
.wp-hz-goldie .gd-poem{font-style:italic;white-space:pre-line;margin:14px 0}
.wp-hz-goldie .gd-c{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;min-height:40px;margin:8px 0}
.wp-hz-goldie a{color:#ffd700}`,
    html: c => `<div class="gd-w">${c.status('In loving memory of Goldie, 1997 - 1999. The best goldfish who ever lived.')}<h1>In Memory of Goldie</h1><p>1997 - 1999</p>
<svg class="gd-bowl" viewBox="0 0 180 150" aria-label="Goldie swimming in his bowl"><defs><radialGradient id="gdw" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#bfe8ff"/><stop offset="1" stop-color="#3a8ad0"/></radialGradient><clipPath id="gdc"><path d="M58 30h64v6q44 18 44 58q0 40-76 46q-76-6-76-46q0-40 44-58z"/></clipPath></defs>
<ellipse cx="90" cy="142" rx="62" ry="6" fill="#000" opacity=".35"/><path d="M58 30h64v6q44 18 44 58q0 40-76 46q-76-6-76-46q0-40 44-58z" fill="#cfefff" opacity=".18"/>
<g clip-path="url(#gdc)"><rect x="0" y="44" width="180" height="110" fill="url(#gdw)" opacity=".85"/><path d="M14 44q76 6 152 0" stroke="#e8f8ff" stroke-width="2" fill="none" opacity=".8"/>
<path d="M10 124q80-14 160 0v30h-160z" fill="#d8a060"/><g fill="#a86a30">${[24, 40, 58, 77, 96, 118, 136, 152].map((x, i) => `<circle cx="${x}" cy="${128 + (i % 3) * 3}" r="2.6"/>`).join('')}</g><g fill="#f0e0b0">${[32, 50, 68, 88, 108, 127, 145].map((x, i) => `<circle cx="${x}" cy="${131 + (i % 2) * 4}" r="2"/>`).join('')}</g>
<path d="M120 126v-30h6v-6h6v6h6v-6h6v6h6v30z" fill="#c8c8d0" stroke="#8a8a98"/><path d="M132 126v-10a5 5 0 0 1 10 0v10z" fill="#2a2a3a"/><rect x="125" y="100" width="4" height="5" fill="#2a2a3a"/>
<path d="M40 128q-6-28 4-56M48 128q2-24 14-44M34 128q-10-18-4-38" stroke="#2a9a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
<g class="gd-fish"><g transform="translate(88 82)"><path d="M14 0q14-16 22-12q-6 12 0 24q-8 4-22-12z" fill="#ff9a2a" opacity=".85"/><path d="M-4-10q8-12 16-2z" fill="#ffa040"/><path d="M2 8q-2 9-10 9l4-9z" fill="#ffa040" opacity=".9"/>
<ellipse rx="18" ry="11" fill="#ff8a1a"/><ellipse cx="-2" cy="4" rx="12" ry="5" fill="#ffc070"/><ellipse cx="-4" cy="-5" rx="9" ry="3" fill="#fff" opacity=".35"/><circle cx="-10" cy="-2" r="3.4" fill="#fff"/><circle cx="-10.6" cy="-2" r="2" fill="#111"/><path d="M-17 2q-2 1 0 2" stroke="#b04a10" fill="none"/></g></g>
<g fill="none" stroke="#fff" opacity=".8"><circle class="gd-bub" cx="70" cy="100" r="2.4"/><circle class="gd-bub b2" cx="74" cy="110" r="1.8"/><circle class="gd-bub b3" cx="68" cy="118" r="1.4"/></g></g>
<path d="M58 30h64v6q44 18 44 58q0 40-76 46q-76-6-76-46q0-40 44-58z" fill="none" stroke="#e0f4ff" stroke-width="3"/><path d="M30 70q-8 20 2 40" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/><rect x="54" y="26" width="72" height="7" rx="3.5" fill="#e0f4ff" opacity=".9"/></svg>
<p>This site is dedicated to <b>Goldie</b>, our goldfish, who lived on the kitchen windowsill for two whole years. He was won at the fair in a plastic bag. Dad said he wouldn't last the week. He lasted <b>two years</b>. That is a record in our family.</p>
<p>Goldie liked fish flakes, swimming round his castle, and staring at the cat next door through the glass (the cat could never get him). He did not like the time Dave tapped the bowl.</p>
<div class="gd-poem">Round and round the castle,
gold in the morning sun,
you never went anywhere much
but you went there with everyone.</div>
<p>${c.s('photos.html', 'Photos of Goldie')} &middot; ${c.s('candle.html', 'Light a candle for Goldie')}</p>
${c.gb([['Mom', c.daysAgo(40), 'He was a lovely fish. I still look at the windowsill.', 0], ['Dave', c.daysAgo(39), 'sorry i tapped the bowl', 0]], { title: 'Leave a message for Goldie', ph: 'A kind message...', rate: false, btn: 'Leave message' })}
<p class="small">Visitors who stopped by: ${c.counter('plain')}</p>${c.ring()}</div>`,
  });
  W.sub('hz-goldie', {
    'photos.html': c => `<div class="gd-w"><h2>Photos of Goldie</h2><div class="c">${c.photo('#9cf -; fish 18 12', 'Goldie, first day home')}${c.photo('#9cf -; fish 6 10; house 24 14 swap=re,we', 'Goldie and his castle')}${c.photo('#cfe -; fish 18 14; cat 30 4 flip', 'Goldie vs the cat next door')}${c.broken('goldie_xmas.jpg', 192, 144)}</div><p class="small">The Christmas one didn't scan properly. He was wearing a tiny bit of tinsel (on the bowl, not on him).</p></div>`,
    'candle.html': { html: c => `<div class="gd-w"><h2>Light a Candle for Goldie</h2><p>Every candle stays lit forever. Everyone on JackNet can see them.</p><div class="gd-c"></div><p><b class="gd-n">?</b> candles lit</p><button class="btn gd-go" type="button">Light a candle</button><p class="small gd-said"></p></div>`,
      setup(el, c) { const K = 'web.goldie.candles', box = el.querySelector('.gd-c'), n = el.querySelector('.gd-n'); const show = v => { v = +v || 0; n.textContent = v.toLocaleString('en-GB'); box.innerHTML = c.spr('candle', 3).repeat(Math.min(v, 60)) + (v > 60 ? ' ...' : ''); W.kitWire(box, c, c); }; c.get([K]).then(v => show(v[K])); c.watch(K, ev => { if (ev.type === 'set') { show(ev.v); if (ev.by !== Net.me.nick) el.querySelector('.gd-said').textContent = ev.by + ' lit a candle.'; } }); let done = false; el.querySelector('.gd-go').addEventListener('click', () => { if (done) return; done = true; Net.kv.inc(K); Sound.play('pet'); c.secret('web.candle'); el.querySelector('.gd-said').textContent = 'Thank you. Goldie would have liked that.'; }); } },
  });
  W.def('hz-sheldon', {
    css: `.wp-hz-sheldon{background:#d8e8b0;color:#223;font:15px/1.5 "Times New Roman",serif}
.wp-hz-sheldon h1{font:bold 28px "Times New Roman",serif;text-align:center;margin:4px 0}
.wp-hz-sheldon table{width:100%;max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:3px}.wp-hz-sheldon td{border:1px solid #6a8a3a;padding:4px 8px;vertical-align:top;background:#f4fae4}
.wp-hz-sheldon .sh-cam{max-width:360px;margin:8px auto;background:#000;border:5px solid #6a8a3a;padding:3px}.wp-hz-sheldon .sh-cam canvas{display:block;width:100%;height:auto;background:#222}
.wp-hz-sheldon .sh-ln{background:#000;font:11px/1.4 "Courier New",monospace;color:#9f9;padding:2px 3px;overflow:hidden}.wp-hz-sheldon .sh-ln span{display:block;border:0;background:none;padding:0;margin:0}.wp-hz-sheldon .sh-next{color:#6c6}`,
    html: c => `<h1>${c.spr('tortoise', 4)} Sheldon the Tortoise's Page</h1><p class="c">PetPark, Tortoise Street, 7070. This page is updated about once a year. Like Sheldon.</p>
<table><tr><td><b>Name</b></td><td>Sheldon</td></tr><tr><td><b>Age</b></td><td>About 40. He's older than Dad's car. He might be older than Dad.</td></tr><tr><td><b>Speed</b></td><td>Yes (a bit)</td></tr><tr><td><b>Favourite food</b></td><td>Dandelions, strawberries, and the lettuce you were saving</td></tr><tr><td><b>Hobbies</b></td><td>Sitting in the sun. Hibernating. Escaping (very slowly).</td></tr></table>
<h3 class="c">SHELDON CAM <span class="small">(live. Nothing happens. That's the point.)</span></h3><div class="sh-cam"><canvas width="320" height="240" aria-label="Sheldon the tortoise, live webcam"></canvas><div class="sh-ln"><span class="sh-say">Sheldon is: loading...</span><span class="sh-next"></span></div></div>
<h3 class="c">SHELDON NEWS</h3><table>${[['1997', 'Sheldon woke up in April. He ate a strawberry. He went back to sleep in October.'], ['1998', 'Sheldon woke up in April. He escaped under the fence. He was found two days later, three metres away.'], ['1999', 'Sheldon woke up in April. He met Biscuit the dog. Biscuit barked. Sheldon did nothing. Sheldon won.']].map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</table>
<p class="c small">Tortoises hibernate through the winter in a box of straw in a cool, safe place. Sheldon will be back in the spring. See you in 2000, Sheldon! (${Cast.n('kidY2k')} says if there is a 2000.)</p>${c.updated(190)}${c.counterLine('Tortoise fans:', 'roman')}${c.ring()}`,
    setup(el, c) { (W.cam ? Promise.resolve() : W.load(4)).then(() => { if (el.isConnected) camOn(el, c); }).catch(() => {}); },
  });
  // Sheldon's world: a box of straw in the garage (winter), his hutch (night) or the back garden
  W.sheldonScene = (g, act, sx, h) => {
      const CAM = W.cam;
      // a spur-thighed tortoise, side-on: a high domed shell with proper scutes, a beaky face and scaly elephant legs
      const tort = (g, x, y, pose, s, f) => {
        const SH = '#8a6a2a', SC = '#6a4a1a', ED = '#d8b860', SK = '#a8a070', SKD = '#7a7448', E = (cx, cy, rx, ry, col, r) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, r || 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
        g.save(); g.translate(x, y); g.scale(s * f, s);
        const out = pose !== 'hide' && pose !== 'sleep';
        if (out) { for (const lx of [-24, 18]) { E(lx, -1, 7, 8, SK); for (let k = 0; k < 5; k++) E(lx - 4 + (k % 3) * 4, -4 + Math.floor(k / 3) * 4, 1.4, 1.1, SKD); for (let k = -1; k <= 1; k++) E(lx + k * 3.4, 6.5, 1.6, 1.3, '#e8e0c0'); } } // scaly legs + claws
        if (out) { // neck and head
          const hy = pose === 'eat' ? -2 : pose === 'bask' ? -16 : -10, hx = pose === 'eat' ? 42 : 40;
          g.strokeStyle = SK; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(22, -10); g.quadraticCurveTo(32, -14, hx - 6, hy); g.stroke();
          E(hx, hy, 11, 8, SK); E(hx - 3, hy - 4, 5, 2.4, '#c0b888'); E(hx + 9, hy + 2, 3.6, 3.2, SKD); g.strokeStyle = '#3a3420'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx + 3, hy + 3); g.lineTo(hx + 9, hy + 2.5); g.stroke();
          if (pose === 'bask') { g.beginPath(); g.arc(hx + 1, hy - 2, 2.4, 0.2, Math.PI - 0.2); g.stroke(); } else { E(hx + 1, hy - 2, 2.2, 2.2, '#1a1408'); E(hx + 0.4, hy - 2.8, 0.8, 0.8, '#fff'); }
          for (let k = 0; k < 5; k++) E(26 + k * 3, -12 + (k % 2) * 3, 1.2, 1, SKD);
        } else E(26, -6, 5, 5, '#2a2010'); // tucked in: just the dark gap
        // the shell: a dome with a row of edge plates and the big plates on top
        g.beginPath(); g.moveTo(-34, -4); g.bezierCurveTo(-34, -40, 30, -40, 30, -4); g.closePath(); g.fillStyle = SH; g.fill();
        g.fillStyle = ED; for (let k = 0; k < 8; k++) { g.beginPath(); g.ellipse(-30 + k * 8.2, -6, 4.2, 3.4, 0, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = SC; g.lineWidth = 1.2; for (let k = 0; k < 8; k++) { g.beginPath(); g.ellipse(-30 + k * 8.2, -6, 4.2, 3.4, 0, 0, Math.PI * 2); g.stroke(); }
        const plate = (cx, cy, r) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 0.8); } g.closePath(); g.fillStyle = '#9a7a34'; g.fill(); g.strokeStyle = SC; g.lineWidth = 1.4; g.stroke(); E(cx, cy, r * 0.4, r * 0.28, '#c8a050'); };
        plate(-2, -24, 8); plate(-18, -18, 7.5); plate(13, -18, 7.5); plate(-26, -10, 5); plate(22, -10, 5);
        E(-8, -30, 10, 3, 'rgba(255,255,255,.18)'); // a bit of shine
        g.restore();
      };
          const fix = CAM.seeded(77);
          if (act === 'hib') { // a box of straw in the cold garage
            g.fillStyle = '#6a6a6e'; g.fillRect(0, 0, 320, 240); g.fillStyle = '#5a5a60'; for (let y = 0; y < 170; y += 20) for (let x = (y / 20 % 2) * 20; x < 320; x += 40) g.fillRect(x, y, 38, 18);
            g.fillStyle = '#4a4a4a'; g.fillRect(0, 170, 320, 70);
            g.fillStyle = '#e8e8e0'; g.fillRect(232, 30, 16, 70); g.fillStyle = '#c02020'; g.fillRect(237, 70 - (4 + Math.sin(h / 24 * Math.PI * 2) * 2) * 3, 6, 30 + (4 + Math.sin(h / 24 * Math.PI * 2) * 2) * 3); g.beginPath(); g.arc(240, 98, 7, 0, 7); g.fill(); // thermometer, about 5C
            g.fillStyle = '#f8f0c0'; g.fillRect(30, 36, 120, 54); g.fillStyle = '#c02020'; g.font = 'bold 15px Arial'; g.fillText('SHHH!', 62, 56); g.fillStyle = '#222'; g.font = 'bold 11px Arial'; g.fillText('SHELDON IS', 54, 72); g.fillText('HIBERNATING', 50, 85);
            g.fillStyle = '#b8955a'; g.fillRect(60, 120, 200, 90); g.fillStyle = '#a07e48'; g.fillRect(60, 120, 200, 8); g.fillStyle = '#8a6a3a'; g.fillRect(60, 206, 200, 6);
            g.fillStyle = '#e8d080'; for (let k = 0; k < 90; k++) { const x = 66 + fix() * 188, y = 112 + fix() * 22; g.save(); g.translate(x, y); g.rotate(fix() * 3); g.fillRect(-8, -1, 16, 2); g.restore(); }
            tort(g, 168, 142, 'sleep', 1.2, 1); g.fillStyle = '#e8d080'; for (let k = 0; k < 50; k++) { const x = 110 + fix() * 120, y = 124 + fix() * 16; g.save(); g.translate(x, y); g.rotate(fix() * 3); g.fillRect(-7, -1, 14, 2); g.restore(); }
            g.fillStyle = '#222'; g.font = 'bold 10px Arial'; g.fillText('DO NOT OPEN TILL APRIL', 92, 196);
          } else if (act === 'sleep') { // night: in his hutch
            g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 320, 240); g.fillStyle = '#7a5a30'; g.fillRect(20, 30, 280, 190); g.fillStyle = '#5a4020'; for (let x = 20; x < 300; x += 24) g.fillRect(x, 30, 2, 190);
            g.fillStyle = '#d8c070'; g.fillRect(20, 180, 280, 40); for (let k = 0; k < 60; k++) { g.save(); g.translate(30 + fix() * 260, 176 + fix() * 40); g.rotate(fix() * 3); g.fillRect(-8, -1, 16, 2); g.restore(); }
            tort(g, 150, 196, 'sleep', 1.4, 1);
          } else { // the back garden
            g.fillStyle = '#9ccaf0'; g.fillRect(0, 0, 320, 80); g.fillStyle = '#8a6a44'; g.fillRect(0, 40, 320, 70); g.fillStyle = '#76583a'; for (let x = 0; x < 320; x += 16) g.fillRect(x, 40, 2, 70); // fence
            g.fillStyle = '#4a8a3a'; g.fillRect(0, 96, 320, 30); for (let k = 0; k < 14; k++) { g.fillStyle = ['#e04060', '#f0d040', '#ffffff', '#c060e0'][k % 4]; g.beginPath(); g.arc(10 + k * 23, 100 + (k % 3) * 6, 4, 0, 7); g.fill(); } // flowerbed
            g.fillStyle = '#5aa040'; g.fillRect(0, 118, 320, 122); for (let k = 0; k < 400; k++) { g.fillStyle = k % 2 ? '#4a9030' : '#6ab450'; g.fillRect(fix() * 320, 118 + fix() * 122, 1.5, 4); }
            g.fillStyle = '#c8c0b0'; g.fillRect(0, 214, 320, 26); g.fillStyle = '#a8a090'; for (let x = 0; x < 320; x += 64) g.fillRect(x, 214, 2, 26); // patio
            for (const [fx, fy] of [[40, 170], [262, 150], [196, 196]]) { g.fillStyle = '#f0d020'; for (let k = 0; k < 10; k++) { const a = k / 10 * 7; g.beginPath(); g.ellipse(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 1.4, a, 0, 7); g.fill(); } g.fillStyle = '#e0a010'; g.beginPath(); g.arc(fx, fy, 2.4, 0, 7); g.fill(); } // dandelions
            if (act === 'eat') { const bx = sx + 92, by = 204; g.fillStyle = '#e02030'; g.beginPath(); g.moveTo(bx - 9, by - 8); g.quadraticCurveTo(bx, by - 12, bx + 9, by - 8); g.quadraticCurveTo(bx + 6, by + 8, bx, by + 10); g.quadraticCurveTo(bx - 6, by + 8, bx - 9, by - 8); g.fill(); g.fillStyle = '#ffe080'; for (let k = 0; k < 6; k++) g.fillRect(bx - 5 + (k % 3) * 4, by - 4 + Math.floor(k / 3) * 6, 1.5, 1.5); g.fillStyle = '#3a9a2a'; g.beginPath(); g.moveTo(bx - 8, by - 10); g.lineTo(bx, by - 6); g.lineTo(bx + 8, by - 10); g.lineTo(bx, by - 13); g.fill(); }
            if (act === 'bask') { const rg = g.createRadialGradient(sx, 180, 10, sx, 180, 90); rg.addColorStop(0, 'rgba(255,240,180,.35)'); rg.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = rg; g.fillRect(0, 0, 320, 240); }
            g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(sx, 214, 58, 8, 0, 0, 7); g.fill();
            tort(g, sx, 210, act, 1.8, 1);
          }
  };
  function camOn(el, c) {
      const cv = el.querySelector('.sh-cam canvas'), say = el.querySelector('.sh-say'), nextEl = el.querySelector('.sh-next'); if (!cv) return;
      const CAM = W.cam, next = CAM.mk(320, 240);
      const t99 = Desk.today99(), md = t99.m * 100 + t99.d, asleep = md >= 1015 || md < 401; // he hibernates from mid-October to April
      const hibDay = () => { const d = new Date(1999, t99.m - 1, t99.d), st = new Date(md >= 1015 ? 1999 : 1998, 9, 15); return Math.max(1, Math.round((d - st) / 864e5) + 1); };
      let last = 0;
      const shot = () => {
        const d = new Date(), slot = Math.floor(d.getTime() / 30000), h = d.getHours() + d.getMinutes() / 60, r = CAM.seeded(slot)();
        let act, lt;
        if (asleep) { act = 'hib'; lt = 'lamp'; }
        else if (h < 8 || h >= 19.5) { act = 'sleep'; lt = 'ir'; }
        else { lt = 'day'; act = CAM.pickW(r, h < 11 ? { bask: 5, walk: 2, eat: 1 } : h < 16 ? { eat: 3, walk: 3, bask: 2, hide: 1 } : { walk: 2, eat: 2, hide: 2, bask: 1 }); }
        const mins = d.getHours() * 60 + d.getMinutes(), sx = 70 + (mins * 0.3) % 130; // he gets a little way across the lawn every hour. A little.
        CAM.shoot(next, g => W.sheldonScene(g, act, sx, h), { seed: slot, night: lt === 'ir', name: 'SHELDON CAM', tag: asleep ? 'ZZZ' : '', time: d });
        CAM.reveal(cv, next, 1800); last = Date.now();
        say.textContent = 'Sheldon is: ' + ({ hib: `hibernating (day ${hibDay()}). Back in April.`, sleep: 'asleep in his hutch', bask: 'sunbathing', walk: 'walking (slowly)', eat: 'eating a strawberry', hide: 'in his shell. Biscuit is about.' })[act];
      };
      shot();
      c.every(() => { const left = Math.max(0, 30 - Math.floor((Date.now() - last) / 1000)); nextEl.textContent = left ? `next picture in ${left}s` : 'loading...'; if (Date.now() - last >= 30000) shot(); }, 1000);
  }

  // ================================================================ Cool Site of the Day (+ archive)
  const pickFor = n => { const R = W.RING.filter(w => !M[w].parent); return R[Math.floor(seeded(n, 11) * R.length) % R.length]; };
  W.def('csotd', {
    css: `.wp-csotd{background:#036 ${tile('<path d="M16 2l3 9h9l-7 6 3 9-8-6-8 6 3-9-7-6h9z" fill="#048" />', 40)};color:#fff;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-csotd h1{font:bold 34px Georgia,serif;text-align:center;color:#ff0;text-shadow:2px 2px #000;margin:4px 0}
.wp-csotd .cs-pick{background:#fff;color:#000;border:6px double #ff0;max-width:520px;margin:12px auto;padding:14px;text-align:center}
.wp-csotd .cs-pick .nm{font:bold 22px Georgia,serif}
.wp-csotd table{width:100%;max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:3px}.wp-csotd td{background:rgba(255,255,255,.1);padding:4px 8px;vertical-align:top}
.wp-csotd a{color:#ff0}.wp-csotd .cs-pick a{color:#00e}`,
    html: c => { const w = pickFor(dayN(c)); return `<h1>${c.gif('star', 28)} Cool Site of the Day ${c.gif('star', 28)}</h1><p class="c">Every day since 1997* we pick ONE cool site from the whole Web. By hand. With a pin. <span class="small">(*1999)</span></p>
<div class="cs-pick"><div class="small">TODAY'S PICK (${c.today})</div><div class="nm">${c.a(w)}</div><p>${esc(M[w].d)}</p><p><b>Why it's cool:</b> ${esc(['It has a counter AND a guestbook. Respect.', 'The background tiles beautifully. We stared at it for an hour.', 'Made by a real kid in a real bedroom. The best kind of website.', 'It made us laugh out loud in the library and we got shushed.', 'It has a MIDI. It has an under construction sign. It has heart.'][dayN(c) % 5])}</p>${c.badge('COOL SITE', 'of the day', '#036')}</div>
<p class="c">${c.s('archive.html', 'See the ARCHIVE of past picks')} &middot; ${c.s('submit.html', 'Submit your site')}</p>${c.ad(4)}${c.counterLine('Cool people:', 'odo')}${c.ring()}`; },
  });
  W.sub('csotd', {
    'archive.html': { html: c => { const n = dayN(c); const t = c.t99; return `<h2 class="c">THE ARCHIVE</h2><p class="c">Every Cool Site of the Day, going back as far as our hard drive remembers.</p><table>${Array.from({ length: 30 }, (_, i) => { const d = new Date(1999, t.m - 1, t.d - i - 1); if (d.getFullYear() < 1999) return ''; const w = pickFor(d.getMonth() * 31 + 31 + d.getDate()); return `<tr><td style="width:80px">${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/99</td><td>${c.a(w)}</td><td class="small">${esc(M[w].d)}</td></tr>`; }).join('')}<tr><td>31/12/98</td><td>${c.dead('www.oldcoolsite.jnet/', 'The Last Site of 1998')}</td><td class="small">(gone)</td></tr></table>`; }, setup(el, c) { c.secret('web.csotd'); } },
    'submit.html': { html: c => `<h2 class="c">Submit Your Site</h2><p>Think your site is cool? Tell us! We look at every single one. (We have a big pile.)</p>${c.gb([], { title: 'Submit a site', ph: 'Site name and what makes it cool (no addresses, we will find it)', btn: 'Submit!', rate: false })}` },
  });

  // ================================================================ BYTESIZE e-zine
  W.def('ezine', {
    css: `.wp-ezine{background:#1a0030 ${tile('<rect x="0" y="0" width="2" height="2" fill="#2a0050"/>', 6)};color:#eee;font:14px/1.55 Verdana,Arial,sans-serif}
.wp-ezine .ez-mast{text-align:center;border-bottom:3px solid #c0f;padding-bottom:6px;margin-bottom:10px}
.wp-ezine .ez-mast h1{font:bold 44px "Arial Black",Impact,sans-serif;letter-spacing:4px;margin:0;color:#fff;text-shadow:3px 3px #c0f}
.wp-ezine .ez-iss{font:bold 12px "Courier New",monospace;color:#0ff}
.wp-ezine h2{color:#ff0;font:bold 20px Georgia,serif}
.wp-ezine table.ez-toc{width:100%;border-collapse:separate;border-spacing:4px}.wp-ezine .ez-toc td{border:1px solid #c0f;padding:6px;vertical-align:top}
.wp-ezine .q{color:#0ff;font-weight:bold}.wp-ezine .a{margin-bottom:10px}
.wp-ezine a{color:#ff0}.wp-ezine a.wvis{color:#f9f}`,
    html: c => `<div class="ez-mast"><h1>BYTESIZE</h1><div class="ez-iss">THE E-ZINE FOR KIDS WITH MODEMS &middot; ISSUE #7 &middot; ${c.today} &middot; FREE (ALWAYS)</div></div>
<p><b>Editor's letter:</b> Welcome to issue 7! This month: an EXCLUSIVE interview with Gubbinz, the news, our reviews of the best homepages on the Web, and your letters (all three of them). Sorry this issue is late. The editor (me, ${Cast.n('club4')}) had a maths test. The maths test won.</p>
<table class="ez-toc"><tr><td>${c.spr('computer', 3)}<br><b>${c.s('news.html', 'NEWS')}</b><br>What's new on the Web this month</td><td>${c.spr('blob', 3)}<br><b>${c.s('interview.html', 'INTERVIEW')}</b> ${c.hot()}<br>We meet Gubbinz, your desktop pal</td></tr><tr><td>${c.spr('star', 3)}<br><b>${c.s('reviews.html', 'REVIEWS')}</b><br>Homepages, rated out of 5 floppies</td><td>${c.spr('floppy', 3)}<br><b>${c.s('letters.html', 'LETTERS')}</b><br>You wrote! (Three of you did.)</td></tr></table>
<p class="c">${c.s('back.html', 'Back issues')} &middot; ${c.mail('bytesize', 'Write to the editor')} ${c.gif('mail', 22)}</p>${c.ad(1)}${c.counterLine('Readers this issue:', 'odo')}${c.ring()}`,
  });
  const EZREAD = ['news.html', 'interview.html', 'reviews.html', 'letters.html'];
  const ezRead = (c, f) => { const r = store.get('jhp_web_ez', {}); r[f] = 1; store.set('jhp_web_ez', r); if (EZREAD.every(x => r[x])) c.secret('web.ezine'); };
  W.sub('ezine', {
    'news.html': { html: c => `<h2>NEWS</h2>${c.ticker(['E-cards are BIG this month', 'Webrings: now with biscuits', 'Hamster cam still going', 'Free web space in SpaceCity'])}<p><b>E-CARD CRAZE SWEEPS THE NET</b><br>Why send a card when you can send an e-card? ${c.a('ecardz', 'eCardz')} lets you send a dancing birthday cake to anyone who's online RIGHT NOW. Our reporter sent 14 to her nan. Her nan is not online. They're "in the computer somewhere".</p><p><b>NEW NEIGHBOURHOODS OPEN</b><br>${c.a('hoods', 'Homepagez')} has opened Grotville. Early residents report "lots of mud" and "a strong smell of gunge".</p><p><b>SKIP INTRO: A DEBATE</b><br>Are Flash intros amazing, or the reason the Skip Intro button was invented? We visited ${c.a('megaflash', 'MEGAFLASH 2000')} to find out. We are still watching it.</p>`, setup(el, c) { ezRead(c, 'news.html'); } },
    'interview.html': { html: c => `<h2>INTERVIEW: GUBBINZ, YOUR DESKTOP PAL</h2><p>${c.spr('blob', 3)} We caught up with JackNet's most famous desktop helper in a shoebox under Jack's desk.</p>${[['How did you get on the Internet?', 'It looked like you were trying to get on the Internet, so I offered to help. Then I pressed the big button. Then I was on it.'], ['What is your favourite website?', 'Jack\'s. Then the gem shop. Then Hamster Cam. I like watching the hamster run round and round. We have a lot in common.'], ['You run a search engine now. How does it work?', 'I have got spiders in a shoebox. They run about. When they stop, that is the result. That is how all the big search engines work. Probably.'], ['What do you think about the year 2000?', 'I am fully Y2K compliant. I do not know what a year is.'], ['Any message for our readers?', 'Save your work. Back up your saves. Send Rupees. WAAAGH!']].map(([q, a]) => `<div class="q">BYTESIZE: ${esc(q)}</div><div class="a">GUBBINZ: ${esc(a)}</div>`).join('')}<p class="small">Gubbinz was paid for this interview in Rupees. Three of them. He asked for four.</p>`, setup(el, c) { ezRead(c, 'interview.html'); } },
    'reviews.html': { html: c => `<h2>REVIEWS: HOMEPAGES OF THE MONTH</h2><table class="ez-toc">${[['~kim', 4, 'Glitter, charts and a slambook. Our eyes hurt. Worth it.'], ['~gaz', 3, 'Very worried about the Millennium Bug. The countdown clock is excellent.'], ['podracing', 5, 'Fast, loud and has a game in it. Full marks.'], ['~tom', 1, 'Coming soon. Since 1997. One floppy, for hope.'], ['hz-goldie', 5, 'We went quiet for a bit. A lovely page.']].map(([w, s, t]) => `<tr><td>${c.a(w)}<br>${c.spr('floppy', 2).repeat(s)}</td><td>${esc(t)}</td></tr>`).join('')}</table>`, setup(el, c) { ezRead(c, 'reviews.html'); } },
    'letters.html': { html: c => `<h2>LETTERS</h2><p><b>Dear Bytesize,</b> my modem connects at 28.8 when it says 56. Is it broken? - <i>${Cast.n('kidEp1')}</i><br><b>Ed:</b> No, that's just modems. Blame the phone line. Blame Mom being on the phone.</p><p><b>Dear Bytesize,</b> I am the best at Goldenballs in the school. - <i>Dave</i><br><b>Ed:</b> You are not. Jack has sent us the scores.</p><p><b>Dear Bytesize,</b> can you do a page about rocks. - <i>Kevin</i><br><b>Ed:</b> Kevin, you have a whole website about one rock.</p>${c.gb([], { title: 'Write a letter', ph: 'Dear Bytesize...', rate: false, btn: 'Send letter' })}`, setup(el, c) { ezRead(c, 'letters.html'); } },
    'back.html': c => `<h2>BACK ISSUES</h2><ul>${[1, 2, 3, 4, 5, 6].map(i => `<li>${i < 4 ? c.dead('www.bytesize.zyne/issue' + i + '/', 'Issue #' + i) + ' (lost when the hard drive died)' : c.dead('www.bytesize.zyne/issue' + i + '/', 'Issue #' + i)} - ${['our first issue! 2 pages!', 'the Eggbert special', 'the snow day issue', 'the Y2K worry issue', 'the summer holidays issue', 'the back to school issue'][i - 1]}</li>`).join('')}</ul><p class="small">Back issues are stored on floppy disks in a shoebox. The shoebox is now Gubbinz's search engine. Sorry.</p>`,
  });

  // ================================================================ eCardz (send to another visitor through Net.relay)
  const CARDART = {
    birthday: ['HAPPY BIRTHDAY!', '#ffe0f6', '#c0005a', '#fff -; cake 18 10; star 4 4; star 34 4', 'A dancing cake with candles'], squig: ['BOING! THINKING OF YOU!', '#e8ffe0', '#3a6a00', '#cfc #6a4; blob 8 10; blob 28 14 flip', 'Two Blobbits bouncing'],
    space: ['YOU ARE OUT OF THIS WORLD!', '#000033', '#ffe81f', '#000 -; planet 4 6; rocket 30 8; star 20 2', 'A rocket in space'], getwell: ['GET WELL SOON!', '#e8f4ff', '#036', '#cdf -; teapot 18 10; flower 4 12', 'A teapot and a flower'],
    thanks: ['THANK YOU!!!', '#fffbe0', '#7a5a00', '#ffd -; trophy 18 8', 'A gold trophy'], y2k: ['SEE YOU IN 2000!', '#111', '#3f3', '#000 -; computer 18 8; text 4 30 00:00:00', 'A computer at midnight'],
    saber: ['MAY THE FORCE BE WITH YOU', '#000', '#6f6', '#012 #333; kid 6 18; kid 30 18 flip swap=gr,bo', 'Two kids having a duel'], flowers: ['FLOWERS FOR YOU', '#f4fff0', '#a040c0', '#efe #3a3; flower 2 10; flower 18 10; flower 34 10', 'A row of flowers'],
  };
  const cardHtml = (c, k, text, from) => { const a = CARDART[k] || CARDART.squig; return `<div style="background:${a[1]};color:${a[2]};border:6px ridge ${a[2]};max-width:320px;margin:8px auto;padding:10px;text-align:center"><div style="font:bold 20px 'Comic Sans MS',cursive">${esc(a[0])}</div>${c.photo(a[3], '')}<div style="font:15px 'Comic Sans MS',cursive;white-space:pre-wrap">${esc(text || '')}</div>${from ? `<div class="small">from <b>${esc(from)}</b></div>` : ''}</div>`; };
  W.def('ecardz', {
    css: `.wp-ecardz{background:#fff0fa ${tile('<path d="M10 4l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="#ffd6ef"/>', 30)};color:#333;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-ecardz h1{font:bold 36px "Comic Sans MS",cursive;color:#c0005a;text-align:center;margin:4px 0}
.wp-ecardz .ec-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.wp-ecardz .ec-g label{display:block;border:2px solid #f6a;background:#fff;padding:4px;text-align:center;cursor:pointer;font-size:12px}
.wp-ecardz .ec-g input{display:block;margin:0 auto}
.wp-ecardz .ec-g .wphoto canvas{width:120px;height:90px}
.wp-ecardz form.ec-f{background:#fff;border:3px double #c0005a;padding:10px 14px;max-width:520px;margin:12px auto}
.wp-ecardz form.ec-f textarea,.wp-ecardz form.ec-f select{width:100%;box-sizing:border-box}
.wp-ecardz a{color:#c0005a}`,
    html: c => `<h1>${c.gif('mail', 40)} eCardz! ${c.gif('mail', 40)}</h1><p class="c"><b>Send a FREE animated e-card to a mate who is on JackNet right now!</b> They get it instantly. No stamps. No envelope. No licking.</p><div class="ec-g">${Object.keys(CARDART).map(k => `<label>${c.photo(CARDART[k][3], '')}<br><b>${esc(CARDART[k][0])}</b></label>`).join('')}</div><p class="c" style="font-size:18px"><b>${c.s('send.html', 'SEND A CARD NOW &raquo;')}</b> &middot; ${c.s('pickup.html', 'Pick up your cards')}</p>${c.ad(3)}${c.counterLine('Cards browsed:', 'flip')}`,
  });
  W.sub('ecardz', {
    'send.html': { html: c => `<h2 class="c">Send an E-Card</h2><form class="ec-f"><b>1. Pick a card</b><div class="ec-g">${Object.keys(CARDART).map((k, i) => `<label><input type="radio" name="card" value="${k}"${i ? '' : ' checked'}> ${esc(CARDART[k][0])}</label>`).join('')}</div><p><b>2. Write a message</b><br><textarea name="msg" maxlength="200" rows="3" placeholder="Happy birthday! Love from..."></textarea></p><p><b>3. Who to?</b> (people on JackNet right now)<br><select name="to"><option value="">Loading who's online...</option></select></p><p class="c"><button class="btn" type="submit">SEND MY E-CARD!</button></p><p class="c ec-msg small"></p></form><h3 class="c">Preview</h3><div class="ec-prev"></div>`,
      setup(el, c) {
        const f = el.querySelector('.ec-f'), sel = f.querySelector('select'), msg = el.querySelector('.ec-msg'), prev = el.querySelector('.ec-prev');
        const draw = () => { prev.innerHTML = cardHtml(c, f.card.value, f.msg.value, Net.me.nick); W.kitWire(prev, c, c); };
        f.addEventListener('change', draw); f.msg.addEventListener('input', () => { clearTimeout(f._t); f._t = setTimeout(draw, 300); }); draw();
        let people = [];
        const upd = m => { people = ((m && m.online) || []).filter(p => p.id !== Net.me.id); const cur = sel.value; sel.innerHTML = people.length ? people.map(p => `<option value="${p.id}">${esc(p.nick)}${p.member ? ' *' : ''}</option>`).join('') : '<option value="">Nobody else is online right now :(</option>'; if (cur) sel.value = cur; };
        Net.on('online', upd); upd({ online: W.online });
        f.addEventListener('submit', ev => { ev.preventDefault(); const to = +sel.value; if (!to) { msg.textContent = 'Nobody to send it to! Wait for someone to come online (or tell a mate to visit).'; return; } const who = (people.find(p => p.id === to) || {}).nick || 'them'; if (!Net.relay(to, 'web.ecard', { card: f.card.value, text: f.msg.value.slice(0, 200) })) { msg.textContent = 'Not connected to JackNet!'; return; } msg.textContent = 'SENT! ' + who + ' will get it right now. (Hope they like ' + CARDART[f.card.value][0].toLowerCase() + '.)'; Sound.play('solve'); c.secret('web.ecardsend'); });
      } },
    'pickup.html': { html: c => { const box = store.get('jhp_web_cards', []); return `<h2 class="c">Pick Up Your Cards</h2>${box.length ? box.map(e => cardHtml(c, e.card, e.text, e.from + ' on ' + W.tsDate(e.ts))).join('') : `<p class="c">No cards yet! Ask a mate to send you one from ${c.s('send.html', 'the Send page')}. (They have to be online at the same time as you.)</p>`}`; } },
  });

  // ================================================================ FreeToolz (counters, guestbooks, rainbow text, marquees)
  W.def('freetoolz', {
    css: `.wp-freetoolz{background:#eef ${tile('<path d="M0 10h20M10 0v20" stroke="#dde" />', 20)};color:#000;font:13px/1.45 Verdana,Arial,sans-serif}
.wp-freetoolz h1{font:bold 30px "Arial Black",Arial,sans-serif;color:#000080;margin:0 0 6px}
.wp-freetoolz .ft-box{background:#fff;border:1px solid #000080;padding:10px;margin:10px 0}
.wp-freetoolz textarea.code{width:100%;box-sizing:border-box;font:12px "Courier New",monospace;height:64px}
.wp-freetoolz .ft-prev{border:2px dashed #999;padding:10px;margin:8px 0;min-height:30px;text-align:center}
.wp-freetoolz a{color:#00c}`,
    html: c => `<h1>FreeToolz ${c.gif('new')}</h1><p><b>Everything your homepage needs. All FREE!!!</b> Just copy the code and paste it into your page in Notepad. (Then save. Then refresh. Then wonder why it doesn't work. Then add a &lt;/table&gt;.)</p><div class="ft-box">${c.spr('computer', 3)} <b>${c.s('counters.html', 'Hit Counters')}</b> - 11 styles! Start at any number (we won't tell).</div><div class="ft-box">${c.gif('mail', 26)} <b>${c.s('guestbooks.html', 'Guestbooks')}</b> - let visitors sign your site.</div><div class="ft-box"><b>${c.rainbow('Rainbow Text')}</b> - ${c.s('rainbow.html', 'make your words every colour')}.</div><div class="ft-box"><marquee scrollamount="3" style="width:200px;display:inline-block;vertical-align:middle">Marquee Maker</marquee> - ${c.s('marquee.html', 'scrolling text, the easy way')}.</div>${c.ad(4)}${c.counterLine('Webmasters helped:', 'odo')}`,
  });
  W.sub('freetoolz', {
    'counters.html': { html: c => `<h2>Free Hit Counters</h2><div class="ft-box"><label>Style: <select class="ct-st">${['odo', 'led', 'green', 'flip', 'gold', 'plain', 'words', 'roman', 'bin', 'hex', 'tally'].map(s => `<option>${s}</option>`).join('')}</select></label> <label>Start at: <input type="text" class="ct-n" value="1999" size="8" inputmode="numeric"></label><div class="ft-prev"></div><b>Your code:</b><textarea class="code" readonly></textarea><p class="small">Tip: everybody starts their counter at 1,000 so it looks like lots of people have been. We know. We all know.</p></div>`,
      setup(el) { const st = el.querySelector('.ct-st'), n = el.querySelector('.ct-n'), pv = el.querySelector('.ft-prev'), code = el.querySelector('.code'); const up = () => { const v = Math.max(0, Math.min(9999999, parseInt(n.value, 10) || 0)); pv.innerHTML = `<span class="wctr wctr-${st.value}">${W.fmtCounter(st.value, v, 6)}</span>`; code.value = `<!-- FreeToolz counter -->\n<img src="http://www.freetoolz.w3b/cgi-bin/count.cgi?style=${st.value}&start=${v}&id=${W.vh().slice(1, 7)}" alt="counter">`; }; st.addEventListener('change', up); n.addEventListener('input', up); up(); } },
    'guestbooks.html': c => `<h2>Free Guestbooks</h2><div class="ft-box"><p><b>SORRY!</b> Guestbook hosting is <b>FULL</b>. Our server is a computer under a desk and its hard drive is completely full of guestbooks. (Mostly people writing "cool site" and "first!!!") Please try again in 6 to 8 weeks.</p><p>In the meantime, here's our DEMO guestbook. Sign it to see how it works! Everyone on JackNet can see it, live.</p></div>${c.gb([['FreeToolz', c.daysAgo(30), 'This is a demo entry. Hello!', 5], ['Dave', c.daysAgo(12), 'first!!!', 1]], { title: 'Demo Guestbook', ph: 'Try it out!' })}`,
    'rainbow.html': { html: c => `<h2>${c.rainbow('Rainbow Text Maker')}</h2><div class="ft-box"><input type="text" class="rb-in" value="WELCOME TO MY HOMEPAGE" maxlength="60" style="width:100%;box-sizing:border-box"><div class="ft-prev rb-out" style="font:bold 20px Arial,sans-serif"></div><b>Your code:</b><textarea class="code" readonly></textarea><p class="small">Warning: rainbow text on a tiled background may cause headaches. That is the point.</p></div>`,
      setup(el, c) { const i = el.querySelector('.rb-in'), o = el.querySelector('.rb-out'), code = el.querySelector('.code'); const up = () => { const h = c.rainbow(i.value); o.innerHTML = h; code.value = h; }; i.addEventListener('input', up); up(); } },
    'marquee.html': { html: c => `<h2>Marquee Maker</h2><div class="ft-box"><input type="text" class="mq-t" value="*** WELCOME TO MY PAGE *** SIGN MY GUESTBOOK ***" maxlength="80" style="width:100%;box-sizing:border-box"><p><label>Speed: <select class="mq-s"><option>2</option><option selected>6</option><option>12</option><option>25</option></select></label> <label>Direction: <select class="mq-d"><option>left</option><option>right</option></select></label> <label>Behaviour: <select class="mq-b"><option>scroll</option><option>alternate</option><option>slide</option></select></label> <label>Colour: <select class="mq-c"><option>#ff0000</option><option>#0000ff</option><option>#008000</option><option>#ff00ff</option></select></label></p><div class="ft-prev mq-o"></div><b>Your code:</b><textarea class="code" readonly></textarea></div>`,
      setup(el) { const q = s => el.querySelector(s); const up = () => { const h = `<marquee scrollamount="${q('.mq-s').value}" direction="${q('.mq-d').value}" behavior="${q('.mq-b').value}"><font color="${q('.mq-c').value}"><b>${esc(q('.mq-t').value)}</b></font></marquee>`; q('.mq-o').innerHTML = h; q('.code').value = h; }; el.querySelectorAll('input,select').forEach(x => x.addEventListener('input', up)); el.querySelectorAll('select').forEach(x => x.addEventListener('change', up)); up(); } },
  });
})();
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile, M = W.M, A = window.Apps, store = A.store;

  // ================================================================ ChatterBox: four live chat rooms
  const ROOMS = { lobby: ['The Lobby', 'Say hello! Everyone starts here.', '#09c'], games: ['Games Room', 'Cheats, high scores and arguments about consoles.', '#c06'], pets: ['Pets Corner', 'Hamsters, dogs, cats, rocks. All pets welcome.', '#393'], homework: ['Homework Help', 'Ask for help with homework. (Nobody will help. But ask anyway.)', '#963'] };
  const chatRoom = r => ({ html: c => `<h2 style="margin:0 0 4px;color:${ROOMS[r][2]}">#${r} - ${esc(ROOMS[r][0])}</h2><p class="small">${esc(ROOMS[r][1])} Be nice. No CAPITALS. No asking where people live.</p><div class="cb-log" aria-live="polite"><div class="cb-sys">*** Connecting to ChatterBox server...</div></div><form class="cb-f" autocomplete="off"><input type="text" maxlength="140" placeholder="Type here and press Enter" aria-label="Message"><button class="btn" type="submit">Say</button></form>`,
    setup(el, c) {
      const K = 'web.cb.' + r, log = el.querySelector('.cb-log'), inp = el.querySelector('input'); let last = 0;
      const line = (e, sys) => { const d = document.createElement('div'); if (sys) { d.className = 'cb-sys'; d.textContent = '*** ' + e; } else { d.innerHTML = `<span class="small">[${W.tsTime(e.ts)}]</span> <b style="color:${esc(e.col || '#000')}">&lt;${esc(e.by)}&gt;</b> ${esc(e.text)}`; } log.appendChild(d); log.scrollTop = log.scrollHeight; };
      c.get([K]).then(v => { (Array.isArray(v[K]) ? v[K] : []).forEach(e => line(e)); line('You have joined #' + r + '. Say hi!', 1); });
      c.watch(K, ev => { if (ev.type === 'push') { line(ev.e); if (ev.e.by !== Net.me.nick) Sound.play('click'); } });
      el.querySelector('.cb-f').addEventListener('submit', ev => { ev.preventDefault(); const t = inp.value.trim(); if (!t) return; if (Date.now() - last < 5500) return line('Slow down! One message every 5 seconds.', 1); if (t === t.toUpperCase() && /[A-Z]{6}/.test(t)) return line('No shouting please. (Caps Lock!)', 1); if (!Net.kv.push(K, t)) return line('Not connected.', 1); last = Date.now(); inp.value = ''; const rr = store.get('jhp_web_rooms', {}); rr[r] = 1; store.set('jhp_web_rooms', rr); if (Object.keys(rr).length >= 3) c.secret('web.rooms'); });
    } });
  W.def('chatterbox', {
    css: `.wp-chatterbox{background:#e8f6ff;color:#000;font:13px/1.45 Verdana,Arial,sans-serif}
.wp-chatterbox h1{font:bold 30px "Arial Black",Arial,sans-serif;color:#09c;margin:0}
.wp-chatterbox .cb-log{height:260px;overflow:auto;background:#fff;border:2px inset #ccc;padding:6px;font:13px Arial,sans-serif}
.wp-chatterbox .cb-sys{color:#888;font-style:italic}
.wp-chatterbox .cb-f{display:flex;gap:4px;margin-top:6px}.wp-chatterbox .cb-f input{flex:1;min-width:0}
.wp-chatterbox table.cb-r{width:100%;border-collapse:separate;border-spacing:4px}.wp-chatterbox .cb-r td{border:1px solid #09c;padding:6px;background:#fff;vertical-align:top}`,
    html: c => `<h1>ChatterBox</h1><p><b>Live chat rooms!</b> Talk to real people on JackNet, right now. Pick a room.</p>${c.applet('ticker', 420, 40, { text: 'WELCOME TO CHATTERBOX *** 4 ROOMS *** BE NICE *** NO SHOUTING *** HAVE FUN ***' })}<table class="cb-r">${Object.keys(ROOMS).map(r => `<tr><td style="width:40%"><b>${c.s(r + '.html', '#' + r)}</b></td><td>${esc(ROOMS[r][1])}</td></tr>`).join('')}</table><p class="small">Chat rules: 1. Be nice. 2. Never tell anyone your real name, address, school or phone number. 3. If someone makes you feel funny, leave the room and tell a grown-up. 4. a/s/l? = no.</p>${c.ad(13)}${c.counterLine('Chatters:', 'led')}`,
  });
  W.sub('chatterbox', { 'lobby.html': chatRoom('lobby'), 'games.html': chatRoom('games'), 'pets.html': chatRoom('pets'), 'homework.html': chatRoom('homework') });

  // ================================================================ MAKE MONEY FAST (it's a paper round)
  W.def('getrich', {
    css: `.wp-getrich{background:#000 ${tile('<text x="4" y="22" font-size="18" font-family="Arial" fill="#0a2a0a">&#163;</text>', 32)};color:#0f0;font:bold 15px/1.5 Arial,sans-serif;text-align:center}
.wp-getrich h1{font:bold 40px Impact,sans-serif;color:#ff0;text-shadow:0 0 12px #0f0;margin:6px 0}
.wp-getrich .gr-big{font-size:22px;color:#fff}
.wp-getrich .gr-box{border:4px dashed #ff0;padding:10px;margin:12px auto;max-width:560px;background:#010}
.wp-getrich .gr-cash{font:bold 34px "Courier New",monospace;color:#0f0}
.wp-getrich .gr-btn{font:bold 22px Impact,sans-serif;padding:10px 26px;background:#ff0;color:#000;border:4px outset #ffa;cursor:pointer;animation:wnew .7s steps(2) infinite}
.wp-getrich .gr-small{font:11px Arial,sans-serif;color:#9c9}
.wp-getrich a{color:#ff0}`,
    html: c => `${c.status('$$$ MAKE MONEY FAST $$$ WORK FROM HOME $$$ NO EXPERIENCE NEEDED $$$ (this is a joke page) $$$')}${c.popauto('getrich')}<h1>&#163;&#163;&#163; MAKE MONEY FAST!!! &#163;&#163;&#163;</h1><p class="gr-big">${c.rainbow('FROM YOUR OWN BEDROOM!!!')}</p><div class="gr-box">I made <span class="gr-cash">&#163;0.00</span> in ONE WEEK<br>using this ONE SIMPLE SECRET!!!<br><span class="gr-small">(the number is going up. watch it. WATCH IT.)</span></div>
<p>Are you TIRED of not having enough pocket money?<br>Do you WANT the new game but your Mom says "Christmas"?<br>THEN THIS PAGE IS FOR YOU!!!</p>
<p><button class="gr-btn" type="button" data-wp="getrich/secret.html">TELL ME THE SECRET!!!</button></p>
<p>${c.s('testimonials.html', 'Read what our happy customers say')} ${c.hot()}</p>
<div class="gr-box gr-small" style="color:#fff">IMPORTANT: this is a JOKE page. Real "get rich quick" pages on the Internet are fibs. Never send money (or Rupees) to strangers on the Internet, and never type in your Mom's card number. Ever.</div>${c.counterLine('Future millionaires:', 'gold')}`,
    setup(el, c) { const cash = el.querySelector('.gr-cash'); let v = 0; c.every(() => { v += Math.random() * 0.03; cash.textContent = '\u00a3' + v.toFixed(2); }, 300); },
  });
  W.POPS.getrich = { title: 'WAIT!!! SPECIAL OFFER!!!', url: 'http://www.getrichquick.w3b/offer.html', w: 300, h: 250, style: 'background:#000;color:#ff0;font:bold 15px Arial,sans-serif', html: '<p style="font:bold 22px Impact,sans-serif;color:#0f0">WAIT!!! DON\'T GO!!!</p><p>Get THE SECRET for only 4 Rupees!!! (normally 5 Rupees)</p><p style="font-size:12px;color:#fff">(It is still a paper round.)</p><p><a data-wp="getrich/secret.html">YES PLEASE</a> &middot; <a data-close="1">No thanks</a></p>' };
  W.sub('getrich', {
    'secret.html': { html: c => `<h1>THE SECRET</h1><div class="gr-box gr-big">Are you ready?<br><br>The secret to making money fast is...<br><br><span style="color:#ff0;font-size:32px">GET A PAPER ROUND.</span></div><p>Or wash the car. Or help next door with their garden. Or do extra chores (ask first). Then <b>SAVE IT</b>. If you save &#163;1 a week, in a year you have &#163;52! That's a game AND a magazine!</p><p class="gr-small">That's it. That's the whole secret. There is no other secret. Every page that says there is another secret is fibbing.</p><p>${c.a('getrich', 'Back')}</p>`, setup(el, c) { c.secret('web.money'); } },
    'testimonials.html': c => `<h1>HAPPY CUSTOMERS!!!</h1>${[['Dave, aged "old enough"', 'I read the secret and now I have a paper round. I am RICH. (I have &#163;6.)', 'dave_rich.jpg'], ['Gubbinz, Grotville', 'It looked like I was trying to get rich. I got a leaflet about a paper round. 2 stars.', 'gubbinz_angry.gif'], [Cast.n('cousin'), 'I washed my Mom\'s car and got &#163;2!!! Spent it on glitter. Worth it.', Cast.slug('cousin') + '_car.jpg']].map(([n, t, f]) => `<div class="gr-box">${c.broken(f, 120, 90)}<br>"${t}"<br><span class="gr-small">- ${n}</span></div>`).join('')}`,
  });

  // ================================================================ THE CUSTARD FILES
  const RED = s => s.replace(/\[\[(.+?)\]\]/g, (m, t) => `<span class="rd" role="button" tabindex="0" title="CLASSIFIED (click)">${t}</span>`);
  W.def('custard', {
    css: `.wp-custard{background:#000;color:#3f3;font:14px/1.55 "Courier New",monospace}
.wp-custard .cf-sp{min-height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px}
.wp-custard .cf-t{font:bold 40px "Courier New",monospace;letter-spacing:6px;animation:cfflick 3s infinite;text-shadow:0 0 8px #0f0}
@keyframes cfflick{0%,92%,100%{opacity:1}93%{opacity:.2}95%{opacity:.9}97%{opacity:.3}}
.wp-custard .wenter{color:#3f3}
.wp-custard h2{color:#fff;border-bottom:1px solid #3f3}
.wp-custard .rd{background:#3f3;color:#3f3;cursor:pointer;padding:0 2px}.wp-custard .rd.on{background:transparent;color:#ff0;text-decoration:underline dotted}
.wp-custard .cf-doc{background:#e8e0c8;color:#222;padding:14px 18px;max-width:600px;margin:10px auto;font:13px/1.6 "Courier New",monospace;border:1px solid #888;box-shadow:4px 4px 0 #3f3}
.wp-custard .cf-doc .rd{background:#000;color:#000}.wp-custard .cf-doc .rd.on{background:transparent;color:#a00}
.wp-custard .cf-stamp{display:inline-block;border:3px solid #c00;color:#c00;font:bold 20px Impact,sans-serif;padding:2px 10px;transform:rotate(-8deg)}
.wp-custard table{width:100%}.wp-custard td{border:1px solid #3f3;padding:4px 8px;vertical-align:top}
.wp-custard a{color:#ff0}`,
    html: c => `<div class="cf-sp">${c.status('THE TRUTH IS IN HERE... THE TRUTH IS IN HERE... TRUST NO DINNER...')}${c.spr('ufo', 6)}<div class="cf-t">THE CUSTARD FILES</div><div>THE TRUTH IS IN HERE</div>${c.enter('custard/main.html', 'ENTER')}<div class="small">Best viewed with the lights off. Do NOT show this page to a dinner lady.</div></div>`,
  });
  W.sub('custard', {
    'main.html': c => `<h2>THE CUSTARD FILES: MAIN MENU</h2><p>Agents: <b>Agent J</b> and <b>Agent D</b> (Jack and Dave). We investigate the unexplained mysteries of school, home and the universe. Mostly school.</p><table><tr><td>${c.s('case1.html', 'CASE #1: THE SKIN')}</td><td>Why does school custard have a skin on it?</td></tr><tr><td>${c.s('case2.html', 'CASE #2: THE SOCKS')}</td><td>Where do the odd socks go?</td></tr><tr><td>${c.s('case3.html', 'CASE #3: THE TEACHER WHO NEVER EATS')}</td><td>Has anyone EVER seen Mr Peters eat?</td></tr><tr><td>${c.s('evidence.html', 'EVIDENCE ROOM')} ${c.hot()}</td><td>Classified documents. Some bits are blacked out. Click them.</td></tr></table><p>${c.applet('stars', 400, 80)}</p><p>Our motto: TRUST NO DINNER. (Except chips. Chips are fine.)</p>${c.counterLine('Agents who have entered:', 'green')}${c.ring()}`,
    'case1.html': c => `<h2>CASE #1: THE SKIN</h2><p><b>THE MYSTERY:</b> Every day at school, the custard has a skin on top. Thick. Wobbly. It peels off in one piece.</p><p><b>THE OFFICIAL EXPLANATION:</b> When hot custard cools, the top dries out and the milk proteins and starch make a skin. (Sir told us this. Sir also says he "loves the skin". Sir cannot be trusted.)</p><p><b>OUR THEORY:</b> The skin is a LID. To keep the truth IN.</p><p><b>EVIDENCE:</b> ${c.broken('custard_skin_closeup.jpg', 160, 110, '#ffd -; text 4 18 SKIN')}</p><p><b>STATUS:</b> <span class="cf-stamp">UNSOLVED</span></p><p>${c.s('main.html', '&laquo; Main menu')}</p>`,
    'case2.html': c => `<h2>CASE #2: THE SOCKS</h2><p><b>THE MYSTERY:</b> Two socks go in the washing machine. One sock comes out.</p><table><tr><td>Date</td><td>Sock lost</td><td>Agent's notes</td></tr><tr><td>${c.daysAgo(40)}</td><td>Blue football sock</td><td>Last seen entering machine</td></tr><tr><td>${c.daysAgo(22)}</td><td>One of Dad's (grey)</td><td>Dad blames me</td></tr><tr><td>${c.daysAgo(9)}</td><td>Christmas sock with a reindeer</td><td>It's not even Christmas</td></tr></table><p><b>THEORIES:</b> 1. The machine eats them. 2. A parallel dimension. 3. Dave's bedroom (which is basically a parallel dimension).</p><p><b>STATUS:</b> <span class="cf-stamp">ONGOING</span> &middot; ${c.s('main.html', 'Main menu')}</p>`,
    'case3.html': c => `<h2>CASE #3: THE TEACHER WHO NEVER EATS</h2><p><b>THE MYSTERY:</b> In three years, NOBODY has seen Mr Peters eat anything. Not at lunch. Not at the school trip. Not at the Christmas fair.</p><p><b>SIGHTINGS LOG:</b></p><table><tr><td>Mug of tea</td><td>Seen 400+ times</td></tr><tr><td>A biscuit</td><td>Seen ONCE, in his hand. He did not eat it. He put it back.</td></tr><tr><td>Lunchbox</td><td>Never</td></tr></table><p><b>CONCLUSION:</b> Mr Peters runs on tea. Possibly he IS tea. Agent D thinks he is a robot. Agent J thinks he just eats before school like a normal person. Agent D says "that's what a robot would want you to think".</p><p><span class="cf-stamp">INVESTIGATING</span> &middot; ${c.s('main.html', 'Main menu')}</p>`,
    'evidence.html': { html: c => `<h2>THE EVIDENCE ROOM</h2><p>These documents were found in the bin behind the kitchen. Parts have been blacked out. <b>Click the black bits to uncover them.</b></p><div class="cf-doc"><div class="c"><span class="cf-stamp">TOP SECRET</span></div><br>MEMO: ${RED('From the kitchen to [[the head teacher]]')}<br><br>${RED('Re: the custard. As agreed, the custard will be served at [[exactly 12:15]] every day. The skin must be [[at least 2mm thick]]. Nobody must find out about the [[extra sugar]].')}<br><br>${RED('The secret ingredient is [[a pinch of nutmeg]]. Do NOT tell [[Agent D]]. He will put it on his website.')}<br><br>${RED('P.S. Mr Peters has asked for [[more tea]] again. That is his [[fourteenth cup]].')}</div><p class="c cf-n small"></p><p>${c.s('main.html', '&laquo; Main menu')}</p>`,
      setup(el, c) { const rd = [...el.querySelectorAll('.rd')], n = el.querySelector('.cf-n'); const up = () => { const k = rd.filter(r => r.classList.contains('on')).length; n.textContent = k + ' of ' + rd.length + ' uncovered.' + (k === rd.length ? ' THE TRUTH IS OUT! (It was nutmeg.)' : ''); if (k === rd.length) c.secret('web.redacted'); }; rd.forEach(r => { const go = () => { if (r.classList.contains('on')) return; r.classList.add('on'); Sound.play('click'); up(); }; r.addEventListener('click', go); r.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); }); up(); } },
  });

  // ================================================================ Adopt-a-Pixel (the pet then lives on your desktop)
  const PETS = [['blob', 'Wibble', 'Friendly. Wobbly. Will eat anything (it is a blob).'], ['bat', 'Squeaky', 'Sleeps all day, plays all night. Like a teenager.'], ['fish', 'Bubbles', 'Very calm. Says nothing. Swims round and round.'], ['dragon', 'Ember', 'Tiny dragon. Breathes very small fire. Mostly sneezes.'], ['robot', 'Unit 7', 'Beeps when happy. Beeps when sad. Beeps.'], ['squig', 'Chompy', 'Bouncy. Bitey. Gubbinz says do NOT adopt. Adopt.']];
  W.def('adopt', {
    css: `.wp-adopt{background:#fffbe6 ${tile('<path d="M8 12c-4-4 0-8 4-4 4-4 8 0 4 4l-4 4z" fill="#ffe0e0"/>', 26)};color:#333;font:14px/1.5 "Comic Sans MS",cursive}
.wp-adopt h1{font:bold 34px "Comic Sans MS",cursive;color:#e8381b;text-align:center;margin:4px 0}
.wp-adopt .ap-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.wp-adopt .ap-p{background:#fff;border:3px solid #e8381b;border-radius:12px;padding:8px;text-align:center}
.wp-adopt .ap-p canvas{width:72px;height:72px;display:block;margin:0 auto}
.wp-adopt a{color:#c00}`,
    html: c => `<h1>Adopt-a-Pixel!</h1><p class="c">These little pixel pets need a loving home! Adopt one and it will move onto your <b>computer desktop</b>, where you can feed it and play with it. ${c.newb()}</p><div class="ap-g">${PETS.map(p => `<div class="ap-p">${c.spr(p[0], 6)}<br><b>${p[1]}</b><br><span class="small">${p[2]}</span></div>`).join('')}</div><p class="c" style="font-size:20px"><b>${c.s('adopt.html', 'ADOPT ONE NOW &raquo;')}</b></p>${c.counterLine('Pet lovers:', 'flip')}${c.ring()}`,
  });
  W.sub('adopt', {
    'adopt.html': { html: c => { const cur = store.get('jhp_web_pet', null); return `<h2 class="c">Adopt a Pet</h2>${cur ? `<p class="c">You already have <b>${esc(cur.name)}</b>! Look on your desktop. (Adopting a new one will send ${esc(cur.name)} back to the rescue centre, where they will be very well looked after.)</p>` : ''}<div class="ap-g">${PETS.map((p, i) => `<label class="ap-p">${c.spr(p[0], 6)}<br><input type="radio" name="pk" value="${i}"${i ? '' : ' checked'}> <b>${p[1]}</b></label>`).join('')}</div><p class="c">Give your pet a name: <input type="text" class="ap-n" maxlength="14" value="${esc(PETS[0][1])}"> <button class="btn ap-go" type="button">ADOPT!</button></p><p class="c ap-msg"></p>`; },
      setup(el, c) { const nm = el.querySelector('.ap-n'); el.querySelectorAll('[name=pk]').forEach(r => r.addEventListener('change', () => { nm.value = PETS[+r.value][1]; }));
        el.querySelector('.ap-go').addEventListener('click', () => { const p = PETS[+el.querySelector('[name=pk]:checked').value], name = nm.value.trim().replace(/[<>]/g, '') || p[1]; store.set('jhp_web_pet', { kind: p[0], name, born: c.today, fed: Date.now(), played: Date.now() }); W.petDesk(); A.fs.add('C:/My Documents', { name: 'Adoption certificate - ' + name + '.txt', type: 'txt', date: c.today, size: '1 KB', text: `ADOPT-A-PIXEL! CERTIFICATE OF ADOPTION\n======================================\n\nThis is to certify that\n\n    ${name} (a ${p[0]})\n\nhas been adopted on ${c.today} and now lives on this computer's desktop.\n\nPlease feed ${name} regularly and play with them every day.\nPixels need love too.\n\n- The Adopt-a-Pixel Rescue Centre, www.adoptapixel.kidz\n` }); c.secret('web.adopt'); Sound.play('solve'); el.querySelector('.ap-msg').innerHTML = `<b>${esc(name)}</b> has moved onto your desktop! Look for the new icon. (There's an adoption certificate in My Documents too.)`; Desk.toast('Adopt-a-Pixel!', name + ' has moved onto your desktop!', 4000); }); } },
    'care.html': c => `<h2 class="c">Pet Care</h2><ul><li><b>Feed</b> your pet when its hunger bar goes red. Pixel pets get hungry about every hour.</li><li><b>Play</b> with your pet every day or it gets bored and sulks (it turns slightly grey, emotionally).</li><li><b>Pat</b> your pet. It does nothing useful but it makes them happy.</li><li>Pixel pets never get ill, never need the vet and never chew your shoes. They are the perfect pet. Except they are made of pixels.</li><li>Lost your pet? Double-click its icon on the desktop, or type <b>mypet</b> into Start &gt; Run.</li></ul>`,
  });

  // ================================================================ MEGAFLASH 2000 (needs JackFlash Player 4)
  W.def('megaflash', {
    css: `.wp-megaflash{background:#000;color:#fff;font:14px/1.5 Arial,sans-serif;text-align:center}
.wp-megaflash .mf-stage{position:relative;height:420px;max-width:760px;margin:0 auto;background:#000;overflow:hidden;border:1px solid #222}
.wp-megaflash canvas{width:100%;height:100%;display:block}
.wp-megaflash .mf-skip{position:absolute;right:8px;bottom:8px;font:bold 12px Arial,sans-serif;color:#888;text-decoration:underline;cursor:pointer;background:none;border:0}
.wp-megaflash .mf-skip:hover{color:#fff}
.wp-megaflash .mf-enter{position:absolute;left:50%;top:70%;transform:translateX(-50%);display:none}
.wp-megaflash h1{font:bold 48px "Arial Black",Impact,sans-serif;letter-spacing:6px;background:linear-gradient(90deg,#0ff,#f0f,#ff0);-webkit-background-clip:text;background-clip:text;color:transparent;margin:20px 0}
.wp-megaflash a{color:#0ff}`,
    html: c => store.get('jhp_web_flash', 0) ? `<div class="mf-stage"><canvas width="380" height="210"></canvas><button class="mf-skip" type="button">SKIP INTRO &gt;&gt;</button><a href="#" class="wenter mf-enter" data-wp="megaflash/main.html" style="color:#0ff">ENTER</a></div><p class="small">Turn your speakers UP. ${c.s('main.html', 'Skip to the HTML site')}</p>` : `<h1>MEGAFLASH 2000</h1>${c.plugin('amazing intro', 200)}<p>You need <b>JackFlash Player 4</b> to experience MEGAFLASH 2000.</p><p>${c.s('plugin.html', 'Get JackFlash Player 4')} &middot; ${c.s('main.html', 'Enter the boring HTML version')}</p>`,
    setup(el, c) {
      const cv = el.querySelector('canvas'); if (!cv) return;
      const g = cv.getContext('2d'), Wd = 380, H = 210, skip = el.querySelector('.mf-skip'), enter = el.querySelector('.mf-enter');
      const words = ['WELCOME', 'TO', 'THE', 'FUTURE', 'OF', 'THE', 'WEB', 'MEGA', 'FLASH', '2000'];
      let t = 0, done = false; const stars = Array.from({ length: 80 }, () => [Math.random() * Wd - Wd / 2, Math.random() * H - H / 2, Math.random() * Wd]);
      if (Sound.on) c.music('web-rave');
      skip.addEventListener('click', () => { c.secret('web.skipintro'); c.stopMusic(); W.open('megaflash/main.html'); });
      c.anim(dt => {
        if (done) return; t += dt;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, Wd, H);
        g.fillStyle = '#fff'; stars.forEach(s => { s[2] -= 160 * dt * (1 + t / 6); if (s[2] < 1) { s[2] = Wd; } const k = 100 / s[2]; g.fillRect(Wd / 2 + s[0] * k, H / 2 + s[1] * k, 1.5, 1.5); });
        const i = Math.floor(t / 1.6), f = (t % 1.6) / 1.6;
        if (i < words.length) {
          const sz = 10 + f * 70; g.save(); g.translate(Wd / 2, H / 2); g.rotate((1 - f) * (i % 2 ? 0.6 : -0.6)); g.globalAlpha = f < 0.8 ? 1 : (1 - f) * 5;
          g.fillStyle = ['#0ff', '#f0f', '#ff0', '#0f0'][i % 4]; g.font = `bold ${sz}px Arial Black, Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(words[i], 0, 0); g.restore();
          // the lens flare that every 1999 intro had
          const fx = Wd * (0.2 + f * 0.6), fy = H * 0.3; const grd = g.createRadialGradient(fx, fy, 0, fx, fy, 40); grd.addColorStop(0, 'rgba(255,255,255,.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(fx - 40, fy - 40, 80, 80);
          [0.3, 0.55, 0.8].forEach((k, j) => { g.strokeStyle = `rgba(${j ? '0,255,255' : '255,0,255'},.4)`; g.beginPath(); g.arc(fx + (Wd / 2 - fx) * k * 2, fy + (H / 2 - fy) * k * 2, 6 + j * 6, 0, 7); g.stroke(); });
        } else { g.fillStyle = '#fff'; g.font = 'bold 14px Arial'; g.textAlign = 'center'; g.fillText('LOADING EXPERIENCE... ' + Math.min(100, Math.floor((t - words.length * 1.6) * 40)) + '%', Wd / 2, H / 2); if (t > words.length * 1.6 + 2.6) { done = true; enter.style.display = 'block'; skip.style.display = 'none'; c.secret('web.fullintro'); g.font = 'bold 30px Arial Black, Impact'; g.fillStyle = '#0ff'; g.fillText('MEGAFLASH 2000', Wd / 2, H / 2 - 30); } }
      });
    },
  });
  W.POPS.megaflash = { title: 'BOOKMARK US!!!', url: 'http://www.megaflash.cyb/bookmark.html', w: 280, h: 200, style: 'background:#000;color:#0ff;font:bold 14px Arial,sans-serif', html: '<p style="font-size:18px">THANK YOU FOR EXPERIENCING<br>MEGAFLASH 2000!!!</p><p>Press Ctrl+D to bookmark us NOW!</p><p><a data-close="1" style="color:#ff0">OK</a></p>' };
  W.sub('megaflash', {
    'main.html': c => `${c.popauto('megaflash')}<h1>MEGAFLASH 2000</h1><p style="font-size:22px">Welcome.</p><p>&nbsp;</p><p class="small">(That's it. The site was the intro. We spent all our time on the intro.)</p><p>${c.a('megaflash', 'Watch the intro again')} &middot; ${c.dead('www.megaflash.cyb/portfolio/', 'Our Portfolio')} &middot; ${c.dead('www.megaflash.cyb/contact/', 'Contact')}</p>${c.counterLine('Experiencers:', 'led')}${c.ring()}`,
    'plugin.html': { html: c => `<h1 style="font-size:30px">Get JackFlash Player 4</h1><p>JackFlash Player 4 lets you see amazing animated intros, spinning logos and dancing things all over the Web!</p><table style="margin:10px auto;border:1px solid #0ff;border-collapse:separate;border-spacing:6px;color:#fff"><tr><td>File:</td><td>jflash4.exe</td></tr><tr><td>Size:</td><td>1.4 MB (about 6 minutes on a 56K modem)</td></tr><tr><td>For:</td><td>JackOS 98, JackNet Explorer 4+</td></tr></table>${store.get('jhp_web_flash', 0) ? '<p style="color:#0f0">JackFlash Player 4 is already installed! Go and see ' + c.a('megaflash', 'MEGAFLASH 2000') + '.</p>' : '<p><button class="btn pl-go" type="button">DOWNLOAD NOW (FREE!)</button></p><table class="pl-bar" style="margin:8px auto;width:300px;max-width:90%;border:2px solid #0ff;display:none"><tr><td style="padding:0;height:16px"><div style="height:16px;width:0;background:#0ff" class="pl-fill"></div></td></tr></table><p class="pl-st small"></p>'}`,
      setup(el, c) { const go = el.querySelector('.pl-go'); if (!go) return; go.addEventListener('click', () => { go.disabled = true; el.querySelector('.pl-bar').style.display = ''; const fill = el.querySelector('.pl-fill'), st = el.querySelector('.pl-st'); let p = 0; const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); p += 2 + Math.random() * 6; fill.style.width = Math.min(100, p) + '%'; st.textContent = p < 100 ? `Downloading jflash4.exe... ${Math.round(Math.min(p, 100) * 14.3)} KB of 1,430 KB` : 'Installing JackFlash Player 4...'; if (p >= 130) { clearInterval(t); store.set('jhp_web_flash', 1); c.secret('web.plugin'); Sound.play('solve'); st.innerHTML = 'JackFlash Player 4 has been installed! ' + c.a('megaflash', 'Go to MEGAFLASH 2000 now!'); } }, 200); }); } },
  });

  // ================================================================ YOU HAVE WON!!! (a joke page with a lesson)
  W.def('winbig', {
    css: `.wp-winbig{background:#ff0 repeating-conic-gradient(#ff0 0 15deg,#ffb000 15deg 30deg) 50% 0/100% 900px;color:#c00;font:bold 16px/1.5 Arial,sans-serif;text-align:center}
.wp-winbig h1{font:bold 44px Impact,sans-serif;color:#e10600;text-shadow:3px 3px #fff,6px 6px #000;animation:wnew .4s steps(2) infinite;margin:10px 0;background:none}
.wp-winbig .wb-b{background:#fff;border:6px dashed #e10600;padding:12px;max-width:520px;margin:12px auto;color:#000}
.wp-winbig .wb-shirt{width:200px;height:180px;margin:10px auto;position:relative}
.wp-winbig a{color:#00e}`,
    html: c => `<h1>CONGRATULATIONS!!!</h1><div class="wb-b">YOU ARE THE<br><span style="font:bold 44px Impact,sans-serif;color:#e10600">1,000,000th</span><br>VISITOR TO THIS PAGE!!!<br><span class="small">(Just like everyone else who visits.)</span></div><p>${c.gif('star', 36)}${c.gif('trophy', 36)}${c.gif('star', 36)}</p><div class="wb-b" style="font-size:22px">${c.s('claim.html', 'CLICK HERE TO CLAIM YOUR PRIZE!!!')}</div><p class="small">Real visitors to this page: ${c.counter('plain')}</p>`,
  });
  W.sub('winbig', {
    'claim.html': { html: c => `<h1 style="animation:none">STOP!</h1><div class="wb-b" style="text-align:left">Before you claim: <b>pages like this are usually fibs.</b> Real "YOU HAVE WON" pages want your name, your address, or your Mom's card number. <b>Never give them those.</b> Not to a page. Not to a pop-up. Not to anyone on the Internet. Tell a grown-up instead.<br><br>Luckily, THIS page is a joke. We don't want anything. And your prize is real!* Here it is:</div><svg class="wb-shirt" viewBox="0 0 200 180" aria-label="A virtual JackNet T-shirt"><path d="M60 10l-50 30 20 35 25-12v107h90V63l25 12 20-35-50-30q-20 20-40 0z" fill="#fff" stroke="#000" stroke-width="3"/><text x="100" y="80" text-anchor="middle" font-family="Impact,Arial" font-size="16" fill="#e10600">I SPLATTED</text><text x="100" y="100" text-anchor="middle" font-family="Impact,Arial" font-size="16" fill="#e10600">THE BLOB</text><text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="10" fill="#000">JackNet 1999</text></svg><div class="wb-b">Your FREE JACKNET T-SHIRT! <span class="small">(*It's made of pixels. One size fits all screens.)</span></div><p>${c.a('lookhere', 'Back to the Web')}</p>`, setup(el, c) { c.secret('web.prize'); } },
  });

  // ================================================================ The Galaxy Ring hub
  W.def('galaxyring', {
    css: `.wp-galaxyring{background:#000 radial-gradient(circle,#fff 0 1px,transparent 1.5px) 0 0/37px 29px;color:#ffe81f;font:14px/1.5 Arial,sans-serif}
.wp-galaxyring h1{font:bold 36px "Arial Black",sans-serif;text-align:center;letter-spacing:4px;margin:6px 0}
.wp-galaxyring table{width:100%;max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:4px}.wp-galaxyring td{border:1px solid #ffe81f;padding:5px 8px;background:rgba(0,0,0,.7);vertical-align:top}
.wp-galaxyring a{color:#fff}`,
    html: c => `<h1>THE GALAXY RING</h1><p class="c">The webring for space, sci-fi and a galaxy far, far away. ${W.GRING.length - 1} sites. Hop between the stars!</p><div class="c">${c.applet('stars', 420, 100)}</div><table>${W.GRING.filter(w => w !== 'galaxyring').map((w, i) => `<tr><td>${i + 1}</td><td>${c.a(w)}<br><span class="small" style="color:#aaa">${c.url(w)}</span></td><td class="small">${esc(M[w].d)}</td></tr>`).join('')}</table><p class="c small">Want to join? Your site must have: stars (at least 3), a spaceship (any size) and NO spoilers. Apply by e-mail: ${c.envelope('galaxyring', 'ringmaster')}</p>${c.counterLine('Space travellers:', 'green')}`,
  });
})();

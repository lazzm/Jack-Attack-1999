/* web-p4: the 1999 Web, part 4. Jack's own portal pages (news, weather, chat...), fake services, and the shared toys
 * everyone on JackNet sees live: the petition, the poll booth, pass the parcel, the time capsule, the awards. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile, M = W.M;
  // the people are this visitor's own cast (js/cast.js): every page's text, guestbook seeds and guestbook options go through
  // Cast.t, so {hamster}, {hamster.he}, {kidSoon} ... come out with this visitor's names and the right he/she
  const def = (w, o) => { const h = o.html; if (h) o.html = c => { const gb = c.gb; c.gb = (seed, opt) => gb(Cast.deep(seed), Cast.deep(opt)); try { return Cast.t(h(c)); } finally { c.gb = gb; } }; return W.def(w, o); };
  const WIN98 = `.win98{background:#c0c0c0;color:#000;font:12px var(--ui)}.win98 .fld{background:#fff;border:2px inset #fff;padding:2px 4px}`;

  // ---------------------------------------------------------------- news: the JackNet News portal
  const TODAY99 = Cast.deep({ 1: ['The "euro" launched on the 1st. It\'s money, but only for banks so far. You can\'t buy sweets with it.', 'Everyone is still writing "1998" on their homework.'], 2: ['On the 11th, Pluto went back to being the furthest planet from the Sun. It had been closer than Neptune since 1979. (See {club2}\'s space page.)', 'Half term. Dave has been off the Internet for 4 days. We are worried.'], 3: ['The FULL Episode I trailer is on the Internet (11th). {kidEp1} has not slept.', 'The clocks went forward on the 28th. The video recorder did not.'], 4: ['Pocket Critters started on Sky Won at the end of March! {kidPoke} has not stopped talking.', 'Computer Club made its web page. Took 6 weeks.'], 5: ['Episode I came out in AMERICA on the 19th. We have to wait till July. Nobody talk to {kidEp1}.', 'The space toys are in the shops. Before the film. Torture.'], 6: ['The Modemtrix came out on the 11th. {club1} thinks {club1.he} can dodge things now.', 'School trip. The coach had a video. It was a video about a coach.'], 7: ['EPISODE I IS OUT (16th)!!! {kidEp1} queued from 9am (6am was "not happening").', 'Space Shuttlebus launched the Chandruff telescope on the 23rd, with the first woman in command.'], 8: ['TOTAL ECLIPSE on the 11th! Cornwall went dark. We got a partial one. Dave looked at it. Dave is fine.', 'Six weeks holiday. Six weeks of 56K.'], 9: ['Back to school. The Daydream came out in America on the 9th (9/9/99, they did that on purpose).', 'Mars Climate Orbiteer got lost (23rd) because of metric vs imperial. {teacher.Sir} was unbearable.'], 10: ['Pocket Critters Moss and Puddle are OUT here (5th). The playground is a trading floor.', 'The Daydream is out in Europe on the 14th. Jack has been outside the shop "just looking".'], 11: ['A year since the Episode I teaser (17th). {kidEp1} is having a cake.', 'Leonid meteors around the 17th-18th. {club2} is sleeping in the garden. {club2}\'s Mom says no.'], 12: ['The Iron Giraffe is out on the 17th. Robot. Boy. Tissues.', 'Y2K: days to go. {kidY2k} is in the shed. Everyone else is at a party.'] });
  def('news', {
    css: `.wp-news{background:#fff;color:#000;font:13px/1.4 Verdana,Arial,sans-serif}
.wp-news .nw-top{display:flex;align-items:center;gap:12px;background:#000080;color:#fff;padding:8px 12px;margin:-18px -18px 0;flex-wrap:wrap}
.wp-news .nw-top h1{font:bold 26px Georgia,serif;margin:0;letter-spacing:1px}
.wp-news .nw-top h1 span{color:#ffd400}
.wp-news .nw-date{margin-left:auto;font-size:12px}
.wp-news .nw-bar{background:#ffd400;color:#000;padding:4px 12px;margin:0 -18px 12px;font-size:12px;display:flex;gap:14px;flex-wrap:wrap}
.wp-news .nw-bar a{color:#000;font-weight:bold}
.wp-news .nw-cols{display:flex;gap:14px;flex-wrap:wrap}
.wp-news .nw-main{flex:2 1 320px;min-width:0}.wp-news .nw-side{flex:1 1 200px;min-width:0}
.wp-news .nw-box{border:1px solid #999;margin-bottom:12px}
.wp-news .nw-box h2{background:#e0e0e0;font:bold 13px Verdana,sans-serif;margin:0;padding:3px 8px;border-bottom:1px solid #999}
.wp-news .nw-box>div{padding:8px}
.wp-news .nw-head{font:bold 17px Georgia,serif;margin:0 0 2px}
.wp-news .nw-item{border-bottom:1px dotted #aaa;padding:6px 0}.wp-news .nw-item:last-child{border:0}
.wp-news .nw-search{display:flex;gap:4px}.wp-news .nw-search input{flex:1;min-width:0}
.wp-news .nw-live{color:#c00;font-weight:bold;font-size:10px;animation:blink 1s steps(1) infinite}
.wp-news ul{margin:4px 0;padding-left:18px}
@media (max-width:600px){.wp-news .nw-top,.wp-news .nw-bar{margin-left:-10px;margin-right:-10px}.wp-news .nw-top{margin-top:-12px}}`,
    html: c => {
      const t = c.t99, m = TODAY99[t.m] || TODAY99[1];
      return `<div class="nw-top"><h1>JackNet <span>News</span></h1><span class="small">The news that matters (to Jack)</span><span class="nw-date">${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.date.getDay()]} ${t.d}/${t.m}/1999</span></div>
<div class="nw-bar">${c.a('search', 'Search')} ${c.a('directory', 'Directory')} ${c.a('weather', 'Weather')} ${c.a('jackmail', 'Free E-mail')} ${c.a('chatroom', 'Chat')} ${c.a('poll', 'Polls')} ${c.a('petition', 'Petition')} ${c.a('parcel', 'Pass the Parcel')} ${c.a('awards', 'Awards')} ${c.a('jokes', 'Joke')} ${c.a('biscuitring', 'WebRing')}</div>
<div class="nw-cols"><div class="nw-main">
<div class="nw-box"><h2>TOP STORIES</h2><div>
<div class="nw-item"><div class="nw-head">DAVE'S PAGE "IS ABOUT WRESTLING NOW"</div>Dave's old homepage has been replaced overnight by ${c.a('~dave', 'Bedroom Championship Wrestling')}. "The cat is the champion," said Dave. The cat was unavailable for comment. The cat is asleep on the belt.</div>
<div class="nw-item"><div class="nw-head">PETITION PASSES <span class="nw-pet">?</span> SIGNATURES</div>The campaign to ${c.a('petition', 'make every day a Saturday')} continues. Organisers say they need 1,000. Mom says "we'll see". <span class="nw-live">LIVE</span></div>
<div class="nw-item"><div class="nw-head">PARCEL NOW ON LAYER <span class="nw-par">?</span></div>${c.a('parcel', 'The Great JackNet Pass the Parcel')} has been going since the summer. Nobody has found the bottom. Some say there is no bottom. <span class="nw-live">LIVE</span></div>
<div class="nw-item"><div class="nw-head">HAMSTER "STILL IN WHEEL"</div>{hamster}, star of ${c.a('hamstercam', 'Hamster Cam')}, was seen running in {hamster.his} wheel for the 400th consecutive day. Experts (Jack) say {hamster.he} is "fine, {hamster.he} likes it".</div>
<div class="nw-item"><div class="nw-head">COMPUTER CLUB PRINTER JAMS AGAIN</div>${c.a('computerclub', 'Room 14')} reports a third paper jam this term. Dave has been banned from printing. Dave was already banned from printing.</div>
<div class="nw-item"><div class="nw-head">WORST BAND IN THE WORLD BOOKED FOR MILLENNIUM</div>${c.a('~stu', 'The Mouldy Tangerines')} will play New Year's Eve "wherever we are allowed". Price: crisps.</div></div></div>
<div class="nw-box"><h2>THIS MONTH IN 1999</h2><div><ul>${m.map(x => `<li>${x}</li>`).join('')}</ul><p class="small">(Real-ish. The site is always 1999. Today is ${t.d}/${t.m}/99, and it always will be.)</p></div></div>
</div><div class="nw-side">
<div class="nw-box"><h2>SEARCH THE WEB</h2><div><form class="nw-search"><input type="text" placeholder="e.g. hamster" aria-label="Search"><button class="btn" type="submit">Go</button></form><p class="small">Powered by ${c.a('search', 'JackSearch')}</p></div></div>
<div class="nw-box"><h2>WEATHER</h2><div class="nw-wx">Loading...</div></div>
<div class="nw-box"><h2>WHO'S ONLINE</h2><div class="nw-on">...</div></div>
<div class="nw-box"><h2>TOTAL HITS ON THE 1999 WEB</h2><div class="c">${c.counter('odo', { k: 'web.hits.total', len: 7 })}<br><span class="small">across every homepage, live</span></div></div>
<div class="nw-box"><h2>TODAY'S JOKE</h2><div class="nw-joke small">...</div></div>
<div class="nw-box"><h2>COOL SITES</h2><div><ul>${['~kim', '~sam', 'cubetimes', '~mike', 'fanfic', 'midi'].map(w => `<li>${c.a(w)}</li>`).join('')}</ul></div></div>
</div></div>
<p class="c small">JackNet News is written by Jack, in Jotpad, after tea. Hits on this page: ${c.counter('plain')}</p>`;
    },
    setup(el, c) {
      el.querySelector('.nw-search').addEventListener('submit', ev => { ev.preventDefault(); W.pendingQuery = el.querySelector('.nw-search input').value; W.go('search'); });
      c.get(['web.petition.n', 'web.parcel.layers']).then(v => { el.querySelector('.nw-pet').textContent = (v['web.petition.n'] || 0).toLocaleString('en-GB'); el.querySelector('.nw-par').textContent = (v['web.parcel.layers'] || 0).toLocaleString('en-GB'); });
      c.watch('web.petition.n', ev => { if (ev.type === 'set') el.querySelector('.nw-pet').textContent = ev.v.toLocaleString('en-GB'); });
      c.watch('web.parcel.layers', ev => { if (ev.type === 'set') el.querySelector('.nw-par').textContent = ev.v.toLocaleString('en-GB'); });
      const wx = W.weather(c.t99); el.querySelector('.nw-wx').innerHTML = `<b>${wx[0].icon} ${wx[0].desc}</b>, ${wx[0].hi}&deg;C. ${c.a('weather', 'Full forecast')}`;
      const on = el.querySelector('.nw-on'); const upd = m => { const l = (m && m.online) || []; on.textContent = l.length ? l.length + ' online: ' + l.slice(0, 6).map(x => x.nick).join(', ') + (l.length > 6 ? '...' : '') : 'Just you. For now.'; };
      Net.on('online', upd); upd({ online: W.online || [] });
      el.querySelector('.nw-joke').innerHTML = esc(W.JOKES[c.t99.date.getDate() % W.JOKES.length][0]) + ' ' + c.a('jokes', '(punchline)');
    },
  });

  // ---------------------------------------------------------------- weather (seeded by the 1999 date)
  const WX = [['\u2614', 'Rain', 9, 14], ['\u2614', 'Heavy rain', 7, 12], ['\u26C5', 'Sunny spells', 12, 18], ['\u2601', 'Cloudy', 10, 15], ['\u2600', 'Sunny (!)', 15, 23], ['\u2614', 'Drizzle', 8, 13], ['\u2601', 'Grey', 9, 14], ['\u26A1', 'Thunder', 13, 19], ['\u2744', 'Frost', -1, 4], ['\u2614', 'Rain again', 8, 13]];
  W.weather = t => { const out = []; for (let i = 0; i < 5; i++) { const d = new Date(1999, t.m - 1, t.d + i), s = (d.getDate() * 7 + d.getMonth() * 13 + i * 3) % WX.length, w = WX[s], cold = d.getMonth() < 2 || d.getMonth() > 9; out.push({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], icon: w[0], desc: cold && w[1] !== 'Frost' ? w[1] + ' (cold)' : w[1], hi: w[3] - (cold ? 8 : 0), lo: w[2] - (cold ? 8 : 0) }); } return out; };
  def('weather', {
    css: `.wp-weather{background:#b8d8f0 ${tile('<ellipse cx="30" cy="22" rx="18" ry="9" fill="#cfe6f6"/><ellipse cx="70" cy="50" rx="14" ry="7" fill="#cfe6f6"/>', 96, 70)};color:#123;font:14px/1.45 Verdana,Arial,sans-serif}
.wp-weather .wx-wrap{max-width:620px;margin:0 auto;background:#fff;border:3px solid #369;padding:12px 16px}
.wp-weather h1{font:bold 26px Verdana,sans-serif;color:#369;margin:0 0 6px;text-align:center}
.wp-weather .wx-days{display:flex;gap:6px;flex-wrap:wrap}
.wp-weather .wx-day{flex:1 1 90px;background:#eef6ff;border:1px solid #9bc;text-align:center;padding:8px 4px}
.wp-weather .wx-day .ic{font-size:30px;line-height:1.1}
.wp-weather .wx-day b{display:block}
.wp-weather .wx-map{display:block;margin:10px auto;width:100%;max-width:300px;background:#cfe6f6;border:2px solid #369}
.wp-weather .wx-um{text-align:center;background:#369;color:#fff;padding:8px;margin-top:10px}
.wp-weather a{color:#369}`,
    html: c => {
      const wx = W.weather(c.t99);
      return `<div class="wx-wrap"><h1>JackNet Weather</h1><p class="c small">The forecast for "round here" (no, I'm not saying where). Updated by looking out of the window.</p>
<div class="wx-days">${wx.map((d, i) => `<div class="wx-day"><b>${i ? d.day : 'Today'}</b><div class="ic">${d.icon}</div>${d.desc}<br><span class="small">${d.hi}&deg; / ${d.lo}&deg;</span></div>`).join('')}</div>
<svg class="wx-map" viewBox="0 0 300 200" aria-label="A weather map with rain on it"><path d="M80 20l50-10 40 20 30 50-10 60-40 40-60 10-40-30-20-60z" fill="#8fbc8f" stroke="#369" stroke-width="2"/><g class="wx-rain" fill="#369"><text x="120" y="70" font-size="30">${wx[0].icon}</text><text x="190" y="120" font-size="22">${wx[1].icon}</text><text x="70" y="140" font-size="22">${wx[2].icon}</text></g><text x="150" y="190" text-anchor="middle" font-size="11" fill="#123">(it's not to scale and it's not really a map)</text></svg>
<h3>WHAT TO WEAR</h3><p>${wx[0].hi > 18 ? 'Shorts. Mom will still say "take a jumper".' : wx[0].hi > 10 ? 'Jumper. Coat in the bag. Mom was right.' : 'Coat. Hat. Gloves. The whole lot. Yes, the scarf.'}</p>
<h3>POLLEN COUNT</h3><p>${c.t99.m >= 5 && c.t99.m <= 7 ? 'HIGH. Dave\'s nose is a tap.' : 'Low. Dave\'s nose is still a tap. It\'s not pollen. It\'s Dave.'}</p>
<div class="wx-um"><b>UMBRELLA COUNT:</b> <span class="wx-n">?</span> people have clicked "it's raining here"<br><button class="btn wx-btn" type="button">It's raining here</button></div>
<p class="c small">Hits: ${c.counter('plain')} &middot; ${c.a('news', 'back to JackNet News')} &middot; ${c.a('knitting', 'knitting weather')} &middot; ${c.a('~ash', 'the sky (the other kind)')}</p></div>`;
    },
    setup(el, c) {
      const n = el.querySelector('.wx-n'); const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); };
      c.get(['web.weather.rain']).then(v => show(v['web.weather.rain'] || 0)); c.watch('web.weather.rain', ev => { if (ev.type === 'set') show(ev.v); });
      let done = false; el.querySelector('.wx-btn').addEventListener('click', () => { if (done) return; done = true; Net.kv.inc('web.weather.rain'); Sound.play('click'); });
    },
  });

  // ---------------------------------------------------------------- teef: the Gem Exchange shop
  const GOODS = [['Shiny Gem (single)', 3, 'One gem. Very shiny. Not from anyone you know.'], ['Bag o\' Gems (12)', 30, 'A dozen assorted gems. May contain a marble.'], ['Blobbit (small, bouncy)', 45, 'Bounces. Nibbles. Not house-trained. No refunds.'], ['Bits Box Mystery Bag', 20, 'Arms, legs, a wheel, something that might be a horn.'], ['Red Paint (goes faster)', 8, 'Makes anything faster. Scientifically not proven. Micro Mechanics proven.'], ['Mushroom (glowing)', 12, 'Grows in the dark. Do not eat. Gubbinz ate one. Gubbinz is "fine".'], ['Mystery Pocket Critters Card', 15, 'Might be a shiny one. Is probably a Ratatat. Imported from America.'], ['Sir Killalotta\'s Autograph', 99, 'He signed it with a claw. It says "GRRRR". Probably real.']];
  def('teef', {
    css: `.wp-teef{background:#f0e68c ${tile('<path d="M8 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#e6d86a" opacity=".6"/>', 32)};color:#000;font:13px/1.4 Verdana,Arial,sans-serif}
.wp-teef .tf-top{background:#006400;color:#ffd400;padding:10px 14px;margin:-18px -18px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.wp-teef .tf-top h1{font:bold 28px Impact,sans-serif;margin:0;letter-spacing:2px}
.wp-teef .tf-top .tf-bask{margin-left:auto;background:#fff;color:#000;padding:4px 8px;border:2px solid #000}
.wp-teef .tf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.wp-teef .tf-item{background:#fff;border:2px solid #006400;padding:8px}
.wp-teef .tf-item b{display:block;color:#006400}
.wp-teef .tf-price{font:bold 16px Impact,sans-serif;color:#a00}
.wp-teef .tf-form{background:#fff;border:3px double #006400;padding:10px 14px;margin:14px auto;max-width:520px}
.wp-teef .tf-form label{display:block;margin:4px 0}.wp-teef .tf-form input[type=text],.wp-teef .tf-form select{width:100%;box-sizing:border-box}
.wp-teef .tf-secure{font-size:10px;color:#060;text-align:center}
.wp-teef .tf-done{background:#006400;color:#fff;padding:10px;text-align:center;font-weight:bold;display:none}
.wp-teef a{color:#006400}
@media (max-width:600px){.wp-teef .tf-top{margin:-12px -10px 12px}}`,
    html: c => `<div class="tf-top"><h1>GEM EXCHANGE</h1><span>the only shop on the Internet that takes RUPEES</span><span class="tf-bask">Basket: <b class="tf-n">0</b> items, <b class="tf-t">0</b> Rupees</span></div>
<p class="c"><marquee scrollamount="6">*** SALE *** EVERYTHING MUST GO *** (it wont go, it just sits there) *** FREE DELIVERY BY PAPER AEROPLANE (may land in a tree) ***</marquee></p>
<p>Welcome to the GEM EXCHANGE, run by Gubbinz (manager) and Jack (does the typing). Pick what you want, press ADD, then fill in the form. We take Rupees only. No pounds. No pennies. No "IOU". RUPEES.</p>
<div class="tf-grid">${GOODS.map((g, i) => `<div class="tf-item"><b>${esc(g[0])}</b><span class="tf-price">${window.Econ ? Econ.rupees(g[1], true) : g[1] + ' Rupees'}</span><p class="small">${esc(g[2])}</p><button class="btn" type="button" data-add="${i}">ADD TO BASKET</button></div>`).join('')}</div>
<form class="tf-form"><h3 style="margin:0 0 6px">ORDER FORM</h3><label>Your nickname: <input type="text" maxlength="24" required></label><label>Deliver to (NOT your real address, this is the Internet): <select><option>Under the bed</option><option>Behind the sofa</option><option>The shed</option><option>The bits box</option><option>Dave's house (he won't notice)</option></select></label><label>How will you pay? <select><option>Rupees (shiny)</option><option>Rupees (not shiny)</option><option>Rupees (Nan's, don't tell her)</option><option>A swap (Pocket Critters cards)</option></select></label><label><input type="checkbox" required> I agree that Rupees are not refundable and that Gubbinz is always right</label><p class="c"><button class="btn" type="submit">PLACE ORDER!!!</button></p><p class="tf-secure">&#128274; This page is SECURE. Gubbinz is guarding it with a stick.</p></form>
<div class="tf-done"></div>
<p class="c">${c.midi('web-lift', 'lift_music.mid')} <span class="small">(hold music, in case you have to wait)</span></p>
<p class="c">Orders placed by everyone: <b class="tf-orders">?</b> &middot; Shoppers: ${c.counter('gold')}</p>
${c.gb([['Little Green Kevin', c.daysAgo(2), 'i ordered a Blobbit. it arrived. it ate the box. 5 stars', 5], ['Jack', c.daysAgo(4), 'Gubbinz where did you get Sir Killalotta\'s autograph. Gubbinz. GUBBINZ.', 3], ['Dave', c.daysAgo(7), 'why is there a Blobbit in my house', 1]], { title: 'KUSTOMER REVIEWS', ph: 'What did you buy? Was it good? (it was)' })}
<p class="c small">${c.a('~mek', 'paint your stuff')} &middot; ${c.a('poetree', 'the manager\'s poems')} &middot; ${c.a('orktranslate', 'translate this page')} &middot; ${c.a('news', 'JackNet News')}</p>`,
    setup(el, c) {
      const n = el.querySelector('.tf-n'), t = el.querySelector('.tf-t'); let items = 0, teef = 0;
      el.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { const g = GOODS[+b.dataset.add]; items++; teef += g[1]; n.textContent = items; t.textContent = teef; Sound.play('pet'); b.textContent = 'ADDED! (add another)'; }));
      const ord = el.querySelector('.tf-orders'); const show = v => { if (typeof v === 'number') ord.textContent = v.toLocaleString('en-GB'); }; c.get(['web.teef.orders']).then(v => show(v['web.teef.orders'] || 0)); c.watch('web.teef.orders', ev => { if (ev.type === 'set') show(ev.v); });
      el.querySelector('.tf-form').addEventListener('submit', ev => { ev.preventDefault(); if (!items) { Desk.msgbox('Gem Exchange', 'Your basket is EMPTY. Put something in it first.', 'warn'); return; } const d = el.querySelector('.tf-done'); d.style.display = 'block'; d.innerHTML = `THANK YOU! Order #${W.ri(1000, 9999)} placed: ${items} item(s), ${teef} ${teef === 1 ? 'Rupee' : 'Rupees'}.<br>Delivery: 6 to 8 weeks, or whenever the paper aeroplane lands.<br><span class="small">(Nothing will actually arrive. This is pretend. Keep your Rupees.)</span>`; Net.kv.inc('web.teef.orders'); Sound.play('solve'); c.secret('web.order'); });
    },
  });

  // ---------------------------------------------------------------- 1999 webcams (Hamster Cam, Fish Tank Cam, Sheldon Cam)
  // Each picture is drawn smoothly at 320x240, squashed down to the camera's 160x120, then given the full cheap-webcam treatment:
  // soft focus, a colour cast, smeared colour in 8x8 JPEG blocks, sensor noise, a dark vignette, green "night vision" when the
  // lights are off, and the time burned into the corner. Pictures refresh every 30 seconds and arrive line by line, like over a modem.
  W.cam = W.cam || (() => {
    const mk = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
    const S = mk(320, 240), L = mk(160, 120);
    const seeded = n => { let s = (Math.abs(Math.floor(n)) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
    const stamp = d => { const t = Desk.today99(), p = v => String(v).padStart(2, '0'); return `${p(t.d)}/${p(t.m)}/99 ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
    function shoot(out, scene, o) {
      const sg = S.getContext('2d'), lg = L.getContext('2d', { willReadFrequently: true });
      sg.save(); sg.clearRect(0, 0, 320, 240); scene(sg, seeded(o.seed || 7)); sg.restore();
      lg.imageSmoothingEnabled = true; lg.drawImage(S, 0, 0, 160, 120);
      const id = lg.getImageData(0, 0, 160, 120), d = id.data, rnd = seeded((o.seed || 7) * 31 + 5), ir = !!o.night;
      for (let by = 0; by < 120; by += 8) for (let bx = 0; bx < 160; bx += 8) {
        let mr = 0, mg = 0, mb = 0;
        for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) { const i = (y * 160 + x) * 4; mr += d[i]; mg += d[i + 1]; mb += d[i + 2]; }
        mr /= 64; mg /= 64; mb /= 64; const mY = 0.299 * mr + 0.587 * mg + 0.114 * mb;
        for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) {
          const i = (y * 160 + x) * 4; let r = d[i], g = d[i + 1], b = d[i + 2]; const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          // colour is smeared across the block (cheap JPEG), and the whole picture is a bit washed out
          r = Y + ((r - Y) * 0.35 + (mr - mY) * 0.45); g = Y + ((g - Y) * 0.35 + (mg - mY) * 0.45); b = Y + ((b - Y) * 0.35 + (mb - mY) * 0.45);
          const dx = (x - 80) / 80, dy = (y - 60) / 60, v = 1 - 0.32 * (dx * dx + dy * dy), n = (rnd() - 0.5) * (ir ? 34 : 16);
          if (ir) { const l = Math.min(255, (Y * 1.3 + 18) * v + n); r = l * 0.62; g = l; b = l * 0.58; }
          else { r = (r + 8) * v + n; g = (g + 3) * v + n; b = (b - 10) * v + n; }
          d[i] = Math.round(r / 5) * 5; d[i + 1] = Math.round(g / 5) * 5; d[i + 2] = Math.round(b / 5) * 5;
        }
      }
      lg.putImageData(id, 0, 0);
      const og = out.getContext('2d'); og.imageSmoothingEnabled = true; og.drawImage(L, 0, 0, out.width, out.height);
      // the burned-in caption, in the camera's own blocky lettering
      og.font = 'bold 12px "Courier New", monospace'; og.textBaseline = 'alphabetic';
      const txt = (s, x, y, al) => { og.textAlign = al || 'left'; og.fillStyle = '#000'; og.fillText(s, x + 1, y + 1); og.fillStyle = ir ? '#d8ffd0' : '#fff'; og.fillText(s, x, y); };
      txt(o.name || 'CAM 1', 6, 14); if (ir) txt('NIGHT', out.width - 6, 14, 'right');
      txt(stamp(o.time || new Date()), 6, out.height - 7); if (o.tag) txt(o.tag, out.width - 6, out.height - 7, 'right');
    }
    // a still that arrives a few lines at a time
    function reveal(cv, next, ms) {
      const g = cv.getContext('2d'), t0 = performance.now(); let done = 0; cv._rv = (cv._rv || 0) + 1; const me = cv._rv;
      const step = () => { if (me !== cv._rv || !cv.isConnected) return; const k = Math.min(1, (performance.now() - t0) / (ms || 1400)), rows = Math.round(k * next.height / 8) * 8;
        if (rows > done) { g.drawImage(next, 0, done, next.width, rows - done, 0, done, next.width, rows - done); done = rows; } if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    // what time of day is it at the cam, and is the light on? (day / lamp / ir)
    const light = (d, flip) => { const h = d.getHours() + d.getMinutes() / 60; let l = h >= 22 || h < 7 ? 'ir' : h < 17.5 ? 'day' : 'lamp'; if (flip) l = l === 'ir' ? 'lamp' : 'ir'; return l; };
    const pickW = (r, wts) => { let t = 0; for (const k in wts) t += wts[k]; let x = r * t; for (const k in wts) { x -= wts[k]; if (x <= 0) return k; } return Object.keys(wts)[0]; };
    return { shoot, reveal, seeded, light, pickW, mk, stamp };
  })();

  // ---------------------------------------------------------------- the hamster (Cast 'hamster'), drawn with love (a Syrian hamster: golden back, cream tummy, pink paws)
  W.drawHamster = W.drawHamster || ((g, x, y, pose, o) => {
    o = o || {}; const s = o.s || 1, f = o.f || 1, ir = o.ir, t = o.t || 0;
    const GOLD = '#e0a052', DK = '#b8763a', LT = '#f6c88a', CR = '#fff1dc', PK = '#f6a8a8', FT = '#f4b8b0', EYE = '#120a08';
    const E = (cx, cy, rx, ry, col, rot) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
    const eye = (cx, cy, r, shut) => { if (shut) { g.strokeStyle = EYE; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy - r * 0.3, r, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke(); return; } E(cx, cy, r, r * 1.08, EYE); E(cx - r * 0.3, cy - r * 0.35, r * 0.38, r * 0.38, ir ? '#fff' : '#ffffff'); if (ir) E(cx, cy, r * 0.75, r * 0.75, 'rgba(255,255,255,.75)'); };
    const whisk = (cx, cy, dir) => { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + dir * 16, cy + i * 5 - 2); g.stroke(); } };
    g.save(); g.translate(x, y); g.scale(s * f, s);
    if (pose === 'sleep') { // curled up in a ball, nose tucked in
      E(0, -15, 24, 17, GOLD); E(-4, -22, 16, 8, LT); E(12, -9, 11, 8, CR); E(14, -10, 7, 5, GOLD);
      E(4, -29, 5, 6, DK); E(4, -29, 3, 4, PK); eye(10, -15, 2.4, true); E(20, -9, 1.6, 1.4, '#e88a9a');
      g.strokeStyle = DK; g.lineWidth = 1.2; g.beginPath(); g.arc(-6, -15, 13, 3.6, 5.2); g.stroke();
    } else if (pose === 'run' || pose === 'walk' || pose === 'dig') { // side-on, stretched out
      const ph = Math.sin(t * 20);
      const legs = (lx, ly) => { if (pose === 'run') { for (let k = 0; k < 4; k++) E(lx + (k - 1.5) * 5, ly, 5, 2.4, 'rgba(244,184,176,.45)'); } else { E(lx - 3 + ph, ly, 3.5, 2.2, FT); E(lx + 4 - ph, ly, 3.5, 2.2, FT); } };
      legs(-14, -1); legs(14, -1);
      E(-2, -15, 27, 15, GOLD); E(0, -8, 22, 8, CR); E(-6, -21, 16, 6, LT); E(-26, -14, 3, 3, DK);
      E(20, -19, 13, 12, GOLD); E(27, -14, 9, 7, CR); E(31, -16, 2.6, 2.2, '#ee8a9c'); // head, cheek, nose
      E(13, -31, 5.5, 6, DK, -0.3); E(13, -31, 3.2, 4, PK, -0.3); eye(24, -21, 2.6); whisk(31, -15, 1);
      if (pose === 'dig') for (let k = 0; k < 5; k++) E(-30 - k * 6, -10 - (k % 2) * 8 - k * 2, 3, 1.4, '#d8bf80', k);
    } else { // sitting up and facing out: look, eat, groom, drink, stuff
      const up = pose === 'drink' ? -10 : 0, cheeks = pose === 'eat' || pose === 'stuff' ? (pose === 'stuff' ? 1.6 : 1.25) : 1;
      E(-11, -2, 6, 3, FT); E(11, -2, 6, 3, FT); // feet
      E(0, -24 + up / 2, 23, 25, GOLD); E(0, -19 + up / 2, 15, 19, CR);
      E(-16, -60 + up, 7.5, 8, DK); E(16, -60 + up, 7.5, 8, DK); E(-16, -60 + up, 4.5, 5, PK); E(16, -60 + up, 4.5, 5, PK); // ears
      E(0, -45 + up, 20, 17, GOLD); E(0, -51 + up, 12, 7, LT); // head
      E(-11, -38 + up, 9 * cheeks, 8 * cheeks, CR); E(11, -38 + up, 9 * cheeks, 8 * cheeks, CR); E(0, -40 + up, 7, 7, CR); // cheeks + muzzle
      const shut = pose === 'groom';
      eye(-8, -47 + up, 3.1, shut); eye(8, -47 + up, 3.1, shut);
      g.beginPath(); g.moveTo(-2.6, -41.5 + up); g.lineTo(2.6, -41.5 + up); g.lineTo(0, -38.5 + up); g.closePath(); g.fillStyle = '#ee8a9c'; g.fill();
      g.strokeStyle = '#a0604a'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -38.5 + up); g.lineTo(0, -36.5 + up); g.moveTo(-3, -35.5 + up); g.quadraticCurveTo(-1.5, -34 + up, 0, -36.5 + up); g.quadraticCurveTo(1.5, -34 + up, 3, -35.5 + up); g.stroke();
      whisk(6, -39 + up, 1); whisk(-6, -39 + up, -1);
      if (pose === 'groom') { E(-6, -46 + up, 4, 3.4, FT); E(6, -46 + up, 4, 3.4, FT); }
      else if (pose === 'eat') { E(-4, -32, 3.4, 3, FT); E(4, -32, 3.4, 3, FT); g.save(); g.translate(0, -33); g.rotate(0.3); E(0, 0, 5, 2.6, '#2a2a2a'); g.strokeStyle = '#ddd'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke(); g.restore(); }
      else if (pose === 'drink') { E(-5, -33 + up, 3.4, 3, FT); E(5, -33 + up, 3.4, 3, FT); }
      else { E(-5, -27, 3.4, 3, FT); E(5, -27, 3.4, 3, FT); }
    }
    g.restore();
  });

  // ---------------------------------------------------------------- the inside of the hamster's cage (a glass tank with a wire lid, on Jack's chest of drawers)
  W.hamsterScene = W.hamsterScene || ((g, st) => {
    const ir = st.light === 'ir', lamp = st.light === 'lamp', fix = W.cam.seeded(4242);
    // the bedroom behind the tank, out of focus
    g.fillStyle = lamp ? '#8a7a68' : '#7d8fa8'; g.fillRect(0, 0, 320, 240);
    g.fillStyle = lamp ? '#9a8870' : '#90a2bc'; for (let x = 0; x < 320; x += 22) g.fillRect(x, 0, 10, 150);
    g.fillStyle = '#20284a'; g.fillRect(196, 24, 56, 76); g.fillStyle = '#d8d8e8'; for (let k = 0; k < 9; k++) g.fillRect(200 + (k * 37) % 48, 28 + (k * 23) % 60, 2, 2); g.fillStyle = '#b8b8c8'; g.fillRect(208, 58, 32, 6); g.fillRect(220, 50, 8, 22); g.fillStyle = '#ffd400'; g.fillRect(204, 88, 40, 6); // a poster: a spaceship
    if (lamp) { const rg = g.createRadialGradient(40, 40, 4, 40, 40, 160); rg.addColorStop(0, 'rgba(255,214,140,.55)'); rg.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = rg; g.fillRect(0, 0, 320, 240); }
    // tank: back glass, wire lid
    g.fillStyle = 'rgba(200,230,255,.13)'; g.fillRect(10, 18, 300, 200);
    g.fillStyle = '#6a6a72'; g.fillRect(0, 0, 320, 14); g.strokeStyle = '#9a9aa4'; g.lineWidth = 1; for (let x = 4; x < 320; x += 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 13); g.stroke(); }
    // bedding: wood shavings
    g.fillStyle = '#e4cf96'; g.beginPath(); g.moveTo(0, 182); for (let x = 0; x <= 320; x += 20) g.lineTo(x, 176 + Math.sin(x * 0.07) * 5 + fix() * 4); g.lineTo(320, 240); g.lineTo(0, 240); g.fill();
    for (let i = 0; i < 260; i++) { const x = fix() * 320, y = 178 + fix() * 62; g.strokeStyle = ['#c9ad6a', '#f4e6bc', '#d8bf80', '#b89a58'][i % 4]; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2 + fix() * 3, fix() * 6, fix() * 6 + 2); g.stroke(); }
    // the wheel, on its stand
    const wx = 84, wy = 126, R = 56, run = st.act === 'run';
    g.strokeStyle = '#8a8a96'; g.lineWidth = 5; g.beginPath(); g.moveTo(wx - 30, 192); g.lineTo(wx, wy); g.lineTo(wx + 30, 192); g.stroke();
    g.strokeStyle = '#7a7a86'; g.lineWidth = 3; g.beginPath(); g.arc(wx + 10, wy - 6, R, 0, Math.PI * 2); g.stroke(); // back rim
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2 + (run ? 0 : 0.03); g.strokeStyle = run ? 'rgba(200,200,212,.45)' : '#b8b8c4'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); g.lineTo(wx + 10 + Math.cos(a) * R, wy - 6 + Math.sin(a) * R); g.stroke(); }
    if (run) { const h = st.ham || { s: 1 }; W.drawHamster(g, wx - 2, wy + R - 5, 'run', { s: 1.2, f: 1, ir, t: st.t }); }
    g.strokeStyle = '#d0d0dc'; g.lineWidth = 3.5; g.beginPath(); g.arc(wx, wy, R, 0, Math.PI * 2); g.stroke();
    if (run) { g.strokeStyle = 'rgba(220,220,232,.18)'; g.lineWidth = 4; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); g.stroke(); } }
    else { g.strokeStyle = '#c4c4d0'; g.lineWidth = 2.5; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); g.stroke(); } }
    g.fillStyle = '#9a9aa8'; g.beginPath(); g.arc(wx, wy, 6, 0, Math.PI * 2); g.fill();
    // water bottle clipped to the glass, with a metal spout
    g.fillStyle = 'rgba(170,215,255,.55)'; g.fillRect(266, 24, 26, 86); g.fillStyle = 'rgba(120,180,240,.6)'; g.fillRect(266, 50, 26, 60); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(270, 28, 4, 78);
    g.fillStyle = '#d02828'; g.fillRect(264, 108, 30, 9); g.strokeStyle = '#c8c8d0'; g.lineWidth = 4; g.beginPath(); g.moveTo(279, 117); g.lineTo(268, 146); g.stroke(); g.fillStyle = '#bfe4ff'; g.beginPath(); g.arc(267, 150, 2.4, 0, 7); g.fill();
    g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(262, 40); g.lineTo(296, 40); g.stroke();
    // a little wooden house with a round door
    g.fillStyle = '#c8955a'; g.fillRect(200, 140, 62, 48); g.fillStyle = '#a87440'; for (let y = 146; y < 188; y += 8) g.fillRect(200, y, 62, 1.5);
    g.fillStyle = '#6a3e1e'; g.beginPath(); g.moveTo(194, 142); g.lineTo(231, 116); g.lineTo(268, 142); g.closePath(); g.fill(); g.fillStyle = '#8a5428'; g.beginPath(); g.moveTo(200, 140); g.lineTo(231, 120); g.lineTo(262, 140); g.closePath(); g.fill();
    g.fillStyle = '#2a1608'; g.beginPath(); g.arc(231, 170, 13, Math.PI, 0); g.lineTo(244, 188); g.lineTo(218, 188); g.fill();
    // food bowl, with the seed mix
    g.fillStyle = '#d85a3a'; g.beginPath(); g.ellipse(158, 206, 30, 9, 0, 0, Math.PI); g.lineTo(128, 206); g.fill(); g.fillRect(128, 196, 60, 10); g.fillStyle = '#f07a5a'; g.beginPath(); g.ellipse(158, 196, 30, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8c070'; g.beginPath(); g.ellipse(158, 195, 25, 5, 0, 0, Math.PI * 2); g.fill();
    const seed = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(0, 0, 3.4, 1.7, 0, 0, 7); g.fill(); g.fillStyle = '#e8e8e0'; g.fillRect(-3, -0.4, 6, 0.8); g.restore(); };
    for (let k = 0; k < 9; k++) seed(140 + fix() * 36, 192 + fix() * 6, fix() * 3); for (let k = 0; k < 7; k++) { g.fillStyle = ['#7ab040', '#e06030', '#f0d070'][k % 3]; g.fillRect(140 + fix() * 36, 192 + fix() * 6, 3, 2); }
    for (let k = 0; k < Math.min(18, st.seeds || 0); k++) seed(104 + fix() * 120, 212 + fix() * 22, fix() * 3);
    // a cardboard tube, and Rocky (visiting)
    const tube = () => { g.fillStyle = '#b08850'; g.fillRect(6, 198, 78, 32); g.fillStyle = '#c8a068'; g.fillRect(6, 198, 78, 6); g.strokeStyle = '#9a7440'; g.lineWidth = 1; for (let x = 14; x < 84; x += 14) { g.beginPath(); g.moveTo(x, 198); g.lineTo(x - 8, 230); g.stroke(); } g.fillStyle = '#c8a068'; g.beginPath(); g.ellipse(6, 214, 7, 16, 0, 0, 7); g.fill(); };
    tube(); g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(84, 214, 8, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#8a8a8a'; g.beginPath(); g.ellipse(292, 212, 16, 11, 0, 0, 7); g.fill(); g.fillStyle = '#a8a8a8'; g.beginPath(); g.ellipse(288, 208, 9, 5, 0, 0, 7); g.fill();
    for (const ex of [286, 296]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, 210, 3.4, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(ex + 1, 211, 1.6, 0, 7); g.fill(); }
    // the hamster (unless it's in the wheel)
    const a = st.act;
    if (a === 'sleep') { W.drawHamster(g, 214, 200, 'sleep', { s: 1.45, ir }); g.fillStyle = '#e4cf96'; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(196 + k * 7, 196 - (k % 3), 8, 5, 0, 0, 7); g.fill(); } }
    else if (a === 'hide') { if (st.spot) { g.fillStyle = ir ? '#fff' : '#120a08'; for (const ex of [226, 236]) { g.beginPath(); g.arc(ex, 176, 2.6, 0, 7); g.fill(); } g.fillStyle = '#ee8a9c'; g.beginPath(); g.arc(231, 183, 2, 0, 7); g.fill(); } else { g.save(); g.beginPath(); g.ellipse(84, 214, 8, 16, 0, 0, 7); g.clip(); W.drawHamster(g, 84, 240, 'look', { s: 0.6, ir }); g.restore(); g.strokeStyle = '#8a6430'; g.lineWidth = 2; g.beginPath(); g.ellipse(84, 214, 8, 16, 0, 0, 7); g.stroke(); } }
    else if (a === 'eat' || a === 'stuff') W.drawHamster(g, st.x || 196, 222, a, { s: 1.3, ir });
    else if (a === 'drink') W.drawHamster(g, 262, 222, 'drink', { s: 1.25, ir });
    else if (a === 'look' || a === 'groom') W.drawHamster(g, st.x || 160, 230, a, { s: 1.45, ir });
    else if (a === 'dig' || a === 'walk') W.drawHamster(g, st.x || 170, 226, a, { s: 1.35, f: st.f || 1, ir, t: st.t });
    // reflections on the front glass
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(30, 0); g.lineTo(70, 0); g.lineTo(10, 240); g.lineTo(-30, 240); g.fill();
    if (ir) { const rg = g.createRadialGradient(160, 170, 30, 160, 140, 230); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = rg; g.fillRect(0, 0, 320, 240); }
  });

  // ---------------------------------------------------------------- hamstercam
  def('hamstercam', {
    css: `.wp-hamstercam{background:#2a2a2a;color:#eee;font:14px/1.45 Arial,sans-serif}
.wp-hamstercam h1{font:bold 36px "Comic Sans MS",cursive;text-align:center;color:#ffb347;margin:4px 0}
.wp-hamstercam .hc-cam{max-width:420px;margin:10px auto;background:#000;border:6px solid #444;padding:4px}
.wp-hamstercam canvas{display:block;width:100%;height:auto;image-rendering:auto;background:#1a1a1a}
.wp-hamstercam .hc-bar{display:flex;justify-content:space-between;font:11px "Courier New",monospace;color:#0f0;padding:2px 4px}
.wp-hamstercam .hc-rec{color:#f00;animation:blink 1s steps(1) infinite}
.wp-hamstercam .hc-ctl{text-align:center}.wp-hamstercam .hc-ctl .btn{margin:3px}
.wp-hamstercam .hc-st{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;background:#111;padding:8px;max-width:420px;margin:8px auto;font-size:12px}
.wp-hamstercam .hc-st b{color:#ffb347}
.wp-hamstercam .hc-faq{max-width:560px;margin:12px auto;background:#111;padding:10px 14px;border:1px solid #555}
.wp-hamstercam a{color:#ffb347}.wp-hamstercam .wgb{background:#111;color:#eee;border-color:#ffb347}.wp-hamstercam .wgb-head{background:#7a4a14}.wp-hamstercam .wgbe-h b{color:#ffb347}`,
    html: c => `<h1>HAMSTER CAM - LIVE!!!</h1>
<p class="c">This is <b>{hamster}</b>. {hamster.He} is a hamster. {hamster.He} is live on the Internet, 24 hours a day, from a webcam on top of {hamster.his} cage. (The webcam is 160x120 and takes a new picture every 30 seconds. {hamster} does not know {hamster.he}'s famous.)</p>
<div class="hc-cam"><div class="hc-bar"><span class="hc-rec">&#9679; LIVE</span><span class="hc-time">00:00:00</span><span>CAM 1</span></div><canvas width="320" height="240" aria-label="{hamster} the hamster, live"></canvas><div class="hc-bar"><span class="hc-next">next picture in 30s</span><span class="hc-say">{hamster} is: running</span><span>JPG</span></div></div>
<div class="hc-ctl"><button class="btn hc-feed" type="button">FEED {hamster.NAME}</button><button class="btn hc-poke" type="button">Tap the glass</button><button class="btn hc-light" type="button">Lights off/on</button></div>
<div class="hc-st"><span>Seeds given by everyone: <b class="hc-seeds">?</b></span><span>Wheel turns today: <b class="hc-turns">0</b></span><span>Watching now: <b class="hc-watch">?</b></span></div>
<div class="hc-faq"><h3 style="margin:0 0 4px">{hamster.NAME} FAQ</h3><p><b>Is {hamster.he} real?</b> Yes. Well. {hamster.He}'s real to me.<br><b>Why is {hamster.he} always running?</b> {hamster.He}'s a hamster. That's the job.<br><b>Can I feed {hamster.him}?</b> Press the button! Everyone on JackNet can. {hamster.He} gets one seed per press. {hamster.He} is getting quite round.<br><b>What happens if I tap the glass?</b> {hamster.He} stops and looks at you. Then {hamster.he} carries on. {hamster.He} has seen it all.<br><b>Why is there a rock in {hamster.his} cage?</b> That's not a rock. That's ${c.a('~kevin', 'Rocky')}. He's visiting.<br><b>Is {hamster} Y2K ready?</b> {hamster} is 2 years old. {hamster} thinks it's 1997.</p></div>
<p class="c">${c.midi('web-hamster', 'nibbles_theme.mid')}</p>
<p class="c">Viewers since the cam went up: ${c.counter('odo')}</p>
${c.gb([['{cousin}', c.daysAgo(1), '{hamster?HE|SHE} IS SO CUTE. {cousinpet.first} says hi ({cousinpet.first} is my hamster)', 5], ['Dave', c.daysAgo(2), 'i tapped the glass 40 times. {hamster.he} looked at me 40 times. we have a bond', 4], ['Jack', c.daysAgo(5), 'stop feeding {hamster.him}. {hamster.he} is a ball. {hamster.he} is a hamster shaped ball.', 3]], { title: 'Say hello to {hamster}', ph: '{hamster} reads these. Probably.' })}
<p class="c small">${c.a('~biscuit', "Biscuit (a dog cam, sort of)")} &middot; ${c.a('~kevin', 'Rocky cam (nothing happens)')} &middot; ${c.a('counters', 'is this the most visited page?')}</p>
${c.ring()}`,
    setup(el, c) {
      const cv = el.querySelector('canvas'), say = el.querySelector('.hc-say'), time = el.querySelector('.hc-time'), turns = el.querySelector('.hc-turns'), seeds = el.querySelector('.hc-seeds'), watch = el.querySelector('.hc-watch'), nextEl = el.querySelector('.hc-next');
      const CAM = W.cam, next = CAM.mk(320, 240);
      let flip = false, pokes = 0, seedsOnFloor = 0, forced = null, forcedUntil = 0, hideUntil = 0, last = 0, act = 'sleep';
      // what the hamster gets up to, hour by hour (hamsters sleep all day and party all night)
      const plan = h => h >= 23 || h < 5 ? { run: 6, eat: 1.4, drink: 1, dig: 1, look: 0.6, groom: 0.6 } : h < 8 ? { stuff: 2, dig: 2, groom: 1, drink: 1, sleep: 1.5, run: 1 }
        : h < 17 ? { sleep: 8, hide: 1, drink: 0.4, groom: 0.4 } : h < 19 ? { groom: 2.5, drink: 1.5, look: 2, eat: 2, sleep: 1, walk: 1 } : { run: 3.5, eat: 2.5, look: 1.5, drink: 1, groom: 1, dig: 1, walk: 1 };
      const SAY = Cast.deep({ run: 'running in {hamster.his} wheel', sleep: 'asleep (shh)', eat: 'eating a seed', stuff: 'stuffing {hamster.his} cheeks', drink: 'having a drink', look: 'looking at YOU', groom: 'washing {hamster.his} face', dig: 'digging', walk: 'having a wander', hide: 'hiding' }), HN = Cast.n('hamster');
      // estimated wheel turns since midnight, from the plan
      const runShare = h => { const p = plan(h); let t = 0; for (const k in p) t += p[k]; return (p.run || 0) / t; };
      let nTurns = 0; { const d = new Date(), mins = d.getHours() * 60 + d.getMinutes(); for (let m = 0; m < mins; m++) nTurns += runShare(m / 60) * 66; }
      const shot = () => {
        const d = new Date(), slot = Math.floor(d.getTime() / 30000), r = CAM.seeded(slot)(), h = d.getHours() + d.getMinutes() / 60;
        act = Date.now() < forcedUntil && forced ? forced : Date.now() < hideUntil ? 'hide' : CAM.pickW(r, plan(h));
        const lt = CAM.light(d, flip), rr = CAM.seeded(slot * 7 + 3);
        const st = { act, light: lt, seeds: seedsOnFloor, t: d.getTime() / 1000, x: act === 'eat' || act === 'stuff' ? 192 : 120 + rr() * 80, f: rr() < 0.5 ? 1 : -1, spot: Date.now() < hideUntil ? false : rr() < 0.6 };
        CAM.shoot(next, g => W.hamsterScene(g, st), { seed: slot, night: lt === 'ir', name: HN.toUpperCase() + ' CAM 1', tag: '160x120', time: d });
        CAM.reveal(cv, next, 1500); last = Date.now();
        say.textContent = HN + ' is: ' + SAY[act]; say.parentNode.title = SAY[act];
      };
      const soon = (a, ms) => { forced = a; forcedUntil = Date.now() + (ms || 25000); if (Date.now() - last > 2500) shot(); };
      shot();
      c.every(() => {
        const d = new Date(); time.textContent = d.toTimeString().slice(0, 8);
        const left = Math.max(0, 30 - Math.floor((Date.now() - last) / 1000)); nextEl.textContent = left ? `next picture in ${left}s` : 'loading...';
        if (act === 'run') { nTurns += 1.1; } turns.textContent = Math.floor(nTurns).toLocaleString('en-GB');
        if (Date.now() - last >= 30000) shot();
      }, 1000);
      const showSeeds = v => { if (typeof v === 'number') seeds.textContent = v.toLocaleString('en-GB'); };
      c.get(['web.hamster.seeds']).then(v => showSeeds(v['web.hamster.seeds'] || 0)); c.watch('web.hamster.seeds', ev => { if (ev.type === 'set') { showSeeds(ev.v); seedsOnFloor++; soon(seedsOnFloor % 3 ? 'eat' : 'stuff'); say.textContent = HN + ' is: eating (thanks ' + (ev.by || 'someone') + ')'; } });
      let lastFeed = 0; el.querySelector('.hc-feed').addEventListener('click', () => { if (Date.now() - lastFeed < 1500) return; lastFeed = Date.now(); if (!Net.kv.inc('web.hamster.seeds')) { seedsOnFloor++; soon('eat'); } Sound.play('pet'); });
      el.querySelector('.hc-poke').addEventListener('click', () => { pokes++; Sound.play('click'); if (pokes === 12) { c.secret('web.hamster'); hideUntil = Date.now() + 5 * 60000; forced = null; shot(); Desk.toast(HN, Cast.t('{hamster} has had enough of you and has gone into {hamster.his} tube.'), 4000); } else if (Date.now() > hideUntil) soon('look', 20000); });
      el.querySelector('.hc-light').addEventListener('click', () => { flip = !flip; Sound.play('button'); shot(); });
      const upd = m => { const l = (m && m.online) || []; watch.textContent = Math.max(1, l.length); }; Net.on('online', upd); upd({ online: W.online || [] });
    },
  });

  // ---------------------------------------------------------------- jokes
  W.JOKES = Cast.deep([['Why did the computer go to the doctor?', 'It had a virus. (And a bad case of JackOS.)'], ['What do you call a robot with a computer?', 'Whatever he wants. He IS a computer.'], ["Why did Dave's cat sit on the keyboard?", "It wanted to be the mouse's boss."], ['How many floppy disks does it take to install a game?', 'Twenty-three. And disk 17 is always broken.'], ['What did the modem say to the phone?', 'SCREEEEEEE-BEEP-BEEP-KSHHHHHH. (Mom hung up.)'], ['Why did the shark go on the Internet?', 'It heard there were a lot of bytes.'], ['What is a Y2K bug\'s favourite year?', '1900. Any day now.'], ['Why was the hamster so fast on the Internet?', 'He had a wheel connection.'], ['What did Gubbinz say when his computer crashed?', '"It was like that when I got here."'], ['Why does the printer never work at Computer Club?', 'Because it saw what Dave printed last time.'], ['What do you get if you cross a cube with a cheat?', 'Dave, with the stickers in his hand.'], ['Why did the web page go to the gym?', 'It wanted to be a bit more... loaded.'], ['How does a hamster sign a guestbook?', 'Very slowly, and mostly with seeds.'], ['Why do webrings never end?', "Because {kidSoon}'s page is still under construction and they're waiting for {kidSoon.him}."]]);
  def('jokes', {
    css: `.wp-jokes{background:#ffe66d ${tile('<text x="4" y="24" font-size="20" fill="#f5d84a">HA</text>', 40, 32)};color:#000;font:15px/1.5 "Comic Sans MS",cursive}
.wp-jokes .jk-wrap{max-width:560px;margin:0 auto;background:#fff;border:4px solid #000;padding:12px 16px;box-shadow:6px 6px 0 #000}
.wp-jokes h1{font:bold 34px "Comic Sans MS",cursive;text-align:center;margin:0 0 4px;color:#d00}
.wp-jokes .jk-q{font-size:20px;font-weight:bold;margin:12px 0 6px}
.wp-jokes .jk-a{font-size:18px;color:#060;min-height:28px}
.wp-jokes .jk-a.hid{color:transparent;background:#000;cursor:pointer}
.wp-jokes .jk-rate{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.wp-jokes .jk-groan{font-size:13px;color:#555}
.wp-jokes .jk-old{border-top:2px dashed #999;margin-top:14px;padding-top:8px}
.wp-jokes .jk-old li{margin:4px 0}
.wp-jokes a{color:#d00}.wp-jokes .wgb{border-color:#000}.wp-jokes .wgb-head{background:#d00}`,
    html: c => { const i = c.t99.date.getDate() % W.JOKES.length; const j = W.JOKES[i]; return `<div class="jk-wrap"><h1>JOKE OF THE DAY</h1><p class="c small">A new joke every day. Rate it. Groan at it. The groans are counted LIVE.</p>
<div class="jk-q">${esc(j[0])}</div><div class="jk-a hid" data-i="${i}" role="button" tabindex="0">${esc(j[1])}</div><p class="small">(click the black bit for the punchline)</p>
<div class="jk-rate"><button class="btn" type="button" data-r="ha">HA!</button><button class="btn" type="button" data-r="groan">GROAN</button><button class="btn" type="button" data-r="dave">Dave laughed</button></div>
<div class="jk-groan">Today: <b class="jk-ha">?</b> HAs, <b class="jk-gr">?</b> groans, <b class="jk-dv">?</b> Daves</div>
<div class="jk-old"><b>OLD JOKES (rate these too)</b><ul>${W.JOKES.map((jj, k) => k === i ? '' : `<li><span>${esc(jj[0])}</span> <span class="jk-a hid" data-i="${k}" role="button" tabindex="0" style="display:inline;font-size:14px;padding:0 4px">${esc(jj[1])}</span> <button class="btn" type="button" data-rate="${k}" style="font-size:10px;padding:0 4px">rate</button></li>`).join('')}</ul></div>
<p class="c">Laughers: ${c.counter('plain')}</p>
${c.gb([['Dave', c.daysAgo(1), 'HA. (the cat one)', 5], ['Nan', c.daysAgo(3), 'I DID NOT UNDERSTAND THE MODEM ONE. JACK EXPLAINED IT. I STILL DO NOT.', 3], ['Gubbinz', c.daysAgo(4), 'the computer WAS like that wen i got here', 5]], { title: 'SEND A JOKE', ph: 'Clean jokes only. Nan reads this.' })}
<p class="c small">${c.a('news', 'JackNet News')} &middot; ${c.a('fanfic', 'longer funny things')} &middot; ${c.a('poetree', 'poems (also funny, by accident)')}</p>
${c.ring()}</div>`; },
    setup(el, c) {
      el.querySelectorAll('.jk-a').forEach(a => { const rev = () => { a.classList.remove('hid'); Sound.play('boing'); }; a.addEventListener('click', rev); a.addEventListener('keydown', e => { if (e.key === 'Enter') rev(); }); });
      const i = +el.querySelector('.jk-q').nextElementSibling.dataset.i, K = 'web.jokes.' + i;
      const show = v => { v = v && typeof v === 'object' ? v : {}; el.querySelector('.jk-ha').textContent = +v.ha || 0; el.querySelector('.jk-gr').textContent = +v.groan || 0; el.querySelector('.jk-dv').textContent = +v.dave || 0; };
      const load = () => c.get([K]).then(v => show(v[K])); load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
      let rated = 0; try { rated = +localStorage.getItem('jhp_web_jokes') || 0; } catch (e) {}
      const rate = (k, r) => { const KK = 'web.jokes.' + k; c.get([KK]).then(v => { const o = v[KK] || {}; Net.kv.put(KK, r, String((+o[r] || 0) + 1)); }); rated++; try { localStorage.setItem('jhp_web_jokes', rated); } catch (e) {} if (rated >= 5) c.secret('web.joke'); Sound.play('click'); };
      el.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => rate(i, b.dataset.r)));
      el.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => { rate(+b.dataset.rate, W.pick(['ha', 'groan', 'dave'])); b.textContent = 'rated!'; b.disabled = true; }));
    },
  });

  // ---------------------------------------------------------------- jackmail: free e-mail sign-up
  def('jackmail', {
    css: `.wp-jackmail{background:#fff;color:#000;font:13px/1.4 Verdana,Arial,sans-serif}
.wp-jackmail .jm-top{background:#1a5fb4;color:#fff;padding:10px 14px;margin:-18px -18px 12px;display:flex;align-items:center;gap:10px}
.wp-jackmail .jm-top h1{font:bold 28px Arial,sans-serif;margin:0}.wp-jackmail .jm-top h1 span{color:#ffd400}
.wp-jackmail .jm-cols{display:flex;gap:14px;flex-wrap:wrap}
.wp-jackmail .jm-form{flex:1 1 280px;border:1px solid #999;padding:10px 14px;background:#f4f8ff}
.wp-jackmail .jm-form label{display:block;margin:6px 0 2px;font-weight:bold}.wp-jackmail .jm-form input[type=text],.wp-jackmail .jm-form input[type=password],.wp-jackmail .jm-form select{width:100%;box-sizing:border-box}
.wp-jackmail .jm-why{flex:1 1 220px}
.wp-jackmail .jm-why li{margin:4px 0}
.wp-jackmail .jm-inbox{display:none;border:2px solid #1a5fb4;margin-top:14px}
.wp-jackmail .jm-inbox h2{background:#1a5fb4;color:#fff;font:bold 14px Arial,sans-serif;margin:0;padding:4px 8px}
.wp-jackmail .jm-inbox table{width:100%}.wp-jackmail .jm-inbox td{padding:4px 6px;border-bottom:1px solid #ddd;vertical-align:top}
.wp-jackmail .jm-inbox tr.new td{font-weight:bold}
.wp-jackmail .jm-msg{display:none;padding:8px;background:#fffff0;border-top:1px solid #999;white-space:pre-wrap;font:13px/1.4 "Courier New",monospace}
.wp-jackmail .jm-avail{font-weight:bold;min-height:18px}
.wp-jackmail a{color:#1a5fb4}
@media (max-width:600px){.wp-jackmail .jm-top{margin:-12px -10px 12px}}`,
    html: c => `<div class="jm-top"><h1>Jack<span>Mail</span></h1><span>FREE e-mail for everyone! 2 MB of space!!!</span></div>
<div class="jm-cols"><div class="jm-form"><h3 style="margin:0">Sign up (it's free!!!)</h3>
<label>Pick your address</label><div style="display:flex;align-items:center;gap:4px"><input type="text" class="jm-user" maxlength="16" placeholder="coolkid99" aria-label="Address" style="flex:1"><span>@jackmail.webcom</span></div><div class="jm-avail"></div>
<label>Password (don't use "password")</label><input type="password" class="jm-pw" maxlength="20" autocomplete="off">
<label>Secret question</label><select class="jm-q"><option>What is your pet's name?</option><option>What is your favourite game?</option><option>What is Dave's cat called?</option></select>
<label>Answer</label><input type="text" class="jm-a" maxlength="30">
<label><input type="checkbox" class="jm-spam" checked> Send me the JackMail newsletter (once a week) (it's just Jack)</label>
<p><button class="btn jm-go" type="button">CREATE MY FREE E-MAIL!!!</button></p></div>
<div class="jm-why"><h3 style="margin:0 0 4px">Why JackMail?</h3><ul><li><b>2 MB</b> of space. That's about 2,000 e-mails. Or one photo.</li><li>Check it from ANY computer. Even the library one.</li><li>No adverts (there's one advert, it's for Dave's page, he paid 10p)</li><li>Attachments up to 500 KB. A MIDI is about 6 KB. Send MIDIs.</li><li>Your own address, forever*</li></ul><p class="small">*forever = until Jack's Mom needs the phone line.</p><p class="small">Already got a JackMail address? You haven't. It's new. But soon!</p></div></div>
<div class="jm-inbox"><h2>Inbox - <span class="jm-me"></span> (3 new)</h2><table><tbody class="jm-list"></tbody></table><div class="jm-msg"></div></div>
<p class="c small">Sign-ups so far: <b class="jm-n">?</b> &middot; Hits: ${c.counter('plain')} &middot; ${c.a('news', 'JackNet News')} &middot; ${c.a('chatroom', 'Chat instead')}</p>`,
    setup(el, c) {
      const user = el.querySelector('.jm-user'), avail = el.querySelector('.jm-avail'), TAKEN = ['jack', 'dave', 'gubbinz', 'admin', 'mom', 'kim', 'postmaster', 'webmaster', 'coolkid99', 'nibbles'];
      user.addEventListener('input', () => { const u = user.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); user.value = u; avail.style.color = ''; avail.textContent = !u ? '' : TAKEN.includes(u) ? (avail.style.color = '#c00', 'Sorry, ' + u + ' is taken! Try ' + u + W.ri(1980, 1999)) : (avail.style.color = '#080', u + '@jackmail.webcom is available!'); });
      const n = el.querySelector('.jm-n'); const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); }; c.get(['web.jackmail.n']).then(v => show(v['web.jackmail.n'] || 0)); c.watch('web.jackmail.n', ev => { if (ev.type === 'set') show(ev.v); });
      el.querySelector('.jm-go').addEventListener('click', () => {
        const u = user.value.trim(); if (!u || TAKEN.includes(u)) { avail.style.color = '#c00'; avail.textContent = 'Pick an address first!'; return; }
        if (el.querySelector('.jm-pw').value.toLowerCase() === 'password') { Desk.msgbox('JackMail', 'Your password cannot be "password". Everyone tries that. Dave tried it four times.', 'warn'); return; }
        const box = el.querySelector('.jm-inbox'); box.style.display = 'block'; el.querySelector('.jm-me').textContent = u + '@jackmail.webcom';
        const MAILS = [['JackMail Team', 'Welcome to JackMail!!!', `Hi ${u}!\n\nWelcome to JackMail. You have 2 MB. Use it wisely.\n\nTips:\n- Don't open attachments from people you don't know.\n- Don't open attachments from Dave either.\n- CAPITALS IS SHOUTING.\n\nThe JackMail Team (Jack)`], ['Dave', 'check out my page!!!!!', `${u} m8\n\nmy page is about wrestling now. the cat is the champion. come and see it\n\nhttp://www.davesplace.jnet/\n\nDave\n\nPS this is the advert i paid 10p for`], ['Gubbinz', 'RUPEES', `you got roopeez?\n\ni need roopeez.\n\nsend roopeez.\n\n- G\n\n(this message was sent from the Gem Exchange, the only shop on the internet that takes Rupees)`]];
        el.querySelector('.jm-list').innerHTML = MAILS.map((m, i) => `<tr class="new" data-m="${i}" style="cursor:pointer"><td>${esc(m[0])}</td><td>${esc(m[1])}</td><td class="small">${c.today}</td></tr>`).join('');
        el.querySelectorAll('[data-m]').forEach(r => r.addEventListener('click', () => { r.classList.remove('new'); const m = MAILS[+r.dataset.m]; const d = el.querySelector('.jm-msg'); d.style.display = 'block'; d.textContent = `From: ${m[0]}\nSubject: ${m[1]}\n\n${m[2]}`; Sound.play('click'); }));
        Net.kv.inc('web.jackmail.n'); Sound.play('join'); c.secret('web.jackmail'); box.scrollIntoView({ block: 'start', behavior: 'smooth' });
        Desk.toast('JackMail', 'You\'ve got mail! (3 messages, 1 of them is Gubbinz asking for Rupees)', 4000);
      });
    },
  });

  // ---------------------------------------------------------------- chatroom: the Back Room (shared log + live)
  def('chatroom', {
    css: `.wp-chatroom{background:#000;color:#ccc;font:13px/1.4 "Courier New",monospace}
.wp-chatroom h1{font:bold 22px "Courier New",monospace;color:#0f0;margin:0 0 6px}
.wp-chatroom .ch-wrap{display:flex;gap:8px;flex-wrap:wrap}
.wp-chatroom .ch-log{flex:3 1 300px;height:300px;overflow:auto;background:#000;border:2px inset #666;padding:6px;min-width:0}
.wp-chatroom .ch-who{flex:1 1 120px;height:300px;overflow:auto;background:#000;border:2px inset #666;padding:6px;color:#8cf;min-width:0}
.wp-chatroom .ch-line{margin:2px 0;white-space:pre-wrap;word-break:break-word}
.wp-chatroom .ch-line b{color:#ff0}.wp-chatroom .ch-line.me b{color:#0f0}.wp-chatroom .ch-sys{color:#888;font-style:italic}
.wp-chatroom form{display:flex;gap:4px;margin-top:6px}.wp-chatroom input{flex:1;min-width:0;background:#000;color:#0f0;border:2px inset #666;font:13px "Courier New",monospace}
.wp-chatroom .ch-rules{color:#888;font-size:11px}
.wp-chatroom a{color:#ff0}`,
    html: c => `<h1>#backroom - JackNet Chat</h1><p class="ch-rules">Topic: whatever. Rules: be nice, no CAPITALS, no asking where people live, no links (they get removed anyway). The last 40 lines are kept so you can see what you missed. Everyone on JackNet is in here.</p>
<div class="ch-wrap"><div class="ch-log" aria-live="polite"><div class="ch-sys">*** Connecting to #backroom...</div></div><div class="ch-who"><b>WHO'S HERE</b><div class="ch-list">...</div></div></div>
<form class="ch-f" autocomplete="off"><span class="ch-nick" style="color:#0f0">${esc(Net.me.nick || 'Guest')}&gt;</span><input type="text" maxlength="140" placeholder="say something..." aria-label="Message"><button class="btn" type="submit">Send</button></form>
<p class="small">Hits: ${c.counter('green')} &middot; ${c.go('chat', 'the main chat room')} &middot; ${c.a('news', 'JackNet News')} &middot; ${c.a('jackmail', 'get free e-mail')}</p>`,
    setup(el, c) {
      const log = el.querySelector('.ch-log'), list = el.querySelector('.ch-list'), inp = el.querySelector('input'), K = 'web.chat.log'; let last = 0;
      const line = e => { const d = document.createElement('div'); d.className = 'ch-line' + (e.by === Net.me.nick ? ' me' : ''); d.innerHTML = `<span class="small">[${W.tsTime(e.ts)}]</span> <b>&lt;${esc(e.by)}&gt;</b> ${esc(e.text)}`; log.appendChild(d); log.scrollTop = log.scrollHeight; };
      const sys = t => { const d = document.createElement('div'); d.className = 'ch-sys'; d.textContent = '*** ' + t; log.appendChild(d); log.scrollTop = log.scrollHeight; };
      c.get([K]).then(v => { (Array.isArray(v[K]) ? v[K] : []).forEach(line); sys('You have joined #backroom. ' + (Array.isArray(v[K]) && v[K].length ? 'Scroll up for the last 40 lines.' : 'It is very quiet. Say something!')); });
      c.watch(K, ev => { if (ev.type === 'push') { line(ev.e); if (ev.e.by !== Net.me.nick) Sound.play('click'); } });
      el.querySelector('.ch-f').addEventListener('submit', ev => { ev.preventDefault(); const t = inp.value.trim(); if (!t) return; if (Date.now() - last < 5500) { sys('Slow down! One message every 5 seconds (the modem can\'t keep up).'); return; } if (t === t.toUpperCase() && /[A-Z]{6}/.test(t)) { sys('NO SHOUTING. (caps lock, mate)'); return; } if (!Net.kv.push(K, t)) { sys('Not connected to JackNet.'); return; } last = Date.now(); inp.value = ''; c.secret('web.chat'); });
      const who = m => { const l = (m && m.online) || []; list.innerHTML = (l.length ? l : [{ nick: Net.me.nick || 'you', col: '#0f0' }]).slice(0, 30).map(x => `<div style="color:${esc(x.col || '#8cf')}">${esc(x.nick)}${x.where ? ' <span class="small" style="color:#666">(' + esc(String(x.where).slice(0, 10)) + ')</span>' : ''}</div>`).join(''); }; Net.on('online', who); who({ online: W.online || [] });
    },
  });

  // ---------------------------------------------------------------- counters: the collection + live top 10
  def('counters', {
    css: `.wp-counters{background:#fff ${tile('<text x="2" y="12" font-family="Courier New" font-size="10" fill="#eee">0001337</text>', 60, 16)};color:#000;font:13px/1.5 Verdana,Arial,sans-serif}
.wp-counters h1{font:bold 26px "Courier New",monospace;text-align:center;margin:4px 0}
.wp-counters .cn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:12px 0}
.wp-counters .cn-box{border:1px solid #999;padding:8px;background:#fafafa;text-align:center}
.wp-counters .cn-box b{display:block;font-size:11px;color:#555;margin-bottom:4px}
.wp-counters table{width:100%;max-width:560px;margin:0 auto;background:#fff}.wp-counters td,.wp-counters th{border:1px solid #999;padding:3px 6px;text-align:left}.wp-counters th{background:#eee}
.wp-counters .cn-bar{height:10px;background:#000080}
.wp-counters a{color:#00c}`,
    html: c => `<h1>THE WEB COUNTER COLLECTION</h1><p class="c">Every homepage needs a hit counter. Here is every kind we've got, all counting THIS page, all live, all shared with everyone on JackNet. Refresh to see yourself count.</p>
<div class="cn-grid">${[['Classic odometer', 'odo'], ['Red LED', 'led'], ['Green terminal', 'green'], ['Flip clock', 'flip'], ['Gold plated', 'gold'], ['Plain text', 'plain'], ['In words', 'words'], ['Roman numerals', 'roman'], ['Binary', 'bin'], ['Hexadecimal', 'hex'], ['Tally marks', 'tally']].map(([n, st]) => `<div class="cn-box"><b>${n}</b>${c.counter(st)}</div>`).join('')}</div>
<h3 class="c">TOP 10 MOST VISITED PAGES ON THE 1999 WEB (live)</h3><table class="cn-top"><tr><th>#</th><th>Page</th><th>Hits</th><th></th></tr><tbody><tr><td colspan="4">Counting...</td></tr></tbody></table>
<p class="c small">Total hits on everything, ever: ${c.counter('odo', { k: 'web.hits.total', len: 7 })}</p>
<p class="c small">${c.a('news', 'JackNet News')} &middot; ${c.a('hamstercam', 'is {hamster} winning?')} &middot; ${c.a('~dave', 'Dave says his is the most visited')}</p>
${c.ring()}`,
    setup(el, c) {
      const words = Object.keys(M).filter(w => M[w].cat !== 'hidden'), keys = words.map(w => 'web.hits.' + W.key(w)), body = el.querySelector('.cn-top tbody');
      const draw = vals => { const rows = words.map((w, i) => [w, +vals[keys[i]] || 0]).sort((a, b) => b[1] - a[1]).slice(0, 10), max = rows[0] ? rows[0][1] : 1; body.innerHTML = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${c.a(r[0])}</td><td>${r[1].toLocaleString('en-GB')}</td><td style="width:120px"><div class="cn-bar" style="width:${Math.max(2, r[1] / Math.max(1, max) * 100)}%"></div></td></tr>`).join(''); };
      const load = () => Promise.all([keys.slice(0, 30), keys.slice(30, 60), keys.slice(60, 90)].filter(k => k.length).map(k => c.get(k))).then(parts => draw(Object.assign({}, ...parts)));
      load(); c.every(load, 15000);
    },
  });

  // ---------------------------------------------------------------- lost: the 404 page with a way out
  def('lost', {
    css: `.wp-lost{background:#fff;color:#000;font:14px/1.5 Arial,sans-serif;min-height:520px}
.wp-lost h1{font:bold 22px Arial,sans-serif;margin:0 0 8px}
.wp-lost .lo-white{color:#fff;font-size:11px;user-select:text}
.wp-lost .lo-dot{color:#fefefe;text-decoration:none;font-size:11px}
.wp-lost .lo-dot:hover,.wp-lost .lo-dot:focus{color:#000}
.wp-lost hr{border:0;border-top:1px solid #ccc}
.wp-lost .lo-maze{font:12px/1.1 "Courier New",monospace;white-space:pre;background:#f4f4f4;padding:8px;display:inline-block;border:1px solid #ccc}
.wp-lost a{color:#00c}`,
    html: c => `<h1>404 Not Found</h1><p>The requested page could not be found on this server. It may have been moved, deleted, eaten by the dog, or never existed in the first place (like {kidSoon}'s page).</p><hr>
<p><i>JackNet/1.9.9 Server at ${c.host} Port 80</i></p>
<p>Things you could try:</p><ul><li>Check the spelling. (Was it "~dave" or "~dav"? Dave can't spell it either.)</li><li>Go back and click something else.</li><li>Use ${c.a('search', 'JackSearch')} to find what you were looking for.</li><li>Sit very still until the page loads. (It won't.)</li></ul>
<p class="lo-maze">#########################
#   #       #     #     #
# # # ##### # ### # ### #
# #   #   #   # # # #   #
# ##### # ##### # ### # #
#       #       #     # #
####### ####### ####### #
#     #   #       #     #
# ### ### # ##### # #####
# #     #   #   #   #   #
# # ######### # ##### # #
#   #         #       # #
#########################
   you are here: ?   exit: ?</p>
<p class="small">While you're lost, here are some other lost things: Dave's PE kit, the remote, disk 17 of 23, the last Rolo, {kidSoon}'s page, my patience.</p>
<p class="lo-white">You are not really lost. The way out is the full stop at the end of this sentence<a href="#" class="lo-dot" data-wp="riddle" aria-label="A hidden link">.</a> Select all to see this. (Ctrl+A.)</p>
<p class="small c">Lost visitors: ${c.counter('plain')}</p>`,
    setup(el, c) {
      const dot = el.querySelector('.lo-dot'); dot.addEventListener('click', () => { c.secret('web.lost'); Desk.toast('404', 'You found the way out! It leads to a riddle. Of course it does.', 3500); });
      const sel = () => { const s = String(window.getSelection() || ''); if (/not really lost/.test(s)) c.secret('web.whitetext'); }; document.addEventListener('selectionchange', sel); return () => document.removeEventListener('selectionchange', sel);
    },
  });

  // ---------------------------------------------------------------- downloads: FREE DOWNLOADS!!! (56K, Mom and the phone)
  const DLS = [['Flying Saucers 2.0', '1.2 MB', 'Screensaver. Flying saucers whizz about. Also on this computer already, but download it anyway.'], ['lightspatula Cursor Pack', '340 KB', 'Replace your mouse pointer with a tiny glowing sword. Ages to load. Worth it.'], ['JackAmp Skins Vol. 1', '890 KB', 'Make JackAmp green. Make JackAmp orange. Make JackAmp a cat.'], ['MIDI Mega Pack (all 16)', '96 KB', 'Every tune on MIDI Heaven in one zip. Tiny! MIDIs are magic.'], ['Y2K Fixer Deluxe', '4.7 MB', '{kidY2k} made this. It is a text file that says "unplug it". 4.7 MB because of the pictures.'], ['Episode I Trailer (teaser)', '12 MB', '{kidEp1}\'s copy. 240 pixels wide. Took 2 hours 41 minutes. Allow all evening and tell your Mom.'], ['Dave\'s Wrestling Theme (WAV)', '2.9 MB', 'It\'s one beep, but at CD quality.']];
  def('downloads', {
    css: `.wp-downloads{background:#008080 ${tile('<path d="M16 4v16M8 14l8 8 8-8" stroke="#007070" stroke-width="3" fill="none"/>', 32)};color:#fff;font:13px/1.4 Verdana,Arial,sans-serif}
.wp-downloads h1{font:bold 34px Impact,sans-serif;text-align:center;color:#ff0;text-shadow:3px 3px #000;margin:4px 0}
.wp-downloads .dl-list{max-width:620px;margin:0 auto;background:#fff;color:#000;border:3px outset #ccc;padding:8px}
.wp-downloads .dl-item{display:flex;gap:10px;align-items:center;border-bottom:1px solid #ccc;padding:6px 2px;flex-wrap:wrap}
.wp-downloads .dl-item b{flex:1 1 160px}.wp-downloads .dl-item .sz{width:60px;color:#555;font-size:12px}
.wp-downloads .dl-item p{flex:1 1 100%;margin:0;font-size:12px;color:#444}
.wp-downloads .dl-win{display:none;max-width:420px;margin:14px auto;background:#c0c0c0;color:#000;border:2px outset #fff;font:12px var(--ui)}
.wp-downloads .dl-win .tb{background:#000080;color:#fff;font-weight:bold;padding:3px 6px}
.wp-downloads .dl-win .in{padding:10px}
.wp-downloads .dl-bar{height:16px;border:2px inset #fff;background:#fff;position:relative;margin:6px 0}
.wp-downloads .dl-bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(90deg,#000080 0 8px,transparent 8px 10px)}
.wp-downloads .dl-st{min-height:32px;white-space:pre-line}
.wp-downloads a{color:#ff0}`,
    html: c => `<h1>FREE DOWNLOADS!!!</h1>
<p class="c"><marquee scrollamount="7">ALL FREE *** NO CATCH *** (the catch is your phone line) *** CLICK TO DOWNLOAD *** 56K MODEM RECOMMENDED *** MOM NOT RECOMMENDED ***</marquee></p>
<div class="dl-list">${DLS.map((d, i) => `<div class="dl-item"><b>${esc(d[0])}</b><span class="sz">${d[1]}</span><button class="btn" type="button" data-dl="${i}">Download</button><p>${esc(d[2])}</p></div>`).join('')}</div>

<p class="c">Downloaders: ${c.counter('odo')} &middot; Phone calls interrupted: <b class="dl-mom">?</b></p>
<p class="c small">${c.a('midi', 'MIDI Heaven')} &middot; ${c.a('~mike', 'is your PC fast enough?')} &middot; ${c.a('~sam', "{kidEp1}'s download diary")} &middot; ${c.a('jackamp', 'JackAmp')}</p>`,
    setup(el, c) {
      // the download happens in JackNet Explorer's own File Download window (a separate window on the desktop)
      let t = null, dw = null, bar, st, name;
      const openDlg = () => { if (dw && !dw.closed) return; const b = document.createElement('div'); b.innerHTML = '<div class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start"><svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><rect x="4" y="6" width="24" height="18" fill="#c0c0c0" stroke="#000"/><path d="M16 9v10M11 14l5 5 5-5" stroke="#000080" stroke-width="2.5" fill="none"/></svg><div style="min-width:0">Saving:<br><b class="dl-name"></b></div></div><div class="dl-bar" style="height:16px;border:2px inset #fff;background:#fff;position:relative;margin:10px 0"><i style="position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(90deg,#000080 0 8px,transparent 8px 10px)"></i></div><div class="dl-st" style="min-height:44px;white-space:pre-line;font-size:12px"></div><div class="row" style="justify-content:flex-end"><button class="btn dl-cancel" type="button" style="min-width:75px">Cancel</button></div>'; dw = Apps.win('File Download', b, { w: 360, noMax: true, noResize: true, escClose: true, onClose: () => stop() }); bar = b.querySelector('.dl-bar i'); st = b.querySelector('.dl-st'); name = b.querySelector('.dl-name'); b.querySelector('.dl-cancel').addEventListener('click', () => dw.close()); };
      const mom = el.querySelector('.dl-mom'); const show = v => { if (typeof v === 'number') mom.textContent = v.toLocaleString('en-GB'); }; c.get(['web.downloads.mom']).then(v => show(v['web.downloads.mom'] || 0)); c.watch('web.downloads.mom', ev => { if (ev.type === 'set') show(ev.v); });
      const stop = () => { clearInterval(t); t = null; };
      el.querySelectorAll('[data-dl]').forEach(b => b.addEventListener('click', () => {
        const d = DLS[+b.dataset.dl], mb = parseFloat(d[1]) * (/KB/.test(d[1]) ? 0.001 : 1); stop(); openDlg(); name.textContent = d[0] + ' (' + d[1] + ')'; let p = 0; const secs = Math.round(mb * 190), momAt = mb > 1 ? 30 + Math.random() * 40 : 999;
        st.textContent = 'Estimated time left: ' + (secs > 90 ? Math.round(secs / 60) + ' min' : secs + ' sec') + ' (at 4.6 KB/sec)'; bar.style.width = '0'; Sound.play('modem');
        t = setInterval(() => { if (!dw || dw.closed) return stop(); p += 1.5 + Math.random() * 2; bar.style.width = Math.min(100, p) + '%';
          if (p >= momAt) { stop(); st.textContent = 'MOM PICKED UP THE PHONE.\nConnection lost. Download failed at ' + Math.round(momAt) + '%.\n"I need to ring your Nan."'; Sound.play('uhoh'); Net.kv.inc('web.downloads.mom'); c.secret('web.download'); return; }
          if (p >= 100) { stop(); st.textContent = 'Download complete! Saved to C:\\My Documents\\Downloads\\' + d[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) + '.ZIP (pretend)'; Sound.play('solve'); }
          else st.textContent = 'Transferring... ' + Math.round(p) + '%  ' + (Math.round(mb * 1024 * p / 100)) + ' KB of ' + Math.round(mb * 1024) + ' KB'; }, 160);
      }));
      return () => { stop(); };
    },
  });

  // ---------------------------------------------------------------- crystalball
  const ANS = ['YES. definitly. (i think)', 'NO. the ball says no. the ball is never wrong. the ball was wrong once.', 'ask again wen the ball has had a biscuit', 'the future is cloudy. (i breathed on it)', 'only on a tuesday', 'YESSS (like when you finally beat a boss)', 'the ball says: ask your Mom', 'it is certain. unless it isnt.', 'signs point to Pot Noodlez', 'i can see... a little green face... oh. thats my reflection.', 'yes but dave will ruin it', 'NO. and stop askin about dave\'s cat.'];
  def('crystalball', {
    css: `.wp-crystalball{background:#1a0a2e ${tile('<circle cx="20" cy="20" r="1" fill="#5a3a8a"/><circle cx="50" cy="44" r=".7" fill="#7a5aaa"/>', 60)};color:#e8d8ff;font:15px/1.5 Georgia,serif}
.wp-crystalball h1{font:italic bold 30px Georgia,serif;text-align:center;color:#ffd700;margin:4px 0;text-shadow:0 0 10px #f0c}
.wp-crystalball .cb-ball{position:relative;width:200px;height:200px;margin:12px auto;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0,#c8f 15%,#60a 55%,#204 100%);box-shadow:0 0 40px #a4f,inset 0 0 30px #fff3}
.wp-crystalball .cb-ball.think{animation:cbglow .5s infinite alternate}
@keyframes cbglow{to{box-shadow:0 0 70px #f4f;transform:scale(1.03)}}
.wp-crystalball .cb-grot{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);width:120px;height:60px;background:radial-gradient(ellipse at 50% 100%,#3a2a4a,#1a0a2e 70%);border-radius:60px 60px 4px 4px}
.wp-crystalball .cb-ans{text-align:center;font:bold 20px Georgia,serif;color:#ffd700;min-height:60px;max-width:420px;margin:10px auto}
.wp-crystalball form{display:flex;gap:6px;max-width:420px;margin:0 auto;flex-wrap:wrap;justify-content:center}
.wp-crystalball input{flex:1 1 220px;font:14px Georgia,serif}
.wp-crystalball a{color:#ffd700}`,
    html: c => `<h1>Mystic Gubbinz's Crystal Ball</h1><p class="c"><i>"i can see the future. it is green."</i></p>
<div class="cb-ball" aria-hidden="true"><div class="cb-grot"></div></div>
<form class="cb-f" autocomplete="off"><input type="text" maxlength="80" placeholder="ask the ball a question..." aria-label="Your question"><button class="btn" type="submit">ASK</button></form>
<div class="cb-ans" aria-live="polite">(the ball is waitin)</div>
<p class="c small">Mystic Gubbinz charges 1 Rupee per question. Questions asked by everyone: <b class="cb-n">?</b>. Rupees received: 0. He is "lookin into it".</p>
<p class="c small">Visitors from the future: ${c.counter('words')}</p>
<p class="c small">${c.a('poetree', 'the poems')} &middot; ${c.a('teef', 'the shop')} &middot; ${c.a('~gaz', 'the future ({kidY2k}\'s version)')} &middot; ${c.a('orktranslate', 'the translator')}</p>`,
    setup(el, c) {
      const ball = el.querySelector('.cb-ball'), ans = el.querySelector('.cb-ans'), inp = el.querySelector('input'); let busy = false;
      const n = el.querySelector('.cb-n'); const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); }; c.get(['web.crystal.q']).then(v => show(v['web.crystal.q'] || 0)); c.watch('web.crystal.q', ev => { if (ev.type === 'set') show(ev.v); });
      el.querySelector('.cb-f').addEventListener('submit', ev => { ev.preventDefault(); const q = inp.value.trim(); if (!q || busy) return; busy = true; ball.classList.add('think'); ans.textContent = '...the ball is thinkin...'; Sound.play('zap'); Net.kv.inc('web.crystal.q');
        setTimeout(() => { if (!el.isConnected) return; ball.classList.remove('think'); busy = false; let a = W.pick(ANS); if (/2000|millenni|y2k|future|next year/i.test(q)) { a = 'the year 2000? ...the ball says: IT NEVER COMES. it is 1999 forever on this komputer. (thats a feature)'; c.secret('web.crystal'); } else if (/dave/i.test(q)) a = 'the ball says: Dave will say it was a draw. it was not a draw.'; else if (/rupee|teef|toof/i.test(q)) a = 'YES. send them to the Gem Exchange. (this is not a prediction. this is a request.)'; ans.textContent = a; Sound.play('boing'); inp.value = ''; }, 1600); });
    },
  });

  // ---------------------------------------------------------------- orktranslate: Babel Jack
  const ORK = [[/\bthe\b/gi, 'da'], [/\bthis\b/gi, 'dis'], [/\bthat\b/gi, 'dat'], [/\bthese\b/gi, 'dese'], [/\bthose\b/gi, 'dose'], [/\bthere\b/gi, 'dere'], [/\bthem\b/gi, 'dem'], [/\bthey\b/gi, 'dey'], [/\bthen\b/gi, 'den'], [/\bwith\b/gi, 'wiv'], [/\bwhat\b/gi, 'wot'], [/\bwas\b/gi, 'woz'], [/\byou\b/gi, 'yoo'], [/\byour\b/gi, 'yer'], [/\bthing(s?)\b/gi, 'fing$1'], [/\bsomething\b/gi, 'sumfink'], [/\bnothing\b/gi, 'nuffink'], [/\bteeth\b/gi, 'teef'], [/\btooth\b/gi, 'toof'], [/\bvery\b/gi, 'dead'], [/\bgood\b/gi, 'proppa'], [/\bbad\b/gi, 'rubbish'], [/\bbig\b/gi, 'massiv'], [/\bfast\b/gi, 'fasta'], [/\bfight(ing)?\b/gi, 'krumpin'], [/\bhello\b/gi, 'OI'], [/\bgoodbye\b/gi, 'WAAAGH'], [/\bcomputer\b/gi, 'komputer'], [/\binternet\b/gi, 'da big net'], [/\bfriend(s?)\b/gi, 'mate$1'], [/\bmoney\b/gi, 'roopeez'], [/\bfood\b/gi, 'squig'], [/\bdave\b/gi, 'DAVE (boo)'], [/\bmom\b/gi, 'da Boss'], [/ing\b/g, 'in'], [/\bof\b/gi, 'ov'], [/\bthink\b/gi, 'fink'], [/\bthree\b/gi, 'free'], [/\bthanks?\b/gi, 'ta'], [/\bplease\b/gi, 'NOW'], [/\bred\b/gi, 'red (fasta)'], [/\?/g, '?!'], [/!/g, '!!']];
  const PIRATE = [[/\bhello\b|\bhi\b/gi, 'Ahoy'], [/\bmy\b/gi, 'me'], [/\byou\b/gi, 'ye'], [/\byour\b/gi, 'yer'], [/\bis\b/gi, 'be'], [/\bare\b/gi, 'be'], [/\bam\b/gi, 'be'], [/\byes\b/gi, 'aye'], [/\bfriend(s?)\b/gi, 'matey$1'], [/\bmoney\b/gi, 'doubloons'], [/\bcomputer\b/gi, 'magic box'], [/\binternet\b/gi, 'seven seas'], [/\bvery\b/gi, 'mighty'], [/\bgood\b/gi, 'shipshape'], [/\bthink\b/gi, 'reckon'], [/\bthing(s?)\b/gi, 'treasure$1'], [/\bstop\b/gi, 'avast'], [/\bthe\b/gi, "th'"], [/\bof\b/gi, "o'"], [/\bfor\b/gi, 'fer'], [/\bthanks?\b/gi, 'thank ye'], [/\bdave\b/gi, 'Cap\'n Dave'], [/\bmom\b/gi, 'the Admiral'], [/ing\b/g, "in'"], [/!/g, '! Arr!']];
  const POSH = [[/\byes\b/gi, 'indeed'], [/\bvery\b/gi, 'frightfully'], [/\bgood\b/gi, 'splendid'], [/\bhello\b|\bhi\b/gi, 'Good day'], [/\bbad\b/gi, 'ghastly'], [/\bbig\b/gi, 'jolly large'], [/\bthing(s?)\b/gi, 'item$1'], [/\bcomputer\b/gi, 'difference engine'], [/\bfriend(s?)\b/gi, 'chum$1'], [/\bmom\b/gi, 'Mater'], [/\bdad\b/gi, 'Pater'], [/\bthanks?\b/gi, 'much obliged'], [/\bdave\b/gi, 'Sir David'], [/\binternet\b/gi, 'information superhighway'], [/\./g, ', what.']];
  const BABEL = { pirate: s => { for (const [re, r] of PIRATE) s = s.replace(re, r); return s; }, robot: s => s.toUpperCase().replace(/[.!?]+/g, m => m + ' BEEP.').replace(/\bI\b/g, 'THIS UNIT'), posh: s => { for (const [re, r] of POSH) s = s.replace(re, r); return s; }, ork: s => { for (const [re, r] of ORK) s = s.replace(re, r); return s; } };
  def('orktranslate', {
    css: `.wp-orktranslate{background:#3a5a1a ${tile('<rect width="20" height="20" fill="#3a5a1a"/><path d="M0 10h20M10 0v20" stroke="#2e4a14" stroke-width="2"/>', 20)};color:#fff;font:14px/1.45 Arial,sans-serif}
.wp-orktranslate h1{font:bold 30px Impact,sans-serif;text-align:center;color:#b6ff00;text-shadow:2px 2px #000;margin:4px 0;letter-spacing:1px}
.wp-orktranslate .ot-cols{display:flex;gap:10px;flex-wrap:wrap;max-width:700px;margin:10px auto}
.wp-orktranslate textarea{flex:1 1 280px;height:120px;font:14px Arial,sans-serif;resize:vertical}
.wp-orktranslate .ot-out{flex:1 1 280px;min-height:120px;background:#000;color:#b6ff00;font:bold 15px "Comic Sans MS",cursive;padding:8px;border:3px inset #888;white-space:pre-wrap;word-break:break-word}
.wp-orktranslate .ot-ex{max-width:700px;margin:8px auto;font-size:12px;background:rgba(0,0,0,.4);padding:8px}
.wp-orktranslate a{color:#b6ff00}`,
    html: c => `<h1>BABEL JACK: THE SILLY TRANSLATOR</h1><p class="c">Type something in English. Get it out in Pirate, Robot, Posh or Gork. Works on homework (do not use on homework).</p>
<p class="c"><label>Translate into: <select class="ot-lang" aria-label="Language"><option value="pirate">Pirate</option><option value="robot">Robot</option><option value="posh">Posh Butler</option><option value="ork">Gork (for Snaz)</option></select></label></p>
<div class="ot-cols"><textarea placeholder="Type your English here..." aria-label="English">Hello! My computer is very good. I think the Internet is a big thing. Thanks, Dave.</textarea><div class="ot-out" aria-live="polite"></div></div>
<p class="c"><button class="btn ot-go" type="button">TRANSLATE!</button> <button class="btn ot-copy" type="button">Copy it</button></p>
<div class="ot-ex"><b>Examples:</b> Pirate: "hello friend" becomes "Ahoy matey". Robot: everything becomes CAPITALS and BEEPS. Posh: "very good" becomes "frightfully splendid". Gork: "the" becomes "da" and "Dave" becomes "DAVE (boo)" (this is automatic and cannot be turned off).<br><b>Known bugs:</b> it cannot translate BACK. Nobody can. Not even Gubbinz.</div>
<p class="c small">Translations done by everyone: <b class="ot-n">?</b> &middot; Visitors: ${c.counter('odo')}</p>
<p class="c small">${c.a('poetree', 'see it used in poems')} &middot; ${c.a('teef', 'the shop')} &middot; ${c.a('crystalball', 'the crystal ball')} &middot; ${c.a('gubbinzhome', "Gubbinz's 'omepage")}</p>`,
    setup(el, c) {
      const ta = el.querySelector('textarea'), out = el.querySelector('.ot-out'), lang = el.querySelector('.ot-lang');
      const n = el.querySelector('.ot-n'); const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); }; c.get(['web.ork.n']).then(v => show(v['web.ork.n'] || 0)); c.watch('web.ork.n', ev => { if (ev.type === 'set') show(ev.v); });
      const go = () => { let s = ta.value.slice(0, 600); s = s ? (BABEL[lang.value] || BABEL.pirate)(s) : ''; out.textContent = s || '(type something first)'; Sound.play(lang.value === 'ork' ? 'waaagh' : lang.value === 'robot' ? 'beep' : 'pet'); if (s) Net.kv.inc('web.ork.n'); };
      el.querySelector('.ot-go').addEventListener('click', go); lang.addEventListener('change', go);
      el.querySelector('.ot-copy').addEventListener('click', () => { (navigator.clipboard ? navigator.clipboard.writeText(out.textContent) : Promise.reject()).then(() => Desk.toast('Babel Jack', 'Copied! Paste it in a guestbook.'), () => Desk.toast('Babel Jack', 'Could not copy. Write it down. With a pencil.')); });
      go();
    },
  });

  // ---------------------------------------------------------------- awards: Cool Site of the Week (live vote)
  def('awards', {
    css: `.wp-awards{background:#fff8e1 ${tile('<path d="M20 4l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffe9a0"/>', 40)};color:#000;font:14px/1.45 Georgia,serif}
.wp-awards h1{font:bold 32px Georgia,serif;text-align:center;color:#8a6a00;margin:4px 0}
.wp-awards .aw-win{max-width:520px;margin:10px auto;background:#fff;border:4px double #c9a200;padding:12px;text-align:center}
.wp-awards .aw-win .wbadge{width:120px;height:44px;font-size:11px}
.wp-awards table{width:100%;max-width:560px;margin:10px auto;background:#fff}.wp-awards td,.wp-awards th{border:1px solid #c9a200;padding:4px 6px;text-align:left}.wp-awards th{background:#ffe9a0}
.wp-awards .aw-bar{height:10px;background:#c9a200}
.wp-awards a{color:#8a6a00}`,
    html: c => `<h1>The JackNet Cool Site Awards</h1><p class="c"><i>Vote for COOL SITE OF THE WEEK. One vote each (you can change it). The winner gets a badge and the right to be smug.</i></p>
<div class="aw-win"><div class="small">THIS WEEK'S WINNER (live)</div><div class="aw-name" style="font:bold 22px Georgia,serif">counting...</div>${c.badge('COOL SITE', 'of the week', '#8a6a00')}<div class="aw-sub small"></div></div>
<table><tr><th>Site</th><th>Votes</th><th></th><th></th></tr><tbody class="aw-list"><tr><td colspan="4">Loading the ballot box...</td></tr></tbody></table>
<p class="c small">Nominations: any site in ${c.a('biscuitring', 'the Biscuit Ring')}. Dave has asked to be removed from the list "to give the others a chance". Request denied.</p>
<p class="c">Voters: ${c.counter('gold')}</p>
${c.gb([['Dave', c.daysAgo(1), 'vote for me. i have a cat. the cat is the champion', 5], ['{cousin}', c.daysAgo(2), 'vote for me, i have GLITTER', 5], ['{kidSoon}', '14/02/97', 'vote for mine when its finished', 2]], { title: 'Campaign speeches', ph: 'Why should YOUR site win?' })}
<p class="c small">${c.a('news', 'JackNet News')} &middot; ${c.a('counters', 'most visited (a different kind of winning)')}</p>`,
    setup(el, c) {
      const K = 'web.awards.vote', list = el.querySelector('.aw-list'), name = el.querySelector('.aw-name'), sub = el.querySelector('.aw-sub');
      const cands = W.RING.slice();
      const draw = v => { v = v && typeof v === 'object' ? v : {}; const t = {}; let mine = ''; for (const f in v) { if (cands.includes(v[f])) t[v[f]] = (t[v[f]] || 0) + 1; if (f === W.vh()) mine = v[f]; } const rows = cands.map(w => [w, t[w] || 0]).sort((a, b) => b[1] - a[1]); const max = rows[0][1] || 1; list.innerHTML = rows.map(r => `<tr><td>${c.a(r[0])}</td><td>${r[1]}</td><td style="width:100px"><div class="aw-bar" style="width:${r[1] / max * 100}%"></div></td><td><button class="btn" type="button" data-v="${r[0]}" ${mine === r[0] ? 'disabled' : ''}>${mine === r[0] ? 'your vote' : 'vote'}</button></td></tr>`).join(''); name.textContent = rows[0][1] ? M[rows[0][0]].t : 'Nobody yet!'; sub.textContent = rows[0][1] ? rows[0][1] + ' votes' : 'Cast the first vote!'; list.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { Net.kv.put(K, W.vh(), b.dataset.v); Sound.play('click'); c.secret('web.award'); })); };
      const load = () => c.get([K]).then(v => draw(v[K])); load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
    },
  });

  // ---------------------------------------------------------------- timecapsule
  def('timecapsule', {
    css: `.wp-timecapsule{background:#2b2b2b ${tile('<rect x="0" y="0" width="30" height="30" fill="#2b2b2b"/><rect x="2" y="2" width="12" height="12" rx="2" fill="#333"/><rect x="16" y="16" width="12" height="12" rx="2" fill="#333"/>', 30)};color:#eee;font:14px/1.5 Georgia,serif}
.wp-timecapsule h1{font:bold 28px Georgia,serif;text-align:center;color:#c0c0c0;letter-spacing:2px;margin:4px 0}
.wp-timecapsule .tc-cap{max-width:520px;margin:12px auto;background:linear-gradient(90deg,#777,#ddd 30%,#999 70%,#555);border:4px solid #333;border-radius:40px;padding:14px 20px;color:#000;text-align:center}
.wp-timecapsule .tc-cap b{font-size:18px}
.wp-timecapsule .tc-form{max-width:520px;margin:10px auto;background:#111;border:1px solid #666;padding:10px}
.wp-timecapsule textarea{width:100%;box-sizing:border-box;height:70px;font:13px Georgia,serif}
.wp-timecapsule .tc-list{max-width:520px;margin:10px auto}
.wp-timecapsule .tc-env{background:#f6efd8;color:#333;margin:6px 0;padding:6px 10px;border:1px solid #c9b;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}
.wp-timecapsule .tc-env.mine{background:#fff;border-color:#c9a200}
.wp-timecapsule .tc-env .seal{color:#a00;font-weight:bold}
.wp-timecapsule a{color:#ffd700}`,
    html: c => `<h1>THE MILLENNIUM TIME CAPSULE</h1><p class="c"><i>Write a message to the year 2000. It gets sealed in the capsule. Opened at midnight on the 31st of December, 1999. (Which never comes here. So: sealed forever. That's the point.)</i></p>
<div class="tc-cap"><b>CAPSULE STATUS: SEALED</b><br>Messages inside: <b class="tc-n">?</b><br><span class="small">Buried under the shed. Next to {kidY2k}'s hoops.</span></div>
<div class="tc-form"><b>Your message to the future:</b><textarea maxlength="240" placeholder="Dear year 2000, ..."></textarea><p><button class="btn tc-go" type="button">SEAL IT IN THE CAPSULE</button> <span class="tc-msg small"></span></p></div>
<div class="tc-list"><div class="small">Sealed envelopes (you can see who, and when, but not what. Except your own. That's the rules.)</div><div class="tc-envs">Loading...</div></div>
<p class="c"><b>NEW!</b> The proper JackNet one is open: <a href="http://www.millenniumvault.jnet/">bury a real capsule in the Millennium Vault</a>. Everybody's opens at midnight on New Year's Eve!</p>
<p class="c small">Visitors from 1999: ${c.counter('plain')} &middot; ${c.a('~gaz', "{kidY2k}'s bunker")} &middot; ${c.a('y2kbunker', "Jack's bunker")} &middot; ${c.a('news', 'JackNet News')}</p>`,
    setup(el, c) {
      const K = 'web.capsule', envs = el.querySelector('.tc-envs'), n = el.querySelector('.tc-n'), ta = el.querySelector('textarea'), msg = el.querySelector('.tc-msg');
      let mine = {}; try { mine = JSON.parse(localStorage.getItem('jhp_web_capsule') || '{}'); } catch (e) {}
      const draw = arr => { arr = Array.isArray(arr) ? arr : []; n.textContent = arr.length + (arr.length >= 40 ? '+' : ''); envs.innerHTML = arr.slice().reverse().map(e => { const own = mine[e.ts]; return `<div class="tc-env${own ? ' mine' : ''}"><span>&#9993; From <b>${esc(e.by)}</b>, sealed ${W.tsDate(e.ts)}</span><span class="seal">${own ? '' : 'SEALED'}</span>${own ? `<div style="flex:1 1 100%;font-style:italic">"${esc(e.text)}"</div>` : ''}</div>`; }).join('') || '<div class="small">The capsule is empty. Be the first to write to the future.</div>'; };
      const load = () => c.get([K]).then(v => draw(v[K])); load();
      c.watch(K, ev => { if (ev.type === 'push') { if (ev.e.by === Net.me.nick && ev.e.text === pending) { mine[ev.e.ts] = 1; try { localStorage.setItem('jhp_web_capsule', JSON.stringify(mine)); } catch (e) {} } load(); } });
      let pending = '';
      el.querySelector('.tc-go').addEventListener('click', () => { const t = ta.value.trim(); if (!t) return; pending = t; if (!Net.kv.push(K, t)) { msg.textContent = 'Not connected!'; return; } ta.value = ''; msg.textContent = 'Sealed! See you in 2000. (You won\'t.)'; Sound.play('thud'); c.secret('web.capsule'); });
    },
  });

  // ---------------------------------------------------------------- petition
  def('petition', {
    css: `.wp-petition{background:#fff ${tile('<path d="M0 31h32" stroke="#dde" stroke-width="1"/>', 32)};color:#000;font:14px/1.5 "Times New Roman",serif}
.wp-petition .pt-paper{max-width:600px;margin:0 auto;background:#fff;border:1px solid #999;padding:16px 24px;box-shadow:4px 4px 0 #ccc}
.wp-petition h1{font:bold 30px "Times New Roman",serif;text-align:center;margin:0 0 6px;text-decoration:underline}
.wp-petition .pt-count{text-align:center;font:bold 40px "Times New Roman",serif;color:#c00}
.wp-petition .pt-prog{height:18px;border:1px solid #000;background:#fff;position:relative;margin:6px 0}
.wp-petition .pt-prog i{position:absolute;left:0;top:0;bottom:0;background:#c00;width:0;transition:width .5s}
.wp-petition .pt-sign{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.wp-petition .pt-sign input{flex:1;min-width:160px;font:14px "Times New Roman",serif}
.wp-petition .pt-list{columns:2;column-gap:20px;font-size:13px}
.wp-petition .pt-list div{break-inside:avoid;border-bottom:1px dotted #999;padding:2px 0}
.wp-petition .pt-list i{color:#555}
.wp-petition .sig{font:italic 15px "Comic Sans MS",cursive;color:#004}
@media (max-width:600px){.wp-petition .pt-list{columns:1}}`,
    html: c => `<div class="pt-paper"><h1>PETITION</h1><p class="c"><b>We, the undersigned, demand that EVERY DAY be a SATURDAY.</b></p>
<p>Whereas: Saturday has cartoons, no school, a lie-in and the Games Arcade. Whereas: Monday has none of these. Whereas: Dave says Sunday is also OK but Sunday has "that feeling" about Monday. We therefore call upon whoever is in charge of days to make them all Saturday, effective immediately, or at least from next Saturday.</p>
<div class="pt-count"><span class="pt-n">?</span> <span style="font-size:16px">signatures</span></div><div class="pt-prog"><i></i></div><div class="c small">Target: 1,000. Then we send it to... someone. Mom, probably.</div>
<div class="pt-sign"><input type="text" class="pt-why" maxlength="80" placeholder="Why do you want every day to be Saturday? (optional)" aria-label="Reason"><button class="btn pt-go" type="button">SIGN THE PETITION</button></div><div class="pt-msg small"></div>
<h3>Signatures (the last 40)</h3><div class="pt-list">Loading...</div>
<p class="c small">Visitors: ${c.counter('plain')} &middot; ${c.a('poll', 'vote on other things')} &middot; ${c.a('news', 'JackNet News')}</p></div>`,
    setup(el, c) {
      const n = el.querySelector('.pt-n'), bar = el.querySelector('.pt-prog i'), list = el.querySelector('.pt-list'), msg = el.querySelector('.pt-msg'), go = el.querySelector('.pt-go');
      let signed = false; try { signed = localStorage.getItem('jhp_web_petition') === '1'; } catch (e) {}
      const showN = v => { v = +v || 0; n.textContent = v.toLocaleString('en-GB'); bar.style.width = Math.min(100, v / 10) + '%'; if (v >= 1000) msg.textContent = 'WE DID IT. 1,000 signatures. Every day is now Saturday. (Pending approval from Mom.)'; };
      const draw = arr => { list.innerHTML = (Array.isArray(arr) ? arr : []).slice().reverse().map(e => `<div><span class="sig">${esc(e.by)}</span> <i>${e.text && e.text !== '-' ? '"' + esc(e.text) + '"' : ''}</i></div>`).join('') || '<div>Be the first to sign!</div>'; };
      c.get(['web.petition.n', 'web.petition.sigs']).then(v => { showN(v['web.petition.n']); draw(v['web.petition.sigs']); });
      c.watch('web.petition.n', ev => { if (ev.type === 'set') showN(ev.v); }); c.watch('web.petition.sigs', ev => { if (ev.type === 'push') c.get(['web.petition.sigs']).then(v => draw(v['web.petition.sigs'])); });
      if (signed) { go.disabled = true; go.textContent = 'You have signed!'; }
      go.addEventListener('click', () => { if (signed) return; const why = el.querySelector('.pt-why').value.trim() || '-'; if (!Net.kv.push('web.petition.sigs', why)) { msg.textContent = 'Not connected!'; return; } Net.kv.inc('web.petition.n'); signed = true; try { localStorage.setItem('jhp_web_petition', '1'); } catch (e) {} go.disabled = true; go.textContent = 'You have signed!'; Sound.play('solve'); c.secret('web.petition'); });
    },
  });

  // ---------------------------------------------------------------- poll booth
  const POLLS = [['Best console right now?', ['ULTRA 64', 'PlaySpace', 'Daydream', 'Game Lad (still)', 'The PC, obviously']], ['Episode I: the floppy-eared one is...', ['Ruining it', 'Fine', 'The best bit', "Who's that"]], ['Best biscuit for dunking?', ['Digestive', 'Rich Tay', 'Custard cream', 'Hobnab', 'Bourbon']], ['Is the Millennium Bug going to...', ['Do nothing', 'Break the video', 'Break EVERYTHING', 'Give out free money']], ['Dave is...', ['The best at Goldenballs', 'Not the best at Goldenballs', 'A wrestling promoter', 'Dave']]];
  def('poll', {
    css: `.wp-poll{background:#e8e8ff ${tile('<rect x="4" y="4" width="8" height="8" fill="none" stroke="#ccd"/><path d="M6 8l2 2 3-4" stroke="#ccd" fill="none"/>', 24)};color:#000;font:13px/1.45 Verdana,Arial,sans-serif}
.wp-poll h1{font:bold 28px Verdana,sans-serif;text-align:center;color:#003;margin:4px 0}
.wp-poll .pl{max-width:560px;margin:10px auto;background:#fff;border:2px solid #003;padding:10px 14px}
.wp-poll .pl h3{margin:0 0 6px;font:bold 15px Verdana,sans-serif;color:#003}
.wp-poll .pl-o{display:flex;align-items:center;gap:8px;margin:4px 0;flex-wrap:wrap}
.wp-poll .pl-o label{flex:1 1 120px;cursor:pointer}
.wp-poll .pl-bar{flex:2 1 90px;height:14px;background:#eee;border:1px solid #999;position:relative}
.wp-poll .pl-bar i{position:absolute;left:0;top:0;bottom:0;background:#36c;transition:width .5s}
.wp-poll .pl-pc{width:40px;text-align:right;font-weight:bold}
.wp-poll .pl-t{font-size:11px;color:#555}
.wp-poll a{color:#003}`,
    html: c => `<h1>JackNet Poll Booth</h1><p class="c">Five big questions. Pick an answer and the bars move for EVERYONE, live. One vote per question (click again to change your mind, this is a free country).</p>
${POLLS.map((p, i) => `<div class="pl" data-p="${i}"><h3>${i + 1}. ${esc(p[0])}</h3>${p[1].map((o, k) => `<div class="pl-o"><label><input type="radio" name="poll${i}" value="o${k}"> ${esc(o)}</label><div class="pl-bar"><i data-o="o${k}"></i></div><span class="pl-pc" data-pc="o${k}">0%</span></div>`).join('')}<div class="pl-t">0 votes</div></div>`).join('')}
<p class="c small">Pollsters: ${c.counter('plain')} &middot; ${c.a('petition', 'sign the petition')} &middot; ${c.a('jarjar', 'the BIG debate')} &middot; ${c.a('~ellie', 'Red or Blue?')}</p>`,
    setup(el, c) {
      const voted = new Set();
      POLLS.forEach((p, i) => {
        const K = 'web.poll.q' + i, box = el.querySelector(`[data-p="${i}"]`);
        const draw = v => { v = v && typeof v === 'object' ? v : {}; const t = {}; let n = 0, mine = ''; for (const f in v) { t[v[f]] = (t[v[f]] || 0) + 1; n++; if (f === W.vh()) mine = v[f]; } p[1].forEach((_, k) => { const o = 'o' + k, pc = n ? Math.round((t[o] || 0) / n * 100) : 0; box.querySelector(`[data-o="${o}"]`).style.width = pc + '%'; box.querySelector(`[data-pc="${o}"]`).textContent = pc + '%'; }); box.querySelector('.pl-t').textContent = n + ' vote' + (n === 1 ? '' : 's') + (mine ? ' (you voted)' : ''); if (mine) { const r = box.querySelector(`input[value="${mine}"]`); if (r) r.checked = true; voted.add(i); } if (voted.size >= POLLS.length) c.secret('web.poll'); };
        const load = () => c.get([K]).then(v => draw(v[K])); load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
        box.querySelectorAll('input').forEach(r => r.addEventListener('change', () => { Net.kv.put(K, W.vh(), r.value); Sound.play('click'); }));
      });
    },
  });

  // ---------------------------------------------------------------- parcel: pass the parcel chain letter
  const WRAP = ['#e10600', '#0028c8', '#ffd400', '#0a0', '#ff8c00', '#c0f', '#0cf', '#f6a'];
  def('parcel', {
    css: `.wp-parcel{background:#fff0f5 ${tile('<circle cx="10" cy="10" r="3" fill="#ffd6e7"/><circle cx="30" cy="30" r="2" fill="#d6e7ff"/><path d="M26 6l4 4-4 4-4-4z" fill="#fff3b0"/>', 40)};color:#000;font:14px/1.45 "Comic Sans MS",cursive}
.wp-parcel h1{font:bold 30px "Comic Sans MS",cursive;text-align:center;color:#c0005a;margin:4px 0}
.wp-parcel .pc-box{text-align:center;margin:10px auto;max-width:520px;background:#fff;border:3px dashed #c0005a;padding:12px}
.wp-parcel .pc-parcel{width:140px;height:120px;margin:10px auto;position:relative;border:3px solid #000;transition:transform .3s}
.wp-parcel .pc-parcel::before,.wp-parcel .pc-parcel::after{content:"";position:absolute;background:rgba(255,255,255,.7)}
.wp-parcel .pc-parcel::before{left:50%;top:0;bottom:0;width:16px;margin-left:-8px}.wp-parcel .pc-parcel::after{top:50%;left:0;right:0;height:16px;margin-top:-8px}
.wp-parcel .pc-parcel.shake{animation:pcshake .4s}
@keyframes pcshake{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.wp-parcel .pc-n{font:bold 36px "Comic Sans MS",cursive;color:#c0005a}
.wp-parcel .pc-btn{font-size:16px;padding:8px 20px}
.wp-parcel .pc-chain{max-width:520px;margin:12px auto;background:#fffbe6;border:2px solid #c9a200;padding:10px 14px;font-size:13px}
.wp-parcel .pc-log{max-width:520px;margin:10px auto;font-size:12px;max-height:200px;overflow:auto;background:#fff;border:1px solid #ccc;padding:6px}
.wp-parcel .pc-log div{border-bottom:1px dotted #ccc;padding:2px 0}
.wp-parcel .pc-gold{background:#ffd400;border:3px solid #a07000;padding:8px;font-weight:bold;display:none}
.wp-parcel a{color:#c0005a}`,
    html: c => `<h1>THE GREAT JACKNET PASS THE PARCEL</h1><p class="c">One parcel. A MILLION layers (probably). Everyone on JackNet takes a turn: unwrap ONE layer, leave a note, pass it on. When the music stops... it never stops. ${c.midi('web-parcel', 'pass_the_parcel.mid')}</p>
<div class="pc-box"><div class="pc-parcel" style="background:${WRAP[0]}"></div><div>Layers unwrapped so far:</div><div class="pc-n">?</div><div class="small pc-last">...</div><p><button class="btn pc-btn" type="button">UNWRAP A LAYER!</button></p><div class="pc-msg small"></div><div class="pc-gold">&#9733; THE GOLDEN CARTRIDGE! &#9733;<br>Every 25th layer has a prize in it. You found one! It's a golden game cartridge. It's yours. (Blow on it before you use it.)</div></div>
<div class="pc-chain"><b>THE CHAIN LETTER (do not break the chain):</b> This parcel was started by Jack in the summer. If you unwrap a layer you MUST pass it to at least one other person by telling them about this page. If you don't, nothing bad happens, but Dave will be disappointed. A boy in another town did not pass it on and his modem connected at 28.8K for a WEEK. (Not true.) (Possibly true.)</div>
<form class="pc-note" autocomplete="off"><div class="c"><input type="text" maxlength="80" placeholder="Leave a note in the layer you unwrapped..." aria-label="Note" style="width:70%;max-width:360px"> <button class="btn" type="submit">Stick it on</button></div></form>
<div class="pc-log"><b>Notes in the layers:</b><div class="pc-notes">Loading...</div></div>
<p class="c small">Players: ${c.counter('flip')} &middot; ${c.a('news', 'JackNet News')} &middot; ${c.a('awards', 'awards')} &middot; ${c.a('jokes', 'a joke while you wait')}</p>`,
    setup(el, c) {
      const P = el.querySelector('.pc-parcel'), n = el.querySelector('.pc-n'), last = el.querySelector('.pc-last'), msg = el.querySelector('.pc-msg'), gold = el.querySelector('.pc-gold'), notes = el.querySelector('.pc-notes'); let layers = 0, lastT = 0;
      const show = (v, by) => { layers = +v || 0; n.textContent = layers.toLocaleString('en-GB'); P.style.background = WRAP[layers % WRAP.length]; if (by) last.textContent = 'Last unwrapped by ' + by; };
      c.get(['web.parcel.layers', 'web.parcel.log']).then(v => { show(v['web.parcel.layers']); drawNotes(v['web.parcel.log']); });
      c.watch('web.parcel.layers', ev => { if (ev.type === 'set') { show(ev.v, ev.by); P.classList.remove('shake'); void P.offsetWidth; P.classList.add('shake'); if (ev.by !== Net.me.nick) Sound.play('turn'); } });
      const drawNotes = arr => { notes.innerHTML = (Array.isArray(arr) ? arr : []).slice().reverse().map(e => `<div><b>${esc(e.by)}</b> (${W.tsDate(e.ts)}): ${esc(e.text)}</div>`).join('') || '<div>No notes yet. Leave one!</div>'; };
      c.watch('web.parcel.log', ev => { if (ev.type === 'push') c.get(['web.parcel.log']).then(v => drawNotes(v['web.parcel.log'])); });
      el.querySelector('.pc-btn').addEventListener('click', () => { if (Date.now() - lastT < 4000) { msg.textContent = 'Wait your turn! Someone else has it. (4 seconds.)'; return; } lastT = Date.now(); if (!Net.kv.inc('web.parcel.layers')) { msg.textContent = 'Not connected!'; return; } Sound.play('turn'); c.secret('web.parcel'); const next = layers + 1; msg.textContent = 'You unwrapped layer ' + next.toLocaleString('en-GB') + '. Inside: ' + W.pick(['more paper.', 'a note from Dave. It says "DAVE".', 'a biscuit crumb.', 'more paper. Of course.', 'a toof. Gubbinz has been here.', 'a tiny drawing of a rocket.', 'a sweet! (eaten)', 'the next layer. Pass it on!']); if (next % 25 === 0) { gold.style.display = 'block'; c.secret('web.goldensquig'); Sound.play('solve'); } });
      el.querySelector('.pc-note').addEventListener('submit', ev => { ev.preventDefault(); const i = el.querySelector('.pc-note input'), t = i.value.trim(); if (!t) return; if (Net.kv.push('web.parcel.log', t)) { i.value = ''; Sound.play('pet'); } });
    },
  });

  // ---------------------------------------------------------------- biscuitring: the hub
  def('biscuitring', {
    css: `.wp-biscuitring{background:#f6e3b4 ${tile('<circle cx="20" cy="20" r="12" fill="#e0a85a" stroke="#7a4a14" stroke-width="2"/><circle cx="16" cy="17" r="1.5" fill="#7a4a14"/><circle cx="24" cy="19" r="1.5" fill="#7a4a14"/><circle cx="19" cy="25" r="1.5" fill="#7a4a14"/>', 44)};color:#3a2200;font:14px/1.45 Arial,sans-serif}
.wp-biscuitring h1{font:bold 34px Georgia,serif;text-align:center;color:#5a1a00;margin:4px 0}
.wp-biscuitring .br-wrap{max-width:680px;margin:0 auto;background:#fffaf0;border:3px double #8a5a1a;padding:12px 16px}
.wp-biscuitring table{width:100%;font-size:13px}.wp-biscuitring td,.wp-biscuitring th{border-bottom:1px dotted #8a5a1a;padding:4px;text-align:left;vertical-align:top}.wp-biscuitring th{background:#f6e3b4}
.wp-biscuitring .br-seen{color:#080;font-weight:bold}
.wp-biscuitring .br-join{background:#f6e3b4;padding:10px;margin-top:12px}
.wp-biscuitring .br-join input,.wp-biscuitring .br-join select{width:100%;box-sizing:border-box;margin:2px 0 6px}
.wp-biscuitring a{color:#5a1a00}`,
    html: c => `<div class="br-wrap"><h1>The Biscuit Ring</h1><p class="c"><i>A webring for homepages that are best enjoyed with a cup of tea and a biscuit. ${W.RING.length} sites. No crumbs.</i></p>
<p><b>How it works:</b> every site in the ring has a Biscuit Ring box at the bottom. Click <b>Next</b> to go to the next site, <b>Prev</b> for the one before, <b>Random</b> for pot luck. Go all the way round and you're back where you started (and you get a secret). The sites you've seen are ticked.</p>
<table><tr><th>#</th><th>Site</th><th>What's on it</th><th></th></tr>${W.RING.map((w, i) => `<tr><td>${i + 1}</td><td>${c.a(w)}<br><span class="small">${c.url(w)}</span></td><td>${esc(M[w].d)}</td><td class="br-seen">${W.seen[w] ? '&#10003;' : ''}</td></tr>`).join('')}</table>
<p class="c"><a href="#" data-wp="?" data-ring="random"><b>&#9733; TAKE ME TO A RANDOM SITE &#9733;</b></a></p>
<div class="br-join"><b>JOIN THE RING</b><p class="small">Your site needs: at least one animated thing, a guestbook, a hit counter and NO pop-ups. Dave got in. Anyone can get in.</p><input type="text" placeholder="Your site's name" maxlength="40" aria-label="Site name"><input type="text" placeholder="Address (e.g. www.mysite.kidz)" maxlength="40" aria-label="Address"><select aria-label="Biscuit"><option>Favourite biscuit: Digestive</option><option>Favourite biscuit: Custard cream</option><option>Favourite biscuit: Hobnab</option><option>Favourite biscuit: Bourbon</option><option>Favourite biscuit: Rich Tay (brave)</option></select><button class="btn br-go" type="button">Apply to join</button></div>
<p class="c">Ring visitors: ${c.counter('odo')}</p>
${c.gb([['Jack', c.daysAgo(3), 'ring master here. 30-odd sites now! who said the web was a fad (Pat said it)', 5], ['Pat', c.daysAgo(3), 'It is a fad. Nice biscuits though.', 3], ['Dave', c.daysAgo(5), 'i am site 1. because i am the best. (its alphabetical) (its not even that)', 4]], { title: 'Ring Members\' Book', ph: 'Which site is your favourite? Which biscuit?' })}
<p class="c small">${c.a('webring', 'the OTHER webring (Nerd Kids)')} &middot; ${c.a('search', 'JackSearch')} &middot; ${c.a('directory', 'the directory')} &middot; ${c.a('awards', 'awards')}</p>${c.ring()}</div>`,
    setup(el) { el.querySelector('.br-go').addEventListener('click', () => { const n = el.querySelector('.br-join input').value.trim(); Desk.msgbox('The Biscuit Ring', n ? `Thanks! "${n}" has been added to the waiting list. The ring master (Jack) will have a look after tea. Current waiting time: about 6 to 8 weeks, or one packet of biscuits.` : 'Put your site\'s name in first!', 'info'); Sound.play('pet'); }); },
  });

  // ---------------------------------------------------------------- homepagez: the free host's front page
  def('homepagez', {
    css: `.wp-homepagez{background:#fff;color:#000;font:13px/1.4 Arial,sans-serif}
.wp-homepagez .hz-top{background:linear-gradient(90deg,#ff6a00,#ffd400);padding:10px 14px;margin:-18px -18px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wp-homepagez .hz-top h1{font:bold 30px "Arial Black",Arial,sans-serif;margin:0;color:#fff;-webkit-text-stroke:1px #000}
.wp-homepagez .hz-cols{display:flex;gap:14px;flex-wrap:wrap}
.wp-homepagez .hz-main{flex:2 1 300px}.wp-homepagez .hz-side{flex:1 1 200px;background:#fff6e0;border:1px solid #c90;padding:10px}
.wp-homepagez table{width:100%}.wp-homepagez td{padding:4px;border-bottom:1px solid #ddd;vertical-align:top}
.wp-homepagez .hz-ad{border:2px dashed #999;padding:6px;text-align:center;font-size:11px;margin:8px 0;background:#eee}
.wp-homepagez a{color:#c40}
@media (max-width:600px){.wp-homepagez .hz-top{margin:-12px -10px 12px}}`,
    html: c => `<div class="hz-top"><h1>Homepagez</h1><span><b>FREE web space for EVERYONE!</b> 1 MB! Your own address! A counter! A guestbook!</span></div>
<div class="hz-cols"><div class="hz-main"><h2 style="margin:0 0 6px">Our members (${c.url('homepagez')}/~you)</h2><table>${['poetree', '~biscuit', '~tom'].map(w => `<tr><td><b>${c.a(w)}</b><br><span class="small">${c.url(w)}</span></td><td>${esc(M[w].d)}</td></tr>`).join('')}<tr><td><b>~you?</b></td><td>Sign up on the right! It takes 2 minutes and one phone call to your dad to ask if it's OK.</td></tr></table>
<h3>Rules of Homepagez</h3><ol><li>1 MB. That's it. Pictures are big. Words are small. Use words.</li><li>No copying other people's pictures. Draw your own. Badly. It's fine.</li><li>Every page MUST have an "under construction" sign somewhere. It's the law. (It's not the law.)</li><li>We put a tiny advert at the bottom of your page. It's for ${c.a('teef', 'the Gem Exchange')}. Sorry.</li></ol>
<div class="hz-ad">ADVERT: GEM EXCHANGE - the only shop that takes Rupees - ${c.a('teef', 'click here')}</div></div>
<div class="hz-side"><h3 style="margin:0 0 6px">Sign up FREE</h3><input type="text" placeholder="~yourname" maxlength="16" style="width:100%;box-sizing:border-box" aria-label="Your name"><p class="small">You get: <b>${c.host === 'www.jackattack.jnet' ? 'members.homepagez.webcom/~yourname/' : 'members.homepagez.webcom/~yourname/'}</b></p><button class="btn hz-go" type="button">Make my homepage!</button><p class="small">Members so far: <b class="hz-n">?</b></p></div></div>
<p class="c small">Hits: ${c.counter('plain')} &middot; ${c.a('biscuitring', 'the Biscuit Ring')} &middot; ${c.a('search', 'JackSearch')}</p>`,
    setup(el, c) {
      const n = el.querySelector('.hz-n'); const show = v => { if (typeof v === 'number') n.textContent = (v + 3).toLocaleString('en-GB'); }; c.get(['web.homepagez.n']).then(v => show(v['web.homepagez.n'] || 0)); c.watch('web.homepagez.n', ev => { if (ev.type === 'set') show(ev.v); });
      el.querySelector('.hz-go').addEventListener('click', () => { const u = el.querySelector('.hz-side input').value.trim().replace(/^~/, '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'you'; Net.kv.inc('web.homepagez.n'); Sound.play('join'); if (window.HPZ && HPZ.openBuilder) { HPZ.openBuilder(); return; } Desk.msgbox('Homepagez', `Welcome, ~${u}!\n\nYour homepage is being built by our server (a computer under a desk). It will be ready "soon". In the meantime, enjoy this UNDER CONSTRUCTION sign we have put on it for you.\n\n(Nothing is really made. It's 1999. Allow 6 to 8 weeks.)`, 'info'); });
    },
  });

  // ---------------------------------------------------------------- backstage: the "Coming soon" kid's hidden area (Cast 'kidSoon')
  def('backstage', {
    css: `.wp-backstage{background:#000;color:#0f0;font:13px/1.5 "Courier New",monospace}.wp-backstage a{color:#ff0}.wp-backstage .bk-box{border:1px dashed #0f0;padding:10px;max-width:560px;margin:10px auto}`,
    html: c => `<h2>&gt; {kidSoon.NAME}'S BACKSTAGE AREA</h2><p>How did you get here? Oh. The source. Yeah. I was going to take that out.</p>
<div class="bk-box"><p>OK so the truth is: my page has said "coming soon" since 1997 because I started making a GAME for it and the game got bigger than the page. It's 75% done. It's been 75% done for two years. It's a text adventure about a tiny robot who has to get across a bedroom without waking a cat. There are 40 rooms. The bedroom is quite big.</p><p>Here's a bit:</p><pre>YOU ARE UNDER THE BED. IT IS DARK.
THERE IS A SOCK HERE.
EXITS: NORTH (slippers), EAST (a box of something)
&gt; TAKE SOCK
YOU TAKE THE SOCK. IT IS NOT CLEAN.
&gt; NORTH
THE CAT STIRS.
...</pre><p>That's all you're getting. When it's done, it'll be on my page. SOON.</p></div>
<div class="bk-box"><p><b>Other things I was going to put on my page:</b></p><ul><li>A secret clubhouse for mates only. Jack built one instead: ${c.a('clubhouse')}. The password's on a band's page, apparently. First letters.</li><li>A riddle trail. Jack did that too: ${c.a('riddle')}. He's quick, Jack.</li><li>A page about my dog. Dave's dog got there first: ${c.a('~biscuit')}.</li></ul><p>Basically everyone did my page for me. Thanks, I think.</p></div>
<p class="c small">Backstage visitors: ${c.counter('green')} (a lot more than my actual page)</p><p class="c">${c.a('~tom', '&lt; back to the front')}</p>`,
  });

  // ---------------------------------------------------------------- clubhouse (password: first letters of the Mouldy Tangerines setlist)
  def('clubhouse', {
    css: `.wp-clubhouse{background:#5a3a1a ${tile('<rect width="40" height="20" fill="#5a3a1a"/><rect x="0" y="0" width="40" height="19" fill="#6a4a2a"/><rect x="0" y="20" width="20" height="19" fill="#6a4a2a"/><rect x="21" y="20" width="19" height="19" fill="#6a4a2a"/>', 40)};color:#fff;font:14px/1.5 "Comic Sans MS",cursive}
.wp-clubhouse .ch-door{max-width:420px;margin:20px auto;background:#3a2a1a;border:6px solid #2a1a0a;padding:20px;text-align:center}
.wp-clubhouse h1{font:bold 26px "Comic Sans MS",cursive;margin:0 0 8px}
.wp-clubhouse input{font:16px "Courier New",monospace;text-transform:uppercase;width:160px;text-align:center}
.wp-clubhouse .ch-in{display:none;max-width:560px;margin:10px auto;background:#fff8e0;color:#000;padding:12px 16px;border:4px solid #c9a200}
.wp-clubhouse .ch-in h2{margin:0 0 6px;color:#5a3a1a}
.wp-clubhouse a{color:#ffd400}.wp-clubhouse .ch-in a{color:#5a3a1a}`,
    html: c => `<div class="ch-door"><h1>THE SECRET CLUBHOUSE</h1><p>MEMBERS ONLY. KNOCK FIRST. SAY THE PASSWORD.</p><p class="small">(Hint: it's hidden on a band's page. First letters. {cousin} knows. {cousin} tells everyone.)</p><form class="ch-f" autocomplete="off"><input type="text" maxlength="12" aria-label="Password" placeholder="PASSWORD"> <button class="btn" type="submit">KNOCK</button></form><p class="ch-msg"></p></div>
<div class="ch-in"><h2>WELCOME IN. MIND THE LADDER.</h2><p>This is the clubhouse. It's a shed, technically, but it's got a rug and a lamp that works and a tin of biscuits (Pat donated them, don't tell the knitting club). Members: Jack, Dave, {cousin}, {kidEp1}, {club1}, {kidPoke}, {club2}, {club3}, {club4}, {kidBand}, {kidY2k} and {kidSoon} (in theory). Gubbinz is not a member. Gubbinz is always in here anyway.</p>
<h3>CLUBHOUSE RULES</h3><ol><li>What's said in the clubhouse stays in the clubhouse (except {cousin} tells everyone).</li><li>No cats. (Mr Tiddles. It's always Mr Tiddles.)</li><li>Biscuits are shared. Hoops are {kidY2k}'s.</li><li>The password changes when {kidBand} writes a new setlist. {kidBand} never writes a new setlist.</li></ol>
<h3>THE SECRET NOTICEBOARD</h3>${c.gb([['Jack', c.daysAgo(1), 'meeting Saturday. bring crisps. Dave bring NOT the cat', 5], ['{cousin}', c.daysAgo(2), 'i told {kidPoke} the password. and {club3}. and the postman. sorry', 4], ['Gubbinz', c.daysAgo(3), 'i live here now', 5]], { title: 'Members\' noticeboard', ph: 'Members only! (everyone is a member now, thanks {cousin})' })}
<p class="c">Members who've knocked: ${c.counter('tally')}</p>
<p class="c small">${c.a('~stu', 'the band (where the password lives)')} &middot; ${c.a('backstage', "{kidSoon}'s backstage")} &middot; ${c.a('riddle', 'the riddle trail')}</p></div>`,
    setup(el, c) {
      const f = el.querySelector('.ch-f'), msg = el.querySelector('.ch-msg'), inn = el.querySelector('.ch-in');
      let ok = false; try { ok = localStorage.getItem('jhp_web_club') === '1'; } catch (e) {}
      const open = () => { inn.style.display = 'block'; msg.textContent = 'The door creaks open...'; c.secret('web.clubhouse'); try { localStorage.setItem('jhp_web_club', '1'); } catch (e) {} };
      if (ok) open();
      f.addEventListener('submit', ev => { ev.preventDefault(); const v = f.querySelector('input').value.trim().toUpperCase(); if (v === 'CUSTARD') { Sound.play('solve'); open(); inn.scrollIntoView({ block: 'start', behavior: 'smooth' }); } else { Sound.play('uhoh'); msg.textContent = W.pick(['"' + v + '"? No. Go away. (Nicely.)', 'Wrong. Dave tried that one too.', 'Nope. Read the setlist. FIRST letters.', 'That\'s not it. Is that even a word?']); } });
    },
  });

  // ---------------------------------------------------------------- the riddle trail
  const TRAIL = [['riddle', 'I have keys but open no locks. I have space but no room. You can enter but not go in. What am I?', 'keyboard', 'Type the answer into the Address bar (just the word, on www.jackattack.jnet) and press Enter. That IS the next page.'], ['keyboard', 'I go round and round all day and never get anywhere. A hamster loves me. What am I?', 'wheel', 'The next page is the answer, again. Address bar. Just the word.'], ['wheel', 'I am the meal you have when you "break your fast". What am I?', 'breakfast', 'You know the drill.'], ['breakfast', 'I hold 1.44 MB, I have a metal door that goes "shk", and I am NOT the bendy kind. What am I?', 'floppy', 'One word. Address bar. Go.'], ['floppy', 'I am round, red, mostly teeth, and I go BOING. Gubbinz would like to sell you one. What am I?', 'squig', 'Last one!'], ['squig', 'THE END OF THE TRAIL', '', '']];
  TRAIL.forEach(([w, q, a, hint], i) => W.def(w, {
    css: `.wp-${w}{background:#f4f1e6;color:#000;font:16px/1.6 Georgia,serif}
.wp-${w} .rd-box{max-width:520px;margin:30px auto;background:#fff;border:2px solid #000;padding:20px 24px;box-shadow:6px 6px 0 #000;text-align:center}
.wp-${w} h1{font:bold 22px Georgia,serif;margin:0 0 10px;letter-spacing:2px}
.wp-${w} .rd-q{font:italic 20px Georgia,serif;margin:12px 0}
.wp-${w} .rd-n{color:#888;font-size:12px}
.wp-${w} a{color:#00c}`,
    html: c => `<div class="rd-box"><h1>THE RIDDLE TRAIL</h1><div class="rd-n">Clue ${i + 1} of ${TRAIL.length}</div>${a ? `<div class="rd-q">${esc(q)}</div><p class="small">${esc(hint)}</p><p class="small">Stuck? ${c.a('lost', 'Get lost')} and start again.</p>` : `<div class="rd-q">You did it. Five riddles, five addresses. You are officially a Riddle Master of JackNet.</div><p>Your prize: this certificate.</p><div style="border:3px double #a07000;padding:10px;background:#fff8e0;font:bold 16px Georgia,serif">CERTIFICATE OF RIDDLING<br><span class="small">awarded to <b>${esc(Net.me.nick || 'you')}</b>, ${c.today}, by Jack (and Gubbinz, who did not help)</span></div><p class="small">Now go and show off: ${c.a('clubhouse', 'the clubhouse')} &middot; ${c.a('news', 'JackNet News')} &middot; ${c.a('search', 'search for more secrets')}</p>`}</div>
<p class="c small">Riddlers at this clue: ${c.counter('plain')}</p>`,
    setup: a ? null : (el, c) => { c.secret('web.riddles'); Sound.play('solve'); },
  }));
})();

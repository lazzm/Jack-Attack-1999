/* web-p3: the 1999 Web, part 3. A galaxy far, far away (fan pages for THE film of 1999). Original writing, no copied text. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile;
  // the people are this visitor's own cast (js/cast.js): every page's text, guestbook seeds and guestbook options go through
  // Cast.t, so {kidEp1}, {kidEp1.his}, {cousin} ... come out with this visitor's names and the right he/she
  const def = (w, o) => { const h = o.html; if (h) o.html = c => { const gb = c.gb; c.gb = (seed, opt) => gb(Cast.deep(seed), Cast.deep(opt)); try { return Cast.t(h(c)); } finally { c.gb = gb; } }; return W.def(w, o); };
  const STARS = tile('<circle cx="9" cy="14" r=".8" fill="#fff"/><circle cx="41" cy="6" r="1.1" fill="#fff"/><circle cx="60" cy="40" r=".7" fill="#fff"/><circle cx="24" cy="52" r=".9" fill="#ffd"/><circle cx="52" cy="60" r=".6" fill="#fff"/><circle cx="4" cy="34" r=".5" fill="#fff"/>', 68);
  const REL = 716; // UK release: 16 July 1999
  const dateStr = md => String(md % 100).padStart(2, '0') + '/' + String(Math.floor(md / 100)).padStart(2, '0') + '/99';

  // ---------------------------------------------------------------- ~sam: the Episode I countdown
  def('~sam', {
    css: `.wp-u-sam{background:#000 ${STARS};color:#ddd;font:14px/1.5 Arial,Helvetica,sans-serif}
.wp-u-sam h1{font:bold 34px "Arial Black",Impact,sans-serif;text-align:center;color:#ffe81f;letter-spacing:1px;margin:6px 0;text-shadow:0 0 14px #ffe81f}
.wp-u-sam .sm-cd{text-align:center;background:#111;border:3px double #ffe81f;max-width:520px;margin:10px auto;padding:10px}
.wp-u-sam .sm-n{font:bold 56px "Arial Black",sans-serif;color:#fff;line-height:1}
.wp-u-sam .sm-box{background:rgba(20,20,30,.85);border:1px solid #666;padding:10px 14px;margin:12px auto;max-width:660px}
.wp-u-sam h2{color:#ffe81f;font:bold 17px "Arial Black",sans-serif;margin:0 0 6px;letter-spacing:1px}
.wp-u-sam .sm-dl{background:#000;color:#0f0;font:12px "Courier New",monospace;padding:8px;border:2px inset #888;white-space:pre-wrap}
.wp-u-sam .sm-bar{height:12px;background:#222;border:1px solid #888;position:relative;margin:4px 0}
.wp-u-sam .sm-bar i{position:absolute;left:0;top:0;bottom:0;background:#0a0;width:0}
.wp-u-sam .sm-big{display:block;margin:10px auto;padding:12px 24px;font:bold 18px Arial,sans-serif;background:#ffe81f;color:#000;border:4px outset #fff;cursor:pointer}
.wp-u-sam table{width:100%;font-size:13px}.wp-u-sam td{border-bottom:1px solid #333;padding:3px 4px;vertical-align:top}
.wp-u-sam .sm-crawl{height:120px;overflow:hidden;position:relative;perspective:200px;background:#000;border:1px solid #333}
.wp-u-sam .sm-crawl div{position:absolute;left:10%;right:10%;top:100%;color:#ffe81f;font:bold 15px/1.4 Arial,sans-serif;text-align:center;transform-origin:50% 100%;transform:rotateX(50deg);animation:smcrawl 22s linear infinite}
@keyframes smcrawl{to{top:-160%}}
.wp-u-sam a{color:#ffe81f}.wp-u-sam .wgb{background:#111;color:#ddd;border-color:#ffe81f}.wp-u-sam .wgb-head{background:#443}.wp-u-sam .wgbe-h b{color:#ffe81f}`,
    html: c => {
      const md = c.t99.md, out = md >= REL, t = c.t99.date, rel = new Date(1999, 6, 16), days = Math.round(Math.abs(rel - t) / 86400000);
      return `<h1>{kidEp1.NAME}'S EPISODE I COUNTDOWN</h1>
<p class="c"><marquee scrollamount="5">A long time ago... was 1983. That was the last one. SIXTEEN YEARS. And now, in 1999, there's a NEW ONE. I have been waiting my whole life. (I am 12.) (So: my whole life.)</marquee></p>
<div class="sm-cd">${out ? `<div>THE PHANTOM MENACE HAS BEEN OUT (HERE) FOR</div><div class="sm-n">${days}</div><div>DAYS. I have seen it ${Math.min(14, 1 + Math.floor(days / 9))} times. So far.</div>` : `<div>DAYS UNTIL EPISODE I OPENS IN THE UK (16th JULY)</div><div class="sm-n">${days}</div><div class="small">It came out in America on the 19th of MAY. Two months before us. TWO MONTHS. I have had to avoid the Internet, the playground, the newsagent and my cousin in Ohio. It's been like living in a cupboard.</div>`}</div>
<div class="sm-box"><h2>THE TRAILER (a download story)</h2><p>The teaser came out in <b>November 1998</b>. In America people paid for a ticket to some other film, watched the two minutes of trailer at the start, then <i>walked out</i>. I would have done the same. Instead, I downloaded it. On a 56K modem. Here is the log, kept by my dad, who needed the phone.</p>
<div class="sm-dl">Downloading teaser.mov (approx 12 MB) ...
Estimated time: 1 hour 12 min
[###                        ] 11%   22 min   Mom picked up the phone. Connection lost.
Redialling... connected at 44,000 bps
[########                   ] 30%   48 min   "Is it done yet?" (Dad)
[##############             ] 52%   1 hr 20  Call waiting beep. Hung on. Survived.
[#####################      ] 78%   2 hr 05  Dad: "I am going to bed. If anyone rings, YOU explain."
[###########################] 100%  2 hr 41  DONE.
Playing teaser.mov... (a bit jerky, 240 pixels wide, and the most beautiful thing I have ever seen)</div>
<p class="small">The FULL trailer came out in <b>March 1999</b>. That one took all night. I slept on the floor next to the computer so I could hear if it stopped. It didn't. I am a professional now.</p></div>
<div class="sm-box"><h2>WHAT WE KNEW BEFORE IT CAME OUT (from the trailers and magazines)</h2><table><tr><td>Two Jedi</td><td>An older one and a younger one with a little ponytail. The younger one becomes the old man from the first film, which breaks my brain a bit.</td></tr><tr><td>A queen</td><td>With the most amazing outfits. {cousin}'s page would have a field day.</td></tr><tr><td>A kid</td><td>Who grows up to be YOU KNOW WHO. He's about 9. He builds things. He races things.</td></tr><tr><td>A baddie</td><td>Red and black face, horns, and a lightsaber with a blade at BOTH ENDS. Everyone in my class drew him on their exercise books within a week.</td></tr><tr><td>A podrace</td><td>See ${c.a('podracing', 'Podracing HQ')}. I can't talk about it calmly.</td></tr><tr><td>A tall alien with floppy ears</td><td>...we'll get to him. ${c.a('jarjar', 'There is a page.')}</td></tr></table></div>
<div class="sm-box"><h2>MY OPENING NIGHT PLAN ${out ? '(HOW IT WENT)' : ''}</h2><ol><li>Queue from 6am. Dad says 6am is "not happening". Compromise: 9am. Fine.</li><li>Dressing gown = robe. Wrapping paper tube = lightsaber. (Painted green. The paint came off on the bus.)</li><li>Front row. No. Middle. Dave says front row, Dave is wrong, your neck dies.</li><li>Popcorn: sweet. This is not up for debate.</li><li>Do NOT read anything on the Internet before. Especially not ${c.a('swrumours', 'the Rumour Mill')}. ${out ? '(I read it. Half of it was wrong. Told you.)' : ''}</li></ol>${out ? '<p>Verdict: the podrace, the two-ended lightsaber bit at the end and the music made my whole year. Some bits were slow. Dave fell asleep in a slow bit and woke up for the end and said it was "the best film ever", which it is, but he only saw 20 minutes of it.</p>' : ''}</div>
<div class="sm-box"><h2>MY OWN OPENING CRAWL (written by me, about me)</h2><div class="sm-crawl"><div>EPISODE 0.5<br>THE PHANTOM QUEUE<br><br>It is a period of waiting. A young fan, {kidEp1.NAME}, has downloaded the trailer four times and watched it 61 times. {kidEp1.His} Dad, needing the telephone, has threatened to unplug the modem. The toys are already in the shops. The film is not. Somewhere, a {kidEp1.kidw} in a dressing gown stands in the garden, swinging a cardboard tube at {kidEp1.his} best mate, Dave, and losing....</div></div></div>
<p class="c">${c.midi('web-saga', 'galaxy_saga.mid')} <span class="small">(my own space music. not the real one. you're not allowed to put the real one on the Internet, Jack says)</span></p>
<button class="sm-big sm-seen" type="button">${out ? "I'VE SEEN IT!!! (click if you have too)" : "I'M GOING ON OPENING DAY (click to promise)"}</button><p class="c sm-n2 small"></p>
<p class="c">Fans who've visited: ${c.counter('gold')}</p>
${c.gb([['Jack', c.daysAgo(2), 'the podrace. THE PODRACE.', 5], ['Dave', c.daysAgo(3), 'best film ever (i saw the end)', 5], ['{club1}', c.daysAgo(5), 'four stars. FOUR. see my page. the slow bits were slow, {kidEp1}', 4], ["{kidEp1}'s Dad", c.daysAgo(8), 'Please can we have the phone back now.', 2]], { title: 'Sign the Jedi Archives', ph: 'Seen it? How many times? What did you think?' })}
<p class="c small">More: ${c.a('podracing')} &middot; ${c.a('jarjar', 'the great debate')} &middot; ${c.a('swrumours', 'rumours')} &middot; ${c.a('brickwars', 'the brick wishlist')} &middot; ${c.a('saberduel', 'me vs Dave: the duel')} &middot; ${c.a('~zed', "{club1}'s review")}</p>
${c.ring()}`;
    },
    setup(el, c) {
      const n = el.querySelector('.sm-n2'), K = 'web.sam.seen';
      const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB') + ' fans have clicked the big button.'; };
      c.get([K]).then(v => show(v[K])); c.watch(K, ev => { if (ev.type === 'set') show(ev.v); });
      let done = false;
      el.querySelector('.sm-seen').addEventListener('click', () => { if (done) return; done = true; Net.kv.inc(K); Sound.play('solve'); c.secret('web.countdown'); Desk.toast(Cast.n('kidEp1'), 'YESSSS. Another one. Welcome to the queue.', 3000); });
    },
  });

  // ---------------------------------------------------------------- jarjar: the great debate
  def('jarjar', {
    css: `.wp-jarjar{background:#1a3a2a ${tile('<ellipse cx="20" cy="20" rx="6" ry="9" fill="#214a33"/><ellipse cx="44" cy="44" rx="5" ry="8" fill="#214a33"/>', 56)};color:#eef;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-jarjar h1{font:bold 28px "Arial Black",Impact,sans-serif;text-align:center;color:#ffb347;margin:4px 0;text-shadow:2px 2px #000}
.wp-jarjar .jj-vs{display:flex;gap:12px;flex-wrap:wrap;max-width:720px;margin:12px auto}
.wp-jarjar .jj-side{flex:1 1 280px;padding:10px 14px;border:3px solid;background:rgba(0,0,0,.5)}
.wp-jarjar .jj-yes{border-color:#f55}.wp-jarjar .jj-no{border-color:#5f5}
.wp-jarjar .jj-side h2{margin:0 0 6px;font:bold 18px "Arial Black",sans-serif}
.wp-jarjar .jj-yes h2{color:#f55}.wp-jarjar .jj-no h2{color:#5f5}
.wp-jarjar .jj-vote{text-align:center;background:#000;border:3px double #ffb347;padding:12px;max-width:560px;margin:12px auto}
.wp-jarjar .jj-bar{display:flex;height:28px;border:2px solid #fff;margin:8px 0;overflow:hidden;font:bold 13px Arial,sans-serif;line-height:28px}
.wp-jarjar .jj-bar b{background:#c33;color:#fff;text-align:center;transition:width .6s;overflow:hidden;white-space:nowrap}
.wp-jarjar .jj-bar i{background:#3a3;color:#fff;text-align:center;flex:1;font-style:normal;overflow:hidden;white-space:nowrap}
.wp-jarjar .btn.big{font-size:15px;padding:6px 14px;margin:4px}
.wp-jarjar .jj-rules{font-size:12px;color:#cdc;max-width:560px;margin:0 auto;text-align:center}
.wp-jarjar a{color:#ffb347}.wp-jarjar .wgb{background:#0a1a10;color:#eef;border-color:#ffb347}.wp-jarjar .wgb-head{background:#2a5a3a}.wp-jarjar .wgbe-h b{color:#ffb347}`,
    html: c => `<h1>IS JAR JAR RUINING IT?<br><span style="font-size:18px;color:#fff">THE GREAT DEBATE (a fan-run page, be nice)</span></h1>
<p class="c">So. The new film has a tall, floppy-eared, clumsy alien in it who talks in a funny way and falls over a LOT. Half of my class think he's the funniest thing ever. The other half think he has RUINED THE ENTIRE FILM and possibly cinema itself. Here is both sides. Then you vote. Live. Everyone on JackNet sees the result.</p>
<div class="jj-vs"><div class="jj-side jj-yes"><h2>YES, HE IS RUINING IT (Dave, {club1}, most of our school)</h2><ul><li>He falls over. Then he falls over again. Then he steps in something.</li><li>The film is about a galaxy at war and he's doing a silly voice in the middle of it.</li><li>The serious bits (the duel! the podrace!) are AMAZING, so why is HE in it?</li><li>Dave: "my little sister likes him. That tells you everything."</li></ul></div>
<div class="jj-side jj-no"><h2>NO, LEAVE HIM ALONE ({kidEp1}, {cousin}, Dave's little sister, me a bit)</h2><ul><li>It's a film for KIDS as well. There was a robot that beeped and a big hairy bloke in the old ones and nobody complained about them.</li><li>He's actually brave in the big battle at the end and he does help, by accident, which still counts.</li><li>The underwater city he lives in is one of the best bits in the whole film.</li><li>{kidEp1}: "You were all laughing in the cinema. I heard you. {club1.NAME}."</li></ul></div></div>
<div class="jj-vote"><b>VOTE NOW:</b><br><button class="btn big" type="button" data-v="yes">RUINING IT</button><button class="btn big" type="button" data-v="no">LEAVE HIM ALONE</button><div class="jj-bar"><b class="jj-y" style="width:50%">?</b><i class="jj-n">?</i></div><div class="jj-tot small">Loading votes from the Senate...</div></div>
<p class="jj-rules">Rules: one vote each (you can change your mind, this is a democracy). No being horrible about the actor, he's a real person and he did his best. The alien is fair game. He's made up.</p>
<p class="c">Debaters so far: ${c.counter('odo')}</p>
${c.gb([['{club1}', c.daysAgo(1), 'RUINING IT. I counted. He falls over eleven times.', 1], ['{kidEp1}', c.daysAgo(1), 'you COUNTED? you watched it THAT closely? who\'s the fan now', 5], ["Dave's sister", c.daysAgo(4), 'hes funny and ur all boring', 5], ['{cousin}', c.daysAgo(6), 'the queen has 7 outfits. THAT is what matters. (leave him alone)', 4]], { title: 'ARGUE HERE (nicely)', ph: 'Make your case. Be nice. No shouting (CAPITALS = shouting).' })}
<p class="c small">${c.a('~sam', "{kidEp1}'s countdown")} &middot; ${c.a('podracing', 'something everyone agrees on')} &middot; ${c.a('swrumours', 'rumours')} &middot; ${c.a('poll', 'more polls')}</p>
${c.ring()}`,
    setup(el, c) {
      const K = 'web.jarjar.vote', y = el.querySelector('.jj-y'), n = el.querySelector('.jj-n'), tot = el.querySelector('.jj-tot');
      const show = v => { v = v && typeof v === 'object' ? v : {}; let a = 0, b = 0; for (const k in v) { if (v[k] === 'yes') a++; else if (v[k] === 'no') b++; } const t = a + b; const p = t ? Math.round(a / t * 100) : 50; y.style.width = p + '%'; y.textContent = t ? p + '% RUINING' : '?'; n.textContent = t ? (100 - p) + '% LEAVE HIM' : '?'; tot.textContent = t ? t + ' votes. ' + (v[W.vh()] ? 'You voted "' + (v[W.vh()] === 'yes' ? 'ruining it' : 'leave him alone') + '".' : 'You have not voted yet!') : 'No votes yet. Be the first!'; };
      const load = () => c.get([K]).then(v => show(v[K])); load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
      el.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { Net.kv.put(K, W.vh(), b.dataset.v); Sound.play('click'); c.secret('web.jarjar'); }));
    },
  });

  // ---------------------------------------------------------------- podracing: HQ with a little race game
  def('podracing', {
    css: `.wp-podracing{background:#c9a24a ${tile('<path d="M0 30q20-10 40 0t40 0" stroke="#b8903a" fill="none" stroke-width="3"/>', 80, 40)};color:#2a1a00;font:14px/1.45 Arial,sans-serif}
.wp-podracing h1{font:italic bold 40px Impact,"Arial Black",sans-serif;text-align:center;color:#fff;-webkit-text-stroke:2px #000;text-shadow:4px 4px 0 #a00;margin:4px 0;letter-spacing:2px}
.wp-podracing .pd-box{background:#fff6dc;border:3px solid #5a3a00;padding:10px 14px;margin:12px auto;max-width:680px}
.wp-podracing h2{background:#5a3a00;color:#ffd400;font:bold 16px Impact,sans-serif;letter-spacing:1px;padding:3px 8px;margin:-10px -14px 8px}
.wp-podracing table{width:100%;font-size:13px}.wp-podracing td,.wp-podracing th{border:1px solid #c9a24a;padding:3px 5px;text-align:left}.wp-podracing th{background:#ffe9a0}
.wp-podracing canvas{display:block;width:100%;max-width:560px;height:160px;margin:0 auto;background:#e8c070;border:3px solid #5a3a00;image-rendering:pixelated}
.wp-podracing .pd-ctl{text-align:center;margin:8px 0}
.wp-podracing .pd-ctl .btn{font-size:15px;padding:6px 16px}
.wp-podracing .pd-msg{text-align:center;font-weight:bold;min-height:20px}
.wp-podracing a{color:#a00}.wp-podracing .wgb{background:#fff6dc;border-color:#5a3a00}.wp-podracing .wgb-head{background:#5a3a00}`,
    html: c => `<h1>PODRACING HQ</h1>
<p class="c"><marquee scrollamount="10">&#9889; TWO ENGINES &#9889; ONE TINY COCKPIT &#9889; A VERY LONG CABLE &#9889; SPEEDS THAT WOULD TAKE YOUR FACE OFF &#9889; THE BEST TEN MINUTES OF ANY FILM EVER &#9889;</marquee></p>
<div class="pd-box"><h2>WHAT IS A POD?</h2><p>Two massive engines, chained together, dragging a little cockpit behind them on cables. Like a chariot, if the horses were jet engines and had no brakes. The race in the film is on a desert planet, round a big circuit, three laps, through canyons and caves and past a lot of people who should stand further back.</p><p>The boy who wins it is NINE. Nine! I'm 12 and I'm not allowed on the main road on my bike.</p></div>
<div class="pd-box"><h2>DRIVER FILES (from the film, no spoilers past the race)</h2><table><tr><th>Driver</th><th>Pod</th><th>Notes</th></tr><tr><td>The Boy</td><td>Home-made, from scrap</td><td>Built it himself. Only human who can do it. Not a spoiler: he's in the trailer.</td></tr><tr><td>Sebulba</td><td>Big, orange, loud</td><td>THE CHEAT. Has a flamethrower on his engine. Drives with his FEET. Everyone in the cinema booed him. Correctly.</td></tr><tr><td>The others</td><td>Various</td><td>Loads of weird aliens. One has too many arms. One has an engine that spins. Most of them do not finish. Watch the ones at the back.</td></tr></table><p class="small">There's a podracing GAME out on the N64 and PC this year as well. We played it at Dave's cousin's. It is very fast and you crash a lot and it's brilliant.</p></div>
<div class="pd-box"><h2>RACE! (3 laps, you vs Sebulba)</h2><p class="small">Click <b>BOOST</b> fast to go faster, but if the engine heat bar fills up you stall. Sebulba cheats. Of course he does.</p><canvas width="280" height="80"></canvas><div class="pd-ctl"><button class="btn pd-go" type="button">START RACE</button> <button class="btn pd-boost" type="button" disabled>BOOST!</button></div><div class="pd-msg"></div></div>
<div class="pd-box"><h2>PLAYGROUND PODRACING RULES</h2><ol><li>Two people hold a skipping rope. They are the engines. One person holds the other end. They are the pod.</li><li>The engines run. The pod runs after them. The pod always falls over.</li><li>Flamethrowers are NOT allowed. (Dave asked.)</li><li>Mr Peters has banned podracing on the tarmac. Grass only. Grass is fine. Grass is Tatooine now.</li></ol></div>
<p class="c">${c.midi('web-pod', 'podrace_fever.mid')}</p>
<p class="c">Racers through the gate: ${c.counter('led', { len: 5 })}</p>
${c.gb([['{kidEp1}', c.daysAgo(1), 'i have watched the race scene 30 times. the bit with the cable. THE BIT WITH THE CABLE.', 5], ['Dave', c.daysAgo(2), 'sebulba is cool actually. (im joking) (im not)', 3], ['Mr Peters', c.daysAgo(9), 'Grass only. I mean it.', 2]], { title: 'PIT LANE (guestbook)', ph: 'Best podracing moment? Beat Sebulba yet?' })}
<p class="c small">${c.a('~sam', "{kidEp1}'s countdown")} &middot; ${c.a('jarjar', 'the debate')} &middot; ${c.a('brickwars', 'the brick pod')} &middot; ${c.a('rovers', 'a slower kind of racing')}</p>
${c.ring()}`,
    setup(el, c) {
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), go = el.querySelector('.pd-go'), bo = el.querySelector('.pd-boost'), msg = el.querySelector('.pd-msg');
      let st = 'idle', me = 0, seb = 0, heat = 0, stall = 0, lap = 0, slap = 0, over = false;
      const draw = () => {
        g.fillStyle = '#e8c070'; g.fillRect(0, 0, 280, 80); g.fillStyle = '#c9a24a'; for (let x = 0; x < 280; x += 20) g.fillRect(x, 38, 10, 4);
        g.fillStyle = '#5a3a00'; g.fillRect(0, 20, 280, 2); g.fillRect(0, 58, 280, 2);
        const px = p => 10 + (p % 1) * 250;
        const pod = (x, y, col, fl) => { g.fillStyle = col; g.fillRect(x, y, 10, 6); g.fillRect(x, y + 10, 10, 6); g.fillStyle = '#333'; g.fillRect(x - 14, y + 7, 14, 1); g.fillRect(x - 14, y + 9, 14, 1); g.fillStyle = '#888'; g.fillRect(x - 20, y + 5, 6, 6); if (fl) { g.fillStyle = '#f80'; g.fillRect(x + 10, y + 1, 4 + Math.random() * 6, 4); g.fillRect(x + 10, y + 11, 4 + Math.random() * 6, 4); } };
        pod(px(me), 24, stall > 0 ? '#777' : '#49f', st === 'run' && stall <= 0); pod(px(seb), 62 - 16 - 2, '#f60', st === 'run');
        g.fillStyle = '#000'; g.font = 'bold 9px monospace'; g.fillText('YOU  lap ' + Math.min(3, Math.floor(me) + 1) + '/3', 4, 10); g.fillText('SEBULBA lap ' + Math.min(3, Math.floor(seb) + 1) + '/3', 180, 10);
        g.fillStyle = '#400'; g.fillRect(4, 70, 100, 6); g.fillStyle = heat > 0.8 ? '#f00' : '#fa0'; g.fillRect(4, 70, heat * 100, 6); g.fillText('HEAT', 108, 76);
      };
      draw();
      let boost = 0;
      bo.addEventListener('click', () => { if (st !== 'run' || stall > 0) return; boost += 1; heat = Math.min(1, heat + 0.09); Sound.play('zap'); if (heat >= 1) { stall = 1.6; msg.textContent = 'ENGINE STALL! Too hot! Let it cool...'; Sound.play('thud'); } });
      go.addEventListener('click', () => { if (st === 'run') return; st = 'run'; me = 0; seb = 0; heat = 0; stall = 0; boost = 0; over = false; go.disabled = true; bo.disabled = false; msg.textContent = 'GO GO GO!'; c.music('web-pod'); });
      c.anim(dt => {
        if (st === 'run') {
          if (stall > 0) { stall -= dt; heat = Math.max(0, heat - dt * 0.6); } else { me += dt * (0.14 + boost * 0.07); heat = Math.max(0, heat - dt * 0.25); }
          boost = Math.max(0, boost - dt * 3);
          seb += dt * 0.17 * (me > seb + 0.3 ? 1.35 : 1); // he cheats when behind
          if (me >= 3 || seb >= 3) {
            st = 'idle'; go.disabled = false; bo.disabled = true; const won = me >= 3 && me >= seb;
            msg.textContent = won ? 'YOU WIN!!! Sebulba crashed into a rock. As he should.' : 'Sebulba wins. He cheated. He DEFINITELY cheated. Again?';
            Sound.play(won ? 'solve' : 'uhoh'); if (won) c.secret('web.podrace'); c.stopMusic();
          }
        }
        draw();
      });
    },
  });

  // ---------------------------------------------------------------- swrumours: the rumour mill (1998-99), checked after release
  const RUMOURS = [
    ['The film will be called "The Beginning".', 'FALSE', "That was a working title people whispered about. The real title came out in September 1998 and the whole playground went \"...the WHAT menace?\" for a week."],
    ['The baddie has a lightsaber with TWO blades.', 'TRUE', 'In the trailer. Confirmed. Every exercise book at our school now has one drawn on it.'],
    ['The little kid builds the gold robot from the old films.', 'TRUE', "Yes! He's got him in bits in his bedroom. The robot has no outside on yet. It's one of the best bits."],
    ['Yoda is a computer effect in this one.', 'FALSE', "He's a puppet, like the old days. (Some people thought he'd be computer-made because other characters are.)"],
    ['The one with the floppy ears is secretly a baddie.', 'FALSE', "No. He's just clumsy. Some people on the Internet REALLY wanted this to be true. See LINK_JJ."],
    ['A bounty hunter from the old films is in it.', 'FALSE', "Nope. Not in this one. Everyone's cousin said he was. Everyone's cousin was wrong."],
    ['There is a secret scene after the credits.', 'FALSE', 'We sat there until the lights came on. The man sweeping up looked at us. There is nothing.'],
    ['The queen has a decoy who dresses as her.', 'TRUE (spoiler-ish)', "Yes. If you haven't seen it, pretend you didn't read that."],
    ['It is over two hours long.', 'TRUE', 'About 2 hours 15 minutes. Take a wee BEFORE. Dave did not take a wee before.'],
    ['The podrace is ten minutes long.', 'TRUE (roughly)', 'Give or take. It feels like 30 seconds and also forever. Best ten minutes of the year.'],
    ['The little robot from the old films is in it.', 'TRUE', "The round one that beeps. He gets a little moment where he's a hero. Everyone cheered."],
    ['The old films are getting put in the bin and this one replaces them.', 'FALSE', 'Nobody is putting anything in a bin. It goes BEFORE them. That is what Episode ONE means, Dave.'],
  ];
  def('swrumours', {
    css: `.wp-swrumours{background:#222 ${tile('<text x="2" y="14" font-family="Courier New" font-size="11" fill="#2a2a2a">RUMOUR</text>', 48, 18)};color:#eee;font:14px/1.5 "Courier New",monospace}
.wp-swrumours h1{font:bold 30px "Courier New",monospace;text-align:center;color:#fff;margin:4px 0;background:#a00;padding:6px;transform:rotate(-1deg)}
.wp-swrumours .rm-warn{background:#ff0;color:#000;font-weight:bold;padding:6px 10px;text-align:center;margin:10px auto;max-width:640px;border:3px solid #000}
.wp-swrumours .rm-list{max-width:680px;margin:0 auto}
.wp-swrumours .rm{background:#333;border-left:6px solid #888;padding:8px 12px;margin:8px 0}
.wp-swrumours .rm b{color:#ff0}
.wp-swrumours .rm .rm-v{display:inline-block;font-weight:bold;padding:0 6px;margin:4px 0;background:#000}
.wp-swrumours .rm.t{border-color:#0f0}.wp-swrumours .rm.t .rm-v{color:#0f0}
.wp-swrumours .rm.f{border-color:#f44}.wp-swrumours .rm.f .rm-v{color:#f44}
.wp-swrumours .rm .rm-x{display:none;color:#ccc;font-size:13px}
.wp-swrumours .rm.open .rm-x{display:block}
.wp-swrumours .rm.open .rm-v{display:inline-block}
.wp-swrumours .rm:not(.open) .rm-v{display:none}
.wp-swrumours .rm-cl{color:#8cf;cursor:pointer;font-size:12px}
.wp-swrumours a{color:#ff0}.wp-swrumours .wgb{background:#111;color:#eee;border-color:#a00}.wp-swrumours .wgb-head{background:#a00}.wp-swrumours .wgbe-h b{color:#ff0}`,
    html: c => {
      const out = c.t99.md >= REL;
      return `<h1>THE RUMOUR MILL: EPISODE I</h1>
<div class="rm-warn">EVERYTHING ON THIS PAGE IS A RUMOUR. A RUMOUR IS A THING SOMEBODY'S COUSIN SAID. ${out ? 'THE FILM IS OUT NOW, SO CLICK A RUMOUR TO SEE IF IT WAS TRUE. (SPOILERS, OBVIOUSLY.)' : 'THE FILM IS NOT OUT HERE YET (16th JULY), SO NOBODY KNOWS. NOT EVEN YOUR COUSIN.'}</div>
<p class="c">Collected from the playground, the bus, three magazines and the Internet, between <b>1998</b> and now. Some of these turned out true. Most of them turned out to be Dave.</p>
<div class="rm-list">${RUMOURS.map((r, i) => `<div class="rm ${r[1].startsWith('TRUE') ? 't' : 'f'}" data-i="${i}"><b>RUMOUR #${i + 1}:</b> ${esc(r[0])}<br>${out ? `<span class="rm-cl">[ click to check it ]</span><span class="rm-v">${esc(r[1])}</span><div class="rm-x">${r[2].replace('LINK_JJ', c.a('jarjar', 'the debate page'))}</div>` : `<span class="small">Source: ${esc(['a magazine', "Dave's cousin", 'the Internet', 'a boy on the bus', '{kidEp1} (who has read everything)', 'the trailer, so probably true'][i % 6])}</span>`}</div>`).join('')}</div>
<p class="c">Rumour-mongers served: ${c.counter('plain')}</p>
${c.gb([['Dave', c.daysAgo(2), 'my cousin was RIGHT about the two blades thing so', 4], ['{kidEp1}', c.daysAgo(2), 'your cousin saw the trailer, Dave. like everyone.', 3], ['{kidPoke}', c.daysAgo(5), 'rumour: there is a Mew under a truck. (different film) (different everything) (sorry)', 5]], { title: 'HEARD A RUMOUR?', ph: 'Post it. Say who told you. We will check it.' })}
<p class="c small">${c.a('~sam', 'the countdown')} &middot; ${c.a('jarjar', 'the debate')} &middot; ${c.a('~ellie', 'facts (the opposite of this page)')} &middot; ${c.a('area51', 'rumours about other things')}</p>
${c.ring()}`;
    },
    setup(el) { el.querySelectorAll('.rm-cl').forEach(a => a.addEventListener('click', () => { a.closest('.rm').classList.add('open'); a.remove(); Sound.play('click'); })); },
  });

  // ---------------------------------------------------------------- brickwars: the 1999 space brick wishlist
  const SETS = [['7101', 'Lightsaber Duel', 'small', 'The two-ended-lightsaber baddie vs the Jedi with the ponytail, on a little platform. The FIRST one I want. Pocket money: 3 weeks.'], ['7110', 'Landspeeder', 'small', 'The old man and the farm boy in their floaty car. From the OLD film. Still counts.'], ['7111', 'Droid Fighter', 'small', 'A fighter that folds up. Mine will not fold up. Mine will be on the shelf, open, forever.'], ['7121', 'Naboo Swamp', 'small', 'A swamp! With the floppy-eared one! And a droid on a speeder bike thing!'], ['7128', 'Speeder Bikes', 'small', 'Forest chase. Two bikes. One tree. Nan says "where are the rest of the trees".'], ['7130', 'Snowspeeder', 'medium', 'The snow one, from the second old film. It has the harpoon cable thing. Dave broke the cable thing at his cousin\'s.'], ['7131', "Anakin's Podracer", 'medium', 'THE POD. The boy\'s one. Two engines, one cockpit, cables. See LINK_POD. Top of the list, obviously.'], ['7140', 'X-wing Fighter', 'medium', 'The wings OPEN. Birthday request #1. Already told everyone. Twice.'], ['7141', 'Naboo Fighter', 'medium', 'The shiny yellow and silver one. Chrome bits! CHROME!'], ['7150', 'TIE Fighter & Y-wing', 'big', 'Two ships in one box. The TIE has the round window. Christmas list, top line, underlined.'], ['7151', 'Sith Infiltrator', 'big', 'The baddie\'s ship. Flat and pointy and sneaky. Comes with him.'], ['7161', 'Gungan Sub', 'big', 'The underwater city sub thing. Has a big round bit. Has the floppy-eared one, again, he\'s in everything.'], ['7171', 'Mos Espa Podrace', 'HUGE', 'THREE pods. The start gate. It\'s the size of a pillow. It costs more than my bike. I have asked for it from everyone, including the postman.']];
  def('brickwars', {
    css: `.wp-brickwars{background:#ffd500 ${tile('<rect x="2" y="8" width="28" height="20" rx="2" fill="#e8c200"/><circle cx="10" cy="8" r="4" fill="#e8c200"/><circle cx="22" cy="8" r="4" fill="#e8c200"/>', 32)};color:#000;font:14px/1.45 Arial,sans-serif}
.wp-brickwars h1{font:bold 30px "Arial Black",Arial,sans-serif;text-align:center;color:#d00;text-shadow:2px 2px #fff,4px 4px #000;margin:4px 0}
.wp-brickwars .bw-wrap{max-width:680px;margin:0 auto;background:#fff;border:4px solid #000;padding:12px 16px}
.wp-brickwars .bw-set{display:flex;gap:10px;align-items:flex-start;border-bottom:2px dotted #999;padding:8px 0}
.wp-brickwars .bw-brick{flex:none;width:56px;height:40px;border-radius:3px;position:relative;border:2px solid #000}
.wp-brickwars .bw-brick::before,.wp-brickwars .bw-brick::after{content:"";position:absolute;top:-8px;width:14px;height:10px;border-radius:50%;border:2px solid #000;background:inherit}
.wp-brickwars .bw-brick::before{left:6px}.wp-brickwars .bw-brick::after{right:6px}
.wp-brickwars .bw-set b{font-size:15px}
.wp-brickwars .bw-sz{display:inline-block;font:bold 10px Arial,sans-serif;background:#000;color:#ffd500;padding:1px 5px;margin-left:4px}
.wp-brickwars .bw-got{color:#080;font-weight:bold}
.wp-brickwars .bw-tot{background:#000;color:#ffd500;padding:8px;text-align:center;font-weight:bold;margin-top:10px}
.wp-brickwars label{cursor:pointer}
.wp-brickwars a{color:#d00}.wp-brickwars .wgb{border-color:#000}.wp-brickwars .wgb-head{background:#d00}`,
    html: c => `<div class="bw-wrap"><h1>MY SPACE BRICK WISHLIST 1999</h1>
<p class="c"><b>HUGE NEWS:</b> the building bricks people have done the space films this year!!! For the first time EVER. Thirteen sets. Here they all are, and I want ALL of them. Tick the ones you've got (the computer remembers). Birthday + Christmas + pocket money + washing Dad's car = maybe four.</p>
<p class="small">No set pictures (Jack says you can't copy them). I've drawn a brick next to each one instead. Use your imagination, it's what the bricks are FOR.</p>
${SETS.map((s, i) => `<div class="bw-set"><div class="bw-brick" style="background:${['#d00', '#06c', '#fff', '#888', '#0a0', '#000'][i % 6]}"></div><div><label><input type="checkbox" data-s="${i}"> <b>${s[0]} ${esc(s[1])}</b></label><span class="bw-sz">${s[2]}</span> <span class="bw-got"></span><br>${s[3].replace('LINK_POD', c.a('podracing', 'Podracing HQ'))}</div></div>`).join('')}
<div class="bw-tot">GOT: <span class="bw-n">0</span> / ${SETS.length} &nbsp;|&nbsp; <span class="bw-say">Pocket money required: all of it.</span></div>
<h3>BUILDING RULES (mine)</h3><ol><li>Instructions first time. Then NO instructions. Then it's a different ship. Then it's a "custom".</li><li>Keep the little men in the tin. The tin is the Jedi tin. Dave is not allowed in the Jedi tin.</li><li>If a piece goes under the sofa it is gone forever. Mourn it. Move on.</li><li>Do NOT step on one in bare feet. You will see the whole galaxy at once.</li></ol>
<p class="c">Brick fans: ${c.counter('flip')}</p>
${c.gb([['Jack', c.daysAgo(2), 'I\'ve got the duel one. the little platform spins round!!! come and see', 5], ['Dave', c.daysAgo(3), 'I built the pod and then I built a better pod out of the pod. its a tank now', 4], ['Mom', c.daysAgo(6), 'The sofa. I am not moving the sofa again.', 2]], { title: 'BRICK BOOK', ph: 'Which ones have you got? Any customs?' })}
<p class="c small">${c.a('podracing')} &middot; ${c.a('~sam', "{kidEp1}'s countdown")} &middot; ${c.a('saberduel', 'a real duel (with tubes)')} &middot; ${c.a('teef', 'a shop that does not sell these')}</p>
${c.ring()}</div>`,
    setup(el) {
      let got = {}; try { got = JSON.parse(localStorage.getItem('jhp_web_bricks') || '{}'); } catch (e) {}
      const n = el.querySelector('.bw-n'), say = el.querySelector('.bw-say');
      const upd = () => { const k = Object.keys(got).length; n.textContent = k; say.textContent = k === 0 ? 'Pocket money required: all of it.' : k < 4 ? 'A good start. Wash more cars.' : k < 10 ? 'That is a LOT of bricks. Is your floor OK?' : k < SETS.length ? 'Nearly all of them?! Who ARE you?' : 'ALL OF THEM. The sofa is full. Well done.'; };
      el.querySelectorAll('[data-s]').forEach(cb => { const g = cb.closest('div').querySelector('.bw-got'); cb.checked = !!got[cb.dataset.s]; g.textContent = cb.checked ? 'GOT IT!' : ''; cb.addEventListener('change', () => { if (cb.checked) got[cb.dataset.s] = 1; else delete got[cb.dataset.s]; try { localStorage.setItem('jhp_web_bricks', JSON.stringify(got)); } catch (e) {} g.textContent = cb.checked ? 'GOT IT!' : ''; upd(); Sound.play('click'); }); });
      upd();
    },
  });

  // ---------------------------------------------------------------- saberduel: pixel "photos" of the duel in the garden
  const SHOTS = [
    ['Photo 1: The Challenge', 'Dave turned up with a wrapping paper tube painted red. I had mine painted green (the paint came off on the bus, so it\'s mostly brown). The garden was Naboo. The shed was the hangar. Mom was the Senate.', 0],
    ['Photo 2: The Stare', 'We stared at each other for ages like in the film. Dave blinked first. Then he said "I didn\'t blink". He blinked.', 1],
    ['Photo 3: First Contact', 'Tubes clash! Mine bent a bit. The noise is not like the film. The noise is "fwap". We made the proper noise with our mouths. The neighbours heard.', 2],
    ['Photo 4: The Spin', 'Dave did a spin. It was quite good. Then he hit the washing line. The washing line fought back. Dave lost to a towel.', 3],
    ['Photo 5: High Ground', 'I climbed on the bench. Dave said that was cheating. I said the Jedi do it in the films. Dave said "which film". I did not have an answer. I stayed on the bench.', 4],
    ['Photo 6: The Finish', 'Mom came out and said tea was ready. Both tubes were now bent in half. We agreed it was a draw. It was NOT a draw. I was on the bench. (Dave is writing "IT WAS A DRAW" on his page right now, I can hear him typing through the wall.)', 5],
  ];
  def('saberduel', {
    css: `.wp-saberduel{background:#111 ${tile('<rect width="12" height="12" fill="#111"/><rect width="6" height="6" fill="#161616"/><rect x="6" y="6" width="6" height="6" fill="#161616"/>', 12)};color:#eee;font:14px/1.45 Arial,sans-serif}
.wp-saberduel h1{font:bold 28px Impact,"Arial Black",sans-serif;text-align:center;color:#fff;letter-spacing:2px;margin:6px 0}
.wp-saberduel h1 span{color:#f44;text-shadow:0 0 10px #f00}.wp-saberduel h1 em{font-style:normal;color:#6f6;text-shadow:0 0 10px #0f0}
.wp-saberduel .sd-album{max-width:520px;margin:10px auto;background:#222;border:4px solid #555;padding:10px}
.wp-saberduel canvas{display:block;width:100%;image-rendering:pixelated;background:#000;border:2px solid #000}
.wp-saberduel .sd-cap{background:#fff;color:#000;padding:8px 10px;font:13px/1.4 "Comic Sans MS",cursive;margin-top:8px;min-height:60px}
.wp-saberduel .sd-nav{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px;flex-wrap:wrap}
.wp-saberduel .sd-dave{background:#300;border:2px solid #f44;padding:8px 12px;max-width:520px;margin:12px auto;color:#fcc;font-weight:bold;text-align:center}
.wp-saberduel a{color:#6f6}.wp-saberduel .wgb{background:#222;color:#eee;border-color:#555}.wp-saberduel .wgb-head{background:#444}.wp-saberduel .wgbe-h b{color:#6f6}`,
    html: c => `<h1>LIGHTSABER DUEL: <em>ME</em> vs <span>DAVE</span> (photos)</h1>
<p class="c small">Photos taken by Jack on the digital camera from Computer Club (640x480, it takes 8 photos then it's full). Scanned onto the Internet at 32 colours because the page was taking 9 minutes to load.</p>
<div class="sd-album"><canvas width="160" height="100" aria-label="A pixel photo of the duel"></canvas><div class="sd-cap"></div><div class="sd-nav"><button class="btn sd-prev" type="button">&laquo; Prev</button><span class="sd-n small"></span><button class="btn sd-next" type="button">Next &raquo;</button></div></div>
<div class="sd-dave">DAVE SAYS: IT WAS A DRAW. (Dave made me put this here. Dave has his own page: ${c.a('~dave', 'go and tell him it was not a draw')}.)</div>
<h3 class="c">HOW TO MAKE YOUR OWN</h3><p class="c">1 wrapping paper tube (the long kind, from Christmas) + poster paint + a torch stuck in the end (optional, falls out) + a mate + a garden + a Mom who is OK with "fwap" noises for an hour.</p>
<p class="c">Padawans who've watched: ${c.counter('odo')}</p>
${c.gb([['Dave', c.daysAgo(1), 'IT WAS A DRAW', 1], ['{kidEp1}', c.daysAgo(1), 'the high ground thing is correct. {kidEp1} has spoken.', 5], ['{cousin}', c.daysAgo(3), 'u r both idiots. photo 4 is the best photo on the whole internet', 5]], { title: 'The Duel Guestbook', ph: 'Who won? (Not Dave.)' })}
<p class="c small">${c.a('~sam', "{kidEp1}'s countdown")} &middot; ${c.a('~dave', "Dave's wrestling page")} &middot; ${c.a('brickwars', 'the duel, in bricks')}</p>
${c.ring()}`,
    setup(el, c) {
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), cap = el.querySelector('.sd-cap'), n = el.querySelector('.sd-n'); let i = 0; const seen = new Set();
      const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(Math.round(x), Math.round(y), w, h); };
      // a kid with a glowing tube: feet at (x, y), facing right unless flip
      const man = (x, y, flip, col, pose, hair, shirt) => {
        const d = flip ? -1 : 1;
        R(x - 5, y - 2, 5, 2, '#fff'); R(x + 1, y - 2, 5, 2, '#fff'); // trainers
        R(x - 4, y - 12, 4, 10, '#2a3a6a'); R(x + 1, y - 12, 4, 10, '#2a3a6a'); R(x + 1, y - 12, 1, 10, '#1a2448'); // jeans
        R(x - 5, y - 24, 11, 13, shirt); R(x + 3, y - 24, 3, 13, 'rgba(0,0,0,.2)'); // t-shirt
        g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(x + .5, y - 29, 5, 0, 7); g.fill(); R(x + 2, y - 31, 3, 6, '#d8a880'); // head
        g.fillStyle = hair; g.beginPath(); g.arc(x + .5, y - 31, 5.2, Math.PI, 0); g.fill(); R(x - 4.5 + (d < 0 ? 7 : 0), y - 31, 2, 3, hair);
        R(x + d * 2 + (d < 0 ? -1 : 0), y - 29, 1, 2, '#000'); R(x + d * 2 + (d < 0 ? -1 : 0) - d * 3, y - 29, 1, 2, '#000'); R(x + d * 1, y - 26, 3, 1, '#a04030');
        // arms + tube
        const hx = x + d * 7, hy = pose === 'up' ? y - 34 : y - 19;
        g.strokeStyle = '#f0c8a0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + d * 3, y - 22); g.lineTo(hx, hy); g.stroke();
        let tx = hx + d * 26, ty = hy - 14; if (pose === 'up') { tx = hx + d * 2; ty = hy - 28; } else if (pose === 'spin') { tx = hx - d * 26; ty = hy + 2; } else if (pose === 'clash') { tx = hx + d * 24; ty = hy - 8; }
        g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 8; g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();
        g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx + (tx - hx) * .15, hy + (ty - hy) * .15); g.lineTo(tx, ty); g.stroke(); g.lineCap = 'butt';
        R(hx - 1.5, hy - 1.5, 4, 4, '#f0c8a0');
      };
      const draw = () => {
        const s = SHOTS[i], k = s[2];
        const sky = g.createLinearGradient(0, 0, 0, 60); sky.addColorStop(0, '#5aa8f0'); sky.addColorStop(1, '#cfe8ff'); g.fillStyle = sky; g.fillRect(0, 0, 160, 66);
        g.fillStyle = '#fff'; [[20, 12, 12], [32, 10, 9], [96, 16, 14], [110, 14, 8]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * .55, 0, 0, 7); g.fill(); });
        for (let x = 0; x < 160; x += 9) { R(x, 44, 8, 24, x % 18 ? '#9a6a3a' : '#8a5a2a'); R(x, 44, 8, 2, '#b88a5a'); R(x + 7, 44, 1, 24, '#5a3a1a'); }
        R(118, 30, 42, 38, '#7a5030'); for (let x = 120; x < 160; x += 6) R(x, 32, 1, 36, '#5a3a20'); R(114, 26, 46, 6, '#3a2a2a'); R(116, 24, 44, 3, '#4a3a3a'); R(124, 44, 12, 24, '#5a3a20'); R(133, 55, 2, 2, '#d8c040'); R(142, 36, 12, 9, '#a8d8ff'); R(147, 36, 1, 9, '#5a3a20'); R(142, 40, 12, 1, '#5a3a20');
        for (let y = 66; y < 100; y += 6) R(0, y, 160, 6, (y / 6) & 1 ? '#4a9a32' : '#3e8a2a');
        R(0, 66, 160, 2, '#2e6a1e'); [[8, 70, '#ff4a6a'], [14, 72, '#ffd400'], [100, 70, '#ff8ad0'], [106, 71, '#fff']].forEach(([x, y, c2]) => { R(x, y, 3, 3, c2); R(x + 1, y + 3, 1, 3, '#2a6a1a'); });
        if (k === 3 || k === 5) { R(4, 22, 2, 46, '#888'); R(150, 22, 2, 20, '#888'); g.strokeStyle = '#eee'; g.lineWidth = 1; g.beginPath(); g.moveTo(5, 24); g.quadraticCurveTo(70, 34, 151, 24); g.stroke(); R(30, 28, 12, 16, '#fff'); R(30, 28, 12, 2, '#ddd'); R(62, 30, 10, 12, '#f8a0c0'); R(60, 30, 14, 4, '#f8a0c0'); R(90, 29, 9, 14, '#80c0ff'); }
        if (k === 4 || k === 5) { R(16, 66, 40, 4, '#a07040'); R(16, 66, 40, 1, '#c89060'); R(19, 70, 4, 10, '#6a4a2a'); R(49, 70, 4, 10, '#6a4a2a'); }
        const me = { x: k === 4 || k === 5 ? 34 : 48, y: k === 4 || k === 5 ? 66 : 90, pose: k === 4 ? 'up' : k === 2 ? 'clash' : 'idle' };
        const dv = { x: k === 0 ? 112 : 92, y: 90, pose: k === 3 ? 'spin' : k === 2 ? 'clash' : 'idle' };
        if (k === 2) { me.x = 62; dv.x = 98; }
        man(me.x, me.y, false, '#5aff5a', me.pose, '#5a3410', '#2a5ad8'); man(dv.x, dv.y, true, '#ff4a3a', dv.pose, '#e0a040', '#d83a2a');
        if (k === 2) { g.fillStyle = '#fff'; g.font = 'bold 9px Arial'; g.fillText('FWAP!', 70, 44); }
        if (k === 5) { R(120, 46, 22, 12, '#fff'); g.fillStyle = '#000'; g.font = 'bold 8px Arial'; g.fillText('TEA!', 122, 55); }
        const id = g.getImageData(0, 0, 160, 100); for (let p = 0; p < id.data.length; p += 4) { const n = (Math.random() - .5) * 14, q = (v, m) => Math.max(0, Math.min(255, v + n)) & m; id.data[p] = q(id.data[p], 0xf8); id.data[p + 1] = q(id.data[p + 1], 0xf8); id.data[p + 2] = q(id.data[p + 2], 0xf0); } g.putImageData(id, 0, 0);
        g.fillStyle = '#ff9a20'; g.font = 'bold 8px "Courier New", monospace'; g.fillText(c.daysAgo(20 - i).slice(0, 5).replace('/', ' ') + ' 99', 108, 95);
        cap.innerHTML = `<b>${esc(s[0])}</b><br>${esc(s[1])}`; n.textContent = (i + 1) + ' of ' + SHOTS.length; seen.add(i); if (seen.size === SHOTS.length) c.secret('web.saber');
      };
      draw();
      el.querySelector('.sd-prev').addEventListener('click', () => { i = (i + SHOTS.length - 1) % SHOTS.length; draw(); Sound.play('turn'); });
      el.querySelector('.sd-next').addEventListener('click', () => { i = (i + 1) % SHOTS.length; draw(); Sound.play('turn'); });
    },
  });
})();

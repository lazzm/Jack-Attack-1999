/* web-p1: the 1999 Web, part 1. Homepages of Jack's mates and family. Loaded on first visit by apps-web.js. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile;
  // the people are this visitor's own cast (js/cast.js): every page's text, guestbook seeds and guestbook options go through
  // Cast.t, so {cousin}, {cousin.he}, {cousin?boy|girl} ... come out with this visitor's names and the right he/she
  const def = (w, o) => { const h = o.html; if (h) o.html = c => { const gb = c.gb; c.gb = (seed, opt) => gb(Cast.deep(seed), Cast.deep(opt)); try { return Cast.t(h(c)); } finally { c.gb = gb; } }; return W.def(w, o); };

  // ---------------------------------------------------------------- ~dave: Bedroom Championship Wrestling
  def('~dave', {
    css: `.wp-u-dave{background:#111 ${tile('<path d="M0 8L8 0L16 8L8 16Z" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>', 16)};color:#eee;font-family:Arial,sans-serif}
.wp-u-dave .dv-top{text-align:center;padding:14px 6px 18px;background:linear-gradient(0deg,#300 0,#a00 35%,#f60 70%,#fd0 92%,#fff0 100%);border-bottom:4px solid #fd0;margin:-18px -18px 14px}
.wp-u-dave h1{font:44px/1 Impact,"Arial Black",sans-serif;margin:8px 0 2px;letter-spacing:1px;color:#fff;-webkit-text-stroke:2px #000;text-shadow:3px 3px 0 #000,0 0 18px #ff0}
.wp-u-dave .dv-sub{font:bold 16px Impact,sans-serif;color:#ff0;letter-spacing:3px;text-shadow:2px 2px #000}
.wp-u-dave .dv-old{background:#ff0;color:#000;font-weight:bold;padding:6px;border:3px dashed #f00;text-align:center;margin:0 0 12px}
.wp-u-dave h2{font:28px Impact,sans-serif;color:#fd0;text-shadow:2px 2px #a00;margin:18px 0 6px;letter-spacing:1px}
.wp-u-dave table{width:100%;background:#000;border:3px solid #888}
.wp-u-dave td,.wp-u-dave th{border:1px solid #555;padding:5px 6px;vertical-align:top}
.wp-u-dave th{background:#a00;color:#fff;font:16px Impact,sans-serif;letter-spacing:1px}
.wp-u-dave .vs{color:#f60;font:bold 18px Impact,sans-serif}
.wp-u-dave .dv-roster{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.wp-u-dave .dv-card{background:linear-gradient(#333,#111);border:2px solid #fd0;padding:8px;font-size:13px}
.wp-u-dave .dv-card b{display:block;color:#ff0;font:19px Impact,sans-serif}
.wp-u-dave .dv-belt{display:block;margin:6px auto;width:300px}
.wp-u-dave .dv-ring{background:#2a4a8a;border:6px solid #ddd;outline:4px solid #a00;padding:14px;text-align:center;margin:10px auto;max-width:440px}
.wp-u-dave .dv-ref{font:bold 64px/1 Impact,sans-serif;color:#fff;min-height:68px;text-shadow:3px 3px #000}
.wp-u-dave .dv-msg{min-height:20px;font-weight:bold;color:#ff0}
.wp-u-dave .btn.big{font-size:16px;padding:6px 18px;margin:4px}
.wp-u-dave .dv-warn{border:2px solid #f00;background:#200;padding:8px;color:#faa;font-size:12px;margin:10px 0}
.wp-u-dave a{color:#6cf}.wp-u-dave a:visited{color:#c9f}
.wp-u-dave .wgb{background:#222;color:#eee;border-color:#fd0}.wp-u-dave .wgb-head{background:#a00}.wp-u-dave .wgbe-h b{color:#fd0}.wp-u-dave .wgbe-d{color:#aaa}
@media (max-width:600px){.wp-u-dave .dv-top{margin:-12px -10px 12px}.wp-u-dave h1{font-size:32px!important}}`,
    html: c => `<div class="dv-top"><div class="dv-sub">&#9733; LIVE FROM DAVE'S BEDROOM &#9733;</div><h1>BEDROOM<br>CHAMPIONSHIP<br>WRESTLING</h1><div class="dv-sub">DAVE'S KOOL PAGE 2: TOTAL CARNAGE</div></div>
<div class="dv-old">MY OLD PAGE (${c.a('dave', c.url('dave'))}) IS DEAD!!! THIS IS MY NEW ONE. IT HAS WRESTLING IN IT.</div>
<p class="c"><marquee scrollamount="6">*** TONIGHT: THE DUVET vs MR TIDDLES *** FOR THE BCW TITLE *** NO CATS WILL BE HARMED (THE CAT IS THE CHAMPION) *** TICKETS 10p (CASH ONLY, PAY DAVE) ***</marquee></p>
<p>Welcome to BCW, the most extreme wrestling federation in our whole street. All matches take place on my bed, which is the ring, and the beanbag, which is the crowd. We have been going since half term. There have been 31 matches and only one broken lamp.</p>
<div class="dv-warn"><b>WARNING:</b> Do NOT try this at home. I did try it at home. Mom said "David, if I hear one more thump" and then there was one more thump. All moves are done onto pillows. Safety first. Then carnage.</div>
<h2>TONIGHT'S FIGHT CARD</h2>
<table><tr><th>Match</th><th>Who</th><th>Stipulation</th></tr>
<tr><td>1</td><td>CAPTAIN BEANBAG <span class="vs">vs</span> THE BIG WARDROBE</td><td>Last one to fall off the bed loses</td></tr>
<tr><td>2</td><td>LITTLE GRANDAD SLAM <span class="vs">vs</span> A VERY LARGE TEDDY</td><td>Hardcore rules (cushions allowed)</td></tr>
<tr><td>3</td><td>BISCUIT THE DOG <span class="vs">vs</span> THE POSTMAN</td><td>Cancelled (the postman refused)</td></tr>
<tr><td><b>MAIN EVENT</b></td><td><b>THE DUVET</b> (me) <span class="vs">vs</span> <b>MR TIDDLES</b> (c)</td><td>For the BCW Heavyweight Championship. Two falls, or until Mr Tiddles walks off.</td></tr></table>
<h2>THE BELT</h2>
<svg class="dv-belt" viewBox="0 0 300 110" aria-label="The BCW championship belt"><rect x="0" y="38" width="300" height="34" rx="8" fill="#222" stroke="#000"/><rect x="0" y="44" width="300" height="22" fill="#3a2a12"/><g fill="#d4a200" stroke="#5a3a00"><ellipse cx="150" cy="55" rx="62" ry="50"/><rect x="58" y="34" width="34" height="42" rx="6"/><rect x="208" y="34" width="34" height="42" rx="6"/></g><ellipse cx="150" cy="55" rx="48" ry="38" fill="#ffe36b" stroke="#a07000"/><text x="150" y="52" text-anchor="middle" font-family="Impact,sans-serif" font-size="22" fill="#a00">BCW</text><text x="150" y="72" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="9" fill="#5a3a00">WORLD CHAMPION</text><circle cx="75" cy="55" r="7" fill="#e10600"/><circle cx="225" cy="55" r="7" fill="#0028c8"/></svg>
<p class="c small">The belt is made of a cereal box, kitchen foil and two bottle tops. It is the most valuable thing I own. Current holder: <b>MR TIDDLES</b> (since he sat on it).</p>
<h2>THE ROSTER</h2>
<div class="dv-roster">
<div class="dv-card"><b>THE DUVET</b>Real name: Dave. Height: tall for my age. Finisher: <i>The Big Snuggle</i> (you get wrapped up and can't move). Catchphrase: "IT'S NAP TIME!"</div>
<div class="dv-card"><b>MR TIDDLES</b>"The Furry Fury". Ginger. Weight: a lot (he eats the dog's food). Finisher: <i>The Lie Down</i>. Record: 31 wins, 0 losses. Has never once tried.</div>
<div class="dv-card"><b>CAPTAIN BEANBAG</b>Is a beanbag. Sponsored by gravity. Very hard to pin because he goes all floppy.</div>
<div class="dv-card"><b>THE BIG WARDROBE</b>Cannot be moved. Has never left the corner. Our scariest wrestler.</div>
<div class="dv-card"><b>LITTLE GRANDAD SLAM</b>It's my grandad. He does commentary from the landing and says "in my day" a lot.</div>
<div class="dv-card"><b>SPECIAL GUEST REFEREE</b>Jack. He keeps saying the cat should be disqualified for "being a cat". Biased.</div></div>
<h2>MR TIDDLES FACT FILE</h2>
<ul><li>Favourite move: walking across the keyboard while I'm typing my page. (That's why it says "bbbbbbbbbbbbbbbb" sometimes.)</li><li>Favourite food: whatever is on your plate.</li><li>Arch enemy: ${c.a('~biscuit', 'Biscuit (the dog)')}. They are in a FEUD. It's been going on since 1997.</li><li>Has his own entrance music. Press play below. He doesn't come in, though. He's a cat.</li></ul>
<p class="c">${c.midi('web-dave', 'dave_entrance.mid')}</p>
<h2>PLAY: PIN THE CHAMPION!</h2>
<div class="dv-ring"><p>You are THE DUVET. You've got Mr Tiddles down. Press <b>HOLD!</b> lots, fast, while the ref counts, or he'll kick out!</p><div class="dv-ref" aria-live="polite">&nbsp;</div><div class="dv-msg"></div><button class="btn big dv-pin" type="button">PIN HIM!</button><button class="btn big dv-hold" type="button" disabled>HOLD!</button></div>
${c.gb([["Dave's Mom", c.daysAgo(3), 'David I can hear you thumping from the kitchen. Tea is ready.', 0], ['Jack', c.daysAgo(5), 'the cat is not "the champion", the cat is asleep. good page though. better than the old one', 4], ['{cousin}', c.daysAgo(9), '{cousin?wrestling a cat is so weird. the belt is nice|boys are so weird. the belt is nice}', 3], ['Little Grandad Slam', c.daysAgo(12), 'IN MY DAY WE HAD PROPER WRESTLING ON A SATURDAY AFTERNOON.', 5]], { title: 'SIGN THE GUESTBOOK OR FACE THE DUVET', ph: 'Who is your favourite BCW wrestler?' })}
<p class="c">BCW fans counted so far: ${c.counter('led')}</p>
<p class="c small">Other pages: ${c.a('~biscuit', "Biscuit's page (he's in a feud)")} &middot; ${c.a('saberduel', 'my lightspatula duel with Jack')} &middot; ${c.a('dave', 'my OLD page')}</p>
${c.ring()}`,
    setup(el, c) {
      const ref = el.querySelector('.dv-ref'), msg = el.querySelector('.dv-msg'), pin = el.querySelector('.dv-pin'), hold = el.querySelector('.dv-hold');
      let presses = 0, count = 0, t = null;
      const end = (won) => { clearInterval(t); t = null; hold.disabled = true; pin.disabled = false;
        if (won) { ref.textContent = '3!!!'; msg.textContent = 'DING DING DING! THE DUVET IS THE NEW CHAMPION!!! (Mr Tiddles has gone to sleep.)'; Sound.play('solve'); c.secret('web.pin'); }
        else { msg.textContent = 'KICK OUT!!! Mr Tiddles has escaped and is now eating the belt.'; Sound.play('uhoh'); } };
      pin.addEventListener('click', () => {
        pin.disabled = true; hold.disabled = false; presses = 0; count = 0; ref.textContent = '...'; msg.textContent = 'The ref slides in...'; Sound.play('thud');
        t = setInterval(() => {
          if (!el.isConnected) return clearInterval(t);
          if (count > 0 && presses < 5) return end(false);
          presses = 0; count++; ref.textContent = count + '!'; Sound.play('thud');
          if (count >= 3) end(true); else msg.textContent = 'HOLD HIM DOWN!!!';
        }, 1100);
      });
      hold.addEventListener('click', () => { presses++; Sound.play('click'); });
      return () => clearInterval(t);
    },
  });

  // ---------------------------------------------------------------- ~kim: Jack's cousin's pop page (the cousin is cast: any name, either gender)
  def('~kim', {
    css: `.wp-u-kim{background:#ffc0e0 ${tile('<path d="M8 3l1.5 3.5L13 7l-2.6 2.4.7 3.6L8 11.3 4.9 13l.7-3.6L3 7l3.5-.5z" fill="#fff" opacity=".8"/><path d="M26 24c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill="#ff7ac0"/>', 34)};color:#60008a;font-family:"Comic Sans MS","Comic Sans",cursive}
.wp-u-kim h1{font:bold 38px "Comic Sans MS",cursive;text-align:center;margin:4px 0;background:linear-gradient(90deg,#f0f,#00f,#0cf,#f0f,#f60,#f0f);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:kimglit 3s linear infinite}
@keyframes kimglit{to{background-position:300% 0}}
.wp-u-kim .km-box{background:#fff8fc;border:4px dotted #ff3ca0;border-radius:18px;padding:10px 14px;margin:12px 0}
.wp-u-kim h3{color:#ff1493;font:bold 20px "Comic Sans MS",cursive;margin:2px 0 6px}
.wp-u-kim .km-cols{display:flex;gap:12px;flex-wrap:wrap}.wp-u-kim .km-cols>*{flex:1 1 230px}
.wp-u-kim table{width:100%;font-size:13px}.wp-u-kim td{padding:3px 4px;border-bottom:1px dashed #f9c}
.wp-u-kim .up{color:#0a0;font-weight:bold}.wp-u-kim .dn{color:#d00;font-weight:bold}.wp-u-kim .nw{color:#fff;background:#f0f;font-size:10px;padding:0 3px;font-weight:bold}
.wp-u-kim .km-poster{display:inline-block;width:150px;height:96px;margin:4px;border:3px solid #fff;box-shadow:2px 2px 0 #f6a;vertical-align:top;text-align:center;font:bold 13px Arial,sans-serif;color:#fff;padding-top:8px;box-sizing:border-box;text-shadow:1px 1px 0 #000}
.wp-u-kim .km-poster small{display:block;font-weight:normal;font-size:10px;margin-top:4px}
.wp-u-kim .km-secret{color:#ffc0e0;font-size:11px;text-align:center}
.wp-u-kim .km-spark{position:absolute;pointer-events:none;color:#fff;font-size:14px;text-shadow:0 0 4px #f0f;animation:kimsp .9s forwards;z-index:5}
@keyframes kimsp{to{transform:translateY(18px) scale(.2);opacity:0}}
.wp-u-kim .wgb{background:#fff0f8;border-color:#f6a}.wp-u-kim .wgb-head{background:#ff1493}
.wp-u-kim a{color:#c0f}.wp-u-kim .wctr-flip i{background:linear-gradient(#f6a 49%,#c06 50%)}`,
    html: c => `<h1>*~* {cousin}'s PoP PaRaDiSe *~*</h1>
<p class="c"><marquee scrollamount="5" behavior="alternate">&hearts; welcome 2 my page!!! &hearts; sign my slambook &hearts; no brothers allowed (except Jack because he made the page work) &hearts;</marquee></p>
<div class="km-cols"><div class="km-box"><h3>&hearts; ABOUT ME &hearts;</h3><p>Hiya!!! I'm {cousin} and I am Jack's cousin. I like pop music, dancing in my room, glitter gel pens and my hamster ({cousinpet.he}'s called {cousinpet}, {cousinpet.he}'s not on the Internet like {hamster} is). I do NOT like maths, cabbage or my brother's football socks.</p><p>My favourite colours are pink, purple, and glitter. Glitter IS a colour, Jack.</p></div>
<div class="km-box"><h3>&#9733; {cousin.NAME}'S TOP 10 &#9733;</h3><p class="small">My own chart! I do it every Sunday with my tape recorder.</p><table>
${[['up', 'Glitterbomb', 'Sparkle Heart'], ['nw', 'The Heartbeat Boys', 'Say It With A Text Message'], ['dn', 'Lemon Sherbet', 'Fizzy (In My Tummy)'], ['up', 'DJ Fluffy', 'Bounce Bounce Bounce (Radio Edit)'], ['dn', 'Sugar Rush', 'Rollerdisco Love'], ['up', 'The Heartbeat Boys', 'Stool Key Change'], ['nw', 'Kandi K', 'Moonwalk To The Moon'], ['dn', 'Glitterbomb', 'Best Friends 4 Ever'], ['up', 'Boyz On Bikes', 'BMX Romance'], ['dn', 'Lemon Sherbet', 'Christmas Is Coming (Early)']].map((r, i) => `<tr><td><b>${i + 1}</b></td><td>${r[0] === 'up' ? '<span class="up">&#9650;</span>' : r[0] === 'dn' ? '<span class="dn">&#9660;</span>' : '<span class="nw">NEW</span>'}</td><td><b>${r[1]}</b><br>${r[2]}</td></tr>`).join('')}</table></div></div>
<div class="km-box c"><h3>&hearts; MY POSTERS &hearts;</h3><p class="small">(I drew these myself. You're not allowed to copy band photos onto the Internet, Jack says.)</p>
<span class="km-poster" style="background:linear-gradient(135deg,#f0f,#60f)">GLITTERBOMB<small>5 girls, 1 dance routine,<br>infinity sparkles</small></span><span class="km-poster" style="background:linear-gradient(135deg,#09f,#0cf)">THE HEARTBEAT BOYS<small>{cousin?The one on the left has MY haircut|The one on the left is MINE}</small></span><span class="km-poster" style="background:linear-gradient(135deg,#fc0,#f60)">LEMON SHERBET<small>They sang on Saturday<br>morning telly!!!</small></span></div>
<div class="km-cols"><div class="km-box"><h3>&#9835; WHY THE HEARTBEAT BOYS ARE THE BEST</h3><ol><li>They do the stand-up-off-the-stools bit at the key change.</li><li>They wear matching white outfits.</li><li>One of them waved at the camera and I think it was at me.</li><li>Dave says they're "rubbish". Dave likes wrestling with a cat. Dave's opinion doesn't count.</li></ol></div>
<div class="km-box"><h3>&#9997; SLAMBOOK QUESTIONS</h3><p>Answer these in my guestbook!!!</p><ul><li>Fave band?</li><li>Fave colour?</li><li>Best dance move?</li><li>Who is your fave Heartbeat Boy?</li><li>Do you have a hamster??</li></ul><p class="small">Pen pals: write to me at ${c.mail(Cast.slug('cousin'))}!! (Mom checks it first.)</p></div></div>
<p class="c">${c.midi('web-kim', 'popparadise.mid')} <span class="small">(my own song I made up!!! it's going to be a hit)</span></p>
${c.gb([['Jack', c.daysAgo(2), 'the glitter background makes my eyes go funny. nice page though', 3], ['{cousin}', c.daysAgo(2), 'GLITTER IS A COLOUR JACK', 5], ['{cousinpet} (my hamster)', c.daysAgo(6), 'squeak', 5], ['{auntie}', c.daysAgo(11), 'Lovely page, {cousin.first} love. Have you done your homework? Love Mom xx', 4]], { title: '&hearts; Sign my SLAMBOOK!!! &hearts;', ph: 'Fave band? Fave colour? Best dance move?' })}
<p class="km-secret">psst... secret club meets at ${c.url('clubhouse')}. jack doesn't know i know. the password is in the band's song list (the first letters!!)</p>
<p class="c">You are visitor ${c.counter('flip')} to my page!!! &hearts;</p>
<p class="c small">My friends: ${c.a('~dave', 'Dave (ugh)')} &middot; ${c.a('knitting', "Auntie's knitting club")} &middot; ${c.a('~stu', "{kidBand}'s band (they're awful)")} &middot; ${c.a('hamstercam', '{hamster} the hamster')}</p>
${c.ring()}`,
    setup(el, c) {
      let last = 0, live = 0;
      const spark = ev => { // a sparkle trail that follows the mouse, very 1999
        const now = performance.now(); if (now - last < 40 || live > 24) return; last = now;
        const r = el.getBoundingClientRect(), s = document.createElement('span'); s.className = 'km-spark'; s.textContent = W.pick(['\u2726', '\u2727', '\u2605', '*']);
        s.style.left = (ev.clientX - r.left + W.ri(-6, 6)) + 'px'; s.style.top = (ev.clientY - r.top + W.ri(-6, 6)) + 'px';
        el.appendChild(s); live++; setTimeout(() => { s.remove(); live--; }, 900);
      };
      el.addEventListener('pointermove', spark);
      const sec = () => { const s = String(window.getSelection() || ''); if (/secret club meets/.test(s)) c.secret('web.whitetext'); };
      document.addEventListener('selectionchange', sec);
      return () => document.removeEventListener('selectionchange', sec);
    },
  });

  // ---------------------------------------------------------------- knitting: Mom's knitting club
  def('knitting', {
    css: `.wp-knitting{background:#fbf6e9 ${tile('<g transform="translate(14 14)"><circle r="2.2" fill="#e8a"/><circle cx="4" r="2.2" fill="#fcd"/><circle cx="-4" r="2.2" fill="#fcd"/><circle cy="4" r="2.2" fill="#fcd"/><circle cy="-4" r="2.2" fill="#fcd"/></g><path d="M38 40q4-6 8 0" stroke="#9c9" fill="none"/>', 56)};font:15px/1.5 Georgia,"Times New Roman",serif;color:#432}
.wp-knitting .kn-wrap{max-width:620px;margin:0 auto;background:#fffdf6;border:6px double #b48ab4;padding:14px 18px}
.wp-knitting h1{font:italic bold 32px Georgia,serif;color:#7a3a7a;text-align:center;margin:4px 0}
.wp-knitting h2{font:bold 19px Georgia,serif;color:#7a3a7a;border-bottom:2px dotted #b48ab4;margin:18px 0 6px}
.wp-knitting .kn-yarn{display:block;margin:0 auto;width:110px}
.wp-knitting .kn-jack{font:12px "Courier New",monospace;background:#eef;border-left:4px solid #00a;padding:4px 8px;margin:6px 0;color:#003}
.wp-knitting .kn-caps{font:bold 14px Arial,sans-serif;letter-spacing:.5px}
.wp-knitting table{width:100%;font-size:14px}.wp-knitting td{border:1px solid #d8c0d8;padding:4px 6px;vertical-align:top}
.wp-knitting .kn-rc{display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;background:#f3e6f3;padding:8px;border:1px solid #b48ab4}
.wp-knitting .kn-rcn{font:bold 30px Georgia,serif;color:#7a3a7a;min-width:60px;text-align:center}
.wp-knitting .wgb{background:#fffaf0;border-color:#b48ab4}.wp-knitting .wgb-head{background:#7a3a7a;font-family:Georgia,serif}
.wp-knitting a{color:#7a3a7a}`,
    html: c => `<div class="kn-wrap">
<svg class="kn-yarn" viewBox="0 0 110 80" aria-hidden="true"><circle cx="46" cy="44" r="30" fill="#c86ac8" stroke="#7a3a7a" stroke-width="2"/><path d="M20 36q26-14 52 6M18 50q28-12 56 4M28 66q20-24 40-48M40 74q16-30 24-58" stroke="#e8a8e8" stroke-width="2" fill="none"/><path d="M70 60q20 10 36-6" stroke="#c86ac8" stroke-width="2" fill="none"/><path d="M60 8l40 56M74 4l24 64" stroke="#b08040" stroke-width="3"/><circle cx="60" cy="8" r="3" fill="#7a3a7a"/><circle cx="74" cy="4" r="3" fill="#7a3a7a"/></svg>
<h1>The Tuesday Knit &amp; Natter Club</h1>
<p class="c"><i>Knit one, purl one, put the kettle on.</i></p>
<div class="kn-jack">NOTE FROM JACK: I made this page for Mom. She typed all the words herself. Please be patient with the capital letters bit.</div>
<h2>Welcome!</h2>
<p>Hello and welcome to our club's page on the World Wide Web! We are a friendly group of knitters who meet every Tuesday evening at 7 o'clock in the community hall for knitting, a natter and a cup of tea (and a biscuit, if Brenda remembers). All abilities welcome. Beginners will be shown how to cast on by Pat, who has been knitting since 1951 and does not suffer fools.</p>
<p class="kn-caps">I HAVE DONE THE CAPITALS BY MISTAKE AGAIN. JACK HOW DO I TURN THEM OFF</p>
<div class="kn-jack">JACK: Mom, it's the Caps Lock key. On the left. With the little light.</div>
<p>Thank you love.</p>
<h2>Our Members</h2>
<table><tr><td><b>Pat</b></td><td>Founder. Knits faster than a computer. Thinks the Internet is "a fad".</td></tr><tr><td><b>Brenda</b></td><td>In charge of biscuits. Sometimes remembers.</td></tr><tr><td><b>{auntie.first}</b></td><td>My sister. Her {cousin.kid} {cousin} has a ${c.a('~kim', 'very sparkly web page')}.</td></tr><tr><td><b>Me</b></td><td>Jack's Mom. Webmistress (Jack says that's what I am now).</td></tr><tr><td><b>Margaret</b></td><td>Only comes for the natter. Has been knitting the same scarf since 1994. It is 11 feet long.</td></tr></table>
<h2>Pattern of the Month: The Monitor Cosy</h2>
<p>Keep the dust off your computer when you are not using it! Simple stocking stitch in any colour. Cast on enough stitches to go round the back of your monitor, knit until it reaches the front, then add a little flap for the screen. Jack says I mustn't cover the air holes or it will "overheat and die". So leave the air holes. I have put a pom-pom on top.</p>
<div class="kn-jack">JACK: Please don't put a pom-pom on my monitor.</div>
<h2>Other Patterns</h2><ul><li>Mouse mitten (for cold mornings)</li><li>Floppy disk wallet (holds 6 disks)</li><li>Egg cosy shaped like a hen</li><li>Tea cosy shaped like a bigger hen</li><li>Christmas jumper with a reindeer (the reindeer looks a bit surprised)</li></ul>
<h2>Row Counter</h2><p>Jack made me this! Click the button every time you finish a row and the computer remembers. Much better than the pencil marks on the back of my hand.</p>
<div class="kn-rc"><button class="btn kn-dn" type="button">-</button><span class="kn-rcn">0</span><button class="btn kn-up" type="button">+ Row done</button><button class="btn kn-0" type="button">Start again</button></div>
<h2>This Month's Raffle</h2><p>1st prize: a hand-knitted hot water bottle cover. 2nd prize: a tin of travel sweets. 3rd prize: Margaret's scarf (if she ever finishes it). Tickets 20p each from Brenda.</p>
<p class="c">${c.midi('web-knit', 'knit_and_natter_waltz.mid')}</p>
<p class="small c">Jack put some music on. I don't know how to turn it off. You press the square, apparently.</p>
${c.gb([['Pat', c.daysAgo(4), 'I still say the Internet is a fad. Nice pattern though. You have dropped a stitch in the hen.', 4], ['Brenda', c.daysAgo(6), 'SORRY ABOUT THE BISCUITS. WILL BRING TWO PACKETS NEXT WEEK', 5], ['Jack', c.daysAgo(8), 'well done Mom! you made a website! (with a bit of help)', 5]], { title: 'Our Visitors\' Book', ph: 'Leave us a message! (Pat reads them all on Tuesday)', btn: 'Sign the book' })}
<p class="c">You are the ${c.counter('words')} visitor to our page. How lovely!</p>
<p class="c small">Visit: ${c.a('~nan', "Nan's recipes")} &middot; ${c.a('weather', 'the weather (for drying)')} &middot; ${c.go('home', "my son's website")}</p>
${c.ring()}</div>`,
    setup(el) {
      const n = el.querySelector('.kn-rcn'); let rows = W.ri(0, 0); try { rows = +localStorage.getItem('jhp_web_rows') || 0; } catch (e) {}
      const set = v => { rows = Math.max(0, v); n.textContent = rows; try { localStorage.setItem('jhp_web_rows', rows); } catch (e) {} };
      set(rows);
      el.querySelector('.kn-up').addEventListener('click', () => { set(rows + 1); Sound.play('click'); if (rows === 100) Desk.toast('Row Counter', '100 rows! That\'s nearly as long as Margaret\'s scarf.'); });
      el.querySelector('.kn-dn').addEventListener('click', () => set(rows - 1));
      el.querySelector('.kn-0').addEventListener('click', () => set(0));
    },
  });

  // ---------------------------------------------------------------- poetree: Gubbinz's poetry corner
  const POEMS = [
    ['ODE TO A FLOPPY DISK', "O floppy disk, o floppy disk,\nyoo are not floppy. yoo are stiff and brisk.\nyoo hold one point four four MB.\nthat is nearly all of me."],
    ['RUPEES (a haiku)', "shiny gems in tin\none two free four five six. wait.\nwho took gem number"],
    ['THE PRINTER IS BIG', "the printer is big\nthe printer is beige\nit makes a noise\nlike a lion in a cage.\n\nthe printer is loud\nthe printer is mean\nit ate my best poem\nand printed it green."],
    ['WEN JACK TYPES', "clickety clack\nclickety clack\nJack is typin\nwith his back\nall hunched up\nlike a little sack.\n(dont tell Jack i rote this)"],
    ['SPRING', "in spring the flowers come up.\nin spring the cat comes out.\nthe cat sits on the flowers.\nthe end."],
    ['THE KOMPUTER', "the komputer says\n\"this program has performed an illegal operashun\"\ni NEVER\ni was only lookin\nat the big red button\nand then i pressed it\na bit"],
    ['NIGHT TIME (sad wun)', "the moon is out\nthe hamster is sleepin\njack is sleepin\ni am awake\nin the dark\ncountin roopeez\nso i dont get scared\n...\none\ntwo\nfree"],
  ];
  const PW = { a: ['floppy disk', 'roopeez', 'printer', 'mushroom', 'big red button', 'wellie', 'Dave', 'joystick', 'biscuit', 'Kevin (the rock)'], b: ['bounces', 'beeps', 'shouts YIPPEE', 'falls over', 'hides', 'goes boing', 'eats the curtains', 'sits there'], c: ['in the moonlite', 'on Jack\'s keyboard', 'all day long', 'behind the sofa', 'in the rain', 'with my mates', 'for no reason'] };
  def('poetree', {
    css: `.wp-poetree{background:#1e3a12 ${tile('<circle cx="6" cy="6" r="3" fill="#2c4f1a"/><circle cx="22" cy="18" r="4" fill="#284a16"/><path d="M14 28l2-5 2 5z" fill="#3a6a22"/>', 30)};color:#e8f0c0;font:15px/1.5 "Comic Sans MS",cursive}
.wp-poetree h1{font:bold 36px "Comic Sans MS",cursive;text-align:center;color:#b6ff00;text-shadow:3px 3px 0 #000;transform:rotate(-2deg);margin:4px 0}
.wp-poetree .pt-sub{text-align:center;color:#ff0}
.wp-poetree .pt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:14px}
.wp-poetree .pt-card{background:#f3e3b8;color:#3a2200;padding:12px 14px 10px;box-shadow:4px 4px 0 #000;clip-path:polygon(0 3%,8% 0,20% 2%,40% 0,62% 3%,80% 0,100% 2%,98% 30%,100% 60%,97% 100%,70% 97%,45% 100%,20% 97%,0 100%,2% 60%)}
.wp-poetree .pt-card:nth-child(odd){transform:rotate(-1.2deg)}.wp-poetree .pt-card:nth-child(even){transform:rotate(1deg)}
.wp-poetree .pt-card h3{margin:0 0 4px;color:#7a1a00;font:bold 16px "Comic Sans MS",cursive}
.wp-poetree pre{font:14px/1.4 "Comic Sans MS",cursive;white-space:pre-wrap;margin:0}
.wp-poetree .pt-clap{margin-top:6px;font-size:11px}
.wp-poetree .pt-mat{background:#000;border:3px solid #b6ff00;padding:12px;margin:16px auto;max-width:460px;text-align:center}
.wp-poetree .pt-out{font:bold 17px "Comic Sans MS",cursive;color:#b6ff00;min-height:80px;white-space:pre-line;margin:8px 0}
.wp-poetree a{color:#ff0}.wp-poetree .wgb{background:#f3e3b8;border-color:#7a1a00}.wp-poetree .wgb-head{background:#3a6a22}
.wp-poetree .wctr-tally{color:#ff0}`,
    html: c => `<h1>GUBBINZ PO-ETREE KORNER</h1>
<p class="pt-sub">poems by me, gubbinz. ritten with a crayon on Jack's komputer. (the crayon didnt work so i used the keyboard)</p>
<p class="c"><marquee scrollamount="3">~~~ po-etree is wen words go in lines and it makes yoo feel things ~~~ like hungry ~~~</marquee></p>
<div class="pt-grid">${POEMS.map(([t, p], i) => `<div class="pt-card"><h3>${esc(t)}</h3><pre>${esc(p)}</pre><div class="pt-clap"><button class="btn" type="button" data-clap="${i}">Clap</button> <span class="pt-cl"></span></div></div>`).join('')}</div>
<div class="pt-mat"><b>THE PO-EM-O-MATIK 2000</b><p class="small">i made a machine that makes poems. press the button. its basically me but faster.</p><div class="pt-out">(press the button)</div><button class="btn pt-go" type="button">MAKE A PO-EM</button></div>
<p class="c">my poems hav been red this many times (i counted with sticks): ${c.counter('tally')}</p>
${c.gb([['Little Green Kevin', c.daysAgo(3), 'the printer one made me cry. because it ate MY poem too', 5], ['Jack', c.daysAgo(5), 'Gubbinz how do you keep getting on the internet. also the night time one is actually quite nice', 4], ['Jack\'s Printer', c.daysAgo(9), 'PAPER JAM. PAPER JAM. WHO WROTE "THE PRINTER IS BIG". PAPER JAM.', 1]], { title: 'RITE IN MY BOOK', ph: 'rite sumfin nice about my poems', btn: 'RITE IT' })}
<p class="c small">also see: ${c.a('gubbinzhome', "my other 'omepage")} &middot; ${c.a('orktranslate', 'the silly translator')} &middot; ${c.a('crystalball', 'my crystal ball')}</p>
${c.ring()}`,
    setup(el) {
      el.querySelectorAll('[data-clap]').forEach(b => { let n = 0; b.addEventListener('click', () => { n++; b.nextElementSibling.textContent = n === 1 ? 'thank yoo!' : n < 5 ? 'thank yoo!'.repeat(1) + ' x' + n : 'OK STOP NOW. (but also dont stop)'; Sound.play('pet'); }); });
      const out = el.querySelector('.pt-out');
      el.querySelector('.pt-go').addEventListener('click', () => {
        const P = W.pick;
        out.textContent = `the ${P(PW.a)} ${P(PW.b)}\n${P(PW.c)}.\nthe ${P(PW.a)} ${P(PW.b)} too.\n${P(['YIPPEE.', 'the end.', 'that is all.', 'i think.', 'boing.'])}`;
        Sound.play('boing');
      });
    },
  });

  // ---------------------------------------------------------------- computerclub: school computer club, with a drawing turtle
  def('computerclub', {
    css: `.wp-computerclub{background:#d4d0c8 ${tile('<rect width="4" height="4" fill="#cdc9c0"/><rect x="4" y="4" width="4" height="4" fill="#cdc9c0"/>', 8)};font:13px/1.45 Arial,Helvetica,sans-serif}
.wp-computerclub .cc-frame{display:flex;gap:0;border:2px solid #333;background:#fff;max-width:760px;margin:0 auto}
.wp-computerclub .cc-nav{width:150px;flex:none;background:#003366;color:#fff;padding:10px 8px;font-size:12px}
.wp-computerclub .cc-nav a{color:#ffcc00;display:block;margin:4px 0}
.wp-computerclub .cc-nav .cc-logo{font:bold 22px "Courier New",monospace;color:#0f0;background:#000;text-align:center;padding:6px 0;margin-bottom:8px;border:2px inset #888}
.wp-computerclub .cc-main{flex:1;padding:10px 14px;min-width:0}
.wp-computerclub h1{font:bold 24px Arial,sans-serif;color:#003366;margin:0 0 4px}
.wp-computerclub h2{font:bold 15px Arial,sans-serif;background:#003366;color:#fff;padding:3px 6px;margin:14px 0 6px}
.wp-computerclub table{width:100%}.wp-computerclub td,.wp-computerclub th{border:1px solid #999;padding:3px 5px;text-align:left}.wp-computerclub th{background:#e0e8f0}
.wp-computerclub .cc-turtle{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start}
.wp-computerclub canvas{background:#000;border:3px inset #888;width:300px;height:220px;image-rendering:pixelated}
.wp-computerclub .cc-cmd{flex:1 1 200px;min-width:0}
.wp-computerclub .cc-cmd input{width:100%;font:13px "Courier New",monospace}
.wp-computerclub .cc-log{font:12px "Courier New",monospace;background:#000;color:#0f0;height:110px;overflow:auto;padding:4px;margin-top:4px;white-space:pre-wrap}
.wp-computerclub .cc-teacher{font-size:11px;color:#666;font-style:italic}
@media (max-width:600px){.wp-computerclub .cc-frame{flex-direction:column}.wp-computerclub .cc-nav{width:auto}.wp-computerclub .cc-nav a{display:inline-block;margin:2px 8px 2px 0}}`,
    html: c => `<div class="cc-frame"><div class="cc-nav"><div class="cc-logo">C:\\&gt;_</div><b>MENU</b>${c.a('computerclub', 'Home')}<a href="#cc-rules" data-cc="rules">Club Rules</a><a href="#cc-turtle" data-cc="turtle">Turtle Corner</a><a href="#cc-rota" data-cc="rota">Printer Rota</a>${c.a('~mike', "Mike's upgrade diary")}${c.a('ascii', 'ASCII art')}${c.a('search', 'JackSearch')}<br><span class="small">Room 14 has 8 computers. 6 of them work.</span></div>
<div class="cc-main"><h1>COMPUTER CLUB</h1><p><b>Thursdays, 3:30 to 4:30, Room 14.</b> All years welcome. Bring a floppy disk (3.5 inch, NOT the bendy big ones, we don't have that drive any more).</p>
<p>This web page was made by the members of Computer Club as our end-of-term project. It took 6 weeks. 4 of those weeks were arguing about the background colour.</p>
<h2 id="cc-rules">CLUB RULES</h2><ol><li>No games until the last 10 minutes. (Unless they are educational. Bugsweeper is not educational, Dave.)</li><li>Do not touch the server. We do not know what it does. It hums.</li><li>Save your work every 5 minutes. Then save it again on a floppy. Then write it down.</li><li>No eating near the keyboards. The keyboard on computer 3 still smells of crisps from 1998.</li><li>If the computer says "Not responding", do not hit it. Tell {teacher.sir}.</li><li>The Internet computer is for RESEARCH only. {teacher.Sir} can see what you are doing. ({teacher.He} can't, but {teacher.he} says {teacher.he} can.)</li></ol>
<h2 id="cc-turtle">TURTLE CORNER</h2><p>Draw with the turtle! Type commands and press Enter. Try <code>FD 50</code> (forward), <code>RT 90</code> (turn right), <code>LT 45</code>, <code>BK 20</code>, <code>PU</code>/<code>PD</code> (pen up/down), <code>CS</code> (clear screen), <code>SETC 2</code> (colour 0-7) and <code>REPEAT 4 [FD 50 RT 90]</code>.</p>
<div class="cc-turtle"><canvas width="300" height="220" aria-label="Turtle drawing area"></canvas><div class="cc-cmd"><form class="cc-f"><input type="text" placeholder="REPEAT 36 [FD 10 RT 10]" aria-label="Turtle command" autocomplete="off" spellcheck="false"></form><div class="cc-log">TURTLE READY.\n</div><p class="small">Try: <a href="#" data-try="REPEAT 5 [FD 80 RT 144]">a star</a> &middot; <a href="#" data-try="REPEAT 36 [FD 12 RT 10]">a circle</a> &middot; <a href="#" data-try="REPEAT 8 [REPEAT 4 [FD 40 RT 90] RT 45]">a flower</a></p></div></div>
<h2>MEMBERS</h2><table><tr><th>Handle</th><th>Best at</th></tr><tr><td>JackAttack</td><td>Web pages, Blockology, breaking things then fixing them</td></tr><tr><td>MegahertzMike</td><td>Knowing every computer part ever (see ${c.a('~mike', 'his diary')})</td></tr><tr><td>Davo</td><td>Turning the monitors upside down in the settings</td></tr><tr><td>Pixel{club4.first}</td><td>Paint. {club4.He} did the club logo in 16 colours.</td></tr><tr><td>{club2}</td><td>Space stuff. Made ${c.a('~ash', 'a space page')}.</td></tr><tr><td>{kidEp1}</td><td>Wears a dressing gown to club. Says it's a "robe". See ${c.a('~sam', '{kidEp1.his} page')}.</td></tr></table>
<h2 id="cc-rota">PRINTER ROTA</h2><p>The printer can only do one page every 2 minutes and it is VERY loud. Printing is for homework only. Do not print the whole ${c.a('ascii', 'ASCII art gallery')} again.</p><table><tr><th>Week</th><th>On paper duty</th><th>Notes</th></tr><tr><td>1</td><td>Mike</td><td>Paper jam (his fault)</td></tr><tr><td>2</td><td>{club4}</td><td>Ran out of cyan. Everything came out green.</td></tr><tr><td>3</td><td>Dave</td><td>Printed 40 copies of a wrestling poster. Banned from printing.</td></tr><tr><td>4</td><td>Jack</td><td>All fine. (Very boring week.)</td></tr></table>
<p class="c">Page hits since the start of term: ${c.counter('green')}</p>
${c.gb([['{teacher.Sir}', c.daysAgo(1), 'Very good, everyone. Please stop making the turtle draw rude shapes.', 4], ['MegahertzMike', c.daysAgo(3), 'can we get more RAM for computer 5 please, it has 8 MB, it takes 4 minutes to open Paint', 3]], { title: 'Suggestion Box', ph: 'Suggest something for next term!', btn: 'Post suggestion', rate: false })}
<p class="cc-teacher">Page last updated ${c.daysAgo(6)} by the Computer Club. Supervised by {teacher}. {teacher.He} doesn't know how to update it, so it's all us.</p>
${c.ring()}</div></div>`,
    setup(el, c) {
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), log = el.querySelector('.cc-log'), inp = el.querySelector('input');
      const COLS = ['#33ff33', '#ffffff', '#ff4040', '#ffd400', '#40a0ff', '#ff60ff', '#00ffff', '#ff9000'];
      let x, y, h, pen, col, segs;
      const reset = () => { x = 150; y = 110; h = -90; pen = true; col = 0; segs = []; g.fillStyle = '#000'; g.fillRect(0, 0, 300, 220); };
      const turtle = () => { g.save(); g.translate(x, y); g.rotate((h + 90) * Math.PI / 180); g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(0, -6); g.lineTo(4, 4); g.lineTo(-4, 4); g.closePath(); g.fill(); g.restore(); };
      let snap = null;
      const save = () => { snap = g.getImageData(0, 0, 300, 220); };
      const restore = () => { if (snap) g.putImageData(snap, 0, 0); };
      reset(); save(); turtle();
      const tok = s => s.toUpperCase().replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').split(/\s+/).filter(Boolean);
      function run(t, depth) {
        let i = 0, n = 0;
        while (i < t.length) {
          if (++n > 4000 || depth > 6) throw new Error('TOO MUCH. THE TURTLE IS TIRED.');
          const cmd = t[i++], num = () => { const v = parseFloat(t[i++]); if (isNaN(v)) throw new Error(cmd + ' NEEDS A NUMBER'); return v; };
          if (cmd === 'FD' || cmd === 'FORWARD' || cmd === 'BK' || cmd === 'BACK') {
            const d = num() * (cmd[0] === 'B' ? -1 : 1), nx = x + Math.cos(h * Math.PI / 180) * d, ny = y + Math.sin(h * Math.PI / 180) * d;
            if (pen) { g.strokeStyle = COLS[col]; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke(); segs.push([x, y, nx, ny, h]); }
            x = nx; y = ny;
          } else if (cmd === 'RT' || cmd === 'RIGHT') h += num();
          else if (cmd === 'LT' || cmd === 'LEFT') h -= num();
          else if (cmd === 'PU' || cmd === 'PENUP') pen = false;
          else if (cmd === 'PD' || cmd === 'PENDOWN') pen = true;
          else if (cmd === 'SETC') col = Math.abs(Math.floor(num())) % 8;
          else if (cmd === 'HOME') { x = 150; y = 110; h = -90; }
          else if (cmd === 'CS' || cmd === 'CLEARSCREEN') reset();
          else if (cmd === 'REPEAT') {
            const k = Math.min(360, Math.floor(num())); if (t[i++] !== '[') throw new Error('REPEAT NEEDS [ ]');
            let dep = 1, j = i; while (j < t.length && dep) { if (t[j] === '[') dep++; else if (t[j] === ']') dep--; j++; }
            if (dep) throw new Error('MISSING ]');
            const body = t.slice(i, j - 1); for (let r = 0; r < k; r++) run(body, (depth || 0) + 1); i = j;
          } else throw new Error("I DON'T KNOW HOW TO " + cmd);
        }
      }
      const isSquare = () => { // the last 4 lines: same length, right angles, back where they started
        if (segs.length < 4) return false; const s = segs.slice(-4), L = q => Math.hypot(q[2] - q[0], q[3] - q[1]), l0 = L(s[0]);
        if (l0 < 8 || s.some(q => Math.abs(L(q) - l0) > 1)) return false;
        for (let i = 1; i < 4; i++) { const d = ((s[i][4] - s[i - 1][4]) % 360 + 360) % 360; if (Math.abs(d - 90) > 0.5 && Math.abs(d - 270) > 0.5) return false; }
        return Math.hypot(s[3][2] - s[0][0], s[3][3] - s[0][1]) < 1;
      };
      const exec = s => {
        log.textContent += '? ' + s + '\n'; restore();
        try { run(tok(s), 0); save(); turtle(); log.textContent += 'OK\n'; if (isSquare()) { c.secret('web.logo'); log.textContent += 'A SQUARE! SIR WOULD BE PROUD.\n'; } }
        catch (e) { save(); turtle(); log.textContent += e.message + '\n'; Sound.play('uhoh'); }
        log.scrollTop = log.scrollHeight;
      };
      el.querySelector('.cc-f').addEventListener('submit', ev => { ev.preventDefault(); const v = inp.value.trim(); if (v) exec(v); inp.value = ''; });
      el.querySelectorAll('[data-try]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); exec('CS'); exec(a.dataset.try); }));
      el.querySelectorAll('[data-cc]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const t = el.querySelector('#cc-' + a.dataset.cc); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
    },
  });

  // ---------------------------------------------------------------- ~stu: the worst band in the world
  const SETLIST = ['Cheese On Toast Again', 'Underpants Of Gloom', 'Saturday Is Too Short', "Teacher's Got A Pet Rat", 'Always Late For School', 'Rain On My Bike', "Dad Won't Turn It Down"];
  def('~stu', {
    css: `.wp-u-stu{background:#e9e4d8 ${tile('<path d="M0 0h40v40H0z" fill="none"/><circle cx="7" cy="9" r=".8" fill="#999"/><circle cx="31" cy="27" r=".7" fill="#aaa"/><circle cx="19" cy="35" r=".6" fill="#888"/><path d="M3 30l6 1M25 6l5-1" stroke="#bbb" stroke-width=".6"/>', 40)};color:#111;font:14px/1.45 "Courier New",monospace}
.wp-u-stu .mt-title{text-align:center;margin:6px 0 2px;line-height:1.1}
.wp-u-stu .mt-title span{display:inline-block;padding:2px 5px;margin:2px 1px;font-weight:bold;box-shadow:2px 2px 0 rgba(0,0,0,.4)}
.wp-u-stu .mt-sub{text-align:center;background:#000;color:#ff8c00;font:bold 14px Arial,sans-serif;padding:4px;transform:rotate(-1deg);margin:6px auto;max-width:430px}
.wp-u-stu .mt-flyer{background:#fff;border:2px solid #000;padding:12px 14px;margin:14px auto;max-width:620px;position:relative;box-shadow:5px 5px 0 #000}
.wp-u-stu .mt-flyer::before,.wp-u-stu .mt-flyer::after{content:"";position:absolute;top:-10px;width:70px;height:20px;background:rgba(255,240,170,.85);border:1px solid #cc9}
.wp-u-stu .mt-flyer::before{left:20px;transform:rotate(-6deg)}.wp-u-stu .mt-flyer::after{right:20px;transform:rotate(5deg)}
.wp-u-stu h2{font:bold 22px Impact,Arial,sans-serif;letter-spacing:1px;margin:2px 0 8px;color:#ff6a00;text-shadow:1px 1px #000}
.wp-u-stu ol.mt-set{font:bold 15px Arial,sans-serif}
.wp-u-stu table{width:100%}.wp-u-stu td{border-bottom:1px dashed #999;padding:4px}
.wp-u-stu .mt-enc{text-align:center;background:#111;color:#fff;padding:12px;margin:14px auto;max-width:620px;border:3px solid #ff6a00}
.wp-u-stu .mt-enc .btn{font-size:16px;padding:6px 16px}
.wp-u-stu .mt-count{font:bold 28px Impact,sans-serif;color:#ff8c00}
.wp-u-stu a{color:#c40}`,
    html: c => {
      const T = 'THE MOULDY TANGERINES'.split(''), cols = [['#ff6a00', '#000'], ['#000', '#fff'], ['#fff', '#000'], ['#ffd400', '#000'], ['#c00', '#fff'], ['#0a0', '#fff']], fonts = ['Impact,sans-serif', '"Times New Roman",serif', '"Courier New",monospace', '"Arial Black",sans-serif', '"Comic Sans MS",cursive'];
      return `<h1 class="mt-title">${T.map((ch, i) => ch === ' ' ? '<br>' : `<span style="background:${cols[i % 6][0]};color:${cols[i % 6][1]};font-family:${fonts[(i * 3) % 5]};font-size:${22 + (i * 7) % 16}px;transform:rotate(${((i * 37) % 13) - 6}deg)">${ch}</span>`).join('')}</h1>
<div class="mt-sub">OFFICIAL WEBSITE &middot; THE LOUDEST BAND IN THE CUL-DE-SAC</div>
<div class="mt-flyer"><h2>WHO WE ARE</h2><p>We are THE MOULDY TANGERINES and we are a ROCK BAND. We formed in {kidBand}'s garage at Easter, after {kidBand} found a tangerine behind the radiator that had been there since Christmas. It was blue. It was beautiful. It was the name.</p>
<table><tr><td><b>{kidBand.NAME}</b></td><td>Vocals, tambourine, writing the songs, carrying the tambourine</td></tr><tr><td><b>DEV</b></td><td>Guitar. Knows three chords. Is learning a fourth (it's hard).</td></tr><tr><td><b>BIG KEL</b></td><td>Drums (a biscuit tin, two saucepans and a cymbal from a jumble sale)</td></tr><tr><td><b>HATTIE</b></td><td>Keyboard. {kidBand}'s little sister. Keeps pressing the demo button. Is only in the band because it's her keyboard.</td></tr></table></div>
<div class="mt-flyer"><h2>THE SETLIST</h2><p>Learn it off by heart. Dev says the first letters are important, but Dev also says the earth is "probably" round.</p><ol class="mt-set">${SETLIST.map(s => `<li>${esc(s)}</li>`).join('')}</ol><p class="small">Encore (if anyone asks): "Underpants Of Gloom" again but faster.</p></div>
<div class="mt-flyer"><h2>GIGS</h2><table><tr><td><b>PAST</b></td><td>Nan's 70th birthday. We were asked to stop after one song. It was the best one song of our lives.</td></tr><tr><td><b>PAST</b></td><td>School talent show. Came 9th out of 8. (They added a place specially.)</td></tr><tr><td><b>PAST</b></td><td>{kidBand}'s garage. Audience: 2 (a neighbour came to complain and stayed for a bit).</td></tr><tr><td><b>FUTURE</b></td><td>The millennium! We are available for New Year's Eve parties. Price: crisps.</td></tr></table></div>
<div class="mt-flyer c"><h2>THE DEMO TAPE</h2><p>Recorded on {kidBand}'s dad's tape recorder in one take. Big Kel dropped a saucepan at the end. We kept it in, because it's ART.</p>${c.midi('web-band', 'mouldy_demo_tape.mid')}<p class="small">(Some of the notes are wrong on purpose. Some of them are just wrong.)</p></div>
<div class="mt-enc"><p>WANT MORE??? SHOUT FOR AN ENCORE!!! (everyone on JackNet can hear you)</p><div class="mt-count">0</div><p class="small">encore shouts from fans so far</p><button class="btn mt-shout" type="button">ENCORE!!! ENCORE!!!</button><div class="mt-said small"></div></div>
${c.gb([['{kidBand}\'s Mom', c.daysAgo(2), 'Very nice children. Could you do it a bit quieter please.', 3], ['{cousin}', c.daysAgo(4), 'u r all awful. the tambourine bit is good tho', 2], ['Big Kel', c.daysAgo(7), 'I NEED NEW SAUCEPANS. ANY DONATIONS', 5], ['Jack', c.daysAgo(9), 'Underpants Of Gloom is a banger. I mean it.', 5]], { title: 'FAN MAIL', ph: 'Which Mouldy Tangerine is your fave?' })}
<p class="c">Fans who have visited: ${c.counter('odo')}</p>
<p class="c small">Mates: ${c.a('~dave', 'Dave (our bouncer)')} &middot; ${c.a('~kim', '{cousin} (our biggest critic)')} &middot; ${c.a('midi', 'more music')}</p>
${c.ring()}`;
    },
    setup(el, c) {
      const n = el.querySelector('.mt-count'), said = el.querySelector('.mt-said'); let mine = 0, last = 0;
      const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); };
      c.get(['web.band.encore']).then(v => show(v['web.band.encore']));
      c.watch('web.band.encore', ev => { if (ev.type === 'set') { show(ev.v); if (ev.by && ev.by !== Net.me.nick) said.textContent = ev.by + ' just shouted ENCORE!!!'; } });
      el.querySelector('.mt-shout').addEventListener('click', () => {
        if (Date.now() - last < 700) return; last = Date.now();
        Net.kv.inc('web.band.encore'); mine++; Sound.play('boing'); said.textContent = 'You shouted ENCORE! (' + mine + ')';
        if (mine === 3) { said.textContent = 'OK OK! The Mouldy Tangerines play the demo again!!!'; c.music('web-band'); c.secret('web.setlist'); }
      });
    },
  });

  // ---------------------------------------------------------------- ~nan: Nan's recipes, in capitals
  const GAS = [[1, 140], [2, 150], [3, 170], [4, 180], [5, 190], [6, 200], [7, 220], [8, 230], [9, 240]];
  def('~nan', {
    css: `.wp-u-nan{background:#dfeefc ${tile('<rect width="12" height="12" fill="#bcd8f4" opacity=".7"/><rect x="12" y="12" width="12" height="12" fill="#bcd8f4" opacity=".7"/><rect x="12" width="12" height="12" fill="#cfe3f8" opacity=".5"/>', 24)};color:#123;font:bold 16px/1.5 Arial,sans-serif}
.wp-u-nan .nn-card{background:#fff;max-width:620px;margin:0 auto 16px;border:3px solid #369;padding:12px 16px;box-shadow:4px 4px 0 #369}
.wp-u-nan h1{font:bold 34px Georgia,serif;color:#369;text-align:center;margin:4px 0}
.wp-u-nan h2{font:bold 20px Georgia,serif;color:#b03030;margin:4px 0 6px}
.wp-u-nan .nn-j{font:normal 12px "Courier New",monospace;color:#555;background:#f4f4f4;padding:3px 6px;border-left:3px solid #999}
.wp-u-nan ul,.wp-u-nan ol{margin:4px 0}
.wp-u-nan .nn-gas{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.wp-u-nan .nn-gas select{font:bold 16px Arial,sans-serif}
.wp-u-nan .nn-out{font:bold 20px Georgia,serif;color:#b03030}
.wp-u-nan .wgb{border-color:#369}.wp-u-nan .wgb-head{background:#369}.wp-u-nan .wgbe-t{text-transform:uppercase}
.wp-u-nan a{color:#036}`,
    html: c => `<div class="nn-card"><h1>NAN'S RECIPE CORNER</h1><p class="c">WELCOME TO MY PAGE ON THE INTERNET. MY GRANDSON JACK HAS PUT IT ON FOR ME. I AM TYPING THIS WITH ONE FINGER SO PLEASE BE PATIENT.</p><p class="nn-j">JACK: Nan, you don't have to type in capitals.</p><p>I LIKE CAPITALS. THEY ARE EASIER TO SEE. LOVE NAN.</p></div>
<div class="nn-card"><h2>JAM TARTS</h2><ul><li>8 OZ PLAIN FLOUR</li><li>4 OZ BUTTER (OR MARGARINE IF YOU MUST)</li><li>A LITTLE COLD WATER</li><li>JAM (ANY KIND, BUT STRAWBERRY IS BEST)</li></ul><ol><li>RUB THE BUTTER INTO THE FLOUR UNTIL IT LOOKS LIKE BREADCRUMBS.</li><li>ADD WATER A LITTLE AT A TIME UNTIL IT MAKES A DOUGH. DO NOT MAKE IT STICKY.</li><li>ROLL IT OUT AND CUT CIRCLES WITH A CUP. PUT THEM IN A BUN TIN.</li><li>A TEASPOON OF JAM IN EACH. NOT TOO MUCH OR IT BOILS OVER. JACK.</li><li>GAS MARK 6 FOR ABOUT 15 MINUTES. LET THEM COOL. THE JAM IS LIKE LAVA.</li></ol></div>
<div class="nn-card"><h2>CHEESE SCONES</h2><p>8 OZ SELF RAISING FLOUR, 2 OZ BUTTER, 3 OZ GRATED CHEESE, A PINCH OF SALT, ABOUT A QUARTER PINT OF MILK. MIX IT ALL, PAT IT OUT THICK, CUT ROUNDS, PUT A BIT OF CHEESE ON TOP. GAS MARK 7 FOR 12 MINUTES. EAT THEM WARM WITH BUTTER. DO NOT TELL YOUR MOTHER HOW MUCH BUTTER.</p></div>
<div class="nn-card"><h2>BREAD AND BUTTER PUDDING</h2><p>THIS IS HOW MY MOTHER MADE IT AND HER MOTHER BEFORE HER. BUTTER SOME OLD BREAD. LAYER IT IN A DISH WITH SULTANAS AND A SPRINKLE OF SUGAR. POUR OVER 2 EGGS BEATEN IN HALF A PINT OF MILK. LEAVE IT TO SOAK FOR HALF AN HOUR. GAS MARK 4 FOR 40 MINUTES UNTIL IT IS GOLDEN AND CRISPY ON TOP.</p></div>
<div class="nn-card"><h2>JACK'S FAVOURITE: CHIPS</h2><p>PUT THE OVEN CHIPS IN THE OVEN. TAKE THEM OUT. HE SAYS THIS IS A RECIPE. IT IS NOT A RECIPE. I HAVE PUT IT ON SO HE STOPS ASKING.</p></div>
<div class="nn-card"><h2>GAS MARK CONVERTER</h2><p class="nn-j">JACK: I made Nan a converter because her new cooker is in Celsius and she says it's "foreign".</p><div class="nn-gas"><label>GAS MARK <select class="nn-sel" aria-label="Gas mark">${GAS.map(([g]) => `<option${g === 4 ? ' selected' : ''}>${g}</option>`).join('')}</select></label> = <span class="nn-out">180 &deg;C</span></div></div>
<p class="c">${c.midi('web-nan', 'nans_kitchen.mid')}</p>
${c.gb([['Margaret', c.daysAgo(5), 'Lovely scones. I did them for the WI and nobody said anything nasty.', 5], ['Jack', c.daysAgo(6), 'nan the chips recipe is the best one on here', 5], ['Nan', c.daysAgo(6), 'THANK YOU JACK. EAT A VEGETABLE.', 0]], { title: "NAN'S VISITORS BOOK", ph: 'WRITE NAN A MESSAGE (SHE READS THEM ALL)' })}
<div class="nn-card c">YOU ARE VISITOR NUMBER ${c.counter('words')}.<br>THANK YOU FOR VISITING. MIND HOW YOU GO.</div>
<p class="c small">${c.a('knitting', 'MY DAUGHTER\'S KNITTING CLUB')} &middot; ${c.a('weather', 'THE WEATHER')} &middot; ${c.a('jokes', 'A JOKE (JACK SAYS)')}</p>
${c.ring()}`,
    setup(el) {
      const s = el.querySelector('.nn-sel'), o = el.querySelector('.nn-out');
      s.addEventListener('change', () => { const r = GAS.find(([g]) => g === +s.value); o.innerHTML = r[1] + ' &deg;C'; });
    },
  });

  // ---------------------------------------------------------------- ~biscuit: Dave's dog
  def('~biscuit', {
    css: `.wp-u-biscuit{background:#7cc24a ${tile('<g transform="rotate(-25 20 20)"><rect x="11" y="17" width="18" height="6" rx="3" fill="#fff"/><circle cx="11" cy="17" r="3.5" fill="#fff"/><circle cx="11" cy="23" r="3.5" fill="#fff"/><circle cx="29" cy="17" r="3.5" fill="#fff"/><circle cx="29" cy="23" r="3.5" fill="#fff"/></g>', 40)};color:#000;font:bold 15px "Comic Sans MS",cursive}
.wp-u-biscuit .bs-box{background:#fff8e0;border:4px solid #7a4a14;border-radius:12px;padding:10px 14px;margin:12px auto;max-width:600px}
.wp-u-biscuit h1{text-align:center;font:bold 42px "Comic Sans MS",cursive;color:#7a4a14;text-shadow:3px 3px 0 #fff;margin:4px 0}
.wp-u-biscuit h2{color:#7a4a14;font:bold 20px "Comic Sans MS",cursive;margin:2px 0 6px}
.wp-u-biscuit .bs-yard{position:relative;height:120px;background:linear-gradient(#bfe6ff 60%,#5aa52e 60%);border:3px solid #7a4a14;overflow:hidden;border-radius:8px}
.wp-u-biscuit .bs-dog{position:absolute;left:20px;bottom:10px;width:60px;height:40px;transition:left .7s ease-in-out}
.wp-u-biscuit .bs-stick{position:absolute;left:70px;bottom:26px;width:34px;height:6px;background:#7a4a14;border-radius:3px;transition:left .6s ease-out,bottom .6s cubic-bezier(.2,-1.2,.6,1)}
.wp-u-biscuit .bs-n{font-size:26px;color:#7a4a14}
.wp-u-biscuit a{color:#036}.wp-u-biscuit .wgb{border-color:#7a4a14}.wp-u-biscuit .wgb-head{background:#7a4a14}`,
    html: c => `<h1>WOOF! I AM BISCUIT</h1>
<p class="c"><marquee scrollamount="8">WOOF WOOF WOOF WOOF STICK WOOF WOOF WOOF SQUIRREL!!! WOOF WOOF WOOF</marquee></p>
<div class="bs-box"><p>HELLO. I AM BISCUIT. I AM A DOG. I BELONG TO DAVE. DAVE IS TYPING THIS FOR ME BECAUSE I DO NOT HAVE THUMBS. I SAID "WOOF" AND DAVE SAYS THAT MEANS ALL OF THIS.</p><p class="small">(Dave here. Biscuit is a mostly-labrador. He is 4. He is a good boy.)</p></div>
<div class="bs-box"><h2>MY STICKS (RANKED)</h2><ol><li>THE BIG ONE FROM THE PARK (legend)</li><li>The one that was actually part of the fence</li><li>A normal stick</li><li>Another normal stick</li><li>Dave's recorder (it is not a stick, Dave says. it is a stick.)</li></ol></div>
<div class="bs-box"><h2>THROW THE STICK!!!</h2><p>Everybody on JackNet can throw my stick! I will get it EVERY TIME.</p><div class="bs-yard"><svg class="bs-dog" viewBox="0 0 60 40" aria-label="Biscuit the dog"><ellipse cx="29" cy="38.6" rx="20" ry="1.6" fill="rgba(0,0,0,.25)"/><g stroke="#3a2410" stroke-width="1.1" stroke-linejoin="round"><path class="bs-tail" d="M13 21q-7-3-6-13" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M13 21q-7-3-6-13" stroke="#d9a441" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="14" y="27" width="5" height="11" rx="2" fill="#b8822e"/><rect x="35" y="27" width="5" height="11" rx="2" fill="#b8822e"/><ellipse cx="27" cy="23" rx="16" ry="8.5" fill="#d9a441"/><path d="M33 19l5-8 8 1-1 13z" fill="#d9a441" stroke="none"/><rect x="19" y="28" width="5" height="11" rx="2" fill="#d9a441"/><rect x="40" y="28" width="5" height="11" rx="2" fill="#d9a441"/><circle cx="45" cy="13" r="7.5" fill="#d9a441"/><rect x="47" y="12" width="11" height="7" rx="3.2" fill="#f0c878"/><path d="M39 8q-5 4-2 13q4-1 5-10z" fill="#8a5a1a"/><path d="M37.5 18.5l7 2.5-1 3-7-2.4z" fill="#d81818"/></g><ellipse cx="27" cy="27" rx="10" ry="3" fill="#f0c878"/><ellipse cx="57" cy="13.6" rx="1.8" ry="1.4" fill="#111"/><circle cx="47.5" cy="10.5" r="1.5" fill="#111"/><circle cx="47" cy="10" r=".5" fill="#fff"/><path d="M51 17.5q3 1.5 6 0" stroke="#3a2410" stroke-width=".8" fill="none"/><path d="M53 18.4q1 3 3 .2" fill="#ff7a8a" stroke="#3a2410" stroke-width=".5"/><circle cx="41.5" cy="23.6" r="1.3" fill="#ffd400" stroke="#7a5a00" stroke-width=".4"/></svg><span class="bs-stick"></span></div><p class="c">Sticks thrown by everyone: <span class="bs-n">0</span></p><p class="c"><button class="btn bs-throw" type="button">THROW!</button> <span class="bs-said small"></span></p></div>
<div class="bs-box"><h2>MY ENEMIES</h2><ul><li><b>THE POSTMAN</b>. Comes EVERY DAY. Puts paper through the door. I bark. He goes away. I WIN EVERY DAY.</li><li><b>MR TIDDLES</b>. Dave's cat. He sits on MY bed. He eats MY food. He is "the champion" on ${c.a('~dave', "Dave's page")}. I am not allowed on Dave's page. THIS IS MY PAGE NOW.</li><li><b>THE VACUUM</b>. Enough said.</li></ul></div>
<p class="c">${c.counter('odo')} <br>dogs and people have sniffed this page</p>
${c.gb([['Mr Tiddles', c.daysAgo(1), 'hiss', 1], ['Dave', c.daysAgo(3), 'good boy biscuit', 5], ['The Postman', c.daysAgo(4), 'Please could you stop barking at me. I am only delivering the gas bill.', 2]], { title: 'BARK HERE (guestbook)', ph: 'Say something to Biscuit. He likes "good boy".', btn: 'WOOF' })}
${c.ring()}`,
    setup(el, c) {
      const stick = el.querySelector('.bs-stick'), dog = el.querySelector('.bs-dog'), n = el.querySelector('.bs-n'), said = el.querySelector('.bs-said');
      let busy = false, last = 0;
      const play = who => {
        if (busy) return; busy = true;
        const far = 40 + Math.random() * 45;
        stick.style.left = far + '%'; stick.style.bottom = '18px'; Sound.play('boing');
        if (who) said.textContent = who + ' threw the stick!';
        setTimeout(() => { if (!el.isConnected) return; dog.style.left = 'calc(' + far + '% - 40px)'; }, 500);
        setTimeout(() => { if (!el.isConnected) return; stick.style.left = '70px'; stick.style.bottom = '26px'; dog.style.left = '20px'; Sound.play('pet'); }, 1400);
        setTimeout(() => { busy = false; }, 2200);
      };
      const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); };
      c.get(['web.biscuit.sticks']).then(v => show(v['web.biscuit.sticks']));
      c.watch('web.biscuit.sticks', ev => { if (ev.type === 'set') { show(ev.v); if (ev.by !== Net.me.nick) play(ev.by); } });
      el.querySelector('.bs-throw').addEventListener('click', () => { if (Date.now() - last < 2300) return; last = Date.now(); if (!Net.kv.inc('web.biscuit.sticks')) said.textContent = '(offline: Biscuit fetches it anyway)'; else said.textContent = 'GOOD THROW!!!'; play(); });
    },
  });

  // ---------------------------------------------------------------- ~kevin: the pet rock page (moved here)
  const ROCKDIARY = ['Did not move.', 'Did not move. It rained. Rocky got wet. Rocky did not mind.', 'Moved! (Mom hoovered under him.)', 'Did not move. I think he is thinking.', 'Took Rocky to school for show and tell. He was very good. He did not say anything.', 'Did not move.', 'Gave Rocky a bath. He sank. He is fine. He is a rock.'];
  def('~kevin', {
    css: `.wp-u-kevin{background:#8d8d86 ${tile('<circle cx="6" cy="7" r="5" fill="#9b9b93"/><circle cx="24" cy="4" r="3" fill="#7e7e77"/><circle cx="19" cy="20" r="6" fill="#a3a39a"/><circle cx="4" cy="24" r="3" fill="#77776f"/><circle cx="29" cy="28" r="2.5" fill="#999990"/>', 32)};color:#111;font:15px/1.45 Verdana,Arial,sans-serif}
.wp-u-kevin .rk-moved{background:#ff0;border:3px solid #f00;text-align:center;font:bold 15px Arial,sans-serif;padding:6px;margin-bottom:10px}
.wp-u-kevin .rk-main{background:#efefe8;border:2px solid #555;max-width:600px;margin:0 auto;padding:12px 16px}
.wp-u-kevin h1{font:bold 28px Verdana,sans-serif;text-align:center;margin:2px 0 8px}
.wp-u-kevin .rk-rock{display:block;margin:10px auto;width:180px;cursor:pointer}
.wp-u-kevin .rk-rock.pat{animation:rkpat .3s}
@keyframes rkpat{50%{transform:scale(1.04,.96)}}
.wp-u-kevin table{width:100%;font-size:13px}.wp-u-kevin td{border-bottom:1px solid #bbb;padding:3px}
.wp-u-kevin .wctr-plain{font-size:16px}.wp-u-kevin a{color:#225}`,
    html: c => `<div class="rk-moved">THIS PAGE HAS MOVED!!! (it used to be somewhere else. now it's here. please update your bookmarks.)</div>
<div class="rk-main"><h1>Kevin's Pet Rock Page</h1><p class="c">Meet <b>ROCKY</b>. He's a rock. He's my pet. Click him to give him a pat.</p>
<svg class="rk-rock" viewBox="0 0 180 120" role="button" tabindex="0" aria-label="Rocky the pet rock. Click to pat."><ellipse cx="90" cy="108" rx="70" ry="8" fill="rgba(0,0,0,.25)"/><path d="M22 92Q14 50 52 32Q90 14 132 30Q168 46 160 90Q154 108 90 108Q30 108 22 92Z" fill="#9a958a" stroke="#4a4740" stroke-width="3"/><path d="M50 50q14-8 28-2M110 40q10 2 18 10M60 88q20 6 46 0" stroke="#7a766c" stroke-width="3" fill="none"/><circle cx="72" cy="66" r="12" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="108" cy="66" r="12" fill="#fff" stroke="#000" stroke-width="2"/><circle class="rk-p1" cx="75" cy="69" r="5"/><circle class="rk-p2" cx="111" cy="69" r="5"/></svg>
<p class="c">Rocky has been patted <b class="rk-n">0</b> times by people on JackNet. <span class="rk-said small"></span></p>
<h3>ROCKY FACTS</h3><ul><li>Age: about 4 million years (guess).</li><li>Found: on the beach on holiday. He was just lying there. Waiting for me.</li><li>Eats: nothing. Very cheap pet.</li><li>Tricks: sit (always), stay (always), roll over (if you push him).</li><li>Best friend: Gubbinz has a rock called Kevin. That's my name. We are not related.</li></ul>
<h3>ROCKY'S DIARY</h3><table>${ROCKDIARY.map((d, i) => `<tr><td style="width:80px">${c.daysAgo(i * 4 + 1)}</td><td>${esc(d)}</td></tr>`).join('')}</table>
<h3>ROCKY CAM</h3><p>I set up a webcam on Rocky like ${c.a('hamstercam', '{hamster} has')}. Nothing happened for 3 days. I turned it off. It was the same picture as above.</p>
<p class="c">Page views: ${c.counter('plain')} (Rocky has not looked at it)</p>
<p class="c small">Links: ${c.a('poetree', "Gubbinz's poems (he wrote about rocks)")} &middot; ${c.a('~ash', 'space rocks')} &middot; ${c.a('fanfic', 'stories')}</p>
${c.ring()}</div>`,
    setup(el, c) {
      const r = el.querySelector('.rk-rock'), n = el.querySelector('.rk-n'), said = el.querySelector('.rk-said'); let last = 0;
      const show = v => { if (typeof v === 'number') n.textContent = v.toLocaleString('en-GB'); };
      c.get(['web.rock.pats']).then(v => show(v['web.rock.pats']));
      c.watch('web.rock.pats', ev => { if (ev.type === 'set') { show(ev.v); if (ev.by !== Net.me.nick) said.textContent = '(' + ev.by + ' just patted him)'; } });
      const pat = () => { if (Date.now() - last < 500) return; last = Date.now(); Net.kv.inc('web.rock.pats'); r.classList.remove('pat'); void r.getBBox; void r.offsetWidth; r.classList.add('pat'); Sound.play('thud'); said.textContent = W.pick(['Rocky appreciates it.', 'Rocky did not move. That means he likes it.', 'Good rock.', 'Rocky is now 0.0001% shinier.']); };
      r.addEventListener('click', pat); r.addEventListener('keydown', e => { if (e.key === 'Enter') pat(); });
      const p1 = el.querySelector('.rk-p1'), p2 = el.querySelector('.rk-p2');
      c.every(() => { const dx = W.ri(-4, 4), dy = W.ri(-3, 3); p1.setAttribute('cx', 72 + dx); p1.setAttribute('cy', 66 + dy); p2.setAttribute('cx', 108 + dx); p2.setAttribute('cy', 66 + dy); }, 1500);
    },
  });

  // ---------------------------------------------------------------- ~tom: abandoned since 1997 (with a note in the source)
  def('~tom', {
    css: `.wp-u-tom{background:#c0c0c0;color:#000;font:16px "Times New Roman",serif}
.wp-u-tom .tm-dust{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.35) 0 1px,transparent 1.5px) 0 0/23px 19px,radial-gradient(circle,rgba(90,80,60,.25) 0 1px,transparent 1.5px) 7px 9px/31px 27px}
.wp-u-tom .tm-web{position:absolute;width:120px;height:120px;pointer-events:none;opacity:.7}
.wp-u-tom .tm-web.l{left:0;top:0}.wp-u-tom .tm-web.r{right:0;top:0;transform:scaleX(-1)}
.wp-u-tom h1{font:bold 32px "Times New Roman",serif;text-align:center;margin:30px 0 4px}
.wp-u-tom .tm-x{display:inline-flex;align-items:center;justify-content:center;width:120px;height:90px;border:1px solid #808080;border-right-color:#fff;border-bottom-color:#fff;margin:4px;font:11px Arial,sans-serif;color:#000;vertical-align:top;flex-direction:column;gap:4px}
.wp-u-tom .tm-x::before{content:"x";color:#e00;font:bold 13px Arial,sans-serif;border:1px solid #888;width:14px;height:14px;line-height:13px;text-align:center;background:#fff}
.wp-u-tom hr{border:0;border-top:2px groove #fff}
.wp-u-tom .tm-dead{color:#808080;text-decoration:line-through}
.wp-u-tom .wgb{background:#dcdcdc;border-color:#999}.wp-u-tom .wgb-head{background:#808080}`,
    html: c => `<svg class="tm-web l" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#fff" fill="none" stroke-width=".8"><path d="M0 0l120 120M0 0l60 120M0 0l120 60M0 0l0 120M0 0l120 0"/><path d="M0 20q12 0 14-14M0 40q26 0 28-28-2-0 0 0M0 40q20 10 40-12M0 64q34 6 54-24M0 90q50 8 76-42M0 116q64 6 100-58"/></g></svg><svg class="tm-web r" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#fff" fill="none" stroke-width=".8"><path d="M0 0l120 120M0 0l60 120M0 0l120 60"/><path d="M0 20q12 0 14-14M0 40q20 10 40-12M0 64q34 6 54-24M0 90q50 8 76-42"/></g></svg><div class="tm-dust"></div>
<!-- TODO ({kidSoon}): finish the backstage bit at /backstage before anyone finds it. DON'T LINK IT YET -->
<h1>Welcome to {kidSoon}'s Page!</h1>
<p class="c">${c.uc('COMING SOON!!!')}</p>
<p class="c"><b>This page is under construction. Please come back soon for lots of cool stuff!!!</b></p>
<p class="c small">Last updated: 14/02/97</p>
<hr>
<h3>About Me</h3><p>Hi, I'm {kidSoon}. I like computers and stuff. This is my first web page. It's going to be about (coming soon).</p>
<h3>My Pictures</h3><p><span class="tm-x">me.gif</span><span class="tm-x">my_dog.gif</span><span class="tm-x">cool_flames.gif</span></p>
<h3>My Links</h3><ul><li class="tm-dead">My mate's page (gone)</li><li class="tm-dead">Cool site (also gone)</li><li>(more links coming soon)</li></ul>
<h3>Things I Will Put On This Page</h3><ol><li>A game I'm making (75% done)</li><li>Some jokes</li><li>A page about my dog</li><li>A secret area</li><li>Everything else</li></ol>
<p>Check back next week!!!</p>
<hr>
<p class="c">${c.midi('web-sad', 'coming_soon_forever.mid')}</p>
<p class="c">You are visitor number ${c.counter('plain')}</p>
${c.gb([['{kidSoon}', '14/02/97', 'first post!! testing my guestbook', 5], ['{kidSoon}', '15/02/97', 'test 2', 0], ['Jack', c.daysAgo(30), '{kidSoon} are you ever going to finish this', 3], ['Jack', c.daysAgo(2), '{kidSoon}? hello?', 0]], { title: "{kidSoon}'s Guestbook (please sign!!)", ph: 'Ask {kidSoon} when it will be finished' })}
<p class="c small">Back to: ${c.a('underconstruction', 'other under construction pages')} &middot; ${c.a('lost', 'somewhere else')}</p>
${c.ring()}`,
    setup(el, c) {
      const src = () => c.secret('web.source');
      // View > Source (or Edit with Notepad) while this page is showing shows the note above
      const t = ev => { const b = ev.target.closest && ev.target.closest('#navEdit, .menu button'); if (!b) return; if (b.id === 'navEdit' || /Source|Edit with Jotpad/.test(b.textContent)) setTimeout(() => { if (el.isConnected) document.querySelectorAll('.float, .appwin').forEach(w => { const ta = w.querySelector('textarea'); if (/backstage/.test(w.textContent + (ta ? ta.value : ''))) src(); }); }, 300); };
      document.addEventListener('click', t, true);
      return () => document.removeEventListener('click', t, true);
    },
  });

  // ---------------------------------------------------------------- ~lee: yo-yo tricks
  const TRICKS = [['The Sleeper', 1, 'Throw it down hard and let it spin at the bottom of the string without coming back. Count how long it sleeps. Tug to bring it home. EVERY trick starts with this.'], ['Walk the Dog', 2, 'Throw a strong sleeper, then let it gently touch the floor so it rolls along like a dog on a lead. Tug before it stops. Do NOT do this on Mom\'s carpet.'], ['Rock the Baby', 3, 'Throw a sleeper, make a triangle of string with your other hand (the cradle) and swing the yo-yo through it like a baby in a cot. The baby is spinning. Do not tell babies.'], ['Around the World', 3, 'Throw it forward, let it swing round in a big circle over your head and back in front. Check behind you first. (Sorry about the lampshade, Mom.)'], ['The Elevator', 4, 'Throw a sleeper, hook the string with your other hand and make the yo-yo climb up the string like a lift. Then let go. Ding.'], ['Breakaway', 2, 'Throw it out sideways from your arm muscle like you\'re showing off. Because you are.']];
  def('~lee', {
    css: `.wp-u-lee{background:#0a3cc8 ${tile('<circle cx="16" cy="16" r="9" fill="#ff3030" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="#fff"/><path d="M16 7v-7" stroke="#fff"/>', 44)};color:#fff;font:15px/1.45 Verdana,Arial,sans-serif}
.wp-u-lee h1{font:italic bold 38px "Arial Black",Impact,sans-serif;text-align:center;color:#ff0;text-shadow:3px 3px 0 #f00,6px 6px 0 #000;margin:6px 0}
.wp-u-lee .ly-t{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.wp-u-lee .ly-card{background:rgba(0,0,40,.85);border:3px solid #ff0;padding:10px;display:flex;gap:10px}
.wp-u-lee .ly-card svg{flex:none;width:52px;height:90px}
.wp-u-lee .ly-card b{color:#ff0;font-size:16px}
.wp-u-lee .ly-star{color:#ffd400}
.wp-u-lee .ly-yo{animation:lyyo 1.6s ease-in-out infinite}
@keyframes lyyo{0%,100%{transform:translateY(0)}45%,60%{transform:translateY(54px)}}
.wp-u-lee .ly-str{animation:lystr 1.6s ease-in-out infinite;transform-origin:26px 6px}
@keyframes lystr{0%,100%{transform:scaleY(.08)}45%,60%{transform:scaleY(1)}}
.wp-u-lee .ly-game{background:#000;border:3px ridge #ff0;max-width:520px;margin:16px auto;padding:10px;text-align:center}
.wp-u-lee canvas{width:200px;height:200px;background:#001}
.wp-u-lee .ly-msg{min-height:20px;color:#0ff}
.wp-u-lee a{color:#ff0}.wp-u-lee a:visited{color:#fc0}`,
    html: c => `<h1>{club3.NAME}'S YO-YO TRICK ZONE</h1>
<p class="c"><marquee scrollamount="7">*** EVERYONE AT SCHOOL HAS A YO-YO NOW *** I HAD ONE FIRST *** NEW TRICK EVERY WEEK *** THE LIGHT-UP ONE IS THE BEST ***</marquee></p>
<p>Welcome to the best yo-yo page on JackNet! Yo-yos are THE craze. Our headteacher banned them from the playground for a week after the Around The World Incident (not me) (it was me). Here are my tricks, easy to hard.</p>
<div class="ly-t">${TRICKS.map(([n, d, t]) => `<div class="ly-card"><svg viewBox="0 0 52 90" aria-hidden="true"><rect x="16" y="0" width="20" height="8" rx="3" fill="#fc9"/><g class="ly-str"><path d="M26 6v62" stroke="#fff" stroke-width="1.5"/></g><g class="ly-yo" style="animation-delay:-${d * 0.3}s"><circle cx="26" cy="14" r="9" fill="#ff3030" stroke="#fff" stroke-width="2"/><circle cx="26" cy="14" r="3" fill="#fff"/></g></svg><div><b>${esc(n)}</b> <span class="ly-star">${'&#9733;'.repeat(d)}</span><br>${esc(t)}</div></div>`).join('')}</div>
<div class="ly-game"><b>VIRTUAL YO-YO</b><p class="small">Throw a sleeper and tug it back before it stops spinning. How long can you make it sleep?</p><canvas width="200" height="200"></canvas><div class="ly-msg"></div><button class="btn ly-throw" type="button">THROW</button> <button class="btn ly-tug" type="button" disabled>TUG!</button><p class="small">Your best sleeper: <b class="ly-best">0.0</b> seconds</p></div>
<h3>MY YO-YO COLLECTION</h3><ul><li>The red one (my first, the string is grey now)</li><li>The light-up one (flashes when it spins, the best at night)</li><li>The posh one with a ball bearing inside (sleeps for AGES)</li><li>The one Dave sat on (now 2 halves)</li></ul>
<p class="c">Yo-yo fans: ${c.counter('flip')}</p>
<p class="c small">More: ${c.a('~kim', '{cousin}')} &middot; ${c.a('cubetimes', 'cube records')} &middot; ${c.a('rovers', 'the football team')}</p>
${c.ring()}`,
    setup(el, c) {
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), msg = el.querySelector('.ly-msg'), th = el.querySelector('.ly-throw'), tug = el.querySelector('.ly-tug'), bestEl = el.querySelector('.ly-best');
      let best = 0; try { best = +localStorage.getItem('jhp_web_yoyo') || 0; } catch (e) {} bestEl.textContent = best.toFixed(1);
      let st = 'idle', y = 20, spin = 0, ang = 0, sleepT = 0;
      th.addEventListener('click', () => { if (st !== 'idle') return; st = 'down'; spin = 1; sleepT = 0; th.disabled = true; tug.disabled = false; msg.textContent = ''; Sound.play('zap'); });
      tug.addEventListener('click', () => {
        if (st !== 'sleep' && st !== 'down') return;
        if (st === 'sleep' && spin > 0.25) { st = 'up'; msg.textContent = 'Slept for ' + sleepT.toFixed(1) + ' seconds!'; if (sleepT > best) { best = sleepT; bestEl.textContent = best.toFixed(1); try { localStorage.setItem('jhp_web_yoyo', best); } catch (e) {} msg.textContent += ' NEW RECORD!'; } Sound.play('pet'); }
        else { st = 'up'; msg.textContent = 'Too early! It came straight back up.'; }
      });
      c.anim(dt => {
        if (st === 'down') { y += 260 * dt; if (y >= 170) { y = 170; st = 'sleep'; } }
        else if (st === 'sleep') { sleepT += dt; spin -= dt * 0.11 * (1 + Math.random() * 0.3); if (spin <= 0.25) { st = 'dead'; msg.textContent = 'It stopped spinning. Knot! Re-wind it...'; Sound.play('thud'); setTimeout(() => { if (el.isConnected) { st = 'up'; } }, 900); } }
        else if (st === 'up') { y -= 300 * dt; if (y <= 20) { y = 20; st = 'idle'; th.disabled = false; tug.disabled = true; } }
        ang += spin * dt * 30;
        g.fillStyle = '#001'; g.fillRect(0, 0, 200, 200);
        g.fillStyle = '#fc9'; g.fillRect(88, 0, 24, 12);
        g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(100, 10); g.lineTo(100, y); g.stroke();
        g.save(); g.translate(100, y); g.rotate(ang); g.fillStyle = '#ff3030'; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#fff'; g.fillRect(-2, -14, 4, 28); if (spin > 0.4 && st === 'sleep') { g.fillStyle = 'rgba(255,255,0,.5)'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); } g.restore();
        if (st === 'sleep') { g.fillStyle = '#0ff'; g.font = '12px monospace'; g.fillText('SLEEPING ' + sleepT.toFixed(1) + 's', 50, 196); }
      });
    },
  });

  // ---------------------------------------------------------------- rovers: the junior football team
  const RESULTS = [['Town Colts', 'H', 2, 3], ['Athletic Juniors', 'A', 1, 1], ["St Somebody's", 'H', 4, 0], ['Park Rangers Juniors', 'A', 0, 9], ['Wanderers Youth', 'H', 3, 2], ['Albion Kids', 'A', 2, 2]];
  def('rovers', {
    css: `.wp-rovers{background:repeating-linear-gradient(90deg,#2e8b2e 0 40px,#279027 40px 80px);color:#000;font:14px/1.45 Arial,sans-serif}
.wp-rovers .rv-head{background:#fff;border:4px solid #c00;text-align:center;padding:8px;max-width:640px;margin:0 auto 12px}
.wp-rovers .rv-crest{width:70px;height:80px;display:block;margin:0 auto}
.wp-rovers h1{font:bold 30px "Arial Black",Arial,sans-serif;color:#c00;margin:2px 0}
.wp-rovers .rv-box{background:#fff;max-width:640px;margin:0 auto 12px;padding:10px 14px;border:2px solid #000}
.wp-rovers h2{background:#c00;color:#fff;font:bold 16px Arial,sans-serif;padding:3px 8px;margin:-10px -14px 8px}
.wp-rovers table{width:100%}.wp-rovers td,.wp-rovers th{padding:3px 5px;border-bottom:1px solid #ccc;text-align:left}.wp-rovers th{background:#eee}
.wp-rovers .W{color:#080;font-weight:bold}.wp-rovers .L{color:#c00;font-weight:bold}.wp-rovers .D{color:#a60;font-weight:bold}
.wp-rovers .rv-pen{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.wp-rovers .rv-goal{position:relative;height:110px;max-width:340px;margin:8px auto;border:5px solid #fff;border-bottom:0;background:repeating-linear-gradient(45deg,#ddd 0 1px,transparent 1px 8px),repeating-linear-gradient(-45deg,#ddd 0 1px,transparent 1px 8px),#3a9a3a}
.wp-rovers .rv-keeper{position:absolute;bottom:0;left:calc(50% - 15px);width:30px;height:56px;background:#ff0;border:2px solid #000;border-radius:12px 12px 2px 2px;transition:left .3s,transform .3s}
.wp-rovers .rv-ball{position:absolute;bottom:-14px;left:calc(50% - 9px);width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff 0 40%,#000 41% 50%,#fff 51%);transition:all .45s ease-out}
.wp-rovers .rv-res{text-align:center;font:bold 18px Arial,sans-serif;min-height:24px}
.wp-rovers .wctr-led{font-size:20px}`,
    html: c => {
      const pts = RESULTS.reduce((p, r) => p + (r[2] > r[3] ? 3 : r[2] === r[3] ? 1 : 0), 0);
      return `<div class="rv-head"><svg class="rv-crest" viewBox="0 0 70 80" aria-hidden="true"><path d="M5 5h60v35c0 22-30 36-30 36S5 62 5 40z" fill="#c00" stroke="#000" stroke-width="2"/><path d="M5 30h60" stroke="#fff" stroke-width="8"/><circle cx="35" cy="52" r="10" fill="#fff" stroke="#000"/><path d="M35 44l4 5-2 6h-4l-2-6z" fill="#000"/><text x="35" y="22" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="13" fill="#fff">RFC</text></svg><h1>ROVERS JUNIORS</h1><b>Sunday League, Division 3 (the one with the muddiest pitches)</b></div>
<div class="rv-box"><h2>RESULTS THIS SEASON</h2><table><tr><th>Opponent</th><th>H/A</th><th>Score</th><th></th></tr>${RESULTS.map(r => { const res = r[2] > r[3] ? 'W' : r[2] === r[3] ? 'D' : 'L'; return `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]} - ${r[3]}</td><td class="${res}">${res}</td></tr>`; }).join('')}</table><p class="small">Points: <b>${pts}</b>. League position: 7th of 10. (We were 9th. Moving up!!!)</p></div>
<div class="rv-box"><h2>MATCH REPORT: Park Rangers 9 - 0 Rovers</h2><p>It was a tough game. Their goalkeeper was about six foot tall and our goalkeeper (Ollie) was off with chickenpox, so Dave went in goal. Dave dived the wrong way nine times. To be fair to Dave, he did save a shot in the 40th minute, but it was a throw-in. Man of the match: the dog that ran on in the second half. Best thing about the day: the oranges at half time.</p></div>
<div class="rv-box"><h2>THE SQUAD</h2><table><tr><td>1</td><td>Ollie</td><td>Goalkeeper (when not spotty)</td></tr><tr><td>4</td><td>Jack</td><td>Defender. Head tennis champion.</td></tr><tr><td>7</td><td>{club3}</td><td>Winger. Does ${c.a('~lee', 'yo-yo tricks')} at half time.</td></tr><tr><td>9</td><td>{club4}</td><td>Striker. Top scorer (8 goals). Best player in the team. Scored from the halfway line once. By accident.</td></tr><tr><td>10</td><td>Dave</td><td>Midfield. Does a wrestling celebration even when he hasn't scored.</td></tr><tr><td>14</td><td>{kidEp1}</td><td>Sub. Brings a toy lightspatula to every game "for luck".</td></tr></table></div>
<div class="rv-box"><h2>ORANGES ROTA</h2><p>Every week a different family brings orange slices for half time. They must be cut into QUARTERS. Last time somebody brought whole oranges and nobody could get into them.</p><p>This week: Jack's Mom (she will probably bring a flask of tea for the grown-ups and a knitted something).</p></div>
<div class="rv-box"><h2>PENALTY SHOOTOUT!</h2><p class="c">Practice your penalties. Pick a corner. Beat the keeper!</p><div class="rv-goal"><div class="rv-keeper"></div><div class="rv-ball"></div></div><div class="rv-pen"><button class="btn" type="button" data-p="0">Left</button><button class="btn" type="button" data-p="1">Middle</button><button class="btn" type="button" data-p="2">Right</button></div><div class="rv-res"></div><p class="c small">Score: <b class="rv-sc">0 - 0</b></p></div>
<div class="rv-box c">Supporters: ${c.counter('led', { len: 5 })}</div>
${c.gb([['Ollie', c.daysAgo(3), 'back next week!!! spots nearly gone', 5], ['Coach', c.daysAgo(5), 'Training Wednesday 6pm. Bring shin pads. DAVE, SHIN PADS.', 4]], { title: "Supporters' Club Guestbook", ph: 'Cheer the team on!', btn: 'Post' })}
${c.ring()}`;
    },
    setup(el) {
      const k = el.querySelector('.rv-keeper'), b = el.querySelector('.rv-ball'), res = el.querySelector('.rv-res'), sc = el.querySelector('.rv-sc'); let me = 0, them = 0, busy = false;
      const X = ['12%', 'calc(50% - 9px)', 'calc(88% - 18px)'], KX = ['10%', 'calc(50% - 15px)', 'calc(90% - 30px)'];
      el.querySelectorAll('[data-p]').forEach(btn => btn.addEventListener('click', () => {
        if (busy) return; busy = true; const p = +btn.dataset.p, kp = W.ri(0, 2);
        k.style.left = KX[kp]; k.style.transform = kp === 0 ? 'rotate(-35deg)' : kp === 2 ? 'rotate(35deg)' : '';
        b.style.left = X[p]; b.style.bottom = '62px'; Sound.play('thud');
        setTimeout(() => {
          if (p === kp) { them++; res.textContent = 'SAVED!!! The keeper went the right way.'; Sound.play('uhoh'); }
          else { me++; res.textContent = 'GOOOOAL!!! Top corner!'; Sound.play('solve'); }
          sc.textContent = me + ' - ' + them;
          setTimeout(() => { if (!el.isConnected) return; b.style.left = 'calc(50% - 9px)'; b.style.bottom = '-14px'; k.style.left = KX[1]; k.style.transform = ''; busy = false; }, 900);
        }, 500);
      }));
    },
  });
})();

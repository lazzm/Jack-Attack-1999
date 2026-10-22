/* era-sites-dodgy: the dodgy corner of the 1999 web, kid-friendly. Download More RAM, a fake Y2K "online scan" (that
 * teaches you not to trust it), a hit counter that counts backwards, "100 MB" free web space (12 KB), fake cheats,
 * Pokemon playground rumours, a chain letter, frames inside frames, a Nutscape-only site, a plug-in that needs a
 * plug-in, a pop-up site (real desktop windows, only a few, all closable) and The Ring of Fire-and-Glitter. */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc, store = ES.store;
  const u = (h, p) => 'http://' + h + (p || '/');
  ES.css('dodgy', `
.dz{font:14px/1.4 "Times New Roman",serif;color:#000;padding:10px;text-align:center}
.dz h1{margin:6px 0;font:bold 32px Impact,"Arial Black",sans-serif}
.dz .bl{animation:esblink 1s steps(2) infinite}
.dz-ram{background:#000080 repeating-linear-gradient(0deg,#000080 0 2px,#00006a 2px 4px);color:#fff}
.dz-ram h1{color:#ff0;text-shadow:3px 3px 0 #f00}
.dz-ram a{color:#0ff}
.dz-chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0}
.dz-chips button{background:#0a6a2a;color:#fff;border:3px outset #3a9a5a;font:bold 14px Arial;padding:10px 12px;cursor:pointer;min-width:110px}
.dz-bar{width:340px;max-width:90%;height:22px;margin:10px auto;border:2px inset #888;background:#fff;padding:2px}
.dz-bar i{display:block;height:100%;width:0;background:repeating-linear-gradient(90deg,#000080 0 10px,#fff 10px 12px)}
.dz-y2k{background:#fff;color:#000;font-family:Arial,sans-serif}
.dz-y2k h1{color:#c00}
.dz-scan{max-width:520px;margin:10px auto;text-align:left;background:#000;color:#0f0;font:12px "Courier New",monospace;height:180px;overflow:auto;padding:8px;border:3px inset #888}
.dz-warn{background:#ffff80;border:3px solid #c00;padding:10px;max-width:520px;margin:10px auto;font:bold 14px Arial}
.dz-ctr{background:#fdf;font-family:"Comic Sans MS",cursive}
.dz-big{font:bold 54px "Courier New",monospace;background:#000;color:#f33;display:inline-block;padding:4px 14px;border:4px ridge #888;letter-spacing:6px}
.dz-free{background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext x='4' y='34' font-size='12' fill='%23eee' font-family='Arial'%3EFREE!%3C/text%3E%3C/svg%3E");font-family:Arial,sans-serif}
.dz-free h1{color:#008000}
.dz-free textarea{width:100%;max-width:560px;min-height:140px;font:13px "Courier New",monospace}
.dz-meter{max-width:560px;margin:6px auto;height:16px;border:1px solid #000;background:#eee}
.dz-meter i{display:block;height:100%;background:#0a0}
.dz-mine{max-width:560px;margin:10px auto;border:2px dashed #888;padding:10px;text-align:left;white-space:pre-wrap;background:#fff;min-height:60px}
.dz-cheat{background:#000;color:#0f0;font-family:"Courier New",monospace}
.dz-cheat h1{color:#f0f;text-shadow:0 0 6px #f0f}
.dz-cheat table{margin:10px auto;border-collapse:collapse;max-width:100%;text-align:left;font-size:13px}
.dz-cheat td,.dz-cheat th{border:1px solid #0a0;padding:4px 6px}
.dz-cheat .no{color:#f33;font-weight:bold}
.dz-cheat a{color:#ff0}
.dz-poke{background:#c8f0ff;font-family:Verdana,sans-serif;text-align:left}
.dz-poke h1{color:#e10600;text-align:center;text-shadow:2px 2px 0 #ffd400}
.dz-rum{background:#fff;border:3px solid #3a6ad8;border-radius:8px;padding:8px 10px;margin:10px auto;max-width:620px;position:relative}
.dz-rum h3{margin:0 0 4px;color:#1a3aa8}
.dz-stamp{display:inline-block;border:3px solid #c00;color:#c00;font:bold 14px Arial;padding:0 8px;transform:rotate(-6deg)}
.dz-stamp.maybe{border-color:#c80;color:#c80}.dz-stamp.true{border-color:#080;color:#080}
.dz-chain{background:#fff8e8;font:15px/1.6 "Times New Roman",serif;max-width:640px;margin:0 auto}
.dz-chain p{margin:12px 0}
.dz-fr{border:6px ridge #c0c0c0;background:#fff;display:flex;min-height:200px;text-align:left}
.dz-fr-nav{width:28%;min-width:80px;background:#ffc;border-right:6px ridge #c0c0c0;padding:6px;font:12px Arial;display:flex;flex-direction:column;gap:4px}
.dz-fr-main{flex:1;padding:6px;min-width:0;overflow:hidden}
.dz-fr-nav a{cursor:pointer}
.dz-nut{background:#c0c0c0;font-family:Arial,sans-serif}
.dz-nut .lay{position:relative;height:340px;max-width:600px;margin:10px auto;background:#fff;border:1px solid #000;overflow:hidden}
.dz-nut .lay div{position:absolute;padding:4px;border:1px solid #000;font:bold 14px "Times New Roman"}
.dz-plug{background:#fff;font-family:Arial,sans-serif;min-height:400px}
.dz-plug .box{display:inline-flex;align-items:center;gap:10px;background:#c8c8c8;border:1px solid #808080;padding:14px;margin:30px auto;max-width:90%}
.dz-pop{background:#ff0 repeating-conic-gradient(#ff0 0 15deg,#ff8 15deg 30deg);font-family:"Comic Sans MS",cursive}
.dz-pop h1{color:#f0f;text-shadow:2px 2px 0 #00f}
.dz-ring{max-width:520px;margin:12px auto;background:linear-gradient(90deg,#f00,#f80,#ff0,#f80,#f00);padding:3px;border-radius:4px}
.dz-ring > div{background:#000;color:#ff0;padding:6px 8px;font:bold 12px Arial;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}
.dz-ring a{color:#f6f}
.dz-ring .gl{animation:dzgl 1s linear infinite;display:inline-block}
@keyframes dzgl{50%{color:#fff;text-shadow:0 0 6px #fff}}
.dz-fg{background:#000 radial-gradient(circle,#400 0,#000 70%);color:#ff0;font-family:Arial,sans-serif}
.dz-fg a{color:#f6f}
.dz-fire{height:16px;max-width:520px;margin:6px auto;background:repeating-linear-gradient(90deg,#f00 0 6px,#f80 6px 10px,#ff0 10px 13px);animation:esblink .6s steps(2) infinite}
.dz-fg h1{background:linear-gradient(#ff0,#f00);-webkit-background-clip:text;background-clip:text;color:transparent}
`);

  // ---------------------------------------------------------------- The Ring of Fire-and-Glitter
  const RINGL = () => (window.EraSiteList || []).filter(r => r[7] === 'fg' && r[0] !== 'www.fireandglitter.homepagez').map(r => r[0]).concat(['www.megaflash.cyb', 'www.winbig.w3b', 'www.getrichquick.w3b']);
  const ring = host => {
    const L = RINGL(), i = Math.max(0, L.indexOf(host)), n = L.length;
    return `<div class="dz-ring"><div><span class="gl">&#9733;</span> The Ring of <span class="gl">FIRE</span>-and-<span class="gl">GLITTER</span> <span class="gl">&#9733;</span> <a href="${u(L[(i + n - 1) % n])}">&lt;&lt; prev</a> | <a href="${u('www.fireandglitter.homepagez')}">hub</a> | <a href="${u('www.fireandglitter.homepagez', '/list.html')}">list</a> | <a href="${u(L[(i + 1) % n])}">next &gt;&gt;</a></div></div>`;
  };
  const foot = (c, o) => `${ring(c.host)}${c.foot(Object.assign({ ring: false }, o || {}))}`;
  const def = (host, path, fn) => ES.def(host, path, fn);

  // ================================================================ DOWNLOAD MORE RAM
  def('www.downloadmoreram.w3b', '/', c => {
    c.after.push(() => {
      let busy = false;
      c.qa('.dz-chips button').forEach(b => b.addEventListener('click', () => {
        if (busy) return; busy = true;
        const mb = +b.dataset.mb, bar = c.q('.dz-bar i'), st = c.q('.dz-st'); let p = 0;
        st.textContent = `Downloading ${mb >= 1024 ? '1 GIGABYTE' : mb + 'MB'} of RAM... estimated time: ${Math.ceil(mb * 3.4)} minutes`;
        const iv = c.every(() => { p = Math.min(100, p + 4 + Math.random() * 9); bar.style.width = p + '%'; if (p >= 100) { clearInterval(iv); busy = false; c.secret('eras.ram'); c.sfx('solve');
          Desk.msgbox('RAM Installer', `${mb >= 1024 ? '1 GIGABYTE' : mb + 'MB'} of RAM downloaded!\n\nTo finish installing, please:\n  1. Open your computer with a screwdriver\n  2. Pour the RAM in\n  3. Shake gently\n\n(Or: you can't actually download RAM. RAM is a chip inside your computer. Ask a grown-up about upgrades. Sorry!)`, 'info');
          st.textContent = 'Download complete! Your computer feels exactly the same.'; } }, 200);
      }));
    });
    return `<div class="dz dz-ram"><h1>DOWNLOAD MORE RAM!!!</h1><p class="bl"><b>IS YOUR COMPUTER SLOW???</b></p><p>Why buy expensive memory chips from a shop when you can <b>DOWNLOAD RAM</b> straight down your phone line, for FREE?! Pick a size:</p>
      <div class="dz-chips">${[16, 32, 64, 128, 1024].map(m => `<button type="button" data-mb="${m}">${m >= 1024 ? '1 GB!!!' : m + ' MB'}</button>`).join('')}</div><div class="dz-bar"><i></i></div><p class="dz-st">Ready.</p>
      <p style="font-size:11px">Testimonials: "I downloaded 128MB and now my PC remembers my birthday" - ${Cast.n('kidY2k')}. "It did nothing" - everybody else.</p><p>Also try: <a href="${u('www.y2kscan.netz')}">FREE Y2K SCAN</a> &middot; <a href="${u('www.popupmania.w3b')}">FREE STUFF</a></p>${foot(c, { ctrText: 'RAM downloaded by', ctrAfter: 'visitors' })}</div>`;
  });

  // ================================================================ FREE Y2K ONLINE SCAN
  def('www.y2kscan.netz', '/', c => {
    c.after.push(() => {
      c.on('.dz-go', 'click', ev => {
        ev.target.disabled = true;
        const box = c.q('.dz-scan'), files = [];
        (function walk(n, p) { (n.kids || []).forEach(k => { if (k.hidden) return; const pp = p + '\\' + k.name; if (k.type === 'dir') { if (files.length < 60) walk(k, pp); } else files.push(pp); }); })(A.fs.get('C:/') || { kids: [] }, 'C:');
        const list = files.slice(0, 26); let i = 0;
        box.textContent = 'Connecting to Y2KSCAN.NETZ secure scanner (128-bit)...\n';
        const iv = c.every(() => {
          if (i < list.length) { box.textContent += `Scanning ${list[i]} ... ${i % 7 === 3 ? 'Y2K BUG FOUND!!!' : 'ok'}\n`; box.scrollTop = 1e6; i++; return; }
          clearInterval(iv);
          box.textContent += `\nSCAN COMPLETE.\n${Math.max(3, Math.floor(list.length / 7))} Y2K BUGS FOUND!!!\nYour toaster thinks it is 1900.\n`;
          c.q('.dz-res').hidden = false; c.sfx('uhoh');
        }, 160);
      });
    });
    return `<div class="dz dz-y2k"><h1>IS YOUR PC Y2K INFECTED?</h1><p>On 1 January 2000, millions of computers will think it is <b>1900</b>! Is YOURS one of them? Find out with our <b>FREE ONLINE SCAN</b>. No download needed!*</p><p style="font-size:10px">*we just need to look at your files (we already are)</p>
      <button class="es-btn dz-go" type="button" style="font-size:16px;padding:6px 20px">SCAN MY PC NOW!</button><pre class="dz-scan" aria-live="polite">Press SCAN to begin.</pre>
      <div class="dz-res dz-warn" hidden>WARNING!!! Your computer is INFECTED with the Millennium Bug!!!<br><br><a href="${u('www.y2kscan.netz', '/fix.html')}" style="font-size:20px">CLICK HERE TO FIX NOW FOR ONLY &pound;29.99!!!</a></div>${foot(c, { ctrText: 'PCs scanned:', ctrAfter: '' })}</div>`;
  });
  def('www.y2kscan.netz', '/fix.html', c => {
    c.later(() => c.secret('eras.scam'), 500);
    return `<div class="dz dz-y2k" style="text-align:left;max-width:640px;margin:0 auto"><h1 style="text-align:center">GOTCHA!</h1><div class="dz-warn" style="background:#e8ffe8;border-color:#080">This was a pretend scam, and you found the lesson at the end. Well done for being curious, but remember:</div>
      <ul><li><b>A web page cannot scan your computer</b> just by you visiting it. That list of files was a trick (this is a pretend computer anyway).</li><li>Anything that shouts "INFECTED!!!" and then asks for money is <b>a scam</b>.</li><li><b>Never</b> type a credit card number, password or your address into a site because it scared you.</li><li>Worried about the Millennium Bug? Ask a grown-up, and check with the people who made your computer. Most home PCs will be fine.</li></ul>
      <p>Real Y2K info: <a href="http://millenniumbunker.netz/">${Cast.n('kidY2k')}'s Millennium Bunker</a> (well, real-ish) &middot; <a href="http://www.hoaxwatch.netz/">HoaxWatch</a> (is that warning real?)</p>${foot(c)}</div>`;
  });

  // ================================================================ THE BACKWARDS HIT COUNTER
  def('www.backwardscounter.netz', '/', c => {
    c.after.push(() => {
      const k = 'eras.hits.backwardscounter', el = c.q('.dz-big'), show = v => { if (typeof v === 'number') el.textContent = String(Math.max(0, 1000000 - v)).padStart(7, '0'); };
      c.get([k]).then(v => show(v[k])); c.watch(k, ev => { if (ev.type === 'set') show(ev.v); });
      c.secret('eras.zero');
    });
    return `<div class="dz dz-ctr"><h1 style="color:#c0f">THE HIT COUNTER THAT COUNTS BACKWARDS</h1><p>Every other counter goes UP. Ours goes DOWN. You are visitor number:</p><div class="dz-big">-------</div><p>When it reaches <b>zero</b>, something AMAZING will happen.<br><small>(We don't know what. Nobody has got there yet. Tell your friends. ALL of them.)</small></p><p>Hit counter FAQ:<br><b>Q:</b> Why? <b>A:</b> Why not.<br><b>Q:</b> Is it Y2K compliant? <b>A:</b> It's going the other way, so it's fine.</p><p>More counters: <a href="http://www.countermania.netz/">The Web Counter Collection</a></p>${foot(c, { ctrText: 'Normal counter (boring):', ctrAfter: '' })}</div>`;
  });

  // ================================================================ FREE 100 MB (12 KB) WEB SPACE
  const QUOTA = 12 * 1024;
  def('www.free100mb.webcom', '/', c => `<div class="dz dz-free"><h1>FREE WEB SPACE!!! 100 MB!!!*</h1><p style="font-size:11px">*12 KB</p><p>Get your OWN homepage on the World Wide Web! It's FREE!!! No adverts!**</p><p style="font-size:11px">**some adverts. ***pop-ups. ****your page may be deleted if nobody visits it for a week. *****or if somebody does.</p>
    <p><a href="${u('www.free100mb.webcom', '/mypage.html')}" style="font:bold 22px Arial">SIGN UP NOW!</a> &middot; <a href="${u('www.free100mb.webcom', '/terms.html')}">Terms and conditions (long)</a></p>
    <p>Featured member sites: <a href="http://www.homepagez.webcom/">Homepagez Neighbourhoods</a> (our rivals, they have 1 MB) &middot; <a href="${u('www.framemania.homepagez')}">FRAME MANIA</a></p>${foot(c, { ctrText: 'Members:', ctrAfter: '(and counting)' })}</div>`);
  def('www.free100mb.webcom', '/terms.html', c => `<div class="dz dz-free" style="text-align:left;max-width:640px;margin:0 auto"><h1>Terms and Conditions</h1><ol style="font-size:11px"><li>"100 MB" means 12 KB.</li><li>"Free" means free, but you agree to have our banner at the top, the bottom and in the middle.</li><li>"No adverts" means some adverts.</li><li>Your page must not contain: anything rude, anything mean, anything about where you live, or any MIDI files longer than 4 minutes.</li><li>We may change these rules at any time, for example now.</li><li>By reading this, you agree to have read this.</li><li>If you got this far, you are the only person who ever has. Well done. Have a biscuit.</li></ol><p><a href="${u('www.free100mb.webcom', '/mypage.html')}">I agree (I didn't read it)</a></p>${foot(c)}</div>`);
  def('www.free100mb.webcom', '/mypage.html', c => {
    c.after.push(() => {
      const ta = c.q('textarea'), mine = c.q('.dz-mine'), m = c.q('.dz-meter i'), info = c.q('.dz-q');
      ta.value = store.get('jhp_eras_free', 'WELCOME 2 MY HOMEPAGE!!!\n\nThis is my page. It is under construction.\n\nMy hobbys: computers, pocket critters\n\nSign my guestbook (I have not got one)');
      const upd = () => { const n = new Blob([ta.value]).size; m.style.width = Math.min(100, n / QUOTA * 100) + '%'; m.style.background = n > QUOTA ? '#c00' : '#0a0'; info.textContent = `${(n / 1024).toFixed(1)} KB used of your 100 MB (12 KB)`; mine.textContent = ta.value.slice(0, QUOTA); if (n > QUOTA) { info.textContent += ' - QUOTA EXCEEDED! Delete some stuff!'; c.secret('eras.quota'); } };
      ta.addEventListener('input', upd); upd();
      c.on('.dz-save', 'click', () => { if (new Blob([ta.value]).size > QUOTA) { Desk.msgbox('Free100MB', 'Your page is over 12 KB (sorry, "100 MB"). Please make it smaller.', 'warn'); return; } store.set('jhp_eras_free', ta.value); c.sfx('pet'); Desk.msgbox('Free100MB', 'Page saved! It is now on the World Wide Web.*\n\n*on this computer only', 'info'); });
      c.on('.dz-fill', 'click', () => { ta.value += '\nWELCOME!!! '.repeat(800); upd(); });
    });
    return `<div class="dz dz-free"><h1>MY FREE PAGE</h1><div class="wad" style="margin:6px auto;width:auto;max-width:468px;box-sizing:border-box;border:2px solid #000;background:#ff0;font:bold 16px Impact,Arial;padding:10px">YOUR AD HERE!!! (it is our ad) CLICK!!!</div><p>Type your homepage below (plain text only, HTML is for Gold members).</p><textarea aria-label="Your homepage"></textarea><div class="dz-meter"><i></i></div><p class="dz-q"></p><p><button class="es-btn dz-save" type="button">Save to the Web</button> <button class="es-btn dz-fill" type="button">Add more WELCOME!!!</button></p><h3>Preview:</h3><div class="dz-mine"></div>${foot(c)}</div>`;
  });

  // ================================================================ ULTIMATE (FAKE) CHEATS
  const FAKE = [['Goldenballs 007', 'Hold L + R + C-Down for 10 hours to unlock MOM MODE (she tells you to go outside).'], ['Kazoo of Time', 'Play the Song of Storms 99 times at the Water Temple to drain it. (You will just get rained on.)'], ['Pocket Critters Red/Blue', 'Push the truck near the S.S. Anne to find Mew. (See Pocket Critters Secretz.)'], ['Blockology', 'Press SELECT 50 times to make every piece the long bar.'], ['Kart Kaos 64', 'Drive backwards round Rainbow Road 3 times to unlock a secret 9th driver.'], ['Space Jack Pinball', 'Tilt the table 100 times to win. (You will lose 100 times.)'], ['Driver', 'Pass the car park test. (There is no cheat for this. Nobody can do it.)'], ['Crypt Raider II', 'Lock the butler in the freezer. (He does not mind. He is used to it.)'], ['SkiJack', 'Ski past 2000m to meet a friendly monster who gives you a hug.'], ['Solitaire', 'Close your eyes and click. Whatever happens is a win.'], ['FIFA 99', 'Shout GOAL at the telly to score a goal.'], ['Any game', 'Blow in the cartridge. Then blow in it again. Then once more.']];
  def('www.ultimatecheatz.w3b', '/', c => `<div class="dz dz-cheat"><h1>ULTIMATE CHEAT CODES!!!</h1><p class="bl">FOR EVERY GAME!!! 100% REAL!!! TESTED BY EXPERTS!!!</p><table><tr><th>Game</th><th>Cheat</th><th>Works?</th></tr>${FAKE.map(([g, t]) => `<tr><td>${esc(g)}</td><td>${esc(t)}</td><td class="no">NO</td></tr>`).join('')}</table><p>For cheats that actually work: <a href="http://www.cheatz.w3b/">TOP 100 CHEATS</a> and <a href="http://www.jackfaqs.w3b/">JackFAQs</a>.</p>` + c.gb([['L33T_GR0T', '01/09/99', 'press start to start. WORKS EVERY TIME'], ['Dave', '14/07/99', 'If you hold B while turning the ULTRA 64 on you get 99 lives. (Dave)']], { title: 'Submit a Cheat (fake ones only)', btn: 'Submit', ph: 'Your totally real cheat...' }) + foot(c, { ctr: 'lcd' }) + '</div>');

  // ================================================================ POKEMON SECRETZ (1999 playground rumours)
  const RUM = [['MEW IS UNDER THE TRUCK', "There's a truck next to the S.S. Anne in Vermilion City. Everyone at school says if you use Strength on it, Mew is underneath. To get there you have to NOT leave the ship before it sails, which is not easy.", 'FALSE', 'I spent a whole Saturday on this. It is a truck. Just a truck. A lovely truck.', 1], ['PIKABLU', "A blue Zapachu with a round tail. My cousin says he saw a picture of it in a magazine. People call it Pikablu. Nobody can catch it in Red or Blue.", 'MAYBE', 'It might be a new Pocket Critters for the NEXT games (Gold and Silver). Not in ours, though.'], ['TOGEPI IN RED/BLUE', "Togepi is in the cartoon, so it must be in the game! You get it from an egg in Professor Oak's lab... say the playground.", 'FALSE', 'Not in Red or Blue. I checked everywhere. Twice.'], ["BILL'S SECRET GARDEN", "If you do something special after you beat the Elite Four, Bill lets you into his secret garden, where there are rare Pocket Critters (and Mew).", 'FALSE', "Bill is a nice man with a computer. He does not have a garden. He barely has a house."], ['THE GLITCH POCKET CRITTERS', "Talk to the old man in Viridian City, fly to Cinnabar and surf up and down the coast and a weird glitchy Pocket Critters appears.", 'TRUE', 'This one is REAL, but it can mess up your save and your Hall of Fame. DO NOT DO IT on a game you care about.'], ['MEWTOO HIDES IN A CAVE', 'The most powerful Pocket Critters is in a cave near Cerulean City, but you can only get in after the Elite Four.', 'TRUE', 'Real! Bring a Master Ball. Or 200 Ultra Balls and a lot of patience.'], ['BATTLE PROFESSOR OAK', "If you beat the Elite Four 100 times, Professor Oak challenges you to a battle.", 'FALSE', 'I beat them 4 times and he just said well done. Thanks Prof.']];
  def('www.pokesecretz.kidz', '/', c => {
    c.after.push(() => c.on('.dz-truck', 'click', () => { c.secret('eras.mew'); c.sfx('thud'); Desk.msgbox('Pocket Critters Secretz', 'You used STRENGTH on the truck!\n\n...\n\nThe truck did not move.\n\nThere is no Mew under the truck.\n\n(There never was. But you HAD to try. Everybody did.)', 'info'); }));
    return `<div class="dz dz-poke"><h1>POCKET CRITTERS SECRETZ!!!</h1><p style="text-align:center">Every playground rumour about Pocket Critters Red and Blue, TESTED by a professional (me, I'm 11). Stamped TRUE, FALSE or MAYBE.</p>
      ${RUM.map(([t, d, v, n, truck]) => `<div class="dz-rum"><h3>${esc(t)}</h3><p>${esc(d)}</p><p><span class="dz-stamp ${v === 'TRUE' ? 'true' : v === 'MAYBE' ? 'maybe' : ''}">${v}</span> ${esc(n)}</p>${truck ? '<p><button class="es-btn dz-truck" type="button">Use STRENGTH on the truck</button></p>' : ''}</div>`).join('')}
      <p style="text-align:center">Real facts: <a href="http://www.pokefacts.kidz/">${Cast.n('kidPoke')}'s Pocket Critters Facts Page</a> &middot; <a href="http://www.jackfaqs.w3b/faq/pokemon-rb.txt">The Red/Blue FAQ</a> &middot; <a href="http://www.holohut.kidz/">The Holo Hut</a></p>` + c.gb([['Dave', '08/10/99', 'I HEARD if you press A really fast on a Pokeball it always catches. (it does not)']], { title: 'Tell Us a Rumour!', ph: 'I heard that...' }) + foot(c) + '</div>';
  });

  // ================================================================ THE CHAIN LETTER
  def('www.forwardthis.w3b', '/', c => {
    c.after.push(() => {
      const end = c.q('.dz-end'); if (end && window.IntersectionObserver) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { c.secret('eras.chain'); io.disconnect(); } }); io.observe(end); c.off(() => io.disconnect()); }
      const k = 'eras.chain.fwd', show = v => { if (typeof v === 'number') c.q('.dz-fwd').textContent = v.toLocaleString('en-GB'); };
      c.get([k]).then(v => show(v[k])); c.watch(k, ev => { if (ev.type === 'set') show(ev.v); });
      c.on('.dz-send', 'click', () => { c.inc(k); c.sfx('pet'); if (window.WebPack && WebPack.mailto) WebPack.mailto('', 'FW: FW: FW: FW: FORWARD THIS TO 10 PEOPLE!!!'); else Desk.msgbox('Chain Letter', 'You forwarded it to 10 people. They are all slightly annoyed with you. Well done!', 'info'); });
    });
    return `<div class="dz dz-chain"><h1 style="color:#800">FW: FW: FW: FW: FW: READ THIS!!!!!</h1>
      <p>This letter has been around the world <b>NINE TIMES</b>. It started in 1993 with a man in a cupboard. Now it has come to YOU.</p>
      <p>Within 4 minutes of reading this, you must forward it to <b>10 PEOPLE</b>.</p>
      <p>A boy called Kevin forwarded it to 10 people and the next day he found a pound coin in the sofa.</p>
      <p>A girl called Stacey forwarded it to 20 people and her hamster learnt to whistle.</p>
      <p>A boy called Gary did NOT forward it, and within a WEEK...</p><p style="font-size:20px">...</p><p style="font-size:24px">......</p>
      <p>...his Mom made him <b>tidy his room</b>.</p><p>That's it. That's the curse. It's not real. <b>Chain letters are never real.</b> Nothing bad happens if you don't forward them. (Your room might need tidying anyway, though.)</p>
      <p><button class="es-btn dz-send" type="button">Forward to 10 people anyway</button><br><small>This letter has been forwarded <b class="dz-fwd">lots of</b> times by people who did not read to the end.</small></p><span class="dz-end"></span>${foot(c)}</div>`;
  });

  // ================================================================ FRAME MANIA (frames inside frames inside frames)
  def('www.framemania.homepagez', '/', c => {
    const PAGES = { home: 'Welcome to FRAME MANIA! This site uses FRAMES, the future of the web. Click the menu on the left!', about: 'About me: I love frames. I have put frames on everything. My bedroom window is a frame.', links: 'Links: my other frames site (it is this one).', guest: 'Guestbook: coming soon (it is in a frame somewhere).' };
    let depth = 0;
    const frame = (pg, d) => `<div class="dz-fr" style="font-size:${Math.max(6, 13 - d * 1.2)}px"><div class="dz-fr-nav"><b>MENU</b>${Object.keys(PAGES).map(p => `<a data-fm="${p}" data-d="${d}" tabindex="0">${p.toUpperCase()}</a>`).join('')}</div><div class="dz-fr-main">${PAGES[pg]}</div></div>`;
    c.after.push(() => {
      c.el.addEventListener('click', ev => {
        const a = ev.target.closest('[data-fm]'); if (!a) return;
        const main = a.closest('.dz-fr').querySelector('.dz-fr-main');
        depth = +a.dataset.d + 1;
        if (depth >= 7) { main.innerHTML = '<b style="color:#c00">ERROR: Too many frames. The frames have framed the frames.</b><br><a data-fm="home" data-d="-1" tabindex="0">Start again</a>'; c.secret('eras.frames'); c.sfx('uhoh'); return; }
        main.innerHTML = frame(a.dataset.fm, depth); c.sfx('click');
        if (+a.dataset.d === -1) c.q('.dz-frroot').innerHTML = frame('home', 0);
      });
    });
    return `<div class="dz" style="background:#ccf;font-family:Arial,sans-serif"><h1 style="color:#00c">FRAME MANIA!!!</h1><p class="bl">FRAMES ARE THE FUTURE</p><div class="dz-frroot" style="max-width:640px;margin:0 auto">${frame('home', 0)}</div><p style="font-size:11px">Your browser does not support frames? Then how are you seeing this?</p>${foot(c)}</div>`;
  });

  // ================================================================ NUTSCAPE ONLY
  def('www.nutscapeonly.netz', '/', c => {
    c.after.push(() => c.on('.dz-getnut', 'click', () => {
      const body = document.createElement('div'); body.style.cssText = 'padding:12px;font:12px Tahoma,sans-serif';
      body.innerHTML = '<p>Downloading <b>nutscape4.exe</b> (18.2 MB)...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="nst">Time left: 1 hour 52 minutes</p>';
      const w = A.win('Download - Nutscape Navigator 4', body, { w: 340, h: 170, noMax: true, noResize: true });
      const sp = body.querySelector('.prog span'); let n = 0;
      const iv = setInterval(() => { if (w.closed || !body.isConnected) return clearInterval(iv); n++; sp.insertAdjacentHTML('beforeend', '<i></i>'); body.querySelector('.nst').textContent = `Time left: ${Math.max(1, 112 - n * 9)} minutes`; if (n >= 12) { clearInterval(iv); w.close(); Desk.msgbox('Nutscape Setup', 'Nutscape Navigator cannot be installed because you are already using a web browser.\n\nWould you like to use the web browser you are already using?', 'q', [['Yes'], ['Also yes']]); } }, 300);
    }));
    return `<div class="dz dz-nut"><p><svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><rect width="60" height="60" fill="#000060"/><path d="M0 50 Q30 20 60 50" fill="#00a0ff"/><text x="30" y="40" text-anchor="middle" font-family="Times New Roman" font-weight="bold" font-size="34" fill="#fff">N</text></svg></p><h1 style="color:#000060">BEST VIEWED IN NUTSCAPE NAVIGATOR 4.0</h1>
      <p><b>WE HAVE DETECTED THAT YOU ARE USING: JackNet Explorer 5</b></p><p>This site uses the amazing &lt;LAYER&gt; tag and will NOT work properly in your browser. Please download Nutscape Navigator 4 (free!) and come back.</p>
      <p><button class="es-btn dz-getnut" type="button">Download Nutscape Navigator 4</button></p><p><a href="${u('www.nutscapeonly.netz', '/enter.html')}">Enter anyway (it will look rubbish)</a></p>${foot(c, { best: 'Best viewed in <b>Nutscape Navigator 4.0</b> at <b>640x480</b>. NOT JackNet Explorer.' })}</div>`;
  });
  def('www.nutscapeonly.netz', '/enter.html', c => {
    c.later(() => c.secret('eras.nutscape'), 400);
    const bits = [['WELCOME TO MY SITE', 10, 20, '#ff0', 0], ['This is my layer 1', 150, 30, '#0ff', 8], ['THIS IS MY LAYER 2 (it was supposed to be on the right)', 60, 50, '#f9f', -4], ['MY PICTURE', 200, 120, '#cfc', 15], ['Links', 20, 140, '#fcc', -10], ['Sign my guestbook', 120, 160, '#ccf', 3], ['(this text should be blinking)', 30, 220, '#fff', 0], ['FOOTER', 300, 10, '#ffa', 30], ['why is this here', 260, 260, '#aff', -20]];
    return `<div class="dz dz-nut"><p><b>Warning:</b> you are using JackNet Explorer. Some things may not be quite where they should be.</p><div class="lay">${bits.map(([t, x, y, bg, r]) => `<div style="left:${x}px;top:${y}px;background:${bg};transform:rotate(${r}deg)">${esc(t)}</div>`).join('')}</div><p>(In Nutscape it looks AMAZING. Probably.)</p>${foot(c)}</div>`;
  });

  // ================================================================ REQUIRES JACKFLASH (and then another plug-in, and another...)
  const PLUGS = [['JackFlash 4', 'JackMedia Inc.', 860], ['JackWave 7', 'JackMedia Inc.', 2300], ['JackPlayer G2', 'Jack Networks', 3900], ['Jack Virtual Machine (Java)', 'Jacksystems', 6200], ['JackTime 4', 'Jackple Computer', 5100]];
  def('www.jackflash-required.cyb', '/', c => {
    const st = () => store.get('jhp_eras_plugs', 0);
    const draw = () => {
      const n = st(), box = c.q('.dz-pbox');
      if (n >= PLUGS.length) { box.innerHTML = '<h1 style="color:#000">Welcome to my site.</h1><p>That\'s it. That was the site. Thanks for installing five plug-ins!</p><p><small>(Coming soon: a page that needs JackFlash 5.)</small></p>'; return; }
      const [nm, by, kb] = PLUGS[n];
      box.innerHTML = `<div class="box"><svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M10 6h20v10h-6v6h-8v-6h-6z" fill="#888" stroke="#000"/><rect x="17" y="22" width="6" height="12" fill="#c90"/></svg><div style="text-align:left">This page requires <b>${esc(nm)}</b>.<br><button class="es-btn dz-inst" type="button">Click here to install the plug-in</button><br><small>${kb} KB from ${esc(by)}</small></div></div>`;
      box.querySelector('.dz-inst').addEventListener('click', () => install(n));
    };
    const install = n => {
      const [nm, by, kb] = PLUGS[n];
      Desk.msgbox('Security Warning', `Do you want to install and run "${nm}"\nsigned and distributed by ${by}?\n\nCaution: ${by} asserts that this content is safe. You should only install it if you trust ${by} to make that assertion.\n\n(It is pretend. It is safe.)`, 'q', [['Yes', () => {
        const body = document.createElement('div'); body.style.cssText = 'padding:12px;font:12px Tahoma,sans-serif';
        body.innerHTML = `<p>Installing <b>${esc(nm)}</b>...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="pst">Copying files...</p>`;
        const w = A.win('Installing ' + nm, body, { w: 320, h: 160, noMax: true, noResize: true });
        const sp = body.querySelector('.prog span'); let i = 0;
        const msgs = ['Copying files...', 'Registering gerbils...', 'Teaching the plug-in to plug in...', 'Nearly there...', 'Restarting nothing...'];
        const iv = setInterval(() => { if (w.closed || !body.isConnected) return clearInterval(iv); i++; sp.insertAdjacentHTML('beforeend', '<i></i>'); body.querySelector('.pst').textContent = msgs[Math.min(4, Math.floor(i / 3))]; if (i >= 14) { clearInterval(iv); w.close(); store.set('jhp_eras_plugs', n + 1); c.sfx('solve'); if (n + 1 >= PLUGS.length) c.secret('eras.plugins'); if (c.el.isConnected) draw(); } }, 160 + n * 40);
      }], ['No']]);
    };
    c.after.push(draw);
    return `<div class="dz dz-plug"><h1 style="color:#c00">AN AMAZING MULTIMEDIA EXPERIENCE</h1><p>Sound! Animation! Video! Spinning things!</p><div class="dz-pbox"></div><p><small><a href="#" class="dz-reset">Uninstall all plug-ins</a></small></p>${foot(c)}</div>`;
  });
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('#s-secret .dz-reset'); if (!a) return; ev.preventDefault(); store.set('jhp_eras_plugs', 0); IE.navigate('http://www.jackflash-required.cyb/'); });

  // ================================================================ POP-UP MANIA (real windows, only a few, all closable)
  const POPS = [
    ['CONGRATULATIONS!!!', '<div style="background:#ff0;padding:10px;text-align:center;font:bold 14px Arial">YOU ARE THE 999,999th VISITOR!!!<br><br><a href="#" data-popgo="http://www.winbig.w3b/">CLAIM YOUR PRIZE!!!</a></div>'],
    ['FREE SCREENSAVER!', '<div style="background:#000;color:#0f0;padding:10px;text-align:center;font:bold 13px Arial">FREE FLYING TOASTERS... er... FLYING SAUCERS SCREENSAVER!!!<br><br><a href="#" data-popgo="http://www.downloadmoreram.w3b/" style="color:#ff0">DOWNLOAD NOW</a></div>'],
    ['Punch the Alien!', '<div style="background:#0af;padding:10px;text-align:center;font:bold 13px Arial">PUNCH THE ALIEN AND WIN!!!<br><button type="button" class="es-btn" data-popgrot="1" style="font-size:22px">&#9994;</button><div class="pg-n"></div></div>'],
  ];
  def('www.popupmania.w3b', '/', c => {
    const wins = [];
    const pop = (i, x, y) => {
      if (wins.filter(w => !w.closed).length >= 3) return;
      const [t, h] = POPS[i % POPS.length], body = document.createElement('div'); body.innerHTML = h;
      body.addEventListener('click', ev => {
        const a = ev.target.closest('[data-popgo]'); if (a) { ev.preventDefault(); w.close(); IE.navigate(a.dataset.popgo); return; }
        if (ev.target.closest('[data-popgrot]')) { const d = body.querySelector('.pg-n'); d.textContent = ['MISSED! Try again!', 'So close!', 'MISSED!', 'Nearly!'][Math.floor(Math.random() * 4)]; c.sfx('boing'); }
      });
      const w = A.win(t, body, { w: 270, h: 150, noMax: true, noMin: true, x, y });
      wins.push(w);
      const iv = setInterval(() => { if (w.closed) { clearInterval(iv); if (wins.length >= 3 && wins.every(z => z.closed) && c.el.isConnected) { c.secret('eras.popups'); c.q('.dz-pc').textContent = 'All pop-ups closed! You are a pop-up blocker! (A human one.)'; } } }, 500);
    };
    c.after.push(() => {
      c.later(() => pop(0, 80, 90), 900); c.later(() => pop(1, 260, 160), 1900); c.later(() => pop(2, 140, 260), 3100);
      c.on('.dz-closeall', 'click', () => wins.forEach(w => { if (!w.closed) w.close(); }));
      c.off(() => wins.forEach(w => { if (!w.closed) w.close(); }));
    });
    return `<div class="dz dz-pop"><h1>POP-UP MANIA!!!</h1><p class="bl"><b>FREE STUFF!!! PRIZES!!! JACKOS!!!</b></p><p>Welcome to the best site on the Internet! Please enjoy our special offers, which will appear in a moment.</p><p class="dz-pc">Pop-ups open: lots</p><p><button class="es-btn dz-closeall" type="button">Close all the pop-ups</button></p><p><small>(Pop-ups close when you leave the page. We are not monsters.)</small></p>${foot(c)}</div>`;
  });

  // ================================================================ THE RING OF FIRE-AND-GLITTER (hub)
  const FG = 'www.fireandglitter.homepagez';
  def(FG, '/', c => `<div class="dz dz-fg"><h1>THE RING OF FIRE-AND-GLITTER</h1><div class="dz-fire"></div><p>The webring for the <b>worst</b> sites on JackNet. Blinking text! Pop-ups! Counters going the wrong way! If your site is terrible, you belong here.</p><p><a href="${u(FG, '/list.html')}" style="font-size:20px">SEE ALL ${RINGL().length} MEMBER SITES</a></p><p>Random member: <a href="${u(RINGL()[Math.floor(Math.random() * RINGL().length)])}">GO!</a></p>` + c.gb([[Cast.n('kidY2k'), '11/11/99', 'Please can my Millennium Bunker join? It has a countdown AND a MIDI.'], [Cast.n('cousin'), '02/10/99', 'my page has 40 glitter gifs is that enough']], { title: 'Apply to Join the Ring', btn: 'Apply', ph: 'Why is your site terrible enough?' }) + foot(c) + '</div>');
  def(FG, '/list.html', c => `<div class="dz dz-fg"><h1>MEMBER SITES</h1><ol style="text-align:left;max-width:520px;margin:0 auto">${RINGL().map(h => `<li><a href="${u(h)}">${esc(((window.EraSiteList || []).find(r => r[0] === h) || [0, 0, (IE.sites[h.replace(/^www\./, '')] || {}).title || h])[2])}</a></li>`).join('')}</ol>${foot(c)}</div>`);
})();

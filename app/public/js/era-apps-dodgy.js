/* era-apps-dodgy: the dodgy shareware shelf, part 1 (lazy loaded by era-apps.js). Affectionate parodies of the junk
 * everybody's PC had in 1999: the fireworks e-mail attachment, a purple talking desktop pal, RAM Doubler, Modem Turbo,
 * Registry Fixer Pro, a Y2K survival suite, the archive tool nobody registered, and Dave's "joke" format program.
 * All harmless: nothing is sent, deleted or changed for real (the registry fixer borrows your wallpaper and gives it back). */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const { h, esc, store, pick, ri, rnd, sfx, note, pad } = E;
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  const msg = (t, s, i, b) => Desk.msgbox(t, s, i || 'info', b);
  const toast = (t, s, ms) => Desk.toast(t, s, ms || 4500);

  E.css('dodgy', `
.ed-hdr{display:flex;align-items:center;gap:10px;padding:8px 10px;color:#fff;margin:-6px -6px 8px;font:bold 18px/1.1 Arial,sans-serif;text-shadow:2px 2px 0 rgba(0,0,0,.5)}
.ed-hdr small{display:block;font:11px var(--ui);text-shadow:none;opacity:.9}
.ed-hdr span{width:32px;height:32px;flex:none;display:inline-flex}.ed-hdr svg{width:32px;height:32px}
.ed-big{font:bold 34px/1 Arial,sans-serif;text-align:center;margin:6px 0}
.ed-c{text-align:center}
.ed-fw canvas{display:block;width:100%;height:100%;background:#000}
.ed-fw{padding:0!important;background:#000}
.ed-bar{height:22px;margin:6px 0}
.ed-log{height:120px;overflow:auto;font:11px "Courier New",monospace;padding:3px;white-space:pre}
.ed-list{height:170px;overflow:auto;font:11px var(--ui)}
.ed-list table{width:100%;border-collapse:collapse}
.ed-list th{position:sticky;top:0;background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;font-weight:normal;text-align:left;padding:1px 4px;white-space:nowrap}
.ed-list td{padding:1px 4px;white-space:nowrap;cursor:default}
.ed-list tr.sel td{background:#000080;color:#fff}
.ed-leds{display:flex;gap:6px;justify-content:center;background:#e8e0d0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px 8px;border-radius:0 0 10px 10px}
.ed-leds div{display:flex;flex-direction:column;align-items:center;font:bold 9px Arial;color:#333;gap:2px}
.ed-leds i{width:8px;height:8px;border-radius:50%;background:#400;border:1px solid #200}
.ed-leds i.on{background:#f22;box-shadow:0 0 4px #f44}
.ed-leds i.g.on{background:#2f2;box-shadow:0 0 4px #4f4}
.ed-tool{display:flex;gap:2px;flex-wrap:wrap;margin-bottom:6px}
.ed-tool button{display:flex;flex-direction:column;align-items:center;font:11px var(--ui);min-width:52px;padding:2px 4px;background:var(--face);border:1px solid transparent;cursor:pointer}
.ed-tool button:hover{border-color:#fff #808080 #808080 #fff}
.ed-tool b{font-size:18px;line-height:20px}
.ed-run{position:relative}
.ed-cd{display:flex;gap:6px;justify-content:center;margin:8px 0}
.ed-cd div{background:#000;color:#f22;font:bold 26px "Courier New",monospace;padding:4px 8px;border:2px inset #808080;text-align:center;min-width:64px}
.ed-cd small{display:block;color:#ccc;font:10px var(--ui)}
.ed-chk label{display:flex;gap:6px;align-items:center;padding:2px 0}
.ed-pal{position:fixed;z-index:3350;bottom:40px;left:0;width:120px;height:140px;touch-action:none;transition:none}
.ed-pal canvas{width:120px;height:140px;display:block;cursor:pointer}
.ed-say{position:fixed;z-index:3351;width:250px;max-width:calc(100vw - 16px);background:#fff;border:2px solid #4a1a7a;border-radius:14px;padding:10px 12px;font:12px/1.4 "Comic Sans MS","Comic Sans",var(--ui);color:#2a0a4a;box-shadow:3px 3px 0 rgba(0,0,0,.25)}
.ed-say::after{content:"";position:absolute;left:34px;bottom:-12px;border-style:solid;border-color:#4a1a7a transparent transparent;border-width:12px 9px 0}
.ed-say .x{position:absolute;right:4px;top:3px;border:0;background:none;font:bold 13px Arial;color:#4a1a7a;cursor:pointer;min-width:24px;min-height:24px}
.ed-say .acts{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.ed-say .acts button{font:bold 11px var(--ui);background:#9a4ad8;color:#fff;border:1px solid #4a1a7a;border-radius:10px;padding:4px 8px;cursor:pointer;min-height:26px}
.ed-say .acts button:hover{background:#b06ae8}
`);
  const hdr = (icon, title, sub, bg) => `<div class="ed-hdr" style="background:${bg}"><span>${icon}</span><div>${title}${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  const bar = () => '<div class="prog ed-bar"><span style="display:flex;gap:2px"></span></div>';
  const setBar = (el, f) => { const sp = el.querySelector('span'), n = Math.round(Math.max(0, Math.min(1, f)) * Math.floor((el.clientWidth - 6) / 11)); while (sp.children.length < n) sp.appendChild(document.createElement('i')); while (sp.children.length > n) sp.lastChild.remove(); };

  // ================================================================ FIREWORKS.EXE (the e-mail attachment everybody got in 1999)
  E.mods.fireworks = K => {
    const b = K.body; b.classList.add('ed-fw'); K.w.setTitle('Happy New Year 1999 !!');
    const cv = document.createElement('canvas'); b.appendChild(cv);
    const g = cv.getContext('2d'); let raf = 0, last = 0, t = 0, W = 0, H = 0, done = false;
    const parts = [], rockets = [];
    const size = () => { const r = b.getBoundingClientRect(); W = cv.width = Math.max(100, r.width | 0); H = cv.height = Math.max(100, r.height | 0); };
    size(); addEventListener('resize', size); K.onClose(() => { removeEventListener('resize', size); cancelAnimationFrame(raf); if (!done) finish(); });
    const COLS = ['#ff4040', '#ffd400', '#40ff40', '#40c0ff', '#ff60ff', '#ffffff', '#ff9a20'];
    const loop = ts => {
      if (K.closed) return; raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; t += dt;
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, W, H);
      if (Math.random() < dt * 2.2) { rockets.push({ x: rnd(W * 0.15, W * 0.85), y: H, vx: rnd(-20, 20), vy: -rnd(H * 0.7, H * 1.05), c: pick(COLS), fuse: rnd(0.7, 1.1) }); }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 260 * dt; r.fuse -= dt;
        g.fillStyle = '#ffe'; g.fillRect(r.x, r.y, 2, 3);
        if (r.fuse <= 0) { rockets.splice(i, 1); sfx('zap'); const n = 40; for (let k = 0; k < n; k++) { const a = k / n * 6.283, sp = rnd(50, 120); parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: Math.random() < 0.2 ? '#fff' : r.c, life: rnd(1, 1.8) }); } }
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= 0.99; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life); g.fillRect(p.x, p.y, 2, 2); }
      g.globalAlpha = 1;
      g.font = `bold ${Math.max(14, W / 18 | 0)}px Arial`; g.textAlign = 'center'; g.fillStyle = `hsl(${t * 90 % 360},100%,60%)`; g.fillText('Happy New Year 1999 !!', W / 2, H * 0.88);
      if (t > 9 && !done) finish();
    };
    raf = requestAnimationFrame(loop);
    function finish() {
      done = true; E.secret('dodgy.happy');
      msg('FIREWORKS.EXE', 'FIREWORKS.EXE has finished.\n\nWhile you were watching the fireworks, FIREWORKS.EXE sent a copy of itself to everyone in your Address Book (47 people, including Gran, ' + Cast.n('teacher') + ' and the man from the bike shop).', 'warn', [['Oh no!', () => msg('FIREWORKS.EXE', "ONLY JOKING!\n\nIt didn't send anything to anyone. But a real one could have. In 1999 lots of e-mail attachments did exactly that.\n\nRULE: never open an .EXE that comes in an e-mail. Not even from Dave. ESPECIALLY not from Dave.", 'info')]]);
    }
  };

  // ================================================================ PURPLE PAL (a talking desktop buddy that "helps")
  let pal = null;
  const JOKES = [
    ['Why did the computer go to the doctor?', 'It had a VIRUS! Ha ha ha! I am hilarious!'],
    ['What do you call a robot with a Pentium?', 'A FAST robot! HAHAHA! Get it? GET IT?'],
    ['Why was the mouse scared of the keyboard?', 'Because of all the KEYS! No wait. That\'s not it. Hang on.'],
    ['What is a computer\'s favourite snack?', 'Micro-CHIPS! I\'ve been saving that one!'],
    ['Why did the modem break up with the phone?', 'Because Mom kept picking it up! HAHAHAHA!'],
    ['How many programmers does it take to change a light bulb?', 'None. That\'s a hardware problem! Ohoho!'],
    ['What do aliens put on their chips?', 'Space-ghetti sauce! I made that one up myself! You can tell!'],
    ['Knock knock!', 'Who\'s there? Y2K. Y2K who? Y2K-n\'t you get a better buddy? HAHAHA. No but seriously, I\'m great.'],
  ];
  const SONGS = ['web-hamster', 'web-dave', 'web-parcel', 'social.r2', 'theme'];
  function drawPal(g, s, t) {
    g.clearRect(0, 0, 120, 140);
    const walk = s.walking ? Math.sin(t * 10) : 0, talk = s.talking ? Math.abs(Math.sin(t * 14)) : 0, dance = s.dancing ? Math.sin(t * 7) : 0;
    g.save(); g.translate(60 + dance * 6, 0); g.scale(s.dir || 1, 1); g.translate(-60, 0);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(60, 134, 30, 5, 0, 0, 7); g.fill();
    // legs
    g.fillStyle = '#5a1a8a'; g.strokeStyle = '#2a0a4a'; g.lineWidth = 2;
    [[46, walk], [74, -walk]].forEach(([x, w]) => { g.beginPath(); g.ellipse(x + w * 5, 126 - Math.max(0, w) * 4, 11, 7, 0, 0, 7); g.fill(); g.stroke(); });
    // body
    g.fillStyle = '#8a3ac8'; g.beginPath(); g.ellipse(60, 98, 30, 28, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#c89ae8'; g.beginPath(); g.ellipse(60, 104, 18, 18, 0, 0, 7); g.fill();
    // arms (one waves)
    const wave = s.waving ? Math.sin(t * 12) * 0.5 : 0, up = s.dancing ? 1.2 + dance * 0.5 : 0;
    g.strokeStyle = '#8a3ac8'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(34, 90); g.lineTo(18 + walk * 3, 112 - up * 30); g.stroke();
    g.beginPath(); g.moveTo(86, 90); g.lineTo(104 + Math.sin(wave) * 8, s.waving ? 60 : 112 - up * 30); g.stroke();
    // head
    g.lineWidth = 2; g.strokeStyle = '#2a0a4a';
    g.fillStyle = '#8a3ac8'; g.beginPath(); g.ellipse(60, 46, 30, 28, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(31, 44, 7, 9, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(89, 44, 7, 9, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#d8b0f0'; g.beginPath(); g.ellipse(60, 56, 20, 15, 0, 0, 7); g.fill();
    // eyes
    const blink = (t % 4) < 0.12;
    [[49, 38], [71, 38]].forEach(([x, y]) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 7, blink ? 1 : 8, 0, 0, 7); g.fill(); g.stroke(); if (!blink) { g.fillStyle = '#000'; g.beginPath(); g.arc(x + 2, y + 1, 3.4, 0, 7); g.fill(); } });
    // mouth
    g.fillStyle = '#3a0a2a'; g.beginPath(); g.ellipse(60, 60, 11, 3 + talk * 6, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#fff'; g.fillRect(53, 60, 14, 2);
    g.restore();
    if (s.dancing) { g.fillStyle = '#ffd400'; g.font = 'bold 16px Arial'; g.fillText('\u266B', 4 + (t * 40 % 20), 30); g.fillText('\u266A', 96, 22 + Math.sin(t * 5) * 4); }
  }
  E.mods.buddy = () => {
    if (pal && pal.el.isConnected) { pal.say("I'm already here, buddy! Did you miss me? I missed you! I always miss you!", true); return; }
    const el = h('div', 'ed-pal'); el.innerHTML = '<canvas width="240" height="280" aria-label="Purple Pal"></canvas>';
    DesktopSurface.root().appendChild(el);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'); g.scale(2, 2);
    const s = { walking: true, dir: 1, talking: false, waving: false, dancing: false };
    let x = -130, tx = Math.min(DesktopSurface.width() - 140, Math.max(20, DesktopSurface.width() * 0.12)), raf = 0, bubble = null, talkTimer = 0, gone = false, songT = 0, homeDone = store.get('jhp_era_palhome', 0);
    pal = { el, say };
    el.style.left = x + 'px';
    const loop = ts => {
      if (!el.isConnected) return; raf = requestAnimationFrame(loop);
      const t = ts / 1000;
      if (s.walking) { const d = tx - x, st = Math.sign(d) * Math.min(Math.abs(d), 2.2); s.dir = st < 0 ? -1 : 1; x += st; el.style.left = x + 'px'; if (Math.abs(d) < 1) { s.walking = false; if (gone) { cleanup(); return; } } }
      if (bubble) placeBubble();
      drawPal(g, s, t);
    };
    raf = requestAnimationFrame(loop);
    function cleanup() { cancelAnimationFrame(raf); clearInterval(talkTimer); el.remove(); if (bubble) bubble.remove(); bubble = null; if (Sound.music.playing && SONGS.includes(Sound.music.playing) && songT) Sound.music.stop(); pal = null; }
    function placeBubble() { const r = DesktopSurface.rect(el), bw = bubble.offsetWidth, bh = bubble.offsetHeight; bubble.style.left = Math.max(8, Math.min(DesktopSurface.width() - bw - 8, r.left + 30)) + 'px'; bubble.style.top = Math.max(4, r.top - bh - 6) + 'px'; }
    function say(text, menu) {
      if (bubble) bubble.remove();
      bubble = h('div', 'ed-say'); bubble.setAttribute('role', 'dialog'); bubble.setAttribute('aria-label', 'Purple Pal says');
      bubble.innerHTML = `<button class="x" type="button" aria-label="Close">x</button><div class="tx"></div>${menu ? '<div class="acts"><button data-a="joke">Tell me a joke</button><button data-a="sing">Sing me a song</button><button data-a="web">Search the web</button><button data-a="mail">Check my e-mail</button><button data-a="bye">Goodbye</button></div>' : ''}`;
      DesktopSurface.root().appendChild(bubble); placeBubble();
      const tx = bubble.querySelector('.tx'); let i = 0; s.talking = true; clearInterval(talkTimer);
      talkTimer = setInterval(() => { i += 2; tx.textContent = text.slice(0, i); if (i % 4 === 0 && Sound.on) note(rnd(180, 320), 0.05, 'square'); if (i >= text.length) { clearInterval(talkTimer); s.talking = false; } placeBubble(); }, 40);
      bubble.querySelector('.x').addEventListener('click', bye);
      bubble.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => act(b.dataset.a)));
    }
    function act(a) {
      s.dancing = false; if (songT) { clearTimeout(songT); songT = 0; if (SONGS.includes(Sound.music.playing)) Sound.music.stop(); }
      if (a === 'joke') { const j = pick(JOKES); say(j[0], false); setTimeout(() => { if (pal && pal.el === el) say(j[1] + (Math.random() < 0.3 ? ' Want another one? I have THOUSANDS.' : ''), true); }, 2600); }
      if (a === 'sing') {
        s.dancing = true; E.secret('dodgy.buddy');
        say(Sound.on ? "La la laaa! This one's called 'Daisy, Daisy, I'm a Pal'. I wrote it myself! In a computer!" : "La la laaa! (Your sound is off, so I'm singing in my head. It sounds AMAZING in here.)", true);
        if (Sound.on) { Sound.music.play(pick(SONGS)); songT = setTimeout(() => { songT = 0; s.dancing = false; if (SONGS.includes(Sound.music.playing)) Sound.music.stop(); }, 14000); } else setTimeout(() => { s.dancing = false; }, 6000);
      }
      if (a === 'web') { say("Let's surf the Information Superhighway! I'll take you to my favourite page. It's the BEST page. It's about you! (It's the JACK ATTACK! home page.)", true); setTimeout(() => { const br = document.getElementById('browser'); if (br) br.classList.remove('min'); if (window.IE) IE.go('home', 'click'); }, 2400); }
      if (a === 'mail') say(pick(["You have no new e-mail. Would you like to BUY some e-mail? Only $9.95 a month!", "You have 1 new e-mail! It's from me! It says: 'Hi buddy!' I'll read it out: HI BUDDY!", "Checking... checking... the modem is busy. Mom is on the phone to " + Cast.n('auntie') + ". Again."]), true);
      if (a === 'bye') bye();
    }
    function bye() { if (gone) return; gone = true; if (bubble) { bubble.remove(); bubble = null; } s.talking = false; s.dancing = false; s.waving = true; tx = -140; setTimeout(() => { s.waving = false; s.walking = true; }, 800); }
    cv.addEventListener('click', () => { if (!gone) say(pick(["Yes, buddy? What can I do for you?", "You clicked me! We're best friends now. That's the rules.", "I'm Purple Pal! I'm here to help! Mostly I'm here."]), true); });
    cv.addEventListener('contextmenu', ev => { ev.preventDefault(); IE.menu([{ label: 'Tell me a joke', act: () => act('joke') }, { label: 'Sing a song', act: () => act('sing') }, '-', { label: 'Goodbye, Purple Pal', act: bye }], ev.clientX, ev.clientY); });
    setTimeout(() => { s.waving = true; say("Hiya, buddy! I'm PURPLE PAL, your new best friend! I can tell jokes, sing songs and help you surf the World Wide Web! What shall we do?", true); setTimeout(() => { s.waving = false; }, 2000); }, 1600);
    if (!homeDone) setTimeout(() => { if (!pal) return; store.set('jhp_era_palhome', 1); toast('Purple Pal', "I set your home page to www.purplepal.netz and your search page to PalSearch! You're welcome, buddy! (It didn't really. Pal software in 1999 usually did, though.)", 7000); }, 12000);
  };

  // ================================================================ RAM DOUBLER 99
  E.mods.ramdbl = K => {
    const b = K.body; let mb = 32, busy = false;
    b.innerHTML = `${hdr(E.I.ramdbl, 'RAM Doubler 99', 'Unregistered version. Doubles up to 4 GB.', 'linear-gradient(90deg,#0a6a2a,#2ac85a)')}
      <div class="group"><span class="lg">Your computer</span><div class="ed-c">Installed memory (RAM):</div><div class="ed-big ed-mb">32 MB</div><div class="ed-c small ed-sub">Pentium II 300 MHz, 32 MB RAM, 4.3 GB hard disk</div></div>
      ${bar()}<div class="small ed-st" style="min-height:30px">Click DOUBLE MY RAM! to begin. No screwdriver needed!</div>
      <div class="row" style="justify-content:center;margin-top:6px"><button class="btn big ed-go">DOUBLE MY RAM!</button><button class="btn ed-close">Close</button></div>`;
    const q = s => b.querySelector(s), pb = q('.ed-bar');
    q('.ed-close').addEventListener('click', K.w.close);
    const STEPS = ['Scanning memory chips...', 'Squashing the 0s and 1s closer together...', 'Folding RAM in half...', 'Downloading more RAM from JackNet...', 'Asking the RAM nicely...', 'Blowing on the chips...', 'Doubling...'];
    q('.ed-go').addEventListener('click', () => {
      if (busy) return; busy = true; let k = 0; q('.ed-go').disabled = true;
      const tm = setInterval(() => {
        if (K.closed) return clearInterval(tm);
        k++; setBar(pb, k / 40); if (k % 6 === 0) q('.ed-st').textContent = STEPS[(k / 6 - 1) % STEPS.length];
        if (k >= 40) {
          clearInterval(tm); busy = false; q('.ed-go').disabled = false; setBar(pb, 0);
          if (mb >= 2048) {
            E.secret('dodgy.ram'); mb = 32; q('.ed-mb').textContent = '32 MB'; sfx('uhoh');
            q('.ed-st').textContent = 'ERROR: RAM OVERFLOW. Back to 32 MB.';
            msg('RAM Doubler 99', 'RAM OVERFLOW!\n\nYou have doubled your RAM too many times. The extra RAM has fallen out of the back of the computer and rolled under the desk.\n\nPlease sweep it up. Your RAM is now 32 MB again.', 'warn');
            return;
          }
          mb *= 2; q('.ed-mb').textContent = fmt(mb) + ' MB'; sfx('solve');
          q('.ed-st').textContent = mb >= 1024 ? `You now have ${fmt(mb)} MB of RAM. That's more than NASA. Probably.` : mb >= 256 ? `${fmt(mb)} MB! Your computer is now TWICE as fast as before! (It is exactly the same speed.)` : `Success! You now have ${mb} MB of RAM! (System Properties still says 32 MB. It's jealous.)`;
          q('.ed-go').textContent = 'DOUBLE IT AGAIN!';
        }
      }, 70);
    });
  };

  // ================================================================ MODEM TURBO 300%
  E.mods.modem = K => {
    const b = K.body; let turbo = 100, on = false, blink = 0, restoreT = 0;
    b.innerHTML = `${hdr(E.I.modem, 'Modem Turbo 300%', 'Patented TurboTune\u2122 technology', 'linear-gradient(90deg,#8a0a0a,#e84a1a)')}
      <div class="field" style="padding:8px;text-align:center;background:#000;color:#3f3;font:bold 13px 'Courier New',monospace" aria-live="polite"><span class="ed-con">Connected at 49,333 bps</span></div>
      <div class="ed-leds">${['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR', 'MR'].map((l, i) => `<div><i class="${i > 5 ? 'g ' : ''}${[0, 2, 3, 6, 7].includes(i) ? 'on' : ''}" data-l="${l}"></i>${l}</div>`).join('')}</div>
      <div class="group"><span class="lg">TurboTune</span><div class="row"><span>100%</span><input type="range" class="ed-tt" min="100" max="300" step="10" value="100" style="flex:1" aria-label="Turbo amount"><span>300%</span></div><div class="ed-c"><b class="ed-pc">100%</b> speed</div></div>
      <div class="row" style="justify-content:center"><button class="btn big ed-go">Apply TurboTune</button><button class="btn ed-test">Speed Test</button><button class="btn ed-close">Close</button></div>
      <div class="small ed-st" style="margin-top:6px;min-height:28px"></div>`;
    const q = s => b.querySelector(s);
    q('.ed-close').addEventListener('click', K.w.close);
    q('.ed-tt').addEventListener('input', e => { turbo = +e.target.value; q('.ed-pc').textContent = turbo + '%'; });
    const leds = () => { blink++; b.querySelectorAll('[data-l=RD],[data-l=SD]').forEach((l, i) => l.classList.toggle('on', on ? Math.random() < 0.7 : (blink + i) % 7 === 0)); };
    const lt = setInterval(leds, 120); K.onClose(() => { clearInterval(lt); if (restoreT) { clearTimeout(restoreT); try { Sound.setVolume(1); } catch (e) {} } });
    q('.ed-go').addEventListener('click', () => {
      on = true; const sp = Math.round(49333 * turbo / 100);
      q('.ed-con').textContent = `Connected at ${fmt(sp)} bps${turbo > 100 ? ' (TURBO!)' : ''}`;
      if (turbo >= 300) E.secret('dodgy.modem');
      if (Sound.on) {
        try { Sound.setVolume(Math.min(1, turbo / 300 + 0.2)); } catch (e) {}
        Sound.play('modem'); clearTimeout(restoreT); restoreT = setTimeout(() => { restoreT = 0; try { Sound.setVolume(1); } catch (e) {} on = false; }, 9000);
        q('.ed-st').textContent = `TurboTune applied! Your modem is now ${turbo}% LOUDER. Loud modems are fast modems. Everybody knows that.`;
      } else { setTimeout(() => { on = false; }, 4000); q('.ed-st').textContent = `TurboTune applied at ${turbo}%! (Your sound is off, so the turbo is silent. Silent turbo is the fastest kind.)`; }
    });
    q('.ed-test').addEventListener('click', () => {
      q('.ed-st').textContent = 'Testing: downloading a 3 MB file...';
      setTimeout(() => { if (!K.closed) q('.ed-st').textContent = `Speed test: 3 MB in about 10 minutes. Before TurboTune: 3 MB in about 10 minutes. That's a ${turbo}% improvement!*  (*0%)`; }, 1800);
    });
  };

  // ================================================================ REGISTRY FIXER PRO 99
  E.mods.regfix = K => {
    const b = K.body; let scanned = false, fixed = false, wallWas = null;
    const HK = ['HKEY_LOCAL_MACHINE\\Software', 'HKEY_CURRENT_USER\\Software', 'HKEY_CLASSES_ROOT', 'HKEY_USERS\\.DEFAULT', 'HKEY_CURRENT_CONFIG\\Display'];
    const BITS = ['JackSoft', 'JackOS\\CurrentVersion', 'JackAmp\\Playlist', 'Dave\\Homework', 'Uh-Oh\\Contacts', 'SoundBlaster16', 'Gubbinz\\Snacks', 'Explorer\\Shell Folders', 'Bugsweeper\\BestTimes', 'Fonts\\Comic Sans', 'Mom\\PhoneBill', 'Y2K\\Panic'];
    const ERRS = [['Critical', 'HKCU\\Software\\Dave\\Homework', 'Missing value (has always been missing)'], ['Severe', 'HKLM\\Software\\Gubbinz\\Snacks', 'Too many jelly babies (4,000)'], ['Critical', 'HKCR\\.doc', 'Points to a program from 1992'], ['Wobbly', 'HKCU\\Control Panel\\Desktop\\Wallpaper', 'Wallpaper is too nice'], ['Severe', 'HKLM\\Software\\JackAmp', 'Volume set to 11'], ['Critical', 'HKCU\\Software\\Mom\\PhoneBill', 'Value too large'], ['Minor', 'HKLM\\Hardware\\Mouse\\Ball', 'Fluff detected'], ['Severe', 'HKCU\\Software\\Uh-Oh\\Sounds', 'Says "uh-oh" too much'], ['Critical', 'HKLM\\System\\Clock\\Year', 'Only two digits (Y2K!)'], ['Minor', 'HKCU\\Software\\Bugsweeper', 'Best time is suspicious']];
    b.innerHTML = `${hdr(E.I.regfix, 'Registry Fixer Pro 99', 'Is your PC slow? It could be REGISTRY ERRORS!', 'linear-gradient(90deg,#00307a,#2a7ad8)')}
      <div class="row"><button class="btn big ed-scan">SCAN NOW (FREE!)</button><button class="btn ed-fix" disabled>FIX ALL ERRORS</button><span style="flex:1"></span><b class="ed-n" style="color:#c00">Errors: 0</b></div>
      ${bar()}<div class="field ed-log" aria-live="polite"></div>`;
    const q = s => b.querySelector(s), pb = q('.ed-bar'), log = q('.ed-log');
    K.status('Ready. Registry last scanned: never. (That is VERY dangerous.)');
    K.menus([['File', [{ label: 'Restore wallpaper from backup', dis: () => !fixed, act: restore }, '-', { label: 'Exit', act: K.w.close }]], ['Help', [{ label: 'Register Registry Fixer Pro...', act: register }, { label: 'About Registry Fixer Pro', act: () => E.about('Registry Fixer Pro 99', E.I.regfix, ['<b>Registry Fixer Pro 99</b> version 4.0', 'Finds thousands of errors on every PC. Even brand new ones. Even ones that are switched off.', 'CleanPC Solutions accepts no responsibility for lost wallpapers.']) }]]]);
    const line = t => { log.textContent += t + '\n'; log.scrollTop = log.scrollHeight; };
    q('.ed-scan').addEventListener('click', () => {
      log.textContent = ''; q('.ed-scan').disabled = true; q('.ed-fix').disabled = true; let k = 0, n = 0;
      const tm = setInterval(() => {
        if (K.closed) return clearInterval(tm);
        k++; n += ri(40, 160); setBar(pb, k / 50); q('.ed-n').textContent = 'Errors: ' + fmt(Math.min(n, 4812));
        line(`Scanning ${pick(HK)}\\${pick(BITS)}... ${Math.random() < 0.6 ? 'ERROR' : 'ok'}`);
        K.status(`Scanning... ${k * 2}%`);
        if (k >= 50) {
          clearInterval(tm); setBar(pb, 1); q('.ed-n').textContent = 'Errors: 4,812';
          log.textContent = 'SCAN COMPLETE. 4,812 ERRORS FOUND!\n\n' + ERRS.map(([lv, k2, d]) => `[${lv.toUpperCase()}] ${k2}\n    ${d}`).join('\n') + '\n...and 4,802 more!\n';
          K.status('4,812 errors found! Your PC could crash AT ANY MOMENT. Click FIX ALL ERRORS.'); sfx('uhoh');
          q('.ed-scan').disabled = false; q('.ed-fix').disabled = false; scanned = true;
        }
      }, 60);
    });
    q('.ed-fix').addEventListener('click', () => {
      if (!scanned) return; q('.ed-fix').disabled = true; let k = 0; log.textContent = '';
      const tm = setInterval(() => {
        if (K.closed) return clearInterval(tm);
        k++; setBar(pb, k / 30); line(k < 28 ? `Fixing error ${fmt(k * 171)}... fixed` : 'Fixing error 4,812 (Wallpaper is too nice)... deleting wallpaper');
        if (k >= 30) {
          clearInterval(tm); const d = document.getElementById('desktop');
          if (d && !fixed) { wallWas = d.style.background; d.style.background = '#008080'; fixed = true; }
          E.secret('dodgy.regfix'); sfx('solve');
          line('\nALL 4,812 ERRORS FIXED!\nYour PC is now 0% faster.\n\n(Your wallpaper was deleted to fix error 4,812. You can get it back with File > Restore, or by closing Registry Fixer Pro.)');
          K.status('Fixed! Run another scan to make sure. (It will find 4,812 errors again. It always does.)');
          setTimeout(() => { if (!K.closed) msg('Registry Fixer Pro 99', 'Thank you for using the FREE version!\n\nTo fix the OTHER 4,812 errors that have just appeared, please register Registry Fixer Pro for only $29.95.', 'info', [['Register...', register], ['Later']]); }, 900);
        }
      }, 70);
    });
    function restore() { const d = document.getElementById('desktop'); if (fixed && d) { d.style.background = wallWas || ''; fixed = false; toast('Registry Fixer Pro', 'Your wallpaper crawled back out of the Recycle Bin. Phew.'); } }
    function register() { msg('Register Registry Fixer Pro', 'To register, send a cheque for $29.95 to CleanPC Solutions, somewhere in America.\n\nPlease allow 28 days for delivery of your registration code. On a floppy disk. By post.', 'info'); }
    K.onClose(restore);
  };

  // ================================================================ Y2K SURVIVAL SUITE 99 DELUXE
  E.mods.y2ksuite = K => {
    const b = K.body;
    const KIT = [['beans', 'Tins of beans', 24], ['opener', 'A tin opener (DON\'T FORGET)', 1], ['water', 'Bottles of water', 12], ['torch', 'Torches', 2], ['batt', 'Batteries (big ones)', 16], ['candles', 'Candles', 10], ['gameboy', 'Game Lad + spare AA batteries', 1], ['cube', "Rubrick's cube (entertainment)", 1], ['blanket', 'Blankets', 4], ['radio', 'Wind-up radio', 1], ['biscuits', 'Biscuits (emergency)', 3], ['cash', 'Cash (in case the cash machines think it\'s 1900)', 1]];
    const got = store.get('jhp_era_y2kkit', {});
    const APPL = [['Toaster', "Your toaster thinks it's 1900 and is making toast for Queen Victoria. FAIL."], ['Video recorder', 'The clock was already flashing 00:00. It has flashed 00:00 since 1994. PASS (no change).'], ['Microwave', 'Microwave set to 01/01/1900. It is now defrosting a pie from the past. FAIL.'], ['Digital watch', 'Watch says MO 01. It does not know which year it is. It never did. PASS.'], ['Furby', 'Furby says "me sleep". Furby does not care about the year. PASS.'], ['Eggbert', 'Eggbert is now 100 years old. It needs feeding. FAIL.'], ["Gran's Teasmade", 'Teasmade made tea at 00:00. Gran is pleased. PASS.'], ['Dad\'s car', 'The car is from 1987 and has no computer. It just has a tape deck. PASS.'], ['Gubbinz', 'Gubbinz is a desktop helper. Helpers do not use calendars. PASS (he ate the calendar).']];
    b.innerHTML = `<div class="tabs"><span data-t="0" class="on">Countdown</span><span data-t="1">Bunker Planner</span><span data-t="2">Appliance Tester</span><span data-t="3">BIOS Check</span></div><div class="tabpage ed-pg" style="min-height:250px"></div>`;
    const pg = b.querySelector('.ed-pg'); let tab = 0, tick = 0;
    K.menus([['File', [{ label: 'Print Emergency Leaflet', act: leaflet }, '-', { label: 'Exit', act: K.w.close }]], ['Help', [{ label: 'About Y2K Survival Suite', act: () => E.about('Y2K Survival Suite 99 Deluxe', E.I.y2ksuite, ['<b>Y2K Survival Suite 99 Deluxe</b> version 1.999', 'Is YOUR family ready for the Millennium Bug?', 'The "Millennium Bug" is real: some old computers store the year as two digits, so 2000 looks like 1900. Engineers have spent years fixing it. Your toaster is probably fine.']) }]]]);
    const until = () => { const t = E.today(), n = new Date(); const now = new Date(1999, t.m - 1, t.d, n.getHours(), n.getMinutes(), n.getSeconds()); return Math.max(0, (new Date(2000, 0, 1) - now) / 1000); };
    const draw = () => {
      clearInterval(tick);
      b.querySelectorAll('.tabs span').forEach(s => s.classList.toggle('on', +s.dataset.t === tab));
      if (tab === 0) {
        pg.innerHTML = `<div class="ed-c"><b>Time left until the Millennium:</b></div><div class="ed-cd"></div><p class="ed-c small">Recommended action: <b class="ed-adv"></b></p>`;
        const up = () => { const s = until(), d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = Math.floor(s % 60); pg.querySelector('.ed-cd').innerHTML = [[d, 'DAYS'], [pad(hh), 'HRS'], [pad(mm), 'MINS'], [pad(ss), 'SECS']].map(([v, l]) => `<div>${v}<small>${l}</small></div>`).join(''); pg.querySelector('.ed-adv').textContent = d > 200 ? 'Relax. Buy one tin of beans.' : d > 60 ? 'Start buying beans. Calmly.' : d > 7 ? 'Check the tin opener works.' : d > 0 ? 'Get in the bunker (the shed).' : 'Party like it\'s 1999! (It is.)'; K.status(`${d} days to go. Readiness: ${ready()}%`); };
        up(); tick = setInterval(up, 1000);
      } else if (tab === 1) {
        pg.innerHTML = `<p style="margin:0 0 6px">Tick what you've got in the bunker (the shed):</p><div class="ed-chk" style="columns:2;column-gap:12px">${KIT.map(([k, l, n]) => `<label><input type="checkbox" data-k="${k}"${got[k] ? ' checked' : ''}> ${n > 1 ? n + ' x ' : ''}${esc(l)}</label>`).join('')}</div><p class="ed-c"><b>Readiness: <span class="ed-r"></span>%</b></p>`;
        const up = () => { pg.querySelector('.ed-r').textContent = ready(); K.status(`Readiness: ${ready()}%`); };
        pg.querySelectorAll('[data-k]').forEach(c => c.addEventListener('change', () => { got[c.dataset.k] = c.checked; store.set('jhp_era_y2kkit', got); up(); if (ready() === 100) { E.secret('dodgy.y2k'); msg('Y2K Survival Suite', 'CONGRATULATIONS! Your bunker is 100% ready for the Millennium!\n\nYou have 24 tins of beans and one tin opener. You can survive for 24 meals. Or 8 days. Or one evening, if Dave comes round.', 'info'); } }));
        up();
      } else if (tab === 2) {
        pg.innerHTML = `<p style="margin:0 0 6px">Pick an appliance and we'll set its clock to 31/12/1999 23:59:59 and see what happens at midnight:</p><div class="row"><select class="ed-ap">${APPL.map(([n], i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select><button class="btn ed-tst">Test it!</button></div>${bar()}<div class="field" style="padding:6px;min-height:60px;margin-top:6px" aria-live="polite"><span class="ed-res">Ready.</span></div>`;
        pg.querySelector('.ed-tst').addEventListener('click', () => {
          const [n, r] = APPL[+pg.querySelector('.ed-ap').value]; let k = 0; const res = pg.querySelector('.ed-res'), pb = pg.querySelector('.ed-bar');
          clearInterval(tick); tick = setInterval(() => { k++; setBar(pb, k / 20); res.textContent = `${n}: 23:59:${pad(50 + Math.floor(k / 2))}...`; if (k >= 20) { clearInterval(tick); res.textContent = `${n}: 00:00:00 ... ${r}`; sfx(/FAIL/.test(r) ? 'uhoh' : 'pet'); } }, 120);
        });
      } else {
        pg.innerHTML = `<div class="field" style="background:#000;color:#c0c0c0;font:12px 'Courier New',monospace;padding:8px;white-space:pre;min-height:200px;overflow:auto" aria-live="polite"></div>`;
        const f = pg.querySelector('.field'), L = ['Award-ish Modular BIOS v4.51PG', 'Checking real-time clock...', 'Current date: ' + pad(E.today().d) + '/' + pad(E.today().m) + '/1999', 'Rolling clock forward to 31/12/1999 23:59:59...', 'Waiting for midnight...', '', 'Date is now: 01/01/1900', '', 'RESULT: PASS*', '', '*1900 is quite close to 2000. Only 100 years out.', ' Install the free JackOS Y2K patch to fix it properly', ' (Accessories > System Tools > Y2K Checker).'];
        let i = 0; clearInterval(tick); tick = setInterval(() => { if (i >= L.length) return clearInterval(tick); f.textContent += L[i++] + '\n'; }, 380);
      }
    };
    const ready = () => Math.round(KIT.filter(([k]) => got[k]).length / KIT.length * 100);
    function leaflet() { Apps.openFile({ name: 'Y2K LEAFLET.txt', type: 'txt', text: "WHAT TO DO ON 31 DECEMBER 1999\n==============================\n\n1. Have your tea.\n2. Watch the fireworks on the telly.\n3. At midnight, check the lights still work. (They will.)\n4. Check the toaster. (It will be fine.)\n5. Go to bed.\n6. On 1 January, eat one tin of beans to celebrate surviving.\n\nPrinted by Y2K Survival Suite 99 Deluxe (Unregistered)\n" }); }
    b.querySelectorAll('.tabs span').forEach(s => s.addEventListener('click', () => { tab = +s.dataset.t; draw(); }));
    K.onClose(() => clearInterval(tick));
    draw();
  };

  // ================================================================ WINJACK (the archive program nobody ever registered)
  const ARCH = {
    'homework_FINAL_v3.sqg': [['homework.doc', 0, '12/09/99'], ['homework_final.doc', 0, '13/09/99'], ['homework_FINAL_v2.doc', 0, '13/09/99'], ['excuse.txt', 812, '14/09/99']],
    'dave_games.sqg': [['DAKKA.EXE', 342016, '02/03/99'], ['DAKKA.DAT', 1203112, '02/03/99'], ['README.TXT', 2210, '02/03/99'], ['cheats_DO_NOT_LOOK.txt', 640, '05/03/99']],
    'painted_minis.sqg': [['space_marine.bmp', 230454, '21/06/99'], ['ork_trukk.bmp', 230454, '21/06/99'], ['eldar_wip.bmp', 230454, '22/06/99'], ['xwing_model.bmp', 230454, '23/06/99']],
    'jack_attack_issue1.sqg': [['index.htm', 14211, '01/01/99'], ['logo.gif', 8800, '01/01/99'], ['under_construction.gif', 3120, '01/01/99'], ['counter.cgi', 1024, '01/01/99'], ['midi.mid', 9216, '01/01/99']],
  };
  E.mods.winsquig = K => {
    const b = K.body; let cur = null, sel = -1;
    const days = 1000 + Math.floor((Date.now() / 86400000) % 300) + 42;
    b.innerHTML = `<div class="ed-tool">${[['New', '\u2731'], ['Open', '\u{1F4C2}'], ['Favorites', '\u2605'], ['Add', '\u271A'], ['Extract', '\u21E9'], ['View', '\u{1F441}'], ['CheckOut', '\u2714'], ['Wizard', '\u2728']].map(([l, i]) => `<button data-a="${l}"><b>${i}</b>${l}</button>`).join('')}</div><div class="field ed-list"><table><thead><tr><th>Name</th><th>Date</th><th>Size</th><th>Ratio</th><th>Packed</th></tr></thead><tbody></tbody></table></div>`;
    const tb = b.querySelector('tbody');
    const render = () => {
      if (!cur) { tb.innerHTML = '<tr><td colspan="5" style="color:#808080;padding:12px">No archive open. Click Open, or Favorites to see the archives on your computer.</td></tr>'; K.status('Unregistered evaluation copy. Day ' + fmt(days) + ' of 21.'); return; }
      tb.innerHTML = ARCH[cur].map(([n, sz, d], i) => { const r = sz ? ri(-4, 87) : 0; return `<tr data-i="${i}" class="${i === sel ? 'sel' : ''}"><td>${esc(n)}</td><td>${d}</td><td>${fmt(sz)}</td><td>${r}%</td><td>${fmt(sz * (100 - r) / 100)}</td></tr>`; }).join('');
      tb.querySelectorAll('tr').forEach(r => r.addEventListener('click', () => { sel = +r.dataset.i; tb.querySelectorAll('tr').forEach(x => x.classList.toggle('sel', x === r)); }));
      K.status(`${cur}: ${ARCH[cur].length} file(s). Selected 0 files, 0 bytes. Unregistered: day ${fmt(days)} of 21.`);
      K.w.setTitle('WinJack (Unregistered) - ' + cur);
    };
    const openArc = () => { const names = Object.keys(ARCH); IE.menu(names.map(n => ({ label: n, act: () => { cur = n; sel = -1; render(); } })), b.getBoundingClientRect().left + 40, b.getBoundingClientRect().top + 50); };
    const extract = () => {
      if (!cur) return msg('WinJack', 'Open an archive first. (Click Open.)', 'info');
      const w2 = Desk.msgbox('Extract', `Extracting ${ARCH[cur].length} file(s) to C:\\JACKOS\\TEMP\\...`, 'info');
      setTimeout(() => { try { if (w2 && w2.close) w2.close(); } catch (e) {} msg('WinJack', `Extracted ${ARCH[cur].length} file(s) to C:\\JACKOS\\TEMP\\WSQ8A3F.TMP\\${cur.replace('.sqg', '')}\\\n\nYou will never find them again. Nobody ever does.${cur === 'homework_FINAL_v3.sqg' ? '\n\n(Also, the homework files are 0 bytes. Somebody never did their homework.)' : ''}`, 'info'); }, 1400);
    };
    b.querySelectorAll('[data-a]').forEach(x => x.addEventListener('click', ev => {
      const a = x.dataset.a;
      if (a === 'Open' || a === 'Favorites') openArc();
      else if (a === 'Extract') extract();
      else if (a === 'New') msg('New Archive', 'Type a name for the new archive.\n\nActually, never mind. You only ever unzip things. Nobody has ever made a new archive on purpose.', 'info');
      else if (a === 'Add') msg('Add', 'Squashing files to make them smaller...\n\nThe file is now 104% of its original size. That\'s normal for pictures. Don\'t ask.', 'info');
      else if (a === 'View') { if (!cur || sel < 0) return msg('View', 'Pick a file in the list first.', 'info'); const [n, sz] = ARCH[cur][sel]; Apps.openFile({ name: n, type: 'txt', text: /\.txt$/i.test(n) ? (n === 'excuse.txt' ? "EXCUSES FOR NOT DOING HOMEWORK (ranked)\n1. The computer crashed (blue screen) - 9/10, works every time\n2. The floppy disk was corrupted - 8/10\n3. Gubbinz ate it - 2/10, sir doesn't know who Gubbinz is\n" : n === 'cheats_DO_NOT_LOOK.txt' ? 'FLAK ATTACK! CHEATS\n\nType IDDQD at the title screen for all weapons.\n(that is the Gloom one. it does not work here.)\n(you looked.)\n' : 'Read me! Thanks for downloading.\n') : `${n} (${fmt(sz)} bytes)\n\nThis kind of file can't be shown here. WinJack has extracted it to a temporary folder you'll never find.` }); }
      else if (a === 'CheckOut') msg('CheckOut', 'CheckOut makes a program group for everything in the archive, so you can try it out!\n\nCheckOut has made 4 new icons in your Start menu. (Not really. Your Start menu is full enough.)', 'info');
      else if (a === 'Wizard') msg('WinJack Wizard', 'Welcome to the WinJack Wizard!\n\nThe Wizard makes unsquashing easy. Click Next.\n\n...\n\nThere was no Next button. The Wizard was too easy.', 'info');
    }));
    K.menus([['File', [{ label: 'Open Archive...', act: openArc }, { label: 'Extract...', act: extract }, '-', { label: 'Exit', act: K.w.close }]], ['Help', [{ label: 'Ordering Information...', act: () => msg('Ordering Information', 'WinJack costs $29. Send money to Jack Computing Inc.\n\nThat is about 18 quid. That is 9 weeks of Jack\'s pocket money. No.', 'info') }, { label: 'Enter Registration Code...', act: regCode }, '-', { label: 'About WinJack', act: () => E.about('WinJack', E.I.winsquig, ['<b>WinJack 7.0 SR-1</b>', 'UNREGISTERED EVALUATION COPY', `You have been evaluating WinJack for ${fmt(days)} days. The evaluation period is 21 days. Please register. Please. We have families.`]) }]]]);
    function regCode() {
      Desk.ask('Enter Registration Code', 'Name: Jack\n\nRegistration code:', '', 24, v => {
        v = String(v || '').trim().toUpperCase();
        if (!v) return;
        if (v === 'L33T-1999-HAXOR' || v === 'GROT-1999-WAAAGH') { E.secret('dodgy.winsquig'); msg('WinJack', 'This registration code has already been used by 4,000,000 people. It has been disabled.\n\n(Dave\'s cousin got it off a website. Of course it doesn\'t work.)', 'warn'); }
        else msg('WinJack', 'Incomplete or incorrect registration information.\n\nHint: nobody has a valid code. Nobody has ever registered WinJack. It is the greatest mystery of the 20th century.', 'warn');
      });
    }
    render();
    // the nag screen
    const nag = h('div');
    nag.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><span style="width:32px;height:32px;flex:none;display:inline-flex">${E.I.winsquig}</span><div><p style="margin:0 0 6px"><b>Thank you for trying WinJack!</b></p><p style="margin:0 0 6px">This is a <b>21-day</b> evaluation version. You have been using WinJack for <b style="color:#c00">${fmt(days)} days</b>.</p><p style="margin:0" class="small">If you continue using WinJack after the evaluation period, you must register. We trust you. We can't check. Please.</p></div></div><div class="row ed-nb" style="justify-content:center;margin-top:12px"></div>`;
    const nw = Apps.win('WinJack', nag, { w: 400, icon: E.I.winsquig, noResize: true, noMax: true, noMin: true });
    const btns = [['I Agree', () => nw.close()], ['Quit', () => { nw.close(); K.w.close(); }], ['Ordering Info', () => msg('Ordering Information', 'WinJack costs $29. Send money to Jack Computing Inc. (It\'s about 18 quid. That is 9 weeks of pocket money. No.)', 'info')], ['Enter Code', () => { nw.close(); regCode(); }]];
    // like the real ones, the buttons swap round every time so you have to actually read them
    btns.sort(() => Math.random() - 0.5).forEach(([l, f]) => { const x = h('button', 'btn', esc(l)); x.type = 'button'; x.addEventListener('click', f); nag.querySelector('.ed-nb').appendChild(x); });
    K.onClose(() => nw.close());
  };

  // ================================================================ DAVE_JOKE.EXE (the "format C:" prank everybody got sent once)
  E.mods.prank = K => {
    const b = K.body; let k = 0, dodges = 0, done = false;
    K.w.setTitle('Formatting C:\\');
    const FILES = ['C:\\My Documents\\homework.doc', 'C:\\My Documents\\Diary\\SECRET.txt', 'C:\\JACKOS\\SYSTEM\\KERNEL32.DLL', 'C:\\Program Files\\JackAmp\\JACKAMP.EXE', 'C:\\My Documents\\My Pictures\\pikachu.bmp', 'C:\\GAMES\\JACKTRIS\\HISCORE.DAT', 'C:\\JACKOS\\EXPLORER.EXE', 'C:\\My Documents\\bugsweeper tips.txt', 'C:\\JACKATAK\\ISSUE7\\COVER.BMP', 'C:\\JACKOS\\JACKOS.INI', 'C:\\AUTOEXEC.BAT', 'C:\\CONFIG.SYS'];
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><span style="width:32px;height:32px;flex:none;display:inline-flex">${J('hdd') || E.I.prank}</span><div style="flex:1;min-width:0"><p style="margin:0 0 4px"><b>Formatting drive C:</b></p><p style="margin:0" class="small">All data on this disk will be erased.</p></div></div>${bar()}<div class="small ed-f" style="height:16px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"></div><div class="row ed-run" style="justify-content:flex-end;margin-top:10px;min-height:34px"><button class="btn ed-cancel" style="min-width:80px">Cancel</button></div>`;
    function J(n) { return window.JICON && JICON.has(n) ? JICON.icon(n) : null; }
    const pb = b.querySelector('.ed-bar'), f = b.querySelector('.ed-f'), cancel = b.querySelector('.ed-cancel');
    const fine = !matchMedia('(pointer:fine)').matches;
    cancel.addEventListener('pointerenter', () => { if (fine || done || dodges >= 4) return; dodges++; cancel.style.position = 'relative'; cancel.style.left = (-ri(60, 260)) + 'px'; cancel.style.top = (ri(-6, 6)) + 'px'; });
    cancel.addEventListener('click', () => { if (done) return; reveal(true); });
    const tm = setInterval(() => {
      if (K.closed) return clearInterval(tm);
      k++; setBar(pb, Math.min(0.99, k / 70)); f.textContent = 'Deleting ' + FILES[k % FILES.length] + '...';
      if (k >= 72) { clearInterval(tm); reveal(false); }
    }, 90);
    function reveal(cancelled) {
      if (done) return; done = true; clearInterval(tm); E.secret('dodgy.prank'); sfx('boing');
      b.innerHTML = `<div class="ed-c" style="padding:8px"><div style="font:bold 28px Arial;color:#e10600;margin-bottom:6px">HA HA! GOT YOU!</div><p style="margin:0 0 6px">${cancelled ? 'You pressed Cancel! (Eventually.)' : 'Your hard disk has been...'}</p><p style="margin:0 0 6px"><b>NOT formatted at all.</b> Nothing was deleted. All your files are fine.</p><p class="small" style="margin:0">Your heart rate, however, is not fine.<br>Love, Dave &nbsp;:-)</p><div class="row" style="justify-content:center;margin-top:10px"><button class="btn" style="min-width:80px">Very funny, Dave</button></div></div>`;
      b.querySelector('.btn').addEventListener('click', K.w.close);
      K.w.setTitle('DAVE_JOKE.EXE');
    }
  };
})();

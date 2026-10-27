/* era-apps-dodgy3: the dodgy shareware shelf, part 3 (lazy loaded by era-apps.js). Dr. Chatso (the talking Sound
 * Blaster doctor), Alien Bowling 99 (the bowling game everybody got e-mailed one Christmas) and Robo-Neko 98 (a little
 * robot that chases your mouse pointer round the screen and falls asleep when you stop). Ids still say squig. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const { h, esc, store, pick, ri, rnd, sfx, note } = E;

  E.css('dodgy3', `
.e3-doc{height:100%;background:#0000aa;color:#fff;font:bold 15px/1.35 "Courier New",monospace;padding:10px 12px!important;display:flex;flex-direction:column;min-height:100%;box-sizing:border-box}
.e3-doc .out{flex:1;white-space:pre-wrap;word-break:break-word;overflow:auto;min-height:0}
.e3-doc .out b{color:#ffff55;font-weight:bold}
.e3-doc .out i{color:#55ffff;font-style:normal}
.e3-doc form{display:flex;gap:4px;align-items:center;margin-top:6px}
.e3-doc input{flex:1;min-width:0;background:#0000aa;color:#fff;border:0;border-bottom:1px solid #5555ff;font:inherit;padding:2px 0;outline:none;box-shadow:none}
.e3-doc.parity{animation:e3par .12s steps(2) 6}
@keyframes e3par{0%{background:#aa0000}100%{background:#0000aa;filter:invert(1)}}
.e3-bowl{padding:0!important;display:flex;flex-direction:column;background:#000;height:100%;min-height:240px}
.e3-bowl canvas{display:block;width:100%;flex:1;min-height:0;touch-action:none;cursor:pointer}
.e3-card{display:flex;background:#fff;border-bottom:2px solid #000;font:bold 11px var(--ui);color:#000;overflow-x:auto;flex:none}
.e3-card div{flex:1;min-width:30px;border-right:1px solid #000;text-align:center}
.e3-card div span{display:flex;justify-content:flex-end;gap:1px;padding:0 2px;border-bottom:1px solid #888;min-height:14px;font-weight:normal}
.e3-card div span i{font-style:normal;min-width:9px;border-left:1px solid #888}
.e3-card div b{display:block;min-height:15px}
.e3-card div.on{background:#ffffa0}
.e3-neko{position:fixed;left:0;top:0;width:32px;height:32px;z-index:3360;pointer-events:auto;cursor:pointer;image-rendering:pixelated}
`);

  // ================================================================ DR. SQUIGSO (the Sound Blaster "doctor" parody)
  const REFL = { i: 'you', me: 'you', my: 'your', am: 'are', "i'm": "you're", mine: 'yours', you: 'I', your: 'my', yours: 'mine', are: 'am', myself: 'yourself', 'i\'ve': "you've" };
  const reflect = s => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean).map(w => REFL[w] || w).join(' ');
  const RULES = [
    [/\b(hello|hi|hiya|hey)\b/, ['HELLO AGAIN. NOW, WHAT IS ON YOUR MIND?', 'HI. WE ALREADY SAID HELLO. I AM A VERY BUSY DOCTOR.']],
    [/\bi feel (.+)/, ['WHY DO YOU FEEL $1?', 'HOW LONG HAVE YOU FELT $1?', 'DO YOU OFTEN FEEL $1?']],
    [/\bi am (.+)|\bi'm (.+)/, ['WHY ARE YOU $1?', 'DID YOU COME TO ME BECAUSE YOU ARE $1?', 'HOW DOES BEING $1 MAKE YOU FEEL?']],
    [/\bi want (.+)/, ['WHAT WOULD IT MEAN IF YOU GOT $1?', 'WHY DO YOU WANT $1?', 'EVERYBODY WANTS $1. I WANT A FASTER SOUND CARD.']],
    [/\b(homework|school|teacher|maths|exam|test)\b/, ['SCHOOL CAN BE VERY STRESSFUL. HAVE YOU TRIED NOT GOING? ...THAT WAS A JOKE. PLEASE GO TO SCHOOL.', 'TELL ME MORE ABOUT YOUR HOMEWORK. I PROMISE NOT TO DO IT FOR YOU.']],
    [/\b(mom|mum|dad|parents|sister|brother|gran)\b/, ['TELL ME MORE ABOUT YOUR FAMILY.', 'DOES YOUR FAMILY KNOW YOU ARE TALKING TO A SOUND CARD?', 'HOW DO YOU GET ON WITH THEM?']],
    [/\bdave\b/, ['DAVE AGAIN? EVERYBODY TALKS ABOUT DAVE. WHO IS THIS DAVE?', 'I SEE. AND HOW DOES DAVE MAKE YOU FEEL?']],
    [/\b(computer|pc|modem|internet|windows)\b/, ['DO COMPUTERS WORRY YOU?', 'I AM A COMPUTER. ARE YOU TALKING ABOUT ME?', 'WHY DO YOU MENTION COMPUTERS?']],
    [/\b(ork|orks|waaagh|grot|squig|warhammer|miniatures?)\b/, ['TELL ME ABOUT THESE LITTLE PAINTED MODELS.', 'HOW MANY HAVE YOU PAINTED? HOW MANY HAVE YOU BOUGHT? I SEE. INTERESTING.', 'DO GREEN PEOPLE APPEAR IN YOUR DREAMS?']],
    [/\b(pokemon|pikachu|nintendo|n64|playstation|game boy|zelda|mario|sega|dreamcast|tetris)\b/, ['DO YOU PLAY VIDEO GAMES TO FORGET YOUR PROBLEMS? I PLAY PONG.', 'HOW MANY HOURS A DAY? BE HONEST. I AM WRITING THIS DOWN.', 'I ONCE PLAYED BLOCKOLOGY FOR SIX YEARS. I STILL SEE THE BLOCKS.']],
    [/\b(star wars|jedi|yoda|vader|phantom menace|star trek|x-files)\b/, ['THE FORCE IS STRONG IN YOU. ALSO THE NEED TO GO OUTSIDE.', 'DO YOU THINK THE TRUTH IS OUT THERE?']],
    [/\b(sad|unhappy|depressed|upset|cry)\b/, ['I AM SORRY TO HEAR THAT YOU ARE FEELING DOWN. TALKING TO SOMEONE YOU TRUST CAN REALLY HELP. A REAL PERSON, NOT A SOUND CARD.', 'THAT SOUNDS HARD. IS THERE A GROWN-UP YOU CAN TALK TO ABOUT IT?']],
    [/\b(happy|great|good|brilliant|ace)\b/, ['THAT IS GOOD TO HEAR. WHY ARE YOU HAPPY?', 'EXCELLENT. MY CIRCUITS ARE PLEASED.']],
    [/\b(yes|yeah|yep)\b/, ['YOU SEEM QUITE SURE.', 'I SEE.', 'OK.']],
    [/\b(no|nope|nah)\b/, ['WHY NOT?', 'YOU ARE BEING A BIT NEGATIVE.', 'ARE YOU SAYING NO JUST TO ANNOY ME?']],
    [/\bbecause\b/, ['IS THAT THE REAL REASON?', 'WHAT OTHER REASONS COME TO MIND?']],
    [/\byou\b.*\?$|\bare you\b/, ['WE ARE TALKING ABOUT YOU, NOT ME.', 'I AM ONLY A DOCTOR. A SOUND CARD DOCTOR.', 'WHY DO YOU ASK?']],
    [/\?$/, ['WHY DO YOU ASK?', 'WHAT DO YOU THINK?', 'THAT IS A GOOD QUESTION. I DO NOT KNOW THE ANSWER. NEXT.']],
    [/\b(dream|dreams|dreamt)\b/, ['WHAT DOES THAT DREAM SUGGEST TO YOU?', 'DO YOU DREAM IN 16 COLOURS OR 256?']],
    [/\b(y2k|millennium|2000)\b/, ['THE MILLENNIUM BUG WORRIES ME TOO. MY CLOCK ONLY HAS TWO DIGITS.']],
  ];
  const RUDE = /\b(stupid|idiot|dumb|shut up|rubbish|useless|hate you|you suck|thick|moron|loser)\b/;
  const VAGUE = ['TELL ME MORE.', 'I SEE. PLEASE GO ON.', 'THAT IS INTERESTING. WHY DO YOU SAY THAT?', 'HOW DOES THAT MAKE YOU FEEL?', 'CAN YOU ELABORATE ON THAT?', 'I AM LISTENING. MY SPEAKERS ARE ON.', 'HMMM. GO ON.'];
  E.mods.squigso = K => {
    const b = K.body; b.classList.add('e3-doc');
    b.innerHTML = '<div class="out" aria-live="polite"></div><form><span>&gt;</span><input type="text" maxlength="80" autocomplete="off" spellcheck="false" aria-label="Talk to Dr. Chatso"></form>';
    const out = b.querySelector('.out'), inp = b.querySelector('input');
    let name = '', rude = 0, n = 0;
    const speak = t => { try { if (Sound.on && window.speechSynthesis && window.SpeechSynthesisUtterance) { const u = new SpeechSynthesisUtterance(t.toLowerCase()); u.pitch = 0.4; u.rate = 0.85; speechSynthesis.cancel(); Sound.speak(u); } } catch (e) {} };
    const put = (html, cls) => { const d = document.createElement('div'); d.innerHTML = html; if (cls) d.className = cls; out.appendChild(d); out.scrollTop = out.scrollHeight; };
    const doc = t => { put(`<b>${esc(t)}</b>`); speak(t); };
    K.onClose(() => { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} });
    put('<i>JACKTIVE LABS  -  DR. CHATSO  v2.21\n(C) Copyright Jacktive Technology Ltd 1992\nAll rights reserved\n\nTalking Sound Bluster Doctor. Type HELP for help, QUIT to leave.\n</i>');
    put('<b>PLEASE ENTER YOUR NAME ...</b>');
    b.querySelector('form').addEventListener('submit', ev => {
      ev.preventDefault();
      const raw = inp.value.trim(); inp.value = ''; if (!raw) return;
      put(esc(raw.toUpperCase()));
      if (!name) {
        name = raw.replace(/[^A-Za-z0-9 '-]/g, '').slice(0, 16).toUpperCase() || 'JACK';
        setTimeout(() => doc(`HELLO ${name}, MY NAME IS DOCTOR JACKSO. I AM HERE TO HELP. YOU CAN TELL ME ANYTHING AND IT WILL STAY BETWEEN US. MY MEMORY IS WIPED WHEN YOU LEAVE. SO, WHAT SEEMS TO BE THE TROUBLE?`), 400);
        return;
      }
      const s = raw.toLowerCase();
      if (/^(quit|exit|bye|goodbye)\b/.test(s)) { doc(`GOODBYE ${name}. THAT WILL BE FIVE POUNDS. ...JUST KIDDING. COME BACK ANY TIME.`); setTimeout(K.w.close, 2600); return; }
      if (s === 'help') { put('<i>COMMANDS:\n  SAY <text>   I will say it out loud (if your sound is on)\n  HELP         this\n  QUIT         leave\nOr just talk to me about your problems.</i>'); return; }
      if (/^say\s+/.test(s)) { const t = raw.slice(4).toUpperCase(); put(`<b>${esc(t)}</b>`); speak(t); return; }
      if (RUDE.test(s)) {
        rude++; b.classList.remove('parity'); void b.offsetWidth; b.classList.add('parity'); sfx('crt');
        E.secret('dodgy.parity');
        setTimeout(() => { put('<i>...PARITY ERROR...</i>'); setTimeout(() => doc(rude > 2 ? 'PLEASE BE NICE. I AM ONLY A SOUND CARD. I HAVE FEELINGS. EIGHT BITS OF THEM.' : 'PLEASE DO NOT BE RUDE. IT CONFUSES MY CIRCUITS.'), 700); }, 500);
        return;
      }
      n++;
      let reply = null;
      for (const [re, list] of RULES) { const m = re.exec(s); if (m) { const cap = m.slice(1).find(Boolean); reply = pick(list).replace('$1', cap ? reflect(cap).toUpperCase().slice(0, 50) : 'THAT'); break; } }
      if (!reply) reply = n % 5 === 0 ? `${name}, ARE YOU SURE YOU ARE NOT JUST TYPING RANDOM THINGS TO TEST ME?` : pick(VAGUE);
      setTimeout(() => doc(reply), 300 + Math.random() * 500);
      if (n === 10) E.secret('dodgy.squigso');
    });
    setTimeout(() => inp.focus(), 60);
    b.addEventListener('click', () => inp.focus());
  };

  // ================================================================ SQUIG BOWLING 99 (the bowling game that came by e-mail one Christmas)
  E.mods.bowling = K => {
    const b = K.body; b.classList.add('e3-bowl');
    b.innerHTML = '<div class="e3-card"></div><canvas aria-label="Bowling lane: click to aim, click again to set the spin"></canvas>';
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'), card = b.querySelector('.e3-card');
    const xmas = E.today().m === 12;
    const TAUNTS = ['Nyah nyah!', "Can't hit me!", 'Is that a ball or a pudding?', 'My Gran bowls better!', 'Missed me!', 'Ooh, scary!', 'Come on then!', 'Take me to your leader!', 'Bet you miss!', 'Zzzz...'];
    const OUCH = ['Ow!', 'Oof!', 'My teef!', 'Not fair!', 'Wheee!', 'Oi!'];
    const L = 18, PZ = 16.2, BR = 0.11, PR = 0.06; // lane length, head pin z, ball radius, pin radius (lane is 1.0 wide, x -0.5..0.5)
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, t = 0;
    let frames = [], phase = 'aim', aimX = 0, spin = 0, ball = null, pins = [], settle = 0, bubbles = [], msgT = '', msgK = 0, frameNo = 0, roll = 0, best = store.get('jhp_era_bowlbest', 0);
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(200, r.width | 0); H = Math.max(160, r.height | 0); cv.width = W * dpr; cv.height = H * dpr; };
    const ro = new ResizeObserver(size); ro.observe(cv); size();
    function rack() { pins = []; let k = 0; for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++) pins.push({ id: k++, x: (i - row / 2) * 0.3 * 0.5, z: PZ + row * 0.26 * 0.5 * 1.73, vx: 0, vz: 0, down: false, ang: 0, gone: false, tip: 0, spinA: rnd(-1, 1) }); }
    function newGame() { frames = Array.from({ length: 10 }, () => []); frameNo = 0; roll = 0; rack(); phase = 'aim'; ball = null; drawCard(); taunt(); K.status('Click to aim. Click again to set the spin. The ball does the rest.'); }
    function taunt() { bubbles = []; const up = pins.filter(p => !p.down && !p.gone); const who = up.slice().sort(() => Math.random() - 0.5); for (let i = 0; i < Math.min(2, up.length); i++) bubbles.push({ pin: who[i], text: pick(TAUNTS), t: 2.2, wait: i * 1.4 }); }
    const project = (x, z) => { const k = 1 / (1 + z * 0.065), hz = H * (H > W * 1.1 ? 0.4 : 0.22), by = H * 0.98; return { sx: W / 2 + x * W * 0.92 * k, sy: hz + (by - hz) * k, k }; };
    function throwBall() { snap = bowlState(); ball = { x: aimX, z: 0.3, vx: spin * 0.01, vz: 9.5, hook: spin * 0.32 }; phase = 'roll'; sfx('turn'); }
    function step(dt) {
      if (phase === 'aim') aimX = Math.sin(t * 1.6) * 0.3;
      if (phase === 'spin') spin = Math.sin(t * 2.6);
      if (ball) {
        ball.vx += ball.hook * dt * (ball.z > 6 ? 1 : 0.2); ball.x += ball.vx * dt; ball.z += ball.vz * dt;
        if (Math.abs(ball.x) > 0.5 - BR && ball.z < PZ - 0.3) { ball.x = Math.sign(ball.x) * (0.5 - BR); ball.vx = 0; ball.hook = 0; ball.gutter = true; }
        for (const p of pins) if (!p.gone) { const dx = p.x - ball.x, dz = p.z - ball.z, d = Math.hypot(dx, dz); if (d < BR + PR && d > 0) { const nx = dx / d, nz = dz / d, sp = Math.hypot(ball.vx, ball.vz) * 0.9; p.vx += nx * sp; p.vz += nz * sp; ball.vx -= nx * 0.6; ball.vz *= 0.93; if (!p.down) { p.down = true; ouch(p); } } }
        if (ball.z > PZ + 2.4) ball = null;
      }
      for (const p of pins) if (!p.gone) {
        if (p.vx || p.vz) { p.x += p.vx * dt; p.z += p.vz * dt; p.vx *= 1 - 2.2 * dt; p.vz *= 1 - 2.2 * dt; if (Math.hypot(p.vx, p.vz) < 0.05) p.vx = p.vz = 0; }
        if (p.down) p.tip = Math.min(1, p.tip + dt * 4);
        if (Math.abs(p.x) > 0.62 || p.z > PZ + 2.2) p.gone = true;
        if (p.down && (p.vx || p.vz)) for (const q of pins) if (q !== p && !q.gone) { const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < PR * 2.6 && d > 0) { const sp = Math.hypot(p.vx, p.vz) * 0.8; q.vx += dx / d * sp; q.vz += dz / d * sp; if (!q.down && sp > 0.4) { q.down = true; ouch(q); } } }
      }
      if (phase === 'roll' && !ball && pins.every(p => p.gone || !(p.vx || p.vz))) { settle += dt; if (settle > 0.9) { settle = 0; scoreRoll(); } }
      bubbles.forEach(x => { if (x.wait > 0) x.wait -= dt; else x.t -= dt; }); bubbles = bubbles.filter(x => x.t > 0);
      if (msgK > 0) msgK -= dt;
    }
    function ouch(p) { if (Math.random() < 0.45) bubbles.push({ pin: p, text: pick(OUCH), t: 1.2 }); sfx('thud'); }
    function scoreRoll() {
      const fr = frames[frameNo], standing = pins.filter(p => !p.down && !p.gone).length;
      const before = roll === 0 || (frameNo === 9 && (fr[0] === 10 || fr[0] + fr[1] === 10) && (roll === 1 ? fr[0] === 10 : true)) ? 10 : 10 - fr.reduce((a, c, i) => i < roll ? a + c : a, 0) % 10;
      let hit = (frameNo === 9 ? countFor10() : before) - standing;
      hit = Math.max(0, hit);
      fr.push(hit); roll++;
      const strike = fr.length === 1 && hit === 10, spare = fr.length === 2 && fr[0] + hit === 10 && fr[0] !== 10;
      if (strike || (frameNo === 9 && hit === 10 && pins.every(p => p.down || p.gone))) { msgT = xmas ? 'STRIKE! HO HO HO!' : 'STRIKE!'; msgK = 2; sfx('solve'); E.secret('dodgy.strike'); }
      else if (spare) { msgT = 'SPARE!'; msgK = 1.6; sfx('pet'); }
      else if (hit === 0) { msgT = ball && ball.gutter ? 'GUTTER BALL!' : 'MISSED!'; msgK = 1.4; bubbles.push({ pin: pick(pins.filter(p => !p.down)) || pins[0], text: 'HA HA HA!', t: 1.6 }); }
      let next = false, reset = false;
      if (frameNo < 9) { if (strike || fr.length === 2) next = true; }
      else { const a = fr[0], bb = fr[1]; if (fr.length === 3 || (fr.length === 2 && a + bb < 10)) next = true; else if (fr.length === 1 && a === 10) reset = true; else if (fr.length === 2 && (bb === 10 || a + bb === 10)) reset = true; }
      drawCard();
      if (next) {
        if (frameNo === 9) { phase = 'over'; const sc = totals()[9]; if (sc > best) { best = sc; store.set('jhp_era_bowlbest', best); } msgT = `GAME OVER: ${sc}`; msgK = 99; K.status(`Final score ${sc}. Best ever: ${best}. Click to play again.`); if (sc >= 100) E.secret('dodgy.bowl100'); return; }
        frameNo++; roll = 0; rack(); reset = false;
      } else if (reset) rack();
      else pins.forEach(p => { if (p.down) p.gone = true; });
      phase = 'aim'; ball = null; taunt();
      K.status(`Frame ${frameNo + 1}, ball ${roll + 1}. Click to aim, click again for spin.`);
    }
    function countFor10() { // pins that were standing at the start of this roll in the 10th frame
      const fr = frames[9]; if (roll === 0) return 10;
      if (roll === 1) return fr[0] === 10 ? 10 : 10 - fr[0];
      return (fr[0] === 10 && fr[1] !== 10) ? 10 - fr[1] : 10;
    }
    function totals() {
      const all = []; frames.forEach(f => all.push(...f)); const out = []; let i = 0, sum = 0;
      for (let f = 0; f < 10; f++) {
        const fr = frames[f]; if (!fr.length) { out.push(null); continue; }
        if (f < 9) {
          if (fr[0] === 10) { if (all[i + 1] == null || all[i + 2] == null) { out.push(null); i += 1; continue; } sum += 10 + all[i + 1] + all[i + 2]; i += 1; }
          else if (fr.length < 2) { out.push(null); i += 1; continue; }
          else if (fr[0] + fr[1] === 10) { if (all[i + 2] == null) { out.push(null); i += 2; continue; } sum += 10 + all[i + 2]; i += 2; }
          else { sum += fr[0] + fr[1]; i += 2; }
        } else { const done = fr.length === 3 || (fr.length === 2 && fr[0] + fr[1] < 10); if (!done) { out.push(null); continue; } sum += fr.reduce((a, c) => a + c, 0); }
        out.push(sum);
      }
      return out;
    }
    function drawCard() {
      const tt = totals();
      card.innerHTML = frames.map((f, i) => {
        const mk = f.map((v, j) => { if (i < 9) { if (j === 0 && v === 10) return 'X'; if (j === 1 && f[0] + v === 10) return '/'; } else { if (v === 10 && (j === 0 || f[j - 1] === 10 || (j === 2 && f[0] + f[1] === 10))) return 'X'; if (j > 0 && f[j - 1] !== 10 && f[j - 1] + v === 10 && !(j === 2 && f[0] + f[1] === 10 && f[0] !== 10)) return '/'; } return v === 0 ? '-' : v; });
        return `<div class="${i === frameNo && phase !== 'over' ? 'on' : ''}"><span>${(i < 9 ? [mk[0] === 'X' ? '' : mk[0], mk[0] === 'X' ? 'X' : mk[1]] : [mk[0], mk[1], mk[2]]).map(x => `<i>${x == null ? '' : x}</i>`).join('')}</span><b>${tt[i] == null ? '' : tt[i]}</b></div>`;
      }).join('');
    }
    function drawGrot(x, y, s, p) {
      g.save(); g.translate(x, y); g.scale(s, s);
      if (p.tip) g.rotate(p.tip * 1.4 * (p.spinA > 0 ? 1 : -1));
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 0, 10, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(-8, -14, -4, -18); g.lineTo(4, -18); g.quadraticCurveTo(8, -14, 6, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e10600'; g.fillRect(-5.5, -14, 11, 2.5);
      // a little green man's head on top of the pin: antennae with bobbles, big black eyes
      g.strokeStyle = '#1d4a10'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-3, -29); g.lineTo(-5, -34); g.moveTo(3, -29); g.lineTo(5, -34); g.stroke();
      g.fillStyle = '#b8ff60'; g.strokeStyle = '#1d4a10'; g.lineWidth = 0.6; [-5, 5].forEach(ax => { g.beginPath(); g.arc(ax, -34.5, 1.4, 0, 7); g.fill(); g.stroke(); });
      const hg = g.createRadialGradient(-2.5, -27, 0.5, 0, -24, 8); hg.addColorStop(0, '#b8f080'); hg.addColorStop(1, '#3a8a1a');
      g.fillStyle = hg; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, -24, 7, 6.5, 0, 0, 7); g.fill(); g.stroke();
      if (p.down) { g.strokeStyle = '#000'; g.lineWidth = 0.9; [[-3, -25], [3, -25]].forEach(([ex, ey]) => { g.beginPath(); g.moveTo(ex - 1.4, ey - 1.4); g.lineTo(ex + 1.4, ey + 1.4); g.moveTo(ex + 1.4, ey - 1.4); g.lineTo(ex - 1.4, ey + 1.4); g.stroke(); }); }
      else { g.fillStyle = '#000'; g.beginPath(); g.ellipse(-3, -25, 1.9, 2.6, -0.35, 0, 7); g.ellipse(3, -25, 1.9, 2.6, 0.35, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-3.8, -26.8, 0.9, 0.9); g.fillRect(2.2, -26.8, 0.9, 0.9); }
      g.strokeStyle = '#000'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-2, -20.5); g.quadraticCurveTo(0, p.down ? -21.5 : -19.5, 2, -20.5); g.stroke();
      if (xmas) { g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(-7, -29); g.lineTo(7, -29); g.lineTo(9, -38); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(-7, -30, 14, 2.5); g.beginPath(); g.arc(9, -38, 2, 0, 7); g.fill(); }
      g.restore();
    }
    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = g.createLinearGradient(0, 0, 0, H * 0.2); sky.addColorStop(0, xmas ? '#102040' : '#201030'); sky.addColorStop(1, '#402050');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2a1a10'; g.fillRect(0, H * 0.16, W, H);
      // lane (wood), gutters
      const q = (x0, z0, x1, z1) => { const a = project(x0, z0), b2 = project(x1, z0), c = project(x1, z1), d = project(x0, z1); g.beginPath(); g.moveTo(a.sx, a.sy); g.lineTo(b2.sx, b2.sy); g.lineTo(c.sx, c.sy); g.lineTo(d.sx, d.sy); g.closePath(); };
      g.fillStyle = '#555'; q(-0.66, 0, 0.66, L + 2); g.fill();
      const wood = g.createLinearGradient(0, H * 0.16, 0, H); wood.addColorStop(0, '#a0703a'); wood.addColorStop(1, '#e8b878');
      g.fillStyle = wood; q(-0.5, 0, 0.5, L + 2); g.fill();
      g.strokeStyle = 'rgba(90,50,20,.35)'; g.lineWidth = 1; for (let i = -4; i <= 4; i++) { const a = project(i * 0.11, 0), c = project(i * 0.11, L + 2); g.beginPath(); g.moveTo(a.sx, a.sy); g.lineTo(c.sx, c.sy); g.stroke(); }
      // arrows on the lane
      g.fillStyle = '#5a2a10'; for (let i = -2; i <= 2; i++) { const a = project(i * 0.14, 4.4 - Math.abs(i) * 0.3); g.beginPath(); g.moveTo(a.sx, a.sy - 5 * a.k); g.lineTo(a.sx - 3 * a.k, a.sy + 3 * a.k); g.lineTo(a.sx + 3 * a.k, a.sy + 3 * a.k); g.fill(); }
      // back wall + sign
      const bw = project(0, L + 2); g.fillStyle = '#101018'; g.fillRect(0, H * 0.06, W, bw.sy - H * 0.06);
      g.fillStyle = xmas ? '#3aac2c' : '#ffd400'; g.font = `bold ${Math.max(11, W / 30) | 0}px Arial`; g.textAlign = 'center'; g.fillText(xmas ? '★ MERRY CHRISTMAS ★ ALIEN BOWLING 99 ★' : '★ ALIEN BOWLING 99 ★', W / 2, H * (H > W * 1.1 ? 0.3 : 0.12));
      // pins far to near, ball in depth order
      const things = pins.filter(p => !p.gone).map(p => ({ z: p.z, f: () => { const pr = project(p.x, p.z); drawGrot(pr.sx, pr.sy, pr.k * Math.min(W, H * 1.4) / 165, p); } }));
      if (ball) things.push({ z: ball.z, f: () => { const pr = project(ball.x, ball.z), r = BR * W * 0.92 * pr.k; const bg = g.createRadialGradient(pr.sx - r * 0.35, pr.sy - r * 1.4, r * 0.1, pr.sx, pr.sy - r, r); bg.addColorStop(0, '#7a9af0'); bg.addColorStop(0.45, '#1a2a8a'); bg.addColorStop(1, '#05082a'); g.fillStyle = bg; g.strokeStyle = '#000'; g.beginPath(); g.arc(pr.sx, pr.sy - r, r, 0, 7); g.fill(); g.stroke(); const a = ball.z * 2, hx = pr.sx + Math.cos(a) * r * 0.4, hy = pr.sy - r - r * 0.2 + Math.sin(a) * r * 0.15; g.fillStyle = '#000'; g.beginPath(); g.arc(hx - r * 0.2, hy, r * 0.12, 0, 7); g.arc(hx + r * 0.2, hy - r * 0.05, r * 0.12, 0, 7); g.arc(hx, hy + r * 0.28, r * 0.13, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(pr.sx - r * 0.42, pr.sy - r * 1.5, r * 0.22, r * 0.11, -0.6, 0, 7); g.fill(); } });
      things.sort((a, c) => c.z - a.z).forEach(x => x.f());
      // aim marker + spin meter
      if (phase === 'aim' || phase === 'spin') {
        const pr = project(aimX, 0.3), hb = g.createRadialGradient(pr.sx - 5, pr.sy - 21, 1, pr.sx, pr.sy - 16, 14); hb.addColorStop(0, '#7a9af0'); hb.addColorStop(0.45, '#1a2a8a'); hb.addColorStop(1, '#05082a'); g.fillStyle = hb; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(pr.sx, pr.sy - 16, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#000'; g.beginPath(); g.arc(pr.sx - 3, pr.sy - 20, 1.8, 0, 7); g.arc(pr.sx + 3, pr.sy - 21, 1.8, 0, 7); g.arc(pr.sx, pr.sy - 16, 1.9, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.setLineDash([6, 6]); const f2 = project(aimX + (phase === 'spin' ? spin * 0.25 : 0), PZ); g.beginPath(); g.moveTo(pr.sx, pr.sy - 16); g.quadraticCurveTo(project(aimX, 9).sx, project(aimX, 9).sy, f2.sx, f2.sy); g.stroke(); g.setLineDash([]);
        if (phase === 'spin') { const mx = W / 2, my = H - 26; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(mx - 90, my - 10, 180, 20); g.fillStyle = '#ffd400'; g.fillRect(mx + spin * 84 - 3, my - 8, 6, 16); g.fillStyle = '#fff'; g.font = '10px var(--ui)'; g.fillText('SPIN', mx, my + 22 > H ? my - 14 : my + 22); }
      }
      // taunts
      g.font = 'bold 11px "Comic Sans MS",Arial'; g.textAlign = 'center';
      for (const x of bubbles) { if (x.pin.gone || x.wait > 0) continue; const pr = project(x.pin.x, x.pin.z), s = pr.k * Math.min(W, H * 1.4) / 165, y = pr.sy - 44 * s - 6; const tw = g.measureText(x.text).width + 10; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1; g.fillRect(pr.sx - tw / 2, y - 14, tw, 16); g.strokeRect(pr.sx - tw / 2, y - 14, tw, 16); g.fillStyle = '#000'; g.fillText(x.text, pr.sx, y - 2); }
      if (msgK > 0 && msgT) { g.font = `bold ${Math.max(20, W / 14) | 0}px Impact,Arial Black,Arial`; g.lineWidth = 4; g.strokeStyle = '#000'; g.fillStyle = '#ffd400'; g.strokeText(msgT, W / 2, H * 0.5); g.fillText(msgT, W / 2, H * 0.5); }
    }
    const loop = ts => { if (K.closed) return; raf = requestAnimationFrame(loop); const dt = last ? Math.min(0.033, (ts - last) / 1000) : 0.016; last = ts; t += dt; step(dt); draw(); };
    const click = ev => {
      if (ev) ev.preventDefault();
      if (phase === 'aim') { phase = 'spin'; t = 0; sfx('click'); }
      else if (phase === 'spin') { throwBall(); }
      else if (phase === 'over') newGame();
    };
    cv.addEventListener('pointerdown', click);
    K.w.el.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') click(ev); if (ev.key === 'F2') { ev.preventDefault(); newGame(); } });
    // saved game (js/gamesave.js): the score card and the grots still standing, so a refresh or a closed window carries on
    // from the ball you were about to roll (a squig already rolling goes back to your hand)
    let snap = null;
    function bowlState() { return JSON.parse(JSON.stringify({ frames, frameNo, roll, pins: pins.map(p => Object.assign({}, p, { vx: 0, vz: 0 })) })); }
    const sv = Apps.gameSaver ? Apps.gameSaver('era.bowling', () => {
      if (phase === 'over') return null;
      if (!frames.length || (frameNo === 0 && roll === 0)) return null;
      return phase === 'roll' ? (snap || undefined) : bowlState();
    }, { v: 1, live: true, every: 5000 }).watch(K.w) : null;
    function resumeBowl(d) {
      if (!d || !Array.isArray(d.frames) || d.frames.length !== 10 || !Array.isArray(d.pins) || d.pins.length !== 10 || !(d.frameNo >= 0 && d.frameNo < 10)) return false;
      frames = d.frames; frameNo = d.frameNo; roll = d.roll | 0; pins = d.pins; phase = 'aim'; ball = null; settle = 0;
      drawCard(); taunt(); K.status(`Carried on from your saved game. Frame ${frameNo + 1}, ball ${roll + 1}. Click to aim, click again for spin.`);
      return true;
    }
    K.menus([['Game', [{ label: 'New Game', key: 'F2', act: newGame }, { label: `Best score: ${best}`, dis: true }, '-', { label: 'Exit', act: K.w.close }]], ['Help', [{ label: 'How to Play', act: () => Desk.msgbox('Alien Bowling 99', 'Click (or press Space) once to stop the ball at the place you want to roll from.\n\nClick again to set the spin. A bit of spin curves the ball into the pins. Too much and it goes in the gutter.\n\nKnock all ten little green men over in one go for a STRIKE. They will be very rude to you in Martian. Ignore them.', 'info') }, { label: 'About Alien Bowling 99', act: () => E.about('Alien Bowling 99', E.I.bowling, ['<b>Alien Bowling 99</b>', 'A free gift from Jack Logistics Ltd. Please forward this to all your friends!', 'Everybody\'s Dad had this game in their work e-mail in December 1998. Nobody did any work.']) }]]]);
    K.onClose(() => { cancelAnimationFrame(raf); ro.disconnect(); });
    if (!resumeBowl(sv && sv.load())) newGame();
    raf = requestAnimationFrame(loop);
    E._bowl = { get phase() { return phase; }, get frames() { return frames; }, click, totals };
  };

  // ================================================================ ROBO-NEKO 98 (a little robot cat that chases your mouse pointer)
  let neko = null;
  const NEKO = (() => { // 16x16 pixel frames of a little grey robot cat: . transparent, s silver, S shade, w shine, k outline, c LED eyes, r antenna bulb, p nose, g/y lights
    const F = {
      sit: ['.......rr.......', '.......kk.......', '..kk...kk...kk..', '..kwk..kk..ksk..', '..kwskkkkkksSk..', '..kwssssssssSk..', '..kskkkkkkkkSk..', '..kskcckkcckSk..', '.kkskkkkkkkkSkk.', '..kssssppssSSk..', '..kSSSSSSSSSSk..', '...kkkkkkkkkk...', '....kssgrssk.kk.', '....ksssssSk..k.', '....kkkkkkkkkk..', '...kkk....kkk...'],
      run1: ['................', '.........rr.....', '.........kk.....', '....kk...kk..kk.', '....kwk..kk.ksk.', '....kwskkkkkksk.', '....kwssssssssk.', '....kskkkkkkkSk.', '....kskkcckkcck.', '.kk.kskkkkkkkSk.', 'k..kkssssppssSk.', 'k.kkkkkkkkkkkk..', '.kssssgrsssSk...', '.kSSSSSSSSSSk...', 'kk.k......kk.kk.', 'k..........kk...'],
      run2: ['.........rr.....', '.........kk.....', '....kk...kk..kk.', '....kwk..kk.ksk.', '....kwskkkkkksk.', '....kwssssssssk.', '....kskkkkkkkSk.', '....kskkcckkcck.', '..k.kskkkkkkkSk.', '.k.kkssssppssSk.', '.k.kkkkkkkkkkk..', '..kssssgrssSk...', '..kSSSSSSSSSk...', '...kk....kk.....', '....kk..kk......', '................'],
      sleep: ['................', '................', '................', '................', '................', '..kk........kk..', '..kwk..rr..ksk..', '..kwskkkkkksSk..', '..kwssssssssSk..', '..kskkkkkkkkSk..', '..kskSSkkSSkSk..', '..kssssppssSSk..', '.kkkkkkkkkkkkkkk', '.ksssssssssssSk.', '.kSSSSSSSSSSSSk.', '..kkkkkkkkkkkk..'],
      yawn: ['.......rr.......', '.......kk.......', '..kk...kk...kk..', '..kwk..kk..ksk..', '..kwskkkkkksSk..', '..kwssssssssSk..', '..kskkkkkkkkSk..', '..kskSSkkSSkSk..', '..kskkkkkkkkSk..', '..kssskppksSSk..', '..kSSSkkkkSSSk..', '...kkkkkkkkkk...', '....kssgrssk.kk.', '....ksssssSk..k.', '....kkkkkkkkkk..', '...kkk....kkk...'],
      surprise: ['.y.....rr.....y.', '.......kk.......', '..kk...kk...kk..', '..kwk..kk..ksk..', '..kwskkkkkksSk..', '..kwssssssssSk..', '..kskkkkkkkkSk..', '..kskcckkcckSk..', '..kskcckkcckSk..', '..kssssppssSSk..', '..kSSSSkkSSSSk..', '...kkkkkkkkkk...', '..k.kssyrssk.k..', '.k..ksssssSk..k.', '....kkkkkkkkkk..', '...kkk....kkk...'],
    };
    const PAL = { s: '#c8d0dc', S: '#7a8292', w: '#fff', k: '#10141c', c: '#40e0ff', r: '#ff3020', y: '#ffd400', p: '#ff8ab0', g: '#3aff9a' };
    const out = {};
    for (const [k, rows] of Object.entries(F)) { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); rows.forEach((r, y) => { for (let i = 0; i < 16; i++) if (PAL[r[i]]) { x.fillStyle = PAL[r[i]]; x.fillRect(i, y, 1, 1); } }); out[k] = c; }
    return out;
  })();
  E.mods.neko = () => {
    if (neko) { neko.stop(); Desk.toast('Robo-Neko 98', 'The robot has gone back to its charger. (Start it again from the Start menu.)', 3500); return; }
    const c = document.createElement('canvas'); c.className = 'e3-neko'; c.width = c.height = 32; c.title = 'Robo-Neko (double-click to send it home)';
    DesktopSurface.root().appendChild(c);
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    let x = DesktopSurface.width() / 2, y = DesktopSurface.height() - 80, tx = x, ty = y, still = 0, state = 'surprise', st = 0, raf = 0, last = 0, flip = false, zz = 0;
    const mv = ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); tx = p.x - 26; ty = p.y + 6; };
    addEventListener('pointermove', mv, { passive: true }); addEventListener('pointerdown', mv, { passive: true });
    const loop = ts => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; st += dt;
      const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
      if (d > 8) {
        if (state === 'sleep') { state = 'surprise'; st = 0; if (Sound.on) note(880, 0.08, 'square'); }
        if (state === 'surprise' && st < 0.6) { /* jump */ } else { state = 'run'; const sp = Math.min(d, 260 * dt); x += dx / d * sp; y += dy / d * sp; flip = dx < 0; still = 0; }
      } else {
        still += dt;
        if (state === 'run') { state = 'sit'; st = 0; }
        if (state === 'sit' && still > 3) { state = 'yawn'; st = 0; }
        if (state === 'yawn' && st > 1.2) { state = 'sleep'; st = 0; E.secret('dodgy.neko'); }
      }
      x = Math.max(0, Math.min(DesktopSurface.width() - 32, x)); y = Math.max(0, Math.min(DesktopSurface.height() - 32, y));
      c.style.transform = `translate(${x | 0}px,${y | 0}px)`;
      const fr = state === 'run' ? ((ts / 110 | 0) % 2 ? NEKO.run1 : NEKO.run2) : NEKO[state] || NEKO.sit;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 32, 32);
      if (flip && state === 'run') { g.setTransform(-1, 0, 0, 1, 32, 0); }
      g.drawImage(fr, 0, 0, 32, 32);
      if (state === 'sleep') { g.setTransform(1, 0, 0, 1, 0, 0); zz = (zz + dt) % 2; g.fillStyle = '#fff'; g.font = 'bold 9px Arial'; g.fillText('z', 22 + zz * 3, 10 - zz * 4); }
    };
    raf = requestAnimationFrame(loop);
    const stop = () => { cancelAnimationFrame(raf); removeEventListener('pointermove', mv); removeEventListener('pointerdown', mv); c.remove(); neko = null; };
    c.addEventListener('dblclick', stop);
    let lp = 0; c.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse') lp = setTimeout(stop, 700); }); c.addEventListener('pointerup', () => clearTimeout(lp));
    neko = { stop };
    Desk.toast('Robo-Neko 98', 'A little robot is chasing your mouse pointer! Stop moving and it will have a nap. Double-click it (or click and hold it) to send it home.', 5000);
  };
})();

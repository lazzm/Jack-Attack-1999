/* seasons-days: the special days of 1999 (lazy loaded by seasons.js when one is on). Each is subtle, on for its day
 * (or a short run of days) and off the rest of the year. apps-fun.js already does December snow, Christmas tinsel,
 * Halloween bats, Bonfire Night rockets, the April Fool page flip and Friday the 13th, so these go alongside those.
 * SeasonsDays.set(['xmasdeco', ...]) switches days on/off; SeasonsDays.preview(key) shows one straight away. */
(function () {
  'use strict';
  const SS = window.Seasons; if (!SS || !window.Apps) return;
  const A = Apps, $ = id => document.getElementById(id);
  const { h, esc, rnd, ri, pick, sfx, reduced, phone, got, sess, today } = SS;
  const store = A.store, YEAR = new Date().getFullYear(); // per real year, so it all comes back next time round
  const desk = () => $('desktop') || document.body;
  const showBrowser = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + s + '</svg>')}")`;

  SS.css('ssn-days-css', `
.ssn-layer{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.ssn-heart{position:absolute;bottom:-40px;z-index:2;width:34px;height:34px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;animation:ssnrise var(--t,11s) linear forwards;touch-action:manipulation}
.ssn-heart svg{width:100%;height:100%;animation:ssnsway 2.2s ease-in-out infinite alternate;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.35))}
.ssn-heart.pop{animation:none;transform:scale(1.8);opacity:0;transition:transform .3s,opacity .3s}
@keyframes ssnrise{to{transform:translateY(calc(-100vh - 60px))}}
@keyframes ssnsway{from{transform:translateX(-12px) rotate(-8deg)}to{transform:translateX(12px) rotate(8deg)}}
.ssn-card{background:linear-gradient(135deg,#ffd1e8,#ff8ac4);border:3px double #c0005a;padding:14px;text-align:center;font:14px/1.5 Georgia,serif;color:#600030;margin:-4px}
.ssn-card b{display:block;font:bold 20px "Comic Sans MS","Comic Sans",cursive;color:#c0005a;margin-bottom:6px}
.ssn-card .from{font:11px var(--ui);color:#800040;margin-top:8px}
body.ssn-rednose .icons .dicon,body.ssn-halloween .icons .dicon{position:relative}
body.ssn-rednose .icons .dicon::after{content:"";position:absolute;left:calc(50% - 6px);top:13px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffb0b0,#ff1a1a 45%,#a00000);box-shadow:0 1px 1px rgba(0,0,0,.5);pointer-events:none}
body.ssn-rednose #desktop,body.ssn-rednose #desktop .dicon,body.ssn-rednose #taskbar{cursor:${svgUrl('width="24" height="24" viewBox="0 0 24 24"><path d="M2 1v17l4-4 3 7 3-1-3-7h6z" fill="#fff" stroke="#000"/><circle cx="4" cy="4" r="3.6" fill="#e10600" stroke="#600" stroke-width=".8"/><circle cx="3" cy="3" r="1" fill="#fff" opacity=".7"/>')} 2 2,default}
body.ssn-halloween .icons .dicon:nth-child(3n+2)::after{content:"";position:absolute;right:6px;top:18px;width:18px;height:18px;background:${svgUrl('viewBox="0 0 18 18"><path d="M9 4c-1-2 0-3 2-3" stroke="#3a6a1a" stroke-width="1.6" fill="none"/><ellipse cx="9" cy="11" rx="8" ry="6.5" fill="#ff7a00" stroke="#7a3000"/><path d="M5 5.5c-1 3-1 8 0 11M13 5.5c1 3 1 8 0 11M9 4.5v13" stroke="#c05000" fill="none"/><path d="M5 9l2 1.5-2 .5zM13 9l-2 1.5 2 .5zM5.5 13.5l1.5 1 1-1 1 1 1-1 1 1 1.5-1" fill="#200" stroke="#200" stroke-width=".8"/>')} center/contain no-repeat;pointer-events:none}
body.ssn-halloween .disc-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(255,110,0,.45),rgba(70,0,90,.65));mix-blend-mode:multiply;pointer-events:none}
body.ssn-halloween .disc{background:#140814}
body.ssn-halloween #pane{background:${svgUrl('width="120" height="120" viewBox="0 0 120 120"><g stroke="#b9a68a" stroke-width="1" fill="none"><path d="M120 0L40 80M120 0L70 110M120 0L10 40M120 0L100 120"/><path d="M95 25q-12 10-20-3M78 42q-18 12-30-6M62 58q-24 14-38-10M85 9q8 14 22 13M70 25q12 22 33 18M55 43q16 30 44 26"/></g>')} right top/170px 170px no-repeat,#f3e6cc}
.ssn-spooky{position:absolute;left:46%;top:10px;z-index:3;background:#ff7a00;color:#1a001a;font:400 18px/1 var(--comic,Impact);padding:5px 10px 4px;border:3px solid #1a001a;transform:rotate(-6deg);box-shadow:3px 3px 0 #1a001a;letter-spacing:1px;pointer-events:none}
.ssn-holly{display:flex;align-items:center}
.ssn-holly svg{width:18px!important;height:16px!important}
.ssn-tree32 .l{animation:ssntw 1.4s steps(1) infinite}
.ssn-tree32 .l:nth-of-type(2n){animation-delay:-.7s}.ssn-tree32 .l:nth-of-type(3n){animation-delay:-.35s}
@keyframes ssntw{50%{opacity:.25}}
.ssn-xt{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap}
.ssn-xt .tr{flex:none;width:200px;height:250px;background:radial-gradient(ellipse at 50% 100%,#3a2a5a,#0a0a2a 70%);border:2px solid;border-color:#808080 #fff #fff #808080;position:relative;overflow:hidden}
.ssn-xt .tr svg{width:100%;height:100%}
.ssn-xt .side{flex:1;min-width:180px;display:flex;flex-direction:column;gap:6px}
.ssn-xt .lt{transition:opacity .2s}
.ssn-xt.tw .lt{animation:ssntw 1.2s steps(1) infinite}
.ssn-xt.tw .lt:nth-of-type(2n){animation-delay:-.6s}.ssn-xt.tw .lt:nth-of-type(3n){animation-delay:-.3s}
.ssn-xt.disco .lights{animation:ssndisco .5s linear infinite}
.ssn-xt.off .lt{opacity:.15}
@keyframes ssndisco{to{filter:hue-rotate(360deg)}}
.ssn-pres{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ssn-pr{position:relative;height:72px;border:0;padding:0;background:none;cursor:pointer;font:bold 10px var(--ui);color:#000;touch-action:manipulation}
.ssn-pr .bx{position:absolute;left:10%;right:10%;top:16px;bottom:16px;background:var(--c);border:1px solid #000;box-shadow:2px 2px 0 rgba(0,0,0,.35)}
.ssn-pr .bx::before,.ssn-pr .bx::after{content:"";position:absolute;background:var(--r)}
.ssn-pr .bx::before{left:calc(50% - 4px);top:0;bottom:0;width:8px}
.ssn-pr .bx::after{top:calc(50% - 4px);left:0;right:0;height:8px}
.ssn-pr .bw{position:absolute;left:calc(50% - 14px);top:4px;width:28px;height:14px;border:4px solid var(--r);border-radius:50% 50% 30% 30%;border-bottom:0}
.ssn-pr .nm{position:absolute;left:0;right:0;bottom:0;text-align:center}
.ssn-pr.shake .bx,.ssn-pr.shake .bw{animation:ssnshk .12s linear 4}
@keyframes ssnshk{25%{transform:translateX(-4px) rotate(-4deg)}75%{transform:translateX(4px) rotate(4deg)}}
.ssn-pr.open .bx{background:#fffbe8;border-style:dashed}
.ssn-pr.open .bx::before,.ssn-pr.open .bx::after,.ssn-pr.open .bw{display:none}
.ssn-pr.open .bx span{position:absolute;inset:2px;display:flex;align-items:center;justify-content:center;font:bold 10px/1.15 var(--ui);color:#000080;text-align:center;overflow:hidden}
.ssn-pmsg{min-height:52px;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;padding:6px;font:12px/1.35 var(--ui)}
.ssn-egg{position:absolute;display:block;box-sizing:border-box;z-index:2;width:22px;height:28px;padding:0;border:1px solid rgba(0,0,0,.55);border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:repeating-linear-gradient(170deg,var(--c1) 0 6px,var(--c2) 6px 9px,var(--c1) 9px 13px,#fff 13px 15px);box-shadow:inset -3px -3px 0 rgba(0,0,0,.18),1px 1px 0 rgba(0,0,0,.3);cursor:pointer;pointer-events:auto;touch-action:manipulation}
.ssn-egg.inl{position:relative;display:inline-block;vertical-align:middle;margin:0 4px;width:16px;height:20px}
.ssn-egg.tray{position:relative;width:12px;height:15px;margin-right:2px}
.ssn-egg.sm{position:absolute;left:6px;bottom:10px;width:14px;height:18px;z-index:3}
.ssn-egg.fx{animation:ssneggpeek 3s ease-in-out infinite alternate}
@keyframes ssneggpeek{from{transform:translateY(10px) rotate(-6deg)}to{transform:translateY(0) rotate(6deg)}}
.ssn-plane{position:absolute;left:-60px;top:30%;width:54px;height:30px;z-index:2;pointer-events:none;animation:ssnplane 10s linear forwards}
@keyframes ssnplane{0%{transform:translate(0,0) rotate(6deg)}30%{transform:translate(35vw,-12vh) rotate(-4deg)}60%{transform:translate(65vw,4vh) rotate(10deg)}100%{transform:translate(calc(100vw + 120px),30vh) rotate(24deg)}}
.ssn-floor{position:absolute;left:0;right:0;top:auto;bottom:0;height:34px;z-index:1;pointer-events:none;background:${svgUrl('width="220" height="34" viewBox="0 0 220 34"><g fill="none" stroke-width="3" stroke-linecap="round"><path d="M4 30q10-14 20 0t20 0t20-2" stroke="#ff2a6d"/><path d="M70 32q6-18 16-6t14-4 16 2" stroke="#ffd400"/><path d="M130 30q8-12 18-2t22-4" stroke="#3affff"/><path d="M178 33q4-10 12-4t14-2" stroke="#3aff6a"/></g><path d="M100 33l10-18 10 18z" fill="#5b16c9" stroke="#000"/><circle cx="110" cy="14" r="3" fill="#ffd400"/><path d="M100 33l3-6h14l3 6" fill="#ffd400" opacity=".7"/><g fill="#ff2a6d"><rect x="40" y="26" width="3" height="3"/><rect x="150" y="27" width="3" height="3"/><rect x="200" y="25" width="3" height="3"/></g><g fill="#ffd400"><rect x="58" y="29" width="3" height="3"/><rect x="170" y="23" width="3" height="3"/></g>')} 0 100%/220px 34px repeat-x}
.ssn-pan{position:relative;height:230px;background:linear-gradient(#e8e0d0 0 18px,#fffaf0 18px);border:2px solid;border-color:#808080 #fff #fff #808080;overflow:hidden}
.ssn-pan .ceil{position:absolute;left:0;right:0;top:0;height:18px;background:repeating-linear-gradient(90deg,#d8d0c0 0 30px,#cfc6b4 30px 31px);font:9px var(--ui);color:#776;text-align:center;line-height:18px}
.ssn-pan .stuck{position:absolute;top:10px;width:46px;height:14px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#f7d58a,#d79a3a);border:1px solid #8a5a1a}
.ssn-pan .cake{position:absolute;left:calc(50% - 32px);bottom:66px;width:64px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#f7d58a,#d79a3a 70%,#a86a20);border:1px solid #8a5a1a;transform-origin:50% 50%}
.ssn-pan .cake.b{background:radial-gradient(circle at 60% 50%,#c88a3a,#a8641c 60%,#7a4410)}
.ssn-pan .pn{position:absolute;left:calc(50% - 90px);bottom:40px;width:180px;height:30px}
.ssn-pan .msg{position:absolute;left:6px;right:6px;bottom:6px;font:bold 12px var(--ui);text-align:center;color:#333}
.ssn-bon{position:fixed;inset:0;z-index:9500;background:linear-gradient(#000008,#0a0a20 70%,#1a0a0a);cursor:none}
.ssn-bon canvas{position:absolute;inset:0;width:100%;height:100%}
.ssn-bon .fire{position:absolute;left:calc(50% - 90px);bottom:-20px;width:180px;height:120px;background:radial-gradient(ellipse at 50% 100%,#fff6a0 0,#ffb000 18%,#ff4a00 38%,rgba(255,40,0,.4) 55%,transparent 70%);filter:blur(2px);animation:ssnfire .18s steps(2) infinite alternate;transform-origin:50% 100%}
.ssn-bon .glow{position:absolute;left:0;right:0;bottom:0;height:45%;background:radial-gradient(ellipse at 50% 100%,rgba(255,90,0,.35),transparent 60%)}
.ssn-bon .rhyme{position:absolute;left:0;right:0;top:12px;text-align:center;font:bold 12px var(--ui);color:#776}
@keyframes ssnfire{from{transform:scale(1,1)}to{transform:scale(1.06,1.16) skewX(3deg)}}
`);

  // ================================================================ helpers
  const icon = (label, svg, act, id) => $(id) || A.desktopIcon(label, svg, act, id);
  const later = (fn, ms, list) => { const t = setTimeout(fn, ms); list.push(() => clearTimeout(t)); };
  const onceToday = (k, fn) => { const key = 'jhp_ssn_once_' + k + '_' + YEAR; if (sess.get(key)) return false; sess.set(key, '1'); fn(); return true; };
  const yearList = k => { const v = store.get(k, {}); return (v && v[YEAR]) || []; };
  const yearSave = (k, list) => { const v = store.get(k, {}) || {}; v[YEAR] = list; store.set(k, v); };
  const fsAdd = (dir, node) => { A.fs.add(dir, node); return () => { const d = A.fs.get(dir); if (d && d.kids) d.kids = d.kids.filter(k => k !== node); }; };
  const layer = cls => { const l = h('div', 'ssn-layer' + (cls ? ' ' + cls : '')); l.setAttribute('aria-hidden', 'true'); desk().appendChild(l); return l; };

  // ================================================================ the days
  const DAYS = {};

  // ---- 1 January: the morning after the Millennium party (and it's 1999 again)
  DAYS.newyear = (o) => {
    const off = [];
    const fl = layer('ssn-floor'); off.push(() => fl.remove());
    off.push(fsAdd('C:/My Documents', { name: 'resolutions for 2000.txt', type: 'txt', date: '01/01/99', size: '1 KB', text: "NEW YEAR'S RESOLUTIONS FOR THE YEAR 2000\n========================================\n\n1. Finish Ocarina of Time (the Water Temple WILL fall)\n2. Get the Rubik's cube under 2 minutes\n3. Paint 100 Orks\n4. Beat Luke on Rainbow Road (once. just once.)\n5. Stop Callum talking about his graphics card\n\n\nUPDATE (1am): the computer says it's 1 January 1999.\nUPDATE (1:05am): so does the video recorder. And my watch.\nUPDATE (1:10am): I'll just use last year's resolutions then. They look weirdly familiar.\n" }));
    later(() => onceToday('newyear', () => Desk.msgbox('JackOS 98', "JackOS is running a bit slowly this morning.\n\nIt stayed up until past midnight at the Millennium party and it has a headache. (So does Dave. He had nine cans of fizzy pop.)\n\nPlease keep the volume DOWN today.", 'info')), o.now ? 100 : (SS.winked ? 18000 : 9000), off); // after the "...again?" box, if there is one
    return () => off.forEach(f => f());
  };

  // ---- a snow day (a bit of real snow on the desktop. It doesn't settle.)
  DAYS.snowday = (o) => {
    const off = [], l = layer(), cv = document.createElement('canvas'); l.appendChild(cv);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const g = cv.getContext('2d'), n = reduced() ? 18 : phone() ? 30 : 60, flakes = [];
    let W = 0, H = 0, raf = 0, last = 0;
    const size = () => { W = cv.width = l.clientWidth || innerWidth; H = cv.height = l.clientHeight || innerHeight; };
    size(); addEventListener('resize', size);
    for (let i = 0; i < n; i++) flakes.push({ x: rnd(0, W), y: rnd(-H, H), r: rnd(1.2, 3.2), s: rnd(reduced() ? 10 : 25, reduced() ? 20 : 55), w: rnd(0, 6) });
    const step = ts => {
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.9)';
      for (const f of flakes) { f.y += f.s * dt; f.x += Math.sin(ts / 800 + f.w) * 10 * dt; if (f.y > H + 4) { f.y = -4; f.x = rnd(0, W); } g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    later(() => onceToday('snowday', () => Desk.toast('SNOW!!!', "It's snowing! Proper flakes! (It isn't settling. School is still open. Dave rang to check.)", 7000)), o.now ? 100 : 5000, off);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); l.remove(); off.forEach(f => f()); };
  };

  // ---- 14 February: hearts float up the desktop. Catch one.
  const HEART = c => `<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C6 20 1 15 1 9a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 6-5 11-15 19z" fill="${c}" stroke="#600030" stroke-width="1.2"/><path d="M6 7a3 3 0 0 1 4-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></svg>`;
  function ecard() {
    const b = h('div', '', `<div class="ssn-card"><b>Happy Valentine's Day!</b>Roses are #FF0000<br>Violets are #0000FF<br>I hacked your computer<br>(It wasn't Dave. It was not Dave.)<div class="from">From: <i>A Secret Admirer</i> &lt;secret.admirer@ecardz.jnet&gt;<br>(sent with eCardz: FREE e-cards with dancing hearts!)</div></div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn dflt" type="button">Close</button><button class="btn" type="button">Reply...</button></div>`);
    const w = A.win('eCardz - You have an e-card!', b, { w: 320, noResize: true, noMax: true });
    const [c1, c2] = b.querySelectorAll('.btn');
    c1.addEventListener('click', () => w.close());
    c2.addEventListener('click', () => Desk.msgbox('eCardz', 'Cannot reply: the address secret.admirer@ecardz.jnet does not exist.\n\n(The e-card was sent from a computer in Dave\'s house. That is a coincidence.)', 'info'));
  }
  DAYS.valentine = (o) => {
    const off = [], l = layer(); l.style.zIndex = 2;
    let caught = 0;
    const wave = () => {
      if (!document.hidden && !SS.Y.running) for (let i = 0, n = reduced() ? 2 : ri(4, 7); i < n; i++) {
        const b = h('button', 'ssn-heart', HEART(pick(['#ff2a6d', '#ff5a9a', '#e10600', '#ff8ac4'])));
        b.type = 'button'; b.setAttribute('aria-label', 'A heart');
        b.style.left = rnd(4, 92) + '%'; b.style.setProperty('--t', (reduced() ? 18 : rnd(9, 14)).toFixed(1) + 's'); b.style.animationDelay = (i * rnd(0.6, 1.4)).toFixed(1) + 's';
        b.addEventListener('click', () => { b.classList.add('pop'); sfx('pet'); setTimeout(() => b.remove(), 320); if (++caught === 1) { got('valentine'); onceToday('ecard', () => setTimeout(ecard, 500)); } });
        b.addEventListener('animationend', ev => { if (ev.animationName === 'ssnrise') b.remove(); });
        l.appendChild(b);
      }
      later(wave, rnd(45000, 90000), off);
    };
    later(wave, o.now ? 50 : 6000, off);
    return () => { l.remove(); off.forEach(f => f()); };
  };

  // ---- Shrove Tuesday (16/2/99): Pancake Toss
  const PAN_ICO = '<svg viewBox="0 0 32 32"><ellipse cx="13" cy="20" rx="11" ry="5" fill="#2a2a2a" stroke="#000"/><ellipse cx="13" cy="18.5" rx="9" ry="3.6" fill="#555"/><ellipse cx="13" cy="10" rx="7.5" ry="2.6" fill="#f2c46a" stroke="#8a5a1a"/><path d="M23 19l8-3" stroke="#000" stroke-width="3" stroke-linecap="round"/><path d="M8 6l1 2M18 5l-1 2M13 4v2" stroke="#8a5a1a"/></svg>';
  function pancake() {
    const b = h('div', '', `<div class="ssn-pan"><div class="ceil">the kitchen ceiling</div><div class="cake"></div><svg class="pn" viewBox="0 0 180 30" aria-hidden="true"><path d="M2 8h112q-4 18-56 18T2 8z" fill="#2a2a2a" stroke="#000"/><ellipse cx="58" cy="8" rx="56" ry="5" fill="#555" stroke="#000"/><rect x="112" y="5" width="66" height="7" rx="3" fill="#5a3a1a" stroke="#000"/></svg><div class="msg">Click TOSS! to flip the pancake.</div></div><div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn dflt" type="button" style="min-width:90px;font-weight:bold">TOSS!</button><label>Topping: <select><option>Lemon and sugar</option><option>Chocolate spread</option><option>Golden syrup</option><option>Jam</option><option>Squirty cream</option></select></label><span class="small ssn-pc" style="margin-left:auto">Flips: 0</span></div>`);
    const w = A.win('Pancake Toss 99', b, { w: Math.min(330, innerWidth - 12), noResize: true, noMax: true, icon: PAN_ICO });
    const stage = b.querySelector('.ssn-pan'), cake = b.querySelector('.cake'), msg = b.querySelector('.msg'), btn = b.querySelector('.btn'), cnt = b.querySelector('.ssn-pc');
    let flips = store.get('jhp_ssn_flips', 0), busy = false, stuck = 0;
    cnt.textContent = 'Flips: ' + flips;
    btn.addEventListener('click', () => {
      if (busy) return; busy = true; sfx('boing');
      const r = Math.random(), out = r < 0.68 ? 'ok' : r < 0.83 ? 'floor' : r < 0.93 ? 'ceil' : 'half';
      const top = out === 'ceil' ? 168 : rnd(90, 140), dur = reduced() ? 400 : 1100, spins = out === 'half' ? 1.5 : out === 'ok' ? (Math.random() < 0.3 ? 2 : 1) : 1.25;
      const t0 = performance.now();
      const step = ts => {
        if (w.closed) return;
        const k = Math.min(1, (ts - t0) / dur), y = 4 * top * k * (1 - k);
        if (out === 'ceil' && k >= 0.5) { // splat on the ceiling
          cake.style.transform = ''; cake.style.bottom = '66px';
          const s = h('div', 'stuck'); s.style.left = rnd(10, 75) + '%'; stage.appendChild(s); stuck++;
          msg.textContent = stuck > 1 ? `Another one on the ceiling! That's ${stuck} up there now.` : 'It STUCK TO THE CEILING. Mom says it can stay there until Easter, as a lesson.';
          sfx('thud'); busy = false; return;
        }
        const dx = out === 'floor' ? k * 140 : 0;
        cake.style.bottom = (66 + y) + 'px';
        cake.style.transform = `translateX(${dx}px) rotateX(${(k * spins * 360).toFixed(0)}deg)`;
        cake.classList.toggle('b', Math.floor(k * spins * 2) % 2 === 1);
        if (k < 1) return requestAnimationFrame(step);
        busy = false;
        if (out === 'ok') { flips++; store.set('jhp_ssn_flips', flips); cnt.textContent = 'Flips: ' + flips; msg.textContent = pick(['Perfect flip!', 'Golden brown! Lovely.', 'Caught it! Mom is impressed. (She won\'t say so.)', 'FLIP-TASTIC!']) + ` (${b.querySelector('select').value} next)`; sfx('solve'); if (flips >= 5) got('pancake'); }
        else if (out === 'half') { msg.textContent = 'It landed half folded. Still counts as a pancake. Just about.'; cake.classList.remove('b'); cake.style.transform = ''; }
        else { msg.textContent = 'SPLAT! On the floor. Five second rule? (Mom says no.)'; sfx('thud'); setTimeout(() => { if (!w.closed) { cake.style.transform = ''; cake.classList.remove('b'); msg.textContent = 'Here\'s a new one. Try again!'; } }, 1200); }
      };
      requestAnimationFrame(step);
    });
    return w;
  }
  A.register('ssn.pancake', { single: true, open: pancake });
  DAYS.pancake = (o) => {
    const off = [];
    const ic = icon('Pancake Toss', PAN_ICO, () => A.open('ssn.pancake'), 'ssnIconPan'); off.push(() => ic.remove());
    later(() => onceToday('pancake', () => Desk.toast("It's Pancake Day!", 'Shrove Tuesday! Double-click Pancake Toss on the desktop to flip some. (Mind the ceiling.)', 7000)), o.now ? 100 : 5000, off);
    return () => off.forEach(f => f());
  };

  // ---- Red Nose Day (12/3/99): red noses on everything
  DAYS.rednose = (o) => {
    const off = [];
    document.body.classList.add('ssn-rednose');
    later(() => onceToday('rednose', () => Desk.toast("It's Red Nose Day!", 'Comic Relief tonight on BBC One! Your desktop icons have put their red noses on. So has your mouse pointer.', 7000)), o.now ? 100 : 5000, off);
    return () => { document.body.classList.remove('ssn-rednose'); off.forEach(f => f()); };
  };

  // ---- 1 April: the desktop icons go upside down for a minute
  DAYS.aprilfool = (o) => {
    const off = [];
    const flip = on => document.querySelectorAll('.icons .dicon').forEach(e => { e.style.transition = reduced() ? '' : 'transform .8s'; e.style.transform = on ? 'rotate(180deg)' : ''; if (!on) setTimeout(() => { e.style.transition = ''; }, 900); });
    const go = () => { flip(true); later(() => { flip(false); Desk.toast('APRIL FOOL!!!', 'Your desktop icons were upside down for a whole minute. Did you notice? (Luke did it. Luke says he didn\'t.)', 7000); }, o.now ? 6000 : 60000, off); };
    later(() => { if (o.now) go(); else onceToday('aprilfool', go); }, o.now ? 300 : 25000, off);
    return () => { flip(false); off.forEach(f => f()); };
  };

  // ---- Easter (2/4 to 5/4/99): Mom has hidden five eggs on the computer
  const EGG_COL = [['#ff4aff', '#ffd400'], ['#3affff', '#5b16c9'], ['#3aff6a', '#ff2a6d'], ['#ffd400', '#0028c8'], ['#ff9a2a', '#3a9a2a']];
  function eggFound(id) {
    const list = yearList('jhp_ssn_eggs'); if (list.includes(id)) return;
    list.push(id); yearSave('jhp_ssn_eggs', list);
    document.querySelectorAll(`.ssn-egg[data-egg="${id}"]`).forEach(e => e.remove());
    sfx('pet');
    if (list.length >= 5) { got('eggs'); Desk.msgbox('Easter Egg Hunt', 'You found all FIVE Easter eggs!!!\n\nMom says you can eat ONE now and the rest after your tea.\n\n(Luke found three. Dave found one and ate it before anyone saw.)', 'info'); }
    else { const HINT = { 1: 'Have a good look at the desktop.', 2: 'Try the Start menu.', 3: 'Scroll right to the bottom of the magazine.', 4: 'Look near the clock.', 5: 'Check My Documents.' }, nx = [1, 2, 3, 4, 5].find(i => !list.includes(i)); Desk.toast('Easter egg found!', `That's ${list.length} of 5. Keep looking! ${HINT[nx]}`, 5000); }
  }
  const egg = (id, cls) => { const [c1, c2] = EGG_COL[id - 1]; const b = h('span', 'ssn-egg ' + (cls || '')); b.setAttribute('role', 'button'); b.tabIndex = 0; b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click(); } }); b.dataset.egg = id; b.title = 'An Easter egg!'; b.setAttribute('aria-label', 'An Easter egg'); b.style.setProperty('--c1', c1); b.style.setProperty('--c2', c2); b.addEventListener('click', ev => { ev.stopPropagation(); eggFound(id); }); return b; };
  A.OPENERS.egg = node => { eggFound(5); Desk.msgbox(node.name, 'A chocolate egg! In your documents! Mom is very good at hiding things.', 'info'); };
  DAYS.easter = (o) => {
    const off = [], have = yearList('jhp_ssn_eggs'), want = id => !have.includes(id);
    if (want(1)) { const l = layer(); l.style.zIndex = 2; const e = egg(1, reduced() ? '' : 'fx'); e.style.right = '18px'; e.style.bottom = '6px'; l.appendChild(e); off.push(() => l.remove()); }
    if (want(2) && $('startMenu')) { const e = egg(2, 'sm'); $('startMenu').appendChild(e); off.push(() => e.remove()); }
    const foot = document.querySelector('.pagefoot');
    if (want(3) && foot) { const e = egg(3, 'inl'); foot.appendChild(e); off.push(() => e.remove()); }
    if (want(4) && $('tray') && $('clock')) { const e = egg(4, 'tray'); $('tray').insertBefore(e, $('clock')); off.push(() => e.remove()); }
    if (want(5)) off.push(fsAdd('C:/My Documents', { name: 'chocolate.egg', type: 'egg', date: '04/04/99', size: '1 KB' }));
    if (have.length < 5) later(() => onceToday('easter', () => Desk.toast('EASTER EGG HUNT!', 'Mom has hidden 5 Easter eggs somewhere on this computer. Find them all! (One is right next to the clock.)', 8000)), o.now ? 100 : 5000, off);
    return () => off.forEach(f => f());
  };

  // ---- 23 July: school's out for summer
  const PLAN_ICO = A.ICON.txt;
  const PLAN = "SUMMER HOLIDAY PLAN 1999\n========================\n\n1. Get every podracer in Episode I Racer\n2. Rubik's cube under 5 minutes\n3. Paint 20 minis (red ones go faster)\n4. Mario Kart tournament at Luke's (Luke and Dave vs me and JackK)\n5. Half-Life deathmatch round Callum's (his PC is faster than ours, he keeps saying)\n6. Do NOT go outside unless I have to\n7. Holiday homework (last week of August) (probably)\n\nTHINGS MOM SAYS I HAVE TO DO\n- tidy my room\n- \"get some fresh air\"\n- not be on the computer all day (it's the HOLIDAYS)\n";
  DAYS.summer = (o) => {
    const off = [];
    const ic = icon('summer plan.txt', PLAN_ICO, () => Desk.notepad('summer plan.txt', PLAN), 'ssnIconSummer'); off.push(() => ic.remove());
    const fly = () => { if (reduced() || document.hidden) return; const l = layer(); l.style.zIndex = 2; l.innerHTML = '<svg class="ssn-plane" viewBox="0 0 54 30"><path d="M2 14L52 2 22 18z" fill="#fff" stroke="#555"/><path d="M22 18l30-16-24 26z" fill="#e8e8f0" stroke="#555"/><path d="M22 18l2 10 4-6" fill="#ccd" stroke="#555"/><path d="M8 13l18-4" stroke="#9aa" stroke-dasharray="2 2"/></svg>'; setTimeout(() => l.remove(), 10500); };
    later(() => { onceToday('summer', () => Desk.toast("SCHOOL'S OUT!!!", 'Six weeks of N64, LEGO and staying up late! Jack has written a plan (it\'s on the desktop).', 7000)); fly(); }, o.now ? 100 : 5000, off);
    const iv = setInterval(fly, 10 * 60000); off.push(() => clearInterval(iv));
    return () => off.forEach(f => f());
  };

  // ---- 31 October: pumpkins and a spooky magazine
  DAYS.halloween = (o) => {
    const off = [];
    document.body.classList.add('ssn-halloween');
    const ban = document.querySelector('#browser .disc-banner');
    if (ban && !ban.querySelector('.ssn-spooky')) { const s = h('div', 'ssn-spooky', 'SPOOKY EDITION!!!'); ban.appendChild(s); off.push(() => s.remove()); }
    later(() => onceToday('halloween', () => Desk.toast('Happy Halloween!', 'The magazine has gone spooky and the pumpkins have got onto the desktop. Jack is going trick-or-treating as a Jedi. Again.', 7000)), o.now ? 100 : (SS.winked ? 18000 : 9000), off); // after the "...again?" box, if there is one
    return () => { document.body.classList.remove('ssn-halloween'); off.forEach(f => f()); };
  };

  // ---- 5 November: the Bonfire Night screen saver
  const BON_ICO = '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="28" height="20" fill="#0a0a20" stroke="#000"/><g stroke-width="1.5"><path d="M10 9l-3-3M10 9l3-3M10 9V5M10 9l-4 1M10 9l4 1" stroke="#ffd400"/><path d="M22 12l-2-3M22 12l2-3M22 12v-4M22 12l-3 1M22 12l3 1" stroke="#ff4aff"/></g><path d="M12 22q4-9 8 0" fill="#ff7a00"/><path d="M14 22q2-5 4 0" fill="#ffd400"/><rect x="11" y="23" width="10" height="5" fill="#808080" stroke="#000"/><rect x="6" y="28" width="20" height="2" fill="#c0c0c0" stroke="#000"/></svg>';
  function bonfire() {
    if (document.querySelector('.ssn-bon')) return;
    const el = h('div', 'ssn-bon', '<canvas></canvas><div class="glow"></div><div class="fire"></div><div class="rhyme">Remember, remember, the fifth of November</div>');
    document.body.appendChild(el);
    const fw = SS.fireworks(el.querySelector('canvas'), { calm: reduced() });
    const t0 = Date.now();
    const quit = ev => { if (Date.now() - t0 < 800) return; if (ev && ev.type === 'pointermove' && Math.abs(ev.movementX) + Math.abs(ev.movementY) < 6) return; fw.kill(); el.remove(); ['keydown', 'pointerdown', 'pointermove'].forEach(e => document.removeEventListener(e, quit, true)); };
    ['keydown', 'pointerdown', 'pointermove'].forEach(e => document.addEventListener(e, quit, true));
    return null;
  }
  A.register('ssn.bonfire', { open: bonfire });
  DAYS.bonfire = () => {
    const off = [];
    const ic = icon('Bonfire Night.scr', BON_ICO, () => A.open('ssn.bonfire'), 'ssnIconBon'); off.push(() => ic.remove());
    A.cmd(['bonfire', 'bonfire.scr', 'guy fawkes', 'fireworks.scr'], () => A.open('ssn.bonfire'));
    return () => off.forEach(f => f());
  };

  // ---- Children in Need (26/11/99)
  const CIN = "SPONSOR FORM\n============\nSponsored Tetris Marathon (in aid of Children in Need)\nName: Jack\nTarget: 200 lines (on the Game Boy, no pausing)\n\nSPONSOR              PER LINE    TOTAL\n------------------------------------------\nMom                  10p         £21.20\nNan                  £1 flat     £1.00  (\"I don't understand the game, love\")\nLuke                 1p          £2.12\nDave                 2p          £4.24  (owes it)\nCallum               1p          £2.12  (\"I'm saving for a graphics card\")\nJackK                5p          £10.60\nMrs Hargreaves       £2 flat     £2.00\n------------------------------------------\nLINES DONE: 212 (!!!)\nTOTAL RAISED:                    £43.28\n\nDave did a sponsored silence. It lasted 4 minutes.\nCallum did a sponsored no-PC day. He lasted until lunch.\n";
  DAYS.cin = (o) => {
    const off = [];
    const ic = icon('Sponsor Form.txt', A.ICON.txt, () => Desk.notepad('Sponsor Form.txt', CIN), 'ssnIconCin'); off.push(() => ic.remove());
    later(() => onceToday('cin', () => Desk.toast("It's Children in Need tonight!", "Jack did a sponsored Tetris marathon: 212 lines! The sponsor form is on the desktop.", 7000)), o.now ? 100 : 6000, off);
    return () => off.forEach(f => f());
  };

  // ---- late December: a Christmas tree on the desktop and holly by the clock; presents on the big day
  const TREE32 = '<svg viewBox="0 0 32 32" class="ssn-tree32"><path d="M16 2l-6 9h3l-6 8h4l-7 8h24l-7-8h4l-6-8h3z" fill="#1a8a2a" stroke="#0a4a10"/><rect x="13" y="27" width="6" height="4" fill="#7a4a1a" stroke="#000"/><path d="M16 0l1.2 2.4 2.6.3-1.9 1.8.5 2.6L16 5.9l-2.4 1.2.5-2.6-1.9-1.8 2.6-.3z" fill="#ffd400" stroke="#a07000" stroke-width=".6"/><circle class="l" cx="14" cy="10" r="1.5" fill="#ff2a2a"/><circle class="l" cx="19" cy="15" r="1.5" fill="#ffd400"/><circle class="l" cx="11" cy="18" r="1.5" fill="#3affff"/><circle class="l" cx="20" cy="22" r="1.5" fill="#ff4aff"/><circle class="l" cx="9" cy="24" r="1.5" fill="#ffd400"/><circle class="l" cx="15" cy="21" r="1.5" fill="#ff2a2a"/></svg>';
  const HOLLY = '<svg viewBox="0 0 18 16" aria-hidden="true"><path d="M9 9C7 4 3 5 1 3c1 3-1 4 1 6 2 1 4 0 7 0z" fill="#1a8a2a" stroke="#0a4a10" stroke-width=".7"/><path d="M9 9c2-5 6-4 8-6-1 3 1 4-1 6-2 1-4 0-7 0z" fill="#1a8a2a" stroke="#0a4a10" stroke-width=".7"/><circle cx="7.5" cy="11" r="2" fill="#e10600" stroke="#700" stroke-width=".5"/><circle cx="10.5" cy="11.5" r="2" fill="#e10600" stroke="#700" stroke-width=".5"/><circle cx="9" cy="13.5" r="2" fill="#e10600" stroke="#700" stroke-width=".5"/></svg>';
  const PRESENTS = [
    { to: 'Jack', c: '#e10600', r: '#ffd400', g: 'Donkey Kong 64 (with the Expansion Pak!), a Rumble Pak and a box of LEGO!!!', shake: 'Rattles like a game box... and something that sounds like a LOT of tiny LEGO bricks.' },
    { to: 'Luke', c: '#0028c8', r: '#fff', g: 'Super Smash Bros.! Luke has already said Pikachu is "his". There will be arguments.', shake: 'Game-shaped. Luke has guessed it\'s Smash Bros. Luke is always right about presents.' },
    { to: 'Dave', c: '#1a8a2a', r: '#e10600', g: Cast.t('A fourth N64 controller. FINALLY. No more borrowing {kidEp1}\'s for four players.'), shake: 'Controller-shaped. Dave says it\'s a "controller-shaped jumper".' },
    { to: 'Callum', c: '#5b16c9', r: '#3affff', g: 'A Voodoo3 graphics card! He says Quake III will be "SO smooth" now. He showed us the box for twenty minutes.', shake: 'Heavy. Electronic. Callum is not allowed to shake it ("it\'s DELICATE").' },
    { to: 'JackK', c: '#ff7a00', r: '#0a4a10', g: 'Pokémon Red! So we can trade. (He wants my Blastoise. He can\'t have my Blastoise.)', shake: 'Small and plastic. Game Boy-game-shaped. Hmmm.' },
    { to: 'Mom', c: '#ff4aff', r: '#fff', g: 'A foot spa and a big tin of chocolates. She said "you shouldn\'t have". She meant "thank you".', shake: 'Sloshes slightly? Mom says "put that DOWN".' },
  ];
  function presentGrid(el, msgEl) {
    const opened = yearList('jhp_ssn_presents'), xmas = today().md >= 1225;
    let peeks = 0;
    el.innerHTML = PRESENTS.map((p, i) => `<button type="button" class="ssn-pr${opened.includes(i) && xmas ? ' open' : ''}" data-i="${i}" style="--c:${p.c};--r:${p.r}"><span class="bw"></span><span class="bx">${opened.includes(i) && xmas ? `<span>${esc(p.g.split(/[!.(]/)[0])}</span>` : ''}</span><span class="nm">To: ${esc(p.to)}</span></button>`).join('');
    el.querySelectorAll('.ssn-pr').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i, p = PRESENTS[i];
      if (!xmas) { // too early! shake it instead
        b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx('dice');
        msgEl.textContent = `To: ${p.to}. DO NOT OPEN UNTIL 25/12/99.\n${p.shake}`;
        if (++peeks === 3) setTimeout(() => { got('peek'); Desk.msgbox('Mom', 'I SAW THAT.\n\nNot until Christmas Day!', 'warn'); }, 500);
        return;
      }
      if (b.classList.contains('open')) { msgEl.textContent = `${p.to} got: ${p.g}`; return; }
      b.classList.add('open'); b.querySelector('.bx').innerHTML = `<span>${esc(p.g.split(/[!.(]/)[0])}</span>`; sfx('solve');
      msgEl.textContent = `${p.to} got: ${p.g}`;
      const list = yearList('jhp_ssn_presents'); if (!list.includes(i)) { list.push(i); yearSave('jhp_ssn_presents', list); }
      if (list.length >= PRESENTS.length) setTimeout(() => { got('presents'); Desk.toast('Merry Christmas!', 'Every present is open! Now for the bit where everyone falls asleep in front of the telly.', 6000); }, 600);
    }));
    msgEl.style.whiteSpace = 'pre-line';
  }
  const TREE_SVG = '<svg viewBox="0 0 200 250" aria-hidden="true"><g fill="#0d5a1a" stroke="#063a0c" stroke-width="2"><path d="M100 30L52 100h22L36 160h26L20 222h160l-42-62h26l-38-60h22z"/></g><path d="M64 96q36 18 74-2M52 152q48 22 98-4M38 214q60 22 126-4" fill="none" stroke="#ffd400" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/><rect x="88" y="222" width="24" height="22" fill="#7a4a1a" stroke="#000"/><path d="M100 6l6 13 14 1.5-10.5 9.5 3 14L100 37l-12.5 7 3-14L80 20.5 94 19z" fill="#ffd400" stroke="#a07000" stroke-width="1.5"/><g class="lights"><circle class="lt" cx="86" cy="70" r="5" fill="#ff2a2a"/><circle class="lt" cx="114" cy="84" r="5" fill="#ffd400"/><circle class="lt" cx="72" cy="122" r="5" fill="#3affff"/><circle class="lt" cx="104" cy="118" r="5" fill="#ff4aff"/><circle class="lt" cx="132" cy="136" r="5" fill="#3aff6a"/><circle class="lt" cx="60" cy="186" r="5" fill="#ffd400"/><circle class="lt" cx="94" cy="178" r="5" fill="#ff2a2a"/><circle class="lt" cx="128" cy="190" r="5" fill="#3affff"/><circle class="lt" cx="156" cy="206" r="5" fill="#ff4aff"/><circle class="lt" cx="40" cy="210" r="5" fill="#3aff6a"/><circle class="lt" cx="100" cy="148" r="5" fill="#ffd400"/><circle class="lt" cx="86" cy="100" r="4" fill="#ff4aff"/></g></svg>';
  function treeWin() {
    const b = h('div', 'ssn-xt tw', `<div class="tr">${TREE_SVG}</div><div class="side"><b>The Christmas tree</b><div class="small">Dad put the lights on. Then took them off. Then put them on again. Lights:</div><div class="row" style="flex-wrap:wrap;gap:4px"><button class="btn" type="button" data-m="tw">Twinkle</button><button class="btn" type="button" data-m="">Steady</button><button class="btn" type="button" data-m="disco">Disco</button><button class="btn" type="button" data-m="off">Off</button></div><b style="margin-top:4px">Under the tree:</b><div class="ssn-pres"></div><div class="ssn-pmsg">${today().md >= 1225 ? 'Click a present to open it!' : 'DO NOT OPEN UNTIL 25/12/99. (You can shake them though.)'}</div></div>`);
    const w = A.win('Christmas Tree', b, { w: Math.min(560, innerWidth - 8), icon: TREE32, noResize: true });
    b.querySelectorAll('[data-m]').forEach(x => x.addEventListener('click', () => { b.className = 'ssn-xt ' + x.dataset.m; sfx('click'); }));
    presentGrid(b.querySelector('.ssn-pres'), b.querySelector('.ssn-pmsg'));
    return w;
  }
  A.register('ssn.tree', { single: true, open: treeWin });
  DAYS.xmasdeco = () => {
    const off = [];
    const ic = icon('Christmas Tree', TREE32, () => A.open('ssn.tree'), 'ssnIconTree'); off.push(() => ic.remove());
    if ($('tray') && $('clock') && !document.querySelector('.ssn-holly')) { const s = h('span', 'ssn-holly', HOLLY); s.title = 'Merry Christmas!'; $('tray').insertBefore(s, $('clock')); off.push(() => s.remove()); }
    return () => off.forEach(f => f());
  };
  function presentsWin() {
    const b = h('div', '', `<p style="margin:0 0 8px"><b>Merry Christmas!</b> You have <b>${PRESENTS.length}</b> new presents. Click one to unwrap it!</p><div class="ssn-pres"></div><div class="ssn-pmsg" style="margin-top:8px">(Nan's present is socks. We already know. It's always socks.)</div>`);
    const w = A.win('You have new presents!', b, { w: Math.min(380, innerWidth - 8), icon: TREE32, noResize: true, noMax: true });
    presentGrid(b.querySelector('.ssn-pres'), b.querySelector('.ssn-pmsg'));
    return w;
  }
  A.register('ssn.presents', { single: true, open: presentsWin });
  DAYS.xmas = (o) => {
    const off = [];
    if (yearList('jhp_ssn_presents').length < PRESENTS.length || o.now) later(() => { if (o.now) A.open('ssn.presents'); else onceToday('presents', () => A.open('ssn.presents')); }, o.now ? 100 : 6000, off);
    return () => off.forEach(f => f());
  };

  // ================================================================ switching days on and off
  const on = {};
  function set(keys) {
    Object.keys(on).forEach(k => { if (!keys.includes(k)) { try { on[k](); } catch (e) {} delete on[k]; } });
    keys.forEach(k => { if (!on[k] && DAYS[k]) on[k] = DAYS[k]({}); });
  }
  function preview(k) {
    if (!DAYS[k]) return Desk.msgbox('Seasons', 'No such day: ' + k + '\n\n' + Object.keys(DAYS).join(', '), 'warn');
    if (on[k]) { try { on[k](); } catch (e) {} }
    on[k] = DAYS[k]({ now: true });
  }
  window.SeasonsDays = { set, preview, get keys() { return Object.keys(DAYS); }, get on() { return Object.keys(on); }, bonfire, tree: treeWin, presents: presentsWin, pancake };
})();

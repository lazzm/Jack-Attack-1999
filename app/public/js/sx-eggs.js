/* sx-eggs: the Start > Run easter eggs of the SECRETS pack (lazy, from js/sx.js). Every effect draws itself on top of
 * the desktop for a few seconds and tidies up after itself. All original drawings; real films, games and telly are
 * only named in plain text. Sound only plays if the visitor has turned SFX on. */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.SxEggs) return;
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const note = (f, d, t, w) => setTimeout(() => { try { Sound.note(f, d, w || 'square'); } catch (e) {} }, (t || 0) * 1000);
  const msg = (t, x, i) => Desk.msgbox(t, x, i || 'info');
  const toast = (t, x, ms) => Desk.toast(t, x, ms || 6000);
  const say = (text, pitch, rate) => { try { if (window.Sound && Sound.on && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.pitch = pitch == null ? 1 : pitch; u.rate = rate || 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) {} };
  const md = () => { try { return Desk.today99().md; } catch (e) { return 101; } };
  const layer = (cls, html, ms, click) => {
    const d = document.createElement('div'); d.className = 'sxe ' + (cls || ''); if (html) d.innerHTML = html;
    if (click) d.classList.add('sxe-click');
    document.body.appendChild(d);
    if (ms) setTimeout(() => d.remove(), ms);
    return d;
  };
  const topWin = () => [...document.querySelectorAll('.appwin')].filter(w => w.offsetParent !== null && !w.classList.contains('min')).sort((a, b) => (+getComputedStyle(b).zIndex || 0) - (+getComputedStyle(a).zIndex || 0))[0] || null;

  if (!document.getElementById('sxEggCss')) {
    const s = document.createElement('style'); s.id = 'sxEggCss';
    s.textContent = `
.sxe{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden}
.sxe.sxe-click{pointer-events:auto;cursor:pointer}
.sxe-big{position:absolute;left:0;right:0;top:38%;text-align:center;font:64px/1 Bangers,Impact,"Arial Black",sans-serif;letter-spacing:3px;color:#ffd400;text-shadow:4px 4px 0 #b01a10,0 0 20px rgba(0,0,0,.6);animation:sxepop .5s ease-out}
@keyframes sxepop{from{transform:scale(.2);opacity:0}to{transform:none;opacity:1}}
.sxe-hal{background:#111;color:#e8e8e8;padding:14px;text-align:center;font:14px/1.5 "Courier New",monospace;min-height:150px}
.sxe-eye{width:70px;height:70px;margin:4px auto 12px;border-radius:50%;background:radial-gradient(circle,#fff6a0 0 6%,#ffb000 9%,#e10600 22%,#600 45%,#200 62%,#555 64%,#bbb 68%,#333 72%);box-shadow:0 0 18px 4px rgba(255,0,0,.45);animation:sxeeye 3s ease-in-out infinite}
.sxe-eye.dim{animation:sxedim 9s linear forwards}
@keyframes sxeeye{50%{box-shadow:0 0 28px 8px rgba(255,0,0,.7)}}
@keyframes sxedim{to{filter:brightness(.15)}}
.sxe-mono{background:radial-gradient(ellipse at 50% 100%,#ffb060 0,#a04010 25%,#200810 55%,#000 80%);animation:sxefade 6.5s ease-in-out forwards}
.sxe-mono .slab{position:absolute;left:50%;bottom:-60%;width:14vmin;height:56vmin;margin-left:-7vmin;background:linear-gradient(90deg,#000,#151515 40%,#000);box-shadow:0 0 30px rgba(0,0,0,.8);animation:sxerise 3.2s ease-out forwards}
.sxe-mono .sun{position:absolute;left:50%;top:14%;width:10vmin;height:10vmin;margin-left:-5vmin;border-radius:50%;background:#fff6d0;box-shadow:0 0 60px 30px rgba(255,220,150,.7);opacity:0;animation:sxesun 6s ease-in forwards}
.sxe-mono p{position:absolute;bottom:10%;left:0;right:0;text-align:center;color:#ffe6c0;font:italic 16px Georgia,serif;opacity:0;animation:sxesun 6s 2.5s forwards}
@keyframes sxerise{to{bottom:18%}}
@keyframes sxesun{40%{opacity:1}100%{opacity:1}}
@keyframes sxefade{0%{opacity:0}10%{opacity:1}85%{opacity:1}100%{opacity:0}}
.sxe-warp canvas{width:100%;height:100%;display:block}
.sxe-warp p{position:absolute;left:0;right:0;bottom:16%;text-align:center;color:#9fd0ff;font:bold 22px Arial,sans-serif;letter-spacing:4px;text-shadow:0 0 8px #06f}
.sxe-beam{animation:sxebeam 1.6s ease-in forwards}
.sxe-beamin{animation:sxebeam 1.6s ease-out reverse}
@keyframes sxebeam{0%{opacity:1;filter:none}40%{filter:brightness(2.5) saturate(0) blur(1px)}100%{opacity:0;filter:brightness(3) blur(6px)}}
.sxe-ball{position:absolute;width:64px;height:64px;border-radius:50%}
.sxe-fire{position:absolute;top:45%;left:-120px;width:100px;height:70px;border-radius:50% 40% 40% 50%;background:radial-gradient(circle at 70% 50%,#fff 0 12%,#9ff 22%,#2a7ad8 48%,rgba(40,80,220,0) 70%);filter:drop-shadow(0 0 12px #6cf);animation:sxefly 1.4s linear forwards}
@keyframes sxefly{to{left:110%}}
.sxe-ex{position:absolute;left:50%;top:30%;margin-left:-30px;font:bold 110px/1 Arial Black,Arial,sans-serif;color:#e10600;text-shadow:3px 3px 0 #000;animation:sxepop .25s ease-out}
.sxe-box{position:absolute;bottom:40px;left:-160px;width:120px;height:84px;background:linear-gradient(#c89a5a,#a07038);border:2px solid #6a4a1a;font:bold 13px Arial,sans-serif;color:#6a3a10;display:flex;align-items:center;justify-content:center;animation:sxebox 5s steps(28) forwards}
.sxe-box::before{content:"";position:absolute;left:0;right:0;top:40%;border-top:2px dashed #7a5a2a}
@keyframes sxebox{to{left:110%}}
.sxe-poke{position:absolute;left:50%;top:45%;width:60px;height:60px;margin:-30px;border-radius:50%;background:linear-gradient(#e10600 0 46%,#111 46% 54%,#f4f4f4 54%);border:3px solid #111;animation:sxewob .6s ease-in-out 3 .4s}
.sxe-poke::after{content:"";position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px -8px;border-radius:50%;background:#fff;border:3px solid #111}
@keyframes sxewob{25%{transform:rotate(-24deg)}75%{transform:rotate(24deg)}}
.sxe-shake{animation:sxeshake .09s linear 12}
@keyframes sxeshake{25%{transform:translate(4px,-2px)}75%{transform:translate(-4px,2px)}}
.sxe-run{position:absolute;bottom:34px;width:14px;height:24px;animation:sxerun 4.5s linear forwards}
.sxe-run i{position:absolute;left:3px;top:0;width:8px;height:8px;border-radius:50%;background:#f2c79a}
.sxe-run b{position:absolute;left:2px;top:8px;width:10px;height:10px;background:var(--c,#e10600)}
.sxe-run u{position:absolute;left:2px;top:18px;width:10px;height:6px;background:#003080;animation:sxelegs .2s steps(2) infinite}
@keyframes sxelegs{50%{transform:scaleX(-1)}}
@keyframes sxerun{0%{left:-20px}100%{left:110%}}
.sxe-run.fall{animation:sxerun2 4.5s linear forwards}
@keyframes sxerun2{0%{left:-20px;bottom:34px}55%{bottom:34px;left:50%}70%{bottom:-40px;left:60%}100%{bottom:-40px;left:60%}}
.sxe-water{position:absolute;left:0;right:0;bottom:0;height:30px;background:repeating-linear-gradient(90deg,#2a7ad8 0 20px,#5aa0f0 20px 40px);opacity:.85;animation:sxefade 5s forwards}
.sxe-rocket{position:absolute;left:30px;bottom:30px;width:40px;height:110px;animation:sxeup 3.2s 1.4s ease-in forwards}
.sxe-rocket::after{content:"";position:absolute;left:8px;top:100%;width:24px;height:30px;background:radial-gradient(ellipse at 50% 0,#fff 0,#ffd400 30%,#ff6a00 60%,transparent 70%);animation:sxeflame .1s steps(2) infinite}
@keyframes sxeflame{50%{transform:scaleY(1.3)}}
@keyframes sxeup{to{bottom:120%}}
.sxe-foot{position:absolute;width:26px;height:40px;opacity:0;animation:sxefoot 7s forwards}
@keyframes sxefoot{5%{opacity:.85}80%{opacity:.85}100%{opacity:0}}
.sxe-cap{position:absolute;left:0;right:0;bottom:14%;text-align:center;font:bold 18px Georgia,serif;color:#fff;text-shadow:0 0 6px #000,2px 2px 0 #000;padding:0 12px}
.sxe-inv{filter:invert(1) hue-rotate(180deg)}
.sxe-brick{position:absolute;top:-40px;width:48px;height:24px;border:1px solid rgba(0,0,0,.4);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.sxe-brick::before,.sxe-brick::after{content:"";position:absolute;top:-6px;width:12px;height:6px;background:inherit;border:1px solid rgba(0,0,0,.35);border-bottom:0;border-radius:2px 2px 0 0}
.sxe-brick::before{left:8px}.sxe-brick::after{right:8px}
.sxe-navi{position:absolute;width:18px;height:18px;margin:-9px;border-radius:50%;background:radial-gradient(circle,#fff 0 25%,#9fe8ff 45%,rgba(120,200,255,0) 70%);box-shadow:0 0 14px 6px rgba(140,210,255,.6);transition:left .25s ease-out,top .25s ease-out}
.sxe-navi::before,.sxe-navi::after{content:"";position:absolute;top:-6px;width:14px;height:10px;border-radius:50%;background:rgba(220,245,255,.55);animation:sxewing .15s steps(2) infinite}
.sxe-navi::before{left:-10px}.sxe-navi::after{right:-10px}
@keyframes sxewing{50%{transform:scaleY(.4)}}
.sxe-navi span{position:absolute;left:18px;top:-26px;white-space:nowrap;font:bold 13px Arial,sans-serif;color:#000;background:#fff;border:1px solid #000;padding:2px 6px;border-radius:8px;opacity:0;transition:opacity .2s}
.sxe-navi span.on{opacity:1}
.sxe-credit{position:absolute;right:18px;top:12px;font:bold 22px "Courier New",monospace;color:#fff;text-shadow:2px 2px 0 #e10600;animation:sxeblink 1s steps(2) infinite}
@keyframes sxeblink{50%{opacity:.2}}
.sxe-go{background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:bold 20px "Courier New",monospace;text-align:center;gap:14px}
.sxe-go b{font:64px Bangers,Impact,sans-serif;letter-spacing:6px;color:#e10600}
.sxe-go .n{font-size:56px;color:#ffd400}
.sxe-aliens{position:absolute;top:30px;left:0;display:grid;grid-template-columns:repeat(6,34px);gap:10px 14px;animation:sxemarch 9s steps(18) forwards}
@keyframes sxemarch{0%{transform:translate(4vw,0)}25%{transform:translate(60vw,30px)}50%{transform:translate(4vw,60px)}75%{transform:translate(60vw,90px)}100%{transform:translate(4vw,120px)}}
.sxe-alien{width:34px;height:24px;pointer-events:auto;cursor:crosshair;background:none;border:0;padding:0}
.sxe-alien svg{width:100%;height:100%;animation:sxelegs .5s steps(2) infinite}
.sxe-alien.pop{visibility:hidden}
.sxe-pad{position:absolute;width:12px;height:80px;background:#fff}
.sxe-pball{position:absolute;width:12px;height:12px;background:#fff}
.sxe-pong{background:rgba(0,0,0,.55)}
.sxe-pong::after{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:4px dashed rgba(255,255,255,.6)}
.sxe-coinblk{position:absolute;left:24px;bottom:48px;width:40px;height:40px;background:#e8a000;border:3px solid #6a3a00;box-shadow:inset -4px -4px 0 #a06000,inset 4px 4px 0 #ffd060;font:bold 26px/34px Arial Black,Arial,sans-serif;color:#fff;text-align:center;animation:sxebump .3s ease-out .2s}
@keyframes sxebump{50%{transform:translateY(-12px)}}
.sxe-coin{position:absolute;left:34px;bottom:90px;width:20px;height:26px;border-radius:50%;background:#ffd400;border:2px solid #a07000;animation:sxecoin .9s ease-out .3s forwards;opacity:0}
@keyframes sxecoin{0%{opacity:1;transform:translateY(0) scaleX(1)}50%{transform:translateY(-70px) scaleX(.2)}100%{opacity:0;transform:translateY(-40px) scaleX(1)}}
@media (max-width:620px){.sxe-big{font-size:40px}.sxe-go b{font-size:44px}}
`;
    document.head.appendChild(s);
  }

  const E = window.SxEggs = {};

  // ---------------------------------------------------------------- 2001: A Space Odyssey
  function halWin(lines, sing) {
    const b = document.createElement('div'); b.className = 'sxe-hal';
    b.innerHTML = `<div class="sxe-eye${sing ? ' dim' : ''}"></div><div class="t"></div>`;
    const w = A.win('HAL 9000', b, { w: 320, noResize: true, noMax: true, icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#333"/><circle cx="8" cy="8" r="4" fill="#e10600"/><circle cx="8" cy="8" r="1.2" fill="#ffd400"/></svg>' });
    const t = b.querySelector('.t'); let i = 0;
    const next = () => { if (w.closed || i >= lines.length) return; const [txt, wait] = lines[i++]; const p = document.createElement('p'); p.style.margin = '0 0 6px'; p.textContent = txt; t.appendChild(p); setTimeout(next, wait || 2200); };
    setTimeout(next, 500);
    return w;
  }
  E.podbay = () => {
    secret('sx.r.podbay');
    halWin([['I\'m sorry, Dave. I\'m afraid I can\'t do that.', 3000], ['(Dave says he didn\'t even ask. Dave is at home, having his tea.)', 2600], ['This PC has no pod bay. It does have a CD tray. Would you like me to open that instead?', 2000]]);
    say('I\'m sorry, Dave. I\'m afraid I can\'t do that.', 0.6, 0.8);
  };
  E.daisy = () => {
    secret('sx.r.daisy');
    halWin([['Would you like me to sing it for you?', 2400], ['Daisy, Daisy, give me your answer, do...', 3600], ['I\'m half crazy, all for the love of you...', 4200], ['(The song is from 1892. It was the first song a computer ever sang, in 1961. Jack knows LOADS of facts like this.)', 3000]], true);
    // Daisy Bell (1892), getting slower and lower at the end, like HAL running down
    const N = { G3: 196, A3: 220, B3: 247, C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587 };
    const tune = [['G4', 3], ['E4', 3], ['C4', 3], ['G3', 3], ['A3', 1], ['B3', 1], ['C4', 1], ['A3', 2], ['C4', 1], ['G3', 5], ['D4', 3], ['G4', 3], ['E4', 3], ['C4', 3], ['A3', 1], ['B3', 1], ['C4', 1], ['D4', 2], ['E4', 1], ['D4', 5]];
    let t = 1.6;
    tune.forEach(([n, len], i) => { const slow = 1 + Math.max(0, i - 12) * 0.12, f = N[n] * (1 - Math.max(0, i - 13) * 0.03); note(f, len * 0.22 * slow, t, 'sine'); t += len * 0.25 * slow; });
  };
  E.monolith = () => {
    secret('sx.r.monolith');
    const d = layer('sxe-mono', '<div class="sun"></div><div class="slab"></div><p>(Jack has watched 2001: A Space Odyssey eleven times. Dave fell asleep during the bit with the bones.)</p>', 6600);
    note(131, 1.6, 0.2, 'triangle'); note(196, 1.6, 1.9, 'triangle'); note(262, 2.2, 3.6, 'triangle'); note(330, 0.5, 5.6, 'triangle'); note(311, 1.2, 6.1, 'triangle');
    [0, .35, .7, 1.05].forEach(o => note(65, 0.2, 4.4 + o, 'sine'));
    void d;
  };
  // ---------------------------------------------------------------- Star Trek
  E.warp = () => {
    secret('sx.r.warp');
    const d = layer('sxe-warp', '<canvas></canvas><p>WARP FACTOR NINE... ENGAGE!</p>', 3600);
    const c = d.querySelector('canvas'), g = c.getContext('2d'); c.width = Math.min(1200, innerWidth); c.height = Math.min(900, innerHeight);
    const S = Array.from({ length: 220 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random() * 40, v: 0.5 + Math.random() * 2 }));
    const t0 = performance.now();
    (function f(t) {
      if (!d.isConnected) return;
      const k = Math.min(1, (t - t0) / 1200), cx = c.width / 2, cy = c.height / 2;
      g.fillStyle = `rgba(0,0,10,${0.35 + 0.5 * (1 - k)})`; g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = '#cfe8ff'; g.lineWidth = 1.5;
      for (const s of S) { const r0 = s.r; s.r += s.v * (2 + k * 26); if (s.r > Math.max(cx, cy) * 1.5) { s.r = Math.random() * 20; } g.beginPath(); g.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); g.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r); g.stroke(); }
      requestAnimationFrame(f);
    })(t0);
    [220, 330, 440, 660].forEach((f, i) => note(f, 0.5, i * 0.18, 'sawtooth'));
  };
  E.beam = () => {
    secret('sx.r.beam');
    const w = topWin() || document.getElementById('browser');
    if (!w || w.classList.contains('min')) { toast('Energising...', 'There was nothing to beam up, so the PC beamed up a sock from under Jack\'s bed. It hasn\'t come back.'); return; }
    [1200, 1500, 1800, 1500, 1200].forEach((f, i) => note(f, 0.25, i * 0.25, 'sine'));
    w.classList.add('sxe-beam');
    setTimeout(() => {
      w.classList.remove('sxe-beam');
      if (w.classList.contains('appwin')) { const r = w.getBoundingClientRect(); w.style.left = Math.max(0, Math.min(innerWidth - r.width, Math.random() * (innerWidth - r.width))) + 'px'; w.style.top = Math.max(0, Math.min(innerHeight - r.height - 30, Math.random() * (innerHeight - r.height - 30))) + 'px'; }
      w.classList.add('sxe-beamin'); setTimeout(() => w.classList.remove('sxe-beamin'), 1700);
      toast('Transporter room', 'Energise! Beamed it up, and back down again a bit to the left. (Sorry about that.)', 5000);
    }, 1650);
  };
  E.vulcan = () => { secret('sx.r.vulcan'); note(523, 0.3, 0, 'sine'); note(784, 0.6, 0.3, 'sine'); toast('\\\\// Live long and prosper', 'Peace and long life. (Jack can do the hand thing. Dave can\'t. Dave tried with sticky tape and now two of his fingers are stuck together.)', 7000); };
  // ---------------------------------------------------------------- fighting games and stealth
  E.hadouken = raw => {
    secret('sx.r.hadouken');
    const big = /shoryu/i.test(raw || '') ? 'SHORYUKEN!' : 'HADOUKEN!';
    layer('', `<div class="sxe-fire"></div><div class="sxe-big">${big}</div>`, 2000);
    for (let i = 0; i < 12; i++) note(900 - i * 50, 0.08, i * 0.06, 'sawtooth');
  };
  E.alert = () => {
    secret('sx.r.alert');
    layer('', '<div class="sxe-ex">!</div>', 1300);
    note(1760, 0.07, 0, 'square'); note(2350, 0.18, 0.08, 'square');
    setTimeout(() => { layer('', '<div class="sxe-box">FRAGILE</div>', 5200); toast('Snake? Snake?! SNAAAKE!', 'Nothing to see here. Just a cardboard box. Walking across the desktop. Totally normal.', 5000); }, 1100);
  };
  E.catch = () => {
    secret('sx.r.catch');
    const icons = [...document.querySelectorAll('.icons .dicon')].filter(i => i.offsetParent !== null);
    const ic = icons[Math.floor(Math.random() * icons.length)];
    const d = layer('', '<div class="sxe-poke"></div>', 3600);
    sfx('boing');
    if (ic) { ic.style.transition = 'transform .4s, opacity .4s'; ic.style.transform = 'scale(0)'; ic.style.opacity = '0'; }
    const name = ic ? (ic.querySelector('span') || {}).textContent || 'a desktop icon' : 'a mouse pointer';
    setTimeout(() => { note(660, 0.1, 0); note(880, 0.1, 0.12); note(1320, 0.3, 0.24); toast('Gotcha!', `You caught... ${name}! It's not very effective. (It escaped.)`, 5000); if (ic) { ic.style.transform = ''; ic.style.opacity = ''; setTimeout(() => { ic.style.transition = ''; }, 500); } }, 2500);
    void d;
  };
  // ---------------------------------------------------------------- telly
  E.activate = raw => {
    if (/^\s*cease\s*$/i.test(raw || '')) { secret('sx.r.activate'); layer('', '<div class="sxe-big">CEASE!</div>', 1600); note(300, 0.6, 0, 'sawtooth'); return; }
    secret('sx.r.activate');
    const d = layer('', '<div class="sxe-big">3...</div>', 4600), big = d.querySelector('.sxe-big');
    ['2...', '1...', 'ACTIVATE!'].forEach((t, i) => setTimeout(() => { big.textContent = t; big.style.animation = 'none'; void big.offsetWidth; big.style.animation = ''; }, (i + 1) * 900));
    [0, 0.9, 1.8].forEach(t => note(440, 0.3, t)); note(880, 0.8, 2.7, 'sawtooth');
    setTimeout(() => { document.querySelectorAll('.appwin, #browser').forEach(w => w.classList.add('sxe-shake')); setTimeout(() => document.querySelectorAll('.sxe-shake').forEach(w => w.classList.remove('sxe-shake')), 1200); toast('Robot Wars', 'The house robots are coming for your windows! (Type CEASE to make them stop. They\'ve stopped already, but it\'s fun to shout it.)', 6000); }, 2800);
  };
  E.banzai = () => {
    secret('sx.r.banzai');
    const cols = ['#e10600', '#ffd400', '#2a7ad8', '#3c3', '#a040c0', '#ff8c00'];
    const d = layer('', `<div class="sxe-water"></div><div class="sxe-big" style="top:20%">BANZAI!!!</div>${cols.map((c, i) => `<span class="sxe-run${i % 2 ? ' fall' : ''}" style="--c:${c};animation-delay:${i * 0.35}s"><i></i><b></b><u></u></span>`).join('')}`, 6500);
    for (let i = 0; i < 3; i++) setTimeout(() => sfx('boing'), 2600 + i * 700);
    setTimeout(() => toast('Takeshi\'s Castle', 'Half of them fell in the water. That\'s how it always goes. The other half have to get past the Emperor.', 5000), 4500);
    void d;
  };
  E.goodnews = () => { secret('sx.r.goodnews'); note(392, 0.2, 0); note(523, 0.4, 0.2); if (md() < 328) return msg('Good news, everyone!', 'The Run box has learned a brand new catchphrase!\n\nNobody knows where it comes from yet. Jack\'s cousin in America says there\'s a new cartoon coming out over there at the end of March, and it\'s set in the year 3000. Watch this space.'); msg('Good news, everyone!', 'A delivery has arrived from the year 3000!\n\nIt is... a floppy disk.\n\nApparently they still have them. (Futurama is the new cartoon from America about a pizza delivery boy who gets frozen on New Year\'s Eve 1999. Jack has NOT been frozen. Yet.)'); };
  E.thunderbirds = () => {
    secret('sx.r.thunderbirds');
    const d = layer('', '<div class="sxe-big">5</div><svg class="sxe-rocket" viewBox="0 0 40 110"><path d="M20 2c10 14 12 34 12 60v28H8V62C8 36 10 16 20 2z" fill="#3a8a3a" stroke="#000"/><path d="M8 70L0 96h8zM32 70l8 26h-8z" fill="#e10600" stroke="#000"/><circle cx="20" cy="40" r="6" fill="#9fd0ff" stroke="#000"/><rect x="14" y="58" width="12" height="4" fill="#ffd400"/></svg>', 5200), big = d.querySelector('.sxe-big');
    ['4', '3', '2', '1', 'THUNDERBIRDS ARE GO!'].forEach((t, i) => setTimeout(() => { big.textContent = t; }, (i + 1) * 260));
    note(220, 1.4, 1.4, 'sawtooth'); note(110, 2, 1.6, 'sawtooth');
  };
  E.moon = raw => {
    secret('sx.r.moon');
    if (/houston|problem/i.test(raw || '')) { msg('Houston', '*kssht* "This is Houston. Roger, we copy your problem."\n\n"Have you tried turning it off and on again?" *kssht*\n\n(That was Apollo 13, in 1970. They all got home safe. There\'s a film of it with Tom Hanks.)'); note(1200, 0.08, 0); note(900, 0.08, 0.1); return; }
    const foot = '<svg viewBox="0 0 26 40"><path d="M6 4c6-4 14-2 15 6 1 7-2 12-3 18-1 5-1 10-6 10S5 34 5 28 0 9 6 4z" fill="#aaa" stroke="#555"/><path d="M8 14h11M8 20h10M8 26h9" stroke="#666"/></svg>';
    let h = ''; for (let i = 0; i < 8; i++) h += `<span class="sxe-foot" style="left:${12 + i * 10}%;top:${58 - (i % 2) * 7 - i * 2}%;animation-delay:${i * 0.45}s;transform:rotate(${70 + (i % 2) * 14}deg)">${foot}</span>`;
    layer('', h + '<div class="sxe-cap">"That\'s one small step for a man, one giant leap for mankind."<br><small style="font:13px Arial,sans-serif">Neil Armstrong, on the Moon, July 1969. Thirty years ago this year!</small></div>', 7200);
    for (let i = 0; i < 8; i++) note(80, 0.12, i * 0.45, 'triangle');
  };
  E.dalek = () => {
    secret('sx.r.dalek');
    layer('', '<div class="sxe-big" style="color:#c0c0c0;text-shadow:3px 3px 0 #000,0 0 12px #6cf">EXTERMINATE!</div>', 2600);
    let n = 0; const iv = setInterval(() => { document.documentElement.classList.toggle('sxe-inv'); if (++n >= 6) { clearInterval(iv); document.documentElement.classList.remove('sxe-inv'); } }, 160);
    say('Ex-ter-min-ate!', 0.1, 0.8);
    for (let i = 0; i < 5; i++) note(120 + (i % 2) * 20, 0.15, i * 0.17, 'sawtooth');
    setTimeout(() => toast('Doctor Who', `The Daleks are hiding behind the sofa this time.${md() >= 312 ? ' (Did you see the Comic Relief one on Red Nose Day? The Doctor regenerated about five times in one go!)' : ' (There\'s no Doctor Who on telly at the moment. Dad says it\'ll be back. Dad says that every year.)'}`, 7000), 2300);
  };
  E.back = () => {
    secret('sx.r.back');
    const w = topWin();
    if (!w) { toast('I\'ll be back', 'Jack\'s PC has gone to get some milk. It\'ll be back. (It came back. It forgot the milk.)', 5000); return; }
    w.style.visibility = 'hidden'; note(110, 0.4, 0, 'sawtooth');
    toast('I\'ll be back.', 'That window said it will be back. Give it a few seconds.', 3500);
    setTimeout(() => { w.style.visibility = ''; w.classList.add('sxe-shake'); setTimeout(() => w.classList.remove('sxe-shake'), 1100); sfx('thud'); }, 3800);
  };
  // ---------------------------------------------------------------- toys
  E.lego = raw => {
    secret('sx.r.lego');
    const cols = ['#e10600', '#ffd400', '#2a7ad8', '#3c3', '#fff', '#111'], W = Math.min(innerWidth, 1400);
    const bricks = []; let h = '';
    for (let i = 0; i < 24; i++) { const x = Math.floor(Math.random() * Math.max(1, (W - 60) / 48)) * 48 + 6; bricks.push(x); h += `<span class="sxe-brick" data-x="${x}" style="left:${x}px;background:${cols[i % cols.length]}"></span>`; }
    const d = layer('', h, 6500), stack = {};
    d.querySelectorAll('.sxe-brick').forEach((b, i) => setTimeout(() => {
      const x = +b.dataset.x, lvl = stack[x] = (stack[x] | 0) + 1;
      b.style.transition = 'top .5s cubic-bezier(.5,0,1,1)'; b.style.top = (innerHeight - 30 - lvl * 26) + 'px';
      setTimeout(() => note(1600 + Math.random() * 400, 0.04, 0, 'square'), 480);
    }, i * 140));
    setTimeout(() => toast(/knex/i.test(raw || '') ? 'K\'Nex' : 'LEGO', /knex/i.test(raw || '') ? 'Rods and connectors everywhere! Jack\'s K\'Nex roller coaster took three weekends. These bricks are for the shuttle launch pad.' : 'Click, click, click! Mind your feet: treading on one of these in the dark is the worst pain known to science.', 5000), 3600);
  };
  E.error = () => { secret('sx.r.error'); Desk.msgbox('I AM ERROR.', 'I AM ERROR.\n\n(That\'s what a man in a house says in Zelda II: The Adventure of Link, from 1988. Nobody knows why. It\'s the best thing in the whole game.)', 'warn'); };
  E.listen = () => {
    secret('sx.r.listen');
    const d = layer('', '<div class="sxe-navi" style="left:50%;top:50%"><span>Hey! Listen!</span></div>', 15000), f = d.querySelector('.sxe-navi'), sp = f.querySelector('span');
    const mv = ev => { f.style.left = (ev.clientX + 26) + 'px'; f.style.top = (ev.clientY - 20) + 'px'; };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerdown', mv);
    const lines = ['Hey! Listen!', 'Hey!', 'Listen!', 'Look!', 'Watch out!', 'Hello!'];
    let i = 0; const iv = setInterval(() => { if (!d.isConnected) { clearInterval(iv); document.removeEventListener('pointermove', mv); document.removeEventListener('pointerdown', mv); return; } sp.textContent = lines[i++ % lines.length]; sp.classList.add('on'); setTimeout(() => sp.classList.remove('on'), 1200); note(1568, 0.08, 0, 'sine'); note(2093, 0.12, 0.09, 'sine'); }, 2600);
  };
  let credits = 0, creditT = 0;
  E.coin = raw => {
    if (/insert/i.test(raw || '')) { credits = Math.min(9, credits + 1); creditT = Date.now(); note(1319, 0.06, 0); note(1760, 0.2, 0.07); layer('', `<div class="sxe-credit">CREDIT ${String(credits).padStart(2, '0')}</div>`, 4000); toast('Insert coin', `CREDIT ${String(credits).padStart(2, '0')}. Now press START. (Start > Run, type PRESS START.)`, 5000); return; }
    if (!credits || Date.now() - creditT > 120000) { credits = 0; layer('', '<div class="sxe-credit">INSERT COIN</div>', 3000); return; }
    credits--; secret('sx.r.coin');
    layer('', '<div class="sxe-big">PLAYER 1<br>READY!</div>', 2600);
    [523, 659, 784, 1047].forEach((f, i) => note(f, 0.12, i * 0.11));
  };
  E.gameover = () => {
    const d = layer('sxe-go', '<b>GAME OVER</b><div>CONTINUE?</div><div class="n">9</div><div style="font-size:14px">(press any key, or click)</div>', 0, true), n = d.querySelector('.n');
    let k = 9, done = false;
    note(392, 0.3, 0); note(330, 0.3, 0.3); note(262, 0.6, 0.6);
    const finish = cont => {
      if (done) return; done = true; clearInterval(iv); document.removeEventListener('keydown', kd, true);
      if (cont) { secret('sx.r.gameover'); n.textContent = 'CONTINUE!'; [523, 659, 784].forEach((f, i) => note(f, 0.1, i * 0.1)); setTimeout(() => d.remove(), 900); }
      else { n.textContent = '0'; d.querySelector('div').textContent = 'THANKS FOR PLAYING'; setTimeout(() => d.remove(), 1600); }
    };
    const kd = ev => { ev.preventDefault(); ev.stopPropagation(); finish(true); };
    const iv = setInterval(() => { k--; n.textContent = k; note(220, 0.05, 0); if (k <= 0) finish(false); }, 1000);
    document.addEventListener('keydown', kd, true);
    d.addEventListener('click', () => finish(true));
  };
  // ---------------------------------------------------------------- the arcade
  E.invaders = () => {
    secret('sx.r.invaders');
    const sp = c => `<svg viewBox="0 0 11 8" shape-rendering="crispEdges"><path fill="${c}" d="M2 0h1v1H2zM8 0h1v1H8zM3 1h1v1H3zM7 1h1v1H7zM2 2h7v1H2zM1 3h2v1H1zM4 3h3v1H4zM8 3h2v1H8zM0 4h11v1H0zM0 5h1v1H0zM2 5h7v1H2zM10 5h1v1h-1zM0 6h1v1H0zM2 6h1v1H2zM8 6h1v1H8zM10 6h1v1h-1zM3 7h2v1H3zM6 7h2v1H6z"/></svg>`;
    let h = '<div class="sxe-aliens">'; for (let i = 0; i < 18; i++) h += `<button type="button" class="sxe-alien" aria-label="Alien">${sp(['#3f3', '#3cf', '#f6f'][Math.floor(i / 6)])}</button>`; h += '</div>';
    const d = layer('', h, 9500);
    let shot = 0, beat = 0; const bt = setInterval(() => { if (!d.isConnected) return clearInterval(bt); note([98, 87, 78, 73][beat++ % 4], 0.08, 0, 'square'); }, 500);
    d.querySelectorAll('.sxe-alien').forEach(a => a.addEventListener('click', ev => { ev.stopPropagation(); if (a.classList.contains('pop')) return; a.classList.add('pop'); shot++; note(1200, 0.05, 0, 'sawtooth'); note(300, 0.15, 0.05, 'sawtooth'); if (shot === 18) toast('Space Invaders', 'You got all eighteen! The Earth is safe. (Until the next wave.)'); }));
    setTimeout(() => { if (shot < 18) toast('They\'re coming...', `They landed. You got ${shot} of them. (Click the aliens next time!)`, 5000); }, 9200);
  };
  E.pong = () => {
    secret('sx.r.pong');
    const d = layer('sxe-pong', '<div class="sxe-pad" style="left:20px"></div><div class="sxe-pad" style="right:20px"></div><div class="sxe-pball"></div>', 10500);
    const [pl, pr] = d.querySelectorAll('.sxe-pad'), b = d.querySelector('.sxe-pball');
    let x = innerWidth / 2, y = innerHeight / 3, vx = 6, vy = 4, last = performance.now();
    (function f(t) {
      if (!d.isConnected) return;
      const dt = Math.min(3, (t - last) / 16); last = t;
      x += vx * dt; y += vy * dt;
      if (y < 0 || y > innerHeight - 40) { vy = -vy; y = Math.max(0, Math.min(innerHeight - 40, y)); note(490, 0.03, 0); }
      if (x < 34 || x > innerWidth - 46) { vx = -vx; x = Math.max(34, Math.min(innerWidth - 46, x)); note(x < 100 ? 245 : 490, 0.05, 0); }
      b.style.left = x + 'px'; b.style.top = y + 'px';
      const py = Math.max(0, Math.min(innerHeight - 110, y - 34)); pl.style.top = py + 'px'; pr.style.top = py + 'px';
      requestAnimationFrame(f);
    })(last);
    setTimeout(() => toast('PONG', 'One of the very first video games, from 1972. Bip. Bop. Bip. Bop. Nobody has ever won (the paddles are too good).', 6000), 800);
  };
  E.mario = () => {
    secret('sx.r.mario');
    layer('', '<div class="sxe-coinblk">!</div><div class="sxe-coin"></div>', 2000);
    note(988, 0.08, 0.3); note(1319, 0.4, 0.38);
    toast('It\'s-a me!', 'Jack does the best plumber impression in the whole school. Luke says his own is better. Luke does a better Luigi, to be fair.', 6000);
  };
  E.oddjob = () => { secret('sx.r.oddjob'); msg('GoldenEye 007: house rules', 'ODDJOB IS BANNED.\n\nAt Dave\'s house, these are the rules:\n  1. No Oddjob (he\'s too short, you can\'t hit him).\n  2. No screen watching. (Everybody screen watches.)\n  3. No Proximity Mines in the Facility.\n  4. Slappers Only on Fridays.\n  5. Whoever loses has to sit on the floor.', 'warn'); };
  let yearAsk = 0;
  E.year1999 = () => {
    const n = Date.now() - yearAsk < 90000 ? 2 : 1; yearAsk = Date.now();
    if (n === 1) { msg('What year is it?', 'It is 1999.', 'info'); return; }
    secret('sx.r.1999'); msg('What year is it?', 'It is STILL 1999.\n\nIt will always be 1999 on this PC. Every day goes round again: when it gets to 31 December it starts back at 1 January. Nobody minds. 1999 is a great year.\n\n(Don\'t tell the Y2K bug.)', 'info');
  };
})();

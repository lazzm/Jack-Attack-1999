/* seasons-y2k: Y2K Night's big moment (lazy loaded by seasons.js). The last 10 seconds of 1999, then the Millennium Bug
 * hits: glitching screens, the clock says 1/1/1900, icons wobble and fall off the desktop, error boxes everywhere,
 * JackAmp thinks it's the year 19100, the printer prints, the paperclip panics, the mates send WinPopups... then a
 * fireworks show for the year 2000, everything quietly settles, and JackOS restarts back into 1999 ...again?
 * SeasonsY2K.run({ drill, from }) - from = seconds of countdown left (10 for the drill). Esc stops a drill. */
(function () {
  'use strict';
  const SS = window.Seasons; if (!SS || !window.Apps) return;
  const A = Apps, $ = id => document.getElementById(id);
  const { h, esc, rnd, pick, sfx, note, reduced, got, Y } = SS;
  const J = (n, s) => window.JICON ? JICON.get(n, s || 16) : null;

  SS.css('ssn-y2k-css', `
.ssn-big{position:fixed;inset:0;z-index:9400;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:radial-gradient(ellipse at center,rgba(0,0,40,.55),rgba(0,0,0,.82));color:#fff;text-align:center;pointer-events:none;opacity:0;transition:opacity .5s}
.ssn-big.on{opacity:1}
.ssn-big .lbl{font:bold clamp(12px,2.2vw,18px) var(--ui);letter-spacing:3px;color:#9ff;text-transform:uppercase}
.ssn-big .num{font:400 clamp(110px,30vw,300px)/.9 var(--comic,Impact);color:#ffd400;-webkit-text-stroke:4px #000;paint-order:stroke fill;text-shadow:8px 8px 0 #e10600,0 0 40px rgba(255,212,0,.6)}
.ssn-big .num.bump{animation:ssnbump .9s ease-out}
@keyframes ssnbump{0%{transform:scale(1.6);opacity:.2}25%{transform:scale(.95);opacity:1}100%{transform:scale(1)}}
.ssn-big .num.yr{font-size:clamp(80px,22vw,230px)}
.ssn-big .num.bad{color:#0f0;text-shadow:6px 0 0 #f0f,-6px 0 0 #0ff;font-family:"Courier New",monospace;font-weight:bold;-webkit-text-stroke:0}
.ssn-big .sub{font:400 clamp(20px,4.4vw,40px)/1 var(--comic,Impact);color:#fff;-webkit-text-stroke:1px #000;paint-order:stroke fill;letter-spacing:2px}
.ssn-big .esc{position:absolute;bottom:44px;font:11px var(--ui);color:#aac}
.ssn-gl{position:fixed;inset:0;z-index:9300;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px)}
.ssn-gl i{position:absolute;left:0;right:0;-webkit-backdrop-filter:invert(1) hue-rotate(90deg);backdrop-filter:invert(1) hue-rotate(90deg)}
.ssn-gl i.b{-webkit-backdrop-filter:hue-rotate(200deg) saturate(3);backdrop-filter:hue-rotate(200deg) saturate(3)}
.ssn-gl.calm{background:repeating-linear-gradient(0deg,rgba(0,40,0,.12) 0 1px,transparent 1px 3px),rgba(0,255,80,.06)}
body.ssn-shake #desktop{animation:glitch .3s steps(2) infinite}
body.ssn-shake #taskbar{animation:glitch .4s steps(2) infinite reverse}
.ssn-err{animation:ssnpop .18s ease-out}
@keyframes ssnpop{from{transform:scale(.6);opacity:0}}
.ssn-err .appbody{white-space:pre-line}
.dicon.ssn-wob{animation:ssnwob .35s ease-in-out infinite alternate;animation-delay:var(--d,0s)}
@keyframes ssnwob{from{transform:rotate(-9deg)}to{transform:rotate(9deg) translateY(-2px)}}
.dicon.ssn-ghost{opacity:.25;transition:opacity 1s}
.ssn-amp{background:#1a1a22;color:#0f0;font:11px/1.2 "Courier New",monospace;padding:6px;margin:-6px;border:2px solid;border-color:#555 #111 #111 #555}
.ssn-amp .lcd2{display:flex;gap:8px;background:#000;border:1px solid #3a3a4a;padding:5px}
.ssn-amp .t{font:bold 26px/1 "Courier New",monospace;color:#0f0;text-shadow:0 0 6px #0f0;animation:ssnblink .7s steps(1) infinite;min-width:98px}
.ssn-amp .sp{display:flex;align-items:flex-end;gap:2px;height:30px;flex:1}
.ssn-amp .sp i{flex:1;background:linear-gradient(#f00,#ff0 40%,#0f0);min-height:2px}
.ssn-amp .mq{margin-top:5px;background:#000;border:1px solid #3a3a4a;padding:3px 5px;white-space:nowrap;overflow:hidden;color:#ffd400}
.ssn-amp .bt{display:flex;gap:3px;margin-top:5px}
.ssn-amp .bt span{flex:1;text-align:center;background:#3a3a4a;border:1px solid;border-color:#6a6a7a #111 #111 #6a6a7a;color:#ccc;font:bold 10px Arial;padding:2px 0}
.ssn-pop{font:12px/1.4 var(--ui)}
.ssn-pop .hd{background:#ffffe1;border:1px solid #808080;padding:4px 6px;margin-bottom:6px;font:11px var(--ui)}
.ssn-pop .msg{font:bold 13px/1.35 "Courier New",monospace;white-space:pre-line;min-height:48px}
.ssn-clip{position:fixed;right:18px;bottom:44px;z-index:9320;display:flex;flex-direction:column;align-items:flex-end;transition:transform .8s cubic-bezier(.5,-0.4,.7,1)}
.ssn-clip.gone{transform:translate(160px,40px) rotate(30deg)}
.ssn-clip .bx{width:104px;background:#c0c0c0;border:1px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset -1px -1px #808080,inset 1px 1px #fff;padding:2px}
.ssn-clip .bx>div{height:12px;background:linear-gradient(90deg,var(--title1,#000080),var(--title2,#1084d0));color:#fff;font:bold 9px var(--ui);padding:0 3px;line-height:12px}
.ssn-clip .cv{display:block;width:96px;height:96px;margin:2px;background:#ffffcc;border:1px solid;border-color:#808080 #fff #fff #808080}
.ssn-clip.panic .cv svg{animation:ssnpanic .12s linear infinite}
@keyframes ssnpanic{25%{transform:translate(3px,-2px) rotate(4deg)}75%{transform:translate(-3px,1px) rotate(-5deg)}}
.ssn-clip .bal{position:relative;width:250px;max-width:calc(100vw - 30px);background:#ffffe1;border:1px solid #000;border-radius:9px;padding:9px 10px;margin-bottom:12px;font:11px/1.35 var(--ui);color:#000;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.ssn-clip .bal::after{content:"";position:absolute;right:38px;bottom:-9px;border-style:solid;border-width:9px 8px 0;border-color:#000 transparent transparent}
.ssn-clip .bal h4{margin:0 0 5px;font:bold 12px var(--ui)}
.ssn-clip .bal p{margin:0 0 6px}
.ssn-clip .bal button{display:flex;gap:6px;align-items:center;width:100%;text-align:left;background:none;border:0;padding:3px 2px;font:11px var(--ui);color:#000;cursor:pointer;min-height:24px}
.ssn-clip .bal button:hover,.ssn-clip .bal button:focus-visible{color:#00f;text-decoration:underline;outline:none}
.ssn-clip .bal button i{flex:none;width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#9fd0ff,#0040c0 70%);border:1px solid #002080}
.ssn-sticker{position:absolute;right:14%;top:12px;z-index:2;background:#e10600;color:#ff0;font:bold 16px/1 "Courier New",monospace;padding:6px 9px;border:3px solid #000;transform:rotate(8deg);box-shadow:3px 3px 0 #000;animation:ssnblink .6s steps(1) infinite}
.disc-banner.ssn-bugban{filter:hue-rotate(140deg) contrast(1.4) saturate(2);animation:glitch .25s steps(2) infinite}
.ssn-black{position:fixed;inset:0;z-index:9360;background:#000;opacity:0;transition:opacity .8s;display:flex;align-items:center;justify-content:center;color:#888;font:bold 22px "Courier New",monospace;pointer-events:none}
.ssn-black.on{opacity:1}
.ssn-hny{position:absolute;left:0;right:0;bottom:16%;text-align:center;pointer-events:none}
.ssn-hny b{display:block;font:400 clamp(40px,10vw,110px)/.95 var(--comic,Impact);background:linear-gradient(90deg,#ffd400,#fff 20%,#ff7af0 35%,#ffd400 50%,#b6ff00 70%,#3affff 85%,#ffd400);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:2px rgba(0,0,0,.6);animation:logoshine 3s linear infinite,ssnhny 1.4s ease-in-out infinite alternate;filter:drop-shadow(5px 5px 0 #000)}
.ssn-hny small{display:block;margin-top:10px;font:bold clamp(12px,2.2vw,17px) var(--ui);color:#fff;text-shadow:1px 1px 0 #000}
@keyframes ssnhny{from{transform:scale(.97) rotate(-1.5deg)}to{transform:scale(1.03) rotate(1.5deg)}}
@keyframes logoshine{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.ssn-hny b{animation:none}.ssn-big .num.bump{animation:none}.ssn-clip.panic .cv svg{animation:none}.dicon.ssn-wob{animation:none}.ssn-sticker{animation:none}.disc-banner.ssn-bugban{animation:none}}
`);

  // ================================================================ bits and pieces
  let T = [], wins = [], els = [], before = null, keyFn = null, glIv = 0, ampIv = 0, fw = null, icons = [], drill = false, phase = '';
  const later = (fn, ms) => { const t = setTimeout(() => { T = T.filter(x => x !== t); try { fn(); } catch (e) { console.error(e); } }, ms); T.push(t); return t; };
  const add = el => { DesktopSurface.root().appendChild(el); els.push(el); return el; };
  const ICO = {
    error: J('error', 32) || '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#e10600" stroke="#000"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3.5"/></svg>',
    warn: J('warning', 32) || '<svg viewBox="0 0 32 32" width="32" height="32"><path d="M16 2 31 29H1z" fill="#ffd400" stroke="#000"/><rect x="14.5" y="11" width="3" height="10"/><rect x="14.5" y="23" width="3" height="3"/></svg>',
    info: J('info', 32) || '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#000080" stroke-width="2"/><rect x="14" y="13" width="4" height="12" fill="#000080"/><rect x="14" y="7" width="4" height="4" fill="#000080"/></svg>',
    q: J('question', 32) || '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#000080" stroke-width="2"/><text x="16" y="23" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#000080">?</text></svg>',
  };
  const POPUP_ICO = '<svg viewBox="0 0 16 16"><rect x="1" y="3" width="14" height="10" fill="#ffffe1" stroke="#000"/><path d="M1 3l7 6 7-6" fill="none" stroke="#000"/></svg>';
  function place(w) {
    const r = w.el.getBoundingClientRect();
    w.el.style.left = Math.round(rnd(4, Math.max(5, DesktopSurface.width() - r.width - 4))) + 'px';
    w.el.style.top = Math.round(rnd(4, Math.max(5, DesktopSurface.height() - 36 - r.height - 4))) + 'px';
  }
  function err(title, text, kind, btns) {
    const b = h('div', '', `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px"><span style="flex:none;width:32px;height:32px">${ICO[kind] || ICO.error}</span><div class="txt" style="padding-top:6px"></div></div><div class="row" style="justify-content:center;margin-top:12px"></div>`);
    b.querySelector('.txt').textContent = text;
    const w = A.win(title, b, { w: Math.min(330, DesktopSurface.width() - 12), noResize: true, noMax: true, noMin: true, cls: 'ssn-err' });
    (btns || ['OK']).forEach((l, i) => { const x = h('button', 'btn' + (i ? '' : ' dflt'), esc(l)); x.type = 'button'; x.style.minWidth = '70px'; x.addEventListener('click', () => w.close()); b.lastChild.appendChild(x); });
    place(w); wins.push(w); sfx('uhoh');
    return w;
  }
  function popup(from, text) { // a WinPopup ("net send") from one of the mates
    const b = h('div', 'ssn-pop', `<div class="hd">Message from <b>${esc(from)}</b> to <b>JACK</b> on 01/01/1900 00:00</div><div class="msg"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">OK</button></div>`);
    b.querySelector('.msg').textContent = text;
    const w = A.win('JackPopup', b, { w: Math.min(300, DesktopSurface.width() - 12), noResize: true, noMax: true, noMin: true, cls: 'ssn-err', icon: POPUP_ICO });
    b.querySelector('.btn').addEventListener('click', () => w.close());
    place(w); wins.push(w); sfx('join');
    return w;
  }
  function jackamp() {
    const b = h('div', 'ssn-amp', `<div class="lcd2"><div class="t">19100</div><div class="sp">${'<i></i>'.repeat(16)}</div></div><div class="mq">***</div><div class="bt"><span>|&lt;</span><span>&#9654;</span><span>II</span><span>&#9632;</span><span>&gt;|</span></div>`);
    const w = A.win('JackAmp', b, { w: Math.min(280, DesktopSurface.width() - 12), noResize: true, noMax: true, noMin: true, cls: 'ssn-err', icon: J('jackamp') || undefined });
    place(w); wins.push(w);
    const msg = '  *** 1. JACK - HAPPY NEW YEAR 19100 (99:59) ***  PLAYLIST DATE: 01/01/19100  ***  ERROR: TRACK IS 18,101 YEARS LONG  ***';
    let i = 0; const bars = [...b.querySelectorAll('.sp i')], mq = b.querySelector('.mq');
    clearInterval(ampIv);
    ampIv = setInterval(() => { if (w.closed) return clearInterval(ampIv); i = (i + 1) % msg.length; mq.textContent = (msg + msg).slice(i, i + 44); bars.forEach(x => { x.style.height = Math.round(rnd(5, 100)) + '%'; }); }, reduced() ? 600 : 140);
    sfx('beep');
  }
  const CLIP_SVG = '<svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true"><path d="M38 86V30a12 12 0 0 1 24 0v44a7.5 7.5 0 0 1-15 0V36" fill="none" stroke="#5a6a7a" stroke-width="6" stroke-linecap="round"/><path d="M38 86V30a12 12 0 0 1 24 0v44a7.5 7.5 0 0 1-15 0V36" fill="none" stroke="#dfe7ef" stroke-width="2" stroke-linecap="round"/><ellipse cx="42" cy="38" rx="7" ry="9" fill="#fff" stroke="#000" stroke-width="1.5"/><ellipse cx="58" cy="38" rx="7" ry="9" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="43" cy="35" r="2.6"/><circle cx="57" cy="35" r="2.6"/><path d="M34 24l10 5M66 24l-10 5" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="5" ry="6" fill="#600" stroke="#000"/><path d="M20 20l-6-6M80 20l6-6M18 34h-8M82 34h8" stroke="#e10600" stroke-width="2.5" stroke-linecap="round"/></svg>';
  function clip() {
    const c = add(h('div', 'ssn-clip panic', `<div class="bal"><h4>AAAAARGH!!!</h4><p>It looks like it's the year <b>1900</b>! Would you like help?</p><button type="button" data-c="0"><i></i>Panic</button><button type="button" data-c="1"><i></i>Panic a bit more</button><button type="button" data-c="2"><i></i>Hide in the Recycle Bin</button></div><div class="bx"><div>Staples</div><div class="cv">${CLIP_SVG}</div></div>`));
    c.style.pointerEvents = 'auto';
    const say = [
      ['AAAAAAAAAA!!!', 'OK! I am panicking! AAAAAAAAAAAAA! (Is it helping? I don\'t think it\'s helping.)'],
      ['AAAAAAAAAAAAAAAAA!!!!!', 'Panicking MORE! Saving your letters... to a floppy... from 1900... which hasn\'t been invented!!!'],
      ['Good idea!', 'See you in 2000! Or 1900! Or whenever this is!'],
    ];
    c.querySelectorAll('[data-c]').forEach(x => x.addEventListener('click', () => {
      const [t, p] = say[+x.dataset.c], bal = c.querySelector('.bal');
      bal.innerHTML = `<h4>${esc(t)}</h4><p>${esc(p)}</p>`; sfx('boing');
      later(() => c.classList.add('gone'), 1600);
    }));
    later(() => sfx('boing'), 200);
  }
  function glitchOn() {
    const g = add(h('div', 'ssn-gl' + (reduced() ? ' calm' : '')));
    if (reduced()) return;
    document.body.classList.add('ssn-shake');
    const shuffle = () => {
      g.innerHTML = Array.from({ length: Math.floor(rnd(2, 6)) }, () => `<i class="${Math.random() < 0.5 ? 'b' : ''}" style="top:${rnd(0, 96).toFixed(1)}%;height:${rnd(0.6, 7).toFixed(1)}%;transform:translateX(${rnd(-18, 18).toFixed(0)}px)"></i>`).join('');
    };
    shuffle(); glIv = setInterval(shuffle, 130);
  }
  function glitchOff() { clearInterval(glIv); document.body.classList.remove('ssn-shake'); document.querySelectorAll('.ssn-gl').forEach(e => e.remove()); }
  function iconsWobble() {
    icons = [...document.querySelectorAll('.icons .dicon')].filter(e => e.offsetParent && e.style.display !== 'none');
    icons.forEach(e => { e.style.setProperty('--d', (-Math.random()).toFixed(2) + 's'); e.classList.add(reduced() ? 'ssn-ghost' : 'ssn-wob'); });
  }
  function iconsFall() {
    if (reduced()) return;
    const floor = DesktopSurface.height() - 32 - 70;
    icons.forEach((e, i) => {
      const r = e.getBoundingClientRect();
      e.classList.remove('ssn-wob');
      e.style.transition = `transform ${rnd(0.7, 1.1).toFixed(2)}s cubic-bezier(.5,0,.8,.4) ${(i * 0.06).toFixed(2)}s`;
      e.style.transform = `translate(${rnd(-30, 60).toFixed(0)}px,${Math.max(0, floor - r.top + rnd(-10, 4)).toFixed(0)}px) rotate(${rnd(-110, 110).toFixed(0)}deg)`;
      later(() => sfx('thud'), 800 + i * 60);
    });
  }
  function iconsBack() {
    icons.forEach((e, i) => {
      e.classList.remove('ssn-wob', 'ssn-ghost');
      if (!e.style.transform) return;
      e.style.transition = `transform 1.4s cubic-bezier(.2,1.3,.4,1) ${(i * 0.04).toFixed(2)}s`; e.style.transform = '';
      setTimeout(() => { e.style.transition = ''; }, 1600 + i * 40);
    });
  }
  function magBug(on) {
    const ban = document.querySelector('#browser .disc-banner');
    if (ban) { ban.classList.toggle('ssn-bugban', on); const st = ban.querySelector('.ssn-sticker'); if (on && !st) ban.appendChild(h('div', 'ssn-sticker', 'ISSUE 19100')); if (!on && st) st.remove(); }
    Y.bug = on;
  }

  // ================================================================ the show
  function big() { return document.querySelector('.ssn-big') || add(h('div', 'ssn-big', `<div class="lbl"></div><div class="num"></div><div class="sub"></div>${drill ? '<div class="esc">Y2K DRILL &middot; press Esc to stop</div>' : ''}`)); }
  function setBig(lbl, num, sub, cls) {
    const b = big(); b.classList.add('on');
    b.querySelector('.lbl').textContent = lbl; b.querySelector('.sub').textContent = sub;
    const n = b.querySelector('.num'); n.textContent = num; n.className = 'num ' + (cls || '');
    void n.offsetWidth; n.classList.add('bump');
  }
  function run(o) {
    o = o || {};
    if (Y.running) return;
    drill = !!o.drill; Y.running = true; before = new Set(document.querySelectorAll('.float')); Y.drill = drill; phase = 'count';
    document.body.classList.add('ssn-y2k');
    if (drill) got('drill');
    SS.eveOff && SS.eveOff();
    keyFn = ev => { if (ev.key !== 'Escape') return; ev.preventDefault(); if (drill) abort(); else if (phase !== 'end') { T.forEach(clearTimeout); T = []; settle(); } };
    document.addEventListener('keydown', keyFn, true);
    const from = Math.max(0, Math.min(10, Math.round(o.from == null ? 10 : o.from)));
    for (let i = from; i > 0; i--) later(() => {
      setBig(drill ? '*** Y2K DRILL *** the year 2000 in' : 'the year 2000 in', String(i), i > 3 ? 'SECONDS!!!' : i === 1 ? 'SECOND!!!' : 'SECONDS!!!');
      note(i <= 3 ? 880 : 660, 0.12, 'square');
      Y.clock = '23:59';
    }, (from - i) * 1000);
    later(midnight, from * 1000);
  }
  function midnight() {
    phase = 'bug';
    Y.clock = '0:00';
    setBig('', '2000', 'HAPPY NEW YEAR!!!', 'yr'); sfx('solve'); note(1320, 0.4, 'square');
    // ...but the computer doesn't think so
    const seq = ['2000', '2O00', '20?0', '19100', '1900'];
    seq.forEach((s, i) => later(() => { const n = document.querySelector('.ssn-big .num'); if (n) { n.textContent = s; n.className = 'num yr bad'; } if (i === 1) { const sb = document.querySelector('.ssn-big .sub'); if (sb) sb.textContent = 'MILLENNIUM BUG DETECTED'; } }, 1300 + i * 220));
    later(() => { Y.clock = '1/1/1900'; Y.y2kText = 'ERROR: 01/01/1900'; glitchOn(); magBug(true); sfx('uhoh'); }, 1500);
    later(() => { const b = document.querySelector('.ssn-big'); if (b) { b.classList.remove('on'); setTimeout(() => b.remove(), 600); } }, 2800);
    later(iconsWobble, 3000);
    later(iconsFall, 6200);
    const E = [
      () => err('JackOS', 'SYSTEM DATE OUT OF RANGE: 01-01-1900\n\nThe date is 98 years before JackOS 98 was invented.\n\nPlease wait 98 years and try again.', 'error'),
      () => err('CLOCK.DLL', 'The system clock has gone back 100 years.\n\nDo you want it to go forward 100 years?', 'q', ['Yes', 'No', 'Leave it']),
      jackamp,
      () => popup('CALLUM', 'MY PC IS BEEPING!!! IS IT GOING TO EXPLODE??? I UNPLUGGED IT AND IT IS STILL BEEPING\n\n...oh wait that\'s the smoke alarm. Dad\'s doing toast.'),
      () => err('JackNet Explorer', 'Welcome to JackNet! Today\'s date is: 1/1/19100\n\n(Lots of web sites stick "19" on the front of the year. This year, that makes it 19100.)', 'warn'),
      () => { if (window.Spooler) Spooler.print('Y2K_PANIC.TXT', { pages: 2, owner: 'JackOS', text: 'THE YEAR IS 1900. THE YEAR IS 1900. THE YEAR IS 1900.\n'.repeat(12) }); },
      () => err('JackMail Express', 'You have 36,524 days of unread mail.\n\nThe oldest message is from 1900. It says: "Is it the year 2000 yet?"', 'info'),
      () => popup('LUKE', 'is it 2000 yet?? me and dave are on rainbow roadworks and we are NOT pausing for a bug\n\nDAVE STOP USING THE LIGHTNING'),
      clip,
      () => err('Calendar', '1 January 1900 was a MONDAY.\n\n1 January 2000 is a SATURDAY.\n\nYour weekend has been cancelled. You have school today. In 1900.', 'warn'),
      () => popup('JACKK', 'my digital watch just went to 1 JAN 1980. is that the bug or is my watch just rubbish\n\nalso I traded you a Pidgeon at midnight. sorry. it was dark'),
      () => err('JACKTRIS.EXE', 'Your high score was set on 31/12/99, which is 99 years in the FUTURE.\n\nHigh score deleted for cheating.\n\n(Only joking. It\'s fine. Probably.)', 'error'),
      () => err('Scheduled Tasks', 'The scheduled task "Millennium" has finally run!\n\nResult: 1900.', 'info'),
      () => popup('DAVE', 'LUKE CHEATED. ALSO HAPPY NEW YEAR. ALSO WHY DOES DAD\'S VIDEO RECORDER SAY 1900'),
      () => err('JackOS', 'JackOS has performed an illegal operation (it tried to count to 2000) and will be shut down.\n\nIf the problem persists, it is probably the Millennium.', 'error', ['Close', 'Details >>']),
    ];
    E.forEach((f, i) => later(f, 3000 + i * 560));
    later(blackout, 3000 + E.length * 560 + 2200);
  }
  function closeAll() {
    wins.forEach(w => { if (!w.closed) w.close(); }); wins = [];
    // anything else that popped up during the chaos (the printer queue, low-resource warnings...) quietly goes too
    if (before) document.querySelectorAll('.float').forEach(f => { if (before.has(f) || f.classList.contains('ssn-keep')) return; const x = f.querySelector('.tb [data-w=close]') || f.querySelector('.tb .ctl button:last-child'); if (x) x.click(); else f.remove(); });
    clearInterval(ampIv);
    document.querySelectorAll('.ssn-clip').forEach(e => e.remove());
  }
  function blackout() {
    phase = 'dark';
    const k = add(h('div', 'ssn-black', '<span>. . .</span>'));
    void k.offsetWidth; k.classList.add('on');
    later(() => { closeAll(); glitchOff(); Y.clock = '0:00'; Y.y2kText = 'HAPPY NEW YEAR!!!'; magBug(false); }, 900);
    later(() => { k.querySelector('span').textContent = 'hang on...'; }, 1300);
    later(show, 2600);
  }
  function show() {
    phase = 'party';
    const k = document.querySelector('.ssn-black');
    const box = add(h('div', 'ssn-fw', `<canvas></canvas><div class="ssn-hny"><b>HAPPY NEW YEAR 2000!!!</b><small>from Jack, Luke, Dave, Callum and JackK (and Mom, and the beans)</small></div>`));
    void box.offsetWidth; box.classList.add('on');
    if (k) { k.classList.remove('on'); setTimeout(() => k.remove(), 900); }
    Y.clock = '1/1/2000';
    fw = SS.fireworks(box.querySelector('canvas'), { calm: reduced() });
    for (let i = 0; i < (reduced() ? 2 : 5); i++) later(() => fw && fw.launch(), 200 + i * 260);
    later(() => fw && fw.finale('2000'), 3200);
    later(() => fw && fw.finale('2000'), 9200);
    later(() => { if (fw) fw.rate = 0.25; }, 10500);
    later(() => { if (fw) fw.stop(); }, 13500);
    later(settle, 15500);
    try { if (Sound.on) Sound.music.play('theme'); } catch (e) {}
  }
  function settle() {
    phase = 'end';
    closeAll(); glitchOff(); magBug(false);
    document.querySelectorAll('.ssn-big,.ssn-black').forEach(e => e.remove());
    const box = document.querySelector('.ssn-fw');
    if (box) { box.classList.remove('on'); setTimeout(() => { if (fw) fw.kill(); fw = null; box.remove(); }, 1300); }
    try { Sound.music.stop(); } catch (e) {}
    iconsBack();
    Y.clock = null; Y.y2kText = null;
    later(restartBox, 2200);
  }
  function restartBox() {
    const b = h('div', '', `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start"><span style="flex:none;width:32px;height:32px">${J('shutdown', 32) || ICO.info}</span><div class="txt" style="white-space:pre-line;padding-top:4px"></div></div><div class="row" style="justify-content:center;margin-top:14px"></div>`);
    b.querySelector('.txt').textContent = drill
      ? 'Y2K DRILL COMPLETE.\n\nIn the real thing, JackOS would now notice it is the year 2000. JackOS 98 only knows about 1999, so it would have to restart.\n\nRestart now (for realism)?'
      : 'JackOS has detected that the date is 01/01/2000.\n\nJackOS 98 only knows about 1999. Your computer must restart before the new date can take effect.\n\n(Don\'t worry. Nothing is lost. It\'s just 1999 again.)';
    const w = A.win(drill ? 'Y2K Drill' : 'System Settings Change', b, { w: Math.min(360, DesktopSurface.width() - 12), noResize: true, noMax: true, noMin: true, cls: 'ssn-keep' });
    const btns = b.lastChild;
    const mk = (l, fn, d) => { const x = h('button', 'btn' + (d ? ' dflt' : ''), esc(l)); x.type = 'button'; x.style.minWidth = '90px'; x.addEventListener('click', fn); btns.appendChild(x); return x; };
    let n = 15, iv = 0;
    const go = () => { clearInterval(iv); w.close(); finish(true); };
    const rb = mk(drill ? 'Restart' : `Restart Now (${n})`, go, true);
    if (drill) mk('No thanks', () => { w.close(); finish(false); });
    else iv = setInterval(() => { if (w.closed) return clearInterval(iv); n--; rb.textContent = `Restart Now (${n})`; if (n <= 0) go(); }, 1000);
    setTimeout(() => rb.focus(), 40);
    sfx('uhoh');
  }
  function finish(restart) {
    const wasDrill = drill;
    cleanup();
    if (restart) { Y.running = true; SS.restart(wasDrill ? 'drill' : 'real'); return; } // stays "running" so nothing else starts mid-restart
    Desk.toast('Y2K Drill', 'Drill complete! You survived the Millennium Bug. (This time.)', 6000);
  }
  function cleanup() {
    T.forEach(clearTimeout); T = [];
    closeAll(); glitchOff(); magBug(false); iconsBack();
    if (fw) { fw.kill(); fw = null; }
    els.forEach(e => e.remove()); els = [];
    if (keyFn) document.removeEventListener('keydown', keyFn, true); keyFn = null;
    try { Sound.music.stop(); } catch (e) {}
    document.body.classList.remove('ssn-y2k');
    Y.clock = null; Y.y2kText = null; Y.bug = false; Y.running = false; Y.drill = false; phase = ''; before = null;
  }
  function abort() { cleanup(); Desk.toast('Y2K Drill', 'Drill stopped. Everybody back to 1999.', 3500); }

  window.SeasonsY2K = { run, abort, get phase() { return phase; } };
})();

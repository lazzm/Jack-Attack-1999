/* leapday-x: the day that doesn't exist (lazy loaded by leapday.js on 29 February only).
 * The PC is stuck between Sunday 28/02/99 and Monday 01/03/99: every date on screen shows the impossible one, the
 * picture glitches now and then (inside the CRT only, calmer with reduced motion, cheap on small screens), titles and
 * menus misspell themselves, desktop icons swap places for a moment, the clock jumps to midnight and back, counters
 * scramble, a whole day sits in the Recycle Bin, nobody@nowhen.void sends e-mail, and a Ceefax-ish site lives at
 * www.nowhen.void. At midnight ScanDisk repairs the calendar and puts the lost day in C:\LOSTDAYS.
 * Nothing here changes anything for real: every glitch puts things back exactly as it found them. */
(function () {
  'use strict';
  if (window.LeapX || !window.Apps || !window.LeapDay) return;
  const A = Apps, L = LeapDay, $ = id => document.getElementById(id), esc = A.esc, store = A.store;
  const SS = () => window.Seasons;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 640 || matchMedia('(hover:none)').matches;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const note = (f, s, t) => { try { if (Sound.on && Sound.note) Sound.note(f, s, t); } catch (e) {} };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const got = id => A.secret('leap.' + id);
  const booted = () => !$('boot') && !document.querySelector('.logon');
  const visible = e => !!(e && e.isConnected && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SITE = 'www.nowhen.void', SITE_URL = 'http://www.nowhen.void/';
  const occ = () => (SS() && SS().offset ? 'test' : String(L.now().getFullYear())); // one lot of e-mail per leap day

  let active = false, timers = new Set(), obs = [], ivs = [];
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); try { fn(); } catch (e) { console.error(e); } }, ms); timers.add(t); return t; };
  const every = (fn, ms) => { const t = setInterval(() => { try { fn(); } catch (e) { console.error(e); } }, ms); ivs.push(t); return t; };
  const watch = (el, fn, o) => { if (!el) return; const m = new MutationObserver(() => { if (active) fn(); }); m.observe(el, o || { childList: true }); obs.push(m); };

  // ================================================================ CSS
  const CSS = `
#lpglitch{position:fixed;inset:0;z-index:2147483645;pointer-events:none;display:none;overflow:hidden;contain:strict}
body.lp-burst #lpglitch,body.lp-lite #lpglitch,body.lp-calm #lpglitch{display:block}
#lpglitch i{position:absolute;left:-4%;width:108%;top:0;height:6px;mix-blend-mode:difference;background:linear-gradient(90deg,rgba(255,0,90,.55),rgba(0,255,230,.45) 40%,rgba(255,255,255,.3) 62%,rgba(80,0,255,.5));will-change:transform}
body.lp-burst #desktop,body.lp-burst #taskbar,body.lp-burst .float{filter:url(#lpRgb)}
body.lp-lite #desktop{animation:lpjit .14s steps(2) infinite}
@keyframes lpjit{0%{transform:translate(0)}33%{transform:translate(-3px,1px)}66%{transform:translate(3px,-1px)}}
body.lp-calm #lpglitch{background:rgba(120,0,255,.05);box-shadow:inset 3px 0 0 rgba(255,0,80,.22),inset -3px 0 0 rgba(0,255,255,.22)}
body.lp-calm #lpglitch i{display:none}
#todayLine.lp-flick{color:#8000ff;text-shadow:1px 0 rgba(255,0,90,.6),-1px 0 rgba(0,200,255,.6)}
#clock.lp-cj{color:#c00}
.news li.lp-news{border-left:3px dashed #8000ff;padding-left:6px}
.news li.lp-news .lp-cut{animation:lpblink 1s steps(1) infinite}
.news li.lp-news .lp-garb{display:block;margin-top:2px;font:11px "Courier New",monospace;color:#8000ff;word-break:break-all}
@keyframes lpblink{50%{opacity:0}}
.cl-day.lp-29{background:repeating-linear-gradient(45deg,#fff 0 6px,#f3ecff 6px 12px)!important;outline:1px dashed #8000ff;outline-offset:-3px;color:#8000ff;animation:lpcell 3.2s steps(1) infinite}
.cl-day.lp-29 b{font-style:italic}
.cl-day.lp-29 .ev.lp-ev{border-color:#8000ff;background:#efe2ff;color:#400080}
.calgrid span.lp-29{color:#8000ff;outline:1px dashed #8000ff;outline-offset:-2px;cursor:pointer;animation:lpcell 3.2s steps(1) infinite}
@keyframes lpcell{0%,90%{opacity:1;transform:none}91%{opacity:.35;transform:translateX(2px)}94%{opacity:1;transform:none}97%{opacity:.55}}
.lp-void{margin:12px auto;max-width:520px;background:#000;color:#0f0;border:2px solid #f0f;padding:8px 10px;font:12px/1.4 "Courier New",monospace;position:relative;overflow:hidden;text-align:left;box-shadow:3px 3px 0 #0ff;animation:lpvoid 4.5s steps(1) infinite;clear:both}
.lp-void b{color:#ff0;display:block;margin-bottom:4px;letter-spacing:1px}
.lp-void .nz{color:#f0f;opacity:.85;word-break:break-all;margin:4px 0}
.lp-void a{color:#0ff}
@keyframes lpvoid{0%,90%{transform:none;filter:none}91%{transform:translateX(-4px) skewX(6deg);filter:hue-rotate(90deg)}93%{transform:translateX(3px)}95%{transform:none;filter:none}}
.lp-dim{position:fixed;inset:0;z-index:2147483640;background:#000;opacity:0;transition:opacity .7s;display:flex;align-items:center;justify-content:center;color:#aab;font:16px/1.6 "Courier New",monospace;text-align:center;padding:16px;cursor:default}
.lp-dim.on{opacity:.93}
.lp-dv{background:#000;color:#9fc;font:12px/1.55 "Courier New",monospace;height:100%;min-height:260px;overflow:auto;padding:8px 10px;white-space:pre-wrap}
.lp-dv b{color:#ff0;font-weight:normal}
.lp-dv i{color:#f6f;font-style:normal}
#lpRepair{position:fixed;inset:0;z-index:2147483641;background:#0000a8;color:#fff;font:15px/1.4 "Courier New",monospace;display:flex;flex-direction:column}
#lpRepair .hd{background:#c0c0c0;color:#000;padding:2px 10px;display:flex;justify-content:space-between}
#lpRepair .mid{flex:1;display:flex;align-items:center;justify-content:center;padding:12px}
#lpRepair .box{background:#c0c0c0;color:#000;border:2px solid #fff;box-shadow:6px 6px 0 #000;max-width:600px;width:100%;padding:12px 16px}
#lpRepair .box h2{margin:-12px -16px 10px;padding:2px 8px;background:#000080;color:#fff;font:bold 15px "Courier New",monospace;text-align:center}
#lpRepair pre{margin:0;font:inherit;white-space:pre-wrap;min-height:11em}
#lpRepair .bar{margin:10px 0 4px;height:16px;border:1px solid #000;background:#fff;overflow:hidden}
#lpRepair .bar i{display:block;height:100%;width:0;background:#000080;transition:width .25s}
#lpRepair .btns{display:flex;gap:14px;justify-content:center;margin-top:10px}
#lpRepair .btns[hidden]{display:none}
#lpRepair .btns button{font:inherit;background:#c0c0c0;border:0;padding:2px 8px;cursor:pointer;color:#000}
#lpRepair .btns button:focus,#lpRepair .btns button:hover{background:#000080;color:#fff;outline:0}
#lpRepair .ft{background:#c0c0c0;color:#000;padding:2px 10px}
@media (max-width:640px){#lpRepair{font-size:12px}}
@media (prefers-reduced-motion:reduce){.cl-day.lp-29,.calgrid span.lp-29,.lp-void,.news li.lp-news .lp-cut{animation:none!important}.lp-dim{transition:none}}
/* ---- www.nowhen.void: NOWHENTEXT */
.lp-tv{background:radial-gradient(ellipse at 50% 0,#1c1830,#07060c 70%);min-height:100%;min-height:max(100%,640px);box-sizing:border-box;padding:16px 10px 24px;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:flex-start;font-family:"Courier New",monospace;outline:0}
.lp-set{flex:0 1 560px;min-width:0;background:linear-gradient(#45403c,#24211f);border-radius:20px;padding:16px 16px 26px;box-shadow:0 8px 30px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.15);position:relative}
.lp-set::after{content:"NOWHEN";position:absolute;bottom:6px;left:0;right:0;text-align:center;font:bold 10px/1 Arial,sans-serif;letter-spacing:4px;color:#9a948c}
.lp-scr{background:#000;color:#fff;border-radius:12px/16px;padding:10px 10px 8px;font:bold 15px/1.2 "Courier New",monospace;overflow:hidden;position:relative;min-height:25em;box-shadow:inset 0 0 40px rgba(120,140,255,.15)}
.lp-scr::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.04) 0 1px,transparent 1px 3px);border-radius:inherit}
.lp-hdr{display:flex;gap:.6em;white-space:nowrap;overflow:hidden}
.lp-hdr .pn{color:#fff}.lp-hdr .nm{color:#ff0}.lp-hdr .dt{color:#0ff;flex:1;overflow:hidden;text-overflow:ellipsis}.lp-hdr .tm{color:#ff0}
.lp-body{margin-top:.5em;min-height:20em}
.lp-body .l{min-height:1.2em;white-space:pre-wrap;word-break:break-word}
.lp-body .dh{transform:scale(1,2);transform-origin:0 0;height:1.2em;min-height:0;margin-bottom:1.2em;white-space:pre;overflow:hidden}
.lp-body .bb{background:#00f}.lp-body .br{background:#f00}.lp-body .bg{background:#0a0}.lp-body .bm{background:#a0a}.lp-body .bk{background:#000}
.lp-scr .y{color:#ff0}.lp-scr .c{color:#0ff}.lp-scr .g{color:#0f0}.lp-scr .r{color:#f33}.lp-scr .m{color:#f0f}.lp-scr .w{color:#fff}.lp-scr .u{color:#55f}
.lp-scr .cz{color:transparent;background:#000;border-bottom:1px dotted #333}
.lp-tv.rev .lp-scr .cz{color:#ff0;background:#a0a}
.lp-scr .lnk{cursor:pointer}
.lp-scr .lnk:hover,.lp-scr .lnk:focus{background:#00f;outline:0}
.lp-logo{display:grid;grid-template-columns:repeat(31,1fr);gap:1px;background:#00f;padding:4px;margin:2px 0 6px}
.lp-logo i{aspect-ratio:1/1.3;background:transparent}
.lp-logo i.on{background:#ff0}
.lp-logo i.on.f{animation:lpcell 2.6s steps(1) infinite}
.lp-scr.glx .lp-body .l:nth-child(4n+1){transform:translateX(.6em);color:#f0f}
.lp-fast{display:flex;gap:2px;margin-top:6px}
.lp-fast button{flex:1;min-width:0;border:0;padding:4px 2px;font:bold 12px/1 "Courier New",monospace;cursor:pointer;color:#000;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.lp-fast .fr{background:#f00;color:#fff}.lp-fast .fg{background:#0f0}.lp-fast .fy{background:#ff0}.lp-fast .fc{background:#0ff}
.lp-sq{margin:8px auto;width:min(220px,70%);aspect-ratio:1;border:3px dashed #fff;position:relative;transition:transform 1.4s ease-in,opacity 1.4s ease-in;display:flex;align-items:center;justify-content:center;text-align:center;color:#f0f;font:bold 18px "Comic Sans MS","Comic Sans",cursive;padding:10px;box-sizing:border-box;word-break:break-word}
.lp-sq::before{content:"29";position:absolute;left:6px;top:4px;color:#fff;font:bold 16px "Courier New",monospace}
.lp-sq.in{transform:scale(7);opacity:0}
.lp-sign{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0}
.lp-sign input{font:bold 14px "Courier New",monospace;background:#000;color:#ff0;border:1px solid #ff0;padding:3px 6px;width:12em;max-width:60vw}
.lp-scr .tvb{font:bold 13px "Courier New",monospace;background:#00f;color:#fff;border:0;padding:4px 10px;cursor:pointer;margin:2px}
.lp-scr .tvb:hover,.lp-scr .tvb:focus{background:#ff0;color:#000;outline:0}
.lp-remote{flex:0 0 150px;background:linear-gradient(#2d2d33,#141418);border-radius:16px 16px 26px 26px;padding:12px 12px 18px;box-shadow:0 6px 20px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.12);color:#ccc;font:bold 10px Arial,sans-serif;text-align:center}
.lp-remote .ent{background:#0b1a0b;color:#5f5;font:bold 18px "Courier New",monospace;border:1px solid #000;padding:4px;margin:0 0 10px;letter-spacing:3px;box-shadow:inset 0 0 8px #000}
.lp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.lp-remote button{border:0;border-radius:50%;aspect-ratio:1;background:radial-gradient(circle at 40% 35%,#6a6a72,#2a2a30);color:#fff;font:bold 15px Arial,sans-serif;cursor:pointer;box-shadow:0 2px 0 #000;min-height:34px}
.lp-remote button:active{transform:translateY(1px);box-shadow:none}
.lp-remote .k0{grid-column:2}
.lp-remote .wide{border-radius:8px;aspect-ratio:auto;width:100%;margin-top:9px;padding:7px 0;font-size:11px;letter-spacing:1px}
.lp-remote .rv{background:linear-gradient(#a0a,#606)}
.lp-remote .rv.on{background:linear-gradient(#f6f,#a0a);color:#000}
.lp-remote .fbs{display:flex;gap:4px;margin-top:9px}
.lp-remote .fbs button{flex:1;border-radius:4px;aspect-ratio:auto;height:14px;min-height:0;padding:0}
.lp-remote small{display:block;margin-top:10px;color:#777;font-weight:normal;line-height:1.3}
@media (max-width:640px){.lp-scr{font-size:11.5px;min-height:24em;padding:8px 6px}.lp-set{padding:10px 10px 22px;border-radius:14px}.lp-remote{flex:1 1 100%;max-width:340px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}.lp-remote .ent{grid-column:1/-1;margin:0}.lp-remote small{grid-column:1/-1}.lp-remote button{min-height:38px}}
`;
  function css() { if ($('lp-css')) return; const s = h('style'); s.id = 'lp-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ================================================================ dates: everything that SHOWS the date shows the impossible one
  const TITLE = 'Somewhenday, 29 February 1999';
  function clockTitle() {
    const c = $('clock'); if (!c) return;
    const fix = () => { if (c.hasAttribute('title') && c.title !== TITLE) c.title = TITLE; };
    watch(c, fix, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['title'] });
    fix();
    // the tray's own date tooltip (apps-system.js) reads Desk.today99(): put the impossible date in it as it appears
    watch(document.body, () => {
      for (const tip of document.querySelectorAll('body > .sys-tooltip')) {
        if (!/28 February 1999/.test(tip.textContent)) continue;
        const w0 = tip.offsetWidth; tip.textContent = tip.textContent.replace(/^\w+, 28 February 1999/, TITLE);
        const left = parseFloat(tip.style.left) || 0, w1 = tip.offsetWidth;
        tip.style.left = Math.max(2, Math.min(innerWidth - w1 - 2, left - (w1 - w0))) + 'px';
      }
    });
  }
  // the magazine's "Today is" line can't decide
  const TODAY = ['Sunday 28 February 1999', '?????day 29 February 1999', 'Monday 1 March 1999'];
  let todayIdx = 1;
  const todaySet = i => { const e = $('todayLine'); if (!e) return; todayIdx = i; const t = 'Today is ' + TODAY[i]; if (e.textContent !== t) e.textContent = t; e.classList.toggle('lp-flick', i === 1); };
  function todayLine() {
    const e = $('todayLine'); if (!e) return;
    watch(e, () => { if (!TODAY.some(t => e.textContent === 'Today is ' + t)) todaySet(todayIdx); });
    todaySet(1);
    if (reduced()) return; // calm: it just says the impossible day
    const flip = () => { if (!active) return; const r = Math.random(); todaySet(todayIdx !== 1 ? 1 : r < 0.5 ? 0 : 2); later(flip, todayIdx === 1 ? rnd(1400, 3200) : rnd(160, 420)); };
    later(flip, 1500);
  }
  // a half-written JACK ATTACK! news post
  const NEWS = `<b>29/02/99</b><span class="tag tag-SITE">SITE</span>Something weird is going on with the PC today. The clock keeps going to midnight on its own, the calendar has got a square in it that wasn't there yesterday, and I swear the Recycle Bin is <i>humming</i>. Dave says it's because 1999 isn't a leap year, so today is a day that doesn't exi<span class="lp-cut">&#9608;</span><span class="lp-garb">[POST NOT FINISHED. LAST SAVED 24:60. &#9618;&#9617;&#9619; www.n&#9617;wh&#9618;n.v&#9619;id &#9617;&#9618;]</span>`;
  function newsPost() {
    const ul = $('news'); if (!ul) return;
    const put = () => { if (ul.querySelector('.lp-news')) return; const li = h('li', 'lp-news fresh', NEWS); ul.prepend(li); };
    watch(ul, put); put();
  }
  // the calendar program and Date/Time Properties both grow a 29th square
  function day29() {
    sfx('uhoh');
    Desk.msgbox('29 February 1999', '29 February 1999 does not exist.\n\n1999 is not a leap year. There is nothing on this day. There is nothing IN this day.\n\n...but the square is here anyway.\n\nDo you want to go there?', 'q', [['Go there', openSite], ['Stay here']]);
  }
  function calendars() {
    document.querySelectorAll('.cl-month').forEach(g => {
      const w = g.closest('.appwin'), t = w && w.querySelector('.cl-title');
      if (!t || t.textContent !== 'February 1999' || g.hidden || g.querySelector('.lp-29')) return;
      // 28/02/99 was a Sunday, so the 29th starts a whole extra week that shouldn't be there
      const c = h('div', 'cl-day lp-29', '<b>29</b><span class="ev lp-ev">????????</span><span class="ev lp-ev">(no day)</span>');
      c.title = '29 February 1999 (this day does not exist)';
      c.addEventListener('click', ev => { ev.stopPropagation(); day29(); });
      g.appendChild(c);
      for (let d = 1; d <= 6; d++) { const o = h('div', 'cl-day off' + (d >= 5 ? ' wknd' : ''), `<b>${d}</b>`); o.dataset.o = '3'; g.appendChild(o); }
      g.style.gridTemplateRows = 'auto repeat(5,minmax(0,1fr))';
    });
    document.querySelectorAll('.calgrid').forEach(g => {
      const f = g.closest('.float'), sel = f && f.querySelector('select');
      if (!sel || !/February/.test(sel.value) || g.querySelector('.lp-29')) return;
      const s = h('span', 'lp-29', '29'); s.title = '29 February 1999 (this day does not exist)'; s.addEventListener('click', day29); g.appendChild(s);
    });
  }
  function calendarsOff() {
    document.querySelectorAll('.cl-month').forEach(g => { if (!g.querySelector('.lp-29')) return; const w = g.closest('.appwin'); const b = w && w.querySelector('.cl-today'); if (b) b.click(); else g.querySelectorAll('.lp-29').forEach(e => e.remove()); });
    document.querySelectorAll('.calgrid .lp-29').forEach(e => e.remove());
  }

  // ================================================================ glitches (never while booting, in a game of Y2K, or during a crash)
  function canGlitch() {
    if (!active || document.hidden || !booted() || $('lpRepair')) return false;
    if (document.body.classList.contains('pc-power') || document.body.classList.contains('ssn-y2k')) return false;
    if (SS() && SS().Y && SS().Y.running) return false;
    const b = $('bsod'); if (b && getComputedStyle(b).display !== 'none') return false;
    if (window.Savers && Savers.running) return false;
    return true;
  }
  function schedule(fn, first, a, b) { const loop = (ms) => later(() => { if (canGlitch()) fn(); loop(rnd(a, b)); }, ms); loop(first); }

  // ---- picture bursts: RGB split + horizontal tear + jitter, a second or two
  let bursting = false, glx = null;
  function glitchLayer() {
    if (glx && glx.isConnected) return glx;
    glx = h('div', '', '<i></i><i></i><i></i><i></i>'); glx.id = 'lpglitch'; glx.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glx);
    if (!$('lpRgbSvg')) {
      const s = h('div', '', `<svg id="lpRgbSvg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><filter id="lpRgb" x="-2%" y="0" width="104%" height="100%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.00001 0.045" numOctaves="1" seed="7" result="n"/>
<feComponentTransfer in="n" result="q"><feFuncR type="discrete" tableValues="0.5 0.5 0.5 0.32 0.5 0.5 0.7 0.5 0.5"/><feFuncG type="discrete" tableValues="0.5"/></feComponentTransfer>
<feDisplacementMap in="SourceGraphic" in2="q" scale="40" xChannelSelector="R" yChannelSelector="G" result="t"/>
<feColorMatrix in="t" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="4" dy="0" result="ro"/>
<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="-3" dy="0" result="gbo"/>
<feBlend in="ro" in2="gbo" mode="screen"/></filter></svg>`).firstElementChild;
      document.body.appendChild(s);
    }
    return glx;
  }
  function burst(ms) {
    if (bursting) return; bursting = true;
    const B = document.body, calm = reduced(), lite = !calm && small();
    const layer = glitchLayer();
    if (calm) { B.classList.add('lp-calm'); setTimeout(() => { B.classList.remove('lp-calm'); bursting = false; }, 450); return; }
    ms = ms || rnd(800, 1800);
    const cls = lite ? 'lp-lite' : 'lp-burst';
    const turb = !lite && document.querySelector('#lpRgb feTurbulence'), offs = !lite ? document.querySelectorAll('#lpRgb feOffset') : [], disp = !lite && document.querySelector('#lpRgb feDisplacementMap');
    const bars = [...layer.children];
    const frame = () => {
      bars.forEach(b => { const on = Math.random() < 0.7; b.style.display = on ? '' : 'none'; if (on) { b.style.top = rnd(0, 100) + '%'; b.style.height = ri(2, 26) + 'px'; b.style.transform = `translateX(${ri(-30, 30)}px)`; } });
      if (turb) turb.setAttribute('seed', ri(1, 999));
      if (offs.length) { offs[0].setAttribute('dx', ri(2, 7)); offs[1].setAttribute('dx', -ri(2, 6)); }
      if (disp) disp.setAttribute('scale', ri(16, 60));
    };
    frame(); B.classList.add(cls);
    note(rnd(70, 110), 0.07, 'sawtooth'); setTimeout(() => note(rnd(1800, 2600), 0.03, 'square'), 120);
    const iv = setInterval(frame, lite ? 110 : 75);
    setTimeout(() => { clearInterval(iv); B.classList.remove(cls); bursting = false; }, ms);
  }

  // ---- a window title or menu label shows the wrong letters for a moment
  const GLYPH = '#%&@$?!01|/\\<>{}[]~^*=+'.split('');
  const garble = (s, k) => s.replace(/[A-Za-z0-9]/g, ch => Math.random() < k ? (Math.random() < 0.6 ? pick(GLYPH) : String.fromCharCode(65 + ri(0, 25))) : ch);
  const WORDS = ['NOWHEN', '29/02', '????day', '24:60', 'NOT A DAY'];
  function letters() {
    const els = [...document.querySelectorAll('.float .tb .t, #winTitle, #ieMenu > button, .appmenu > button, #taskBrowser')].filter(visible);
    if (!els.length) return;
    const n = Math.min(els.length, Math.random() < 0.3 ? 2 : 1);
    for (let i = 0; i < n; i++) {
      const el = els.splice(ri(0, els.length - 1), 1)[0], saved = el.innerHTML, txt = el.textContent;
      if (!txt.trim()) continue;
      let bad = garble(txt, rnd(0.25, 0.55));
      if (Math.random() < 0.25 && txt.length > 8) { const w = pick(WORDS), at = ri(0, Math.max(0, txt.length - w.length)); bad = bad.slice(0, at) + w + bad.slice(at + w.length); }
      el.textContent = bad;
      setTimeout(() => { if (el.textContent === bad) el.innerHTML = saved; }, rnd(260, 700));
    }
  }

  // ---- two desktop icons swap places, then swap back (just a transform: nothing actually moves)
  function icons() {
    if (reduced()) return;
    const ics = [...document.querySelectorAll('.icons .dicon')].filter(visible);
    if (ics.length < 2) return;
    const a = pick(ics), b = pick(ics.filter(x => x !== a)), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ta = a.style.transform, tb = b.style.transform;
    const mine = [`translate(${Math.round(rb.left - ra.left)}px,${Math.round(rb.top - ra.top)}px)`, `translate(${Math.round(ra.left - rb.left)}px,${Math.round(ra.top - rb.top)}px)`];
    a.style.transform = mine[0]; b.style.transform = mine[1];
    setTimeout(() => { if (a.style.transform === mine[0]) a.style.transform = ta; if (b.style.transform === mine[1]) b.style.transform = tb; }, rnd(1400, 2600));
  }

  // ---- the tray clock jumps 23:59 -> 00:00 -> 23:59 (and back to the real time)
  let jumping = false;
  const realClock = () => { const n = L.now(); return n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0'); };
  function clockJump() {
    const c = $('clock'), Y = SS() && SS().Y; if (!c || jumping || (Y && Y.clock != null)) return;
    jumping = true; c.classList.add('lp-cj');
    const set = v => { if (Y) Y.clock = v; c.textContent = v; };
    const seq = [['23:59', 1300], ['00:00', 1700], ['23:59', 1300]];
    let i = 0;
    const step = () => {
      if (i >= seq.length || !active) { if (Y) Y.clock = null; c.textContent = realClock(); c.classList.remove('lp-cj'); jumping = false; return; }
      set(seq[i][0]); if (seq[i][0] === '00:00') note(880, 0.05, 'square');
      setTimeout(step, seq[i++][1]);
    };
    step();
  }
  function clockClick() {
    const c = $('clock'); if (!c || c._lp) return; c._lp = true;
    c.addEventListener('click', () => { if (!jumping || !active) return; got('clock'); Desk.toast('Date/Time', 'You caught the clock between two days! It was 23:59 and 00:00 at the same time. (It is very embarrassed.)', 6000); });
  }

  // ---- hit counters scramble (and settle back to the real number)
  function counters() {
    [$('readerNo'), $('btnCount')].filter(visible).forEach(el => {
      const saved = el.innerHTML; let mine = null, n = 0;
      const digits = (fn) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) t.nodeValue = t.nodeValue.replace(/\d/g, fn); };
      const iv = setInterval(() => {
        if (mine != null && el.innerHTML !== mine) { clearInterval(iv); return; } // the real counter moved: leave it be
        if (++n > 14) { clearInterval(iv); if (el.innerHTML === mine) el.innerHTML = saved; return; }
        el.innerHTML = saved;
        let k = 0; digits(() => (n > 11 ? '29'[k++ % 2] : String(ri(0, 9)))); mine = el.innerHTML;
      }, 75);
    });
  }

  // ================================================================ the Recycle Bin has a whole day in it
  const DAY_ICO = '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M5 4h22v25H5z" fill="#fff" stroke="#000" stroke-dasharray="3 1"/><path d="M5 4h22v6H5z" fill="#8000ff" stroke="#000"/><path d="M9 2v5M23 2v5" stroke="#000" stroke-width="2"/><text x="16" y="25" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="12" fill="#8000ff">29</text><path d="M20 12l-3 5 3 3-4 7" stroke="#000" fill="none"/></svg>';
  function binPut() {
    if (!A.recycle || A.recycle.has('leap.day')) return;
    A.recycle.put({
      id: 'leap.day', from: 'C:/JACKOS/CALENDAR', del: '29/02/99',
      node: { name: '29-02-99.DAY', type: 'day', svg: DAY_ICO, size: '0 bytes', date: '29/02/99' },
      confirm: "Are you sure you want to delete '29-02-99.DAY'?\n\n(You can't delete a day that never happened. But you can try.)",
      onRestore: restoreDay,
      onEmpty: () => later(() => { binPut(); A.recycle.wobble(); Desk.toast('Recycle Bin', '29-02-99.DAY could not be deleted: the day does not exist, so there is nothing to delete. It has climbed back into the Recycle Bin.', 7000); }, 2200),
    });
  }
  function restoreDay() {
    got('restore');
    const dim = h('div', 'lp-dim', '<div>JackOS is restoring 29-02-99.DAY to C:\\JACKOS\\CALENDAR...</div>');
    document.body.appendChild(dim);
    note(98, 1.4, 'sine'); setTimeout(() => note(92.5, 1.6, 'sine'), 500);
    requestAnimationFrame(() => dim.classList.add('on'));
    const msg = t => { if (dim.firstChild) dim.firstChild.textContent = t; };
    const T = [setTimeout(() => msg('Cannot restore 29-02-99.DAY: there is no room for it between 28/02 and 01/03.'), 1500), setTimeout(() => msg('...'), 3000), setTimeout(() => msg('...thank you.'), 3800), setTimeout(close, 5600)];
    function close() { T.forEach(clearTimeout); dim.classList.remove('on'); setTimeout(() => dim.remove(), reduced() ? 0 : 750); viewer(); }
    dim.addEventListener('click', close);
  }
  function viewer() {
    const b = h('div', 'lp-dv');
    const w = A.win('29-02-99.DAY - Day Viewer', b, { w: 420, h: 380, icon: DAY_ICO, minW: 240, onClose: () => later(() => { binPut(); if (A.recycle) A.recycle.wobble(); Desk.toast('Recycle Bin', '29-02-99.DAY has crawled back into the Recycle Bin. It feels safer in there.', 6000); }, 4000) });
    const lines = ['<b>DAY VIEWER 1.0</b>   file: 29-02-99.DAY   size: 24 hours', 'Opened: never.  Last modified: never.', ''];
    for (let i = 0; i < 24; i++) lines.push(`${String(i).padStart(2, '0')}:00  ${i === 7 ? '(the alarm clock went off, but there was no morning)' : i === 13 ? '(somebody left a Rubik\'s cube here. It\'s solved.)' : i === 16 ? '(Robot Wars was on, but nobody was fighting)' : i === 20 ? '(a Tamagotchi beeped once, very far away)' : '.......... (nothing happened)'}`);
    lines.push('', '<i>23:59  nobody left a message:</i>', '<i>       "come and see. ' + SITE + '"</i>');
    let i = 0;
    const add = () => { if (w.closed) return; b.innerHTML = lines.slice(0, ++i).join('\n'); b.scrollTop = 1e6; if (i < lines.length) setTimeout(add, reduced() ? 0 : 90); };
    add();
    return w;
  }

  // ================================================================ e-mail from nobody@nowhen.void
  const NOBODY = 'nobody <nobody@nowhen.void>';
  const MAILS = [
    { id: 'hello', at: [35000, 65000], subj: '(no subject)', body: "hello?\n\nis anybody there?\n\nit's very quiet here. the clocks don't go round. the telly is just the test card. i found a Tamagotchi on the floor and it won't hatch because it's waiting for tomorrow.\n\ni think i'm stuck in between two days.\n\n- nobody" },
    { id: 'visit', at: [200000, 260000], subj: 'Re: (no subject)', body: "you can come and visit if you like.\n\n    " + SITE_URL + "\n\nit only works today. it only ever works today.\n\nbring a torch. and a Rubik's cube, there's nothing to do here.\n\n- nobody" },
    { id: 'door', at: [480000, 600000], subj: 'the door', body: "there's a way out of here but i can't find it.\n\nthe pages on NOWHENTEXT have hidden things on them. on a real telly you press REVEAL on the remote. our remote has a REVEAL button too.\n\nput the hidden numbers together and you get a page that can't be found.\n\n- nobody\n\nP.S. if you stay up until midnight the computer tries to fix the calendar. it has done it before. it put the last one of me in a folder." },
  ];
  function mail() {
    const key = 'jhp_leap_mail', sent = store.get(key, {}), o = occ(), mine = sent[o] = sent[o] || [];
    MAILS.forEach(m => {
      if (mine.includes(m.id)) return;
      later(function send() {
        if (!active) return;
        const d = window.JackFiles && JackFiles.deliver; if (!d) return;
        if (!booted()) return later(send, 5000);
        const s = store.get(key, {}); s[o] = s[o] || []; if (s[o].includes(m.id)) return;
        try { d({ from: NOBODY, subj: m.subj, body: m.body, date: '29/02/99' }); } catch (e) { return; }
        s[o].push(m.id); store.set(key, s);
        Desk.toast('Outlook Express', 'You have 1 new message from: nobody', 5000);
      }, rnd(m.at[0], m.at[1]));
    });
  }

  // ================================================================ some web pages are from a day that never happened
  let voids = 0;
  function onSection(ev) {
    if (!active) return;
    const d = String(ev.detail || '');
    if (!/^site:/.test(d) || /nowhen\.void/.test(d)) return;
    if (voids && Math.random() > 0.3) return;
    setTimeout(() => {
      const sec = $('s-secret'); if (!sec || sec.querySelector('.lp-void')) return;
      voids++;
      const clear = voids === 1 || Math.random() < 0.4;
      const nz = () => Array.from({ length: ri(40, 90) }, () => pick('&#9617;&#9618;&#9619;#@%01/\\|_'.match(/&#\d+;|./g))).join('');
      const box = h('div', 'lp-void', `<b>ERROR 29/02 - PAGE NOT WRITTEN</b>This page has not been written yet: it is from a day that never happened.<div class="nz">${nz()}</div>${clear ? `If you are reading this, it is still today. Come in: <a href="${SITE_URL}">${SITE_URL}</a>` : `<a href="${SITE_URL}">http://www.n&#9617;wh&#9618;n.v&#9619;id/</a> <span class="nz">${nz().slice(0, 60)}</span>`}`);
      const root = sec.firstElementChild && sec.firstElementChild.children.length > 1 ? sec.firstElementChild : sec;
      const kids = [...root.children], at = kids[Math.min(kids.length - 1, ri(1, 3))];
      if (at && at.nextSibling) root.insertBefore(box, at.nextSibling); else root.appendChild(box);
      note(140, 0.12, 'sawtooth');
    }, 120);
  }

  // ================================================================ www.nowhen.void: NOWHENTEXT, the space between the days
  const ln = (cls, html) => `<div class="l ${cls || ''}">${html == null ? '' : html}</div>`;
  const lk = (p, label, cls) => `<span class="lnk ${cls || ''}" data-p="${p}" tabindex="0">${label}</span>`;
  const row = (label, p) => ln('', `<span class="c">${label.padEnd(28, '.')}</span>${lk(p, `<span class="y">${p}</span>`)}`);
  const LOGO = ['X..X..XX..X...X.X..X.XXXX.X..X.', 'XX.X.X..X.X...X.X..X.X....XX.X.', 'X.XX.X..X.X.X.X.XXXX.XXX..X.XX.', 'X..X.X..X.X.X.X.X..X.X....X..X.', 'X..X..XX...X.X..X..X.XXXX.X..X.'];
  const logo = () => `<div class="lp-logo" aria-label="NOWHEN">${LOGO.join('').split('').map(c => `<i class="${c === 'X' ? 'on' + (Math.random() < 0.06 ? ' f' : '') : ''}"></i>`).join('')}</div>`;
  const PAGES = {
    100: () => [logo(),
      ln('dh y', ' THE SPACE BETWEEN THE DAYS'),
      ln(),
      ln('w', ' Sunday 28/02/99 ........ <span class="r">ENDED</span>'),
      ln('w', ' ?????day 29/02/99 ...... <span class="g">YOU ARE HERE</span>'),
      ln('w', ' Monday 01/03/99 ........ <span class="u">NOT YET</span>'),
      ln(),
      row(' NEWS FROM NOWHEN', 101), row(' WEATHER', 102), row(' TONIGHT\'S TELEVISION', 103), row(' SPORT', 104), row(' LOST AND FOUND', 105), row(' HOW DO I GET OUT?', 106),
      ln(),
      ln('bb w', ' Some things on these pages are hidden. '),
      ln('bb w', ' Press <span class="y">REVEAL</span> to see them.               '),
    ],
    101: [() => [ln('dh bb y', ' NEWS FROM NOWHEN               1/3'), ln(), ln('w', 'EXPERTS: TODAY "DID NOT HAPPEN"'), ln(), ln('c', 'Scientists at the Institute of Calendars confirmed this morning that today does not exist.'), ln(), ln('c', '"February has 28 days in 1999," said one. "We counted twice. Then we counted on a calculator."'), ln(), ln('c', 'Clocks all over the country are said to be "a bit confused". Several have gone back to bed.'), ln(), ln('y', 'MORE ON 102 ' + lk(102, '&gt;&gt;'))],
      () => [ln('dh bb y', ' NEWS FROM NOWHEN               2/3'), ln(), ln('w', 'TAMAGOTCHIS REFUSE TO HATCH'), ln(), ln('c', 'Virtual pets everywhere are waiting for tomorrow before they do anything.'), ln(), ln('c', 'A spokesperson for the eggs said: "beep."'), ln(), ln('c', 'Owners are advised not to press any buttons. Especially not the middle one.')],
      () => [ln('dh bb y', ' NEWS FROM NOWHEN               3/3'), ln(), ln('w', 'MILLENNIUM BUG: STILL 306 DAYS AWAY'), ln(), ln('c', 'Even from here, the Year 2000 is 306 days away. That is how far it is from Monday 01/03/99.'), ln(), ln('c', 'The Millennium Bug has been told about today and is said to be "very interested".'), ln(), ln('c', 'NASA has been asked to keep an eye on it. NASA is keeping an eye on it.')]],
    102: () => [ln('dh bg w', ' WEATHER                        102'), ln(), ln('w', 'TODAY: no weather.'), ln('c', 'There is no sky today to put it in.'), ln(), ln('w', 'WIND: none. Nothing is moving.'), ln('w', 'RAIN: hanging in the air, not sure'), ln('w', '      whether to fall.'), ln(), ln('w', 'TOMORROW: Monday. Probably drizzle.'), ln(), ln('m', 'FIRST NUMBER: <span class="cz">&nbsp;4&nbsp;</span>'), ln(), ln('u', 'FORECAST ENDS')],
    103: () => [ln('dh bm w', ' TONIGHT\'S TELEVISION          103'), ln(), ln('y', 'NOWHEN ONE'), ln('w', '06:00 Test Card (the girl, the clown'), ln('w', '      and the noughts and crosses).'), ln('w', '      All day. Do not adjust your set.'), ln(), ln('y', 'NOWHEN TWO'), ln('w', '17:00 Robot Wars: the House Robots'), ln('w', '      wait for a fight that never'), ln('w', '      comes.'), ln('w', '18:30 A cartoon nobody has drawn yet'), ln('w', '19:00 The film you fell asleep in'), ln('w', '      front of. From the bit you missed.'), ln('w', '23:59 Closedown. Goodnight.')],
    104: () => [ln('dh br w', ' SPORT                          104'), ln(), ln('y', 'RESULTS FROM A DAY THAT NEVER HAPPENED'), ln(), ln('w', 'Nobody United    0  Nowhere Rovers  0'), ln('c', '  (abandoned: no day to play it on)'), ln(), ln('w', 'TETRIS: the long thin block is still'), ln('w', '  on its way. Nobody has scored.'), ln(), ln('w', 'SNOOKER: the black is still rolling.'), ln(), ln('m', 'SECOND NUMBER: <span class="cz">&nbsp;0&nbsp;</span>')],
    105: () => [ln('dh bb y', ' LOST AND FOUND                 105'), ln(), ln('w', 'FOUND: 1 x day. 29 February.'), ln('c', '  Last seen: never. Answers to: nothing.'), ln(), ln('w', 'FOUND: one Rubik\'s cube, solved.'), ln('c', '  Nobody saw who did it.'), ln(), ln('w', 'FOUND: 4,213,006 odd socks.'), ln(), ln('w', 'FOUND: the half hour before school'), ln('c', '  that always goes missing.'), ln(), ln('w', 'LOST: the way out.'), ln(), ln('m', 'THIRD NUMBER: <span class="cz">&nbsp;4&nbsp;</span>')],
    106: () => [ln('dh bb y', ' HOW DO I GET OUT?              106'), ln(), ln('w', 'Nobody knows.'), ln(), ln('c', 'Some say there is a door on a page that can\'t be found.'), ln(), ln('c', 'Three numbers are hidden on these pages. Press REVEAL on the remote to see hidden things.'), ln(), ln('c', 'Put the numbers together, first to third, and type the page number on the remote.'), ln(), ln('c', 'Or wait until midnight. The computer will fix the calendar, and you will be in March.'), ln(), ln('y', lk(100, 'BACK TO THE INDEX: 100'))],
    290: () => [ln('dh br w', ' PAGE 290'), ln(), ln('w', '29/0. Nice try.'), ln(), ln('c', 'That\'s the date, not the door.'), ln(), ln('y', lk(106, 'HELP: 106'))],
  };
  function door(tv) {
    const name = store.get('jhp_leap_name', '');
    return [ln('dh bk r', ' PAGE 404: NOT FOUND'), ln('dh bk g', ' ...FOUND IT.'), ln(),
      ln('c', 'This is the square that isn\'t on the calendar. Every four years the calendar forgets a day, and it ends up here.'),
      `<div class="lp-sq">${name ? esc(name) + '<br>was here' : ''}</div>`,
      name ? ln('w', '<span class="g">The square remembers you.</span>') : `<div class="lp-sign"><input type="text" maxlength="16" class="lp-nm" aria-label="Your name" value="${esc((window.Net && Net.me && Net.me.nick) || '')}"><button type="button" class="tvb" data-a="sign">WRITE IN THE SQUARE</button></div>`,
      `<div style="text-align:center"><button type="button" class="tvb" data-a="step">STEP THROUGH THE SQUARE</button></div>`];
  }
  const INSIDE = () => [ln('dh bk m', ' INSIDE 29/02/1999'), ln(),
    ln('w', 'You step through the square.'), ln(),
    ln('c', 'It\'s very quiet in here. No clocks. No school. No Monday.'), ln(),
    ln('c', 'There\'s a Rubik\'s cube on the floor (solved), a Tamagotchi waiting patiently to hatch, a Game Boy with the batteries still in, and a note in Jack\'s handwriting:'), ln(),
    ln('y', '  "BACK IN 4 YEARS. DON\'T TOUCH MY'), ln('y', '   PAINTS. THE GREEN ONE IS NEARLY OUT."'), ln(),
    ln('c', 'Somewhere a long way off, a modem is dialling.'), ln(),
    `<div style="text-align:center"><button type="button" class="tvb" data-p="100">BACK TO 28/02</button><button type="button" class="tvb" data-a="march">ON TO 01/03</button></div>`];
  function tvPage() {
    got('site');
    const root = h('div', 'lp-tv'); root.tabIndex = 0;
    root.innerHTML = `<div class="lp-set"><div class="lp-scr"><div class="lp-hdr"><span class="pn">P100</span><span class="nm">NOWHENTEXT</span><span class="dt">?????day 29 Feb</span><span class="tm">24:60:00</span></div><div class="lp-body"></div>
      <div class="lp-fast"><button type="button" class="fr" data-p="101">News</button><button type="button" class="fg" data-p="102">Weather</button><button type="button" class="fy" data-p="105">Lost+Found</button><button type="button" class="fc" data-p="100">Index</button></div></div></div>
      <div class="lp-remote" aria-label="Remote control"><div class="ent" aria-live="polite">P100</div><div class="lp-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button type="button" class="k${n}" data-k="${n}">${n}</button>`).join('')}</div>
      <div><button type="button" class="wide rv" data-a="reveal">REVEAL</button><button type="button" class="wide" data-a="hold">HOLD</button><div class="fbs"><button type="button" style="background:#f00" data-p="101" aria-label="Red: News"></button><button type="button" style="background:#0f0" data-p="102" aria-label="Green: Weather"></button><button type="button" style="background:#ff0" data-p="105" aria-label="Yellow: Lost and Found"></button><button type="button" style="background:#0ff" data-p="100" aria-label="Cyan: Index"></button></div></div>
      <small>Type a page number. Some things are hidden: press REVEAL.</small></div>`;
    const q = s => root.querySelector(s), body = q('.lp-body'), pn = q('.lp-hdr .pn'), ent = q('.ent'), scr = q('.lp-scr');
    let cur = 100, sub = 0, hold = false, entry = '', busy = 0, inside = false;
    const draw = () => {
      const p = PAGES[cur];
      let html;
      if (cur === 404) html = inside ? INSIDE() : door();
      else if (Array.isArray(p)) html = p[sub % p.length]();
      else if (p) html = p();
      else html = [ln('dh br w', ` PAGE ${cur}`), ln(), ln('w', 'This page is from a day that never happened.'), ln(), ln('c', 'It has not been written yet. It never will be.'), ln(), ln('y', lk(100, 'INDEX: 100') + '   ' + lk(106, 'HELP: 106'))];
      body.innerHTML = html.join('');
      pn.textContent = 'P' + cur; ent.textContent = 'P' + cur;
    };
    const goto = p => {
      p = +p; if (!(p >= 100 && p <= 899)) { ent.textContent = 'P' + cur; return; }
      clearTimeout(busy); entry = ''; sub = 0; inside = false;
      if (reduced()) { cur = p; draw(); return; }
      let n = 0; // the page counter races through the numbers, like the real thing
      const spin = () => { if (++n > 6) { cur = p; draw(); return; } pn.textContent = 'P' + ri(100, 899); busy = setTimeout(spin, 70); };
      spin();
      sfx('click');
    };
    const key = d => { entry += d; ent.textContent = 'P' + entry.padEnd(3, '-'); if (entry.length === 3) { const p = entry; entry = ''; goto(p); } };
    root.addEventListener('click', ev => {
      const t = ev.target.closest('[data-p],[data-k],[data-a]'); if (!t) return;
      if (t.dataset.k != null) return key(t.dataset.k);
      if (t.dataset.p) return goto(t.dataset.p);
      const a = t.dataset.a;
      if (a === 'reveal') { const on = root.classList.toggle('rev'); t.classList.toggle('on', on); sfx('click'); }
      else if (a === 'hold') { hold = !hold; t.textContent = hold ? 'HOLD (ON)' : 'HOLD'; }
      else if (a === 'sign') {
        const v = (q('.lp-nm').value || '').replace(/[<>]/g, '').trim().slice(0, 16); if (!v) return;
        store.set('jhp_leap_name', v); got('door'); sfx('solve'); draw();
      }
      else if (a === 'step') {
        const sq = q('.lp-sq'); if (!sq || inside) return;
        note(196, 0.9, 'sine');
        const go = () => { inside = true; draw(); };
        if (reduced()) go(); else { sq.classList.add('in'); setTimeout(go, 1300); }
        if (!store.get('jhp_leap_name', '')) got('door');
      }
      else if (a === 'march') Desk.msgbox('NOWHENTEXT', 'Monday 01/03/1999 hasn\'t happened yet.\n\nStay up until midnight and the computer will take you there.', 'info');
    });
    root.addEventListener('keydown', ev => {
      if (ev.target.tagName === 'INPUT') { if (ev.key === 'Enter') { ev.preventDefault(); const b = q('[data-a=sign]'); if (b) b.click(); } return; }
      if (/^\d$/.test(ev.key)) { ev.preventDefault(); key(ev.key); }
      else if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.p) { ev.preventDefault(); goto(ev.target.dataset.p); }
    });
    draw();
    // the header clock is stuck at 24:60, the seconds keep going; subpages turn over; now and then a row slips
    let s = 0, tick = 0;
    const iv = setInterval(() => {
      if (!root.isConnected) { clearInterval(iv); return; }
      s = (s + 1) % 60; q('.lp-hdr .tm').textContent = '24:60:' + String(s).padStart(2, '0');
      if (++tick % 7 === 0 && !hold && Array.isArray(PAGES[cur])) { sub++; draw(); }
      if (!reduced() && Math.random() < 0.06) { scr.classList.add('glx'); setTimeout(() => scr.classList.remove('glx'), 140); }
    }, 1000);
    setTimeout(() => { try { root.focus({ preventScroll: true }); } catch (e) {} }, 60);
    return root;
  }
  function addSite() {
    if (!window.IE || !IE.addSite) return;
    IE.addSite(SITE, { title: 'NOWHENTEXT', hidden: true, pages: { '/': { title: 'NOWHENTEXT - the space between the days', html: () => tvPage() } } });
  }
  function openSite() { const b = $('browser'); if (b) b.classList.remove('min'); if (window.IE) IE.navigate(SITE_URL); }

  // ================================================================ midnight: ScanDisk repairs the calendar
  function repair(then) {
    if ($('lpRepair')) return;
    const o = h('div', '', `<div class="hd"><span>JackOS ScanDisk</span><span>Calendar Repair</span></div><div class="mid"><div class="box" role="dialog" aria-label="ScanDisk"><h2>ScanDisk</h2><pre></pre><div class="bar"><i></i></div><div class="btns" hidden><button type="button" data-a="ok">&lt; OK &gt;</button><button type="button" data-a="info">&lt; More Info &gt;</button></div></div></div><div class="ft">ScanDisk is checking the calendar. Please do not turn off your computer.</div>`);
    o.id = 'lpRepair'; document.body.appendChild(o);
    const pre = o.querySelector('pre'), bar = o.querySelector('.bar i'), btns = o.querySelector('.btns');
    const rows = ['ScanDisk is now checking the calendar for 1999:', ''];
    const MON = [['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30], ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]];
    let i = 0;
    const out = () => { pre.textContent = rows.join('\n'); };
    const steps = [];
    MON.forEach(([m, d], k) => steps.push(() => { if (k === 1) rows.push(`  ${'February'.padEnd(10, '.')}.... 28 days  (+1 day that shouldn't be there!)`); else if (k < 3 || k === 11) rows.push(`  ${m.padEnd(10, '.')}.... ${d} days  OK`); else if (k === 10) rows.push(`  ${'April to November'.padEnd(18, '.')}.... OK`); bar.style.width = Math.round((k + 1) / 12 * 70) + '%'; }));
    steps.push(() => { rows.push('', '  Repairing the calendar...'); bar.style.width = '85%'; });
    steps.push(() => { rows.push('  Moving 29/02/1999 out of February...'); bar.style.width = '100%'; note(523, 0.1, 'square'); });
    steps.push(() => { rows.push('', '  1 day could not be found. It was put in C:\\LOSTDAYS', '  ScanDisk has finished. The date is now Monday, 1 March 1999.'); btns.hidden = false; o.querySelector('.ft').textContent = 'Press Enter (or click OK) to go back to JackOS.'; const b = o.querySelector('[data-a=ok]'); if (b) b.focus(); });
    const run = () => { if (!o.isConnected) return; steps[i++](); out(); if (i < steps.length) setTimeout(run, i < 12 ? 260 : 1200); };
    out(); setTimeout(run, 700);
    let done = false;
    const finish = () => { if (done) return; done = true; o.remove(); document.removeEventListener('keydown', kd, true); clearTimeout(auto); if (then) then(); };
    const kd = ev => { if (!btns.hidden && (ev.key === 'Enter' || ev.key === 'Escape')) { ev.preventDefault(); finish(); } };
    document.addEventListener('keydown', kd, true);
    o.addEventListener('click', ev => { const a = ev.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'ok') finish(); else Desk.msgbox('More Info', 'ScanDisk found a whole day stuck between Sunday 28/02/99 and Monday 01/03/99.\n\nIt did not belong to any month, so ScanDisk saved it as C:\\LOSTDAYS\\FILE0029.CHK.\n\n(It will probably come back in four years. They always do.)', 'info'); });
    const auto = setTimeout(finish, 30000); // never leave the PC stuck on a blue screen
  }

  // ================================================================ on / off
  function start() {
    if (active) return; active = true;
    css(); clockTitle(); todayLine(); newsPost(); clockClick(); addSite(); binPut();
    every(calendars, 800);
    if (!start._sec) { start._sec = true; document.addEventListener('section', onSection); }
    const go = () => {
      if (!active) return;
      Desk.toast('Date/Time', 'JackOS cannot work out what day it is. It is somewhere between Sunday 28/02/99 and Monday 01/03/99.', 8000);
      schedule(burst, rnd(25000, 45000), 120000, 300000);
      schedule(letters, rnd(15000, 30000), 35000, 80000);
      schedule(clockJump, rnd(45000, 75000), 100000, 220000);
      schedule(icons, rnd(80000, 120000), 240000, 480000);
      schedule(counters, rnd(20000, 40000), 40000, 90000);
      mail();
    };
    if (SS() && SS().whenBooted) SS().whenBooted(go); else later(go, 3000);
  }
  function stop() {
    active = false;
    timers.forEach(clearTimeout); ivs.forEach(clearInterval); obs.forEach(m => m.disconnect()); timers.clear(); ivs = []; obs = [];
    document.body.classList.remove('lp-burst', 'lp-lite', 'lp-calm'); bursting = false;
    if (jumping) { const Y = SS() && SS().Y; if (Y) Y.clock = null; jumping = false; }
    const c = $('clock'); if (c) { c.classList.remove('lp-cj'); c.textContent = realClock(); const t = Desk.today99(); c.title = `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`; }
    const tl = $('todayLine'); if (tl) tl.classList.remove('lp-flick');
    document.querySelectorAll('.lp-news, .lp-void').forEach(e => e.remove());
    calendarsOff();
    if (Desk.refreshNews) Desk.refreshNews();
    if (A.recycle) A.recycle.take('leap.day');
    if (window.IE && IE.sites) delete IE.sites['nowhen.void'];
  }
  function end(n) {
    if (!active) return;
    const midnight = n && n.getMonth() === 2 && n.getDate() === 1 && n.getHours() === 0 && n.getMinutes() < 5;
    stop();
    const lost = () => { store.set('jhp_leap_lost', 1); L.lostFile(); };
    if (midnight && booted()) repair(() => { lost(); got('midnight'); Desk.toast('Date/Time', 'It is now Monday, 1 March 1999. The calendar is fixed. (Probably.) Something was put in C:\\LOSTDAYS.', 8000); });
    else lost();
  }

  window.LeapX = {
    start, end, stop, burst, letters, icons, clockJump, counters, repair, openSite,
    preview(what) {
      const f = { burst: () => burst(1600), letters, icons, clock: clockJump, counter: counters, repair: () => repair(), site: openSite, restore: restoreDay, day: viewer }[what];
      return f ? f() : null;
    },
  };
})();

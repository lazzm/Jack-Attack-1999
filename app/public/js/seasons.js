/* seasons: the PC lives through the year. Y2K Night on 31/12 (countdown from 23:00, the Millennium Bug at midnight,
 * fireworks, then a restart back to 01/01/1999 ...again?), special days (lazy: seasons-days.js), the magazine's
 * monthly cover CD (lazy: seasons-disc.js) and the dial-up line that drops now and then ("Mom picked up the phone").
 * The big midnight show lives in seasons-y2k.js (loaded at 23:50 on 31/12, or for the Y2K drill).
 * Testing: ?date99=12-31&time=23:59:40 pretends it's that day and time (the whole PC follows via Desk.today99), and
 * Seasons.preview('y2k'|'eve'|'drill'|'disc'|'drop'|<day key>) shows any part straight away. */
(function () {
  'use strict';
  if (!window.Apps || !window.Desk) return;
  const $ = id => document.getElementById(id);
  const A = Apps, esc = A.esc, store = A.store;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => DesktopSurface.width() < 640 || matchMedia('(hover:none)').matches;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const note = (f, s, t) => { try { if (Sound.on && Sound.note) Sound.note(f, s, t); } catch (e) {} };
  const booted = () => !$('boot');
  const sess = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const S = (id, name, hint) => A.defineSecret('ssn.' + id, name, hint);
  const got = id => A.secret('ssn.' + id);
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };

  // ================================================================ time: the real clock, or a pretend one for testing
  let offset = 0;
  function setTime(md, hms) {
    const real = new Date(), t = new Date(real);
    if (md) { const [m, d] = String(md).split(/[-/]/).map(Number); if (m === 2 && d === 29) { t.setDate(1); while (new Date(t.getFullYear(), 1, 29).getDate() !== 29) t.setFullYear(t.getFullYear() + 1); } if (m && d) t.setMonth(m - 1, d); } // 29/02: the next real leap year (see leapday.js)
    if (hms) { const [hh, mm, ss] = String(hms).split(':').map(Number); t.setHours(hh || 0, mm || 0, ss || 0, 0); }
    offset = (md || hms) ? t - real : 0;
  }
  const Q = new URLSearchParams(location.search);
  if (Q.get('date99') || Q.get('time')) setTime(Q.get('date99'), Q.get('time'));
  else if (/[?&]y2ktest/.test(location.search)) offset = new Date(new Date().getFullYear() + 1, 0, 1) - Date.now() - 8000; // same as desk.js
  const now = () => new Date(Date.now() + offset);
  function today() { // same day and month as "now", in 1999 (no 29 Feb)
    const n = now(); let m = n.getMonth() + 1, d = n.getDate();
    if (m === 2 && d === 29) d = 28;
    return { m, d, md: m * 100 + d, date: new Date(1999, m - 1, d) };
  }
  const realToday99 = Desk.today99;
  Desk.today99 = () => offset ? today() : realToday99(); // everything else on the PC follows a pretend date too
  const fmtClock = d => d.getHours() + ':' + pad(d.getMinutes());

  // the tray clock and the magazine's Millennium counter follow the pretend time (and the Bug, at midnight)
  const Y = { running: false, clock: null, y2kText: null, drill: false }; // shared with seasons-y2k.js
  function paintClock() {
    const c = $('clock'); if (!c) return;
    let want = Y.clock != null ? Y.clock : offset ? fmtClock(now()) : null;
    if (want == null && paintClock.over) want = fmtClock(now()); // the Bug has gone: put the real time back straight away
    paintClock.over = Y.clock != null;
    if (want != null && c.textContent !== want) c.textContent = want;
    if (offset || Y.clock != null) { const t = today(); const tt = Y.clock != null && /1900/.test(Y.clock) ? 'Monday, 1 January 1900' : `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`; if (c.title !== tt) c.title = tt; }
  }
  function paintCounter() {
    const c = $('y2k'); if (!c) return;
    let want = Y.y2kText;
    if (want == null && paintCounter.over && !offset) { paintCounter.over = false; return; } // desk.js writes the real countdown again within a second
    paintCounter.over = Y.y2kText != null;
    if (want == null && offset) {
      const n = now(); let left = Math.max(0, Math.floor((new Date(n.getFullYear() + 1, 0, 1) - n) / 1000));
      const d = Math.floor(left / 86400); left %= 86400;
      want = `${d} days ${pad(Math.floor(left / 3600))}:${pad(Math.floor(left % 3600 / 60))}:${pad(left % 60)}`;
    }
    if (want != null && c.textContent !== want) c.textContent = want;
  }
  if ($('clock')) new MutationObserver(paintClock).observe($('clock'), { childList: true, characterData: true, subtree: true });
  if ($('y2k')) new MutationObserver(paintCounter).observe($('y2k'), { childList: true, characterData: true, subtree: true });

  // ================================================================ CSS for the always-loaded bits
  css('ssn-css', `
#clock.ssn-blink{animation:ssnblink 1s steps(1) infinite}
@keyframes ssnblink{50%{color:#c00;text-shadow:0 0 1px #c00}}
body.ssn-y2k #y2kEvent{display:none!important}
body.ssn-y2k.glitch:not(.ssn-shake) #desktop{animation:none;filter:none}
body.ssn-autorestart .float[aria-label="Shut Down JackOS"]{visibility:hidden}
.ssn-eve{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:2990;display:flex;align-items:center;gap:10px;padding:5px 8px 5px 10px;background:linear-gradient(#1a0a4a,#000020);border:2px solid;border-color:#ffd400 #a07000 #a07000 #ffd400;box-shadow:3px 3px 0 rgba(0,0,0,.45);color:#fff;font:bold 12px var(--ui);max-width:calc(100vw - 16px)}
.ssn-eve .st{font:400 22px/1 var(--comic,Impact);color:#ffd400;-webkit-text-stroke:1px #000;paint-order:stroke fill;letter-spacing:1px;white-space:nowrap}
.ssn-eve .tm{font:bold 22px/1 "Courier New",monospace;color:#0f0;background:#000;border:1px solid #666;padding:3px 6px;min-width:110px;text-align:center;text-shadow:0 0 6px #0f0}
.ssn-eve .lb{font:11px/1.2 var(--ui);color:#cde}
.ssn-eve button{flex:none;width:18px;height:16px;padding:0;background:var(--face,#c0c0c0);border:1px solid;border-color:#fff #000 #000 #fff;font:bold 10px/1 Arial;color:#000;cursor:pointer;align-self:flex-start}
.ssn-eve.small .st,.ssn-eve.small .lb{display:none}
.ssn-eve.small .tm{font-size:14px;min-width:0}
.ssn-eve .pop{width:26px;height:26px;flex:none}
.ssn-eve.hot .tm{color:#ff0;text-shadow:0 0 8px #f80;animation:ssnblink .5s steps(1) infinite}
@media (max-width:640px){.ssn-eve{top:auto;bottom:38px}.ssn-eve .lb{display:none}.ssn-eve .st{font-size:16px}.ssn-eve .tm{font-size:17px;min-width:90px}.ssn-eve .pop{display:none}}
.ssn-mag{margin:0 0 14px;border:3px solid #000;background:linear-gradient(135deg,#14002e,#3a0a6a 60%,#5b16c9);color:#fff;padding:10px 12px;box-shadow:4px 4px 0 #ff2a6d;font:14px/1.4 Georgia,serif;position:relative;overflow:hidden}
.ssn-mag h3{margin:0 0 6px;font:400 26px/1 var(--comic,Impact);color:#ffd400;-webkit-text-stroke:1px #000;paint-order:stroke fill;letter-spacing:1px}
.ssn-mag .cd{float:right;margin:0 0 6px 10px;text-align:center;background:#000;border:2px solid #0f0;padding:4px 8px;font:bold 12px var(--ui);color:#0f0}
.ssn-mag .cd b{display:block;font:bold 24px/1.1 "Courier New",monospace;text-shadow:0 0 6px #0f0}
.ssn-mag ul{margin:6px 0 0;padding-left:18px}
.ssn-mag li{margin:2px 0}
.ssn-mag .watch{background:rgba(0,0,0,.35);border:1px dashed #9ff;padding:6px 8px;margin-top:8px;font:12px/1.35 var(--ui);color:#cff}
.ssn-mag .watch b{color:#ffd400}
.ssn-mag.bug{animation:ssnmagbug .18s steps(2) infinite;filter:hue-rotate(120deg) contrast(1.3)}
@keyframes ssnmagbug{50%{transform:translate(-3px,1px) skewX(3deg)}}
.ssn-siteflash{background:#000;color:#ffd400;font:bold 12px "Courier New",monospace;padding:3px 6px;border-bottom:2px solid #ff2a6d;overflow:hidden;white-space:nowrap}
.ssn-siteflash marquee{display:block}
.ssn-fw{position:fixed;inset:0;z-index:9350;pointer-events:none;background:radial-gradient(ellipse at 50% 120%,rgba(60,20,90,.9),rgba(0,0,25,.95) 60%);opacity:0;transition:opacity 1.2s}
.ssn-fw.on{opacity:1}
.ssn-fw canvas{position:absolute;inset:0;width:100%;height:100%}
#page.ssn-dropped>:not(.ssn-nosrv){display:none!important}
.ssn-nosrv{background:#fff;min-height:100%;padding:16px 18px}
.ssn-nosrv .btn{margin-top:4px}
.ssn-dial td{padding:1px 4px 1px 0;font:12px var(--ui)}
.ssn-dial .led{fill:#060}
.ssn-dial.on .led{animation:ssnled .3s steps(1) infinite}
.ssn-dial.on .led.b{animation-delay:.1s}.ssn-dial.on .led.c{animation-delay:.2s}
@keyframes ssnled{50%{fill:#0f0}}
`);

  // ================================================================ fireworks (shared by the Millennium and Bonfire Night)
  // fireworks(canvas, {text: '2000', calm: bool}) -> { stop(), finale(word), launch(), done }
  function fireworks(cv, o) {
    o = o || {};
    const g = cv.getContext('2d'), DPR = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => { W = cv.clientWidth || DesktopSurface.width(); H = cv.clientHeight || DesktopSurface.height(); cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); };
    size(); addEventListener('resize', size);
    const COLS = ['#ff3a3a', '#ffd400', '#3aff6a', '#4aa8ff', '#ff4aff', '#ffffff', '#ff9a2a', '#3affff'];
    const GR = 140, rockets = [], parts = [];
    let raf = 0, last = 0, next = 0, stopped = false, rate = o.calm ? 1.4 : 0.55;
    function launch(x, top, col, kind) {
      const tx = x != null ? x : rnd(W * 0.12, W * 0.88), ty = top != null ? top : rnd(H * 0.12, H * 0.42);
      rockets.push({ x: tx + rnd(-30, 30), y: H + 4, tx, ty, vy: -Math.sqrt(2 * GR * (H - ty)), vx: 0, col: col || pick(COLS), kind: kind || pick(['peony', 'peony', 'ring', 'willow', 'crackle', 'double']) });
      rockets[rockets.length - 1].vx = (tx - rockets[rockets.length - 1].x) / ((H - ty) / (Math.sqrt(2 * GR * (H - ty)) / 2));
      if (Math.random() < 0.35) sfx('zap');
    }
    function burst(x, y, col, kind) {
      const n = o.calm ? 40 : kind === 'crackle' ? 50 : 80;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 2 * i / n + rnd(-0.05, 0.05), sp = kind === 'ring' ? 150 : kind === 'willow' ? rnd(30, 110) : rnd(40, 190);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: kind === 'willow' ? rnd(2.2, 3.2) : rnd(1.1, 1.9), max: 0, col: kind === 'willow' ? '#ffcf6a' : kind === 'crackle' ? '#fff' : col, sz: kind === 'willow' ? 1.6 : 2.2, flick: kind === 'crackle', drag: kind === 'willow' ? 0.96 : 0.985, grav: kind === 'willow' ? 0.5 : 0.35 });
        parts[parts.length - 1].max = parts[parts.length - 1].life;
      }
      if (kind === 'double') for (let i = 0; i < 30; i++) { const a = Math.PI * 2 * i / 30; parts.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 1.6, max: 1.6, col: pick(COLS), sz: 2, drag: 0.985, grav: 0.35 }); }
      if (Math.random() < 0.6) sfx('thud');
    }
    // the finale: sparks fly into the shape of a word, hang there, then droop
    function finale(word) {
      const off = document.createElement('canvas'), fw = Math.min(W * 0.8, 900), fh = fw * 0.32;
      off.width = Math.round(fw); off.height = Math.round(fh);
      const og = off.getContext('2d'); og.fillStyle = '#fff'; og.textAlign = 'center'; og.textBaseline = 'middle';
      og.font = `bold ${Math.round(fh * 0.9)}px Impact, "Arial Black", sans-serif`; og.fillText(word, fw / 2, fh / 2);
      const d = og.getImageData(0, 0, off.width, off.height).data, step = Math.max(5, Math.round(fw / 110)), pts = [];
      for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) if (d[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
      const ox = (W - fw) / 2, oy = H * 0.3 - fh / 2, cx = W / 2, cy = H * 0.3;
      pts.forEach(([x, y], i) => parts.push({ x: cx, y: cy, tx: ox + x, ty: oy + y, home: 0, life: 4.2 + rnd(0, 0.6), max: 4.8, col: COLS[i % 5], sz: 2.6, drag: 1, grav: 0 }));
      burst(cx, cy, '#fff', 'ring'); sfx('solve');
    }
    function step(ts) {
      if (!last) last = ts; const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = `rgba(0,0,0,${o.calm ? 0.16 : 0.24})`; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      if (!stopped) { next -= dt; if (next <= 0) { launch(); next = rate * rnd(0.5, 1.5); } }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; r.vy += GR * dt; r.x += r.vx * dt; r.y += r.vy * dt;
        g.fillStyle = '#ffe9a0'; g.fillRect(r.x - 1.5, r.y - 1.5, 3, 5);
        if (r.vy >= -10 || r.y <= r.ty) { rockets.splice(i, 1); burst(r.x, r.y, r.col, r.kind); }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        if (p.tx != null) { // flying into the word
          if (p.life > 1.4) { p.x += (p.tx - p.x) * Math.min(1, dt * 4); p.y += (p.ty - p.y) * Math.min(1, dt * 4); }
          else { p.vy = (p.vy || 0) + 60 * dt; p.y += p.vy * dt; }
        } else { p.vx *= p.drag; p.vy = p.vy * p.drag + GR * p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
        if (p.flick && Math.random() < 0.4) continue;
        g.globalAlpha = Math.min(1, p.life / Math.min(0.8, p.max)); g.fillStyle = p.col; g.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
      }
      g.globalAlpha = 1;
      if (!(stopped && !rockets.length && !parts.length)) raf = requestAnimationFrame(step);
      else { api.done = true; g.clearRect(0, 0, W, H); }
    }
    raf = requestAnimationFrame(step);
    const api = { done: false, launch, finale, burst, stop() { stopped = true; }, kill() { stopped = true; cancelAnimationFrame(raf); removeEventListener('resize', size); }, set rate(v) { rate = v; } };
    return api;
  }

  // ================================================================ 31/12: Millennium Eve
  const EVE = { banner: null, mag: null, small: false, loaded: null };
  const loadY2K = () => EVE.loaded = EVE.loaded || A.load('js/seasons-y2k.js');
  // where in the world it's already the year 2000 (UK time), for the magazine's Bug Watch
  const WATCH = [
    [10, 'Millennium Island (in Kiribati, in the Pacific) is the first place in the WHOLE WORLD to reach the year 2000!'],
    [11, 'New Zealand is in the year 2000! Their computers still work. Callum says "give it time".'],
    [13, 'Sydney has done its fireworks. It\'s already 2000 in Australia. They\'re eating breakfast in the future.'],
    [15, 'Japan has reached 2000. Nothing has exploded. Callum has unplugged his printer "just in case".'],
    [21, 'Moscow is in the year 2000! Mom has lined the beans up on the kitchen table.'],
    [23, 'Paris and Berlin are in the year 2000! ONE HOUR TO GO FOR US!!!'],
  ];
  const MAG_HTML = () => `<div class="cd">THE YEAR 2000 IN<b class="ssn-mcd">--:--:--</b>(UK time)</div><h3>MILLENNIUM EVE SPECIAL!!!</h3>
    <p style="margin:0">It's the LAST DAY OF THE 1900s. Here's the plan for tonight at Dave's:</p>
    <ul><li><b>Luke and Dave</b> want to be racing on Rainbow Road in Kart Kaos 64 at the EXACT second it turns midnight. Four players. Nobody is allowed to pause.</li>
    <li><b>Callum</b> is staying at home to guard his PC. He's convinced it's going to explode at midnight. He's unplugging it at 11:58 and putting a tea towel over it.</li>
    <li><b>JackK</b> (my mate Jack) is bringing Pocket Critters Red and a link cable, so we can trade at midnight and be the first people to trade a Pocket Critters in the year 2000.</li>
    <li><b>Mom</b> has 40 tins of beans, two torches and the wind-up radio. Just in case.</li>
    <li><b>Me:</b> save the game. Save ALL the games.</li></ul>
    <div class="watch"><b>Y2K BUG WATCH</b> (live!): <span class="ssn-mwatch"></span></div>`;
  function eveDay(t) {
    // the magazine's Millennium Eve box (home page, under the "gone to Dave's" note)
    if (!EVE.mag || !EVE.mag.isConnected) {
      const home = $('s-home'), lp = $('lastPost'); if (!home) return;
      EVE.mag = h('div', 'ssn-mag', MAG_HTML());
      if (lp) lp.after(EVE.mag); else home.prepend(EVE.mag);
    }
    const n = now(), hr = n.getHours(), after = t.md !== 1231;
    const w = WATCH.filter(x => x[0] <= hr);
    const el = EVE.mag.querySelector('.ssn-mwatch');
    const txt = Y.bug ? 'ERROR: THE YEAR IS 19100. PLEASE STAND BY.' : after ? 'IT\'S THE YEAR 2000!!! (Apparently. The computer isn\'t sure.)'
      : w.length ? w[w.length - 1][1] : 'Nowhere in the world has reached the year 2000 yet. The first place gets there at 10 o\'clock this morning (our time).';
    if (el.textContent !== txt) el.textContent = txt;
    const cd = EVE.mag.querySelector('.ssn-mcd'), s = Y.bug ? '19100' : after ? '00:00:00' : hms(secsToMidnight(n));
    if (cd.textContent !== s) cd.textContent = s;
    EVE.mag.classList.toggle('bug', Y.running && Y.bug === true);
  }
  const secsToMidnight = n => Math.max(0, Math.ceil((new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n) / 1000));
  const hms = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
  function eveBanner(left) {
    if (!EVE.banner) {
      const b = EVE.banner = h('div', 'ssn-eve', `<svg class="pop" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 30l8-20 12 12z" fill="#ffd400" stroke="#000"/><path d="M8 20l6 6M10 15l8 8" stroke="#e10600" stroke-width="2"/><circle cx="22" cy="6" r="2" fill="#ff2a6d"/><circle cx="28" cy="12" r="2" fill="#3affff"/><circle cx="17" cy="4" r="1.5" fill="#3aff6a"/><path d="M24 2l2 4M30 6l-3 2M20 10l3-3" stroke="#fff"/></svg><span class="st">MILLENNIUM COUNTDOWN</span><span class="tm" role="timer">--:--:--</span><span class="lb">until the<br>YEAR 2000!!!</span><button type="button" aria-label="Make smaller" title="Make smaller">_</button>`);
      b.querySelector('button').addEventListener('click', () => { EVE.small = !EVE.small; b.classList.toggle('small', EVE.small); b.querySelector('button').textContent = EVE.small ? '+' : '_'; });
      if (phone()) { EVE.small = false; }
      DesktopSurface.root().appendChild(b);
      $('clock') && $('clock').classList.add('ssn-blink');
    }
    const tm = EVE.banner.querySelector('.tm'), s = hms(left);
    if (tm.textContent !== s) tm.textContent = s;
    EVE.banner.classList.toggle('hot', left <= 60);
  }
  function eveOff() {
    if (EVE.banner) { EVE.banner.remove(); EVE.banner = null; }
    if (EVE.mag) { EVE.mag.remove(); EVE.mag = null; }
    $('clock') && $('clock').classList.remove('ssn-blink');
  }

  // the fake web sites talk about the Millennium all day on the 31st (a ticker across the top of every page)
  const FLASH = ['*** LAST DAY OF THE 1900s *** IS YOUR PC Y2K READY? ***', '*** HAPPY NEW YEAR FROM ALL OF US HERE *** SEE YOU IN THE YEAR 2000 (FINGERS CROSSED) ***', '*** MILLENNIUM BUG UPDATE: NEW ZEALAND IS FINE. FOR NOW. ***', '*** THIS WEBSITE IS Y2K COMPLIANT* (*PROBABLY) ***', '*** PARTY TONIGHT? DON\'T FORGET YOUR TORCH AND YOUR BEANS ***', '*** IF THIS PAGE SAYS 19100 TOMORROW, IT WASN\'T US ***'];
  document.addEventListener('section', ev => {
    const d = String(ev.detail || '');
    setTimeout(() => {
      const sec = $('s-secret'); if (!sec) return;
      if (today().md === 1231 && /^(site|secret):/.test(d) && !sec.querySelector('.ssn-siteflash')) sec.prepend(h('div', 'ssn-siteflash', `<marquee scrollamount="5">${esc(pick(FLASH))} &nbsp; ${esc(pick(FLASH))}</marquee>`));
      bunkerLinks(d);
    }, 60);
  });
  // a hidden way into the Y2K drill from Jack's Y2K Bunker and the Millennium Bunker (kidY2k's page, '~gaz')
  function bunkerLinks(d) {
    const sec = $('s-secret'); if (!sec) return;
    const jack = sec.querySelector('.ffp[data-w="y2kbunker"]');
    if (jack && !jack.querySelector('.ssn-drill')) {
      const bug = jack.querySelector('.ff-bug');
      if (bug) { bug.style.cursor = 'pointer'; bug.addEventListener('click', () => drillAsk('bug')); }
      const a = h('p', 'ssn-drill', '<a href="#" style="color:inherit;opacity:.35;font-size:10px;text-decoration:none">[ practise the Millennium: run a Y2K drill ]</a>');
      a.style.cssText = 'text-align:center;margin:2px 0 0';
      a.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); drillAsk('link'); });
      jack.appendChild(a);
    }
    if (/millenniumbunker\.netz/.test(d) && !sec.querySelector('.ssn-drill')) {
      const a = h('p', 'ssn-drill', '<a href="#" style="font:bold 11px \'Courier New\',monospace;color:#c00">&gt;&gt; EMERGENCY Y2K DRILL (members only) &lt;&lt;</a>');
      a.style.cssText = 'text-align:center;margin:8px 0';
      a.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); drillAsk('gaz'); });
      sec.appendChild(a);
    }
  }
  function drillAsk() {
    Desk.msgbox('Y2K Drill', 'Run a Millennium Bug drill?\n\nThis computer will pretend it is 10 seconds to midnight on 31/12/1999, and you can see what happens when the year 2000 arrives.\n\n(Press Esc to stop the drill at any time.)', 'q', [['Run the drill', () => drill()], ['Cancel']]);
  }
  function drill() {
    if (Y.running) return;
    loadY2K().then(() => window.SeasonsY2K && SeasonsY2K.run({ drill: true, from: 10 })).catch(e => console.error(e));
  }

  // ================================================================ the clock ticks
  let lastMd = 0, dayKeys = '', ran = false;
  function tick() {
    const t = today(), n = now();
    if (t.md === 1231 || (Y.running && EVE.mag)) {
      eveDay(t);
      const left = secsToMidnight(n);
      if (t.md === 1231 && n.getHours() >= 23 && !Y.running) eveBanner(left); else if (EVE.banner && Y.running) { EVE.banner.remove(); EVE.banner = null; }
      if (t.md === 1231 && n.getHours() === 23 && n.getMinutes() >= 50) loadY2K().catch(() => {});
      if (t.md === 1231 && left <= 10 && left > 0 && !Y.running && !ran && booted()) { ran = true; loadY2K().then(() => SeasonsY2K.run({ drill: false, from: left })).catch(e => console.error(e)); }
    } else if (EVE.banner || EVE.mag) { if (!Y.running) eveOff(); }
    // missed the countdown (the tab was asleep)? Still do the Bug, if it's only just gone midnight
    if (lastMd === 1231 && t.md === 101 && !Y.running && !ran && n.getHours() === 0 && n.getMinutes() < 2 && booted()) { ran = true; loadY2K().then(() => SeasonsY2K.run({ drill: false, from: 0 })).catch(e => console.error(e)); }
    if (t.md !== lastMd && !Y.running) { lastMd = t.md; days(); } // a new day's bits wait until the Millennium show is over
    paintClock(); paintCounter();
    const fast = t.md === 1231 && n.getHours() === 23 && n.getMinutes() === 59;
    clearTimeout(tickT); tickT = setTimeout(safeTick, fast ? 200 : 1000);
  }
  let tickT = 0;
  function safeTick() { try { tick(); } catch (e) { console.error(e); clearTimeout(tickT); tickT = setTimeout(safeTick, 1000); } }
  function tick0() { lastMd = 0; dayKeys = ''; safeTick(); }

  // ================================================================ special days (seasons-days.js)
  const EVENTS = [ // [key, from MMDD, to MMDD] in 1999. Dates checked: Shrove Tuesday 16/2/99, Red Nose Day 12/3/99,
    // Easter Sunday 4/4/99 (Good Friday 2/4 to Easter Monday 5/4), Children in Need 26/11/99. School's out on 23/7 (as in calendar.js).
    ['newyear', 101, 101], ['snowday', 128, 128], ['valentine', 214, 214], ['pancake', 216, 216], ['rednose', 312, 312], ['aprilfool', 401, 401],
    ['easter', 402, 405], ['summer', 723, 723], ['halloween', 1031, 1031], ['bonfire', 1105, 1105], ['cin', 1126, 1126], ['xmasdeco', 1218, 1231], ['xmas', 1225, 1225],
  ];
  const activeKeys = md => EVENTS.filter(e => md >= e[1] && md <= e[2]).map(e => e[0]);
  let daysLoad = null;
  const loadDays = () => daysLoad = daysLoad || A.load('js/seasons-days.js');
  function days() {
    const keys = activeKeys(today().md), k = keys.join(',');
    if (k === dayKeys) return;
    const prev = dayKeys; dayKeys = k;
    if (!keys.length && !prev && !window.SeasonsDays) return;
    whenBooted(() => loadDays().then(() => { if (window.SeasonsDays) SeasonsDays.set(keys); }).catch(e => console.error(e)));
  }
  function whenBooted(fn) {
    (window.BootDone || Promise.resolve()).then(() => {
      const go = () => { if (!booted() || document.querySelector('.logon')) return setTimeout(go, 1500); setTimeout(fn, 1200); };
      go();
    });
  }

  // ================================================================ extra posts for "What's New" (each only shows on its day)
  const CAL = window.CAL;
  if (CAL && CAL.posts) CAL.posts.push(
    ['01-01', 'SITE', "Got back from Dave's at 1am. Luke won on Rainbow Road, nothing exploded, and Callum's PC was fine (still had the tea towel on). Weird thing though: the computer's calendar says it's <b>1999</b>. Feels like I've done this year before..."],
    ['01-28', 'SITE', "<b>IT SNOWED!!!</b> For about ten minutes. It didn't settle. School didn't close. Dave made a snowball that was mostly gravel."],
    ['11-26', 'SITE', "It's <b>Children in Need</b> tonight! Our class did a sponsored Blockology marathon: I did 212 lines. Callum did a sponsored no-PC day and lasted until lunch."],
    ['12-31', 'Y2K', "<b>Y2K BUG WATCH:</b> New Zealand went into the year 2000 at 11 o'clock this morning (our time) and their computers still work! Callum is unplugging his PC at 11:58 anyway."],
    ['12-31', 'GAMES', "Midnight plan at Dave's: Luke and Dave want to be racing on <b>Rainbow Road</b> at the exact second it turns 2000. JackK is bringing Pocket Critters Red and a link cable. I'm bringing the beans."],
  );

  // ================================================================ after the Millennium restart: ...again?
  const wink = sess.get('jhp_ssn_wink'); sess.del('jhp_ssn_wink');
  if (wink === 'real' && offset && (Q.get('date99') || Q.get('time'))) setTime('01-01', '00:00:40'); // testing: wake up just after midnight
  if (wink) whenBooted(() => setTimeout(() => {
    const t = today();
    const when = wink === 'real' ? 'Friday, 1 January 1999, 00:00' : `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`;
    Desk.msgbox('Date/Time Properties', `JackOS has set the date and time to:\n\n${when}\n\nWelcome to 1999!`, 'info', [['OK', () => setTimeout(() => { Desk.toast('JackOS', '...again?', 6000); got('again'); }, 900)]]);
    if (wink === 'real') got('y2k');
  }, 1500));

  // ================================================================ the dial-up line drops (rarely: about once every 25 minutes of browsing)
  const DROP = { secs: 0, last: +(sess.get('jhp_ssn_lastdrop') || 0), down: false, page: null, dlg: null };
  const REASONS = ['Mom picked up the phone.', 'Mom picked up the phone. (She wants to ring Nan.)', 'Somebody picked up the phone downstairs.', 'Nan rang. Mom answered. You got cut off.', 'Dad picked up the phone to ring the takeaway.', 'Call waiting beeped and knocked you off. (Mom says she turned it off. She did not.)', 'Your little cousin picked up the phone and said "HELLO???" into the modem.'];
  const PHONE_SVG = '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none" aria-hidden="true"><rect x="3" y="16" width="26" height="12" rx="2" fill="#c8b48a" stroke="#000"/><path d="M5 12c0-6 22-6 22 0l-3 3h-4v-3h-8v3H8z" fill="#2a2a2a" stroke="#000"/><g fill="#555"><rect x="9" y="19" width="3" height="2"/><rect x="14.5" y="19" width="3" height="2"/><rect x="20" y="19" width="3" height="2"/><rect x="9" y="23" width="3" height="2"/><rect x="14.5" y="23" width="3" height="2"/><rect x="20" y="23" width="3" height="2"/></g><path d="M26 2l4 4M30 2l-4 4" stroke="#e10600" stroke-width="2"/></svg>';
  function canDrop() {
    if (document.hidden || !booted() || DROP.down || Y.running || document.querySelector('.logon')) return false;
    const br = $('browser'); if (!br || br.classList.contains('min') || br.style.display === 'none') return false;
    if (Desk.isActive && !Desk.isActive(br)) return false; // only while the browser is the window you're using (never mid-game)
    if (window.Net && Net.offline) return false;
    if (window.Savers && Savers.running) return false;
    if (window.IE && /^(demos|hangout|chat)$/.test(IE.current)) return false; // the arcade, the live Hangout, the chat room
    if ($('s-secret') && IE.current === 'secret' && $('s-secret').querySelector('canvas')) return false; // a game on a fake site
    return true;
  }
  setInterval(() => {
    if (!canDrop()) return;
    DROP.secs += 15;
    if (DROP.secs < 300 || Date.now() - DROP.last < 15 * 60000) return; // never in the first 5 minutes, never twice in 15
    if (Math.random() < 15 / 1500) drop();
  }, 15000);
  function drop(reason) {
    if (DROP.down) return;
    DROP.down = true; DROP.last = Date.now(); sess.set('jhp_ssn_lastdrop', String(DROP.last));
    const br = $('browser'); if (br) br.classList.remove('min');
    const pg = $('page');
    if (pg) {
      const e = $('s-error') && $('s-error').querySelector('.errpage');
      DROP.page = h('div', 'ssn-nosrv', e ? e.outerHTML : '<div class="errpage"></div>');
      const ep = DROP.page.querySelector('.errpage');
      ep.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
      const ps = ep.querySelectorAll('p');
      if (ps[0]) ps[0].innerHTML = 'The page cannot be displayed because <b>you are not connected to the Internet</b>. The line went dead. (Is somebody on the phone?)';
      const ul = ep.querySelector('ul'); if (ul) ul.innerHTML = '<li>Wait until whoever it is gets off the phone.</li><li>Click <b>Connect</b> to dial JackNet again.</li><li>Shout "I\'M ON THE INTERNET!" down the stairs. (Doesn\'t help. Feels good.)</li>';
      const ec = ep.querySelector('.ecode'); if (ec) ec.innerHTML = 'Cannot find server or DNS Error<br>JackNet Explorer';
      ep.insertAdjacentHTML('beforeend', '<button class="btn ssn-recon" type="button">Connect...</button>');
      DROP.page.querySelector('.ssn-recon').addEventListener('click', () => dial());
      pg.prepend(DROP.page); pg.classList.add('ssn-dropped'); pg.scrollTop = 0;
    }
    const bs = $('brStatus'); if (bs) bs.textContent = 'Disconnected';
    sfx('uhoh'); got('dropped');
    dropDialog(reason || pick(REASONS));
  }
  function dropDialog(reason) {
    if (DROP.dlg && !DROP.dlg.closed) DROP.dlg.close();
    const b = h('div', '', `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start">${PHONE_SVG}<div><b>Disconnected</b> - ${esc(reason)}<br><br>Connection to JackNet was lost.<br>Do you want to reconnect?</div></div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn dflt" type="button" data-a="y" style="min-width:86px">Reconnect</button><button class="btn" type="button" data-a="n" style="min-width:86px">Stay Offline</button></div>`);
    const w = DROP.dlg = A.win('Dial-up Networking', b, { w: 340, noResize: true, noMax: true, noMin: true, icon: PHONE_SVG });
    b.querySelector('[data-a=y]').addEventListener('click', () => { w.close(); dial(); });
    b.querySelector('[data-a=n]').addEventListener('click', () => { w.close(); Desk.toast('Dial-up Networking', 'Staying offline. Click Connect on the page when the phone is free.', 4000); });
    setTimeout(() => { const x = b.querySelector('[data-a=y]'); if (x) x.focus(); }, 40);
  }
  function dial() {
    if (DROP.dlg && !DROP.dlg.closed) DROP.dlg.close();
    const who = (window.Net && Net.me && Net.me.nick) || 'Guest';
    const b = h('div', 'ssn-dial', `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start"><svg viewBox="0 0 40 40" width="40" height="40" style="flex:none" aria-hidden="true"><rect x="2" y="16" width="36" height="16" fill="#c0c0c0" stroke="#000"/><rect x="6" y="26" width="4" height="3" class="led a"/><rect x="12" y="26" width="4" height="3" class="led b"/><rect x="18" y="26" width="4" height="3" class="led c"/><path d="M8 12 Q20 2 32 12" stroke="#000" fill="none" stroke-width="2"/></svg><div style="flex:1;min-width:0"><table><tr><td>User name:</td><td><input type="text" readonly style="width:130px;max-width:100%"></td></tr><tr><td>Password:</td><td><input type="password" value="********" readonly style="width:130px;max-width:100%"></td></tr><tr><td>Connect to:</td><td><b>JackNet 56K</b></td></tr></table><div style="margin-top:8px">Status: <b class="ssn-dst">Dialing...</b></div><div class="prog" style="margin-top:6px"><span style="display:flex;gap:2px" class="ssn-dpr"></span></div></div></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="button">Cancel</button></div>`);
    b.querySelector('input').value = who;
    const w = DROP.dlg = A.win('Connect To', b, { w: 380, noResize: true, noMax: true, noMin: true, icon: PHONE_SVG });
    b.classList.add('on'); sfx('modem');
    const busy = Math.random() < 0.15 && !DROP.busyOnce;
    const steps = busy ? [['Dialing...', 0], ['Dialing... (the line is busy)', 1400]] : [['Dialing...', 0], ['Dialing... (checking nobody\'s on the phone)', 1200], ['Handshaking... SCREEEE-BONG-BONG-kssshhh', 2300], ['Verifying user name and password...', 4000], ['Logging on to network...', 5000]];
    const T = steps.map(([s, ms]) => setTimeout(() => { const e = b.querySelector('.ssn-dst'); if (e) e.textContent = s; }, ms));
    const bar = b.querySelector('.ssn-dpr'), iv = setInterval(() => { if (bar.children.length < 26) bar.appendChild(document.createElement('i')); }, busy ? 120 : 210);
    const stop = () => { T.forEach(clearTimeout); clearInterval(iv); clearTimeout(fin); };
    const fin = setTimeout(() => {
      stop(); w.close();
      if (busy) { DROP.busyOnce = true; Desk.msgbox('Dial-up Networking', 'The line is busy.\n\n(Mom is STILL on the phone. She says "five more minutes". It is never five more minutes.)\n\nTry again?', 'warn', [['Redial', dial], ['Cancel']]); return; }
      reconnected();
    }, busy ? 2600 : 6000);
    b.querySelector('.btn').addEventListener('click', () => { stop(); w.close(); });
    return w;
  }
  function reconnected() {
    DROP.down = false; DROP.busyOnce = false; DROP.secs = 0;
    const pg = $('page'); if (pg) pg.classList.remove('ssn-dropped');
    if (DROP.page) { DROP.page.remove(); DROP.page = null; }
    const bs = $('brStatus'); if (bs) bs.textContent = 'Done';
    Desk.toast('Connection established', `Reconnected to JackNet at ${pick(['26,400', '28,800', '31,200', '33,600'])} bps. (It says 56K on the box.)`, 5000);
    got('redial');
  }

  // ================================================================ the monthly cover CD (seasons-disc.js)
  const CD_ICON = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#d8d8e8" stroke="#000"/><path d="M16 2a14 14 0 0 1 14 14H16z" fill="#ff4aff" opacity=".55"/><path d="M2 16a14 14 0 0 0 14 14V16z" fill="#3affff" opacity=".55"/><path d="M16 2A14 14 0 0 0 2 16h14z" fill="#ffd400" opacity=".7"/><circle cx="16" cy="16" r="4.5" fill="#fff" stroke="#000"/><circle cx="16" cy="16" r="1.6" fill="#888"/><text x="16" y="27" font-family="Arial Black,Arial" font-weight="bold" font-size="5" text-anchor="middle" fill="#e10600">JACK!</text></svg>';
  A.register('ssn.disc', { single: true, cmd: ['covercd', 'cover cd', 'monthly disc', 'coverdisc99', 'cd of the month'], open: arg => A.load('js/seasons-disc.js').then(() => SeasonsDisc.open(arg)) });
  const cdLabel = () => 'Cover CD (' + MONTHS[today().m - 1].slice(0, 3) + ')';
  function cdIcon() {
    const ic = $('ssnIconDisc') || A.desktopIcon(cdLabel(), CD_ICON, () => A.open('ssn.disc'), 'ssnIconDisc');
    const sp = ic.querySelector('span'); if (sp && sp.textContent !== cdLabel()) sp.textContent = cdLabel();
  }
  A.addProgram(['JACK ATTACK!', 'Cover CD of the Month'], 'ssn.disc', CD_ICON);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cdIcon); else setTimeout(cdIcon, 0);
  setInterval(cdIcon, 60000);

  // ================================================================ Run commands + secrets
  A.cmd(['y2kdrill', 'y2k drill', 'drill', 'millennium drill', 'millenniumdrill', 'year2000', 'year 2000', '2000', 'happy new year', 'midnight'], () => drill());
  S('y2k', 'Survived the Millennium', 'Be here at midnight on the last night of 1999');
  S('drill', 'Y2K drill', 'Practise for the end of the world. There\'s a bunker on the Web that knows how');
  S('again', '...again?', 'Live through the Millennium, then see what year it is');
  S('dropped', 'Mom picked up the phone', 'Surf for a long time. Somebody downstairs will need the phone');
  S('redial', 'Back online', 'Get cut off, then dial back in');
  S('disc', 'Fresh wallpaper', 'Put this month\'s cover CD wallpaper on your desktop');
  S('backissue', 'A shoebox of discs', 'Dig out an old month\'s cover CD');
  S('eggs', 'Egg hunter', 'Find every egg Mom hid on the computer (one weekend in April only)');
  S('presents', 'Unwrapped', 'Open every present on the big day in December');
  S('peek', 'Caught peeking', 'Try to open your presents before Christmas Day');
  S('pancake', 'Flipping brilliant', 'Toss pancakes on the right Tuesday in February');
  S('valentine', 'Secret admirer', 'Catch a heart on the 14th of February');

  // ================================================================ go
  window.Seasons = {
    now, today, setTime(md, t) { setTime(md, t); tick0(); }, fireworks, reduced, phone, sfx, note, pick, rnd, ri, pad, h, esc, css, got, sess, DAYS, MONTHS, Y,
    eveOff, drill, drop, dial, booted, whenBooted, CD_ICON,
    get offset() { return offset; }, get dropped() { return DROP.down; }, winked: !!wink,
    restart(kind) { // the proper Shut Down > Restart flow (closing windows, splash, CRT off, BIOS)
      sess.set('jhp_ssn_wink', kind || 'drill');
      try {
        document.body.classList.add('ssn-autorestart');
        $('smShutdown').click();
        const f = [...document.querySelectorAll('.float')].reverse().find(e => e.getAttribute('aria-label') === 'Shut Down JackOS');
        const r = f && f.querySelector('input[value=restart]'), form = f && f.querySelector('form');
        if (!r || !form) throw new Error('no shut down dialog');
        r.checked = true; form.requestSubmit();
      } catch (e) { Desk.reboot('bios'); }
    },
    preview(name, arg) { // for testing: show any part straight away
      if (name === 'eve') { setTime('12-31', arg || '23:00:05'); tick0(); return; }
      if (name === 'y2k') { setTime('12-31', arg || '23:59:48'); ran = false; tick0(); return; }
      if (name === 'drill') return drill();
      if (name === 'disc') return A.open('ssn.disc', arg);
      if (name === 'drop') return drop(arg);
      return loadDays().then(() => SeasonsDays.preview(name, arg));
    },
  };
  setTimeout(safeTick, 500);
})();

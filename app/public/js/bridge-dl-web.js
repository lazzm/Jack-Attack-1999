/* bridge-dl-web: the pages of Desktop Dazzle, the plug-in sites (JackToonz, The Trailer Park, Radio Jack) and The Annoying
 * Ring, plus everything that happens while you're on them. Loaded by bridge-dl.js (after bridge-dl-art.js). */
(function () {
  'use strict';
  const B = window.BridgeDL, ART = window.BridgeDLArt, A = window.Apps;
  if (!B || !ART || window.BridgeDLWeb) return;
  const { esc, h, qs, qsa, msg, toast, sfx, J, svgData, kbStr, hash, DD } = B;
  const $ = id => document.getElementById(id);
  const store = A.store;
  const FP = 'www.freepagez.w3b', FPU = 'http://' + FP + '/';
  const DDU = 'http://' + DD + '/';
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // ================================================================ styles
  const css = h(null, null, 'style'); css.id = 'bdl-web-css';
  css.textContent = `
.bw{margin:0;min-height:max(560px,calc(100vh - 200px));box-sizing:border-box;overflow:hidden;overflow-wrap:anywhere;font:13px/1.4 Arial,Helvetica,sans-serif;position:relative}
.bw *{box-sizing:border-box}
.bw img,.bw svg,.bw canvas{max-width:100%}
.bw a{cursor:pointer}
.bw .blink{animation:bwBlink 1s steps(1) infinite}
@keyframes bwBlink{50%{visibility:hidden}}
.bw .mq{overflow:hidden;white-space:nowrap}
.bw .mq>span{display:inline-block;padding-left:100%;animation:bwMq 16s linear infinite}
@keyframes bwMq{to{transform:translateX(-100%)}}
.bw .ctr{display:inline-flex;gap:1px;padding:2px;background:#000;border:2px inset #888;vertical-align:middle}
.bw .ctr i{font:bold 14px/1 "Courier New",monospace;color:#3f3;background:#031;padding:2px 3px;font-style:normal;min-width:11px;text-align:center}
.bw .rbow{height:6px;border:0;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,magenta);margin:12px 0}
.bw .ring{margin:22px auto 8px;max-width:520px;border:3px ridge #c0c0c0;background:#fff;color:#000;text-align:center;padding:6px;font:12px Arial,sans-serif}
.bw .ring b{display:block;font:bold 14px "Comic Sans MS","Comic Neue",cursive;color:#c00}
.bw .ring a{color:#00e;margin:0 4px;white-space:nowrap}
/* ---- Desktop Dazzle */
.bw-dd{background:radial-gradient(1px 1px at 20px 30px,#fff,transparent) 0 0/60px 60px,radial-gradient(1px 1px at 45px 10px,#9cf,transparent) 0 0/80px 70px,#05001a;color:#fff;padding:10px 12px 20px}
.bw-dd a{color:#0ff}
.bw-dd .top{text-align:center;padding:6px 0 2px}
.bw-dd .logo{font:bold clamp(28px,7vw,54px)/1 Impact,"Anton","Arial Black",sans-serif;letter-spacing:2px;background:linear-gradient(90deg,#ff0,#f0f,#0ff,#0f0,#ff0);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ddLogo 3s linear infinite;-webkit-text-stroke:1px #fff;display:inline-block}
@keyframes ddLogo{to{background-position:200% 0}}
.bw-dd .tag{color:#ff0;font:bold 14px "Comic Sans MS","Comic Neue",cursive}
.bw-dd .dd-spark{display:inline-block;width:26px;height:26px;vertical-align:middle;animation:ddSpin 2s linear infinite}
@keyframes ddSpin{to{transform:rotate(360deg)}}
.bw-dd .mq{background:#f0f;color:#ff0;font:bold 13px Arial,sans-serif;padding:3px 0;margin:8px 0;border:2px solid #ff0}
.bw-dd .nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:6px 0 10px}
.bw-dd .nav a{display:inline-block;padding:5px 9px;background:linear-gradient(#5a00b0,#200050);border:2px outset #b080ff;color:#fff;text-decoration:none;font:bold 12px Verdana,sans-serif}
.bw-dd .nav a.on{background:linear-gradient(#ff00a0,#600040);border-color:#ff9ae0}
.bw-dd .dd-cols{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.bw-dd .side{flex:1 1 170px;max-width:220px;min-width:150px}
@media (max-width:600px){.bw-dd .side{order:2;max-width:none;flex-basis:100%}}
.bw-dd .main{flex:999 1 320px;min-width:0}
.bw-dd .box{border:2px solid #f0f;background:rgba(40,0,80,.75);padding:8px;margin-bottom:10px}
.bw-dd .box h3{margin:0 0 6px;font:bold 15px Impact,"Arial Black",sans-serif;color:#ff0;letter-spacing:1px}
.bw-dd h2{font:bold 24px Impact,"Arial Black",sans-serif;color:#0ff;margin:4px 0 8px;letter-spacing:1px;text-shadow:2px 2px #f0f}
.bw-dd .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px}
.bw-dd .card{background:#1a0040;border:2px ridge #a070ff;padding:6px;text-align:center;display:flex;flex-direction:column;gap:4px}
.bw-dd .card .th{height:112px;background:#000;border:1px solid #555;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.bw-dd .card .th img.wp{width:100%;height:100%;object-fit:cover}
.bw-dd .card .th img.cu{width:48px;height:48px;image-rendering:pixelated}
.bw-dd .card .th canvas{width:100%;height:100%}
.bw-dd .card b{color:#ff0;font-size:13px}
.bw-dd .card .sm{font-size:11px;color:#cbb8ff}
.bw-dd .card .d{font-size:11px;color:#ddd;flex:1}
.bw-dd .dl{display:block;width:100%;padding:5px 2px;background:linear-gradient(#ffe000,#ff8000);border:2px outset #ffd;color:#000;font:bold 12px Verdana,sans-serif;cursor:pointer}
.bw-dd .dl.got{background:linear-gradient(#9f9,#2a2);}
.bw-dd .new{display:inline-block;background:#f00;color:#ff0;font:bold 10px Arial;padding:0 3px;transform:rotate(-8deg)}
.bw-dd .ad{display:block;margin:10px auto;max-width:468px;height:60px;border:2px solid #fff;background:linear-gradient(90deg,#00a,#0af);color:#fff;font:bold 18px Impact,"Arial Black",sans-serif;text-align:center;line-height:56px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.bw-dd .ad.b{padding-left:40px;background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'><path d='M16 9 11 2M28 9l5-7' stroke='%23146014' stroke-width='2'/><circle cx='11' cy='2.5' r='2.5' fill='%23ffe14a' stroke='%23000'/><circle cx='33' cy='2.5' r='2.5' fill='%23ffe14a' stroke='%23000'/><path d='M22 7c10 0 15 7 15 15 0 9-8 18-15 18S7 31 7 22c0-8 5-15 15-15z' fill='%235fd04a' stroke='%23000' stroke-width='1.5'/><path d='M10 21c3-2 8-1 9 4-3 2-8 1-9-4zM34 21c-3-2-8-1-9 4 3 2 8 1 9-4z' fill='%23000'/><path d='M18 33q4 3 8 0' stroke='%23146014' stroke-width='1.6' fill='none'/></svg>") 8px center/26px no-repeat,repeating-linear-gradient(45deg,#ff0 0 14px,#f80 14px 28px);color:#c00;text-shadow:1px 1px #fff}
.bw-dd .foot{text-align:center;font-size:11px;color:#bbb;margin-top:16px}
.bw-dd .fsamp{font-size:26px;color:#fff;line-height:1.1;padding:4px;overflow:hidden;white-space:nowrap}
@media (max-width:480px){.bw-dd .fsamp{font-size:20px}}
.bw-dd ol{margin:0;padding-left:20px}
/* ---- plug-in boxes */
.bw .plug{position:relative;background:#c0c0c0;border:2px inset #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px;text-align:center;color:#000;font:12px Tahoma,sans-serif;min-height:160px;cursor:pointer}
.bw .plug svg.pz{width:48px;height:48px}
.bw .plug button{font:12px Tahoma,sans-serif}
.bw .stage{position:relative;background:#000;overflow:hidden;width:100%;max-width:480px;margin:0 auto}
.bw .stage canvas{display:block;width:100%;height:auto}
.bw .stage .skip{position:absolute;right:6px;bottom:6px;font:bold 11px Verdana,sans-serif;color:#fff;background:rgba(0,0,0,.6);border:1px solid #fff;padding:2px 6px;cursor:pointer}
.bw .stage .enter{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);font:bold 18px Impact,"Arial Black",sans-serif;padding:6px 18px;background:#ff0;border:3px outset #fff;cursor:pointer;display:none}
.bw .jt{max-width:480px;margin:0 auto;background:linear-gradient(#e8e8f0,#9898a8);border:1px solid #444;border-radius:6px;padding:6px;color:#000}
.bw .jt .jt-bar{display:flex;gap:6px;align-items:center;margin-top:5px;font:11px "Lucida Grande",Tahoma,sans-serif}
.bw .jt input[type=range]{flex:1;min-width:60px}
.bw .rs{max-width:420px;margin:0 auto;background:linear-gradient(#2a2a40,#0a0a18);border:2px outset #557;color:#9cf;padding:8px;font:11px Tahoma,sans-serif;border-radius:4px}
.bw .rs .lcd2{background:#001820;color:#3cf;font:bold 13px "Courier New",monospace;padding:4px 6px;border:2px inset #335;min-height:40px}
.bw .rs canvas{width:100%;height:60px;display:block;margin-top:6px;background:#000}
.bw .rs .row{gap:6px;margin-top:6px}
/* ---- plug-in sites */
.bw-toon{background:#ffef9a;color:#000;padding:12px}
.bw-toon h1{font:bold clamp(26px,6vw,44px) "Comic Sans MS","Comic Neue",cursive;color:#e10600;text-shadow:3px 3px 0 #000;margin:0;text-align:center;-webkit-text-stroke:1px #000}
.bw-trail{background:#111;color:#ddd;padding:12px}
.bw-trail h1{font:bold 30px "Times New Roman",serif;color:#e8c860;letter-spacing:6px;text-align:center;margin:4px 0;text-shadow:0 0 8px #a80}
.bw-trail a{color:#e8c860}
.bw-radio{background:#002a3a repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px);color:#cff;padding:12px}
.bw-radio h1{font:bold 34px Impact,"Arial Black",sans-serif;color:#0ff;text-align:center;margin:4px 0;text-shadow:0 0 10px #0ff}
/* ---- The Annoying Ring */
.bw-hub{background:#ddd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 40L40 0' stroke='%23c8c8c8'/%3E%3C/svg%3E");color:#000;padding:14px}
.bw-hub h1{font:bold 34px "Times New Roman",serif;text-align:center;margin:4px 0;color:#900}
.bw-hub table{border-collapse:collapse;margin:10px auto;background:#fff;max-width:640px;width:100%}
.bw-hub td{border:1px solid #888;padding:5px;vertical-align:top;font-size:12px}
.bw-kev{background:#000;color:#0f0;padding:12px;font-family:"Courier New",monospace;text-align:center}
.bw-kev h1{font:bold 34px Impact,"Arial Black",sans-serif;color:#f00;text-shadow:0 0 6px #ff0,2px 2px #ff0;margin:4px 0}
.bw-kev .gfx{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin:12px 0}
.bw-kev .gfx figure{margin:0;border:3px ridge #0f0;padding:6px;background:#111;width:150px}
.bw-kev .gfx figcaption{color:#ff0;font-size:11px}
.bw-kev .flame{height:26px;background:repeating-linear-gradient(90deg,#f00 0 10px,#f80 10px 20px,#ff0 20px 30px);clip-path:polygon(0 100%,5% 20%,10% 100%,15% 10%,20% 100%,25% 30%,30% 100%,35% 0,40% 100%,45% 25%,50% 100%,55% 5%,60% 100%,65% 30%,70% 100%,75% 10%,80% 100%,85% 20%,90% 100%,95% 0,100% 100%);animation:kevF .4s steps(2) infinite}
@keyframes kevF{50%{transform:scaleY(.8) translateY(3px)}}
.bw-shaz{background:#ffd0f0 radial-gradient(circle at 10px 10px,#ff9ad8 3px,transparent 4px) 0 0/30px 30px;color:#a0006a;padding:12px;text-align:center;font-family:"Comic Sans MS","Comic Neue",cursive}
.bw-shaz h1{font-size:30px;color:#ff00a0;text-shadow:2px 2px #fff;margin:4px 0}
.bw-dean{background:#3a1a0a;color:#ffd8a0;padding:12px;text-align:center}
.bw-dean h1{font:bold 34px Impact,"Arial Black",sans-serif;color:#ff6a00;margin:4px 0;text-shadow:3px 3px #000}
.bw-dean .crack{height:30px;background:linear-gradient(170deg,transparent 45%,#000 46%,#000 50%,transparent 51%),linear-gradient(10deg,transparent 45%,#000 46%,#000 50%,transparent 51%);background-size:60px 30px}
.bw-dean button.jaquake{font:bold 18px Impact,"Arial Black",sans-serif;padding:8px 16px;background:#ff6a00;border:4px outset #ffb070;color:#000;cursor:pointer}
.bw-gaz{background:#000040 linear-gradient(#000040,#0000a0);color:#fff;padding:12px;text-align:center}
.bw-gaz h1{font:bold clamp(30px,8vw,64px) Impact,"Arial Black",sans-serif;margin:0;background:linear-gradient(#fff,#88f 50%,#00f 51%,#aaf);-webkit-background-clip:text;background-clip:text;color:transparent}
.bw-gaz .res{display:inline-block;background:#ff0;color:#000;border:3px solid #f00;padding:8px 14px;font:bold 15px Arial,sans-serif;margin:8px}
.bw-kyle{background:#c0c0c0;color:#000;padding:8px;font:12px "Times New Roman",serif}
.bw-kyle h1{font-size:20px;margin:0 0 4px}
.bw-free{background:#ff0;color:#c00;padding:12px;text-align:center}
.bw-free h1{font:bold 40px Impact,"Arial Black",sans-serif;color:#f00;margin:0;text-shadow:3px 3px #000}
.bw-free .burst{display:inline-block;background:#f00;color:#ff0;font:bold 16px Arial;padding:16px;clip-path:polygon(50% 0,61% 20%,85% 8%,78% 33%,100% 40%,80% 55%,95% 80%,70% 74%,62% 100%,50% 80%,38% 100%,30% 74%,5% 80%,20% 55%,0 40%,22% 33%,15% 8%,39% 20%);animation:ddSpin 6s linear infinite}
.bw-billy{background:#cfe8ff;color:#003;padding:14px;text-align:center;font-family:"Comic Sans MS","Comic Neue",cursive}
.bw-billy h1{font-size:28px;color:#0050a0;margin:4px 0}
.bw-spk{background:#1a0030;color:#fcf;padding:12px;text-align:center;font-family:"Comic Sans MS","Comic Neue",cursive;position:relative}
.bw-spk h1{font-size:32px;margin:4px 0;background:linear-gradient(90deg,#f0f,#ff0,#0ff,#f0f);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ddLogo 2s linear infinite}
.bw-spk .flake{position:absolute;top:-10px;color:#fff;pointer-events:none;animation:spkFall linear infinite;font-size:14px}
@keyframes spkFall{to{transform:translateY(700px) rotate(360deg)}}
.bdl-sparkle{position:fixed;pointer-events:none;z-index:99998;width:12px;height:12px;animation:spkOut .9s ease-out forwards}
@keyframes spkOut{to{transform:translateY(30px) scale(.2) rotate(180deg);opacity:0}}
.bdl-plugwin .appbody{background:#c0c0c0}
`;
  document.head.appendChild(css);

  // ================================================================ per-page timers that stop when you leave
  function Ctx() {
    const offs = []; let dead = false;
    const c = {
      later(fn, ms) { const t = setTimeout(() => { if (!dead) fn(); }, ms); offs.push(() => clearTimeout(t)); return t; },
      every(fn, ms) { const t = setInterval(() => { if (!dead) fn(); }, ms); offs.push(() => clearInterval(t)); return t; },
      raf(fn) { let r = 0; const loop = ts => { if (dead) return; r = requestAnimationFrame(loop); fn(ts); }; r = requestAnimationFrame(loop); offs.push(() => cancelAnimationFrame(r)); },
      on(el, ev, fn, o) { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); },
      onStop(fn) { offs.push(fn); },
      stop() { if (dead) return; dead = true; offs.splice(0).forEach(f => { try { f(); } catch (e) {} }); },
      get dead() { return dead; },
    };
    return c;
  }
  let PAGE = null; // { host, path, ctx, el }

  // ================================================================ live counters
  const base = (k, lo, hi) => lo + hash(k) % (hi - lo);
  function counters(el) {
    const els = qsa(el, '[data-cnt]'); if (!els.length || !window.Net || !Net.kv) return;
    const keys = [...new Set(els.map(e => e.dataset.cnt))].slice(0, 30);
    Net.kv.get(keys).then(vals => els.forEach(e => { const v = vals && typeof vals[e.dataset.cnt] === 'number' ? vals[e.dataset.cnt] : 0; e.textContent = fmt(base(e.dataset.cnt, +e.dataset.lo || 200, +e.dataset.hi || 9000) + v); }));
  }
  const cnt = (k, lo, hi) => `<span data-cnt="${k}" data-lo="${lo}" data-hi="${hi}">${fmt(base(k, lo, hi))}</span>`;
  const digits = n => `<span class="ctr">${String(n).padStart(7, '0').split('').map(d => `<i>${d}</i>`).join('')}</span>`;

  // ================================================================ the broken puzzle piece (and what it turns into once the plug-in is installed)
  const PUZ = '<svg class="pz" viewBox="0 0 48 48"><path d="M6 14h10a5 5 0 1 1 8 0h10v10a5 5 0 1 1 0 8v10H24a5 5 0 1 0-8 0H6V32a5 5 0 1 0 0-8z" fill="#e8e8e8" stroke="#555" stroke-width="2"/><path d="M26 12l6 10-4 3 6 12" stroke="#c00" stroke-width="2.5" fill="none"/></svg>';
  function slot(k, content, w, hgt) { return `<div class="bslot" data-pl="${k}" data-c="${content}" style="max-width:${w || 480}px;margin:8px auto;min-height:${hgt || 200}px"></div>`; }
  function mountSlots(root, ctx) { qsa(root, '.bslot').forEach(s => mountSlot(s, ctx)); }
  function mountSlot(s, ctx) {
    const k = s.dataset.pl, P = B.PLUGS[k];
    s.innerHTML = '';
    if (!B.plugOK(k)) {
      const box = h(`${PUZ}<b>You need the ${esc(P.full)} plug-in to view this ${esc(P.what)}.</b><span>Click here to download the plug-in.</span><button type="button" class="btn">Get Plug-in...</button>`, 'plug');
      box.addEventListener('click', () => msg('JackNet Explorer', `This page contains ${P.what} that needs the ${P.full} plug-in.\n\nThe plug-in is not installed on this computer. Do you want to download it now?\n\n(It's ${kbStr(window.Setup.get(P.pid).kb)}. About ${Math.max(1, Math.round(window.Setup.get(P.pid).kb / 4.8 / 60))} minutes on a 56K modem, or 3 seconds on a cable modem.)`, 'q', [['Get Plug-in', () => window.Setup.download(P.pid)], ['Cancel']]));
      s.appendChild(box); s.classList.remove('on'); return;
    }
    s.classList.add('on');
    const sub = Ctx(); ctx.onStop(() => sub.stop()); s._ctx = sub;
    (CONTENT[s.dataset.c] || CONTENT.logo3d)(s, sub);
  }
  function setupChanged(d) {
    if (!PAGE || !d || !d.id) return;
    const k = Object.keys(B.PLUGS).find(x => B.PLUGS[x].pid === d.id); if (!k) return;
    qsa(PAGE.el, `.bslot[data-pl="${k}"]`).forEach(s => { if (s._ctx) s._ctx.stop(); mountSlot(s, PAGE.ctx); });
    if (d.on && qs(PAGE.el, `.bslot[data-pl="${k}"]`)) { B.secret('plugin'); toast('JackNet Explorer', `${B.PLUGS[k].full} is ready. The page has come alive!`, 4000); }
  }

  // ================================================================ a little canvas player for intros, cartoons and trailers
  function stage(el, ctx, o) {
    const W = o.w || 400, H = o.h || 250;
    const st = h(`<canvas width="${W}" height="${H}"></canvas>${o.skip ? '<button type="button" class="skip">Skip Intro &gt;&gt;</button><button type="button" class="enter">ENTER SITE</button>' : ''}`, 'stage');
    el.appendChild(st);
    const g = qs(st, 'canvas').getContext('2d');
    return { st, g, W, H };
  }
  // the JackTime-style controls under a canvas
  function jtPlayer(el, ctx, o) {
    const wrap = h('', 'jt'); el.appendChild(wrap);
    const { g, W, H } = stage(wrap, ctx, o);
    const bar = h(`<button type="button" class="btn jp">&#9654;</button><input type="range" min="0" max="1000" value="0" aria-label="Position"><span class="tm">0:00 / 0:${String(o.dur).padStart(2, '0')}</span><b style="font-size:10px">${esc(o.brand || 'JackTime')}</b>`, 'jt-bar'); wrap.appendChild(bar);
    const btn = qs(bar, '.jp'), rng = qs(bar, 'input'), tm = qs(bar, '.tm');
    let t = 0, playing = false, load = o.load ? 0 : 1, last = 0, ended = false;
    const draw = () => {
      if (load < 1) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#ccc'; g.font = '14px Arial'; g.textAlign = 'center'; g.fillText(`${o.load} ${Math.floor(load * 100)}%`, W / 2, H / 2); g.strokeStyle = '#888'; g.strokeRect(W / 2 - 80, H / 2 + 12, 160, 10); g.fillStyle = '#6af'; g.fillRect(W / 2 - 79, H / 2 + 13, 158 * load, 8); return; }
      o.draw(g, t, W, H);
    };
    const sec = x => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0');
    ctx.raf(ts => {
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      if (load < 1) { load = Math.min(1, load + dt * 0.7); if (load >= 1) playing = true; }
      else if (playing) { t += dt; if (t >= o.dur) { t = o.dur; playing = false; ended = true; if (o.onEnd) o.onEnd(); } }
      rng.value = String(Math.round(t / o.dur * 1000)); tm.textContent = sec(t) + ' / ' + sec(o.dur); btn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
      draw();
    });
    btn.addEventListener('click', () => { if (load < 1) return; if (ended) { t = 0; ended = false; } playing = !playing; });
    rng.addEventListener('input', () => { t = +rng.value / 1000 * o.dur; ended = false; });
    if (o.load) { /* loading starts straight away */ } else playing = true;
    return { get t() { return t; } };
  }
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const card = (g, W, H, txt, a, sz, col) => { g.globalAlpha = Math.max(0, Math.min(1, a)); g.fillStyle = col || '#fff'; g.font = `bold ${sz || 22}px "Times New Roman",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; String(txt).split('\n').forEach((l, i, arr) => g.fillText(l, W / 2, H / 2 + (i - (arr.length - 1) / 2) * (sz || 22) * 1.3)); g.globalAlpha = 1; };
  function grot(g, x, y, s, f, net) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 2; g.strokeStyle = '#000';
    const leg = Math.sin(f) * 6;
    g.fillStyle = '#6a3a1a'; g.fillRect(-10 + leg, 18, 7, 16); g.fillRect(3 - leg, 18, 7, 16);
    g.fillStyle = '#8a5a2a'; g.fillRect(-12, -4, 24, 24); g.strokeRect(-12, -4, 24, 24);
    g.fillStyle = '#3a9a2a'; g.beginPath(); g.moveTo(-14, -18); g.lineTo(-30, -26); g.lineTo(-14, -8); g.fill(); g.stroke(); g.beginPath(); g.moveTo(14, -18); g.lineTo(30, -26); g.lineTo(14, -8); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, -16, 15, 13, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#ff2000'; g.fillRect(-8, -20, 5, 4); g.fillRect(3, -20, 5, 4); g.fillStyle = '#fff'; g.fillRect(-6, -9, 3, 3); g.fillRect(3, -9, 3, 3);
    if (net) { g.strokeStyle = '#6a4a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 4); g.lineTo(net.x, net.y); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(net.x, net.y - 8, 10, 0, 7); g.stroke(); }
    g.restore();
  }
  function squig(g, x, y, s, f) { // a Blobbit: Jack's round, bouncy, made-up critter (no teeth, all smiles)
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#5a0a00'; g.lineWidth = 2; const sq = Math.sin(f) * 2;
    g.fillStyle = '#e8381b'; g.beginPath(); g.arc(-9, -11 - sq, 4.5, 0, 7); g.arc(9, -11 - sq, 4.5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 0, 16 - sq * 0.5, 13 + sq, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#ff9a7a'; g.beginPath(); g.ellipse(-7, -7 - sq, 4, 2, -0.3, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-5, -2, 3.6, 4.4, 0, 0, 7); g.ellipse(5, -2, 3.6, 4.4, 0, 0, 7); g.fill(); g.lineWidth = 1; g.stroke();
    g.fillStyle = '#000'; g.beginPath(); g.arc(-4.4, -1.4, 1.9, 0, 7); g.arc(5.6, -1.4, 1.9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-5.4, -3, 1.2, 1.2); g.fillRect(4.6, -3, 1.2, 1.2);
    g.fillStyle = '#ffb0c0'; g.beginPath(); g.arc(-11, 4, 2.2, 0, 7); g.arc(11, 4, 2.2, 0, 7); g.fill();
    g.strokeStyle = '#5a0a00'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.arc(0, 4, 4.5, 0.3, Math.PI - 0.3); g.stroke(); g.restore();
  }
  // the 50 ft blob from the B-movie trailer: wobbling jelly, eye stalks, drips (drawn in whatever colours the film stock allows)
  function bigBlob(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 2.5; g.strokeStyle = '#111';
    g.fillStyle = '#9a9a9a'; g.beginPath(); for (let k = 0; k <= 24; k++) { const a = Math.PI + k / 24 * Math.PI, w = 1 + Math.sin(a * 5 + t * 6) * 0.07; g.lineTo(Math.cos(a) * 34 * w, Math.sin(a) * 30 * w); } for (let k = 6; k >= 0; k--) g.lineTo(-34 + k / 6 * 68, (k % 2 ? 6 : 0) + Math.max(0, Math.sin(t * 2 + k)) * 6); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6a6a6a'; g.beginPath(); g.arc(-14, -8, 6, 0, 7); g.arc(16, -14, 4, 0, 7); g.arc(8, -2, 3, 0, 7); g.fill();
    g.fillStyle = '#e8e8e8'; g.beginPath(); g.ellipse(-16, -20, 7, 3.5, -0.6, 0, 7); g.fill();
    for (const ex of [-9, 9]) { g.beginPath(); g.moveTo(ex * 0.6, -26); g.lineTo(ex, -40 + Math.sin(t * 5 + ex) * 2); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, -43 + Math.sin(t * 5 + ex) * 2, 6, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#000'; g.beginPath(); g.arc(ex - 2, -42 + Math.sin(t * 5 + ex) * 2, 2.6, 0, 7); g.fill(); }
    g.fillStyle = '#222'; g.beginPath(); g.ellipse(0, -10, 14, 5 + Math.abs(Math.sin(t * 3)) * 4, 0, 0, 7); g.fill(); g.restore();
  }
  function burst(g, x, y, r, txt, col) { g.save(); g.translate(x, y); g.fillStyle = col || '#ff0'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, rr = i % 2 ? r * 0.6 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e10600'; g.font = `bold ${Math.round(r * 0.45)}px Impact,"Arial Black",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 2); g.restore(); }

  // ================================================================ plug-in content
  const CONTENT = {
    // the Desktop Dazzle ShockJack intro (with the most famous button on the Web)
    intro(el, ctx) {
      const { st, g, W, H } = stage(el, ctx, { w: 480, h: 300, skip: true });
      const skip = qs(st, '.skip'), enter = qs(st, '.enter'), DUR = 15;
      let t = 0, last = 0, skipped = false, done = false;
      const T = 'DESKTOP DAZZLE';
      ctx.raf(ts => {
        const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt;
        g.fillStyle = '#05001a'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { const x = (i * 97 + t * (20 + i % 5 * 20)) % W, y = (i * 53) % H; g.fillStyle = `rgba(255,255,255,${0.3 + (i % 7) / 10})`; g.fillRect(W - x, y, 2, 2); }
        // a spinning star
        g.save(); g.translate(W / 2, H * 0.3); g.rotate(t * 2); const sz = 20 + ease((t - 0.5) / 2) * 40; g.fillStyle = `hsl(${t * 90 % 360},100%,60%)`; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? sz * 0.4 : sz; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore();
        // the letters fly in one by one
        g.font = 'bold 34px Impact,"Arial Black",sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
        const tw = g.measureText(T).width, x0 = W / 2 - tw / 2;
        let x = x0;
        [...T].forEach((ch, i) => { const cw = g.measureText(ch).width, p = ease((t - 2 - i * 0.25) / 0.6); if (p > 0) { g.save(); g.translate(x + cw / 2 + (1 - p) * (i % 2 ? 300 : -300), H * 0.6 + (1 - p) * -120); g.rotate((1 - p) * 6); g.fillStyle = `hsl(${(i * 26 + t * 60) % 360},100%,60%)`; g.fillText(ch, 0, 0); g.restore(); } x += cw; });
        const tag = 'The BEST free stuff on the WHOLE Internet!!!', n = Math.max(0, Math.floor((t - 7) * 14));
        g.font = 'bold 14px "Comic Sans MS","Comic Neue",cursive'; g.fillStyle = '#ff0'; g.fillText(tag.slice(0, n), W / 2, H * 0.75);
        if (t > 11) { g.globalAlpha = Math.min(1, t - 11); g.font = '11px Verdana'; g.fillStyle = '#9cf'; g.fillText('a DazzleDan production  (c) 1999', W / 2, H * 0.88); g.globalAlpha = 1; }
        if (!done && t >= DUR) { done = true; enter.style.display = 'block'; skip.style.display = 'none'; if (!skipped) { B.secret('intro'); toast('Desktop Dazzle', 'You watched the WHOLE intro! Nobody does that. DazzleDan is so proud.', 4000); } }
      });
      skip.addEventListener('click', () => { skipped = true; B.openSite(DDU); });
      enter.addEventListener('click', () => B.openSite(DDU));
    },
    // JackToonz: "Gubbinz in: CRITTER CATCHER"
    toon(el, ctx) {
      jtPlayer(el, ctx, { w: 400, h: 250, dur: 22, brand: 'ShockJack 7', draw(g, t, W, H) {
        g.fillStyle = '#7ec8ff'; g.fillRect(0, 0, W, H); g.fillStyle = '#3aa02a'; g.fillRect(0, H * 0.72, W, H); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(80 + t * 3, 40, 40, 14, 0, 0, 7); g.ellipse(300 - t * 2, 60, 50, 16, 0, 0, 7); g.fill();
        g.fillStyle = '#2a7a1a'; g.beginPath(); g.ellipse(340, H * 0.72, 50, 30, 0, Math.PI, 0); g.fill();
        if (t < 3) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(0, 0, W, H); card(g, W, H, 'GUBBINZ\nin\nCRITTER CATCHER', Math.min(1, t * 2), 30, '#ff0'); return; }
        const gy = H * 0.72 - 34;
        if (t < 9) { const p = (t - 3) / 6; grot(g, 20 + p * 180, gy, 1.2, t * 8, { x: 22, y: -30 }); squig(g, 300 + Math.sin(t * 3) * 10, H * 0.72 - 14 - Math.abs(Math.sin(t * 4)) * 30, 1, t * 6); if (t > 6) card(g, W, 60, 'shhh...', 1, 18, '#000'); return; }
        if (t < 12) { const p = (t - 9) / 3; grot(g, 200 + p * 60, gy, 1.2, t * 14, { x: 22 + Math.sin(p * 9) * 10, y: -30 - p * 20 }); squig(g, 300 + p * 70, H * 0.72 - 14 - Math.abs(Math.sin(t * 6)) * 60, 1, t * 9); return; }
        if (t < 15) { const p = (t - 12) / 3; squig(g, 370 - p * 110, H * 0.72 - 90 + Math.abs(Math.sin(p * 4)) * -40 + p * 30, 1, t * 9); grot(g, 260, gy, 1.2, 0, { x: 30, y: 10 }); if (p > 0.6) burst(g, 250, gy - 50, 40, 'BONK!'); return; }
        if (t < 18) { const p = (t - 15) / 3; g.save(); g.translate(260, gy + 30); g.rotate(-Math.PI / 2 * Math.min(1, p * 2)); grot(g, 0, -30, 1.2, 0); g.restore(); squig(g, 330, H * 0.72 - 14 - Math.abs(Math.sin(t * 5)) * 20, 1, t * 9); g.fillStyle = '#ff0'; for (let i = 0; i < 4; i++) { const a = t * 4 + i * 1.6; g.beginPath(); g.arc(240 + Math.cos(a) * 20, gy + Math.sin(a) * 6, 4, 0, 7); g.fill(); } return; }
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const p = Math.min(1, (t - 18) / 1.5);
        g.save(); g.beginPath(); g.arc(330, H * 0.6, Math.max(0, 140 * (1 - p) + 20), 0, 7); g.clip(); g.fillStyle = '#7ec8ff'; g.fillRect(0, 0, W, H); squig(g, 330, H * 0.6, 1.4, t * 8); g.restore();
        if (t > 19.5) card(g, W, H * 0.4, "THAT'S ALL, EVERYONE!", 1, 26, '#ff0');
      } });
    },
    // a spinning 3D logo (orthographic, each face drawn with an affine transform)
    logo3d(el, ctx) {
      const { g, W, H } = stage(el, ctx, { w: 400, h: 250 });
      const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const F = [[0, 1, 3, '#e10600', 'S'], [5, 4, 6, '#2a5ae0', 'Q'], [4, 0, 7, '#0a0', 'U'], [1, 5, 2, '#ffd400', 'I'], [4, 5, 0, '#ff8c00', 'G'], [3, 2, 7, '#a040e0', 'Z']];
      let t = 0, last = 0;
      ctx.raf(ts => {
        const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt;
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#000020'); gr.addColorStop(1, '#300050'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        const ax = t * 0.9, ay = t * 1.3, s = 55;
        const P = V.map(([x, y, z]) => { let y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax); let x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay); return [W / 2 + x2 * s, H * 0.45 + y1 * s, z2]; });
        F.map(f => { const [a, b, c] = [P[f[0]], P[f[1]], P[f[2]]]; const d = [b[0] - a[0] + c[0] - a[0], b[1] - a[1] + c[1] - a[1]]; const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return { f, a, b, c, z: (a[2] + b[2] + c[2]) / 3, cross, d }; })
          .filter(x => x.cross < 0).sort((p, q) => p.z - q.z).forEach(({ f, a, b, c }) => {
            g.save(); g.setTransform((b[0] - a[0]) / 100, (b[1] - a[1]) / 100, (c[0] - a[0]) / 100, (c[1] - a[1]) / 100, a[0], a[1]);
            g.fillStyle = f[3]; g.fillRect(0, 0, 100, 100); g.strokeStyle = '#000'; g.lineWidth = 4; g.strokeRect(0, 0, 100, 100);
            g.fillStyle = '#fff'; g.font = 'bold 70px Impact,"Arial Black",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f[4], 50, 54); g.restore();
          });
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.font = 'bold 26px Impact,"Arial Black",sans-serif'; g.textAlign = 'center'; const tx = 'JACKTOONZ'; [...tx].forEach((ch, i) => { g.fillStyle = `hsl(${(i * 36 + t * 120) % 360},100%,60%)`; g.fillText(ch, W / 2 + (i - 4.5) * 22, H * 0.88 + Math.sin(t * 5 + i * 0.6) * 6); });
      });
    },
    robogrot(el, ctx) {
      jtPlayer(el, ctx, { w: 400, h: 225, dur: 24, load: 'Fast Start: buffering', brand: 'JackTime 4', draw(g, t, W, H) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        if (t < 3) return card(g, W, H, 'IN A WORLD...', Math.min(1, t) * (3 - t), 24);
        if (t < 6.5) { g.fillStyle = '#20203a'; g.fillRect(0, 0, W, H); g.fillStyle = '#05050f'; for (let i = 0; i < 12; i++) g.fillRect(i * 36, H - 60 - (i * 37 % 70), 30, 200); g.fillStyle = '#ffd860'; for (let i = 0; i < 30; i++) g.fillRect((i * 53) % W, H - 20 - (i * 29 % 80), 3, 4); return card(g, W, H * 0.4, '...WHERE ONE BOY...', Math.min(1, t - 3), 20); }
        if (t < 11) { const p = (t - 6.5) / 4.5; g.fillStyle = '#30304a'; g.fillRect(0, 0, W, H); g.fillStyle = '#555'; g.fillRect(0, H * 0.8, W, H); const x = -40 + p * (W + 80), y = H * 0.8 - 70, st = Math.sin(t * 10) * 10;
          g.fillStyle = '#9aa0a8'; g.strokeStyle = '#000'; g.lineWidth = 2; g.fillRect(x - 8 + st, y + 40, 8, 30); g.fillRect(x + 6 - st, y + 40, 8, 30); g.fillRect(x - 14, y + 6, 32, 36); g.strokeRect(x - 14, y + 6, 32, 36); g.fillStyle = '#e10600'; g.fillRect(x - 6, y + 14, 6, 6); g.fillStyle = '#ff0'; g.fillRect(x + 6, y + 14, 6, 6);
          g.fillStyle = '#f0c8a0'; g.beginPath(); g.ellipse(x + 2, y - 6, 12, 12, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#6a3a1a'; g.beginPath(); g.ellipse(x + 2, y - 12, 12.5, 7, 0, Math.PI, 0); g.fill(); g.fillRect(x - 10, y - 13, 4, 6);
          g.fillStyle = '#000'; g.fillRect(x - 3, y - 7, 3, 3); g.fillRect(x + 6, y - 7, 3, 3); g.beginPath(); g.arc(x + 3, y - 1, 4, 0.2, Math.PI - 0.2); g.stroke();
          g.fillStyle = '#9aa0a8'; g.fillRect(x - 12, y + 4, 28, 4); g.strokeRect(x - 12, y + 4, 28, 4);
          return card(g, W, 40, '...GOT ROBOT LEGS.', Math.min(1, (t - 6.5) * 2), 20); }
        if (t < 14.5) { const f = Math.floor(t * 8) % 2; g.fillStyle = f ? '#ff8c00' : '#400'; g.fillRect(0, 0, W, H); burst(g, W / 2 + Math.sin(t * 9) * 40, H / 2, 70 + f * 10, ['KA-BLAM!', 'KER-CHUNK!', 'ZZAP!'][Math.floor((t - 11) * 1.2) % 3]); return card(g, W, 40, 'THIS CHRISTMAS', 1, 20); }
        if (t < 18.5) { g.fillStyle = '#101018'; g.fillRect(0, 0, W, H); return card(g, W, H, "HE'S BACK.\nAND HE'S... QUITE SMALL.", Math.min(1, t - 14.5) * Math.min(1, 18.5 - t), 22); }
        const p = Math.min(1, (t - 18.5) / 1.2); const gr = g.createLinearGradient(0, H * 0.3, 0, H * 0.6); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#88a'); gr.addColorStop(1, '#ccd');
        g.save(); g.translate(W / 2, H * 0.45); g.scale(0.6 + p * 0.4, 0.6 + p * 0.4); g.fillStyle = gr; g.font = 'bold 54px Impact,"Arial Black",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ROBOKID', 0, 0); g.restore();
        g.fillStyle = `rgba(255,255,220,${0.6 * (1 - Math.abs(Math.sin(t)))})`; g.beginPath(); g.arc(W * 0.2 + (t - 18.5) * 50, H * 0.4, 14, 0, 7); g.fill();
        if (t > 20) card(g, W, H * 1.55, 'COMING TO A CINEMA NEAR YOU\nCHRISTMAS 1999', Math.min(1, t - 20), 14, '#ccc');
        if (t > 22.5) card(g, W, H * 1.85, 'Rated U. Contains mild peril and one (1) blob.', 1, 10, '#888');
      } });
    },
    squig50(el, ctx) {
      jtPlayer(el, ctx, { w: 400, h: 225, dur: 20, load: 'Fast Start: buffering', brand: 'JackTime 4', draw(g, t, W, H) {
        g.fillStyle = '#d8d8d0'; g.fillRect(0, 0, W, H);
        const scratch = () => { g.strokeStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 3; i++) { const x = (Math.sin(t * 13 + i * 7) * 0.5 + 0.5) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 3, H); g.stroke(); } g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`; g.fillRect(0, 0, W, H); };
        if (t < 3.5) { g.fillStyle = '#111'; g.fillRect(0, 0, W, H); card(g, W, H, 'THEY LAUGHED\nAT THE LITTLE BLOB...', Math.min(1, t), 22, '#eee'); return scratch(); }
        if (t < 12) { const p = (t - 3.5) / 8.5; g.fillStyle = '#888'; for (let i = 0; i < 10; i++) g.fillRect(i * 44, H * 0.55 - (i * 31 % 40), 34, 120); g.fillStyle = '#555'; g.fillRect(0, H * 0.85, W, H);
          const sx = W + 60 - p * (W + 40), sy = H * 0.5 + Math.abs(Math.sin(t * 2)) * -20; bigBlob(g, sx, H * 0.85 - 4, 2.2, t);
          g.fillStyle = '#000'; for (let i = 0; i < 5; i++) { const px = ((i * 70 - t * 90) % (W + 40) + W + 40) % (W + 40) - 20, py = H * 0.85 - 12; g.fillRect(px, py, 3, 10); g.beginPath(); g.arc(px + 1, py - 3, 3, 0, 7); g.fill(); }
          if (t > 7) card(g, W, 50, 'AAAAARGH!', 1, 22, '#000'); return scratch(); }
        if (t < 15) { g.fillStyle = '#111'; g.fillRect(0, 0, W, H); card(g, W, H, '...NOW HE IS\n50 FEET TALL', Math.min(1, t - 12), 22, '#eee'); return scratch(); }
        g.fillStyle = '#111'; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H * 0.42); g.rotate(-0.05); g.fillStyle = '#eee'; g.font = 'bold 26px "Times New Roman",serif'; g.textAlign = 'center'; g.fillText('ATTACK OF THE', 0, -18); g.font = 'bold 40px Impact,"Arial Black",sans-serif'; g.fillText('50 FT BLOB', 0, 26); g.restore();
        card(g, W, H * 1.6, 'In glorious BLACK & WHITE (we lost the colour)', Math.min(1, t - 15), 11, '#bbb'); scratch();
      } });
    },
    radio(el, ctx) {
      const box = h(`<div class="rs"><div class="row" style="justify-content:space-between"><b style="color:#fff">RealJack Player G2</b><span>&#9679; LIVE</span></div><div class="lcd2"><div class="rs1">Contacting radiojack.wubwub...</div><div class="rs2" style="font-weight:normal;font-size:11px"></div></div><canvas width="300" height="60"></canvas><div class="row"><button type="button" class="btn rp">&#9654; Play</button><button type="button" class="btn rx">&#9632; Stop</button><span style="flex:1"></span><span class="rk">0 kbps</span></div></div>`);
      el.appendChild(box);
      const l1 = qs(box, '.rs1'), l2 = qs(box, '.rs2'), cv = qs(box, 'canvas'), g = cv.getContext('2d'), kb = qs(box, '.rk');
      const SHOWS = ['Now playing: "Ghost in the Modem" by The Floppies', 'Now playing: "Dial-Up Love" by Modem Kids', 'Now playing: "Bleep Bleep Bloop" by The 8-Bits', 'Coming up: the shipping forecast, read by Gubbinz', 'Now playing: "Bleep Bloop" by DJ Floppy'];
      let on = false, buf = 0, t = 0, last = 0, si = 0;
      const start = () => { on = true; buf = 0; l1.textContent = 'Buffering... 0%'; };
      const stopR = () => { on = false; try { if (Sound.music.playing === 'bdl-radio') Sound.music.stop(); } catch (e) {} l1.textContent = 'Stopped.'; l2.textContent = ''; kb.textContent = '0 kbps'; };
      qs(box, '.rp').addEventListener('click', start); qs(box, '.rx').addEventListener('click', stopR);
      ctx.onStop(stopR);
      ctx.raf(ts => {
        const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt;
        g.fillStyle = '#000'; g.fillRect(0, 0, 300, 60);
        if (on && buf < 1) { buf += dt * 0.35 * (Math.random() < 0.1 ? 0 : 1); l1.textContent = `Buffering... ${Math.floor(buf * 100)}%` + (buf > 0.4 && buf < 0.55 ? ' (net congestion)' : ''); if (buf >= 1) { try { if (Sound.on) Sound.music.play('bdl-radio'); } catch (e) {} l1.textContent = 'RADIO JACK 99.9 - LIVE'; l2.textContent = SHOWS[0] + (Sound.on ? '' : ' (your sound is off!)'); } }
        if (on && buf >= 1) {
          kb.textContent = (14 + Math.round(Math.sin(t) * 4)) + ' kbps';
          if (Math.floor(t / 6) !== si) { si = Math.floor(t / 6); l2.textContent = SHOWS[si % SHOWS.length] + (Sound.on ? '' : ' (your sound is off!)'); }
          for (let i = 0; i < 30; i++) { const v = Math.abs(Math.sin(t * (3 + i % 5) + i)) * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 0.3))); g.fillStyle = `hsl(${180 + i * 4},100%,55%)`; g.fillRect(i * 10 + 1, 60 - v * 56, 8, v * 56); }
        }
      });
      ctx.later(start, 500);
    },
  };

  // ================================================================ Desktop Dazzle pages
  const SPARK = '<svg class="dd-spark" viewBox="0 0 26 26"><path d="M13 0l3 9 10 4-10 4-3 9-3-9-10-4 10-4z" fill="#ff0"/></svg>';
  const NAV = [['/', 'HOME'], ['/wallpapers.html', 'WALLPAPERS'], ['/cursors.html', 'CURSORS'], ['/themes.html', 'THEMES'], ['/savers.html', 'SCREEN SAVERS'], ['/fonts.html', 'FONTS'], ['/smileys.html', 'SMILEYZ'], ['/plugins.html', 'PLUG-IN ZONE'], ['/intro.html', 'INTRO!']];
  const ddShell = (path, inner, side) => `<div class="top">${SPARK}<span class="logo">DESKTOP DAZZLE!!!</span>${SPARK}<div class="tag">FREE stuff to make your computer look AWESOME!!!</div></div>
<div class="mq"><span>*** NEW THIS WEEK: Desktop Themes!!! *** FREE animated cursors!!! *** Fonts that are actually little pictures!!! *** All files scanned by a real magnifying glass *** Tell your friends!!! *** Sign the guestbook (coming soon) ***</span></div>
<div class="nav">${NAV.map(([p, l]) => `<a href="${DDU}${p.slice(1)}" class="${p === path ? 'on' : ''}">${l}</a>`).join('')}</div>
<div class="dd-cols"><div class="side">${side || ddSide()}</div><div class="main">${inner}</div></div>
<div class="foot"><hr class="rbow"><p>All downloads are FREE!!! Desktop Dazzle is not responsible if your Dad doesn't like the robot wallpaper.</p><p>Best viewed with JackNet Explorer 5 at 800x600 in High Colour. &nbsp; Webmaster: <a href="${DDU}about.html">DazzleDan</a></p><p><a href="${FPU}">The Annoying Ring</a> &middot; <a href="http://www.sharewareshack.netz/">The Shareware Shack</a> &middot; <a href="http://www.jacktoonz.toonz/">JackToonz</a></p></div>`;
  const ddSide = () => `<div class="box"><h3>TOP 5 DOWNLOADS</h3><ol><li><a href="${DDU}wallpapers.html">Scrapyard Robot wallpaper</a></li><li><a href="${DDU}cursors.html">Laser Sword cursor</a></li><li><a href="${DDU}themes.html">Scrapyard Robots theme</a></li><li><a href="${DDU}fonts.html">Wingdingz</a></li><li><a href="${DDU}savers.html">Flying Floppies</a></li></ol></div>
<div class="box"><h3>WEBMASTER</h3><p style="margin:0">Hi! I'm <b>DazzleDan</b>. I make all this stuff in Paint and give it away FREE because I am nice. <a href="${DDU}about.html">More about me</a></p></div>
<div class="box" style="text-align:center"><h3>AWARDS</h3><p style="margin:0;font-size:11px">&#9733; Gubbinz's Golden Cartridge 1999 &#9733;<br>&#9733; Cool Site of the Day (once) &#9733;<br>&#9733; Top 10,000 Site &#9733;</p></div>`;
  const ADS = [['ad', 'CLICK HERE TO WIN A FREE COMPUTER!!!'], ['ad b', 'SPLAT THE ALIEN AND WIN!!! >>>'], ['ad', 'FREE SMILEYZ FOR YOUR E-MAIL!!! :-) ;-) :-D']];
  const adHtml = i => `<div class="${ADS[i % ADS.length][0]}" data-ad="${i % ADS.length}">${ADS[i % ADS.length][1]}</div>`;
  function ddCard(kind, id) {
    const it = { wall: B.WALLS, cur: B.CURS, saver: B.SAVERS, font: B.FONTS }[kind][id], got = B.has(kind, id);
    let th = '';
    if (kind === 'wall') th = `<img class="wp" src="${svgData(ART.WALLS[id]())}" alt="${esc(it.n)}">`;
    else if (kind === 'cur') th = `<img class="cu" data-cur="${id}" src="${svgData(ART.cursorFrames(id)[0].svg)}" alt="${esc(it.n)}">`;
    else if (kind === 'saver') th = `<canvas width="168" height="112" data-saver="${id}"></canvas>`;
    else th = `<div class="fsamp" style="font-family:'bdlp-${id}',Arial">${id === 'ding' ? 'ABCDEFG' : 'Hello! 123'}</div>`;
    const ck = 'bdl.dl.' + kind + '.' + id;
    return `<div class="card">${(hash(id) % 3 === 0) ? '<span><span class="new">NEW!</span></span>' : ''}<div class="th">${th}</div><b>${esc(it.n)}</b><span class="sm">${kind === 'wall' ? 'by ' + esc(it.by) + ' &middot; ' : ''}${kbStr(it.kb)} &middot; ${cnt(ck, 300, 25000)} downloads</span><span class="d">${esc(it.d)}</span><button type="button" class="dl${got ? ' got' : ''}" data-k="${kind}" data-id="${id}">${got ? 'INSTALLED! (get it again)' : 'CLICK HERE TO DOWNLOAD'}</button></div>`;
  }
  function ddPage(path) {
    const T = B.THEMES;
    if (path === '/wallpapers.html') return ddShell(path, `<h2>FREE WALLPAPERS!!!</h2><p>Click DOWNLOAD and the picture goes straight onto your desktop. They also turn up in <b>Control Panel &gt; Display &gt; Background</b>. All drawn by hand (by mouse).</p><div class="grid">${Object.keys(B.WALLS).map(id => ddCard('wall', id)).join('')}</div>${adHtml(0)}`);
    if (path === '/cursors.html') return ddShell(path, `<h2>FREE ANIMATED CURSORS!!!</h2><p>Real .ANI animated cursors! Your mouse pointer will MOVE all by itself. Change back any time in <b>Control Panel &gt; Mouse &gt; Pointers</b> (click <i>Use Default</i>).</p><div class="grid">${Object.keys(B.CURS).map(id => ddCard('cur', id)).join('')}</div>${adHtml(1)}`);
    if (path === '/savers.html') return ddShell(path, `<h2>FREE SCREEN SAVERS!!!</h2><p>Stop your monitor getting things burnt into it, in STYLE. They join the list in <b>Control Panel &gt; Display &gt; Screen Saver</b>.</p><div class="grid">${Object.keys(B.SAVERS).map(id => ddCard('saver', id)).join('')}</div>${adHtml(2)}`);
    if (path === '/fonts.html') return ddShell(path, `<h2>FREE FONTS!!!</h2><p>Real TrueType fonts! Once they're installed they're in <b>C:\\JACKOS\\FONTS</b> and in <b>WordPod</b>'s font list. Make posters! Make birthday cards! Write your homework in Wingdingz (do NOT do this).</p><div class="grid">${Object.keys(B.FONTS).map(id => ddCard('font', id)).join('')}</div><p style="font-family:'bdlp-ding',Arial;font-size:22px;text-align:center;margin:14px 0 2px">dazzle dan</p><p class="sm" style="text-align:center;font-size:11px">(^ that says something. Can you work it out?)</p>`);
    if (path === '/themes.html') return ddShell(path, `<h2>DESKTOP THEMES!!!</h2><p>A theme changes EVERYTHING at once: wallpaper, window colours, mouse pointer, sounds, icons AND screen saver. Like the Plus! pack, but FREE. These are big downloads, so they come with a proper setup program.</p><div class="grid">${Object.keys(T).map(k => { const t = T[k], got = window.Setup && Setup.has(t.pid); return `<div class="card"><div class="th"><img class="wp" src="${svgData(ART.WALLS[t.wall]())}" alt=""><img src="${svgData(ART.cursorFrames(t.cur)[0].svg)}" alt="" style="position:absolute;right:6px;bottom:6px;width:32px;height:32px"></div><b>${esc(t.n)}</b><span class="sm">${kbStr(t.kb)} &middot; ${cnt('bdl.th.' + k, 900, 30000)} downloads</span><span class="d">${esc(t.d)}</span><button type="button" class="dl${got ? ' got' : ''}" data-theme="${k}">${got ? 'INSTALLED! (switch to it)' : 'DOWNLOAD THEME'}</button></div>`; }).join('')}</div><p>Already got some? <a data-act="themes">Open Desktop Dazzle Themes</a> to switch between them.</p>`);
    if (path === '/smileys.html') { const got = window.Setup && Setup.has('bdl.smileys'); return ddShell(path, `<h2>FREE SMILEYZ!!! :-) ;-) :-D</h2><p>Make your e-mails 1000% more fun!!! FREE SMILEYZ adds a <b>smiley bar</b> to JackMail Express. Click a smiley and it goes in your message!</p><div class="box" style="font:bold 22px 'Courier New',monospace;text-align:center;color:#ff0">${B.SMILEYS.map(s => esc(s[0])).join(' &nbsp; ')}</div><p style="text-align:center"><button type="button" class="dl${got ? ' got' : ''}" data-prod="bdl.smileys" style="max-width:320px;margin:0 auto;font-size:15px">${got ? 'INSTALLED! :-)' : 'DOWNLOAD FREE SMILEYZ!!! (640 KB)'}</button></p><p class="sm" style="font-size:11px;color:#ccc">FREE SMILEYZ is supported by adverts. It adds a teeny tiny message to the bottom of your e-mails. Teeny. Tiny. You won't even notice it. Everyone else will.</p>`); }
    if (path === '/plugins.html') return ddShell(path, `<h2>THE PLUG-IN ZONE</h2><p>See a <b>broken puzzle piece</b> on a web page? You need a plug-in! Here are the ones every cool site uses:</p>${Object.entries(B.PLUGS).map(([k, P]) => { const p = window.Setup && Setup.get(P.pid), got = B.plugOK(k); return `<div class="box"><h3>${esc(P.full)}</h3><p style="margin:0 0 6px">${esc(p ? p.d : '')}</p><p style="margin:0 0 6px">Try it on: ${k === 'shock' ? `<a href="http://www.jacktoonz.toonz/">JackToonz</a> &middot; <a href="${DDU}intro.html">our intro!</a>` : k === 'jtime' ? '<a href="http://www.trailerpark.flick/">The Trailer Park</a>' : '<a href="http://www.radiojack.wubwub/">Radio Jack 99.9</a>'}</p><button type="button" class="dl${got ? ' got' : ''}" data-prod="${P.pid}" style="max-width:300px">${got ? 'INSTALLED!' : 'GET ' + esc(P.full.toUpperCase()) + ' (' + kbStr(p ? p.kb : 1000) + ')'}</button></div>`; }).join('')}<p class="sm" style="font-size:11px">Don't want a plug-in any more? Control Panel &gt; Add/Remove Programs. (Then watch the puzzle pieces come back.)</p>`);
    if (path === '/intro.html') return `<div style="text-align:center;padding:10px"><p style="color:#ff0;font:bold 14px Verdana,sans-serif;margin:0 0 6px">LOADING THE DESKTOP DAZZLE EXPERIENCE...</p>${slot('shock', 'intro', 480, 300)}<p style="font-size:11px;color:#aaa">Intro not working? Get <a href="${DDU}plugins.html">ShockJack</a>, or <a href="${DDU}">enter the boring version</a>.</p></div>`;
    if (path === '/about.html') return ddShell(path, `<h2>ABOUT ME!!!</h2><div class="box"><p style="margin:0 0 6px">Hi, I'm <b>DazzleDan</b>! I started Desktop Dazzle in my bedroom in January because the wallpapers that came with the computer were BORING. Now I've got about a hundred visitors a day (my Mom says 40 of them are me).</p><p style="margin:0 0 6px"><b>Things I like:</b> Paint, MIDI files, space, Pocket Critters (my mate Jack got me into them), and the colour purple.</p><p style="margin:0 0 6px"><b>Things I don't like:</b> people who steal my graphics without asking. Just ASK!!! (The answer is yes.)</p><p style="margin:0">E-mail: dazzledan@jackmail.jnet (I read every e-mail!!!)</p></div><p>This site is made with Jotpad and a LOT of patience. If you have a wallpaper you made, send it in and I'll put it up with your name on it!</p><p>You are visitor number ${digits(31337)} <span class="sm">(<span data-hits>since January</span>)</span></p>`);
    // home
    return ddShell('/', `<h2>WELCOME TO THE DAZZLIEST SITE ON THE WEB!!!</h2><p>Is your desktop <b>boring</b>? Teal again? Same old arrow? Then you have come to the RIGHT PLACE!!! Everything here is <span class="blink" style="color:#ff0">100% FREE</span> and goes straight onto your computer. No catches! (Some catches.)</p>
<div class="grid">${[['/wallpapers.html', 'WALLPAPERS', 'space', Object.keys(B.WALLS).length], ['/themes.html', 'DESKTOP THEMES', 'waaagh', Object.keys(B.THEMES).length], ['/cursors.html', 'ANIMATED CURSORS', 'cube', Object.keys(B.CURS).length], ['/savers.html', 'SCREEN SAVERS', 'cybergrid', Object.keys(B.SAVERS).length], ['/fonts.html', 'FONTS', 'blocks', Object.keys(B.FONTS).length], ['/smileys.html', 'SMILEYZ', 'sunset', B.SMILEYS.length]].map(([p, l, w, n]) => `<div class="card"><div class="th"><img class="wp" src="${svgData(ART.WALLS[w]())}" alt=""></div><b>${l}</b><span class="sm">${n} to choose from!</span><a class="dl" href="${DDU}${p.slice(1)}" style="text-decoration:none">GO &gt;&gt;</a></div>`).join('')}</div>
${adHtml(1)}
<div class="box"><h3>WHAT'S NEW</h3><p style="margin:0">&#9733; <b>Desktop Themes!</b> Scrapyard Robots, Outer Space Deluxe, Underwater Adventure and Mystery 1999. <span class="new">NEW!</span><br>&#9733; <b>Fonts</b> you can actually use in WordPod. <span class="new">NEW!</span><br>&#9733; Our very own <a href="${DDU}intro.html">ShockJack intro</a> (it took me a week)<br>&#9733; Joined <a href="${FPU}">The Annoying Ring</a>. Dunno why they let me in, my site isn't annoying at all.</p></div>
<p style="text-align:center">You are visitor number <span data-hits>${digits(31337)}</span></p>`);
  }
  function ddWire(el, path, ctx) {
    el.addEventListener('click', ev => {
      const b = ev.target.closest('button.dl[data-k]'); if (b) { B.download(b.dataset.k, b.dataset.id); return; }
      const th = ev.target.closest('button.dl[data-theme]'); if (th) { const t = B.THEMES[th.dataset.theme]; if (Setup.has(t.pid)) A.open('bdl.theme', th.dataset.theme); else Setup.download(t.pid); return; }
      const pr = ev.target.closest('button.dl[data-prod]'); if (pr) { if (Setup.has(pr.dataset.prod)) Setup.launch(pr.dataset.prod); else Setup.download(pr.dataset.prod); return; }
      if (ev.target.closest('[data-act=themes]')) { B.themeWindow(); return; }
      const ad = ev.target.closest('[data-ad]'); if (ad) { const i = +ad.dataset.ad; if (i === 2) B.openSite(DDU + 'smileys.html'); else msg('JackNet Explorer', i === 0 ? 'You did not win a free computer.\n\nThat was an advert. Adverts always say that. Nobody has ever won a free computer from a banner. Not once. Not even Dave.' : 'You splatted the alien!\n\nYou won... nothing. The alien is fine. He says "blorp".', 'info'); }
    });
    // installed state changes while you're looking
    const upd = () => { qsa(el, 'button.dl[data-k]').forEach(b => { const got = B.has(b.dataset.k, b.dataset.id); b.classList.toggle('got', got); b.textContent = got ? 'INSTALLED! (get it again)' : 'CLICK HERE TO DOWNLOAD'; }); };
    ctx.on(document, 'bdl-installed', upd);
    // animated thumbnails: cursors spin, screen savers play (only the ones you can see), fonts preview under a private name
    const curs = qsa(el, 'img[data-cur]');
    if (curs.length) { const fr = {}; curs.forEach(i => { fr[i.dataset.cur] = ART.cursorFrames(i.dataset.cur).map(f => svgData(f.svg)); }); let n = 0; ctx.every(() => { n++; curs.forEach(i => { const f = fr[i.dataset.cur]; i.src = f[n % f.length]; }); }, 140); }
    qsa(el, 'canvas[data-saver]').forEach(cv => { const stop = B.runSaver(cv, cv.dataset.saver, false); ctx.onStop(stop); });
    if (path === '/fonts.html') Object.keys(B.FONTS).forEach(id => { const fam = 'bdlp-' + id; if ([...document.fonts].some(f => f.family === fam || f.family === '"' + fam + '"')) return; try { const ff = new FontFace(fam, ART.FONTS[id]()); document.fonts.add(ff); ff.load().catch(() => {}); } catch (e) {} });
    counters(el);
    if (path === '/' || path === '/about.html') { try { Net.kv.inc('bdl.hits'); } catch (e) {} ctx.later(() => { if (!window.Net || !Net.kv) return; Net.kv.get(['bdl.hits']).then(v => { const n = 31337 + ((v && v['bdl.hits']) || 0); qsa(el, '[data-hits]').forEach(s => { s.innerHTML = digits(n); }); }); }, 400); }
  }

  // ================================================================ the plug-in sites
  function toonPage(path) {
    if (path === '/3d.html') return `<h1>3D LOGO ZONE</h1><p style="text-align:center">Our logo, in <b>REAL 3D</b>!!! It took Jackromedia ShockJack 7 and three weeks. Look at it go!</p>${slot('shock', 'logo3d', 400, 250)}<p style="text-align:center"><a href="http://www.jacktoonz.toonz/">&lt;&lt; Back to the cartoons</a></p>`;
    return `<h1>JACKTOONZ!</h1><p style="text-align:center;font:bold 14px 'Comic Sans MS','Comic Neue',cursive">Cartoons on the Internet!!! No telly needed!!!</p>
<h3 style="text-align:center;margin:10px 0 0">EPISODE 1: CRITTER CATCHER</h3>${slot('shock', 'toon', 400, 270)}
<p style="text-align:center">Gubbinz wants to catch a Blobbit for his collection. The Blobbit has other ideas. 22 seconds of pure ShockJack action!</p>
<p style="text-align:center"><b>Coming soon:</b> Episode 2: Critter Catcher II: Gotta Bounce. &nbsp; <a href="http://www.jacktoonz.toonz/3d.html">See our 3D logo!!!</a></p>
<p style="text-align:center;font-size:11px">Cartoons need the free <a href="${DDU}plugins.html">ShockJack plug-in</a>. JackToonz is not on the telly. Yet.</p>`;
  }
  function trailPage(path) {
    const T = { '/robogrot.html': ['robogrot', 'ROBOKID', 'One boy. Two robot legs. No idea what he is doing. Coming Christmas 1999.'], '/squig50.html': ['squig50', 'ATTACK OF THE 50 FT BLOB', 'The classic monster movie, remastered in black and white (they lost the colour). Back in cinemas this autumn.'] }[path];
    if (T) return `<h1>THE TRAILER PARK</h1><h2 style="text-align:center;color:#fff;margin:4px 0">${T[1]}</h2>${slot('jtime', T[0], 420, 270)}<p style="text-align:center">${T[2]}</p><p style="text-align:center"><a href="http://www.trailerpark.flick/">&lt;&lt; All trailers</a></p>`;
    return `<h1>THE TRAILER PARK</h1><p style="text-align:center;font-style:italic">Movie trailers. On the Internet. In a window the size of a stamp. The future is NOW.</p>
<table style="margin:10px auto;border-collapse:collapse;max-width:520px;width:100%"><tr><td style="border:1px solid #555;padding:8px"><b style="color:#e8c860">ROBOKID</b><br>One boy. Two robot legs. Christmas 1999.<br><a href="http://www.trailerpark.flick/robogrot.html">&#9654; Watch the trailer</a> (2.1 MB)</td></tr><tr><td style="border:1px solid #555;padding:8px"><b style="color:#e8c860">ATTACK OF THE 50 FT BLOB</b><br>They laughed at his wobble. Now he is 50 feet tall.<br><a href="http://www.trailerpark.flick/squig50.html">&#9654; Watch the trailer</a> (1.8 MB)</td></tr></table>
<p style="text-align:center;font-size:11px">All trailers need <a href="${DDU}plugins.html">JackTime 4</a>. Trailers may take a while to load on a 56K modem. Make a cup of tea. Make two.</p>`;
  }
  const radioPage = () => `<h1>RADIO JACK 99.9</h1><p style="text-align:center">LIVE on the Internet!!! The only radio station run entirely by one boy and his cat.</p>${slot('rsquig', 'radio', 420, 160)}
<table style="margin:10px auto;border-collapse:collapse;max-width:420px;width:100%;font-size:12px"><tr><td colspan="2" style="color:#ff0;padding:4px;border-bottom:1px solid #0aa"><b>TODAY'S SCHEDULE</b></td></tr>${[['07:00', 'Breakfast with Gubbinz'], ['10:00', 'The Video Game Music Hour'], ['13:00', 'Top 40 Chart Countdown'], ['16:00', 'Homework Help (it\'s just shouting)'], ['19:00', 'The Shipping Forecast (read very loudly)'], ['22:00', 'Late Night Modem Noises']].map(([a, b]) => `<tr><td style="padding:3px 6px;color:#0ff">${a}</td><td style="padding:3px">${b}</td></tr>`).join('')}</table>
<p style="text-align:center;font-size:11px">Listen live with <a href="${DDU}plugins.html" style="color:#0ff">RealJack Player G2</a>. 8 kHz mono. Best enjoyed with headphones and low expectations.</p>`;

  // ================================================================ The Annoying Ring (www.freepagez.w3b)
  const RING = [['kev', "Kev's Kool Graphix", 'Original graphics. Right-click is DISABLED to protect them.'], ['shazza', "Shazza's Pony Palace", 'Ponies! And a song that plays all by itself!'], ['dean', "Dean's Disaster Zone", 'Disasters and EARTHQUAKES. Hold on to your mouse.'], ['gaz', "Gaz's MEGA Page", 'Best viewed in 1024x768. It will check.'], ['kyle', "Kyle's Korner", 'A small page. In a small window. In the corner.'], ['freestuff', 'FREE STUFF ZONE!!!', 'Free stuff! Pop-ups! More pop-ups!'], ['billy', "Billy's Page", 'Please visit. Please don\'t leave.'], ['sparkle', '~*~ SpArKlE ZoNe ~*~', 'Sparkles follow your mouse. It snows. Always.']];
  const ringUrl = k => FPU + '~' + k + '/';
  function ringNav(k) {
    const i = RING.findIndex(r => r[0] === k), n = RING.length, prev = RING[(i + n - 1) % n][0], next = RING[(i + 1) % n][0];
    let rnd = RING[Math.floor(Math.random() * n)][0]; if (rnd === k) rnd = next;
    return `<div class="ring"><b>~ The Annoying Ring ~</b>This site is member #${i + 1} of ${n}<br><a href="${ringUrl(prev)}">&lt;&lt; Prev</a> | <a href="${ringUrl(rnd)}">Random</a> | <a href="${FPU}">List Sites</a> | <a href="${ringUrl(next)}">Next &gt;&gt;</a></div>`;
  }
  const PONY = '<svg viewBox="0 0 120 100" width="150" height="125"><path d="M30 60q-6-30 20-36l10-14 4 12q20 2 22 20l18 4-6 8-14-2q-2 16-14 20v20h-8V76H44v16h-8V74q-8-4-6-14z" fill="#fff" stroke="#c06" stroke-width="2"/><path d="M50 24q-10 4-14 18 8-8 16-10 0 10 8 14-4-10 0-18z" fill="#f6c" stroke="#c06"/><circle cx="72" cy="36" r="3"/><path d="M28 60q-14 6-10 24 6-10 12-12z" fill="#f6c" stroke="#c06"/><path d="M60 8l-2-8 6 6" stroke="#fc0" stroke-width="3"/></svg>';
  const GLOBE = '<svg viewBox="0 0 64 64" width="100" height="100"><circle cx="32" cy="32" r="28" fill="#2a7ad8" stroke="#0f0" stroke-width="2"/><path d="M14 22q10 4 14 0t10 6-4 12-12 4-6-8zM40 14q8 2 12 10-6 2-10-2zM44 40q6-2 8 4-4 8-10 8 2-6 2-12z" fill="#2a2"><animateTransform attributeName="transform" type="translate" values="-10 0;10 0;-10 0" dur="4s" repeatCount="indefinite"/></path></svg>';
  const MAILG = '<svg viewBox="0 0 64 48" width="100" height="75"><rect x="4" y="8" width="56" height="34" fill="#fff" stroke="#0f0" stroke-width="2"/><path d="M4 8l28 20 28-20" fill="none" stroke="#0f0" stroke-width="2"/><path d="M50 2l4 8 8-2-6 6" stroke="#ff0" stroke-width="2" fill="none"><animate attributeName="opacity" values="1;0;1" dur=".6s" repeatCount="indefinite"/></path></svg>';
  const DIGGER = '<svg viewBox="0 0 80 50" width="110" height="70"><rect x="10" y="20" width="34" height="18" fill="#fc0" stroke="#000"/><rect x="28" y="8" width="16" height="14" fill="#fc0" stroke="#000"/><circle cx="18" cy="42" r="6"/><circle cx="38" cy="42" r="6"/><path d="M44 24l20-10 8 16" stroke="#000" stroke-width="4" fill="none"><animateTransform attributeName="transform" type="rotate" values="0 44 24;-12 44 24;0 44 24" dur="1s" repeatCount="indefinite"/></path></svg>';
  function ringPage(path) {
    if (path === '/') return `<div class="bw bw-hub"><h1>~ THE ANNOYING RING ~</h1><p style="text-align:center"><i>The Internet's most annoying homepages, all in one handy ring!</i></p>
<table><tr><td><b>#</b></td><td><b>Site</b></td><td><b>What it does</b></td></tr>${RING.map(([k, n, d], i) => `<tr><td>${i + 1}</td><td><a href="${ringUrl(k)}">${esc(n)}</a></td><td>${esc(d)}</td></tr>`).join('')}</table>
<p style="text-align:center;max-width:560px;margin:10px auto"><b>Want to join?</b> Your homepage must contain at least ONE annoying JavaScript. Pop-ups, MIDI music, scrolling text, disabled right-click, window shaking... the more the better! E-mail the Ringmaster at ringmaster@freepagez.w3b.</p>
<p style="text-align:center;font-size:11px">Free homepages at FreePagez! 2 MB of space, FREE! (Adverts may appear on your page. Adverts WILL appear on your page.)</p></div>`;
    const k = (path.match(/^\/~([a-z]+)\/$/) || [])[1];
    const R = { kev: () => `<div class="bw bw-kev"><!-- Kev's page. If you can read this you used View Source. My right-click protection has been DEFEATED. Respect. -->
<div class="flame"></div><h1>KEV'S KOOL GRAPHIX</h1><p style="color:#ff0">ALL GRAPHICS ON THIS PAGE ARE (C) KEV 1999. DO NOT STEAL!!!</p><p>Right-click is <b style="color:#f00">DISABLED</b> to protect my work. Go on, try it.</p>
<div class="gfx"><figure>${GLOBE}<figcaption>Spinning Globe (took 3 hours)</figcaption></figure><figure>${MAILG}<figcaption>E-mail Me (animated!)</figcaption></figure><figure>${DIGGER}<figcaption>Under Construction</figcaption></figure></div>
<p>Look at the bottom of the window ↓ my status bar talks!!!</p><div class="flame"></div>${ringNav('kev')}</div>`,
      shazza: () => `<div class="bw bw-shaz"><h1>~*~ Shazza's Pony Palace ~*~</h1><p>${PONY}${PONY.replace('width="150"', 'width="110"')}</p><p>Welcome to my page about PONIES!!! I have not got a pony. Mom says maybe when I'm older. I have got a hamster called Sparkle.</p><p><b>Do you like my song?</b> It plays all by itself!!! It's in the corner by the clock. Look up at the title bar too, it moves!!!</p><p><b>My favourite ponies:</b><br>1. White ones<br>2. Brown ones<br>3. All the others</p>${ringNav('shazza')}</div>`,
      dean: () => `<div class="bw bw-dean"><div class="crack"></div><h1>DEAN'S DISASTER ZONE</h1><p>Volcanoes! Tornadoes! Meteors! And best of all... <b>EARTHQUAKES!!!</b></p><p>This page has a REAL earthquake in it. I got the JavaScript off a disk from my cousin. Hold on to your mouse!!!</p><p><button type="button" class="quake">SHAKE IT AGAIN!!!</button></p><p class="qn" style="font-size:12px">Earthquakes survived: 0</p><p><b>Disaster fact:</b> the biggest earthquake ever was a magnitude 9.5. Mine is at least a 10.</p><div class="crack"></div>${ringNav('dean')}</div>`,
      gaz: () => `<div class="bw bw-gaz"><h1>GAZ'S MEGA PAGE</h1><p>THE MEGAEST PAGE ON THE WHOLE WORLD WIDE WEB</p><div class="res">Checking your screen...</div><p>This site is designed for <b>1024 x 768</b> in <b>True Colour</b> with <b>JackNet Explorer 5</b> and a <b>17 inch monitor</b>. If it looks weird, it's YOUR fault, not mine.</p><p><button type="button" class="btn gfix">Make my window the right size</button></p><p style="font-size:11px">Also watch the status bar at the bottom. It's MEGA.</p>${ringNav('gaz')}</div>`,
      kyle: () => `<div class="bw bw-kyle"><h1>Kyle's Korner</h1><p>Hello. This is my page. It is quite small, so I made your window small too and put it in the corner. That's where my bedroom is (the corner of the house).</p><p>Things in my corner: a bean bag, a lamp, a Game Lad.</p><p><button type="button" class="btn kback">Put my window back</button></p>${ringNav('kyle')}</div>`,
      freestuff: () => `<div class="bw bw-free"><h1>FREE STUFF ZONE!!!</h1><p><span class="burst">FREE!!!</span></p><p style="font:bold 16px Arial,sans-serif">FREE STUFF!!! FREE MONEY!!! FREE PONIES!!! (No actual free stuff, money or ponies.)</p><p>Close the pop-ups to see the free stuff!!! (There is no free stuff.)</p><p><button type="button" class="btn fmore">I want MORE pop-ups</button></p>${ringNav('freestuff')}</div>`,
      billy: () => `<div class="bw bw-billy"><h1>Billy's Page</h1><p class="byay" style="font-weight:bold;color:#c00"></p><p><svg viewBox="0 0 60 60" width="80" height="80"><circle cx="30" cy="30" r="26" fill="#ffd400" stroke="#000" stroke-width="2"/><circle cx="21" cy="24" r="3"/><circle cx="39" cy="24" r="3"/><path d="M18 44q12-10 24 0" stroke="#000" stroke-width="3" fill="none"/><path d="M20 30q-2 6 0 8" stroke="#3af" stroke-width="3"/></svg></p><p>Hi! Thanks for visiting my page!!! You're my first visitor this week. Please stay. There's loads to do here.</p><p>Things to do on my page:<br>- read this<br>- read it again<br>- stay</p><p>Please don't go. I'll know.</p>${ringNav('billy')}</div>`,
      sparkle: () => `<div class="bw bw-spk"><h1>~*~ SpArKlE ZoNe ~*~</h1><p>wElCoMe 2 mY pAgE!!! mOvE uR mOuSe 4 sPaRkLeS!!! ${B.touchy() ? '(oR cLiCk!!!)' : ''}</p><p>It is ALWAYS snowing on my page. Even in summer. That's the magic of JavaScript.</p><p style="font-size:22px;color:#ff0">&#9733; &#9734; &#9733; &#9734; &#9733;</p><p>~*~ I luv glitter, my cat, and sparkly gel pens ~*~</p>${ringNav('sparkle')}</div>`,
    };
    return R[k] ? R[k]() : `<div class="bw bw-hub"><h1>404</h1><p>This member left the ring. (They took their annoying JavaScript with them.)</p></div>`;
  }

  // ================================================================ render + enter + leave
  function render(host, path) {
    let el;
    if (host === DD) { el = h(path === '/intro.html' ? ddPage(path) : ddPage(path), 'bw bw-dd'); }
    else if (host === 'www.jacktoonz.toonz') el = h(toonPage(path), 'bw bw-toon');
    else if (host === 'www.trailerpark.flick') el = h(trailPage(path), 'bw bw-trail');
    else if (host === 'www.radiojack.wubwub') el = h(radioPage(path), 'bw bw-radio');
    else { el = h(ringPage(path.replace(/^(\/~[a-z]+)$/, '$1/'))); el = el.firstElementChild || el; }
    el.dataset.bdlHost = host; el.dataset.bdlPath = path;
    return el;
  }
  // the browser window, its title bar and status bar
  const BR = () => $('browser');
  const canMove = () => !document.body.classList.contains('maxed') && DesktopSurface.width() > 760;
  const getGeom = () => { const r = BR().getBoundingClientRect(), d = $('desktop') ? $('desktop').getBoundingClientRect().top : 0; return { l: Math.round(r.left), t: Math.round(r.top - d), w: Math.round(r.width), h: Math.round(r.height) }; };
  function setGeom(g) {
    const br = BR(); br.style.transition = 'left .45s,top .45s,width .45s,height .45s';
    if (g) store.set('jhp_win', g); else { try { localStorage.removeItem('jhp_win'); } catch (e) {} }
    dispatchEvent(new Event('resize'));
    setTimeout(() => { br.style.transition = ''; dispatchEvent(new Event('resize')); }, 600);
  }
  function statusScroll(ctx, text) {
    const s = $('brStatus'); if (!s) return; let i = 0; const pad = ' '.repeat(40) + text + ' ';
    ctx.later(() => ctx.every(() => { i = (i + 1) % pad.length; s.textContent = (pad.slice(i) + pad.slice(0, i)).slice(0, 120); }, 110), 1300);
  }
  function titleScroll(ctx, text) {
    const t = text + '   ~*~   '; let i = 0;
    ctx.later(() => ctx.every(() => { i = (i + 1) % t.length; const s = t.slice(i) + t.slice(0, i); $('winTitle').textContent = s + ' - JackNet Explorer'; $('taskBrowser').textContent = s; document.title = s; }, 200), 900);
  }
  function quake(n) {
    const br = BR(); if (!br || br.classList.contains('min')) return;
    const kf = []; for (let i = 0; i < 24; i++) { const a = (1 - i / 24) * (n || 14); kf.push({ transform: `translate(${Math.round((Math.random() - 0.5) * 2 * a)}px,${Math.round((Math.random() - 0.5) * 2 * a)}px)` }); }
    kf.push({ transform: 'translate(0,0)' });
    try { br.animate(kf, { duration: 1300, easing: 'linear' }); } catch (e) {}
    qsa(document, '.appwin').forEach(w => { if (w.style.display !== 'none') try { w.animate(kf.map(k => ({ transform: k.transform.replace(/(-?\d+)px/g, (m, v) => Math.round(v * 0.6) + 'px') })), { duration: 1300 }); } catch (e) {} });
    sfx('thud');
  }
  const ringSeen = k => { S().seen['ring:' + k] = 1; B.save(); if (RING.every(r => S().seen['ring:' + r[0]])) B.secret('ring'); };
  const S = () => B.S;
  let billyStays = 0, billyBack = false, billyDone = false, rclicks = 0, kyleWas = null;

  function enter(page) {
    if (PAGE) { PAGE.ctx.stop(); }
    const el = qs(document, '#s-secret [data-bdl-host]');
    const ctx = Ctx();
    PAGE = { host: page.host, path: page.path, ctx, el: el || document.createElement('div') };
    if (!el) return;
    mountSlots(el, ctx);
    if (page.host === DD) ddWire(el, page.path, ctx);
    if (page.host !== FP) return;
    const k = (page.path.match(/^\/~([a-z]+)\/$/) || [])[1];
    if (!k) return;
    ringSeen(k);
    if (k === 'kev') {
      statusScroll(ctx, "*** Welcome to Kev's Kool Graphix!!! *** All graphics (c) Kev 1999 *** Do NOT steal my graphics *** Right-click is DISABLED *** Sign my guestbook (when I make one) *** You are visitor number 00000017 ***");
      const block = ev => {
        if (!ev.target.closest || !ev.target.closest('#s-secret')) return;
        ev.preventDefault(); ev.stopImmediatePropagation(); rclicks++;
        const T = ['Right-click is DISABLED!!!\n\nAll graphics on this page are (c) Kev 1999. Do NOT steal my graphics!!!', 'I SAID right-click is DISABLED!!!\n\nThese graphics took me AGES in Paint.', 'STOP IT!!!\n\nI can see you doing that, you know. (I can\'t really.)', 'OK fine.\n\nIf you REALLY want my graphics you can just ask. Or use View > Source. Don\'t tell anyone I told you.'];
        msg('JackNet Explorer', T[Math.min(rclicks, T.length) - 1], 'warn');
        if (rclicks === 4) B.secret('rclick');
      };
      ctx.on(window, 'contextmenu', block, true);
    } else if (k === 'shazza') {
      titleScroll(ctx, "Shazza's Pony Palace!!! I LUV PONIES!!!");
      ctx.later(() => B.midi.play('bdl-pony', 'pony_song'), 1100);
      ctx.onStop(() => B.midi.stop());
    } else if (k === 'dean') {
      let n = 0; const qn = qs(el, '.qn');
      const go = () => { quake(16); n++; if (qn) qn.textContent = 'Earthquakes survived: ' + n; $('brStatus').textContent = 'EARTHQUAKE!!! Magnitude ' + (8 + Math.random() * 2).toFixed(1) + '!!!'; if (n === 3) { B.secret('quake'); toast("Dean's Disaster Zone", 'You survived THREE earthquakes! Dean says you can have a certificate. He has not made it yet.', 4500); } };
      ctx.later(go, 900);
      const b = qs(el, '.quake'); if (b) b.addEventListener('click', go);
    } else if (k === 'gaz') {
      statusScroll(ctx, '>>> GAZ\'S MEGA PAGE <<< THE BEST PAGE IN THE UNIVERSE <<< BEST VIEWED IN 1024x768 <<< GET A BIGGER MONITOR <<< MEGA MEGA MEGA <<<');
      const r = BR().getBoundingClientRect(), w = Math.round(r.width), hh = Math.round(r.height), res = qs(el, '.res');
      if (res) res.innerHTML = `Your window is <b>${w} x ${hh}</b>.<br>This site is best viewed in <b>1024 x 768</b>!!!`;
      const fix = () => {
        if (!canMove()) return msg('JackNet Explorer', DesktopSurface.width() <= 760 ? `Your whole screen is only ${DesktopSurface.width()} x ${DesktopSurface.height()}!\n\nJackNet Explorer can't make the window bigger than the screen. Get a bigger screen. (Mom says no.)` : 'The window is maximised, so it can\'t be resized. Click the Restore button at the top right first.', 'info');
        setGeom({ l: Math.max(0, Math.round((DesktopSurface.width() - 1024) / 2)), t: 0, w: Math.min(1024, DesktopSurface.width() - 20), h: Math.min(768, DesktopSurface.height() - 52) });
        toast("Gaz's MEGA Page", 'window.resizeTo(1024, 768)... MEGA!', 3000);
      };
      if (Math.abs(w - 1024) > 8 || Math.abs(hh - 768) > 8) ctx.later(() => msg('JackNet Explorer', `Your window is ${w} x ${hh}.\n\nThis site is best viewed in 1024 x 768!!! Shall I fix it for you?`, 'q', [['OK', fix], ['Cancel', () => toast("Gaz's MEGA Page", 'Fine. Enjoy the page looking WRONG.', 3000)]]), 1200);
      const b = qs(el, '.gfix'); if (b) b.addEventListener('click', fix);
    } else if (k === 'kyle') {
      const back = () => { if (!kyleWas) return; const k2 = kyleWas; kyleWas = null; if (k2.maxed && !document.body.classList.contains('maxed')) $('brMax').click(); else setGeom(k2.geom); };
      ctx.later(() => {
        if (DesktopSurface.width() <= 760) {
          const br = BR(); try { br.animate([{ transform: 'none' }, { transform: 'translate(-30%,-30%) scale(.4)', offset: 0.25 }, { transform: 'translate(-30%,-30%) scale(.4)', offset: 0.8 }, { transform: 'none' }], { duration: 3000, easing: 'ease-in-out' }); } catch (e) {}
          ctx.later(() => toast("Kyle's Korner", 'window.moveTo(0,0)... but your screen is too small for corners. Phew!', 3500), 3000);
          return;
        }
        kyleWas = { geom: store.get('jhp_win', null), maxed: document.body.classList.contains('maxed') };
        if (kyleWas.maxed) $('brMax').click();
        setGeom({ l: 0, t: 0, w: 640, h: 480 });
        $('brStatus').textContent = 'window.moveTo(0, 0); window.resizeTo(640, 480);';
      }, 700);
      const b = qs(el, '.kback'); if (b) b.addEventListener('click', back);
      ctx.onStop(back);
    } else if (k === 'freestuff') {
      statusScroll(ctx, '$$$ FREE STUFF $$$ CLICK HERE $$$ YOU HAVE WON $$$ (YOU HAVE NOT WON) $$$ FREE STUFF $$$');
      popChain(ctx, 0);
      const b = qs(el, '.fmore'); if (b) b.addEventListener('click', () => popChain(ctx, 0, true));
    } else if (k === 'billy') {
      const y = qs(el, '.byay'); if (y && billyBack) { y.textContent = billyStays >= 3 ? 'YAY!!! You stayed AGAIN!!! You are my best friend now.' : 'YAY!!! You stayed!!! :-D'; }
      billyBack = false;
    } else if (k === 'sparkle') {
      titleScroll(ctx, '~*~ SpArKlE ZoNe ~*~ wElCoMe!!!');
      for (let i = 0; i < 26; i++) { const f = h(['&#10052;', '*', '&#10053;'][i % 3], 'flake', 'span'); f.style.left = (i * 37 % 100) + '%'; f.style.animationDuration = (5 + (i * 7 % 6)) + 's'; f.style.animationDelay = (-(i * 0.7)) + 's'; el.appendChild(f); }
      let lastS = 0;
      const spark = ev => {
        if (!ev.target.closest || !ev.target.closest('#s-secret')) return;
        const now = Date.now(); if (now - lastS < 40) return; lastS = now;
        const s = h('<svg viewBox="0 0 12 12"><path d="M6 0l1.5 4.5L12 6 7.5 7.5 6 12 4.5 7.5 0 6l4.5-1.5z" fill="hsl(' + (now / 5 % 360) + ',100%,70%)"/></svg>', 'bdl-sparkle');
        const p = DesktopSurface.point(ev.clientX, ev.clientY);
        s.style.left = (p.x - 6 + (Math.random() - 0.5) * 10) + 'px'; s.style.top = (p.y - 6) + 'px'; DesktopSurface.root().appendChild(s); setTimeout(() => s.remove(), 950);
      };
      ctx.on(document, 'pointermove', spark, { passive: true }); ctx.on(document, 'pointerdown', spark, { passive: true });
    }
  }
  // the pop-up chain: every pop-up you close opens the next one, until the last
  const POPS = [
    ['CONGRATULATIONS!!!', '<div style="text-align:center;padding:10px;background:#ff0;color:#c00;font:bold 16px Arial,sans-serif">YOU ARE THE 1,000,000th VISITOR!!!<br><button type="button" class="btn pp" style="margin-top:8px">CLAIM YOUR PRIZE</button></div>', 'Your prize is... this pop-up! Enjoy it. Close it when you are done enjoying it.'],
    ['WAIT!!! DON\'T GO!!!', '<div style="padding:10px;font:13px Arial,sans-serif">Before you go, why not sign up for the <b>FREE STUFF NEWSLETTER</b>? Every week we e-mail you a list of free stuff! (There is no free stuff.)<br><input type="text" placeholder="your e-mail" style="width:100%;margin-top:6px"></div>', null],
    ['Did you know?', '<div style="padding:10px;font:13px Arial,sans-serif;background:#cfe8ff">9 out of 10 pop-ups are annoying.<br><br>This is the other one. It\'s lovely. Look at it. Lovely.</div>', null],
    ['FREE SCREEN SAVER!!!', '<div style="padding:10px;text-align:center;font:bold 13px Arial,sans-serif;background:#000;color:#0f0">FREE SCREEN SAVER!!!<br><span style="font-weight:normal">(It\'s a picture of this pop-up.)</span></div>', null],
    ['OK OK. Last one.', '<div style="padding:10px;text-align:center;font:13px Arial,sans-serif">You win. No more pop-ups. Here is a cookie for your trouble:<br><svg viewBox="0 0 40 40" width="56" height="56"><circle cx="20" cy="20" r="17" fill="#d9a441" stroke="#7a5a10" stroke-width="2"/><circle cx="13" cy="14" r="2.5" fill="#4a2a0a"/><circle cx="24" cy="12" r="2" fill="#4a2a0a"/><circle cx="26" cy="24" r="2.5" fill="#4a2a0a"/><circle cx="14" cy="26" r="2" fill="#4a2a0a"/></svg><br><i>(It is not a real cookie.)</i></div>', null],
  ];
  let popRun = 0;
  function popChain(ctx, i, again) {
    const run = again ? ++popRun : (i === 0 ? ++popRun : popRun);
    ctx.later(() => {
      if (run !== popRun) return;
      const [t, html, prize] = POPS[i];
      const body = h(`<div class="pbar">${J('jacknet', 16)}<span>http://www.freepagez.w3b/~freestuff/popup${i + 1}.html</span></div><div class="bdl-pbody">${html}</div>`);
      const W = Math.min(300, DesktopSurface.width() - 16), x = Math.max(4, Math.min(DesktopSurface.width() - W - 4, 40 + Math.random() * (DesktopSurface.width() - W - 80))), y = Math.max(4, 30 + Math.random() * Math.max(10, DesktopSurface.height() - 330));
      const last = i === POPS.length - 1;
      A.win(t + ' - JackNet Explorer', body, { w: W, h: 200, cls: 'bdl-pop', noMax: true, x, y, icon: J('jacknet', 16), onClose: () => { if (run !== popRun) return; if (last) { B.secret('popups'); toast('FREE STUFF ZONE!!!', 'You closed EVERY pop-up! Pop-up whacker!', 3500); } else popChain(ctx, i + 1); } });
      sfx('boing');
      const pp = qs(body, '.pp'); if (pp && prize) pp.addEventListener('click', () => msg('CONGRATULATIONS!!!', prize, 'info'));
    }, i === 0 ? 700 : 350);
  }

  function leave(page, next) {
    if (PAGE) { PAGE.ctx.stop(); PAGE = null; }
    if (page.host === FP && page.path === '/~billy/' && !/^site:www\.freepagez\.w3b\/~billy\/?$/.test(next || '')) {
      if (billyDone) return toast("Billy's Page", billyStays >= 3 ? 'Bye, best friend! Come back soon! (Billy waves.)' : 'Billy waves goodbye. :-( Come back soon!', 3000);
      const stay = () => { billyStays++; billyBack = true; if (billyStays === 3) { billyDone = true; B.secret('clingy'); } B.openSite(ringUrl('billy')); };
      const bye = () => { billyDone = true; toast("Billy's Page", 'Billy waves goodbye. :-( Come back soon!', 3500); };
      setTimeout(() => msg('JackNet Explorer', 'Are you sure you want to leave this page?\n\nBilly will be sad. :-(', 'q', [['OK', () => msg('JackNet Explorer', 'Are you REALLY sure??\n\nHe made you a picture.', 'q', [['Yes, leave', bye], ['No, stay', stay]])], ['Cancel', stay]]), 150);
    }
  }

  // ================================================================ the plug-ins on their own (Start > Programs)
  function pluginApp(k) {
    const box = h('', 'bw'); box.style.minHeight = '0'; box.style.padding = '6px';
    const ctx = Ctx();
    const T = { shock: ['About ShockJack Player 7', '<p style="margin:0 0 6px;font:11px Tahoma,sans-serif">ShockJack Player 7.0 &copy; 1999 Jackromedia Inc. Plays ShockJack movies in JackNet Explorer. Sample movie:</p>', 'logo3d', 430],
      jtime: ['JackTime Player', '<p style="margin:0 0 6px;font:11px Tahoma,sans-serif">JackTime 4.0. Choose a movie: <select class="mv"><option value="robogrot">RoboKid (trailer)</option><option value="squig50">Attack of the 50 ft Blob (trailer)</option></select></p>', 'robogrot', 440],
      rsquig: ['RealJack Player G2', '', 'radio', 440] }[k] || ['ShockJack', '', 'logo3d', 430];
    box.innerHTML = T[1] + '<div class="slot"></div>';
    const w = A.win(T[0], box, { w: T[3], icon: J(k === 'rsquig' ? 'radio' : 'media', 16), cls: 'bdl-plugwin', onClose: () => ctx.stop() });
    let sub = null;
    const play = c => { if (sub) sub.stop(); sub = Ctx(); ctx.onStop(() => sub.stop()); const s = qs(box, '.slot'); s.innerHTML = ''; CONTENT[c](s, sub); };
    play(T[2]);
    const mv = qs(box, '.mv'); if (mv) mv.addEventListener('change', () => play(mv.value));
    return w;
  }

  // the original tunes these pages play (lead: eighth notes, 0 rest, -1 hold; bass every 2 steps)
  Sound.addTune('bdl-pony', { step: 0.14, hats: true, lead: [72, 76, 79, 76, 77, 81, 79, -1, 76, 79, 84, 79, 81, 79, 77, 76, 74, 77, 81, 77, 79, 77, 76, 74, 72, 74, 76, 77, 79, -1, 0, 0], bass: [48, 48, 53, 53, 52, 55, 53, 53, 50, 53, 55, 55, 48, 43, 48, 48] });
  Sound.addTune('bdl-radio', { step: 0.12, hats: true, lead: [67, 0, 67, 70, 72, 0, 70, 67, 65, 0, 65, 67, 70, -1, 0, 0, 67, 0, 67, 70, 72, 0, 75, 74, 72, 70, 67, 65, 67, -1, 0, 0], bass: [43, 43, 46, 46, 41, 41, 46, 46, 43, 43, 46, 48, 41, 46, 43, 43] });

  window.BridgeDLWeb = { render, enter, leave, setupChanged, pluginApp, CONTENT };
})();

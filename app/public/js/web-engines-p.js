/* web-engines-p: the page bodies for the 1999 search wars (loaded the first time you visit one of them).
 * WAAAGHooo! (www.waaaghooo.find), Jackgle! (www.jackgle.find), Ask Gubbinz (www.askgubbinz.find) and the
 * LINK-O-RAMA!!! page on the magazine (Cool Links). Everything is drawn with HTML/CSS/SVG. All names are made up. */
(function () {
  'use strict';
  const D = window.WebDir, A = window.Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const icon = D.icon, fold = D.fold, hash = D.hash;
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const t99 = () => D.t99();
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = () => { const t = t99(); return `${DAYS[t.date.getDay()]}, ${t.d} ${MON[t.m - 1]} 1999`; };
  const dmy = () => { const t = t99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };
  const fmt = n => Number(n || 0).toLocaleString('en-GB');
  const beta = () => t99().md < 921; // Jackgle! takes the BETA off on 21 September 1999
  const clean = t => { let c = String(t).replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9!?')]+$/g, '').replace(/\s+[-:(].*$/, ''); if (c.length > 30) c = c.slice(0, 30).replace(/\s\S*$/, ''); return c; };
  const dl = (id, text) => (D.get(id) ? `<a href="#" data-wdl="${esc(id)}">${text}</a>` : '');
  const dls = list => list.map(([id, t]) => dl(id, t)).filter(Boolean).join(' - ');
  const kv = { get: k => (window.Net && Net.kv ? Net.kv.get(k) : Promise.resolve({})), inc: k => window.Net && Net.kv && Net.kv.inc(k), watch: (k, f) => (window.Net && Net.kv ? Net.kv.watch(k, f) : () => {}) };
  // a live number that keeps itself up to date while the page is showing
  function liveNum(el, sel, key, bump) {
    const n = el.querySelector(sel); if (!n) return;
    if (bump) kv.inc(key);
    kv.get([key]).then(v => { if (typeof v[key] === 'number') n.textContent = fmt(v[key]); else if (key in v || (window.Net && Net.connected)) n.textContent = '0'; });
    const off = kv.watch(key, ev => { if (!n.isConnected) return off(); if (ev.type === 'set') n.textContent = fmt(ev.v); });
  }
  // today's headlines from Jack's 1999 calendar (plus the search-engine gossip)
  const GOSSIP = [['04-01', 'TECH', 'WAAAGHooo! adds a new category: "Pokemon". It is the biggest one by Friday. Nobody is surprised.'], ['06-07', 'TECH', 'Two students in a garage show off a search engine called Jackgle!. "It counts links," they say. Everyone nods.'],
    ['09-21', 'TECH', 'Garage search engine Jackgle! takes the BETA sign off. WAAAGHooo! says it is "not worried at all". (It is a bit worried.)'], ['10-04', 'TECH', 'Ask Gubbinz gets a new bow tie. Questions answered per day doubles. Coincidence? Gubbinz thinks not.']];
  function headlines(n) {
    const k = String(t99().m).padStart(2, '0') + '-' + String(t99().d).padStart(2, '0');
    const posts = ((window.CAL && CAL.posts) || []).concat(GOSSIP).filter(p => p[0] <= k).sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
    return posts.slice(0, n).map(p => ({ d: p[0].slice(3) + '/' + p[0].slice(0, 2), tag: p[1], text: D.plain(p[2]) }));
  }
  const MONTH_T = [6, 7, 10, 13, 16, 19, 21, 21, 18, 14, 10, 7], WX = [['rain', 'Rain'], ['globe', 'Sunny spells'], ['rain', 'Drizzle'], ['rain', 'Showers'], ['globe', 'Bright-ish'], ['rain', 'Grey and damp']];
  const weather = () => { const t = t99(), h = hash('wx' + t.m + '-' + t.d), w = WX[h % WX.length]; return { ic: w[0], txt: w[1], hi: MONTH_T[t.m - 1] + (h >>> 4) % 5 - 1, lo: MONTH_T[t.m - 1] - 6 + (h >>> 7) % 3 }; };
  const qlink = (eng, q, text) => `<a href="#" data-eq="${esc(eng)}" data-q="${esc(q)}">${text || esc(q)}</a>`;
  const shades = () => `<span class="wde-cool" title="Cool!">${icon('shades', 'wde-sh')}</span>`;
  const newb = () => '<span class="wde-new">NEW!</span>';
  // clicks inside the engines: directory entries, engine searches, index hits
  document.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('.wde [data-wdl], .wde [data-eq], .lo [data-wdl], .lo [data-eq]'); if (!t) return;
    ev.preventDefault(); sfx('click');
    if (t.dataset.wdl) D.open(t.dataset.wdl); else D.goSearch(t.dataset.eq, t.dataset.q);
  });
  document.addEventListener('mouseover', ev => { const t = ev.target.closest && ev.target.closest('.wde [data-wdl], .lo [data-wdl]'); if (!t || !$('brStatus')) return; const e = D.get(t.dataset.wdl); if (e) $('brStatus').textContent = e.url; });

  // ================================================================ styles
  const css = document.createElement('style'); css.id = 'wde-p-css';
  css.textContent = `
.wde{font:13px/1.4 Arial,Helvetica,sans-serif;color:#000;background:#fff}
.wde a{color:#00c}
.wde-new{display:inline-block;font:bold 9px Arial,sans-serif;color:#fff;background:#e10600;padding:0 3px;margin:0 2px;transform:rotate(-6deg);animation:wdblink .7s steps(1) infinite;vertical-align:1px}
.wde-cool{display:inline-block;vertical-align:-3px;margin-right:2px}.wde-sh{width:18px;height:18px;background:#7fd0ff;border:1px solid #000;border-radius:3px}
.wde-btn{font:bold 12px Arial,sans-serif}
/* ---- WAAAGHooo! */
.wde-waaaghooo{padding-top:8px}
.wg-top{display:flex;align-items:flex-end;justify-content:space-between;gap:6px 10px;flex-wrap:wrap}
.wg-tl,.wg-tr{display:flex;gap:10px;font-size:11px}.wg-tl svg,.wg-tr svg{background:#9a7ae8;padding:2px;border:1px solid #3a0a7a}
.wg-tl a,.wg-tr a{display:flex;flex-direction:column;align-items:center;gap:1px;color:#2a0a6a!important;text-decoration:none!important;min-width:44px}.wg-tl svg,.wg-tr svg{width:24px;height:24px}
.wg-logo{display:inline-flex;align-items:flex-end;font:900 46px/1 "Arial Black",Impact,sans-serif;letter-spacing:-1px;text-decoration:none!important;padding:4px 6px 0;white-space:nowrap}
.wg-logo b{display:inline-block;color:#ffd400;-webkit-text-stroke:2px #3a0a7a;paint-order:stroke fill;text-shadow:3px 3px 0 #3a0a7a}
.wg-logo b:nth-child(odd){transform:translateY(-3px) rotate(-4deg)}.wg-logo b:nth-child(even){transform:rotate(3deg)}
.wg-logo em{color:#7a2ad8;font-style:italic;-webkit-text-stroke:1px #2a0050;paint-order:stroke fill;text-shadow:2px 2px 0 #ffd400;margin-left:2px}
.wg-logo i{font-style:normal;color:#e10600;font-size:1.2em;-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:3px 3px 0 #ffd400;margin-left:1px}
.wg-logo.sm{font-size:26px}.wg-logo.sm b{-webkit-text-stroke:1px #3a0a7a;text-shadow:2px 2px 0 #3a0a7a}
.wg-tagl{text-align:center;font:bold 12px Arial,sans-serif;color:#3a0a7a;margin:2px 0 6px}
.wg-ad{display:flex;align-items:center;justify-content:space-between;gap:8px;width:468px;max-width:100%;height:60px;margin:6px auto;box-sizing:border-box;border:2px solid #000;padding:0 10px;text-decoration:none!important;font:900 17px/1.1 Impact,"Arial Black",sans-serif;letter-spacing:.5px;color:#fff!important;text-shadow:2px 2px 0 #000;overflow:hidden}
.wg-ad span{flex:1;text-align:center}.wg-ad u{text-decoration:none;font:bold 11px Arial,sans-serif;background:#ff0;color:#000;padding:3px 6px;border:2px outset #ffa;text-shadow:none;animation:wdblink .7s steps(1) infinite}
.wg-adc{text-align:center;font-size:9px;color:#888;margin:-4px 0 6px}
.wg-svc{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 4px;margin:6px 0;padding:6px 0;border-top:2px solid #7a2ad8;border-bottom:2px solid #7a2ad8;background:#f4eeff}
.wg-svc a{width:66px;display:flex;flex-direction:column;align-items:center;gap:2px;font:bold 11px Arial,sans-serif;color:#3a0a7a!important;text-decoration:none!important;padding:2px 0}
.wg-svc a svg{width:32px;height:32px;background:#9a7ae8;border:2px outset #d8c8ff;padding:3px}
.wg-svc a:hover span{text-decoration:underline}
.wg-sf{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0 4px}
.wg-sf input[type=text]{flex:0 1 320px;min-width:150px;font:14px Arial,sans-serif;padding:2px 4px}
.wg-sf .small{font-size:11px}
.wg-ql{text-align:center;font-size:12px;margin:0 0 8px}.wg-ql a{margin:0 4px}
.wg-main{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:12px;align-items:start}
.wg-dir{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;border:1px solid #c8b8f0;padding:8px 10px;background:#fff}
.wg-c b a{font-size:15px;color:#2a0a8a!important}.wg-c .cn{font-size:11px;color:#555}.wg-c small{display:block;font-size:11px;line-height:1.35}.wg-c small a{color:#00c}
.wg-box{border:1px solid #7a2ad8;margin:0 0 10px;background:#fff}.wg-box h4{background:#7a2ad8;color:#ffd400;margin:0;padding:3px 6px;font:bold 12px Arial,sans-serif}.wg-box .in{padding:6px;font-size:12px}
.wg-box ul{margin:0;padding-left:16px}.wg-box li{margin:0 0 4px}
.wg-date{font-weight:bold;color:#3a0a7a;margin-bottom:4px}
.wg-wx{display:flex;align-items:center;gap:8px}.wg-wx svg{width:32px;height:32px;background:#7fb0ff;padding:3px;border:1px solid #3a6ad8}
.wg-more{font-size:12px;border:1px solid #c8b8f0;border-top:0;padding:4px 10px;background:#faf8ff}.wg-more p{margin:4px 0}
.wg-foot{text-align:center;font-size:11px;color:#555;margin-top:14px;border-top:1px solid #c8b8f0;padding-top:6px}
.wg-head{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;border-bottom:2px solid #7a2ad8;padding-bottom:6px;margin-bottom:8px}
.wg-head .wg-sf{margin:0;justify-content:flex-start;flex:1}
.wg-crumb{font:bold 16px Arial,sans-serif;margin:6px 0}.wg-crumb a{color:#2a0a8a}
.wg-sec{background:#f4eeff;border-top:2px solid #7a2ad8;font:bold 13px Arial,sans-serif;color:#3a0a7a;padding:3px 6px;margin:12px 0 6px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}
.wg-list{list-style:none;padding:0;margin:0}.wg-list li{margin:0 0 7px;padding-left:4px}
.wg-list .bc{display:block;font-size:11px;color:#080}
.wg-pg{text-align:center;margin:10px 0}.wg-pg a{margin:0 6px}
.wg-other{margin:14px 0;padding:6px;border:1px dashed #7a2ad8;font-size:12px;text-align:center}
.wg-ans{border:1px solid #c8b8f0;margin:8px 0;padding:6px 8px}.wg-ans .who{font-size:11px;color:#555}.wg-ans.best{background:#fffbe0;border-color:#c9a200}.wg-ans .st{color:#c89600}
.wg-q{font:bold 15px Arial,sans-serif;color:#2a0a6a}
.wg-form td{padding:3px 6px;vertical-align:top}.wg-form input[type=text],.wg-form textarea,.wg-form select{width:300px;max-width:100%}
.wg-ok{background:#f0fff0;border:2px solid #2a9a2a;padding:10px;margin:10px 0}
@media (max-width:700px){.wg-main{grid-template-columns:minmax(0,1fr)}.wg-logo{font-size:34px}.wg-tl,.wg-tr{display:none}.wg-top{justify-content:center}}
@media (max-width:520px){.wg-dir{grid-template-columns:minmax(0,1fr)}.wg-ad{font-size:13px;height:52px;padding:0 6px}.wg-svc a{width:56px;font-size:10px}.wg-logo{font-size:30px}}
/* ---- Jackgle! */
.wde-jackgle{font:13px/1.4 Arial,Helvetica,sans-serif;text-align:left}
.jg-home{text-align:center;padding:36px 0 10px}
.jg-logo{display:inline-block;font:bold 64px/1 Georgia,"Times New Roman",serif;letter-spacing:-1px;text-decoration:none!important;position:relative;white-space:nowrap}
.jg-logo i{font-style:normal;text-shadow:2px 2px 0 #c8c8c8,3px 3px 0 #aaa}
.jg-logo i:nth-child(1){color:#1a8a3a}.jg-logo i:nth-child(2){color:#a040c0}.jg-logo i:nth-child(3){color:#ff7a00}.jg-logo i:nth-child(4){color:#1e6fd9}.jg-logo i:nth-child(5){color:#e10600}.jg-logo i:nth-child(6){color:#c8a000}.jg-logo i:nth-child(7){color:#00a0a0}.jg-logo i:nth-child(8){color:#e10600}
.jg-logo sup{position:absolute;right:-10px;top:2px;font:italic bold 13px Arial,sans-serif;color:#e10600;transform:rotate(-12deg);letter-spacing:0}
.jg-logo.sm{font-size:30px}.jg-logo.sm sup{font-size:9px;right:-8px;top:-2px}
.jg-form{margin:16px 0 8px}.jg-form input[type=text]{width:380px;max-width:92%;font:15px Arial,sans-serif;padding:3px 4px}
.jg-form .jg-btns{margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.jg-n{font-size:12px;color:#444;margin:8px 0}
.jg-links{font-size:12px;margin:14px 0}.jg-links a{margin:0 4px}
.jg-foot{font-size:11px;color:#777;margin-top:22px;text-align:center}
.jg-top{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;margin-bottom:6px}
.jg-top form{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:220px}.jg-top input[type=text]{flex:1 1 220px;min-width:0;max-width:340px;font:14px Arial,sans-serif;padding:2px 4px}
.jg-bar{background:#e8f0fe;border-top:1px solid #3366cc;padding:3px 6px;font-size:12px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}
.jg-dym{margin:10px 0;font-size:14px;color:#c00}.jg-dym a{font-weight:bold;font-style:italic}
.jg-r{margin:14px 0;max-width:640px}.jg-r .t{font-size:16px;text-decoration:underline}
.jg-r .s{font-size:13px;color:#000}.jg-r .s b{font-weight:bold}
.jg-r .u{font-size:12px;color:#080;word-break:break-all}.jg-r .u a{color:#77c}
.jg-pg{text-align:center;margin:16px 0;font-size:14px}.jg-pg a,.jg-pg b{margin:0 5px}.jg-pg b{color:#e10600}
.jg-none{margin:16px 0;font-size:13px}
.jg-page{max-width:640px;margin:0 auto;font:14px/1.5 Arial,sans-serif}.jg-page h2{font:bold 20px Georgia,serif;color:#1a8a3a;border-bottom:1px solid #3366cc}.jg-page h3{font:bold 15px Arial,sans-serif;margin:14px 0 4px}
.jg-tl{list-style:none;padding:0}.jg-tl li{margin:0 0 6px;padding-left:72px;position:relative}.jg-tl b{position:absolute;left:0;color:#1a8a3a}
.jg-job{border:1px solid #c8d8f8;padding:6px 10px;margin:8px 0;background:#f8fbff}
.jg-adv td{padding:4px 6px;font-size:13px}.jg-adv input[type=text]{width:220px;max-width:100%}
.jg-cache{position:relative;z-index:5;background:#fff;color:#000;border:1px solid #000;margin:0 0 10px;padding:8px 10px;font:12px/1.45 Arial,sans-serif;text-align:left}
.jg-cache .jg-logo{font-size:20px;float:right;margin-left:10px}.jg-cache a{color:#00c}
.jg-cache mark,.jg-hl{color:#000;padding:0 1px}
@media (max-width:520px){.jg-logo{font-size:44px}.jg-home{padding-top:20px}.jg-logo.sm{font-size:24px}}
/* ---- Ask Gubbinz */
.wde-askgubbinz{background:#fdf6e3;font:14px/1.45 Georgia,"Times New Roman",serif}
.ag-head{display:flex;align-items:center;gap:12px;background:#6a1020;color:#f8ecd0;margin:-18px -18px 12px;padding:8px 18px;border-bottom:4px double #c8a060}
.ag-logo{font:italic bold 30px Georgia,serif;letter-spacing:.5px;text-decoration:none!important;color:#f8ecd0!important}.ag-logo b{color:#ffd88a}
.ag-head .ag-tag{font:italic 12px Georgia,serif;margin-left:auto;text-align:right}
.ag-hero{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.ag-butler{flex:none;width:130px;height:150px}
.ag-bub{position:relative;flex:1;min-width:220px;background:#fff;border:2px solid #6a1020;border-radius:14px;padding:10px 14px;margin-top:10px}
.ag-bub::before{content:"";position:absolute;left:-14px;top:26px;border:7px solid transparent;border-right-color:#6a1020}
.ag-form{margin:8px 0}.ag-form input[type=text]{width:100%;box-sizing:border-box;font:15px Georgia,serif;padding:4px 6px;border:2px inset #c8a060}
.ag-form .row2{display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap}.ag-form .btn{font:bold 13px Georgia,serif}
.ag-box{background:#fff;border:1px solid #c8a060;padding:8px 12px;margin:12px 0}.ag-box h3{font:italic bold 16px Georgia,serif;color:#6a1020;margin:0 0 6px}
.ag-key li{margin:0 0 4px}
.ag-q{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid #c8a060;padding:6px 10px;margin:6px 0}
.ag-q select{font:13px Georgia,serif;max-width:100%}
.ag-res{margin:8px 0 10px}.ag-res .u{font:11px Arial,sans-serif;color:#080}
.ag-says{font-style:italic;color:#6a1020}
.ag-no{background:#fff;border:2px solid #6a1020;padding:10px 14px;margin:10px 0}
@media (max-width:520px){.ag-head{margin:-12px -10px 10px;padding:6px 10px}.ag-logo{font-size:22px}.ag-head .ag-tag{display:none}.ag-butler{width:90px;height:104px}}
/* ---- LINK-O-RAMA (on the magazine) */
.lo-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 6px}
.lo-t{font:400 clamp(34px,7vw,58px)/1 var(--comic);letter-spacing:.03em;background:linear-gradient(90deg,#e10600,#ff8c00,#ffd400,#3c3,#00e5ff,#5b16c9,#e0157a);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:2px #000;transform:rotate(-2deg);display:inline-block;filter:drop-shadow(3px 3px 0 #000)}
.lo-n{font:bold 14px Arial,sans-serif;background:#e10600;color:#ff0;padding:4px 10px;border:3px solid #000;transform:rotate(5deg);animation:wdblink .8s steps(1) infinite}
.lo-jump{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 14px;font:12px var(--ui)}.lo-jump b{margin-right:4px}.lo-jump a{background:#000080;color:#ffd400!important;padding:1px 6px;text-decoration:none!important;border:2px outset #6a6ad8}
.lo-eng{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 12px}
.lo-e{background:#fff;border:3px solid #000;box-shadow:4px 4px 0 #000;padding:8px;text-align:center;font:12px/1.35 Georgia,serif}
.lo-e .wdx-lg{display:block;font-size:22px;margin:2px 0 4px}.lo-e .wdx-ag{display:flex;justify-content:center}.lo-e .wdx-bt{width:22px;height:22px}
.lo-e p{margin:4px 0 6px;min-height:46px}.lo-e .btn{font-weight:bold}
.lo-sall{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;background:#000;color:#fff;border:3px ridge #ffd400;padding:8px;margin:0 0 16px;font:bold 13px Arial,sans-serif}
.lo-sall input{flex:1 1 180px;min-width:0;max-width:280px;font:13px Arial,sans-serif;padding:2px 4px}.lo-sall .btn{font-size:11px;padding:2px 6px}
.lo-two{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:14px;align-items:stretch;margin:0 0 6px}
.lo-sotd{position:relative}.lo-sotd .lo-st{font:400 24px var(--comic);color:#e10600;letter-spacing:.04em}.lo-sotd .wd88{float:left;margin:4px 10px 4px 0;transform:scale(1.25);transform-origin:0 0;margin-right:32px;margin-bottom:12px}
.lo-sotd h4{margin:2px 0;font:bold 16px Georgia,serif}
.lo-rand{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:repeating-linear-gradient(45deg,#ffd400 0 14px,#000 14px 28px);border:3px solid #000;box-shadow:5px 5px 0 #000;padding:14px;margin:0 0 16px}
.lo-rand button{font:400 22px var(--comic);letter-spacing:.05em;padding:10px 16px;background:#e10600;color:#fff;border:4px outset #ff6a6a;cursor:pointer;text-shadow:2px 2px 0 #000;animation:wdwig 1.4s ease-in-out infinite}
.lo-rand button:active{border-style:inset}
.lo-rand small{display:block;margin-top:6px;background:#fff;padding:1px 6px;font:11px var(--ui)}
.lo-view{font:12px var(--ui);margin:6px 0 10px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.lo-cat{margin:0 0 18px}.lo-cat h3{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;border-bottom:3px dotted #000;padding-bottom:3px}.lo-cat h3 small{font:12px var(--ui)}
.lo-jack{font:italic 13px Georgia,serif;margin:4px 0 8px;color:#333}
.lo-wall{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#111 radial-gradient(circle,#444 0 1px,transparent 1.5px) 0 0/12px 12px;border:3px solid #000}
.lo-txt{list-style:none;padding:0;margin:0}.lo-txt li{padding:4px 0;border-bottom:1px dotted #999}.lo-txt a{font-weight:bold;color:#0000ee}.lo-txt small{display:block;font:12px var(--ui);color:#444}.lo-txt .u{color:#888}
.lo-key{font:12px var(--ui);color:#444;background:#fff;border:2px dashed #000;padding:6px 8px;margin:0 0 16px}
.lo-prog{font:12px var(--ui);margin:0 0 10px}
@media (max-width:640px){.lo-two{grid-template-columns:minmax(0,1fr)}.lo-wall{gap:5px;padding:6px;justify-content:center}}
`;
  document.head.appendChild(css);

  // ================================================================ WAAAGHooo!
  const WGH = 'http://www.waaaghooo.find';
  const wgLogo = sm => `<a class="wg-logo${sm ? ' sm' : ''}" href="${WGH}/" aria-label="WAAAGHooo!">${'WAAAGH'.split('').map(c => `<b>${c}</b>`).join('')}<em>ooo</em><i>!</i></a>`;
  const ADS = [['http://www.rupeeshop.jnet/', 'linear-gradient(90deg,#1a7a1a,#3c3)', 'HATS! HATS! HATS! THE RUPEE EMPORIUM', 'SHOP'], ['http://www.jacknetzone.jnet/', 'linear-gradient(90deg,#000080,#7a2ad8)', 'PLAY REVERSI AGAINST REAL PEOPLE!!!', 'PLAY'],
    ['http://www.jackmail.webcom/', 'linear-gradient(90deg,#e10600,#ff8c00)', 'FREE E-MAIL!!! 2 MB OF SPACE (TWO!)', 'SIGN UP'], ['http://www.hamstercam.webcom/', 'linear-gradient(90deg,#8a5a2a,#d9a441)', 'HE IS STILL RUNNING. HAMSTER CAM LIVE', 'WATCH'],
    ['http://www.sharewareshack.netz/', 'linear-gradient(90deg,#003080,#00a0a0)', 'FREE SOFTWARE!!! SHAREWARE SHACK', 'GET IT'], ['http://www.jackexchange.grot/', 'linear-gradient(90deg,#000,#1a7a1a)', 'PETS SHARES UP 3 RUPEES! BUY BUY BUY!', 'TRADE']];
  const ad = n => { const a = ADS[(n == null ? hash('ad' + ((Date.now() / 6e4) | 0)) : n) % ADS.length]; return `<a class="wg-ad" href="${a[0]}" style="background:${a[1]}"><span>${a[2]}</span><u>${a[3]}!</u></a><div class="wg-adc">advertisement</div>`; };
  const SVC = [['mail', 'Mail', 'http://www.jackmail.webcom/'], ['chat', 'Chat', 'http://www.chatterbox.netz/'], ['joy', 'Games', 'http://www.jacknetzone.jnet/'], ['gem', 'Shopping', 'http://www.rupeeshop.jnet/'], ['news', 'News', 'http://www.jackattack.jnet/news'],
    ['rain', 'Weather', 'http://www.jackattack.jnet/weather'], ['star', 'Horoscopes', 'http://www.lookhere.infobahn/horoscopes.html'], ['floppy', 'Software', 'http://www.sharewareshack.netz/'], ['chart', 'Finance', 'http://www.jackexchange.grot/'], ['house', 'Homepages', 'http://www.homepagez.webcom/'], ['biscuit', 'Clubs', 'http://www.biscuitring.webcom/'], ['orb', 'Answers', WGH + '/answers/']];
  const wgForm = (q, cat) => `<form class="wg-sf" data-wgs autocomplete="off"><input type="text" maxlength="80" value="${esc(q || '')}" aria-label="Search WAAAGHooo!"><button class="btn wde-btn" type="submit">Search</button>${cat ? `<label class="small"><input type="radio" name="wgw" value="all" checked> the whole directory</label><label class="small"><input type="radio" name="wgw" value="cat"> just this category</label>` : ` <a class="small" href="#" data-wgadv>advanced search</a>`}</form>`;
  const wgFoot = () => `<div class="wg-foot"><a href="${WGH}/addurl.html">How to Suggest a Site</a> - <a href="${WGH}/inside.html">Company Info</a> - <a href="${WGH}/inside.html">Privacy Policy (we have one!)</a> - <a href="${WGH}/inside.html">Jobs (must like biscuits)</a> - <a href="${WGH}/answers/">Answers</a><br>WAAAGHooo! in other languages: <a href="#" data-wglang>Pirate</a> - <a href="#" data-wglang>Robot</a> - <a href="#" data-wglang>Klingon</a><br>Copyright &copy; 1994-1999 WAAAGHooo! Inc. All rights reserved. The most visited place on the JackNet.</div>`;
  const entryLine = (e, bc) => `<li>${e.cool ? shades() : ''}<a href="#" data-wdl="${esc(e.id)}"><b>${esc(e.title)}</b></a>${e.isNew ? newb() : ''} - ${esc(e.desc)}${bc ? `<span class="bc">${esc(D.cats()[e.cat] || '')} &middot; ${esc(e.url.replace(/^http:\/\//, ''))}</span>` : ''}</li>`;
  function wgWire(el, ctx) {
    el.querySelectorAll('[data-wgs]').forEach(f => f.addEventListener('submit', ev => {
      ev.preventDefault(); const q = f.querySelector('input[type=text]').value.trim(); if (!q) return;
      const only = f.querySelector('input[name=wgw]:checked'); D.goSearch('waaaghooo', only && only.value === 'cat' && ctx.arg ? q + ' cat:' + ctx.arg : q);
    }));
    el.querySelectorAll('[data-wgadv]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('WAAAGHooo! Advanced Search', 'ADVANCED SEARCHING\n\n+word   must have it\n-word   must NOT have it\nsite:jacksearch.find   only on one site\n\nOr just type it in CAPITALS. That never works either.', 'info'); }));
    el.querySelectorAll('[data-wglang]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('WAAAGHooo! ' + a.textContent, a.textContent === 'Pirate' ? 'Arr! This page be now in Pirate. (It looks the same. The parrot ate the translation.)' : a.textContent === 'Robot' ? 'BEEP. THIS PAGE IS NOW IN ROBOT. IT IS 0% DIFFERENT. BOOP.' : 'Our Klingon translator is at a Star Trek convention until Tuesday.', 'info'); }));
  }
  const WG = {
    home(el) {
      const C = D.cats(), bc = D.byCat(), news = headlines(5), wx = weather(), pick = D.list().filter(e => e.cool)[hash('wgcool' + D.dayOfYear()) % D.list().filter(e => e.cool).length];
      el.innerHTML = `<div class="wg-top"><div class="wg-tl"><a href="http://www.jackmail.webcom/">${icon('mail')}Check Mail</a><a href="${WGH}/new.html">${icon('star')}What's New</a></div>${wgLogo()}<div class="wg-tr"><a href="${WGH}/cool.html">${icon('shades')}Cool!</a><a href="${WGH}/inside.html">${icon('orb')}Help</a></div></div>
<div class="wg-tagl">The most visited place on the JackNet! &middot; ${esc(longDate())}</div>
${ad()}
<div class="wg-svc">${SVC.map(s => `<a href="${s[2]}">${icon(s[0])}<span>${s[1]}</span></a>`).join('')}</div>
${wgForm('')}
<div class="wg-ql"><a href="${WGH}/answers/">Answers</a> &middot; <a href="${WGH}/hot100.html"><b>Hot 100</b></a> &middot; <a href="${WGH}/cool.html">Cool!</a> &middot; <a href="${WGH}/new.html">What's New</a> &middot; <a href="${WGH}/random.html">Random Link</a> &middot; <a href="${WGH}/addurl.html">Suggest a Site</a> &middot; <a href="http://www.rupeeshop.jnet/">Shop (Rupees only)</a></div>
<div class="wg-main"><div><div class="wg-dir">${Object.keys(C).filter(k => bc[k] && bc[k].length).map(k => { const L = bc[k], subs = L.slice().sort((a, b) => hash(a.id + 'w') - hash(b.id + 'w')).slice(0, 3); return `<div class="wg-c"><b><a href="${WGH}/dir/${k}.html">${esc(C[k])}</a></b> <span class="cn">(${L.length})</span>${L.some(e => e.isNew) ? newb() : ''}<small>${subs.map(e => `<a href="#" data-wdl="${esc(e.id)}">${esc(clean(e.title))}</a>`).join(', ')}, <a href="${WGH}/dir/${k}.html">more...</a></small></div>`; }).join('')}</div>
<div class="wg-more"><p><b>Local:</b> ${dls([['jacktown.jnet', 'Jacktown'], ['squigwitch.cyb', 'The Spooky Woods'], ['hz-snotlin', 'The Mudpit'], ['hz-rory', 'SpaceCity'], ['hz-goldie', 'PetPark']])}</p><p><b>Shopping:</b> ${dls([['rupeeshop.jnet', 'Hats'], ['jackbay.webcom', 'Auctions'], ['teef', 'Gem Exchange'], ['jackexchange.grot', 'Shares'], ['jacklotto.grot', 'Lotto'], ['sharewareshack.netz', 'Software']])}</p><p><b>More Services:</b> ${dls([['ecardz', 'E-cards'], ['csotd', 'Cool Site of the Day'], ['hamstercam', 'Webcams'], ['freetoolz', 'Free Counters'], ['ezine', 'E-zines'], ['jackfax.jnet', 'Teletext'], ['chatterbox', 'Chat Rooms']])}</p><p><b>Daily Pick:</b> ${(() => { const p = D.siteOfDay(); return p ? `<a href="#" data-wdl="${esc(p.id)}">${esc(p.title)}</a> - ${esc(p.desc)}` : ''; })()}</p></div></div>
<div class="wg-side"><div class="wg-box"><h4>IN THE NEWS</h4><div class="in"><div class="wg-date">${esc(longDate())}</div><ul>${news.map(n => `<li><a href="http://www.jackattack.jnet/news">${esc(n.text.length > 95 ? n.text.slice(0, 92).replace(/\s\S*$/, '') + '...' : n.text)}</a> <small>(${n.d})</small></li>`).join('')}</ul><a href="http://www.jackattack.jnet/news">more news...</a></div></div>
<div class="wg-box"><h4>INSIDE INFO</h4><div class="in"><ul><li><a href="${WGH}/answers/">WAAAGHooo! Answers</a> - ask anyone anything</li><li><a href="${WGH}/cool.html">Cool! sites</a> ${shades()}</li><li><a href="${WGH}/random.html">Random Link</a> - feeling brave?</li><li><a href="${WGH}/inside.html">Get the Toolbar</a></li><li><a href="${WGH}/addurl.html">Suggest a site</a></li></ul></div></div>
<div class="wg-box"><h4>TODAY'S COOL! PICK</h4><div class="in" style="text-align:center">${pick ? D.badge(pick) + `<br><a href="#" data-wdl="${esc(pick.id)}">${esc(pick.title)}</a>` : ''}</div></div>
<div class="wg-box"><h4>WEATHER</h4><div class="in wg-wx">${icon(wx.ic)}<span><b>${wx.txt}</b><br>High ${wx.hi}&deg;C, low ${wx.lo}&deg;C<br><a href="http://www.jackattack.jnet/weather">5-day forecast</a></span></div></div>
<div class="wg-box"><h4>VISITORS</h4><div class="in">You are visitor number <b class="wg-hits">...</b> to this page. Page views today: lots.</div></div></div></div>
${wgFoot()}`;
      liveNum(el, '.wg-hits', 'eng.wg.hits', true);
    },
    search(el, ctx) {
      const q = ctx.q; D.setQ('waaaghooo', q); D.setAddr(WGH + '/search?q=' + encodeURIComponent(q).replace(/%20/g, '+'), 'WAAAGHooo! Search Results: ' + q);
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}${wgForm(q)}</div><div class="wg-out"><p>Asking everyone in the building...</p></div>${wgFoot()}`;
      if (!q) { el.querySelector('.wg-out').innerHTML = '<p>Type something in the box, then press Search. (That\'s how searching works.)</p>'; return; }
      const dm = D.dirMatch(q), C = D.cats(), PER = 10;
      D.search(q, 'dir').then(r => {
        const have = new Set(dm.sites.map(e => D.normU(e.url))), web = r.hits.filter(h => !have.has(D.normU(h.e.url)));
        let page = 0; const out = el.querySelector('.wg-out');
        const draw = () => {
          out.innerHTML = `<p>Found <b>${dm.cats.length}</b> categor${dm.cats.length === 1 ? 'y' : 'ies'} and <b>${dm.sites.length}</b> site${dm.sites.length === 1 ? '' : 's'} for <b>${esc(q)}</b>${web.length ? `, plus <b>${web.length}</b> web pages` : ''}.</p>`
            + (dm.cats.length || dm.sites.length ? `<div class="wg-sec"><span>Category Matches</span><span>(${dm.cats.length + dm.sites.length})</span></div>${dm.cats.map(k => `<div><b><a href="${WGH}/dir/${k}.html">Top: ${esc(C[k])}</a></b></div>`).join('')}<ul class="wg-list">${dm.sites.slice(0, 25).map(e => entryLine(e, true)).join('')}</ul>` : '')
            + `<div class="wg-sec"><span>Web Pages</span><span>(from the spiders)</span></div>`
            + (web.length ? `<ul class="wg-list">${web.slice(page * PER, page * PER + PER).map((h, i) => `<li><a href="#" data-wh="${page * PER + i}"><b>${esc(h.e.title)}</b></a> - ${h.snip}<span class="bc">${esc(h.e.url.replace(/^http:\/\//, ''))}</span></li>`).join('')}</ul>${web.length > PER ? `<div class="wg-pg">${page ? '<a href="#" data-wp2="-1">&laquo; Previous 10</a>' : ''}${(page + 1) * PER < web.length ? '<a href="#" data-wp2="1">Next 10 Matches &raquo;</a>' : ''}</div>` : ''}` : '<p>The spiders found no web pages with that in. Try fewer words. Or better ones.</p>')
            + `<div class="wg-other">Try your search on other search engines: ${qlink('jackgle', q, 'Jackgle!')} - ${qlink('grot', q, 'JackSearch')} - ${qlink('askgubbinz', q, 'Ask Gubbinz')}<br><small>(We don't mind. Much.)</small></div>`;
          out.querySelectorAll('[data-wh]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); D.openHit(web[+a.dataset.wh].e); }));
          out.querySelectorAll('[data-wp2]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); page += +a.dataset.wp2; draw(); el.scrollIntoView({ block: 'start' }); }));
        };
        draw();
      });
    },
    cat(el, ctx) {
      const C = D.cats(), k = ctx.arg, L = D.byCat()[k] || [], others = Object.keys(C).filter(x => x !== k).sort((a, b) => hash(k + a) - hash(k + b)).slice(0, 3);
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}${wgForm('', 1)}</div><div class="wg-crumb"><a href="${WGH}/">Top</a>: ${esc(C[k] || k)}</div>
<div class="wg-sec"><span>Related Categories</span></div><div>${others.map(o => `<a href="${WGH}/dir/${o}.html"><b>${esc(C[o])}</b></a> (${(D.byCat()[o] || []).length})`).join(' &middot; ')}</div>
${L.length > 4 ? `<div class="wg-sec"><span>Most Popular Sites</span></div><ul class="wg-list">${L.slice().sort((a, b) => D.pop(b) - D.pop(a)).slice(0, 3).map(e => entryLine(e)).join('')}</ul>` : ''}<div class="wg-sec"><span>Site Listings</span><span>(${L.length})</span></div><ul class="wg-list">${L.map(e => entryLine(e)).join('')}</ul>
<p class="small">${shades()} = Cool! (one of our surfers liked it) &middot; ${newb()} = new this month &middot; <a href="${WGH}/addurl.html">Suggest a site for this category</a></p>${ad(hash(k))}${wgFoot()}`;
      ctx.arg = k;
    },
    cool(el) {
      const C = D.cats(), bc = D.byCat();
      secret('eng.cool');
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}${wgForm('')}</div><h2 style="font:900 28px 'Arial Black',sans-serif;color:#3a0a7a;margin:6px 0">${icon('shades', 'wde-sh')} Cool! Sites</h2><p>Every site with the sunglasses. Picked by our team of surfers, who surf all day in a room full of beanbags and empty Pot Noodles.</p>
${Object.keys(C).filter(k => bc[k] && bc[k].some(e => e.cool)).map(k => `<div class="wg-sec"><span><a href="${WGH}/dir/${k}.html" style="color:#3a0a7a">${esc(C[k])}</a></span></div><ul class="wg-list">${bc[k].filter(e => e.cool).map(e => entryLine(e)).join('')}</ul>`).join('')}${wgFoot()}`;
    },
    hot(el) {
      const L = D.hot(100), wk = Math.floor(D.dayOfYear() / 7), top = D.pop(L[0]) || 100;
      const move = e => { if (e.id === 'jackgle.find') return '<span style="color:#080" title="climbing fast">&#9650;</span>'; const m = hash(e.id + 'wk' + wk) % 7; return m < 2 ? '<span style="color:#080">&#9650;</span>' : m < 4 ? '<span style="color:#c00">&#9660;</span>' : '<span style="color:#888">=</span>'; };
      let lastV = Infinity; const VIS = L.map(e => { const v = Math.min(lastV - 137 - hash(e.id) % 900, Math.round(Math.pow(D.pop(e) / top, 3) * 4800000 * (0.94 + (hash(e.id + wk) % 12) / 100))); lastV = v; return Math.max(40, v); }); const visits = e => VIS[L.indexOf(e)];
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}${wgForm('')}</div><h2 style="font:900 26px 'Arial Black',sans-serif;color:#3a0a7a;margin:6px 0">WAAAGHooo! Hot 100</h2><p>The most visited sites on the JackNet this week, counted by a student with a clicker. Updated every Monday. Week ${wk + 1} of 1999.</p>
<table class="wg-hot" style="border-collapse:collapse;width:100%;font-size:12px">${L.map((e, i) => `<tr style="background:${i % 2 ? '#fff' : '#f2ecff'}"><td style="padding:3px 6px;font:bold 15px Arial,sans-serif;color:#3a0a7a;width:34px;text-align:right">${i + 1}</td><td style="padding:3px 4px;width:16px">${move(e)}</td><td style="padding:3px 6px">${e.cool ? shades() : ''}<a href="#" data-wdl="${esc(e.id)}"><b>${esc(e.title)}</b></a>${e.isNew ? newb() : ''}<div class="small" style="color:#080">${esc(e.url.replace(/^http:\/\//, ''))}</div></td><td class="small wg-hotc" style="padding:3px 6px;color:#555">${esc(D.cats()[e.cat] || '')}</td><td class="small" style="padding:3px 6px;text-align:right;white-space:nowrap">${visits(e).toLocaleString('en-GB')} visits</td></tr>`).join('')}</table>
<style>@media (max-width:600px){.wg-hotc{display:none}}</style><p class="small">Want your site in the Hot 100? Get more visitors. Ask your Nan to press Refresh a lot. (That's how Dave got in.)</p>${wgFoot()}`;
    },
    new(el) {
      const L = D.list().filter(e => e.isNew), sotd = D.siteOfDay();
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}${wgForm('')}</div><h2 style="font:900 26px 'Arial Black',sans-serif;color:#3a0a7a;margin:6px 0">What's New ${newb()}</h2><p>Sites added to the directory lately. Updated every day (by someone with a very big pencil).</p>
<div class="wg-sec"><span>New Sites</span><span>(${L.length})</span></div><ul class="wg-list">${L.map(e => entryLine(e, true)).join('')}</ul>
<div class="wg-sec"><span>Daily Pick for ${esc(dmy())}</span></div><ul class="wg-list">${sotd ? entryLine(sotd, true) : ''}</ul>${wgFoot()}`;
    },
    answers(el) {
      const OLD = [['Is red faster?', 'Yes. Red cars, red Micro Machines, red Scalextric. Everyone knows that. Science has not caught up yet.', 'Luke64'], ['Will the Millennium Bug get me?', "Only if your toaster has a calendar in it. Fill the bath, just in case.", 'MegahertzMike'], ['How many Rupees for a hat?', 'Depends on the hat. Ask at the Rupee Emporium. Bring all your Rupees.', 'Gubbinz'], ['What is a modem?', "It's a box that screams down the phone line. Then you get the Internet. Don't pick up the phone.", 'Callum_PC']];
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}<b style="font:900 22px 'Arial Black',sans-serif;color:#7a2ad8">Answers</b></div><p>Ask a question. Real people answer it. They are not always right, but they are always FAST.</p>
<form class="wg-sf" data-wga autocomplete="off" style="justify-content:flex-start"><input type="text" maxlength="100" placeholder="Ask anything..." aria-label="Your question"><button class="btn wde-btn" type="submit">Ask!</button></form>
<div class="wg-aout"></div><div class="wg-sec"><span>Recently Answered</span><span>Answers given so far: <b class="wg-an">...</b> (a few were right)</span></div>${OLD.map(o => `<div class="wg-ans"><div class="wg-q">Q: ${esc(o[0])}</div><div>${esc(o[1])}</div><div class="who">Best Answer chosen by voters - answered by <b>${esc(o[2])}</b> <span class="st">*****</span></div></div>`).join('')}
<p class="small">Want answers in your browser? <a href="${WGH}/inside.html">Get the WAAAGHoo! Answers Toolbar</a>.</p>${wgFoot()}`;
      liveNum(el, '.wg-an', 'eng.wga.n', false);
      el.querySelector('[data-wga]').addEventListener('submit', ev => {
        ev.preventDefault(); const inp = ev.target.querySelector('input'), q = inp.value.trim(); if (!q) return;
        const out = el.querySelector('.wg-aout');
        if (D.RUDE.test(q)) { out.innerHTML = `<div class="wg-ans"><div class="wg-q">Q: (removed by the moderator)</div><div>OI! No rude words on Answers. The moderator is a very big lad called Nobby, and he has removed your question. And your chair.</div></div>`; sfx('uhoh'); return; }
        kv.inc('eng.wga.n');
        const ans = orkAnswers(q);
        out.innerHTML = `<div class="wg-sec"><span>Your Question</span><span>3 answers</span></div><div class="wg-ans"><div class="wg-q">Q: ${esc(q)}</div></div>${ans.map((a, i) => `<div class="wg-ans${i ? '' : ' best'}"><div>${esc(a[0])}</div><div class="who">${i ? 'Answered' : '&#9733; Best Answer - answered'} by <b>${esc(a[1])}</b> ${i ? '' : '<span class="st">*****</span>'}</div></div>`).join('')}<p class="small">Want a sensible answer? Try ${qlink('askgubbinz', q, 'Ask Gubbinz')}. He's posh.</p>`;
        inp.value = ''; sfx('waaagh');
      });
    },
    addurl(el) {
      const C = D.cats();
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}<b style="font:900 20px 'Arial Black',sans-serif;color:#7a2ad8">Suggest a Site</b></div>
<p>Got a homepage? Want the whole JackNet to see it? Fill in this form and a real human will look at it. <b>Every site is reviewed by hand.</b> (A sticky one. Pot Noodle.)</p>
<form class="wg-form" data-wgu autocomplete="off"><table><tr><td>Site title:</td><td><input type="text" name="t" maxlength="60" required></td></tr><tr><td>Address (URL):</td><td><input type="text" name="u" maxlength="80" value="http://" required></td></tr><tr><td>Category:</td><td><select name="c">${Object.keys(C).map(k => `<option value="${k}">${esc(C[k])}</option>`).join('')}</select></td></tr><tr><td>Describe it:</td><td><textarea name="d" rows="3" maxlength="200"></textarea><br><small>25 words or fewer. No CAPITALS. No "BEST SITE EVER". (Every site says that.)</small></td></tr><tr><td>Your nickname:</td><td><input type="text" name="n" maxlength="20"><br><small>Not your real name! No addresses, no phone numbers.</small></td></tr></table><p><button class="btn wde-btn" type="submit">Submit My Site</button> <button class="btn" type="reset">Clear</button></p></form><div class="wg-uok"></div>${wgFoot()}`;
      const f = el.querySelector('[data-wgu]');
      f.addEventListener('submit', ev => {
        ev.preventDefault(); const t = f.t.value.trim(); if (!t) return;
        const pos = 40000 + hash(t + Date.now()) % 20000;
        el.querySelector('.wg-uok').innerHTML = `<div class="wg-ok"><b>THANK YOU!</b> Your site "<b>${esc(t.slice(0, 60))}</b>" has been added to the review queue for <b>${esc(C[f.c.value])}</b>.<br><br>A surfer will review it in <b>6 to 8 weeks</b>. Please do not send it again. (If you send it again, you go to the back of the queue. Those are the rules.)<br><br>Your position in the queue: <b>${fmt(pos)}</b>.</div>`;
        f.hidden = true; secret('eng.addurl'); sfx('solve');
      });
    },
    random(el) {
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}</div><div style="text-align:center;padding:40px 0"><p style="font:bold 18px Arial,sans-serif">${icon('dice', 'wde-sh')} Picking a random site from the whole JackNet...</p><p class="small">Hold on to your mouse.</p></div>`;
      setTimeout(() => { if (el.isConnected) D.surfRandom(); }, 900);
    },
    inside(el) {
      el.innerHTML = `<div class="wg-head">${wgLogo(true)}<b style="font:900 20px 'Arial Black',sans-serif;color:#7a2ad8">Inside WAAAGHooo!</b></div>
<div class="wg-sec"><span>Company Info</span></div><p>WAAAGHooo! was started in 1994 by two students in a caravan who made a list of their favourite websites. Then they made a list of those lists. The name is the noise they made when the list got to 100. Now it's the <b>biggest list on the JackNet</b>, with ${D.list().length} sites sorted into ${Object.keys(D.cats()).length} categories by hand.</p><p>Page views per day: <b>1,999,999</b>. Staff: 40 surfers, 12 spider wranglers and one hamster in charge of the post room.</p>
<div class="wg-sec"><span>Get the Toolbar</span></div><p>Ask questions straight from your browser with the <b>WAAAGHoo! Answers Toolbar</b>. (Yes, the toolbar has one less "o". The intern who made it ran out of o's.)</p><p><button class="btn wde-btn" data-wgtb type="button">Install the Toolbar</button></p>
<div class="wg-sec"><span>Privacy Policy</span></div><p>We do not keep your details. We lost the filing cabinet. Never type your real name, address or phone number into ANY website, not even this one. Your Mom will tell you the same thing.</p>
<div class="wg-sec"><span>Jobs</span></div><ul><li><b>Surfer</b> - surf the web all day, put sunglasses on the cool bits. Must own a beanbag.</li><li><b>Category Sorter</b> - decide if a site is "Fun & Silly" or "Weird & Lost". Must not cry.</li><li><b>Spider Wrangler</b> - (we borrowed these from JackSearch, please don't tell them).</li></ul>
<div class="wg-sec"><span>Our Rivals</span></div><p>Some people use other search engines. We are not worried. <a href="http://www.jackgle.find/">Jackgle!</a> is just two boys in a garage. <a href="http://www.jacksearch.find/">JackSearch</a> is one little green helper in a shoebox. <a href="http://www.askgubbinz.find/">Ask Gubbinz</a> is the same helper in a bow tie.</p>${wgFoot()}`;
      el.querySelector('[data-wgtb]').addEventListener('click', () => { if (window.OldPC && OldPC.install) { if (OldPC.installed.includes('waaaghoo')) Desk.msgbox('WAAAGHoo! Answers Toolbar', 'You already have it! Look at the top of your browser. The purple one.', 'info'); else OldPC.install('waaaghoo'); } else Desk.msgbox('WAAAGHoo! Answers Toolbar', 'The toolbar is not available for this computer. It needs more RAM. And a bigger monitor.', 'warn'); });
    },
  };
  function orkAnswers(q) {
    const l = fold(q), N = ['Luke64', 'Callum_PC', 'Gubbinz', 'MegahertzMike', 'PixelPriya', 'Snaz', 'CubeKing99'];
    const r = [];
    if (/red|fast|quick|speed|race/.test(l)) r.push('Red ones go faster. Ask anyone with a Scalextric. Next question.');
    if (/gun|shoot|loud|golden|bond/.test(l)) r.push('GoldenEye, Facility, pistols only, no Oddjob. Those are the rules in our house.');
    if (/food|eat|hungry|dinner|tea|lunch|pie/.test(l)) r.push('Pot Noodle. If there is no Pot Noodle, toast. If there is no toast, ask your Mom.');
    if (/money|cost|price|pay|quid|buy/.test(l)) r.push("That'll be ten Rupees. Everything is ten Rupees.");
    if (/y2k|millennium|2000|bug/.test(l)) r.push("The Millennium Bug? Unplug the video recorder, fill the bath and stay up till midnight to watch.");
    if (/homework|school|teacher|maths|test/.test(l)) r.push("Do it on Sunday night at 9pm, like everyone else. (Don't say the dog ate it. Nobody believes the dog.)");
    if (/computer|pc|modem|internet|web|mhz|ram/.test(l)) r.push('Turn it off and on again. If that doesn\'t work, more RAM. It is always more RAM.');
    if (/star wars|jedi|saber|menace|pod/.test(l)) r.push('Podracing was the best bit. Darth Maul was the second best bit. Jar Jar was a bit.');
    if (/pokemon|pikachu/.test(l)) r.push('Pick Squirtle. Brock is a nightmare if you pick Charmander. Trust me.');
    if (/dave/.test(l)) r.push("Dave? The lad with the wrestling page? He's alright. He owes me a Rumble Pak.");
    if (/jack/.test(l)) r.push("Jack made this whole computer. He likes games, Star Wars, Rubik's cubes and painting little soldiers. Nerd. (Respect.)");
    if (/love|like|friend/.test(l)) r.push("Best mates are the ones who let you be Player 1. Marry one of them.");
    const GEN = ['Dunno. But I can say it in CAPITALS: DUNNO!', 'Ask Dave, he has the strategy guide.', 'Yes. Or no. Definitely one of those.', 'That depends. Is it red?', 'Blow on the cartridge and try again.', "I think it's in the Directory. Under 'Weird & Lost'.", 'Have you tried turning it off and on again? It works on little brothers too.', 'Woo-hoo! (That\'s my answer to everything.)'];
    let k = hash(l);
    while (r.length < 3) { const g = GEN[k % GEN.length]; if (!r.includes(g)) r.push(g); k = (k >>> 3) + 7; }
    return r.slice(0, 3).map((a, i) => [a, N[(hash(l + i) >>> 2) % N.length]]);
  }

  // ================================================================ Jackgle!
  const JGH = 'http://www.jackgle.find';
  const jgLogo = sm => `<a class="jg-logo${sm ? ' sm' : ''}" href="${JGH}/" aria-label="Jackgle!">${'Jackgle!'.split('').map(c => `<i>${c}</i>`).join('')}${beta() ? '<sup>BETA</sup>' : ''}</a>`;
  const jgDayKey = () => { const n = new Date(); return 'eng.jg.d' + String(n.getMonth() + 1).padStart(2, '0') + String(n.getDate()).padStart(2, '0'); };
  let jacky = store.get('jhp_eng_jacky', 0);
  function feelingJacky(q) {
    jacky++; store.set('jhp_eng_jacky', jacky); if (jacky >= 5) secret('eng.jacky5');
    sfx('boing');
    if (!q) return D.surfRandom();
    D.search(q, 'jackgle').then(r => { if (r.hits.length) D.openHit(r.hits[0].e); else { Desk.toast("I'm Feeling Jacky", 'Nothing matched, so here is somewhere random. You did say you were feeling Jacky.', 4000); D.surfRandom(); } });
  }
  function jgWire(el) {
    el.querySelectorAll('[data-jgs]').forEach(f => {
      f.addEventListener('submit', ev => { ev.preventDefault(); const q = f.querySelector('input[type=text]').value.trim(); if (q) D.goSearch('jackgle', q); });
      const lucky = f.querySelector('[data-jgl]'); if (lucky) lucky.addEventListener('click', () => feelingJacky(f.querySelector('input[type=text]').value.trim()));
    });
    el.querySelectorAll('[data-jghome]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('Make Jackgle! your Home Page', "Jack says: \"No. The Home button is for JACK ATTACK! Online. That's the rules of this computer.\"\n\n(You can still put Jackgle! in your Favorites.)", 'info'); }));
  }
  const jgForm = (q, big) => `<form class="${big ? 'jg-form' : ''}" data-jgs autocomplete="off"><input type="text" maxlength="80" value="${esc(q || '')}" aria-label="Search the web with Jackgle!">${big ? '<div class="jg-btns">' : ''}<button class="btn" type="submit">Jackgle Search</button>${big ? '<button class="btn" type="button" data-jgl>I\'m Feeling Jacky</button></div>' : ''}</form>`;
  const jgFoot = () => `<div class="jg-foot"><a href="${JGH}/about.html">About Jackgle!</a> - <a href="${JGH}/jobs.html">Jobs</a> - <a href="${JGH}/advanced.html">Advanced Search</a><br>&copy;1999 Jackgle! Inc. Made in a garage. Mind the lawnmower.</div>`;
  const JG = {
    home(el) {
      el.innerHTML = `<div class="jg-home">${jgLogo()}${jgForm('', 1)}<div class="jg-n">Searching <b class="jg-cnt">${D.count ? fmt(D.count) : '...'}</b> web pages</div><div class="jg-links"><a href="${JGH}/about.html">About Jackgle!</a> - <a href="${JGH}/jobs.html">Jobs</a> - <a href="${JGH}/advanced.html">Advanced Search</a> - <a href="#" data-jghome>Make Jackgle! your Home Page</a></div>
<div class="jg-n">Jackgle! has answered <b class="jg-today">...</b> searches today.</div></div>${jgFoot()}`;
      jgWire(el); liveNum(el, '.jg-today', jgDayKey(), false);
      D.ready().then(ix => { const n = el.querySelector('.jg-cnt'); if (n) n.textContent = fmt(ix.length); });
      setTimeout(() => { const i = el.querySelector('input'); if (i && el.isConnected && innerWidth > 760) i.focus(); }, 200);
    },
    search(el, ctx) {
      const q = ctx.q; D.setQ('jackgle', q); D.setAddr(JGH + '/search?q=' + encodeURIComponent(q).replace(/%20/g, '+'), 'Jackgle! Search: ' + q);
      el.innerHTML = `<div class="jg-top">${jgLogo(true)}${jgForm(q)}</div><div class="jg-out"><p>Searching...</p></div>${jgFoot()}`;
      jgWire(el);
      if (!q) { el.querySelector('.jg-out').innerHTML = '<p class="jg-none">Type some words in the box. Jackgle! will find them. That is its whole job.</p>'; return; }
      kv.inc(jgDayKey());
      D.search(q, 'jackgle').then(r => {
        const out = el.querySelector('.jg-out'), PER = 10; let page = 0;
        const self = /^jackgle!?$/i.test(q.trim());
        if (self) secret('eng.didyoumean');
        const dym = self ? 'jackgle' : (r.n < 3 ? D.didYouMean(q) : '');
        const words = r.words;
        const draw = () => {
          const slice = r.hits.slice(page * PER, page * PER + PER), pages = Math.ceil(r.n / PER);
          out.innerHTML = `<div class="jg-bar"><span>${r.related ? `Pages similar to <b>${esc(r.related.url.replace(/^http:\/\//, ''))}</b>` : `Searched ${fmt(D.count)} pages for <b>${esc(q)}</b>`}.</span><span>Results <b>${r.n ? page * PER + 1 : 0} - ${Math.min(r.n, page * PER + PER)}</b> of about <b>${fmt(r.n)}</b>. That took <b>${r.secs.toFixed(2)}</b> seconds.</span></div>`
            + (dym ? `<div class="jg-dym">Did you mean: ${qlink('jackgle', dym, esc(dym))}?</div>` : '')
            + (self ? '<p class="small" style="color:#555">(Yes, you spelt it right. We just like hearing it.)</p>' : '')
            + (r.n ? slice.map((h, i) => `<div class="jg-r"><a href="#" class="t" data-jh="${page * PER + i}">${esc(h.e.title)}</a><div class="s">${h.snip}</div><div class="u">${esc(h.e.url.replace(/^http:\/\//, ''))} - ${h.e.size || 2}k - <a href="#" data-jc="${page * PER + i}">Cached</a> - <a href="#" data-jsim="${esc(h.e.url)}">Similar pages</a></div></div>`).join('')
              : `<div class="jg-none">Your search - <b>${esc(q)}</b> - did not match any pages.<br><br>Suggestions:<ul><li>Check the spelling. (Then check it again. Then ask Dave. Actually, don't ask Dave.)</li><li>Try different words.</li><li>Try fewer words.</li><li>Try ${qlink('waaaghooo', q, 'the big directory')} instead. (Don't tell them we sent you.)</li></ul></div>`)
            + (pages > 1 ? `<div class="jg-pg">Result Page: ${page ? '<a href="#" data-jp="-1">Previous</a>' : ''}${Array.from({ length: Math.min(pages, 12) }, (_, i) => i === page ? `<b>${i + 1}</b>` : `<a href="#" data-jg="${i}">${i + 1}</a>`).join('')}${page + 1 < pages ? '<a href="#" data-jp="1">Next</a>' : ''}</div>` : '')
            + `<div style="text-align:center;margin:14px 0">${jgForm(q)}</div>`;
          jgWire(out);
          out.querySelectorAll('[data-jh]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); D.openHit(r.hits[+a.dataset.jh].e); }));
          out.querySelectorAll('[data-jc]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); cached(r.hits[+a.dataset.jc].e, words); }));
          out.querySelectorAll('[data-jsim]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); D.goSearch('jackgle', 'related:' + a.dataset.jsim.replace(/^http:\/\//, '')); }));
          out.querySelectorAll('[data-jp]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); page += +a.dataset.jp; draw(); el.scrollIntoView({ block: 'start' }); }));
          out.querySelectorAll('[data-jg]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); page = +a.dataset.jg; draw(); el.scrollIntoView({ block: 'start' }); }));
        };
        draw(); sfx('click');
      });
    },
    about(el) {
      const k = String(t99().m).padStart(2, '0') + '-' + String(t99().d).padStart(2, '0');
      const TL = [['1996', 'Two students start a search engine on a university computer. It is called something else. Nobody can spell it.'], ['1998', 'They move into a garage. The garage has a ping-pong table, a fridge and a lawnmower. The servers go next to the lawnmower.'], ['01-01', 'Jackgle! answers its first search of 1999. It was "jackgle". (It was us.)'], ['03-03', 'Somebody who is not us uses Jackgle!. We have a small party.'], ['06-07', 'We get a proper office. (Another garage. A bigger one.)'], ['09-21', 'We take the BETA sign off the logo! There is cake. The cake also says BETA, because the bakery was confused.'], ['11-11', 'The servers now have a fan each. Some of them are Jackgle! fans too.']].filter(x => x[0].length === 4 || x[0] <= k);
      el.innerHTML = `<div class="jg-top">${jgLogo(true)}<b>About Jackgle!</b></div><div class="jg-page"><h2>Jackgle! was made in a garage</h2>
<p>Jackgle! was started by <b>two students in a garage</b> who should have been doing their homework. They noticed something: if lots of pages link to a page, it's probably a good page. So Jackgle! counts the links. More links in = higher up the results. That's it. That's the trick.</p>
<p>(Unless it's Dave's page. Everybody links to Dave's page to laugh at it. We are working on that.)</p>
<p>Other search engines put the most adverts on the front page. We put one box and two buttons. Our front page is so small it loads in under a second, even on a 28.8K modem, even when Mom is on the phone. (OK, not when Mom is on the phone.)</p>
<h3>What's in the garage</h3><ul><li>Lots of cheap PCs with the cases taken off, stacked on shelves. They get hot. We bought a fan.</li><li>${fmt(D.count || 400)} web pages in the index. Every single one on the JackNet.</li><li>One extension lead. Please do <b>not</b> unplug the extension lead.</li></ul>
<h3>Our story so far (1999)</h3><ul class="jg-tl">${TL.map(x => `<li><b>${x[0].length === 4 ? x[0] : x[0].slice(3) + '/' + x[0].slice(0, 2) + '/99'}</b>${esc(x[1])}</li>`).join('')}</ul>
<p>Everyone says the big portals have already won the search wars. We think this might catch on anyway.</p><p><a href="${JGH}/jobs.html">We're hiring!</a></p></div>${jgFoot()}`;
    },
    jobs(el) {
      const JOBS = [['Spider Wrangler', 'Look after our web spiders. They crawl every page on the JackNet every night and come back hungry.', 'Must not be scared of spiders. Must be OK with them being imaginary.'], ['Garage Door Engineer', 'The garage door sticks. The servers need air. This is the most important job in the company.', 'Must bring own oil can.'],
        ['Junior Webmaster', 'Make the logo slightly more colourful. Then less colourful. Then back again.', 'Must know HTML. Must not use the &lt;blink&gt; tag. We mean it.'], ['Chief Biscuit Officer', 'Make sure there are always biscuits. Report to the board (the ping-pong table).', 'Custard creams preferred.']];
      el.innerHTML = `<div class="jg-top">${jgLogo(true)}<b>Jobs at Jackgle!</b></div><div class="jg-page"><h2>Come and work in our garage!</h2><p>Jackgle! is growing fast. We now have so many staff that two of them have to sit on the lawnmower. Perks: free crisps, a ping-pong table, and you can tell people you work on "the Internet".</p>
${JOBS.map((j, i) => `<div class="jg-job"><b>${j[0]}</b><br>${j[1]}<br><i>${j[2]}</i><br><button class="btn" type="button" data-job="${i}">Apply now</button></div>`).join('')}<p class="small">Jackgle! is an equal-opportunity garage. Humans, robots and Jedi all welcome. No Furbies (they chew the cables).</p></div>${jgFoot()}`;
      el.querySelectorAll('[data-job]').forEach(b => b.addEventListener('click', () => Desk.ask('Apply: ' + JOBS[+b.dataset.job][0], 'Tell us why you want the job (one line, no real names or addresses please):', '', 60, v => {
        if (!v || !v.trim()) return; secret('eng.jobs'); sfx('solve');
        Desk.msgbox('Jackgle! Jobs', `Thanks for applying to be our ${JOBS[+b.dataset.job][0]}!\n\nYou said: "${v.trim().slice(0, 60)}"\n\nWe will get back to you in 6-8 weeks. (We are very busy. We only have three phones and one of them is a toy.)`, 'info');
      })));
    },
    advanced(el) {
      el.innerHTML = `<div class="jg-top">${jgLogo(true)}<b>Advanced Search</b></div><div class="jg-page"><form data-jga autocomplete="off"><table class="jg-adv"><tr><td><b>Find results</b></td><td>with <b>all</b> of the words</td><td><input type="text" name="all"></td></tr><tr><td></td><td>with the <b>exact phrase</b></td><td><input type="text" name="ph"></td></tr><tr><td></td><td><b>without</b> the words</td><td><input type="text" name="not"></td></tr><tr><td><b>Site</b></td><td>only from the site</td><td><input type="text" name="site" placeholder="e.g. jackattack.jnet"></td></tr><tr><td><b>Similar</b></td><td>pages like this address</td><td><input type="text" name="rel" placeholder="e.g. www.davesplace.jnet"></td></tr></table><p><button class="btn" type="submit">Jackgle Search</button></p></form><p class="small">Tip: you can type all of these straight into the normal box too: <i>+word</i>, <i>-word</i>, <i>site:host</i>, <i>related:address</i>.</p></div>${jgFoot()}`;
      const f = el.querySelector('[data-jga]');
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        if (f.rel.value.trim()) return D.goSearch('jackgle', 'related:' + f.rel.value.trim().replace(/^https?:\/\//, ''));
        const q = [f.all.value, f.ph.value, f.not.value.split(/\s+/).filter(Boolean).map(w => '-' + w).join(' '), f.site.value.trim() ? 'site:' + f.site.value.trim() : ''].join(' ').replace(/\s+/g, ' ').trim();
        if (q) D.goSearch('jackgle', q);
      });
    },
  };
  // the cached copy: open the page, then put Jackgle's banner on top and colour in the search words
  const HL = ['#ffff66', '#a0ffff', '#99ff99', '#ff9999', '#ff66ff'];
  function cached(e, words) {
    secret('eng.cache');
    D.openHit(e);
    setTimeout(() => {
      const sec = document.querySelector('#pane .sec.on'); if (!sec) return;
      const old = sec.querySelector(':scope > .jg-cache'); if (old) old.remove();
      const b = document.createElement('div'); b.className = 'jg-cache';
      b.innerHTML = `${jgLogo(true)}<b>This is Jackgle's cache of <a href="#" data-live>${esc(e.url)}</a>.</b><br>It's a snapshot of the page that our spider took when it last crawled past (on ${esc(dmy())}, at 56K). The real page may have changed since then. <a href="#" data-live>Click here for the live page.</a><br>${words.length ? 'Jackgle! has coloured in your search words: ' + words.slice(0, 5).map((w, i) => `<mark style="background:${HL[i % HL.length]}">${esc(w)}</mark>`).join(' ') : ''}<br><small>Jackgle! did not make this page and is not responsible for it. Especially if it's Dave's.</small>`;
      sec.prepend(b);
      b.querySelectorAll('[data-live]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); b.remove(); D.openHit(e); }));
      const off = () => { b.remove(); document.removeEventListener('section', off); };
      setTimeout(() => document.addEventListener('section', off), 50);
      setTimeout(() => highlight(sec, words, b), 700);
    }, 150);
  }
  function highlight(root, words, skip) {
    words = words.filter(w => w.length > 1).slice(0, 5); if (!words.length || !root.isConnected) return;
    const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (!n.nodeValue.trim() || (skip && skip.contains(n)) || n.parentNode.closest('script,style,textarea,input,select,mark,canvas,svg')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; let n; while ((n = tw.nextNode()) && nodes.length < 400) { re.lastIndex = 0; if (re.test(n.nodeValue)) nodes.push(n); }
    let made = 0;
    for (const t of nodes) {
      if (made > 80) break;
      const frag = document.createDocumentFragment(); let last = 0; const s = t.nodeValue; re.lastIndex = 0; let m;
      while ((m = re.exec(s))) { frag.appendChild(document.createTextNode(s.slice(last, m.index))); const mk = document.createElement('mark'); mk.className = 'jg-hl'; mk.style.background = HL[words.indexOf(m[1].toLowerCase()) % HL.length] || HL[0]; mk.textContent = m[1]; frag.appendChild(mk); last = m.index + m[1].length; made++; }
      frag.appendChild(document.createTextNode(s.slice(last))); t.parentNode.replaceChild(frag, t);
    }
  }

  // ================================================================ Ask Gubbinz
  const AGH = 'http://www.askgubbinz.find';
  const butler = () => `<svg class="ag-butler" viewBox="0 0 130 150" aria-hidden="true"><path d="M30 150l8-46q27-14 54 0l8 46z" fill="#1a1a1a"/><path d="M52 98l13 40 13-40z" fill="#fff"/><path d="M58 112h14" stroke="#ccc"/><circle cx="65" cy="120" r="1.6" fill="#333"/><circle cx="65" cy="128" r="1.6" fill="#333"/>
<path d="M14 40l30 12-6 12zM116 40l-30 12 6 12z" fill="#5ab02a" stroke="#1a4a0a" stroke-width="2"/><ellipse cx="65" cy="62" rx="30" ry="28" fill="#6ac83a" stroke="#1a4a0a" stroke-width="2"/>
<ellipse cx="54" cy="56" rx="7" ry="6" fill="#fff"/><ellipse cx="76" cy="56" rx="7" ry="6" fill="#fff"/><circle cx="55" cy="57" r="3" fill="#c00"/><circle cx="77" cy="57" r="3" fill="#c00"/><path d="M45 46l14 4M85 46l-14 4" stroke="#1a4a0a" stroke-width="3"/>
<path d="M65 60l-4 9h8z" fill="#4a9a2a"/><path d="M48 76q17 12 34 0" fill="#3a0000" stroke="#1a4a0a" stroke-width="2"/><path d="M52 77l3 5 3-4 3 5 3-5 3 5 3-4 3 5 3-5" fill="#fff" stroke="#fff" stroke-width=".5"/>
<path d="M48 94l17 7-17 7zM82 94l-17 7 17 7z" fill="#c00" stroke="#600"/><circle cx="65" cy="101" r="3.4" fill="#e10600" stroke="#600"/>
<path d="M98 112q14-8 26-2" stroke="#1a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M104 100h26" stroke="#888" stroke-width="3"/><path d="M107 99q10-18 20 0z" fill="#ccc" stroke="#666"/><circle cx="117" cy="84" r="2" fill="#999"/></svg>`;
  const agHead = () => `<div class="ag-head"><a class="ag-logo" href="${AGH}/">Ask <b>Gubbinz</b>!</a><span class="ag-tag">The butler of the JackNet<br>Questions answered in plain English since 1999</span></div>`;
  const KEYHOLE = ['Where can I find cheats for Ocarina of Time?', 'How do I paint flames on a model car?', 'Is the Millennium Bug real?', 'Where can I see a hamster on the Internet?', 'What is a webring?', 'How do I get free e-mail?', 'Who is Dave?', 'Why is Jar Jar?', 'Where can I spend my Rupees?', 'How fast is a 56K modem?', 'What does BETA mean?', 'Where is the Hobby Corner?', 'Is Pokemon out in England yet?'];
  const agForm = q => `<form class="ag-form" data-ags autocomplete="off"><label for="agq"><b>Ask Gubbinz a question in plain English:</b></label><input id="agq" type="text" maxlength="100" value="${esc(q || '')}" placeholder="e.g. Where can I find GoldenEye cheats?"><div class="row2"><button class="btn" type="submit">Ask!</button><span class="small">Gubbinz will find the answer. Probably.</span></div></form>`;
  const agFoot = () => `<p class="small" style="text-align:center;margin-top:16px"><a href="${AGH}/about.html">About your butler</a> - Questions answered: <b class="ag-n">...</b> - &copy;1999 Ask Gubbinz. Gubbinz is not responsible for answers given before his tea.</p>`;
  function agWire(el) { el.querySelectorAll('[data-ags]').forEach(f => f.addEventListener('submit', ev => { ev.preventDefault(); const q = f.querySelector('input').value.trim(); if (q) D.goSearch('askgubbinz', q); })); liveNum(el, '.ag-n', 'eng.ask.n', false); }
  const PHRASE = [['info', 'Where can I find information about %?'], ['pics', 'Where can I see a picture of %?'], ['fans', 'Where can I find a fan page about %?'], ['buy', 'Where can I buy % with Rupees?'], ['why', 'Why is %?']];
  function special(l) {
    if (/\b(who|what) (are|is) (you|gubbinz)\b|about (you|gubbinz)/.test(l)) return ['Me, sir? I am Gubbinz. Desktop helper, pet, poet and, since this year, butler. Master Jack gave me the bow tie. I have only eaten one corner of it.', ['go:grot', 'Visit Gubbinz on JACK ATTACK!']];
    if (/meaning of life/.test(l)) return ['The meaning of life, sir, is 42. I looked it up in a book about hitchhiking. Twice.', null];
    if (/\b(time|date|day is it|what day|year)\b/.test(l)) return [`It is ${longDate()}, sir. Same as yesterday, only one more.`, null];
    if (/\bjack\b|jack attack/.test(l)) return ['Master Jack, sir? He made this whole computer. He likes video games, sci-fi, Rubik\'s cubes, Tetris and painting little models. Mostly video games.', ['go:home', 'JACK ATTACK! Online']];
    if (/how are you/.test(l)) return ['Very well, thank you for asking. Nobody ever asks the butler.', null];
    if (/homework|maths|spelling test/.test(l)) return ['I cannot do your homework, sir. I ate the last lot. It was algebra. It was dry.', null];
    if (/millennium|y2k|year 2000/.test(l)) return ['Nobody knows what the Millennium Bug will do, sir. I have filled the bath and hidden the biscuits. Just in case.', null];
    if (/weather|rain/.test(l)) return ['It will rain, sir. It is always going to rain. But here is the forecast.', ['url:http://www.jackattack.jnet/weather', 'JackNet Weather']];
    return null;
  }
  const AG = {
    home(el) {
      el.innerHTML = `${agHead()}<div class="ag-hero">${butler()}<div class="ag-bub"><p style="margin:0 0 6px">Good day! I am <b>Gubbinz</b>, your butler. Type a question in plain English and I shall fetch the answer from the JackNet on a silver tray.</p>${agForm('')}</div></div>
<div class="ag-box"><h3>Peek through the keyhole: what other people are asking</h3><ul class="ag-key">${KEYHOLE.slice(0, 5).map(q => `<li>${qlink('askgubbinz', q)}</li>`).join('')}</ul></div>
<div class="ag-box"><h3>Gubbinz's tip of the day</h3><p style="margin:0">${esc(['Ask a whole question, like you would ask your Nan. "Where can I find podracing?" works better than "pod".', 'If I cannot find it, try Jackgle!. Those garage boys are very quick. Too quick, if you ask me.', 'Never type your real name or address into a website. Not even mine. A good butler never asks.', 'Questions with "please" in them get answered first. That is just good manners.'][D.dayOfYear() % 4])}</p></div>${agFoot()}`;
      agWire(el);
      const ul = el.querySelector('.ag-key'); let k = 5;
      const t = setInterval(() => { if (!ul.isConnected) return clearInterval(t); const li = document.createElement('li'); li.innerHTML = qlink('askgubbinz', KEYHOLE[k++ % KEYHOLE.length]); ul.prepend(li); if (ul.children.length > 5) ul.lastElementChild.remove(); }, 4000);
    },
    ask(el, ctx) {
      const q = ctx.q; D.setQ('askgubbinz', q); D.setAddr(AGH + '/ask?q=' + encodeURIComponent(q).replace(/%20/g, '+'), 'Ask Gubbinz: ' + q);
      el.innerHTML = `${agHead()}<div class="ag-out"></div>${agForm(q)}${agFoot()}`; agWire(el);
      const out = el.querySelector('.ag-out');
      if (!q) { out.innerHTML = `<div class="ag-no">${icon('bowtie', 'wdx-bt')} <span class="ag-says">You didn't ask anything, sir. I am excellent at answering nothing, but it makes for a short page.</span></div>`; return; }
      if (D.RUDE.test(q)) { secret('eng.rude'); sfx('uhoh'); out.innerHTML = `<div class="ag-no" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${butler()}<div><p class="ag-says" style="font-size:16px">I'm terribly sorry, but a butler does not repeat language like that.</p><p>Perhaps you could ask again the way you would ask your Nan? I shall wait. I am very good at waiting. It is most of the job.</p></div></div>`; return; }
      kv.inc('eng.ask.n');
      const l = fold(q), subj = D.subject(q), sp = special(l), dm = D.dirMatch(q).sites.slice(0, 5);
      D.search(q, 'dir').then(r => {
        const have = new Set(dm.map(e => D.normU(e.url))), web = r.hits.filter(h => !have.has(D.normU(h.e.url))).slice(0, 6);
        const all = dm.map(e => ({ e: { title: e.title, url: e.url, desc: e.desc, dir: e }, snip: esc(e.desc) })).concat(web);
        out.innerHTML = `<p>You asked: <b>${esc(q)}</b></p>`
          + (sp ? `<div class="ag-q" style="align-items:flex-start">${icon('bowtie', 'wdx-bt')}<div><span class="ag-says">${esc(sp[0])}</span>${sp[1] ? `<br><a href="#" data-agsp="${esc(sp[1][0])}">${esc(sp[1][1])} &raquo;</a>` : ''}</div></div>` : '')
          + (sp ? '' : `<p><b>I know the answers to these questions:</b></p>`
          + `<div class="ag-q"><span>${PHRASE[0][1].replace('%', '<b>' + esc(subj) + '</b>')}</span><button class="btn" type="button" data-aga="info">Ask</button></div>`
          + `<div class="ag-q"><select aria-label="Another question">${PHRASE.slice(1).map(p => `<option value="${p[0]}">${esc(p[1].replace('%', subj))}</option>`).join('')}</select><button class="btn" type="button" data-aga="sel">Ask</button></div>`)
          + (all.length ? `<div class="ag-box"><h3>I also found these on the JackNet:</h3>${all.map((h, i) => `<div class="ag-res"><a href="#" data-agh="${i}"><b>${esc(h.e.title)}</b></a><br>${h.snip}<br><span class="u">${esc(h.e.url.replace(/^http:\/\//, ''))}</span></div>`).join('')}</div>`
            : `<div class="ag-no"><span class="ag-says">I have looked everywhere, sir, including behind the sofa. Nothing. Perhaps try ${qlink('jackgle', q, 'Jackgle!')}? They are very fast. Suspiciously fast.</span></div>`);
        const openH = h => (h.e.dir ? D.open(h.e.dir) : D.openHit(h.e));
        out.querySelectorAll('[data-agh]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); openH(all[+a.dataset.agh]); }));
        out.querySelectorAll('[data-agsp]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const v = a.dataset.agsp; if (v.startsWith('go:')) { $('browser').classList.remove('min'); IE.go(v.slice(3), 'click'); } else IE.navigate(v.slice(4)); }));
        out.querySelectorAll('[data-aga]').forEach(b => b.addEventListener('click', () => {
          const kind = b.dataset.aga === 'sel' ? out.querySelector('.ag-q select').value : 'info';
          if (kind === 'why') return Desk.msgbox('Ask Gubbinz', `Why is ${subj}?\n\nI'm afraid nobody knows why, sir. Some things just are. Like Dave.`, 'info');
          if (kind === 'buy') return IE.navigate('http://www.rupeeshop.jnet/');
          let pool = all;
          if (kind === 'pics') pool = all.filter(h => /photo|picture|gallery|cam|art/i.test(h.e.title + ' ' + (h.e.desc || '') + ' ' + h.e.url)).concat(all);
          if (kind === 'fans') pool = all.filter(h => (h.e.dir && h.e.dir.cat === 'fans') || /fan|shrine|club/i.test(h.e.title)).concat(all);
          if (pool.length) { sfx('pet'); openH(pool[0]); } else Desk.msgbox('Ask Gubbinz', "I couldn't find that one, sir. I did find a biscuit, though. Would you like the biscuit?", 'info');
        }));
        sfx('pet');
      });
    },
    about(el) {
      el.innerHTML = `${agHead()}<div class="ag-hero">${butler()}<div class="ag-bub"><h3 style="margin:0 0 6px;font:italic bold 18px Georgia,serif;color:#6a1020">About your butler</h3><p><b>Name:</b> Gubbinz<br><b>Job:</b> Butler (since this year). Before that: desktop helper, pet, poet, search engine (JackSearch, in a shoebox).<br><b>Uniform:</b> one tiny bow tie (red), one jacket (borrowed from a teddy bear).<br><b>Skills:</b> fetching, carrying, finding, eating the evidence.<br><b>Dislikes:</b> rude words, baths, the word "cute".</p><p>Gubbinz answers questions in plain English. He reads your question, works out what you really meant, then fetches the best pages on the JackNet. If he can't find it, he blames the spiders.</p></div></div>${agFoot()}`;
      agWire(el);
    },
  };

  // ================================================================ LINK-O-RAMA (the magazine's Cool Links page)
  const LOR = { intro: "Every single site on the JackNet that I know about, all in one place, with buttons! If your site isn't here, write in on the Letters page and I'll add it. (Unless it's rubbish. Then I'll add it anyway, because I'm nice.)", cats: {}, engines: {}, sotd: ['Go and look at it. Now. I\'ll wait.', 'Best thing I found all week.', 'Dave showed me this one. For once Dave was right.', 'Trust me on this one.'] };
  const JUMP = { games: 'Games', fun: 'Fun', fans: 'Fans', sw: 'Galaxy', sci: 'Science', hobby: 'Hobbies', mates: 'Mates', comm: 'Talk', news: 'News & Shops', soft: 'Software', help: 'Searching', weird: 'Weird' };
  function linkorama(el, Dat) {
    const L = Object.assign({}, LOR, (Dat && Dat.linkorama) || {}), C = D.cats(), bc = D.byCat(), all = D.list(), sotd = D.siteOfDay();
    const ENGS = [['waaaghooo', 'http://www.waaaghooo.find/'], ['grot', 'http://www.jacksearch.find/'], ['lookhere', 'http://www.lookhere.infobahn/'], ['gubbinz', 'http://www.askgubbinz.find/'], ['jackgle', 'http://www.jackgle.find/']]; // biggest first, like 1999
    const EN = { jackgle: 'Two students in a garage. One box. VERY fast. Dave says it\'s the future. Dave also said that about his rollerblades.', waaaghooo: 'The biggest! Every site sorted into categories by hand. Cool! sites get sunglasses.', grot: 'The old big one. Loads of buttons, a Family Filter (Mom set it) and you can read the results in Pirate.', gubbinz: 'Ask a proper question and Gubbinz the butler fetches the answer. He has a bow tie now.', lookhere: 'A start page with news, telly, horoscopes and a search box. Mom\'s favourite.' };
    let view = store.get('jhp_eng_lov', 'buttons');
    const clicked = () => { try { return JSON.parse(localStorage.getItem('jhp_eng_btn') || '[]').length; } catch (e) { return 0; } };
    const catHtml = k => { const list = (bc[k] || []).slice().sort((a, b) => D.pop(b) - D.pop(a)); if (!list.length) return ''; return `<div class="lo-cat" id="lo-${k}"><h3>${esc(C[k])} <small>(${list.length} site${list.length === 1 ? '' : 's'})</small></h3><p class="lo-jack">${esc((L.cats && L.cats[k]) || '')}</p>${view === 'text' ? `<ul class="lo-txt">${list.map(e => `<li>${e.cool ? shades() : ''}<a href="#" data-wdl="${esc(e.id)}">${esc(e.title)}</a>${e.isNew ? newb() : ''}<small>${esc(e.desc)}</small><small class="u">${esc(e.url.replace(/^http:\/\//, ''))}</small></li>`).join('')}</ul>` : `<div class="lo-wall">${list.map(e => D.badge(e)).join('')}</div>`}</div>`; };
    const draw = () => {
      el.innerHTML = `<div class="lo"><div class="lo-head"><span class="lo-t">LINK-O-RAMA!!!</span><span class="lo-n">${all.length} SITES!</span></div>
<p class="kicker">${esc(L.intro)}</p>
<div class="lo-jump"><b>JUMP TO:</b><a href="#" data-loj="top">Top 20</a><a href="#" data-loj="engines">Search Engines</a>${Object.keys(C).filter(k => bc[k] && bc[k].length).map(k => `<a href="#" data-loj="${k}">${esc(JUMP[k] || C[k].split(/[ ,&]/)[0])}</a>`).join('')}<a href="#" data-loj="secret">Secret pages</a></div>
<h3 id="lo-top">THE JACKNET TOP 20 <small>(the most visited sites on the whole Web this week)</small></h3><div class="lo-top20" style="display:flex;flex-wrap:wrap;gap:6px 10px;margin:4px 0 6px">${D.hot(20).map((e, i) => `<span style="display:inline-flex;align-items:center;gap:4px"><b style="font:bold 14px Arial,sans-serif;min-width:22px;text-align:right">${i + 1}.</b>${D.badge(e)}</span>`).join('')}</div><p class="small" style="margin:0 0 10px">Full chart: <a href="#" data-lou="http://www.waaaghooo.find/hot100.html">the WAAAGHooo! Hot 100</a>. (Jack ATTACK! is in it. Tell your mates to visit more so we go up.)</p><h3 id="lo-engines">THE SEARCH ENGINES</h3><p class="lo-jack">${esc(L.enginesIntro || "There's a war on. Four search engines, all trying to be the biggest on the JackNet. Try them all and pick a side. (I've picked one. Not telling.)")}</p>
<div class="lo-eng">${ENGS.map(([k, u]) => `<div class="lo-e">${k === 'lookhere' ? '<span class="wdx-lg" style="color:#c00;font:bold italic 22px Georgia,serif">Look<span style="color:#000080">Here!</span></span>' : D.provLogo(k)}<p>${esc((L.engines && L.engines[k]) || EN[k])}</p><a class="btn" href="#" data-lou="${u}">Go!</a></div>`).join('')}</div>
<form class="lo-sall" autocomplete="off"><span>Search the whole JackNet:</span><input type="text" maxlength="60" aria-label="Search the whole JackNet"><button class="btn" type="submit" data-los="waaaghooo">WAAAGHooo!</button><button class="btn" type="submit" data-los="jackgle">Jackgle!</button><button class="btn" type="submit" data-los="grot">JackSearch</button><button class="btn" type="submit" data-los="askgubbinz">Ask Gubbinz</button></form>
<div class="lo-two"><div class="sbox y lo-sotd"><div class="lo-st">&#9733; SITE OF THE DAY &#9733; <small style="font:12px var(--ui);color:#000">${esc(dmy())}</small></div>${sotd ? `${D.badge(sotd, { still: true }).replace('data-wd=', 'data-wdsotd="1" data-wd=')}<h4>${esc(sotd.title)}</h4><p style="margin:0 0 6px">${esc(sotd.desc)}</p><p class="lo-jack" style="margin:0">Jack says: ${esc(L.sotd[hash('s' + D.dayOfYear()) % L.sotd.length])}</p><p style="margin:6px 0 0;clear:both"><a href="#" data-wd="${esc(sotd.id)}" data-wdsotd="1"><b>Go there now! &raquo;</b></a></p>` : ''}</div>
<div class="lo-rand"><button type="button" data-lor>SURF SOMEWHERE RANDOM!</button><small>Times I've been sent somewhere random: <b class="lo-rn">${store.get('jhp_eng_rand', 0)}</b></small></div></div>
<div class="lo-view"><b>View:</b><label><input type="radio" name="lov" value="buttons"${view === 'buttons' ? ' checked' : ''}> Buttons</label><label><input type="radio" name="lov" value="text"${view === 'text' ? ' checked' : ''}> Text-only version (for 14.4K modems)</label></div>
<div class="lo-prog">Buttons you've clicked: <b>${clicked()}</b> of ${all.length}. Hover over a button to see where it goes (look at the bottom of the window).</div>
${Object.keys(C).map(catHtml).join('')}
<div class="lo-key">${newb()} = new this month &middot; ${shades()} = Cool! (I liked it) &middot; Want your own 88x31 button on here? Make one in Paint, 88 pixels by 31 pixels, then write in!</div></div>`;
      el.querySelectorAll('[data-loj]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const t = a.dataset.loj === 'secret' ? document.getElementById('lo-secret') : el.querySelector('#lo-' + a.dataset.loj); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
      el.querySelectorAll('[data-lou]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); sfx('click'); $('browser').classList.remove('min'); IE.navigate(a.dataset.lou); }));
      const f = el.querySelector('.lo-sall'); let which = 'waaaghooo';
      f.querySelectorAll('[data-los]').forEach(b => b.addEventListener('click', () => { which = b.dataset.los; }));
      f.addEventListener('submit', ev => { ev.preventDefault(); const q = f.querySelector('input').value.trim(); if (q) D.goSearch(which, q); which = 'waaaghooo'; });
      el.querySelector('[data-lor]').addEventListener('click', () => { D.surfRandom(); });
      el.querySelectorAll('input[name=lov]').forEach(r => r.addEventListener('change', () => { view = r.value; store.set('jhp_eng_lov', view); draw(); }));
    };
    draw();
  }

  // ================================================================ dispatch
  const VIEWS = { waaaghooo: WG, jackgle: JG, askgubbinz: AG };
  function render(el, ctx) {
    const V = VIEWS[ctx.eng], fn = V && (V[ctx.view] || V.home);
    el.innerHTML = ''; fn(el, ctx);
    if (ctx.eng === 'waaaghooo') wgWire(el, ctx);
  }
  window.WebEnginesP = { render, linkorama, cached, orkAnswers };
})();

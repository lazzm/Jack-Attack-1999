/* events-guide: WHAT'S ON? (www.whatson.jnet), CYBERTEXT (the JackNet text service, www.whatson.jnet/text.html),
 * the Event Room window for whatever is on right now, and Theme Night decorations for the Hangout.
 * Loaded by js/events.js the first time any of them is needed. */
(function () {
  'use strict';
  const Ev = window.Ev, C = window.EventsCat, A = window.Apps; if (!Ev || !C || !A || window.EvGuide) return;
  const { esc, h, sfx } = Ev, $ = id => document.getElementById(id);
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DEF = {}; for (const e of C.EVENTS) DEF[e.id] = e;
  const themeName = x => (C.THEMES.find(t => t.id === x) || {}).n || '';
  const date99 = md => new Date(1999, Math.floor(md / 100) - 1, md % 100);
  const dayLabel = md => { const d = date99(md); return `${DAYS[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
  const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 3600 ? Math.floor(s / 3600) + 'h ' + String(Math.floor(s / 60) % 60).padStart(2, '0') + 'm' : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const title = o => (o.id === 'theme' && o.x ? `${DEF.theme.n}: ${themeName(o.x)}` : DEF[o.id].n);
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };

  css('evGuideCss', `
.wo{background:#fff8e0;color:#1a1a1a;font:13px/1.4 Verdana,Arial,sans-serif;min-height:100%;padding:0 0 20px}
.wo-mast{background:#e10600;color:#fff;padding:10px 14px 8px;border-bottom:6px solid #ffd400;display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
.wo-mast h1{margin:0;font:italic 900 40px/0.95 "Arial Black",Impact,sans-serif;letter-spacing:-1px;text-shadow:3px 3px 0 #000}
.wo-mast h1 b{color:#ffd400}
.wo-mast .wo-sub{font:bold 12px Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px}
.wo-mast .wo-price{margin-left:auto;background:#ffd400;color:#000;font:bold 11px Arial;padding:4px 8px;transform:rotate(3deg);border:2px solid #000}
.wo-wrap{max-width:820px;margin:0 auto;padding:10px 12px}
.wo-now{border:3px solid #000;background:#000;color:#fff;margin:10px 0;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;box-shadow:4px 4px 0 #e10600}
.wo-now .wo-on{background:#e10600;color:#fff;font:900 14px "Arial Black",Arial;padding:4px 6px;animation:evblink 1s steps(2) infinite}
.wo-now .wo-t{font:bold 16px Arial,sans-serif;color:#ffd400}
.wo-now .wo-w{font-size:11px;color:#ccc}
.wo-now .btn{font-weight:bold;min-height:32px}
.wo-next{background:#10204a;color:#fff;padding:8px 10px;margin:10px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.wo-next b{color:#ffd400}
.wo-next .wo-cd{margin-left:auto;font:bold 20px "Courier New",monospace;color:#7fff7f;background:#000;padding:2px 8px;border:1px inset #555}
.wo h2{font:900 18px "Arial Black",Arial,sans-serif;margin:16px 0 4px;border-bottom:3px solid #000;text-transform:uppercase}
.wo-day{margin:10px 0;border:2px solid #000;background:#fff}
.wo-day > b{display:block;background:#ffd400;padding:3px 8px;font:bold 13px Arial;text-transform:uppercase;border-bottom:2px solid #000}
.wo-day.today > b{background:#e10600;color:#fff}
.wo-row{display:grid;grid-template-columns:52px 40px minmax(0,1fr);gap:8px;padding:6px 8px;border-top:1px dotted #999}
.wo-row:first-of-type{border-top:0}
.wo-row .tm{font:bold 15px "Arial Narrow",Arial,sans-serif}
.wo-row .ch{font:bold 10px Arial;color:#fff;background:#000080;text-align:center;align-self:start;padding:2px 0;border-radius:3px}
.wo-row .ch.rj{background:#9a1aa8}.wo-row .ch.ev2{background:#1e8a3a}
.wo-row .nm{font-weight:bold}
.wo-row .ds{font-size:12px;color:#333}
.wo-row .pz{font-size:11px;color:#8a1a00;margin-top:2px}
.wo-row.live{background:#fff0a0}
.wo-row.past{opacity:.55}
.wo-row .ck{font-size:11px;margin-top:3px;display:inline-flex;gap:4px;align-items:center;min-height:24px}
.wo-quiet{font-style:italic;color:#666;padding:6px 8px}
.wo-allday{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.wo-allday a{display:block;background:#fff;border:2px solid #000;padding:6px 8px;color:#000;text-decoration:none;box-shadow:3px 3px 0 #ffd400}
.wo-allday a b{color:#e10600}
.wo-res{font-size:12px;background:#fff;border:1px solid #999;padding:6px 8px}
.wo-foot{font-size:10px;color:#555;text-align:center;margin-top:16px}
.wo-ttxlink{display:inline-block;background:#000;color:#ff0 !important;font:bold 13px "Courier New",monospace;padding:4px 10px;border:2px solid #0ff;text-decoration:none}
@media (max-width:560px){.wo-mast h1{font-size:30px}.wo-now{grid-template-columns:minmax(0,1fr)}.wo-row{grid-template-columns:46px minmax(0,1fr)}.wo-row .ch{display:none}}
/* CYBERTEXT */
.ct{background:#000;color:#fff;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:10px;min-height:100%}
.ct-scr{width:100%;max-width:640px;background:#000;font-family:"Courier New",Courier,monospace;font-weight:bold;line-height:1;border:6px solid #2a2a2a;border-radius:12px;padding:6px;box-shadow:0 0 0 2px #555,inset 0 0 30px rgba(255,255,255,.06)}
.ct-r{white-space:pre;height:1.2em;overflow:hidden}
.ct-r span{display:inline-block;height:1.2em;line-height:1.2em;vertical-align:top}
.ct-r.dh{height:2.4em}.ct-r.dh span{transform:scaleY(2);transform-origin:top}
.ct-r .fl{animation:evblink 1s steps(2) infinite}
.ct-r .hid{visibility:hidden}.ct-scr.rev .ct-r .hid{visibility:visible}
.ct-k{display:grid;grid-template-columns:repeat(5,52px);gap:6px}
.ct-k button,.ct-f button{min-height:38px;font:bold 15px Arial;border:2px outset #777;border-radius:4px;cursor:pointer}
.ct-k button{background:#333;color:#fff}
.ct-f{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.ct-f button{min-width:70px;color:#000;font-size:12px}
.ct-help{font:12px Arial,sans-serif;color:#aaa;text-align:center;max-width:600px}
/* the Event Room */
.er{font:12px Tahoma,Verdana,sans-serif;display:flex;flex-direction:column;gap:8px}
.er-top{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:8px 10px;display:flex;gap:10px;align-items:center}
.er-top b{font:bold 15px Arial,sans-serif;display:block}
.er-top .er-cd{margin-left:auto;font:bold 16px "Courier New",monospace;background:#000;color:#7fff7f;padding:2px 6px;border:1px inset #888;white-space:nowrap}
.er-who{min-height:20px}
.er-who span{display:inline-block;background:#ffffe1;border:1px solid #808080;padding:1px 5px;margin:1px;font-size:11px}
.er-board{width:100%;border-collapse:collapse;font-size:12px}
.er-board td{padding:2px 6px;border-bottom:1px solid #ddd}
.er-board tr:first-child td{font-weight:bold;color:#a00}
.er-board td.n{text-align:right;font-family:"Courier New",monospace}
.er-meter{height:26px;border:2px inset #fff;background:#fff;position:relative;overflow:hidden}
.er-meter i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,#e10600 0 10px,#ffd400 10px 20px,#1e8a3a 20px 30px,#2463e0 30px 40px);transition:width .4s}
.er-meter span{position:absolute;inset:0;text-align:center;font:bold 12px/22px Arial;color:#000;text-shadow:0 0 3px #fff}
.er-pop{font:900 22px "Arial Black",Arial !important;min-height:54px !important;width:100%}
.er-feed{font-size:11px;color:#444;min-height:15px}
.er-go{font-weight:bold;min-height:34px}
.er-th{padding:8px;color:#fff;border:2px solid #000}
.er-th b{font:bold 15px "Arial Black",Arial}
.er-conf{position:fixed;inset:0;pointer-events:none;z-index:99999}
/* Theme Night in the Hangout */
.evth-banner{position:relative;margin:4px 0;padding:8px 10px 8px 46px;border:3px double #fff;color:#fff;font:bold 13px Verdana,Arial,sans-serif;overflow:hidden;box-shadow:0 0 0 2px #000}
.evth-banner b{font:900 16px "Arial Black",Arial;letter-spacing:1px;display:block}
.evth-banner small{font-weight:normal;opacity:.9}
.evth-banner .evth-ico{position:absolute;left:8px;top:50%;margin-top:-15px;width:30px;height:30px}
.evth-banner::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.35;background-size:40px 40px}
.evth-stars::after{background-image:radial-gradient(#fff 1px,transparent 1.5px),radial-gradient(#ff0 1px,transparent 1.5px);background-position:0 0,20px 20px}
.evth-zzz::after{background-image:radial-gradient(#ffb0e0 2px,transparent 2.5px)}
.evth-pixels::after{background-image:linear-gradient(90deg,#ff3cff 4px,transparent 4px),linear-gradient(#3cffff 4px,transparent 4px);background-size:24px 24px}
.evth-bats::after{background-image:radial-gradient(ellipse 6px 3px,#000 99%,transparent)}
.evth-sun::after{background-image:radial-gradient(#ffe060 5px,transparent 6px)}
.evth-bolts::after{background-image:radial-gradient(#ff8000 2px,#666 3px,transparent 4px)}
.evth-skull::after{background-image:radial-gradient(#fff 3px,transparent 4px)}
.evth-ball::after{background-image:conic-gradient(#ff0 0 25%,#f0f 0 50%,#0ff 0 75%,#fff 0);background-size:16px 16px;opacity:.25}
@media (prefers-reduced-motion: reduce){.wo-now .wo-on,.ct-r .fl{animation:none}}
`);

  // ================================================================ WHAT'S ON?
  const timers = new Set();
  function every(el, fn, ms) { const t = setInterval(() => { if (!el.isConnected) { clearInterval(t); timers.delete(t); return; } fn(); }, ms); timers.add(t); }
  function page(el) {
    A.secret('evt.whatson');
    el.className = 'wo';
    const draw = () => {
      const now = Ev.now(), week = Ev.week, lv = [...Ev.live.values()];
      const t99 = Desk.today99(), todayMd = t99.md;
      const next = week.filter(o => o.s > now && !Ev.live.has(o.id))[0];
      const byDay = {};
      for (const o of week) if (o.e > now - 3 * 3600000) (byDay[o.md] = byDay[o.md] || []).push(o);
      // the next seven days on the PC's calendar
      const days = []; for (let k = 0; k < 7; k++) { const d = new Date(1999, t99.m - 1, t99.d + k); if (d.getFullYear() !== 1999) break; days.push((d.getMonth() + 1) * 100 + d.getDate()); }
      const rem = Ev.REM();
      const row = o => { const D = DEF[o.id], isLive = Ev.live.has(o.id) && now < o.e, past = now >= o.e; const L = Ev.live.get(o.id);
        return `<div class="wo-row${isLive ? ' live' : ''}${past ? ' past' : ''}"><div class="tm">${Ev.ukTime(o.s)}</div><div class="ch${D.ch === 'RJ1' ? ' rj' : D.ch === 'JN2' ? ' ev2' : ''}">${D.ch}</div><div><div class="nm">${esc(title(o))}${isLive ? ` <span style="color:#e10600">&#9679; ON NOW (${L ? L.here : 0} there)</span>` : ''}</div><div class="ds">${esc(D.d)}${o.id === 'theme' && o.x ? ' <i>' + esc((C.THEMES.find(t => t.id === o.x) || {}).d || '') + '</i>' : ''}</div><div class="pz">&#9733; Prizes: ${esc(D.prize)}. Until ${Ev.ukTime(o.e)}.</div>
          ${isLive ? `<button class="btn" type="button" data-join="${o.id}" style="margin-top:4px;font-weight:bold">JOIN IN!</button>` : past ? '' : `<label class="ck"><input type="checkbox" data-rem="${o.id}"${rem[o.id] ? ' checked' : ''}> Remind me (tray balloon, 10 minutes before)</label>`}</div></div>`; };
      el.innerHTML = `<div class="wo-mast"><div><div class="wo-sub">The JackNet Listings &middot; ${esc(dayLabel(todayMd))} 1999</div><h1>WHAT'S <b>ON?</b></h1></div><div class="wo-price">FREE! (was 45p)</div></div>
        <div class="wo-wrap">
        ${lv.length ? lv.map(L => `<div class="wo-now"><span class="wo-on">ON NOW</span><div><div class="wo-t">${esc(title(L))}</div><div class="wo-w">${L.here | 0} ${L.here === 1 ? 'person' : 'people'} there now${L.who && L.who.length ? ': ' + L.who.slice(0, 8).map(esc).join(', ') : ''}. Ends at ${Ev.ukTime(L.e)}.</div></div><button class="btn" type="button" data-join="${L.id}">JOIN IN!</button></div>`).join('') : ''}
        ${next ? `<div class="wo-next"><span>NEXT UP: <b>${esc(title(next))}</b> at ${Ev.ukTime(next.s)} (UK time), ${esc(dayLabel(next.md))}</span><span class="wo-cd" data-cd="${next.s}">${mmss(next.s - now)}</span></div>` : ''}
        <h2>This week on the JackNet</h2>
        ${days.map(md => { const list = byDay[md] || []; return `<div class="wo-day${md === todayMd ? ' today' : ''}"><b>${md === todayMd ? 'TODAY: ' : ''}${esc(dayLabel(md))}</b>${list.length ? list.map(row).join('') : `<div class="wo-quiet">${esc(['Nothing on tonight. Watch the test card. Or go outside (Mom suggests).', 'No events tonight. Perfect night for the Puzzle Board.', 'Quiet night. Byte would love a visitor though.', 'Nothing scheduled. QuizJack still does a quiz every hour, on the hour.'][md % 4])}</div>`}</div>`; }).join('')}
        <h2>On all the time</h2>
        <div class="wo-allday">
          <a href="http://www.listeningparty.wubwub/"><b>RJ1 &middot; 24 HOURS</b><br>Radio Jack Listening Party: ten tunes, everyone hears the same one at once.</a>
          <a href="http://www.bytepet.jnet/"><b>BYTE &middot; ALWAYS HUNGRY</b><br>The JackNet's pet needs feeding, playing with and the occasional bath.</a>
          <a href="http://www.millenniumvault.jnet/"><b>THE VAULT &middot; OPENS Y2K NIGHT</b><br>Bury a time capsule. Every capsule opens at midnight on New Year's Eve.</a>
          <a href="http://www.puzzleboard.cyb/"><b>THE PUZZLE BOARD &middot; 24/7</b><br>Riddles, brain teasers and the thread nobody can stop talking about.</a>
        </div>
        ${(Ev.hist || []).length ? `<h2>Last time...</h2><div class="wo-res">${Ev.hist.slice().reverse().map(r => `<div><b>${esc(DEF[r.id] ? DEF[r.id].short : r.id)}</b>${r.x ? ' (' + esc(themeName(r.x)) + ')' : ''}: ${r.n | 0} came. ${(r.win || []).length ? (r.id === 'theme' || r.id === 'req' ? 'Spot prize: ' + esc(r.win[0][0]) : 'Winners: ' + r.win.map(w => `${w[2]}. ${esc(w[0])} (${w[1]})`).join(', ')) : ''}</div>`).join('')}</div>` : ''}
        <p style="text-align:center;margin-top:14px"><a class="wo-ttxlink" href="http://www.whatson.jnet/text.html">P100 CYBERTEXT &gt;&gt;</a></p>
        <div class="wo-foot">All times are UK time. Your PC pops up a reminder (the star by the clock) only while you're on the JackNet. Prizes are Rupees and Lootlings, for JackNet members (joining is FREE). WHAT'S ON? is printed on recycled pixels.</div></div>`;
      el.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', () => room(b.dataset.join)));
      el.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('change', () => { Ev.setRem(b.dataset.rem, b.checked); Desk.toast("What's On?", b.checked ? `OK! You'll get a reminder 10 minutes before ${DEF[b.dataset.rem].short}.` : `No more reminders for ${DEF[b.dataset.rem].short}.`, 3500); }));
    };
    draw();
    const offs = [Ev.on('week', () => el.isConnected && draw()), Ev.on('live', () => el.isConnected && draw())];
    every(el, () => { const c = el.querySelector('[data-cd]'); if (c) c.textContent = mmss(+c.dataset.cd - Ev.now()); }, 1000);
    every(el, () => {}, 60000);
    const watch = setInterval(() => { if (!el.isConnected) { offs.forEach(f => f()); clearInterval(watch); } }, 3000);
    Ev.send({ t: 'evHi' });
  }

  // ================================================================ CYBERTEXT
  const COL = { k: '#000', r: '#f00', g: '#0f0', y: '#ff0', b: '#00f', m: '#f0f', c: '#0ff', w: '#fff' };
  function row(s) { // {y} colour, {B} background, {!} flash, {?} concealed (REVEAL), {.} back to normal, {d} at start = double height
    let fg = 'w', bg = 'k', fl = false, hid = false, out = '', buf = '', dh = false, len = 0;
    if (s.startsWith('{d}')) { dh = true; s = s.slice(3); }
    const flush = () => { if (buf) out += `<span style="color:${COL[fg]};background:${COL[bg]}"${fl || hid ? ` class="${fl ? 'fl' : ''}${hid ? ' hid' : ''}"` : ''}>${esc(buf)}</span>`; buf = ''; };
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{' && s[i + 2] === '}') { flush(); const k = s[i + 1]; if (COL[k]) fg = k; else if (COL[k.toLowerCase()]) bg = k.toLowerCase(); else if (k === '!') fl = true; else if (k === '.') { fl = false; hid = false; } else if (k === '?') hid = true; i += 2; continue; }
      if (len < 40) { buf += s[i]; len++; }
    }
    if (len < 40) buf += ' '.repeat(40 - len);
    flush();
    return `<div class="ct-r${dh ? ' dh' : ''}">${out}</div>`;
  }
  const wrap = (s, w) => { const o = []; let l = ''; String(s).split(/\s+/).forEach(x => { if ((l + ' ' + x).trim().length > w) { o.push(l.trim()); l = ''; } l += x + ' '; }); if (l.trim()) o.push(l.trim()); return o; };
  let radLast = null, petLast = null, capLast = null;
  Ev.on('radNow', m => { radLast = m; }); Ev.on('bpView', m => { petLast = m; }); Ev.on('capState', m => { capLast = m; });
  function ttxPages() {
    const now = Ev.now(), P = {}, hd = (t, bg) => `{d}{${bg || 'B'}}{y} ${t.padEnd(38)} `;
    P[100] = [[hd('CYBERTEXT'), '{c} The JackNet text service. Try:', '', '{w} ON NOW AND NEXT ............... {y}101', '{w} THIS WEEK .................... {y}102', '{w} HOW PRIZES WORK .............. {y}103', '{w} RADIO JACK NOW PLAYING ....... {y}110', '{w} BYTE THE PET ................. {y}120', '{w} THE MILLENNIUM VAULT ......... {y}130', '{w} THEME NIGHT THEMES ........... {y}150', '{w} JOKES ........................ {y}160', '', '{g} Type three numbers. FASTEXT buttons', '{g} are the coloured ones. REVEAL shows', '{g} concealed answers. Some pages are', '{g} not in the index. (Ooh.)']];
    const lv = [...Ev.live.values()], nx = Ev.week.filter(o => o.s > now && !Ev.live.has(o.id)).slice(0, 4);
    P[101] = [[hd('NOW AND NEXT', 'R'), '', ...(lv.length ? lv.flatMap(L => [`{!}{y} ON NOW: {.}{w}${title(L).slice(0, 30)}`, `{c}   ${L.here | 0} there, until ${Ev.ukTime(L.e)}`]) : ['{w} Nothing on right now.']), '', '{y} COMING UP:', ...nx.flatMap(o => [`{c} ${Ev.ukTime(o.s)} {w}${title(o).slice(0, 32)}`, `{g}       ${dayLabel(o.md)}`])]];
    P[102] = [[hd('THIS WEEK', 'G'), '', ...Ev.week.filter(o => o.e > now).slice(0, 9).map(o => `{y}${dayLabel(o.md).slice(0, 10).padEnd(11)}{c}${Ev.ukTime(o.s)} {w}${(DEF[o.id].short + (o.x ? ': ' + themeName(o.x) : '')).slice(0, 22)}`), '', '{g} Full listings: www.whatson.jnet']];
    P[103] = [[hd('PRIZES', 'M'), '', ...wrap('Turn up to an event for 5 minutes or more and you get Rupees. Top 3 at LAN Night, the Grand Quiz and the Launch Party win more Rupees AND a Lootling. Theme Night and the Request Hour have a spot prize for one lucky person. JackNet members only (it is FREE to join).', 38).map(l => '{w} ' + l)]];
    if (radLast && C.TUNES[radLast.i]) { const t = C.TUNES[radLast.i], el = Math.max(0, (now - radLast.start) / 1000), d = C.dur(radLast.i); P[110] = [[hd('RADIO JACK', 'M'), '', '{y} NOW PLAYING:', '{d}{w} ' + t.n.slice(0, 38), '{c} by ' + t.a.slice(0, 35), '', `{g} ${Math.floor(el / 60)}:${String(Math.floor(el % 60)).padStart(2, '0')} of ${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}   {w}listeners: {y}${radLast.n | 0}`, '', ...(radLast.ded ? ['{m} DEDICATION:', `{w} For ${String(radLast.ded.to).slice(0, 20)} from ${String(radLast.ded.from).slice(0, 14)}`, ...(radLast.ded.msg ? wrap('"' + radLast.ded.msg + '"', 38).map(l => '{c} ' + l) : [])] : []), '', '{g} Tune in: www.listeningparty.wubwub']]; }
    else P[110] = [[hd('RADIO JACK', 'M'), '', '{w} Tuning...', '', '{g} Tune in: www.listeningparty.wubwub']];
    if (petLast && petLast.pet) { const p = petLast.pet, bar = v => '{g}' + '█'.repeat(Math.round(v / 10)) + '{r}' + '░'.repeat(10 - Math.round(v / 10)); P[120] = [[hd('BYTE THE PET', 'C'), '', `{y} Byte is a {w}${C.PET.STAGES[p.st].n.toUpperCase()}`, `{y} Mood: {w}${p.mood.toUpperCase()}`, '', `{w} FOOD  ${bar(p.f)}`, `{w} FUN   ${bar(p.p)}`, `{w} CLEAN ${bar(p.c)}`, `{w} SLEEP ${bar(p.e)}`, '', `{c} ${p.carers | 0} carers so far`, '', '{g} Visit: www.bytepet.jnet']]; }
    else P[120] = [[hd('BYTE THE PET', 'C'), '', '{w} Asking Byte...']];
    if (capLast) P[130] = [[hd('MILLENNIUM VAULT', 'B'), '', `{y} Capsules buried: {w}${capLast.n | 0}`, `{y} Vault: {w}${capLast.st === 'open' ? 'OPEN!!!' : capLast.st === 'closing' ? 'CLOSING FOR MIDNIGHT' : 'SEALED'}`, '', ...wrap('Every capsule opens at once at midnight on Y2K Night. Until then nobody can read them. Not even Jack.', 38).map(l => '{w} ' + l), '', '{g} www.millenniumvault.jnet']];
    else P[130] = [[hd('MILLENNIUM VAULT', 'B'), '', '{w} Checking the vault...']];
    P[150] = C.THEMES.map((t, i) => [hd('THEME NIGHTS', 'G'), '', `{y} ${i + 1} of ${C.THEMES.length}: {w}${t.n}`, '', ...wrap(t.d, 38).map(l => '{c} ' + l), '', '{g} Wednesdays, 7pm, in the Hangout.']);
    const J = [['Why did the modem go to the doctor?', 'It had a bad connection.'], ['What do you call a pet made of data?', 'A Byte-sized friend.'], ['Why was the floppy disk cold?', 'It left its JackOS open.'], ['How does a teletext page say hello?', 'It waves its FASTEXT.'], ['What is a robot\'s favourite snack?', 'Micro-chips.']];
    P[160] = J.map(j => [hd('JOKES', 'R'), '', '', ...wrap(j[0], 38).map(l => '{y} ' + l), '', ...wrap(j[1], 38).map(l => '{w} ' + l)]);
    // not in the index: the puzzle trail (SIGNAL.EXE gives the number, in Morse)
    P[734] = [['{d}{K}{w} PAGE 734                               ', '', '{w} THIS PAGE IS NOT IN SERVICE.', '', '{w} (There is nothing to see here.)', '', '', '{?}{y} Hello again. You found the signal.', '{?}{y} The modem on my board knows the', '{?}{y} password. Ask the picture for its', '{?}{y} PROPERTIES (right-click it, or hold', '{?}{y} your finger on it).', '', '{?}{c} Then log on as me. You know my name.', '', '{?}{m} KEEP THIS FOR THE END: WORD TWO: HANG', '', '{?}{w}                         ~NIGHTOWL~', '', '{g} Press REVEAL to show concealed text']];
    P[888] = [['', '', '', '', '', '', '', '', '', '', '{w}{K}  Subtitles are not available for', '{w}{K}  this page. Sorry.']];
    return P;
  }
  function ttx(el) {
    A.secret('evt.ttx');
    el.className = 'ct';
    el.innerHTML = `<div class="ct-scr" role="region" aria-label="CYBERTEXT screen" aria-live="polite"></div>
      <div class="ct-f"><button type="button" data-f="101" style="background:#f33">Now</button><button type="button" data-f="102" style="background:#3c3">Week</button><button type="button" data-f="110" style="background:#ff3">Radio</button><button type="button" data-f="100" style="background:#39f">Index</button></div>
      <div class="ct-k">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="ct-f"><button type="button" class="ct-rev" style="background:#ccc">REVEAL</button><button type="button" class="ct-hold" style="background:#ccc">HOLD</button></div>
      <div class="ct-help">Type a 3-digit page number (keyboard or the buttons). Coloured buttons are FASTEXT. Some pages are not in the index...<br><a href="http://www.whatson.jnet/" style="color:#0ff">&lt;&lt; back to WHAT'S ON?</a></div>`;
    const scr = el.querySelector('.ct-scr');
    let cur = 100, sub = 0, typed = '', hold = false, P = ttxPages(), searching = null, tk = 0;
    const fit = () => { const w = scr.clientWidth - 12; scr.style.fontSize = Math.max(6, w / 40 / 0.6) + 'px'; };
    fit(); if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(scr); }
    const header = shown => { const t = Desk.today99(), n = new Date(Ev.now()); return `{w}P${String(typed ? (typed + '---').slice(0, 3) : cur).padEnd(4)}{c}CYBERTEXT {w}${String(shown).padEnd(4)}{y}${DAYS[t.date.getDay()].slice(0, 3)} ${String(t.d).padStart(2, '0')} ${MON[t.m - 1]} {w}${Ev.ukTime(n)}:${String(n.getSeconds()).padStart(2, '0')}`; };
    const draw = shown => {
      let lines;
      const pg = P[shown == null ? cur : shown];
      if (shown != null && shown !== cur) lines = [header(shown)];
      else if (!pg) lines = [header(cur), '', '', '', '{w}   Page ' + cur + ' is not in service.', '', '{c}   Try page 100 for the index.'];
      else lines = [header(cur), ...pg[sub % pg.length]];
      while (lines.length < 24) lines.push('');
      lines = lines.slice(0, 24); lines.push(`{r}${'NOW'.padEnd(10)}{g}${'WEEK'.padEnd(10)}{y}${'RADIO'.padEnd(10)}{c}INDEX`);
      const out = []; lines.forEach((l, i) => { if (i > 0 && l === '' && /^\{d\}/.test(lines[i - 1] || '')) return; out.push(l); });
      scr.innerHTML = out.map(row).join('');
    };
    const ask = n => { if (n === 110) Ev.send({ t: 'radSub', on: true }); if (n === 120) Ev.send({ t: 'bpGet' }); if (n === 130) Ev.send({ t: 'capGet' }); };
    const go = n => {
      n = +n; typed = ''; if (!(n >= 100 && n <= 899)) { draw(); return; }
      clearInterval(searching); let shown = cur; ask(n);
      searching = setInterval(() => { if (!scr.isConnected) return clearInterval(searching); shown = shown >= 899 ? 100 : shown + 11; draw(shown); }, 70);
      setTimeout(() => {
        clearInterval(searching); searching = null; cur = n; sub = 0; scr.classList.remove('rev'); P = ttxPages(); draw(); sfx('click');
        if (n === 734) { Ev.argStep(5); }
      }, 600 + Math.random() * 700);
    };
    const key = d => { typed += d; sfx('click'); if (typed.length === 3) { const n = typed; draw(); go(n); } else draw(); };
    el.querySelectorAll('.ct-k button').forEach(b => b.addEventListener('click', () => key(b.dataset.n)));
    el.querySelectorAll('.ct-f button[data-f]').forEach(b => b.addEventListener('click', () => go(b.dataset.f)));
    el.querySelector('.ct-rev').addEventListener('click', () => { scr.classList.toggle('rev'); sfx('click'); if (cur === 734 && scr.classList.contains('rev')) A.secret('arg.ttx'); });
    el.querySelector('.ct-hold').addEventListener('click', ev => { hold = !hold; ev.target.textContent = hold ? 'HOLD ON' : 'HOLD'; });
    const onKey = ev => { if (!scr.isConnected) return document.removeEventListener('keydown', onKey); if (/^[0-9]$/.test(ev.key) && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !document.querySelector('.appwin:not(.inactive) .dos-scr')) key(ev.key); };
    document.addEventListener('keydown', onKey);
    draw();
    every(el, () => { if (searching || !scr.isConnected) return; tk++; if (tk % 5 === 0) P = ttxPages(); if (!hold && P[cur] && P[cur].length > 1 && tk % 8 === 0) { sub++; scr.classList.remove('rev'); } if (!typed) draw(); }, 1000);
  }

  // ================================================================ the Event Room
  const rooms = new Map(); // id -> win
  function roomOpen(id) { const w = rooms.get(id); return !!(w && !w.closed && w.el.style.display !== 'none'); }
  const GO = {
    lan: ['Start JackReal Tournament', () => A.open('pcgames.jrt')],
    quiz: ['Go to #quiznight in JackIRC', () => A.run('quiznight')],
    theme: ['Go to the Hangout', () => { const b = $('browser'); if (b) b.classList.remove('min'); IE.go('hangout', 'click'); }],
    cd: ['Open this month\'s cover CD', () => A.open('ssn.disc')],
    req: ['Open the Listening Party', () => Ev.go('http://www.listeningparty.wubwub/')],
  };
  function room(id) {
    const L0 = Ev.live.get(id) || [...Ev.live.values()][0];
    if (!L0) {
      const nx = Ev.week.filter(o => o.s > Ev.now())[0];
      Desk.msgbox('Event Room', nx ? `Nothing is on right now.\n\nNext up: ${title(nx)}, ${dayLabel(nx.md)} at ${Ev.ukTime(nx.s)} (UK time).\n\nThe full listings are at www.whatson.jnet` : 'Nothing is on right now. Have a look at www.whatson.jnet', 'info', [['What\'s On?', () => Ev.go('http://www.whatson.jnet/')], ['OK']]);
      return null;
    }
    id = L0.id;
    if (rooms.get(id) && !rooms.get(id).closed) { rooms.get(id).restore(); return rooms.get(id); }
    const D = DEF[id], b = h('div', 'er');
    const w = A.win('Event Room: ' + D.short, b, { w: 420, icon: Ev.ICO.room, minW: 280, onClose: () => { rooms.delete(id); Ev.send({ t: 'evHere', id, on: false }); } });
    rooms.set(id, w);
    A.secret('evt.join');
    Ev.send({ t: 'evHere', id, on: true });
    const th = id === 'theme' ? C.THEMES.find(t => t.id === L0.x) || C.THEMES[0] : null;
    b.innerHTML = `<div class="er-top">${Ev.ICO.room.replace('<svg', '<svg width="32" height="32"')}<div><b>${esc(title(L0))}</b><span class="er-n">&nbsp;</span></div><span class="er-cd">--:--</span></div>
      ${th ? `<div class="er-th" style="background:${th.col}"><b style="color:${th.acc}">${esc(th.n)}</b><br>${esc(th.d)}<br><small>DJ Gubbinz asks a question in the chat every half an hour. One lucky partygoer wins the Best Costume spot prize!</small></div>` : `<div>${esc(D.d)}</div>`}
      <button class="btn er-go" type="button">${esc(GO[id][0])} &raquo;</button>
      ${id === 'cd' ? `<div class="group"><span class="lg">The Party-o-Meter</span><div class="er-meter"><i style="width:0"></i><span>0%</span></div><p class="er-feed"></p><button class="btn er-pop" type="button">&#127881; POP! &#127881;</button><p class="small" style="margin:4px 0 0">Pull party poppers to fill the meter. Fill it and THE DISC LAUNCHES (goodie bags for everyone here). Top poppers win Lootlings.</p></div>` : ''}
      ${id === 'req' ? '<p>Tonight requests come round every 3 minutes instead of 10. Add a dedication and it is read out on everybody\'s screen!</p>' : ''}
      <div class="group"><span class="lg">Here now</span><div class="er-who"></div></div>
      ${id === 'lan' || id === 'quiz' || id === 'cd' ? `<div class="group"><span class="lg">${id === 'lan' ? 'LAN Night league (frags)' : id === 'quiz' ? 'Grand Quiz table (right answers)' : 'Top poppers'}</span><table class="er-board"></table></div>` : ''}
      <p class="small" style="margin:0">&#9733; ${esc(D.prize)}. Be here (or ${id === 'lan' ? 'in the game' : id === 'quiz' ? 'in #quiznight' : id === 'theme' ? 'in the Hangout' : id === 'req' ? 'tuned in' : 'at the party'}) for 5 minutes. ${Ev.member() ? '' : '<b>Prizes are for JackNet members (FREE to join).</b>'}</p>`;
    b.querySelector('.er-go').addEventListener('click', () => { GO[id][1](); sfx('click'); });
    const pop = b.querySelector('.er-pop');
    if (pop) pop.addEventListener('click', ev => { Ev.send({ t: 'evAct', id: 'cd', a: 'pop' }); A.secret('evt.pop'); sfx('boing'); confetti(ev.clientX, ev.clientY, 18); pop.disabled = true; setTimeout(() => { pop.disabled = false; }, 1700); });
    const draw = () => {
      const L = Ev.live.get(id);
      if (!L) { b.querySelector('.er-n').textContent = ' (over)'; b.querySelector('.er-cd').textContent = 'ENDED'; return; }
      b.querySelector('.er-n').textContent = ` ${L.here | 0} here now`;
      b.querySelector('.er-who').innerHTML = (L.who || []).map(n => `<span>${esc(n)}</span>`).join('') || '<i>Nobody yet... be the first!</i>';
      const tb = b.querySelector('.er-board');
      if (tb) tb.innerHTML = (L.board || []).length ? L.board.map((r, i) => `<tr><td>${i + 1}.</td><td>${esc(r[0])}</td><td class="n">${r[1]}</td></tr>`).join('') : `<tr><td>${id === 'lan' ? 'No frags yet. The bots are warming up.' : id === 'quiz' ? 'No right answers yet!' : 'No pops yet!'}</td></tr>`;
      if (L.meter) { const [p, t, ok] = L.meter, pc = Math.min(100, Math.round(p / Math.max(1, t) * 100)); b.querySelector('.er-meter i').style.width = pc + '%'; b.querySelector('.er-meter span').textContent = ok ? 'LAUNCHED!!!' : pc + '%'; if (ok && pop) { pop.textContent = 'LAUNCHED! ★'; } }
    };
    const cd = () => { const L = Ev.live.get(id); if (L) b.querySelector('.er-cd').textContent = mmss(L.e - Ev.now()); };
    draw(); cd();
    const offs = [Ev.on('live', m => { if (!w.closed) { draw(); if (m && m.id === 'cd' && m.pop) { const f = b.querySelector('.er-feed'); if (f) f.textContent = `${m.pop} pulled a party popper! POP!`; } } }),
      Ev.on('launch', () => { if (!w.closed) { confetti(DesktopSurface.width() / 2, DesktopSurface.height() / 3, 120); sfx('solve'); } }),
      Ev.on('end', m => { if (w.closed || m.id !== id) return; draw(); const r = m.res || {}; b.insertAdjacentHTML('beforeend', `<div class="group"><span class="lg">Results</span>${(r.win || []).length ? r.win.map(x => `<div>${x[1] ? x[2] + '. ' : '&#9733; '}<b>${esc(x[0])}</b>${x[1] ? ' (' + x[1] + ')' : ' wins the spot prize!'}</div>`).join('') : '<div>Thanks for coming!</div>'}</div>`); })];
    const t = setInterval(() => { if (w.closed) { clearInterval(t); offs.forEach(f => f()); return; } cd(); }, 1000);
    return w;
  }
  function confetti(x, y, n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'er-conf'; c.width = DesktopSurface.width(); c.height = DesktopSurface.height(); DesktopSurface.root().appendChild(c);
    const g = c.getContext('2d'), P = [], cols = ['#e10600', '#ffd400', '#1e8a3a', '#2463e0', '#ff3cff', '#fff'];
    for (let i = 0; i < n; i++) P.push({ x, y, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 2, c: cols[i % cols.length], s: 3 + Math.random() * 4, r: Math.random() * 6 });
    let f = 0; const step = () => { g.clearRect(0, 0, c.width, c.height); for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.r += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); } if (++f < 90) requestAnimationFrame(step); else c.remove(); };
    step();
  }

  // ================================================================ Theme Night in the Hangout
  const TICO = { stars: '<path d="M15 2l3 9h9l-7 6 3 9-8-6-8 6 3-9-7-6h9z" fill="#ffd400" stroke="#000"/>', zzz: '<path d="M4 6h10L4 18h10M16 14h8l-8 10h8" stroke="#fff" stroke-width="2.4" fill="none"/>', pixels: '<rect x="3" y="9" width="24" height="14" fill="#ff3cff" stroke="#000"/><rect x="7" y="13" width="4" height="4" fill="#000"/><rect x="19" y="13" width="4" height="4" fill="#000"/>', bats: '<path d="M2 14c4-6 8 0 13 4 5-4 9-10 13-4-3 1-5 5-6 8-2-3-4-3-7 0-3-3-5-3-7 0-1-3-3-7-6-8z" fill="#000" stroke="#a0ff40"/>', sun: '<circle cx="15" cy="15" r="7" fill="#ffe060" stroke="#000"/><path d="M15 1v5M15 24v5M1 15h5M24 15h5M5 5l3 3M22 22l3 3M25 5l-3 3M5 25l3-3" stroke="#ffe060" stroke-width="2"/>', bolts: '<rect x="6" y="6" width="18" height="18" fill="#808080" stroke="#000"/><circle cx="11" cy="12" r="2" fill="#ff8000"/><circle cx="19" cy="12" r="2" fill="#ff8000"/><path d="M10 19h10" stroke="#000" stroke-width="2"/>', skull: '<circle cx="15" cy="13" r="9" fill="#fff" stroke="#000"/><rect x="10" y="10" width="3" height="4" fill="#000"/><rect x="17" y="10" width="3" height="4" fill="#000"/><path d="M11 22v4M15 22v4M19 22v4" stroke="#000" stroke-width="2"/>', ball: '<circle cx="15" cy="15" r="11" fill="#c0c0c0" stroke="#000"/><path d="M4 15h22M15 4v22M7 8l16 14M23 8L7 22" stroke="#fff"/>' };
  function hangout() {
    const sec = $('s-hangout'), L = Ev.live.get('theme');
    const old = sec && sec.querySelector('.evth-banner');
    if (!sec || !L) { if (old) old.remove(); return; }
    const th = C.THEMES.find(t => t.id === L.x) || C.THEMES[0];
    if (old && old.dataset.th === th.id) { old.querySelector('.evth-n').textContent = `${L.here | 0} at the party`; return; }
    if (old) old.remove();
    const b = h('div', 'evth-banner evth-' + th.deco, `<svg class="evth-ico" viewBox="0 0 30 30">${TICO[th.deco] || ''}</svg><b style="color:${th.acc}">&#9733; THEME NIGHT: ${esc(th.n)} &#9733;</b>${esc(th.d)} <small>DJ Gubbinz is on the decks until ${Ev.ukTime(L.e)}. <span class="evth-n">${L.here | 0} at the party</span>. <a href="#" style="color:${th.acc}">Event Room &raquo;</a></small>`);
    b.dataset.th = th.id; b.style.background = th.col;
    b.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); room('theme'); });
    sec.insertBefore(b, sec.firstChild);
  }
  Ev.on('end', m => { if (m.id === 'theme') hangout(); });

  window.EvGuide = { page: el => (Ev.path() === '/text.html' ? ttx(el) : page(el)), ttx, room, roomOpen, hangout, confetti, title, dayLabel };
})();

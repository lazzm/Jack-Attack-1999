/* setup-shack: The Shareware Shack (www.sharewareshack.netz), the 1999 software download site, plus the three programs you
 * can only get from it: Blobbit Screen Mates, Desktop Fish Tank (no fish) and DaveZip. Lazy-loaded by setup.js. */
(function () {
  const A = window.Apps, esc = A.esc, store = A.store, SU = window.Setup;
  const $ = id => document.getElementById(id);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const J = SU.J, kbStr = SU.kbStr, SH = SU.SHACK, CATS = SU.CATS;
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i, b), toast = (t, x, ms) => Desk.toast(t, x, ms);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const hash = s => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
  const myId = () => String((window.Net && (Net.cid || (Net.me && Net.me.id))) || 'anon').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 24) || 'anon';
  const list = () => SU.list.filter(p => p.k !== 'os');
  const P = id => SU.get(id);
  const date99 = s => { const [d, m] = String(s || '01/01/99').split('/').map(Number); return (m || 1) * 100 + (d || 1); };
  const today = () => Desk.today99().md;

  // ================================================================ styles
  if (!$('shack-css')) {
    const css = h(null, null, 'style'); css.id = 'shack-css';
    css.textContent = `
.ssk{background:#f6efd6 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23f6efd6'/%3E%3Cpath d='M0 0h1v1H0zM4 4h1v1H4z' fill='%23e8dcb4'/%3E%3C/svg%3E");color:#202000;font:12px/1.45 Verdana,Tahoma,Arial,sans-serif;margin:0;padding:0 0 10px;min-height:100%}
.ssk a{color:#0000cc}.ssk a:visited{color:#660099}
.ssk-head{background:linear-gradient(#2c6a1c,#174a0c);border-bottom:4px solid #8a5a1a;padding:8px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ssk-head svg{flex:none}
.ssk-sign{display:inline-block;background:repeating-linear-gradient(0deg,#b77a32 0 6px,#a86a26 6px 7px,#c08440 7px 12px);border:3px solid #5a3a10;padding:4px 14px 6px;transform:rotate(-1.5deg);box-shadow:3px 3px 0 rgba(0,0,0,.45);position:relative}
.ssk-sign::before,.ssk-sign::after{content:"";position:absolute;top:5px;width:5px;height:5px;border-radius:50%;background:#333;box-shadow:inset 1px 1px #999}
.ssk-sign::before{left:4px}.ssk-sign::after{right:4px}
.ssk-sign b{display:block;font:bold 26px/1 Impact,"Arial Black",sans-serif;color:#ffe14a;letter-spacing:1px;text-shadow:2px 2px 0 #3a1a00,-1px -1px 0 #6a3a00}
.ssk-sign i{display:block;font:bold 10px Arial,sans-serif;color:#fff;letter-spacing:2px;text-align:center}
.ssk-tag{color:#ffffa0;font:bold 12px Verdana,sans-serif;flex:1;min-width:180px}
.ssk-tag small{display:block;color:#c8e8b0;font-weight:normal}
.ssk-nav{background:#8a5a1a;display:flex;flex-wrap:wrap;gap:0;border-bottom:2px solid #5a3a10}
.ssk-nav a{color:#fff!important;font:bold 11px Verdana,sans-serif;padding:4px 10px;text-decoration:none;border-right:1px solid #5a3a10}
.ssk-nav a:hover{background:#a8742a;text-decoration:underline}
.ssk-wrap{display:flex;gap:12px;padding:10px 12px 0}
.ssk-side{width:160px;flex:none}
.ssk-main{flex:1;min-width:0}
.ssk-box{background:#fff;border:2px solid #2c6a1c;margin:0 0 10px}
.ssk-box > b,.ssk-box > h3{display:block;background:#2c6a1c;color:#ffff80;font:bold 11px Verdana,sans-serif;padding:3px 6px;margin:0}
.ssk-box > div{padding:6px}
.ssk-cats a{display:block;padding:2px 0}
.ssk-cats a small{color:#666}
.ssk h1{font:bold 18px Verdana,sans-serif;color:#2c4a00;margin:4px 0 6px}
.ssk h2{font:bold 14px Verdana,sans-serif;color:#7a3a00;margin:12px 0 6px;border-bottom:2px dotted #b77a32}
.ssk table.ssk-t{border-collapse:collapse;width:100%;background:#fff}
.ssk-t th{background:#e8d8a8;font:bold 11px Verdana,sans-serif;text-align:left;padding:3px 5px;border:1px solid #b8a070}
.ssk-t td{padding:4px 5px;border:1px solid #d8c890;vertical-align:middle}
.ssk-t tr:nth-child(even) td{background:#fffbe8}
.ssk-t td.ic{width:20px}
.ssk-t .small{font-size:10px;color:#555}
.ssk-sq{white-space:nowrap;display:inline-flex;gap:1px;vertical-align:middle}
.ssk-sq svg{width:13px;height:11px}
.ssk-lic{display:inline-block;font:bold 9px Verdana,sans-serif;padding:0 4px;border:1px solid #000;color:#000}
.ssk-lic.Freeware{background:#9f9}.ssk-lic.Shareware{background:#ff9}.ssk-lic.Demo{background:#9cf}.ssk-lic.Adware{background:#f99}.ssk-lic.Commercial{background:#ccc}.ssk-lic.Postcardware,.ssk-lic.Squigware,.ssk-lic.Pizzaware{background:#fcf}
.ssk-new{display:inline-block;font:bold 9px Arial,sans-serif;color:#fff;background:#e10600;padding:0 3px;animation:sskb 1s steps(2) infinite}
@keyframes sskb{50%{background:#ff8a00}}
.ssk-inst{display:inline-block;font:bold 9px Verdana,sans-serif;color:#060;border:1px solid #060;padding:0 3px;background:#efe}
.ssk-prod{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}
.ssk-shot{width:180px;flex:none;background:#008080;border:2px inset #fff;height:130px;display:flex;align-items:center;justify-content:center;position:relative}
.ssk-shot .w{width:150px;height:96px;background:#c0c0c0;border:1px solid;border-color:#fff #000 #000 #fff;display:flex;flex-direction:column}
.ssk-shot .w i{display:block;height:9px;background:linear-gradient(90deg,#000080,#1084d0)}
.ssk-shot .w span{flex:1;display:flex;align-items:center;justify-content:center}
.ssk-shot .w span svg{width:48px;height:48px}
.ssk-shot small{position:absolute;bottom:-16px;left:0;right:0;text-align:center;font-size:9px;color:#666}
.ssk-facts{flex:1;min-width:220px}
.ssk-facts td{padding:2px 8px 2px 0;vertical-align:top}
.ssk-facts td:first-child{font-weight:bold;white-space:nowrap;color:#5a3a10}
.ssk-dlbtn{display:inline-block;margin:10px 0 4px;padding:6px 16px;font:bold 15px Impact,"Arial Black",sans-serif;letter-spacing:1px;color:#fff!important;background:linear-gradient(#3ab030,#1a7010);border:3px outset #8f8;text-decoration:none!important;text-shadow:1px 1px 0 #000;cursor:pointer}
.ssk-dlbtn:active{border-style:inset}
.ssk-dlbtn.off{background:#999;border-color:#ccc;cursor:default}
.ssk-times{font-size:10px;color:#444;margin:4px 0}
.ssk-rev{border-top:1px dotted #b8a070;padding:5px 0}
.ssk-rev b{color:#7a3a00}
.ssk-rate button{background:none;border:0;padding:0 1px;cursor:pointer}
.ssk-rate button svg{width:18px;height:15px}
.ssk-rate button.dim svg{opacity:.25}
.ssk-mir td{padding:6px}
.ssk-foot{margin:14px 12px 0;padding-top:8px;border-top:2px solid #b77a32;font-size:10px;color:#555;text-align:center}
.ssk-ad{display:block;margin:0 auto 10px;max-width:468px;height:60px;border:2px solid #000;background:linear-gradient(90deg,#000080,#0050c0);color:#ff0;font:bold 18px/56px Impact,"Arial Black",sans-serif;text-align:center;text-decoration:none!important;overflow:hidden;position:relative;cursor:pointer}
.ssk-ad span{position:absolute;right:6px;bottom:2px;font:9px Arial,sans-serif;color:#fff;line-height:1}
.ssk input[type=text]{font:12px Verdana,sans-serif}
.ssk-searchrow{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
@media (max-width:640px){.ssk-wrap{flex-direction:column;padding:8px}.ssk-side{width:auto;order:2}.ssk-side .ssk-box:nth-child(n+3){display:none}.ssk-cats{display:flex;flex-wrap:wrap;gap:2px 10px}.ssk-sign b{font-size:20px}.ssk-t .hm{display:none}}
`;
    document.head.appendChild(css);
  }

  // ================================================================ bits
  const SQ = on => `<svg viewBox="0 0 13 11" aria-hidden="true"><path d="M1.5 .5h9l1.5 1.5v8.5h-10.5z" fill="${on ? '#2a5ad8' : '#c8c8c8'}" stroke="${on ? '#000' : '#888'}" stroke-width=".7"/><rect x="3.5" y=".8" width="5.5" height="3.4" fill="${on ? '#d8dce4' : '#e8e8e8'}" stroke="${on ? '#333' : '#999'}" stroke-width=".4"/><rect x="7" y="1.3" width="1.2" height="2.4" fill="${on ? '#2a5ad8' : '#c8c8c8'}"/><rect x="3" y="5.6" width="7.5" height="4.4" fill="${on ? '#fff' : '#eee'}"/><path d="M3.8 7h5.8M3.8 8.6h4" stroke="${on ? '#e10600' : '#bbb'}" stroke-width=".6"/></svg>`;
  const squigs = n => `<span class="ssk-sq" title="${n} out of 5 floppies">${[1, 2, 3, 4, 5].map(i => SQ(i <= Math.round(n))).join('')}</span>`;
  const lic = l => `<span class="ssk-lic ${esc(l)}">${esc(l.toUpperCase())}</span>`;
  const icon = (p, s) => (SU.iconOf ? SU.iconOf(p, s || 16) : J(p.ic || 'exe', s || 16)) || '';
  const isNew = p => { const d = date99(p.rel), t = today(); return /\/99$/.test(p.rel) && d <= t && t - d < 60; };
  const soon = p => /\/99$/.test(p.rel) && date99(p.rel) > today();
  const link = (p, t) => `<a href="${SH}soft/${esc(p.id)}.html">${t || esc(p.n)}</a>`;
  const times = kb => { const f = s => s >= 3600 ? Math.floor(s / 3600) + ' hr ' + Math.round(s % 3600 / 60) + ' min' : s >= 60 ? Math.floor(s / 60) + ' min ' + Math.round(s % 60) + ' sec' : Math.max(1, Math.round(s)) + ' sec'; return `28.8K: ${f(kb / 3.2)} &middot; 56K: ${f(kb / 4.8)} &middot; ISDN: ${f(kb / 7.5)} &middot; T1: ${f(kb / 150)}`; };
  const REQ = p => p.cat === 'games' ? 'Pentium 133, 16 MB RAM, 2x CD-ROM, Sound Blaster compatible, DirectX 6' : p.cat === 'dos' ? '386 or better, 640 KB conventional memory (good luck), MS-DOS 5.0' : p.cat === 'tb' ? 'JackNet Explorer 4 or higher, a sense of regret' : '486DX2/66, 8 MB RAM, JackOS 95 or 98';
  const OS = p => p.cat === 'dos' ? 'DOS / JackOS 95 / 98' : 'JackOS 95 / 98 / NT 4.0';
  // download counts, ratings (shared by everybody)
  const counts = {}, rates = {};
  function fetchCounts(ids) {
    if (!window.Net || !Net.kv) return Promise.resolve();
    const keys = []; ids.forEach(id => keys.push('ss.dl.' + id));
    const batches = []; for (let i = 0; i < keys.length; i += 30) batches.push(keys.slice(i, i + 30));
    return Promise.all(batches.map(b => Net.kv.get(b).then(v => { Object.keys(v || {}).forEach(k => { counts[k.slice(6)] = +v[k] || 0; }); }))).catch(() => {});
  }
  const base = p => 40 + hash(p.id) % 900 + (p.sq * 120) + (p.wasDef || p.def ? 300 : 0); // downloads "before the counter was fixed"
  const dls = p => base(p) + (counts[p.id] || 0);
  function fillCounts(root) { const ids = qsa(root, '[data-dlc]').map(e => e.dataset.dlc); fetchCounts([...new Set(ids)]).then(() => qsa(root, '[data-dlc]').forEach(e => { const p = P(e.dataset.dlc); if (p) e.textContent = dls(p).toLocaleString('en-GB'); })); }
  const pickOfWeek = () => { const l = list().filter(p => p.k !== 'tb' && !p.nodl); const t = Desk.today99(); const wk = Math.floor((new Date(1999, t.m - 1, t.d) - new Date(1999, 0, 1)) / 6048e5); return l[(wk * 7) % l.length]; };

  // ================================================================ pages
  const AD = ['DOWNLOAD THE INTERNET!!! (all of it) &raquo;', 'IS YOUR PC Y2K READY? CLICK HERE!', 'FREE SMILEYS!!! 4000+ SMILEYS!!!', 'WIN A 56K MODEM! YOU ARE THE 1,000,000th VISITOR!', 'DIAL-UP ACCELERATOR 3000: SURF 400% FASTER*'];
  function frame(title, inner) {
    const n = list().length;
    return `<div class="ssk"><div class="ssk-head"><svg viewBox="0 0 64 56" width="64" height="56" aria-hidden="true"><path d="M4 26L32 6l28 20z" fill="#9aa0a8" stroke="#000"/><path d="M8 26h48v28H8z" fill="#b77a32" stroke="#000"/><path d="M8 32h48M8 38h48M8 44h48M8 50h48" stroke="#8a5a1a"/><rect x="26" y="34" width="14" height="20" fill="#3a2008" stroke="#000"/><ellipse cx="33" cy="44" rx="6" ry="5" fill="#e10600" stroke="#000"/><circle cx="31" cy="43" r="1.4" fill="#ff0"/><circle cx="35" cy="43" r="1.4" fill="#ff0"/><rect x="44" y="32" width="8" height="8" fill="#ffe680" stroke="#000"/><path d="M48 32v8M44 36h8" stroke="#000"/><path d="M12 22l4-2 4 2 4-2 4 2 4-2 4 2 4-2 4 2 4-2 4 2" stroke="#666" fill="none"/></svg>
<div class="ssk-sign"><b>THE SHAREWARE SHACK</b><i>FREE SOFTWARE &middot; EST. 1996</i></div><div class="ssk-tag">${n} programs and counting! Every file tested by a real hamster.<small>Updated every day! Last updated: ${SU.d99()}</small></div></div>
<div class="ssk-nav"><a href="${SH}">Home</a><a href="${SH}new.html">New Files</a><a href="${SH}top.html">Top 20</a><a href="${SH}search.html">Search</a><a href="${SH}submit.html">Upload Your Shareware</a><a href="${SH}help.html">Help! How do I install?</a><a href="${SH}about.html">About the Shack</a></div>
<div class="ssk-wrap"><div class="ssk-side"><div class="ssk-box"><b>CATEGORIES</b><div class="ssk-cats">${Object.keys(CATS).filter(c => list().some(p => p.cat === c)).map(c => `<a href="${SH}cat/${c}.html">${esc(CATS[c])} <small>(${list().filter(p => p.cat === c).length})</small></a>`).join('')}</div></div>
<div class="ssk-box"><b>SEARCH</b><div><form class="ssk-sf"><input type="text" maxlength="40" style="width:100%;box-sizing:border-box" placeholder="e.g. pinball"><button class="btn" style="margin-top:4px;padding:2px 8px" type="submit">Find it!</button></form></div></div>
<div class="ssk-box"><b>NIBBLER SAYS</b><div style="font-size:11px">${esc(['Always scan downloads for viruses. I nibble them. Works every time.', 'Shareware is not free! Pay the nice people. Or at least feel bad.', 'Download at night. The phone bill is cheaper and Mom is asleep.', 'If a program wants to install a toolbar, say NO. Then say it again.', 'Keep your setup files on a floppy in case you need them again.', 'Never run a program called FREE_MONEY.EXE. Trust me.'][hash(title) % 6])}</div></div>
<div class="ssk-box"><b>LINKS</b><div style="font-size:11px"><a href="http://www.jackattack.jnet/">JACK ATTACK! Online</a><br><a href="http://www.jacknetzone.jnet/">JackNet Gaming Zone</a><br><a href="http://www.freestuff4u.w3b/">FREE DOWNLOADS!!!</a><br><a href="http://www.freetoolz.w3b/">FreeToolz</a><br><a href="http://www.hoaxwatch.netz/">HoaxWatch</a></div></div></div>
<div class="ssk-main"><a class="ssk-ad" data-ssad="1">${AD[hash(title) % AD.length]}<span>ADVERTISEMENT</span></a>${inner}</div></div>
<div class="ssk-foot">Best viewed with JackNet Explorer 4.0 or higher at 800x600 in High Colour (16 bit). &middot; Downloads are served by HamsterPipe&trade;, a server under Gubbinz's bed. It's faster than your modem. Don't ask how.<br>&copy; 1996-1999 The Shareware Shack. All programs are the property of their authors. The Shack is not responsible for hamster damage.</div></div>`;
  }
  const row = p => `<tr><td class="ic">${icon(p)}</td><td>${link(p, '<b>' + esc(p.n) + '</b>')} ${isNew(p) ? '<span class="ssk-new">NEW!</span>' : ''} ${SU.has(p.id) ? '<span class="ssk-inst">INSTALLED</span>' : ''}<div class="small">${esc(p.d.length > 90 ? p.d.slice(0, 88) + '...' : p.d)}</div></td><td class="hm">${lic(p.lic)}</td><td class="hm">${kbStr(p.kb)}</td><td>${squigs(p.sq)}</td><td class="hm" data-dlc="${esc(p.id)}">${dls(p).toLocaleString('en-GB')}</td></tr>`;
  const table = ps => ps.length ? `<table class="ssk-t"><tr><th></th><th>Program</th><th class="hm">Licence</th><th class="hm">Size</th><th>Rating</th><th class="hm">Downloads</th></tr>${ps.map(row).join('')}</table>` : '<p>Nothing here yet. The hamster is looking.</p>';
  function home() {
    const pk = pickOfWeek(), byDl = list().filter(p => p.k !== 'tb').sort((a, b) => dls(b) - dls(a)).slice(0, 8), fresh = list().filter(p => /\/99$/.test(p.rel) && !soon(p)).sort((a, b) => date99(b.rel) - date99(a.rel)).slice(0, 6);
    return frame('home', `<h1>Welcome to the Shack!</h1><p>The best FREE software on the whole Internet, sorted, tested and rated by a real hamster (out of 5 floppies). Find a program, click <b>DOWNLOAD NOW!</b>, choose a mirror, and you'll be playing in minutes. Already got something and want rid of it? Use <b>Control Panel &gt; Add/Remove Programs</b>.</p>${SU.CENTRE ? `<p class="small" style="background:#fff;border:1px dashed #b77a32;padding:4px 6px">New PC? Fill it up in one go with a <a href="${SU.CENTRE}packs.html">Starter Pack from the JackNet Software Centre</a>.</p>` : ''}
${pk ? `<div class="ssk-box"><b>&#9733; NIBBLER'S PICK OF THE WEEK &#9733;</b><div class="ssk-prod">${icon(pk, 32)}<div style="flex:1;min-width:0">${link(pk, '<b style="font-size:14px">' + esc(pk.n) + '</b>')} ${squigs(pk.sq)}<br>${esc(pk.d)}<br><a href="${SH}dl/${esc(pk.id)}.html">Download now (${kbStr(pk.kb)})</a></div></div></div>` : ''}
<h2>Hot Downloads This Week</h2>${table(byDl)}
<h2>Just Arrived</h2>${table(fresh)}
<h2>Browse by Category</h2><p>${Object.keys(CATS).filter(c => list().some(p => p.cat === c)).map(c => `<a href="${SH}cat/${c}.html">${esc(CATS[c])}</a>`).join(' &middot; ')}</p>`);
  }
  function cat(c) {
    const ps = list().filter(p => p.cat === c).sort((a, b) => b.sq - a.sq || a.n.localeCompare(b.n));
    const intro = { games: 'Games! The reason computers were invented.', net: 'Programs for the Information Superhighway: chat, messengers, the Zone and more.', mm: 'Make noise. Play noise. Look at noise (spectrum analysers).', util: 'Tools to squash, time, fix and fiddle with your PC.', edu: 'Learning! (Mom made us have this category.)', home: 'Boring but useful.', fun: 'Programs that do nothing useful whatsoever. Our most popular category.', dos: 'The good old days. Type the name and press Enter.', savers: 'Stop the screen getting burnt. In style.', tb: 'Toolbars for JackNet Explorer. We are legally required to list these. We are sorry.' }[c] || '';
    return frame(c, `<h1>${esc(CATS[c] || c)}</h1><p>${esc(intro)}</p>${table(ps)}`);
  }
  function top20() { return frame('top', `<h1>Top 20 Downloads</h1><p>The most downloaded files on the Shack, counted live by our new counter (it was broken until March).</p>${table(list().slice().sort((a, b) => dls(b) - dls(a)).slice(0, 20))}`); }
  function fresh() { return frame('new', `<h1>New Files</h1><p>Fresh uploads, newest first. Programs marked <span class="ssk-new">NEW!</span> arrived in the last couple of months.</p>${table(list().filter(p => !soon(p)).sort((a, b) => (/\/99$/.test(b.rel) ? date99(b.rel) : 0) - (/\/99$/.test(a.rel) ? date99(a.rel) : 0)).slice(0, 25))}`); }
  let lastQ = '';
  function search() {
    const q = lastQ.trim().toLowerCase(), hits = q ? list().filter(p => (p.n + ' ' + p.d + ' ' + p.by + ' ' + (CATS[p.cat] || '')).toLowerCase().includes(q)) : [];
    if (/virus|crack|warez|serial|hack/.test(q)) A.secret('setup.warez');
    return frame('search', `<h1>Search the Shack</h1><form class="ssk-sf ssk-searchrow"><input type="text" maxlength="40" value="${esc(lastQ)}" style="width:240px;max-width:100%"><button class="btn" type="submit" style="padding:2px 8px">Search</button></form>${q ? (/virus|crack|warez|serial|hack/.test(q) ? `<p><b>Nice try.</b> The Shareware Shack does not host cracks, serials or viruses. The hamster has reported you to your Mom. (He hasn't. But he could.)</p>` : `<p>Found <b>${hits.length}</b> program${hits.length === 1 ? '' : 's'} matching <b>${esc(lastQ)}</b>.</p>${table(hits)}`) : '<p>Type the name of a program, or what you want it to do (e.g. "music", "cards", "space").</p>'}`);
  }
  function soft(id) {
    const p = P(id); if (!p) return frame('x', '<h1>File not found</h1><p>The hamster ate it.</p>');
    const rv = REVIEWS(p);
    return frame(id, `<p class="small" style="margin:0 0 4px"><a href="${SH}">Home</a> &gt; <a href="${SH}cat/${p.cat}.html">${esc(CATS[p.cat] || p.cat)}</a> &gt; ${esc(p.n)}</p>
<h1>${esc(p.n)} ${isNew(p) ? '<span class="ssk-new">NEW!</span>' : ''}</h1>
<div class="ssk-prod"><div class="ssk-shot"><div class="w"><i></i><span>${icon(p, 48)}</span></div><small>screenshot (click to enlarge) (it won't)</small></div>
<div class="ssk-facts"><table><tr><td>Rating:</td><td>${squigs(p.sq)} <span class="small">(the hamster's opinion)</span></td></tr><tr><td>Visitors say:</td><td class="ssk-avg">no votes yet</td></tr><tr><td>Licence:</td><td>${lic(p.lic)}</td></tr><tr><td>Version:</td><td>${esc(p.v)}</td></tr><tr><td>Size:</td><td>${kbStr(p.kb)}</td></tr><tr><td>Released:</td><td>${esc(p.rel)}</td></tr><tr><td>Author:</td><td>${p.home ? `<a href="${esc(p.home.startsWith('http') ? p.home : 'http://www.jackattack.jnet/' + p.home)}">${esc(p.by)}</a>` : esc(p.by)}</td></tr><tr><td>Works on:</td><td>${OS(p)}</td></tr><tr><td>Needs:</td><td>${REQ(p)}</td></tr><tr><td>Downloads:</td><td data-dlc="${esc(p.id)}">${dls(p).toLocaleString('en-GB')}</td></tr></table></div></div>
${SU.has(p.id) ? `<p><span class="ssk-inst">YOU'VE GOT THIS ONE</span> ${esc(p.n)} is already installed on this computer. To get rid of it, use Control Panel &gt; Add/Remove Programs.</p>` : ''}
${p.nodl ? `<a class="ssk-dlbtn off">CD-ROM ONLY</a><p>${esc(p.n)} is too big to download (${kbStr(p.kb)}). Put the <b>${esc(p.disc || 'CD-ROM')}</b> in the drive and use Control Panel &gt; Add/Remove Programs &gt; Install.</p>` : `<a class="ssk-dlbtn" href="${SH}dl/${esc(p.id)}.html">&#11015; DOWNLOAD NOW!</a> <span class="small">${esc(SU.setupFile(p))} &middot; ${kbStr(p.kb)}</span><div class="ssk-times">Download time: ${times(p.kb)}</div>`}
<h2>Description</h2><p>${esc(p.d)}</p>${p.note ? `<p><b>Author's comments:</b> <i>"${esc(p.note)}"</i></p>` : ''}${p.disc ? `<p class="small">Also available on: ${esc(p.disc)}</p>` : ''}
<h2>Rate it!${window.Guest && Guest.is() ? Guest.badge() : ''}</h2><div class="ssk-rate" data-rate="${esc(p.id)}">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-r="${i}" title="${i} flopp${i > 1 ? 'ies' : 'y'}">${SQ(true)}</button>`).join('')} <span class="small ssk-mine"></span></div>
<h2>What people are saying</h2><div class="ssk-revs" data-revs="${esc(p.id)}">${rv.map(r => `<div class="ssk-rev"><b>${esc(r[0])}</b> ${squigs(r[1])} <span class="small">${esc(r[3])}</span><br>${esc(r[2])}</div>`).join('')}</div>
<form class="ssk-wr" data-wr="${esc(p.id)}" style="margin-top:8px"><div class="small">Write a review (be nice!):</div><div class="ssk-searchrow"><input type="text" maxlength="200" style="flex:1;min-width:160px"><button class="btn" type="submit" style="padding:2px 8px">Post</button></div></form>`);
  }
  const MIRRORS = [
    { host: 'ftp.sharewareshack.netz', n: 'HamsterPipe Main Server', where: 'Under Gubbinz\'s bed', speed: 5, note: 'Fastest! Usually.' },
    { host: 'ftp.room14.cyb', n: 'Room 14 Computer Club', where: 'School (only after 3:30pm)', speed: 4, note: 'Please don\'t tell the caretaker.' },
    { host: 'shoebox.grot', n: 'The Shoebox Mirror', where: 'A shoebox', speed: 3, note: 'Smells faintly of hamster.' },
    { host: 'members.homepagez.webcom', n: 'Homepagez FREE mirror', where: 'Somewhere in America', speed: 2, note: 'Pop-ups included free.' },
    { host: 'davespc.homepagez', n: 'Dave\'s PC', where: 'Dave\'s bedroom', speed: 1, note: 'Only works when his Mom is off the phone.', slow: true },
  ];
  function mirrors(id) {
    const p = P(id); if (!p) return soft(id);
    if (p.nodl) return soft(id);
    return frame('dl' + id, `<h1>Download ${esc(p.n)}</h1><p>Choose a download site near you. If one doesn't work, try another one. If none of them work, try again at 3 o'clock in the morning.</p>
<table class="ssk-t ssk-mir"><tr><th>Mirror</th><th class="hm">Location</th><th>Speed</th><th></th></tr>${MIRRORS.map((m, i) => `<tr><td><b>${esc(m.n)}</b><div class="small">${esc(m.host)}</div></td><td class="hm">${esc(m.where)}</td><td>${'&#9632;'.repeat(m.speed)}${'&#9633;'.repeat(5 - m.speed)}<div class="small">${esc(m.note)}</div></td><td><a class="ssk-dlbtn" data-mir="${i}" data-pid="${esc(p.id)}" style="font-size:12px;padding:3px 10px;margin:0">DOWNLOAD</a></td></tr>`).join('')}</table>
<p class="small">File: ${esc(SU.setupFile(p))} (${kbStr(p.kb)}). ${times(p.kb)}</p><p class="small">Problems downloading? Read <a href="${SH}help.html">Help! How do I install?</a></p><p><a href="${SH}soft/${esc(p.id)}.html">&laquo; Back to ${esc(p.n)}</a></p>`);
  }
  const page = (t, html) => frame(t, html);
  const help = () => page('help', `<h1>Help! How do I install?</h1><ol><li>Find a program you like and click <b>DOWNLOAD NOW!</b></li><li>Pick a mirror. The first one is usually fastest. Dave's PC is never fastest.</li><li>JackNet Explorer asks what to do with the file. Choose <b>Run this program from its current location</b> to install straight away, or <b>Save this program to disk</b> to keep the setup file in <b>My Documents\\My Downloads</b> (double-click it later, or use Add/Remove Programs &gt; Install... &gt; Browse).</li><li>The setup wizard appears on a big blue screen. Click Next a lot. Read the licence (nobody does). Click Finish.</li><li>Your new program is in <b>Start &gt; Programs</b>. Some put an icon on the desktop too.</li></ol><h2>How do I get rid of a program?</h2><p>Start &gt; Settings &gt; Control Panel &gt; Add/Remove Programs. Pick it, click Add/Remove, say Yes. Bits of JackOS itself (Paint, Calculator, the card games...) are on the <b>JackOS Setup</b> tab instead, and you'll need the JackOS 98 CD-ROM to put them back.</p><h2>The download stopped halfway!</h2><p>Somebody picked up the phone. Click Retry. Then go and ask them to stop.</p><h2>It says "Problem with Shortcut"!</h2><p>That means you uninstalled the program but the shortcut was somewhere else. Download it again from here, or put it back with Add/Remove Programs.</p>`);
  const about = () => page('about', `<h1>About the Shack</h1><p>The Shareware Shack started in 1996 as a shoebox of floppy disks under Gubbinz's bed. Now it's a shoebox of floppy disks under Gubbinz's bed <i>connected to the Internet</i>.</p><p>Every program is tested by our hamster, Nibbler. He rates them out of five floppies. He gave himself five floppies. We didn't argue.</p><p><b>Our promise:</b> no viruses, no cracks, no warez, and as few toolbars as we are legally allowed.</p><p>Contact: webmaster@sharewareshack.netz (we reply in 6 to 8 weeks).</p><p>Visitors: <b data-ssvis>...</b></p>`);
  const submit = () => page('submit', `<h1>Upload Your Shareware</h1><p>Written a program? Share it with the world! Fill in the form and post a floppy disk to: The Shareware Shack, The Shoebox, Under The Bed.</p><form class="ssk-up"><table><tr><td>Program name:</td><td><input type="text" maxlength="40"></td></tr><tr><td>Your name:</td><td><input type="text" maxlength="40"></td></tr><tr><td>What does it do?</td><td><input type="text" maxlength="100"></td></tr></table><button class="btn" type="submit">Send!</button></form><p class="small">Programs are reviewed by the hamster. Reviews take 6 to 8 weeks. Programs that make the hamster cry are rejected.</p>`);

  const REV_N = ['xX_Dave_Xx', 'PikaLord99', Cast.t('{cousin.first}*~*'), 'MegahertzMike', 'Gubbinz', 'CubeKid', 'grandad_ted', 'N64Fan1999', Cast.t('{kidSoon.first}sPage'), 'Biscuit (the dog)', 'Room14Rules', 'NotJack'];
  const REV_T = [[5, 'BEST PROGRAM EVER!!! Downloaded it 3 times just to be sure.'], [4, 'Really good. Took ages on my 33.6 but worth it.'], [5, 'My Mom thinks I am doing homework. I am not.'], [2, 'It crashed my computer but in a fun way.'], [3, 'OK I suppose. Needs more explosions.'], [5, 'Five floppies. No, SIX floppies.'], [1, 'Couldn\'t get it to work. Then I plugged the monitor in. Five stars.'], [4, 'Brilliant. Now I just need a faster computer.'], [3, 'Good but it asked me to restart three times.'], [5, 'Told everyone at school. Now everyone at school has it.'], [4, 'woof (5 floppies)'], [2, 'It installed a toolbar. I did not want a toolbar.']];
  function REVIEWS(p) { const x = hash(p.id), n = 1 + x % 3; return Array.from({ length: n }, (_, i) => { const t = REV_T[(x >>> (i * 3)) % REV_T.length], d = 1 + (x >>> (i + 2)) % 27, m = 1 + (x >>> (i + 4)) % 11; return [REV_N[(x >>> (i * 2)) % REV_N.length], p.k === 'tb' ? 1 : t[0], p.k === 'tb' ? 'It installed itself. I don\'t remember clicking anything. Now I have six toolbars.' : t[1], String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/99']; }).filter(r => date99(r[3]) <= today() || true); }

  function render(path) {
    let html;
    const m = path.match(/^\/(soft|dl|cat)\/([a-z0-9._-]+)\.html$/);
    if (path === '/') html = home();
    else if (path === '/new.html') html = fresh();
    else if (path === '/top.html') html = top20();
    else if (path === '/search.html') html = search();
    else if (path === '/help.html') html = help();
    else if (path === '/about.html') html = about();
    else if (path === '/submit.html') html = submit();
    else if (m && m[1] === 'cat') html = cat(m[2]);
    else if (m && m[1] === 'soft') html = soft(m[2]);
    else if (m && m[1] === 'dl') html = mirrors(m[2]);
    else html = home();
    const el = h(html);
    setTimeout(() => wire(el, path), 0);
    try { Net.kv.inc('ss.visits'); } catch (e) {}
    return el;
  }
  function wire(el, path) {
    fillCounts(el);
    qsa(el, '.ssk-sf').forEach(f => f.addEventListener('submit', ev => { ev.preventDefault(); lastQ = qs(f, 'input').value; IE.navigate(SH + 'search.html'); if (path === '/search.html') { const out = render('/search.html'); const host = el.parentNode; if (host) { host.innerHTML = ''; host.appendChild(out); } } }));
    qsa(el, '[data-ssad]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); if (window.OldPC && OldPC.popup) OldPC.popup(); else toast('Advertisement', 'Congratulations! You clicked an advert. Nobody ever does that.'); }));
    qsa(el, '[data-mir]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const mm = MIRRORS[+a.dataset.mir]; if (mm.slow) A.secret('setup.mirror'); SU.download(a.dataset.pid, mm); }));
    const up = qs(el, '.ssk-up'); if (up) up.addEventListener('submit', ev => { ev.preventDefault(); msg('The Shareware Shack', 'Thank you! Now post the floppy disk. (The hamster is waiting by the letterbox.)', 'info'); up.reset(); });
    const vis = qs(el, '[data-ssvis]'); if (vis && window.Net) Net.kv.get(['ss.visits']).then(v => { vis.textContent = (+v['ss.visits'] || 0).toLocaleString('en-GB'); });
    const rt = qs(el, '[data-rate]');
    if (rt && window.Net) {
      const id = rt.dataset.rate, key = 'ss.rt.' + id.replace(/[^a-z0-9._-]/g, '').slice(0, 30), mine = myId();
      const show = o => { const vals = Object.values(o || {}).map(Number).filter(x => x >= 1 && x <= 5); const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; const box = qs(el, '.ssk-avg'); if (box) box.innerHTML = vals.length ? `${squigs(avg)} <span class="small">(${avg.toFixed(1)} from ${vals.length} visitor${vals.length === 1 ? '' : 's'})</span>` : 'no votes yet'; const my = +((o || {})[mine] || 0); qsa(rt, 'button').forEach(b => b.classList.toggle('dim', my ? +b.dataset.r > my : false)); qs(rt, '.ssk-mine').textContent = my ? `You gave it ${my} flopp${my > 1 ? 'ies' : 'y'}.` : 'Click a floppy to vote.'; };
      let cur = {};
      Net.kv.get([key]).then(v => { cur = v[key] || {}; show(cur); });
      const un = Net.kv.watch(key, ev => { if (!el.isConnected) return un(); if (ev.type === 'put') { cur[ev.f] = ev.v; show(cur); } });
      qsa(rt, 'button').forEach(b => b.addEventListener('click', () => { if (window.Guest && Guest.is()) return Guest.need('Rating programs on the Shareware Shack', () => b.click()); if (!Net.kv.put(key, mine, b.dataset.r)) return toast('The Shareware Shack', 'You need to be online to vote. (Check the modem.)'); cur[mine] = b.dataset.r; show(cur); sfx('pet'); A.secret('setup.rate'); }));
    }
    const revs = qs(el, '[data-revs]'), wr = qs(el, '[data-wr]');
    if (revs && window.Net) {
      const key = 'ss.rv.' + revs.dataset.revs.replace(/[^a-z0-9._-]/g, '').slice(0, 30);
      const add = e => { const d = new Date(e.ts || Date.now()); revs.insertAdjacentHTML('beforeend', `<div class="ssk-rev"><b>${esc(e.by || 'Visitor')}</b>${e.member ? ' <span class="ssk-inst">JACKNET MEMBER</span>' : ''} <span class="small">${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/99</span><br>${esc(e.text)}</div>`); };
      Net.kv.get([key]).then(v => { (Array.isArray(v[key]) ? v[key] : []).forEach(add); });
      const un = Net.kv.watch(key, ev => { if (!el.isConnected) return un(); if (ev.type === 'push') add(ev.e); });
      if (wr) wr.addEventListener('submit', ev => { ev.preventDefault(); const t = qs(wr, 'input').value.trim(); if (!t) return; if (window.Guest && Guest.is()) return Guest.need('Writing reviews on the Shareware Shack', () => { if (wr.isConnected) wr.requestSubmit(); }); if (!Net.kv.push(key, t)) return toast('The Shareware Shack', 'Not connected. Your review is stuck in the modem.'); qs(wr, 'input').value = ''; A.secret('setup.review'); });
    }
  }

  // ================================================================ Squig Screen Mates
  const MATES = []; let raf = 0, lastT = 0;
  const SQUIG = (mood, f) => `<svg viewBox="0 0 32 28" width="32" height="28" aria-hidden="true"><g transform="translate(0 ${f ? 1 : 0})"><circle cx="8" cy="6.5" r="3.2" fill="#e8381b" stroke="#5a0a00"/><circle cx="24" cy="6.5" r="3.2" fill="#e8381b" stroke="#5a0a00"/><circle cx="8" cy="6.5" r="1.4" fill="#ff8a7a"/><circle cx="24" cy="6.5" r="1.4" fill="#ff8a7a"/><ellipse cx="16" cy="15" rx="13" ry="10.5" fill="#e8381b" stroke="#5a0a00"/><ellipse cx="11" cy="9.5" rx="4" ry="2" fill="#ff9a7a" opacity=".85"/><circle cx="6.5" cy="17" r="1.8" fill="#ffb0c0"/><circle cx="25.5" cy="17" r="1.8" fill="#ffb0c0"/>${mood === 'sleep' ? '<path d="M8.5 13q2.5 2 5 0M18.5 13q2.5 2 5 0" stroke="#5a0a00" stroke-width="1.4" fill="none"/>' : '<ellipse cx="11.5" cy="12.5" rx="3" ry="3.6" fill="#fff" stroke="#5a0a00" stroke-width=".7"/><ellipse cx="20.5" cy="12.5" rx="3" ry="3.6" fill="#fff" stroke="#5a0a00" stroke-width=".7"/><circle cx="12.2" cy="13.2" r="1.6"/><circle cx="21.2" cy="13.2" r="1.6"/><circle cx="11.7" cy="12.4" r=".6" fill="#fff"/><circle cx="20.7" cy="12.4" r=".6" fill="#fff"/>'}${mood === 'eat' ? '<ellipse cx="16" cy="19.5" rx="4.5" ry="3" fill="#5a0a20" stroke="#5a0a00"/><ellipse cx="16" cy="20.6" rx="2.6" ry="1.4" fill="#ff6a9a"/>' : mood === 'fall' ? '<ellipse cx="16" cy="19.5" rx="2.6" ry="2.6" fill="#5a0a20" stroke="#5a0a00"/>' : '<path d="M12 18.5q4 3.4 8 0" stroke="#5a0a00" fill="none" stroke-width="1.4" stroke-linecap="round"/>'}</g><path d="M${f ? '8 25l-3 2.5M24 25l3 2.5' : '10 25l-1.5 2.5M22 25l1.5 2.5'}" stroke="#5a0a00" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  function floorY() { const tb = $('taskbar'); return tb ? tb.getBoundingClientRect().top : innerHeight; }
  function ledges() {
    const out = [];
    qsa(document, '.win.float:not(.mate), #browser').forEach(w => { if (w.style.display === 'none' || w.classList.contains('min') || w.offsetParent === null && w.id !== 'browser') return; const r = w.getBoundingClientRect(); if (r.width < 60 || r.top < 30 || r.top > innerHeight - 60) return; if (document.body.classList.contains('maxed') && w.id === 'browser') return; out.push({ x1: r.left + 4, x2: r.right - 4, y: r.top }); });
    return out;
  }
  function addMate() {
    if (MATES.length >= 5) return toast('Blobbit Screen Mates', 'Five Blobbits is the maximum. Any more and they form a boy band.');
    const el = h(SQUIG('walk'), 'mate'); el.style.cssText = 'position:fixed;left:0;top:0;width:32px;height:28px;z-index:2147480000;cursor:grab;touch-action:none;user-select:none;will-change:transform';
    document.body.appendChild(el);
    const m = { el, x: 40 + Math.random() * (innerWidth - 120), y: -30, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1, st: 'fall', t: 0, frame: 0, ledge: null, mood: 'walk', drag: null, fed: 0 };
    MATES.push(m); store.set('jhp_setup_mates', MATES.length);
    el.addEventListener('pointerdown', ev => { ev.preventDefault(); el.setPointerCapture(ev.pointerId); m.drag = { dx: ev.clientX - m.x, dy: ev.clientY - m.y, lx: ev.clientX, ly: ev.clientY, vx: 0, vy: 0 }; m.st = 'drag'; el.style.cursor = 'grabbing'; sfx('boing'); });
    el.addEventListener('pointermove', ev => { if (!m.drag) return; m.drag.vx = (ev.clientX - m.drag.lx) * 0.6 + m.drag.vx * 0.4; m.drag.vy = (ev.clientY - m.drag.ly) * 0.6 + m.drag.vy * 0.4; m.drag.lx = ev.clientX; m.drag.ly = ev.clientY; m.x = ev.clientX - m.drag.dx; m.y = ev.clientY - m.drag.dy; });
    const drop = () => { if (!m.drag) return; m.vx = Math.max(-25, Math.min(25, m.drag.vx)); m.vy = Math.max(-25, Math.min(25, m.drag.vy)); m.drag = null; m.st = 'fall'; m.ledge = null; el.style.cursor = 'grab'; if (Math.hypot(m.vx, m.vy) > 18) A.secret('setup.yeet'); };
    el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
    el.addEventListener('contextmenu', ev => { ev.preventDefault(); IE.menu([{ label: 'Feed', act: () => { m.st = 'eat'; m.t = 0; m.fed++; sfx('pet'); if (m.fed >= 5) A.secret('setup.fatsquig'); } }, { label: 'Sleep', act: () => { m.st = 'sleep'; m.t = 0; } }, { label: 'Add another Blobbit', act: addMate }, '-', { label: 'About Blobbit Screen Mates...', act: () => msg('Blobbit Screen Mates 1.0', 'Blobbit Screen Mates 1.0\nby BlobSoft\n\nFreeware. Blobbits are not responsible for windows they sit on.\n\nTip: pick a Blobbit up and throw it!', 'info') }, { label: 'Go home', act: () => removeMate(m) }], ev.clientX, ev.clientY); });
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(step); }
    if (MATES.length >= 5) A.secret('setup.waaagh');
    return m;
  }
  function removeMate(m) { m.el.remove(); MATES.splice(MATES.indexOf(m), 1); store.set('jhp_setup_mates', MATES.length); if (!MATES.length) { cancelAnimationFrame(raf); raf = 0; } }
  function step(now) {
    raf = requestAnimationFrame(step);
    if (document.hidden) { lastT = now; return; }
    const dt = Math.min(50, now - lastT) / 16.7; lastT = now;
    if (!SU.has('mates')) { MATES.slice().forEach(removeMate); return; }
    const fy = floorY(), L = ledges();
    for (const m of MATES) {
      m.t += dt;
      if (m.st === 'drag') { m.mood = 'fall'; }
      else if (m.st === 'fall') {
        m.vy += 0.6 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= 0.99;
        if (m.x < 0) { m.x = 0; m.vx = Math.abs(m.vx) * 0.6; } if (m.x > innerWidth - 32) { m.x = innerWidth - 32; m.vx = -Math.abs(m.vx) * 0.6; }
        const feet = m.y + 28;
        const land = m.vy > 0 && L.find(l => m.x + 16 > l.x1 && m.x + 16 < l.x2 && feet >= l.y && feet - m.vy * dt <= l.y + 2);
        if (land) { m.y = land.y - 28; m.st = 'walk'; m.vy = 0; m.vx = 0; m.ledge = land; sfx('thud'); }
        else if (feet >= fy) { m.y = fy - 28; if (m.vy > 9) { m.vy = -m.vy * 0.35; sfx('thud'); } else { m.vy = 0; m.vx = 0; m.st = 'walk'; m.ledge = null; } }
        m.mood = 'fall';
      } else {
        // standing on the taskbar or a window's title bar
        const l = m.ledge && L.find(x => Math.abs(x.y - m.ledge.y) < 3 && Math.abs(x.x1 - m.ledge.x1) < 3);
        if (m.ledge && !l) { m.st = 'fall'; m.ledge = null; continue; } // the window moved or closed under it
        if (m.ledge) { m.ledge = l; m.y = l.y - 28; } else m.y = fy - 28;
        if (m.st === 'walk') {
          m.x += m.dir * 1.1 * dt; m.mood = 'walk';
          const x1 = m.ledge ? m.ledge.x1 - 10 : 0, x2 = m.ledge ? m.ledge.x2 - 22 : innerWidth - 32;
          if (m.x < x1 || m.x > x2) { if (m.ledge && Math.random() < 0.5) { m.st = 'fall'; m.vx = m.dir * 2; m.ledge = null; } else { m.dir = -m.dir; m.x = Math.max(x1, Math.min(x2, m.x)); } }
          if (Math.random() < 0.002 * dt) { m.st = pick2(['idle', 'idle', 'sleep', 'jump', 'eat']); m.t = 0; }
          if (!m.ledge && Math.random() < 0.0015 * dt && L.length) { m.st = 'jump'; m.t = 0; }
        } else if (m.st === 'jump') { const tgt = L[Math.floor(Math.random() * L.length)]; m.vy = -Math.min(22, 6 + Math.sqrt(Math.max(0, m.y - (tgt ? tgt.y : m.y) + 60)) * 1.1); m.vx = tgt ? Math.max(-6, Math.min(6, ((tgt.x1 + tgt.x2) / 2 - m.x) / 40)) : m.dir * 3; m.st = 'fall'; m.ledge = null; sfx('boing'); }
        else if (m.st === 'idle') { m.mood = 'walk'; if (m.t > 90) m.st = 'walk'; }
        else if (m.st === 'sleep') { m.mood = 'sleep'; if (m.t > 400) m.st = 'walk'; }
        else if (m.st === 'eat') { m.mood = 'eat'; if (m.t > 70) m.st = 'walk'; }
      }
      m.frame = (m.frame + dt * 0.12) % 2;
      const key = m.mood + (m.st === 'walk' ? Math.floor(m.frame) : 0) + (m.dir > 0 ? 'r' : 'l');
      if (m._k !== key) { m._k = key; m.el.innerHTML = SQUIG(m.mood, m.st === 'walk' && Math.floor(m.frame)) + (m.mood === 'sleep' ? '<b style="position:absolute;left:24px;top:-12px;font:bold 11px Arial;color:#fff;text-shadow:1px 1px #000">z</b>' : ''); }
      m.el.style.transform = `translate(${Math.round(m.x)}px,${Math.round(m.y)}px) scaleX(${m.dir > 0 ? -1 : 1})`;
    }
  }
  const pick2 = l => l[Math.floor(Math.random() * l.length)];
  function mates(arg) {
    if (arg === 'off') { MATES.slice().forEach(removeMate); store.set('jhp_setup_mates', 0); return; }
    const n = arg === 'boot' ? Math.min(5, store.get('jhp_setup_mates', 1)) : 1;
    if (arg === 'boot') store.set('jhp_setup_mates', 0);
    for (let i = 0; i < n; i++) addMate();
    if (arg !== 'boot') toast('Blobbit Screen Mates', 'A Blobbit has moved onto your desktop! Right-click it for options. Pick it up and throw it!', 5000);
  }

  // ================================================================ Desktop Fish Tank (no fish)
  function fish() {
    const b = h(`<canvas width="300" height="190" style="display:block;width:100%;image-rendering:pixelated;cursor:pointer;background:#0a3a6a"></canvas>`);
    const w = A.win('Desktop Fish Tank (no fish) - UNREGISTERED', b, { w: 320, icon: J('screensaver', 16), menubar: true, status: true, noMax: true, onClose: () => cancelAnimationFrame(r) });
    A.menubar(w, [['Tank', [{ label: 'Add Fish...', act: () => msg('Add Fish', 'Fish are only available in Desktop Fish Tank PRO.\n\nRegister now for just £19.99 and get: fish.', 'info', [['Register...', () => SU.showSoft('fish')], ['Maybe later']]) }, { label: 'Feed Fish', act: () => { flakes += 30; w.status.textContent = 'You fed the fish. There are no fish. The flakes sink sadly.'; } }, { label: 'Clean Tank', act: () => { dirt = 0; w.status.textContent = 'Tank cleaned. Sparkling. Empty, but sparkling.'; } }, '-', { label: 'Exit', act: () => w.close() }]], ['Help', [{ label: 'About Fish Tank...', act: () => msg('About Desktop Fish Tank', 'Desktop Fish Tank (no fish) 1.0\nAquaJack Software\n\nThis copy is UNREGISTERED.\nDay 3 of 30.\n\nFish: 0', 'info') }]]]);
    const c = qs(b, 'canvas'), g = c.getContext('2d');
    let r = 0, t = 0, taps = 0, shake = 0, flakes = 0, dirt = 0, fishT = 0;
    const bubbles = Array.from({ length: 14 }, () => ({ x: 40 + Math.random() * 220, y: 190 * Math.random(), s: 1 + Math.random() * 2.5 }));
    c.addEventListener('click', () => { taps++; shake = 10; sfx('thud'); w.status.textContent = taps < 10 ? 'Knock. Knock. (Please don\'t knock on the glass.)' : 'Something moved behind the castle...'; if (taps === 10) { fishT = 260; A.secret('setup.fish'); } });
    w.status.textContent = 'Fish: 0  |  Bubbles: lots';
    function draw() {
      r = requestAnimationFrame(draw); t++;
      const sx = shake ? (Math.random() - 0.5) * shake : 0; shake = Math.max(0, shake - 0.6);
      g.save(); g.translate(sx, 0);
      const grd = g.createLinearGradient(0, 0, 0, 190); grd.addColorStop(0, '#1a6aaa'); grd.addColorStop(1, '#062a4a'); g.fillStyle = grd; g.fillRect(-10, 0, 320, 190);
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(((t * 0.3 + i * 60) % 360) - 40, 0, 18, 190); }
      g.fillStyle = '#c8a860'; g.fillRect(-10, 168, 320, 22); for (let i = 0; i < 60; i++) { g.fillStyle = ['#a88840', '#e8c880', '#887030'][i % 3]; g.fillRect((i * 37) % 300, 170 + (i * 13) % 18, 3, 2); }
      for (let k = 0; k < 5; k++) { const bx = 20 + k * 62; g.strokeStyle = '#2a8a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, 170); for (let y = 0; y < 6; y++) g.lineTo(bx + Math.sin(t / 30 + y + k) * 6, 170 - y * 14); g.stroke(); }
      g.fillStyle = '#8a8a9a'; g.fillRect(200, 130, 40, 40); g.fillRect(196, 122, 10, 12); g.fillRect(234, 122, 10, 12); g.fillStyle = '#222'; g.fillRect(214, 150, 12, 20);
      g.fillStyle = '#8a5a1a'; g.fillRect(70, 152, 34, 18); const open = Math.sin(t / 60) > 0.6; g.fillStyle = '#a06a20'; g.fillRect(70, open ? 140 : 148, 34, 6); if (open) { g.fillStyle = '#ffd400'; g.fillRect(78, 150, 18, 3); bubbles[0].y = Math.min(bubbles[0].y, 150); }
      bubbles.forEach(bb => { bb.y -= bb.s * 0.6; if (bb.y < -4) { bb.y = 170; bb.x = 40 + Math.random() * 220; } g.strokeStyle = 'rgba(220,240,255,.8)'; g.beginPath(); g.arc(bb.x + Math.sin((t + bb.x) / 12) * 2, bb.y, bb.s, 0, 7); g.stroke(); });
      if (flakes > 0) { g.fillStyle = '#e8a040'; for (let i = 0; i < 8; i++) g.fillRect((i * 41 + t) % 300, ((t * 0.5 + i * 23) % 170), 2, 2); flakes -= 0.1; }
      if (fishT > 0) { fishT--; const fx = 300 - (260 - fishT) * 1.4, fy = 100 + Math.sin(t / 10) * 6; g.fillStyle = '#ff8a00'; g.beginPath(); g.ellipse(fx, fy, 9, 5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(fx + 8, fy); g.lineTo(fx + 15, fy - 5); g.lineTo(fx + 15, fy + 5); g.fill(); g.fillStyle = '#000'; g.fillRect(fx - 5, fy - 2, 2, 2); }
      dirt = Math.min(0.35, dirt + 0.00005); g.fillStyle = `rgba(60,90,30,${dirt})`; g.fillRect(-10, 0, 320, 190);
      g.restore();
    }
    draw();
    return w;
  }

  // ================================================================ DaveZip
  const ZIP = [['HOMEWORK.DOC', 24, 61], ['DAVE_RULES.BMP', 302, 88], ['CHEATS.TXT', 6, 54], ['WRESTLING.MID', 12, 31], ['SECRET.TXT', 1, 12, 'biscuit'], ['MR_TIDDLES.BMP', 288, 90], ['README.1ST', 2, 40], ['VIRUS.EXE', 0, 0]];
  function davezip() {
    const nag = h(`<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${(J('zip', 32) || '')}<div style="flex:1"><b>DaveZip 6.3 - UNREGISTERED</b><p style="margin:6px 0">This is an evaluation copy. You have been using it for <b>${412 + Desk.today99().md % 50}</b> days. The evaluation period is 30 days.</p><p style="margin:6px 0">Dave would really like his £29 now please.</p></div></div><div class="row dz-btns" style="justify-content:center;gap:8px;margin-top:8px"></div>`);
    const nw = A.win('DaveZip', nag, { w: 360, icon: J('zip', 16), noResize: true, noMax: true, noMin: true });
    const btns = [['I Agree', () => { nw.close(); main(); }], ['Quit', () => nw.close()], ['Ordering Info', () => msg('Ordering Info', 'Send £29 to:\nDave\nDave\'s House\n(next to the house with the trampoline)\n\nCheques payable to "DAVE".', 'info')]];
    if (Math.random() < 0.5) btns.reverse();
    btns.forEach(([l, f]) => { const bt = h('', 'btn', 'button'); bt.textContent = l; bt.addEventListener('click', f); qs(nag, '.dz-btns').appendChild(bt); });
    function main() {
      const b = h(`<div style="display:flex;gap:2px;padding:2px;border-bottom:1px solid #808080;flex-wrap:wrap">${['New', 'Open', 'Favorites', 'Add', 'Extract', 'View', 'CheckOut', 'Wizard'].map(n => `<button class="btn" data-z="${n}" style="padding:2px 6px;min-width:52px;font-size:11px">${n}</button>`).join('')}</div><div class="field" style="height:170px;overflow:auto;padding:0;background:#fff"><table class="dz" style="border-collapse:collapse;width:100%;font:11px Tahoma,sans-serif"><tr style="background:#c0c0c0">${['Name', 'Size', 'Ratio', 'Packed'].map(n => `<th style="text-align:left;padding:1px 4px;border:1px solid;border-color:#fff #808080 #808080 #fff;font-weight:normal">${n}</th>`).join('')}</tr>${ZIP.map((z, i) => `<tr data-i="${i}" style="cursor:default"><td style="padding:1px 4px">${z[3] ? '&#128274; ' : ''}${esc(z[0])}</td><td style="padding:1px 4px">${z[1] * 1024}</td><td style="padding:1px 4px">${z[2]}%</td><td style="padding:1px 4px">${Math.round(z[1] * 1024 * (100 - z[2]) / 100)}</td></tr>`).join('')}</table></div>`);
      const w = A.win('DaveZip (Unregistered) - DAVESTUFF.ZIP', b, { w: 430, icon: J('zip', 16), status: true });
      w.status.textContent = `Selected 0 files, 0 bytes          Total ${ZIP.length} files, 642KB`;
      let sel = -1;
      qsa(b, 'tr[data-i]').forEach(tr => { tr.addEventListener('click', () => { sel = +tr.dataset.i; qsa(b, 'tr[data-i]').forEach(x => { x.style.background = x === tr ? '#000080' : ''; x.style.color = x === tr ? '#fff' : ''; }); w.status.textContent = `Selected 1 file, ${ZIP[sel][1] * 1024} bytes          Total ${ZIP.length} files, 642KB`; }); tr.addEventListener('dblclick', () => view(+tr.dataset.i)); });
      function view(i) {
        const z = ZIP[i]; if (!z) return msg('DaveZip', 'Select a file first. (Click on it. Once. Not twice. Dave.)', 'info');
        if (z[0] === 'VIRUS.EXE') return msg('DaveZip', 'VIRUS.EXE is 0 bytes long. Dave says it\'s "a joke virus". It doesn\'t do anything. Like most of Dave\'s programs.', 'warn');
        const txt = { 'HOMEWORK.DOC': 'MY HOMEWORK by Dave\n\nWhat I did in the holidays:\n\nwrestling\n\n(the end)', 'CHEATS.TXT': 'DAVE\'S CHEATS\n\nSkiJack: press F to go faster. Then press it more.\nPinball: if you tilt it enough it gives up.\nBugsweeper: click the corners first.', 'README.1ST': 'READ ME FIRST!!!\n\nThis zip has all my best stuff. Do not open SECRET.TXT. It has a password. The password is NOT my dog\'s name.', 'WRESTLING.MID': null, 'DAVE_RULES.BMP': null, 'MR_TIDDLES.BMP': null }[z[0]];
        if (z[3]) return Desk.ask('Password', `SECRET.TXT is encrypted.\n\nEnter password:`, '', 20, v => { if (String(v || '').trim().toLowerCase() === z[3]) { A.secret('setup.davezip'); Desk.notepad('SECRET.TXT', 'DAVE\'S SECRET LIST\n==================\n\n1. I am scared of the Hamster Cam hamster.\n2. I still sleep with a Furby.\n3. I have NEVER beaten Jack at Bugsweeper.\n4. I know the password is my dog\'s name. Everyone knows. It\'s fine.\n5. I didn\'t really win the lightsaber duel. The photos are fake. Don\'t tell Jack.'); } else msg('DaveZip', 'Incorrect password. File skipped.\n\n(Hint: it\'s definitely not something that goes "woof".)', 'warn'); });
        if (txt) return Desk.notepad(z[0], txt);
        msg('DaveZip', `Extracting ${z[0]} to C:\\JACKOS\\TEMP...\n\nDone. Good luck finding it.`, 'info');
      }
      qsa(b, '[data-z]').forEach(bt => bt.addEventListener('click', () => {
        const n = bt.dataset.z;
        if (n === 'Extract' || n === 'View') return view(sel);
        if (n === 'CheckOut') return msg('CheckOut', 'CheckOut is only available in the registered version.\n\n(Dave doesn\'t know what it does either.)', 'info');
        if (n === 'Wizard') return msg('DaveZip Wizard', 'The DaveZip Wizard will help you... actually, Dave hasn\'t finished the wizard yet.', 'info');
        if (n === 'Add') return msg('Add', 'Drag files here to add them. (You can\'t drag files here.)', 'info');
        if (n === 'New' || n === 'Open') return msg('DaveZip', 'DaveZip can only open DAVESTUFF.ZIP. It\'s the only zip file Dave has ever made.', 'info');
        msg('Favorites', 'Favorite zip files:\n\n1. DAVESTUFF.ZIP', 'info');
      }));
      return w;
    }
    return nw;
  }

  function app(n, arg) { if (n === 'mates') return mates(arg); if (n === 'fish') return fish(); if (n === 'davezip') return davezip(); }
  window.Shack = { render, app };
})();

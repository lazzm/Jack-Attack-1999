/* setup-centre: the JackNet Software Centre (http://software.jacknet.jnet/), where a fresh JackOS 98 PC gets its programs,
 * plus the "Get Software" desktop folder and the Starter Pack installer (several programs in ONE download and ONE setup).
 * Lazy-loaded by setup.js, which owns the catalogue (Setup.list), the packs (Setup.PACKS) and the install state. */
(function () {
  const A = window.Apps, esc = A.esc, SU = window.Setup;
  const $ = id => document.getElementById(id);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const J = SU.J, kbStr = SU.kbStr, CATS = SU.CATS, C = SU.CENTRE;
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i, b), toast = (t, x, ms) => Desk.toast(t, x, ms);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mini = (svg, sz) => String(svg || '').replace('<svg', `<svg width="${sz || 32}" height="${sz || 32}"`);
  const icon = (p, s) => SU.iconOf(p, s || 16);
  const nick = () => (window.Net && Net.me && Net.me.nick) || 'there';
  const P = id => SU.get(id);
  // everything the Centre lists: third-party software (JackOS components live in JackOS Setup, toolbars on the Shack)
  const soft = () => SU.list.filter(p => p.k !== 'os' && p.k !== 'tb');
  const packOf = id => SU.PACKS.find(p => p.id === id);
  const packIds = pk => pk.ids.filter(id => P(id));
  const packKb = ids => ids.reduce((t, id) => t + (P(id) ? P(id).kb : 0), 0);

  // ================================================================ styles
  if (!$('centre-css')) {
    const css = h(null, null, 'style'); css.id = 'centre-css';
    css.textContent = `
.jsc{background:#fff;color:#000;font:12px/1.45 Verdana,Tahoma,Arial,sans-serif;min-height:100%;padding-bottom:12px}
.jsc a{color:#0033cc}.jsc a:visited{color:#663399}
.jsc-top{background:linear-gradient(90deg,#000060,#0a3a9a 45%,#0a8a9a);color:#fff;padding:8px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-bottom:3px solid #ffcc00}
.jsc-top svg{flex:none}
.jsc-top b{display:block;font:bold 22px/1.05 Verdana,Arial,sans-serif;letter-spacing:-.5px;text-shadow:2px 2px 0 #000040}
.jsc-top i{display:block;font:11px Verdana,sans-serif;color:#bfe8ff;font-style:normal}
.jsc-top .jsc-me{margin-left:auto;text-align:right;font-size:11px;color:#fff;background:rgba(0,0,40,.35);border:1px solid #6a9ad8;padding:3px 8px}
.jsc-top .jsc-me b{font-size:16px;display:inline;text-shadow:none;color:#ffcc00}
.jsc-nav{display:flex;flex-wrap:wrap;background:#dde8f8;border-bottom:1px solid #8aa0c8}
.jsc-nav a{padding:4px 10px;font:bold 11px Verdana,sans-serif;text-decoration:none;color:#000060!important;border-right:1px solid #b8c8e8}
.jsc-nav a.on{background:#fff}
.jsc-wrap{display:flex;gap:14px;padding:10px 12px 0}
.jsc-side{width:170px;flex:none}
.jsc-main{flex:1;min-width:0}
.jsc-box{border:1px solid #8aa0c8;margin:0 0 10px;background:#f4f8ff}
.jsc-box > b{display:block;background:#0a3a9a;color:#fff;font:bold 11px Verdana,sans-serif;padding:3px 6px}
.jsc-box > div{padding:5px 6px}
.jsc-cats a{display:flex;justify-content:space-between;padding:2px 0;text-decoration:none}
.jsc-cats a:hover{text-decoration:underline}
.jsc-cats small{color:#666}
.jsc h1{font:bold 17px Verdana,sans-serif;color:#000060;margin:2px 0 6px}
.jsc h2{font:bold 13px Verdana,sans-serif;color:#0a3a9a;margin:14px 0 6px;padding-bottom:2px;border-bottom:2px solid #ffcc00}
.jsc-hero{background:linear-gradient(#fffbe0,#fff1a8);border:2px solid #e0b000;padding:8px 10px;margin:0 0 10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.jsc-hero p{margin:0;flex:1;min-width:200px}
.jsc-big{font:bold 13px Verdana,sans-serif;padding:5px 14px;min-height:30px}
.jsc-packs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.jsc-pack{border:2px solid #0a3a9a;background:#fff;display:flex;flex-direction:column}
.jsc-pack .hd{display:flex;gap:8px;align-items:center;background:linear-gradient(#e8f0ff,#c8d8f8);padding:5px 6px;border-bottom:1px solid #8aa0c8}
.jsc-pack .hd b{font:bold 13px Verdana,sans-serif;color:#000060;display:block}
.jsc-pack .hd small{display:block;font-size:10px;color:#333}
.jsc-pack .bd{padding:5px 6px;font-size:11px;flex:1}
.jsc-pack .ics{display:flex;flex-wrap:wrap;gap:3px;margin:4px 0}
.jsc-pack .ics span{position:relative;display:inline-flex}
.jsc-pack .ics span.got::after{content:"\\2714";position:absolute;right:-3px;bottom:-4px;font:bold 10px Arial;color:#080;text-shadow:0 0 2px #fff,0 0 2px #fff}
.jsc-pack .ft{padding:5px 6px;border-top:1px dotted #8aa0c8;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.jsc-pack .ft small{color:#555;font-size:10px}
.jsc-list{border-top:1px solid #c8d4ec}
.jsc-it{display:flex;gap:8px;align-items:center;padding:5px 2px;border-bottom:1px solid #c8d4ec}
.jsc-it:nth-child(even){background:#f6f9ff}
.jsc-it .tx{flex:1;min-width:0}
.jsc-it .tx small{display:block;color:#444;font-size:10px}
.jsc-it .mt{font-size:10px;color:#555;text-align:right;white-space:nowrap}
.jsc-it .ac{flex:none;display:flex;gap:4px;align-items:center}
.jsc-it .btn{font-size:11px;padding:2px 8px;min-height:24px;white-space:nowrap}
.jsc-got{font:bold 10px Verdana,sans-serif;color:#080;white-space:nowrap}
.jsc-get{font-weight:bold;color:#000060}
.jsc-lic{display:inline-block;font:bold 9px Verdana,sans-serif;padding:0 3px;border:1px solid #000}
.jsc-lic.Freeware{background:#9f9}.jsc-lic.Shareware{background:#ff9}.jsc-lic.Demo{background:#9cf}.jsc-lic.Adware{background:#f99}.jsc-lic.Commercial{background:#ccc}.jsc-lic.Postcardware,.jsc-lic.Squigware,.jsc-lic.Pizzaware{background:#fcf}
.jsc-rank{font:bold 16px Verdana,sans-serif;color:#0a3a9a;width:26px;text-align:center;flex:none}
.jsc-where{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.jsc-where > div{border:1px solid #8aa0c8;padding:6px;background:#f8fbff;display:flex;gap:8px;align-items:flex-start}
.jsc-where b{display:block}
.jsc-foot{margin:16px 12px 0;padding-top:6px;border-top:1px solid #8aa0c8;font-size:10px;color:#555;text-align:center}
@media (max-width:640px){.jsc-wrap{flex-direction:column;padding:8px}.jsc-side{width:auto;order:2}.jsc-cats{display:flex;flex-wrap:wrap;gap:2px 12px}.jsc-cats a{display:inline}.jsc-top b{font-size:18px}.jsc-top .jsc-me{margin-left:0}.jsc-it{flex-wrap:wrap}.jsc-it .mt{display:none}.jsc-it .tx{flex-basis:calc(100% - 30px)}.jsc-it .ac{margin-left:24px}}
.gs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:4px;padding:6px;background:#fff;border:2px inset #fff;overflow:auto;height:100%;box-sizing:border-box;align-content:start}
.gs-ic{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 2px;border:1px dotted transparent;background:none;font:11px Tahoma,sans-serif;color:#000;cursor:default;text-align:center;min-height:64px}
.gs-ic span{padding:0 2px;line-height:1.2}
.gs-ic.sel span{background:#000080;color:#fff}
.gs-ic.sel{border-color:#808080}
.sp-main{display:flex;gap:10px}
.sp-side{width:96px;flex:none;background:linear-gradient(160deg,#0a3a9a,#000040);border:1px solid #808080;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;font:bold 11px Verdana,sans-serif;text-align:center;padding:6px}
.sp-body{flex:1;min-width:0;font:11px/1.35 Tahoma,sans-serif}
.sp-list{background:#fff;border:2px inset #fff;max-height:210px;overflow:auto;padding:2px}
.sp-row{display:flex;align-items:center;gap:6px;padding:2px 4px}
.sp-row label{display:flex;align-items:center;gap:5px;flex:1;min-width:0}
.sp-row .st{font-size:10px;color:#555;white-space:nowrap;min-width:56px;text-align:right}
.sp-row.done .st{color:#080;font-weight:bold}
.sp-row.now{background:#e8eeff}
@media (max-width:560px){.sp-side{display:none}}
`;
    document.head.appendChild(css);
  }

  // ================================================================ download counts (real ones, everybody's)
  const counts = {};
  let countsAt = 0;
  function fetchCounts() {
    if (!window.Net || !Net.kv || Date.now() - countsAt < 20000) return Promise.resolve();
    countsAt = Date.now();
    const keys = soft().filter(p => !p.nodl).map(p => 'ss.dl.' + p.id), batches = [];
    for (let i = 0; i < keys.length; i += 30) batches.push(keys.slice(i, i + 30));
    return Promise.all(batches.map(b => Net.kv.get(b).then(v => { Object.keys(v || {}).forEach(k => { counts[k.slice(6)] = +v[k] || 0; }); }))).catch(() => {});
  }
  const dl = id => counts[id] || 0;

  // ================================================================ bits of page
  const LOGO = '<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="#2a7ad8" stroke="#000040" stroke-width="2"/><path d="M5 18c7 3 10-4 17-1s7 7 13 5M6 29c8-3 12 2 19 0s6-4 12-2" stroke="#1aaa3a" stroke-width="4" fill="none"/><path d="M12 6a20 20 0 0 1 20 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/><rect x="24" y="24" width="18" height="16" fill="#e8c27a" stroke="#000"/><path d="M24 24l3-4h18l-3 4M42 24l3-4v16l-3 4" fill="#c8963a" stroke="#000"/><path d="M30 28h6v4h3l-6 6-6-6h3z" fill="#22c022" stroke="#000"/></svg>';
  const lic = l => `<span class="jsc-lic ${esc(l)}">${esc(String(l).toUpperCase())}</span>`;
  const L = (path, t, on) => `<a href="${C}${path.replace(/^\//, '')}"${on ? ' class="on"' : ''}>${t}</a>`;
  const shackLink = (p, t) => `<a href="${SU.SHACK}soft/${esc(p.id)}.html">${t || esc(p.n)}</a>`;
  function action(p) {
    if (SU.has(p.id)) return `<span class="jsc-got">&#10004; INSTALLED</span>${SU.fresh(p.id) ? '' : `<button type="button" class="btn" data-run="${esc(p.id)}">Open</button>`}`;
    if (p.nodl) return `<button type="button" class="btn" data-cd="${esc(p.id)}" title="${esc(p.disc || 'CD-ROM')}">Install from CD</button>`;
    return `<button type="button" class="btn jsc-get" data-get="${esc(p.id)}">Get it!</button>`;
  }
  const item = (p, rank) => `<div class="jsc-it">${rank ? `<span class="jsc-rank">${rank}</span>` : ''}${icon(p, 24)}<div class="tx"><b>${shackLink(p)}</b> ${lic(p.lic)}<small>${esc(p.d.length > 120 ? p.d.slice(0, 118) + '...' : p.d)}</small></div><div class="mt">${kbStr(p.kb)}<br>${p.nodl ? 'CD-ROM' : `<span data-dlc="${esc(p.id)}">${dl(p.id)}</span> downloads`}</div><div class="ac">${action(p)}</div></div>`;
  const list = (ps, ranked) => ps.length ? `<div class="jsc-list">${ps.map((p, i) => item(p, ranked ? i + 1 : 0)).join('')}</div>` : '<p><i>Nothing here yet.</i></p>';
  function packCard(pk) {
    const ids = packIds(pk), left = ids.filter(id => !SU.has(id));
    return `<div class="jsc-pack"><div class="hd">${mini(J(pk.ic, 32), 32)}<div><b>${esc(pk.n)}</b><small>${esc(pk.tag)}</small></div></div><div class="bd">${esc(pk.d)}<div class="ics">${ids.map(id => `<span class="${SU.has(id) ? 'got' : ''}" title="${esc(P(id).n)}${SU.has(id) ? ' (installed)' : ''}">${icon(P(id), 16)}</span>`).join('')}</div></div>
<div class="ft">${left.length ? `<button type="button" class="btn jsc-get" data-pack="${esc(pk.id)}">Install ${left.length === ids.length ? 'the pack' : 'the other ' + left.length}</button><small>${left.length} program${left.length === 1 ? '' : 's'} &middot; ${kbStr(packKb(left))}</small>` : '<span class="jsc-got">&#10004; YOU\'VE GOT THE LOT</span>'} <a href="${C}pack/${esc(pk.id)}.html" style="margin-left:auto;font-size:10px">What's in it?</a></div></div>`;
  }
  function frame(tab, inner) {
    const n = SU.mine().length;
    return `<div class="jsc"><div class="jsc-top">${LOGO}<div><b>JackNet Software Centre</b><i>Programs for your PC, straight down the phone line. Free! (Mostly.)</i></div><div class="jsc-me">Hello, ${esc(nick())}!<br>Your PC: <b>${n}</b> program${n === 1 ? '' : 's'} + JackOS 98</div></div>
<div class="jsc-nav">${L('/', 'Home', tab === 'home')}${L('/packs.html', 'Starter Packs', tab === 'packs')}${L('/popular.html', 'Popular', tab === 'pop')}${L('/az.html', 'A-Z', tab === 'az')}${L('/mypc.html', 'My PC', tab === 'mypc')}${L('/where.html', 'More places to look', tab === 'where')}</div>
<div class="jsc-wrap"><div class="jsc-side"><div class="jsc-box"><b>PRODUCT CATALOGUE</b><div class="jsc-cats">${Object.keys(CATS).filter(c => c !== 'tb' && soft().some(p => p.cat === c)).map(c => `<a href="${C}cat/${c}.html"><span>${esc(CATS[c])}</span> <small>(${soft().filter(p => p.cat === c).length})</small></a>`).join('')}</div></div>
<div class="jsc-box"><b>ALSO TRY</b><div style="font-size:11px"><a href="${SU.SHACK}">The Shareware Shack</a><br><a href="http://www.desktopdazzle.webcom/">Desktop Dazzle</a><br><a href="http://www.jacknetzone.jnet/">JackNet Gaming Zone</a><br><a href="http://www.jsn.jnet/">JSN</a><br><a href="#" data-act="cupboard">The Games Cupboard</a><br><a href="#" data-act="cover">The Cover CD</a></div></div>
<div class="jsc-box"><b>TIP</b><div style="font-size:11px">Changed your mind? <a href="#" data-act="addrem">Add/Remove Programs</a> takes things off again. Bits of JackOS itself are in <a href="#" data-act="winsetup">JackOS Setup</a>.</div></div></div>
<div class="jsc-main">${inner}</div></div><div class="jsc-foot">JackNet Software Centre &middot; Best viewed in JackNet Explorer 5 at 800x600 &middot; Every download checked by a hamster (he nibbles them) &middot; &copy; 1999 JackNet</div></div>`;
  }

  // ================================================================ pages
  function home() {
    const n = SU.mine().length;
    const pop = soft().filter(p => !p.nodl && dl(p.id) > 0).sort((a, b) => dl(b.id) - dl(a.id)).slice(0, 6);
    const hero = n ? `<p><b>Welcome back!</b> You've got ${n} program${n === 1 ? '' : 's'} on this PC. Fancy some more? A <b>Starter Pack</b> installs a whole bundle in one go.</p>`
      : SU.migrated ? '<p><b>Hello!</b> Everything that was already on your PC is still there. Here\'s where to get more.</p>'
      : '<p><b>Your PC is fresh out of the box!</b> It has JackOS 98, JackNet Explorer, JackMail Express, the accessories and a few card games. Everything else comes from here: pick a <b>Starter Pack</b> to fill it up in one go, or browse the catalogue.</p>';
    return frame('home', `<div class="jsc-hero">${mini(J('package', 32), 32)}${hero}<button type="button" class="btn jsc-big" data-go="packs.html">Starter Packs &raquo;</button></div>
<h2>Starter Packs</h2><div class="jsc-packs">${SU.PACKS.slice(0, 4).map(packCard).join('')}</div><p style="font-size:11px"><a href="${C}packs.html">See all ${SU.PACKS.length} packs (including one Dave made) &raquo;</a></p>
<h2>Popular with JackNet members</h2><div data-pop>${pop.length ? list(pop, true) : '<p><i>Counting the downloads... (if this stays empty, nobody has downloaded anything yet. Be the first!)</i></p>'}</div><p style="font-size:11px"><a href="${C}popular.html">The full chart &raquo;</a></p>
<h2>Browse the catalogue</h2><p>${Object.keys(CATS).filter(c => c !== 'tb' && soft().some(p => p.cat === c)).map(c => `<a href="${C}cat/${c}.html">${esc(CATS[c])}</a>`).join(' &middot; ')} &middot; <a href="${C}az.html">Everything A-Z</a></p>`);
  }
  function cat(c) {
    if (c === 'tb') return frame('cat', `<h1>Toolbars</h1><p>The JackNet Software Centre does not stock toolbars. They breed. If you really want one, <a href="${SU.SHACK}cat/tb.html">the Shareware Shack has loads</a> (sorry).</p>`);
    const ps = soft().filter(p => p.cat === c).sort((a, b) => (SU.has(a.id) - SU.has(b.id)) || b.sq - a.sq || a.n.localeCompare(b.n));
    return frame('cat', `<h1>${esc(CATS[c] || c)}</h1><p>${ps.length} programs. Not installed ones first. Click a name for screenshots, ratings and reviews on the Shareware Shack.</p>${list(ps)}`);
  }
  function packs() {
    return frame('packs', `<h1>Starter Packs</h1><p>A new PC is no fun empty. Each Starter Pack is <b>one download and one setup</b>: tick what you want, click Install, done. Programs you've already got are skipped.</p><div class="jsc-packs">${SU.PACKS.map(packCard).join('')}</div>`);
  }
  function pack(id) {
    const pk = packOf(id); if (!pk) return packs();
    const ids = packIds(pk);
    return frame('packs', `<p style="font-size:11px;margin:0 0 4px"><a href="${C}packs.html">Starter Packs</a> &gt; ${esc(pk.n)}</p><h1>${mini(J(pk.ic, 32), 32)} ${esc(pk.n)}</h1><p><i>${esc(pk.tag)}</i></p><p>${esc(pk.d)}</p>
<div class="jsc-hero"><p><b>${esc(pk.file)}</b> &middot; ${ids.length} programs &middot; ${kbStr(packKb(ids))}. About ${Math.max(1, Math.round(packKb(ids) / 4.8 / 60))} minutes on a 56K modem (the Centre's HamsterPipe does it in seconds).</p>${ids.some(x => !SU.has(x)) ? `<button type="button" class="btn jsc-big" data-pack="${esc(pk.id)}">Install ${esc(pk.n)}</button>` : '<span class="jsc-got">&#10004; YOU\'VE GOT THE LOT</span>'}</div>${list(ids.map(P))}`);
  }
  function popular() {
    const ps = soft().filter(p => !p.nodl).sort((a, b) => dl(b.id) - dl(a.id) || a.n.localeCompare(b.n)).slice(0, 25);
    return frame('pop', `<h1>Popular with JackNet members</h1><p>The 25 most downloaded programs on JackNet, counted live. Every download anybody makes from the Centre, the Shareware Shack or a program's own web site counts.</p><div data-pop>${list(ps, true)}</div>`);
  }
  function az() {
    const ps = soft().slice().sort((a, b) => a.n.localeCompare(b.n));
    return frame('az', `<h1>Everything, A to Z</h1><p>All ${ps.length} programs on JackNet.</p>${list(ps)}`);
  }
  function mypc() {
    const ps = SU.everything().map(P).sort((a, b) => a.n.localeCompare(b.n)), osN = SU.list.filter(p => p.k === 'os' && SU.has(p.id)).length, osAll = SU.list.filter(p => p.k === 'os').length;
    const me = window.Net && Net.me && Net.me.member;
    return frame('mypc', `<h1>My PC</h1><p><b>${SU.mine().length}</b> program${SU.mine().length === 1 ? '' : 's'} added, plus <b>${osN}</b> of ${osAll} JackOS 98 components (<a href="#" data-act="winsetup">JackOS Setup</a>).${me ? ' Your count is shown on your JackNet profile, and your programs follow you to any computer you log on from.' : ' <a href="http://www.jackattack.jnet/login">Log on to JackNet</a> and your programs follow you to any computer (and show on your profile).'}</p>
${ps.length ? `<div class="jsc-list">${ps.map(p => `<div class="jsc-it">${icon(p, 24)}<div class="tx"><b>${esc(p.n)}</b> ${lic(p.lic)}<small>${SU.fresh(p.id) ? 'Came with the PC.' : esc(p.by)} &middot; ${kbStr(p.kb)}</small></div><div class="ac"><button type="button" class="btn" data-run="${esc(p.id)}">Open</button><button type="button" class="btn" data-rm="${esc(p.id)}">Remove</button></div></div>`).join('')}</div>` : '<p><i>Nothing but JackOS. Very tidy. Very boring. Try a <a href="' + C + 'packs.html">Starter Pack</a>.</i></p>'}`);
  }
  const WHERE = [
    ['jacknet', 'The Shareware Shack', 'Every program on JackNet, with ratings, reviews and five mirrors (one is Dave\'s PC).', 'http://www.sharewareshack.netz/'],
    ['themes', 'Desktop Dazzle', 'Wallpapers, cursors, desktop themes, smileys and plug-ins.', 'http://www.desktopdazzle.webcom/'],
    ['zone', 'JackNet Gaming Zone', 'Play against real people, and get the Zone on your desktop.', 'http://www.jacknetzone.jnet/'],
    ['user', 'JSN', 'The JackNet Network portal, home of JSN Messenger.', 'http://www.jsn.jnet/'],
    ['cdrom', 'The Games Cupboard', 'Big CD-ROM games. Too big to download: put the disc in.', '#cupboard'],
    ['cd', 'Cover CD of the Month', 'The disc off the front of this month\'s JACK ATTACK! magazine.', '#cover'],
    ['cdrom', 'JACK ATTACK! Cover Disc 7', 'Playable demos: SkiJack, Pipe Jack, Jacklings, Pod Jack Racer, DOS games.', '#disc7'],
    ['addrem', 'Add/Remove Programs', 'Install from a CD-ROM or floppy, or from setup files you saved in My Downloads.', '#addrem'],
    ['webpage', 'The programs\' own web sites', 'Look for the yellow GET IT HERE strip: JackAmp, Uh-Oh!, JackIRC, the Cube Records page, Radio Jack, Room 14...', '#none'],
  ];
  function where() {
    return frame('where', `<h1>More places to get software</h1><p>The Centre has (nearly) everything, but in 1999 software came from everywhere: web sites, magazine discs, CD-ROMs in big boxes, and floppies from your mates.</p><div class="jsc-where">${WHERE.map(w => `<div>${mini(J(w[0], 32), 32)}<span>${w[3].startsWith('http') ? `<a href="${w[3]}"><b>${esc(w[1])}</b></a>` : w[3] === '#none' ? `<b>${esc(w[1])}</b>` : `<a href="#" data-act="${w[3].slice(1)}"><b>${esc(w[1])}</b></a>`}${esc(w[2])}</span></div>`).join('')}</div>`);
  }

  // ================================================================ render + wiring (one delegated listener; the page redraws itself when something is installed)
  function page(path) {
    const m = path.match(/^\/(cat|pack)\/([a-z0-9._-]+)\.html$/);
    if (path === '/packs.html') return packs();
    if (path === '/popular.html') return popular();
    if (path === '/az.html') return az();
    if (path === '/mypc.html') return mypc();
    if (path === '/where.html') return where();
    if (m && m[1] === 'cat') return cat(m[2]);
    if (m && m[1] === 'pack') return pack(m[2]);
    return home();
  }
  function act(k) {
    const br = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
    if (k === 'cupboard') return A.open('discs.cupboard');
    if (k === 'cover') return A.open('ssn.disc');
    if (k === 'disc7') return SU.coverDisc();
    if (k === 'addrem') return SU.applet(0);
    if (k === 'winsetup') return SU.applet(1);
    if (k === 'centre') { br(); return IE.navigate(C); }
  }
  function render(path) {
    const el = h(page(path));
    const draw = () => { el.innerHTML = page(path); fill(); };
    const fill = () => qsa(el, '[data-dlc]').forEach(e => { e.textContent = dl(e.dataset.dlc); });
    el.addEventListener('click', ev => {
      const t = ev.target.closest('[data-get],[data-run],[data-cd],[data-rm],[data-pack],[data-act],[data-go]'); if (!t) return;
      ev.preventDefault(); const d = t.dataset;
      if (d.get) { sfx('click'); return SU.download(d.get, { host: 'ftp.' + SU.CENTRE_HOST }); }
      if (d.run) return SU.launch(d.run);
      if (d.cd) return SU.install(d.cd, 'cd');
      if (d.rm) return SU.uninstall(d.rm);
      if (d.pack) return installPack(d.pack);
      if (d.go) return IE.navigate(C + d.go);
      if (d.act) return act(d.act);
    });
    const onCh = () => { if (el.isConnected) draw(); else document.removeEventListener('setup', onCh); };
    document.addEventListener('setup', onCh);
    fetchCounts().then(() => { if (el.isConnected && /^\/(|popular\.html)$/.test(path)) draw(); else fill(); });
    try { Net.kv.inc('su.centre.visits'); } catch (e) {}
    return el;
  }

  // ================================================================ Starter Packs: one download, one setup, several programs
  const DL_ICON = '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#003" /><path d="M6 11c5 2 7-3 12-1s5 6 9 4M5 20c6-2 9 3 14 1s5-4 8-3" stroke="#1a9a3a" stroke-width="3" fill="none"/></svg>';
  let busy = false;
  function installPack(id) {
    const pk = packOf(id); if (!pk) return;
    const todo = packIds(pk).filter(x => !SU.has(x));
    if (!todo.length) return msg(pk.n, `You've already got everything in ${pk.n}!`, 'info');
    if (busy) return msg('Starter Pack Setup', 'A Starter Pack is already being installed. One at a time! (This PC only has 32 MB of RAM.)', 'warn');
    const kb = packKb(todo);
    A.ui.dialog('File Download', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${DL_ICON}<div style="flex:1;min-width:0"><p style="margin:0 0 8px">You have chosen to download a file from this location.</p><p style="margin:0 0 8px"><b>${esc(pk.file)}</b> from ftp.${esc(SU.CENTRE_HOST)}</p><p style="margin:0 0 4px">${todo.length} program${todo.length === 1 ? '' : 's'} in one file (${kbStr(kb)}). Setup will start as soon as it has arrived.</p></div></div>`,
      [['Download', () => { setTimeout(() => fetchPack(pk, todo, kb), 40); }], ['Cancel']], { w: 400, icon: J('jacknet', 16) });
  }
  function fetchPack(pk, todo, kb) {
    busy = true;
    const b = h(`<div class="dl"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${DL_ICON}<div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(pk.file)} from ftp.${esc(SU.CENTRE_HOST)}</div><div class="sp-bar" style="margin:6px 0"></div><div class="small sp-left">Opening the line...</div></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">Cancel</button></div></div>`);
    const w = A.win('0% of ' + pk.file + ' Completed', b, { w: 380, icon: J('jacknet', 16), noResize: true, noMax: true, onClose: () => { busy = false; } });
    const set = A.ui.progBar(qs(b, '.sp-bar')), dur = clamp(2200 + Math.sqrt(kb) * 30, 2500, 6500), t0 = performance.now();
    qs(b, 'button').addEventListener('click', () => w.close());
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      const f = clamp((performance.now() - t0) / dur, 0, 1); set(f); w.setTitle(Math.floor(f * 100) + '% of ' + pk.file + ' Completed');
      qs(b, '.sp-left').textContent = f < 1 ? `${kbStr(Math.floor(kb * f))} of ${kbStr(kb)} copied (${(kb / dur * 1000 * (0.8 + Math.random() * 0.4)).toFixed(1)} KB/Sec)` : 'Download complete.';
      if (f >= 1) { clearInterval(iv); sfx('join'); setTimeout(() => { w.close(); busy = true; setupWin(pk, todo); }, 450); }
    }, 120);
  }
  function setupWin(pk, todo) {
    const left = window.OldPC && OldPC.NAMES ? Object.keys(OldPC.NAMES).filter(k => !OldPC.installed.includes(k)) : [];
    const sneaky = pk.id === 'dave' || Math.random() < 0.35 ? left[Math.floor(Math.random() * left.length)] : null;
    const b = h(`<div class="sp"><div class="sp-main"><div class="sp-side">${mini(J(pk.ic, 32), 48)}<span>${esc(pk.n)}</span></div><div class="sp-body"><p style="margin:0 0 6px"><b>Welcome to ${esc(pk.n)}${/Pack$/.test(pk.n) ? '' : ' Starter Pack'}!</b> Setup will install these programs. Untick anything you don't want.</p>
<div class="sp-list">${todo.map(id => `<div class="sp-row" data-id="${esc(id)}"><label><input type="checkbox" checked>${icon(P(id), 16)}<span>${esc(P(id).n)}</span></label><span class="st">${kbStr(P(id).kb)}</span></div>`).join('')}</div>
<label style="display:flex;gap:5px;align-items:center;margin-top:6px"><input type="checkbox" class="sp-ico" checked> Put shortcuts on the desktop</label>${sneaky ? `<label style="display:flex;gap:5px;align-items:flex-start;margin-top:3px;font-size:10px;color:#444"><input type="checkbox" class="sp-tb" checked> <span>Also install the FREE ${esc(OldPC.NAMES[sneaky])}! (recommended!!)</span></label>` : ''}
<div class="sp-all" style="margin-top:6px"></div><div class="small sp-st" style="margin-top:2px">&nbsp;</div></div></div>
<div class="row" style="justify-content:flex-end;gap:6px;margin-top:8px"><button class="btn" type="button" data-b="go" style="min-width:76px"><b>Install</b></button><button class="btn" type="button" data-b="x" style="min-width:76px">Cancel</button></div></div>`);
    const w = A.win(pk.n + ' Setup', b, { w: 470, icon: J('exe', 16), noResize: true, noMax: true, noMin: true, onClose: () => { busy = false; } });
    const go = qs(b, '[data-b=go]'), x = qs(b, '[data-b=x]'), st = qs(b, '.sp-st'), set = A.ui.progBar(qs(b, '.sp-all'));
    set(0);
    let done = [], running = false;
    x.addEventListener('click', () => { if (!running) return w.close(); });
    go.addEventListener('click', () => {
      if (running) return;
      if (done.length) { w.close(); return; }
      const rows = qsa(b, '.sp-row').filter(r => qs(r, 'input').checked);
      if (!rows.length) return msg(pk.n + ' Setup', 'You unticked everything. There is nothing to install!\n\n(Tick at least one program, or click Cancel.)', 'info');
      running = true; go.disabled = true; x.disabled = true;
      const noIcon = !qs(b, '.sp-ico').checked, tb = qs(b, '.sp-tb');
      qsa(b, 'input').forEach(i => { i.disabled = true; });
      if (sneaky && tb && !tb.checked) A.secret('setup.eagle');
      let i = 0;
      const next = () => {
        if (w.closed) return;
        if (i >= rows.length) return finish();
        const r = rows[i], id = r.dataset.id, p = P(id); r.classList.add('now'); r.scrollIntoView({ block: 'nearest' });
        const ms = clamp(420 + Math.log10(p.kb + 10) * 160, 500, 1300), t0 = performance.now();
        const tick = () => {
          if (w.closed) return;
          const f = clamp((performance.now() - t0) / ms, 0, 1);
          qs(r, '.st').textContent = Math.floor(f * 100) + '%'; set((i + f) / rows.length); st.textContent = `Installing ${p.n}: C:\\Program Files\\${p.dir}\\${p.exe}`;
          if (f < 1) return requestAnimationFrame(tick);
          SU.setInstalled(id, true, { noIcon }); done.push(id);
          try { Net.kv.inc('ss.dl.' + id); } catch (e) {}
          r.classList.remove('now'); r.classList.add('done'); qs(r, '.st').textContent = '\u2714 done';
          i++; setTimeout(next, 120);
        };
        requestAnimationFrame(tick);
      };
      next();
      function finish() {
        running = false; set(1);
        if (sneaky && tb && tb.checked && window.OldPC) { OldPC.install(sneaky); A.secret('setup.bundled'); }
        st.textContent = `Setup has finished installing ${done.length} program${done.length === 1 ? '' : 's'}. Find them in Start > Programs.`;
        go.disabled = false; go.innerHTML = '<b>Finish</b>'; x.hidden = true;
        sfx('solve'); A.secret('fresh.pack'); if (pk.id === 'dave') A.secret('fresh.dave');
        toast(pk.n, `${done.length} new program${done.length === 1 ? '' : 's'} installed! Look in Start > Programs${noIcon ? '' : ' and on the desktop'}.`, 6000);
      }
    });
    return w;
  }

  // ================================================================ the Get Software folder on the desktop
  const FOLDER = [
    [SU.ICON_GET, 'JackNet Software Centre', () => SU.openCentre()],
    ['package', 'Starter Packs', () => SU.openCentre('packs.html')],
    ['jacknet', 'The Shareware Shack', () => nav(SU.SHACK)],
    ['themes', 'Desktop Dazzle', () => nav('http://www.desktopdazzle.webcom/')],
    ['zone', 'JackNet Gaming Zone', () => nav('http://www.jacknetzone.jnet/')],
    ['user', 'JSN', () => nav('http://www.jsn.jnet/')],
    ['cdrom', 'Games Cupboard', () => A.open('discs.cupboard')],
    ['cd', 'Cover CD of the Month', () => A.open('ssn.disc')],
    ['cdrom', 'Cover Disc 7', () => SU.coverDisc()],
    ['addrem', 'Add/Remove Programs', () => SU.applet(0)],
    ['folder', 'My Downloads', () => A.open('explorer', 'C:/My Documents/My Downloads')],
    ['txt', 'Read Me First.txt', () => Desk.notepad('Read Me First.txt', README)],
  ];
  const README = `GETTING SOFTWARE FOR YOUR NEW PC
================================

Congratulations on your new JackOS 98 computer!

It comes with JackOS 98, JackNet Explorer, JackMail Express,
the Accessories (Notepad, WordPad, Paint, Calculator...),
the System Tools, Media Player and some card games.
Everything else you get off the Internet. For FREE. (Mostly.)

WHERE TO LOOK
  JackNet Software Centre ... everything, plus Starter Packs
  The Shareware Shack ....... ratings, reviews, five mirrors
  Desktop Dazzle ............ wallpapers, themes, cursors
  JackNet Gaming Zone ....... games against real people
  The Games Cupboard ........ big games on CD-ROM
  Cover CD of the Month ..... off the front of the magazine
  Programs' own web sites ... look for GET IT HERE

STARTER PACKS
  The Gamer, The Chatterbox, The Music Fan, The Nerd,
  The Show-Off, and Dave's Pack (do not install Dave's Pack).

TAKING THINGS OFF AGAIN
  Start > Settings > Control Panel > Add/Remove Programs.

If you are a JackNet member, your programs follow you to
any computer you log on from. Dave says this is "witchcraft".
`;
  const nav = url => { const b = $('browser'); if (b) b.classList.remove('min'); IE.navigate(url); };
  function folder() {
    A.secret('fresh.folder');
    const b = h(`<div class="gs-grid">${FOLDER.map((f, i) => `<button type="button" class="gs-ic" data-i="${i}">${f[0].startsWith('<svg') ? mini(f[0], 32) : mini(J(f[0], 32), 32)}<span>${esc(f[1])}</span></button>`).join('')}</div>`);
    b.style.height = '100%';
    const w = A.win('Get Software', b, { w: 470, h: 330, icon: mini(SU.ICON_GET, 16), status: true, minW: 240, minH: 180 });
    w.status.textContent = `${FOLDER.length} object(s)`;
    let last = 0, lastI = -1;
    const touch = matchMedia('(hover:none)').matches;
    qsa(b, '.gs-ic').forEach(e => {
      e.addEventListener('click', () => {
        const i = +e.dataset.i, now = Date.now();
        qsa(b, '.gs-ic').forEach(x => x.classList.toggle('sel', x === e));
        w.status.textContent = FOLDER[i][1];
        if (touch || (lastI === i && now - last < 450)) { last = 0; lastI = -1; FOLDER[i][2](); return; }
        last = now; lastI = i;
      });
      e.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); FOLDER[+e.dataset.i][2](); } });
    });
    return w;
  }

  window.Centre = { render, folder, installPack };
})();

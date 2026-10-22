/* econ-web: the page kit shared by every Rupee web site, plus The Rupee Emporium (shop) and JackNet Bank Online.
 * Loaded the first time one of the sites is visited. Pages are plain 1999 web pages: no OS windows in here. */
(function () {
  'use strict';
  if (window.EconWeb) return;
  const A = window.Apps, C = window.EconCat, esc = A.esc, store = A.store, fmt = Econ.fmt;
  const ROUTES = {};
  const pad = n => String(n).padStart(2, '0');
  const d99 = ts => { const d = new Date(ts); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/99`; };
  const t99 = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = () => { const t = window.Desk && Desk.today99 ? Desk.today99().date : new Date(1999, new Date().getMonth(), new Date().getDate()); return `${DAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]} 1999`; };
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' hr ago' : Math.floor(s / 86400) + ' days ago'; };
  const teef = n => Econ.rupees ? Econ.rupees(n) : `<span class="ec-tf">${Econ.TOOF}<b>${fmt(n)}</b></span>`; // (old name) an amount of Rupees with the right gem
  const rp = n => Econ.rp ? Econ.rp(n) : fmt(n) + ' Rupees', unteef = s => (Econ.unteef ? Econ.unteef(s) : String(s));
  const gemG = (c, x, y, sc, r) => `<g transform="translate(${x} ${y}) rotate(${r || 0}) scale(${sc})">${Econ.gem(c).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`; // a gem drawn inside another picture
  const sfx = n => { if (window.Sound) Sound.play(n); };

  // ================================================================ routing + per-page helpers
  function route(host, path, cls, fn) { ROUTES[host + path] = { cls, fn }; }
  function render(host, path, el, live) {
    const r = ROUTES[host + path];
    if (!r) { el.className = 'ecw ecw-err'; el.innerHTML = '<h2>404 Not Found</h2><p>The requested URL was not found on this server.</p>'; return; }
    el.className = 'ecw ' + r.cls;
    const P = ctxFor(el, live, host, path);
    try { r.fn(P); } catch (e) { console.error(e); el.innerHTML = '<p>This page has a bug in it. (Not the Millennium one. A normal one.)</p>'; }
  }
  function ctxFor(el, live, host, path) {
    const P = {
      el, live, host, path,
      on(t, fn) { live.offs.push(Econ.on(t, fn)); },
      sub(flags) { for (const k in flags) { Econ.sub(k, true); live.offs.push(() => Econ.sub(k, false)); } },
      every(fn, ms) { const id = setInterval(() => { if (el.isConnected && !document.hidden && el.offsetParent !== null) fn(); }, ms); live.offs.push(() => clearInterval(id)); return id; }, // nothing runs while the browser is minimised
      later(fn, ms) { const id = setTimeout(() => { if (el.isConnected) fn(); }, ms); live.offs.push(() => clearTimeout(id)); return id; },
      q: s => el.querySelector(s), qa: s => [...el.querySelectorAll(s)],
      // server complaints go into a box on the page, not a pop-up
      errTo(sel, cb) { P.on('err', msg => { const b = typeof sel === 'string' ? el.querySelector(sel) : sel; if (b) { b.innerHTML = `<b>Error:</b> ${esc(msg)}`; b.hidden = false; b.classList.remove('ec-msg-ok'); b.classList.add('ec-msg', 'ec-msg-err'); } sfx('uhoh'); if (cb) cb(msg); }); },
      say(sel, html, kind) { const b = typeof sel === 'string' ? el.querySelector(sel) : sel; if (!b) return; b.innerHTML = html; b.hidden = false; b.classList.remove('ec-msg-ok', 'ec-msg-err'); b.classList.add('ec-msg'); if (kind) b.classList.add('ec-msg-' + kind); },
    };
    return P;
  }
  const member = () => !!(Net.me && Net.me.member);
  function guestBox(what) {
    return `<div class="ec-guest"><b>You are not logged on to JackNet.</b> ${what || 'You need a FREE JackNet membership to earn and spend Rupees.'} It takes ten seconds and you get to pick your own name! <a href="#" class="ec-join" data-ecjoin="1">Join JackNet / Log On</a></div>`;
  }
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-ecjoin]'); if (!a) return; ev.preventDefault(); if (window.JackNetWeb) JackNetWeb.logon(); else IE.go('login', 'click'); });
  const footer = (extra) => `<div class="ec-foot">${extra || ''}<div class="ec-best"><span class="ec-ie"></span><span>Best viewed with <b>JackNet Explorer 5</b> at <b>800 x 600</b>, 256 colours.</span></div></div>`;

  // ================================================================ pictures of things you can buy
  const WALLS = {
    'wp.teefpile': () => ({ s: 'width="96" height="96"><rect width="96" height="96" fill="#1a1440"/>' + [[8, 6, 0, 'green'], [50, 2, 20, 'blue'], [28, 34, -15, 'red'], [72, 40, 30, 'gold'], [6, 62, 10, 'purple'], [44, 66, -25, 'green'], [80, 76, 5, 'blue'], [64, 12, -40, 'red'], [24, 82, 35, 'gold']].map(([x, y, r, c]) => gemG(c, x, y, 1.15, r)).join('') + '<path d="M40 30l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1zM88 20l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8zM14 46l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" fill="#fff"/>', col: '#1a1440', mode: 'Tile' }),
    'wp.squigs': () => ({ s: 'width="80" height="80"><rect width="80" height="80" fill="#ffe9c8"/>' + [[18, 18, '#e10600'], [58, 54, '#d1007a'], [56, 14, '#ff5a00'], [16, 60, '#c8002a']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><ellipse rx="12" ry="10" fill="${c}" stroke="#000"/><circle cx="-4" cy="-3" r="3" fill="#ff0" stroke="#000" stroke-width=".7"/><circle cx="5" cy="-3" r="3" fill="#ff0" stroke="#000" stroke-width=".7"/><circle cx="-4" cy="-3" r="1"/><circle cx="5" cy="-3" r="1"/><path d="M-8 4h16l-2 3-2-3-2 3-2-3-2 3-2-3-2 3z" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M-7 10l-2 4M7 10l2 4" stroke="#000" stroke-width="2"/></g>`).join(''), col: '#ffe9c8', mode: 'Tile' }),
    'wp.mushrooms': () => ({ s: 'width="120" height="120"><rect width="120" height="120" fill="#0a1424"/>' + [[20, 90, 1, '#3aff9a'], [70, 60, 1.4, '#9a6aff'], [100, 104, .8, '#3ad0ff'], [44, 30, .7, '#ffea3a']].map(([x, y, s, c]) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-6" rx="22" ry="14" fill="${c}" opacity=".18"/><rect x="-3" y="-4" width="6" height="12" rx="2" fill="#e8e0d0"/><path d="M-12-3c0-9 24-9 24 0z" fill="${c}"/><circle cx="-5" cy="-7" r="1.6" fill="#fff" opacity=".8"/><circle cx="4" cy="-8" r="1.2" fill="#fff" opacity=".8"/></g>`).join('') + '<circle cx="90" cy="20" r="1" fill="#fff"/><circle cx="10" cy="50" r=".8" fill="#fff"/>', col: '#0a1424', mode: 'Tile' }),
    'wp.skyline': () => ({ s: 'width="320" height="200"><defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1050"/><stop offset=".55" stop-color="#e0507a"/><stop offset="1" stop-color="#ffb040"/></linearGradient></defs><rect width="320" height="200" fill="url(#k)"/><circle cx="240" cy="132" r="30" fill="#ffe080" opacity=".9"/><path d="M0 200V150h20v-12l10-10 10 10v12h18v-30h26v40h12l14-20 14 20h10v-60h8l4-8 4 8h8v60h20V130l20-14 20 14v20h16v-24h30v24h10v-36l10-6 10 6v66z" fill="#140a1e"/><rect x="133" y="96" width="4" height="10" fill="#ffd400"/><rect x="66" y="128" width="6" height="6" fill="#ffd400"/><rect x="226" y="140" width="5" height="5" fill="#ffd400"/><path d="M288 108l6-8 6 8" fill="none" stroke="#140a1e" stroke-width="3"/>', col: '#140a1e', mode: 'Stretch' }),
    'wp.ticker': () => ({ s: 'width="200" height="80"><rect width="200" height="80" fill="#000"/><g font-family="Courier New,monospace" font-size="11">' + [['GEMS 121.40 +1.2', '#0f0'], ['PETS  44.10 -0.9', '#f33'], ['JNET  88.00 +9.9', '#0f0'], ['KART 199.95 -0.1', '#f33'], ['CUBE  90.20 +0.4', '#0f0']].map(([t, c], i) => `<text x="${(i * 37) % 80 + 4}" y="${i * 16 + 13}" fill="${c}">${t}</text>`).join('') + '</g>', col: '#000', mode: 'Tile' }),
    'wp.gold': () => ({ s: 'width="90" height="90"><rect width="90" height="90" fill="#5a0010"/><path d="M0 0l90 90M90 0L0 90" stroke="#6a0018" stroke-width="12"/>' + [[22, 14], [64, 52], [64, 8], [18, 58]].map(([x, y]) => gemG('gold', x, y, 1.4, 0)).join(''), col: '#5a0010', mode: 'Tile' }),
  };
  const wallImg = id => { const w = WALLS[id](); return { img: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + w.s + '</svg>')}`, col: w.col, mode: w.mode }; };
  function setWallpaper(id) {
    const w = wallImg(id), it = C.ITEM[id], o = { img: w.img, mode: w.mode, col: w.col, name: it.name };
    try { localStorage.setItem('jhp_prog_wall', JSON.stringify(o)); } catch (e) {}
    const dk = document.getElementById('desktop');
    if (dk) dk.style.background = w.mode === 'Stretch' ? `url("${w.img}") center/100% 100% no-repeat,${w.col}` : `url("${w.img}") 0 0/auto repeat,${w.col}`;
    A.fs.add('C:/JACKOS', { name: it.name.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '').toUpperCase().slice(0, 8) + '.BMP', type: 'img', art: w.img, size: '24 KB', date: '15/10/99' });
    Net.send({ t: 'ecWear', slot: 'wall', id });
    Desk.toast('Wallpaper changed!', `${it.name} is on your desktop now. Minimise the browser to have a look.`, 5000);
  }
  const PETS = {
    'pet.rock': '<ellipse cx="16" cy="21" rx="11" ry="8" fill="#9a9a9a" stroke="#000"/><path d="M8 18c3-3 8-4 12-2" stroke="#c8c8c8" stroke-width="2" fill="none"/><circle cx="12" cy="20" r="1.4"/><circle cx="19" cy="20" r="1.4"/><path d="M13 24q3 2 6 0" stroke="#000" fill="none"/>',
    'pet.snot': '<ellipse cx="16" cy="22" rx="7" ry="7" fill="#7ac03a" stroke="#000"/><path d="M9 18l-6-4 4 7zM23 18l6-4-4 7z" fill="#7ac03a" stroke="#000"/><circle cx="13" cy="20" r="1.6" fill="#e10600"/><circle cx="19" cy="20" r="1.6" fill="#e10600"/><path d="M13 25h6" stroke="#fff" stroke-width="1.4"/><path d="M16 22c.5 1.5 1 2 .5 3" stroke="#bfe" stroke-width="1.2" fill="none"/>',
    'pet.squig': '<ellipse cx="16" cy="17" rx="12" ry="10" fill="#e10600" stroke="#000"/><circle cx="11" cy="14" r="3" fill="#ff0" stroke="#000" stroke-width=".7"/><circle cx="21" cy="14" r="3" fill="#ff0" stroke="#000" stroke-width=".7"/><circle cx="11" cy="14" r="1"/><circle cx="21" cy="14" r="1"/><path d="M7 21h18l-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3z" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M10 26l-2 4M22 26l2 4" stroke="#000" stroke-width="2"/>',
    'pet.cube': '<rect x="8" y="6" width="16" height="16" fill="#111" stroke="#000"/>' + [['#e10600', 9, 7], ['#fff', 14.3, 7], ['#0028c8', 19.6, 7], ['#ffd400', 9, 12.3], ['#0a0', 14.3, 12.3], ['#ff8c00', 19.6, 12.3], ['#0a0', 9, 17.6], ['#e10600', 14.3, 17.6], ['#fff', 19.6, 17.6]].map(([c, x, y]) => `<rect x="${x}" y="${y}" width="4.4" height="3.6" fill="${c}"/>`).join('') + '<path d="M12 22v6h-3M20 22v6h3" stroke="#000" stroke-width="2" fill="none"/>',
  };
  const MISC = {
    'snd': '<path d="M5 12h5l7-6v20l-7-6H5z" fill="#ffd400" stroke="#000"/><path d="M21 10q4 6 0 12M24 7q7 9 0 18" stroke="#000" fill="none" stroke-width="1.5"/>',
    'gub.chow': '<rect x="7" y="8" width="18" height="18" rx="2" fill="#c8c8c8" stroke="#000"/><rect x="7" y="12" width="18" height="10" fill="#e10600"/><text x="16" y="19.5" text-anchor="middle" font-family="Impact,Arial" font-size="6" fill="#fff">CHOW</text><ellipse cx="16" cy="8" rx="9" ry="2" fill="#e8e8e8" stroke="#000"/>',
    'gub.cake': '<path d="M6 24h20l-2-9H8z" fill="#c88a4a" stroke="#000"/><path d="M8 15c0-8 16-8 16 0z" fill="#e8d8ff" stroke="#000"/><circle cx="12" cy="12" r="1.5" fill="#9a6aff"/><circle cx="19" cy="11" r="1.5" fill="#9a6aff"/><rect x="15" y="3" width="2" height="5" fill="#fff" stroke="#000" stroke-width=".5"/><path d="M16 1l1 2h-2z" fill="#ff8c00"/>',
    'gub.soap': '<rect x="6" y="12" width="20" height="12" rx="4" fill="#ff9ad8" stroke="#000"/><text x="16" y="20.5" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="5.5" fill="#fff">SOAP</text><circle cx="10" cy="9" r="3" fill="#fff" stroke="#9cf"/><circle cx="17" cy="7" r="2" fill="#fff" stroke="#9cf"/><circle cx="23" cy="9" r="2.5" fill="#fff" stroke="#9cf"/>',
    'misc.ram': '<rect x="3" y="10" width="26" height="12" fill="#0a6a2a" stroke="#000"/><rect x="5" y="12" width="5" height="6" fill="#222"/><rect x="11.5" y="12" width="5" height="6" fill="#222"/><rect x="18" y="12" width="5" height="6" fill="#222"/><path d="M4 22v2h24v-2" stroke="#c9a000" stroke-width="2" stroke-dasharray="1.2 .8"/><text x="25.5" y="19" font-family="Arial" font-size="5" fill="#fff">1</text>',
    'misc.y2k': '<rect x="5" y="4" width="22" height="24" fill="#fffbe8" stroke="#000"/><path d="M8 9h16M8 13h16M8 17h10" stroke="#888"/><circle cx="21" cy="22" r="4" fill="#e10600" stroke="#800"/><path d="M19 25l-1 4 3-2 3 2-1-4" fill="#e10600"/><text x="16" y="8" text-anchor="middle" font-family="Times New Roman" font-size="4">Y2K</text>',
    'misc.ticker': '<rect x="2" y="9" width="28" height="14" fill="#c0c0c0" stroke="#000"/><rect x="4" y="12" width="24" height="8" fill="#000"/><text x="5" y="18.5" font-family="Courier New,monospace" font-size="6" fill="#0f0">GEMS+4</text>',
    get 'misc.goldtoof'() { return gemG('gold', 5.2, 1.6, 1.8, 0) + '<path d="M27 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM5 22l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" fill="#fff" stroke="#c9a000" stroke-width=".3"/>'; },
  };
  function pic(id, big) {
    const it = C.ITEM[id]; if (!it) return '';
    const cls = 'ec-pic' + (big ? ' ec-pic-big' : '');
    let inner = '';
    if (it.cat === 'wall') { const w = wallImg(id); return `<span class="${cls}" style="background:url(&quot;${esc(w.img)}&quot;) center/${w.mode === 'Stretch' ? 'cover' : '48px'} ${w.col}"></span>`; }
    if (it.cat === 'cur') inner = Econ.CURSVG[id].replace('<svg ', '<svg viewBox="0 0 24 24" ');
    else if (it.cat === 'hat') inner = `<svg viewBox="0 -6 24 26"><circle cx="12" cy="17" r="7" fill="#3a9a2a" stroke="#000" stroke-width=".7"/><circle cx="9.6" cy="16" r="1" fill="#e10600"/><circle cx="14.4" cy="16" r="1" fill="#e10600"/>${Econ.hatSvg(id).replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/^/, '<g transform="translate(3 -2) scale(.75)">')}</g></svg>`;
    else if (it.cat === 'face') inner = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3a9a2a" stroke="#000" stroke-width=".7"/><g transform="translate(2 6) scale(.84)">${Econ.faceSvg(id).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
    else if (it.cat === 'badge') inner = Econ.badgeSvg(id);
    else if (it.cat === 'col') { const c = Econ.COLS[id]; inner = `<svg viewBox="0 0 32 32"><rect x="2" y="5" width="28" height="22" fill="${c[2]}" stroke="#000"/><rect x="3" y="6" width="26" height="5" fill="${c[0]}"/><rect x="16" y="6" width="13" height="5" fill="${c[1]}"/><rect x="20" y="20" width="8" height="5" fill="${c[2]}" stroke="#555"/></svg>`; }
    else if (it.cat === 'snd') inner = `<svg viewBox="0 0 32 32">${MISC.snd}</svg>`;
    else if (it.cat === 'pet') inner = `<svg viewBox="0 0 32 32">${PETS[id]}</svg>`;
    else if (it.cat === 'wal') inner = Econ.walSvg(id);
    else inner = `<svg viewBox="0 0 32 32">${MISC[id] || MISC['misc.goldtoof']}</svg>`;
    return `<span class="${cls}">${inner}</span>`;
  }
  const badgeName = id => (C.ITEM[id] ? C.ITEM[id].name : window.Loot && Loot.item && String(id).startsWith('L:') && Loot.item(id.slice(2)) ? Loot.item(id.slice(2)).name : '');
  const badge = id => id && badgeName(id) && Econ.badgeSvg(id) ? `<span class="ec-badge${String(id).startsWith('L:') && window.Loot ? ' ' + Loot.glowCls(id.slice(2)) : ''}" title="${esc(badgeName(id))}">${Econ.badgeSvg(id)}</span>` : '';

  window.EconWeb = { ROUTES, route, render, member, guestBox, footer, teef, rupees: teef, rp, unteef, gemG, fmt, esc, d99, t99, ago, longDate, pic, badge, setWallpaper, sfx, pad };

  // ================================================================ THE RUPEE EMPORIUM (www.rupeeshop.jnet; the old www.teefemporium.grot redirects here)
  const SH = 'www.rupeeshop.jnet', SU = 'http://' + SH;
  const basket = { get: () => store.get('jhp_econ_basket', []).filter(([id, n]) => C.ITEM[id] && n > 0), set: b => store.set('jhp_econ_basket', b) };
  let lastOrder = null;
  function shopTop(P, tab) {
    const b = basket.get(), n = b.reduce((q, x) => q + x[1], 0);
    const tabs = [['home', 'WELCOME', '/'], ...C.CATS.map(([k, l]) => [k, l.toUpperCase(), '/dept/' + k + '.html'])];
    return `<div class="sh-head"><a class="sh-logo" href="${SU}/"><span class="sh-gems">${Econ.gem('green')}${Econ.gem('blue')}${Econ.gem('red')}${Econ.gem('purple')}${Econ.gem('gold')}${Econ.gem('rainbow')}</span><span><b>THE RUPEE EMPORIUM</b><i>The biggest selection of stuff on the whole Internet! All prices in Rupees.</i></span></a>
      <div class="sh-acts"><a href="${SU}/basket.html" class="sh-bask"><span class="sh-cart"></span>BASKET <b>(${n})</b></a><a href="${SU}/stash.html">YOUR STASH</a><a href="${SU}/help.html">HELP</a></div></div>
      <div class="sh-tabs">${tabs.map(([k, l, u]) => `<a href="${SU}${u}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</div>
      <div class="sh-hello">${member() ? `Hello, <b>${esc(Net.me.nick)}</b>. You have ${teef(Econ.bal)} ${Econ.word(Econ.bal)} to spend. <a href="${SU}/stash.html">(Not ${esc(Net.me.nick)}? Click here.)</a>` : 'Hello, Guest! <a href="#" data-ecjoin="1">Log on to JackNet</a> to shop with Rupees.'}</div>`;
  }
  const SHOPCSS = 'ecw-shop';
  function itemRow(it, opts) {
    const owned = Econ.owned(it.id), have = (Econ.me && Econ.me.inv && Econ.me.inv[it.id]) | 0;
    const btn = it.use ? `<label class="sh-qty">Qty: <select data-qty="${it.id}">${[1, 2, 3, 5, 10].map(q => `<option>${q}</option>`).join('')}</select></label><button type="button" class="sh-add" data-add="${it.id}">ADD TO BASKET</button>${have ? `<div class="sh-have">You have ${have}</div>` : ''}`
      : owned ? `<span class="sh-owned">IN YOUR STASH</span>` : `<button type="button" class="sh-add" data-add="${it.id}">ADD TO BASKET</button>`;
    const req = it.req === 'plot' ? '<div class="sh-req">Requires: a plot in Jacktown</div>' : it.req === 'farm5' ? '<div class="sh-req">Requires: a Pixel Pet Farm with 5 pens</div>' : '';
    return `<tr><td class="sh-pc">${pic(it.id, opts && opts.big)}</td><td><a class="sh-name" href="${SU}/dept/${it.cat}.html">${esc(it.name)}</a><div class="sh-desc">${esc(it.desc)}</div>${req}<div class="sh-ship">Usually dispatched within <b>0 seconds</b>. ${it.use ? 'Each one is used up when you give it to Gubbinz.' : 'Yours forever (or until 1999 ends, which it won\'t).'}</div></td><td class="sh-pr"><span class="sh-price">${teef(it.price)} ${Econ.word(it.price)}</span>${btn}</td></tr>`;
  }
  function wireAdd(P) {
    P.qa('[data-add]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.add, sel = P.q(`[data-qty="${id}"]`), n = sel ? +sel.value : 1, it = C.ITEM[id];
      const bk = basket.get(), row = bk.find(x => x[0] === id);
      if (row) row[1] = it.use ? Math.min(20, row[1] + n) : 1; else bk.push([id, it.use ? n : 1]);
      basket.set(bk); sfx('pet');
      b.textContent = 'ADDED! \u2713'; b.classList.add('done');
      const c = P.q('.sh-bask b'); if (c) c.textContent = `(${bk.reduce((q, x) => q + x[1], 0)})`;
    }));
  }
  route(SH, '/', SHOPCSS, P => {
    A.secret('econ.emporium');
    const feat = ['wal.big', 'hat.crown', 'pet.cube', 'wp.teefpile', 'cur.toof', 'badge.tycoon', 'gub.chow', 'face.shades', 'misc.ticker'].map(id => C.ITEM[id]);
    const n = (Date.now() / 86400000 | 0);
    const deal = C.ITEMS.filter(i => !i.use)[n % C.ITEMS.filter(i => !i.use).length];
    P.el.innerHTML = `${shopTop(P, 'home')}
    <div class="sh-cols"><div class="sh-side"><div class="sh-box"><b>BROWSE</b>${C.CATS.map(([k, l]) => `<a href="${SU}/dept/${k}.html">${l}</a>`).join('')}</div>
      <div class="sh-box sh-sec"><span class="sh-lock"></span><b>SHOP IN SAFETY</b><br>Our SECURE SERVER keeps your Rupees safe. Guaranteed by Kev.</div>
      <div class="sh-box sh-key"><b>WHAT'S A RUPEE WORTH?</b>${[['green', 1], ['blue', 5], ['red', 20], ['purple', 50], ['gold', 100], ['rainbow', 500]].map(([c, v]) => `<span>${Econ.gem(c, 18)} <b>${v}</b> ${c[0].toUpperCase() + c.slice(1)}</span>`).join('')}</div>
      <div class="sh-box"><b>OTHER RUPEE SITES</b><a href="http://www.jackexchange.grot/">Jack Stock Exchange</a><a href="http://www.jacktown.jnet/">Jacktown</a><a href="http://www.jacknetbank.webcom/">JackNet Bank</a><a href="http://www.jacklotto.grot/">JackLotto</a><a href="http://www.jackdownpark.grot/">Jackdown Park Karts</a><a href="http://www.mypixelfarm.webcom/">My Pixel Pet Farm</a><a href="http://www.lootlings.jnet/">Lootlings</a></div></div>
    <div class="sh-main">${member() ? '' : guestBox('You can look around, but you need a FREE JackNet membership to buy things with Rupees.')}
      <div class="sh-news"><span class="sh-new blink">NEW!</span> <b>We've switched JackNet to RUPEES!</b> Your teef have been swapped for shiny Rupees 1-for-1 at the JackNet Bank, so you have exactly as many as before, only now they SPARKLE. <a href="${SU}/help.html">What are Rupees? &raquo;</a></div>
      <h1 class="sh-h">Welcome to The Rupee Emporium!</h1>
      <p>Everything here is paid for in <b>RUPEES</b>, the money of JackNet: shiny gems, and the colour tells you what they're worth. No pounds, no pennies, no "Mom, can I borrow". Earn Rupees by playing games, posting on the forums, writing to Jack and finding secrets. Then spend them here on stuff that <b>actually changes your computer</b>: wallpapers, mouse pointers, sounds, hats, wallets, pets for your taskbar and more!</p>
      <div class="sh-deal"><b class="blink">TODAY'S DEAL!!!</b> ${esc(deal.name)}: <s>${rp(deal.price)}</s> <b>${rp(deal.price)}!</b> <i>(Kev did the maths. That is the same price. He is very proud.)</i> <a href="${SU}/dept/${deal.cat}.html">See it &raquo;</a></div>
      <h2 class="sh-h2">Kev Recommends</h2><p class="sh-small">Kev works here on Saturdays. He has finished every game in the shop on the hardest setting and he WILL tell you about it.</p>
      <table class="sh-list">${feat.map(it => itemRow(it)).join('')}</table>
      <h2 class="sh-h2">Bestsellers this week</h2>
      <ol class="sh-best"><li>Gubbinz Chow (tin) <i>"He ate the tin as well" - Dave</i></li><li>Party Hat <i>"for the Millennium!!!"</i></li><li>Kid's Wallet <i>"RRRRRIP. everyone looked. 5 stars"</i></li><li>Pet Rock <i>"it hasn't moved. 5 stars"</i></li><li>Download More RAM <i>"my computer is exactly the same speed. 5 stars"</i></li><li>Cool Shades</li></ol>
      <div class="sh-msg" hidden></div></div></div>
    ${footer(`<p class="c">The Rupee Emporium is a JackNet company. Prices include Rupee Added Tax (RAT) at 0%. Orders: <b>${fmt(1240 + n % 500)}</b> today.</p>`)}`;
    wireAdd(P);
    Net.send({ t: 'ecMe' }); P.on('me', () => { const h = P.q('.sh-hello'); if (h) { const tmp = document.createElement('div'); tmp.innerHTML = shopTop(P, 'home'); h.innerHTML = tmp.querySelector('.sh-hello').innerHTML; } });
  });
  for (const [cat, label] of C.CATS) route(SH, '/dept/' + cat + '.html', SHOPCSS, P => {
    A.secret('econ.emporium');
    const blurb = { wall: 'Wallpapers for your desktop, drawn by hand (Jack\'s hand). Buy one, then press <b>Set as Wallpaper</b> in Your Stash.', cur: 'Mouse pointers! Your whole computer gets a new pointer the moment you start using it.', snd: 'Sound schemes play when programs open and close. (Turn the speaker on, bottom right!)', col: 'New colours for every window title bar. Very 1999. Very you.', hat: 'Hats for your Hangout avatar AND for Gubbinz when he walks about your desktop.', face: 'Shades, specs and stick-on moustaches for your Hangout avatar.', wal: 'Rupee Wallets are just for show: they change the wallet next to the gem in your tray and on your JackNet profile. Every wallet holds as many Rupees as you can earn. (The Bottomless Bag holds the same. It just looks better doing it.)', badge: 'Badges show up next to your name on the Rich List, your bank statement and in Jacktown.', pet: 'Adopt a pet for your taskbar! It walks about down there being cute (or rocky).', gub: 'Look after Gubbinz, the little green desktop pet EVERYONE on the site shares. Feed him from a tin and everyone sees it.', misc: 'Things we could not fit anywhere else.' }[cat];
    P.el.innerHTML = `${shopTop(P, cat)}<div class="sh-main sh-wide">${member() ? '' : guestBox('Log on to buy things.')}
      <div class="sh-crumb"><a href="${SU}/">The Rupee Emporium</a> &gt; <b>${esc(label)}</b></div><h1 class="sh-h">${esc(label)}</h1><p>${blurb}</p>
      <table class="sh-list">${C.ITEMS.filter(i => i.cat === cat).map(it => itemRow(it, { big: true })).join('')}</table>
      <p class="c"><a href="${SU}/basket.html" class="sh-go">GO TO BASKET &raquo;</a></p></div>${footer()}`;
    wireAdd(P);
  });
  route(SH, '/basket.html', SHOPCSS, P => {
    function draw() {
      const b = basket.get(), total = b.reduce((q, [id, n]) => q + C.ITEM[id].price * n, 0);
      P.el.innerHTML = `${shopTop(P, '')}<div class="sh-main sh-wide"><h1 class="sh-h">Your Shopping Basket</h1>
      ${b.length ? `<table class="sh-bt"><tr><th></th><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>${b.map(([id, n]) => `<tr><td>${pic(id)}</td><td><b>${esc(C.ITEM[id].name)}</b>${Econ.owned(id) && !C.ITEM[id].use ? '<div class="sh-req">You already own this! It will be taken out at checkout.</div>' : ''}</td><td class="c">${n}</td><td class="r">${teef(C.ITEM[id].price * n)}</td><td><a href="#" data-del="${id}">Remove</a></td></tr>`).join('')}<tr class="sh-tot"><td colspan="3" class="r"><b>Subtotal:</b></td><td class="r"><b>${rp(total)}</b></td><td></td></tr></table>
        <p class="r">${member() ? `You have ${teef(Econ.bal)} ${Econ.word(Econ.bal)}.` : ''} <a href="${SU}/checkout.html" class="sh-go">PROCEED TO CHECKOUT &raquo;</a></p>` : `<p>Your basket is empty. Kev looked inside it. Nothing. Not even a Rupee.</p><p><a href="${SU}/">Continue shopping &raquo;</a></p>`}</div>${footer()}`;
      P.qa('[data-del]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); basket.set(basket.get().filter(x => x[0] !== a.dataset.del)); draw(); }));
    }
    draw();
  });
  route(SH, '/checkout.html', SHOPCSS + ' sh-secure', P => {
    let b = basket.get().filter(([id]) => C.ITEM[id].use || !Econ.owned(id));
    const total = b.reduce((q, [id, n]) => q + C.ITEM[id].price * n, 0);
    P.el.innerHTML = `<div class="sh-sbar"><span class="sh-lock" data-lock="1" title="Click me"></span><b>SECURE SERVER</b> You are now shopping on our <u>SECURE SERVER</u>. All information you send is protected by <b>128-bit encryption</b>.<span class="sh-sinfo" hidden> That's sixteen whole bytes! Kev checks every packet by holding it up to the light, like a fiver. Certificate issued by: Kev. Expires: 31/12/99 (uh-oh).</span></div>
      <div class="sh-main sh-wide sh-co"><div class="sh-steps"><span>1. Basket</span><span class="on">2. Pay with Rupees</span><span>3. Done!</span></div>
      ${!member() ? guestBox('Log on to JackNet to pay with Rupees.') : !b.length ? `<p>There is nothing to pay for. <a href="${SU}/">Go shopping &raquo;</a></p>` : `
      <table class="sh-bt">${b.map(([id, n]) => `<tr><td>${pic(id)}</td><td>${esc(C.ITEM[id].name)}${n > 1 ? ' x ' + n : ''}</td><td class="r">${teef(C.ITEM[id].price * n)}</td></tr>`).join('')}<tr class="sh-tot"><td></td><td class="r">Order total:</td><td class="r"><b>${rp(total)}</b></td></tr><tr><td></td><td class="r">Delivery:</td><td class="r">FREE (down the modem)</td></tr></table>
      <fieldset class="sh-fs"><legend>Delivery details</legend><label>Deliver to: <select><option>Straight onto my computer</option><option>Under the bed</option><option>Behind the sofa</option><option>The bits box</option></select></label><label><input type="checkbox" checked> Send me the Rupee Emporium newsletter (it is just Kev's cheat codes)</label></fieldset>
      <fieldset class="sh-fs"><legend>Payment</legend>Paying from: <b>JackNet Bank Rupee Account</b> (${esc(Net.me.nick)})<br>Balance: ${teef(Econ.bal)} &nbsp; After this order: <b class="${Econ.bal - total < 0 ? 'neg' : ''}">${rp(Econ.bal - total)}</b></fieldset>
      <p class="c"><button type="button" class="sh-place">PLACE YOUR ORDER</button></p><div class="sh-prog" hidden><div>Transmitting order to SECURE SERVER...</div><div class="sh-bar"><i></i></div></div>`}
      <div class="sh-msg" hidden></div></div>${footer()}`;
    const lk = P.q('[data-lock]'); if (lk) lk.addEventListener('click', () => { P.q('.sh-sinfo').hidden = false; A.secret('econ.secure'); sfx('click'); });
    P.errTo('.sh-msg');
    const go = P.q('.sh-place'); if (!go) return;
    go.addEventListener('click', () => {
      if (Econ.bal < total) { P.say('.sh-msg', `<b>Payment declined.</b> You need ${rp(total)} and you have ${fmt(Econ.bal)}. Remove something from your basket, or go and earn some Rupees!`, 'err'); sfx('uhoh'); return; }
      go.disabled = true; P.q('.sh-prog').hidden = false;
      const bar = P.q('.sh-bar i'), res = []; let i = 0;
      const next = () => {
        bar.style.width = Math.round(i / b.length * 100) + '%';
        if (i >= b.length) { lastOrder = { res, ts: Date.now() }; basket.set(basket.get().filter(([id]) => !res.some(r => r.id === id && r.ok))); setTimeout(() => IE.navigate(SU + '/thanks.html'), 500); return; }
        const [id, n] = b[i++];
        const offA = Econ.on('ecBought', m => { if (m.id !== id) return; done(true, m); }), offE = Econ.on('err', msg => done(false, msg));
        const tm = setTimeout(() => done(false, 'The server did not answer.'), 6000);
        function done(ok, info) { offA(); offE(); clearTimeout(tm); res.push({ id, n, ok, info }); setTimeout(next, 350); }
        Net.send({ t: 'ecBuy', id, n });
      };
      setTimeout(next, 700);
    });
  });
  route(SH, '/thanks.html', SHOPCSS, P => {
    const o = lastOrder, ok = o ? o.res.filter(r => r.ok) : [];
    const no = ok.length ? ok[ok.length - 1].info.order : 0;
    P.el.innerHTML = `${shopTop(P, '')}<div class="sh-main sh-wide"><div class="sh-steps"><span>1. Basket</span><span>2. Pay with Rupees</span><span class="on">3. Done!</span></div>
      ${!o ? `<p>No recent order. <a href="${SU}/">Go shopping &raquo;</a></p>` : `<h1 class="sh-h">${ok.length ? 'Thank you for your order!' : 'Your order did not go through'}</h1>
      ${ok.length ? `<p>Order number: <b class="sh-ono">RE-${String(no).padStart(6, '0')}</b> &nbsp; Date: ${d99(o.ts)} ${t99(o.ts)}</p><ul>${ok.map(r => `<li>${esc(C.ITEM[r.id].name)}${r.n > 1 ? ' x ' + r.n : ''} (${rp(r.info.total)}) - <b>delivered to Your Stash</b></li>`).join('')}</ul>` : ''}
      ${o.res.filter(r => !r.ok).map(r => `<p class="sh-req">${esc(C.ITEM[r.id].name)}: ${esc(r.info)}</p>`).join('')}
      ${ok.length ? `<p><span class="sh-mailnote">Keep this page as your receipt, or print it.</span> Your new things are waiting in <a href="${SU}/stash.html">Your Stash</a>: go there to wear them, use them or set them as your wallpaper!</p><p><button type="button" class="sh-print">Print receipt</button></p>` : ''}`}
      </div>${footer()}`;
    if (ok.length) {
      A.secret('econ.firstbuy');
      const body = `Thank you for shopping at THE RUPEE EMPORIUM!\n\nOrder: RE-${String(no).padStart(6, '0')}\n\n${ok.map(r => `  ${C.ITEM[r.id].name}${r.n > 1 ? ' x ' + r.n : ''} ...... ${rp(r.info.total)}`).join('\n')}\n\nDelivered straight to Your Stash (www.rupeeshop.jnet/stash.html).\nNo refunds. No returns. No arguing with Kev about which console is best.\n\nKev\nSaturday Manager, The Rupee Emporium\n(Cheat of the week: on the title screen of any game, press UP UP DOWN DOWN. It probably does something.)`;
      if (!o.mailed) { o.mailed = Econ.mail({ from: 'The Rupee Emporium <orders@rupeeshop.jnet>', subj: `Your order RE-${String(no).padStart(6, '0')} has been dispatched!`, body }) ? 1 : -1; }
      if (o.mailed === 1) { P.q('.sh-mailnote').textContent = 'A confirmation e-mail has been sent to your JackMail Express Inbox.'; P.later(() => Desk.toast('JackMail Express', 'You have new mail! (From: The Rupee Emporium)', 5000), 2500); }
      P.q('.sh-print').addEventListener('click', () => { if (window.Spooler) Spooler.print(`Receipt RE-${String(no).padStart(6, '0')}.txt`, { pages: 1, owner: 'Jack', text: body }); });
    }
  });
  route(SH, '/stash.html', SHOPCSS, P => {
    function draw() {
      const me = Econ.me;
      if (!member() || !me) { P.el.innerHTML = `${shopTop(P, '')}<div class="sh-main sh-wide"><h1 class="sh-h">Your Stash</h1>${member() ? '<p>Asking the JackNet Bank what you own...</p>' : guestBox('Your stash is where the things you buy live.')}</div>${footer()}`; return; }
      const mine = C.ITEMS.filter(i => me.inv[i.id] > 0), w = me.wear || {};
      const act = it => {
        const id = it.id, on = slot => w[slot] === id;
        const b = (lab, a, extra) => `<button type="button" class="sh-act${extra ? ' ' + extra : ''}" data-act="${a}" data-id="${id}">${lab}</button>`;
        switch (it.cat) {
          case 'wall': return b(on('wall') ? 'Set again' : 'Set as Wallpaper', 'wall');
          case 'cur': case 'snd': case 'col': case 'face': case 'badge': return on(it.cat) ? `<b class="sh-in">IN USE</b>` + b('Stop', 'off-' + it.cat) : b({ cur: 'Use this pointer', snd: 'Use these sounds', col: 'Use these colours', face: 'Wear it', badge: 'Pin it on' }[it.cat], 'wear-' + it.cat);
          case 'hat': return (on('hat') ? `<b class="sh-in">ON YOUR HEAD</b>${b('Take off', 'off-hat')}` : b('Wear (Hangout)', 'wear-hat')) + (on('gub') ? `<b class="sh-in">ON GUBBINZ</b>${b('Take off Gubbinz', 'off-gub')}` : b('Put on Gubbinz', 'wear-gub'));
          case 'wal': return on('wal') ? `<b class="sh-in">IN YOUR TRAY</b>${b('Put it away', 'off-wal')}` : b('Use this wallet', 'wear-wal');
          case 'pet': return on('pet') ? `<b class="sh-in">ON YOUR TASKBAR</b>${b('Back in its box', 'off-pet')}` : b('Adopt onto taskbar', 'wear-pet');
          case 'gub': return `<span>x ${me.inv[id]}</span> ${b('Give to Gubbinz', 'use')}`;
          case 'misc': return id === 'misc.ram' ? b('Install RAM', 'ram') : id === 'misc.y2k' ? b('View certificate', 'y2k') : id === 'misc.ticker' ? b('Run Jack Ticker 98', 'ticker') : b('Admire it', 'admire');
        }
        return '';
      };
      P.el.innerHTML = `${shopTop(P, '')}<div class="sh-main sh-wide"><h1 class="sh-h">Your Stash</h1><p>Everything you own, ${esc(me.name)}. ${mine.length} thing${mine.length === 1 ? '' : 's'} so far. Wear stuff, use stuff, put stuff on Gubbinz.</p><div class="sh-msg" hidden></div>
        ${mine.length ? `<table class="sh-list sh-stash">${C.CATS.map(([k, l]) => { const its = mine.filter(i => i.cat === k); return its.length ? `<tr><th colspan="3">${esc(l)}</th></tr>` + its.map(it => `<tr><td class="sh-pc">${pic(it.id)}</td><td><b>${esc(it.name)}</b><div class="sh-desc">${esc(it.desc)}</div></td><td class="sh-pr">${act(it)}</td></tr>`).join('') : ''; }).join('')}</table>` : `<p>Nothing yet! <a href="${SU}/">Go shopping &raquo;</a></p>`}</div>${footer()}`;
      P.qa('[data-act]').forEach(bt => bt.addEventListener('click', () => doAct(bt.dataset.act, bt.dataset.id)));
    }
    function doAct(a, id) {
      sfx('click');
      if (a === 'wall') return setWallpaper(id);
      if (a.startsWith('wear-')) { const slot = a.slice(5); Net.send({ t: 'ecWear', slot, id }); if (slot === 'gub') { A.secret('econ.hat'); Desk.toast('Gubbinz', `Gubbinz is wearing the ${C.ITEM[id].name} now. Wait for him to walk past!`, 4000); } if (slot === 'pet') A.secret('econ.pet'); if (slot === 'wal') Desk.toast('Rupee Wallet', `Your ${C.ITEM[id].name} is in the tray now, next to your Rupees.`, 4000); return; }
      if (a.startsWith('off-')) return Net.send({ t: 'ecWear', slot: a.slice(4), id: '' });
      if (a === 'use') { Net.send({ t: 'ecUse', id }); return; }
      if (a === 'ram') { A.secret('econ.ram'); P.say('.sh-msg', 'Downloading 1 MB of RAM at 4.8 KB/sec... <span class="ec-dl"><i></i></span>', ''); P.later(() => { P.say('.sh-msg', '<b>RAM installed!</b> Your computer now has 65 MB of RAM instead of 64. You will not notice the difference. Nobody ever does.', 'ok'); Desk.toast('New Hardware Found', '1 MB of Download RAM (Rupee Emporium). JackOS has installed it. Please do not restart. Or do. It makes no difference.', 6000); }, 3200); return; }
      if (a === 'y2k') { A.fs.add('C:/My Documents/Rupees', { name: 'Y2K INSURANCE.txt', type: 'txt', date: '15/10/99', size: '1 KB', text: `CERTIFICATE OF Y2K INSURANCE\n============================\n\nThis certifies that ${Econ.me.name} is fully insured against the Millennium Bug.\n\nCOVERED: computers, video recorders, toasters, digital watches, Dave.\nNOT COVERED: anything that actually happens.\n\nThis policy expires at 23:59:59 on 31/12/1999, i.e. just before it is needed.\n\nSigned,\nKev (Head of Insurance, The Rupee Emporium. Also Head of Tills.)\n` }); A.openFile(A.fs.get('C:/My Documents/Rupees/Y2K INSURANCE.txt')); return; }
      if (a === 'ticker') return A.open('econ.ticker');
      if (a === 'admire') { P.say('.sh-msg', 'You hold the Solid Gold Rupee up to the light. It glints. Somewhere, Dave weeps with envy. <b>+0 Rupees. +100 smugness.</b>', 'ok'); return; }
    }
    draw();
    Net.send({ t: 'ecMe' });
    P.on('me', draw);
    P.errTo('.sh-msg');
    P.on('ecUsed', m => { if (m.id === 'gub.chow') A.secret('econ.feed'); Desk.toast('Gubbinz', { 'gub.chow': 'NOM NOM NOM. Gubbinz ate the whole tin. (And the tin.)', 'gub.cake': 'Gubbinz does a little dance. Cake!', 'gub.soap': 'Gubbinz is clean. He is FURIOUS.' }[m.id] || 'Gubbinz says fanks.', 4000); });
  });
  route(SH, '/help.html', SHOPCSS, P => {
    P.el.innerHTML = `${shopTop(P, '')}<div class="sh-main sh-wide"><h1 class="sh-h">Help &amp; FAQ</h1><dl class="sh-faq">
      <dt>What are Rupees?</dt><dd>The money of JackNet! Shiny gems, and the colour tells you what they're worth: ${[['green', 1], ['blue', 5], ['red', 20], ['purple', 50], ['gold', 100], ['rainbow', 500]].map(([c, v]) => `${Econ.gem(c, 16)} ${c} = ${v}`).join(', ')}. Every JackNet member has a Rupee account at JackNet Bank. The bank's computer keeps the real number, so nobody can cheat (we checked, Dave tried).</dd>
      <dt>Didn't JackNet used to have "teef"?</dt><dd>Yes! We've switched JackNet to RUPEES! Your teef have been swapped for shiny Rupees 1-for-1 at the JackNet Bank, so if you had 250 before, you have 250 Rupees now. Everything you bought is still in Your Stash.</dd>
      <dt>How do I get Rupees?</dt><dd>Log on every day, play the arcade games and submit high scores, post on the forums, write to Jack, chat, and find secrets on Jack's computer. You can also collect rent in <a href="http://www.jacktown.jnet/">Jacktown</a>, trade shares on the <a href="http://www.jackexchange.grot/">Jack Exchange</a>, breed Pixel Pets on <a href="http://www.mypixelfarm.webcom/">My Pixel Pet Farm</a> or have a flutter on the go-karts at <a href="http://www.jackdownpark.grot/">Jackdown Park</a>.</dd>
      <dt>I bought something. Where is it?</dt><dd>In <a href="${SU}/stash.html">Your Stash</a>. Things don't do anything until you use them there: Set as Wallpaper, Wear, Adopt...</dd>
      <dt>Does a bigger wallet hold more?</dt><dd>No! There is no limit at all. Rupee Wallets are just for show (they look great in your tray). Kev has the Bottomless Bag. He mentions it a lot.</dd>
      <dt>Can I give Rupees to my friend?</dt><dd>Yes! At <a href="http://www.jacknetbank.webcom/pay.html">JackNet Bank: Pay Someone</a>, up to 500 Rupees a day, once you've earned 100 yourself. (Kev says that stops Dave making forty accounts and giving them all to himself.) You can also swap things at the <a href="http://www.lootlings.jnet/trading.html">Lootlings Trading Post</a>.</dd>
      <dt>Can I have a refund?</dt><dd>No. But you can bulldoze things in Jacktown and get a third back. That is the closest thing to a refund in the whole of Jacktown.</dd>
      <dt>Is my information safe?</dt><dd>We use a SECURE SERVER. It has a padlock on it. A drawn one, but still.</dd></dl></div>${footer()}`;
  });

  // ================================================================ JACKNET BANK ONLINE (www.jacknetbank.webcom)
  const BH = 'www.jacknetbank.webcom', BU = 'http://' + BH, BCSS = 'ecw-bank';
  let bankSess = 0, bankLast = 0; // logged in to online banking (this visit only), and when you last did something
  const SESSION_MS = 3 * 60000;
  function bankTop(on) {
    return `<div class="bk-head"><div class="bk-logo"><span class="bk-shield"></span><span><b>JackNet Bank</b><i>Online Banking &middot; Est. 1998</i></span></div><div class="bk-date">${longDate()}</div></div>
      <div class="bk-nav"><a href="${BU}/" class="${on === 'home' ? 'on' : ''}">Home</a><a href="${BU}/statement.html" class="${on === 'st' ? 'on' : ''}">My Statement</a><a href="${BU}/pay.html" class="${on === 'pay' ? 'on' : ''}">Pay Someone</a><a href="${BU}/richlist.html" class="${on === 'rich' ? 'on' : ''}">The Rich List</a><a href="${BU}/help.html" class="${on === 'help' ? 'on' : ''}">Help</a>${bankSess ? '<a href="#" class="bk-out">Log Out</a>' : ''}</div>`;
  }
  function bankWire(P) {
    const o = P.q('.bk-out'); if (o) o.addEventListener('click', ev => { ev.preventDefault(); bankSess = 0; IE.navigate(BU + '/'); });
    const touch = () => { bankLast = Date.now(); };
    P.el.addEventListener('pointerdown', touch); P.el.addEventListener('keydown', touch);
    P.every(() => { if (bankSess && Date.now() - bankLast > SESSION_MS) timedOut(P); }, 5000);
  }
  function timedOut(P) {
    bankSess = 0; A.secret('econ.timeout');
    P.el.innerHTML = `${bankTop('')}<div class="bk-body bk-to"><h1>Your session has timed out</h1><p>For your security, you have been logged out of JackNet Bank Online because you did not do anything for <b>3 minutes</b>.</p><p>(Our server got bored. It is a 486 and it has feelings.)</p><p><a href="${BU}/">Log in again &raquo;</a></p></div>${bankFoot()}`;
  }
  const bankFoot = () => footer(`<p class="bk-small">JackNet Bank plc is not a real bank. Rupees and pocket money here are fictional game money. No real-money payments. Interest is paid daily at 0.1% (maximum 10 Rupees a day). <a href="${BU}/vault.html" class="bk-hid">staff</a></p>`);
  route(BH, '/', BCSS, P => {
    const show = () => {
      if (!member()) { P.el.innerHTML = `${bankTop('home')}<div class="bk-body"><div class="bk-cols"><div class="bk-login"><h2>Online Banking</h2><p>To open a JackNet Bank Rupee Account you first need to be a JackNet member. It's free!</p>${guestBox('Every member gets a Rupee account automatically.')}</div><div class="bk-ad"><h2>Banking at the speed of 56K!</h2><ul><li>Check your Rupee balance 24 hours a day*</li><li>See every Rupee that comes in and goes out</li><li><b>NEW:</b> balances now shown in shiny RUPEES!</li><li>0.1% interest EVERY DAY</li><li>No queues. No pens on chains. No Mr Hargreaves.</li></ul><p class="bk-small">*Except when Mom is on the phone.</p></div></div></div>${bankFoot()}`; bankWire(P); return; }
      if (!bankSess) {
        P.el.innerHTML = `${bankTop('home')}<div class="bk-body"><div class="bk-cols"><form class="bk-login" autocomplete="off"><h2>Log in to Online Banking</h2><label>Customer name<input type="text" value="${esc(Net.me.nick)}" readonly></label><label>Memorable word (any word will do, we're not fussy)<input type="password" maxlength="20" required></label><label class="bk-ck"><input type="checkbox"> Remember me on this computer (not recommended in 1999)</label><button type="submit">Log In</button><p class="bk-small">Your session will time out after 3 minutes of doing nothing, for your security.</p></form><div class="bk-ad"><h2>Did you know?</h2><p>JackNet Bank pays <b>0.1% interest a day</b>. That is over 40% a year! Mom's building society pays 5%. (The catch: it stops at 10 Rupees a day. Banks always have a catch.)</p><p><a href="${BU}/richlist.html">See the Rupee Rich List &raquo;</a></p></div></div></div>${bankFoot()}`;
        P.q('form').addEventListener('submit', ev => { ev.preventDefault(); const f = ev.target, b = f.querySelector('button'); b.disabled = true; b.textContent = 'Verifying...'; P.later(() => { bankSess = Date.now(); bankLast = Date.now(); A.secret('econ.bank'); sfx('click'); IE.navigate(BU + '/statement.html'); }, 900); });
        bankWire(P); return;
      }
      IE.navigate(BU + '/statement.html');
    };
    show(); P.on('me', () => { if (!bankSess) show(); });
  });
  const LABELS = { daily: 'LOG-ON BONUS', score: 'HIGH SCORE', record: 'RECORD!', post: 'FORUM POST', topic: 'FORUM TOPIC', gb: 'LETTER TO JACK', chat: 'CHAT', secret: 'SECRET FOUND', buy: 'RUPEE EMPORIUM', stock: 'JACK EXCHANGE', town: 'JACKTOWN', rent: 'JACKTOWN RENT', div: 'DIVIDENDS', int: 'INTEREST', lotto: 'JACKLOTTO', race: 'JACKDOWN PARK', farm: 'PIXEL PET FARM',
    cube: 'CUBE SOLVED', waaagh: 'WAAAGH!', petcare: 'GUBBINZ CARE', frag: 'JRT FRAG', fragwin: 'JRT WIN', quiz: 'QUIZ NIGHT', hpvisit: 'HOMEPAGE VISITOR', site: 'NEW WEB SITE', prog: 'NEW PROGRAM', play: 'PLAYTIME', cards: 'SOLITAIRE WIN', cupboard: 'GAMES CUPBOARD', pb: 'PERSONAL BEST', mission: 'DAILY MISSION', set: 'COLLECTION SET', ach: 'ACHIEVEMENT', recycle: 'LOOT RECYCLED', loot: 'LOOTLINGS SHOP', payout: 'PAYMENT SENT', payin: 'PAYMENT RECEIVED', trade: 'TRADING POST', bazaar: 'BAZAAR' };
  function stmtText(me) {
    const L = (s, n) => String(s).slice(0, n).padEnd(n), R = (s, n) => String(s).slice(0, n).padStart(n);
    const rows = me.log.slice().reverse().map(([ts, amt, code, note, bal]) => `${d99(ts)} ${L(unteef(note) || LABELS[code] || code, 34)} ${R(amt < 0 ? fmt(-amt) : '', 8)} ${R(amt > 0 ? fmt(amt) : '', 8)} ${R(fmt(bal), 10)}`);
    return { head: `DATE     DETAILS                            PAID OUT  PAID IN    BALANCE\n${'-'.repeat(73)}`, rows };
  }
  route(BH, '/statement.html', BCSS, P => {
    let exchangePending=false, exchangeNote='';
    const draw = () => {
      const me = Econ.me;
      if (!member()) { IE.navigate(BU + '/'); return; }
      if (!bankSess) { P.el.innerHTML = `${bankTop('st')}<div class="bk-body"><p>Please <a href="${BU}/">log in to Online Banking</a> first.</p></div>${bankFoot()}`; bankWire(P); return; }
      if (!me) { P.el.innerHTML = `${bankTop('st')}<div class="bk-body"><p>Fetching your statement from the mainframe...</p></div>${bankFoot()}`; bankWire(P); return; }
      const st = stmtText(me), caps = me.caps || {};
      P.el.innerHTML = `${bankTop('st')}<div class="bk-body"><div class="bk-sum"><div><span>Account</span><b>${esc(me.name)} ${badge((me.wear || {}).badge)}</b><small>Rupee Current Account, opened ${d99(me.opened || Date.now())}</small></div><div><span>Balance</span><b class="bk-bal">${teef(me.bal)}</b><small>Net worth (incl. shares and buildings): ${rp(me.worth)}</small></div><div><span>Lifetime</span><b>+${fmt(me.earned)} / -${fmt(me.spent)}</b><small>earned / spent</small></div></div>
        <div class="bk-paper"><div class="bk-holes l"></div><div class="bk-holes r"></div><pre class="bk-dm">JACKNET BANK PLC                STATEMENT OF ACCOUNT              SHEET 001
CUSTOMER: ${esc(me.name.toUpperCase().padEnd(20))}    PRINTED: ${d99(Date.now())} ${t99(Date.now())}      SORT CODE: 99-99-99

${st.head}
${st.rows.length ? st.rows.map(r => esc(r)).join('\n') : '  (no transactions yet - go and earn some Rupees!)'}
${'-'.repeat(73)}
                                              CLOSING BALANCE ${fmt(me.bal).padStart(10)}
</pre></div>
        <div class="bk-row"><button type="button" class="bk-print">Print statement</button><button type="button" class="bk-save">Save as STATEMENT.TXT</button><span class="bk-small">Last 50 transactions. Rent from Jacktown is paid every hour (pending: ${rp(Math.floor(me.rentAcc || 0))}).</span></div>
        <h2>Today's Rupee allowance</h2><p class="bk-small">You can only earn so much from each thing per day (it resets at midnight). Here's how much you've had:</p>
        <table class="bk-caps">${Object.keys(C.EARN).filter(k => !['set','ach','job','chall','hspocket','cashExchange'].includes(k)).map(k => { const [n, cap] = caps[k] || [0, C.EARN[k].cap]; return `<tr><td>${esc(C.EARN[k].label)}</td><td>${teef(C.EARN[k].amt)} each</td><td><span class="bk-cbar"><i style="width:${Math.round(n / cap * 100)}%"></i></span></td><td>${n} of ${cap}</td></tr>`; }).join('')}</table>
        <p>Log-on streak: <b>${me.streak} day${me.streak === 1 ? '' : 's'}</b> (missing a day only pauses it, it never goes down). Secrets cashed in: <b>${me.secrets}</b>. Money in from or out to other members is marked PAYMENT, TRADING POST or BAZAAR. <a href="${BU}/pay.html">Pay someone &raquo;</a></p></div>${bankFoot()}`;
      bankWire(P);
      const txt = `JACKNET BANK PLC - STATEMENT OF ACCOUNT\nCUSTOMER: ${me.name}\n\n${st.head}\n${st.rows.join('\n')}\n\nCLOSING BALANCE: ${rp(me.bal)}\n`;
      const wallet=me.wallet;
      if(wallet){
        const cash=p=>'£'+(p/100).toFixed(2), section=document.createElement('section');section.className='bk-paper';
        section.innerHTML='<h2>Pocket Money Exchange</h2><p>Cash in your pocket: <b data-cash></b> &middot; £1 = 20 Rupees</p><p>Earn pounds and pence from Mom\'s jobs and Saturday pocket money, then exchange them here. In-game money only.</p><form data-exchange><label>Amount in pounds <input name="pounds" type="number" min="0.05" max="20" step="0.05" value="1.00" required></label> <button type="submit">Exchange for Rupees</button></form><p class="bk-small" data-limit></p><p data-exchange-message role="status"></p>';
        section.querySelector('[data-cash]').textContent=cash(wallet.pence);section.querySelector('[data-limit]').textContent='Daily limit: £20. Remaining today: '+cash(wallet.remaining)+'. Minimum 5p; multiples of 5p. No fees.';
        section.querySelector('[data-exchange-message]').textContent=exchangeNote;
        section.querySelector('input').value=(Math.min(100,wallet.pence,wallet.remaining)/100).toFixed(2);
        const ledger=document.createElement('div');ledger.innerHTML='<details><summary>Pocket money statement</summary><table><tbody>'+wallet.log.slice(-8).reverse().map(row=>'<tr><td>'+esc(d99(row[0]))+'</td><td>'+esc(row[2])+'</td><td>'+esc((row[1]<0?'-':'+')+cash(Math.abs(row[1])))+'</td></tr>').join('')+'</tbody></table></details><p class="bk-small"><a href="http://www.oddjobz.jnet/">Find an odd job</a>, or check Mom\'s list in the house to earn pocket money.</p>';section.appendChild(ledger);
        const button=section.querySelector('button');button.disabled=exchangePending||wallet.pence<5||wallet.remaining<5;
        section.querySelector('form').addEventListener('submit',ev=>{
          ev.preventDefault();if(exchangePending)return;
          const value=ev.target.elements.pounds.value;if(!/^\d{1,2}(\.\d{1,2})?$/.test(value))return;
          const parts=value.split('.'),pence=Number(parts[0])*100+Number(((parts[1]||'')+'00').slice(0,2));
          if(pence%5||pence<5||pence>Math.min(wallet.pence,wallet.remaining,2000)){section.querySelector('[data-exchange-message]').textContent='Choose a multiple of 5p within your cash balance and daily limit.';return;}
          exchangePending=true;button.disabled=true;
          if(!Econ.send({t:'ecExchange',pence,nonce:wallet.nonce})){exchangePending=false;button.disabled=false;section.querySelector('[data-exchange-message]').textContent='Disconnected. Reconnect before exchanging. No money was taken.';}
        });
        P.q('.bk-sum').after(section);
      }
      P.q('.bk-print').addEventListener('click', () => { A.secret('econ.print'); if (window.Spooler) Spooler.print('Bank Statement.txt', { pages: Math.max(1, Math.ceil(st.rows.length / 40)), owner: 'Jack', text: txt }); else Desk.toast('Print', 'No printer installed.'); });
      P.q('.bk-save').addEventListener('click', () => { A.fs.add('C:/My Documents/Rupees', { name: 'STATEMENT.TXT', type: 'txt', date: d99(Date.now()), size: Math.max(1, Math.round(txt.length / 1024)) + ' KB', text: txt }); Desk.toast('Download complete', 'STATEMENT.TXT saved to C:\\My Documents\\Rupees', 4000); });
    };
    Net.send({ t: 'ecMe' }); draw(); P.on('me', draw);
    P.on('exchanged',m=>{exchangeNote='Receipt: '+ '£'+(m.pence/100).toFixed(2)+' exchanged for '+m.rupees+' '+(m.rupees===1?'Rupee':'Rupees')+'.';P.later(()=>{exchangePending=false;draw()},900)});
    P.on('err',msg=>{exchangePending=false;exchangeNote=msg;draw()});
  });
  route(BH, '/richlist.html', BCSS, P => {
    P.el.innerHTML = `${bankTop('rich')}<div class="bk-body"><h1>The Rupee Rich List 1999</h1><p>The richest members of JackNet, by net worth (cash, plus shares at today's price, plus a third of what their Jacktown buildings cost). Updated live by our mainframe.</p><div class="bk-rich">Loading...</div></div>${bankFoot()}`;
    bankWire(P);
    P.on('ecRich', m => {
      const box = P.q('.bk-rich'); if (!box) return;
      if (!m.list.length) { box.innerHTML = '<p>Nobody has any Rupees yet. Be the first!</p>'; return; }
      box.innerHTML = `<table class="bk-rt"><tr><th>#</th><th>Member</th><th class="r">Net worth</th><th class="r">Cash</th><th class="r">Ever earned</th></tr>${m.list.map((x, i) => `<tr class="${member() && x.n === Net.me.nick ? 'me' : ''}"><td>${i + 1}</td><td><a href="#" data-prof="${esc(x.n)}">${esc(x.n)}</a> ${badge(x.badge)}${x.gold ? ' <span class="bk-star" title="Owns a Solid Gold Rupee">&#9733;</span>' : ''}${x.plot >= 0 ? ' <span class="bk-small">(Jacktown landlord)</span>' : ''}</td><td class="r">${teef(x.w)}</td><td class="r">${fmt(x.b)}</td><td class="r">${fmt(x.e)}</td></tr>`).join('')}</table><p>${m.me ? `You are number <b>${m.me}</b> of ${m.n} account holders.` : `${m.n} account holders.`}</p>`;
      P.qa('[data-prof]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); if (window.Community && Community.openProfile) Community.openProfile(a.dataset.prof); }));
      A.secret('econ.richlist');
    });
    Net.send({ t: 'ecRich' });
  });
  route(BH, '/pay.html', BCSS, P => {
    const draw = () => {
      const me = Econ.me, L = window.Loot && Loot.me;
      if (!member()) { P.el.innerHTML = `${bankTop('pay')}<div class="bk-body"><h1>Pay Someone</h1>${guestBox('Sending Rupees to other members is for JackNet members.')}</div>${bankFoot()}`; bankWire(P); return; }
      const lim = L && L.pay ? L.pay : { sent: 0, max: 500, ok: true };
      P.el.innerHTML = `${bankTop('pay')}<div class="bk-body"><h1>Pay Someone</h1><p>Send Rupees from your account to another JackNet member: to say thank you, to pay for a hat, or because they are your best mate. It goes straight into their account and shows on both statements.</p>
        <form class="bk-login bk-pay" autocomplete="off"><label>Pay to (JackNet member name)<input type="text" name="to" maxlength="16" required></label><label>Amount (Rupees)<input type="number" name="amt" min="1" max="500" step="1" required></label><label>Note (optional, they will see it)<input type="text" name="note" maxlength="60" placeholder="for the Viking Helmet"></label><button type="submit">Send Payment</button>
        <p class="bk-small">Your balance: <span class="bk-pbal">${teef(me ? me.bal : 0)}</span>. Sent today: <b class="bk-psent">${fmt(lim.sent)}</b> of ${fmt(lim.max)}.${lim.ok ? '' : ' <b>You need to have earned 100 Rupees yourself before you can send any.</b>'} Payments cannot be cancelled, so check the name!</p></form><div class="bk-paymsg" hidden></div>
        <h2>Ways to pay for things</h2><ul><li><b>Pay Someone</b> (this page): just send Rupees.</li><li><a href="http://www.lootlings.jnet/trading.html">The Lootlings Trading Post</a>: swap items (and Rupees) safely. Nothing moves until you both tick OK.</li><li><a href="http://www.lootlings.jnet/bazaar.html">The Lootlings Bazaar</a>: buy things other members are selling, at the price they set.</li></ul></div>${bankFoot()}`;
      bankWire(P);
      const f = P.q('form');
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const to = f.to.value.trim(), amt = Math.floor(+f.amt.value), note = f.note.value.trim();
        if (!to || !(amt > 0)) return;
        Desk.msgbox('Confirm Payment', `Send ${rp(amt)} to ${to}?${note ? '\n\nNote: ' + note : ''}\n\nThis cannot be undone.`, 'q', [['Send', () => { f.querySelector('button').disabled = true; Net.send({ t: 'lootPay', to, amt, note }); }], ['Cancel']]);
      });
    };
    Net.send({ t: 'ecMe' }); Net.send({ t: 'lootMe' }); draw();
    if (window.Loot) {
      P.live.offs.push(Loot.on('paid', m => { P.say('.bk-paymsg', `<b>Payment sent!</b> ${rp(m.amt)} went to <b>${esc(m.to)}</b>. Your balance is now ${rp(m.bal)}.`, 'ok'); sfx('solve'); A.secret('loot.pay'); const b = P.q('form button'); if (b) b.disabled = false; f2(); }));
      P.live.offs.push(Loot.on('err', msg => { P.say('.bk-paymsg', `<b>Payment failed:</b> ${esc(msg)}`, 'err'); sfx('uhoh'); const b = P.q('form button'); if (b) b.disabled = false; }));
    }
    const f2 = () => { const L = window.Loot && Loot.me, b = P.q('.bk-pbal'), c = P.q('.bk-psent'); if (b && Econ.me) b.innerHTML = teef(Econ.me.bal); if (c && L && L.pay) c.textContent = fmt(L.pay.sent); };
    P.on('me', f2); if (window.Loot) P.live.offs.push(Loot.on('me', f2));
  });
  route(BH, '/vault.html', BCSS + ' bk-vaultpg', P => {
    A.secret('econ.vault');
    P.el.innerHTML = `${bankTop('')}<div class="bk-body bk-vault"><h1>STAFF ONLY: THE VAULT</h1><pre class="bk-door">   ___________________________________
  |  _______________________________  |
  | |                               | |
  | |      J A C K N E T   B A N K  | |
  | |          ( O )  ( O )         | |
  | |             \\  /              | |
  | |         ===[ () ]===          | |
  | |              ||               | |
  | |_______________________________| |
  |___________________________________|</pre>
      <p>Where are all the Rupees actually kept? The truth: <b>in a sock</b>, in a drawer, in Kev's bedroom. The "mainframe" is a pocket calculator with a cracked screen. It is missing two batteries.</p><p>Security system: <span class="blink">ARMED</span> (Gubbinz, with a stick).</p><p class="bk-small">Behind the door, a hand-written sign: "GREEN ONES IN THE LEFT BUCKET. RAINBOW ONES IN THE SAFE. DO NOT MIX UP THE BUCKETS."</p><p><a href="${BU}/">Back to the bank before anyone sees you</a></p></div>${bankFoot()}`;
  });
  route(BH, '/help.html', BCSS, P => {
    P.el.innerHTML = `${bankTop('help')}<div class="bk-body"><h1>Help</h1><dl class="sh-faq"><dt>Where do my Rupees come from?</dt><dd>See <b>Today's Rupee allowance</b> on your statement. You earn for logging on, high scores, forum posts, letters, chatting, secrets, rent, dividends, interest, lotto, kart races and Pixel Pets.</dd><dt>Why is my money sparkly?</dt><dd>JackNet's money is RUPEES now (see <a href="http://www.rupeeshop.jnet/help.html">the Emporium's help page</a>). Same number as before, more sparkle.</dd><dt>Can I send Rupees to my friend?</dt><dd>Yes: <a href="${BU}/pay.html">Pay Someone</a>. Up to 500 Rupees a day, and a member can receive up to 1,000 a day. You must have earned 100 Rupees yourself first. (Fraud prevention. Dave.) Every payment shows on both bank statements.</dd><dt>Why did I get logged out?</dt><dd>After 3 minutes of doing nothing, we log you out for your security. Also our server likes a rest.</dd><dt>What is "net worth"?</dt><dd>Your cash, plus your shares at today's selling price, plus a third of what you spent on Jacktown buildings.</dd><dt>Is this a real bank?</dt><dd>No! It's pretend. Rupees are pretend money for a pretend 1999. Don't tell Dave.</dd></dl></div>${bankFoot()}`;
    bankWire(P);
  });
})();

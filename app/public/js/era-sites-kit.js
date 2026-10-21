/* era-sites-kit: shared bits for the era web sites (lazy loaded by era-sites.js before any site file).
 * Routing, per-page helpers (timers that stop when you leave the page, live Net.kv watches), live hit counters,
 * live guestbooks, The 99 Ring webring, "best viewed in" badges, pixel-art sprites and a seeded random. */
(function () {
  'use strict';
  if (window.EraSites) return;
  const A = window.Apps, esc = A.esc, store = A.store;
  const ROUTES = {}; // host -> [{ m: path|RegExp, fn }]
  const pad = n => String(n).padStart(2, '0');
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const t99 = () => window.Desk && Desk.today99 ? Desk.today99() : (() => { const n = new Date(); let m = n.getMonth() + 1, d = n.getDate(); if (m === 2 && d === 29) d = 28; return { m, d, md: m * 100 + d, date: new Date(1999, m - 1, d) }; })();
  const keyOf = (m, d) => pad(m) + '-' + pad(d);
  const mdOf = k => { const [m, d] = String(k).split('-').map(Number); return m * 100 + d; };
  const dateOf = (k, y) => { const [m, d] = String(k).split('-').map(Number); return new Date(y === 98 ? 1998 : 1999, m - 1, d); };
  const longDate = dt => `${DAYS[dt.getDay()]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
  const dmy = dt => `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)}`;
  const tsDate = ts => { const d = new Date(ts || Date.now()); let dd = d.getDate(); if (d.getMonth() === 1 && dd === 29) dd = 28; return `${pad(dd)}/${pad(d.getMonth() + 1)}/99`; };
  const tsTime = ts => { const d = new Date(ts || Date.now()); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function rng(seed) { let a = typeof seed === 'number' ? seed >>> 0 : hash(seed); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const sfx = n => { if (window.Sound) Sound.play(n); };
  const kvOk = () => !!(window.Net && Net.kv);

  // ================================================================ styles
  const CSSDONE = {};
  function css(id, text) { if (CSSDONE[id]) return; CSSDONE[id] = 1; const s = document.createElement('style'); s.id = 'es-css-' + id; s.textContent = text; document.head.appendChild(s); }
  css('kit', `
.es{margin:0;min-height:max(560px,calc(100vh - 200px));position:relative;overflow:hidden;overflow-wrap:anywhere;color:#000;background:#fff;font:13px/1.4 Arial,Helvetica,sans-serif;box-sizing:border-box}
.es *{box-sizing:border-box}
.es > div:first-child{min-height:inherit}
.es a{color:#00e;cursor:pointer}
.es img,.es svg,.es canvas{max-width:100%}
.es-pix{image-rendering:pixelated;image-rendering:crisp-edges;vertical-align:middle;shape-rendering:crispEdges}
.es-foot{text-align:center;font:11px Arial,sans-serif;margin:18px 0 6px;padding:0 8px}
.es-foot p{margin:6px 0}
.es-ctr{display:inline-flex;gap:1px;padding:2px;background:#000;border:2px inset #888;vertical-align:middle}
.es-ctr i{font:bold 14px/1 "Courier New",monospace;color:#fff;background:linear-gradient(#333,#000 50%,#222 50%,#111);padding:2px 3px;font-style:normal;min-width:11px;text-align:center}
.es-ctr.lcd i{color:#3f3;background:#031;text-shadow:0 0 3px #3f3}
.es-ctr.red i{color:#f33;background:#200}
.es-best{display:inline-flex;align-items:center;gap:6px;border:2px outset #ddd;background:#c0c0c0;color:#000;padding:3px 8px;font:11px Tahoma,Arial,sans-serif;margin:4px}
.es-best svg{width:22px;height:22px;flex:none}
.es-ring{max-width:480px;margin:10px auto;border:3px ridge #b0b0b0;background:#fffbe0;color:#000;padding:6px 8px;font:12px Arial,sans-serif;display:flex;gap:8px;align-items:center;text-align:left}
.es-ring b{color:#8a0000}
.es-ring .es-ring-l{flex:none;width:40px;height:40px}
.es-ring a{color:#00e;font-weight:bold}
.es-gb{max-width:560px;margin:14px auto;text-align:left;font:13px Arial,sans-serif}
.es-gb-h{font:bold 16px Arial,sans-serif;margin:0 0 6px}
.es-gb form{display:flex;flex-direction:column;gap:5px;background:rgba(0,0,0,.06);padding:8px;border:1px solid rgba(0,0,0,.25)}
.es-gb textarea{font:13px Arial,sans-serif;width:100%;min-height:48px;resize:vertical}
.es-gb .es-gb-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.es-gb .es-gb-note{font-size:11px}
.es-gbe{border-bottom:1px dashed rgba(0,0,0,.35);padding:6px 2px}
.es-gbe b{font-weight:bold}.es-gbe small{opacity:.7}
.es-gbe.new{animation:esnew 1.5s}
@keyframes esnew{from{background:#ff0}}
.es-btn{font:12px Tahoma,Arial,sans-serif;min-height:26px;padding:2px 12px;background:#c0c0c0;color:#000;border:2px outset #fff;cursor:pointer}
.es-btn:active{border-style:inset}
.es-blink{animation:esblink 1s steps(2) infinite}
@keyframes esblink{50%{visibility:hidden}}
.es-new{display:inline-block;font:bold 10px Arial,sans-serif;color:#fff;background:#e10600;padding:0 4px;transform:rotate(-6deg);animation:esblink .8s steps(2) infinite}
.es-under{display:inline-flex;gap:6px;align-items:center;font:bold 12px Arial,sans-serif;background:repeating-linear-gradient(45deg,#ffd400 0 10px,#000 10px 20px);padding:4px;color:#000}
.es-under span{background:#ffd400;padding:2px 6px}
@media (max-width:600px){.es{font-size:13px}.es-ring{flex-wrap:wrap}}
`);

  // ================================================================ pixel sprites (rows of characters -> SVG rects)
  const PAL = { g: '#3a9a2a', G: '#2a6a1a', l: '#7ad04a', r: '#e10600', R: '#8a0010', y: '#ffd400', k: '#111', w: '#fff', b: '#7a4a1a', B: '#4a2a0a', s: '#c8c8c8', S: '#808080', o: '#ff8a00', p: '#d1007a', u: '#2a5ad8', c: '#00c8ff', n: '#e8c8a0', N: '#b08a60', h: '#5a3a1a', m: '#9a6a3a', e: '#3aff9a', v: '#7a3ac8', t: '#ffe8a0', z: '#2a2a2a', d: '#0a5a0a' };
  function pix(rows, scale, pal, cls, title) {
    const P = Object.assign({}, PAL, pal || {}); const h = rows.length, w = Math.max(...rows.map(r => r.length)); let out = '';
    rows.forEach((row, y) => { let x = 0; while (x < row.length) { const ch = row[x]; if (ch === '.' || ch === ' ' || !P[ch]) { x++; continue; } let n = 1; while (row[x + n] === ch) n++; out += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${P[ch]}"/>`; x += n; } });
    const s = scale || 4;
    return `<svg class="es-pix${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" xmlns="http://www.w3.org/2000/svg"${title ? ` role="img" aria-label="${esc(title)}"` : ' aria-hidden="true"'}>${out}</svg>`;
  }
  const SPR = {
    grot: ['g............g', 'gg..gggggg..gg', '.gggggggggggg.', '..ggrrggrrgg..', '..gggggggggg..', '..gkwkwkwkgg..', '...gggggggg...', '....bbbbbb....', '..gbbbbbbbbg..', '.g.bbbbbbbb.g.', '...bbbbbbbb...', '...gg....gg...', '...gg....gg...', '..kkk....kkk..'],
    grot2: ['g............g', 'gg..gggggg..gg', '.gggggggggggg.', '..ggrrggrrgg..', '..gggggggggg..', '..gkwkwkwkgg..', 'g..gggggggg..g', '.g..bbbbbb..g.', '..gbbbbbbbbg..', '...bbbbbbbb...', '...bbbbbbbb...', '..gg......gg..', '.gg........gg.', 'kkk........kkk'],
    squig: ['...rrrrrr...', '.rrrrrrrrrr.', 'rrryyrryyrrr', 'rrykyrrykyrr', 'rrrrrrrrrrrr', 'rkwkwkwkwkwr', 'rkkkkkkkkkkr', 'rwkwkwkwkwkr', '.rrrrrrrrrr.', '..rr....rr..'],
    squig2: ['............', '...rrrrrr...', '.rrrrrrrrrr.', 'rrryyrryyrrr', 'rrykyrrykyrr', 'rrrrrrrrrrrr', 'rkwkwkwkwkwr', 'rwkwkwkwkwkr', '.rrrrrrrrrr.', '.rr......rr.'],
  };
  const spr = (name, scale, pal, cls) => pix(SPR[name], scale, pal, cls);

  // ================================================================ The 99 Ring (a webring of the era sites)
  const RING = () => (window.EraSiteList || []).filter(r => !r[7]).map(r => r[0]);
  const RINGNAME = h => { const r = (window.EraSiteList || []).find(x => x[0] === h); return r ? r[2].replace(/ [-:].*$/, '') : h; };
  let ringRun = null;
  function ringHtml(host) {
    const L = RING(), i = L.indexOf(host), n = L.length, prev = L[(i + n - 1) % n], next = L[(i + 1) % n];
    return `<div class="es-ring"><svg class="es-ring-l" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="#e10600" stroke-width="4" stroke-dasharray="6 3"/><text x="20" y="26" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="15" fill="#000080">99</text></svg><div>This site is a member of <b>THE 99 RING</b>: sites that are 100% Y2K compliant (probably). <small>(${i + 1} of ${n})</small><br>[ <a href="http://${prev}/" data-esring="prev">&laquo; Prev</a> | <a href="#" data-esring="rand">Random</a> | <a href="#" data-esring="list">List</a> | <a href="http://${next}/" data-esring="next">Next &raquo;</a> ]</div></div>`;
  }
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('#s-secret [data-esring]'); if (!a) return;
    const kind = a.dataset.esring, host = (a.closest('[data-host]') || { dataset: {} }).dataset.host || '';
    A.secret('web.ring');
    if (kind === 'next') {
      if (!ringRun || ringRun.cur !== host) ringRun = { start: host, n: 0 };
      ringRun.n++; ringRun.cur = a.getAttribute('href').replace(/^http:\/\/|\/$/g, '');
      if (ringRun.cur === ringRun.start && ringRun.n >= RING().length) { ringRun = null; setTimeout(() => A.secret('eras.ring'), 900); }
      return; // ie.js follows the link
    }
    ringRun = null;
    if (kind === 'rand') { ev.preventDefault(); ev.stopPropagation(); const L = RING().filter(h => h !== host); IE.navigate('http://' + L[Math.floor(Math.random() * L.length)] + '/'); }
    if (kind === 'list') { ev.preventDefault(); ev.stopPropagation(); Desk.msgbox('THE 99 RING - Member List', RING().map((h, i) => (i + 1) + '. ' + RINGNAME(h) + '\n     http://' + h + '/').join('\n'), 'info'); }
  }, true);

  // ================================================================ routing + page context
  function def(host, m, fn) { (ROUTES[host] = ROUTES[host] || []).push({ m, fn }); }
  const offsOf = new Map(); // el -> [cleanup fns]
  setInterval(() => { for (const [el, offs] of offsOf) if (!el.isConnected) { offs.forEach(f => { try { f(); } catch (e) {} }); offsOf.delete(el); } }, 1500);
  function render(host, path, el) {
    const list = ROUTES[host] || [];
    const r = list.find(x => x.m === path) || list.find(x => x.m instanceof RegExp && x.m.test(path));
    if (offsOf.has(el)) { offsOf.get(el).forEach(f => { try { f(); } catch (e) {} }); }
    const offs = []; offsOf.set(el, offs);
    el.className = 'es'; el.dataset.host = host;
    if (!r) { el.innerHTML = '<div style="padding:18px"><h1>Not Found</h1><p>The requested URL ' + esc(path) + ' was not found on this server.</p><hr><address>Jackache/1.3.9 Server at ' + esc(host) + ' Port 80</address></div>'; return; }
    const c = ctx(host, path, el, offs);
    try { const h = r.fn(c); if (typeof h === 'string') el.innerHTML = h; } catch (e) { console.error(e); el.innerHTML = '<p style="padding:18px">This page has a bug in it. (Not the Millennium one. A normal one.)</p>'; return; }
    wire(c);
    if (c.after) c.after.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    el.scrollTop = 0;
  }
  function ctx(host, path, el, offs) {
    const t = t99();
    const c = {
      host, path, el, t, key: keyOf(t.m, t.d), md: t.md, after: [], gbs: [],
      sk: ((window.IE && IE.legacyHost) ? IE.legacyHost(host) : host).replace(/^www\./, '').replace(/\..*$/, '').slice(0, 20), // renamed sites keep their old counter + guestbook keys
      q: s => el.querySelector(s), qa: s => [...el.querySelectorAll(s)],
      on: (sel, type, fn) => { const x = typeof sel === 'string' ? el.querySelector(sel) : sel; if (x) x.addEventListener(type, fn); return x; },
      every(fn, ms) { const id = setInterval(() => { if (!el.isConnected) { clearInterval(id); return; } if (document.hidden) return; fn(); }, ms); offs.push(() => clearInterval(id)); return id; },
      later(fn, ms) { const id = setTimeout(() => { if (el.isConnected) fn(); }, ms); offs.push(() => clearTimeout(id)); return id; },
      anim(fn) { let on = true, last = 0; const tick = ts => { if (!on || !el.isConnected) return; requestAnimationFrame(tick); const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts; fn(dt, ts / 1000); }; requestAnimationFrame(tick); offs.push(() => { on = false; }); },
      watch(k, fn) { if (kvOk()) offs.push(Net.kv.watch(k, ev => { if (el.isConnected) fn(ev); })); },
      get: keys => kvOk() ? Net.kv.get(keys) : Promise.resolve({}),
      inc: k => kvOk() && Net.kv.inc(k), push: (k, s) => kvOk() && Net.kv.push(k, s), put: (k, f, v) => kvOk() && Net.kv.put(k, f, v),
      off: f => offs.push(f),
      secret: id => A.secret(id), sfx, toast: (a, b, ms) => Desk.toast(a, b, ms),
      counter: (st, k) => `<span class="es-ctr ${st || ''}" data-esk="${esc(k || 'eras.hits.' + c.sk)}" aria-label="hit counter">${'<i>0</i>'.repeat(6)}</span>`,
      gb: (seed, o) => { c.gbs.push({ seed: seed || [], o: o || {} }); return `<div class="es-gb" data-gbi="${c.gbs.length - 1}"></div>`; },
      ring: () => ringHtml(host),
      best: txt => `<span class="es-best"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="#2a6ad8" stroke="#000"/><path d="M4 9c3-2 11-2 14 0M4 13c3 2 11 2 14 0M11 2c-4 4-4 14 0 18M11 2c4 4 4 14 0 18" fill="none" stroke="#fff" stroke-width="1"/><path d="M2 14c6-6 13-9 19-9-5 2-11 6-15 12z" fill="#ffd400" stroke="#8a6000" stroke-width=".6"/></svg><span>${txt || 'Best viewed with <b>JackNet Explorer 5</b> at <b>800x600</b>'}</span></span>`,
      foot: o => { o = o || {}; return `<div class="es-foot">${o.top || ''}${o.ring === false ? '' : ringHtml(host)}<p>${o.ctrText || 'You are visitor number'} ${c.counter(o.ctr)} ${o.ctrAfter || 'since 01/01/99'}</p><p>${c.best(o.best)}</p>${o.extra || ''}<p>${o.copy || '&copy; 1999 ' + esc(host.replace(/^www\./, ''))}. All rights reserved. Last updated ${dmy(t.date)}.</p></div>`; },
    };
    return c;
  }

  // ================================================================ live counters + guestbooks
  const fmtCtr = (n, len) => String(n).padStart(len || 6, '0').split('').map(ch => `<i>${ch}</i>`).join('');
  const bumped = {};
  function wire(c) {
    const ctrs = c.qa('[data-esk]');
    if (ctrs.length) {
      const keys = [...new Set(ctrs.map(x => x.dataset.esk))];
      const show = (k, v) => { if (typeof v !== 'number') return; ctrs.filter(x => x.dataset.esk === k).forEach(x => { x.innerHTML = fmtCtr(v); x.setAttribute('aria-label', v + ' visitors'); }); };
      const own = 'eras.hits.' + c.sk, pageKey = c.host + c.path;
      if (!bumped[pageKey] || Date.now() - bumped[pageKey] > 20000) { bumped[pageKey] = Date.now(); c.inc(own); }
      keys.forEach(k => c.watch(k, ev => { if (ev.type === 'set') show(k, ev.v); }));
      c.get(keys).then(v => keys.forEach(k => show(k, v[k])));
    }
    c.qa('.es-gb').forEach(box => guestbook(box, c.gbs[+box.dataset.gbi] || { seed: [], o: {} }, c));
  }
  let lastPost = 0;
  function guestbook(box, g, c) {
    const o = g.o, k = o.k || 'eras.gb.' + c.sk;
    box.innerHTML = `<div class="es-gb-h">${o.title || 'Sign the Guestbook!'}</div>
      <form autocomplete="off"><div>Signing as <b class="es-gb-nick"></b></div><textarea maxlength="${o.max || 220}" placeholder="${esc(o.ph || 'Write something nice...')}" aria-label="Your message"></textarea>
      <div class="es-gb-row"><button class="es-btn" type="submit">${o.btn || 'Sign it!'}</button><span class="es-gb-note" aria-live="polite"></span></div></form>
      <div class="es-gb-list"><div class="es-gbe"><i>Fetching entries from the CGI-BIN...</i></div></div>`;
    box.querySelector('.es-gb-nick').textContent = (window.Net && Net.me && Net.me.nick) || 'Guest';
    const list = box.querySelector('.es-gb-list'), note = box.querySelector('.es-gb-note');
    const ent = (by, when, text, cls) => `<div class="es-gbe${cls || ''}"><b>${esc(by)}</b> <small>${esc(when)}</small><br>${o.fmt ? o.fmt(text) : esc(text)}</div>`;
    const seedHtml = g.seed.map(s => ent(s[0], s[1], s[2])).join('');
    const draw = arr => { list.innerHTML = (arr || []).slice().reverse().map(e => ent(e.by + (e.member ? ' *' : ''), tsDate(e.ts) + ' ' + tsTime(e.ts), e.text)).join('') + seedHtml || '<div class="es-gbe"><i>Nobody has signed yet. Be the first!</i></div>'; };
    c.get([k]).then(v => { if (box.isConnected) draw(Array.isArray(v[k]) ? v[k] : []); });
    c.watch(k, ev => { if (ev.type !== 'push') return; const d = document.createElement('div'); d.innerHTML = ent(ev.e.by + (ev.e.member ? ' *' : ''), tsDate(ev.e.ts) + ' ' + tsTime(ev.e.ts), ev.e.text, ' new'); list.prepend(d.firstChild); if (o.onPush) o.onPush(ev.e); });
    box.querySelector('form').addEventListener('submit', ev => {
      ev.preventDefault();
      const ta = box.querySelector('textarea'), msg = ta.value.trim();
      if (!msg) { note.textContent = 'Write something first!'; return; }
      if (Date.now() - lastPost < 6000) { note.textContent = 'Slow down! The CGI-BIN can only take one post every few seconds.'; return; }
      if (!c.push(k, msg)) { note.textContent = 'Not connected to JackNet. Try again in a minute!'; sfx('uhoh'); return; }
      lastPost = Date.now(); ta.value = ''; note.textContent = o.thanks || 'Thanks for signing!!!'; sfx('pet'); A.secret('web.gbsign');
      if (o.onSign) o.onSign(msg);
    });
  }

  window.EraSites = { def, render, css, esc, store, pix, spr, SPR, PAL, rng, hash, t99, keyOf, mdOf, dateOf, longDate, dmy, tsDate, tsTime, pad, DAYS, MONTHS, sfx, ringHtml, RINGNAME, kvOk,
    go: url => (window.EraSitesOpen || IE.navigate)(url) };
})();

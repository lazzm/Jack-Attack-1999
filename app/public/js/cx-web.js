/* cx-web: shared bits for THE CLASS OF '99 sites (lazy; era-sites-kit.js is loaded first and does the routing, live hit
 * counters and guestbooks). Here: THE CLASS OF '99 RING (only the sites that exist on today's 1999 date are in it), date
 * helpers for pages that change as the year goes on, and a standard footer. Page bodies: js/cx-web-a.js, js/cx-web-b.js. */
(function () {
  'use strict';
  if (window.CXWeb || !window.EraSites) return;
  const E = window.EraSites, A = window.Apps, esc = E.esc;
  const MONTHS = E.MONTHS, DAYS = E.DAYS;
  const mdOf = k => { const [m, d] = String(k).split('-').map(Number); return m * 100 + d; };
  const nice = k => { const [m, d] = String(k).split('-').map(Number); return d + ' ' + MONTHS[m - 1]; };
  const dayNo = k => { const [m, d] = String(k).split('-').map(Number); return Math.round((new Date(1999, m - 1, d) - new Date(1999, 0, 1)) / 864e5); };
  const daysTo = (c, k) => dayNo(k) - dayNo(c.key);
  // the newest entry whose date has come: phase(c, [['01-01', x], ['07-20', y]]) -> y from 20 July
  const phase = (c, list) => { let out = null; for (const [k, v] of list) if (mdOf(k) <= c.md) out = v; return out; };
  // only the things that have happened by today: past(c, [['03-02', html], ...]) -> [html, ...] newest first
  const past = (c, list) => list.filter(([k]) => mdOf(k) <= c.md).reverse();

  // ================================================================ THE CLASS OF '99 RING
  const RING = () => (window.CX && CX.liveSites ? CX.liveSites() : (window.CXSiteList || [])).map(r => r[0]);
  const NAME = h => { const r = (window.CXSiteList || []).find(x => x[0] === h); return r ? r[2].replace(/ [-:].*$/, '') : h; };
  function ring(host) {
    const L = RING(), i = Math.max(0, L.indexOf(host)), n = L.length, prev = L[(i + n - 1) % n], next = L[(i + 1) % n];
    return `<div class="cxw-ring"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="#000080" stroke="#ffd400" stroke-width="3"/><text x="22" y="20" text-anchor="middle" font-family="Arial Black,Arial" font-size="9" fill="#ffd400">CLASS</text><text x="22" y="31" text-anchor="middle" font-family="Arial Black,Arial" font-size="11" fill="#fff">OF '99</text></svg><div>This site is part of <b>THE CLASS OF '99 RING</b>: fan sites about the things everyone is talking about this year. <small>(${i + 1} of ${n})</small><br>[ <a href="http://${prev}/" data-cxring="prev">&laquo; Prev</a> | <a href="#" data-cxring="rand">Random</a> | <a href="http://www.classof99ring.homepagez/" data-cxring="hub">List</a> | <a href="http://${next}/" data-cxring="next">Next &raquo;</a> ]</div></div>`;
  }
  let lap = null;
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('#s-secret [data-cxring]'); if (!a) return;
    const kind = a.dataset.cxring, host = (a.closest('[data-host]') || { dataset: {} }).dataset.host || '';
    try { A.secret('web.ring'); } catch (e) {}
    if (kind === 'next') {
      if (!lap || lap.cur !== host) lap = { start: host, n: 0 };
      lap.n++; lap.cur = a.getAttribute('href').replace(/^http:\/\/|\/$/g, '');
      if (lap.cur === lap.start && lap.n >= RING().length) { lap = null; setTimeout(() => A.secret('cx.ring'), 900); }
      return;
    }
    lap = null;
    if (kind === 'rand') { ev.preventDefault(); ev.stopPropagation(); const L = RING().filter(h => h !== host); IE.navigate('http://' + L[Math.floor(Math.random() * L.length)] + '/'); }
  }, true);

  // ================================================================ footer + helpers
  function foot(c, o) {
    o = o || {};
    return `<div class="es-foot cxw-foot">${o.top || ''}${ring(c.host)}<p>${o.ctrText || 'You are visitor number'} ${c.counter(o.ctr || '')} ${o.ctrAfter || 'since 01/01/99'}</p><p>${c.best(o.best)}</p>${o.extra || ''}<p>${o.copy || '&copy; 1999 ' + esc(c.host.replace(/^www\./, ''))}. Last updated ${E.dmy(c.t.date)}.${o.webmaster ? ' Webmaster: ' + o.webmaster + '.' : ''}</p></div>`;
  }
  const nav = (c, items, cls) => `<div class="cxw-nav ${cls || ''}">${items.map(([p, t]) => p === c.path ? `<b>${t}</b>` : `<a href="http://${c.host}${p}">${t}</a>`).join('')}</div>`;
  const mates = (c, list) => { const L = list.filter(([k]) => mdOf(k) <= c.md); return L.length ? `<div class="cxw-mates"><b>Comments from the JackNet crew:</b>${L.slice(-4).reverse().map(([k, who, t]) => `<p><span class="cxw-who">${esc(who)}</span> <small>${E.dmy(new Date(1999, +k.slice(0, 2) - 1, +k.slice(3)))}</small><br>${t}</p>`).join('')}</div>` : ''; };

  window.CXWeb = { E, def: E.def, css: E.css, esc, ring, foot, nav, mates, phase, past, nice, mdOf, dayNo, daysTo, MONTHS, DAYS, RING, NAME, secret: id => { try { A.secret(id); } catch (e) {} }, sfx: E.sfx, rng: E.rng, pix: E.pix };
})();

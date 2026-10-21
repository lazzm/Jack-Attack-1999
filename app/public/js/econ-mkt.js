/* econ-mkt: the Jack Stock Exchange (www.jackexchange.grot). Live prices from the server every minute, ASCII charts, trading. */
(function () {
  'use strict';
  const W = window.EconWeb, C = window.EconCat, A = window.Apps; if (!W || W.mkt) return;
  const { route, member, guestBox, footer, teef, fmt, esc, d99, t99, ago, sfx } = W;
  const H = 'www.jackexchange.grot', U = 'http://' + H, CSS = 'ecw-mkt';
  const CO = {}; for (const c of C.COS) CO[c.sym] = c;
  const DS = s => C.dsym ? C.dsym(s) : s, QU = s => `${U}/quote/${DS(s).toLowerCase()}.html`; // on-screen symbol, quote page link
  let M = null; // last ecMkt snapshot, kept up to date by ticks
  const p2 = v => (+v).toFixed(2);
  const chg = (p, o) => o ? (p - o) / o * 100 : 0;
  const arrow = v => v > 0.004 ? '<b class="mk-up">&#9650;</b>' : v < -0.004 ? '<b class="mk-dn">&#9660;</b>' : '<b class="mk-fl">&#9632;</b>';
  const pct = v => `<span class="${v > 0.004 ? 'mk-up' : v < -0.004 ? 'mk-dn' : 'mk-fl'}">${v > 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
  Econ.on('ecMkt', m => { M = m; });
  Econ.on('ecTick', m => { if (!M) return; for (const s in m.p) { const S = M.s[s]; if (!S) continue; S.p = m.p[s]; S.m.push(m.p[s]); if (S.m.length > 60) S.m.shift(); S.hi = Math.max(S.hi, S.p); S.lo = Math.min(S.lo, S.p); } M.ix = m.ix; M.at = Date.now(); });
  Econ.on('ecNews', m => { if (M) { M.news.push(m.e); if (M.news.length > 20) M.news.shift(); } });
  Econ.on('ecTape', m => { if (M) { M.tape.push(m.e); if (M.tape.length > 15) M.tape.shift(); if (M.s[m.e.sym]) M.s[m.e.sym].vol += m.e.n; } });

  function top(on) {
    const tabs = [['/', 'MARKETS'], ['/portfolio.html', 'MY PORTFOLIO'], ['/leaders.html', 'TOP TRADERS'], ['/news.html', 'NEWS'], ['/help.html', 'HELP']];
    return `<div class="mk-head"><div class="mk-logo"><span class="mk-bull"></span><span><b>JACK STOCK EXCHANGE</b><i>Jacktown's premier market for gems, toys, karts and dot-coms &middot; Est. 1999</i></span></div><div class="mk-clock">MARKET <b class="mk-open">OPEN</b> 24 HRS<br><span class="mk-next"></span></div></div>
      <div class="mk-tick"><div class="mk-tape"></div></div>
      <div class="mk-nav">${tabs.map(([u, l]) => `<a href="${U}${u}" class="${on === u ? 'on' : ''}">${l}</a>`).join('')}<span class="mk-idx"></span></div>`;
  }
  function tickerHtml() {
    if (!M) return 'Connecting to the trading floor...';
    const one = C.COS.map(c => { const S = M.s[c.sym], v = chg(S.p, S.open); return `<span class="mk-ti"><b>${c.ds}</b> ${p2(S.p)} ${arrow(v)} ${pct(v)}</span>`; }).join('') + (M.news.length ? `<span class="mk-ti mk-tn">*** ${esc(W.unteef(M.news[M.news.length - 1].text))} ***</span>` : '');
    return one + one;
  }
  function common(P, on) {
    const upd = () => {
      const t = P.q('.mk-tape'); if (t && M) { const html = tickerHtml(); if (t.dataset.h !== html) { t.dataset.h = html; t.innerHTML = html; } }
      const ix = P.q('.mk-idx'); if (ix && M) { let o = 0; for (const c of C.COS) o += M.s[c.sym].open / c.p0; o = o / C.COS.length * 1000; const v = chg(M.ix, o); ix.innerHTML = `JX-8 <b>${fmt(M.ix)}</b> ${arrow(v)} ${pct(v)}`; }
      const nx = P.q('.mk-next'); if (nx) { const s = M && M.at ? Math.max(0, 60 - Math.floor((Date.now() - M.at) / 1000)) : null; nx.textContent = s == null ? 'prices update every minute' : `next prices in 0:${String(s).padStart(2, '0')}`; }
    };
    P.every(() => { const nx = P.q('.mk-next'); if (nx && M && M.at) { const s = Math.max(0, 60 - Math.floor((Date.now() - M.at) / 1000)); nx.textContent = `next prices in 0:${String(s).padStart(2, '0')}`; } }, 1000);
    P.sub({ mkt: true });
    Net.send({ t: 'ecMkt' });
    P.errTo('.mk-msg');
    return upd;
  }
  // a little line, drawn on canvas
  function spark(cv, data, up) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
    if (!data || data.length < 2) return;
    const lo = Math.min(...data), hi = Math.max(...data), r = hi - lo || 1;
    g.strokeStyle = up ? '#00a000' : '#d00000'; g.lineWidth = 1.5; g.beginPath();
    data.forEach((v, i) => { const x = i / (data.length - 1) * (w - 2) + 1, y = h - 2 - (v - lo) / r * (h - 4); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
  }
  // the big chart: ASCII art on a black canvas, like a proper trading terminal
  function asciiChart(cv, data, label) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth || 560, ch = 230;
    cv.width = cw * dpr; cv.height = ch * dpr; cv.style.height = ch + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch);
    const fw = cw < 420 ? 6 : 7.2, fh = 12, font = `${cw < 420 ? 10 : 12}px "Courier New",Courier,monospace`;
    g.font = font; g.textBaseline = 'top';
    const cols = Math.floor((cw - 8) / fw), rows = Math.floor((ch - 30) / fh), lab = 8, plotC = cols - lab - 1;
    g.fillStyle = '#0f0'; g.fillText(label, 4, 3);
    if (!data || data.length < 2) { g.fillText('NO DATA YET. COME BACK IN A MINUTE.', 4, 40); return; }
    const pts = []; for (let c = 0; c < plotC; c++) { const f = c / (plotC - 1) * (data.length - 1), i0 = Math.floor(f), i1 = Math.min(data.length - 1, i0 + 1); pts.push(data[i0] + (data[i1] - data[i0]) * (f - i0)); }
    const lo = Math.min(...pts), hi = Math.max(...pts), r = hi - lo || 1;
    const rowOf = v => Math.round((hi - v) / r * (rows - 1));
    const y0 = 18;
    for (let rr = 0; rr < rows; rr++) {
      if (rr % 3 === 0) { g.fillStyle = '#0a0'; g.fillText(p2(hi - rr / (rows - 1) * r).padStart(7), 2, y0 + rr * fh); }
      g.fillStyle = '#063'; g.fillText('|', 2 + lab * fw, y0 + rr * fh);
    }
    let prev = null;
    const up = pts[pts.length - 1] >= pts[0];
    pts.forEach((v, i) => {
      const rr = rowOf(v), x = 2 + (lab + 1 + i) * fw;
      g.fillStyle = up ? '#3f3' : '#f44';
      if (prev != null && Math.abs(prev - rr) > 1) { const a = Math.min(prev, rr), b = Math.max(prev, rr); for (let k = a + 1; k < b; k++) g.fillText(':', x, y0 + k * fh); }
      g.fillText(prev == null ? '*' : rr < prev ? '/' : rr > prev ? '\\' : '-', x, y0 + rr * fh);
      prev = rr;
    });
    g.fillStyle = '#0a0'; g.fillText('-'.repeat(plotC + 1), 2 + lab * fw, y0 + rows * fh);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < ch; y += 2) g.fillRect(0, y, cw, 1); // scanlines
  }

  // ---------------------------------------------------------------- MARKETS
  route(H, '/', CSS, P => {
    A.secret('econ.exchange');
    P.el.innerHTML = `${top('/')}<div class="mk-body"><div class="mk-main">${member() ? '' : guestBox('Anyone can watch the market. You need a FREE JackNet membership to buy shares.')}
      <h1>Today's Market</h1><table class="mk-tbl"><thead><tr><th>Symbol</th><th>Company</th><th class="r">Price</th><th class="r">Today</th><th class="mk-hide">Last hour</th><th class="r mk-hide">High</th><th class="r mk-hide">Low</th><th></th></tr></thead><tbody></tbody></table>
      <p class="mk-small">Prices are in Rupees per share and move every minute. Buy at the <b>ask</b> (price + 1%), sell at the <b>bid</b> (price - 1%). Dividends are paid at midnight to everyone holding shares.</p>
      <div class="mk-msg" hidden></div>
      <h2>Trade Tape <small>(the last few deals on the floor)</small></h2><div class="mk-tapelist"></div></div>
      <div class="mk-side"><div class="mk-box mk-me"></div><div class="mk-box"><b>LATEST NEWS</b><div class="mk-news"></div><a href="${U}/news.html">All news &raquo;</a></div><div class="mk-box mk-ad"><b>ADVERTISEMENT</b><p>Fed up with your 33.6K modem? <a href="${U}/quote/jnet.html">Invest in JackNet Online!</a> The future is dot-com!*</p><p class="mk-small">*Past performance is not a guide to future performance. Ask a grown-up.</p></div></div></div>${footer('<p class="c">Prices delayed by 0 minutes. The Jack Stock Exchange is regulated by nobody.</p>')}`;
    const upd = common(P, '/');
    const draw = () => {
      upd(); if (!M) return;
      const tb = P.q('.mk-tbl tbody'); if (!tb) return;
      if (!tb.children.length) tb.innerHTML = C.COS.map(c => `<tr data-s="${c.sym}"><td><a href="${QU(c.sym)}"><b>${c.ds}</b></a></td><td>${esc(c.name)}</td><td class="r mk-p"></td><td class="r mk-c"></td><td class="mk-hide"><canvas width="90" height="22"></canvas></td><td class="r mk-hide mk-hi"></td><td class="r mk-hide mk-lo"></td><td><a class="mk-tr" href="${QU(c.sym)}">Trade</a></td></tr>`).join('');
      for (const c of C.COS) {
        const S = M.s[c.sym], tr = tb.querySelector(`[data-s="${c.sym}"]`), v = chg(S.p, S.open), pc = tr.querySelector('.mk-p');
        if (pc.textContent && pc.textContent !== p2(S.p)) { tr.classList.remove('mk-flu', 'mk-fld'); void tr.offsetWidth; tr.classList.add(+pc.textContent < S.p ? 'mk-flu' : 'mk-fld'); }
        pc.textContent = p2(S.p); tr.querySelector('.mk-c').innerHTML = `${arrow(v)} ${pct(v)}`; tr.querySelector('.mk-hi').textContent = p2(S.hi); tr.querySelector('.mk-lo').textContent = p2(S.lo);
        spark(tr.querySelector('canvas'), S.m, S.m[S.m.length - 1] >= S.m[0]);
      }
      P.q('.mk-news').innerHTML = M.news.slice(-6).reverse().map(n => `<p><span class="mk-small">${t99(n.ts)}</span> ${n.sym !== '*' ? `<a href="${QU(n.sym)}">${DS(n.sym)}</a>` : '<b>ALL</b>'} ${pct(n.chg)}<br>${esc(W.unteef(n.text))}</p>`).join('') || '<p>No news is good news.</p>';
      P.q('.mk-tapelist').innerHTML = M.tape.length ? `<table class="mk-tape2">${M.tape.slice(-10).reverse().map(t => `<tr><td>${t99(t.ts)}</td><td>${esc(t.by)}</td><td class="${t.side === 'b' ? 'mk-up' : 'mk-dn'}">${t.side === 'b' ? 'BOUGHT' : 'SOLD'}</td><td>${fmt(t.n)} <b>${DS(t.sym)}</b></td><td>@ ${p2(t.p)}</td></tr>`).join('')}</table>` : '<p class="mk-small">No trades yet today. Be the first!</p>';
      const me = Econ.me, box = P.q('.mk-me');
      if (box) box.innerHTML = me ? `<b>YOUR ACCOUNT</b><p>Cash: ${teef(me.bal)}<br>Shares worth: ${teef(Object.keys(me.st).reduce((q, s) => q + Math.floor(me.st[s][0] * M.s[s].p * 0.99), 0))}</p><a href="${U}/portfolio.html">My Portfolio &raquo;</a>` : `<b>YOUR ACCOUNT</b><p>Not logged on.</p>`;
    };
    for (const t of ['ecMkt', 'ecTick', 'ecNews', 'ecTape', 'me']) P.on(t, () => setTimeout(draw, 0));
    draw();
  });

  // ---------------------------------------------------------------- one company
  for (const c of C.COS) for (const qs of new Set([c.sym, c.ds])) route(H, '/quote/' + qs.toLowerCase() + '.html', CSS, P => { // old links (internal symbol) still work
    A.secret('econ.exchange');
    let range = 'm', hist = null;
    P.el.innerHTML = `${top('')}<div class="mk-body"><div class="mk-main"><div class="mk-crumb"><a href="${U}/">Markets</a> &gt; ${c.ds}</div>
      <h1>${esc(c.name)} <small>(${c.ds})</small></h1><div class="mk-quote"><span class="mk-big"></span><span class="mk-bigc"></span></div>
      ${c.sym === 'JNET' ? '<a href="#" class="mk-ipo"><b class="blink">GET IN ON THE DOT-COM BOOM!!!</b> JackNet Online: the future of the Information Superhighway! CLICK HERE!</a>' : ''}
      <div class="mk-rng"><button type="button" data-r="m" class="on">LAST HOUR</button><button type="button" data-r="h">2 WEEKS</button><button type="button" data-r="d">4 MONTHS</button></div>
      <canvas class="mk-chart"></canvas>
      <table class="mk-stats"><tr><td>Open today</td><td class="mk-o"></td><td>Day high</td><td class="mk-hi"></td></tr><tr><td>Day low</td><td class="mk-lo"></td><td>Volume</td><td class="mk-v"></td></tr><tr><td>Dividend</td><td>${(c.yld * 100).toFixed(1)}% a day</td><td>Bid / Ask</td><td class="mk-ba"></td></tr></table>
      <p>${esc(c.d)}</p>
      <div class="mk-form"><h2>Buy or Sell ${c.ds}</h2>${member() ? `<div class="mk-hold"></div><label>Number of shares: <input type="number" min="1" max="10000" value="10" class="mk-n"></label><div class="mk-est"></div><div class="mk-btns"><button type="button" class="mk-buy">BUY</button><button type="button" class="mk-sell">SELL</button></div>` : guestBox('Log on to trade shares with your Rupees.')}<div class="mk-msg" hidden></div></div></div>
      <div class="mk-side"><div class="mk-box"><b>${c.ds} IN THE NEWS</b><div class="mk-news"></div></div><div class="mk-box"><b>OTHER COMPANIES</b>${C.COS.filter(x => x !== c).map(x => `<a href="${QU(x.sym)}">${x.ds} - ${esc(x.name)}</a>`).join('')}</div></div></div>${footer()}`;
    const upd = common(P, '');
    const ipo = P.q('.mk-ipo'); if (ipo) ipo.addEventListener('click', ev => { ev.preventDefault(); A.secret('econ.ipo'); ipo.innerHTML = '<b>Thank you for your interest in JackNet Online!</b> Our IPO is "coming soon". So is our profit. So is our website. Please hold.'; });
    const draw = () => {
      upd(); if (!M) return;
      const S = M.s[c.sym], v = chg(S.p, S.open);
      P.q('.mk-big').innerHTML = `${Econ.gem ? Econ.gem(S.p) : ''} ${p2(S.p)} Rupees`; P.q('.mk-bigc').innerHTML = `${arrow(v)} ${(S.p - S.open >= 0 ? '+' : '') + p2(S.p - S.open)} (${pct(v)}) today`;
      P.q('.mk-o').textContent = p2(S.open); P.q('.mk-hi').textContent = p2(S.hi); P.q('.mk-lo').textContent = p2(S.lo); P.q('.mk-v').textContent = fmt(S.vol); P.q('.mk-ba').textContent = `${p2(S.p * 0.99)} / ${p2(S.p * 1.01)}`;
      const data = range === 'm' ? (hist ? hist.m : S.m) : hist ? (range === 'h' ? hist.h : hist.d) : null;
      asciiChart(P.q('.mk-chart'), data, `${c.ds}  ${range === 'm' ? 'LAST HOUR (1 MIN)' : range === 'h' ? 'LAST 2 WEEKS (HOURLY)' : 'LAST 4 MONTHS (DAILY)'}  LAST ${p2(S.p)}`);
      const n = M.news.filter(x => x.sym === c.sym || x.sym === '*').slice(-5).reverse();
      P.q('.mk-news').innerHTML = n.length ? n.map(x => `<p><span class="mk-small">${d99(x.ts)} ${t99(x.ts)}</span> ${pct(x.chg)}<br>${esc(W.unteef(x.text))}</p>`).join('') : '<p>No news lately.</p>';
      est();
    };
    const est = () => {
      const me = Econ.me, h = P.q('.mk-hold'); if (!h || !M) return;
      const S = M.s[c.sym], held = me && me.st[c.sym] ? me.st[c.sym] : [0, 0], n = Math.max(0, Math.floor(+P.q('.mk-n').value || 0));
      h.innerHTML = `You own <b>${fmt(held[0])}</b> ${c.ds} shares${held[0] ? ` (paid ${W.rp(held[1])}, worth ${fmt(Math.floor(held[0] * S.p * 0.99))} now)` : ''}. Cash: ${teef(me ? me.bal : 0)}`;
      P.q('.mk-est').innerHTML = n ? `Buy ${fmt(n)} for about <b>${W.rp(Math.ceil(n * S.p * 1.01))}</b> &middot; Sell ${fmt(n)} for about <b>${W.rp(Math.floor(n * S.p * 0.99))}</b>` : '';
    };
    const nIn = P.q('.mk-n'); if (nIn) nIn.addEventListener('input', est);
    const send = side => {
      const n = Math.floor(+nIn.value || 0); if (n < 1 || n > 10000) { P.say('.mk-msg', 'Enter a number of shares from 1 to 10,000.', 'err'); return; }
      const me = Econ.me, held = me && me.st[c.sym], avg = held ? held[1] / held[0] : 0, bid = M ? M.s[c.sym].p * 0.99 : 0;
      P.say('.mk-msg', 'Sending order to the trading floor...', '');
      const off = Econ.on('ecTraded', m => { if (m.sym !== c.sym) return; off(); sfx('solve'); A.secret('econ.firsttrade'); if (m.side === 's' && bid > avg && avg) A.secret('econ.bull'); P.say('.mk-msg', `<b>ORDER FILLED!</b> You ${m.side === 'b' ? 'bought' : 'sold'} ${fmt(m.n)} ${DS(m.sym)} for ${teef(m.total)}.`, 'ok'); });
      P.live.offs.push(off);
      Net.send({ t: 'ecTrade', sym: c.sym, side, n });
    };
    if (nIn) { P.q('.mk-buy').addEventListener('click', () => send('b')); P.q('.mk-sell').addEventListener('click', () => send('s')); }
    P.qa('[data-r]').forEach(b => b.addEventListener('click', () => { range = b.dataset.r; P.qa('[data-r]').forEach(x => x.classList.toggle('on', x === b)); if (range !== 'm' && !hist) Net.send({ t: 'ecHist', sym: c.sym }); draw(); }));
    P.on('ecHist', m => { if (m.sym === c.sym) { hist = m; draw(); } });
    P.on('ecTick', () => { if (hist && M) { hist.m.push(M.s[c.sym].p); if (hist.m.length > 240) hist.m.shift(); } setTimeout(draw, 0); });
    for (const t of ['ecMkt', 'ecNews', 'me']) P.on(t, () => setTimeout(draw, 0));
    Net.send({ t: 'ecHist', sym: c.sym });
    const ro = () => draw(); window.addEventListener('resize', ro); P.live.offs.push(() => window.removeEventListener('resize', ro));
    draw();
  });

  // ---------------------------------------------------------------- portfolio
  route(H, '/portfolio.html', CSS, P => {
    P.el.innerHTML = `${top('/portfolio.html')}<div class="mk-body"><div class="mk-main mk-full"><h1>My Portfolio</h1><div class="mk-pf"></div><div class="mk-msg" hidden></div></div></div>${footer()}`;
    const upd = common(P, '/portfolio.html');
    const draw = () => {
      upd(); const box = P.q('.mk-pf'); if (!box) return;
      if (!member()) { box.innerHTML = guestBox('Log on to see your portfolio.'); return; }
      const me = Econ.me; if (!me || !M) { box.innerHTML = '<p>Loading your portfolio...</p>'; return; }
      const syms = Object.keys(me.st);
      let tv = 0, tc = 0;
      const rows = syms.map(s => { const [n, cost] = me.st[s], v = Math.floor(n * M.s[s].p * 0.99); tv += v; tc += cost; const pl = v - cost; return `<tr><td><a href="${QU(s)}"><b>${DS(s)}</b></a></td><td class="mk-hide">${esc(CO[s].name)}</td><td class="r">${fmt(n)}</td><td class="r">${p2(cost / n)}</td><td class="r">${p2(M.s[s].p * 0.99)}</td><td class="r">${fmt(v)}</td><td class="r ${pl >= 0 ? 'mk-up' : 'mk-dn'}">${pl >= 0 ? '+' : ''}${fmt(pl)} (${cost ? (pl / cost * 100).toFixed(1) : '0.0'}%)</td></tr>`; }).join('');
      box.innerHTML = `<table class="mk-tbl"><thead><tr><th>Symbol</th><th class="mk-hide">Company</th><th class="r">Shares</th><th class="r">Avg paid</th><th class="r">Bid now</th><th class="r">Value</th><th class="r">Profit/Loss</th></tr></thead><tbody>${rows || '<tr><td colspan="7">You do not own any shares yet. Pick a company on the <a href="' + U + '/">Markets</a> page!</td></tr>'}</tbody>
        <tfoot><tr><td colspan="2" class="mk-hide"></td><td colspan="3" class="r"><b>Shares total</b></td><td class="r"><b>${fmt(tv)}</b></td><td class="r ${tv - tc >= 0 ? 'mk-up' : 'mk-dn'}"><b>${tv - tc >= 0 ? '+' : ''}${fmt(tv - tc)}</b></td></tr></tfoot></table>
        <p>Cash in your Rupee account: ${teef(me.bal)} &nbsp; <b>Net worth: ${teef(me.worth)}</b></p><p class="mk-small">Net worth also counts a third of what you spent on Jacktown buildings. Dividends are paid at midnight.</p>`;
    };
    Net.send({ t: 'ecMe' });
    for (const t of ['ecMkt', 'ecTick', 'me']) P.on(t, () => setTimeout(draw, 0));
    draw();
  });
  route(H, '/leaders.html', CSS, P => {
    P.el.innerHTML = `${top('/leaders.html')}<div class="mk-body"><div class="mk-main mk-full"><h1>Top Traders</h1><p>The richest members of JackNet by net worth: cash + shares + a third of their Jacktown buildings. (The full list lives at <a href="http://www.jacknetbank.webcom/richlist.html">JackNet Bank</a>.)</p><div class="mk-lb">Loading...</div></div></div>${footer()}`;
    common(P, '/leaders.html');
    P.on('ecRich', m => { const b = P.q('.mk-lb'); if (!b) return; b.innerHTML = m.list.length ? `<table class="mk-tbl"><thead><tr><th>#</th><th>Trader</th><th class="r">Net worth</th><th class="r">Cash</th></tr></thead><tbody>${m.list.slice(0, 15).map((x, i) => `<tr${member() && x.n === Net.me.nick ? ' class="mk-meRow"' : ''}><td>${i + 1}${i === 0 ? ' <span class="mk-crown">&#9819;</span>' : ''}</td><td>${esc(x.n)} ${W.badge(x.badge)}</td><td class="r">${teef(x.w)}</td><td class="r">${fmt(x.b)}</td></tr>`).join('')}</tbody></table>` : '<p>Nobody yet!</p>'; A.secret('econ.richlist'); });
    Net.send({ t: 'ecRich' });
  });
  route(H, '/news.html', CSS, P => {
    P.el.innerHTML = `${top('/news.html')}<div class="mk-body"><div class="mk-main mk-full"><h1>Market News</h1><div class="mk-allnews"></div></div></div>${footer()}`;
    const upd = common(P, '/news.html');
    const draw = () => { upd(); const b = P.q('.mk-allnews'); if (!b || !M) return; b.innerHTML = M.news.length ? M.news.slice().reverse().map(n => `<div class="mk-nitem"><span class="mk-small">${d99(n.ts)} ${t99(n.ts)}</span> ${n.sym === '*' ? '<b>WHOLE MARKET</b>' : `<a href="${QU(n.sym)}"><b>${DS(n.sym)}</b></a>`} ${pct(n.chg)}<br>${esc(W.unteef(n.text))}</div>`).join('') : '<p>No news yet. It has been a quiet day on the floor.</p>'; };
    for (const t of ['ecMkt', 'ecNews', 'ecTick']) P.on(t, () => setTimeout(draw, 0));
    draw();
  });
  route(H, '/help.html', CSS, P => {
    P.el.innerHTML = `${top('/help.html')}<div class="mk-body"><div class="mk-main mk-full"><h1>How the Jack Exchange Works</h1><dl class="sh-faq">
      <dt>What is a share?</dt><dd>A tiny piece of a company. If the company does well, your piece is worth more. If the company drives its van into a pond, it is worth less.</dd>
      <dt>Why do prices move?</dt><dd>Every minute, prices wobble a little bit at random. News makes them jump. Lots of people buying pushes a price up; lots of people selling pushes it down. And Jacktown matters: the more pet shops in town, the better Pixel Pets plc does. Mushroom farms help Gubbinz Pet Food. Jobs help Turbo Karts.</dd>
      <dt>What are bid and ask?</dt><dd>You buy at the ask (1% above the price) and sell at the bid (1% below). The difference pays the man in red braces who runs the trading floor. So buying and selling straight away loses you 2%.</dd>
      <dt>What are dividends?</dt><dd>At midnight, companies share out some of their profit to everyone holding their shares. JackNet Online pays nothing, because it has never made a profit. Very dot-com.</dd>
      <dt>Is there a limit?</dt><dd>10,000 shares per order and 100,000 per company per member.</dd></dl></div></div>${footer()}`;
    common(P, '/help.html');
  });
  W.mkt = true;
})();

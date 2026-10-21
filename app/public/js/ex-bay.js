/* ex-bay: JACKBAY RUPEE AUCTIONS (www.jackbay.webcom/rupees.html and friends): real auctions of JackLoot things for
 * real Rupees, between JackNet members. The server (mods/ex.js) holds the item and every bid until the hammer comes
 * down, does the proxy bidding, the Anti-Sniper Rule and the fees. The pretend-money JackBay is still there too. */
(function () {
  'use strict';
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, W = window.ExWeb, B = X.BAY;
  const U = p => 'http://www.jackbay.webcom' + p;
  const R = n => (window.Econ && Econ.rupees ? Econ.rupees(n) : EX.rp(n));
  const rp = EX.rp;
  const TYPES = () => (window.LootCat ? LootCat.TYPE_ORDER.filter(t => LootCat.TYPES[t]).map(t => [t, LootCat.TYPES[t][0]]) : []);
  const head = () => `<div class="exy-top"><a class="exy-logo" href="${U('/')}"><span>j</span><span>a</span><span>c</span><span>k</span><span>b</span><span>a</span><span>y</span><small>RUPEE AUCTIONS &middot; real Rupees, real loot</small></a>
    <div class="exy-nav"><a href="${U('/')}">pretend auctions</a><a href="${U('/rupees.html')}" class="on">rupee auctions</a><a href="${U('/rupeesell.html')}">sell</a><a href="${U('/myrupees.html')}">my rupee auctions</a><a href="${U('/rupeesold.html')}">recent sales</a><a href="${U('/rupeehelp.html')}">help</a></div></div>`;
  const foot = () => `<div class="exy-foot">JackBay Rupee Auctions are for JackNet members. Rupees are JackNet money: they are not real money and cannot be swapped for real money. &middot; <a href="${U('/rupeehelp.html')}">Rules &amp; fees</a> &middot; <a href="http://www.lootlings.jnet/">Lootlings Bazaar</a> &middot; <a href="http://www.cardkorner.kidz/">The Card Korner</a></div>`;
  const left = l => l.end - Date.now();
  const tl = l => { const ms = left(l); return `<span class="exy-tl${ms < 5 * 60000 ? ' soon' : ''}" data-end="${l.end}">${K.left(ms)}</span>`; };
  const tick = el => EX.live(el).every(() => el.querySelectorAll('.exy-tl[data-end]').forEach(s => { const ms = +s.dataset.end - Date.now(); s.textContent = ms > 0 ? K.left(ms) : 'Ending...'; s.classList.toggle('soon', ms < 5 * 60000); }), 1000);
  const itemLine = it => { const i = K.item(it.id); return i ? `<b>${esc(i.name)}</b>${it.s ? ` <small>#${it.s}${i.lim ? ' of ' + i.lim : ''}</small>` : ''}<br><small style="color:${K.RCOL[i.r]}">${K.RN[i.r]}</small> <small>&middot; ${esc((window.LootCat && LootCat.TYPES[i.type] || [i.type])[0])}</small>` : esc(it.id); };
  const pic = (it, big) => `<span class="exy-pic${big ? ' big' : ''}">${K.tile(it.id, { serial: it.s })}</span>`;

  // ================================================================ browse
  W.bayHome = el => {
    el.className = 'ex-page exy';
    const S = { ty: '', sort: 'soon', q: '' };
    el.innerHTML = `${head()}<div class="exy-in">
  <div class="exy-hello"><b>Welcome to JackBay Rupee Auctions!</b> Members sell their JackLoot (hats, pets, JackCards, the lot) to each other for <b>real Rupees</b>. JackBay holds the item AND your bid safely until the auction ends, so nobody can run off with anything. <a href="${U('/rupeehelp.html')}">How it works</a></div>
  ${EX.member ? '' : K.guestNote('Bidding and selling for Rupees')}
  <form class="exy-bar" autocomplete="off"><label>Show <select data-k="ty"><option value="">Everything</option>${TYPES().map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
    <label>Sort by <select data-k="sort"><option value="soon">Ending soonest</option><option value="new">Newly listed</option><option value="bids">Most bids</option><option value="price">Highest price</option><option value="cheap">Lowest price</option></select></label>
    <label>Search <input type="text" data-k="q" maxlength="40" placeholder="e.g. phoenix"></label><button class="btn" type="submit">Find</button>
    <a class="exy-sellbtn" href="${U('/rupeesell.html')}">Sell something!</a></form>
  <div class="exy-list"><p>Fetching auctions...</p></div></div>${foot()}`;
    const list = el.querySelector('.exy-list');
    const ask = () => EX.send({ t: 'exBayList', ty: S.ty, sort: S.sort, q: S.q });
    el.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); S.q = el.querySelector('[data-k=q]').value.trim(); ask(); });
    el.querySelectorAll('select').forEach(s => s.addEventListener('change', () => { S[s.dataset.k] = s.value; ask(); }));
    const L = EX.live(el);
    L.on('exBay', m => {
      list.innerHTML = m.list.length ? `<p class="exy-n">${m.n} auction${m.n === 1 ? '' : 's'}${m.n !== m.all ? ` (of ${m.all})` : ''} &middot; times are live</p><table class="exy-tab"><thead><tr><th>Picture</th><th>Item</th><th>Price</th><th class="hide">Bids</th><th>Time left</th></tr></thead><tbody>${m.list.map(l => `<tr class="${l.mine ? 'mine' : l.lead ? 'lead' : ''}"><td><a href="${U('/lot/' + l.id + '.html')}">${pic(l.it)}</a></td><td><a href="${U('/lot/' + l.id + '.html')}">${itemLine(l.it)}</a><br><small>seller: ${esc(l.n)}${l.mine ? ' <b>(you)</b>' : ''}${l.lead ? ' &middot; <b class="exy-win">you\'re winning!</b>' : l.myMax ? ' &middot; <b class="exy-out">outbid</b>' : ''}</small></td><td class="pr">${R(l.p)}${l.res && !l.resMet ? '<br><small>reserve not met</small>' : ''}</td><td class="hide">${l.nb}</td><td>${tl(l)}${left(l) < 5 * 60000 ? '<br><b class="exy-hot">ENDING SOON!</b>' : ''}${l.ext ? `<br><small>+${l.ext} anti-sniper</small>` : ''}</td></tr>`).join('')}</tbody></table>` : `<div class="exy-empty"><p><b>No Rupee auctions running${S.q || S.ty ? ' that match' : ' right now'}.</b></p><p>Be the first! <a href="${U('/rupeesell.html')}">Put something up for auction</a> and watch the bids roll in.</p></div>`;
    });
    let t = 0; L.on('exBayCh', () => { clearTimeout(t); t = setTimeout(ask, 700); });
    tick(el); ask();
  };

  // ================================================================ one auction
  W.bayLot = el => {
    el.className = 'ex-page exy';
    const id = +((K.addr().match(/\/lot\/(\d+)\.html/) || [])[1] || 0);
    el.innerHTML = `${head()}<div class="exy-in exy-lot"><p>Fetching auction #${id}...</p></div>${foot()}`;
    const box = el.querySelector('.exy-lot'), L = EX.live(el);
    let lot = null, msg = '';
    const draw = (m) => {
      if (!m.lot) {
        const d = m.done;
        box.innerHTML = d ? `<div class="exy-item"><div>${pic(d.it, 1)}</div><div class="exy-det"><h2>${itemLine(d.it)}</h2><div class="exy-ended"><b>This auction has ended.</b><br>${d.st === 'sold' ? `Sold to <b>${esc(d.buyer)}</b> for ${R(d.p)}.` : d.st === 'cancel' ? 'The seller cancelled it before anybody bid.' : d.st === 'reserve' ? 'The reserve price was not met, so it went back to the seller.' : d.st === 'nobids' ? 'Nobody bid on it.' : 'It was called off.'}</div><p>Seller: <b>${esc(d.n)}</b> &middot; ${d.nb} bid${d.nb === 1 ? '' : 's'} &middot; ended ${K.ago(d.end)}</p><p><a href="${U('/rupees.html')}">&laquo; Back to Rupee Auctions</a></p></div></div>` : `<h2>Auction not found</h2><p>Auction #${id} doesn't exist (or ended a long time ago). <a href="${U('/rupees.html')}">Back to Rupee Auctions</a></p>`;
        return;
      }
      const l = lot = m.lot, it = K.item(l.it.id) || { name: l.it.id, d: '', r: 0 };
      const state = l.mine ? '<div class="exy-state mine">This is <b>your</b> auction.</div>' : l.lead ? `<div class="exy-state win">You're the high bidder! Your maximum: ${R(l.myMax)}. JackBay will bid for you, up to that, if anybody else bids.</div>` : l.myMax ? `<div class="exy-state out">You've been <b>outbid</b>. Your Rupees are back in the bank. Bid again?</div>` : '';
      box.innerHTML = `<div class="exy-item"><div>${pic(l.it, 1)}${it.type === 'card' ? '' : ''}</div><div class="exy-det">
        <h2>${esc(it.name)}${l.it.s ? ` <small>#${l.it.s}${it.lim ? ' of ' + it.lim : ''}</small>` : ''}</h2><div class="exy-sub">Rupee auction #${l.id} &middot; <span style="color:${K.RCOL[it.r]}"><b>${K.RN[it.r]}</b></span> ${esc((window.LootCat && LootCat.TYPES[it.type] || [''])[0])}</div>
        ${state}
        <table class="exy-dt"><tr><td>Current price</td><td class="exy-big">${R(l.p)}${l.nb ? '' : ' <small>(starting price)</small>'}</td></tr><tr><td>Bids</td><td>${l.nb} from ${l.nbr} bidder${l.nbr === 1 ? '' : 's'}</td></tr><tr><td>High bidder</td><td>${l.hi ? esc(l.hi) + (l.lead ? ' <b class="exy-win">(YOU!)</b>' : '') : '<i>no bids yet</i>'}</td></tr>
        ${l.res ? `<tr><td>Reserve</td><td>${l.resMet ? '<b class="exy-win">Reserve met</b>' : '<b class="exy-out">Reserve not met yet</b> <small>(the seller has a secret lowest price)</small>'}</td></tr>` : ''}
        <tr><td>Time left</td><td>${tl(l)}${l.ext ? ` <small>(extended ${l.ext} time${l.ext > 1 ? 's' : ''} by the Anti-Sniper Rule)</small>` : ''}</td></tr><tr><td>Ends</td><td>${K.d99(l.end)} at ${K.t99(l.end)}</td></tr><tr><td>Seller</td><td><b>${esc(l.n)}</b></td></tr></table>
        ${l.mine ? (l.nb ? '<p class="exy-small">Somebody has bid, so this auction can\'t be cancelled now.</p>' : '<form class="exy-bid"><b>Change your mind?</b> You can cancel until somebody bids (the listing fee isn\'t refunded). <button class="btn" type="button" data-cancel>Cancel auction</button></form>') : EX.member ? `<form class="exy-bid" autocomplete="off"><b>Place a bid</b><br>Bid at least <b>${rp(l.min)}</b>. Type the MOST you'd pay: JackBay only spends what it needs to beat the others.<br><label>Your maximum bid: <input type="number" min="${l.min}" step="1" inputmode="numeric" class="exy-amt" value="${l.lead ? '' : l.min}" aria-label="Your maximum bid in Rupees"> Rupees</label> <button class="btn" type="submit"><b>Bid!</b></button><div class="exy-msg" aria-live="polite">${esc(msg)}</div><small>Your bid is held by JackBay until the end. If somebody outbids you, you get it straight back.</small></form>` : K.guestNote('Bidding with Rupees')}
        <div class="exy-desc"><h3>Description</h3><p>${esc(it.d || '')}</p><p class="exy-small">Comes straight from ${esc(l.n)}'s Treasure Chest. JackBay is holding it until the auction ends.</p></div>
        <h3>Bid history</h3><table class="exy-hist"><thead><tr><th>Bidder</th><th>Price after</th><th>When</th></tr></thead><tbody>${(l.hist || []).map(([ts, n, p]) => `<tr${EX.me && Net.me && n === Net.me.nick ? ' class="me"' : ''}><td>${esc(n)}</td><td>${R(p)}</td><td>${K.t99(ts)}:${K.pad(new Date(ts).getSeconds())}</td></tr>`).join('') || '<tr><td colspan="3"><i>No bids yet. Be the first!</i></td></tr>'}</tbody></table>
        <p><a href="${U('/rupees.html')}">&laquo; Back to Rupee Auctions</a></p></div></div>`;
      const f = box.querySelector('form.exy-bid');
      if (f && !l.mine) f.addEventListener('submit', ev => {
        ev.preventDefault();
        const v = Math.floor(+box.querySelector('.exy-amt').value);
        const out = box.querySelector('.exy-msg');
        if (!(v > 0)) { out.textContent = 'Type a number of Rupees.'; return; }
        if (!l.lead && v < l.min) { out.textContent = `Your bid has to be at least ${rp(l.min)}.`; EX.sfx('uhoh'); return; }
        Desk.msgbox('JackBay - Confirm Bid', `${it.name}\n\nYour maximum bid: ${rp(v)}\nCurrent price: ${rp(l.p)}\n\nJackBay holds your bid (up to ${rp(v)}) until the auction ends. If you win, you pay the winning price and get the rest back. If you're outbid, you get it all back straight away.`, 'q', [['Place Bid', () => EX.send({ t: 'exBayBid', id: l.id, max: v })], ['Cancel']]);
      });
      const c = box.querySelector('[data-cancel]');
      if (c) c.addEventListener('click', () => Desk.msgbox('JackBay', 'Cancel this auction? The item goes back to your Treasure Chest. The listing fee is not refunded.', 'q', [['Cancel auction', () => EX.send({ t: 'exBayCancel', id: l.id })], ['Keep it running']]));
    };
    const ask = () => EX.send({ t: 'exBayLot', id });
    L.on('exBayLot', m => { if ((m.lot && m.lot.id === id) || (m.done && m.done.id === id) || (!m.lot && !m.done)) { msg = ''; draw(m); } });
    L.on('exBayCh', m => { if (m.id === id) ask(); });
    L.on('exBayBidOk', m => { if (m.id !== id) return; EX.sfx(m.lead ? 'solve' : 'uhoh'); msg = m.lead ? `You're winning! Price ${rp(m.p)}.` : `Outbid straight away: ${m.outbidBy} has a higher maximum. Price now ${rp(m.p)}.`; if (m.snipe) Desk.toast('JackBay', 'ANTI-SNIPER RULE! That late bid put another minute on the clock.', 5000); ask(); setTimeout(() => { const o = box.querySelector('.exy-msg'); if (o) o.textContent = msg; }, 400); });
    L.on('exBayDoneOk', m => { if (m.id === id) ask(); });
    L.on('exErr', m => { const o = box.querySelector('.exy-msg'); if (o) o.textContent = m.msg; else Desk.msgbox('JackBay', m.msg, 'warn'); EX.sfx('uhoh'); });
    tick(el); ask();
  };

  // ================================================================ sell
  W.baySell = el => {
    el.className = 'ex-page exy';
    let sel = 0, filt = '';
    const draw = () => {
      if (!EX.member) { el.innerHTML = `${head()}<div class="exy-in"><h2>Sell for Rupees</h2>${K.guestNote('Selling on JackBay')}</div>${foot()}`; return; }
      const mine = K.chest().filter(x => !x.lk && (!filt || (K.item(x.id) || {}).type === filt)).sort((a, b) => ((K.item(b.id) || {}).r | 0) - ((K.item(a.id) || {}).r | 0));
      const x = sel && K.chest().find(y => y.u === sel), it = x && K.item(x.id);
      el.innerHTML = `${head()}<div class="exy-in"><h2>Sell for Rupees</h2>
        <ol class="exy-steps"><li${x ? '' : ' class="on"'}>Pick something from your Treasure Chest</li><li${x ? ' class="on"' : ''}>Set a starting price and how long it runs</li><li>JackBay holds it until the hammer comes down</li></ol>
        ${x ? `<div class="exy-item"><div>${pic(x, 1)}</div><form class="exy-det exy-sf" autocomplete="off"><h3>${esc(it.name)}</h3><p style="color:${K.RCOL[it.r]}"><b>${K.RN[it.r]}</b></p>
          <p><label>Starting price: <input type="number" min="1" max="${B.priceMax}" step="1" value="${[5, 15, 40, 120, 400, 1500][it.r] || 10}" data-k="start" inputmode="numeric"> Rupees</label></p>
          <p><label>Reserve price (optional): <input type="number" min="0" max="${B.priceMax}" step="1" value="" placeholder="none" data-k="res" inputmode="numeric"> Rupees</label><br><small>A secret lowest price. If the bids don't reach it, you keep the item.</small></p>
          <p><label>How long: <select data-k="dur">${B.durs.map(([m, n], i) => `<option value="${m}"${i === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></label></p>
          <p class="exy-fee">Listing fee: <b class="fee"></b> <small>(JackBay also keeps ${B.finalPct}% of the final price when it sells. Fees vanish into thin air, which keeps Rupees valuable.)</small></p>
          <p><button class="btn" type="submit"><b>List it!</b></button> <button class="btn" type="button" data-back>Pick something else</button></p><div class="exy-msg" aria-live="polite"></div></form></div>`
        : `<p>Click the thing you want to sell. (Things already in a trade, on the Bazaar or in another auction aren't shown.)</p>
          <p><label>Show <select data-f><option value="">Everything</option>${TYPES().map(([k, n]) => `<option value="${k}"${k === filt ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label></p>
          <div class="exy-grid">${mine.map(y => `<button type="button" class="exy-cell" data-u="${y.u}">${K.tile(y.id, { serial: y.s })}<span>${esc((K.item(y.id) || {}).name || y.id)}</span></button>`).join('') || '<p><i>Your Treasure Chest is empty. Play games, find secrets and open your Daily Parcel to find loot!</i></p>'}</div>`}
      </div>${foot()}`;
      el.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { sel = +b.dataset.u; draw(); }));
      const fs = el.querySelector('[data-f]'); if (fs) fs.addEventListener('change', () => { filt = fs.value; draw(); });
      const f = el.querySelector('.exy-sf');
      if (f) {
        const fee = () => { const st = Math.max(1, Math.floor(+f.querySelector('[data-k=start]').value || 1)), r = Math.floor(+f.querySelector('[data-k=res]').value || 0); f.querySelector('.fee').innerHTML = R(B.listFee(st) + (r > st ? B.reserveFee : 0)); };
        f.addEventListener('input', fee); fee();
        f.querySelector('[data-back]').addEventListener('click', () => { sel = 0; draw(); });
        f.addEventListener('submit', ev => {
          ev.preventDefault();
          const start = Math.floor(+f.querySelector('[data-k=start]').value), res = Math.floor(+f.querySelector('[data-k=res]').value || 0), dur = +f.querySelector('[data-k=dur]').value;
          if (!(start >= 1)) { f.querySelector('.exy-msg').textContent = 'Pick a starting price of at least 1 Rupee.'; return; }
          if (res && res <= start) { f.querySelector('.exy-msg').textContent = 'The reserve has to be more than the starting price (or leave it empty).'; return; }
          EX.send({ t: 'exBaySell', u: sel, start, res: res || 0, dur });
        });
      }
    };
    const L = EX.live(el);
    L.on('exBaySold', m => { EX.sfx('solve'); sel = 0; EX.go(U('/lot/' + m.id + '.html')); });
    L.on('exErr', m => { const o = el.querySelector('.exy-msg'); if (o) o.textContent = m.msg; else Desk.msgbox('JackBay', m.msg, 'warn'); EX.sfx('uhoh'); });
    if (window.Loot && Loot.on) { const off = Loot.on('me', () => { if (!el.isConnected) return off(); if (!sel) draw(); }); }
    draw();
    if (window.Loot && EX.member) Loot.send({ t: 'lootMe' });
  };

  // ================================================================ my auctions
  W.bayMine = el => {
    el.className = 'ex-page exy';
    if (!EX.member) { el.innerHTML = `${head()}<div class="exy-in"><h2>My Rupee Auctions</h2>${K.guestNote('My Rupee Auctions')}</div>${foot()}`; return; }
    el.innerHTML = `${head()}<div class="exy-in"><h2>My Rupee Auctions: ${esc(Net.me.nick)}</h2><div class="exy-mine"><p>Fetching...</p></div></div>${foot()}`;
    const box = el.querySelector('.exy-mine'), L = EX.live(el);
    const OUT = { sold: 'Sold', nobids: 'No bids', reserve: 'Reserve not met', cancel: 'Cancelled', broken: 'Called off' };
    const row = l => `<tr><td><a href="${U('/lot/' + l.id + '.html')}">${pic(l.it)}</a></td><td><a href="${U('/lot/' + l.id + '.html')}">${itemLine(l.it)}</a></td><td class="pr">${R(l.p)}</td><td>${l.nb}</td><td>${tl(l)}</td><td>${l.mine ? '' : l.lead ? '<b class="exy-win">Winning</b>' : '<b class="exy-out">Outbid</b>'}</td></tr>`;
    L.on('exBayMine', m => {
      const me = Net.me.nick;
      box.innerHTML = `<h3>Selling (${m.selling.length})</h3>${m.selling.length ? `<table class="exy-tab"><tbody>${m.selling.map(row).join('')}</tbody></table>` : `<p>Nothing for sale. <a href="${U('/rupeesell.html')}">Sell something!</a></p>`}
        <h3>Bidding on (${m.bidding.length})</h3>${m.bidding.length ? `<table class="exy-tab"><tbody>${m.bidding.map(row).join('')}</tbody></table>` : `<p>You're not bidding on anything. <a href="${U('/rupees.html')}">Have a look round!</a></p>`}
        <h3>Finished</h3>${m.done.length ? `<table class="exy-tab"><thead><tr><th>Picture</th><th>Item</th><th>What happened</th><th>Price</th><th>When</th></tr></thead><tbody>${m.done.map(d => `<tr><td>${pic(d.it)}</td><td>${itemLine(d.it)}</td><td>${d.n === me ? (d.st === 'sold' ? `You sold it to <b>${esc(d.buyer)}</b>` : OUT[d.st]) : d.buyer === me ? '<b class="exy-win">You won it!</b>' : d.st === 'sold' ? `${esc(d.buyer)} won it` : OUT[d.st]}</td><td>${d.p ? R(d.p) : '-'}</td><td>${K.ago(d.end)}</td></tr>`).join('')}</tbody></table>` : '<p>Nothing yet.</p>'}
        <p class="exy-small">All time: sold ${m.me.sold} (earned ${rp(m.me.earned)}), won ${m.me.bought} (spent ${rp(m.me.spent)}).</p>`;
    });
    L.on('exBayCh', () => EX.send({ t: 'exBayMine' }));
    tick(el); EX.send({ t: 'exBayMine' });
  };

  // ================================================================ recent sales + the rules
  W.bayDone = el => {
    el.className = 'ex-page exy';
    el.innerHTML = `${head()}<div class="exy-in"><h2>Recent Sales</h2><div class="exy-dn"><p>Fetching...</p></div></div>${foot()}`;
    EX.live(el).on('exBayDone', m => {
      el.querySelector('.exy-dn').innerHTML = `<p>${m.st.lots} auctions listed, ${m.st.sold} sold, since JackBay Rupee Auctions opened.</p>
        <h3>Biggest sales ever</h3>${m.top.length ? `<table class="exy-tab"><tbody>${m.top.map((d, i) => `<tr><td><b>${i + 1}.</b></td><td>${pic(d.it)}</td><td>${itemLine(d.it)}</td><td class="pr">${R(d.p)}</td><td>${esc(d.n)} &rarr; ${esc(d.buyer)}</td></tr>`).join('')}</tbody></table>` : '<p>Nothing has sold yet!</p>'}
        <h3>Just sold</h3>${m.sold.length ? `<table class="exy-tab"><tbody>${m.sold.map(d => `<tr><td>${pic(d.it)}</td><td>${itemLine(d.it)}</td><td class="pr">${R(d.p)}</td><td>${d.nb} bids</td><td>${K.ago(d.end)}</td></tr>`).join('')}</tbody></table>` : '<p>Nothing yet.</p>'}`;
    });
    EX.send({ t: 'exBayDone' });
  };
  W.bayHelp = el => {
    el.className = 'ex-page exy';
    el.innerHTML = `${head()}<div class="exy-in exy-help"><h2>Rupee Auctions: How It Works</h2>
      <h3>Selling</h3><ol><li>Pick something from your Treasure Chest, a starting price and how long the auction runs (${B.durs.map(d => d[1]).join(', ')}).</li><li>Pay the <b>listing fee</b>: 2% of the starting price (at least 1 Rupee, at most 25). A secret <b>reserve price</b> costs ${B.reserveFee} more.</li><li>JackBay <b>holds the item</b>. You can't wear it, trade it or recycle it while it's up for auction.</li><li>When it sells, you get the price minus a <b>${B.finalPct}% final value fee</b>. If nobody bids (or the reserve isn't met) it comes back to you.</li><li>You can cancel an auction until the first bid. After that, a deal's a deal.</li><li>Up to ${B.maxLots} auctions at once.</li></ol>
      <h3>Bidding</h3><ol><li>Type the <b>most</b> you'd pay. JackBay bids for you, only as much as it needs to stay ahead ("proxy bidding").</li><li>JackBay <b>holds your bid</b>. If someone outbids you, you get it straight back. If you win, you pay the winning price and get the rest back.</li><li>Each bid has to beat the price by at least: 1 Rupee (under 50), 5 (under 200), 10 (under 1,000), 25 (under 5,000), or 100.</li><li>You need to have earned ${rp(B.minEarned)} yourself before you can bid. (It stops people making forty accounts. Dave.)</li><li>You can't bid on your own auctions.</li></ol>
      <h3>The Anti-Sniper Rule</h3><p>A "sniper" waits until the very last seconds to bid, so nobody can bid back. On Rupee Auctions, <b>any bid in the last ${B.snipe} seconds puts the clock back up to ${B.snipe} seconds</b> (up to ${B.snipeMax} times), so everybody gets a fair go. (The pretend auctions still have sn1per_bob. Nobody can stop sn1per_bob.)</p>
      <h3>Is it real money?</h3><p><b>No!</b> Rupees are JackNet money: you earn them by playing, finding secrets and doing odd jobs. They can never be bought with, or swapped for, real money. Never give anybody your password, and never send real money to anyone on the Internet.</p>
      <p><a href="${U('/rupees.html')}">&laquo; Back to Rupee Auctions</a></p></div>${foot()}`;
  };
})();

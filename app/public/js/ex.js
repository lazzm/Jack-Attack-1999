/* ex.js: the ECONOMY expansion (the always-loaded part; pages and programs load when they're first needed).
 *   JackCards Series Two (Byte Beasties)   www.cardkorner.kidz (boosters, starter deck, checklist, rules)   js/ex-shop.js
 *   JackCards Binder 99 (a download)        binder, deck builder, packets                                    js/ex-binder.js
 *   Card Clash                              vs Dave / Callum / JackK, or a friend online (Play Together)       js/ex-clash.js
 *   JackBay Rupee Auctions                  www.jackbay.webcom/rupees.html (real Rupees, real loot)           js/ex-bay.js
 *   Jacktown Town Hall                      www.jacktownhall.jnet (takings, business rates, upgrades, league) js/ex-town.js
 *   The Mega Masters                        www.megamasters.cyb (the weekly cup)                               js/ex-cup.js
 *   The Odd Jobz Board                      four new jobs, streaks and the Job of the Day                      js/ex-jobs.js
 * The server (mods/ex.js) decides everything; the numbers are in js/ex-cat.js, the drawings in js/ex-art.js.
 * window.EX: on(type, fn) -> off, send(m), load(name), go(url), me (exMe), jobs, rp(n), fmt(n), live(el), ICO. */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || !window.ExCat || window.EX) return;
  const X = window.ExCat, esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  const rp = n => (window.Econ && Econ.rp ? Econ.rp(n) : `${fmt(n)} ${Math.floor(n) === 1 ? 'Rupee' : 'Rupees'}`);
  const member = () => !!(window.Net && Net.me && Net.me.member);
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };

  // ================================================================ state + the wire
  const evs = {};
  const emit = (t, d) => (evs[t] || []).slice().forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  let me = null, jobs = null, clashLive = '';
  const EX = window.EX = {
    get me() { return me; }, get jobs() { return jobs; }, get member() { return member(); }, get clashLive() { return clashLive; },
    on(t, fn) { (evs[t] = evs[t] || []).push(fn); return () => { evs[t] = (evs[t] || []).filter(x => x !== fn); }; },
    emit, rp, fmt, esc, sfx, X,
    send: m => !!(window.Net && Net.send(m)),
    load: name => A.load('js/loot-cat.js').catch(() => {}).then(() => { X.augment(window.LootCat, window.GrindCat); return A.load('js/ex-duel.js'); }).then(() => A.load('js/ex-kit.js')).then(() => (name ? A.load('js/ex-' + name + '.js') : null)),
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } const tb = $('taskBrowser'); if (tb) tb.hidden = false; IE.navigate(url); },
    // a page's own little clock: fn() runs every ms while the page is still on screen, and stops once it's gone
    live(el) {
      const offs = [], L = {
        on(t, fn) { offs.push(EX.on(t, m => { if (el.isConnected) fn(m); })); return L; },
        every(fn, ms) { const id = setInterval(() => { if (el.isConnected && !document.hidden) fn(); }, ms); offs.push(() => clearInterval(id)); return L; },
        off() { offs.splice(0).forEach(f => f()); },
      };
      const watch = setInterval(() => { if (!el.isConnected) { clearInterval(watch); L.off(); } }, 1500);
      return L;
    },
  };
  if (window.Net) {
    Net.on('exMe', m => { me = m.guest ? null : m; emit('me', me); });
    Net.on('exJobs', m => { jobs = m; emit('jobs', m); });
    Net.on('exClashLive', m => {
      clashLive = m.id; emit('clashLive', m);
      const a = A.apps['ex.clash']; if (a && a._w && !a._w.closed) return;
      const go = () => A.open('ex.clash');
      setTimeout(() => { if (window.MP && MP.askBalloon) MP.askBalloon('Card Clash', 'Your game of Card Clash is still going!', [['Carry on', go], ['Later', () => {}]], 20000); else Desk.toast('Card Clash', 'Your game of Card Clash is still going! Open Card Clash to carry on.', 8000); }, 3000);
    });
    for (const t of ['exPack', 'exPackGot', 'exClash', 'exClashWait', 'exBay', 'exBayLot', 'exBaySold', 'exBayBidOk', 'exBayDoneOk', 'exBayMine', 'exBayDone', 'exBayCh', 'exTown', 'exTour', 'exErr']) Net.on(t, m => emit(t, m));
    Net.on('exErr', m => { if (!(evs.exErr || []).length) Desk.toast('JackNet', m.msg, 5000); });
    Net.on('loginOk', () => setTimeout(() => { Net.send({ t: 'exMe' }); Net.send({ t: 'exJobs' }); }, 600));
    Net.on('welcome', () => setTimeout(() => Net.send({ t: 'exJobs' }), 2500));
    Net.on('you', m => { if (!m.member) { me = null; emit('me', null); } });
    // auction news (it also comes later if you were away: the server keeps it in your inbox)
    Net.on('exBayNote', m => {
      emit('bayNote', m);
      const nm = m.name || 'your item', late = m.late ? ' (while you were away)' : '';
      const T = { outbid: [`Outbid on JackBay!`, `Somebody has bid more than you for "${nm}"${m.by ? ' (' + m.by + ')' : ''}. Price now ${rp(m.p)}. Your Rupees are back in the bank.`],
        won: [`You won on JackBay!${late}`, `"${nm}" is yours for ${rp(m.p)}! It's already in your Treasure Chest.`],
        sold: [`Sold on JackBay!${late}`, `"${nm}" sold to ${m.to} for ${rp(m.p)} (JackBay kept ${rp(m.fee)}).`],
        nobids: [`JackBay: no bids${late}`, `Nobody bid on "${nm}", so it's back in your Treasure Chest. Try a lower starting price?`],
        reserve: [`JackBay: reserve not met${late}`, `The bids on "${nm}" didn't reach your reserve price, so it's back in your Treasure Chest and everybody got their Rupees back.`],
        noreserve: [`JackBay: reserve not met${late}`, `You were the top bidder for "${nm}", but the seller's secret reserve price wasn't reached. Your Rupees are back in the bank.`],
        broken: [`JackBay${late}`, `The auction for "${nm}" was called off. Everybody got their Rupees back.`] }[m.k];
      if (!T) return;
      if (m.k === 'won' || m.k === 'sold') sfx('solve'); else if (m.k === 'outbid') sfx('uhoh');
      Desk.toast(T[0], T[1], 8000);
      if ((m.k === 'won' || m.k === 'sold') && window.Econ && Econ.mail) Econ.mail({ from: 'JackBay <auctions@jackbay.webcom>', subj: m.k === 'won' ? `JackBay: you won "${nm}"!` : `JackBay: "${nm}" has sold!`, body: m.k === 'won' ? `Congratulations!\n\nYou were the winning bidder for:\n\n   ${nm}\n\nPrice: ${rp(m.p)}\nSeller: ${m.from}\n\nThe item has been delivered straight to your Treasure Chest (Start > Programs > JackLoot). Any part of your maximum bid you didn't need has gone back into your JackNet Bank account.\n\nPlease leave feedback for the seller!\n\nHappy bidding,\nThe JackBay Team\nwww.jackbay.webcom/rupees.html` : `Good news!\n\nYour item "${nm}" has sold to ${m.to} for ${rp(m.p)}.\n\nJackBay's final value fee: ${rp(m.fee)}\nPaid into your JackNet Bank account: ${rp(m.p - m.fee)}\n\nThe item has been delivered to the buyer. Thank you for selling on JackBay!\n\nThe JackBay Team` });
      if (m.k === 'won') A.secret('ex.baywin');
    });
    Net.on('exTourEnd', m => emit('tourEnd', m));
    Net.on('exTourWin', m => {
      const pos = ['', '1st', '2nd', '3rd'][m.pos] || '';
      Desk.toast('The Mega Masters', pos ? `You came ${pos} in ${m.ev}! Prize: ${rp(m.prize)} and a cup for your Treasure Chest.` : `Thanks for taking part in ${m.ev}! ${rp(m.prize)} for having a go.`, 9000);
      if (pos) { sfx('solve'); A.secret('ex.cupwin'); if (window.Econ && Econ.mail) Econ.mail({ from: 'The Mega Masters <cup@megamasters.cyb>', subj: `You came ${pos} at The Mega Masters!`, body: `${m.w}\n\nWell done! You finished ${pos} in ${m.ev}.\n\nYour prize: ${rp(m.prize)} (already in your JackNet Bank) and a Mega Masters cup (in your Treasure Chest).\n\nA new week of events has started. Defend your title at www.megamasters.cyb!\n\nThe Mega Masters committee\n(Dave was not on the committee. Dave was disqualified for "looking at the screen funny".)` }); }
    });
  }

  // ================================================================ icons (16 and 32)
  const ICO = {
    binder: '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="23" height="27" rx="2" fill="#2a1a8a" stroke="#000"/><rect x="5" y="3" width="5" height="27" fill="#1a0a5a" stroke="#000"/><circle cx="7.5" cy="9" r="1.4" fill="#c0c0c0" stroke="#000" stroke-width=".5"/><circle cx="7.5" cy="16" r="1.4" fill="#c0c0c0" stroke="#000" stroke-width=".5"/><circle cx="7.5" cy="23" r="1.4" fill="#c0c0c0" stroke="#000" stroke-width=".5"/><rect x="13" y="7" width="11" height="15" rx="1" fill="#ffd400" stroke="#000"/><rect x="14.4" y="9.6" width="8.2" height="6" fill="#2f80ee"/><circle cx="18.5" cy="12.6" r="2" fill="#ffe24a" stroke="#000" stroke-width=".5"/><path d="M14.4 18h8M14.4 20h5" stroke="#000" stroke-width=".7"/><path d="M12 25h13" stroke="#ffd400" stroke-width="1.4"/></svg>',
    clash: '<svg viewBox="0 0 32 32"><rect x="2" y="6" width="13" height="19" rx="1.4" fill="#e10600" stroke="#000" transform="rotate(-12 8 15)"/><rect x="17" y="6" width="13" height="19" rx="1.4" fill="#2f80ee" stroke="#000" transform="rotate(12 24 15)"/><path d="M16 2l2.4 6.6 7 .4-5.4 4.4 1.8 6.8L16 16.4l-5.8 3.8 1.8-6.8L6.6 9l7-.4z" fill="#ffd400" stroke="#000"/><text x="16" y="14.4" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6" fill="#000">VS</text></svg>',
    shop: '<svg viewBox="0 0 32 32"><rect x="3" y="12" width="26" height="17" fill="#c84a2a" stroke="#000"/><path d="M2 12l3-7h22l3 7z" fill="#ffd400" stroke="#000"/><path d="M7 5l-1.6 7M12 5l-.8 7M17 5v7M22 5l.8 7M27 5l1.6 7" stroke="#e10600" stroke-width="1.6"/><rect x="6" y="16" width="11" height="9" fill="#bfe4ff" stroke="#000"/><rect x="20" y="16" width="6" height="13" fill="#6a3a1a" stroke="#000"/><rect x="8" y="18" width="3" height="5" fill="#ffd400" stroke="#000" stroke-width=".4"/><rect x="12" y="18" width="3" height="5" fill="#9a3ae0" stroke="#000" stroke-width=".4"/></svg>',
    bay: '<svg viewBox="0 0 32 32"><path d="M6 26l9-9" stroke="#6a3a1a" stroke-width="3.4" stroke-linecap="round"/><rect x="12" y="4" width="16" height="9" rx="2" transform="rotate(45 20 8.5)" fill="#a0602a" stroke="#000"/><rect x="2" y="26" width="16" height="4" fill="#4a2a0a" stroke="#000"/><path d="M22 20l.8 2 2.2.2-1.6 1.4.5 2.2-1.9-1.2-1.9 1.2.5-2.2-1.6-1.4 2.2-.2z" fill="#ffd400" stroke="#000" stroke-width=".4"/></svg>',
    hall: `<svg viewBox="0 0 32 32"><path d="M3 12L16 4l13 8z" fill="#c8c0a8" stroke="#000"/><rect x="5" y="12" width="22" height="2.4" fill="#e8e0c8" stroke="#000"/>${[7, 12, 17.4, 22.6].map(x => `<rect x="${x}" y="14.4" width="2.6" height="11" fill="#f0e8d0" stroke="#000" stroke-width=".6"/>`).join('')}<rect x="3" y="25.4" width="26" height="3.6" fill="#a8a088" stroke="#000"/><circle cx="16" cy="9" r="2" fill="#ffd400" stroke="#000" stroke-width=".5"/></svg>`,
    cup: '<svg viewBox="0 0 32 32"><path d="M9 4h14v7c0 5-3 8-7 8s-7-3-7-8z" fill="#ffd400" stroke="#8a6000"/><path d="M9 6H4c0 5 2 7 5.6 7.4M23 6h5c0 5-2 7-5.6 7.4" fill="none" stroke="#8a6000" stroke-width="1.6"/><rect x="14" y="18" width="4" height="5" fill="#c99a00"/><rect x="9" y="23" width="14" height="5" fill="#2a0a6a" stroke="#000"/><text x="16" y="27" text-anchor="middle" font-family="Arial Black,Arial" font-size="4" fill="#ffd400">MEGA</text><path d="M12 6.5c0 3 .8 5 2.4 6.4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></svg>',
  };
  EX.ICO = ICO;

  // ================================================================ the web sites (pages fill themselves once their file has loaded)
  function page(file, fn) {
    return () => {
      const el = document.createElement('div'); el.className = 'ex-page ex-loading';
      el.innerHTML = '<p style="font:13px \'Courier New\',monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:300px">Contacting host... Host contacted. Waiting for reply...<br>Receiving data at 3.6 KB/sec...</p>';
      EX.load(file).then(() => { const W = window.ExWeb; if (W && W[fn]) { el.classList.remove('ex-loading'); W[fn](el); } })
        .catch(e => { console.error(e); el.innerHTML = '<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server is not answering. Click <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p></div>'; });
      return el;
    };
  }
  const SITES = [
    ['www.cardkorner.kidz', (window.Cast ? Cast.t("THE CARD KORNER - {shop}'s Card & Comic Shop") : 'THE CARD KORNER - Card & Comic Shop'), 'Byte Beasties JackCards Series Two booster packs, a free starter deck for members, the checklist and the Card Clash rules. Rupees accepted!', 'games',
      { '/': ['shop', 'shopHome'], '/odds.html': ['shop', 'shopOdds', 'Pull Rates'], '/checklist.html': ['shop', 'shopList', 'The Checklist'], '/rules.html': ['shop', 'shopRules', 'How to Play Card Clash'], '/backroom.html': ['shop', 'shopBack', 'STAFF ONLY'] }],
    ['www.jacktownhall.jnet', 'Jacktown Town Hall - Business Rates & Licensing', 'Collect your plot\'s daily takings, pay your business rates, upgrade your licence and see the Jacktown league table.', 'kids',
      { '/': ['town', 'townHome'], '/rates.html': ['town', 'townRates', 'Business Rates Explained'] }],
    ['www.megamasters.cyb', 'THE MEGA MASTERS - The Weekly JackNet Cup', 'Three events a week: an arcade game, a Pocket Money job and the Card Clash League. Gold cups and Rupees for the top three!', 'games',
      { '/': ['cup', 'cupHome'], '/past.html': ['cup', 'cupPast', 'Past Champions'], '/rules.html': ['cup', 'cupRules', 'Rules'] }],
  ];
  if (window.IE && IE.addSite) for (const [host, title, desc, cat, paths] of SITES) {
    const pages = {}; for (const p in paths) pages[p] = { title: paths[p][2] ? title.replace(/ [-:].*$/, '') + ' - ' + paths[p][2] : title, html: page(paths[p][0], paths[p][1]) };
    IE.addSite(host, { title, desc, cat, pages });
  }
  // JackBay grows a real-Rupee auction house (next to its pretend-money auctions, which carry on exactly as they were)
  const BAYP = { '/rupees.html': ['bayHome', 'Rupee Auctions'], '/rupeesell.html': ['baySell', 'Sell for Rupees'], '/myrupees.html': ['bayMine', 'My Rupee Auctions'], '/rupeehelp.html': ['bayHelp', 'Rupee Auctions: Rules'], '/rupeesold.html': ['bayDone', 'Recent Sales'] };
  function bayPages() {
    const S = IE.sites && IE.sites['jackbay.webcom']; if (!S || S._ex) return !!S;
    for (const p in BAYP) S.pages[p] = { title: 'JackBay - ' + BAYP[p][1], html: page('bay', BAYP[p][0]) };
    const inner = S.pages, lot = { title: 'JackBay - Rupee Auction', html: page('bay', 'bayLot') };
    S.pages = new Proxy(inner, { get(t, p) { if (typeof p === 'string' && !(p in t) && /^\/lot\/\d{1,9}\.html$/.test(p)) return lot; return t[p]; } });
    S._ex = 1; return true;
  }
  if (!bayPages()) document.addEventListener('DOMContentLoaded', bayPages);
  // signposts on pages that already exist: the pretend JackBay, Jacktown, The Odd Jobz Board, Lootlings, the magazine
  document.addEventListener('section', e => {
    const d = String(e.detail || '');
    if (/^site:(www\.)?jackbay\.webcom\/$/.test(d)) [120, 600, 1800].forEach(ms => setTimeout(() => sign('.gb-main', 'ex-baysign', `<b>NEW! REAL RUPEE AUCTIONS</b> &middot; Sell your JackLoot to other members for real Rupees. The item and the bids wait safely at JackBay until the hammer comes down. <a href="http://www.jackbay.webcom/rupees.html">Go to Rupee Auctions &raquo;</a>`, true), ms));
    if (/^site:(www\.)?jacktown\.jnet\//.test(d)) [300, 1200, 2500].forEach(ms => setTimeout(() => sign('#s-secret .ecw', 'ex-townsign', `${ICO.hall.replace('<svg', '<svg width="24" height="24"')} <b>Plot owners!</b> Your shops and houses take money every day. Collect your takings and upgrade your licence at the <a href="http://www.jacktownhall.jnet/">Town Hall</a>.`), ms));
    if (/^site:(www\.)?lootlings\.jnet\//.test(d)) [300, 1200].forEach(ms => setTimeout(() => sign('#s-secret', 'ex-lootsign', `<b>NEW JACKCARDS!</b> Byte Beasties Series Two are in at <a href="http://www.cardkorner.kidz/">The Card Korner</a>. And sell your best loot for real Rupees at <a href="http://www.jackbay.webcom/rupees.html">JackBay Rupee Auctions</a>.`, true), ms));
    if (d === 'home') setTimeout(homeSign, 400);
  });
  function sign(sel, cls, html, first) {
    const host = document.querySelector(sel); if (!host || host.querySelector('.' + cls)) return;
    const b = document.createElement('div'); b.className = 'ex-sign ' + cls; b.innerHTML = html;
    if (first) host.insertBefore(b, host.firstChild); else host.appendChild(b);
  }
  function homeSign() {
    const s = document.querySelector('#s-home .gr-sign ul'); if (!s || s.querySelector('.ex-li')) return;
    const L = [['http://www.cardkorner.kidz/', 'JackCards: Byte Beasties', 'Series Two boosters, a free starter deck and Card Clash.', ICO.shop], ['http://www.jackbay.webcom/rupees.html', 'JackBay Rupee Auctions', 'Buy and sell loot for real Rupees.', ICO.bay], ['http://www.megamasters.cyb/', 'The Mega Masters', 'The weekly cup: gold cups and Rupees.', ICO.cup], ['http://www.jacktownhall.jnet/', 'Jacktown Town Hall', 'Daily takings for your plot.', ICO.hall]];
    for (const [u, t, x, ic] of L) { const li = document.createElement('li'); li.className = 'ex-li'; li.innerHTML = `${ic}<span><a href="${u}" data-grgo="${u}">${esc(t)}</a><small>${esc(x)}</small></span>`; s.appendChild(li); }
  }
  setTimeout(homeSign, 1500);

  // ================================================================ programs: JackCards Binder 99 (Binder + Card Clash), a download
  const PID = 'ex.binder';
  try {
    if (window.Setup && Setup.product) Setup.product(PID, {
      n: 'JackCards Binder 99', v: '1.2', kb: 2860, lic: 'Freeware', by: (window.Cast ? Cast.t("{shop}'s Card Korner") : 'The Card Korner'), cat: 'games', sq: 5, rel: '01/10/99', def: false,
      d: 'Keep your JackCards in a proper binder (nine pockets a page, just like the real thing), build a deck of 15 and play CARD CLASH against Dave, Callum, JackK or your mates over the JackNet!',
      note: 'Byte Beasties boosters available from www.cardkorner.kidz. Mom says five packets a day is PLENTY.',
      home: 'http://www.cardkorner.kidz/', apps: ['ex.binder', 'ex.clash'], paths: ['JackCards >'], icons: ['exIconBinder'], cmds: ['binder', 'jackcards', 'cardclash', 'clash'],
      launch: 'ex.binder', exe: 'JCBINDER.EXE', dir: 'JackCards', ic: 'cards',
    });
  } catch (e) { console.error(e); }
  A.register('ex.binder', { single: true, cmd: ['binder', 'jackcards', 'jcbinder'], open: tab => EX.load('binder').then(() => window.ExBinder.open(tab)) });
  A.register('ex.clash', { single: true, cmd: ['cardclash', 'clash'], open: arg => EX.load('clash').then(() => window.ExClash.open(arg)) });
  A.addProgram(['JackCards', 'JackCards Binder 99'], 'ex.binder', ICO.binder);
  A.addProgram(['JackCards', 'Card Clash'], 'ex.clash', ICO.clash);
  A.addProgram(['JackCards', 'The Card Korner (web)'], () => EX.go('http://www.cardkorner.kidz/'), ICO.shop);
  A.desktopIcon('JackCards Binder', ICO.binder, () => A.open('ex.binder'), 'exIconBinder');
  const RP = ['Rupees & Rank'];
  A.addProgram([...RP, 'The Card Korner'], () => EX.go('http://www.cardkorner.kidz/'), ICO.shop);
  A.addProgram([...RP, 'JackBay Rupee Auctions'], () => EX.go('http://www.jackbay.webcom/rupees.html'), ICO.bay);
  A.addProgram([...RP, 'Jacktown Town Hall'], () => EX.go('http://www.jacktownhall.jnet/'), ICO.hall);
  A.addProgram([...RP, 'The Mega Masters'], () => EX.go('http://www.megamasters.cyb/'), ICO.cup);
  A.cmd(['cardkorner', 'card korner', 'boosters', 'booster', 'bytebeasties', 'byte beasties'], () => EX.go('http://www.cardkorner.kidz/'));
  A.cmd(['auctions', 'rupeeauctions', 'jackbayrupees'], () => EX.go('http://www.jackbay.webcom/rupees.html'));
  A.cmd(['townhall', 'town hall', 'takings', 'councilhall'], () => EX.go('http://www.jacktownhall.jnet/'));
  A.cmd(['megamasters', 'mega masters', 'tournament', 'cup', 'thecup'], () => EX.go('http://www.megamasters.cyb/'));

  // play a friend: Card Clash rides the Play Together kit (invites, the lobby, "Play with someone..."), and the server
  // pairs the two browsers and runs the game itself
  if (window.MP && MP.game) MP.game('ex.clash', { app: 'ex.clash', name: 'Card Clash (JackCards)', icon: ICO.clash.replace('<svg', '<svg width="16" height="16"'), kind: 'turn', players: '2', max: 2, invite: 'session',
    blurb: 'Byte Beasties card battles: your 15-card deck against theirs, three lanes, ten rounds. Wins pay Rupees and count for the Card Clash League.',
    live: () => { const a = A.apps['ex.clash']; return !!(a && a._w && !a._w.closed); }, open: () => A.open('ex.clash'),
    start: s => { EX.load('clash').then(() => window.ExClash.open({ sess: s })).catch(e => { console.error(e); s.leave(true); }); } });

  // The Odd Jobz Board: our jobs + the Job Centre box load with the jobs themselves
  function hookGrind() {
    if (!window.Grind || Grind._ex) return !!window.Grind;
    Grind._ex = 1;
    const load0 = Grind.load;
    Grind.load = mod => load0(mod).then(r => (mod === 'jobs' || mod === 'games-b' ? A.load('js/ex-jobs.js').then(() => r) : r));
    return true;
  }
  if (!hookGrind()) document.addEventListener('DOMContentLoaded', hookGrind);
  A.cmd(['shelves', 'stackshelves', 'stacking shelves'], () => window.Grind && Grind.job('shelves'));
  A.cmd(['newsletter', 'parishnewsletter', 'parish newsletter'], () => window.Grind && Grind.job('newsletter'));
  A.cmd(['hamster', 'nibbles', 'catchthehamster'] /* 'nibbles': the job's old name */, () => window.Grind && Grind.job('hamster'));
  A.cmd(['errands', 'momserrands', "mom's errands", 'shopping'], () => window.Grind && Grind.job('errands'));

  // ================================================================ secrets
  [['ex.starter', 'Starter Deck', 'Some shops give the first thing away for free'],
    ['ex.pack', 'Rip!', 'Open a packet of trading cards'],
    ['ex.holo', 'Shiny!!!', 'Find a holo in a packet (Rare or better)'],
    ['ex.legend', 'Pulled a Legend', 'Find something truly legendary in a packet'],
    ['ex.binder', 'Nine Pockets a Page', 'Put your cards somewhere safe'],
    ['ex.deck', 'Deck Builder', 'Build a deck of fifteen'],
    ['ex.beatdave', 'Sorry Dave', 'Beat Dave at a card game. (It is not hard.)'],
    ['ex.beatjackk', 'The Other Jack', 'Beat the hardest player on the PC at cards'],
    ['ex.online', 'Duel at Dawn', 'Play cards with a real person over the JackNet'],
    ['ex.sprouts', 'Eat Your Greens', 'Some aliens really do not like sprouts'],
    ['ex.turbo', 'It Does Nothing', 'Press the turbo button. In a card game.'],
    ['ex.back', 'Staff Only', 'Every card shop has a back room'],
    ['ex.list', 'Going Once', 'Put something up for auction for real Rupees'],
    ['ex.bid', 'Paddle Up', 'Bid real Rupees on somebody else\'s loot'],
    ['ex.snipe', 'Anti-Sniper', 'Bid so late that the auctioneer gives everyone extra time'],
    ['ex.baywin', 'Sold! To the Kid at the Back', 'Win a Rupee auction'],
    ['ex.takings', 'Cash in the Till', 'Collect your takings at the Town Hall'],
    ['ex.upgrade', 'Planning Permission', 'Go up in the world (with the council\'s permission)'],
    ['ex.streak', 'Hard Worker', 'Do odd jobs three days in a row'],
    ['ex.jotd', 'Job of the Day', 'Do the job everybody wants done today'],
    ['ex.typo', 'Proof Reader', 'The Reverend\'s typewriter has a secret message in it'],
    ['ex.cup', 'Taking Part', 'Enter a weekly cup'],
    ['ex.cupwin', 'Podium Finish', 'Finish in the top three of a weekly cup'],
  ].forEach(([id, n, h]) => A.defineSecret(id, n, h));

  // ================================================================ little rewards for what the server tells us
  EX.on('exPack', m => {
    if (m.starter) A.secret('ex.starter'); else A.secret('ex.pack');
    const its = m.its || [], top = Math.max(...its.map(x => (window.LootCat && LootCat.ITEM[x.id] ? LootCat.ITEM[x.id].r : 0)), 0);
    if (!m.starter && top >= 2) A.secret('ex.holo');
    if (!m.starter && top >= 4) A.secret('ex.legend');
  });
  EX.on('exClash', m => {
    const d = m && m.d; if (!d || !d.v || d.v.phase !== 'over') return;
    if (d.kind === 'pvp') A.secret('ex.online');
    if (d.v.win === 0 && d.kind === 'cpu' && d.ai === 'dave') A.secret('ex.beatdave');
    if (d.v.win === 0 && d.kind === 'cpu' && d.ai === 'jackk') A.secret('ex.beatjackk');
  });
  EX.on('exBaySold', () => A.secret('ex.list'));
  EX.on('exBayBidOk', m => { A.secret('ex.bid'); if (m.snipe) A.secret('ex.snipe'); });
  EX.on('exTown', m => { if (m.got > 0) A.secret('ex.takings'); if (m.me && m.me.lv > 0) A.secret('ex.upgrade'); });
  EX.on('jobs', m => { if (m && m.streak >= 3) A.secret('ex.streak'); if (m && m.jdone) A.secret('ex.jotd'); });

  // ask for our numbers once we're connected
  if (window.Net) Net.on('welcome', () => setTimeout(() => { if (member()) Net.send({ t: 'exMe' }); }, 1800));
})();

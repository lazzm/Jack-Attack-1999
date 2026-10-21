/* loot: JACKLOOT, the collect-and-trade game that lives all over JackOS (the always-loaded part).
 * The server (mods/loot.js) rolls every item drop and keeps every item; this file:
 *   - loads the catalogue (js/loot-cat.js) and the drawings (js/loot-art.js), plus css/loot.css
 *   - tells the server about the few things only the browser sees (a new web site, a new program, playtime, a Solitaire
 *     win, a Games Cupboard game, new software installed). The server de-duplicates, rate-limits and caps all of them.
 *   - pops the drop balloon (with the rarity shine and a little fanfare), shows parcels and missions
 *   - shows off equipped things: chat name colours, Uh-Oh! flower, JackAmp skin, profiles and Homepagez pages
 *   - registers the Treasure Chest program (js/loot-chest.js) and the www.lootlings.jnet web site (js/loot-web.js)
 * window.Loot: me, item(id), rar(r), pic(id, opts) -> HTML tile, glowCls(id), wearSvg(kind, id), cursor(id), cols(id),
 *   petDef(id), animCol(wearId), on(type, fn) -> off, send(m), open(tab), go(path), ready (Promise). */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.Loot) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  const rp = n => (window.Econ && Econ.rp ? Econ.rp(n) : fmt(n) + (Math.floor(+n || 0) === 1 ? ' Rupee' : ' Rupees')); // plain text money: "1 Rupee", "250 Rupees"
  const member = () => !!(window.Net && Net.me && Net.me.member);
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const STAMP = ((document.querySelector('script[src*="js/loot.js"]') || {}).src || '').split('?v=')[1] || '1';
  { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/loot.css?v=' + STAMP; document.head.appendChild(l); }

  // ================================================================ state + events
  const evs = {};
  const emit = (t, d) => (evs[t] || []).slice().forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  let me = null, cat = null, art = null;
  const pubs = {}; // member name (lower case) -> { name, btn, card } item ids
  const ready = A.load('js/loot-cat.js').then(() => { cat = window.LootCat; return A.load('js/loot-art.js'); }).then(() => { art = window.LootArt; onArt(); }).catch(e => console.error('loot', e));
  const Loot = window.Loot = {
    get me() { return me; }, get cat() { return cat; }, get art() { return art; }, ready,
    item: id => (cat && cat.ITEM[id]) || null,
    rar: r => (cat ? cat.RAR[r] : null),
    on(t, fn) { (evs[t] = evs[t] || []).push(fn); return () => { evs[t] = (evs[t] || []).filter(x => x !== fn); }; },
    emit,
    send: m => !!(window.Net && Net.send(m)),
    glowCls: id => { const it = Loot.item(id); return it ? 'lx-gl' + it.r : ''; },
    // an item tile with its rarity shine: <span class="lx-tile lx-r3"> picture </span>
    pic(id, o) {
      o = o || {}; const it = Loot.item(id); if (!it || !art) return '<span class="lx-tile lx-r0"></span>';
      return `<span class="lx-tile lx-r${it.r} lx-t-${it.type}${o.big ? ' lx-big' : ''}${o.cls ? ' ' + o.cls : ''}" title="${esc(it.name)} (${esc(cat.RAR[it.r].n)})"><span class="lx-art">${art.pic(id)}</span>${it.r >= 3 ? '<i class="lx-spark"></i><i class="lx-spark s2"></i><i class="lx-spark s3"></i>' : ''}${o.serial ? `<em class="lx-ser">#${o.serial}</em>` : ''}${o.n > 1 ? `<b class="lx-cnt">x${o.n}</b>` : ''}</span>`;
    },
    wearSvg: (kind, id) => (art ? art.wearSvg(kind, id) : ''),
    cursor: id => (art ? art.cursor(id) : ''),
    cols: id => (art ? art.cols(id) : null),
    petDef: id => (art ? art.petDef(id) : null),
    animCol: wearId => { const it = String(wearId || '').startsWith('L:') && Loot.item(wearId.slice(2)); return !!(it && it.anim); },
    pubOf: nick => pubs[String(nick || '').toLowerCase()] || null,
    have: id => !!(me && me.it && me.it.some(x => x.id === id)),
    count: id => (me && me.it ? me.it.filter(x => x.id === id).length : 0),
    open: tab => A.open('loot.chest', tab),
    go(path) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } IE.navigate('http://www.lootlings.jnet' + (path || '/')); },
    md: () => (me && me.md) || (window.Desk && Desk.today99 ? Desk.today99().md : 1016),
    fmt, esc, rp,
  };
  function onArt() {
    if (window.Econ && Econ.refresh) Econ.refresh();
    applyMine(); decorateChat(document); emit('art');
    const w = window.Econ && Econ.wearing && Econ.wearing('pet');
    if (w && w.startsWith('L:') && window.EconDesk) EconDesk.pet(w);
  }

  // ================================================================ the wire
  if (window.Net) {
    Net.on('lootMe', m => { if (m.guest) { me = null; } else { const was = me; me = m; if (was && was.par !== m.par && m.par > (was.par || 0)) parcelToast(m.par); } applyMine(); tray(); emit('me', me); });
    Net.on('lootHi', m => { for (const k in pubs) delete pubs[k]; for (const n in m.pub || {}) pubs[n.toLowerCase()] = m.pub[n]; decorateChat(document); emit('pub', null); });
    Net.on('lootPub', m => { const k = String(m.n || '').toLowerCase(); if (m.p) pubs[k] = m.p; else delete pubs[k]; decorateChat(document); emit('pub', m.n); });
    Net.on('lootGot', m => { if (me) for (const x of m.its) if (!me.it.some(y => y.u === x.u)) me.it.push(x); ready.then(() => dropToast(m.its, m.src)); emit('got', m); });
    Net.on('lootParcel', m => { if (me) me.par = m.n; tray(); parcelToast(m.n); emit('me', me); });
    Net.on('lootMis', m => { const was = me && me.mis; if (me) me.mis = m.mis; if (was) m.mis.l.forEach((x, i) => { if (x.done && was.l[i] && !was.l[i].done) ready.then(() => Desk.toast('Mission complete! +' + rp(x.teef), cat.MISS[x.id] ? cat.MISS[x.id].n : 'Daily Mission', 5000)); }); if (m.mis.bonus && was && !was.bonus) Desk.toast('ALL THREE MISSIONS DONE!', 'Bonus Rupees and a bonus item. Pibble is SO proud of you.', 6000); emit('mis', m.mis); });
    Net.on('lootAch', m => { if (me) me.ach[m.id] = Date.now(); ready.then(() => { const a = cat.ACHI[m.id]; if (a) { const b = Desk.toast('\u2605 ACHIEVEMENT! \u2605', `${a.n}: ${a.d}.${a.teef ? ` +${rp(a.teef)}` : ''}`, 6000); if (b) b.classList.add('lx-balloon', 'lx-r2'); } }); emit('ach', m.id); });
    Net.on('lootSet', m => { if (me) me.sets[m.id] = Date.now(); ready.then(() => { const s = cat.SET[m.id]; if (s) { const b = Desk.toast('COLLECTION COMPLETE!', `${s.n}! +${rp(s.teef)}${s.give ? ' and a special prize' : ''}.`, 7000); if (b) b.classList.add('lx-balloon', 'lx-r3'); fanfare(3); } }); A.secret('loot.set'); emit('set', m.id); });
    Net.on('lootErr', m => { if (!(evs.err || []).length) Desk.toast('Lootlings', m.msg, 5000); emit('err', m.msg); });
    Net.on('lootPaid', m => { emit('paid', m); });
    Net.on('lootPaidMe', m => { Desk.toast(`${m.from} sent you ${rp(m.amt)}!`, m.note ? `"${m.note}"` : 'It is in your JackNet Bank account.', 6000); sfx('solve'); emit('paidme', m); });
    Net.on('lootSold', m => { Desk.toast('Sold on the Bazaar!', `${m.to} bought your ${m.n} for ${rp(m.p)} (the Bazaar kept ${fmt(m.fee)}).`, 6000); sfx('solve'); emit('sold', m); });
    Net.on('lootTradeAsk', m => { Desk.toast('Trade request!', `${m.from} wants to trade with you. Open your Treasure Chest > Trading.`, 7000); sfx('join'); });
    Net.on('lootFeed', m => emit('feed', m.e));
    for (const t of ['lootTrade', 'lootTrades', 'lootMkt', 'lootMktCh', 'lootShop', 'lootHof', 'lootDb', 'lootProfile', 'lootDone']) Net.on(t, m => emit(t, m));
    Net.on('loginOk', () => Net.send({ t: 'lootMe' }));
    Net.on('you', m => { if (!m.member) { me = null; applyMine(); tray(); emit('me', null); } });
  }

  // ================================================================ the drop balloon (rarity shine + fanfare)
  const SRC = { JackWorld: 'the JackWorld Catalogue', RoomOfWeek: 'the JackWorld Crew (Room of the Week!)', parcel: 'Daily Parcel', mission: 'Daily Mission', set: 'collection prize', ach: 'achievement prize', combine: 'the Combinator', shop: 'a Lootlings shop', bazaar: 'the Bazaar', trade: 'a trade',
    score: 'a high score', record: 'a RECORD', post: 'a forum post', topic: 'a forum topic', gb: 'writing to Jack', chat: 'chatting', secret: 'finding a secret', cube: "solving the cube", waaagh: 'the WAAAGH!', petcare: 'looking after Gubbinz',
    frag: 'a JRT frag', fragwin: 'winning at JRT', quiz: 'Quiz Night', hpvisit: 'a homepage visitor', site: 'surfing the web', prog: 'trying a program', play: 'playing on the PC', cards: 'Solitaire', cupboard: 'the Games Cupboard', pb: 'a personal best', install: 'installing software' };
  function fanfare(r) {
    if (!window.Sound || !Sound.on || !Sound.note) return;
    const seq = [[523, 659], [523, 659, 784], [523, 659, 784, 1047], [392, 523, 659, 784, 1047], [523, 659, 784, 1047, 1319, 1568], [523, 659, 784, 1047, 1319, 1568, 2093, 1568, 2093]][Math.max(0, Math.min(5, r))];
    seq.forEach((f, i) => setTimeout(() => { try { Sound.note(f, r >= 4 ? 0.16 : 0.1, r >= 3 ? 'triangle' : 'square'); } catch (e) {} }, i * (r >= 4 ? 110 : 90)));
  }
  function dropToast(its, src) {
    if (!its || !its.length || !cat) return;
    const x = its[0], it = cat.ITEM[x.id]; if (!it) return;
    if (src === 'trade' || src === 'bazaar') return; // you knew it was coming
    const R = cat.RAR[it.r], from = SRC[src] || 'somewhere';
    const b = Desk.toast(`${it.r >= 4 ? '!!! ' : ''}${R.n.toUpperCase()} ITEM FOUND${it.r >= 4 ? ' !!!' : '!'}`, `${it.name}${x.s ? ` (#${x.s} of ${it.lim})` : ''}, from ${from}. It's in your Treasure Chest.`, it.r >= 3 ? 8000 : 5500);
    if (b) {
      b.classList.add('lx-balloon', 'lx-r' + it.r);
      const p = document.createElement('span'); p.className = 'lx-bpic'; p.innerHTML = Loot.pic(x.id); b.insertBefore(p, b.firstChild);
      b.addEventListener('click', () => Loot.open('stuff'));
    }
    fanfare(it.r);
    A.secret('loot.firstdrop'); if (it.r >= 4) A.secret('loot.legend'); if (it.r === 5) A.secret('loot.jackpot');
    const t = $('lxTray'); if (t) { t.classList.remove('lx-pop'); void t.offsetWidth; t.classList.add('lx-pop'); }
  }
  let lastParcelToast = 0;
  function parcelToast(n) { if (!n || Date.now() - lastParcelToast < 60000) return; lastParcelToast = Date.now(); const b = Desk.toast('Knock knock! The postman has been!', `There ${n === 1 ? 'is a Daily Parcel' : 'are ' + n + ' Daily Parcels'} waiting for you. Open your Treasure Chest to unwrap ${n === 1 ? 'it' : 'them'}!`, 7000); if (b) { b.classList.add('lx-balloon', 'lx-r1'); b.addEventListener('click', () => Loot.open('parcels')); } sfx('join'); }

  // ================================================================ the tray: a little treasure chest (with a parcel count)
  const CHEST = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 14h26v15H3z" fill="#a0642a" stroke="#000"/><path d="M3 14c0-6 4-9 13-9s13 3 13 9z" fill="#c8843a" stroke="#000"/><path d="M3 14h26" stroke="#000"/><path d="M8 6.6V29M24 6.6V29" stroke="#ffd400" stroke-width="2.4"/><path d="M8 6.6V29M24 6.6V29" stroke="#000" stroke-width=".5" fill="none"/><rect x="13" y="12" width="6" height="7" fill="#ffd400" stroke="#000"/><circle cx="16" cy="15" r="1.2"/><path d="M16 15v2.4" stroke="#000"/></svg>';
  const CHEST16 = CHEST.replace('<svg ', '<svg width="16" height="16" ');
  function tray() {
    let b = $('lxTray');
    if (!me) { if (b) b.remove(); return; } // guests (and before a member's chest arrives): one less icon in a crowded tray
    if (!b) {
      const t = $('tray'), ref = $('ecTray') || $('clock'); if (!t || !ref) return;
      b = document.createElement('button'); b.id = 'lxTray'; b.type = 'button';
      t.insertBefore(b, ref);
      b.addEventListener('click', () => { sfx('click'); Loot.open(me && me.par ? 'parcels' : 'stuff'); });
      b.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu([{ label: 'Treasure Chest', act: () => Loot.open('stuff') }, { label: 'Open Daily Parcel', dis: !(me && me.par), act: () => Loot.open('parcels') }, { label: 'Daily Missions', act: () => Loot.open('missions') }, '-', { label: 'www.lootlings.jnet', act: () => Loot.go('/') }, { label: 'The Bazaar', act: () => Loot.go('/bazaar.html') }, { label: 'Trading Post', act: () => Loot.open('trade') }], ev.clientX, ev.clientY - 10); });
    }
    const n = me ? me.par : 0;
    b.innerHTML = CHEST + (n ? `<b class="lx-trayn">${n}</b>` : '');
    b.title = me ? `Treasure Chest: ${me.it.length} thing${me.it.length === 1 ? '' : 's'}${n ? `, ${n} parcel${n > 1 ? 's' : ''} to open!` : ''}` : 'JackLoot Treasure Chest (join JackNet to collect things!)';
    b.setAttribute('aria-label', b.title);
  }

  // ================================================================ what you have on: JackAmp skin, Uh-Oh! flower (the rest is in js/apps-econ.js)
  let flowerCss = null;
  function eqItem(slot) { if (!me || !me.lw || !me.lw[slot]) return null; const x = me.it.find(y => y.u === me.lw[slot]); return x ? Loot.item(x.id) : null; }
  function applyMine() {
    if (!art) return;
    const W = me ? { amp: eqItem('amp'), flower: eqItem('flower') } : store.get('jhp_loot_look', {});
    const ampId = me ? (W.amp && W.amp.id) || '' : W.amp || '', flId = me ? (W.flower && W.flower.id) || '' : W.flower || '';
    if (me) store.set('jhp_loot_look', { amp: ampId, flower: flId });
    const bs = document.body.style, vars = art.amp(ampId);
    for (const k of ['--lxa-body', '--lxa-disp', '--lxa-txt', '--lxa-btn']) { if (vars) bs.setProperty(k, vars[k]); else bs.removeProperty(k); }
    document.body.toggleAttribute('data-lxamp', !!vars);
    document.body.classList.toggle('lx-amphue', !!(vars && Loot.item(ampId).anim));
    if (!flowerCss) { flowerCss = document.createElement('style'); flowerCss.id = 'lxFlowerCss'; document.head.appendChild(flowerCss); }
    const f = art.flower(flId), fit = Loot.item(flId);
    flowerCss.textContent = f ? `#iconUhOh svg, .uh-flower, #uhTray svg { filter: ${f}; }${fit && fit.anim ? ' #iconUhOh svg { animation: lxHue 4s linear infinite; }' : ''}` : '';
    if (me) decorateChat(document);
  }

  // ================================================================ showing off: chat names, profiles, homepages
  function nameFor(nick) { const k = String(nick || '').toLowerCase(); const p = pubs[k] || (me && Net.me && k === String(Net.me.nick).toLowerCase() && eqItem('name') ? { name: eqItem('name').id } : null); return p && p.name ? Loot.item(p.name) : null; }
  function decorateChat(root) {
    if (!art) return;
    (root.querySelectorAll ? root : document).querySelectorAll('#chatLog .plink[data-profile], .ir-log .ir-nk, .lx-name[data-nick]').forEach(a => {
      const it = nameFor(a.dataset.profile || a.dataset.nick || a.textContent.replace(/^[@+]/, '')), v = it ? it.id : '';
      if (a.dataset.lxn === v) return; a.dataset.lxn = v;
      if (!it) { a.classList.remove('lx-nm', 'lx-nmanim'); a.style.cssText = a.dataset.lxcss || a.style.cssText; return; }
      if (a.dataset.lxcss === undefined) a.dataset.lxcss = a.getAttribute('style') || '';
      a.setAttribute('style', art.nameStyle(it.id)); a.classList.add('lx-nm'); a.classList.toggle('lx-nmanim', !!it.anim);
    });
  }
  const chatMO = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) decorateChat(n.parentNode || n); });
  function watchChat() {
    const log = $('chatLog'); if (log) chatMO.observe(log, { childList: true });
    // JackIRC windows (#jackattack moved there): watch their logs too
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('appwin')) setTimeout(() => { if (n.querySelector('.ir-log')) { chatMO.observe(n, { childList: true, subtree: true }); decorateChat(n); } }, 50); }).observe(document.body, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchChat); else watchChat();
  // a little showcase box: on JackNet profiles and at the bottom of Homepagez pages
  const want = {}; // name -> [elements waiting]
  function showcase(el, name, kind) {
    const k = String(name).toLowerCase(); (want[k] = want[k] || []).push({ el, kind });
    Net.send({ t: 'lootProfile', name });
  }
  Loot.on('lootProfile', m => {
    const k = String(m.name || '').toLowerCase(), list = want[k]; if (!list) return; delete want[k];
    ready.then(() => { for (const { el, kind } of list) if (el.isConnected) el.innerHTML = showcaseHtml(m, kind); });
  });
  function showcaseHtml(m, kind) {
    if (m.none) return kind === 'hp' ? '' : `<div class="lx-show lx-show-none"><b>JackLoot Treasure Chest:</b> empty so far! <a href="#" data-lxgo="/">What's JackLoot?</a></div>`;
    const btn = m.pub && m.pub.btn && Loot.item(m.pub.btn) ? art.btn(m.pub.btn) : '', card = m.pub && m.pub.card && Loot.item(m.pub.card) ? `<span class="lx-favcard lx-r${Loot.item(m.pub.card).r}">${art.card(m.pub.card)}</span>` : '';
    if (kind === 'hp') return `<div class="lx-hpstrip">${btn ? `<span class="lx-hpbtn lx-gl${Loot.item(m.pub.btn).r}">${btn}</span>` : ''}${m.top.slice(0, 4).map(x => Loot.pic(x.id, { serial: x.s })).join('')}<span class="lx-hpsc">~${esc(m.name)}'s collection: <b>${fmt(m.score)}</b> points &middot; <a href="http://www.lootlings.jnet/museum.html">Lootlings</a></span></div>`;
    return `<div class="lx-show"><div class="lx-showh"><b>${CHEST16} JackLoot Collection</b> <span>${fmt(m.u)} different things &middot; ${m.sets.length} set${m.sets.length === 1 ? '' : 's'} &middot; <b>${fmt(m.score)}</b> points</span></div><div class="lx-showrow">${card}<div class="lx-showtop">${m.top.map(x => Loot.pic(x.id, { serial: x.s })).join('')}</div></div>${btn ? `<div class="lx-showbtn lx-gl${Loot.item(m.pub.btn).r}">${btn}</div>` : ''}<div class="lx-rarbar">${m.per.map((n, r) => n ? `<span class="lx-rb lx-rb${r}" title="${cat.RAR[r].n}">${n} ${cat.RAR[r].n}</span>` : '').join('')}</div></div>`;
  }
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-lxgo]'); if (!a) return; ev.preventDefault(); Loot.go(a.dataset.lxgo); });
  if (window.Net) {
    Net.on('profile', m => { const p = m && m.p; if (!p) return; setTimeout(() => { const box = document.querySelector('#s-members .profile'); if (!box || box.querySelector('.lx-showwrap')) return; const w = document.createElement('div'); w.className = 'lx-showwrap'; const head = box.querySelector('.phead'); if (head && head.nextSibling) box.insertBefore(w, head.nextSibling); else box.appendChild(w); showcase(w, p.name, 'profile'); }, 30); });
    Net.on('hpzPage', m => { if (!m || !m.page || !m.n) return; setTimeout(() => { document.querySelectorAll('.hpz-page:not(.hpz-edit) .hpz-foot').forEach(f => { if (f.querySelector('.lx-hpwrap')) return; const w = document.createElement('div'); w.className = 'lx-hpwrap'; f.insertBefore(w, f.firstChild); showcase(w, m.n, 'hp'); }); }, 60); });
  }

  // ================================================================ telling the server what happened (only things it cannot see itself)
  const evq = []; let evT = 0;
  function report(k, id) { if (!member()) return; evq.push({ t: 'lootEv', k, id: id || '' }); if (!evT) evT = setTimeout(flush, 800); }
  function flush() { evT = 0; const m = evq.shift(); if (m) Net.send(m); if (evq.length) evT = setTimeout(flush, 1100); }
  Loot.report = report;
  // a new web site (once per site, ever: the server keeps the list, this just saves it the bother)
  const seenSites = new Set(store.get('jhp_loot_sites', []));
  document.addEventListener('section', e => {
    const d = String(e.detail || ''); if (!d.startsWith('site:')) return;
    const host = d.slice(5).split('/')[0].toLowerCase(); if (!host) return;
    if (host === 'www.lootlings.jnet') A.secret('loot.site');
    if (!member() || seenSites.has(host)) return;
    seenSites.add(host); store.set('jhp_loot_sites', [...seenSites].slice(-3000)); report('site', host);
  });
  // a program opened for the first time
  const seenProgs = new Set(store.get('jhp_loot_progs', []));
  const open0 = A.open;
  A.open = function (id) { const w = open0.apply(this, arguments); try { if (w && member() && typeof id === 'string' && !seenProgs.has(id)) { seenProgs.add(id); store.set('jhp_loot_progs', [...seenProgs].slice(-1000)); report('prog', id); } } catch (e) {} return w; };
  // new software installed (JackNet Software Centre / Shareware Shack, js/setup.js)
  document.addEventListener('setup', ev => { const d = ev.detail || {}; if (d.on && d.id) report('install', String(d.id).toLowerCase().replace(/[^a-z0-9_.:-]/g, '').slice(0, 40)); });
  // Solitaire wins and Games Cupboard plays (their saves go through Apps.store)
  const set0 = store.set;
  store.set = function (k, v) {
    try {
      if (k === 'jhp_sol_stats' && v && typeof v === 'object') { const was = store.get(k, {}); if ((v.won | 0) > (was.won | 0)) report('cards', 'sol'); }
      else if (k === 'jhp_discs' && v && v.n && typeof v.n === 'object') { const was = store.get(k, {}), sum = o => Object.values(o || {}).reduce((q, x) => q + (+x || 0), 0); if (sum(v.n) > sum(was.n)) report('cupboard', 'disc'); }
    } catch (e) {}
    return set0.apply(this, arguments);
  };
  // playtime: every 5 minutes that you're actually doing things on the PC
  let lastIn = 0, mins = 0;
  for (const t of ['pointerdown', 'keydown', 'wheel']) addEventListener(t, () => { lastIn = Date.now(); }, { passive: true, capture: true });
  setInterval(() => { if (!member() || document.hidden || Date.now() - lastIn > 60000) return; if (++mins >= 5) { mins = 0; report('play'); } }, 60000);

  // ================================================================ the Treasure Chest program + the Lootlings web site
  A.register('loot.chest', { single: true, cmd: ['loot', 'chest', 'treasure', 'treasurechest', 'mystuff', 'jackloot'], open(tab) {
    const box = document.createElement('div'); box.className = 'lx-chest lx-loading'; box.textContent = 'Opening the Treasure Chest...';
    const w = A.win('Treasure Chest - JackLoot', box, { w: 720, h: 520, icon: CHEST, menubar: true, status: true, minW: 300, minH: 260 });
    Promise.all([ready, A.load('js/loot-chest.js')]).then(() => { if (!w.closed && window.LootChest) LootChest.mount(w, box, tab); }).catch(() => { box.textContent = 'The Treasure Chest is stuck. (Try again in a minute.)'; });
    A.secret('loot.chest');
    return w;
  } });
  A.desktopIcon('Treasure Chest', CHEST, () => A.open('loot.chest'), 'lxDeskChest');
  A.addProgram(['JackLoot', 'Treasure Chest'], 'loot.chest', CHEST);
  A.addProgram(['JackLoot', 'Lootlings Web Site'], () => Loot.go('/'), CHEST);
  A.addProgram(['JackLoot', 'The Bazaar'], () => Loot.go('/bazaar.html'), CHEST);
  A.addProgram(['JackLoot', 'Daily Missions'], () => A.open('loot.chest', 'missions'), CHEST);
  A.cmd(['lootlings', 'lootlings.jnet', 'bazaar'], () => Loot.go('/'));
  A.cmd(['museum', 'hall of fame'], () => Loot.go('/museum.html'));
  A.cmd(['snorb'], () => { A.secret('loot.snorb'); Desk.msgbox('Snorb', '*sniff sniff*\n\nThe Snorb sniffs your computer all over and says: "Ooh! Loot! There is loot EVERYWHERE on here. Go and play and you will find it!"\n\n(Snorbs are never wrong about loot. They are wrong about everything else.)', 'info'); });
  A.cmd(['lootbox', 'loot box', 'buy lootbox', 'mystery box'], () => { A.secret('loot.nobox'); Desk.msgbox('Lootlings', "NO MYSTERY BOXES HERE!\n\nOn Lootlings you can never pay Rupees for a random box. Random things only come from playing. Rupees buy exactly the thing you pick, and you can see it before you buy it.\n\n(Pibble's Mom says mystery boxes are gambling. Pibble's Mom is right.)", 'info'); });
  // the web site: pages fill themselves once js/loot-web.js has loaded
  const HOST = 'www.lootlings.jnet', PAGES = {};
  let live = null;
  function leave() { if (!live) return; for (const f of live.offs) try { f(); } catch (e) { console.error(e); } live = null; }
  document.addEventListener('section', e => { const d = String(e.detail || ''); if (!live || d !== 'site:' + HOST + live.path) leave(); });
  const page = path => () => {
    leave();
    const el = document.createElement('div'); el.className = 'lxw lxw-load';
    el.innerHTML = `<div class="lxw-loading"><p>Contacting host: <b>${HOST}</b>...<br>Host contacted. Waiting for reply...</p></div>`;
    const L = live = { path, el, offs: [] };
    Promise.all([ready, A.load('js/loot-web.js')]).then(() => { if (live === L && window.LootWeb) LootWeb.render(path, el, L); })
      .catch(() => { el.className = 'lxw lxw-err'; el.innerHTML = `<h2>The page cannot be displayed</h2><p>The server at <b>${HOST}</b> is not answering. A Snorb might have eaten the cable. Try <b>Refresh</b>.</p>`; });
    return el;
  };
  const addPage = p => { PAGES[p] = { title: 'Lootlings! Collect, Trade, Show Off', html: page(p) }; };
  ['/', '/news.html', '/items.html', '/shops.html', '/bazaar.html', '/sell.html', '/trading.html', '/collections.html', '/museum.html', '/top.html', '/missions.html', '/creatures.html', '/help.html', '/parents.html'].forEach(addPage);
  if (window.IE && IE.addSite) IE.addSite(HOST, { title: 'Lootlings!', pages: PAGES });
  ready.then(() => { if (!cat) return; for (const k in cat.SHOPS) addPage('/shop/' + k + '.html'); for (const t of cat.TYPE_ORDER) addPage('/items/' + t + '.html'); for (const it of cat.ITEMS) addPage('/item/' + it.id + '.html'); });
  Loot.page = () => live;

  // ================================================================ files + secrets
  A.fs.add('C:/My Documents/Rupees', { name: 'LOOTLINGS.TXT', type: 'txt', date: '16/10/99', size: '2 KB', text: `LOOTLINGS!  (www.lootlings.jnet)
=========
Dave says EVERYONE at school is on this. It's a web site where little
creatures called Lootlings (Snorbs, Pibbles, Grumplets...) dig up LOOT.

* You find things just by doing stuff: games, high scores, forums,
  surfing, secrets, Quiz Night, JackReal Tournament, even feeding Gubbinz.
* The postman brings a free Daily Parcel the first time you log on each day.
* Every item has a RARITY:  Common (grey)  Uncommon (green)  Rare (blue)
  Epic (purple)  Legendary (gold)  and JACKPOT (rainbow!!!). The rarer it
  is, the more it shines. Limited ones have serial numbers, like "#3 of 50".
* Wear stuff! Hats, pointers, wallpapers, window colours, a Lootling for
  the taskbar, JackAmp skins, a shiny name in the Chat Room...
* Swap things at the Trading Post, or sell them on the Bazaar for Rupees.
* Five of one rarity -> the Combinator makes ONE of the next rarity
  (and YOU pick which). Or recycle junk for a few Rupees.
* Collect whole sets for big prizes.

You can't buy mystery boxes. Mom checked. Good.

Treasure Chest: on the desktop, or Start > Programs > JackLoot.
` });
  [
    ['chest', 'Treasure hunter', 'Open the chest on the desktop'],
    ['site', 'Lootling spotter', 'Visit the web site where the critters dig up loot'],
    ['firstdrop', 'Finders keepers', 'Find your very first item'],
    ['parcel', 'Special delivery', 'Open something the postman brought'],
    ['legend', 'Gold rush', 'Find something Legendary'],
    ['jackpot', 'JACKPOT!!!', 'Find something with every colour at once'],
    ['set', 'The full set', 'Complete a collection'],
    ['combine', 'Mad scientist', 'Turn five things into one better thing'],
    ['recycle', 'Reduce, reuse...', 'Recycle something'],
    ['trade', 'Fair swap', 'Swap something with another member'],
    ['bazaar', 'Bargain hunter', 'Buy something another member is selling'],
    ['sell', 'Market trader', 'Put something up for sale'],
    ['pay', 'Generous', 'Send Rupees to a friend'],
    ['shop', 'Window shopping', 'Buy something from a critter'],
    ['museum', 'Museum visit', 'Look at the rarest things on JackNet'],
    ['snorb', 'Sniff sniff', 'Type the name of a blue critter in Run'],
    ['nobox', 'No mystery here', 'Try to buy a mystery box'],
    ['eclipse', 'Never look at the Sun', 'Read the news from 11 August on the critters\' site'],
    ['grumpy', 'Cheer up!', 'Make the green critter smile'],
    ['mascot', 'Ticklish', 'Tickle the mascot on the critters\' home page'],
    ['missions', 'Busy bee', 'Finish all three Daily Missions'],
    ['equip', 'Dressed to impress', 'Wear something you found'],
  ].forEach(([id, n, h]) => A.defineSecret('loot.' + id, n, h));

  tray();
  if (window.Net && Net.connected && member()) Net.send({ t: 'lootMe' });
})();

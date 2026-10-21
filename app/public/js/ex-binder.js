/* ex-binder: JACKCARDS BINDER 99 (a download from www.cardkorner.kidz). A proper nine-pocket binder for every JackCard
 * you own (Series Two Byte Beasties, then Series One), the deck builder for Card Clash, and your unopened packets. */
(function () {
  'use strict';
  if (window.ExBinder) return;
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, store = A.store;
  const PER = 9;
  let W = null;
  // every card in binder order: Byte Beasties 1-38, then Series One 1-30
  const ORDER = () => X.CARDS.map(c => c.id).concat(window.LootCat ? LootCat.ITEMS.filter(i => i.type === 'card' && !i.x2 && i.art && i.art[0] < 100).sort((a, b) => a.art[0] - b.art[0]).map(i => i.id) : []);
  const noOf = id => (X.CARD[id] ? X.CARD[id].no : (K.item(id) || { art: [0] }).art[0]);
  const free = () => (K.chest() || []).filter(x => !x.lk && X.BATTLE[x.id]); // cards that can go in a deck

  function open(tab) {
    if (W && !W.closed) { W.restore(); if (tab) W._tab(tab); return W; }
    A.secret('ex.binder');
    const draft = store.get('jhp_ex_deckdraft', null); // an unsaved deck survives a refresh
    const S = { tab: tab || store.get('jhp_ex_btab', 'binder'), page: store.get('jhp_ex_bpage', 0) | 0, sel: '', deck: Array.isArray(draft) ? draft.slice(0, X.DECK.size) : null, filt: 'all', dirty: Array.isArray(draft), msg: '' };
    const box = document.createElement('div'); box.className = 'exb';
    const w = W = A.win('JackCards Binder 99', box, { w: 700, h: 560, icon: EX.ICO.binder, menubar: true, status: true, minW: 300, minH: 320 });
    if (innerWidth < 640) w.el.classList.add('maxwin');
    A.menubar(w, [
      ['File', [{ label: 'Play Card Clash...', act: () => A.open('ex.clash') }, { label: 'The Card Korner (buy packets)', act: () => EX.go('http://www.cardkorner.kidz/') }, { label: 'Sell on JackBay...', act: () => EX.go('http://www.jackbay.webcom/rupeesell.html') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['View', () => [['binder', 'Binder'], ['deck', 'Deck Builder'], ['packs', 'Packets']].map(([k, l]) => ({ label: l, rad: S.tab === k, act: () => go(k) }))],
      ['Help', [{ label: 'How to play Card Clash', act: () => EX.go('http://www.cardkorner.kidz/rules.html') }, { label: 'The Checklist (web)', act: () => EX.go('http://www.cardkorner.kidz/checklist.html') }, '-', { label: 'About JackCards Binder 99', act: () => Desk.msgbox('About JackCards Binder 99', 'JackCards Binder 99 version 1.2\n\nFree from ' + (window.Cast ? Cast.n('shop') + '\'s ' : 'the ') + 'Card Korner.\n\nNine pockets a page, just like the real thing (but the cards never get bent).\n\nNo cards were blown on in the making of this program.', 'info') }]],
    ]);
    const go = t => { S.tab = t; S.sel = ''; store.set('jhp_ex_btab', t); draw(); };
    w._tab = go;
    const status = () => {
      const have = K.owned(), two = X.CARDS.filter(c => have.get(c.id)).length, ord = ORDER(), one = ord.filter(id => !X.CARD[id] && have.get(id)).length;
      if (w.status) w.status.textContent = EX.member ? `Byte Beasties ${two}/${X.CARDS.length} | Series One ${one}/${ord.length - X.CARDS.length} | Deck ${(S.deck || (EX.me && EX.me.deck) || []).length}/${X.DECK.size} | Unopened packets: ${EX.me ? EX.me.packs : 0}` : 'Not logged on to JackNet';
    };
    function tabs() { return `<div class="exb-tabs" role="tablist">${[['binder', 'Binder'], ['deck', 'Deck Builder'], ['packs', 'Packets' + (EX.me && EX.me.packs ? ` <span class="exb-badge">${EX.me.packs}</span>` : '')]].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`; }
    function draw() {
      if (w.closed) return;
      const body = !EX.member ? guest() : S.tab === 'deck' ? deck() : S.tab === 'packs' ? packs() : binder();
      box.innerHTML = tabs() + `<div class="exb-body">${body}</div>`;
      box.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
      wire(); status();
      store.set('jhp_ex_deckdraft', S.dirty && S.deck ? S.deck : null);
    }
    const guest = () => `<div class="exb-guest"><h3>Your binder is empty</h3><p>JackCards live in your JackNet Treasure Chest, so you need to be logged on to see them. Members get a <b>free starter deck</b> at The Card Korner!</p><p><button class="btn" data-join>Log on / Join JackNet</button> <button class="btn" data-web="http://www.cardkorner.kidz/">The Card Korner</button></p><p>You can still play <b>Card Clash</b> with the shop's loaner deck: <button class="btn" data-clash>Play Card Clash</button></p></div>`;

    // ---------------------------------------------------------------- the binder (two pages side by side, or one on a phone)
    function binder() {
      const ord = ORDER(), have = K.owned(), pages = Math.ceil(ord.length / PER), two = box.clientWidth > 560;
      const per = two ? 2 : 1; S.page = Math.max(0, Math.min(pages - 1, S.page - (two ? S.page % 2 : 0)));
      const pg = p => { const ids = ord.slice(p * PER, p * PER + PER); const s1 = ids.length && !X.CARD[ids[0]]; return `<div class="exb-page"><div class="exb-ph">${s1 ? 'SERIES ONE' : 'BYTE BEASTIES'} &middot; page ${p + 1}</div><div class="exb-pockets">${ids.map(id => { const n = have.get(id) | 0, it = K.item(id); return n ? `<button type="button" class="exb-pk${S.sel === id ? ' sel' : ''}" data-sel="${id}" title="${esc(it.name)}">${K.tile(id, { n })}</button>` : `<span class="exb-pk exb-empty"><b>#${noOf(id)}</b><small>${X.CARD[id] ? esc(X.EL[X.CARD[id].el].n) : 'Series One'}</small></span>`; }).join('')}${'<span class="exb-pk exb-blank"></span>'.repeat(PER - ids.length)}</div></div>`; };
      let h = `<div class="exb-spread">${pg(S.page)}${per === 2 && S.page + 1 < pages ? pg(S.page + 1) : ''}</div>`;
      h += `<div class="exb-nav"><button class="btn" data-pg="-1"${S.page <= 0 ? ' disabled' : ''}>&lt; Back</button><span>Pages ${S.page + 1}${per === 2 && S.page + 1 < pages ? '-' + (S.page + 2) : ''} of ${pages}</span><button class="btn" data-pg="1"${S.page + per >= pages ? ' disabled' : ''}>Next &gt;</button></div>`;
      if (S.sel) h += detail(S.sel, have.get(S.sel) | 0);
      return h;
    }
    function detail(id, n) {
      const it = K.item(id), c = X.CARD[id], d = X.BATTLE[id]; if (!it) return '';
      const inDeck = (S.deck || (EX.me && EX.me.deck) || []).filter(u => (K.chest().find(x => x.u === u) || {}).id === id).length;
      const rules = !d ? 'Not used in Card Clash.' : d.kind === 'g' ? `<b>Gadget</b> (costs ${d.cost}): ${esc(d.txt)}` : `<b>Beast</b>: costs ${d.cost}, Attack ${d.atk}, Hit Points ${d.hp}, ${esc(X.EL[d.el].n)}${d.ab ? `. <b>${esc(X.AB[d.ab][0])}:</b> ${esc(X.AB[d.ab][1])}` : '.'}`;
      return `<div class="exb-det"><div class="exb-big">${K.pic(id)}</div><div><h3>${esc(it.name)}</h3><p><b style="color:${K.RCOL[it.r]}">${K.RN[it.r]}</b> &middot; ${c ? `Byte Beasties #${c.no}` : `Series One #${noOf(id)}`}${it.lim ? ` &middot; limited to ${it.lim}` : ''}</p><p>${rules}</p><p><i>"${esc(it.d)}"</i></p><p>You have <b>${n}</b>${inDeck ? ` (${inDeck} in your deck)` : ''}.</p><p class="row" style="gap:6px;flex-wrap:wrap">${d ? '<button class="btn" data-add="' + id + '">Add to my deck</button>' : ''}<button class="btn" data-web="http://www.jackbay.webcom/rupeesell.html">Sell one on JackBay...</button><button class="btn" data-x>Close</button></p></div></div>`;
    }

    // ---------------------------------------------------------------- the deck builder
    function deckNow() { if (!S.deck) S.deck = ((EX.me && EX.me.deck) || []).slice(); const ok = new Set(free().map(x => x.u)); S.deck = S.deck.filter(u => ok.has(u)); return S.deck; }
    const deckIds = () => deckNow().map(u => (K.chest().find(x => x.u === u) || {}).id).filter(Boolean);
    function rule(ids) {
      const n = {}; let g = 0;
      for (const id of ids) { const d = X.BATTLE[id], it = K.item(id); n[id] = (n[id] | 0) + 1; if (d.kind === 'g') g++; if (n[id] > (it.r >= X.DECK.oneOf ? 1 : X.DECK.copies)) return `Only ${it.r >= X.DECK.oneOf ? 'one' : X.DECK.copies} "${it.name}" allowed.`; }
      if (g > X.DECK.gadgetsMax) return `Up to ${X.DECK.gadgetsMax} gadgets.`;
      if (ids.length > X.DECK.size) return `${X.DECK.size} cards at most.`;
      return '';
    }
    function deck() {
      const D = deckNow(), ids = deckIds(), pool = new Map();
      for (const x of free()) { if (D.includes(x.u)) continue; if (!pool.has(x.id)) pool.set(x.id, []); pool.get(x.id).push(x.u); }
      const curve = [0, 0, 0, 0, 0, 0, 0]; for (const id of ids) curve[Math.min(6, X.BATTLE[id].cost)]++;
      const ok = (id) => { const d = X.BATTLE[id]; return S.filt === 'all' || (S.filt === 'g' ? d.kind === 'g' : d.kind === 'b' && d.el === S.filt); };
      const list = [...pool.keys()].filter(ok).sort((a, b) => X.BATTLE[a].cost - X.BATTLE[b].cost || (K.item(a).name > K.item(b).name ? 1 : -1));
      return `<div class="exb-deck"><div class="exb-dl"><div class="exb-dh"><b>My deck: ${D.length}/${X.DECK.size}</b>${S.dirty ? ' <span class="exb-unsaved">(not saved)</span>' : ''}</div>
        <div class="exb-dlist">${D.map(u => { const x = K.chest().find(y => y.u === u); return x ? `<button type="button" class="exb-dc" data-rm="${u}" title="Take out">${K.tile(x.id)}</button>` : ''; }).join('')}${'<span class="exb-dc exb-dslot"></span>'.repeat(Math.max(0, X.DECK.size - D.length))}</div>
        <div class="exb-curve" title="How many cards of each cost">${curve.map((n, c) => `<span><i style="height:${Math.min(100, n * 18)}%"></i><b>${c}${c === 6 ? '+' : ''}</b></span>`).join('')}</div>
        <p class="exb-rule">${esc(S.msg || rule(ids) || (D.length < X.DECK.size ? `Add ${X.DECK.size - D.length} more (empty spaces are filled with loaner cards in a game).` : 'Ready to clash!'))}</p>
        <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn" data-save${S.dirty ? '' : ' disabled'}><b>Save deck</b></button><button class="btn" data-auto>Build one for me</button><button class="btn" data-clear>Empty it</button><button class="btn" data-clash>Play Card Clash</button></div></div>
        <div class="exb-dr"><div class="exb-filt">${[['all', 'All'], ...X.EL_ORDER.map(e => [e, X.EL[e].n]), ['g', 'Gadgets']].map(([k, l]) => `<button type="button" class="btn${S.filt === k ? ' on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
        <div class="exb-pool">${list.map(id => `<button type="button" class="exb-pc" data-in="${id}" title="Add ${esc(K.item(id).name)}">${K.tile(id, { n: pool.get(id).length })}</button>`).join('') || '<p class="exb-none">No spare cards here. Get more at The Card Korner!</p>'}</div></div></div>`;
    }
    function autoDeck() {
      const pool = free().slice().sort((a, b) => { const da = X.BATTLE[a.id], db = X.BATTLE[b.id], va = da.kind === 'b' ? da.atk + da.hp + (da.ab ? 1.5 : 0) - da.cost * 0.9 : 1.5 - da.cost * 0.3, vb = db.kind === 'b' ? db.atk + db.hp + (db.ab ? 1.5 : 0) - db.cost * 0.9 : 1.5 - db.cost * 0.3; return vb - va + (K.item(b.id).r - K.item(a.id).r) * 0.3; });
      const out = [], ids = [], want = [3, 4, 3, 2, 2, 1], have = [0, 0, 0, 0, 0, 0]; // a gentle curve: cheap stuff first
      for (const pass of [0, 1]) for (const x of pool) {
        if (out.length >= X.DECK.size) break; if (out.includes(x.u)) continue;
        const d = X.BATTLE[x.id], c = Math.min(5, Math.max(0, d.cost - 1)), g = d.kind === 'g' && ids.filter(i => X.BATTLE[i].kind === 'g').length >= 3;
        if (g || (pass === 0 && have[c] >= want[c])) continue;
        if (rule(ids.concat(x.id))) continue;
        out.push(x.u); ids.push(x.id); have[c]++;
      }
      return out;
    }

    // ---------------------------------------------------------------- packets
    function packs() {
      const n = EX.me ? EX.me.packs : 0;
      return `<div class="exb-packs"><div class="exb-ptop">${n ? ExArt.pack({ face: 'card.x2_glorp' }) : ''}<div><h3>${n ? `You have ${n} unopened packet${n > 1 ? 's' : ''}!` : 'No unopened packets'}</h3><p>${n ? 'Each one has five Byte Beasties in it: three Common, one Uncommon and one Rare or better.' : 'Buy Byte Beasties boosters at The Card Korner (five a day). Every JackNet member gets a free starter deck there too.'}</p><p class="row" style="gap:6px;flex-wrap:wrap">${n ? '<button class="btn exb-rip" data-open><b>RIP ONE OPEN!</b></button>' : ''}<button class="btn" data-web="http://www.cardkorner.kidz/">The Card Korner...</button></p></div></div><div class="exb-rev"></div></div>`;
    }

    function wire() {
      const on = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.addEventListener('click', ev => fn(b, ev)));
      on('[data-join]', () => { if (window.JackLogon) JackLogon.show(); });
      on('[data-web]', b => EX.go(b.dataset.web));
      on('[data-clash]', () => A.open('ex.clash'));
      on('[data-pg]', b => { const two = box.clientWidth > 560; S.page += (+b.dataset.pg) * (two ? 2 : 1); store.set('jhp_ex_bpage', S.page); S.sel = ''; EX.sfx('turn'); draw(); });
      on('[data-sel]', b => { S.sel = S.sel === b.dataset.sel ? '' : b.dataset.sel; draw(); const d = box.querySelector('.exb-det'); if (d) d.scrollIntoView({ block: 'nearest' }); });
      on('[data-x]', () => { S.sel = ''; draw(); });
      on('[data-add]', b => { const id = b.dataset.add, D = deckNow(), x = free().find(y => y.id === id && !D.includes(y.u)); if (!x) return Desk.msgbox('Deck Builder', 'All your copies of that card are already in your deck (or tied up in a trade or auction).', 'info'); if (D.length >= X.DECK.size) return Desk.msgbox('Deck Builder', 'Your deck is full! Take a card out first.', 'info'); const why = rule(deckIds().concat(id)); if (why) return Desk.msgbox('Deck Builder', why, 'info'); D.push(x.u); S.dirty = true; S.tab = 'deck'; draw(); });
      on('[data-f]', b => { S.filt = b.dataset.f; draw(); });
      on('[data-in]', b => { const id = b.dataset.in, D = deckNow(); if (D.length >= X.DECK.size) { S.msg = 'Your deck is full! Click a card in it to take it out.'; draw(); S.msg = ''; return; } const why = rule(deckIds().concat(id)); if (why) { S.msg = why; draw(); S.msg = ''; EX.sfx('uhoh'); return; } const x = free().find(y => y.id === id && !D.includes(y.u)); if (!x) return; D.push(x.u); S.dirty = true; EX.sfx('click'); draw(); });
      on('[data-rm]', b => { S.deck = deckNow().filter(u => u !== +b.dataset.rm); S.dirty = true; EX.sfx('click'); draw(); });
      on('[data-save]', () => { EX.send({ t: 'exDeck', deck: deckNow() }); });
      on('[data-auto]', () => { S.deck = autoDeck(); S.dirty = true; draw(); });
      on('[data-clear]', () => { S.deck = []; S.dirty = true; draw(); });
      on('[data-open]', b => { b.disabled = true; EX.send({ t: 'exPackOpen' }); });
    }
    const offs = [
      EX.on('me', m => { if (S.tab === 'deck' && S.dirty) { status(); return; } if (m && S.dirty === false) S.deck = null; if (!busy) draw(); }),
      EX.on('exErr', m => { if (S.tab === 'deck') { S.msg = m.msg; draw(); S.msg = ''; } else Desk.msgbox('JackCards Binder', m.msg, 'warn'); }),
      EX.on('exPack', m => { if (S.tab !== 'packs') go('packs'); busy = true; const box2 = box.querySelector('.exb-rev'); const have = new Map(K.owned()); for (const x of m.its) have.set(x.id, Math.max(0, (have.get(x.id) || 0) - 1)); K.reveal(box2, m.its, { have, starter: m.starter, onDone: () => { busy = false; const p = document.createElement('p'); p.style.textAlign = 'center'; p.innerHTML = `${EX.me && EX.me.packs ? '<button class="btn" data-open>Open another</button> ' : ''}<button class="btn" data-tab2>Look in the binder</button>`; box2.appendChild(p); const o = p.querySelector('[data-open]'); if (o) o.onclick = () => { o.disabled = true; EX.send({ t: 'exPackOpen' }); }; p.querySelector('[data-tab2]').onclick = () => go('binder'); } }); }),
    ];
    let busy = false;
    // a saved deck: tell the person, then show the server's version
    offs.push(EX.on('me', m => { if (m && S.dirty && S.deck && JSON.stringify(m.deck) === JSON.stringify(S.deck)) { S.dirty = false; S.deck = null; A.secret('ex.deck'); Desk.toast('JackCards Binder', 'Deck saved! Ready for Card Clash.', 3000); draw(); } }));
    if (window.Loot && Loot.on) offs.push(Loot.on('me', () => { if (!busy) draw(); }));
    const oc = w.close; w.close = function () { offs.forEach(f => f()); W = null; return oc.apply(this, arguments); };
    const ro = window.ResizeObserver ? new ResizeObserver(() => { const two = box.clientWidth > 560; if (two !== w._two) { w._two = two; if (S.tab === 'binder') draw(); } }) : null;
    if (ro) ro.observe(box);
    draw();
    if (EX.member) { EX.send({ t: 'exMe' }); if (window.Loot && !Loot.me) Loot.send({ t: 'lootMe' }); }
    return w;
  }
  window.ExBinder = { open };
})();

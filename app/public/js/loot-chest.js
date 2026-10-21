/* loot-chest: the JackLoot TREASURE CHEST program (lazy-loaded by js/loot.js). My Stuff (with the rarity shine), Daily
 * Parcels, Goals (missions, sets, achievements), the Combinator, the Trading Post and Pay a Friend.
 * The server does everything that matters; this only shows it and asks. */
(function () {
  'use strict';
  if (window.LootChest) return;
  const A = window.Apps, L = window.Loot, C = L.cat, ART = L.art, esc = A.esc, fmt = L.fmt;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const rp = n => (window.Econ && Econ.rp ? Econ.rp(n) : fmt(n) + (Math.floor(+n || 0) === 1 ? ' Rupee' : ' Rupees')); // plain text money
  const member = () => !!(Net.me && Net.me.member);
  const d99 = ts => { const d = new Date(ts); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/99`; };
  const SRCN = { JackWorld: 'the JackWorld Catalogue', RoomOfWeek: 'the JackWorld Crew (Room of the Week!)', parcel: 'a Daily Parcel', mission: 'a Daily Mission', set: 'a collection prize', ach: 'an achievement', combine: 'the Combinator', shop: 'a Lootlings shop', bazaar: 'the Bazaar', trade: 'a trade', score: 'a high score', record: 'a high-score record', post: 'a forum post', topic: 'a forum topic', gb: 'a letter to Jack', chat: 'chatting', secret: 'a secret', cube: "the shared cube", waaagh: 'a WAAAGH!', petcare: 'looking after Gubbinz', frag: 'JackReal Tournament', fragwin: 'winning at JackReal Tournament', quiz: 'Quiz Night', hpvisit: 'a homepage visitor', site: 'surfing the web', prog: 'trying a new program', play: 'playing on the PC', cards: 'Solitaire', cupboard: 'the Games Cupboard', pb: 'a personal best', install: 'installing software', test: 'the test lab' };
  const SLOTN = { hat: 'on your head (Hangout)', gub: 'on Gubbinz', face: 'on your face (Hangout)', badge: 'as your badge', pet: 'on your taskbar', cur: 'as your mouse pointer', wall: 'as your wallpaper', col: 'as your window colours', amp: 'on JackAmp', flower: 'on your Uh-Oh! flower', name: 'as your chat name colour', btn: 'on your homepage and profile', card: 'as your favourite card' };
  const PARCEL = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 18h36v26H6z" fill="#c8843a" stroke="#000"/><path d="M4 12h40v8H4z" fill="#e0a050" stroke="#000"/><path d="M21 12h6v32h-6z" fill="#e10600" stroke="#000" stroke-width=".8"/><path d="M24 12c-4-8-12-8-11-3 1 3 7 3 11 3zM24 12c4-8 12-8 11-3-1 3-7 3-11 3z" fill="#e10600" stroke="#000" stroke-width=".8"/><path d="M9 26h8M9 30h6" stroke="#6a3a10"/><text x="35" y="38" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="5" fill="#3a1a00">TO: YOU</text></svg>';

  function mount(w, box, tab0) {
    box.className = 'lx-chest';
    const S = { tab: tab0 || 'stuff', type: '', r: '', sort: 'new', sel: '', crR: 0, picks: [], want: '', trade: 0, trades: [], tPick: null, reveal: null };
    const offs = [];
    const close0 = w.close; w.close = function () { offs.forEach(f => f()); return close0.apply(this, arguments); };
    A.menubar(w, [
      ['File', [{ label: 'Lootlings Web Site', act: () => L.go('/') }, { label: 'The Bazaar', act: () => L.go('/bazaar.html') }, { label: 'Item Database', act: () => L.go('/items.html') }, '-', { label: 'Close', act: () => w.close() }]],
      ['View', () => [['stuff', 'My Stuff'], ['parcels', 'Daily Parcels'], ['goals', 'Goals'], ['combine', 'Combinator'], ['trade', 'Trading Post'], ['pay', 'Pay a Friend']].map(([k, l]) => ({ label: l, rad: S.tab === k, act: () => go(k) }))],
      ['Help', [{ label: 'How does JackLoot work?', act: () => L.go('/help.html') }, { label: 'For Moms and Dads', act: () => L.go('/parents.html') }, '-', { label: 'About Treasure Chest', act: () => Desk.msgbox('About Treasure Chest', 'JackLoot Treasure Chest 1.0\nCopyright (C) 1999 Lootlings Ltd. (a Snorb and a shoebox)\n\nRarity guide:\n  Common (grey)  Uncommon (green)  Rare (blue)\n  Epic (purple)  Legendary (gold)  JACKPOT (rainbow!)\n\nNo mystery boxes. Ever. Pibble promised.', 'info') }]],
    ]);
    const go = t => { S.tab = t; S.sel = S.tab === 'stuff' ? S.sel : ''; draw(); if (t === 'trade') Net.send({ t: 'lootTList' }); };
    const me = () => L.me;
    const status = () => { const m = me(); if (!w.status) return; w.status.textContent = m ? `${fmt(m.it.length)} thing${m.it.length === 1 ? '' : 's'} (${fmt(new Set(m.it.map(x => x.id)).size)} different) | Collection score ${fmt(m.score)} | ${rp(window.Econ ? Econ.bal : 0)} | Random finds today: ${m.drops[0]} of ${m.drops[1]}` : 'Not logged on to JackNet'; };
    function tabs() {
      const m = me(), T = [['stuff', 'My Stuff'], ['parcels', 'Parcels' + (m && m.par ? `<span class="lx-badge">${m.par}</span>` : '')], ['goals', 'Goals'], ['combine', 'Combinator'], ['trade', 'Trading Post'], ['pay', 'Pay a Friend']];
      return `<div class="lx-ctabs" role="tablist">${T.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    }
    function draw() {
      const m = me();
      if (!member() || !m) {
        box.innerHTML = `${tabs()}<div class="lx-cbody"><div class="lx-guest"><b>Your Treasure Chest is empty</b> because you're not logged on to JackNet. Members find hats, pets, wallpapers, JackCards and loads more just by playing, and get a free Daily Parcel every day. <a href="#" data-join="1">Join JackNet / Log On</a> (it's FREE!)</div><p>Have a look at everything you could find in the <a href="#" data-web="/items.html">Lootlings Item Database</a>.</p><div class="lx-grid">${C.ITEMS.filter(i => !i.sea && !i.ex).slice(0, 36).map(i => `<div class="lx-cell">${L.pic(i.id)}<span class="lx-cn">${esc(i.name)}</span></div>`).join('')}</div></div>`;
        wire(); status(); return;
      }
      const body = { stuff: drawStuff, parcels: drawParcels, goals: drawGoals, combine: drawCombine, trade: drawTrade, pay: drawPay }[S.tab] || drawStuff;
      const keep = box.querySelector('.lx-grid'), sc = keep ? keep.scrollTop : 0;
      box.innerHTML = tabs() + `<div class="lx-cbody">${body(m)}</div>`;
      const g = box.querySelector('.lx-grid'); if (g && sc) g.scrollTop = sc;
      wire(); status();
    }
    // ---------------------------------------------------------------- My Stuff
    const groups = m => {
      const g = new Map();
      for (const x of m.it) { const it = C.ITEM[x.id]; if (!it) continue; if (S.type && it.type !== S.type) continue; if (S.r !== '' && it.r !== +S.r) continue; let e = g.get(x.id); if (!e) g.set(x.id, e = { id: x.id, it, xs: [] }); e.xs.push(x); }
      const list = [...g.values()];
      const newest = e => Math.max(...e.xs.map(x => x.at));
      list.sort(S.sort === 'rare' ? (a, b) => b.it.r - a.it.r || a.it.name.localeCompare(b.it.name) : S.sort === 'name' ? (a, b) => a.it.name.localeCompare(b.it.name) : S.sort === 'type' ? (a, b) => C.TYPE_ORDER.indexOf(a.it.type) - C.TYPE_ORDER.indexOf(b.it.type) || b.it.r - a.it.r : (a, b) => newest(b) - newest(a));
      return list;
    };
    const eqSlots = (m, u) => Object.keys(m.lw || {}).filter(s => m.lw[s] === u);
    function drawStuff(m) {
      const list = groups(m);
      if (!S.sel && list.length) S.sel = list[0].id;
      const e = list.find(x => x.id === S.sel);
      const cells = list.map(g => {
        const eq = g.xs.some(x => eqSlots(m, x.u).length), lk = g.xs.every(x => x.lk), ser = g.xs.filter(x => x.s).map(x => x.s).sort((a, b) => a - b)[0];
        return `<button type="button" class="lx-cell${g.id === S.sel ? ' sel' : ''}" data-sel="${esc(g.id)}">${L.pic(g.id, { serial: ser, n: g.xs.length })}<span class="lx-cn">${esc(g.it.name)}</span>${eq ? '<span class="lx-eqmark">ON</span>' : lk ? '<span class="lx-lkmark">AWAY</span>' : ''}</button>`;
      }).join('');
      return `<div class="lx-bar"><label>Show: <select data-f="type"><option value="">Everything</option>${C.TYPE_ORDER.map(t => `<option value="${t}"${S.type === t ? ' selected' : ''}>${esc(C.TYPES[t][0])}</option>`).join('')}</select></label><label>Rarity: <select data-f="r"><option value="">Any</option>${C.RAR.map((r, i) => `<option value="${i}"${S.r === String(i) ? ' selected' : ''}>${r.n}</option>`).join('')}</select></label><label>Sort: <select data-f="sort">${[['new', 'Newest'], ['rare', 'Rarest'], ['type', 'Type'], ['name', 'A-Z']].map(([k, l]) => `<option value="${k}"${S.sort === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
        ${m.it.length ? `<div class="lx-split"><div class="lx-grid">${cells || '<div class="lx-empty">Nothing like that in here.</div>'}</div><div class="lx-det">${e ? detail(m, e) : '<p class="lx-empty">Click something to look at it.</p>'}</div></div>` : `<div class="lx-empty">Your Treasure Chest is empty! Things drop when you play games, post, chat, surf, find secrets and more.${m.par ? ' And you have a <a href="#" data-tab2="parcels">Daily Parcel</a> waiting!' : ''}</div>`}`;
    }
    function detail(m, e) {
      const it = e.it, R = C.RAR[it.r], free = e.xs.filter(x => !x.lk), x = free.find(y => !eqSlots(m, y.u).length) || free[0] || e.xs[0];
      const on = e.xs.flatMap(y => eqSlots(m, y.u));
      const sets = C.SETS.filter(s => s.items && s.items.includes(it.id));
      const slots = it.type === 'trinket' || it.type === 'furni' ? [] : it.type === 'hat' ? ['hat', 'gub'] : [it.type];
      const acts = slots.map(sl => on.includes(sl) ? `<button class="btn" type="button" data-off="${sl}">Take off ${sl === 'gub' ? 'Gubbinz' : ''}</button>` : `<button class="btn" type="button" data-eq="${sl}" data-u="${x.u}"${x.lk ? ' disabled' : ''}>${sl === 'gub' ? 'Put on Gubbinz' : it.type === 'wall' ? 'Set as wallpaper' : it.type === 'card' ? 'Make favourite' : it.type === 'pet' ? 'Adopt onto taskbar' : 'Wear / use it'}</button>`).join('');
      return `<div class="lx-detpic">${L.pic(it.id, { big: true, serial: x.s })}</div><h3>${esc(it.name)}</h3><div><span class="lx-rb lx-rb${it.r}">${R.n}</span> <span class="lx-meta">${esc(C.TYPES[it.type][0])}</span></div>
        <p>${esc(it.d)}</p>
        <div class="lx-meta">${e.xs.length > 1 ? `You have <b>${e.xs.length}</b>. ` : ''}${x.s ? `Serial <b>#${x.s}</b> of ${it.lim}. ` : it.lim ? `Limited: only ${it.lim} will ever exist. ` : ''}Found ${d99(x.at)} from ${esc(SRCN[x.src] || x.src || 'somewhere')}.${it.sea ? ` Seasonal (${C.md2txt(it.sea[0])} to ${C.md2txt(it.sea[1])}).` : ''}</div>
        ${on.length ? `<div class="lx-meta">In use: <b>${on.map(s => SLOTN[s] || s).join(', ')}</b></div>` : it.type !== 'trinket' ? `<div class="lx-meta">${esc(C.TYPES[it.type][2])}</div>` : ''}
        ${x.lk ? `<div class="lx-meta"><b>${x.lk[0] === 't' ? 'In a trade right now.' : x.lk === 'jw' ? 'Out in your JackWorld room right now (pick it up to trade it).' : x.lk[0] === 'b' ? 'Up for auction on JackBay right now.' : 'On sale at the Bazaar right now.'}</b></div>` : ''}
        ${sets.length ? `<div class="lx-meta">Part of: ${sets.map(s => `<b>${esc(s.n)}</b>${m.sets[s.id] ? ' (done!)' : ''}`).join(', ')}</div>` : ''}
        <div class="lx-acts">${acts}</div>
        <div class="lx-acts"><button class="btn" type="button" data-rec="${x.u}"${x.lk ? ' disabled' : ''}>Recycle (+${rp(R.rec)})</button><button class="btn" type="button" data-sell="${x.u}"${x.lk ? ' disabled' : ''}>Sell on Bazaar...</button><button class="btn" type="button" data-trade="${x.u}"${x.lk && x.lk[0] !== 't' ? ' disabled' : ''}>Trade it...</button>${e.xs.filter(y => !y.lk && !eqSlots(m, y.u).length).length > 1 ? `<button class="btn" type="button" data-recdup="${esc(it.id)}">Recycle spares</button>` : ''}</div>
        <a href="#" data-web="/item/${esc(it.id)}.html">See it in the Item Database &raquo;</a>`;
    }
    // ---------------------------------------------------------------- Parcels
    function drawParcels(m) {
      if (S.reveal) { const x = S.reveal, it = C.ITEM[x.id]; return `<div class="lx-reveal">${L.pic(x.id, { big: true, serial: x.s })}<h3 style="margin:0">${esc(it.name)}</h3><div><span class="lx-rb lx-rb${it.r}">${C.RAR[it.r].n}</span></div><p style="max-width:360px;margin:0">${esc(it.d)}</p><div class="lx-acts"><button class="btn" type="button" data-look="${esc(x.id)}">Look in My Stuff</button>${m.par ? `<button class="btn" type="button" data-again="1">Open the next one (${m.par} left)</button>` : ''}</div></div>`; }
      return `<p>The postman brings one <b>Daily Parcel</b> the first time you log on each day. You can keep up to ${C.RULES.parcelsMax} unopened. They never go off, so there's no rush!</p>
        ${m.par ? `<div class="lx-parcels">${Array.from({ length: m.par }, (_, i) => `<button type="button" class="lx-parcel" data-open="1" aria-label="Open parcel ${i + 1}">${PARCEL}<span>Click to open!</span></button>`).join('')}</div>` : `<div class="lx-parcels"><div class="lx-empty">No parcels right now. The postman comes back tomorrow (the first time you log on). Meanwhile, things can drop from almost anything you do!</div></div>`}`;
    }
    // ---------------------------------------------------------------- Goals: missions, sets, achievements
    function drawGoals(m) {
      const have = new Set(m.it.map(x => x.id));
      const mis = (m.mis && m.mis.l || []).map(x => { const d = C.MISS[x.id] || { n: x.id, need: 1 }; return `<div class="lx-mis${x.done ? ' done' : ''}"><span class="lx-tick">${x.done ? '&#10003;' : ''}</span><div><div class="lx-mn">${esc(d.n)}</div><span class="lx-prog"><i style="width:${Math.round(x.n / d.need * 100)}%"></i></span></div><b>+${rp(x.teef)}</b></div>`; }).join('');
      const sets = C.SETS.map(s => { const n = s.rar ? new Set(m.it.map(x => C.ITEM[x.id].r)).size : s.items.filter(i => have.has(i)).length, tot = s.rar ? 6 : s.items.length; return `<tr><td>${m.sets[s.id] ? '&#9733;' : ''}</td><td><b>${esc(s.n)}</b><br><small>${esc(s.d)}</small></td><td>${n}/${tot}</td><td>+${rp(s.teef)}${s.give ? ' + prize' : ''}</td></tr>`; }).join('');
      const achs = C.ACH.map(a => `<div class="lx-ach${m.ach[a.id] ? ' got' : ''}"><span class="lx-am">${m.ach[a.id] ? '&#9733;' : '&#9734;'}</span><div><b>${esc(a.n)}</b><br>${esc(a.d)}${a.teef ? ` (+${rp(a.teef)})` : ''}</div></div>`).join('');
      return `<h3 style="margin:0">Today's Daily Missions</h3><p style="margin:0">Three new ones every day. Do all three for a bonus ${rp(C.MISSION_BONUS)} and a bonus item. Miss a day? No problem. Nothing is ever taken away.</p>${mis}${m.mis && m.mis.bonus ? '<p><b>All done today! Brilliant.</b></p>' : ''}
        <h3 style="margin:6px 0 0">Collection Sets</h3><table class="lx-tbl"><tr><th></th><th>Set</th><th>Got</th><th>Prize</th></tr>${sets}</table>
        <h3 style="margin:6px 0 0">Achievements (${Object.keys(m.ach).length} of ${C.ACH.length})</h3><div class="lx-achs">${achs}</div>`;
    }
    // ---------------------------------------------------------------- the Combinator
    function drawCombine(m) {
      const r = S.crR, pool = m.it.filter(x => C.ITEM[x.id].r === r && !x.lk);
      S.picks = S.picks.filter(u => pool.some(x => x.u === u));
      const wants = r < 5 ? C.ITEMS.filter(i => i.r === r + 1 && !i.ex) : [];
      return `<p>Put in <b>five things of the same rarity</b> and the Combinator (built by Fizzwick, mostly safe) turns them into <b>one thing of the next rarity</b>. You choose exactly what comes out. No luck involved!</p>
        <div class="lx-bar"><label>Rarity to put in: <select data-f="crR">${C.RAR.slice(0, 5).map((x, i) => `<option value="${i}"${r === i ? ' selected' : ''}>${x.n} (-> ${C.RAR[i + 1].n})</option>`).join('')}</select></label><b>${S.picks.length} of 5 picked</b></div>
        <div class="lx-grid lx-pick" style="min-height:80px">${pool.length ? pool.map(x => `<button type="button" class="lx-cell${S.picks.includes(x.u) ? ' picked' : ''}" data-pick="${x.u}">${L.pic(x.id, { serial: x.s })}<span class="lx-cn">${esc(C.ITEM[x.id].name)}</span>${eqSlots(m, x.u).length ? '<span class="lx-eqmark">ON</span>' : ''}</button>`).join('') : `<div class="lx-empty">You haven't got any spare ${C.RAR[r].n} things.</div>`}</div>
        <div><b>Make this:</b> (limited ones may run out)</div><div class="lx-want">${wants.map(i => `<button type="button" class="lx-cell${S.want === i.id ? ' sel' : ''}" data-want="${esc(i.id)}">${L.pic(i.id)}<span class="lx-cn">${esc(i.name)}</span></button>`).join('')}</div>
        <div class="lx-bar"><button class="btn" type="button" data-combine="1"${S.picks.length === 5 && S.want ? '' : ' disabled'}>COMBINE!</button><span>${S.want ? `Makes: <b>${esc(C.ITEM[S.want].name)}</b>` : 'Pick what you want out.'}</span></div>`;
    }
    // ---------------------------------------------------------------- the Trading Post
    function drawTrade(m) {
      const open = S.trades.filter(t => t.st === 'open'), done = S.trades.filter(t => t.st !== 'open').slice(0, 6);
      const T = S.trades.find(t => t.id === S.trade) || open[0];
      if (T) S.trade = T.id;
      const side = (s, mine) => `<div class="lx-trside${s.ok ? ' ok' : ''}"><h4>${mine ? 'You give' : esc(s.name) + ' gives'} ${s.ok ? '&#10003; OK!' : ''}</h4><div class="lx-tritems">${s.items.map(x => L.pic(x.id, { serial: x.s })).join('') || '<span class="lx-empty">nothing yet</span>'}</div>${s.teef ? `<div>+ <b>${rp(s.teef)}</b></div>` : ''}</div>`;
      let tv = '';
      if (T && T.st === 'open') {
        const mineU = T.mine.items.map(x => x.u), pick = S.tPick || mineU;
        const pool = m.it.filter(x => !x.lk || x.lk === 't' + T.id);
        tv = `<div class="lx-tr"><div class="lx-bar"><b>Trade #${T.id} with ${esc(T.theirs.name)}</b><span class="lx-meta">Nothing moves until you BOTH tick OK. Changing anything un-ticks both.</span></div><div class="lx-trsides">${side(T.mine, true)}${side(T.theirs, false)}</div>
          <details${S.tPick ? ' open' : ''}><summary>Change what you're giving (up to ${C.RULES.tradeItems} things)</summary><div class="lx-grid lx-pick">${pool.map(x => `<button type="button" class="lx-cell${pick.includes(x.u) ? ' picked' : ''}" data-tp="${x.u}">${L.pic(x.id, { serial: x.s })}<span class="lx-cn">${esc(C.ITEM[x.id].name)}</span></button>`).join('') || '<div class="lx-empty">Nothing to trade.</div>'}</div>
          <div class="lx-bar"><label>Plus Rupees: <input type="number" min="0" max="${C.RULES.payDayMax}" step="1" value="${T.mine.teef}" data-tteef style="width:80px"></label><button class="btn" type="button" data-tset="1">Update my side</button></div></details>
          <div class="lx-bar"><button class="btn" type="button" data-tok="${T.mine.ok ? 0 : 1}"><b>${T.mine.ok ? 'Untick OK' : 'Tick OK - I agree'}</b></button><button class="btn" type="button" data-tcancel="1">Cancel trade</button>${T.why ? `<span class="lx-meta">${esc(T.why)}</span>` : ''}</div></div>`;
      }
      return `<div class="lx-bar"><label>Start a trade with: <input type="text" maxlength="16" data-tnew placeholder="member name" style="width:120px"></label><button class="btn" type="button" data-tgo="1">Start trade</button>${open.length > 1 ? `<label>Open trades: <select data-f="trade">${open.map(t => `<option value="${t.id}"${t.id === S.trade ? ' selected' : ''}>#${t.id} with ${esc(t.theirs.name)}</option>`).join('')}</select></label>` : ''}</div>
        ${tv || '<div class="lx-empty">No trades open. Type a member\'s name above to start one, or wait for someone to ask you!</div>'}
        ${done.length ? `<h3 style="margin:4px 0 0">Recent trades</h3><table class="lx-tbl">${done.map(t => `<tr><td>#${t.id}</td><td>with ${esc(t.theirs.name)}</td><td class="lx-trst ${t.st}">${t.st === 'done' ? 'DONE' : 'cancelled'}</td></tr>`).join('')}</table>` : ''}`;
    }
    // ---------------------------------------------------------------- Pay a Friend
    function drawPay(m) {
      return `<p>Send Rupees to another JackNet member (to pay for a hat, or to be nice). It goes straight into their JackNet Bank account and shows on both statements.</p>
        <div class="lx-bar"><label>To: <input type="text" maxlength="16" data-pto style="width:120px"></label><label>Rupees: <input type="number" min="1" max="${m.pay.max}" step="1" data-pamt style="width:80px"></label><label>Note: <input type="text" maxlength="60" data-pnote style="width:170px" placeholder="for the Viking Helmet"></label><button class="btn" type="button" data-pay="1">Send</button></div>
        <p class="lx-meta">Sent today: <b>${fmt(m.pay.sent)}</b> of ${fmt(m.pay.max)}. Received today: ${fmt(m.pay.recv)}.${m.pay.ok ? '' : ' <b>You need to have earned 100 Rupees yourself before you can send any.</b>'} You can also use <a href="#" data-url="http://www.jacknetbank.webcom/pay.html">JackNet Bank: Pay Someone</a>.</p>
        <div class="lx-paymsg"></div>`;
    }
    // ---------------------------------------------------------------- wiring
    const q = s => box.querySelector(s), qa = s => [...box.querySelectorAll(s)];
    function wire() {
      qa('[data-tab]').forEach(b => b.addEventListener('click', () => { sfx('click'); go(b.dataset.tab); }));
      qa('[data-tab2]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); go(b.dataset.tab2); }));
      qa('[data-join]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); if (window.Guest) Guest.need('Collecting JackLoot'); }));
      qa('[data-web]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); L.go(b.dataset.web); }));
      qa('[data-url]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); if (window.Econ) Econ.go(b.dataset.url); }));
      qa('[data-f]').forEach(s => s.addEventListener('change', () => { const k = s.dataset.f; S[k] = k === 'crR' || k === 'trade' ? +s.value : s.value; if (k === 'crR') { S.picks = []; S.want = ''; } if (k === 'type' || k === 'r') S.sel = ''; S.tPick = null; draw(); }));
      qa('[data-sel]').forEach(b => b.addEventListener('click', () => { S.sel = b.dataset.sel; sfx('click'); draw(); }));
      qa('[data-eq]').forEach(b => b.addEventListener('click', () => equip(+b.dataset.u, b.dataset.eq)));
      qa('[data-off]').forEach(b => b.addEventListener('click', () => { Net.send({ t: 'lootUnequip', slot: b.dataset.off }); sfx('click'); }));
      qa('[data-rec]').forEach(b => b.addEventListener('click', () => { const x = me().it.find(y => y.u === +b.dataset.rec), it = C.ITEM[x.id]; Desk.msgbox('Recycle', `Recycle your ${it.name} for ${rp(C.RAR[it.r].rec)}?\n\nIt will be gone for good.`, 'q', [['Recycle', () => { Net.send({ t: 'lootRecycle', us: [x.u] }); }], ['Keep it']]); }));
      qa('[data-recdup]').forEach(b => b.addEventListener('click', () => { const m = me(), id = b.dataset.recdup, xs = m.it.filter(y => y.id === id && !y.lk && !eqSlots(m, y.u).length); const spare = xs.sort((a, b2) => (b2.s || 0) - (a.s || 0)).slice(0, xs.length - 1); if (!spare.length) return; const it = C.ITEM[id]; Desk.msgbox('Recycle spares', `Recycle ${spare.length} spare ${it.name}${spare.length > 1 ? 's' : ''} for ${rp(spare.length * C.RAR[it.r].rec)}? You keep one (the lowest serial number).`, 'q', [['Recycle', () => Net.send({ t: 'lootRecycle', us: spare.map(y => y.u) })], ['Cancel']]); }));
      qa('[data-sell]').forEach(b => b.addEventListener('click', () => { const x = me().it.find(y => y.u === +b.dataset.sell), it = C.ITEM[x.id]; Desk.ask('Sell on the Bazaar', `How many Rupees do you want for your ${it.name}? (The Bazaar keeps ${C.RULES.feePct}% when it sells.)`, String([30, 90, 250, 700, 2000, 8000][it.r]), 7, v => { const p = Math.floor(+v); if (!(p >= 1)) return; Net.send({ t: 'lootSell', u: x.u, price: p }); }); }));
      qa('[data-trade]').forEach(b => b.addEventListener('click', () => { const u = +b.dataset.trade, T = S.trades.find(t => t.st === 'open'); S.tab = 'trade'; if (T) { S.trade = T.id; S.tPick = [...new Set(T.mine.items.map(x => x.u).concat(u))]; } else S.tPick = [u]; Net.send({ t: 'lootTList' }); draw(); if (!T) Desk.toast('Trading Post', 'Type the name of the member you want to trade with, then press Start trade.', 5000); }));
      qa('[data-open]').forEach(b => b.addEventListener('click', () => openParcel(b)));
      qa('[data-again]').forEach(b => b.addEventListener('click', () => { S.reveal = null; draw(); const p = q('[data-open]'); if (p) openParcel(p); }));
      qa('[data-look]').forEach(b => b.addEventListener('click', () => { S.sel = b.dataset.look; S.reveal = null; S.type = ''; S.r = ''; go('stuff'); }));
      qa('[data-pick]').forEach(b => b.addEventListener('click', () => { const u = +b.dataset.pick, i = S.picks.indexOf(u); if (i >= 0) S.picks.splice(i, 1); else if (S.picks.length < 5) S.picks.push(u); sfx('click'); draw(); }));
      qa('[data-want]').forEach(b => b.addEventListener('click', () => { S.want = b.dataset.want; sfx('click'); draw(); }));
      qa('[data-combine]').forEach(b => b.addEventListener('click', () => { const it = C.ITEM[S.want]; Desk.msgbox('The Combinator', `Put these 5 things into the Combinator and get one ${it.name}?\n\nThe five will be gone for good.`, 'q', [['COMBINE!', () => { b.disabled = true; Net.send({ t: 'lootCombine', us: S.picks.slice(), want: S.want }); }], ['Cancel']]); }));
      qa('[data-tgo]').forEach(b => b.addEventListener('click', () => { const v = (q('[data-tnew]') || {}).value; if (v && v.trim()) Net.send({ t: 'lootTNew', to: v.trim() }); }));
      qa('[data-tp]').forEach(b => b.addEventListener('click', () => { const T = S.trades.find(t => t.id === S.trade); if (!T) return; const u = +b.dataset.tp; S.tPick = S.tPick || T.mine.items.map(x => x.u); const i = S.tPick.indexOf(u); if (i >= 0) S.tPick.splice(i, 1); else if (S.tPick.length < C.RULES.tradeItems) S.tPick.push(u); sfx('click'); draw(); }));
      qa('[data-tset]').forEach(b => b.addEventListener('click', () => { const T = S.trades.find(t => t.id === S.trade); if (!T) return; const teef = Math.max(0, Math.floor(+(q('[data-tteef]') || {}).value || 0)); Net.send({ t: 'lootTSet', id: T.id, us: S.tPick || T.mine.items.map(x => x.u), teef }); S.tPick = null; }));
      qa('[data-tok]').forEach(b => b.addEventListener('click', () => { Net.send({ t: 'lootTOk', id: S.trade, ok: b.dataset.tok === '1' }); sfx('click'); }));
      qa('[data-tcancel]').forEach(b => b.addEventListener('click', () => Desk.msgbox('Cancel trade', 'Cancel this trade? Everything goes back to its owner.', 'q', [['Cancel trade', () => Net.send({ t: 'lootTCancel', id: S.trade })], ['Keep trading']])));
      qa('[data-pay]').forEach(b => b.addEventListener('click', () => { const to = q('[data-pto]').value.trim(), amt = Math.floor(+q('[data-pamt]').value), note = q('[data-pnote]').value.trim(); if (!to || !(amt > 0)) return; Desk.msgbox('Pay a Friend', `Send ${rp(amt)} to ${to}? This can't be undone.`, 'q', [['Send', () => Net.send({ t: 'lootPay', to, amt, note })], ['Cancel']]); }));
    }
    function equip(u, slot) {
      const m = me(), x = m.it.find(y => y.u === u); if (!x) return;
      const it = C.ITEM[x.id];
      Net.send({ t: 'lootEquip', u, slot });
      sfx('pet'); A.secret('loot.equip');
      if (it.type === 'wall') { const wp = ART.wall(it.id); try { localStorage.setItem('jhp_prog_wall', JSON.stringify({ img: wp.img, mode: wp.mode, col: wp.col, name: it.name })); } catch (e) {} const dk = document.getElementById('desktop'); if (dk) dk.style.background = wp.mode === 'Stretch' ? `url("${wp.img}") center/100% 100% no-repeat,${wp.col}` : `url("${wp.img}") 0 0/auto repeat,${wp.col}`; }
      Desk.toast('Treasure Chest', `${it.name} is now ${SLOTN[slot] || 'in use'}.${it.type === 'amp' ? ' Open JackAmp to see it!' : it.type === 'name' ? ' Say something in the Chat Room!' : ''}`, 4000);
    }
    function openParcel(b) {
      if (b) { b.disabled = true; const s = b.querySelector('svg'); if (s) s.style.animation = 'lxShake .5s 2'; }
      sfx('turn');
      const off = L.on('got', m => { if (m.src !== 'parcel') return; off(); clearTimeout(tm); S.reveal = m.its[0]; A.secret('loot.parcel'); setTimeout(draw, 600); });
      const tm = setTimeout(() => { off(); draw(); }, 6000);
      setTimeout(() => Net.send({ t: 'lootOpen' }), 500);
    }
    offs.push(L.on('got', m => { if (m.src !== 'parcel') draw(); })); // a drop from anywhere else turns up in the chest straight away
    offs.push(L.on('me', () => { if (S.tab === 'trade' && box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return status(); draw(); }));
    offs.push(L.on('lootTrade', m => { const i = S.trades.findIndex(t => t.id === m.tr.id); if (i >= 0) S.trades[i] = m.tr; else S.trades.unshift(m.tr); if (m.tr.st === 'open' && (S.tab === 'trade' || !S.trade)) S.trade = m.tr.id; if (m.tr.st === 'done') { A.secret('loot.trade'); Desk.toast('Trade complete!', `Your trade with ${m.tr.theirs.name} went through. Enjoy your new things!`, 5000); sfx('solve'); } if (S.tab === 'trade') draw(); }));
    offs.push(L.on('lootTrades', m => { S.trades = m.list; if (S.tab === 'trade') draw(); }));
    offs.push(L.on('lootDone', m => { if (m.what === 'recycle') { A.secret('loot.recycle'); Desk.toast('Recycled!', `${m.n} thing${m.n > 1 ? 's' : ''} recycled for ${rp(m.teef)}.`, 4000); sfx('zap'); } if (m.what === 'sell') { A.secret('loot.sell'); Desk.toast('On the Bazaar!', 'Your thing is up for sale at www.lootlings.jnet/bazaar.html. You get the Rupees (minus a small fee) the moment someone buys it.', 6000); } }));
    offs.push(L.on('got', m => { if (m.src === 'combine') { A.secret('loot.combine'); S.picks = []; S.want = ''; } }));
    offs.push(L.on('paid', m => { A.secret('loot.pay'); const b = q('.lx-paymsg'); if (b) b.innerHTML = `<div class="lx-msg ok">Sent ${rp(m.amt)} to <b>${esc(m.to)}</b>!</div>`; sfx('solve'); }));
    offs.push(L.on('err', msg => { const b = q('.lx-paymsg'); Desk.toast('Treasure Chest', msg, 5000); if (b) b.innerHTML = `<div class="lx-msg">${esc(msg)}</div>`; sfx('uhoh'); const cb = q('[data-combine]'); if (cb) draw(); }));
    if (window.Econ) offs.push(Econ.on('me', status));
    Net.send({ t: 'lootMe' }); if (S.tab === 'trade') Net.send({ t: 'lootTList' }); else setTimeout(() => Net.send({ t: 'lootTList' }), 400);
    draw();
  }
  window.LootChest = { mount };
})();

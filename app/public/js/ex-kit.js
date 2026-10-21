/* ex-kit: shared bits for the ECONOMY expansion's pages and programs (loaded first by EX.load).
 *   ExKit.tile(id, o)        a card/item tile with its shine (HTML)        ExKit.back()   the back of a JackCard (SVG)
 *   ExKit.reveal(box, its)   tear open a packet: five cards face down, click to flip, the rare one glows
 *   ExKit.left(ms), d99(ts), ago(ts), item(id), rar(r), chest() (your JackLoot items, or []), owned() -> Map id -> count
 *   window.ExWeb             the page functions (each page file adds its own) */
(function () {
  'use strict';
  if (window.ExKit) return;
  const A = window.Apps, X = window.ExCat, esc = A.esc, EX = window.EX;
  window.ExWeb = window.ExWeb || {};
  const pad = n => String(n).padStart(2, '0');
  const item = id => (window.LootCat && LootCat.ITEM[id]) || null;
  const RCOL = ExArt.RCOL, RN = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Jackpot'];
  const rar = r => ({ n: RN[r] || '', col: RCOL[r] || '#888' });
  const chest = () => (window.Loot && Loot.me && Loot.me.it) || [];
  const owned = () => { const m = new Map(); for (const x of chest()) m.set(x.id, (m.get(x.id) || 0) + 1); return m; };
  const left = ms => { const s = Math.max(0, Math.floor(ms / 1000)); if (s <= 0) return 'Ended'; const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${pad(x)}s` : `${x}s`; };
  const d99 = ts => { const d = new Date(ts); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/99`; };
  const t99 = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' hr ago' : Math.floor(s / 86400) + ' days ago'; };
  const pic = id => { const it = item(id); if (!it) return ''; if (it.type === 'card') return ExArt.battle(id) || (window.LootArt ? LootArt.card(id) : ''); return window.LootArt ? LootArt.pic(id) : ''; };
  // a tile: { n: count, serial, cls, big, label }
  function tile(id, o) {
    o = o || {}; const it = item(id); if (!it) return '<span class="ex-tile ex-tile-x">?</span>';
    return `<span class="ex-tile ex-tr${it.r}${it.type === 'card' ? ' ex-tile-card' : ''}${o.cls ? ' ' + o.cls : ''}" title="${esc(it.name)} (${RN[it.r]})">${pic(id)}${o.serial ? `<em class="ex-ser">#${o.serial}</em>` : ''}${o.n > 1 ? `<b class="ex-cnt">x${o.n}</b>` : ''}${o.isNew ? '<b class="ex-new">NEW!</b>' : ''}</span>`;
  }
  function back() {
    return `<svg viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg" class="ex-card ex-back" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="82.8" rx="4" fill="#1a0a4a" stroke="#000" stroke-width=".8"/><rect x="4" y="4" width="52" height="76" rx="3" fill="#3a1a8a" stroke="#ffd400" stroke-width="1"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M4 ${12 + i * 10}l52-8" stroke="#5a2aba" stroke-width="2"/>`).join('')}<circle cx="30" cy="42" r="15" fill="#ffd400" stroke="#000"/><circle cx="30" cy="42" r="11.4" fill="#e10600" stroke="#000" stroke-width=".6"/><text x="30" y="40.6" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="7" fill="#fff">JACK</text><text x="30" y="47.6" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="7" fill="#ffd400">CARDS</text></svg>`;
  }
  // tear open a packet in `box`. its = [{id, u, s}] (from the server). onDone() once everything is face up.
  function reveal(box, its, o) {
    o = o || {};
    const have = o.have || new Map();
    box.innerHTML = `<div class="ex-rev">${o.starter ? '' : `<div class="ex-rev-pack">${ExArt.pack({ face: (its[its.length - 1] || {}).id })}</div>`}<div class="ex-rev-row">${its.map((x, i) => `<button type="button" class="ex-rev-c" data-i="${i}" style="--d:${i * 0.12}s" aria-label="Turn over card ${i + 1}"><span class="ex-rev-in"><span class="ex-rev-b">${back()}</span><span class="ex-rev-f ex-tr${(item(x.id) || {}).r | 0}">${pic(x.id)}</span></span></button>`).join('')}</div><div class="ex-rev-bar"><button type="button" class="btn" data-all>Turn them all over</button> <span class="ex-rev-sum"></span></div></div>`;
    const flipped = new Set();
    const pack = box.querySelector('.ex-rev-pack');
    if (pack) { EX.sfx('zap'); pack.classList.add('ex-tear'); setTimeout(() => pack.remove(), 900); }
    const flip = i => {
      if (flipped.has(i)) return; flipped.add(i);
      const b = box.querySelector(`.ex-rev-c[data-i="${i}"]`); if (!b) return;
      b.classList.add('on'); const r = (item(its[i].id) || {}).r | 0;
      if (r >= 2) { b.classList.add('ex-rev-holo'); setTimeout(() => EX.sfx(r >= 4 ? 'waaagh' : 'solve'), 250); } else EX.sfx('turn');
      if (flipped.size === its.length) done();
    };
    const done = () => {
      const s = box.querySelector('.ex-rev-sum'), bA = box.querySelector('[data-all]'); if (bA) bA.hidden = true;
      const news = its.filter(x => !have.get(x.id)).length;
      const best = its.reduce((t, x) => Math.max(t, (item(x.id) || {}).r | 0), 0);
      if (s) s.innerHTML = `${news ? `<b>${news} new card${news > 1 ? 's' : ''}</b> for your binder! ` : 'All doubles this time (swap them at the Trading Post!). '}${best >= 2 ? `<b style="color:${RCOL[best]}">${RN[best].toUpperCase()}!</b>` : ''}`;
      its.forEach((x, i) => { if (!have.get(x.id)) { const b = box.querySelector(`.ex-rev-c[data-i="${i}"]`); if (b && !b.querySelector('.ex-new')) b.insertAdjacentHTML('beforeend', '<b class="ex-new">NEW!</b>'); } });
      if (o.onDone) o.onDone();
    };
    box.querySelectorAll('.ex-rev-c').forEach(b => b.addEventListener('click', () => flip(+b.dataset.i)));
    box.querySelector('[data-all]').addEventListener('click', () => its.forEach((x, i) => setTimeout(() => flip(i), i * 260)));
  }
  // the address bar says which page/lot we're on
  const addr = () => { const a = document.getElementById('addrBar'); return a ? a.value : ''; };
  const guestNote = what => (window.Guest ? Guest.webNote(what) : `<p><b>${esc(what)} is for JackNet members.</b></p>`);
  const need = (what, fn) => { if (window.Guest && Guest.is()) return Guest.need(what, fn); fn(); };
  window.ExKit = { tile, back, reveal, pic, left, d99, t99, ago, item, rar, chest, owned, addr, guestNote, need, RN, RCOL, pad };
})();

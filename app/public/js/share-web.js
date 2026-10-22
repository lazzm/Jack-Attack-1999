/* share-web: the SHARE & SOCIAL web sites and programs (lazy-loaded by js/share.js):
 *   SparkleCardz! (e-cards), the Chain Letter Tracker, the Brag Button Factory (88x31 + 400x210 canvas badges),
 *   Floppy Swap-O-Rama + DiskSwap 1.44 + the floppy viewer, and the Homepagez Cool Site of the Month awards.
 *   Also W.deliver(item): turns the post from mods/share.js into Outlook Express e-mails / floppies on the desktop.
 * SAFETY: every name, message, label and file that came from a visitor is put on the page with esc() or textContent. */
(function () {
  'use strict';
  const SH = window.Share, K = window.ShareCat, C = SH && SH.C; if (!SH || !K || !C || SH.W) return;
  const A = window.Apps, esc = SH.esc, store = SH.store;
  const me = SH.me, member = () => !!me().member, nick = () => me().nick || 'Guest';
  const sfx = SH.sfx, secret = SH.secret;
  const pad = n => String(n).padStart(2, '0');
  const d99 = ts => { const d = new Date(ts || Date.now()); let dd = d.getDate(); if (d.getMonth() === 1 && dd === 29) dd = 28; return pad(dd) + '/' + pad(d.getMonth() + 1) + '/99'; };
  const t99 = ts => { const d = new Date(ts || Date.now()); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const need = (what, fn) => (window.Guest ? Guest.need(what, fn) : (member() ? (fn(), true) : false));
  const toast = (t, x, ms) => Desk.toast(t, x, ms || 5000);
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i || 'info', b);
  const q = (el, s) => el.querySelector(s), qa = (el, s) => [...el.querySelectorAll(s)];
  const on = (el, s, ev, fn) => { const x = typeof s === 'string' ? q(el, s) : s; if (x) x.addEventListener(ev, fn); return x; };
  const W = SH.W = {};
  const U = SH.url;
  const CARD_HOST = SH.HOST.cards, CHAIN_HOST = SH.HOST.chain;

  // ================================================================ JackNet members (for "send to" pickers)
  let memCache = null, memAt = 0;
  function members(force) {
    if (!force && memCache && Date.now() - memAt < 60000) return Promise.resolve(memCache);
    return SH.req({ t: 'shMembers' }).then(r => { if (r && Array.isArray(r.list)) { memCache = r.list; memAt = Date.now(); } return memCache || []; });
  }
  W.members = members;
  // a type-to-search list of members: o = { multi, max, exclude: Set(lower names) -> reason, chains, onChange }
  function picker(box, o) {
    o = o || {};
    box.classList.add('shw-pick');
    box.innerHTML = `<input class="shw-pq" type="text" placeholder="Type a name to find a member..." autocomplete="off" aria-label="Find a member"><div class="shw-pl field" role="listbox"><div class="shw-pmsg">Dialling JackNet for the member list...</div></div><div class="shw-psel"></div>`;
    const inp = q(box, '.shw-pq'), lst = q(box, '.shw-pl'), selEl = q(box, '.shw-psel');
    const sel = new Map(); let list = [];
    const why = r => { const k = r[0].toLowerCase(); if (member() && k === nick().toLowerCase() && !o.self) return "that's you!"; if (o.exclude && o.exclude.has(k)) return o.exclude.get ? o.exclude.get(k) : 'already has it'; if (o.chains && r[2]) return 'no chain letters, thanks'; if (o.pages && !r[3]) return 'no home page yet'; return ''; };
    function draw() {
      const qq = inp.value.trim().toLowerCase();
      const rows = list.filter(r => !qq || r[0].toLowerCase().includes(qq));
      rows.sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
      lst.innerHTML = rows.length ? rows.slice(0, 120).map(r => { const w = why(r), s = sel.has(r[0].toLowerCase()); return `<button type="button" class="shw-pr${s ? ' on' : ''}" data-n="${esc(r[0])}"${w ? ' disabled' : ''}><i class="shw-dot${r[1] ? ' live' : ''}" title="${r[1] ? 'On JackNet now' : 'Not on right now'}"></i><span>${esc(r[0])}</span>${w ? `<small>(${esc(w)})</small>` : r[1] ? '<small>online</small>' : ''}${o.multi ? `<b class="shw-tick">${s ? '&#10004;' : ''}</b>` : ''}</button>`; }).join('') + (rows.length > 120 ? `<div class="shw-pmsg">...and ${rows.length - 120} more. Type a bit of their name!</div>` : '')
        : `<div class="shw-pmsg">${list.length ? 'Nobody by that name on JackNet.' : 'No members yet!'}</div>`;
      selEl.innerHTML = sel.size ? (o.multi ? `<b>Picked (${sel.size}${o.max ? ' of ' + o.max : ''}):</b> ` : '<b>To:</b> ') + [...sel.values()].map(n => `<span class="shw-chip">${esc(n)} <button type="button" data-x="${esc(n)}" aria-label="Remove">x</button></span>`).join(' ') : `<i>${o.multi ? `Pick up to ${o.max || 5} people.` : 'Pick somebody.'}</i>`;
    }
    lst.addEventListener('click', ev => { const b = ev.target.closest('.shw-pr'); if (!b || b.disabled) return; const n = b.dataset.n, k = n.toLowerCase();
      if (sel.has(k)) sel.delete(k); else { if (!o.multi) sel.clear(); if (o.multi && o.max && sel.size >= o.max) { sfx('uhoh'); toast('Too many!', `You can only pick ${o.max}. (That's what the letter says.)`, 3000); return; } sel.set(k, n); }
      sfx('click'); draw(); if (o.onChange) o.onChange([...sel.values()]); });
    selEl.addEventListener('click', ev => { const b = ev.target.closest('[data-x]'); if (!b) return; sel.delete(b.dataset.x.toLowerCase()); draw(); if (o.onChange) o.onChange([...sel.values()]); });
    inp.addEventListener('input', draw);
    members().then(l => { list = l || []; if (o.preset) { const r = list.find(x => x[0].toLowerCase() === String(o.preset).toLowerCase()); if (r && !why(r)) sel.set(r[0].toLowerCase(), r[0]); } draw(); if (o.onChange) o.onChange([...sel.values()]); });
    draw();
    return { get: () => [...sel.values()], clear: () => { sel.clear(); draw(); } };
  }
  W.picker = picker;

  // ================================================================ SparkleCardz!
  const SENTK = 'jhp_share_sent';
  const sentList = () => store.get(SENTK, []);
  let pendingTo = '';
  const cardsIn = cat => K.CARDS.filter(c => c[1] === cat);
  const catOf = id => K.CAT[id] || K.CAT.just;
  function czShell(el, inner, crumbs) {
    el.className = 'shz-site shw-cz';
    el.innerHTML = `<div class="shw-czhead"><a href="${U('cards')}" class="shw-czlogo" aria-label="SparkleCardz! home"><span class="shw-czs s1">&#10022;</span><b>Sparkle<i>Cardz!</i></b><span class="shw-czs s2">&#10022;</span><span class="shw-czs s3">&#9733;</span></a>
      <div class="shw-cztag">FREE animated e-cards with MUSIC!!! <span class="shw-blink">Over ${K.CARDS.length} cards!</span></div></div>
      <div class="shw-cznav">${K.CATS.map(c => `<a href="${U('cards', '/cat/' + c[0] + '.html')}" style="--c:${c[2]}">${esc(c[1])}</a>`).join('')}</div>
      ${crumbs ? `<div class="shw-crumb">${crumbs}</div>` : ''}<div class="shw-czbody">${inner}</div>
      <div class="shw-czfoot"><a href="${U('cards', '/pickup.html')}">Pick up a card</a> | <a href="${U('cards', '/sent.html')}">Cards I've sent</a> | <a href="${U('cards', '/today.html')}">Special days</a> | <a href="${U('cards', '/faq.html')}">Help &amp; FAQ</a><br>
      <small>SparkleCardz! never asks for anybody's real e-mail address. Cards go to JackNet members, or by a link you send yourself. Cards are kept for 60 days.<br>(c) 1999 SparkleCardz! Ltd. All sparkles reserved. Best viewed with JackNet Explorer at 800x600.</small></div>`;
  }
  const thumb = (id, big) => { const c = K.CARD[id]; return `<a class="shw-th${big ? ' big' : ''}" href="${U('cards', '/card/' + id + '.html')}" title="${esc(c[2])}">${C.scene(id, true)}<span>${esc(c[2])}</span></a>`; };
  function specialDays() { // the special days in the next five weeks (and any that are today)
    const t = Desk.today99(), out = [];
    for (const c of K.CATS) { if (!c[3]) continue; const m = Math.floor(c[3] / 100), d = c[3] % 100; let diff = Math.round((new Date(1999, m - 1, d) - new Date(1999, t.m - 1, t.d)) / 864e5); if (diff < 0 && c[0] === 'mill') diff = 999; if (diff >= 0 && diff <= 35) out.push([c, diff]); }
    return out.sort((a, b) => a[1] - b[1]);
  }
  const isToday = cat => { const c = K.CAT[cat]; if (!c || !c[3]) return false; const t = Desk.today99(); return t.md === c[3] || (cat === 'mill' && t.m === 12 && t.d >= 26) || (cat === 'hols' && t.m === 12 && t.d >= 20 && t.d <= 26); };
  function czHome(el) {
    const p = SH.takeParams(); if (p.to) pendingTo = String(p.to).slice(0, 16);
    const sp = specialDays();
    rsPick = (rsPick + 7) % K.CARDS.length;
    const pop = Array.from({ length: 6 }, (_, i) => K.CARDS[(rsPick + i * 9) % K.CARDS.length][0]);
    czShell(el, `${pendingTo ? `<div class="shw-note">&#9993; Sending a card to <b>${esc(pendingTo)}</b>? Pick one below and their name will be filled in!</div>` : ''}
      <div class="shw-czgrid2"><div>
        <h2 class="shw-h">Pick a shelf!</h2>
        <div class="shw-shelves">${K.CATS.map(c => `<a class="shw-shelf" href="${U('cards', '/cat/' + c[0] + '.html')}" style="--c:${c[2]}">${C.scene(cardsIn(c[0])[0][0], true)}<b>${esc(c[1])}</b><small>${cardsIn(c[0]).length} cards${isToday(c[0]) ? ' &middot; <em>TODAY!</em>' : ''}</small></a>`).join('')}</div>
      </div><div class="shw-czside">
        <div class="shw-box"><h3>&#9993; Got a card?</h3><p>Type your card number to pick it up:</p><form class="shw-pickf"><input type="text" maxlength="24" placeholder="e.g. 3fz8k2..." aria-label="Card number"><button class="btn" type="submit">Pick up!</button></form></div>
        <div class="shw-box shw-special"><h3>&#9733; Coming up</h3>${sp.length ? sp.map(([c, d]) => `<p><a href="${U('cards', '/cat/' + c[0] + '.html')}"><b>${esc(c[1])}</b></a> ${d === 0 ? '<b class="shw-today">IS TODAY!!!</b>' : d === 1 ? 'is TOMORROW!' : `in ${d} days`}</p>`).join('') : '<p>No special days for a few weeks. Send a <a href="' + U('cards', '/cat/just.html') + '">Just Because</a> card instead!</p>'}</div>
        <div class="shw-box"><h3>&#128202; Cards sent</h3><p class="shw-ctr"><span class="shw-odo">......</span></p><p class="small">e-cards waiting to be picked up right now</p></div>
      </div></div>
      <h2 class="shw-h">Today's most popular cards</h2><div class="shw-thumbs">${pop.map(id => thumb(id)).join('')}</div>`);
    on(el, '.shw-pickf', 'submit', ev => { ev.preventDefault(); const v = q(el, '.shw-pickf input').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''); if (v.length < 10) return msg('SparkleCardz!', 'That card number is too short. It\'s the long jumble of letters and numbers in your e-mail.', 'warn'); SH.codeTyped = true; SH.go(U('cards', '/pickup/' + v + '.html')); });
    SH.req({ t: 'shStats' }).then(r => { const o = q(el, '.shw-odo'); if (o && r && r.cards != null) o.textContent = String(r.cards).padStart(6, '0'); });
  }
  let rsPick = Math.floor(Math.random() * 50);
  function czCat(el, cat) {
    const c = K.CAT[cat]; if (!c) return czShell(el, '<h2>404: Shelf not found</h2><p>That shelf has fallen over. <a href="' + U('cards') + '">Back to the shop</a></p>');
    czShell(el, `<h2 class="shw-h" style="color:${c[2]}">${esc(c[1])} cards</h2><p class="shw-blurb">${esc(c[4])}${isToday(cat) ? ' <b class="shw-today">IT\'S TODAY!!! Send one now!</b>' : ''}</p><div class="shw-thumbs">${cardsIn(cat).map(x => thumb(x[0], true)).join('')}</div>`, `<a href="${U('cards')}">Home</a> &gt; ${esc(c[1])}`);
  }
  function musicBtns(el, id) {
    const bar = q(el, '.shw-music'); if (!bar) return;
    const d = C.DEFS[id], name = C.TUNE_NAME[d.tune] || 'CARD.MID';
    bar.innerHTML = `<button type="button" class="btn" data-m="play">&#9835; Play ${esc(name)}</button><button type="button" class="btn" data-m="stop">&#9632; Stop</button>`;
    on(bar, '[data-m=play]', 'click', () => { if (!C.play(id)) toast('SparkleCardz!', 'Your sound card is busy. (Is the volume on?)'); });
    on(bar, '[data-m=stop]', 'click', () => C.stop());
    if (window.Sound && Sound.on) C.play(id); // a 1999 e-card ALWAYS played its MIDI straight away (if your speakers were on)
  }
  function czCard(el, id) {
    if (!K.CARD[id]) return czShell(el, '<h2>Card not found</h2><p>That card has been sold out. <a href="' + U('cards') + '">Pick another!</a></p>');
    const c = K.CARD[id], cat = catOf(c[1]), r = C.render(id, { inside: false });
    czShell(el, `<div class="shw-cardpage"><div class="shw-preview">${r.html}<div class="shw-music"></div></div>
      <form class="shw-send" autocomplete="off"><h2 class="shw-h">Send "${esc(c[2])}"</h2>
        ${member() ? '' : (window.Guest ? Guest.webNote('Sending e-cards') : '')}
        <label>Your message:</label><textarea name="msg" maxlength="${K.LIMITS.msg}" rows="4"></textarea><div class="shw-count small"></div>
        <label>Sign it from:</label><input type="text" name="sig" maxlength="${K.LIMITS.sig}">
        <fieldset class="shw-to"><legend>Who's it for?</legend>
          <label class="shw-rad"><input type="radio" name="how" value="m" checked> A JackNet member <small>(it goes to their JackMail Express)</small></label>
          <div class="shw-mpick"></div>
          <label class="shw-rad"><input type="radio" name="how" value="l"> A friend in the real world <small>(you get a link to send them)</small></label>
        </fieldset>
        <div class="shw-btns"><button type="submit" class="btn shw-big">&#9993; Send my card!</button></div>
        <div class="shw-result"></div>
      </form></div>`, `<a href="${U('cards')}">Home</a> &gt; <a href="${U('cards', '/cat/' + cat[0] + '.html')}">${esc(cat[1])}</a> &gt; ${esc(c[2])}`);
    const f = q(el, '.shw-send');
    f.msg.value = r.msg; f.sig.value = member() ? nick() : '';
    const cnt = () => { q(el, '.shw-count').textContent = `${f.msg.value.length} / ${K.LIMITS.msg} letters`; }; cnt(); f.msg.addEventListener('input', cnt);
    const pk = picker(q(el, '.shw-mpick'), { self: true, preset: pendingTo });
    pendingTo = '';
    qa(f, 'input[name=how]').forEach(x => x.addEventListener('change', () => { q(el, '.shw-mpick').hidden = f.how.value !== 'm'; }));
    musicBtns(el, id);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      need('Sending e-cards', () => {
        const how = (qa(f, 'input[name=how]').find(x => x.checked) || {}).value, to = how === 'm' ? pk.get()[0] : '';
        if (how === 'm' && !to) return msg('SparkleCardz!', 'Who is it for? Pick a JackNet member from the list (type a bit of their name to find them).', 'warn');
        const res = q(el, '.shw-result'), btn = q(f, 'button[type=submit]');
        btn.disabled = true; res.innerHTML = '<p class="shw-wait2">Licking the stamp... Putting it in the postbox... &#9993;</p>';
        SH.req({ t: 'shCardSend', c: id, msg: f.msg.value, sig: f.sig.value, to: to || undefined }).then(rr => {
          btn.disabled = false;
          if (!rr || !rr.ok) { res.innerHTML = `<p class="shw-err">${esc((rr && rr.err) || 'The postbox is jammed. Try again!')}</p>`; sfx('uhoh'); return; }
          sfx('join');
          const l = sentList(); l.push({ id: rr.id, c: id, to: rr.to || '', ts: Date.now() }); store.set(SENTK, l.slice(-50));
          const cats = new Set(l.map(x => (K.CARD[x.c] || [])[1])); if (cats.size >= 5) secret('share.card.five');
          if (isToday(c[1])) secret('share.card.day');
          if (rr.to) {
            secret(rr.self ? 'share.card.self' : 'share.card.send');
            res.innerHTML = `<div class="shw-ok"><b>Your e-card is on its way to ${esc(rr.to)}!</b><br>It will be waiting in their JackMail Express next time they log on to JackNet${rr.self ? ' (which is right now, because it\'s YOU. Check your Inbox!)' : ''}.<br><br><a href="${U('cards')}">Send another card</a></div>`;
          } else {
            secret('share.card.link');
            const url = SH.real('/card/' + rr.id);
            res.innerHTML = `<div class="shw-ok"><b>Your card is ready!</b> Send this link to your friend. When they open it, they switch on the family PC and the card is waiting for them:<input type="text" readonly class="shw-lin"><div class="shw-btns"><button type="button" class="btn" data-c>Copy link</button>${SH.canShare() ? '<button type="button" class="btn" data-s>Share...</button>' : ''}</div><small>Only send it to people you know! The card is kept for 60 days. (Card number: <tt>${esc(rr.id)}</tt>)</small></div>`;
            const inp = q(res, '.shw-lin'); inp.value = url; inp.addEventListener('focus', () => inp.select());
            on(res, '[data-c]', 'click', () => SH.copy(url).then(ok => ok ? toast('Copied!', 'The link is on your clipboard. Paste it into a message to your friend!', 3500) : (inp.focus(), inp.select())));
            on(res, '[data-s]', 'click', () => SH.share({ title: `${nick()} sent you an e-card!`, text: `${nick()} sent you an e-card: "${c[2]}"`, url }));
          }
        });
      });
    });
  }
  function czPickupForm(el) {
    czShell(el, `<h2 class="shw-h">Pick up your e-card</h2><div class="shw-box" style="max-width:420px"><p>Somebody sent you a card? Type the card number from your e-mail:</p><form class="shw-pickf"><input type="text" maxlength="24" aria-label="Card number"><button class="btn" type="submit">Pick up!</button></form></div>`, `<a href="${U('cards')}">Home</a> &gt; Pick up`);
    on(el, '.shw-pickf', 'submit', ev => { ev.preventDefault(); const v = q(el, '.shw-pickf input').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''); if (v.length < 10) return msg('SparkleCardz!', 'That card number is too short.', 'warn'); SH.codeTyped = true; SH.go(U('cards', '/pickup/' + v + '.html')); });
  }
  function czPickup(el, id) {
    czShell(el, '<div class="shw-envwrap"><p class="shw-wait2">Fetching your card from the SparkleCardz! sorting office...</p></div>', `<a href="${U('cards')}">Home</a> &gt; Pick up`);
    SH.req({ t: 'shCardGet', id }).then(r => {
      const box = q(el, '.shw-envwrap'); if (!box) return;
      const cd = r && r.card;
      if (!cd) { box.innerHTML = `<div class="shw-box"><h2>Oh no! This card has gone stale.</h2><p>We couldn't find card number <tt>${esc(id)}</tt>. Cards are kept for 60 days, then the SparkleCardz! postie eats them. (Or maybe the number's wrong? Check the e-mail again.)</p><p><a href="${U('cards')}">Send a card of your own!</a></p></div>`; return; }
      if (!cd.mine) secret('share.card.get');
      if (SH.codeTyped) { SH.codeTyped = false; secret('share.card.code'); }
      const r2 = C.render(cd.c, { msg: cd.msg, sig: cd.sig, from: cd.by });
      box.innerHTML = `<div class="shw-env"><div class="shw-envback"></div><div class="shw-envcard">${r2.html}</div><div class="shw-envfront"><span>To: ${esc(cd.to || (member() ? nick() : 'You'))}</span><span class="shw-stamp">&#9733;</span></div><div class="shw-envflap"></div></div>
        <div class="shw-envbtn"><button type="button" class="btn shw-big">&#9993; Open your card!</button><p class="small">${esc(cd.by)} sent you this card on ${esc(d99(cd.ts))}.</p></div>`;
      const open = () => {
        const env = q(box, '.shw-env'); if (!env || env.classList.contains('open')) return;
        env.classList.add('open'); sfx('pet');
        const b = q(box, '.shw-envbtn'); b.innerHTML = `<div class="shw-music"></div><div class="shw-btns"><a class="btn" href="${U('cards')}">Send a card back${member() ? '' : ' (join JackNet: FREE!)'}</a></div><p class="small">This card was sent by JackNet member <b>${esc(cd.by)}</b> on ${esc(d99(cd.ts))} at ${esc(t99(cd.ts))}. It will be kept until ${esc(d99(cd.exp))}.${cd.n > 1 ? ` It has been picked up ${cd.n} times.` : ''}</p>`;
        if (!cd.mine) pendingTo = cd.by;
        setTimeout(() => { musicBtns(box, cd.c); C.typeMsg(q(box, '.shc-msg'), cd.msg); }, 900);
      };
      on(box, '.shw-envbtn .btn', 'click', open);
      setTimeout(open, 2200);
    });
  }
  function czSent(el) {
    const l = sentList().slice().reverse();
    czShell(el, `<h2 class="shw-h">Cards I've sent</h2>${l.length ? `<table class="shw-tab"><tr><th>Card</th><th>To</th><th>Sent</th><th></th></tr>${l.map(x => `<tr><td>${esc((K.CARD[x.c] || ['', '', '?'])[2])}</td><td>${x.to ? esc(x.to) : '<i>a link</i>'}</td><td>${esc(d99(x.ts))}</td><td>${x.to ? '' : `<button type="button" class="btn" data-l="${esc(x.id)}">Copy link again</button>`}</td></tr>`).join('')}</table>` : '<p>You haven\'t sent any cards yet! <a href="' + U('cards') + '">Go on, send one.</a></p>'}<p class="small">(This list lives on this computer.)</p>`, `<a href="${U('cards')}">Home</a> &gt; Sent cards`);
    el.addEventListener('click', ev => { const b = ev.target.closest('[data-l]'); if (!b) return; const url = SH.real('/card/' + b.dataset.l); SH.copy(url).then(ok => toast(ok ? 'Copied!' : 'Copy', ok ? 'The link is on your clipboard.' : url, 4000)); });
  }
  function czFaq(el) {
    czShell(el, `<h2 class="shw-h">Help &amp; FAQ</h2><div class="shw-faq">
      <h3>How do I send a card?</h3><p>Pick a shelf, pick a card, write a message and click Send. You need to be a JackNet member (it's FREE).</p>
      <h3>Who can I send it to?</h3><p>Any JackNet member: it turns up in their JackMail Express inbox with a link to pick it up. Or a friend in the REAL world: we give you a link to send them (in a text, a chat, whatever). When they open it, they switch on the family PC and the card is waiting!</p>
      <h3>Do you want my e-mail address?</h3><p>NO! SparkleCardz! never asks for anybody's real e-mail address. Not yours, not your mates', not your Gran's.</p>
      <h3>How long are cards kept?</h3><p>60 days. Then the postie eats them. (He is a very hungry postie.)</p>
      <h3>Why does my card play music?</h3><p>Because it's 1999 and EVERYTHING plays music. Click Stop if your Mom is on the phone.</p>
      <h3>Will I know when it's been picked up?</h3><p>Yes! We send you an e-mail the first time somebody opens your card.</p>
      <h3>How many cards can I send?</h3><p>${K.LIMITS.cardDay} a day. The postie has little legs.</p></div>`, `<a href="${U('cards')}">Home</a> &gt; Help`);
  }
  function czToday(el) {
    const days = K.CATS.filter(c => c[3]).map(c => { const m = Math.floor(c[3] / 100), d = c[3] % 100; return [c, new Date(1999, m - 1, d)]; });
    czShell(el, `<h2 class="shw-h">Special days in 1999</h2><table class="shw-tab">${days.map(([c, dt]) => `<tr><td><b style="color:${c[2]}">${esc(c[1])}</b></td><td>${esc(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getDay()])} ${dt.getDate()} ${esc(K.MONTHS[dt.getMonth()])} 1999</td><td>${isToday(c[0]) ? '<b class="shw-today">TODAY!</b>' : ''}</td><td><a href="${U('cards', '/cat/' + c[0] + '.html')}">See the cards</a></td></tr>`).join('')}</table><p>Send a card ON its special day and it gets an extra sparkle!</p>`, `<a href="${U('cards')}">Home</a> &gt; Special days`);
  }

  // ================================================================ chain letters: the letters themselves (all hoaxes, all harmless, no real money)
  const LETTERS = {
    lucky: `THE LUCKY BLOBBIT OF GOOD FORTUNE

      .-""""-.
     / O    O \\
    |  \\____/  |      <-- this is the Lucky Blobbit.
     \\________/           Say hello to him.

This Blobbit has been round the JackNet nine times! He was found
in a shoe in 1997 and he has been bringing good luck ever since.

Send this letter to FIVE friends and something nice will happen
to you within five days!!! People who forwarded it have:
  * found 20p down the back of the sofa
  * got the last shiny sticker for their sticker album
  * been allowed to stay up for the end of the film

If you DON'T forward it... nothing happens. Honestly. But the
Blobbit will look a little bit disappointed. Look at his face.`,
    grot: `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
YOU HAVE TO SEE THIS!!!!! THE DANCING GROT!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

   \\o/      o/      \\o      o      \\o/
    |      /|       |\\     /|\\      |
   / \\     / \\     / \\     / \\    / \\
  (left)  (right)  (left)  (cha cha cha)

My cousin's friend made this on his computer at work and now it's
EVERYWHERE. It was on the news!!! (Local news. On the bit at the
end with the dog that can skateboard.)

The grot does a different dance for everyone who forwards this.
Send it on so your friends can see the grot dance too!!!!`,
    megasoft: `Dear Friends,

My name is Mr. Megabyte and I am the boss of MegaSoft Corporation.
We are testing a brand new e-mail tracking program (MegaTrack 2000)
and we need YOUR help!!!

For every person you forward this letter to, MegaSoft will give
you 1,000 RUPEES!!! For every person THEY forward it to, you get
ANOTHER 500!!! My lawyer's nephew forwarded it and got a new bike!!!

This is NOT a joke. It came from a friend of a friend who works
in computers.

----
(Jack's note: nobody has EVER been paid for forwarding an e-mail.
Not one Rupee. Computers can't count your forwards. That's how you
know it's a hoax. Forward it anyway because it's funny.)`,
    virus: `**********  VIRUS WARNING  **********
***** PLEASE READ AND PASS ON *****

If you get an e-mail called "PENGUIN PARTY" DO NOT OPEN IT!!!!!

It is the WORST virus EVER. JackShield says it will:
  - turn all your desktop icons into penguins
  - make your printer print nothing but the letter Q
  - change your screen saver to a picture of a sandwich
  - make your CD-ROM drawer open and shut on its own (forever)

Forward this to EVERYONE you know so they are warned!!!!
My Mom's friend from work got it and her computer went BEIGE.

----
(Hoax-o-meter: 100%. Real virus warnings never tell you to
"forward this to everyone". There is no Penguin Party virus.
There IS a penguin party in Antarctica, but you're not invited.)`,
    friends: `THE FRIENDSHIP TEST :-)

This letter is for my BEST FRIENDS only!!!

A friend is someone who:
  * lends you their best felt tips (and gets them back with the lids on)
  * knows the cheat codes but lets you find them yourself
  * shares their crisps (even the last one)
  * saves your place in the dinner queue

Send this to 5 friends to show they are your friends.
If you get 1 back... you've got a friend!
If you get 3 back... you are COOL!
If you get 5 back... you are a LEGEND!!!

:-) :-) :-) :-) :-)`,
    y2k: `Y2K SURVIVAL TIPS - PASS IT ON!!!

When the clocks go to 00:00 on 1 January 2000, the Millennium Bug
might do funny things to computers! Here's how to be ready:

  1. Write down your high scores on paper. (Just in case.)
  2. Print out your favourite web pages.
  3. Fill the bath with water. (Mom's idea.)
  4. Have a torch. Have biscuits. Have MORE biscuits.
  5. Say goodbye to your VCR clock. It has been flashing 12:00
     since 1994 anyway.
  6. Tell your Gran her toaster will be fine. (It will.)

Forward this to 5 friends so THEY are ready too!
(Add your own tip in the P.S. box!)`,
    jokes: `THE NEVER-ENDING JOKE CHAIN

RULES: read the joke. Then add YOUR best joke in the P.S. box and
send it to 5 friends. Let's make the longest joke e-mail EVER!!!

Joke #1:
  Q: Why did the computer go to the doctor?
  A: It had a VIRUS! (And a terrible case of the bytes.)

Jokes added by everyone who forwarded it are at the bottom.
WARNING: some of them are Dave's. Sorry.`,
    petition: `PETITION!!! SATURDAY MORNING CARTOONS SHOULD BE ON ALL DAY!!!

We, the kids of the JackNet, think that Saturday morning cartoons
are the best thing on telly and they should be on ALL DAY,
not just until the boring cooking programmes start.

When this petition has 500 names, it will be sent to The Telly.
(The actual telly. We will hold it up to the screen.)

Your name gets added at the bottom when you forward it!
Send it to 5 friends to get more names!!!`,
    pizza: `FREE PIZZA!!! THIS IS REAL!!!

Big Tony's Pizza Palace is celebrating 25 years of pizza and they
are giving a FREE 12-inch pizza to everyone who forwards this e-mail
to 8 people!!! (5 is fine, my cousin said.)

To claim your pizza, just forward this e-mail and Big Tony will
"know". Then wait by the door.

----
(Jack's note: I waited by the door for the WHOLE of Saturday.
No pizza. Mom made fish fingers. Big Tony, if you're reading
this, I'm still waiting.)`,
  };
  const subjOf = (t, gen) => { const s = (K.CHAIN[t] || ['', 'A chain letter'])[1]; if (gen > 7) return `Fwd[${gen}]: ${s}`; const P = ['Fwd: ', 'FW: ', 'Fwd: ', 'Fw: ', 'FWD: ', 'Fwd: ', 'FW: ']; let o = ''; for (let i = 0; i < gen; i++) o += P[i % P.length]; return o + s; };
  function letterText(t, path, count, gen, ch, ni, forPage) {
    const trail = (path || []).map((x, i) => `  ${i + 1}. ${x[0] || '(nobody knows who started it!)'}${x[1] ? ` - P.S. "${x[1]}"` : ''}`).join('\n');
    const quote = (path || []).filter(x => x[0]).map(x => '>').join(' ');
    return `${quote ? quote + ' ' : ''}-------- Forwarded message (${gen > 1 ? 'Fwd x' + gen : 'Fwd'}) --------\n\n${LETTERS[t] || '(The letter got lost in the post.)'}\n\n=============================================\n${count ? `THIS LETTER HAS BEEN ROUND THE JACKNET ${count} TIME${count === 1 ? '' : 'S'}!` : 'THIS LETTER IS BRAND NEW!'}\n${gen ? `You are number ${gen} in the chain.` : 'You started it! Send it to five friends to get it going.'}\n\nPeople who passed it on:\n${trail || '  (you are the first!)'}\n=============================================\n` +
      (forPage ? '' : `\nTO FORWARD THIS LETTER TO UP TO 5 FRIENDS, CLICK HERE:\nhttp://${CHAIN_HOST}/forward/${ch}-${ni}.html\n\nSee where this letter has been (with a family tree!):\nhttp://${CHAIN_HOST}/chain/${ch}.html\n\nIs it TRUE? http://${CHAIN_HOST}/hoax.html\nNo more chain letters, please: http://${CHAIN_HOST}/optout.html\n`);
  }
  W.letterText = letterText;

  // ================================================================ the post (from mods/share.js) -> Outlook Express / the desktop
  const MYCH = 'jhp_share_chains';
  W.deliver = it => {
    const mail = o => { if (!window.JackFiles || !JackFiles.deliver) return false; JackFiles.deliver(Object.assign({ id: 'shz-' + it.id, date: d99(it.ts), time: t99(it.ts) }, o)); return true; };
    const n = nick();
    if (it.k === 'card') {
      const t = (K.CARD[it.c] || ['', '', 'an e-card'])[2];
      if (!mail({ from: 'SparkleCardz! <postie@sparklecardz.webcom>', subj: `You've got an e-card from ${it.from}!`, body: `  .  *  .   S P A R K L E C A R D Z !   .  *  .\n            You've got an e-card!\n\nHi ${n}!\n\n${it.from} has sent you an e-card ("${t}") from SparkleCardz!, the sparkliest e-card site on the Internet.\n\nTo pick up your card, click on this link:\n\nhttp://${CARD_HOST}/pickup/${it.card}.html\n\nOr go to http://${CARD_HOST}/pickup.html and type in your card number:\n\n    ${it.card}\n\nYour card will be kept for 60 days. Have a sparkly day!\n\nThe SparkleCardz! Postie\n\n-----\nSparkleCardz! is FREE. We never ask for anybody's real e-mail address.\nWant to send one back? http://${CARD_HOST}/` })) return false;
      toast('JackMail Express', `You've got an e-card from ${it.from}! (Check your Inbox)`, 6000); sfx('join');
      return true;
    }
    if (it.k === 'pick') {
      const t = (K.CARD[it.c] || ['', '', 'your e-card'])[2], who = it.who || 'a visitor from the real world';
      if (!mail({ from: 'SparkleCardz! <postie@sparklecardz.webcom>', subj: `Your e-card has been picked up!`, body: `Hi ${n}!\n\nGood news! The e-card you sent ("${t}")${it.to ? ` to ${it.to}` : ''} has just been picked up by ${who}!\n\nCard number: ${it.card}\n\nWhy not send another one? We have over ${K.CARDS.length} cards, and every single one plays MUSIC.\n\nhttp://${CARD_HOST}/\n\nThe SparkleCardz! Postie` })) return false;
      return true;
    }
    if (it.k === 'chain') {
      const path = Array.isArray(it.path) ? it.path : [];
      const fromWho = it.from || 'A friend of a friend';
      const addr = (it.from || 'unknown.sender').toLowerCase().replace(/[^a-z0-9_-]/g, '') + '@jacknet.jnet';
      if (!mail({ from: `${fromWho} <${addr}>`, subj: subjOf(it.t, it.gen | 0), mono: true, body: `${it.from ? `Hi ${n}!! ${it.from} here. You HAVE to read this. Don't break the chain!!!\n\n` : 'Somebody sent you this. Nobody knows who. Spooky!!!\n\n'}${letterText(it.t, path, (it.count | 0) || 1, it.gen | 0 || 1, it.ch, it.ni)}` })) return false;
      const l = store.get(MYCH, []).filter(x => !(x.ch === it.ch && x.ni === it.ni)); l.push({ ch: it.ch, ni: it.ni, t: it.t, from: it.from || '', ts: it.ts }); store.set(MYCH, l.slice(-40));
      toast('JackMail Express', `New message: "${subjOf(it.t, it.gen | 0).slice(0, 60)}"`, 5000); sfx('join');
      return true;
    }
    if (it.k === 'disk') {
      SH.addDisk({ id: it.disk, from: it.from, label: it.label, col: it.col, ts: it.ts });
      sfx('thud');
      toast('Drive A:', `${it.from} gave you a floppy disk! "${it.label}" is on your desktop. Double-click it to see what's on it.`, 8000);
      mail({ from: 'Floppy Swap-O-Rama <postbag@floppyswap.webcom>', subj: `${it.from} gave you a floppy disk!`, body: `Hi ${n}!\n\n${it.from} has given you a floppy disk through the Floppy Swap-O-Rama!\n\nLabel: "${it.label}"\nFiles: ${it.files | 0}\n\nIt's on your desktop now (look for the disk icon). Double-click it to look at what's on it, and copy anything you like onto your hard disk.\n\nRemember: always say thank you. And give the disk back. (You don't have to give this one back. It's a magic Internet disk.)\n\nThe Floppy Swap-O-Rama\nhttp://${SH.HOST.floppy}/` });
      return true;
    }
    if (it.k === 'cotm') {
      const place = ['', 'WON', 'came SECOND in', 'came THIRD in'][it.place | 0] || 'did brilliantly in';
      if (!mail({ from: 'Homepagez Awards <awards@coolsite.homepagez>', subj: `Your home page ${place} Cool Site of the Month!`, priority: true, body: `CONGRATULATIONS ${n.toUpperCase()}!!!\n\nYour home page${it.t ? ` "${it.t}"` : ''} ${place} the Homepagez Cool Site of the Month awards for ${K.monthLabel(it.m)}, with ${it.votes | 0} vote${it.votes === 1 ? '' : 's'}!\n\n${it.place === 1 ? 'A GOLD AWARD is now shining on your page for everybody to see,' : 'An award is now on your page,'} and your prize Rupees are already in your JackNet Bank account.\n\nPut a brag button on your page! http://${SH.HOST.brag}/\n\nThe Homepagez Awards Committee (three hamsters and a clipboard)\nhttp://${SH.HOST.cotm}/` })) return false;
      secret('share.cotm.win'); sfx('solve');
      return true;
    }
    return true; // something we don't know about: nothing to show
  };

  // ================================================================ The Chain Letter Tracker
  function cwShell(el, inner, crumbs) {
    el.className = 'shz-site shw-cw';
    el.innerHTML = `<div class="shw-cwhead"><b>THE JACKNET CHAIN LETTER TRACKER</b><span>Fwd: Fwd: FW: Fwd: Science!</span></div>
      <div class="shw-cwnav"><a href="${U('chain')}">Tracker</a><a href="${U('chain', '/mine.html')}">My letters</a><a href="${U('chain', '/start.html')}">Start a chain</a><a href="${U('chain', '/hoax.html')}">Is it TRUE?</a><a href="${U('chain', '/optout.html')}">No more letters</a></div>
      ${crumbs ? `<div class="shw-crumb">${crumbs}</div>` : ''}<div class="shw-cwbody">${inner}</div>
      <div class="shw-cwfoot">The Chain Letter Tracker is run by volunteers (Dave) with a very big piece of graph paper. Every chain letter on JackNet is a harmless joke: nobody gets paid, nothing bad happens if you stop.</div>`;
  }
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' mins ago' : s < 129600 ? Math.round(s / 3600) + ' hours ago' : Math.round(s / 86400) + ' days ago'; };
  const chainRow = x => `<tr><td><a href="${U('chain', '/chain/' + x.id + '.html')}">${esc((K.CHAIN[x.t] || ['', '?'])[1])}</a></td><td class="n">${x.count}</td><td class="n">${x.gens}</td><td>${x.root ? esc(x.root) : '<i>???</i>'}</td><td>${esc(ago(x.last))}</td></tr>`;
  function cwHome(el) {
    cwShell(el, '<p class="shw-wait2">Counting all the Fwd:s on JackNet...</p>');
    SH.req({ t: 'shChains' }).then(r => {
      const b = q(el, '.shw-cwbody'); if (!b) return;
      if (!r || !r.top) { b.innerHTML = '<p>The graph paper has blown away. Try again!</p>'; return; }
      b.innerHTML = `<div class="shw-cwbig"><span class="shw-odo">${esc(String(r.total).padStart(7, '0'))}</span><p>chain letters forwarded on JackNet so far, in ${r.chains} different chains!</p></div>
        <h2>The Top Chains</h2>${r.top.length ? `<table class="shw-tab shw-cwt"><tr><th>Letter</th><th>Times round</th><th>Generations</th><th>Started by</th><th>Last forwarded</th></tr>${r.top.map(chainRow).join('')}</table>` : '<p>No chains yet! Somebody has to start one. <a href="' + U('chain', '/start.html') + '">Will it be you?</a></p>'}
        ${r.fresh.length ? `<h2>Just forwarded</h2><table class="shw-tab shw-cwt"><tr><th>Letter</th><th>Times round</th><th>Generations</th><th>Started by</th><th>Last forwarded</th></tr>${r.fresh.map(chainRow).join('')}</table>` : ''}
        <div class="shw-box">${member() ? `<p>Chain letters for <b>${esc(nick())}</b>: <b>${SH.opt && SH.opt.chains === false ? 'OFF' : 'ON'}</b>. <a href="${U('chain', '/optout.html')}">Change</a></p>` : (window.Guest ? Guest.webNote('Getting and forwarding chain letters') : '')}</div>`;
    });
  }
  function treeHtml(ch) {
    const kids = {}; ch.nodes.forEach((x, i) => { if (i) (kids[x[0]] = kids[x[0]] || []).push(i); });
    const COL = ['#c00000', '#e06000', '#a08000', '#008000', '#0060c0', '#6000c0', '#c000a0'];
    const mine = new Set(ch.mine || []);
    let n = 0;
    const walk = (i, depth) => {
      if (++n > 800 || depth > 60) return '';
      const x = ch.nodes[i], k = kids[i] || [];
      const who = x[1] ? esc(x[1]) : '<i>??? (nobody knows who started it)</i>';
      return `<li class="${mine.has(i) ? 'me' : ''}"><span class="shw-tn" style="--g:${COL[x[2] % COL.length]}"><b>${who}</b>${x[2] ? ` <small>gen ${x[2]} &middot; ${esc(d99(x[3]))}</small>` : ' <small>(the start)</small>'}${x[4] ? ` <em>P.S. ${esc(x[4])}</em>` : ''}${x[5] ? '' : x[2] ? ' <small class="shw-held">(hasn\'t forwarded it yet)</small>' : ''}</span>${k.length ? `<ul>${k.map(j => walk(j, depth + 1)).join('')}</ul>` : ''}</li>`;
    };
    return `<ul class="shw-tree">${walk(0, 0)}</ul>`;
  }
  function cwChain(el, id) {
    cwShell(el, '<p class="shw-wait2">Unrolling the graph paper...</p>', `<a href="${U('chain')}">Tracker</a> &gt; Family tree`);
    SH.req({ t: 'shChain', id }).then(r => {
      const b = q(el, '.shw-cwbody'); if (!b) return;
      const ch = r && r.chain;
      if (!ch) { b.innerHTML = '<h2>Chain not found</h2><p>Somebody broke this chain! (Or the number is wrong.)</p>'; return; }
      secret('share.chain.tree');
      const myOpen = (ch.mine || []).find(i => ch.nodes[i] && !ch.nodes[i][5] && ch.nodes[i][2] > 0) ;
      b.innerHTML = `<h2>${esc((K.CHAIN[ch.t] || ['', '?'])[1])}</h2><div class="shw-cwbig"><span class="shw-odo">${esc(String(ch.count).padStart(5, '0'))}</span><p>This letter has been round the JackNet <b>${ch.count}</b> time${ch.count === 1 ? '' : 's'}! ${ch.gens} generation${ch.gens === 1 ? '' : 's'}, ${ch.people} ${ch.people === 1 ? 'person' : 'people'}.</p></div>
        ${myOpen !== undefined ? `<p class="shw-note">You've got a copy of this one! <a href="${U('chain', '/forward/' + ch.id + '-' + myOpen + '.html')}"><b>Forward it now &gt;&gt;</b></a></p>` : ''}
        <h3>The family tree</h3>${treeHtml(ch)}<p class="small">Started ${esc(d99(ch.ts))}. Last forwarded ${esc(ago(ch.last))}.</p>`;
    });
  }
  function cwForward(el, id, ni) {
    cwShell(el, '<p class="shw-wait2">Finding your copy of the letter...</p>', `<a href="${U('chain')}">Tracker</a> &gt; Forward`);
    if (!member()) { q(el, '.shw-cwbody').innerHTML = window.Guest ? Guest.webNote('Forwarding chain letters') : '<p>Log on first.</p>'; return; }
    SH.req({ t: 'shChain', id }).then(r => {
      const b = q(el, '.shw-cwbody'); if (!b) return;
      const ch = r && r.chain, node = ch && ch.nodes[ni];
      if (!ch || !node) { b.innerHTML = '<h2>That letter has gone!</h2><p>Somebody broke the chain. (Or the address is wrong.)</p>'; return; }
      if (!node[1] || node[1].toLowerCase() !== nick().toLowerCase()) { b.innerHTML = `<h2>That's not your copy!</h2><p>This copy of the letter belongs to somebody else. <a href="${U('chain', '/chain/' + id + '.html')}">See the family tree</a> instead.</p>`; return; }
      const already = new Map(); ch.nodes.forEach(x => { if (x[1]) already.set(x[1].toLowerCase(), 'already got this one'); });
      const path = [];
      { let i = ni, g = 0; while (i >= 0 && ch.nodes[i] && g++ < 200) { path.unshift([ch.nodes[i][1], ch.nodes[i][4] || '']); i = ch.nodes[i][0]; } }
      b.innerHTML = `<div class="shw-cwfw"><div class="shw-letter"><pre></pre></div><div class="shw-fwform">
        ${node[5] ? `<div class="shw-ok">You've already forwarded this letter. The chain lives on! <a href="${U('chain', '/chain/' + id + '.html')}">See how far it has got</a></div>` : `<h3>Forward to up to ${K.LIMITS.fwdMax} friends</h3><div class="shw-fpick"></div>
        <label>Add a P.S. (optional, everybody after you will see it):</label><input type="text" class="shw-ps" maxlength="${K.LIMITS.ps}" placeholder="${ch.t === 'jokes' ? 'Your best joke!' : ch.t === 'y2k' ? 'Your Y2K tip!' : 'P.S. ...'}">
        <div class="shw-btns"><button type="button" class="btn shw-big" data-f>Fwd: it!</button></div><div class="shw-result"></div>`}</div></div>`;
      q(b, '.shw-letter pre').textContent = letterText(ch.t, path.slice(-12), ch.count, node[2], id, ni, true);
      if (node[5]) return;
      const pk = picker(q(b, '.shw-fpick'), { multi: true, max: K.LIMITS.fwdMax, exclude: already, chains: true });
      on(b, '[data-f]', 'click', () => {
        const to = pk.get(); if (!to.length) return msg('Forward', 'Pick some people to send it to first! (Up to five.)', 'warn');
        const res = q(b, '.shw-result'), btn = q(b, '[data-f]'); btn.disabled = true; res.innerHTML = '<p class="shw-wait2">Fwd: Fwd: Fwd:...</p>';
        SH.req({ t: 'shChainFwd', ch: id, ni, to, ps: q(b, '.shw-ps').value }).then(rr => {
          if (!rr || !rr.ok) { btn.disabled = false; res.innerHTML = `<p class="shw-err">${esc((rr && rr.err) || 'The letter got stuck. Try again!')}</p>${rr && rr.skipped && rr.skipped.length ? `<p class="small">${rr.skipped.map(s => esc(s[0]) + ' (' + esc(s[1]) + ')').join(', ')}</p>` : ''}`; sfx('uhoh'); return; }
          sfx('join'); secret('share.chain.fwd'); if (rr.sent.length >= 5) secret('share.chain.five');
          res.innerHTML = `<div class="shw-ok"><b>Forwarded to ${rr.sent.map(esc).join(', ')}!</b><br>The chain lives on! It has now been round the JackNet ${rr.count} times.${rr.skipped.length ? `<br><small>Skipped: ${rr.skipped.map(s => esc(s[0]) + ' (' + esc(s[1]) + ')').join(', ')}</small>` : ''}<br><a href="${U('chain', '/chain/' + id + '.html')}">See the family tree</a></div>`;
          q(b, '.shw-fpick').remove(); q(b, '.shw-ps').disabled = true; btn.remove();
        });
      });
    });
  }
  function cwStart(el) {
    cwShell(el, `<h2>Start a brand-new chain letter</h2><p>Pick a letter. You'll be the very first name on it, and the Tracker will follow it all round JackNet. (One new chain a day.)</p>
      ${member() ? '' : (window.Guest ? Guest.webNote('Starting chain letters') : '')}<div class="shw-tpls">${K.CHAINS.map(c => `<button type="button" class="shw-tpl" data-t="${c[0]}"><b>${esc(c[1])}</b><pre>${esc((LETTERS[c[0]] || '').split('\n').slice(0, 6).join('\n'))}...</pre></button>`).join('')}</div>`, `<a href="${U('chain')}">Tracker</a> &gt; Start`);
    el.addEventListener('click', ev => { const b = ev.target.closest('.shw-tpl'); if (!b) return; need('Starting chain letters', () => {
      SH.req({ t: 'shChainStart', tpl: b.dataset.t }).then(r => { if (!r || !r.ok) return msg('Chain Letter Tracker', (r && r.err) || 'The chain got tangled. Try again.', 'warn'); secret('share.chain.start'); SH.go(U('chain', '/forward/' + r.ch + '-0.html')); });
    }); });
  }
  function cwOpt(el) {
    cwShell(el, '<h2>No more chain letters?</h2><div class="shw-optbox"></div>', `<a href="${U('chain')}">Tracker</a> &gt; No more letters`);
    const box = q(el, '.shw-optbox');
    if (!member()) { box.innerHTML = window.Guest ? Guest.webNote('Getting chain letters') : ''; return; }
    const draw = onNow => { box.innerHTML = `<p>Chain letters for <b>${esc(nick())}</b> are <b class="shw-big2">${onNow ? 'ON' : 'OFF'}</b>.</p><p>${onNow ? 'Now and then a chain letter turns up in your JackMail Express (from another member, or from "a friend of a friend"). They are all harmless jokes.' : 'Nobody can send you chain letters. Peace and quiet!'}</p><button type="button" class="btn">${onNow ? 'Turn chain letters OFF' : 'Turn chain letters back ON'}</button>`;
      on(box, '.btn', 'click', () => SH.req({ t: 'shOpt', chains: !onNow }).then(r => { if (r && typeof r.chains === 'boolean') { SH.opt = { chains: r.chains }; draw(r.chains); toast('Chain Letter Tracker', r.chains ? 'Chain letters are back ON.' : 'No more chain letters. (Shhh.)', 3000); } })); };
    draw(!(SH.opt && SH.opt.chains === false));
  }
  function cwHoax(el) {
    secret('share.chain.hoax');
    cwShell(el, `<h2>Is it TRUE? (No.)</h2><div class="shw-faq">
      <h3>"Forward this and MegaSoft will pay you!"</h3><p>HOAX. E-mail can't count how many times it's been forwarded, and no company pays people to forward e-mails. Nobody has ever been paid. Not one Rupee.</p>
      <h3>"WARNING!!! A terrible virus called..."</h3><p>HOAX (nearly always). Real virus warnings come from virus-checker companies, and they NEVER say "forward this to everyone you know". Don't open attachments from strangers, keep your virus checker up to date, and you'll be fine.</p>
      <h3>"Break the chain and something bad will happen!"</h3><p>NOTHING happens. We checked. Jack broke one in March and the worst thing was he dropped his toast. (Butter side up.)</p>
      <h3>"Free pizza / free trainers / free anything!"</h3><p>HOAX. If it sounds too good to be true, it's a chain letter.</p>
      <h3>So why does the Tracker exist?</h3><p>Because chain letters are FUNNY, and it's interesting to see how far they spread. Forward the funny ones, ignore the rest, and never send anyone's real address or phone number in one.</p></div>`, `<a href="${U('chain')}">Tracker</a> &gt; Is it true?`);
  }
  function cwMine(el) {
    const l = store.get(MYCH, []).slice().reverse();
    cwShell(el, `<h2>My chain letters</h2>${!member() ? (window.Guest ? Guest.webNote('Getting chain letters') : '') : l.length ? `<table class="shw-tab"><tr><th>Letter</th><th>From</th><th>Got it</th><th></th></tr>${l.map(x => `<tr><td>${esc((K.CHAIN[x.t] || ['', '?'])[1])}</td><td>${x.from ? esc(x.from) : '<i>a friend of a friend</i>'}</td><td>${esc(d99(x.ts))}</td><td><a href="${U('chain', '/forward/' + x.ch + '-' + x.ni + '.html')}">Forward</a> | <a href="${U('chain', '/chain/' + x.ch + '.html')}">Tree</a></td></tr>`).join('')}</table>` : '<p>No chain letters yet! They turn up in JackMail Express now and then. Or <a href="' + U('chain', '/start.html') + '">start your own</a>.</p>'}`, `<a href="${U('chain')}">Tracker</a> &gt; My letters`);
  }

  // ================================================================ The Brag Button Factory (canvas)
  function iconDraw(x, ic, cx, cy, s) { // a chunky little icon, s = size
    x.save(); x.translate(cx, cy); x.scale(s / 16, s / 16); x.lineWidth = 1.2; x.strokeStyle = '#000';
    const R = (a, b, w, hh, f) => { x.fillStyle = f; x.fillRect(a, b, w, hh); x.strokeRect(a + .5, b + .5, w - 1, hh - 1); };
    if (ic === 'book') { R(-7, -6, 14, 12, '#c81d1d'); R(-5, -4, 10, 8, '#fff'); x.fillStyle = '#000080'; x.fillRect(-4, -2, 8, 1); x.fillRect(-4, 1, 6, 1); }
    else if (ic === 'joy') { R(-7, 2, 14, 6, '#808080'); x.fillStyle = '#c81d1d'; x.beginPath(); x.arc(0, -5, 4, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#333'; x.fillRect(-1, -2, 2, 5); x.fillStyle = '#ffd400'; x.fillRect(3, 3, 3, 2); }
    else if (ic === 'star' || ic === 'trophy') { if (ic === 'trophy') { R(-5, -7, 10, 8, '#ffd400'); R(-2, 1, 4, 3, '#d8a800'); R(-5, 4, 10, 3, '#8a5a00'); } else { x.fillStyle = '#ffd400'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, r = i % 2 ? 3.2 : 7.5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke(); } }
    else if (ic === 'key') { x.fillStyle = '#ffd400'; x.beginPath(); x.arc(-3, -2, 4, 0, 7); x.fill(); x.stroke(); R(0, -1, 8, 3, '#ffd400'); R(5, 1, 2, 3, '#ffd400'); }
    else if (ic === 'card') { R(-7, -5, 14, 10, '#fff'); R(-7, -5, 14, 3, '#000080'); R(-5, 0, 4, 4, '#c0c0c0'); }
    else if (ic === 'mail') { R(-7, -5, 14, 10, '#fff'); x.beginPath(); x.moveTo(-7, -5); x.lineTo(0, 1); x.lineTo(7, -5); x.stroke(); x.fillStyle = '#ff3399'; x.fillRect(3, -4, 3, 3); }
    else if (ic === 'chain') { x.lineWidth = 2.4; x.strokeStyle = '#c0c0c0'; x.beginPath(); x.ellipse(-3, 0, 4.5, 3, 0, 0, 7); x.stroke(); x.strokeStyle = '#fff'; x.beginPath(); x.ellipse(3, 0, 4.5, 3, 0, 0, 7); x.stroke(); }
    else if (ic === 'house') { x.fillStyle = '#c81d1d'; x.beginPath(); x.moveTo(-8, -1); x.lineTo(0, -8); x.lineTo(8, -1); x.closePath(); x.fill(); x.stroke(); R(-6, -1, 12, 8, '#ffe8b0'); R(-2, 2, 4, 5, '#7a4a1a'); }
    x.restore();
  }
  function bevel(x, w, hh, k) { x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(0, 0, w, k); x.fillRect(0, 0, k, hh); x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, hh - k, w, k); x.fillRect(w - k, 0, k, hh); }
  function fit(x, text, maxW, size, weight, font) { let s = size; do { x.font = `${weight || 'bold'} ${s}px ${font || 'Verdana,Tahoma,Arial,sans-serif'}`; if (x.measureText(text).width <= maxW) break; s -= 0.5; } while (s > 5); return s; }
  const lines88 = (k, g, v) => {
    const N = K.num(v);
    switch (k) {
      case 'gb': return ["I SIGNED JACK'S", 'GUESTBOOK!']; case 'score': return [(K.GAMES[g] || ['GAME'])[0], K.fmtScore(g, v)]; case 'rank': return ['RANK:', String(v).toUpperCase()];
      case 'secrets': return ['SECRETS', N + ' FOUND']; case 'member': return ['JACKNET', 'MEMBER #' + N]; case 'cards': return ['E-CARDS', N + ' SENT'];
      case 'chain': return ['MY CHAINS', N + ' FWDS']; case 'cotm': return ['COOL SITE', K.monthLabel(v).toUpperCase()]; case 'hp': return ['MY PAGE', N + ' HITS'];
    }
    return ['JACK', 'ATTACK!'];
  };
  W.drawSmall = (cv, k, g, v) => {
    cv.width = 88; cv.height = 31; const x = cv.getContext('2d'); if (!x) return cv;
    const B = K.BADGES[k] || K.BADGES.gb, gr = x.createLinearGradient(0, 0, 0, 31); gr.addColorStop(0, B[2]); gr.addColorStop(1, B[1]);
    x.fillStyle = gr; x.fillRect(0, 0, 88, 31);
    x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(1, 1, 86, 13);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(28, 3, 1, 25);
    iconDraw(x, B[4], 14, 15.5, 17);
    const [a, b] = lines88(k, g, v);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff'; fit(x, a, 56, 8); x.fillText(a, 58, 9.5);
    x.fillStyle = B[3]; fit(x, b, 57, 10); x.fillText(b, 58, 21.5);
    bevel(x, 88, 31, 1);
    x.strokeStyle = '#000'; x.strokeRect(.5, .5, 87, 30);
    return cv;
  };
  W.drawBig = (cv, k, g, v, name) => {
    const w = 400, hh = 210; cv.width = w; cv.height = hh; const x = cv.getContext('2d'); if (!x) return cv;
    const B = K.BADGES[k] || K.BADGES.gb, T = K.badgeText(k, g, v, name);
    const gr = x.createLinearGradient(0, 0, w, hh); gr.addColorStop(0, B[1]); gr.addColorStop(1, B[2]); x.fillStyle = gr; x.fillRect(0, 0, w, hh);
    x.save(); x.translate(80, 105); x.globalAlpha = .18; x.fillStyle = '#fff'; for (let i = 0; i < 16; i++) { x.rotate(Math.PI / 8); x.beginPath(); x.moveTo(0, 0); x.lineTo(260, -26); x.lineTo(260, 26); x.closePath(); x.fill(); } x.restore();
    x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(82, 108, 56, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(80, 105, 56, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = B[1]; x.stroke();
    iconDraw(x, B[4], 80, 105, 72);
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    // the big words, wrapped onto up to three lines
    const words = T.big.split(' '), lines = []; let cur = '';
    x.font = 'bold 26px Impact,"Arial Black",Arial,sans-serif';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (x.measureText(t).width > 236 && cur) { lines.push(cur); cur = wd; } else cur = t; } if (cur) lines.push(cur);
    const L3 = lines.slice(0, 3), y0 = 105 - (L3.length - 1) * 16;
    L3.forEach((l, i) => { const s = fit(x, l, 240, 28, 'bold', 'Impact,"Arial Black",Arial,sans-serif'); x.font = `bold ${s}px Impact,"Arial Black",Arial,sans-serif`; x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,.55)'; x.strokeText(l, 150, y0 + i * 32); x.fillStyle = B[3]; x.fillText(l, 150, y0 + i * 32); });
    x.font = 'bold 13px Verdana,Tahoma,sans-serif'; x.fillStyle = '#fff'; x.fillText(T.small, 150, y0 + L3.length * 32 - 6);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, hh - 26, w, 26);
    x.font = 'bold 12px Verdana,Tahoma,sans-serif'; x.fillStyle = '#ffd400'; x.fillText('~' + String(name || '').slice(0, 20), 10, hh - 9);
    x.textAlign = 'right'; x.fillStyle = '#fff'; x.fillText('JACK ATTACK! Online - jacklm.com', w - 10, hh - 9);
    bevel(x, w, hh, 2); x.strokeStyle = '#000'; x.lineWidth = 1; x.strokeRect(.5, .5, w - 1, hh - 1);
    return cv;
  };
  function bbShell(el, inner, crumbs) {
    el.className = 'shz-site shw-bb';
    el.innerHTML = `<div class="shw-bbhead"><b>The Brag Button Factory</b><span>Proper 88x31 buttons for your home page. Hand-made by robots.</span></div><div class="shw-bbnav"><a href="${U('brag')}">Make buttons</a><a href="${U('brag', '/about.html')}">What's an 88x31?</a><a href="${SH.HOST.cotm ? U('cotm') : '#'}">Cool Site of the Month</a></div>${crumbs ? `<div class="shw-crumb">${crumbs}</div>` : ''}<div class="shw-bbbody">${inner}</div><div class="shw-bbfoot">Every number on a Brag Button is checked by our robots (on the JackNet server). No fibbing! &middot; (c) 1999 The Brag Button Factory</div>`;
  }
  function badgeList(st) {
    const out = [];
    const add = (k, g, v, hint) => out.push({ k, g: g || '', v, hint });
    add('gb', '', st.gb ? 1 : null, "Sign Jack's Guestbook (on the Letters page) first!");
    const games = Object.keys(st.best || {}).filter(g => K.GAMES[g]);
    games.forEach(g => add('score', g, st.best[g]));
    if (!games.length) add('score', 'tris', null, 'Get a score on a High Score table (Games Arcade) while you\'re logged on!');
    add('rank', '', st.rank && st.rank.title ? st.rank.title : null, 'Earn some XP on JackNet first!');
    add('secrets', '', st.secrets > 0 ? st.secrets : null, 'Find some secrets on the family PC!');
    add('member', '', st.no > 0 ? st.no : null, '');
    add('cards', '', st.cards > 0 ? st.cards : null, 'Send an e-card from SparkleCardz!');
    add('chain', '', st.chain > 0 ? st.chain : null, 'Start a chain letter and get it forwarded!');
    add('hp', '', st.hp >= 0 ? st.hp : null, 'Build a home page with Homepagez PageBuilder!');
    add('cotm', '', st.cotm || null, 'Win Cool Site of the Month!');
    return out;
  }
  function bbHome(el, focus) {
    bbShell(el, '<p class="shw-wait2">Warming up the button machine...</p>');
    const b = q(el, '.shw-bbbody');
    if (!member()) { b.innerHTML = `<p>Brag Buttons show off what YOU have done on JackNet: high scores, secrets, your rank, your home page. Every number is checked by our robots, so they're 100% true!</p>${window.Guest ? Guest.webNote('Making brag buttons') : ''}<div class="shw-bbdemo"></div>`; const d = q(b, '.shw-bbdemo'); [['gb', '', 1], ['score', 'tris', 12345], ['member', '', 42]].forEach(([k, g, v]) => { const cv = document.createElement('canvas'); W.drawSmall(cv, k, g, v); d.appendChild(cv); }); return; }
    SH.req({ t: 'shBrag' }).then(r => {
      const st = r && r.stats; if (!b.isConnected) return;
      if (!st) { b.innerHTML = '<p>The button machine is jammed. Try again!</p>'; return; }
      const list = badgeList(st);
      b.innerHTML = `<p>Hello <b>${esc(st.name)}</b>! Here are your Brag Buttons. Put them on your home page, save them to your computer, or send a link to a friend!</p><div class="shw-bbgrid"></div>`;
      const grid = q(b, '.shw-bbgrid');
      list.forEach(it => {
        const card = document.createElement('div'); card.className = 'shw-bbcard' + (it.v == null ? ' locked' : ''); card.dataset.k = it.k + (it.g ? '-' + it.g : '');
        const T = it.v == null ? null : K.badgeText(it.k, it.g, it.v, st.name);
        card.innerHTML = `<h4>${esc(K.BADGES[it.k][0])}${it.g ? ': ' + esc(K.GAMES[it.g][0]) : ''}</h4><div class="shw-bbprev"><canvas class="s" width="88" height="31"></canvas><canvas class="b" width="400" height="210"></canvas></div>${it.v == null ? `<p class="shw-lock">&#128274; ${esc(it.hint)}</p>` : `<p class="small">"${esc(T.big)}"</p><div class="shw-btns"><a class="btn" data-dl="s" href="#">Save Picture As... (88x31)</a><a class="btn" data-dl="b" href="#">Save Picture As... (400x210)</a><button type="button" class="btn" data-sh>Get a link to show off</button></div>`}`;
        grid.appendChild(card);
        const cs = q(card, 'canvas.s'), cb = q(card, 'canvas.b');
        W.drawSmall(cs, it.k, it.g, it.v == null ? (it.k === 'score' ? 0 : '?') : it.v); W.drawBig(cb, it.k, it.g, it.v == null ? (it.k === 'score' ? 0 : '?') : it.v, st.name);
        if (it.v == null) return;
        qa(card, '[data-dl]').forEach(a => a.addEventListener('click', ev => {
          const cv = a.dataset.dl === 's' ? cs : cb;
          let url = ''; try { url = cv.toDataURL('image/png'); } catch (e) { return; }
          a.href = url; a.download = `brag-${it.k}${it.g ? '-' + it.g : ''}${a.dataset.dl === 's' ? '-88x31' : ''}.png`;
          secret('share.badge.save'); toast('Save Picture As...', 'Saved! (Look in your Downloads.) Put it on your home page!', 4000);
          // (the browser does the actual saving: the link now points at the picture)
          ev.stopPropagation();
        }));
        on(card, '[data-sh]', 'click', () => SH.req({ t: 'shBadge', k: it.k, g: it.g }).then(rr => {
          if (!rr || !rr.ok) return msg('Brag Button Factory', (rr && rr.err) || 'The button machine is jammed.', 'warn');
          secret('share.badge.share');
          SH.linkBox('Show off!', `Here's a link to your brag badge: "${T.big}". When your friends open it, they see it on JACK ATTACK! Online. Can they beat it?`, SH.real('/badge/' + rr.id), T.og);
        }));
      });
      if (focus) { const f = q(grid, `[data-k="${focus}"]`) || q(grid, `[data-k^="${focus.split('-')[0]}"]`); if (f) { f.classList.add('focus'); setTimeout(() => f.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300); } }
    });
  }
  function bbView(el, id) {
    bbShell(el, '<p class="shw-wait2">Fetching the brag badge...</p>', `<a href="${U('brag')}">Home</a> &gt; Brag badge`);
    SH.req({ t: 'shBadgeGet', id }).then(r => {
      const b = q(el, '.shw-bbbody'); if (!b) return;
      const bd = r && r.badge;
      if (!bd) { b.innerHTML = '<h2>Badge not found</h2><p>That button has fallen off somebody\'s jacket. <a href="' + U('brag') + '">Make your own!</a></p>'; return; }
      const T = K.badgeText(bd.k, bd.g, bd.v, bd.n);
      b.innerHTML = `<div class="shw-bbshow"><h2>${esc(bd.n)} is showing off!</h2><canvas width="400" height="210"></canvas><p class="shw-big2">"${esc(T.big)}"</p><p class="small">Checked by the Brag Button robots on ${esc(d99(bd.ts))}. 100% true!</p>
        <div class="shw-btns">${bd.k === 'score' ? '<button type="button" class="btn shw-big" data-p>Can you beat it? Play now!</button>' : ''}<a class="btn" href="${U('brag')}">Make your own brag buttons</a>${bd.k === 'hp' || bd.k === 'cotm' ? `<a class="btn" href="${esc(SH.homeUrl(String(bd.n).toLowerCase()))}">Visit ${esc(bd.n)}'s home page</a>` : ''}</div></div>`;
      W.drawBig(q(b, 'canvas'), bd.k, bd.g, bd.v, bd.n);
      on(b, '[data-p]', 'click', () => { if (bd.g === 'tris' && window.IE) IE.go('home', 'click'); else if (window.IE) IE.go('demos', 'click'); });
    });
  }
  function bbAbout(el) {
    bbShell(el, `<h2>What's an 88x31?</h2><div class="shw-faq"><p>An 88x31 is a little button, 88 pixels wide and 31 pixels tall. EVERY good home page has a row of them at the bottom: "Best viewed with...", "Made with Notepad", "Y2K compliant!"... It's the law of the Web.</p><p>Brag Buttons are 88x31s that show off something YOU did. The big 400x210 ones are for sending to your mates.</p><h3>How do I put one on my page?</h3><p>Save it to your computer (Save Picture As...). Homepagez PageBuilder has its own buttons in the "Badges" box, too!</p><h3>Can I make one that says I scored a MILLION?</h3><p>No! Our robots check every number on the JackNet server. If you want a million, you'll have to score a million.</p></div>`, `<a href="${U('brag')}">Home</a> &gt; About`);
  }

  // ================================================================ Floppy Swap-O-Rama + DiskSwap 1.44 + the floppy viewer
  const STK = { // label stickers (tiny SVG)
    star: '<path d="M8 1l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5z" fill="#ffd400" stroke="#a07000"/>', heart: '<path d="M8 14C1 9 1 4 4 3s4 2 4 2 1-3 4-2 3 6-4 11z" fill="#e8003c" stroke="#700"/>',
    skull: '<circle cx="8" cy="7" r="6" fill="#fff" stroke="#000"/><rect x="5" y="11" width="6" height="4" fill="#fff" stroke="#000"/><circle cx="6" cy="7" r="1.6"/><circle cx="10" cy="7" r="1.6"/>',
    ork: '<path d="M2 4q6-4 12 0v6q-2 5-6 5t-6-5z" fill="#4cb83a" stroke="#0a3a0a"/><circle cx="5.5" cy="7" r="1.4" fill="#e10600"/><circle cx="10.5" cy="7" r="1.4" fill="#e10600"/><path d="M5 11l1-2 1 2M9 11l1-2 1 2" fill="#fff"/>',
    squig: '<path d="M2 11q-1-8 6-9q7 1 6 9q-1 3-6 3t-6-3z" fill="#e10600" stroke="#000"/><circle cx="6" cy="7" r="1.8" fill="#ff0"/><circle cx="10" cy="7" r="1.8" fill="#ff0"/>',
    smiley: '<circle cx="8" cy="8" r="7" fill="#ffd400" stroke="#a07000"/><circle cx="5.5" cy="6.5" r="1"/><circle cx="10.5" cy="6.5" r="1"/><path d="M4.5 9.5q3.5 4 7 0" stroke="#000" fill="none"/>',
    rocket: '<path d="M8 1l3 5v6H5V6z" fill="#e10600" stroke="#000"/><circle cx="8" cy="7" r="1.5" fill="#9fd0ff"/><path d="M5 10l-2 4h2zM11 10l2 4h-2z" fill="#ffd400"/>',
    bolt: '<path d="M9 1L3 9h4l-1 6 6-8H8z" fill="#ffd400" stroke="#a07000"/>', cube: '<rect x="2" y="2" width="12" height="12" fill="#111"/><rect x="3" y="3" width="3" height="3" fill="#e10600"/><rect x="7" y="3" width="3" height="3" fill="#fff"/><rect x="11" y="3" width="2" height="3" fill="#2a6ad8"/><rect x="3" y="7" width="3" height="3" fill="#ffd400"/><rect x="7" y="7" width="3" height="3" fill="#2aa84a"/><rect x="11" y="7" width="2" height="3" fill="#ff8c00"/><rect x="3" y="11" width="3" height="2" fill="#2a6ad8"/><rect x="7" y="11" width="3" height="2" fill="#e10600"/><rect x="11" y="11" width="2" height="2" fill="#fff"/>',
    alien: '<ellipse cx="8" cy="7" rx="6" ry="7" fill="#7aff3a" stroke="#0a5a0a"/><ellipse cx="5.5" cy="7" rx="2" ry="3" transform="rotate(-20 5.5 7)"/><ellipse cx="10.5" cy="7" rx="2" ry="3" transform="rotate(20 10.5 7)"/>',
    ghost: '<path d="M3 15V7a5 5 0 0 1 10 0v8l-2-2-1.5 2L8 13l-1.5 2L5 13z" fill="#fff" stroke="#888"/><circle cx="6.5" cy="7" r="1"/><circle cx="9.5" cy="7" r="1"/>',
    flower: '<circle cx="8" cy="4" r="3" fill="#ff69b4"/><circle cx="4" cy="8" r="3" fill="#ff69b4"/><circle cx="12" cy="8" r="3" fill="#ff69b4"/><circle cx="8" cy="12" r="3" fill="#ff69b4"/><circle cx="8" cy="8" r="2.4" fill="#ffd400"/>',
  };
  const HANDF = { marker: '"Comic Sans MS","Comic Sans",cursive', biro: '"Segoe Print","Bradley Hand","Comic Sans MS",cursive', caps: 'Impact,"Arial Black",sans-serif', neat: '"Times New Roman",Times,serif' };
  function floppySvg(d, big) {
    const col = d.col || '#262626', light = col === '#e8e8e8' || col === '#e8c000';
    const stk = (d.stk || []).filter(s => STK[s]).slice(0, 4).map((s, i) => `<g transform="translate(${20 + i * 22} ${150}) scale(1.2)">${STK[s]}</g>`).join('');
    const label = esc(String(d.label || '').slice(0, 24));
    const fs = Math.max(10, Math.min(20, 300 / Math.max(6, label.length)));
    return `<svg class="shw-floppy${big ? ' big' : ''}" viewBox="0 0 200 200" aria-hidden="true"><path d="M6 4h168l20 20v170H6z" fill="${col}" stroke="#000" stroke-width="2"/>${col === '#40b8b8' ? '<path d="M6 4h168l20 20v170H6z" fill="#fff" opacity=".25"/>' : ''}<rect x="44" y="4" width="104" height="58" fill="#c8c8c8" stroke="#555"/><rect x="108" y="12" width="22" height="42" fill="${col}"/><rect x="56" y="10" width="10" height="46" fill="#a8a8a8"/>
      <rect x="22" y="82" width="156" height="104" fill="#fffdf0" stroke="#999"/><rect x="22" y="82" width="156" height="14" fill="${light ? '#2a6ad8' : col}" opacity=".85"/>${[110, 126, 142, 158, 174].map(y => `<path d="M28 ${y}h144" stroke="#b8c8f0"/>`).join('')}
      <text x="100" y="${128}" text-anchor="middle" font-family='${HANDF[d.hand] || HANDF.marker}' font-size="${fs.toFixed(1)}" fill="${d.hand === 'biro' ? '#1d3fa8' : '#111'}" transform="rotate(-2 100 128)">${label || '&#160;'}</text>${stk}
      <rect x="10" y="182" width="8" height="8" fill="#000"/><text x="186" y="196" text-anchor="end" font-size="8" fill="${light ? '#000' : '#ddd'}" font-family="Arial">1.44MB</text></svg>`;
  }
  W.floppySvg = floppySvg;
  function fsShell(el, inner) {
    el.className = 'shz-site shw-fs';
    el.innerHTML = `<div class="shw-fshead">${floppySvg({ col: '#1d4fd8', label: 'SWAP-O-RAMA!', hand: 'marker', stk: ['star', 'smiley'] })}<div><b>Floppy Swap-O-Rama</b><span>Fill a disk. Write a label. Give it to a mate. Over the INTERNET!</span></div></div><div class="shw-fsnav"><a href="${U('floppy')}">Home</a><a href="${U('floppy', '/labels.html')}">Label gallery</a></div><div class="shw-fsbody">${inner}</div><div class="shw-fsfoot">Floppy Swap-O-Rama &middot; "Have you got my disk back yet?" &middot; Disks are checked for viruses with a very small magnifying glass.</div>`;
  }
  function fsHome(el) {
    const has = !window.Setup || Setup.has('share.diskswap');
    const mine = SH.disks();
    fsShell(el, `<div class="shw-fsgrid"><div><h2>How it works</h2><ol class="shw-steps"><li><b>Download DiskSwap 1.44</b> (FREE! Only 288 KB. About a minute on a 56K modem.)</li><li><b>Write a label</b> in felt tip, pick a colour of disk and stick some stickers on it.</li><li><b>Put stuff on it:</b> your Paint pictures, Notepad files, and a shortcut to your home page.</li><li><b>Give it</b> to another JackNet member. It turns up on THEIR desktop!</li></ol>
      <p class="shw-dlrow"><button type="button" class="btn shw-big" data-dl>${has ? '&#9654; Run DiskSwap 1.44' : '&#11015; Download DiskSwap 1.44 (FREE!)'}</button></p>
      ${member() ? '' : (window.Guest ? Guest.webNote('Swapping floppy disks') : '')}</div>
      <div><div class="shw-box"><h3>Disks swapped so far</h3><p class="shw-ctr"><span class="shw-odo">....</span></p></div>
      <div class="shw-box"><h3>Disks on my desk</h3>${mine.length ? mine.map(d => `<p><button type="button" class="btn" data-open="${esc(d.id)}">Open</button> "${esc(d.label)}" from <b>${esc(d.from)}</b></p>`).join('') : '<p>Nobody has given you a disk yet. Give somebody one first: they might give you one back!</p>'}</div></div></div>`);
    on(el, '[data-dl]', 'click', () => { if (!window.Setup || Setup.has('share.diskswap')) A.open('share.diskswap'); else Setup.download('share.diskswap'); });
    el.addEventListener('click', ev => { const b = ev.target.closest('[data-open]'); if (b) A.open('share.disk', b.dataset.open); });
    SH.req({ t: 'shStats' }).then(r => { const o = q(el, '.shw-odo'); if (o && r && r.disks != null) o.textContent = String(r.disks).padStart(5, '0'); });
  }
  function fsLabels(el) {
    const EX = [{ col: '#262626', label: 'GAMES (DO NOT WIPE)', hand: 'caps', stk: ['skull'] }, { col: '#ff69b4', label: 'my pictures', hand: 'marker', stk: ['heart', 'flower'] }, { col: '#1a9a3a', label: "Dave's ORK army", hand: 'marker', stk: ['ork', 'squig'] },
      { col: '#e8e8e8', label: 'Homework (honest)', hand: 'neat', stk: [] }, { col: '#e8c000', label: 'SPACE STUFF', hand: 'biro', stk: ['rocket', 'alien'] }, { col: '#40b8b8', label: 'Disk 3 of 14', hand: 'biro', stk: ['cube'] }];
    fsShell(el, `<h2>The Label Gallery</h2><p>The best-labelled disks on JackNet this week. (Ours. We labelled them.)</p><div class="shw-labels">${EX.map(d => `<div>${floppySvg(d)}</div>`).join('')}</div>`);
  }
  // -- reading files off this PC
  const MD = 'C:/My Documents';
  function candidates() {
    const out = [];
    const md = A.fs.get(MD); (md && md.kids || []).forEach(n => { if (n.type === 'txt' && !n.hidden && !n.locked) out.push({ k: 'txt', node: n, n: n.name, where: 'My Documents' }); });
    const fc = A.fs.get(SH.COPYDIR); (fc && fc.kids || []).forEach(n => { if (n.type === 'txt') out.push({ k: 'txt', node: n, n: n.name, where: 'From Floppy Disks' }); });
    const pics = A.fs.get(MD + '/My Pictures'); (pics && pics.kids || []).forEach(n => { if ((n.type === 'png' || n.type === 'img') && !n.hidden && (n.dataURL || n.painted)) out.push({ k: 'img', node: n, n: n.name, where: 'My Pictures' }); });
    return out;
  }
  function shrinkImg(dataURL) { // a Paint picture as small as it'll go (PNG or JPEG, whichever is smaller; smaller pictures if it's still too big)
    return new Promise(res => {
      const im = new Image();
      im.onload = () => {
        let scale = 1, best = '';
        for (let tries = 0; tries < 5; tries++) {
          const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * scale)); c.height = Math.max(1, Math.round(im.height * scale));
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          let p = '', j = ''; try { p = c.toDataURL('image/png'); j = c.toDataURL('image/jpeg', 0.82); } catch (e) {}
          best = p && (!j || p.length <= j.length) ? p : j;
          if (best && best.length <= K.DISK.img - 64) break;
          scale *= 0.72;
        }
        res(best && best.length <= K.DISK.img - 64 ? best : '');
      };
      im.onerror = () => res('');
      im.src = dataURL;
    });
  }
  const fmtB = n => K.num(n) + ' bytes';
  W.diskSwap = (w, arg) => {
    const D = { label: '', col: '#1d4fd8', hand: 'marker', stk: [], note: '', files: [] };
    const b = w.body; b.innerHTML = '';
    const root = document.createElement('div'); root.className = 'shw-ds';
    root.innerHTML = `<div class="shw-dsl"><div class="shw-dsprev"></div>
        <div class="group"><span class="lg">Label</span><input type="text" class="shw-dlab" maxlength="${K.DISK.label}" placeholder="Write on the label..." aria-label="Label">
        <div class="shw-dsrow"><span>Disk:</span><span class="shw-cols">${K.DISK_COLS.map(c => `<button type="button" class="shw-col" data-c="${c[0]}" title="${esc(c[1])}" style="background:${c[0]}"></button>`).join('')}</span></div>
        <div class="shw-dsrow"><span>Writing:</span><select class="shw-hand">${K.DISK_HANDS.map(x => `<option value="${x[0]}">${esc(x[1])}</option>`).join('')}</select></div>
        <div class="shw-dsrow"><span>Stickers:</span><span class="shw-stks">${K.DISK_STK.map(s => `<button type="button" class="shw-stk" data-s="${s}" title="${s}"><svg viewBox="0 0 16 16" width="18" height="18">${STK[s]}</svg></button>`).join('')}</span></div></div>
      </div><div class="shw-dsr"><div class="shw-dsbar"><button type="button" class="btn" data-a="add">&#128190; Put files on...</button><button type="button" class="btn" data-a="give">&#10148; Give to...</button></div>
        <div class="field shw-dsfiles"></div>
        <div class="shw-cap"><div class="shw-capbar"><i></i></div><span class="shw-capt"></span></div>
        <div class="group"><span class="lg">README.TXT (a note on the disk)</span><textarea class="shw-dnote" maxlength="${K.DISK.note}" rows="3" placeholder="Hi! Here's my stuff. Give it back! (You don't have to.)"></textarea></div></div>`;
    b.appendChild(root);
    const prev = q(root, '.shw-dsprev'), files = q(root, '.shw-dsfiles');
    const used = () => D.files.reduce((n, f) => n + K.diskSize(f), 0) + (D.note ? K.utf8(D.note) : 0);
    function draw() {
      prev.innerHTML = floppySvg(D, true);
      qa(root, '.shw-col').forEach(x => x.classList.toggle('on', x.dataset.c === D.col));
      qa(root, '.shw-stk').forEach(x => x.classList.toggle('on', D.stk.includes(x.dataset.s)));
      files.innerHTML = D.files.length ? D.files.map((f, i) => `<div class="shw-dsf"><span class="shw-fic">${f.k === 'img' ? '&#127912;' : f.k === 'url' ? '&#127760;' : '&#128196;'}</span><span class="shw-fn">${esc(f.n)}</span><span class="shw-fz">${esc(K.num(K.diskSize(f)))} bytes</span><button type="button" class="btn" data-rm="${i}" aria-label="Take off">x</button></div>`).join('') : '<div class="shw-empty">The disk is empty. Click "Put files on..." to add your Paint pictures, Notepad files and more.</div>';
      const u = used(), pct = Math.min(100, u / K.DISK.bytes * 100);
      q(root, '.shw-capbar i').style.width = pct.toFixed(1) + '%'; q(root, '.shw-capbar').classList.toggle('full', pct > 90);
      q(root, '.shw-capt').textContent = `${fmtB(u)} used, ${fmtB(Math.max(0, K.DISK.bytes - u))} free`;
      w.setTitle('DiskSwap 1.44 - ' + (D.label || '(untitled disk)'));
      if (w.status) w.status.textContent = `${D.files.length} of ${K.DISK.files} files | 3½" High Density | Drive A:`;
    }
    on(root, '.shw-dlab', 'input', ev => { D.label = ev.target.value; draw(); });
    on(root, '.shw-hand', 'change', ev => { D.hand = ev.target.value; draw(); });
    on(root, '.shw-dnote', 'input', ev => { D.note = ev.target.value; draw(); });
    root.addEventListener('click', ev => {
      const c = ev.target.closest('.shw-col'); if (c) { D.col = c.dataset.c; sfx('click'); return draw(); }
      const s = ev.target.closest('.shw-stk'); if (s) { const k = s.dataset.s; if (D.stk.includes(k)) D.stk = D.stk.filter(x => x !== k); else { if (D.stk.length >= 4) { toast('DiskSwap', 'Only four stickers fit on a label! (Take one off first.)', 3000); return; } D.stk.push(k); } sfx('pet'); return draw(); }
      const r = ev.target.closest('[data-rm]'); if (r) { D.files.splice(+r.dataset.rm, 1); sfx('thud'); return draw(); }
      const a = ev.target.closest('[data-a]'); if (a) act(a.dataset.a);
    });
    function addFile(f) {
      if (D.files.length >= K.DISK.files) return msg('DiskSwap', `The disk's directory is full! (${K.DISK.files} files is the most DiskSwap can fit.)`, 'warn');
      if (D.files.some(x => x.n.toLowerCase() === f.n.toLowerCase())) return msg('DiskSwap', `There's already a file called ${f.n} on the disk.`, 'warn');
      if (used() + K.diskSize(f) > K.DISK.bytes) { secret('share.disk.full'); sfx('uhoh'); return msg('Disk Full', `There is not enough room on the disk to copy ${f.n}.\n\n${f.n} needs ${fmtB(K.diskSize(f))}, but there are only ${fmtB(Math.max(0, K.DISK.bytes - used()))} free.\n\nA 3½" floppy only holds 1.44 MB. (Paint pictures are BIG bitmaps.) Take something off, or use another disk.`, 'warn'); }
      D.files.push(f); sfx('click'); draw(); return true;
    }
    function addPicker() {
      const list = candidates();
      const pb = document.createElement('div'); pb.className = 'shw-addf';
      pb.innerHTML = `<p style="margin:0 0 6px">Pick something to copy onto the disk:</p><div class="field shw-addl">${list.map((c, i) => `<button type="button" class="shw-pr" data-i="${i}"><span>${c.k === 'img' ? '&#127912;' : '&#128196;'}</span><span>${esc(c.n)}</span><small>${esc(c.where)}</small></button>`).join('')}${member() ? '<button type="button" class="shw-pr" data-hp><span>&#127760;</span><span>Shortcut to my home page.url</span><small>Homepagez</small></button>' : ''}${list.length ? '' : '<div class="shw-pmsg">No files yet! Draw something in Paint or write something in Notepad first.</div>'}</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn" data-x>Close</button></div>`;
      const pw = A.win('Put files on the disk', pb, { w: 380, h: 360, icon: SH.ICONS.disk, noMax: true });
      on(pb, '[data-x]', 'click', pw.close);
      pb.addEventListener('click', ev => {
        const r = ev.target.closest('.shw-pr'); if (!r) return;
        if (r.dataset.hp !== undefined) { addFile({ k: 'url', n: 'My home page.url', u: SH.homeUrl(nick().toLowerCase()), ti: nick() + "'s home page" }); return; }
        const c = list[+r.dataset.i]; if (!c) return;
        if (c.k === 'txt') { const t = String(c.node.text || ''); if (!t.trim()) return msg('DiskSwap', `${c.n} is empty!`, 'warn'); if (t.length > K.DISK.txt) return msg('DiskSwap', `${c.n} is too long for DiskSwap (the most is ${K.num(K.DISK.txt)} letters).`, 'warn'); addFile({ k: 'txt', n: c.n, t }); }
        else { r.disabled = true; const src = c.node.dataURL; if (!src) { r.disabled = false; return msg('DiskSwap', 'That picture can\'t be read. (Is it still being painted?)', 'warn'); }
          shrinkImg(src).then(d => { r.disabled = false; if (!d) return msg('DiskSwap', `${c.n} is too big to fit on a floppy, even squashed!`, 'warn'); addFile({ k: 'img', n: c.n, d }); }); }
      });
    }
    function give() {
      if (!member()) return need('Swapping floppy disks', give);
      if (!D.files.length && !D.note.trim()) return msg('DiskSwap', 'The disk is empty! Put something on it first.', 'warn');
      if (!D.label.trim()) return msg('DiskSwap', 'Write something on the label first! (An unlabelled disk ALWAYS gets wiped by accident.)', 'warn');
      const gb = document.createElement('div');
      gb.innerHTML = '<p style="margin:0 0 6px">Who do you want to give the disk to?</p><div class="shw-gpick"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn dflt" data-g>Give it!</button><button type="button" class="btn" data-x>Cancel</button></div>';
      const gw = A.win('Give the disk to...', gb, { w: 380, h: 420, icon: SH.ICONS.disk, noMax: true });
      const pk = picker(q(gb, '.shw-gpick'), {});
      on(gb, '[data-x]', 'click', gw.close);
      on(gb, '[data-g]', 'click', () => { const to = pk.get()[0]; if (!to) return msg('DiskSwap', 'Pick somebody first!', 'warn'); gw.close(); upload(to); });
    }
    function upload(to) {
      const json = JSON.stringify({ to, label: D.label, col: D.col, hand: D.hand, stk: D.stk, note: D.note, files: D.files });
      let b64; try { b64 = btoa(unescape(encodeURIComponent(json))); } catch (e) { return msg('DiskSwap', 'The disk got scrambled. Try again.', 'warn'); }
      const CH = 3000, n = Math.ceil(b64.length / CH), up = 'u' + Date.now().toString(36), rid = Math.floor(Math.random() * 9e8) + 1;
      const pb = document.createElement('div');
      pb.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${SH.ICONS.disk.replace('<svg', '<svg width="32" height="32"')}<div class="shw-uplog">Copying files to A:...</div></div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div><p class="small shw-upm">${esc(to)} is going to love this.</p>`;
      const pw = A.win('Copying...', pb, { w: 360, noResize: true, noMax: true, noMin: true, icon: SH.ICONS.disk });
      const bar = q(pb, '.prog span'), log = q(pb, '.shw-uplog');
      let i = 0, done = false, blocks = 0;
      const off = SH.on('shDiskDone', m => {
        if (m.rid !== rid || done) return; done = true; off(); clearInterval(t);
        if (!m.ok) { pw.close(); sfx('uhoh'); return msg('DiskSwap', m.err || 'The disk got stuck in the post.', 'warn'); }
        while (bar.children.length < 26) bar.appendChild(document.createElement('i'));
        log.textContent = 'Done! Writing the FAT... Ejecting...';
        sfx('thud'); secret('share.disk.give');
        setTimeout(() => { pw.close(); msg('DiskSwap', `You gave "${D.label}" to ${m.to}!\n\nIt's on their desktop now (or it will be next time they log on). ${m.dropped ? `\n\n(${m.dropped} thing${m.dropped === 1 ? '' : 's'} couldn't go on the disk.)` : ''}`, 'info'); }, 700);
      });
      sfx('modem');
      const t = setInterval(() => {
        if (done) return clearInterval(t);
        if (i < n) { SH.send({ t: 'shDiskPut', rid, up, i, n, d: b64.slice(i * CH, (i + 1) * CH) }); i++; const want = Math.floor(i / n * 24); while (blocks < want) { bar.appendChild(document.createElement('i')); blocks++; } log.textContent = `Copying files to A:... ${Math.round(i / n * 100)}%`; }
        else if (i === n) { i++; log.textContent = 'Posting it to ' + to + '...'; setTimeout(() => { if (!done) { done = true; off(); pw.close(); msg('DiskSwap', 'The JackNet post office didn\'t answer. Try again in a minute.', 'warn'); } }, 15000); }
      }, 70);
    }
    function act(a) { if (a === 'add') addPicker(); else if (a === 'give') give(); else if (a === 'new') { D.label = ''; D.files = []; D.stk = []; D.note = ''; q(root, '.shw-dlab').value = ''; q(root, '.shw-dnote').value = ''; draw(); } }
    A.menubar(w, [
      ['File', [{ label: 'New Disk', act: () => act('new') }, { label: 'Put Files On...', act: () => act('add') }, '-', { label: 'Give To...', act: () => act('give') }, '-', { label: 'Exit', act: w.close }]],
      ['Disk', [{ label: 'Format A:...', act: () => msg('Format', 'Formatting is for grown-ups. Use File > New Disk instead. (Same thing, fewer tears.)', 'info') }, { label: 'Check for Viruses', act: () => msg('Virus Check', 'Scanning drive A: with a very small magnifying glass...\n\nNo viruses found. One crumb found.', 'info') }]],
      ['Help', [{ label: 'About DiskSwap', act: () => msg('About DiskSwap', 'DiskSwap 1.44\nby Floppy Swap-O-Rama\n\nFor swapping floppies with your mates, without the bus ride.\n\n"Have you got my disk back yet?"', 'info') }]],
    ]);
    draw();
  };
  // -- the floppy viewer (a disk somebody gave you)
  function picNodeName(n) { const dir = A.fs.get(MD + '/My Pictures'); const has = x => (dir && dir.kids || []).some(k => k.name.toLowerCase() === x.toLowerCase()); if (!has(n)) return n; const m = /^(.*?)(\.[^.]*)?$/.exec(n); for (let i = 2; i < 99; i++) { const t = `${m[1]} (${i})${m[2] || ''}`; if (!has(t)) return t; } return n; }
  W.diskView = (w, id) => {
    const b = w.body;
    SH.req({ t: 'shDiskGet', id }).then(r => {
      if (w.closed) return;
      const d = r && r.disk;
      if (!d) { b.innerHTML = `<div class="shw-dvbad"><p>A:\\ is not accessible.</p><p>The disk in drive A: is not readable. It might be damaged, or it might belong to somebody else. (Was it ejected?)</p><button type="button" class="btn">Eject disk</button></div>`; on(b, '.btn', 'click', () => { SH.ejectDisk(id); w.close(); }); return; }
      const all = d.files.slice(); if (d.note) all.unshift({ k: 'txt', n: 'README.TXT', t: d.note, note: true });
      b.innerHTML = `<div class="shw-dv"><div class="shw-dvl">${floppySvg(d, true)}<p class="small">From <b>${esc(d.by)}</b><br>given on ${esc(d99(d.ts))}</p></div><div class="shw-dvr"><div class="fx-tools shw-dvtools"><button type="button" class="btn" data-a="open">Open</button><button type="button" class="btn" data-a="copy">Copy to My Documents</button><button type="button" class="btn" data-a="all">Copy All</button><button type="button" class="btn" data-a="eject">Eject</button></div><div class="field shw-dvfiles" tabindex="0">${all.map((f, i) => `<button type="button" class="shw-dvf" data-i="${i}"><span class="shw-fic">${f.k === 'img' ? (f.d ? `<img src="${esc(f.d)}" alt="">` : '&#127912;') : f.k === 'url' ? '&#127760;' : '&#128196;'}</span><span>${esc(f.n)}</span></button>`).join('')}</div></div></div>`;
      let sel = -1;
      const rows = qa(b, '.shw-dvf');
      const pick = i => { sel = i; rows.forEach((x, j) => x.classList.toggle('sel', j === i)); if (w.status) w.status.textContent = i >= 0 ? `${all[i].n}: ${K.num(K.diskSize(all[i]))} bytes` : `${all.length} object(s)`; };
      let lt = 0, li = -1;
      q(b, '.shw-dvfiles').addEventListener('click', ev => { const x = ev.target.closest('.shw-dvf'); if (!x) return; const i = +x.dataset.i, now = Date.now(); const dbl = (i === li && now - lt < 450) || matchMedia('(hover:none)').matches; lt = now; li = i; pick(i); if (dbl) openF(all[i]); });
      function openF(f) {
        if (!f) return;
        if (f.k === 'txt') A.openFile({ name: f.n, type: 'txt', text: f.t, date: d99(d.ts) });
        else if (f.k === 'img') A.openFile({ name: f.n, type: 'png', dataURL: f.d, date: d99(d.ts) });
        else if (f.k === 'url') SH.go(f.u);
      }
      function copyF(f, quiet) {
        if (!f) return false;
        const date = d99();
        if (f.k === 'img') {
          let l = []; try { l = JSON.parse(localStorage.getItem('jhp_prog_pics') || '[]'); } catch (e) { l = []; }
          const name = picNodeName(f.n); l.push({ name, data: f.d, date });
          try { localStorage.setItem('jhp_prog_pics', JSON.stringify(l)); } catch (e) { msg('Copy', 'There is not enough room on your hard disk to copy ' + f.n + '. Delete some pictures first.', 'warn'); return false; }
          A.fs.dir(MD + '/My Pictures').kids.push({ name, type: 'png', dataURL: f.d, date, size: '451 KB', painted: true });
        } else if (!SH.addCopy({ k: f.k, n: f.n, t: f.t, u: f.u, date })) { msg('Copy', 'Your hard disk is full! Delete some files first.', 'warn'); return false; }
        if (!quiet) toast('Copying...', `${f.n} was copied to ${f.k === 'img' ? 'C:\\My Documents\\My Pictures' : 'C:\\My Documents\\From Floppy Disks'}.`, 4000);
        secret('share.disk.copy');
        return true;
      }
      on(b, '.shw-dvtools', 'click', ev => {
        const a = ev.target.closest('[data-a]'); if (!a) return;
        const x = a.dataset.a;
        if (x === 'eject') { sfx('thud'); SH.ejectDisk(id); w.close(); toast('Drive A:', 'Clunk! The disk pops out. (It\'s gone from your desktop.)', 3000); return; }
        if (x === 'all') { let n = 0; all.forEach(f => { if (copyF(f, true)) n++; }); if (n) toast('Copying...', `${n} file(s) copied to C:\\My Documents.`, 4000); return; }
        if (sel < 0) return msg('3½ Floppy (A:)', 'Click a file first!', 'info');
        if (x === 'open') openF(all[sel]); else if (x === 'copy') copyF(all[sel]);
      });
      A.menubar(w, [['File', [{ label: 'Open', act: () => openF(all[sel]) }, { label: 'Copy to My Documents', act: () => copyF(all[sel]) }, { label: 'Copy All', act: () => { all.forEach(f => copyF(f, true)); toast('Copying...', 'Everything was copied to C:\\My Documents.', 4000); } }, '-', { label: 'Eject', act: () => { SH.ejectDisk(id); w.close(); } }, { label: 'Close', act: w.close }]],
        ['Help', [{ label: 'About this disk', act: () => msg('Disk Properties', `Label: ${d.label}\nFrom: ${d.by}\nGiven: ${d99(d.ts)}\nUsed: ${K.num(d.size || 0)} bytes\nCapacity: 1,457,664 bytes (3½" High Density)`, 'info') }]]]);
      pick(-1);
    });
  };

  // ================================================================ Cool Site of the Month (www.coolsite.homepagez)
  function csShell(el, inner, crumbs) {
    el.className = 'shz-site shw-cs';
    el.innerHTML = `<div class="shw-cshead">${SH.ICONS.trophy.replace('<svg', '<svg width="56" height="56"')}<div><b>Homepagez Cool Site of the Month</b><span>The most important awards on the World Wide Web. (Probably.)</span></div></div>
      <div class="shw-csnav"><a href="${U('cotm')}">Vote!</a><a href="${U('cotm', '/league.html')}">Hit Counter League</a><a href="${U('cotm', '/ring.html')}">Webring of the Week</a><a href="${U('cotm', '/winners.html')}">Hall of Fame</a><a href="${U('cotm', '/rules.html')}">Rules</a><a href="http://members.homepagez.webcom/directory.html">All member pages</a></div>
      ${crumbs ? `<div class="shw-crumb">${crumbs}</div>` : ''}<div class="shw-csbody">${inner}</div><div class="shw-csfoot">The Homepagez Awards Committee is three hamsters and a clipboard. Their decision is final. &middot; Prizes paid in Rupees, by the JackNet Bank.</div>`;
  }
  const hpA = (k, n) => `<a href="${esc(SH.homeUrl(k))}">~${esc(n)}</a>`;
  function csHome(el) {
    const p = SH.takeParams();
    csShell(el, '<p class="shw-wait2">Opening the ballot box...</p>');
    Promise.all([SH.cotm(true), members()]).then(([r, mem]) => {
      const b = q(el, '.shw-csbody'); if (!b) return;
      if (!r || !r.m) { b.innerHTML = '<p>The ballot box is stuck. Try again!</p>'; return; }
      const max = Math.max(1, ...r.standings.map(x => x[3]));
      const pages = (mem || []).filter(x => x[3]);
      const mine = member() ? nick().toLowerCase() : '';
      b.innerHTML = `<h2>Vote for ${esc(r.label)}!</h2><p>Every JackNet member gets <b>one vote a month</b>. The winner gets a GOLD AWARD on their page and <b>250 Rupees</b>; second gets 100, third gets 50. Voting closes at midnight on the last day of the month.</p>
        <div class="shw-csgrid"><div><h3>The standings (${r.votes} vote${r.votes === 1 ? '' : 's'} so far)</h3>${r.standings.length ? `<div class="shw-bars">${r.standings.map((x, i) => `<div class="shw-barrow"><span class="shw-bn">${i + 1}. ${hpA(x[0], x[1])}<small>${esc(x[2])}</small></span><span class="shw-bar"><i style="width:${(x[3] / max * 100).toFixed(0)}%"></i><b>${x[3]}</b></span></div>`).join('')}</div>` : '<p><i>No votes yet this month. Yours could decide it!</i></p>'}
          <div class="shw-myvote">${member() ? (r.mine ? `You voted for <b>~${esc((pages.find(x => x[0].toLowerCase() === r.mine) || [r.mine])[0])}</b> this month. Thanks!` : 'You haven\'t voted yet this month!') : (window.Guest ? Guest.webNote('Voting for Cool Site of the Month') : '')}</div></div>
        <div><h3>All the home pages (${pages.length})</h3><input type="text" class="shw-pq" placeholder="Find a page..." aria-label="Find a page"><div class="field shw-vlist">${pages.map(x => `<div class="shw-vrow${p.vote && x[0].toLowerCase() === p.vote ? ' focus' : ''}" data-k="${esc(x[0].toLowerCase())}"><span>${hpA(x[0].toLowerCase(), x[0])}</span>${member() && !r.mine && x[0].toLowerCase() !== mine ? `<button type="button" class="btn" data-v="${esc(x[0].toLowerCase())}">Vote</button>` : ''}</div>`).join('') || '<p class="shw-pmsg">Nobody has built a home page yet!</p>'}</div></div></div>
        <div class="shw-csmore"><div class="shw-box"><h3>Last month's winners</h3>${(r.winners || []).filter(w => w.m === (r.winners[0] || {}).m).map(w => `<p>${['', '&#129351;', '&#129352;', '&#129353;'][w.place] || ''} ${hpA(w.k, w.n)} (${w.votes} votes, ${esc(SH.monthName(w.m))})</p>`).join('') || '<p>The awards are brand new! This month\'s winners will be the very first.</p>'}</div>
        <div class="shw-box"><h3>Webring of the Week</h3><p><b>${esc(r.ring.name)}</b>: ${r.ring.sites.length} pages. <a href="${U('cotm', '/ring.html')}">Hop round it!</a></p></div></div>`;
      const vf = q(b, '.shw-vrow.focus'); if (vf) setTimeout(() => vf.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
      on(b, '.shw-pq', 'input', ev => { const v = ev.target.value.trim().toLowerCase(); qa(b, '.shw-vrow').forEach(x => { x.hidden = !!v && !x.dataset.k.includes(v); }); });
      b.addEventListener('click', ev => { const v = ev.target.closest('[data-v]'); if (!v) return; const k = v.dataset.v;
        msg('Cool Site of the Month', `Vote for ~${k} as Cool Site of the Month? You only get one vote a month!`, 'q', [['Vote!', () => SH.req({ t: 'shVote', name: k }).then(rr => {
          if (!rr || !rr.ok) return msg('Cool Site of the Month', (rr && rr.err) || 'The ballot box is stuck.', 'warn');
          secret('share.cotm.vote'); sfx('solve'); toast('Cool Site of the Month', `You voted for ~${rr.voted}! Thanks for voting.`, 4000); SH.cotm(true).then(() => csHome(el));
        })], ['Cancel']]); });
      if (member() && (r.winners || []).some(w => w.k === mine)) secret('share.cotm.win');
    });
  }
  function odo(n) { return `<span class="shw-odo">${esc(String(n | 0).padStart(6, '0'))}</span>`; }
  function csLeague(el) {
    csShell(el, '<p class="shw-wait2">Reading all the hit counters...</p>', `<a href="${U('cotm')}">Awards</a> &gt; Hit Counter League`);
    SH.cotm(true).then(r => {
      const b = q(el, '.shw-csbody'); if (!b) return;
      if (!r || !r.league) { b.innerHTML = '<p>The counters are spinning too fast to read.</p>'; return; }
      b.innerHTML = `<h2>The Hit Counter League</h2><p>Whose hit counter is the biggest? (Each visitor counts once every half an hour. No cheating with the Refresh button!)</p><table class="shw-tab shw-league"><tr><th>#</th><th>Home page</th><th>Hits</th></tr>${r.league.map((x, i) => `<tr${i < 3 ? ` class="top${i + 1}"` : ''}><td>${i + 1}</td><td>${hpA(x[0], x[1])}<br><small>${esc(x[2])}</small></td><td>${odo(x[3])}</td></tr>`).join('') || '<tr><td colspan="3">No pages yet!</td></tr>'}</table>`;
    });
  }
  const RINGK = 'jhp_share_ring';
  function csRing(el) {
    csShell(el, '<p class="shw-wait2">Joining the hands of the webring...</p>', `<a href="${U('cotm')}">Awards</a> &gt; Webring of the Week`);
    SH.cotm(true).then(r => {
      const b = q(el, '.shw-csbody'); if (!b) return;
      const ring = r && r.ring;
      if (!ring || !ring.sites.length) { b.innerHTML = '<h2>Webring of the Week</h2><p>Not enough home pages for a ring yet! Build one with PageBuilder.</p>'; return; }
      const st = store.get(RINGK, {}); const seen = st.wk === ring.wk ? st.seen || [] : [];
      b.innerHTML = `<h2>Webring of the Week: ${esc(ring.name)}</h2><p>Every week the Awards hamsters pick ${ring.sites.length} home pages and join them into a ring. Hop all the way round!</p><div class="shw-ringv">${ring.sites.map((x, i) => `<div class="shw-rnode${seen.includes(x[0]) ? ' seen' : ''}" style="--i:${i};--n:${ring.sites.length}"><b>${i + 1}</b>${hpA(x[0], x[1])}<small>${esc(x[2])}</small></div>`).join('')}</div><p class="shw-btns"><button type="button" class="btn shw-big" data-h>Start hopping! &gt;&gt;</button></p><p class="small">You've visited ${seen.length} of ${ring.sites.length} this week.</p>`;
      on(b, '[data-h]', 'click', () => { SH.ring = ring; SH.go(SH.homeUrl(ring.sites[0][0])); });
      SH.ring = ring;
    });
  }
  // the ring bar on member pages that are in this week's ring
  W.ringBar = (bar, k) => {
    const ring = SH.ring; if (!ring || !ring.sites) return;
    const i = ring.sites.findIndex(x => x[0] === k); if (i < 0) return;
    const st = store.get(RINGK, {}); const seen = new Set(st.wk === ring.wk ? st.seen || [] : []); seen.add(k);
    store.set(RINGK, { wk: ring.wk, seen: [...seen] }); if (seen.size >= ring.sites.length) secret('share.cotm.ring');
    const n = ring.sites.length, pv = ring.sites[(i + n - 1) % n], nx = ring.sites[(i + 1) % n];
    const d = document.createElement('div'); d.className = 'shw-ringbar';
    d.innerHTML = `<a href="${esc(SH.homeUrl(pv[0]))}">&lt;&lt; ~${esc(pv[1])}</a><span>This page is in <b>${esc(ring.name)}</b> (${i + 1} of ${n})${seen.size >= n ? ' &#9733; you hopped the whole ring!' : ''}</span><a href="${esc(SH.homeUrl(nx[0]))}">~${esc(nx[1])} &gt;&gt;</a>`;
    bar.insertBefore(d, bar.firstChild);
  };
  function csWinners(el) {
    csShell(el, '<p class="shw-wait2">Polishing the trophies...</p>', `<a href="${U('cotm')}">Awards</a> &gt; Hall of Fame`);
    SH.cotm(true).then(r => {
      const b = q(el, '.shw-csbody'); if (!b) return;
      const w = (r && r.winners) || [];
      b.innerHTML = `<h2>The Hall of Fame</h2>${w.length ? `<table class="shw-tab"><tr><th>Month</th><th>Place</th><th>Home page</th><th>Votes</th></tr>${w.map(x => `<tr><td>${esc(SH.monthName(x.m))}</td><td>${['', 'GOLD', 'Silver', 'Bronze'][x.place] || ''}</td><td>${hpA(x.k, x.n)}<br><small>${esc(x.t)}</small></td><td>${x.votes}</td></tr>`).join('')}</table>` : '<p>No winners yet: the first ones are crowned at the end of this month!</p>'}`;
    });
  }
  function csRules(el) {
    csShell(el, `<h2>The Rules</h2><ol class="shw-steps"><li>Every JackNet member gets ONE vote a month.</li><li>No voting for your own page. (The hamsters can tell.)</li><li>Voting closes at midnight on the last day of the month (UK time).</li><li>Gold, silver and bronze pages get an award on their page and Rupees: 250, 100 and 50.</li><li>Be nice about other people's pages. Everybody's first page has blinking text.</li><li>The hamsters' decision is final.</li></ol>`, `<a href="${U('cotm')}">Awards</a> &gt; Rules`);
  }

  // ================================================================ the router
  const front = () => { const b = document.getElementById('browser'); try { if (b && window.Desk && Desk.activate) Desk.activate(b); } catch (e) {} };
  W.render = (key, path, el) => {
    let m;
    if (/^\/(pickup|forward)\//.test(path)) setTimeout(front, 50); // (arrived from a link in an e-mail: the browser comes to the front)
    try {
      if (key === 'cards') {
        if (path === '/') return czHome(el);
        if ((m = /^\/cat\/([a-z]+)\.html$/.exec(path))) return czCat(el, m[1]);
        if ((m = /^\/card\/([a-z0-9-]+)\.html$/.exec(path))) return czCard(el, m[1]);
        if ((m = /^\/pickup\/([A-Za-z0-9_-]{10,24})\.html$/.exec(path))) return czPickup(el, m[1]);
        if (path === '/pickup.html') return czPickupForm(el);
        if (path === '/sent.html') return czSent(el);
        if (path === '/faq.html') return czFaq(el);
        if (path === '/today.html') return czToday(el);
      } else if (key === 'chain') {
        if (path === '/') return cwHome(el);
        if ((m = /^\/chain\/([A-Za-z0-9_-]{10,24})\.html$/.exec(path))) return cwChain(el, m[1]);
        if ((m = /^\/forward\/([A-Za-z0-9_-]{10,24})-(\d{1,4})\.html$/.exec(path))) return cwForward(el, m[1], +m[2]);
        if (path === '/start.html') return cwStart(el);
        if (path === '/optout.html') return cwOpt(el);
        if (path === '/hoax.html') return cwHoax(el);
        if (path === '/mine.html') return cwMine(el);
      } else if (key === 'brag') {
        if (path === '/') return bbHome(el);
        if ((m = /^\/make\/([a-z]+)(?:-([a-z]+))?\.html$/.exec(path))) return bbHome(el, m[1] + (m[2] ? '-' + m[2] : ''));
        if ((m = /^\/b\/([A-Za-z0-9_-]{10,24})\.html$/.exec(path))) return bbView(el, m[1]);
        if (path === '/about.html') return bbAbout(el);
      } else if (key === 'floppy') {
        if (path === '/') return fsHome(el);
        if (path === '/labels.html') return fsLabels(el);
      } else if (key === 'cotm') {
        if (path === '/') return csHome(el);
        if (path === '/league.html') return csLeague(el);
        if (path === '/ring.html') return csRing(el);
        if (path === '/winners.html') return csWinners(el);
        if (path === '/rules.html') return csRules(el);
      }
    } catch (e) { console.error('[share-web]', key, path, e); }
    el.innerHTML = '<div class="shz-wait"><h2>404 Not Found</h2><p>The page you are looking for has moved to a new neighbourhood.</p></div>';
  };
})();

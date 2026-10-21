/* ex-shop: THE CARD KORNER (www.cardkorner.kidz), the card & comic shop run by {shop} (js/cast.js: 'Old Mick', 'Old Wendy'...). Byte Beasties boosters (Rupees), the
 * free starter deck, pull rates, the checklist, the Card Clash rules and a back room you are not supposed to find. */
(function () {
  'use strict';
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, rp = EX.rp, W = window.ExWeb;
  const U = p => 'http://www.cardkorner.kidz' + p;
  const SN = () => (window.Cast ? Cast.n('shop') : 'The owner'), SF = () => !!(window.Cast && Cast.g('shop') === 'f'); // the shopkeeper is the visitor's own (js/cast.js)
  const MO = ["Five packets a day, young one. Doctor's orders. Well, your Mom's orders.", 'Doubles? Swap them at the Trading Post. Or sell the shiny ones on JackBay for proper Rupees.',
    "The Pixel Phoenix? Only twenty-five of them in the whole wide JackNet. I've never even SEEN one.", 'Sprout beats Cosmic. Nobody believes me until it happens to them.',
    "Speedy beasts hit first. If they knock the other one out, it doesn't even get to hit back. Cheeky.", 'Hover beasts fly right over the one in front and hit the player. Unless the other one hovers too.',
    'Put your beefy beasts where the other player\'s beasts are. Put your fast ones where there\'s nobody.', "Don't blow on the cards. It doesn't help. It never helped. Not even with cartridges.",
    'Gadget cards are the Series One cards. A Floppy Disk saves the game: three Hit Points back. Lovely.', "JackK came in yesterday and beat everybody in the shop. Then Dave tried. Dave lost to the till."];
  const head = (sub) => `<div class="ckn-top"><div class="ckn-sign"><span class="ckn-the">THE</span>CARD KORNER<small>${esc(SN())}'s Card &amp; Comic Shop &middot; Est. 1987 &middot; Comics &middot; Cards &middot; Dice &middot; Pogs</small></div>
    <div class="ckn-nav"><a href="${U('/')}">Shop</a><a href="${U('/checklist.html')}">Checklist</a><a href="${U('/rules.html')}">Card Clash Rules</a><a href="${U('/odds.html')}">Pull Rates</a><a href="http://www.megamasters.cyb/">The League</a></div>
    <div class="ckn-tick"><span>NEW IN!!! BYTE BEASTIES SERIES TWO &middot; 38 BEASTIES TO COLLECT &middot; HOLOS IN EVERY PACKET (well, 1 in 5 cards!) &middot; FREE STARTER DECK FOR JACKNET MEMBERS &middot; CARD CLASH LEAGUE EVERY WEEK &middot; NO SWAPPING SHINIES IN THE QUEUE &middot;</span></div>${sub ? `<h2 class="ckn-h">${sub}</h2>` : ''}</div>`;
  const foot = () => `<div class="ckn-foot">The Card Korner is a JackNet Members' Club shop &middot; Rupees only, no cheques, no IOUs, no Pogs &middot; Pull rates printed on every packet by order of Mom<br><a href="http://www.lootlings.jnet/">Lootlings</a> &middot; <a href="http://www.jackbay.webcom/rupees.html">JackBay Rupee Auctions</a> &middot; <a href="http://www.megamasters.cyb/">The Mega Masters</a> &middot; <a href="http://www.holohut.kidz/">The Holo Hut</a></div>`;

  // ================================================================ the shop
  W.shopHome = el => {
    el.className = 'ex-page ckn';
    const L = EX.live(el);
    el.innerHTML = `${head()}<div class="ckn-wrap"><div class="ckn-main"><div class="ckn-d1"></div><div class="ckn-reveal" hidden></div><div class="ckn-d2"></div></div><div class="ckn-side"></div></div>${foot()}`;
    const q = s => el.querySelector(s);
    const draw = () => {
      const me = EX.me, mem = EX.member, n = me ? me.packs : 0, left = me ? me.pmax - me.pday : 0;
      const have = K.owned(), got = X.CARDS.filter(c => have.get(c.id)).length;
      const msgWas = q('.ckn-msg') && !q('.ckn-msg').hidden ? q('.ckn-msg').outerHTML : '';
      q('.ckn-d1').innerHTML = `<div class="ckn-box ckn-buy"><div class="ckn-packs">${ExArt.pack({ face: 'card.x2_voltbat' })}${ExArt.pack({ face: 'card.x2_glorp' })}${ExArt.pack({ face: 'card.x2_scorchio' })}</div>
      <div><h3>BYTE BEASTIES BOOSTER</h3><p>5 cards in every packet: <b>3 Common, 1 Uncommon and 1 Rare or better</b>. Every Rare is a <b>HOLO</b>. Will you find the Pixel Phoenix? (Only 25 exist. Ever.)</p>
      <p class="ckn-price">${window.Econ && Econ.rupees ? Econ.rupees(X.PACK.price, true) : rp(X.PACK.price)} <small>a packet</small></p>
      ${mem ? `<div class="row ckn-btns">${left > 0 ? `<button class="btn" data-buy="1">Buy 1 packet</button>${left > 1 ? `<button class="btn" data-buy="${left}">Buy ${left} packets</button>` : ''}` : '<b>That\'s your lot for today!</b>'}</div><p class="ckn-small">Packets left for you today: <b>${left}</b> of ${X.PACK.dayMax}. Unopened packets: <b>${n}</b>.</p>${n ? `<p><button class="btn ckn-open" data-open>RIP ONE OPEN! (${n})</button></p>` : ''}` : K.guestNote('Buying JackCards')}
      ${msgWas || '<div class="ckn-msg" hidden></div>'}</div></div>`;
      q('.ckn-d2').innerHTML = `<div class="ckn-box ckn-start"><h3>FREE STARTER DECK!</h3><p>New to JackCards? Every JackNet member gets <b>one free starter deck</b>: fifteen real cards for keeps (thirteen Byte Beasties and two Series One gadgets), ready to play Card Clash straight away.</p>
      ${!mem ? K.guestNote('The free starter deck') : me && me.starter ? '<p class="ckn-done">&#10004; You\'ve had yours. Enjoy!</p>' : '<p><button class="btn" data-starter>Claim my free starter deck</button></p>'}</div>
    <div class="ckn-box"><h3>YOUR COLLECTION</h3>${mem ? `<p>You have <b>${got}</b> of the ${X.CARDS.length} Byte Beasties${got ? '' : ' (none yet: open a packet!)'}. <a href="${U('/checklist.html')}">See the checklist &raquo;</a></p><div class="ckn-strip">${X.CARDS.filter(c => have.get(c.id)).slice(-8).map(c => K.tile(c.id, { n: have.get(c.id) })).join('') || '<i>Nothing in your binder yet.</i>'}</div>` : '<p>Log on to see your cards.</p>'}</div>`;
      q('.ckn-side').innerHTML = `<div class="ckn-mo"><div class="ckn-mo-face">${moFace()}</div><div class="ckn-bub"><b>${esc(SN())} says:</b> ${esc(MO[Math.floor(Date.now() / 60000) % MO.length])}</div></div>
    <div class="ckn-box ckn-dl"><h3>JackCards Binder 99</h3><p>The <b>FREE</b> program for your cards: a proper nine-pocket binder, a deck builder and <b>CARD CLASH</b> (play the computer or your mates over the JackNet).</p><p><button class="btn" data-dl>${window.Setup && Setup.has && Setup.has('ex.binder') ? 'Open the Binder' : 'Download now! (2.8 MB)'}</button></p></div>
    <div class="ckn-box"><h3>Card Clash League</h3><p>Beat people at Card Clash to climb the weekly league at <a href="http://www.megamasters.cyb/">The Mega Masters</a>. Gold cups for the top three!</p></div>
    <div class="ckn-box"><h3>Got doubles?</h3><ul><li><a href="http://www.jackbay.webcom/rupees.html">Auction them for Rupees on JackBay</a></li><li>Swap at the Trading Post (your Treasure Chest)</li><li><a href="http://www.lootlings.jnet/">Old Snorb's Card Shack</a> sells Series One singles</li></ul></div>
    <div class="ckn-box ckn-small"><b>Shop rules:</b> 1. No running. 2. No swapping shinies in the queue. 3. Five packets a day each. 4. If you cry about a Common, do it outside.</div>`;
      el.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => K.need('Buying JackCards', () => { b.disabled = true; EX.send({ t: 'exPackBuy', n: +b.dataset.buy }); })));
      const o = q('[data-open]'); if (o) o.addEventListener('click', () => { o.disabled = true; EX.send({ t: 'exPackOpen' }); });
      const s = q('[data-starter]'); if (s) s.addEventListener('click', () => K.need('The free starter deck', () => { s.disabled = true; EX.send({ t: 'exStarter' }); }));
      q('[data-dl]').addEventListener('click', () => { if (window.Setup && Setup.has && Setup.has('ex.binder')) A.open('ex.binder'); else if (window.Setup && Setup.download) Setup.download('ex.binder'); });
    };
    const msg = (h, bad) => { const b = q('.ckn-msg'); if (!b) return; b.hidden = false; b.innerHTML = h; b.className = 'ckn-msg' + (bad ? ' bad' : ''); };
    L.on('me', draw);
    L.on('exErr', m => { el.querySelectorAll('[data-buy],[data-open],[data-starter]').forEach(b => { b.disabled = false; }); msg(esc(m.msg), true); EX.sfx('uhoh'); });
    L.on('exPackGot', m => { EX.sfx('pet'); setTimeout(() => msg(`Thank you! ${m.n > 1 ? m.n + ' packets' : 'One packet'} in your bag. Rip one open!`), 60); });
    L.on('exPack', m => {
      const box = q('.ckn-reveal'); box.hidden = false;
      const have = new Map(K.owned()); for (const x of m.its) have.set(x.id, Math.max(0, (have.get(x.id) || 0) - 1)); // (the chest may already have them)
      K.reveal(box, m.its, { have, starter: m.starter, onDone: () => { const b = document.createElement('p'); b.className = 'ckn-again'; b.innerHTML = `${EX.me && EX.me.packs ? `<button class="btn" data-open2>Open another (${EX.me.packs} left)</button> ` : ''}<button class="btn" data-binder>Look in my Binder</button>`; box.appendChild(b); const o2 = b.querySelector('[data-open2]'); if (o2) o2.onclick = () => { o2.disabled = true; EX.send({ t: 'exPackOpen' }); }; b.querySelector('[data-binder]').onclick = () => { if (window.Setup && Setup.has && !Setup.has('ex.binder')) Setup.download('ex.binder'); else A.open('ex.binder'); }; } });
      box.scrollIntoView({ block: 'nearest' });
    });
    draw();
    if (EX.member) EX.send({ t: 'exMe' });
  };
  function moFace() { // the shopkeeper: a grey perm, pearls and glasses on a chain if it's a lady; grey tache and comb-over if it's a man
    if (SF()) return '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect width="64" height="64" fill="#5a2a8a"/><g fill="#d4d4d4" stroke="#000"><circle cx="18.5" cy="30" r="5.5"/><circle cx="45.5" cy="30" r="5.5"/><circle cx="18" cy="22.5" r="6"/><circle cx="46" cy="22.5" r="6"/><circle cx="23" cy="15" r="6.5"/><circle cx="41" cy="15" r="6.5"/><circle cx="32" cy="11.5" r="7"/></g><path d="M8 64c0-14 10-20 24-20s24 6 24 20z" fill="#8a2a4a" stroke="#000"/><path d="M24 45l8 7 8-7" fill="#fff" stroke="#000"/><g fill="#fff" stroke="#888" stroke-width=".6"><circle cx="25.6" cy="47.6" r="1.4"/><circle cx="28.6" cy="49.6" r="1.4"/><circle cx="32" cy="50.5" r="1.4"/><circle cx="35.4" cy="49.6" r="1.4"/><circle cx="38.4" cy="47.6" r="1.4"/></g><circle cx="17.6" cy="32.5" r="1.8" fill="#ffd400" stroke="#000" stroke-width=".7"/><circle cx="46.4" cy="32.5" r="1.8" fill="#ffd400" stroke="#000" stroke-width=".7"/><circle cx="32" cy="28" r="15" fill="#f0c090" stroke="#000"/><g fill="#e2e2e2" stroke="#000" stroke-width=".9"><circle cx="22.5" cy="17.8" r="4.4"/><circle cx="27.6" cy="15.4" r="4.4"/><circle cx="32.8" cy="14.8" r="4.4"/><circle cx="38" cy="15.8" r="4.4"/><circle cx="42" cy="18.8" r="4"/></g><circle cx="21.5" cy="32.5" r="2.6" fill="#f08080" opacity=".35"/><circle cx="42.5" cy="32.5" r="2.6" fill="#f08080" opacity=".35"/><path d="M21.6 28c-3 8-1 14 3 17M42.4 28c3 8 1 14-3 17" stroke="#c8a020" stroke-width=".8" fill="none"/><circle cx="26" cy="27" r="4.4" fill="#fff" stroke="#000"/><circle cx="38" cy="27" r="4.4" fill="#fff" stroke="#000"/><path d="M30.4 27h3.2" stroke="#000"/><circle cx="26.6" cy="27.4" r="1.4"/><circle cx="38.6" cy="27.4" r="1.4"/><path d="M22.6 21.6q3.4-1.8 6.6 0M34.8 21.6q3.4-1.8 6.6 0" stroke="#888" stroke-width="1" fill="none"/><path d="M25 35.5c4 4.4 10 4.4 14 0" fill="#fff" stroke="#000"/><path d="M25 35.5c4 1.2 10 1.2 14 0" fill="none" stroke="#b03050" stroke-width="1.6"/></svg>';
    return '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect width="64" height="64" fill="#5a2a8a"/><path d="M8 64c0-14 10-20 24-20s24 6 24 20z" fill="#2a6a3a" stroke="#000"/><path d="M26 44l6 8 6-8" fill="#fff" stroke="#000"/><circle cx="32" cy="28" r="15" fill="#f0c090" stroke="#000"/><path d="M17 24c2-12 28-12 30 0-3-4-8-5-15-5s-12 1-15 5z" fill="#c8c8c8" stroke="#000"/><circle cx="26" cy="27" r="4.4" fill="#fff" stroke="#000"/><circle cx="38" cy="27" r="4.4" fill="#fff" stroke="#000"/><path d="M30.4 27h3.2" stroke="#000"/><circle cx="26.6" cy="27.4" r="1.4"/><circle cx="38.6" cy="27.4" r="1.4"/><path d="M24 36c4 4 12 4 16 0" fill="#fff" stroke="#000"/><path d="M22 35c3-3 7-3 10-1 3-2 7-2 10 1" fill="#c8c8c8" stroke="#000" stroke-width=".8"/></svg>';
  }

  // ================================================================ pull rates
  W.shopOdds = el => {
    el.className = 'ex-page ckn';
    const per = r => X.CARDS.filter(c => c.r === r);
    const R = X.PACK.rare;
    el.innerHTML = `${head('Pull Rates (printed on every packet)')}<div class="ckn-wrap"><div class="ckn-main"><div class="ckn-box">
  <p>Mom says if you're spending Rupees on packets, you should know EXACTLY what's inside. So here it is, from the Byte Beasties factory:</p>
  <table class="ckn-tab"><tr><th>Slot</th><th>What's in it</th></tr><tr><td>Cards 1-3</td><td>Common (one of ${per(0).length})</td></tr><tr><td>Card 4</td><td>Uncommon (one of ${per(1).length})</td></tr>
  <tr><td>Card 5</td><td>${R.map(([r, w]) => `<b style="color:${K.RCOL[r]}">${K.RN[r]}</b> ${w}% (one of ${per(r).length})`).join('<br>')}</td></tr></table>
  <p>Every Rare, Epic, Legendary and Jackpot card is a <b>holo</b> (it shines). The Legendary <b>Dial-Up Dragon</b> is limited to 250 copies and the Jackpot <b>Pixel Phoenix</b> to 25: each one has a serial number. When they're all found, that slot gives the next card down instead.</p>
  <p>Price: <b>${rp(X.PACK.price)}</b> a packet, ${X.PACK.dayMax} packets a day each. Unopened packets keep forever (up to ${X.PACK.held}).</p>
  <p class="ckn-small">Odds are the same for everyone, every packet, every day. Packets are opened by the JackNet server (not your computer), so blowing on the screen does not help. Sorry, Dave.</p></div></div></div>${foot()}`;
  };

  // ================================================================ the checklist (owned cards in colour, missing ones as silhouettes)
  W.shopList = el => {
    el.className = 'ex-page ckn';
    let sel = '';
    const draw = () => {
      const have = K.owned(), got = X.CARDS.filter(c => have.get(c.id)).length;
      const c = sel && X.CARD[sel];
      el.innerHTML = `${head('The Byte Beasties Checklist')}<div class="ckn-wrap"><div class="ckn-main">
  ${EX.member ? `<p class="ckn-prog"><b>${got}</b> of ${X.CARDS.length} collected <span class="ckn-bar"><i style="width:${Math.round(got / X.CARDS.length * 100)}%"></i></span></p>` : K.guestNote('Ticking off your checklist')}
  ${c ? `<div class="ckn-box ckn-det"><div class="ckn-big">${ExArt.card(c.id)}</div><div><h3>#${c.no} ${esc(c.name)}</h3><p><b style="color:${K.RCOL[c.r]}">${K.RN[c.r]}</b> &middot; ${esc(X.EL[c.el].n)} &middot; costs ${c.cost} &middot; Attack ${c.atk} &middot; Hit Points ${c.hp}${c.lim ? ` &middot; only ${c.lim} will ever exist` : ''}</p>${c.ab ? `<p><b>${esc(X.AB[c.ab][0])}:</b> ${esc(X.AB[c.ab][1])}</p>` : '<p>No special ability. Just honest beastie.</p>'}<p><i>"${esc(c.d)}"</i></p><p>${have.get(c.id) ? `You have <b>${have.get(c.id)}</b>.` : 'You have not got this one yet.'}</p><p><button class="btn" data-close>Back to the checklist</button></p></div></div>` : ''}
  ${X.EL_ORDER.map(e => `<h3 class="ckn-elh" style="--ec:${X.EL[e].col}">${ExArt.elIcon(e)} ${esc(X.EL[e].n)} <small>(beats ${esc(X.EL[X.EL[e].beats].n)}: ${esc(X.EL[e].why)})</small></h3><div class="ckn-grid">${X.CARDS.filter(c2 => c2.el === e).map(c2 => have.get(c2.id) ? `<button type="button" class="ckn-cell" data-c="${c2.id}">${K.tile(c2.id, { n: have.get(c2.id) })}<span>#${c2.no} ${esc(c2.name)}</span></button>` : `<button type="button" class="ckn-cell ckn-miss" data-c="${c2.id}"><span class="ex-tile ex-sil">${ExArt.beast(c2.id)}<b>?</b></span><span>#${c2.no} ???</span></button>`).join('')}</div>`).join('')}
  </div></div>${foot()}`;
      el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { sel = b.dataset.c; if (!K.owned().get(sel)) sel = ''; draw(); if (sel) el.scrollIntoView({ block: 'start' }); }));
      const x = el.querySelector('[data-close]'); if (x) x.addEventListener('click', () => { sel = ''; draw(); });
    };
    draw();
    EX.live(el).on('me', draw);
    if (window.Loot && Loot.on) { const off = Loot.on('me', () => { if (!el.isConnected) return off(); draw(); }); }
  };

  // ================================================================ how to play Card Clash
  W.shopRules = el => {
    el.className = 'ex-page ckn';
    const ring = X.EL_ORDER.map(e => `<span class="ckn-el" style="background:${X.EL[e].col}">${ExArt.elIcon(e)} ${esc(X.EL[e].n)}</span>`).join(' &rarr; ') + ' &rarr; (back to Zap)';
    const gad = Object.keys(X.BATTLE).filter(id => X.BATTLE[id].kind === 'g');
    el.innerHTML = `${head('How to Play CARD CLASH')}<div class="ckn-wrap"><div class="ckn-main"><div class="ckn-box">
  <p><b>Card Clash</b> is the game you play with JackCards. You need the <b>JackCards Binder 99</b> program (free from this shop). Play the computer (Dave, Callum or JackK) or a mate over the JackNet.</p>
  <h3>The basics</h3><ol><li>Each player has a deck of <b>15 cards</b> and <b>${X.DUEL.hp} Hit Points</b>. You start with ${X.DUEL.hand0} cards and draw one more every round.</li>
  <li>There are <b>three lanes</b>. Each round you get <b>energy</b> (1 in round 1, 2 in round 2... up to ${X.DUEL.enMax}). The number in the yellow circle is what a card costs.</li>
  <li>Both players pick their cards <b>at the same time</b>, in secret, then press <b>LOCK IN</b>. Then everything happens at once!</li>
  <li><b>Beasts</b> go into an empty lane. A beast hits the beast in the lane opposite. If nobody is there, it hits the other <b>player</b>!</li>
  <li><b>Gadgets</b> (the Series One cards) do something once and then they're gone. Some need a lane to aim at.</li>
  <li>Beasts stay until they're knocked out. Damage stays too (no healing up between rounds).</li>
  <li>Knock the other player down to 0 Hit Points to win. After ${X.DUEL.rounds} rounds, whoever has more Hit Points wins.</li></ol>
  <h3>Elements</h3><p>Each beast has an element. Hitting the element yours <b>beats</b> does <b>+2 damage</b>; hitting the one that beats yours does <b>1 less</b>.</p><p class="ckn-ring">${ring}</p>
  <h3>Abilities</h3><table class="ckn-tab">${Object.keys(X.AB).map(k => `<tr><td><b>${esc(X.AB[k][0])}</b></td><td>${esc(X.AB[k][1])}</td></tr>`).join('')}</table>
  <h3>Gadgets (Series One cards)</h3><table class="ckn-tab">${gad.map(id => { const it = K.item(id), d = X.BATTLE[id]; return `<tr><td><b>${esc(it ? it.name : id)}</b> <small>(${d.cost})</small></td><td>${esc(d.txt)}</td></tr>`; }).join('')}</table>
  <p>Gubbinz, the Battle Robot, Dave and Mom's Knitting Club from Series One fight as beasts too!</p>
  <h3>Deck rules</h3><ul><li>${X.DECK.size} cards. Up to ${X.DECK.copies} of the same card (only 1 of a Legendary or Jackpot one).</li><li>Up to ${X.DECK.gadgetsMax} gadgets.</li><li>If your deck isn't full, the shop lends you cards from the starter deck to fill the gaps.</li></ul>
  <h3>Prizes</h3><ul>${Object.keys(X.CPU).map(k => `<li>Beat <b>${esc(X.CPU[k].n)}</b>: ${rp(X.CPU[k].pay)} <small>(${esc(X.CPU[k].d)})</small></li>`).join('')}<li>Beat a real person online: ${rp(X.EARN.exduel.amt)} (up to ${X.EARN.exduel.cap} a day) and ${X.TOUR.clash.pvp} Card Clash League points.</li><li>Beating JackK counts a league point too (up to ${X.TOUR.clash.cpuDay} a day).</li></ul>
  </div></div></div>${foot()}`;
  };

  // ================================================================ the back room (nobody tells you it's here)
  W.shopBack = el => {
    el.className = 'ex-page ckn ckn-back';
    A.secret('ex.back');
    el.innerHTML = `<div class="ckn-backin"><h2>STAFF ONLY. THAT MEANS YOU.</h2><p>Oh. It's you. Well, now you're in, mind the boxes.</p>
  <p>This is where I keep the stock. Forty boxes of Byte Beasties boosters, a crate of pogs nobody wants any more, a cardboard cut-out of a famous plumber (not for sale) and my lunch.</p>
  <p>Between you and me, the printers at the Byte Beasties factory say they only made <b>twenty-five</b> Pixel Phoenixes. TWENTY-FIVE. For the whole JackNet. If you ever pull one, keep it in a sleeve, then a toploader, then a box, then a safe. Then sit on the safe.</p>
  <p>And a tip, since you found your way back here: <b>Sprout beats Cosmic.</b> Nobody ever plays Sprouts against the aliens. Try it on JackK.</p>
  <p class="ckn-small">Things in this room: 1 kettle, 2 mugs (one says WORLD'S BEST GRANDAD), 47 boxes, 1 mouse (alive), 1 mousetrap (empty), the dust of ages.</p>
  <p><a href="${U('/')}">&laquo; Back into the shop before anybody sees</a></p></div>`;
  };
})();

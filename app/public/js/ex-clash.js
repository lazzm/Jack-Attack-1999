/* ex-clash: CARD CLASH, the JackCards battle game (part of JackCards Binder 99). The server runs every game (mods/ex.js
 * with the rules in js/ex-duel.js); this window shows the board, lets you plan your round and plays back what happened.
 * Opponents: Dave, Callum and JackK (the computer), or anybody on JackNet through Play Together (js/mp.js). */
(function () {
  'use strict';
  if (window.ExClash) return;
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, R = X.DUEL;
  const def = id => X.BATTLE[id];
  const name = id => { const it = K.item(id); return it ? it.name : id; };
  let W = null;
  const FACES = {
    dave: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#ffd400"/><path d="M6 48c0-10 8-15 18-15s18 5 18 15z" fill="#e10600" stroke="#000"/><circle cx="24" cy="22" r="12" fill="#f0c090" stroke="#000"/><path d="M12 20c0-9 6-13 12-13s12 4 12 13c-3-5-6-6-12-6s-9 1-12 6z" fill="#8a5a2a" stroke="#000"/><circle cx="19.6" cy="22" r="1.6"/><circle cx="28.4" cy="22" r="1.6"/><path d="M18 28c3 3 9 3 12 0" fill="none" stroke="#000" stroke-width="1.2"/><circle cx="16" cy="26" r="1.6" fill="#f08a8a" opacity=".7"/><circle cx="32" cy="26" r="1.6" fill="#f08a8a" opacity=".7"/></svg>',
    callum: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#2f80ee"/><path d="M6 48c0-10 8-15 18-15s18 5 18 15z" fill="#2a2a2a" stroke="#000"/><circle cx="24" cy="22" r="12" fill="#f8d0a8" stroke="#000"/><path d="M12 19c1-8 6-12 12-12s11 4 12 12c-4-3-8-4-12-4-5 0-9 1-12 4z" fill="#e8c040" stroke="#000"/><rect x="15" y="19.6" width="7.4" height="5" rx="1" fill="none" stroke="#000" stroke-width="1.2"/><rect x="25.6" y="19.6" width="7.4" height="5" rx="1" fill="none" stroke="#000" stroke-width="1.2"/><path d="M22.4 21.6h3.2" stroke="#000"/><circle cx="18.6" cy="22.2" r="1.2"/><circle cx="29.4" cy="22.2" r="1.2"/><path d="M20 29h8" stroke="#000" stroke-width="1.2"/></svg>',
    jackk: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#9a3ae0"/><path d="M6 48c0-10 8-15 18-15s18 5 18 15z" fill="#1a7a3a" stroke="#000"/><circle cx="24" cy="22" r="12" fill="#e8b888" stroke="#000"/><path d="M11 18c2-9 8-12 14-12 7 0 12 4 12 11-2-2-4-3-6-3l-2-3-2 3c-5 0-11 1-16 4z" fill="#1a1a1a" stroke="#000"/><path d="M33 12c3-1 6 0 7 2-3 0-5 1-6 2z" fill="#e10600" stroke="#000"/><path d="M16.6 20.4l5 1.4M31.4 20.4l-5 1.4" stroke="#000" stroke-width="1.3"/><circle cx="19.6" cy="23" r="1.5"/><circle cx="28.4" cy="23" r="1.5"/><path d="M18 28c4 2 9 1.4 12-1" fill="none" stroke="#000" stroke-width="1.2"/></svg>',
    friend: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#3ab03a"/><circle cx="16" cy="20" r="8" fill="#f0c090" stroke="#000"/><circle cx="32" cy="20" r="8" fill="#c88a5a" stroke="#000"/><path d="M2 48c0-9 6-14 14-14s14 5 14 14zM18 48c0-9 6-14 14-14s14 5 14 14z" fill="#2f80ee" stroke="#000"/><path d="M14 4l3 6M34 4l-3 6M24 2v8" stroke="#ffd400" stroke-width="2"/></svg>',
  };

  function open(arg) {
    arg = arg || {};
    if (W && !W.closed) { W.restore(); if (arg.sess) W._sess(arg.sess); return W; }
    const S = { d: null, v: null, plays: [], sel: 0, anim: null, sess: null, wait: '', dl: 0, msg: '', last: '' };
    const box = document.createElement('div'); box.className = 'exc';
    const w = W = A.win('Card Clash', box, { w: 760, h: 640, icon: EX.ICO.clash, menubar: true, status: true, minW: 300, minH: 420 });
    if (innerWidth < 700 || innerHeight < 640) w.el.classList.add('maxwin');
    const inGame = () => !!(S.d && S.v && S.v.phase === 'plan');
    A.menubar(w, [
      ['Game', () => [
        ...Object.keys(X.CPU).map(k => ({ label: `New game against ${X.CPU[k].n}`, act: () => cpu(k) })),
        { label: 'Play someone on JackNet...', act: friend, dis: !window.MP },
        '-', { label: 'Resign this game', dis: !inGame(), act: resign },
        '-', { label: 'Exit', act: () => w.close() }]],
      ['Deck', [{ label: 'Edit my deck (Binder)...', act: () => A.open('ex.binder', 'deck') }, { label: 'Buy packets (The Card Korner)...', act: () => EX.go('http://www.cardkorner.kidz/') }]],
      ['Help', [{ label: 'How to play', act: () => EX.go('http://www.cardkorner.kidz/rules.html') }, { label: 'The Card Clash League', act: () => EX.go('http://www.megamasters.cyb/') }, '-', { label: 'About Card Clash', act: () => Desk.msgbox('About Card Clash', 'CARD CLASH version 1.2\nPart of JackCards Binder 99.\n\nRules by ' + (window.Cast ? Cast.n('shop') : 'the Card Korner') + '. Computer players by JackK (who also beat them all).\n\nRemember: Sprout beats Cosmic.', 'info') }]],
    ]);
    const say = t => { if (w.status) w.status.textContent = t; };

    // ---------------------------------------------------------------- starting games
    function cpu(ai) {
      if (inGame() && !confirmLeave()) return;
      S.sess = null; S.d = null; S.v = null; S.plays = []; S.wait = 'Shuffling...'; draw();
      EX.send({ t: 'exClashCpu', ai });
    }
    const confirmLeave = () => { if (!S.d || S.d.kind !== 'pvp') { if (S.d && S.v && S.v.phase === 'plan') EX.send({ t: 'exClashQuit', id: S.d.id }); return true; } Desk.msgbox('Card Clash', 'Finish (or resign) your online game first!', 'info'); return false; };
    function friend() { if (!window.MP) return; if (S.d && S.d.kind === 'pvp' && inGame()) return Desk.msgbox('Card Clash', 'You are already playing somebody!', 'info'); MP.pick('ex.clash'); }
    function resign() { if (!S.d) return; Desk.msgbox('Card Clash', 'Resign this game? It counts as a loss.', 'q', [['Resign', () => EX.send({ t: 'exClashQuit', id: S.d.id })], ['Keep playing']]); }
    function sess(s) {
      S.sess = s; S.d = null; S.v = null; S.plays = []; S.wait = `Connecting to ${s.others().map(p => p.nick).join(', ') || 'your opponent'}...`;
      try { s.attach(w); } catch (e) {}
      s.on('end', () => { if (S.sess === s) S.sess = null; });
      EX.send({ t: 'exClashPair', sid: s.sid, ids: s.roster.map(p => p.id) });
      draw();
    }
    w._sess = sess;

    // ---------------------------------------------------------------- the wire
    const offs = [
      EX.on('exClash', m => {
        const d = m.d; if (!d) { if (!S.d && !S.wait) draw(); return; }
        if (S.d && S.d.id !== d.id && S.v && S.v.phase === 'plan') { /* a different game took over (another tab started one) */ }
        const prev = S.d && S.d.id === d.id ? S.v : null;
        S.d = d; S.wait = '';
        if (d.dlIn) S.dl = Date.now() + d.dlIn; else S.dl = 0;
        if (d.log && prev && d.log.some(e => e.k !== 'draw')) return play(prev, d);
        S.v = d.v; if (d.v.phase === 'plan' && !d.v.me.lock) S.plays = S.plays.filter(p => d.v.me.hand.some(h => h.c === p.c)); else if (d.v.me.lock) S.plays = [];
        draw();
        if (d.v.phase === 'over') over();
      }),
      EX.on('exClashWait', () => { S.wait = 'Waiting for the other player to connect...'; draw(); }),
      EX.on('exErr', m => { if (w.closed) return; S.msg = m.msg; S.wait = ''; EX.sfx('uhoh'); draw(); }),
    ];
    const tick = setInterval(() => { if (w.closed) return; const t = box.querySelector('.exc-timer'); if (t && S.dl) { const s = Math.max(0, Math.ceil((S.dl - Date.now()) / 1000)); t.textContent = s + 's'; t.classList.toggle('low', s <= 15); } }, 500);
    const oc = w.close; w.close = function () { offs.forEach(f => f()); clearInterval(tick); if (S.d && S.d.kind === 'cpu' && S.v && S.v.phase === 'plan') EX.send({ t: 'exClashQuit', id: S.d.id }); if (S.sess && !S.sess.ended) try { S.sess.leave(true); } catch (e) {} W = null; return oc.apply(this, arguments); };

    // ---------------------------------------------------------------- planning
    const spent = () => S.plays.reduce((t, p) => { const h = S.v.me.hand.find(x => x.c === p.c); return t + (h ? def(h.id).cost : 0); }, 0);
    const energyLeft = () => S.v.me.en - spent();
    const pendingBeast = l => S.plays.find(p => { const h = S.v.me.hand.find(x => x.c === p.c); return h && def(h.id).kind === 'b' && p.lane === l; });
    function targets(c) { // where the selected card can go
      const h = S.v.me.hand.find(x => x.c === c); if (!h) return { me: [], op: [] };
      const d = def(h.id);
      if (d.kind === 'b') return { me: [0, 1, 2].filter(l => !S.v.me.lanes[l] && !pendingBeast(l)), op: [] };
      if (d.tg === 'own') return { me: [0, 1, 2].filter(l => S.v.me.lanes[l] || pendingBeast(l)), op: [] };
      if (d.tg === 'foe') return { me: [], op: [0, 1, 2] };
      return { me: [], op: [], now: 1 };
    }
    function pickCard(c) {
      if (!inGame() || S.v.me.lock || S.anim) return;
      if (S.plays.some(p => p.c === c)) { S.plays = S.plays.filter(p => p.c !== c); S.sel = 0; EX.sfx('click'); return draw(); }
      const h = S.v.me.hand.find(x => x.c === c), d = h && def(h.id); if (!d) return;
      if (d.cost > energyLeft()) { S.msg = `Not enough energy for ${name(h.id)} (it costs ${d.cost}, you have ${energyLeft()} left).`; EX.sfx('uhoh'); return draw(); }
      const t = targets(c);
      if (t.now) { S.plays.push({ c, lane: -1 }); S.sel = 0; EX.sfx('click'); if (h.id === 'card.486') A.secret('ex.turbo'); return draw(); }
      if (!t.me.length && !t.op.length) { S.msg = d.kind === 'b' ? 'All your lanes are full!' : 'There is nothing of yours to use that on.'; EX.sfx('uhoh'); return draw(); }
      S.sel = S.sel === c ? 0 : c; S.msg = ''; EX.sfx('click'); draw();
    }
    function pickLane(side, l) {
      if (!inGame() || S.v.me.lock || S.anim) return;
      if (!S.sel) { // clicking a planned card in a lane takes it back
        const p = side === 'me' && pendingBeast(l); if (p) { S.plays = S.plays.filter(x => x !== p && !(x.lane === l && def(S.v.me.hand.find(h => h.c === x.c).id).tg === 'own')); draw(); }
        return;
      }
      const t = targets(S.sel); if (!(side === 'me' ? t.me : t.op).includes(l)) { EX.sfx('uhoh'); return; }
      const h = S.v.me.hand.find(x => x.c === S.sel);
      S.plays.push({ c: S.sel, lane: l }); S.sel = 0; EX.sfx('pet');
      if (h && h.id === 'card.486') A.secret('ex.turbo');
      draw();
    }
    function lockIn() {
      if (!inGame() || S.v.me.lock || S.anim) return;
      EX.send({ t: 'exClashGo', id: S.d.id, plays: S.plays }); S.sel = 0; S.msg = '';
      S.v.me.lock = 1; S.locked = S.plays.slice(); draw(); EX.sfx('button');
    }

    // ---------------------------------------------------------------- drawing
    function laneCard(b, o) {
      o = o || {};
      if (!b) return '';
      const d = def(b.id) || {}, atk = Math.max(0, (b.atk || 0) + (b.tmp || 0)), hurt = b.hp < b.max;
      return `<div class="exc-bc${o.ghost ? ' ghost' : ''}${b.fx ? ' ' + b.fx : ''}" title="${esc(name(b.id))}${b.ab && X.AB[b.ab] ? ` - ${esc(X.AB[b.ab][0])}: ${esc(X.AB[b.ab][1])}` : ''}"><div class="exc-art">${ExArt.battle(b.id, { atk, hp: Math.max(0, b.hp), up: atk > (def(b.id) || {}).atk, down: atk < (def(b.id) || {}).atk, hurt })}</div>${b.sh ? '<i class="exc-shield" title="Shielded this round"></i>' : ''}${o.ghost ? '<b class="exc-x">x</b>' : ''}</div>`;
    }
    const ghostOf = (id, c) => { const d = def(id); return { c, id, atk: d.atk, tmp: 0, hp: d.hp, max: d.hp, el: d.el, ab: d.ab }; };
    function board(v, pend) {
      const tg = S.sel ? targets(S.sel) : { me: [], op: [] };
      const gadOn = (side, l) => pend.filter(p => p.lane === l && def(S.v.me.hand.find(h => h.c === p.c).id).kind === 'g' && ((def(S.v.me.hand.find(h => h.c === p.c).id).tg === 'own') === (side === 'me'))).map(p => `<span class="exc-gtag" title="${esc(name(S.v.me.hand.find(h => h.c === p.c).id))}">${esc(name(S.v.me.hand.find(h => h.c === p.c).id))}</span>`).join('');
      const row = (side, lanes) => `<div class="exc-row exc-${side}">${[0, 1, 2].map(l => {
        const b = lanes[l], pb = side === 'me' && !b ? pendingBeast(l) : null, ok = (side === 'me' ? tg.me : tg.op).includes(l);
        return `<button type="button" class="exc-lane${ok ? ' tgt' : ''}${b ? ' full' : ''}" data-side="${side}" data-l="${l}" aria-label="${side === 'me' ? 'Your' : 'Their'} lane ${l + 1}">${b ? laneCard(b) : pb ? laneCard(ghostOf(S.v.me.hand.find(h => h.c === pb.c).id, pb.c), { ghost: 1 }) : `<span class="exc-empty">${side === 'me' ? 'lane ' + (l + 1) : ''}</span>`}${pend ? gadOn(side, l) : ''}</button>`;
      }).join('')}</div>`;
      return row('op', v.op.lanes) + `<div class="exc-mid"><span>Round <b>${v.round}</b>/${v.rounds}</span><span class="exc-en" title="Energy">${'<i class="on"></i>'.repeat(Math.max(0, S.anim ? 0 : energyLeft()))}${'<i></i>'.repeat(Math.max(0, v.me.en - (S.anim ? 0 : energyLeft())))}<b>${S.anim ? v.me.en : energyLeft()}/${v.me.en}</b></span>${S.d.kind === 'pvp' && S.dl && v.phase === 'plan' ? '<span class="exc-timer" title="Time left to lock in"></span>' : ''}${pend && pend.some(p => p.lane < 0) ? `<span class="exc-gnow">${pend.filter(p => p.lane < 0).map(p => esc(name(S.v.me.hand.find(h => h.c === p.c).id))).join(', ')}</span>` : ''}</div>` + row('me', v.me.lanes);
    }
    const hpBar = (hp) => `<span class="exc-hpbar"><i style="width:${Math.max(0, Math.min(100, hp / R.hp * 100))}%"></i></span><b class="exc-hpn">${Math.max(0, hp)}</b>`;
    function draw() {
      if (w.closed) return;
      if (S.wait && !S.v) { box.innerHTML = `<div class="exc-wait"><div class="exc-spin">${ExKit.back()}</div><p>${esc(S.wait)}</p>${S.msg ? `<p class="exc-msg">${esc(S.msg)}</p>` : ''}<p><button class="btn" data-cancel>Cancel</button></p></div>`; box.querySelector('[data-cancel]').onclick = () => { if (S.sess) try { S.sess.leave(true); } catch (e) {} S.sess = null; S.wait = ''; S.msg = ''; draw(); }; say('Card Clash'); return; }
      if (!S.d || !S.v) return start();
      const v = S.v, pend = v.me.lock ? (S.locked || []) : S.plays, oppKey = S.d.ai || 'friend';
      const opBadge = v.op.lock && v.phase === 'plan' ? '<span class="exc-lockd">LOCKED IN</span>' : '';
      box.innerHTML = `<div class="exc-game">
        <div class="exc-pl exc-plop"><span class="exc-face">${FACES[oppKey] || FACES.friend}</span><span class="exc-nm">${esc(S.d.opp || v.op.name)}${opBadge}</span>${hpBar(v.op.hp)}<span class="exc-cnt" title="Cards in their hand / deck">&#127183; ${v.op.hand} &middot; deck ${v.op.deck}</span></div>
        <div class="exc-board">${board(v, pend)}<div class="exc-fx" aria-hidden="true"></div></div>
        <div class="exc-pl exc-plme"><span class="exc-nm">You</span>${hpBar(v.me.hp)}<span class="exc-cnt">deck ${v.me.deck}</span>${v.ini ? '<span class="exc-ini" title="You go first this round (your gadgets go off first)">1st</span>' : ''}</div>
        <div class="exc-hand">${v.me.hand.map(h => { const d = def(h.id), used = pend.some(p => p.c === h.c); return `<button type="button" class="exc-hc${S.sel === h.c ? ' sel' : ''}${used ? ' used' : ''}${!used && d.cost > (S.anim ? 99 : energyLeft()) ? ' dear' : ''}" data-c="${h.c}" title="${esc(name(h.id))}">${ExArt.battle(h.id)}</button>`; }).join('') || '<span class="exc-none">No cards in your hand.</span>'}</div>
        <div class="exc-act">${v.phase === 'plan' ? (v.me.lock ? `<span class="exc-hint">${S.d.kind === 'pvp' ? `Locked in! Waiting for ${esc(S.d.opp)}...` : 'Locked in!'}</span>` : `<span class="exc-hint">${esc(S.msg || hint())}</span><button class="btn" data-clear${S.plays.length ? '' : ' disabled'}>Clear</button><button class="btn exc-go" data-go><b>LOCK IN!</b></button>`) : ''}${S.anim ? '<button class="btn" data-skip>Skip &raquo;</button>' : ''}</div>
      </div>${v.phase === 'over' && !S.anim ? overHtml() : ''}`;
      box.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => pickCard(+b.dataset.c)));
      box.querySelectorAll('.exc-lane').forEach(b => b.addEventListener('click', () => pickLane(b.dataset.side, +b.dataset.l)));
      const q = s => box.querySelector(s);
      if (q('[data-go]')) q('[data-go]').onclick = lockIn;
      if (q('[data-clear]')) q('[data-clear]').onclick = () => { S.plays = []; S.sel = 0; draw(); };
      if (q('[data-skip]')) q('[data-skip]').onclick = () => { if (S.anim) S.anim.skip = 1; };
      wireOver();
      say(v.phase === 'over' ? 'Game over' : `${S.d.kind === 'pvp' ? 'Online' : 'Against ' + (X.CPU[S.d.ai] || {}).n} | Round ${v.round} of ${v.rounds} | You ${Math.max(0, v.me.hp)} HP, them ${Math.max(0, v.op.hp)} HP`);
    }
    function hint() {
      if (S.sel) { const h = S.v.me.hand.find(x => x.c === S.sel), d = h && def(h.id); return d.kind === 'b' ? `Now click one of your empty lanes for ${name(h.id)}.` : d.tg === 'own' ? 'Now click one of your lanes to use it on.' : 'Now click one of THEIR lanes to aim it.'; }
      if (S.v.round === 1 && !S.plays.length) return 'Click a card in your hand, then click a lane. Then LOCK IN!';
      return S.plays.length ? `Energy left: ${energyLeft()}. Happy? LOCK IN!` : 'Pick your cards for this round (or lock in with none).';
    }

    // ---------------------------------------------------------------- the start screen
    function start() {
      const cs = (EX.me && EX.me.cs) || { cpu: {} }, deckN = EX.me && EX.me.deck ? EX.me.deck.length : 0;
      box.innerHTML = `<div class="exc-start"><div class="exc-logo"><span>CARD</span><span>CLASH!</span><small>Byte Beasties &middot; three lanes &middot; ten rounds &middot; no mercy</small></div>
        ${S.msg ? `<p class="exc-msg">${esc(S.msg)}</p>` : ''}
        <div class="exc-opps">${Object.keys(X.CPU).map(k => { const c = X.CPU[k], r = cs.cpu && cs.cpu[k]; return `<div class="exc-opp"><span class="exc-face">${FACES[k]}</span><div><b>${esc(c.n)}</b> <span class="exc-lv">${['EASY', 'MEDIUM', 'HARD'][c.lv]}</span><small>${esc(c.d)}</small><small>${EX.member ? `Win: <b>${EX.rp(c.pay)}</b>` : 'Members win Rupees'}${r ? ` &middot; you: ${r.w} won, ${r.l} lost` : ''}</small></div><button class="btn" data-ai="${k}">Play!</button></div>`; }).join('')}
        <div class="exc-opp"><span class="exc-face">${FACES.friend}</span><div><b>Somebody on JackNet</b> <span class="exc-lv">ONLINE</span><small>Invite anybody who's on, or put your name up in "Who wants to play?". Wins pay ${EX.rp(X.EARN.exduel.amt)} and Card Clash League points.</small></div><button class="btn" data-friend${window.MP ? '' : ' disabled'}>Find someone</button></div></div>
        <div class="exc-mydeck">${EX.member ? (deckN >= X.DECK.size ? `Your deck: <b>${deckN} cards</b>, ready!` : `Your deck has <b>${deckN}</b> of ${X.DECK.size} cards: the rest are lent by the shop.`) : 'Guests play with the shop\'s loaner deck (and win nothing). Members get a FREE starter deck at The Card Korner!'} <button class="btn" data-deck>Edit deck</button> <button class="btn" data-rules>How to play</button></div>
        ${cs.w || cs.l ? `<p class="exc-rec">Your record: ${cs.w} won, ${cs.l} lost, ${cs.d || 0} drawn${cs.pvp && (cs.pvp.w || cs.pvp.l) ? ` (online: ${cs.pvp.w}-${cs.pvp.l})` : ''}</p>` : ''}</div>`;
      box.querySelectorAll('[data-ai]').forEach(b => b.addEventListener('click', () => cpu(b.dataset.ai)));
      box.querySelector('[data-friend]').onclick = friend;
      box.querySelector('[data-deck]').onclick = () => A.open('ex.binder', 'deck');
      box.querySelector('[data-rules]').onclick = () => EX.go('http://www.cardkorner.kidz/rules.html');
      S.msg = '';
      say(EX.member ? 'Pick an opponent' : 'Not logged on: playing just for fun');
    }

    // ---------------------------------------------------------------- the end
    function overHtml() {
      const v = S.v, r = S.d.res || {}, win = v.win === 0, draw2 = v.win === 2;
      const why = { ko: win ? 'Knocked out!' : 'You were knocked out.', time: 'After ten rounds, on Hit Points.', quit: win ? 'They resigned.' : 'You resigned.', idle: win ? 'They ran out of time.' : 'You ran out of time.', left: win ? 'They left the game.' : 'Game abandoned.' }[v.why] || '';
      return `<div class="exc-over"><div class="exc-ob ${win ? 'win' : draw2 ? 'draw' : 'lose'}"><h2>${win ? 'YOU WIN!' : draw2 ? 'A DRAW!' : 'YOU LOST!'}</h2><p>${esc(why)} ${Math.max(0, v.me.hp)} - ${Math.max(0, v.op.hp)}</p>${r.amt ? `<p class="exc-prize">+${EX.rp(r.amt)}!</p>` : win && EX.member && S.d.kind === 'cpu' ? '<p class="exc-small">(No Rupees this time: you have had today\'s Card Clash prizes.)</p>' : ''}${r.pts ? `<p>+${r.pts} Card Clash League point${r.pts > 1 ? 's' : ''}</p>` : ''}${!EX.member && win ? '<p class="exc-small">JackNet members win Rupees for that!</p>' : ''}<p class="row" style="justify-content:center;gap:6px;flex-wrap:wrap">${S.d.kind === 'cpu' ? `<button class="btn" data-again><b>Play ${esc(X.CPU[S.d.ai].n)} again</b></button>` : ''}<button class="btn" data-menu>Choose opponent</button></p></div></div>`;
    }
    function wireOver() {
      const a = box.querySelector('[data-again]'); if (a) a.onclick = () => cpu(S.d.ai);
      const m = box.querySelector('[data-menu]'); if (m) m.onclick = () => { S.d = null; S.v = null; draw(); };
    }
    function over() {
      const v = S.v; EX.sfx(v.win === 0 ? 'solve' : v.win === 2 ? 'boing' : 'uhoh');
      if (S.sess && !S.sess.ended) { try { S.sess.end('Game over'); } catch (e) {} }
      if (v.win === 0 && S.last) { /* (the server already paid) */ }
      EX.send({ t: 'exMe' });
    }

    // ---------------------------------------------------------------- playing back a round
    function play(prev, d) {
      const dm = JSON.parse(JSON.stringify(prev)); // the board as it was; the log changes it bit by bit
      dm.me.lock = 1; dm.op.lock = 1;
      const evs = d.log.filter(e => e.k !== 'draw');
      const P = s => (s === 0 ? dm.me : dm.op);
      const anim = S.anim = { skip: 0 };
      S.v = dm; S.plays = []; S.sel = 0; S.locked = [];
      let i = 0;
      const pop = (side, l, txt, cls) => { // a floating number over a lane (or a player's bar when l < 0)
        const fx = box.querySelector('.exc-fx'); if (!fx) return;
        const t = l >= 0 ? box.querySelector(`.exc-lane[data-side="${side}"][data-l="${l}"]`) : box.querySelector(side === 'me' ? '.exc-plme .exc-hpbar' : '.exc-plop .exc-hpbar');
        if (!t) return; const r = t.getBoundingClientRect(), fr = fx.getBoundingClientRect();
        const s = document.createElement('span'); s.className = 'exc-pop ' + (cls || ''); s.textContent = txt;
        s.style.left = (r.left - fr.left + r.width / 2) + 'px'; s.style.top = (r.top - fr.top + r.height / 2) + 'px';
        fx.appendChild(s); setTimeout(() => s.remove(), 1100);
      };
      const banner = (txt, cls) => { const fx = box.querySelector('.exc-fx'); if (!fx) return; const s = document.createElement('div'); s.className = 'exc-ban ' + (cls || ''); s.innerHTML = txt; fx.appendChild(s); setTimeout(() => s.remove(), 900); };
      const sd = s => (s === 0 ? 'me' : 'op');
      const flash = (s, l, c) => { const b = P(s).lanes[l]; if (b) b.fx = c; };
      const step = () => {
        if (w.closed) return;
        if (anim.skip || i >= evs.length) return finish();
        const e = evs[i++]; let ms = 430;
        for (const s of [0, 1]) for (const b of P(s).lanes) if (b) b.fx = '';
        switch (e.k) {
          case 'place': { const df = def(e.id); if (e.s === 0) { const hi = P(0).hand.findIndex(h => h.id === e.id); if (hi >= 0) P(0).hand.splice(hi, 1); } P(e.s).lanes[e.l] = { c: 0, id: e.id, atk: df.atk, tmp: 0, hp: df.hp, max: df.hp, el: df.el, ab: df.ab, fx: 'arrive' }; if (e.s === 1) P(1).hand = Math.max(0, P(1).hand - 1); ms = 300; EX.sfx('turn'); break; }
          case 'gad': { if (e.s === 0) { const hi = P(0).hand.findIndex(h => h.id === e.id); if (hi >= 0) P(0).hand.splice(hi, 1); } else P(1).hand = Math.max(0, P(1).hand - 1); draw(); banner(`${ExArt.battle(e.id)}<b>${esc(name(e.id))}</b>`, e.s === 0 ? 'mine' : 'theirs'); EX.sfx('zap'); return setTimeout(step, 900); }
          case 'heal': P(e.s).hp = Math.min(R.hp, P(e.s).hp + e.n); draw(); pop(sd(e.s), -1, '+' + e.n, 'heal'); EX.sfx('pet'); return setTimeout(step, ms);
          case 'face': P(1 - e.s).hp -= e.n; draw(); pop(sd(1 - e.s), -1, '-' + e.n, 'hurt'); EX.sfx('thud'); return setTimeout(step, ms);
          case 'buff': { const b = P(e.s).lanes[e.l]; if (b) { if (e.atk) b.tmp += e.atk; if (e.hp) { b.hp += e.hp; b.max += e.hp; } if (e.sh) b.sh = 1; b.fx = 'buff'; } draw(); pop(sd(e.s), e.l, (e.atk ? (e.atk > 0 ? '+' : '') + e.atk + ' ATK ' : '') + (e.hp ? '+' + e.hp + ' HP' : '') + (e.sh ? 'SHIELD' : ''), e.atk < 0 ? 'hurt' : 'heal'); return setTimeout(step, ms); }
          case 'fizz': draw(); pop(sd(e.s === 0 ? 0 : 1), e.l, 'fizzle...', 'meh'); return setTimeout(step, 350);
          case 'zap': case 'reach': { const t = e.k === 'zap' ? e.t : 1 - e.s, l = e.k === 'zap' ? e.l : e.tl, b = P(t).lanes[l]; if (b) { b.hp -= e.d; b.fx = 'hit'; } draw(); pop(sd(t), l, '-' + e.d, 'hurt'); EX.sfx('zap'); return setTimeout(step, ms); }
          case 'thorn': { const b = P(e.s).lanes[e.l]; if (b) { b.hp -= e.d; b.fx = 'hit'; } draw(); pop(sd(e.s), e.l, '-' + e.d + ' spiky!', 'hurt'); return setTimeout(step, 350); }
          case 'pierce': P(1 - e.s).hp -= e.d; draw(); pop(sd(1 - e.s), -1, '-' + e.d + ' overflow!', 'hurt'); return setTimeout(step, ms);
          case 'hit': {
            const att = P(e.s).lanes[e.l]; if (att) att.fx = e.s === 0 ? 'lunge-up' : 'lunge-down';
            if (e.t === 'face') { P(1 - e.s).hp -= e.d; draw(); pop(sd(1 - e.s), -1, '-' + e.d, 'hurt big'); if (e.hov) pop(sd(e.s), e.l, 'HOVER!', 'meh'); EX.sfx('thud'); }
            else { const b = P(1 - e.s).lanes[e.l]; if (b) { b.hp -= e.d; b.fx = 'hit'; } draw(); pop(sd(1 - e.s), e.l, '-' + e.d + (e.m > 0 ? ' SUPER!' : e.m < 0 ? ' (weak)' : ''), 'hurt' + (e.m > 0 ? ' big' : '')); EX.sfx(e.m > 0 ? 'zap' : 'click'); if (e.m > 0 && e.s === 0) { const at = P(0).lanes[e.l]; if (at && at.el === 'sprout' && P(1).lanes[e.l] && P(1).lanes[e.l].el === 'cosmic') A.secret('ex.sprouts'); } }
            return setTimeout(step, 520);
          }
          case 'die': { const b = P(e.s).lanes[e.l]; if (b) b.fx = 'dead'; draw(); EX.sfx('uhoh'); setTimeout(() => { P(e.s).lanes[e.l] = null; draw(); step(); }, 420); return; }
          case 'hand': { P(e.s).lanes[e.l] = null; draw(); pop(sd(e.s), e.l, e.why === 'reborn' ? 'REBORN!' : 'back to hand!', 'heal'); return setTimeout(step, 450); }
          case 'lost': { P(e.s).lanes[e.l] = null; draw(); return setTimeout(step, 300); }
          case 'grow': { const b = P(e.s).lanes[e.l]; if (b) { b.atk++; b.fx = 'buff'; } draw(); pop(sd(e.s), e.l, '+1 ATK', 'heal'); return setTimeout(step, 350); }
          case 'mull': draw(); pop(sd(e.s), -1, 'new hand!', 'meh'); return setTimeout(step, 400);
          case 'phase': draw(); banner(e.n === 'speedy' ? 'SPEEDY STRIKE!' : 'FIGHT!', e.n); return setTimeout(step, e.n === 'fight' ? 650 : 550);
          case 'end': return finish();
        }
        draw(); setTimeout(step, ms);
      };
      const finish = () => {
        if (S.anim !== anim) return;
        S.anim = null; S.v = d.v; S.locked = []; draw();
        if (d.v.phase === 'over') over(); else if (d.v.round > prev.round) { const b = box.querySelector('.exc-fx'); if (b) { const s = document.createElement('div'); s.className = 'exc-ban round'; s.textContent = `ROUND ${d.v.round}`; b.appendChild(s); setTimeout(() => s.remove(), 900); } }
      };
      draw(); setTimeout(step, 250);
    }

    if (arg.sess) sess(arg.sess); else { draw(); EX.send({ t: 'exClashMine' }); if (EX.member) EX.send({ t: 'exMe' }); }
    return w;
  }
  window.ExClash = { open };
})();

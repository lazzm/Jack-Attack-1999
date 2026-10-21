/* ex-duel: the CARD CLASH engine (JackCards battles). Pure rules, no screen: the server (mods/ex.js) runs every real game
 * with it, and the browser loads it to explain cards and to preview a plan. Deterministic: the only randomness is the
 * shuffle, which comes from the game's seed.
 * A game: two players, 20 Hit Points each, three lanes each side. Every round both players secretly pick cards to play
 * (beasts into empty lanes, gadgets on a lane or on nobody) with that round's energy (1 in round 1, up to 6). Then both
 * plans are revealed at once: beasts arrive, gadgets go off, speedy beasts strike, then everybody else strikes. A beast
 * hits the beast in front of it, or the other player if its lane is empty. Knock the other player to 0, or have more
 * Hit Points after round 10.
 *   ExDuel.create({ seed, names:[a,b], decks:[[ids],[ids]] }) -> state     ExDuel.check(st, side, plays) -> '' | why not
 *   ExDuel.lock(st, side, plays)   ExDuel.ready(st)   ExDuel.resolve(st) -> log   ExDuel.view(st, side)   ExDuel.ai(st, side, lv) */
(function (root) {
  'use strict';
  const CAT = typeof module !== 'undefined' && module.exports ? require('./ex-cat.js') : root.ExCat;
  const R = CAT.DUEL, B = CAT.BATTLE;
  const def = id => B[id] || null;
  const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  // mulberry32, kept in the state so a game can be saved and carried on
  function rnd(st) { st.rs = (st.rs + 0x6D2B79F5) | 0; let t = Math.imul(st.rs ^ (st.rs >>> 15), 1 | st.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function shuffle(st, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(st) * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  function create(o) {
    const st = { v: 1, seed: o.seed >>> 0, rs: o.seed | 0, round: 1, phase: 'plan', ini: 0, win: -1, why: '', next: 1, p: [], log: [], hist: [] };
    for (let s = 0; s < 2; s++) {
      const deck = (o.decks[s] || []).filter(def).map(id => ({ c: st.next++, id }));
      st.p.push({ name: String(o.names[s] || 'Player ' + (s + 1)), hp: R.hp, en: 1, deck: shuffle(st, deck), hand: [], lanes: [null, null, null], lock: 0, plays: null, idle: 0 });
    }
    for (let s = 0; s < 2; s++) for (let i = 0; i < R.hand0; i++) draw(st, s);
    st.ini = rnd(st) < 0.5 ? 0 : 1;
    return st;
  }
  function draw(st, s, log) {
    const P = st.p[s]; if (!P.deck.length || P.hand.length >= R.handMax) return false;
    P.hand.push(P.deck.shift()); if (log) log.push({ k: 'draw', s }); return true;
  }
  const beastOf = (card, round) => { const d = def(card.id); return { c: card.c, id: card.id, atk: d.atk, hp: d.hp, max: d.hp, el: d.el, ab: d.ab || '', tmp: 0, sh: 0, rb: card.rb ? 1 : 0, born: round, fresh: 1 }; };

  // ---------------------------------------------------------------- plans
  // plays: [{ c, lane }]  (lane 0-2 for a beast; for a gadget the lane it's aimed at, or -1)
  function check(st, s, plays) {
    if (st.phase !== 'plan') return 'The round is already being played!';
    const P = st.p[s]; if (!P) return 'Who are you?';
    if (P.lock) return 'You have already locked in this round.';
    if (!Array.isArray(plays) || plays.length > R.handMax) return 'That plan is muddled.';
    const seen = new Set(), lanes = new Set(); let cost = 0;
    for (const pl of plays) {
      if (!pl || !isInt(pl.c, 1, 1e6) || !isInt(pl.lane, -1, 2) || seen.has(pl.c)) return 'That plan is muddled.';
      seen.add(pl.c);
      const card = P.hand.find(x => x.c === pl.c); if (!card) return "That card isn't in your hand.";
      const d = def(card.id); if (!d) return "That card can't be played in Card Clash.";
      cost += d.cost;
      if (d.kind === 'b') {
        if (pl.lane < 0 || P.lanes[pl.lane] || lanes.has(pl.lane)) return 'That lane is already taken.';
        lanes.add(pl.lane);
      }
    }
    if (cost > P.en) return `Not enough energy! That costs ${cost} and you have ${P.en}.`;
    for (const pl of plays) { // gadgets aimed at your own lane need something there (now, or arriving this round)
      const d = def(P.hand.find(x => x.c === pl.c).id);
      if (d.kind === 'g' && d.tg && pl.lane < 0) return 'Pick a lane for that gadget.';
      if (d.kind === 'g' && d.tg === 'own' && !P.lanes[pl.lane] && !lanes.has(pl.lane)) return 'There is nothing of yours in that lane to use it on.';
    }
    return '';
  }
  function lock(st, s, plays) { const P = st.p[s]; P.plays = plays.map(p => ({ c: p.c, lane: p.lane })); P.lock = 1; }
  const ready = st => st.phase === 'plan' && st.p[0].lock && st.p[1].lock;

  // ---------------------------------------------------------------- the round
  const cheerOf = (st, s, b) => st.p[s].lanes.filter(x => x && x !== b && x.ab === 'cheer' && x.hp > 0).length;
  const atkOf = (st, s, b) => Math.max(0, b.atk + b.tmp + cheerOf(st, s, b));
  const heal = (P, n) => { P.hp = Math.min(R.hp, P.hp + n); };
  function toHand(st, s, b, log, why) {
    const P = st.p[s], l = P.lanes.indexOf(b); P.lanes[l] = null;
    if (P.hand.length < R.handMax) { P.hand.push({ c: b.c, id: b.id, rb: b.rb ? 1 : undefined }); log.push({ k: 'hand', s, l, id: b.id, why }); }
    else log.push({ k: 'lost', s, l, id: b.id });
  }
  function bury(st, log) { // knocked-out beasts leave (a Reborn one goes back to the hand, once)
    for (let s = 0; s < 2; s++) st.p[s].lanes.forEach((b, l) => {
      if (!b || b.hp > 0) return;
      log.push({ k: 'die', s, l, id: b.id });
      if (b.ab === 'reborn' && !b.rb) { b.rb = 1; toHand(st, s, b, log, 'reborn'); } else st.p[s].lanes[l] = null;
    });
  }
  function dmgBeast(b, n) { if (b.sh) return 0; if (b.ab === 'armour') n -= 1; return Math.max(0, n); }
  function gadget(st, s, card, lane, log) {
    const d = def(card.id), fx = d.fx, P = st.p[s], O = st.p[1 - s];
    log.push({ k: 'gad', s, id: card.id, l: lane });
    if (fx.heal) { heal(P, fx.heal); log.push({ k: 'heal', s, n: fx.heal }); }
    if (fx.face) { O.hp -= fx.face; log.push({ k: 'face', s, n: fx.face }); }
    if (fx.mull) { const n = P.hand.length; P.deck.push(...P.hand); P.hand = []; shuffle(st, P.deck); for (let i = 0; i < n; i++) draw(st, s); log.push({ k: 'mull', s, n }); }
    if (fx.draw) for (let i = 0; i < fx.draw; i++) draw(st, s, log);
    if (fx.own && lane >= 0) {
      const b = P.lanes[lane];
      if (!b) log.push({ k: 'fizz', s, l: lane });
      else {
        const o = fx.own;
        if (o.atk) b.atk += o.atk; if (o.hp) { b.hp += o.hp; b.max += o.hp; } if (o.tmp) b.tmp += o.tmp; if (o.shield) b.sh = 1;
        log.push({ k: 'buff', s, l: lane, atk: (o.atk || 0) + (o.tmp || 0), hp: o.hp || 0, sh: o.shield ? 1 : 0 });
        if (o.rescue) toHand(st, s, b, log, 'rescue');
      }
    }
    if (fx.foe && lane >= 0) {
      const b = O.lanes[lane];
      if (!b) log.push({ k: 'fizz', s, l: lane });
      else {
        const o = fx.foe;
        if (o.tmp) { b.tmp += o.tmp; log.push({ k: 'buff', s: 1 - s, l: lane, atk: o.tmp }); }
        if (o.dmg) { const n = dmgBeast(b, o.dmg); b.hp -= n; log.push({ k: 'zap', s, t: 1 - s, l: lane, d: n }); }
        if (o.bounce) toHand(st, 1 - s, b, log, 'bounce');
      }
    }
    if (fx.allFoe) O.lanes.forEach((b, l) => { if (!b) return; if (fx.allFoe.tmp) { b.tmp += fx.allFoe.tmp; log.push({ k: 'buff', s: 1 - s, l, atk: fx.allFoe.tmp }); } if (fx.allFoe.dmg) { const n = dmgBeast(b, fx.allFoe.dmg); b.hp -= n; log.push({ k: 'zap', s, t: 1 - s, l, d: n }); } });
    if (fx.allOwn) P.lanes.forEach((b, l) => { if (!b) return; if (fx.allOwn.tmp) b.tmp += fx.allOwn.tmp; if (fx.allOwn.hp) { b.hp += fx.allOwn.hp; b.max += fx.allOwn.hp; } log.push({ k: 'buff', s, l, atk: fx.allOwn.tmp || 0, hp: fx.allOwn.hp || 0 }); });
  }
  // one strike phase: everybody in `who` hits at once (worked out first, then all the damage lands together)
  function strikes(st, log, who) {
    const hits = [], face = [0, 0], healF = [0, 0];
    for (let s = 0; s < 2; s++) {
      const O = st.p[1 - s];
      st.p[s].lanes.forEach((b, l) => {
        if (!b || b.hp <= 0 || !who(b)) return;
        const y = O.lanes[l], a = atkOf(st, s, b);
        if (!y || y.hp <= 0 || (b.ab === 'hover' && y.ab !== 'hover')) {
          face[1 - s] += a; if (b.ab === 'leech') healF[s] += a;
          log.push({ k: 'hit', s, l, t: 'face', d: a, hov: !!y });
        } else {
          const m = CAT.elMod(b.el, y.el), n = dmgBeast(y, Math.max(0, a + m));
          hits.push({ s: 1 - s, l, n, from: b, pierce: b.ab === 'pierce' });
          log.push({ k: 'hit', s, l, t: 'beast', d: n, m });
          if (y.ab === 'thorns' && y.hp > 0) hits.push({ s, l, n: dmgBeast(b, 1), thorn: 1 });
        }
        if (b.ab === 'reach') for (const l2 of [l - 1, l + 1]) { const z = O.lanes[l2]; if (z && z.hp > 0) { const n = dmgBeast(z, 1); hits.push({ s: 1 - s, l: l2, n }); log.push({ k: 'reach', s, l, tl: l2, d: n }); } }
      });
    }
    const start = st.p.map(P => P.lanes.map(b => (b ? b.hp : 0)));
    for (const h of hits) {
      const b = st.p[h.s].lanes[h.l]; if (!b) continue;
      b.hp -= h.n;
      if (h.thorn) log.push({ k: 'thorn', s: h.s, l: h.l, d: h.n });
      if (h.pierce && h.n > start[h.s][h.l]) { const over = h.n - Math.max(0, start[h.s][h.l]); face[h.s] += over; log.push({ k: 'pierce', s: 1 - h.s, l: h.l, d: over }); }
    }
    for (let s = 0; s < 2; s++) { st.p[s].hp -= face[s]; if (healF[s]) { heal(st.p[s], healF[s]); log.push({ k: 'heal', s, n: healF[s], leech: 1 }); } }
  }
  function resolve(st) {
    const log = []; st.log = log;
    const order = [st.ini, 1 - st.ini], gq = [[], []], arrived = [[], []];
    for (let s = 0; s < 2; s++) {
      const P = st.p[s];
      for (const pl of P.plays || []) {
        const i = P.hand.findIndex(x => x.c === pl.c); if (i < 0) continue;
        const card = P.hand.splice(i, 1)[0], d = def(card.id); P.en -= d.cost;
        if (d.kind === 'b') { const b = beastOf(card, st.round); P.lanes[pl.lane] = b; arrived[s].push(b); log.push({ k: 'place', s, l: pl.lane, id: card.id }); }
        else gq[s].push([card, pl.lane]);
      }
    }
    for (const s of order) for (const b of arrived[s]) { // arrival abilities
      if (b.ab === 'clever') draw(st, s, log);
      if (b.ab === 'spark') { const O = st.p[1 - s], l = st.p[s].lanes.indexOf(b), y = O.lanes[l]; if (y) { const n = dmgBeast(y, 1); y.hp -= n; log.push({ k: 'zap', s, t: 1 - s, l, d: n, spark: 1 }); } else { O.hp -= 1; log.push({ k: 'face', s, n: 1, spark: 1 }); } }
    }
    for (const s of order) for (const [card, lane] of gq[s]) gadget(st, s, card, lane, log);
    bury(st, log);
    if (!over(st, log)) {
      log.push({ k: 'phase', n: 'speedy' }); strikes(st, log, b => b.ab === 'first'); bury(st, log);
      log.push({ k: 'phase', n: 'fight' }); strikes(st, log, b => b.ab !== 'first'); bury(st, log);
    }
    if (!over(st, log)) {
      for (let s = 0; s < 2; s++) {
        const P = st.p[s], n = P.lanes.filter(b => b && b.ab === 'heal').length;
        for (const b of P.lanes) if (b) { if (b.ab === 'grow') { b.atk++; log.push({ k: 'grow', s, l: P.lanes.indexOf(b) }); } b.tmp = 0; b.sh = 0; b.fresh = 0; }
        if (n) { heal(P, n); log.push({ k: 'heal', s, n }); }
      }
      if (st.round >= R.rounds) end(st, log, st.p[0].hp === st.p[1].hp ? 2 : st.p[0].hp > st.p[1].hp ? 0 : 1, 'time');
    }
    st.hist.push({ r: st.round, hp: [st.p[0].hp, st.p[1].hp] }); if (st.hist.length > 12) st.hist.shift();
    if (st.phase !== 'over') {
      st.round++; st.ini = 1 - st.ini;
      for (let s = 0; s < 2; s++) { const P = st.p[s]; P.en = Math.min(R.enMax, st.round); P.lock = 0; P.plays = null; P.auto = 0; draw(st, s, log); }
    } else for (let s = 0; s < 2; s++) { st.p[s].lock = 0; st.p[s].plays = null; }
    return log;
  }
  function over(st, log) {
    const a = st.p[0].hp <= 0, b = st.p[1].hp <= 0;
    if (!a && !b) return false;
    end(st, log, a && b ? (st.p[0].hp === st.p[1].hp ? 2 : st.p[0].hp > st.p[1].hp ? 0 : 1) : a ? 1 : 0, 'ko');
    return true;
  }
  function end(st, log, win, why) { st.phase = 'over'; st.win = win; st.why = why; log.push({ k: 'end', win, why }); }
  function forfeit(st, s, why) { if (st.phase === 'over') return; st.phase = 'over'; st.win = 1 - s; st.why = why || 'quit'; st.log = [{ k: 'end', win: 1 - s, why: st.why }]; }

  // ---------------------------------------------------------------- what each player can see
  function view(st, s) {
    const me = st.p[s], op = st.p[1 - s];
    const lane = b => (b ? { c: b.c, id: b.id, atk: b.atk, tmp: b.tmp, hp: b.hp, max: b.max, el: b.el, ab: b.ab, rb: b.rb } : null);
    return {
      round: st.round, rounds: R.rounds, phase: st.phase, win: st.win < 0 ? -1 : st.win === 2 ? 2 : st.win === s ? 0 : 1, why: st.why, // win: 0 = you, 1 = them, 2 = a draw ini: st.ini === s ? 1 : 0, side: s, hist: st.hist,
      me: { name: me.name, hp: me.hp, en: me.en, hand: me.hand.map(x => ({ c: x.c, id: x.id, rb: x.rb })), deck: me.deck.length, lanes: me.lanes.map(lane), lock: me.lock, plays: me.plays },
      op: { name: op.name, hp: op.hp, en: op.en, hand: op.hand.length, deck: op.deck.length, lanes: op.lanes.map(lane), lock: op.lock },
    };
  }
  // the log, turned round so 's' always means "me" (0) or "them" (1) for side `s`
  const logFor = (log, s) => log.map(e => { const o = Object.assign({}, e); for (const k of ['s', 't']) if (k in o && o[k] != null && typeof o[k] === 'number') o[k] = o[k] === s ? 0 : 1; if ('win' in o && o.win !== 2) o.win = o.win === s ? 0 : 1; return o; });

  // ---------------------------------------------------------------- the computer players
  // lv 0 (Dave): plays what he picks up, anywhere.  lv 1 (Callum): tries each move and keeps the ones that help, a bit
  // randomly.  lv 2 (JackK): the same without the wobble, and he guards the lanes where your beasts are.
  const clone = st => JSON.parse(JSON.stringify(st));
  function score(st, s) {
    const P = st.p[s], O = st.p[1 - s];
    if (st.phase === 'over') return st.win === s ? 10000 : st.win === 2 ? 0 : -10000;
    const val = L => L.reduce((t, b) => t + (b ? b.atk + b.hp * 0.8 + (b.ab ? 1 : 0) : 0), 0);
    return (P.hp - O.hp) * 3 + val(P.lanes) - val(O.lanes) * 1.1 + P.hand.length * 0.6 - (O.hp <= 6 ? O.hp * 2 : 0);
  }
  function simulate(st, s, plays, opp) {
    const t = clone(st); t.p[s].plays = plays; t.p[s].lock = 1; t.p[1 - s].plays = opp || []; t.p[1 - s].lock = 1;
    resolve(t); return score(t, s);
  }
  function cands(st, s) {
    const out = [];
    for (const card of st.p[s].hand) {
      const d = def(card.id); if (!d) continue;
      if (d.kind === 'b' || d.tg) { for (let l = 0; l < 3; l++) out.push({ c: card.c, lane: l }); } else out.push({ c: card.c, lane: -1 });
    }
    return out;
  }
  // greedy: one card at a time, keeping whatever improves value(plan) the most
  function greedy(st, s, value) {
    let plays = [], best = value(plays);
    for (let step = 0; step < 6; step++) {
      let pick = null, top = best + 0.3;
      for (const c of cands(st, s)) {
        if (plays.some(p => p.c === c.c)) continue;
        const next = plays.concat(c); if (check(st, s, next)) continue;
        const v = value(next); if (v > top) { top = v; pick = c; }
      }
      if (!pick) break;
      plays = plays.concat(pick); best = top;
    }
    return plays;
  }
  function ai(st, s, lv, rand) {
    rand = rand || Math.random;
    const P = st.p[s], O = st.p[1 - s];
    if (lv <= 0) { // Dave: shuffle the hand and play whatever fits
      const plays = [], hand = P.hand.slice().sort(() => rand() - 0.5);
      for (const card of hand) {
        const d = def(card.id); if (!d) continue;
        const free = [0, 1, 2].filter(l => !P.lanes[l] && !plays.some(p => p.lane === l && def(P.hand.find(x => x.c === p.c).id).kind === 'b'));
        let pl = null;
        if (d.kind === 'b' && free.length) pl = { c: card.c, lane: free[Math.floor(rand() * free.length)] };
        else if (d.kind === 'g' && rand() < 0.5) pl = { c: card.c, lane: d.tg ? Math.floor(rand() * 3) : -1 };
        if (pl && !check(st, s, plays.concat(pl))) plays.push(pl);
      }
      return plays;
    }
    if (lv === 1) { // Callum: thinks about what his own cards do (with a bit of a wobble)
      const noise = new Map();
      return greedy(st, s, pl => simulate(st, s, pl) + pl.reduce((t, c) => { const k = c.c * 7 + c.lane; if (!noise.has(k)) noise.set(k, (rand() - 0.5) * 3); return t + noise.get(k); }, 0));
    }
    // JackK: works out what you are likely to do first, then plans against that AND against you doing nothing
    const t = clone(st); t.p[1 - s].lock = 0; t.p[s].lock = 0;
    const guess = greedy(t, 1 - s, pl => simulate(t, 1 - s, pl));
    const block = pl => pl.reduce((v, c) => { const d = def(P.hand.find(x => x.c === c.c).id); return v + (d.kind === 'b' && O.lanes[c.lane] ? Math.min(4, atkOf(st, 1 - s, O.lanes[c.lane])) * 0.5 : 0); }, 0);
    return greedy(st, s, pl => simulate(st, s, pl) * 0.45 + simulate(st, s, pl, guess) * 0.55 + block(pl));
  }

  const X = { create, check, lock, ready, resolve, view, logFor, ai, forfeit, def, atkOf, R };
  if (typeof module !== 'undefined' && module.exports) module.exports = X; else root.ExDuel = X;
})(this);

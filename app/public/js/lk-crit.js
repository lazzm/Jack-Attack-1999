/* lk-crit: POCKET CRITTERS, the shared rule book. The Game Boy game (js/rm-g-mon.js: Moss Version and Puddle Version) and
 * the server's Cable Club referee (mods/lk.js) both read this file, so a critter, a move or a damage sum is only written
 * down once and a link battle comes out the same on both Game Boys.
 *   TYPES, CHART, eff(moveType, critterType)   the type chart
 *   MOVES   name -> [type, power, accuracy, effect]  (effect: atk- def- on the foe, atk+ def+ on yourself, heal, first)
 *   SP      the critters: { i, n, t, b:[hp, atk, def, spd], exp, rate, learn:[[lv, move]...], evo:[lv, into]|null, dex }
 *   TRADE_EVO  species -> what it turns into when it comes down a link cable
 *   VERSIONS   moss / puddle: which critters only live in that version's long grass (swap: wild table swaps)
 *   stat maxhp expAt movesAt   the sums (the same as the cartridge)
 *   clean(mon, ot)   a critter that came over the wire, checked: legal species, level, moves (or null)
 *   battle(teamA, teamB) / turn(B, acts, rnd) / sendIn(B, side, i)   the link battle referee (no items, no running: QUIT gives up) */
(function (root) {
  'use strict';
  const TYPES = ['FLUFF', 'MOSS', 'PUDDLE', 'EMBER', 'SPARK', 'ROCK'];
  const CHART = {
    MOSS: { PUDDLE: 2, ROCK: 2, EMBER: 0.5, MOSS: 0.5 },
    PUDDLE: { EMBER: 2, ROCK: 2, MOSS: 0.5, PUDDLE: 0.5 },
    EMBER: { MOSS: 2, PUDDLE: 0.5, ROCK: 0.5, EMBER: 0.5 },
    SPARK: { PUDDLE: 2, ROCK: 0.5, MOSS: 0.5, SPARK: 0.5 },
    ROCK: { EMBER: 2, SPARK: 2, MOSS: 0.5 },
    FLUFF: { ROCK: 0.5 },
  };
  const eff = (mt, dt) => (CHART[mt] && CHART[mt][dt]) || 1;
  const MOVES = {
    BONK: ['FLUFF', 40, 100], NIBBLE: ['FLUFF', 35, 100], POUNCE: ['FLUFF', 60, 95], GRUMBLE: ['FLUFF', 0, 100, 'atk-'], GLARE: ['FLUFF', 0, 100, 'def-'],
    'PUFF UP': ['FLUFF', 0, 100, 'def+'], SNOOZE: ['FLUFF', 0, 100, 'heal'], 'QUICK PECK': ['FLUFF', 40, 100, 'first'],
    'LEAF LICK': ['MOSS', 40, 100], 'TWIG SNAP': ['MOSS', 55, 100], 'MOSS BLAST': ['MOSS', 75, 90], 'SPORE CLOUD': ['MOSS', 0, 90, 'atk-'], STINGLE: ['MOSS', 45, 100],
    SPLOSH: ['PUDDLE', 40, 100], 'BUBBLE POP': ['PUDDLE', 55, 100], 'TIDAL BURP': ['PUDDLE', 75, 90],
    SIZZLE: ['EMBER', 40, 100], 'CINDER SPIT': ['EMBER', 55, 100], 'FLARE UP': ['EMBER', 75, 90],
    ZAP: ['SPARK', 40, 100], 'STATIC POP': ['SPARK', 55, 100], 'THUNDERCLAP': ['SPARK', 75, 90],
    'PEBBLE TOSS': ['ROCK', 45, 95], 'ROCK SLAM': ['ROCK', 65, 90], HARDEN: ['ROCK', 0, 100, 'def+'],
    LANDSLIDE: ['ROCK', 85, 85], 'MUD BATH': ['PUDDLE', 0, 100, 'heal'], 'STEAM HISS': ['EMBER', 0, 100, 'def-'], 'EEL WHIP': ['SPARK', 60, 95],
  };
  // [name, type, [hp, atk, def, spd], exp, catch rate, learnset, evolve [level, into], Critterdex words]
  // (the first 17 are the Moss Version's originals: never reorder, saves keep critters by number)
  const SP = [
    ['SPROUTLE', 'MOSS', [45, 49, 49, 45], 64, 0.3, [[1, 'BONK'], [1, 'GRUMBLE'], [5, 'LEAF LICK'], [8, 'SPORE CLOUD'], [11, 'TWIG SNAP'], [16, 'MOSS BLAST']], [12, 1], 'A sprout grows on its head. On sunny days it stands very still and hums.'],
    ['MOSSAURUS', 'MOSS', [62, 64, 66, 58], 142, 0.1, [[1, 'BONK'], [1, 'LEAF LICK'], [11, 'TWIG SNAP'], [15, 'MOSS BLAST']], null, 'Its back is a little garden. Birds have been known to nest in it.'],
    ['DRIZZLET', 'PUDDLE', [44, 48, 65, 43], 63, 0.3, [[1, 'BONK'], [1, 'PUFF UP'], [5, 'SPLOSH'], [8, 'POUNCE'], [11, 'BUBBLE POP'], [16, 'TIDAL BURP']], [12, 3], 'Shaped like a raindrop. It leaves little wet footprints everywhere it goes.'],
    ['TORRENTOAD', 'PUDDLE', [60, 63, 80, 56], 142, 0.1, [[1, 'SPLOSH'], [1, 'POUNCE'], [11, 'BUBBLE POP'], [15, 'TIDAL BURP']], null, 'It burps so loudly the jackos rattle. It is very proud of this.'],
    ['EMBERCUB', 'EMBER', [39, 52, 43, 65], 62, 0.3, [[1, 'NIBBLE'], [1, 'GRUMBLE'], [5, 'SIZZLE'], [9, 'GLARE'], [11, 'CINDER SPIT'], [16, 'FLARE UP']], [12, 5], 'The flame on its head flickers when it is happy. Keep it away from paper.'],
    ['BLAZEBEAR', 'EMBER', [58, 66, 58, 78], 142, 0.1, [[1, 'SIZZLE'], [1, 'GLARE'], [11, 'CINDER SPIT'], [15, 'FLARE UP']], null, 'Gives the warmest hugs of any critter. A bit too warm, really.'],
    ['FUZZBUN', 'FLUFF', [40, 45, 40, 56], 50, 0.9, [[1, 'BONK'], [1, 'GRUMBLE'], [6, 'NIBBLE'], [10, 'POUNCE']], null, 'A ball of fluff with ears. It eats your lettuce and says sorry with its eyes.'],
    ['PUFFPIP', 'FLUFF', [40, 42, 38, 60], 50, 0.9, [[1, 'QUICK PECK'], [1, 'GRUMBLE'], [8, 'PUFF UP'], [12, 'POUNCE']], null, 'A round little bird. It fluffs itself up to look scary. It does not look scary.'],
    ['ZAPLING', 'SPARK', [35, 50, 35, 80], 60, 0.5, [[1, 'ZAP'], [1, 'GRUMBLE'], [9, 'STATIC POP'], [15, 'THUNDERCLAP']], null, 'Its fur stands on end. It loves rubbing on jumpers to charge up.'],
    ['PEBBLIT', 'ROCK', [40, 60, 80, 20], 62, 0.6, [[1, 'BONK'], [1, 'HARDEN'], [6, 'PEBBLE TOSS'], [12, 'ROCK SLAM']], [14, 10], 'Looks like an ordinary pebble until it bites your toe.'],
    ['CRAGGLE', 'ROCK', [60, 80, 100, 30], 140, 0.2, [[1, 'PEBBLE TOSS'], [1, 'HARDEN'], [12, 'ROCK SLAM']], null, 'Grumpy and very heavy. It has never once been picked up. Its cousins say a long cable ride changes it.'],
    ['MUDWUMP', 'PUDDLE', [60, 50, 50, 40], 65, 0.6, [[1, 'SPLOSH'], [1, 'GRUMBLE'], [9, 'SNOOZE'], [11, 'BUBBLE POP']], null, 'Lives in puddles. If a puddle dries up it just sits and sulks until it rains.'],
    ['THORNET', 'MOSS', [40, 55, 45, 60], 58, 0.7, [[1, 'STINGLE'], [1, 'GLARE'], [7, 'LEAF LICK'], [10, 'SPORE CLOUD'], [13, 'TWIG SNAP']], null, 'A bug with thorny wings. Its buzz sounds like somebody humming badly.'],
    ['GLOWGRUB', 'SPARK', [45, 35, 50, 30], 52, 0.8, [[1, 'ZAP'], [1, 'PUFF UP'], [9, 'STATIC POP']], [11, 14], 'Its tail glows at night. Kids keep them in jars as night lights (then let them go).'],
    ['VOLTMOTH', 'SPARK', [60, 62, 55, 75], 135, 0.3, [[1, 'ZAP'], [1, 'STATIC POP'], [14, 'THUNDERCLAP']], null, 'Flies round street lamps all night. Static crackles off its wings.'],
    ['BRAMBLOB', 'MOSS', [70, 65, 70, 40], 120, 0.25, [[1, 'TWIG SNAP'], [1, 'HARDEN'], [1, 'SPORE CLOUD'], [14, 'MOSS BLAST']], null, 'A walking bush. Gardeners hate it. It hates gardeners back.'],
    ['MATCHLING', 'EMBER', [38, 58, 40, 72], 62, 0.45, [[1, 'SIZZLE'], [1, 'GRUMBLE'], [8, 'QUICK PECK'], [10, 'CINDER SPIT'], [15, 'FLARE UP']], null, 'A little living matchstick. It is very careful not to sit down too fast.'],
    // ---- new in the Puddle Version (and the link cable)
    ['FROGLET', 'PUDDLE', [45, 50, 45, 60], 60, 0.5, [[1, 'SPLOSH'], [1, 'GRUMBLE'], [7, 'POUNCE'], [10, 'BUBBLE POP'], [16, 'TIDAL BURP']], [14, 18], 'It sings by the pond at night and every frog in the street joins in. The neighbours are not pleased.'],
    ['CROAKMIRE', 'PUDDLE', [68, 72, 64, 62], 140, 0.15, [[1, 'SPLOSH'], [1, 'BUBBLE POP'], [1, 'POUNCE'], [15, 'TIDAL BURP']], null, 'One croak from it can be heard three villages away. It is very shy about this.'],
    ['STEAMLET', 'EMBER', [42, 55, 48, 58], 62, 0.45, [[1, 'SIZZLE'], [1, 'STEAM HISS'], [8, 'SPLOSH'], [10, 'CINDER SPIT'], [15, 'FLARE UP']], null, 'A little cloud of steam with feet. It lives in kettles and pops out when you make the tea.'],
    ['VOLTEEL', 'SPARK', [48, 60, 42, 70], 64, 0.35, [[1, 'ZAP'], [1, 'GLARE'], [8, 'EEL WHIP'], [11, 'STATIC POP'], [16, 'THUNDERCLAP']], null, 'A wriggly eel that lights the pond up like a school disco. Fish come from miles to dance.'],
    ['GRANITAN', 'ROCK', [80, 95, 115, 35], 170, 0.05, [[1, 'PEBBLE TOSS'], [1, 'HARDEN'], [1, 'ROCK SLAM'], [18, 'LANDSLIDE']], null, 'A CRAGGLE only grows this big after a trip down a link cable. It weighs as much as a bus. A double-decker one.'],
    ['BOGWUMP', 'PUDDLE', [85, 70, 70, 45], 160, 0.05, [[1, 'SPLOSH'], [1, 'MUD BATH'], [1, 'BUBBLE POP'], [16, 'TIDAL BURP']], null, 'A MUDWUMP that came down a link cable. Bigger, muddier and twice as grumpy. It loves a bath.'],
  ].map(([n, t, b, exp, rate, learn, evo, dex], i) => ({ i, n, t, b, exp, rate, learn, evo, dex }));
  const NSP = SP.length;
  const TRADE_EVO = { 10: 21, 11: 22 }; // CRAGGLE -> GRANITAN, MUDWUMP -> BOGWUMP
  const VERSIONS = {
    moss: { name: 'MOSS VERSION', only: [12, 15, 16], swap: {} },
    puddle: { name: 'PUDDLE VERSION', only: [17, 18, 19, 20], swap: { 12: 17, 16: 19, 15: 20 } },
  };

  // ---- the sums (the same as the cartridge's)
  const stat = (c, k) => Math.floor(SP[c.s].b[k] * 2 * c.lv / 100) + 5;
  const maxhp = c => Math.floor(SP[c.s].b[0] * 2 * c.lv / 100) + c.lv + 12;
  const expAt = lv => lv <= 1 ? 0 : Math.floor(lv * lv * lv * 0.6);
  const movesAt = (s, lv) => { const m = []; for (const [l, mv] of SP[s].learn) if (l <= lv && !m.includes(mv)) { m.push(mv); if (m.length > 4) m.shift(); } return m; };
  // every move this critter (or what it evolved from) could know at this level
  const before = s => { const out = [s]; for (let k = 0; k < 3; k++) { const p = SP.findIndex(x => (x.evo && x.evo[1] === out[out.length - 1])); const q = Object.keys(TRADE_EVO).find(a => TRADE_EVO[a] === out[out.length - 1]); const prev = p >= 0 ? p : q != null ? +q : -1; if (prev < 0 || out.includes(prev)) break; out.push(prev); } return out; };
  const legal = (s, lv) => { const ok = new Set(); for (const x of before(s)) for (const [l, mv] of SP[x].learn) if (l <= lv) ok.add(mv); return ok; };
  const ID = /^[a-z0-9]{4,12}$/, NAME = /^[A-Za-z0-9 _.'-]{1,20}$/;
  function clean(m, ot) {
    if (!m || typeof m !== 'object') return null;
    const s = m.s | 0, lv = m.lv | 0;
    if (!(s >= 0 && s < NSP) || !(lv >= 2 && lv <= 50)) return null;
    if (!Array.isArray(m.moves) || !m.moves.length || m.moves.length > 4) return null;
    const ok = legal(s, lv), moves = [];
    for (const mv of m.moves) { if (typeof mv !== 'string' || !MOVES[mv] || !ok.has(mv) || moves.includes(mv)) return null; moves.push(mv); }
    const exp = Math.max(expAt(lv), Math.min(expAt(lv + 1) - 1, Math.floor(+m.exp || 0)));
    const id = ID.test(String(m.id || '')) ? String(m.id) : null; if (!id) return null;
    const o = typeof m.ot === 'string' && NAME.test(m.ot) ? m.ot : (ot || '');
    const c = { s, lv, exp, moves, id }; if (o) c.ot = o; c.hp = maxhp(c);
    return c;
  }

  // ================================================================ the link battle referee
  // B = { sd: [{ team:[{s, lv, moves, hp, max}], a, st:{atk, def}, need }, ...], n: turn, over: -1 | winner side }
  function battle(ta, tb) {
    const side = t => ({ team: t.map(c => ({ s: c.s, lv: c.lv, moves: c.moves.slice(), id: c.id, max: maxhp(c), hp: maxhp(c) })), a: 0, st: { atk: 0, def: 0 }, need: false });
    return { sd: [side(ta), side(tb)], n: 0, over: -1 };
  }
  const stage = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  const act = (B, i) => B.sd[i].team[B.sd[i].a];
  const alive = (B, i) => B.sd[i].team.some(c => c.hp > 0);
  // a legal action for this side? { k:'move', i } | { k:'switch', i } | { k:'quit' }
  function okAct(B, i, a) {
    if (!a || typeof a !== 'object') return false;
    const S = B.sd[i];
    if (a.k === 'quit') return true;
    if (S.need) return a.k === 'switch' && S.team[a.i | 0] && S.team[a.i | 0].hp > 0 && (a.i | 0) !== S.a;
    if (a.k === 'move') return (a.i | 0) >= 0 && (a.i | 0) < act(B, i).moves.length;
    if (a.k === 'switch') return S.team[a.i | 0] && S.team[a.i | 0].hp > 0 && (a.i | 0) !== S.a;
    return false;
  }
  // the computer's pick when somebody's Game Boy went quiet
  function auto(B, i) {
    const S = B.sd[i];
    if (S.need) return { k: 'switch', i: S.team.findIndex((c, j) => c.hp > 0 && j !== S.a) };
    const me = act(B, i), foe = act(B, 1 - i); let best = 0, bv = -1;
    me.moves.forEach((m, j) => { const M = MOVES[m], v = M[1] ? M[1] * eff(M[0], SP[foe.s].t) * (M[0] === SP[me.s].t ? 1.5 : 1) : 10; if (v > bv) { bv = v; best = j; } });
    return { k: 'move', i: best };
  }
  function useMove(B, ai, mv, rnd, ev) {
    const di = 1 - ai, a = act(B, ai), d = act(B, di), as = B.sd[ai].st, ds = B.sd[di].st, M = MOVES[mv];
    ev.push({ t: 'use', sd: ai, mv });
    if (rnd() * 100 >= M[2]) { ev.push({ t: 'miss', sd: ai }); return; }
    const fx = M[3];
    if (!M[1]) {
      if (fx === 'heal') { const mx = a.max; if (a.hp >= mx) { ev.push({ t: 'full', sd: ai }); return; } a.hp = Math.min(mx, a.hp + Math.ceil(mx / 2)); ev.push({ t: 'heal', sd: ai, hp: a.hp }); return; }
      const self = fx.endsWith('+'), st = self ? as : ds, key = fx.startsWith('atk') ? 'atk' : 'def', dir = self ? 1 : -1;
      if ((dir > 0 && st[key] >= 6) || (dir < 0 && st[key] <= -6)) { ev.push({ t: 'nothing', sd: ai }); return; }
      st[key] += dir; ev.push({ t: 'stat', sd: self ? ai : di, key, dir }); return;
    }
    const A = stat(a, 1) * stage(as.atk), D = stat(d, 2) * stage(ds.def);
    let n = Math.floor(((2 * a.lv / 5 + 2) * M[1] * A / D) / 50) + 2;
    if (M[0] === SP[a.s].t) n *= 1.5;
    const e = eff(M[0], SP[d.s].t); n *= e;
    const crit = rnd() < 1 / 16; if (crit) n *= 1.5;
    n *= 0.85 + rnd() * 0.15; n = Math.max(1, Math.floor(n));
    d.hp = Math.max(0, d.hp - n);
    ev.push({ t: 'dmg', sd: di, n, hp: d.hp, e, crit: crit ? 1 : 0 });
    if (d.hp <= 0) {
      ev.push({ t: 'faint', sd: di });
      if (!alive(B, di)) { B.over = ai; ev.push({ t: 'win', sd: ai }); } else B.sd[di].need = true;
    }
  }
  function sendIn(B, i, j, ev) { const S = B.sd[i]; S.a = j; S.st = { atk: 0, def: 0 }; S.need = false; ev.push({ t: 'send', sd: i, i: j, hp: S.team[j].hp }); }
  // one turn: both sides' actions in, what happened out (a list of events both Game Boys play back)
  function turn(B, acts, rnd) {
    const ev = []; B.n++;
    for (let i = 0; i < 2; i++) if (acts[i].k === 'quit') { B.over = 1 - i; ev.push({ t: 'quit', sd: i }); ev.push({ t: 'win', sd: 1 - i }); return ev; }
    // replacements after a faint (only those sides choose)
    if (B.sd[0].need || B.sd[1].need) { for (let i = 0; i < 2; i++) if (B.sd[i].need) sendIn(B, i, acts[i].i | 0, ev); return ev; }
    for (let i = 0; i < 2; i++) if (acts[i].k === 'switch') { ev.push({ t: 'back', sd: i }); sendIn(B, i, acts[i].i | 0, ev); }
    const movers = [0, 1].filter(i => acts[i].k === 'move');
    const pri = i => (MOVES[act(B, i).moves[acts[i].i | 0]][3] === 'first' ? 1000 : 0) + stat(act(B, i), 3);
    if (movers.length === 2) { const p0 = pri(0), p1 = pri(1); if (p1 > p0 || (p1 === p0 && rnd() < 0.5)) movers.reverse(); }
    for (const i of movers) {
      if (B.over >= 0 || B.sd[i].need || act(B, i).hp <= 0) continue;
      useMove(B, i, act(B, i).moves[acts[i].i | 0], rnd, ev);
      if (B.over >= 0) break;
    }
    return ev;
  }

  const C = { TYPES, CHART, eff, MOVES, SP, NSP, TRADE_EVO, VERSIONS, stat, maxhp, expAt, movesAt, legal, clean, battle, turn, okAct, auto, alive };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.LkCrit = C;
})(typeof window !== 'undefined' ? window : this);

/* ch-cat: MOM'S JOBS, the shared catalogue. Jobs aren't programs on the PC any more: they're done for real in the rooms
 * of Jack's 3D house (js/ch-*.js in the browser), and the server (mods/ch.js) checks them and pays. Both read this file,
 * so the steps, the pay and the checks are only written down once.
 *   CHORES            every job: id, job (the Pocket Money key it is booked under: washup/tidy/car keep their old keys, so
 *                     history, streaks, the Job of the Day and the Hall of Fame carry on), area, room, pay, par (seconds)
 *   steps(id, day)    -> [{ s, g }]  the steps of that job on that UK day ('yyyy-mm-dd'); g = the fewest seconds a real
 *                     person needs since the step before (the server's check: a script can't do it any quicker than you)
 *   listFor(day)      -> today's four jobs on Mom's list (the same for everybody that day)
 *   tidyFor(day)      -> today's mess in Jack's room [{ id, kind, n }]
 *   rating(id, secs, oops) -> Mom's rating, 0..100 (all done is 70; quick is up to 100; every "oops" costs 5)
 *   payFor(id, rating, onList) -> Rupees (jobs on the list pay in full; extras pay EXTRA of it, the first EXTRAS a day)
 *   augment(GrindCat) adds the new jobs to the Pocket Money job table (they're marked room:1: only mods/ch.js books them) */
(function (root) {
  'use strict';
  // area: 'up' (Jack's room, upstairs), 'kitchen', 'lounge', 'out' (the front of the house). Only areas that exist are on.
  const AREAS = { up: true, kitchen: true, lounge: true, out: true };
  const CHORES = [
    // ---- Jack's room
    { id: 'tidy', job: 'tidy', area: 'up', room: 'bedroom', n: 'Tidy your room', short: 'Tidy room', pay: 20, par: 110, min: 16, where: 'my room',
      blurb: 'Clothes in the washing basket, rubbish in the bin, mags on the pile, CDs in the rack, plates and mugs down to the kitchen sink.' },
    { id: 'bed', job: 'bed', area: 'up', room: 'bedroom', n: 'Make your bed', short: 'Make bed', pay: 12, par: 40, min: 6, where: 'my bed',
      blurb: 'Pillow off the floor, pyjamas under it, then pull the duvet straight. Properly. Mom checks.' },
    { id: 'bin', job: 'bin', area: 'up', room: 'bedroom', n: 'Empty your bin', short: 'Empty bin', pay: 10, par: 50, min: 6, where: 'my bin',
      blurb: 'Tie up the bag in your bin and take it down to the kitchen bin. Before it walks there on its own.' },
    { id: 'cat', job: 'cat', area: 'up', room: 'bedroom', n: 'Feed the cat', short: 'Feed cat', pay: 10, par: 35, min: 7, where: 'my room',
      blurb: "Next door's cat lives on your bed. Shake some biscuits into the bowl and give a shout." },
    { id: 'plant', job: 'plant', area: 'up', room: 'bedroom', n: 'Water your plant', short: 'Water plant', pay: 8, par: 35, min: 4, where: 'my room',
      blurb: 'The spider plant Gran gave you. Water it, pick off the brown leaves, turn it to the light.' },
    // ---- the kitchen
    { id: 'washup', job: 'washup', area: 'kitchen', room: 'kitchen', n: 'Do the washing up', short: 'Washing up', pay: 20, par: 150, min: 24, where: 'the kitchen sink',
      blurb: 'Plug in, hot water, a squirt of washing-up liquid. Scrub everything, then stand it in the rack.' },
    { id: 'table', job: 'table', area: 'kitchen', room: 'kitchen', n: 'Lay the table for tea', short: 'Lay table', pay: 12, par: 75, min: 10, where: 'the kitchen table',
      blurb: 'Four places: a plate, a knife and fork and a glass each. And the ketchup in the middle (Dad insists).' },
    { id: 'shopping', job: 'shopping', area: 'kitchen', room: 'kitchen', n: 'Put the shopping away', short: 'Shopping', pay: 14, par: 80, min: 10, where: 'the kitchen',
      blurb: 'Fridge, freezer, cupboard, bread bin. NOT in your bedroom. Then fold the carrier bags.' },
    { id: 'bins', job: 'bins', area: 'out', room: 'kitchen', n: 'Take the bins out', short: 'Bins out', pay: 12, par: 60, min: 8, where: 'kitchen bin to wheelie bin',
      blurb: 'Tie up the kitchen bin bag, take it out the back door to the wheelie bin, then a new bag in the kitchen bin.' },
    // ---- the lounge
    { id: 'hoover', job: 'hoover', area: 'lounge', room: 'lounge', n: 'Vacuum the lounge', short: 'Vacuum', pay: 18, par: 90, min: 10, where: 'the lounge',
      blurb: 'The vacuum is in the cupboard under the stairs. Plug it in, get every crumb, put it back.' },
    { id: 'videos', job: 'videos', area: 'lounge', room: 'lounge', n: 'Tidy the videos', short: 'Videos', pay: 8, par: 40, min: 5, where: 'the lounge',
      blurb: 'Every tape back on the shelf under the telly. Rewound. Be kind.' },
    { id: 'cushions', job: 'cushions', area: 'lounge', room: 'lounge', n: 'Plump the cushions', short: 'Cushions', pay: 8, par: 40, min: 5, where: 'the lounge',
      blurb: 'Cushions back on the settee and plumped. Mom likes them on their corners, like diamonds.' },
    // ---- outside (the front of the house)
    { id: 'car', job: 'car', area: 'out', room: 'drive', n: "Wash Dad's car", short: 'Car', pay: 20, par: 120, min: 14, where: 'the drive',
      blurb: 'Bucket, sponge, every bit of mud. Then rinse it off. Watch out for the pigeon.' },
    { id: 'lawn', job: 'lawn', area: 'out', room: 'drive', n: 'Mow the front lawn', short: 'Mow lawn', pay: 18, par: 150, min: 12, where: 'the front lawn',
      blurb: "Plug in the mower and do nice straight stripes. Mind the cable. Mind the gnome." },
    { id: 'sweep', job: 'sweep', area: 'out', room: 'drive', n: 'Sweep the drive', short: 'Sweep', pay: 10, par: 60, min: 8, where: 'the drive',
      blurb: 'Every pile of leaves into the dustpan, and the dustpan into the dustbin.' },
  ];
  const CHORE = {}; for (const c of CHORES) CHORE[c.id] = c;

  // ---------------------------------------------------------------- seeded randomness (the same answer for everybody that day)
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function rng(seed) { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------------------------------------------------------------- today's mess in Jack's room
  // kind: where it goes. clothes -> the washing basket, rubbish -> the bin, mag -> the mag pile, cd -> the CD rack, dish -> the kitchen sink
  const MESS = [
    { id: 'socks', kind: 'clothes', n: 'Smelly socks' }, { id: 'tshirt', kind: 'clothes', n: 'T-shirt' }, { id: 'jeans', kind: 'clothes', n: 'Jeans' },
    { id: 'shirt', kind: 'clothes', n: 'School shirt' }, { id: 'pe', kind: 'clothes', n: 'PE shorts' }, { id: 'jumper2', kind: 'clothes', n: 'Hoodie' },
    { id: 'mag1', kind: 'mag', n: 'JACK ATTACK! (issue 8)' }, { id: 'mag2', kind: 'mag', n: 'A games mag' }, { id: 'comic', kind: 'mag', n: 'A comic' },
    { id: 'crisps', kind: 'rubbish', n: 'Crisp packet' }, { id: 'can', kind: 'rubbish', n: 'Fizzy pop can' }, { id: 'wrap', kind: 'rubbish', n: 'Sweet wrappers' },
    { id: 'core', kind: 'rubbish', n: 'Apple core' }, { id: 'paper', kind: 'rubbish', n: 'Screwed-up homework' },
    { id: 'banana', kind: 'rubbish', n: 'Banana skin', extra: 1 }, { id: 'yog', kind: 'rubbish', n: 'Yoghurt pot (empty)', extra: 1 },
    { id: 'plate', kind: 'dish', n: 'Plate (toast crusts)' }, { id: 'mug', kind: 'dish', n: 'Mug (cold tea)' }, { id: 'bowl', kind: 'dish', n: 'Cereal bowl' },
    { id: 'cd1', kind: 'cd', n: 'CD (out of its case)' }, { id: 'cd2', kind: 'cd', n: 'PlaySpace game case' },
  ];
  const MESSID = {}; for (const m of MESS) MESSID[m.id] = m;
  function tidyFor(day, sparse = false) {
    const r = rng('chtidy|' + day), by = k => shuffle(MESS.filter(m => m.kind === k && !m.extra), r);
    const out = [].concat(by('clothes').slice(0, 2 + (r() < 0.5 ? 1 : 0)), by('rubbish').slice(0, 2), by('mag').slice(0, 1 + (r() < 0.4 ? 1 : 0)), by('cd').slice(0, 1), by('dish').slice(0, 1 + (r() < 0.3 ? 1 : 0)));
    // the later rubbish (extra: 1) swaps in on some days from its own dice, so every other day's list is unchanged
    const r2 = rng('chtidy2|' + day), extras = MESS.filter(m => m.extra);
    if (r2() < 0.4) { const i = out.map(m => m.kind).lastIndexOf('rubbish'); if (i >= 0) out[i] = extras[Math.floor(r2() * extras.length)]; }
    if (sparse) {
      // New rooms do not acquire unowned media through the daily mess. Keep
      // the same job length, replacing it with ordinary clothes and rubbish.
      const used=new Set(out.map(m=>m.id)), spare=shuffle(MESS.filter(m=>['clothes','rubbish'].includes(m.kind)&&!m.extra&&!used.has(m.id)),rng('chsparse|'+day));
      return out.slice(0,9).map(m=>['mag','cd'].includes(m.kind)?spare.shift():m);
    }
    return out.slice(0, 9);
  }

  // ---------------------------------------------------------------- the steps of each job
  const N = (pre, n, g) => Array.from({ length: n }, (_, i) => ({ s: pre + i, g }));
  const STEPS = {
    tidy: day => tidyFor(day).map(m => ({ s: m.id, g: m.kind === 'dish' ? 3 : 0.7 })),
    bed: () => [{ s: 'pillow', g: 1 }, { s: 'pjs', g: 0.8 }, { s: 'pullL', g: 0.5 }, { s: 'pullR', g: 0.5 }, { s: 'smooth', g: 0.5 }],
    bin: () => [{ s: 'tie', g: 0.5 }, { s: 'bag', g: 3.5 }],
    cat: () => [{ s: 'pour', g: 1 }, { s: 'call', g: 0.6 }, { s: 'ate', g: 4 }],
    plant: () => [{ s: 'water', g: 1.2 }, { s: 'leaf0', g: 0.3 }, { s: 'leaf1', g: 0.3 }, { s: 'leaf2', g: 0.3 }, { s: 'turn', g: 0.3 }],
    washup: () => [{ s: 'plug', g: 0.3 }, { s: 'fill', g: 1 }].concat(...Array.from({ length: 7 }, (_, i) => [{ s: 'w' + i, g: 1.1 }, { s: 'r' + i, g: 0.5 }])),
    table: () => [].concat(...[0, 1, 2, 3].map(i => [{ s: 'p' + i, g: 0.6 }, { s: 'k' + i, g: 0.6 }, { s: 'g' + i, g: 0.6 }]), [{ s: 'sauce', g: 0.6 }]),
    shopping: () => N('i', 9, 0.7).concat([{ s: 'bags', g: 0.4 }]),
    bins: () => [{ s: 'tie', g: 0.5 }, { s: 'out', g: 3.5 }, { s: 'liner', g: 2 }],
    hoover: () => [{ s: 'plug', g: 0.5 }].concat(N('d', 9, 0.3), [{ s: 'away', g: 1.5 }]),
    videos: () => N('v', 6, 0.7),
    cushions: () => N('c', 4, 0.6).concat(N('p', 4, 0.3)),
    car: () => [{ s: 'bucket', g: 0.6 }].concat(N('m', 10, 0.6), [{ s: 'rinse', g: 1.2 }]),
    lawn: () => [{ s: 'plug', g: 0.5 }].concat(N('l', 8, 1), [{ s: 'away', g: 1.2 }]),
    sweep: () => N('l', 7, 0.6).concat([{ s: 'tip', g: 1.2 }]),
  };
  function steps(id, day, sparse = false) { if(id==='tidy'&&sparse)return tidyFor(day,true).map(m=>({s:m.id,g:m.kind==='dish'?3:.7}));const f = STEPS[id]; return f ? f(day) : []; }

  // ---------------------------------------------------------------- Mom's list: four a day, from all over the house
  function listFor(day, areas) {
    const on = Object.assign({}, AREAS, areas || {});
    const r = rng('chlist|' + day);
    const pool = shuffle(CHORES.filter(c => on[c.area]), r), out = [];
    const take = f => { const i = pool.findIndex(f); if (i >= 0) out.push(pool.splice(i, 1)[0].id); };
    take(c => c.area === 'up'); take(c => c.area === 'kitchen'); take(c => c.area === 'lounge' || c.area === 'out');
    while (out.length < 4 && pool.length) out.push(pool.shift().id);
    return out;
  }
  const EXTRA = 0.35, EXTRAS = 4, GOOD = 85, ALLBONUS = 10;
  // Mom pays pocket money in pounds and pence (it's 1999); the JackNet Bank turns it into Rupees (20 Rupees to the pound)
  const PER_POUND = 20;
  const pence = id => CHORE[id] ? Math.round(CHORE[id].pay * 100 / PER_POUND) : 0;
  const money = p => p >= 100 ? '\u00a3' + (p / 100).toFixed(2) : p + 'p';
  function rating(id, secs, oops) {
    const c = CHORE[id]; if (!c) return 0;
    const q = Math.max(0, Math.min(1, (c.par * 1.6 - secs) / (c.par * 1.1)));
    return Math.max(10, Math.min(100, Math.round(70 + 30 * q) - 5 * Math.min(4, oops | 0)));
  }
  function payFor(id, rt, onList) {
    const c = CHORE[id]; if (!c) return 0;
    const full = c.pay * Math.min(1, rt / GOOD);
    return Math.max(1, Math.round(onList ? full : full * EXTRA));
  }
  // what Mom says when she checks (by rating)
  const MOMSAYS = [
    [95, ['Ooh! Who are you and what have you done with {me}?', 'Gold star, love. GOLD STAR.', 'Well I never. That is PERFECT.']],
    [85, ['That\'s lovely, thank you, love.', 'Good {me.lad}. See, that wasn\'t so hard, was it?', 'Ta, love. You\'re a star.']],
    [70, ['That\'ll do. Just about.', 'Thank you. Eventually.', 'Was that so hard? Don\'t answer that.']],
    [0, ['Hmm. I\'ll be checking that.', 'Did you actually do it or just move it about?']],
  ];
  const momSays = (rt, n) => { const L = MOMSAYS.find(x => rt >= x[0])[1]; return L[(n | 0) % L.length]; };

  // the Pocket Money job table: washup/tidy/car are already in it (moved here from the PC); add the rest
  function augment(G) {
    if (!G || !G.JOBS) return;
    for (const c of CHORES) {
      const J = G.JOBS[c.job];
      if (J) { if (!J.room) Object.assign(J, { room: 1, list: 'home', secs: c.par, max: 100, good: GOOD, unit: '% Mom rating', blurb: c.blurb, n: J.n }); continue; }
      G.JOBS[c.job] = { n: c.n, who: 'Mom', list: 'home', room: 1, secs: c.par, max: 100, good: GOOD, pay: c.pay, rate: 100, unit: '% Mom rating', blurb: c.blurb };
    }
  }
  const C = { AREAS, CHORES, CHORE, MESS, MESSID, tidyFor, steps, listFor, rating, payFor, momSays, augment, hash, rng, shuffle, EXTRA, EXTRAS, GOOD, ALLBONUS, PER_POUND, pence, money };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.ChoreCat = C;
})(typeof window !== 'undefined' ? window : this);

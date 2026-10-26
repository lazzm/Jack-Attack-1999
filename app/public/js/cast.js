/* cast: Jack's online cast (jack/dave/luke/callum/jackk/jsister) stays fixed. The house belongs to the logged-in
 * player: Cast.me() supplies their identity and pronouns; sister/mate1..mate4 are seeded by account. Only owner 'jack'
 * gets Crystal, Dave, Luke, Callum and JackK at home. Mom, Dad and grandparents retain their titles. Other people and
 * pets retain the existing jhp_cast_seed, which roams with the member's profile.
 *
 *   Cast.n('sister')            -> 'Megan'                   the name to show (titles included: 'Mr Hughes', 'Auntie Sue')
 *   Cast.first('teacher')       -> 'Hughes' for a teacher, the first name for anyone else
 *   Cast.g('sister')            -> 'f' | 'm'
 *   Cast.he('sister')  .him  .his  .hers  .himself  (lower case)   Cast.He / Him / His / Hers / Himself (capitalised)
 *   Cast.kid('sister')          -> 'daughter' | 'son'   (also .sib: 'sister'/'brother', .kidw: 'girl'/'boy')
 *   Cast.t('{sister} says {sister.he} hates {sister.his} hamster, {pet.hamster}.')   fills a template; unknown ids stay as typed
 *   Cast.get(id)                -> { id, name, first, last, title, g, role, fixed }
 *   Cast.slug(id)               -> 'megan' (lower case, letters only: for ~homepage URLs; see Cast.idOfSlug for the way back)
 *   Cast.ids()                  -> every id
 * Templates: {id} {id.first} {id.he} {id.He} {id.him} {id.his} {id.His} {id.hers} {id.himself} {id.sib} {id.kid} {id.kidw}
 *   {id.Mr} (Mr/Mrs/Miss/Ms on its own)  {id.man} man/woman  {id.sir} sir/miss (what a class calls a teacher)  {id.lad} lad/girl
 *   {id.nephew} nephew/niece  {id.grandkid} grandson/granddaughter  {id.king} king/queen  (any of these capitalised: {id.Sir})
 *   {id.NAME} / {id.FIRST} (in CAPITALS)  {id.slug} (for URLs and e-mail addresses)
 *   {id?boy text|girl text}  picks by gender: the first part for a boy (m), the second for a girl (f). Other {templates} may go
 *   inside the two parts, but not another {x?..|..} and no '|' in the boy part.
 * Cast.deep(obj) runs Cast.t over every string in an array/object (a data table) and returns a copy.
 * Old names: Cast.OLD maps every pre-cast name to its id ('kim' -> 'cousin', 'sam' -> 'kidEp1' ...). Cast.idOfSlug('kim') and
 *   Cast.idOfSlug('cousin') still find the cousin, so old ~links keep working; an old name is never given to someone else.
 * Old saved text keeps whatever it said: only text drawn through Cast changes.
 * Add a new person from any file: Cast.add(id, { role, pool, g?, title?, fixed? })  (call before first use; the pick is seeded
 *   from the id too, so adding people never reshuffles anyone else).  Kid friendly, UK, 1999: names fit each age group. */
(function () {
  'use strict';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let account = '', identity = null;
  const HOUSE = { sister: 'jsister', mate1: 'dave', mate2: 'luke', mate3: 'callum', mate4: 'jackk' };
  const houseTaken = new Set(), houseLast = new Set();
  let seed = +store.get('jhp_cast_seed');
  if (!seed) { seed = (Math.floor(Math.random() * 2147483646) + 1); store.set('jhp_cast_seed', String(seed)); }

  // ---- name pools (UK, by age in 1999)
  const P = {
    teenF: ['Sarah', 'Laura', 'Emma', 'Gemma', 'Rebecca', 'Hannah', 'Amy', 'Claire', 'Kirsty', 'Lisa', 'Natalie', 'Jenny', 'Rachel', 'Katie', 'Sophie', 'Charlotte', 'Stacey', 'Hayley', 'Leanne', 'Danielle', 'Kelly', 'Zoe', 'Vicky', 'Jodie', 'Becky', 'Priya', 'Aisha', 'Jasmine', 'Nisha', 'Yasmin', 'Shona', 'Ellie', 'Kim', 'Naomi', 'Fiona', 'Carly'],
    teenM: ['Daniel', 'Matthew', 'Thomas', 'Chris', 'James', 'Adam', 'Ben', 'Liam', 'Ryan', 'Craig', 'Lee', 'Scott', 'Gareth', 'Martin', 'Richard', 'Mark', 'Stuart', 'Sam', 'Gary', 'Kyle', 'Darren', 'Simon', 'Michael', 'Ashley', 'Jamie', 'Nathan', 'Joe', 'Carl', 'Rob', 'Steven', 'Raj', 'Imran', 'Kieran', 'Tom', 'Gaz', 'Zed', 'Neil', 'Danny', 'Owen'],
    childF: ['Chloe', 'Jessica', 'Lauren', 'Megan', 'Bethany', 'Georgia', 'Holly', 'Abbie', 'Lucy', 'Katie', 'Amber', 'Jade', 'Ellie', 'Sophie', 'Molly', 'Rosie', 'Hannah', 'Courtney'],
    childM: ['Josh', 'Connor', 'Jordan', 'Bradley', 'Kyle', 'Reece', 'Lewis', 'Harry', 'Alfie', 'Charlie', 'George', 'Elliot', 'Ross', 'Tyler', 'Sam', 'Max'],
    adultF: ['Sue', 'Linda', 'Karen', 'Julie', 'Carol', 'Jackie', 'Tracy', 'Sandra', 'Debbie', 'Janet', 'Lorraine', 'Wendy', 'Gill', 'Angela', 'Pauline', 'Bev'],
    adultM: ['Pete', 'Steve', 'Mick', 'Tony', 'Rob', 'Phil', 'Gary', 'Ian', 'Keith', 'Clive', 'Nigel', 'Graham', 'Trevor', 'Barry', 'Colin', 'Mo'],
    oldF: ['Doris', 'Edna', 'Joan', 'Mavis', 'Ethel', 'Vera', 'Irene', 'Hilda', 'Brenda', 'Peggy'],
    oldM: ['Ron', 'Reg', 'Stan', 'Bert', 'Les', 'Alf', 'Norman', 'Derek', 'Ted', 'Frank'],
    last: ['Davies', 'Ali', 'Patel', 'Hughes', 'Jenkins', 'Thompson', 'Wilson', 'Clarke', 'Harris', 'Walker', 'Wright', 'Green', 'Hall', 'Turner', 'Price', 'Cooper', 'Khan', 'Singh', 'Evans', 'Roberts', 'Morgan', 'Bennett', 'Fletcher', 'Marsh', 'Ward', 'Barker', 'Lloyd', 'Shaw', 'Mistry', 'Okafor'],
    catF: ['Misty', 'Tilly', 'Smudge', 'Pickle', 'Bramble', 'Poppy', 'Honey', 'Willow', 'Treacle', 'Pebbles'],
    catM: ['Mr Tibbs', 'Tigger', 'Felix', 'Oscar', 'Ginger', 'Garfield', 'Marmalade', 'Socks', 'Crumble'],
    smallF: ['Nibbles', 'Toffee', 'Peanut', 'Fudge', 'Squeak', 'Cookie', 'Hazel', 'Button'],
    smallM: ['Nibbles', 'Hammy', 'Peanut', 'Fudge', 'Squeak', 'Bilbo', 'Zip', 'Pip'],
  };
  const FIXED = { // Jack's online cast and the family titles are the same for everyone
    jack: { name: 'Jack', g: 'm', role: 'Jack himself' },
    dave: { name: 'Dave', g: 'm', role: "Jack's best mate (Ultra Entertainment)" },
    luke: { name: 'Luke', g: 'm', role: "Jack's mate (Ultra Entertainment)" },
    callum: { name: 'Callum', g: 'm', role: "Jack's mate (PC gamer)" },
    jackk: { name: 'JackK', first: 'Jack', g: 'm', role: "Jack's mate, also called Jack (JackNet name JackK)" },
    mom: { name: 'Mom', g: 'f', role: "Jack's mom" }, dad: { name: 'Dad', g: 'm', role: "Jack's dad" },
    gran: { name: 'Gran', g: 'f', role: "Dad's mum" }, grandad: { name: 'Grandad', g: 'm', role: "Dad's dad" },
    nan: { name: 'Nan', g: 'f', role: "Mom's mum" },
    jsister: { name: 'Crystal', g: 'f', role: "Jack's little sister (about 9)" }, // fixed by Jack, 2026-10-21
    gubbinz: { name: 'Gubbinz', g: 'm', role: 'the little green helper' },
  };
  // everyone else: role -> how to pick. g: fixed gender, or random. pool: [female pool, male pool]. title: 'teacher' | 'aunt' ...
  const DEF = {
    sister: { role: "your little sister (about 9)", g: 'f', pool: ['childF', 'childM'] },
    cousin: { role: "Jack's cousin (Pocket Critters expert, does the cube in 40 s, has a pop homepage)", pool: ['teenF', 'teenM'] },
    cousin2: { role: "Jack's big cousin on Dad's side (Gran's other grandchild; HotJack e-mail, sends chain letters and viruses, has a scanner and a CD writer)", g: 'm', pool: ['teenM'] },
    auntie: { role: "Mom's sister", g: 'f', pool: ['adultF'], title: 'Auntie' },
    uncle: { role: "Auntie's husband", g: 'm', pool: ['adultM'], title: 'Uncle' },
    greatuncle: { role: 'a great uncle nobody has seen for years', pool: ['oldF', 'oldM'], title: 'great' },
    teacher: { role: 'runs Computer Club on Tuesdays (Minesweeper record)', pool: ['adultF', 'adultM'], title: 'sir' },
    teacher2: { role: 'the PE teacher (finds you in the PE cupboard)', pool: ['adultF', 'adultM'], title: 'sir' },
    shop: { role: 'runs the corner shop / Card Korner', pool: ['adultF', 'adultM'], title: 'old' },
    cat: { role: 'the family cat (ginger, sleeps on the warm monitor)', pool: ['catF', 'catM'] },
    hamster: { role: 'the hamster on Hamster Cam', pool: ['smallF', 'smallM'] },
    cousinpet: { role: "the cousin's hamster", pool: ['smallF', 'smallM'] },
    kidEp1: { role: 'mate with the Episode I countdown homepage (owns the 4th ULTRA 64 pad)', pool: ['teenF', 'teenM'] },
    kidBand: { role: 'mate with an awful band (the Mouldy Tangerines)', pool: ['teenF', 'teenM'] },
    kidY2k: { role: 'the Millennium Bug mate (bunker in the shed)', pool: ['teenF', 'teenM'] },
    kidPoke: { role: 'mate with the Pocket Critters Facts Page (all 151)', pool: ['teenF', 'teenM'] },
    kidSoon: { role: 'mate whose homepage is "Coming soon!!! (since 1997)"', pool: ['teenF', 'teenM'] },
    kidCalc: { role: 'Year 10 kid who wired 16 calculators together', pool: ['teenF', 'teenM'] },
    kidMatt: { role: '"our" handy mate who offers to build things out of Meccano', pool: ['teenF', 'teenM'] },
    kidVal: { role: "the one who (maybe) sent Dave a Valentine's card", pool: ['teenF', 'teenM'] },
    club1: { role: 'Computer Club member', pool: ['teenF', 'teenM'] }, club2: { role: 'Computer Club member', pool: ['teenF', 'teenM'] },
    club3: { role: 'Computer Club member', pool: ['teenF', 'teenM'] }, club4: { role: 'Computer Club member', pool: ['teenF', 'teenM'] },
  };

  // the names everyone had before the cast went random: old ~links, Favourites and typed addresses still find these people,
  // and nobody else is ever given one of them (so ~sam can only ever mean the Episode I kid). Biscuit (Dave's dog), Mr Tiddles
  // (Dave's cat) and Kevin (the pet rock page) are fixed web folk, so they are kept out of the pools too.
  const OLD = { lucy: 'jsister', kim: 'cousin', kimberley: 'cousin', toffee: 'cousinpet', biscuit: 'cat', nibbles: 'hamster', sam: 'kidEp1', gaz: 'kidY2k', stu: 'kidBand',
    ellie: 'kidPoke', tom: 'kidSoon', kev: 'kidCalc', matt: 'kidMatt', sophie: 'kidVal', zed: 'club1', ash: 'club2', lee: 'club3', priya: 'club4',
    ali: 'teacher', davies: 'teacher2', ryan: 'cousin2', sue: 'auntie', pete: 'uncle', ron: 'greatuncle', mo: 'shop' };
  const OLDLAST = { ali: 'teacher', davies: 'teacher2' };
  const NOPE = new Set(['kevin', 'mr tiddles', 'biscuit']);
  const free = (id, n, old) => { const k = n.toLowerCase(); return !NOPE.has(k) && !(old[k] && old[k] !== id); };

  // ---- a tiny seeded random (a fresh stream per id, so adding people never reshuffles anyone)
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = id => { let a = (seed ^ hash(id)) >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  const PEOPLE = {}, usedLast = new Set(), usedNames = new Set(['jack', 'dave', 'david', 'luke', 'callum', 'mom', 'dad', 'gran', 'nan', 'grandad', 'gubbinz']);
  function pick(id, d) {
    const r = HOUSE[id] ? houseRng(id) : rng(id), g = d.g || (r() < 0.5 ? 'f' : 'm');
    const taken = HOUSE[id] ? houseTaken : usedNames, takenLast = HOUSE[id] ? houseLast : usedLast;
    const pool = P[d.pool[g === 'f' || d.pool.length === 1 ? 0 : 1]] || P.teenM;
    let first = pool[Math.floor(r() * pool.length)];
    for (let i = 0; i < pool.length && (taken.has(first.toLowerCase()) || !free(id, first, OLD)); i++) first = pool[(pool.indexOf(first) + 1) % pool.length];
    taken.add(first.toLowerCase());
    let li = Math.floor(r() * P.last.length);
    for (let i = 0; i < P.last.length && (takenLast.has(P.last[li]) || !free(id, P.last[li], OLDLAST)); i++) li = (li + 1) % P.last.length; // two Mr Thompsons would be confusing
    const last = P.last[li]; takenLast.add(last);
    let name = first, title = '';
    if (d.title === 'Auntie' || d.title === 'Uncle') { title = d.title; name = title + ' ' + first; }
    else if (d.title === 'great') { title = g === 'f' ? 'Great Auntie' : 'Great Uncle'; name = title + ' ' + first; }
    else if (d.title === 'sir') { title = g === 'm' ? 'Mr' : (r() < 0.6 ? 'Mrs' : r() < 0.5 ? 'Miss' : 'Ms'); name = title + ' ' + last; }
    else if (d.title === 'old') { title = 'Old'; name = 'Old ' + first; }
    return { id, name, first, last, title, g, role: d.role, fixed: false };
  }
  function add(id, d) {
    if (PEOPLE[id]) return PEOPLE[id];
    if (HOUSE[id] && account === 'jack') { const f = FIXED[HOUSE[id]]; return PEOPLE[id] = { ...f, id, first: f.first || f.name, last: '', title: '', fixed: true }; }

    if (FIXED[id]) { const f = FIXED[id]; PEOPLE[id] = { id, name: f.name, first: f.first || f.name, last: '', title: '', g: f.g, role: f.role, fixed: true }; return PEOPLE[id]; }
    if (d && d.fixed) { PEOPLE[id] = { id, name: d.name, first: d.first || d.name, last: d.last || '', title: d.title || '', g: d.g || 'm', role: d.role || '', fixed: true }; usedNames.add(String(d.name).toLowerCase()); return PEOPLE[id]; }
    const def = d || DEF[id]; if (!def) return null;
    if (!def.pool) def.pool = ['teenF', 'teenM'];
    PEOPLE[id] = pick(id, def); return PEOPLE[id];
  }
  // House streams depend on the account, not on whichever browser first logged on.
  // Other cast members keep the existing roaming seed and picks.
  function houseRng(id) {
    let a = hash('house:' + account + ':' + id) || 1;
    return () => { a = Math.imul(1664525, a) + 1013904223 | 0; return (a >>> 0) / 4294967296; };
  }
  for (let i = 1; i <= 4; i++) DEF['mate' + i] = { role: ['best mate (Ultra console fan)', 'mate (console fan)', 'mate (PC gamer)', 'mate'][i - 1], pool: ['teenF', 'teenM'] };
  Object.keys(FIXED).forEach(id => add(id));
  Object.keys(DEF).filter(id => !HOUSE[id]).forEach(id => add(id));
  Object.keys(HOUSE).forEach(id => add(id));

  const get = id => id === 'me' ? C.me() : PEOPLE[id] || add(id) || null;
  const PR = {
    f: { he: 'she', him: 'her', his: 'her', hers: 'hers', himself: 'herself', sib: 'sister', kid: 'daughter', kidw: 'girl', Mr: 'Ms', man: 'woman', sir: 'miss', lad: 'girl', nephew: 'niece', grandkid: 'granddaughter', king: 'queen' },
    m: { he: 'he', him: 'him', his: 'his', hers: 'his', himself: 'himself', sib: 'brother', kid: 'son', kidw: 'boy', Mr: 'Mr', man: 'man', sir: 'sir', lad: 'lad', nephew: 'nephew', grandkid: 'grandson', king: 'king' } };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const word = (id, w) => { const p = get(id); if (!p) return null; const lw = w.toLowerCase(); if (lw === 'mr') return p.title && /^(Mr|Mrs|Miss|Ms)$/.test(p.title) ? p.title : PR[p.g].Mr; const alias = { son: 'kid', daughter: 'kid', boy: 'kidw', girl: 'kidw', lass: 'lad' }; const v = PR[p.g][alias[lw] || lw]; if (v == null) return null; return w[0] === w[0].toUpperCase() ? cap(v) : v; };
  const C = {
    me() {
      const p = account === 'jack' ? { first: 'Jack', g: 'm', v: 1 } : identity || { first: 'you', g: 'm' };
      const pr = PR[p.g];
      return { ...p, ...pr, name: p.first, son: pr.kid, daughter: pr.kid, boy: pr.kidw, girl: pr.kidw, lass: pr.lad };
    },
    bind(name, me) {
      const key = String(name || '').toLowerCase();
      identity = me && me.first && ['m', 'f'].includes(me.g) ? { first: me.first, g: me.g, v: 1 } : null;
      if (account === key) return;
      account = key;
      houseTaken.clear(); houseLast.clear();
      ['Jack', 'Crystal', 'Dave', 'Luke', 'Callum', 'JackK'].forEach(n => houseTaken.add(n.toLowerCase()));
      for (const id of Object.keys(HOUSE)) { delete PEOPLE[id]; add(id); }
    },
    randomFirst: g => { const pool = P[g === 'f' ? 'teenF' : 'teenM']; return pool[Math.floor(Math.random() * pool.length)]; },
    get, add, ids: () => Object.keys(PEOPLE),
    n: id => (get(id) || { name: id }).name,
    first: id => { const p = get(id); return p ? (p.title && /^(Mr|Mrs|Miss|Ms)$/.test(p.title) ? p.last : p.first) : id; },
    g: id => (get(id) || { g: 'm' }).g,
    slug: id => C.first(id).toLowerCase().replace(/[^a-z]/g, ''),
    idOfSlug(s) {
      s = String(s || '').toLowerCase().replace(/^~/, '').replace(/[^a-z0-9]/g, ''); if (!s) return null;
      return Object.keys(PEOPLE).find(id => C.slug(id) === s) || OLD[s] || Object.keys(PEOPLE).find(id => id.toLowerCase() === s) || null;
    },
    OLD,
    pick: (id, boy, girl) => C.g(id) === 'f' ? girl : boy,
    t(str) {
      return String(str).replace(/\{([a-zA-Z0-9]+)(?:\.([a-zA-Z]+))?\}/g, (m, id, w) => {
          const p = get(id); if (!p) return m;
          if (!w || w === 'name') return p.name;
          if (w === 'first') return C.first(id);
          if (w === 'NAME') return p.name.toUpperCase();
          if (w === 'FIRST') return C.first(id).toUpperCase();
          if (w === 'slug') return C.slug(id);
          const v = word(id, w); return v == null ? m : v;
        }).replace(/\{([a-zA-Z0-9]+)\?([^{}|]*)\|([^{}]*)\}/g, (m, id, a, b) => get(id) ? (C.g(id) === 'f' ? b : a) : m); // after the names, so {cousin?{cousin.he}..|..} works
    },
    deep(x) {
      if (typeof x === 'string') return C.t(x);
      if (Array.isArray(x)) return x.map(C.deep);
      if (x && typeof x === 'object' && Object.getPrototypeOf(x) === Object.prototype) { const o = {}; for (const k in x) o[k] = C.deep(x[k]); return o; }
      return x;
    },
    seed: () => seed,
  };
  for (const w of ['he', 'him', 'his', 'hers', 'himself', 'sib', 'kid', 'kidw', 'man', 'sir', 'lad', 'nephew', 'grandkid', 'king']) { C[w] = id => word(id, w); C[cap(w)] = id => word(id, cap(w)); }
  if (typeof window !== 'undefined') window.Cast = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})();

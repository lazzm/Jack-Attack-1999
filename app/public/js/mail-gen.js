/* mail-gen: the personalised, date-aware e-mail engine behind Outlook Express (lazy-loaded by apps-files.js).
 * Every 1999 day gets its own pile of e-mail for whoever is logged on to JackNet: seeded by the user + the date, so an
 * inbox is the same every time you reload, but different for every user and every day. Templates live in
 * mail-tpl-*.js and register with MailGen.add(id, def). apps-files.js hands us its mail store with MailGen.attach(api).
 *   MailGen.list()          -> every generated message currently in the mail store's window (last 14 days)
 *   MailGen.folder(m)       -> which folder a message lives in (junk filter + Inbox Assistant rules)
 *   MailGen.send(list)      -> deliver sent mail (fake-web addresses only), schedule believable replies
 *   MailGen.fetch()         -> Send/Recv: pull down the next waiting message (if any)
 *   MailGen.assistant()     -> the Inbox Assistant (junk filter + rules) */
(function () {
  'use strict';
  if (window.MailGen && window.MailGen.ready) return;
  const A = window.Apps, esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const G = window.MailGen = { T: {}, ready: false };
  const T = G.T;
  G.add = (id, def) => { if (window.Cast) def = Cast.deep(def); def.id = id; T[id] = def; }; // cast names in from/addrs/ps (functions are filled in by expand)
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pad = n => String(n).padStart(2, '0');
  const dayNo = key => { const [m, d] = key.split('-').map(Number); return Math.round((new Date(1999, m - 1, d) - new Date(1999, 0, 1)) / 864e5); };
  const keyOf = n => { const dt = new Date(1999, 0, 1 + n); return pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); };
  const mdOf = key => { const [m, d] = key.split('-').map(Number); return m * 100 + d; };
  const inR = (key, a, b) => { const x = mdOf(key); return x >= mdOf(a) && x <= mdOf(b); };
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  G.util = { dayNo, keyOf, mdOf, inR, ord, pad, esc, DAYS, MONTHS };

  // ================================================================ seeded randomness (xorshift, seeded from a string hash)
  function hash(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rng(seed) {
    let x = hash(seed) || 0x9e3779b9;
    const r = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    for (let i = 0; i < 6; i++) r();
    return r;
  }
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const between = (a, b, r) => a + Math.floor(r() * (b - a + 1));
  function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  G.hash = hash; G.rng = rng;

  // ================================================================ the template language
  //   {a|b|c}        one of these (nestable, empty options allowed: {|, mate})
  //   {=var}         a value from the context (arrays: one at random; functions: called with (c, r)); {=var^} = UPPER CASE
  //   {?40:text}     text, 40% of the time
  //   {cousin} {cousin.he} {cousin?boy|girl} ...   the visitor's cast (js/cast.js), filled in first, before the rest
  const CT = s => window.Cast ? Cast.t(s) : s;
  function expand(s, c, r, depth) {
    s = CT(String(s == null ? '' : s)); depth = depth || 0;
    if (depth > 12 || s.indexOf('{') < 0) return s;
    let out = '', i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch !== '{') { const j = s.indexOf('{', i); const end = j < 0 ? s.length : j; out += s.slice(i, end); i = end; continue; }
      let lvl = 1, j = i + 1, start = j; const parts = [];
      for (; j < s.length; j++) { const q = s[j]; if (q === '{') lvl++; else if (q === '}') { lvl--; if (!lvl) break; } else if (q === '|' && lvl === 1) { parts.push(s.slice(start, j)); start = j + 1; } }
      if (j >= s.length) { out += s.slice(i); break; }
      parts.push(s.slice(start, j)); i = j + 1;
      if (parts.length > 1) { out += expand(pick(parts, r), c, r, depth + 1); continue; }
      const p = parts[0];
      if (p[0] === '=') { let k = p.slice(1), up = false; if (k.endsWith('^')) { up = true; k = k.slice(0, -1); } let v = val(c, k, r); v = expand(v, c, r, depth + 1); out += up ? v.toUpperCase() : v; continue; }
      const m = /^\?(\d+):([\s\S]*)$/.exec(p);
      if (m) { if (r() * 100 < +m[1]) out += expand(m[2], c, r, depth + 1); continue; }
      out += expand(p, c, r, depth + 1); // a single option: always
    }
    return out;
  }
  function val(c, k, r) {
    let v = c[k];
    if (typeof v === 'function') v = v(c, r);
    if (Array.isArray(v)) v = v.length ? pick(v, r) : '';
    if (typeof v === 'function') v = v(c, r);
    return v == null ? '' : String(v);
  }
  G.expand = expand;

  // ================================================================ voices: transforms applied after a message is written
  const URL_RE = /(https?:\/\/[^\s]+)/g;
  const keepUrls = (s, fn) => s.split(URL_RE).map((p, i) => i % 2 ? p : fn(p)).join('');
  const ORK = [[/\bthe\b/g, 'da'], [/\bThe\b/g, 'Da'], [/\bthis\b/g, 'dis'], [/\bThis\b/g, 'Dis'], [/\bthat\b/g, 'dat'], [/\bThat\b/g, 'Dat'], [/\bthey\b/g, 'dey'], [/\bthem\b/g, 'dem'], [/\bthere\b/g, 'dere'], [/\bthese\b/g, 'deez'],
    [/\bwith\b/g, 'wiv'], [/\bthings?\b/g, w => w.endsWith('s') ? 'fings' : 'fing'], [/\bthink\b/g, 'fink'], [/\bthought\b/g, 'fort'], [/\bnothing\b/g, 'nuffin'], [/\bsomething\b/g, 'sumfin'], [/\banything\b/g, 'anyfing'], [/\beverything\b/g, 'everyfing'],
    [/\bis\b/g, 'iz'], [/\bwas\b/g, 'woz'], [/\byour\b/g, 'yer'], [/\byou're\b/g, 'yer'], [/\byou\b/g, 'ya'], [/\bmy\b/g, 'me'], [/\bvery\b/g, 'propa'], [/\breally\b/g, 'well'], [/\bmoney\b/g, 'roopeez'], [/\bfriend\b/g, 'mate'],
    [/\bhello\b/gi, 'oi'], [/\bgood\b/g, 'orky'], [/\bgreat\b/g, 'propa orky'], [/\bbig\b/g, 'BIG'], [/\bfight\b/g, 'scrap'], [/\bfast\b/g, 'fast (red ones go fasta)'], [/\bthree\b/g, 'free'], [/\bthink\b/g, 'fink'], [/\bwhat\b/g, 'wot'], [/\bWhat\b/g, 'Wot'],
    [/\bisn't\b/g, 'aint'], [/\bdon't\b/g, 'don\'t'], [/\bbecause\b/g, 'coz'], [/\bgoing to\b/g, 'gonna'], [/\bthank you\b/gi, 'fanks']];
  function orky(s) { return keepUrls(s, p => { ORK.forEach(([re, to]) => { p = p.replace(re, to); }); return p.replace(/\bth/g, 'f').replace(/er\b/g, 'a'); }); }
  const KID = [[/\bbecause\b/g, ['becuase', 'coz', 'cos', 'because']], [/\breally\b/g, ['realy', 'really', 'well']], [/\bdefinitely\b/g, ['definately', 'defo']], [/\btomorrow\b/g, ['tomoz', 'tomorow', 'tomorrow']],
    [/\byou\b(?!')/g, ['u', 'u', 'you']], [/\byour\b(?!')/g, ['ur', 'your', 'yor']], [/\bdon't\b/g, ['dont']], [/\bcan't\b/g, ['cant']], [/\bI'm\b/g, ['im', 'Im']], [/\bit's\b/g, ['its']], [/\bthat's\b/g, ['thats']], [/\bwon't\b/g, ['wont']],
    [/\bdidn't\b/g, ['didnt']], [/\bprobably\b/g, ['probly', 'prob']], [/\bweird\b/g, ['wierd']], [/\bbrilliant\b/g, ['brill', 'brilliant', 'mint']], [/\bwhat\b/g, ['wot', 'what']], [/\bgoing to\b/g, ['gonna', 'going to']], [/\bwant to\b/g, ['wanna', 'want to']],
    [/\bthe\b/g, ['teh', 'the', 'the', 'the', 'the', 'the', 'the', 'the']], [/\breceive\b/g, ['recieve']]];
  function kiddy(s, r, lower) {
    return keepUrls(s, p => { KID.forEach(([re, to]) => { p = p.replace(re, () => pick(to, r)); }); if (lower) p = p.replace(/(^|[.!?]\s+|\n)([A-Z])(?=[a-z])/g, (m, a, b) => a + b.toLowerCase()); return p; });
  }
  function sparkle(s, r) { return keepUrls(s, p => p.replace(/\b(so|SO) (good|cool|lush|gorgeous)\b/g, (m, a, b) => `${a} ${b.split('').map((ch, i) => i % 2 ? ch.toUpperCase() : ch.toLowerCase()).join('')}`).replace(/!(\s)/g, (m, sp) => r() < 0.4 ? '!!!' + sp : m)); }
  function caps(s) { return keepUrls(s, p => p.toUpperCase()); }
  function typos(s, r, rate) {
    return keepUrls(s, p => p.replace(/\b([a-z]{5,})\b/g, w => { if (r() > rate) return w; const i = 1 + Math.floor(r() * (w.length - 3)); return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); }));
  }
  const FX = {
    caps: (s, r) => caps(s), ork: (s, r) => orky(s), kid: (s, r) => typos(kiddy(s, r, true), r, 0.03), kidlite: (s, r) => kiddy(s, r, false), kim: (s, r) => sparkle(typos(s, r, 0.015), r),
    typo: (s, r) => typos(s, r, 0.02), none: s => s,
  };
  G.FX = FX; G.orky = orky;

  // ================================================================ text from the calendar / timeline (HTML -> plain)
  const ta = document.createElement('textarea');
  const plain = h => { ta.innerHTML = String(h == null ? '' : h).replace(/<[^>]+>/g, ''); return ta.value.replace(/\s+/g, ' ').trim(); };
  const short = h => plain(h).replace(/\s*\([^)]*\)/g, '').trim();
  G.plain = plain;
  const PLAT = { N64: 'the ULTRA 64', PS: 'the PlaySpace', PC: 'the PC', GB: 'the Game Lad', GBC: 'the Game Lad Color', MD: 'the Mega Glide', DC: 'the Daydream' };

  // ================================================================ the 1999 calendar of a kid in England (school, holidays, festivals)
  // School holidays are for Jack's own (unnamed) school. Everything else is the real 1999 date.
  const HOLS = [['01-01', '01-04'], ['02-15', '02-19'], ['04-02', '04-16'], ['05-03', '05-03'], ['05-31', '06-04'], ['07-23', '09-05'], ['10-25', '10-29'], ['12-18', '12-31']];
  const EV = [
    ['01-01', '01-01', 'newyear'], ['01-02', '01-04', 'jan'], ['01-05', '01-05', 'backjan'], ['01-06', '01-31', 'winter'],
    ['02-08', '02-13', 'valrun'], ['02-14', '02-14', 'valentine'], ['02-15', '02-19', 'halfterm'], ['02-16', '02-16', 'pancake'],
    ['03-08', '03-11', 'rednoserun'], ['03-12', '03-12', 'rednose'], ['03-10', '03-13', 'mothersrun'], ['03-14', '03-14', 'mothers'], ['03-27', '03-28', 'clocksfwd'],
    ['04-01', '04-01', 'aprilfool'], ['04-02', '04-02', 'goodfriday'], ['04-02', '04-16', 'easterhols'], ['04-03', '04-05', 'easter'], ['04-23', '04-23', 'stgeorge'],
    ['05-03', '05-03', 'bankhol'], ['05-31', '05-31', 'bankhol'], ['05-31', '06-04', 'halfterm'], ['06-17', '06-19', 'fathersrun'], ['06-20', '06-20', 'fathers'], ['06-21', '06-21', 'solstice'],
    ['07-19', '07-22', 'endofterm'], ['07-23', '07-23', 'schoolsout'], ['07-23', '09-05', 'summerhols'], ['08-01', '08-10', 'eclipserun'], ['08-11', '08-11', 'eclipse'], ['08-12', '08-13', 'perseids'],
    ['08-30', '08-30', 'bankhol'], ['09-01', '09-05', 'backrun'], ['09-06', '09-06', 'backtoschool'], ['10-25', '10-29', 'halfterm'], ['10-24', '10-30', 'halloweenrun'], ['10-31', '10-31', 'halloween'],
    ['10-30', '10-31', 'clocksback'], ['11-01', '11-04', 'bonfirerun'], ['11-05', '11-05', 'bonfire'], ['11-11', '11-11', 'poppy'], ['11-14', '11-14', 'poppy'], ['11-17', '11-18', 'leonids'],
    ['11-15', '12-31', 'y2k'], ['12-01', '12-23', 'advent'], ['12-17', '12-17', 'endofterm'], ['12-18', '12-23', 'xmashols'], ['12-24', '12-24', 'xmaseve'], ['12-25', '12-25', 'xmas'],
    ['12-26', '12-26', 'boxing'], ['12-27', '12-30', 'betwixt'], ['12-31', '12-31', 'nye'],
  ];
  const SEASON = m => m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn';
  const WEATHER = {
    winter: ['It is FREEZING here.', 'The jackos have got ice on the INSIDE.', 'It has been raining for about a week.', 'Dad scraped the car this morning with a CD case.', 'It got dark at about 4 o\'clock. Again.', 'There was frost on the trampoline.'],
    spring: ['It has been raining on and off all day.', 'The sun came out for ten minutes. Everyone went outside. Then it rained.', 'It is windy enough to fly a kite. Or a small dog.', 'The daffodils are out in the garden.', 'Mom says it is "blowy".'],
    summer: ['It is BOILING.', 'It has been sunny for three whole days. This is a record.', 'The ice cream van has been round twice today.', 'The tarmac outside has gone squishy.', 'It rained on the barbecue. It always rains on the barbecue.'],
    autumn: ['The leaves are all coming off the trees.', 'It is getting dark really early now.', 'It has been grey and drizzly all day.', 'There is a acorn quest tree on the way to school and it is going off.', 'The heating came on for the first time today.'],
  };
  const SKYDARK = { winter: 'about half four', spring: 'about eight', summer: 'nearly ten', autumn: 'about six' };

  // ================================================================ the context for one day
  const dayCtx = {};
  function ctxFor(key, who) {
    const memo = key + '|' + who.seed + '|' + who.name;
    if (dayCtx[memo]) return dayCtx[memo];
    const [m, d] = key.split('-').map(Number), dt = new Date(1999, m - 1, d), dow = dt.getDay(), n = dayNo(key);
    const TL = (k) => { try { return window.Timeline ? Timeline.now(k, key) : []; } catch (e) { return []; } };
    const ev = new Set(EV.filter(e => inR(key, e[0], e[1])).map(e => e[2]));
    const hols = HOLS.some(h => inR(key, h[0], h[1]));
    const playing = TL('playing').filter(e => !e.fading);
    const crazes = TL('craze').filter(e => !e.dying);
    const tvs = TL('tv');
    const ch = TL('chart')[0];
    const hype = TL('hype');
    const sp = TL('space')[0] || { past: [], next: [] };
    const saving = TL('saving').filter(e => !e.got);
    const savingAll = TL('saving');
    const film = TL('film')[0];
    const mom = TL('mom')[0], mood = TL('mood')[0];
    const CAL = window.CAL || { posts: [] };
    const posts = CAL.posts.filter(p => { const k = dayNo(p[0]); return k <= n && k > n - 7; }).map(p => ({ key: p[0], tag: p[1], text: plain(p[2]) })).sort((a, b) => dayNo(b.key) - dayNo(a.key));
    const season = SEASON(m);
    const c = {
      key, m, d, n, dow, md: m * 100 + d, dayname: DAYS[dow], monthname: MONTHS[m - 1], date: `${d} ${MONTHS[m - 1]}`, dateLong: `${DAYS[dow]} ${d} ${MONTHS[m - 1]} 1999`, ddmm: `${pad(d)}/${pad(m)}/99`,
      tomorrow: DAYS[(dow + 1) % 7], yesterday: DAYS[(dow + 6) % 7],
      hols, term: !hols, school: dow >= 1 && dow <= 5 && !hols, wkend: dow === 0 || dow === 6, mon: dow === 1, fri: dow === 5, sat: dow === 6, sun: dow === 0, schoolTomorrow: !HOLS.some(h => inR(keyOf(Math.min(364, n + 1)), h[0], h[1])) && dow !== 5 && dow !== 6,
      season, weather: WEATHER[season], dark: SKYDARK[season], ev, is: id => ev.has(id),
      name: who.name, NAME: who.name.toUpperCase(), guest: !who.member, member: !!who.member, no: who.no || 0, addr: who.addr, first: !!who.firstDay,
      games: playing.map(e => ({ name: short(e.text), on: PLAT[e.p] || 'the computer', note: plain(e.n || ''), p: e.p, y98: !!e.y98, from: e.from })),
      crazes: crazes.map(e => ({ name: plain(e.text), note: plain(e.n || '') })),
      tvs: tvs.filter(e => !e.lo || e.lo <= 2).map(e => ({ name: short(e.text), ch: plain(e.c || ''), lo: e.lo || 0 })),
      no1: ch ? `"${plain(ch.title)}" by ${plain(ch.artist)}` : '', no1t: ch ? plain(ch.title) : '', no1a: ch ? plain(ch.artist) : '', no1wk: ch ? ch.week : 0, no1new: !!(ch && ch.week === 1), no1verdict: ch ? plain(ch.verdict) : '',
      no1prev: ch && ch.prev ? `"${plain(ch.prev.title)}" by ${plain(ch.prev.artist)}` : '',
      cds: hype.filter(h => h.inWin && h.left > 0).map(h => ({ name: plain(h.name), left: h.left, d: h.d })),
      rel: hype.filter(h => h.left === 0).map(h => plain(h.name)),
      soonest: hype.filter(h => h.left > 0).slice(0, 1).map(h => ({ name: plain(h.name), left: h.left }))[0] || null,
      spPast: (sp.past || []).filter(p => p.ago <= 2), spNext: (sp.next || [])[0] || null, spAll: sp, sky: sp.sky || '',
      saving: saving.map(e => ({ name: plain(e.text), price: e.price })), savingAll: savingAll.map(e => ({ name: plain(e.text), price: e.price, got: !!e.got })),
      film: film ? plain(film.text) : '', mom: mom ? plain(mom.text) : '', mood: mood ? plain(mood.text) : '',
      posts, postsToday: posts.filter(p => p.key === key),
    };
    c.cd = c.cds[0] || null;
    c.cdline = c.cd ? `${c.cd.left} ${c.cd.left === 1 ? 'day' : 'days'} till ${c.cd.name}` : '';
    c.hasGame = c.games.length > 0; c.hasNo1 = !!c.no1;
    return (dayCtx[memo] = c);
  }
  // per-message context: a few things are picked once so a message talks about the same game all the way through
  function mailCtx(base, def, r) {
    const c = Object.create(base);
    const g = base.games.length ? pick(base.games, r) : { name: 'Jacktris', on: 'the PC', note: 'my own Blockology', p: 'PC' };
    c.game = g.name; c.gameOn = g.on; c.gameNote = g.note; c.gameP = g.p;
    const g2 = base.games.filter(x => x.name !== g.name); c.game2 = g2.length ? pick(g2, r).name : 'Jacktris';
    const cr = base.crazes.length ? pick(base.crazes, r) : { name: 'yo-yos', note: '' }; c.craze = cr.name; c.crazeNote = cr.note;
    const tv = base.tvs.length ? pick(base.tvs.filter(t => !t.lo).length ? base.tvs.filter(t => !t.lo) : base.tvs, r) : { name: 'The Simpsocks', ch: 'BBQ Two' }; c.tv = tv.name; c.tvCh = tv.ch;
    const sv = base.saving.length ? pick(base.saving, r) : null; c.saving = sv ? sv.name : 'a Daydream'; c.savingPrice = sv ? '£' + sv.price.toFixed(2) : '£199.99';
    c.wx = pick(base.weather, r);
    { const d = new Date(); c.clock = d.getHours() + ':' + pad(d.getMinutes()); }
    c.n1 = between(2, 9, r); c.n2 = between(10, 99, r); c.n3 = between(100, 999, r); c.score = (between(12, 98, r) * 1000 + between(0, 9, r) * 100).toLocaleString('en-GB');
    if (def.v) for (const k of Object.keys(def.v)) c[k] = def.v[k];
    return c;
  }
  G.ctxFor = ctxFor;

  // ================================================================ one day's post
  const memo = {};
  // a "must" mail only ever turns up on its day; everything else by weight
  function msgsFor(def, c) { return (def.mails || []).map(x => ({ x, w: x.must ? (x.must(c) ? 1000 : 0) : (typeof x.w === 'function' ? +x.w(c) || 0 : (x.w == null ? 1 : x.w)) })).filter(o => o.w > 0); }
  // the user's name goes in as a token so the voices (typos, Orky, CAPS) can't mangle it, then comes back at the end
  const NT = '\u0002n\u0002', NU = '\u0002N\u0002'; // {=name} and {=NAME} (or {=name^})
  const fin = (s, who, up) => CT(String(s == null ? '' : s)).split(NT).join(up ? who.toUpperCase() : who).split(NU).join(who.toUpperCase());
  const sv = (v, c, r) => typeof v === 'function' ? v(c, r) : v;
  function write(def, x, base, r, id) {
    const c = mailCtx(base, def, r), who = base.name;
    c.id = id; c.name = NT; c.NAME = NU;
    if (x.v) for (const k of Object.keys(x.v)) c[k] = x.v[k];
    const once = Object.assign({}, def.once, x.once); for (const k of Object.keys(once)) { let v = once[k]; if (typeof v === 'function') v = v(c, r); if (Array.isArray(v)) v = pick(v, r); c[k] = v; } // picked once, used everywhere in this mail
    const fxName = x.fx || def.fx || 'none', fx = FX[fxName] || FX.none, up = fxName === 'caps' || fxName === 'gran';
    const card = x.card ? x.card(c, r) : null;
    if (card) { card.code = (hash(id + who) % 2176782336).toString(36).padStart(6, '0'); c.code = card.code; }
    const subj = expand(sv(x.subj, c, r) || '(no subject)', c, r);
    let body = expand(sv(x.body, c, r) || '', c, r);
    if (def.wrap && !x.raw && !x.nowrap) { c.body = body; body = expand(def.wrap, c, r); }
    if (def.ps && !x.raw && !x.nops && r() < (def.psRate == null ? 0.45 : def.psRate)) body += '\n\n' + expand(pick(def.ps, r), c, r);
    if (x.foot) body += expand(sv(x.foot, c, r), c, r);
    const out = {
      gen: true, kind: def.id, from: fin(expand(sv(x.from || def.from, c, r), c, r), who), to: fin(expand(x.to || def.to || '{=name} <{=addr}>', c, r), who),
      subj: fin(x.rawsubj ? subj : fx(subj, r), who, up), body: fin(x.raw ? body : fx(body, r), who, up),
      spam: !!(def.spam || x.spam), news: x.news || def.news || '', mono: !!(x.mono || def.mono), chain: x.chain || 0, prio: !!x.prio,
      rare: !!x.rare, golden: !!x.golden, mission: !!x.mission, secret: x.secret || def.secret || '', rel: !!x.rel, card: null, hoax: x.hoax || '', ascii: !!(x.ascii || def.ascii),
    };
    if (card) { card.title = fin(card.title, who, card.up); card.msg = fin(card.msg, who, card.up); card.from = fin(card.from, who); out.card = card; }
    if (x.att) out.att = x.att(c, r);
    if (x.after) { x.after(out, c, r); out.subj = fin(out.subj, who, up); out.body = fin(out.body, who, up); out.from = fin(out.from, who); }
    return out;
  }
  function weighted(list, r) { const tot = list.reduce((s, o) => s + o.w, 0); let t = r() * tot; for (const o of list) { t -= o.w; if (t <= 0) return o; } return list[list.length - 1]; }
  G.day = function (key, who) {
    const mk = who.seed + '|' + who.name + '|' + key + '|' + (who.firstDay ? 1 : 0) + '|' + (who.member ? 1 : 0);
    if (memo[mk]) return memo[mk];
    const base = ctxFor(key, who), r = rng(who.seed + '|' + key);
    const out = [], used = new Set();
    const add = (def, x) => { const id = 'g' + (hash(who.seed) % 1679616).toString(36) + '_' + key.replace('-', '') + '_' + out.length; const msg = write(def, x, base, rng(who.seed + '|' + key + '|' + def.id + '|' + out.length), id); msg.id = id; out.push(msg); used.add(def.id); };
    const defs = Object.keys(T).sort().map(k => T[k]).filter(d => !d.replyOnly); // sorted: the template files load in any order
    // 1) things that MUST happen today (release days, festivals, welcomes), at most four
    const musts = [];
    for (const def of defs) for (const x of def.mails || []) if (x.must && x.must(base)) musts.push([def, x]);
    shuffle(musts, r).slice(0, 4).forEach(([def, x]) => { if (!used.has(def.id)) { add(def, x); out[out.length - 1].early = true; } });
    // 2) newsletters on their schedule (at most two), then the odd one-off
    const news = shuffle(defs.filter(d => d.sched && !used.has(d.id) && d.sched(base, r)), r).slice(0, 2);
    news.forEach(def => { const ok = msgsFor(def, base); if (ok.length) add(def, weighted(ok, r).x); });
    // 3) spam (the junk filter usually catches it)
    const spamPool = []; defs.filter(d => d.spam).forEach(d => msgsFor(d, base).forEach(o => spamPool.push(Object.assign({ d }, o))));
    const nSpam = between(0, base.wkend ? 1 : 2, r);
    for (let i = 0; i < nSpam && spamPool.length; i++) { const o = weighted(spamPool, r); spamPool.splice(spamPool.indexOf(o), 1); add(o.d, o.x); }
    // 4) people, clubs and everything else: 4-8 of them (fewer at weekends, more on big days)
    let want = (base.wkend ? between(3, 5, r) : between(4, 7, r)) + (base.rel.length || base.ev.size > 1 ? 1 : 0);
    const pool = defs.filter(d => !d.spam && !d.sched && !used.has(d.id)).map(d => ({ d, w: typeof d.w === 'function' ? +d.w(base) || 0 : (d.w == null ? 1 : d.w) })).filter(o => o.w > 0 && msgsFor(o.d, base).length);
    while (want-- > 0 && pool.length) {
      const o = weighted(pool, r); pool.splice(pool.indexOf(o), 1);
      add(o.d, weighted(msgsFor(o.d, base), r).x);
    }
    // 5) a rare one (about one day in ten): something nobody else has seen
    if (r() < 0.1) { const rares = []; defs.forEach(d => (d.rares || []).forEach(x => { if (!x.w || x.w(base)) rares.push([d, x]); })); if (rares.length) { const golden = r() < 0.08; const cand = rares.filter(([, x]) => !!x.golden === golden); const [d, x] = pick(cand.length ? cand : rares, r); add(d, Object.assign({ rare: true }, x)); } }
    // times: spread through the day (mail arrives from about 6am); ids stay in the order they were made
    const mins = out.map(() => between(6 * 60 + 15, 23 * 60 + 20, r)).sort((a, b) => a - b);
    const order = shuffle(out.map((_, i) => i), r);
    order.forEach((oi, k) => { out[oi].min = mins[k]; });
    out.sort((a, b) => a.min - b.min);
    out.forEach(m => { if ((m.early || /Weekly|Bulletin|Gazette/.test(m.from)) && m.min > 9 * 60) m.min = 6 * 60 + 30 + (hash(m.id) % 150); });
    out.sort((a, b) => a.min - b.min);
    out.forEach(m => { m.gd = key; m.date = base.ddmm; });
    out.late = Math.min(out.length - 1, 2 + Math.floor(r() * 3));
    return (memo[mk] = out);
  };

  // ================================================================ hooking into Outlook Express
  let X = null, ms = null; // X = the API from apps-files.js, ms = its mail store
  const now99 = () => Desk.today99();
  const todayKey = () => { const t = now99(); return pad(t.m) + '-' + pad(t.d); };
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const hm = min => `${Math.floor(min / 60)}:${pad(min % 60)}`;
  const secret = id => { try { A.secret(id); } catch (e) {} };
  function whoNow() {
    const me = (window.Net && Net.me) || {}, nick = me.nick || '';
    if (!nick) return null;
    const member = !!me.member, slug = nick.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'guest';
    return { key: member ? 'm:' + nick.toLowerCase() : 'guest', seed: member ? 'm:' + nick.toLowerCase() : 'guest:' + ((window.Net && Net.cid) || 'x').slice(0, 8), name: nick, member, no: me.no || 0, addr: slug + '@jacknet.jnet' };
  }
  G.who = whoNow;
  function st() {
    const g = ms.gen = ms.gen || {};
    g.got = g.got || {}; g.t0 = g.t0 || {}; g.pend = g.pend || []; g.rules = g.rules || []; g.unsub = g.unsub || {}; g.days = g.days || {}; g.stats = g.stats || { read: 0 };
    if (!g.filter) g.filter = 'low';
    return g;
  }
  // a different person logged on: wipe the old inbox and start theirs
  function identity() {
    const w = whoNow(); if (!w || !ms) return null;
    const g = st();
    if (g.who !== w.key) {
      const had = !!g.who;
      Object.keys(ms.read).concat(Object.keys(ms.moved), Object.keys(ms.gone)).forEach(id => { if (/^g/.test(id)) { delete ms.read[id]; delete ms.moved[id]; delete ms.gone[id]; } });
      ms.gen = { who: w.key, first: todayKey(), filter: g.filter, rules: g.rules, got: {}, t0: {}, pend: [], unsub: {}, days: {}, stats: { read: 0 }, was: g.who || '', chain: 0 };
      if (had) { ms.gen.switched = 1; setTimeout(() => secret('mail.switch'), 4000); }
      X.changed();
    }
    return w;
  }
  // the window: up to 13 days back (never back past New Year's Day, it's 1999 forever), 3 "already read" days before your first visit
  function windowDays() {
    const g = st(), tk = todayKey(), tn = dayNo(tk);
    const first = g.first && dayNo(g.first) <= tn ? dayNo(g.first) : tn;
    const from = Math.max(0, tn - 13, first - 3);
    const out = []; for (let n = from; n <= tn; n++) out.push({ key: keyOf(n), pre: n < first, today: n === tn });
    return out;
  }
  let cacheSig = '', cacheList = [];
  G.list = function () {
    if (!X || !G.ready) return [];
    const w = identity(); if (!w) return [];
    const g = st(), tk = todayKey();
    if (g.t0[tk] == null) { g.t0[tk] = nowMin(); g.days[tk] = 1; pruneOld(); X.save(); }
    const sig = [w.key, w.name, w.member, tk, JSON.stringify(g.got).length, Object.keys(g.got).length, g.first].join('|');
    if (sig === cacheSig) return cacheList;
    const out = [];
    for (const day of windowDays()) {
      const list = G.day(day.key, Object.assign({}, w, { firstDay: day.key === g.first && w.member }));
      if (!day.today) { list.forEach(m => { m.time = hm(m.min); m.pre = day.pre; out.push(m); }); continue; }
      const t0 = g.t0[tk], early = list.length - list.late;
      list.forEach((m, i) => {
        if (i < early) { const lo = t0 < 400 ? 1 : 365; m.time = hm(Math.min(m.min, Math.round(lo + (m.min - 375) / 1025 * Math.max(5, t0 - lo)))); m.pre = false; out.push(m); }
        else if (g.got[m.id]) { m.time = g.got[m.id]; m.pre = false; out.push(m); }
      });
    }
    out.forEach(m => { if (m.card) registerCard(m); });
    cacheSig = sig; cacheList = out;
    return out;
  };
  function pruneOld() {
    const keep = new Set(windowDays().map(d => d.key.replace('-', '')));
    const g = st();
    const isOld = id => /^g[a-z0-9]*_\d{4}_/.test(id) && !keep.has(id.split('_')[1]);
    [ms.read, ms.moved, ms.gone, g.got].forEach(o => Object.keys(o).forEach(id => { if (isOld(id)) delete o[id]; }));
    Object.keys(g.t0).forEach(k => { if (!keep.has(k.replace('-', ''))) delete g.t0[k]; });
    Object.keys(g.days).forEach(k => { if (dayNo(k) > dayNo(todayKey())) delete g.days[k]; });
  }
  // which messages of today are still on their way
  function waiting() {
    if (!G.ready) return [];
    const w = whoNow(); if (!w) return [];
    const g = st(), tk = todayKey();
    const list = G.day(tk, Object.assign({}, w, { firstDay: tk === g.first && w.member }));
    return list.slice(list.length - list.late).filter(m => !g.got[m.id]);
  }
  G.waiting = waiting;

  // ================================================================ folders: junk filter + Inbox Assistant rules
  const FILTERS = [['off', 'Off', 'Everything goes in your Inbox. Brave.'], ['low', 'Low', 'Only the really obvious junk (SHOUTY SUBJECTS!!!) is moved to the Junk folder.'], ['high', 'High', 'All junk mail is moved. Some newsletters might get caught too. They probably deserved it.'], ['max', 'Exclusive', 'ONLY messages from Mom reach your Inbox. Everything else is junk. (Mom chose this setting.)']];
  const isMom = m => /^\s*Mom\b/.test(m.from || '');
  G.folder = function (m) {
    const f = m.f || 'inbox';
    if (!ms || (f !== 'inbox' && !(m.gen && f === 'junk'))) return f;
    if (isMom(m)) return 'inbox';
    const g = st();
    const text = ((m.from || '') + ' ' + (m.subj || '') + ' ' + (m.body || '')).toLowerCase();
    if (g.rules.some(x => x.on && x.word && text.includes(x.word.toLowerCase()))) return 'junk';
    if (g.filter === 'max') return 'junk';
    if (!m.gen) return f;
    if (m.spam) { if (g.filter === 'off') return 'inbox'; if (g.filter === 'high') return 'junk'; return /[A-Z]{4,}|!!/.test(m.subj || '') || hash(m.id) % 3 ? 'junk' : 'inbox'; }
    if (g.filter === 'high' && m.news && hash(m.id + 'n') % 4 === 0) return 'junk';
    return 'inbox';
  };

  // ================================================================ arrivals: the tray envelope, toasts, live delivery
  let trayBtn = null, lastArrive = Date.now(), nextGap = 0, lastToastAt = 0, started = false;
  const TRAY_SVG = '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="4" width="14" height="10" fill="#fff" stroke="#000"/><path d="M1 4l7 5 7-5" fill="#ffe680" stroke="#000"/><path d="M1 14l5-5M15 14l-5-5" stroke="#808080"/></svg>';
  function newCount() {
    if (!X) return 0;
    const tk = todayKey();
    return X.messages('inbox').filter(m => X.isNew(m) && ((m.gen && m.gd === tk) || (m.user && m.inc) || (!m.gen && !m.user && m.d === tk))).length;
  }
  function tray() {
    const n = newCount(), el = document.getElementById('tray');
    if (!el) return;
    if (n && !trayBtn) {
      trayBtn = document.createElement('button'); trayBtn.type = 'button'; trayBtn.className = 'sys-tray mg-tray'; trayBtn.innerHTML = TRAY_SVG;
      trayBtn.addEventListener('click', ev => { ev.stopPropagation(); secret('mail.tray'); A.open('outlook'); });
      trayBtn.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu([{ label: 'Open JackMail Express', act: () => A.open('outlook') }, { label: 'Send and Receive', act: () => X.sendRecv() }, '-', { label: 'Mark All as Read', act: () => { X.messages('inbox').forEach(m => { if (m.gen || m.inc) ms.read[m.id] = 1; }); X.changed(); } }], ev.clientX, ev.clientY - 10); });
      el.insertBefore(trayBtn, document.getElementById('clock'));
    }
    if (!n && trayBtn) { trayBtn.remove(); trayBtn = null; }
    if (trayBtn) { const t = `You have ${n} new e-mail message${n > 1 ? 's' : ''}`; trayBtn.title = t; trayBtn.setAttribute('aria-label', t); }
  }
  G.tray = tray;
  const busy = () => document.hidden || !DesktopSurface.ready() || document.querySelector('.logon') || document.querySelector('.dialwin');
  const plural = (n, w) => `${n} new ${w}${n === 1 ? '' : 's'}`;
  function toast(text, ms0) { lastToastAt = Date.now(); Desk.toast('JackMail Express', text, ms0 || 6000); }
  function arrive(m, quiet) {
    const g = st(); g.got[m.id] = hm(nowMin()); lastArrive = Date.now(); nextGap = (150 + Math.random() * 270) * 1000;
    cacheSig = ''; X.changed();
    if (!quiet) {
      Sound.play('join');
      const f = G.folder(m);
      toast(f === 'junk' ? `A new message was moved to your Junk folder by the Inbox Assistant. ("${m.subj.slice(0, 40)}")` : `You have 1 new message from ${X.nameOf(m.from)}:\n"${m.subj.slice(0, 60)}"`);
      if (!g.liveSeen) { g.liveSeen = 1; secret('mail.live'); }
    }
    tray();
  }
  // Send/Recv: anything waiting comes down the line now (if it's been at least 40 seconds)
  G.fetch = function () {
    if (!G.ready || !X) return 0;
    const w = waiting();
    if (!w.length || Date.now() - lastArrive < 40000) return 0;
    arrive(w[0], true); Sound.play('join');
    return 1;
  };
  function tick() {
    if (!X || !G.ready || busy()) return;
    const w = whoNow(); if (!w) return;
    identity();
    const g = st(), tk = todayKey();
    if (g.day !== tk) { g.day = tk; started = true; dayStart(); return; }
    if (!started) { started = true; const n = newCount(); tray(); if (n) { lastToastAt = Date.now(); setTimeout(() => { if (!busy()) { Sound.play('join'); toast(`You have ${plural(n, 'message')} you haven't read yet.`, 5000); } }, 1500); } }
    // replies people promised
    const due = g.pend.filter(p => p.at <= Date.now());
    if (due.length) { const now2 = due.slice(0, 2); g.pend = g.pend.filter(p => !now2.includes(p)); now2.forEach(p => deliverReply(p)); X.changed(); return; }
    // midnight Mom
    const hr = new Date().getHours();
    if (hr < 5 && g.night !== tk && Date.now() - lastToastAt > 30000) { g.night = tk; const tpl = T.mom && T.mom.night; if (tpl) { queueReply({ def: 'mom', tpl: 'night', delay: 5 }); } X.changed(); return; }
    if (!nextGap) nextGap = (120 + Math.random() * 200) * 1000;
    if (Date.now() - lastArrive > nextGap && Date.now() - lastToastAt > 30000) { const wt = waiting(); if (wt.length) arrive(wt[0]); else nextGap = 600000; }
  }
  // first look at the post today: "You have N new messages"
  function dayStart() {
    cacheSig = ''; X.changed();
    const n = newCount();
    const days = Object.keys(st().days).length;
    if (days >= 7) secret('mail.regular');
    if (n) { setTimeout(() => { if (busy()) return; Sound.play('join'); toast(`You have ${plural(n, 'message')}! Click the little envelope by the clock to read ${n === 1 ? 'it' : 'them'}.`, 7000); }, 1800); }
    lastArrive = Date.now(); nextGap = (100 + Math.random() * 140) * 1000;
    tray();
  }
  G.welcome = dayStart;

  // ================================================================ replies: Gran types slowly, Dave types fast, Gubbinz types with his fists
  const addrOf = s => (String(s || '').match(/[^\s<>;,"]+@[^\s<>;,"]+/g) || []).map(a => a.toLowerCase());
  const FAKE_TLD = /\.(jnet|grot|webcom|kidz|w3b|netz|infobahn|find|cyb|wubwub|homepagez)$/i;
  G.fakeAddr = a => FAKE_TLD.test(a);
  function defByAddr(a) { return Object.values(T).find(d => (d.addrs || []).some(x => (x instanceof RegExp ? x.test(a) : x === a))); }
  function queueReply(p) { const g = st(); g.pend.push(Object.assign({ at: Date.now() + (p.delay || 60) * 1000 }, p)); X.save(); }
  function deliverReply(p) {
    const w = whoNow(); if (!w) return;
    const def = T[p.def]; if (!def) return;
    const tpl = p.tpl === 'night' ? def.night : ((def.replies || {})[p.tpl] || (p.tpl === 'reply' ? def.reply : null) || ((T.mailer && T.mailer.replies) || {})[p.tpl]);
    if (!tpl) return;
    const base = ctxFor(todayKey(), w), r = rng(w.seed + '|reply|' + Date.now());
    const c = mailCtx(base, def, r), who = w.name; c.name = NT; c.NAME = NU;
    c.re = p.subj || ''; c.reSubj = /^re:/i.test(p.subj || '') ? p.subj : 'Re: ' + (p.subj || '(no subject)'); c.quote = String(p.body || '').split('\n').filter(l => !/^>/.test(l)).slice(0, 8).map(l => '> ' + l).join('\n').trim();
    c.said = String(p.body || '').split(/-----\s*Original Message/i)[0].trim(); c.to0 = p.to0 || '';
    c.chainN = p.chainN || 0; c.chainFw = 'FW: '.repeat(Math.min(40, (p.chainN || 0) + 1));
    const pickT = Array.isArray(tpl) ? pick(tpl.filter(t => !t.w || t.w(c, p)), r) || tpl[0] : tpl;
    const fxName = pickT.fx || def.fx || 'none', fx = FX[fxName] || FX.none, up = fxName === 'caps' || fxName === 'gran';
    const body = fin(fx(expand(sv(pickT.body, c, r), c, r), r), who, up);
    const from = fin(expand(sv(pickT.from || def.from, c, r), c, r), who);
    X.deliver({ from, to: `${w.name} <${w.addr}>`, subj: fin((pickT.rawsubj ? (s => s) : fx)(expand(pickT.subj || '{=reSubj}', c, r), r), who, up), body, chain: pickT.chain ? (p.chainN || 0) + 1 : 0, mono: !!pickT.mono, kind: def.id });
    Sound.play('join');
    toast(`You have 1 new message from ${X.nameOf(from)}.`);
    if (pickT.secret) setTimeout(() => secret(pickT.secret), 1500);
    if (pickT.then) pickT.then(c, p);
    tray();
  }
  // things you send: anything to the fake web arrives (the real Internet still can't be found, it's 1999)
  G.send = function (list) {
    const handled = [];
    list.forEach(u => {
      const addrs = addrOf((u.to || '') + ';' + (u.cc || ''));
      if (!addrs.length || !addrs.some(a => FAKE_TLD.test(a))) return;
      handled.push(u);
      u.f = 'sent';
      const orig = u.reOf ? X.byId(u.reOf) : u.fwOf ? X.byId(u.fwOf) : null;
      const isChain = !!(u.fwOf && orig && orig.chain) || /DON'?T BREAK THE CHAIN|SEND THIS TO/i.test(u.body || '');
      const unsub = /^\s*(unsubscribe|remove|stop)\b/i.test((u.subj || '') + ' ' + (u.body || '').trim());
      let n = 0;
      addrs.filter(a => FAKE_TLD.test(a)).slice(0, 3).forEach(a => {
        const base = { subj: u.subj, body: u.body, to0: a };
        if (isChain && u.fwOf) { const g = st(); g.chain = (g.chain || 0) + 1; if (g.chain === 1) secret('mail.chain'); if (g.chain >= 5) secret('mail.chain5'); if (g.chain >= 10) secret('mail.chain10'); if (n++ === 0) queueReply(Object.assign({ def: 'chain', tpl: 'back', delay: 50 + Math.random() * 70, chainN: (orig && orig.chain) || 3 }, base)); return; }
        const def = defByAddr(a);
        if (!def) { if (/^(noreply|no-reply|donotreply|weekly|forums|robot|bulletin|news|newsletter|alerts|orders|billing)/.test(a) || hash(a) % 3 === 0) queueReply(Object.assign({ def: 'mailer', tpl: 'bounce', delay: 20 + Math.random() * 25 }, base)); return; }
        if (unsub && def.news) { queueReply(Object.assign({ def: def.id, tpl: 'unsub', delay: 30 + Math.random() * 30 }, base)); return; }
        if (def.noreply) { queueReply(Object.assign({ def: def.id, tpl: 'bounce', delay: 20 + Math.random() * 25 }, base)); return; }
        if (!def.reply && !def.replies) return;
        const d = def.replyDelay || [40, 120];
        queueReply(Object.assign({ def: def.id, tpl: 'reply', delay: d[0] + Math.random() * (d[1] - d[0]) }, base));
      });
    });
    if (handled.length) X.changed();
    return handled;
  };
  // a mail was read: count towards the secrets
  G.onRead = function (m) {
    if (!ms) return;
    const g = st(); g.stats.read = (g.stats.read || 0) + 1;
    if (g.stats.read >= 50) secret('mail.read50');
    if (m.rare) secret(m.golden ? 'mail.golden' : 'mail.rare');
    if (m.rel) secret('mail.release');
    if (m.ascii) secret('mail.ascii');
    if (m.kind === 'jack') secret('mail.jack');
    if (m.kind === 'orbit' && m.mission) secret('mail.space');
    if (m.gen && m.gd === todayKey()) { const left = X.messages('inbox').concat(X.messages('junk')).filter(x => x.gen && x.gd === m.gd && X.isNew(x)); if (!left.length && !waiting().length) secret('mail.today'); }
    tray();
  };

  // ================================================================ the Inbox Assistant
  let iaWin = null;
  G.assistant = function () {
    if (iaWin && !iaWin.closed) { iaWin.focus(); return; }
    const g = st();
    const b = document.createElement('div'); b.className = 'mg-ia';
    const draw = () => {
      b.innerHTML = `<div class="mg-ia-top"><svg viewBox="0 0 32 32" width="32" height="32"><rect x="3" y="9" width="22" height="16" fill="#fff" stroke="#000"/><path d="M3 9l11 8 11-8" fill="#ffe680" stroke="#000"/><circle cx="25" cy="23" r="6" fill="#1a9a1a" stroke="#000"/><path d="M22 23l2 2 4-4" stroke="#fff" stroke-width="2" fill="none"/></svg><span>The Inbox Assistant sorts your mail for you as it arrives. It is very keen. Sometimes too keen.</span></div>
        <div class="group"><span class="lg">Junk mail filter</span>${FILTERS.map(([id, n, d]) => `<label class="mg-ia-rad"><input type="radio" name="mgf" value="${id}"${g.filter === id ? ' checked' : ''}> <span><b>${n}</b>: ${esc(d)}</span></label>`).join('')}</div>
        <div class="group"><span class="lg">Rules</span><div class="field mg-ia-rules">${g.rules.length ? g.rules.map((x, i) => `<label class="mg-ia-rule"><input type="checkbox" data-i="${i}"${x.on ? ' checked' : ''}> <span>Where the message contains "<b>${esc(x.word)}</b>", move it to the <b>Junk</b> folder</span><button type="button" class="btn mg-ia-x" data-x="${i}" aria-label="Remove rule">X</button></label>`).join('') : '<div class="small mg-ia-none">No rules yet. Click New... to make one.</div>'}</div>
        <div class="row mg-ia-btns"><button class="btn" type="button" data-a="new">New...</button><button class="btn" type="button" data-a="mom">Block Mom</button><button class="btn" type="button" data-a="apply">Apply Now</button></div></div>
        <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-a="ok">OK</button></div>`;
    };
    draw();
    iaWin = A.win('Inbox Assistant', b, { w: 430, noMax: true, icon: X.icon, escClose: true });
    b.addEventListener('change', ev => {
      const t = ev.target;
      if (t.name === 'mgf') {
        const was = g.filter; g.filter = t.value; cacheSig = ''; X.changed();
        if (t.value === 'max' && was !== 'max') { secret('mail.exclusive'); if (!g.granJunk) { g.granJunk = 1; queueReply({ def: 'gran', tpl: 'junked', delay: 45 }); } Desk.toast('Inbox Assistant', 'Exclusive mode: only Mom gets through. Gran has been notified. (Somehow Gran is always notified.)', 6000); }
      }
      if (t.dataset.i != null) { const x = g.rules[+t.dataset.i]; if (x) { x.on = t.checked; X.changed(); } }
    });
    b.addEventListener('click', ev => {
      const e = ev.target.closest('[data-a],[data-x]'); if (!e) return;
      if (e.dataset.x != null) { g.rules.splice(+e.dataset.x, 1); X.changed(); draw(); return; }
      const a = e.dataset.a;
      if (a === 'ok') iaWin.close();
      else if (a === 'new') Desk.ask('New Rule', 'Move messages to the Junk folder when they contain the word:', '', 24, v => { v = String(v || '').trim(); if (!v) return; if (/^mom$/i.test(v)) { Desk.msgbox('Inbox Assistant', 'This rule would move messages from Mom.\n\nRules cannot move messages from Mom. Mom set the computer up that way. Mom has been told you tried. (She hasn\'t. But she might.)', 'warn'); secret('mail.blockmom'); return; } g.rules.push({ word: v.slice(0, 24), on: true }); X.changed(); draw(); secret('mail.rules'); Desk.toast('Inbox Assistant', `New rule: anything with "${v}" goes in the Junk folder. Gubbinz is now sorting your post.`, 5000); });
      else if (a === 'mom') { Desk.msgbox('Inbox Assistant', 'You cannot block Mom.\n\nYou have never been able to block Mom.\n\nMom can see the Inbox Assistant from the kitchen.', 'warn'); secret('mail.blockmom'); }
      else if (a === 'apply') { const n = X.messages('inbox').length; cacheSig = ''; X.changed(); const moved = n - X.messages('inbox').length; Desk.toast('Inbox Assistant', moved > 0 ? `Done! ${moved} message${moved > 1 ? 's' : ''} moved to the Junk folder.` : 'Done! Nothing needed moving. Your Inbox is spotless. (Your bedroom isn\'t.)', 4000); }
    });
  };

  // ================================================================ the fake web: e-cards, HoaxWatch, the Unsubscribe-o-Matic and a spam "remove me" page
  const CARDS = {}; // code -> card
  const GZ = { title: 'Greetz-o-Matic! Free e-cards', pages: {} };
  const CARDART = {
    heart: '<svg viewBox="0 0 64 64" class="mg-art mg-beat"><path d="M32 56C6 38 4 22 14 14s18 0 18 6c0-6 8-14 18-6s8 24-18 42z" fill="#e8102e" stroke="#600" stroke-width="2"/><path d="M18 20c2-4 6-5 8-4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    egg: '<svg viewBox="0 0 64 64" class="mg-art mg-wob"><ellipse cx="32" cy="36" rx="18" ry="24" fill="#ffd400" stroke="#7a5a00" stroke-width="2"/><path d="M15 32l6-4 6 4 6-4 6 4 6-4 4 3" stroke="#e8102e" stroke-width="3" fill="none"/><path d="M15 44l6 4 6-4 6 4 6-4 6 4 4-3" stroke="#2a7ad8" stroke-width="3" fill="none"/></svg>',
    pumpkin: '<svg viewBox="0 0 64 64" class="mg-art mg-wob"><path d="M30 14c0-6 4-8 8-8" stroke="#2a7a2a" stroke-width="4" fill="none"/><ellipse cx="32" cy="38" rx="26" ry="20" fill="#ff8c00" stroke="#7a3a00" stroke-width="2"/><path d="M20 32l6 4-8 2zM44 32l-6 4 8 2zM18 46c8 6 20 6 28 0l-4 2-4-3-4 3-4-3-4 3-4-3z" fill="#2a1a00"/></svg>',
    firework: '<svg viewBox="0 0 64 64" class="mg-art mg-spin"><g stroke-width="3" stroke-linecap="round"><path d="M32 32L32 6M32 32L56 20M32 32L54 48M32 32L32 58M32 32L10 48M32 32L8 20" stroke="#ffd400"/><path d="M32 32L46 8M32 32L60 34M32 32L44 56M32 32L20 56M32 32L4 34M32 32L18 8" stroke="#e8102e"/></g><circle cx="32" cy="32" r="5" fill="#fff"/></svg>',
    tree: '<svg viewBox="0 0 64 64" class="mg-art mg-twinkle"><path d="M32 4l8 14h-4l10 14h-5l11 16H12l11-16h-5l10-14h-4z" fill="#1a7a2a" stroke="#0a3a10" stroke-width="2"/><rect x="28" y="48" width="8" height="10" fill="#7a4a1a"/><circle cx="26" cy="26" r="3" fill="#e8102e"/><circle cx="38" cy="36" r="3" fill="#ffd400"/><circle cx="24" cy="42" r="3" fill="#2a7ad8"/><path d="M32 0l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#ffd400"/></svg>',
    sun: '<svg viewBox="0 0 64 64" class="mg-art mg-spin"><g stroke="#ff8c00" stroke-width="4" stroke-linecap="round"><path d="M32 2v10M32 52v10M2 32h10M52 32h10M10 10l7 7M47 47l7 7M10 54l7-7M47 17l7-7"/></g><circle cx="32" cy="32" r="14" fill="#ffd400" stroke="#ff8c00" stroke-width="2"/></svg>',
    eclipse: '<svg viewBox="0 0 64 64" class="mg-art"><circle cx="32" cy="32" r="26" fill="#ffe680" opacity=".5"/><circle cx="32" cy="32" r="18" fill="#ffd400"/><circle cx="32" cy="32" r="18" fill="#101030" class="mg-moon"/></svg>',
    pancake: '<svg viewBox="0 0 64 64" class="mg-art mg-flip"><ellipse cx="32" cy="40" rx="26" ry="9" fill="#e0a040" stroke="#7a4a00" stroke-width="2"/><ellipse cx="32" cy="36" rx="24" ry="8" fill="#f2c060" stroke="#7a4a00" stroke-width="2"/><path d="M24 34c4 2 12 2 16 0" stroke="#fff" stroke-width="3" fill="none"/><ellipse cx="38" cy="33" rx="6" ry="2" fill="#ffe680"/></svg>',
    flower: '<svg viewBox="0 0 64 64" class="mg-art mg-wob"><path d="M32 34v26" stroke="#1a7a2a" stroke-width="4"/><path d="M32 50c-8-2-12-8-12-8s8 0 12 6" fill="#2a9a3a"/><g fill="#ff6ab0" stroke="#a0306a"><circle cx="32" cy="14" r="8"/><circle cx="44" cy="24" r="8"/><circle cx="20" cy="24" r="8"/><circle cx="26" cy="36" r="8"/><circle cx="38" cy="36" r="8"/></g><circle cx="32" cy="26" r="6" fill="#ffd400" stroke="#7a5a00"/></svg>',
    squig: '<svg viewBox="0 0 64 64" class="mg-art mg-bounce"><defs><radialGradient id="mgBlob" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#b0eaff"/><stop offset=".45" stop-color="#3aa0f0"/><stop offset="1" stop-color="#1450a8"/></radialGradient></defs><ellipse cx="22" cy="59" rx="7" ry="3.5" fill="#1a68c8" stroke="#0a2a6a" stroke-width="1.5"/><ellipse cx="42" cy="59" rx="7" ry="3.5" fill="#1a68c8" stroke="#0a2a6a" stroke-width="1.5"/><circle cx="14" cy="17" r="7" fill="#2a80d8" stroke="#0a2a6a" stroke-width="1.5"/><circle cx="50" cy="17" r="7" fill="#2a80d8" stroke="#0a2a6a" stroke-width="1.5"/><circle cx="14" cy="17" r="3.2" fill="#ffb0c8"/><circle cx="50" cy="17" r="3.2" fill="#ffb0c8"/><ellipse cx="32" cy="36" rx="25" ry="21" fill="url(#mgBlob)" stroke="#0a2a6a" stroke-width="2"/><ellipse cx="21" cy="23" rx="5" ry="2.6" fill="#fff" opacity=".8" transform="rotate(-30 21 23)"/><ellipse cx="25" cy="32" rx="5.5" ry="6.5" fill="#fff" stroke="#000" stroke-width="1.2"/><ellipse cx="39" cy="32" rx="5.5" ry="6.5" fill="#fff" stroke="#000" stroke-width="1.2"/><circle cx="26.5" cy="33.5" r="2.8"/><circle cx="40.5" cy="33.5" r="2.8"/><circle cx="25.6" cy="32" r="1" fill="#fff"/><circle cx="39.6" cy="32" r="1" fill="#fff"/><ellipse cx="15" cy="41" rx="3.5" ry="2.2" fill="#ff5a8c" opacity=".6"/><ellipse cx="49" cy="41" rx="3.5" ry="2.2" fill="#ff5a8c" opacity=".6"/><path d="M25 42q7 10 14 0q-7 2.5-14 0z" fill="#5a0a20" stroke="#0a2a6a"/><ellipse cx="32" cy="46" rx="3.2" ry="1.6" fill="#ff6a8a"/></svg>',
    rocket: '<svg viewBox="0 0 64 64" class="mg-art mg-launch"><path d="M32 4c10 8 12 22 10 36H22C20 26 22 12 32 4z" fill="#eee" stroke="#444" stroke-width="2"/><circle cx="32" cy="22" r="5" fill="#2a7ad8" stroke="#444"/><path d="M22 34l-8 12h8zM42 34l8 12h-8z" fill="#e8102e" stroke="#600"/><path d="M26 42l6 16 6-16z" fill="#ff8c00"/></svg>',
    snow: '<svg viewBox="0 0 64 64" class="mg-art mg-wob"><circle cx="32" cy="44" r="16" fill="#fff" stroke="#6a8aa0" stroke-width="2"/><circle cx="32" cy="20" r="11" fill="#fff" stroke="#6a8aa0" stroke-width="2"/><circle cx="28" cy="18" r="1.6"/><circle cx="36" cy="18" r="1.6"/><path d="M32 21l8 2-8 1z" fill="#ff8c00"/><path d="M22 28h20l-2 4H24z" fill="#e8102e"/><rect x="24" y="2" width="16" height="8" fill="#222"/><rect x="20" y="9" width="24" height="3" fill="#222"/></svg>',
  };
  const TUNES = { heart: [72, 76, 79, 84, 79, 76, 72], egg: [67, 72, 74, 76, 74, 72], pumpkin: [57, 60, 63, 62, 60, 57, 56, 57], firework: [60, 64, 67, 72, 76, 79, 84], tree: [76, 76, 76, 72, 74, 76, 79, 72], sun: [72, 74, 76, 79, 76, 74, 72], eclipse: [60, 63, 67, 70, 67, 63, 60], pancake: [67, 67, 72, 67, 64, 67], flower: [72, 71, 72, 76, 74, 72], squig: [48, 55, 48, 55, 60, 55, 48], rocket: [48, 52, 55, 60, 64, 67, 72, 76, 79, 84], snow: [79, 76, 72, 76, 79, 79, 79] };
  function playTune(art) {
    const t = TUNES[art] || TUNES.squig; if (!window.Sound || !Sound.note) return;
    t.forEach((n, i) => setTimeout(() => Sound.note(440 * Math.pow(2, (n - 69) / 12), 0.2, 'square'), i * 190));
  }
  function registerCard(m) {
    const cd = m.card; if (!cd || CARDS[cd.code]) return;
    CARDS[cd.code] = cd;
    GZ.pages['/pickup/' + cd.code + '.html'] = { title: 'Your e-card from ' + cd.from, path: '/pickup/' + cd.code + '.html', html: () => cardPage(cd) };
  }
  function cardPage(cd) {
    secret('mail.ecard');
    return `<div class="mg-site mg-gz"><div class="mg-gzbar"><b>Greetz-o-Matic!</b> <span>free e-cards since 1998</span></div>
      <div class="mg-card mg-c-${esc(cd.art)}"><div class="mg-cin"><div class="mg-c-art">${CARDART[cd.art] || CARDART.squig}</div><h1>${esc(cd.title)}</h1><p class="mg-cmsg">${esc(cd.msg).replace(/\n/g, '<br>')}</p><p class="mg-cfrom">love from <b>${esc(cd.from)}</b></p></div></div>
      <div class="mg-crow"><button type="button" class="mg-btn" data-mgtune="${esc(cd.art)}">&#9835; Play the tune</button> <button type="button" class="mg-btn" data-mgback="${esc(cd.code)}">Send ${esc(cd.from.split(' ')[0])} a reply</button></div>
      <p class="mg-small">This card will be kept for 30 days. Card number ${esc(cd.code)}. Greetz-o-Matic is FREE because of the adverts (we haven't got any adverts yet).<br>Want to send your own? Our sending machine is having a lie down. Try <a href="http://www.ecardz.kidz/">www.ecardz.kidz</a>!</p></div>`;
  }
  GZ.pages['/'] = { title: 'Greetz-o-Matic! Free e-cards', html: () => `<div class="mg-site mg-gz"><div class="mg-gzbar"><b>Greetz-o-Matic!</b> <span>free e-cards since 1998</span></div><h1 class="mg-gzh">Greetz-o-Matic!</h1><p>The Internet's <blink>NUMBER ONE</blink> e-card site (in this street).</p><div class="mg-gzgrid">${Object.keys(CARDART).map(k => `<div class="mg-gzt mg-c-${k}">${CARDART[k]}</div>`).join('')}</div><p>Got a card? Click the link in your e-mail to pick it up. You have <b>${Object.keys(CARDS).length}</b> card(s) waiting in our system for this computer.</p><p>Want to send one? Our sending machine is having a lie down. Try <a href="http://www.ecardz.kidz/">www.ecardz.kidz</a>!</p></div>` };

  const HOAX = {};
  G.hoax = (id, o) => { HOAX[id] = window.Cast ? Cast.deep(o) : o; };
  const HW = { title: 'HoaxWatch - is that virus warning real?', pages: {} };
  HW.pages['/'] = { title: 'HoaxWatch', html: () => { secret('mail.hoax'); return `<div class="mg-site mg-hw"><h1>&#128269; HoaxWatch</h1><p class="mg-hwsub">Got a scary "FORWARD THIS TO EVERYONE" virus warning? Check it here before you send it to your whole address book.</p><div class="mg-hwbox"><b>THE GOLDEN RULES</b><ol><li>Just <b>reading</b> an ordinary e-mail can't wipe your hard drive. Text is just text.</li><li><b>Attachments</b> are different. Programs (.EXE, .COM, .VBS, documents with macros) CAN carry real viruses. Don't open attachments you weren't expecting, even from people you know. (Remember Melissa in March?)</li><li>If a warning says "forward this to everyone you know", it's almost certainly a hoax. The hoax IS the virus: it spreads by people forwarding it!</li><li>Real warnings come from your virus checker or your Internet company, not from your Gran's friend's cousin.</li><li>If in doubt, ask a grown-up. Then ask a different grown-up, because the first one forwarded it.</li></ol></div><h2>Hoaxes going round JackNet right now</h2><ul class="mg-hwlist">${Object.keys(HOAX).map(k => `<li><a href="http://www.hoaxwatch.netz/${k}.html">"${esc(HOAX[k].name)}"</a> - <b class="mg-hwv">HOAX</b></li>`).join('')}</ul><p class="mg-small">HoaxWatch is run by volunteers who are very tired of being forwarded things.</p></div>`; } };
  function hoaxPages() { Object.keys(HOAX).forEach(k => { HW.pages['/' + k + '.html'] = { title: 'HoaxWatch: ' + HOAX[k].name, html: () => { secret('mail.hoax'); const h = HOAX[k]; return `<div class="mg-site mg-hw"><h1>&#128269; HoaxWatch</h1><div class="mg-hwstamp">HOAX</div><h2>"${esc(h.name)}"</h2><p><b>What it says:</b> ${esc(h.claim)}</p><p><b>The truth:</b> ${esc(h.truth)}</p><p><b>What to do:</b> Nothing! Delete it. Don't forward it. If you want, reply to the person who sent it with a link to this page (nicely).</p><p><a href="http://www.hoaxwatch.netz/">&lt;&lt; All hoaxes</a></p></div>`; } }; }); }

  const UNSUB = {}; // list id -> {name, page(seen) => html}
  G.unsub = (id, o) => { UNSUB[id] = o; };
  const UO = { title: 'The Unsubscribe-o-Matic', pages: {} };
  UO.pages['/'] = { title: 'The Unsubscribe-o-Matic', html: () => `<div class="mg-site mg-uo"><h1>The Unsubscribe-o-Matic&trade;</h1><p>Removing you from mailing lists since 1997*</p><p>We look after the mailing lists of: ${Object.values(UNSUB).map(u => esc(u.name)).join(', ')}.</p><p class="mg-small">*Nobody has ever actually been removed. We're working on it.</p></div>` };
  function unsubPages() {
    Object.keys(UNSUB).forEach(k => {
      UO.pages['/u/' + k + '.html'] = { title: 'Unsubscribe: ' + UNSUB[k].name, path: '/u/' + k + '.html', html: () => {
        const g = ms ? st() : { unsub: {} }; g.unsub[k] = (g.unsub[k] || 0) + 1; if (X) X.save();
        secret('mail.unsub'); if (Object.keys(g.unsub).length >= 5) secret('mail.unsub5');
        return `<div class="mg-site mg-uo"><div class="mg-uobar">The Unsubscribe-o-Matic&trade; &middot; ${esc(UNSUB[k].name)}</div><div class="mg-uobody">${UNSUB[k].page(g.unsub[k], whoNow() || { name: 'you' })}</div><p class="mg-small">Your address: ${esc((whoNow() || {}).addr || 'unknown')}. Attempts to unsubscribe from this list: ${g.unsub[k]}. Lists you're still on: all of them.</p></div>`;
      } };
    });
  }
  const RM = { title: 'REMOVE ME NOW!!!', pages: { '/': { title: 'REMOVE ME NOW!!!', html: () => removeMe() }, '/remove.html': { title: 'REMOVE ME NOW!!! - SUCCESS!!!', html: () => removeMe() } } };
  function removeMe() {
    secret('mail.spamclick');
    const w = whoNow() || { addr: 'you@jacknet.jnet' };
    return `<div class="mg-site mg-rm"><h1>THANK YOU!!!</h1><p class="mg-rmbig">Your address <b>${esc(w.addr)}</b> has been <b>CONFIRMED AS A REAL PERSON WHO READS E-MAIL</b>!!!</p><p>It has been added to our <b>PREMIUM LIST</b> and sold to 4,000 other companies! Expect lots more e-mail!!! :-)</p><div class="mg-rmlesson"><b>WHAT JUST HAPPENED? (a note from the JackNet Mail Team)</b><br>When you click "remove me" in a junk e-mail, the spammer finds out your address is real and that someone reads it. That makes it MORE valuable to them, not less. Real companies you signed up to will let you unsubscribe properly. Junk from strangers: <b>don't click anything, just delete it</b>. (Don't worry: this page is pretend. Nobody got your address. This time.)</div></div>`;
  }

  document.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('[data-mgtune],[data-mgback],[data-mguo],[data-mgdodge]'); if (!t) return;
    if (t.dataset.mgdodge != null) { ev.preventDefault(); dodge(t); return; }
    if (t.dataset.mgtune) { playTune(t.dataset.mgtune); return; }
    if (t.dataset.mgback) { const cd = CARDS[t.dataset.mgback]; if (cd && X) X.compose({ to: cd.fromAddr || '', subj: 'Thanks for the card!', body: `Hi ${cd.from.split(' ')[0]},\n\nThank you for the e-card!\n\n` }); return; }
    if (t.dataset.mguo) { const u = UNSUB[t.dataset.mguo]; if (u && u.click) u.click(t, ev); }
  });
  document.addEventListener('pointerover', ev => { const t = ev.target.closest && ev.target.closest('[data-mgdodge]'); if (t && !matchMedia('(hover:none)').matches) dodge(t); });
  function dodge(t) { const n = +(t.dataset.n || 0) + 1; t.dataset.n = n; t.style.position = 'relative'; t.style.left = ((n * 73) % 160 - 80) + 'px'; t.style.top = ((n * 37) % 60 - 30) + 'px'; if (n >= 6) { t.textContent = 'Yes, unsubscribe me'; t.removeAttribute('data-mgdodge'); t.style.left = t.style.top = '0'; } }
  G.dodge = dodge;

  // ================================================================ the look (injected once: the e-card / HoaxWatch / Unsubscribe pages, the Inbox Assistant, ASCII mail)
  function css() {
    if (document.getElementById('mg-css')) return;
    const s = document.createElement('style'); s.id = 'mg-css';
    s.textContent = `
.oe-body.oe-mono{font:12px/1.3 "Courier New",Courier,monospace}
.oe-body.oe-pre{white-space:pre;overflow-x:auto;overflow-wrap:normal}
.mg-ia{font:11px var(--ui,Tahoma,sans-serif);display:grid;gap:8px}
.mg-ia-top{display:flex;gap:10px;align-items:center}
.mg-ia-rad{display:flex;gap:6px;align-items:flex-start;padding:3px 0;line-height:1.35}
.mg-ia-rad input{margin-top:1px;flex:none}
.mg-ia-rules{min-height:64px;max-height:132px;overflow:auto;padding:3px}
.mg-ia-rule{display:flex;gap:6px;align-items:center;padding:2px 0}
.mg-ia-rule span{flex:1;min-width:0}
.mg-ia-rule .mg-ia-x{min-width:24px;padding:0 6px;min-height:20px}
.mg-ia-none{color:#555;padding:6px}
.mg-ia-btns{margin-top:6px;flex-wrap:wrap;gap:6px}
.mg-site{font:14px/1.5 "Times New Roman",serif;padding:14px;max-width:760px;margin:0 auto;color:#000}
.mg-small{font:11px/1.4 Arial,sans-serif;color:#555;margin-top:14px}
.mg-btn{font:bold 13px Arial,sans-serif;padding:6px 12px;border:2px outset #fff;background:#ffd400;cursor:pointer;min-height:32px}
.mg-btn:active{border-style:inset}
.mg-gz{background:repeating-linear-gradient(45deg,#fff0f8 0 18px,#fff8e0 18px 36px)}
.mg-gzbar{background:#c0207a;color:#fff;padding:4px 10px;font:12px Arial,sans-serif;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.mg-gzbar b{font:bold 16px "Comic Sans MS","Comic Sans",cursive}
.mg-gzh{font:bold 34px "Comic Sans MS","Comic Sans",cursive;color:#c0207a;text-shadow:2px 2px 0 #ffd400;margin:12px 0 4px}
.mg-gzgrid{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.mg-gzt{width:56px;height:56px;border:2px solid #000;background:#fff;display:grid;place-items:center}
.mg-gzt .mg-art{width:44px;height:44px}
.mg-card{margin:18px auto;max-width:420px;padding:10px;background:#fff;border:3px solid #000;box-shadow:6px 6px 0 rgba(0,0,0,.35)}
.mg-cin{border:3px dashed #c0207a;padding:16px 14px;text-align:center}
.mg-c-art .mg-art{width:120px;height:120px}
.mg-card h1{font:bold 26px "Comic Sans MS","Comic Sans",cursive;color:#c0207a;margin:8px 0;overflow-wrap:anywhere}
.mg-cmsg{font:16px/1.5 "Comic Sans MS","Comic Sans",cursive;white-space:normal;overflow-wrap:anywhere}
.mg-cfrom{font:14px Arial,sans-serif}
.mg-crow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.mg-c-tree .mg-cin,.mg-c-snow .mg-cin{border-color:#1a7a2a}.mg-c-tree h1,.mg-c-snow h1{color:#b01020}
.mg-c-pumpkin{background:#201028}.mg-c-pumpkin .mg-cin{border-color:#ff8c00;color:#ffe680}.mg-c-pumpkin h1{color:#ff8c00}.mg-c-pumpkin .mg-cfrom{color:#fff}
.mg-c-firework,.mg-c-rocket,.mg-c-eclipse{background:#101040}.mg-c-firework .mg-cin,.mg-c-rocket .mg-cin,.mg-c-eclipse .mg-cin{border-color:#ffd400;color:#fff}.mg-c-firework h1,.mg-c-rocket h1,.mg-c-eclipse h1{color:#ffd400}
.mg-gzt.mg-c-pumpkin,.mg-gzt.mg-c-firework,.mg-gzt.mg-c-rocket,.mg-gzt.mg-c-eclipse{background:#101040}
.mg-beat{animation:mgBeat 1s infinite}.mg-wob{animation:mgWob 1.6s ease-in-out infinite}.mg-spin{animation:mgSpin 6s linear infinite}.mg-bounce{animation:mgBounce .8s ease-in-out infinite alternate}
.mg-twinkle circle{animation:mgTw 1.2s steps(2) infinite}.mg-twinkle circle:nth-child(odd){animation-delay:.6s}
.mg-flip{animation:mgFlip 1.4s ease-in-out infinite}.mg-launch{animation:mgLaunch 2.4s ease-in infinite}.mg-moon{animation:mgMoon 6s ease-in-out infinite alternate}
@keyframes mgBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}
@keyframes mgWob{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes mgSpin{to{transform:rotate(360deg)}}
@keyframes mgBounce{from{transform:translateY(0)}to{transform:translateY(-14px)}}
@keyframes mgTw{50%{opacity:.2}}
@keyframes mgFlip{0%,100%{transform:translateY(0) rotateX(0)}50%{transform:translateY(-22px) rotateX(180deg)}}
@keyframes mgLaunch{0%{transform:translateY(10px)}70%{transform:translateY(-6px)}100%{transform:translateY(-60px);opacity:0}}
@keyframes mgMoon{from{transform:translateX(-30px)}to{transform:translateX(0)}}
@media (prefers-reduced-motion:reduce){.mg-art,.mg-art *{animation:none!important}}
.mg-hw{font-family:Verdana,Arial,sans-serif;font-size:13px;background:#f4f8ff;position:relative}
.mg-hw h1{color:#003a8a;margin:0 0 4px;font-size:26px}.mg-hwsub{color:#333}
.mg-hwbox{border:2px solid #003a8a;background:#fff;padding:8px 12px;margin:10px 0}.mg-hwbox ol{margin:6px 0 0 18px;padding:0}
.mg-hwbox li{margin:4px 0}.mg-hwv{color:#c00}
.mg-hwstamp{position:absolute;right:14px;top:14px;border:4px solid #c00;color:#c00;font:bold 26px Impact,Arial Black,sans-serif;padding:0 10px;transform:rotate(12deg);opacity:.85}
.mg-uo{font-family:Arial,sans-serif;font-size:13px;background:#eee}
.mg-uobar{background:#404040;color:#fff;padding:5px 10px;font-weight:bold}
.mg-uobody{background:#fff;border:1px solid #888;padding:14px;min-height:120px;overflow-wrap:anywhere}
.mg-uobody h2{margin:0 0 8px;font-size:18px}
.mg-uoprog{height:18px;border:2px inset #fff;background:#fff;margin:10px 0;position:relative}.mg-uoprog i{position:absolute;inset:0 auto 0 0;background:#000080;animation:mgUo 5s ease-out forwards}
@keyframes mgUo{from{width:0}to{width:99%}}
.mg-rm{background:#ffff00;font-family:Arial Black,Arial,sans-serif}.mg-rm h1{color:#f00;font-size:40px;margin:0}.mg-rmbig{font-size:16px}
.mg-rmlesson{font:13px/1.5 Arial,sans-serif;background:#fff;border:3px solid #000080;padding:10px;margin-top:16px}
@media (max-width:600px){.mg-site{padding:10px}.mg-c-art .mg-art{width:96px;height:96px}.mg-card h1{font-size:22px}.mg-hwstamp{font-size:18px;right:8px;top:8px}.mg-gzh{font-size:26px}}
`;
    document.head.appendChild(s);
  }

  // ================================================================ start-up (called from apps-files.js once the templates are in)
  G.attach = function (api) {
    X = api; ms = api.ms;
    css();
    hoaxPages(); unsubPages();
    if (window.IE && IE.addSite) { IE.addSite('www.greetzomatic.kidz', GZ); IE.addSite('www.hoaxwatch.netz', HW); IE.addSite('www.unsubomatic.netz', UO); IE.addSite('www.remove-me-now.w3b', RM); }
    (G.contacts || []).forEach(c => { if (!api.contacts.some(x => x[1] === c[1])) api.contacts.push(c); });
    G.ready = true;
    const re = () => { cacheSig = ''; identity(); X.changed(); tray(); };
    if (window.Net && Net.on) ['welcome', 'loginOk', 'you'].forEach(t => Net.on(t, () => setTimeout(() => { const g = ms.gen || {}; const w = whoNow(); const changed = w && g.who && g.who !== w.key; re(); if (changed) { st().day = ''; } }, 300)));
    identity(); X.changed();
    setInterval(tick, 15000);
    setTimeout(tick, 2500);
  };
  G.PLAT = PLAT; G.pick = pick; G.between = between;
  G.debug = { ms: () => ms, tick: () => tick(), next: () => { const w = waiting(); if (w.length) arrive(w[0]); return w.length; }, due: () => { st().pend.forEach(p => { p.at = 0; }); tick(); } };
})();

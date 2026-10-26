/* ch-core: MOM'S JOBS, the engine (loaded by js/ch.js once the house is built). Each part of the house adds its jobs with
 * ChoreKit.add({ id, room, build(r), reset(), take(), ... }) (js/ch-bed.js, js/ch-kitchen.js, js/ch-lounge.js, js/ch-out.js).
 * A job is a handful of steps (js/ch-cat.js lists them); each one is done with your hands in the room (pick things up and
 * put them where they go, pull the duvet straight, scrub a plate...). The steps go to the server as they happen (mods/ch.js
 * checks the timing and pays when the last one lands); guests do the jobs too, but only members get paid.
 *   ChoreKit.step(id, s, oops)   a step is done (true if it's new)        ChoreKit.has(id, s) / done(id) / started(id)
 *   ChoreKit.begin(id)           the job has started (the clock starts)  ChoreKit.onList(id) / list()
 *   ChoreKit.thing(id, def)      a thing you pick up (Room.grabbable; its place is kept for the day)
 *   ChoreKit.snap(id, def)       where a thing goes (Room.addSnap)       ChoreKit.spot(r, id, obj, def) a thing you click
 *   ChoreKit.fx.burst(r, x, y, z, o)  bubbles, drips, dust, crumbs      ChoreKit.snd.*  little sounds
 *   ChoreKit.mom(text) / jack(title, text)   Mom shouting, Jack's thoughts
 *   ChoreKit.paper(r, x, y, z, ry, o)   Mom's list as a real sheet of paper (click it to read it up close)
 *   ChoreKit.tool                 a thing in your hands that isn't put down (the hoover, the mower, a sponge)
 * State: Apps.saveGame('ch') { day, prog:{id:{s:1}}, done:{id:{sc,amt}}, oops, at:{thing:[...]}, v:{...}, ever:{id:1} } */
(function () {
  'use strict';
  const H = window.House, R = window.Room, CC = window.ChoreCat;
  if (!H || !H.ok || !R || !CC || window.ChoreKit) return;
  const T = H.T, K = H.K, A = window.HouseArt, M = K.mat, D2R = Math.PI / 180;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const touchy = () => !!(window.matchMedia && (matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches));
  const member = () => !!(window.Net && Net.me && Net.me.member);
  const send = m => { try { if (window.Net) Net.send(m); } catch (e) {} };
  const secret = id => { try { R._.secret(id); } catch (e) {} };

  // ================================================================ the day (the UK day: the same as the server's)
  const FMT = (() => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { return null; } })();
  function localDay() { const d = new Date(); if (!FMT) return d.toISOString().slice(0, 10); const p = {}; for (const x of FMT.formatToParts(d)) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}`; }
  const srv = { day: '', list: null, member: false, done: {}, prog: {} };
  const day = () => (srv.day && srv.day >= localDay() ? srv.day : localDay());

  // ================================================================ state (saved like a game: a refresh never loses a job half done)
  const load = () => { try { return (window.Apps && Apps.loadGame && Apps.loadGame('ch', 1)) || JSON.parse(localStorage.getItem('jhp_ch') || 'null') || {}; } catch (e) { return {}; } };
  let S = load();
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 400); }
  function saveNow() { clearTimeout(saveT); try { if (window.Apps && Apps.saveGame) Apps.saveGame('ch', S, { v: 1 }); else localStorage.setItem('jhp_ch', JSON.stringify(S)); } catch (e) {} }
  addEventListener('pagehide', saveNow);
  function fresh(d) { const ever = S.ever || {}, seen = S.seen || {}, said = S.said || {}; S = { day: d, prog: {}, done: {}, oops: {}, at: {}, v: {}, t0: {}, ever, seen, said }; }
  if (S.day !== day()) fresh(day());
  for (const k of ['prog', 'done', 'oops', 'at', 'v', 't0', 'ever', 'seen', 'said']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};

  // ================================================================ the jobs (each part of the house adds its own)
  const MODS = {}, ORDER = [];
  const EVS = {}; const emit = (ev, ...a) => (EVS[ev] || []).slice().forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });
  function add(def) { MODS[def.id] = def; ORDER.push(def.id); if (H.ROOMS[def.room] && H.ROOMS[def.room].built) build(def); }
  function build(def) {
    if (def._built) return; const r = H.ROOMS[def.room]; if (!r || !r.built) return;
    def._built = true;
    try { def.build(r); if (def.sync) def.sync(); } catch (e) { console.error('chores build', def.id, e); }
    for (const rid in def.also || {}) whenBuilt(rid, rr => { try { def.also[rid](rr); } catch (e) { console.error('chores also', def.id, rid, e); } });
    refresh();
  }
  const waiting = [];
  function whenBuilt(rid, fn) { const r = H.ROOMS[rid]; if (r && r.built) fn(r); else waiting.push([rid, fn]); }
  H.on('built', rid => { for (let i = waiting.length - 1; i >= 0; i--) if (waiting[i][0] === rid) { const [, fn] = waiting.splice(i, 1)[0]; fn(H.ROOMS[rid]); } for (const id of ORDER) if (MODS[id].room === rid) build(MODS[id]); });
  function built(rid) { for (const id of ORDER) if (MODS[id].room === rid) build(MODS[id]); }

  const stepsOf = id => CC.steps(id, day(), localStorage.getItem('jhp_starter')==='1');
  const has = (id, s) => !!(S.prog[id] && S.prog[id][s]);
  const done = id => !!S.done[id];
  const started = id => !!(S.prog[id] && Object.keys(S.prog[id]).length) || !!S.t0[id];
  const count = id => S.prog[id] ? Object.keys(S.prog[id]).length : 0;
  const list = () => (srv.list && srv.day === day() ? srv.list : CC.listFor(day())).filter(id => CC.CHORE[id] && CC.AREAS[CC.CHORE[id].area]);
  const onList = id => list().includes(id);
  const avail = id => !!(CC.CHORE[id] && CC.AREAS[CC.CHORE[id].area] && MODS[id]);

  // ---- the clock starts
  function begin(id) {
    if (done(id) || S.t0[id]) { chip(id); return; }
    S.t0[id] = Date.now(); save();
    if (member()) send({ t: 'chGo', c: id });
    chip(id);
    const C = CC.CHORE[id];
    if (!S.said[id]) { S.said[id] = 1; save(); const L = GRUMBLE[id] || GRUMBLE._; jack(C.n, cast(pick(L))); }
  }
  // ---- a step: kept here, sent to the server (spaced out no quicker than a person could do them)
  function step(id, s, oops) {
    if (done(id) || has(id, s)) return false;
    if (!stepsOf(id).some(x => x.s === s)) return false;
    if (!S.t0[id]) begin(id);
    (S.prog[id] = S.prog[id] || {})[s] = Date.now();
    oops = (oops | 0) + (PEND[id] | 0); PEND[id] = 0;
    if (oops) S.oops[id] = (S.oops[id] | 0) + oops;
    save();
    if (member()) queue(id, s, oops | 0);
    snd.tick();
    chip(id, true);
    refresh();
    emit('step', id, s);
    if (stepsOf(id).every(x => has(id, x.s))) setTimeout(() => complete(id), 450);
    syncAll();
    return true;
  }
  const PEND = {}; // little accidents waiting to go with the next step
  function oops(id, n) { PEND[id] = Math.min(3, (PEND[id] | 0) + (n || 1)); }
  const Q = {}; // id -> { items:[[s, o]], t, busy }
  function queue(id, s, o) {
    const q = Q[id] = Q[id] || { items: [], last: 0, busy: false };
    q.items.push([s, o]); pump(id);
  }
  function pump(id) {
    const q = Q[id]; if (!q || q.busy || !q.items.length) return;
    const [s, o] = q.items[0], g = (stepsOf(id).find(x => x.s === s) || { g: 0.5 }).g;
    const wait = Math.max(0, q.last + g * 1000 + 60 - Date.now());
    q.busy = true;
    setTimeout(() => { q.items.shift(); q.last = Date.now(); q.busy = false; send({ t: 'chStep', c: id, s, o }); pump(id); }, wait);
  }
  // ---- finished: Mom checks (the server pays members)
  const waitPay = {};
  function complete(id) {
    if (S.done[id]) return;
    const C = CC.CHORE[id];
    S.done[id] = { local: 1, t: Date.now() }; S.ever[id] = 1; save();
    snd.done(); refresh(); chip(id, true); syncAll();
    emit('done', id);
    try { const L = (window.Apps && Apps.store && Apps.store.get('jhp_grind_jobsdone', [])) || []; if (!L.includes(C.job)) { L.push(C.job); Apps.store.set('jhp_grind_jobsdone', L); } const G = window.GrindCat; if (G && Object.keys(G.JOBS).every(k => L.includes(k))) secret('grind.alljobs'); } catch (e) {}
    secret('ch.first'); secret('grind.chores');
    if (Object.keys(MODS).every(k => !avail(k) || S.ever[k])) secret('ch.every');
    const mod = MODS[id]; if (mod && mod.finished) try { mod.finished(); } catch (e) { console.error(e); }
    if (member()) {
      jack('Job done: ' + C.short, esc(cast(pick(DONE[id] || DONE._))) + '<br><small>Mom\'s having a look...</small>', 5000);
      waitPay[id] = setTimeout(() => { delete waitPay[id]; jack('Job done: ' + C.short, 'Mom says she\'ll sort my money out later. (JackNet didn\'t answer. Is the modem plugged in?)'); }, 15000);
    } else {
      jack('Job done: ' + C.short, esc(cast(pick(DONE[id] || DONE._))) + '<br><small>Mom says ta, love. (Members of JackNet get paid Rupees for every job: Start &gt; Log Off, then pick a name. It\'s free!)</small>', 9000);
      setTimeout(() => mom(cast(pick(['Ta, love!', 'Thank you, {me}!', 'Ooh, ta!', 'Good {me.lad}!']))), 1800);
      allCheck();
    }
  }
  function syncAll() { for (const k of ORDER) { const d = MODS[k]; if (d._built && d.sync) try { d.sync(); } catch (e) { console.error(e); } } }
  function allCheck() {
    const L = list(); if (!L.length || !L.every(id => S.done[id])) return;
    if (S.v._all) return; S.v._all = 1; save();
    secret('ch.all');
    setTimeout(() => mom("Have you done ALL your jobs? Who are you and what have you done with {me}?"), 3500);
  }

  // ================================================================ the server
  if (window.Net) {
    Net.on('chMe', m => {
      if (!m || !m.day) return;
      srv.day = m.day; srv.list = m.list || null; srv.member = !!m.member;
      if (S.day !== m.day) newDay(m.day);
      if (m.member) {
        for (const id in m.done || {}) if (!S.done[id] || S.done[id].local) { S.done[id] = m.done[id]; S.ever[id] = 1; }
        // steps done here that the server never heard about (done as a guest, or the line dropped): send them again
        for (const id in S.prog) {
          if (S.done[id] && !S.done[id].local) continue;
          const theirs = new Set((m.prog || {})[id] || []);
          const mine = Object.keys(S.prog[id]).sort((a, b) => S.prog[id][a] - S.prog[id][b]).filter(s => !theirs.has(s));
          if (mine.length) { if (!theirs.size) send({ t: 'chGo', c: id }); for (const s of mine) queue(id, s, 0); }
        }
        for (const id in S.done) if (S.done[id].local && !(m.done || {})[id] && !(S.prog[id] && Object.keys(S.prog[id]).length)) delete S.done[id];
      }
      save(); refresh();
      syncAll();
    });
    Net.on('chDone', m => {
      const id = m.c, C = CC.CHORE[id]; if (!C) return;
      clearTimeout(waitPay[id]); delete waitPay[id];
      S.done[id] = { sc: m.sc | 0, amt: m.amt | 0, cashPence:m.cashPence, bad: m.bad ? 1 : 0 }; S.ever[id] = 1; save(); refresh();
      if (m.bad) return jack(C.short, 'Mom says that was done suspiciously quickly, so she\'s not paying for it. Fair enough.');
      if (m.cashPence > 0) H.toast('+' + CC.money(m.cashPence), 'Mom paid you for: ' + C.n.toLowerCase() + '. Exchange your pocket money at JackNet Bank.');
      setTimeout(() => mom(cast((m.mom || 'Ta, love.') + (m.sc ? ` (${m.sc}%)` : ''))), 900);
      if (m.sc >= 100) secret('ch.gold');
      if (m.sc >= 95) secret('grind.perfect');
      if (!m.amt) setTimeout(() => jack(C.short, m.list ? 'No money for that one: that\'s all the job money the Bank of Mom pays out in one day.' : (m.want === 0 ? 'Not on Mom\'s list, and she\'s already paid me for four extra jobs today. Worth a go though.' : 'No money for that one. Mom\'s purse is empty.')), 3800);
      if (m.bonusPence > 0) setTimeout(() => { H.toast('+' + CC.money(m.bonusPence), "BONUS: every job on Mom's list done! Cash added to your pocket money."); }, 5200);
      allCheck();
      try { if (window.Grind) Net.send({ t: 'grMe' }); } catch (e) {}
    });
    const ask = () => send({ t: 'chMe' });
    Net.on('welcome', ask); Net.on('loginOk', ask); Net.on('you', ask);
    try { if (Net.me && Net.me.id) ask(); } catch (e) {}
  }
  // ---- midnight: a new day, a new list, new mess
  function newDay(d) {
    fresh(d); save();
    for (const id of ORDER) { const m = MODS[id]; if (m._built && m.reset) try { m.reset(); } catch (e) { console.error(e); } }
    refresh(); chip(null);
  }
  setInterval(() => { const d = day(); if (d !== S.day) { newDay(d); send({ t: 'chMe' }); } }, 60000);

  // ================================================================ talking: Mom (shouting from downstairs) and Jack (thinking)
  function mom(text, ms) {
    text = cast(text);
    try { if (window.HouseLife && HouseLife.voice) return HouseLife.voice('MOM', text, ms); } catch (e) {}
    H.say('MOM (shouting up the stairs)', esc(text), ms || 5000);
    const c = H.sfx.ac && H.sfx.ac(); if (c) { const n = Math.min(8, Math.ceil(text.length / 8)); for (let i = 0; i < n; i++) H.sfx.tone(190 + Math.random() * 80, 0.09, 'sawtooth', 0.012, i * 0.11, 150); }
  }
  function jack(title, html, ms) { H.say(cast(title), cast(html), ms); }
  const GRUMBLE = {
    _: ['Do I HAVE to? ...Fine.', 'Pocket money. Think of the pocket money.', 'Right. Let\'s get this over with.'],
    tidy: ['Tidy my room. It IS tidy. It\'s organised mess. There\'s a system.', 'Right. Clothes in the basket, rubbish in the bin. How hard can it be?'],
    bed: ['Why make the bed? I\'m only getting back in it tonight. (Mom does not accept this argument.)'],
    bin: ['My bin. It\'s mostly crisp packets. And something that used to be a banana.'],
    cat: [cast('{cat} isn\'t even our cat. {cat.He} just lives here. And eats here. And sleeps on my bed.')],
    plant: ['Gran gave me this plant \"to brighten the place up\". It has survived two years in a teenager\'s bedroom. Respect.'],
    washup: ['The washing up. The worst job. Every plate in the house, somehow.', 'Hot water, a squirt of Fairy Liquid, and SCRUB. Rubber gloves are for wimps.'],
    table: ['Lay the table. Four plates, four forks, four knives. I can count to four.'],
    shopping: ['The shopping. If anything is crisps, it\'s going in my room. (It is not going in my room.)'],
    bins: ['Bins. Out the front. In my slippers. Brilliant.'],
    hoover: ['The hoover. It weighs a TONNE and the cable is never long enough.'],
    videos: ['The videos. Half of these aren\'t even in the right boxes.'],
    cushions: ['Plump the cushions. What does that even MEAN, Mom?'],
    car: ['Wash Dad\'s car. On a SATURDAY. (Or whatever day it is. It feels like a Saturday job.)'],
    lawn: ['Mow the lawn. Do NOT run over the cable. Do NOT run over the gnome.'],
    sweep: ['Sweep the drive. The leaves will just fall down again. This is pointless. Fine.'],
  };
  const DONE = {
    _: ['Done! Easy.', 'Job done. Feet up.'],
    tidy: ['Room tidy! I can see the carpet! It\'s BLUE!', 'Everything in its place. Mom might faint.'],
    bed: ['Bed made. Hospital corners. Well, hospital-ish corners.', 'Bed made. Looks like a hotel. A cheap hotel. Still.'],
    bin: ['Bin emptied. My room smells 40% less of crisps.'],
    cat: [cast('{cat} is fed. {cat.He} didn\'t say thank you. Cats never do.')],
    plant: ['Plant watered. It looks happier. I think. It\'s a plant.'],
    washup: ['Washing up DONE. My hands are all wrinkly.', 'Every plate clean. Well, nearly. One is still a bit eggy.'],
    table: ['Table laid. Fancy. Like a restaurant. A restaurant with ketchup.'],
    shopping: ['Shopping away. I hid the Wagon Wheels at the back so nobody else finds them.'],
    bins: ['Bins out. The binmen come in the morning. Hopefully.'],
    hoover: ['Hoovered! The carpet has lines in it now. Lovely lines.'],
    videos: ['Videos tidy. All rewound. You\'re welcome, Dad.'],
    cushions: ['Cushions plumped. On their corners. Like diamonds. Happy now, Mom?'],
    car: ['Dad\'s car is SPARKLING. He\'ll say it\'s "streaky". It is not streaky.'],
    lawn: ['Lawn mowed. Stripes! Proper stripes!'],
    sweep: ['Drive swept. For about ten minutes, until the next leaf.'],
  };

  // ================================================================ little sounds (only with the site's SFX on)
  const sf = H.sfx;
  const snd = {
    tick() { sf.tone(880, 0.05, 'triangle', 0.05); sf.tone(1320, 0.07, 'triangle', 0.04, 0.05); },
    done() { [523, 659, 784, 1047].forEach((f, i) => sf.tone(f, 0.16, 'triangle', 0.05, i * 0.09)); },
    pop() { sf.tone(900 + Math.random() * 600, 0.04, 'sine', 0.04, 0, 1800); },
    scrub() { sf.noise(0.12, 0.05, 2600, 0, 'bandpass', 1400); sf.noise(0.1, 0.04, 1800, 0.12, 'bandpass', 2800); },
    squeak() { sf.tone(1800 + Math.random() * 500, 0.06, 'sine', 0.03, 0, 2600); },
    pour(d) { sf.noise(d || 1.2, 0.05, 900, 0, 'bandpass', 500); sf.noise(d || 1.2, 0.03, 2400, 0.1, 'lowpass', 1200); },
    splash() { sf.noise(0.35, 0.07, 1400, 0, 'lowpass', 300); },
    thud() { sf.tone(110, 0.12, 'sine', 0.08, 0, 60); sf.noise(0.08, 0.05, 400); },
    whoosh() { sf.noise(0.35, 0.06, 400, 0, 'bandpass', 2400); },
    rustle() { sf.noise(0.25, 0.05, 3000, 0, 'highpass', 5000); },
    clink() { sf.tone(2400, 0.08, 'sine', 0.04); sf.tone(3100, 0.1, 'sine', 0.03, 0.03); },
    crunch() { for (let i = 0; i < 3; i++) sf.noise(0.05, 0.05, 2200, i * 0.09, 'bandpass', 1200); },
    purr() { for (let i = 0; i < 8; i++) sf.tone(28 + (i % 2) * 4, 0.22, 'sawtooth', 0.04, i * 0.24); },
    bag() { sf.noise(0.3, 0.06, 1800, 0, 'highpass', 600); sf.tone(140, 0.08, 'sine', 0.05, 0.25); },
  };

  // ================================================================ particles: bubbles, drips, dust, crumbs (soft round points)
  const dotTex = K.tex('ch.dot', 64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { clamp: true });
  const bubTex = K.tex('ch.bub', 64, 64, (g) => { g.clearRect(0, 0, 64, 64); const gr = g.createRadialGradient(32, 32, 18, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,.15)'); gr.addColorStop(0.8, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(24, 22, 6, 4, -0.6, 0, 7); g.fill(); g.fillStyle = 'rgba(200,160,255,.35)'; g.beginPath(); g.arc(40, 42, 8, 0, 7); g.fill(); }, { clamp: true });
  let fxN = 0;
  const fx = {
    // o: { n, col, size, life (s), spd, up, spread, grav, tex: 'dot'|'bub', to: [x,y,z] (they fly there), fade }
    burst(r, x, y, z, o) {
      o = o || {}; if (!r || !r.group) return;
      const n = o.n || 16, pos = new Float32Array(n * 3), vel = [];
      for (let i = 0; i < n; i++) {
        pos[i * 3] = x + (Math.random() - 0.5) * (o.spread || 4); pos[i * 3 + 1] = y + (Math.random() - 0.5) * (o.spreadY || 2); pos[i * 3 + 2] = z + (Math.random() - 0.5) * (o.spread || 4);
        const a = Math.random() * Math.PI * 2, s = (o.spd || 30) * (0.4 + Math.random() * 0.8);
        vel.push([Math.cos(a) * s * (o.flat == null ? 1 : o.flat), -(o.up || 30) * (0.5 + Math.random()), Math.sin(a) * s * (o.flat == null ? 1 : o.flat)]);
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ size: o.size || 1.6, map: o.tex === 'bub' ? bubTex : dotTex, color: new T.Color(o.col || '#ffffff'), transparent: true, depthWrite: false, opacity: o.op || 1, sizeAttenuation: true });
      const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4; r.group.add(pts);
      const t0 = performance.now(), life = (o.life || 0.9) * 1000, key = 'ch.fx' + (fxN++);
      H.anims.set(key, now => {
        const k = (now - t0) / life, dt = 1 / 60;
        if (k >= 1 || !r.group.visible) { r.group.remove(pts); geo.dispose(); mat.dispose(); return false; }
        for (let i = 0; i < n; i++) {
          const v = vel[i];
          if (o.to) { const e = ease(Math.min(1, k * 1.3)); pos[i * 3] += (o.to[0] - pos[i * 3]) * e * 0.12; pos[i * 3 + 1] += (o.to[1] - pos[i * 3 + 1]) * e * 0.12; pos[i * 3 + 2] += (o.to[2] - pos[i * 3 + 2]) * e * 0.12; }
          else { v[1] += (o.grav == null ? 120 : o.grav) * dt; v[0] *= o.drag || 0.97; v[2] *= o.drag || 0.97; pos[i * 3] += v[0] * dt; pos[i * 3 + 1] += v[1] * dt; pos[i * 3 + 2] += v[2] * dt; if (o.floor != null && pos[i * 3 + 1] > o.floor) { pos[i * 3 + 1] = o.floor; v[1] *= -0.25; v[0] *= 0.6; v[2] *= 0.6; } }
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = (o.op || 1) * (o.fade === false ? 1 : 1 - Math.pow(k, 2.2));
        if (o.grow) mat.size = (o.size || 1.6) * (1 + k * o.grow);
        return true;
      });
      H.dirty();
    },
    // a stream (water from a watering can, a tap): call each frame you want it running
    stream(r, from, to, o) { o = o || {}; this.burst(r, from[0], from[1], from[2], { n: o.n || 4, col: o.col || '#a8d0ff', size: o.size || 1.1, life: 0.35, spd: 6, up: -10, grav: 900, spread: 1, spreadY: 0.5, floor: to[1], op: 0.85, fade: false }); },
  };

  // ================================================================ building helpers
  function spot(r, id, obj, def) {
    if (obj && !obj.parent) r.group.add(obj);
    H.spot(id, Object.assign({ obj, room: r.id, range: 240 }, def || {}));
    H.dirty();
    return H.SPOTS[id];
  }
  const PICK = new T.MeshBasicMaterial({ visible: false });
  function pickBox(r, id, x, y, z, w, h, d, ry, def) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), PICK); m.position.set(x, y, z); m.rotation.y = (ry || 0) * D2R; r.group.add(m); return spot(r, id, m, Object.assign({ label: id }, def || {})); }
  // things you carry: their place is ours to keep (it's today's mess), not the house's
  const MINE = {};
  function thing(id, def) {
    const t = R.grabbable(id, Object.assign({ noSave: true }, def));
    if (!t) return null;
    t.noSave = true; MINE[id] = t;
    const a = S.at[id];
    if (a && H.ROOMS[a[0]]) { t.at = { room: a[0], x: a[1], y: a[2], z: a[3], ry: a[4], hide: !!a[5] }; t.st = 'rest'; const rr = H.ROOMS[a[0]]; if (t.obj.parent !== rr.things) rr.things.add(t.obj); H.place(t); H.layerFor(t); }
    return t;
  }
  function keep(id) { const t = MINE[id]; if (!t) return; const a = t.at; S.at[id] = [a.room, +a.x.toFixed(1), +a.y.toFixed(1), +a.z.toFixed(1), Math.round(a.ry || 0), a.hide ? 1 : 0]; save(); }
  function home(id, how) { // put a thing back where it started (a new day), or hide it
    const t = MINE[id]; if (!t) return;
    t.st = 'rest'; t.snap = null; t.at = Object.assign({}, t.home, how || {}); const rr = H.ROOMS[t.at.room]; if (rr && t.obj.parent !== rr.things) rr.things.add(t.obj);
    H.place(t); H.layerFor(t); delete S.at[id]; save();
  }
  function hideThing(id) { const t = MINE[id]; if (!t) return; t.at.hide = true; t.obj.visible = false; keep(id); H.dirty(); }
  function lock(id, on) { const t = MINE[id]; if (!t) return; t.canGrab = on === false ? null : () => false; const s = H.SPOTS[id]; if (s) s.off = on !== false; }
  H.on('rest', id => { if (MINE[id]) keep(id); });
  H.on('grab', id => { const t = MINE[id]; if (t && t.chore && !done(t.chore)) begin(t.chore); });
  H.on('snap', (sid, id) => { if (MINE[id]) keep(id); });
  // carrying something out of the room: it comes with you (it lives in the room you're in now)
  H.on('room', rid => { const h = H.held(); if (!h || !H.THINGS[h] || !H.ROOMS[rid]) return; const t = H.THINGS[h]; if (t.obj.parent !== H.ROOMS[rid].things) H.ROOMS[rid].things.add(t.obj); });
  function snap(id, def) { return R.addSnap(id, def); }
  // a spot of the house's that a job takes over: our act runs first (and falls back to the house's own when it isn't a job
  // click). The house's js/hs-life.js used to run simple chores off some of these: ours are the real ones now, so we keep
  // our act in place even if something wraps it later.
  const GUARD = {};
  const GPEND = {};
  function guard(id, fn) {
    const s = H.SPOTS[id]; if (!s) { GPEND[id] = fn; return false; }
    delete GPEND[id];
    const orig = GUARD[id] ? GUARD[id].orig : s.act;
    const mine = (...a) => { if (fn(...a)) return; if (orig) orig(...a); };
    GUARD[id] = { orig, mine }; s.act = mine; return true;
  }
  setInterval(() => { for (const id in GPEND) guard(id, GPEND[id]); for (const id in GUARD) { const s = H.SPOTS[id]; if (s && s.act !== GUARD[id].mine) s.act = GUARD[id].mine; } }, 1500);
  // a material of our own (so changing it never changes anybody else's)
  const own = spec => M(spec).clone();
  // a canvas texture we can redraw
  function canvas(key, w, h, paint) { const t = K.tex(key, w, h, () => {}, { clamp: true }); t.userData.paint = paint; redraw(t); return t; }
  function redraw(t) { const g = t.userData.g, c = t.userData.canvas; g.save(); g.clearRect(0, 0, c.width, c.height); try { t.userData.paint(g, c.width, c.height); } catch (e) { console.error('ch tex', e); } g.restore(); t.needsUpdate = true; H.dirty(); }
  // move something smoothly (a group): to { x, y, z, ry, rx, rz, s }, with a hop (arc cm)
  function tween(obj, to, ms, o) {
    o = o || {}; const f = { x: obj.position.x, y: obj.position.y, z: obj.position.z, ry: obj.rotation.y, rx: obj.rotation.x, rz: obj.rotation.z, s: obj.scale.x };
    const t0 = performance.now(), key = 'ch.tw' + obj.uuid;
    return new Promise(res => {
      H.anims.set(key, now => {
        const k = Math.min(1, (now - t0) / ms), e = o.linear ? k : ease(k);
        if (to.x != null) obj.position.x = f.x + (to.x - f.x) * e;
        if (to.y != null) obj.position.y = f.y + (to.y - f.y) * e - (o.arc ? Math.sin(Math.PI * k) * o.arc : 0);
        if (to.z != null) obj.position.z = f.z + (to.z - f.z) * e;
        if (to.ry != null) obj.rotation.y = f.ry + (to.ry - f.ry) * e;
        if (to.rx != null) obj.rotation.x = f.rx + (to.rx - f.rx) * e;
        if (to.rz != null) obj.rotation.z = f.rz + (to.rz - f.rz) * e;
        if (to.s != null) { const s = f.s + (to.s - f.s) * e; obj.scale.set(s, s, s); }
        if (o.each) o.each(k);
        if (k >= 1) { res(); return false; } return true;
      });
      H.dirty();
    });
  }
  // a little yellow sticky note from Mom (a 3D bit of paper with her handwriting on)
  function sticky(r, key, x, y, z, o) {
    o = o || {};
    const tex = K.tex('ch.sticky.' + key, 192, 192, (g, w, h) => {
      g.fillStyle = o.col || '#fff38a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, 22);
      g.font = '700 26px ' + A.HAND; g.fillStyle = '#1a3a9a'; g.textAlign = 'center';
      K.wrapText(g, cast(o.text || ''), w / 2, 62, w - 24, 32);
      if (o.sign !== false) { g.font = '22px ' + A.HAND; g.fillStyle = '#c01a4a'; g.fillText('Mom x', w - 50, h - 18); }
    });
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.set((o.rx || 0) * D2R, (o.ry || 0) * D2R, (o.rz || 0) * D2R, 'YXZ');
    const sz = o.size || 9;
    const geo = new T.PlaneGeometry(sz, sz, 4, 4); const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const yy = p.getY(i); p.setZ(i, yy > sz * 0.2 ? Math.pow((yy - sz * 0.2) / sz, 2) * 3 : 0); uv.setY(i, 1 - uv.getY(i)); }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, M({ c: '#fff', map: tex, side: 2, sh: 8 })); grp.add(m);
    r.group.add(grp); H.dirty();
    return grp;
  }

  // ================================================================ Mom's list: a real sheet of paper (on the fridge, and Jack's wall)
  const D99 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  function date99() { const [, m, d] = day().split('-').map(Number); const dd = m === 2 && d === 29 ? 28 : d; const w = new Date(Date.UTC(1999, m - 1, dd)).getUTCDay(); const th = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'; return `${D99[w]} ${d}${th} ${MON[m - 1]}`; }
  const papers = [];
  const listTex = K.tex('ch.list', 512, 704, () => {}, { clamp: true });
  listTex.userData.paint = paintList;
  function gem(g, x, y, s, col) { g.save(); g.translate(x, y); g.fillStyle = col || '#2aa04a'; g.strokeStyle = '#0a3a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.75, -s * 0.4); g.lineTo(s * 0.75, s * 0.5); g.lineTo(0, s); g.lineTo(-s * 0.75, s * 0.5); g.lineTo(-s * 0.75, -s * 0.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(0, -s); g.lineTo(-s * 0.75, -s * 0.4); g.lineTo(0, -s * 0.1); g.closePath(); g.fill(); g.restore(); }
  function paintList(g, w, h) {
    // lined notepad paper, torn off the pad at the top
    g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,130,210,.35)'; g.lineWidth = 2; for (let y = 128; y < h - 10; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(220,60,60,.45)'; g.beginPath(); g.moveTo(66, 0); g.lineTo(66, h); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < w; x += 16) { g.beginPath(); g.arc(x + 8, 6, 5, 0, 7); g.fill(); }
    A.grain(g, w, h, 1400, 0.025, 77);
    g.textBaseline = 'alphabetic';
    A.text(g, 'JOBS FOR {me.NAME}', 84, 82, '700 46px ' + A.HAND, '#c0102a');
    g.strokeStyle = '#c0102a'; g.lineWidth = 3; g.beginPath(); g.moveTo(84, 92); g.quadraticCurveTo(250, 100, 410, 90); g.stroke();
    A.text(g, date99(), w - 20, 118, '22px ' + A.HAND, '#1a3a9a', 'right');
    const L = list();
    L.forEach((id, i) => {
      const C = CC.CHORE[id], y = 168 + i * 88, d = S.done[id];
      g.strokeStyle = '#1a3a9a'; g.lineWidth = 3; g.strokeRect(22, y - 30, 32, 32);
      A.text(g, (i + 1) + '. ' + C.n, 80, y, '30px ' + A.HAND, d ? 'rgba(26,58,154,.55)' : '#1a3a9a');
      if (d) { g.strokeStyle = 'rgba(26,58,154,.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(80, y - 10); g.lineTo(80 + Math.min(400, g.measureText((i + 1) + '. ' + C.n).width), y - 12); g.stroke(); }
      A.text(g, CC.money(CC.pence(id)), 108, y + 36, '700 24px ' + A.HAND, '#2a6a2a');
      if (d) { g.strokeStyle = '#0a8a2a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(24, y - 16); g.lineTo(36, y - 2); g.lineTo(60, y - 42); g.stroke(); A.text(g, 'PAID', 236, y + 36, '700 22px ' + A.HAND, '#0a8a2a'); }
      else if (started(id)) A.text(g, '(doing it!)', 236, y + 36, '22px ' + A.HAND, '#c06a00');
    });
    const y2 = 168 + L.length * 88 + 8;
    A.text(g, 'Anything else you do round', 80, y2, '24px ' + A.HAND, '#1a3a9a');
    A.text(g, 'the house = a bit extra!', 80, y2 + 32, '24px ' + A.HAND, '#1a3a9a');
    const extra = Object.keys(S.done).filter(id => !L.includes(id) && CC.CHORE[id]).length;
    if (extra) A.text(g, 'Extras done: ' + extra, 80, y2 + 66, '700 22px ' + A.HAND, '#0a8a2a');
    A.text(g, 'ALL done = 50p BONUS!', 80, h - 64, '700 26px ' + A.HAND, '#c0102a');
    A.text(g, 'Love Mom x', w - 30, h - 24, '28px ' + A.HAND, '#c0102a', 'right');
  }
  // the sheet: curled a little, held on by a magnet (the fridge) or a drawing pin (a wall)
  function paper(r, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 22, h = w * 704 / 512;
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = (ry || 0) * D2R; r.group.add(grp);
    const geo = new T.PlaneGeometry(w, h, 6, 10); const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i); p.setZ(i, (py > h * 0.25 ? Math.pow((py - h * 0.25) / h, 2) * 4 : 0) + Math.pow(px / w, 2) * 0.6 + 0.3); uv.setY(i, 1 - uv.getY(i)); }
    geo.computeVertexNormals();
    const sheet = new T.Mesh(geo, M({ c: '#fff', map: listTex, side: 2, sh: 6 })); grp.add(sheet);
    const G = K.into(grp);
    G.wshadow(0.6, 1.2, 0.05, w * 1.08, h * 1.04, 0.45);
    if (o.magnet) { G.cyl(0, -h / 2 + 1.5, 1.4, 2.2, 2.2, 1.6, 18, M({ c: o.magnet, sh: 60, sp: '#888' }), { rx: 90 }); G.ball(-0.8, -h / 2 + 0.9, 2.3, 0.7, 0.5, 0.3, M({ c: '#fff', o: 0.6 }), 8); }
    else { G.cyl(0, -h / 2 + 1.6, 0.9, 1.1, 1.1, 0.8, 12, M({ c: '#d02a2a', sh: 80, sp: '#fff' }), { rx: 90 }); G.cyl(0, -h / 2 + 1.6, 0.4, 0.15, 0.15, 1, 6, M('#bbb'), { rx: 90 }); }
    const info = { r, grp, w, h, sheet };
    papers.push(info);
    spot(r, o.id || ('ch.list.' + r.id), grp, { label: "Mom's list of jobs", act: () => closeUp(info), range: 260 });
    return info;
  }
  // reading it up close: the camera goes to it, and the sheet's words are laid onto it, sharp
  let reading = null;
  function closeUp(pp) {
    if (reading) return;
    const v = new T.Vector3(0, 0, 0.5); pp.grp.localToWorld(v); const c = { x: v.x, y: -v.y, z: v.z };
    const v1 = new T.Vector3(0, 0, 1.5); pp.grp.localToWorld(v1); const n = { x: v1.x - v.x, y: -(v1.y - v.y), z: v1.z - v.z };
    const vf = H.camera.fov * D2R, asp = innerWidth / Math.max(1, innerHeight), hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const dist = Math.max((pp.h * 1.22) / 2 / Math.tan(vf / 2), (pp.w * 1.3) / 2 / Math.tan(hf / 2));
    const e = { x: c.x + n.x * dist, y: c.y + n.y * dist, z: c.z + n.z * dist };
    const ry = Math.atan2(c.x - e.x, -(c.z - e.z)) / D2R, rx = Math.atan2(-(c.y - e.y), Math.hypot(c.x - e.x, c.z - e.z)) / D2R;
    const el = document.createElement('div'); el.className = 'ch-sheet';
    el.innerHTML = sheetHTML();
    const ok = H.focus({ x: e.x, y: e.y, z: e.z, rx, ry, lvl: pp.r.lvl, seat: 1 }, {
      label: 'Done', enter: () => {
        const q = () => [[-pp.w / 2, -pp.h / 2], [pp.w / 2, -pp.h / 2], [pp.w / 2, pp.h / 2], [-pp.w / 2, pp.h / 2]].map(([x, y]) => { const p = new T.Vector3(x, y, 0.7); pp.grp.localToWorld(p); return [p.x, -p.y, p.z]; });
        reading = H.surface(el, q, { w: 512, h: 704 });
        secret('ch.list');
        el.addEventListener('click', ev => { const b = ev.target.closest('[data-go]'); if (!b) return; H.unfocus(); });
      },
      exit: () => { if (reading) { reading.close(); reading = null; } },
    });
    if (!ok) return;
    snd.rustle();
  }
  function sheetHTML() {
    const L = list();
    const row = (id, i) => { const C = CC.CHORE[id], d = S.done[id]; return `<li class="${d ? 'done' : ''}"><i class="ch-box"></i><b>${i + 1}. ${esc(C.n)}</b><span class="ch-where">${esc(C.blurb)}</span><span class="ch-pay">${d ? (Number.isFinite(d.cashPence) ? 'Done! '+CC.money(d.cashPence)+' cash paid' : d.amt ? d.amt+' Rupees paid (before cash wallets)' : 'Done!') : started(id) ? `Doing it: ${count(id)} of ${stepsOf(id).length}` : `${CC.money(CC.pence(id))}`}<em> &middot; ${esc(C.where)}</em></span></li>`; };
    const extras = CC.CHORES.filter(c => !L.includes(c.id) && avail(c.id));
    return `<div class="ch-pad"><h2>JOBS FOR {me.NAME}</h2><div class="ch-date">${esc(date99())}</div><ol>${L.map(row).join('')}</ol>
      <p class="ch-ex"><b>Anything else = a bit extra!</b> ${extras.map(c => `<span class="${S.done[c.id] ? 'done' : ''}">${esc(c.short)}</span>`).join(' &middot; ')}</p>
      <p class="ch-ps">${member() ? 'ALL done = 50p BONUS. (I pay it into your JackNet Bank: 20 Rupees to the pound.)' : 'P.S. Log on to JackNet (it\'s free) and I\'ll pay it into your JackNet Bank, in Rupees!'}</p><div class="ch-sig">Love Mom x</div></div>`;
  }
  function listHTML() { const L = list(); return `<ol>${L.map(id => `<li class="${S.done[id] ? 'done' : ''}">${esc(CC.CHORE[id].n)} <small>(${CC.money(CC.pence(id))})</small></li>`).join('')}</ol>`; }

  // ================================================================ the HUD: the job you're doing (and today's list, from anywhere)
  const ui = document.createElement('div'); ui.className = 'ch-hud';
  ui.innerHTML = '<div class="ch-chip" hidden><b></b><span class="ch-dots"></span><i class="ch-n"></i></div><button type="button" class="ch-jobs" aria-label="Mom\'s list of jobs"><span class="ch-jico"></span><span class="ch-jn">0/4</span></button>';
  const chipEl = ui.querySelector('.ch-chip'), jobsBtn = ui.querySelector('.ch-jobs');
  (H.ui && H.ui.el ? H.ui.el : document.body).appendChild(ui);
  let chipId = null, chipT = 0;
  function chip(id, pulse) {
    clearTimeout(chipT);
    if (id) chipId = id;
    if (!chipId || !CC.CHORE[chipId]) { chipEl.hidden = true; return; }
    const C = CC.CHORE[chipId], L = stepsOf(chipId), n = count(chipId), dn = done(chipId);
    chipEl.hidden = false; chipEl.classList.toggle('done', dn);
    chipEl.querySelector('b').textContent = C.n;
    chipEl.querySelector('.ch-dots').innerHTML = L.length <= 14 ? L.map(x => `<i class="${has(chipId, x.s) ? 'on' : ''}"></i>`).join('') : '';
    chipEl.querySelector('.ch-n').textContent = dn ? 'DONE!' : n + '/' + L.length;
    if (pulse) { chipEl.classList.remove('pulse'); void chipEl.offsetWidth; chipEl.classList.add('pulse'); }
    chipT = setTimeout(() => { chipEl.hidden = true; if (dn) chipId = null; }, dn ? 6000 : 7000); // (it only shows while you're at it)
  }
  jobsBtn.addEventListener('click', () => {
    const near = papers.filter(p => p.r.group.visible && p.r.id === H.here)[0];
    if (near && !H.busy) return closeUp(near);
    const L = list();
    jack("Mom's list", L.map((id, i) => `${S.done[id] ? '&#10004;' : '&#9744;'} ${i + 1}. ${esc(CC.CHORE[id].n)} <small>(${esc(CC.CHORE[id].where)}, ${CC.money(CC.pence(id))})</small>`).join('<br>') + '<br><small>The list is on the fridge (and on my bedroom wall). Anything else I do round the house = a bit extra.</small>', 9000);
  });
  function refresh() {
    redraw(listTex);
    const L = list(), n = L.filter(id => S.done[id]).length;
    jobsBtn.querySelector('.ch-jn').textContent = n + '/' + L.length;
    jobsBtn.classList.toggle('all', L.length > 0 && n === L.length);
    if (chipId) chip(null);
    if (reading) reading.el.innerHTML = sheetHTML();
  }

  // ================================================================ Mom, every now and then (only while there's a job left on her list)
  let lastShout = Date.now(), shouts = 0;
  const SHOUTS = ['{me.NAME}! Have you done your jobs yet?', '{me}! Those jobs won\'t do themselves!', '{me.NAME}! Get off that computer and do your jobs!', '{me}, love? The list on the fridge? Remember the list?', '{me.NAME}! I can hear you NOT doing your jobs!'];
  const REPLY = ['(Yeah yeah. In a MINUTE.)', '(I\'m DOING it.)', '(Five more minutes...)', '(How does she KNOW?)'];
  setInterval(() => {
    if (!H.live || H.busy || document.hidden || shouts >= 3) return;
    if (Date.now() - lastShout < 6 * 60000) return;
    try { if (window.HouseLife && HouseLife.quiet && HouseLife.quiet()) return; } catch (e) {}
    const L = list(); if (!L.length || L.every(id => S.done[id])) return;
    lastShout = Date.now(); shouts++;
    mom(cast(pick(SHOUTS)));
    setTimeout(() => jack('{me}', pick(REPLY), 3500), 4200);
  }, 30000);

  // ================================================================ a tool in your hands (the hoover, the mower, the broom, a sponge)
  // Not a thing you hold up in front of you: it goes along the floor in front of you as you walk (or rides in your hand), with
  // a mains cable trailing back to its socket if it has one. tool.take({ id, name, obj, dist, hand, cable: { x, y, z, room, max },
  // hint, buttons: [[label, fn]], frame(head, dt), drop() }) ... tool.drop()
  const bar = document.createElement('div'); bar.className = 'ch-toolbar'; bar.hidden = true;
  bar.innerHTML = '<span class="ch-tname"></span><span class="ch-thint"></span><span class="ch-tbtns"></span>';
  ui.appendChild(bar);
  const _v = new T.Vector3();
  const tool = {
    cur: null, plugged: false, trail: [], cableMesh: null, hum: null,
    take(def) {
      if (this.cur) this.drop();
      if (H.held()) H.putBack();
      this.cur = def; this.plugged = false; this.trail = [];
      bar.hidden = false; bar.querySelector('.ch-tname').textContent = def.name;
      this.hint(def.hint || ''); this.buttons();
      if (def.obj.userData.pivot) def.obj.userData.pivot.rotation.x = def.tilt || 0;
      ui.classList.add('tooling');
      let last = performance.now(), fr = 0;
      H.anims.set('ch.tool', now => {
        const d = this.cur; if (!d) return false;
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        if(H.paused)return true;
        if (H.focused || H.mode === 'off' || H.mode === 'follow') { this.drop(); return false; }
        const head = this.place(d, dt);
        if (this.plugged) this.cable(head, ++fr % 3 === 0);
        if (d.frame) try { d.frame(head, dt); } catch (e) { console.error(e); }
        return true;
      });
      H.dirty();
    },
    place(d, dt) {
      const a = H.P.ry * D2R, fx = Math.sin(a), fz = -Math.cos(a), W = H.W, o = d.obj;
      const r = H.ROOMS[H.here]; if (r && o.parent !== r.group) r.group.add(o);
      let x, y, z;
      if (d.hand) { // in your hand: low and to the right of your view, pointing where you look
        const b = H.P.rx * D2R, f = { x: Math.sin(a) * Math.cos(b), y: -Math.sin(b), z: -Math.cos(a) * Math.cos(b) }, rt = { x: Math.cos(a), z: Math.sin(a) };
        x = H.P.x + f.x * 34 + rt.x * 12; y = H.P.y + f.y * 34 + 14; z = H.P.z + f.z * 34 + rt.z * 12;
        o.position.set(x, y, z); o.rotation.set(-b * 0.6, Math.PI - a, 0, 'YXZ');
      } else {
        let dist = d.dist || 50;
        for(let step=5;step<=dist;step+=5)if(!H._.cellOk(W.lvl,W.x+fx*step,W.z+fz*step)){dist=Math.max(0,step-5);break;}
        x = W.x + fx * dist; z = W.z + fz * dist; y = W.fy;
        const k = 1 - Math.pow(0.002, dt);
        if (o.userData.placed) { o.position.x += (x - o.position.x) * k; o.position.z += (z - o.position.z) * k; o.position.y = y; } else { o.position.set(x, y, z); o.userData.placed = 1; }
        let ry = Math.PI - a, cur = o.rotation.y; while (ry - cur > Math.PI) ry -= Math.PI * 2; while (ry - cur < -Math.PI) ry += Math.PI * 2;
        o.rotation.y = cur + (ry - cur) * k;
      }
      return { x: o.position.x, y: o.position.y, z: o.position.z, ry: o.rotation.y, fx, fz, room: H.here };
    },
    drop(quiet) {
      const d = this.cur; if (!d) return;
      this.cur = null; this.unplug(true);
      bar.hidden = true; ui.classList.remove('tooling');
      if (d.obj.userData.pivot) d.obj.userData.pivot.rotation.x = 0;
      d.obj.userData.placed = 0;
      if (!quiet) snd.thud();
      if (d.drop) try { d.drop(); } catch (e) { console.error(e); }
      H.dirty();
    },
    hint(t) { bar.querySelector('.ch-thint').innerHTML = t; },
    buttons() {
      const d = this.cur, el = bar.querySelector('.ch-tbtns'); el.innerHTML = '';
      const actions=d&&d.buttons?(typeof d.buttons==='function'?d.buttons():d.buttons):[];
      for(const [index,[label,fn]]of actions.concat([['Let go',()=>this.drop()]]).entries()){
        const b=document.createElement('button');b.type='button';b.textContent=label+(index===actions.length?' [E]':index===0?' [F]':'');b.addEventListener('click',ev=>{ev.stopPropagation();fn()});el.appendChild(b);
      }
    },
    canWalk(x,z){
      const d=this.cur;if(!d?.radius||d.hand)return true;
      const a=H.P.ry*D2R,fx=Math.sin(a),fz=-Math.cos(a),W=H.W;
      // Backing away and sliding sideways always remain possible. Forward
      // motion stops before the mower's leading footprint reaches a wall.
      if((x-W.x)*fx+(z-W.z)*fz<=.001)return true;
      return H._.cellOk(W.lvl,x+fx*(d.dist||50),z+fz*(d.dist||50));
    },
    key(ev){
      if(!this.cur||H.paused||ev.ctrlKey||ev.metaKey||ev.altKey)return false;
      const k=ev.key.toLowerCase(),actions=this.cur.buttons?(typeof this.cur.buttons==='function'?this.cur.buttons():this.cur.buttons):[];
      const run=k==='e'?()=>this.drop():k==='f'||k==='i'?actions[0]?.[1]:null;if(!run)return false;
      ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)run();return true;
    },
    plug() {
      const d = this.cur; if (!d || !d.cable || this.plugged) return false;
      const c = d.cable, rr = H.ROOMS[c.room]; if (!rr) return false;
      this.plugged = true; this.trail = [{ x: c.x, y: c.y, z: c.z }, { x: c.x + (c.nx || 0) * 8, y: H.LV[rr.lvl] - 0.6, z: c.z + (c.nz || 0) * 8 }];
      snd.thud(); this.motor(true);
      return true;
    },
    unplug(quiet) {
      if (!this.plugged) return; this.plugged = false; this.motor(false);
      if (this.cableMesh) { this.cableMesh.parent && this.cableMesh.parent.remove(this.cableMesh); this.cableMesh.geometry.dispose(); this.cableMesh = null; }
      if (!quiet) { sf.tone(1400, 0.08, 'square', 0.05); sf.tone(700, 0.12, 'square', 0.04, 0.06); }
      H.dirty();
    },
    // the cable: lies along the floor where you've been, from the socket to the back of the machine
    cable(head, rebuild) {
      const d = this.cur, c = d.cable, T0 = this.trail, rear = { x: head.x - head.fx * (d.rear || 18), y: head.y - 0.6, z: head.z - head.fz * (d.rear || 18) };
      const lastP = T0[T0.length - 1];
      // the cable pulls straight wherever nothing's in the way (like a real one being dragged along)
      const clear = (p, q) => { const L = Math.hypot(q.x - p.x, q.z - p.z), n = Math.ceil(L / 15); for (let i = 1; i < n; i++) { const t = i / n; if (t * L < 30 || (1 - t) * L < 20) continue; if (!H._.cellOk(H.W.lvl, p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t)) return false; } return true; };
      for (let k = 1; k < T0.length - 1; k++) if (clear(T0[k], rear)) { T0.length = k + 1; break; }
      if (Math.hypot(lastP.x - rear.x, lastP.z - rear.z) > 32) T0.push(rear);
      let len = 0; for (let k = 1; k < T0.length; k++) len += Math.hypot(T0[k].x - T0[k - 1].x, T0[k].z - T0[k - 1].z); len += Math.hypot(T0[T0.length - 1].x - rear.x, T0[T0.length - 1].z - rear.z);
      if (len > (c.max || 600)) { this.unplug(); if (d.unplugged) d.unplugged(); return; }
      if (!rebuild) return;
      const pts = T0.map(p => new T.Vector3(p.x, p.y, p.z)).concat([new T.Vector3(rear.x, rear.y, rear.z), new T.Vector3(head.x - head.fx * 8, head.y - 6, head.z - head.fz * 8)]);
      const curve = new T.CatmullRomCurve3(pts, false, 'centripetal');
      const geo = new T.TubeGeometry(curve, Math.min(220, pts.length * 6), 0.42, 5, false);
      const rr = H.ROOMS[c.room];
      if (!this.cableMesh) { this.cableMesh = new T.Mesh(geo, M({ c: c.col || '#e8e4dc', sh: 30, sp: '#333' })); this.cableMesh.frustumCulled = false; }
      else { this.cableMesh.geometry.dispose(); this.cableMesh.geometry = geo; }
      const host = H.ROOMS[H.here] || rr; if (this.cableMesh.parent !== host.group) host.group.add(this.cableMesh);
    },
    // the motor: a hum and a rush of air while it's plugged in
    motor(on) {
      const c = sf.ac && sf.ac();
      if (!on || !c) { if (this.hum) { try { this.hum.g.gain.setTargetAtTime(0, c ? c.currentTime : 0, 0.08); const h = this.hum; setTimeout(() => { try { h.o.stop(); h.n.stop(); } catch (e) {} }, 400); } catch (e) {} this.hum = null; } return; }
      if (this.hum) return;
      const g = c.createGain(); g.gain.value = 0; g.connect(sf.output());
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = (this.cur && this.cur.hz) || 118; const og = c.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(g);
      const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const n = c.createBufferSource(); n.buffer = buf; n.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6; n.connect(f); f.connect(g);
      o.start(); n.start(); g.gain.setTargetAtTime(0.035, c.currentTime, 0.2);
      this.hum = { g, o, n };
    },
  };
  H.on('sat', () => tool.drop(true));

  // ================================================================ the API
  function take(id) { const m = MODS[id]; if (!m || !m._built || !m.take) return false; try { return !!m.take(); } catch (e) { console.error(e); return false; } }
  window.ChoreKit = {
    H, R, T, K, A, M, CC, D2R, esc, cast, pick, clamp, ease, touchy, member, secret,
    ownerStart(id) {
      if(!window.OwnerTools?.allowed)return false;const m=MODS[id];if(!m?._built)return false;
      for(const k of ['prog','done','oops','t0','said'])delete S[k][id];
      delete srv.done[id];delete srv.prog[id];if(m.reset)m.reset();save();refresh();begin(id);take(id);return true;
    },
    add, built, whenBuilt, take, step, oops, has, done, started, count, begin, list, onList, stepsOf, avail,
    get S() { return S; }, save, day, date99,
    mom, jack, snd, fx, spot, pickBox, thing, guard, tool, keep, home, hideThing, lock, snap, own, canvas, redraw, tween, sticky, paper, closeUp, listHTML, refresh, chip,
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, MODS, MINE,
  };
  refresh();
})();

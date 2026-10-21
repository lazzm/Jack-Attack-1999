/* grind.js: more reasons to stay and play (the always-loaded part; the rest loads when it's needed).
 *   The Great Rupee Hunt  ten gems hidden round the PC and the JackNet every day      js/grind-hunt.js   www.rupeehunt.jnet
 *   Pocket Money          Mom's Chore List (desktop) + The Odd Jobz Board (web)       js/grind-jobs.js + js/grind-games*.js
 *   JackNet Rank          XP + levels 1-50 from everything you do, badges by names    js/grind-rank.js
 *   The Netizen Hall of Fame  this 1999 week and all time                                 js/grind-rank.js   www.netizenhof.jnet
 * The server (mods/grind.js) decides and pays everything; numbers are in js/grind-cat.js.
 * API (window.Grind): Grind.me (rank card), Grind.rankOf(name) -> level|0, Grind.on(type, fn), Grind.load(mod),
 *   Grind.job(id) opens a mini-game, Grind.go(url). Hunt spots: GemHunt.spot(id, element, hint) (js/grind-hunt.js). */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || window.Grind) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  const RP = n => (window.Econ && Econ.rp ? Econ.rp(n) : `${fmt(n)} ${Math.floor(n) === 1 ? 'Rupee' : 'Rupees'}`);
  const isMember = () => !!(window.Net && Net.me && Net.me.member);

  // ================================================================ state + the wire
  const ev = {};
  const emit = (t, d) => (ev[t] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  const ranks = {}; // lower-case member name -> level
  let me = null, hunt = null;
  const Grind = window.Grind = {
    get me() { return me; }, get hunt() { return hunt; }, get member() { return isMember(); },
    rankOf: n => ranks[String(n || '').toLowerCase()] | 0,
    on(t, fn) { (ev[t] = ev[t] || []).push(fn); return () => { ev[t] = (ev[t] || []).filter(x => x !== fn); }; },
    emit, RP, fmt, esc,
    send: m => !!(window.Net && Net.send(m)),
    load: mod => A.load('js/grind-cat.js').then(() => (mod ? A.load('js/grind-' + mod + '.js') : null)),
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } IE.navigate(url); },
    job: id => (['washup', 'tidy', 'car'].includes(id) && window.Chores ? Promise.resolve(Chores.pcNote()) : Grind.load('jobs').then(() => window.GrindJobs && GrindJobs.play(id))),
  };
  if (window.Net) {
    Net.on('grHi', m => { for (const k in ranks) delete ranks[k]; for (const n in m.rk || {}) ranks[n.toLowerCase()] = m.rk[n] | 0; if (me && Net.me) ranks[String(Net.me.nick).toLowerCase()] = me.lv; decorate(); });
    Net.on('grRk', m => { ranks[String(m.n || '').toLowerCase()] = m.lv | 0; decorate(true); });
    Net.on('grMe', m => { me = m; if (Net.me && Net.me.nick) ranks[String(Net.me.nick).toLowerCase()] = m.lv; emit('me', me); });
    Net.on('grLevel', m => { me = m; if (Net.me && Net.me.nick) ranks[String(Net.me.nick).toLowerCase()] = m.lv; emit('me', me); Grind.load('rank').then(() => window.GrindRank && GrindRank.fanfare(m)); decorate(true); });
    Net.on('grHunt', m => { hunt = m; emit('hunt', m); Grind.load('hunt').then(() => window.GemHunt && GemHunt.data(m)).catch(e => console.error('grind hunt', e)); });
    for (const t of ['grClaimed', 'grJobGo', 'grJobDone', 'grHof', 'grErr']) Net.on(t, m => emit(t, m));
    Net.on('grErr', m => { if (!(ev.grErrUi || []).length && !m.guest) Desk.toast('JackNet', m.msg, 5000); });
    Net.on('welcome', () => setTimeout(() => Net.send({ t: 'grHunt' }), 1200));
    Net.on('loginOk', () => setTimeout(() => { Net.send({ t: 'grHunt' }); Net.send({ t: 'grMe' }); }, 500));
    Net.on('you', m => { if (!m.member) { me = null; emit('me', null); Net.send({ t: 'grHunt' }); } });
  }

  // ================================================================ rank badges next to member names
  // chat + forums + members (a.plink / .memcard b), JackIRC (.ir-nk), the Hangout (.hgav .nm), JackNet profiles (.phead h3)
  const css = `
.gr-rkb,[data-grk]::after{display:inline-block;vertical-align:1px;margin-left:3px;padding:0 3px;min-width:9px;font:bold 9px/12px Verdana,Arial,sans-serif;text-align:center;color:#fff;-webkit-text-fill-color:#fff;background:#6a6a6a;border:1px solid #303030;border-radius:2px;text-shadow:none;letter-spacing:0;filter:none;text-decoration:none}
[data-grk]::after{content:attr(data-grk)}
[data-grt="1"]::after,.gr-rkb[data-grt="1"]{background:#1e8a3a;border-color:#0a4a1a}
[data-grt="2"]::after,.gr-rkb[data-grt="2"]{background:#2463e0;border-color:#0a2a70}
[data-grt="3"]::after,.gr-rkb[data-grt="3"]{background:#9333d6;border-color:#4a0a80}
[data-grt="4"]::after,.gr-rkb[data-grt="4"]{background:linear-gradient(#ffe680,#e0a000);color:#4a3000;-webkit-text-fill-color:#4a3000;border-color:#8a6000}
[data-grt="5"]::after,.gr-rkb[data-grt="5"]{background:linear-gradient(90deg,#e10600,#ff8a00,#ffd400,#2a9a2a,#0060d0,#8a1ad8);border-color:#000}
.hgav .nm[data-grk]::after{font-size:8px;line-height:10px;margin-left:2px}
.gr-rkb{font-size:10px;line-height:14px;padding:0 4px;vertical-align:3px}
`;
  const st = document.createElement('style'); st.id = 'grindCss'; st.textContent = css; document.head.appendChild(st);
  const tierOf = lv => (lv >= 50 ? 5 : lv >= 40 ? 4 : lv >= 30 ? 3 : lv >= 20 ? 2 : lv >= 10 ? 1 : 0);
  const titleOf = lv => (window.GrindCat ? GrindCat.TITLES[lv] : '') || '';
  const tip = lv => `JackNet Rank ${lv}${titleOf(lv) ? ': ' + titleOf(lv) : ''}`;
  Grind.badge = lv => (lv >= 2 ? `<span class="gr-rkb" data-grt="${tierOf(lv)}" title="${esc(tip(lv))}">${lv}</span>` : '');
  function mark(el, name) {
    const lv = Grind.rankOf(name), v = lv >= 2 ? String(lv) : '';
    if ((el.dataset.grk || '') === v) return;
    if (v) { el.dataset.grk = v; el.dataset.grt = tierOf(lv); el.title = el.title && !/^JackNet Rank/.test(el.title) ? el.title : tip(lv); }
    else { delete el.dataset.grk; delete el.dataset.grt; }
  }
  let decoT = 0, decoAt = 0;
  function decorate(now) {
    clearTimeout(decoT);
    const run = () => {
      decoAt = Date.now();
      document.querySelectorAll('a.plink[data-profile]').forEach(a => mark(a, a.dataset.profile));
      document.querySelectorAll('.memcard[data-profile] b').forEach(b => mark(b, b.closest('.memcard').dataset.profile));
      document.querySelectorAll('.ir-log .ir-nk').forEach(b => mark(b, b.textContent.replace(/^[@+]/, '')));
      document.querySelectorAll('.hgav .nm').forEach(n => { const img = n.parentNode.querySelector('img'); if (img) mark(n, img.alt); });
      const h = document.querySelector('#s-members .profile .phead h3');
      if (h) { const lv = Grind.rankOf(h.textContent.trim()); let b = h.parentNode.querySelector('.gr-rkp'); if (lv >= 2 && !b) { b = document.createElement('div'); b.className = 'gr-rkp small'; h.after(b); } if (b) b.innerHTML = lv >= 2 ? `${Grind.badge(lv)} <b>${esc(titleOf(lv) || 'JackNet Rank ' + lv)}</b>` : ''; }
    };
    if (now === true || Date.now() - decoAt > 1500) run(); else decoT = setTimeout(run, 700);
  }
  Grind.decorate = decorate;
  const watch = () => new MutationObserver(ms => { for (const m of ms) if (m.addedNodes.length && m.target && m.target.id !== 'ecGems' && !(m.target.closest && m.target.closest('canvas,.dos-scr'))) { decorate(); return; } }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  // ================================================================ the web sites (pages fill themselves once their file has loaded)
  function page(mod, fn) {
    return () => {
      const el = document.createElement('div'); el.className = 'gr-page gr-loading';
      el.innerHTML = '<p style="font:12px Verdana,Arial,sans-serif;padding:20px">Contacting host... Host contacted. Waiting for reply...</p>';
      Grind.load(mod).then(() => { const M = window[fn.split('.')[0]]; if (M && el.isConnected !== false) M[fn.split('.')[1]](el); })
        .catch(() => { el.innerHTML = '<h2>The page cannot be displayed</h2><p>The server is not answering. Try <b>Refresh</b>.</p>'; });
      return el;
    };
  }
  const SITES = [
    ['www.rupeehunt.jnet', 'The Great Rupee Hunt', 'Ten gems are hidden round your PC and the JackNet every day. Clues, progress and the top hunters.', 'games', 'hunt', 'GemHunt.page', ['/']],
    ['www.oddjobz.jnet', 'The Odd Jobz Board', 'Neighbours need a hand! Paper rounds, dog walking and lawns. Pays in Rupees.', 'kids', 'jobs', 'GrindJobs.board', ['/']],
    ['www.netizenhof.jnet', 'The Netizen Hall of Fame', 'The best of the JackNet this week and of all time: Rupees, gem hunters, ranks and high scores.', 'games', 'rank', 'GrindRank.hof', ['/']],
  ];
  if (window.IE && IE.addSite) for (const [host, title, desc, cat, mod, fn, paths] of SITES) { const pages = {}; for (const p of paths) pages[p] = { title, html: page(mod, fn) }; IE.addSite(host, { title, desc, cat, pages }); }

  // ================================================================ signposts: a box on the magazine's front page and on WAAAGHooo!
  const SIGN = [['http://www.rupeehunt.jnet/', 'The Great Rupee Hunt', '10 gems hidden on the PC and the JackNet every day. Can you find them all?'],
    ['http://www.oddjobz.jnet/', 'Pocket Money!', "The Odd Jobz Board: jobs for the neighbours that pay Rupees. (Mom's own jobs are on the fridge at home.)"],
    ['http://www.netizenhof.jnet/', 'The Netizen Hall of Fame', 'The best gem hunters, earners and high scorers this week and of all time.'],
    ['rank', 'Your JackNet Rank', 'Newbie to Lord of the JackNet: 50 ranks, with prizes.']];
  const signCss = `.gr-sign{margin:14px 0;border:3px ridge #c8a040;background:#1a0a3a linear-gradient(135deg,#2a0a5a,#5a1a8a);color:#fff;padding:8px 10px;font:12px Verdana,Arial,sans-serif}
.gr-sign h3{margin:0 0 6px;font:bold 16px Impact,'Arial Black',sans-serif;letter-spacing:1px;color:#ffd400;text-shadow:2px 2px 0 #a0004a}
.gr-sign h3 blink,.gr-sign h3 .gr-new{display:inline-block;margin-right:6px;padding:0 4px;background:#e10600;color:#fff;font-size:11px;vertical-align:2px;text-shadow:none;animation:grNew 1s steps(2) infinite}
.gr-sign ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px}
.gr-sign li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:6px;align-items:start;line-height:1.3}
.gr-sign li svg{width:20px;height:20px}
.gr-sign a{color:#9fe0ff;font-weight:bold}
.gr-sign small{display:block;color:#e8d8ff;font-size:11px}
@keyframes grNew{50%{opacity:.25}}
@media (max-width:560px){.gr-sign ul{grid-template-columns:minmax(0,1fr)}}`;
  st.textContent += signCss;
  const signIco = i => [ICO.hunt, ICO.jobs, ICO.hof, ICO.rank][i];
  function signBox(cls) {
    const d = document.createElement('div'); d.className = cls;
    d.innerHTML = `<h3><span class="gr-new">NEW!</span>EARN RUPEES ON THE JACKNET</h3><ul>${SIGN.map(([u, t, x], i) => `<li>${signIco(i)}<span><a href="${u === 'rank' ? '#' : u}" data-grgo="${u}">${esc(t)}</a><small>${esc(x)}</small></span></li>`).join('')}</ul>`;
    d.addEventListener('click', ev => { const a = ev.target.closest('[data-grgo]'); if (!a) return; ev.preventDefault(); ev.stopPropagation(); if (a.dataset.grgo === 'rank') A.open('grind.rank'); else Grind.go(a.dataset.grgo); });
    return d;
  }
  function homeSign() { const ed = document.querySelector('#s-home .ed'); if (ed && !document.querySelector('#s-home .gr-sign')) ed.after(signBox('gr-sign')); }
  setTimeout(homeSign, 0);
  document.addEventListener('section', e => {
    const d = String(e.detail || '');
    if (d === 'home') homeSign();
    if (/^site:(www\.)?waaaghooo\.find\/?$/.test(d)) [150, 700, 2000].forEach(ms => setTimeout(() => {
      const side = document.querySelector('#s-secret .wg-side'); if (!side || side.querySelector('.gr-wg')) return;
      const b = document.createElement('div'); b.className = 'wg-box gr-wg';
      b.innerHTML = `<h4>NEW! EARN RUPEES</h4><div class="in"><ul>${SIGN.map(([u, t], i) => `<li><a href="${u === 'rank' ? '#' : u}" data-grgo="${u}">${esc(t)}</a>${i === 0 ? ' <b style="color:#e10600">HOT!</b>' : ''}</li>`).join('')}</ul></div>`;
      b.addEventListener('click', ev => { const a = ev.target.closest('[data-grgo]'); if (!a) return; ev.preventDefault(); ev.stopPropagation(); if (a.dataset.grgo === 'rank') A.open('grind.rank'); else Grind.go(a.dataset.grgo); });
      side.insertBefore(b, side.firstChild);
    }, ms));
  });

  // ================================================================ icons, programs, Run, secrets
  const ICO = {
    chores: '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="21" height="27" fill="#fffbe0" stroke="#7a6a3a"/><path d="M5 3h21v4H5z" fill="#ffe680" stroke="#7a6a3a"/><path d="M9 12h3M9 17h3M9 22h3" stroke="#e10600" stroke-width="1.6"/><path d="M14 12h9M14 17h8M14 22h9M14 26h6" stroke="#203080" stroke-width="1.1"/><path d="M8.6 11.6l1 1 2-2.4" stroke="#0a8a2a" stroke-width="1.4" fill="none"/><circle cx="15.5" cy="3.8" r="3.2" fill="#e10600" stroke="#600"/><circle cx="14.6" cy="2.9" r="1" fill="#fff" opacity=".8"/></svg>',
    hunt: '<svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="9" fill="#d8f0ff" fill-opacity=".6" stroke="#333" stroke-width="2.4"/><path d="M19.5 19.5l8 8" stroke="#6a3a1a" stroke-width="4" stroke-linecap="round"/><path d="M13 6.5l4.4 3v6l-4.4 3-4.4-3v-6z" fill="#38c040" stroke="#0a3a10" stroke-width=".8"/><path d="M13 6.5l-4.4 3 2.4 1.2 2-1.6z" fill="#9cf07a"/><path d="M11.2 11.4l1-1" stroke="#fff" stroke-width="1"/><path d="M24 3l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#ffd400"/></svg>',
    rank: '<svg viewBox="0 0 32 32"><path d="M9 2h14v9l-7 4-7-4z" fill="#2463e0" stroke="#0a2a70"/><path d="M13 2h6v11l-3 1.7-3-1.7z" fill="#e10600"/><circle cx="16" cy="21" r="9" fill="#ffd400" stroke="#8a6000" stroke-width="1.2"/><circle cx="16" cy="21" r="6.4" fill="none" stroke="#c99a00"/><path d="M16 16.2l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="#fff" stroke="#8a6000" stroke-width=".5"/></svg>',
    hof: '<svg viewBox="0 0 32 32"><path d="M9 4h14v6c0 5-3 8-7 8s-7-3-7-8z" fill="#ffd400" stroke="#8a6000"/><path d="M9 6H4c0 5 2 7 5.6 7.4M23 6h5c0 5-2 7-5.6 7.4" fill="none" stroke="#8a6000" stroke-width="1.6"/><rect x="14" y="18" width="4" height="5" fill="#c99a00"/><rect x="9" y="23" width="14" height="5" fill="#6a3a1a" stroke="#000"/><rect x="11" y="24.5" width="10" height="2" fill="#ffd400"/><path d="M12 6.5c0 3 .8 5 2.4 6.4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></svg>',
    jobs: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#b07a3a" stroke="#4a2a0a"/><rect x="4" y="6" width="24" height="18" fill="#d8a868"/><rect x="6" y="8" width="9" height="7" fill="#fff" transform="rotate(-4 10 11)"/><rect x="17" y="9" width="9" height="8" fill="#ffffa0" transform="rotate(5 21 13)"/><rect x="8" y="16" width="9" height="7" fill="#c8e8ff" transform="rotate(3 12 19)"/><circle cx="10" cy="8.6" r="1.2" fill="#e10600"/><circle cx="21" cy="9.6" r="1.2" fill="#0050e0"/><circle cx="12" cy="16.6" r="1.2" fill="#0a8a2a"/><path d="M14 26v4M18 26v4" stroke="#4a2a0a" stroke-width="2"/></svg>',
  };
  Grind.ICO = ICO;
  const go = url => () => Grind.go(url);
  // Mom's chores aren't on the PC any more: they're done for real round the 3D house (js/ch.js). The old way in says where they went.
  const chores = () => (window.Chores && Chores.pcNote ? Promise.resolve(Chores.pcNote()) : Grind.load('jobs').then(() => window.GrindJobs && GrindJobs.chores()));
  A.register('grind.chores', { single: false, cmd: ['chores', 'chorelist', 'mom'], open() { return chores(); } });
  A.register('grind.rank', { single: false, cmd: ['rank', 'jacknetrank', 'xp', 'level'], open() { return Grind.load('rank').then(() => GrindRank.card()); } });
  const P = ['Rupees & Rank'];
  A.addProgram([...P, 'The Odd Jobz Board'], go('http://www.oddjobz.jnet/'), ICO.jobs);
  A.addProgram([...P, 'The Great Rupee Hunt'], go('http://www.rupeehunt.jnet/'), ICO.hunt);
  A.addProgram([...P, 'JackNet Rank'], 'grind.rank', ICO.rank);
  A.addProgram([...P, 'The Netizen Hall of Fame'], go('http://www.netizenhof.jnet/'), ICO.hof);
  A.cmd(['rupeehunt', 'hunt', 'gemhunt', 'treasure hunt'], go('http://www.rupeehunt.jnet/'));
  A.cmd(['oddjobz', 'oddjobs', 'jobs', 'pocketmoney', 'pocket money'], go('http://www.oddjobz.jnet/'));
  A.cmd(['halloffame', 'hof', 'netizenhof'], go('http://www.netizenhof.jnet/'));
  for (const [c, j] of [['paperround', 'paper'], ['washingup', 'washup'], ['tidy', 'tidy'], ['carwash', 'car'], ['mow', 'mow'], ['walkthedog', 'dog'], ['walkies', 'dog']]) A.cmd([c], () => Grind.job(j));
  [['grind.hunt1', 'Finders Keepers', 'Find a gem hidden somewhere on the PC or the JackNet (clues at the Rupee Hunt)'],
   ['grind.hunt10', 'The Full Ten', "Find all ten of the day's hidden gems"],
   ['grind.rainbow', 'Somewhere Over the Modem', 'Find the rarest gem of all'],
   ['grind.chores', 'Good as Gold', "Do a job off Mom's Chore List"],
   ['grind.oddjob', 'Odd Job Kid', 'Do a job for one of the neighbours'],
   ['grind.alljobs', 'Jack of All Trades', 'Do every single job at least once'],
   ['grind.perfect', 'Gold Star', 'Do a job so well that Mom gives you a gold star'],
   ['grind.rank', 'Know Your Place', 'Look at your own JackNet Rank card'],
   ['grind.levelup', 'Ding!', 'Go up a JackNet Rank'],
   ['grind.hof', 'Hall of Famer', 'Visit The Netizen Hall of Fame'],
   ['grind.nag', 'Are You Listening?', "Read every one of Mom's notes on the Chore List"],
  ].forEach(([id, n, h]) => A.defineSecret(id, n, h));

  // a little pay for good play in the PC games that keep their own top-ten tables (the server caps it: js/grind-cat.js /
  // mods/grind.js 'gamewin'). Games tell us by saving a new table (Apps.store) or posting a personal best to JackNet (Net.kv).
  const winAt = {};
  const won = g => { g = String(g || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32); if (!g || !isMember() || Date.now() - (winAt[g] || 0) < 60000) return; winAt[g] = Date.now(); setTimeout(() => Net.send({ t: 'grWin', g }), 1500); };
  const ERA_HS = { jhp_era_ballhs: 'ball', jhp_era_revhs: 'revenge', jhp_era_bowlbest: 'bowling' };
  const set0 = store.set;
  store.set = function (k, v) {
    try {
      const m = /^jhp_games_hs_([a-z0-9._-]+)$/.exec(k) || (ERA_HS[k] ? [k, ERA_HS[k]] : null);
      if (m && v && (!Array.isArray(v) || v.length) && JSON.stringify(v) !== JSON.stringify(store.get(k, null))) won(m[1]);
    } catch (e) {}
    return set0.apply(this, arguments);
  };
  if (window.Net && Net.kv && Net.kv.put) { const put0 = Net.kv.put; Net.kv.put = function (k) { try { const m = /^games\.hs\.([a-z0-9._-]+)$/.exec(String(k)); if (m) won(m[1]); } catch (e) {} return put0.apply(this, arguments); }; }

  // a friendly heads-up once a day (no countdowns, nothing to lose): the hunt is there if you fancy it
  Grind.on('hunt', m => {
    const k = 'jhp_grind_hello', d = m.day; if (store.get(k, '') === d) return;
    store.set(k, d);
    setTimeout(() => Desk.toast('The Great Rupee Hunt', `Ten new gems are hidden around the PC and the JackNet today. Clues at www.rupeehunt.jnet (Start > Programs > Rupees & Rank).`, 9000), window.JHPEverBooted === false ? 180000 : 9000); // a brand-new visitor has enough hellos already
  });
  Grind.chores = chores;
  // the catalogue is small: fetch it straight away (rank titles in tooltips), and add the JackNet Rank rewards to the
  // JackLoot catalogue (they are exclusives: the server gives them at rank milestones, they never drop at random)
  Grind.load().then(() => { decorate(true); return A.load('js/loot-cat.js'); }).then(() => {
    const L = window.LootCat, G = window.GrindCat; if (!L || !G) return;
    for (const [, id, name, r, type, art, d] of G.RANK_LOOT) if (!L.ITEM[id]) { const it = { id, name, r, type, art, d, ex: 1 }; L.ITEMS.push(it); L.ITEM[id] = it; }
  }).catch(() => {});
})();

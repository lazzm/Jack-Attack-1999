/* discs: THE GAMES CUPBOARD. A cupboard of big-box PC games and jewel cases. Take one out, read the back, put the disc in
 * drive D:, install it (InstallJack wizard or Quick Install), play it. Some want the CD in the drive to play. Some are
 * Callum's. The games themselves are lazy files (js/discs-<file>.js) that register with Discs.mod(id, fn).
 *   Discs.mod(id, fn(G, arg))   a game module (see makeG below for the G API)
 *   Discs.launch(id, arg)       open a game window straight away (no install/disc checks: testing)
 *   Discs.open(id) / Discs.insert(id) / Discs.eject() / Discs.cupboard()
 * State: jhp_discs = { cd: id|null, scr: {id: 1}, d2: {id: 1}, n: {id: plays}, dx: 0 } */
(function () {
  'use strict';
  const A = window.Apps; if (!A) return;
  const esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const msg = (t, x, i, b) => Desk.msgbox(Cast.t(t), Cast.t(x), i, b);
  const toast = (t, x, ms) => Desk.toast(t, x, ms);
  const J = (n, s) => (window.JICON && JICON.has && JICON.has(n)) ? (s ? JICON.get(n, s) : JICON.icon(n)) : A.ICON.exe;
  const isPhone = () => innerWidth < 700 || innerHeight < 540;
  const md99 = s => { const [d, m] = String(s).split('/').map(Number); return m * 100 + d; }; // 'dd/mm/99' -> mmdd
  const today = () => (window.Desk && Desk.today99 ? Desk.today99().md : 1016);

  // ================================================================ game modules + the G API
  const MODS = {};
  function mod(id, fn) { MODS[id] = fn; }
  const LIVE = {};

  // G: everything a game needs. Every listener/timer/loop made through G is cleaned up when the window closes.
  function makeG(g, w, host, demo) {
    const cleanups = [], timers = new Set();
    let closed = false;
    const G = {
      id: g.id, def: g, w, host, demo: !!demo, demoUntil: g.rel, phone: isPhone(), touch: matchMedia('(hover:none)').matches,
      get closed() { return closed; },
      // saves: localStorage via Apps.store (key jhp_discs_<id>_<k>)
      load: (k, d) => store.get('jhp_discs_' + g.id + '_' + k, d),
      save: (k, v) => store.set('jhp_discs_' + g.id + '_' + k, v),
      // the autosave that carries a game on after a refresh, a closed window or a Shut Down (js/gamesave.js, key disc.<id>):
      // getState() returns the state to keep, null to forget it (won, lost, demo over) or undefined to leave the last one.
      // live: saves on every flush (close, pagehide) and every 20 s; G.autosave(...).now() saves straight away.
      autosave(get, o) {
        if (!A.gameSaver) return { load: () => null, save() {}, now() {}, clear() {}, flush() {}, stop() {} };
        const s = A.gameSaver('disc.' + g.id, get, Object.assign({ v: 1, max: 400000, live: true, every: 20000 }, o));
        cleanups.push(() => { s.flush(); s.stop(); });
        return s;
      },
      sfx, note: (f, d, t) => { try { Sound.note(f, d, t); } catch (e) {} },
      get sound() { return !!(window.Sound && Sound.on); },
      music(name) { try { Sound.music.play(name); G._music = 1; } catch (e) {} },
      stopMusic() { try { if (G._music) Sound.music.stop(); G._music = 0; } catch (e) {} },
      secret: k => A.secret('disc.' + k),
      msg, toast,
      status(t) { if (w.status) w.status.textContent = t; },
      menu(items) { A.menubar(w, items); },
      setTitle: t => w.setTitle(t),
      quit: () => w.close(),
      // is this game the window the visitor is using? (for keyboard handlers on document)
      focused: () => !closed && w.el.style.display !== 'none' && (!Desk.isActive || Desk.isActive(w.el)),
      visible: () => !closed && w.el.style.display !== 'none',
      on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); cleanups.push(() => target.removeEventListener(ev, fn, opt)); return fn; },
      onClose(fn) { cleanups.push(fn); },
      timer(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!closed) fn(); }, ms); timers.add(id); return id; },
      every(fn, ms) { const id = setInterval(() => { if (!closed) fn(); }, ms); timers.add(id); return id; },
      clear(id) { clearTimeout(id); clearInterval(id); timers.delete(id); },
      // rAF loop: fn(dt seconds, capped at 0.1, t ms). Pauses while minimised. Returns stop().
      loop(fn) {
        let on = true, last = performance.now(), raf = 0;
        const step = t => { if (!on || closed) return; raf = requestAnimationFrame(step); const dt = Math.min(0.1, (t - last) / 1000); last = t; if (w.el.style.display === 'none') return; try { fn(dt, t); } catch (e) { on = false; console.error(e); } };
        raf = requestAnimationFrame(step);
        const stop = () => { on = false; cancelAnimationFrame(raf); };
        cleanups.push(stop); return stop;
      },
      // a crisp pixel canvas of logical size cw x ch, scaled to fit the host (keeps aspect, centred, letterboxed in black)
      canvas(cw, ch, o) {
        o = o || {};
        const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.className = 'dg-cv';
        if (o.smooth) cv.style.imageRendering = 'auto';
        (o.parent || host).appendChild(cv);
        const ctx = cv.getContext('2d');
        const fit = () => { const p = cv.parentNode; if (!p) return; const r = p.getBoundingClientRect(); if (!r.width || !r.height) return; let s = Math.min(r.width / cw, r.height / ch); if (!o.fractional && s >= 2) s = Math.floor(s * 2) / 2; cv.style.width = Math.floor(cw * s) + 'px'; cv.style.height = Math.floor(ch * s) + 'px'; };
        const ro = new ResizeObserver(fit); ro.observe(o.parent || host); cleanups.push(() => ro.disconnect());
        G.on(window, 'resize', fit); requestAnimationFrame(fit);
        // pointer -> canvas coordinates
        const local = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cw / r.width, y: (ev.clientY - r.top) * ch / r.height }; };
        return { cv, ctx, w: cw, h: ch, local, fit };
      },
      // inject a stylesheet once (id should be unique: 'dg-css-<game>')
      css(id, text) { if (!$(id)) { const s = h(null, null, 'style'); s.id = id; s.textContent = text; document.head.appendChild(s); } },
      // the end-of-demo nag. Call it when a demo player hits the demo limit.
      demoEnd(what) {
        G.secret('demo');
        const d = h(`<div class="dg-demoend"><div class="dg-de-t">THANK YOU FOR PLAYING THE ${esc(g.n.toUpperCase())} DEMO!</div><p>${esc(what || 'That\'s the end of the demo.')}</p><p>The full version is in the shops from <b>${esc(longDate(g.rel))}</b>, priced £${esc(g.price || '29.99')} at all good computer shops (and Woolies).</p><p class="dg-de-s">${esc(g.n)} &copy; 1999 ${esc(g.by)}. Demo disc: not for resale. (Dave, that means you.)</p><div class="row" style="justify-content:center;gap:8px"><button class="btn" type="button" data-x="again">Play the demo again</button><button class="btn" type="button" data-x="quit">Quit</button></div></div>`, 'dg-overlay');
        host.appendChild(d);
        qs(d, '[data-x=quit]').addEventListener('click', () => w.close());
        qs(d, '[data-x=again]').addEventListener('click', () => { d.remove(); if (G._restart) G._restart(); });
        return d;
      },
      about() { msg('About ' + g.n, `${g.n} ${g.v || '1.0'}${G.demo ? ' (DEMO)' : ''}\n\n${g.by}\n${g.tag || ''}\n\nCopyright © 1999 ${g.by}. All rights reserved.\nLicensed to: ${(window.Net && Net.me && Net.me.member && Net.me.nick) || 'Jack'}\n\nRequires: ${g.req || 'Pent-Yum 166, 32 MB RAM, 4x CD-ROM, DirectX 6'}`, 'info'); },
      _cleanup() { if (closed) return; closed = true; G.stopMusic(); timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers.clear(); cleanups.splice(0).forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },
    };
    return G;
  }
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = s => { const [d, m] = String(s).split('/').map(Number); return d + ' ' + MON[(m || 1) - 1] + ' 1999'; };
  const isDemo = g => !!g.rel && md99(g.rel) > today();

  // the game window: loading splash, then the module
  function launch(id, arg) {
    const g = GAMES[id]; if (!g || !g.file) return null;
    const host = h(`<div class="dg-load" style="--a:${g.c1};--b:${g.c2}"><div class="dg-ldisc"></div><div class="dg-lt">${esc(g.n)}</div><div class="dg-ls">Loading${isDemo(g) ? ' demo' : ''}... reading from drive D:</div><div class="prog dg-lbar"><span style="display:flex;gap:2px"></span></div></div>`, 'dg-host dg-' + id);
    host.tabIndex = -1;
    let G = null;
    const w = A.win(g.n + (isDemo(g) ? ' (Demo)' : ''), host, { w: g.w || 760, h: g.h || 560, icon: iconFor(g, 16), menubar: true, status: true, cls: 'dgwin dgw-' + id, minW: g.minW || 300, minH: g.minH || 260, onClose: () => { if (G) G._cleanup(); delete LIVE[id]; } });
    if (isPhone()) w.el.classList.add('maxwin');
    const bar = qs(host, '.dg-lbar span'); let k = 0;
    const fill = setInterval(() => { if (k < 16) { bar.appendChild(document.createElement('i')); k++; } }, 70);
    const t0 = Date.now();
    (MODS[id] ? Promise.resolve() : A.load('js/discs-' + g.file + '.js')).then(() => new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - t0))))).then(() => {
      clearInterval(fill);
      if (w.closed) return;
      const fn = MODS[id]; if (!fn) throw new Error('missing game module ' + id);
      host.innerHTML = ''; host.classList.add('dg-on');
      // (re)start the module on a fresh G; a restart (demo nag "play again") cleans up the old run first
      const run = () => { if (G) G._cleanup(); host.innerHTML = ''; G = makeG(g, w, host, isDemo(g)); LIVE[id] = G; G._restart = run; fn(G, arg); };
      run();
      setTimeout(() => { try { host.focus({ preventScroll: true }); } catch (e) {} }, 40);
    }).catch(e => {
      clearInterval(fill); console.error(e);
      if (w.closed) return;
      host.innerHTML = `<div class="dg-load"><div class="dg-lt">${esc(g.exe || 'GAME.EXE')}</div><div class="dg-ls">Cannot read from drive D:. The disc may be dirty. Give it a wipe on your jumper and try again.</div></div>`;
    });
    return w;
  }

  // ================================================================ the catalogue (filled in below)
  const GAMES = {};
  const iconFor = (g, sz) => { const s = g.icon || J('cdrom'); return sz ? s.replace('<svg', `<svg width="${sz}" height="${sz}"`) : s; };

  // ================================================================ CSS
  const css = h(null, null, 'style'); css.id = 'discs-css';
  css.textContent = `
.dgwin > .appbody{padding:0;background:#000;overflow:hidden}
.dg-host{position:absolute;inset:0;overflow:hidden;background:#000;color:#fff;font:12px/1.35 Tahoma,"MS Sans Serif",sans-serif;outline:none;user-select:none;-webkit-user-select:none;touch-action:none}
.dg-host.dg-on{display:flex;align-items:center;justify-content:center}
.dg-cv{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
.dg-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(circle at 50% 40%,var(--a,#224),#000 75%);text-align:center;padding:16px}
.dg-ldisc{width:90px;height:90px;border-radius:50%;background:conic-gradient(#ddd,#9cf,#fcf,#ffc,#cfc,#ddd);border:1px solid #888;position:relative;animation:dgspin 1s linear infinite}
.dg-ldisc::after{content:"";position:absolute;inset:36px;border-radius:50%;background:#000;border:4px solid #bbb}
@keyframes dgspin{to{transform:rotate(1turn)}}
.dg-lt{font:bold italic 26px/1.05 Impact,"Arial Black",sans-serif;color:var(--b,#ff0);text-shadow:2px 2px 0 #000,4px 4px 0 rgba(0,0,0,.4);letter-spacing:1px}
.dg-ls{font:11px "Courier New",monospace;color:#ccc}
.dg-lbar{width:220px;max-width:80%}
.dg-overlay{position:absolute;inset:0;background:rgba(0,0,40,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;text-align:center;z-index:5}
.dg-demoend{background:#c0c0c0;color:#000;border:2px outset #fff;padding:14px;max-width:420px;font:12px/1.4 Tahoma,sans-serif}
.dg-de-t{font:bold 15px Arial,sans-serif;color:#000080;margin-bottom:8px}
.dg-de-s{font-size:10px;color:#444}
`;
  document.head.appendChild(css);

  // ================================================================ the new games (each one a lazy discs-<file>.js)
  const game = (id, o) => { GAMES[id] = Object.assign({ id, v: '1.0', price: '29.99', req: 'Pent-Yum 166, 32 MB RAM, 4x CD-ROM, DirectX 6', w: 780, h: 580 }, o); return GAMES[id]; };
  game('park', { n: 'RollerJack Tycoon', file: 'park', exe: 'RJACK.EXE', rel: '12/04/99', by: 'JackLoop Software', c1: '#1a6a2a', c2: '#ffd400' });
  game('city', { n: 'JackCity 3000', file: 'city', exe: 'JCITY3K.EXE', rel: '31/01/99', by: 'Maxijack', c1: '#1a3a7a', c2: '#7fe0ff', v: '1.1', w: 960, h: 660 });
  game('squigs', { n: 'Jacks: Armageddon', file: 'squigs', exe: 'JACKS.EXE', rel: '29/01/99', by: 'Team Jack', c1: '#5a0a0a', c2: '#ff5a2a', price: '24.99' });
  game('rts', { n: 'Age of Jackpires II', file: 'rts', exe: 'AOJ2.EXE', rel: '30/09/99', by: 'Big Jack Studios', c1: '#3a2a10', c2: '#ffcc33', price: '34.99', req: 'Pent-Yum 166, 32 MB RAM, 8x CD-ROM, DirectX 6.1' });
  game('boss', { n: 'Championship Boss 99/00', file: 'boss', exe: 'CB9900.EXE', rel: '03/12/99', v: '3.05', by: 'Sports Jackteractive', c1: '#0a2a5a', c2: '#ffffff', price: '24.99', req: 'Pent-Yum 133, 32 MB RAM, 4x CD-ROM' });
  game('keepa', { n: 'Dungeon Keepa 2', file: 'keepa', exe: 'DKEEPA2.EXE', rel: '25/06/99', by: 'Bulljack Productions', c1: '#2a0a2a', c2: '#ff3a1a', req: 'Pent-Yum 200, 32 MB RAM, 4x CD-ROM, DirectX 6, 3D card recommended', v: '1.2', w: 880, h: 620 });

  // game secrets (the games call G.secret('park.coaster') etc.)
  [['demo', 'Try before you buy', 'Play a demo disc right to the very end'],
    ['park.coaster', 'Coaster architect', 'Build your own rollercoaster, piece by piece, and open it'],
    ['park.crowd', 'Roll up, roll up', 'Get fifty guests into your theme park at once'],
    ['city.squig', 'It came from the bog', 'Survive a giant monster attack on your city'],
    ['city.big', 'Mayor Jack', 'Grow a city to five thousand people'],
    ['squigs.banana', 'Bananas!', 'Fire the fruitiest weapon in the arsenal'],
    ['squigs.win', 'Last Jack standing', 'Win an artillery war on a tiny island'],
    ['rts.win', 'Warlord', 'Flatten the computer\'s town in a strategy game'],
    ['rts.cheat', 'Cheater cheater', 'Type a cheat into a strategy game\'s chat'],
    ['boss.bedtime', 'School night', 'Play football manager until Mom notices'],
    ['boss.top', 'Top of the league', 'Lead the league as a football manager'],
    ['keepa.slap', 'Hand of gloom', 'Give a lazy imp a slap'],
    ['keepa.heroes', 'No heroes allowed', 'Beat the do-gooders who invade your dungeon'],
  ].forEach(([k, n, hint]) => A.defineSecret('disc.' + k, n, hint));
  // more game secrets, one line per game (ids become 'disc.<game>.<k>'; the games call G.secret('<game>.<k>'))
  const MORE_SECRETS = {
    park: [['loop', 'Loop the loop', 'Send a test train all the way round a loop you built'], ['thriller', 'White knuckles', 'Design a rollercoaster with an excitement rating of 7 or more'], ['brolly', 'Singing in the rain', 'Sell an umbrella to a soggy theme park guest'], ['harry', 'Harry\'s apprentice', 'Follow every one of the handyman\'s tips'], ['tycoon', 'Tycoon', 'Beat every theme park scenario']],
    city: [['tut', 'Work experience', 'Let the city advisors show you the ropes'], ['poke', 'Shoo!', 'Chase a giant monster out of town with a stick'], ['scen', 'Mayor of the year', 'Win a city-building scenario'], ['deal', 'Good neighbours', 'Shake hands with the Mayor of somebody else\'s city'], ['up', 'Twin town', 'Put your own city on JackNet for everyone to visit']],
    rts: [['tutor', 'Top of the class', 'Finish a strategy game\'s Learning Campaign'], ['chronicle', 'Chronicler', 'Win every battle of a strategy campaign'], ['hard', 'Callum who?', 'Beat the hardest computer player in a strategy skirmish'], ['spear', 'Pointy end', 'Knock a rider off their horse with a spearman'], ['online', 'LAN party', 'Win a strategy battle against real people online'], ['watch', 'Armchair warlord', 'Watch somebody else\'s online strategy battle']],
    boss: [['callum', 'Sorry, Callum', 'Save over something you were told not to touch'], ['youth', 'Wonderkid', 'Give a promising youngster his first contract'], ['robot', 'Beep boop', 'Sign a very unusual goalkeeper'], ['giant', 'Giant killer', 'Beat a much bigger club as a football manager'], ['cup', 'Cup winner', 'Lift a cup at the national stadium'], ['champs', 'Champions!', 'Win the league as a football manager'], ['job', 'New challenge', 'Take a job at a different football club'], ['sacked', 'Clear your desk', 'Get the sack as a football manager'], ['season2', 'Patch 3.05', 'Play a football season after the millennium bug'], ['tel', 'Shell suit tour', 'Let the assistant manager show you round'], ['online', 'Cup Night', 'Manage a team in an online cup against real people'], ['cupnight', 'Cup Night kings', 'Win an online cup against real managers']],
    keepa: [['mentor', 'Teacher\'s pet', 'Sit through every one of a dark mentor\'s lessons'], ['callum', 'Not so brave', 'Flatten a certain knight who has finished the game twice'], ['realms', 'Keepa of 1999', 'Turn every nice realm on the map dark'], ['raid', 'Hero for a day', 'Lead the goodies into somebody else\'s dungeon and smash its heart'], ['chicken', 'Fowl play', 'Do something mean to dinner']],
    squigs: [['training', 'Passed out', 'Survive Sergeant Bellows\' Basic Training'], ['pet', 'Virtual pet, real bang', 'Let a pocket pet loose on a tiny island'], ['veteran', 'Callum-proof', 'Beat the toughest computer in an artillery war'], ['hattrick', 'Hat-trick', 'Knock out three jacks in one go']],
  };
  Object.keys(MORE_SECRETS).forEach(g => MORE_SECRETS[g].forEach(([k, n, hint]) => A.defineSecret('disc.' + g + '.' + k, n, hint)));

  // ================================================================ THE GAMES CUPBOARD
  // ---- icons (32x32, chunky JackOS style)
  const IC = {
    cupboard: '<svg viewBox="0 0 32 32"><rect x="3" y="2" width="26" height="28" fill="#9a6230" stroke="#000"/><rect x="5" y="4" width="22" height="24" fill="#5a3412"/><path d="M5 15h22" stroke="#000" stroke-width="2"/><rect x="6" y="6" width="3" height="9" fill="#e10600" stroke="#000" stroke-width=".5"/><rect x="9" y="7" width="3" height="8" fill="#ffd400" stroke="#000" stroke-width=".5"/><rect x="12" y="5" width="3" height="10" fill="#2a7ad8" stroke="#000" stroke-width=".5"/><rect x="15" y="8" width="2" height="7" fill="#3a9a2a" stroke="#000" stroke-width=".5"/><rect x="20" y="7" width="3" height="8" fill="#a040c0" stroke="#000" stroke-width=".5" transform="rotate(12 21 11)"/><rect x="6" y="18" width="2" height="9" fill="#ddd" stroke="#000" stroke-width=".5"/><rect x="8" y="18" width="2" height="9" fill="#ff8a00" stroke="#000" stroke-width=".5"/><circle cx="20" cy="24" r="4" fill="#d8d8e8" stroke="#000"/><circle cx="20" cy="24" r="1" fill="#5a3412"/><rect x="25" y="17" width="2" height="5" fill="#ffd400" stroke="#000" stroke-width=".5"/></svg>',
    park: '<svg viewBox="0 0 32 32"><rect x="1" y="23" width="30" height="7" fill="#3a9a2a" stroke="#000"/><path d="M5 23V14M11 23V8M18 23v-5M25 23V11" stroke="#666" stroke-width="1.2"/><path d="M1 21C5 3 12 3 15 13s6 13 9 3 5-9 7-5" fill="none" stroke="#e10600" stroke-width="2.6"/><rect x="10" y="4" width="5" height="3" fill="#ffd400" stroke="#000" stroke-width=".6" transform="rotate(-20 12 5)"/><circle cx="25" cy="27" r="2" fill="#e10600" stroke="#000" stroke-width=".6"/></svg>',
    city: '<svg viewBox="0 0 32 32"><rect x="1" y="27" width="30" height="4" fill="#555" stroke="#000"/><rect x="2" y="12" width="8" height="15" fill="#7a8aa0" stroke="#000"/><rect x="11" y="3" width="9" height="24" fill="#a0b4d0" stroke="#000"/><rect x="21" y="15" width="9" height="12" fill="#c8a060" stroke="#000"/><g fill="#ffd400"><rect x="4" y="15" width="2" height="2"/><rect x="4" y="20" width="2" height="2"/><rect x="13" y="6" width="2" height="2"/><rect x="16" y="10" width="2" height="2"/><rect x="13" y="14" width="2" height="2"/><rect x="16" y="19" width="2" height="2"/><rect x="23" y="18" width="2" height="2"/><rect x="26" y="22" width="2" height="2"/></g><path d="M2 29h28" stroke="#fff" stroke-dasharray="2 2"/></svg>',
    squigs: '<svg viewBox="0 0 32 32"><path d="M0 28c6-4 10 0 16-3s10 1 16-2v9H0z" fill="#3a9a2a" stroke="#000"/><circle cx="14" cy="18" r="8" fill="#e8401a" stroke="#000"/><circle cx="11" cy="16" r="2.2" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="17" cy="16" r="2.2" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="11.5" cy="16.4" r=".9"/><circle cx="17.5" cy="16.4" r=".9"/><path d="M9 21h10l-2 2h-6z" fill="#fff" stroke="#000" stroke-width=".6"/><rect x="16" y="6" width="14" height="4" fill="#2a5a2a" stroke="#000" transform="rotate(-25 23 8)"/><path d="M27 2l2 3 3-1-2 3 2 2-3 0-1 3-1-3-3 1 2-3z" fill="#ffd400" stroke="#e10600" stroke-width=".6"/></svg>',
    rts: '<svg viewBox="0 0 32 32"><rect x="1" y="26" width="30" height="5" fill="#6a8a2a" stroke="#000"/><path d="M4 26V14l8-7 8 7v12z" fill="#a06a30" stroke="#000"/><path d="M2 15l10-9 10 9" fill="none" stroke="#5a3412" stroke-width="2"/><rect x="9" y="18" width="6" height="8" fill="#3a2a10" stroke="#000"/><path d="M24 26V4" stroke="#000" stroke-width="1.5"/><path d="M24 4h7l-2 3 2 3h-7z" fill="#e10600" stroke="#000"/><circle cx="27" cy="7" r="1" fill="#fff"/><circle cx="20" cy="24" r="3" fill="#3a8a2a" stroke="#000"/></svg>',
    boss: '<svg viewBox="0 0 32 32"><rect x="1" y="3" width="30" height="20" fill="#0a2a5a" stroke="#000"/><path d="M3 7h26M3 11h26M3 15h26M3 19h26" stroke="#5a7ab0" stroke-width=".8"/><rect x="3" y="4" width="10" height="2" fill="#fff"/><rect x="21" y="4" width="6" height="2" fill="#ffd400"/><circle cx="22" cy="24" r="7" fill="#fff" stroke="#000"/><path d="M22 20l3 2-1 4h-4l-1-4z" fill="#000"/></svg>',
    keepa: '<svg viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" fill="#2a102a" stroke="#000"/><path d="M8 30V18c0-3 2-4 3-2v-9c0-2 3-2 3 0v7-10c0-2 3-2 3 0v10-8c0-2 3-2 3 0v9-6c0-2 3-2 3 0v11c0 4-2 6-4 8v4z" fill="#3aaa3a" stroke="#000"/><path d="M11 7l-1-3M14 4l0-3M17 5l1-3M20 7l1-3" stroke="#fff" stroke-width="1"/><circle cx="26" cy="6" r="3" fill="#ff8a00"/><circle cx="26" cy="6" r="1.5" fill="#ffd400"/></svg>',
    floppy: '<svg viewBox="0 0 32 32"><path d="M3 3h24l3 3v23H3z" fill="#2a2a2a" stroke="#000"/><rect x="8" y="3" width="15" height="9" fill="#c8c8c8" stroke="#000"/><rect x="18" y="4" width="3" height="7" fill="#2a2a2a"/><rect x="7" y="16" width="19" height="13" fill="#fff" stroke="#000"/><path d="M9 20h15M9 23h12" stroke="#00a"/></svg>',
  };
  const ic16 = s => String(s).replace('<svg', '<svg width="16" height="16"');
  const ic32 = s => String(s).replace('<svg', '<svg width="32" height="32"');
  ['park', 'city', 'squigs', 'rts', 'boss', 'keepa'].forEach(k => { GAMES[k].icon = IC[k]; });

  // ---- SVG helpers for the box art
  let UID = 0;
  const T = (x, y, s, size, fill, stroke, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.f || 'Impact,Haettenschweiler,\'Arial Black\',\'Arial Narrow Bold\',sans-serif'}" font-size="${size}" font-weight="${o.w || 900}" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="${o.sw || 3}" paint-order="stroke" stroke-linejoin="round" text-anchor="${o.a || 'middle'}"${o.t ? ` transform="${o.t}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.it ? ' font-style="italic"' : ''}${o.len ? ` textLength="${o.len}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(s)}</text>`; };
  const LG = (id, a, b, vert) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const squig = (x, y, r, col, o) => { o = o || {}; return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="${r * 0.1}" rx="${r}" ry="${r * 0.92}" fill="${col || '#e8401a'}" stroke="#000" stroke-width="${Math.max(1, r / 12)}"/><circle cx="${-r * 0.35}" cy="${-r * 0.25}" r="${r * 0.26}" fill="#fff" stroke="#000" stroke-width="${r / 20}"/><circle cx="${r * 0.35}" cy="${-r * 0.25}" r="${r * 0.26}" fill="#fff" stroke="#000" stroke-width="${r / 20}"/><circle cx="${-r * 0.3 + (o.look || 0) * r * 0.1}" cy="${-r * 0.2}" r="${r * 0.11}"/><circle cx="${r * 0.4 + (o.look || 0) * r * 0.1}" cy="${-r * 0.2}" r="${r * 0.11}"/>${o.angry ? `<path d="M${-r * 0.65} ${-r * 0.62}L${-r * 0.1} ${-r * 0.42}M${r * 0.65} ${-r * 0.62}L${r * 0.1} ${-r * 0.42}" stroke="#000" stroke-width="${r / 9}"/>` : ''}<path d="M${-r * 0.6} ${r * 0.25}Q0 ${r * 0.85} ${r * 0.6} ${r * 0.25}z" fill="#600" stroke="#000" stroke-width="${r / 18}"/><path d="M${-r * 0.45} ${r * 0.3}l${r * 0.12} ${r * 0.22}l${r * 0.12} ${-r * 0.2}l${r * 0.12} ${r * 0.24}l${r * 0.12} ${-r * 0.24}l${r * 0.12} ${r * 0.22}l${r * 0.12} ${-r * 0.24}z" fill="#fff"/></g>`; };
  const kid = (x, y, shirt, hair) => `<g transform="translate(${x} ${y})"><rect x="-5" y="-6" width="10" height="12" rx="2" fill="${shirt}" stroke="#000"/><path d="M-4 6v8M4 6v8" stroke="#2a2a6a" stroke-width="3"/><circle cy="-11" r="5" fill="#f0c8a0" stroke="#000"/><path d="M-5 -13q5-6 10 0" fill="${hair}"/><path d="M-5 -4l-5 -6M5 -4l5 -6" stroke="#f0c8a0" stroke-width="2.5"/></g>`;
  const grot = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 -2L-16 -8L-8 2zM6 -2L16 -8L8 2z" fill="${col || '#5aba3a'}" stroke="#000"/><ellipse cx="0" cy="0" rx="8" ry="9" fill="${col || '#5aba3a'}" stroke="#000"/><circle cx="-3" cy="-2" r="2" fill="#e10600"/><circle cx="3" cy="-2" r="2" fill="#e10600"/><path d="M-4 4h8l-1 2h-6z" fill="#fff" stroke="#000" stroke-width=".5"/><path d="M-6 9h12v10h-12z" fill="#7a4a2a" stroke="#000"/></g>`;
  // little imp minion for Dungeon Keepa (red, horns, pickaxe over the shoulder); f = -1 faces left
  const imp = (x, y, s, f) => `<g transform="translate(${x} ${y}) scale(${s * (f || 1)} ${s})"><path d="M-2 14q-14 2-12-8" fill="none" stroke="#000" stroke-width="3"/><path d="M-2 14q-14 2-12-8" fill="none" stroke="#c83a30" stroke-width="1.6"/><path d="M-14 6l-3-4 5 0z" fill="#c83a30" stroke="#000" stroke-width=".8"/>
<path d="M-6 21v-4M5 21v-4" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M-6 21v-4M5 21v-4" stroke="#7a1a1a" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 8q-1 11 3 11h10q4 0 3-11z" fill="#a8282a" stroke="#000"/><path d="M-5 10q-1 4 0 7" stroke="#d85a4a" fill="none"/>
<path d="M-6 -2L-15 -7L-8 2zM6 -2L15 -7L8 2z" fill="#c83a30" stroke="#000"/><ellipse cx="0" cy="0" rx="8" ry="7.6" fill="#c83a30" stroke="#000"/><ellipse cx="-3" cy="-3.6" rx="3" ry="1.8" fill="#e8705a"/>
<path d="M-4.5 -6.5q-3-5 0-9q.4 5 2 7.6zM4.5 -6.5q3-5 0-9q-.4 5-2 7.6z" fill="#f0e2b4" stroke="#000" stroke-width=".7"/><ellipse cx="-3" cy="-.6" rx="2.2" ry="1.8" fill="#ffe000" stroke="#000" stroke-width=".5"/><ellipse cx="3" cy="-.6" rx="2.2" ry="1.8" fill="#ffe000" stroke="#000" stroke-width=".5"/><path d="M-3 -2v2.6M3 -2v2.6" stroke="#000" stroke-width=".9"/>
<path d="M-4.5 3.2q4.5 3.6 9 0z" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M-2.5 3.6l.7 1.3.7-1.2M1.2 3.6l.7 1.2.7-1.3" fill="none" stroke="#000" stroke-width=".4"/><path d="M15 19L11 -15" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M15 19L11 -15" stroke="#a0662a" stroke-width="2.2" stroke-linecap="round"/><path d="M1 -12q10-9 21-1" fill="none" stroke="#000" stroke-width="4.6" stroke-linecap="round"/><path d="M1 -12q10-9 21-1" fill="none" stroke="#c8ccd4" stroke-width="2.6" stroke-linecap="round"/><path d="M4 -14q6-5 12-3" fill="none" stroke="#fff" stroke-width=".8"/><path d="M7 9q5 2 6 7" stroke="#000" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M7 9q5 2 6 7" stroke="#c83a30" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="13.4" cy="15.6" r="2.2" fill="#c83a30" stroke="#000" stroke-width=".7"/></g>`;
  // a space cadet in a bubble helmet (Space Jack Pinball)
  const cadet = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 10q-3 6 0 10M12 10q3 6 0 10" stroke="#000" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M-12 10q-3 6 0 10M12 10q3 6 0 10" stroke="#e8e8f0" stroke-width="3.4" stroke-linecap="round" fill="none"/>
<rect x="-9" y="7" width="18" height="15" rx="4" fill="#e8e8f0" stroke="#000"/><rect x="-5" y="11" width="10" height="5" fill="#2a7ad8" stroke="#000" stroke-width=".6"/><circle cx="-2.5" cy="13.5" r="1" fill="#ff3030"/><circle cx="1" cy="13.5" r="1" fill="#ffd400"/><path d="M-9 18h18" stroke="#e10600" stroke-width="1.6"/>
<path d="M0 -10v-5" stroke="#000" stroke-width="1.2"/><circle cx="0" cy="-16" r="2" fill="#ff3030" stroke="#000" stroke-width=".7"/><circle cx="0" cy="-1" r="10.5" fill="#cfe8ff" stroke="#000" stroke-width="1.2"/>
<circle cx="0" cy="0" r="6" fill="#f0c8a0" stroke="#000" stroke-width=".7"/><path d="M-6 -1q1-7 6-7t6 7q-3-4-6-4t-6 4z" fill="#8a4a1a"/><circle cx="-2.2" cy="0" r="1" fill="#000"/><circle cx="2.2" cy="0" r="1" fill="#000"/><path d="M-2.2 3q2.2 1.8 4.4 0" stroke="#000" stroke-width=".7" fill="none"/>
<path d="M-7 -6q3-4 8-4.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-9.5 4q-.5-2 0-4" stroke="#fff" stroke-width="1" fill="none"/></g>`;
  // a pod pilot: leather flying helmet, brass goggles, red scarf streaming behind (Pod Jack Racer)
  const pilot = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 9q-14 0-24 6q10-1 15 3q-10 2-16 9q12-6 25-10z" fill="#e10600" stroke="#000" stroke-width=".8"/>
<path d="M-11 20v-8q11-8 22 0v8z" fill="#6a4a2a" stroke="#000"/><path d="M-3 12l3 4 3-4" fill="none" stroke="#c8a060" stroke-width="1"/><path d="M-8 9q8 5 16 0" stroke="#e10600" stroke-width="3.4" fill="none" stroke-linecap="round"/>
<ellipse cx="0" cy="0" rx="7.4" ry="8" fill="#f0c8a0" stroke="#000"/><path d="M-8 1q-1-10 8-10t8 10l-1 6h-2l-1-5q-4-3-8 0l-1 5h-2z" fill="#7a4a2a" stroke="#000" stroke-width=".8"/><path d="M-5 -6q4-3 8-1" stroke="#a87048" stroke-width="1.2" fill="none"/>
<path d="M-8 -2h16" stroke="#3a2a1a" stroke-width="2"/><circle cx="-3.2" cy="-2" r="2.8" fill="#8ef0ff" stroke="#a07000" stroke-width="1.3"/><circle cx="3.2" cy="-2" r="2.8" fill="#8ef0ff" stroke="#a07000" stroke-width="1.3"/><path d="M-4.6 -3.4l1.2-.4M1.8 -3.4l1.2-.4" stroke="#fff" stroke-width=".8"/>
<path d="M-2.5 4.6q2.5 1.8 5 0" stroke="#000" stroke-width=".8" fill="none"/></g>`;
  // a little digger bloke: hard hat with a lamp, blue overalls (the Jacklings)
  const digger = (x, y, s, f) => `<g transform="translate(${x} ${y}) scale(${s * (f || 1)} ${s})"><path d="M-4 17l-2 4M4 17l3 4" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M-4 17l-2 4M4 17l3 4" stroke="#2a3aa0" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 22h5M5 22h5" stroke="#000" stroke-width="2.6" stroke-linecap="round"/>
<path d="M-6 7l-6 6M6 7l6 -3" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M-6 7l-6 6M6 7l6 -3" stroke="#3aaa3a" stroke-width="2.4" stroke-linecap="round"/><circle cx="-12" cy="13" r="1.6" fill="#f0c8a0" stroke="#000" stroke-width=".6"/><circle cx="12" cy="4" r="1.6" fill="#f0c8a0" stroke="#000" stroke-width=".6"/>
<path d="M-6 5h12l1 13h-14z" fill="#3aaa3a" stroke="#000"/><path d="M-5 10h10l1 8h-12z" fill="#2a4ac8" stroke="#000" stroke-width=".8"/><path d="M-4 10V6M4 10V6" stroke="#2a4ac8" stroke-width="1.6"/>
<circle cx="0" cy="0" r="5.6" fill="#f0c8a0" stroke="#000"/><circle cx="-1.8" cy=".4" r=".9" fill="#000"/><circle cx="2" cy=".4" r=".9" fill="#000"/><path d="M-1.6 2.8q1.6 1.2 3.2 0" stroke="#000" stroke-width=".7" fill="none"/>
<path d="M-7 -2q0-7 7-7t7 7z" fill="#ffd400" stroke="#000"/><path d="M-8.5 -2h17" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><path d="M-8.5 -2h17" stroke="#ffd400" stroke-width="1.2" stroke-linecap="round"/><path d="M-4 -6q2-2 4-2" stroke="#fff6b0" stroke-width="1" fill="none"/><circle cx="0" cy="-5" r="1.8" fill="#fff6a0" stroke="#000" stroke-width=".6"/></g>`;
  const burst = (x, y, r, fill, text, size, rot) => { let p = ''; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = i % 2 ? r * 0.78 : r; p += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); } return `<g transform="rotate(${rot || -12} ${x} ${y})"><path d="${p}z" fill="${fill}" stroke="#000" stroke-width="1.2"/>${String(text).split('|').map((t, i, a) => T(x, y + (i - (a.length - 1) / 2) * size * 1.05 + size * 0.36, t, size, '#000', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })).join('')}</g>`; };

  // ---- the scenes painted on the fronts (area 200 x 246)
  const SCENE = {
    park(u) {
      return `<defs>${LG(u + 's', '#3aa0ff', '#c8f0ff', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><circle cx="160" cy="40" r="20" fill="#fff6a0"/>
<path d="M0 180Q50 140 100 170T200 160V246H0z" fill="#4aba3a"/><path d="M0 205Q60 180 120 200T200 195V246H0z" fill="#2a8a2a"/>
<g transform="translate(46 168)"><circle r="34" fill="none" stroke="#fff" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M0 0L${(Math.cos(a) * 34).toFixed(1)} ${(Math.sin(a) * 34).toFixed(1)}" stroke="#fff" stroke-width="1.5"/><rect x="${(Math.cos(a) * 34 - 5).toFixed(1)}" y="${(Math.sin(a) * 34 - 2).toFixed(1)}" width="10" height="8" fill="${['#e10600', '#ffd400', '#2a7ad8', '#a040c0'][i % 4]}" stroke="#000"/>`; }).join('')}<path d="M-14 46L0 0L14 46" stroke="#ddd" stroke-width="3" fill="none"/></g>
<g stroke="#8a8a8a" stroke-width="2">${[92, 108, 124, 150, 170, 188].map((x, i) => `<path d="M${x} 210V${[120, 98, 112, 150, 128, 110][i]}"/>`).join('')}</g>
<path d="M70 200C90 60 120 60 130 120S150 200 165 150S185 90 210 100" fill="none" stroke="#e10600" stroke-width="7"/><path d="M70 200C90 60 120 60 130 120S150 200 165 150S185 90 210 100" fill="none" stroke="#ff6a5a" stroke-width="2"/>
<circle cx="150" cy="128" r="22" fill="none" stroke="#e10600" stroke-width="6"/>
<g transform="rotate(-62 96 96)"><rect x="88" y="88" width="14" height="9" fill="#ffd400" stroke="#000"/><rect x="103" y="88" width="14" height="9" fill="#2a7ad8" stroke="#000"/></g>
${kid(28, 228, '#e10600', '#ffd400')}${kid(136, 232, '#2a7ad8', '#5a3a1a')}${kid(176, 226, '#3a9a2a', '#1a1a1a')}<path d="M134 214q-4-14 4-22" stroke="#000" fill="none"/><circle cx="139" cy="190" r="7" fill="#ff5ac8" stroke="#000"/>`;
    },
    city(u) {
      const r = rnd(7); let b = '';
      for (let x = -4; x < 200; x += 14 + Math.floor(r() * 10)) { const w = 12 + Math.floor(r() * 14), hh = 40 + Math.floor(r() * 110), c = ['#3a3a6a', '#4a4a7a', '#2a2a5a', '#5a4a6a'][Math.floor(r() * 4)]; b += `<rect x="${x}" y="${230 - hh}" width="${w}" height="${hh}" fill="${c}" stroke="#000"/>`; for (let wy = 236 - hh; wy < 222; wy += 7) for (let wx = x + 2; wx < x + w - 3; wx += 5) if (r() < 0.55) b += `<rect x="${wx}" y="${wy}" width="2" height="3" fill="#ffe680"/>`; }
      return `<defs>${LG(u + 's', '#1a0a4a', '#ff8a3a', 1)}${LG(u + 'g', '#e8401a', '#8a1a0a', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><g fill="#fff">${[[20, 20], [60, 40], [120, 18], [170, 30], [90, 60], [30, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g>
<g transform="translate(150 118)"><ellipse rx="52" ry="48" fill="url(#${u}g)" stroke="#000" stroke-width="2"/><circle cx="-18" cy="-12" r="12" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="18" cy="-12" r="12" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="-15" cy="-10" r="5"/><circle cx="21" cy="-10" r="5"/><path d="M-30 -30L-6 -20M30 -30L6 -20" stroke="#000" stroke-width="4"/></g>
${b}<rect x="0" y="228" width="200" height="18" fill="#222"/><path d="M0 237h200" stroke="#ffd400" stroke-width="1.5" stroke-dasharray="8 6"/>
<path d="M14 120l6-14 6 14" fill="none" stroke="#aaa" stroke-width="2"/><path d="M20 106v-16" stroke="#aaa" stroke-width="2"/><path d="M8 92h24" stroke="#aaa" stroke-width="2"/>`;
    },
    squigs(u) {
      return `<defs>${LG(u + 's', '#4a8ad8', '#bfe4ff', 1)}<radialGradient id="${u}x"><stop offset="0" stop-color="#fff8a0"/><stop offset=".5" stop-color="#ffb000"/><stop offset="1" stop-color="#e10600" stop-opacity="0"/></radialGradient></defs><rect width="200" height="246" fill="url(#${u}s)"/>
<circle cx="160" cy="70" r="46" fill="url(#${u}x)"/><path d="M0 196C30 170 60 186 90 176S150 150 200 168V246H0z" fill="#7a4a2a" stroke="#000"/><path d="M0 196C30 170 60 186 90 176S150 150 200 168" fill="none" stroke="#3aba2a" stroke-width="8"/>
<circle cx="70" cy="200" r="14" fill="#5a3418"/><path d="M0 226q25-8 50 0t50 0 50 0 50 0V246H0z" fill="#2a5ad8" opacity=".9"/>
<g transform="rotate(-28 120 128)"><rect x="70" y="120" width="80" height="16" rx="3" fill="#2a5a2a" stroke="#000" stroke-width="1.5"/><rect x="146" y="117" width="10" height="22" fill="#1a3a1a" stroke="#000"/></g>
${squig(92, 150, 30, '#e8401a', { angry: 1, look: 1 })}
<path d="M150 40q14-12 26 2q-10-6-26-2z" fill="#ffe14a" stroke="#000" stroke-width="1.2"/><path d="M148 40l-4-6" stroke="#5a3a00" stroke-width="2"/><path d="M144 34q-4-4 0-8" stroke="#ff8a00" fill="none" stroke-width="1.5"/>
${squig(30, 186, 10, '#3a7ae8', { look: 1 })}${squig(176, 158, 9, '#3a7ae8', { look: -1 })}`;
    },
    rts(u) {
      const army = [10, 26, 44, 60, 140, 156, 172, 188].map((x, i) => `<g transform="translate(${x} ${218 - (i % 3) * 4})"><circle cy="-22" r="7" fill="#e8b890" stroke="#000"/><path d="M-7 -26q7-6 14 0" fill="#5a3a1a"/><path d="M-8 0v-14q8-6 16 0v14z" fill="#a01a1a" stroke="#000"/><path d="M${i % 2 ? 6 : -6} -14l${i % 2 ? 6 : -6} -16" stroke="#888" stroke-width="2.5"/></g>`).join('');
      return `<defs>${LG(u + 's', '#ffcc33', '#a02a0a', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><circle cx="100" cy="120" r="44" fill="#ffe680" opacity=".8"/>
<path d="M0 160L40 130L70 150L110 118L150 145L200 125V246H0z" fill="#6a4a2a"/><path d="M120 120v-18h6v-6h6v6h6v-6h6v6h6v18" fill="#8a8a9a" stroke="#000"/><path d="M0 190Q100 160 200 190V246H0z" fill="#4a6a1a"/>
<path d="M62 196V140l26-24 26 24v56z" fill="#a06a30" stroke="#000" stroke-width="1.5"/><path d="M56 142l32-30 32 30" fill="none" stroke="#5a3412" stroke-width="4"/><rect x="80" y="166" width="16" height="30" fill="#2a1a0a" stroke="#000"/>
<path d="M120 196V96" stroke="#000" stroke-width="2"/><path d="M120 98h34l-8 10 8 10h-34z" fill="#e10600" stroke="#000"/><path d="M130 104l6 8 6-8" fill="none" stroke="#fff" stroke-width="2"/>${army}`;
    },
    keepa(u) {
      return `<defs>${LG(u + 's', '#000', '#3a0a3a', 1)}<radialGradient id="${u}t"><stop offset="0" stop-color="#ffcc33"/><stop offset=".4" stop-color="#ff6a00" stop-opacity=".6"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient></defs><rect width="200" height="246" fill="url(#${u}s)"/>
<g fill="#2a1a2a" stroke="#000">${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${i * 30 - 6}" y="200" width="30" height="16"/><rect x="${i * 30 + 9}" y="216" width="30" height="16"/><rect x="${i * 30 - 6}" y="232" width="30" height="16"/>`).join('')}</g>
<circle cx="24" cy="120" r="34" fill="url(#${u}t)"/><circle cx="176" cy="120" r="34" fill="url(#${u}t)"/><path d="M20 126h8v30h-8zM172 126h8v30h-8z" fill="#5a3a1a" stroke="#000"/>
<path d="M60 -4V60c0 10 6 12 10 6V30c0-8 12-8 12 0V20c0-8 12-8 12 0v10c0-8 12-8 12 0v14c0-8 12-8 12 0v34c0 18-10 30-24 34l-6 4H74c-10-8-14-20-14-30z" fill="#3aaa3a" stroke="#000" stroke-width="2" transform="translate(-4 34)"/>
<path d="M66 64l-4-12M78 56l-1-12M90 58l1-12M102 64l3-12" stroke="#fff" stroke-width="2.5" transform="translate(-4 34)"/>
${imp(58, 180, 1.15)}${imp(140, 182, 1.05, -1)}<path d="M150 196l14 0-7-10z" fill="#ffd400" stroke="#a07000"/><g fill="#ffd400" stroke="#a07000">${[[160, 200], [168, 196], [172, 202]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`;
    },
    boss(u) {
      return `<defs>${LG(u + 's', '#0a2a5a', '#000a2a', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/>
<g font-family="Arial,sans-serif" font-size="8" fill="#6a8ac0">${['1 JACKSFORD CITY    14  32', '2 MILLBROOK WDRS   14  30', '3 KINGSPORT ATH     14  27', '4 GUBBINZ TOWN      14  25', '5 HOLLINGTON UTD   14  22', '6 BOGWATER ROVERS  14  20'].map((t, i) => `<text x="12" y="${26 + i * 12}" xml:space="preserve">${t}</text>`).join('')}</g>
<path d="M-40 246L40 140H160L240 246z" fill="#2a8a2a"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${-40 + i * 56} 246L${40 + i * 24} 140" stroke="#3aa03a" stroke-width="12" opacity=".5"/>`).join('')}<path d="M40 140H160L240 246M100 140V246M-40 246L40 140" stroke="#fff" stroke-width="1.5" fill="none"/><ellipse cx="100" cy="190" rx="26" ry="12" fill="none" stroke="#fff" stroke-width="1.5"/>
<g transform="translate(150 196)"><circle r="18" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M0 -8l7 5-3 9h-8l-3-9z" fill="#000"/><path d="M0 -8v-10M7 -3l10-4M4 6l8 8M-4 6l-8 8M-7 -3l-10-4" stroke="#000"/></g>
<g transform="translate(48 172)"><path d="M-16 50v-40q16-12 32 0v40z" fill="#3a2a1a" stroke="#000"/><path d="M-16 14q16 10 32 0" stroke="#d8c8a0" stroke-width="6" fill="none"/><circle cy="-4" r="11" fill="#e8b890" stroke="#000"/><path d="M-11 -8q11-12 22 0" fill="#5a3a1a"/></g>`;
    },
    carta(u) {
      return `<defs>${LG(u + 's', '#0a1a4a', '#2a4aaa', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><circle cx="100" cy="110" r="66" fill="#2a7ad8" stroke="#ffd400" stroke-width="3"/><path d="M60 80c20 10 30-6 46 4s10 26 26 30M50 130c20-4 30 14 50 8s18-20 40-14" stroke="#3aba3a" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="110" rx="66" ry="22" fill="none" stroke="#ffd400" stroke-width="1.5"/><path d="M100 44v132" stroke="#ffd400" stroke-width="1.5"/>
<g>${['#e10600', '#2a9a2a', '#ffd400', '#a040c0', '#ff8a00'].map((c, i) => `<rect x="${30 + i * 28}" y="${190 - (i % 2) * 6}" width="24" height="${50 + (i % 2) * 6}" fill="${c}" stroke="#000"/><path d="M${34 + i * 28} ${200 - (i % 2) * 6}h16" stroke="#fff" stroke-width="2"/>`).join('')}</g>`;
    },
    pinball(u) {
      return `<defs>${LG(u + 's', '#2a0a5a', '#000', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><g fill="#fff">${[[20, 30], [180, 20], [140, 60], [40, 90], [170, 110], [10, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g><circle cx="150" cy="44" r="22" fill="#e8a040" stroke="#000"/><ellipse cx="150" cy="44" rx="34" ry="6" fill="none" stroke="#ffd400" stroke-width="2"/>
<path d="M40 246L60 90H140L160 246z" fill="#1a1a6a" stroke="#ffd400" stroke-width="2"/>${[[80, 120, '#e10600'], [120, 120, '#2a9a2a'], [100, 145, '#ffd400']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="#fff" stroke-width="2"/>`).join('')}<path d="M70 222l24 8M130 222l-24 8" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="110" cy="190" r="6" fill="#ddd" stroke="#000"/>${cadet(70, 176, 1.15)}`;
    },
    quake(u) {
      return `<defs>${LG(u + 's', '#3a1a0a', '#0a0400', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><path d="M0 0l30 40-10 30 40 20" stroke="#ffcc66" stroke-width="2" fill="none" opacity=".7"/>
<g transform="translate(100 120)"><path d="M-40 -70h80v18H14v74c0 30-20 46-50 46-14 0-28-6-36-16l14-16c6 6 14 10 22 10 14 0 22-8 22-24v-74h-26z" fill="#8a4a1a" stroke="#000" stroke-width="3"/><path d="M-36 -66h72v8" stroke="#d08a4a" stroke-width="2" fill="none"/><circle cx="-26" cy="-61" r="3" fill="#3a1a0a"/><circle cx="26" cy="-61" r="3" fill="#3a1a0a"/><circle cx="4" cy="20" r="3" fill="#3a1a0a"/></g><rect y="216" width="200" height="30" fill="#1a0a04"/>`;
    },
    jrt(u) {
      return `<defs>${LG(u + 's', '#0a0a2a', '#4a0a6a', 1)}</defs><rect width="200" height="246" fill="url(#${u}s)"/><g stroke="#00e0ff" stroke-width="1" opacity=".6">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M100 150L${i * 25} 246"/>`).join('')}${[0, 1, 2, 3].map(i => `<path d="M0 ${170 + i * 22}H200"/>`).join('')}</g>
<circle cx="100" cy="90" r="50" fill="none" stroke="#ff3ad8" stroke-width="3"/><path d="M84 150l6-50h20l6 50M88 104l-24 -16M112 104l26 -10" stroke="#ddd" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="100" cy="84" r="12" fill="#ddd" stroke="#000"/><rect x="90" y="80" width="20" height="5" fill="#00e0ff"/><path d="M138 94h30" stroke="#ff3ad8" stroke-width="3"/>`;
    },
  };
  // ---- little "screenshots" for the backs of the boxes (160 x 100)
  const SHOT = {
    park(i) {
      const r = rnd(11 + i); let s = '<rect width="160" height="100" fill="#3a8a2a"/>';
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { const cx = 80 + (x - y) * 10, cy = 14 + (x + y) * 5, t = r(); const col = (x === 4 || y === 3) ? '#9a9a9a' : t < 0.12 ? '#e10600' : t < 0.2 ? '#2a7ad8' : t < 0.3 ? '#1a5a1a' : ['#4aa03a', '#44983a'][(x + y) % 2]; s += `<path d="M${cx} ${cy}l10 5-10 5-10-5z" fill="${col}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/>`; }
      s += `<path d="M30 60q20-50 40-10t40-10 30 20" fill="none" stroke="#ffd400" stroke-width="2"/>`;
      for (let k = 0; k < 16; k++) s += `<circle cx="${30 + r() * 100}" cy="${30 + r() * 60}" r="1.2" fill="${['#e10600', '#fff', '#ffd400', '#0af'][k % 4]}"/>`;
      s += `<rect width="160" height="9" fill="#c0c0c0"/>${[0, 1, 2, 3, 4, 5, 6].map(k => `<rect x="${2 + k * 10}" y="1" width="8" height="7" fill="#d8d8d8" stroke="#808080" stroke-width=".5"/>`).join('')}<path d="M${153 - String((4000 + i * 1830).toLocaleString('en-GB')).length * 3.3} 2.2l1.6 1.2v2.4l-1.6 1.2-1.6-1.2v-2.4z" fill="#2ac84a" stroke="#0a5a1a" stroke-width=".4"/><text x="156" y="7" font-size="6" text-anchor="end" font-family="Arial">${(4000 + i * 1830).toLocaleString('en-GB')}</text>`;
      if (i === 1) s += '<rect x="96" y="22" width="56" height="16" fill="#fff" stroke="#000" stroke-width=".5"/><text x="124" y="32" font-size="5.5" text-anchor="middle" font-family="Arial">"I\'m hungry"</text>';
      return s;
    },
    city(i) {
      const r = rnd(21 + i); let s = '<rect width="160" height="100" fill="#3a6a2a"/>';
      for (let y = 0; y < 11; y++) for (let x = 0; x < 20; x++) { const road = x % 5 === 2 || y % 4 === 1; const t = r(); s += `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="${road ? '#707070' : t < 0.35 ? '#5ad85a' : t < 0.55 ? '#5a8ae8' : t < 0.7 ? '#e8d84a' : t < 0.75 ? '#2a5ad8' : '#3a6a2a'}" stroke="rgba(0,0,0,.3)" stroke-width=".4"/>`; if (!road && t < 0.7 && r() < 0.5) s += `<rect x="${x * 8 + 2}" y="${y * 8 + 1}" width="4" height="5" fill="rgba(255,255,255,.5)"/>`; }
      if (i === 2) s += `<g transform="translate(110 40)"><ellipse rx="18" ry="16" fill="#e8401a" stroke="#000"/><circle cx="-6" cy="-4" r="4" fill="#fff"/><circle cx="6" cy="-4" r="4" fill="#fff"/></g><path d="M90 50l6-6 4 6 6-4" stroke="#ff8a00" fill="none" stroke-width="2"/>`;
      s += `<rect y="90" width="160" height="10" fill="#000"/><text x="2" y="97" font-size="6" fill="#0f0" font-family="Courier New,monospace">${esc(['CITIZENS DEMAND BIGGER JACK BURGERS... MAYOR POPULAR', 'POWER CUT IN JACKTOWN: "IT WAS DAVE" SAY POLICE', 'GIANT BLOB SPOTTED NEAR RESERVOIR! DO NOT FEED IT'][i % 3])}</text>`;
      return s;
    },
    squigs(i) {
      const r = rnd(31 + i); let p = 'M0 100V'; let y = 60;
      for (let x = 0; x <= 160; x += 10) { y = clamp(y + (r() - 0.5) * 24, 35, 80); p += ` ${y.toFixed(0)}L${x} `; }
      p = p.replace(/L \d+ $/, '') + ' 160 100z';
      let s = `<rect width="160" height="100" fill="#7ab8f0"/><path d="M0 70q30-40 60-20t60-30 40 10V100H0z" fill="#9ac8f8"/><path d="${'M0 64' + [...Array(17)].map((_, k) => `L${k * 10} ${(55 + Math.sin(k * 0.9 + i) * 14 + (k % 3) * 3).toFixed(0)}`).join('')}L160 100L0 100z" fill="#8a5a2a" stroke="#3aba2a" stroke-width="3"/>`;
      s += `<circle cx="${70 + i * 10}" cy="58" r="9" fill="#7ab8f0"/><rect y="90" width="160" height="10" fill="#2a5ad8"/>`;
      [[24, 46, '#e8401a'], [60, 40, '#3a7ae8'], [110, 46, '#e8401a'], [140, 44, '#3a7ae8']].forEach(([x, yy, c]) => { s += `<circle cx="${x}" cy="${yy}" r="3.5" fill="${c}" stroke="#000" stroke-width=".5"/><text x="${x}" y="${yy - 6}" font-size="5" text-anchor="middle" fill="#fff" font-family="Arial" stroke="#000" stroke-width=".3">100</text>`; });
      s += `<path d="M24 44Q70 0 108 42" fill="none" stroke="#fff" stroke-dasharray="2 2"/><path d="M104 40l10 4" stroke="#ff0" stroke-width="2"/><rect x="60" y="2" width="40" height="5" fill="#000"/><rect x="80" y="3" width="${8 + i * 5}" height="3" fill="#0af"/>`;
      return s;
    },
    rts(i) {
      const r = rnd(41 + i); let s = '<rect width="160" height="100" fill="#5a8a2a"/>';
      for (let k = 0; k < 40; k++) s += `<circle cx="${(r() * 160).toFixed(0)}" cy="${(10 + r() * 90).toFixed(0)}" r="${2 + r() * 2}" fill="#1a4a1a" stroke="#000" stroke-width=".3"/>`;
      s += '<path d="M60 40h16v12H60zM90 60h12v10H90zM40 66h10v8H40z" fill="#a06a30" stroke="#000" stroke-width=".6"/>';
      for (let k = 0; k < 14; k++) s += `<circle cx="${(50 + r() * 60).toFixed(0)}" cy="${(40 + r() * 40).toFixed(0)}" r="1.6" fill="${k % 3 ? '#3aba2a' : '#e10600'}" stroke="#000" stroke-width=".3"/>`;
      s += `<path d="M0 0h${60 + i * 30}v100H0z" fill="#000" opacity="${i === 2 ? 0 : 0.25}"/><rect width="160" height="8" fill="#5a3a1a"/><text x="3" y="6" font-size="5.5" fill="#ffd400" font-family="Arial">Food 340  Wood 210  Gold 120  Pop 14/25</text><rect x="122" y="70" width="36" height="28" fill="#000" stroke="#c0a060"/><rect x="128" y="76" width="4" height="4" fill="#3aba2a"/><rect x="148" y="88" width="4" height="4" fill="#e10600"/>`;
      return s;
    },
    boss(i) {
      const rows = [['Squad', 'Pos', 'Age', 'Cnd', 'Mor'], ['G. Pickles', 'GK', '29', '98%', 'Good'], ['T. Muddle', 'D RC', '24', '95%', 'Okay'], ['B. Hoofington', 'D LC', '31', '87%', 'Superb'], ['K. Dribbles', 'M C', '19', '100%', 'Good'], ['S. Wellie', 'F C', '27', '92%', 'Poor'], ['N. Wobble', 'F RC', '22', '78%', 'Okay']];
      let s = '<rect width="160" height="100" fill="#b8c4d8"/><rect width="160" height="10" fill="#0a2a5a"/><text x="4" y="7" font-size="6" fill="#fff" font-family="Arial" font-weight="bold">' + ['JACKSFORD CITY - SQUAD', 'MATCH: 67\' JACKSFORD 2 - 1 KINGSPORT', 'PREMIER JACK LEAGUE TABLE'][i % 3] + '</text><rect x="0" y="10" width="28" height="90" fill="#0a2a5a"/>';
      ['Inbox', 'Squad', 'Tactics', 'Fixtures', 'Table', 'Transfers'].forEach((t, k) => { s += `<text x="3" y="${20 + k * 10}" font-size="5.5" fill="#fff" font-family="Arial">${t}</text>`; });
      if (i === 1) { ['23\' GOAL!!! Dribbles curls it in!', '41\' Wellie hits the bar.', '55\' Yellow card: Muddle.', '67\' GOAL!!! Wobble with a header!', '67\' Kingsport 1 - Jacksford 2'].forEach((t, k) => { s += `<text x="32" y="${22 + k * 11}" font-size="6" font-family="Arial" fill="${/GOAL/.test(t) ? '#a00' : '#000'}">${esc(t)}</text>`; }); }
      else rows.forEach((rw, k) => { s += `<rect x="30" y="${12 + k * 11}" width="128" height="10" fill="${k ? (k % 2 ? '#dde4f0' : '#c8d2e4') : '#5a7ab0'}"/>`; rw.forEach((c, j) => { s += `<text x="${32 + [0, 50, 70, 86, 104][j]}" y="${19 + k * 11}" font-size="5.5" font-family="Arial" fill="${k ? '#000' : '#fff'}">${esc(c)}</text>`; }); });
      s += '<rect x="118" y="88" width="40" height="10" fill="#c0c0c0" stroke="#000" stroke-width=".5"/><text x="138" y="95" font-size="6" text-anchor="middle" font-family="Arial" font-weight="bold">Continue</text>';
      return s;
    },
    keepa(i) {
      const r = rnd(51 + i); let s = '<rect width="160" height="100" fill="#2a1a10"/>';
      for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) { const dug = Math.abs(x - 7) + Math.abs(y - 5) < 4 + (r() * 3 | 0); const t = r(); s += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="${dug ? ((x + y) % 2 ? '#5a4a6a' : '#64546e') : t < 0.08 ? '#c8a020' : t < 0.15 ? '#1a1a1a' : '#6a4a2a'}" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>`; }
      s += '<rect x="60" y="40" width="20" height="20" fill="#a01a1a" stroke="#ff3a1a"/><circle cx="70" cy="50" r="5" fill="#ff3a1a"/><rect x="82" y="30" width="20" height="10" fill="#c8a020" opacity=".7"/>';
      for (let k = 0; k < 6; k++) s += `<circle cx="${(50 + r() * 60).toFixed(0)}" cy="${(30 + r() * 40).toFixed(0)}" r="2" fill="#c83a30" stroke="#000" stroke-width=".4"/>`;
      s += '<path d="M120 10c0 8 4 8 4 2v-6c0-3 4-3 4 0v6-8c0-3 4-3 4 0v8-6c0-3 4-3 4 0v12c0 6-4 10-8 10h-4c-4-2-4-8-4-12z" fill="#3aaa3a" stroke="#000" stroke-width=".7"/>';
      return s;
    },
    pinball(i) { return `<rect width="160" height="100" fill="#1a1a6a"/><path d="M40 100L50 0h60l10 100" fill="#2a2a8a" stroke="#ffd400"/>${[[70, 30], [90, 30], [80, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${['#e10600', '#2a9a2a', '#ffd400'][i % 3]}" stroke="#fff"/>`).join('')}<path d="M62 90l12 4M98 90l-12 4" stroke="#fff" stroke-width="3"/><circle cx="${70 + i * 8}" cy="70" r="3" fill="#ddd"/><rect x="122" y="10" width="34" height="80" fill="#000"/><text x="139" y="22" font-size="5" fill="#ff0" text-anchor="middle" font-family="Courier New">${(1250000 * (i + 1)).toLocaleString('en-GB')}</text>`; },
    quake(i) { return `<rect width="160" height="100" fill="#2a1a0a"/><path d="M0 0l50 30v40L0 100zM160 0l-50 30v40l50 30z" fill="#4a2a10"/><path d="M50 30h60v40H50z" fill="#1a0a04"/><path d="M0 100l50-30h60l50 30z" fill="#3a2008"/><rect x="${60 + i * 10}" y="40" width="10" height="24" fill="#5a6a3a"/><path d="M70 100l6-20h8l6 20" fill="#666" stroke="#000"/><text x="4" y="96" font-size="8" fill="#ffcc33" font-family="Impact,Arial Black">100</text>`; },
    jrt(i) { return `<rect width="160" height="100" fill="#0a0a2a"/><path d="M0 100L60 40h40l60 60z" fill="#1a1a4a" stroke="#00e0ff" stroke-width=".5"/><path d="M60 40V0M100 40V0" stroke="#ff3ad8"/><rect x="${70 + i * 6}" y="44" width="8" height="18" fill="#e10600"/><path d="M80 100l4-16h4l4 16" fill="#aaa"/><text x="4" y="10" font-size="6" fill="#0f0" font-family="Courier New">Callum killed Jack</text>`; },
    carta(i) { return `<rect width="160" height="100" fill="#fff"/><rect width="160" height="12" fill="#0a1a4a"/><text x="4" y="9" font-size="7" fill="#ffd400" font-family="Arial">JackCarta 99 - ${['Dinosaurs', 'The Moon', 'Volcanoes'][i % 3]}</text><rect x="100" y="16" width="54" height="40" fill="#2a7ad8"/>${[0, 1, 2, 3, 4, 5, 6].map(k => `<rect x="6" y="${18 + k * 10}" width="${80 - (k % 3) * 10}" height="3" fill="#888"/>`).join('')}`; },
  };

  // ---- the boxes in the cupboard
  const RQ = (cpu, ram, cd, x) => `${cpu}, ${ram} MB RAM, ${cd}x CD-ROM drive${x ? ', ' + x : ''}`;
  const BOXES = [
    { id: 'park', game: 'park', kind: 'big', label: 'ROLLERJACK', discs: 1, needCD: false, c1: '#1a8a2a', c2: '#ffd400', c3: '#e10600', scene: 'park', kb: 48200, age: '3+',
      logo: u => T(100, 34, 'ROLLERJACK', 32, '#ffd400', '#c00000', { sw: 5, t: 'rotate(-5 100 34)', len: 184 }) + T(100, 66, 'TYCOON', 34, '#fff', '#c00000', { sw: 5, t: 'rotate(-5 100 66)', ls: 3 }),
      sticker: ['NEW!|BUILD YOUR|OWN COASTER', '#ffd400'],
      blurb: 'Build the theme park of your dreams! Lay paths, plonk down rides, hire handymen to sweep up and design your very own rollercoaster, one wobbly piece at a time. Then watch hundreds* of guests queue for it, ride it, and tell you exactly what they think.',
      feats: ['Over 20 rides, stalls and bits of scenery', 'Coaster designer: loops! lift hills! screaming!', 'Every guest has their own thoughts (most of them are "I\'m hungry")', 'Handymen, mechanics, loans and a bank manager'],
      quotes: [['"Better than going to an actual theme park. No queues!"', 'JACK ATTACK! 93%'], ['"I built a coaster that went into the lake. Ten out of ten."', 'JackK']], demoOf: 'Jacks: Armageddon',
      readme: 'NOTE FROM JACK: Dave says building a theme park on a computer is pointless because you can\'t go on the rides. Dave, that is the WHOLE POINT. Luke says "is there a Marlo in it". There is not a Marlo in it.' },
    { id: 'city', game: 'city', kind: 'big', label: 'JACKCITY3K', discs: 1, needCD: true, c1: '#1a2a6a', c2: '#7fe0ff', c3: '#ff8a3a', scene: 'city', kb: 72000, age: '3+',
      logo: u => `<defs>${LG(u + 'l', '#ffffff', '#5ab0ff', 1)}</defs>` + T(100, 36, 'JACKCITY', 34, `url(#${u}l)`, '#001a5a', { sw: 5, len: 180 }) + T(100, 74, '3000', 44, '#ffd400', '#001a5a', { sw: 6, it: 1 }),
      sticker: ['NOW WITH|MONSTER|ATTACKS!', '#7fe0ff'],
      blurb: 'You are the Mayor! Zone homes, shops and factories, build roads and power, set the taxes and keep the citizens happy (impossible). Your advisors will help (they won\'t). And when everything is going really well... the giant blob comes out of the reservoir.',
      feats: ['Six advisors (with faces!) who show you the ropes', 'Power, water, traffic, buses, schools, stadiums and laws', 'Five scenarios, from Skint City to the dreaded BLOB ATTACK', 'JackNet: visit other Mayors\' cities and sign neighbour deals'],
      quotes: [['"I raised the taxes to 20% and everybody left. Realistic."', 'Callum'], ['"Simulation heaven."', 'PC JACKZONE 91%']], demoOf: 'JackCity 3000',
      readme: 'NOTE FROM JACK: the CD has to be in the drive to play. Callum says you can get round it. Callum also says his dad knows the man who invented computers. Dave built a whole city with no roads in it. Nobody could get to work.' },
    { id: 'squigs', game: 'squigs', kind: 'big', label: 'JACKS_ARM', discs: 1, needCD: true, c1: '#7a0a0a', c2: '#ffcc00', c3: '#3a7ae8', scene: 'squigs', kb: 34000, age: '11+',
      logo: u => `<defs>${LG(u + 'l', '#fff36a', '#ff5a00', 1)}</defs>` + T(100, 42, 'JACKS', 48, `url(#${u}l)`, '#3a0000', { sw: 6, len: 176 }) + T(100, 66, 'ARMAGEDDON', 20, '#fff', '#3a0000', { sw: 4, ls: 2 }),
      sticker: ['FREE|BANANA|INSIDE!*', '#ffe14a'],
      blurb: 'Four teams of heavily armed Jacks. One small island. Bazookas, grenades, dynamite, airstrikes and the legendary Banana Bomb. Take it in turns to blow each other into the sea. Up to four players on one computer, or take on the computer if your mates have gone home for tea.',
      feats: ['2-4 players hot-seat, or versus the computer', 'Destructible landscapes: blow holes in EVERYTHING', 'Over a dozen weapons including the Banana Bomb', 'Wind! Water! Crates! Sudden death!'],
      quotes: [['"I played it for nine hours. Mom brought me tea. I didn\'t notice."', 'Jack'], ['"Even Dave liked it, and he only likes ULTRA 64."', 'Luke']], demoOf: 'Dungeon Keepa 2', fine: '*There is no banana inside. The banana is in the game.',
      readme: 'NOTE FROM JACK: hot-seat means everyone sits on the same chair in turn. Not literally on top of each other. LUKE.' },
    { id: 'rts', game: 'rts', kind: 'big', label: 'AOJ2_DISC1', discs: 2, needCD: true, owner: 'Callum', c1: '#3a2a10', c2: '#ffcc33', c3: '#e10600', scene: 'rts', kb: 196000, age: '11+',
      logo: u => T(100, 26, 'AGE OF', 18, '#ffe9a0', '#3a1a00', { f: 'Georgia,\'Times New Roman\',serif', sw: 4, ls: 4 }) + T(100, 60, 'JACKPIRES II', 30, '#ffcc33', '#3a1a00', { f: 'Georgia,\'Times New Roman\',serif', sw: 5, len: 182 }) + T(100, 78, 'THE AGE OF JACKS', 11, '#fff', '#3a1a00', { f: 'Georgia,serif', sw: 3, ls: 2 }),
      sticker: null,
      blurb: 'Lead your clan through the Ages! Gather food, wood and Rupees, build your town, train an army of warriors, spearmen, archers and knights, and flatten the enemy before they flatten you. Up to four players: everybody for themselves or two against two. Fully real-time. Fully brilliant.',
      feats: ['Gather, build, train and fight: all at the same time', 'Advance to the Castle Age for knights, catapults and Blacksmith upgrades', 'The Learning Campaign and four campaign battles', 'Up to 4 players: against cunning computer opponents (three difficulty levels) or online over JackNet', '2 CD-ROMs packed with strategy'],
      quotes: [['"The best strategy game ever made. Probably."', 'JACK ATTACK! 95%'], ['"GIVE IT BACK"', 'Callum']], demoOf: 'RollerJack Tycoon',
      readme: 'NOTE FROM JACK: this is CALLUM\'S. He lent it me for one week (three weeks ago). It came already scratched. It was NOT me. He uses his discs as coasters. If it won\'t read, polish it on your jumper. Disc 2 is needed when you install it.' },
    { id: 'keepa', game: 'keepa', kind: 'big', label: 'DKEEPA2', discs: 1, needCD: true, c1: '#2a0a2a', c2: '#ff3a1a', c3: '#3aaa3a', scene: 'keepa', kb: 88000, age: '15+',
      logo: u => T(100, 34, 'DUNGEON', 30, '#ff3a1a', '#000', { f: 'Georgia,\'Times New Roman\',serif', sw: 5, ls: 3, len: 170 }) + T(76, 66, 'KEEPA', 30, '#ffcc33', '#000', { f: 'Georgia,\'Times New Roman\',serif', sw: 5 }) + T(160, 76, '2', 54, '#ff3a1a', '#000', { f: 'Georgia,serif', sw: 6 }),
      sticker: ['IT\'S GOOD|TO BE|BAD!', '#ff3a1a'],
      blurb: 'Forget being the hero. Be the dungeon! Dig out your lair, put your imps to work, build rooms to attract a horde of nasty creatures and slap anyone who slacks. Then wait for the do-gooders to come knocking... and give them a nasty surprise.',
      feats: ['Dig, mine gold and build your evil empire', 'Beasts with needs, wages and favourite rooms', 'Traps, doors, spells and the Hand of Evil: pick up, drop and SLAP', 'Five realms, the Bottomless Pit, and raids on other Keepas\' dungeons over JackNet'],
      quotes: [['"Slapping imps is the most fun I have ever had."', 'Gubbinz'], ['"Not as good as Zeldo." (He hasn\'t played it.)', 'Dave']], demoOf: 'Age of Jackpires II',
      readme: 'NOTE FROM JACK: the box says 15+ but it\'s just cartoon goblins and Mom said it\'s fine as long as I don\'t slap anything in real life. Gubbinz is not allowed to watch.' },
    { id: 'carta', pid: 'carta', app: 'carta.encyc', kind: 'big', label: 'JCARTA99_1', discs: 2, c1: '#0a1a4a', c2: '#ffd400', c3: '#2a7ad8', scene: 'carta', age: '3+', exe: 'JCARTA.EXE',
      logo: u => T(100, 36, 'JackCarta', 32, '#ffd400', '#000', { f: 'Georgia,\'Times New Roman\',serif', sw: 4, it: 1 }) + T(100, 64, '99', 28, '#fff', '#000', { f: 'Georgia,serif', sw: 4 }),
      sticker: ['2 CD-ROMs!|HOMEWORK|SORTED', '#7fe0ff'],
      blurb: 'The complete multimedia encyclopedia on two CD-ROMs. Hundreds of articles, pictures, the Quiz Keep, a timeline of everything and Gubbinz Teaches Typing. Homework will never be the same again.',
      feats: ['Hundreds of articles and pictures', 'The Quiz Keep', 'Includes Gubbinz Teaches Typing and Stamp Studio (Disc 2)'], quotes: [['"I copied my whole history project out of it."', 'Dave (got a D)']],
      readme: 'NOTE FROM JACK: Mom bought this "for homework". I use it for homework. Mostly. The volcano article is the best one.' },
    { id: 'pinball', pid: 'pinball', app: 'games.pinball', kind: 'big', label: 'PINBALL_CD', discs: 1, c1: '#2a0a5a', c2: '#ffd400', c3: '#ff3ad8', scene: 'pinball', age: '3+', exe: 'PINBALL.EXE',
      logo: (u, b) => nameLogo(b, 30, '#ffd400', '#000', '#ff3ad8', '#fff'),
      sticker: null, blurb: 'Full-table space pinball with flippers, bumpers, ramps, missions and a launch plunger. Tilt at your peril.', feats: ['Missions and ranks', 'Multiball!', 'Tilt (don\'t)'], quotes: [['"I\'ve worn out the Z key."', 'Jack']],
      readme: 'NOTE FROM JACK: Z and / for the flippers. Space to launch. Do NOT tilt it in front of Dave, he gets competitive.' },
    { id: 'jaquake', pidApp: 'pcgames.jaquake', app: 'pcgames.jaquake', kind: 'big', label: 'JAQUAKE', discs: 1, c1: '#3a1a0a', c2: '#d08a4a', c3: '#ff6a00', scene: 'quake', age: '15+', exe: 'JAQUAKE.EXE',
      logo: u => T(100, 50, 'JAQUAKE', 40, '#d08a4a', '#000', { f: 'Georgia,\'Times New Roman\',serif', sw: 6, len: 180 }),
      sticker: null, blurb: 'The scariest, brownest 3D shooter on the planet. Run through castles, bases and dungeons, jump on things and try not to fall in the slime.', feats: ['True 3D', 'Mouse look!', 'Lots of brown'], quotes: [['"Too brown. Brilliant."', 'Callum']],
      readme: 'NOTE FROM JACK: I\'m only allowed to play this one with the sound down and the lights ON.' },
    { id: 'jrt', pidApp: 'pcgames.jrt', app: 'pcgames.jrt', kind: 'big', label: 'JRT_CD', discs: 1, owner: 'Callum', c1: '#1a0a3a', c2: '#00e0ff', c3: '#ff3ad8', scene: 'jrt', age: '15+', exe: 'JRT.EXE',
      logo: u => T(100, 34, 'JACKREAL', 32, '#00e0ff', '#000', { sw: 5, len: 176 }) + T(100, 62, 'TOURNAMENT', 24, '#ff3ad8', '#000', { sw: 4, ls: 1 }),
      sticker: ['GAME OF|THE YEAR?', '#00e0ff'], blurb: 'Arena combat in the far future! Bots, sniper towers, low gravity and a man shouting "HEADSHOT" very loudly.', feats: ['Bots that call you names', 'Loads of arenas'], quotes: [['"Callum always wins. Always."', 'Jack']],
      readme: 'NOTE FROM JACK: CALLUM\'S. He wants it back before the LAN party at his house.' },
    // ---- jewel cases
    { id: 'boss', game: 'boss', kind: 'jewel', label: 'CBOSS9900', discs: 1, needCD: false, c1: '#0a2a5a', c2: '#ffffff', c3: '#ffd400', scene: 'boss', kb: 61000, age: '3+',
      logo: u => T(100, 30, 'CHAMPIONSHIP', 22, '#fff', '#000', { f: 'Arial Black,Arial,sans-serif', sw: 3, len: 180 }) + T(100, 58, 'BOSS', 30, '#ffd400', '#000', { f: 'Arial Black,Arial,sans-serif', sw: 4, ls: 4 }) + T(100, 84, 'SEASON 99/00', 14, '#fff', '#000', { f: 'Arial,sans-serif', sw: 3 }),
      sticker: null,
      blurb: 'You\'re the gaffer. Pick the team, set the tactics, buy and sell players, bring through the kids and shout at them at half-time. A whole (made-up) league, a youth team, the board breathing down your neck, and a Continue button you will press four million times.',
      feats: ['Squad, tactics, transfers, youth team and finances', 'Live commentary AND a little highlights pitch', 'Cup Night: an online knockout against real managers', 'Unlimited "just one more match"'],
      quotes: [['"Saved Callum\'s career on it. Don\'t save over it."', 'Callum'], ['"I don\'t get it. Where is the football?"', 'Luke']],
      readme: 'NOTE FROM JACK: Callum\'s career is on here. DON\'T SAVE OVER IT. Also this is the night-time game. Mom always comes in at "just one more match".' },
    { id: 'podracer', pid: 'podracer', app: 'games.podracer', kind: 'jewel', label: 'PEAPODRACER', discs: 1, c1: '#a04a10', c2: '#ffe14a', c3: '#2a7ad8', age: '3+', exe: 'PODRACE.EXE',
      logo: (u, b) => nameLogo(b, 40, '#ffe14a', '#5a1a00', '#fff', '#5a1a00'), blurb: 'Race pods through the desert at 600 mph. Unofficial. Not affiliated with any galaxy.', feats: ['Three laps', 'Two huge engines', 'One small pilot'], quotes: [['"NOW THIS IS POD RACING"', 'Jack (sorry)']], readme: 'NOTE FROM JACK: made the day after I saw the film. Twice.' },
    { id: 'grotlings', pid: 'grotlings', app: 'games.grotlings', kind: 'jewel', label: 'LEMMINGISH', discs: 1, c1: '#2a6a2a', c2: '#ffffff', c3: '#2a7ad8', age: '3+', exe: 'JACKLING.EXE',
      logo: (u, b) => nameLogo(b, 46, '#fff', '#003a00', '#ffd400', '#003a00'), blurb: 'Little guys walk off cliffs unless you give them jobs. Diggers, blockers, builders, and the big red button.', feats: ['Diggers!', 'Blockers!', 'The big red button'], quotes: [['"Oh no!"', 'Every single one of them']], readme: 'NOTE FROM JACK: the level codes are written on my hand. It rained.' },
    { id: 'cover7', kind: 'jewel', label: 'JACKATTACK7', c1: '#5b16c9', c2: '#ffe600', c3: '#e10600', age: '3+', mag: true,
      logo: u => T(100, 40, 'JACK', 36, '#ffe600', '#e10600', { sw: 5, it: 1 }) + T(100, 74, 'ATTACK!', 34, '#ffe600', '#e10600', { sw: 5, it: 1 }) + T(100, 96, 'COVER DISC 7', 13, '#fff', '#000', { f: 'Verdana,Arial,sans-serif', sw: 3, ls: 2 }),
      blurb: 'The JACK ATTACK! magazine cover disc. 650 MB of gaming goodness: playable demos, extras, drivers and DirectX 6.1 (again).', feats: ['Playable demos', 'Wallpapers', 'Drivers'], quotes: [['"Disc not working? Blow on it."', 'Everyone']], readme: 'This is the disc that normally lives in the CD-ROM drive.' },
    // ---- the drawer
    { id: 'callumcd', kind: 'cdr', label: '{mate3.NAME} MIX', c1: '#e8e8f0', c2: '#000', c3: '#2a2aaa', owner: 'Callum',
      blurb: 'A CD-R. Written on in felt tip: "{mate3.NAME}\'S SHAREWARE MIX!!! DEMOS + LEVELS. DO NOT SCRATCH. ({me.NAME})". Burned at {mate3}\'s house on {mate3.his} dad\'s CD writer (it took 40 minutes and made the lights flicker).',
      readme: '{mate3.NAME}\'S SHAREWARE MIX\n======================\n\nall shareware so it\'s allowed to copy (I CHECKED)\n\nDOSGAMES\\   - the DOS shareware pack (6 games!!)\nQUEST\\      - the text adventure. type LOOK. then type it again\nSAVES\\      - my championship boss save. DON\'T LOAD IT. well you can look\n\nreturn this by friday or I\'m telling everyone you cried at that film\n\n- {mate3}\n' },
    { id: 'dx61', kind: 'sleeve', label: 'DIRECTX61', c1: '#fff', c2: '#000', c3: '#2a7ad8',
      blurb: 'A CD in a paper sleeve from the front of a magazine: "DIRECTX 6.1 - REQUIRED FOR ALL GAMES!!! INSTALL THIS FIRST". Every magazine gives you one. I have eleven.', readme: 'DIRECTX 6.1\n===========\n\nRequired for: everything.\nAlready installed: probably.\nGoing to install it again anyway: definitely.\n' },
    { id: 'gquest', pid: 'grotquest', kind: 'floppy', label: 'QUEST_DISK', c1: '#2a2a2a', c2: '#fff', c3: '#e10600',
      blurb: 'A 3½" floppy disk with a handwritten label: the text adventure, "v1.2 - DISK 1 OF 1 - SHAREWARE - PLEASE COPY!". It\'s a floppy, so it goes in drive A: (and it\'s already installed).', readme: 'THE TEXT ADVENTURE\n==================\nYou are standing in a dark room. There is a floppy disk here.\n> TAKE DISK\nTaken.\n' },
    { id: 'n64', kind: 'cart', label: '{mate2.NAME}\'S', c1: '#7a7a7a', c2: '#fff', c3: '#e10600', owner: 'Luke',
      blurb: 'A grey game cartridge with "{mate2.NAME}" written on the back in Tipp-Ox. {mate2} left it here "so {me} can borrow it" (so {mate2} has an excuse to come round). It is not a CD. It will not go in the CD-ROM drive. People have tried.', readme: '' },
  ];
  for (const b of BOXES) {
    const id = ({ Callum: 'mate3', Luke: 'mate2' })[b.owner];
    if (id) { b.houseOwner = id; Object.defineProperty(b, 'owner', { enumerable: true, get: () => Cast.n(id) }); }
    if (['callumcd', 'n64'].includes(b.id)) {
      for (const key of ['label', 'blurb', 'readme']) {
        const template = b[key];
        if (typeof template === 'string') Object.defineProperty(b, key, { enumerable: true, get: () => Cast.t(template) });
      }
    }
  }
  const BOX = {}; BOXES.forEach(b => { BOX[b.id] = b; });
  const EXT = {}; // discs from other packs (js/pm-media.js: audio CDs, monthly cover CDs...): id -> { id, ext: true, label, title, autorun(), files() }
  const pidOf = b => b.pid || (b.game ? 'disc.' + b.game : b.pidApp && window.Setup ? ((Setup.list.find(p => (p.apps || []).includes(b.pidApp)) || {}).id || null) : null);
  // other packs own these products: show whatever they call them now
  const prodOf = b => { const id = !b.game && pidOf(b); return id && window.Setup && Setup.get ? Setup.get(id) : null; };
  const prodName = b => { const p = prodOf(b); return p ? String(p.n).replace(/ \(.*\)$/, '').replace(/ demo$/i, '').replace(/ v?\d+\.\d[\d.]*[a-z]?$/i, '') : null; };
  const FALLBACK = { carta: 'JackCarta 99', pinball: 'Space Pinball', jaquake: 'Jaquake', jrt: 'Jackreal Tournament', podracer: 'Peapod Racer', grotlings: 'Little Diggers', cover7: 'JACK ATTACK! Cover Disc 7', callumcd: '{mate3}\'s Shareware Mix (CD-R)', dx61: 'DirectX 6.1 (cover CD)', gquest: 'Text Adventure', n64: '{mate2}\'s cartridge' };
  const titleOf = b => b.ext ? b.title : b.game ? GAMES[b.game].n : b.id === 'gquest' ? (prodName(b) || FALLBACK.gquest) + ' (floppy)' : (b.mag || b.kind === 'cdr' || b.kind === 'sleeve' || b.kind === 'cart') ? Cast.t(FALLBACK[b.id]) : (prodName(b) || FALLBACK[b.id] || b.id);
  const byOf = b => b.game ? GAMES[b.game].by : (prodOf(b) && prodOf(b).by) || ({ carta: 'JackSoft Reference', jaquake: 'Id-Jack Software', jrt: 'Epic Jack Games', cover7: 'JACK ATTACK! Magazine' })[b.id] || '';
  // a two-line logo made from the product's current name
  function nameLogo(b, y, c1, s1, c2, s2) { const w = titleOf(b).toUpperCase().split(' '); const l2 = w.length > 1 ? w.pop() : ''; const l1 = w.join(' '); return T(100, y, l1, l1.length > 9 ? 24 : 32, c1, s1, { sw: 4, len: l1.length > 7 ? 180 : 0 }) + (l2 ? T(100, y + 32, l2, 30, c2, s2, { sw: 4, it: 1 }) : ''); }
  const hasApp = b => !b.app || !!A.apps[b.app];
  const installed = b => { const p = pidOf(b); return p && window.Setup ? Setup.has(p) : hasApp(b); };
  const cdKey = b => { const p = pidOf(b); const i = window.Setup ? Setup.list.findIndex(x => x.id === p) : -1; return i < 0 ? '1999-0000' : '1999-' + String(4000 + i * 37).slice(0, 4); };
  const demoBox = b => b.game ? isDemo(GAMES[b.game]) : !!(prodOf(b) && prodOf(b).lic === 'Demo');
  const fullOut = b => b.game ? 'out ' + longDate(GAMES[b.game].rel) : 'in the shops soon';
  // ---- box fronts
  const HAND = '\'Comic Sans MS\',\'Chalkboard SE\',\'Marker Felt\',cursive';
  function callumSticker(y) { return `<g transform="rotate(-9 86 ${y})"><rect x="20" y="${y - 14}" width="132" height="26" fill="#fff36a" stroke="#c8a000"/><path d="M20 ${y - 14}h132" stroke="#fff" opacity=".6"/>${T(86, y + 4, Cast.t('{mate3.NAME}\'S - GIVE IT BACK'), 12, '#c00000', null, { f: HAND, w: 700, sw: 0 })}</g>`; }
  function jewelArt(b, u) {
    if (b.id === 'podracer') return `<defs>${LG(u + 's', '#ff9a3a', '#ffe0a0', 1)}</defs><rect width="200" height="200" fill="url(#${u}s)"/><path d="M0 150L60 110L120 140L200 100V200H0z" fill="#c86a2c"/><path d="M40 150l60-8 60 8-60 14z" fill="#8a8a8a" stroke="#000"/><rect x="50" y="128" width="40" height="12" rx="6" fill="#ddd" stroke="#000"/><rect x="110" y="128" width="40" height="12" rx="6" fill="#ddd" stroke="#000"/><path d="M90 134h20" stroke="#2a7ad8" stroke-width="2"/><path d="M46 134h-30M46 130h-22" stroke="#ffd400" stroke-width="3"/>${pilot(100, 139, 0.95)}`;
    if (b.id === 'grotlings') return `<defs>${LG(u + 's', '#2a7ad8', '#a0e0ff', 1)}</defs><rect width="200" height="200" fill="url(#${u}s)"/><path d="M0 120h120v80H0z" fill="#3a9a2a" stroke="#000"/><path d="M0 120h120" stroke="#5ad83a" stroke-width="5"/>${[20, 50, 80, 110].map((x, i) => digger(x, 98, 0.75)).join('')}<path d="M140 200v-30h60" fill="#2a5ad8"/><path d="M138 122q12-16 24 0z" fill="#e10600" stroke="#000"/><path d="M144 122l6-14 6 14M150 108v14" stroke="#fff" stroke-width=".8" fill="none"/><path d="M140 122l10 14M160 122l-10 14" stroke="#000" stroke-width=".7"/>${digger(150, 142, 0.7)}`;
    if (b.id === 'cover7') return `<defs><radialGradient id="${u}r" cx=".8" cy=".2"><stop offset="0" stop-color="#7b36e9"/><stop offset="1" stop-color="#14002e"/></radialGradient></defs><rect width="200" height="200" fill="url(#${u}r)"/><circle cx="160" cy="40" r="60" fill="none" stroke="#ff0" stroke-width="10" opacity=".25"/><circle cx="160" cy="40" r="40" fill="none" stroke="#0ff" stroke-width="10" opacity=".25"/>` + burst(150, 150, 34, '#ffe600', 'PLAYABLE|DEMOS!', 9, 10) + T(56, 150, 'DEMOS', 18, '#9ff', '#000', { sw: 3 }) + T(56, 170, 'EXTRAS', 14, '#fff', '#000', { sw: 3 }) + T(56, 186, 'DRIVERS', 12, '#fff', '#000', { sw: 3 });
    return SCENE[b.scene] ? `<g transform="scale(1 ${200 / 246})">${SCENE[b.scene](u)}</g>` : `<rect width="200" height="200" fill="${b.c1}"/>`;
  }
  function front(b) {
    const u = 'dc' + (++UID);
    if (b.kind === 'cdr') return `<svg viewBox="0 0 200 200" class="dc-svg"><defs><radialGradient id="${u}d"><stop offset=".2" stop-color="#e8f0ff"/><stop offset=".55" stop-color="#9ab0e8"/><stop offset=".75" stop-color="#d0a0ff"/><stop offset="1" stop-color="#8ad0d0"/></radialGradient></defs><circle cx="100" cy="100" r="96" fill="url(#${u}d)" stroke="#888"/><circle cx="100" cy="100" r="20" fill="#fff" stroke="#999"/><circle cx="100" cy="100" r="8" fill="#5a3412"/>${T(100, 50, 'CALLUM\'S', 20, '#1a1aaa', null, { f: HAND, w: 700, sw: 0, t: 'rotate(-6 100 50)' })}${T(100, 74, 'SHAREWARE MIX!!!', 15, '#1a1aaa', null, { f: HAND, w: 700, sw: 0, t: 'rotate(-4 100 74)' })}${T(100, 146, 'DEMOS + LEVELS', 12, '#c00000', null, { f: HAND, w: 700, sw: 0, t: 'rotate(3 100 146)' })}${T(100, 166, 'DO NOT SCRATCH (JACK)', 11, '#c00000', null, { f: HAND, w: 700, sw: 0, t: 'rotate(3 100 166)' })}<path d="M150 120q10 6 4 14" stroke="#1a1aaa" fill="none" stroke-width="2"/></svg>`;
    if (b.kind === 'sleeve') return `<svg viewBox="0 0 200 200" class="dc-svg"><rect x="4" y="4" width="192" height="192" fill="#f4f4ec" stroke="#999"/><circle cx="100" cy="112" r="56" fill="#dde" stroke="#bbb"/><circle cx="100" cy="112" r="56" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 5"/><circle cx="100" cy="112" r="10" fill="#f4f4ec" stroke="#bbb"/>${T(100, 34, 'DIRECTX 6.1', 24, '#2a2aaa', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })}${T(100, 52, 'REQUIRED FOR ALL GAMES!!!', 11, '#c00000', null, { f: 'Arial,sans-serif', sw: 0 })}${T(100, 190, 'FREE WITH THIS MONTH\'S ISSUE', 9, '#666', null, { f: 'Arial,sans-serif', w: 400, sw: 0 })}</svg>`;
    if (b.kind === 'floppy') return `<svg viewBox="0 0 200 200" class="dc-svg"><path d="M14 10h160l14 14v166H14z" fill="#2a2a2a" stroke="#000" stroke-width="2"/><rect x="50" y="10" width="96" height="58" fill="#c8c8c8" stroke="#000"/><rect x="112" y="16" width="20" height="46" fill="#2a2a2a"/><rect x="34" y="94" width="132" height="92" fill="#fff" stroke="#000"/><rect x="34" y="94" width="132" height="10" fill="#e10600"/>${T(100, 130, titleOf(b).replace(/ \(floppy\)$/, '').toUpperCase().slice(0, 18) + ' v1.2', 14, '#1a1aaa', null, { f: HAND, w: 700, sw: 0 })}${T(100, 150, 'DISK 1 OF 1', 12, '#1a1aaa', null, { f: HAND, w: 700, sw: 0 })}${T(100, 170, 'SHAREWARE - PLEASE COPY!', 10, '#c00000', null, { f: HAND, w: 700, sw: 0 })}<rect x="160" y="174" width="8" height="8" fill="#000"/></svg>`;
    if (b.kind === 'cart') return `<svg viewBox="0 0 200 200" class="dc-svg"><path d="M30 20h140v110l-10 10v40H40v-40l-10-10z" fill="#8a8a8a" stroke="#000" stroke-width="2"/><path d="M40 30h120v90H40z" fill="#7a7a7a" stroke="#555"/><path d="M50 40h100v70H50z" fill="#ddd" stroke="#555"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${60 + i * 20} 150v24" stroke="#555" stroke-width="3"/>`).join('')}${T(100, 70, 'LUKE', 26, '#fff', '#000', { f: HAND, w: 700, sw: 2, t: 'rotate(-6 100 70)' })}${T(100, 98, '(TIPP-OX)', 12, '#555', null, { f: HAND, w: 700, sw: 0 })}</svg>`;
    const big = b.kind === 'big', H = big ? 270 : 200;
    let s = `<svg viewBox="0 0 200 ${H}" class="dc-svg">`;
    const painted={city:'city',keepa:'dungeon',podracer:'hover'}[b.id];
    s += (painted&&window.PrintArt?.svg(painted,0,0,200,H)) || (big ? SCENE[b.scene](u) : jewelArt(b, u));
    s += `<g>${b.logo(u, b)}</g>`;
    if (b.sticker && !demoBox(b)) s += burst(158, big ? 118 : 120, big ? 27 : 22, b.sticker[1], b.sticker[0], big ? 7 : 6, -12);
    if (big) {
      s += `<rect y="246" width="200" height="24" fill="#111"/><rect y="246" width="200" height="2" fill="${b.c2}"/>${T(6, 262, byOf(b), 9, '#fff', null, { f: 'Arial,sans-serif', w: 700, a: 'start', sw: 0 })}<circle cx="168" cy="258" r="8" fill="#ccc" stroke="#888"/><circle cx="168" cy="258" r="2.5" fill="#111"/>${T(184, 262, 'CD', 9, '#fff', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })}`;
      s += `<g transform="translate(6 212)"><rect width="22" height="28" fill="#fff" stroke="#000" stroke-width="1.5"/>${T(11, 9, 'AGES', 6, '#000', null, { f: 'Arial,sans-serif', sw: 0 })}${T(11, 23, b.age || '3+', 12, '#000', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })}</g>`;
      s += T(194, 240, 'JackOS 95/98', 8, '#fff', '#000', { f: 'Arial,sans-serif', a: 'end', sw: 2 });
    } else {
      s += `<rect y="186" width="200" height="14" fill="rgba(0,0,0,.7)"/>${T(6, 196, byOf(b), 8, '#fff', null, { f: 'Arial,sans-serif', w: 700, a: 'start', sw: 0 })}${T(194, 196, 'CD-ROM', 8, '#fff', null, { f: 'Arial Black,Arial,sans-serif', a: 'end', sw: 0 })}`;
    }
    if (demoBox(b) && !big) s += `<rect y="164" width="200" height="20" fill="#e10600" stroke="#fff" stroke-width="1.5"/>${T(100, 178, 'DEMO DISC - FULL GAME ' + fullOut(b).replace(/ 1999$/, '').toUpperCase(), 10, '#fff', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })}`;
    else if (demoBox(b)) s += `<g transform="rotate(32 160 40)"><rect x="96" y="28" width="140" height="22" fill="#e10600" stroke="#fff" stroke-width="2"/>${T(166, 44, 'DEMO DISC', 14, '#fff', null, { f: 'Arial Black,Arial,sans-serif', sw: 0 })}</g>`;
    if (b.houseOwner === 'mate3') s += callumSticker(big ? 168 : 150);
    return s + '</svg>';
  }
  // ---- spines (UK style: read bottom to top)
  function spine(b) {
    const t = titleOf(b).replace(/ \((CD-R|floppy|cover CD)\)$/, '');
    const st = `--a:${b.c1};--b:${b.c2};--c:${b.c3}`;
    return `<button type="button" class="dc-sp dc-${b.kind}${S.cd === b.id ? ' dc-out' : ''}" data-b="${b.id}" style="${st}" title="${esc(titleOf(b))}"><span class="dc-spt"${t.length > 17 ? ` style="font-size:${t.length > 20 ? 9 : 10}px"` : ''}>${esc(t)}</span>${b.kind === 'big' ? `<span class="dc-spl">${b.game || b.app ? (b.age || '') : ''}</span>` : ''}${b.houseOwner === 'mate3' ? `<span class="dc-spc">${esc(Cast.n('mate3')[0])}'s</span>` : ''}</button>`;
  }
  // ---- the back of the box
  function back(b) {
    const g = b.game ? GAMES[b.game] : null, shots = SHOT[b.scene] ? [0, 1, 2].map(i => `<svg viewBox="0 0 160 100" class="dc-shot">${SHOT[b.scene](i)}</svg>`).join('') : '';
    const req = g ? g.req : (b.kind === 'big' || b.kind === 'jewel') ? 'Pent-Yum 133, 16 MB RAM, 4x CD-ROM' : '';
    const free = b.demoOf ? `<div class="dc-free">Includes FREE demo of <b>${esc(b.demoOf)}</b>!</div>` : '';
    const bars = [...Array(34)].map((_, i) => `<rect x="${i * 3}" y="0" width="${1 + (i * 7 % 3 === 0 ? 1 : 0)}" height="${i % 9 ? 26 : 30}"/>`).join('');
    if (b.kind === 'cdr' || b.kind === 'sleeve' || b.kind === 'floppy' || b.kind === 'cart') return `<div class="dc-back dc-backplain"><div class="dc-bt">${esc(titleOf(b))}</div><p>${esc(b.blurb)}</p>${b.kind === 'cdr' ? `<p class="dc-hand">"if you lose this I will actually cry" - ${esc(Cast.n('mate3')[0])}</p>` : ''}</div>`;
    return `<div class="dc-back" style="--a:${b.c1};--b:${b.c2};--c:${b.c3}"><div class="dc-bt">${esc(titleOf(b))}${demoBox(b) ? ' <span class="dc-demo">DEMO</span>' : ''}</div><p class="dc-blurb">${esc(b.blurb)}</p>${shots ? `<div class="dc-shots">${shots}</div>` : ''}<ul>${(b.feats || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>${(b.quotes || []).map(q => `<div class="dc-q">${esc(q[0])} <i>- ${esc(q[1])}</i></div>`).join('')}${free}
${req ? `<div class="dc-req"><b>MINIMUM SYSTEM REQUIREMENTS</b><br>JackOS 95 or JackOS 98. ${esc(req)}. Sound Bluster compatible sound card. Mouse.${b.discs === 2 ? ' 2 CD-ROMs.' : ''}</div>` : ''}
<div class="dc-keyrow">${pidOf(b) && !b.mag ? `<span class="dc-key">CD KEY<br><b>${cdKey(b)}</b></span>` : '<span></span>'}<svg viewBox="0 0 102 30" class="dc-bar">${bars}</svg></div>
<div class="dc-fine">${g ? `${esc(g.n)} &copy; 1999 ${esc(g.by)}. ` : ''}All rights reserved. Unauthorised copying, hiring, lending (CALLUM) or public performance prohibited.${b.fine ? ' ' + esc(b.fine) : ''} Made in the UK. Ages ${esc(b.age || '3+')}.</div></div>`;
  }

  // ================================================================ state: which disc is in drive D:
  const S = Object.assign({ cd: 'cover7', scr: { rts: 1 }, d2: {}, n: {}, dx: 0, gave: {}, ej: [] }, store.get('jhp_discs', {}));
  ['scr', 'd2', 'n', 'gave'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
  if (!Array.isArray(S.ej)) S.ej = [];
  if (S.cd && S.cd !== 'cover7' && !BOX[S.cd] && !/^pm\./.test(S.cd)) S.cd = 'cover7'; // (pm.*: js/pm-media.js's discs, registered later)
  const saveS = () => store.set('jhp_discs', S);
  const UIS = new Set(); // open cupboard redraws
  const redraw = () => { UIS.forEach(f => { try { f(); } catch (e) { console.error(e); } }); patchExplorers(); };
  const labelOf = id => id === 'cover7' ? 'JACKATTACK7' : id && BOX[id] ? BOX[id].label : id && EXT[id] ? EXT[id].label : '';
  let spinning = 0;
  const spin = ms => { spinning++; redraw(); setTimeout(() => { spinning--; redraw(); }, ms || 900); sfx('turn'); };
  function insert(id, then, o) {
    o = o || {};
    const b = BOX[id] || EXT[id]; if (!b) return;
    if (window.PM && PM.mayInsert && !PM.mayInsert(id, o)) return; // (js/pm-media.js: is it on your shelf?)
    if (b.kind === 'cart') { A.secret('disc.n64'); sfx('thud'); return msg('Drive D:', 'You try to push {mate2}\'s cartridge into the CD-ROM drive.\n\nIt does not go in.\n\nIt is a cartridge. The CD-ROM drive takes CDs. ({mate2} says it would work if you blew on it first. {mate2} is wrong.)', 'warn'); }
    if (b.kind === 'floppy') { sfx('thud'); toast('Drive A:', `Clunk. The ${titleOf(b).replace(/ \(floppy\)$/, '')} floppy is in drive A:. (It's already installed on C:, so just play it.)`, 4000); if (then) then(); return; }
    if (S.cd === id) { if (then) then(); else if (!o.quiet) autorun(b); return; }
    const old = S.cd;
    S.cd = id; saveS(); spin(1100);
    if (old && old !== id && BOX[old] && !o.quiet) toast('Drive D:', `Out comes ${labelOf(old)}. In goes ${b.label}. Whirrrr...`, 2500);
    setTimeout(() => { redraw(); if (then) then(); else if (!o.quiet) autorun(b); }, 900);
  }
  function eject() {
    const now = Date.now(); S.ej = S.ej.filter(t => now - t < 15000).concat([now]);
    if (S.ej.length >= 5) { S.ej = []; saveS(); A.secret('disc.tray'); return msg('Drive D:', 'STOP PLAYING WITH THE CD TRAY.\n\nIt is not a cup holder.\n\n({mate1} put a can of pop on it once. Once.)', 'warn'); }
    if (!S.cd) { sfx('click'); saveS(); return toast('Drive D:', 'The drive is empty. The tray slides out, sits there, and slides back in.', 3000); }
    const b = BOX[S.cd] || EXT[S.cd];
    if (b && S.cd !== 'cover7' && Math.random() < 0.05 && !S.scr[b.id]) { S.scr[b.id] = 1; toast('Oops', `You left ${b.label} out of its case and it slid off the desk. Scrrrrtch.`, 4000); }
    S.cd = ''; saveS(); sfx('thud'); redraw();
  }
  // "Cannot read from drive D:" - Abort, Retry, Fail?
  function readCheck(b, ok, fail) {
    if (!S.scr[b.id] || Math.random() > 0.45) return ok();
    A.secret('disc.scratch'); spin(1500);
    let tries = 0;
    const ask = () => msg('Drive D:', `Cannot read from drive D:.\n\nThe disc "${b.label}" may be scratched, dirty or upside down.\n\nAbort, Retry, Fail?`, 'warn', [['Abort', () => fail && fail()], ['Retry', () => { tries++; spin(1200); setTimeout(() => (Math.random() < 0.55 || tries >= 3) ? ok() : ask(), 900); }], ['Fail', () => { msg('Drive D:', 'Fail.\n\nIt failed. You chose Fail, so it did. Well done.\n\n(Try polishing the disc on your jumper. In the Games Cupboard.)', 'info'); if (fail) fail(); }]]);
    setTimeout(ask, 1000);
  }
  function polish(b, after) {
    const d = A.ui.dialog('Polishing ' + b.label, `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center"><div class="dc-polish"></div><div>Rubbing the disc on your jumper. Round and round. (Not across! Everyone knows you go from the middle outwards.)<div class="dc-pbar" style="margin-top:8px"></div></div></div>`, [['Stop']], { w: 360, icon: ic16(J('cdrom')) });
    const set = A.ui.progBar(qs(d.b, '.dc-pbar')); let f = 0;
    const iv = setInterval(() => { if (d.w.closed) return clearInterval(iv); f += 0.08; set(f); if (f >= 1) { clearInterval(iv); d.w.close(); const fixed = Math.random() < 0.7 || S.scr[b.id] > 1; if (fixed) { delete S.scr[b.id]; A.secret('disc.polish'); toast('Polished!', `${b.label} is all shiny. It should read now. (Your jumper is now 5% disc.)`, 4000); } else { S.scr[b.id] = 2; msg('Hmm', 'Still a bit scratchy. {mate1} says toothpaste works. Try polishing it again.', 'info'); } saveS(); redraw(); if (after) after(); } }, 160);
  }
  // ================================================================ disc files, readmes, manuals
  const readmeText = b => {
    if (b.kind === 'cdr' || b.kind === 'sleeve' || b.kind === 'floppy') return b.readme;
    const g = b.game ? GAMES[b.game] : null, n = titleOf(b);
    return `${n.toUpperCase()}\n${'='.repeat(n.length)}\n${g ? `Version ${g.v}${demoBox(b) ? ' DEMO' : ''}   ${g.by}\n` : ''}\n${b.blurb}\n\nINSTALLING\n  Put the CD in drive D:. If AutoPlay is on, the menu appears.\n  Click Install. If it doesn't appear, run D:\\SETUP.EXE.\n${b.discs === 2 ? '  Setup will ask for Disc 2 halfway through. Have it ready.\n' : ''}${b.needCD ? '  The CD must be in the drive to play.\n' : ''}\nSYSTEM REQUIREMENTS\n  ${g ? g.req : 'Pent-Yum 133, 16 MB RAM, 4x CD-ROM'}\n  JackOS 95 or JackOS 98, DirectX 6.1 (on this CD)\n\nKNOWN PROBLEMS\n  - If the game runs slowly, close all other programs. Especially the virtual pet.\n  - "Cannot read from drive D:": clean the disc with a soft cloth (or a jumper).\n  - If your screen goes black, wait. It's loading. It's a CD-ROM.\n${demoBox(b) ? `\nTHIS IS A DEMO\n  The full game is ${fullOut(b)}. Pester your Mom now.\n` : ''}\n${b.readme ? '----------------------------------------------\n' + b.readme + '\n' : ''}`;
  };
  // the game-specific pages of each little booklet (keep these in step with each game's own Help > Keys)
  const MANUAL = {
    rts: `
THE LEARNING CAMPAIGN
  New to the Ages? Sir Reginald, the Royal Advisor, walks you through
  gathering, building, training, the Castle Age and your first battle.
  Then try the Campaign: Dave's Big Push, The Rupee Rush, Two Against
  Callum and the siege of Callum's Keep.

THE BASICS
  Villagers gather food (berry bushes, farms), wood and gold. Gold
  mines are full of Rupees. Houses let you have more people.
  Spearmen beat Riders. Archers beat Spearmen. Riders beat Archers.
  The Blacksmith makes everybody tougher.

KEYS
  Left click / drag ...... select / box-select
  Right click ............ move, gather, build, repair, attack
  Q W E R T Y U I ........ the buttons in the bottom-right
  A then click ........... attack-move        S ...... stop
  G then click ........... rally point        H ...... Town Centre
  . (full stop) .......... next idle Villager , ...... whole army
  Ctrl+1-9 / 1-9 ......... make / pick a control group
  Space .................. look at what's selected
  P ...... pause   Enter ...... chat   ? ...... all the keys

PLAYING OVER JACKNET
  Click PLAY ONLINE on the title screen. If somebody is already
  waiting you join them; if not, your name goes up in the "Who wants
  to play?" lobby. 1 against 1, everybody for themselves (up to 4) or
  2 against 2, with computer players in any empty seats. People who
  turn up late can watch. If somebody's modem drops, the game waits
  for them; if they don't come back, the computer runs their town.`,
    keepa: `
YOUR MENTOR
  A deep voice will teach you the ways of evil: digging, claiming,
  gold, the Treasury, the Portal, Lairs, Hatcheries and the Hand.
  (Help > Mentor's Lessons if you want him back.)

THE BASICS
  Mark earth with the Dig tool and your imps dig it out. Build a Lair
  and a Hatchery and beasts come through the Portal. Every beast has a
  favourite room: the Beasts tab says what each one wants. Pay day
  comes round fast. Heroes come through the Gate: build traps and
  doors in the Workshop, and use Call to Arms to send everybody in.

KEYS
  Arrow keys ..... look around      Home ..... your Dungeon Heart
  D / H / S ...... Dig / Hand / Slap (right-click slaps too)
  R T M B ........ Rooms / Traps / Spells / Beasts tabs
  1 - 9 .......... pick a button    X ........ brush size
  G .............. jump to the heroes
  F .............. game speed       P/Space .. pause
  Ctrl+Z ......... undo your last build (within 20 seconds)

JACKNET DUNGEONS
  Members can put their dungeon on JackNet. Anybody can take the tour,
  or lead a party of heroes in a RAID on somebody else's dungeon and
  try to smash the Heart. The owner sees how many raids it has held off.`,
  };
  const manualText = b => Cast.t(`${titleOf(b).toUpperCase()} - QUICK START MANUAL\n\n(the little booklet inside the box. Somebody has drawn a moustache on the man on page 3)\n\nYOUR CD KEY: ${cdKey(b)}\n(You will need this to install. Do not lose it. Do not let {mate3} "borrow" it.)\n\nGETTING STARTED\n  1. Insert the disc.\n  2. Click Install.\n  3. Wait.\n  4. Wait a bit more.\n  5. Play!\n\n${MANUAL[b.game] ? MANUAL[b.game].trim() + '\n\n' : ''}TECHNICAL SUPPORT\n  Ring 0891 999 999 (calls cost 50p per minute at all times. Ask the bill payer's permission).\n`);
  const DISCFILES = b => {
    if (b.ext) return b.files ? b.files() : [];
    if (b.kind === 'cdr') return [
      ['CALLUM.TXT', 'txt', '2 KB', () => Desk.notepad('CALLUM.TXT', b.readme)],
      ['DOSGAMES', 'dir', '', () => { const p = 'dosgames'; window.Setup && Setup.has(p) ? Setup.launch(p) : installVia(p); }],
      ['QUEST', 'dir', '', () => { const p = 'grotquest'; window.Setup && Setup.has(p) ? Setup.launch(p) : installVia(p); }],
      ['SAVES', 'dir', '', () => msg('D:\\SAVES', 'D:\\SAVES contains:\n\n  CALLUM.SAV       412 KB   (Championship Boss)\n  DONOTLOAD.SAV     12 KB\n  LEVEL12.SAV       60 KB   (Jacks: Armageddon)\n\n{mate3}\'s note on the folder: "LOOK DON\'T TOUCH"', 'info')],
      ['MIX.M3U', 'txt', '1 KB', () => Desk.notepad('MIX.M3U', Cast.t('#EXTM3U\n#{mate3}\'s mix (MIDI only, the MP3s were too big)\ntheme.mid\nkorobeiniki.mid\ndave_singing.wav  <-- DO NOT PLAY\n'))],
    ];
    if (b.kind === 'sleeve') return [['DXSETUP.EXE', 'exe', '9.7 MB', () => directx(b)], ['README.TXT', 'txt', '1 KB', () => Desk.notepad('README.TXT', b.readme)]];
    const g = b.game ? GAMES[b.game] : null, exe = (g && g.exe) || b.exe || 'GAME.EXE';
    return [
      ['AUTORUN.INF', 'txt', '1 KB', () => Desk.notepad('AUTORUN.INF', `[autorun]\nopen=SETUP.EXE /autorun\nicon=${exe},0\nlabel=${b.label}\n`)],
      ['SETUP.EXE', 'exe', '412 KB', () => autorun(b)],
      [exe, 'exe', ((g ? GAMES[b.game] : 0) ? 2 + (b.label.length % 5) : 1) + '.4 MB', () => play(b)],
      ['README.TXT', 'txt', '6 KB', () => Desk.notepad('README.TXT', readmeText(b))],
      ['MANUAL.TXT', 'txt', '3 KB', () => Desk.notepad('MANUAL.TXT', manualText(b))],
      ['DATA', 'dir', '', () => msg('D:\\DATA', `D:\\DATA contains:\n\n  DATA1.CAB     ${(g ? 120 : 40) + b.label.length * 7} MB\n  DATA2.CAB     ${(g ? 88 : 20) + b.label.length * 3} MB\n  SOUNDS.CAB    31 MB\n  MOVIES\\INTRO.AVI  44 MB  (a man in a cape says the name of the game)\n\nThere's nothing here you can open. It's all squashed.`, 'info')],
      ['DIRECTX', 'dir', '', () => directx(b)],
    ];
  };
  const installVia = pid => window.Setup && Setup.get(pid) ? Setup.install(pid, 'cd') : msg('Setup', 'Nothing to install.', 'info');
  function explore(b) {
    const bx = h(`<div class="dc-ex"><div class="field dc-exl"></div></div>`);
    const w = A.win(`${b.label} (D:)`, bx, { w: 400, h: 280, icon: ic16(J('cdrom')), status: true, minW: 240, minH: 160 });
    const files = DISCFILES(b);
    const icon = t => t === 'dir' ? J('folder') : t === 'exe' ? J('exe') : J('txt');
    qs(bx, '.dc-exl').innerHTML = files.map((f, i) => `<button type="button" class="dc-exi" data-i="${i}"><span>${ic32(icon(f[1]))}</span><span>${esc(f[0])}</span></button>`).join('');
    w.status.textContent = `${files.length} object(s)    ${b.kind === 'cdr' ? '650' : '612'} MB    CD-ROM`;
    let last = 0, lastI = -1;
    qsa(bx, '.dc-exi').forEach(e => e.addEventListener('click', () => {
      qsa(bx, '.dc-exi').forEach(x => x.classList.toggle('sel', x === e));
      const i = +e.dataset.i, now = Date.now(); w.status.textContent = `${files[i][0]}  ${files[i][2] || 'File Folder'}`;
      if (matchMedia('(hover:none)').matches || (i === lastI && now - last < 450)) { last = 0; sfx('click'); files[i][3](); } else { last = now; lastI = i; }
    }));
    return w;
  }
  function directx(b) {
    msg('DirectX 6.1 Setup', 'Welcome to setup for DirectX 6.1.\n\nThis will install DirectX 6.1 runtime components and update your display and sound drivers.\n\nDo you want to install DirectX 6.1?', 'q', [['Yes', () => {
      const dd = A.ui.dialog('DirectX Setup', '<div>Installing DirectX 6.1...</div><div class="dc-dxf small" style="margin:6px 0;white-space:nowrap;overflow:hidden">&nbsp;</div><div class="dc-dxb"></div>', [['Cancel']], { w: 340, icon: ic16(J('chip')) });
      const set = A.ui.progBar(qs(dd.b, '.dc-dxb')); let f = 0; const fl = ['DDRAW.DLL', 'DSOUND.DLL', 'D3DIM.DLL', 'DINPUT.DLL', 'DPLAYX.DLL', 'D3DRM.DLL', 'DXAPI.SYS', 'GUBBINZ3D.DRV'];
      spin(2400);
      const iv = setInterval(() => { if (dd.w.closed) return clearInterval(iv); f += 0.06; set(f); qs(dd.b, '.dc-dxf').textContent = 'Copying ' + pick(fl); if (f >= 1) { clearInterval(iv); dd.w.close(); S.dx++; saveS(); if (S.dx >= 3) A.secret('disc.dx'); msg('DirectX Setup', S.dx >= 2 ? `DirectX 6.1 is already installed.\n\nIt has now been installed ${S.dx} times. It is very, very installed.\n\nYou must restart your computer before the new settings will take effect.` : 'DirectX 6.1 installed successfully.\n\nYou must restart your computer before the new settings will take effect.', 'info', [['Restart later'], ['Restart now', () => Desk.reboot('bios')]]); } }, 180);
    }], ['No']]);
  }

  // ================================================================ installing (Quick Install, or the InstallJack wizard), Disc 2, playing
  let qBusy = false;
  function quickInstall(b, then) {
    const pid = pidOf(b);
    if (!pid || !window.Setup || !Setup.get(pid)) return then && then();
    if (Setup.has(pid)) return then && then();
    if (qBusy) return msg('Setup', 'Setup is already copying something. One thing at a time! (32 MB of RAM, remember.)', 'warn');
    insert(b.id, () => readCheck(b, run, null), { quiet: true });
    function run() {
      qBusy = true;
      const p = Setup.get(pid), kb = p.kb || 20000;
      const bx = h(`<div class="dl"><div class="dl-anim"><span class="a l">${ic32(J('cdrom'))}</span><span class="a r">${ic32(J('folder'))}</span><span class="pp">${ic16(J('txt'))}</span><span class="pp">${ic16(J('txt'))}</span><span class="pp">${ic16(J('txt'))}</span></div><div><b>${esc(titleOf(b))}</b> - Typical installation</div><div class="dc-qf" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:11px 'Courier New',monospace;margin:4px 0">&nbsp;</div><div class="dc-qb"></div><div class="small dc-qs" style="margin-top:4px">&nbsp;</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" type="button">Cancel</button></div></div>`);
      const w = A.win('Installing ' + titleOf(b), bx, { w: 380, icon: ic16(J('cdrom')), noResize: true, noMax: true, noMin: true, onClose: () => { qBusy = false; } });
      const set = A.ui.progBar(qs(bx, '.dc-qb'));
      const dir = 'C:\\Program Files\\' + (p.dir || titleOf(b));
      const files = ['DATA1.CAB', 'DATA2.CAB', 'SOUNDS.CAB', p.exe || 'GAME.EXE', 'README.TXT', 'JACK32.DLL', 'MOVIES\\INTRO.AVI', 'SAVES\\', 'UNINST.EXE'];
      const dur = clamp(2800 + Math.log10(kb + 10) * 500, 3000, 6500);
      let t0 = performance.now(), paused = 0, asked = b.discs !== 2, done = false, stop = false;
      qs(bx, '.btn').addEventListener('click', () => { stop = true; w.close(); toast('Setup', 'Setup was cancelled. Nothing was installed. (Well, a bit was. It\'s fine.)', 3000); });
      const tick = () => {
        if (stop || w.closed) return;
        const f = clamp((performance.now() - t0 - paused) / dur, 0, 1); set(f);
        qs(bx, '.dc-qf').textContent = (f < 0.5 || b.discs !== 2 ? 'D:\\' : 'D:\\DISC2\\') + files[Math.floor(f * files.length * 2) % files.length] + '  ->  ' + dir;
        qs(bx, '.dc-qs').textContent = `${Math.floor(f * 100)}%   ${(f * kb / 1024).toFixed(1)} of ${(kb / 1024).toFixed(1)} MB`;
        if (!asked && f >= 0.5) {
          asked = true; const tp = performance.now();
          sfx('beep');
          msg('Setup Needs The Next Disk', `Please insert Disc 2 of 2 (${b.label.replace(/_?DISC1$|_1$/, '')}_DISC2) into drive D:, then click OK.\n\n(It's in the other side of the case. Under the little plastic flap.)`, 'info', [['OK', () => { spin(1200); setTimeout(() => { paused += performance.now() - tp; requestAnimationFrame(tick); }, 900); }], ['Cancel', () => { stop = true; w.close(); }]]);
          return;
        }
        if (f >= 1) {
          if (done) return; done = true;
          S.d2[b.id] = 1; saveS();
          setTimeout(() => { w.close(); Setup.setInstalled(pid, true); sfx('solve'); toast('Setup complete', `${titleOf(b)} is installed! It's in Start > Programs${b.needCD ? '. Keep the CD in the drive to play.' : '.'}`, 4000); if (then) setTimeout(then, 300); }, 400);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  function needDisc2(b, next) {
    msg(titleOf(b), `Setup needs to copy a few more files from Disc 2 before you can play.\n\nPlease insert Disc 2 of 2 into drive D:, then click OK.`, 'info', [['OK', () => {
      spin(1600);
      const d = A.ui.dialog('Copying Files...', '<div>Copying files from Disc 2...</div><div class="dc-d2b" style="margin-top:6px"></div>', [], { w: 300, icon: ic16(J('cdrom')) });
      const set = A.ui.progBar(qs(d.b, '.dc-d2b')); let f = 0;
      const iv = setInterval(() => { f += 0.1; set(f); if (f >= 1 || d.w.closed) { clearInterval(iv); d.w.close(); S.d2[b.id] = 1; saveS(); msg(titleOf(b), 'Done! Please put Disc 1 back in the drive.\n\n(Swap, swap, swap. This is what CD-ROMs are like.)', 'info', [['OK', () => { spin(900); setTimeout(next, 700); }]]); } }, 150);
    }], ['Cancel']]);
  }
  function needCD(b, ok) {
    const other = S.cd && S.cd !== b.id;
    if (other) A.secret('disc.wrongdisc');
    sfx('beep');
    msg(titleOf(b), `Please insert the ${titleOf(b).toUpperCase()} disc (${b.label}) into drive D:.\n\n${other ? `The disc in drive D: is ${labelOf(S.cd)}. That's not it.` : 'Drive D: is empty.'}\n\nThe ${titleOf(b)} CD must be in the drive to play. (It's a copy-protection thing. Sorry. Blame {mate3}'s cousin.)`, 'warn',
      [['Fetch it from the cupboard', () => insert(b.id, ok, { quiet: true })], ['Retry', () => { if (S.cd === b.id) ok(); else needCD(b, ok); }], ['Cancel']]);
  }
  const OPEN = {};
  function openGame(id) {
    const b = BOX[id], g = GAMES[id];
    const live = OPEN[id]; if (live && !live.closed) { live.restore(); return live; }
    const go = () => { S.n[id] = (S.n[id] || 0) + 1; saveS(); OPEN[id] = launch(id); };
    const disc2 = next => (b.discs === 2 && !S.d2[id]) ? needDisc2(b, next) : next();
    if (b.needCD && S.cd !== id) needCD(b, () => disc2(() => readCheck(b, go)));
    else if (b.needCD || S.cd === id) disc2(() => readCheck(b, go));
    else disc2(go);
    void g;
    // (the window, when it opened straight away, so a refresh can put it back: js/boot.js)
    const nw = OPEN[id]; return nw && nw !== live && !nw.closed ? nw : undefined;
  }
  function play(b) {
    if (b.kind === 'cart' || b.kind === 'sleeve' || b.kind === 'cdr') return insert(b.id);
    if (b.id === 'cover7') return insert('cover7', () => Setup.coverDisc ? Setup.coverDisc() : 0, { quiet: true });
    if (b.app && !A.apps[b.app]) { sfx('uhoh'); return msg('Games Cupboard', `You open the ${titleOf(b)} box...\n\nIt's EMPTY. Just the manual and a Jack Burger voucher.\n\n${b.houseOwner === 'mate3' ? '{mate3} must have taken the disc back.' : '{mate1} must have borrowed the disc. Again.'} (This game isn't on this computer yet.)`, 'info'); }
    if (!installed(b)) return quickInstall(b, () => play(b));
    if (b.game) return A.open('discs.' + b.game);
    const pid = pidOf(b);
    if (b.kind === 'floppy') return Setup.launch(pid);
    if (S.cd !== b.id) insert(b.id, null, { quiet: true });
    return pid && window.Setup ? Setup.launch(pid) : A.open(b.app);
  }

  // ================================================================ autorun (the disc's own setup menu)
  function autorun(b) {
    if (b.ext) return b.autorun ? b.autorun() : explore(b);
    if (b.id === 'cover7') return window.Setup && Setup.coverDisc ? Setup.coverDisc() : null;
    if (b.kind === 'cdr') return explore(b);
    if (b.kind === 'sleeve') return directx(b);
    const pid = pidOf(b), inst = installed(b), demo = demoBox(b);
    const bx = h(`<div class="dc-ar" style="--a:${b.c1};--b:${b.c2};--c:${b.c3}"><div class="dc-ar-art">${front(b)}</div><div class="dc-ar-m"><div class="dc-ar-t">${esc(titleOf(b))}</div><div class="dc-ar-s">${demo ? 'DEMO DISC' : b.discs === 2 ? 'DISC 1 OF 2' : 'CD-ROM'} &middot; ${esc(byOf(b))}</div><div class="dc-ar-b"></div><div class="dc-ar-f">${demo ? `Full version ${esc(fullOut(b))}!` : 'Thank you for buying ' + esc(titleOf(b)) + '!' + (b.owner ? ` (${esc(b.owner)} bought it. You borrowed it.)` : '')}</div></div></div>`);
    const w = A.win(titleOf(b), bx, { w: 470, icon: b.game ? ic16(GAMES[b.game].icon) : ic16(J('cdrom')), noResize: true, noMax: true, cls: 'dc-arwin' });
    const btns = [
      inst ? ['Play', () => { w.close(); play(b); }, 'big'] : ['Install', () => { w.close(); quickInstall(b, () => play(b)); }, 'big'],
      inst ? null : ['Custom Install...', () => { w.close(); if (pid && window.Setup) Setup.install(pid, 'cd'); }],
      inst && pid && b.game ? ['Uninstall', () => { w.close(); Setup.uninstall(pid); }] : null,
      ['Explore CD', () => { w.close(); explore(b); }],
      ['Read Me', () => Desk.notepad('README.TXT', readmeText(b))],
      ['Install DirectX 6.1', () => directx(b)],
      ['Exit', () => w.close()],
    ].filter(Boolean);
    const box = qs(bx, '.dc-ar-b');
    btns.forEach(([l, fn, big]) => { const e = h(esc(l), 'dc-arbtn' + (big ? ' dc-arbig' : ''), 'button'); e.type = 'button'; e.addEventListener('click', () => { sfx('click'); fn(); }); box.appendChild(e); });
    sfx('startup');
    return w;
  }
  // ================================================================ the cupboard window
  const NOTES = [
    ['{mate2}', 'can we just play Kart Kaos on your ULTRA 64 instead??? - {mate2}', '#fff36a', -4],
    ['{mate1}', 'PC games = spreadsheets with explosions. ULTRA 64 4 EVA!!! - {mate1}', '#9fe8ff', 3],
    ['{me}', 'BORROWED OFF {mate3.NAME}: Age of Jackpires II + JRT. Give back by Friday (which Friday??)', '#ffb0d8', -2],
    ['{mate4}', '{mate4} woz ere. Your Jacks: Armageddon score is RUBBISH', '#b8ff9a', 5],
  ];
  const TOPKEYS = BOXES.filter(b => b.game || b.pid || b.pidApp).map(b => b.id);
  const MPID = { squigs: 'squigs.online', rts: 'rts.online', boss: 'boss.online' }; // live online modes (mp.js / ONLINE below)
  const SHOWS = { park: 'Visit and rate members\' parks', city: 'Visit and rate members\' cities', keepa: 'Raid members\' dungeons' }; // the JackNet Showcase
  let topCache = null;
  function cupboard() {
    A.secret('disc.cupboard');
    let sel = store.get('jhp_discs_sel', 'park'); if (!BOX[sel]) sel = 'park';
    let showBack = false;
    const bx = h(`<div class="dc">
<div class="dc-cab"><div class="dc-head">THE GAMES CUPBOARD <small>${esc(Cast.t("{me}'s. Hands off, {mate1}."))}</small></div>
<div class="dc-shelf dc-s1"></div><div class="dc-shelf dc-s2"></div>
<div class="dc-drawer"><div class="dc-knob"></div><div class="dc-dl">THE DRAWER <small>(floppies, CD-Rs and things that aren't mine)</small></div><div class="dc-ditems"></div></div>
<div class="dc-notes">${NOTES.map(n => `<div class="dc-note" style="background:${n[2]};transform:rotate(${n[3]}deg)">${esc(Cast.t(n[1]))}</div>`).join('')}</div></div>
<div class="dc-side"><div class="dc-card"></div><div class="dc-info"></div><div class="dc-btns"></div></div>
<div class="dc-foot"><div class="dc-drive"><div class="dc-dfront"><div class="dc-dslot"></div><span class="dc-led"></span><span class="dc-dbtn"></span></div><div class="lcd dc-lcd"></div><div class="dc-dctl"><button class="btn" type="button" data-d="ej">Eject</button><button class="btn" type="button" data-d="ar">AutoPlay</button><button class="btn" type="button" data-d="ex">Explore D:</button></div></div>
<div class="dc-top"><div class="dc-toph">JackNet Top Installs <small>(everyone on JackNet)</small></div><div class="dc-topl">Dialling in...</div></div></div></div>`);
    const w = A.win('The Games Cupboard', bx, { w: 900, h: 740, icon: ic16(IC.cupboard), minW: 300, minH: 300, cls: 'dc-win', onClose: () => { UIS.delete(draw); if (unwatch) unwatch.forEach(f => f()); } });
    if (isPhone()) w.el.classList.add('maxwin');
    const s1 = qs(bx, '.dc-s1'), s2 = qs(bx, '.dc-s2'), dr = qs(bx, '.dc-ditems'), card = qs(bx, '.dc-card'), info = qs(bx, '.dc-info'), btns = qs(bx, '.dc-btns');
    function draw() {
      if (w.closed) return;
      const mine=BOXES.filter(b=>store.get('jhp_starter',0)!==1||window.PM?.owns(b.id));
      if(!mine.some(b=>b.id===sel))sel=mine[0]?.id;
      s1.innerHTML = mine.filter(b => b.kind === 'big').map(spine).join('');
      s2.innerHTML = mine.filter(b => b.kind === 'jewel').map(spine).join('') + '<span class="dc-gap"></span><span class="dc-mags"></span>';
      dr.innerHTML = mine.filter(b => !/^(big|jewel)$/.test(b.kind)).map(b => `<button type="button" class="dc-di${S.cd === b.id ? ' dc-out' : ''}" data-b="${b.id}" title="${esc(titleOf(b))}">${front(b)}<span>${esc(titleOf(b).replace(/ \(.*\)$/, ''))}</span></button>`).join('');
      qsa(bx, '[data-b]').forEach(e => { e.classList.toggle('sel', e.dataset.b === sel); e.addEventListener('click', () => { sfx('click'); if (sel !== e.dataset.b) { sel = e.dataset.b; showBack = false; store.set('jhp_discs_sel', sel); } draw(); if (isPhone()) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
      const b = BOX[sel];
      if(!b){card.textContent='Your collection starts here.';info.textContent='No PC games owned yet. Earn pocket money and visit Pixel Post.';btns.replaceChildren();return;}
      card.className = 'dc-card dc-c-' + b.kind + (showBack ? ' dc-showback' : '');
      card.innerHTML = showBack ? back(b) : front(b);
      const pid = pidOf(b), inst = installed(b), isIn = S.cd === b.id;
      const lines = [];
      if (b.game || b.pid || b.pidApp) lines.push(b.app && !A.apps[b.app] ? '<span class="dc-bad">Box is empty (disc missing)</span>' : inst ? '<span class="dc-ok">&#10004; Installed</span>' : '<span class="dc-no">Not installed</span>');
      if (demoBox(b)) lines.push(`<span class="dc-no">Demo disc: full game ${esc(fullOut(b))}</span>`);
      if (b.needCD) lines.push('Needs the CD in the drive to play');
      if (b.discs === 2) lines.push('2 discs');
      if (b.owner) lines.push(`<span class="dc-own">Borrowed from ${esc(b.owner)}${S.gave[b.id] ? ' (and re-borrowed)' : ''}</span>`);
      if (S.scr[b.id]) lines.push('<span class="dc-bad">Scratched!</span>');
      if (isIn) lines.push('<b>In drive D:</b>');
      if (S.n[b.game]) lines.push(`Played ${S.n[b.game]} time${S.n[b.game] === 1 ? '' : 's'}`);
      const mpId = MPID[b.game], mpN = mpId && window.MP ? MP.count(mpId) : 0;
      if (mpId && window.MP) lines.push(`<span class="dc-net">&#9679; Plays online over JackNet</span>${mpN ? ` <b class="dc-ok">${mpN} playing now</b>` : ''}`);
      if (SHOWS[b.game]) lines.push(`<span class="dc-net">&#9679; ${esc(SHOWS[b.game])} on JackNet</span>`);
      info.innerHTML = `<div class="dc-it">${esc(titleOf(b))}</div><div class="dc-iby">${esc(byOf(b))}</div><div class="dc-il">${lines.join('<br>')}</div>`;
      const bl = [];
      const playable = b.game || b.pid || b.pidApp;
      if (playable) bl.push([inst ? 'Play' : (b.app && !A.apps[b.app]) ? 'Play' : 'Install & Play', () => play(b), 'dc-main']);
      if (mpId && window.MP && inst) bl.push(['Play Online', () => playOnline(mpId)]);
      if (b.kind === 'cdr' || b.kind === 'sleeve') bl.push(['Put it in drive D:', () => insert(b.id), 'dc-main']);
      if (b.kind === 'cart') bl.push(['Put it in drive D:', () => insert(b.id), 'dc-main']);
      if (b.kind !== 'floppy' && b.kind !== 'cart' && b.kind !== 'cdr' && b.kind !== 'sleeve') bl.push(isIn ? ['Eject disc', eject] : ['Insert disc', () => insert(b.id)]);
      bl.push([showBack ? 'Look at the front' : 'Turn it over', () => { showBack = !showBack; if (showBack) A.secret('disc.flip'); card.classList.add('dc-turn'); setTimeout(draw, 120); setTimeout(() => card.classList.remove('dc-turn'), 300); }]);
      if (b.kind !== 'cart') bl.push(['Read Me', () => Desk.notepad('README.TXT', readmeText(b))]);
      if (pid && b.game) bl.push(['Manual', () => Desk.notepad('MANUAL.TXT', manualText(b))]);
      if (S.scr[b.id]) bl.push(['Polish on jumper', () => polish(b)]);
      if (b.houseOwner === 'mate3') bl.push(['Give it back to {mate3}', () => { A.secret('disc.callum'); S.gave[b.id] = (S.gave[b.id] || 0) + 1; saveS(); msg('{mate3}', pick(['You give {mate3} {mate3.his} disc back.\n\n{mate3}: "finally. you can borrow it again if you want, I\'ve finished it"\n\nYou put it straight back in the cupboard.', '{mate3}: "is it scratched? IT\'S SCRATCHED. oh wait that was me. never mind, keep it till Friday"', '{mate3}: "cheers. can I borrow Jacks: Armageddon then? no? fine. keep it"']), 'info'); draw(); }]);
      if (b.houseOwner === 'mate2') bl.push(['Give it back to {mate2}', () => msg('{mate2}', '{mate2}: "nah keep it here, then I\'ve got a reason to come round. have you got any crisps"', 'info')]);
      btns.innerHTML = '';
      bl.forEach(([l, fn, c]) => { const e = h(esc(Cast.t(l)), 'btn ' + (c || ''), 'button'); e.type = 'button'; e.addEventListener('click', fn); btns.appendChild(e); });
      // the drive
      qs(bx, '.dc-lcd').textContent = 'D: ' + (S.cd ? labelOf(S.cd) : '[EMPTY]') + (S.cd && S.scr[S.cd] ? ' *' : '');
      qs(bx, '.dc-led').classList.toggle('on', spinning > 0);
      qs(bx, '.dc-dslot').classList.toggle('full', !!S.cd);
      w.status && (w.status.textContent = '');
    }
    UIS.add(draw); draw();
    qs(bx, '[data-d=ej]').addEventListener('click', eject);
    qs(bx, '[data-d=ar]').addEventListener('click', () => { if (!S.cd) return msg('Drive D:', 'D:\\ is not accessible.\n\nThe device is not ready.\n\n(There is no disc in it.)', 'warn'); const b = BOX[S.cd]; readCheck(b, () => autorun(b)); });
    qs(bx, '[data-d=ex]').addEventListener('click', () => openD(true));
    // JackNet Top Installs (shared)
    const topl = qs(bx, '.dc-topl');
    const drawTop = vals => {
      const rows = TOPKEYS.map(id => [id, +(vals['disc.inst.' + id]) || 0]).sort((a, c) => c[1] - a[1]).slice(0, 6);
      const mx = Math.max(1, ...rows.map(r => r[1]));
      topl.innerHTML = rows.map(([id, n], i) => `<div class="dc-tr"><span class="dc-tn">${i + 1}. ${esc(titleOf(BOX[id]))}</span><span class="dc-tb"><i style="width:${Math.max(2, n / mx * 100)}%;background:${BOX[id].c3}"></i></span><span class="dc-tc">${n}</span></div>`).join('') || 'Nobody has installed anything yet. Be the first!';
    };
    let unwatch = null;
    if (window.Net && Net.kv) {
      if (topCache) drawTop(topCache);
      Net.kv.get(TOPKEYS.map(id => 'disc.inst.' + id)).then(v => { topCache = Object.assign(topCache || {}, v || {}); if (!w.closed) drawTop(topCache); });
      unwatch = TOPKEYS.map(id => Net.kv.watch('disc.inst.' + id, ev => { if (ev.type === 'set') { topCache = topCache || {}; topCache[ev.k] = ev.v; if (!w.closed) drawTop(topCache); } }));
      setTimeout(() => { if (!topCache && !w.closed) drawTop({}); }, 2500);
    } else drawTop({});
    return w;
  }

  // ================================================================ drive D: in My Computer (apps-files.js owns Explorer; we relabel it)
  function openD(force) {
    if (!S.cd) { sfx('beep'); return msg('D:\\', 'D:\\ is not accessible.\n\nThe device is not ready.', 'warn'); }
    if (S.cd === 'cover7') return force ? A.open('explorer', 'D:\\') : (window.Setup && Setup.coverDisc ? Setup.coverDisc() : A.open('explorer', 'D:\\'));
    const b = BOX[S.cd] || EXT[S.cd]; if (!b) return; readCheck(b, () => force ? explore(b) : autorun(b));
  }
  const dLabel = () => S.cd === 'cover7' ? 'JACK ATTACK! CD (D:)' : S.cd ? labelOf(S.cd) + ' (D:)' : 'CD-ROM Drive (D:)';
  function patchExplorer(win) {
    qsa(win, '.fx-it').forEach(it => {
      const lb = qs(it, '.fx-lb') || qs(it, '.fx-nm > span:last-child'); if (!lb) return;
      if (!it.dataset.dgcd) { if (!/\(D:\)$/.test(lb.textContent)) return; it.dataset.dgcd = '1'; }
      const want = dLabel(); if (lb.textContent !== want) lb.textContent = want; if (it.title && it.title !== want) it.title = want;
    });
    const web = qs(win, '.fx-web');
    if (web && S.cd !== 'cover7' && /JACK ATTACK! C(over Disc #7|D \(D:\))/.test(web.innerHTML)) web.innerHTML = web.innerHTML.replace(/JACK ATTACK! Cover Disc #7<br>650MB CD-ROM/, S.cd ? `${esc(titleOf(BOX[S.cd] || EXT[S.cd] || { ext: true, title: 'CD-ROM' }))}<br>${esc(labelOf(S.cd))}<br>CD-ROM` : 'No disc in the drive.').split('JACK ATTACK! CD (D:)').join(esc(dLabel()));
  }
  const watched = new WeakSet();
  function patchExplorers() {
    qsa(document, '.fxwin').forEach(win => {
      if (!watched.has(win)) { watched.add(win); const m = qs(win, '.fx-main'); if (m) new MutationObserver(() => patchExplorer(win)).observe(m, { childList: true, subtree: true }); }
      patchExplorer(win);
    });
  }
  const bodyObs = new MutationObserver(muts => { if (muts.some(m => [...m.addedNodes].some(n => n.classList && n.classList.contains('fxwin')))) patchExplorers(); });
  if (document.body) bodyObs.observe(DesktopSurface.root(), { childList: true });
  // double-click / Enter on the relabelled drive: our disc's AutoPlay instead of the cover disc
  let lastIt = null, lastT = 0;
  document.addEventListener('click', ev => {
    if (S.cd === 'cover7') return;
    const it = ev.target.closest && ev.target.closest('.fxwin .fx-it[data-dgcd]'); if (!it) return;
    const now = Date.now();
    if (matchMedia('(hover:none)').matches || (it === lastIt && now - lastT < 450)) { ev.stopPropagation(); ev.preventDefault(); lastT = 0; lastIt = null; openD(); }
    else { lastIt = it; lastT = now; }
  }, true);
  document.addEventListener('keydown', ev => {
    if (S.cd === 'cover7' || ev.key !== 'Enter') return;
    const l = ev.target.closest && ev.target.closest('.fxwin .fx-list'); if (!l || !qs(l, '.fx-it.sel[data-dgcd]')) return;
    ev.stopPropagation(); ev.preventDefault(); openD();
  }, true);
  document.addEventListener('submit', ev => {
    if (S.cd === 'cover7') return;
    const f = ev.target.closest && ev.target.closest('.fxwin .fx-addr'); if (!f) return;
    const v = (qs(f, 'input') || {}).value || '';
    if (/^d:\\?\/?$/i.test(v.trim())) { ev.stopPropagation(); ev.preventDefault(); openD(true); }
  }, true);
  // Run: d:, autorun, eject
  const origD = A.cmds['d:'], origAuto = A.cmds['autorun'];
  A.cmd(['d:', 'd:\\', 'd:/'], raw => S.cd === 'cover7' && origD ? origD(raw) : openD(true));
  A.cmd(['autorun', 'd:\\setup.exe', 'd:\\autorun.exe'], raw => S.cd === 'cover7' && origAuto ? origAuto(raw) : openD());
  A.cmd(['eject', 'eject d:'], () => eject());
  A.cmd(['dxsetup', 'directx', 'dxdiag'], () => directx(BOX.dx61));

  // ================================================================ register: products, programs, Start menu, desktop
  const GAMEIDS = ['park', 'city', 'squigs', 'rts', 'boss', 'keepa'];
  GAMEIDS.forEach(id => {
    const g = GAMES[id], b = BOX[id], demo = isDemo(g);
    A.register('discs.' + id, { open: () => openGame(id) });
    if (window.Setup && Setup.product) Setup.product('disc.' + id, {
      n: g.n + (demo ? ' Demo' : ''), v: g.v, kb: b.kb, lic: demo ? 'Demo' : 'Commercial', by: g.by, cat: 'games', sq: 5, rel: g.rel, ic: 'cd',
      d: b.blurb.split('! ')[0].replace(/!?$/, '!') + ' CD-ROM only.', note: b.owner ? `(This copy belongs to ${b.owner}.)` : '',
      apps: ['discs.' + id], paths: [g.n + ' >'], def: false, nodl: true, disc: g.n + ' CD-ROM' + (b.discs === 2 ? ' (Disc 1 of 2)' : ''), exe: g.exe, dir: g.n.replace(/[:!]/g, ''), launch: 'discs.' + id,
    });
    A.addProgram([g.n, g.n + (demo ? ' Demo' : '')], 'discs.' + id, ic16(g.icon));
    A.addProgram([g.n, 'Read Me'], () => Desk.notepad('README.TXT', readmeText(b)), ic16(J('txt')));
    A.addProgram([g.n, 'Uninstall ' + g.n], () => Setup.uninstall('disc.' + id), ic16(J('addrem')));
  });
  A.register('discs.cupboard', { single: true, cmd: ['cupboard', 'discs', 'games cupboard', 'gamescupboard'], open: cupboard });
  A.addProgram(['Games', 'Games Cupboard'], 'discs.cupboard', ic16(IC.cupboard));
  A.desktopIcon('Games Cupboard', IC.cupboard, () => A.open('discs.cupboard'), 'dgIconCupboard');
  A.fs.add('C:/My Documents', { name: 'games i have borrowed.txt', type: 'txt', date: '02/10/99', size: '1 KB', text: Cast.t(`GAMES I HAVE BORROWED (so I give them back)\n===========================================\n\nOFF {mate3.NAME}:\n  - Age of Jackpires II (both discs. disc 1 was scratched WHEN I GOT IT)\n  - Jackreal Tournament\n  - {mate3.his} shareware CD-R ({mate3.he} says "guard it with your life")\n\nOFF {mate2.NAME}:\n  - a cartridge (it's for {mate2.his} ULTRA 64. I haven't got an ULTRA 64. {mate2} knows this.)\n\nLENT TO {mate1.NAME}:\n  - nothing. never again. {mate1.he} still has my pod racing cover disc from MAY\n\nAll in the Games Cupboard (desktop, or type CUPBOARD in Run).\n`), secret: null });
  document.addEventListener('setup', ev => {
    const d = ev.detail || {}; if (!d.on) { redraw(); return; }
    const b = BOXES.find(x => pidOf(x) === d.id);
    if (b) { try { Net.kv.inc('disc.inst.' + b.id); } catch (e) {} if (b.game && GAMEIDS.every(id => window.Setup && Setup.has('disc.' + id))) A.secret('disc.allnew'); }
    redraw();
  });
  [['cupboard', 'The cupboard under the desk', 'Find where you keep your PC games'],
    ['flip', 'Read the back of the box', 'Turn a game box over. The screenshots are always better than the game.'],
    ['scratch', 'Abort, Retry, Fail?', 'Try to read a scratched disc'],
    ['polish', 'Jumper polish', 'Rescue a scratched disc the traditional way'],
    ['wrongdisc', 'Wrong disc', 'Try to play a game with a different disc in the drive'],
    ['dx', 'DirectX 6.1 (again) (again)', 'Install DirectX from a game disc three times'],
    ['n64', 'Wrong console', 'Try to put something in the CD-ROM drive that really, really won\'t fit'],
    ['callum', 'Honest borrower', 'Give something back to its owner'],
    ['tray', 'It\'s not a cup holder', 'Play with the CD tray. A lot.'],
    ['allnew', 'Full cupboard', 'Install every new game from the cupboard'],
  ].forEach(([k, n, hint]) => A.defineSecret('disc.' + k, n, hint));
  // ================================================================ cupboard CSS
  const css2 = h(null, null, 'style'); css2.id = 'discs-cup-css';
  css2.textContent = `
.dc-win > .appbody{padding:0;background:#5a3412;overflow:hidden}
.dc{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 270px;grid-template-rows:minmax(0,1fr) auto;font:11px/1.35 Tahoma,"MS Sans Serif",sans-serif;color:#000}
.dc-cab{position:relative;overflow:auto;padding:8px 12px 12px;background-color:#8a5a2b;background-image:repeating-linear-gradient(91deg,rgba(0,0,0,.07) 0 2px,transparent 2px 9px),repeating-linear-gradient(89deg,rgba(255,240,200,.06) 0 1px,transparent 1px 23px),linear-gradient(#a06c36,#6a4018);border:6px solid #4a2a0c;box-shadow:inset 0 0 40px rgba(0,0,0,.55)}
.dc-head{font:900 17px/1.1 "Arial Black",Impact,sans-serif;color:#ffe9b0;text-shadow:2px 2px 0 #000;letter-spacing:1px;margin-bottom:8px}
.dc-head small{display:block;font:italic 11px Tahoma,sans-serif;color:#f0d8a0;letter-spacing:0;text-shadow:1px 1px 0 #000}
.dc-shelf{display:flex;align-items:flex-end;flex-wrap:wrap;gap:3px;row-gap:22px;padding:16px 8px 0;min-height:190px;border-bottom:12px solid #5a3412;box-shadow:0 5px 0 #3a2008,inset 0 -20px 20px -16px rgba(0,0,0,.7),inset 0 8px 14px -6px rgba(0,0,0,.6);margin-bottom:16px;background:rgba(0,0,0,.28)}
.dc-s2{min-height:146px}
.dc-sp{position:relative;flex:none;width:40px;height:172px;border:1px solid #000;border-radius:1px;padding:7px 0 5px;background:linear-gradient(90deg,rgba(0,0,0,.5),rgba(255,255,255,.2) 25%,rgba(255,255,255,0) 55%,rgba(0,0,0,.45)),var(--a);display:flex;flex-direction:column;align-items:center;justify-content:space-between;cursor:pointer;transition:transform .15s;box-shadow:3px 0 3px rgba(0,0,0,.45);font:inherit;color:inherit}
.dc-sp:nth-child(3n){height:166px}.dc-sp:nth-child(4n+1){height:178px}
.dc-sp::before{content:"";position:absolute;left:4px;right:4px;top:2px;height:3px;background:var(--c);opacity:.9}
.dc-sp:hover,.dc-sp.sel{transform:translateY(-12px)}
.dc-sp.sel{outline:2px dotted #fff;outline-offset:2px}
.dc-spt{writing-mode:vertical-rl;transform:rotate(180deg);font:900 12px/1 Impact,"Arial Black",sans-serif;color:var(--b);text-shadow:1px 1px 0 #000,-1px 0 0 #000;letter-spacing:.5px;white-space:nowrap;max-height:140px;overflow:hidden;text-overflow:ellipsis}
.dc-spl{font:bold 9px Arial,sans-serif;color:#000;background:#fff;border:1px solid #000;padding:0 2px;min-width:16px;text-align:center}
.dc-spc{position:absolute;top:44%;left:-4px;right:-4px;background:#fff36a;color:#c00000;font:bold 9px "Comic Sans MS",cursive;transform:rotate(-14deg);text-align:center;border:1px solid #c8a000;pointer-events:none}
.dc-sp.dc-jewel{width:22px;height:140px;padding:5px 0;background:linear-gradient(90deg,#bbb,#fff 18%,#999 28%,var(--a) 30%,var(--a) 90%,#666 92%,#ddd)}
.dc-sp.dc-jewel:nth-child(n){height:140px}
.dc-jewel::before{display:none}
.dc-jewel .dc-spt{font:bold 9px/1 Arial,sans-serif;max-height:130px;letter-spacing:0}
.dc-out::after{content:"IN D:";position:absolute;top:-15px;left:50%;transform:translateX(-50%);font:bold 9px Arial,sans-serif;background:#0c0;color:#000;border:1px solid #000;padding:0 2px;white-space:nowrap}
.dc-gap{flex:1}
.dc-mags{flex:none;width:96px;height:26px;align-self:flex-end;background:linear-gradient(#e10600 0 8px,#000 8px 9px,#ffd400 9px 17px,#000 17px 18px,#2a7ad8 18px);border:1px solid #000;transform:skewX(-8deg)}
.dc-drawer{position:relative;background:linear-gradient(#7a4a1e,#5a3412);border:3px solid #3a2008;border-top-color:#a06c36;padding:10px 8px 8px;margin-top:4px;box-shadow:inset 0 8px 14px rgba(0,0,0,.5)}
.dc-knob{position:absolute;top:-9px;left:50%;margin-left:-22px;width:44px;height:8px;background:linear-gradient(#e8c890,#a07840);border:1px solid #000;border-radius:4px}
.dc-dl{font:bold 11px Tahoma,sans-serif;color:#ffe9b0;margin-bottom:6px}.dc-dl small{font-weight:normal;opacity:.8}
.dc-ditems{display:flex;gap:10px;flex-wrap:wrap}
.dc-di{position:relative;width:86px;background:none;border:0;color:#ffe9b0;font:10px Tahoma,sans-serif;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:2px}
.dc-di svg{width:64px;height:64px;filter:drop-shadow(2px 3px 1px rgba(0,0,0,.6))}
.dc-di.sel span{background:#000080;color:#fff;outline:1px dotted #fff}
.dc-di.dc-out::after{top:0}
.dc-notes{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.dc-note{width:136px;min-height:58px;padding:7px 8px;font:12px/1.2 "Comic Sans MS","Chalkboard SE",cursive;color:#1a1a6a;box-shadow:2px 3px 4px rgba(0,0,0,.5)}
.dc-side{background:#c0c0c0;border-left:2px solid #fff;padding:8px;overflow:auto;display:flex;flex-direction:column;gap:8px;min-height:0}
.dc-card{width:236px;margin:0 auto;flex:none}
.dc-card .dc-svg{width:236px;height:auto;display:block;border:1px solid #000;box-shadow:4px 4px 0 rgba(0,0,0,.35);background:#000}
.dc-c-jewel{padding:5px 5px 5px 16px;background:linear-gradient(90deg,#333 0 11px,#e8e8e8 11px,#fff 45%,#bbb);border:1px solid #555;box-shadow:3px 3px 0 rgba(0,0,0,.35)}
.dc-c-jewel .dc-svg{width:213px;box-shadow:none}
.dc-c-cdr .dc-svg,.dc-c-sleeve .dc-svg,.dc-c-floppy .dc-svg,.dc-c-cart .dc-svg{border:0;box-shadow:none;background:none;filter:drop-shadow(3px 4px 2px rgba(0,0,0,.45))}
.dc-c-jewel.dc-showback,.dc-showback{padding:0;background:none;border:0;box-shadow:none}
.dc-turn{animation:dcturn .3s}
@keyframes dcturn{50%{transform:scaleX(.04)}}
.dc-back{width:236px;height:330px;overflow:auto;background:linear-gradient(var(--a),#000);color:#fff;border:1px solid #000;padding:8px;font:10px/1.3 Arial,sans-serif;box-shadow:4px 4px 0 rgba(0,0,0,.35)}
.dc-back p{margin:0 0 6px}
.dc-back ul{margin:4px 0 6px;padding-left:14px}
.dc-bt{font:900 16px/1.05 Impact,"Arial Black",sans-serif;color:var(--b);text-shadow:1px 1px 0 #000;margin-bottom:5px}
.dc-demo{background:#e10600;color:#fff;font:bold 10px Arial;padding:1px 3px;vertical-align:middle}
.dc-shots{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:4px 0}
.dc-shot{width:100%;height:auto;display:block;border:2px solid #fff;box-shadow:2px 2px 0 rgba(0,0,0,.5)}
.dc-shot:first-child{grid-column:span 2}
.dc-q{margin:3px 0;color:#ffe9b0}.dc-q i{color:#fff;opacity:.8}
.dc-free{background:var(--c);color:#fff;font:bold 11px Arial,sans-serif;padding:3px;text-align:center;transform:rotate(-2deg);border:2px solid #fff;margin:7px 0}
.dc-req{background:#fff;color:#000;padding:4px;font-size:9px;border:1px solid #000}
.dc-keyrow{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px}
.dc-key{background:#ffd400;color:#000;padding:3px 6px;font:9px/1.2 Arial,sans-serif;border:1px solid #a07000;transform:rotate(-3deg);text-align:center}
.dc-bar{width:86px;height:30px;background:#fff;padding:2px;fill:#000}
.dc-fine{font-size:8px;opacity:.75;margin-top:5px}
.dc-backplain{background:#f4f4ec;color:#000;height:auto;min-height:180px}.dc-backplain .dc-bt{color:#000080;text-shadow:none}
.dc-hand{font:13px "Comic Sans MS",cursive;color:#1a1aaa}
.dc-info{background:#fff;border:2px inset #fff;padding:5px 6px}
.dc-it{font:bold 13px Tahoma,sans-serif}.dc-iby{color:#555;margin-bottom:3px}
.dc-net{color:#000080}.dc-ok{color:#007000;font-weight:bold}.dc-no{color:#a05000}.dc-bad{color:#c00000;font-weight:bold}.dc-own{color:#000080;font-weight:bold}
.dc-btns{display:flex;flex-direction:column;gap:4px}
.dc-btns .btn{width:100%;min-height:26px}
.dc-btns .dc-main{font-weight:bold;min-height:36px;font-size:13px}
.dc-foot{grid-column:1/-1;display:flex;gap:8px;background:#c0c0c0;border-top:2px solid #fff;padding:6px 8px;flex-wrap:wrap;align-items:stretch}
.dc-drive{display:flex;gap:8px;align-items:center;flex:2 1 430px;flex-wrap:wrap}
.dc-dfront{flex:none;width:150px;height:36px;background:linear-gradient(#f2ecdc,#d4ccb4);border:1px solid #777;position:relative;border-radius:2px;box-shadow:inset 1px 1px #fff}
.dc-dslot{position:absolute;left:10px;right:34px;top:14px;height:6px;background:#3a3a3a;border-radius:3px}
.dc-dslot.full{background:linear-gradient(90deg,#3a3a3a,#9ab0e8 40%,#d0a0ff 60%,#3a3a3a)}
.dc-led{position:absolute;right:10px;top:9px;width:7px;height:4px;background:#2a4a2a;border:1px solid #000}
.dc-led.on{background:#5f5;animation:dcblink .25s steps(2) infinite}
@keyframes dcblink{50%{background:#2a4a2a}}
.dc-dbtn{position:absolute;right:8px;bottom:6px;width:16px;height:6px;background:#ccc;border:1px solid #888}
.dc-lcd{min-width:128px;padding:5px 8px;white-space:nowrap;font-size:12px}
.dc-dctl{display:flex;gap:4px;flex-wrap:wrap}
.dc-top{flex:1 1 220px;max-height:84px;overflow:auto;background:#fff;border:2px inset #fff;padding:4px 6px;min-width:0}
.dc-toph{font:bold 11px Tahoma,sans-serif;color:#000080}.dc-toph small{font-weight:normal;color:#666}
.dc-topl{font-size:10px;color:#555}
.dc-tr{line-height:1.25;display:grid;grid-template-columns:minmax(0,1fr) 70px 26px;gap:5px;align-items:center;color:#000}
.dc-tn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-tb{height:8px;background:#e8e8e8;border:1px solid #888}.dc-tb i{display:block;height:100%}
.dc-tc{text-align:right}
.dc-ar{display:flex;gap:14px;margin:-6px;padding:14px;background:radial-gradient(circle at 25% 20%,var(--a),#000 85%);color:#fff;min-height:270px;align-items:flex-start}
.dc-ar-art{flex:none}.dc-ar-art svg{width:130px;height:auto;display:block;box-shadow:0 0 22px var(--c);border:1px solid #000}
.dc-ar-m{flex:1;min-width:0}
.dc-ar-t{font:900 22px/1.05 Impact,"Arial Black",sans-serif;color:var(--b);text-shadow:2px 2px 0 #000}
.dc-ar-s{font:bold 10px Verdana,sans-serif;letter-spacing:2px;color:#ccc;margin:4px 0 10px}
.dc-ar-b{display:flex;flex-direction:column;gap:5px}
.dc-arbtn{font:bold 12px Verdana,Tahoma,sans-serif;color:#fff;text-align:left;background:linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,0));border:1px solid rgba(255,255,255,.35);padding:7px 10px;cursor:pointer;min-height:32px}
.dc-arbtn:hover,.dc-arbtn:focus{background:var(--c);outline:none}
.dc-arbig{font-size:15px;background:var(--c);border-color:#fff}
.dc-ar-f{font-size:10px;color:#bbb;margin-top:10px}
.dc-ex{position:absolute;inset:6px}
.dc-exl{display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;height:100%;overflow:auto;padding:4px;box-sizing:border-box}
.dc-exi{width:78px;background:none;border:0;display:flex;flex-direction:column;align-items:center;gap:2px;font:11px Tahoma,sans-serif;padding:4px 2px;cursor:pointer;word-break:break-all;color:#000}
.dc-exi.sel span:last-child{background:#000080;color:#fff}
.dc-polish{flex:none;width:48px;height:48px;border-radius:50%;background:conic-gradient(#ddd,#9cf,#fcf,#ffc,#cfc,#ddd);border:1px solid #888;position:relative;animation:dgspin .7s linear infinite}
.dc-polish::after{content:"";position:absolute;inset:18px;border-radius:50%;background:#c0c0c0;border:2px solid #999}
@media (max-width:700px){
.dc{position:static;display:block}
.dc-win > .appbody{overflow:auto}
.dc-cab{overflow:visible;padding:8px 6px}
.dc-shelf{padding:16px 4px 0;gap:2px;row-gap:22px}
.dc-sp{width:36px}
.dc-side{border-left:0;border-top:2px solid #fff}
.dc-ar-art{display:none}
}
`;
  document.head.appendChild(css2);

  // ================================================================ ONLINE: the JackNet Showcase (mods/discs.js) + Play Online
  // Discs.net.put(kind, title, data, stats) -> Promise({ ok, err })   upload your park/city/dungeon (members; one each)
  // Discs.net.list(kind, sort 'top'|'new'|'busy') -> Promise([{ name, title, ts, stats, avg, votes, visits, mine, my }])
  // Discs.net.get(kind, name, visit) -> Promise(entry with .data | null)
  // Discs.net.rate(kind, name, 1..5) -> Promise({ ok, avg, votes, my, err })    Discs.net.del(kind)
  // Discs.net.res(kind, name, won)   a raid/challenge on somebody's show: entries carry res { w, l } (challengers' wins/losses)
  // Discs.net.rec(kind, { small fields }) / Discs.net.recs(kind) -> Promise([{ name, ts, rec }])   (Hall of Fame records)
  // Discs.showcase(kind, { title, what, stats(e) -> html, visit(entry), mine() -> { title, data, stats } | null }) a window
  // Discs.stars(avg, votes) -> html     Discs.rateBox(kind, entry, onRated) -> element (five clickable stars)
  // Discs.playOnline(mpId, o)  the big "Play Online" button: answer somebody already waiting, else put your name up
  const NQ = new Map(); let nrid = 1;
  const isMember = () => !!(window.Net && Net.me && Net.me.member);
  if (window.Net && Net.on) ['dsDone', 'dsList', 'dsGot', 'dsRated', 'dsRecs'].forEach(t => Net.on(t, m => { const f = NQ.get(m.rid | 0); if (f) f(m); }));
  const ask = (o, ms) => new Promise(res => {
    if (!window.Net || !Net.connected) return res(null);
    const rid = nrid++, t = setTimeout(() => { NQ.delete(rid); res(null); }, ms || 12000);
    NQ.set(rid, v => { clearTimeout(t); NQ.delete(rid); res(v); });
    if (!Net.send(Object.assign({ rid }, o))) { clearTimeout(t); NQ.delete(rid); res(null); }
  });
  const NETERR = 'JackNet isn\'t answering. (Is somebody on the phone?) Try again in a minute.';
  const net = {
    put(kind, title, data, stats) {
      if (!isMember()) return Promise.resolve({ ok: false, err: 'Showing off your games is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!' });
      if (!window.Net || !Net.connected) return Promise.resolve({ ok: false, err: NETERR });
      let b64; try { b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data)))); } catch (e) { return Promise.resolve({ ok: false, err: 'That save is broken. Try again.' }); }
      const n = Math.max(1, Math.ceil(b64.length / 3000));
      if (n > 120) return Promise.resolve({ ok: false, err: 'That save is too big to send down the phone line.' });
      const rid = nrid++;
      return new Promise(res => {
        const t = setTimeout(() => { NQ.delete(rid); res({ ok: false, err: NETERR }); }, 20000 + n * 200);
        NQ.set(rid, m => { clearTimeout(t); NQ.delete(rid); res(m); });
        let i = 0;
        const step = () => {
          if (!NQ.has(rid)) return;
          for (let k = 0; k < 8 && i < n; k++, i++) {
            const pkt = { t: 'dsPut', rid, kind, i, n, d: b64.slice(i * 3000, (i + 1) * 3000) };
            if (i === 0) { pkt.title = String(title || '').slice(0, 40); pkt.stats = stats || {}; }
            if (!Net.send(pkt)) { clearTimeout(t); NQ.delete(rid); return res({ ok: false, err: NETERR }); }
          }
          if (i < n) setTimeout(step, 650);
        };
        step();
      });
    },
    list: (kind, sort) => ask({ t: 'dsList', kind, sort: sort || 'top' }).then(m => (m && Array.isArray(m.items) ? m.items : null)),
    get: (kind, name, visit) => ask({ t: 'dsGet', kind, name, visit: !!visit }, 20000).then(m => (m && m.ok ? m : null)),
    rate: (kind, name, score) => ask({ t: 'dsRate', kind, name, score }).then(m => m || { ok: false, err: NETERR }),
    del: kind => ask({ t: 'dsDel', kind }).then(m => m || { ok: false, err: NETERR }),
    rec: (kind, rec) => { if (isMember() && window.Net) Net.send({ t: 'dsRec', kind, rec }); },
    // a challenge on somebody's show (a raid on their dungeon) was won (true) or lost: they see the tally as entry.res {w, l}
    res: (kind, name, win) => { if (window.Net) Net.send({ t: 'dsRes', kind, name, win: !!win }); },
    recs: kind => ask({ t: 'dsRecs', kind }).then(m => (m && Array.isArray(m.items) ? m.items : null)),
  };
  const starsHtml = (avg, votes) => `<span class="dsc-st" title="${votes ? `${avg} out of 5 from ${votes} vote${votes === 1 ? '' : 's'}` : 'No votes yet'}">${[1, 2, 3, 4, 5].map(i => `<i class="${avg >= i - 0.25 ? 'on' : avg >= i - 0.75 ? 'half' : ''}">&#9733;</i>`).join('')}</span>${votes ? ` <small>(${votes})</small>` : ' <small>(no votes)</small>'}`;
  function rateBox(kind, e, onRated) {
    const el = h(null, 'dsc-rate');
    const draw = () => { el.innerHTML = `<span>${e.mine ? 'Your own! Votes:' : e.my ? 'Your vote:' : 'Rate it:'}</span>${[1, 2, 3, 4, 5].map(i => `<button type="button" class="dsc-sb${(e.mine ? e.avg : e.my) >= i - 0.25 ? ' on' : ''}" data-s="${i}" ${e.mine ? 'disabled' : ''} aria-label="${i} star${i > 1 ? 's' : ''}">&#9733;</button>`).join('')}<small>${e.votes ? `${e.avg} from ${e.votes}` : 'no votes yet'}</small>`; };
    draw();
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-s]'); if (!b || e.mine) return;
      if (window.Guest && Guest.is()) return Guest.need('Rating other people\'s games', () => {});
      sfx('click');
      net.rate(kind, e.name, +b.dataset.s).then(r => {
        if (!r.ok) return msg('JackNet Showcase', r.err || NETERR, 'info');
        Object.assign(e, { avg: r.avg, votes: r.votes, my: r.my }); draw(); sfx('solve'); A.secret('disc.rated');
        toast('JackNet Showcase', `You gave ${e.name}'s ${e.title} ${r.my} star${r.my === 1 ? '' : 's'}.`, 2500);
        if (onRated) onRated(e);
      });
    });
    return el;
  }
  const SHOWW = {};
  function showcase(kind, o) {
    const old = SHOWW[kind]; if (old && !old.closed) { old.restore(); old.focus(); return old; }
    const b = h(`<div class="dsc-head" style="--a:${o.c1 || '#000080'}">${o.icon ? `<span class="dsc-ic">${ic32(o.icon)}</span>` : ''}<div><b>${esc(o.title)}</b><small>${esc(o.sub || 'Built by JackNet members. Visit them, rate them, nick their ideas.')}</small></div></div>
      <div class="tabs"><span class="on" data-s="top">Top rated</span><span data-s="new">Newest</span><span data-s="busy">Most visited</span></div><div class="tabpage dsc-page"><div class="field dsc-list"><p class="dsc-dim">Dialling JackNet...</p></div></div>
      <div class="dsc-foot"><button type="button" class="btn" data-k="up">${esc(o.upLabel || 'Upload mine')}</button><button type="button" class="btn" data-k="del">Take mine down</button><button type="button" class="btn" data-k="ref">Refresh</button><span class="dsc-dim dsc-note"></span></div>`, 'dsc');
    const w = A.win(o.title + ' - JackNet', b, { w: 560, h: 470, icon: o.icon ? ic16(o.icon) : ic16(J('globe')), status: true, minW: 300, minH: 300 });
    if (isPhone()) w.el.classList.add('maxwin');
    SHOWW[kind] = w; A.secret('disc.showcase');
    let sort = 'top', items = [];
    const note = t => { qs(b, '.dsc-note').textContent = t || ''; };
    const draw = () => {
      const l = qs(b, '.dsc-list');
      if (!items) { l.innerHTML = `<p class="dsc-dim">${esc(NETERR)}</p>`; return; }
      if (!items.length) { l.innerHTML = `<p class="dsc-dim">Nobody has uploaded ${esc(o.what || 'one')} yet. Be the first!</p>`; return; }
      l.innerHTML = `<table>${items.map((e, i) => `<tr${e.mine ? ' class="mine"' : ''}><td><b>${esc(e.title)}</b> <span class="dsc-dim">by ${esc(e.name)}${e.mine ? ' (you)' : ''}</span><div class="dsc-stats">${o.stats ? o.stats(e) : ''}</div></td><td class="dsc-r">${starsHtml(e.avg, e.votes)}<div class="dsc-dim">${e.visits} visit${e.visits === 1 ? '' : 's'}</div></td><td class="dsc-r"><button type="button" class="btn" data-v="${i}">Visit</button></td></tr>`).join('')}</table>`;
    };
    const load = () => { qs(b, '.dsc-list').innerHTML = '<p class="dsc-dim">Dialling JackNet...</p>'; net.list(kind, sort).then(r => { if (w.closed) return; items = r; draw(); if (w.status) w.status.textContent = r ? `${r.length} on JackNet` : 'Not connected'; }); };
    b.addEventListener('click', ev => {
      const t = ev.target.closest('[data-s],[data-v],[data-k]'); if (!t) return;
      if (t.dataset.s) { sort = t.dataset.s; qsa(b, '.tabs span').forEach(s => s.classList.toggle('on', s === t)); sfx('click'); load(); return; }
      if (t.dataset.v != null) {
        const e = items[+t.dataset.v]; if (!e) return;
        t.disabled = true; t.textContent = 'Loading...';
        net.get(kind, e.name, true).then(full => { t.disabled = false; t.textContent = 'Visit'; if (!full) return msg('JackNet Showcase', 'Couldn\'t download that one. Try again!', 'warn'); A.secret('disc.visit'); sfx('modem'); o.visit(full); });
        return;
      }
      const k = t.dataset.k;
      if (k === 'ref') return load();
      if (k === 'up') {
        if (window.Guest && Guest.is()) return Guest.need('Showing off what you built', () => {});
        const mine = o.mine ? o.mine() : null;
        if (!mine) return msg('JackNet Showcase', o.noMine || 'Open one of your own first, then upload it from the game.', 'info');
        note('Uploading at 3.6 KB/sec...'); sfx('modem');
        net.put(kind, mine.title, mine.data, mine.stats).then(r => { if (w.closed) return; note(''); if (!r.ok) return msg('JackNet Showcase', r.err || NETERR, 'warn'); A.secret('disc.upload'); toast('JackNet Showcase', `"${mine.title}" is on JackNet for everybody to visit!`, 3500); sort = 'new'; qsa(b, '.tabs span').forEach(s => s.classList.toggle('on', s.dataset.s === 'new')); load(); });
        return;
      }
      if (k === 'del') {
        if (window.Guest && Guest.is()) return Guest.need('Showing off what you built', () => {});
        return msg('JackNet Showcase', `Take your ${o.what || 'upload'} off JackNet? Its votes and visits go too.`, 'q', [['Take it down', () => net.del(kind).then(r => { if (!r.ok) return msg('JackNet Showcase', r.err || NETERR, 'info'); toast('JackNet Showcase', 'Taken down.', 2000); load(); })], ['Cancel']]);
      }
    });
    load();
    return w;
  }
  // the "Play Online" button: somebody already waiting gets answered straight away; otherwise your name goes up in the
  // JackNet lobby and the picker opens (invite anybody you can see)
  function playOnline(mpId, o) {
    const M = window.MP; if (!M || !M.GAMES[mpId]) return msg('JackNet', 'Online play isn\'t available right now.', 'info');
    if (!window.Net || !Net.connected) return msg('JackNet', 'You are not connected to JackNet. (Is somebody on the phone?)', 'warn');
    const theirs = (M.now.seeks || []).filter(s => s.g === mpId && s.id !== Net.me.id && !s.lost).sort((a, b) => a.ts - b.ts);
    if (theirs.length) { M.join(theirs[0]); return null; }
    if (!M.seeking(mpId)) M.seek(mpId, (o && o.note) || '');
    return M.pick(mpId, o);
  }
  // online modes the games plug into (each game calls MP.hook('mp.<game>', G.w, { session(s) }))
  const onlineApp = id => () => { const g = LIVE[id]; if (g && !g.closed && g.w && !g.w.closed) { g.w.restore(); return g.w; } return launch(id); };
  const liveIn = id => () => { const g = LIVE[id]; return !!(g && !g.closed); };
  const ONLINE = {
    // ---- Age of Jackpires II (discs-rts.js)
    rts: { mp: 'rts.online', name: 'Age of Jackpires II online', kind: 'live', players: '2-4', max: 4, blurb: 'Real-time skirmish over JackNet: 1v1, free-for-all or 2v2 with computer allies. Late arrivals watch.', tableOpen: s => !s.ended && !!s.rtsOpen },
    // ---- Championship Boss 99/00 (discs-boss.js)
    boss: { mp: 'boss.online', name: 'Championship Boss: Cup Night', kind: 'turn', players: '2-8', max: 8, blurb: 'A knockout cup between real managers over JackNet. Pick your team, set your tactics, watch it on Ceefacts.', tableOpen: s => !s.ended && !!s.bossOpen },
  };
  if (window.MP && MP.game) Object.keys(ONLINE).forEach(id => {
    const d = ONLINE[id];
    A.register('mp.' + id, { open: onlineApp(id) });
    MP.game(d.mp, { app: 'mp.' + id, name: d.name, icon: ic16(IC[id]), kind: d.kind, players: d.players, max: d.max, invite: 'session', blurb: d.blurb, live: liveIn(id), open: () => A.open('mp.' + id), tableOpen: d.tableOpen, start: s => MP.sessionStart(s, 'mp.' + id) });
  });
  [['showcase', 'Show-off', 'Visit somebody else\'s creation on the JackNet Showcase'], ['upload', 'On the Internet!', 'Put something you built in a game up on JackNet'], ['rated', 'Everyone\'s a critic', 'Give somebody\'s creation some stars'], ['visit', 'Tourist', 'Download and look round somebody else\'s game']].forEach(([k, n, hint]) => A.defineSecret('disc.' + k, n, hint));
  {
    const s = h(null, null, 'style'); s.id = 'discs-css-net';
    s.textContent = `
.dsc{display:flex;flex-direction:column;gap:6px;height:100%;box-sizing:border-box;font:12px Tahoma,sans-serif}
.dsc-head{display:flex;gap:8px;align-items:center;background:linear-gradient(90deg,var(--a),#1084d0);color:#fff;padding:6px 8px}
.dsc-head b{display:block;font:bold 15px Arial Black,Arial,sans-serif;letter-spacing:.5px}.dsc-head small{opacity:.9}
.dsc-ic{flex:none;line-height:0}
.dsc .tabs span{cursor:pointer}
.dsc-page{flex:1;min-height:0;display:flex;padding:6px}
.dsc-list{flex:1;overflow:auto;background:#fff;padding:2px}
.dsc-list table{width:100%;border-collapse:collapse}
.dsc-list td{padding:5px 4px;border-bottom:1px dotted #c0c0c0;vertical-align:middle}
.dsc-list tr.mine td{background:#ffffe1}
.dsc-r{text-align:right;white-space:nowrap}
.dsc-dim{color:#808080}
.dsc-stats{font-size:11px;color:#333;margin-top:2px}
.dsc-st i{font-style:normal;color:#c0c0c0;font-size:13px}.dsc-st i.on{color:#e8a000}.dsc-st i.half{color:#f0c860}
.dsc-foot{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.dsc-foot .btn{min-height:26px}
.dsc-rate{display:inline-flex;align-items:center;gap:2px;font:12px Tahoma,sans-serif}
.dsc-rate span{margin-right:4px}.dsc-rate small{margin-left:6px;opacity:.8}
.dsc-sb{background:none;border:0;padding:2px 3px;font-size:20px;line-height:1;color:#808080;cursor:pointer;min-width:26px;min-height:28px}
.dsc-sb.on{color:#ffb000;text-shadow:1px 1px 0 #000}.dsc-sb:disabled{cursor:default}
.dsc-sb:not(:disabled):hover{color:#ffd400}
`;
    document.head.appendChild(s);
  }

  window.Discs = { mod, launch, makeG, GAMES, MODS, LIVE, isDemo, longDate, md99, BOXES, open: openGame, insert, eject, cupboard: () => A.open('discs.cupboard'), autorun: id => BOX[id] && autorun(BOX[id]), play: id => BOX[id] && play(BOX[id]), get drive() { return S.cd; },
    BOX, EXT, ext(id, d) { EXT[id] = Object.assign({ id, ext: true, kind: 'ext' }, d); }, titleOf, labelOf, front, back, SHOT, byOf, demoBox, readmeText, manualText, polish, installed, pidOf, scratched: id => !!S.scr[id], d2: id => !!S.d2[id],
    net, showcase, stars: starsHtml, rateBox, playOnline, isMember, ONLINE };
})();

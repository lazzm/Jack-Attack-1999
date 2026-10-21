/* grind-hunt: THE GREAT RUPEE HUNT. Every 1999 day the server hides ten gems at spots picked from GrindCat.SPOTS (the
 * same spots for everybody that day). This file knows how to find each spot on the PC and the JackNet, drops a little
 * sparkling gem there, and asks the server (mods/grind.js) to pay when a member clicks one. Guests can look and find,
 * but only members keep them. Also the Rupee Hunt web site (www.rupeehunt.jnet).
 * Adding a spot: add it to SPOTS in js/grind-cat.js, then either a finder in FIND below, or from any other file call
 *   window.GemHunt && GemHunt.spot('pc.myspot', element, 'plain hint')
 * (the gem only appears there on the days the server picks that spot). */
(function () {
  'use strict';
  if (window.GemHunt || !window.Grind) return;
  const A = Apps, C = window.GrindCat, esc = A.esc, $ = id => document.getElementById(id), store = A.store;
  const RP = Grind.RP;
  const gemSvg = (c, sz) => (window.Econ && Econ.gem ? Econ.gem(c, sz) : `<svg viewBox="0 0 12 16" width="${Math.round(sz * 0.75)}" height="${sz}"><path d="M6 .5L11.3 4v8L6 15.5.7 12V4z" fill="${{ green: '#38c040', blue: '#2f80ee', red: '#e8283a', purple: '#9a3ae0', gold: '#f2b612', rainbow: '#ff5ab4' }[c] || '#38c040'}" stroke="#000" stroke-width=".7"/></svg>`);
  const hash = C.hash;

  // ================================================================ the look
  const css = `
.gh-gem{position:absolute;z-index:900;width:34px;height:38px;margin:0;padding:0;border:0;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;animation:ghBob 2.4s ease-in-out infinite}
.gh-gem svg.ec-gem,.gh-gem>svg{width:18px;height:24px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.55));pointer-events:none}
.gh-gem .gh-sp{position:absolute;width:9px;height:9px;pointer-events:none;background:radial-gradient(circle,#fff 0 18%,transparent 22%),linear-gradient(0deg,transparent 42%,#fff 45% 55%,transparent 58%),linear-gradient(90deg,transparent 42%,#fff 45% 55%,transparent 58%);opacity:0;animation:ghTw 1.8s ease-in-out infinite}
.gh-gem .gh-sp.a{left:2px;top:4px}.gh-gem .gh-sp.b{right:2px;top:12px;animation-delay:.6s;width:7px;height:7px}.gh-gem .gh-sp.c{left:9px;bottom:2px;animation-delay:1.2s;width:6px;height:6px}
.gh-gem:hover svg,.gh-gem:focus-visible svg{transform:scale(1.18)}
.gh-gem:focus-visible{outline:1px dotted #000}
.gh-gem.gh-rainbow svg{animation:ghHue 3s linear infinite}
.gh-gem.gh-pop{animation:ghPop .55s ease-out forwards;pointer-events:none}
.gh-gem.gh-fixed{position:fixed}
@keyframes ghBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes ghTw{0%,100%{opacity:0;transform:scale(.4) rotate(0)}40%{opacity:1;transform:scale(1) rotate(45deg)}70%{opacity:0;transform:scale(.5) rotate(90deg)}}
@keyframes ghHue{to{filter:hue-rotate(360deg) drop-shadow(0 1px 1px rgba(0,0,0,.55))}}
@keyframes ghPop{0%{transform:scale(1)}30%{transform:scale(1.7) translateY(-8px)}100%{transform:scale(0) translateY(-30px);opacity:0}}
@media (prefers-reduced-motion:reduce){.gh-gem,.gh-gem .gh-sp,.gh-gem.gh-rainbow svg{animation:none}.gh-gem .gh-sp{opacity:.8}}
/* the web site */
.ghs{font:13px Verdana,Arial,sans-serif;color:#1a1030;background:#10082a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M12 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1z' fill='%23fff' opacity='.5'/%3E%3Cpath d='M44 38l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z' fill='%23ffd400' opacity='.6'/%3E%3C/svg%3E");padding:10px;min-height:100%}
.ghs-in{max-width:760px;margin:0 auto;background:#fffdf4;border:3px ridge #c8a040;padding:0 0 10px}
.ghs-top{position:relative;text-align:center;padding:14px 10px 10px;background:linear-gradient(180deg,#2a0a5a,#5a1a8a 60%,#8a2aa0);color:#fff;border-bottom:3px ridge #c8a040;overflow:hidden}
.ghs-top h1{margin:0;font:bold 34px/1 Impact,'Arial Black',Arial,sans-serif;letter-spacing:2px;color:#ffd400;text-shadow:3px 3px 0 #a0004a,0 0 12px rgba(255,220,0,.6);transform:rotate(-2deg)}
.ghs-top h1 small{display:block;font:bold 13px Verdana,Arial,sans-serif;letter-spacing:6px;color:#fff;text-shadow:1px 1px 0 #000;margin-bottom:4px}
.ghs-top .ghs-date{margin-top:8px;font-size:12px;color:#ffe8ff}
.ghs-gems{display:flex;justify-content:center;gap:8px;margin:8px 0 2px}
.ghs-gems span{display:inline-flex;flex-direction:column;align-items:center;font:bold 10px Verdana,Arial,sans-serif;color:#fff}
.ghs-gems svg{width:15px;height:20px}
.ghs-sec{margin:10px 12px 0}
.ghs-sec h2{margin:0 0 6px;font:bold 15px Verdana,Arial,sans-serif;color:#5a1a8a;border-bottom:2px dotted #c8a040;padding-bottom:3px}
.ghs-row{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px;margin:4px 0}
.ghs-slot{aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:#e8e0f0;border:2px inset #b8a8c8;position:relative}
.ghs-slot svg{width:60%;height:auto}
.ghs-slot.got{background:radial-gradient(circle,#fffbe0,#f0e0a0);border-style:outset;border-color:#e8c860}
.ghs-slot.no svg{filter:grayscale(1) brightness(.6);opacity:.35}
.ghs-slot b{position:absolute;bottom:0;left:0;right:0;font:bold 9px Verdana,Arial,sans-serif;text-align:center;color:#5a1a8a}
.ghs-meter{font-size:12px;margin:4px 0 0}
.ghs-clues{margin:0;padding:0;list-style:none;counter-reset:cl}
.ghs-clues li{counter-increment:cl;display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:6px;align-items:start;padding:6px 4px;border-bottom:1px solid #e8dcc0}
.ghs-clues li::before{content:counter(cl);font:bold 16px/26px Georgia,serif;text-align:center;color:#fff;background:#5a1a8a;border-radius:50%;width:26px;height:26px}
.ghs-clues li.got .ghs-cl{text-decoration:line-through;color:#888}
.ghs-cl{font-style:italic;line-height:1.4}
.ghs-hint{display:block;margin-top:3px;font-style:normal;font-size:11px;color:#0050a0}
.ghs-st{white-space:nowrap;font-size:11px;text-align:right}
.ghs-st svg{width:12px;height:16px;vertical-align:-3px}
.ghs-big{display:inline-block;margin-left:4px;padding:0 4px;background:#ffd400;color:#5a3a00;font:bold 9px Verdana,Arial,sans-serif;border:1px solid #8a6000}
.ghs-cols{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px}
.ghs-box{background:#fff;border:2px solid #5a1a8a;padding:6px 8px;font-size:12px}
.ghs-box table{width:100%;border-collapse:collapse}
.ghs-box td{padding:2px 3px;border-bottom:1px dotted #ccc}
.ghs-box td:last-child{text-align:right}
.ghs-done{margin:10px 12px 0;padding:8px;text-align:center;font:bold 14px Verdana,Arial,sans-serif;color:#5a3a00;background:repeating-linear-gradient(45deg,#ffe680 0 10px,#fff2b0 10px 20px);border:2px dashed #c8a040}
.ghs-foot{margin:12px 12px 0;font-size:10px;color:#666;text-align:center}
.ghs .btn{font-size:11px}
@media (max-width:560px){.ghs-cols{grid-template-columns:minmax(0,1fr)}.ghs-top h1{font-size:26px}.ghs-row{gap:2px}.ghs-clues li{grid-template-columns:24px minmax(0,1fr)}.ghs-st{grid-column:2;text-align:left}}
`;
  const st = document.createElement('style'); st.id = 'grindHuntCss'; st.textContent = css; document.head.appendChild(st);

  // ================================================================ where each spot is
  const vis = el => !!(el && el.isConnected && el.offsetParent !== null && el.getClientRects().length);
  const wins = () => [...document.querySelectorAll('.appwin')].filter(w => w.style.display !== 'none');
  const inWin = (sel, title) => { for (const w of wins()) { if (title && !title.test(w.getAttribute('aria-label') || '')) continue; const e = w.querySelector(sel); if (vis(e)) return e; } return null; };
  const browserOn = () => { const b = $('browser'); return !!b && !b.classList.contains('min') && b.style.display !== 'none'; };
  const sec = name => { const s = $('s-' + name); return browserOn() && s && s.classList.contains('on') ? s : null; };
  let curSite = ''; // 'host/path' of the fake web site on screen
  document.addEventListener('section', e => { const d = String(e.detail || ''); curSite = d.startsWith('site:') ? d.slice(5).replace(/^www\./, '') : ''; setTimeout(tick, 400); setTimeout(tick, 1500); });
  const site = host => { const h = curSite.split('/')[0]; return browserOn() && h === host.replace(/^www\./, '') ? sec('secret') : null; };
  // pos: where in the host element the gem sits: [x, y] as fractions, or 'seed' (somewhere seeded by the day)
  const FIND = {
    'pc.desk': [() => $('desktop'), [0.62, 0.78]],
    'pc.start': [() => { const s = $('startMenu'); return s && s.classList.contains('open') ? s : null; }, [0.03, 0.62]],
    'pc.bin': [() => inWin('.rb .rb-list'), [0.82, 0.78]],
    'pc.mycomp': [() => inWin('.fx:not(.rb) .fx-web'), [0.12, 0.86]],
    'pc.paint': [() => inWin('.pgp-area'), [0.9, 0.86]],
    'pc.sol': [() => inWin('.solwrap', /solitaire/i), [0.035, 0.06]],
    'pc.freecell': [() => inWin('.solwrap', /freecell/i), [0.93, 0.03]],
    'pc.notepad': [() => inWin('.np'), [0.93, 0.05]],
    'pc.dos': [() => { dosHook(); const h = inWin('.dos-host'), cv = h && h.querySelector('canvas'), S = cv && cv._ghScr; return S && S.ch && /bytes free/i.test(S.ch.join('')) ? h : null; }, [0.9, 0.86]],
    'pc.calc': [() => inWin('.pgc'), [0.02, 0.32]],
    'pc.control': [() => inWin('.pgk-cp .pgk-side'), [0.7, 0.86]],
    'pc.outlook': [() => inWin('.oe-folders'), [0.72, 0.86]],
    'pc.jackamp': [() => inWin('.pga-pl .pga-list'), [0.84, 0.72]],
    'pc.mines': [() => inWin('.sw-top'), [0.04, 0.08]],
    'pc.help': [() => inWin('.sys-h-nav'), [0.78, 0.88]],
    'pc.wordpad': [() => inWin('.wp-page'), [0.9, 0.84]],
    'pc.fridge': [() => inWin('.so-fboard'), [0.42, 0.3]],
    'pc.chest': [() => inWin('.lx-chest .lx-cbody'), [0.93, 0.03]],
    'pc.find': [() => { const q = inWin('form .fq'); return q ? q.closest('form') : null; }, [0.9, 0.72]],
    'pc.run': [() => inWin('.appbody', /^Run$/), [0.02, 0.62]],
    'pc.chores': [() => inWin('.grc-note'), [0.86, 0.9]],
    'pc.pet': [() => inWin('.ff-egg'), [0.1, 0.06]],
  };
  for (const s of ['home', 'reviews', 'cheats', 'letters', 'art', 'forums', 'demos', 'top10', 'comics', 'starwars', 'links', 'downloads', 'penpals', 'quiz', 'polls', 'members']) FIND['mag.' + s] = [() => sec(s), 'seed'];
  const WEB = { waaaghooo: 'waaaghooo.find', jackgle: 'jackgle.find', hamster: 'hamstercam.webcom', bay: 'jackbay.webcom', bank: 'jacknetbank.webcom', lootlings: 'lootlings.jnet', shack: 'sharewareshack.netz', hpz: 'homepagez.webcom', dave: 'davesplace.jnet', scifi: 'scifizone.cyb', space: 'jackspacenews.cyb', blocks: 'blockshrine.w3b', cube: 'cuberecords.infobahn', robots: 'houserobots.cyb', bricks: 'brickwishlist.kidz', yoyo: 'yoyozone.kidz', zone: 'jacknetzone.jnet', oddjobz: 'oddjobz.jnet', hunt: 'rupeehunt.jnet' };
  for (const k in WEB) FIND['web.' + k] = [() => site(WEB[k]), 'seed'];
  // the DOS prompt draws on a canvas: let its screens tell us what they're showing (for the DIR spot)
  const dosHook = () => { try { const S = window.DOS && DOS.core && DOS.core.Screen; if (S && S.prototype.render && !S.prototype._ghWrap) { const R = S.prototype.render; S.prototype.render = function () { if (this.canvas) this.canvas._ghScr = this; return R.apply(this, arguments); }; S.prototype._ghWrap = 1; } } catch (e) {} };
  const EXT = {}; // spots other files registered: id -> { el, hint }

  // ================================================================ today's gems
  let H = null; // { day, spots:[{id,c,clue,hint}], got:[ids], top, bonus }
  const localKey = () => 'jhp_grind_gfound_' + (H ? H.day : '');
  let localGot = []; // a guest's finds (this browser only, today only)
  const isMember = () => Grind.member;
  const gotIt = id => !!H && (H.got.includes(id) || (!isMember() && localGot.includes(id)));
  function data(m) {
    H = { day: m.day, spots: m.spots || [], got: (m.got || []).slice(), top: m.top || [], bonus: m.bonus | 0 };
    localGot = store.get(localKey(), []);
    document.querySelectorAll('.gh-gem').forEach(g => { if (!H.spots.some(s => s.id === g.dataset.id) || gotIt(g.dataset.id)) g.remove(); });
    tick(); render();
  }
  function seedPos(id, host) {
    const h = hash((H ? H.day : '') + '|' + id), W = Math.max(60, host.scrollWidth || host.clientWidth), Ht = Math.max(80, host.scrollHeight || host.clientHeight);
    const x = 0.06 + (h % 1000) / 1000 * 0.84, y = Math.min(Ht - 50, 140 + ((h >>> 10) % 1000) / 1000 * Math.min(1100, Ht - 180));
    return { left: Math.round(x * (W - 40)) + 'px', top: Math.max(30, Math.round(y)) + 'px' };
  }
  function place(spot, host, pos) {
    if (host.querySelector(':scope > .gh-gem[data-id="' + spot.id + '"]')) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'gh-gem gh-' + spot.c; b.dataset.id = spot.id;
    b.setAttribute('aria-label', `A sparkly ${C.GEM_NAME[spot.c]} Rupee! Click to pick it up`); b.title = `A ${C.GEM_NAME[spot.c]} Rupee! (${RP(C.GEM[spot.c])})`;
    b.innerHTML = gemSvg(spot.c, 24) + '<i class="gh-sp a"></i><i class="gh-sp b"></i><i class="gh-sp c"></i>';
    if (pos === 'seed') Object.assign(b.style, seedPos(spot.id, host));
    else { b.style.left = `calc(${(pos[0] * 100).toFixed(1)}% - ${Math.round(pos[0] * 34)}px)`; b.style.top = `calc(${(pos[1] * 100).toFixed(1)}% - ${Math.round(pos[1] * 38)}px)`; }
    b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); pick(b, spot); });
    b.addEventListener('pointerdown', ev => ev.stopPropagation());
    b.addEventListener('mousedown', ev => ev.stopPropagation());
    host.appendChild(b);
  }
  function tick() {
    if (!H || document.hidden) return;
    for (const s of H.spots) {
      if (gotIt(s.id)) continue;
      const f = FIND[s.id], x = EXT[s.id];
      let host = null, pos = 'seed';
      try { if (x && vis(x.el)) { host = x.el; pos = x.pos || [0.9, 0.85]; } else if (f) { host = f[0](); pos = f[1]; } } catch (e) { host = null; }
      if (host) place(s, host, pos);
    }
  }
  setInterval(tick, 1200);
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('appwin')) { setTimeout(tick, 300); setTimeout(tick, 1200); return; } }).observe(document.body, { childList: true });
  document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('#startBtn')) setTimeout(tick, 60); }, true);

  // ================================================================ picking one up
  const waiting = new Map(); // id -> gem element
  function pick(b, spot) {
    if (!isMember()) {
      b.classList.add('gh-pop'); setTimeout(() => b.remove(), 600);
      if (!localGot.includes(spot.id)) { localGot.push(spot.id); store.set(localKey(), localGot); }
      sparkle(spot.c);
      Desk.toast(`You found a ${C.GEM_NAME[spot.c]} Rupee!`, `Worth ${RP(C.GEM[spot.c])}... if you were a JackNet member. Guests can hunt, but only members keep what they find. Joining is FREE (Start > Log Off).`, 7000);
      A.secret('grind.hunt1'); render();
      return;
    }
    if (waiting.has(spot.id)) return;
    waiting.set(spot.id, b);
    b.style.pointerEvents = 'none';
    Grind.send({ t: 'grClaim', id: spot.id });
    setTimeout(() => { if (waiting.get(spot.id) === b) { waiting.delete(spot.id); b.style.pointerEvents = ''; } }, 6000);
  }
  function sparkle(c) {
    if (!window.Sound || !Sound.on || !Sound.note) return;
    const base = { green: 1047, blue: 1175, red: 1319, purple: 1397, gold: 1568, rainbow: 1760 }[c] || 1047;
    [1, 1.26, 1.5, 2].forEach((k, i) => setTimeout(() => Sound.note(base * k, 0.09, 'triangle'), i * 70));
  }
  Grind.on('grClaimed', m => {
    const b = waiting.get(m.id) || document.querySelector('.gh-gem[data-id="' + m.id + '"]'); waiting.delete(m.id);
    if (H && !H.got.includes(m.id)) H.got.push(m.id);
    if (b) { b.classList.add('gh-pop'); setTimeout(() => b.remove(), 600); }
    if (m.again) return;
    sparkle(m.c);
    A.secret('grind.hunt1'); if (m.c === 'rainbow') A.secret('grind.rainbow');
    const nm = C.GEM_NAME[m.c] || 'Green';
    if (m.all) {
      A.secret('grind.hunt10');
      setTimeout(() => Desk.msgbox('The Great Rupee Hunt', `ALL TEN FOUND!\n\nYou found every gem hidden on the PC and the JackNet today. Here's a bonus of ${RP(m.bonus)} and a little something from the Lootlings.\n\nNew gems get hidden at midnight. See you tomorrow, treasure hunter!`, 'info', [['Hall of Fame', () => Grind.go('http://www.netizenhof.jnet/')], ['OK']]), 900);
    } else Desk.toast(`${nm} Rupee found! (${m.n} of ${H ? H.spots.length : 10})`, `${m.amt ? '+' + RP(m.amt) + '. ' : ''}${H && m.n < H.spots.length ? `${H.spots.length - m.n} more hidden today. Clues at www.rupeehunt.jnet` : ''}`, 5000);
    render();
  });
  Grind.on('grErr', m => { for (const [id, b] of waiting) { b.style.pointerEvents = ''; waiting.delete(id); } });
  Grind.on('me', () => { if (Grind.member) { localGot = []; } });

  // ================================================================ the web site: www.rupeehunt.jnet
  let pageEl = null;
  function page(el) {
    pageEl = el; el.className = 'gr-page ghs';
    if (!H) { el.innerHTML = '<div class="ghs-in"><p style="padding:20px">Burying the gems... (connecting to JackNet)</p></div>'; Grind.send({ t: 'grHunt' }); return; }
    Grind.send({ t: 'grHunt' }); // fresh top hunters
    render();
  }
  const longDate = () => { const t = Desk.today99(); return t.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
  const legend = () => Object.keys(C.GEM).map(c => `<span>${gemSvg(c, 20)}${C.GEM[c]}</span>`).join('');
  function render() {
    const el = pageEl; if (!el || !el.isConnected || !H) return;
    const mem = isMember(), got = H.spots.filter(s => gotIt(s.id)), total = H.spots.reduce((s, x) => s + C.GEM[x.c], 0);
    const nudged = store.get('jhp_grind_nudge_' + H.day, []);
    const worth = got.reduce((s, x) => s + C.GEM[x.c], 0);
    el.innerHTML = `<div class="ghs-in">
  <div class="ghs-top"><h1><small>THE GREAT</small>RUPEE HUNT!</h1><div class="ghs-gems">${legend()}</div><div class="ghs-date">Today's hunt: <b>${esc(longDate())}</b> &middot; new gems are hidden every night at midnight</div></div>
  ${mem ? '' : (window.Guest ? Guest.webNote('Keeping the gems you find') : '')}
  <div class="ghs-sec"><h2>Your progress today</h2>
    <div class="ghs-row">${H.spots.map(s => `<div class="ghs-slot ${gotIt(s.id) ? 'got' : 'no'}" title="${gotIt(s.id) ? 'Found! ' + C.GEM_NAME[s.c] : 'Not found yet'}">${gemSvg(gotIt(s.id) ? s.c : 'green', 26)}${gotIt(s.id) ? `<b>${C.GEM[s.c]}</b>` : ''}</div>`).join('')}</div>
    <p class="ghs-meter"><b>${got.length}</b> of ${H.spots.length} found${mem ? ` &middot; <b>${esc(RP(worth))}</b> so far` : ' (as a guest: nothing kept!)'} &middot; today's ten are worth <b>${esc(RP(total))}</b>, plus a bonus of <b>${esc(RP(H.bonus))}</b> and a Lootlings surprise for finding all ten.</p>
  </div>
  ${got.length >= H.spots.length ? `<div class="ghs-done">&#9733; YOU FOUND THEM ALL! &#9733; Come back tomorrow for ten more. &#9733;</div>` : ''}
  <div class="ghs-sec"><h2>Today's clues</h2>
    <ol class="ghs-clues">${H.spots.map(s => { const g = gotIt(s.id), n = nudged.includes(s.id); return `<li class="${g ? 'got' : ''}"><span class="ghs-cl">${esc(s.clue)}${!g && n ? `<span class="ghs-hint">Nudge: ${esc(s.hint)}</span>` : ''}${s.c === 'gold' || s.c === 'rainbow' ? `<span class="ghs-big">${s.c === 'rainbow' ? 'RAINBOW!!' : 'THE BIG ONE'}</span>` : ''}</span><span class="ghs-st">${g ? `${gemSvg(s.c, 16)} <b>found!</b>` : (n ? '' : `<button class="btn" data-nudge="${esc(s.id)}">Nudge?</button>`)}</span></li>`; }).join('')}</ol>
  </div>
  <div class="ghs-sec ghs-cols">
    <div class="ghs-box"><b>HOW IT WORKS</b><ul style="margin:4px 0 0;padding-left:18px;line-height:1.45">
      <li>Every day, ten gems are hidden on <b>this PC</b> (the desktop and the programs), in <b>JACK ATTACK!</b> (the magazine) and on <b>the JackNet</b> (other web sites).</li>
      <li>Everybody hunts the same ten spots. A gem sparkles a bit. Click it to pick it up.</li>
      <li>Colour = value: Green 1, Blue 5, Red 20, Purple 50, Gold 100. Rainbow is 500, and very, very rare.</li>
      <li>Stuck? Click <b>Nudge?</b> for a plainer hint. No penalty: it's a game, not a test.</li>
      <li>Missed a day? No worries. Nothing carries over and nothing is lost.</li></ul></div>
    <div class="ghs-box"><b>TODAY'S TOP HUNTERS</b>${H.top.length ? `<table>${H.top.slice(0, 10).map((r, i) => `<tr><td>${i + 1}.</td><td><a href="#" class="plink" data-profile="${esc(r.n)}">${esc(r.n)}</a></td><td>${r.f} of ${H.spots.length}${r.f >= H.spots.length ? ' &#9733;' : ''}</td></tr>`).join('')}</table>` : '<p style="margin:6px 0">Nobody yet today. You could be first!</p>'}
      <p style="margin:6px 0 0"><a href="http://www.netizenhof.jnet/">The Netizen Hall of Fame &raquo;</a></p></div>
  </div>
  <div class="ghs-foot">The Great Rupee Hunt is a JackNet Members' Club service &middot; Gems hidden by Jack and Dave &middot; Best viewed in JackNet Explorer at 800x600<br>Also try: <a href="http://www.oddjobz.jnet/">The Odd Jobz Board</a> (Rupees for jobs) &middot; Start &gt; Programs &gt; Rupees &amp; Rank</div>
</div>`;
    el.querySelectorAll('[data-nudge]').forEach(bt => bt.addEventListener('click', () => { const L = store.get('jhp_grind_nudge_' + H.day, []); if (!L.includes(bt.dataset.nudge)) L.push(bt.dataset.nudge); store.set('jhp_grind_nudge_' + H.day, L); Sound.play('click'); render(); }));
    setTimeout(tick, 50); // web.hunt might be on this very page
  }

  window.GemHunt = {
    data, page, tick,
    spot(id, el, hint) { if (!id || !el) return; EXT[id] = { el, hint: hint || '' }; setTimeout(tick, 50); },
    get today() { return H; }, FIND,
  };
  if (Grind.hunt) data(Grind.hunt);
})();

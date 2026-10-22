/* mp.js: PLAY TOGETHER. One shared way to play the PC's games with the other people on JackNet.
 *  - every game that can be played online gets "Play with someone..." in its Game menu (MP.pick)
 *  - the JackNet-wide "Who wants to play?" lobby (MP.lobby): put your name up, answer somebody else's, invite anyone
 *  - invites are tray balloons with Accept / Decline; JSN and Uh-Oh! contacts get "Invite to a game..." (MP.chooseGame)
 *  - live "N playing now" counts for everything social (mods/mp.js on the server)
 *  - online sessions (MP.Session) that ride out a dropped connection: seats are held for two minutes, messages sent while
 *    offline wait in an outbox, the host resends the board when somebody comes back, and a reloaded page picks its game
 *    back up where it left off
 *  - the race kit (MP.hook): two or more people play the same seeded board/deal at once, with a live progress strip
 * Games plug in with MP.game(id, def). The Zone's board games keep their own engine (zone-core.js) and are linked here. */
(function () {
  'use strict';
  if (!window.Apps || !window.Net) return;
  const esc = Apps.esc, store = Apps.store;
  const MP = window.MP = {};
  const Z = () => window.Zone || {};
  const meId = () => Net.me.id, meNick = () => Net.me.nick || 'Me';
  const online = () => (Z().online || []);
  const isOn = id => online().some(o => o.id === id);
  const nickOf = id => { const o = online().find(x => x.id === id); return o ? o.nick : ''; };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const secret = id => { try { Apps.secret(id); } catch (e) {} };
  const relay = (to, ch, d) => (Z().relay ? Z().relay(to, ch, d) : Net.relay(to, ch, d));
  const rid = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  const okSid = v => typeof v === 'string' && /^[a-z0-9]{8}$/.test(v);
  const GRACE = 120000;
  const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const clean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, n || 60).trim();

  // ================================================================ look (injected: one file, no extra stylesheet)
  const css = document.createElement('style');
  css.textContent = `
.mp-strip{flex:none;width:0;min-width:100%;box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:3px 6px;background:#000080;color:#fff;font:11px Tahoma,Verdana,sans-serif;border-bottom:1px solid #000;min-height:20px}
.mp-strip b{color:#ffd400}
.mp-strip .mp-pl{display:inline-flex;align-items:center;gap:4px;background:#00006a;border:1px solid #4a4ad0;padding:1px 5px;max-width:100%}
.mp-strip .mp-pl.me{border-color:#ffd400}
.mp-strip .mp-pl.lost{opacity:.6;border-style:dashed}
.mp-strip .mp-pl i{display:inline-block;width:46px;height:7px;background:#000;border:1px solid #808080;position:relative}
.mp-strip .mp-pl i u{position:absolute;left:0;top:0;bottom:0;background:#5aff2a}
.mp-strip .mp-msg{flex:1 1 140px;min-width:0}
.mp-strip .mp-msg.warn{color:#ffd400}
.mp-strip .btn{font-size:11px;padding:1px 6px;min-height:0;color:#000}
.mp-cd{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:bold 64px Arial Black,Arial,sans-serif;color:#ffd400;text-shadow:3px 3px #000;pointer-events:none;z-index:50}
.mp-res{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;background:#c0c0c0;border:2px outset #fff;box-shadow:3px 3px 0 #0006;padding:10px 12px;min-width:220px;max-width:calc(100% - 16px);font:12px Tahoma,sans-serif;text-align:center}
.mp-res h3{margin:0 0 6px;font:bold 15px Arial,sans-serif;color:#000080}
.mp-res ol{text-align:left;margin:6px 0 8px;padding-left:22px}
.mp-res .row{justify-content:center;flex-wrap:wrap;gap:6px}
.balloon .mp-inv{display:flex;gap:6px;margin-top:6px}
.balloon .mp-inv .btn{min-width:64px;min-height:26px}
.mpl{display:flex;flex-direction:column;gap:6px;font:12px Tahoma,sans-serif}
.mpl-head{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:6px 8px;display:flex;align-items:center;gap:8px}
.mpl-head b{font:bold 16px Arial Black,Arial,sans-serif;letter-spacing:1px}
.mpl-head small{opacity:.85}
.mpl-cols{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mpl .group{margin:0;min-width:0}
.mpl .field{background:#fff;overflow:auto;height:150px;padding:2px}
.mpl .field.games{height:auto;max-height:260px}
.mpl table{width:100%;border-collapse:collapse}
.mpl td{padding:3px 4px;border-bottom:1px dotted #c0c0c0;vertical-align:middle}
.mpl td.r{text-align:right;white-space:nowrap}
.mpl .dim{color:#808080}
.mpl .lost{color:#a06000}
.mpl .gico{width:16px;height:16px;display:inline-block;vertical-align:-3px;margin-right:4px}
.mpl .gico svg{width:16px;height:16px}
.mpl .now{color:#008000;font-weight:bold}
.mpl .btn{min-height:24px}
.mpl .seekrow{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.mpl .seekrow select,.mpl .seekrow input{font:12px Tahoma,sans-serif;min-height:24px;max-width:100%}
.mp-herenow{margin:4px 0;font:11px Tahoma,Verdana,sans-serif;color:inherit;text-align:left}
.mp-herenow .live{font-size:9px}
.mp-herenow .dim{opacity:.7}
.mpp{display:flex;flex-direction:column;gap:6px;font:12px Tahoma,sans-serif}
.mpp .field{background:#fff;max-height:220px;overflow:auto;padding:2px}
.mpp td{padding:4px}
.mpp .btn{min-height:26px}
@media (max-width:640px){.mpl-cols{grid-template-columns:1fr}.mpl .field{height:auto;max-height:150px}.mpl .field.games{max-height:none}}
`;
  document.head.appendChild(css);

  const ICON16 = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="4" width="6" height="7" fill="#2a6ad8" stroke="#00205a"/><rect x="9" y="4" width="6" height="7" fill="#e01010" stroke="#600"/><rect x="3" y="6" width="2" height="2" fill="#fff"/><rect x="11" y="6" width="2" height="2" fill="#fff"/><path d="M7 7h2" stroke="#000"/><rect x="2" y="12" width="12" height="2" fill="#ffd400" stroke="#7a5a00" stroke-width=".5"/></svg>';
  const ICON32 = '<svg viewBox="0 0 32 32"><rect x="2" y="7" width="12" height="13" rx="1" fill="#2a6ad8" stroke="#00205a"/><rect x="18" y="7" width="12" height="13" rx="1" fill="#e01010" stroke="#600"/><circle cx="8" cy="12" r="2.5" fill="#fff"/><circle cx="24" cy="12" r="2.5" fill="#fff"/><path d="M5 18c1-2 5-2 6 0M21 18c1-2 5-2 6 0" stroke="#fff" fill="none"/><path d="M14 13h4M15 11l-1 2 1 2M17 11l1 2-1 2" stroke="#000" fill="none"/><rect x="4" y="23" width="24" height="6" fill="#ffd400" stroke="#7a5a00"/><path d="M7 26h3M13 26h3M19 26h3" stroke="#7a5a00" stroke-width="2"/></svg>';
  MP.ICON = ICON16;

  // ================================================================ secrets
  [['mp.invite', 'Anyone for a game?', 'Invite somebody on JackNet to play'],
    ['mp.race', 'Photo finish', 'Win an online race on the same board'],
    ['mp.lobby', 'Who wants to play?', 'Put your name up in the JackNet lobby'],
    ['mp.comeback', 'Back from the dead (connection)', 'Lose your connection mid-game and carry on'],
    ['mp.rematch', 'Again! Again!', 'Play an online rematch'],
    ['mp.hearts', 'Full house', 'Deal a hand of Hearts with no bots at the table'],
    ['mp.answer', 'Go on then', 'Answer somebody who put their name up in the lobby'],
    ['mp.squigs', 'World war jack', 'Win an online war of jacks against real people'],
    ['mp.squigwatch', 'Armchair general', 'Watch somebody else\'s online jack war'],
    ['mp.snake2', 'Link cable', 'Win a two-player Snake match on a pocket phone'],
    ['mp.fff', 'Fastest finger', 'Get the order right first and win the hot seat'],
    ['mp.armchair', 'Shouting at the telly', 'Get five answers right from the sofa while somebody else is in the hot seat'],
  ].forEach(s => Apps.defineSecret(...s));

  // ================================================================ the registry: everything you can do with other people
  // def: { name, icon, kind: 'race'|'turn'|'cards'|'room'|'toy'|'party', players: '2'|'2-4'|'lots', blurb, where,
  //        open(): launch it, live(): true when this visitor is using it right now (for the "playing now" counts),
  //        invite: 'session'|'zone'|'open'|false, start(sess): a session began (session games), race: { app, metric, first } }
  const GAMES = MP.GAMES = {}, ORDER = MP.ORDER = [];
  MP.game = (id, def) => { if (!GAMES[id]) ORDER.push(id); GAMES[id] = Object.assign({ id, kind: 'room', players: '2', invite: false, icon: ICON16 }, GAMES[id] || {}, def); return GAMES[id]; };
  const appOpen = id => { const a = Apps.apps[id]; return !!(a && a._w && !a._w.closed); };
  MP.appOpen = appOpen;
  // a fresh PC hasn't got most games installed (setup.js): an invite to one you haven't got offers the Software Centre
  const needApp = def => (def ? def.app || (def.race && def.race.app) || '' : '');
  const installed = g => { const a = needApp(GAMES[g]); return !a || !window.Setup || !Setup.ok || Setup.ok(a); };
  MP.installed = installed;
  const getSoftware = () => { try { Apps.run('software'); } catch (e) { try { Apps.open('setup.centre'); } catch (er) {} } };
  MP.getSoftware = getSoftware;
  function notInstalled(g, who) { Desk.msgbox('JackNet', `${who ? who + ' wants to play' : 'To play'} ${gname(g)}${who ? ' with you, but you' : ', you'} haven't got it on this PC yet.\n\nIt's free from the JackNet Software Centre. Get it, then try again!`, 'info', [['Software Centre', getSoftware], ['Not now']]); }
  MP.notInstalled = notInstalled;
  const KIND = { race: 'Race on the same board', turn: 'Head to head', cards: 'Card table (bots fill empty seats)', room: 'Hang out', toy: 'Shared toy', party: 'Everybody at once', live: 'Live action' };
  MP.KIND = KIND;

  // ================================================================ "playing now" counts + the lobby (server: mods/mp.js)
  const now = MP.now = { n: {}, seeks: [], top: [] };
  const nowFns = new Set();
  MP.onNow = fn => { nowFns.add(fn); return () => nowFns.delete(fn); };
  const nowChanged = () => nowFns.forEach(f => { try { f(now); } catch (e) { console.error(e); } });
  Net.on('mpNow', m => { if (m && m.n && typeof m.n === 'object') now.n = m.n; if (Array.isArray(m.seeks)) now.seeks = m.seeks; nowChanged(); });
  Net.on('mpTop', m => { if (Array.isArray(m.top)) { now.top = m.top; nowChanged(); } });
  MP.count = id => (now.n[id] | 0);
  // what I'm doing: explicit (MP.here) + detected (each def.live()), sent when it changes
  const held = new Map(); let lastHere = '';
  MP.here = (id, on) => { const n = (held.get(id) | 0) + (on ? 1 : -1); if (n > 0) held.set(id, n); else held.delete(id); pushHere(); };
  function mine() {
    const s = new Set(held.keys());
    for (const id of ORDER) { const d = GAMES[id]; if (d.live) { try { if (d.live()) s.add(id); } catch (e) {} } }
    return [...s].slice(0, 6);
  }
  let hereT = 0;
  function pushHere(force) {
    clearTimeout(hereT);
    hereT = setTimeout(() => { const g = mine(), k = g.join(','); if (!force && k === lastHere) return; if (Net.send({ t: 'mpHere', g })) lastHere = k; }, 250);
  }
  setInterval(() => pushHere(false), 4000);
  Net.on('welcome', () => { lastHere = '#'; setTimeout(() => pushHere(true), 600); });

  // ================================================================ invitations
  // relay 'mp.inv': { k:'inv', iid, g, o } -> { k:'acc'|'dec', iid, why }; { k:'can', iid }; { k:'join', iid, g } (answering a lobby call)
  const INV = MP.INV = { out: new Map(), inbox: new Map(), accepted: new Map() };
  MP.opts = Object.assign({ noinv: false }, store.get('jhp_mp_opts', {}));
  const saveOpts = () => store.set('jhp_mp_opts', MP.opts);
  const gname = g => (GAMES[g] ? GAMES[g].name : g);
  // a tray balloon with buttons (Desk.toast gives us the element)
  function askBalloon(title, text, btns, ms) {
    // straight onto the screen (not behind any queued tray balloons): somebody is waiting for the answer
    const wrap = document.getElementById('toastWrap');
    const b = document.createElement('div'); b.className = 'balloon mp-ask'; b.setAttribute('role', 'alertdialog');
    const t = document.createElement('b'); t.textContent = title; b.appendChild(t); b.appendChild(document.createTextNode(text));
    let gone = false; b._gone = () => { if (gone) return; gone = true; b.remove(); };
    if (wrap) wrap.insertBefore(b, wrap.firstChild); else return Desk.toast(title, text, ms || 30000);
    setTimeout(b._gone, ms || 30000);
    try { document.dispatchEvent(new CustomEvent('jhp-toast', { detail: { title, text } })); } catch (e) {}
    const row = document.createElement('div'); row.className = 'mp-inv';
    btns.forEach(([label, fn]) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn'; x.textContent = label; x.addEventListener('click', ev => { ev.stopPropagation(); try { b._gone(); } catch (e) {} fn(); }); row.appendChild(x); });
    b.appendChild(row); b.title = '';
    return b;
  }
  MP.askBalloon = askBalloon;
  function busyIn(g) { for (const s of SESS.values()) if (!s.ended && s.g === g) return true; return false; }
  Net.onRelay('mp.inv', (d, m) => {
    if (!d || typeof d !== 'object' || !okSid(d.iid) || !m || !m.fromId || m.fromId === meId()) return;
    const from = clean(m.from || 'Someone', 24), def = GAMES[d.g];
    if (d.k === 'inv') {
      if (!def || !def.invite) return;
      if (MP.opts.noinv || (Z().opts && Z().opts.noinv)) return relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'noinv' });
      if (INV.inbox.size >= 4 || [...INV.inbox.values()].some(x => x.fromId === m.fromId && x.g === d.g)) return relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'busy' });
      const entry = { fromId: m.fromId, from, g: d.g, o: d.o && typeof d.o === 'object' ? d.o : {}, iid: d.iid, b: null, timer: 0 };
      INV.inbox.set(d.iid, entry);
      const answer = yes => {
        if (!INV.inbox.has(d.iid)) return; INV.inbox.delete(d.iid); clearTimeout(entry.timer);
        try { if (entry.b) entry.b._gone(); } catch (e) {}
        if (!yes) return relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'no' });
        acceptFrom(m.fromId, from, d.g, d.iid);
      };
      const verb = def.kind === 'room' || def.kind === 'toy' ? `wants you to join them in ${def.name}` : `wants to play ${def.name} with you`;
      if (!installed(d.g)) {
        entry.b = askBalloon('JackNet: Who wants to play?', `${from} ${verb}, but you haven't got it on this PC yet. It's free from the Software Centre!`, [['Get it', () => { INV.inbox.delete(d.iid); clearTimeout(entry.timer); relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'notinst' }); getSoftware(); }], ['Decline', () => answer(false)]], 30000);
      } else entry.b = askBalloon('JackNet: Who wants to play?', `${from} ${verb}!`, [['Accept', () => answer(true)], ['Decline', () => answer(false)]], 30000);
      sfx('join');
      entry.timer = setTimeout(() => { if (INV.inbox.has(d.iid)) { INV.inbox.delete(d.iid); relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'timeout' }); try { entry.b._gone(); } catch (e) {} } }, 32000);
      return;
    }
    if (d.k === 'can') { const e = INV.inbox.get(d.iid); if (e && e.fromId === m.fromId) { INV.inbox.delete(d.iid); clearTimeout(e.timer); try { e.b._gone(); } catch (er) {} Desk.toast('JackNet', `${from} cancelled the invitation.`, 3000); } return; }
    if (d.k === 'join') { // somebody answered my name in the lobby
      const def2 = GAMES[d.g]; if (!def2) return;
      const mineSeek = now.seeks.some(s => s.id === meId() && s.g === d.g);
      if (!mineSeek || busyIn(d.g) || (d.g.startsWith('zone.') && Z().busy && Z().busy())) return relay(m.fromId, 'mp.inv', { k: 'dec', iid: d.iid, why: 'taken' });
      Net.send({ t: 'mpUnseek', g: d.g });
      Desk.toast('JackNet: Who wants to play?', `${from} answered your call for a game of ${def2.name}!`, 5000); sfx('join');
      relay(m.fromId, 'mp.inv', { k: 'acc', iid: d.iid });
      if (def2.invite === 'zone') Z().boot().then(() => Z().startHosted(m.fromId, from, d.g.slice(5), 0, { inv: true }));
      else startAsHost(d.g, [{ id: m.fromId, nick: from }], {});
      return;
    }
    const o = INV.out.get(d.iid); if (!o || o.to !== m.fromId) return;
    if (d.k === 'acc') { INV.out.delete(d.iid); clearTimeout(o.timer); try { o.dlg && o.dlg.close(); } catch (e) {} o.cb(true); }
    if (d.k === 'dec') {
      INV.out.delete(d.iid); clearTimeout(o.timer); try { o.dlg && o.dlg.close(); } catch (e) {}
      const why = { busy: 'is busy with another invitation', noinv: 'has invitations switched off', timeout: "didn't answer (probably gone for their tea)", taken: 'already found somebody else. Too slow!', notinst: "hasn't got that game yet (they've gone to the Software Centre to get it: try again in a minute)" }[d.why] || 'said no thanks';
      if (!o.quiet) Desk.msgbox('JackNet', `${o.nick} ${why}.`, 'info');
      o.cb(false);
    }
  });
  // the guest side of an accepted invite / answered call: remember who we said yes to, so their 'go' is welcome
  function acceptFrom(hostId, hostNick, g, iid) {
    const def = GAMES[g];
    if (def.invite === 'zone') { // the Zone's own engine: it wants the 'accepted' note before the host's 'start'
      const zg = g.slice(5);
      Z().boot().then(() => { Z().INV.accepted.set(hostId, { g: zg, lv: 0, iid, ts: Date.now() }); relay(hostId, 'mp.inv', { k: 'acc', iid }); }).catch(() => relay(hostId, 'mp.inv', { k: 'dec', iid, why: 'error' }));
      return;
    }
    if (def.invite === 'open') { relay(hostId, 'mp.inv', { k: 'acc', iid }); try { def.open(); } catch (e) { console.error(e); } return; }
    INV.accepted.set(hostId, { g, ts: Date.now() });
    relay(hostId, 'mp.inv', { k: 'acc', iid });
    Desk.toast('JackNet', `Connecting to ${hostNick}'s game...`, 2500);
  }
  // send an invite. cb(true) once accepted. o: extra options for the game
  MP.invite = (peer, g, o, cb) => {
    const def = GAMES[g]; if (!def || !def.invite) return;
    if (!installed(g)) return notInstalled(g);
    if (!Net.connected) return Desk.msgbox('JackNet', 'You are not connected to JackNet. (Is somebody on the phone?)', 'warn');
    if (!peer || peer.id === meId()) return;
    if ([...INV.out.values()].some(x => x.to === peer.id)) return Desk.msgbox('JackNet', `You're already waiting for ${peer.nick} to answer.`, 'info');
    if (def.invite === 'zone' && Z().busy && Z().busy()) return Desk.msgbox('JackNet', 'Finish (or leave) your Zone game first!', 'info');
    const iid = rid(), out = { iid, to: peer.id, nick: peer.nick, g, timer: 0, dlg: null, cb: ok => {
      if (cb) cb(ok);
      if (!ok) return;
      if (def.invite === 'zone') { const zg = g.slice(5); Z().boot().then(() => Z().startHosted(peer.id, peer.nick, zg, (o && o.lv) | 0, { inv: true })); }
      else if (def.invite === 'session') startAsHost(g, [{ id: peer.id, nick: peer.nick }], o || {});
    } };
    INV.out.set(iid, out);
    relay(peer.id, 'mp.inv', { k: 'inv', iid, g, o: o || {} });
    const cancel = () => { if (!INV.out.has(iid)) return; INV.out.delete(iid); clearTimeout(out.timer); relay(peer.id, 'mp.inv', { k: 'can', iid }); };
    out.dlg = Desk.msgbox('JackNet', `Inviting ${peer.nick} to ${def.kind === 'room' || def.kind === 'toy' ? 'join you in' : 'play'} ${def.name}...\n\nWaiting for an answer.`, 'info', [['Cancel', cancel]]);
    try { const x = out.dlg.el.querySelector('.tb button'); if (x) x.addEventListener('click', cancel, true); } catch (e) {}
    out.timer = setTimeout(() => { if (!INV.out.has(iid)) return; cancel(); try { out.dlg.close(); } catch (e) {} Desk.msgbox('JackNet', `No answer from ${peer.nick}. Maybe they've gone for their tea.`, 'info'); }, 35000);
    secret('mp.invite');
  };
  // answer somebody's name in the lobby
  MP.join = seek => {
    const def = GAMES[seek.g]; if (!def) return;
    if (seek.id === meId()) return;
    if (!installed(seek.g)) return notInstalled(seek.g);
    if (!Net.connected) return Desk.msgbox('JackNet', 'You are not connected to JackNet.', 'warn');
    if (seek.lost) return Desk.msgbox('JackNet', `${seek.nick}'s connection has dropped for a moment. Try again in a few seconds.`, 'info');
    const iid = rid();
    const go = () => {
      INV.out.set(iid, { iid, to: seek.id, nick: seek.nick, g: seek.g, quiet: false, timer: setTimeout(() => { INV.out.delete(iid); }, 20000), cb: () => {} });
      relay(seek.id, 'mp.inv', { k: 'join', iid, g: seek.g }); secret('mp.answer');
      Desk.toast('JackNet', `Answering ${seek.nick}'s call for ${def.name}...`, 3000);
    };
    if (def.invite === 'zone') { Z().boot().then(() => { Z().INV.accepted.set(seek.id, { g: seek.g.slice(5), lv: 0, iid, ts: Date.now() }); go(); }); }
    else { INV.accepted.set(seek.id, { g: seek.g, ts: Date.now() }); go(); }
  };
  MP.seek = (g, note) => {
    if (!GAMES[g]) return false;
    if (!installed(g)) { notInstalled(g); return false; }
    if (!Net.send({ t: 'mpSeek', g, note: clean(note, 60) })) { Desk.msgbox('JackNet', 'You are not connected to JackNet.', 'warn'); return false; }
    secret('mp.lobby'); Desk.toast('JackNet: Who wants to play?', `Your name is up for ${GAMES[g].name}. We'll ping you when somebody answers!`, 4000);
    return true;
  };
  MP.unseek = g => Net.send({ t: 'mpUnseek', g: g || '*' });
  MP.seeking = g => now.seeks.some(s => s.id === meId() && s.g === g);

  // ================================================================ sessions
  // relay 'mp.s': { sid, k, ... }. The host is authoritative: it hands out the roster (and seed), and resends the full
  // state when somebody comes back. k: go (host -> player: start/round), m (game message), need (please resend), st (state),
  // rost (roster), bye (left on purpose), end (host closed it).
  const SESS = MP.sessions = new Map();
  const LIVE_K = 'jhp_mp_live';
  const pendingGo = new Map(); // sid -> go packet that arrived before we were ready (a reload in progress)
  class Session {
    constructor(o) {
      this.sid = o.sid; this.g = o.g; this.def = GAMES[o.g]; this.hostId = o.hostId; this.roster = o.roster.map(p => ({ id: p.id, nick: clean(p.nick, 24) || 'Guest', bot: !!p.bot }));
      this.seed = o.seed >>> 0; this.o = o.o || {}; this.round = o.round | 0; this.fns = {}; this.lost = new Map(); this.gone = new Set(); this.outbox = [];
      this.ended = false; this.resumed = !!o.resumed; this.saved = o.saved; this.stateFn = null; this.strip = null; this.w = null; this.left = new Set();
      SESS.set(this.sid, this);
      MP.here(this.g, true);
      if (this.host) this.announce();
    }
    get host() { return this.hostId === meId(); }
    get me() { return this.roster.findIndex(p => p.id === meId()); }
    humans() { return this.roster.filter(p => !p.bot); }
    others() { return this.roster.filter(p => !p.bot && p.id !== meId()); }
    nick(id) { const p = this.roster.find(x => x.id === id); return p ? p.nick : nickOf(id) || 'Somebody'; }
    on(ev, fn) { (this.fns[ev] = this.fns[ev] || []).push(fn); return this; }
    emit(ev, ...a) { (this.fns[ev] || []).forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } }); }
    announce() { Net.send({ t: 'mpOpen', sid: this.rsid(), g: this.g, ids: this.humans().map(p => p.id) }); }
    rsid() { return this.sid + (this.round % 1296).toString(36).padStart(2, '0'); }
    _send(pkt, to) {
      pkt.sid = this.sid;
      const targets = to ? [to] : this.others().map(p => p.id);
      for (const id of targets) { if (this.left.has(id)) continue; if (!Net.connected || !relay(id, 'mp.s', pkt)) { this.outbox.push([id, pkt]); if (this.outbox.length > 60) this.outbox.shift(); } }
    }
    flush() { const q = this.outbox; this.outbox = []; for (const [id, pkt] of q) if (!relay(id, 'mp.s', pkt)) this.outbox.push([id, pkt]); }
    send(d, to) { this._send({ k: 'm', d }, to); }
    // host: state(fn(forId) -> st) is used whenever somebody needs catching up (a return, a reload, a sync request)
    state(fn) { this.stateFn = fn; return this; }
    sync(to) {
      if (!this.host || !this.stateFn) return;
      for (const p of this.others()) if (!to || p.id === to) { try { const st = this.stateFn(p.id); if (st !== undefined) this._send({ k: 'st', st, round: this.round, roster: this.roster, seed: this.seed, o: this.o }, p.id); } catch (e) { console.error(e); } }
    }
    need() { if (!this.host) this._send({ k: 'need' }, this.hostId); }
    save(st) { if (this.ended) return; const all = store.get(LIVE_K, {}) || {}; all[this.sid] = { sid: this.sid, g: this.g, hostId: this.hostId, roster: this.roster, seed: this.seed, o: this.o, round: this.round, st: st === undefined ? (all[this.sid] || {}).st : st, ts: Date.now() }; for (const k of Object.keys(all)) if (Date.now() - (all[k].ts || 0) > 600000) delete all[k]; store.set(LIVE_K, all); }
    unsave() { const all = store.get(LIVE_K, {}) || {}; if (all[this.sid]) { delete all[this.sid]; store.set(LIVE_K, all); } }
    // presence: who dropped, who came back, who is gone for good
    presence() {
      if (this.ended) return;
      for (const p of this.others()) {
        if (this.gone.has(p.id) || this.left.has(p.id)) continue;
        const here = isOn(p.id);
        if (!here && !this.lost.has(p.id)) {
          const t = setTimeout(() => { if (this.ended || isOn(p.id)) return; this.lost.delete(p.id); this.gone.add(p.id); this.say(`${p.nick} didn't come back.`, true); this.emit('gone', p.id); this.paint(); }, GRACE);
          this.lost.set(p.id, { at: Date.now(), t });
          this.say(`${p.nick} lost connection. Waiting for them to come back...`, true); this.emit('lost', p.id); this.paint();
        } else if (here && this.lost.has(p.id)) {
          clearTimeout(this.lost.get(p.id).t); this.lost.delete(p.id);
          this.say(`${p.nick} is back! Carrying on.`); this.emit('back', p.id); this.paint();
          if (this.host) { this.sync(p.id); this._send({ k: 'rost', roster: this.roster }, p.id); }
        }
      }
    }
    leave(quiet) { if (this.ended) return; this._send({ k: 'bye' }); this.end(quiet ? '' : 'You left the game.'); }
    end(why) {
      if (this.ended) return; this.ended = true;
      for (const l of this.lost.values()) clearTimeout(l.t);
      SESS.delete(this.sid); this.unsave(); MP.here(this.g, false);
      this.emit('end', why);
      if (this.strip) { this.say(why || 'The online game has finished.'); this.paint(); }
    }
    // ---- the strip: who's in, connection news, a Leave button. Mounted on top of the game window.
    attach(w) {
      this.w = w;
      if (!this.strip) { this.strip = document.createElement('div'); this.strip.className = 'mp-strip'; this.strip.setAttribute('aria-live', 'polite'); }
      if (w && w.el && w.body && !this.strip.isConnected) w.el.insertBefore(this.strip, w.body);
      this.paint(); return this;
    }
    say(text, warn) { this.msg = text; this.msgWarn = !!warn; clearTimeout(this.msgT); if (!warn) this.msgT = setTimeout(() => { this.msg = ''; this.paint(); }, 6000); this.paint(); }
    paint() {
      const s = this.strip; if (!s || !s.isConnected) return;
      const prog = this.progress || {};
      const pl = this.roster.map(p => { const lost = this.lost.has(p.id) || this.gone.has(p.id) || this.left.has(p.id), pr = prog[p.id];
        return `<span class="mp-pl${p.id === meId() ? ' me' : ''}${lost ? ' lost' : ''}" title="${esc(p.nick)}">${p.bot ? '&#129302; ' : ''}${esc(p.nick.slice(0, 14))}${pr ? `<i><u style="width:${Math.round(Math.max(0, Math.min(1, pr.p || 0)) * 100)}%"></u></i>${pr.txt ? ' <small>' + esc(pr.txt) + '</small>' : ''}` : ''}${this.lost.has(p.id) ? ' <small>(reconnecting)</small>' : this.gone.has(p.id) || this.left.has(p.id) ? ' <small>(gone)</small>' : ''}</span>`; }).join('');
      const off = !Net.connected && !this.ended;
      const msg = off ? 'Your connection dropped. Reconnecting...' : this.msg || this.info || '';
      const extra = this.ended ? [] : (this.btns ? this.btns() : []);
      s.innerHTML = `<b>ONLINE</b>${pl}<span class="mp-msg${off || this.msgWarn ? ' warn' : ''}">${esc(msg)}</span>${extra.map((x, i) => `<button type="button" class="btn" data-x="${i}">${esc(x[0])}</button>`).join('')}${this.ended ? '' : '<button type="button" class="btn" data-mp="leave">Leave</button>'}`;
      s.querySelectorAll('[data-x]').forEach(x => { x.onclick = () => { const e = extra[+x.dataset.x]; if (e) e[1](); }; });
      const b = s.querySelector('[data-mp="leave"]');
      if (b) b.onclick = () => Desk.msgbox(this.def.name, 'Leave this online game?', 'q', [['Leave', () => this.leave()], ['Stay']]);
    }
  }
  MP.Session = Session;
  // presence for every session
  if (Z().onOnline) Z().onOnline(() => SESS.forEach(s => s.presence()));
  Net.on('_close', () => SESS.forEach(s => { s.emit('offline'); s.paint(); }));
  let firstWelcome = true;
  Net.on('welcome', () => {
    const was = firstWelcome; firstWelcome = false;
    setTimeout(() => {
      SESS.forEach(s => {
        s.flush(); s.emit('online'); s.paint();
        if (!was) { secret('mp.comeback'); if (s.host) { s.announce(); s.sync(); } else s.need(); }
      });
      if (was) setTimeout(resumeSaved, 700);
    }, 600);
  });

  // host: start a new session with these people
  function startAsHost(g, players, o) {
    const def = GAMES[g]; if (!def || !def.start) return null;
    const max = def.max || 2;
    // a session for this game already open and not full (a card table filling up): add them to it
    for (const s of SESS.values()) if (!s.ended && s.g === g && s.host && def.tableOpen && def.tableOpen(s) && s.humans().length < max) {
      for (const p of players) if (!s.roster.some(x => x.id === p.id)) { const bi = s.roster.findIndex(x => x.bot); const np = { id: p.id, nick: p.nick, bot: false }; if (bi >= 0 && def.botsInRoster) s.roster[bi] = np; else s.roster.push(np); }
      s.announce();
      s._send({ k: 'go', g, roster: s.roster, seed: s.seed, o: s.o, round: s.round, host: meId() });
      s.emit('roster'); s.paint(); return s;
    }
    const s = new Session({ sid: rid(), g, hostId: meId(), roster: [{ id: meId(), nick: meNick() }].concat(players), seed: (Math.random() * 4294967295) >>> 0, o: Object.assign({}, def.defaults ? def.defaults() : {}, o || {}), round: 0 });
    s._send({ k: 'go', g, roster: s.roster, seed: s.seed, o: s.o, round: s.round, host: meId() });
    try { def.start(s); } catch (e) { console.error(e); }
    return s;
  }
  MP.startAsHost = startAsHost;
  // the other side
  Net.onRelay('mp.s', (d, m) => {
    if (!d || typeof d !== 'object' || !okSid(d.sid) || !m || !m.fromId || m.fromId === meId()) return;
    let s = SESS.get(d.sid);
    if (d.k === 'go') {
      const def = GAMES[d.g]; if (!def || !def.start || !Array.isArray(d.roster) || d.roster.length > 8 || !d.roster.some(p => p && p.id === meId())) return;
      const roster = d.roster.filter(p => p && Number.isInteger(p.id) && typeof p.nick === 'string').map(p => ({ id: p.id, nick: clean(p.nick, 24), bot: !!p.bot }));
      if (s) { // a new round / roster change from our host
        if (m.fromId !== s.hostId) return;
        s.roster = roster; s.seed = d.seed >>> 0; s.o = d.o && typeof d.o === 'object' ? d.o : s.o;
        const newRound = (d.round | 0) !== s.round; s.round = d.round | 0;
        s.emit(newRound ? 'round' : 'roster'); s.paint(); return;
      }
      const acc = INV.accepted.get(m.fromId);
      if (!acc || acc.g !== d.g || Date.now() - acc.ts > 120000) { pendingGo.set(d.sid, { d, m, ts: Date.now() }); return; }
      INV.accepted.delete(m.fromId);
      s = new Session({ sid: d.sid, g: d.g, hostId: m.fromId, roster, seed: d.seed, o: d.o && typeof d.o === 'object' ? d.o : {}, round: d.round | 0 });
      try { def.start(s); } catch (e) { console.error(e); }
      return;
    }
    if (!s) { if (d.k === 'st' || d.k === 'need') pendingGo.set(d.sid + ':' + d.k, { d, m, ts: Date.now() }); return; }
    if (!s.roster.some(p => p.id === m.fromId)) return;
    switch (d.k) {
      case 'm': s.emit('m', d.d, m.fromId); return;
      case 'need': if (s.host) { s.sync(m.fromId); s._send({ k: 'rost', roster: s.roster }, m.fromId); } return;
      case 'st': if (m.fromId !== s.hostId) return; if (Array.isArray(d.roster)) s.roster = d.roster.map(p => ({ id: p.id | 0, nick: clean(p.nick, 24), bot: !!p.bot })).filter(p => p.id); s.emit('state', d.st); s.paint(); return;
      case 'rost': if (m.fromId !== s.hostId || !Array.isArray(d.roster)) return; s.roster = d.roster.map(p => ({ id: p.id | 0, nick: clean(p.nick, 24), bot: !!p.bot })).filter(p => p.id); s.emit('roster'); s.paint(); return;
      case 'bye': s.left.add(m.fromId); s.say(`${s.nick(m.fromId)} left the game.`, true); s.emit('left', m.fromId); s.paint(); return;
      case 'end': if (m.fromId === s.hostId) s.end(`${s.nick(m.fromId)} closed the game.`); return;
    }
  });
  setInterval(() => { const t = Date.now(); for (const [k, v] of pendingGo) if (t - v.ts > 30000) pendingGo.delete(k); }, 10000);

  // a reload (or a browser closed and reopened) mid-game: rebuild the session and let the game pick it up again
  function resumeSaved() {
    const all = store.get(LIVE_K, {}) || {};
    for (const k of Object.keys(all)) {
      const v = all[k];
      if (!v || !okSid(v.sid) || SESS.has(v.sid) || Date.now() - (v.ts || 0) > 170000 || !GAMES[v.g] || !GAMES[v.g].start || !Array.isArray(v.roster) || !v.roster.some(p => p.id === meId())) { delete all[k]; continue; }
      const host = v.hostId === meId();
      if (!host && !isOn(v.hostId)) continue; // the host isn't back (yet): leave it for the next welcome
      const s = new Session({ sid: v.sid, g: v.g, hostId: v.hostId, roster: v.roster, seed: v.seed, o: v.o, round: v.round, resumed: true, saved: v.st });
      try { GAMES[v.g].start(s); } catch (e) { console.error(e); }
      if (host) setTimeout(() => s.sync(), 500); else setTimeout(() => s.need(), 300);
      const st = pendingGo.get(v.sid + ':st'); if (st && !host) { pendingGo.delete(v.sid + ':st'); s.emit('state', st.d.st); }
      s.say('Welcome back! Picking up where you left off...');
      secret('mp.comeback');
    }
    store.set(LIVE_K, all);
  }
  MP.resumeSaved = resumeSaved;

  // ================================================================ the race kit
  // A game window says it can race: R = MP.hook('games.sweep', G.w, { start(seed, o, R), opts() }). mp.js opens the
  // game when a race starts, then calls start() with the shared seed (on every round). The game reports back with
  // R.progress(0..1, 'text') and R.done({ ok, score, ms }); R.live(d) / R.onLive(fn) carry live positions (pod racer).
  // def.race: { app: 'games.sweep', metric: 'time'|'score', first: true (the first clean finish wins straight away) }
  const hooks = new Map(); // app id -> { w, api, R }
  MP.hook = (app, w, api) => {
    const R = { active: false, sess: null, app, liveFns: [] };
    R.progress = (p, txt) => race(R, 'p', { p: +p || 0, txt: clean(txt, 24) });
    R.done = res => race(R, 'f', res || {});
    R.live = d => { if (R.active && R.sess) { const t = performance.now(); if (t - (R.lastLive || 0) < 180) return; R.lastLive = t; R.sess.send({ k: 'live', d }); } };
    R.onLive = fn => R.liveFns.push(fn);
    R.leave = () => { if (R.sess && !R.sess.ended) R.sess.leave(); };
    hooks.set(app, { w, api, R });
    const prevClose = w._mpClose; // one hook per window
    if (!prevClose) { w._mpClose = true; const old = w.close; w.close = function () { const h = hooks.get(app); if (h && h.w === w) { if (h.R.sess && !h.R.sess.ended) h.R.sess.leave(true); hooks.delete(app); } return old.apply(this, arguments); }; }
    // a race waiting for this window to open
    const wait = waitHook.get(app); if (wait) { waitHook.delete(app); wait(hooks.get(app)); }
    return R;
  };
  const waitHook = new Map();
  function getHook(app) {
    const h = hooks.get(app); if (h && !h.w.closed) return Promise.resolve(h);
    return new Promise((res, rej) => {
      waitHook.set(app, res);
      try { Apps.open(app); } catch (e) { rej(e); }
      setTimeout(() => { if (waitHook.get(app) === res) { waitHook.delete(app); rej(new Error('no hook')); } }, 20000);
    });
  }
  function race(R, k, data) {
    const s = R.sess; if (!R.active || !s || s.ended) return;
    const rs = s.raceSt; if (!rs || rs.over) return;
    if (k === 'p') { const t = performance.now(); rs.prog[meId()] = { p: data.p, txt: data.txt }; s.progress = rs.prog; s.paint(); if (t - (rs.lastP || 0) < 400 && data.p < 1) return; rs.lastP = t; s.send({ k: 'p', r: s.round, p: data.p, txt: data.txt }); return; }
    if (k === 'f') {
      if (rs.fin[meId()]) return;
      const f = { ok: !!data.ok, score: Math.max(0, Math.round(+data.score || 0)), ms: Math.max(0, Math.round(data.ms != null ? +data.ms : performance.now() - rs.t0)), p: rs.prog[meId()] ? rs.prog[meId()].p : 0 };
      rs.fin[meId()] = f; s.send({ k: 'f', r: s.round, f }); s.save(raceSave(s));
      // keep saying it until the race is decided (a busy line can drop a message; it's harmless twice)
      const t0 = Date.now(), again = setInterval(() => { if (s.ended || s.raceSt !== rs || Date.now() - t0 > 45000) return clearInterval(again); s.send({ k: 'f', r: s.round, f }); }, 3000);
      s.say(f.ok ? `Finished in ${mmss(f.ms)}! Waiting for the others...` : 'Out! Waiting for the others...');
      raceCheck(s);
    }
  }
  const raceSave = s => ({ round: s.round, t0wall: s.raceSt ? s.raceSt.t0wall : 0, fin: s.raceSt ? s.raceSt.fin : {} });
  function raceStart(s, def) {
    const app = def.race.app;
    s.on('m', (d, from) => raceMsg(s, def, d, from));
    s.on('round', () => raceRound(s, def));
    s.on('gone', () => raceCheck(s)); s.on('left', () => raceCheck(s));
    s.on('state', st => { // catching up after a reload or a blip: the finishes so far
      if (!st || typeof st !== 'object' || (st.round | 0) !== s.round || !s.raceSt) return;
      if (st.fin && typeof st.fin === 'object') for (const id of Object.keys(st.fin)) if (+id !== meId() && s.roster.some(p => p.id === +id)) s.raceSt.fin[id] = okFin(st.fin[id]);
      if (st.prog && typeof st.prog === 'object') for (const id of Object.keys(st.prog)) if (+id !== meId()) s.raceSt.prog[id] = st.prog[id];
      s.progress = s.raceSt.prog; s.paint(); raceCheck(s);
    });
    s.state(() => (s.raceSt ? { round: s.round, fin: s.raceSt.fin, prog: s.raceSt.prog } : undefined));
    s.btns = () => { const rs = s.raceSt, h = hooks.get(app); return rs && !rs.over && !rs.fin[meId()] && h && h.R.active ? [['Give up', () => Desk.msgbox(def.name, 'Give up this race? You\'ll be ranked on how far you got.', 'q', [['Give up', () => h.R.done({ ok: false })], ['Keep going']])]] : []; };
    s.on('end', () => { const h = hooks.get(app); if (h && h.R.sess === s) { h.R.active = false; h.R.sess = null; try { if (h.api.ended) h.api.ended(); } catch (e) {} } });
    getHook(app).then(h => {
      if (s.ended) return;
      h.R.sess = s; s.attach(h.w);
      raceRound(s, def, s.resumed ? s.saved : null);
    }).catch(() => { Desk.msgbox('JackNet', `Could not start ${def.name}. Is it installed?`, 'warn'); s.leave(true); });
  }
  const okFin = f => (f && typeof f === 'object' ? { ok: !!f.ok, score: Math.max(0, +f.score || 0), ms: Math.max(0, +f.ms || 0), p: Math.max(0, Math.min(1, +f.p || 0)) } : { ok: false, score: 0, ms: 0, p: 0 });
  function raceRound(s, def, saved) {
    const h = hooks.get(def.race.app); if (!h || s.ended) return;
    const back = saved && (saved.round | 0) === s.round;
    s.raceSt = { fin: back && saved.fin ? saved.fin : {}, prog: {}, over: false, t0: performance.now(), t0wall: back && saved.t0wall ? saved.t0wall : Date.now() + 3000, rm: new Set() };
    s.progress = s.raceSt.prog;
    if (h.w.el.querySelector('.mp-res')) h.w.el.querySelector('.mp-res').remove();
    if (s.host) s.announce();
    h.R.active = true;
    s.info = `${def.race.metric === 'score' ? 'Highest score wins' : def.race.first ? 'First to finish wins' : 'Fastest wins'}. Same ${def.race.what || 'board'} for everybody!`;
    s.paint(); s.save(raceSave(s));
    const go = () => {
      if (s.ended) return;
      s.raceSt.t0 = performance.now() - Math.max(0, Date.now() - s.raceSt.t0wall);
      try { h.api.start(s.seed, s.o, h.R); } catch (e) { console.error(e); }
      if (s.raceSt.fin[meId()]) { s.say('You already finished this one. Waiting for the others...'); raceCheck(s); }
    };
    if (back && Date.now() > s.raceSt.t0wall) { go(); return; }
    // 3, 2, 1, GO!
    const host = h.w.body; let cd = host.querySelector(':scope > .mp-cd');
    if (!cd) { cd = document.createElement('div'); cd.className = 'mp-cd'; host.appendChild(cd); }
    const tick = () => {
      if (s.ended || h.w.closed) { cd.remove(); return; }
      const left = Math.ceil((s.raceSt.t0wall - Date.now()) / 1000);
      if (left > 0) { cd.textContent = left; sfx('beep'); setTimeout(tick, 1000 - ((s.raceSt.t0wall - Date.now()) % 1000 || 0) + 5); return; }
      cd.textContent = 'GO!'; sfx('zap'); setTimeout(() => cd.remove(), 700); go();
    };
    try { h.api.start(s.seed, s.o, h.R, true); } catch (e) { console.error(e); } // a preview of the board behind the countdown
    tick();
  }
  function raceMsg(s, def, d, from) {
    if (!d || typeof d !== 'object' || !s.raceSt) return;
    if (d.k === 'live') { const h = hooks.get(def.race.app); if (h) h.R.liveFns.forEach(fn => { try { fn(d.d, from, s.nick(from)); } catch (e) { console.error(e); } }); return; }
    if ((d.r | 0) !== s.round) return;
    if (d.k === 'p') { s.raceSt.prog[from] = { p: Math.max(0, Math.min(1, +d.p || 0)), txt: clean(d.txt, 24) }; s.paint(); return; }
    if (d.k === 'f') { s.raceSt.fin[from] = okFin(d.f); s.raceSt.prog[from] = Object.assign({}, s.raceSt.prog[from] || {}, { p: d.f && d.f.ok ? 1 : (s.raceSt.prog[from] || {}).p || 0, txt: d.f && d.f.ok ? mmss(d.f.ms) : 'out' }); s.paint(); if (s.host) s.save(raceSave(s)); raceCheck(s); return; }
    if (d.k === 'rm') { s.raceSt.rm.add(from); s.say(`${s.nick(from)} wants a rematch!`); rematchCheck(s, def); return; }
  }
  function raceRank(s) {
    const def = s.def, fin = s.raceSt.fin, score = def.race.metric === 'score';
    const rows = s.humans().map(p => ({ p, f: fin[p.id] || null, gone: s.gone.has(p.id) || s.left.has(p.id) }));
    rows.sort((a, b) => {
      const fa = a.f || { ok: false, score: 0, ms: 1e12, p: (s.raceSt.prog[a.p.id] || {}).p || 0 }, fb = b.f || { ok: false, score: 0, ms: 1e12, p: (s.raceSt.prog[b.p.id] || {}).p || 0 };
      if (score) return fb.score - fa.score || fa.ms - fb.ms;
      if (fa.ok !== fb.ok) return fa.ok ? -1 : 1;
      if (fa.ok) return fa.ms - fb.ms;
      return (fb.p || 0) - (fa.p || 0) || fb.score - fa.score;
    });
    return rows;
  }
  function raceCheck(s) {
    const rs = s.raceSt; if (!rs || rs.over || s.ended) return;
    const def = s.def, active = s.humans().filter(p => !s.gone.has(p.id) && !s.left.has(p.id));
    const firstOk = def.race.first && Object.values(rs.fin).some(f => f.ok);
    const allIn = active.every(p => rs.fin[p.id]);
    if (!firstOk && !allIn && active.length > 1) return;
    rs.over = true;
    const rows = raceRank(s), win = rows[0], wf = win && win.f;
    const r2 = rows[1] && rows[1].f, tie = !!(wf && r2 && (def.race.metric === 'score' ? r2.score === wf.score : (wf.ok && r2.ok ? r2.ms === wf.ms : !wf.ok && !r2.ok && (r2.p || 0) === (wf.p || 0))));
    const nobody = !wf || tie || (def.race.metric !== 'score' && !wf.ok && !(wf.p > 0));
    const h = hooks.get(def.race.app);
    if (h) { h.R.active = false; try { if (h.api.stop) h.api.stop(); } catch (e) {} }
    const iWon = !nobody && win.p.id === meId();
    if (iWon) { secret('mp.race'); sfx('solve'); } else sfx('uhoh');
    Net.send({ t: 'mpResult', sid: s.rsid(), w: nobody ? 0 : win.p.id });
    s.save(raceSave(s));
    const fmt = r => { const f = r.f; if (!f) return r.gone ? 'gone' : 'still going'; if (def.race.metric === 'score') return `${f.score.toLocaleString('en-GB')} points`; return f.ok ? mmss(f.ms) : `out (${Math.round((f.p || 0) * 100)}% done)`; };
    s.say(nobody ? (tie ? "It's a tie!" : 'Nobody managed it! A draw.') : iWon ? 'YOU WIN THE RACE!!!' : `${win.p.nick} wins the race!`, !iWon);
    if (!h || h.w.closed) return;
    const box = document.createElement('div'); box.className = 'mp-res';
    box.innerHTML = `<h3>${nobody ? (tie ? "IT'S A TIE!" : 'NOBODY WINS!') : iWon ? 'YOU WIN!' : esc(win.p.nick) + ' WINS!'}</h3><ol>${rows.map(r => `<li>${esc(r.p.nick)}${r.p.id === meId() ? ' (you)' : ''}: ${esc(fmt(r))}</li>`).join('')}</ol><div class="row"><button type="button" class="btn" data-mp="rm">Rematch</button><button type="button" class="btn" data-mp="look">Look at the board</button><button type="button" class="btn" data-mp="bye">Leave</button></div>`;
    h.w.body.appendChild(box);
    box.querySelector('[data-mp="rm"]').onclick = ev => { ev.target.disabled = true; ev.target.textContent = 'Waiting for them...'; rs.rm.add(meId()); const r0 = s.round; s.send({ k: 'rm', r: r0 }); setTimeout(() => { if (!s.ended && s.round === r0) s.send({ k: 'rm', r: r0 }); }, 2500); rematchCheck(s, def); };
    box.querySelector('[data-mp="look"]').onclick = () => box.remove();
    box.querySelector('[data-mp="bye"]').onclick = () => { box.remove(); s.leave(); };
    if (s.others().every(p => s.gone.has(p.id) || s.left.has(p.id))) { const b = box.querySelector('[data-mp="rm"]'); b.disabled = true; b.textContent = 'They left'; }
  }
  function rematchCheck(s, def) {
    const rs = s.raceSt; if (!rs || !rs.over || !s.host) return;
    const active = s.humans().filter(p => !s.gone.has(p.id) && !s.left.has(p.id));
    if (active.length < 2 || !active.every(p => rs.rm.has(p.id))) return;
    s.round++; s.seed = (Math.random() * 4294967295) >>> 0; secret('mp.rematch');
    s._send({ k: 'go', g: s.g, roster: s.roster, seed: s.seed, o: s.o, round: s.round, host: meId() });
    raceRound(s, def);
  }
  // MP.race(id, def): register a race game
  MP.race = (id, def) => MP.game(id, Object.assign({ app: def.race.app, kind: 'race', invite: 'session', players: '2-4', max: 4, live: () => appOpen(def.race.app), open: () => Apps.open(def.race.app), start: s => raceStart(s, GAMES[id]) }, def));

  // ================================================================ "Play with someone..." (one dialog for every game)
  MP.pick = (g, o) => {
    const def = GAMES[g]; if (!def) return;
    const b = document.createElement('div'); b.className = 'mpp';
    const w = Apps.win(`Play ${def.name} with someone`, b, { w: 380, h: 400, icon: def.icon || ICON16, status: true, minW: 260, minH: 260 });
    const draw = () => {
      if (w.closed) return;
      const people = online().filter(p => p.id !== meId());
      const seeking = MP.seeking(g), theirs = now.seeks.filter(s => s.g === g && s.id !== meId());
      b.innerHTML = `<div><b>${esc(def.name)}</b> &middot; ${esc(KIND[def.kind] || '')} &middot; ${esc(def.players)} players${MP.count(g) ? ` &middot; <span style="color:#008000">${MP.count(g)} playing now</span>` : ''}</div>
        ${theirs.length ? `<div class="group"><span class="lg">They want a game too!</span><table>${theirs.map((s, i) => `<tr><td><b>${esc(s.nick)}</b>${s.note ? ` <small>"${esc(s.note)}"</small>` : ''}</td><td style="text-align:right"><button class="btn" data-j="${i}">Play!</button></td></tr>`).join('')}</table></div>` : ''}
        <div class="group"><span class="lg">Invite somebody on JackNet</span><div class="field">${people.length ? `<table>${people.map(p => `<tr><td><span style="color:${esc(p.col || '#000')}">&#9679;</span> ${esc(p.nick)}${p.member ? ' &#9733;' : ''}</td><td style="text-align:right"><button class="btn" data-inv="${p.id}">Invite</button></td></tr>`).join('')}</table>` : '<p class="dim" style="padding:4px">Nobody else is on JackNet right now. Put your name up and we\'ll give you a shout when somebody wants a game!</p>'}</div></div>
        <div class="row" style="flex-wrap:wrap;gap:6px">${seeking ? '<button class="btn" data-k="unseek">Take my name down</button>' : '<button class="btn" data-k="seek">Put my name up in the lobby</button>'}<button class="btn" data-k="lobby">Open "Who wants to play?"</button></div>`;
      b.querySelectorAll('[data-inv]').forEach(x => x.onclick = () => { const p = online().find(q => q.id === +x.dataset.inv); if (p) MP.invite(p, g, o || {}); });
      b.querySelectorAll('[data-j]').forEach(x => x.onclick = () => { const s = theirs[+x.dataset.j]; if (s) { MP.join(s); w.close(); } });
      const sk = b.querySelector('[data-k="seek"]'); if (sk) sk.onclick = () => { MP.seek(g, ''); setTimeout(draw, 1200); };
      const us = b.querySelector('[data-k="unseek"]'); if (us) us.onclick = () => { MP.unseek(g); setTimeout(draw, 1200); };
      b.querySelector('[data-k="lobby"]').onclick = () => MP.lobby();
      if (w.status) w.status.textContent = Net.connected ? `${people.length} other${people.length === 1 ? '' : 's'} on JackNet` : 'Not connected to JackNet';
    };
    draw();
    const off = MP.onNow(draw), off2 = setInterval(draw, 5000);
    const oc = w.close; w.close = function () { off(); clearInterval(off2); return oc.apply(this, arguments); };
    return w;
  };
  // a Game-menu item, for any game's menu
  MP.menuItem = (g, o) => ({ label: 'Play with someone...', act: () => MP.pick(g, o) });
  // JSN / Uh-Oh! contacts: "Invite to a game..."
  MP.chooseGame = peer => {
    if (!peer || !peer.id) return Desk.msgbox('JackNet', 'They are not online right now.', 'info');
    const list = ORDER.filter(g => GAMES[g].invite && installed(g));
    const b = document.createElement('div'); b.className = 'mpp';
    b.innerHTML = `<div>Invite <b>${esc(peer.nick)}</b> to...</div><div class="field"><table>${list.map(g => `<tr><td><span class="gico">${GAMES[g].icon || ICON16}</span>${esc(GAMES[g].name)} <small class="dim">${esc(KIND[GAMES[g].kind] || '')}</small></td><td style="text-align:right"><button class="btn" data-g="${esc(g)}">Invite</button></td></tr>`).join('')}</table></div>`;
    const w = Apps.win('Invite to a game', b, { w: 360, h: 380, icon: ICON16, minW: 240, minH: 200 });
    b.querySelectorAll('[data-g]').forEach(x => x.onclick = () => { w.close(); MP.invite(peer, x.dataset.g, {}); });
    return w;
  };
  MP.peerByNick = nick => online().find(o => o.nick.toLowerCase() === String(nick || '').toLowerCase()) || null;

  // ================================================================ "Who wants to play?" - the JackNet-wide lobby
  function lobby() {
    const b = document.createElement('div'); b.className = 'mpl';
    const w = Apps.win('Who wants to play? - JackNet', b, { w: 720, h: 560, icon: ICON16, status: true, minW: 300, minH: 320 });
    if (innerWidth < 640) w.el.classList.add('maxwin');
    secret('mp.lobby');
    let sel = store.get('jhp_mp_lastg', '') || '';
    const draw = () => {
      if (w.closed) return;
      const people = online().filter(p => p.id !== meId()), seeks = now.seeks.slice().sort((a, b) => b.ts - a.ts);
      const inv = ORDER.filter(g => GAMES[g].invite && GAMES[g].invite !== 'open');
      if (!inv.includes(sel)) sel = inv[0] || '';
      const total = ORDER.reduce((n, g) => n + MP.count(g), 0);
      b.innerHTML = `<div class="mpl-head">${ICON32.replace('<svg', '<svg width="32" height="32"')}<div><b>WHO WANTS TO PLAY?</b><br><small>${online().length} on JackNet &middot; ${total} playing something right now</small></div></div>
        <div class="mpl-cols">
          <div class="group"><span class="lg">Looking for a game</span><div class="field">${seeks.length ? `<table>${seeks.map((s, i) => { const d = GAMES[s.g]; if (!d) return ''; const ago = Math.max(0, Math.round((Date.now() - s.ts) / 60000)); return `<tr><td><span class="gico">${d.icon || ICON16}</span><b>${esc(s.nick)}</b> wants <b>${esc(d.name)}</b>${s.note ? ` <small>"${esc(s.note)}"</small>` : ''}<div class="dim">${ago ? ago + ' min ago' : 'just now'}${s.lost ? ' &middot; <span class="lost">connection wobbling...</span>' : ''}</div></td><td class="r">${s.id === meId() ? `<button class="btn" data-un="${esc(s.g)}">Take down</button>` : `<button class="btn" data-j="${i}">Play!</button>`}</td></tr>`; }).join('')}</table>` : '<p class="dim" style="padding:4px">Nobody has put their name up. Be the first!</p>'}</div>
            <div class="seekrow" style="margin-top:6px"><select data-k="g" aria-label="Game">${inv.map(g => `<option value="${esc(g)}"${g === sel ? ' selected' : ''}>${esc(GAMES[g].name)}</option>`).join('')}</select><input type="text" data-k="note" maxlength="60" placeholder="Say something (optional)" aria-label="Note"><button class="btn" data-k="seek">Put my name up</button></div></div>
          <div class="group"><span class="lg">People on JackNet</span><div class="field">${people.length ? `<table>${people.map(p => `<tr><td><span style="color:${esc(p.col || '#000')}">&#9679;</span> ${esc(p.nick)}${p.member ? ' &#9733;' : ''}</td><td class="r"><button class="btn" data-inv="${p.id}">Invite to...</button></td></tr>`).join('')}</table>` : '<p class="dim" style="padding:4px">Just you. Put your name up and wait for a bite!</p>'}</div></div>
        </div>
        <div class="group"><span class="lg">Things to play together (live counts)</span><div class="field games">${gameTable()}</div></div>
        <label style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-k="noinv"${MP.opts.noinv ? ' checked' : ''}> Don't send me invitations (I'm busy doing my homework. Honest.)</label>`;
      b.querySelectorAll('[data-j]').forEach(x => x.onclick = () => { const s = seeks[+x.dataset.j]; if (s) MP.join(s); });
      b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { MP.unseek(x.dataset.un); });
      b.querySelectorAll('[data-inv]').forEach(x => x.onclick = () => { const p = online().find(q => q.id === +x.dataset.inv); if (p) MP.chooseGame(p); });
      b.querySelectorAll('[data-open]').forEach(x => x.onclick = () => { const d = GAMES[x.dataset.open]; if (d && d.open) d.open(); });
      b.querySelectorAll('[data-find]').forEach(x => x.onclick = () => MP.pick(x.dataset.find));
      b.querySelectorAll('[data-get]').forEach(x => x.onclick = getSoftware);
      b.querySelector('[data-k="g"]').onchange = ev => { sel = ev.target.value; store.set('jhp_mp_lastg', sel); };
      b.querySelector('[data-k="seek"]').onclick = () => { const g = b.querySelector('[data-k="g"]').value, note = b.querySelector('[data-k="note"]').value; MP.seek(g, note); };
      b.querySelector('[data-k="noinv"]').onchange = ev => { MP.opts.noinv = ev.target.checked; saveOpts(); };
      if (w.status) w.status.textContent = Net.connected ? 'Connected to JackNet. Invitations pop up by the clock.' : 'Not connected to JackNet. Redialling...';
    };
    const gameTable = () => `<table>${ORDER.map(g => { const d = GAMES[g], n = MP.count(g); return `<tr><td><span class="gico">${d.icon || ICON16}</span><b>${esc(d.name)}</b> <small class="dim">${esc(KIND[d.kind] || '')}, ${esc(d.players)}</small>${d.blurb ? `<div class="dim">${esc(d.blurb)}</div>` : ''}</td><td class="r">${n ? `<span class="now">${n} playing now</span> ` : ''}${!installed(g) ? '<button class="btn" data-get="1">Get it</button>' : `${d.open ? `<button class="btn" data-open="${esc(g)}">Open</button>` : ''}${d.invite && d.invite !== 'open' ? ` <button class="btn" data-find="${esc(g)}">Find a player</button>` : ''}`}</td></tr>`; }).join('')}</table>`;
    // don't redraw while somebody is typing a note
    const safeDraw = () => { const a = document.activeElement; if (a && b.contains(a) && a.matches('input[type=text], select')) return; draw(); };
    draw();
    const off = MP.onNow(safeDraw), t = setInterval(safeDraw, 6000);
    if (Z().onOnline) Z().onOnline(() => { if (!w.closed) safeDraw(); });
    Net.send({ t: 'mpTop' });
    const oc = w.close; w.close = function () { off(); clearInterval(t); return oc.apply(this, arguments); };
    return w;
  }
  MP.lobby = () => Apps.open('mp.lobby');
  Apps.register('mp.lobby', { single: true, cmd: ['lobby', 'whowantstoplay', 'who wants to play', 'multiplayer', 'playtogether', 'play together', 'mp'], open: lobby });
  Apps.addProgram(['Games', 'Internet Games', 'Who wants to play?'], 'mp.lobby', ICON16);
  Apps.addProgram(['Games', 'Who wants to play?'], 'mp.lobby', ICON16);

  // ================================================================ table games: the game window drives the session itself
  function sessionStart(s, app) {
    getHook(app).then(h => {
      if (s.ended) return;
      h.R.sess = s; s.attach(h.w);
      try { h.api.session(s); } catch (e) { console.error(e); }
    }).catch(() => { Desk.msgbox('JackNet', `Could not open ${s.def.name}. Is it installed?`, 'warn'); s.leave(true); });
  }
  MP.game('cards.hearts', { app: 'games.hearts', name: 'Hearts', icon: (window.JICON ? JICON.get('hearts', 16) : ICON16), kind: 'cards', players: '2-4', max: 4, invite: 'session',
    blurb: 'Up to four people at one table. Bots (Dave, Jack\'s cousin and Gubbinz) fill the empty seats.', live: () => appOpen('games.hearts'), open: () => Apps.open('games.hearts'),
    tableOpen: s => !!s.heartsTable, start: s => sessionStart(s, 'games.hearts') });
  MP.sessionStart = sessionStart;
  // Jacks: Armageddon online (discs-squigs.js): opened straight off the network, no CD in the drive needed. Late arrivals watch.
  Apps.register('mp.squigs', { open: () => { const D = window.Discs; if (!D) return null; const g = D.LIVE.squigs; if (g && !g.closed && g.w && !g.w.closed) { g.w.restore(); return g.w; } return D.launch('squigs'); } });
  const SQI = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="0" y="12" width="16" height="4" fill="#3a9a2a"/><circle cx="7" cy="9" r="4" fill="#e8401a" stroke="#000"/><rect x="5" y="8" width="2" height="2" fill="#fff"/><rect x="8" y="8" width="2" height="2" fill="#fff"/><path d="M10 6l5-3" stroke="#2a5a2a" stroke-width="2"/><rect x="13" y="1" width="2" height="2" fill="#ffd400"/></svg>';
  MP.game('squigs.online', { app: 'discs.squigs', name: 'Jacks: Armageddon online', icon: SQI, kind: 'turn', players: '2-4', max: 6, invite: 'session',
    blurb: 'Two to four teams of jacks on one island, taking turns over JackNet. Anybody who turns up late gets to watch.', live: () => { const g = window.Discs && Discs.LIVE.squigs; return !!(g && !g.closed); }, open: () => Apps.open('mp.squigs'),
    tableOpen: s => !s.ended, start: s => sessionStart(s, 'mp.squigs') });
  // two-player Snake on Jack's Mobile (family-phone.js): host-authoritative ticks, same field
  const SNI = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="0" width="10" height="16" rx="1" fill="#333"/><rect x="4" y="2" width="8" height="6" fill="#9ac850"/><path d="M5 6h3V4h2" stroke="#18280c" fill="none"/><rect x="5" y="10" width="2" height="1" fill="#ccc"/><rect x="9" y="10" width="2" height="1" fill="#ccc"/><rect x="5" y="12" width="2" height="1" fill="#ccc"/><rect x="9" y="12" width="2" height="1" fill="#ccc"/></svg>';
  MP.game('phone.snake2', { app: 'family.phone', name: 'Snake Link-up (phone)', icon: SNI, kind: 'live', players: '2', max: 2, invite: 'session',
    blurb: 'Two snakes, one tiny screen, on Jack\'s Mobile. Don\'t bite yourself, the wall or the other snake. First to three.', open: () => Apps.open('family.phone', 'snake'),
    start: s => sessionStart(s, 'family.phone') });
  // Fastest Finger First on www.jackmillionaire.kidz (news99-b.js): the page is the game, so it drives the session itself
  const MIL = 'http://www.jackmillionaire.kidz/play.html';
  const milLoad = () => (window.N99 && N99.ff ? Promise.resolve() : Apps.load('js/news99-b.js'));
  const MLI = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#0a1a6a" stroke="#ffd060"/><text x="8" y="11.5" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="9" fill="#ffd060">&#163;</text></svg>';
  MP.game('mil.ff', { name: 'Millionaire: Fastest Finger First', icon: MLI, kind: 'party', players: '2-4', max: 4, invite: 'session',
    blurb: 'Same question, same moment: first to get the order right wins the hot seat on JackK\'s quiz. Everybody else watches (and shouts).', open: () => { if (window.N99) N99.open(MIL); },
    tableOpen: s => !!s.ffOpen, start: s => milLoad().then(() => N99.ff(s)).catch(e => { console.error(e); s.leave(true); }) });

  // ================================================================ races: the same board / deal for everybody (each game calls MP.hook)
  const JI = n => (window.JICON ? JICON.get(n, 16) : ICON16);
  MP.race('race.sweep', { name: 'Bugsweeper 2000 race', icon: JI('sweeper'), blurb: 'Same Y2K bugs, same first square. First to clear the field wins.', defaults: () => ({ level: 'intermediate' }), race: { app: 'era.sweeper', metric: 'time', first: true, what: 'field' } });
  MP.race('race.freecell', { name: 'FreeCell race', icon: JI('freecell'), blurb: 'Same game number. First to get all 52 cards home wins.', race: { app: 'freecell', metric: 'time', first: true, what: 'deal' } });
  MP.race('race.spider', { name: 'Spider Solitaire race', icon: JI('spider'), blurb: 'Same deal. First to clear the table wins (or whoever gets furthest).', defaults: () => ({ suits: 1 }), race: { app: 'games.spider', metric: 'time', first: true, what: 'deal' } });
  MP.race('race.mahjong', { name: 'Jack Jong race', icon: JI('mahjong'), blurb: 'Same tiles. First to clear the board wins.', defaults: () => ({ layout: 'dragon' }), race: { app: 'games.mahjong', metric: 'time', first: true, what: 'tiles' } });
  MP.race('race.slide', { name: 'Slider 15 race', icon: JI('slider'), blurb: 'Same shuffle. First to put it back in order wins.', defaults: () => ({ n: 4 }), race: { app: 'games.slide', metric: 'time', first: true, what: 'shuffle' } });
  MP.race('race.pipe', { name: 'Pipe Jack race', icon: JI('pipe'), blurb: 'Same tanks, rocks and pipes. Highest score when the juice spills wins.', defaults: () => ({ start: 1 }), race: { app: 'games.pipe', metric: 'score', what: 'levels' } });
  MP.race('race.podracer', { name: 'Pod Jack Racer online', icon: JI('podracer'), blurb: "Three laps against other people's pods, live. First over the line wins.", defaults: () => ({ track: 'canyon' }), race: { app: 'games.podracer', metric: 'time', first: true, what: 'track' } });
  MP.race('race.pinball', { name: 'Pinball score attack', icon: JI('pinball'), blurb: 'Three balls each, at the same time. Highest score wins.', defaults: () => ({ balls: 3 }), race: { app: 'games.pinball', metric: 'score', what: 'table' } });

  // ================================================================ things that were already multiplayer (listed + counted)
  const zoneOpen = path => () => { if (Z().goSite) Z().goSite(path); };
  const zoneLive = g => () => !!(Z().my && (Z().my.where === 'game' || Z().my.where === 'seat' || Z().my.where === 'watch') && Z().my.g === g);
  const ZI = (Z().ICON || {});
  const zoneGames = [['reversi', 'Reversi'], ['checkers', 'Checkers'], ['c4', 'Connect Four'], ['ships', 'Battleships'], ['ttt', 'Noughts & Crosses'], ['gomoku', 'Five in a Row'], ['dots', 'Dots and Boxes'], ['bg', 'Backgammon'], ['pong', 'Saber Pong'], ['chess', 'Chess']];
  const section = () => (document.body.dataset.section || '');
  const siteIs = id => () => { const br = document.getElementById('browser'); return !!br && !br.classList.contains('min') && br.style.display !== 'none' && (section() === id || (window.IE && IE.current === id)); };
  MP.game('tris.ko', { name: 'JACKTRIS Knockout', kind: 'party', players: '2-8', blurb: 'Last one standing. Clear lines to send junk!', open: () => goSite('demos')(), live: () => !!document.querySelector('#btPlayers .btp.me'), invite: 'open' });
  zoneGames.forEach(([g, name]) => MP.game('zone.' + g, { app: 'zone', name: name + ' (Zone)', icon: ZI[g], kind: g === 'pong' ? 'live' : 'turn', players: '2', blurb: 'In the JackNet Gaming Zone. Ladder, spectators, rematches.', open: zoneOpen(`/games/${g}.html`), live: zoneLive(g), invite: 'zone' }));
  const quizIn = () => [...document.querySelectorAll('.ir-child.chan .ir-ct')].some(t => /^#quiznight\b/i.test(t.textContent || ''));
  MP.game('lan.quiz', { app: 'social.irc', name: 'Quiz Night', kind: 'party', players: 'lots', blurb: 'QuizJack\'s pub quiz in JackIRC #quiznight, on the hour. Type the answer first!', open: () => { const f = Apps.cmds['quiznight']; if (f) f(); }, live: quizIn, invite: 'open' });
  const goSite = id => () => { if (window.IE) { const br = document.getElementById('browser'); if (br) br.classList.remove('min'); IE.go(id, 'click'); } };
  MP.game('site.hangout', { name: 'The Hangout', kind: 'room', players: 'lots', blurb: 'Walk about, sit on the sofa, chat. On the JACK ATTACK! site.', open: goSite('hangout'), live: siteIs('hangout'), invite: 'open' });
  MP.game('social.irc', { app: 'social.irc', name: 'JackIRC', kind: 'room', players: 'lots', blurb: '#jackattack and friends.', open: () => Apps.open('social.irc'), live: () => appOpen('social.irc'), invite: 'open' });
  MP.game('social.wb', { app: 'social.wb', name: 'JackNet Whiteboard', kind: 'toy', players: 'lots', blurb: 'Draw on the same board as everybody else.', open: () => Apps.open('social.wb'), live: () => appOpen('social.wb'), invite: 'open' });
  MP.game('site.cube', { name: "The Shared Rubrick's Cube", kind: 'toy', players: 'lots', blurb: 'One cube for the whole Internet. On the Games page.', open: goSite('demos'), live: siteIs('demos'), invite: 'open' });
  MP.game('site.button', { name: 'THE BUTTON', kind: 'toy', players: 'lots', blurb: 'Everybody presses the same button. Nobody knows why.', open: goSite('home'), live: siteIs('home') });
  MP.game('site.wall', { name: 'The Art Wall', kind: 'toy', players: 'lots', blurb: 'One big pixel picture that everybody draws on.', open: goSite('art'), live: siteIs('art'), invite: 'open' });
  MP.game('site.pet', { name: 'Gubbinz the virtual pet', kind: 'toy', players: 'lots', blurb: 'Everybody feeds him. Nobody cleans him.', open: goSite('grot'), live: siteIs('grot'), invite: 'open' });
  MP.game('pc.jrt', { app: 'pcgames.jrt', name: 'JackReal Tournament', kind: 'live', players: '2-8', blurb: 'Online deathmatch on the JackNet server browser.', open: () => { try { Apps.open('pcgames.jrt'); } catch (e) {} }, live: () => appOpen('pcgames.jrt') });

  // "who's here right now" under the site's shared toys (the button, the cube, Gubbinz, the art wall), live
  const HERE = [['btnCount', 'home', 'Pressing it right now'], ['cubeHost', 'demos', 'On the Games page right now'], ['petSays', 'grot', 'Looking after Gubbinz right now'], ['wall', 'art', 'Drawing right now']];
  function hereNow() {
    const list = online();
    for (const [id, sec, label] of HERE) {
      const a = document.getElementById(id); if (!a || !a.parentNode) continue;
      let el = a.parentNode.querySelector(':scope > .mp-herenow');
      if (!el) { el = document.createElement('div'); el.className = 'mp-herenow'; el.setAttribute('aria-live', 'polite'); (id === 'btnCount' && a.nextElementSibling ? a.nextElementSibling : a).insertAdjacentElement('afterend', el); } // (the button's goes after "...times.")
      const ppl = list.filter(o => o.where === sec), others = ppl.filter(o => o.id !== meId());
      const meIn = ppl.some(o => o.id === meId());
      el.innerHTML = others.length ? `<span class="live">LIVE</span> ${esc(label)}: ${meIn ? '<b>you</b>, ' : ''}${others.slice(0, 6).map(o => `<b style="color:${esc(o.col || '#000')}">${esc(o.nick)}</b>`).join(', ')}${others.length > 6 ? ` + ${others.length - 6} more` : ''}` : `<span class="dim">${meIn ? "Just you here at the moment. Invite somebody!" : 'Nobody here at the moment.'}</span>`;
    }
  }
  if (Z().onOnline) Z().onOnline(() => hereNow());
  setTimeout(hereNow, 1500);

  // the Zone site lists all of this on its Multiplayer page (zone-site.js)
  MP.listing = () => ORDER.map(g => ({ id: g, def: GAMES[g], n: MP.count(g) }));
})();

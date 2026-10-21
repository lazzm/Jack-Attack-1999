/* apps-social: the JackNet social pack. Uh-Oh! Messenger (lives in the tray), JackNet Whiteboard, Fridge Magnet
 * Poetry, the Corkboard, snowballs + paper aeroplanes, JackNet Radio 99.9 FM, the Time Capsule, Messages in Bottles
 * and Pass the Parcel. Everything that arrives over the wire comes from strangers, so it is validated, length-limited,
 * escaped and rate-limited before it touches the screen. */
(function () {
  'use strict';
  if (!window.Apps || !window.Net) return;
  const $ = id => document.getElementById(id);
  const esc = Apps.esc, store = Apps.store;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const pad = n => String(n).padStart(2, '0');
  const touch = () => matchMedia('(hover:none)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const play = n => { try { Sound.play(n); } catch (e) {} };
  const note = (f, d, type, at) => setTimeout(() => { try { Sound.note(f, d, type); } catch (e) {} }, at || 0);
  const S = (id, name, hint) => Apps.defineSecret('social.' + id, name, hint);
  const got = id => Apps.secret('social.' + id);
  const hash = s => { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
  function seeded(seed) { let x = (hash(seed) | 1) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  const hhmm = ts => { const d = new Date(ts || Date.now()); return d.getHours() + ':' + pad(d.getMinutes()); };
  const d99 = ts => { const d = new Date(ts || Date.now()); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/99'; };
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' mins ago'; if (s < 86400) { const n = Math.round(s / 3600); return n + ' hour' + (n > 1 ? 's' : '') + ' ago'; } const n = Math.round(s / 86400); return n + ' day' + (n > 1 ? 's' : '') + ' ago'; };
  const showBrowser = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
  const txt = (name, text) => Apps.openFile({ name, type: 'txt', text });

  // ---- safety: everything from the wire goes through these
  const BAD = /\b(n[i1!]gg(a|er|uh)s?|f[a@]gg?(ot)?s?|k[i1]kes?|sp[i1]cs?|ch[i1]nks?|tr[a@]nn(y|ies)|retards?|c[u*]nts?|wh[o0]res?|r[a@]pe[sd]?|f+[u*]+c+k+\w*|sh[i1]te?s?|b[i1]tch\w*|wank\w*|tw[a@]ts?|c[o0]cks?|d[i1]cks?|p[i1]ss\w*|bastards?|bollocks|arse\w*|slags?|sluts?)\b/gi;
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    .replace(BAD, m => '*'.repeat(m.length)).replace(/\b((https?:\/\/)|(www\.))\S+/gi, '[link removed]');
  const isObj = d => !!d && typeof d === 'object' && !Array.isArray(d);
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const okCol = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#000080';
  // JackNet members-only things (js/guest.js): a member carries straight on, a guest gets the "Members Only" box
  const mgate = (what, fn) => (window.Guest ? Guest.need(what, fn) : (Net.me.member && fn && fn(), !!Net.me.member));
  function gate(n, ms) { // n events per ms window, per key
    const m = new Map();
    return key => { const now = Date.now(); let t = m.get(key); if (!t) { if (m.size > 300) m.clear(); t = []; m.set(key, t); } while (t.length && now - t[0] > ms) t.shift(); if (t.length >= n) return false; t.push(now); return true; };
  }

  // ---- who's online
  let online = [];
  const onlineFns = [];
  const setOnline = list => { online = Array.isArray(list) ? list.filter(o => isObj(o) && Number.isInteger(o.id) && typeof o.nick === 'string') : []; onlineFns.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };
  Net.on('welcome', m => setOnline(m.online));
  Net.on('online', m => setOnline(m.online));
  const others = () => online.filter(o => o.id !== Net.me.id);
  const who = id => online.find(o => o.id === id);
  const sender = msg => msg && Number.isInteger(msg.fromId) && msg.fromId !== Net.me.id ? who(msg.fromId) : null;
  const ignored = new Set(store.get('jhp_social_ignore', []));
  const isIgnored = o => !!o && ignored.has(String(o.nick).toLowerCase());
  const WHERE = { home: 'the Home page', demos: 'the Games arcade', grot: "Gubbinz's page", saver: 'the Screensaver page', reviews: 'the Reviews', cheats: 'the Cheats', orks: 'Hobby Corner', letters: 'the Letters page', art: 'the Art Wall', chat: 'the Chat room', forums: 'the Forums', members: 'the Members page', starwars: 'the Star Wars shrine', comics: 'the Comics', top10: 'the Top 10s', quiz: 'the Nerd Quiz', polls: 'the Polls', compo: 'the Compo page', penpals: 'the Pen Pals board', downloads: 'Downloads', links: 'the Links page', hangout: 'the Hangout', login: 'the Login page' };
  const whereOf = o => o && o.where && String(o.where).startsWith('secret') ? 'a SECRET page (ooh)' : (o && WHERE[o.where]) || 'somewhere on the site';

  // a "room": who else has this shared toy open right now (so we only send live updates when someone is watching)
  function room(ch, onMsg) {
    const viewers = new Map(), nicks = new Map(); let open = false; const whoFns = [];
    const changed = () => whoFns.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    Net.onRelay(ch, (d, msg) => {
      const o = sender(msg); if (!o || !isObj(d)) return;
      if (o.nick) nicks.set(o.id, o.nick);
      if (d.k === 'hi') { if (open) { const fresh = !viewers.has(o.id); viewers.set(o.id, Date.now()); Net.relay(o.id, ch, { k: 'here' }); if (fresh) changed(); } return; }
      if (d.k === 'here') { if (open) { const fresh = !viewers.has(o.id); viewers.set(o.id, Date.now()); if (fresh) changed(); } return; }
      if (d.k === 'bye') { viewers.delete(o.id); changed(); if (open) onMsg(d, o, msg); return; }
      if (!open) return;
      if (!viewers.has(o.id)) { viewers.set(o.id, Date.now()); changed(); } else viewers.set(o.id, Date.now());
      onMsg(d, o, msg);
    });
    // a viewer whose connection dropped stays listed for a minute (the server gives them the same id when they're back)
    const lostAt = new Map();
    onlineFns.push(() => { for (const id of [...viewers.keys()]) { if (who(id)) { lostAt.delete(id); continue; } if (!lostAt.has(id)) lostAt.set(id, Date.now()); } changed(); });
    setInterval(() => { for (const [id, t] of [...lostAt]) if (Date.now() - t > 60000) { lostAt.delete(id); if (viewers.delete(id)) { changed(); if (open) onMsg({ k: 'bye' }, { id }, {}); } } }, 10000);
    // our own connection came back: say hello again so everyone starts sending us live strokes/drags
    Net.on('welcome', () => setTimeout(() => { if (open) Net.relay(0, ch, { k: 'hi' }); }, 700));
    return {
      onWho(fn) { whoFns.push(fn); },
      names() { return [...viewers.keys()].map(id => { const o = who(id); return o ? o.nick : nicks.has(id) ? nicks.get(id) + ' (reconnecting)' : null; }).filter(Boolean); },
      enter() { open = true; Net.relay(0, ch, { k: 'hi' }); },
      leave() { if (!open) return; open = false; viewers.clear(); changed(); Net.relay(0, ch, { k: 'bye' }); },
      send(d) { return open && viewers.size ? Net.relay(0, ch, d) : false; },
      get count() { return viewers.size; },
      get open() { return open; },
      viewers,
    };
  }

  // ================================================================ icons (original: a six-petal flower with a grot in the middle)
  function flower(petal, face, extra, ghost) {
    if (face === '#3fa52c') face = '#ffd84a'; // the Uh-Oh! face is a smiley now
    let p = '';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; p += `<circle cx="${(8 + 4.7 * Math.cos(a)).toFixed(1)}" cy="${(8 + 4.7 * Math.sin(a)).toFixed(1)}" r="2.7" fill="${petal}" stroke="#000" stroke-width=".6"${ghost ? ' stroke-dasharray="1 1" fill-opacity=".35"' : ''}/>`; }
    return `<svg viewBox="0 0 16 16">${p}<circle cx="8" cy="8" r="3.2" fill="${face}" stroke="#000" stroke-width=".6"${ghost ? ' fill-opacity=".5"' : ''}/><rect x="6.4" y="6.5" width="1.1" height="1.5" fill="#000"/><rect x="8.6" y="6.5" width="1.1" height="1.5" fill="#000"/><path d="M6.3 9q1.8 1.6 3.5 0" fill="none" stroke="#000" stroke-width=".7"/>${extra || ''}</svg>`;
  }
  const CLOCK = '<circle cx="12.6" cy="12.6" r="3.1" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M12.6 10.7v2h1.5" stroke="#000" stroke-width=".7" fill="none"/>';
  const STAT = {
    online: ['Online', flower('#35c235', '#3fa52c')],
    ffc: ['Free For Chat', flower('#35c235', '#3fa52c', '<path d="M10 .5h5.5v4h-2.5l-2 1.8v-1.8h-1z" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M12.7 1.3v1.6" stroke="#e10600" stroke-width=".8"/>')],
    away: ['Away', flower('#f0d000', '#3fa52c', CLOCK)],
    na: ['N/A (Extended Away)', flower('#ff8a00', '#3fa52c', CLOCK)],
    occ: ['Occupied', flower('#e8381b', '#3fa52c')],
    dnd: ['DND (Do Not Disturb)', flower('#b00000', '#3fa52c', '<rect x="9.3" y="11.2" width="6.2" height="3" fill="#fff" stroke="#000" stroke-width=".6"/>')],
    inv: ['Privacy (Invisible)', flower('#c0c0c0', '#c0c0c0', '', true)],
    off: ['Offline', flower('#9a3030', '#8a8a8a')],
  };
  const ST_ORDER = ['ffc', 'online', 'away', 'na', 'occ', 'dnd', 'inv', 'off'];
  const ENVELOPE = '<svg viewBox="0 0 16 16"><rect x="1" y="3.5" width="14" height="9.5" fill="#fff" stroke="#000"/><path d="M1 3.5l7 5.5 7-5.5" fill="#ffd400" stroke="#000"/></svg>';
  let LOGO = '<svg viewBox="0 0 32 32">' + [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 - Math.PI / 2; return `<circle cx="${(15 + 8.6 * Math.cos(a)).toFixed(1)}" cy="${(17 + 8.6 * Math.sin(a)).toFixed(1)}" r="5" fill="${i % 2 ? '#ffd400' : '#ff9a1a'}" stroke="#000"/>`; }).join('') +
    '<path d="M7 15l-5-4 7 1zM23 15l5-4-7 1z" fill="#3fa52c" stroke="#000" stroke-width=".8"/><circle cx="15" cy="17" r="6.2" fill="#3fa52c" stroke="#000"/><rect x="11.5" y="14.5" width="2.4" height="2.4" fill="#e10600"/><rect x="16.2" y="14.5" width="2.4" height="2.4" fill="#e10600"/><path d="M11.8 19.6q3.2 2.4 6.4 0" stroke="#000" fill="#fff" stroke-width=".8"/><path d="M22 1h9v7h-4l-3 3v-3h-2z" fill="#fff" stroke="#000"/><path d="M26.5 2.5v3M26.5 6.4v.9" stroke="#e10600" stroke-width="1.6"/></svg>';
  const LOGO16 = flower('#ffb000', '#3fa52c');
  const I = {
    snow: '<svg viewBox="0 0 32 32"><circle cx="16" cy="17" r="11" fill="#fff" stroke="#6a8ab0" stroke-width="1.5"/><circle cx="12" cy="13" r="3" fill="#e8f2ff"/><circle cx="20" cy="21" r="1.4" fill="#c8daf0"/><circle cx="18" cy="12" r="1" fill="#c8daf0"/><path d="M3 6l3 2M29 5l-3 3M5 28l3-2" stroke="#6a8ab0" stroke-width="1.5"/></svg>',
    plane: '<svg viewBox="0 0 32 32"><path d="M2 15l28-10-9 22-5-8z" fill="#fff" stroke="#000"/><path d="M16 19l14-14-19 11z" fill="#d8d8e8" stroke="#000"/><path d="M16 19l-1 7 3-4" fill="#b8b8c8" stroke="#000"/></svg>',
    squig: '<svg viewBox="0 0 32 32"><path d="M10 27l-2 3h5zM22 27l2 3h-5z" fill="#c04a00" stroke="#000" stroke-width=".8"/><path d="M16 5q1-3 3-3" fill="none" stroke="#000" stroke-width="1.2"/><circle cx="19.5" cy="2.5" r="1.6" fill="#ffd400" stroke="#000" stroke-width=".7"/><circle cx="16" cy="17" r="11" fill="#ff8a1a" stroke="#000" stroke-width="1.2"/><path d="M7 21a10 10 0 0 0 18 0a11 9 0 0 1-18 0z" fill="#d85a00"/><ellipse cx="11" cy="11" rx="3.4" ry="2" fill="#ffd090" transform="rotate(-30 11 11)"/><ellipse cx="12" cy="15" rx="2.6" ry="3.4" fill="#fff" stroke="#000" stroke-width=".8"/><ellipse cx="20" cy="15" rx="2.6" ry="3.4" fill="#fff" stroke="#000" stroke-width=".8"/><circle cx="12.8" cy="16" r="1.4"/><circle cx="20.8" cy="16" r="1.4"/><circle cx="12.3" cy="15.3" r=".5" fill="#fff"/><circle cx="20.3" cy="15.3" r=".5" fill="#fff"/><path d="M12 21q4 3.5 8 0" fill="#7a1a00" stroke="#000" stroke-width=".9"/><circle cx="8.5" cy="19" r="1.3" fill="#ff5a7a" opacity=".7"/><circle cx="23.5" cy="19" r="1.3" fill="#ff5a7a" opacity=".7"/></svg>',
    board: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="28" height="20" fill="#fff" stroke="#555" stroke-width="1.5"/><path d="M5 18q4-10 8-3t7-6 7 4" stroke="#e10600" stroke-width="2" fill="none"/><rect x="6" y="6" width="5" height="4" fill="#2a7ad8"/><path d="M10 23l-4 7M22 23l4 7M16 23v5" stroke="#7a5a2a" stroke-width="2"/><rect x="20" y="24" width="8" height="2" fill="#3a9a2a" stroke="#000" stroke-width=".5"/></svg>',
    fridge: '<svg viewBox="0 0 32 32"><rect x="6" y="1" width="20" height="30" rx="2" fill="#f4f1e6" stroke="#555"/><path d="M6 11h20" stroke="#555"/><rect x="22" y="4" width="2" height="5" fill="#999"/><rect x="22" y="14" width="2" height="8" fill="#999"/><rect x="9" y="14" width="8" height="3" fill="#fff" stroke="#000" stroke-width=".6"/><rect x="10" y="19" width="6" height="3" fill="#fff" stroke="#000" stroke-width=".6"/><rect x="9" y="24" width="9" height="3" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="12" cy="6" r="2" fill="#e10600"/></svg>',
    cork: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" fill="#b8854a" stroke="#6a4a1a" stroke-width="2"/><rect x="5" y="7" width="10" height="9" fill="#ffef80" transform="rotate(-6 10 11)"/><rect x="17" y="9" width="10" height="9" fill="#ff9ac8" transform="rotate(5 22 13)"/><rect x="9" y="17" width="10" height="8" fill="#9fd8ff" transform="rotate(3 14 21)"/><circle cx="10" cy="8" r="1.5" fill="#e10600"/><circle cx="22" cy="10" r="1.5" fill="#2a7ad8"/><circle cx="14" cy="18" r="1.5" fill="#3a9a2a"/></svg>',
    radio: '<svg viewBox="0 0 32 32"><path d="M8 9l16-7" stroke="#555" stroke-width="1.5"/><rect x="2" y="9" width="28" height="19" rx="3" fill="#a0642a" stroke="#4a2a0a"/><circle cx="10" cy="19" r="6" fill="#4a2a0a" stroke="#000"/><circle cx="10" cy="19" r="4" fill="#6a4a2a" stroke="#000" stroke-dasharray="1 1"/><rect x="18" y="13" width="10" height="5" fill="#ffe680" stroke="#000"/><path d="M20 13v5M23 13v5M26 13v5" stroke="#a08000" stroke-width=".5"/><path d="M22 14v4" stroke="#e10600"/><circle cx="21" cy="23" r="2" fill="#ccc" stroke="#000"/><circle cx="26" cy="23" r="2" fill="#ccc" stroke="#000"/></svg>',
    capsule: '<svg viewBox="0 0 32 32"><rect x="0" y="22" width="32" height="10" fill="#7a4a1a"/><circle cx="6" cy="26" r="1" fill="#4a2a0a"/><circle cx="24" cy="29" r="1" fill="#4a2a0a"/><rect x="9" y="6" width="14" height="20" rx="7" fill="#c0c0c0" stroke="#333"/><path d="M9 14h14" stroke="#333"/><rect x="13" y="17" width="6" height="4" fill="#ffd400" stroke="#333" stroke-width=".6"/><path d="M16 2v3M12 3l1 2M20 3l-1 2" stroke="#ffd400" stroke-width="1.5"/></svg>',
    bottle: '<svg viewBox="0 0 32 32"><path d="M0 26q4-3 8 0t8 0 8 0 8 0v6H0z" fill="#2a7ad8"/><g transform="rotate(-25 16 16)"><rect x="13" y="2" width="6" height="5" fill="#a0642a" stroke="#4a2a0a"/><path d="M13 7h6v4q5 2 5 7v10H8V18q0-5 5-7z" fill="#9fe0b0" fill-opacity=".8" stroke="#2a6a3a"/><rect x="12" y="16" width="8" height="9" fill="#f4e8c0" stroke="#a08040" stroke-width=".6"/><path d="M13 18h6M13 20h6M13 22h4" stroke="#a08040" stroke-width=".5"/></g></svg>',
    parcel: '<svg viewBox="0 0 32 32"><rect x="4" y="12" width="24" height="17" fill="#e10600" stroke="#600"/><rect x="2" y="8" width="28" height="6" fill="#ff3a2a" stroke="#600"/><rect x="14" y="8" width="4" height="21" fill="#ffd400" stroke="#a08000"/><path d="M16 8q-8-8-9-2t9 2q8-8 9-2t-9 2" fill="#ffd400" stroke="#a08000"/><circle cx="8" cy="20" r="1.3" fill="#fff"/><circle cx="24" cy="24" r="1.3" fill="#fff"/><circle cx="10" cy="26" r="1" fill="#fff"/></svg>',
    hang: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/><circle cx="12" cy="20" r="4" fill="#f2c79a" stroke="#000"/><circle cx="21" cy="20" r="4" fill="#3fa52c" stroke="#000"/><rect x="19.5" y="19" width="1.2" height="1.2" fill="#e10600"/><rect x="21.8" y="19" width="1.2" height="1.2" fill="#e10600"/><path d="M6 28q6-5 12 0M15 28q6-5 12 0" fill="#2a7ad8" stroke="#000"/></svg>',
  };
  if (window.JICON) Object.assign(I, { radio: JICON.icon('radio'), fridge: JICON.icon('magnets'), board: JICON.icon('whiteboard') });
  if (window.JICON && JICON.has('hangout')) { Object.assign(I, { snow: JICON.icon('snowball'), cork: JICON.icon('corkboard'), capsule: JICON.icon('capsule'), parcel: JICON.icon('parcel'), bottle: JICON.icon('bottle'), hang: JICON.icon('hangout') }); LOGO = JICON.icon('messenger'); }
  const ico = (s, n) => s.replace('<svg', `<svg width="${n || 16}" height="${n || 16}" aria-hidden="true"`);

  // the "uh-oh!" (two falling notes) and the nudge buzz, made with Sound.note so they respect the speaker in the tray
  const uhohSound = () => { note(784, 0.12, 'triangle'); note(587, 0.28, 'triangle', 150); };
  const buzzSound = () => { for (let i = 0; i < 6; i++) note(i % 2 ? 98 : 110, 0.07, 'sawtooth', i * 70); };

  // ================================================================ 1. UH-OH! MESSENGER (real people only, ICQ-style numbers)
  // Every JackNet member has a permanent Uh-Oh! number (UIN) worked out from their member number, so it can be looked up
  // both ways without asking the server:   UIN = 1999000 + memberNo * 37        memberNo = (UIN - 1999000) / 37
  // Guests get a temporary number from their connection id (300000-899999). It changes every visit, so guests can't be added.
  const UIN_BASE = 1999000, UIN_STEP = 37;
  const memberUIN = no => int(no, 1, 9999999) ? UIN_BASE + no * UIN_STEP : 0;
  const uinToNo = u => { u = +u; return Number.isInteger(u) && u > UIN_BASE && (u - UIN_BASE) % UIN_STEP === 0 ? (u - UIN_BASE) / UIN_STEP : 0; };
  const guestUIN = id => 300000 + ((Math.abs(id | 0) * 7919) % 600000);
  const isGuestUIN = u => Number.isInteger(u) && u >= 300000 && u < 900000;
  const lc = s => String(s == null ? '' : s).toLowerCase();
  // the members directory, from the server's own 'members' list: names and member numbers can't be faked
  const MEM = new Map(), MEMNO = new Map(); let MOODS = [], memAt = 0, memAsk = 0;
  let membersWait = [];
  Net.on('members', m => {
    memPending = false;
    if (m && Array.isArray(m.list)) { MEM.clear(); MEMNO.clear(); m.list.forEach(c => { if (isObj(c) && typeof c.name === 'string' && int(c.no, 1, 9999999)) { MEM.set(lc(c.name), c); MEMNO.set(c.no, c); } }); if (Array.isArray(m.moods)) MOODS = m.moods; memAt = Date.now(); }
    const ws = membersWait; membersWait = []; ws.forEach(f => { try { f(m); } catch (e) { console.error(e); } });
    renderCL();
  });
  let memPending = false;
  function members(cb, maxAge) { // call cb once the directory is fresh enough (requests in flight are shared)
    if (!memPending && Date.now() - memAt < (maxAge == null ? 30000 : maxAge)) { if (cb) cb({ list: [...MEM.values()], moods: MOODS }); return; }
    if (cb) membersWait.push(cb);
    if (memPending && Date.now() - memAsk < 8000) return;
    memPending = true; memAsk = Date.now();
    if (!Net.send({ t: 'members' })) { memPending = false; const ws = membersWait; membersWait = []; ws.forEach(f => f(null)); }
  }

  const myUIN = () => Net.me.member ? memberUIN(Net.me.no) : (Net.me.id ? guestUIN(Net.me.id) : 0);
  const uinOf = o => !o ? 0 : o.uin ? o.uin : o.member ? memberUIN((MEM.get(lc(o.nick)) || {}).no) : (o.id > 0 ? guestUIN(o.id) : 0);
  const uinText = o => { const u = uinOf(o); return !u ? '(looking up...)' : o.member ? String(u) : `${u} (guest number, changes every visit)`; };

  const AWAY_DEF = {
    away: "I'm away from the computer. Probably getting a biscuit. Back in a bit!",
    na: "Not here. Queuing for Episode I tickets. Could be days.",
    occ: "Busy! I'm on the last level and you can't pause it. Urgent stuff only.",
    dnd: "Do Not Disturb. Painting the eyes on a Space Marine. VERY steady hands needed.",
  };
  const UM = {
    status: (s => STAT[s] && s !== 'off' ? s : 'online')(store.get('jhp_social_st', 'online')),
    auto: null, away: Object.assign({}, AWAY_DEF, store.get('jhp_social_away', {})),
    peers: new Map(), sessions: new Map(),
    sound: store.get('jhp_social_snd', true), autoAway: store.get('jhp_social_aa', true), sent: store.get('jhp_social_sent', 0),
  };
  const awayMsg = () => clean(UM.away[UM.status] || '', 120);
  // a "peer" is a real person: someone online now {id, nick, col, member}, or an offline member {id: 0, nick, member: true}
  const keyOf = p => p.member ? 'm:' + lc(p.nick) : 'id:' + p.id;
  const liveOf = p => p.member ? online.find(o => o.member && lc(o.nick) === lc(p.nick)) : who(p.id);
  const stOf = p => { const o = liveOf(p); return o ? ((UM.peers.get(o.id) || {}).s || 'online') : 'off'; };
  const mOf = p => { const o = liveOf(p); return o ? (UM.peers.get(o.id) || {}).m || '' : ''; };
  const isTop = w => w && !w.closed && w.el.style.display !== 'none' && +w.el.style.zIndex === (window.JZ || 0);

  // ---- contacts (members only), kept in jhp_ storage so they roam with the member's profile
  const CKEY = 'jhp_social_contacts';
  const loadContacts = () => { const a = store.get(CKEY, []); return (Array.isArray(a) ? a : []).filter(c => isObj(c) && uinToNo(c.u) && typeof c.n === 'string' && /^[\w-]{1,20}$/.test(c.n)).slice(0, 150).map(c => ({ u: c.u, n: c.n, a: clean(c.a || '', 20), s: c.s === 'ok' ? 'ok' : 'wait' })); };
  let contacts = loadContacts();
  const saveContacts = () => store.set(CKEY, contacts);
  const contactByUin = u => contacts.find(c => c.u === u);
  const contactOf = p => p && p.member ? contacts.find(c => lc(c.n) === lc(p.nick)) : null;
  const peerOfContact = c => liveOf({ member: true, nick: c.n }) || { id: 0, nick: c.n, member: true, uin: c.u };
  const showName = p => { const c = contactOf(p); return c && c.a ? c.a : p.nick; };

  // ---- the private post box (server mod pm.js): authorisation requests/answers and offline messages.
  // Only the owner can read their box; the server stamps who sent each item (from, fromNo), so they can't be faked.
  const pmGate = gate(5, 12000);
  function pmSend(no, kind, text) {
    if (!Net.me.member) return false;
    if (!pmGate('me')) { Desk.toast('Uh-Oh!', 'Slow down a bit! (Too many requests and offline messages at once.)', 3000); return false; }
    return Net.send({ t: 'pmSend', to: no, kind, text: String(text || '').slice(0, 400) });
  }
  Net.on('pmSent', m => { if (m && m.ok === false && m.err) Desk.toast('Uh-Oh!', String(m.err).slice(0, 120), 4000); });
  const pmDone = new Set(), pmWait = []; let pmReady = false;
  const pmAck = ids => { if (ids.length) Net.send({ t: 'pmAck', ids: ids.slice(0, 100) }); };
  Net.on('pmList', m => { if (m && Array.isArray(m.items)) pmIn(m.items, false); });
  Net.on('pmNew', m => { if (m && isObj(m.item)) pmIn([m.item], true); });
  function pmIn(items, live) {
    if (!pmReady) { pmWait.push([items, live]); return; } // the roaming profile may still be about to reload the page
    const fresh = items.filter(x => isObj(x) && typeof x.id === 'string' && /^[a-z0-9]{4,20}$/.test(x.id) && !pmDone.has(x.id) && typeof x.from === 'string' && int(x.fromNo, 1, 9999999) && ['msg', 'auth', 'authok', 'authno'].includes(x.kind));
    const ack = []; let n = 0;
    for (const x of fresh) {
      pmDone.add(x.id);
      const name = clean(x.from, 20), u = memberUIN(x.fromNo), ts = int(x.ts, 1, 9e15) ? x.ts : Date.now();
      if (!name || ignored.has(lc(name))) { ack.push(x.id); continue; }
      if (x.kind === 'auth') { if (!authQ.some(q => q.u === u)) authQ.push({ u, n: name, msg: clean(x.text, 80), id: x.id }); else ack.push(x.id); continue; }
      ack.push(x.id);
      if (x.kind === 'msg') { const t = clean(x.text, 300); if (t) { incoming(liveOf({ member: true, nick: name }) || { id: 0, nick: name, member: true }, t, false, ts); n++; } continue; }
      const c = contactByUin(u); if (!c) continue;
      if (x.kind === 'authok') { c.s = 'ok'; c.n = name; saveContacts(); Desk.toast('Uh-Oh!', `${name} said OK! They're on your contact list now.`, 5000); got('authok'); if (UM.sound) uhohSound(); }
      else { contacts = contacts.filter(y => y !== c); saveContacts(); Desk.toast('Uh-Oh!', `${name} didn't want to be added. Never mind!`, 5000); }
    }
    pmAck(ack);
    if (n) { got('offline'); if (!live) Desk.toast('Uh-Oh!', `You've got ${n} offline message${n > 1 ? 's' : ''}! (They were sent while you were away.)`, 6000); }
    renderCL(); nextAuth();
  }
  function pmOpen() { // roaming has settled: load this member's contacts and open the post box
    contacts = loadContacts(); pmReady = true;
    const w = pmWait.splice(0); w.forEach(([items, live]) => pmIn(items, live));
    if (Net.me.member) Net.send({ t: 'pmFetch' });
    renderCL();
  }
  const authQ = []; let authWin = null;
  function nextAuth() {
    trayRender();
    if (authWin && !authWin.closed) return;
    const q = authQ.shift(); if (!q) return;
    const already = contactByUin(q.u);
    const b = h('div', 'so-auth');
    b.innerHTML = `<div class="so-arow">${ico(LOGO, 32)}<div><b class="n"></b> <span class="small">(Uh-Oh! #${q.u})</span> wants to add you to their contact list.${q.msg ? '<div class="field so-amsg"></div>' : ''}</div></div>
      <label class="small"><input type="checkbox" class="so-aback"${already && already.s === 'ok' ? ' disabled' : ' checked'}> Add <span class="n"></span> to my list too</label>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-x="info">View Info</button><button class="btn" type="button" data-x="ok"><b>Authorise</b></button><button class="btn" type="button" data-x="no">Decline</button></div>`;
    b.querySelectorAll('.n').forEach(e => { e.textContent = q.n; });
    if (q.msg) b.querySelector('.so-amsg').textContent = q.msg;
    let answered = false;
    authWin = Apps.win('Authorisation Request', b, { w: 340, icon: LOGO16, noResize: true, noMax: true, onClose: () => { authWin = null; if (!answered) pmDone.delete(q.id); setTimeout(nextAuth, 400); } }); // closed without answering: ask again next logon
    if (UM.sound) uhohSound();
    b.addEventListener('click', ev => {
      const x = ev.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'info') return userInfo({ id: 0, nick: q.n, member: true, uin: q.u });
      const no = uinToNo(q.u); answered = true;
      if (x.dataset.x === 'ok') {
        pmSend(no, 'authok', ''); got('authorise');
        const c = contactByUin(q.u);
        if (c) { c.s = 'ok'; saveContacts(); } else if (b.querySelector('.so-aback').checked && contacts.length < 150) { contacts.push({ u: q.u, n: q.n, a: '', s: 'ok' }); saveContacts(); }
        Desk.toast('Uh-Oh!', `You authorised ${q.n}. Say hello!`, 3500);
      } else pmSend(no, 'authno', '');
      pmAck([q.id]); authWin.close(); renderCL();
    });
  }

  // ---- status
  function sendStatus(to) { return Net.relay(to || 0, 'social.st', { s: UM.status, m: ['away', 'na', 'occ', 'dnd'].includes(UM.status) ? awayMsg() : '' }); }
  Net.onRelay('social.st', (d, msg) => {
    const o = sender(msg); if (!o || !isObj(d) || !STAT[d.s]) return;
    UM.peers.set(o.id, { s: d.s, m: clean(d.m, 120) });
    renderCL(); UM.sessions.forEach(s => sessHead(s));
  });
  let known = new Set();
  onlineFns.push(() => {
    const ids = new Set(online.map(o => o.id));
    const fresh = [...ids].filter(id => !known.has(id) && id !== Net.me.id);
    if (known.size && fresh.length) { if (fresh.length <= 4) fresh.forEach((id, i) => setTimeout(() => sendStatus(id), 400 + i * 200)); else sendStatus(0); }
    for (const id of [...UM.peers.keys()]) if (!ids.has(id)) UM.peers.delete(id);
    if (online.some(o => o.member && !MEM.has(lc(o.nick)))) members(null, 0); // a member we don't know the number of yet (asks at most every 4s)
    known = ids;
    renderCL();
    UM.sessions.forEach(s => sessHead(s));
  });
  // the roaming profile (roam.js) may bring a member's settings down and reload the page right after logon,
  // so don't open the post box (and mark messages as read) until it has settled
  let roamReload = false;
  Net.on('rmData', () => { roamReload = true; });
  function afterRoam(fn) { let done = false; const go = () => { if (done) return; done = true; if (!roamReload) fn(); }; if (!window.Roam) return setTimeout(go, 800); Net.on('rmSame', go); Net.on('rmNone', go); setTimeout(go, 4500); }
  const settle = logon => afterRoam(() => { members(null, 0); if (logon && UM.status !== 'inv' && UM.status !== 'online') setStatus('online'); pmOpen(); });
  Net.on('welcome', () => { setTimeout(() => sendStatus(0), 900); pmReady = false; settle(true); });
  Net.on('loginOk', () => { pmReady = false; settle(true); });
  Net.on('you', () => { pmReady = false; settle(false); });
  document.addEventListener('jacknet-who', () => setTimeout(() => { renderCL(); webBadge(); }, 50));

  function setStatus(s, auto) {
    if (!STAT[s]) return;
    const was = UM.status; UM.status = s;
    if (!auto) { UM.auto = null; if (s !== 'off') store.set('jhp_social_st', s); }
    sendStatus(0); renderCL();
    if (s === 'inv') got('invisible');
    if (s === 'off' && was !== 'off') { UM.sessions.forEach(x => addSys(x, 'You are now offline. (Click the flower in the tray to reconnect.)')); }
    if (s === 'ffc' && was !== 'ffc') Desk.toast('Uh-Oh!', "You're Free For Chat! Everyone can see you're bored. Somebody say something!", 4000);
  }

  // ---- history (kept per nickname, in this browser only)
  const HKEY = 'jhp_social_hist';
  const histAll = () => { const v = store.get(HKEY, {}); return isObj(v) ? v : {}; };
  const hist = nick => { const a = histAll()[lc(nick)]; return Array.isArray(a) ? a : []; };
  function histAdd(nick, dir, text) {
    const all = histAll(), k = lc(nick);
    const a = (Array.isArray(all[k]) ? all[k] : []).concat([[Date.now(), dir, String(text).slice(0, 300)]]).slice(-50);
    delete all[k]; all[k] = a;
    const keys = Object.keys(all); if (keys.length > 25) keys.slice(0, keys.length - 25).forEach(x => delete all[x]);
    store.set(HKEY, all);
  }

  // ---- taskbar flashing + tray
  function flash(w) { if (w && !w.closed) w.task.classList.add('so-flash'); }
  function unflash(s) { s.w.task.classList.remove('so-flash'); if (s.unread) { s.unread = 0; renderCL(); } }
  const anyUnread = () => [...UM.sessions.values()].some(s => s.unread) || authQ.length > 0 || !!(authWin && !authWin.closed);
  let tray = null, trayConnecting = 0;
  function trayRender() {
    if (!tray) return;
    const un = anyUnread();
    tray.classList.toggle('so-blink', un);
    tray.innerHTML = un ? `<span class="so-t1">${ENVELOPE}</span><span class="so-t2">${STAT[UM.status][1]}</span>` : (trayConnecting ? `<span class="so-spin">${STAT.online[1]}</span>` : STAT[UM.status][1]);
    tray.title = un ? 'Uh-Oh! - something new for you!' : `Uh-Oh! Messenger - ${STAT[UM.status][0]}`;
  }
  function trayClick() {
    if (authWin && !authWin.closed) { authWin.restore(); return; }
    if (authQ.length) { nextAuth(); return; }
    const s = [...UM.sessions.values()].find(x => x.unread);
    if (s) { s.w.restore(); unflash(s); return; }
    if (UM.status === 'off') { setStatus('online'); Desk.toast('Uh-Oh!', 'Connecting to the Uh-Oh! network... Connected! You are Online.', 3000); }
    if (CL && !CL.closed && isTop(CL)) { CL.min(); dockPref(false); } else openCL(true);
  }
  function makeTray() {
    const t = $('tray'), clock = $('clock'); if (!t || tray) return;
    tray = h('button', 'so-tray'); tray.type = 'button'; tray.setAttribute('aria-label', 'Uh-Oh! Messenger');
    t.insertBefore(tray, clock || null);
    tray.addEventListener('click', trayClick);
    tray.addEventListener('contextmenu', ev => { ev.preventDefault(); const r = tray.getBoundingClientRect(); IE.menu(statusMenu().concat(['-', { label: 'Open Contact List', act: () => openCL(true) }, { label: 'Add/Find Users...', act: findUser }, { label: UM.status === 'off' ? 'Connect' : 'Exit Uh-Oh!', act: () => setStatus(UM.status === 'off' ? 'online' : 'off') }]), r.left - 120, r.top - 300); });
    trayConnecting = 1; trayRender();
    setTimeout(() => { trayConnecting = 0; trayRender(); }, 3500);
  }
  const statusMenu = () => ST_ORDER.map(k => ({ label: STAT[k][0], icon: STAT[k][1], key: UM.status === k ? '✔' : '', act: () => setStatus(k) }));

  // ---- the contact list (docked on the right, like it always was)
  let CL = null, clSel = null;
  const dockPref = v => store.set('jhp_social_dock', v);
  function groups() {
    const on = [], off = [], notIn = [];
    for (const c of contacts) {
      const o = liveOf({ member: true, nick: c.n }), st = o ? ((UM.peers.get(o.id) || {}).s || 'online') : 'off';
      const p = o || { id: 0, nick: c.n, member: true, uin: c.u };
      if (o && isIgnored(o)) continue;
      (c.s === 'ok' && st !== 'off' && st !== 'inv' ? on : off).push({ p, c, st: c.s === 'ok' ? (st === 'inv' ? 'off' : st) : 'wait' });
    }
    UM.sessions.forEach(s => { if (!contactOf(s.peer) && !s.w.closed) notIn.push({ p: s.peer, c: null, st: liveOf(s.peer) ? stOf(s.peer) : 'off' }); });
    const order = x => ST_ORDER.indexOf(x.st);
    on.sort((a, b) => order(a) - order(b) || showName(a.p).localeCompare(showName(b.p)));
    off.sort((a, b) => showName(a.p).localeCompare(showName(b.p)));
    return { on, off, notIn };
  }
  const WAIT_ICO = flower('#c0c0c0', '#8a8a8a', '<circle cx="12.6" cy="12.6" r="3.1" fill="#fff" stroke="#000" stroke-width=".6"/><text x="12.6" y="14.6" font-size="5.5" font-weight="bold" text-anchor="middle" fill="#00007f">?</text>');
  function openCL(user) {
    if (user) dockPref(true);
    if (CL && !CL.closed) { CL.restore(); return CL; }
    const b = h('div', 'so-cl');
    b.innerHTML = `<div class="so-clhead">${ico(LOGO, 32)}<div><b>Uh-Oh!</b><small class="so-clnick"></small></div></div>
      <div class="so-myuin" title="Give this number to your mates so they can add you"></div>
      <button class="btn so-addbtn" type="button">${ico(LOGO16)}<span>Add/Find Users</span></button>
      <div class="field so-cllist" role="listbox" aria-label="Contacts"></div>
      <div class="so-clbtns"><button class="btn so-main" type="button">${ico(LOGO16)}<span>Uh-Oh!</span></button><button class="btn so-stbtn" type="button"><span class="so-stico"></span><span class="so-stlbl"></span></button></div>`;
    // dock on the right, but if the browser reaches under it, sit below the browser's title bar and toolbars so its buttons stay reachable
    const W = 214, br = document.getElementById('browser'), bR = br && !br.classList.contains('min') ? DesktopSurface.rect(br) : null;
    const Y = bR && bR.right > DesktopSurface.width() - W - 4 ? Math.max(4, Math.round(bR.top + 130)) : 4;
    const H = Math.min(470, DesktopSurface.height() - Y - 40);
    CL = Apps.win('Uh-Oh!', b, { w: W, h: H, icon: LOGO16, noMax: true, minW: 180, minH: 260, x: DesktopSurface.width() - W - 4, y: Y, onClose: () => { CL = null; dockPref(false); } });
    CL.el.classList.add('so-clwin');
    const mn = CL.el.querySelector('[data-w=min]'); if (mn) mn.addEventListener('click', () => dockPref(false));
    const list = b.querySelector('.so-cllist');
    const peerAt = el => { const r = el && el.closest('.so-row'); return r ? CL._map.get(r.dataset.k) : null; };
    let lastTap = 0, lastKey = '';
    list.addEventListener('click', ev => {
      if (ev.target.closest('.so-welcome')) { welcomeNote(); return; }
      if (ev.target.closest('.so-empty .btn')) { findUser(); return; }
      const r = ev.target.closest('.so-row'); if (!r) return;
      const it = peerAt(r); if (!it) return;
      if (ev.target.closest('.so-rowmenu')) { const bb = r.getBoundingClientRect(); IE.menu(peerMenu(it), bb.right - 20, bb.bottom); return; }
      list.querySelectorAll('.so-row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel'); clSel = r.dataset.k;
      const now = Date.now();
      if (touch() || (now - lastTap < 450 && lastKey === r.dataset.k)) { lastTap = 0; session(it.p); } else { lastTap = now; lastKey = r.dataset.k; }
    });
    list.addEventListener('contextmenu', ev => { const it = peerAt(ev.target); if (!it) return; ev.preventDefault(); IE.menu(peerMenu(it), ev.clientX, ev.clientY); });
    list.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const it = peerAt(ev.target); if (it) session(it.p); } });
    b.querySelector('.so-addbtn').addEventListener('click', findUser);
    b.querySelector('.so-main').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(); IE.menu(mainMenu(), r.left, r.top - 330); });
    b.querySelector('.so-stbtn').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(); IE.menu(statusMenu(), r.left, r.top - 200); });
    renderCL();
    return CL;
  }
  function renderCL() {
    trayRender();
    if (!CL || CL.closed) return;
    const b = CL.body, list = b.querySelector('.so-cllist'), { on, off, notIn } = groups();
    b.querySelector('.so-clnick').textContent = Net.me.nick || 'Connecting...';
    const u = myUIN();
    b.querySelector('.so-myuin').innerHTML = Net.me.member ? `My Uh-Oh! number:<b>${u || '...'}</b>` : `Guest number: <b>${u || '...'}</b><small>(changes every visit. <a href="#" class="so-join">Join JackNet</a> for your own!)</small>`;
    const j = b.querySelector('.so-join'); if (j) j.addEventListener('click', ev => { ev.preventDefault(); if (window.JackLogon) JackLogon.show(); });
    b.querySelector('.so-stico').innerHTML = STAT[UM.status][1];
    b.querySelector('.so-stlbl').textContent = STAT[UM.status][0].replace(/ \(.*/, '');
    CL._map = new Map();
    const row = (it, dim) => {
      const k = keyOf(it.p); CL._map.set(k, it);
      const s = UM.sessions.get(k), un = s && s.unread;
      const icon = un ? ENVELOPE : it.st === 'wait' ? WAIT_ICO : STAT[it.st] ? STAT[it.st][1] : STAT.off[1];
      const label = it.c && it.c.a ? it.c.a : it.p.nick;
      return `<div class="so-row${dim ? ' dim' : ''}${clSel === k ? ' sel' : ''}${un ? ' unread' : ''}" role="option" tabindex="0" data-k="${esc(k)}" title="${esc(it.st === 'wait' ? 'Waiting for them to say OK' : (STAT[it.st] || STAT.off)[0])}"><span class="so-rico">${icon}</span><span class="so-rnick">${esc(label)}${it.st === 'wait' ? ' <i>(waiting)</i>' : ''}</span>${it.p.member ? '<span class="so-star" title="JackNet member">★</span>' : ''}<button class="so-rowmenu" type="button" aria-label="Options">▸</button></div>`;
    };
    const welcome = !store.get('jhp_social_welcomeread', false) ? `<div class="so-row so-welcome" role="option" tabindex="0" title="System message"><span class="so-rico">${ENVELOPE}</span><span class="so-rnick"><b>Welcome to Uh-Oh!</b></span></div>` : '';
    list.innerHTML = UM.status === 'off'
      ? `<div class="so-offmsg">${ico(STAT.off[1], 32)}<p>You are offline.</p><button class="btn" type="button">Connect</button></div>`
      : `${welcome ? `<div class="so-grp">▾ System</div>${welcome}` : ''}<div class="so-grp">▾ Online (${on.length})</div>${on.map(it => row(it)).join('')}<div class="so-grp">▾ Offline (${off.length})</div>${off.map(it => row(it, true)).join('')}${notIn.length ? `<div class="so-grp">▾ Not in list (${notIn.length})</div>${notIn.map(it => row(it)).join('')}` : ''}${contacts.length ? '' : `<div class="so-empty">Your list is empty. Add your mates by their <b>Uh-Oh! number</b> or nickname!<button class="btn" type="button">Add/Find Users...</button></div>`}`;
    const cb = list.querySelector('.so-offmsg button'); if (cb) cb.addEventListener('click', () => setStatus('online'));
    CL.setTitle(on.length ? `Uh-Oh! (${on.length})` : 'Uh-Oh!');
  }
  function welcomeNote() {
    store.set('jhp_social_welcomeread', true); renderCL();
    const u = myUIN();
    Desk.msgbox('System Message', Net.me.member
      ? `Welcome to Uh-Oh! Messenger, ${Net.me.nick}!\n\nYour Uh-Oh! number is ${u}. It's yours forever. Give it to your mates (it's on your JackNet profile too).\n\nTo add someone: press "Add/Find Users" and type their number or nickname. They get asked if it's OK, then they pop up in your list. You can even send messages to people who are offline: they get them next time they log on.\n\nBe nice. Never give out your real name, address or phone number.`
      : `Welcome to Uh-Oh! Messenger!\n\nYou're a guest, so your number (${u}) changes every visit. You can see who's online and read any messages people send you, but sending messages and keeping a contact list are for JackNet members.\n\nJoin JackNet (free!) to get your own permanent Uh-Oh! number.`, 'info',
      Net.me.member ? [['Add/Find Users...', findUser], ['OK']] : [['Join / Log On', () => window.Guest && Guest.join()], ['OK']]);
    got('welcome');
  }
  function peerMenu(it) {
    const p = it.p, live = liveOf(p), c = it.c || contactOf(p);
    const items = [
      { label: live ? 'Message' : 'Send Offline Message', dis: !live && !(p.member && Net.me.member), act: () => session(p) },
      { label: 'Nudge!', dis: !live, act: () => nudge(session(p)) },
      { label: 'Send File...', dis: !live, act: () => { const s = session(p); fileMenu(s, s.w.el.querySelector('[data-a=file]')); } },
      { label: 'Invite to a game...', dis: !live || !window.MP, act: () => MP.chooseGame(live) },
      '-',
      { label: 'Throw a Snowball', dis: !live, act: () => Throw.send(live, 'snow') },
      { label: 'Throw a Paper Aeroplane...', dis: !live, act: () => Throw.dialog(live, 'plane') },
      { label: 'Throw a Blobbit', dis: !live, act: () => Throw.send(live, 'squig') },
      { label: 'Pass the Parcel to them', dis: !live, act: () => Parcel.start(live) },
      '-',
      { label: 'User Info', act: () => userInfo(p) },
      { label: 'Message History', act: () => showHistory(p.nick) },
    ];
    if (c) items.push('-', { label: 'Rename...', act: () => promptBox('Rename Contact', `New name for ${c.n} in your list:`, c.a || c.n, 20, v => { c.a = clean(v, 20); if (lc(c.a) === lc(c.n)) c.a = ''; saveContacts(); renderCL(); }) },
      ...(c.s === 'wait' ? [{ label: 'Ask Again', act: () => { if (pmSend(uinToNo(c.u), 'auth', '')) Desk.toast('Uh-Oh!', `Asked ${c.n} again.`, 2500); } }] : []),
      { label: 'Delete', act: () => Desk.msgbox('Delete Contact', `Take ${c.n} off your contact list?`, 'q', [['Delete', () => { contacts = contacts.filter(x => x !== c); saveContacts(); renderCL(); }], ['Cancel']]) });
    else if (p.member) items.push('-', { label: 'Add to Contact List', act: () => addContact(p.nick) });
    if (live) items.push({ label: isIgnored(live) ? 'Stop Ignoring' : 'Ignore User', act: () => toggleIgnore(live.nick) });
    return items;
  }
  function toggleIgnore(nick) {
    const k = lc(nick);
    if (ignored.has(k)) ignored.delete(k); else { ignored.add(k); Desk.toast('Uh-Oh!', `${nick} is now ignored. You won't see their messages, nudges or snowballs.`, 4000); }
    store.set('jhp_social_ignore', [...ignored].slice(-50)); renderCL();
  }
  function mainMenu() {
    return [
      { label: 'Add/Find Users...', act: findUser },
      { label: 'Throw Something...', act: () => Throw.dialog() },
      { label: 'JackNet Hangout', sub: () => HANG.filter(x => x[1] !== 'social.uhoh').map(([label, id, icon]) => ({ label, icon: ico(icon), act: () => Apps.open(id) })) },
      '-',
      { label: 'Uh-Oh! Sounds', chk: UM.sound, act: () => { UM.sound = !UM.sound; store.set('jhp_social_snd', UM.sound); if (UM.sound) uhohSound(); } },
      { label: 'Auto-Away When Idle', chk: UM.autoAway, act: () => { UM.autoAway = !UM.autoAway; store.set('jhp_social_aa', UM.autoAway); } },
      { label: 'Edit Away Messages...', act: editAway },
      { label: 'Ignore List...', act: ignoreList },
      '-',
      { label: 'Read Me', act: () => txt('UHOH README.TXT', README) },
      { label: 'About Uh-Oh!...', act: () => Desk.msgbox('About Uh-Oh!', `Uh-Oh! Messenger 99b (build 1999)\n\nYour Uh-Oh! number: ${myUIN() || '...'}${Net.me.member ? '' : ' (guest, changes every visit)'}\nPeople on JackNet right now: ${online.length}\n\nIt goes "uh-oh!" when you get a message. That's the whole idea. Jack's cousin wrote it in a weekend. Jack painted the logo.`, 'info') },
      '-',
      { label: UM.status === 'off' ? 'Connect' : 'Exit Uh-Oh!', act: () => setStatus(UM.status === 'off' ? 'online' : 'off') },
    ];
  }
  function promptBox(title, label, def, max, cb) { // a small JackOS 98 prompt (Desk.ask shouts in capitals)
    const f = h('form', 'so-prompt');
    f.innerHTML = `<label class="so-plab"></label><input type="text" maxlength="${max}" style="width:100%;box-sizing:border-box;margin:6px 0"><div class="row" style="justify-content:flex-end"><button class="btn" type="submit">OK</button><button class="btn" type="button">Cancel</button></div>`;
    f.querySelector('.so-plab').textContent = label;
    const w = Apps.win(title, f, { w: 300, icon: LOGO16, noResize: true, noMax: true, noMin: true, escClose: true });
    const inp = f.querySelector('input'); inp.value = def || ''; setTimeout(() => { inp.focus(); inp.select(); }, 40);
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => { ev.preventDefault(); w.close(); cb(inp.value.trim()); });
  }

  // ---- adding people (members only, with permission, like the real thing)
  const addGate = gate(1, 6000);
  function addContact(nickOrUin) {
    if (!Net.me.member) return mgate('Keeping an Uh-Oh! contact list', () => addContact(nickOrUin)); // (a guest's number changes every visit)
    members(() => {
      const q = String(nickOrUin).trim();
      const card = /^\d+$/.test(q) ? MEMNO.get(uinToNo(+q)) : MEM.get(lc(q));
      if (!card && !addContact.retry) { addContact.retry = 1; members(() => { addContact(nickOrUin); addContact.retry = 0; }, 0); return; }
      addContact.retry = 0;
      if (!card) { const g = /^\d+$/.test(q) && online.find(o => !o.member && guestUIN(o.id) === +q) || online.find(o => !o.member && lc(o.nick) === lc(q)); return Desk.msgbox('Uh-Oh!', g ? `${g.nick} is a guest. Guests can't be added to contact lists (their number changes every visit), but you can message them while they're online.` : `Nobody on JackNet has the Uh-Oh! number or nickname "${q.slice(0, 20)}".`, 'info', g ? [['Message', () => session(g)], ['OK']] : [['OK']]); }
      const u = memberUIN(card.no);
      if (u === myUIN()) { got('findme'); return Desk.msgbox('Uh-Oh!', "That's you! You can't add yourself. (Well, you could, but you'd never be offline.)", 'info'); }
      if (contactByUin(u)) return Desk.toast('Uh-Oh!', `${card.name} is already on your list.`, 2500);
      if (contacts.length >= 150) return Desk.msgbox('Uh-Oh!', 'Your contact list is full (150 people!). Delete somebody first.', 'warn');
      if (!addGate('me')) return Desk.toast('Uh-Oh!', 'Hang on a sec! One request every few seconds.', 2500);
      contacts.push({ u, n: card.name, a: '', s: 'wait' }); saveContacts();
      pmSend(card.no, 'auth', '');
      got('add'); renderCL(); openCL(true);
      Desk.toast('Uh-Oh!', `Asked ${card.name} if you can add them. They'll appear in your list when they say OK${liveOf({ member: true, nick: card.name }) ? '' : ' (next time they log on)'}.`, 5000);
    }, 0);
  }

  // ---- message sessions
  function session(peer, o) {
    o = o || {};
    const key = keyOf(peer);
    let s = UM.sessions.get(key);
    if (s && !s.w.closed) { if (!o.quiet) { s.w.restore(); unflash(s); } return s; }
    const b = h('div', 'so-im');
    b.innerHTML = `<div class="so-imhead"><span class="so-imico"></span><span class="so-imwho"><b></b><small></small></span><button class="btn so-sm" data-a="add" type="button" hidden>Add</button><button class="btn so-sm" data-a="info" type="button">Info</button><button class="btn so-sm" data-a="hist" type="button">History</button></div>
      <div class="field so-imlog" role="log" aria-live="polite"></div>
      <textarea class="so-imta" rows="3" maxlength="300" aria-label="Your message" placeholder="Type a message, then press Enter or Send"></textarea>
      <div class="so-imbtns"><button class="btn" data-a="nudge" type="button">Nudge!</button><button class="btn" data-a="file" type="button">File...</button><button class="btn" data-a="throw" type="button">Throw...</button><span class="so-left">300</span><button class="btn so-send" data-a="send" type="button"><b>Send</b></button></div>`;
    const n = UM.sessions.size;
    const w = Apps.win('Message Session - ' + showName(peer), b, { w: 380, h: 390, icon: LOGO16, status: true, minW: 280, minH: 280, x: Math.max(4, DesktopSurface.width() - 640 - n * 26), y: 60 + n * 26, onClose: () => { UM.sessions.delete(key); const l = liveOf(peer); if (s.tyOut && l) Net.relay(l.id, 'social.im', { k: 'ty', on: 0 }); renderCL(); } });
    s = { key, peer, w, log: b.querySelector('.so-imlog'), ta: b.querySelector('textarea'), tyOut: 0, tyTimer: 0, unread: 0 };
    UM.sessions.set(key, s);
    w.el.addEventListener('pointerdown', () => unflash(s));
    w.task.addEventListener('click', () => unflash(s));
    const old = hist(peer.nick).slice(-8);
    if (old.length) { old.forEach(([ts, dir, t]) => addLine(s, dir, t, ts, true)); addSys(s, '--- earlier messages above ---'); }
    sessHead(s);
    w.status.textContent = 'Ready.';
    if (!Net.me.member) addSys(s, "You're a guest: you can read messages people send you, but sending them is for JackNet members. (Joining is free!)");
    const ta = s.ta, left = b.querySelector('.so-left');
    ta.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendIM(s); } });
    ta.addEventListener('input', () => {
      left.textContent = 300 - ta.value.length;
      const l = liveOf(peer); if (!l) return;
      const now = Date.now();
      if (ta.value && now - s.tyOut > 3000) { s.tyOut = now; Net.relay(l.id, 'social.im', { k: 'ty', on: 1 }); }
      if (!ta.value && s.tyOut) { s.tyOut = 0; Net.relay(l.id, 'social.im', { k: 'ty', on: 0 }); }
    });
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'send') sendIM(s);
      else if (act === 'nudge') nudge(s);
      else if (act === 'file') { if (mgate('Sending files on Uh-Oh!', () => fileMenu(s, a))) return; }
      else if (act === 'throw') { const l = liveOf(peer); if (!l) return addSys(s, `${peer.nick} isn't online, so there's nobody to throw things at.`); const r = a.getBoundingClientRect(); IE.menu([{ label: 'Snowball', icon: ico(I.snow), act: () => Throw.send(l, 'snow') }, { label: 'Paper Aeroplane...', icon: ico(I.plane), act: () => Throw.dialog(l, 'plane') }, { label: 'Blobbit', icon: ico(I.squig), act: () => Throw.send(l, 'squig') }], r.left, r.bottom); }
      else if (act === 'info') userInfo(peer);
      else if (act === 'hist') showHistory(peer.nick);
      else if (act === 'add') addContact(peer.nick);
    });
    if (o.min) { w.min(); flash(w); }
    else setTimeout(() => ta.focus(), 40);
    renderCL();
    return s;
  }
  function sessHead(s) {
    if (s.w.closed) return;
    const p = s.peer, l = liveOf(p), st = l ? stOf(p) : 'off', m = l ? mOf(p) : '';
    if (l && l.id !== p.id && p.member) s.peer = Object.assign({}, l); // they came back (new connection)
    const hd = s.w.body.querySelector('.so-imhead');
    hd.querySelector('.so-imico').innerHTML = STAT[st][1];
    hd.querySelector('b').textContent = showName(p);
    const u = uinOf(p);
    hd.querySelector('small').textContent = (u ? (p.member ? 'Uh-Oh! #' + u : 'Guest #' + u) + ' · ' : '') + (l ? STAT[st][0] : p.member ? 'Offline - messages wait for them' : 'Logged off') + (m && st !== 'online' && st !== 'ffc' ? ': "' + m + '"' : '');
    hd.querySelector('small').title = m;
    hd.querySelector('[data-a=add]').hidden = !(p.member && Net.me.member && !contactOf(p) && lc(p.nick) !== lc(Net.me.nick));
  }
  function addLine(s, dir, text, ts, old, offline) {
    const nick = dir === 'o' ? (Net.me.nick || 'Me') : showName(s.peer);
    const col = dir === 'o' ? '#0028c8' : '#c00000';
    const d = h('div', 'so-msg' + (old ? ' old' : '') + (dir === 'a' ? ' auto' : ''));
    d.innerHTML = `<div class="so-mh" style="color:${old ? '#808080' : col}"><b></b> <span>(${esc(offline ? d99(offline) + ' ' + hhmm(offline) : hhmm(ts))})</span>${dir === 'a' ? ' <i>auto-reply</i>' : ''}${offline ? ' <i>offline message</i>' : ''}</div><div class="so-mt"></div>`;
    d.querySelector('b').textContent = nick; d.querySelector('.so-mt').textContent = text;
    s.log.appendChild(d); trimLog(s);
  }
  function addSys(s, text) { if (!s || s.w.closed) return null; const d = h('div', 'so-sys'); d.textContent = text; s.log.appendChild(d); trimLog(s); return d; }
  function trimLog(s) { while (s.log.children.length > 120) s.log.firstChild.remove(); s.log.scrollTop = s.log.scrollHeight; }
  const imOut = gate(6, 12000), imIn = gate(8, 10000), nudgeOut = gate(1, 10000), nudgeIn = gate(1, 6000), autoOut = gate(1, 180000), offOut = gate(3, 60000);

  function sendIM(s) {
    const text = clean(s.ta.value, 300), p = s.peer;
    if (!text) return;
    if (!Net.me.member) return mgate('Sending Uh-Oh! messages', () => { if (!s.w.closed) sendIM(s); }); // what they typed stays put
    if (UM.status === 'off') { addSys(s, "You're offline! Click the flower in the system tray to connect."); return; }
    if (lc(p.nick) === lc(Net.me.nick)) { addSys(s, "That's you! Talking to yourself is the first sign of madness."); return; }
    if (!imOut('me')) { s.w.status.textContent = "Whoa, slow down! The modem can't keep up. Wait a few seconds."; return; }
    const l = liveOf(p);
    if (l) {
      if (stOf(p) === 'off') { addSys(s, `${p.nick} has closed Uh-Oh! and can't get messages right now.`); return; }
      if (!Net.relay(l.id, 'social.im', { k: 'm', t: text })) { addSys(s, 'Message not sent: not connected to JackNet. (Is someone on the phone?)'); return; }
      s.w.status.textContent = 'Message sent at ' + hhmm();
    } else if (p.member) {
      if (!Net.me.member) { addSys(s, `${p.nick} is offline. Only JackNet members can leave offline messages. (Join! It's free.)`); return; }
      if (!offOut('me')) { addSys(s, "That's a lot of offline messages! Save some for when they're back."); return; }
      if (!pmSend(p.nick, 'msg', text)) { addSys(s, 'Not sent: slow down a bit, or check you are connected.'); return; }
      addSys(s, `${p.nick} is offline. Your message will be waiting for them next time they log on to JackNet.`);
      s.w.status.textContent = 'Offline message saved at ' + hhmm();
    } else { addSys(s, `${p.nick} has logged off. Message not sent. (Probably called down for tea.)`); sessHead(s); return; }
    s.ta.value = ''; s.tyOut = 0; addLine(s, 'o', text); histAdd(p.nick, 'o', text);
    s.w.body.querySelector('.so-left').textContent = '300';
    UM.sent++; store.set('jhp_social_sent', UM.sent);
    if (UM.sent >= 20) got('chatter');
    if (/may the force/i.test(text)) got('force');
  }
  Net.onRelay('social.im', (d, msg) => {
    const o = sender(msg); if (!o || !isObj(d) || isIgnored(o) || UM.status === 'off') return;
    const s0 = UM.sessions.get(keyOf(o));
    if (d.k === 'm') { if (!imIn(o.id)) return; const t = clean(d.t, 300); if (t) incoming(o, t); }
    else if (d.k === 'ty') { if (s0 && !s0.w.closed) setTyping(s0, d.on === 1); }
    else if (d.k === 'auto') { const t = clean(d.t, 120); if (t && s0 && !s0.w.closed && imIn(o.id)) addLine(s0, 'a', t); }
    else if (d.k === 'nudge') { if (nudgeIn(o.id)) nudged(o); }
    else if (d.k === 'file') fileOffer(o, d);
    else if (d.k === 'facc' || d.k === 'fdec' || d.k === 'fcan') fileReply(o, d);
  });
  function setTyping(s, on) {
    clearTimeout(s.tyTimer);
    s.w.status.textContent = on ? `${showName(s.peer)} is typing a message...` : 'Ready.';
    s.w.body.querySelector('.so-imhead').classList.toggle('typing', on);
    if (on) s.tyTimer = setTimeout(() => setTyping(s, false), 7000);
  }
  function incoming(o, text, local, offline) {
    let s = UM.sessions.get(keyOf(o));
    const fresh = !s || s.w.closed;
    if (fresh) s = session(o, { quiet: true, min: UM.status !== 'ffc' });
    else if (o.id && s.peer.id !== o.id) { s.peer = o; sessHead(s); }
    addLine(s, 'i', text, 0, false, offline); if (!local) histAdd(o.nick, 'i', text);
    setTyping(s, false);
    if (!isTop(s.w)) { flash(s.w); s.unread = 1; renderCL(); }
    if (UM.sound && UM.status !== 'dnd' && UM.status !== 'occ') uhohSound();
    if (UM.status !== 'dnd' && (fresh || !isTop(s.w))) Desk.toast('Uh-Oh! ' + showName(o), text.length > 70 ? text.slice(0, 70) + '...' : text, 4500);
    if (!offline && o.id > 0 && ['away', 'na', 'occ', 'dnd'].includes(UM.status) && autoOut(o.id)) Net.relay(o.id, 'social.im', { k: 'auto', t: awayMsg() });
    got('uhoh');
  }

  // ---- nudges
  function shake(w, big) { if (!w || w.closed) return; w.el.classList.remove('so-shake', 'so-shake2'); void w.el.offsetWidth; w.el.classList.add(big ? 'so-shake' : 'so-shake2'); setTimeout(() => w.el.classList.remove('so-shake', 'so-shake2'), 900); }
  function nudge(s) {
    if (!Net.me.member) return mgate('Nudging people on Uh-Oh!', () => { if (!s.w.closed) nudge(s); });
    const p = s.peer, l = liveOf(p);
    if (!l) { addSys(s, `${p.nick} isn't online. You nudge an empty chair.`); return; }
    if (!nudgeOut('me')) { addSys(s, 'You can only nudge once every 10 seconds. Be nice!'); return; }
    if (!Net.relay(l.id, 'social.im', { k: 'nudge' })) { addSys(s, 'Nudge failed: not connected to JackNet.'); return; }
    addSys(s, `*** You nudged ${showName(p)}! ***`); shake(s.w); got('nudge');
  }
  function nudged(o) {
    let s = UM.sessions.get(keyOf(o));
    if (!s || s.w.closed) s = session(o, { quiet: true, min: UM.status === 'dnd' });
    addSys(s, `*** ${showName(o)} sent you a NUDGE! ***`);
    if (UM.status === 'dnd') { flash(s.w); s.unread = 1; renderCL(); return; }
    s.w.restore(); unflash(s); shake(s.w, true); if (UM.sound) buzzSound();
    got('nudged');
  }

  // ---- the occasional bits (file transfer, User Info, Add/Find Users, history, away messages, ignore list) live in js/social-im.js
  let IMX = null, imxQ = null;
  function imx(fn) {
    if (IMX) return fn(IMX);
    if (!imxQ) { imxQ = []; Apps.load('js/social-im.js').then(() => { IMX = window.SocialIM({ $, h, esc, store, pick, pad, got, hash, hhmm, d99, clean, isObj, int, okCol, gate, ico, txt, touch, showBrowser, I, LOGO, LOGO16, ENVELOPE, STAT, AWAY_DEF, UM, MEM, MEMNO, ignored, lc, liveOf, stOf, mOf, uinOf, uinText, uinToNo, guestUIN, memberUIN, myUIN, keyOf, contactOf, showName, isTop, isIgnored, whereOf, hist, session, addSys, flash, renderCL, sendStatus, uhohSound, members, addContact, online: () => online, moods: () => MOODS }); const q = imxQ; imxQ = null; q.forEach(f => f(IMX)); }).catch(() => { imxQ = null; Desk.toast('Uh-Oh!', 'That part of Uh-Oh! could not load (the disk drive sneezed). Try again.', 4000); }); }
    imxQ.push(fn);
  }
  const fileMenu = (s, btn) => imx(m => m.fileMenu(s, btn)), fileOffer = (o, d) => imx(m => m.fileOffer(o, d)), fileReply = (o, d) => imx(m => m.fileReply(o, d));
  const userInfo = p => imx(m => m.userInfo(p)), findUser = () => imx(m => m.findUser()), showHistory = n => imx(m => m.showHistory(n)), editAway = () => imx(m => m.editAway()), ignoreList = () => imx(m => m.ignoreList());

  // ---- auto-away when idle
  let lastAct = Date.now();
  const IDLE = (+((location.search.match(/[?&]socialidle=(\d+)/) || [])[1]) || 300) * 1000;
  ['pointerdown', 'keydown', 'wheel'].forEach(t => document.addEventListener(t, () => activity(), { passive: true, capture: true }));
  let mvT = 0; document.addEventListener('pointermove', () => { const n = Date.now(); if (n - mvT > 2000) { mvT = n; activity(); } }, { passive: true });
  function activity() {
    lastAct = Date.now();
    if (UM.auto) { const back = UM.auto; UM.auto = null; setStatus(back, true); Desk.toast('Uh-Oh!', `Welcome back! You were auto-away. Status set back to ${STAT[back][0]}.`, 4000); got('autoaway'); }
  }
  setInterval(() => {
    if (!UM.autoAway) return;
    const idle = Date.now() - lastAct;
    if (!UM.auto && (UM.status === 'online' || UM.status === 'ffc') && idle > IDLE) { UM.auto = UM.status; setStatus('away', true); }
    else if (UM.auto && UM.status === 'away' && idle > IDLE * 3) setStatus('na', true);
  }, Math.min(20000, Math.max(1000, IDLE / 4)));

  const README = `UH-OH! MESSENGER 99b
====================

Uh-Oh! lets you send instant messages to anybody on JackNet.
It lives on the right of the screen, and in the system tray
(the little flower by the clock).

YOUR UH-OH! NUMBER
Every JackNet member has their own Uh-Oh! number (it's on your
profile too). Give it to your mates. Guests get a number that
changes every visit, so join JackNet (free!) to keep one.

ADDING PEOPLE
Press Add/Find Users and type a number or a nickname. They get
asked "is it OK?" and appear in your list when they say yes.
Your list only ever has real people in it.

* Double-click someone to send them a message. If they're
  offline, they get it next time they log on.
* Right-click (or press the little arrow) for more: Nudge, Send
  File, Throw a Snowball, User Info and History.
* When a message arrives it goes "uh-oh!" (if your speaker is on)
  and the button on the taskbar flashes.

STATUSES
  Online          Ready to chat
  Free For Chat   VERY ready to chat. Bored, basically.
  Away            Getting a biscuit
  N/A             Gone for ages (in a queue, tidying your room...)
  Occupied        Busy. No uh-oh sound.
  DND             Do Not Disturb. No sounds, no pop-ups.
  Invisible       Nobody can see you. Spooky.

If you don't touch the mouse for 5 minutes you go Away by yourself.

RULES
Be nice. Mom reads the screen sometimes.
If someone is being a pain, right-click them and pick Ignore User.

Your UIN (Uh-Oh! Number) is yours forever. Well, for this computer.
`;

  // ================================================================ 2. SNOWBALLS, PAPER AEROPLANES AND BLOBBITS
  const Throw = (() => {
    const KINDS = { snow: ['Snowball', I.snow], plane: ['Paper aeroplane', I.plane], squig: ['Blobbit', I.squig] };
    const outGate = gate(1, 4000), inGate = gate(1, 2500);
    let active = 0, accept = store.get('jhp_social_catch', true);
    const SPLAT = '<svg viewBox="0 0 80 80"><path d="M40 8c6 0 7 10 13 9s9-7 13-2-4 10 0 15 12 4 11 10-10 4-11 10 6 12 1 16-9-3-14 1-4 12-12 12-6-10-12-11-9 7-13 3 3-10-1-14-12-2-13-8 9-6 9-12-8-9-4-13 10 2 14-2 0-14 7-14z" fill="#fff" stroke="#b8c8dc" stroke-width="2"/><circle cx="34" cy="34" r="6" fill="#eef4ff"/><circle cx="50" cy="46" r="4" fill="#dde8f6"/><path d="M30 64v10M46 66v8M56 60v6" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';
    function topWindow() {
      let best = null, bz = -1;
      document.querySelectorAll('.appwin, .win.float').forEach(el => {
        if (el.style.display === 'none' || !el.offsetWidth || el.closest('.so-paper')) return;
        const z = +el.style.zIndex || 0; if (z > bz) { bz = z; best = el; }
      });
      if (!best) { const br = $('browser'); if (br && !br.classList.contains('min') && br.offsetWidth) best = br; }
      return best;
    }
    function fly(svg, from, to, ms, opts, done) {
      const el = h('div', 'so-proj' + (opts.cls ? ' ' + opts.cls : ''), svg);
      DesktopSurface.root().appendChild(el);
      const t0 = performance.now(), arc = opts.arc || 120;
      const step = now => {
        const t = Math.min(1, (now - t0) / ms), e = opts.ease ? 1 - Math.pow(1 - t, 2) : t;
        const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * arc + (opts.wobble ? Math.sin(t * 14) * 14 : 0);
        const sc = opts.grow ? 0.35 + t * (opts.grow - 0.35) : 1;
        let rot = 0;
        if (opts.turn) { const dx = to.x - from.x, dy = (to.y - from.y) - Math.cos(Math.PI * t) * Math.PI * arc; rot = Math.atan2(dy, dx) * 180 / Math.PI + (opts.wobble ? Math.sin(t * 14) * 10 : 0); }
        else if (opts.spin) rot = t * opts.spin;
        el.style.transform = `translate(${x - 24}px,${y - 24}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        if (t < 1) requestAnimationFrame(step); else { el.remove(); done && done(); }
      };
      requestAnimationFrame(step);
    }
    function edgePoint() {
      const s = Math.floor(Math.random() * 3);
      return s === 0 ? { x: -40, y: rnd(40, DesktopSurface.height() * 0.6) } : s === 1 ? { x: DesktopSurface.width() + 40, y: rnd(40, DesktopSurface.height() * 0.6) } : { x: rnd(0, DesktopSurface.width()), y: DesktopSurface.height() + 30 };
    }
    function land(o, kind, text) {
      if (active >= 5) return; active++;
      const win = topWindow(), r = win ? DesktopSurface.rect(win) : { left: 80, top: 80, width: DesktopSurface.width() - 160, height: DesktopSurface.height() - 200 };
      const to = { x: Math.max(30, Math.min(DesktopSurface.width() - 30, r.left + r.width * rnd(0.25, 0.75))), y: Math.max(30, Math.min(DesktopSurface.height() - 70, r.top + Math.min(r.height - 20, r.height * rnd(0.2, 0.55)))) };
      const from = edgePoint(), ms = reduced() ? 300 : kind === 'plane' ? 2200 : kind === 'squig' ? 1300 : 900;
      fly(KINDS[kind][1], from, to, ms, kind === 'plane' ? { turn: 1, wobble: 1, arc: 60, cls: 'so-big' } : kind === 'snow' ? { grow: 1.4, arc: 140, spin: 200 } : { arc: 200, spin: 720 }, () => {
        const host = win && DesktopSurface.root().contains(win) ? win : DesktopSurface.root();
        const hr = host === DesktopSurface.root() ? { left: 0, top: 0 } : DesktopSurface.rect(host);
        const at = (el, w2, h2) => { el.style.left = (to.x - hr.left - w2 / 2) + 'px'; el.style.top = (to.y - hr.top - h2 / 2) + 'px'; if (host === DesktopSurface.root()) el.style.position = 'fixed'; host.appendChild(el); };
        if (win && win.classList) { win.classList.remove('so-hit'); void win.offsetWidth; win.classList.add('so-hit'); setTimeout(() => win.classList.remove('so-hit'), 500); }
        if (kind === 'snow') {
          play('thud'); note(1400, 0.05, 'triangle', 30);
          const sp = h('div', 'so-splat', SPLAT); at(sp, 80, 80);
          setTimeout(() => sp.classList.add('melt'), 6000); setTimeout(() => sp.remove(), 8500);
          hitNote(o, 'SPLAT! ' + o.nick + ' got you with a snowball!', to, 'snow');
          got('snowhit');
          active--;
        } else if (kind === 'squig') {
          play('boing');
          const sq = h('div', 'so-squigland', I.squig); at(sq, 48, 48);
          setTimeout(() => { sq.classList.add('chomp'); note(220, 0.06, 'square'); note(180, 0.06, 'square', 160); note(220, 0.06, 'square', 320); }, 300);
          setTimeout(() => { sq.classList.add('gone'); }, 3600); setTimeout(() => { sq.remove(); active--; }, 4300);
          hitNote(o, `A Blobbit from ${o.nick}! It's bouncing on your window.`, to, 'squig');
          got('squighit');
        } else {
          play('click');
          const pl = h('button', 'so-planeland', I.plane); pl.type = 'button'; pl.title = 'Paper aeroplane from ' + o.nick + ' (click to unfold)'; pl.setAttribute('aria-label', pl.title); at(pl, 48, 48);
          const kill = setTimeout(() => { pl.remove(); active--; }, 90000);
          pl.addEventListener('click', () => { clearTimeout(kill); pl.remove(); active--; unfold(o, text); });
          Desk.toast('Paper aeroplane!', `${o.nick} threw a paper aeroplane at you. Click it to unfold it!`, 4500);
        }
      });
    }
    function hitNote(o, text, at, kind) {
      const n = h('div', 'so-hitnote');
      n.innerHTML = '<span></span>';
      n.firstChild.textContent = text;
      if (o.id > 0 && who(o.id)) { const b = h('button', 'btn so-sm', 'Throw one back!'); b.type = 'button'; b.addEventListener('click', () => { n.remove(); send(o, kind); }); n.appendChild(b); }
      n.style.left = Math.max(4, Math.min(DesktopSurface.width() - 230, at.x - 110)) + 'px';
      n.style.top = Math.max(4, Math.min(DesktopSurface.height() - 110, at.y + 46)) + 'px';
      DesktopSurface.root().appendChild(n);
      setTimeout(() => n.classList.add('fade'), 6500); setTimeout(() => n.remove(), 7300);
    }
    function unfold(o, text) {
      got('plane');
      const b = h('div', 'so-paper');
      b.innerHTML = `<div class="so-lined"><div class="so-pfrom">From: <b></b></div><div class="so-ptext"></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"></div>`;
      b.querySelector('b').textContent = o.nick; b.querySelector('.so-ptext').textContent = text || '(It\'s blank. Just a plane. Whee!)';
      const w = Apps.win('Paper Aeroplane', b, { w: 300, icon: I.plane, noResize: true, noMax: true, escClose: true });
      const row = b.querySelector('.row');
      if (o.id > 0 && who(o.id)) { const back = h('button', 'btn', 'Throw one back...'); back.type = 'button'; back.addEventListener('click', () => { w.close(); dialog(o, 'plane'); }); row.appendChild(back); }
      const bin = h('button', 'btn', 'Bin it'); bin.type = 'button'; bin.addEventListener('click', w.close); row.appendChild(bin);
    }
    function launch(kind) { // your own throw leaves the screen
      const from = { x: DesktopSurface.width() / 2 + rnd(-60, 60), y: DesktopSurface.height() - 50 }, to = { x: from.x + rnd(-200, 200), y: -60 };
      fly(KINDS[kind][1], from, to, reduced() ? 250 : 700, kind === 'plane' ? { turn: 1, arc: 30 } : { grow: 0.5, arc: 40, spin: 300 });
    }
    function send(p, kind, text) {
      if (!KINDS[kind]) return;
      if (!p) return dialog(null, kind);
      if (!outGate('me')) return Desk.toast('Whoa there!', 'Your arm is tired. Wait a few seconds before throwing again.', 2500);
      if (p === 'self') { // nobody else about: what goes up...
        launch(kind); got('snowthrow');
        setTimeout(() => { land({ id: 0, nick: 'gravity' }, kind, kind === 'plane' ? clean(text, 80) || 'You threw this at yourself. Well done.' : ''); got('selfsnow'); }, 1800);
        return;
      }
      if (!who(p.id)) return Desk.msgbox('Throw', `${p.nick} has logged off. Your ${KINDS[kind][0].toLowerCase()} lands in the hedge.`, 'warn');
      const m = kind === 'plane' ? clean(text, 80) : '';
      if (m && !Net.me.member) return mgate('Writing notes on paper aeroplanes', () => send(p, kind, text));
      if (!Net.relay(p.id, 'social.throw', { k: kind, m })) return Desk.msgbox('Throw', 'Not connected to JackNet. (Is someone on the phone?)', 'warn');
      launch(kind); got('snowthrow'); Net.kv.inc('social.thrown');
      Desk.toast(KINDS[kind][0] + ' away!', `You threw a ${KINDS[kind][0].toLowerCase()} at ${p.nick}. It's flying across JackNet...`, 2500);
    }
    Net.onRelay('social.throw', (d, msg) => {
      const o = sender(msg);
      if (!o || !isObj(d) || !KINDS[d.k] || isIgnored(o) || !accept || UM.status === 'dnd' || !inGate(o.id)) return;
      land(o, d.k, d.k === 'plane' ? clean(d.m, 80) : '');
    });
    function dialog(target, kind) {
      const f = h('form', 'so-throw');
      const list = others().filter(o => !isIgnored(o));
      f.innerHTML = `<div class="so-trow">${ico(I.snow, 32)}<div>Pick a target, pick something to throw, and let fly! It lands on whatever window they've got open.</div></div>
        <div class="row" style="flex-wrap:nowrap;margin-top:8px"><label style="width:52px">Target:</label><select style="flex:1;min-width:0" aria-label="Target">${list.length ? list.map(o => `<option value="${o.id}">\\\\${esc(o.nick)}</option>`).join('') : '<option value="self">(nobody else is here) Straight up in the air!</option>'}</select></div>
        <fieldset class="group"><legend>Throw a...</legend>${Object.keys(KINDS).map(k => `<label class="so-kind"><input type="radio" name="k" value="${k}"${k === (kind || 'snow') ? ' checked' : ''}> ${ico(KINDS[k][1], 24)} ${KINDS[k][0]}</label>`).join('')}
        <input type="text" maxlength="80" class="so-tmsg" placeholder="Write a message on the plane (80 letters)" aria-label="Message for the paper aeroplane"></fieldset>
        <label class="small"><input type="checkbox" class="so-acc"${accept ? ' checked' : ''}> Let people throw things at me</label>
        <div class="small so-tcount">Things thrown across JackNet so far: ...</div>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="submit"><b>Throw!</b></button><button class="btn" type="button">Close</button></div>`;
      const w = Apps.win('Snowball Fight', f, { w: 340, icon: I.snow, noResize: true, noMax: true, escClose: true });
      const sel = f.querySelector('select'), msgI = f.querySelector('.so-tmsg');
      if (target) sel.value = String(target.id);
      const sync = () => { msgI.style.display = f.querySelector('input[name=k]:checked').value === 'plane' ? '' : 'none'; };
      f.querySelectorAll('input[name=k]').forEach(r => r.addEventListener('change', sync)); sync();
      f.querySelector('.so-acc').addEventListener('change', e => { accept = e.target.checked; store.set('jhp_social_catch', accept); });
      f.querySelector('button[type=button]').addEventListener('click', w.close);
      const cnt = f.querySelector('.so-tcount'), showN = v => { cnt.textContent = 'Things thrown across JackNet so far: ' + (typeof v === 'number' ? v.toLocaleString('en-GB') : '0'); };
      Net.kv.get(['social.thrown']).then(v => showN(v['social.thrown']));
      const unw = Net.kv.watch('social.thrown', ev => { if (w.closed) unw(); else if (ev.type === 'set') showN(ev.v); });
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const k = f.querySelector('input[name=k]:checked').value, p = sel.value === 'self' ? 'self' : who(+sel.value);
        if (!p) return Desk.msgbox('Throw', 'They have logged off. Pick someone else!', 'warn');
        send(p, k, msgI.value); if (k === 'plane') msgI.value = '';
      });
      return w;
    }
    return { send, dialog, land };
  })();


  // ================================================================ 7. TIME CAPSULE + MESSAGES IN BOTTLES
  const CAPSULE = (() => {
    const KEY = 'social.capsule';
    function open() {
      const b = h('div', 'so-cap');
      b.innerHTML = `<div class="so-caprow">${ico(I.capsule, 48)}<div><b>JackNet Time Capsule</b><div class="small">Buried under the desktop. Whoever digs it up next reads the last message and leaves one of their own.</div></div></div>
        <div class="field so-capmsg">Digging...</div>
        <form class="so-capform"><textarea maxlength="200" rows="3" placeholder="Write a message for the NEXT person to open the capsule... (200 letters)" aria-label="Your message"></textarea>
        <div class="row" style="justify-content:space-between;align-items:center"><span class="small so-left">200</span><span><button class="btn" type="button">Close</button> <button class="btn" type="submit"><b>Bury it</b></button></span></div></form>`;
      const w = Apps.win('Time Capsule', b, { w: 400, icon: I.capsule, noResize: true, noMax: true, escClose: true });
      const ta = b.querySelector('textarea'), msg = b.querySelector('.so-capmsg');
      ta.addEventListener('input', () => { b.querySelector('.so-left').textContent = 200 - ta.value.length; });
      b.querySelector('button[type=button]').addEventListener('click', w.close);
      Net.kv.get([KEY, 'social.capcount']).then(v => {
        const list = Array.isArray(v[KEY]) ? v[KEY] : [], last = list.length ? list[list.length - 1] : null, n = v['social.capcount'] | 0;
        if (!last || !isObj(last)) { msg.innerHTML = '<i>The capsule is empty! Nobody has buried anything yet. You get to go first. No pressure.</i>'; }
        else {
          msg.innerHTML = `<div class="so-capfrom">Buried by <b style="color:${okCol(last.col)}"></b> <span></span>${n ? ` &middot; opened ${n} time${n === 1 ? '' : 's'}` : ''}</div><div class="so-captext"></div>${list.length > 1 ? `<details class="so-capold"><summary>${list.length - 1} older message(s) found deeper down...</summary>${list.slice(0, -1).reverse().map(e => isObj(e) ? `<div><b style="color:${okCol(e.col)}">${esc(clean(e.by, 20))}</b> <small>${esc(ago(int(e.ts, 0, 9e15) ? e.ts : Date.now()))}</small>: ${esc(clean(e.text, 200))}</div>` : '').join('')}</details>` : ''}`;
          msg.querySelector('b').textContent = clean(last.by, 20) || 'Somebody'; msg.querySelector('span').textContent = ago(int(last.ts, 0, 9e15) ? last.ts : Date.now()); msg.querySelector('.so-captext').textContent = clean(last.text, 200);
          got('capsule');
        }
        Net.kv.inc('social.capcount');
      });
      b.querySelector('form').addEventListener('submit', ev => {
        ev.preventDefault(); const t = clean(ta.value, 200); if (!t) return;
        if (!Net.kv.push(KEY, t)) return Desk.msgbox('Time Capsule', 'Not connected to JackNet. The shovel is broken.', 'warn');
        got('capbury'); w.close(); play('thud');
        Desk.toast('Time Capsule', 'Buried! The next person to dig it up will read your message.', 4500);
      });
      return w;
    }
    // bottles: Net.kv.push('social.bottles'); every so often one washes up on somebody's desktop
    let bottleT = 0, shown = store.get('jhp_social_bottles', 0);
    function throwBottle() {
      if (!Net.me.member) return mgate('Throwing a message in a bottle', throwBottle);
      Desk.ask('Message in a Bottle', 'Write a note, cork it, and chuck it in the sea. It will wash up on a random visitor\'s desktop one day.', '', 120, v => {
        const t = clean(v, 120); if (!t) return;
        if (!Net.kv.push('social.bottles', t)) return Desk.msgbox('Bottle', 'The sea is not connected. (No JackNet.)', 'warn');
        got('bottlethrow'); play('boing'); Desk.toast('Message in a Bottle', 'Splash! Your bottle is floating around JackNet.', 4000);
        const o = pick(others().filter(x => !isIgnored(x))); if (o) setTimeout(() => Net.relay(o.id, 'social.bottle', { k: 'b', t }), ri(3000, 9000));
      });
    }
    const bottleIn = gate(1, 30000);
    Net.onRelay('social.bottle', (d, msg) => { const o = sender(msg); if (!o || !isObj(d) || d.k !== 'b' || isIgnored(o) || !bottleIn(o.id)) return; const t = clean(d.t, 120); if (t) washUp(false, { by: o.nick, text: t, ts: Date.now() }); });
    function washUp(force, given) {
      (given ? Promise.resolve({ 'social.bottles': [given] }) : Net.kv.get(['social.bottles'])).then(v => {
        const list = (Array.isArray(v['social.bottles']) ? v['social.bottles'] : []).filter(isObj);
        if (!list.length) { if (force) Desk.msgbox('The Beach', 'You wait by the sea. Nothing washes up except a shoe. Throw a bottle in yourself!', 'info'); return; }
        if (document.querySelectorAll('.so-bottle').length >= 3) return;
        const e = pick(list);
        const el = h('button', 'so-bottle', I.bottle); el.type = 'button'; el.title = 'A bottle has washed up! Click to open it.'; el.setAttribute('aria-label', el.title);
        el.style.left = rnd(100, Math.max(120, DesktopSurface.width() - 80)) + 'px';
        DesktopSurface.root().appendChild(el);
        const kill = setTimeout(() => el.remove(), 120000);
        el.addEventListener('click', () => {
          clearTimeout(kill); el.remove(); play('boing'); got('bottle'); shown++; store.set('jhp_social_bottles', shown);
          const b = h('div', 'so-paper');
          b.innerHTML = `<div class="so-lined"><div class="so-pfrom">A soggy note from <b></b>, thrown in <span></span>:</div><div class="so-ptext"></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-x="reply">Throw one back in</button><button class="btn" type="button" data-x="ok">Put it back</button></div>`;
          b.querySelector('b').textContent = clean(e.by, 20) || 'Somebody'; b.querySelector('span').textContent = ago(int(e.ts, 0, 9e15) ? e.ts : Date.now()); b.querySelector('.so-ptext').textContent = clean(e.text, 120);
          const w = Apps.win('Message in a Bottle', b, { w: 320, icon: I.bottle, noResize: true, noMax: true, escClose: true });
          b.querySelector('[data-x=ok]').addEventListener('click', w.close);
          b.querySelector('[data-x=reply]').addEventListener('click', () => { w.close(); throwBottle(); });
        });
      });
    }
    function schedule() { clearTimeout(bottleT); bottleT = setTimeout(() => { if (!document.hidden && document.body.contains($('tray'))) washUp(false); schedule(); }, rnd(4, 9) * 60000); }
    return { open, throwBottle, washUp, schedule };
  })();

  // ================================================================ 8. PASS THE PARCEL
  const Parcel = (() => {
    const PRIZES = [
      'There is a hidden page called "webring" in the browser address bar.', 'Type xyzzy into Start > Run. Then type plugh.',
      "Gubbinz has his own computer on the Network. Look for \\\\GUBBINZ.", 'Try searching the hard drive for the word "secret". Nosy.',
      'Type your own Uh-Oh! number into Add/Find Users.', 'Press Ctrl+Alt+Del twice. Go on. Twice.',
      'Try "net send" from Run and message YOURSELF.', 'Stamp WAAAGH on the shared whiteboard in capital letters.',
      'Leave Uh-Oh! alone for 5 minutes and it goes Away by itself. Then come back.', 'Set your Uh-Oh! status to Invisible. Spooky.',
      'Throw a snowball when nobody else is online. What goes up...', 'Move 30 fridge magnets and you become a poet.',
      'Episode One is out on 16 July. Type "podrace" into Start > Run. It might not exist. It might.', "Pin a note that says 'Orks rule' on the corkboard.",
      'Three people listening to JackNet Radio at the same time unlocks something.', 'Bury something in the Time Capsule for the next person.',
      "Jack's cousin's band is called The Millennium Bugs. They're on the radio.", 'The parcel can go round the same two people forever. Try it.',
      'Add a JackNet member to your Uh-Oh! list and wait for them to say OK.', 'A message in a bottle washes up every few minutes. Keep an eye on the bottom of the screen.',
      'The sound of a nudge is six notes of pure sawtooth. Ask someone to nudge you.',
    ];
    const MUSIC_MS = () => ri(9000, 18000);
    let cur = null; // the parcel on MY desktop: { layers, hops, el, timer }
    const inGate = gate(3, 10000);
    function start(p) {
      if (cur) return Desk.msgbox('Pass the Parcel', "You've already got the parcel! Pass it on before the music stops.", 'info');
      if (!p) { const list = others().filter(o => !isIgnored(o)); if (!list.length) return Desk.msgbox('Pass the Parcel', "There's nobody else on JackNet to pass a parcel to. Come back when someone turns up!", 'info'); p = pick(list); }
      hold({ layers: ri(3, 6), hops: 0, music: MUSIC_MS(), from: 'you' }, true);
      Desk.toast('Pass the Parcel', 'You wrapped a parcel. The music is playing... pass it before it stops!', 4000);
    }
    Net.onRelay('social.parcel', (d, msg) => {
      const o = sender(msg); if (!o || !isObj(d) || d.k !== 'pass' || isIgnored(o) || !inGate(o.id)) return;
      if (!int(d.l, 1, 8) || !int(d.h, 0, 500) || !int(d.m, 1000, 30000)) return;
      if (cur) { cur.layers = Math.max(cur.layers, d.l); return; }
      hold({ layers: d.l, hops: d.h, music: d.m, from: o.nick }, false);
    });
    function hold(p, mine) {
      cur = p; got(mine ? 'parcelstart' : 'parcel');
      const el = h('div', 'so-parcel', `<div class="so-parbox">${I.parcel}</div><div class="so-parlbl"><b>Pass the Parcel!</b><span></span><i class="so-parmusic"></i></div><div class="so-parbtns"><button class="btn so-sm" type="button" data-x="pass">Pass it on</button><button class="btn so-sm" type="button" data-x="keep">Keep hold</button></div>`);
      el.querySelector('span').textContent = `${p.layers} layer${p.layers === 1 ? '' : 's'} left \u00b7 from ${p.from} \u00b7 ${p.hops} hop${p.hops === 1 ? '' : 's'} so far`;
      el.style.left = Math.max(10, Math.min(DesktopSurface.width() - 230, rnd(120, DesktopSurface.width() - 260))) + 'px';
      DesktopSurface.root().appendChild(el); p.el = el;
      if (!mine) { play('join'); el.classList.add('arrive'); }
      let n = 0; p.music = p.music || MUSIC_MS();
      const notes = [523, 587, 659, 698, 784, 698, 659, 587];
      p.tune = setInterval(() => { note(notes[n++ % notes.length], 0.12, 'square'); el.querySelector('.so-parmusic').textContent = '\u266a'.repeat(1 + n % 3); }, 280);
      p.timer = setTimeout(() => stop(p), p.music);
      el.querySelector('[data-x=pass]').addEventListener('click', () => pass(p));
      el.querySelector('[data-x=keep]').addEventListener('click', () => { el.querySelector('[data-x=keep]').disabled = true; el.querySelector('span').textContent = 'Keeping hold... fingers crossed!'; });
    }
    function pass(p) {
      const list = others().filter(o => !isIgnored(o));
      if (!list.length) { p.el.querySelector('span').textContent = 'Nobody to pass it to! Looks like you are keeping it.'; return; }
      const to = pick(list);
      if (!Net.relay(to.id, 'social.parcel', { k: 'pass', l: p.layers, h: p.hops + 1, m: Math.max(1000, p.music - 1500) })) return;
      clearTimeout(p.timer); clearInterval(p.tune); p.el.remove(); cur = null; play('click');
      Desk.toast('Pass the Parcel', `Passed to ${to.nick}! Phew.`, 2500);
      if (p.hops + 1 >= 10) got('parcel10');
    }
    function stop(p) {
      clearInterval(p.tune); cur = null; play('uhoh');
      p.el.querySelector('.so-parlbl span').textContent = 'THE MUSIC STOPPED!'; p.el.querySelector('.so-parmusic').textContent = '';
      p.el.querySelector('.so-parbtns').innerHTML = '<button class="btn so-sm" type="button"><b>Unwrap a layer!</b></button>';
      p.el.querySelector('button').addEventListener('click', () => {
        p.layers--; p.el.remove(); play('turn');
        if (p.layers > 0) { Desk.msgbox('Pass the Parcel', `You tore off a layer of wrapping paper. ${p.layers} to go! The music starts again...`, 'info', [['OK', () => hold({ layers: p.layers, hops: p.hops, music: MUSIC_MS(), from: 'the last round' }, true)]]); return; }
        got('parcelwin'); play('solve');
        const prize = PRIZES[(p.hops + hash(Net.cid)) % PRIZES.length];
        const b = h('div', 'so-prize'); b.innerHTML = `<div class="so-caprow">${ico(I.parcel, 48)}<div><b>YOU WIN!</b><div>Inside the last layer there is a scrap of paper. It says:</div></div></div><div class="field so-prizetxt"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">Brilliant</button></div>`;
        b.querySelector('.so-prizetxt').textContent = '"' + prize + '"';
        const w = Apps.win('Pass the Parcel', b, { w: 360, icon: I.parcel, noResize: true, noMax: true, escClose: true });
        b.querySelector('button').addEventListener('click', w.close);
        Net.kv.inc('social.parcelwins');
      });
    }
    return { start };
  })();

  // ---- the bigger programs live in js/social-more.js and load on first use
  let MORE = null;
  const WB_HELP = `JACKNET WHITEBOARD
==================

One big drawing board, shared by EVERYBODY on JackNet.
When someone else is drawing you'll see their arrow with their
name on it, and their lines appear as they draw them.

TOOLS
  Pencil       1 pixel. For fine work (Pokemon eyes).
  Brush        Thicker. Pick the size underneath.
  Eraser       Rubs out (well, paints white).
  Line         Click, drag, let go.
  Rectangle    Boxes. Filled or not.
  Fill         Pours paint into a shape. Careful!
  Text Stamp   Type a word, click to stamp it. CAPITALS ONLY.

There's no undo and no clear button. Be nice to other people's
pictures. Draw something brilliant.
`;
  const X = { WB_HELP, $, h, esc, store, rnd, pick, pad, play, note, got, hash, seeded, hhmm, d99, ago, clean, isObj, int, okCol, gate, room, who, onlineFns, ico, I, txt };
  function more(which) {
    if (MORE) return MORE[which].open();
    Apps.load('js/social-more.js').then(() => { if (!MORE) MORE = window.SocialMore(X); MORE[which].open(); })
      .catch(() => Desk.msgbox('JackNet Hangout', 'Could not load the program. (The disk drive made a clicking noise.) Try again in a minute.', 'warn'));
  }
  const TUNE_NAMES = [['Dial-Up Dreams', 'The Floppy Disks'], ['56K of Love', 'The Floppy Disks'], ['Red Ones Go Faster', 'The Go-Karts'], ['Pot Noodle (Remix)', 'DJ Pixel'], ['Turn That Down (live)', 'Mom'], ['Fatal Exception 0E', 'The Millennium Bugs'], ['Podrace Pulse', 'The Floppy Disks'], ['Y2K Bunker Boogie', 'The Millennium Bugs']];

  // ================================================================ HANGOUT MENU (the "Throw..." items and friends, no edits to other packs)
  const HANG = [['Uh-Oh! Messenger', 'social.uhoh', LOGO], ['JackNet Whiteboard', 'social.wb', I.board], ['Fridge Magnet Poetry', 'social.fridge', I.fridge], ['The Corkboard', 'social.cork', I.cork], ['JackNet Radio', 'social.radio', I.radio], ['Time Capsule', 'social.capsule', I.capsule], ['Snowball Fight', 'social.throw', I.snow], ['Pass the Parcel', 'social.parcel', I.parcel]];
  function hangout() {
    const b = h('div', 'so-hang');
    const n = others().length;
    b.innerHTML = `<p class="so-hangtop">${n ? `<b>${n}</b> other ${n === 1 ? 'person is' : 'people are'} on JackNet right now.` : 'Nobody else is here right now, but the shared stuff still remembers what everybody did.'}</p><div class="so-hanggrid">${HANG.map(([l, id, i]) => `<button type="button" class="so-hangbtn" data-id="${id}">${ico(i, 32)}<span>${esc(l)}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap"><button class="btn" type="button" data-x="bottle">Throw a Bottle in the Sea</button><button class="btn" type="button" data-x="beach">Wait on the Beach</button></div>`;
    const w = Apps.win('JackNet Hangout', b, { w: 380, icon: I.hang, noResize: true, noMax: true });
    b.addEventListener('click', ev => { const t = ev.target.closest('[data-id]'); if (t) { Apps.open(t.dataset.id); return; } const x = ev.target.closest('[data-x]'); if (x) { if (x.dataset.x === 'bottle') CAPSULE.throwBottle(); else { CAPSULE.washUp(true); got('beach'); } } });
    return w;
  }

  // ================================================================ REGISTER EVERYTHING
  Apps.register('social.uhoh', { single: false, cmd: ['uhoh', 'uh-oh', 'uh-oh!', 'uhoh.exe', 'messenger', 'im'], open: () => { if (UM.status === 'off') setStatus('online'); return openCL(true); } });
  Apps.register('social.wb', { cmd: ['whiteboard', 'wb', 'jacknet whiteboard', 'whitebrd'], open: () => { more('WB'); } });
  Apps.register('social.fridge', { cmd: ['fridge', 'magnets', 'fridge magnets', 'poetry'], open: () => { more('FRIDGE'); } });
  Apps.register('social.cork', { cmd: ['corkboard', 'cork', 'noticeboard', 'notice board', 'pinboard', 'sticky', 'stickies'], open: () => { more('CORK'); } });
  Apps.register('social.radio', { cmd: ['radio', 'jacknet radio', '99.9', 'fm', 'dj'], open: () => { more('RADIO'); } });
  Apps.register('social.capsule', { single: false, cmd: ['capsule', 'time capsule', 'timecapsule', 'dig'], open: CAPSULE.open });
  Apps.register('social.throw', { single: false, cmd: ['throw', 'snowball', 'snowballs', 'snowball fight', 'paper plane', 'paper aeroplane', 'aeroplane'], open: () => Throw.dialog() });
  Apps.register('social.parcel', { single: false, cmd: ['parcel', 'pass the parcel', 'hot potato', 'potato'], open: () => { Parcel.start(); return null; } });
  Apps.register('social.hang', { single: true, cmd: ['hangout', 'hang', 'social', 'people', 'jacknet hangout'], open: hangout });
  Apps.cmd(['bottle', 'message in a bottle', 'sos'], () => CAPSULE.throwBottle());
  Apps.cmd(['beach', 'seaside', 'sea'], () => { CAPSULE.washUp(true); got('beach'); });
  Apps.cmd(['nudge', 'buzz'], () => { openCL(true); Desk.toast('Uh-Oh!', 'Nudge who? Double-click someone in your contact list, then press Nudge!', 4000); });
  Apps.cmd(['podrace', 'pod race', 'podracer'], () => { got('podrace'); Apps.open('social.radio'); Desk.toast('JackNet Radio', 'Now you\'ve done it. Requesting "Podrace Pulse"... (it plays when the schedule says so, this is RADIO)', 5000); Net.kv.put('social.radioreq', 't6', String(1 + Math.floor(Math.random() * 3))); });
  Apps.cmd(['away', 'brb'], () => setStatus('away')); Apps.cmd(['dnd', 'do not disturb'], () => setStatus('dnd')); Apps.cmd(['invisible', 'ghost mode'], () => setStatus('inv'));
  Apps.cmd(['uin', 'my uin', 'uh-oh number'], () => Desk.msgbox('Uh-Oh!', Net.me.member ? `Your Uh-Oh! number is ${myUIN()}.\n\nWrite it on your pencil case so your mates can add you.` : `You're a guest, so your Uh-Oh! number (${myUIN()}) changes every visit. Join JackNet to get your own!`, 'info'));

  { const ic = Apps.desktopIcon('Uh-Oh!', LOGO, () => Apps.open('social.uhoh'), 'iconUhOh'); const box = ic.parentNode; if (box && box.children[1]) box.insertBefore(ic, box.children[1]); } // first column, near the top
  Apps.desktopIcon('JackNet Hangout', I.hang, () => Apps.open('social.hang'), 'iconHangout');
  Apps.desktopIcon('Snowball Fight', I.snow, () => Apps.open('social.throw'), 'iconSnowball');
  Apps.addProgram(['Accessories', 'Communications', 'Uh-Oh! Messenger'], 'social.uhoh', LOGO);
  Apps.addProgram(['Accessories', 'Communications', 'JackNet Whiteboard'], 'social.wb', I.board);
  Apps.addProgram(['Accessories', 'Communications', 'JackNet Radio'], 'social.radio', I.radio);
  Apps.addProgram(['JackNet Hangout', 'JackNet Hangout'], 'social.hang', I.hang);
  Apps.addProgram(['JackNet Hangout', 'Fridge Magnet Poetry'], 'social.fridge', I.fridge);
  Apps.addProgram(['JackNet Hangout', 'The Corkboard'], 'social.cork', I.cork);
  Apps.addProgram(['JackNet Hangout', 'Time Capsule'], 'social.capsule', I.capsule);
  Apps.addProgram(['JackNet Hangout', 'Snowball Fight'], 'social.throw', I.snow);
  Apps.addProgram(['JackNet Hangout', 'Pass the Parcel'], 'social.parcel', I.parcel);
  Apps.addProgram(['JackNet Hangout', 'Message in a Bottle'], () => CAPSULE.throwBottle(), I.bottle);

  // files on C:
  Apps.fs.add('C:/Program Files/Uh-Oh', { name: 'UHOH.EXE', type: 'exe', app: 'social.uhoh', date: '03/05/99', size: '1,204 KB' });
  Apps.fs.add('C:/Program Files/Uh-Oh', { name: 'README.TXT', type: 'txt', date: '03/05/99', size: '2 KB', text: README });
  Apps.fs.add('C:/Program Files/Uh-Oh', { name: 'UHOH.WAV', type: 'txt', date: '03/05/99', size: '11 KB', text: 'uh-oh!\n\n(That\'s it. That\'s the whole file. Two notes going down.)\n' });
  Apps.fs.add('C:/Program Files/Uh-Oh', { name: 'NUMBERS.TXT', type: 'txt', date: '03/05/99', size: '1 KB', text: 'HOW UH-OH! NUMBERS WORK\n\nEvery JackNet member gets their own Uh-Oh! number. It never changes.\nIt is worked out from your member number:\n\n    Uh-Oh! number = 1999000 + (member number x 37)\n\nSo member #1 is 1999037, member #2 is 1999074, and so on.\nGuests get a number too, but it changes every visit, so nobody can add them.\n\nYour contact list only has REAL people in it: the ones you added, who said OK.\n' });
  Apps.fs.add('C:/Program Files/JackNet Whiteboard', { name: 'WHITEBRD.EXE', type: 'exe', app: 'social.wb', date: '12/06/99', size: '388 KB' });
  Apps.fs.add('C:/Program Files/JackNet Whiteboard', { name: 'HELP.TXT', type: 'txt', date: '12/06/99', size: '1 KB', text: WB_HELP });
  Apps.fs.add('C:/Program Files/JackNet Radio', { name: 'RADIO.EXE', type: 'exe', app: 'social.radio', date: '01/07/99', size: '640 KB' });
  Apps.fs.add('C:/Program Files/JackNet Radio', { name: 'PLAYLIST.TXT', type: 'txt', date: '01/07/99', size: '1 KB', text: 'JACKNET RADIO 99.9 FM - THE PLAYLIST\n=====================================\n\n' + TUNE_NAMES.map((t, i) => `${i + 1}. ${t[0]} - ${t[1]}`).join('\n') + '\n\nAll eight tunes, all day, in a different order every few hours.\nEverybody hears the same tune at the same time, because it is RADIO.\nThat is how radio works. Dave did not believe me.\n\nThe DJ bit about Episode One is new. It is out on 16 July. We are going.\n' });
  Apps.fs.add('C:/My Documents', { name: 'parcel rules.txt', type: 'txt', date: '20/03/99', size: '1 KB', text: 'PASS THE PARCEL (JackNet rules)\n\n1. Someone wraps a parcel (Start > Programs > JackNet Hangout).\n2. It appears on somebody\'s desktop. Music plays.\n3. Pass it on! It jumps to another random person on JackNet.\n4. When the music stops, whoever has it unwraps ONE layer.\n5. Last layer = a prize. The prize is a SECRET HINT.\n\nHouse rule: Dave is not allowed to keep hold on purpose.\nDave keeps hold on purpose.\n' });
  Apps.fs.add('C:/My Documents', { name: 'fridge rules.txt', type: 'txt', date: '08/02/99', size: '1 KB', text: "FRIDGE RULES (Mom's)\n\n- No swearing on the fridge\n- No moving the shopping list magnet (it's the one that says 'milk')\n- Your cousin is NOT allowed to spell things with the magnets again\n- If the fridge hums, kick it. Gently. Once.\n\n(The fridge on this computer is on JackNet. Everybody shares it. Mom doesn't know.)\n" });
  Apps.fs.dir('C:/My Documents/Received Files');

  // secrets
  S('uhoh', 'Uh-oh!', 'Receive an instant message');
  S('chatter', 'Chatterbox', 'Send twenty instant messages');
  S('nudge', 'Nudge nudge', 'Give someone a shove');
  S('nudged', 'Wink wink', 'Get shoved back');
  S('file', 'Sneakernet is dead', 'Finish a file transfer over the modem');
  S('invisible', 'Now you see me', 'Go where nobody can see you');
  S('autoaway', 'Back from the biscuit tin', 'Leave the computer alone for a while, then come back');
  S('add', 'Making friends', 'Ask somebody if you can add them to your Uh-Oh! list');
  S('authok', 'Authorised', 'Somebody says OK to your Uh-Oh! request');
  S('offline', 'You\'ve got messages', 'Log on to find Uh-Oh! messages that were sent while you were away');
  S('findme', 'Mirror, mirror', 'Look yourself up by your own Uh-Oh! number');
  S('force', 'Hokey religion', 'Say the famous four words in a message');
  S('snowthrow', 'Snowball!', 'Throw something at somebody on JackNet');
  S('snowhit', 'SPLAT', 'Get hit by a snowball');
  S('plane', 'Air mail', 'Unfold a paper aeroplane');
  S('squighit', 'Blobbit attack', 'Have a Blobbit land on your window');
  S('selfsnow', 'What goes up', 'Throw a snowball when there is nobody else to throw it at');
  S('wbdraw', 'Collaborative masterpiece', 'Draw on the whiteboard while someone else is drawing');
  S('wbtext', 'Graffiti', 'Stamp the Ork war cry on the whiteboard');
  S('fridgepoet', 'Fridge poet', 'Move a lot of magnets');
  S('fridgelive', 'Poltergeist', 'Watch a magnet move by itself');
  S('fridgeread', 'Poetry corner', 'Make the fridge read itself aloud');
  S('corkpin', 'Pinned', 'Pin a note on the corkboard');
  S('corkork', 'Green propaganda', 'Pin something about Orks');
  S('radio', 'On air', 'Switch the radio on');
  S('radio3', 'Mass audience', 'Three people listening to the radio at once');
  S('radioreq', 'Request line', 'Ask the DJ for a tune');
  S('radioep1', 'Episode hype', 'Hear the DJ talk about the big film');
  S('podrace', 'Now THIS is racing', 'There is a Run command about a race on a desert planet');
  S('capsule', 'Dug up', 'Open the time capsule');
  S('capbury', 'Buried treasure', 'Leave something in the time capsule');
  S('bottle', 'Washed up', 'Open a bottle that washes up on the desktop');
  S('bottlethrow', 'SOS', 'Throw a message into the sea');
  S('beach', 'Beachcomber', 'Wait on the beach');
  S('parcel', 'Hot potato', 'Receive the parcel');
  S('parcelstart', 'Wrapped up', 'Start a game of pass the parcel');
  S('parcel10', 'Round and round', 'Pass a parcel that has done ten hops');
  S('parcelwin', 'Last layer', 'Unwrap the final layer');
  S('uhohweb', 'Download now!', 'The messenger has its own home page. Type its name in the address bar');

  // hidden web page
  if (window.IE && IE.addPage) IE.addPage('uhoh', 'Uh-Oh! Messenger - Download', () => {
    got('uhohweb');
    const d = h('div', 'secretpage so-page');
    d.innerHTML = `<h2>${ico(LOGO, 48)} Uh-Oh! Messenger 99b</h2><p><b>The instant messenger that goes "uh-oh!"</b></p><p>${window.Setup && !Setup.has('uhoh') ? 'Not on this computer yet: click <b>Download now!</b> at the top of the page. It\'s FREE.' : 'Already installed on this computer (look in the system tray, by the clock).'} ${online.length} people are on the Uh-Oh! network right now.</p>
      <ul><li>Instant messages to anybody on JackNet</li><li>Statuses: Online, Away, N/A, Occupied, DND, Free For Chat, Invisible</li><li>Nudges (they shake the other person's window!)</li><li>Send files over the modem (slowly)</li><li>Snowballs, paper aeroplanes and Blobbits</li></ul>
      <p><button class="btn" type="button">Open Uh-Oh! now</button> <small>1,204 KB. Download time at 56K: about 4 minutes. Already done, you're welcome.</small></p><p class="small">System requirements: JackOS 98, a modem, a friend.</p>`;
    d.querySelector('button').addEventListener('click', () => Apps.open('social.uhoh'));
    return d;
  });

  // ================================================================ 9. JACKIRC: the chat room moved off the website and onto IRC. The client is js/social-irc.js.
  const IRC_ICON = '<svg viewBox="0 0 32 32"><path d="M14 3h15v11h-4v4l-5-4h-6z" fill="#00e5ff" stroke="#000"/><path d="M2 9h18v13H10l-5 5v-5H2z" fill="#ffd400" stroke="#000"/><path d="M8 12l-1.4 8M12.6 12l-1.4 8M5.6 14.5h9M5 17.6h9" stroke="#009300" stroke-width="1.8"/><path d="M20 6h6M20 9h4" stroke="#000080" stroke-width="1.2"/></svg>';
  const CHAT = [];
  Net.on('welcome', m => { CHAT.length = 0; (Array.isArray(m.chat) ? m.chat : []).slice(-60).forEach(c => CHAT.push(c)); });
  Net.on('chat', m => { if (m && m.m) { CHAT.push(m.m); if (CHAT.length > 60) CHAT.shift(); } });
  Net.on('chatClear', () => { CHAT.length = 0; });
  const imTo = (p, text) => { const s = session(p); s.ta.value = String(text).slice(0, 300); sendIM(s); return s; };
  const ircInstalled = () => !!store.get('jhp_irc_inst', false);
  let IRC = null, ircIcon = null;
  function ircFiles() {
    Apps.fs.add('C:/Program Files/JackIRC', { name: 'JACKIRC.EXE', type: 'exe', app: 'social.irc', date: '04/08/99', size: '612 KB' });
    Apps.fs.add('C:/Program Files/JackIRC', { name: 'JACKIRC.INI', type: 'txt', date: d99(), size: '1 KB', text: `[jackirc]\nserver=${'irc.jacknet.jnet'}:6667\nnick=${Net.me.nick || 'Guest'}\nautojoin=#jackattack\nfont=Fixedsys-ish\nsounds=on\n\n[secret]\n; Gubbinz says dere is no secret channel. Gubbinz says a lot of fings.\n` });
    Apps.fs.add('C:/Program Files/JackIRC', { name: 'README.TXT', type: 'txt', date: '04/08/99', size: '3 KB', text: IRC_README });
    Apps.fs.dir('C:/Program Files/JackIRC/logs');
  }
  function ircInstall() {
    if (!ircInstalled()) { store.set('jhp_irc_inst', true); Desk.toast('JackIRC', 'JackIRC has been installed. Look for it on the desktop and in Start > Programs > Internet.', 5000); }
    if (!ircIcon) ircIcon = Apps.desktopIcon('JackIRC', IRC_ICON, () => Apps.open('social.irc'), 'iconJackIRC');
    ircFiles(); wireChatPage();
  }
  function irc(o) {
    ircInstall();
    Apps.load('js/social-irc.js').then(() => {
      if (!IRC) IRC = window.SocialIRC(Object.assign({}, X, { session, imTo, UM, setStatus, STAT, isIgnored, toggleIgnore, members: cb => members(m => cb(m), 0), others, addContact, getOnline: () => online, sender, CHAT, IRC_ICON, LOGO16, Throw, nudge, whereOf, touch }));
      IRC.open(o || {});
    }).catch(() => Desk.msgbox('JackIRC', 'JackIRC could not start. (Not enough conventional memory. Or the disk drive sneezed.) Try again in a minute.', 'warn'));
  }
  window.JackIRC = { get open() { return !!(IRC && IRC.isOpen); }, get connected() { return !!(IRC && IRC.connected); }, launch: o => irc(o), get installed() { return ircInstalled(); } };
  function downloadIRC() { // the website's big button: a quick 1999 download, then install and launch
    if (ircInstalled()) { irc({ autojoin: true }); return; }
    got('ircdownload');
    const b = h('div', 'so-dl');
    b.innerHTML = `<div class="so-dlrow">${ico(IRC_ICON, 32)}<div>Saving:<br><b>jackirc32.exe</b> from www.jackattack.jnet</div></div><div class="prog"><span style="display:flex;gap:2px"></span></div><div class="small so-dlst">Estimated time left: 3 sec (612 KB of 612 KB... well, nearly)</div><div class="small">Download to: C:\\JACKOS\\Desktop</div><div class="small">Transfer rate: 4.7 KB/Sec (a GOOD day)</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" disabled>Open</button><button class="btn" type="button">Cancel</button></div>`;
    const w = Apps.win('File Download', b, { w: 340, icon: IRC_ICON, noResize: true, noMax: true, noMin: true });
    const bar = b.querySelector('.prog span'), st = b.querySelector('.so-dlst'), t0 = Date.now(), dur = 2600;
    let done = false;
    const tick = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur); bar.innerHTML = '<i></i>'.repeat(Math.round(p * 26)); w.setTitle(`${Math.floor(p * 100)}% of jackirc32.exe Completed`);
      st.textContent = p < 1 ? `Estimated time left: ${Math.ceil((dur - (Date.now() - t0)) / 1000)} sec (${Math.round(p * 612)} KB of 612 KB copied)` : 'Download complete. Installing JackIRC...';
      if (p >= 1 && !done) { done = true; clearInterval(tick); play('pet'); setTimeout(() => { w.close(); ircInstall(); irc({ autojoin: true }); }, 900); }
    }, 120);
    b.querySelectorAll('.btn')[1].addEventListener('click', () => { clearInterval(tick); w.close(); });
  }
  function wireChatPage() {
    const btn = $('ircGet'), note = $('ircGetNote'); if (!btn) return;
    btn.textContent = ircInstalled() ? 'LAUNCH JackIRC' : 'DOWNLOAD JackIRC NOW!';
    if (note) note.textContent = ircInstalled() ? "It's already on your computer. Click to start it up and join #jackattack." : 'jackirc32.exe \u00b7 612 KB \u00b7 about 3 seconds on a good day \u00b7 FREE! (shareware: you owe Jack a biscuit)';
    const n = $('ircNow'); if (n) n.textContent = online.length ? `${online.length} ${online.length === 1 ? 'person is' : 'people are'} on #jackattack right now!` : '';
    if (!btn._so) { btn._so = 1; btn.addEventListener('click', ev => { ev.preventDefault(); downloadIRC(); }); }
    const fq = document.querySelector('#s-chat .ircfaq'); if (fq && !fq._so) { fq._so = 1; fq.addEventListener('click', ev => { ev.preventDefault(); IE.navigate('jackirc'); }); }
  }
  onlineFns.push(wireChatPage);
  const IRC_README = `JACKIRC 1.99
============

THE CHAT ROOM HAS MOVED! It's on IRC now, and this is the program.

1. Start JackIRC (desktop icon, or Start > Programs > Internet).
2. Press Connect. Your nickname is your JackNet name.
3. You land in #jackattack: the main chat. It's the SAME chat as the
   Hangout on the website, so people there see your words as speech
   bubbles over your head. Wave at them.
4. More channels: #orks #starwars #games #cubes #help, or make your own
   with /join #whatever. (Those ones are live only: no history.)
5. Type /help for all the commands.

JackServ is the channel service bot (a program, not a person). Say !help.

Private messages open in Uh-Oh! Messenger (double-click a nickname).

Q: Can I change my nick?
A: Your nick is your JackNet name. Log on as someone else to change it.
   You can't use another member's name. The server won't let you. Neither
   will Mom.

Q: Is it safe?
A: Never give out your real name, address, school or phone number.
   Not even to nice people. ESPECIALLY not to nice people.
`;
  Apps.register('social.irc', { cmd: ['irc', 'jackirc', 'mirc', 'jackirc.exe', 'chat', 'chatroom', 'chat room'], open: () => { irc(); } });
  Apps.addProgram(['Internet', 'JackIRC'], 'social.irc', IRC_ICON);
  Apps.addProgram(['Internet', 'Uh-Oh! Messenger'], 'social.uhoh', LOGO);
  if (ircInstalled()) { ircIcon = Apps.desktopIcon('JackIRC', IRC_ICON, () => Apps.open('social.irc'), 'iconJackIRC'); ircFiles(); }
  wireChatPage();
  S('ircdownload', 'Upgrade complete', 'Download the program the chat room moved into');
  S('ircconnect', 'Connected', 'Connect to JackNet IRC');
  S('ircjoin', 'Channel hopper', 'Join a channel that is not the main one');
  S('ircnew', 'Founder', 'Make a brand new IRC channel nobody asked for');
  S('ircgrotz', 'NO HUMIES', 'Find the channel the MOTD swears does not exist');
  S('ircwhois', 'Who dat?', 'Look someone up on IRC');
  S('ircgubbinz', 'Service check', 'Look up the channel service bot');
  S('ircme', '* you found this', 'Do an action on IRC');
  S('irccolour', 'Technicolour', 'Say something in colour (Ctrl+K)');
  S('irctopic', 'Topical', 'Change a channel topic');
  S('ircbot', 'Botsmack', 'Give the IRC bot a command');
  S('irc8ball', 'Outlook not so good', 'Ask the bot a yes/no question');
  S('irctrivia', 'Know-it-all', 'Win the IRC trivia');
  S('irclist', 'Channel surfer', 'List all the channels');
  S('ircmotd', 'Read the small print', 'Read the Message of the Day again');
  S('ircping', 'Lag check', 'Ping somebody');
  S('ircdcc', 'Slow transfer', 'Try the oldest way to send a file on IRC');
  S('ircquit', 'Parting words', 'Leave IRC with a message');
  S('irchl', 'Ears burning', 'Someone says your name on IRC');
  S('irclog', 'Paper trail', 'Turn on IRC logging');
  S('ircopts', 'Fiddler', 'Change JackIRC options');
  S('ircfaq', 'RTFM', 'Read the JackIRC FAQ web page');
  if (window.IE && IE.addPage) IE.addPage('jackirc', 'JackIRC FAQ', () => {
    got('ircfaq');
    const d = h('div', 'secretpage so-page so-faq');
    d.innerHTML = `<h2>${ico(IRC_ICON, 48)} JackIRC FAQ</h2><p><b>Frequently Asked Questions about JackIRC 1.99</b> (the chat room that moved)</p>
      <dl><dt>What is IRC?</dt><dd>Internet Relay Chat. Loads of people typing in "channels" at the same time. Channels start with #. It's been around since 1988, which makes it older than Jack.</dd>
      <dt>Where's the old Chat Room?</dt><dd>It moved into JackIRC! The main channel, <b>#jackattack</b>, is the same chat. People in the Hangout see what you say as speech bubbles.</dd>
      <dt>How do I get it?</dt><dd>Go to the <a href="#" data-go="chat">Chat Room page</a> and press the big button. Or Start &gt; Run &gt; <b>irc</b>.</dd>
      <dt>What can I type?</dt><dd><tt>/join #orks</tt>, <tt>/me waves</tt>, <tt>/whois somebody</tt>, <tt>/list</tt>, <tt>/away</tt>, <tt>/quit</tt>. Type <tt>/help</tt> in JackIRC for the lot.</dd>
      <dt>Who is JackServ?</dt><dd>The channel service bot. It's a program, not a person, so it sits in its own "Services" list. It knows !joke, !8ball, !time, !seen, !trivia and !rules.</dd>
      <dt>Can I be an op?</dt><dd>No.</dd>
      <dt>Can I change my nick?</dt><dd>Your nick is your JackNet name, so nobody can pretend to be you. Log on as someone else to change it.</dd>
      <dt>Are there secret channels?</dt><dd>Gubbinz says no. Gubbinz's MOTD says no. Gubbinz says no a bit too loudly.</dd>
      <dt>How do I do colours?</dt><dd>Ctrl+K then a number from 0 to 15. 4 is red. Red ones go faster.</dd></dl>
      <p class="small">Last updated ${d99()}. This page is best viewed in JackNet Explorer at 800x600.</p>`;
    return d;
  });

  // ---- boot: Uh-Oh! starts minimised to the tray; bottles drift in now and then
  // ---- making it obvious there's a messenger: Links bar button, a web badge, "Add me" links on profiles and in the Hangout
  function linksButton() {
    const bar = $('bandLinks'); if (!bar || $('soLinkUhOh')) return;
    const btn = h('button', '', `${LOGO16.replace('<svg', '<svg width="16" height="16" aria-hidden="true"')}Uh-Oh!`); btn.type = 'button'; btn.id = 'soLinkUhOh'; btn.title = 'Open Uh-Oh! Messenger';
    const last = [...bar.querySelectorAll('button')].pop(); bar.insertBefore(btn, last || null);
    btn.addEventListener('click', ev => { ev.preventDefault(); openCL(true); });
  }
  function webBadge() {
    let el = $('soBadge');
    if (!el) { const box = $('readerNo') && $('readerNo').closest('.win'); if (!box) return; el = h('div', 'so-webbadge'); el.id = 'soBadge'; box.parentNode.insertBefore(el, box.nextSibling); el.addEventListener('click', ev => { const a = ev.target.closest('a'); if (!a) return; ev.preventDefault(); if (a.dataset.x === 'join') { if (window.JackLogon) JackLogon.show(); } else if (a.dataset.x === 'find') findUser(); else openCL(true); }); }
    const u = myUIN();
    el.innerHTML = `<div class="so-bdt">${ico(LOGO, 32)}<span>ADD ME ON<br><b>Uh-Oh!</b></span></div>` + (Net.me.member
      ? `<div class="so-bdn">My Uh-Oh! number is<br><b>${u || '...'}</b></div><div class="so-bdl"><a href="#">Open Uh-Oh! Messenger</a> &middot; <a href="#" data-x="find">Add a mate</a></div>`
      : `<div class="so-bdn">Get your OWN Uh-Oh! number:<br><a href="#" data-x="join"><b>JOIN JACKNET FREE!</b></a></div><div class="so-bdl"><a href="#">Open Uh-Oh! Messenger</a></div>`);
  }
  onlineFns.push(webBadge);
  document.addEventListener('click', ev => { const a = ev.target.closest('[data-uhohadd]'); if (!a) return; ev.preventDefault(); const n = a.getAttribute('data-uhohadd'); if (lc(n) === lc(Net.me.nick)) openCL(true); else addContact(n); });
  const hangMenu = (ev, el) => {
    const label = (el.querySelector('.nm') || {}).textContent || '';
    const o = online.filter(x => label.startsWith(x.nick)).sort((a, b) => b.nick.length - a.nick.length)[0];
    if (!o || o.id === Net.me.id) return;
    ev.preventDefault(); ev.stopPropagation();
    IE.menu([{ label: `Uh-Oh! Message ${o.nick}`, icon: LOGO16, act: () => session(o) }, { label: 'Add to Uh-Oh! Contacts', dis: !o.member || !Net.me.member || !!contactOf(o), act: () => addContact(o.nick) }, { label: 'User Info', act: () => userInfo(o) }], ev.clientX, ev.clientY);
  };
  document.addEventListener('contextmenu', ev => { const el = ev.target.closest('.hgav'); if (el) hangMenu(ev, el); });
  document.addEventListener('dblclick', ev => { const el = ev.target.closest('.hgav'); if (el) hangMenu(ev, el); });
  window.UhOh = { add: addContact, open: () => openCL(true), find: findUser, message: nick => { const o = online.find(x => lc(x.nick) === lc(nick)); if (o) session(o); }, uinOfNo: memberUIN, noOfUin: uinToNo, get myNumber() { return myUIN(); } };

  // ---- boot: Uh-Oh! starts with the PC. On a big screen the contact list docks on the right; on phones it waits in the tray.
  const ready = fn => { if (Net.me.id) fn(); else Net.on('welcome', () => setTimeout(fn, 300)); };
  const boot = () => {
    makeTray(); linksButton(); webBadge();
    if (UM.status !== 'off') setTimeout(() => sendStatus(0), 1200);
    CAPSULE.schedule();
    ready(() => setTimeout(() => {
      const phone = touch() || DesktopSurface.width() < 760;
      const gone = window.Setup && !Setup.has('uhoh'); // not installed on this PC (setup.js): no contact list, no hello
      if (!phone && !gone && Net.me.member && store.get('jhp_social_dock', true) !== false) openCL();
      const u = myUIN(), seen = store.get('jhp_social_hello', []), k = Net.me.member ? String(u) : 'guest';
      if (!seen.includes(k) && !gone) {
        store.set('jhp_social_hello', seen.concat(k).slice(-10));
        Desk.toast('Welcome to Uh-Oh!', Net.me.member ? `Your Uh-Oh! number is ${u}. Give it to your mates! (The flower by the clock is Uh-Oh! Messenger.)` : `Uh-Oh! Messenger is the flower by the clock. You're a guest, so your number changes every visit: join JackNet to get your own!`, 9000);
      }
      webBadge(); renderCL();
    }, 1200));
  };
  (window.BootDone || Promise.resolve()).then(() => setTimeout(boot, 800));
  window.Social = { Throw, Parcel, UM, setStatus, session, openCL, addContact, contacts: () => contacts, myUIN, CAPSULE, irc: o => irc(o), downloadIRC, more: w => more(w), get MORE() { return MORE; } };
})();

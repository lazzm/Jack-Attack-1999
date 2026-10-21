/* share: SHARE & SOCIAL. Draw real people in, and give them reasons to bring their friends.
 *   SparkleCardz! (www.sparklecardz.webcom)   animated e-cards: to a JackNet member (lands in Outlook Express) or to a
 *                                              real friend (a real https://jacklm.com/card/<id> link)
 *   Homepage links                             https://jacklm.com/~name opens a member's Homepagez page after switch-on
 *   The Brag Button Factory (www.bragbuttons.webcom)   88x31 buttons + 400x210 brag pictures (server-checked numbers)
 *   The Chain Letter Tracker (www.chainwatch.webcom)    Fwd: Fwd: FW: chain letters between real members, and their family trees
 *   DiskSwap 1.44 + www.floppyswap.webcom      fill a 1.44 MB floppy with your stuff and give it to another member
 *   Cool Site of the Month (www.coolsite.homepagez)     monthly vote, hit-counter league, Webring of the Week, prizes
 * This file is the always-loaded part: the network plumbing, arriving by a real link (a note on the monitor), the post
 * (e-cards, chain letters and floppies arriving), the sites' page tables and the little hooks round the PC. The rest is
 * lazy: js/share-cat.js (fixed lists, shared with mods/share.js), js/share-cards.js (card art + tunes), js/share-web.js
 * (the web sites, the badge painter, DiskSwap and the floppy viewer). */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.Share) return;
  const esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const SH = window.Share = {};
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const me = () => (window.Net && Net.me) || {};
  const isMember = () => !!me().member;
  const whenReady = fn => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  SH.esc = esc; SH.store = store; SH.me = me; SH.sfx = sfx; SH.secret = secret;

  // ================================================================ hosts
  const HOST = { cards: 'www.sparklecardz.webcom', chain: 'www.chainwatch.webcom', brag: 'www.bragbuttons.webcom', floppy: 'www.floppyswap.webcom', cotm: 'www.coolsite.homepagez' };
  SH.HOST = HOST;
  SH.url = (k, p) => 'http://' + HOST[k] + (p || '/');
  // the real address of the real site (the dev copy uses wherever it's running)
  SH.real = p => ((/^(www\.)?jacklm\.com$/i.test(location.host) ? 'https://jacklm.com' : location.origin) + p);
  SH.go = url => { const b = $('browser'); if (b) { b.classList.remove('min'); try { if (window.Desk && Desk.activate) Desk.activate(b); } catch (e) {} } if (window.IE) IE.navigate(url); };
  // JackNet Explorer drops ?query bits, so a page that needs to know something gets it here (read once, by share-web.js)
  SH.goP = (url, params) => { SH.navParams = Object.assign({ at: Date.now() }, params || {}); SH.go(url); };
  SH.takeParams = () => { const p = SH.navParams; SH.navParams = null; return p && Date.now() - p.at < 8000 ? p : {}; };

  // ================================================================ talking to mods/share.js
  let rid = 0; const pend = {}, subs = {};
  const TYPES = ['shBox', 'shBoxNew', 'shMembers', 'shCardSent', 'shCardGot', 'shChainDone', 'shChains', 'shChain', 'shOpt', 'shDiskDone', 'shDisk', 'shCotm', 'shBrag', 'shBadge', 'shBadgeGot', 'shStats'];
  if (window.Net) TYPES.forEach(t => Net.on(t, m => {
    if (m && m.rid && pend[m.rid]) { const p = pend[m.rid]; delete pend[m.rid]; p(m); }
    (subs[t] || []).slice().forEach(fn => { try { fn(m); } catch (e) { console.error(e); } });
  }));
  SH.on = (t, fn) => { (subs[t] = subs[t] || []).push(fn); return () => { subs[t] = (subs[t] || []).filter(x => x !== fn); }; };
  // wait (a little) for the modem: links straight to a page arrive before JackNet has finished dialling
  SH.whenNet = ms => new Promise(res => { const t0 = Date.now(); (function poll() { if (window.Net && Net.connected && Net.me && Net.me.id) return res(true); if (Date.now() - t0 > (ms || 9000)) return res(false); setTimeout(poll, 150); })(); });
  SH.req = (msg, ms) => SH.whenNet().then(() => new Promise(res => {
    const id = ++rid; msg.rid = id; pend[id] = res;
    if (!window.Net || !Net.send(msg)) { delete pend[id]; return res({ t: 'err', err: 'JackNet is not connected. (Is somebody on the phone?) Try again in a minute.', offline: true }); }
    setTimeout(() => { if (pend[id]) { delete pend[id]; res({ t: 'err', err: 'The server took too long to answer. (56K, remember.) Try again!', timeout: true }); } }, ms || 10000);
  }));
  SH.send = m => !!(window.Net && Net.send(m)); // chunked uploads (no reply until the last chunk)

  // ================================================================ lazy parts
  SH.cat = () => A.load('js/share-cat.js').then(() => window.ShareCat);
  SH.cards = () => SH.cat().then(() => A.load('js/share-cards.js')).then(() => SH.C);
  SH.web = () => SH.cards().then(() => A.load('js/share-web.js')).then(() => SH.W);
  const loadingEl = (host, cls) => { const el = document.createElement('div'); el.className = 'shz-site ' + (cls || ''); el.innerHTML = `<div class="shz-wait">Contacting host: <b>${esc(host)}</b>...<br>Host contacted. Waiting for reply...</div>`; return el; };
  function lazyPage(key, path) {
    const el = loadingEl(HOST[key], 'shz-' + key);
    SH.web().then(W => { if (el.isConnected || document.body.contains(el) || true) W.render(key, path, el); })
      .catch(e => { console.error(e); el.innerHTML = '<div class="shz-wait"><h2>The page cannot be displayed</h2><p>The server is having a lie down. Click Refresh in a minute.</p></div>'; });
    return el;
  }

  // ================================================================ the web sites (page tables: fixed pages + a Proxy for the made-on-demand ones)
  // route(key, path) -> title or null (share-web.js draws them); fixed pages are listed so search engines and History see them
  const TITLES = {
    cards: { '/': 'SparkleCardz! - FREE animated e-cards', '/pickup.html': 'SparkleCardz! - Pick up a card', '/sent.html': 'SparkleCardz! - Cards I have sent', '/faq.html': 'SparkleCardz! - Help & FAQ', '/today.html': "SparkleCardz! - Today's special cards" },
    chain: { '/': 'The JackNet Chain Letter Tracker', '/start.html': 'Start a chain letter - Chain Letter Tracker', '/optout.html': 'No more chain letters - Chain Letter Tracker', '/hoax.html': 'Is it TRUE? - Chain Letter Tracker', '/mine.html': 'My chain letters - Chain Letter Tracker' },
    brag: { '/': 'The Brag Button Factory', '/about.html': 'About 88x31 buttons - The Brag Button Factory' },
    floppy: { '/': 'Floppy Swap-O-Rama', '/labels.html': 'Floppy label gallery - Floppy Swap-O-Rama' },
    cotm: { '/': 'Cool Site of the Month - Homepagez Awards', '/league.html': 'Hit Counter League - Homepagez Awards', '/ring.html': 'Webring of the Week - Homepagez Awards', '/winners.html': 'Hall of Fame - Homepagez Awards', '/rules.html': 'The Rules - Homepagez Awards' },
  };
  const DYN = {
    cards: [[/^\/cat\/([a-z]+)\.html$/, 'SparkleCardz! - Cards'], [/^\/card\/([a-z0-9-]+)\.html$/, 'SparkleCardz! - Send this card'], [/^\/pickup\/([A-Za-z0-9_-]{10,24})\.html$/, "SparkleCardz! - You've got an e-card!"]],
    chain: [[/^\/chain\/([A-Za-z0-9_-]{10,24})\.html$/, 'Family tree - Chain Letter Tracker'], [/^\/forward\/([A-Za-z0-9_-]{10,24})-(\d{1,4})\.html$/, 'Forward this letter - Chain Letter Tracker']],
    brag: [[/^\/b\/([A-Za-z0-9_-]{10,24})\.html$/, 'Look at this! - The Brag Button Factory'], [/^\/make\/([a-z]+)(?:-([a-z]+))?\.html$/, 'Make a button - The Brag Button Factory']],
    floppy: [], cotm: [],
  };
  const SITE_DESC = {
    cards: ['SparkleCardz!', 'FREE animated e-cards with MUSIC! Birthdays, thank yous, Halloween, Bonfire Night and the Millennium. Send one to a mate on JackNet or anyone in the world.', 'comm'],
    chain: ['The JackNet Chain Letter Tracker', 'Every Fwd: Fwd: FW: on JackNet, tracked! See how far each chain letter has spread, with family trees. (They are all hoaxes, by the way.)', 'fun'],
    brag: ['The Brag Button Factory', 'Make your own 88x31 brag buttons: high scores, secrets, ranks. Put them on your home page and show off!', 'fun'],
    floppy: ['Floppy Swap-O-Rama', 'Fill a 1.44 MB floppy disk with your pictures and files, write a label and give it to a mate. Download DiskSwap 1.44 FREE.', 'soft'],
    cotm: ['Homepagez Cool Site of the Month', 'Vote for the coolest home page on Homepagez! Monthly awards, the Hit Counter League and the Webring of the Week.', 'comm'],
  };
  function addSites() {
    if (!window.IE || !IE.addSite) return;
    for (const key of Object.keys(HOST)) {
      const k = HOST[key].replace(/^www\./, '');
      if (IE.sites[k] && IE.sites[k].pages && IE.sites[k].pages.__shz) continue;
      const fixed = {};
      for (const [p, title] of Object.entries(TITLES[key])) fixed[p] = { title, html: () => lazyPage(key, p) };
      fixed['/index.html'] = fixed['/'];
      const pages = new Proxy(fixed, { get(t, p) {
        if (p === '__shz') return true;
        if (typeof p !== 'string' || p.charAt(0) !== '/' || Object.prototype.hasOwnProperty.call(t, p)) return t[p];
        for (const [re, title] of DYN[key]) if (re.test(p)) return { title, html: () => lazyPage(key, p) };
        return undefined;
      } });
      const [title, desc, cat] = SITE_DESC[key];
      IE.addSite(HOST[key], { title, desc, cat, pages });
    }
  }
  addSites();

  // ================================================================ arriving by a real link: /card/<id>, /~name, /hp/<name>, /badge/<id>
  // (the server sent index.html with a <meta name="jhp-share" content="kind|id|from|title"> so we know who it's from straight away)
  const LANDK = 'jhp_share_land';
  function landing() {
    let L = null;
    const p = location.pathname; let mm;
    const meta = document.querySelector('meta[name="jhp-share"]'), bits = meta ? String(meta.getAttribute('content') || '').split('|') : [];
    if ((mm = /^\/card\/([A-Za-z0-9_-]{10,24})\/?$/.exec(p))) L = { k: 'card', id: mm[1] };
    else if ((mm = /^\/(?:~|hp\/)([A-Za-z0-9_-]{2,16})\/?$/.exec(p))) L = { k: 'hp', id: mm[1].toLowerCase() };
    else if ((mm = /^\/badge\/([A-Za-z0-9_-]{10,24})\/?$/.exec(p))) L = { k: 'badge', id: mm[1] };
    if (L) {
      if (bits[0] === L.k) { L.from = String(bits[2] || '').slice(0, 30); L.title = String(bits[3] || '').slice(0, 80); }
      try { sessionStorage.setItem(LANDK, JSON.stringify(L)); } catch (e) {}
      try { history.replaceState(null, '', '/' + location.search + location.hash); } catch (e) {} // the PC lives at the top of the site
    } else { try { L = JSON.parse(sessionStorage.getItem(LANDK) || 'null'); } catch (e) { L = null; } } // (refreshed before switching on)
    return L && /^(card|hp|badge)$/.test(L.k) ? L : null;
  }
  const LAND = landing();
  function note(L) {
    const pb = $('bootPower'), front = pb && pb.querySelector('.pm-front');
    if (!front || pb.hidden || front.querySelector('.shz-note')) return;
    const n = document.createElement('i'); n.className = 'shz-note'; n.setAttribute('aria-hidden', 'true');
    const who = L.from ? esc(L.from) : '';
    const head = L.k === 'card' ? "You've got an e-card!" : L.k === 'hp' ? 'Come and see my home page!' : 'Look what I did!';
    const sub = L.k === 'card' ? (who ? `from <b>${who}</b>` : 'somebody sent you one') : L.k === 'hp' ? (who ? `love from <b>${who}</b>` : 'on Homepagez') : (who ? `<b>${who}</b> is showing off` : 'a brag badge');
    n.innerHTML = `<b class="shz-nh">${head}</b><span class="shz-ns">${sub}</span><span class="shz-np">Press the power button &#8594;</span><i class="shz-tape"></i>`;
    front.appendChild(n);
    // the tower's own "PRESS ME!" note gets an extra word
    const pc = pb.querySelector('.pc-note'); if (pc && !pc.querySelector('.shz-pc')) { const s = document.createElement('small'); s.className = 'shz-pc'; s.textContent = L.k === 'card' ? '(for your e-card!)' : '(then look!)'; pc.appendChild(s); }
  }
  function arrive(L) {
    try { sessionStorage.removeItem(LANDK); } catch (e) {}
    secret('share.arrive');
    if (L.k === 'card') SH.go(SH.url('cards', '/pickup/' + L.id + '.html'));
    else if (L.k === 'hp') SH.go('http://members.homepagez.webcom/~' + L.id + '/');
    else SH.go(SH.url('brag', '/b/' + L.id + '.html'));
    // the first-boot Welcome box (and friends) pop up about now: keep what they came for in front, unless they've started clicking
    let touched = false; const t = () => { touched = true; }; addEventListener('pointerdown', t, { once: true, capture: true });
    [2500, 6000].forEach(ms => setTimeout(() => { const b = $('browser'); if (!touched && b && window.Desk && Desk.activate) try { Desk.activate(b); } catch (e) {} }, ms));
  }
  if (LAND) {
    const mode = window.JHPBoot || 'room';
    if (mode !== 'wake' && mode !== 'skip') whenReady(() => note(LAND));
    (window.BootDone || Promise.resolve()).then(() => {
      const t0 = Date.now();
      (function wait() { // after the logon box and the dial-up box have gone
        if ((window.JackLogon && JackLogon.open) && Date.now() - t0 < 120000) return setTimeout(wait, 300);
        setTimeout(() => arrive(LAND), mode === 'wake' ? 1300 : 700);
      })();
    });
  }

  // ================================================================ the post: e-cards, pickup notes, chain letters, floppies, prizes
  const SEENK = 'jhp_share_seen';
  let seen = new Set(store.get(SEENK, []));
  const markSeen = id => { seen.add(id); const a = [...seen]; if (a.length > 400) seen = new Set(a.slice(-400)); store.set(SEENK, [...seen]); };
  SH.opt = { chains: true };
  function post(items) {
    if (!isMember()) return;
    seen = new Set(store.get(SEENK, [...seen])); // (a roaming profile may have just come down)
    const fresh = (items || []).filter(it => it && it.id && !seen.has(it.id));
    if (!fresh.length) return;
    SH.web().then(W => { fresh.forEach((it, i) => setTimeout(() => { if (seen.has(it.id)) return; try { if (W.deliver(it) !== false) markSeen(it.id); } catch (e) { console.error('[share]', e); } }, i * 400)); }).catch(e => console.warn('[share]', e));
  }
  if (window.Net) {
    Net.on('shBox', m => { if (m.opt) SH.opt = m.opt; post(m.items); });
    Net.on('shBoxNew', m => post([m.item]));
  }

  // ---- floppies people gave you sit on the desktop until you eject them
  const DISKK = 'jhp_share_disks';
  const diskIcons = new Map();
  SH.disks = () => store.get(DISKK, []);
  SH.addDisk = d => { const l = SH.disks().filter(x => x.id !== d.id); l.push(d); store.set(DISKK, l.slice(-12)); drawDisks(); };
  SH.ejectDisk = id => { store.set(DISKK, SH.disks().filter(x => x.id !== id)); drawDisks(); };
  const FLOPPY = col => `<svg viewBox="0 0 32 32"><path d="M3 3h23l3 3v23H3z" fill="${col || '#262626'}" stroke="#000"/><rect x="9" y="3" width="13" height="9" fill="#c8c8c8" stroke="#000"/><rect x="17" y="4.5" width="3" height="6" fill="#262626"/><rect x="6" y="16" width="20" height="13" fill="#fff" stroke="#000"/><path d="M8 20h16M8 23h16M8 26h11" stroke="#1d4fd8" stroke-width=".9"/><rect x="4" y="26" width="2" height="2" fill="#000"/></svg>`;
  SH.FLOPPY = FLOPPY;
  function drawDisks() {
    const want = new Map(SH.disks().map(d => [d.id, d]));
    for (const [id, el] of diskIcons) if (!want.has(id)) { el.remove(); diskIcons.delete(id); }
    for (const [id, d] of want) {
      if (diskIcons.has(id)) continue;
      const lab = String(d.label || 'DISK').slice(0, 14);
      const el = A.desktopIcon(`${lab} (A:)`, FLOPPY(d.col), () => A.open('share.disk', id), 'shzDisk-' + id.replace(/[^A-Za-z0-9]/g, ''));
      el.title = `A floppy disk from ${d.from || 'somebody'}: "${d.label || ''}"`;
      el.classList.add('shz-dicon');
      diskIcons.set(id, el);
    }
  }
  A.register('share.disk', { cmd: [], open(id) {
    const b = document.createElement('div'); b.className = 'shz-fx';
    b.innerHTML = '<p style="margin:16px">Reading drive A:... <i>(whirr, clunk, whirr)</i></p>';
    const d = SH.disks().find(x => x.id === id) || {};
    const w = A.win(`3½ Floppy (A:) - ${String(d.label || 'DISK').toUpperCase()}`, b, { w: 560, h: 430, icon: FLOPPY(d.col), menubar: true, status: true, minW: 280, minH: 240 });
    sfx('thud');
    SH.web().then(W => { if (!w.closed) W.diskView(w, id); }).catch(() => { if (!w.closed) b.innerHTML = '<p style="margin:16px">A:\\ is not accessible. The disk is not formatted. (Or the program that reads it is missing. Try again.)</p>'; });
    return w;
  } });

  // ================================================================ DiskSwap 1.44 (a download) and the little web shortcut opener
  const ICONS = {
    disk: '<svg viewBox="0 0 32 32"><path d="M2 4h20l3 3v20H2z" fill="#1d4fd8" stroke="#000"/><rect x="7" y="4" width="11" height="8" fill="#c8c8c8" stroke="#000"/><rect x="14" y="5.5" width="2.5" height="5" fill="#1d4fd8"/><rect x="5" y="16" width="17" height="11" fill="#fff" stroke="#000"/><path d="M7 20h13M7 23h9" stroke="#c81d1d"/><path d="M18 9l12 0M26 5l4 4-4 4" stroke="#1a9a3a" stroke-width="2.5" fill="none"/><path d="M9 30h20" stroke="#000" stroke-width="1.5"/><path d="M28 18v12M24 26l4 4 4-4" stroke="#c81d1d" stroke-width="2" fill="none"/></svg>',
    card: '<svg viewBox="0 0 32 32"><rect x="2" y="9" width="24" height="17" fill="#fff" stroke="#000"/><path d="M2 9l12 9 12-9" fill="#ffd6ef" stroke="#000"/><path d="M24 2l1.6 4 4 .4-3 2.8.9 4-3.5-2-3.5 2 .9-4-3-2.8 4-.4z" fill="#ffd400" stroke="#a07000"/><circle cx="8" cy="22" r="1.4" fill="#ff3399"/><circle cx="20" cy="22" r="1.4" fill="#2a9ad8"/></svg>',
    chain: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="22" height="16" fill="#fff" stroke="#000"/><path d="M3 5l11 8 11-8" fill="none" stroke="#000"/><ellipse cx="14" cy="25" rx="5" ry="3.2" fill="none" stroke="#808080" stroke-width="2.2"/><ellipse cx="22" cy="25" rx="5" ry="3.2" fill="none" stroke="#c0c0c0" stroke-width="2.2"/><text x="17" y="17" font-family="Arial" font-weight="bold" font-size="7" fill="#c00">FWD</text></svg>',
    brag: '<svg viewBox="0 0 32 32"><rect x="1" y="9" width="30" height="14" fill="#000080" stroke="#000"/><rect x="2" y="10" width="28" height="12" fill="none" stroke="#6a8aff"/><text x="4" y="19" font-family="Arial" font-weight="bold" font-size="8" fill="#ff0">88x31</text><path d="M26 2l1.4 3 3.3.4-2.5 2.2.7 3.3-2.9-1.7-2.9 1.7.7-3.3-2.5-2.2 3.3-.4z" fill="#ffd400" stroke="#a07000"/></svg>',
    trophy: '<svg viewBox="0 0 32 32"><path d="M9 4h14v7a7 7 0 0 1-14 0z" fill="#ffd400" stroke="#8a5a00"/><path d="M9 6H4c0 5 3 7 5 7M23 6h5c0 5-3 7-5 7" fill="none" stroke="#8a5a00" stroke-width="1.6"/><rect x="14" y="17" width="4" height="6" fill="#d8a800" stroke="#8a5a00"/><rect x="9" y="23" width="14" height="5" fill="#8a5a00" stroke="#000"/><path d="M13 8l2 2 4-4" stroke="#fff" stroke-width="1.4" fill="none"/></svg>',
  };
  SH.ICONS = ICONS;
  A.register('share.diskswap', { single: true, cmd: ['diskswap', 'diskswap.exe', 'floppyswap'], open(arg) {
    const b = document.createElement('div'); b.className = 'shz-ds';
    b.innerHTML = '<p style="margin:16px">Loading DiskSwap 1.44...<br><br>Checking drive A:... OK</p>';
    const w = A.win('DiskSwap 1.44 - (untitled disk)', b, { w: 720, h: innerWidth < 640 ? innerHeight - 50 : 520, icon: ICONS.disk, menubar: true, status: true, minW: 300, minH: 300 });
    SH.web().then(W => { if (!w.closed) W.diskSwap(w, arg); }).catch(() => { if (!w.closed) b.innerHTML = '<p style="margin:16px">DISKSWAP.EXE is corrupt or missing. Try installing it again from www.floppyswap.webcom.</p>'; });
    return w;
  } });
  A.register('share.web', { cmd: [], open(url) { SH.go(String(url || SH.url('cards'))); return null; } });
  if (window.Setup && Setup.product) Setup.product('share.diskswap', {
    n: 'DiskSwap 1.44', v: '1.44', kb: 288, lic: 'Freeware', by: 'Floppy Swap-O-Rama', cat: 'net', sq: 5, rel: '17/05/99',
    d: 'Fill a 3½" floppy disk with your Paint pictures, Notepad files and a link to your home page, write a label in felt tip, and GIVE IT to another JackNet member. It lands on their desktop!',
    note: 'Disks hold 1.44 MB. A Paint picture is a BIG bitmap. You have been warned.',
    apps: ['share.diskswap'], paths: ['Accessories > DiskSwap 1.44'], icons: [], def: false, launch: 'share.diskswap', exe: 'DISKSWAP.EXE', dir: 'DiskSwap',
  });
  A.addProgram(['Accessories', 'DiskSwap 1.44'], 'share.diskswap', ICONS.disk);
  A.addProgram(['Internet', 'SparkleCardz! e-cards'], () => SH.go(SH.url('cards')), ICONS.card);
  A.addProgram(['Internet', 'Chain Letter Tracker'], () => SH.go(SH.url('chain')), ICONS.chain);
  A.addProgram(['Internet', 'Brag Button Factory'], () => SH.go(SH.url('brag')), ICONS.brag);
  A.addProgram(['Internet', 'Cool Site of the Month'], () => SH.go(SH.url('cotm')), ICONS.trophy);
  A.cmd(['sparklecardz', 'ecards', 'e-cards', 'ecard'], () => SH.go(SH.url('cards')));
  A.cmd(['chainwatch', 'chain letters', 'fwd'], () => SH.go(SH.url('chain')));
  A.cmd(['brag', 'bragbuttons', '88x31'], () => SH.go(SH.url('brag')));
  A.cmd(['coolsite', 'cotm', 'cool site of the month'], () => SH.go(SH.url('cotm')));

  // ================================================================ files on the PC
  A.fs.add('C:/Program Files/DiskSwap', { name: 'DISKSWAP.EXE', type: 'exe', app: 'share.diskswap', size: '288 KB', date: '17/05/99' });
  A.fs.add('C:/Program Files/DiskSwap', { name: 'README.TXT', type: 'txt', size: '2 KB', date: '17/05/99', text: `DISKSWAP 1.44
=============

Swap floppy disks with your mates! Over the INTERNET!

In the old days (1997) you had to put a disk in your bag, take it to
school, remember to give it to Dave, and then wait three weeks to get
it back with "DAVE'S" written over your label. Not any more!

HOW TO SWAP A DISK
  1. Start > Programs > Accessories > DiskSwap 1.44
  2. Write a label. Pick a colour. Stick some stickers on.
  3. Click "Put files on..." and pick Paint pictures, Notepad files
     or a shortcut to your home page.
  4. Click "Give to..." and pick a JackNet member.
  5. The disk turns up on THEIR desktop. They can copy things off it.

HOW BIG IS A FLOPPY?
  1,457,664 bytes. That's 1.44 MB (if you are a floppy disk company)
  or 1.39 MB (if you are a computer). A Paint picture is a bitmap,
  and bitmaps are HUGE, so you might only fit four or five.

THE RULES
  * Be nice. The JackNet post office reads every label.
  * No viruses. (We check. We use a very small magnifying glass.)
  * Only give disks to people you know on JackNet.

(c) 1999 Floppy Swap-O-Rama. "Have you got my disk back yet?"
` });
  A.fs.add('C:/My Documents', { name: 'chain letters (DO NOT DELETE).txt', type: 'txt', size: '3 KB', date: '02/09/99', text: `MY CHAIN LETTER COLLECTION
by Jack (Head Chain Letter Scientist)

I have NEVER broken a chain. Well. Once. Nothing happened. Then I
dropped my toast. It landed butter side up though, so I think it
evens out.

THE ONES I'VE HAD THIS YEAR
---------------------------
* "The Lucky Blobbit" - got it 6 times. Forwarded it 6 times.
  Still waiting for the luck. (Got a 2p coin on the pavement. Maybe?)
* "MegaSoft will give you Rupees for forwarding" - Dave forwarded it
  to EVERYONE. He is still waiting. He has been waiting since March.
  ${Cast.n('teacher')} at Computer Club says big companies can't count your e-mails.
  Dave says ${Cast.n('teacher')} "doesn't understand the Internet".
* "VIRUS WARNING!!!" - Mom forwarded this one to the whole family.
  Including me. I'm in the same house. Upstairs.
* "Free pizza" - no pizza arrived. I checked the door four times.
* "The Friendship Test" - got 3 back! That means I'm COOL. Official.

FACTS I HAVE WORKED OUT
-----------------------
1. If everybody sends a letter to 5 friends, and THEY each send it to
   5 friends, after 10 goes that's 9,765,625 people. That's more than
   everybody on the Internet. So somebody is lying.
2. "Fwd: Fwd: Fwd: Fwd:" means it's been round 4 times. I had one with
   23. It was mostly the word "Fwd".
3. There's a tracker web site now: www.chainwatch.webcom
   It draws a family tree of where every letter went! Dave's name is on
   loads of them. Of course it is.
` });
  A.fs.add('C:/JACKOS/Favorites', { name: 'SparkleCardz!.url', type: 'lnk', web: SH.url('cards'), date: '14/02/99', size: '1 KB' });
  A.fs.add('C:/JACKOS/Favorites', { name: 'Cool Site of the Month.url', type: 'lnk', web: SH.url('cotm'), date: '01/09/99', size: '1 KB' });

  // ---- things copied off floppies (kept by us, so they're still there tomorrow)
  const COPYK = 'jhp_share_copies';
  SH.copies = () => store.get(COPYK, []);
  const COPYDIR = 'C:/My Documents/From Floppy Disks';
  function copyNode(f) {
    if (f.k === 'txt') return { name: f.n, type: 'txt', text: f.t, date: f.date, size: Math.max(1, Math.ceil(String(f.t || '').length / 1024)) + ' KB', shCopy: true };
    if (f.k === 'url') return { name: f.n, type: 'lnk', web: f.u, date: f.date, size: '1 KB', shCopy: true };
    return null;
  }
  SH.addCopy = f => { // returns false if the hard disk (localStorage) is full
    const l = SH.copies(); l.push(f);
    try { localStorage.setItem(COPYK, JSON.stringify(l.slice(-60))); } catch (e) { return false; }
    const n = copyNode(f); if (n) A.fs.add(COPYDIR, n);
    return true;
  };
  SH.COPYDIR = COPYDIR;
  SH.copies().forEach(f => { const n = copyNode(f); if (n) A.fs.add(COPYDIR, n); });

  // ================================================================ "brag about it!" offers, round the PC
  let offerEl = null;
  SH.offer = (title, text, btn, fn) => {
    if (offerEl) offerEl.remove();
    const o = offerEl = document.createElement('div'); o.className = 'shz-offer'; o.setAttribute('role', 'status');
    o.innerHTML = `<button type="button" class="shz-ox" aria-label="Close">x</button><b></b><p></p><div><button type="button" class="btn">${esc(btn)}</button></div>`;
    o.querySelector('b').textContent = title; o.querySelector('p').textContent = text;
    o.querySelector('.btn').addEventListener('click', () => { o.remove(); fn(); });
    o.querySelector('.shz-ox').addEventListener('click', () => o.remove());
    document.body.appendChild(o);
    setTimeout(() => { if (o.isConnected) o.classList.add('bye'); setTimeout(() => o.remove(), 500); }, 16000);
  };
  const bragGo = (k, g) => SH.go(SH.url('brag', k ? `/make/${k}${g ? '-' + g : ''}.html` : '/'));
  SH.bragGo = bragGo;
  if (window.Net) {
    Net.on('gbOk', () => { if (isMember()) setTimeout(() => SH.offer("You signed Jack's Guestbook!", 'Get a brag button that says so, for your home page (or to send to a mate).', 'Make my brag button', () => bragGo('gb')), 1800); });
    let lastScore = null;
    if (Net.send && !Net._shzWatch) { const raw = Net.send; Net.send = function (m) { if (m && m.t === 'score') lastScore = { g: m.g, s: Math.floor(+m.s), at: Date.now() }; return raw.apply(Net, arguments); }; Net._shzWatch = true; }
    Net.on('scores', m => {
      if (!isMember() || !lastScore || lastScore.g !== m.g || Date.now() - lastScore.at > 15000) return;
      if (!(m.list || []).some(e => e && e.s === lastScore.s)) return;
      const g = lastScore.g; lastScore = null;
      setTimeout(() => SH.offer("You're on the High Score table!", 'Brag about it! Make a button with your score on it.', 'Make a brag button', () => bragGo('score', g)), 1200);
    });
    // your own JackNet profile page: brag buttons + the real link to your home page
    Net.on('profile', m => {
      const p = m && m.p; if (!p || !p.me) return;
      setTimeout(() => {
        const head = document.querySelector('#s-members .profile .phead'); if (!head || head.querySelector('.shz-pbtns')) return;
        const d = document.createElement('div'); d.className = 'shz-pbtns';
        d.innerHTML = '<button type="button" class="btn" data-b>&#9733; My brag buttons</button><button type="button" class="btn" data-l>Copy link to my home page</button>';
        d.querySelector('[data-b]').addEventListener('click', () => bragGo());
        d.querySelector('[data-l]').addEventListener('click', () => SH.shareHome(p.name));
        head.appendChild(d);
      }, 30);
    });
  }
  // a "brag" link under the high-score tables
  function scoreLinks() {
    [['arcadeScores', () => { const t = ($('arcadeTitle') || {}).textContent || ''; return gameOf(t); }], ['trisScores', () => 'tris']].forEach(([id, g]) => {
      const ol = $(id); if (!ol || ol.parentNode.querySelector('.shz-hslink')) return;
      const a = document.createElement('a'); a.href = '#'; a.className = 'shz-hslink'; a.textContent = '\u2605 Brag about your high score!';
      a.addEventListener('click', ev => { ev.preventDefault(); bragGo('score', g()); });
      ol.parentNode.insertBefore(a, ol.nextSibling);
    });
  }
  const GAME_BY_TITLE = { 'JACKTRIS': 'tris', 'BLOBBIT LOB': 'squig', 'SQUIG LOB': 'squig', 'SNAKE': 'snake', 'JACK SWEEPER': 'sweep', 'BRICK BASH': 'bricks', 'SAUCER INVADERS': 'invaders', 'ORK INVADERS': 'invaders', 'SPACE ROCKS': 'rocks', 'JACK PONG': 'pong', 'WHACK-A-ROBOT': 'whack', 'WHACK-A-GROT': 'whack', 'SIMON SAYS': 'simon', 'HANGMAN': 'hangman' };
  function gameOf(t) { t = String(t || '').toUpperCase().trim(); if (GAME_BY_TITLE[t]) return GAME_BY_TITLE[t]; const k = Object.keys(GAME_BY_TITLE).find(x => t.includes(x)); return k ? GAME_BY_TITLE[k] : ''; }

  // ---- windows other programs open: Secrets Found (brag about it) and Homepagez PageBuilder (copy the real link)
  function watchWin(el) {
    if (!el || !el.classList || !el.classList.contains('appwin')) return;
    const t = el.getAttribute('aria-label') || '';
    if (t === 'Secrets Found' && !el.querySelector('.shz-secbrag')) {
      const body = el.querySelector('.appbody'); if (!body) return;
      const d = document.createElement('div'); d.className = 'shz-secbrag';
      d.innerHTML = '<button type="button" class="btn">&#9733; Brag about it! (make a button)</button>';
      d.querySelector('.btn').addEventListener('click', () => { if (window.Guest && Guest.is()) return Guest.need('Making brag buttons', () => bragGo('secrets')); bragGo('secrets'); });
      body.appendChild(d);
    }
    setTimeout(() => hookBuilder(el), 400); setTimeout(() => hookBuilder(el), 2000);
  }
  function hookBuilder(el) {
    const bar = el.querySelector && el.querySelector('.hpzb-bar'); if (!bar || bar.querySelector('.shz-pgb')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn shz-pgb'; b.title = 'Copy the real link to your page, to send to anyone';
    b.innerHTML = '&#128279; Copy link to my page';
    b.addEventListener('click', () => { if (!isMember()) return window.Guest ? Guest.need('Sharing your home page', () => SH.shareHome(me().nick)) : null; SH.shareHome(me().nick); });
    bar.appendChild(b);
  }
  whenReady(() => {
    if (window.MutationObserver) new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) watchWin(n); }).observe(document.body, { childList: true });
    drawDisks(); scoreLinks(); setTimeout(scoreLinks, 3000);
  });
  document.addEventListener('section', ev => { if (/^(demos|home)$/.test(String(ev.detail || ''))) scoreLinks(); });

  // ================================================================ copy + share (real links)
  SH.copy = text => new Promise(res => {
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length); const ok = document.execCommand('copy'); ta.remove(); res(ok); } catch (e) { res(false); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => res(true), fallback); } catch (e) {}
    fallback();
  });
  SH.canShare = () => !!(navigator.share);
  SH.share = (o) => { // { title, text, url } -> true if the share sheet opened
    if (!navigator.share) return Promise.resolve(false);
    try { return navigator.share(o).then(() => true, () => false); } catch (e) { return Promise.resolve(false); }
  };
  // a box with the link in it, a Copy button and (where it works) Share...
  SH.linkBox = (title, intro, url, shareText, onCopy) => {
    const b = document.createElement('div'); b.className = 'shz-linkbox';
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${ICONS.card.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<p style="margin:0"></p></div><input type="text" class="shz-lin" readonly><div class="shz-lbtns"><button type="button" class="btn dflt" data-c>Copy link</button>${SH.canShare() ? '<button type="button" class="btn" data-s>Share...</button>' : ''}<button type="button" class="btn" data-x>Close</button></div><p class="shz-lnote">Only send links to people you know. Never put your real address or phone number on the Internet!</p>`;
    b.querySelector('p').textContent = intro;
    const inp = b.querySelector('input'); inp.value = url;
    const w = A.win(title, b, { w: 440, noResize: true, noMax: true, icon: ICONS.card });
    inp.addEventListener('focus', () => inp.select());
    b.querySelector('[data-c]').addEventListener('click', () => SH.copy(url).then(ok => { if (ok) { Desk.toast('Copied!', 'The link is on your clipboard. Paste it into a message to a friend.', 3500); if (onCopy) onCopy(); } else { inp.focus(); inp.select(); Desk.toast('Copy', 'Press Ctrl+C (or hold and choose Copy) to copy the link.', 4000); } }));
    const s = b.querySelector('[data-s]'); if (s) s.addEventListener('click', () => SH.share({ title, text: shareText || intro, url }).then(ok => { if (ok && onCopy) onCopy(); }));
    b.querySelector('[data-x]').addEventListener('click', w.close);
    return w;
  };
  SH.shareHome = name => {
    const k = String(name || '').toLowerCase();
    if (!/^[a-z0-9_-]{2,16}$/.test(k)) return;
    const url = SH.real('/~' + k);
    const mine = isMember() && me().nick.toLowerCase() === k;
    SH.linkBox(mine ? 'Share my home page' : 'Share this home page', mine ? 'Here\'s the real link to your Homepagez page. Anyone who opens it switches on the family PC and lands on your page!' : `Here's the real link to ${name}'s home page. Send it to a friend!`, url, mine ? 'Come and see my home page on JACK ATTACK! Online!' : `Look at ${name}'s home page on JACK ATTACK! Online!`, () => secret('share.hp.link'));
  };

  // ================================================================ decorations: Homepagez pages, the Homepagez front page, WAAAGHooo!
  let lastPage = null; // { k, n } from the last homepage the browser fetched
  if (window.HPZ && HPZ.on) HPZ.on('hpzPage', m => { if (m && m.page && m.k) { lastPage = { k: m.k, n: m.n, at: Date.now() }; setTimeout(hpBar, 60); } });
  let cotmCache = null, cotmAt = 0;
  SH.cotm = (force) => (!force && cotmCache && Date.now() - cotmAt < 60000) ? Promise.resolve(cotmCache) : SH.req({ t: 'shCotm' }).then(r => { if (r && r.m) { cotmCache = r; cotmAt = Date.now(); } return r; });
  function hpBar() {
    const sec = $('s-secret'); if (!sec || !lastPage) return;
    const url = ($('addrBar') || {}).value || '';
    if (!/homepagez\.webcom\//i.test(url)) return;
    let bar = sec.querySelector('.shz-hpbar');
    if (bar && bar.dataset.k === lastPage.k) return;
    if (bar) bar.remove();
    bar = document.createElement('div'); bar.className = 'shz-hpbar'; bar.dataset.k = lastPage.k;
    const n = lastPage.n || lastPage.k, mine = isMember() && me().nick.toLowerCase() === lastPage.k;
    bar.innerHTML = `<div class="shz-hpaward"></div><div class="shz-hprow"><span class="shz-hplbl">&#9733; Like ~${esc(n)}'s page?</span>${mine ? '' : '<button type="button" class="btn" data-v>Vote it Cool Site of the Month!</button>'}<button type="button" class="btn" data-l>Copy link to this page</button><button type="button" class="btn" data-c>Send ${mine ? 'it' : esc(n)} an e-card</button></div>`;
    bar.querySelector('[data-l]').addEventListener('click', () => SH.shareHome(n));
    bar.querySelector('[data-c]').addEventListener('click', () => SH.goP(SH.url('cards'), { to: n }));
    const v = bar.querySelector('[data-v]'); if (v) v.addEventListener('click', () => SH.goP(SH.url('cotm'), { vote: bar.dataset.k }));
    sec.appendChild(bar);
    if (SH.W && SH.W.ringBar) SH.W.ringBar(bar, lastPage.k);
    SH.cotm().then(r => { if (!r || !r.winners || !bar.isConnected) return; const won = r.winners.filter(w => w.k === bar.dataset.k); if (!won.length) return;
      bar.querySelector('.shz-hpaward').innerHTML = won.slice(0, 3).map(w => `<span class="shz-gold p${w.place}">${ICONS.trophy}<b>${w.place === 1 ? 'COOL SITE OF THE MONTH' : w.place === 2 ? 'COOL SITE: RUNNER-UP' : 'COOL SITE: 3RD PLACE'}</b><small>${esc(r.label && w.m === r.m ? r.label : monthName(w.m))} - Homepagez Awards</small></span>`).join(''); });
  }
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = m => { const k = /^\d{4}-(\d{2})$/.exec(String(m || '')); return k ? MN[+k[1] - 1] + ' 1999' : ''; };
  SH.monthName = monthName;
  function cotmBox(sec, where) {
    if (sec.querySelector('.shz-cotmbox')) return;
    const box = document.createElement('div'); box.className = 'shz-cotmbox ' + where;
    box.innerHTML = `<div class="shz-cbh">${ICONS.trophy}<b>Cool Site of the Month</b></div><div class="shz-cbb">Counting the votes...</div>`;
    sec.appendChild(box);
    SH.cotm().then(r => {
      if (!box.isConnected) return; const bb = box.querySelector('.shz-cbb');
      if (!r || !r.m) { bb.textContent = 'The ballot box is stuck. Try later!'; return; }
      const lead = r.standings[0], last = (r.winners || []).find(w => w.place === 1);
      bb.innerHTML = `${lead ? `<p>Leading for <b>${esc(r.label)}</b>: <a href="${esc(homeUrl(lead[0]))}">~${esc(lead[1])}</a> (${lead[3]} vote${lead[3] === 1 ? '' : 's'})</p>` : `<p>Voting is open for <b>${esc(r.label)}</b>! No votes yet: yours could decide it.</p>`}${last ? `<p>Last winner: <a href="${esc(homeUrl(last.k))}">~${esc(last.n)}</a> (${esc(monthName(last.m))})</p>` : ''}<p><a href="${SH.url('cotm')}"><b>Vote now!</b></a> &middot; <a href="${SH.url('cotm', '/league.html')}">Hit Counter League</a> &middot; <a href="${SH.url('cotm', '/ring.html')}">Webring of the Week</a></p>${where === 'wg' ? `<p class="shz-cbc">&#9993; <a href="${SH.url('cards')}">Send a FREE e-card at SparkleCardz!</a></p>` : ''}`;
    });
  }
  const homeUrl = k => 'http://members.homepagez.webcom/~' + k + '/';
  SH.homeUrl = homeUrl;
  document.addEventListener('section', ev => {
    const d = String(ev.detail || '');
    const sec = $('s-secret'); if (!sec) return;
    if (/^site:(www\.)?waaaghooo\.find\/$/.test(d)) setTimeout(() => cotmBox(sec, 'wg'), 50);
    else if (d === 'site:members.homepagez.webcom/' || d === 'site:www.homepagez.webcom/') setTimeout(() => cotmBox(sec, 'hz'), 50);
    else if (/^site:(members|www)\.homepagez\.webcom\//.test(d) && lastPage && Date.now() - lastPage.at < 15000) setTimeout(hpBar, 400);
    if (/^site:/.test(d) && window.Sound && Sound.music && SH.musicOwner && !d.includes(HOST.cards)) { try { Sound.music.stop(); } catch (e) {} SH.musicOwner = null; }
  });

  // ================================================================ secrets
  [['arrive', 'Special delivery', 'Turn up at the family PC by following a link a friend sent you'],
    ['card.send', 'Postie', 'Send an e-card to another JackNet member'], ['card.link', 'Snail mail is dead', 'Send an e-card to somebody out in the real world'],
    ['card.get', "You've been carded", 'Pick up an e-card somebody sent you'], ['card.self', 'Dear me', 'Send an e-card to yourself (go on, you deserve it)'],
    ['card.day', 'Right on the day', 'Send a special-day card ON its special day'], ['card.five', 'Card shark', 'Send cards from five different shelves'],
    ['card.music', 'Easy listening', 'Listen to the music on five different e-cards'], ['card.code', 'Card sharp', 'Pick up an e-card by typing in its card number'],
    ['hp.link', 'Spread the word', 'Get the REAL link to a home page'], ['badge.save', 'Bragging rights', 'Save a brag button onto your computer'],
    ['badge.share', 'Show-off', 'Get a link to show off a brag badge'], ['chain.fwd', 'Fwd: Fwd: Fwd:', 'Keep a chain letter going'],
    ['chain.five', 'Five friends', 'Forward a chain letter to five people in one go'], ['chain.start', 'Patient zero', 'Start a brand-new chain letter'],
    ['chain.tree', 'Family tree', 'Find out exactly where a chain letter has been'], ['chain.hoax', 'Myth buster', 'Find out the truth about chain letters'],
    ['disk.give', 'Sneakernet', 'Give a floppy disk to another member'], ['disk.copy', 'Copy that', 'Copy something off a floppy disk somebody gave you'],
    ['disk.full', 'Disk full', 'Try to squeeze more than 1.44 MB onto a floppy'], ['cotm.vote', 'Ballot box', 'Vote for the Cool Site of the Month'],
    ['cotm.ring', 'Round and round', 'Hop all the way round the Webring of the Week'], ['cotm.win', 'Gold star', 'Win Cool Site of the Month (or come close)'],
  ].forEach(([id, n, hint]) => A.defineSecret('share.' + id, n, hint));
})();

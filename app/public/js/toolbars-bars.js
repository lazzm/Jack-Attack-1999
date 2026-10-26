/* toolbars-bars: the FREE toolbars that pile up in JackNet Explorer, done properly 1999-style: tiled "skins",
 * chunky bevelled logos with mascots, search boxes with category drop-downs, dozens of little buttons with
 * drop-down arrows, flashing banner ads, scrolling tickers, counters, clocks and the odd tiny game.
 * Loaded by oldpc.js (which knows the names, installs them and nags). Every name and domain here is made up. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const rebar = document.querySelector('#browser .rebar'), browser = $('browser');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const ST = store.get('jhp_tbstate', {});
  const S = (k, d) => (k in ST ? ST[k] : d);
  const setS = (k, v) => { ST[k] = v; store.set('jhp_tbstate', ST); };
  if (ST.sign === 'Grotticus') setS('sign', 'Joysticus'); // the secret 13th sign was renamed (theme rebalance)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const phone = () => DesktopSurface.width() < 640;
  const toast = (t, x, ms) => Desk.toast(t, x, ms || 5000);
  const msg = (t, x, ic) => Desk.msgbox(t, x, ic || 'info');
  const secret = id => { try { if (window.Apps && Apps.secret) Apps.secret(id); } catch (e) {} };
  const play = n => { try { Sound.play(n); } catch (e) {} };
  const NAMES = () => (window.OldPC && OldPC.NAMES) || {};
  const plain = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.textContent.replace(/\s+/g, ' ').trim(); };
  const today = () => { const t = window.Desk && Desk.today99 ? Desk.today99() : { m: 1, d: 1 }; return { m: t.m, d: t.d, key: String(t.m).padStart(2, '0') + '-' + String(t.d).padStart(2, '0') }; };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SECS = ['home', 'demos', 'grot', 'saver', 'reviews', 'cheats', 'orks', 'letters', 'art', 'chat', 'forums', 'members'];
  function web(w) { // a site section, or one of the made-up 1999 websites
    browser.classList.remove('min');
    if (SECS.includes(w)) return IE.go(w, 'click');
    if (window.WebPack && WebPack.M && WebPack.M[w]) return WebPack.go(w);
    IE.navigate(w);
  }
  function search(q) { q = String(q || '').trim(); browser.classList.remove('min'); if (window.WebPack && WebPack.go) { WebPack.pendingQuery = q; WebPack.go('search'); } else IE.navigate('search'); }
  const nav = w => () => web(w);
  const say = (t, x) => () => toast(t, x, 6000);
  const box = (t, x) => () => msg(t, x);

  // ================================================================ 16px icons (all hand drawn, all original)
  const IC = {
    globe: '<circle cx="8" cy="8" r="6.5" fill="#2a7ad8" stroke="#003a80"/><path d="M3.5 5c2 .5 3 0 4 2s-1 3 0 5.5M10 2.5c-1 2 1 3 3.5 3.2M10.5 10c1 0 2 .5 2.5 1.5" stroke="#4c4" stroke-width="1.6" fill="none"/>',
    star: '<path d="M8 1l2.1 4.4 4.8.6-3.5 3.3.9 4.8L8 11.8 3.7 14.1l.9-4.8L1.1 6l4.8-.6z" fill="#ffd400" stroke="#a06000"/>',
    mail: '<rect x="1.5" y="3.5" width="13" height="9" fill="#fff" stroke="#555"/><path d="M1.5 3.5l6.5 5 6.5-5" fill="#e8e8f8" stroke="#555"/>',
    news: '<rect x="2" y="2.5" width="12" height="11" fill="#fff" stroke="#444"/><rect x="3.5" y="4" width="4" height="4" fill="#d42020"/><path d="M9 4.5h3.5M9 6.5h3.5M3.5 9.5h9M3.5 11.5h9" stroke="#555"/>',
    sun: '<circle cx="8" cy="8" r="3.4" fill="#ffd400" stroke="#d08000"/><path d="M8 1v2.4M8 12.6V15M1 8h2.4M12.6 8H15M3 3l1.7 1.7M11.3 11.3L13 13M13 3l-1.7 1.7M4.7 11.3L3 13" stroke="#f09000" stroke-width="1.4"/>',
    cloud: '<path d="M4 12.5a3 3 0 0 1 0-6 4 4 0 0 1 7.5-1 3.3 3.3 0 0 1 1 7z" fill="#fff" stroke="#6a7a90"/>',
    rain: '<path d="M4 9.5a2.6 2.6 0 0 1 0-5.2 3.6 3.6 0 0 1 6.8-.8 2.9 2.9 0 0 1 .7 6z" fill="#dde" stroke="#6a7a90"/><path d="M5 11l-1 3M8 11l-1 3M11 11l-1 3" stroke="#2a6ad8" stroke-width="1.3"/>',
    suncloud: '<circle cx="10" cy="5.5" r="3" fill="#ffd400" stroke="#d08000"/><path d="M3.5 13a2.6 2.6 0 0 1 0-5.2 3.6 3.6 0 0 1 6.8-.8 2.9 2.9 0 0 1 .7 6z" fill="#fff" stroke="#6a7a90"/>',
    note: '<path d="M6 12.5V3.5l7-1.5v9" stroke="#000" stroke-width="1.4" fill="none"/><ellipse cx="4.5" cy="12.5" rx="2.2" ry="1.7" fill="#9a2ad8" stroke="#000" stroke-width=".6"/><ellipse cx="11.5" cy="11" rx="2.2" ry="1.7" fill="#9a2ad8" stroke="#000" stroke-width=".6"/>',
    heart: '<path d="M8 14S1.5 9.5 1.5 5.5A3.2 3.2 0 0 1 8 4a3.2 3.2 0 0 1 6.5 1.5C14.5 9.5 8 14 8 14z" fill="#ff2a7a" stroke="#8a0030"/>',
    smile: '<circle cx="8" cy="8" r="6.5" fill="#ffe000" stroke="#a07000"/><circle cx="5.7" cy="6.3" r="1"/><circle cx="10.3" cy="6.3" r="1"/><path d="M4.5 9.2q3.5 4 7 0" stroke="#000" stroke-width="1.2" fill="none"/>',
    gift: '<rect x="2" y="6" width="12" height="8" fill="#e10600" stroke="#600"/><rect x="1.5" y="4" width="13" height="3" fill="#ff3a3a" stroke="#600"/><path d="M8 4v10" stroke="#ffd400" stroke-width="2"/><path d="M8 4C6 0 3 2 5 4M8 4c2-4 5-2 3 0" stroke="#ffd400" stroke-width="1.3" fill="none"/>',
    coin: '<circle cx="8" cy="8" r="6.5" fill="#ffd400" stroke="#a06000"/><circle cx="8" cy="8" r="4.5" fill="none" stroke="#e0a000"/><path d="M9.8 5.3C8 4 6.3 5 6.6 7v4M5.3 8.5h3.5M5.3 11h5" stroke="#8a5000" stroke-width="1.2" fill="none"/>',
    dice: '<rect x="2" y="2" width="12" height="12" rx="2" fill="#fff" stroke="#000"/><circle cx="5" cy="5" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="11" cy="11" r="1.2"/>',
    modem: '<rect x="1.5" y="6" width="13" height="6" rx="1" fill="#d8d0b8" stroke="#555"/><circle cx="4" cy="9" r=".9" fill="#0c0"/><circle cx="6.5" cy="9" r=".9" fill="#0c0"/><circle cx="9" cy="9" r=".9" fill="#c00"/><path d="M11 3q2 1 0 3M12.5 1.5q4 3 0 6" stroke="#2a6ad8" fill="none"/>',
    rocket: '<path d="M8 1c3 2 4 6 3 10H5C4 7 5 3 8 1z" fill="#eee" stroke="#000" stroke-width=".8"/><circle cx="8" cy="6" r="1.6" fill="#4af" stroke="#000" stroke-width=".6"/><path d="M5 8l-3 4 3-1M11 8l3 4-3-1" fill="#e10600" stroke="#000" stroke-width=".6"/><path d="M6 11q2 6 4 0z" fill="#ffa000"/>',
    mag: '<circle cx="6.5" cy="6.5" r="4.5" fill="#cfe8ff" stroke="#333" stroke-width="1.6"/><path d="M10 10l4.5 4.5" stroke="#8a4a1a" stroke-width="2.6"/>',
    bolt: '<path d="M9.5 1L3 9h4l-1.5 6L13 6.5H8.7z" fill="#ffe000" stroke="#a06000" stroke-linejoin="round"/>',
    paw: '<ellipse cx="8" cy="10.5" rx="3.5" ry="3" fill="#7a4a1a"/><circle cx="3.5" cy="7" r="1.6" fill="#7a4a1a"/><circle cx="6" cy="4" r="1.6" fill="#7a4a1a"/><circle cx="10" cy="4" r="1.6" fill="#7a4a1a"/><circle cx="12.5" cy="7" r="1.6" fill="#7a4a1a"/>',
    bell: '<path d="M3 12h10l-1.5-2V7a3.5 3.5 0 0 0-7 0v3z" fill="#ffd400" stroke="#8a5a00"/><circle cx="8" cy="13.5" r="1.4" fill="#8a5a00"/>',
    shield: '<path d="M8 1l6 2.2v4.3c0 4-2.6 6.4-6 7.5-3.4-1.1-6-3.5-6-7.5V3.2z" fill="#2a7ad8" stroke="#003a80"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.8" fill="none"/>',
    trophy: '<path d="M4 2h8v4a4 4 0 0 1-8 0z" fill="#ffd400" stroke="#8a5a00"/><path d="M4 3H1.5c0 3 1.5 4 3 4M12 3h2.5c0 3-1.5 4-3 4" fill="none" stroke="#8a5a00"/><path d="M7 10h2v2H7zM5 12.5h6V15H5z" fill="#c08000" stroke="#8a5a00" stroke-width=".7"/>',
    cart: '<path d="M1 2h2.5l2 8h7.5l1.5-5.5H4.3" fill="none" stroke="#333" stroke-width="1.3"/><rect x="5" y="4.5" width="9" height="4.5" fill="#ff3aa0"/><circle cx="6.5" cy="13" r="1.4" fill="#333"/><circle cx="12" cy="13" r="1.4" fill="#333"/>',
    tv: '<rect x="1.5" y="4" width="13" height="9" rx="1" fill="#555" stroke="#000"/><rect x="3" y="5.5" width="8" height="6" fill="#4af"/><path d="M5 4L3 1M9 4l3-3" stroke="#000"/><circle cx="12.7" cy="7" r=".8" fill="#fc0"/>',
    film: '<rect x="2" y="2" width="12" height="12" fill="#222"/><path d="M4 3v1M4 6v1M4 9v1M4 12v1M12 3v1M12 6v1M12 9v1M12 12v1" stroke="#fff" stroke-width="1.2"/><rect x="6" y="4" width="4" height="8" fill="#6cf"/>',
    pad: '<path d="M3 5h10a2.5 2.5 0 0 1 2.4 3l-.8 4a1.5 1.5 0 0 1-2.6.6L10 11H6l-2 1.6a1.5 1.5 0 0 1-2.6-.6l-.8-4A2.5 2.5 0 0 1 3 5z" fill="#777" stroke="#222"/><path d="M4.5 7v3M3 8.5h3" stroke="#fff" stroke-width="1.2"/><circle cx="11" cy="7.5" r=".9" fill="#e10600"/><circle cx="12.5" cy="9" r=".9" fill="#ffd400"/>',
    clock: '<circle cx="8" cy="8" r="6.5" fill="#fff" stroke="#2a5a9a" stroke-width="1.4"/><path d="M8 4v4l3 2" stroke="#000" stroke-width="1.4" fill="none"/>',
    ball: '<path d="M4 15h8l-1-2H5z" fill="#d4a017" stroke="#000" stroke-width=".6"/><circle cx="8" cy="7.5" r="5.5" fill="#8a3ad8" stroke="#2a0050"/><circle cx="6" cy="5.5" r="1.5" fill="#e0c0ff"/>',
    moon: '<path d="M10 1.5a6.5 6.5 0 1 0 4.5 10.5A5.5 5.5 0 0 1 10 1.5z" fill="#ffe680" stroke="#a08000"/>',
    flame: '<path d="M8 15c-3.5 0-5-2.5-5-5 0-3 3-4 3-8 2 1 3 3 3 5 1-1 1.5-2 1.5-3 2 2 2.5 4 2.5 6 0 3-1.5 5-5 5z" fill="#ff6000" stroke="#a02000"/><path d="M8 15c-1.5 0-2.5-1-2.5-2.5S7 10 7.5 9c.5 1.5 2.5 2 2.5 3.5S9.5 15 8 15z" fill="#ffe000"/>',
    bulb: '<path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.2V12h5V9.7A4.5 4.5 0 0 0 8 1.5z" fill="#ffef60" stroke="#8a7000"/><rect x="5.5" y="12" width="5" height="2.5" fill="#999" stroke="#555"/>',
    chart: '<rect x="1.5" y="1.5" width="13" height="13" fill="#001a00" stroke="#060"/><path d="M3 12l3-4 2 2 3-5 2 2" stroke="#3f3" stroke-width="1.4" fill="none"/>',
    bone: '<path d="M4 6.5a1.8 1.8 0 1 1 1.2-3l5.6 5.6a1.8 1.8 0 1 1-1.3 3.4A1.8 1.8 0 1 1 6.5 9.6L4 7.1z" fill="#fff" stroke="#555" transform="rotate(45 8 8) translate(0 0)"/>',
    tag: '<path d="M1.5 8.5l7-7h6v6l-7 7z" fill="#ffd400" stroke="#8a5a00"/><circle cx="11.5" cy="4.5" r="1.2" fill="#fff" stroke="#8a5a00"/><path d="M5 9l3 3M6.5 7.5l3 3" stroke="#c00"/>',
    gem: '<path d="M8 1l5 4v6l-5 4-5-4V5z" fill="#1f9a2a"/><path d="M8 1v14l-5-4V5z" fill="#5cd85c"/><path d="M8 4.5l2.5 2v3L8 11.5l-2.5-2v-3z" fill="#3cc040"/><path d="M8 1l5 4v6l-5 4-5-4V5z" fill="none" stroke="#063"/><path d="M5 6l2-1.6" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>',
    tooth: '<path d="M3.5 3c1.5-1.5 3-.5 4.5 0 1.5-.5 3-1.5 4.5 0 1.5 2 0 4.5-.5 6.5-.5 2.5-1 4.5-2 4.5s-1-3.5-2-3.5-1 3.5-2 3.5-1.5-2-2-4.5c-.5-2-2-4.5-.5-6.5z" fill="#fff" stroke="#333"/>',
    check: '<rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#555"/><path d="M4 8l3 3 5-6" stroke="#090" stroke-width="2" fill="none"/>',
    warn: '<path d="M8 1.5l7 12.5H1z" fill="#ffd400" stroke="#000"/><path d="M8 6v4" stroke="#000" stroke-width="1.8"/><circle cx="8" cy="12" r="1"/>',
    horn: '<path d="M2 6h3l7-4v12L5 10H2z" fill="#e10600" stroke="#000" stroke-width=".8"/><path d="M13.5 5q2 3 0 6" stroke="#ffd400" stroke-width="1.4" fill="none"/>',
    key: '<circle cx="5" cy="8" r="3.2" fill="none" stroke="#a07000" stroke-width="2"/><path d="M8 8h7M12.5 8v2.5M14.5 8v2" stroke="#a07000" stroke-width="2"/>',
    cd: '<circle cx="8" cy="8" r="6.5" fill="#dde" stroke="#667"/><path d="M3.5 6a5 5 0 0 1 4-3.5" stroke="#f0f" stroke-width="1.3" fill="none"/><path d="M12.5 10a5 5 0 0 1-4 3.5" stroke="#0cf" stroke-width="1.3" fill="none"/><circle cx="8" cy="8" r="1.8" fill="#fff" stroke="#667"/>',
    chat: '<path d="M1.5 2.5h13v8h-7l-3.5 3v-3H1.5z" fill="#fff" stroke="#2a5a9a"/><path d="M4 5.5h8M4 7.8h5" stroke="#2a5a9a"/>',
    q: '<circle cx="8" cy="8" r="6.5" fill="#2a7ad8" stroke="#003a80"/><path d="M5.8 6a2.2 2.2 0 1 1 3 2c-.8.4-.8 1-.8 1.8" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="8" cy="12" r="1" fill="#fff"/>',
    house: '<path d="M1.5 8L8 2l6.5 6" stroke="#7a2a00" stroke-width="1.6" fill="none"/><path d="M3.5 7.5V14h9V7.5L8 3.5z" fill="#f2d16b" stroke="#7a5a00"/><rect x="6.5" y="10" width="3" height="4" fill="#8a4a1a"/>',
    eye: '<path d="M1 8q7-8 14 0-7 8-14 0z" fill="#fff" stroke="#333"/><circle cx="8" cy="8" r="2.6" fill="#2a7ad8"/><circle cx="8" cy="8" r="1.1"/>',
    cursor: '<path d="M3 1v12l3.2-3 2.3 5 2-1-2.3-5H13z" fill="#fff" stroke="#000"/>',
    sparkle: '<path d="M8 1l1.5 5L15 8l-5.5 2L8 15l-1.5-5L1 8l5.5-2z" fill="#ff5ad8" stroke="#80006a" stroke-width=".7"/>',
    sword: '<path d="M13.5 1.5L15 1l-.5 1.5-8 8-1-1z" fill="#ddd" stroke="#333" stroke-width=".8"/><path d="M3.5 9.5l3 3M2 14l3-3" stroke="#8a4a1a" stroke-width="1.8"/>',
    pencil: '<path d="M2 14l1-4 8-8 3 3-8 8z" fill="#ffd400" stroke="#8a5a00"/><path d="M2 14l1-4 3 3z" fill="#f0c090"/>',
    lock: '<rect x="3" y="7" width="10" height="7.5" fill="#ffd400" stroke="#8a5a00"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#666" stroke-width="1.6"/>',
    puzzle: '<path d="M2 4h3a1.5 1.5 0 1 1 3 0h3v3a1.5 1.5 0 1 1 0 3v3H8a1.5 1.5 0 1 0-3 0H2z" fill="#3ac83a" stroke="#064"/>',
    fist: '<path d="M3 6h9a2 2 0 0 1 2 2v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#4caf2a" stroke="#000"/><path d="M6 6v3M9 6v3M12 6.5V9" stroke="#000"/>',
    paint: '<path d="M2 12c3 0 3-3 5-3l2 2c0 2-3 3-7 1z" fill="#e10600" stroke="#600"/><path d="M8 9l6-7 1 1-6 7z" fill="#8a4a1a" stroke="#000" stroke-width=".6"/>',
    skull: '<path d="M8 1.5a5.5 5.5 0 0 0-5 7.8V12h2v2h6v-2h2V9.3a5.5 5.5 0 0 0-5-7.8z" fill="#fff" stroke="#333"/><circle cx="5.8" cy="7.5" r="1.5"/><circle cx="10.2" cy="7.5" r="1.5"/>',
    pound: '<circle cx="8" cy="8" r="6.5" fill="#2fbf2f" stroke="#064"/><path d="M10.2 4.7C8.5 3.4 6.4 4.4 6.8 6.6v4.6M5.2 8.4h4M5.2 11.3h5.6" stroke="#fff" stroke-width="1.3" fill="none"/>',
    radio: '<rect x="1" y="5" width="14" height="9" rx="1" fill="#333" stroke="#000"/><path d="M3 5l8-4" stroke="#999"/><circle cx="5" cy="9.5" r="2.5" fill="#777"/><rect x="9" y="7" width="4" height="2" fill="#3f3"/><circle cx="11" cy="11.5" r="1" fill="#ccc"/>',
    planet: '<circle cx="8" cy="8" r="4.5" fill="#f0a040" stroke="#804000"/><ellipse cx="8" cy="8" rx="7.5" ry="2.2" fill="none" stroke="#ffe080" stroke-width="1.3" transform="rotate(-20 8 8)"/>',
    flower: '<circle cx="8" cy="4" r="2.6" fill="#ff5ad8"/><circle cx="4" cy="7.5" r="2.6" fill="#ff5ad8"/><circle cx="12" cy="7.5" r="2.6" fill="#ff5ad8"/><circle cx="5.5" cy="12" r="2.6" fill="#ff5ad8"/><circle cx="10.5" cy="12" r="2.6" fill="#ff5ad8"/><circle cx="8" cy="8.5" r="2.2" fill="#ffe000"/>',
    house2: '<rect x="2" y="3" width="12" height="10" fill="#fff" stroke="#444"/><path d="M2 5.5h12" stroke="#2a5a9a" stroke-width="2.4"/><circle cx="4" cy="4.2" r=".5" fill="#fff"/>',
  };
  const I = (k, cls) => `<svg class="tbi${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" aria-hidden="true">${IC[k] || IC.star}</svg>`;

  // ================================================================ mascots for the logos (32x32)
  const ORK = '<path d="M3 13l4 1-1 5zM29 13l-4 1 1 5z" fill="#3a8a1a" stroke="#000"/><path d="M6 12q10-10 20 0v10q-10 9-20 0z" fill="#3a8a1a" stroke="#000"/><path d="M8.5 13l6 2.5M23.5 13l-6 2.5" stroke="#000" stroke-width="2"/><circle cx="12" cy="17" r="1.7" fill="#f00"/><circle cx="20" cy="17" r="1.7" fill="#f00"/><path d="M9.5 22h13l-2 4h-9z" fill="#300"/><path d="M10.5 22l1.5-4.5 1.5 4.5M21.5 22L20 17.5 18.5 22" fill="#ffe" stroke="#000" stroke-width=".7"/>';
  const GROTH = '<path d="M2 11l8 3-1 6zM30 11l-8 3 1 6z" fill="#4caf2a" stroke="#000"/><ellipse cx="16" cy="18" rx="9" ry="10" fill="#4caf2a" stroke="#000"/><circle cx="12.5" cy="15" r="2" fill="#e10600"/><circle cx="19.5" cy="15" r="2" fill="#e10600"/><circle cx="12" cy="14.5" r=".6" fill="#fff"/><circle cx="19" cy="14.5" r=".6" fill="#fff"/><path d="M10 21.5q6 5 12 0z" fill="#300" stroke="#000"/><path d="M12 22v2M16 22.8v2.4M20 22v2" stroke="#fff" stroke-width="1.3"/>';
  const MAS = {
    globe: '<circle cx="16" cy="17" r="13" fill="#1e6fd9" stroke="#002060" stroke-width="1.5"/><path d="M6 9c4 0 5 3 9 2s3 5 0 7-1 6-4 7M20 5c-1 3 3 4 7 4M22 21c2 0 4 1 5 3" stroke="#2fbf2f" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M5 12.5h22l-1 4.5h-7.5l-1-2h-3l-1 2H6z" fill="#111"/><path d="M7 13.5h4M20 13.5h4" stroke="#6af" stroke-width="1"/><path d="M10 22q6 6 12 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M27 1l1.2 3.3 3.3 1.2-3.3 1.2L27 10l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#fff" stroke="#fc0" stroke-width=".6"/>',
    grot: GROTH,
    butler: GROTH + '<path d="M8 9.5h16l-2-1V3q-6-3-12 0v5.5z" fill="#111" stroke="#000"/><rect x="10" y="6" width="12" height="2" fill="#a00"/><circle cx="19.5" cy="15" r="3.2" fill="none" stroke="#d4a017" stroke-width="1.2"/><path d="M22.5 16.5q2 5 0 9" stroke="#d4a017" fill="none" stroke-width=".8"/>',
    ork: ORK,
    orkq: '<path d="M10 8Q7 3 4 3M22 8q3-5 6-5" stroke="#000" stroke-width="1.3" fill="none"/><circle cx="4" cy="3" r="2" fill="#ffd400" stroke="#000" stroke-width=".8"/><circle cx="28" cy="3" r="2" fill="#ffd400" stroke="#000" stroke-width=".8"/><path d="M16 6c8 0 11 6 9.5 12-1.3 5.2-5.5 11-9.5 11s-8.2-5.8-9.5-11C5 12 8 6 16 6z" fill="#5ac83a" stroke="#000" stroke-width="1.3"/><ellipse cx="12.5" cy="10" rx="3" ry="1.6" fill="#c8ff9a"/><ellipse cx="11.5" cy="17" rx="3" ry="4.6" transform="rotate(25 11.5 17)"/><ellipse cx="20.5" cy="17" rx="3" ry="4.6" transform="rotate(-25 20.5 17)"/><circle cx="10.6" cy="15.2" r="1" fill="#fff"/><circle cx="19.6" cy="15.2" r="1" fill="#fff"/><path d="M13.5 24q2.5 2 5 0" stroke="#000" stroke-width="1.2" fill="none"/><circle cx="26" cy="25" r="5.5" fill="#8000ff" stroke="#000"/><path d="M24 23.5a2 2 0 1 1 2.8 1.8c-.7.4-.8.8-.8 1.5" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="26" cy="28.5" r=".9" fill="#fff"/>',
    smiley: '<circle cx="16" cy="16" r="13" fill="#ffe000" stroke="#a07000" stroke-width="1.5"/><circle cx="11" cy="12" r="2.2"/><path d="M18.5 12.5q2.5-2.5 5 0" stroke="#000" stroke-width="2" fill="none"/><path d="M8 18q8 10 16 0z" fill="#600" stroke="#000"/><path d="M14 22q2 4 5 0z" fill="#ff5a7a"/><ellipse cx="9" cy="17" rx="2" ry="1.2" fill="#ff8a5a" opacity=".7"/><ellipse cx="23" cy="17" rx="2" ry="1.2" fill="#ff8a5a" opacity=".7"/>',
    hearts: '<path d="M16 29S3 20 3 11a6.5 6.5 0 0 1 13-3 6.5 6.5 0 0 1 13 3c0 9-13 18-13 18z" fill="#ff2a7a" stroke="#8a0030" stroke-width="1.5"/><circle cx="12" cy="13" r="1.6"/><circle cx="20" cy="13" r="1.6"/><path d="M10.5 17q5.5 6 11 0" stroke="#000" stroke-width="1.6" fill="none"/><path d="M8 6.5q2-2 4-1" stroke="#fff" stroke-width="1.5" fill="none"/>',
    rocket: '<path d="M16 2c6 4 8 11 6 19H10C8 13 10 6 16 2z" fill="#f4f4f4" stroke="#000"/><path d="M12 6h8" stroke="#e10600" stroke-width="2"/><circle cx="16" cy="12" r="3.5" fill="#6cf" stroke="#000"/><circle cx="15" cy="11" r="1" fill="#fff"/><path d="M10 15l-6 7 6-1.5zM22 15l6 7-6-1.5z" fill="#e10600" stroke="#000"/><path d="M12 21q4 12 8 0z" fill="#ff8a00"/><path d="M14 21q2 7 4 0z" fill="#ff0"/>',
    crystal: '<path d="M8 29h16l-2.5-5h-11z" fill="#d4a017" stroke="#000"/><circle cx="16" cy="14" r="10.5" fill="#7a2ad8" stroke="#1a0040" stroke-width="1.4"/><circle cx="16" cy="14" r="7" fill="#a060f0" opacity=".6"/><circle cx="12" cy="9.5" r="3" fill="#f0e0ff" opacity=".85"/><path d="M17 9l1.3 3.2 3.3.3-2.5 2.1.8 3.2-2.9-1.8-2.9 1.8.8-3.2-2.5-2.1 3.3-.3z" fill="#fff"/>',
    dog: '<ellipse cx="16" cy="17" rx="9" ry="9" fill="#d08a3a" stroke="#000"/><path d="M7 8c-5 2-5 11-1 13l3-8zM25 8c5 2 5 11 1 13l-3-8z" fill="#6b3a12" stroke="#000"/><ellipse cx="16" cy="22" rx="5.5" ry="4" fill="#f4d4a4"/><circle cx="12.5" cy="15" r="1.8"/><circle cx="19.5" cy="15" r="1.8"/><circle cx="12" cy="14.4" r=".6" fill="#fff"/><circle cx="19" cy="14.4" r=".6" fill="#fff"/><ellipse cx="16" cy="19.5" rx="2.2" ry="1.5"/><path d="M14.8 23.5h2.4v3.5a1.2 1.2 0 0 1-2.4 0z" fill="#ff5a7a" stroke="#a02040" stroke-width=".6"/>',
    sun: '<g stroke="#ff9000" stroke-width="2.4" stroke-linecap="round"><path d="M14 1v4M14 23v3M2 13h3M23 13h3M5 4l2.5 2.5M23 4l-2.5 2.5M5 22l2.5-2.5"/></g><circle cx="14" cy="13" r="8" fill="#ffd400" stroke="#c07000" stroke-width="1.3"/><path d="M7.5 11h13l-.8 3h-4.6l-.8-1.5h-1.6l-.8 1.5H8.3z" fill="#111"/><path d="M10.5 16.5q3.5 3 7 0" stroke="#000" stroke-width="1.4" fill="none"/><path d="M15 30a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.5-1 4.5 4.5 0 0 1 1 10z" fill="#fff" stroke="#5a7aa0" stroke-width="1.3"/>',
    raincloud: '<path d="M8 21a6 6 0 0 1 0-12 8 8 0 0 1 15-1.5A6.5 6.5 0 0 1 25 21z" fill="#b8c0cc" stroke="#4a5a70" stroke-width="1.4"/><circle cx="12.5" cy="14" r="1.3"/><circle cx="19.5" cy="14" r="1.3"/><path d="M12 18.5q4-3 8 0" stroke="#000" stroke-width="1.3" fill="none"/><path d="M10 23l-2 5M16 23l-2 5M22 23l-2 5" stroke="#2a6ad8" stroke-width="2" stroke-linecap="round"/>',
    robot: '<path d="M16 2v5" stroke="#000" stroke-width="1.5"/><circle cx="16" cy="3" r="2.2" fill="#f33" stroke="#000" stroke-width=".7"/><rect x="6" y="7" width="20" height="17" rx="3" fill="#a0b4c4" stroke="#000"/><rect x="9" y="10.5" width="14" height="7" rx="1" fill="#023"/><rect x="10.5" y="12.5" width="4" height="3" fill="#0f6"/><rect x="17.5" y="12.5" width="4" height="3" fill="#0f6"/><path d="M11 21h10" stroke="#000" stroke-width="2" stroke-dasharray="2 1"/><rect x="2.5" y="12" width="3.5" height="7" fill="#6a7e8e" stroke="#000"/><rect x="26" y="12" width="3.5" height="7" fill="#6a7e8e" stroke="#000"/><rect x="11" y="24" width="10" height="5" fill="#6a7e8e" stroke="#000"/>',
    piggy: '<circle cx="15.5" cy="5.5" r="4" fill="#ffd400" stroke="#a06000"/><path d="M13.8 5.5h3.4" stroke="#a06000"/><ellipse cx="16" cy="19" rx="12" ry="9" fill="#ff9ec4" stroke="#000"/><path d="M8 12l1-5 4.5 3.5z" fill="#ff9ec4" stroke="#000"/><rect x="12" y="10.5" width="8" height="2" rx="1" fill="#600"/><ellipse cx="27" cy="19" rx="3" ry="3.5" fill="#ff7aa8" stroke="#000"/><circle cx="26.3" cy="18" r=".7"/><circle cx="26.3" cy="20.2" r=".7"/><circle cx="21" cy="15.5" r="1.5"/><path d="M8 26v4h3.5v-3M19 26.5V30h3.5v-4" fill="#ff9ec4" stroke="#000"/><path d="M4 18q-3-1-2 2" stroke="#000" fill="none"/>',
    notey: '<path d="M13 23V6l15-4v17" stroke="#000" stroke-width="2.6" fill="none"/><path d="M13 9l15-4" stroke="#000" stroke-width="4"/><ellipse cx="8.5" cy="24" rx="6.5" ry="5.5" fill="#b03ad8" stroke="#000" stroke-width="1.3"/><ellipse cx="23" cy="20" rx="6.5" ry="5.5" fill="#ff3aa0" stroke="#000" stroke-width="1.3"/><circle cx="6.5" cy="22.5" r="1.2" fill="#fff"/><circle cx="10.5" cy="22.5" r="1.2" fill="#fff"/><path d="M6.5 25.5q2 1.8 4 0" stroke="#fff" stroke-width="1.2" fill="none"/><circle cx="21" cy="18.5" r="1.2" fill="#fff"/><circle cx="25" cy="18.5" r="1.2" fill="#fff"/><path d="M21 21.5q2 1.8 4 0" stroke="#fff" stroke-width="1.2" fill="none"/>',
    megaphone: '<path d="M3 11h6l14-8v26L9 21H3z" fill="#e10600" stroke="#000" stroke-width="1.3"/><rect x="5" y="21" width="5" height="8" fill="#555" stroke="#000"/><path d="M26 10q4 6 0 12M28.5 6q6.5 10 0 20" stroke="#ffd400" stroke-width="2.2" fill="none"/><path d="M12 11l6-3.5v17L12 21" fill="#ff5a5a"/>',
    gem: '<path d="M16 2l11 8v12l-11 8-11-8V10z" fill="#1f9a2a"/><path d="M16 2v28l-11-8V10z" fill="#5cd85c"/><path d="M16 8l6 4.5v7L16 24l-6-4.5v-7z" fill="#3cc040"/><path d="M16 2l11 8v12l-11 8-11-8V10z" fill="none" stroke="#000" stroke-width="1.4"/><path d="M9 11l4-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12.5" cy="15" r="1.6"/><circle cx="19.5" cy="15" r="1.6"/><path d="M12 19q4 3.5 8 0" stroke="#000" stroke-width="1.4" fill="none"/>',
    tooth: '<path d="M6 6c3-4 7-2 10-1 3-1 7-3 10 1 3 5 0 10-1 14-1 5-2 9-4 9s-2-7-5-7-3 7-5 7-3-4-4-9C6 16 3 11 6 6z" fill="#fff" stroke="#000" stroke-width="1.4"/><circle cx="12" cy="12" r="1.6"/><circle cx="20" cy="12" r="1.6"/><path d="M11 16.5q5 4 10 0" stroke="#000" stroke-width="1.4" fill="none"/><path d="M26 2l1 2.8 2.8 1-2.8 1L26 9.6l-1-2.8-2.8-1 2.8-1z" fill="#ffd400" stroke="#a06000" stroke-width=".6"/>',
    shield: '<path d="M16 2l12 4v8c0 8-5 13.5-12 16C9 27.5 4 22 4 14V6z" fill="#1e6fd9" stroke="#000" stroke-width="1.3"/><path d="M16 5l9 3v6c0 6-4 10.5-9 12.5z" fill="#4cb4ff"/><circle cx="12" cy="13" r="1.8" fill="#fff"/><circle cx="20" cy="13" r="1.8" fill="#fff"/><circle cx="12" cy="13.3" r=".9"/><circle cx="20" cy="13.3" r=".9"/><path d="M10.5 18q5.5 5 11 0" stroke="#fff" stroke-width="1.8" fill="none"/><path d="M16 26.5l1-2 2.2-.2-1.6-1.5.4-2.2L16 21.7l-2 1 .4 2.2-1.6 1.5 2.2.2z" fill="#ffd400"/>',
    cursorguy: '<path d="M6 2v25l6.5-6 4.2 9.5 4.6-2-4.3-9.5H25z" fill="#fff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="14" r="1.5"/><circle cx="14" cy="16" r="1.5"/><path d="M9 18.5q2.5 2.5 5.5 1" stroke="#000" stroke-width="1.2" fill="none"/><path d="M26 4l1 2.5 2.5 1-2.5 1L26 11l-1-2.5-2.5-1 2.5-1z" fill="#ff3ad8"/><path d="M28 16l.7 1.6 1.6.7-1.6.7L28 20.6l-.7-1.6-1.6-.7 1.6-.7z" fill="#3ad8ff"/>',
    arrow: '<path d="M6 2v25l6.5-6 4.2 9.5 4.6-2-4.3-9.5H25z" fill="#b040ff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8v10" stroke="#e8b0ff" stroke-width="2"/><path d="M24 3l1 2.5 2.5 1-2.5 1L24 10l-1-2.5-2.5-1 2.5-1z" fill="#ffe000" stroke="#a06000" stroke-width=".5"/>',
    squig: '<path d="M5 8.5q-1-6 4.5-4.5l-.5 5zM27 8.5q1-6-4.5-4.5l.5 5z" fill="#e8381b" stroke="#000" stroke-width="1.2"/><ellipse cx="10" cy="28.5" rx="4" ry="2.2" fill="#c82010" stroke="#000" stroke-width="1.1"/><ellipse cx="22" cy="28.5" rx="4" ry="2.2" fill="#c82010" stroke="#000" stroke-width="1.1"/><circle cx="16" cy="16.5" r="12" fill="#e8381b" stroke="#000" stroke-width="1.3"/><path d="M6.5 23q9.5 9 19 0q-9.5 5-19 0z" fill="#b81e10"/><ellipse cx="10.5" cy="10" rx="3" ry="2" fill="#ffb0a0" transform="rotate(-30 10.5 10)"/><ellipse cx="11.5" cy="14.5" rx="3.4" ry="4" fill="#fff" stroke="#000"/><ellipse cx="20.5" cy="14.5" rx="3.4" ry="4" fill="#fff" stroke="#000"/><circle cx="12.3" cy="15.3" r="1.8"/><circle cx="21.3" cy="15.3" r="1.8"/><circle cx="11.5" cy="14.3" r=".7" fill="#fff"/><circle cx="20.5" cy="14.3" r=".7" fill="#fff"/><path d="M10.5 20.5q5.5 6.5 11 0z" fill="#5a0010" stroke="#000"/><ellipse cx="16" cy="23.2" rx="2.4" ry="1.1" fill="#ff7aa0"/><ellipse cx="7.5" cy="19.5" rx="1.8" ry="1" fill="#ff9ab0"/><ellipse cx="24.5" cy="19.5" rx="1.8" ry="1" fill="#ff9ab0"/>',
    brain: '<path d="M6 18c-4-3-2-9 2-10 0-4 6-6 8-3 3-3 9-1 9 3 4 1 5 7 2 10 1 4-3 7-6 6-2 3-8 3-10 0-4 1-7-3-5-6z" fill="#ffa8c8" stroke="#000" stroke-width="1.2"/><path d="M16 6v6M10 10q3 2 0 4M22 10q-3 2 0 4M16 22v5" stroke="#c0507a" fill="none" stroke-width="1.2"/><circle cx="11" cy="17" r="3.2" fill="#fff" fill-opacity=".5" stroke="#000" stroke-width="1.4"/><circle cx="21" cy="17" r="3.2" fill="#fff" fill-opacity=".5" stroke="#000" stroke-width="1.4"/><path d="M14.2 17h3.6" stroke="#000" stroke-width="1.4"/><circle cx="11" cy="17" r="1"/><circle cx="21" cy="17" r="1"/>',
    bug: '<path d="M7 15l-5-2.5M7 20H1.5M7 25l-5 2.5M25 15l5-2.5M25 20h5.5M25 25l5 2.5M13 4l-3-3M19 4l3-3" stroke="#000" stroke-width="1.6"/><ellipse cx="16" cy="19.5" rx="9" ry="10" fill="#d42020" stroke="#000" stroke-width="1.3"/><path d="M16 10v19.5" stroke="#000"/><circle cx="16" cy="8" r="5" fill="#222" stroke="#000"/><circle cx="14" cy="7" r="1.3" fill="#ff0"/><circle cx="18" cy="7" r="1.3" fill="#ff0"/><rect x="9" y="17.5" width="14" height="7" fill="#000" rx="1"/><text x="16" y="23.4" font-size="6.6" font-weight="bold" text-anchor="middle" fill="#ff0" font-family="Arial,sans-serif">2000</text>',
    boombox: '<path d="M8 9V5h16v4" stroke="#aaa" stroke-width="1.8" fill="none"/><rect x="2" y="9" width="28" height="17" rx="2" fill="#2a2a2a" stroke="#000"/><circle cx="9" cy="18.5" r="5.2" fill="#555" stroke="#aaa"/><circle cx="9" cy="18.5" r="2.2" fill="#111"/><circle cx="23" cy="18.5" r="5.2" fill="#555" stroke="#aaa"/><circle cx="23" cy="18.5" r="2.2" fill="#111"/><rect x="13" y="11.5" width="6" height="3" fill="#3f3"/><path d="M14 21h4" stroke="#e10600" stroke-width="2"/>',
    horseshoe: '<path d="M7 29V14a9 9 0 0 1 18 0v15h-5.5V14a3.5 3.5 0 0 0-7 0v15z" fill="#ffd400" stroke="#8a5a00" stroke-width="1.5"/><circle cx="9.3" cy="24" r="1" fill="#8a5a00"/><circle cx="9.3" cy="18" r="1" fill="#8a5a00"/><circle cx="22.7" cy="24" r="1" fill="#8a5a00"/><circle cx="22.7" cy="18" r="1" fill="#8a5a00"/><circle cx="16" cy="7.5" r="1" fill="#8a5a00"/><path d="M27 1l1.2 3.3 3.3 1.2-3.3 1.2L27 10l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#fff" stroke="#e000a0" stroke-width=".7"/><path d="M4 2l.8 2 2 .8-2 .8L4 7.6l-.8-2-2-.8 2-.8z" fill="#fff" stroke="#00a0e0" stroke-width=".6"/>',
    bag: '<path d="M11 12V8a5 5 0 0 1 10 0v4" stroke="#000" stroke-width="2.2" fill="none"/><path d="M5 11h22l-2 19H7z" fill="#ff3aa0" stroke="#000" stroke-width="1.3"/><circle cx="16" cy="21" r="5.5" fill="#e8381b" stroke="#000"/><circle cx="14" cy="19.5" r="1.3" fill="#fff"/><circle cx="18" cy="19.5" r="1.3" fill="#fff"/><path d="M13 23q3 2.5 6 0" stroke="#000" fill="#300"/>',
    bolt: '<path d="M19 1L5 18h9l-3 13 15-18h-9z" fill="#ffe000" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/><circle cx="13" cy="14" r="1.4"/><circle cx="18" cy="14" r="1.4"/><path d="M12.5 17.5q3 2 6 0" stroke="#000" stroke-width="1.2" fill="none"/>',
    chartup: '<rect x="2" y="3" width="28" height="22" fill="#001a00" stroke="#0a0" stroke-width="1.4"/><path d="M5 20l6-6 4 3 6-8 6 3" stroke="#3f3" stroke-width="2" fill="none"/><path d="M5 26h22" stroke="#666" stroke-width="3"/><path d="M8 29h16" stroke="#444" stroke-width="2"/><path d="M24 6l3 3-1 1" stroke="#3f3" stroke-width="2" fill="none"/>',
  };
  const M = (k, cls) => `<svg class="tbm${cls ? ' ' + cls : ''}" viewBox="0 0 32 32" aria-hidden="true">${MAS[k] || MAS.grot}</svg>`;

  // ================================================================ widget builders
  // Each toolbar is rows of widgets. Every widget becomes a ".tbit" (so the » chevron can list the ones that don't fit).
  const btn = (ic, label, act, o) => ({ t: 'b', ic, label, a: act, m: null, o: o || {} });
  const menuBtn = (ic, label, items, o) => ({ t: 'b', ic, label, m: items, o: o || {} });
  const srch = o => Object.assign({ t: 's' }, o);
  const ad = (frames, go, cls, w) => ({ t: 'ad', frames, go, cls, w });
  const tick = (label, items, cls, speed) => ({ t: 'tk', label, items, cls, speed });
  const cnt = (label, fn, cls) => ({ t: 'c', label, fn, cls });
  const txt = (html, cls) => ({ t: 'tx', html, cls });
  const sep = { t: 'sep' };
  const cust = (label, html, wire, cls) => ({ t: 'x', label, html, wire, cls });
  const lcd = (fn, cls) => ({ t: 'c', label: '', fn, cls: 'tblcd ' + (cls || '') });

  function under(el, items) { const r = el.getBoundingClientRect(); IE.menu(typeof items === 'function' ? items() : items, r.left, r.bottom); }

  // ================================================================ content helpers (news, weather, horoscopes...)
  function calNews(n) {
    try {
      const k = today().key, posts = (window.CAL && CAL.posts || []).filter(p => p[0] <= k).sort((a, b) => (a[0] < b[0] ? 1 : -1));
      return posts.slice(0, n || 8).map(p => ({ tag: p[1], text: plain(p[2]) }));
    } catch (e) { return []; }
  }
  function tl(kind) { try { return window.Timeline ? Timeline.now(kind) : []; } catch (e) { return []; } }
  const MONTH_T = [6, 7, 10, 13, 16, 19, 21, 21, 18, 14, 10, 7];
  const WX = [['sun', 'Sunny!'], ['suncloud', 'Sunny spells'], ['cloud', 'Cloudy'], ['rain', 'Rain'], ['cloud', 'Grey'], ['rain', 'Drizzle'], ['suncloud', 'Bright-ish']];
  function weatherFor(off) {
    const t = today(), dt = new Date(1999, t.m - 1, t.d + off), h = hash('wx' + dt.toDateString());
    const w = WX[h % WX.length], temp = MONTH_T[dt.getMonth()] + (h >>> 4) % 7 - 3;
    return { ic: w[0], txt: w[1], temp, day: DAYS[dt.getDay()] };
  }
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  function horoscope(sign) {
    const h = hash(sign + today().key);
    const A = ['A mysterious stranger will lend you a pencil.', 'Today is a good day to finally do one whole side of the Rubrick\'s cube.', 'Beware of anyone carrying a talking toy owl.', 'Your modem will connect first time. Treasure this moment.', 'Someone will say "it\'s not a phase, Mom". It might be you.', 'A floppy disk from your past will come back to haunt you. It will say "Disk Error".', 'You will find 20p down the back of the sofa. Spend it wisely (on sweets).', 'The stars say: tidy your room. The stars sound a lot like your Mom.', 'An old friend will send you a chain e-mail. Do NOT forward it.', 'Great fortune awaits you in the bottom of a cereal box.', 'Today you will beat your high score. Or someone else will. Probably Dave.', 'A Furby will look at you funny. Do not feed it after midnight.'];
    const B = ['Lucky colour: ' + pick2(h, ['beige (like all PCs)', 'Blueberry', 'Zapachu yellow', 'Game Lad green', 'Tangerine', 'grey (JackOS 98 grey)', 'Y2K silver']), 'Lucky number: ' + (h % 56 + 1), 'Lucky snack: ' + pick2(h >>> 3, ['crisps', 'a chocolate biscuit', 'Wotsits', 'toast', 'a whole selection box']), 'Best avoided: ' + pick2(h >>> 5, ['homework', 'the Water Temple', 'Dave\'s cat', 'dial-up during teatime', 'pressing the Turbo button'])];
    return A[h % A.length] + ' ' + B[(h >>> 2) % B.length] + '.';
  }
  function pick2(h, a) { return a[h % a.length]; }
  const ORK_ANSWERS = ['Signs point to yes. (The signs point everywhere.)', 'Blow on the cartridge and try again.', 'Have you tried turning it off and on again?', 'Ask again after the modem stops screeching.', 'Dunno. Ask Dave, he has the strategy guide.', 'Reply hazy. Your monitor needs dusting.', "Yes. Unless it's no. Then no.", 'Only if you hold down A+B while you ask.', 'My sources say: up, up, down, down, left, right, left, right.', 'Rupees. The answer is always Rupees.'];
  function orkAnswer(q) {
    const l = q.toLowerCase();
    if (/red|fast|quick|speed/.test(l)) return 'Red ones go faster. Ask any Micro Machines fan.';
    if (/gun|shoot|dakka|golden/.test(l)) return 'Pick Oddjob in Goldenballs. Everyone hates it. Do it anyway.';
    if (/food|eat|hungry|dinner|tea/.test(l)) return 'Pot Noodle. The answer is always Pot Noodle.';
    if (/money|cost|price|pay|quid/.test(l)) return "That'll be ten Rupees.";
    if (/y2k|millennium|2000/.test(l)) return "The Millennium Bug? Unplug the video recorder and hope.";
    if (/homework|school/.test(l)) return 'Yes. Sorry. Even this toolbar can\'t get you out of that one.';
    return pick(ORK_ANSWERS);
  }
  const JOKES = ['Why did the racing car paint itself red? Because red ones go faster!', 'What do you call a Eggbert with no batteries? A keyring.','Why did the computer go to the doctor? It had a virus!', 'How many programmers does it take to change a light bulb? None, that is a hardware problem.', 'Knock knock. Who is there? The Millennium Bug. The Millennium Bug who? Exactly, nobody knows.', 'Why was the floppy disk sad? Nobody wanted to be its 1.44 MB-FF.', 'Why did the Game Lad go to bed? Its batteries were flat.', 'Why did the modem go to bed early? It was all worn out from the screeching.'];
  const FACTS = ['A floppy disk holds 1.44 megabytes.', 'The Ultra 64 has 4 megabytes of memory. 8 with the Expansion Pak!', 'There are 151 Pocket Critters.', 'Red ones go faster. Science.', 'Blockology was invented in Moscow in 1984.', 'A CD-ROM holds about 650 megabytes. That is 451 floppy disks!'];
  function talk(t, who, pitch) {
    toast(who + ' says:', t, 6000);
    try { if (window.speechSynthesis && window.Sound && Sound.on) { const u = new SpeechSynthesisUtterance(t); u.pitch = pitch || 1.6; u.rate = 1.05; speechSynthesis.cancel(); Sound.speak(u); } } catch (e) {}
  }
  const insertChat = s => { const i = $('chatInput'); if (!i) return; i.value += (i.value ? ' ' : '') + s; IE.go('chat', 'click'); setTimeout(() => i.focus(), 50); };
  const bundle = k => () => window.OldPC && OldPC.bundle(k);
  const comingSoon = n => () => toast(n, pick(['This feature is coming in version 2.0. Version 2.0 is coming in the year 2000.', 'Coming soon! (Probably.)', 'Please insert the JackNet Toolbar CD (Disc 3 of 7).', 'Error 1999: feature not found. Have you tried turning it off and on again?']));
  function panel(anchor, html, wire) { // a little pop-down panel under a toolbar button (emoticon pickers etc.)
    document.querySelectorAll('.tbpanel').forEach(p => p.remove());
    const p = document.createElement('div'); p.className = 'tbpanel'; p.innerHTML = html; DesktopSurface.root().appendChild(p);
    const r = DesktopSurface.rect(anchor), pr = DesktopSurface.rect(p);
    p.style.left = Math.max(2, Math.min(r.left, DesktopSurface.width() - pr.width - 4)) + 'px'; p.style.top = Math.min(r.bottom + 1, DesktopSurface.height() - pr.height - 34) + 'px';
    const off = ev => { if (!p.contains(ev.target) && ev.target !== anchor && !anchor.contains(ev.target)) { p.remove(); document.removeEventListener('pointerdown', off, true); } };
    setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
    if (wire) wire(p, () => { p.remove(); document.removeEventListener('pointerdown', off, true); });
    return p;
  }
  // 24 little faces for SmileyPop, all drawn here
  const FACE_C = ['#ffe000', '#ffb000', '#7ad8ff', '#ff8ad8', '#8aff6a', '#ff6a5a', '#c08aff', '#ffffff'];
  const MOUTHS = ['<path d="M9 19q7 7 14 0" stroke="#000" stroke-width="2" fill="none"/>', '<path d="M9 18q7 9 14 0z" fill="#600" stroke="#000"/>', '<path d="M10 22q6-5 12 0" stroke="#000" stroke-width="2" fill="none"/>', '<circle cx="16" cy="21" r="3" fill="#600" stroke="#000"/>', '<path d="M10 20h12" stroke="#000" stroke-width="2"/>', '<path d="M9 18q7 8 14 0z" fill="#600" stroke="#000"/><path d="M14 21q2 4 4 0z" fill="#ff5a7a"/>'];
  const EYES = ['<circle cx="11" cy="12" r="2"/><circle cx="21" cy="12" r="2"/>', '<circle cx="11" cy="12" r="2"/><path d="M18 12h6" stroke="#000" stroke-width="2"/>', '<path d="M8 13q3-4 6 0M18 13q3-4 6 0" stroke="#000" stroke-width="2" fill="none"/>', '<rect x="7" y="9.5" width="18" height="5" rx="1.5" fill="#111"/><path d="M14 11.5h4" stroke="#333"/>', '<path d="M9 9l4 3M23 9l-4 3" stroke="#000" stroke-width="2"/><circle cx="11" cy="13.5" r="1.6"/><circle cx="21" cy="13.5" r="1.6"/>', '<path d="M8 12l3-3 3 3M18 12l3-3 3 3" stroke="#000" stroke-width="2" fill="none"/>'];
  const FACE_N = ['grin', 'wink', 'happy', 'shades', 'cross', 'laugh', 'oooh', 'meh', 'cheeky', 'chuffed', 'cool', 'gobsmacked', 'grumpy', 'giggle', 'zonked', 'hmm', 'beam', 'blush', 'eek', 'smug', 'waaagh', 'yawn', 'silly', 'wow'];
  const face = i => `<svg viewBox="0 0 32 32" class="tbface" aria-hidden="true"><circle cx="16" cy="16" r="13.5" fill="${FACE_C[i % 8]}" stroke="#000" stroke-width="1.4"/>${EYES[(i * 5) % 6]}${MOUTHS[(i * 7 + (i >> 2)) % 6]}</svg>`;

  // ================================================================ THE TOOLBARS
  // h: 1 normal, 't' tall, 2 two rows. skin: tiled pattern (css/toolbars.css). lc: logo lettering style.
  const D = {};
  const GO = { ph: 'Search the Web...', cats: ['The Web', 'Pictures', 'MIDI files', 'Cheats', 'Homepages', 'Pocket Critters'] };

  D.mega = { skin: 'chrome', h: 2, m: 'globe', lc: 'lg-chrome', logo: 'Mega<i>Search</i><sup>2000</sup>', rows: [
    [srch({ ph: 'Type it. Find it. Mega it.', cats: ['The Web', 'Pictures', 'MIDI files', 'Cheats', 'Recipes', 'Homepages', 'Rupees'], go: 'MegaSearch!' }),
      btn('bulb', 'Highlight', () => document.body.classList.toggle('hilite')),
      cnt('Pop-ups blocked: ', () => '0', 'tbcnt-r'), txt('(we block nothing)', 'tbsmall'),
      menuBtn('check', 'Spell Check', [{ label: 'Check spelling on this page', act: box('MegaSpell', 'MegaSpell found 1,999 spelling mistakes on this page.\n\nMost of them were "Pocket Critters". Nobody knows where the accent goes.') }, { label: 'Spell "millennium" for me', act: box('MegaSpell', 'M-I-L-L-E-N-N-I-U-M.\n\nTwo Ls, two Ns. Everyone gets it wrong. Even the people selling Millennium Mugs.') }]),
      ad(['<b>FREE</b> 500 hours!', 'Get on-line NOW!', '<b>56K!!!</b> (ish)'], () => window.OldPC && OldPC.popup(true), 'a-blu', 120)],
    [menuBtn('news', 'News', () => calNews(6).map(p => ({ label: p.tag + ': ' + p.text.slice(0, 54) + (p.text.length > 54 ? '...' : ''), act: box('MegaNews: ' + p.tag, p.text) })).concat(['-', { label: 'More news...', act: nav('news') }])),
      menuBtn('trophy', 'Sport', [{ label: 'Football results', act: nav('rovers') }, { label: 'Yo-yo league table', act: nav('~lee') }, { label: 'Robot fighting (on telly)', act: say('MegaSport', 'Sir Killalot won. Sir Killalot always wins.') }, { label: 'Tiddlywinks (live)', act: comingSoon('MegaSport') }]),
      menuBtn('pad', 'Games', [{ label: 'Play games now!', act: nav('demos') }, { label: 'Cheats & tips', act: nav('cheats') }, { label: 'Top 100 Cheats (well, 40)', act: nav('top100cheats') }, { label: 'High Score Hall of Fame', act: nav('hz-hiscore') }]),
      menuBtn('cart', 'Shopping', [{ label: 'Gem Exchange', act: nav('teef') }, { label: 'Compare prices', act: say('MegaShop', 'Everything costs more than your pocket money. Comparison complete.') }, { label: 'Install TurboCoupon Saver', act: bundle('coupon') }]),
      menuBtn('chat', 'Chat', [{ label: 'JACK ATTACK! Chat Room', act: nav('chat') }, { label: 'ChatterBox rooms', act: nav('chatterbox') }, { label: 'The Back Room', act: nav('chatroom') }]),
      menuBtn('mail', 'E-mail', [{ label: 'JackMail (FREE!)', act: nav('jackmail') }, { label: 'Send an eCard', act: nav('ecardz') }, { label: 'Check for new mail', act: say('MegaMail', 'You have 0 new messages. Your cousin is having a quiet day.') }]),
      cust('Weather', () => { const w = weatherFor(0); return `${I(w.ic)}<span class="tbwx">${w.temp}&deg;C</span>`; }, el => el.addEventListener('click', nav('weather')), 'tbclick'),
      btn('star', 'Horoscope', () => (has('stargazer') ? msg('Your Horoscope', horoscope(S('sign', 'Aries'))) : window.OldPC && OldPC.bundle('stargazer'))),
      btn('smile', 'Jokes', () => talk(pick(JOKES), 'MegaSearch')),
      menuBtn('gift', 'FREE Stuff', [{ label: 'FREE downloads!!!', act: nav('downloads') }, { label: 'FREE homepage tools', act: nav('freetoolz') }, { label: 'FREE money (not free, not money)', act: nav('getrich') }, '-', { label: 'Install more FREE toolbars', act: bundle() }]),
      lcd(() => new Date().toTimeString().slice(0, 5), 'tblcd-s')],
  ] };

  D.search = { skin: 'squigs', h: 't', m: 'grot', lc: 'lg-grot', logo: 'Gubbinz<i>Search</i>', rows: [[
    srch(Object.assign({ go: 'Search!', w: 150 }, GO)),
    btn('bulb', 'Highlight', () => document.body.classList.toggle('hilite')),
    menuBtn('pad', 'Games', [{ label: 'Games Arcade', act: nav('demos') }, { label: 'Cheats', act: nav('cheats') }, { label: 'Blobbit Lob tips', act: say('GubbinzSearch', 'Lob it higher. No, higher. HIGHER.') }]),
    menuBtn('grot', 'Gubbinz Stuff', [{ label: 'Feed Gubbinz', act: nav('grot') }, { label: 'The Silly Translator', act: nav('orktranslate') }, { label: 'The Mushroom Page', act: nav('hz-fungus') }]),
    cnt('Pop-up Blocker: ', () => '<span class="tboff">OFF</span>'),
    ad(['GAMES!!! <b>FREE</b>', 'Click here to WIN!', 'Go on. Click it.'], nav('megaflash'), 'a-grn', 104),
    menuBtn('news', 'News', () => calNews(5).map(p => ({ label: p.text.slice(0, 50) + '...', act: box('GubbinzSearch News', p.text) }))),
    btn('mail', 'Mail', nav('jackmail')),
    cnt('Searches today: ', () => (1999 + Math.floor(Date.now() / 7000) % 999).toLocaleString('en-GB'))]] };

  D.smileys = { skin: 'hearts', h: 1, m: 'hearts', lc: 'lg-bubble', logo: 'FREE Smileys!!!', rows: [[
    ...[':-)', ';-)', ':-D', ':-P', '8-)', ':-O', '>:-(', '^_^', '<3', ':-*', 'XD'].map(s => btn(null, esc(s), () => insertChat(s), { cls: 'tbemo' })),
    menuBtn('heart', 'More', [{ label: 'Hearts pack (FREE!)', act: () => insertChat('<3 <3 <3') }, { label: 'Robot smileys', act: () => insertChat('[:-] BEEP BOOP') }, { label: 'Get SmileyPop!', act: bundle('smileypop') }]),
    txt('Click one to put it in the chat!', 'tbad-i'),
    ad(['Smileys for <b>E-MAIL</b>!', 'Over 9 faces!!!', 'All FREE!!!'], bundle('smileypop'), 'a-pink', 120)]] };

  D.waaaghoo = { skin: 'violet', h: 't', m: 'orkq', lc: 'lg-ork', logo: '<span style="color:#ffd400">WAAAGH</span>oo!<small>Answers</small>', rows: [[
    cust('Ask', c => `<input type="text" class="tbq" placeholder="Ask WAAAGHoo! anything..." aria-label="Ask WAAAGHoo!"><button class="tbgo" data-a="${c.a(t => { const q = t.previousElementSibling; if (!q.value.trim()) return q.focus(); t.closest('.adin').querySelector('.ans').textContent = orkAnswer(q.value); q.value = ''; play('pet'); })}">${I('fist')}<span>Ask!</span></button>`, null, 'tbask'),
    menuBtn('q', 'Top Questions', [['Is red faster?', 'red'], ['What\'s for tea?', 'food'], ['Who should I pick in Goldenballs?', 'golden'], ['Will the Millennium Bug get me?', 'y2k'], ['Do I have to do my homework?', 'homework']].map(([l, q]) => ({ label: l, act: () => { const a = document.querySelector('.tb-waaaghoo .ans'); if (a) a.textContent = orkAnswer(q); } }))),
    txt('', 'ans'),
    txt('<b>1,999,999</b> answers given. 3 were right.', 'tbsmall'),
    btn('chat', 'Silly Dictionary', nav('orktranslate')),
    ad(['Ask an EXPERT!', 'Win an <b>ULTRA 64</b>!', 'Ask us ANYTHING!!!'], nav('orks'), 'a-yel', 92)]] };

  D.newsflash = { skin: 'news', h: 1, m: 'megaphone', lc: 'lg-news', logo: 'News<b>Flash</b>!', rows: [[
    txt('BREAKING', 'tbbreak'),
    tick('', () => calNews(8).map(p => `<b>${esc(p.tag)}:</b> ${esc(p.text)}`), 'tk-news', 1),
    menuBtn('news', 'Headlines', () => calNews(8).map(p => ({ label: p.text.slice(0, 60) + (p.text.length > 60 ? '...' : ''), act: box('NewsFlash: ' + p.tag, p.text) }))),
    btn('house', 'Front page', nav('home')),
    lcd(() => new Date().toTimeString().slice(0, 8))]] };

  D.dialup = { skin: 'flames', h: 't', m: 'rocket', lc: 'lg-fire', logo: 'Dial-Up <i>Accelerator</i><sup>3000</sup>', rows: [[
    cust('Speed', () => `<svg class="tbgauge" viewBox="0 0 40 24" aria-hidden="true"><path d="M3 22a17 17 0 0 1 34 0" fill="#111" stroke="#ccc" stroke-width="1.5"/><path d="M6 21a14 14 0 0 1 8-12" stroke="#3c3" stroke-width="3" fill="none"/><path d="M14 9a14 14 0 0 1 12 0" stroke="#fc0" stroke-width="3" fill="none"/><path d="M26 9a14 14 0 0 1 8 12" stroke="#f30" stroke-width="3" fill="none"/><line class="ndl" x1="20" y1="22" x2="20" y2="8" stroke="#fff" stroke-width="1.6"/><circle cx="20" cy="22" r="2" fill="#f30"/></svg><span class="tbspd"></span>`, null, 'tbgaugew'),
    btn('bolt', 'ACCELERATE!', (t, c) => { c.st.boost = Math.min(13600, c.st.boost + 2720); c.st.hold = 4; play('zap'); c.redraw(); if (c.st.boost >= 13600) { secret('tb.57k'); toast('Dial-Up Accelerator 3000', '57,600 bps!!! Your 56K modem is now a 57K modem. Scientists are baffled. Your phone bill is not.', 7000); } }, { cls: 'tbhot' }),
    menuBtn('modem', 'Tools', [{ label: 'Defragment the Internet', act: box('Dial-Up Accelerator 3000', 'Defragmenting the Internet...\n\nMoved 4,096 web pages closer together.\nThe Internet is now 3cm shorter.') }, { label: 'Compress my bits', act: say('Accelerator 3000', 'Bits squashed! Each bit is now 0.9 bits.') }, { label: 'Ask Mom to get off the phone', act: say('Mom', 'I\'m on the phone to your Nan. Five more minutes. (She means forty.)') }, { label: 'Make the modem screech quieter', act: () => play('modem') }]),
    cnt('Ping: ', () => ri(380, 999) + 'ms'),
    tick('', () => ['Makes your 56K act like a 57K!', 'Now with 1% more Internet!', 'Recommended by 9 out of 10 robots!', 'Turbo button not included!', 'Works best when nobody picks up the phone!'], 'tk-fire', 0.8)]],
    init(c) { c.st = { boost: 0, hold: 0 }; c.redraw = () => { const b = c.el.querySelector('.tbspd'), n = c.el.querySelector('.ndl'); const sp = 44000 + c.st.boost + (c.st.boost ? 0 : ri(-800, 800)); if (b) b.textContent = sp.toLocaleString('en-GB') + ' bps'; if (n) n.setAttribute('transform', `rotate(${-80 + (sp - 40000) / 17600 * 160} 20 22)`); }; c.redraw(); },
    tick(c) { if (c.st.hold > 0) c.st.hold--; else if (c.st.boost > 0) c.st.boost = Math.max(0, c.st.boost - 680); c.redraw(); } };

  D.askgrot = { skin: 'butler', h: 1, m: 'butler', lc: 'lg-gold', logo: 'Ask Jacksy!', rows: [[
    cust('Ask', c => `<input type="text" class="tbq" placeholder="Ask a question in plain English..." aria-label="Ask Jacksy"><button class="tbgo" data-a="${c.a(t => { const q = t.previousElementSibling, v = q.value.trim(); if (!v) return q.focus(); t.closest('.adin').querySelector('.ans').textContent = `Jacksy found 0 results for "${v.slice(0, 24)}". Did you mean: POCKET CRITTERS?`; q.value = ''; play('click'); })}">${I('mag')}<span>Ask</span></button>`, null, 'tbask'),
    menuBtn('q', 'Popular', [{ label: 'Where is the any key?', act: box('Ask Jacksy!', 'The "any key" is whichever key you like. Jacksy recommends the big one at the bottom.') }, { label: 'Why is the sky grey?', act: box('Ask Jacksy!', 'Because it is Tuesday.') }, { label: 'How do I get rid of toolbars?', act: box('Ask Jacksy!', 'Try View > Toolbars, or the little x on each one.\n\nJacksy hopes you will not. Jacksy is a toolbar.') }, { label: 'Is Episode I good?', act: box('Ask Jacksy!', 'Podracing: yes. Everything else: the jury is out. The jury is arguing about Jar Jar Jams.') }]),
    menuBtn('house', "Jacksy's Picks", [{ label: 'Cool Site of the Day', act: nav('csotd') }, { label: 'LookHere! start page', act: nav('lookhere') }, { label: 'The JackNet Cool Site Awards', act: nav('awards') }, { label: 'JackSearch Directory', act: nav('directory') }]),
    txt('', 'ans'),
    ad(['Ask Jacksy <b>ANYTHING</b>!', 'He knows (nothing)', 'In plain English!'], nav('search'), 'a-blu', 132)]] };

  D.smileypop = { skin: 'polka', h: 't', m: 'smiley', mc: 'tbbounce', lc: 'lg-rainbow', logo: 'SmileyPop!', rows: [[
    cust('Faces', c => [0, 1, 5, 3, 9, 20, 13].map(i => `<button class="tbfaceb" data-a="${c.a(() => { insertChat(':' + FACE_N[i] + ':'); play('pet'); })}" title=":${FACE_N[i]}:">${face(i)}</button>`).join(''), null, 'tbfaces'),
    btn('smile', 'All 24 Faces', t => panel(t, `<div class="tbpanel-hd">SmileyPop! Face Picker <small>(24 FREE faces)</small></div><div class="tbfacegrid">${FACE_N.map((n, i) => `<button data-f="${i}" title=":${n}:">${face(i)}<span>${n}</span></button>`).join('')}</div>`, (p, close) => p.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { insertChat(':' + FACE_N[+b.dataset.f] + ':'); close(); }))), { menu: true }),
    cust('Mood ring', c => `<button class="tbring" data-a="${c.a((t, cc) => moodRing(t))}" title="Mood ring: click it!"><i></i><span>Mood: ${esc(S('mood', 'Happy'))}</span></button>`, el => { const m = MOODS.find(x => x[0] === S('mood', 'Happy')) || MOODS[0]; el.querySelector('i').style.background = m[1]; }),
    ad(['FREE faces!!!', '<b>NEW:</b> Robot faces!', 'Over 24 faces!'], bundle('smileys'), 'a-pink', 100),
    btn('mail', 'SmileyGram', nav('ecardz')),
    btn('tv', 'Screensaver', () => toast('SmileyPop!', 'SmileyPop! Screensaver installed! It will start when you stop. (It won\'t.)')),
    txt(':-) :-) :-) the FUN way to chat!', 'tbad-i')]] };
  const MOODS = [['Happy', '#2a7ad8'], ['Grumpy', '#7a4a1a'], ['Hungry', '#ff8a00'], ['Sleepy', '#888'], ['Excited', '#ff3aa0'], ['Confused', 'repeating-linear-gradient(45deg,#c00 0 3px,#060 3px 6px,#fc0 6px 9px)'], ['Nervous', '#ffe000'], ['WAAAGH', '#2a9a1a']];
  function moodRing(t) {
    const m = pick(MOODS); setS('mood', m[0]);
    t.querySelector('i').style.background = m[1]; t.querySelector('span').textContent = 'Mood: ' + m[0];
    play('boing'); if (m[0] === 'WAAAGH') { secret('tb.mood'); toast('SmileyPop! Mood Ring', 'Your mood is... WAAAGH! The ring has gone proper green. Nobody knows what it means, but it\'s LOUD.'); }
  }

  D.coupon = { skin: 'tickets', h: 't', m: 'piggy', lc: 'lg-pig', logo: 'Turbo<i>Coupon</i><small>Saver</small>', rows: [[
    cnt('You saved: ', () => '&pound;0.00 today!', 'tbcnt-g'),
    menuBtn('tag', 'Coupons', [{ label: '10p off a 5p chew', act: say('TurboCoupon', 'Coupon applied! The shop now owes you 5p. Good luck getting it.') }, { label: 'Buy 1 Furby, get 1 Furby', act: say('TurboCoupon', 'You now have 2 Furbies. They are talking to each other. About you.') }, { label: '50% off a FREE CD', act: say('TurboCoupon', 'The CD is now half-free.') }, { label: 'Free hour of Internet (after midnight, Sundays)', act: say('TurboCoupon', 'Valid 3am-4am. Mom says no.') }]),
    btn('chart', 'Compare Prices', box('TurboCoupon Price Check', 'Space Cola:\n  Shop-o-Rama    £0.99\n  Gem Exchange   12 Rupees\n  Corner shop    55p (it\'s just a can of cola)\n\nBest deal: the corner shop. Again.')),
    cnt('Cashback: ', () => '0%'),
    ad(['<b>HOT DEAL!</b>', 'Save &pound;&pound;&pound;!!!', 'Click to save!', '(you will not save)'], nav('teef'), 'a-yel', 104),
    menuBtn('gift', 'Deal of the Day', [{ label: 'Pot Noodles: 2 for the price of 3', act: say('TurboCoupon', 'Wait. That is worse.') }, { label: 'FREE CD with every CD', act: say('TurboCoupon', 'You now own 2 CDs. Both are JackNet 56K free trial CDs.') }, { label: 'Get rich quick!', act: nav('getrich') }]),
    cnt('Coupons clipped: ', () => '0'),
    txt('Saving you money since last Tuesday!', 'tbad-i')]] };

  D.buddy = { skin: 'grot', h: 1, m: 'grot', mc: 'tbwobble', lc: 'lg-grot', logo: 'JackBuddy', rows: [[
    btn('smile', 'Tell me a joke', () => talk(pick(JOKES), 'JackBuddy')),
    btn('note', 'Sing a song', () => talk('La la la, I live in your PC, it is warm in here, tee hee, la la la.', 'JackBuddy')),
    btn('bulb', 'Fact!', () => talk('Did you know? ' + pick(FACTS), 'JackBuddy')),
    menuBtn('grot', 'Do a trick', [{ label: 'Dance', act: () => { try { Sound.music.play('grotdance'); } catch (e) {} toast('JackBuddy', 'JackBuddy is dancing! (You can\'t see it, but trust us.)'); } }, { label: 'Burp', act: say('JackBuddy', 'BUUURP. Sorry. Fizzy Vimto.') }, { label: 'Read my e-mail', act: say('JackBuddy', 'You have 0 e-mails. Want me to write you one? Dear you. Hello. From JackBuddy.') }]),
    btn('chat', 'Talk to me', () => Desk.ask('JackBuddy', 'Say something to JackBuddy:', '', 60, v => { if (v && v.trim()) talk(pick(['Ooh, ' + v.trim().slice(0, 30) + '! Tell me more!', 'I don\'t know what that means but I LOVE it.', 'Pardon? My speakers are on mute.', 'That reminds me of a joke. ' + pick(JOKES)]), 'JackBuddy'); })),
    txt('Your FREE talking friend!!!', 'tbad-i'),
    ad(['JackBuddy GOLD!', 'Now he can SING!', 'Only 99 Rupees!'], bundle('cyberpal'), 'a-grn', 112)]] };

  D.weathergrot = { skin: 'clouds', h: 't', m: 'sun', lc: 'lg-sky', logo: 'WeatherJack<b>Live!</b>', rows: [[
    lcd(() => weatherFor(0).temp + '&deg;C', 'tblcd-b'),
    cust('Forecast', () => [0, 1, 2, 3, 4].map(o => { const w = weatherFor(o); return `<span class="tbday" title="${w.txt}">${o ? w.day : 'Now'}${I(w.ic)}<b>${w.temp}&deg;</b></span>`; }).join(''), el => el.addEventListener('click', nav('weather')), 'tbdays tbclick'),
    tick('WARNING', () => ['SEVERE DRIZZLE WARNING for YOUR TOWN (we guessed where you live)', 'Pollen: HIGH (achoo)', 'Chance of snow at Christmas: 1 in 10 (Mom says 1 in 100)', 'UV index: what is UV? (it is 1999)', 'Wind: a bit blowy', 'Tomorrow: weather. Guaranteed!'], 'tk-sky', 0.9),
    menuBtn('cloud', 'Radar', [{ label: 'Show live radar', act: box('WeatherJack Radar (LIVE!)', '        .  ~~~ .\n     ~~ CLOUD ~~~    you are\n   ~~~~~~~~~~~~~~ <-- here\n     ~~ ~~~ ~~\n\nThe radar shows clouds. It always shows clouds.') }, { label: 'Is it raining?', act: say('WeatherJack', 'Look out of the window. We\'ll wait.') }, { label: 'WeatherJack website', act: nav('weather') }])]] };

  D.y2k = { skin: 'hazard', h: 1, m: 'bug', mc: 'tbwobble', lc: 'lg-y2k', logo: 'Y2K!', rows: [[
    lcd(() => { const n = new Date(), t = new Date(n.getFullYear() + 1, 0, 1); const s = Math.max(0, (t - n) / 1000 | 0); return `${s / 86400 | 0}d ${String((s % 86400) / 3600 | 0).padStart(2, '0')}:${String((s % 3600) / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }, 'tblcd-r'),
    txt('to the year 2000!', 'tbsmall'),
    menuBtn('warn', 'Am I Ready?', [{ label: 'Check my PC', act: box('Y2K Check', 'Checking BIOS... OK\nChecking clock... OK\nChecking video recorder... FLASHING 00:00 (it always does)\n\nYour PC is Y2K ready. Your video recorder never will be.') }, { label: 'Stock up on beans', act: say('Y2K!', 'Beans stocked. 48 tins. Mom wants the cupboard back.') }, { label: 'Visit the Y2K Bunker', act: nav('~gaz') }, { label: 'Time Capsule', act: nav('timecapsule') }]),
    ad(['BUY <b>Y2K SHIELD</b>', 'only &pound;19.99!!!', 'protects EVERYTHING*', '*nothing'], () => toast('Y2K Shield', 'Y2K Shield is sold out. Everyone bought one. Nobody knows what it does.'), 'a-blk', 116),
    tick('BUG WATCH', () => ['Millennium Bug spotted in a toaster (it was a crumb)', 'Experts say: the lifts will be fine', 'Bank says: your piggy bank is Y2K compliant', 'Remember: unplug the video recorder at 11:59pm', Cast.t('{kidY2k} has built a bunker. It is {kidY2k.his} shed.'), 'Party like it\'s... you know'], 'tk-fire', 0.9)]] };

  D.stargazer = { skin: 'stars', h: 't', m: 'crystal', lc: 'lg-neon', logo: 'StarGazer', rows: [[
    cust('Star sign', c => `<button class="tbcat" data-a="${c.a(t => under(t, () => SIGNS.concat(S('grotticus', 0) ? ['Joysticus'] : []).map(s => ({ label: s, rad: S('sign', 'Aries') === s, act: () => { setS('sign', s); t.querySelector('span').textContent = s; } }))))}"><span>${esc(S('sign', 'Aries'))}</span><i class="tbdd">&#9662;</i></button><button class="tbgo" data-a="${c.a(() => msg('StarGazer: ' + S('sign', 'Aries'), horoscope(S('sign', 'Aries'))))}">${I('moon')}<span>My Horoscope</span></button>`, null, 'tbask'),
    tick('STARS', () => SIGNS.map(s => `<b>${s}:</b> ${esc(horoscope(s))}`), 'tk-stars', 0.7),
    menuBtn('ball', 'Crystal Ball', [{ label: 'Ask the crystal ball', act: nav('crystalball') }, { label: 'Fortune cookie', act: box('Fortune Cookie', pick(['You will soon be offered a free toolbar. Say no. (You won\'t.)', 'A man with a beard will give you a floppy disk.', 'Help! I am trapped in a fortune cookie factory. (Classic.)', 'Your lucky numbers are 1, 9, 9 and 9.'])) }, { label: 'Tonight\'s sky', act: () => { const s = tl('space')[0]; msg('StarGazer: Tonight', s ? plain(s.sky) : 'Clouds. Sorry.'); } }]),
    cnt('Moon: ', () => ['New', 'Waxing', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning'][Math.floor((((new Date(1999, today().m - 1, today().d) - new Date(1999, 0, 17)) / 864e5 % 29.53 + 29.53) % 29.53) / 3.7)])]],
    wire(c) { const m = c.el.querySelector('.tblogo .tbm'); let n = 0; m.addEventListener('click', ev => { ev.stopPropagation(); if (++n >= 7 && !S('grotticus', 0)) { setS('grotticus', 1); setS('sign', 'Joysticus'); secret('tb.grotticus'); msg('StarGazer', 'The crystal ball goes cloudy... then GREEN, like a Game Lad screen.\n\nYou have discovered the secret 13th star sign: JOYSTICUS (the Joystick).\n\nJoysticans are up late, good at boss fights and never read the manual. Your lucky snack is a Pot Noodle.'); renderAgain(); } else play('pet'); }); } };

  D.booster = { skin: 'speed', h: 1, m: 'bolt', lc: 'lg-speed', logo: 'Turbo<i>Net</i>', rows: [[
    txt('Speed Booster:', 'tbsmall'),
    cust('Turbo', c => `<button class="tbtog${S('turbo', 0) ? ' on' : ''}" data-a="${c.a(t => { const on = !t.classList.contains('on'); t.classList.toggle('on', on); t.textContent = on ? 'ON' : 'OFF'; setS('turbo', on ? 1 : 0); toast('TurboNet', on ? 'Turbo mode ON! Your Internet is now 0% faster.' : 'Turbo mode off. You will not notice the difference.'); })}">${S('turbo', 0) ? 'ON' : 'OFF'}</button>`),
    cnt('', () => (49333 + ri(-40, 40)).toLocaleString('en-GB') + ' bps' + (S('turbo', 0) ? ' (TURBO!!!)' : ''), 'tblcd tblcd-s'),
    btn('modem', 'Defrag Internet', box('TurboNet', 'Defragmenting the Internet... done.\n\nAll the websites are now in alphabetical order.')),
    txt('Make your Internet up to 0% faster!!!', 'tbad-i'),
    cnt('Packets boosted: ', () => Math.floor(Date.now() / 997 % 99999).toLocaleString('en-GB')),
    ad(['TurboNet <b>PLATINUM</b>', '0% faster AGAIN!', 'Click to upgrade!'], bundle('dialup'), 'a-blu', 124)]] };

  D.teefco = { skin: 'teef', h: 't', m: 'gem', lc: 'lg-bubble', logo: 'Rupee<i>Companion</i>', rows: [[
    cnt('Your RUPEES: ', () => { const n = S('teef', 0); return window.Econ && Econ.rupees ? Econ.rupees(n) : n.toLocaleString('en-GB'); }, 'tbcnt-gold'),
    cnt('Level: ', () => { const t = S('teef', 0); return t < 50 ? 'Pebble' : t < 200 ? 'Shiny' : t < 600 ? 'Gem Hunter' : t < 1500 ? 'Gem Baron' : 'Rupee Royalty'; }),
    txt('Earn 1 Rupee for every click on a web page!', 'tbad-i'),
    menuBtn('gem', 'Spend Rupees', () => [['A Pot Noodle', 30], ['Go-faster stripes (red ones)', 80], ['A Rainbow Rupee (bargain!)', 250], ['A whole go-kart', 5000]].map(([n, p]) => ({ label: `${n} (${p} Rupees)`, act: () => { const t = S('teef', 0); if (t < p) return toast('Rupee Companion', `You need ${p - t} more ${p - t === 1 ? 'Rupee' : 'Rupees'}. Get clicking!`); toast('Rupee Companion', `Sorry, ${n.toLowerCase()} is out of stock until the year 2000. Your Rupees have been kept. Probably.`); } })).concat(['-', { label: 'Visit the Gem Exchange', act: nav('teef') }])),
    ad(['<b>2x RUPEES</b> weekend!', 'Click here!', 'Rupees Rupees Rupees'], nav('teef'), 'a-gold', 100),
    tick('RUPEE NEWS', () => ['Mom found 3 Rupees in the washing machine', 'Exchange rate: 1 Pot Noodle = 4 Rupees (2 on Sundays)', 'Gold Rupees now worth DOUBLE', 'Tooth Fairy denies knowing the Gem Exchange', 'Warboss buys every Rupee, again'], 'tk-shop', 0.9)]] };

  D.midibox = { skin: 'notes', h: 't', m: 'notey', mc: 'tbbounce', lc: 'lg-neon', logo: 'Music<i>Box</i><small>MIDI</small>', rows: [[
    cust('Mini piano', c => [60, 62, 64, 65, 67, 69, 71, 72].map((n, i) => `<button class="tbkey" data-n="${n}" data-a="${c.a(t => pianoKey(+t.dataset.n, t))}" aria-label="Note ${i + 1}"></button>`).join(''), null, 'tbpiano'),
    menuBtn('cd', 'Play MIDI', [['jack_theme.mid', 'theme'], ['tetris_a.mid', 'tris'], ['robot_dance.mid', 'grotdance'], ['blobbit_boogie.mid', 'squigdance']].map(([l, n]) => ({ label: '♫ ' + l, act: () => { try { Sound.music.play(n); if (!Sound.on) toast('MusicBox', 'Turn the sound on (speaker in the corner) to hear it!'); } catch (e) {} } })).concat(['-', { label: 'Stop', act: () => { try { Sound.music.stop(); } catch (e) {} } }, { label: 'MIDI Heaven website', act: nav('midi') }])),
    cust('EQ', () => '<span class="tbeq">' + '<i></i>'.repeat(9) + '</span>', null, 'tbeqw'),
    tick('', () => { const c = tl('chart')[0]; return [c ? `No.1 this week: <b>${esc(plain(c.title))}</b> by ${esc(plain(c.artist))}` : 'No.1 this week: a song', 'Now with 128 instruments (they all sound like a recorder)', 'Download 1,000s of MIDI files!'] ; }, 'tk-notes', 0.8)]] };
  const SCALE = [60, 62, 64, 65, 67, 69, 71, 72];
  let played = [];
  function pianoKey(n, t) {
    try { Sound.note(440 * Math.pow(2, (n - 69) / 12), 0.3, 'square'); } catch (e) {}
    t.classList.add('dn'); setTimeout(() => t.classList.remove('dn'), 160);
    played = played.concat(n).slice(-8);
    if (played.join() === SCALE.join()) { played = []; secret('tb.piano'); toast('MusicBox MIDI', 'Do Re Mi Fa So La Ti DO! A perfect scale. Jack\'s music teacher would be proud.'); }
  }

  D.ticker = { skin: 'matrix', h: 1, m: 'chartup', lc: 'lg-lcd', logo: 'GEM<i>EXCHANGE</i>', rows: [[
    cust('Rupee index', () => '<canvas class="tbspark" width="64" height="18"></canvas><b class="tbidx"></b>', null, 'tbsparkw'),
    tick('', c => STOCKS.map(s => `<span class="tbstk">${s[0]} <b class="${s[2] >= 0 ? 'up' : 'dn'}">${s[1].toFixed(1)} ${s[2] >= 0 ? '&#9650;' : '&#9660;'}${Math.abs(s[2]).toFixed(1)}%</b></span>`), 'tk-lcd', 1),
    btn('chart', 'Buy!', box('Gem Exchange', 'You bought 1 share of EGGBERT.\n\nIt went down. It always goes down when you buy it.'))]],
    init(c) { c.hist = Array.from({ length: 32 }, (x, i) => 100 + Math.sin(i / 3) * 5 + i * 0.4); c.draw = () => { const cv = c.el.querySelector('.tbspark'); if (!cv) return; const g = cv.getContext('2d'); g.fillStyle = '#001a00'; g.fillRect(0, 0, 64, 18); const mn = Math.min(...c.hist), mx = Math.max(...c.hist); g.strokeStyle = '#3f3'; g.beginPath(); c.hist.forEach((v, i) => g[i ? 'lineTo' : 'moveTo'](i * 2, 16 - (v - mn) / ((mx - mn) || 1) * 14)); g.stroke(); const l = c.hist[c.hist.length - 1], p = c.hist[c.hist.length - 2]; const b = c.el.querySelector('.tbidx'); b.textContent = l.toFixed(1) + (l >= p ? ' ▲' : ' ▼'); b.className = 'tbidx ' + (l >= p ? 'up' : 'dn'); }; c.draw(); },
    tick(c, n) { if (n % 2) return; c.hist.push(c.hist[c.hist.length - 1] + (Math.random() - 0.45) * 3); c.hist.shift(); c.draw(); } };
  const STOCKS = [['RUPEE', 104.2, 4.2], ['POCKET CRITTERS', 31.0, 8.8], ['ULTRA 64', 212.5, 12], ['EGGBERT', 3.3, -0.5], ['POT NOODLE', 18.7, 2.1], ['RED PAINT', 99.9, 99], ['FLOPPY', 1.44, 0], ['MODEM', 56.0, -0.1], ['Y2K BEANS', 1000, 100]];

  D.petrescue = { skin: 'paws', h: 't', m: 'dog', mc: 'tbwobble', lc: 'lg-bubble', logo: 'Pet<i>Rescue</i>', rows: [[
    cust('Happiness', () => `<span class="tbhearts" title="Happiness"></span><span class="tbpetname">${esc(S('petname', 'Patch'))}</span>`, null, 'tbheartsw'),
    ...[['bone', 'Feed', 'Munch munch munch. {n} wags its whole back end.'], ['heart', 'Pat', '{n} rolls over for a belly rub. Good dog!'], ['paw', 'Walk', '{n} drags you round the block twice and sniffs every lamp post.'], ['star', 'Trick', '{n} sits! Then lies down. Then falls asleep. Was that the trick?']].map(([ic, l, t]) => btn(ic, l, (b, c) => { const h = Math.min(5, S('pethappy', 2) + (S('petlast', '') === l ? 0 : 1)); setS('petlast', l); setS('pethappy', h); toast('Pet Rescue', t.replace('{n}', S('petname', 'Patch')), 4000); play('pet'); c.redraw(); if (h >= 5) { secret('tb.pet'); toast('Pet Rescue', S('petname', 'Patch') + ' is TOTALLY happy! Five hearts! Best toolbar pet ever.', 6000); } })),
    menuBtn('house', 'Adopt', [{ label: 'Adopt-a-Pixel pet rescue', act: nav('adopt') }, { label: "Biscuit the dog's homepage", act: nav('~biscuit') }, { label: 'Sheldon the Tortoise', act: nav('hz-sheldon') }, { label: 'Rename my pet...', act: () => Desk.ask('Pet Rescue', 'What is your puppy called?', S('petname', 'Patch'), 12, v => { if (v && v.trim()) { setS('petname', v.trim()); renderAgain(); } }) }]),
    ad(['Adopt a <b>pixel puppy</b>!', 'Woof! Woof!', 'They need YOU!'], nav('adopt'), 'a-pink', 128),
    txt('Your pet misses you when you\'re offline!', 'tbad-i')]],
    init(c) { c.redraw = () => { const h = S('pethappy', 2), e = c.el.querySelector('.tbhearts'); if (e) e.innerHTML = [0, 1, 2, 3, 4].map(i => I('heart', i < h ? '' : 'off')).join(''); }; c.redraw(); },
    tick(c, n) { if (n % 120 === 119 && S('pethappy', 2) > 0) { setS('pethappy', S('pethappy', 2) - 1); c.redraw(); } } };

  D.cursors = { skin: 'neon', h: 1, m: 'arrow', lc: 'lg-neon', logo: 'CursorMania!', rows: [[
    ...['Normal', 'Blobbit', 'Sword', 'Green hand'].map((l, i) => btn(['cursor', 'smile', 'sword', 'fist'][i], l, () => window.OldPC && OldPC.setCursor(i))),
    menuBtn('star', 'More Cursors', [{ label: 'Wiggly worm (coming soon)', dis: true }, { label: 'Spinning globe', act: comingSoon('CursorMania!') }, { label: 'Flaming sword', act: comingSoon('CursorMania!') }, { label: 'Get FunCursor trails!', act: bundle('funcursor') }]),
    txt('FREE animated cursors!!! <small>(they don\'t move)</small>', 'tbad-i'),
    ad(['<b>1,000</b> cursors!', 'FREE FREE FREE', 'Click with style!'], bundle('funcursor'), 'a-blk', 110)]] };

  D.funcursor = { skin: 'rainbow', h: 1, m: 'cursorguy', lc: 'lg-rainbow', logo: 'FunCursor', rows: [[
    txt('Trail:', 'tbsmall'),
    ...['Off', 'Sparkles', 'Stars', 'Hearts', 'Blobs', 'Rainbow', 'Seasonal'].map(l => btn(null, l, () => { setS('trail', l); document.querySelectorAll('.tb-funcursor .tbb').forEach(b => b.classList.toggle('on', b.dataset.l === S('trail', 'Sparkles'))); }, { cls: 'tbtrailb' })),
    menuBtn('cursor', 'Size', () => [{ label: 'Normal', rad: !S('big', 0), act: () => { setS('big', 0); bigCursor(); } }, { label: 'HUGE (inside web pages)', rad: !!S('big', 0), act: () => { setS('big', 1); bigCursor(); } }]),
    txt('Works inside web pages!', 'tbad-i'),
    ad(['Sparkly mouse!!!', 'Trails of <b>JOY</b>', 'Wiggle it!'], () => toast('FunCursor', 'Wiggle your mouse over a web page. Go on. Wiggle it.'), 'a-pink', 104)]],
    wire(c) { c.el.querySelectorAll('.tbtrailb').forEach(b => b.classList.toggle('on', b.dataset.l === S('trail', 'Sparkles'))); bigCursor(); } };
  function bigCursor() { const p = $('page'); if (!p) return; p.classList.toggle('tbbigcur', !!S('big', 0) && has('funcursor')); }
  const has = k => window.OldPC && OldPC.installed.includes(k);

  D.lotto = { skin: 'gold', h: 't', m: 'horseshoe', lc: 'lg-bubble', logo: 'Lucky<i>Lotto</i>', rows: [[
    txt('YOU\'VE WON!!!', 'tbwon'),
    cust('Slots', () => '<span class="tbreels"><b>7</b><b>&#9733;</b><b>&#9829;</b></span>', null, 'tbreelw'),
    btn('dice', 'SPIN!', (t, c) => spin(c), { cls: 'tbhot' }),
    btn('gift', 'CLAIM', () => window.OldPC && OldPC.popup(true)),
    cnt('Jackpot: ', () => '&pound;' + (1999999 + Math.floor(Date.now() / 1000) % 1000).toLocaleString('en-GB'), 'tbcnt-r'),
    txt('This is not a trick (it is a trick)', 'tbad-i'),
    ad(['<b>FREE</b> scratchcard!', 'Scratch here: ####', 'You won: nothing'], nav('winbig'), 'a-yel', 120)]] };
  const REEL = ['7', '&#9733;', '&#9829;', '&#9830;', '&#9827;', '&pound;'];
  function spin(c) {
    if (c.spinning) return; c.spinning = 1; const rs = c.el.querySelectorAll('.tbreels b'); let k = 0; play('dice');
    const win = Math.random() < 0.15, final = win ? Array(3).fill(pick(REEL)) : [pick(REEL), pick(REEL), pick(REEL)];
    if (!win && final[0] === final[1] && final[1] === final[2]) final[2] = REEL[(REEL.indexOf(final[2]) + 1) % REEL.length];
    const t = setInterval(() => { k++; rs.forEach((r, i) => { r.innerHTML = k > 6 + i * 3 ? final[i] : pick(REEL); }); if (k > 12) { clearInterval(t); c.spinning = 0; if (win) { secret('tb.jackpot'); play('solve'); toast('LuckyLotto JACKPOT!!!', 'THREE IN A ROW!!! You win... 0 Rupees! (The jackpot is the feeling of winning.)', 6000); } } }, 90);
  }

  D.cyberpal = { skin: 'circuit', h: 't', m: 'robot', mc: 'tbwobble', lc: 'lg-lcd', logo: 'Cyber<i>Pal</i>', rows: [[
    txt('HELLO, HUMAN FRIEND.', 'tbsay'),
    menuBtn('chat', 'Chat', ['Hello!', 'How are you?', 'What is your favourite game?', 'Are you a real robot?', 'Tell me a secret'].map(q => ({ label: q, act: () => palSay({ 'Hello!': 'HELLO. I AM CYBERPAL. I LIVE IN YOUR TOOLBAR. IT IS COSY.', 'How are you?': 'I AM FUNCTIONING WITHIN NORMAL PARAMETERS. ALSO I AM HAPPY.', 'What is your favourite game?': 'MINESWEEPER. I ALWAYS WIN. I CAN SEE THE MINES. DO NOT TELL ANYONE.', 'Are you a real robot?': 'YES. I AM MADE OF 100% REAL PIXELS.', 'Tell me a secret': 'THERE IS A THIRTEENTH STAR SIGN. ASK THE CRYSTAL BALL. SEVEN TIMES.' }[q]) }))),
    btn('bell', 'Mail', () => palSay('YOU HAVE 0 NEW MESSAGES. I CHECKED 1,999 TIMES.')),
    btn('smile', 'Joke', () => palSay(pick(JOKES).toUpperCase())),
    btn('bolt', 'Dance', (t, c) => { c.el.querySelector('.tblogo .tbm').classList.add('tbspin'); setTimeout(() => { const m = c.el.querySelector('.tblogo .tbm'); if (m) m.classList.remove('tbspin'); }, 2000); palSay('BEEP BOOP. BEEP BOOP. THIS IS THE ROBOT. I INVENTED IT.'); }),
    btn('pencil', 'Teach me', () => Desk.ask('CyberPal', 'Teach CyberPal a new word:', '', 20, v => { if (v && v.trim()) palSay('I HAVE LEARNED "' + v.trim().toUpperCase().slice(0, 20) + '". I WILL USE IT WISELY. OR LOUDLY.'); })),
    ad(['CyberPal <b>2000</b>', 'Now with FEELINGS', 'Beep boop!'], nav('downloads'), 'a-blk', 108)]],
    tick(c, n) { if (n % 9 === 0) { const s = c.el.querySelector('.tbsay'); if (s) s.textContent = pick(['HELLO, HUMAN FRIEND.', 'HAVE YOU TRIED BLOBBIT LOB?', 'I LIKE YOUR MOUSE.', 'DID YOU KNOW: I NEVER SLEEP.', 'PLEASE DO NOT UNINSTALL ME.', 'I AM 1999% FRIENDLY.', 'YOUR PAGE LOOKS NICE TODAY.']); } } };
  function palSay(t) { const s = document.querySelector('.tb-cyberpal .tbsay'); if (s) s.textContent = t; talk(t, 'CyberPal', 0.4); }

  D.shop = { skin: 'awning', h: 1, m: 'bag', lc: 'lg-bubble', logo: 'Shop-o-Rama', rows: [[
    tick('TODAY ONLY', () => ['Pot Noodle 2 for 1', 'Space Cola &pound;0.99', 'Rumble Pak (rumbles a bit) &pound;2.50', 'Slightly used robot owl &pound;4', 'Box of floppies (10) &pound;3.99', 'Mystery bag (it\'s a yo-yo) &pound;1'], 'tk-shop', 0.9),
    cnt('Basket: ', () => S('basket', 0) + ' items'),
    btn('cart', 'BUY!', () => { setS('basket', S('basket', 0) + 1); toast('Shop-o-Rama', "Added to basket! Sorry, online shopping isn't available in your area. Or any area. It's 1999."); }, { cls: 'tbhot' }),
    menuBtn('tag', 'Departments', [{ label: 'Gadgets', act: nav('teef') }, { label: 'Paint', act: nav('~mek') }, { label: 'Space bricks', act: nav('brickwars') }, { label: 'Everything else', act: comingSoon('Shop-o-Rama') }])]] };

  D.kidsafe = { skin: 'crayon', h: 't', m: 'shield', lc: 'lg-kid', logo: '<span>K</span><span>i</span><span>d</span> <span>S</span><span>a</span><span>f</span><span>e</span>', rows: [[
    txt('<i class="tblight"></i>SAFE MODE: ON', 'tbsafe'),
    cnt('Mom says: ', () => { const left = Math.max(0, 1200 - ((Date.now() - T0) / 1000 | 0)); return left ? `${left / 60 | 0}:${String(left % 60).padStart(2, '0')} left` : "TIME'S UP! (she won't check)"; }, 'tbcnt-k'),
    cnt('Blocked: ', () => '0 bad sites, 3 boring sites, 1 homework site'),
    btn('chat', 'Ask Mom', () => toast('Mom says:', pick(['Have you done your homework?', 'Five more minutes, then tea.', 'Is that the computer making that noise again?', 'I need the phone line! Your Nan is ringing!', 'Don\'t give anyone your address on the Internet.', 'Sit further away from the screen, you\'ll get square eyes.']), 5000)),
    menuBtn('star', 'Safe Sites', [{ label: Cast.t("{kidPoke}'s Pocket Critters Facts"), act: nav('~ellie') }, { label: 'Joke of the Day', act: nav('jokes') }, { label: "Biscuit's Homepage", act: nav('~biscuit') }, { label: 'ASCII Art Gallery', act: nav('ascii') }, { label: 'Recorder Club', act: nav('hz-recorder') }]),
    ad(['<b>MOM</b> approved!', 'No scary stuff!', 'Safe &amp; FUN!'], nav('~ellie'), 'a-grn', 100)]] };
  const T0 = Date.now();

  D.squigarc = { skin: 'jungle', h: 't', m: 'squig', mc: 'tbbounce', lc: 'lg-fire', logo: 'Blobbit<i>Arcade</i>', rows: [[
    cust('Bop the Blobbit', c => `<span class="tbsqz" data-a="${c.a((t, cc, ev) => { if (ev.target.closest('.tbsqt')) return; cc.st.streak = 0; cc.say('MISS!'); })}"><button class="tbsqt" aria-label="Bop the Blobbit" data-a="${c.a((t, cc) => { cc.st.hits++; cc.st.streak++; S('sqbest', 0) < cc.st.streak && setS('sqbest', cc.st.streak); play('thud'); t.classList.remove('ow'); void t.offsetWidth; t.classList.add('ow'); cc.say(cc.st.streak >= 10 ? 'BOP KING!' : pick(['OW!', 'BONK!', 'BOING!', 'POW!'])); if (cc.st.streak === 10) { secret('tb.squig'); toast('Blobbit Arcade', 'TEN IN A ROW! The Blobbit is fine (they bounce). The Blobbit respects you now.'); } })}">${M('squig')}</button></span>`, null, 'tbsqw'),
    cnt('Hits: ', c => c.st ? c.st.hits : 0), cnt('Streak: ', c => c.st ? c.st.streak : 0), cnt('Best: ', () => S('sqbest', 0)),
    txt('', 'tbsqsay'),
    menuBtn('pad', 'More Games', [{ label: 'JACK ATTACK! Games Arcade', act: nav('demos') }, { label: 'High Score Hall of Fame', act: nav('hz-hiscore') }, { label: 'MEGAFLASH 2000', act: nav('megaflash') }]),
    ad(['PLAY <b>FREE</b> GAMES!', 'Bop more Blobbits!', 'High scores!!!'], nav('demos'), 'a-yel', 120)]],
    init(c) { c.st = { hits: 0, streak: 0 }; c.say = t => { const s = c.el.querySelector('.tbsqsay'); if (s) { s.textContent = t; clearTimeout(c.sayT); c.sayT = setTimeout(() => { s.textContent = ''; }, 900); } }; } };

  const QUIZ = [['How many Pocket Critters are there?', ['151', '99', '1,000'], 0], ['How much does a floppy disk hold?', ['1.44 MB', '650 MB', '64 KB'], 0], ['Which console came out in Europe on 14 October 1999?', ['Daydream', 'Ultra 64', 'Game Lad Color'], 0], ['What does "www" stand for?', ['World Wide Web', 'Wibbly Wobbly Web', 'Wait, Wait, Wait'], 0], ['Where was Blockology invented?', ['Moscow', 'Tokyo', 'Bognor Regis'], 0], ['How many bits in a byte?', ['8', '10', '1.44'], 0], ['Which planet has the Great Red Spot?', ['Jupiter', 'Mars', 'Pluto'], 0], ['How many squares on a chess board?', ['64', '100', '42'], 0], ['What does CD-ROM stand for?', ['Compact Disc Read-Only Memory', 'Cool Disc Really Odd Music', 'Computer Data Room'], 0], ['How fast is the fastest Pentium III from February 1999?', ['500 MHz', '50 MHz', '5,000 MHz'], 0], ['How many sides does a Rubrick\'s cube have?', ['6', '9', '54'], 0], ['Who directed Intergalactic Battles: Episode I?', ['Gordon Lukewarm', 'Jar Jar Jams', 'Dave'], 0]];
  D.brainbox = { skin: 'quiz', h: 't', m: 'brain', lc: 'lg-quiz', logo: 'Brain<i>Box</i>', rows: [[
    txt('', 'tbqq'),
    cust('Answers', c => ['A', 'B', 'C'].map((l, i) => `<button class="tbans" data-i="${i}" data-a="${c.a(t => answer(c, +t.dataset.i))}"><b>${l}</b><span></span></button>`).join(''), null, 'tbansw'),
    cnt('Score: ', () => S('quizok', 0) + '/' + S('quizn', 0), 'tbcnt-q'),
    btn(null, 'Next &raquo;', (t, c) => { c.q = (c.q + 1) % QUIZ.length; c.show(); }),
    tick('FACT FILE', () => FACTS.map(esc), 'tk-stars', 0.8)]],
    init(c) {
      c.q = hash(today().key) % QUIZ.length;
      c.show = () => { const q = QUIZ[c.q], order = [0, 1, 2].sort(() => Math.random() - 0.5); c.order = order; c.el.querySelector('.tbqq').textContent = 'Q: ' + q[0]; c.el.querySelectorAll('.tbans').forEach((b, i) => { b.querySelector('span').textContent = q[1][order[i]]; b.classList.remove('ok', 'no'); }); c.done = 0; };
      c.show();
    } };
  function answer(c, i) {
    if (c.done) return; c.done = 1; const right = c.order[i] === QUIZ[c.q][2];
    setS('quizn', S('quizn', 0) + 1); if (right) setS('quizok', S('quizok', 0) + 1);
    c.el.querySelectorAll('.tbans').forEach((b, j) => b.classList.add(c.order[j] === QUIZ[c.q][2] ? 'ok' : 'no'));
    play(right ? 'solve' : 'uhoh'); c.refresh();
  }

  D.music = { skin: 'hifi', h: 1, m: 'boombox', lc: 'lg-neon', logo: 'JackNet <i>Radio</i>', rows: [[
    btn(null, '&#9654; jack_theme.mid', () => { try { Sound.music.play('theme'); } catch (e) {} }, { cls: 'tbplay' }),
    btn(null, '&#9654; Music A', () => { try { Sound.music.play('tris'); } catch (e) {} }, { cls: 'tbplay' }),
    btn(null, '&#9632;', () => { try { Sound.music.stop(); } catch (e) {} }, { cls: 'tbplay' }),
    menuBtn('radio', 'Stations', ['Jack FM (all chiptunes, all day)', 'Radio Arcade 106.9', 'Mom FM (mostly songs with hand dances)', 'Dial-Up Radio (screeeeech)'].map(s => ({ label: s, act: say('JackNet Radio', 'Tuning in to ' + s + '... (the stream needs a plug-in. The plug-in needs a plug-in.)') }))),
    tick('NOW PLAYING', () => { const c = tl('chart')[0]; return c ? [`${esc(plain(c.title))} - ${esc(plain(c.artist))} (No.1)`, c.prev ? `Last week: ${esc(plain(c.prev.title))}` : 'Requests: 0'] : ['jack_theme.mid', 'Requests: 0']; }, 'tk-lcd', 0.8)]] };

  D.waaagh = { skin: 'checks', h: 't', m: 'ork', lc: 'lg-ork', logo: 'WAAAGH!<small>Toolbar</small>', rows: [[
    btn('fist', 'WAAAGH!', () => { Net.send({ t: 'waaagh' }); play('waaagh'); }, { cls: 'tbhot' }),
    btn('skull', 'Roll the dice', () => { toast('WAAAGH! Toolbar', pick(['You rolled a 1. You always roll a 1.', 'You rolled a 6! Nobody saw it. It does not count.', 'The dice fell under the sofa. The cat has it now.'])); play('dice'); }),
    btn('paint', 'Paint it red', () => { document.body.classList.toggle('tbred'); toast('WAAAGH! Toolbar', document.body.classList.contains('tbred') ? 'The page is RED now. Red ones go faster.' : 'Back to normal. Slower.'); }),
    menuBtn('tooth', 'Hobby Stuff', [{ label: "Snaz's Miniature Painting Tips", act: nav('~mek') }, { label: 'The Silly Translator', act: nav('orktranslate') }, { label: 'Hobby Corner', act: nav('orks') }, { label: 'The Mushroom Page', act: nav('hz-fungus') }]),
    cnt('Painters online: ', () => 4 + Math.floor(Date.now() / 30000) % 9),
    txt('The toolbar for people with paint on their fingers', 'tbad-i'),
    ad(['Join the <b>CLUB!</b>', 'Red ones go faster', 'Paint MORE minis'], nav('~mek'), 'a-yel', 104)]] };

  D.weather = { skin: 'drizzle', h: 1, m: 'raincloud', lc: 'lg-grey', logo: 'WeatherBuddy', rows: [[
    cust('Now', () => `${I('rain')}<span>Cloudy. Again.</span>`, null, ''),
    cnt('Chance of rain: ', () => '99%'),
    menuBtn('cloud', 'Forecast', [{ label: 'Tomorrow: cloudy', act: say('WeatherBuddy', 'Cloudy.') }, { label: 'Weekend: cloudy', act: say('WeatherBuddy', 'Still cloudy.') }, { label: 'Summer holidays: cloudy', act: say('WeatherBuddy', 'Cloudy, with a 5 minute sunny bit while you are at school.') }]),
    btn('sun', 'Upgrade to WeatherJack!', bundle('weathergrot')),
    txt('Updated every 1999 seconds', 'tbad-i'),
    txt('WeatherBuddy says: take a coat.', 'tbad-i')]] };

  // ================================================================ rendering
  let ctxs = [], showAll = false, n = 0, trailOn = false;
  function renderAgain() { if (window.OldPC) render(OldPC.installed); }
  function renderW(w, c) {
    const L = esc(w.label ? plain(w.label) : '');
    if (w.t === 'sep') return '<span class="tbsep"></span>';
    if (w.t === 'b') {
      const id = c.a((t, cc, ev) => (w.m ? under(t, w.m) : w.a && w.a(t, cc, ev)));
      return `<button class="tbit tbb${w.o.cls ? ' ' + w.o.cls : ''}${w.m || w.o.menu ? ' tbdrop' : ''}" data-a="${id}" data-l="${L}">${w.ic ? I(w.ic) : ''}${w.label ? `<span>${w.label}</span>` : ''}${w.m || w.o.menu ? '<i class="tbdd">&#9662;</i>' : ''}</button>`;
    }
    if (w.t === 's') {
      const go = t => { const q = t.closest('.tbs').querySelector('.tbq'); if (!q.value.trim()) return q.focus(); (w.fn || search)(q.value, c.cat); q.value = ''; };
      c.cat = w.cats ? w.cats[0] : '';
      const cat = w.cats ? `<button class="tbcat" data-a="${c.a(t => under(t, w.cats.map(x => ({ label: x, rad: c.cat === x, act: () => { c.cat = x; t.querySelector('span').textContent = x; } }))))}"><span>${esc(w.cats[0])}</span><i class="tbdd">&#9662;</i></button>` : '';
      return `<span class="tbit tbs" data-l="Search..." data-ask="${c.a(() => Desk.ask(NAMES()[c.key] || 'Search', 'Search the Web for:', '', 60, v => { if (v && v.trim()) (w.fn || search)(v, c.cat); }))}">${cat}<input type="text" class="tbq" placeholder="${esc(w.ph || 'Search...')}" aria-label="Search"${w.w ? ` style="width:${w.w}px"` : ''}><button class="tbgo" data-a="${c.a(go)}">${I('mag')}<span>${esc(w.go || 'Search')}</span></button></span>`;
    }
    if (w.t === 'ad') {
      const id = c.a(() => (typeof w.go === 'function' ? w.go() : web(w.go)));
      c.ads.push(w);
      return `<button class="tbit tbad ${w.cls || ''}" data-a="${id}" data-l="Special offer!" style="width:${w.w || 110}px"><span class="tbadf">${w.frames[0]}</span></button>`;
    }
    if (w.t === 'tk') {
      c.tks.push(w);
      return `<span class="tbit tbtk ${w.cls || ''}" data-l="${L || 'Ticker'}">${w.label ? `<b class="tbtkl">${w.label}</b>` : ''}<span class="tbtkw"><span class="tbtki"></span></span></span>`;
    }
    if (w.t === 'c') { c.cnts.push(w); return `<span class="tbit tbc ${w.cls || ''}" data-l="${L}">${w.label}<b>${w.fn(c)}</b></span>`; }
    if (w.t === 'tx') return `<span class="tbit tbt ${w.cls || ''}" data-l="">${w.html}</span>`;
    if (w.t === 'x') { const h = typeof w.html === 'function' ? w.html(c) : w.html; c.custs.push(w); return `<span class="tbit tbx2 ${w.cls || ''}" data-l="${L}" data-x="${c.custs.length - 1}">${h}</span>`; }
    return '';
  }
  function makeBand(key) {
    const d = D[key]; if (!d) return null;
    const name = NAMES()[key] || key;
    const c = { key, d, acts: [], ads: [], tks: [], cnts: [], custs: [] };
    c.a = fn => (c.acts.push(fn), c.acts.length - 1);
    const skin = S('skin.' + key, d.skin);
    const el = document.createElement('div'); c.el = el;
    el.className = `band adware tb-${key} tbh-${d.h || 1} sk-${skin}`; el.dataset.tb = key;
    const logoA = c.a(t => under(t, () => ownMenu(key)));
    const logo = `<button class="tblogo ${d.lc || ''}" data-a="${logoA}" title="${esc(name)} (click for menu)">${M(d.m, d.mc)}<span class="tbname">${d.logo}</span><i class="tbdd">&#9662;</i></button>`;
    el.innerHTML = `<span class="grip"></span><div class="adin">${logo}<div class="tbrows">${d.rows.map(r => `<div class="tbrow">${r.map(w => renderW(w, c)).join('')}</div>`).join('')}</div></div><button class="tbchev" hidden aria-label="More buttons">&raquo;</button><button class="tbx" title="Close ${esc(name)}" aria-label="Close ${esc(name)}">x</button>`;
    el.addEventListener('click', ev => {
      const t = ev.target.closest('[data-a]'); if (!t || !el.contains(t)) return;
      const f = c.acts[+t.dataset.a]; if (f) { f(t, c, ev); setTimeout(() => refresh(c), 0); }
    });
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.classList.contains('tbq')) { const g = ev.target.parentElement.querySelector('.tbgo'); if (g) g.click(); } });
    el.addEventListener('contextmenu', ev => { if (ev.target.closest('input')) return; ev.preventDefault(); IE.menu(ownMenu(key), ev.clientX, ev.clientY); });
    el.querySelector('.tbx').addEventListener('click', () => OldPC.uninstall(key));
    el.querySelector('.tbchev').addEventListener('click', ev => chevron(c, ev.currentTarget));
    c.refresh = () => refresh(c);
    return c;
  }
  function wireBand(c) {
    c.el.querySelectorAll('[data-x]').forEach(x => { const w = c.custs[+x.dataset.x]; if (w && w.wire) w.wire(x, c); });
    if (c.d.init) c.d.init(c);
    if (c.d.wire) c.d.wire(c);
    c.el.querySelectorAll('.tbtk').forEach((t, i) => fillTicker(c, t, c.tks[i]));
  }
  function fillTicker(c, el, w) {
    let items = []; try { items = w.items(c); } catch (e) {}
    if (!items.length) items = ['JackNet Explorer 5 - the Internet, but grey'];
    const inner = el.querySelector('.tbtki'); inner.innerHTML = items.map(s => `<span>${s}</span>`).join('<i>&#9733;</i>');
    requestAnimationFrame(() => { const wd = inner.scrollWidth + (el.querySelector('.tbtkw').clientWidth || 200); inner.style.animationDuration = Math.max(8, wd / (55 * (w.speed || 1))) + 's'; });
  }
  function refresh(c) {
    c.el.querySelectorAll('.tbc').forEach((e, i) => { const w = c.cnts[i]; if (!w) return; const v = String(w.fn(c)); const b = e.querySelector('b'); if (b && e._v !== v) { e._v = v; b.innerHTML = v; } });
  }
  function ownMenu(key) {
    const name = NAMES()[key] || key, cur = S('skin.' + key, D[key].skin);
    return [
      { label: 'About ' + name + '...', act: () => msg('About ' + name, `${name}\nVersion ${1 + hash(key) % 4}.${hash(key + 'v') % 10} (Build 1999.${hash(key) % 365})\n\nCopyright (c) 1999 ${pick2(hash(key), ['FreeStuff Software', 'MegaClick Media', 'Bonza Bytes', 'Gubbinz & Sons', 'TotallyLegit Ltd'])} (not a real company)\nwww.${key}.${pick2(hash(key) >>> 3, ['jnet', 'grot', 'webcom', 'w3b', 'netz', 'infobahn'])}\n\nThis toolbar is FREE! It costs nothing!\n(Except about 30 pixels of your screen.)`) },
      { label: 'Change Skin', sub: () => SKINS.map(([k, l]) => ({ label: l, rad: cur === k, act: () => { setS('skin.' + key, k); const sk = S('skins', []); if (!sk.includes(k)) { sk.push(k); setS('skins', sk); if (sk.length >= 5) secret('tb.skin'); } renderAgain(); } })) },
      { label: 'Options...', act: () => msg(name + ' Options', pick(['There are no options. That is also an option.', 'Options will be available in the PRO version (£29.99).', 'Option 1: keep the toolbar.\nOption 2: keep the toolbar.\n\nYou have chosen: keep the toolbar.'])) },
      { label: 'Check for Updates', act: () => { toast(name, 'Checking for updates... Found 1 update! It is a different toolbar.'); setTimeout(() => window.OldPC && OldPC.bundle(), 1200); } },
      { label: 'Help', act: () => toast(name + ' Help', pick(['Click the buttons. That is all the help there is.', 'Help is on its way. It is on dial-up.', 'Have you tried turning it off and on again?'])) },
      '-',
      { label: 'Show All Toolbars', chk: showAll, act: () => { showAll = !showAll; fit(); } },
      { label: 'Uninstall ' + name + '...', act: () => OldPC.uninstall(key) },
    ];
  }
  const SKINS = [['chrome', 'Chrome Deluxe'], ['stars', 'Starry Night'], ['clouds', 'Sunny Sky'], ['drizzle', 'Drizzle'], ['flames', 'Hot Flames'], ['camo', 'Camo'], ['leopard', 'Leopard'], ['squigs', 'Blobbits!'], ['circuit', 'Circuit Board'], ['rainbow', 'Rainbow'], ['hearts', 'Lovehearts'], ['polka', 'Polka Dots'], ['paws', 'Paw Prints'], ['notes', 'Music Notes'], ['checks', 'Racing Checks'], ['hazard', 'Hazard Stripes'], ['matrix', 'Green Screen'], ['gold', 'Lucky Gold'], ['awning', 'Shop Awning'], ['speed', 'Lightning'], ['crayon', 'Crayons'], ['teef', 'Rupees'], ['news', 'Newsprint'], ['butler', 'Posh'], ['grot', 'Gubbinz Green'], ['quiz', 'Quiz Show'], ['jungle', 'Jungle'], ['violet', 'Purple Haze'], ['hifi', 'Hi-Fi'], ['neon', 'Neon'], ['tickets', 'Coupons'], ['plain', 'Boring Grey']];
  function chevron(c, b) {
    const items = [...c.el.querySelectorAll('.tbit.tbclip')].map(x => {
      const l = x.dataset.l || ''; if (!l) return null;
      if (x.dataset.ask) return { label: l, act: () => c.acts[+x.dataset.ask]() };
      if (x.dataset.a) return { label: l, act: () => c.acts[+x.dataset.a](b, c, { target: x }) };
      return { label: l + ' (make the window wider)', dis: true };
    }).filter(Boolean);
    const r = b.getBoundingClientRect(); IE.menu(items.length ? items : [{ label: '(nothing hiding here)', dis: true }], r.left, r.bottom);
  }
  function fitBand(c) {
    const its = c.el.querySelectorAll('.tbit'); its.forEach(i => i.classList.remove('tbclip'));
    const ch = c.el.querySelector('.tbchev');
    if (phone()) { ch.hidden = true; return; }
    let any = false;
    c.el.querySelectorAll('.tbrow').forEach(row => { const W = row.clientWidth; row.querySelectorAll(':scope > .tbit').forEach(i => { if (i.offsetLeft + i.offsetWidth > W + 1) { i.classList.add('tbclip'); any = true; } }); });
    ch.hidden = !any;
  }
  function fit() {
    const bands = ctxs.map(c => c.el).filter(b => b.isConnected);
    let more = rebar.querySelector('.band.tbmore');
    bands.forEach(b => b.classList.remove('tbhid'));
    if (!bands.length) { if (more) more.remove(); return; }
    const maxH = phone() ? 0 : Math.max(150, (browser.clientHeight || 640) * 0.4);
    let h = 0, hid = 0, first = null;
    bands.forEach((b, i) => { h += b.offsetHeight; if (i > 0 && (phone() || h > maxH)) { hid++; if (!first) first = b; if (!showAll) b.classList.add('tbhid'); } });
    if (hid) {
      if (!more) { more = document.createElement('div'); more.className = 'band tbmore'; more.innerHTML = '<span class="grip"></span><button class="tbmorebtn"></button>'; more.querySelector('button').addEventListener('click', () => { showAll = !showAll; fit(); }); }
      if (more.nextElementSibling !== first) rebar.insertBefore(more, first); // sits between the shown ones and the hidden ones, so "tuck away" is always in reach
      more.querySelector('button').innerHTML = showAll ? `&#9650; Tuck ${hid} toolbar${hid > 1 ? 's' : ''} away` : `&#9660; ${hid} more toolbar${hid > 1 ? 's are' : ' is'} hiding down here! (click to show)`;
    } else if (more) more.remove();
    ctxs.forEach(c => { if (!c.el.classList.contains('tbhid')) fitBand(c); });
  }
  function render(list) {
    document.querySelectorAll('.tbpanel').forEach(p => p.remove());
    ctxs.forEach(c => c.el.remove()); ctxs = [];
    const more = rebar.querySelector('.band.tbmore');
    for (const key of list) { const c = makeBand(key); if (!c) continue; rebar.appendChild(c.el); ctxs.push(c); }
    if (more) rebar.appendChild(more);
    ctxs.forEach(wireBand);
    bigCursor(); trailOn = list.includes('funcursor');
    fit(); requestAnimationFrame(fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (!list.length && more) more.remove();
  }
  // ---- one clock for everything, which stops when nobody can see the toolbars
  const paused = () => document.hidden || browser.classList.contains('min');
  function tickAll() {
    const p = paused(); rebar.classList.toggle('tbpause', p);
    if (p || !ctxs.length) return;
    n++;
    for (const c of ctxs) {
      if (c.el.classList.contains('tbhid')) continue;
      if (c.d.tick) try { c.d.tick(c, n); } catch (e) {}
      refresh(c);
      if (n % 3 === 0) c.el.querySelectorAll('.tbad').forEach((a, i) => { const w = c.ads[i]; if (!w) return; const k = (+(a.dataset.f || 0) + 1) % w.frames.length; a.dataset.f = k; const f = a.querySelector('.tbadf'); f.innerHTML = w.frames[k]; f.classList.remove('flip'); void f.offsetWidth; f.classList.add('flip'); });
    }
  }
  setInterval(tickAll, 1000);
  document.addEventListener('visibilitychange', () => rebar.classList.toggle('tbpause', paused()));
  new MutationObserver(() => rebar.classList.toggle('tbpause', paused())).observe(browser, { attributes: true, attributeFilter: ['class'] });
  let rz = 0;
  const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(fit); };
  addEventListener('resize', onResize);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(browser);
  // ---- Rupee Companion pays you for clicking on web pages
  document.addEventListener('click', ev => { if (!has('teefco') || !ev.target.closest || !ev.target.closest('#page')) return; setS('teef', S('teef', 0) + 1); });
  // ---- FunCursor trails (inside the web page only)
  const TRAIL = { Sparkles: ['&#10022;', '&#10023;', '*'], Stars: ['&#9733;', '&#9734;'], Hearts: ['&#9829;'], Blobs: ['@'], Squigs: ['@'], Rainbow: ['&#9679;'] }; // Squigs = old saved name for Blobs
  const TCOL = ['#ff2a2a', '#ff9a00', '#ffe000', '#2adf2a', '#2a9aff', '#9a2aff', '#ff3ad8'];
  // serious sites (money, mail, search, news, safety) stay calm: no sparkles on your bank statement
  const CALM = /(^|\.)(jacknetbank|jackexchange|gemexchange|jackmail|waaaghooo|jackgle|jacksearch|askgubbinz|jackshield|hoaxwatch|millenniumvault|jsn|oddjobz|w3)\.[a-z0-9]+$/;
  const calm = () => { const a = $('addrBar'); return !!a && CALM.test(String(a.value).replace(/^\w+:\/\//, '').split(/[/?#]/)[0].toLowerCase()); };
  let lastT = 0, live = 0, ti = 0;
  document.addEventListener('pointermove', ev => {
    if (!trailOn || ev.pointerType === 'touch' || paused()) return;
    const mode = S('trail', 'Sparkles'); if (mode === 'Off' || (!TRAIL[mode] && mode !== 'Seasonal')) return;
    const now = performance.now(); if (now - lastT < 45 || live > 22) return;
    if (!ev.target.closest || !ev.target.closest('#page') || calm()) return;
    lastT = now; live++; ti++;
    const s = document.createElement('span'); s.className = 'tbtrail' + (mode === 'Squigs' || mode === 'Blobs' ? ' sq' : '');
    const p = DesktopSurface.point(ev.clientX, ev.clientY);
    const sea = mode === 'Seasonal' && window.SeasonsWeb ? SeasonsWeb.trail() : null; // the season's own pictures (pumpkins, snowflakes...)
    s.innerHTML = pick(sea || TRAIL[mode === 'Seasonal' ? 'Sparkles' : mode]); if (sea) s.classList.add('ssn'); s.style.left = p.x + 6 + 'px'; s.style.top = p.y + 8 + 'px'; s.style.color = mode === 'Hearts' ? '#ff2a7a' : mode === 'Squigs' || mode === 'Blobs' ? '#e8381b' : TCOL[ti % TCOL.length];
    DesktopSurface.root().appendChild(s);
    const done = () => { if (s.isConnected) { s.remove(); live--; } };
    s.addEventListener('animationend', done); setTimeout(done, 1200);
  }, { passive: true });

  window.TBars = { render, fit, defs: D, skins: SKINS };
})();

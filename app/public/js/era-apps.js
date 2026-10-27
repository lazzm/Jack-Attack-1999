/* era-apps: the ERA SOFTWARE pack. Affectionate parodies of the famous programs of 1998-1999, made from scratch:
 * Bugsweeper 2000, Jack Ball, Blobbit's Revenge, the 3D Jack Maze and Jack Island screen savers, JACK@home,
 * Staples the paperclip, RealJack Player and Jackster. This always-loaded file is the lean part: icons, the
 * registry, installer entries, secrets, Run commands, the screen saver hook-up, the Staples window watcher and
 * the Jackster share responder. Everything big lives in js/era-apps-*.js and is fetched the first time it's used. */
(function () {
  'use strict';
  if (!window.Apps) return;
  const esc = Apps.esc, store = Apps.store;
  const $ = id => document.getElementById(id);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const note = (f, d, t) => { try { if (window.Sound) Sound.note(f, d, t); } catch (e) {} };
  const J = n => (window.JICON && JICON.has && JICON.has(n)) ? JICON.icon(n) : null;
  // ?eratest=MMDD or ?eratest=MMDDHH pretends it's that day (and hour): for the date-aware screen savers
  const ET = location.search.match(/[?&]eratest=(\d{2})(\d{2})(\d{2})?/);
  const today = () => ET ? { m: +ET[1], d: +ET[2], md: +ET[1] * 100 + +ET[2], date: new Date(1999, +ET[1] - 1, +ET[2]) } : Desk.today99();
  const hour = () => { const d = new Date(); return ET && ET[3] ? +ET[3] + d.getMinutes() / 60 : d.getHours() + d.getMinutes() / 60; };
  const rng = seed => { let a = (typeof seed === 'string' ? [...seed].reduce((x, c) => Math.imul(x ^ c.charCodeAt(0), 16777619), 2166136261) : seed) >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const styled = {};
  const css = (id, text) => { if (styled[id]) return; styled[id] = 1; const s = document.createElement('style'); s.id = 'era-css-' + id; s.textContent = text; document.head.appendChild(s); };
  const phone = () => innerWidth < 640 || matchMedia('(hover:none)').matches;

  // ================================================================ icons (32x32 viewBox, chunky, hand-drawn)
  const I = {
    sweeper: J('sweeper') || '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" fill="#c0c0c0" stroke="#808080"/><circle cx="16" cy="17" r="8" fill="#000"/><path d="M16 5v24M4 17h24M8 9l16 16M24 9L8 25" stroke="#000" stroke-width="2"/><rect x="12" y="13" width="3" height="3" fill="#fff"/></svg>',
    grotball: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#000" stroke="#808080"/><rect x="2" y="2" width="11" height="28" fill="#3a3a8a"/><path d="M13 2v28" stroke="#e10600" stroke-width="2"/><path d="M13 16h17" stroke="#2a5ad8" stroke-width="2"/><circle cx="22" cy="9" r="4" fill="#e10600" stroke="#fff" stroke-width=".8"/><circle cx="21" cy="8" r="1.3" fill="#fff"/><circle cx="23" cy="24" r="4" fill="#3aac2c" stroke="#fff" stroke-width=".8"/><circle cx="22" cy="23" r="1.3" fill="#fff"/></svg>',
    revenge: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#a8a800" stroke="#000"/><g fill="#e8e040" stroke="#707000"><rect x="3" y="3" width="8" height="8"/><rect x="12" y="3" width="8" height="8"/><rect x="3" y="12" width="8" height="8"/></g><g fill="#fff8a8"><rect x="3.5" y="3.5" width="7" height="1"/><rect x="12.5" y="3.5" width="7" height="1"/><rect x="3.5" y="12.5" width="7" height="1"/></g><g stroke="#0a2a6a" stroke-width=".8"><circle cx="13.6" cy="13.4" r="1.6" fill="#2a80d8"/><circle cx="19.4" cy="13.4" r="1.6" fill="#2a80d8"/><circle cx="16.5" cy="17.5" r="4.8" fill="#3aa0f0"/></g><ellipse cx="14.8" cy="15.6" rx="1.4" ry=".8" fill="#c8f0ff"/><circle cx="15" cy="17" r="1.2" fill="#fff"/><circle cx="18" cy="17" r="1.2" fill="#fff"/><circle cx="15.3" cy="17.3" r=".6"/><circle cx="18.3" cy="17.3" r=".6"/><path d="M15 19.6q1.5 1.4 3 0z" fill="#5a0a20"/><g stroke="#1a1e2a" stroke-width=".7"><path d="M25 19.5v-2" /><rect x="21.5" y="19.5" width="7" height="5" fill="#c8d0dc"/><rect x="22" y="24.5" width="6" height="4" fill="#9aa2b2"/></g><circle cx="25" cy="17.2" r="1" fill="#ff3020"/><rect x="22.5" y="21" width="5" height="2" fill="#10141c"/><rect x="23" y="21.5" width="1.4" height="1" fill="#ff3020"/><rect x="25.6" y="21.5" width="1.4" height="1" fill="#ff3020"/><path d="M28 26h2M29 25v2" stroke="#c89a20" stroke-width="1.2"/><path d="M4 22l6 5H4z" fill="#ffd400" stroke="#a08000"/></svg>',
    saver: J('screensaver') || '<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="20" fill="#c0c0c0" stroke="#000"/><rect x="6" y="6" width="20" height="14" fill="#000"/><rect x="11" y="23" width="10" height="3" fill="#808080"/><rect x="7" y="26" width="18" height="3" fill="#c0c0c0" stroke="#000"/></svg>',
    maze: '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="24" fill="#000" stroke="#808080"/><path d="M2 2l9 7h10l9-7M2 26l9-7h10l9 7" fill="#7a2a1a" stroke="#c8643a"/><path d="M2 2v24l9-7V9z" fill="#a83a22" stroke="#c8643a"/><path d="M30 2v24l-9-7V9z" fill="#8a3018" stroke="#c8643a"/><rect x="11" y="9" width="10" height="10" fill="#5a1a0a"/><path d="M4 8h5M4 13h5M4 18h5M23 8h5M23 13h5M23 18h5" stroke="#e08060" stroke-width=".6"/><circle cx="16" cy="14" r="3" fill="#ffd400" stroke="#000" stroke-width=".6"/><path d="M14.6 14.6q1.4 1.4 2.8 0" stroke="#000" stroke-width=".6" fill="none"/><rect x="11" y="26" width="10" height="2" fill="#808080"/><rect x="7" y="28" width="18" height="2" fill="#c0c0c0" stroke="#000" stroke-width=".5"/></svg>',
    island: '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="24" fill="#5ab8f0" stroke="#000"/><circle cx="24" cy="8" r="3" fill="#ffd400"/><rect x="2" y="18" width="28" height="8" fill="#1a5ab0"/><ellipse cx="14" cy="19" rx="9" ry="3" fill="#f0d890" stroke="#a08040" stroke-width=".6"/><path d="M14 18q-1-6 1-10" stroke="#7a4a1a" stroke-width="1.6" fill="none"/><path d="M15 8q-5-1-7 2M15 8q4-3 7-1M15 8q-3 2-4 5M15 8q4 1 5 4" stroke="#2a8a2a" stroke-width="1.6" fill="none"/><path d="M18.6 14.6l-.8-2M20.4 14.6l.8-2" stroke="#1d4a10" stroke-width=".5"/><circle cx="17.8" cy="12.5" r=".6" fill="#b8ff60"/><circle cx="21.2" cy="12.5" r=".6" fill="#b8ff60"/><circle cx="19.5" cy="16" r="2" fill="#5aac2c" stroke="#1d4a10" stroke-width=".5"/><ellipse cx="18.8" cy="15.9" rx=".5" ry=".7"/><ellipse cx="20.2" cy="15.9" rx=".5" ry=".7"/><path d="M4 22h4M20 23h5" stroke="#9fd0ff" stroke-width=".8"/><rect x="11" y="26" width="10" height="2" fill="#808080"/><rect x="7" y="28" width="18" height="2" fill="#c0c0c0" stroke="#000" stroke-width=".5"/></svg>',
    sqhome: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#000" stroke="#808080"/><path d="M3 26l5-3 5 1 5-4 5 2 6-3" stroke="#2a5ad8" fill="none"/><g stroke-width="2"><path d="M6 25v-4" stroke="#2040ff"/><path d="M9 24v-7" stroke="#20c0ff"/><path d="M12 24v-3" stroke="#20ff80"/><path d="M15 23v-11" stroke="#ff2020"/><path d="M18 22v-5" stroke="#ffd400"/><path d="M21 22v-3" stroke="#20c0ff"/><path d="M24 21v-6" stroke="#20ff80"/></g><ellipse cx="24" cy="8" rx="5" ry="2" fill="#a0a0a8" stroke="#fff" stroke-width=".5"/><path d="M21 7q3-4 6 0" fill="#9fd0ff"/><text x="3" y="9" font-family="Arial" font-size="6" font-weight="bold" fill="#ffd400">@</text></svg>',
    staples: '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" fill="#ffffcc" stroke="#808080"/><path d="M12 27V9a4 4 0 0 1 8 0v15a2.5 2.5 0 0 1-5 0V11" fill="none" stroke="#5a6a7a" stroke-width="2.2" stroke-linecap="round"/><path d="M12 27V9a4 4 0 0 1 8 0v15a2.5 2.5 0 0 1-5 0V11" fill="none" stroke="#d8e0e8" stroke-width=".8" stroke-linecap="round"/><circle cx="13.5" cy="12" r="2.2" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="19" cy="12" r="2.2" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="14" cy="12.4" r="1" fill="#000"/><circle cx="19.5" cy="12.4" r="1" fill="#000"/><path d="M11 8.5l4 1M21.5 8.5l-4 1" stroke="#000" stroke-width=".9"/></svg>',
    realsquig: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1a3a8a" stroke="#000"/><circle cx="16" cy="16" r="11" fill="#2a5ad8" stroke="#9fd0ff"/><circle cx="16" cy="17" r="7" fill="#e10600" stroke="#000" stroke-width=".8"/><circle cx="13.5" cy="15.5" r="1.6" fill="#fff"/><circle cx="18.5" cy="15.5" r="1.6" fill="#fff"/><circle cx="13.8" cy="15.8" r=".7"/><circle cx="18.8" cy="15.8" r=".7"/><path d="M12.5 19.5q3.5 2.5 7 0" stroke="#fff" fill="none"/><path d="M5 9q4-5 11-6" stroke="#fff" stroke-width="1.5" fill="none" opacity=".6"/></svg>',
    squigster: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="#fff" stroke="#000"/><circle cx="16" cy="15" r="9" fill="#e10600" stroke="#000"/><path d="M7 14a9 9 0 0 1 18 0" fill="none" stroke="#000" stroke-width="2.4"/><rect x="5" y="13" width="4" height="7" rx="1.5" fill="#000"/><rect x="23" y="13" width="4" height="7" rx="1.5" fill="#000"/><circle cx="13" cy="16" r="1.6" fill="#fff"/><circle cx="19" cy="16" r="1.6" fill="#fff"/><circle cx="13.3" cy="16.3" r=".7"/><circle cx="19.3" cy="16.3" r=".7"/><path d="M13 20q3 2 6 0" stroke="#fff" fill="none"/><path d="M10 27h12" stroke="#000" stroke-width="1.5"/></svg>',
    mid: J('mid') || Apps.ICON.txt,
    // the dodgy shareware shelf
    fireworks: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="5" fill="#000080"/><rect x="7" y="13" width="18" height="11" fill="#000"/><g stroke-width="1.2"><path d="M16 18l-4-3M16 18l4-3M16 18l0-4M16 18l-5 1M16 18l5 1M16 18l-3 4M16 18l3 4" stroke="#ffd400"/></g><circle cx="10" cy="15" r="1" fill="#f0f"/><circle cx="22" cy="21" r="1" fill="#0ff"/><path d="M24 2l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill="#ff3"/></svg>',
    buddy: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="27" rx="10" ry="3" fill="#000" opacity=".2"/><path d="M8 26q-2-9 8-10 10 1 8 10z" fill="#7a2ab8" stroke="#2a0a4a"/><circle cx="16" cy="11" r="8" fill="#9a4ad8" stroke="#2a0a4a"/><ellipse cx="16" cy="14" rx="5" ry="3.4" fill="#d8b0f0"/><circle cx="13" cy="9" r="2" fill="#fff"/><circle cx="19" cy="9" r="2" fill="#fff"/><circle cx="13.4" cy="9.4" r=".9"/><circle cx="19.4" cy="9.4" r=".9"/><path d="M13 15q3 2 6 0" stroke="#2a0a4a" fill="none"/><path d="M6 7l-3-3M26 7l3-3" stroke="#9a4ad8" stroke-width="2"/><rect x="18" y="20" width="10" height="7" rx="1" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M20 22h6M20 24h4" stroke="#00f" stroke-width=".7"/></svg>',
    ramdbl: '<svg viewBox="0 0 32 32"><rect x="2" y="11" width="28" height="10" fill="#0a6a2a" stroke="#000"/><g fill="#222"><rect x="5" y="13" width="4" height="5"/><rect x="11" y="13" width="4" height="5"/><rect x="17" y="13" width="4" height="5"/><rect x="23" y="13" width="4" height="5"/></g><path d="M4 21v3M7 21v3M10 21v3M13 21v3M16 21v3M19 21v3M22 21v3M25 21v3M28 21v3" stroke="#d8b040"/><text x="16" y="9" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="9" fill="#e10600" stroke="#fff" stroke-width=".4">x2!</text></svg>',
    modem: '<svg viewBox="0 0 32 32"><path d="M3 18h26l-3 7H6z" fill="#d8d0c0" stroke="#000"/><rect x="3" y="15" width="26" height="4" fill="#ece4d4" stroke="#000"/><g fill="#0c0"><circle cx="8" cy="22" r="1"/><circle cx="12" cy="22" r="1"/></g><circle cx="16" cy="22" r="1" fill="#f80"/><path d="M8 12q8-8 16 0M11 12q5-5 10 0" stroke="#e10600" stroke-width="1.6" fill="none"/><text x="16" y="7" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="7" fill="#e10600">300%</text></svg>',
    regfix: '<svg viewBox="0 0 32 32"><g fill="#3a7ad8" stroke="#003a80"><rect x="3" y="4" width="10" height="8"/><rect x="11" y="13" width="10" height="8"/><rect x="19" y="22" width="10" height="7"/></g><path d="M8 12v5h3M16 21v5h3" stroke="#000" fill="none"/><circle cx="23" cy="9" r="6" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M27 13l4 4" stroke="#000" stroke-width="3"/><path d="M20 9h6M23 6v6" stroke="#e10600" stroke-width="1.6"/></svg>',
    y2ksuite: '<svg viewBox="0 0 32 32"><rect x="5" y="9" width="10" height="17" rx="1" fill="#c8c8c8" stroke="#555"/><rect x="5" y="13" width="10" height="9" fill="#e8a020"/><text x="10" y="20" text-anchor="middle" font-family="Arial" font-size="5" font-weight="bold" fill="#fff">BEANS</text><rect x="16" y="4" width="13" height="10" fill="#000" stroke="#808080"/><text x="22.5" y="11.5" text-anchor="middle" font-family="Courier New" font-size="6.5" font-weight="bold" fill="#f00">Y2K</text><path d="M18 18h9l-1 8h-7z" fill="#ffd400" stroke="#806000"/><circle cx="22.5" cy="17" r="2" fill="#fff" stroke="#806000"/></svg>',
    winsquig: '<svg viewBox="0 0 32 32"><path d="M5 9h22v19H5z" fill="#c8a060" stroke="#5a3a10"/><path d="M5 9l4-5h14l4 5" fill="#d8b070" stroke="#5a3a10"/><path d="M14 4h4v24h-4z" fill="#ffd400" stroke="#806000" stroke-width=".6"/><path d="M14 8h4M14 12h4M14 16h4M14 20h4M14 24h4" stroke="#806000" stroke-width=".8"/><circle cx="16" cy="18" r="5" fill="#e8381b" stroke="#000"/><circle cx="14.4" cy="17" r="1.2" fill="#fff"/><circle cx="17.6" cy="17" r="1.2" fill="#fff"/><path d="M5 9l-3 4M27 9l3 4" stroke="#5a3a10" stroke-width="1.5"/></svg>',
    prank: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#000" stroke="#808080"/><text x="4" y="12" font-family="Courier New" font-size="6" fill="#c0c0c0">C:\\&gt;format</text><rect x="5" y="16" width="22" height="5" fill="#fff" stroke="#c0c0c0" stroke-width=".5"/><rect x="5" y="16" width="14" height="5" fill="#00a"/><circle cx="25" cy="25" r="6" fill="#ffd400" stroke="#000"/><circle cx="23" cy="24" r=".9"/><circle cx="27" cy="24" r=".9"/><path d="M22 26.5q3 3 6 0" stroke="#000" fill="none"/></svg>',
    weather: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="28" height="26" rx="2" fill="#2a6ad8" stroke="#003a80"/><circle cx="11" cy="11" r="5" fill="#ffd400"/><ellipse cx="19" cy="15" rx="9" ry="5" fill="#eee" stroke="#888"/><path d="M14 21l-2 4M19 21l-2 4M24 21l-2 4" stroke="#9fd0ff" stroke-width="1.5"/><rect x="2" y="26" width="28" height="3" fill="#e10600"/></svg>',
    cursors: '<svg viewBox="0 0 32 32"><path d="M4 3v20l5-5 4 9 3-1-4-9h7z" fill="#fff" stroke="#000"/><path d="M18 14l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill="#ffd400" stroke="#a07000" stroke-width=".6"/><circle cx="26" cy="8" r="4" fill="#e8381b" stroke="#000"/><circle cx="25" cy="7" r="1" fill="#fff"/><path d="M22 28q4-5 8-2" stroke="#f0f" stroke-width="2" fill="none"/></svg>',
    photo: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="20" fill="#fff" stroke="#000"/><rect x="5" y="8" width="22" height="16" fill="#5ab8f0"/><path d="M5 24l7-8 5 5 4-3 6 6z" fill="#2a8a2a"/><circle cx="22" cy="12" r="2.4" fill="#ffd400"/><rect x="20" y="2" width="10" height="7" fill="#e10600" stroke="#000" stroke-width=".6"/><text x="25" y="7.5" text-anchor="middle" font-family="Arial" font-size="5" font-weight="bold" fill="#fff">NEW</text></svg>',
    squigso: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#0000aa" stroke="#808080"/><text x="5" y="13" font-family="Courier New" font-size="6" font-weight="bold" fill="#ff5">HELLO</text><text x="5" y="20" font-family="Courier New" font-size="6" font-weight="bold" fill="#fff">&gt;_</text><circle cx="24" cy="22" r="6" fill="#e8c8a0" stroke="#000"/><path d="M19 19h10" stroke="#000"/><circle cx="21.5" cy="21" r="1.6" fill="#fff" stroke="#000" stroke-width=".6"/><circle cx="26.5" cy="21" r="1.6" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M22 25q2 1 4 0" stroke="#000" fill="none"/><path d="M18 30h12" stroke="#fff" stroke-width="2"/></svg>',
    bowling: '<svg viewBox="0 0 32 32"><path d="M10 2h12l8 28H2z" fill="#d8a060" stroke="#7a4a1a"/><path d="M16 2v28M13 2l-3 28M19 2l3 28" stroke="#c08a50" stroke-width=".6"/><g transform="translate(11 10)"><path d="M-1 -4.2l-1 -1.6M1 -4.2l1 -1.6" stroke="#1d4a10" stroke-width=".5"/><circle cx="-2" cy="-6" r=".6" fill="#b8ff60"/><circle cx="2" cy="-6" r=".6" fill="#b8ff60"/><path d="M-2.2 0c-1 3 0 5 .5 6h3.4c.5-1 1.5-3 .5-6z" fill="#5aac2c" stroke="#1d4a10" stroke-width=".6"/><circle cx="0" cy="-2" r="2.6" fill="#7acc4a" stroke="#1d4a10" stroke-width=".6"/><ellipse cx="-.9" cy="-2" rx=".6" ry=".9"/><ellipse cx=".9" cy="-2" rx=".6" ry=".9"/></g><g transform="translate(21 10)"><path d="M-1 -4.2l-1 -1.6M1 -4.2l1 -1.6" stroke="#1d4a10" stroke-width=".5"/><circle cx="-2" cy="-6" r=".6" fill="#b8ff60"/><circle cx="2" cy="-6" r=".6" fill="#b8ff60"/><path d="M-2.2 0c-1 3 0 5 .5 6h3.4c.5-1 1.5-3 .5-6z" fill="#5aac2c" stroke="#1d4a10" stroke-width=".6"/><circle cx="0" cy="-2" r="2.6" fill="#7acc4a" stroke="#1d4a10" stroke-width=".6"/><ellipse cx="-.9" cy="-2" rx=".6" ry=".9"/><ellipse cx=".9" cy="-2" rx=".6" ry=".9"/></g><g transform="translate(16 8)"><path d="M-1 -4.2l-1 -1.6M1 -4.2l1 -1.6" stroke="#1d4a10" stroke-width=".5"/><circle cx="-2" cy="-6" r=".6" fill="#b8ff60"/><circle cx="2" cy="-6" r=".6" fill="#b8ff60"/><path d="M-2.2 0c-1 3 0 5 .5 6h3.4c.5-1 1.5-3 .5-6z" fill="#5aac2c" stroke="#1d4a10" stroke-width=".6"/><circle cx="0" cy="-2" r="2.6" fill="#7acc4a" stroke="#1d4a10" stroke-width=".6"/><ellipse cx="-.9" cy="-2" rx=".6" ry=".9"/><ellipse cx=".9" cy="-2" rx=".6" ry=".9"/></g><defs><radialGradient id="eraBowl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6a8ae8"/><stop offset=".5" stop-color="#1a2a8a"/><stop offset="1" stop-color="#05082a"/></radialGradient></defs><circle cx="15" cy="24" r="5.5" fill="url(#eraBowl)" stroke="#000"/><circle cx="13.6" cy="22.4" r=".8" fill="#000"/><circle cx="15.8" cy="22" r=".8" fill="#000"/><circle cx="14.6" cy="24.4" r=".8" fill="#000"/><ellipse cx="12.4" cy="21.2" rx="1.4" ry=".7" fill="#fff" opacity=".7" transform="rotate(-35 12.4 21.2)"/></svg>',
    neko: '<svg viewBox="0 0 32 32"><path d="M4 4v16l4-4 3 7 2-1-3-7h6z" fill="#fff" stroke="#000"/><path d="M21 13v-3" stroke="#1a1e2a"/><circle cx="21" cy="9.4" r="1.2" fill="#ff3020" stroke="#1a1e2a" stroke-width=".5"/><path d="M15 15l1-4 3 3zM27 15l-1-4-3 3z" fill="#9aa2b2" stroke="#1a1e2a" stroke-width=".7"/><rect x="14.5" y="13.5" width="13" height="10" rx="3" fill="#c8d0dc" stroke="#1a1e2a"/><rect x="15.5" y="14.5" width="5" height="1" fill="#fff"/><rect x="16.5" y="16.5" width="9" height="3.6" rx="1" fill="#10141c"/><rect x="17.6" y="17.4" width="2" height="1.6" fill="#40e0ff"/><rect x="22.4" y="17.4" width="2" height="1.6" fill="#40e0ff"/><path d="M19.5 21.5h3" stroke="#5a6272"/><path d="M14.5 20.5l-2-.5M14.5 22l-2 .5M27.5 20.5l2-.5M27.5 22l2 .5" stroke="#5a6272" stroke-width=".6"/><rect x="16" y="23.5" width="10" height="4" rx="1.5" fill="#9aa2b2" stroke="#1a1e2a"/><rect x="16.5" y="27.5" width="3" height="2" fill="#5a6272"/><rect x="22.5" y="27.5" width="3" height="2" fill="#5a6272"/><path d="M26 25q4-1 3-5" stroke="#1a1e2a" fill="none"/><text x="26" y="8" font-family="Arial" font-size="7" font-weight="bold" fill="#000080">z</text></svg>',
    kpt: '<svg viewBox="0 0 32 32"><defs><radialGradient id="erakpt" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#d8a040"/><stop offset="1" stop-color="#402000"/></radialGradient></defs><rect x="1" y="1" width="30" height="30" rx="5" fill="#2a2a30" stroke="#000"/><circle cx="16" cy="16" r="10" fill="url(#erakpt)"/><circle cx="16" cy="16" r="5" fill="#2a2a30" opacity=".5"/><path d="M5 5q11 4 22 0M5 27q11-4 22 0" stroke="#7ac8ff" stroke-width="1.4" fill="none"/></svg>',
  };

  // ================================================================ the shared kit (window.Era), used by the lazy modules
  const E = window.Era = { mods: {}, savers: {}, I, esc, store, h, rnd, ri, pick, pad, sfx, note, today, hour, rng, css, phone, online: [] };
  E.secret = id => { try { return Apps.secret('era.' + id); } catch (e) { return false; } };
  E.load = file => Apps.load('js/era-apps-' + file + '.js');
  E.installed = app => !(window.Setup && typeof Setup.ok === 'function' && !Setup.ok(app));
  // a little JackOS 98 About box for every program
  E.about = (name, icon, lines) => {
    const b = h('div', 'era-about');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px"><span style="width:32px;height:32px;flex:none;display:inline-flex">${icon}</span><div style="flex:1;min-width:0">${lines.map((l, i) => `<p style="margin:${i ? 6 : 0}px 0 0">${l}</p>`).join('')}<hr style="margin:10px 0 6px"><p class="small" style="margin:0">This product is licensed to:<br><b>Jack</b><br>JACK ATTACK! Online</p></div></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="button" style="min-width:75px">OK</button></div>`;
    const w = Apps.win('About ' + name, b, { w: 360, icon, noResize: true, noMax: true, noMin: true, escClose: true });
    b.querySelector('.btn').addEventListener('click', w.close);
    return w;
  };
  // opens a program window straight away, fetches its module, then hands over: E.mods[mod](K, arg)
  E.launch = (spec, arg) => {
    const host = h('div', 'era-host era-' + spec.mod); host.tabIndex = -1;
    host.innerHTML = `<div class="era-load"><span class="era-loadico">${spec.icon}</span><div>Loading ${esc(spec.exe || spec.title)}...</div><div class="prog" style="width:160px"><span style="display:flex;gap:2px"></span></div></div>`;
    const cleanups = [];
    const w = Apps.win(spec.title, host, { w: spec.w, h: spec.h, icon: spec.icon, menubar: spec.menubar !== false, status: !!spec.status, noResize: !!spec.noResize, noMax: !!spec.noMax, noMin: !!spec.noMin, minW: spec.minW, minH: spec.minH, cls: 'era-win era-w-' + spec.mod + (spec.cls ? ' ' + spec.cls : ''), onClose: () => cleanups.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } }) });
    if (spec.phoneMax && (innerWidth < 640 || innerHeight < 540)) w.el.classList.add('maxwin');
    const bar = host.querySelector('.prog span'); let k = 0;
    const fill = setInterval(() => { if (k < 14) { bar.appendChild(document.createElement('i')); k++; } }, 50);
    E.load(spec.file).then(() => {
      clearInterval(fill);
      if (w.closed) return;
      const mod = E.mods[spec.mod]; if (!mod) throw new Error('missing module ' + spec.mod);
      host.innerHTML = '';
      const K = { w, body: host, arg, E, onClose: fn => cleanups.push(fn), get closed() { return w.closed; },
        menus: items => { if (w.menubar) Apps.menubar(w, items); }, status: t => { if (w.status) w.status.textContent = t; },
        fit: () => { const r = w.el.getBoundingClientRect(); w.el.style.left = Math.max(4, Math.min(innerWidth - r.width - 4, r.left)) + 'px'; w.el.style.top = Math.max(4, Math.min(innerHeight - r.height - 40, r.top)) + 'px'; } };
      mod(K, arg);
      setTimeout(() => { try { host.focus({ preventScroll: true }); } catch (e) {} }, 30);
    }).catch(e => {
      clearInterval(fill); console.error(e);
      if (w.closed) return;
      host.innerHTML = `<div class="era-load"><span class="era-loadico">${spec.icon}</span><div>${esc(spec.exe || spec.title)} could not be loaded.</div><div class="small">The floppy might be dodgy. Try again.</div></div>`;
    });
    return w;
  };
  css('core', `.era-load{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:140px;padding:20px;text-align:center}
.era-loadico{width:32px;height:32px;display:inline-flex}.era-loadico svg{width:32px;height:32px}
.era-host{outline:none}.era-about p{font:12px var(--ui)}.era-about hr{border:0;border-top:1px solid #808080;border-bottom:1px solid #fff}`);

  // ================================================================ the programs
  const PROGS = [
    { id: 'era.sweeper', mod: 'sweeper', file: 'sweep', title: 'Bugsweeper 2000', exe: 'SQSWEEP.EXE', icon: I.sweeper, noResize: true, noMax: true, status: false, path: ['Games', 'Bugsweeper 2000'], cmd: ['winmine', 'minesweeper', 'mines', 'squigsweeper', 'sweeper', 'sqsweep', 'winmine.exe', 'sqsweep.exe', 'bugsweeper', 'bugsweeper2000', 'bugsweeper 2000'] },
    { id: 'era.grotball', mod: 'grotball', file: 'ball', title: 'Jack Ball', exe: 'JACKBALL.EXE', icon: I.grotball, w: 560, h: 470, status: true, minW: 300, minH: 280, phoneMax: true, path: ['Games', 'Jack Ball'], cmd: ['jackball', 'jack ball', 'jackball.exe', 'grotball', 'grot ball', 'jezzball', 'jezz', 'grotball.exe'] },
    { id: 'era.revenge', mod: 'revenge', file: 'revenge', title: "Blobbit's Revenge", exe: 'SQREVNGE.EXE', icon: I.revenge, w: 520, h: 560, status: true, minW: 300, minH: 300, phoneMax: true, path: ['Games', "Blobbit's Revenge"], cmd: ['squigsrevenge', "squig's revenge", 'squigrevenge', 'rodent', 'rodentsrevenge', "rodent's revenge", 'sqrevnge', 'sqrevnge.exe', 'blobbitsrevenge', "blobbit's revenge", 'blobbitrevenge'] },
    { id: 'era.sqhome', mod: 'sqhome', file: 'seti', title: 'JACK@home', exe: 'JACKATHOME.EXE', icon: I.sqhome, w: 660, h: 470, status: true, minW: 320, minH: 260, path: ['JACK@home', 'JACK@home'], cmd: ['jack@home', 'jackathome', 'jackhome', 'squig@home', 'squigathome', 'squighome', 'seti', 'sety@home', 'setiathome', 'sqhome'] },
    { id: 'era.realsquig', mod: 'realsquig', file: 'media', title: 'RealJack Player', exe: 'RSQPLAY.EXE', icon: I.realsquig, w: 470, h: 430, status: true, minW: 300, minH: 300, path: ['RealJack', 'RealJack Player'], cmd: ['realjack', 'realjack player', 'realsquig', 'realplayer', 'realaudio', 'real', 'rsqplay', 'realsquig player'] },
    { id: 'era.squigster', mod: 'squigster', file: 'media', title: 'Jackster', exe: 'JACKSTER.EXE', icon: I.squigster, w: 640, h: 470, status: true, minW: 300, minH: 280, path: ['Jackster', 'Jackster'], cmd: ['jackster', 'jackster.exe', 'squigster', 'napster', 'squigster.exe'] },
    { id: 'era.staples', mod: 'staplesopt', file: 'staples', title: 'Staples', exe: 'STAPLES.EXE', icon: I.staples, w: 420, menubar: false, noResize: true, noMax: true, path: ['Accessories', 'Staples the Assistant'], cmd: ['staples', 'clippy', 'paperclip', 'assistant', 'office assistant'] },
    // ---- the dodgy shareware shelf (era-apps-dodgy.js / era-apps-dodgy2.js). nowin: the module draws its own thing, no window
    { id: 'era.fireworks', mod: 'fireworks', file: 'dodgy', title: 'Happy Jack 99', exe: 'FIREWORKS.EXE', icon: '', w: 420, h: 360, menubar: false, noMax: true, path: ["Dave's Stuff", 'FIREWORKS.EXE'], cmd: ['fireworks', 'fireworks.exe', 'happy99', 'happy99.exe', 'happyjack', 'happygrot'] },
    { id: 'era.buddy', mod: 'buddy', file: 'dodgy', nowin: true, title: 'Purple Pal', icon: '', path: ['Purple Pal', 'Purple Pal'], cmd: ['purplepal', 'purple pal', 'bonzi', 'bonzibuddy', 'buddy'] },
    { id: 'era.ramdbl', mod: 'ramdbl', file: 'dodgy', title: 'RAM Doubler 99', exe: 'RAMDBL99.EXE', icon: '', w: 400, menubar: false, noResize: true, noMax: true, path: ["Dave's Stuff", 'RAM Doubler 99'], cmd: ['ramdoubler', 'ram doubler', 'ramdbl', 'ramdbl99', 'softram', 'downloadram', 'download ram'] },
    { id: 'era.modem', mod: 'modem', file: 'dodgy', title: 'Modem Turbo 300%', exe: 'MDMTURBO.EXE', icon: '', w: 380, menubar: false, noResize: true, noMax: true, path: ['Modem Turbo 300%', 'Modem Turbo 300%'], cmd: ['modemturbo', 'modem turbo', 'turbomodem', 'mdmturbo'] },
    { id: 'era.regfix', mod: 'regfix', file: 'dodgy', title: 'Registry Fixer Pro 99', exe: 'REGFIXPRO.EXE', icon: '', w: 480, h: 400, menubar: true, status: true, path: ['Registry Fixer Pro', 'Registry Fixer Pro 99'], cmd: ['regfix', 'registry fixer', 'regfixpro', 'registryfixer', 'regclean'] },
    { id: 'era.y2ksuite', mod: 'y2ksuite', file: 'dodgy', title: 'Y2K Survival Suite 99 Deluxe', exe: 'Y2KSURV.EXE', icon: '', w: 520, h: 440, menubar: true, status: true, path: ['Y2K Survival Suite', 'Y2K Survival Suite 99 Deluxe'], cmd: ['y2ksuite', 'y2k survival', 'y2ksurvival', 'y2ksurv', 'bunker'] },
    { id: 'era.winsquig', mod: 'winsquig', file: 'dodgy', title: 'WinJack (Unregistered)', exe: 'WINJACK.EXE', icon: '', w: 520, h: 380, menubar: true, status: true, path: ['WinJack', 'WinJack'], cmd: ['winjack', 'winjack.exe', 'wingrot', 'winsquig', 'winzip', 'zip', 'unzip', 'pkzip', 'winsquig.exe'] },
    { id: 'era.prank', mod: 'prank', file: 'dodgy', title: 'FORMAT C:', exe: 'DAVE_JOKE.EXE', icon: '', w: 420, menubar: false, noResize: true, noMax: true, noMin: true, path: ["Dave's Stuff", 'DAVE_JOKE.EXE (do not open)'], cmd: ['dave_joke', 'davejoke', 'dave_joke.exe', 'joke.exe', 'prank'] },
    { id: 'era.weather', mod: 'weather', file: 'dodgy2', nowin: true, title: 'Desktop Weather', icon: '', path: ['Desktop Weather', 'Desktop Weather'], cmd: ['weather', 'desktopweather', 'desktop weather', 'weatherbug'] },
    { id: 'era.cursors', mod: 'cursors', file: 'dodgy2', title: 'FREE Cursors 4000', exe: 'CURS4000.EXE', icon: '', w: 460, h: 420, menubar: false, path: ['FREE Cursors 4000', 'FREE Cursors 4000'], cmd: ['cursors4000', 'free cursors', 'freecursors', 'comet', 'cometcursor', 'curs4000'] },
    { id: 'era.photo', mod: 'photo', file: 'dodgy2', title: 'JackShots Desktop', exe: 'JACKSHOT.EXE', icon: '', w: 520, h: 440, menubar: true, status: true, path: ['JackShots', 'JackShots Desktop'], cmd: ['jackshots', 'jackshot', 'grotshots', 'webshots', 'photooftheday', 'grotshot'] },
    { id: 'era.kpt', mod: 'kpt', file: 'dodgy2', title: "Jack's Power Tools", exe: 'GPT3.EXE', icon: '', w: 600, h: 470, menubar: false, minW: 300, minH: 300, phoneMax: true, path: ["Jack's Power Tools", "Jack's Power Tools 3"], cmd: ['kpt', 'powertools', "jack's power tools", "grot's power tools", 'gpt', 'gpt3', 'kaispowertools'] },
    { id: 'era.squigso', mod: 'squigso', file: 'dodgy3', title: 'Dr. Chatso', exe: 'SQUIGSO.EXE', icon: '', w: 560, h: 380, menubar: false, minW: 280, minH: 220, path: ['Jacktive Labs', 'Dr. Chatso'], cmd: ['squigso', 'drsquigso', 'dr squigso', 'sbaitso', 'drsbaitso', 'doctor', 'eliza', 'jackso', 'drjackso', 'dr jackso', 'chatso', 'drchatso', 'dr chatso'] },
    { id: 'era.bowling', mod: 'bowling', file: 'dodgy3', title: 'Alien Bowling 99', exe: 'SQBOWL99.EXE', icon: '', w: 560, h: 470, status: true, minW: 300, minH: 280, phoneMax: true, path: ['Games', 'Alien Bowling 99'], cmd: ['bowling', 'squigbowling', 'elfbowling', 'sqbowl99', 'squig bowling', 'alienbowling', 'alien bowling'] },
    { id: 'era.neko', mod: 'neko', file: 'dodgy3', nowin: true, title: 'Robo-Neko 98', icon: '', path: ['Robo-Neko 98', 'Robo-Neko 98'], cmd: ['neko', 'squigneko', 'neko98', 'oneko', 'roboneko', 'robo-neko'] },
  ];
  E.PROGS = PROGS;
  PROGS.forEach(p => { if (!p.icon) p.icon = I[p.mod] || Apps.ICON.exe; });
  PROGS.forEach(p => {
    const nowin = arg => { E.load(p.file).then(() => { const m = E.mods[p.mod]; if (m) m(null, arg); }).catch(e => console.error(e)); return null; };
    Apps.register(p.id, { single: !p.nowin, cmd: p.cmd, open: arg => p.nowin ? nowin(arg) : p.id === 'era.staples' && arg !== 'options' && arg !== 'gallery' ? (staples('summon'), null) : E.launch(p, arg) });
    Apps.addProgram(p.path, p.id, p.icon);
  });
  // WINMINE.EXE (C:\Program Files\Games) and Dad's old Program Manager look for 'winmine'
  Apps.register('winmine', { open() { Apps.open('era.sweeper'); return null; } });
  // JACK@home and RealJack get a Read Me in their Start menu folders, like the real installers left behind
  const readme = (name, text) => () => Apps.openFile({ name, type: 'txt', text });
  const SQH_README = `JACK@home v1.0 (for JackOS 95/98)\n==================================\n\nJACK@home uses your computer, while you're not using it, to search\nradio signals from space for signs of intelligent aliens.\n\nHOW IT WORKS\n1. JACK@home downloads a "work unit" (about 350 KB of noise) from the\n   Jackecibo Radio Telescope.\n2. Your computer looks through it for signals that aren't just noise.\n3. When it's done, it sends the result back and gets another one.\n\nEvery work unit anyone finishes is added to the GRAND TOTAL, so\neveryone on JackNet is hunting E.T. together.\n\nIt runs as a screen saver (Display Properties > Screen Saver) or in a\nwindow. Leave it running overnight! (Ask your Mom first. Electricity\ncosts money. Apparently.)\n\nJACK@home was inspired by a real project from the University of\nCalifornia, Berkeley that started on 17 May 1999 and searches for real\naliens. Ours does too. So far we have found: Dave's microwave.\n`;
  Apps.addProgram(['JACK@home', 'Read Me'], readme('README.TXT', SQH_README), Apps.ICON.txt);
  Apps.addProgram(['RealJack', 'Upgrade to RealJack Plus!'], () => Apps.open('era.realsquig', 'plus'), I.realsquig);
  Apps.addProgram(['Jackster', 'Read Me'], readme('JACKSTER.TXT', `JACKSTER v1.0 BETA\n===================\n\nShare your music with everyone on JackNet RIGHT NOW!\n\n1. Open Jackster.\n2. Type a song or band in the box and click Find It!\n3. Pick a song and click Get Selected Song(s).\n4. Wait. (Mom, do not pick up the phone.)\n5. The song goes in My Music and plays in JackAmp.\n\nThe songs come from the computers of the people who are on the site\nat the same time as you. When they log off, their songs go too.\n\nJackster only does MIDI files, not MP3s. An MP3 is about 3 MB.\nThat's ten minutes on a 56K. A MIDI is about the size of this file.\n\nThe Shareware Shack says: "Only share music you made yourself."\nThat's why everything on Jackster is by Jack, Dave and their bands.\n`), Apps.ICON.txt);

  // ================================================================ screen savers: 3D Jack Maze, Jack Island, JACK@home
  // apps-fun.js owns the screen saver system (window.Savers). We join it from here: our names go in the list, our
  // previews draw in Display Properties, and when one of ours starts we take over the full-screen canvas it makes.
  const MINE = {
    '3D Jack Maze': { key: 'maze', file: 'savers', app: 'era.maze', cmd: ['ssmaze', '3dmaze', 'maze', 'ss3dmaze', 'jackmaze', 'grotmaze', 'maze.scr'] },
    'Jack Island': { key: 'island', file: 'savers', app: 'era.island', cmd: ['ssisland', 'castaway', 'jackisland', 'grotisland', 'island', 'island.scr'] },
    'JACK@home': { key: 'seti', file: 'seti', app: 'era.sqhome', cmd: ['ssjack@home', 'sssquig@home', 'ssseti', 'sqhomesaver'] },
    'Robot Dance': { key: 'dance', file: 'dodgy2', app: 'era.ssdance', cmd: ['ssdance', 'grotdancesaver', 'hamsterdancesaver', 'ssgrotdance', 'robotdancesaver', 'ssrobotdance'] },
    'Dancing Baby Robot': { key: 'baby', file: 'dodgy2', app: 'era.ssbaby', cmd: ['ssbaby', 'dancingbaby', 'babygrot', 'ssdancingbaby', 'babyrobot'] },
  };
  E.MINE = MINE;
  // the savers that were renamed (Grot -> Jack, then Grot Dance -> Robot Dance): a screen saver picked under its old name keeps working
  const NEWNAME = { '3D Grot Maze': '3D Jack Maze', 'Grot Island': 'Jack Island', 'SQUIG@home': 'JACK@home', 'Grot Dance': 'Robot Dance', 'Dancing Baby Grot': 'Dancing Baby Robot' };
  E.saverAlias = NEWNAME;
  try { const v = localStorage.getItem('jhp_saver'), q = v && v[0] === '"', raw = q ? JSON.parse(v) : v; if (raw && NEWNAME[raw]) localStorage.setItem('jhp_saver', q ? JSON.stringify(NEWNAME[raw]) : NEWNAME[raw]); } catch (e) {}
  // drives one of our savers on any canvas (the same contract as apps-fun's: factory(g, W, H, o) -> { frame(dt, t) })
  function runMine(canvas, name, full, opts) {
    const def = MINE[name]; let stopped = false, raf = 0, last = 0, inst = null, W = 0, H = 0;
    const g = canvas.getContext('2d');
    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = Math.max(40, Math.round(full ? innerWidth : (r.width || canvas.width)));
      H = canvas.height = Math.max(30, Math.round(full ? innerHeight : (r.height || canvas.height)));
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      inst = E.savers[def.key](g, W, H, Object.assign({ full, preview: !full, k: Math.min(W, H) / 600 }, opts || {}));
    };
    const frame = t => {
      if (stopped) return;
      if (!canvas.isConnected) { stop(); return; }
      raf = requestAnimationFrame(frame);
      if (!full && !canvas.getClientRects().length) { last = 0; return; }
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      try { inst.frame(dt, t / 1000); } catch (e) { console.error(e); stop(); }
    };
    const onRes = () => { if (!stopped) build(); };
    function stop() { stopped = true; cancelAnimationFrame(raf); if (full) removeEventListener('resize', onRes); if (inst && inst.stop) try { inst.stop(); } catch (e) {} }
    E.load(def.file).then(() => { if (stopped || !E.savers[def.key]) return; build(); raf = requestAnimationFrame(frame); if (full) addEventListener('resize', onRes); }).catch(e => console.error(e));
    return stop;
  }
  E.runMine = runMine;
  let lastInput = Date.now();
  ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, () => { if (!(window.Savers && Savers.running)) lastInput = Date.now(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastInput = Date.now(); });
  const rawSaver = () => { let v = null; try { v = localStorage.getItem('jhp_saver'); } catch (e) {} if (v && v[0] === '"') { try { v = JSON.parse(v); } catch (e) {} } v = v == null ? '' : String(v); return NEWNAME[v] || v; };
  function takeOver(name) {
    const el = $('ffSaver'); if (!el || el._era) return false;
    el._era = name;
    const old = el.querySelector('canvas'); if (old) old.remove(); // the old saver's loop stops when its canvas leaves the page
    const c = document.createElement('canvas'); el.appendChild(c);
    el.setAttribute('aria-label', name + ' screen saver (press any key)');
    runMine(c, name, true);
    E.secret('saver.' + MINE[name].key);
    return true;
  }
  function hookSavers() {
    const S = window.Savers; if (!S || S._era) return; S._era = true;
    const oList = S.list, oPrev = S.preview, oStart = S.start, oConf = S.configure;
    S.list = () => (oList ? oList() : []).concat(Object.keys(MINE).filter(n => E.installed(MINE[n].app)));
    S.preview = (canvas, name) => MINE[name] ? (canvas ? runMine(canvas, name, false) : () => {}) : oPrev.call(S, canvas, name);
    S.start = (name, opts) => {
      const n = (name && NEWNAME[name]) || name || rawSaver();
      if (!MINE[n]) return oStart.call(S, name, opts);
      if (S.running || !E.installed(MINE[n].app)) return;
      oStart.call(S, 'Starfield Simulation', opts); takeOver(n); // (a host without the golden-pie check)
    };
    const od = Object.getOwnPropertyDescriptor(S, 'running');
    if (od && od.get && od.configurable) Object.defineProperty(S, 'running', { configurable: true, get() { const el = $('ffSaver'); return el && el._era ? el._era : od.get.call(S); } });
    S.configure = name => MINE[name] ? saverSettings(name) : (oConf && oConf.call(S, name));
    // when the idle timer starts the visitor's chosen saver and it's one of ours, swap it in
    new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) if (n.id === 'ffSaver' && !n._era) {
        const want = rawSaver();
        if (MINE[want] && Date.now() - lastInput > 15000 && E.installed(MINE[want].app)) takeOver(want);
      }
    }).observe(DesktopSurface.root(), { childList: true });
    // when one of ours is the chosen saver, start it a moment before apps-fun's idle timer would (same rules as its idleBlocked)
    const shown = id => { const e = $(id); return e && !e.hidden && getComputedStyle(e).display !== 'none'; };
    const waitMin = () => { let v = null; try { v = localStorage.getItem('jhp_saverwait'); } catch (e) {} if (v == null || v === '') return 3; const x = parseFloat(String(v).replace(/"/g, '')); return isFinite(x) ? Math.max(0, x) : 3; };
    setInterval(() => {
      const want = rawSaver(), wt = waitMin();
      if (!MINE[want] || !wt || S.running || document.hidden || $('boot') || !E.installed(MINE[want].app)) return;
      if (['bsod', 'dos', 'standby', 'shutdown', 'saverFull', 'y2kEvent', 'dimmer', 'safeoff'].some(shown)) return;
      const a = document.activeElement;
      if (a && a !== document.body && (a.tagName === 'CANVAS' || (a.closest && a.closest('.gbshell,[data-game],.game,.gamewin')))) return;
      if (Date.now() - lastInput > wt * 60000 - 2500) S.start(want);
    }, 1000);
    // "saver" in Run starts whatever is chosen in Display Properties, ours included
    Apps.cmd(['saver', 'screensaver', 'scr', 'ss'], () => setTimeout(() => { const n = rawSaver(); S.start(!n || /^\(?none\)?$/i.test(n) ? 'Flying Saucers' : n); }, 250));
    window.dispatchEvent(new CustomEvent('jhp-savers'));
  }
  function saverSettings(name) {
    const k = MINE[name].key;
    if (k === 'maze') return mazeSettings();
    if (k === 'island') return Desk.msgbox('Jack Island Setup', 'Jack Island has no settings. He lives on the island and does what he likes.\n\nHe gets up with the sun and goes to bed when it gets dark, using your computer\'s clock. Some days of the year are special. Have a look on Bonfire Night. Or in December.', 'info');
    if (k !== 'seti') return E.saverConf && E.saverConf[k] ? E.saverConf[k]() : Desk.msgbox(name, name + ' has no settings. It just dances. That is all it does. It is perfect.', 'info');
    return Desk.msgbox('JACK@home', 'JACK@home Settings\n\nProcess data: Always\nShow graphics: Yes\nConnect to the Internet when needed: Yes (sorry, Mom)\nUser: ' + (window.Net && Net.me && Net.me.nick || 'Jack') + '\n\nIt will analyse work units whenever the screen saver is running, or when JACK@home is open in a window.', 'info');
  }
  function mazeSettings() {
    const o = store.get('jhp_era_maze', { wall: 'brick', floor: 'grey', ceil: 'grey', size: 'normal', grot: true, squigs: true });
    const b = h('form', 'era-mazeset');
    const sel = (k, opts) => `<select data-k="${k}">${opts.map(([v, l]) => `<option value="${v}"${o[k] === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
    b.innerHTML = `<div class="group"><span class="lg">Surfaces</span><div class="row"><label style="width:60px">Wall:</label>${sel('wall', [['brick', 'Red brick'], ['stone', 'Grey stone'], ['wood', 'Wood panels'], ['ork', 'Robo Rumble scrap metal']])}</div><div class="row" style="margin-top:4px"><label style="width:60px">Floor:</label>${sel('floor', [['grey', 'Grey tiles'], ['carpet', 'Red carpet'], ['grass', 'Grass']])}</div><div class="row" style="margin-top:4px"><label style="width:60px">Ceiling:</label>${sel('ceil', [['grey', 'Grey tiles'], ['sky', 'Night sky'], ['wood', 'Wooden beams']])}</div></div>
      <div class="group"><span class="lg">Options</span><div class="row"><label style="width:60px">Size:</label>${sel('size', [['small', 'Small'], ['normal', 'Normal'], ['huge', 'Huge (Dave got lost)']])}</div><label style="display:block;margin-top:6px"><input type="checkbox" data-c="grot"${o.grot ? ' checked' : ''}> Spinning robot heads</label><label style="display:block"><input type="checkbox" data-c="squigs"${o.squigs ? ' checked' : ''}> Blobbits running about</label></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" style="min-width:75px">Cancel</button></div>`;
    const w = Apps.win('3D Jack Maze Setup', b, { w: 320, icon: I.maze, noResize: true, noMax: true, noMin: true, escClose: true });
    b.querySelector('[type=button]').addEventListener('click', w.close);
    b.addEventListener('submit', ev => {
      ev.preventDefault();
      b.querySelectorAll('select').forEach(s => { o[s.dataset.k] = s.value; });
      b.querySelectorAll('[data-c]').forEach(c => { o[c.dataset.c] = c.checked; });
      store.set('jhp_era_maze', o); w.close();
      if (o.wall === 'ork') E.secret('maze.ork');
      Desk.toast('3D Jack Maze', 'Settings saved. The maze will be rebuilt the next time it runs.', 3000);
    });
  }
  E.mazeSettings = mazeSettings;
  // the screen savers are also little programs (so the installer can add and remove them)
  for (const [name, d] of Object.entries(MINE)) {
    if (d.key !== 'seti') Apps.register(d.app, { cmd: d.cmd, open() { setTimeout(() => window.Savers ? Savers.start(name) : null, 250); return null; } });
    else Apps.cmd(d.cmd, () => setTimeout(() => window.Savers && Savers.start(name), 250));
    Apps.addProgram(['Accessories', 'Screen Savers', name], () => window.Savers ? Savers.start(name) : Desk.msgbox(name, 'The screen saver system is not installed.', 'warn'), d.key === 'maze' ? I.maze : d.key === 'island' ? I.island : d.key === 'seti' ? I.sqhome : I.saver);
  }
  Apps.addProgram(['Accessories', 'Screen Savers', '3D Jack Maze Setup...'], mazeSettings, I.maze);
  Apps.addProgram(['JACK@home', 'JACK@home Screen Saver'], () => window.Savers && Savers.start('JACK@home'), I.sqhome);
  if (window.Savers) hookSavers(); else document.addEventListener('DOMContentLoaded', hookSavers);

  // ================================================================ Staples the paperclip: watches for writing programs opening
  // Gentle: never more than once per program per visit, a dice roll on top, never when switched off, never in a screen saver.
  const ST = () => store.get('jhp_era_staples', { on: true, who: 'staples', seen: {}, nope: 0 });
  E.staplesCfg = ST; E.staplesSave = v => store.set('jhp_era_staples', v);
  const stSeen = {}; let stBusy = false;
  function stWatch(node) {
    if (!node || node.nodeType !== 1 || !node.classList || !node.classList.contains('appwin')) return;
    if (!E.installed('era.staples')) return;
    setTimeout(() => {
      const t = (node.querySelector('.tb .t') || {}).textContent || '';
      const m = /- (Jotpad|WordPod|JackCalc|Write)$/.exec(t); if (!m) return;
      const cfg = ST(); if (!cfg.on) return;
      const prog = m[1];
      // "Dear ..." at the start of a document always gets the famous letter offer (unless that tip was switched off)
      const ed = node.querySelector('textarea,[contenteditable="true"],[contenteditable=""]');
      if (ed && !ed._era) {
        ed._era = 1;
        const chk = () => {
          const v = (ed.value != null ? ed.value : ed.textContent || '').slice(0, 40);
          if (/^\s*dear\s+\S+/i.test(v) && !ed._eraLetter) { ed._eraLetter = 1; staples('letter', { prog, win: node }); }
        };
        ed.addEventListener('input', chk); ed.addEventListener('keyup', chk);
      }
      if (stSeen[prog] || stBusy || (window.Savers && Savers.running) || document.hidden) return;
      stSeen[prog] = 1;
      const first = !cfg.seen['hello'];
      if (first || Math.random() < 0.35) setTimeout(() => { if (node.isConnected) staples(first ? 'hello' : 'open', { prog, win: node }); }, 1600);
    }, 60);
  }
  function staples(kind, ctx) {
    const cfg = ST(); if (!cfg.on && kind !== 'summon') return;
    if (kind !== 'summon' && kind !== 'letter' && cfg.seen[kind + ':' + (ctx && ctx.prog)] === 'never') return;
    if (kind === 'letter' && cfg.seen.letter === 'never') return;
    stBusy = true;
    E.load('staples').then(() => { if (E.staplesShow) E.staplesShow(kind, ctx || {}); }).catch(e => console.error(e)).finally(() => { stBusy = false; });
  }
  E.staples = staples;
  new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) stWatch(n); }).observe(DesktopSurface.root(), { childList: true });

  // ================================================================ Jackster: everyone on the site shares their My Music
  // Net.relay 'era.sqs': {q:'ls'} asks; {a:'ls', ids:[...]} answers (only ids from our own catalogue, so nothing odd travels).
  // {q:'up', id} tells a sharer someone is downloading from them (it shows in their Transfer tab if Jackster is open).
  E.sqs = { lists: {}, uploads: [], onList: null, onUp: null };
  const myDownloads = () => store.get('jhp_era_sqsdl', []).filter(x => typeof x === 'string' && /^[a-z0-9_.-]{1,24}$/.test(x)).slice(0, 60);
  E.sqs.mine = myDownloads;
  if (window.Net && Net.on) {
    Net.on('online', m => { if (m && Array.isArray(m.online)) E.online = m.online; });
    let lastAns = 0; const upFrom = {};
    if (Net.onRelay) Net.onRelay('era.sqs', (d, msg) => {
      if (!d || typeof d !== 'object' || !msg) return;
      if (d.q === 'ls') {
        const now = Date.now(); if (now - lastAns < 2500) return; lastAns = now;
        setTimeout(() => Net.relay(msg.fromId, 'era.sqs', { a: 'ls', ids: myDownloads() }), 200 + Math.random() * 600);
      } else if (d.a === 'ls' && Array.isArray(d.ids)) {
        E.sqs.lists[msg.fromId] = d.ids.filter(x => typeof x === 'string' && /^[a-z0-9_.-]{1,24}$/.test(x)).slice(0, 60);
        if (E.sqs.onList) E.sqs.onList(msg.fromId);
      } else if (d.q === 'up' && typeof d.id === 'string' && /^[a-z0-9_.-]{1,24}$/.test(d.id)) {
        const now = Date.now(); if (now - (upFrom[msg.fromId] || 0) < 4000) return; upFrom[msg.fromId] = now;
        E.sqs.uploads.unshift({ id: d.id, nick: String(msg.from || 'someone').slice(0, 24), t: now }); E.sqs.uploads.length = Math.min(E.sqs.uploads.length, 20);
        if (E.sqs.onUp) E.sqs.onUp();
      }
    });
  }

  // a FREE Cursors 4000 cursor comes back after a reload
  if (store.get('jhp_era_cursor', null)) E.load('dodgy2').then(() => E.cursorBoot && E.cursorBoot()).catch(() => {});
  // Jackster downloads come back into My Music every visit (the catalogue and the .mid opener live in era-apps-media.js)
  if (myDownloads().length) setTimeout(() => E.load('media').catch(() => {}), 3000);

  // ================================================================ installer entries (setup.js)
  const P = (id, o) => { try { if (window.Setup && Setup.product) Setup.product(id, o); } catch (e) { console.error(e); } };
  P('sweeper', { n: 'Bugsweeper 2000', v: '1.0', kb: 23, lic: 'Freeware', by: 'JackSoft Games Division', cat: 'games', sq: 5, rel: '10/12/98',
    d: 'Find all the Y2K bugs hiding in the field before the Millennium does! Right-click to flag them. Click the smiley to start again. You will play this for the rest of your life.',
    note: 'Best time on Beginner: 14 seconds (Jack). Best time on Intermediate: 61 seconds (' + Cast.n('teacher') + ', Computer Club). Expert: nobody.',
    apps: ['era.sweeper', 'winmine'], paths: ['Games > Bugsweeper 2000'], icons: [], def: true, launch: 'era.sweeper', exe: 'SQSWEEP.EXE', dir: 'Bugsweeper' });
  P('grotball', { n: 'Jack Ball', v: '1.1', kb: 312, lic: 'Freeware', by: 'JackSoft Entertainment Pack 4', cat: 'games', sq: 5, rel: '22/03/99',
    d: 'Bouncing balls! Build walls to trap them in smaller and smaller spaces. Fill 75% of the box to win the level. If a ball hits your wall while it is being built, you lose a life.',
    note: 'Right-click (or click the arrow button) to turn the wall-builder round.', apps: ['era.grotball'], paths: ['Games > Jack Ball'], icons: [], def: false, launch: 'era.grotball', exe: 'JACKBALL.EXE', dir: 'Jack Ball' });
  P('revenge', { n: "Blobbit's Revenge", v: '1.0', kb: 148, lic: 'Freeware', by: 'JackSoft Entertainment Pack 4', cat: 'games', sq: 5, rel: '22/03/99',
    d: 'You are a Blobbit. The tin robots want to put you in a jar. Push the blocks around and trap the robots until they give up and turn into cheese. Then eat the cheese. Revenge is tasty.',
    apps: ['era.revenge'], paths: ["Games > Blobbit's Revenge"], icons: [], def: false, launch: 'era.revenge', exe: 'SQREVNGE.EXE', dir: "Blobbit's Revenge" });
  P('maze', { n: '3D Jack Maze Screen Saver', v: '1.0', kb: 186, lic: 'Freeware', by: 'JackSoft OpenJack Team', cat: 'savers', sq: 5, rel: '15/01/99',
    d: 'Fly through an endless brick maze in REAL 3D! Find the smiley face at the end. Watch out for spinning robot heads: they turn the world upside down.',
    note: 'Needs a 3D card? No! Runs on any Pent-Yum. Slowly on a 486.', apps: ['era.maze'], paths: ['Accessories > Screen Savers > 3D Jack Maze', 'Accessories > Screen Savers > 3D Jack Maze Setup...'], icons: [], def: false, launch: 'era.maze', exe: 'MAZE.SCR', dir: 'Screen Savers' });
  P('island', { n: 'Jack Island Screen Saver', v: '2.0', kb: 420, lic: 'Freeware', by: 'Gem & Sons Desktop Pets', cat: 'savers', sq: 4, rel: '01/04/99',
    d: 'Zib the little green alien is stuck on a desert island on your desktop (his flying saucer ran out of petrol)! He fishes, builds sandcastles and sends messages in bottles. He goes to bed when it gets dark (he uses YOUR clock). Special things happen on special days.',
    apps: ['era.island'], paths: ['Accessories > Screen Savers > Jack Island'], icons: [], def: false, launch: 'era.island', exe: 'ISLAND.SCR', dir: 'Screen Savers' });
  P('sqhome', { n: 'JACK@home', v: '1.0', kb: 690, lic: 'Freeware', by: 'Jackecibo Space Lab', cat: 'fun', sq: 5, rel: '17/05/99',
    d: 'Help search for intelligent aliens in space! Your computer analyses radio telescope data while you are not using it. Every work unit you finish is added to the JackNet grand total.',
    note: 'Possible signals are checked by a real rocket scientist. So far they have all been microwaves.', apps: ['era.sqhome'], paths: ['JACK@home >', 'Accessories > Screen Savers > JACK@home'], icons: [], def: false, launch: 'era.sqhome', exe: 'JACKATHOME.EXE', dir: 'JACK@home' });
  P('staples', { n: 'Staples the Office Assistant', v: '97', kb: 1450, lic: 'Freeware', by: 'JackSoft Office Team', cat: 'util', sq: 3, rel: '19/11/98',
    d: 'Staples is here to help! He pops up when you write things in Jotpad or WordPod and offers useful advice. Also comes with a dog, a wizard, a robot and a Blobbit.',
    note: 'You can turn him off in Options. He will be sad. He will get over it.', apps: ['era.staples'], paths: ['Accessories > Staples the Assistant'], icons: [], def: false, launch: 'era.staples', exe: 'STAPLES.EXE', dir: 'Staples' });
  P('realsquig', { n: 'RealJack Player G2', v: '6.0', kb: 4210, lic: 'Adware', by: 'RealJack Networks', cat: 'mm', sq: 2, rel: '04/02/99',
    d: 'Watch LIVE video on the Internet! Telly-o-Rama, Jack FM, the news, the weather and more, streaming straight to your desktop at up to 20 Kbps! (Buffering may occur.)',
    note: 'Installs 3 toolbars, a tray icon and a reminder to upgrade to RealJack Plus every time you open it. You can\'t turn it off.', apps: ['era.realsquig'], paths: ['RealJack >'], icons: [], def: false, launch: 'era.realsquig', exe: 'RSQPLAY.EXE', dir: 'RealJack' });
  P('squigster', { n: 'Jackster', v: '1.0 beta', kb: 812, lic: 'Freeware', by: 'Jackster Inc. (a lad in his bedroom)', cat: 'net', sq: 5, rel: '01/07/99',
    d: 'Share music with everyone who is on JackNet RIGHT NOW! Search for a song, click Get, and it comes straight from their computer to yours. The future of music!',
    note: 'MIDI files only. If you want MP3s, buy a faster modem. Or a time machine.', apps: ['era.squigster'], paths: ['Jackster >'], icons: [], def: false, launch: 'era.squigster', exe: 'JACKSTER.EXE', dir: 'Jackster' });

  // ---- the dodgy shareware shelf. A few came pre-installed ("Dave put them on"), the rest are on the Shareware Shack.
  P('happy99', { n: 'Happy Jack 99 (FIREWORKS.EXE)', v: '1.0', kb: 10, lic: 'Freeware', by: 'unknown (it came in an e-mail)', cat: 'fun', sq: 1, rel: '20/01/99',
    d: 'A lovely fireworks display for your desktop! Came as an e-mail attachment from someone Dave knows. Totally safe. Probably.', note: 'Dave says: "it does fireworks!!! open it!!!"',
    apps: ['era.fireworks'], paths: ["Dave's Stuff > FIREWORKS.EXE"], icons: [], def: false, launch: 'era.fireworks', exe: 'FIREWORKS.EXE', dir: "Dave's Stuff" });
  P('ramdbl', { n: 'RAM Doubler 99', v: '3.1', kb: 88, lic: 'Shareware', by: 'MegaMem Software', cat: 'util', sq: 1, rel: '09/03/99',
    d: 'DOUBLE your RAM for FREE! Turn 32 MB into 64 MB with one click! No screwdriver needed! Your computer will be TWICE as fast!*', note: '*not actually faster',
    apps: ['era.ramdbl'], paths: ["Dave's Stuff > RAM Doubler 99"], icons: [], def: false, launch: 'era.ramdbl', exe: 'RAMDBL99.EXE', dir: 'RAM Doubler 99' });
  P('prank', { n: "Dave's Joke Program", v: '1.0', kb: 6, lic: 'Freeware', by: 'Dave', cat: 'fun', sq: 2, rel: '01/04/99',
    d: 'A hilarious joke program. Send it to your mates! (Dave sent it to Jack. Jack nearly cried.)', apps: ['era.prank'], paths: ["Dave's Stuff > DAVE_JOKE.EXE (do not open)"], icons: [], def: false, launch: 'era.prank', exe: 'DAVE_JOKE.EXE', dir: "Dave's Stuff" });
  P('winsquig', { n: 'WinJack 7.0', v: '7.0 SR-1', kb: 920, lic: 'Shareware', by: 'Jack Computing Inc.', cat: 'util', sq: 4, rel: '12/06/99',
    d: 'The archive utility everyone uses! Squash your files into .SQG archives and unsquash them again. Free 21-day evaluation.', note: 'Nobody has ever registered WinJack. Nobody.',
    nonag: true, apps: ['era.winsquig'], paths: ['WinJack >'], icons: [], def: false, launch: 'era.winsquig', exe: 'WINJACK.EXE', dir: 'WinJack' });
  P('ssdance', { n: 'Robot Dance Screen Saver', v: '1.0', kb: 140, lic: 'Freeware', by: 'RoboDance Fan Club', cat: 'savers', sq: 5, rel: '14/04/99',
    d: 'The famous dancing robots from the Internet, now as a screen saver! With the song! (Turn the speakers down if your Mom is on the phone.)',
    apps: ['era.ssdance'], paths: ['Accessories > Screen Savers > Robot Dance'], icons: [], def: false, launch: 'era.ssdance', exe: 'GROTDNCE.SCR', dir: 'Screen Savers' });
  P('ssbaby', { n: 'Dancing Baby Robot Screen Saver', v: '1.2', kb: 512, lic: 'Freeware', by: 'Ooga Animation Ltd', cat: 'savers', sq: 4, rel: '11/02/99',
    d: 'The 3D dancing baby robot that everybody e-mailed to everybody! Rendered in REAL 3D (on a 3D card it is even more 3D).',
    apps: ['era.ssbaby'], paths: ['Accessories > Screen Savers > Dancing Baby Robot'], icons: [], def: false, launch: 'era.ssbaby', exe: 'BABYGROT.SCR', dir: 'Screen Savers' });
  P('buddy', { n: 'Purple Pal 99', v: '2.0', kb: 3880, lic: 'Adware', by: 'PalSoft Interactive', cat: 'fun', sq: 2, rel: '28/07/99',
    d: 'Your new best friend! Purple Pal tells jokes, sings songs, reads your e-mail OUT LOUD and helps you surf the web! FREE!', note: 'May change your home page. May change your search page. May have already changed them. It\'s fine.',
    apps: ['era.buddy'], paths: ['Purple Pal >'], icons: [], def: false, launch: 'era.buddy', exe: 'PURPAL.EXE', dir: 'Purple Pal' });
  P('modem', { n: 'Modem Turbo 300%', v: '1.5', kb: 64, lic: 'Shareware', by: 'NetZoom Labs', cat: 'net', sq: 1, rel: '17/02/99',
    d: 'Make your 56K modem go 300% faster with our patented TurboTune technology! Hear the difference!', note: 'Results may vary. Results will not vary. There are no results.',
    apps: ['era.modem'], paths: ['Modem Turbo 300% >'], icons: [], def: false, launch: 'era.modem', exe: 'MDMTURBO.EXE', dir: 'Modem Turbo' });
  P('regfix', { n: 'Registry Fixer Pro 99', v: '4.0', kb: 1210, lic: 'Shareware', by: 'CleanPC Solutions', cat: 'util', sq: 2, rel: '05/05/99',
    d: 'Is your PC slow? It could be REGISTRY ERRORS! Registry Fixer Pro scans your registry and finds THOUSANDS of errors. Then fixes them!', note: 'Free scan! Fixing costs $29.95. Or does it?',
    nonag: true, apps: ['era.regfix'], paths: ['Registry Fixer Pro >'], icons: [], def: false, launch: 'era.regfix', exe: 'REGFIXPRO.EXE', dir: 'Registry Fixer Pro' });
  P('y2ksuite', { n: 'Y2K Survival Suite 99 Deluxe', v: '1.999', kb: 2048, lic: 'Shareware', by: 'MillenniumSafe Ltd', cat: 'home', sq: 3, rel: '09/09/99',
    d: 'Is YOUR family ready for the Millennium Bug? Plan your bunker, count your beans, test your toaster. Everything you need for 01/01/2000!',
    apps: ['era.y2ksuite'], paths: ['Y2K Survival Suite >'], icons: [], def: false, launch: 'era.y2ksuite', exe: 'Y2KSURV.EXE', dir: 'Y2K Survival Suite' });
  P('weather', { n: 'Desktop Weather (with adverts)', v: '2.1', kb: 760, lic: 'Adware', by: 'SkyWatch Desktop', cat: 'home', sq: 3, rel: '30/04/99',
    d: 'Live weather on your desktop, all day! Temperature, clouds and a 5-day forecast. Free! (Supported by a few small, tasteful adverts.)',
    apps: ['era.weather'], paths: ['Desktop Weather >'], icons: [], def: false, launch: 'era.weather', exe: 'DESKWTHR.EXE', dir: 'Desktop Weather' });
  P('cursors', { n: 'FREE Cursors 4000', v: '4000', kb: 1530, lic: 'Adware', by: 'CursorWorld', cat: 'fun', sq: 3, rel: '21/08/99',
    d: '4000 FREE animated cursors!!! Blobbits! Stars! Rockets! A tiny Dave! Make your mouse pointer COOL!', note: 'Only 12 cursors are actually included. The other 3,988 are coming in the next version.',
    apps: ['era.cursors'], paths: ['FREE Cursors 4000 >'], icons: [], def: false, launch: 'era.cursors', exe: 'CURS4000.EXE', dir: 'FREE Cursors 4000' });
  P('photo', { n: 'JackShots Desktop', v: '3.0', kb: 2200, lic: 'Freeware', by: 'JackShots.netz', cat: 'home', sq: 4, rel: '18/06/99',
    d: 'A brand new photo for your desktop wallpaper EVERY DAY! Beautiful pictures of kittens, sunsets, space and some very nice rocks.',
    apps: ['era.photo'], paths: ['JackShots >'], icons: [], def: false, launch: 'era.photo', exe: 'JACKSHOT.EXE', dir: 'JackShots' });
  P('kpt', { n: "Jack's Power Tools 3", v: '3.0', kb: 3100, lic: 'Demo', by: 'MetaJack Creations', cat: 'mm', sq: 4, rel: '03/03/99',
    d: 'Make AMAZING pictures with no skill at all! Spheres! Fractals! Gradients! Twirls! The interface is made of shiny rocks and nobody knows what any of the buttons do.',
    apps: ['era.kpt'], paths: ["Jack's Power Tools >"], icons: [], def: false, launch: 'era.kpt', exe: 'GPT3.EXE', dir: "Jack's Power Tools" });

  P('squigso', { n: 'Dr. Chatso', v: '2.21', kb: 96, lic: 'Freeware', by: 'Jacktive Labs', cat: 'fun', sq: 4, rel: '15/06/92',
    d: 'The TALKING computer doctor that came free with your sound card! Tell him your problems. He will listen. Then he will ask how that makes you feel.', note: 'Requires a Sound Bluster compatible sound card. Be nice to him or he gets a PARITY ERROR.',
    apps: ['era.squigso'], paths: ['Jacktive Labs >'], icons: [], def: false, launch: 'era.squigso', exe: 'SQUIGSO.EXE', dir: 'Jacktive Labs' });
  P('bowling', { n: 'Alien Bowling 99', v: '1.0', kb: 1640, lic: 'Freeware', by: 'Jack Logistics Ltd (Christmas promotion)', cat: 'games', sq: 5, rel: '14/12/98',
    d: 'Bowl at ten cheeky little green men! They will make fun of you. Knock them all down! A free Christmas gift: please forward to everyone you know!', note: 'Came in Dad\'s work e-mail. Nobody at his office did any work for a week.',
    apps: ['era.bowling'], paths: ['Games > Alien Bowling 99'], icons: [], def: false, launch: 'era.bowling', exe: 'SQBOWL99.EXE', dir: 'Alien Bowling' });
  P('neko', { n: 'Robo-Neko 98', v: '98', kb: 31, lic: 'Freeware', by: 'a student in a dormitory', cat: 'fun', sq: 5, rel: '08/08/98',
    d: 'A tiny robot lives on your desktop and chases your mouse pointer! When you stop, it yawns and powers down for a nap. That is all it does. It is perfect.',
    apps: ['era.neko'], paths: ['Robo-Neko 98 >'], icons: [], def: false, launch: 'era.neko', exe: 'NEKO98.EXE', dir: 'Robo-Neko 98' });

  // ================================================================ secrets
  [['sweep.xyzzy', 'Plugh!', 'An old adventure-game magic word works in the bug field. Then hold Shift and press Enter, and look very closely at the corner of the screen'],
    ['sweep.win', 'Millennium ready', 'Clear a bug field without stepping on one'],
    ['sweep.ali', Cast.n('teacher') + "'s record", 'Beat the Computer Club teacher\'s Intermediate time'],
    ['sweep.expert', 'Expert sweeper', 'Clear the biggest field there is. Dad says it is impossible'],
    ['sweep.quick', 'Unlucky first step', 'Some fields end before they begin. Count the clicks'],
    ['ball.clear', 'Ball control', 'Fill three quarters of the box in the bouncing ball game'],
    ['ball.l5', 'Ball wrangler', 'Reach level 5 of the bouncing ball game'],
    ['ball.big', 'One big wall', 'Trap more than 40% of the box with a single wall'],
    ['rev.cheese', 'Say cheese', 'Trap a tin robot until it gives up'],
    ['rev.l5', 'Sweet revenge', 'Clear level 5 of the block-pushing game'],
    ['rev.trap4', 'Cheese board', 'Turn four robots into cheese at the same time'],
    ['saver.maze', 'Lost in the bricks', 'Watch a brick maze from inside'],
    ['saver.island', 'Castaway', 'Visit a little green alien who lives on an island'],
    ['saver.seti', 'The truth is out there', 'Let your computer search the sky for aliens while you are away'],
    ['maze.ork', 'Robot interior design', 'Rebuild the maze from scrap metal'],
    ['maze.exit', 'Found the way out', 'Watch the maze until it finds the smiling face'],
    ['island.ship', 'Ship ahoy!', 'Be watching when a ship goes past the island'],
    ['island.special', 'Special day', 'Visit the island on a special day of the year (or night)'],
    ['seti.wu', 'Work unit done', 'Finish a whole work unit for science'],
    ['seti.signal', 'Possible signal!', 'Be there when the telescope picks up something exciting'],
    ['staples.letter', 'Dear Staples', 'Start a letter the old-fashioned way and someone will notice'],
    ['staples.gallery', 'Change of assistant', 'Pick a different helper from the gallery'],
    ['staples.hide', 'Go away, Staples', 'Tell the paperclip to leave you alone'],
    ['real.full', 'Buffering complete', 'Wait for the internet video to load all the way. Patience!'],
    ['real.plus', 'Upgrade NOW!', 'Give in to the nag screen'],
    ['sqs.dl', 'Jackster', 'Download a song from someone else on JackNet'],
    ['sqs.self', 'Sharing is caring', 'Someone downloaded a song from YOU'],
    ['dodgy.happy', 'Happy New Year 1999 !!', 'Open an attachment that does fireworks. (Never do this in real life.)'],
    ['dodgy.buddy', 'Purple sing-along', 'Ask a purple friend for a song'],
    ['dodgy.ram', 'Download more RAM', 'Double something until it falls out of the back of the computer'],
    ['dodgy.modem', 'Maximum turbo', 'Turn the modem all the way up to 300%'],
    ['dodgy.regfix', '4,812 errors fixed', 'Let a registry cleaner fix ALL the errors'],
    ['dodgy.y2k', 'Bunker ready', 'Get 100% ready for the Millennium Bug'],
    ['dodgy.winsquig', 'Registered at last?', "Try a registration code from Dave's cousin"],
    ['dodgy.prank', 'Got you!', "Run Dave's joke program. If you dare"],
    ['dodgy.parity', 'PARITY ERROR', 'Be rude to a talking doctor (he is only a sound card)'],
    ['dodgy.squigso', 'Talking cure', 'Have a proper chat with the Sound Bluster doctor'],
    ['dodgy.strike', 'STRIKE!', 'Knock all ten little green men over with one ball'],
    ['dodgy.bowl100', 'Bowled over', 'Score 100 or more in a whole game of alien bowling'],
    ['dodgy.neko', 'Catnap', 'Stop moving the mouse and let the chasing robot have a sleep'],
    ['wx.ad', 'Click here!!!', 'Some adverts are just asking to be clicked'],
    ['cur.apply', 'Pimp my pointer', '4,000 cursors, and you only need one'],
    ['shots.dave', 'Proof', "There's a very rare photo of someone you know smiling"],
    ['shots.wall', 'Interior decorator', 'A photo a day keeps the teal away'],
    ['shots.more', 'Mom needs the phone', 'Try to download a thousand photos on a 56K'],
    ['kpt.wall', 'Modern art', 'Make your desktop a work of art with the shiny rock program'],
  ].forEach(([id, n, hint]) => Apps.defineSecret('era.' + id, n, hint));

  // ================================================================ a few files on the C: drive
  Apps.fs.add('C:/Program Files/JACK@home', { name: 'README.TXT', type: 'txt', date: '17/05/99', size: '2 KB', text: SQH_README });
  Apps.fs.add('C:/Program Files/JACK@home', { name: 'state.sah', type: 'txt', date: '17/05/99', size: '1 KB', text: '<state>\n<ncfft>81920</ncfft>\n<cr>0.000000</cr>\n<prog>0.0000</prog>\n<aliens_found>0</aliens_found>\n<microwaves_found>LOTS</microwaves_found>\n</state>\n' });
  Apps.fs.add('C:/My Documents', { name: 'bugsweeper tips.txt', type: 'txt', date: '03/03/99', size: '1 KB', text: "BUGSWEEPER 2000 TIPS (by Jack)\n\n* The number tells you how many bugs are touching that square.\n  Diagonals count!\n* Right-click to put a flag on a bug. Right-click again for a ?.\n* Click BOTH buttons at once on a number to open everything round it\n  (only works if you've flagged the right number of bugs).\n* A 1-2-1 along a wall means the bugs are under the 1s. Always.\n* " + Cast.n('teacher') + " at Computer Club did Intermediate in 61 seconds.\n  I will beat it. I WILL.\n* Dave says there's a cheat. He says it's a magic word from an old\n  text adventure and you press Shift and Enter after. He says you\n  have to look at the very top left of the screen. Dave says a lot\n  of things.\n" });
  Apps.fs.add('C:/My Documents', { name: 'FIREWORKS.EXE', type: 'exe', app: 'era.fireworks', date: '20/01/99', size: '10 KB' });
  Apps.fs.add("C:/My Documents/Dave's Stuff", { name: 'DAVE_JOKE.EXE', type: 'exe', app: 'era.prank', date: '01/04/99', size: '6 KB' });
  Apps.fs.add("C:/My Documents/Dave's Stuff", { name: 'readme from dave.txt', type: 'txt', date: '02/04/99', size: '1 KB', text: "JACK\n\ni put some well good stuff on your computer\n\nFIREWORKS.EXE - does fireworks!!! my cousin sent it\nRAM DOUBLER - doubles your ram. FREE RAM. its legit\nDAVE_JOKE.EXE - dont open this one. (open it)\nWINJACK - for unzipping stuff. the registration code is\n  L33T-1999-HAXOR  (from my cousin. it works.) (it might not work)\n\nalso i saved my bugsweeper time on your computer. 9 seconds. beginner.\n(i didnt.) (i did.)\n\nDAVE\n" });
  Apps.fs.add('C:/JACKOS', { name: 'STAPLES.INI', type: 'txt', date: '19/11/98', size: '1 KB', text: '[Assistant]\nName=Staples\nFile=STAPLES.ACS\nHelpfulness=0\nAnnoyance=11\nShowTips=Always\n\n[Gallery]\n1=Staples (paperclip)\n2=Rover... no, Biscuit (dog)\n3=Wizbit (wizard)\n4=Bolt (robot)\n5=Bouncy (Blobbit)\n\n; To turn Staples off: right-click him and pick Hide.\n; Or Options > untick "Use the Office Assistant".\n; He will be sad.\n' });
})();

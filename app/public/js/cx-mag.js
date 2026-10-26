/* cx-mag: the JACK ATTACK! back-issue archive (lazy, from js/cx.js). Twelve monthly issues of 1999, each one on sale
 * from the 1st of its month (Desk.today99). Every issue: a cover (drawn here, original art), Jack's editorial, reviews of
 * real games that came out in the UK that month (each review only appears once its game is in the shops), previews,
 * readers' letters, the cheats corner, a pull-out poster (it can go on your desktop) and a competition (the server marks
 * it: mods/cx.js). The words live in js/cx-mag-a.js (January to June) and js/cx-mag-b.js (July to December).
 * Pages (IE.addPage): backissues, backissues/<mon>, backissues/<mon>/<part>   e.g. jackattack.jnet/backissues/feb/reviews */
(function () {
  'use strict';
  if (window.CXMag) return;
  const A = window.Apps, esc = A.esc;
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const PARTS = [['editorial', 'Editorial', 3], ['reviews', 'Reviews', 4], ['previews', 'Previews', 10], ['letters', 'Letters', 12], ['cheats', 'Cheats Corner', 14], ['poster', 'Pull-out Poster', 16], ['compo', 'Competition', 18]];
  const t99 = () => (window.Desk && Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101 });
  const mdOf = k => { const [m, d] = String(k).split('-').map(Number); return m * 100 + d; };
  const nice = k => { const [m, d] = String(k).split('-').map(Number); return d + ' ' + MONTHS[m - 1]; };
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const url = w => 'http://www.jackattack.jnet/' + w;
  const DATA = {}; // month number -> the issue's words (added by cx-mag-a.js / cx-mag-b.js)

  // ================================================================ the covers (all drawn here)
  // [background top, background bottom, masthead colour, main cover line, cover lines, cover CD sticker colour]
  const META = {
    1: { b: ['#0a2a7a', '#3a7ad8'], mc: '#ffd400', main: 'HAPPY NEW YEAR!', lines: ['ROGUE SQUADRON', 'WORMS ARMAGEDDON!', 'WHAT I GOT FOR CHRISTMAS', '1999: THE YEAR AHEAD'], cd: '#9fd0ff', art: 'snow' },
    2: { b: ['#2a2a2a', '#5a6a4a'], mc: '#ff3a3a', main: 'SNEAKY!!!', lines: ['METAL GEAR WOBBLY!', 'CIVIC CHAOS 3000', 'WARIO LAND II', 'VALENTINE\'S? YUCK'], cd: '#ff8ac4', art: 'box' },
    3: { b: ['#0a6a2a', '#7ad83a'], mc: '#fff', main: 'PARTY TIME!', lines: ['MARLO PARTY: BLISTERS!', 'X-WING ALLIANCE', 'ROLLCAGE UPSIDE DOWN', 'RED NOSE DAY'], cd: '#ff2a2a', art: 'party' },
    4: { b: ['#5a2a8a', '#ff8ac4'], mc: '#ffd400', main: 'LOOP THE LOOP!', lines: ['ROLLERCOASTER RUPEECOON', 'RIDGE RACER TYPE 4', 'MICRO MACHINES 64', 'EASTER EGGS (IN GAMES!)'], cd: '#ffd400', art: 'coaster' },
    5: { b: ['#05051a', '#2a1a5a'], mc: '#ffd400', main: 'INTERGALACTIC BATTLES IS COMING!', lines: ['CASTLEVANIA 64', 'STARSIEGE: TRIBES', 'CRICKET WORLD CUP 99', 'NO SPOILERS ZONE'], cd: '#9ff', art: 'pod' },
    6: { b: ['#c84a00', '#ffc040'], mc: '#fff', main: 'GETAWAY!', lines: ['DRIVER: THE CAR PARK', 'EPISODE I RACER', 'DUNGEON KEEPA 2', 'SUMMER = GAMES'], cd: '#e10600', art: 'car' },
    7: { b: ['#005a7a', '#3ad0ff'], mc: '#ffd400', main: 'SCHOOL\'S OUT!!!', lines: ['APE ESCAPE: NET THEM!', 'SUPERMAN 64 (OH NO)', 'THE MOON: 30 YEARS', 'SIX WEEKS OF GAMES'], cd: '#ff7a00', art: 'monkey' },
    8: { b: ['#000', '#2a2a3a'], mc: '#ffd400', main: 'TOTAL ECLIPSE!', lines: ['TIBERIAN SUN', 'CROC 2', 'BLOCKO RACERS', 'DON\'T LOOK AT THE SUN'], cd: '#ff9a00', art: 'eclipse' },
    9: { b: ['#1a7a2a', '#a0e060'], mc: '#fff', main: 'FORE!!!', lines: ['MARLO GOLF', 'HOVER HAVOC 3', 'RE-VOLT: TINY CARS', 'BACK TO SCHOOL (NO)'], cd: '#e10600', art: 'golf' },
    10: { b: ['#f0f0f0', '#9ad0ff'], mc: '#e10600', main: 'THE BIGGEST MONTH EVER!', lines: ['POCKET CRITTERS IS HERE!', 'ZIP THE BADGER IN 3D!', 'FINAL FANTASTIC VIII', 'NINE REVIEWS!!!'], cd: '#ff7a00', art: 'monster' },
    11: { b: ['#0a0a2a', '#5a1a5a'], mc: '#3affff', main: 'FIGHT!!!', lines: ['SUPER SMASH BROS.', 'SPIKE THE STEGOSAUR 2', 'PARK PANIC WORLD', 'BONFIRE NIGHT'], cd: '#ff4aff', art: 'fight' },
    12: { b: ['#6a0000', '#d02020'], mc: '#fff', main: 'THE LAST ISSUE OF THE 1900s!', lines: ['DONKEY WRONG 64', 'BLOCKO ROCK RAIDERS', 'WORMS ON THE PLAYSPACE', 'Y2K: WILL WE SURVIVE?'], cd: '#3aff6a', art: 'xmas' },
  };
  const ART = {
    snow: () => `<rect x="0" y="150" width="200" height="50" fill="#fff"/><g fill="#fff" stroke="#9ab" stroke-width="2"><circle cx="100" cy="128" r="34"/><circle cx="100" cy="76" r="24"/></g><circle cx="92" cy="70" r="3" fill="#000"/><circle cx="108" cy="70" r="3" fill="#000"/><path d="M100 77l14 4-14 3z" fill="#ff7a00"/><path d="M90 86q10 7 20 0" stroke="#000" stroke-width="2" fill="none"/><path d="M78 98h44v8H78z" fill="#e10600"/><path d="M110 102l8 24h-8z" fill="#e10600"/><rect x="82" y="44" width="36" height="8" fill="#222"/><rect x="88" y="22" width="24" height="24" fill="#222"/><path d="M58 120l-20-14M142 120l18-18" stroke="#6a3a1a" stroke-width="4"/><g transform="translate(148 86) rotate(-20)"><path d="M-14 0h28l6 10-8 14-6-8h-12l-6 8-8-14z" fill="#999" stroke="#000" stroke-width="2"/><circle cx="8" cy="4" r="3" fill="#ffd400"/><circle cx="-8" cy="4" r="3" fill="#2a7ad8"/></g><g fill="#fff">${[[20, 20], [40, 60], [170, 30], [180, 140], [24, 120], [150, 10], [70, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g><text x="100" y="190" text-anchor="middle" font-family="Anton,Impact" font-size="26" fill="#2a5ad8">1999</text>`,
    box: () => `<rect x="0" y="160" width="200" height="40" fill="#4a4a3a"/><g><path d="M40 168V96l60-18 60 18v72z" fill="#c89a5a" stroke="#5a3a1a" stroke-width="3"/><path d="M40 96l60 14 60-14M100 110v58" stroke="#5a3a1a" stroke-width="3" fill="none"/><rect x="58" y="120" width="30" height="9" fill="#1a1a1a"/><circle cx="66" cy="124.5" r="3" fill="#fff"/><circle cx="80" cy="124.5" r="3" fill="#fff"/><circle cx="67" cy="125" r="1.4" fill="#000"/><circle cx="81" cy="125" r="1.4" fill="#000"/><text x="128" y="148" text-anchor="middle" font-family="Arial Black,Arial" font-size="11" fill="#5a3a1a">FRAGILE</text><path d="M116 152h24" stroke="#e10600" stroke-width="2"/></g><text x="150" y="70" text-anchor="middle" font-family="Anton,Impact" font-size="60" fill="#ff3a3a" stroke="#000" stroke-width="3">!</text><g stroke="#ffd400" stroke-width="3" opacity=".8"><path d="M20 20l40 60M180 20l-40 60" /></g><circle cx="20" cy="18" r="8" fill="#ffd400"/><circle cx="180" cy="18" r="8" fill="#ffd400"/>`,
    party: () => `<g transform="translate(100 100)"><circle r="78" fill="#ffd400" stroke="#000" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${(Math.cos(a) * 62).toFixed(1)}" cy="${(Math.sin(a) * 62).toFixed(1)}" r="11" fill="${['#2a7ad8', '#e10600', '#2a9a2a', '#fff'][i % 4]}" stroke="#000" stroke-width="2"/>`; }).join('')}<rect x="-26" y="-26" width="52" height="52" rx="9" fill="#fff" stroke="#000" stroke-width="3" transform="rotate(14)"/><g fill="#000" transform="rotate(14)"><circle cx="-13" cy="-13" r="5"/><circle cx="13" cy="13" r="5"/><circle cx="13" cy="-13" r="5"/><circle cx="-13" cy="13" r="5"/><circle r="5"/></g></g><path d="M100 2l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="174" cy="176" r="16" fill="#e10600" stroke="#600" stroke-width="2"/><circle cx="169" cy="170" r="4" fill="#fff" opacity=".6"/>`,
    coaster: () => `<rect x="0" y="170" width="200" height="30" fill="#2a8a2a"/><path d="M0 150 C40 150 40 40 100 40 C160 40 150 110 120 110 C90 110 80 60 110 60 C150 60 170 150 200 150" fill="none" stroke="#e10600" stroke-width="7"/><path d="M0 150 C40 150 40 40 100 40 C160 40 150 110 120 110 C90 110 80 60 110 60 C150 60 170 150 200 150" fill="none" stroke="#ffd400" stroke-width="2" stroke-dasharray="4 6"/><g stroke="#6a6a6a" stroke-width="3">${[20, 40, 60, 140, 160, 180].map(x => `<path d="M${x} ${x < 100 ? 150 - (x - 0) * 0.9 : 150 - (200 - x) * 0.6} V170"/>`).join('')}</g><g transform="translate(78 48) rotate(-28)"><rect x="-14" y="-10" width="28" height="12" rx="3" fill="#2a7ad8" stroke="#000" stroke-width="2"/><circle cx="-6" cy="-14" r="5" fill="#f2c79a" stroke="#000"/><circle cx="6" cy="-14" r="5" fill="#f2c79a" stroke="#000"/><path d="M-10 -20l-4-8M10 -20l4-8" stroke="#f2c79a" stroke-width="3"/></g><g><ellipse cx="34" cy="182" rx="9" ry="12" fill="#ff9ad8" stroke="#000" stroke-width="2"/><path d="M26 180l4-3 4 3 4-3 4 3" stroke="#3aff6a" stroke-width="2" fill="none"/></g>`,
    pod: () => `<g fill="#fff">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 47) % 200}" cy="${(i * 31) % 120}" r="${i % 5 ? 0.8 : 1.6}"/>`).join('')}</g><path d="M0 150 Q100 120 200 150 V200 H0z" fill="#c87a3a"/><path d="M0 170 Q100 150 200 172" stroke="#a05a2a" stroke-width="3" fill="none"/><g transform="translate(18 104)"><rect x="0" y="0" width="70" height="16" rx="8" fill="#bbb" stroke="#000" stroke-width="2"/><rect x="62" y="2" width="12" height="12" fill="#ff7a00"/><rect x="0" y="26" width="70" height="16" rx="8" fill="#bbb" stroke="#000" stroke-width="2"/><rect x="62" y="28" width="12" height="12" fill="#ff7a00"/><path d="M8 16v10M50 16v10" stroke="#3affff" stroke-width="3"/><path d="M74 8 L120 22 M74 34 L120 26" stroke="#000" stroke-width="1.5"/><path d="M118 14h26l8 10-8 10h-26z" fill="#e8c860" stroke="#000" stroke-width="2"/><circle cx="134" cy="22" r="4" fill="#3affff"/></g><path d="M8 112l-18-6M8 134l-18 6" stroke="#ffd400" stroke-width="4"/>`,
    car: () => `<circle cx="160" cy="40" r="24" fill="#fff36a"/><rect x="0" y="140" width="200" height="60" fill="#555"/><path d="M0 170h200" stroke="#ffd400" stroke-width="4" stroke-dasharray="14 10"/><g transform="translate(26 92) rotate(-6)"><path d="M10 50 L20 24 Q30 14 60 14 L100 14 Q116 14 124 28 L148 34 Q158 38 156 50 Z" fill="#e10600" stroke="#000" stroke-width="3"/><path d="M34 24 L44 18 H74 V30 H30z M80 18 H100 L112 30 H80z" fill="#9fd0ff" stroke="#000" stroke-width="2"/><circle cx="40" cy="52" r="14" fill="#222" stroke="#000" stroke-width="2"/><circle cx="40" cy="52" r="6" fill="#bbb"/><circle cx="126" cy="52" r="14" fill="#222" stroke="#000" stroke-width="2"/><circle cx="126" cy="52" r="6" fill="#bbb"/><path d="M60 34h70" stroke="#fff" stroke-width="5"/></g><g fill="#ddd" opacity=".85"><circle cx="18" cy="150" r="12"/><circle cx="6" cy="138" r="9"/><circle cx="28" cy="134" r="7"/></g><path d="M196 110l-30 6M196 126l-26 2" stroke="#fff" stroke-width="3"/>`,
    monkey: () => `<rect x="0" y="0" width="200" height="200" fill="none"/><path d="M0 172 Q50 150 100 172 T200 172 V200 H0z" fill="#ffd96a"/><g transform="translate(100 104)"><circle r="40" fill="#8a5a2a" stroke="#000" stroke-width="3"/><circle cx="-42" cy="-4" r="13" fill="#8a5a2a" stroke="#000" stroke-width="3"/><circle cx="42" cy="-4" r="13" fill="#8a5a2a" stroke="#000" stroke-width="3"/><ellipse cx="0" cy="8" rx="28" ry="24" fill="#f2c79a"/><circle cx="-11" cy="-2" r="5" fill="#000"/><circle cx="11" cy="-2" r="5" fill="#000"/><circle cx="-9" cy="-4" r="1.6" fill="#fff"/><circle cx="13" cy="-4" r="1.6" fill="#fff"/><path d="M-10 18q10 9 20 0" stroke="#000" stroke-width="3" fill="none"/><path d="M-36 -26 Q0 -54 36 -26 L30 -18 Q0 -38 -30 -18z" fill="#ddd" stroke="#000" stroke-width="2"/><rect x="-7" y="-56" width="14" height="14" rx="3" fill="#e10600" stroke="#000" stroke-width="2"/><path d="M-7 -50h14" stroke="#ff9a9a" stroke-width="3"/></g><g transform="translate(150 40) rotate(30)"><path d="M0 0v60" stroke="#8a5a2a" stroke-width="4"/><ellipse cx="0" cy="-12" rx="16" ry="14" fill="none" stroke="#000" stroke-width="2"/><path d="M-14 -12h28M-10 -22l20 20M10 -22l-20 20" stroke="#000" stroke-width="1"/></g><g stroke="#ffd400" stroke-width="3"><path d="M90 30l-6-14M110 30l6-14M100 28v-16"/></g>`,
    eclipse: () => `<defs><radialGradient id="cxcor"><stop offset=".45" stop-color="#fff"/><stop offset=".55" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a00" stop-opacity="0"/></radialGradient></defs><g fill="#fff">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 53) % 200}" cy="${(i * 37) % 200}" r="${i % 6 ? 0.7 : 1.4}"/>`).join('')}</g><circle cx="100" cy="92" r="80" fill="url(#cxcor)"/><circle cx="100" cy="92" r="40" fill="#000"/><circle cx="133" cy="66" r="5" fill="#fff"/><path d="M0 170 Q60 150 120 166 T200 160 V200 H0z" fill="#1a3a1a"/><g transform="translate(46 150)"><circle r="8" fill="#f2c79a" stroke="#000"/><rect x="-9" y="-4" width="18" height="6" rx="2" fill="#222"/><path d="M-6 8h12v22h-12z" fill="#2a7ad8"/></g>`,
    golf: () => `<circle cx="40" cy="40" r="20" fill="#fff36a"/><path d="M0 120 Q100 90 200 120 V200 H0z" fill="#2a9a2a"/><ellipse cx="130" cy="140" rx="46" ry="14" fill="#5ad05a"/><ellipse cx="140" cy="140" rx="5" ry="2" fill="#000"/><path d="M140 140V62" stroke="#fff" stroke-width="3"/><path d="M140 62l34 10-34 10z" fill="#e10600" stroke="#000" stroke-width="1.5"/><circle cx="62" cy="152" r="12" fill="#fff" stroke="#000" stroke-width="2"/><g fill="#ccc">${[[58, 148], [66, 148], [62, 155], [57, 156], [67, 156]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g><path d="M74 146 Q110 70 136 136" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" fill="none"/>`,
    monster: () => `<g transform="translate(58 100)"><rect x="-42" y="-64" width="84" height="128" rx="8" fill="#c8c8d0" stroke="#000" stroke-width="3"/><rect x="-32" y="-52" width="64" height="54" fill="#5a5a6a"/><rect x="-26" y="-46" width="52" height="42" fill="#9bbc0f"/><g fill="#0f380f" transform="translate(-14 -40)"><rect x="6" y="0" width="16" height="4"/><rect x="2" y="4" width="24" height="12"/><rect x="6" y="8" width="4" height="4" fill="#9bbc0f"/><rect x="18" y="8" width="4" height="4" fill="#9bbc0f"/><rect x="0" y="16" width="28" height="12"/><rect x="2" y="28" width="6" height="4"/><rect x="20" y="28" width="6" height="4"/></g><path d="M-24 22h14v-6h6v6h14v6H-4v6h-6v-6h-14z" fill="#222"/><circle cx="20" cy="26" r="6" fill="#a02060"/><circle cx="34" cy="18" r="6" fill="#a02060"/></g><g transform="translate(142 108)"><rect x="-40" y="-26" width="80" height="52" rx="6" fill="#fff" stroke="#000" stroke-width="3"/><path d="M-40 6h80" stroke="#999" stroke-width="2"/><circle cx="0" cy="-8" r="11" fill="none" stroke="#ff7a00" stroke-width="4"/><path d="M0 -8 m-5 0 a5 5 0 1 1 5 5" fill="none" stroke="#ff7a00" stroke-width="3"/><text x="0" y="20" text-anchor="middle" font-family="Arial Black,Arial" font-size="9" fill="#000">128-BIT!</text></g><path d="M100 8l6 14 15 1-11 10 3 15-13-8-13 8 3-15-11-10 15-1z" fill="#ffd400" stroke="#000" stroke-width="2"/><g transform="translate(150 140) scale(.9)" stroke="#24142e" stroke-width="2"><ellipse cx="0" cy="0" rx="30" ry="27" fill="#8840c4"/><circle cx="-23" cy="-23" r="10" fill="#8840c4"/><circle cx="20" cy="-23" r="9" fill="#8840c4"/><path d="M-8-24L0-39 8-24 20-35 19-15" fill="#8840c4"/><path d="M-3-25Q15-18 14 13L-2 19Q-13 2-3-25" fill="#f0e8dc" stroke="none"/><ellipse cx="8" cy="2" rx="23" ry="10" fill="#24142e"/><ellipse cx="16" cy="17" rx="20" ry="11" fill="#f0e8dc"/><ellipse cx="33" cy="12" rx="6" ry="4" fill="#181020"/><ellipse cx="17" cy="0" rx="5" ry="7" fill="#fff"/><ellipse cx="19" cy="1" rx="2" ry="4" fill="#181020"/><path d="M-20 29L14 30 28 37 8 39-22 34-38 24" fill="#ffd23a"/><path d="M-21-18L23-20" stroke="#5a3010" stroke-width="6"/><ellipse cx="-6" cy="-20" rx="9" ry="6" fill="#70d8e8"/><ellipse cx="15" cy="-21" rx="9" ry="6" fill="#70d8e8"/></g>`,
    fight: () => `<g>${[[40, 50, '#ff4aff'], [160, 40, '#ffd400'], [110, 20, '#3affff']].map(([x, y, c]) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${x} ${y}l${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 22).toFixed(1)}" stroke="${c}" stroke-width="3"/>`; }).join('')).join('')}</g><rect x="20" y="150" width="160" height="14" fill="#8a8a9a" stroke="#000" stroke-width="2"/><g transform="translate(70 120)"><circle cy="-22" r="12" fill="#ffd400" stroke="#000" stroke-width="2"/><rect x="-10" y="-10" width="20" height="26" fill="#e10600" stroke="#000" stroke-width="2"/><path d="M10 -4l20 -10" stroke="#000" stroke-width="5"/><path d="M-6 16v14M6 16v14" stroke="#000" stroke-width="5"/></g><g transform="translate(132 120)"><circle cy="-22" r="12" fill="#3aff6a" stroke="#000" stroke-width="2"/><rect x="-10" y="-10" width="20" height="26" fill="#2a7ad8" stroke="#000" stroke-width="2"/><path d="M-10 -4l-18 -12" stroke="#000" stroke-width="5"/><path d="M-6 16v14M6 16v14" stroke="#000" stroke-width="5"/></g><text x="100" y="104" text-anchor="middle" font-family="Bangers,Impact" font-size="30" fill="#fff" stroke="#000" stroke-width="2">POW!</text>`,
    xmas: () => `<path d="M100 14 L48 90 h22 L36 140 h28 L26 178 h148 L136 140 h28 L130 90 h22 Z" fill="#1a8a2a" stroke="#063a0c" stroke-width="3"/><path d="M100 4l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#ffd400" stroke="#000" stroke-width="1.5"/>${[[84, 70, '#e10600'], [116, 98, '#ffd400'], [70, 122, '#3affff'], [128, 150, '#ff4aff'], [96, 158, '#e10600']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="#000"/>`).join('')}<g transform="translate(46 172)"><ellipse rx="22" ry="14" fill="#8a5a2a" stroke="#000" stroke-width="2"/><path d="M-22 -4h44M-22 4h44" stroke="#5a3a1a" stroke-width="2"/></g><g transform="translate(160 178)"><path d="M-14 0 Q0 -26 14 0" stroke="#ffd400" stroke-width="7" fill="none"/><path d="M-14 0 Q0 -26 14 0" stroke="#000" stroke-width="1" fill="none"/></g><g transform="translate(150 30)"><circle r="10" fill="#e10600" stroke="#000"/><path d="M-6 -6l12 12M6 -6l-12 12" stroke="#fff" stroke-width="2"/><text y="26" text-anchor="middle" font-family="Arial Black,Arial" font-size="9" fill="#fff">Y2K BUG</text></g>`,
  };
  function cover(m, o) {
    o = o || {};
    const M = META[m], t = t99(), locked = m > t.m, fresh = m === t.m;
    const bars = Array.from({ length: 28 }, (_, i) => `<rect x="${i * 2.2}" y="0" width="${[1, 0.6, 1.4, 0.6][(i * 7 + m) % 4]}" height="${i % 9 === 0 ? 22 : 18}" fill="#000"/>`).join('');
    return `<div class="cxc${locked ? ' lock' : ''}${o.small ? ' sm' : ''}" style="--c1:${M.b[0]};--c2:${M.b[1]};--mc:${M.mc};--cd:${M.cd}" data-cxm="${m}">
      <div class="cxc-mast">JACK ATTACK!</div>
      <div class="cxc-strip"><span>${MONTHS[m - 1].toUpperCase()} 1999</span><span>THE GAMES MAG WOT JACK MADE</span><span>20p</span></div>
      ${locked ? '<svg class="cxc-art" viewBox="0 0 200 200" aria-hidden="true"><text x="100" y="140" text-anchor="middle" font-family="Anton,Impact" font-size="150" fill="rgba(255,255,255,.25)">?</text></svg>' : `<svg class="cxc-art" viewBox="0 0 200 200" aria-hidden="true">${ART[M.art]()}</svg>
      <div class="cxc-lines">${M.lines.map(l => `<b>${esc(l)}</b>`).join('')}</div>
      <div class="cxc-main">${esc(M.main)}</div>`}
      <button type="button" class="cxc-cd" data-cxcd="${m}" title="Play this month's cover CD" aria-label="${MONTHS[m - 1]} cover CD"><span>FREE!<br>COVER<br>CD</span></button>
      <span class="cxc-bar" data-cxbar="${m}" title="Barcode"><svg viewBox="0 0 62 24" aria-hidden="true">${bars}</svg><i>99${String(m).padStart(2, '0')}</i></span>
      ${locked ? `<div class="cxc-lockon"><b>ON SALE</b><span>1 ${MONTHS[m - 1].toUpperCase()}</span></div>` : fresh && o.badge ? '<div class="cxc-new">NEW!<br>OUT NOW</div>' : ''}
    </div>`;
  }

  // ================================================================ pages
  const nav = (m, part) => {
    const prev = m > 1 ? `<a href="${url('backissues/' + MON[m - 2])}">&laquo; ${MONTHS[m - 2]}</a>` : '<span>&laquo;</span>';
    const next = m < 12 ? `<a href="${url('backissues/' + MON[m])}">${MONTHS[m]} &raquo;</a>` : '<span>&raquo;</span>';
    return `<div class="cx-nav"><a href="${url('backissues')}" class="cx-home">BACK ISSUES</a>${prev}<b>${MONTHS[m - 1].toUpperCase()} 1999</b>${next}</div>
      <div class="cx-parts"><a href="${url('backissues/' + MON[m - 1])}"${!part ? ' class="on"' : ''}>Cover</a>${PARTS.map(([k, n]) => `<a href="${url('backissues/' + MON[m - 1] + '/' + k)}"${part === k ? ' class="on"' : ''}>${n}</a>`).join('')}</div>`;
  };
  const shell = (inner, cls) => `<div class="cx-page${cls ? ' ' + cls : ''}"><div class="cx-top"><span class="cx-logo">JACK ATTACK!</span><span class="cx-arch">THE BACK ISSUES ARCHIVE &middot; 1999</span><a href="#" data-cxgo="home">Back to JACK ATTACK! Online &raquo;</a></div>${inner}<div class="cx-foot">JACK ATTACK! is written, drawn, photocopied and stapled by Jack. Back issues 20p each (or swaps). No refunds. Gubbinz chewed the staples on some copies.<br>&copy; 1999 Jack. Reproduction of any part of this magazine is allowed if you say who did it.</div></div>`;

  function archive() {
    const t = t99(), have = Math.min(12, t.m);
    const W = window.CX && CX.wins ? CX.wins : null;
    const tiles = MON.map((k, i) => {
      const m = i + 1, won = W && W.won && W.won.includes(m);
      return `<a class="cx-tile${m > t.m ? ' lock' : ''}" href="${url('backissues/' + k)}">${cover(m, { small: 1, badge: 1 })}<span class="cx-tl">${MONTHS[i]} 1999${won ? ' <em title="You won this competition">&#9733; WON</em>' : ''}</span></a>`;
    }).join('');
    const won = W && W.won ? W.won.length : 0;
    return shell(`<div class="cx-arch-h"><h1>THE BACK ISSUES</h1><p>Every issue of <b>JACK ATTACK!</b> from 1999, in one place. Missed one? Lost one down the back of the radiator? Dave borrowed it and "lost" it? Here they all are. ${have} of 12 out so far: a new one comes out on the 1st of every month.</p>
      <p class="cx-small">Every issue has a <b>competition</b> with a <b>Rupee prize</b> (JackNet members). ${won ? `You've won <b>${won}</b> of them so far.` : 'Win all twelve for something VERY special.'} Each issue also has a free cover CD. Click the disc on the cover.</p></div>
      <div class="cx-grid">${tiles}</div>`, 'cx-archive');
  }

  function issue(m, part) {
    const t = t99();
    if (m > t.m) {
      secret('cx.early');
      return shell(`${nav(m)}<div class="cx-locked">${cover(m, {})}<div><h2>NOT OUT YET!</h2><p>The <b>${MONTHS[m - 1]} 1999</b> issue of JACK ATTACK! goes on sale on <b>1 ${MONTHS[m - 1]}</b>. I haven't written it yet. I haven't even PLAYED the games yet. Some of them aren't even finished being made yet.</p><p>Come back on the 1st. Or build a time machine. (If you build a time machine, can you bring back the Y2K results? Mom wants to know if she needs all those beans.)</p><p><a href="${url('backissues')}">&laquo; All back issues</a></p></div></div>`);
    }
    const D = DATA[m]; if (!D) return shell(`<p style="padding:20px">This issue is still at the photocopier. Try again in a second.</p>`);
    secret('cx.read');
    try { const seen = A.store.get('jhp_cx_read', []); if (!seen.includes(m)) { seen.push(m); A.store.set('jhp_cx_read', seen); } if (seen.length >= 6) secret('cx.collector'); } catch (e) {}
    if (!part) return shell(nav(m) + coverPage(m, D));
    const fn = { editorial, reviews, previews, letters, cheats, poster, compo }[part];
    return shell(nav(m, part) + (fn ? fn(m, D) : '<p>Page torn out.</p>'));
  }
  const pageHead = (m, part) => { const p = PARTS.find(x => x[0] === part); return `<div class="cx-ph"><h2>${p[1].toUpperCase()}</h2><span>${MONTHS[m - 1].toUpperCase()} 1999 &middot; PAGE ${p[2]}</span></div>`; };

  function coverPage(m, D) {
    const t = t99(), outRev = D.rev.filter(r => mdOf(r.d) <= t.md).length;
    const contents = PARTS.map(([k, n, pg]) => `<li><a href="${url('backissues/' + MON[m - 1] + '/' + k)}"><b>${pg}</b> ${n}</a><span>${esc((D.blurb || {})[k] || '')}</span></li>`).join('');
    return `<div class="cx-coverpage">${cover(m, { badge: 1 })}<div class="cx-contents"><h2>IN THIS ISSUE</h2><ul>${contents}</ul>
      <p class="cx-small">Reviews in this issue: ${D.rev.length}${outRev < D.rev.length ? ` (${outRev} out in the shops so far: the others go up the day their game comes out)` : ''}. Click the disc on the cover for this month's cover CD.</p></div></div>`;
  }
  function editorial(m, D) {
    return pageHead(m, 'editorial') + `<div class="cx-ed"><div class="cx-edpic" aria-hidden="true"><svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#ffd400"/><circle cx="24" cy="20" r="12" fill="#f2c79a" stroke="#000"/><path d="M12 16q12-14 24 0" fill="#6a3a1a"/><circle cx="20" cy="20" r="1.8"/><circle cx="28" cy="20" r="1.8"/><path d="M19 26q5 4 10 0" stroke="#000" fill="none"/><path d="M10 48q14-18 28 0" fill="#e10600"/></svg></div><div>${D.ed}<p class="cx-sig">Jack <small>(Editor, Reviewer, Artist, Stapler)</small></p></div></div>`;
  }
  function stars(sc) { return sc >= 90 ? '<span class="award">JACK\'S<br>GOLD<br>AWARD</span>' : sc >= 85 ? '<span class="award cx-silver">JACK\'S<br>SILVER<br>AWARD</span>' : ''; }
  const SOON = ['I\'ve been saving up.', 'I\'ve already cleared a space on the shelf.', 'Mom says "we\'ll see".', 'Counting the days.', 'I\'ve read every preview twice.', 'Dave says he\'s getting it first. Dave says a lot of things.'];
  function reviews(m, D) {
    const t = t99();
    const cards = D.rev.map(r => {
      if (mdOf(r.d) > t.md) return `<article class="cx-soon"><b>${esc(r.g)}</b> <span class="meta">${esc(r.p)}</span><p>REVIEW COMING SOON: it's out in the shops on <b>${nice(r.d)}</b>. ${esc(r.soon || SOON[(r.g.length + m) % SOON.length])}</p></article>`;
      const [g, s, p, l] = r.s;
      return `<article class="review cx-rev"><div class="rv"><h3>${esc(r.g)}</h3><span class="meta">${esc(r.p)}</span><span class="cx-out">Out ${nice(r.d)}${r.by ? ' &middot; reviewed by ' + esc(r.by) : ''}</span>${r.t.map(x => `<p>${x}</p>`).join('')}
        <div class="updown up"><b>UP</b>${r.up}</div><div class="updown down"><b>DOWN</b>${r.dn}</div></div>
        <div class="scorebox"><div class="s"><span>GRAPHICS</span><span>${g}%</span></div><div class="s"><span>SOUND</span><span>${s}%</span></div><div class="s"><span>GAMEPLAY</span><span>${p}%</span></div><div class="s"><span>LASTABILITY</span><span>${l}%</span></div><div class="big">${r.o}%</div><div class="verdict">"${r.v}"</div>${stars(r.o)}</div></article>`;
    }).join('');
    return pageHead(m, 'reviews') + `<p class="kicker">${D.revIntro || 'Honest reviews. Nobody pays us. Nobody could afford to.'}</p>${cards}`;
  }
  function previews(m, D) {
    return pageHead(m, 'previews') + `<p class="kicker">Coming soon to a shop near you (if you can get a lift).</p><div class="cx-prev">${D.pre.map(p => `<div class="cx-pv"><h3>${esc(p.g)}</h3><span class="meta">${esc(p.p)}</span><p>${p.t}</p><div class="cx-when">${esc(p.when)}</div><div class="cx-hype" title="Hype-o-meter"><i style="width:${p.hype || 70}%"></i><span>HYPE: ${p.hype || 70}%</span></div></div>`).join('')}</div>`;
  }
  function letters(m, D) {
    return pageHead(m, 'letters') + `<p class="kicker">Write in! (Use the Letters page on the site. Or post it through the door. Not the cat flap.)</p>${D.let.map((l, i) => `<div class="letter${i === 0 ? ' star' : ''}"><div class="lh"><span>${esc(l.from)}${i === 0 ? '<span class="starbadge">STAR LETTER</span>' : ''}</span><span>${esc(l.how || 'by e-mail')}</span></div><div class="lb">${l.t}</div><div class="ed"><b>JACK SAYS:</b> ${l.r}</div></div>`).join('')}`;
  }
  function cheats(m, D) {
    return pageHead(m, 'cheats') + `<p class="kicker">Tested by me, on my own machines, at the weekend. If one doesn't work, you did it wrong. (Or Dave did.)</p><div class="cx-cheats">${D.ch.map(c => `<div class="cx-ch"><h3>${esc(c.g)} <span class="meta">${esc(c.p)}</span></h3><p>${c.t}</p></div>`).join('')}</div>`;
  }
  function poster(m, D) {
    const P = D.poster;
    return pageHead(m, 'poster') + `<p class="kicker">Pull out the staples (carefully!) and stick it on your wall. Or your screen:</p><div class="cx-poster"><svg viewBox="0 0 300 400" role="img" aria-label="${esc(P.title)}">${P.svg}</svg></div><div class="cx-pcap"><b>${esc(P.title)}</b> ${P.cap}</div><div class="row" style="justify-content:center;margin:8px 0 14px"><button class="btn" type="button" data-cxwall="${m}">Put it on my desktop</button></div>`;
  }
  function compo(m, D) {
    const C = D.compo, W = window.CX && CX.wins, won = W && W.won && W.won.includes(m), win = W && W.win && W.win[m];
    const q = C.q.map((x, i) => `<fieldset class="cx-q"><legend><b>Q${i + 1}.</b> ${esc(x[0])}</legend>${x[1].map((o, j) => `<label><input type="radio" name="cxq${i}" value="${j}"> ${esc(o)}</label>`).join('')}</fieldset>`).join('');
    const names = win && win.names && win.names.length ? `<p class="cx-small"><b>Winners so far (${win.n}):</b> ${win.names.map(esc).join(', ')}${win.n > win.names.length ? '...' : ''}</p>` : '<p class="cx-small">No winners yet. Could be YOU.</p>';
    return pageHead(m, 'compo') + `<div class="cx-compo"><div class="cx-prize">WIN!!!<br><span>40 RUPEES</span></div><div><p class="tagline">${C.intro}</p><p class="cx-small">All the answers are somewhere in this issue (not in the reviews: I put it together on the 1st). Three questions, three goes a day. The judge (Mom) marks it straight away. JackNet members only, because the prize goes in your Rupee wallet. Three prizes a day across all the issues.</p></div></div>
      ${won ? `<div class="cx-won">&#9733; YOU WON THIS ONE! &#9733; The 40 Rupees are in your wallet. Well done, Super Reader.</div>` : `<form class="cx-form" data-cxiss="${m}" autocomplete="off">${q}<div class="row" style="justify-content:center;gap:8px"><button class="btn" type="submit">Send my answers to Jack</button></div><p class="cx-res" aria-live="polite"></p></form>`}${names}`;
  }

  // ================================================================ clicks inside the archive (cover CD, wallpaper, compo, home)
  document.addEventListener('click', ev => {
    const el = ev.target.closest && ev.target.closest('#s-secret [data-cxcd],#s-secret [data-cxwall],#s-secret [data-cxgo],#s-secret [data-cxbar]'); if (!el) return;
    ev.preventDefault(); ev.stopPropagation();
    if (el.dataset.cxcd) { sfx('turn'); const m = +el.dataset.cxcd; if (m > t99().m) return Desk.msgbox('JACK ATTACK!', 'The cover CD for this issue hasn\'t been burned yet.', 'info'); return A.open('ssn.disc', m - 1); }
    if (el.dataset.cxgo) { sfx('click'); return IE.go('home', 'click'); }
    if (el.dataset.cxbar) { // the barcode is a secret message (every barcode is a little bit different)
      sfx('beep'); const m = +el.dataset.cxbar, n = A.store.get('jhp_cx_bar', []); if (!n.includes(m)) { n.push(m); A.store.set('jhp_cx_bar', n); }
      Desk.msgbox('BEEP!', `You scanned the barcode on the ${MONTHS[m - 1]} issue.\n\nPRODUCT: JACK ATTACK! ${MONTHS[m - 1].toUpperCase()} 1999\nPRICE: 20p\nBARCODE NUMBER: 99${String(m).padStart(2, '0')}\n\n${n.length >= 3 ? 'SECRET MESSAGE: the barcodes are just lines I drew with a ruler. The shop till at the newsagent\'s can\'t read them. Mr Patel just lets me pin them up on his noticeboard.' : 'Scan a few more. Barcodes hide things.'}`, 'info');
      if (n.length >= 3) secret('cx.barcode'); return;
    }
    if (el.dataset.cxwall) {
      const m = +el.dataset.cxwall, P = DATA[m] && DATA[m].poster; if (!P) return;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">${P.svg}</svg>`;
      const w = { img: 'data:image/svg+xml,' + encodeURIComponent(svg), col: P.col || '#008080', mode: 'Center' };
      const d = document.getElementById('desktop'); if (d) d.style.background = `url("${w.img}") center/auto no-repeat,${w.col}`;
      try { localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); } catch (e) {}
      Desk.toast('Display Properties', `The ${MONTHS[m - 1]} poster ("${P.title}") is on your desktop now. Blu-Tack not included.`, 4500);
      sfx('solve'); secret('cx.poster');
    }
  }, true);
  document.addEventListener('submit', ev => {
    const f = ev.target.closest && ev.target.closest('#s-secret .cx-form'); if (!f) return;
    ev.preventDefault();
    const m = +f.dataset.cxiss, res = f.querySelector('.cx-res'), a = [0, 1, 2].map(i => { const x = f.querySelector(`input[name=cxq${i}]:checked`); return x ? +x.value : -1; });
    if (a.some(x => x < 0)) { res.textContent = 'Answer all three questions first! (Mom checks.)'; sfx('uhoh'); return; }
    if (!window.Net || !Net.me || !Net.me.member) { res.innerHTML = 'You need to be a <b>JackNet member</b> to enter: the prize is Rupees. Joining is FREE (Start &gt; Log Off, then pick a name and a password).'; sfx('uhoh'); return; }
    if (!Net.send({ t: 'cxCompo', iss: m, a })) { res.textContent = 'Couldn\'t post your entry: not connected to JackNet. Try again in a minute!'; return; }
    res.textContent = 'Posting your entry... Mom is marking it...'; f.querySelector('button').disabled = true;
    setTimeout(() => { const b = f.querySelector('button'); if (b) b.disabled = false; }, 3000);
  }, true);
  // the server's answer (cx.js passes it on)
  function compoResult(r) {
    const f = document.querySelector(`#s-secret .cx-form[data-cxiss="${r.iss}"]`), res = f && f.querySelector('.cx-res');
    if (!res) return;
    if (r.msg && !r.ok) { res.innerHTML = esc(r.msg); sfx('uhoh'); return; }
    if (r.won) {
      if (r.again) res.innerHTML = 'You already won this one! Try another issue.';
      else { res.innerHTML = `<b>ALL THREE RIGHT!!! YOU WIN ${r.amt || 40} RUPEES!</b>${r.all ? '<br>That\'s ALL TWELVE issues! SUPER READER!!!' : ''}`; sfx('solve'); secret('cx.compo'); if (r.all) secret('cx.superreader'); }
      setTimeout(() => { if (f.isConnected) IE.navigate(url('backissues/' + MON[r.iss - 1] + '/compo')); }, 2500);
      return;
    }
    if (r.full) { res.innerHTML = esc(r.msg); sfx('uhoh'); return; }
    res.innerHTML = `You got <b>${r.right} out of 3</b>. Not quite! ${r.left > 0 ? `${r.left} go${r.left === 1 ? '' : 'es'} left today. Have another read of the issue.` : 'No goes left on this one today. Come back tomorrow!'}`;
    sfx(r.right ? 'boing' : 'uhoh');
  }

  window.CXMag = { MON, MONTHS, META, DATA, add: (m, d) => { DATA[m] = window.Cast ? Cast.deep(d) : d; } /* the visitor's own cast (js/cast.js) fills in {templates} */, archive, issue, cover, compoResult, nice, mdOf };
})();

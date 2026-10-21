/* apps-econ: RUPEES, the money of JackNet (inside the code it is still called "teef": ids, storage keys and ec* messages
 * never changed, so balances carried over 1:1). This always-loaded part keeps your balance (the server holds the real one),
 * puts a gem counter in the tray (gem showers when you earn), pops a balloon, wears the hats/pointers/sounds/colours/pets/
 * wallets you bought, and registers the money web sites (pages load lazily from econ-*.js):
 *   www.rupeeshop.jnet (shop; was teefemporium.grot)   www.jackexchange.grot (stocks)   www.jacktown.jnet (town)
 *   www.jacknetbank.webcom (bank)   www.jacklotto.grot (lottery)   www.jackdownpark.grot (kart races)
 *   www.mypixelfarm.webcom (idle pet farm; was mysquigfarm.webcom)
 * Public API for other packs (window.Econ):
 *   Econ.owned(itemId) -> bool          Econ.wearing(slot) -> itemId|''   (slots: hat face badge gub cur snd col pet wall wal)
 *   Econ.wearOf(nick) -> {hat, face, badge, gub, wal}|null   (any member, live; fires document event 'econ-wear' {detail:{nick}})
 *   Econ.hatSvg(id) / Econ.faceSvg(id) / Econ.badgeSvg(id) -> SVG string (hats 24x16 sit ON the head, faces 24x12 cover eyes..mouth)
 *   Econ.bal, Econ.member, Econ.on(type, fn) for 'me' | 'earn' | 'wear'. Item ids are in js/econ-cat.js.
 *   Money display: Econ.rupees(n[, withWord]) HTML, Econ.rp(n) text, Econ.gem(value|colour, px) SVG, Econ.shower(n, el|{x,y}). */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.Econ) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  const enc = s => `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + s + '</svg>')}")`;

  // ================================================================ wearables (drawn here, tiny)
  const HATS = {
    'hat.party': '<path d="M12 1l6 14H6z" fill="#ff2a6d" stroke="#000" stroke-width=".8"/><path d="M9.4 7.5h5.2M7.8 11.5h8.4" stroke="#ffd400" stroke-width="1.6"/><circle cx="12" cy="1.6" r="1.6" fill="#ffd400" stroke="#000" stroke-width=".5"/>',
    'hat.bobble': '<path d="M5 15c0-6 3-9 7-9s7 3 7 9z" fill="#e10600" stroke="#000" stroke-width=".8"/><path d="M8 9.5h8M6.8 12h10.4" stroke="#fff" stroke-width=".9" stroke-dasharray="1 1"/><rect x="4" y="12.6" width="16" height="2.8" fill="#fff" stroke="#000" stroke-width=".8"/><circle cx="12" cy="4.4" r="2.6" fill="#fff" stroke="#000" stroke-width=".8"/>',
    'hat.top': '<rect x="7" y="1" width="10" height="11.5" fill="#1a1a1a" stroke="#000" stroke-width=".8"/><rect x="7" y="9" width="10" height="2" fill="#b00020"/><rect x="2.5" y="12.2" width="19" height="3" rx="1.2" fill="#1a1a1a" stroke="#000" stroke-width=".8"/><path d="M8.5 2.5v5" stroke="#555"/>',
    'hat.cap': '<path d="M5 14.5c0-6 3-8.5 7-8.5s7 2.5 7 8.5z" fill="#0028c8" stroke="#000" stroke-width=".8"/><path d="M1 13.2h6v2.2H1z" fill="#0028c8" stroke="#000" stroke-width=".8"/><circle cx="12" cy="6" r="1" fill="#fff"/><path d="M12 7v7" stroke="#001880" stroke-width=".6"/><path d="M9 11h6" stroke="#ffd400" stroke-width="1.4"/>',
    'hat.crown': '<path d="M3.5 15V5.5l4.3 4.2L12 2.5l4.2 7.2 4.3-4.2V15z" fill="#ffd400" stroke="#8a6000" stroke-width=".8"/><circle cx="12" cy="2.6" r="1.2" fill="#e10600"/><circle cx="3.6" cy="5.4" r="1" fill="#0a0"/><circle cx="20.4" cy="5.4" r="1" fill="#0a0"/><path d="M4.5 15l1.6-3 1.6 3zM9 15l1.6-3 1.6 3zM13.4 15l1.6-3 1.6 3zM17.4 15l1.4-2.6 1.3 2.6z" fill="#fff" stroke="#999" stroke-width=".4"/>',
    'hat.mek': '<path d="M3.5 15.4c0-7 4-10 8.5-10s8.5 3 8.5 10z" fill="#9a9a9a" stroke="#000" stroke-width=".8"/><path d="M3.8 13h16.4" stroke="#555"/><circle cx="6.5" cy="11" r=".9" fill="#444"/><circle cx="17.5" cy="11" r=".9" fill="#444"/><path d="M8 8c1-1.5 2.5-2 4-2" stroke="#ddd" fill="none"/><rect x="11" y="2.6" width="2" height="3" fill="#555"/><circle cx="12" cy="2.2" r="2" fill="#fff36a" stroke="#000" stroke-width=".5"/>',
    'hat.wizard': '<path d="M13 0L17.5 13H6.5z" fill="#4a2a8a" stroke="#000" stroke-width=".8"/><path d="M2.5 12.8h19v2.6h-19z" rx="1" fill="#4a2a8a" stroke="#000" stroke-width=".8"/><path d="M11.6 5.2l.6 1.3 1.4.2-1 1 .3 1.4-1.3-.7-1.3.7.3-1.4-1-1 1.4-.2z" fill="#ffd400"/><circle cx="14" cy="10.6" r=".7" fill="#ffd400"/><circle cx="9.4" cy="10.2" r=".5" fill="#fff"/>',
  };
  const FACES = {
    'face.shades': '<rect x="2" y="2" width="8.4" height="4.8" rx="1.6" fill="#050505"/><rect x="13.6" y="2" width="8.4" height="4.8" rx="1.6" fill="#050505"/><path d="M10.4 3.2h3.2" stroke="#050505" stroke-width="1.4"/><path d="M3.4 3.2h2.4M15 3.2h2.4" stroke="#fff" stroke-width=".8" opacity=".8"/>',
    'face.3d': '<rect x="1.6" y="1.8" width="20.8" height="5.4" fill="#fff" stroke="#000" stroke-width=".7"/><rect x="2.8" y="2.6" width="7.6" height="3.8" fill="#e10600" opacity=".85"/><rect x="13.6" y="2.6" width="7.6" height="3.8" fill="#0050ff" opacity=".85"/>',
    'face.monocle': '<circle cx="16.4" cy="4.4" r="3.4" fill="#cfe8ff" fill-opacity=".45" stroke="#c9a000" stroke-width="1.1"/><path d="M19 7c1 2 1 3.5 0 5" stroke="#c9a000" stroke-width=".7" fill="none"/>',
    'face.tash': '<path d="M12 8.6c-2.2-1.6-5.8-1.4-8 .6 1.8.2 2.6 1.6 4.4 1.6 1.6 0 2.8-.8 3.6-1.4.8.6 2 1.4 3.6 1.4 1.8 0 2.6-1.4 4.4-1.6-2.2-2-5.8-2.2-8-.6z" fill="#3a2410" stroke="#000" stroke-width=".5"/>',
  };
  const BADGES = {
    'badge.early': '<circle cx="8" cy="8" r="7" fill="#0028c8" stroke="#000"/><text x="8" y="10.8" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="7" fill="#fff">99</text>',
    'badge.waaagh': '<circle cx="8" cy="8" r="7" fill="#2a9a2a" stroke="#000"/><text x="8" y="11" text-anchor="middle" font-family="Impact,Arial" font-size="9" fill="#fff">W!</text>',
    'badge.cube': '<rect x="1.5" y="1.5" width="13" height="13" fill="#111" stroke="#000"/><rect x="2.5" y="2.5" width="3.4" height="3.4" fill="#e10600"/><rect x="6.3" y="2.5" width="3.4" height="3.4" fill="#fff"/><rect x="10.1" y="2.5" width="3.4" height="3.4" fill="#0028c8"/><rect x="2.5" y="6.3" width="3.4" height="3.4" fill="#ffd400"/><rect x="6.3" y="6.3" width="3.4" height="3.4" fill="#0a0"/><rect x="10.1" y="6.3" width="3.4" height="3.4" fill="#ff8c00"/><rect x="2.5" y="10.1" width="3.4" height="3.4" fill="#0a0"/><rect x="6.3" y="10.1" width="3.4" height="3.4" fill="#e10600"/><rect x="10.1" y="10.1" width="3.4" height="3.4" fill="#fff"/>',
    'badge.squig': '<ellipse cx="8" cy="9" rx="7" ry="6" fill="#e10600" stroke="#000"/><circle cx="5.6" cy="7" r="1.6" fill="#ff0"/><circle cx="10.4" cy="7" r="1.6" fill="#ff0"/><path d="M3.6 11h8.8" stroke="#fff" stroke-width="1.4" stroke-dasharray="1.2 .8"/>',
    'badge.landlord': '<path d="M8 1.5L15 8h-2v6.5H3V8H1z" fill="#c8a060" stroke="#000"/><rect x="6.5" y="9.5" width="3" height="5" fill="#6a3a1a"/><path d="M1 8L8 1.5 15 8" fill="none" stroke="#a00" stroke-width="1.5"/>',
    'badge.tycoon': '<circle cx="8" cy="8" r="7" fill="#ffd400" stroke="#8a6000"/><circle cx="8" cy="8" r="5" fill="none" stroke="#c9a000"/><path d="M6 11l2-6 2 6" fill="#fff" stroke="#8a6000" stroke-width=".6"/>',
    'badge.gold': '<path d="M8 .8l2.2 4.6 5 .6-3.7 3.5 1 5L8 12l-4.5 2.5 1-5L.8 6l5-.6z" fill="#ffd400" stroke="#8a6000"/><circle cx="8" cy="7.6" r="1.6" fill="#fff"/>',
  };
  // JackLoot items (ids 'L:hat.viking' etc., js/loot.js) are drawn by js/loot-art.js
  const lootArt = (kind, id) => (String(id || '').startsWith('L:') && window.Loot && Loot.wearSvg ? Loot.wearSvg(kind, id.slice(2)) : '');
  const hatSvg = id => HATS[id] ? `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">${HATS[id]}</svg>` : lootArt('hat', id);
  const faceSvg = id => FACES[id] ? `<svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg">${FACES[id]}</svg>` : lootArt('face', id);
  const badgeSvg = id => BADGES[id] ? `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">${BADGES[id]}</svg>` : lootArt('badge', id);
  // ---- RUPEES (the money; internally still "teef": ids, storage keys and messages keep the old name so balances carry over).
  // A Rupee is a faceted crystal: colour = value. Green 1, Blue 5, Red 20, Purple 50, Gold 100, Rainbow 500.
  // facet colours: [glint-side highlight, top-left, right, bottom-right, bottom-left, left, table, outline]
  const GEMC = {
    green: ['#e2ffcc', '#9cf07a', '#38c040', '#1d8a2a', '#0f5a1a', '#6ad85a', '#4ccc4c', '#0a3a10'],
    blue: ['#e0f0ff', '#8ccaff', '#2f80ee', '#1a4fb8', '#0e2e7a', '#5aa8ff', '#3f90f4', '#0a1f50'],
    red: ['#ffe0e0', '#ff9a9a', '#e8283a', '#a8121f', '#6a0610', '#ff5a64', '#f03c4a', '#40040a'],
    purple: ['#f4e0ff', '#d0a0ff', '#9a3ae0', '#6a1ea8', '#430f70', '#b870f4', '#a64ce8', '#2a0848'],
    gold: ['#fffbd8', '#ffe874', '#f2b612', '#b07a00', '#7a5000', '#ffd23a', '#f8c428', '#4a3000'],
    rainbow: ['#fff6a0', '#ff6a5a', '#38c050', '#2f80ee', '#a050f0', '#ff9a2a', '#ff5ab4', '#2a1a3a'],
  };
  const DEN = [[500, 'rainbow'], [100, 'gold'], [50, 'purple'], [20, 'red'], [5, 'blue'], [1, 'green']];
  const DENV = { green: 1, blue: 5, red: 20, purple: 50, gold: 100, rainbow: 500 };
  const gemCol = v => (typeof v === 'string' && GEMC[v]) ? v : ((DEN.find(d => (+v || 0) >= d[0]) || DEN[DEN.length - 1])[1]); // a value -> the biggest gem it reaches
  function gem(v, size) {
    const c = gemCol(v), k = GEMC[c], wh = size ? ` width="${Math.round(size * 0.75)}" height="${size}"` : '';
    return `<svg class="ec-gem ec-gem-${c}" viewBox="0 0 12 16"${wh} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="M6 .5L11.3 4v8L6 15.5.7 12V4z" fill="${k[2]}"/>` +
      `<path d="M6 .5L.7 4l2.9 1.5L6 3.6z" fill="${k[1]}"/><path d="M6 .5l5.3 3.5-2.9 1.5L6 3.6z" fill="${k[0]}"/>` +
      `<path d="M11.3 4v8l-2.9-1.4V5.5z" fill="${k[2]}"/><path d="M11.3 12L6 15.5v-3.1l2.4-1.8z" fill="${k[3]}"/>` +
      `<path d="M6 15.5L.7 12l2.9-1.4L6 12.4z" fill="${k[4]}"/><path d="M.7 12V4l2.9 1.5v5.1z" fill="${k[5]}"/>` +
      `<path d="M6 3.6l2.4 1.9v5.1L6 12.4l-2.4-1.8V5.5z" fill="${k[6]}"/>` +
      `<path d="M6 .5L11.3 4v8L6 15.5.7 12V4z" fill="none" stroke="${k[7]}" stroke-width=".7" stroke-linejoin="round"/>` +
      `<path d="M4.4 6.2L5.6 5.2M4.4 7.6v1.6" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".95"/>` +
      `<path d="M9.4 1.6l.35.9.9.35-.9.35-.35.9-.35-.9-.9-.35.9-.35z" fill="#fff"/></svg>`;
  }
  // Rupee Wallets (bought at the Rupee Emporium, purely for show: they never limit how many Rupees you can hold)
  const WALS = {
    'wal.kid': '<rect x="1.5" y="4.5" width="13" height="8.5" rx="1" fill="#19b4b4" stroke="#000" stroke-width=".8"/><path d="M1.5 5.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v3.2h-13z" fill="#ff4fa6" stroke="#000" stroke-width=".8"/><rect x="6.3" y="7.4" width="3.4" height="2.4" fill="#ffe000" stroke="#000" stroke-width=".5"/><path d="M3 11.3h10" stroke="#0a6a6a" stroke-width=".7" stroke-dasharray="1 .8"/><path d="M3.4 6.6l1.4-1 .3 1.2 1.3-.9" stroke="#fff" stroke-width=".6" fill="none"/>',
    'wal.big': '<rect x="1" y="4" width="14" height="9.5" rx=".8" fill="#8a4a1a" stroke="#2a1000" stroke-width=".8"/><path d="M1 4.8a.8.8 0 0 1 .8-.8h12.4a.8.8 0 0 1 .8.8L13 8H3z" fill="#b0682e" stroke="#2a1000" stroke-width=".7"/><circle cx="8" cy="8" r="1.1" fill="#f0c860" stroke="#2a1000" stroke-width=".5"/><path d="M2.2 12.4h11.6M2.2 5.4l1.4 2" stroke="#e0b080" stroke-width=".5" stroke-dasharray=".8 .7"/>',
    'wal.giant': '<rect x=".5" y="3" width="15" height="11" rx="1" fill="#6a1ea8" stroke="#1a0030" stroke-width=".8"/><path d="M.5 4a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v3.6H.5z" fill="#9a3ae0" stroke="#1a0030" stroke-width=".7"/><rect x="6.2" y="6.2" width="3.6" height="2.8" rx=".5" fill="#ffd23a" stroke="#6a4000" stroke-width=".6"/><path d="M3 12.5l1-2 1 2zM11 12.5l1-2 1 2z" fill="#38c040" stroke="#0a3a10" stroke-width=".4"/><path d="M7.4 12.6l.6-1.6.6 1.6z" fill="#e8283a" stroke="#40040a" stroke-width=".4"/>',
    'wal.bag': '<path d="M5.2 4.4C2.4 6.6 1 9.6 2 13.4c.3.9 1 1.3 2 1.3h8c1 0 1.7-.4 2-1.3 1-3.8-.4-6.8-3.2-9z" fill="#2a2470" stroke="#000" stroke-width=".8"/><path d="M5 4.4h6" stroke="#e8b840" stroke-width="1.5" stroke-linecap="round"/><path d="M5.6 3.6L4.2 1.8M10.4 3.6l1.4-1.8" stroke="#e8b840" stroke-width=".8"/><path d="M6 9.6a2 2 0 1 1 2 2 1.1 1.1 0 1 1 1-1.2" fill="none" stroke="#9cd0ff" stroke-width=".7"/><circle cx="4.2" cy="8" r=".5" fill="#fff"/><circle cx="11.6" cy="11.2" r=".5" fill="#ffe874"/><circle cx="11" cy="7.4" r=".35" fill="#fff"/>',
  };
  const WALN = { 'wal.kid': "Kid's Wallet", 'wal.big': 'Big Wallet', 'wal.giant': 'Giant Wallet', 'wal.bag': 'Bottomless Bag' };
  const walSvg = id => WALS[id] ? `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${WALS[id]}</svg>` : (String(id || '').startsWith('L:') && window.Loot && Loot.wearSvg ? Loot.wearSvg('wal', id.slice(2)) : '');
  const TOOF = gem('green'); // the old name for the inline money icon: it is a Rupee now
  const rpWord = n => (Math.floor(+n || 0) === 1 ? 'Rupee' : 'Rupees');
  const rp = n => `${fmt(n)} ${rpWord(n)}`; // plain text: "1 Rupee", "250 Rupees"
  // old words in old server data (statements, the Gazette, news written before the switch) are shown in Rupees
  const OLDNEWS = [ // Jack Stock Exchange headlines written before the switch (still in the server's news list)
    [/^SQUIG BLIGHT! Squig Farms crashes as half the squigs come down with the sniffles$/, 'PIXEL POX! Pixel Pets plc crashes as half the keyring pets catch a virus off a floppy disk'],
    [/^Squig Farms wins contract to supply the Jackdown Park racecourse$/, 'Pixel Pets plc wins contract to put a free pet in every cereal box'],
    [/^Squigs escape from Squig Farms pen; "most" recaptured$/, 'Pixel Pets banned from three schools for "beeping in maths"; shares slide'],
    [/^NEW TOOF SEAM FOUND/, 'NEW GEM SEAM FOUND'],
    [/^Tooth Fairy accused of insider trading; teef prices tumble$/, 'Rupee Mining Co. digs for a week and only finds green ones; shares tumble'],
    [/^Teef Mining Co\. digs up a REALLY big toof\. Experts: "dat is a big toof"$/, 'Rupee Mining Co. digs up a RAINBOW Rupee. Experts: "that is a very shiny Rupee"'],
  ];
  const unteef = s => OLDNEWS.reduce((t, [a, b]) => t.replace(a, b), String(s == null ? '' : s)).replace(/Da Teef Emporium/g, 'The Rupee Emporium').replace(/teefemporium\.grot/gi, 'rupeeshop.jnet').replace(/\bSquig Farms? plc\b/g, 'Pixel Pets plc').replace(/\bSquig Farms?\b/g, 'Pixel Pet Farm').replace(/\bTEEF\b/g, 'RUPEES').replace(/\bTeef\b/g, 'Rupees').replace(/\bteef\b/g, 'Rupees').replace(/\btoof\b/g, 'Rupee');
  const rupees = (n, word) => `<span class="ec-tf ec-rp" title="${rp(n)}">${gem(gemCol(n))}<b>${fmt(n)}</b>${word ? ' ' + rpWord(n) : ''}</span>`;
  const split = (n, cap) => { const out = []; let left = Math.max(0, Math.floor(+n || 0)); for (const [v, c] of DEN) while (left >= v && out.length < (cap || 12)) { out.push(c); left -= v; } return out; }; // 37 -> red, blue x3, green x2
  const TIERS = [[100000, 'rainbow'], [20000, 'gold'], [5000, 'purple'], [1000, 'red'], [100, 'blue'], [0, 'green']];
  const tierOf = bal => (TIERS.find(t => (+bal || 0) >= t[0]) || TIERS[TIERS.length - 1])[1]; // the wallet levels up

  // ---- mouse pointers, window colours and sound schemes you can buy
  const CURSVG = {}, cur = (s, hx, hy) => s;
  const CUR0 = {
    'cur.toof': cur('width="24" height="24"><path d="M12 1l8 5v12l-8 5-8-5V6z" fill="#38c040"/><path d="M12 1L4 6l4 2.2L12 5z" fill="#9cf07a"/><path d="M12 1l8 5-4 2.2L12 5z" fill="#e2ffcc"/><path d="M20 18l-8 5v-4.2l4-2.8z" fill="#1d8a2a"/><path d="M12 23l-8-5 4-2 4 2.8z" fill="#0f5a1a"/><path d="M4 18V6l4 2.2V16z" fill="#6ad85a"/><path d="M12 5l4 3.2V16l-4 2.8L8 16V8.2z" fill="#4ccc4c"/><path d="M12 1l8 5v12l-8 5-8-5V6z" fill="none" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.6 9.4l1.6-1.3M9.6 11.2v2.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>', 12, 1),
    'cur.spanner': cur('width="24" height="24"><path d="M3 3l7 7M3 3h4v1.5L4.5 7H3z" stroke="#000" stroke-width="1"/><path d="M6.5 6.5l11 11" stroke="#9a9a9a" stroke-width="4" stroke-linecap="round"/><path d="M6.5 6.5l11 11" stroke="#d8d8d8" stroke-width="1.5" stroke-linecap="round"/><circle cx="19" cy="19" r="4" fill="#9a9a9a" stroke="#000"/><rect x="18" y="16" width="3" height="4" fill="#fff" transform="rotate(45 19 19)"/><path d="M2 2l5 1-4 4z" fill="#ffd400" stroke="#000"/>', 2, 2),
    'cur.squig': cur('width="24" height="24"><path d="M2 2l6 2-4 4z" fill="#fff" stroke="#000"/><ellipse cx="14" cy="14" rx="8" ry="7" fill="#e10600" stroke="#000"/><circle cx="11" cy="11.5" r="2" fill="#ff0" stroke="#000" stroke-width=".6"/><circle cx="17" cy="11.5" r="2" fill="#ff0" stroke="#000" stroke-width=".6"/><path d="M8.5 16.5h11l-1.4 2-1.4-2-1.4 2-1.4-2-1.4 2-1.4-2-1.4 2z" fill="#fff" stroke="#000" stroke-width=".6"/>', 2, 2),
    'cur.gold': cur('width="24" height="24"><path d="M8 2.5c1.2 0 1.8.8 1.8 2V11l1-1.2c1-.6 2-.4 2.4.6.8-.6 1.8-.4 2.3.5.9-.4 1.9 0 2.1 1 .2 2.4.1 5.4-1 7.6l-1 2.5H8.4L5 15.4c-.8-1.2-.6-2.4.6-2.6.7-.1 1.2.3 1.8 1V4.5c0-1.2.4-2 .6-2z" fill="#ffd400" stroke="#6a4a00" stroke-width="1"/><path d="M9 4v6" stroke="#fff4a0" stroke-width="1"/>', 8, 2),
  };
  const CURHOT = { 'cur.toof': [12, 1], 'cur.spanner': [2, 2], 'cur.squig': [2, 2], 'cur.gold': [8, 2] }, CURSORS = {};
  for (const k in CUR0) { CURSVG[k] = '<svg xmlns="http://www.w3.org/2000/svg" ' + CUR0[k] + '</svg>'; CURSORS[k] = `${enc(CUR0[k])} ${CURHOT[k][0]} ${CURHOT[k][1]}, auto`; }
  const COLS = { 'col.gold': ['#7a5a00', '#d4a020', '#e8dcb8'], 'col.squig': ['#a0002a', '#ff5a8a', '#e8c8c8'], 'col.mint': ['#1a7a5a', '#6ad0a8', '#d0ece0'] };
  const tone = (f, d, type, v, when, slide) => { if (!window.Sound || !Sound.on || !Sound.unlock) return; const c = Sound.unlock(); if (!c) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(v == null ? 0.12 : v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02); };
  const SOUNDS = {
    'snd.jingle': { open: () => [2093, 2637, 3136].forEach((f, i) => tone(f, 0.09, 'triangle', 0.08, i * 0.05)), close: () => { tone(1568, 0.08, 'triangle', 0.08); tone(1175, 0.12, 'triangle', 0.07, 0.06); } },
    'snd.squeak': { open: () => tone(900, 0.12, 'square', 0.06, 0, 1800), close: () => tone(1400, 0.1, 'square', 0.06, 0, 700) },
    'snd.floor': { open: () => { tone(1320, 0.35, 'sine', 0.1); tone(1980, 0.3, 'sine', 0.05); }, close: () => { tone(880, 0.25, 'sine', 0.1); tone(660, 0.3, 'sine', 0.08, 0.12); } },
  };

  // ================================================================ state + the wire
  const ev = {};
  const emit = (t, d) => (ev[t] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  let me = null; // the ecMe message (server truth) or null for guests
  const wearMap = {}; // member name (any case) -> [hat, face, badge, gub]
  const isMember = () => !!(window.Net && Net.me && Net.me.member);
  const Econ = window.Econ = {
    get me() { return me; }, get bal() { return me ? me.bal : 0; }, get member() { return isMember(); },
    refresh() { applied = {}; applyAll(); emit('wear', null); }, // re-apply everything (js/loot.js calls this once its drawings have loaded)
    owned: id => !!(me && me.inv && me.inv[id] > 0),
    wearing: slot => (me && me.wear && me.wear[slot]) || '',
    wearOf(nick) { const w = wearMap[String(nick || '').toLowerCase()]; return w ? { hat: w[0] || '', face: w[1] || '', badge: w[2] || '', gub: w[3] || '', wal: w[4] || '' } : null; },
    hatSvg, faceSvg, badgeSvg, TOOF, CURSORS, CURSVG, COLS, SOUNDS, fmt, enc,
    // Rupees: gem(value|colour, sizePx) -> SVG; rupees(n, withWord) -> HTML amount with the right-coloured gem;
    // rp(n) -> "250 Rupees" (text); word(n) -> 'Rupee'|'Rupees'; split(n) -> gem colours for n; tier(bal) -> wallet colour;
    // shower(amount, fromElementOrXY, spend) -> a little burst of gems into (or out of) the tray counter
    walSvg, WALS, gem, rupees, rp, unteef, word: rpWord, split, tier: tierOf, gemCol, DENV, CUR: 'Rupees',
    on(t, fn) { (ev[t] = ev[t] || []).push(fn); return () => { ev[t] = (ev[t] || []).filter(x => x !== fn); }; },
    emit,
    send: m => !!(window.Net && Net.send(m)),
    load: mod => A.load('js/econ-cat.js').then(() => A.load('js/econ-web.js')).then(() => mod ? A.load('js/econ-' + mod + '.js') : null),
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } IE.navigate(url); },
    secret: id => A.secret(id),
    // live feeds (market ticks, town changes, races) are shared by pages and programs: count who wants them
    sub(flag, on) { const n = (subN[flag] || 0) + (on ? 1 : -1); subN[flag] = Math.max(0, n); if ((on && n === 1) || (!on && n <= 0)) Net.send({ t: 'ecSub', [flag]: !!on }); },
  };
  const subN = {};
  // order confirmation e-mails: Outlook Express's mail store is handed to the mail engine (MailGen.attach) at start-up;
  // we borrow its deliver() so the Emporium can send you a receipt. (JackFiles.deliver wins if a later version exports it.)
  let mailApi = null;
  try { // mail-gen.js is loaded later: when it defines MailGen.attach, wrap it so we get to see the api it is given
    if (!window.MailGen) {
      let G0;
      Object.defineProperty(window, 'MailGen', { configurable: true, enumerable: true, get: () => G0, set(v) {
        G0 = v; Object.defineProperty(window, 'MailGen', { value: v, writable: true, configurable: true, enumerable: true });
        if (v && typeof v === 'object') { let at = null; Object.defineProperty(v, 'attach', { configurable: true, enumerable: true, set(fn) { at = fn; }, get: () => at && function (api) { mailApi = api; return at.apply(this, arguments); } }); }
      } });
    }
  } catch (e) {}
  Econ.mail = o => { const d = (window.JackFiles && JackFiles.deliver) || (mailApi && mailApi.deliver); if (!d) return false; try { d(o); return true; } catch (e) { return false; } };
  if (window.Net) {
    Net.on('ecMe', m => { if (m.guest) { me = null; } else { me = m; reportSecrets(); } applyAll(); tray(); emit('me', me); });
    Net.on('ecEarn', m => { if (me) { me.bal = m.bal; } tray(true); earnToast(m); if (m.amt > 0 && !(m.code === 'stock' || m.code === 'farm' && !m.amt)) shower(m.amt, null); emit('earn', m); A.secret('econ.firstteef'); });
    Net.on('ecHi', m => { for (const k in m.wear || {}) wearMap[k.toLowerCase()] = m.wear[k]; emit('wear', null); });
    Net.on('ecWear', m => { wearMap[String(m.n).toLowerCase()] = m.w; document.dispatchEvent(new CustomEvent('econ-wear', { detail: { nick: m.n } })); emit('wear', m.n); });
    Net.on('ecErr', m => { if (!(ev.err || []).length) Desk.toast('JackNet Rupees', m.msg, 5000); emit('err', m.msg); });
    Net.on('loginOk', () => Net.send({ t: 'ecMe' }));
    Net.on('welcome', () => { const o = { t: 'ecSub' }; let any = false; for (const k in subN) if (subN[k] > 0) { o[k] = true; any = true; } if (any) setTimeout(() => Net.send(o), 300); });
    Net.on('you', m => { if (!m.member) { me = null; applyAll(); tray(); emit('me', null); } });
    for (const t of ['ecBought', 'ecUsed', 'ecMkt', 'ecTick', 'ecNews', 'ecTape', 'ecHist', 'ecTraded', 'ecRich', 'ecTown', 'ecPlot', 'ecCell', 'ecStats', 'ecTownEv', 'ecGaz', 'ecLotto', 'ecDraw', 'ecRace', 'ecRun', 'ecRaceEnd', 'ecFarm']) Net.on(t, m => emit(t, m));
    // a member's badge shows on their JackNet profile page too (after Community has drawn it)
    Net.on('profile', m => { const p = m && m.p; if (!p) return; setTimeout(() => { const w = wearMap[String(p.name).toLowerCase()], h = document.querySelector('#s-members .profile .phead h3'); if (!h || !w) return;
      if (w[2] && badgeSvg(w[2]) && !h.querySelector('.ec-pbadge')) { const b = document.createElement('span'); b.className = 'ec-pbadge'; b.title = 'Badge'; b.innerHTML = badgeSvg(w[2]); h.appendChild(b); }
      if (w[4] && walSvg(w[4]) && !h.querySelector('.ec-pwal')) { const b = document.createElement('span'); b.className = 'ec-pwal'; const nm = WALN[w[4]] || 'Rupee Wallet'; b.title = nm; b.innerHTML = walSvg(w[4]) + `<small>${esc(nm)}</small>`; h.appendChild(b); }
    }, 0); });
    Net.on('ecDraw', m => { const L = m.last; if (!L || !me) return; const mine = L.winners.filter(x => x.n === me.name); if (mine.length) Econ.mail({ from: 'JackLotto <winners@jacklotto.grot>', subj: `YOU'RE A WINNER! JackLotto draw ${L.no}`, body: `CONGRATULATIONS ${me.name.toUpperCase()}!!!\n\nTonight's numbers: ${L.balls.slice().sort((a, b) => a - b).join(' ')}\n\n${mine.map(x => `You matched ${x.match} and won ${rp(x.prize)}!`).join('\n')}\n\nYour winnings are already in your JackNet Bank account.\n\nPlease do not spend it all on Pokemon cards.\n\nThe JackLotto Team\n(It could be you. Tonight, it WAS you.)` }); });
    Net.on('ecDraw', m => { if (m.last && me) Desk.toast('JackLotto', `Tonight's numbers: ${m.last.balls.join(' ')}. ${m.last.rolled ? 'ROLLOVER!' : 'JACKPOT WON!'} Check your tickets at www.jacklotto.grot`, 8000); });
  }

  // ---- the gem shower: earning pops gems from where you clicked (or the tray) and arcs them into the counter with a
  // tinkle; spending throws a few out of the tray. Cheap: a handful of absolutely placed SVGs moved with transforms.
  const calm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  let lastPtr = null; // where the visitor last clicked: earning usually comes from what you just did
  document.addEventListener('pointerdown', e => { lastPtr = { ...DesktopSurface.point(e.clientX, e.clientY), at: Date.now() }; }, true);
  const GEMSZ = { green: 18, blue: 19, red: 20, purple: 21, gold: 23, rainbow: 26 };
  const CHIME = { green: 1568, blue: 1760, red: 2093, purple: 2349, gold: 2637, rainbow: 3136 }; // pitch climbs with value
  let gemLayer = null, showerAt = 0, showerT = 0, showerPend = 0;
  function shower(amt, from, spend) {
    amt = Math.floor(+amt || 0); if (amt <= 0) return;
    const t = $('ecTray'); if (!t) return;
    if (calm() || document.hidden) { bump(); return; }
    if (!spend) { // merge bursts that arrive close together (chat, frags...) so the screen never fills up
      const now = Date.now(); if (now - showerAt < 900) { showerPend += amt; clearTimeout(showerT); showerT = setTimeout(() => { const n = showerPend; showerPend = 0; shower(n, null); }, 900 - (now - showerAt)); return; }
      showerAt = now;
    }
    if (!gemLayer || !gemLayer.isConnected) { gemLayer = document.createElement('div'); gemLayer.id = 'ecGems'; gemLayer.setAttribute('aria-hidden', 'true'); DesktopSurface.root().appendChild(gemLayer); }
    const tr = DesktopSurface.rect(t.querySelector('svg.ec-gem') || t), tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
    let fx, fy;
    if (from && from.getBoundingClientRect) { const r = DesktopSurface.rect(from); fx = r.left + r.width / 2; fy = r.top + r.height / 2; }
    else if (from && from.x != null) { fx = from.x; fy = from.y; }
    else if (!spend && lastPtr && Date.now() - lastPtr.at < 4000 && lastPtr.y < tr.top - 30) { fx = lastPtr.x; fy = lastPtr.y; }
    else { fx = tx; fy = ty; }
    const cols = split(amt, 12), fromTray = Math.hypot(fx - tx, fy - ty) < 40;
    cols.forEach((c, i) => {
      const s = document.createElement('div'), sz = GEMSZ[c];
      s.className = 'ec-gemfly'; s.innerHTML = gem(c, sz); gemLayer.appendChild(s);
      const jx = (Math.random() - 0.5) * (fromTray ? 120 : 70), up = 50 + Math.random() * 60, rot = (Math.random() - 0.5) * 300;
      let kf;
      if (spend) kf = [{ transform: `translate(${tx}px,${ty}px) scale(.6)`, opacity: 1 }, { transform: `translate(${tx + jx}px,${ty - up - 40}px) scale(1.1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${tx + jx * 1.6}px,${ty - up * 0.4}px) scale(.8) rotate(${rot}deg)`, opacity: 0 }];
      else if (fromTray) kf = [{ transform: `translate(${tx}px,${ty}px) scale(.3)`, opacity: 0 }, { transform: `translate(${tx + jx}px,${ty - up - 60}px) scale(1.25) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${tx}px,${ty}px) scale(.5) rotate(${rot}deg)`, opacity: 1 }];
      else kf = [{ transform: `translate(${fx}px,${fy}px) scale(.3)`, opacity: 0 }, { transform: `translate(${fx + jx}px,${fy - up}px) scale(1.3) rotate(${rot / 3}deg)`, opacity: 1, offset: 0.3 }, { transform: `translate(${(fx + tx) / 2 + jx}px,${Math.min(fy, ty) - up - 40}px) scale(1) rotate(${rot / 1.5}deg)`, opacity: 1, offset: 0.62 }, { transform: `translate(${tx}px,${ty}px) scale(.5) rotate(${rot}deg)`, opacity: 1 }];
      let a = null;
      try { a = s.animate(kf, { duration: spend ? 650 : fromTray ? 760 : 980, delay: i * (spend ? 45 : 70), easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'both' }); } catch (e) {}
      const done = () => { s.remove(); if (!spend) { bump(); if (window.Sound && Sound.on && Sound.note) Sound.note(CHIME[c] * (i % 2 ? 1.25 : 1), 0.06, 'triangle'); } };
      if (a) a.onfinish = done; else setTimeout(done, 900);
    });
    if (spend && window.Sound && Sound.on && Sound.note) { Sound.note(1320, 0.05, 'triangle'); setTimeout(() => Sound.note(990, 0.07, 'triangle'), 60); }
  }
  function bump() { const t = $('ecTray'); if (!t) return; t.classList.remove('ec-tray-pop'); void t.offsetWidth; t.classList.add('ec-tray-pop'); }
  Econ.shower = shower;

  // ---- earning balloons: small, merged, at most one every 8 seconds
  let pend = null, lastToast = 0, toastT = 0;
  function earnToast(m) {
    if (m.code === 'stock' || m.code === 'farm' && !m.amt) return;
    pend = pend ? { amt: pend.amt + m.amt, n: pend.n + 1, note: m.note } : { amt: m.amt, n: 1, note: m.note };
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      if (!pend) return;
      const p = pend; pend = null; lastToast = Date.now();
      Desk.toast(`+${rp(p.amt)}!`, `${p.n > 1 ? p.n + ' things, last: ' : ''}${unteef(p.note)}. Balance: ${rp(me ? me.bal : 0)}.`, 4000);
      const t = $('ecTray'); if (t) { t.classList.remove('ec-tray-pop'); void t.offsetWidth; t.classList.add('ec-tray-pop'); }
    }, Math.max(600, 8000 - (Date.now() - lastToast)));
  }

  // ---- secrets found on the PC count (a little) towards Rupees. The server only pays once per secret, ten a day.
  const origSecret = A.secret;
  A.secret = function (id) { const r = origSecret.apply(this, arguments); if (r && isMember()) Net.send({ t: 'ecSecret', id: String(id) }); return r; };
  Econ.secret = A.secret;
  let reported = false;
  function reportSecrets() { // secrets found before you joined (or on another day) get back-pay, a few at a time
    if (reported || !me) return; reported = true;
    const f = A.found || {}, done = store.get('jhp_econ_srep_' + me.name.toLowerCase(), []);
    const cap = me.caps && me.caps.secret ? Math.max(0, me.caps.secret[1] - me.caps.secret[0]) : 10, todo = Object.keys(f).filter(k => A.secrets[k] && !done.includes(k)).slice(0, cap); // only what today's allowance can pay; the rest waits for tomorrow
    todo.forEach((k, i) => setTimeout(() => Net.send({ t: 'ecSecret', id: k }), 400 + i * 250));
    store.set('jhp_econ_srep_' + me.name.toLowerCase(), done.concat(todo).slice(-800));
  }

  // ================================================================ applying what you wear
  let curStyle = null, applied = {}, prevCols = null;
  function applyAll() {
    const w = (me && me.wear) || {}, loc = store.get('jhp_econ_wear', {});
    const W = me ? w : loc; // logged out: keep the look you had (the PC remembers it), but nothing new
    if (me) store.set('jhp_econ_wear', { cur: w.cur || '', snd: w.snd || '', col: w.col || '', gub: w.gub || '', pet: w.pet || '' });
    // pointer
    if (applied.cur !== (W.cur || '')) {
      applied.cur = W.cur || '';
      if (!curStyle) { curStyle = document.createElement('style'); curStyle.id = 'ecCurCss'; document.head.appendChild(curStyle); }
      const cu = CURSORS[applied.cur] || (applied.cur.startsWith('L:') && window.Loot && Loot.cursor ? Loot.cursor(applied.cur.slice(2)) : '');
      curStyle.textContent = cu ? `html:has(body.ec-cur), body.ec-cur, body.ec-cur *:not(input):not(textarea):not(select):not([contenteditable="true"]):not(.rz):not(#sizeGrip) { cursor: ${cu} !important; }` : ''; // every element: title bars, menus and the taskbar set their own cursor
      document.body.classList.toggle('ec-cur', !!cu);
    }
    // window colours
    if (applied.col !== (W.col || '')) {
      const was = applied.col; applied.col = W.col || '';
      const r = document.documentElement.style, colOf = id => COLS[id] || (id && id.startsWith('L:') && window.Loot && Loot.cols ? Loot.cols(id.slice(2)) : null), c = colOf(applied.col), K = ['--title1', '--title2', '--face'];
      document.documentElement.classList.toggle('lx-rainbowbars', !!(window.Loot && Loot.animCol && Loot.animCol(applied.col)));
      if (c) { if (!was || !colOf(was)) prevCols = K.map(k => r.getPropertyValue(k)); K.forEach((k, i) => r.setProperty(k, c[i])); }
      else if (was && colOf(was)) { K.forEach((k, i) => { if (prevCols && prevCols[i]) r.setProperty(k, prevCols[i]); else r.removeProperty(k); }); prevCols = null; } // back to whatever Display/Themes had set
    }
    applied.snd = W.snd || '';
    if (applied.gub !== (W.gub || '')) { applied.gub = W.gub || ''; document.querySelectorAll('.ff-mate').forEach(hatOnMate); }
    if (applied.pet !== (W.pet || '')) { applied.pet = W.pet || ''; if (applied.pet || window.EconDesk) Econ.load('desk').then(() => window.EconDesk && EconDesk.pet(applied.pet)).catch(() => {}); }
  }
  // sound scheme: a jingle when a program window opens or closes
  let lastSnd = 0;
  new MutationObserver(ms => {
    for (const m of ms) {
      for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList) { if (n.classList.contains('ff-mate')) hatOnMate(n); if (n.classList.contains('appwin')) playSnd('open'); }
      for (const n of m.removedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('appwin')) playSnd('close');
    }
  }).observe(DesktopSurface.root(), { childList: true });
  function playSnd(k) { const s = SOUNDS[applied.snd]; if (!s) return; const now = Date.now(); if (now - lastSnd < 200) return; lastSnd = now; s[k](); }
  // Gubbinz the screen mate wears a hat (his canvas is 26x28 pixels, scaled 2x on desktops, 1.5x on phones)
  function hatOnMate(el) {
    let h = el.querySelector('.ec-gubhat');
    if (!applied.gub || !hatSvg(applied.gub)) { if (h) h.remove(); return; }
    if (!h) { h = document.createElement('div'); h.className = 'ec-gubhat'; el.appendChild(h); }
    const cv = el.querySelector('canvas'), sc = cv ? (parseFloat(cv.style.width) || 52) / 26 : 2;
    h.style.width = 12 * sc + 'px'; h.style.height = 8 * sc + 'px'; h.style.left = 7.6 * sc + 'px'; h.style.top = 2.4 * sc + 'px';
    h.innerHTML = hatSvg(applied.gub);
    if (applied.gub === 'hat.crown') A.secret('econ.crowngub');
  }
  // restore the look from last time straight away (the server confirms it once JackNet connects)
  applyAll();

  // ================================================================ the tray: a gem and your balance
  let shown = null, rollRaf = 0;
  function roll(span, to) { // the counter counts up (or down) to the new balance
    cancelAnimationFrame(rollRaf);
    const from = shown == null ? to : shown; shown = to;
    if (from === to || calm()) { span.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = Math.min(1100, 350 + Math.abs(to - from) * 12);
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); span.textContent = fmt(from + (to - from) * e); if (k < 1) rollRaf = requestAnimationFrame(step); };
    rollRaf = requestAnimationFrame(step);
  }
  function tray(earned) {
    let b = $('ecTray');
    if (!b) {
      const t = $('tray'); if (!t) return;
      b = document.createElement('button'); b.id = 'ecTray'; b.type = 'button';
      b.innerHTML = '<i class="ec-wal"></i><i class="ec-tgem"></i><span></span>';
      t.insertBefore(b, $('clock'));
      b.addEventListener('click', () => { Sound.play('click'); Econ.go(isMember() ? 'http://www.jacknetbank.webcom/statement.html' : 'http://www.jacknetbank.webcom/'); });
      b.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu(trayMenu(), ev.clientX, ev.clientY - 10); });
    }
    const bal = me ? me.bal : 0, tier = tierOf(bal), g = b.querySelector('.ec-tgem'), wl = b.querySelector('.ec-wal'), sp = b.querySelector('span'), wid = me ? Econ.wearing('wal') : '';
    if (g.dataset.t !== tier) { g.dataset.t = tier; g.innerHTML = gem(tier); }
    if (wl.dataset.w !== wid) { wl.dataset.w = wid; wl.innerHTML = walSvg(wid); }
    b.classList.toggle('ec-guest-t', !me);
    if (me && b.dataset.n !== me.name) { b.dataset.n = me.name; shown = null; } // a different member logged on: no fly-out
    if (!me) { cancelAnimationFrame(rollRaf); shown = null; b.dataset.n = ''; sp.textContent = '?'; }
    else { const prev = shown; roll(sp, bal); if (prev != null && bal < prev && !earned) shower(prev - bal, null, true); }
    b.title = me ? `Rupee Wallet: ${rp(bal)} (click for your bank statement)` : 'Rupees: join JackNet to earn Rupees!';
    b.setAttribute('aria-label', b.title);
  }
  const SITES = [['The Rupee Emporium', 'http://www.rupeeshop.jnet/'], ['Jack Stock Exchange', 'http://www.jackexchange.grot/'], ['Jacktown', 'http://www.jacktown.jnet/'], ['JackNet Bank', 'http://www.jacknetbank.webcom/'], ['JackLotto', 'http://www.jacklotto.grot/'], ['Jackdown Park Kart Races', 'http://www.jackdownpark.grot/'], ['My Pixel Pet Farm', 'http://www.mypixelfarm.webcom/']];
  const walMenu = () => { const mine = Object.keys(WALS).filter(id => Econ.owned(id)), cur = Econ.wearing('wal'); return mine.length ? [{ label: 'Wallet', sub: [{ label: 'No wallet', rad: !cur, act: () => Net.send({ t: 'ecWear', slot: 'wal', id: '' }) }, ...mine.map(id => ({ label: WALN[id] || id, rad: cur === id, act: () => Net.send({ t: 'ecWear', slot: 'wal', id }) }))] }] : [{ label: 'Buy a Rupee Wallet...', act: () => Econ.go('http://www.rupeeshop.jnet/dept/wal.html') }]; };
  const trayMenu = () => [{ label: me ? `Balance: ${rp(me.bal)}` : 'Not logged on to JackNet', dis: true }, '-', ...SITES.map(([l, u]) => ({ label: l, act: () => Econ.go(u) })), '-', ...(me ? walMenu() : []), { label: 'The Rupee Rich List', act: () => Econ.go('http://www.jacknetbank.webcom/richlist.html') }, { label: 'How do I earn Rupees?', act: () => A.openFile(README) }];
  tray();

  // ================================================================ the web sites (page bodies are in econ-*.js)
  // A page is an empty box that fills itself when its module has loaded. Leaving a page calls its cleanups.
  let live = null; // { host, path, el, offs: [] }
  function leave() { if (!live) return; for (const f of live.offs) try { f(); } catch (e) { console.error(e); } live = null; }
  document.addEventListener('section', e => { const d = String(e.detail || ''); if (!live || d !== 'site:' + live.host + live.path) leave(); });
  function page(host, mod, path) {
    return () => {
      leave();
      const el = document.createElement('div'); el.className = 'ecw ecw-load';
      el.innerHTML = `<div class="ecw-loading"><p>Contacting host: <b>${esc(host)}</b>...<br>Host contacted. Waiting for reply...</p><p class="ecw-dots">.</p></div>`;
      live = { host, path, el, offs: [] };
      const me2 = live;
      Econ.load(mod).then(() => { if (live === me2 && el.isConnected !== false && window.EconWeb) EconWeb.render(host, path, el, me2); })
        .catch(() => { el.className = 'ecw ecw-err'; el.innerHTML = `<h2>The page cannot be displayed</h2><p>The server at <b>${esc(host)}</b> is not answering. It might be busy, or a squig might have chewed the cable. Try <b>Refresh</b>.</p>`; });
      return el;
    };
  }
  Econ.page = () => live;
  const COS = ['TEEF', 'SQIG', 'GROT', 'DAKA', 'GUBZ', 'MEKK', 'JNET', 'CUBE', 'GEMS', 'PETS', 'POST', 'BANG', 'KART'], SCATS = ['wall', 'cur', 'snd', 'col', 'hat', 'face', 'badge', 'pet', 'wal', 'gub', 'misc']; // quote pages: internal symbols (old links) + the ones on screen
  const HOSTS = {
    'www.rupeeshop.jnet': ['web', 'The Rupee Emporium', ['/', '/basket.html', '/checkout.html', '/thanks.html', '/stash.html', '/help.html', ...SCATS.map(c => '/dept/' + c + '.html')]],
    'www.jacknetbank.webcom': ['web', 'JackNet Bank Online', ['/', '/statement.html', '/pay.html', '/richlist.html', '/vault.html', '/help.html']],
    'www.jackexchange.grot': ['mkt', 'Jack Stock Exchange', ['/', '/portfolio.html', '/leaders.html', '/news.html', '/help.html', ...COS.map(s => '/quote/' + s.toLowerCase() + '.html')]],
    'www.jacktown.jnet': ['town', 'Jacktown - Online Town', ['/', '/gazette.html', '/stats.html', '/plots.html', '/guide.html']],
    'www.jacklotto.grot': ['fun', 'JackLotto', ['/', '/results.html']],
    'www.jackdownpark.grot': ['fun', 'Jackdown Park Kart Track', ['/', '/form.html']],
    'www.mypixelfarm.webcom': ['fun', 'My Pixel Pet Farm', ['/']],
  };
  if (window.IE && IE.addSite) for (const host in HOSTS) { const [mod, title, paths] = HOSTS[host], pages = {}; for (const p of paths) pages[p] = { title, html: page(host, mod, p) }; IE.addSite(host, { title, pages }); }
  Econ.HOSTS = HOSTS;
  if (window.IE && IE.aliasSite) { IE.aliasSite('www.teefemporium.grot', 'www.rupeeshop.jnet'); IE.aliasSite('www.mysquigfarm.webcom', 'www.mypixelfarm.webcom'); } // renamed: old addresses redirect

  // ================================================================ desktop, Start menu, Run, files, secrets
  const ICO = {
    shop: '<svg viewBox="0 0 32 32"><path d="M6 11h20l-2 18H8z" fill="#ffd400" stroke="#6a4a00"/><path d="M11 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#6a4a00" stroke-width="2"/><g transform="translate(11.5 14) scale(.75)">' + gem('red').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g><g transform="translate(16.5 18) scale(.55)">' + gem('blue').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g></svg>',
    town: '<svg viewBox="0 0 32 32"><path d="M16 4l13 7-13 7-13-7z" fill="#5ab02a" stroke="#1a4a0a"/><path d="M3 11v3l13 7v-3zM29 11v3l-13 7v-3z" fill="#3a7a1a" stroke="#1a4a0a"/><path d="M10 8l5 2.7v6L10 14z" fill="#e8d0a0" stroke="#000" stroke-width=".7"/><path d="M15 10.7l4-2.2v6l-4 2.2z" fill="#c8a870" stroke="#000" stroke-width=".7"/><path d="M10 8l4.5-4.5L19 8.5 15 10.7z" fill="#c00" stroke="#000" stroke-width=".7"/><rect x="21" y="10" width="2.4" height="5" fill="#6a3a1a"/><circle cx="22.2" cy="9" r="3" fill="#2a8a2a" stroke="#0a4a0a"/></svg>',
    stocks: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#000" stroke="#555"/><path d="M5 22l5-6 4 3 6-9 4 4 4-7" stroke="#0f0" stroke-width="2" fill="none"/><path d="M5 24h22" stroke="#0a0"/><rect x="11" y="26" width="10" height="3" fill="#888"/></svg>',
    bank: '<svg viewBox="0 0 32 32"><path d="M16 3l13 7H3z" fill="#d8d8e8" stroke="#000"/><rect x="5" y="11" width="22" height="2" fill="#c8c8d8" stroke="#000"/><path d="M7 13v11M12 13v11M20 13v11M25 13v11" stroke="#888" stroke-width="2.5"/><rect x="3" y="24" width="26" height="4" fill="#c8c8d8" stroke="#000"/><circle cx="16" cy="18" r="3" fill="#ffd400" stroke="#8a6000"/></svg>',
    lotto: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#ffd400" stroke="#8a6000"/><circle cx="12" cy="11" r="4" fill="#fff" opacity=".7"/><circle cx="16" cy="17" r="7" fill="#fff" stroke="#8a6000"/><text x="16" y="21" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10">49</text></svg>',
    race: '<svg viewBox="0 0 32 32"><rect x="1" y="20" width="30" height="10" fill="#3a8a2a"/><path d="M1 20h30" stroke="#fff" stroke-width="2"/><rect x="11" y="8" width="11" height="11" fill="#3a9a2a" stroke="#000"/><path d="M8 10h3M22 10h4" stroke="#000" stroke-width="2"/><rect x="11" y="14" width="11" height="5" fill="#e10600"/><rect x="18" y="10" width="2" height="2" fill="#e10600"/><path d="M13 19v5M20 19l2 5" stroke="#000" stroke-width="2"/></svg>',
    farm: '<svg viewBox="0 0 32 32"><path d="M3 14L16 4l13 10v15H3z" fill="#a03a2a" stroke="#000"/><path d="M3 14L16 4l13 10" fill="none" stroke="#fff" stroke-width="1.5"/><rect x="11" y="18" width="10" height="11" fill="#fff" stroke="#000"/><path d="M11 18l10 11M21 18L11 29" stroke="#a03a2a"/><ellipse cx="26" cy="27" rx="4" ry="3" fill="#3ad0ff" stroke="#000"/><path d="M25 24l-1-2.5M27 24l1-2.5" stroke="#000"/></svg>',
    ticker: '<svg viewBox="0 0 32 32"><rect x="2" y="9" width="28" height="14" fill="#c0c0c0" stroke="#000"/><rect x="4" y="12" width="24" height="8" fill="#000"/><text x="5" y="18.5" font-family="Courier New,monospace" font-size="6" fill="#0f0">GEMS+4</text></svg>',
  };
  const go = url => () => Econ.go(url);
  const lnk = svg => svg.replace('</svg>', '<rect x="1" y="21" width="10" height="10" fill="#fff" stroke="#000" stroke-width=".8"/><path d="M3.5 29c0-4 2-5.5 5-5.5" fill="none" stroke="#000" stroke-width="1.4"/><path d="M6.5 21.8l3 1.8-3 1.8z"/></svg>'); // shortcut arrow
  A.desktopIcon('Jacktown', lnk(ICO.town), go('http://www.jacktown.jnet/'), 'ecDeskTown');
  A.desktopIcon('Rupee Emporium', lnk(ICO.shop), go('http://www.rupeeshop.jnet/'), 'ecDeskShop');
  const P = ['Internet', 'Rupees'];
  A.addProgram([...P, 'The Rupee Emporium'], go('http://www.rupeeshop.jnet/'), ICO.shop);
  A.addProgram([...P, 'Jack Stock Exchange'], go('http://www.jackexchange.grot/'), ICO.stocks);
  A.addProgram([...P, 'Jacktown'], go('http://www.jacktown.jnet/'), ICO.town);
  A.addProgram([...P, 'JackNet Bank'], go('http://www.jacknetbank.webcom/'), ICO.bank);
  A.addProgram([...P, 'JackLotto'], go('http://www.jacklotto.grot/'), ICO.lotto);
  A.addProgram([...P, 'Jackdown Park Kart Races'], go('http://www.jackdownpark.grot/'), ICO.race);
  A.addProgram([...P, 'My Pixel Pet Farm'], go('http://www.mypixelfarm.webcom/'), ICO.farm);
  A.addProgram([...P, 'Jack Ticker 98'], 'econ.ticker', ICO.ticker);
  A.register('econ.ticker', { single: true, cmd: ['ticker', 'jackticker', 'squigticker'], open() {
    if (!Econ.owned('misc.ticker')) { Desk.msgbox('Jack Ticker 98', isMember() ? 'Jack Ticker 98 is not installed.\n\nYou can buy it from The Rupee Emporium (Odds & Sods department) for 150 Rupees.' : 'Jack Ticker 98 is not installed.\n\nLog on to JackNet, earn some Rupees and buy it from The Rupee Emporium.', 'info', [['Go to the shop', go('http://www.rupeeshop.jnet/dept/misc.html')], ['OK']]); return null; }
    const box = document.createElement('div'); box.className = 'ec-tk-load'; box.textContent = 'Connecting to the Jack Exchange...';
    const w = A.win('Jack Ticker 98', box, { w: 330, h: 230, icon: ICO.ticker, minW: 240, minH: 160 });
    Econ.load('desk').then(() => window.EconDesk && EconDesk.ticker(w, box));
    A.secret('econ.ticker');
    return w;
  } });
  A.cmd(['rupees', 'rupee', 'teef', 'wallet', 'jacknetbank'], go('http://www.jacknetbank.webcom/'));
  A.cmd(['jacktown', 'grotville'], go('http://www.jacktown.jnet/'));
  A.cmd(['jackexchange', 'jackex', 'squigex', 'stocks', 'squigexchange'], go('http://www.jackexchange.grot/'));
  A.cmd(['emporium', 'rupeeshop', 'rupeeemporium', 'teefemporium'], go('http://www.rupeeshop.jnet/'));
  A.cmd(['jacklotto', 'grotlotto'], go('http://www.jacklotto.grot/'));
  A.cmd(['jackdownpark', 'jackdown', 'grotdowns', 'racing'], go('http://www.jackdownpark.grot/'));
  A.cmd(['pixelfarm', 'petfarm', 'squigfarm'], go('http://www.mypixelfarm.webcom/'));
  A.cmd(['richlist'], go('http://www.jacknetbank.webcom/richlist.html'));
  A.cmd(['gazette'], go('http://www.jacktown.jnet/gazette.html'));
  A.cmd(['toothfairy', 'tooth fairy'], () => { A.secret('econ.toothfairy'); Desk.msgbox('The Tooth Fairy', "You put a tooth under your pillow and wait...\n\n...and wait...\n\nIn the morning there is a note: \"Sorry, I've gone digital. I only pay in Rupees now, and only to JackNet members. Spend them at The Rupee Emporium. Love, T.F.\"", 'info'); });
  A.cmd(['motherlode', 'show me the money', 'rosebud', 'kaching'], () => { A.secret('econ.cheat'); Desk.msgbox('Cheat Detected', 'RUPEE CHEAT ACTIVATED!\n\n+0 Rupees.\n\nThe JackNet Bank server keeps the real money, so cheats don\'t work here. Nice try though. Jack tried it first.', 'warn'); });

  const README = { name: 'HOW TO EARN RUPEES.txt', type: 'txt', date: '15/10/99', size: '3 KB', text: `HOW TO EARN RUPEES
==================
(by Jack. Typed with two fingers. Checked by Gubbinz, who can't read.)

Rupees are the money of JackNet: shiny gems, and the colour tells you what
they're worth:
   GREEN = 1    BLUE = 5    RED = 20    PURPLE = 50    GOLD = 100
   RAINBOW = 500 (it changes colour! I've only seen one. On Dave's screen.)
They're real (well, pretend-real): the JackNet Bank server keeps everyone's
balance, so they can't be cheated. Promise.

You MUST be a JackNet member to have Rupees. It's free. Start > Log Off, then type a new name and a password.

WAYS TO EARN (every day, there's a limit on each so nobody can cheat):
  * Log on .................... 25 Rupees (+5 for every day you've logged on, up to +30.
                                Missing a day just pauses it. It never goes back down!)
  * Submit a high score ........ 5 Rupees  (up to 12 a day, half after 6)
  * Beat a RECORD .............. 20 Rupees (up to 3 a day)
  * Beat your OWN best score ... 5 Rupees
  * Post on the forums ......... 10 Rupees (15 for a new topic)
  * Write me a letter .......... 15 Rupees (guestbook, once a day)
  * Chat in the Chat Room ...... 1 Rupee   (every 30 seconds, up to 20 a day)
  * Find a secret on this PC ... 5 Rupees  (up to 10 a day)
  * Solve the shared cube ...... 25 Rupees!   * Call the WAAAGH! ....... 15 Rupees
  * Look after Gubbinz ......... 2 Rupees  (only when he needs it!)
  * Frags in JackReal Tournament 2 Rupees each, 15 for winning a match
  * Quiz Night answers ......... 5 Rupees  (JackIRC #quiznight, on the hour)
  * Visitors to your homepage .. 3 Rupees each
  * Visit a web site you've never been to, try a new program,
    play on the PC, win at Solitaire, play the Games Cupboard ... a few Rupees each
  * Lootlings Daily Missions ... 15, 20 and 25 Rupees, +15 for doing all three
  * Jacktown rent, Jack Exchange dividends, JackNet Bank interest,
    Pixel Pet Farm sales, Jackdown Park winnings and JackLotto. (Gambling
    is bad, says Mom. It's only Rupees, says me.)

When you earn, the gems fly into the counter in the tray. Listen with the
speaker on (bottom right): they go "ting"! The gem in the tray changes colour
as you get richer: blue at 100, red at 1,000, purple at 5,000, gold at 20,000
and RAINBOW at 100,000. (Dave says he's nearly rainbow. Dave is green.)

LOOT! Almost anything you do can make an item drop (hats, pets, pointers,
wallpapers, JackCards...). See www.lootlings.jnet and your Treasure Chest.
You can also send Rupees to a friend at the bank (www.jacknetbank.webcom/pay.html).

WHERE TO SPEND THEM:
  www.rupeeshop.jnet ........ The Rupee Emporium: wallpapers, pointers, hats, pets, wallets...
  www.jackexchange.grot .... shares! buy low, sell high, cry
  www.jacktown.jnet ........ claim a plot and build a town with everyone
  www.jacknetbank.webcom .... your bank statement and the Rich List
  www.jacklotto.grot ........ drawn every night at 9pm
  www.jackdownpark.grot ..... go-kart races every 10 minutes
  www.mypixelfarm.webcom .... breed Pixel Pets, sell Pixel Pets, buy more pens
  www.lootlings.jnet ........ shops, the Bazaar, the Trading Post, collections

The gem in the tray (bottom right) shows your balance. Right-click it.
` };
  A.fs.add('C:/My Documents/Rupees', README);
  // the one place the old money is mentioned: Jack's What's New post on the day JackNet switched over
  try { const CAL = window.CAL = window.CAL || { posts: [], hype: [] }; CAL.posts.push(['10-19', 'SITE', `<b>BIG NEWS!!! We've switched JackNet to RUPEES!</b> Your teef have been swapped for shiny Rupees 1-for-1 at the JackNet Bank, so nobody loses a thing. Green ones are worth 1, blue 5, red 20, purple 50, gold 100 and RAINBOW ones are 500 (they change colour!!). Earn some and watch them fly into the tray. Turn the speaker on, they go <i>ting</i>! Spend them at <a href="#" data-n99="http://www.rupeeshop.jnet/">The Rupee Emporium</a>. Dave already wants the Bottomless Bag.`]); } catch (e) {}
  A.fs.add('C:/My Documents/Rupees', { name: 'Jacktown plans.txt', type: 'txt', date: '02/10/99', size: '1 KB', text: "JACKTOWN PLANS (TOP SECRET)\n\nPlot: near the cinema, so I can hear the Episode I music through the wall.\n\n1. Houses (rent!)\n2. A pet shop (Dave says hamsters smell. Dave smells.)\n3. Trees round the edge (pollution)\n4. A FOUNTAIN\n5. A Neighbourhood Watch hut so nobody nicks my Rupees\n\nRemember: the Big Power Station only does 12 buildings. Windmills are cleaner.\nIf the power goes off, the rent halves. Learned that the hard way.\n" });
  A.fs.add('C:/My Documents/Rupees', { name: 'shares.txt', type: 'txt', date: '28/09/99', size: '1 KB', secret: 'econ.sharestxt', text: "MY SHARES (do not show Dad, he will want to \"help\")\n\nBought JNET at 60. It went to 90. Didn't sell. It went to 40.\nLesson: SELL WHEN IT'S UP, JACK.\n\nDave bought BANG because \"fireworks are cool\". That is not how shares work, Dave.\n\nThings that make prices move:\n - news (watch the ticker)\n - everybody buying or selling at once\n - Jacktown! More pet shops = Pixel Pets goes up. More mushroom farms = Gubbinz Pet Food goes up.\n - dividends get paid at midnight to whoever holds the shares\n" });
  A.fs.add('C:/Program Files/Jack Ticker', { name: 'SQTICK98.EXE', type: 'exe', app: 'econ.ticker', size: '86 KB', date: '19/08/99' });
  A.fs.add('C:/Program Files/Jack Ticker', { name: 'README.TXT', type: 'txt', size: '1 KB', date: '19/08/99', text: 'JACK TICKER 98 v1.0\n\nShows live prices from the Jack Stock Exchange (www.jackexchange.grot) in a tiny window. Requires a JackNet connection and a licence from The Rupee Emporium.\n\nDouble-click a price to open its quote page.\n' });

  [
    ['firstteef', 'Ka-ching!', 'Earn your very first Rupee'],
    ['emporium', 'Window shopper', 'Visit the shop that takes Rupees (the real one)'],
    ['secure', 'Totally secure', 'Check how secure the secure server really is'],
    ['firstbuy', 'Retail therapy', 'Buy something with Rupees'],
    ['exchange', 'Trading floor', 'Visit the stock exchange where Pixel Pets are traded'],
    ['firsttrade', 'Stockbroker', 'Buy or sell some shares'],
    ['bull', 'Buy low, sell high', 'Sell some shares for more than you paid'],
    ['ipo', 'Dot-com dreamer', 'Click the flashing advert on the dial-up company page'],
    ['grotville', 'Townie', 'Visit the online town'],
    ['claim', 'Home owner', 'Claim a plot of land'],
    ['cinema', 'Now showing', 'Build somewhere to watch Episode I (again)'],
    ['gazette', 'Read all about it', 'Read the local newspaper'],
    ['townhall', 'Talk to the Mayor', 'Click on the Town Hall'],
    ['bank', 'Online banking', 'Log in to the bank'],
    ['timeout', 'Asleep at the keyboard', 'Leave the bank alone for a while'],
    ['print', 'Paper trail', 'Print a bank statement on the dot-matrix'],
    ['vault', 'Bank job', 'Find the room behind the bank'],
    ['richlist', 'Keeping up with the Joneses', 'Check who has the most Rupees'],
    ['lotto', 'It could be you', 'Buy a lottery ticket'],
    ['lucky', 'Very lucky numbers', 'Pick the most obvious numbers there are'],
    ['race', "A day at the races", 'Watch the go-karts race'],
    ['winbet', 'Picked a winner', 'Win a bet on a kart'],
    ['farm', 'Pet farmer', 'Start a farm (of Pixel Pets)'],
    ['ticker', 'Ticker tape', 'Run the little stock price program'],
    ['pet', 'New best friend', 'Adopt a pet for your taskbar'],
    ['feed', 'Good owner', 'Feed Gubbinz something from a tin'],
    ['hat', 'Dress-up', 'Put a hat on the grot who lives on your desktop'],
    ['crowngub', 'King of the grots', 'Put a very expensive hat on Gubbinz'],
    ['ram', 'More is more', 'Download more memory'],
    ['toothfairy', 'Under the pillow', 'Ask for the Tooth Fairy'],
    ['cheat', 'Money for nothing', 'Try a famous money cheat in Run'],
    ['sharestxt', 'Insider trading', "Read Jack's notes on his shares"],
  ].forEach(([id, n, h]) => A.defineSecret('econ.' + id, n, h));
})();

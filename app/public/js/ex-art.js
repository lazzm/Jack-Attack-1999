/* ex-art: the drawings for the ECONOMY expansion (all original, all SVG, drawn from the numbers in js/ex-cat.js).
 *   ExArt.card(id)     a JackCards Series Two "Byte Beasties" card (60x84, holo shine for Rare and up, rainbow for Jackpot)
 *   ExArt.beast(id)    just the creature, for big pictures (40x32 box)
 *   ExArt.battle(id)   the Card Clash face of ANY playable card (Series One gadgets get their rules printed on)
 *   ExArt.pic(id)      the square picture of our other JackLoot things (Mega Masters cups)
 *   ExArt.elIcon(el), ExArt.pack(n) (a booster wrapper)
 * Once JackLoot's drawings have loaded, LootArt.pic/card hand our items to us, so they look right in the Treasure
 * Chest, the Bazaar, the Trading Post, profiles and everywhere else. */
(function () {
  'use strict';
  const X = window.ExCat; if (!X || window.ExArt) return;
  let uidN = 0; const uid = p => 'ex' + p + (++uidN).toString(36);
  const S = (vb, inner, cls) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${cls ? ` class="${cls}"` : ''} aria-hidden="true">${inner}</svg>`;
  const E = X.EL, K = 'stroke="#000" stroke-width=".7"', KT = 'stroke="#000" stroke-width=".5"';
  const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const t = f < 0 ? 0 : 255, p = Math.abs(f); r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };
  const RAINBOW = ['#e10600', '#ff8a00', '#ffd400', '#2a9a2a', '#0060d0', '#8a1ad8'];

  // ================================================================ little element symbols (8x8)
  const EICON = {
    zap: c => `<path d="M4.6 .6L1.4 4.6h2.2L2.8 7.4 6.6 3.2H4.2z" fill="${c}" ${KT}/>`,
    splash: c => `<path d="M4 .6C5.6 3 6.8 4.2 6.8 5.4A2.8 2.8 0 0 1 1.2 5.4C1.2 4.2 2.4 3 4 .6z" fill="${c}" ${KT}/><path d="M2.6 5.2c0 .8.4 1.2 1 1.4" stroke="#fff" stroke-width=".5" fill="none"/>`,
    blaze: c => `<path d="M4 .4c.4 1.6 2.6 2.4 2.6 4.6A2.6 2.6 0 0 1 1.4 5c0-1.2.8-1.6 1-2.6.6.8.8 1.2 1.2 1.2C3.6 2.6 3.4 1.6 4 .4z" fill="${c}" ${KT}/><path d="M4 7.2a1.2 1.2 0 0 1-1.2-1.2c0-.8.8-1 1-1.8.4.8 1.4 1 1.4 1.8A1.2 1.2 0 0 1 4 7.2z" fill="#ffd400"/>`,
    clank: c => `<circle cx="4" cy="4" r="2.4" fill="${c}" ${KT}/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<rect x="${(4 + 3 * Math.cos(a) - 0.8).toFixed(2)}" y="${(4 + 3 * Math.sin(a) - 0.8).toFixed(2)}" width="1.6" height="1.6" fill="${c}" ${KT}/>`; }).join('')}<circle cx="4" cy="4" r=".9" fill="#333"/>`,
    sprout: c => `<path d="M1 7C1 3 3.4 1 7 1c0 3.6-2 6-6 6z" fill="${c}" ${KT}/><path d="M1.6 6.4L5.4 2.6" stroke="#0a3a0a" stroke-width=".5"/>`,
    cosmic: c => `<path d="M4 .4l1 2.6 2.6.2-2 1.7.7 2.7L4 6.1 1.7 7.6l.7-2.7-2-1.7L3 3z" fill="${c}" ${KT}/>`,
  };
  const elIcon = (el, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${(EICON[el] || EICON.cosmic)(E[el] ? E[el].col : '#fff')}</g>`;

  // ================================================================ the creature generator (a 40x32 box)
  // every body gives back where its face and its top are, so eyes, mouths and hats land in the right place
  function body(kind, c, c2) {
    const d = shade(c, -0.35), l = shade(c, 0.45);
    const hl = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${l}" opacity=".7"/>`;
    switch (kind) {
      case 'ball': return { s: `<circle cx="20" cy="18" r="10.5" fill="${c}" ${K}/>${hl(16, 13, 3.4, 2)}<path d="M12 23c3 3.4 13 3.4 16 0" stroke="${d}" fill="none"/>`, ey: 16, my: 22, ty: 7.6, cx: 20, w: 10.5, by: 28.5 };
      case 'blob': return { s: `<path d="M9 26C7 18 10 7 20 7s13 11 11 19c-1 3-4 1.6-5.4 3.4-1.6-2-3.6-2-5.6 0-2-2-4-2-5.6 0C12.6 27.6 10 29 9 26z" fill="${c}" ${K}/>${hl(15, 12, 3.6, 2.2)}`, ey: 15, my: 21, ty: 7.2, cx: 20, w: 11, by: 28 };
      case 'pear': return { s: `<path d="M20 6c4 0 5.4 4 5.4 6.6 0 2 4.4 4.2 4.4 9.4C29.8 27 25.6 29 20 29s-9.8-2-9.8-7c0-5.2 4.4-7.4 4.4-9.4C14.6 10 16 6 20 6z" fill="${c}" ${K}/>${hl(17, 10, 2, 1.4)}`, ey: 13, my: 20, ty: 6.2, cx: 20, w: 9.6, by: 29 };
      case 'bean': return { s: `<ellipse cx="20" cy="19.5" rx="13.5" ry="8.5" fill="${c}" ${K}/>${hl(14, 15.4, 4, 1.8)}<circle cx="27" cy="23" r="1" fill="${d}"/><circle cx="12" cy="22" r=".8" fill="${d}"/>`, ey: 17, my: 22.4, ty: 11, cx: 20, w: 13.5, by: 28 };
      case 'box': return { s: `<rect x="9" y="8" width="22" height="20" rx="3" fill="${c}" ${K}/>${hl(14, 11, 3.4, 1.4)}<path d="M9 23h22" stroke="${d}"/>`, ey: 15, my: 21, ty: 8, cx: 20, w: 11, by: 28 };
      case 'bot': return { s: `<rect x="10" y="7" width="20" height="13" rx="2" fill="${c}" ${K}/><rect x="12" y="20" width="16" height="9" rx="1" fill="${d}" ${K}/><rect x="15" y="22" width="10" height="4" fill="${c2}" ${KT}/><circle cx="11.6" cy="8.6" r=".7" fill="#555"/><circle cx="28.4" cy="8.6" r=".7" fill="#555"/>${hl(14, 9.6, 3, 1)}`, ey: 12.4, my: 17, ty: 7, cx: 20, w: 10, by: 29 };
      case 'toad': return { s: `<ellipse cx="20" cy="21.5" rx="14.5" ry="8" fill="${c}" ${K}/><circle cx="14" cy="15" r="4.2" fill="${c}" ${K}/><circle cx="26" cy="15" r="4.2" fill="${c}" ${K}/><path d="M8 27c-3 0-4 1.6-4 2.4h7M32 27c3 0 4 1.6 4 2.4h-7" fill="${c}" ${K}/>${hl(14, 19, 4, 1.4)}<circle cx="20" cy="25" r="1.4" fill="${c2}" opacity=".8"/><circle cx="24" cy="23" r="1" fill="${c2}" opacity=".8"/>`, ey: 14.6, my: 22, ty: 11, cx: 20, w: 14, by: 29, eyesApart: 12 };
      case 'bird': return { s: `<circle cx="20" cy="18" r="8.6" fill="${c}" ${K}/>${hl(17, 14, 2.6, 1.6)}<path d="M17 27l-1 3M23 27l1 3" stroke="#000" stroke-width=".8"/>`, ey: 16, my: 21, ty: 9.4, cx: 20, w: 8.6, by: 27 };
      case 'fish': return { s: `<path d="M30 18l7-6v12z" fill="${c2}" ${K}/><ellipse cx="18" cy="18" rx="13" ry="8.6" fill="${c}" ${K}/>${hl(13, 14, 4, 1.6)}<path d="M24 12c0 3 0 9 0 12" stroke="${d}"/><path d="M26 15c-1 1-1 5 0 6" stroke="${d}"/>`, ey: 16, my: 21, ty: 9.4, cx: 15, w: 9, by: 26.6 };
      case 'ghost': return { s: `<path d="M8 28V17C8 10 13 6 20 6s12 4 12 11v11l-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4z" fill="${c}" ${K}/>${hl(14, 11, 3.6, 2)}`, ey: 15, my: 21, ty: 6, cx: 20, w: 12, by: 28 };
      case 'cone': return { s: `<path d="M20 9L31 28H9z" fill="${c}" ${K}/><path d="M11 24h18M14 19h12" stroke="${d}" stroke-width="1.2"/><path d="M9 28l3-3M31 28l-3-3" stroke="#000" stroke-width=".6"/>`, ey: 19, my: 24, ty: 9, cx: 20, w: 9, by: 28 };
      case 'dragon': return { s: `<path d="M27 25c5 0 8-3 9-7-2 2-5 3-8 2z" fill="${c}" ${K}/><path d="M8 27c0-8 3-16 12-16 6 0 9 4 9 9 0 5-4 8-10 8H10z" fill="${c}" ${K}/><path d="M12 11c-3-1-6 1-7 4 3-.6 5 0 6 1.6z" fill="${c}" ${K}/><path d="M14 22c2 2 6 2.4 9 1" stroke="${c2}" stroke-width="2" fill="none"/>${hl(17, 14, 3, 1.4)}`, ey: 15, my: 19.6, ty: 10.4, cx: 19, w: 9, by: 28 };
      case 'bug': return { s: `<ellipse cx="22" cy="21" rx="9" ry="7" fill="${c}" ${K}/><path d="M22 14v14" stroke="${d}"/><circle cx="14" cy="15" r="6" fill="${c}" ${K}/>${hl(12, 12.4, 2, 1.2)}<path d="M18 27l-2 3M24 28l0 3M28 26l2 3" stroke="#000" stroke-width=".7"/>`, ey: 14.4, my: 18.4, ty: 9, cx: 14, w: 6, by: 28 };
      case 'can': return { s: `<rect x="12" y="7" width="16" height="22" rx="2" fill="${c}" ${K}/><ellipse cx="20" cy="7.4" rx="8" ry="1.8" fill="#c8ccd4" ${K}/><rect x="12" y="20" width="16" height="5" fill="${c2}"/><path d="M14 10v16" stroke="#fff" stroke-width="1.2" opacity=".6"/>`, ey: 13, my: 18, ty: 6, cx: 20, w: 8, by: 29 };
      case 'wave': return { s: `<path d="M5 29c0-12 6-22 18-22 7 0 11 5 11 10 0 4-3 6-6 6-4 0-5-3-4-5 1-1.4 3-1 3 .6-.4-3-3-4.6-6-3.4-5 2-6 8-6 14z" fill="${c}" ${K}/><path d="M7 29c0-8 3-14 8-17" stroke="${c2}" stroke-width="1.6" fill="none"/><path d="M5 29h30" stroke="#000" stroke-width=".7"/>`, ey: 14, my: 20, ty: 7, cx: 17, w: 8, by: 29 };
      case 'cog': return { s: `${Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<rect x="${(20 + 11.4 * Math.cos(a) - 2.2).toFixed(2)}" y="${(18 + 11.4 * Math.sin(a) - 2.2).toFixed(2)}" width="4.4" height="4.4" transform="rotate(${i * 36} ${(20 + 11.4 * Math.cos(a)).toFixed(2)} ${(18 + 11.4 * Math.sin(a)).toFixed(2)})" fill="${c}" ${K}/>`; }).join('')}<circle cx="20" cy="18" r="10" fill="${c}" ${K}/>${hl(16, 14, 3, 1.6)}`, ey: 16, my: 22, ty: 6.6, cx: 20, w: 10, by: 29 };
      case 'wedge': return { s: `<path d="M5 26L27 12h6v14z" fill="${c}" ${K}/><path d="M27 12v14" stroke="${d}"/><rect x="29" y="14" width="3" height="3" fill="${c2}"/><path d="M8 25l19-11" stroke="#fff" stroke-width=".8" opacity=".6"/>`, ey: 18, my: 22, ty: 12, cx: 25, w: 6, by: 26, eyesApart: 5 };
      case 'shell': return { s: `<path d="M8 28c0-10 5-19 12-19s12 9 12 19z" fill="${c}" ${K}/><path d="M14 28c0-8 2-15 6-17M26 28c0-8-2-15-6-17M20 11v17" stroke="${shade(c, -0.25)}" fill="none"/>${hl(15, 15, 2.4, 1.4)}`, ey: 19, my: 24, ty: 9, cx: 20, w: 10, by: 28 };
      case 'lizard': return { s: `<path d="M26 24c4 1 7 0 10-3-3 4-6 6-10 6z" fill="${c}" ${K}/><ellipse cx="18" cy="22" rx="10" ry="5" fill="${c}" ${K}/><circle cx="11" cy="16" r="5.4" fill="${c}" ${K}/><path d="M13 26l-2 3M23 26l2 3" stroke="#000" stroke-width=".8"/>${hl(10, 13.6, 2, 1.2)}`, ey: 15.4, my: 18.6, ty: 10.6, cx: 11, w: 5.4, by: 28 };
      case 'whale': return { s: `<path d="M32 18c2-3 5-4 7-4-1 2-1 4 0 6-2 0-5-1-7-2z" fill="${c}" ${K}/><path d="M4 21C4 14 10 9 19 9c8 0 14 4 14 10 0 6-6 9-15 9C9 28 4 26 4 21z" fill="${c}" ${K}/><path d="M6 23c6 4 18 4 26-1" stroke="${c2}" stroke-width="2" fill="none"/>${hl(12, 13, 4, 1.6)}`, ey: 16, my: 21.4, ty: 9, cx: 14, w: 9, by: 28 };
      case 'phoenix': return { s: `<path d="M20 29c-3 0-4-2-4-4 0 1-2 2-3 1 2-1 2-4 3-6 1-4 2-8 4-8s3 4 4 8c1 2 1 5 3 6-1 1-3 0-3-1 0 2-1 4-4 4z" fill="${c}" ${K}/><circle cx="20" cy="13" r="6" fill="${c}" ${K}/>${hl(18, 10.6, 2, 1.2)}<path d="M18 22h4M17.6 25h4.8" stroke="${c2}" stroke-width="1.2"/>`, ey: 12.4, my: 16, ty: 7, cx: 20, w: 6, by: 29 };
    }
    return body('ball', c, c2);
  }
  function eyes(kind, b) {
    const y = b.ey, x = b.cx, g = b.eyesApart ? b.eyesApart / 2 : Math.min(4.2, b.w * 0.42);
    const eye = (ex, r) => `<circle cx="${ex}" cy="${y}" r="${r}" fill="#fff" ${KT}/><circle cx="${ex + 0.4}" cy="${y + 0.3}" r="${r * 0.5}" fill="#000"/><circle cx="${ex + 0.8}" cy="${y - 0.4}" r="${r * 0.18}" fill="#fff"/>`;
    switch (kind) {
      case 'one': return eye(x, 3.6);
      case 'three': return eye(x - g - 0.6, 1.8) + eye(x, 2.2) + eye(x + g + 0.6, 1.8);
      case 'angry': return eye(x - g, 2.2) + eye(x + g, 2.2) + `<path d="M${x - g - 2.6} ${y - 3.4}l4 1.6M${x + g + 2.6} ${y - 3.4}l-4 1.6" stroke="#000" stroke-width="1.1" stroke-linecap="round"/>`;
      case 'sleepy': return `<path d="M${x - g - 2} ${y}a2 2 0 0 0 4 0zM${x + g - 2} ${y}a2 2 0 0 0 4 0z" fill="#fff" ${KT}/><path d="M${x - g - 2.2} ${y}h4.4M${x + g - 2.2} ${y}h4.4" stroke="#000" stroke-width=".9"/><circle cx="${x - g}" cy="${y + 0.9}" r=".8"/><circle cx="${x + g}" cy="${y + 0.9}" r=".8"/>`;
      case 'visor': return `<rect x="${x - g - 3.4}" y="${y - 2}" width="${2 * g + 6.8}" height="3.8" rx="1.6" fill="#1a1a2a" ${KT}/><rect x="${x - g - 2}" y="${y - 0.8}" width="${2 * g + 4}" height="1.4" fill="#ff3020"/><rect x="${x - g - 1.6}" y="${y - 1.2}" width="2" height=".6" fill="#fff" opacity=".7"/>`;
      case 'lcd': return `<rect x="${x - g - 3}" y="${y - 2.4}" width="${2 * g + 6}" height="4.6" fill="#0a2a0a" ${KT}/><rect x="${x - g - 1}" y="${y - 1.2}" width="2" height="2" fill="#5aff5a"/><rect x="${x + g - 1}" y="${y - 1.2}" width="2" height="2" fill="#5aff5a"/>`;
      case 'stalk': return `<path d="M${x - 2} ${y + 1}L${x - g - 1.6} ${y - 5}M${x + 2} ${y + 1}L${x + g + 1.6} ${y - 5}" stroke="#000" stroke-width=".8"/>` + `<g transform="translate(0 -6)">${eye(x - g - 1.6, 2)}${eye(x + g + 1.6, 2)}</g>`;
      default: return eye(x - g, 2.3) + eye(x + g, 2.3);
    }
  }
  function mouth(kind, b) {
    const y = b.my, x = b.cx, w = Math.min(5, b.w * 0.5);
    switch (kind) {
      case 'fangs': return `<path d="M${x - w} ${y}q${w} ${3} ${2 * w} 0" fill="#3a0000" ${KT}/><path d="M${x - w * 0.6} ${y + 0.4}l.8 1.8.8-1.6M${x + w * 0.6} ${y + 0.4}l-.8 1.8-.8-1.6" fill="#fff" stroke="#000" stroke-width=".3"/>`;
      case 'teeth': return `<rect x="${x - w}" y="${y - 1.4}" width="${2 * w}" height="3" rx=".6" fill="#fff" ${KT}/><path d="M${x - w} ${y}h${2 * w}M${x - w / 2} ${y - 1.4}v3M${x} ${y - 1.4}v3M${x + w / 2} ${y - 1.4}v3" stroke="#000" stroke-width=".35"/>`;
      case 'o': return `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="1.7" fill="#3a0000" ${KT}/>`;
      case 'grin': return `<path d="M${x - w - 1} ${y - 1}q${w + 1} ${5} ${2 * w + 2} 0z" fill="#3a0000" ${KT}/><path d="M${x - w} ${y - 0.6}h${2 * w}" stroke="#fff" stroke-width=".8"/>`;
      case 'tongue': return `<path d="M${x - w} ${y - 0.6}q${w} ${3} ${2 * w} 0" fill="none" stroke="#000" stroke-width=".7"/><path d="M${x - 1} ${y + 0.6}q1 3 2 0z" fill="#ff6a8a" ${KT}/>`;
      case 'frown': return `<path d="M${x - w * 0.7} ${y + 1}q${w * 0.7} -2.4 ${w * 1.4} 0" fill="none" stroke="#000" stroke-width=".8"/>`;
      case 'beak': return `<path d="M${x - 2} ${y - 1}h4l-2 3z" fill="#ffa000" ${KT}/>`;
      case 'none': return '';
      default: return `<path d="M${x - w * 0.8} ${y - 0.4}q${w * 0.8} ${2.6} ${w * 1.6} 0" fill="none" stroke="#000" stroke-width=".8" stroke-linecap="round"/>`;
    }
  }
  function top(kind, b, c, c2) {
    const y = b.ty, x = b.cx;
    switch (kind) {
      case 'ears': return `<path d="M${x - 8} ${y + 4}l-1-6 5 3zM${x + 8} ${y + 4}l1-6-5 3z" fill="${c}" ${K}/><path d="M${x - 8} ${y + 2.4}l-.4-2.4 2 1.2zM${x + 8} ${y + 2.4}l.4-2.4-2 1.2z" fill="#ff9ab0"/>`;
      case 'antenna': return `<path d="M${x - 2} ${y + 1}l-3-6M${x + 2} ${y + 1}l3-6" stroke="#000" stroke-width=".8"/><circle cx="${x - 5}" cy="${y - 5}" r="1.5" fill="${c2}" ${KT}/><circle cx="${x + 5}" cy="${y - 5}" r="1.5" fill="${c2}" ${KT}/>`;
      case 'horns': return `<path d="M${x - 5} ${y + 2}c-2-2-2-5 0-7 0 2 1 4 3 5zM${x + 5} ${y + 2}c2-2 2-5 0-7 0 2-1 4-3 5z" fill="#fffbe8" ${K}/>`;
      case 'spikes': return [-6, -2, 2, 6].map(o => `<path d="M${x + o - 2} ${y + 2}l2-5 2 5z" fill="${c2}" ${KT}/>`).join('');
      case 'leaf': return `<path d="M${x} ${y + 1}c0-3 2-5 5-5 0 3-2 5-5 5z" fill="#3ab03a" ${K}/><path d="M${x} ${y + 1}c0-2-1.6-3.6-4-3.6 0 2 1.6 3.6 4 3.6z" fill="#5ad85a" ${K}/>`;
      case 'flame': return `<path d="M${x} ${y - 6}c1 3 5 4 5 8a5 5 0 0 1-10 0c0-2 1.4-3 2-4.4 1 1.2 1.4 2 2 2 0-2-.6-3.4 1-5.6z" fill="#ff8a00" ${K}/><path d="M${x} ${y + 3.6}a2.4 2.4 0 0 1-2.4-2.4c0-1.4 1.4-2 2-3.4.8 1.4 2.8 2 2.8 3.4A2.4 2.4 0 0 1 ${x} ${y + 3.6}z" fill="#ffd400"/>`;
      case 'crown': return `<path d="M${x - 5} ${y + 1}v-5l2.5 2.4L${x} ${y - 6}l2.5 3.4L${x + 5} ${y - 4}v5z" fill="#ffd400" ${K}/><circle cx="${x}" cy="${y - 1}" r=".9" fill="#e10600"/>`;
      case 'cap': return `<path d="M${x - 7} ${y + 3}c0-4 3-6 7-6s7 2 7 6z" fill="${c2}" ${K}/><path d="M${x + 4} ${y + 3}h7v1.4h-7z" fill="${c2}" ${K}/><circle cx="${x}" cy="${y - 2.6}" r=".8" fill="#fff"/>`;
      case 'toast': return `<path d="M${x - 6} ${y + 1}v-4c0-2 1-3 2.6-3 .4-1 1.6-1.6 3.4-1.6s3 .6 3.4 1.6C${x + 5} ${y - 7} ${x + 6} ${y - 6} ${x + 6} ${y - 3}v4z" fill="#e8b060" ${K}/><path d="M${x - 4.6} ${y - 1}h9.2" stroke="#a0602a"/>`;
      case 'lid': return `<rect x="${x - 12}" y="${y - 3}" width="24" height="3.4" rx="1" fill="${shade(c, -0.25)}" ${K}/><rect x="${x - 3}" y="${y - 5}" width="6" height="2" fill="${shade(c, -0.4)}" ${KT}/>`;
      case 'dish': return `<path d="M${x} ${y}v-4" stroke="#000" stroke-width=".8"/><path d="M${x - 5} ${y - 8}a5 3 0 0 0 10 0z" fill="#d8dce4" ${K}/><circle cx="${x}" cy="${y - 8}" r=".9" fill="#e10600"/>`;
      case 'tab': return `<rect x="${x - 2}" y="${y - 2.4}" width="4" height="2.4" rx="1" fill="none" stroke="#888" stroke-width=".8"/>`;
      case 'shell': return Array.from({ length: 7 }, (_, i) => { const a = Math.PI + i * Math.PI / 6; return `<path d="M${(x + 9.6 * Math.cos(a)).toFixed(1)} ${(18 + 9.6 * Math.sin(a)).toFixed(1)}l${(3.4 * Math.cos(a)).toFixed(1)} ${(3.4 * Math.sin(a)).toFixed(1)}" stroke="#2a8a2a" stroke-width="1.4" stroke-linecap="round"/>`; }).join('');
      case 'stalk': return `<path d="M${x} ${y + 1}c0-3 1-5 4-6" stroke="#2a8a2a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      case 'crest': return `<path d="M${x - 3} ${y + 1}l-2-6 3 3 2-5 2 5 3-3-2 6z" fill="#ffd400" ${K}/>`;
      case 'spout': return `<path d="M${x + 2} ${y}c-1-3-4-4-6-3M${x + 2} ${y}c1-3 4-4 6-3M${x + 2} ${y}v-5" stroke="#8ad8ff" stroke-width="1.2" fill="none"/>`;
      case 'fin': return `<path d="M${x - 2} ${y + 1}c1-4 4-6 8-6-1 2-1 4 0 6z" fill="${c2}" ${K}/>`;
    }
    return '';
  }
  function extra(kind, b, c, c2) {
    const x = b.cx;
    switch (kind) {
      case 'sparks': return `<path d="M4 6l2 3-2 1 3 3M35 5l-2 3 2 1-3 3M36 24l-3 1 1 2-3 1" stroke="#ffd400" stroke-width="1.2" fill="none" stroke-linejoin="round"/>`;
      case 'wheel': return `<circle cx="20" cy="18" r="15" fill="none" stroke="#6a6a6a" stroke-width="1.4" stroke-dasharray="3 1.4" opacity=".8"/>`;
      case 'cable': return `<path d="M33 22c4 0 5 3 3 5s-1 4 2 4" stroke="#333" stroke-width="1.4" fill="none"/><rect x="36" y="29" width="3" height="3" fill="#c8c8c8" ${KT}/>`;
      case 'wings': return `<path d="M${x - 8} 16c-6-6-10-4-11 1 3-1 4 1 4 3 2-2 4-2 7-1zM${x + 8} 16c6-6 10-4 11 1-3-1-4 1-4 3-2-2-4-2-7-1z" fill="${c2}" ${K} opacity=".95"/>`;
      case 'drops': return `<path d="M6 8c1 2 2 3 2 4a2 2 0 0 1-4 0c0-1 1-2 2-4zM33 4c1 2 2 3 2 4a2 2 0 0 1-4 0c0-1 1-2 2-4zM35 22c.8 1.6 1.6 2.4 1.6 3.2a1.6 1.6 0 0 1-3.2 0c0-.8.8-1.6 1.6-3.2z" fill="#8ad8ff" ${KT}/>`;
      case 'bubbles': return `<circle cx="34" cy="8" r="2" fill="#e0f4ff" ${KT} opacity=".9"/><circle cx="36" cy="14" r="1.2" fill="#e0f4ff" ${KT}/><circle cx="31" cy="3.6" r="1.4" fill="#e0f4ff" ${KT}/>`;
      case 'tentacles': return [8, 14, 26, 32].map((tx, i) => `<path d="M${tx} 25c${i % 2 ? 2 : -2} 3 ${i % 2 ? -1 : 1} 5 ${i % 2 ? 2 : -2} 6" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="${tx + (i % 2 ? 2 : -2)}" cy="31" r=".7" fill="${c2}"/>`).join('');
      case 'tail': return `<path d="M29 24c4 0 6-2 7-5l1 3-2 .4c-1 2-3 3-6 3z" fill="${c}" ${K}/>`;
      case 'legs': return `<path d="M13 28v3h-2M27 28v3h2" stroke="#000" stroke-width="1.2" fill="none"/>`;
      case 'smoke': return `<circle cx="30" cy="8" r="2.4" fill="#d0d0d0" opacity=".8"/><circle cx="33" cy="4.6" r="1.8" fill="#e0e0e0" opacity=".7"/><circle cx="35.4" cy="2" r="1.2" fill="#f0f0f0" opacity=".6"/>`;
      case 'string': return `<path d="M20 7.6c0-3 2-5 6-6" stroke="#fffbe8" stroke-width=".9" fill="none"/>`;
      case 'leaves': return `<path d="M5 20c0-4 3-6 6-5-1 3-3 5-6 5zM35 20c0-4-3-6-6-5 1 3 3 5 6 5z" fill="#3ab03a" ${KT}/>`;
      case 'arms': return `<path d="M${x - b.w} 20c-3 1-4 3-4 5M${x + b.w} 20c3 1 4 3 4 5" stroke="#000" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="${x - b.w - 4}" cy="25.4" r="1.4" fill="${c}" ${KT}/><circle cx="${x + b.w + 4}" cy="25.4" r="1.4" fill="${c}" ${KT}/>`;
      case 'wheels': return `<circle cx="13" cy="29" r="2.6" fill="#222" ${KT}/><circle cx="27" cy="29" r="2.6" fill="#222" ${KT}/><circle cx="13" cy="29" r=".9" fill="#aaa"/><circle cx="27" cy="29" r=".9" fill="#aaa"/>`;
      case 'stars': return `<path d="M5 6l.6 1.6 1.6.2-1.2 1 .4 1.6L5 9.6l-1.4.8.4-1.6-1.2-1 1.6-.2zM35 5l.5 1.2 1.2.1-.9.8.3 1.2-1.1-.6-1.1.6.3-1.2-.9-.8 1.2-.1zM34 25l.5 1.2 1.2.1-.9.8.3 1.2-1.1-.6-1.1.6.3-1.2-.9-.8 1.2-.1z" fill="#ffe680"/>`;
      case 'flamebreath': return `<path d="M4 15c-2 1-3 3-3 5 2-1 3 0 4 1-1-2 0-4 2-5z" fill="#ff8a00" ${KT}/><circle cx="2.6" cy="17" r="1" fill="#ffd400"/>`;
      case 'pixwings': return [[-1, 0], [1, 0]].map(([sx]) => [0, 1, 2, 3].map(i => `<rect x="${20 + sx * (7 + i * 3) - (sx < 0 ? 3 : 0)}" y="${14 - i * 2.4}" width="3" height="${4 + i}" fill="${['#ffd400', '#ff8a00', '#ff4a1a', '#e10600'][i]}" ${KT}/>`).join('')).join('');
    }
    return '';
  }
  // the scenery behind each element's beasts (50x34)
  function scene(el, g) {
    const c = E[el] ? E[el].col : '#888';
    switch (el) {
      case 'zap': return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14143a"/><stop offset="1" stop-color="#3a3a1a"/></linearGradient></defs><rect width="50" height="34" fill="url(#${g})"/>${[6, 14, 22, 30].map(y => `<path d="M0 ${y}h50" stroke="#ffd400" stroke-width=".25" opacity=".35"/>`).join('')}<path d="M40 2l-4 7h3l-3 7" stroke="#ffd400" stroke-width="1" fill="none" opacity=".8"/><path d="M8 4l-3 5h2.4l-2.4 5" stroke="#ffe680" stroke-width=".7" fill="none" opacity=".6"/>`;
      case 'splash': return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8ecff"/><stop offset="1" stop-color="#2f80ee"/></linearGradient></defs><rect width="50" height="34" fill="url(#${g})"/><path d="M0 26c4-2 8-2 12 0s8 2 12 0 8-2 12 0 8 2 14 0v8H0z" fill="#1a5ac8" opacity=".55"/><circle cx="7" cy="9" r="1.4" fill="#fff" opacity=".6"/><circle cx="44" cy="14" r="1" fill="#fff" opacity=".6"/>`;
      case 'blaze': return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff4a1a"/></linearGradient></defs><rect width="50" height="34" fill="url(#${g})"/><path d="M0 34V27c2 0 3-4 5-4s2 3 4 3 2-5 5-5 2 4 4 4 3-3 5-3 2 4 5 4 2-5 5-5 3 4 5 4 2-3 4-3 2 3 4 3v10z" fill="#c82a00" opacity=".55"/>`;
      case 'clank': return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8ecf0"/><stop offset="1" stop-color="#8a949e"/></linearGradient></defs><rect width="50" height="34" fill="url(#${g})"/>${[10, 20, 30, 40].map(x => `<path d="M${x} 0v34" stroke="#6a747e" stroke-width=".3"/>`).join('')}${[11, 22].map(y => `<path d="M0 ${y}h50" stroke="#6a747e" stroke-width=".3"/>`).join('')}${[[3, 3], [47, 3], [3, 31], [47, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#5a646e"/>`).join('')}`;
      case 'sprout': return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad8ff"/><stop offset="1" stop-color="#e8f8ff"/></linearGradient></defs><rect width="50" height="34" fill="url(#${g})"/><path d="M0 26c8-5 16-5 25-1s17 4 25-1v10H0z" fill="#5ac03a"/><circle cx="8" cy="29" r="1" fill="#fff"/><circle cx="41" cy="28" r="1" fill="#ffd400"/><circle cx="44" cy="6" r="3" fill="#ffe24a" opacity=".9"/>`;
      case 'cosmic': return `<defs><radialGradient id="${g}" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#5a2a9a"/><stop offset="1" stop-color="#0a0420"/></radialGradient></defs><rect width="50" height="34" fill="url(#${g})"/>${[[4, 5], [12, 28], [44, 8], [38, 30], [26, 3], [47, 20], [6, 18]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.4 : 0.7}" fill="#fff"/>`).join('')}<circle cx="43" cy="26" r="4" fill="#ff8a5a" opacity=".8"/><ellipse cx="43" cy="26" rx="6.4" ry="1.4" fill="none" stroke="#ffd0a0" stroke-width=".5" opacity=".8"/>`;
    }
    return `<rect width="50" height="34" fill="${c}"/>`;
  }
  function beastInner(card) {
    const [bk, c, c2, ek, mk, tk, xk] = card.art, b = body(bk, c, c2);
    const behind = /^(wings|pixwings|wheel|tentacles)$/.test(xk);
    return `${behind ? extra(xk, b, c, c2) : ''}${b.s}${top(tk, b, c, c2)}${eyes(ek, b)}${mouth(mk, b)}${behind ? '' : extra(xk, b, c, c2)}`;
  }
  const beast = id => { const card = X.CARD[id]; return card ? S('0 0 40 32', beastInner(card), 'ex-beast') : ''; };

  // ================================================================ the card (60x84)
  const RCOL = ['#8a8a8a', '#1e9e3a', '#2463e0', '#9333d6', '#f08c00', '#e0007a'], RN = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'JACKPOT'];
  const wrap = (txt, n) => { const out = []; let line = ''; for (const w of String(txt).split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
  function holo(g, r, w, h, x, y) { // a moving rainbow sheen (SVG animation, so it shines wherever the card is shown)
    return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#ff8ad8" stop-opacity="${r >= 3 ? 0.5 : 0.35}"/><stop offset=".45" stop-color="#8ad8ff" stop-opacity="${r >= 3 ? 0.6 : 0.45}"/><stop offset=".55" stop-color="#d8ff8a" stop-opacity="${r >= 3 ? 0.5 : 0.35}"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><animateTransform attributeName="gradientTransform" type="translate" values="-1 -1;1 1;-1 -1" dur="${r >= 4 ? 3 : 4.5}s" repeatCount="indefinite"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${g})" style="mix-blend-mode:screen" pointer-events="none"/>`;
  }
  // attack (a sword badge) and hit points (a heart), big and readable
  const stats = (a, h, o) => { o = o || {}; return `<circle cx="9.6" cy="76.4" r="5" fill="${o.up ? '#5aff5a' : o.down ? '#ff9a9a' : '#d8dce4'}" stroke="#000" stroke-width=".6"/><path d="M6.6 79.4l5-5M7.2 78l1.2 1.2M10.4 73.6l1.2 1.2" stroke="#6a7480" stroke-width=".8"/><text x="9.6" y="78.8" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6.6" fill="#000" stroke="#fff" stroke-width=".35" paint-order="stroke">${a}</text><path d="M50.4 81.6c-3.8-3-5.8-4.8-5.8-7a2.8 2.8 0 0 1 5.8-1 2.8 2.8 0 0 1 5.8 1c0 2.2-2 4-5.8 7z" fill="${o.hurt ? '#ff8a00' : '#e10600'}" stroke="#000" stroke-width=".6"/><text x="50.4" y="78.4" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6" fill="#fff" stroke="#600" stroke-width=".3" paint-order="stroke">${h}</text>`; };
  const FRAMES = { 3: ['#5a1a9a', '#d8a0ff', '#9333d6', '#f0d8ff', '#5a1a9a'], 4: ['#a06000', '#ffe680', '#f0a000', '#fff6c0', '#a06000'] };
  function frameDefs(r, gj) {
    if (r < 3) return '';
    const cols = r === 5 ? RAINBOW : FRAMES[r];
    return `<defs><linearGradient id="${gj}" x1="0" y1="0" x2="1" y2="1">${cols.map((c, i) => `<stop offset="${(i / (cols.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}<animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="${r === 5 ? 6 : 9}s" repeatCount="indefinite"/></linearGradient></defs>`;
  }
  function cardSvg(card, o) {
    o = o || {};
    const r = card.r, el = E[card.el], gs = uid('s'), gh = uid('h'), gj = uid('j'), gc = uid('c');
    const frame = r >= 3 ? `url(#${gj})` : '#2a2a2a';
    const ab = card.ab ? X.AB[card.ab] : null, abt = ab ? wrap(ab[1], 34).slice(0, 3) : wrap(card.d, 34).slice(0, 3);
    const nameSz = card.name.length > 15 ? 4.3 : card.name.length > 11 ? 5 : 5.6;
    return S('0 0 60 84', `${frameDefs(r, gj)}<defs><linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(el.col, 0.75)}"/><stop offset="1" stop-color="${shade(el.col, 0.45)}"/></linearGradient></defs>
<rect x=".6" y=".6" width="58.8" height="82.8" rx="4" fill="${frame}" stroke="#000" stroke-width=".8"/><rect x="3" y="3" width="54" height="78" rx="2.4" fill="url(#${gc})"/>
<rect x="3" y="3" width="54" height="10" rx="2" fill="${el.dk}"/><text x="${card.cost > 9 ? 15 : 13.6}" y="10.2" font-family="Arial,sans-serif" font-weight="bold" font-size="${nameSz}" fill="#fff">${xml(card.name)}</text>
<circle cx="7.6" cy="8" r="4.4" fill="#ffd400" stroke="#000" stroke-width=".6"/><text x="7.6" y="10.2" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6.2" fill="#000">${card.cost}</text>
<g transform="translate(5 14.6)"><rect width="50" height="34" fill="#000"/>${scene(card.el, gs)}<g transform="translate(5 1.4)">${beastInner(card)}</g>${r >= 2 ? holo(gh, r, 50, 34, 0, 0) : ''}<rect width="50" height="34" fill="none" stroke="#000" stroke-width=".7"/></g>
${elIcon(card.el, 47.4, 50.2, 0.9)}<text x="5.6" y="55.4" font-family="Arial,sans-serif" font-weight="bold" font-size="4.4" fill="#000">${ab ? xml(ab[0].toUpperCase()) : xml(el.n.toUpperCase() + ' BEASTIE')}</text>
${abt.map((t, i) => `<text x="5.6" y="${60.4 + i * 3.6}" font-family="Arial,sans-serif" font-size="2.9" fill="#222">${xml(t)}</text>`).join('')}
<path d="M3 70.4h54" stroke="#000" stroke-width=".4" opacity=".5"/>
${stats(o.atk != null ? o.atk : card.atk, o.hp != null ? o.hp : card.hp, o)}
<text x="30" y="75.4" text-anchor="middle" font-family="Arial" font-size="2.6" fill="#333">BYTE BEASTIES</text><text x="30" y="79.2" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="2.9" fill="${RCOL[r]}">#${String(card.no).padStart(2, '0')}/${X.CARDS.length} ${RN[r]}</text>
${r >= 3 ? `<path d="M52 18l.7 1.8 1.8.2-1.4 1.2.4 1.8-1.5-1-1.5 1 .4-1.8-1.4-1.2 1.8-.2z" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/></path>` : ''}`, 'ex-card ex-r' + r + (o.cls ? ' ' + o.cls : ''));
  }
  const card = (id, o) => { const c = X.CARD[id]; return c ? cardSvg(c, o) : ''; };

  // the Card Clash face of a Series One card (gadgets get their rules printed on), drawn with JackLoot's own little icons
  function battleOne(id, o) {
    o = o || {};
    const it = window.LootCat && LootCat.ITEM[id], d = X.BATTLE[id]; if (!it || !d) return '';
    const LA = window.LootArt, [no, pic, col] = it.art, r = it.r, gh = uid('h'), gj = uid('j');
    const isB = d.kind === 'b', el = isB ? E[d.el] : null;
    const txt = isB ? (X.AB[d.ab] ? X.AB[d.ab][1] : '') : d.txt.replace(/^[A-Z' !:]+: /, '');
    const head = isB ? (X.AB[d.ab] ? X.AB[d.ab][0].toUpperCase() : '') : (d.txt.match(/^([A-Z' !:]+): /) || [, 'GADGET'])[1].replace(/:$/, '');
    const lines = wrap(txt, 34).slice(0, 4);
    const frame = r >= 3 ? `url(#${gj})` : '#2a2a2a';
    return S('0 0 60 84', `${frameDefs(r, gj)}${LA ? LA.ICON_DEFS : ''}<rect x=".6" y=".6" width="58.8" height="82.8" rx="4" fill="${frame}" stroke="#000" stroke-width=".8"/><rect x="3" y="3" width="54" height="78" rx="2.4" fill="${isB ? shade(el.col, 0.7) : '#e8e4d8'}"/>
<rect x="3" y="3" width="54" height="10" rx="2" fill="${isB ? el.dk : '#3a3a5a'}"/><text x="13.6" y="10.2" font-family="Arial,sans-serif" font-weight="bold" font-size="${it.name.length > 15 ? 4.2 : 5}" fill="#fff">${xml(it.name)}</text>
<circle cx="7.6" cy="8" r="4.4" fill="#ffd400" stroke="#000" stroke-width=".6"/><text x="7.6" y="10.2" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6.2" fill="#000">${d.cost}</text>
<g transform="translate(5 14.6)"><rect width="50" height="34" fill="#fff" stroke="#000" stroke-width=".7"/><g transform="translate(9 1) scale(1)">${LA ? LA.icon(pic, col) : ''}</g>${r >= 2 ? holo(gh, r, 50, 34, 0, 0) : ''}</g>
${isB ? elIcon(d.el, 47.4, 50.2, 0.9) : `<rect x="44.6" y="50" width="10" height="4.4" rx="1" fill="#3a3a5a"/><text x="49.6" y="53.4" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="2.8" fill="#fff">GADGET</text>`}
<text x="5.6" y="55.4" font-family="Arial,sans-serif" font-weight="bold" font-size="4" fill="#000">${xml(head.slice(0, 22))}</text>${lines.map((t, i) => `<text x="5.6" y="${60.4 + i * 3.6}" font-family="Arial,sans-serif" font-size="2.9" fill="#222">${xml(t)}</text>`).join('')}
${isB ? stats(o.atk != null ? o.atk : d.atk, o.hp != null ? o.hp : d.hp, o) : ''}
<text x="30" y="79.4" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="3" fill="${RCOL[r]}">SERIES ONE #${String(no).padStart(2, '0')} ${RN[r]}</text>`, 'ex-card ex-r' + r);
  }
  const battle = (id, o) => (X.CARD[id] ? card(id, o) : battleOne(id, o)); // o: { atk, hp, up, down, hurt } to show live numbers

  // ================================================================ our other things: the Mega Masters cups; a booster wrapper
  const CUP = c => `<path d="M9 5h14v7c0 5-3 8-7 8s-7-3-7-8z" fill="${c}" stroke="#000" stroke-width=".8"/><path d="M9 7H5c0 5 2 7 5 7.4M23 7h4c0 5-2 7-5 7.4" fill="none" stroke="#000" stroke-width="1.4"/><path d="M9 7H5c0 5 2 7 5 7.4M23 7h4c0 5-2 7-5 7.4" fill="none" stroke="${c}" stroke-width=".7"/><rect x="14" y="19" width="4" height="5" fill="${shade(c, -0.25)}" stroke="#000" stroke-width=".6"/><rect x="9" y="24" width="14" height="5" fill="#4a2a0a" stroke="#000" stroke-width=".8"/><rect x="11" y="25.4" width="10" height="2" fill="${c}"/><path d="M12 7c0 3 .6 5 2 6.4" stroke="#fff" stroke-width="1.1" fill="none" opacity=".75"/><text x="16" y="13.6" text-anchor="middle" font-family="Arial Black,Arial" font-size="4.2" fill="${shade(c, -0.5)}">MM</text>`;
  const PICS = { 'trinket.ex_cupg': () => S('0 0 32 32', CUP('#ffd400')), 'trinket.ex_cups': () => S('0 0 32 32', CUP('#d8dce4')), 'trinket.ex_cupb': () => S('0 0 32 32', CUP('#c87a3a')) };
  const pic = id => (X.CARD[id] ? card(id) : PICS[id] ? PICS[id]() : '');
  function pack(o) { // a foil booster packet
    o = o || {}; const g = uid('p'), g2 = uid('q');
    return S('0 0 60 90', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0a6a"/><stop offset=".5" stop-color="#8a1ad8"/><stop offset="1" stop-color="#1a0a4a"/></linearGradient><linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/><animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1.2 0;-1 0" dur="3s" repeatCount="indefinite"/></linearGradient></defs>
<path d="M4 6l3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3v80l-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3z" fill="url(#${g})" stroke="#000" stroke-width=".8"/>
<rect x="4" y="10" width="52" height="7" fill="#ffd400"/><text x="30" y="15.6" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="5.4" fill="#2a0a6a">JACKCARDS</text>
<g transform="translate(10 22) scale(1)">${beastInner(X.CARD[o.face || 'card.x2_voltbat'] || X.CARDS[0])}</g>
<text x="30" y="62" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="8.4" fill="#fff" stroke="#000" stroke-width=".5">BYTE</text><text x="30" y="70.6" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="8.4" fill="#fff" stroke="#000" stroke-width=".5">BEASTIES</text>
<rect x="8" y="74" width="44" height="7" rx="1" fill="#e10600"/><text x="30" y="78.8" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="3.6" fill="#fff">5 CARDS! 1 RARE OR BETTER!</text>
<rect x="4" y="3" width="52" height="84" fill="url(#${g2})" pointer-events="none"/>`, 'ex-pack');
  }

  window.ExArt = { card, beast, battle, pic, pack, elIcon: (el, s) => S('0 0 8 8', (EICON[el] || EICON.cosmic)(E[el] ? E[el].col : '#fff'), 'ex-el'), scene, RCOL, RN, shade };

  // ---------------------------------------------------------------- JackLoot: our things in its catalogue + its drawings
  // (the catalogue loads lazily; we add to it the moment it arrives, before JackLoot's drawings have even been fetched)
  const A = window.Apps;
  if (A && A.load) A.load('js/loot-cat.js').then(() => { X.augment(window.LootCat, window.GrindCat); }).catch(() => {});
  if (A && A.load) A.load('js/grind-cat.js').then(() => { X.augment(null, window.GrindCat); }).catch(() => {});
  function hook() {
    const LA = window.LootArt; if (!LA || LA._ex) return;
    LA._ex = 1;
    const pic0 = LA.pic, card0 = LA.card;
    LA.pic = id => (X.CARD[id] || PICS[id] ? pic(id) : pic0(id));
    LA.card = id => (X.CARD[id] ? card(id) : card0(id));
  }
  if (window.Loot && Loot.ready) Loot.ready.then(hook);
  else document.addEventListener('DOMContentLoaded', () => { if (window.Loot && Loot.ready) Loot.ready.then(hook); });
})();

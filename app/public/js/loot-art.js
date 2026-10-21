/* loot-art: the drawings for every JackLoot item (see js/loot-cat.js). Hand-made SVG (and a little canvas for the taskbar
 * pets), drawn from each item's "art" parameters. Loaded at start-up by js/loot.js. window.LootArt:
 *   pic(id) -> square SVG preview (32x32 viewBox) of any item      hat(id) / face(id) / badge(id) -> SVG to wear (Hangout etc.)
 *   card(id) -> a JackCard (60x84)   btn(id) -> an 88x31 button     cursor(id) -> CSS cursor value     cols(id) -> [title1, title2, face]
 *   wall(id) -> { img, mode, col }   nameStyle(id) -> CSS for a name  amp(id) -> CSS variables      flower(id) -> CSS filter
 *   pet(id) -> { speed, says, draw(g, f, st, p) } for the taskbar */
(function () {
  'use strict';
  if (window.LootArt) return;
  const C = window.LootCat; if (!C) return;
  const IT = C.ITEM;
  const S = (vb, inner, cls) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${cls ? ` class="${cls}"` : ''} aria-hidden="true">${inner}</svg>`;
  const k = '#000', sw = (w) => `stroke="${k}" stroke-width="${w || 0.8}"`;
  let gid = 0; const uid = p => p + (++gid);
  const RAINBOW = ['#e10600', '#ff8a00', '#ffd400', '#2a9a2a', '#0060d0', '#8a1ad8'];
  const rgrad = (id, dir) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${dir === 'v' ? 0 : 1}" y2="${dir === 'v' ? 1 : 0}">${RAINBOW.map((c, i) => `<stop offset="${(i / 5).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
  const star = (cx, cy, r, fill, extra) => { let d = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2); } return `<path d="${d}z" fill="${fill}" ${extra || ''}/>`; };

  // ================================================================ hats (24x16: they sit ON the head)
  const HATS = {
    chef: `<path d="M6 15V10.4C3.4 9.8 2.6 7.2 4 5.4c1-1.4 3-1.7 4-1 .8-2.2 3.2-3 4.8-2.2 1.8-1.2 4.4-.4 5 1.6 1.8-.6 3.8.6 3.6 2.8-.2 1.6-1.4 2.4-3.4 2.8V15z" fill="#fff" ${sw()}/><path d="M6 12.6h12" stroke="#bbb"/><path d="M9 6.5c.5 1 .5 2 0 3M14 5.5c.6 1 .6 2.4 0 3.6" stroke="#ddd" fill="none"/>`,
    fez: `<path d="M7.5 15l1.4-11h6.2l1.4 11z" fill="#c8102e" ${sw()}/><path d="M8.9 4h6.2" stroke="#7a0010" stroke-width="1.2"/><path d="M12 4c2 1 3 3 3.5 7" stroke="#111" stroke-width=".8" fill="none"/><circle cx="15.6" cy="11.6" r="1.2" fill="#ffd400" ${sw(0.4)}/>`,
    mortar: `<path d="M6 8v6c2 1.5 10 1.5 12 0V8l-6 2.4z" fill="#222" ${sw()}/><path d="M2 6l10-4 10 4-10 4z" fill="#111" ${sw()}/><path d="M12 6l7 1.6v5" stroke="#ffd400" stroke-width=".8" fill="none"/><circle cx="19" cy="13" r="1.1" fill="#ffd400"/><circle cx="12" cy="6" r=".9" fill="#ffd400"/>`,
    viking: `<path d="M5 9C2 8 1 5 1.5 1.5 3 4 4.5 5.5 6.5 6.5z" fill="#fff6e0" ${sw(0.7)}/><path d="M19 9c3-1 4-4 3.5-7.5C21 4 19.5 5.5 17.5 6.5z" fill="#fff6e0" ${sw(0.7)}/><path d="M4 15c0-6 3.5-9 8-9s8 3 8 9z" fill="#a8a8b2" ${sw()}/><path d="M12 6v9" stroke="#6a6a72"/><path d="M4.2 12.8h15.6" stroke="#6a4a2a" stroke-width="1.8"/><circle cx="8" cy="12.8" r=".7" fill="#ffd400"/><circle cx="16" cy="12.8" r=".7" fill="#ffd400"/><path d="M7 9c1-1.4 2.4-2 4-2.2" stroke="#e8e8f0" fill="none"/>`,
    propeller: `<path d="M5 15c0-5.5 3-8 7-8s7 2.5 7 8z" fill="#e10600" ${sw()}/><path d="M5 15c0-5.5 3-8 7-8-2.6 1.6-4 4.6-4 8z" fill="#0028c8"/><path d="M12 7c1.8 2 2.6 5 2.6 8H19c0-5.5-3-8-7-8z" fill="#ffd400"/><path d="M5 15c0-5.5 3-8 7-8s7 2.5 7 8z" fill="none" ${sw()}/><path d="M3.4 14.6h17.2" stroke="#000" stroke-width="1.2"/><rect x="11.4" y="3.6" width="1.2" height="3.6" fill="#555"/><g class="lx-spin"><ellipse cx="8.2" cy="3.4" rx="3.8" ry="1" fill="#2a9a2a" ${sw(0.5)}/><ellipse cx="15.8" cy="3.4" rx="3.8" ry="1" fill="#2a9a2a" ${sw(0.5)}/></g><circle cx="12" cy="3.4" r=".9" fill="#ffd400" ${sw(0.4)}/>`,
    cowboy: `<path d="M7 11.4c0-5 1.6-8.4 5-8.4s5 3.4 5 8.4z" fill="#a0642a" ${sw()}/><path d="M10 3.4c1 .8 3 .8 4 0" stroke="#6a3a10" fill="none"/><path d="M1 11.6c2 3.6 20 3.6 22 0-3 .9-19 .9-22 0z" fill="#b8743a" ${sw()}/><path d="M7.1 10.4h9.8" stroke="#3a1a00" stroke-width="1.6"/><circle cx="12" cy="10.4" r=".8" fill="#ffd400"/>`,
    jester: `<path d="M4 15l-3-11 7 5 4-8 4 8 7-5-3 11z" fill="#8a1ad8" ${sw()}/><path d="M12 1l4 8 7-5-3 11h-8z" fill="#ffd400" ${sw()}/><rect x="4" y="12.4" width="16" height="2.8" fill="#e10600" ${sw(0.6)}/><circle cx="1.4" cy="3.6" r="1.4" fill="#ffd400" ${sw(0.5)}/><circle cx="12" cy="1.3" r="1.4" fill="#fff" ${sw(0.5)}/><circle cx="22.6" cy="3.6" r="1.4" fill="#ffd400" ${sw(0.5)}/>`,
    pirate: `<path d="M1 13c3-6 6-9 11-9s8 3 11 9c-3-1-6 1-11 1S4 12 1 13z" fill="#1a1a1a" ${sw()}/><path d="M2 12.4c3-.8 6 1 10 1s7-1.8 10-1" stroke="#ffd400" stroke-width=".8" fill="none"/><circle cx="12" cy="8.2" r="2.1" fill="#fff"/><path d="M10.4 11l3.2-1.6M10.4 9.4l3.2 1.6" stroke="#fff" stroke-width=".8"/><circle cx="11.3" cy="8" r=".5"/><circle cx="12.7" cy="8" r=".5"/>`,
    bubble: `<path d="M3 16C3 7 7 1.4 12 1.4S21 7 21 16" fill="#bfe6ff" fill-opacity=".45" stroke="#6ab0e0" stroke-width="1.1"/><path d="M6.6 7c1.4-2.4 3-3.2 4.8-3.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="2.2" y="13.6" width="19.6" height="2.4" rx="1.1" fill="#d8d8e0" stroke="#555" stroke-width=".6"/><circle cx="5" cy="14.8" r=".6" fill="#e10600"/><circle cx="19" cy="14.8" r=".6" fill="#0a0"/><rect x="11.4" y="0" width="1.2" height="1.8" fill="#888"/><circle cx="12" cy="0.6" r=".9" fill="#e10600"/>`,
    halo: `<ellipse cx="12" cy="6.4" rx="8.2" ry="2.8" fill="none" stroke="#c99a00" stroke-width="2.6"/><ellipse cx="12" cy="6.4" rx="8.2" ry="2.8" fill="none" stroke="#ffe24a" stroke-width="1.6"/><ellipse cx="9" cy="4.4" rx="2" ry=".5" fill="#fff" opacity=".9"/>`,
    grandwiz: `<path d="M13 0L18.6 13.2H5.4z" fill="#1a2a8a" ${sw()}/><path d="M13 0c-1 3-3 4-5.2 6" stroke="#3a4aba" fill="none"/><path d="M1.5 12.6h21v2.8h-21z" fill="#1a2a8a" stroke="#ffd400" stroke-width=".9"/>${star(12, 7.2, 1.8, '#ffd400')}${star(15, 10.6, 1.1, '#fff6a0')}${star(10, 11, 0.9, '#fff')}<path d="M14.6 3.6a1.6 1.6 0 1 0 1 2.8 1.2 1.2 0 1 1-1-2.8z" fill="#ffd400"/>`,
    jackpotcrown: `<path d="M3 15V5l4.5 4L12 2l4.5 7L21 5v10z" fill="#ffd400" stroke="#8a6000" stroke-width=".8"/><rect x="3" y="12" width="18" height="3" fill="#ffe680" stroke="#8a6000" stroke-width=".6"/>${RAINBOW.map((c, i) => `<circle cx="${4.8 + i * 2.88}" cy="13.5" r="1.1" fill="${c}" stroke="#fff" stroke-width=".3"/>`).join('')}<path d="M12 4.2l1.6 2.2L12 8.6l-1.6-2.2z" fill="#fff" stroke="#9fe0ff" stroke-width=".4"/><circle cx="3" cy="5" r="1" fill="#e10600"/><circle cx="21" cy="5" r="1" fill="#0060d0"/><circle cx="12" cy="2" r="1.1" fill="#8a1ad8"/>`,
    witch: `<path d="M12 0c1 4 3 8 6 12.4H6C8 9 10 5 9 2c1 .2 2-.6 3-2z" fill="#4a1a6a" ${sw()}/><path d="M0.5 13c2-1.4 21-1.4 23 0-1 1.6-22 1.6-23 0z" fill="#4a1a6a" ${sw()}/><path d="M6.4 11.4h11.2" stroke="#ff7a00" stroke-width="1.8"/><rect x="10.6" y="10.3" width="2.8" height="2.2" fill="none" stroke="#ffd400" stroke-width=".7"/><circle cx="11" cy="5" r=".5" fill="#ffd84a"/><circle cx="13.6" cy="8" r=".4" fill="#ffd84a"/>`,
    pumpkin: `<path d="M11.4 6.4c0-2 .6-3.4 2-4" stroke="#2a6a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M3 16c-1-5 1.5-10 9-10s10 5 9 10z" fill="#ff7a00" stroke="#7a3a00" stroke-width=".8"/><path d="M8 6.8c-1 3-1 6 0 9.2M16 6.8c1 3 1 6 0 9.2M12 6v10" stroke="#c85a00" stroke-width=".7" fill="none"/><path d="M6.6 12.6l2-2.4 2 2.4zM13.4 12.6l2-2.4 2 2.4z" fill="#ffe600" stroke="#7a3a00" stroke-width=".4"/>`,
    bonfire: `<path d="M5 15c0-6 3-9 7-9s7 3 7 9z" fill="#ff6a00" ${sw()}/><path d="M7.5 9h9M6.2 11.6h11.6" stroke="#5a1a8a" stroke-width="1.3"/><rect x="4" y="12.6" width="16" height="2.8" fill="#5a1a8a" ${sw(0.8)}/><circle cx="12" cy="4.4" r="2.6" fill="#ffd400" ${sw()}/><path d="M12 1.2v1.6M9.4 2.4l1 1M14.6 2.4l-1 1" stroke="#ff3ad0" stroke-width=".8"/>`,
    santa: `<path d="M3 14.5C4 8 8 4 13 4c3 0 6 2 7 4.5-1.8-.8-3.4-.6-4.4.4 1.6 1.6 2.4 3.6 2.4 5.6z" fill="#d00" ${sw()}/><rect x="2" y="12.4" width="18" height="3.2" rx="1.4" fill="#fff" stroke="#aaa" stroke-width=".6"/><circle cx="20.6" cy="9.4" r="2.1" fill="#fff" stroke="#aaa" stroke-width=".6"/>`,
    antlers: `<path d="M8 15C7 11 5 9 3 8M5 9.6L4 6M3 8L1 7M16 15c1-4 3-6 5-7M19 9.6L20 6M21 8l2-1" stroke="#7a4a1a" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M6 14.4c2-1.2 10-1.2 12 0" stroke="#e10600" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="13.3" r="1" fill="#ffd400"/>`,
    partymill: `<path d="M12 .8l6.6 14.4H5.4z" fill="#ffd400" stroke="#8a6000" stroke-width=".8"/><path d="M8.6 8.2h6.8M7.2 11.4h9.6" stroke="#fff6a0" stroke-width=".7"/><text x="12" y="13.8" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="4" fill="#c00">2000</text><circle cx="12" cy="1" r="1.5" fill="#e10600"/><path d="M4 3l.6 1.2L6 4.6l-1.2.6L4 6.6l-.6-1.4L2 4.6l1.4-.4zM20 3.6l.5 1 1 .4-1 .4-.5 1-.5-1-1-.4 1-.4z" fill="#ffd400"/>`,
  };
  // ================================================================ face things (24x12: eyes to mouth)
  const FACES = {
    nerd: `<rect x="2.4" y="1.6" width="8" height="5.4" rx="1" fill="#e8f4ff" fill-opacity=".45" stroke="#111" stroke-width="1.5"/><rect x="13.6" y="1.6" width="8" height="5.4" rx="1" fill="#e8f4ff" fill-opacity=".45" stroke="#111" stroke-width="1.5"/><path d="M10.4 3.4h3.2" stroke="#111" stroke-width="1.4"/><rect x="10.7" y="2.3" width="2.6" height="2.2" fill="#fff" stroke="#c8a080" stroke-width=".4"/>`,
    star: star(6.6, 4.4, 4, '#ff3a9a', 'stroke="#000" stroke-width=".6"') + star(17.4, 4.4, 4, '#ff3a9a', 'stroke="#000" stroke-width=".6"') + `<path d="M10 4h4" stroke="#000" stroke-width="1"/><circle cx="5.6" cy="3.4" r=".7" fill="#fff"/><circle cx="16.4" cy="3.4" r=".7" fill="#fff"/>`,
    visor: `<rect x="1" y="2.2" width="22" height="4.4" rx="2" fill="#e10600" fill-opacity=".85" stroke="#300" stroke-width=".8"/><path d="M2.4 4.4h19.2" stroke="#ffb0b0" stroke-width=".7"/><circle cx="20.6" cy="3.4" r=".6" fill="#fff"/>`,
    goldmono: `<circle cx="16.4" cy="4.4" r="3.6" fill="#fff8d0" fill-opacity=".45" stroke="#ffd400" stroke-width="1.4"/><circle cx="16.4" cy="4.4" r="3.6" fill="none" stroke="#8a6000" stroke-width=".4"/><path d="M19.4 6.6c1.4 2 1.4 3.6 0 5.2" stroke="#ffd400" stroke-width=".8" fill="none" stroke-dasharray="1 .6"/><circle cx="15" cy="3" r=".8" fill="#fff"/>`,
    eclipse: `<rect x="1" y="1.2" width="22" height="6.2" fill="#fff" stroke="#000" stroke-width=".6"/><rect x="1" y="1.2" width="22" height="1.4" fill="#0060d0"/><rect x="2.6" y="2.8" width="7.6" height="3.8" rx="1.6" fill="#111"/><rect x="13.8" y="2.8" width="7.6" height="3.8" rx="1.6" fill="#111"/><text x="12" y="6.4" text-anchor="middle" font-size="2.6" font-family="Arial" font-weight="bold" fill="#c00">99</text>`,
    mask: `<path d="M1 3c3-2 7-2 10 1 0 .6 2 .6 2 0 3-3 7-3 10-1 0 3-2 5-5 5-2 0-3.6-1-5-2.4C11.6 7 10 8 8 8 4 8 1.6 6 1 3z" fill="#8a1ad8" stroke="#000" stroke-width=".7"/><ellipse cx="6.6" cy="4.6" rx="2.2" ry="1.3" fill="#000"/><ellipse cx="17.4" cy="4.6" rx="2.2" ry="1.3" fill="#000"/><path d="M22 3c1-2 1.6-3 1.4-3.6M21.4 3.6c1.4-1 2.4-1.4 2.6-1.2" stroke="#ff3a9a" stroke-width="1.2" fill="none"/><circle cx="2.6" cy="3" r=".5" fill="#ffd400"/><circle cx="21.4" cy="3" r=".5" fill="#ffd400"/>`,
    beard: `<path d="M3 4c0 5 4 8 9 8s9-3 9-8c-2 2-4 2-6 1-1 .8-5 .8-6 0-2 1-4 1-6-1z" fill="#fff" stroke="#bbb" stroke-width=".6"/><path d="M7 6.4c2 1 8 1 10 0" stroke="#ddd" fill="none"/><path d="M8 3.6c1.4-1 2.6-1 4 0 1.4-1 2.6-1 4 0-1.2 1.2-2.6 1.2-4 .6-1.4.6-2.8.6-4-.6z" fill="#fff" stroke="#bbb" stroke-width=".5"/>`,
  };
  // ================================================================ badges (16x16)
  const BSYM = {
    star: (f) => star(8, 8.4, 5, f, 'stroke="#000" stroke-width=".4"'),
    heart: f => `<path d="M8 13.4C3 10 2.4 7 3.4 5.2 4.6 3.4 7 3.6 8 5.6c1-2 3.4-2.2 4.6-.4 1 1.8.4 4.8-4.6 8.2z" fill="${f}" stroke="#000" stroke-width=".4"/>`,
    smile: f => `<circle cx="5.8" cy="6.4" r="1.1" fill="${f}"/><circle cx="10.2" cy="6.4" r="1.1" fill="${f}"/><path d="M4.4 9.4c1.6 2.6 5.6 2.6 7.2 0" stroke="${f}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
    bolt: f => `<path d="M9.4 2L4.6 9h3l-1.2 5 5-7.4H8.4z" fill="${f}" stroke="#000" stroke-width=".4"/>`,
    eclipse: f => `<circle cx="8" cy="8" r="4.6" fill="${f}" opacity=".9"/><circle cx="8" cy="8" r="3.8" fill="#000"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="${f}" stroke-width=".7"/>`,
    pumpkin: f => `<path d="M7.6 4.4c0-1.4.6-2 1.6-2.4" stroke="#2a6a1a" stroke-width="1.2" fill="none"/><path d="M5.6 6.4l1.4 1.6H4.2zM10.4 6.4L11.8 8H9zM5 10.4c1.6 1.2 4.4 1.2 6 0l-1 1.4-1-.8-1 .8-1-.8-1 .8z" fill="${f}"/>`,
    firework: f => `<path d="M8 2v3.4M8 10.6V14M2 8h3.4M10.6 8H14M3.8 3.8l2.4 2.4M9.8 9.8l2.4 2.4M3.8 12.2l2.4-2.4M9.8 6.2l2.4-2.4" stroke="${f}" stroke-width="1.1" stroke-linecap="round"/><circle cx="8" cy="8" r="1.2" fill="#ffd400"/>`,
    snow: f => `<path d="M8 2.4v11.2M3.2 5.2l9.6 5.6M3.2 10.8l9.6-5.6" stroke="${f}" stroke-width="1.1" stroke-linecap="round"/><path d="M6.6 3.2L8 4.4l1.4-1.2M6.6 12.8L8 11.6l1.4 1.2" stroke="${f}" stroke-width=".8" fill="none"/>`,
    open: f => `<path d="M2.6 9.6h10.8" stroke="${f}" stroke-width="1.4"/><path d="M5 6.6c1-2 5-2 6 0" stroke="#fff" stroke-width="1.1" fill="none"/><text x="8" y="13.6" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="3.6" fill="${f}">OPEN!</text><path d="M7.4 9.6l-1.6 3.2M8.6 9.6l1.6 3.2" stroke="#fff" stroke-width=".7"/>`,
    rosette: f => `<path d="M5.6 10l-1.6 5.4 2.2-1 1 1.4.8-5zM10.4 10l1.6 5.4-2.2-1-1 1.4-.8-5z" fill="#e10600" stroke="#000" stroke-width=".3"/><circle cx="8" cy="7" r="4.6" fill="${f}" stroke="#000" stroke-width=".4" stroke-dasharray="1 .5"/><circle cx="8" cy="7" r="2.6" fill="#ffd400"/>`,
    swap: f => `<path d="M3 5.6h8.4l-2-2M13 10.4H4.6l2 2" stroke="${f}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    crown: f => `<path d="M3 12V6l2.6 2.4L8 4l2.4 4.4L13 6v6z" fill="${f}" stroke="#000" stroke-width=".4"/><circle cx="8" cy="10.2" r="1" fill="#e10600"/>`,
    rainbow: () => RAINBOW.map((c, i) => `<path d="M${2.4 + i * 0.8} 12a${5.6 - i * 0.8} ${5.6 - i * 0.8} 0 0 1 ${11.2 - i * 1.6} 0" stroke="${c}" stroke-width=".85" fill="none"/>`).join(''),
    jackpot: () => star(8, 8.2, 5.4, 'url(#JPG)', 'stroke="#fff" stroke-width=".5"') + '<circle cx="8" cy="8.2" r="1.4" fill="#fff"/>',
  };
  const badgeInner = id => {
    const it = IT[id]; if (!it) return ''; const [bg, fg, sym] = it.art;
    const text = !BSYM[sym];
    const ring = it.r >= 4 ? '#ffd400' : '#000';
    const defs = sym === 'jackpot' ? rgrad('JPG', 'v').replace('JPG', 'JPG') : '';
    return `${defs}<circle cx="8" cy="8" r="7.2" fill="${sym === 'jackpot' ? '#111' : bg}" stroke="${ring}" stroke-width="${it.r >= 4 ? 1.2 : 0.8}"/>${text ? `<text x="8" y="${sym.length > 3 ? 10 : 10.6}" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="${sym.length > 3 ? 4.4 : 5.6}" fill="${fg}">${sym}</text>` : BSYM[sym](fg)}`;
  };

  // ================================================================ a little icon library (32x32) for JackCards and trinkets
  const ICON = {
    floppy: c => `<rect x="5" y="5" width="22" height="22" fill="${c}" ${sw()}/><rect x="10" y="5" width="12" height="8" fill="#c8c8d0" ${sw(0.6)}/><rect x="17" y="6.4" width="3" height="5" fill="${c}"/><rect x="8" y="16" width="16" height="10" fill="#fff" ${sw(0.6)}/><path d="M10 19h12M10 22h9" stroke="#88a"/>`,
    modem: c => `<path d="M3 17l4-6h18l4 6v6H3z" fill="${c}" ${sw()}/><path d="M3 17h26" stroke="#000"/>${[7, 10, 13, 16].map((x, i) => `<rect x="${x}" y="19" width="2" height="2" fill="${['#f33', '#3f3', '#3f3', '#ff3'][i]}"/>`).join('')}<path d="M24 11c1-3 3-5 6-6M22 11c.6-2 1.6-3 3-4" stroke="#000" fill="none"/>`,
    cd: c => `<circle cx="16" cy="16" r="12" fill="${c}" ${sw()}/><circle cx="16" cy="16" r="12" fill="url(#lxcd)" opacity=".6"/><circle cx="16" cy="16" r="3.4" fill="#fff" ${sw(0.6)}/><path d="M8 10c2-2.6 5-3.6 8-3.6" stroke="#fff" stroke-width="1.5" fill="none"/>`,
    cube: c => `<path d="M16 4l11 6v12l-11 6-11-6V10z" fill="#111" ${sw()}/><path d="M16 4l11 6-11 6-11-6z" fill="${c === '#ffd400' ? '#ffe680' : '#fff'}"/><path d="M5 10l11 6v12L5 22z" fill="${c}"/><path d="M27 10l-11 6v12l11-6z" fill="${c === '#ffd400' ? '#c99a00' : '#0028c8'}"/><path d="M8.7 8l11 6M12.3 6l11 6M5 14l11 6M5 18l11 6M9 12v12M12.6 14v12M19.6 14v12M23.3 12v12M16 4L5 10" stroke="#111" stroke-width=".7" fill="none"/>`,
    blocks: c => `<rect x="4" y="18" width="8" height="8" fill="${c}" ${sw()}/><rect x="12" y="18" width="8" height="8" fill="${c}" ${sw()}/><rect x="12" y="10" width="8" height="8" fill="${c}" ${sw()}/><rect x="20" y="18" width="8" height="8" fill="#e10600" ${sw()}/><rect x="20" y="2" width="4" height="16" fill="#00c8e0" ${sw()}/>`,
    yoyo: c => `<path d="M16 2v8" stroke="#000"/><circle cx="16" cy="19" r="10" fill="${c}" ${sw()}/><circle cx="16" cy="19" r="6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/><circle cx="16" cy="19" r="2" fill="#fff" ${sw(0.6)}/>`,
    pager: c => `<rect x="5" y="9" width="22" height="15" rx="2" fill="${c}" ${sw()}/><rect x="8" y="12" width="16" height="6" fill="#a8d088" ${sw(0.6)}/><text x="16" y="16.8" text-anchor="middle" font-family="Courier New,monospace" font-size="4.4" fill="#000">CALL MOM</text><rect x="12" y="20" width="8" height="2" fill="#222"/>`,
    mobile: c => `<rect x="10" y="3" width="12" height="26" rx="3" fill="${c}" ${sw()}/><rect x="12" y="6" width="8" height="7" fill="#a8d088" ${sw(0.5)}/><path d="M13 10h2v-2h2v2h2" stroke="#000" stroke-width=".7" fill="none"/>${[0, 1, 2].map(r => [0, 1, 2].map(cc => `<rect x="${12.4 + cc * 2.6}" y="${16 + r * 3}" width="1.8" height="1.8" fill="#ddd"/>`).join('')).join('')}<rect x="14" y="1" width="1.6" height="3" fill="#333"/>`,
    vhs: c => `<rect x="3" y="8" width="26" height="16" fill="${c}" ${sw()}/><rect x="7" y="11" width="18" height="7" fill="#fff" ${sw(0.6)}/><circle cx="11" cy="14.5" r="2.4" fill="#333"/><circle cx="21" cy="14.5" r="2.4" fill="#333"/><text x="16" y="22.6" text-anchor="middle" font-family="Arial" font-size="3.4" fill="#fff">BE KIND REWIND</text>`,
    walkman: c => `<rect x="7" y="5" width="18" height="24" rx="2" fill="${c}" ${sw()}/><rect x="10" y="8" width="12" height="9" fill="#333" ${sw(0.6)}/><circle cx="13" cy="12.5" r="1.8" fill="#888"/><circle cx="19" cy="12.5" r="1.8" fill="#888"/><rect x="10" y="20" width="3" height="3" fill="#e10600"/><rect x="14.5" y="20" width="3" height="3" fill="#333"/><rect x="19" y="20" width="3" height="3" fill="#333"/><path d="M4 4c0 6 1 8 3 9M28 4c0 6-1 8-3 9" stroke="#000" fill="none"/>`,
    vpet: c => `<path d="M16 3c7 0 12 6 12 14s-5 12-12 12S4 25 4 17 9 3 16 3z" fill="${c}" ${sw()}/><rect x="9" y="10" width="14" height="10" fill="#c8e0a8" ${sw(0.6)}/><path d="M14 13h4v4h-4zM13 14h1M18 14h1" stroke="#000"/><circle cx="11" cy="24" r="1.6" fill="#fff" ${sw(0.4)}/><circle cx="16" cy="25" r="1.6" fill="#fff" ${sw(0.4)}/><circle cx="21" cy="24" r="1.6" fill="#fff" ${sw(0.4)}/><circle cx="16" cy="3" r="2" fill="none" stroke="#000"/>`,
    pc: c => `<rect x="4" y="3" width="24" height="18" fill="${c}" ${sw()}/><rect x="7" y="6" width="18" height="12" fill="#008080" ${sw(0.6)}/><rect x="2" y="23" width="28" height="6" fill="${c}" ${sw()}/><rect x="20" y="25" width="6" height="2" fill="#333"/><circle cx="6" cy="26" r="1" fill="#0f0"/><path d="M9 9h6M9 12h10" stroke="#fff" stroke-width=".8"/>`,
    euro: c => `<circle cx="16" cy="16" r="12" fill="${c}" ${sw()}/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return star(16 + 8 * Math.cos(a), 16 + 8 * Math.sin(a), 1.5, '#ffd400'); }).join('')}<text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="#fff">E</text>`,
    bug: c => `<ellipse cx="16" cy="18" rx="8" ry="10" fill="${c}" ${sw()}/><circle cx="16" cy="8" r="4" fill="#222" ${sw()}/><path d="M16 9v19" stroke="#000"/><path d="M8 14l-5-2M8 19H3M8 24l-5 2M24 14l5-2M24 19h5M24 24l5 2M14 5l-2-4M18 5l2-4" stroke="#000" stroke-width="1.2"/><circle cx="12" cy="15" r="1.6"/><circle cx="20" cy="21" r="1.6"/><text x="16" y="29" text-anchor="middle" font-family="Courier New" font-size="4" fill="#fff">00</text>`,
    grot: c => `<path d="M6 12l-5-3 4 7zM26 12l5-3-4 7z" fill="${c}" ${sw()}/><ellipse cx="16" cy="16" rx="10" ry="9" fill="${c}" ${sw()}/><circle cx="12" cy="14" r="2" fill="#e10600"/><circle cx="20" cy="14" r="2" fill="#e10600"/><path d="M10 20h12l-2 2-2-2-2 2-2-2-2 2z" fill="#fff" ${sw(0.5)}/><path d="M9 30c1-4 13-4 14 0" fill="#8a5a2a" ${sw()}/>`,
    squig: c => `<path d="M2 23L11 11h17v12z" fill="${c}" ${sw()}/><path d="M11 11L4 6l-1.6 2.2L9 13z" fill="#c0c0c0" ${sw(0.6)}/><path d="M4 6.4l-2-3M6 5l-.6-3" stroke="#ff8a00" stroke-width="1" stroke-linecap="round"/><rect x="17" y="14" width="8" height="4" fill="#222" ${sw(0.5)}/><circle cx="19.5" cy="16" r="1" fill="#3aff6a"/><circle cx="22.5" cy="16" r="1" fill="#3aff6a"/><path d="M26 11V5" stroke="#000" stroke-width="1"/><circle cx="26" cy="4.4" r="1.4" fill="#ffd400" ${sw(0.5)}/><circle cx="10" cy="25" r="4" fill="#333" ${sw()}/><circle cx="24" cy="25" r="4" fill="#333" ${sw()}/><circle cx="10" cy="25" r="1.4" fill="#aaa"/><circle cx="24" cy="25" r="1.4" fill="#aaa"/>`, // a Battle Robot (wedge, flipper, wheels)
    dave: c => `<circle cx="16" cy="14" r="9" fill="#f0c8a0" ${sw()}/><path d="M7 12c0-6 4-8 9-8s9 2 9 8c-2-3-5-4-9-4s-7 1-9 4z" fill="#a0642a" ${sw(0.6)}/><circle cx="13" cy="14" r="1.2"/><circle cx="19" cy="14" r="1.2"/><path d="M12 18c2 2 6 2 8 0" stroke="#000" fill="none"/><path d="M6 31c0-6 4-8 10-8s10 2 10 8" fill="${c}" ${sw()}/>`,
    knit: c => `<circle cx="16" cy="18" r="9" fill="${c}" ${sw()}/><path d="M9 14c4 2 10 2 14 0M8 18c5 2 11 2 16 0M9 22c4 2 10 2 14 0" stroke="#fff" stroke-width=".8" fill="none" opacity=".6"/><path d="M4 4l12 12M28 4L16 16" stroke="#c8a060" stroke-width="1.6" stroke-linecap="round"/><circle cx="4" cy="4" r="1.4" fill="#ffd400"/><circle cx="28" cy="4" r="1.4" fill="#ffd400"/>`,
    dome: c => `<path d="M2 26C2 15 8 9 16 9s14 6 14 17z" fill="${c}" ${sw()}/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${5 + i * 4.4} 26L${4 + i * 4.8} 4" stroke="#ffd400" stroke-width="1.2"/>`).join('')}<path d="M0 26h32" stroke="#000" stroke-width="1.4"/>`,
    dish: c => `<rect x="0" y="0" width="32" height="32" fill="${c}"/>${star(6, 6, 1, '#fff')}${star(25, 4, 1.2, '#fff')}${star(28, 14, .8, '#fff')}<path d="M6 24c6 2 14-4 16-12-8-2-16 4-16 12z" fill="#d8d8e0" ${sw()}/><path d="M14 18l8-8M22 10l2-2" stroke="#000"/><path d="M12 24l-2 6h8l-2-6" fill="#888" ${sw(0.6)}/><path d="M24 6c2 0 4 2 4 4M25 3c3 0 6 3 6 6" stroke="#0f0" fill="none"/>`,
    jackpc: c => `<rect x="0" y="0" width="32" height="32" fill="#008080"/><rect x="4" y="4" width="24" height="17" fill="#c0c0c0" ${sw()}/><rect x="4" y="4" width="24" height="4" fill="${c}"/><rect x="8" y="11" width="16" height="7" fill="#fff" ${sw(0.5)}/><text x="16" y="16.6" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="4.4" fill="#e10600">JACK!</text><rect x="0" y="26" width="32" height="6" fill="#c0c0c0" ${sw(0.6)}/><rect x="1" y="27" width="7" height="4" fill="#c0c0c0" ${sw(0.5)}/>`,
    jackpot: () => `<rect width="32" height="32" fill="url(#lxjp)"/>${star(16, 15, 10, '#fff', 'stroke="#000" stroke-width=".6"')}<text x="16" y="18" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="6" fill="#e10600">JP!</text>`,
    queue: c => `<rect width="32" height="32" fill="${c}"/>${star(26, 5, 1, '#fff')}${star(5, 8, .8, '#fff')}${[3, 9, 15, 21, 27].map((x, i) => `<circle cx="${x}" cy="${17 - (i % 2)}" r="3" fill="#f0c8a0" ${sw(0.5)}/><path d="M${x - 3} 30c0-6 1.4-8 3-8s3 2 3 8" fill="${['#e10600', '#2a9a2a', '#0060d0', '#ff8a00', '#8a1ad8'][i]}" ${sw(0.5)}/>`).join('')}<path d="M27 14l3-12" stroke="#3aff6a" stroke-width="1.6"/>`,
    eclipsecard: () => `<rect width="32" height="32" fill="#000010"/><circle cx="16" cy="15" r="10" fill="#fff" opacity=".25"/><circle cx="16" cy="15" r="7.6" fill="#ffb000" opacity=".9"/><circle cx="16" cy="15" r="7" fill="#000"/><path d="M0 28c6-3 10-3 16-1s10 2 16-1v6H0z" fill="#1a3a1a"/>`,
    pokeball: c => ICON.handheld(c), // the 1999 craze card: a handheld with a link cable (no copied art)
    handheld: c => `<rect x="7" y="2" width="18" height="28" rx="3" fill="#c8c8c8" ${sw()}/><rect x="10" y="5" width="12" height="10" fill="#a8d088" ${sw(0.6)}/><path d="M12.6 8.6l1.2-3 1.4 2.4h1.6l1.4-2.4 1.2 3c1 3-1 5.4-3.4 5.4s-4.4-2.4-3.4-5.4z" fill="${c}" ${sw(0.5)}/><circle cx="15" cy="9.6" r=".6"/><circle cx="17" cy="9.6" r=".6"/><path d="M11 20h4M13 18v4" stroke="#333" stroke-width="1.6"/><circle cx="20" cy="21" r="1.4" fill="#a0003a"/><circle cx="22.6" cy="19.4" r="1.4" fill="#a0003a"/><path d="M25 22c4 1 5 4 5 8" stroke="#555" fill="none" stroke-width="1.2"/>`,
    console: c => `<path d="M4 12h24v12H4z" fill="#f4f4f4" ${sw()}/><path d="M4 12l3-4h18l3 4" fill="#e8e8e8" ${sw()}/><circle cx="16" cy="18" r="4" fill="${c}"/><path d="M14 18a2 2 0 1 1 4 0" stroke="#fff" fill="none"/><rect x="22" y="20" width="4" height="2" fill="#333"/><path d="M28 16c2 0 3 1 3 3M28 13c3 0 4 2 4 5" stroke="#0a0" fill="none"/><text x="9" y="28" font-family="Arial" font-size="3.6">56K!</text>`,
    bonfire: c => `<rect width="32" height="32" fill="#0a0a2a"/><path d="M6 30l20-8M6 22l20 8" stroke="#6a3a10" stroke-width="2.4"/><path d="M16 4c4 6 8 9 6 16-2 4-10 4-12 0-2-6 4-8 6-16z" fill="${c}"/><path d="M16 12c2 3 4 5 3 8-1 2-5 2-6 0-1-3 2-4 3-8z" fill="#ffd400"/>${star(5, 6, 1.2, '#ff3ad0')}${star(27, 8, 1.4, '#3ad0ff')}`,
    pumpkin: c => `<path d="M15 8c0-3 1-5 3-6" stroke="#2a6a1a" stroke-width="2" fill="none"/><ellipse cx="16" cy="18" rx="13" ry="11" fill="${c}" stroke="#7a3a00"/><path d="M10 8c-2 5-2 15 0 20M22 8c2 5 2 15 0 20M16 7v22" stroke="#c85a00" fill="none"/><path d="M8 16l3-4 3 4zM18 16l3-4 3 4zM8 21c4 4 12 4 16 0l-2 3-2-2-2 3-2-3-2 3-2-2z" fill="#ffe600" stroke="#7a3a00" stroke-width=".5"/>`,
    tree: c => `<path d="M16 2l12 22H4z" fill="${c}" ${sw()}/><rect x="13" y="24" width="6" height="6" fill="#6a3a10" ${sw(0.6)}/>${star(16, 3, 2.6, '#ffd400', 'stroke="#000" stroke-width=".4"')}<circle cx="12" cy="16" r="1.4" fill="#e10600"/><circle cx="19" cy="12" r="1.4" fill="#ffd400"/><circle cx="20" cy="20" r="1.4" fill="#0060d0"/><circle cx="10" cy="21" r="1.4" fill="#ff8ac8"/>`,
    firework: c => `<rect width="32" height="32" fill="${c}"/>${[['#ff3ad0', 10, 10], ['#ffd400', 22, 8], ['#3ad0ff', 18, 20]].map(([cl, x, y]) => Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${x + 2 * Math.cos(a)} ${y + 2 * Math.sin(a)}L${x + 6 * Math.cos(a)} ${y + 6 * Math.sin(a)}" stroke="${cl}" stroke-width="1.2" stroke-linecap="round"/>`; }).join('')).join('')}<text x="16" y="30" text-anchor="middle" font-family="Arial Black,Arial" font-size="5" fill="#ffd400">2000</text>`,
    marble: c => `<circle cx="16" cy="16" r="11" fill="${c}" ${sw()}/><path d="M9 20c4-6 10-2 14-8" stroke="#fff" stroke-width="2.4" fill="none" opacity=".6"/><circle cx="12" cy="11" r="3" fill="#fff" opacity=".8"/>`,
    tazo: c => `<circle cx="16" cy="16" r="12" fill="${c}" ${sw()}/><circle cx="16" cy="16" r="9" fill="url(#lxcd)" opacity=".7"/>${star(16, 16, 6, '#ffd400', 'stroke="#000" stroke-width=".5"')}`,
    toof: c => { const f = c === 'rainbow' ? 'url(#lxjp)' : c, e = 'stroke="#000" stroke-width=".9" stroke-linejoin="round"'; return `<path d="M16 3l12 6.5L16 16 4 9.5z" fill="${f}" ${e}/><path d="M16 3l12 6.5L16 16 4 9.5z" fill="#fff" opacity=".35"/><path d="M4 9.5L16 16v13L4 22.5z" fill="${f}" ${e}/><path d="M28 9.5v13L16 29V16z" fill="${f}" ${e}/><path d="M28 9.5v13L16 29V16z" fill="#000" opacity=".2"/><ellipse cx="16" cy="9.5" rx="2.2" ry="1.2"/><ellipse cx="7" cy="14.6" rx="1.1" ry="1.5"/><ellipse cx="10" cy="19.3" rx="1.1" ry="1.5"/><ellipse cx="13" cy="23.9" rx="1.1" ry="1.5"/><ellipse cx="19.6" cy="18" rx="1.1" ry="1.5"/><ellipse cx="24.4" cy="20.6" rx="1.1" ry="1.5"/><path d="M9 8.4l4-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`; }, // a lucky dice (key kept: old saves)
    gear: c => `<circle cx="16" cy="16" r="9" fill="${c}" ${sw()}/>${Array.from({ length: 8 }, (_, i) => `<rect x="14" y="3" width="4" height="5" fill="${c}" ${sw(0.6)} transform="rotate(${i * 45} 16 16)"/>`).join('')}<circle cx="16" cy="16" r="3.4" fill="#fff" ${sw(0.6)}/>`,
    globe: c => `<rect x="8" y="25" width="16" height="5" fill="#6a3a10" ${sw()}/><circle cx="16" cy="15" r="11" fill="${c}" ${sw()}/><path d="M9 21h14v-3l-2-2-2 2-3-4-3 4-2-2-2 2z" fill="#c0c0c0"/>${[[10, 9], [20, 7], [14, 12], [22, 14], [12, 17]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join('')}<path d="M9 9c2-3 4-4 7-4" stroke="#fff" stroke-width="1.4" fill="none"/>`,
    conker: c => `<path d="M16 2v8" stroke="#c8a060" stroke-width="1.2"/><ellipse cx="16" cy="19" rx="10" ry="9" fill="${c}" ${sw()}/><ellipse cx="16" cy="23" rx="7" ry="4" fill="#d8b888" opacity=".6"/><path d="M10 14c2-3 6-3 8-2" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>`,
    sparkler: c => `<path d="M6 28L22 10" stroke="#888" stroke-width="1.6"/><path d="M22 10l2-5M22 10l5-2M22 10l5 3M22 10l3 5M22 10l-2-5M22 10l-5-1" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><circle cx="22" cy="10" r="2" fill="#fff"/>`,
    shard: c => `<path d="M16 2l7 12-7 16-7-16z" fill="${c}" ${sw()}/><path d="M16 2l3 12-3 16" fill="#fff" opacity=".5"/><circle cx="16" cy="13" r="12" fill="${c}" opacity=".18"/>`,
    egg: c => `<path d="M16 3c6 0 10 9 10 16s-4 10-10 10S6 26 6 19 10 3 16 3z" fill="${c}" ${sw()}/><path d="M7 17l3-2 3 2 3-2 3 2 3-2 3 2" stroke="#e10600" stroke-width="1.2" fill="none"/><path d="M11 8c1-2 2-3 3-3" stroke="#fff" stroke-width="1.6" fill="none"/>`,
    heart: c => `<path d="M16 28C5 20 3 13 5.6 8.6 8.4 4.4 13.6 5 16 9.6 18.4 5 23.6 4.4 26.4 8.6 29 13 27 20 16 28z" fill="${c}" ${sw()}/><path d="M9 11c1-2 3-3 5-2" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M4 16h24" stroke="#ffd400" stroke-width="2"/>`,
    pan: c => `<circle cx="13" cy="15" r="10" fill="${c}" ${sw()}/><circle cx="13" cy="15" r="7" fill="#f4e0a0" ${sw(0.6)}/><path d="M22 20l8 7" stroke="#6a3a10" stroke-width="3" stroke-linecap="round"/>`,
    clock: c => `<circle cx="16" cy="17" r="12" fill="#fff" stroke="${c}" stroke-width="2.4"/><path d="M16 17V8M16 17l5 3" stroke="#000" stroke-width="1.4" stroke-linecap="round"/><text x="16" y="27" text-anchor="middle" font-family="Courier New" font-weight="bold" font-size="4.4" fill="${c}">23:59</text><path d="M6 6l4 3M26 6l-4 3" stroke="${c}" stroke-width="2"/>`,
  };
  const ICON_DEFS = `<defs><linearGradient id="lxcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8ad8"/><stop offset=".3" stop-color="#8ad8ff"/><stop offset=".6" stop-color="#d8ff8a"/><stop offset="1" stop-color="#ffd88a"/></linearGradient>${rgrad('lxjp').replace('<defs>', '').replace('</defs>', '')}</defs>`;
  const icon = (name, c) => (ICON[name] ? ICON[name](c) : ICON.toof('#fff'));

  // ================================================================ Lootlings (pets): a static 32x32 picture and taskbar pixel art
  function lootling(art, opts) {
    const [body, belly, ears, eye, extra] = art, rb = body === '#ff3a6a' && extra === 'rainbow';
    const bf = rb ? 'url(#lxjp)' : body, o = opts || {};
    const E = {
      round: `<circle cx="9" cy="10" r="3.4" fill="${bf}" ${sw()}/><circle cx="23" cy="10" r="3.4" fill="${bf}" ${sw()}/>`,
      nub: `<circle cx="11" cy="9.4" r="2" fill="${bf}" ${sw()}/><circle cx="21" cy="9.4" r="2" fill="${bf}" ${sw()}/>`,
      long: `<path d="M8 12C3 12 1 18 3 24c2-2 4-6 6-9z" fill="${bf}" ${sw()}/><path d="M24 12c5 0 7 6 5 12-2-2-4-6-6-9z" fill="${bf}" ${sw()}/>`,
      pointy: `<path d="M7 14L3 4l9 6z" fill="${bf}" ${sw()}/><path d="M25 14l4-10-9 6z" fill="${bf}" ${sw()}/>`,
      antenna: `<path d="M16 9V3" stroke="#000" stroke-width="1"/><circle cx="16" cy="2.6" r="2" fill="${extra === 'spark' ? '#fff' : '#e10600'}" ${sw(0.6)}/>`,
      cat: `<path d="M7 13l1-9 6 6z" fill="${bf}" ${sw()}/><path d="M25 13l-1-9-6 6z" fill="${bf}" ${sw()}/><path d="M8.4 7l.4-1.6 1.6 1.6zM23.6 7l-.4-1.6-1.6 1.6z" fill="#ffb8d8"/>`,
    }[ears] || '';
    const ghost = extra === 'ghost';
    const bodyP = ghost ? `<path d="M5 20c0-7 5-11 11-11s11 4 11 11v9l-3-2-2.6 2-2.7-2-2.7 2-2.7-2-2.6 2-3-2z" fill="${bf}" ${sw()} opacity=".88"/>` : `<ellipse cx="16" cy="20" rx="11" ry="10" fill="${bf}" ${sw()}/>`;
    const feet = ghost ? '' : `<ellipse cx="10.6" cy="29.4" rx="3.4" ry="1.8" fill="${bf}" ${sw()}/><ellipse cx="21.4" cy="29.4" rx="3.4" ry="1.8" fill="${bf}" ${sw()}/>`;
    const mouth = extra === 'frown' ? `<path d="M13 25c2-1.6 4-1.6 6 0" stroke="#000" stroke-width="1" fill="none"/>` : `<path d="M12.6 23.4c2 2 4.8 2 6.8 0" stroke="#000" stroke-width="1" fill="none"/>`;
    const X = {
      crumbs: `<circle cx="9" cy="18" r=".9" fill="#7a4a1a"/><circle cx="22" cy="16" r=".9" fill="#7a4a1a"/><circle cx="20" cy="26" r=".8" fill="#7a4a1a"/><circle cx="11" cy="25" r=".8" fill="#7a4a1a"/>`,
      spark: `<path d="M16 0l1 1.6L19 1l-1.4 1.8L19 4.4l-2-.2-1 1.8-1-1.8-2 .2 1.4-1.6L13 1l2 .6z" fill="#ffd400" class="lx-twinkle"/>`,
      scarf: `<path d="M7 22c5 2.4 13 2.4 18 0v3c-5 2.4-13 2.4-18 0z" fill="#e10600" ${sw(0.6)}/><path d="M20 24l2 6 3-1-2-5z" fill="#e10600" ${sw(0.6)}/>`,
      bolts: `<circle cx="7.4" cy="20" r="1" fill="#555"/><circle cx="24.6" cy="20" r="1" fill="#555"/><path d="M10 27h12" stroke="#555" stroke-dasharray="1.4 1"/>`,
      shine: `<path d="M24 12l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#fff" class="lx-twinkle"/>`,
      rainbow: `<path d="M24 12l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#fff" class="lx-twinkle"/>`,
    }[extra] || '';
    return `${o.defs !== false ? ICON_DEFS : ''}${E}${bodyP}${ears === 'antenna' ? E : ''}<ellipse cx="16" cy="22.6" rx="6.6" ry="5.4" fill="${belly}"${ghost ? ' opacity=".7"' : ''}/><ellipse cx="12.2" cy="17" rx="2" ry="2.6" fill="${eye}"/><ellipse cx="19.8" cy="17" rx="2" ry="2.6" fill="${eye}"/><circle cx="12.8" cy="16" r=".8" fill="#fff"/><circle cx="20.4" cy="16" r=".8" fill="#fff"/><ellipse cx="9" cy="21" rx="1.6" ry="1" fill="#ff8ac8" opacity=".6"/><ellipse cx="23" cy="21" rx="1.6" ry="1" fill="#ff8ac8" opacity=".6"/>${mouth}${feet}${X}`;
  }
  const PET_SAYS = {
    snorb: ['*sniff sniff*', 'I smell loot!', 'Snorb!', 'Is it dinner time?', '*rolls about*'],
    crumbit: ['*crumble*', 'Do NOT dunk me.', 'Biscuit power!', 'I left crumbs. Sorry.'],
    pibble: ['*paints the taskbar*', 'Ooh, pretty!', 'Pibble pibble!', 'Wet paint!'],
    grumplet: ['What?', 'Hmph.', 'Fine. FINE.', "I'm not grumpy, YOU'RE grumpy.", '*secretly smiles*'],
    fizzwick: ['BZZT!', 'I invented a thing!', 'Oops. Explosion.', '*crackles*'],
    moggle: ['Purrrrr-56K', 'Mrrp?', '*floats a bit*', 'Moggle!'],
    ghost: ['Woooo!', 'Boo! (sorry)', '*goes see-through*'],
    snowpib: ['Brrr!', 'Snow day!', '*builds a tiny snowman*'],
    robo: ['BEEP. Y2K COMPLIANT.', 'DOES NOT COMPUTE.', '01001000 01101001!'],
    gold: ['*jingle jingle*', 'I am SO shiny.', 'Polish me!'],
    rainbow: ['*leaves a rainbow*', 'Every colour!', 'Jackpot!'],
  };
  function petDef(id) {
    const it = IT[id]; if (!it || it.type !== 'pet') return null;
    const [body, belly, ears, eye, extra] = it.art, sp = id.slice(4);
    const hue = extra === 'rainbow';
    return {
      speed: { snorb: 30, crumbit: 25, pibble: 40, grumplet: 20, fizzwick: 60, moggle: 35 }[sp] || 35,
      says: PET_SAYS[sp] || ['!'],
      draw(g, f, st, p) {
        const bob = st.moving ? f % 2 : 0, b = hue ? RAINBOW[f % 6] : body, ghost = extra === 'ghost';
        if (ghost) g.globalAlpha = 0.85;
        // ears
        if (ears === 'round') { p(4, 6 - bob, 4, 4, b); p(16, 6 - bob, 4, 4, b); }
        else if (ears === 'nub') { p(6, 7 - bob, 3, 2, b); p(15, 7 - bob, 3, 2, b); }
        else if (ears === 'long') { p(2, 9 - bob, 3, 8, b); p(19, 9 - bob, 3, 8, b); }
        else if (ears === 'pointy') { p(3, 5 - bob, 2, 4, b); p(4, 7 - bob, 3, 3, b); p(19, 5 - bob, 2, 4, b); p(17, 7 - bob, 3, 3, b); }
        else if (ears === 'cat') { p(5, 5 - bob, 2, 4, b); p(7, 7 - bob, 2, 2, b); p(17, 5 - bob, 2, 4, b); p(15, 7 - bob, 2, 2, b); }
        else if (ears === 'antenna') { p(11, 3 - bob, 2, 5, '#000'); p(10, 1 - bob, 4, 3, extra === 'spark' && f % 2 ? '#fff' : extra === 'spark' ? '#ffd400' : '#e10600'); }
        // body
        p(5, 8 - bob, 14, 13, b); p(4, 10 - bob, 16, 9, b); p(6, 7 - bob, 12, 1, b);
        p(8, 13 - bob, 8, 7, belly);
        // eyes (blink)
        if (st.blink && f % 7 === 0) { p(8, 11 - bob, 3, 1, '#000'); p(13, 11 - bob, 3, 1, '#000'); }
        else { p(8, 10 - bob, 2, 3, eye); p(14, 10 - bob, 2, 3, eye); p(8, 10 - bob, 1, 1, '#fff'); p(14, 10 - bob, 1, 1, '#fff'); }
        p(10, 16 - bob, 4, 1, '#000');
        if (extra === 'frown') { p(9, 15 - bob, 1, 1, '#000'); p(14, 15 - bob, 1, 1, '#000'); }
        if (extra === 'scarf') { p(5, 15 - bob, 14, 2, '#e10600'); p(15, 17 - bob, 2, 3, '#e10600'); }
        if (extra === 'bolts') { p(5, 13 - bob, 1, 1, '#555'); p(18, 13 - bob, 1, 1, '#555'); }
        if (extra === 'crumbs') { p(6, 12 - bob, 1, 1, '#7a4a1a'); p(17, 17 - bob, 1, 1, '#7a4a1a'); }
        if ((extra === 'shine' || hue) && f % 4 < 2) { p(18, 8 - bob, 1, 3, '#fff'); p(17, 9 - bob, 3, 1, '#fff'); }
        // feet / ghost tail
        if (ghost) { for (let i = 0; i < 4; i++) p(5 + i * 4, 21 - bob, 2, 2, b); }
        else { const leg = st.moving ? f % 2 : 0; p(6 + leg, 21, 4, 2, b); p(14 - leg, 21, 4, 2, b); p(6 + leg, 22, 4, 1, '#000'); p(14 - leg, 22, 4, 1, '#000'); }
        g.globalAlpha = 1;
      },
    };
  }

  // ================================================================ mouse pointers (24x24)
  const CURS = {
    arrow: (f, s) => `<path d="M2 2v17.4l4.6-4.4 3 6.6 3.2-1.5-3-6.4H16z" fill="${f}" stroke="${s}" stroke-width="1.2" stroke-linejoin="round"/>`,
    wand: (f, s) => `<path d="M8 8l14 14" stroke="#4a2a10" stroke-width="2.2" stroke-linecap="round"/><path d="M19 19l3 3" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>${star(5, 5, 4.6, f, `stroke="${s}" stroke-width=".8"`)}`,
    sword: (f, s) => `<path d="M3 3l13 13" stroke="${f}" stroke-width="3.4" stroke-linecap="round"/><path d="M3 3l13 13" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><path d="M14 18l4-4" stroke="#333" stroke-width="2"/><path d="M17 17l5 5" stroke="#666" stroke-width="3" stroke-linecap="round"/><path d="M3 3l13 13" stroke="${f}" stroke-width="6" stroke-linecap="round" opacity=".25"/>`,
    candy: (f, s) => `<path d="M14 22V9a5 5 0 0 0-10 0" stroke="${s}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M14 22V9a5 5 0 0 0-10 0" stroke="${f}" stroke-width="4" fill="none" stroke-dasharray="2.4 2.4" stroke-linecap="butt"/><path d="M4 9v2" stroke="${s}" stroke-width="4"/>`,
    ghost: (f, s) => `<path d="M2 2l5 1.4L3.4 7z" fill="${s}"/><path d="M6 20c0-8 3-13 8-13s8 5 8 13l-2.6-2-2.7 2-2.7-2-2.7 2-2.7-2z" fill="${f}" stroke="${s}" stroke-width="1"/><circle cx="11.6" cy="12" r="1.3" fill="${s}"/><circle cx="16.4" cy="12" r="1.3" fill="${s}"/><ellipse cx="14" cy="16" rx="1.4" ry="1.8" fill="${s}"/>`,
    rocket: (f, s) => `<path d="M2 2c6 0 13 3 16 9l-7 7C5 15 2 8 2 2z" fill="${f}" stroke="#000" stroke-width="1"/><circle cx="9" cy="9" r="2" fill="#3ad0ff" stroke="#000" stroke-width=".7"/><path d="M14 16l1 6 4-4zM16 14l6 1-4 4z" fill="${s}" stroke="#000" stroke-width=".7"/><path d="M17 18l4 4" stroke="#ff8a00" stroke-width="2.6" stroke-linecap="round"/><path d="M2 2l4 1-3 3z" fill="${s}"/>`,
    toof: (f, s) => `<path d="M12 1l6 5v11l-6 6-6-6V6z" fill="${f}" stroke="${s}" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 1L6 6v11l6 6z" fill="#fff" opacity=".4"/><path d="M12 1l6 5v11l-6 6z" fill="#000" opacity=".15"/><path d="M12 5l3 2.6v8.8L12 19l-3-2.6V7.6z" fill="${f}" stroke="${s}" stroke-width=".5"/><path d="M8 7.4l2.6-2.2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`, // a cut diamond (key kept)
  };
  const CURHOT = { arrow: [2, 2], wand: [5, 5], sword: [3, 3], candy: [4, 9], ghost: [2, 2], rocket: [2, 2], toof: [12, 1] };
  const curSvg = id => { const it = IT[id]; if (!it) return ''; const [sh, f, s] = it.art, rb = f === 'rainbow'; return (rb ? rgrad('lxrc') : '') + CURS[sh](rb ? 'url(#lxrc)' : f, s); };
  const enc = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  function cursor(id) { const it = IT[id]; if (!it || it.type !== 'cur') return ''; const h = CURHOT[it.art[0]] || [2, 2]; return `${enc('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + curSvg(id) + '</svg>')} ${h[0]} ${h[1]}, auto`; }

  // ================================================================ wallpapers
  const WP = {
    dots: ([, bg, a, b]) => ({ s: `width="40" height="40"><rect width="40" height="40" fill="${bg}"/><circle cx="10" cy="10" r="6" fill="${a}"/><circle cx="30" cy="30" r="6" fill="${b}"/>`, mode: 'Tile' }),
    checks: ([, bg, a]) => ({ s: `width="40" height="40"><rect width="40" height="40" fill="${bg}"/><rect width="20" height="20" fill="${a}"/><rect x="20" y="20" width="20" height="20" fill="${a}"/>`, mode: 'Tile' }),
    stripes: ([, bg, a]) => ({ s: `width="40" height="40"><rect width="40" height="40" fill="${bg}"/><rect width="20" height="40" fill="${a}"/>`, mode: 'Tile' }),
    bubbles: ([, bg, a, b]) => ({ s: `width="80" height="80"><rect width="80" height="80" fill="${bg}"/>${[[14, 18, 10], [52, 12, 6], [60, 50, 14], [22, 60, 8], [40, 36, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${a}" fill-opacity=".35" stroke="${b}" stroke-width="1.4"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="${b}"/>`).join('')}`, mode: 'Tile' }),
    zigzag: ([, bg, a, b]) => ({ s: `width="40" height="20"><rect width="40" height="20" fill="${bg}"/><path d="M0 14l10-8 10 8 10-8 10 8" stroke="${a}" stroke-width="3" fill="none"/><path d="M0 20l10-8 10 8 10-8 10 8" stroke="${b}" stroke-width="2" fill="none"/>`, mode: 'Tile' }),
    stars: ([, bg, a, b]) => ({ s: `width="100" height="100"><rect width="100" height="100" fill="${bg}"/>${[[10, 12], [40, 30], [80, 8], [65, 55], [20, 70], [90, 85], [50, 90], [5, 45], [75, 30], [33, 52]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.8 : 1.4}" fill="${i % 2 ? a : b}"/>`).join('')}${star(60, 75, 3, a)}`, mode: 'Tile' }),
    lootlings: ([, bg]) => ({ s: `width="96" height="96"><rect width="96" height="96" fill="${bg}"/><g transform="translate(4 6) scale(1.1)">${lootling(IT['pet.snorb'].art, { defs: false })}</g><g transform="translate(52 50) scale(1.1)">${lootling(IT['pet.pibble'].art, { defs: false })}</g><g transform="translate(56 4) scale(.9)">${lootling(IT['pet.grumplet'].art, { defs: false })}</g><g transform="translate(8 56) scale(.9)">${lootling(IT['pet.crumbit'].art, { defs: false })}</g>`, mode: 'Tile' }),
    code: ([, bg, a, b]) => ({ s: `width="60" height="80"><rect width="60" height="80" fill="${bg}"/><g font-family="Courier New,monospace" font-size="10">${[4, 16, 28, 40, 52].map((x, i) => [0, 1, 2, 3, 4, 5].map(j => `<text x="${x}" y="${(j * 13 + i * 7) % 80 + 8}" fill="${j === 0 ? '#bfffd0' : j < 3 ? a : b}">${'01ジャ7Q9'.charAt((i * 3 + j) % 8)}</text>`).join('')).join('')}</g>`, mode: 'Tile' }),
    circuit: ([, bg, a, b]) => ({ s: `width="80" height="80"><rect width="80" height="80" fill="${bg}"/><path d="M0 20h30v20h20V10h30M10 80V60h40v-20h30M60 0v30h20" stroke="${a}" stroke-width="2" fill="none"/><circle cx="30" cy="20" r="3" fill="${b}"/><circle cx="50" cy="40" r="3" fill="${b}"/><circle cx="60" cy="30" r="3" fill="${b}"/><rect x="34" y="52" width="16" height="10" fill="#111" stroke="${a}"/>`, mode: 'Tile' }),
    vault: ([, bg, a, b]) => ({ s: `width="60" height="40"><rect width="60" height="40" fill="${bg}"/>${[[2, 4], [32, 4], [17, 22], [47, 22], [-13, 22]].map(([x, y]) => `<path d="M${x} ${y + 14}l4-12h18l4 12z" fill="${a}" stroke="#8a5a00"/><path d="M${x + 6} ${y + 5}h14" stroke="${b}" stroke-width="1.4"/>`).join('')}`, mode: 'Tile' }),
    holo: () => ({ s: `width="320" height="200"><defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="1">${['#ff9ad8', '#9ad8ff', '#d8ff9a', '#ffd89a', '#c89aff', '#9afff0', '#ff9ad8'].map((c, i) => `<stop offset="${(i / 6).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="320" height="200" fill="url(#h)"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 26 - 40} 200L${i * 26 + 60} 0" stroke="#fff" stroke-width="${i % 3 ? 2 : 6}" opacity=".35"/>`).join('')}${star(60, 50, 8, '#fff')}${star(250, 140, 10, '#fff')}${star(180, 40, 5, '#fff')}`, mode: 'Stretch' }),
    bats: ([, bg, a, b]) => ({ s: `width="120" height="100"><rect width="120" height="100" fill="${bg}"/><circle cx="90" cy="26" r="14" fill="${a}"/><circle cx="96" cy="22" r="12" fill="${bg}" opacity=".25"/>${[[20, 30], [60, 60], [30, 80], [100, 75]].map(([x, y]) => `<path d="M${x} ${y}c-3-4-8-5-12-3 3 1 4 3 4 5 2-2 4-2 6 0 1-2 1-2 2-2s1 0 2 2c2-2 4-2 6 0 0-2 1-4 4-5-4-2-9-1-12 3z" fill="${b}"/>`).join('')}`, mode: 'Tile' }),
    fireworks: ([, bg, a, b]) => ({ s: `width="120" height="120"><rect width="120" height="120" fill="${bg}"/>${[[30, 30, a], [86, 52, b], [40, 90, '#3ad0ff']].map(([x, y, cl]) => Array.from({ length: 12 }, (_, i) => { const t = i * Math.PI / 6; return `<path d="M${x + 4 * Math.cos(t)} ${y + 4 * Math.sin(t)}L${x + 14 * Math.cos(t)} ${y + 14 * Math.sin(t)}" stroke="${cl}" stroke-width="2" stroke-linecap="round"/>`; }).join('')).join('')}`, mode: 'Tile' }),
    snow: ([, bg, a, b]) => ({ s: `width="80" height="80"><rect width="80" height="80" fill="${bg}"/>${[[10, 10, 3], [50, 20, 2], [30, 46, 4], [70, 60, 3], [12, 66, 2], [60, 4, 1.4]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? a : b}"/>`).join('')}`, mode: 'Tile' }),
    eclipse: ([, bg, a, b]) => ({ s: `width="320" height="200"><defs><radialGradient id="c"><stop offset=".3" stop-color="${a}"/><stop offset=".45" stop-color="${b}" stop-opacity=".8"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="${bg}"/><circle cx="160" cy="90" r="80" fill="url(#c)"/><circle cx="160" cy="90" r="27" fill="#000"/>${[[30, 30], [280, 40], [60, 150], [250, 170], [120, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('')}<path d="M0 180c40-14 80-14 120-6s90 10 200-6v32H0z" fill="#0a1a0a"/>`, mode: 'Stretch' }),
    conkers: ([, bg, a, b]) => ({ s: `width="80" height="80"><rect width="80" height="80" fill="${bg}"/><path d="M14 0v20M54 0v40" stroke="#c8a060"/><circle cx="14" cy="28" r="9" fill="${a}" stroke="#000"/><circle cx="54" cy="48" r="9" fill="${a}" stroke="#000"/><path d="M60 70l8 6-10 2zM8 60l-6 8 10 0z" fill="${b}"/>`, mode: 'Tile' }),
  };
  function wall(id) { const it = IT[id]; if (!it || it.type !== 'wall') return null; const w = WP[it.art[0]](it.art); return { img: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + w.s + '</svg>')}`, mode: w.mode, col: it.art[1] }; }

  // ================================================================ chat names, JackAmp skins, Uh-Oh! flowers, 88x31 buttons, cards
  function nameStyle(id) {
    const it = IT[id]; if (!it || it.type !== 'name') return '';
    const c = it.art;
    if (c.length === 1) return `color:${c[0]}${it.r >= 3 ? `;text-shadow:0 0 4px ${c[0]}88` : ''}`;
    const glow = it.r >= 3 ? `;filter:drop-shadow(0 0 ${it.r >= 4 ? 2 : 1.5}px ${c[c.length - 1]})` : '';
    return `background-image:linear-gradient(90deg,${c.join(',')}${it.anim ? ',' + c[0] : ''});-webkit-background-clip:text;background-clip:text;color:transparent${it.anim ? ';background-size:200% 100%' : ''}${glow}`;
  }
  function amp(id) { const it = IT[id]; if (!it || it.type !== 'amp') return null; const [b, d, t, bt] = it.art; return { '--lxa-body': b, '--lxa-disp': d, '--lxa-txt': t, '--lxa-btn': bt }; }
  function flower(id) { const it = IT[id]; if (!it || it.type !== 'flower') return ''; const [h, s] = it.art; return `hue-rotate(${h}deg) saturate(${s})`; }
  function flowerSvg(petal) { let p = ''; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; p += `<circle cx="${(16 + 9.4 * Math.cos(a)).toFixed(1)}" cy="${(16 + 9.4 * Math.sin(a)).toFixed(1)}" r="5.4" fill="${petal}" stroke="#000" stroke-width=".8"/>`; } return `${p}<circle cx="16" cy="16" r="6" fill="#3fa52c" stroke="#000" stroke-width=".8"/><circle cx="14" cy="15" r=".9"/><circle cx="18" cy="15" r=".9"/><path d="M13.6 17.6c1.4 1.2 3.4 1.2 4.8 0" stroke="#000" fill="none"/>`; }
  function btn(id) {
    const it = IT[id]; if (!it || it.type !== 'btn') return '';
    const [l1, l2, bg, fg, style] = it.art, g = uid('b');
    const fill = style === 'rainbow' ? `url(#${g})` : style === 'shine' ? `url(#${g})` : bg;
    const defs = style === 'rainbow' ? rgrad(g) : style === 'shine' ? `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".45" stop-color="${bg}"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs>` : '';
    const edge = style === 'bevel' ? '<path d="M0 30V0h88" stroke="#fff" fill="none" stroke-width="2"/><path d="M88 0v31H0" stroke="#404040" fill="none" stroke-width="2"/>' : `<rect x=".5" y=".5" width="87" height="30" fill="none" stroke="${style === 'stamp' ? '#fff' : '#000'}" stroke-dasharray="${style === 'stamp' ? '2 1' : ''}"/>`;
    const font = style === 'lcd' ? 'Courier New,monospace' : 'Verdana,Arial,sans-serif';
    return S('0 0 88 31', `${defs}<rect width="88" height="31" fill="${style === 'shine' ? bg : fill}"/>${style === 'shine' ? `<rect width="88" height="31" fill="${fill}"/>` : ''}${edge}<text x="44" y="13" text-anchor="middle" font-family="${font}" font-weight="bold" font-size="${l1.length > 9 ? 8 : 10}" fill="${fg}">${l1}</text><text x="44" y="25" text-anchor="middle" font-family="${font}" font-weight="bold" font-size="${l2.length > 9 ? 8 : 10}" fill="${fg}">${l2}</text>`, 'lx-btn88');
  }
  function card(id) {
    const it = IT[id]; if (!it || it.type !== 'card') return '';
    const [no, pic, col] = it.art, R = C.RAR[it.r];
    const frame = it.r === 5 ? 'url(#lxjp)' : R.col;
    return S('0 0 60 84', `${ICON_DEFS}<rect x="1" y="1" width="58" height="82" rx="4" fill="${frame}" stroke="#000"/><rect x="4" y="4" width="52" height="76" rx="2" fill="#fffbe8"/><rect x="4" y="4" width="52" height="11" fill="${col}"/><text x="30" y="12.4" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${it.name.length > 16 ? 4.6 : 5.6}" fill="#fff">${it.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text><rect x="7" y="18" width="46" height="36" fill="#fff" stroke="#000" stroke-width=".6"/><g transform="translate(14 20) scale(1)">${icon(pic, col)}</g><text x="30" y="62" text-anchor="middle" font-family="Arial" font-size="4" fill="#333">JACKCARDS SERIES ONE 1999</text><text x="8" y="74" font-family="Arial Black,Arial" font-weight="bold" font-size="7" fill="#000">#${String(no).padStart(2, '0')}</text><text x="52" y="74" text-anchor="end" font-family="Arial" font-weight="bold" font-size="4.4" fill="${it.r === 5 ? '#e0007a' : R.col}">${R.n.toUpperCase()}</text><circle cx="30" cy="72" r="2.4" fill="${it.r === 5 ? '#e0007a' : R.col}" stroke="#000" stroke-width=".4"/>`, 'lx-card');
  }

  // ================================================================ one square picture for anything
  function pic(id) {
    const it = IT[id]; if (!it) return S('0 0 32 32', ICON.toof('#fff'));
    switch (it.type) {
      case 'hat': return S('0 -10 24 28', `<circle cx="12" cy="13" r="7" fill="#3fa52c" stroke="#000" stroke-width=".7"/><circle cx="9.6" cy="12.4" r="1" fill="#e10600"/><circle cx="14.4" cy="12.4" r="1" fill="#e10600"/><path d="M9.6 15.4c1.4 1 3.4 1 4.8 0" stroke="#000" stroke-width=".6" fill="none"/><g transform="translate(2.4 -9.2) scale(.8)">${HATS[it.art] || ''}</g>`);
      case 'face': return S('0 0 24 24', `<circle cx="12" cy="12" r="10" fill="#3fa52c" stroke="#000" stroke-width=".7"/><g transform="translate(2 6.6) scale(.84)">${FACES[it.art] || ''}</g>`);
      case 'badge': return S('0 0 16 16', badgeInner(id));
      case 'pet': return S('0 0 32 32', lootling(it.art));
      case 'cur': return S('-2 -2 28 28', `<rect x="-2" y="-2" width="28" height="28" fill="#008080"/>${curSvg(id)}`);
      case 'wall': { const w = wall(id); return `<span class="lx-wallpic" style="background:url(&quot;${w.img}&quot;) center/${w.mode === 'Stretch' ? 'cover' : '40px'} ${w.col}"></span>`; }
      case 'col': { const [a, b, f] = it.art, g = uid('c'); return S('0 0 32 32', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect x="2" y="5" width="28" height="22" fill="${f}" stroke="#000"/><rect x="3" y="6" width="26" height="5" fill="${it.anim ? 'url(#lxjp)' : `url(#${g})`}"/><rect x="22.6" y="7" width="2.6" height="2.6" fill="${f}" stroke="#555" stroke-width=".4"/><rect x="25.6" y="7" width="2.6" height="2.6" fill="${f}" stroke="#555" stroke-width=".4"/><rect x="6" y="15" width="14" height="2" fill="#888"/><rect x="6" y="19" width="10" height="2" fill="#888"/><rect x="20" y="21" width="8" height="4" fill="${f}" stroke="#555" stroke-width=".6"/>${it.anim ? ICON_DEFS : ''}`); }
      case 'amp': { const [b, d, t, bt] = it.art; return S('0 0 32 32', `${it.anim ? ICON_DEFS : ''}<rect x="2" y="6" width="28" height="20" fill="${it.anim ? 'url(#lxcd)' : b}" stroke="#000"/><rect x="4" y="8" width="11" height="8" fill="${d}"/><text x="5" y="14.4" font-family="Courier New" font-weight="bold" font-size="5" fill="${t}">1:23</text><rect x="16" y="8" width="12" height="3" fill="${d}"/><path d="M17 15v-2M19 15v-3M21 15v-1M23 15v-3M25 15v-2" stroke="${t}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${4 + i * 5}" y="19" width="4" height="4" fill="${bt}" stroke="#000" stroke-width=".4"/>`).join('')}`); }
      case 'flower': { const [h, s] = it.art; return `<span class="lx-flowerpic${it.anim ? ' lx-hue' : ''}" style="filter:hue-rotate(${h}deg) saturate(${s})">${S('0 0 32 32', flowerSvg('#35c235'))}</span>`; }
      case 'name': return `<span class="lx-namepic"><b class="lx-nm${it.anim ? ' lx-nmanim' : ''}" style="${nameStyle(id)}">Name</b></span>`;
      case 'btn': return btn(id);
      case 'card': return card(id);
      case 'trinket': { const [ic, c] = it.art; return S('0 0 32 32', ICON_DEFS + icon(ic, c)); }
    }
    return '';
  }
  // what you WEAR (hats/faces/badges), in the same shapes as js/apps-econ.js uses
  function wearSvg(kind, id) {
    const it = IT[id]; if (!it) return '';
    const cls = 'lx-wear lx-gl' + it.r;
    if (kind === 'hat' && it.type === 'hat') return S('0 0 24 16', HATS[it.art] || '', cls);
    if (kind === 'face' && it.type === 'face') return S('0 0 24 12', FACES[it.art] || '', cls);
    if (kind === 'badge' && it.type === 'badge') return S('0 0 16 16', badgeInner(id), cls);
    return '';
  }
  function cols(id) { const it = IT[id]; return it && it.type === 'col' ? it.art.slice(0, 3) : null; }

  window.LootArt = { pic, wearSvg, card, btn, cursor, cols, wall, nameStyle, amp, flower, flowerSvg, petDef, lootling, icon, ICON_DEFS, RAINBOW, star };
})();

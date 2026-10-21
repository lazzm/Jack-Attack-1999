/* bridge-dl-art: the goodies you can download from Desktop Dazzle (lazy loaded by bridge-dl.js).
 * Everything is drawn here: wallpapers (SVG), animated cursors (SVG frames), screen savers (canvas) and three real
 * TrueType fonts that are built byte by byte in the browser and handed to the FontFace API (no font files, no requests). */
(function () {
  'use strict';
  if (window.BridgeDLArt) return;

  // ================================================================ helpers
  const rnd = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const f1 = n => Math.round(n * 10) / 10;
  const SVG = (body, defs) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${defs ? '<defs>' + defs + '</defs>' : ''}${body}</svg>`;
  const lin = (id, stops, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 == null ? 0 : x2}" y2="${y2 == null ? 1 : y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx, cy, r) => `<radialGradient id="${id}" cx="${cx || 0.5}" cy="${cy || 0.5}" r="${r || 0.5}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`;
  function stars(n, seed, w, h, col) { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) o += `<circle cx="${f1(r() * (w || 800))}" cy="${f1(r() * (h || 600))}" r="${f1(0.5 + r() * r() * 1.8)}" fill="${col || '#fff'}" opacity="${f1(0.4 + r() * 0.6)}"/>`; return o; }

  // ================================================================ wallpapers (800x600 scenes that cover the desktop)
  const WALLS = {
    space: () => SVG(`<rect width="800" height="600" fill="#03041a"/><rect width="800" height="600" fill="url(#n1)"/><rect width="800" height="600" fill="url(#n2)"/>${stars(170, 11)}${stars(16, 5, 800, 600, '#9fd0ff')}
<path d="M600 90l140-40" stroke="url(#cm)" stroke-width="4" stroke-linecap="round"/><circle cx="740" cy="50" r="5" fill="#fff"/>
<circle cx="200" cy="430" r="120" fill="url(#pl)"/><ellipse cx="200" cy="430" rx="215" ry="38" fill="none" stroke="#e8c890" stroke-width="10" opacity=".75" transform="rotate(-14 200 430)"/><path d="M80 452a120 120 0 0 0 240 -40" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="40"/>
<circle cx="560" cy="300" r="22" fill="#9a9aa8"/><circle cx="554" cy="294" r="6" fill="#7a7a88"/><circle cx="566" cy="308" r="4" fill="#7a7a88"/>`,
      rad('n1', [[0, '#7a2aa0', 0.55], [1, '#03041a', 0]], 0.7, 0.35, 0.45) + rad('n2', [[0, '#1a8aa0', 0.4], [1, '#03041a', 0]], 0.25, 0.25, 0.4) + rad('pl', [[0, '#f0b070'], [0.7, '#b0602a'], [1, '#5a2a10']], 0.35, 0.35, 0.7) + lin('cm', [[0, '#fff', 0], [1, '#cfefff']], 1, 0)),
    waaagh: () => SVG(`<rect width="800" height="600" fill="url(#rs)"/>${Array.from({ length: 48 }, (_, i) => `<circle cx="${30 + (i % 12) * 68}" cy="${24 + Math.floor(i / 12) * 184}" r="5" fill="#5a3a20" stroke="#2a1a0a"/>`).join('')}
<path d="M0 540h800v60H0z" fill="#ffd400"/><path d="M0 540h800v60H0z" fill="url(#hz)"/>
<g transform="translate(400 300)">
<path d="M-250 120h500a40 40 0 0 1 0 80h-500a40 40 0 0 1 0-80z" fill="#3a3a3a" stroke="#000" stroke-width="6"/>${[-230, -150, -70, 10, 90, 170, 250].map(x => `<circle cx="${x}" cy="160" r="30" fill="#5a5a5a" stroke="#000" stroke-width="5"/><circle cx="${x}" cy="160" r="9" fill="#9a9a9a" stroke="#000" stroke-width="3"/>`).join('')}
<path d="M-380 110l170-60 20 50-160 50z" fill="#c8ccd4" stroke="#000" stroke-width="6"/><path d="M-370 112l162-56" stroke="#fff" stroke-width="4"/><path d="M-200 60l40 40" stroke="#555" stroke-width="16"/>
<rect x="-180" y="-90" width="360" height="215" rx="14" fill="#a8582a" stroke="#000" stroke-width="7"/><path d="M-170-80h340v20h-340z" fill="#c87040"/>
<path d="M-180 70h360v30h-360z" fill="#ffd400" stroke="#000" stroke-width="4"/><path d="M-160 70l-20 30M-110 70l-20 30M-60 70l-20 30M-10 70l-20 30M40 70l-20 30M90 70l-20 30M140 70l-20 30" stroke="#000" stroke-width="14"/>
<path d="M-150-40q30-20 60 0t60 10" fill="none" stroke="#6a3010" stroke-width="10" opacity=".6"/><circle cx="110" cy="20" r="34" fill="#7a3a18" opacity=".7"/><circle cx="-60" cy="40" r="22" fill="#c87a48" opacity=".6"/>
${[[-160, -70], [160, -70], [-160, 50], [160, 50], [-60, -70], [60, -70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#d8a070" stroke="#000" stroke-width="3"/>`).join('')}
<rect x="-50" y="-30" width="100" height="60" fill="#fff8d0" stroke="#000" stroke-width="5"/><text x="0" y="18" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="50" fill="#e10600" stroke="#000" stroke-width="2">07</text>
<path d="M170-30l90-40 40 60" fill="none" stroke="#000" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M170-30l90-40 40 60" fill="none" stroke="#8a8a8a" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M290 10l30 30M310 0l40 10" stroke="#000" stroke-width="12" stroke-linecap="round"/><path d="M290 10l30 30M310 0l40 10" stroke="#c8ccd4" stroke-width="6" stroke-linecap="round"/>
<rect x="-100" y="-200" width="200" height="112" rx="16" fill="#9a9aa8" stroke="#000" stroke-width="7"/><path d="M-90-190h180" stroke="#d0d0dc" stroke-width="8" stroke-linecap="round"/>
<rect x="-78" y="-170" width="156" height="50" rx="10" fill="#111" stroke="#000" stroke-width="4"/><circle cx="-36" cy="-145" r="16" fill="#ffd400"/><circle cx="36" cy="-145" r="16" fill="#ffd400"/><circle cx="-36" cy="-145" r="7" fill="#ff6a00"/><circle cx="36" cy="-145" r="7" fill="#ff6a00"/><path d="M-60-110h120" stroke="#333" stroke-width="10" stroke-dasharray="12 8"/>
<path d="M0-200v-60" stroke="#000" stroke-width="10"/><path d="M0-200v-60" stroke="#8a8a8a" stroke-width="5"/><circle cx="0" cy="-268" r="14" fill="#e10600" stroke="#000" stroke-width="4"/><circle cx="-4" cy="-272" r="4" fill="#ff9a9a"/>
<g stroke="#ffd400" stroke-width="5" stroke-linecap="round"><path d="M-200 40l-30-20M-205 60l-40 0M-198 78l-30 18M250-90l20-30M270-80l34-10M240-100l-4-36"/></g><g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M-205 60l-24 0M268-80l20-6"/></g></g>
<g transform="rotate(-8 640 120)"><path d="M520 60l40 20 30-40 20 40 50-30 0 40 60-10-30 40 40 20-50 20 20 40-50-10-10 40-40-30-30 30-10-40-50 10 30-40-40-20 40-20-30-40 50 10z" fill="#fff" stroke="#000" stroke-width="5"/><text x="640" y="135" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="50" fill="#e10600" stroke="#000" stroke-width="2">CLANK!</text></g>`,
      lin('rs', [[0, '#8a5a30'], [0.5, '#6a3a1a'], [1, '#4a2a10']]) + '<pattern id="hz" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="30" height="60" fill="#000"/></pattern>'),
    podrace: () => SVG(`<rect width="800" height="600" fill="url(#sky)"/><circle cx="620" cy="120" r="40" fill="#fff4c0"/><circle cx="700" cy="160" r="22" fill="#ffd890"/>
<path d="M0 330l60-90h120l30 90zM230 330l50-140h150l40 140zM560 330l40-60h110l30 60zM700 330l30-110h70v110z" fill="#b0502a"/><path d="M0 330l60-90h20l-10 90zM230 330l50-140h20l-30 140z" fill="#7a3418"/>
<rect y="330" width="800" height="270" fill="url(#sand)"/><path d="M0 420q400-40 800 10" stroke="#c8884a" stroke-width="3" fill="none" opacity=".6"/><path d="M0 520q400-60 800 0" stroke="#c8884a" stroke-width="3" fill="none" opacity=".6"/>
<g transform="translate(60 360) rotate(-6) scale(1.35)"><ellipse cx="40" cy="20" rx="150" ry="22" fill="#e8c890" opacity=".5"/><rect x="200" y="-20" width="190" height="34" rx="17" fill="#c8c8d0" stroke="#000" stroke-width="3"/><rect x="200" y="30" width="190" height="34" rx="17" fill="#c8c8d0" stroke="#000" stroke-width="3"/><rect x="190" y="-16" width="20" height="26" fill="#ff8c00"/><rect x="190" y="34" width="20" height="26" fill="#ff8c00"/>
<path d="M380 -3q30 20 0 50" stroke="#6cf" stroke-width="5" fill="none"/><path d="M380 -3q50 25 0 50" stroke="#fff" stroke-width="2" fill="none"/><path d="M390 -3l60 30M390 47l60-20" stroke="#333" stroke-width="2"/>
<path d="M440 10l60 8v18l-60 6z" fill="#3a6ad8" stroke="#000" stroke-width="3"/><circle cx="470" cy="20" r="7" fill="#9fd0ff" stroke="#000"/><path d="M188 -3l-60-10M188 47l-60 14M130 -10l-80 18M130 60l-80-18" stroke="#c8884a" stroke-width="6" opacity=".5" stroke-linecap="round"/></g>`,
      lin('sky', [[0, '#ff7a20'], [0.6, '#ffc060'], [1, '#ffe0a0']]) + lin('sand', [[0, '#e0a060'], [1, '#b06a30']])),
    blocks: () => { const C = ['#00e5ff', '#ffd400', '#a040e0', '#2ad02a', '#e10600', '#2a5ae0', '#ff8c00'], r = rnd(99); let b = ''; const H = [6, 7, 5, 8, 6, 4, 7, 9, 6, 5]; for (let x = 0; x < 10; x++) for (let y = 0; y < H[x]; y++) { if (y === 3 && x === 4) continue; const c = C[Math.floor(r() * 7)]; b += `<rect x="${250 + x * 30}" y="${560 - (y + 1) * 30}" width="30" height="30" fill="${c}" stroke="#000" stroke-width="2"/><path d="M${252 + x * 30} ${532 - y * 30}h26l-4 4h-18v18l-4 4z" fill="#fff" opacity=".45"/>`; }
      return SVG(`<rect width="800" height="600" fill="url(#bg)"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${(i * 97) % 800}" y="${(i * 53) % 600}" width="14" height="14" fill="${C[i % 7]}" opacity=".25" transform="rotate(${i * 13} ${(i * 97) % 800} ${(i * 53) % 600})"/>`).join('')}
<rect x="244" y="20" width="312" height="546" fill="#000" stroke="#aaa" stroke-width="6"/><path d="M250 20v540M550 20v540" stroke="#222"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${280 + i * 30} 26v534" stroke="#111"/>`).join('')}${b}
<g>${[[370, 110], [400, 110], [430, 110], [400, 140]].map(([x, y]) => `<rect x="${x}" y="${y}" width="30" height="30" fill="#a040e0" stroke="#000" stroke-width="2"/><path d="M${x + 2} ${y + 28}v-26h26l-4 4h-18v18z" fill="#fff" opacity=".45"/>`).join('')}</g>
<g font-family="Courier New,monospace" font-weight="bold" fill="#fff"><text x="600" y="80" font-size="22">SCORE</text><text x="600" y="110" font-size="28" fill="#ffd400">019990</text><text x="600" y="170" font-size="22">LINES</text><text x="600" y="200" font-size="28" fill="#00e5ff">99</text><text x="600" y="260" font-size="22">LEVEL</text><text x="600" y="290" font-size="28" fill="#2ad02a">9</text></g>`,
        lin('bg', [[0, '#101040'], [1, '#301050']])); },
    cube: () => { const F = (pts, cols) => { let o = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const p = (a, b) => [pts[0][0] + (pts[1][0] - pts[0][0]) * a + (pts[2][0] - pts[0][0]) * b, pts[0][1] + (pts[1][1] - pts[0][1]) * a + (pts[2][1] - pts[0][1]) * b]; const q = [p(i / 3, j / 3), p((i + 1) / 3, j / 3), p((i + 1) / 3, (j + 1) / 3), p(i / 3, (j + 1) / 3)]; o += `<path d="M${q.map(v => f1(v[0]) + ' ' + f1(v[1])).join('L')}z" fill="${cols[(i * 3 + j) % cols.length]}" stroke="#000" stroke-width="7" stroke-linejoin="round"/>`; } return o; };
      return SVG(`<rect width="800" height="600" fill="url(#bg)"/>${stars(60, 42, 800, 600, '#ffd8ff')}<ellipse cx="400" cy="540" rx="200" ry="30" fill="#000" opacity=".35"/>
${F([[400, 70], [620, 180], [180, 180]], ['#fff', '#fff', '#e10600', '#fff', '#fff', '#fff', '#ffd400', '#fff', '#fff'])}${F([[180, 180], [400, 290], [180, 450]], ['#e10600', '#e10600', '#0a0', '#e10600', '#2a5ae0', '#e10600', '#e10600', '#e10600', '#ff8c00'])}${F([[400, 290], [620, 180], [400, 560]], ['#2a5ae0', '#2a5ae0', '#2a5ae0', '#ffd400', '#2a5ae0', '#2a5ae0', '#2a5ae0', '#fff', '#2a5ae0'])}
<path d="M690 90l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" fill="#fff"/><path d="M110 420l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#fff"/>`,
        rad('bg', [[0, '#7a3ad0'], [1, '#1a0a40']], 0.5, 0.4, 0.75)); },
    dinos: () => SVG(`<rect width="800" height="600" fill="url(#sky)"/><circle cx="160" cy="150" r="60" fill="#ffd890" opacity=".8"/>
<path d="M480 380l90-220h40l110 220z" fill="#4a2a2a"/><path d="M570 160h40l-8 30h-24z" fill="#ff5a00"/><path d="M590 150q-30-60 10-90q-20-40 30-50q40 0 30 40q50 20 10 60q20 30-20 30" fill="#888" opacity=".6"/>
<path d="M0 420q200-50 400-10t400-20v210H0z" fill="#2a5a1a"/><path d="M0 470q300-40 800 0v130H0z" fill="#1a3a10"/>
<g fill="#0a1a08"><path d="M150 460q10-120 40-170q10-20 30-10l-6 10q-24 4-34 80l40 10q50 0 90 40l10 50h-20l-8-30-20 30h-20l4-34-60-6-14 40h-20l4-40z"/><path d="M420 470q8-90 30-130q8-14 22-8l-4 8q-16 4-24 56l28 8q36 0 64 30l8 36h-14l-6-22-14 22h-14l2-24-44-4-10 28h-14l2-28z"/>
<path d="M610 80l40 14 40-22-24 30 30 6-40 4-20 20 4-24z"/><path d="M60 600c0-40 10-80-10-120 30 30 30 60 30 120zM700 600c0-60 20-90 50-120-20 40-30 80-30 120zM740 600c-10-50-40-70-70-80 40 0 70 30 80 80z"/></g>`,
      lin('sky', [[0, '#e04a2a'], [0.5, '#f0a050'], [1, '#f8d890']])),
    sunset: () => SVG(`<rect width="800" height="600" fill="url(#sky)"/><g><circle cx="400" cy="330" r="150" fill="url(#sun)"/>${[260, 290, 315, 338, 358, 376].map((y, i) => `<rect x="240" y="${y}" width="320" height="${4 + i * 2}" fill="#ff4a8a"/>`).join('')}</g>
<rect y="380" width="800" height="220" fill="url(#sea)"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${400 - (140 - i * 8)}" y="${392 + i * 14}" width="${(140 - i * 8) * 2}" height="3" fill="#ffd060" opacity="${f1(0.8 - i * 0.05)}"/>`).join('')}
<path d="M560 600q60-90 160-110l80 20v90z" fill="#120420"/><g fill="#120420"><path d="M660 500q-6-140 22-230l8 2q-22 100-14 230z"/><path d="M684 272q-60-10-110 30q60-20 108-20zM684 272q20-50 90-50q-50 20-84 54zM684 272q60 0 90 50q-40-30-94-44zM684 272q-30-40-90-40q50 10 86 46zM684 272q0-50-30-80q34 30 38 78z"/></g>`,
      lin('sky', [[0, '#2a0a5a'], [0.45, '#c02a7a'], [0.7, '#ff7a3a']]) + lin('sun', [[0, '#ffe060'], [1, '#ff6a2a']]) + lin('sea', [[0, '#5a1a6a'], [1, '#100420']])),
    monolith: () => SVG(`<rect width="800" height="600" fill="#000"/>${stars(140, 2001, 800, 380)}<circle cx="400" cy="190" r="62" fill="url(#earth)"/><path d="M338 190a62 62 0 0 0 124 0a62 44 0 0 1-124 0z" fill="#000" opacity=".55"/>
<circle cx="400" cy="92" r="16" fill="#fff"/><circle cx="400" cy="92" r="38" fill="url(#glow)"/>
<path d="M0 400q200-30 400-10t400 0v210H0z" fill="url(#moon)"/><ellipse cx="160" cy="470" rx="50" ry="10" fill="#555"/><ellipse cx="650" cy="520" rx="70" ry="12" fill="#555"/><ellipse cx="560" cy="440" rx="24" ry="5" fill="#555"/>
<rect x="370" y="250" width="60" height="230" fill="#050505" stroke="#333" stroke-width="2"/><path d="M372 252h10v226h-10z" fill="#222"/><path d="M430 480l200 40h-260z" fill="#000" opacity=".6"/>`,
      rad('earth', [[0, '#7ac8ff'], [0.6, '#2a6ad8'], [1, '#0a2a6a']], 0.4, 0.35, 0.7) + rad('glow', [[0, '#fff', 0.8], [1, '#fff', 0]]) + lin('moon', [[0, '#9a9a9a'], [1, '#3a3a3a']])),
    cybergrid: () => SVG(`<rect width="800" height="600" fill="url(#sky)"/>${stars(60, 77, 800, 300)}<circle cx="400" cy="300" r="130" fill="url(#sun)"/>${[230, 255, 276, 293].map((y, i) => `<rect x="270" y="${y}" width="260" height="${3 + i * 3}" fill="#1a0030"/>`).join('')}
<path d="M0 300l120-90 90 60 80-110 110 140H0zM800 300l-140-110-70 70-60-40-90 80z" fill="#1a0030" stroke="#ff3ad0" stroke-width="2"/>
<rect y="300" width="800" height="300" fill="#100020"/><g stroke="#ff3ad0" stroke-width="2">${Array.from({ length: 21 }, (_, i) => `<path d="M400 300L${-1600 + i * 200} 600"/>`).join('')}${[305, 312, 322, 336, 356, 384, 424, 480, 560].map(y => `<path d="M0 ${y}H800"/>`).join('')}</g><rect y="300" width="800" height="40" fill="url(#fog)"/>`,
      lin('sky', [[0, '#0a0020'], [1, '#5a1a7a']]) + lin('sun', [[0, '#ffe040'], [1, '#ff2a8a']]) + lin('fog', [[0, '#ff3ad0', 0.5], [1, '#100020', 0]])),
    y2k: () => SVG(`<rect width="800" height="600" fill="url(#bg)"/><g stroke="#0a3a6a" stroke-width="1">${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 40} 0V600"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${i * 40}H800"/>`).join('')}</g>
<rect x="150" y="210" width="500" height="150" rx="10" fill="#001a08" stroke="#3a6a4a" stroke-width="6"/><text x="400" y="315" text-anchor="middle" font-family="Courier New,monospace" font-weight="bold" font-size="92" fill="#3f3">23:59:59</text>
<text x="400" y="410" text-anchor="middle" font-family="Courier New,monospace" font-weight="bold" font-size="34" fill="#9fd0ff">31/12/1999</text><text x="400" y="460" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#9fd0ff">ARE YOU Y2K READY? (HAVE YOU GOT BEANS?)</text>
<g fill="#e10600" stroke="#000">${[[80, 80], [700, 120], [110, 520], [690, 500]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="10"/><path d="M${x - 14} ${y}l-10-8M${x - 14} ${y + 4}l-10 6M${x + 14} ${y}l10-8M${x + 14} ${y + 4}l10 6" stroke="#e10600" stroke-width="2"/>`).join('')}</g>`,
      lin('bg', [[0, '#001030'], [1, '#002a5a']])),
    underwater: () => SVG(`<rect width="800" height="600" fill="url(#sea)"/><g fill="#fff" opacity=".08">${[120, 300, 460, 640].map(x => `<path d="M${x} 0l60 0l${x / 6} 600h-120z"/>`).join('')}</g>
<path d="M0 520q200-30 400 0t400-10v90H0z" fill="#c8a860"/><g fill="none" stroke="#1a8a3a" stroke-width="10" stroke-linecap="round">${[60, 110, 690, 740].map(x => `<path d="M${x} 560q-20-60 10-120t-10-120"/>`).join('')}</g>
<g transform="translate(520 470)"><rect width="90" height="56" fill="#8a5a20" stroke="#000" stroke-width="3"/><path d="M0 0q45-40 90 0" fill="#a06a2a" stroke="#000" stroke-width="3"/><rect x="38" y="10" width="14" height="16" fill="#ffd400" stroke="#000" stroke-width="2"/><circle cx="20" cy="-6" r="5" fill="#ffd400"/><circle cx="66" cy="-4" r="4" fill="#ffd400"/></g>
${[[260, 200, '#ff8c00', 1], [480, 290, '#ffd400', -1], [340, 380, '#e10600', 1], [620, 160, '#ff6ad0', -1]].map(([x, y, c, d]) => `<g transform="translate(${x} ${y}) scale(${d} 1)"><path d="M-30 0q30-24 60 0q-30 24-60 0z" fill="${c}" stroke="#000" stroke-width="2"/><path d="M28 0l20-14v28z" fill="${c}" stroke="#000" stroke-width="2"/><circle cx="-16" cy="-3" r="3"/></g>`).join('')}
${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 211) % 520}" r="${3 + i % 6}" fill="none" stroke="#bfefff" stroke-width="2" opacity=".6"/>`).join('')}`,
      lin('sea', [[0, '#1aa0d8'], [0.5, '#0a5a9a'], [1, '#04203a']])),
    mystery: () => SVG(`<rect width="800" height="600" fill="url(#sky)"/>${stars(120, 1999, 800, 380)}<path d="M380 175l-130 330h300z" fill="url(#beam)"/>
<g transform="translate(380 160)"><ellipse rx="110" ry="26" fill="#9aa0a8" stroke="#000" stroke-width="3"/><path d="M-50-8q50-60 100 0" fill="#bfefff" stroke="#000" stroke-width="3" opacity=".9"/>${[-80, -40, 0, 40, 80].map((x, i) => `<circle cx="${x}" cy="6" r="6" fill="${['#ff0', '#0f0', '#f0f', '#0ff', '#f80'][i]}"/>`).join('')}</g>
<path d="M0 420q400-40 800 0v180H0z" fill="#0a2a0a"/><ellipse cx="400" cy="500" rx="150" ry="34" fill="none" stroke="#3a7a2a" stroke-width="6"/><ellipse cx="400" cy="500" rx="90" ry="20" fill="none" stroke="#3a7a2a" stroke-width="5"/><circle cx="400" cy="500" r="8" fill="#3a7a2a"/>
<g fill="#fff" stroke="#000" stroke-width="2" transform="translate(370 410)"><rect width="50" height="28" rx="8"/><path d="M6 28v14M44 28v14M14 28v14M36 28v14" stroke="#fff" stroke-width="5"/><circle cx="16" cy="12" r="6" fill="#000"/><rect x="44" y="4" width="14" height="14" rx="5"/></g>
<text x="400" y="110" text-anchor="middle" font-family="Courier New,monospace" font-size="20" fill="#7f7" opacity=".8">THE TRUTH IS... SOMEWHERE</text>`,
      lin('sky', [[0, '#020a04'], [1, '#0a3a1a']]) + lin('beam', [[0, '#e0ff9a', 0.7], [1, '#e0ff9a', 0.05]])),
  };

  // ================================================================ animated cursors: frames(i) -> [svg (32x32), hotspot x, y]
  const arrow = (fill, stroke) => `<path d="M1.5 1.5v19l4.8-4.6 3.2 7.2 3.2-1.4-3.2-7h6.8z" fill="${fill || '#fff'}" stroke="${stroke || '#000'}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const C32 = s => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${s}</svg>`;
  const CURSORS = {
    squig: { n: 8, f: i => [C32(arrow() + `<g transform="translate(23 22) rotate(${i * 45})"><circle cx="-4.2" cy="-5.2" r="2" fill="#e8381b" stroke="#5a0a00"/><circle cx="4.2" cy="-5.2" r="2" fill="#e8381b" stroke="#5a0a00"/><ellipse rx="7.4" ry="6.6" fill="#e8381b" stroke="#5a0a00"/><ellipse cx="-3" cy="-3.4" rx="2" ry="1" fill="#ff9a7a"/><ellipse cx="-2.4" cy="-.6" rx="1.7" ry="2.1" fill="#fff"/><ellipse cx="2.4" cy="-.6" rx="1.7" ry="2.1" fill="#fff"/><circle cx="-2.1" cy="-.2" r=".9"/><circle cx="2.7" cy="-.2" r=".9"/><path d="M-2 3q2 1.6 4 0" stroke="#5a0a00" fill="none"/></g>`), 1, 1] },
    rocket: { n: 4, f: i => [C32(`<g transform="rotate(-45 16 16)"><path d="M16 1q6 6 6 16h-12q0-10 6-16z" fill="#eee" stroke="#000"/><circle cx="16" cy="10" r="2.5" fill="#6cf" stroke="#000"/><path d="M10 17l-4 6h5zM22 17l4 6h-5z" fill="#e10600" stroke="#000"/><path d="M12 18q4 ${8 + (i % 2) * 5 + (i === 2 ? 3 : 0)} 4 ${10 + i * 2}q0-${4 + i} 4-${10 + i * 2}z" fill="${['#ffd400', '#ff8c00', '#fff060', '#ff5a00'][i]}"/></g>`), 2, 2] },
    laser: { n: 6, f: i => { const g = [0.5, 0.8, 1, 0.8, 0.6, 0.9][i]; return [C32(`<path d="M4 4L21 21" stroke="#3aff6a" stroke-width="${f1(4 + g * 2)}" stroke-linecap="round" opacity="${f1(0.35 + g * 0.3)}"/><path d="M4 4L21 21" stroke="#e8ffe8" stroke-width="2" stroke-linecap="round"/><path d="M20 20l9 9" stroke="#555" stroke-width="5" stroke-linecap="round"/><path d="M20 20l9 9" stroke="#bbb" stroke-width="2"/><path d="M21 24l3-3" stroke="#222" stroke-width="2"/>`), 3, 3]; } },
    cube: { n: 6, f: i => { const P = ['#e10600', '#fff', '#2a5ae0', '#ffd400', '#0a0', '#ff8c00'], c = k => P[(k + i) % 6]; return [C32(arrow() + `<g stroke="#000" stroke-width=".8"><path d="M24 14l7 4-7 4-7-4z" fill="${c(0)}"/><path d="M17 18l7 4v8l-7-4z" fill="${c(1)}"/><path d="M24 22l7-4v8l-7 4z" fill="${c(2)}"/></g>`), 1, 1]; } },
    rainbow: { n: 8, f: i => [C32(arrow(`hsl(${i * 45},100%,55%)`) + `<path d="M3 5v11" stroke="hsl(${(i * 45 + 120) % 360},100%,70%)" stroke-width="1.5"/>`), 1, 1] },
    hourglass: { n: 8, f: i => { const t = i / 7, rot = i === 7 ? 90 : 0; return [C32(`<g transform="rotate(${rot} 16 16)"><path d="M8 3h16M8 29h16" stroke="#000" stroke-width="3"/><path d="M10 4h12q0 8-6 12q6 4 6 12h-12q0-8 6-12q-6-4-6-12z" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M${f1(11 + t * 3)} ${f1(5 + t * 8)}h${f1(10 - t * 6)}l-5 ${f1(8 - t * 8)}z" fill="#ffd400"/><path d="M16 16v${f1(t * 10)}" stroke="#ffd400" stroke-width="1"/><path d="M${f1(16 - t * 5)} 27h${f1(t * 10)}l-${f1(t * 5)}-${f1(t * 6)}z" fill="#ffd400"/><circle cx="16" cy="9" r="2" fill="#3a9a2a" opacity="${i % 2}"/></g>`), 16, 16]; } },
    choppa: { n: 6, f: i => { const a = [-24, -8, 10, 24, 8, -10][i]; return [C32(arrow() + `<g transform="rotate(${a} 24 27)"><path d="M24 29V15" stroke="#000" stroke-width="4.4" stroke-linecap="round"/><path d="M24 29V15" stroke="#b8bec8" stroke-width="2.6" stroke-linecap="round"/><path d="M24 26v2" stroke="#e10600" stroke-width="2.6"/><path d="M19.6 12.4a5 5 0 1 0 8.8 0l-2.4 2.4h-4z" fill="#d8dce4" stroke="#000" stroke-width="1.1" stroke-linejoin="round"/><path d="M21 11.2q1.6-1 3-.4" stroke="#fff" fill="none"/></g>`), 1, 1]; } },
    fish: { n: 4, f: i => { const t = [0, 4, 0, -4][i]; return [C32(`<path d="M2 14q10-10 20 0q-10 10-20 0z" fill="#ff8c00" stroke="#000"/><path d="M21 14l9 ${-6 + t}v${12}z" fill="#ff8c00" stroke="#000"/><circle cx="7" cy="12.5" r="1.6"/><path d="M12 9q2 5 0 10" stroke="#c05a00" fill="none"/><circle cx="${2 + i}" cy="${6 - i}" r="1.4" fill="none" stroke="#6cf"/>`), 2, 14]; } },
    saucer: { n: 4, f: i => { const L = ['#ff0', '#0f0', '#f0f', '#0ff']; return [C32(arrow() + `<g transform="translate(22 22)"><ellipse rx="9" ry="3.5" fill="#aaa" stroke="#000"/><path d="M-4-1q4-7 8 0" fill="#bfefff" stroke="#000"/>${[-6, -2, 2, 6].map((x, k) => `<circle cx="${x}" cy="1" r="1.2" fill="${L[(k + i) % 4]}"/>`).join('')}<path d="M-3 4l-3 6h12l-3-6" fill="#e0ff9a" opacity=".5"/></g>`), 1, 1]; } },
  };
  const curUrl = (svg, x, y) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, auto`;
  function cursorFrames(id) { const c = CURSORS[id]; if (!c) return []; return Array.from({ length: c.n }, (_, i) => { const [s, x, y] = c.f(i); return { css: curUrl(s, x, y), svg: s }; }); }

  // ================================================================ screen savers: factory(g, W, H) -> { frame(dt) }
  const SAVERS = {
    floppies(g, W, H) {
      const k = Math.min(W, H) / 600, fl = Array.from({ length: 14 }, (_, i) => ({ x: Math.random() * W * 1.5, y: Math.random() * H - H * 0.5, s: (30 + Math.random() * 30) * k, v: (60 + Math.random() * 60) * k, c: ['#202020', '#1a3a9a', '#9a1a1a', '#1a7a1a', '#c8a000'][i % 5], p: Math.random() * 6 }));
      return { frame(dt) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        for (const f of fl) {
          f.x -= f.v * dt; f.y += f.v * dt * 0.5; f.p += dt * 8;
          if (f.x < -f.s * 3 || f.y > H + f.s * 2) { f.x = W + Math.random() * W * 0.5; f.y = Math.random() * H * 0.7 - H * 0.4; }
          const s = f.s, x = f.x, y = f.y, flap = Math.sin(f.p) * s * 0.7;
          g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
          [[-1, 0], [1, s]].forEach(([d, ox]) => { g.beginPath(); g.moveTo(x + ox, y + s * 0.3); g.quadraticCurveTo(x + ox + d * s * 0.6, y - flap, x + ox + d * s * 0.9, y + s * 0.1 - flap * 0.7); g.quadraticCurveTo(x + ox + d * s * 0.5, y + s * 0.3, x + ox, y + s * 0.6); g.fill(); g.stroke(); });
          g.fillStyle = f.c; g.fillRect(x, y, s, s); g.strokeRect(x, y, s, s);
          g.fillStyle = '#bbb'; g.fillRect(x + s * 0.25, y, s * 0.5, s * 0.32); g.fillStyle = '#333'; g.fillRect(x + s * 0.55, y + s * 0.04, s * 0.12, s * 0.24);
          g.fillStyle = '#eee'; g.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.45); g.fillStyle = '#000080'; g.fillRect(x + s * 0.2, y + s * 0.6, s * 0.5, s * 0.05); g.fillRect(x + s * 0.2, y + s * 0.72, s * 0.4, s * 0.05);
        }
      } };
    },
    warp(g, W, H) {
      const st = Array.from({ length: 260 }, () => ({ x: (Math.random() - 0.5) * W, y: (Math.random() - 0.5) * H, z: Math.random() * W }));
      let t = 0;
      return { frame(dt) {
        t += dt; g.fillStyle = 'rgba(0,0,10,.35)'; g.fillRect(0, 0, W, H);
        const cx = W / 2 + Math.sin(t * 0.3) * W * 0.08, cy = H / 2 + Math.cos(t * 0.23) * H * 0.08, sp = W * (0.6 + 0.5 * Math.sin(t * 0.2) ** 2);
        for (const s of st) {
          const pz = s.z; s.z -= sp * dt; if (s.z < 1) { s.z = W; s.x = (Math.random() - 0.5) * W; s.y = (Math.random() - 0.5) * H; continue; }
          const k1 = W / 2 / pz, k2 = W / 2 / s.z, x1 = cx + s.x * k1, y1 = cy + s.y * k1, x2 = cx + s.x * k2, y2 = cy + s.y * k2;
          const hue = (t * 40 + s.z / W * 120) % 360;
          g.strokeStyle = `hsl(${hue},100%,${f1(60 + 40 * (1 - s.z / W))}%)`; g.lineWidth = Math.max(1, 3 * (1 - s.z / W));
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        }
      } };
    },
    aquarium(g, W, H) {
      const k = Math.min(W, H) / 600, fish = Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * W, y: H * (0.15 + Math.random() * 0.6), v: (40 + Math.random() * 60) * k * (i % 2 ? 1 : -1), s: (18 + Math.random() * 22) * k, c: ['#ff8c00', '#ffd400', '#e10600', '#ff6ad0', '#6cf', '#9be05a'][i % 6], p: Math.random() * 6 }));
      const bub = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (2 + Math.random() * 5) * k }));
      let t = 0;
      return { frame(dt) {
        t += dt;
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1aa0d8'); gr.addColorStop(1, '#03223a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c8a860'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.9); for (let x = 0; x <= W; x += 40) g.lineTo(x, H * 0.9 + Math.sin(x * 0.02) * 8 * k); g.lineTo(W, H); g.fill();
        g.strokeStyle = '#1a8a3a'; g.lineWidth = 8 * k; g.lineCap = 'round';
        for (let i = 0; i < 7; i++) { const x = (i + 0.5) * W / 7; g.beginPath(); g.moveTo(x, H * 0.92); for (let j = 1; j < 6; j++) g.lineTo(x + Math.sin(t * 1.5 + i + j * 0.8) * 10 * k, H * 0.92 - j * 34 * k); g.stroke(); }
        for (const f of fish) {
          f.x += f.v * dt; f.p += dt * 6; if (f.x > W + 60) f.x = -60; if (f.x < -60) f.x = W + 60;
          const d = f.v > 0 ? 1 : -1, y = f.y + Math.sin(f.p * 0.3) * 10 * k;
          g.save(); g.translate(f.x, y); g.scale(d, 1); g.fillStyle = f.c; g.strokeStyle = '#000'; g.lineWidth = 1.5;
          g.beginPath(); g.ellipse(0, 0, f.s, f.s * 0.55, 0, 0, 7); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(-f.s * 0.9, 0); g.lineTo(-f.s * 1.6, -f.s * 0.5 + Math.sin(f.p) * 4); g.lineTo(-f.s * 1.6, f.s * 0.5 + Math.sin(f.p) * 4); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#000'; g.beginPath(); g.arc(f.s * 0.5, -f.s * 0.12, f.s * 0.1, 0, 7); g.fill(); g.restore();
        }
        g.strokeStyle = 'rgba(220,250,255,.7)'; g.lineWidth = 1.5;
        for (const b of bub) { b.y -= (30 + b.r * 6) * dt; b.x += Math.sin(t * 2 + b.r) * 0.4; if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; } g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); }
      } };
    },
    lava(g, W, H) {
      const sw = Math.max(40, Math.round(W / 8)), sh = Math.max(30, Math.round(H / 8)), off = document.createElement('canvas'); off.width = sw; off.height = sh;
      const og = off.getContext('2d'), img = og.createImageData(sw, sh), d = img.data;
      const bl = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * sw, y: Math.random() * sh, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 6, r: sh * (0.08 + Math.random() * 0.08) }));
      return { frame(dt) {
        for (const b of bl) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < 0 || b.x > sw) b.vx *= -1; if (b.y < 0 || b.y > sh) b.vy *= -1; }
        for (let y = 0, p = 0; y < sh; y++) for (let x = 0; x < sw; x++, p += 4) {
          let v = 0; for (const b of bl) { const dx = x - b.x, dy = y - b.y; v += b.r * b.r / (dx * dx + dy * dy + 1); }
          if (v > 1) { d[p] = 255; d[p + 1] = Math.min(255, 60 + v * 40); d[p + 2] = 20; } else { d[p] = 40 + v * 80; d[p + 1] = 0; d[p + 2] = 60 + v * 60; } d[p + 3] = 255;
        }
        og.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
      } };
    },
    orkraid(g, W, H) {
      const k = Math.min(W, H) / 600, planes = Array.from({ length: 6 }, (_, i) => ({ x: -Math.random() * W, y: H * (0.1 + i * 0.13), v: (90 + Math.random() * 90) * k, s: (0.7 + Math.random() * 0.6) * k, p: 0 }));
      const puffs = [];
      return { frame(dt) {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5a8ad8'); gr.addColorStop(1, '#c8e0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = '#3a6a1a'; g.fillRect(0, H * 0.9, W, H * 0.1);
        for (const p of planes) {
          p.x += p.v * dt; p.p += dt * 40; if (p.x > W + 200 * k) { p.x = -200 * k - Math.random() * W * 0.5; }
          if (Math.random() < dt * 4) puffs.push({ x: p.x - 50 * p.s, y: p.y + 5, r: 6 * p.s, a: 1 });
          g.save(); g.translate(p.x, p.y + Math.sin(p.x * 0.02) * 6); g.scale(p.s, p.s); g.strokeStyle = '#000'; g.lineWidth = 2;
          const fl = 10 + Math.sin(p.p * 3) * 5; g.fillStyle = '#ffb000'; g.beginPath(); g.moveTo(-50, -4); g.lineTo(-62 - fl, 2); g.lineTo(-50, 8); g.fill(); g.fillStyle = '#fff6a0'; g.beginPath(); g.moveTo(-50, -1); g.lineTo(-56 - fl * 0.5, 2); g.lineTo(-50, 5); g.fill();
          g.fillStyle = '#7a3a18'; g.beginPath(); g.moveTo(-10, 4); g.lineTo(-38, 26); g.lineTo(-22, 26); g.lineTo(18, 6); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#a8582a'; g.beginPath(); g.moveTo(-50, -6); g.lineTo(30, -10); g.quadraticCurveTo(58, -6, 62, 2); g.quadraticCurveTo(58, 10, 30, 12); g.lineTo(-50, 10); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#c87040'; g.fillRect(-46, -6, 70, 4); g.fillStyle = '#6a3010'; g.beginPath(); g.arc(-20, 4, 5, 0, 7); g.arc(8, 6, 3, 0, 7); g.fill();
          g.fillStyle = '#d8a070'; for (const rx of [-40, -28, -16, -4, 8, 20]) { g.beginPath(); g.arc(rx, 8, 1.5, 0, 7); g.fill(); }
          g.fillStyle = '#a8582a'; g.beginPath(); g.moveTo(-50, -6); g.lineTo(-58, -26); g.lineTo(-44, -26); g.lineTo(-32, -7); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#ffd400'; g.fillRect(-55, -24, 9, 4);
          g.fillStyle = 'rgba(190,240,255,.85)'; g.beginPath(); g.ellipse(26, -9, 14, 10, 0, Math.PI, 0); g.fill(); g.stroke();
          g.fillStyle = '#9a9aa8'; g.fillRect(20, -16, 11, 9); g.strokeRect(20, -16, 11, 9); g.fillStyle = '#ffd400'; g.fillRect(22, -13, 3, 3); g.fillRect(27, -13, 3, 3); g.strokeStyle = '#333'; g.beginPath(); g.moveTo(25, -16); g.lineTo(25, -21); g.stroke(); g.fillStyle = '#e10600'; g.beginPath(); g.arc(25, -22, 1.8, 0, 7); g.fill();
          g.strokeStyle = '#000'; g.fillStyle = '#fff'; g.lineWidth = 1; const msg = p.msg || (p.msg = ['BEEP BOOP!', 'EAT MY BOLTS', 'HONK HONK', 'OIL CHANGE?', 'RUST IN PEACE', 'NEEDS WD-40'][Math.floor(Math.random() * 6)]);
          g.font = 'bold 14px Impact, Arial Black, sans-serif'; const tw = g.measureText(msg).width + 16; g.fillRect(-70 - tw - 20, -10, tw, 22); g.strokeRect(-70 - tw - 20, -10, tw, 22); g.beginPath(); g.moveTo(-90, 1); g.lineTo(-52, 2); g.stroke();
          g.fillStyle = '#e10600'; g.fillText(msg, -70 - tw - 12, 6); g.restore();
        }
        for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.a -= dt * 0.6; q.r += dt * 10 * k; if (q.a <= 0) { puffs.splice(i, 1); continue; } g.fillStyle = `rgba(90,90,90,${f1(q.a * 0.6)})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      } };
    },
    saucer(g, W, H) {
      const k = Math.min(W, H) / 600, st = Array.from({ length: 120 }, () => [Math.random() * W, Math.random() * H * 0.7, Math.random()]);
      let t = 0, cows = [{ x: W * 0.3, up: 0 }, { x: W * 0.6, up: 0 }, { x: W * 0.8, up: 0 }], target = 0;
      return { frame(dt) {
        t += dt; g.fillStyle = '#020a04'; g.fillRect(0, 0, W, H);
        for (const s of st) { g.fillStyle = `rgba(255,255,255,${f1(0.3 + 0.7 * Math.abs(Math.sin(t + s[2] * 9)))})`; g.fillRect(s[0], s[1], 2, 2); }
        g.fillStyle = '#0a2a0a'; g.fillRect(0, H * 0.82, W, H);
        const c = cows[target % cows.length], ux = c.x + Math.sin(t * 0.7) * 30 * k, uy = H * 0.3 + Math.sin(t * 1.3) * 10 * k;
        const beam = (Math.sin(t * 0.6) + 1) / 2 > 0.4;
        if (beam) { g.fillStyle = 'rgba(224,255,154,.25)'; g.beginPath(); g.moveTo(ux - 20 * k, uy); g.lineTo(ux + 20 * k, uy); g.lineTo(c.x + 70 * k, H * 0.86); g.lineTo(c.x - 70 * k, H * 0.86); g.fill(); c.up = Math.min(1, c.up + dt * 0.12); }
        else c.up = Math.max(0, c.up - dt * 0.5);
        if (c.up >= 1) { c.up = 0; target++; }
        cows.forEach(cw => { const cy = H * 0.84 - cw.up * (H * 0.84 - uy - 30 * k); g.save(); g.translate(cw.x, cy); g.scale(k, k); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.fillRect(-25, -18, 50, 26); g.strokeRect(-25, -18, 50, 26); g.fillStyle = '#000'; g.fillRect(-12, -14, 12, 10); g.fillRect(-25, 8, 6, 14); g.fillRect(19, 8, 6, 14); g.fillStyle = '#fff'; g.fillRect(25, -24, 14, 14); g.strokeRect(25, -24, 14, 14); g.restore(); });
        g.save(); g.translate(ux, uy); g.scale(k, k); g.fillStyle = '#9aa0a8'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 90, 22, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = 'rgba(190,240,255,.9)'; g.beginPath(); g.ellipse(0, -10, 40, 30, 0, Math.PI, 0); g.fill(); g.stroke();
        ['#ff0', '#0f0', '#f0f', '#0ff', '#f80'].forEach((col, i) => { g.fillStyle = (Math.floor(t * 6) + i) % 2 ? col : '#333'; g.beginPath(); g.arc(-60 + i * 30, 6, 5, 0, 7); g.fill(); });
        g.restore();
      } };
    },
  };

  // ================================================================ TrueType fonts, built in the browser
  // glyphs: [{ u: codepoint, adv, c: [ [[x,y],...] clockwise contours, y up ] }]
  function buildTTF(o) {
    const UPM = 1000, ASC = o.asc || 800, DESC = o.desc || -200;
    const G = [{ adv: 500, c: [] }, { u: 32, adv: o.space || 400, c: [] }].concat(o.glyphs.filter(g => g.u !== 32).sort((a, b) => a.u - b.u));
    const B = () => { const a = []; const w = { a, u8: v => a.push(v & 255), u16: v => a.push((v >> 8) & 255, v & 255), i16: v => w.u16(v < 0 ? v + 65536 : v), u32: v => a.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255), tag: s => [...s].forEach(ch => a.push(ch.charCodeAt(0))) }; return w; };
    // glyf + loca
    const glyf = B(), loca = [];
    let maxPts = 0, maxCont = 0, gx0 = 0, gy0 = 0, gx1 = 0, gy1 = 0, minLsb = 0, minRsb = 0, maxExt = 0, advMax = 0, first = true;
    const bbox = [];
    G.forEach((g, gi) => {
      loca.push(glyf.a.length);
      advMax = Math.max(advMax, g.adv);
      if (!g.c.length) { bbox.push([0, 0, 0, 0]); return; }
      const pts = [].concat(...g.c).map(p => [Math.round(p[0]), Math.round(p[1])]);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; bbox.push(bb);
      if (first) { first = false; gx0 = bb[0]; gy0 = bb[1]; gx1 = bb[2]; gy1 = bb[3]; }
      gx0 = Math.min(gx0, bb[0]); gy0 = Math.min(gy0, bb[1]); gx1 = Math.max(gx1, bb[2]); gy1 = Math.max(gy1, bb[3]);
      minLsb = Math.min(minLsb, bb[0]); minRsb = Math.min(minRsb, g.adv - bb[2]); maxExt = Math.max(maxExt, bb[2]);
      maxPts = Math.max(maxPts, pts.length); maxCont = Math.max(maxCont, g.c.length);
      glyf.i16(g.c.length); bb.forEach(v => glyf.i16(v));
      let end = -1; g.c.forEach(c => { end += c.length; glyf.u16(end); });
      glyf.u16(0); // no instructions
      pts.forEach(() => glyf.u8(1)); // on-curve, 2-byte coords
      let lx = 0; pts.forEach(p => { glyf.i16(p[0] - lx); lx = p[0]; });
      let ly = 0; pts.forEach(p => { glyf.i16(p[1] - ly); ly = p[1]; });
      while (glyf.a.length % 4) glyf.u8(0);
    });
    loca.push(glyf.a.length);
    const lc = B(); loca.forEach(v => lc.u32(v));
    const n = G.length;
    // head
    const head = B(); head.u32(0x00010000); head.u32(0x00010000); head.u32(0); head.u32(0x5F0F3CF5); head.u16(0x000B); head.u16(UPM);
    for (let i = 0; i < 4; i++) head.u32(i % 2 ? 0xB4D9A000 : 0); // created / modified (somewhere in 1999-ish, who's counting)
    [gx0, gy0, gx1, gy1].forEach(v => head.i16(v)); head.u16(0); head.u16(8); head.i16(2); head.i16(1); head.i16(0);
    // hhea
    const hhea = B(); hhea.u32(0x00010000); hhea.i16(ASC); hhea.i16(DESC); hhea.i16(0); hhea.u16(advMax); hhea.i16(minLsb); hhea.i16(minRsb); hhea.i16(maxExt); hhea.i16(1); hhea.i16(0); hhea.i16(0);
    for (let i = 0; i < 4; i++) hhea.i16(0); hhea.i16(0); hhea.u16(n);
    // hmtx
    const hmtx = B(); G.forEach((g, i) => { hmtx.u16(g.adv); hmtx.i16(bbox[i][0]); });
    // maxp
    const maxp = B(); maxp.u32(0x00010000); maxp.u16(n); maxp.u16(maxPts); maxp.u16(maxCont); maxp.u16(0); maxp.u16(0); maxp.u16(2); for (let i = 0; i < 8; i++) maxp.u16(0); maxp.u16(0);
    // OS/2 (version 4)
    const us = G.filter(g => g.u != null).map(g => g.u), avg = Math.round(G.reduce((t, g) => t + g.adv, 0) / n);
    const os2 = B(); os2.u16(4); os2.i16(avg); os2.u16(400); os2.u16(5); os2.u16(0);
    [650, 600, 0, 75, 650, 600, 0, 350].forEach(v => os2.i16(v)); os2.i16(50); os2.i16(250); os2.i16(0);
    for (let i = 0; i < 10; i++) os2.u8(0);
    os2.u32(1); os2.u32(0); os2.u32(0); os2.u32(0); os2.tag('JACK'); os2.u16(0x40); os2.u16(Math.min(...us)); os2.u16(Math.max(...us));
    os2.i16(ASC); os2.i16(DESC); os2.i16(0); os2.u16(Math.max(ASC, gy1)); os2.u16(Math.max(-DESC, -gy0)); os2.u32(1); os2.u32(0); os2.i16(o.xh || 500); os2.i16(o.cap || 700); os2.u16(0); os2.u16(32); os2.u16(1);
    // name
    const ps = o.family.replace(/[^A-Za-z0-9]/g, '') + '-Regular';
    const NAMES = [[0, 'Made with JackOS Font Kit 99. Free for personal use. (c) 1999 Desktop Dazzle'], [1, o.family], [2, 'Regular'], [3, 'JackOS:' + o.family + ':1999'], [4, o.family], [5, 'Version 1.99'], [6, ps]];
    const name = B(), strs = B(); name.u16(0); name.u16(NAMES.length); name.u16(6 + NAMES.length * 12);
    NAMES.forEach(([id, s]) => { const off = strs.a.length; [...s].forEach(ch => strs.u16(ch.charCodeAt(0))); name.u16(3); name.u16(1); name.u16(0x409); name.u16(id); name.u16(s.length * 2); name.u16(off); });
    name.a.push(...strs.a);
    // cmap (format 4)
    const map = G.map((g, i) => [g.u, i]).filter(x => x[0] != null && x[0] < 0xFFFF).sort((a, b) => a[0] - b[0]);
    const segs = [];
    map.forEach(([u, gi]) => { const s = segs[segs.length - 1]; if (s && u === s.end + 1 && gi === s.g + (u - s.start)) s.end = u; else segs.push({ start: u, end: u, g: gi }); });
    segs.push({ start: 0xFFFF, end: 0xFFFF, g: 1, last: true });
    const sc = segs.length, sr = 2 * Math.pow(2, Math.floor(Math.log2(sc))), es = Math.log2(sr / 2);
    const sub = B(); sub.u16(4); sub.u16(16 + sc * 8); sub.u16(0); sub.u16(sc * 2); sub.u16(sr); sub.u16(es); sub.u16(sc * 2 - sr);
    segs.forEach(s => sub.u16(s.end)); sub.u16(0); segs.forEach(s => sub.u16(s.start));
    segs.forEach(s => sub.u16(s.last ? 1 : (s.g - s.start + 65536) % 65536)); segs.forEach(() => sub.u16(0));
    const cmap = B(); cmap.u16(0); cmap.u16(1); cmap.u16(3); cmap.u16(1); cmap.u32(12); cmap.a.push(...sub.a);
    // post (version 3: no glyph names)
    const post = B(); post.u32(0x00030000); post.u32(0); post.i16(-100); post.i16(50); post.u32(0); post.u32(0); post.u32(0); post.u32(0); post.u32(0);
    // the font file
    const T = [['OS/2', os2], ['cmap', cmap], ['glyf', glyf], ['head', head], ['hhea', hhea], ['hmtx', hmtx], ['loca', lc], ['maxp', maxp], ['name', name], ['post', post]];
    const nt = T.length, esr = 16 * Math.pow(2, Math.floor(Math.log2(nt)));
    let off = 12 + nt * 16; const recs = [];
    const sum = a => { let s = 0; for (let i = 0; i < a.length; i += 4) s = (s + ((a[i] << 24) | ((a[i + 1] || 0) << 16) | ((a[i + 2] || 0) << 8) | (a[i + 3] || 0))) >>> 0; return s; };
    T.forEach(([tag, t]) => { const len = t.a.length; const pad = t.a.slice(); while (pad.length % 4) pad.push(0); recs.push({ tag, len, off, data: pad, ck: sum(pad) }); off += pad.length; });
    const out = B(); out.u32(0x00010000); out.u16(nt); out.u16(esr); out.u16(Math.log2(esr / 16)); out.u16(nt * 16 - esr);
    recs.forEach(r => { out.tag(r.tag); out.u32(r.ck); out.u32(r.off); out.u32(r.len); });
    recs.forEach(r => out.a.push(...r.data));
    const all = new Uint8Array(out.a), adj = (0xB1B0AFBA - sum(out.a)) >>> 0, ho = recs.find(r => r.tag === 'head').off + 8;
    all[ho] = adj >>> 24; all[ho + 1] = (adj >>> 16) & 255; all[ho + 2] = (adj >>> 8) & 255; all[ho + 3] = adj & 255;
    return all.buffer;
  }
  // a rectangle as a clockwise contour (y up)
  const rect = (x, y, w, h) => [[x, y], [x, y + h], [x + w, y + h], [x + w, y]];
  const area = c => { let a = 0; for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const cw = c => area(c) > 0 ? c.slice().reverse() : c;
  // bitmap rows ('#' = ink, top row first) -> merged horizontal runs
  function bitmapGlyph(rows, px, ox, oy) {
    const out = [], h = rows.length;
    rows.forEach((r, j) => { let x = 0; while (x < r.length) { if (r[x] !== '#') { x++; continue; } let e = x; while (e < r.length && r[e] === '#') e++; out.push(rect(ox + x * px, oy + (h - 1 - j) * px, (e - x) * px, px)); x = e; } });
    return out;
  }
  // ---- Blocky 8-Bit: a 5x7 pixel font
  const PIX = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....', G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#', S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '#####|...#.|..#..|...#.|....#|#...#|.###.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.', 6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
    '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    '-': '.....|.....|.....|#####|.....|.....|.....', ':': '.....|.##..|.##..|.....|.##..|.##..|.....', ';': '.....|.##..|.##..|.....|.##..|..#..|.#...', "'": '..#..|..#..|.#...|.....|.....|.....|.....',
    '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.', ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...', '/': '....#|....#|...#.|..#..|.#...|#....|#....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....', '=': '.....|.....|#####|.....|#####|.....|.....', '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....', '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
    '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.####', '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '%': '##...|##..#|...#.|..#..|.#...|#..##|...##', '$': '..#..|.####|#.#..|.###.|..#.#|####.|..#..',
    '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.', '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...', _: '.....|.....|.....|.....|.....|.....|#####', '£': '..##.|.#..#|.#...|###..|.#...|.#..#|#####',
  };
  function pixelFont() {
    const glyphs = [];
    for (const [ch, s] of Object.entries(PIX)) {
      const c = bitmapGlyph(s.split('|'), 100, 50, 0);
      glyphs.push({ u: ch.charCodeAt(0), adv: 600, c });
      if (/[A-Z]/.test(ch)) glyphs.push({ u: ch.toLowerCase().charCodeAt(0), adv: 600, c });
    }
    return buildTTF({ family: 'Blocky 8-Bit', glyphs, space: 500, asc: 800, desc: -200, cap: 700, xh: 700 });
  }
  // ---- Wingdingz: little pictures instead of letters (8x8)
  const DING = {
    A: '......##|....####|...####.|..##.##.|.#####..|###.#...|##......|#.......', B: '########|#.####.#|#.####.#|#......#|#......#|#.####.#|#.#..#.#|########',
    C: '#######.|#.#.#.#.|#######.|#.#.#.#.|#######.|#.#.#.#.|#######.|........', D: '....###.|....#.##|....####|#..###..|######..|.#####..|..#..#..|..#..#..',
    E: '........|########|##....##|#.#..#.#|#..##..#|#......#|########|........', F: '........|...###..|#.#####.|####.###|########|#.#####.|...###..|........',
    G: '..####..|.######.|##.##.##|##.##.##|########|########|########|#.#..#.#', H: '.##..##.|########|########|########|.######.|..####..|...##...|........',
    I: '...##...|..####..|.######.|.######.|..####..|..#..#..|...##...|...##...', J: '...##...|...##...|....#...|....#...|..####..|.######.|########|########',
    K: '.###....|##.##...|#...####|##.##.##|.###..#.|........|........|........', L: '....###.|...###..|..###...|.######.|...###..|..###...|.##.....|#.......',
    M: '..#.....|...#....|.####...|#.#..#..|#.#..#..|######..|######..|.####...', N: '..######|..#....#|..#....#|..#....#|###..###|###..###|###..###|........',
    O: '#......#|########|##.##.##|########|#.####.#|#..##..#|.######.|..####..', P: '...###..|..#####.|########|#.#####.|..#####.|...###..|........|........',
    Q: '.######.|##....##|.....##.|....##..|...##...|...##...|........|...##...', R: '...##...|..####..|..#..#..|..####..|..####..|.######.|##.##.##|#..##..#',
    S: '...##...|...##...|########|.######.|..####..|.######.|.##..##.|##....##', T: '........|.######.|.######.|...##...|...##...|........|........|........',
    U: '........|...##...|..####..|########|#.#.#.##|########|..#..#..|.#....#.', V: '..#..#..|...##...|..####..|.##..##.|########|#.####.#|#.#..#.#|...##...',
    W: '#..##..#|.#....#.|..####..|#.####.#|#.####.#|..####..|.#....#.|#..##..#', X: '.....#.#|....#.#.|..###...|.#####..|###.###.|#######.|.#####..|..###...',
    Y: '..####..|.#....#.|#.#..#.#|#......#|#.#..#.#|#..##..#|.#....#.|..####..', Z: '#####...|...#....|..#.....|.#......|#####...|.....###|......#.|.....###',
    0: '########|#......#|#......#|#......#|#......#|#......#|#......#|########', 1: '########|#......#|#.####.#|#.####.#|#......#|########|...##...|.######.',
    2: '..####..|.#....#.|#..##..#|#.#..#.#|#..##..#|#......#|.#....#.|..####..', 3: '..####..|.#..#.#.|#...#..#|#...#..#|#....#.#|#......#|.#....#.|..####..',
    4: '...##...|..####..|.######.|########|.#....#.|.#.##.#.|.#.##.#.|.######.', 5: '...##...|..####..|.######.|..####..|.######.|########|...##...|...##...',
    6: '#.....#.|##...##.|#######.|#.#.#.#.|#######.|.#####..|..###...|........', 7: '..###...|.##.....|##......|##......|##......|.##.....|..###...|........',
    8: '........|#..##..#|##.##.##|########|########|########|........|........', 9: '#.......|#######.|#######.|#######.|#.......|#.......|#.......|#.......',
  };
  function dingFont() {
    const glyphs = [];
    for (const [ch, s] of Object.entries(DING)) { const c = bitmapGlyph(s.split('|'), 100, 50, -50); glyphs.push({ u: String(ch).charCodeAt(0), adv: 900, c }); if (/[A-Z]/.test(ch)) glyphs.push({ u: ch.toLowerCase().charCodeAt(0), adv: 900, c }); }
    return buildTTF({ family: 'Wingdingz', glyphs, space: 500, asc: 800, desc: -200, cap: 750, xh: 750 });
  }
  // ---- Comic Squigs: a wobbly hand-lettered comic font, from strokes on a 4x6 grid
  const O_ = [[1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 1], [3, 0], [1, 0]];
  const P_ = [[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]];
  const STROKE = {
    A: [[[0, 0], [2, 6], [4, 0]], [[0.7, 2], [3.3, 2]]], B: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [0, 0]]],
    C: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1]]], D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
    E: [[[4, 6], [0, 6], [0, 0], [4, 0]], [[0, 3], [3, 3]]], F: [[[4, 6], [0, 6], [0, 0]], [[0, 3], [3, 3]]], G: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [2, 3]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]], I: [[[1, 6], [3, 6]], [[2, 6], [2, 0]], [[1, 0], [3, 0]]], J: [[[1, 6], [4, 6]], [[3, 6], [3, 1], [2, 0], [1, 0], [0, 1]]],
    K: [[[0, 0], [0, 6]], [[4, 6], [0, 2.5]], [[1.3, 3.6], [4, 0]]], L: [[[0, 6], [0, 0], [4, 0]]], M: [[[0, 0], [0, 6], [2, 3], [4, 6], [4, 0]]], N: [[[0, 0], [0, 6], [4, 0], [4, 6]]],
    O: [O_], P: [P_], Q: [O_, [[2.5, 1.5], [4.2, -0.4]]], R: [P_, [[2, 3], [4, 0]]], S: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [1, 3], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],
    T: [[[0, 6], [4, 6]], [[2, 6], [2, 0]]], U: [[[0, 6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 6]]], V: [[[0, 6], [2, 0], [4, 6]]], W: [[[0, 6], [1, 0], [2, 4], [3, 0], [4, 6]]],
    X: [[[0, 6], [4, 0]], [[4, 6], [0, 0]]], Y: [[[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]], Z: [[[0, 6], [4, 6], [0, 0], [4, 0]]],
    0: [O_, [[0.8, 1], [3.2, 5]]], 1: [[[1, 5], [2, 6], [2, 0]], [[1, 0], [3, 0]]], 2: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [0, 0], [4, 0]]],
    3: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1.5, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]], 4: [[[3, 0], [3, 6], [0, 2], [4, 2]]],
    5: [[[4, 6], [0, 6], [0, 3.5], [3, 3.5], [4, 2.5], [4, 1], [3, 0], [0, 0]]], 6: [[[3.5, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2.5], [3, 3.5], [0, 3.5]]],
    7: [[[0, 6], [4, 6], [1.5, 0]]], 8: [[[1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3]]],
    9: [[[4, 2.5], [1, 2.5], [0, 3.5], [0, 5], [1, 6], [3, 6], [4, 5], [4, 1], [3, 0], [0.5, 0]]],
    '!': [[[2, 6], [2, 2]], [[2, 0.2], [2, 0]]], '?': [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [2, 2.6], [2, 1.7]], [[2, 0.2], [2, 0]]], '.': [[[2, 0.2], [2, 0]]], ',': [[[2, 0.5], [1.4, -1]]],
    "'": [[[2, 6], [2, 4.6]]], '"': [[[1.3, 6], [1.3, 4.6]], [[2.7, 6], [2.7, 4.6]]], '-': [[[0.8, 3], [3.2, 3]]], ':': [[[2, 4], [2, 3.8]], [[2, 0.2], [2, 0]]],
    '(': [[[3, 6.5], [1.8, 5], [1.5, 3], [1.8, 1], [3, -0.5]]], ')': [[[1, 6.5], [2.2, 5], [2.5, 3], [2.2, 1], [1, -0.5]]], '+': [[[2, 1.2], [2, 4.8]], [[0.2, 3], [3.8, 3]]],
    '=': [[[0.5, 2.2], [3.5, 2.2]], [[0.5, 3.8], [3.5, 3.8]]], '/': [[[0, 0], [4, 6]]], '*': [[[2, 1.5], [2, 4.5]], [[0.7, 2.2], [3.3, 3.8]], [[0.7, 3.8], [3.3, 2.2]]],
  };
  function strokeGlyph(strokes, sx, sy, seed) {
    const r = rnd(seed), HW = 46, out = [], L = 70;
    const J = v => v + (r() - 0.5) * 22;
    strokes.forEach(st => {
      const pts = st.map(([x, y]) => [J(L + x * sx), J(y * sy)]);
      pts.forEach(p => { const k = 8, o = []; for (let i = 0; i < k; i++) { const a = -i / k * Math.PI * 2 + Math.PI / 8; o.push([p[0] + Math.cos(a) * HW * 1.02, p[1] + Math.sin(a) * HW * 1.02]); } out.push(cw(o)); });
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [pts[i - 1], pts[i]], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 2) continue;
        const nx = -dy / len * HW, ny = dx / len * HW;
        out.push(cw([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]));
      }
    });
    return out;
  }
  function comicFont() {
    const glyphs = [];
    let i = 0;
    for (const [ch, st] of Object.entries(STROKE)) {
      const code = String(ch).charCodeAt(0); i++;
      glyphs.push({ u: code, adv: 650, c: strokeGlyph(st, 115, 112, code * 7 + 3) });
      if (/[A-Z]/.test(ch)) glyphs.push({ u: ch.toLowerCase().charCodeAt(0), adv: 560, c: strokeGlyph(st, 92, 85, code * 13 + 5) });
    }
    return buildTTF({ family: 'Comic Squigs', glyphs, space: 380, asc: 820, desc: -200, cap: 680, xh: 520 });
  }
  const FONTS = { comic: comicFont, pixel: pixelFont, ding: dingFont };

  window.BridgeDLArt = { WALLS, CURSORS, cursorFrames, SAVERS, FONTS, buildTTF };
})();

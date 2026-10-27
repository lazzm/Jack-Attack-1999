/* pm-art: the 3D models of Jack's physical media (js/pm-room.js puts them in the room). Every model is CSS 3D: flat faces
 * (.rm-f.pmd-f) in a group, sized in em (1 em is about 1 cm, like the rest of the room), drawn with original SVG art. The
 * models are built "front on": the front faces +z, x is the width, y goes down. Hinged parts (a game box's front flap,
 * a jewel case's lid) are their own groups with a pivot, and the disc is always its own group, so it can be lifted out.
 *   PMArt.model(item, { lite })   -> { el, w, h, d, lid?, disc?, kind, faces[] }   lite: just what shows on the shelf
 *   PMArt.disc(item)              -> a loose disc { el, ... } (12 em across, label towards +z)
 *   PMArt.setLid(m, a)            open a hinge 0..1   PMArt.shade(m, matrix)  light the faces for the way it's turned
 * Art: game fronts come from js/discs.js (Discs.front), the mags from js/cx-mag.js (CXMag.cover); spines, backs, disc
 * labels, inlays, floppies and our own discs are drawn here. */
(function () {
  'use strict';
  const D = window.Discs, PM = window.PM; if (!D || !PM || window.PMArt) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const f2 = v => +(+v).toFixed(3);
  let UID = 0; const uid = () => 'pma' + (++UID);
  const svg = (vb, body, cls) => `<svg viewBox="${vb}" preserveAspectRatio="none" class="pmd-svg${cls ? ' ' + cls : ''}" aria-hidden="true">${body}</svg>`;
  const T = (x, y, s, size, fill, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${String(o.f || 'Anton,Impact,\'Arial Narrow\',sans-serif').replace(/"/g, "'")}" font-size="${size}" font-weight="${o.w || 400}" fill="${fill}"${o.st ? ` stroke="${o.st}" stroke-width="${o.sw || 1}" paint-order="stroke" stroke-linejoin="round"` : ''} text-anchor="${o.a || 'middle'}"${o.t ? ` transform="${o.t}"` : ''}${o.ls != null ? ` letter-spacing="${o.ls}"` : ''}${o.len ? ` textLength="${o.len}" lengthAdjust="spacingAndGlyphs"` : ''}${o.it ? ' font-style="italic"' : ''}${o.op ? ` opacity="${o.op}"` : ''}>${esc(s)}</text>`; };
  const SANS = 'Verdana,Tahoma,Arial,sans-serif', HAND = '"Segoe Print","Bradley Hand","Comic Sans MS","Chalkboard SE","Marker Felt",cursive', BLACK = '"Arial Black",Arial,sans-serif';
  // shade a hex colour (k < 0 darker, k > 0 lighter)
  function tint(hex, k) {
    let c = String(hex || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16) || 0, r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return '#' + [f(r), f(g), f(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  const lum = hex => { const c = String(hex || '#888').replace('#', ''), n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16) || 0; return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
  const ink = hex => lum(hex) > 0.6 ? '#111' : '#fff';
  // wrap text into lines of about n characters
  function wrap(s, n) { const out = []; let line = ''; for (const w of String(s).split(/\s+/)) { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; }
  const pubOf = it => { try { return it.box ? D.byOf(it.box) : ''; } catch (e) { return ''; } };
  const initials = s => String(s || 'JS').split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'J';
  const age = it => (it.box && it.box.age) || '3+';
  const isDemo = it => { try { return it.box ? D.demoBox(it.box) : false; } catch (e) { return false; } };

  // ================================================================ art: game boxes
  const ageBadge = (x, y, s, a) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-10" y="-12" width="20" height="24" rx="1.5" fill="#fff" stroke="#000" stroke-width="1.2"/><rect x="-10" y="-12" width="20" height="6" fill="#000"/>${T(0, -7.4, 'AGES', 4.2, '#fff', { f: BLACK })}${T(0, 8, a, a.length > 2 ? 9 : 11, '#000', { f: BLACK })}</g>`;
  const cdMark = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="7" fill="none" stroke="${col}" stroke-width="1.4"/><circle r="2" fill="${col}"/><path d="M-4.4-3.2a5.5 5.5 0 0 1 4-2.3" stroke="${col}" stroke-width=".9" fill="none" opacity=".7"/>${T(16, 2.4, 'CD-ROM', 6.4, col, { f: BLACK, ls: 0.2 })}</g>`;
  function spineBig(it) { // 50 x 240, read bottom to top (UK)
    const b = it.box || {}, c1 = it.c1 || '#333', c2 = it.c2 || '#fff', c3 = it.c3 || '#e10600', id = uid();
    const t = it.title.replace(/ \(.*\)$/, '').toUpperCase(), len = t.length * 11.5;
    const pub = pubOf(it);
    return svg('0 0 50 240', `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${tint(c1, -0.35)}"/><stop offset=".22" stop-color="${tint(c1, 0.08)}"/><stop offset=".6" stop-color="${c1}"/><stop offset="1" stop-color="${tint(c1, -0.45)}"/></linearGradient></defs>
      <rect width="50" height="240" fill="url(#${id})"/><rect y="0" width="50" height="30" fill="${c3}"/><rect y="29" width="50" height="1.6" fill="${c2}"/>
      <rect x="11" y="5" width="28" height="20" rx="3" fill="#fff"/>${T(25, 19.5, initials(pub), 12, c3, { f: BLACK })}
      ${T(0, 0, t, t.length > 16 ? 19 : 22, c2, { t: 'translate(31.5 108) rotate(-90)', len: len > 138 ? 138 : 0, ls: 0.5, st: tint(c1, -0.6), sw: 1.6 })}
      ${isDemo(it) ? `<rect x="2" y="168" width="46" height="11" fill="#e10600"/>${T(25, 176.5, 'DEMO', 8, '#fff', { f: BLACK })}` : ''}
      ${ageBadge(25, 196, 0.9, age(it))}<rect y="214" width="50" height="26" fill="#0c0c0c"/>${cdMark(9, 227, 0.75, '#fff')}${it.owner ? `<g transform="rotate(-6 25 14)"><rect x="1" y="4" width="48" height="21" fill="#fff36a" stroke="#c8a000" stroke-width=".8"/>${T(25, 13.5, it.owner.toUpperCase() + '\'S', 8.4, '#c00000', { f: HAND, w: 700, len: it.owner.length > 6 ? 44 : 0 })}${T(25, 22, 'GIVE IT BACK', 5.4, '#c00000', { f: HAND, w: 700 })}</g>` : ''}`);
  }
  function topBig(it) { // 190 x 50
    const c1 = it.c1 || '#333', c2 = it.c2 || '#fff';
    return svg('0 0 190 50', `<rect width="190" height="50" fill="${tint(c1, -0.1)}"/>${T(95, 30, it.title.replace(/ \(.*\)$/, '').toUpperCase(), 17, c2, { len: Math.min(150, 20 + it.title.length * 8) })}${T(95, 44, 'PC CD-ROM', 7, ink(c1), { f: BLACK, ls: 2, op: 0.75 })}`);
  }
  function edgeBig(it, w, h) { const c1 = it.c1 || '#333', t = it.title.replace(/ \(.*\)$/, '').toUpperCase(); return svg(`0 0 ${w} ${h}`, `<rect width="${w}" height="${h}" fill="${tint(c1, -0.25)}"/>${h > w ? T(0, 0, t, 18, tint(it.c2 || '#fff', -0.15), { t: `translate(${w / 2 + 6} ${h / 2}) rotate(90)`, len: Math.min(h - 40, t.length * 11), op: 0.85 }) : T(w / 2, h / 2 + 6, t, 16, tint(it.c2 || '#fff', -0.15), { len: Math.min(w - 30, t.length * 10), op: 0.85 })}`); }
  function backBig(it) { // 190 x 240
    const b = it.box || {}, g = b.game ? D.GAMES[b.game] : null, c1 = it.c1 || '#222', c2 = it.c2 || '#fff', c3 = it.c3 || '#e10600', id = uid();
    const shots = (b.scene && D.SHOT && D.SHOT[b.scene]) ? [0, 1, 2].map(i => { try { return D.SHOT[b.scene](i); } catch (e) { return ''; } }) : [];
    const blurb = wrap(b.blurb || '', 44).slice(0, 6), feats = (b.feats || []).slice(0, 4);
    const req = g ? g.req : 'Pent-Yum 133, 16 MB RAM, 4x CD-ROM';
    const bars = Array.from({ length: 30 }, (_, i) => `<rect x="${i * 1.7}" y="0" width="${[0.6, 1, 0.5, 1.2][(i * 7) % 4]}" height="${i % 9 ? 13 : 15}"/>`).join('');
    let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(c1, 0.05)}"/><stop offset="1" stop-color="${tint(c1, -0.7)}"/></linearGradient></defs><rect width="190" height="240" fill="url(#${id})"/>`;
    s += `<rect y="0" width="190" height="24" fill="${tint(c1, -0.5)}"/>${T(8, 16, it.title.toUpperCase(), 14, c2, { a: 'start', len: Math.min(150, it.title.length * 8.5) })}${isDemo(it) ? `<rect x="146" y="5" width="38" height="13" rx="2" fill="#e10600"/>${T(165, 14.5, 'DEMO', 8, '#fff', { f: BLACK })}` : ''}`;
    if (shots.length) shots.forEach((sh, i) => { const x = 8 + i * 59, y = 31 + (i % 2) * 3; s += `<g transform="rotate(${[-2, 1.5, -1][i]} ${x + 27} ${y + 17})"><rect x="${x - 1.2}" y="${y - 1.2}" width="56.4" height="37.4" fill="#fff"/><svg x="${x}" y="${y}" width="54" height="35" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${sh}</svg></g>`; });
    else s += `<rect x="8" y="31" width="174" height="36" fill="${c3}" opacity=".35"/>${T(95, 54, it.title.toUpperCase(), 12, '#fff', { op: 0.8 })}`;
    s += blurb.map((l, i) => T(9, 82 + i * 7.6, l, 5.6, '#fff', { f: SANS, a: 'start', w: 400 })).join('');
    s += feats.map((f, i) => `<circle cx="11" cy="${132 + i * 8}" r="1.6" fill="${c2}"/>` + T(16, 134.2 + i * 8, f.length > 46 ? f.slice(0, 45) + '...' : f, 5.6, c2, { f: SANS, a: 'start', w: 700 })).join('');
    s += `<rect x="8" y="168" width="174" height="34" fill="#fff"/><rect x="8" y="168" width="174" height="8" fill="#000"/>${T(95, 174, 'MINIMUM SYSTEM REQUIREMENTS', 5.4, '#fff', { f: BLACK, ls: 0.4 })}`;
    s += wrap('JackOS 95 or JackOS 98. ' + req + '. Sound Bluster compatible sound card. Mouse.' + (b.discs === 2 ? ' 2 CD-ROMs.' : ''), 58).slice(0, 3).map((l, i) => T(11, 183 + i * 6.4, l, 4.9, '#111', { f: SANS, a: 'start' })).join('');
    s += `<g transform="translate(10 210)"><rect x="-2" y="-2" width="55" height="24" fill="#fff"/><g fill="#000">${bars}</g>${T(25.5, 20, '5 0 1 9 9 9 0 ' + String(1000 + (it.title.length * 397) % 9000), 3.6, '#000', { f: SANS })}</g>`;
    s += ageBadge(80, 220, 0.8, age(it)) + cdMark(100, 220, 0.7, '#fff');
    s += T(182, 216, pubOf(it), 6, '#fff', { f: BLACK, a: 'end' }) + T(182, 224, `© 1999 ${pubOf(it)}. Made in the UK.`, 3.8, '#ccc', { f: SANS, a: 'end' }) + T(182, 230, 'Unauthorised copying, hiring or lending prohibited.', 3.4, '#aaa', { f: SANS, a: 'end' });
    return svg('0 0 190 240', s);
  }
  function priceOf(it) { return (PM.PRICE && PM.PRICE[it.id]) || (it.box && it.box.game && D.GAMES[it.box.game] && D.GAMES[it.box.game].price) || ''; }
  const sticker = (x, y, rot, p) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-23" y="-13" width="46" height="26" rx="3" fill="#ff7a1a" stroke="#c84a00" stroke-width=".8"/><rect x="-23" y="-13" width="46" height="8" rx="3" fill="#e05a00"/>${T(0, -6.8, 'GAMES GALAXY', 5, '#fff', { f: BLACK, ls: 0.3 })}${T(0, 5.5, String(p), 11, '#fff', { f: BLACK })}${T(0, 11, 'RUPEES', 3.8, '#fff', { f: BLACK, ls: .5 })}</g>`;
  // the front of a game box (Discs.front) with a price sticker on (Callum's and Luke's have his name instead)
  function frontBig(it, W, H) {
    const inner = D.front(it.box).replace(/^<svg [^>]*>/, '').replace(/<\/svg>$/, ''), p = priceOf(it);
    return svg(`0 0 ${W} ${H}`, inner + (p && !it.owner ? sticker(W * 0.2, H * 0.62, -8, p) : ''));
  }
  // ---- inside a big box: a black plastic tray, the manual
  function innerBig(it) {
    const c1 = it.c1 || '#333';
    return svg('0 0 190 240', `<rect width="190" height="240" fill="#151515"/><rect x="6" y="6" width="178" height="228" rx="4" fill="#1e1e1e" stroke="#2c2c2c"/><circle cx="95" cy="112" r="66" fill="#0e0e0e" stroke="#2a2a2a"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${(95 + Math.cos(a) * 9).toFixed(1)} ${(112 + Math.sin(a) * 9).toFixed(1)}L${(95 + Math.cos(a) * 15).toFixed(1)} ${(112 + Math.sin(a) * 15).toFixed(1)}" stroke="#444" stroke-width="3" stroke-linecap="round"/>`; }).join('')}<rect x="20" y="190" width="150" height="38" rx="2" fill="${tint(c1, 0.1)}"/>${T(95, 207, 'QUICK START MANUAL', 9, ink(c1), { f: BLACK })}${T(95, 219, it.title.toUpperCase(), 7, ink(c1), { f: SANS, op: 0.8 })}`);
  }
  function flapInside(it) {
    const c1 = it.c1 || '#333', c2 = it.c2 || '#fff';
    return svg('0 0 190 240', `<rect width="190" height="240" fill="${tint(c1, -0.4)}"/>${T(95, 60, 'THANK YOU', 22, c2)}${T(95, 82, 'for buying', 10, '#fff', { f: SANS })}${T(95, 108, it.title.toUpperCase(), 13, c2, { len: Math.min(170, it.title.length * 9) })}${wrap('Register your copy by post and you could WIN a trip to our studios! (Stamp not included.) Please keep this box: you will need the CD key on the back of the manual.', 40).map((l, i) => T(95, 140 + i * 9, l, 6.4, '#ddd', { f: SANS })).join('')}`);
  }

  // ================================================================ art: discs
  function discLabel(it) { // 200 x 200, the printed side
    const id = uid(), b = it.box || {};
    const ring = `<circle cx="100" cy="100" r="99" fill="none" stroke="#bfc4cc" stroke-width="2"/><circle cx="100" cy="100" r="26" fill="#d4d8de"/><circle cx="100" cy="100" r="19" fill="#eef0f3" stroke="#aab" stroke-width=".8"/><circle cx="100" cy="100" r="8" fill="#000" fill-opacity=".85"/>`;
    if (it.kind === 'cdr' || it.id === 'pm.mix' || it.id === 'callumcd') { // a CD-R: gold-green dye, felt tip
      const lines = it.id === 'pm.mix' ? [['DAD\'S CAR MIX', 15], ['DO NOT TOUCH', 12], [Cast.t('({me.NAME})'), 11]] : [[Cast.t("{mate3.NAME}'S"), 17], ['SHAREWARE MIX!!!', 13], ['DO NOT SCRATCH', 10]];
      return svg('0 0 200 200', `<defs><radialGradient id="${id}"><stop offset=".25" stop-color="#e8e2c0"/><stop offset=".6" stop-color="#d6cc8a"/><stop offset=".85" stop-color="#bfe0c8"/><stop offset="1" stop-color="#cfd8b0"/></radialGradient></defs><circle cx="100" cy="100" r="99" fill="url(#${id})"/>${ring}${lines.map(([l, s], i) => T(100, [52, 150, 170][i], l, s, i === 2 ? '#c00000' : '#1a1aaa', { f: HAND, w: 700, t: `rotate(${[-6, 3, 4][i]} 100 ${[52, 150, 170][i]})` })).join('')}`);
    }
    let bg = it.c1 || '#333', fg = it.c2 || '#fff', acc = it.c3 || '#e10600', title = it.title.replace(/ \(.*\)$/, '').toUpperCase(), sub = '', extra = '';
    if (it.kind === 'mag' || it.id === 'cover7') { bg = '#5b16c9'; fg = '#ffe600'; acc = '#e10600'; title = 'JACK ATTACK!'; sub = it.kind === 'mag' ? `COVER CD · ${PM.MONTHS[it.m - 1].toUpperCase()} 1999` : 'COVER DISC 7'; try { const M = window.CXMag && CXMag.META[it.m]; if (M) { bg = M.b[0]; acc = M.cd; fg = M.mc; } } catch (e) {} }
    else if (it.id === 'pm.os98') { sub = 'CD-ROM · VERSION 4.10.1998'; title = 'JackOS 98'; extra = flag(100, 46, 1.1); }
    else if (it.id === 'pm.netplanet') { title = 'NETPLANET 4.0'; sub = '500 FREE HOURS*'; }
    else if (it.id === 'pm.gub') { title = 'GUBBINZ'; sub = '& THE ROBOTS · GREATEST HITS'; }
    else if (b.discs === 2) sub = 'DISC 1 OF 2';
    else if (b.game || b.pid || b.pidApp) sub = isDemo(it) ? 'DEMO DISC' : 'PC CD-ROM';
    const fine = `© 1999 ${pubOf(it) || 'All rights reserved'}. Unauthorised copying prohibited. Made in the UK.`;
    return svg('0 0 200 200', `<defs><radialGradient id="${id}" cx=".35" cy=".3"><stop offset="0" stop-color="${tint(bg, 0.25)}"/><stop offset="1" stop-color="${tint(bg, -0.35)}"/></radialGradient><path id="${id}a" d="M100 100m-84 0a84 84 0 1 1 168 0a84 84 0 1 1-168 0"/></defs>
      <circle cx="100" cy="100" r="99" fill="url(#${id})"/><circle cx="100" cy="100" r="92" fill="none" stroke="${acc}" stroke-width="4" opacity=".9"/>${extra}
      ${T(100, it.id === 'pm.os98' ? 80 : 66, title, title.length > 12 ? 19 : 25, fg, { len: title.length > 10 ? 150 : 0, st: tint(bg, -0.6), sw: 2 })}${sub ? T(100, it.id === 'pm.os98' ? 150 : 148, sub, 8.5, '#fff', { f: BLACK, ls: 0.6 }) : ''}
      ${cdMark(78, 170, 0.8, '#fff')}<text font-family="${SANS}" font-size="5" fill="#fff" opacity=".75"><textPath href="#${id}a" startOffset="54%">${esc(fine)}</textPath></text>${ring}`);
  }
  const flag = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14-10q7-3 13 0v11q-6-3-13 0z" fill="#e8402a"/><path d="M1-10q7 3 13 0v11q-6 3-13 0z" fill="#3aa83a"/><path d="M-14 3q7-3 13 0v11q-6-3-13 0z" fill="#2a6ae8"/><path d="M1 3q7 3 13 0v11q-6 3-13 0z" fill="#f2c41a"/></g>`;
  // ---- our own discs' front inserts (200 x 200)
  function insertArt(it) {
    if (it.box) { const s = D.front(it.box); return s.replace('<svg ', '<svg preserveAspectRatio="none" '); }
    const id = uid();
    if (it.id === 'pm.os98') return svg('0 0 200 200', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ab0f0"/><stop offset=".5" stop-color="#2a6ad8"/><stop offset="1" stop-color="#0a246a"/></linearGradient></defs><rect width="200" height="200" fill="url(#${id})"/>${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${30 + i * 25}" cy="${150 + (i % 3) * 8}" rx="34" ry="13" fill="#fff" opacity=".22"/>`).join('')}${flag(100, 70, 2.4)}${T(100, 140, 'JackOS', 34, '#fff', { f: 'Arial,sans-serif', w: 700, it: 1 })}${T(150, 140, '98', 34, '#ffd400', { f: 'Arial,sans-serif', w: 700, it: 1, a: 'start' })}${T(100, 162, 'COMPACT DISC · FOR DISTRIBUTION WITH A NEW PC ONLY', 6, '#fff', { f: SANS, ls: 0.4 })}${T(100, 188, 'Includes JackNet Explorer 5', 8, '#cfe0ff', { f: SANS })}`);
    if (it.id === 'pm.gub') return svg('0 0 200 200', `<rect width="200" height="200" fill="#ff6a00"/><g opacity=".25">${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 22}L200 ${i * 22 - 40}" stroke="#fff" stroke-width="7"/>`).join('')}</g>${[30, 70, 130, 170].map((x, i) => `<g transform="translate(${x} ${118 + (i % 2) * 6})"><rect x="-14" y="-10" width="28" height="34" rx="3" fill="#c8ccd4" stroke="#333" stroke-width="2"/><rect x="-10" y="-30" width="20" height="18" rx="3" fill="#dde" stroke="#333" stroke-width="2"/><circle cx="-4" cy="-21" r="3" fill="#ff0"/><circle cx="4" cy="-21" r="3" fill="#ff0"/><path d="M0-30v-8" stroke="#333" stroke-width="2"/><circle cx="0" cy="-40" r="3" fill="#e10600"/></g>`).join('')}<g transform="translate(100 100)"><circle r="20" fill="#7a3"/><circle cx="-7" cy="-4" r="5" fill="#fff"/><circle cx="7" cy="-4" r="5" fill="#fff"/><circle cx="-6" cy="-4" r="2"/><circle cx="8" cy="-4" r="2"/><path d="M-8 8q8 6 16 0" stroke="#000" stroke-width="2" fill="none"/></g>${T(100, 40, 'GUBBINZ', 40, '#fff', { st: '#2a2aaa', sw: 4 })}${T(100, 58, '& THE ROBOTS', 12, '#2a2aaa', { f: BLACK })}<rect x="0" y="168" width="200" height="32" fill="#2a2aaa"/>${T(100, 190, 'GREATEST HITS', 18, '#ffd400')}<rect x="150" y="6" width="44" height="18" fill="#fff"/>${T(172, 18, 'ENHANCED CD', 5.4, '#000', { f: BLACK })}`);
    if (it.id === 'pm.netplanet') return svg('0 0 200 200', `<defs><radialGradient id="${id}" cx=".5" cy=".4"><stop offset="0" stop-color="#3a7aff"/><stop offset="1" stop-color="#06104a"/></radialGradient></defs><rect width="200" height="200" fill="url(#${id})"/><circle cx="100" cy="92" r="46" fill="#1a8aff" stroke="#9fd0ff" stroke-width="2"/><path d="M62 80q20-14 36 0t34-4M58 104q24 10 44 0t36 4" stroke="#3ad06a" stroke-width="9" fill="none"/><ellipse cx="100" cy="92" rx="66" ry="14" fill="none" stroke="#ffd400" stroke-width="4" transform="rotate(-18 100 92)"/>${T(100, 30, 'NETPLANET 4.0', 24, '#fff', { st: '#000', sw: 3 })}<circle cx="160" cy="150" r="30" fill="#ffd400" stroke="#e10600" stroke-width="3"/>${T(160, 148, '500', 18, '#e10600', { f: BLACK })}${T(160, 160, 'FREE HOURS*', 6.5, '#e10600', { f: BLACK })}${T(60, 162, 'THE INTERNET', 13, '#fff')}${T(60, 178, 'MADE EASY!', 13, '#ffd400')}${T(100, 195, '*in your first month. Call charges apply.', 5, '#9ab', { f: SANS })}`);
    return svg('0 0 200 200', `<rect width="200" height="200" fill="${it.c1 || '#444'}"/>`);
  }
  // the lid of a jewel case (284 x 250): the clear polystyrene frame with its hinge ridges on the left, the booklet showing through
  function jewelFront(it, clear) {
    const id = uid(), art = clear ? '' : insertArt(it).replace(/^<svg [^>]*>/, '').replace(/<\/svg>$/, '');
    return svg('0 0 284 250', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f8"/><stop offset=".5" stop-color="#c6d0da"/><stop offset="1" stop-color="#dfe6ee"/></linearGradient></defs>
      ${clear ? '' : `<rect width="284" height="250" fill="url(#${id})"/>`}<rect x="0" y="0" width="30" height="250" fill="url(#${id})"/><rect x="0" y="0" width="284" height="7" fill="url(#${id})"/><rect x="0" y="243" width="284" height="7" fill="url(#${id})"/><rect x="277" y="0" width="7" height="250" fill="url(#${id})"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${4 + i * 2.6}" y="22" width="1.1" height="206" fill="#8a96a2" opacity=".55"/>`).join('')}<rect x="9" y="4" width="14" height="16" rx="2" fill="#9aa6b2" opacity=".5"/><rect x="9" y="230" width="14" height="16" rx="2" fill="#9aa6b2" opacity=".5"/>
      ${art ? `<svg x="30" y="7" width="247" height="236" viewBox="0 0 200 200" preserveAspectRatio="none">${art}</svg><rect x="30" y="7" width="247" height="236" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1"/>` : ''}
      <path d="M30 7 L284 7 L284 60 Z" fill="#fff" opacity=".13"/><path d="M60 243 L284 150 L284 243 Z" fill="#fff" opacity=".08"/>`);
  }
  function inlaySpine(it) { // 14 x 125 (the jewel case's spine)
    const c1 = it.c1 || '#333', c2 = it.c2 || '#fff', t = it.title.replace(/ \(.*\)$/, '').toUpperCase();
    if (it.id === 'pm.mix' || it.kind === 'cdr') return svg('0 0 14 125', `<rect width="14" height="125" fill="#f2f2ee"/>${T(0, 0, it.id === 'pm.mix' ? 'DAD\'S CAR MIX' : Cast.t("{mate3.NAME}'S MIX!!"), 7.5, '#1a1aaa', { f: HAND, w: 700, t: 'translate(9.6 62) rotate(-90)' })}`);
    return svg('0 0 14 125', `<rect width="14" height="125" fill="${c1}"/><rect width="14" height="16" fill="${tint(c1, -0.4)}"/>${T(0, 0, t, 8.2, c2, { t: 'translate(10 72) rotate(-90)', len: t.length > 14 ? 92 : 0 })}<circle cx="7" cy="8" r="3.4" fill="none" stroke="#fff" stroke-width=".8"/><circle cx="7" cy="8" r="1" fill="#fff"/>`);
  }
  function inlayBack(it) { // 150 x 118 (the tray card on the back of a jewel case)
    const c1 = it.c1 || '#333', c2 = it.c2 || '#fff', b = it.box || {};
    if (it.id === 'pm.gub') { const songs = ['Stampede', 'Floppy Disk Love', 'Robot Strut', 'Cave Rave', 'Parade', 'Hold Music (Please Hold)', 'Trukk Stop', 'Sunset on the Desktop', 'Modem Song']; return svg('0 0 150 118', `<rect width="150" height="118" fill="#ff7a1a"/>${T(75, 15, 'GREATEST HITS', 11, '#2a2aaa')}${songs.map((s, i) => T(20, 27 + i * 8.4, `${i + 2}. ${s}`, 5.6, '#fff', { f: SANS, a: 'start', w: 700 })).join('')}${T(75, 112, 'Track 1 is a data track. Do not play it on your hi-fi. (It sounds like a fax.)', 3.6, '#2a2aaa', { f: SANS })}`); }
    const lines = wrap((it.blurb || b.blurb || ''), 44).slice(0, 7);
    return svg('0 0 150 118', `<rect width="150" height="118" fill="${tint(c1, -0.3)}"/>${T(75, 15, it.title.replace(/ \(.*\)$/, '').toUpperCase(), 11, c2, { len: Math.min(130, it.title.length * 7) })}${lines.map((l, i) => T(10, 30 + i * 8, l, 5.2, '#fff', { f: SANS, a: 'start' })).join('')}<rect x="10" y="94" width="42" height="15" fill="#fff"/><g fill="#000">${Array.from({ length: 22 }, (_, i) => `<rect x="${12 + i * 1.7}" y="96" width="${[0.6, 1, 0.5][i % 3]}" height="11"/>`).join('')}</g>${T(140, 106, pubOf(it) || 'Made in the UK', 5, '#fff', { f: SANS, a: 'end' })}`);
  }

  // ================================================================ art: floppies, mags
  const FLOPCOL = [['#1d1d22', '#36363e'], ['#1a3a9a', '#2a5ad0'], ['#7a7e86', '#a0a4ac'], ['#b01818', '#d83a2a'], ['#1a7a3a', '#2aa04a'], ['#d8b000', '#f2d020'], ['#e8e8e4', '#ffffff']];
  function floppyFront(it) { // 90 x 94: the label side, metal shutter at the top
    const f = it.fl || {}, col = FLOPCOL[(f.c | 0) % FLOPCOL.length], id = uid();
    let lab = it.label || '', lines = [];
    if (it.id === 'gquest') { lab = 'QUEST_DISK v1.2'; lines = [['DISK 1 OF 1', '#1a1aaa'], ['SHAREWARE: COPY ME!', '#c00000']]; }
    else if (f.k === 'dl') lines = [['(off JackNet)', '#1a1aaa']];
    else if (f.k === 'dave') lines = [['GIVE BACK!!!', '#c00000'], ['DON\'T LOOK ON IT', '#1a1aaa']];
    else if (f.k === 'gcse') lab = 'GCSE COURSEWORK??';
    else if (f.k === 'boot') lines = [['JackOS 98', '#1a1aaa'], ['keep safe!!', '#c00000']];
    if (f.k === 'gcse') lines = [['DO NOT DELETE', '#c00000'], ['(english + geog)', '#1a1aaa']];
    const big = lab.length > 14 ? 7.6 : 9.4;
    return svg('0 0 90 94', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient><linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#8d939b"/><stop offset=".35" stop-color="#e8ecf0"/><stop offset=".6" stop-color="#b8bec6"/><stop offset="1" stop-color="#7f858d"/></linearGradient></defs>
      <path d="M2 0h80l8 8v84a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" fill="url(#${id})"/><rect x="22" y="0" width="48" height="29" fill="url(#${id}m)"/><rect x="52" y="4" width="10" height="21" rx="1" fill="${col[0]}" opacity=".9"/><path d="M22 29h48" stroke="#555" stroke-width=".6"/>
      <rect x="6" y="36" width="78" height="54" rx="1.5" fill="#fbfbf6"/>${Array.from({ length: 5 }, (_, i) => `<path d="M9 ${50 + i * 8}h72" stroke="#9ab8e0" stroke-width=".5"/>`).join('')}<rect x="6" y="36" width="78" height="6" fill="${it.id === 'gquest' ? '#e10600' : col[1]}" opacity=".85"/>
      ${lab ? T(45, 52, lab, big, '#14148a', { f: HAND, w: 700, t: 'rotate(-2 45 52)', len: lab.length > 18 ? 72 : 0 }) : ''}${lines.map(([l, c], i) => T(45, 64 + i * 9, l, 6.8, c, { f: HAND, w: 700, t: `rotate(${i ? 1.5 : -1} 45 ${64 + i * 9})`, len: l.length > 15 ? 70 : 0 })).join('')}
      <rect x="4" y="84" width="4" height="4" fill="${col[0]}"/><rect x="82" y="84" width="4" height="4" fill="#000"/>`);
  }
  function floppyBack(it) {
    const col = FLOPCOL[((it.fl || {}).c | 0) % FLOPCOL.length], id = uid();
    return svg('0 0 90 94', `<defs><linearGradient id="${id}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient></defs><g transform="rotate(180 45 47)"><path d="M8 0h80a2 2 0 0 1 2 2v90a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8z" fill="url(#${id})"/><rect x="20" y="0" width="48" height="29" fill="#b8bec6"/><circle cx="45" cy="62" r="14" fill="#9aa0a8" stroke="#666"/><rect x="42" y="56" width="6" height="8" fill="#555"/>${T(45, 88, '1.44 MB · 2HD', 6, '#fff', { f: BLACK, op: 0.6 })}</g>`);
  }
  function magCover(it, withDisc) { // 210 x 280: the JACK ATTACK! issue (js/cx-mag.js's art and cover lines)
    const M = (window.CXMag && CXMag.META[it.m]) || { b: ['#5b16c9', '#14002e'], mc: '#ffe600', main: 'JACK ATTACK!', lines: [], cd: '#ff7a00' }, id = uid();
    let art = '';
    try { const h = window.CXMag ? CXMag.cover(it.m, {}) : ''; const mm = /<svg class="cxc-art"[^>]*>([\s\S]*?)<\/svg>/.exec(h); art = mm ? mm[1] : ''; } catch (e) {}
    const bars = Array.from({ length: 26 }, (_, i) => `<rect x="${i * 1.6}" y="0" width="${[0.6, 1, 0.5, 1.2][(i * 7 + it.m) % 4]}" height="${i % 9 ? 13 : 15}"/>`).join('');
    let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.b[0]}"/><stop offset="1" stop-color="${M.b[1]}"/></linearGradient></defs><rect width="210" height="280" fill="url(#${id})"/>`;
    s += `<svg x="20" y="76" width="170" height="170" viewBox="0 0 200 200">${art}</svg>`;
    s += T(105, 52, 'JACK ATTACK!', 46, M.mc, { t: 'rotate(-2 105 40)', st: '#000', sw: 3.4, len: 196 });
    s += `<rect y="60" width="210" height="11" fill="#000"/>${T(6, 68.5, PM.MONTHS[it.m - 1].toUpperCase() + ' 1999', 7, '#fff', { f: BLACK, a: 'start' })}${T(105, 68.5, 'THE GAMES MAG WOT JACK MADE', 6, '#fff', { f: BLACK })}${T(204, 68.5, '20p', 7, '#fff', { f: BLACK, a: 'end' })}`;
    s += M.lines.slice(0, 4).map((l, i) => { const w = Math.min(96, 12 + l.length * 4.4); return `<rect x="${206 - w}" y="${80 + i * 17}" width="${w}" height="13" fill="${i % 2 ? 'rgba(0,0,0,.72)' : M.mc}"/>` + T(203, 90.5 + i * 17, l, 8.4, i % 2 ? '#fff' : '#000', { a: 'end', len: l.length > 20 ? w - 6 : 0 }); }).join('');
    s += T(8, 262, M.main, M.main.length > 16 ? 15 : 20, '#fff', { f: 'Bangers,Anton,Impact,sans-serif', a: 'start', t: 'rotate(-4 8 262)', st: '#000', sw: 2.4, len: M.main.length > 16 ? 150 : 0 });
    s += `<g transform="translate(166 252)"><rect x="-2" y="-2" width="44" height="22" fill="#fff"/><g fill="#000">${bars}</g>${T(20, 19, '99' + String(it.m).padStart(2, '0'), 4, '#000', { f: SANS })}</g>`;
    if (withDisc) s += `<g transform="translate(26 92) rotate(-4)"><svg width="118" height="118" viewBox="0 0 200 200">${discLabel(it).replace(/^<svg [^>]*>/, '').replace(/<\/svg>$/, '')}</svg><rect x="-6" y="-6" width="130" height="130" rx="4" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/><rect x="-14" y="-4" width="40" height="13" fill="rgba(255,250,215,.6)" transform="rotate(-38 6 2)"/><rect x="96" y="112" width="40" height="13" fill="rgba(255,250,215,.6)" transform="rotate(-38 116 118)"/>${T(110, 8, 'FREE CD!', 15, '#ffe600', { t: 'rotate(8 110 8)', st: '#000', sw: 1.6 })}</g>`;
    return svg('0 0 210 280', s);
  }
  function booklet(it) { return svg('0 0 140 120', `<rect width="140" height="120" fill="#f4f1e8"/>${T(70, 20, it.title.replace(/ \(.*\)$/, '').toUpperCase(), 9, '#222', { len: Math.min(120, it.title.length * 6) })}${wrap(it.blurb || (it.box && it.box.blurb) || '', 42).slice(0, 8).map((l, i) => T(10, 36 + i * 8.6, l, 5.4, '#333', { f: SANS, a: 'start' })).join('')}${T(70, 112, 'Please read this booklet before installing.', 4.6, '#777', { f: SANS })}`); }
  function magBack(it) {
    return svg('0 0 210 280', `<g transform="rotate(180 105 140)"><rect width="210" height="280" fill="#ffd400"/>${T(105, 50, 'PIXEL', 44, '#e10600', { st: '#000', sw: 3 })}${T(105, 92, 'POST', 44, '#2a2aaa', { st: '#000', sw: 3 })}${T(105, 118, 'GAMES BY MAIL ORDER', 12, '#000', { f: BLACK })}${['ALL THE NEW PC GAMES', 'BOXED, WITH THE MANUAL', 'NEXT-DAY DELIVERY', 'FREE P&P!!!'].map((l, i) => T(105, 150 + i * 18, '★ ' + l + ' ★', 11, '#000', { f: BLACK })).join('')}<rect x="20" y="226" width="170" height="34" fill="#000"/>${T(105, 249, 'www.pixelpost.jnet', 17, '#ffd400')}</g>`);
  }
  function magSpine(it) { return svg('0 0 280 6', `<rect width="280" height="6" fill="#fff"/>${T(140, 4.6, `JACK ATTACK! · ${PM.MONTHS[it.m - 1].toUpperCase()} 1999 · ISSUE ${it.m}`, 4.2, '#c00000', { f: BLACK })}`); }

  // ================================================================ a console game's box (for the catalogue: 200 x 270)
  function cartArt(x) {
    const id = uid(), col = x.col || '#888', con = String(x.conName || '').toUpperCase(), t = String(x.title || '').replace(/ \(.*\)$/, '').toUpperCase();
    const words = t.split(' '), l1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : t, l2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
    return svg('0 0 200 270', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tint(col, 0.35)}"/><stop offset="1" stop-color="${tint(col, -0.5)}"/></linearGradient></defs><rect width="200" height="270" fill="url(#${id})"/>
      <g opacity=".22">${Array.from({ length: 7 }, (_, i) => `<circle cx="${30 + i * 28}" cy="${150 + (i % 2) * 40}" r="${26 + (i % 3) * 10}" fill="#fff"/>`).join('')}</g>
      <rect x="0" y="0" width="200" height="26" fill="#111"/>${T(100, 18.5, con, 12, '#fff', { f: BLACK, ls: 2 })}
      ${T(100, l2 ? 118 : 136, l1, l1.length > 11 ? 24 : 32, '#fff', { st: '#000', sw: 3, len: l1.length > 11 ? 176 : 0 })}${l2 ? T(100, 154, l2, l2.length > 11 ? 24 : 32, '#ffe600', { st: '#000', sw: 3, len: l2.length > 11 ? 176 : 0 }) : ''}
      <rect x="14" y="196" width="172" height="40" rx="4" fill="rgba(0,0,0,.55)"/>${wrap(x.blurb || '', 34).slice(0, 3).map((l, i) => T(100, 210 + i * 11, l, 7.6, '#fff', { f: SANS })).join('')}
      <rect x="0" y="246" width="200" height="24" fill="#111"/>${T(8, 262, (x.media || 'cartridge').toUpperCase(), 9, '#fff', { f: BLACK, a: 'start' })}${T(192, 262, 'PIXEL POST EXCLUSIVE', 7, '#ffe600', { f: BLACK, a: 'end' })}`);
  }
  // ================================================================ the Pixel Post paper catalogue (210 x 280 pages)
  const burst = (x, y, r, fill, lines, size, rot) => { const pts = Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14, q = i % 2 ? r * 0.8 : r; return `${(x + Math.cos(a) * q).toFixed(1)},${(y + Math.sin(a) * q).toFixed(1)}`; }).join(' '); return `<g transform="rotate(${rot || -10} ${x} ${y})"><polygon points="${pts}" fill="${fill}" stroke="#000" stroke-width="1.5"/>${lines.map((l, i) => T(x, y - (lines.length - 1) * size * 0.55 + i * size * 1.1 + size * 0.35, l, size, '#000', { f: BLACK })).join('')}</g>`; };
  const ppLogo = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${T(0, 0, 'PIXEL', 30, '#e10600', { a: 'end', st: '#000', sw: 2.2 })}${T(2, 0, 'POST', 30, '#2a2aaa', { a: 'start', st: '#000', sw: 2.2 })}</g>`;
  const pageHead = n => `<rect width="210" height="16" fill="#ffd400"/><rect y="16" width="210" height="2" fill="#000"/>${ppLogo(42, 13, 0.42)}${T(204, 11.5, 'GAMES BY MAIL ORDER · AUTUMN 1999 · PAGE ' + n, 5.4, '#000', { f: BLACK, a: 'end' })}`;
  const pageFoot = () => `<rect y="268" width="210" height="12" fill="#2a2aaa"/>${T(105, 276.5, 'ORDER ONLINE: www.pixelpost.jnet · PRICES IN RUPEES · FREE P&P · SAME-DAY DELIVERY!', 5, '#fff', { f: BLACK })}`;
  function catCover() {
    const id = uid();
    const art = ['park', 'keepa', 'city', 'squigs'].map((k, i) => { const b = D.BOX && D.BOX[k]; if (!b) return ''; const inner = D.front(b).replace(/^<svg [^>]*>/, '').replace(/<\/svg>$/, ''); return `<g transform="translate(${18 + i * 44} ${118 + (i % 2) * 14}) rotate(${[-8, 4, -3, 7][i]} 30 40)"><rect x="-1.5" y="-1.5" width="63" height="85" fill="#000"/><svg width="60" height="81" viewBox="0 0 200 270" preserveAspectRatio="none">${inner}</svg></g>`; }).join('');
    return svg('0 0 210 280', `<defs><radialGradient id="${id}" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#ffe94a"/><stop offset=".6" stop-color="#ffb000"/><stop offset="1" stop-color="#e86a00"/></radialGradient></defs><rect width="210" height="280" fill="url(#${id})"/>
      <g opacity=".18">${Array.from({ length: 18 }, (_, i) => `<path d="M105 120 L${(105 + Math.cos(i * Math.PI / 9) * 260).toFixed(0)} ${(120 + Math.sin(i * Math.PI / 9) * 260).toFixed(0)} L${(105 + Math.cos(i * Math.PI / 9 + 0.09) * 260).toFixed(0)} ${(120 + Math.sin(i * Math.PI / 9 + 0.09) * 260).toFixed(0)}z" fill="#fff"/>`).join('')}</g>
      ${ppLogo(110, 58, 1.55)}<rect x="12" y="68" width="186" height="16" fill="#000"/>${T(105, 80, 'THE GAMES CATALOGUE · AUTUMN / WINTER 1999', 8.4, '#ffd400', { f: BLACK, ls: 0.5 })}
      ${T(105, 104, 'EVERY GAME BOXED, WITH THE MANUAL!', 9.5, '#2a2aaa', { f: BLACK })}${art}
      ${burst(168, 214, 30, '#e10600', ['FREE', 'P&P!'], 11, -12).replace(/fill="#000"/g, 'fill="#fff"')}${burst(40, 226, 26, '#7aff4a', ['PAY IN', 'RUPEES'], 8.4, 8)}
      <rect x="0" y="246" width="210" height="34" fill="#2a2aaa"/>${T(105, 262, 'SAME-DAY DELIVERY', 15, '#ffd400')}${T(105, 274, 'www.pixelpost.jnet · Unit 4, The Industrial Estate', 6, '#fff', { f: SANS })}`);
  }
  function catIntro() {
    const lines = ['Welcome to the new PIXEL POST catalogue! We\'ve got every top PC game, BOXED, with the manual, the poster (if there is one) and the smell.', 'HOW TO ORDER: go on the Internet (ask first, it ties up the phone), type www.pixelpost.jnet, pick your game and click ORDER IT. We take Rupees from your JackNet account.', 'DELIVERY: the same day. Our van is very fast. Somebody has to sign for it (Mom).', 'Three orders a day per customer. No refunds: once it\'s opened, it\'s yours.'];
    let y = 44, s = '';
    for (const l of lines) { const w = wrap(l, 50); s += w.map((x, i) => T(16, y + i * 9, x, 6.6, '#222', { f: SANS, a: 'start' })).join(''); y += w.length * 9 + 7; }
    return svg('0 0 210 280', `<rect width="210" height="280" fill="#fffdf4"/>${pageHead(2)}${T(16, 34, 'HELLO, GAMERS!', 16, '#e10600', { a: 'start' })}${s}
      <g transform="translate(16 ${y + 6})"><rect width="178" height="64" rx="4" fill="#eef2ff" stroke="#2a2aaa" stroke-width="1.4"/>${T(89, 16, 'PIXEL POST PROMISE', 10, '#2a2aaa')}${['✔ Every game brand new and sealed', '✔ Prices in Rupees, no extra charges', '✔ Delivered the same day, or your money back*', '* we have never been late'].map((l, i) => T(12, 30 + i * 9.4, l, i === 3 ? 5 : 6.4, '#222', { f: SANS, a: 'start', w: i === 3 ? 400 : 700 })).join('')}</g>${pageFoot()}`);
  }
  function catPage(items, n) {
    const block = (x, i) => {
      const y = 26 + i * 120, inner = x.art ? x.art.replace(/^<svg [^>]*>/, '').replace(/<\/svg>$/, '') : '';
      const blurb = wrap(x.blurb, 34).slice(0, 6);
      const tag = !x.soon && x.tag ? burst(22, y + 12, 13, { new: '#7aff4a', hot: '#ff7a00', budget: '#4ad0ff' }[x.tag] || '#fff', [{ new: 'NEW!', hot: 'HOT!', budget: 'BARGAIN' }[x.tag] || ''], x.tag === 'budget' ? 5.6 : 7.4, 10) : '';
      return `<g><rect x="10" y="${y}" width="190" height="112" fill="${i ? '#f4f6ff' : '#fffaf0'}" stroke="#ccc"/><rect x="14" y="${y + 6}" width="74" height="100" fill="#000"/><svg x="16" y="${y + 8}" width="70" height="96" viewBox="0 0 200 270" preserveAspectRatio="none">${inner}</svg>
        ${T(96, y + 20, x.title.toUpperCase(), x.title.length > 18 ? 9.5 : 12, '#000', { a: 'start', len: x.title.length > 22 ? 96 : 0 })}${blurb.map((l, j) => T(96, y + 32 + j * 8, l, 5.9, '#333', { f: SANS, a: 'start' })).join('')}
        ${x.soon ? `<rect x="96" y="${y + 84}" width="98" height="18" fill="#fff3b0" stroke="#c8a000"/>${T(145, y + 96, 'COMING ' + String(x.rel || '').replace('/', '.') + '!', 8.4, '#7a5a00', { f: BLACK })}` : `<g transform="translate(96 ${y + 82})"><rect width="70" height="22" rx="3" fill="#e10600" stroke="#000"/>${T(30, 16, String(x.price), 13, '#fff', { f: BLACK })}<polygon points="56,4 62,8 62,14 56,18 50,14 50,8" fill="#5aff7a" stroke="#0a5a1a" stroke-width="1.2"/>${T(35, 27, 'RUPEES', 4.6, '#c00000', { f: BLACK })}</g>${T(166, y + 97, 'CODE PP-' + x.id.slice(0, 4).toUpperCase(), 4.6, '#666', { f: SANS, a: 'start' })}`}${tag}</g>`;
    };
    return svg('0 0 210 280', `<rect width="210" height="280" fill="#fff"/>${pageHead(n)}${items.map(block).join('')}${pageFoot()}`);
  }
  function catOrder() {
    return svg('0 0 210 280', `<rect width="210" height="280" fill="#fffdf4"/>${pageHead('99')}${T(105, 40, 'ORDER FORM', 20, '#2a2aaa')}${T(105, 52, '(we do orders on the Internet now: www.pixelpost.jnet)', 6, '#666', { f: SANS })}
      ${['NAME', 'ADDRESS', '', 'GAME', 'RUPEES', 'SIGNED (MOM)'].map((l, i) => `${T(18, 76 + i * 22, l, 7, '#222', { f: BLACK, a: 'start' })}<path d="M70 ${77 + i * 22}h122" stroke="#9aa" stroke-dasharray="2 2"/>`).join('')}
      ${T(76, 75, Cast.t('{me.NAME}'), 12, '#14148a', { f: HAND, w: 700, a: 'start', t: 'rotate(-2 76 75)' })}${T(76, 97, 'MY ROOM', 10, '#14148a', { f: HAND, w: 700, a: 'start' })}${T(76, 141, 'ALL OF THEM!!!', 11, '#c00000', { f: HAND, w: 700, a: 'start', t: 'rotate(-3 76 141)' })}
      ${burst(160, 226, 30, '#ffd400', ['TEAR', 'HERE!'], 9, 12)}<path d="M8 196h194" stroke="#000" stroke-dasharray="5 3"/>${pageFoot()}`);
  }
  function catBack() {
    return svg('0 0 210 280', `<rect width="210" height="280" fill="#e10600"/>${ppLogo(110, 70, 1.6)}${T(105, 104, 'THE GAMES PEOPLE', 14, '#fff')}
      ${['ALL THE NEW PC GAMES', 'BOXED, WITH THE MANUAL', 'PAY WITH RUPEES', 'SAME-DAY DELIVERY'].map((l, i) => T(105, 140 + i * 18, '★ ' + l + ' ★', 10, '#ffd400', { f: BLACK })).join('')}
      <rect x="20" y="222" width="170" height="30" fill="#000"/>${T(105, 243, 'www.pixelpost.jnet', 17, '#fff')}${T(105, 270, 'Pixel Post Ltd · Unit 4 · The Industrial Estate · Est. 1994', 5.5, '#fff', { f: SANS })}`);
  }
  window.PMArt = { svg, T, tint, ink, wrap, uid, spineBig, topBig, edgeBig, backBig, frontBig, innerBig, flapInside, discLabel, insertArt, inlaySpine, inlayBack, booklet, floppyFront, floppyBack, magCover, magBack, FLOPCOL, priceOf, cartArt, jewelFront, catCover, catIntro, catPage, catOrder, catBack };
})();

/* homepages-view: draws Homepagez member pages (from their block data), the Member Pages directory, the sign-up page
 * and the little "real residents" panels on the made-up Homepagez pages. Lazy-loaded by homepages.js.
 * SAFETY: every piece of member text goes through esc(); every colour, font, tile, sticker, badge and style comes from
 * the fixed lists in HPZ (anything else falls back to a default); links are re-checked with HPZ.normUrl. Never innerHTML
 * a member's string without esc(). */
(function () {
  'use strict';
  const H = window.HPZ, A = window.Apps, esc = A.esc;
  if (!H || H.view) return;
  const L = H.LIMITS;
  const PAL = new Set(H.ids(H.PALETTE));
  const colr = (v, d) => (typeof v === 'string' && PAL.has(v) ? v : d);
  const FONT = {}; H.FONTS.forEach(f => { FONT[f[0]] = f[2]; });
  const fontOf = (v, d) => FONT[v] || d;
  const one = (v, list, d) => (list.includes(v) ? v : d);
  const AL = { l: 'left', c: 'center', r: 'right' };
  const ID = { hr: H.ids(H.HRS), uc: H.ids(H.UCS), ct: H.ids(H.COUNTERS), ring: H.ids(H.RINGS), bu: H.ids(H.BULLETS), how: H.ids(H.HOWS) };
  const BADGE = {}; H.BADGES.forEach(b => { BADGE[b[0]] = b; });
  const HOWL = {}; H.HOWS.forEach(h => { HOWL[h[0]] = h[1]; });
  const TUNE = {}; H.TUNES.forEach(t => { TUNE[t[0]] = t[1]; });
  const int = (v, lo, hi, d) => { const n = Math.floor(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  const st = o => esc(Object.keys(o).filter(k => o[k] != null && o[k] !== '').map(k => k + ':' + o[k]).join(';')); // style attr from fixed values
  const d99 = ts => { const d = new Date(ts || Date.now()); let dd = d.getDate(); if (d.getMonth() === 1 && dd === 29) dd = 28; return String(dd).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/99'; };
  const t99 = ts => { const d = new Date(ts || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  // ================================================================ tunes (public-domain melodies, our own arrangements)
  const q = n => [n, -1], e = n => [n], dq = n => [n, -1, -1], hn = n => [n, -1, -1, -1];
  const seq = (...p) => [].concat(...p);
  const CC = [48, 55, 52, 55], GG = [43, 50, 47, 50], AM = [45, 52, 57], GM = [43, 50, 55], EM = [40, 47, 52];
  if (window.Sound && Sound.addTune) {
    const bar = notes => seq(...notes.map(q));
    Sound.addTune('hpz_joy', { step: 0.17, hats: false, // Ode to Joy (Beethoven)
      lead: seq(bar([76, 76, 77, 79]), bar([79, 77, 76, 74]), bar([72, 72, 74, 76]), dq(76), e(74), hn(74), bar([76, 76, 77, 79]), bar([79, 77, 76, 74]), bar([72, 72, 74, 76]), dq(74), e(72), hn(72)),
      bass: seq(CC, GG, CC, GG, CC, GG, CC, [43, 50, 48, 48]) });
    Sound.addTune('hpz_elise', { step: 0.13, hats: false, // Fur Elise (Beethoven)
      lead: [76, 75, 76, 75, 76, 71, 74, 72, 69, -1, 0, 60, 64, 69, 71, -1, 0, 64, 68, 71, 72, -1, 0, 64, 76, 75, 76, 75, 76, 71, 74, 72, 69, -1, 0, 60, 64, 69, 71, -1, 0, 64, 72, 71, 69, -1, -1, -1, 0, 0],
      bass: [0, 0, 0, 0, 45, 52, 57, 40, 52, 56, 45, 52, 57, 0, 0, 0, 45, 52, 57, 40, 52, 56, 45, 52, 57] });
    Sound.addTune('hpz_ent', { step: 0.12, hats: true, // The Entertainer (Joplin)
      lead: [74, 75, 76, 84, -1, 76, 84, -1, 76, 84, -1, -1, -1, -1, 84, 86, 87, 88, 84, 86, 88, -1, 83, 86, -1, 84, -1, -1, -1, -1, 0, 0],
      bass: [48, 60, 52, 60, 48, 60, 52, 60, 43, 55, 50, 55, 48, 55, 52, 48] });
    Sound.addTune('hpz_green', { step: 0.17, hats: false, // Greensleeves (traditional)
      lead: [69, 72, -1, 74, 76, -1, 77, 76, -1, 74, 71, -1, 67, 69, -1, 71, 72, -1, 69, 69, -1, 68, 69, -1, 71, 68, -1, 64, -1, -1, 69, 72, -1, 74, 76, -1, 77, 76, -1, 74, 71, -1, 67, 69, -1, 71, 72, -1, 71, 69, -1, 68, 66, -1, 68, 69, -1, -1, -1, -1],
      bass: seq(AM, GM, AM, EM, EM, AM, GM, AM, EM, AM) });
    Sound.addTune('hpz_space', { step: 0.14, hats: true,
      lead: [69, 72, 76, 81, 76, 72, 69, 72, 65, 69, 72, 77, 72, 69, 65, 69, 64, 67, 72, 76, 72, 67, 64, 67, 67, 71, 74, 79, 74, 71, 67, 71],
      bass: [45, 45, 45, 45, 41, 41, 41, 41, 48, 48, 48, 48, 43, 43, 43, 43] });
    Sound.addTune('hpz_grot', { step: 0.13, hats: true,
      lead: [67, 0, 67, 70, 72, 0, 70, 67, 65, 0, 65, 67, 70, -1, 67, 0, 67, 0, 67, 70, 72, 0, 75, 74, 72, -1, 70, -1, 67, -1, -1, 0],
      bass: [43, 0, 43, 0, 41, 0, 41, 0, 43, 0, 43, 0, 48, 46, 43, 0] });
  }
  let musicEl = null;
  function playTune(id, el) {
    if (!window.Sound || !Sound.music || !TUNE[id] || id === 'none') return;
    Sound.unlock && Sound.unlock();
    const have = Sound.tunes ? Sound.tunes() : [];
    Sound.music.play(have.includes(id) ? id : 'theme'); musicEl = el;
  }
  function stopTune() { if (musicEl && window.Sound) Sound.music.stop(); musicEl = null; }

  // ================================================================ art: background tiles, rules, clip art, signs
  const svgUrl = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)}")`;
  const dots = (pts, fill) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r || 1}" fill="${fill}"/>`).join('');
  const TILES = {
    stars: () => svgUrl(80, 80, '<rect width="80" height="80" fill="#000010"/>' + dots([[5, 9], [22, 40, 1.4], [37, 14], [52, 61], [70, 27, 1.2], [12, 70], [61, 6], [44, 34, .8], [29, 75, .8], [75, 55, .8]], '#fff') + '<path d="M60 44l2 5 5 1-5 2-2 5-2-5-5-2 5-1z" fill="#ffd400"/>'),
    space: () => svgUrl(120, 120, '<rect width="120" height="120" fill="#06063a"/>' + dots([[10, 12], [40, 90], [75, 20, 1.3], [100, 70], [20, 55, .8], [60, 110, .8], [110, 105]], '#fff') + '<circle cx="80" cy="70" r="11" fill="#c86a2a"/><ellipse cx="80" cy="70" rx="19" ry="4" fill="none" stroke="#ffd400" stroke-width="2"/><circle cx="25" cy="25" r="5" fill="#6cf"/>'),
    clouds: () => svgUrl(140, 100, '<rect width="140" height="100" fill="#7ec0ee"/><g fill="#fff"><ellipse cx="30" cy="30" rx="22" ry="10"/><ellipse cx="45" cy="24" rx="14" ry="10"/><ellipse cx="100" cy="72" rx="26" ry="11"/><ellipse cx="86" cy="66" rx="14" ry="10"/><ellipse cx="115" cy="66" rx="12" ry="9"/></g>'),
    grass: () => svgUrl(40, 40, '<rect width="40" height="40" fill="#2f8f2f"/><path d="M4 38l3-12M12 36l-2-10M20 39l3-14M28 37l-3-11M35 38l2-10M8 18l2-9M24 16l-2-9M33 14l3-8M16 8l-1-6" stroke="#1a6a1a" stroke-width="2"/><path d="M3 22l2-7M18 26l2-8M30 26l-2-7" stroke="#4fbf4f" stroke-width="1.5"/>'),
    bricks: () => svgUrl(60, 40, '<rect width="60" height="40" fill="#d9c9b0"/><g fill="#b03a2e"><rect x="1" y="1" width="28" height="18"/><rect x="31" y="1" width="28" height="18"/><rect x="-14" y="21" width="28" height="18"/><rect x="16" y="21" width="28" height="18"/><rect x="46" y="21" width="28" height="18"/></g>'),
    flames: () => svgUrl(60, 90, '<rect width="60" height="90" fill="#000"/><path d="M0 90C4 70 10 72 8 56 16 66 18 52 20 42 26 58 30 62 30 46 36 60 42 58 40 40 50 56 54 66 60 60V90z" fill="#e10600"/><path d="M4 90C8 78 12 78 12 68 18 76 22 66 24 60 28 72 32 72 34 62 38 72 44 70 44 60 50 72 54 78 56 90z" fill="#ff8c00"/><path d="M10 90c3-8 6-8 7-14 4 6 7 4 9-2 3 8 6 8 8 2 3 6 6 8 7 14z" fill="#ffd400"/>'),
    water: () => svgUrl(60, 40, '<rect width="60" height="40" fill="#1060c0"/><path d="M0 10q7.5-6 15 0t15 0 15 0 15 0M0 30q7.5-6 15 0t15 0 15 0 15 0" stroke="#6cf" stroke-width="2" fill="none"/><circle cx="48" cy="20" r="2" fill="none" stroke="#bdf"/><circle cx="12" cy="38" r="1.5" fill="none" stroke="#bdf"/>'),
    paper: () => svgUrl(40, 24, '<rect width="40" height="24" fill="#fffef4"/><path d="M0 23.5h40" stroke="#9cc3ea"/>'),
    hearts: () => svgUrl(50, 50, '<rect width="50" height="50" fill="#ffd6ec"/><path d="M12 16c-4-6-11-2-8 4l8 7 8-7c3-6-4-10-8-4zM37 41c-3-4-8-1-6 3l6 5 6-5c2-4-3-7-6-3z" fill="#ff4fa0"/>'),
    slime: () => svgUrl(60, 60, '<rect width="60" height="60" fill="#3a6a14"/><g fill="#5a9a24"><circle cx="12" cy="14" r="8"/><circle cx="44" cy="20" r="6"/><circle cx="28" cy="46" r="9"/><circle cx="54" cy="52" r="4"/></g><g fill="#9c3"><circle cx="10" cy="11" r="2"/><circle cx="26" cy="43" r="2.5"/></g>'),
    matrix: () => svgUrl(48, 64, '<rect width="48" height="64" fill="#000"/><g font-family="monospace" font-size="11" fill="#00c000"><text x="2" y="12">1</text><text x="14" y="26">0</text><text x="26" y="10">1</text><text x="38" y="40">0</text><text x="2" y="44">0</text><text x="26" y="56">1</text><text x="14" y="62">1</text></g><g font-family="monospace" font-size="11" fill="#9f9"><text x="38" y="20">1</text><text x="14" y="44">0</text></g>'),
    checker: () => svgUrl(32, 32, '<rect width="32" height="32" fill="#fff"/><rect width="16" height="16" fill="#c0c0c0"/><rect x="16" y="16" width="16" height="16" fill="#c0c0c0"/>'),
    denim: () => svgUrl(16, 16, '<rect width="16" height="16" fill="#2a4a8a"/><path d="M0 16L16 0M-4 4L4-4M12 20l8-8" stroke="#3a5aa0" stroke-width="3"/><path d="M0 8L8 0M8 16l8-8" stroke="#22407a" stroke-width="1"/>'),
    rainbow: () => svgUrl(84, 84, '<rect width="84" height="84" fill="#ff0000"/>' + ['#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'].map((c, i) => `<path d="M${-84 + (i + 1) * 12} 84L${(i + 1) * 12} 0h12L${-72 + (i + 1) * 12} 84z" fill="${c}"/><path d="M${(i + 1) * 12} 84L${84 + (i + 1) * 12} 0h12L${12 + (i + 1) * 12} 84z" fill="${c}"/>`).join('')),
  };
  const HR = {
    flames: svgUrl(30, 24, '<path d="M0 24C2 14 6 16 5 8 9 14 11 8 12 2 15 10 18 12 18 4 22 12 26 12 26 6 28 12 30 16 30 24z" fill="#ff6a00"/><path d="M3 24c2-6 4-5 5-10 2 4 4 3 6-1 2 5 4 5 6 1 2 4 4 6 5 10z" fill="#ffd400"/>'),
    squig: svgUrl(24, 12, '<path d="M0 6q6-8 12 0t12 0" stroke="#e8381b" stroke-width="3" fill="none"/>'),
    barbed: svgUrl(30, 14, '<path d="M0 7h30" stroke="#666" stroke-width="2"/><path d="M12 2l6 10M18 2l-6 10" stroke="#444" stroke-width="2"/>'),
    stars: svgUrl(24, 20, '<path d="M12 1l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#ffd400" stroke="#a07000"/>'),
  };
  const CLIP = {
    globe: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#2a7ad8" stroke="#003080"/><path d="M7 9c3 0 5 3 8 2s2 5-1 6-2 5-5 4-3-6-2-12zM19 5c3 1 7 3 6 6s-4 1-5 4 2 5 0 9" fill="#3c3" stroke="#1a7a1a"/><path d="M2 16h28M16 2v28" stroke="#9cf" stroke-width=".7"/></svg>',
    mail: '<svg viewBox="0 0 32 32"><rect x="3" y="8" width="26" height="18" fill="#fff" stroke="#000"/><path d="M3 8l13 10L29 8" fill="#ffe680" stroke="#000"/><path d="M3 26l10-9M29 26l-10-9" stroke="#000"/></svg>',
    new: '<svg viewBox="0 0 32 32"><path d="M16 1l3 6 6-3-1 7 7 1-5 5 5 5-7 1 1 7-6-3-3 6-3-6-6 3 1-7-7-1 5-5-5-5 7-1-1-7 6 3z" fill="#e10600"/><text x="16" y="20" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="9" fill="#ffd400">NEW!</text></svg>',
    hot: '<svg viewBox="0 0 32 32"><path d="M16 2c2 6 9 8 9 17a9 9 0 0 1-18 0c0-5 3-6 4-10 1 3 3 4 3 4 0-4 0-8 2-11z" fill="#ff6a00" stroke="#a02000"/><text x="16" y="24" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="8" fill="#ffff00">HOT!</text></svg>',
    smiley: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ffd400" stroke="#000"/><ellipse cx="11" cy="12" rx="2" ry="3.5"/><ellipse cx="21" cy="12" rx="2" ry="3.5"/><path d="M8 19c3 6 13 6 16 0" stroke="#000" stroke-width="2" fill="none"/></svg>',
    heart: '<svg viewBox="0 0 32 32"><path d="M16 28L4 16C-1 10 6 2 11 6l5 4 5-4c5-4 12 4 7 10z" fill="#e10600" stroke="#800"/><path d="M8 10c1-2 3-2 4-1" stroke="#fff" stroke-width="2" fill="none"/></svg>',
    cone: '<svg viewBox="0 0 32 32"><path d="M13 3h6l7 23H6z" fill="#ff6a00" stroke="#000"/><path d="M11 10h10l2 6H9zM8 20h16l1.5 4h-19z" fill="#fff"/><rect x="3" y="26" width="26" height="4" fill="#ff6a00" stroke="#000"/></svg>',
    point: '<svg viewBox="0 0 32 32"><path d="M2 13h17c3 0 3 4 0 4h-4c3 0 3 4 0 4h-1c2 0 2 4 0 4H7c-3 0-5-3-5-6z" fill="#fff" stroke="#000"/><path d="M15 17h1M14 21h1" stroke="#000"/><path d="M19 13h10c2 0 2 3 0 3H19" fill="#fff" stroke="#000"/></svg>',
    fire: '<svg viewBox="0 0 32 32"><path d="M16 1c3 8 11 10 11 19a11 11 0 0 1-22 0c0-6 4-8 5-12 1 4 3 5 3 5 0-5 0-9 3-12z" fill="#e10600"/><path d="M16 12c2 5 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 2 3 2 3 0-3 0-5 1-8z" fill="#ffd400"/></svg>',
    eyes: '<svg viewBox="0 0 32 32"><ellipse cx="10" cy="16" rx="8" ry="10" fill="#fff" stroke="#000"/><ellipse cx="22" cy="16" rx="8" ry="10" fill="#fff" stroke="#000"/><g class="hpz-pupils"><circle cx="11" cy="17" r="3.5"/><circle cx="23" cy="17" r="3.5"/></g></svg>',
  };
  const UC = {
    sign: '<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><path d="M40 3l37 37-37 37L3 40z" fill="#ffd400" stroke="#000" stroke-width="4" stroke-linejoin="round"/><circle cx="33" cy="22" r="5"/><path d="M32 28l-5 15 8 3 3 13M30 35l10 5 7-4M27 43l-6 12" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M47 36l7 18" stroke="#000" stroke-width="3"/><path d="M48 54h12l-3 5h-8zM42 63c5-7 16-7 21 0z"/></svg>',
    worker: '<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><rect x="2" y="62" width="76" height="16" fill="#8a5a2a"/><path d="M50 62c4-10 18-10 22 0z" fill="#5a3a1a"/><circle cx="28" cy="20" r="6" fill="#f2c79a" stroke="#000"/><path d="M21 16h14l-1-5H22z" fill="#ffd400" stroke="#000"/><path d="M28 26v20l-6 16M28 46l7 16" stroke="#2a4a8a" stroke-width="5" fill="none" stroke-linecap="round"/><g class="hpz-dig"><path d="M28 32l14 6" stroke="#f2c79a" stroke-width="4" stroke-linecap="round"/><path d="M38 30l14 26" stroke="#5a3a1a" stroke-width="3"/><path d="M48 54l8 2-2 6-8-2z" fill="#999" stroke="#000"/></g></svg>',
    tape: '',
  };
  const sprPx = z => [0, 24, 36, 48, 64][int(z, 1, 4, 3)];
  function sticker(n, z, spin) {
    const px = sprPx(z), cls = spin ? ' hpz-spin' : '';
    if (H.SPRITES.includes(n)) return `<canvas class="hpz-spr${cls}" width="12" height="12" data-spr="${esc(n)}" style="width:${px}px;height:${px}px" aria-label="${esc(n)}"></canvas>`;
    if (CLIP[n]) return `<span class="hpz-clip hpz-clip-${esc(n)}${cls}" style="width:${px}px;height:${px}px" aria-label="${esc(n)}">${CLIP[n]}</span>`;
    return '';
  }
  function paint(el) { // draw the pixel stickers (web-kit.js has the sprite art)
    const W = window.WebPack;
    el.querySelectorAll('canvas.hpz-spr[data-spr]').forEach(cv => {
      const g = cv.getContext('2d'); if (!g) return;
      g.clearRect(0, 0, 12, 12);
      if (W && W.drawSprite && H.SPRITES.includes(cv.dataset.spr)) W.drawSprite(g, cv.dataset.spr, 0, 0, {});
      else { g.fillStyle = '#c0c0c0'; g.fillRect(1, 1, 10, 10); g.fillStyle = '#e10600'; g.fillRect(3, 3, 6, 6); }
    });
  }

  // ================================================================ counters
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function inWords(n) {
    n = Math.max(0, Math.floor(n));
    if (n < 20) return WORDS[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
    if (n < 1000) return WORDS[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
    if (n < 1e6) return inWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + inWords(n % 1000) : '');
    return inWords(Math.floor(n / 1e6)) + ' million' + (n % 1e6 ? ' ' + inWords(n % 1e6) : '');
  }
  function counter(style, n) {
    n = Math.max(0, int(n, 0, 1e9, 0));
    const digits = String(n).padStart(6, '0');
    switch (style) {
      case 'lcd': case 'led': return `<span class="hpz-ctv hpz-ct-${style}">${digits}</span>`;
      case 'plain': return `<b class="hpz-ctv">${n.toLocaleString('en-GB')}</b>`;
      case 'words': return `<b class="hpz-ctv">${inWords(n)}</b>`;
      default: return `<span class="hpz-ctv hpz-ct-odo">${digits.split('').map(d => `<i>${d}</i>`).join('')}</span>`;
    }
  }

  // ================================================================ blocks -> HTML (escaped!)
  const tc = (b, extra) => Object.assign({ 'text-align': AL[b.a], color: colr(b.c, null), 'font-family': fontOf(b.f, null) }, extra || {});
  function gbEntry(x, o) {
    const by = esc(String(x.by || 'Somebody').slice(0, 20));
    const del = (o.mine || o.mod) && !o.edit && x.id ? ` <button type="button" class="hpz-gbdel" data-gbdel="${esc(String(x.id).slice(0, 30))}">Delete</button>` : '';
    return `<div class="hpz-gbe"><div class="hpz-gbeh"><b>${by}</b>${x.m ? ' <span class="hpz-mem">JackNet member</span>' : ''}${x.from ? ` from <b>${esc(x.from)}</b>` : ''} <span class="hpz-gbd">${d99(x.ts)} ${t99(x.ts)}</span>${del}</div><div class="hpz-gbet">${esc(x.text)}</div>${x.how && HOWL[x.how] ? `<div class="hpz-gbhow">Found this page by: ${esc(HOWL[x.how])}</div>` : ''}</div>`;
  }
  function pollResults(b, v, mine) {
    const tot = v.reduce((s, x) => s + (x | 0), 0) || 0;
    return b.o.map((t, i) => { const n = v[i] | 0, pc = tot ? Math.round(n / tot * 100) : 0; return `<div class="hpz-pr${i === mine ? ' mine' : ''}"><span class="hpz-prl">${esc(t)}${i === mine ? ' (your vote)' : ''}</span><span class="hpz-prb"><i style="width:${pc}%"></i></span><span class="hpz-prn">${n} (${pc}%)</span></div>`; }).join('') + `<div class="hpz-prt">${tot} vote${tot === 1 ? '' : 's'} so far</div>`;
  }
  const BLK = {
    h: b => { const s = int(b.s, 1, 4, 2); return `<div class="hpz-h hpz-h${s}" role="heading" aria-level="${s}" style="${st(tc(b))}">${esc(b.t)}</div>`; },
    p: b => `<p class="hpz-p" style="${st(tc(b))}">${esc(b.t).replace(/\n/g, '<br>')}</p>`,
    mq: b => { const d = one(b.d, ['l', 'r', 'b'], 'l'), sp = one(b.sp, ['s', 'm', 'f'], 'm'); return `<div class="hpz-mq hpz-mq-${d} hpz-sp-${sp}" style="${st({ background: colr(b.bc, null) })}"><div class="hpz-mqw"><span class="hpz-mqi" style="${st(tc(b, { 'text-align': null }))}">${esc(b.t)}</span></div></div>`; },
    bl: b => `<div class="hpz-bl" style="${st({ 'text-align': AL[b.a] || 'center' })}"><span style="${st(tc(b, { 'text-align': null }))}">${esc(b.t)}</span></div>`,
    hr: b => `<div class="hpz-hr hpz-hr-${one(b.st, ID.hr, 'groove')}" role="separator"></div>`,
    uc: b => { const s = one(b.st, ID.uc, 'sign'); return `<div class="hpz-uc hpz-uc-${s}">${UC[s] || ''}<div class="hpz-uct">${esc(b.t || 'This page is UNDER CONSTRUCTION!!! Come back soon!')}</div></div>`; },
    st: b => `<div class="hpz-st" style="${st({ 'text-align': AL[b.a] || 'center' })}">${(Array.isArray(b.s) ? b.s : []).slice(0, L.stickers).map(n => sticker(n, b.z, b.sp)).join(' ')}</div>`,
    ct: (b, o) => `<div class="hpz-ct" style="${st({ 'text-align': AL[b.a] || 'center' })}">${esc(H.CLABELS[int(b.l, 0, H.CLABELS.length - 1, 0)])} ${counter(one(b.st, ID.ct, 'odo'), o.hits)}</div>`,
    gb: (b, o) => {
      const list = (Array.isArray(o.gb) ? o.gb : []).slice(-L.gb).reverse();
      const sample = o.edit && !list.length ? [{ by: 'Your visitors', text: 'Their messages will appear here! (Everybody signs their own guestbook first. It is the law.)', ts: Date.now() }] : list;
      const me = H.me();
      const form = o.edit ? '' : `<form class="hpz-gbf"><div class="hpz-gbfr">Your name: <b>${esc(me.nick || 'Guest')}</b>${me.member ? '' : ' <span class="hpz-small">(guests can sign too!)</span>'}</div>
<label class="hpz-gbfr">Where are you from? <input name="from" maxlength="30" autocomplete="off" placeholder="e.g. Planet Earth"></label>
<label class="hpz-gbfr">How did you find my page? <select name="how"><option value="">(pick one)</option>${H.HOWS.map(h => `<option value="${esc(h[0])}">${esc(h[1])}</option>`).join('')}</select></label>
<label class="hpz-gbfr">Your message:<textarea name="text" maxlength="${L.gbText}" rows="3"></textarea></label>
<button class="hpz-btn" type="submit">Sign my guestbook!!!</button> <span class="hpz-gbmsg" role="status"></span></form>`;
      return `<div class="hpz-gb"><div class="hpz-gbh">${CLIP.mail}<span>${esc(b.t || 'Sign my guestbook!!!')}</span></div>${form}<div class="hpz-gbn">${list.length} signature${list.length === 1 ? '' : 's'}</div><div class="hpz-gbl">${sample.length ? sample.map(x => gbEntry(x, o)).join('') : '<p class="hpz-gbempty">Nobody has signed yet. Be the FIRST!!!</p>'}</div></div>`;
    },
    ln: b => `<div class="hpz-ln">${b.h ? `<div class="hpz-lnh">${esc(b.h)}</div>` : ''}<ul>${(Array.isArray(b.l) ? b.l : []).slice(0, L.links).map(x => { const u = H.normUrl(x && x.u); return u ? `<li><a href="${esc(u)}">${esc((x.t || u).slice(0, 80))}</a></li>` : ''; }).join('')}</ul></div>`,
    ul: b => { const bu = one(b.bu, ID.bu, 'dot'); const tag = bu === 'num' ? 'ol' : 'ul'; return `<div class="hpz-ul" style="${st({ color: colr(b.c, null) })}">${b.h ? `<div class="hpz-lnh">${esc(b.h)}</div>` : ''}<${tag} class="hpz-bu-${bu}">${(Array.isArray(b.it) ? b.it : []).slice(0, L.items).map(x => `<li>${esc(x)}</li>`).join('')}</${tag}></div>`; },
    ring: b => {
      const r = one(b.r, ID.ring, 'hpz');
      if (r === 'hpz') return `<div class="hpz-ring"><div class="hpz-ringt">${CLIP.globe}<span>This page is a proud member of the<br><b>HOMEPAGEZ MEMBER RING</b></span>${CLIP.globe}</div><div class="hpz-ringb"><button type="button" class="hpz-btn" data-ring="prev">&laquo; Prev</button><button type="button" class="hpz-btn" data-ring="rand">Random</button><button type="button" class="hpz-btn" data-ring="next">Next &raquo;</button><button type="button" class="hpz-btn" data-ring="list">List sites</button></div></div>`;
      const hub = r === 'biscuit' ? ['http://www.biscuitring.webcom/', 'THE BISCUIT RING', 'Homepages best enjoyed with a cup of tea', 'http://www.biscuitring.webcom/join.html'] : ['http://www.galaxyring.jnet/', 'THE GALAXY RING', 'Space, sci-fi and a galaxy far, far away', 'http://www.galaxyring.jnet/'];
      return `<div class="hpz-ring hpz-ring-${r}"><div class="hpz-ringt"><span>This site is a member of<br><b>${hub[1]}</b><br><small>${hub[2]}</small></span></div><div class="hpz-ringb"><a href="${hub[0]}">&laquo; Prev</a> | <a href="${hub[0]}">Ring Hub</a> | <a href="${hub[0]}">Next &raquo;</a> | <a href="${hub[3]}">Join!</a></div></div>`;
    },
    bdg: b => `<div class="hpz-bdgs" style="${st({ 'text-align': AL[b.a] || 'center' })}">${(Array.isArray(b.b) ? b.b : []).slice(0, L.badges).filter(id => BADGE[id]).map(id => { const x = BADGE[id]; return `<span class="hpz-bdg" style="${st({ background: x[3], color: x[4] })}"><small>${esc(x[1])}</small><b>${esc(x[2])}</b></span>`; }).join('')}</div>`,
    poll: (b, o) => {
      const pv = o.poll && Array.isArray(o.poll.v) ? o.poll : null, mine = pv ? int(pv.mine, -1, 9, -1) : -1;
      const opts = (Array.isArray(b.o) ? b.o : []).slice(0, L.opts);
      const showRes = pv && mine >= 0;
      return `<div class="hpz-poll"><div class="hpz-pollh">VISITOR POLL!!!</div><div class="hpz-pollq">${esc(b.q)}</div><div class="hpz-pollo"${showRes ? ' hidden' : ''}>${opts.map((t, i) => `<label><input type="radio" name="hpzpoll" value="${i}"${o.edit ? ' disabled' : ''}> ${esc(t)}</label>`).join('')}<button type="button" class="hpz-btn" data-vote="1"${o.edit ? ' disabled' : ''}>Vote!</button></div><div class="hpz-pollr">${showRes ? pollResults({ o: opts }, pv.v, mine) : ''}</div></div>`;
    },
    mail: b => `<div class="hpz-mail" style="${st({ 'text-align': AL[b.a] || 'center' })}"><button type="button" class="hpz-mailb" data-mail="1"><span class="hpz-clip hpz-clip-mail">${CLIP.mail}</span><span>${esc(b.t || 'E-MAIL ME!!!')}</span></button></div>`,
  };

  // a whole page. o: { edit, sel, hits, gb, poll, name, k, a, mine, mod, u, no }
  function render(p, o) {
    o = o || {};
    p = p && typeof p === 'object' ? p : {};
    const css = { 'background-color': colr(p.bgc, '#ffffff'), color: colr(p.tc, '#000000'), 'font-family': fontOf(p.font, FONT.times), '--hpz-lc': colr(p.lc, '#0000ff') };
    if (TILES[p.bg]) css['background-image'] = TILES[p.bg]();
    const blocks = (Array.isArray(p.blocks) ? p.blocks : []).slice(0, L.blocks).map((b, i) => {
      let h = ''; try { h = b && BLK[b.k] ? BLK[b.k](b, o) : ''; } catch (err) { h = ''; }
      return o.edit ? `<div class="hpz-b${o.sel === i ? ' sel' : ''}" data-i="${i}" tabindex="0">${h || '<i class="hpz-small">(empty block: fill it in on the right)</i>'}</div>` : h;
    }).join('');
    const hood = H.findHood(p.hood), street = H.findStreet(hood, p.street), num = int(p.num, 1, 9999, 0);
    const addr = hood && street && num ? H.addrText(hood, street, num) : '';
    const tune = TUNE[p.midi] && p.midi !== 'none' ? p.midi : '';
    const midi = tune ? `<div class="hpz-midi" data-tune="${esc(tune)}"><button type="button" data-mp="play" aria-label="Play music">&#9654;</button><button type="button" data-mp="stop" aria-label="Stop music">&#9632;</button><span class="hpz-midin">${esc(TUNE[tune])}</span><span class="hpz-midit">0:00</span></div>` : '';
    const ad = o.edit ? '' : `<div class="hpz-ad"><b class="hpz-adl">HOMEPAGEZ</b><span>This page is hosted FREE by Homepagez!</span><a href="http://${H.MH}/signup.html">Get YOUR free homepage!</a><a href="http://${H.MH}/directory.html">Member Pages</a>${hood ? `<a href="http://${H.WH}/${hood}/">${hood}</a>` : ''}</div>`;
    const foot = o.edit ? '' : `<div class="hpz-foot">This page was made with <b>Homepagez PageBuilder 2.0</b>. Last updated: ${d99(o.u)}.<br>${addr ? `<a href="${esc(H.addrUrl(addr))}">${esc(H.addrUrl(addr))}</a>` : ''}${o.name ? ` &middot; <a href="${esc(H.memberUrl(o.name))}">${esc(H.memberUrl(o.name))}</a><br>~${esc(o.name)} is JackNet member #${int(o.no, 0, 1e7, 0)}.` : ''}${o.mine ? ' <button type="button" class="hpz-btn" data-edit="1">Edit my page</button>' : ''}</div>`;
    return `<div class="hpz-page${o.edit ? ' hpz-edit' : ''}" style="${st(css)}">${ad}<div class="hpz-wm" title="A Homepagez page" aria-hidden="true">${CLIP.globe}<b>HPZ</b></div>${midi}<div class="hpz-blocks">${blocks || (o.edit ? '<p class="hpz-small" style="text-align:center;padding:40px 0">Your page is empty! Click the buttons on the toolbar to add things.</p>' : '')}</div>${foot}</div>`;
  }

  // ================================================================ wiring a live page
  const live = []; // { el, off[] }
  const setTitle = t => { const wt = document.getElementById('winTitle'), tb = document.getElementById('taskBrowser'); if (wt) wt.textContent = t + ' - JackNet Explorer'; if (tb) tb.textContent = t; document.title = t; };
  document.addEventListener('section', () => {
    for (let i = live.length - 1; i >= 0; i--) if (!live[i].el.isConnected) { live[i].off.forEach(f => f()); live.splice(i, 1); }
    if (musicEl && !musicEl.isConnected) stopTune();
  });
  let ringHops = 0;
  function wirePage(el, m) {
    const rec = { el, off: [] }; live.push(rec);
    paint(el);
    const key = m.k, page = m.page;
    // MIDI player
    const mp = el.querySelector('.hpz-midi');
    if (mp) {
      const tm = mp.querySelector('.hpz-midit'); let t0 = 0, iv = null;
      const stop = () => { clearInterval(iv); iv = null; mp.classList.remove('on'); tm.textContent = '0:00'; };
      const play = () => { playTune(mp.dataset.tune, el); mp.classList.add('on'); t0 = Date.now(); clearInterval(iv); iv = setInterval(() => { if (!el.isConnected || !window.Sound || !Sound.music.playing) return stop(); const s = Math.floor((Date.now() - t0) / 1000); tm.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500); };
      mp.querySelector('[data-mp=play]').addEventListener('click', () => { if (window.Sound && !Sound.on) Desk.toast('MIDI', 'Turn the sound on (the speaker in the tray) to hear the music!'); play(); });
      mp.querySelector('[data-mp=stop]').addEventListener('click', () => { stopTune(); stop(); });
      rec.off.push(stop);
      if (window.Sound && Sound.on) setTimeout(() => { if (el.isConnected) play(); }, 600); // 1999 pages ALWAYS autoplayed
    }
    // guestbook
    const gbBox = el.querySelector('.hpz-gb');
    const gbList = gbBox && gbBox.querySelector('.hpz-gbl'), gbN = gbBox && gbBox.querySelector('.hpz-gbn');
    const gbOpts = { mine: m.mine, mod: m.mod };
    const showGb = gb => { m.gb = gb; if (!gbList) return; const list = gb.slice(-L.gb).reverse(); gbList.innerHTML = list.length ? list.map(x => gbEntry(x, gbOpts)).join('') : '<p class="hpz-gbempty">Nobody has signed yet. Be the FIRST!!!</p>'; gbN.textContent = list.length + ' signature' + (list.length === 1 ? '' : 's'); };
    if (gbBox) {
      const f = gbBox.querySelector('form'), msg = f && f.querySelector('.hpz-gbmsg');
      if (f) f.addEventListener('submit', ev => {
        ev.preventDefault();
        const text = f.elements.text.value.trim();
        if (!text) { msg.textContent = 'Write a message first!'; return; }
        const btn = f.querySelector('button'); btn.disabled = true; msg.textContent = 'Signing...';
        H.req({ t: 'hpzSign', name: key, text, from: f.elements.from.value, how: f.elements.how.value }).then(r => {
          btn.disabled = false;
          if (!r.ok) { msg.textContent = r.err || 'That did not work. Try again!'; Sound.play('uhoh'); return; }
          f.elements.text.value = ''; msg.textContent = 'THANK YOU for signing!!!'; Sound.play('join');
          showGb(r.gb || m.gb);
          A.secret(m.mine ? 'hpz.self' : 'hpz.sign');
        });
      });
      gbBox.addEventListener('click', ev => {
        const b = ev.target.closest('[data-gbdel]'); if (!b) return;
        Desk.msgbox('Guestbook', 'Delete this guestbook entry?', 'q', [['Delete', () => H.req({ t: 'hpzGbDel', name: key, id: b.dataset.gbdel }).then(r => { if (r.ok) showGb(m.gb.filter(x => x.id !== b.dataset.gbdel)); })], ['Cancel']]);
      });
      rec.off.push(H.on('hpzGbNew', x => { if (x.n === key && x.e && el.isConnected) { showGb(m.gb.concat([x.e])); if (m.mine) Desk.toast('Homepagez', 'Somebody just signed your guestbook!'); } }));
    }
    // poll
    const pl = el.querySelector('.hpz-poll'), pb = page.blocks.find(b => b.k === 'poll');
    if (pl && pb) {
      const res = pl.querySelector('.hpz-pollr'), opts = pl.querySelector('.hpz-pollo');
      const showRes = (v, mine) => { opts.hidden = true; res.innerHTML = pollResults(pb, v, mine); };
      pl.querySelector('[data-vote]').addEventListener('click', () => {
        const ch = pl.querySelector('input[name=hpzpoll]:checked'); if (!ch) { Desk.toast('Poll', 'Pick an answer first!'); return; }
        H.req({ t: 'hpzVote', name: key, i: +ch.value }).then(r => { if (r.v) { m.poll = { v: r.v, mine: r.mine }; showRes(r.v, r.mine); Sound.play('click'); A.secret('hpz.poll'); } });
      });
      rec.off.push(H.on('hpzPollNew', x => { if (x.n === key && Array.isArray(x.v) && m.poll && el.isConnected) { m.poll.v = x.v; if (opts.hidden) showRes(x.v, m.poll.mine); } }));
    }
    // webring
    el.querySelectorAll('[data-ring]').forEach(b => b.addEventListener('click', () => {
      const what = b.dataset.ring;
      if (what === 'list') { H.go('http://' + H.MH + '/directory.html'); return; }
      b.disabled = true;
      H.req({ t: 'hpzList', what: 'ring' }).then(r => {
        b.disabled = false;
        const ring = (r.items || []).filter(x => x && x.k); if (!ring.length) return;
        let i = ring.findIndex(x => x.k === key); if (i < 0) i = 0;
        const n = ring.length;
        const to = what === 'next' ? ring[(i + 1) % n] : what === 'prev' ? ring[(i + n - 1) % n] : ring[n > 1 ? (i + 1 + Math.floor(Math.random() * (n - 1))) % n : 0];
        if (++ringHops >= Math.max(3, n)) A.secret('hpz.ring');
        H.go(H.memberUrl(to.k));
      });
    }));
    // e-mail me (an Uh-Oh! offline message to the owner)
    el.querySelectorAll('[data-mail]').forEach(b => b.addEventListener('click', () => {
      const me = H.me();
      if (m.mine) return Desk.msgbox('E-mail', "You can't e-mail yourself! (Well, you can. But it's a bit sad.)", 'info');
      if (!me.member) return Desk.msgbox('E-mail', 'You need to be logged on to JackNet to e-mail ~' + m.n + '. (Membership is FREE!)', 'info');
      Desk.ask('Send an e-mail', 'Your message to ~' + m.n + ' (it arrives as an Uh-Oh! offline message):', '', 300, text => {
        if (!String(text || '').trim()) return;
        Net.send({ t: 'pmSend', to: m.n, kind: 'msg', text: '[Homepagez e-mail] ' + text });
        Desk.toast('E-mail sent!', 'Your message is on its way to ~' + m.n + '. (Via the information superhighway.)');
      });
    }));
    const eb = el.querySelector('[data-edit]'); if (eb) eb.addEventListener('click', () => H.openBuilder({ load: true }));
  }

  // ================================================================ pages
  function errorPage(el, err) {
    el.innerHTML = `<div class="hpz-404"><h1>The page cannot be displayed</h1><p>${esc(err || 'The Homepagez server is not answering.')}</p><p>Try clicking <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p></div>`;
  }
  function notFound(el, arg) {
    const me = H.me();
    let html;
    if (arg.addr) {
      const [hood, street, num] = arg.addr.split('/');
      const free = !H.isTaken(hood, street, num), rent = H.isRent(hood, street, num);
      html = free
        ? `<div class="hpz-forrent"><div class="hpz-frsign">${rent ? 'FOR RENT!' : 'EMPTY PLOT!'}</div><h1>${esc(arg.addr)}</h1><p>Nobody lives here yet! This house in <b>${esc(hood)}</b> is ${rent ? 'for rent' : 'free'}: <b>2 MB of web space</b>, all yours.</p><p><button type="button" class="hpz-btn hpz-big" data-movein="1">Move in! Build your page here</button></p><p class="hpz-small">You need a (FREE!) JackNet membership to move in.</p></div>`
        : `<div class="hpz-404"><h1>404 Not Found</h1><p>The homepage at <b>${esc(arg.addr)}</b> has moved, or it's still UNDER CONSTRUCTION. Its owner probably got a new computer. Or got bored. Or went outside.</p><p><a href="http://${H.MH}/directory.html">Browse the Member Pages</a></p></div>`;
    } else {
      const mineName = me.member && String(me.nick || '').toLowerCase() === arg.name;
      html = `<div class="hpz-404"><h1>Sorry!</h1><p><b>~${esc(arg.name)}</b> has not built a homepage yet.${mineName ? '' : ' (Or they are still deciding what colour the background should be.)'}</p>${mineName ? '<p><button type="button" class="hpz-btn hpz-big" data-movein="1">Build my homepage now!</button></p>' : `<p><a href="http://${H.MH}/directory.html">Browse the Member Pages</a> &middot; <a href="http://${H.MH}/signup.html">Build YOUR OWN free homepage!</a></p>`}</div>`;
    }
    el.innerHTML = html;
    const b = el.querySelector('[data-movein]');
    if (b) b.addEventListener('click', () => { const [hood, street, num] = (arg.addr || '').split('/'); H.openBuilder(arg.addr ? { hood, street, num: +num } : {}); });
  }
  function mountPage(el, arg) {
    H.req(Object.assign({ t: 'hpzGet', visit: 1 }, arg.name ? { name: arg.name } : { addr: arg.addr })).then(m => {
      if (m.t === 'hpzErr') return errorPage(el, m.err);
      if (!m.page) return notFound(el, arg);
      H.titles[m.k] = m.page.title;
      el.innerHTML = render(m.page, { hits: m.hits, gb: m.gb, poll: m.poll, name: m.n, k: m.k, a: m.a, mine: m.mine, mod: m.mod, u: m.u, no: m.no });
      if (el.isConnected) setTitle(m.page.title + ' - Homepagez');
      wirePage(el, m);
      if (!m.mine) A.secret('hpz.visit');
      if (m.page.blocks.filter(b => b.k === 'bl').length >= 5) A.secret('hpz.blink');
    });
  }

  // ---- the Member Pages directory
  const HOODS = Object.keys(H.HOODS);
  const isNew = ts => Date.now() - (ts || 0) < 7 * 864e5;
  const item = x => `<tr><td class="hpz-dt"><a href="${esc(H.memberUrl(x.k || x.n))}">${esc(x.t || 'Untitled')}</a>${isNew(x.c) ? ' <span class="hpz-newb">NEW!</span>' : ''}<br><span class="hpz-small">~${esc(x.n)} &middot; <a href="${esc(H.addrUrl(x.a))}">${esc(x.a)}</a></span></td><td class="hpz-dn"><b>${int(x.h, 0, 1e9, 0).toLocaleString('en-GB')}</b> visitors<br><span class="hpz-small">${int(x.g, 0, 999, 0)} signed &middot; updated ${d99(x.u)}</span></td></tr>`;
  function mountDir(el) {
    let tab = 'hood', hood = null;
    el.innerHTML = `<div class="hpz-dir"><div class="hpz-dtop"><span class="hpz-dlogo">${CLIP.globe}<b>HOMEPAGEZ</b></span><span class="hpz-dsub">Member Pages: real homes on the Web, built by real JackNet members!</span></div>
<div class="hpz-dcols"><div class="hpz-dmain"><div class="hpz-tabs" role="tablist">${[['hood', 'By Neighbourhood'], ['new', 'Newest'], ['top', 'Most Visited'], ['upd', 'Just Updated'], ['all', 'A-Z']].map(([k, l]) => `<button type="button" class="hpz-tab" data-tab="${k}">${l}</button>`).join('')}</div><div class="hpz-dbody"><p>Loading the directory...</p></div></div>
<div class="hpz-dside"><div class="hpz-signbox"><b>Build your own FREE homepage!</b><br><span class="hpz-blink2">2 MB of space!!!</span><br><a href="http://${H.MH}/signup.html">Sign up now &raquo;</a></div><div class="hpz-small" style="margin-top:10px"><b>What is this?</b><br>Every page here was built by a JackNet member with <i>Homepagez PageBuilder</i> (Start &gt; Programs &gt; Internet). Visit them! Sign their guestbooks! Be nice!</div><div class="hpz-dtot hpz-small"></div></div></div></div>`;
    const bodyEl = el.querySelector('.hpz-dbody');
    const draw = () => {
      el.querySelectorAll('.hpz-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      bodyEl.innerHTML = '<p>Contacting ftp.homepagez.webcom... Getting the list...</p>';
      const msg = tab === 'hood' && hood ? { t: 'hpzList', what: 'hood', hood } : { t: 'hpzList', what: tab === 'hood' ? 'new' : tab };
      H.req(msg).then(r => {
        if (!el.isConnected && el.parentNode === null) return;
        if (r.t === 'hpzErr') { bodyEl.innerHTML = `<p>${esc(r.err)}</p>`; return; }
        (r.items || []).forEach(x => { if (x.k) H.titles[x.k] = x.t; });
        el.querySelector('.hpz-dtot').textContent = (r.total || 0) + ' member page' + (r.total === 1 ? '' : 's') + ' and counting!';
        if (tab === 'hood' && !hood) {
          bodyEl.innerHTML = `<div class="hpz-hoods">${HOODS.map(h => { const x = H.HOODS[h]; return `<button type="button" class="hpz-hood" data-hood="${esc(h)}" style="${st({ background: x.bg, color: x.fg })}"><b>${esc(h)}</b><span>${esc(x.blurb)}</span><span class="hpz-hoodn">${int((r.hoods || {})[h], 0, 1e6, 0)} member page${(r.hoods || {})[h] === 1 ? '' : 's'}</span></button>`; }).join('')}</div>`;
          bodyEl.querySelectorAll('[data-hood]').forEach(b => b.addEventListener('click', () => { hood = b.dataset.hood; draw(); }));
          return;
        }
        const head = tab === 'hood' ? `<h2>${esc(hood)} <a class="hpz-small" href="http://${H.WH}/${esc(hood)}/">(visit the neighbourhood)</a></h2><p class="hpz-small">${esc(H.HOODS[hood].blurb)}</p><button type="button" class="hpz-btn" data-back="1">&laquo; All neighbourhoods</button>` : '';
        bodyEl.innerHTML = head + ((r.items || []).length ? `<table class="hpz-dtab">${r.items.map(item).join('')}</table>` : `<p class="hpz-empty">Nobody lives here yet! <a href="http://${H.MH}/signup.html">Be the first to move in!</a></p>`);
        const bk = bodyEl.querySelector('[data-back]'); if (bk) bk.addEventListener('click', () => { hood = null; draw(); });
      });
    };
    el.querySelectorAll('.hpz-tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; hood = null; draw(); }));
    draw();
  }

  // ---- "Build your own FREE homepage! 2 MB of space!"
  function mountSignup(el) {
    const me = H.me();
    let pick = HOODS[0];
    el.innerHTML = `<div class="hpz-signup"><div class="hpz-stop"><div class="hpz-sbig">Build your own <span class="hpz-free">FREE</span> homepage!</div><div class="hpz-s2">${CLIP.new} <b class="hpz-blink2">2 MB of space!!!</b> ${CLIP.new}</div></div>
<div class="hpz-scols"><div class="hpz-sfeat"><h3>You get:</h3><ul class="hpz-ticks"><li>2 MB of web space (that's nearly two floppy disks!)</li><li>Your very own address on the World Wide Web</li><li>A real hit counter (starts at 0, no cheating)</li><li>A guestbook so people can say hello</li><li>45 pieces of clip art and 15 backgrounds</li><li>Scrolling marquees and BLINKING text</li><li>Free MIDI music (17 tunes!)</li><li>Free FTP-ing to our server</li><li>NO HTML needed!</li></ul><p class="hpz-small">* Homepagez puts a small advert on your page. That is how it's free. Like telly.</p></div>
<div class="hpz-ssteps"><div class="hpz-step"><b>STEP 1:</b> Join JackNet (it's FREE!)<div class="hpz-s1"></div></div><div class="hpz-step"><b>STEP 2:</b> Pick a neighbourhood<div class="hpz-pick">${HOODS.map(h => `<button type="button" class="hpz-hood hpz-hsm" data-hood="${esc(h)}" style="${st({ background: H.HOODS[h].bg, color: H.HOODS[h].fg })}"><b>${esc(h)}</b></button>`).join('')}</div><div class="hpz-rules"></div></div><div class="hpz-step"><b>STEP 3:</b> Build it and publish it!<br><button type="button" class="hpz-btn hpz-big" data-start="1">Start PageBuilder &raquo;</button><div class="hpz-mine hpz-small"></div></div></div></div>
<p class="hpz-small" style="text-align:center"><a href="http://${H.MH}/directory.html">Browse the Member Pages</a> &middot; <a href="http://${H.WH}/">All neighbourhoods</a> &middot; <a href="http://${H.MH}/">Homepagez home</a></p></div>`;
    const s1 = el.querySelector('.hpz-s1');
    s1.innerHTML = me.member ? `<span class="hpz-ok">&#10004; You are logged on as <b>${esc(me.nick)}</b>. Your address will be <tt>${esc(H.memberUrl(me.nick))}</tt></span>` : '<button type="button" class="hpz-btn" data-join="1">Join JackNet / Log on</button>';
    const jb = s1.querySelector('[data-join]'); if (jb) jb.addEventListener('click', () => IE.go('members', 'click'));
    const rules = el.querySelector('.hpz-rules');
    const drawRules = () => { el.querySelectorAll('.hpz-pick [data-hood]').forEach(b => b.classList.toggle('on', b.dataset.hood === pick)); rules.innerHTML = `<b>${esc(pick)} neighbourhood rules:</b><ol>${H.HOODS[pick].rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`; };
    el.querySelectorAll('.hpz-pick [data-hood]').forEach(b => b.addEventListener('click', () => { pick = b.dataset.hood; drawRules(); Sound.play('click'); }));
    drawRules();
    el.querySelector('[data-start]').addEventListener('click', () => H.openBuilder({ hood: pick }));
    if (me.member) H.req({ t: 'hpzGet', name: me.nick }).then(r => { if (r.page) el.querySelector('.hpz-mine').innerHTML = `You already live at <a href="${esc(H.addrUrl(r.a))}">${esc(r.a)}</a>! (${int(r.hits, 0, 1e9, 0)} visitors so far)`; });
  }

  // ---- panels on the made-up Homepagez pages
  function deco(box, what) {
    const msg = what.kind === 'hood' ? { t: 'hpzList', what: 'hood', hood: what.hood } : { t: 'hpzList', what: 'new' };
    H.req(msg).then(r => {
      if (!box.isConnected) return;
      const items = (r.items || []).slice(0, what.kind === 'hood' ? 40 : 6);
      items.forEach(x => { if (x.k) H.titles[x.k] = x.t; });
      const title = what.kind === 'hood' ? `NEW RESIDENTS OF ${esc(what.hood.toUpperCase())}` : 'JUST MOVED IN: JackNet members\' pages';
      box.innerHTML = `<div class="hpz-decob"><div class="hpz-decoh">${CLIP.new}<b>${title}</b><span class="hpz-small">(real pages by real JackNet members!)</span></div>${items.length ? `<table class="hpz-dtab">${items.map(item).join('')}</table>` : `<p>Nobody from JackNet lives here yet. <b>You could be the first!</b></p>`}<p><a href="http://${H.MH}/signup.html">Build your own FREE homepage! 2 MB of space!</a> &middot; <a href="http://${H.MH}/directory.html">All Member Pages${r.total ? ' (' + int(r.total, 0, 1e6, 0) + ')' : ''}</a></p></div>`;
      if (what.kind === 'hood') fixRent(box, what.hood, items);
    });
  }
  // the made-up neighbourhood page lists some houses as "FOR RENT!": say who moved in, or offer to move in
  function fixRent(box, hood, items) {
    const by = {}; items.forEach(x => { if (x.a) by[String(x.a).toLowerCase()] = x; });
    let tries = 0;
    const fix = () => {
      if (!box.isConnected) return;
      const sec = document.getElementById('s-secret'), rents = sec ? sec.querySelectorAll('.hz-rent:not([data-hpz])') : [];
      if (!rents.length) { if (++tries < 15) setTimeout(fix, 300); return; }
      rents.forEach(sp => {
        sp.dataset.hpz = '1';
        const tr = sp.closest('tr'), stEl = sp.closest('.hz-st'), h3 = stEl && stEl.querySelector('h3'), nb = tr && tr.querySelector('b');
        const street = h3 && H.findStreet(hood, h3.textContent.replace(/\s*Street\s*$/i, '').trim()), num = nb && parseInt(nb.textContent.replace(/\D/g, ''), 10);
        if (!street || !num) return;
        const x = by[H.addrKey(hood, street, num)];
        if (x) sp.innerHTML = `MOVED IN: <a href="${esc(H.memberUrl(x.k || x.n))}">${esc(x.t || '~' + x.n)}</a> by ~${esc(x.n)}`;
        else { const a = document.createElement('a'); a.href = H.addrUrl(H.addrText(hood, street, num)); a.textContent = '[Move in!]'; a.style.marginLeft = '8px'; sp.after(a); }
      });
    };
    fix();
  }

  function mount(el, kind, arg) {
    el.classList.add('hpz-host');
    try {
      if (kind === 'dir') return mountDir(el);
      if (kind === 'signup') return mountSignup(el);
      return mountPage(el, arg || {});
    } catch (e) { console.error(e); errorPage(el, 'This page has a bug in it. (Not the Millennium one. A normal one.)'); }
  }

  // ================================================================ styles
  const css = document.createElement('style'); css.id = 'hpz-css';
  css.textContent = `
.hpz-host{min-height:560px;background:#fff;color:#000;font:14px/1.45 "Times New Roman",Times,serif;overflow-wrap:anywhere;word-break:break-word}
.hpz-page{position:relative;min-height:560px;padding:14px 18px 18px;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;background-repeat:repeat;font-size:15px;line-height:1.4}
.hpz-page a{color:var(--hpz-lc,#00f)}
.hpz-page.hpz-edit{min-height:100%;padding-top:10px}
.hpz-ad{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;background:linear-gradient(90deg,#ff6a00,#ffd400);color:#000;font:bold 12px Arial,sans-serif;margin:-14px -18px 12px;padding:5px 10px;border-bottom:2px solid #000}
.hpz-ad a{color:#000080!important}.hpz-adl{font:bold 15px "Arial Black",Arial,sans-serif;color:#fff;-webkit-text-stroke:.6px #000;letter-spacing:1px}
.hpz-wm{position:absolute;right:8px;top:40px;opacity:.55;width:40px;text-align:center;font:bold 10px Arial,sans-serif;color:#fff;text-shadow:1px 1px 0 #000;pointer-events:none}
.hpz-edit .hpz-wm{top:6px}.hpz-wm svg{width:28px;height:28px;display:block;margin:0 auto}
.hpz-midi{display:inline-flex;align-items:center;gap:3px;background:#c0c0c0;color:#000;border:2px outset #fff;padding:2px 4px;font:11px Tahoma,sans-serif;margin:0 0 8px}
.hpz-midi button{width:22px;height:20px;padding:0;font-size:10px}
.hpz-midin,.hpz-midit{background:#000;color:#0f0;font:11px monospace;padding:1px 4px}.hpz-midi.on .hpz-midin{animation:hpzblink 1s steps(1) infinite}
.hpz-blocks>*{margin:8px 0}
.hpz-b{position:relative;outline:1px dashed transparent;cursor:pointer;min-height:14px;padding:1px}
.hpz-b:hover{outline-color:#888}.hpz-b.sel{outline:2px dashed #ff00ff;background:rgba(255,0,255,.06)}
.hpz-h{font-weight:bold;margin:6px 0;line-height:1.15}.hpz-h1{font-size:34px}.hpz-h2{font-size:27px}.hpz-h3{font-size:21px}.hpz-h4{font-size:17px}
.hpz-p{margin:6px 0;white-space:normal}
.hpz-mq{overflow:hidden;white-space:nowrap;padding:3px 0}
.hpz-mqw{display:block}.hpz-mqi{display:inline-block;font-weight:bold}
.hpz-mq-l .hpz-mqi,.hpz-mq-r .hpz-mqi{padding-left:100%;animation:hpzmq 10s linear infinite}
.hpz-mq-r .hpz-mqi{animation-direction:reverse}
.hpz-mq-b .hpz-mqw{animation:hpzbw 4s ease-in-out infinite alternate}.hpz-mq-b .hpz-mqi{animation:hpzbi 4s ease-in-out infinite alternate}
.hpz-sp-s .hpz-mqi{animation-duration:18s}.hpz-sp-f .hpz-mqi{animation-duration:5s}
.hpz-mq-b.hpz-sp-s .hpz-mqw,.hpz-mq-b.hpz-sp-s .hpz-mqi{animation-duration:7s}.hpz-mq-b.hpz-sp-f .hpz-mqw,.hpz-mq-b.hpz-sp-f .hpz-mqi{animation-duration:2s}
@keyframes hpzmq{from{transform:translateX(0)}to{transform:translateX(-100%)}}
@keyframes hpzbw{from{transform:translateX(0)}to{transform:translateX(100%)}}
@keyframes hpzbi{from{transform:translateX(0)}to{transform:translateX(-100%)}}
.hpz-bl span{font-weight:bold;font-size:18px;animation:hpzblink 1s steps(1) infinite}
@keyframes hpzblink{0%{visibility:visible}50%{visibility:hidden}}
.hpz-blink2{animation:hpzblink 1s steps(1) infinite}
.hpz-hr{height:24px;margin:10px 0;background-repeat:repeat-x;background-position:center}
.hpz-hr-groove{height:0;border:2px groove #c0c0c0;margin:14px 0}
.hpz-hr-plain{height:0;border-top:2px solid currentColor;margin:14px 0}
.hpz-hr-rainbow{height:6px;background:linear-gradient(90deg,#f00,#f80,#ff0,#0f0,#0ff,#00f,#f0f)}
.hpz-hr-flames{background-image:${HR.flames}}
.hpz-hr-dots{height:14px;background:radial-gradient(circle,#ff0 3px,transparent 4px) 0 50%/14px 14px repeat-x,radial-gradient(circle,#f0f 3px,transparent 4px) 7px 50%/14px 14px repeat-x;animation:hpzdots 1s linear infinite}
@keyframes hpzdots{to{background-position:14px 50%,21px 50%}}
.hpz-hr-squig{height:12px;background-image:${HR.squig}}.hpz-hr-barbed{height:14px;background-image:${HR.barbed}}.hpz-hr-stars{height:20px;background-image:${HR.stars}}
.hpz-uc{text-align:center;font:bold 15px Arial,sans-serif}
.hpz-uct{display:inline-block;background:#ffd400;color:#000;border:2px solid #000;padding:3px 10px;margin-top:4px;max-width:100%}
.hpz-uc svg{display:block;margin:0 auto}
.hpz-uc-tape .hpz-uct{display:block;background:repeating-linear-gradient(45deg,#ffd400 0 14px,#111 14px 28px);color:#fff;text-shadow:2px 2px 0 #000,-1px -1px 0 #000;padding:8px;font-size:18px;letter-spacing:1px}
.hpz-dig{transform-origin:28px 32px;animation:hpzdig .8s ease-in-out infinite alternate}
@keyframes hpzdig{to{transform:rotate(-22deg)}}
.hpz-spr{image-rendering:pixelated;image-rendering:crisp-edges;vertical-align:middle}
.hpz-clip{display:inline-block;vertical-align:middle}.hpz-clip svg{width:100%;height:100%;display:block}
.hpz-spin{animation:hpzspin 1.6s linear infinite}
@keyframes hpzspin{0%{transform:scaleX(1)}25%{transform:scaleX(.05)}50%{transform:scaleX(-1)}75%{transform:scaleX(.05)}100%{transform:scaleX(1)}}
.hpz-clip-new,.hpz-clip-hot{animation:hpzpulse .6s steps(2) infinite}.hpz-clip-heart{animation:hpzpulse .9s ease-in-out infinite}
@keyframes hpzpulse{50%{transform:scale(1.12)}}
.hpz-clip-mail svg{animation:hpzbob .7s ease-in-out infinite alternate}@keyframes hpzbob{to{transform:translateY(-3px)}}
.hpz-pupils{animation:hpzlook 3s steps(1) infinite}@keyframes hpzlook{0%{transform:translate(0,0)}25%{transform:translate(-3px,1px)}50%{transform:translate(3px,-1px)}75%{transform:translate(0,3px)}}
.hpz-ct{font-weight:bold}
.hpz-ct-odo i{display:inline-block;font:bold 16px/1.2 "Courier New",monospace;font-style:normal;background:linear-gradient(#333,#000 45%,#222 55%,#000);color:#fff;padding:1px 3px;margin:0 1px;border:1px solid #777}
.hpz-ct-lcd{display:inline-block;background:#000;color:#00ff00;font:bold 17px "Courier New",monospace;padding:1px 6px;border:2px inset #888;letter-spacing:2px}
.hpz-ct-led{display:inline-block;background:#200;color:#ff2020;font:bold 17px "Courier New",monospace;padding:1px 6px;border:2px inset #888;letter-spacing:2px;text-shadow:0 0 4px #f00}
.hpz-gb{background:#ffffe0;color:#000;border:3px ridge #c0c0c0;padding:8px 10px;font:14px/1.4 Arial,sans-serif;margin:12px 0}
.hpz-gbh{display:flex;align-items:center;gap:8px;font:bold 20px "Comic Sans MS","Comic Sans",cursive;color:#c00060}.hpz-gbh svg{width:32px;height:32px;flex:none}
.hpz-gbf{display:grid;gap:5px;margin:6px 0 8px;padding:6px;border:1px dashed #c90;background:#fff8c0}
.hpz-gbfr{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.hpz-gbfr input,.hpz-gbfr select{flex:1;min-width:120px;font:13px Arial,sans-serif}
.hpz-gbf textarea{display:block;width:100%;box-sizing:border-box;font:13px Arial,sans-serif;resize:vertical}
.hpz-gbmsg{font-weight:bold;color:#c00060}
.hpz-gbn{font-size:12px;color:#666;margin:4px 0}
.hpz-gbe{border-top:1px dotted #c90;padding:6px 0}.hpz-gbeh{font-size:12px}.hpz-gbd{color:#666}.hpz-gbet{margin:2px 0 0 10px;white-space:pre-wrap}.hpz-gbhow{font-size:11px;color:#666;margin-left:10px}
.hpz-gbdel{font-size:10px;padding:0 4px;margin-left:6px}
.hpz-mem{background:#000080;color:#fff;font-size:9px;padding:0 3px;vertical-align:middle}
.hpz-gbempty{color:#666;font-style:italic}
.hpz-ln ul,.hpz-ul ul,.hpz-ul ol{margin:4px 0;padding-left:26px}.hpz-lnh{font-weight:bold;font-size:18px;text-decoration:underline}
.hpz-bu-star{list-style:none}.hpz-bu-star li::before{content:"\\2605 ";color:#ffd400;text-shadow:0 0 1px #000}
.hpz-bu-squig{list-style:none}.hpz-bu-squig li::before{content:"~ ";font-weight:bold;color:#e8381b}
.hpz-ring{border:3px outset #c0c0c0;background:#c0c0c0;color:#000;text-align:center;padding:6px;font:12px Arial,sans-serif;max-width:430px;margin:12px auto!important}
.hpz-ringt{display:flex;align-items:center;justify-content:center;gap:8px}.hpz-ringt svg{width:30px;height:30px;flex:none;animation:hpzspin 2.5s linear infinite}
.hpz-ringb{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-top:5px}.hpz-ringb a{color:#000080!important}
.hpz-ring-biscuit{background:#e8c890;border-color:#f8e0b0}.hpz-ring-galaxy{background:#101040;color:#ffd400;border-color:#4040a0}.hpz-ring-galaxy a{color:#fff!important}
.hpz-bdgs{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.hpz-bdg{display:inline-flex;flex-direction:column;justify-content:center;align-items:center;width:88px;height:31px;box-sizing:border-box;border:1px solid #000;font:9px/1.05 Arial,sans-serif;text-align:center;overflow:hidden;box-shadow:inset 1px 1px 0 rgba(255,255,255,.5),inset -1px -1px 0 rgba(0,0,0,.4)}
.hpz-bdg b{font:bold 10px/1.05 Verdana,Arial,sans-serif}
.hpz-poll{background:#e0e8ff;color:#000;border:2px solid #000080;padding:8px 10px;font:14px Arial,sans-serif;max-width:430px}
.hpz-pollh{background:#000080;color:#fff;font-weight:bold;margin:-8px -10px 6px;padding:2px 8px}.hpz-pollq{font-weight:bold;margin-bottom:4px}
.hpz-pollo label{display:block;padding:2px 0}.hpz-pr{display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0}.hpz-pr.mine{font-weight:bold}
.hpz-prl{flex:0 0 38%}.hpz-prb{flex:1;height:10px;background:#fff;border:1px inset #888}.hpz-prb i{display:block;height:100%;background:linear-gradient(90deg,#f00,#ff0)}.hpz-prn{flex:none;width:66px;text-align:right}.hpz-prt{font-size:11px;color:#444;margin-top:4px}
.hpz-mailb{display:inline-flex;align-items:center;gap:6px;font:bold 16px "Comic Sans MS",cursive;background:none;border:0;color:inherit;cursor:pointer;padding:4px}.hpz-mailb .hpz-clip{width:40px;height:40px}
.hpz-btn{font:bold 12px Arial,sans-serif;padding:4px 10px;cursor:pointer;min-height:26px}
.hpz-big{font-size:15px;padding:8px 16px;background:linear-gradient(#ffe680,#ffb000);border:3px outset #ffd400}
.hpz-small{font-size:11px}
.hpz-foot{margin-top:20px;padding-top:8px;border-top:1px solid currentColor;font:11px Arial,sans-serif;text-align:center;opacity:.9}
.hpz-404{padding:24px;font:14px Arial,sans-serif;background:#fff;color:#000;min-height:520px}.hpz-404 h1{font:bold 26px Arial,sans-serif}
.hpz-forrent{padding:24px;text-align:center;background:#fff8e0;color:#000;min-height:520px;font:15px "Times New Roman",serif}
.hpz-frsign{display:inline-block;font:bold 34px "Arial Black",Arial,sans-serif;color:#c00;background:#fff;border:6px double #c00;padding:6px 18px;transform:rotate(-4deg);margin:8px}
.hpz-dir,.hpz-signup{padding:14px 18px 24px;background:#fffdf0;color:#000;font:14px/1.4 Arial,sans-serif;min-height:560px}
.hpz-dtop,.hpz-stop{background:linear-gradient(90deg,#ff6a00,#ffd400);margin:-14px -18px 12px;padding:10px 14px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;border-bottom:2px solid #000}
.hpz-dlogo{display:flex;align-items:center;gap:6px;font:bold 26px "Arial Black",Arial,sans-serif;color:#fff;-webkit-text-stroke:1px #000}.hpz-dlogo svg{width:34px;height:34px}
.hpz-dsub{font-weight:bold}
.hpz-dcols,.hpz-scols{display:flex;gap:14px;flex-wrap:wrap}.hpz-dmain{flex:3 1 320px;min-width:0}.hpz-dside{flex:1 1 180px;background:#fff6e0;border:1px solid #c90;padding:10px}
.hpz-tabs{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}.hpz-tab{font:bold 12px Arial,sans-serif;padding:5px 10px;background:linear-gradient(#6a8ad8,#1a3a9a);color:#fff;border:3px outset #9ab4ff;cursor:pointer}
.hpz-tab.on{background:linear-gradient(#d86a6a,#9a1a1a);border-style:inset;border-color:#ff9a9a}
.hpz-dtab{width:100%;border-collapse:collapse}.hpz-dtab td{border-bottom:1px solid #ddd;padding:5px 4px;vertical-align:top}.hpz-dtab a{color:#c40}.hpz-dt a{font-weight:bold}.hpz-dn{text-align:right;white-space:nowrap;font-size:12px}
.hpz-newb{display:inline-block;font:bold 10px Arial,sans-serif;padding:0 4px;color:#fff;background:#e10600;animation:hpzblink 1s steps(1) infinite}
.hpz-hoods{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.hpz-hood{display:flex;flex-direction:column;gap:3px;text-align:left;border:3px outset #888;padding:8px;cursor:pointer;font:12px Arial,sans-serif}.hpz-hood b{font:bold 17px "Arial Black",Arial,sans-serif}.hpz-hoodn{font-weight:bold}
.hpz-hood.on{border-style:inset;outline:3px solid #ff0}
.hpz-signbox{text-align:center;background:#ffd400;border:3px dashed #c00;padding:8px;font-size:14px}.hpz-signbox a{color:#c00;font-weight:bold}
.hpz-sbig{font:bold 30px/1.1 "Arial Black",Arial,sans-serif;color:#fff;-webkit-text-stroke:1px #000}.hpz-free{color:#ff0;font-size:36px}
.hpz-s2{display:flex;align-items:center;gap:8px;font-size:20px}.hpz-s2 svg{width:40px;height:40px}
.hpz-sfeat{flex:1 1 240px}.hpz-ssteps{flex:1 1 280px;display:grid;gap:10px}.hpz-step{background:#fff;border:2px solid #000080;padding:8px}
.hpz-ticks{list-style:none;padding-left:4px}.hpz-ticks li::before{content:"\\2714  ";color:#080;font-weight:bold}
.hpz-pick{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.hpz-hsm{padding:5px 8px}.hpz-hsm b{font-size:13px}
.hpz-rules{font-size:12px}.hpz-rules ol{margin:4px 0;padding-left:22px}.hpz-ok{color:#080}
.hpz-deco{background:#fff;color:#000;padding:0 18px 18px}.hpz-decob{border:3px ridge #ffd400;background:#fffbe6;padding:8px 10px;font:13px Arial,sans-serif}
.hpz-decoh{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.hpz-decoh svg{width:30px;height:30px}
@media (max-width:600px){.hpz-page{padding:10px 10px 16px}.hpz-ad{margin:-10px -10px 10px}.hpz-h1{font-size:26px}.hpz-h2{font-size:22px}.hpz-dir,.hpz-signup{padding:10px}.hpz-dtop,.hpz-stop{margin:-10px -10px 10px}.hpz-sbig{font-size:23px}.hpz-wm{display:none}.hpz-dn{white-space:normal}}
@media (prefers-reduced-motion:reduce){.hpz-bl span,.hpz-spin,.hpz-blink2,.hpz-newb{animation:none}}
`;
  document.head.appendChild(css);

  H.view = { render, paint, mount, deco, playTune, stopTune, counter, d99, BLK, TILES, CLIP, UC, inWords };
})();

/* ex-jobs: four more Pocket Money jobs for the Odd Jobz Board / Mom's Chore List (they run in js/grind-jobs.js's
 * mini-game runner and are paid by mods/grind.js like the others), plus the Job Centre on www.oddjobz.jnet: your
 * streak, the Job of the Day and this week's Mega Masters job.
 *   shelves     Stacking Shelves: put each thing from the trolley on the shelf with the right label
 *   newsletter  Type Up the Parish Newsletter: click the spelling mistakes (and only the spelling mistakes)
 *   hamster     Catch the Runaway Hamster ({nbrpet}, Mrs Pemberton's grandson's): pops out from behind the furniture. The cat does too. Don't click the cat.
 *   errands     Mom's Errands: remember the shopping list, then pick the right things off the shelves */
(function () {
  'use strict';
  if (window.ExJobs || !window.GrindJobs || !window.GrindCat) return;
  const A = window.Apps, X = window.ExCat, EX = window.EX, esc = A.esc, GJ = window.GrindJobs, C = window.GrindCat;
  const CT = s => (window.Cast ? Cast.t(s) : s), CT2 = x => (window.Cast ? Cast.deep(x) : x); // the visitor's cast (js/cast.js); nbrkid + nbrpet are added by js/ex-cat.js
  if (window.Cast) { Cast.add('nbrkid', { role: "Mrs Pemberton's grandson (the odd-job hamster)", g: 'm', pool: ['childF', 'childM'] }); Cast.add('nbrpet', { role: "Mrs Pemberton's grandson's runaway hamster", pool: ['smallF', 'smallM'] }); }
  X.augment(null, C);
  const W = 480, H = 320, TAU = Math.PI * 2;
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const txt = (g, s, x, y, size, col, align, font) => { g.font = `bold ${size}px ${font || 'Verdana,Arial,sans-serif'}`; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(2, size / 5); g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col || '#fff'; g.fillText(s, x, y); };
  const plain = (g, s, x, y, size, col, align, font) => { g.font = `${size}px ${font || 'Verdana,Arial,sans-serif'}`; g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.fillStyle = col || '#000'; g.fillText(s, x, y); };
  const Msgs = () => { const L = []; return { add(s, x, y, col, size) { L.push({ s, x, y, col, size: size || 18, t: 0 }); }, step(dt) { for (const m of L) { m.t += dt; m.y -= 26 * dt; } while (L.length && L[0].t > 1.1) L.shift(); }, draw(g) { for (const m of L) { g.globalAlpha = Math.max(0, 1 - m.t / 1.1); txt(g, m.s, m.x, m.y, m.size, m.col); } g.globalAlpha = 1; } }; };

  // ================================================================ the things on the shelves (shared by shelves + errands)
  // a tiny packaging drawer: kind + colours + a word on the label, centred on x,y, about s pixels tall
  function thing(g, k, x, y, s) {
    const d = THINGS[k]; if (!d) return;
    const [shape, c1, c2, word] = d, w = s * 0.62, h = s;
    g.save(); g.translate(x, y); g.lineWidth = 1.5; g.strokeStyle = '#000';
    switch (shape) {
      case 'can': rr(g, -w / 2, -h / 2, w, h, 4); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-w / 2, -h * 0.18, w, h * 0.36); g.fillStyle = '#d8dce4'; g.fillRect(-w / 2, -h / 2, w, 4); g.fillRect(-w / 2, h / 2 - 4, w, 4); break;
      case 'box': rr(g, -w * 0.6, -h / 2, w * 1.2, h, 2); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-w * 0.6 + 3, -h * 0.15, w * 1.2 - 6, h * 0.34); break;
      case 'bag': g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2 + 3, h / 2); g.lineTo(-w / 2 - 3, h / 2); g.closePath(); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-w / 2, -h * 0.12, w, h * 0.3); for (let i = -w / 2; i < w / 2; i += 4) { g.beginPath(); g.moveTo(i, -h / 2); g.lineTo(i + 2, -h / 2 - 3); g.stroke(); } break;
      case 'bottle': g.beginPath(); g.moveTo(-w * 0.18, -h / 2); g.lineTo(w * 0.18, -h / 2); g.lineTo(w * 0.18, -h * 0.25); g.quadraticCurveTo(w / 2, -h * 0.18, w / 2, -h * 0.05); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.lineTo(-w / 2, -h * 0.05); g.quadraticCurveTo(-w / 2, -h * 0.18, -w * 0.18, -h * 0.25); g.closePath(); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-w * 0.2, -h / 2 - 3, w * 0.4, 5); g.fillRect(-w / 2 + 2, h * 0.05, w - 4, h * 0.26); break;
      case 'loaf': rr(g, -w * 0.8, -h * 0.25, w * 1.6, h * 0.62, 10); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-w * 0.55, -h * 0.05, w * 1.1, h * 0.22); g.strokeStyle = '#8a5a2a'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * w * 0.35 - 4, -h * 0.22); g.lineTo(i * w * 0.35 + 4, -h * 0.12); g.stroke(); } break;
      case 'eggs': rr(g, -w * 0.85, -h * 0.2, w * 1.7, h * 0.48, 4); g.fillStyle = c1; g.fill(); g.stroke(); g.fillStyle = '#fffbe8'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-w * 0.55 + i * w * 0.55, -h * 0.22, w * 0.2, h * 0.16, 0, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = c2; g.fillRect(-w * 0.6, h * 0.02, w * 1.2, h * 0.16); break;
      case 'fruit': g.fillStyle = c1; for (const [ox, oy] of [[-8, 4], [8, 4], [0, -6]]) { g.beginPath(); g.arc(ox * s / 40, oy * s / 40, s * 0.22, 0, TAU); g.fill(); g.stroke(); } g.strokeStyle = '#3a6a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s * 0.28); g.lineTo(2, -s * 0.4); g.stroke(); break;
      case 'banana': g.strokeStyle = '#000'; g.fillStyle = c1; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-4 + i * 4, 0, s * 0.42, s * 0.14, -0.5 + i * 0.25, 0.2, Math.PI - 0.2); g.lineTo(-4 + i * 4, 0); g.closePath(); g.fill(); g.stroke(); } break;
      case 'paper': g.fillStyle = c1; g.fillRect(-w * 0.75, -h / 2, w * 1.5, h); g.strokeRect(-w * 0.75, -h / 2, w * 1.5, h); g.fillStyle = c2; g.fillRect(-w * 0.65, -h * 0.4, w * 1.3, h * 0.18); g.fillStyle = '#888'; for (let i = 0; i < 4; i++) g.fillRect(-w * 0.65, -h * 0.12 + i * h * 0.14, w * (i % 2 ? 0.6 : 1.3), 2); break;
    }
    if (word) { const fs = Math.max(7, Math.min(s * 0.24, (shape === 'box' || shape === 'loaf' || shape === 'eggs' || shape === 'paper' ? w * 1.25 : w) / (word.length * 0.62))); g.font = `bold ${fs}px Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = d[4] || '#000'; g.fillText(word, 0, shape === 'can' || shape === 'bag' ? 0 : shape === 'bottle' ? h * 0.18 : shape === 'loaf' ? h * 0.06 : shape === 'eggs' ? h * 0.1 : shape === 'paper' ? -h * 0.31 : h * 0.02); }
    g.restore();
  }
  // [shape, colour, label colour, word, text colour]
  const THINGS = {
    beans: ['can', '#ff8a00', '#2f80ee', 'BEANS', '#fff'], soup: ['can', '#e10600', '#fff', 'SOUP'], peas: ['can', '#2a8a2a', '#fff', 'PEAS'], spag: ['can', '#ffd400', '#e10600', 'SPAGHETTI', '#fff'],
    crisps: ['bag', '#2f80ee', '#ffd400', 'CRISPS'], prawn: ['bag', '#ff6a9a', '#fff', 'PRAWN'], sugar: ['bag', '#fff', '#2f80ee', 'SUGAR', '#fff'], flour: ['bag', '#f0e8d0', '#e10600', 'FLOUR', '#fff'],
    flakes: ['box', '#ffd400', '#e10600', 'FLAKES', '#fff'], tea: ['box', '#c00', '#fff', 'TEA'], biscuits: ['box', '#8a4a1a', '#ffd400', 'BISCUITS'], rice: ['box', '#fff', '#3a8a3a', 'RICE', '#fff'], soap: ['box', '#8ad8ff', '#fff', 'SOAP POWDER'],
    milk: ['bottle', '#fff', '#2f80ee', 'MILK', '#fff'], squash: ['bottle', '#ff8a00', '#fff', 'SQUASH'], washup: ['bottle', '#5ad85a', '#fff', 'WASHING UP'], pop: ['bottle', '#e10600', '#fff', 'POP'],
    bread: ['loaf', '#e8b060', '#fff', 'WHITE'], brown: ['loaf', '#a0602a', '#fff', 'BROWN'], eggs: ['eggs', '#c8a878', '#fff', 'EGGS'],
    apples: ['fruit', '#e10600'], oranges: ['fruit', '#ff8a00'], bananas: ['banana', '#ffe24a'], paper: ['paper', '#f4f4ec', '#000', 'DAILY NEWS', '#fff'],
  };
  const NAMES = { beans: 'baked beans', soup: 'tomato soup', peas: 'mushy peas', spag: 'spaghetti hoops', crisps: 'ready salted crisps', prawn: 'prawn cocktail crisps', sugar: 'sugar', flour: 'flour', flakes: 'cornflakes', tea: 'tea bags', biscuits: 'chocolate biscuits', rice: 'rice', soap: 'soap powder', milk: 'milk', squash: 'orange squash', washup: 'washing-up liquid', pop: 'cola', bread: 'white bread', brown: 'brown bread', eggs: 'eggs', apples: 'apples', oranges: 'oranges', bananas: 'bananas', paper: 'a newspaper' };

  // ================================================================ STACKING SHELVES
  GJ.game('shelves', api => {
    const BAYS = [{ n: 'TINS', k: ['beans', 'soup', 'peas', 'spag'], col: '#ffe8c8' }, { n: 'CRISPS & BAGS', k: ['crisps', 'prawn', 'sugar', 'flour'], col: '#d8ecff' }, { n: 'BOXES', k: ['flakes', 'tea', 'biscuits', 'rice', 'soap'], col: '#ffd8d8' }, { n: 'BOTTLES', k: ['milk', 'squash', 'washup', 'pop'], col: '#d8ffd8' }];
    const bays = BAYS.map((b, i) => ({ ...b, x: 12 + (i % 2) * 234, y: 26 + Math.floor(i / 2) * 104, w: 222, h: 94, items: [] }));
    let cur = null, wait = 0.6, sc = 0, run = 0, drag = null, hl = 0, t = 0, dropped = 0, over = false, eggs = [], speed = 1;
    const msgs = Msgs();
    const bayOf = k => bays.findIndex(b => b.k.includes(k));
    const at = (x, y) => bays.findIndex(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    function next() { const b = bays[Math.floor(Math.random() * 4)]; cur = { k: api.pick(b.k), x: 70, y: 268, life: Math.max(2.6, 5.2 - sc * 0.06), max: 0 }; cur.max = cur.life; }
    function put(i) {
      if (!cur) return;
      const ok = bayOf(cur.k) === i, b = bays[i];
      if (ok) {
        sc++; run++; b.items.push(cur.k); if (b.items.length > 14) b.items.shift();
        api.note(880 + Math.min(run, 10) * 60, 0.06, 'triangle');
        if (run % 5 === 0) { sc++; msgs.add(`TIDY! x${run}`, b.x + b.w / 2, b.y + 20, '#ffd400', 20); api.sfx('solve'); } else msgs.add('+1', b.x + b.w / 2, b.y + 30, '#9fffa0');
      } else {
        run = 0; dropped++; msgs.add(`Not ${b.n.toLowerCase()}!`, b.x + b.w / 2, b.y + 30, '#ff8080'); api.sfx('thud');
        eggs.push({ x: drag ? drag.x : cur.x, y: drag ? drag.y : cur.y, t: 0, k: cur.k });
      }
      cur = null; drag = null; wait = 0.35;
    }
    return {
      keys: 'Drag each thing from the trolley to the right shelf. Or use the <b>arrow keys</b> to pick a shelf and <b>Space</b> to put it there.',
      start() { next(); },
      step(dt) {
        t += dt; msgs.step(dt); speed = 1 + sc * 0.01;
        for (const e of eggs) e.t += dt; while (eggs.length && eggs[0].t > 1) eggs.shift();
        if (!cur) { wait -= dt; if (wait <= 0) next(); return; }
        if (!drag) { cur.life -= dt * speed; if (cur.life <= 0) { run = 0; dropped++; msgs.add('Too slow!', 100, 240, '#ff8080'); eggs.push({ x: cur.x, y: cur.y, t: 0, k: cur.k }); api.sfx('uhoh'); cur = null; wait = 0.5; } }
      },
      draw(g) {
        g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, W, H); g.fillStyle = '#d8ccb0'; for (let x = 0; x < W; x += 40) g.fillRect(x, 0, 1, 236);
        bays.forEach((b, i) => {
          g.fillStyle = b.col; g.fillRect(b.x, b.y, b.w, b.h); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.strokeRect(b.x, b.y, b.w, b.h);
          g.fillStyle = '#8a5a2a'; g.fillRect(b.x, b.y + b.h - 8, b.w, 8);
          b.items.forEach((k, j) => thing(g, k, b.x + 16 + j * 14.5, b.y + b.h - 26, 30));
          g.fillStyle = '#fff'; rr(g, b.x + b.w / 2 - 62, b.y + 4, 124, 18, 3); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
          plain(g, b.n, b.x + b.w / 2, b.y + 13, 11, '#a0002a', 'center', 'Verdana,sans-serif');
          if (hl === i && !drag) { g.strokeStyle = '#ffd400'; g.lineWidth = 4; g.setLineDash([6, 4]); g.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6); g.setLineDash([]); }
          if (drag && at(drag.x, drag.y) === i) { g.fillStyle = 'rgba(255,212,0,.3)'; g.fillRect(b.x, b.y, b.w, b.h); }
        });
        // the trolley
        g.fillStyle = '#9aa4b0'; g.fillRect(0, 236, W, H - 236); g.fillStyle = '#6a7480'; g.fillRect(0, 236, W, 4);
        g.strokeStyle = '#333'; g.lineWidth = 3; g.strokeRect(24, 246, 96, 50); g.beginPath(); g.moveTo(120, 246); g.lineTo(140, 236); g.stroke();
        for (const wx of [36, 108]) { g.fillStyle = '#222'; g.beginPath(); g.arc(wx, 304, 7, 0, TAU); g.fill(); }
        plain(g, "Mr Dobbs: \"Chop chop!\"", 160, 262, 13, '#203080', 'left', "'Comic Sans MS',cursive");
        plain(g, `In a row: ${run}   Dropped: ${dropped}`, 160, 286, 12, '#333');
        if (cur) {
          const x = drag ? drag.x : cur.x, y = drag ? drag.y : cur.y;
          if (!drag) { g.fillStyle = '#000'; g.fillRect(28, 240, 88, 5); g.fillStyle = cur.life / cur.max > 0.35 ? '#3ad03a' : '#ff3030'; g.fillRect(28, 240, 88 * Math.max(0, cur.life / cur.max), 5); }
          thing(g, cur.k, x, y, 44);
        }
        for (const e of eggs) { g.globalAlpha = 1 - e.t; thing(g, e.k, e.x, e.y + e.t * 80, 40); g.globalAlpha = 1; }
        msgs.draw(g);
      },
      down(x, y) { if (cur && Math.abs(x - cur.x) < 40 && Math.abs(y - cur.y) < 40) { drag = { x, y }; api.note(440, 0.04); } else { const i = at(x, y); if (i >= 0 && cur) put(i); } },
      move(x, y) { if (drag) { drag.x = x; drag.y = y; } },
      up(x, y) { if (!drag) return; const i = at(x, y); if (i >= 0) put(i); else drag = null; },
      key(k, dn) { if (!dn) return; if (k === 'ArrowLeft') hl = hl % 2 ? hl - 1 : hl; else if (k === 'ArrowRight') hl = hl % 2 ? hl : hl + 1; else if (k === 'ArrowUp') hl = hl >= 2 ? hl - 2 : hl; else if (k === 'ArrowDown') hl = hl < 2 ? hl + 2 : hl; else if (k === 'Space' || k === 'Enter') put(hl); },
      score: () => Math.min(90, sc), get over() { return over; },
      hud: () => `${Math.min(90, sc)} tins stacked`,
    };
  });

  // ================================================================ THE PARISH NEWSLETTER
  const TYPOS = { jumble: 'jumbel', necessary: 'neccessary', receive: 'recieve', separate: 'seperate', tomorrow: 'tommorow', definitely: 'definately', until: 'untill', beginning: 'begining', committee: 'commitee', February: 'Febuary', Wednesday: 'Wensday', biscuits: 'biscits', raffle: 'rafle', volunteers: 'voluntears', welcome: 'wellcome', their: 'thier', which: 'wich', friends: 'freinds', believe: 'beleive', library: 'libary', knitting: 'kniting', sandwiches: 'sandwhiches', harvest: 'harvist', choir: 'quire', bells: 'bels', parish: 'parrish', Christmas: 'Chrismas', cake: 'caek', Sunday: 'Sundey', tickets: 'tickits', donations: 'donashuns', thank: 'thnak', please: 'pleese', bring: 'brign', flowers: 'flowrs', church: 'chruch', hall: 'hal', school: 'skool', everyone: 'everone', because: 'becuase', practice: 'practise', piano: 'pianno', coffee: 'coffe', morning: 'mornign', meeting: 'meating', lost: 'lsot', found: 'fuond', prize: 'prise', Saturday: 'Saterday', autumn: 'autum', Brownies: 'Brownys', minibus: 'minnibus' };
  const NEWS = [
    'The jumble sale is on Saturday in the church hall. Please bring your old clothes, toys and books by Wednesday. Tea and biscuits will be served by the Brownies.',
    'Thank you to everyone who came to the harvest festival. The tins will go to the old folks home and the flowers to the library. A special thank you to the choir.',
    'The bells will be rung on Sunday morning at nine. The bell ringers are always looking for volunteers. Practice is on Wednesday night in the tower.',
    'The parish committee meeting is on Tuesday. Please bring your ideas for the Christmas fair. The raffle tickets are now on sale in the church porch.',
    'Lost: one grey cat, answers to Gubbinz. Found: one umbrella, one glove and a set of false teeth. Please ask at the vicarage. No questions asked.',
    'The coffee morning raised forty pounds for the new minibus. Their thank you card is on the notice board. The cake stall was definitely the best yet.',
    'The school play is in February. We need volunteers to make costumes and sandwiches. Knitting circle meets every Thursday until Christmas, all welcome.',
    'Please remember the piano in the church hall is not a table. Mugs of coffee have been found on it again. The vicar would like to believe it was not the choir.',
    'The autumn bring and buy sale is on Saturday. Donations of cake, jam and books are very welcome. Prize for the best scarecrow will be a tin of biscuits.',
  ];
  GJ.game('newsletter', api => {
    let page = null, sc = 0, pages = 0, t = 0, flash = [], wrong = 0, last = -1;
    const msgs = Msgs();
    const X0 = 40, Y0 = 70, LH = 31, MAXW = 400;
    function newPage() {
      let i; do { i = Math.floor(Math.random() * NEWS.length); } while (i === last && NEWS.length > 1); last = i;
      const words = NEWS[i].split(' ').map(w => { const m = w.match(/^([A-Za-z]+)([.,!?]*)$/); return m ? { base: m[1], tail: m[2] } : { base: w, tail: '' }; });
      const can = words.map((w, j) => (TYPOS[w.base] ? j : -1)).filter(j => j >= 0);
      const n = Math.min(can.length, 3 + Math.floor(Math.random() * 2)), pickd = new Set();
      while (pickd.size < n) pickd.add(can[Math.floor(Math.random() * can.length)]);
      const c = document.createElement('canvas').getContext('2d'); c.font = '17px "Courier New",monospace';
      let x = X0, y = Y0; const out = [];
      words.forEach((w, j) => {
        const bad = pickd.has(j), shown = (bad ? TYPOS[w.base] : w.base) + w.tail, ww = Math.max(c.measureText(shown + ' ').width, c.measureText(w.base + w.tail + ' ').width);
        if (x + ww - X0 > MAXW) { x = X0; y += LH; }
        out.push({ w: shown, base: w.base + w.tail, bad, fixed: false, x, y, ww: c.measureText(shown).width, cat: w.base === 'Gubbinz' });
        x += ww;
      });
      page = { words: out, left: n, i, slide: 1 };
    }
    return {
      keys: 'Click every <b>spelling mistake</b>. Clicking a word that was already right loses you a point. Fix the whole page and the next one comes out of the typewriter.',
      start() { newPage(); },
      step(dt) { t += dt; msgs.step(dt); if (page && page.slide > 0) page.slide = Math.max(0, page.slide - dt * 3); for (const f of flash) f.t += dt; while (flash.length && flash[0].t > 0.6) flash.shift(); },
      draw(g) {
        g.fillStyle = '#5a3a2a'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#4a2a1a'; for (let y = 0; y < H; y += 12) g.fillRect(0, y, W, 1);
        const off = page ? page.slide * -300 : 0;
        g.save(); g.translate(0, off);
        g.fillStyle = '#fffef6'; g.fillRect(22, 22, W - 44, H - 46); g.strokeStyle = '#888'; g.strokeRect(22, 22, W - 44, H - 46);
        plain(g, 'ST BARNABUS PARISH NEWS', W / 2, 40, 15, '#5a0a0a', 'center', 'Georgia,"Times New Roman",serif');
        g.fillStyle = '#5a0a0a'; g.fillRect(40, 51, W - 80, 1.5);
        if (page) for (const w of page.words) {
          plain(g, w.fixed ? w.base : w.w, w.x, w.y, 17, w.fixed ? '#0a7a0a' : '#111', 'left', '"Courier New",monospace');
          if (w.fixed) { g.strokeStyle = '#0a7a0a'; g.lineWidth = 1; g.beginPath(); g.moveTo(w.x, w.y + 10); g.lineTo(w.x + w.ww, w.y + 10); g.stroke(); }
        }
        for (const f of flash) { g.fillStyle = f.ok ? `rgba(60,220,60,${0.5 - f.t * 0.8})` : `rgba(255,40,40,${0.5 - f.t * 0.8})`; g.fillRect(f.x - 2, f.y - 12, f.w + 4, 24); }
        g.restore();
        plain(g, `Pages done: ${pages}   Mistakes left on this page: ${page ? page.left : 0}`, W / 2, H - 11, 11, '#ffe8c8', 'center');
        msgs.draw(g);
      },
      down(x, y) {
        if (!page || page.slide > 0.2) return;
        const w = page.words.find(q => x >= q.x - 3 && x <= q.x + q.ww + 3 && Math.abs(y - q.y) <= 14); if (!w || w.fixed) return;
        if (w.bad) {
          w.fixed = true; page.left--; sc++; flash.push({ x: w.x, y: w.y, w: w.ww, t: 0, ok: 1 }); api.note(1046, 0.06, 'triangle');
          if (!page.left) { pages++; sc += 2; msgs.add('PAGE DONE! +2', W / 2, H / 2, '#ffd400', 24); api.sfx('solve'); setTimeout(newPage, 500); }
        } else if (w.cat) {
          msgs.add("That's not a typo, that's Gubbinz!", W / 2, y - 10, '#ffd400', 15); api.sfx('pet'); A.secret('ex.typo'); w.fixed = true; w.bad = false;
        } else { wrong++; sc = Math.max(0, sc - 1); flash.push({ x: w.x, y: w.y, w: w.ww, t: 0, ok: 0 }); msgs.add('-1', x, y - 16, '#ff6060'); api.sfx('uhoh'); }
      },
      score: () => Math.min(60, sc), hud: () => `${Math.min(60, sc)} typos fixed`,
    };
  });

  // ================================================================ CATCH THE RUNAWAY HAMSTER ({nbrpet})
  GJ.game('hamster', api => {
    const SPOTS = [{ n: 'sofa', x: 92, y: 210 }, { n: 'telly', x: 392, y: 150 }, { n: 'plant', x: 246, y: 232 }, { n: 'armchair', x: 400, y: 252 }, { n: 'bookcase', x: 60, y: 108 }, { n: 'toybox', x: 186, y: 150 }];
    let pop = null, wait = 0.8, sc = 0, t = 0, combo = 0, misses = 0, stars = [];
    const msgs = Msgs();
    function next() { const i = Math.floor(Math.random() * SPOTS.length), cat = sc > 4 && Math.random() < 0.18; const life = Math.max(0.55, 1.4 - sc * 0.022); pop = { i, cat, t: 0, life, up: 0 }; }
    function hamster(g, x, y, k, look) {
      g.save(); g.translate(x, y); g.scale(k, k);
      g.fillStyle = '#e8a860'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 18, 15, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#fff4e0'; g.beginPath(); g.ellipse(0, 5, 11, 8, 0, 0, TAU); g.fill();
      g.fillStyle = '#e8a860'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 12, -12, 5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ff9ab0'; g.beginPath(); g.arc(s * 12, -12, 2.4, 0, TAU); g.fill(); g.fillStyle = '#e8a860'; }
      g.fillStyle = '#000'; g.beginPath(); g.arc(-6 + look, -3, 2.6, 0, TAU); g.arc(6 + look, -3, 2.6, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-5 + look, -4, 0.9, 0, TAU); g.arc(7 + look, -4, 0.9, 0, TAU); g.fill();
      g.fillStyle = '#ff6a8a'; g.beginPath(); g.arc(look, 2, 2, 0, TAU); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 0.8; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 4, 3); g.lineTo(s * 16, 1); g.moveTo(s * 4, 4); g.lineTo(s * 15, 6); g.stroke(); }
      g.restore();
    }
    function cat(g, x, y, k) {
      g.save(); g.translate(x, y); g.scale(k, k);
      g.fillStyle = '#6a6a6a'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(-16, -6); g.lineTo(-14, -24); g.lineTo(-4, -14); g.lineTo(4, -14); g.lineTo(14, -24); g.lineTo(16, -6); g.quadraticCurveTo(18, 14, 0, 16); g.quadraticCurveTo(-18, 14, -16, -6); g.fill(); g.stroke();
      g.fillStyle = '#c8ff4a'; g.beginPath(); g.ellipse(-7, -3, 4, 3, 0, 0, TAU); g.ellipse(7, -3, 4, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#000'; g.fillRect(-7.6, -6, 1.4, 6); g.fillRect(6.4, -6, 1.4, 6);
      g.fillStyle = '#ff9ab0'; g.beginPath(); g.moveTo(-2, 4); g.lineTo(2, 4); g.lineTo(0, 7); g.fill();
      g.restore();
    }
    function furniture(g) {
      // wallpaper + carpet
      g.fillStyle = '#e8d8a8'; g.fillRect(0, 0, W, 190); g.fillStyle = '#d8c490'; for (let x = 10; x < W; x += 30) for (let y = 12; y < 190; y += 30) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
      g.fillStyle = '#7a3a4a'; g.fillRect(0, 190, W, H - 190); g.fillStyle = '#8a4a5a'; for (let x = 0; x < W; x += 24) g.fillRect(x, 190, 12, H - 190);
      g.fillStyle = '#6a4a2a'; g.fillRect(0, 186, W, 6);
      // bookcase
      g.fillStyle = '#8a5a2a'; g.fillRect(24, 40, 74, 150); g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(24, 40, 74, 150);
      for (let y = 70; y < 190; y += 38) { g.fillStyle = '#5a3a1a'; g.fillRect(24, y, 74, 5); }
      ['#e10600', '#2f80ee', '#ffd400', '#3ab03a', '#9a3ae0', '#ff8a00'].forEach((c, i) => { g.fillStyle = c; g.fillRect(30 + i * 10, 46, 8, 24); g.fillRect(28 + i * 11, 124, 9, 26); });
      // telly on a stand
      g.fillStyle = '#5a3a1a'; g.fillRect(340, 168, 110, 22); g.fillStyle = '#2a2a2a'; rr(g, 346, 100, 98, 70, 8); g.fill(); g.fillStyle = '#5a8ab0'; rr(g, 354, 108, 70, 52, 10); g.fill(); g.fillStyle = '#888'; g.fillRect(430, 116, 8, 8); g.fillRect(430, 130, 8, 8);
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(380, 100); g.lineTo(366, 80); g.moveTo(390, 100); g.lineTo(404, 80); g.stroke();
      // toy box
      g.fillStyle = '#e10600'; g.fillRect(150, 150, 74, 40); g.strokeStyle = '#000'; g.strokeRect(150, 150, 74, 40); g.fillStyle = '#ffd400'; g.fillRect(150, 146, 74, 8); g.font = 'bold 13px Verdana'; g.fillStyle = '#ffd400'; g.textAlign = 'center'; g.fillText('TOYS', 187, 176);
    }
    function front(g) { // things the hamster hides BEHIND (drawn after him)
      // sofa
      g.fillStyle = '#3a6ab0'; rr(g, 26, 200, 140, 64, 12); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2a5aa0'; rr(g, 16, 214, 24, 54, 8); g.fill(); g.stroke(); rr(g, 152, 214, 24, 54, 8); g.fill(); g.stroke();
      g.fillStyle = '#4a7ac0'; rr(g, 42, 228, 54, 26, 6); g.fill(); rr(g, 98, 228, 54, 26, 6); g.fill();
      // plant pot
      g.fillStyle = '#3ab03a'; for (let i = 0; i < 6; i++) { g.save(); g.translate(246, 226); g.rotate(-1 + i * 0.4); g.beginPath(); g.ellipse(0, -24, 7, 22, 0, 0, TAU); g.fill(); g.restore(); }
      g.fillStyle = '#c86a3a'; g.beginPath(); g.moveTo(222, 226); g.lineTo(270, 226); g.lineTo(262, 270); g.lineTo(230, 270); g.closePath(); g.fill(); g.strokeStyle = '#000'; g.stroke();
      // armchair
      g.fillStyle = '#a03a3a'; rr(g, 360, 236, 84, 60, 12); g.fill(); g.strokeStyle = '#000'; g.stroke(); g.fillStyle = '#902a2a'; rr(g, 352, 248, 20, 50, 6); g.fill(); g.stroke(); rr(g, 432, 248, 20, 50, 6); g.fill(); g.stroke();
      // bookcase bottom shelf front + toybox front + telly cabinet (he pops out above these)
      g.fillStyle = '#8a5a2a'; g.fillRect(24, 112, 74, 8); g.fillStyle = '#e10600'; g.fillRect(150, 150, 74, 40); g.strokeStyle = '#000'; g.strokeRect(150, 150, 74, 40); g.fillStyle = '#ffd400'; g.font = 'bold 13px Verdana'; g.textAlign = 'center'; g.fillText('TOYS', 187, 176);
      g.fillStyle = '#5a3a1a'; g.fillRect(340, 168, 110, 22);
    }
    return {
      keys: CT('{nbrpet} pops out from behind things for a moment: click {nbrpet.him}! <b>Do NOT click the cat.</b>') + ' Quick catches in a row score more.',
      step(dt) {
        t += dt; msgs.step(dt); for (const s of stars) s.t += dt; while (stars.length && stars[0].t > 0.8) stars.shift();
        if (!pop) { wait -= dt; if (wait <= 0) next(); return; }
        pop.t += dt; pop.up = Math.min(1, pop.t / 0.12) * (pop.t > pop.life - 0.12 ? Math.max(0, (pop.life - pop.t) / 0.12) : 1);
        if (pop.t >= pop.life) { if (!pop.cat) { combo = 0; misses++; } pop = null; wait = 0.25 + Math.random() * 0.45; }
      },
      draw(g) {
        furniture(g);
        if (pop) { const s = SPOTS[pop.i], y = s.y - 18 * pop.up; if (pop.cat) cat(g, s.x, y, 1.15); else hamster(g, s.x, y, 1.05, Math.sin(t * 9) * 1.5); }
        front(g);
        for (const s of stars) { g.globalAlpha = 1 - s.t / 0.8; txt(g, '*', s.x + Math.cos(s.a) * s.t * 60, s.y + Math.sin(s.a) * s.t * 60, 16, '#ffd400'); } g.globalAlpha = 1;
        plain(g, `Caught: ${sc}   Got away: ${misses}`, W / 2, H - 10, 11, '#ffe8f0', 'center');
        msgs.draw(g);
      },
      down(x, y) {
        if (!pop || pop.up < 0.3) return;
        const s = SPOTS[pop.i], py = s.y - 18 * pop.up;
        if (Math.hypot(x - s.x, y - py) > 30) return;
        if (pop.cat) { sc = Math.max(0, sc - 2); combo = 0; msgs.add('HISSSS! -2', s.x, py - 30, '#ff6060', 20); api.sfx('uhoh'); pop = null; wait = 0.6; return; }
        combo++; const add = pop.t < 0.45 && combo >= 3 ? 2 : 1; sc += add;
        msgs.add(add > 1 ? `QUICK! +2` : 'GOT HIM!', s.x, py - 30, add > 1 ? '#ffd400' : '#9fffa0'); api.note(1200 + combo * 40, 0.06, 'square');
        for (let i = 0; i < 6; i++) stars.push({ x: s.x, y: py, a: i * TAU / 6, t: 0 });
        pop = null; wait = 0.35 + Math.random() * 0.4;
      },
      score: () => Math.min(70, sc), hud: () => `${Math.min(70, sc)} catches`,
    };
  });

  // ================================================================ MOM'S ERRANDS
  GJ.game('errands', api => {
    const ALL = Object.keys(THINGS);
    let round = 0, need = [], shelf = [], phase = 'note', noteT = 0, sc = 0, got = new Set(), wrongs = 0, t = 0, btn = null;
    const msgs = Msgs();
    const SIM = { bread: 'brown', brown: 'bread', crisps: 'prawn', prawn: 'crisps', beans: 'spag', spag: 'beans', milk: 'squash', squash: 'milk', apples: 'oranges', oranges: 'apples', sugar: 'flour', flour: 'sugar', tea: 'biscuits', soup: 'peas', peas: 'soup' };
    function newRound() {
      round++; const n = Math.min(6, 2 + round), pool = ALL.slice().sort(() => Math.random() - 0.5);
      need = pool.slice(0, n);
      const decoy = new Set(); for (const k of need) if (SIM[k] && !need.includes(SIM[k])) decoy.add(SIM[k]);
      for (const k of pool) { if (need.length + decoy.size >= 12) break; if (!need.includes(k)) decoy.add(k); }
      shelf = need.concat([...decoy].slice(0, 12 - need.length)).sort(() => Math.random() - 0.5).map((k, i) => ({ k, x: 50 + (i % 6) * 76, y: 112 + Math.floor(i / 6) * 104, taken: 0 }));
      got = new Set(); phase = 'note'; noteT = Math.max(2.2, 2.6 + n * 0.45); btn = null;
    }
    return {
      keys: "Read Mom's list, then click <b>Got it!</b> (or wait). Then click the things on the list. Not the things that AREN'T on the list.",
      start() { newRound(); },
      step(dt) { t += dt; msgs.step(dt); if (phase === 'note') { noteT -= dt; if (noteT <= 0) phase = 'shop'; } },
      draw(g) {
        g.fillStyle = '#fff8e8'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c8a878'; g.fillRect(0, 0, W, 26); plain(g, "THE CORNER SHOP - open till 8 - NO MORE THAN 2 SCHOOLCHILDREN AT A TIME", W / 2, 13, 10, '#5a2a0a', 'center');
        for (const r of [0, 1]) { g.fillStyle = '#8a5a2a'; g.fillRect(14, 150 + r * 104, W - 28, 10); }
        for (const s of shelf) { if (s.taken) { g.globalAlpha = 0.25; } thing(g, s.k, s.x, s.y, 56); g.globalAlpha = 1; if (s.taken === 1) txt(g, '✔', s.x + 18, s.y - 22, 20, '#3ad03a'); if (s.taken === 2) txt(g, '✘', s.x + 18, s.y - 22, 20, '#ff4040'); }
        plain(g, `List ${round}: got ${got.size} of ${need.length}   Wrong: ${wrongs}`, W / 2, H - 10, 11, '#5a2a0a', 'center');
        if (phase === 'note') {
          g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H);
          g.save(); g.translate(W / 2, H / 2 - 4); g.rotate(-0.03);
          const h = 70 + need.length * 22; g.fillStyle = '#ffff9a'; g.fillRect(-120, -h / 2, 240, h); g.strokeStyle = '#c8c060'; g.strokeRect(-120, -h / 2, 240, h);
          plain(g, 'Jack, please get:', -100, -h / 2 + 20, 16, '#203080', 'left', "'Comic Sans MS',cursive");
          need.forEach((k, i) => plain(g, '- ' + NAMES[k], -96, -h / 2 + 46 + i * 22, 15, '#203080', 'left', "'Comic Sans MS',cursive"));
          plain(g, 'Love Mom x', 40, h / 2 - 14, 14, '#c0002a', 'left', "'Comic Sans MS',cursive");
          g.restore();
          btn = { x: W / 2 - 50, y: H - 44, w: 100, h: 26 };
          g.fillStyle = '#c0c0c0'; g.fillRect(btn.x, btn.y, btn.w, btn.h); g.strokeStyle = '#fff'; g.strokeRect(btn.x, btn.y, btn.w, btn.h);
          plain(g, `Got it! (${Math.ceil(noteT)})`, W / 2, btn.y + 13, 13, '#000', 'center');
        }
        msgs.draw(g);
      },
      down(x, y) {
        if (phase === 'note') { if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) { phase = 'shop'; api.note(660, 0.05); } return; }
        const s = shelf.find(q => !q.taken && Math.abs(x - q.x) < 34 && Math.abs(y - q.y) < 36); if (!s) return;
        if (need.includes(s.k)) {
          s.taken = 1; got.add(s.k); sc++; api.note(988, 0.06, 'triangle'); msgs.add('+1', s.x, s.y - 30, '#3ad03a');
          if (got.size === need.length) { const bonus = wrongs === 0 ? 1 : 0; sc += bonus; msgs.add(bonus ? 'PERFECT! +1' : 'All done!', W / 2, H / 2, '#ffd400', 22); api.sfx('solve'); wrongs = 0; setTimeout(newRound, 700); phase = 'wait'; }
        } else { s.taken = 2; wrongs++; sc = Math.max(0, sc - 1); msgs.add(SIM[s.k] && need.includes(SIM[s.k]) ? `I said ${NAMES[SIM[s.k]].toUpperCase()}!` : 'Not on the list!', s.x, s.y - 30, '#ff4040', 15); api.sfx('uhoh'); }
      },
      score: () => Math.min(60, sc), hud: () => `${Math.min(60, sc)} things fetched`,
    };
  });

  // ================================================================ pictures + notes for the lists and the board
  GJ.PIC.shelves = '<svg viewBox="0 0 64 64"><rect x="4" y="6" width="56" height="44" fill="#f4ecd8" stroke="#6a4a2a" stroke-width="2"/><path d="M4 26h56M4 48h56" stroke="#8a5a2a" stroke-width="3"/>' + [8, 18, 28].map(x => `<rect x="${x}" y="12" width="8" height="13" rx="1" fill="#ff8a00" stroke="#000"/><rect x="${x}" y="16" width="8" height="4" fill="#2f80ee"/>`).join('') + [40, 50].map(x => `<rect x="${x}" y="10" width="9" height="15" fill="#ffd400" stroke="#000"/>`).join('') + [10, 24].map(x => `<path d="M${x} 33h10l1 14H${x - 1}z" fill="#2f80ee" stroke="#000"/>`).join('') + '<rect x="40" y="32" width="6" height="15" rx="2" fill="#fff" stroke="#000"/><rect x="50" y="32" width="6" height="15" rx="2" fill="#5ad85a" stroke="#000"/><rect x="20" y="52" width="28" height="9" fill="none" stroke="#333" stroke-width="2"/><circle cx="24" cy="62" r="2" fill="#222"/><circle cx="44" cy="62" r="2" fill="#222"/></svg>';
  GJ.PIC.newsletter = '<svg viewBox="0 0 64 64"><path d="M14 4h30l8 8v42H14z" fill="#fffef6" stroke="#555"/><path d="M18 10h22M18 16h28M18 22h26M18 28h28M18 34h20" stroke="#333" stroke-width="1.6"/><path d="M30 22h12" stroke="#e10600" stroke-width="3" opacity=".7"/><rect x="6" y="40" width="52" height="20" rx="3" fill="#2a2a2a" stroke="#000"/>' + [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${12 + i * 8}" cy="47" r="2.6" fill="#ddd"/><circle cx="${14 + i * 8}" cy="54" r="2.6" fill="#ddd"/>`).join('') + '</svg>';
  GJ.PIC.hamster = '<svg viewBox="0 0 64 64"><rect x="4" y="34" width="56" height="26" rx="8" fill="#3a6ab0" stroke="#000" stroke-width="2"/><ellipse cx="32" cy="30" rx="13" ry="11" fill="#e8a860" stroke="#000" stroke-width="1.5"/><circle cx="23" cy="21" r="4" fill="#e8a860" stroke="#000"/><circle cx="41" cy="21" r="4" fill="#e8a860" stroke="#000"/><circle cx="27.5" cy="28" r="2"/><circle cx="36.5" cy="28" r="2"/><circle cx="32" cy="33" r="1.6" fill="#ff6a8a"/><path d="M8 42h48" stroke="#2a5aa0" stroke-width="3"/><path d="M50 8l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#ffd400" stroke="#000" stroke-width=".6"/></svg>';
  GJ.PIC.errands = '<svg viewBox="0 0 64 64"><path d="M10 22h44l-6 34H16z" fill="#c8a878" stroke="#5a3a1a" stroke-width="2"/><path d="M22 22c0-10 20-10 20 0" fill="none" stroke="#5a3a1a" stroke-width="3"/><rect x="18" y="10" width="10" height="18" rx="2" fill="#fff" stroke="#000"/><rect x="18" y="16" width="10" height="5" fill="#2f80ee"/><rect x="34" y="14" width="14" height="14" rx="5" fill="#e8b060" stroke="#000"/><rect x="40" y="26" width="16" height="22" fill="#ffff9a" stroke="#c8c060" transform="rotate(8 48 37)"/><path d="M43 33h9M43 37h8M42 41h9" stroke="#203080" stroke-width="1.4" transform="rotate(8 48 37)"/></svg>';
  Object.assign(GJ.NOTES, {
    shelves: [['Mr Dobbs says: "Soup with the BEANS? Crisps in the FREEZER? Go home, lad."', 'Mr Dobbs found a tin of peas in the bread bin. He is very confused.'],
      ['Mr Dobbs says: "Not bad. Only one or two in the wrong place. Same time tomorrow."', 'Mr Dobbs gave you a Fredo for your trouble. Then charged you for it.'],
      ['Mr Dobbs says: "Neatest shelves in the county!" He wants to put your photo up by the till.', 'Mr Dobbs says you stack faster than his nephew, and his nephew is "a professional".']],
    newsletter: [['Reverend Pugh says: "The newsletter now says the jumbel sale is on Sundey. Hmm."', 'Reverend Pugh says thank you, but the choir is still spelt QUIRE. Never mind.'],
      ['Reverend Pugh says: "Splendid! Only a few mistakes got through. Nobody reads the bottom bit anyway."', 'Reverend Pugh says it was "very nearly perfect" and gave you a custard cream.'],
      ['Reverend Pugh says: "Not a single mistake! It is a miracle!" (His words.)', 'Reverend Pugh says you are the best proof-reader the parish has ever had. Even better than Mrs Hodge.']],
    hamster: CT2([['{nbrkid} says {nbrpet} is still under the sofa. And the cat is very pleased with itself.', '{nbrkid} says you caught the cat more than the hamster. The cat would like a word.'],
      ['{nbrkid} says thanks! {nbrpet} is back in {nbrpet.his} cage. {nbrpet.He} has eaten a pencil.', 'Mrs Pemberton says {nbrpet} is safe, the cat is sulking, and you are a star.'],
      ['{nbrkid} says you are the fastest hamster catcher in the WORLD. {nbrpet} is too dizzy to escape ever again.', "Mrs Pemberton says she has never seen anyone catch a hamster that fast. Not even on telly."]]),
    errands: [['Mom says: "I asked for MILK. Why have we got cola, mushy peas and a newspaper?" Love Mom x', 'Mom says the shopping was "creative". Love Mom x'],
      ['Mom says: "Nearly everything! I\'ll get the rest myself." Love Mom x', 'Mom says thank you, and you can keep the change (it was 2p). Love Mom x'],
      ['Mom says: "Every single thing! You must have been listening for once!" Love Mom xx', 'Mom says: "PERFECT shopping! Nan will be so proud." Love Mom xx']],
  });

  // ================================================================ THE JOB CENTRE (on www.oddjobz.jnet)
  const css = `.exj{margin:0 0 14px;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px}
.exj-box{background:#fffbe8;border:2px solid #000;padding:8px 10px;font-size:12px;box-shadow:3px 3px 0 rgba(0,0,0,.35)}
.exj-box h3{margin:0 0 4px;font:bold 15px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#a0002a}
.exj-streak{display:flex;gap:3px;margin:6px 0}
.exj-streak i{width:18px;height:18px;border:2px solid #000;background:#ddd;border-radius:3px}
.exj-streak i.on{background:linear-gradient(#ffe680,#ff8a00)}
.exj .btn{font-weight:bold}
.ojz-card{transition:transform .15s}
.ojz-card:nth-child(4){transform:rotate(1deg);background:#f0ffe8}.ojz-card:nth-child(5){transform:rotate(-1.6deg);background:#fff8d8}.ojz-card:nth-child(6){transform:rotate(2deg);background:#f4ecff}.ojz-card:nth-child(7){transform:rotate(-.8deg);background:#e8fff8}
.ojz-card.exj-jotd{outline:4px solid #ffd400;outline-offset:2px}
.exj-tag{position:absolute;right:-8px;top:-18px;background:#e10600;color:#ffd400;font:bold 10px/1 Impact,'Arial Black',sans-serif;padding:4px 6px;transform:rotate(8deg);border:2px solid #ffd400;box-shadow:2px 2px 0 #000;letter-spacing:1px;z-index:2}
@media (max-width:600px){.exj{grid-template-columns:minmax(0,1fr)}}`;
  const st = document.createElement('style'); st.id = 'exJobsCss'; st.textContent = css; document.head.appendChild(st);
  const board0 = GJ.board;
  let tour = null;
  EX.on('exTour', m => { tour = m; });
  GJ.board = function (el, noFetch) {
    const r = board0.apply(this, arguments);
    try { decorate(el); } catch (e) { console.error(e); }
    if (!noFetch) { EX.send({ t: 'exJobs' }); EX.send({ t: 'exTour' }); }
    return r;
  };
  function decorate(el) {
    const J = EX.jobs, cork = el.querySelector('.ojz-cork'); if (!cork) return;
    if (J && J.jotd) cork.querySelectorAll('[data-job]').forEach(b => { if (b.dataset.job !== J.jotd) return; const card = b.closest('.ojz-card'); if (card && !card.querySelector('.exj-tag')) { card.classList.add('exj-jotd'); card.insertAdjacentHTML('beforeend', `<span class="exj-tag">JOB OF THE DAY!${J.jdone ? ' &#10004;' : ' +BONUS'}</span>`); } });
    if (el.querySelector('.exj')) el.querySelector('.exj').remove();
    const box = document.createElement('div'); box.className = 'exj';
    const mem = EX.member, ev = tour && tour.ev ? tour.ev.find(e => e.k === 'job') : null;
    box.innerHTML = `<div class="exj-box"><h3>The Job Centre</h3>${mem && J ? `<b>Your streak: ${J.streak} day${J.streak === 1 ? '' : 's'}</b>${J.today ? ' (done today!)' : J.streak ? ' (do a paid job today to keep it going!)' : ''}<div class="exj-streak">${Array.from({ length: 7 }, (_, i) => `<i class="${i < Math.min(7, J.streak) ? 'on' : ''}"></i>`).join('')}</div>${J.next ? `Your next streak bonus: <b>${EX.rp(J.next)}</b> (up to ${EX.rp(J.max)} a day).` : 'Do a paid job two days running to start a streak bonus.'} Best ever: ${J.best} day${J.best === 1 ? '' : 's'}.` : 'Do odd jobs on back-to-back days for a <b>streak bonus</b> (members).'}<br><br><b>Job of the Day:</b> ${J ? esc(J.jotdN) : '...'}: its first paid go today pays a <b>bonus</b>${J && J.jdone ? ' (you\'ve had it today!)' : ''}.</div>
      <div class="exj-box"><h3>The Mega Masters Cup</h3>${ev ? `This week's job event: <b>${esc(ev.n)}</b>. Your best score counts. Top three win gold cups and Rupees!${ev.me ? `<br>You're <b>${ev.me.pos}${['th', 'st', 'nd', 'rd'][(ev.me.pos % 10 < 4 && Math.floor(ev.me.pos / 10) !== 1) ? ev.me.pos % 10 : 0]}</b> with ${ev.me.s}.` : ''}<br><button class="btn" data-exjob="${esc(ev.g)}">Do it now!</button> <a href="http://www.megamasters.cyb/">League table &raquo;</a>` : 'Loading this week\'s events...'}</div>`;
    const cork2 = el.querySelector('.ojz-cork'); cork2.parentNode.insertBefore(box, cork2);
    const b = box.querySelector('[data-exjob]'); if (b) b.addEventListener('click', () => Grind.job(b.dataset.exjob));
  }
  let bt = 0;
  const redraw = () => { clearTimeout(bt); bt = setTimeout(() => { const el = document.querySelector('#s-secret .ojz'); if (el && el.isConnected) decorate(el); }, 150); };
  EX.on('jobs', redraw); EX.on('exTour', redraw);
  window.ExJobs = { thing, THINGS };
})();

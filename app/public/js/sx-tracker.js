/* sx-tracker: the new Secrets Found window (lazy, from js/sx.js; Start > Find > Secrets, or Start > Run > secrets).
 * Every secret on the PC is sorted into a category by its id (see CATS), with a count, a bar and a medal for each.
 * Secrets you haven't found are just "???": hints don't come free any more, you light them with HINT BULBS, and
 * bulbs come slowly (one for every 15 minutes at the PC, one for every 5 secrets found, never more than 9 saved up).
 * State: jhp_sx_bulbs = { n, min, got, rev:{id:1}, used } (it roams with your JackNet profile like everything else). */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.SxTracker) return;
  const esc = A.esc, store = A.store;
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const p2 = n => String(n).padStart(2, '0');
  const d99 = ts => { const d = new Date(ts); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/99'; };
  const svg = (d, s) => `<svg viewBox="0 0 16 16" width="${s || 16}" height="${s || 16}" aria-hidden="true">${d}</svg>`;
  const CI = {
    desk: svg('<rect x="1" y="2" width="14" height="10" fill="#c0c0c0" stroke="#000"/><rect x="2.5" y="3.5" width="11" height="7" fill="#008080"/><rect x="4" y="13" width="8" height="2" fill="#808080" stroke="#000" stroke-width=".5"/>'),
    progs: svg('<rect x="1" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000"/><rect x="1" y="2" width="14" height="3" fill="#000080"/><rect x="3" y="7" width="4" height="5" fill="#ffd400" stroke="#000" stroke-width=".5"/><rect x="9" y="7" width="4" height="5" fill="#e10600" stroke="#000" stroke-width=".5"/>'),
    games: svg('<rect x="1" y="5" width="14" height="7" rx="3" fill="#555" stroke="#000"/><path d="M4 7v3M2.5 8.5h3" stroke="#fff"/><circle cx="11" cy="7.5" r="1" fill="#e10600"/><circle cx="12.5" cy="9.5" r="1" fill="#3c3"/>'),
    dos: svg('<rect x="1" y="2" width="14" height="11" fill="#000" stroke="#808080"/><path d="M3 5l2 2-2 2M6 10h4" stroke="#c0c0c0" fill="none"/>'),
    web: svg('<circle cx="8" cy="8" r="6.5" fill="#2a7ad8" stroke="#003"/><path d="M2 6c4-1.5 8-1.5 12 0M2 10c4 1.5 8 1.5 12 0M8 1.5c-3 4-3 9 0 13M8 1.5c3 4 3 9 0 13" stroke="#9fd0ff" fill="none" stroke-width=".8"/>'),
    social: svg('<circle cx="5" cy="5" r="2.5" fill="#f2c79a" stroke="#000"/><path d="M1 13c0-4 8-4 8 0z" fill="#2a7ad8" stroke="#000"/><circle cx="11" cy="6" r="2.5" fill="#f2c79a" stroke="#000"/><path d="M7 14c0-4 8-4 8 0z" fill="#3c3" stroke="#000"/>'),
    money: svg('<path d="M8 1l5 5-5 9-5-9z" fill="#3c3" stroke="#063"/><path d="M3 6h10M8 1v14" stroke="#9f9" stroke-width=".7"/>'),
    home: svg('<path d="M1 8l7-6 7 6v7H1z" fill="#d9a441" stroke="#5a3a1a"/><rect x="6" y="10" width="4" height="5" fill="#8a5a2a"/>'),
    puzzles: svg('<path d="M2 2h5v2a1.5 1.5 0 1 0 2 0V2h5v5h-2a1.5 1.5 0 1 0 0 2h2v5H9v-2a1.5 1.5 0 1 0-2 0v2H2z" fill="#a040c0" stroke="#000" stroke-width=".7"/>'),
    dates: svg('<rect x="2" y="3" width="12" height="11" fill="#fff" stroke="#000"/><rect x="2" y="3" width="12" height="3" fill="#e10600"/><path d="M5 9h2M9 9h2M5 12h2" stroke="#000"/>'),
    eggs: svg('<ellipse cx="8" cy="9" rx="5" ry="6" fill="#ffe0f0" stroke="#000"/><path d="M3.5 8l2-1 2 1 2-1 2 1 1-.5M4 11l2 1 2-1 2 1 2-1" stroke="#2a7ad8" fill="none"/>'),
    other: svg('<circle cx="8" cy="8" r="6.5" fill="#ffd400" stroke="#a07000"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" font-family="Arial" fill="#a07000">?</text>'),
  };
  // [key, name, test(id)]
  const PFX = (list) => id => list.some(p => id === p || id.startsWith(p + '.'));
  const CATS = [
    ['eggs', 'Easter Eggs', PFX(['sx.r'])],
    ['puzzles', 'Puzzles & Mysteries', PFX(['sx.h', 'sx.b', 'arg', 'leap'])],
    ['dos', 'MS-DOS', PFX(['dos', 'sx.d'])],
    ['desk', 'Desktop & JackOS', id => !id.includes('.') || PFX(['system', 'setup', 'fresh', 'tb', 'sx.t', 'sx'])(id)],
    ['progs', 'Programs', PFX(['prog', 'office', 'fun', 'carta', 'files', 'mail'])],
    ['games', 'Games', PFX(['games', 'sol', 'fps', 'disc', 'zone', 'mp', 'pcgames'])],
    ['web', 'The JackNet', PFX(['web', 'era', 'eras', 'eng', 'site', 'br', 'bdl', 'n99', 'hpz', 'cx'])],
    ['social', 'Friends & Online', PFX(['social', 'share', 'lan', 'jsn', 'jb', 'gst', 'evt', 'jw'])],
    ['money', 'Rupees & Loot', PFX(['econ', 'loot', 'grind', 'ex'])],
    ['home', 'Home & Bedroom', PFX(['fam', 'rm'])],
    ['dates', 'Seasons & Dates', PFX(['ssn'])],
  ];
  const catOf = id => { for (const [k, , t] of CATS) if (t(id)) return k; return 'other'; };
  const ALLCATS = CATS.concat([['other', 'Everything Else', () => true]]);
  const RANKS = [[100, 'JACK HIMSELF'], [90, 'Keeper of Secrets'], [70, 'Master Spy'], [50, 'Secret Agent'], [35, 'Super Sleuth'], [20, 'Detective'], [10, 'Junior Detective'], [5, 'Nosy Parker'], [1, 'Snooper'], [0, 'New Kid']];
  const rankOf = pc => (RANKS.find(([p]) => pc >= p) || RANKS[RANKS.length - 1])[1];
  const medal = pc => pc >= 100 ? ['#ffd400', 'Gold'] : pc >= 50 ? ['#c8c8d8', 'Silver'] : pc >= 25 ? ['#c87a3a', 'Bronze'] : null;
  const medalSvg = m => m ? svg(`<circle cx="8" cy="10" r="5" fill="${m[0]}" stroke="#000"/><path d="M5 1h2l1 4-2 1zM11 1H9L8 5l2 1z" fill="#e10600" stroke="#000" stroke-width=".5"/><circle cx="8" cy="10" r="2.5" fill="none" stroke="rgba(0,0,0,.35)"/>`) : '';
  const BULB = on => svg(`<path d="M8 1a5 5 0 0 0-3 9c1 1 1 2 1 3h4c0-1 0-2 1-3a5 5 0 0 0-3-9z" fill="${on ? '#ffe640' : '#d8d8d8'}" stroke="${on ? '#a07000' : '#888'}"/><rect x="6" y="13" width="4" height="2" fill="#888"/>${on ? '<path d="M8 4v4" stroke="#fff" stroke-width="1.2"/>' : ''}`);

  // ---- hint bulbs
  const MAXB = 9;
  const bulbs = () => { const b = store.get('jhp_sx_bulbs', null) || { n: 3, min: 0, got: Object.keys(A.found || {}).length, rev: {}, used: 0 }; if (!b.rev || typeof b.rev !== 'object') b.rev = {}; return b; };
  function accrue(b) { const fc = Object.keys(A.found || {}).filter(k => A.secrets[k]).length; if (b.got == null || b.got > fc) b.got = fc; while (fc - b.got >= 5) { b.got += 5; b.n = Math.min(MAXB, (b.n | 0) + 1); } return b; }

  let cur = null;
  function open() {
    if (cur && !cur.w.closed) { cur.w.focus && cur.w.focus(); cur.draw(); return cur.w; }
    secret('sx.t.list');
    const b = document.createElement('div'); b.className = 'sxt';
    b.innerHTML = `<div class="sxt-top"><svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true"><path d="M16 2l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffd400" stroke="#a07000"/></svg><div class="sxt-sum"></div></div>
      <div class="prog sxt-bar"><span style="display:flex;gap:2px"></span></div>
      <div class="sxt-bulbs"></div>
      <div class="tabs"><span class="on" data-t="cats">Categories</span><span data-t="recent">Recently Found</span><span data-t="hunt">The Great Hunt</span></div>
      <div class="tabpage sxt-page"></div>`;
    const w = A.win('Secrets Found', b, { w: 620, h: 500, minW: 300, minH: 320, status: true, icon: '<svg viewBox="0 0 32 32"><path d="M16 2l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffd400" stroke="#a07000"/></svg>' });
    let tab = store.get('jhp_sx_trtab', 'cats'), sel = store.get('jhp_sx_trcat', '');
    const page = b.querySelector('.sxt-page');
    function counts() {
      const ids = Object.keys(A.secrets), found = A.found || {}, by = {};
      ALLCATS.forEach(([k]) => { by[k] = { all: [], got: 0 }; });
      ids.forEach(id => { const k = catOf(id); by[k].all.push(id); if (found[id]) by[k].got++; });
      return { ids, found, by, got: ids.filter(id => found[id]).length };
    }
    function draw() {
      const C = counts(), bl = accrue(bulbs()); store.set('jhp_sx_bulbs', bl);
      const pc = C.ids.length ? Math.floor(C.got / C.ids.length * 100) : 0;
      b.querySelector('.sxt-sum').innerHTML = `<div>You have found <b>${C.got}</b> of <b>${C.ids.length}</b> secrets (${pc}%).</div><div>Rank: <b class="sxt-rank">${esc(rankOf(C.ids.length && C.got === C.ids.length ? 100 : pc))}</b></div>`;
      b.querySelector('.sxt-bar span').innerHTML = '<i></i>'.repeat(Math.max(C.got ? 1 : 0, Math.round(C.got / Math.max(1, C.ids.length) * 30)));
      b.querySelector('.sxt-bulbs').innerHTML = `<span class="sxt-bl">${Array.from({ length: MAXB }, (_, i) => BULB(i < bl.n)).join('')}</span><span><b>${bl.n}</b> hint bulb${bl.n === 1 ? '' : 's'}. Click a <b>???</b> to light its hint. (A new bulb every 15 minutes at the PC, and one for every 5 secrets you find.)</span>`;
      b.querySelectorAll('.tabs span').forEach(t => t.classList.toggle('on', t.dataset.t === tab));
      if (tab === 'cats') drawCats(C, bl); else if (tab === 'recent') drawRecent(C); else drawHunt();
      w.status.textContent = `${C.ids.length} secrets on this PC. Nobody has found them all. Not even Jack.`;
    }
    function drawCats(C, bl) {
      const cats = ALLCATS.filter(([k]) => C.by[k].all.length);
      if (!sel || !C.by[sel] || !C.by[sel].all.length) sel = (cats.find(([k]) => C.by[k].got < C.by[k].all.length) || cats[0] || ['other'])[0];
      const row = ([k, n]) => { const c = C.by[k], pc = Math.floor(c.got / c.all.length * 100); return `<button type="button" class="sxt-cat${k === sel ? ' on' : ''}" data-c="${k}"><span class="ic">${CI[k] || CI.other}</span><span class="nm">${esc(n)}<small>${c.got} / ${c.all.length}</small></span><span class="mb"><i style="width:${pc}%"></i></span><span class="md" title="${medal(pc) ? medal(pc)[1] + ' medal' : ''}">${medalSvg(medal(pc))}</span></button>`; };
      const c = C.by[sel], list = c.all.slice().sort((x, y) => (C.found[y] ? 1 : 0) - (C.found[x] ? 1 : 0) || (C.found[y] || 0) - (C.found[x] || 0));
      const S = A.secrets;
      page.innerHTML = `<div class="sxt-split"><div class="sxt-cats" role="list">${cats.map(row).join('')}</div><div class="sxt-list"><div class="sxt-lh">${CI[sel] || CI.other} <b>${esc((ALLCATS.find(x => x[0] === sel) || [0, 'Everything Else'])[1])}</b>: ${c.got} of ${c.all.length}${medal(Math.floor(c.got / c.all.length * 100)) ? ' &middot; ' + medal(Math.floor(c.got / c.all.length * 100))[1] + ' medal!' : ''}</div>${list.map(id => C.found[id] ? `<div class="sxt-row got">&#9733; <b>${esc(S[id].name)}</b> <small>${d99(C.found[id])}</small></div>` : bl.rev[id] ? `<div class="sxt-row hint">? <i>${esc(S[id].hint || '???')}</i></div>` : `<button type="button" class="sxt-row q" data-id="${esc(id)}" title="Use a hint bulb">? ??? <span class="sxt-use">${BULB(bl.n > 0)}</span></button>`).join('')}</div></div>`;
      page.querySelectorAll('.sxt-cat').forEach(x => x.addEventListener('click', () => { sel = x.dataset.c; store.set('jhp_sx_trcat', sel); sfx('click'); draw(); }));
      page.querySelectorAll('.sxt-row.q').forEach(x => x.addEventListener('click', () => useBulb(x.dataset.id)));
    }
    function useBulb(id) {
      const bl = bulbs();
      if (bl.rev[id]) return draw();
      if (!(bl.n > 0)) { sfx('uhoh'); Desk.msgbox('Hint bulbs', 'You\'ve run out of hint bulbs!\n\nA new one lights up for every 15 minutes you spend on the PC, and for every 5 secrets you find without help.', 'info'); return; }
      Desk.msgbox('Hint bulbs', `Use one of your ${bl.n} hint bulb${bl.n === 1 ? '' : 's'} to read the hint for this secret?`, 'q', [['Yes', () => { const b2 = bulbs(); if (!(b2.n > 0)) return; b2.n--; b2.used = (b2.used | 0) + 1; b2.rev[id] = 1; store.set('jhp_sx_bulbs', b2); secret('sx.t.bulb'); sfx('pet'); draw(); }], ['No']]);
    }
    function drawRecent(C) {
      const S = A.secrets, rec = C.ids.filter(id => C.found[id]).sort((x, y) => C.found[y] - C.found[x]).slice(0, 25);
      page.innerHTML = rec.length ? `<div class="sxt-list sxt-solo">${rec.map(id => `<div class="sxt-row got">${CI[catOf(id)] || CI.other} <b>${esc(S[id].name)}</b> <small>${d99(C.found[id])} &middot; ${esc((ALLCATS.find(x => x[0] === catOf(id)) || [0, ''])[1])}</small></div>`).join('')}</div>` : '<p style="padding:10px">Nothing yet! Try pressing things. Try typing things. Try Start &gt; Run. Try EVERYTHING.</p>';
    }
    function drawHunt() {
      const X = window.Sx;
      if (!X) { page.innerHTML = '<p style="padding:10px">The Great JackNet Hunt isn\'t on this PC.</p>'; return; }
      const nk = X.nKeys(), nb = X.nBytes(), pc = Math.min(100, nk * 7 + nb * 3);
      page.innerHTML = `<div class="sxt-hunt"><p><b>THE GREAT JACKNET HUNT</b>: ten keys hidden all over the JackNet and this PC, and ten Golden Bytes for show-offs.</p><p>Keys found: <b>${nk}</b> of 10 &middot; Golden Bytes: <b>${nb}</b> of 10 &middot; <b>${pc}%</b> complete</p><div class="prog"><span style="display:flex;gap:2px">${'<i></i>'.repeat(Math.round(pc / 100 * 30))}</span></div><p>${nk >= 10 ? (pc >= 100 ? 'You did EVERYTHING. Respect, Champion.' : 'All ten keys! Now for the Golden Bytes...') : nk ? 'Keep going! Hunt HQ has your next clue.' : 'Hunt HQ is at www.greathunt.jnet. Every hunt starts there.'}</p><div class="row" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn sxt-hq">Open Hunt HQ</button>${window.Setup && Setup.has && Setup.has('sx.kit') ? '<button type="button" class="btn sxt-kit">Open the Hunter\'s Kit</button>' : ''}</div></div>`;
      page.querySelector('.sxt-hq').addEventListener('click', () => X.go('http://' + X.HQ + '/'));
      const k = page.querySelector('.sxt-kit'); if (k) k.addEventListener('click', () => A.open('sx.kit'));
    }
    b.querySelectorAll('.tabs span').forEach(t => t.addEventListener('click', () => { tab = t.dataset.t; store.set('jhp_sx_trtab', tab); draw(); }));
    draw();
    cur = { w, draw };
    return w;
  }
  // (the minute ticker that lights new bulbs lives in js/sx.js, so it runs whether or not this window has been opened)

  if (!document.getElementById('sxTrCss')) {
    const s = document.createElement('style'); s.id = 'sxTrCss';
    s.textContent = `
.sxt{display:flex;flex-direction:column;height:100%;min-height:0;gap:6px;font:12px var(--ui,Tahoma,sans-serif)}
.sxt-top{display:flex;gap:10px;align-items:center}
.sxt-top svg{flex:none}
.sxt-sum{line-height:1.5}.sxt-rank{color:#000080}
.sxt-bulbs{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px;color:#333}
.sxt-bl{display:inline-flex;gap:1px;flex:none}
.sxt-page{flex:1;min-height:0;overflow:auto;padding:4px}
.sxt-split{display:flex;gap:6px;height:100%;min-height:0}
.sxt-cats{flex:0 0 210px;overflow:auto;display:flex;flex-direction:column;gap:2px}
.sxt-cat{display:flex;align-items:center;gap:5px;text-align:left;background:#c0c0c0;border:1px solid transparent;padding:3px 4px;font:12px var(--ui,Tahoma,sans-serif);cursor:pointer;min-height:30px}
.sxt-cat.on{background:#000080;color:#fff}
.sxt-cat .ic{flex:none;display:flex}
.sxt-cat .nm{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.sxt-cat .nm small{opacity:.8}
.sxt-cat .mb{flex:0 0 40px;height:6px;border:1px solid #808080;background:#fff;position:relative}
.sxt-cat .mb i{position:absolute;left:0;top:0;bottom:0;background:#000080}
.sxt-cat.on .mb i{background:#ffd400}
.sxt-cat .md{flex:0 0 16px;display:flex}
.sxt-list{flex:1;min-width:0;overflow:auto;background:#fff;border:2px inset #fff;padding:4px}
.sxt-lh{display:flex;align-items:center;gap:5px;padding:2px 2px 6px;border-bottom:1px solid #ccc;margin-bottom:4px}
.sxt-row{display:flex;align-items:center;gap:5px;width:100%;text-align:left;padding:3px 4px;font:12px var(--ui,Tahoma,sans-serif);background:none;border:0;border-bottom:1px dotted #ddd;min-height:24px}
.sxt-row small{color:#808080;margin-left:auto;padding-left:8px;white-space:nowrap}
.sxt-row.got b{color:#000}
.sxt-row.q{color:#808080;cursor:pointer}
.sxt-row.q:hover{background:#ffffe0}
.sxt-row .sxt-use{margin-left:auto;display:flex}
.sxt-row.hint{color:#555}
.sxt-hunt{padding:6px}
@media (max-width:640px){.sxt-split{flex-direction:column}.sxt-cats{flex:0 0 auto;max-height:150px}.sxt-cat .mb{flex-basis:28px}}
`;
    document.head.appendChild(s);
  }
  window.SxTracker = { open, catOf, CATS: ALLCATS, redraw: () => { if (cur && !cur.w.closed) cur.draw(); } };
})();

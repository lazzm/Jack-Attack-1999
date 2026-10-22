/* www.jackotchigraveyard.kidz: a gentle little memorial for Jackotchis that wandered off because nobody fed them.
 * Graves come from Net.kv 'fam.graves' (pushed by js/family.js when a visitor's Jackotchi goes; public names only),
 * flowers from Net.kv 'fam.flowers' (one per grave per visitor per day). Loaded by js/family.js. */
(function () {
  const F = window.Family, A = window.Apps; if (!F || !A) return;
  const esc = A.esc, store = A.store;
  const FLOWER_KEY = 'jhp_family_flowers';
  const SEED = [
    { id: 'j1', name: 'Jackotchi I', owner: 'Jack', gen: 1, age: 3, cause: 'wandered off while Jack was round Dave\'s playing Goldenballs', date: '14/03/99' },
    { id: 'j2', name: 'Blip', owner: 'Jack', gen: 2, age: 5, cause: 'got bored during exam revision (Jack was revising. Honestly.)', date: '02/06/99' },
    { id: 'l1', name: 'Princess Sparkles', owner: Cast.n('sister'), gen: 1, age: 9, cause: 'loved very much, then left in the caravan for a week', date: '07/08/99' },
    { id: 'd1', name: 'Mr Grumbles', owner: 'Dad', gen: 1, age: 1, cause: 'Dad thought the CLEAN button was the OFF button', date: '20/09/99' },
  ];
  const css = document.createElement('style');
  css.textContent = `.gy{background:#bfe6ff linear-gradient(#9fd4ff,#e0f4ff 220px);color:#203040;font:14px/1.4 "Comic Sans MS","Comic Neue","Chalkboard SE",cursive;padding:0 0 18px;min-height:100%}
.gy-top{text-align:center;padding:16px 10px 6px}
.gy-top h1{margin:0;font:bold 30px "Comic Sans MS","Comic Neue",cursive;color:#5a2a90;text-shadow:2px 2px 0 #fff}
.gy-top p{margin:4px auto;max-width:560px}
.gy-hill{height:46px;background:radial-gradient(ellipse at 50% 100%,#58b040 60%,transparent 61%) bottom/140% 100% no-repeat}
.gy-field{background:#58b040 repeating-linear-gradient(90deg,transparent 0 22px,rgba(0,0,0,.04) 22px 24px);padding:10px 8px 18px;display:flex;flex-wrap:wrap;justify-content:center;gap:16px 12px}
.gy-g{width:150px;text-align:center}
.gy-stone{position:relative;box-sizing:border-box;height:168px;overflow:hidden;background:linear-gradient(#e0e0e0,#b8b8b8);border:2px solid #6a6a6a;border-radius:70px 70px 6px 6px;padding:22px 8px 10px;min-height:118px;box-shadow:3px 3px 0 rgba(0,0,0,.25);color:#303030}
.gy-stone b{display:block;font-size:15px;color:#202020;word-wrap:break-word}
.gy-stone small{display:block;font-size:11px;line-height:1.3;margin-top:3px}
.gy-stone .rip{font:bold 11px Georgia,serif;letter-spacing:3px;color:#606060}
.gy-fl{min-height:22px;margin-top:4px;line-height:0}
.gy-fl svg{width:16px;height:20px;margin:0 -1px}
.gy-btn{margin-top:4px;font:12px "Comic Sans MS","Comic Neue",cursive;background:#fff0fa;border:2px outset #ffc8ea;padding:3px 8px;cursor:pointer;color:#902060}
.gy-btn:disabled{opacity:.6;cursor:default}
.gy-box{max-width:560px;margin:14px auto 0;background:#fffbe0;border:2px dashed #c09000;padding:8px 12px;text-align:center}
.gy-foot{text-align:center;font:11px Tahoma,sans-serif;color:#305030;margin-top:12px}
.gy-ctr{font:bold 13px "Courier New",monospace;background:#000;color:#0f0;padding:1px 5px}`;
  document.head.appendChild(css);
  const COLS = ['#ff6ab8', '#ffd400', '#ffffff', '#ff8040', '#b080ff', '#ff4060'];
  const flower = i => `<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M8 9v11" stroke="#2a7a20" stroke-width="1.5"/><path d="M8 15c-3-1-4-3-4-3 2 0 3 1 4 3z" fill="#2a9a2a"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${8 + Math.cos(a * Math.PI / 180) * 3.2}" cy="${6 + Math.sin(a * Math.PI / 180) * 3.2}" r="2.6" fill="${COLS[i % COLS.length]}" stroke="rgba(0,0,0,.35)" stroke-width=".4"/>`).join('')}<circle cx="8" cy="6" r="1.8" fill="#ffd400" stroke="#a07000" stroke-width=".4"/></svg>`;
  const roman = F.roman;
  const d99 = ts => { const t = F.today(); return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99`; };
  let lastFlower = 0;

  function render(el) {
    el.innerHTML = '';
    const root = document.createElement('div'); root.className = 'gy';
    root.innerHTML = `<div class="gy-top"><h1>~*~ The Jackotchi Graveyard ~*~</h1>
      <p>A quiet, peaceful place for Jackotchis who wandered off. They aren't gone, not really. They've just gone to <b>the Great Green Field</b>, where there is always pizza and nobody ever forgets to press FEED.</p>
      <p><small>Leave a flower for a Jackotchi. One flower per Jackotchi per day. Be kind. &hearts;</small></p></div>
      <div class="gy-hill"></div><div class="gy-field"><p>Loading the Great Green Field...</p></div>
      <div class="gy-box">Is <b>your</b> Jackotchi hungry? Don't let it end up here!<br><button type="button" class="gy-btn gy-feed">Go and feed my Jackotchi now</button></div>
      <div class="gy-foot">You are visitor number <span class="gy-ctr">------</span> &middot; This page is best viewed in JackNet Explorer at 800x600 &middot; Made by a grown-up who misses her Jackotchi &middot; Last updated ${esc(F.todayStr())}</div>`;
    el.appendChild(root);
    root.querySelector('.gy-feed').addEventListener('click', () => A.open('grotchi'));
    const field = root.querySelector('.gy-field');
    let graves = [], flowers = {};
    function list() {
      const out = [];
      const g = F.gubbinz; // the shared grot on the JACK ATTACK! site: his older brothers are buried here too
      if (g && g.gen > 1) for (let n = g.gen - 1; n >= Math.max(1, g.gen - 4); n--) out.push({ id: 'gub' + n, name: 'Gubbinz ' + roman(n), owner: 'everyone on JackNet', gen: n, cause: 'starved while everybody was busy playing Snake', date: '' });
      graves.slice().reverse().forEach(e => {
        const [name, gen, age, cause] = String(e.text || '').split('|');
        if (!name) return;
        out.push({ id: 'k' + (e.ts || 0).toString(36), name: name.slice(0, 24), owner: e.by || 'a visitor', gen: +gen || 1, age: +age || 0, cause: (cause || 'got too hungry').slice(0, 80), date: e.ts ? d99(e.ts) : '' });
      });
      return out.concat(SEED);
    }
    function draw() {
      const mine = store.get(FLOWER_KEY, {}), day = F.todayStr();
      field.innerHTML = list().map(gr => {
        const n = Math.min(99, +flowers[gr.id] || 0), given = mine[gr.id] === day;
        return `<div class="gy-g" data-id="${esc(gr.id)}"><div class="gy-stone"><span class="rip">R.I.P.</span><b>${esc(gr.name)}</b><small>Generation ${esc(roman(gr.gen))}${gr.age ? ` &middot; ${gr.age} day${gr.age === 1 ? '' : 's'}` : ''}</small><small>Kept by <b style="display:inline;font-size:11px">${esc(gr.owner)}</b></small><small><i>${esc(gr.cause)}</i></small>${gr.date ? `<small>${esc(gr.date)}</small>` : ''}</div>
          <div class="gy-fl" title="${n} flower${n === 1 ? '' : 's'}">${Array.from({ length: Math.min(n, 9) }, (_, i) => flower(i + gr.id.length)).join('')}${n > 9 ? `<small style="line-height:20px;vertical-align:top"> +${n - 9}</small>` : ''}</div>
          <button type="button" class="gy-btn" ${given ? 'disabled' : ''}>${given ? 'Flower left &hearts;' : 'Leave a flower'}</button></div>`;
      }).join('') || '<p>Nobody here yet. Good! Keep feeding them!</p>';
    }
    field.addEventListener('click', ev => {
      const b = ev.target.closest('.gy-btn'); if (!b || b.disabled) return;
      const id = b.closest('.gy-g').dataset.id, mine = store.get(FLOWER_KEY, {}), day = F.todayStr();
      if (mine[id] === day) return;
      if (Date.now() - lastFlower < 6000) return Desk.toast('The Jackotchi Graveyard', 'Slowly, gently. One flower at a time.', 2500);
      if (!window.Net || !Net.connected) return Desk.toast('The Jackotchi Graveyard', 'The page can\'t reach the server right now. Try again in a minute.', 3000);
      lastFlower = Date.now();
      const n = (+flowers[id] || 0) + 1; flowers[id] = n;
      Net.kv.put('fam.flowers', id, String(n));
      mine[id] = day; for (const k in mine) if (mine[k] !== day) delete mine[k]; store.set(FLOWER_KEY, mine);
      A.secret('fam.flower'); Sound.play('pet');
      draw();
    });
    if (window.Net && Net.kv) {
      Net.kv.get(['fam.graves', 'fam.flowers', 'fam.gy.hits']).then(v => {
        graves = Array.isArray(v['fam.graves']) ? v['fam.graves'] : [];
        flowers = v['fam.flowers'] && typeof v['fam.flowers'] === 'object' ? Object.assign({}, v['fam.flowers']) : {};
        root.querySelector('.gy-ctr').textContent = String((+v['fam.gy.hits'] || 0) + 1).padStart(6, '0');
        draw();
      });
      Net.kv.inc('fam.gy.hits');
      const u1 = Net.kv.watch('fam.graves', ev => { if (!root.isConnected) return u1(); if (ev.type === 'push') { graves.push(ev.e); if (graves.length > 40) graves.shift(); draw(); } });
      const u2 = Net.kv.watch('fam.flowers', ev => { if (!root.isConnected) return u2(); if (ev.type === 'put') { if (ev.v === '') delete flowers[ev.f]; else flowers[ev.f] = ev.v; draw(); } });
    } else draw();
  }
  window.FamilyPet = { render };
})();

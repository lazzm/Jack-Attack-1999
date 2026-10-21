/* econ-desk: things that live on the desktop rather than the web. Adoptable taskbar pets (bought at The Rupee Emporium)
 * and the Jack Ticker 98 program window. Loaded when you adopt a pet or open the ticker. */
(function () {
  'use strict';
  if (window.EconDesk) return;
  const A = window.Apps, esc = A.esc, fmt = Econ.fmt;
  const $ = id => document.getElementById(id);
  const phone = () => matchMedia('(hover:none)').matches || innerWidth < 600;
  const tbH = () => (($('taskbar') || {}).offsetHeight) || 30;
  const snd = n => { if (window.Sound) Sound.play(n); };

  // ================================================================ taskbar pets
  const PW = 24, PH = 24;
  const PETS = {
    'pet.rock': { speed: 0, says: ['...', '(Rocky\'s cousin says nothing. Rocks don\'t talk.)', '*sits*', '*continues to sit*', '*rolls slightly*'] },
    'pet.snot': { speed: 55, says: ['Hehehe!', 'What?', 'I found a bogey!', 'Is that a biscuit?', 'Snot fair!', 'Feed me after midnight? No? OK.'] },
    'pet.squig': { speed: 40, says: ['GRRR!', 'CHOMP!', '*bounce*', 'Rrrrr...', '*licks screen*'] },
    'pet.cube': { speed: 25, says: ['*click-clack*', 'R U R\' U\'', 'I am unsolvable.', 'Scrambled!', '*clicks*'] },
  };
  let pet = null;
  // JackLoot pets (Lootlings, ids 'L:pet.x') come from js/loot-art.js: { speed, says, draw(g, f, st, p) }
  const lootDef = id => (String(id || '').startsWith('L:') && window.Loot && Loot.petDef ? Loot.petDef(id.slice(2)) : null);
  const defOf = id => PETS[id] || lootDef(id);
  function drawPet(g, id, f, st) {
    g.clearRect(0, 0, PW, PH);
    const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const ld = lootDef(id); if (ld) return ld.draw(g, f, st, p);
    if (id === 'pet.rock') { const r = st.roll ? (f % 4) : 0; p(4, 12 + (r === 1 ? -1 : 0), 16, 9, '#888'); p(3, 14, 18, 6, '#888'); p(6, 11, 10, 2, '#aaa'); p(5, 20, 14, 2, '#555'); p(8, 15, 2, 2, '#000'); p(14, 15, 2, 2, '#000'); if (st.blink) { p(8, 15, 2, 1, '#888'); p(14, 15, 2, 1, '#888'); } p(10, 18, 4, 1, '#333'); }
    else if (id === 'pet.snot') { const leg = st.moving ? f % 2 : 0; p(7, 9, 10, 9, '#7ac03a'); p(3, 9, 4, 3, '#7ac03a'); p(17, 9, 4, 3, '#7ac03a'); p(9, 12, 2, 2, '#e10600'); p(13, 12, 2, 2, '#e10600'); p(10, 16, 4, 1, '#fff'); p(8, 18, 8, 3, '#8a5a2a'); p(8 + leg, 21, 2, 3, '#3a6a1a'); p(14 - leg, 21, 2, 3, '#3a6a1a'); if (st.pick) { p(14, 13, 2, 3, '#7ac03a'); p(15, 12, 1, 2, '#5a9a2a'); } }
    else if (id === 'pet.squig') { const b = st.bounce || 0; p(4, 6 - b, 16, 13, '#e10600'); p(3, 9 - b, 18, 8, '#e10600'); p(7, 9 - b, 3, 3, '#ff0'); p(14, 9 - b, 3, 3, '#ff0'); p(8, 10 - b, 1, 1, '#000'); p(15, 10 - b, 1, 1, '#000'); p(5, 15 - b, 14, 2, '#fff'); for (let i = 0; i < 7; i++) p(5 + i * 2, 17 - b, 1, 1, '#fff'); p(7, 19 - b, 2, 4 + b, '#000'); p(15, 19 - b, 2, 4 + b, '#000'); }
    else if (id === 'pet.cube') { const leg = st.moving ? f % 2 : 0, cs = st.cols; p(5, 4, 14, 14, '#111'); for (let i = 0; i < 9; i++) p(6 + (i % 3) * 4.4, 5 + Math.floor(i / 3) * 4.4, 3.6, 3.6, cs[i]); p(8, 18, 2, 4 + leg, '#000'); p(14, 18, 2, 4 + (1 - leg), '#000'); p(6, 22 + leg, 4, 2, '#000'); p(14, 23 - leg, 4, 1, '#000'); }
  }
  const CUBECOL = ['#e10600', '#fff', '#0028c8', '#ffd400', '#0a0', '#ff8c00'];
  const scramble = () => Array.from({ length: 9 }, () => CUBECOL[Math.floor(Math.random() * 6)]);
  function setPet(id) {
    if (pet && pet.id === id) return;
    if (pet) { cancelAnimationFrame(pet.raf); pet.el.remove(); if (pet.bub) pet.bub.remove(); pet = null; }
    if (!id || !defOf(id)) return;
    const el = document.createElement('div'); el.className = 'ec-pet'; el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Your taskbar pet');
    const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; el.appendChild(cv); document.body.appendChild(el);
    const sc = phone() ? 1.5 : 2; cv.style.width = PW * sc + 'px'; cv.style.height = PH * sc + 'px';
    pet = { id, el, cv, g: cv.getContext('2d'), sc, x: innerWidth * (0.3 + Math.random() * 0.4), tx: 0, face: 1, st: { cols: scramble() }, last: 0, next: 0, raf: 0, bub: null, sayUntil: 0 };
    pet.tx = pet.x;
    el.addEventListener('click', () => { const d = defOf(id); say(d.says[Math.floor(Math.random() * d.says.length)]); snd(id === 'pet.squig' ? 'boing' : id === 'pet.cube' ? 'click' : id === 'pet.snot' ? 'pet' : 'thud'); if (id === 'pet.cube') pet.st.cols = scramble(); if (id === 'pet.rock') { pet.st.roll = 20; pet.tx = pet.x + (Math.random() < .5 ? -40 : 40); } });
    pet.raf = requestAnimationFrame(tick);
  }
  function say(t) {
    if (!pet) return;
    if (!pet.bub) { pet.bub = document.createElement('div'); pet.bub.className = 'ff-bubble ec-petbub'; document.body.appendChild(pet.bub); }
    pet.bub.textContent = t; pet.bub.hidden = false; pet.sayUntil = performance.now() + 2200;
  }
  function tick(t) {
    if (!pet) return;
    pet.raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, pet.last ? (t - pet.last) / 1000 : 0.016); pet.last = t;
    const d = defOf(pet.id), st = pet.st, f = Math.floor(t / 200);
    if (t > pet.next) { // decide something new to do
      pet.next = t + 2500 + Math.random() * 5000;
      const r = Math.random();
      if (pet.id === 'pet.rock') { if (r < 0.15) { st.roll = 30; pet.tx = Math.max(30, Math.min(innerWidth - 60, pet.x + (Math.random() < .5 ? -50 : 50))); } }
      else if (r < 0.65) pet.tx = 40 + Math.random() * (innerWidth - 120);
      else if (pet.id === 'pet.snot' && r < 0.85) { st.pick = 1; setTimeout(() => { if (pet) st.pick = 0; }, 1600); }
      else if (pet.id === 'pet.cube' && r < 0.8) { st.cols = scramble(); }
      else if (pet.id === 'pet.squig' && r < 0.75) { pet.tx = 30; st.chomp = 1; }
      st.blink = Math.random() < 0.3;
    }
    const sp = pet.id === 'pet.rock' ? (st.roll > 0 ? 40 : 0) : d.speed, dx = pet.tx - pet.x;
    st.moving = Math.abs(dx) > 2 && sp > 0;
    if (st.moving) { pet.face = Math.sign(dx); pet.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt); }
    else if (st.chomp) { st.chomp = 0; say('CHOMP!'); const sb = $('startBtn'); if (sb) { sb.classList.add('ec-chomp'); setTimeout(() => sb.classList.remove('ec-chomp'), 500); } }
    if (st.roll > 0) st.roll -= dt * 30;
    st.bounce = pet.id === 'pet.squig' ? Math.round(Math.abs(Math.sin(t / 160)) * 4) : 0;
    drawPet(pet.g, pet.id, f, st);
    const w = PW * pet.sc, h = PH * pet.sc, left = Math.round(pet.x - w / 2), top = Math.round(innerHeight - tbH() - h + 2);
    pet.el.style.transform = `translate(${left}px,${top}px)`;
    pet.cv.style.transform = pet.face < 0 ? 'scaleX(-1)' : '';
    if (pet.bub && !pet.bub.hidden) { if (t > pet.sayUntil) pet.bub.hidden = true; else { const bw = pet.bub.offsetWidth || 60; pet.bub.style.transform = `translate(${Math.max(4, Math.min(innerWidth - bw - 4, pet.x - bw / 2))}px,${top - (pet.bub.offsetHeight || 20) - 4}px)`; } }
  }

  // ================================================================ Jack Ticker 98
  function ticker(w, box) {
    box.className = 'ec-tk';
    box.innerHTML = `<div class="ec-tk-lcd"><table><tbody></tbody></table></div><div class="ec-tk-mq"><span>Connecting...</span></div><div class="ec-tk-st"><span class="ec-tk-ix">JX-8 ----</span><span class="ec-tk-tm">--:--</span></div>`;
    let M = null;
    const C = window.EconCat;
    const draw = () => {
      if (!M || w.closed) return;
      const tb = box.querySelector('tbody');
      tb.innerHTML = C.COS.map(c => { const S = M.s[c.sym], v = S.open ? (S.p - S.open) / S.open * 100 : 0; return `<tr data-s="${c.ds || c.sym}" title="Double-click for ${esc(c.name)}"><td>${c.ds || c.sym}</td><td class="r">${S.p.toFixed(2)}</td><td class="r ${v > 0.004 ? 'up' : v < -0.004 ? 'dn' : ''}">${v > 0.004 ? '▲' : v < -0.004 ? '▼' : '■'} ${Math.abs(v).toFixed(1)}%</td></tr>`; }).join('');
      tb.querySelectorAll('tr').forEach(r => { const go = () => Econ.go(`http://www.jackexchange.grot/quote/${r.dataset.s.toLowerCase()}.html`); r.addEventListener('dblclick', go); if (phone()) r.addEventListener('click', go); });
      const n = M.news[M.news.length - 1]; box.querySelector('.ec-tk-mq span').textContent = n ? `*** ${Econ.unteef ? Econ.unteef(n.text) : n.text} ***` : '*** No news is good news ***';
      box.querySelector('.ec-tk-ix').textContent = `JX-8 ${fmt(M.ix)}`;
      const d = new Date(); box.querySelector('.ec-tk-tm').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const offs = [Econ.on('ecMkt', m => { M = JSON.parse(JSON.stringify(m)); draw(); }), Econ.on('ecTick', m => { if (!M) return; for (const s in m.p) if (M.s[s]) M.s[s].p = m.p[s]; M.ix = m.ix; draw(); }), Econ.on('ecNews', m => { if (M) { M.news.push(m.e); draw(); } })];
    Econ.sub('mkt', true); Net.send({ t: 'ecMkt' });
    const close = w.close;
    w.close = function () { if (!w.closed) { offs.forEach(f => f()); Econ.sub('mkt', false); } return close.apply(this, arguments); };
  }

  window.EconDesk = { pet: setPet, ticker };
})();

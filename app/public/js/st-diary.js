/* Jack's hardback diary. Physical pages use Magazines' existing solid-volume reader. */
(function () {
  'use strict';
  const C = window.StoryCat;
  let doc = null, textures = [], copy = null, copyPage = 0, built = false;
  let resume = null, restoring = false;
  let questPage = null, pickerFocus = null, pickerStamp = '';
  function closePicker() {
    if (!questPage?.open) return;
    questPage.close();
    const H = window.House;
    if (H?.live) { H.pauseControls(false); H.resumeLook?.(); }
    if (pickerFocus?.isConnected) pickerFocus.focus({preventScroll:true});
  }
  function picker(redraw = false) {
    redraw = redraw === true;
    if (!window.AccountGate?.allowed || !window.st.getState()) return false;
    if (questPage?.open && !redraw) { closePicker(); return true; }
    const H = window.House;
    if (!redraw && H?.live && !window.PCOnly?.desktopOnly && (H.mode !== 'walk' || H.gliding || H.paused || H.focused)) return false;
    if (!questPage) {
      questPage = document.createElement('dialog'); questPage.className = 'st-quests';
      questPage.setAttribute('aria-labelledby', 'stQuestTitle');
      questPage.innerHTML = '<header><small>MY DIARY / 1999</small><h1 id="stQuestTitle">Things to do</h1><button type="button" data-quest-close aria-label="Close diary">×</button></header><p class="st-quest-note">One thing at a time. Choose what to follow.</p><div class="st-quest-list"></div><footer>J or Esc closes this page. Jobs can be done in any order.</footer>';
      questPage.addEventListener('cancel', e => { e.preventDefault(); closePicker(); });
      questPage.addEventListener('click', e => {
        if (e.target.closest('[data-quest-close]')) closePicker();
        const row = e.target.closest('[data-quest]');
        if (row && window.st.track(row.dataset.quest)) closePicker();
      });
      document.documentElement.appendChild(questPage);
    }
    const list = questPage.querySelector('.st-quest-list'), active = window.st.tracked(), quests = window.st.objectives();
    const stamp = JSON.stringify([active?.key, quests.map(s => [s.key,s.id,s.text])]);
    if (redraw && stamp === pickerStamp) return true;
    pickerStamp = stamp;
    list.replaceChildren(); let group = '';
    for (const s of quests) {
      if (s.group !== group) { const h = document.createElement('h2'); h.textContent = group = s.group; list.appendChild(h); }
      const row = document.createElement('button'); row.type = 'button'; row.dataset.quest = s.key;
      row.setAttribute('aria-pressed', String(s.key === active?.key));
      const mark = document.createElement('span'); mark.className = 'st-quest-check'; mark.textContent = s.key === active?.key ? '●' : '○'; mark.setAttribute('aria-hidden','true');
      const copy = document.createElement('span'), text = document.createElement('strong'), hint = document.createElement('small');
      text.textContent = s.text; hint.textContent = s.hint; copy.append(text, hint); row.append(mark, copy); list.appendChild(row);
    }
    if (!list.children.length) { const p = document.createElement('p'); p.textContent = 'Everything on my list is done. Time for a game!'; list.appendChild(p); }
    if (!redraw) {
      pickerFocus = document.activeElement;
      if (H?.live) H.pauseControls(true);
      questPage.showModal();
    }
    (list.querySelector('[aria-pressed="true"]') || questPage.querySelector('button')).focus({preventScroll:true});
    if (!redraw) questPage.scrollTop = 0;
    return true;
  }
  function handleKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return false;
    const key = e.key.toLowerCase();
    if (questPage?.open && ['arrowup','arrowdown','home','end'].includes(key)) {
      const rows = [...questPage.querySelectorAll('[data-quest]')], at = rows.indexOf(document.activeElement);
      const next = key === 'home' ? 0 : key === 'end' ? rows.length-1 : (at+(key === 'arrowup' ? -1 : 1)+rows.length)%rows.length;
      rows[next]?.focus(); e.preventDefault(); e.stopImmediatePropagation(); return true;
    }
    if (questPage?.open && ['escape','j','q'].includes(key) || key === 'j' && window.House?.mode === 'walk' && !window.House?.paused) {
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) picker(); return true;
    }
    return false;
  }
  try {
    const saved = JSON.parse(localStorage.getItem('jhp_reading_active') || 'null');
    if (saved?.id === 'st.diary' && sessionStorage.getItem('jhp_login_seat') !== '1' && !window.PCOnly?.desktopOnly) resume = saved;
  } catch (e) {}
  const HAND = '"Comic Sans MS", "Z003", "URW Chancery L", cursive';
  const pages = [{ today: true }, ...C.chapters.filter(c => c.steps).flatMap(ch => Array.from({length:Math.ceil(ch.steps.length/4)},(_,i)=>i*4).map(start => ({ ch, steps: ch.steps.slice(start, start + 4), start })))];
  pages.push({ soon: true });
  function wrap(g, text, x, y, width, line) {
    let row = '';
    for (const word of text.split(/\s+/)) {
      const next = row ? row + ' ' + word : word;
      if (row && g.measureText(next).width > width) { g.fillText(row, x, y); y += line; row = word; } else row = next;
    }
    if (row) g.fillText(row, x, y);
    return y + line;
  }
  function doodle(g, x, y, pad) {
    g.save(); g.translate(x, y); g.rotate(.13); g.strokeStyle = '#455c84'; g.lineWidth = 3;
    g.strokeRect(0, 0, pad ? 118 : 76, pad ? 60 : 104);
    g.strokeRect(pad ? 20 : 10, 10, pad ? 40 : 56, pad ? 30 : 43);
    g.beginPath(); g.moveTo(15, pad ? 30 : 78); g.lineTo(39, pad ? 30 : 78); g.moveTo(27, pad ? 18 : 66); g.lineTo(27, pad ? 42 : 90); g.stroke();
    for (const [a, b] of [[pad ? 88 : 53, pad ? 25 : 73], [pad ? 102 : 64, pad ? 38 : 83]]) { g.beginPath(); g.arc(a, b, 4, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  function paint(g, w, h, index, p) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = '#f3ecd7'; g.fillRect(0, 0, w, h);
    const shade = g.createLinearGradient(0, 0, w, 0); shade.addColorStop(0, '#d8cfb3'); shade.addColorStop(.07, '#f5eedb'); shade.addColorStop(1, '#eee5cc'); g.fillStyle = shade; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(100,139,166,.29)'; g.lineWidth = 1;
    for (let y = 188; y < h - 55; y += 42) { g.beginPath(); g.moveTo(26, y); g.lineTo(w - 26, y); g.stroke(); }
    g.strokeStyle = 'rgba(177,77,69,.36)'; g.beginPath(); g.moveTo(72, 20); g.lineTo(72, h - 25); g.stroke();
    g.fillStyle = '#314568'; g.font = 'italic 25px ' + HAND; g.fillText(Cast.t("{me}'s diary / 1999"), 94, 60, w - 125);
    const veteran = p?.flags.veteran;
    g.font = 'italic 44px ' + HAND;
    if (veteran) {
      g.fillText('1999 so far', 94, 130); g.font = 'italic 34px ' + HAND;
      wrap(g, 'Games played. Jobs done. Far too many hours on JackNet. A pretty good year, actually.', 94, 216, w - 140, 42);
      wrap(g, 'My room, my collection, my memories. Nothing to catch up on. Just see what happens next.', 94, 440, w - 140, 42);
      doodle(g, 470, 728, true);
    } else {
      const pg = pages[index];
      if (pg.today) {
        const next = window.st.tracked();
        g.fillText('Note to self...', 94, 130); g.font = 'italic 37px ' + HAND;
        let y = wrap(g, next ? next.text : 'Two chapters down. This year is looking good.', 94, 237, w - 150, 48);
        g.fillStyle = '#586987'; g.font = 'italic 32px ' + HAND;
        wrap(g, next ? next.hint : 'The next pages are coming soon. Meanwhile, there are still games, jobs and mates to catch up with.', 94, y + 50, w - 150, 42);
        g.fillStyle = '#8d4a3f'; g.font = 'italic 28px ' + HAND; g.fillText('J chooses a task. Turn for my list.', 94, 836); doodle(g, 540, 880, true);
      } else if (pg.soon) {
        g.fillText('The next pages...', 94, 130); let y = 230; g.font = 'italic 33px ' + HAND;
        for (const ch of C.chapters.filter(ch => ch.soon)) { y = wrap(g, ch.id + '. ' + ch.title, 94, y, w - 145, 42); g.font = 'italic 27px ' + HAND; g.fillText('Locked — coming soon', 100, y + 12); y += 130; g.font = 'italic 33px ' + HAND; }
        wrap(g, 'Meanwhile: games, mates and a whole house to explore.', 94, 800, w - 150, 42);
      } else {
        g.fillText('Chapter ' + pg.ch.id, 94, 121); g.font = 'italic 36px ' + HAND; g.fillText(pg.ch.title, 94, 167);
        let y = 235;
        for (const s of pg.steps) {
          const done = !!p?.done[s.id];
          g.strokeStyle = '#536280'; g.lineWidth = 2; g.strokeRect(32, y - 23, 25, 25);
          if (done) { g.strokeStyle = '#4a714b'; g.lineWidth = 4; g.beginPath(); g.moveTo(33, y - 10); g.lineTo(41, y); g.lineTo(62, y - 27); g.stroke(); }
          g.fillStyle = done ? '#657568' : '#314568'; g.font = 'italic 33px ' + HAND;
          y = wrap(g, s.text, 94, y, w - 144, 42);
          y += 28;
        }
        g.fillStyle = '#526281'; g.font = 'italic 25px ' + HAND;
        if (y < 840) g.fillText(pg.ch.id === 1 ? 'Mom says: earn it. Fair enough.' : 'A console fund. A VERY serious fund.', 94, 875);
        doodle(g, 570, 880, pg.ch.id === 2);
      }
    }
    g.fillStyle = '#7a7d77'; g.font = 'italic 22px ' + HAND; g.fillText(String(index + 1), w - 60, h - 32); g.restore();
  }
  function refresh() {
    const p = window.st.getState();
    for (let i = 0; i < textures.length; i++) { const tx = textures[i]; paint(tx.userData.g, 768, 1024, i, p); tx.needsUpdate = true; }
    if (copy && !copy.w.closed) { paint(copy.canvas.getContext('2d'), 768, 1024, copyPage, p); copy.label.textContent = (copyPage + 1) + ' / ' + (p?.flags.veteran ? 1 : pages.length); }
    window.House?.dirty?.();
  }
  function build() {
    const H = window.House, R = window.Room, p = window.st.getState();
    if (built || !p || p.flags.veteran || window.PCOnly?.desktopOnly || !H?.live || !H.ROOMS.bedroom?.built || !window.Magazines) return;
    built = true;
    const T = R.T, K = R.K, M = K.mat, obj = new T.Group(), B = K.into(obj);
    obj.name = 'st-hardback-diary';
    const cover = K.tex('st.cover', 384, 512, (g, w, h) => {
      g.fillStyle = '#273c59'; g.fillRect(0, 0, w, h); K.speckle?.(g, w, h, 2000, ['#2d4260', '#233650'], 1, 91);
      g.strokeStyle = '#5d718a'; g.lineWidth = 3; g.strokeRect(14, 14, w - 28, h - 28);
      g.fillStyle = '#e6ddbe'; g.fillRect(50, 92, 260, 190); g.strokeStyle = '#73839b'; g.strokeRect(57, 99, 246, 176);
      g.fillStyle = '#314568'; g.textAlign = 'center'; g.font = 'italic 42px ' + HAND; g.fillText(Cast.t("{me}'s"), 180, 152, 230); g.fillText('diary', 180, 206); g.font = 'italic 26px ' + HAND; g.fillText('1999 / PRIVATE!', 180, 253); g.textAlign = 'left'; doodle(g, 116, 332, false);
    }, { clamp: true });
    const ink = M({ c: '#fff', map: cover, sh: 2 }), cloth = M('#273c59'), paper = M('#dcd3b9'), band = M('#a29d6f');
    B.box(0, -1.22, 0, 13.6, 1.6, 19.5, paper);
    B.box(0, -.2, 0, 14.4, .4, 20.3, cloth);
    B.box(0, -2.25, 0, 14.4, .46, 20.3, { t: ink, all: cloth });
    B.rbox(-6.95, -1.25, 0, .8, 2.4, 20.3, .16, cloth);
    for (let i = 0; i < 5; i++) B.box(6.82, -.62 - i * .28, 0, .05, .035, 19.2, M('#b9b19b'));
    // The elastic wraps over both covers and both ends, as a solid band.
    for (const y of [-2.54, .06]) B.box(5.1, y, 0, .55, .12, 20.4, band);
    for (const z of [-10.2, 10.2]) B.box(5.1, -1.24, z, .55, 2.55, .12, band);
    B.box(-2, -.42, 10.6, 1.1, .08, 1.8, M('#983e3b'));
    B.shadow(0, 0, 0, 17, 23, .45, { sq: true });
    textures = pages.map((_, i) => K.tex('st.page.' + i, 768, 1024, (g, w, h) => paint(g, w, h, i, p), { clamp: true }));
    // A little paper bounce keeps blue pen legible when the reader faces away
    // from the window, while the solid covers and cut edges retain room light.
    doc = { id: 'st.diary', title: Cast.t("{me}'s diary"), color: '#273c59', frontMesh: { material: ink }, pages: textures.map(tx => ({ mesh: { material: M({ c: '#fff', map: tx, e: '#545454', em: tx, sh: 1, sp: '#000' }) } })) };
    window.ReadingBooks.push(doc);
    R.grabbable('st.diary', { obj, home: { room: 'bedroom', x: -61, y: 0, z: -12, ry: -8 }, kind: 'story.diary', label: Cast.t("{me}'s diary"), holdD: 38, useLabel: 'Read my diary' });
    Magazines.sync();
    H.THINGS['st.diary'].use = () => { H.saveWalkState(); refresh(); return Magazines.read('st.diary', 'st.diary', { view: 'pages', page: 0 }); };
    H.dirty();
  }
  function openCopy() {
    const p = window.st.getState(); if (!p) return;
    const A = window.Apps, el = document.createElement('div'); el.className = 'st-copy';
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 1024;
    const paper = document.createElement('div'); paper.className = 'st-copy-paper'; paper.appendChild(canvas);
    const nav = document.createElement('nav'), prev = document.createElement('button'), next = document.createElement('button'), label = document.createElement('span');
    prev.type = next.type = 'button'; prev.textContent = '← Previous'; next.textContent = 'Next →'; nav.append(prev, label, next); el.append(paper, nav);
    const choose = document.createElement('button'); choose.type = 'button'; choose.textContent = 'Things to do'; choose.addEventListener('click', picker); el.appendChild(choose);
    copyPage = 0; const w = A.win(Cast.t("{me}'s diary"), el, { w: 480, h: 640, icon: A.ICON.txt }); copy = { w, canvas, label };
    function turn(d) { copyPage = Math.max(0, Math.min(p.flags.veteran ? 0 : pages.length - 1, copyPage + d)); prev.disabled = copyPage === 0; next.disabled = copyPage === (p.flags.veteran ? 0 : pages.length - 1); refresh(); }
    prev.addEventListener('click', () => turn(-1)); next.addEventListener('click', () => turn(1)); turn(0);
    window.st.event('plan'); return w;
  }
  // The shared reader waits for walking mode. Its saved standing restoration can
  // expire while a background console/PC boots. Resume this diary's own saved
  // reading intent once the account and scene are ready, using the house APIs.
  // Explicit logon and mobile deliberately have no physical reading intent.
  const resumeAt = Date.now();
  const resumeTimer = setInterval(() => {
    if (!resume || Date.now() - resumeAt > 120000) { clearInterval(resumeTimer); return; }
    const H = window.House, pose = window.JHPStood?.p;
    if (!built || !window.AccountGate?.allowed || !H?.live || H.gliding || H.paused || restoring || document.querySelector('.hs-loading,#houseEntry')) return;
    if (Magazines.reading?.id === 'st.diary') { resume = null; return; }
    if (H.mode === 'walk' || H.mode === 'focus' && H.seated) { if (Magazines.read('st.diary', 'st.diary', resume)) resume = null; return; }
    if (H.mode !== 'monitor' || !H.canStand() || !pose || !['x','y','z','rx','ry'].every(k => Number.isFinite(pose[k]))) return;
    restoring = true;
    Room.ensureHouse().then(() => {
      if (!resume || !AccountGate.allowed) { restoring = false; return; }
      const stood = () => {
        H.off('stood', stood);
        if (!resume || !AccountGate.allowed) { restoring = false; return; }
        for (const [id, open] of Object.entries(pose.d || {})) if (H.DOORS[id] && !H.DOORS[id].always && typeof open === 'boolean') H.setDoor(id, open, true);
        Object.assign(H.P, pose); H.setWalkFrom(pose); H.saveWalkState(); H.resumeSeat(); H.dirty();
        if (!H.gliding && Magazines.read('st.diary', 'st.diary', resume)) resume = null;
        restoring = false;
      };
      H.on('stood', stood);
      if (!H.standUp(true)) { H.off('stood', stood); restoring = false; }
    }, () => { restoring = false; });
  }, 350);
  window.stDiary = { build, refresh, picker, handleKey, updatePicker() { if (questPage?.open) picker(true); }, get picking() { return !!questPage?.open; } };
  window.st.onChange(p => { if (!p) { resume = null; closePicker(); copy?.w.close(); copy = null; } else if (questPage?.open) picker(true); build(); refresh(); });
  Apps.register('st.diary', { single: true, cmd: ['diary', 'journal'], open: openCopy });
  Apps.addProgram(['Accessories', 'My diary'], 'st.diary', Apps.ICON.txt);
})();

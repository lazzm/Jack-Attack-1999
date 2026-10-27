/* Story observes public gameplay APIs; account-owned opening gates only the bedroom PC. */
(function () {
  'use strict';
  const C = window.StoryCat, N = window.Net;
  if (!C || !N) return;
  let state = window.StorySnapshot ? { ...window.StorySnapshot } : null, line = null, hooked = false, mediaHooked = false, celebration = null;
  let tickUntil = 0, lastSync = 0;
  const sent = new Map(), listeners = new Set(), dialogueQueue = [];
  const preparing = new Set();
  const story = () => !!state && !state.flags.veteran;
  function event(id) {
    if (!story() || state.done[id] || state.flags[id] === true || !C.byId[id] || C.byId[id].ch > state.ch) return;
    if (!C.ready(state, C.byId[id])) return;
    const now = Date.now();
    if (now - (sent.get(id) || 0) < 2500) return;
    if (N.send({ t: 'stEvent', id })) sent.set(id, now);
  }
  function visible() {
    const H = window.House;
    return !!state && N.connected && H?.live && H.mode === 'walk' && !H.gliding && !H.paused && !H.focused && !window.PCOnly?.desktopOnly && !document.querySelector('.hs-loading,#houseEntry');
  }
  const trackKey = () => 'jhp_story_track_' + String(N.me.no || N.me.nick || '').toLowerCase();
  function objectives() {
    if (!state) return [];
    const main = C.current(state), CK = window.ChoreKit, CC = window.ChoreCat;
    const out = main ? [{ ...main, key: 'story', group: 'My story' }] : [];
    // This week's seasonal objectives (js/season.js): time-limited, so they come before the everyday jobs.
    for (const x of window.Season?.objectives?.() || []) if (!x.done) out.push({ id: x.o.id, key: 'season.' + x.o.id, group: x.e.name, text: x.text + (x.of > 1 ? ' (' + x.n + '/' + x.of + ')' : ''), hint: x.hint, test: 'season.' + x.o.id, season: x });

    if (CK && CC) {
      const jobs = new Set([...CK.list(), ...Object.keys(CK.S.prog), ...(!state.flags.veteran && state.ch === 1 ? ['tidy','bed','bin'] : [])]);
      for (const id of jobs) {
        const c = CC.CHORE[id];
        if (!c || CK.done(id) || main?.test === 'chore.' + id) continue;
        out.push({ id, key: 'chore.' + id, group: "Mom's jobs", text: c.n, hint: c.blurb, test: 'chore.' + id, room: c.room });
      }
    }
    return out;
  }
  function tracked() {
    const all = objectives(); let key;
    try { key = localStorage.getItem(trackKey()); } catch (e) {}
    return all.find(s => s.key === key) || all[0] || null;
  }
  function track(key) {
    if (!objectives().some(s => s.key === key)) return false;
    try { localStorage.setItem(trackKey(), key); } catch (e) {}
    celebration = null; tickUntil = 0; prepareTracked(); updateLine(); return true;
  }
  function prepareTracked() {
    const H = window.House, s = tracked(), chore = s?.test?.startsWith('chore.') ? s.test.slice(6) : null;
    if (!H?.live || window.PCOnly?.desktopOnly || !chore || !window.Chores) return;
    const held = H.THINGS[H.held()], rooms = [window.ChoreCat?.CHORE[chore]?.room, window.ChoreKit?.MODS[chore]?.room];
    if (chore === 'bin' && held?.id === 'ch.binbag' || chore === 'tidy' && held?.kind === 'mess.dish') rooms.push('kitchen');
    for (const room of rooms) {
      if (!room || preparing.has(room)) continue;
      preparing.add(room);
      window.Room.ensureHouse().then(() => { H.buildRoom(H.ROOMS[room]); return Chores.part(room); }).catch(e => { preparing.delete(room); console.error('Diary task room', e); });
    }
  }
  function updateLine() {
    if (!line) return;
    const s = tracked(), tick = celebration && Date.now() < tickUntil;
    line.hidden = !visible() || window.StoryGuide?.strength === 'off' || (!s && !tick);
    line.classList.toggle('st-tick', !!tick);
    const text = tick ? '✓ ' + C.byId[celebration].text : s ? '› ' + s.text + '  [J]' : '';
    if (line.textContent !== text) line.textContent = text;
    line.title = s ? s.hint + ' — J: choose an objective.' : '';
  }
  function check() {
    // On a warm refresh hello can finish before this script has loaded. Ask for
    // the snapshot explicitly instead of relying on having heard that packet.
    if (!state && N.connected && N.me.member && Date.now() - lastSync > 2500) { lastSync = Date.now(); N.send({ t: 'stEvent', id: 'sync' }); }
    const H = window.House;
    if (state && H?.ok && H.live && !hooked) hook(H);
    prepareTracked();
    window.stDiary?.updatePicker?.();
    if (!story()) { updateLine(); return; }
    // PMGL finishes moving a freshly unboxed console out of its factory dock
    // on the same turn. Observe the resulting parcel pose, not that staging pose.
    if (window.PM && !mediaHooked) { PM.on('change', () => setTimeout(observe, 100)); mediaHooked = true; }
    observe();
    if (N.connected && Date.now() - lastSync > 9000) { lastSync = Date.now(); N.send({ t: 'stEvent', id: 'sync' }); }
    if (dialogueQueue.length && visible() && !document.querySelector('.hs-note.on,.hs-voice.on,.hs-call.on')) {
      const d = dialogueQueue.shift(); window.st.say(...d);
    }
    if (celebration && visible() && !tickUntil && !document.querySelector('.hs-note.on,.hs-voice.on,.hs-call.on')) {
      tickUntil = Date.now() + 2200;
      window.Sound?.play('join');
      window.st.say('st.done.' + celebration, 'My diary', C.byId[celebration].text + ' Done.');
    }
    if (tickUntil && Date.now() > tickUntil) { celebration = null; tickUntil = 0; }
    updateLine();
  }
  function consoleOrders() { return (window.PM?.orders() || []).filter(o => /^hardware\./.test(o.id)); }
  function observe() {
    if (!story()) return;
    const H = window.House, v = window.RoomTV?._dbg();
    if (H?.live) {
      if (H.here === 'drive') event('dad');
      if (H.mode === 'monitor' && !H.gliding && window.DesktopSurface?.ready() && (!state.done.power || state.done.install)) event('pc');
      if (v?.st === 'game' && !v.background) {
        if (v.con === 'gb') event('lad');
        else if (consoleOrders().some(o => o.id === 'hardware.' + v.con)) event('play');
      }
      for (const o of consoleOrders()) {
        const con = o.id.slice(9), t = H.THINGS[con];
        if (window.PM?.owns(o.id)) event('unbox');
        if (t && H.here === 'bedroom' && H.held() === con) event('carry');
        if (t?.st === 'snap' && t.at.room === 'bedroom' && t.snap === 'hardware.dock.' + con) { event('carry'); event('connect'); }
      }
    }

  }
  function hook(H) {
    hooked = true;
    line = document.createElement('button'); line.type = 'button'; line.className = 'st-objective'; line.hidden = true;
    line.addEventListener('click', () => window.stDiary?.picker());
    H.ui.el.appendChild(line);
    for (const e of ['mode', 'room', 'grab', 'place', 'snap', 'sat']) H.on(e, observe);
    window.Room.on('play', observe);
    window.stDiary?.build();
  }
  N.on('stState', m => {
    const previous = state;
    state = { ch: m.ch, done: m.done || {}, flags: m.flags || {}, trust: m.trust || 0, v: m.v };
    if (previous && !previous.flags.veteran && !state.flags.veteran) {
      const fresh = C.steps.filter(s => !previous.done[s.id] && state.done[s.id]);
      if (fresh.length) { celebration = fresh[fresh.length - 1].id; tickUntil = 0; }
    }
    const current = C.current(state);
    if (previous && previous.ch === 1 && state.ch === 2) window.StoryGuide?.chapter(2, 'Saving up');
    if (current && previous && C.current(previous)?.id !== current.id) {
      const dialogue = {
        tidy: ['Mom', 'First things first: clothes in the basket, rubbish in the bin. And bring your dishes down!'],
        bed: ['Mom', 'Much better. Now straighten that bed, please.'],
        bin: ['Mom', 'One last job: bring the bin bag down to the kitchen.'],
        dad: ['Dad', "The office is chucking out the old computers. Mine is in the boot if you want it. Mind the monitor: it weighs a ton!"],
        'part.monitor': ['Dad', 'Both hands on that monitor. No running on the stairs.'],
        'lead.power': ['Dad', 'Everything on the desk? Plug the leads into the matching sockets, then try the big button.'],
        pc: ['Dad', 'There you go. Your own computer. Try not to fill it with games.']
      }[current.id];
      if (dialogue) dialogueQueue.push(['st.opening.' + current.id, ...dialogue]);
    }
    for (const fn of listeners) fn(state);
    check();
  });
  function reset() { dialogueQueue.length=0; state = null; celebration = null; tickUntil = 0; sent.clear(); updateLine(); for (const fn of listeners) fn(null); }
  N.on('you', m => { if (!m.member) reset(); });
  N.on('welcome', m => { if (!m.member) reset(); });
  N.on('_close', () => { if (line) line.hidden = true; });
  for (const t of ['chDone', 'chMe', 'pmxOrdered', 'pmxMe', 'ecMe', 'smsContactResult', 'smsSent']) N.on(t, () => {
    if (story()) { N.send({ t: 'stEvent', id: 'sync' }); observe(); }
  });
  document.addEventListener('section', () => setTimeout(observe, 0));
  Object.assign(window.st, { event, observe, objectives, tracked, track, getState: () => state, onChange(fn) { listeners.add(fn); }, current: () => C.current(state) });
  setInterval(check, 650);
})();

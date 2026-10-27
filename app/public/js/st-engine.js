/* Story observes public gameplay APIs; account-owned opening gates only the bedroom PC. */
(function () {
  'use strict';
  const C = window.StoryCat, N = window.Net;
  if (!C || !N) return;
  let state = window.StorySnapshot ? { ...window.StorySnapshot } : null, line = null, hooked = false, mediaHooked = false, celebration = null;
  let tickUntil = 0, lastSync = 0;
  const sent = new Map(), listeners = new Set(), dialogueQueue = [];
  const story = () => !!state && !state.flags.veteran;
  function event(id) {
    if (!story() || state.done[id] || state.flags[id] === true || !C.byId[id] || C.byId[id].ch > state.ch) return;
    if (['pc', 'plan'].includes(id) && C.current(state)?.id !== id) return;
    const now = Date.now();
    if (now - (sent.get(id) || 0) < 2500) return;
    if (N.send({ t: 'stEvent', id })) sent.set(id, now);
  }
  function visible() {
    const H = window.House;
    return story() && N.connected && H?.live && H.mode === 'walk' && !H.gliding && !H.paused && !H.focused && !window.PCOnly?.desktopOnly && !document.querySelector('.hs-loading,#houseEntry');
  }
  function updateLine() {
    if (!line) return;
    const s = C.current(state), tick = celebration && Date.now() < tickUntil;
    line.hidden = !visible() || window.StoryGuide?.strength === 'off' || !!(celebration && !tickUntil) || (!s && !tick);
    line.classList.toggle('st-tick', !!tick);
    const text = tick ? '✓ Objective complete — ' + C.byId[celebration].text : s ? '› ' + s.text : '';
    if (line.textContent !== text) line.textContent = text;
    line.title = s ? s.hint + ' — F reads my diary on the desk.' : '';
  }
  function check() {
    // On a warm refresh hello can finish before this script has loaded. Ask for
    // the snapshot explicitly instead of relying on having heard that packet.
    if (!state && N.connected && N.me.member && Date.now() - lastSync > 2500) { lastSync = Date.now(); N.send({ t: 'stEvent', id: 'sync' }); }
    if (!story()) { updateLine(); return; }
    const H = window.House;
    if (H?.ok && H.live && !hooked) hook(H);
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
    line = document.createElement('div'); line.className = 'st-objective'; line.hidden = true;
    line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite');
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
        meetmom: ['Mom', 'Morning, love. Room first, then you can do what you like. Clothes in the basket, rubbish in the bin, plates down to the kitchen.'],
        tidy: ['Mom', 'First things first: clothes in the basket, rubbish in the bin. And bring your dishes down!'],
        bed: ['Mom', 'Much better. Now straighten that bed, please.'],
        bin: ['Mom', 'One last job: bring the bin bag down to the kitchen.'],
        dad: ['Dad', "The office is chucking out the old computers. Mine is in the boot if you want it. Mind the monitor: it weighs a ton!"],
        'part.monitor': ['Dad', 'Both hands on that monitor. No running on the stairs.'],
        'lead.power': ['Dad', 'Everything on the desk? Plug the leads into the matching sockets, then try the big button.'],
        pc: ['Dad', 'There you go. Your own computer. Try not to fill it with games.']
      }[current.id];
      // The family say it in person when they're in the house (js/np-life.js); otherwise the line is a subtitle.
      // Without the 3D family (phones), Mom's first chat completes itself so nobody waits for her.
      const inPerson = !!window.HouseFamily?.storyLine?.(current.id);
      if (dialogue && !inPerson) dialogueQueue.push(['st.opening.' + current.id, ...dialogue]);
      if (current.id === 'meetmom' && !window.HouseFamily?.enabled) setTimeout(() => event('meetmom'), 4500);
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
  Object.assign(window.st, { event, observe, getState: () => state, onChange(fn) { listeners.add(fn); }, current: () => C.current(state) });
  setInterval(check, 650);
})();

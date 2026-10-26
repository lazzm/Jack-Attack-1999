/* season: the shared 1999 event engine (docs/EVENTS-1999.md section 1). The catalogue is js/season-cat.js; the server
 * (mods/season.js) holds every event's progress and pays the rewards. This file works out what day it is in 1999
 * (the owner's 1999 clock when Jack has one set), which events are on and in which phase, keeps the server's view of
 * each event, loads an event's house pack (js/season-halloween.js) only while that event is on, shows the seasonal
 * objective line in the house when no chapter objective is waiting, feeds the quest guidance (js/st-guide.js) and
 * the diary's "This week" page (js/st-diary.js). Nothing here runs per frame; an event that is off costs nothing.
 *   Season.today() -> { mm, dd, md, dow, hour }      Season.active() -> [{ e, phase }]   Season.st(id) -> server view
 *   Season.objectives() -> [{ e, o, text, hint, done, n, of }]   Season.current()   Season.targets()   Season.week()
 *   Season.step(e, o, s, x)  Season.send(m)  Season.on('change'|'state'|'done', fn)  Season.pack(id, api)  Season.sun(date) */
(function () {
  'use strict';
  const C = window.SeasonCat; if (!C || window.Season) return;
  const N = window.Net, EVS = {}, packs = {}, loading = {};
  // One calendar: the PC's seasons (js/seasons.js SEASONS: [key, from, to, peak, prio]) set each event's window and
  // peak in the browser; the server's copy in season-cat.js is kept identical by tests/season-cat-unit.cjs.
  try {
    const mmdd = n => String(Math.floor(n / 100)).padStart(2, '0') + '-' + String(n % 100).padStart(2, '0');
    for (const e of C.EVENTS) { const w = window.Seasons?.SEASONS?.find(s => s[0] === e.web); if (w) { e.from = mmdd(w[1]); e.to = mmdd(w[2]); if (w[3]) e.peak = mmdd(w[3]); e.phases[0].from = e.from; } }
  } catch (e) {}
  const emit = (ev, ...a) => (EVS[ev] || []).slice().forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  let srv = null, lastKey = '', line = null, tickUntil = 0, tickText = '';

  function today() {
    const oc = window.OwnerTools?.clock;
    if (oc && /^1999-\d\d-\d\d$/.test(oc.date)) { const mm = +oc.date.slice(5, 7), dd = +oc.date.slice(8, 10); return { mm, dd, md: mm * 100 + dd, dow: C.DOW(mm, dd), hour: oc.hour | 0, owner: true }; }
    let mm, dd; try { const t = Desk.today99(); mm = t.m; dd = t.d; } catch (e) { const d = new Date(); mm = d.getMonth() + 1; dd = d.getDate(); }
    if (mm === 2 && dd === 29) dd = 28;
    return { mm, dd, md: mm * 100 + dd, dow: C.DOW(mm, dd), hour: new Date().getHours(), owner: false };
  }
  const active = () => C.active(today()).filter(x => !x.e.soon);
  const st = id => srv?.ev?.[id] || null;
  const storyOpen = e => { const p = window.st?.getState?.(); return !p || p.flags?.veteran || (p.ch | 0) >= (e.needs?.chapter || 1); };
  function objectives() {
    const out = [];
    for (const { e, phase } of active()) {
      const s = st(e.id); if (!s || !s.open || !storyOpen(e)) continue;
      for (const o of e.objectives) {
        if (!o.phases.includes(phase)) continue;
        const done = !!s.obj?.[o.id], got = s.steps?.[o.id] || {};
        const n = o.count ? Math.min(o.count, s.treat?.happy | 0) : o.steps ? o.steps.filter(x => got[x]).length : 0, of = o.count || (o.steps ? o.steps.length : 1);
        out.push({ e, o, phase, text: cast(o.text), hint: cast(o.hint), done, by: s.obj?.[o.id]?.by, n, of });
      }
    }
    return out;
  }
  function current() { return objectives().find(x => !x.done) || null; }
  function targets(x) { const c = x || current(); if (!c) return []; const p = packs[c.e.id]; try { return p?.targets ? p.targets(c) : []; } catch (e) { return []; } }
  function describe(id) { for (const k in packs) { try { const d = packs[k].describe?.(id); if (d) return d; } catch (e) {} } return null; }
  // the diary's "This week" page: what's on, what's done, and what's coming up next
  function week() {
    const t = today(), rows = [], list = objectives();
    for (const { e, phase } of active()) rows.push({ head: e.name + ({ lead: ': getting ready', day: ' today!', tail: ': the morning after' }[phase] || '') });
    for (const x of list) rows.push({ text: x.text + (x.of > 1 && !x.done ? ' (' + x.n + '/' + x.of + ')' : ''), done: x.done, by: x.by });
    const soon = C.EVENTS.filter(e => { const a = C.md(e.from), d = t.md; return a > d && a - d <= 14 || e.soon && C.md(e.peak) >= d && C.md(e.peak) - d <= 7; });
    for (const e of soon) if (!active().some(x => x.e === e)) { const [m, d] = e.peak.split('-').map(Number); rows.push({ note: 'Coming up: ' + e.name + ', ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][C.DOW(m, d)] + ' ' + d + ' ' + ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m - 1] + '.' }); }
    if (t.mm === 10 && t.dd >= 28 && t.dd <= 31) rows.push({ note: t.dd === 31 ? 'The clocks went back last night. An extra hour in bed!' : 'The clocks go back on Saturday night (2am Sunday). An extra hour in bed!' });
    return rows;
  }

  // ---- packs: one file per event, loaded only while that event is on and the house is up
  function pack(id, api) { packs[id] = api; evaluate(true); }
  function loadPack(e) {
    if (!e.pack || packs[e.id] || loading[e.id] || window.PCOnly?.desktopOnly || !window.House?.ok) return;
    const src = e.pack;
    loading[e.id] = (window.Apps?.load ? Apps.load(src) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }))
      .catch(err => { console.warn('season pack', e.id, err?.message); delete loading[e.id]; });
  }
  function evaluate(force) {
    const t = today(), on = active(), key = t.md + '|' + t.hour + '|' + on.map(x => x.e.id + ':' + x.phase).join(',');
    if (!force && key === lastKey) return;
    const changed = key !== lastKey; lastKey = key;
    for (const { e } of on) loadPack(e);
    for (const id in packs) { const x = on.find(a => a.e.id === id); try { if (x) packs[id].on(x.phase, t); else packs[id].off(); } catch (err) { console.error('season pack', id, err); } }
    if (changed) emit('change', t, on);
    updateLine();
  }
  function step(e, o, s, x) { return send({ t: 'seStep', e, o, s, x }); }
  function send(m) { return !!(N && N.send(m)); }

  // ---- the objective line (the chapter objective always wins; this shows when there is none)
  function visible() {
    const H = window.House;
    return !!(H?.ok && H.live && H.mode === 'walk' && !H.gliding && !H.paused && !H.focused && !window.PCOnly?.desktopOnly && !document.querySelector('.hs-loading,#houseEntry') && window.AccountGate?.allowed !== false);
  }
  function updateLine() {
    const H = window.House; if (!H?.ok || !H.ui?.el) return;
    if (!line) { line = document.createElement('div'); line.className = 'st-objective se-objective'; line.hidden = true; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite'); H.ui.el.appendChild(line); }
    // The diary's quest list (js/st-engine.js) lists these objectives and draws the tracked one; this line is only the
    // fallback before the story state has arrived.
    const chapter = window.st?.tracked ? window.st.tracked() || window.st.getState?.() : window.st?.current?.(), c = current(), tick = Date.now() < tickUntil && !chapter;

    line.hidden = !visible() || !!chapter || window.StoryGuide?.strength === 'off' || (!c && !tick) || !!document.querySelector('.st-objective.st-tick:not(.se-objective)');
    line.classList.toggle('st-tick', tick);
    const text = tick ? '✓ Objective complete — ' + tickText : c ? c.e.name.toUpperCase() + ' › ' + c.text + (c.of > 1 ? ' (' + c.n + '/' + c.of + ')' : '') : '';
    if (line.textContent !== text) line.textContent = text;
    line.title = c ? c.hint : '';
  }
  function celebrate(e, o) {
    const ob = C.byId[e]?.objById[o]; if (!ob) return;
    tickText = cast(ob.text); tickUntil = Date.now() + 2600;
    try { window.Sound?.play('join'); } catch (err) {}
    window.st?.say?.('se.done.' + o, 'My diary', tickText + ' Done.');
    emit('done', e, o); updateLine();
  }
  if (N) {
    N.on('seMe', m => {
      if (m.guest) { srv = null; return; }
      const prev = srv; srv = m;
      if (prev) for (const id in m.ev) for (const o in m.ev[id].obj || {}) if (!prev.ev?.[id]?.obj?.[o] && m.ev[id].obj[o].by !== 'mom') celebrate(id, o);
      emit('state', srv); evaluate(true); window.stDiary?.refresh?.();
    });
    const ask = () => send({ t: 'seMe' });
    for (const t of ['welcome', 'loginOk', 'you']) N.on(t, ask);
    try { if (N.me?.id) ask(); } catch (e) {}
  }
  addEventListener('ownerclock', () => { evaluate(true); send({ t: 'seMe' }); try { window.House?.relight?.(); } catch (e) {} });
  setInterval(() => { evaluate(false); updateLine(); }, 1000);
  // the house appears after this file: catch its first frames
  let hooked = false;
  setInterval(() => { const H = window.House; if (!hooked && H?.ok && H.live) { hooked = true; for (const ev of ['mode', 'room', 'built']) H.on(ev, () => { evaluate(true); }); evaluate(true); } }, 700);

  // the in-house sun (rm-room.js paints the sky with it): clock-time sunrise and sunset with 1999's BST rule
  function sun(d) { d = d || window.OwnerTools?.now?.() || new Date(); const mm = d.getMonth() + 1, dd = d.getDate(); return C.sun(mm, mm === 2 && dd === 29 ? 28 : dd); }

  window.Season = {
    today, active, st, objectives, current, targets, describe, week, step, send, pack, sun, evaluate, cast,
    get server() { return srv; }, get packs() { return packs; },
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, off(ev, fn) { const a = EVS[ev] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }, emit,
  };
})();

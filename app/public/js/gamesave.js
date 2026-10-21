/* gamesave: saved games. Every single-player game and stateful program keeps its exact state here, so a refresh, a
 * closed window or a Shut Down never loses a game in progress (like a saved game on the hard disk).
 *   Apps.saveGame(key, state, {v, max}) -> true/false   write now (JSON-able state; v = the game's own save format number)
 *   Apps.loadGame(key, v) -> state | null                (null when there is none, it is broken, or it is an old format)
 *   Apps.clearGame(key)                                  (New Game / Deal / a win)
 *   Apps.gameSaver(key, getState, {v, delay, max, live, every}) -> saver
 *     saver.load()   the saved state or null
 *     saver.save()   something changed: save soon (debounced)
 *     saver.now()    save straight away (getState() returning null clears the save, undefined skips)
 *     saver.clear()  forget the save
 *     saver.watch(w) save when the program's window closes, then stop
 *     saver.stop()   stop saving (no flush)
 *   live: true saves on every flush even when nothing called save() (real-time games); every: ms saves on a timer.
 * Everything still open is flushed on pagehide / beforeunload / the tab going hidden.
 * Storage: localStorage. Small saves (up to 20 KB each, 200 KB in all) go in jhp_gs_<key> and roam with a member's
 * profile (js/roam.js); bigger ones (a Paint picture, a whole city) go in jhp_gsl_<key>, which stays on this computer. */
(function () {
  const FMT = 1, PR = 'jhp_gs_', PL = 'jhp_gsl_';
  const ROAM_MAX = 20000, ROAM_TOTAL = 200000, MAX = 400000, LOCAL_TOTAL = 2500000;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    keys(pre) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) out.push(k); } } catch (e) {} return out; },
  };
  const clean = key => String(key || '').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  const parse = s => { if (!s) return null; try { const o = JSON.parse(s); return o && o.f === FMT && 's' in o ? o : null; } catch (e) { return null; } };
  const sizeOf = pre => ls.keys(pre).reduce((n, k) => n + k.length + (ls.get(k) || '').length, 0);
  // make room among the big local saves: throw away the oldest until `need` more characters fit
  function evict(need, keep) {
    const all = ls.keys(PL).filter(k => k !== keep).map(k => { const v = ls.get(k) || ''; const o = parse(v); return { k, n: k.length + v.length, t: o ? o.t : 0 }; }).sort((a, b) => a.t - b.t);
    let total = all.reduce((n, x) => n + x.n, 0);
    while (all.length && total + need > LOCAL_TOTAL) { const x = all.shift(); ls.del(x.k); total -= x.n; }
  }
  function saveGame(key, state, o) {
    o = o || {}; const k = clean(key); if (!k) return false;
    let json; try { json = JSON.stringify({ f: FMT, v: o.v == null ? 0 : o.v, t: Date.now(), s: state }); } catch (e) { return false; }
    if (!json || json.length > Math.min(o.max || MAX, 1500000)) return false; // too big to keep: the last good save stays
    const r = PR + k, l = PL + k;
    if (json.length <= ROAM_MAX && sizeOf(PR) - (ls.get(r) || '').length - r.length + json.length + r.length <= ROAM_TOTAL) {
      if (ls.set(r, json)) { ls.del(l); return true; }
    }
    evict(json.length + l.length, l);
    if (!ls.set(l, json)) { evict(LOCAL_TOTAL, l); if (!ls.set(l, json)) return false; }
    ls.del(r); return true;
  }
  function entry(key) {
    const k = clean(key), a = parse(ls.get(PR + k)), b = parse(ls.get(PL + k));
    return a && b ? (a.t >= b.t ? a : b) : a || b;
  }
  function loadGame(key, v) {
    const e = entry(key);
    if (!e || (e.v || 0) !== (v == null ? 0 : v)) return null;
    return e.s == null ? null : e.s;
  }
  function clearGame(key) { const k = clean(key); ls.del(PR + k); ls.del(PL + k); }
  const hasGame = (key, v) => loadGame(key, v) != null;

  const LIVE = new Set();
  function gameSaver(key, get, o) {
    o = o || {};
    let timer = 0, tick = 0, dirty = false, stopped = false;
    const s = {
      key,
      load: () => loadGame(key, o.v),
      save() { if (stopped) return; dirty = true; clearTimeout(timer); timer = setTimeout(s.now, o.delay == null ? 700 : o.delay); },
      now() {
        clearTimeout(timer); timer = 0; if (stopped) return;
        dirty = false;
        let st; try { st = get(); } catch (e) { return; }
        if (st === undefined) return;
        if (st === null) clearGame(key); else saveGame(key, st, o);
      },
      clear() { clearTimeout(timer); timer = 0; dirty = false; clearGame(key); },
      stop() { stopped = true; clearTimeout(timer); clearInterval(tick); LIVE.delete(s); },
      flush() { if (!stopped && (dirty || o.live)) s.now(); },
      watch(w) {
        if (!w || w.__gsw) return s; w.__gsw = true;
        const close = w.close;
        w.close = function () { if (!w.closed) { s.flush(); s.stop(); } return close.apply(this, arguments); };
        return s;
      },
      get dirty() { return dirty; },
    };
    LIVE.add(s);
    if (o.every) tick = setInterval(() => s.flush(), Math.max(1000, o.every));
    return s;
  }
  function flushAll() { LIVE.forEach(s => { try { s.flush(); } catch (e) {} }); }
  addEventListener('pagehide', flushAll);
  addEventListener('beforeunload', flushAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushAll(); });

  // what is saved (for testing, and for anyone poking about in the console)
  function list() {
    return [...ls.keys(PR), ...ls.keys(PL)].map(k => { const v = ls.get(k) || '', e = parse(v); return { key: k.replace(/^jhp_gsl?_/, ''), roams: k.startsWith(PR), kb: Math.ceil(v.length / 1024), t: e ? e.t : 0 }; });
  }
  const api = { saveGame, loadGame, clearGame, hasGame, gameSaver, flushGames: flushAll, gameSaves: list };
  window.GameSave = api;
  if (window.Apps) Object.assign(window.Apps, api);
})();

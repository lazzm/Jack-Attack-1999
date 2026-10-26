/* JackNet: one WebSocket shared by every toy on the page. Reconnects like a 56K modem. */
(function () {
  const handlers = {};
  let ws = null, offline = false, retry = 1000, me = { id: 0, nick: '' };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  let cid = store.get('jhp_cid');
  if (!cid) {
    cid = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
    store.set('jhp_cid', cid);
  }

  function emit(t, m) { (handlers[t] || []).forEach(fn => { try { fn(m); } catch (e) { console.error(e); } }); }

  function connect() {
    if(window.PCOnly?.blocked)return;
    if (ws && ws.readyState <= 1) return; // already connecting/connected (a wake-up and a retry timer can both fire)
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(proto + '//' + location.host + '/ws');
    ws.onopen = () => {
      retry = 1000;
      // prev: the id this tab had last time (also across a reload), so the server hands exactly that one back
      let prev = me.id; if (!prev) { try { prev = +sessionStorage.getItem('jhp_prev_id') || 0; } catch (e) { prev = 0; } }
      ws.send(JSON.stringify({ t: 'hello', cid, prev, token: store.get('jhp_token') || '' }));
      emit('_open');
    };
    ws.onmessage = ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'welcome') { try { sessionStorage.setItem('jhp_prev_id', String(m.id)); } catch (e) {} me.id = m.id; me.nick = m.nick; me.col = m.col; me.member = m.member; me.no = m.memberNo; if (!m.member) store.del('jhp_token'); }
      if (m.t === 'loginOk') { me.nick = m.nick; me.member = true; me.no = m.no; store.set('jhp_token', m.token); }
      if (m.t === 'you') { me.nick = m.nick; me.member = m.member; if (!m.member) { store.del('jhp_token'); me.no = 0; } }
      if (m.t === 'welcome' || m.t === 'loginOk' || m.t === 'meOk') {
        me.identity = m.me || null;
        if (window.Cast) Cast.bind(me.member ? me.nick : '', me.identity);
      }
      if (m.t === 'you' && !m.member) { me.identity = null; if (window.Cast) Cast.bind('', null); }
      if(m.t==='welcome')me.version=m.v;
      emit(m.t, m);
    };
    ws.onclose = () => {
      emit('_close');
      if (offline) return;
      setTimeout(connect, retry);
      retry = Math.min(retry * 2, 20000);
    };
    ws.onerror = () => {};
  }
  // a tab that was asleep (tabbed out, phone locked) reconnects the moment it's looked at again, not after the back-off
  const wake = () => { if (document.hidden || offline) return; if (!ws || ws.readyState > 1) { retry = 1000; connect(); } };
  document.addEventListener('visibilitychange', wake); addEventListener('online', wake); addEventListener('pageshow', wake); addEventListener('focus', wake);

  // Shared toys (see server.js "shared"): Net.kv.get(['a','b']).then(vals => ...), inc(k), push(k, text), put(k, field, value),
  // Net.kv.watch(k, fn) -> fn({type:'set'|'push'|'put', k, v|e|f,v, by}) for changes from anyone (including you).
  // Net.relay(to, ch, data) sends a small JSON message to visitor id `to` (0 = everyone else); Net.onRelay(ch, fn(d, msg)).
  let rid = 0; const pending = {}, watchers = {}, relays = {};
  const watchEmit = (k, ev) => (watchers[k] || []).forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  (handlers.kv = handlers.kv || []).push(m => { const p = pending[m.rid]; if (p) { delete pending[m.rid]; p(m.vals); } });
  (handlers.kvSet = handlers.kvSet || []).push(m => watchEmit(m.k, { type: 'set', k: m.k, v: m.v, by: m.by }));
  (handlers.kvPush = handlers.kvPush || []).push(m => watchEmit(m.k, { type: 'push', k: m.k, e: m.e }));
  (handlers.kvPut = handlers.kvPut || []).push(m => watchEmit(m.k, { type: 'put', k: m.k, f: m.f, v: m.v, by: m.by }));
  (handlers.relay = handlers.relay || []).push(m => (relays[m.ch] || []).forEach(fn => { try { fn(m.d, m); } catch (e) { console.error(e); } }));
  const kv = {
    get(keys) {
      return new Promise(res => {
        const id = ++rid; pending[id] = res;
        if (!window.Net.send({ t: 'kvGet', k: [].concat(keys), rid: id })) { delete pending[id]; res({}); }
        setTimeout(() => { if (pending[id]) { delete pending[id]; res({}); } }, 8000);
      });
    },
    inc(k) { return window.Net.send({ t: 'kvInc', k }); },
    push(k, text) { return window.Net.send({ t: 'kvPush', k, text }); },
    put(k, f, v) { return window.Net.send({ t: 'kvPut', k, f: String(f), v: v == null ? '' : String(v) }); },
    watch(k, fn) { (watchers[k] = watchers[k] || []).push(fn); return () => { watchers[k] = (watchers[k] || []).filter(x => x !== fn); }; },
  };

  window.Net = {
    kv,
    relay(to, ch, d) { return window.Net.send({ t: 'relay', to: to | 0, ch, d }); },
    onRelay(ch, fn) { (relays[ch] = relays[ch] || []).push(fn); return () => { relays[ch] = relays[ch].filter(x => x !== fn); }; },
    me, cid, store,
    on(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
    send(m) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(m)); return true; } return false; },
    get connected() { return !!ws && ws.readyState === 1; },
    start: connect,
    get offline() { return offline; },
    setOffline(v) { offline = !!v; if (offline) { if (ws) ws.close(); } else if (!ws || ws.readyState > 1) { retry = 1000; connect(); } },
  };
})();

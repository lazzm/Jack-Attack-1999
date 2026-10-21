/* events-radio: the Radio Jack LISTENING PARTY. Ten original chiptunes (js/events-cat.js) sequenced with WebAudio, in
 * sync for everyone: the server (mods/events.js) says which tune is on and when it started; we sync our clock to the
 * server's and seek to the right spot. Silent until the visitor presses PLAY. Dedications are read out on screen.
 *   EvRadio.play() / stop() / playing / pos() -> { i, t, want }   EvRadio.page(el) (www.listeningparty.wubwub)   EvRadio.tuner() (window) */
(function () {
  'use strict';
  const Ev = window.Ev, C = window.EventsCat, A = window.Apps; if (!Ev || !C || !A || window.EvRadio) return;
  const { esc, h, sfx } = Ev, $ = id => document.getElementById(id);
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };
  const mmss = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const N = m => 440 * Math.pow(2, (m - 69) / 12);

  // ================================================================ the clock: our idea of the server's time
  let best = Infinity;
  function sync() { for (let k = 0; k < 4; k++) setTimeout(() => Ev.send({ t: 'radSync', c: Date.now() }), k * 350); }
  Ev.on('radSync', m => { const now = Date.now(), rtt = now - (+m.c || now); if (rtt < 0 || rtt > 5000) return; if (rtt <= best * 1.5 || rtt < 120) { if (rtt < best) best = rtt; Ev.setSkew((+m.s || now) - (+m.c + rtt / 2)); } });

  // ================================================================ what's on air
  let now = null; // last radNow
  let listeners = 0;
  const subs = new Set(); // UI redraw functions
  const ui = what => subs.forEach(fn => { try { fn(what); } catch (e) { console.error(e); } });
  Ev.on('radNow', m => { const fresh = !now || now.i !== m.i || now.start !== m.start; now = m; listeners = m.n | 0; if (fresh && m.ded && (playing || subs.size)) dedication(m.ded); if (fresh) { t0 = null; } ui('now'); });
  Ev.on('radCount', m => { listeners = m.n | 0; ui('count'); });
  Ev.on('radReqOk', m => { Desk.toast('Radio Jack', `Request received! You are number ${m.pos} in the queue. Keep listening!`, 5000); sfx('solve'); A.secret('evt.req'); ui('req'); });
  Ev.on('radErr', m => { if (m.guest && window.Guest) Guest.need('Requesting a tune'); else Desk.msgbox('Radio Jack', m.msg, 'warn'); });
  let subbed = 0;
  const sub = on => { subbed = Math.max(0, subbed + (on ? 1 : -1)); if (on && subbed === 1) { Ev.send({ t: 'radSub', on: true }); sync(); } if (!on && subbed === 0) Ev.send({ t: 'radSub', on: false }); };
  if (window.Net) Net.on('welcome', () => { best = Infinity; if (subbed) { Ev.send({ t: 'radSub', on: true }); sync(); } if (playing) Ev.send({ t: 'radTune', on: true }); });
  setInterval(() => { if (subbed || playing) sync(); }, 60000);

  // ================================================================ the sound chip
  let ac = null, out = null, an = null, noiseBuf = null, vol = Math.max(0, Math.min(1, +(Ev.store.get('jhp_events_vol', 0.7)))), playing = false, timer = null, t0 = null, track = -1, ptr = null, nodes = [], done = -1;
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC(); out = ac.createGain(); out.gain.value = vol * 0.35; an = ac.createAnalyser(); an.fftSize = 64; out.connect(an); an.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  const keep = n => { nodes.push(n); if (nodes.length > 400) nodes.splice(0, nodes.length - 400); };
  function voice(f, t, len, type, v, vib) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + len + 0.05); keep(l); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.setValueAtTime(v * 0.75, t + Math.min(len * 0.5, 0.12)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.03); keep(o);
  }
  function drum(k, t) {
    if (k === 'k' || k === 'x') { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18); keep(o); }
    const nz = (dur, v, type, f) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02); keep(s); };
    if (k === 's' || k === 'y') nz(0.14, 0.32, 'bandpass', 1800);
    if (k === 'h' || k === 'x' || k === 'y') nz(0.035, 0.12, 'highpass', 7000);
  }
  // the audio clock that matches what is coming out of the speakers right now (getOutputTimestamp pairs it with performance.now)
  function nowCtx() {
    try { if (ac.getOutputTimestamp) { const o = ac.getOutputTimestamp(); if (o && o.contextTime > 0 && o.performanceTime > 0) { const t = o.contextTime + (performance.now() - o.performanceTime) / 1000; if (Math.abs(t - ac.currentTime) < 0.5) return t; } } } catch (e) {}
    return ac.currentTime;
  }
  // where the server says we are in the current tune (seconds)
  const want = () => (now ? (Ev.now() - now.start) / 1000 : -1);
  function schedule() {
    if (!playing || !ac || !now) return;
    const T = C.TUNES[now.i]; if (!T) return;
    const S = C.compile(T), pos = want(), ct = ac.currentTime, hear = nowCtx();
    if (track !== now.i + ':' + now.start) { track = now.i + ':' + now.start; t0 = null; done = -1; }
    if (pos < 0 || pos > S.dur) return; // the gap between tunes
    if (t0 == null || Math.abs((hear - t0) - pos) > 0.05) { // (re)lock onto the server's clock and seek
      t0 = hear - pos; const from = Math.max(Math.ceil(pos / S.step), done + 1); // never play a note twice after a re-lock
      ptr = { lead: S.lead.findIndex(n => n.s >= from), bass: S.bass.findIndex(n => n.s >= from), arp: S.arp.findIndex(n => n.s >= from), drums: S.drums.findIndex(n => n.s >= from) };
      for (const k in ptr) if (ptr[k] < 0) ptr[k] = Infinity;
    }
    const horizon = ct + 0.35, sw = T.sw || 0;
    const at = s => t0 + s * S.step + (s % 2 ? sw * S.step : 0);
    const lane = (k, fn) => { const L = S[k]; while (ptr[k] < L.length && at(L[ptr[k]].s) < horizon) { const n = L[ptr[k]++], t = at(n.s); if (t >= ct - 0.01) fn(n, Math.max(t, ct)); if (n.s > done) done = n.s; } };
    lane('lead', (n, t) => voice(N(n.p), t, n.len * S.step * 0.92, T.lead, T.lead === 'sawtooth' ? 0.11 : T.lead === 'triangle' ? 0.32 : 0.13, T.vib));
    lane('bass', (n, t) => voice(N(n.p), t, n.len * S.step * 0.85, 'triangle', 0.3));
    lane('arp', (n, t) => voice(N(n.p), t, n.len * S.step * 0.6, 'square', 0.035));
    lane('drums', (n, t) => drum(n.k, t));
  }
  function play() {
    if (!audio()) { Desk.msgbox('Radio Jack', 'Your sound card does not seem to be working. (This browser has no WebAudio.)', 'warn'); return; }
    if (playing) return;
    playing = true; t0 = null; track = -1; done = -1; out.gain.value = vol * 0.35;
    sub(true); Ev.send({ t: 'radTune', on: true }); sync();
    clearInterval(timer); timer = setInterval(schedule, 40); schedule();
    A.secret('evt.radio'); ui('play');
  }
  function stop() {
    if (!playing) return;
    playing = false; clearInterval(timer); timer = null;
    for (const n of nodes) { try { n.stop(); } catch (e) {} } nodes = [];
    sub(false); Ev.send({ t: 'radTune', on: false }); ui('stop');
  }
  function setVol(v) { vol = Math.max(0, Math.min(1, v)); Ev.store.set('jhp_events_vol', vol); if (out) out.gain.value = vol * 0.35; }
  addEventListener('pagehide', () => { if (playing) Ev.send({ t: 'radTune', on: false }); });

  // ================================================================ the dedication banner (on screen, for everyone listening)
  css('evRadCss', `
.rj-ded{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99990;max-width:min(92vw,560px);background:#2a0a4a;color:#fff;border:3px solid #ffd400;box-shadow:4px 4px 0 #000;padding:10px 14px 10px 50px;font:bold 14px Verdana,Arial,sans-serif;animation:rjin .4s ease}
.rj-ded b{color:#ffd400;font:900 16px "Arial Black",Arial;display:block}
.rj-ded i{font-weight:normal;color:#ffb0ff}
.rj-ded svg{position:absolute;left:10px;top:12px;width:30px;height:30px}
@keyframes rjin{from{transform:translate(-50%,-80px)}}
.lp{background:#12002a;color:#fff;font:13px/1.45 Verdana,Arial,sans-serif;min-height:100%;padding:0 0 22px;background-image:radial-gradient(#3a1a6a 1px,transparent 1.5px);background-size:18px 18px}
.lp-wrap{max-width:780px;margin:0 auto;padding:10px 12px}
.lp h1{margin:6px 0 2px;text-align:center;font:italic 900 34px/1 "Arial Black",Impact,sans-serif;color:#ffd400;text-shadow:3px 3px 0 #e10600,6px 6px 0 #000;letter-spacing:-1px}
.lp .lp-tag{text-align:center;color:#ffb0ff;font-weight:bold;margin:0 0 10px}
.lp h2{font:900 15px "Arial Black",Arial;color:#7fffd4;margin:16px 0 6px;border-bottom:2px dashed #7fffd4;text-transform:uppercase}
.lp a{color:#7fffd4}
.lp-player{background:linear-gradient(#3a3a4a,#20202a);border:3px outset #888;border-radius:6px;padding:10px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;box-shadow:5px 5px 0 #000}
.lp-lcd{background:#0a1a0a;color:#7fff3f;font:bold 13px "Courier New",monospace;border:2px inset #555;padding:6px 8px;min-width:0;overflow:hidden}
.lp-lcd .lp-t{white-space:nowrap;overflow:hidden;font-size:16px}
.lp-lcd .lp-a{color:#3fbf3f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-lcd .lp-tm{display:flex;justify-content:space-between;margin-top:4px}
.lp-bar{height:8px;background:#031;border:1px solid #3a6a3a;margin-top:4px}
.lp-bar i{display:block;height:100%;background:#7fff3f;width:0}
.lp-viz{width:100%;height:46px;display:block;margin-top:6px;background:#000;border:1px solid #333}
.lp-side{display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:118px}
.lp-side .btn{min-height:40px;font:bold 14px Arial}
.lp-side .lp-play{background:#1e8a3a;color:#fff}
.lp-side .lp-play.on{background:#a00;color:#fff}
.lp-ls{background:#000;border:2px inset #555;padding:4px;text-align:center;font:bold 11px Arial;color:#ffd400}
.lp-ls b{display:block;font:bold 22px "Courier New",monospace;color:#ff3cff}
.lp-vol{width:100%}
.lp-sync{font-size:10px;color:#9a9;text-align:center}
.lp-req{background:#2a1a4a;border:2px solid #ffd400;padding:10px;display:grid;gap:6px}
.lp-req .row{gap:6px}
.lp-req select,.lp-req input{min-height:28px;font:13px Verdana,Arial;min-width:0;flex:1}
.lp-q,.lp-wall{background:#000;border:1px solid #555;padding:6px 8px;font-size:12px}
.lp-q div,.lp-wall div{padding:2px 0;border-bottom:1px dotted #333}
.lp-list{width:100%;border-collapse:collapse;font-size:12px}
.lp-list td{padding:4px 6px;border-bottom:1px solid #3a2a5a;vertical-align:top}
.lp-list tr.on td{background:#3a1a6a;color:#ffd400;font-weight:bold}
.lp-list .dur{font-family:"Courier New",monospace;text-align:right;white-space:nowrap}
.lp-list .note{font-size:11px;color:#c8b0ff;font-style:italic}
.lp-dl{display:block;margin:12px auto;max-width:380px;background:#ffd400;color:#000 !important;border:3px outset #fff;text-align:center;font:900 14px "Arial Black",Arial;padding:8px;text-decoration:none;cursor:pointer}
.lp-hour{background:#e10600;color:#fff;text-align:center;font:bold 14px Arial;padding:6px;border:2px solid #ffd400;margin:8px 0;animation:evblink 1.2s steps(2) infinite}
@media (max-width:560px){.lp-player{grid-template-columns:minmax(0,1fr)}.lp-side{flex-direction:row;flex-wrap:wrap}.lp-side > *{flex:1}.lp h1{font-size:26px}}
.tn{background:#2a2a36;color:#7fff3f;font:11px Tahoma,Arial;padding:6px;display:grid;gap:6px;margin:-6px}
.tn .lp-lcd{min-height:56px}
.tn .row{gap:4px}
.tn .btn{min-height:30px;flex:1}
`);
  const NOTE = '<svg viewBox="0 0 30 30"><path d="M10 22V6l14-3v15" fill="none" stroke="#ffd400" stroke-width="3"/><circle cx="7" cy="22" r="4" fill="#ffd400"/><circle cx="21" cy="19" r="4" fill="#ffd400"/></svg>';
  let dedEl = null, dedT = 0;
  function dedication(d) {
    if (!d) return;
    if (dedEl) dedEl.remove(); clearTimeout(dedT);
    dedEl = h('div', 'rj-ded', `${NOTE}<b>This one's for ${esc(d.to)} from ${esc(d.from)}!</b>${d.msg ? `<i>"${esc(d.msg)}"</i><br>` : ''}<small>${esc((C.TUNES[d.i] || {}).n || '')} on Radio Jack</small>`);
    dedEl.setAttribute('role', 'status'); DesktopSurface.root().appendChild(dedEl);
    dedEl.addEventListener('click', () => dedEl && dedEl.remove());
    dedT = setTimeout(() => { if (dedEl) dedEl.remove(); dedEl = null; }, 9000);
  }

  // ================================================================ shared player bits
  function lcd(box) {
    const T = now && C.TUNES[now.i], p = want(), d = now ? C.dur(now.i) : 0, gap = now && p > d;
    box.querySelector('.lp-t').textContent = !now ? 'Tuning in...' : gap ? '* Radio Jack 99.9 *' : `${now.i + 1}. ${T.n}`;
    box.querySelector('.lp-a').textContent = !now ? 'Connecting to the JackNet...' : gap ? 'Next tune coming up...' : T.a;
    box.querySelector('.lp-e').textContent = now && !gap ? mmss(p) : '0:00';
    box.querySelector('.lp-d').textContent = now && !gap ? mmss(d) : '0:00';
    box.querySelector('.lp-bar i').style.width = now && !gap ? Math.min(100, p / d * 100) + '%' : '0';
  }
  function viz(cv) {
    const g = cv.getContext('2d'), W = cv.width = cv.clientWidth || 300, H = cv.height = 46, bins = 16, bw = W / bins;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    let data = null; if (playing && an) { data = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(data); }
    for (let i = 0; i < bins; i++) {
      const v = data ? data[Math.min(data.length - 1, i + 1)] / 255 : 0.04 + 0.03 * Math.sin(Date.now() / 400 + i);
      const bh = Math.max(2, Math.round(v * H / 4) * 4);
      for (let y = 0; y < bh; y += 4) { g.fillStyle = y > H * 0.7 ? '#ff3030' : y > H * 0.45 ? '#ffd400' : '#3fff3f'; g.fillRect(i * bw + 1, H - y - 3, bw - 2, 3); }
    }
  }
  const pos = () => ({ i: now ? now.i : -1, t: playing && ac && t0 != null ? nowCtx() - t0 : -1, want: want(), playing, skew: Ev.now() - Date.now() });

  // ================================================================ www.listeningparty.wubwub
  function page(el) {
    el.className = 'lp';
    const opts = C.TUNES.map((t, i) => `<option value="${i}">${i + 1}. ${esc(t.n)} - ${esc(t.a)}</option>`).join('');
    el.innerHTML = `<div class="lp-wrap"><h1>RADIO JACK<br>LISTENING PARTY</h1><p class="lp-tag">&#9835; Everybody on the JackNet hears the SAME tune at the SAME time &#9835;</p>
      <div class="lp-hourbox"></div>
      <div class="lp-player"><div class="lp-lcd"><div class="lp-t">Tuning in...</div><div class="lp-a">&nbsp;</div><div class="lp-tm"><span class="lp-e">0:00</span><span class="lp-d">0:00</span></div><div class="lp-bar"><i></i></div><canvas class="lp-viz"></canvas></div>
        <div class="lp-side"><button class="btn lp-play" type="button">&#9654; PLAY</button><div class="lp-ls">LISTENERS NOW<b class="lp-n">0</b></div><label class="small" style="color:#ccc">Volume<input class="lp-vol" type="range" min="0" max="100" value="${Math.round(vol * 100)}"></label><div class="lp-sync">&nbsp;</div></div></div>
      <p class="small" style="text-align:center;color:#c8b0ff">The radio is silent until you press PLAY. (Your speakers, your rules.)</p>
      <h2>&#9993; Request a tune</h2>
      <form class="lp-req"><div class="row"><select class="lp-ri" aria-label="Tune">${opts}</select></div><div class="row"><input class="lp-to" maxlength="${C.RADIO.toMax}" placeholder="This one's for... (a name)" aria-label="For"><input class="lp-msg" maxlength="${C.RADIO.msgMax}" placeholder="Message (optional)" aria-label="Message"></div><div class="row"><button class="btn" type="submit" style="font-weight:bold">SEND REQUEST</button><span class="small" style="color:#ffb0ff">JackNet members only. One request every 10 minutes (every 3 in the Request Hour!). Keep it nice: Mom listens too.</span></div></form>
      <h2>Coming up next</h2><div class="lp-q"></div>
      <h2>Dedications</h2><div class="lp-wall"></div>
      <h2>Tonight's playlist</h2><table class="lp-list">${C.TUNES.map((t, i) => `<tr data-i="${i}"><td>${i + 1}.</td><td><b>${esc(t.n)}</b><br>${esc(t.a)}<div class="note">${esc(t.notes)}</div></td><td class="dur">${mmss(C.dur(i))}</td></tr>`).join('')}</table>
      <a class="lp-dl" href="#" role="button">&#11015; DOWNLOAD TUNE-O-RAMA PARTY TUNER (344 KB)<br><small style="font:bold 10px Arial">Listen from your desktop! Freeware.</small></a>
      <p class="small" style="text-align:center;color:#999">All tunes written specially for Radio Jack by JackNet readers. No real songs were harmed. Radio Jack is not responsible for dancing.<br><a href="http://www.whatson.jnet/">What's On?</a> &middot; <a href="http://www.radiojack.wubwub/">Radio Jack 99.9 main site</a></p></div>`;
    const b = el;
    const pl = b.querySelector('.lp-play');
    pl.addEventListener('click', () => (playing ? stop() : play()));
    b.querySelector('.lp-vol').addEventListener('input', ev => setVol(ev.target.value / 100));
    b.querySelector('.lp-dl').addEventListener('click', ev => { ev.preventDefault(); if (window.Setup && Setup.download) Setup.download('evt.tuner'); });
    b.querySelector('.lp-req').addEventListener('submit', ev => { ev.preventDefault(); if (window.Guest && !Guest.need('Requesting a tune')) return; Ev.send({ t: 'radReq', i: +b.querySelector('.lp-ri').value, to: b.querySelector('.lp-to').value, msg: b.querySelector('.lp-msg').value }); });
    const draw = () => {
      if (!el.isConnected) return;
      pl.textContent = playing ? '■ STOP' : '▶ PLAY'; pl.classList.toggle('on', playing);
      b.querySelector('.lp-n').textContent = listeners;
      b.querySelector('.lp-hourbox').innerHTML = now && now.hour ? '<div class="lp-hour">&#9733; IT\'S THE REQUEST HOUR! Requests every 3 minutes. Send yours! &#9733;</div>' : '';
      b.querySelector('.lp-q').innerHTML = now && now.q && now.q.length ? now.q.map((q, k) => `<div>${k + 1}. <b>${esc((C.TUNES[q[0]] || {}).n || '?')}</b> requested by ${esc(q[1])} for ${esc(q[2])}</div>`).join('') : '<div><i>No requests in the queue. The DJ is picking (badly).</i></div>';
      b.querySelector('.lp-wall').innerHTML = now && now.wall && now.wall.length ? now.wall.slice().reverse().map(d => `<div>&#9829; For <b>${esc(d.to)}</b> from <b>${esc(d.from)}</b>${d.msg ? ': "' + esc(d.msg) + '"' : ''} <span style="color:#999">(${esc((C.TUNES[d.i] || {}).n || '')})</span></div>`).join('') : '<div><i>No dedications yet. Be the first!</i></div>';
      b.querySelectorAll('.lp-list tr').forEach(tr => tr.classList.toggle('on', !!now && +tr.dataset.i === now.i));
    };
    const tick = () => { if (!el.isConnected) return; lcd(b); viz(b.querySelector('.lp-viz')); const p = pos(); b.querySelector('.lp-sync').textContent = playing && p.t >= 0 ? `In sync: ${Math.round(Math.abs(p.t - p.want) * 1000)} ms` : best < Infinity ? `Ping: ${best} ms` : ''; };
    subs.add(draw); sub(true); draw(); tick();
    const t = setInterval(() => { if (!el.isConnected) { clearInterval(t); subs.delete(draw); sub(false); return; } tick(); }, 120);
  }

  // ================================================================ Tune-O-Rama Party Tuner (desktop window)
  function tuner() {
    const b = h('div', 'tn');
    b.innerHTML = `<div class="lp-lcd"><div class="lp-t">Tuning in...</div><div class="lp-a">&nbsp;</div><div class="lp-tm"><span class="lp-e">0:00</span><span class="lp-d">0:00</span></div><div class="lp-bar"><i></i></div><canvas class="lp-viz" style="height:30px"></canvas></div>
      <div class="row"><button class="btn tn-p" type="button">&#9654; Play</button><button class="btn tn-r" type="button">Request...</button></div>
      <div class="row" style="justify-content:space-between"><span>Listeners: <b class="tn-n">0</b></span><input class="lp-vol" type="range" min="0" max="100" value="${Math.round(vol * 100)}" aria-label="Volume" style="width:110px"></div>`;
    const w = A.win('Tune-O-Rama Party Tuner', b, { w: 300, icon: Ev.ICO.tuner, noResize: true, noMax: true, onClose: () => { subs.delete(draw); sub(false); clearInterval(t); } });
    const p = b.querySelector('.tn-p');
    p.addEventListener('click', () => (playing ? stop() : play()));
    b.querySelector('.tn-r').addEventListener('click', () => Ev.go('http://www.listeningparty.wubwub/'));
    b.querySelector('.lp-vol').addEventListener('input', ev => setVol(ev.target.value / 100));
    const draw = () => { p.textContent = playing ? '■ Stop' : '▶ Play'; b.querySelector('.tn-n').textContent = listeners; };
    subs.add(draw); sub(true); draw();
    const t = setInterval(() => { if (w.closed) return; lcd(b); viz(b.querySelector('.lp-viz')); }, 150);
    return w;
  }

  window.EvRadio = { play, stop, setVol, page, tuner, pos, get playing() { return playing; }, get now() { return now; }, get listeners() { return listeners; }, sync };
})();

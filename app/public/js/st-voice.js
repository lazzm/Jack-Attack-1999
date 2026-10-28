/* st-voice: the family's recorded lines (audio/voice/<lineId>.mp3, listed in audio/voice/manifest.json by
 * tools/audio/gen-lines.mjs) and the bottom subtitle box.
 *   st.say(lineId, who, text, ms, o)  shows the subtitle box (unless o.bubble: a speech bubble shows it instead, and the
 *                                     box only appears with the "Subtitles" setting) and plays the recording if there
 *                                     is one. Returns the voice handle (or null: no recording / sound off / not yet allowed).
 *   st.play(lineId, o)                just the recording. o.pos() -> THREE.Vector3 (world) for positional sound from the
 *                                     speaker's head; o.through() -> true when they're in another room or on another
 *                                     floor (muffled and quieter); o.fx = the clip's own filter ('downstairs' is already muffled).
 *   handle: { lineId, dur, started, ended, level() 0..1 (loudness right now, for the painted mouth), progress() 0..1, stop() }
 *   st.voiceInfo(lineId) -> { dur } when a verified recording exists; st.prefetch(lineId) warms the cache.
 * Lazy: the manifest (a few KB) loads when the page is idle; each clip is fetched and decoded the first time it's needed.
 * Everything goes through Sound's "voice" bus (on the "Sound effects & voices" switch and the volume), and music and
 * effects dip a little while someone talks. With sound off, muted or not yet allowed, nothing is fetched or played and
 * the people fall back to the bubble and the timed mouth. */
(function () {
  'use strict';
  const BASE = 'audio/voice/';
  let manifest = null, loading = null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  function loadManifest() {
    if (manifest || loading) return loading;
    loading = fetch(BASE + 'manifest.json', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : {}).catch(() => ({}))
      .then(m => { manifest = m && typeof m === 'object' ? m : {}; return manifest; });
    return loading;
  }
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => loadManifest(), { timeout: 4000 });
  const info = id => manifest && own(manifest, id) && manifest[id] && manifest[id].file ? manifest[id] : null;
  const on = () => !!(window.Sound && Sound.voicesOn);

  // ---------------------------------------------------------------- decoded clips (a small cache)
  const cache = new Map();
  function buffer(ctx, id) {
    const m = info(id); if (!m) return null;
    let p = cache.get(id);
    if (!p) {
      p = fetch(BASE + m.file, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw new Error('voice ' + r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => { const q = ctx.decodeAudioData(b, res, rej); if (q && q.then) q.then(res, rej); }));
      p.then(() => { p.ready = true; }, () => cache.delete(id));
      cache.set(id, p);
      while (cache.size > 16) cache.delete(cache.keys().next().value);
    } else { cache.delete(id); cache.set(id, p); }
    return p;
  }
  function prefetch(id) {
    if (!on() || !info(id)) return;
    const c = window.Sound.ctx || (window.Sound.ready && Sound.unlock && Sound.unlock()); if (c) buffer(c, id);
  }
  // decoded and ready to start this instant (js/np-life.js holds a line back a moment for it, so voice and bubble agree)
  const ready = id => !!(cache.get(id) && cache.get(id).ready);

  // ---------------------------------------------------------------- playing
  const active = new Set(), log = []; // (log: the last few voice events, for tests and debugging)
  const note = (id, ev) => { log.push(id + ' ' + ev + ' ' + Math.round(performance.now())); if (log.length > 30) log.shift(); };
  let raf = 0;
  const v3 = () => (window.THREE ? new THREE.Vector3() : null);
  const tmp = { p: null, f: null, u: null };
  function setParam(param, v, c) { if (!param) return; if (param.setTargetAtTime) param.setTargetAtTime(v, c.currentTime, 0.05); else param.value = v; }
  function follow() {
    raf = 0; if (!active.size) return;
    const H = window.House, cam = H && H.camera;
    for (const h of active) {
      const c = h.ctx;
      if (cam && c.listener) {
        tmp.p = tmp.p || v3(); tmp.f = tmp.f || v3(); tmp.u = tmp.u || v3();
        if (tmp.p) {
          cam.updateMatrixWorld(); cam.getWorldPosition(tmp.p); cam.getWorldDirection(tmp.f); tmp.u.set(0, 1, 0).applyQuaternion(cam.quaternion);
          const L = c.listener;
          if (L.positionX) { setParam(L.positionX, tmp.p.x, c); setParam(L.positionY, tmp.p.y, c); setParam(L.positionZ, tmp.p.z, c); setParam(L.forwardX, tmp.f.x, c); setParam(L.forwardY, tmp.f.y, c); setParam(L.forwardZ, tmp.f.z, c); setParam(L.upX, tmp.u.x, c); setParam(L.upY, tmp.u.y, c); setParam(L.upZ, tmp.u.z, c); }
          else if (L.setPosition) { L.setPosition(tmp.p.x, tmp.p.y, tmp.p.z); L.setOrientation(tmp.f.x, tmp.f.y, tmp.f.z, tmp.u.x, tmp.u.y, tmp.u.z); }
        }
      }
      if (h.panner && h.o.pos) {
        let p = null; try { p = h.o.pos(); } catch (e) {}
        if (p) { if (h.panner.positionX) { setParam(h.panner.positionX, p.x, c); setParam(h.panner.positionY, p.y, c); setParam(h.panner.positionZ, p.z, c); } else h.panner.setPosition(p.x, p.y, p.z); }
      }
      if (h.wall) { let t = false; try { t = !!(h.o.through && h.o.through()); } catch (e) {} if (t !== h.thru) { h.thru = t; setParam(h.wall.frequency, t ? 900 : 18000, c); setParam(h.wallGain.gain, t ? 0.62 : 1, c); } }
    }
    raf = requestAnimationFrame(follow);
  }
  function play(id, o) {
    o = o || {};
    const m = info(id); if (!m) return null;
    if (!on()) { note(id, 'off'); return null; }
    const c = window.Sound.unlock && Sound.unlock(); if (!c || c.state === 'closed') { note(id, 'no-context'); return null; }
    const h = { lineId: id, dur: +m.dur || 0, ctx: c, o, started: false, ended: false, t0: 0, src: null, an: null, data: null, panner: null, wall: null, wallGain: null, thru: null, peak: 0.12,
      level() {
        if (!h.started || h.ended || !h.an) return 0;
        const d = h.data || (h.data = new Float32Array(h.an.fftSize)); h.an.getFloatTimeDomainData(d);
        let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
        const rms = Math.sqrt(s / d.length); h.peak = Math.max(h.peak * 0.995, rms, 0.06);
        return Math.max(0, Math.min(1, (rms / h.peak - 0.12) * 1.35));
      },
      progress() { if (!h.started) return 0; if (h.ended) return 1; return h.dur ? Math.max(0, Math.min(1, (c.currentTime - h.t0) / h.dur)) : 0; },
      stop() { h.cancelled = true; if (h.src) try { h.src.stop(); } catch (e) {} done(); },
      onstart: null, onend: null };
    const done = why => { if (h.ended) return; note(id, typeof why === 'string' ? why : h.cancelled ? 'stopped' : 'ended'); h.ended = true; active.delete(h); if (!active.size) window.Sound.duck && Sound.duck(false); try { h.onend && h.onend(h); } catch (e) {} };
    const p = buffer(c, id); if (!p) return null;
    const asked = performance.now();
    p.then(buf => {
      if (h.cancelled || !on()) { done('cancelled'); return; }
      if (performance.now() - asked > (o.late || 6000)) { done('late'); return; } // (too late: it would be out of step with the bubble)
      const src = c.createBufferSource(); src.buffer = buf; h.src = src; h.dur = buf.duration;
      const an = c.createAnalyser(); an.fftSize = 512; h.an = an;
      const g = c.createGain(); g.gain.value = o.gain || 1;
      let node = src;
      if (o.pos && c.createPanner) {
        const pn = c.createPanner(); pn.panningModel = 'equalpower'; pn.distanceModel = 'inverse'; pn.refDistance = 140; pn.rolloffFactor = 0.65; pn.maxDistance = 6000;
        h.panner = pn; node.connect(pn); node = pn;
      }
      if (o.through && o.fx !== 'downstairs') { // walls and floors take the top off and some of the level
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.5; const wg = c.createGain();
        h.wall = lp; h.wallGain = wg; node.connect(lp); lp.connect(wg); node = wg;
      }
      node.connect(g); g.connect(an); an.connect(window.Sound.output(c, 'voice'));
      src.onended = done;
      active.add(h); window.Sound.duck && Sound.duck(true);
      follow(); if (!raf) raf = requestAnimationFrame(follow);
      h.t0 = c.currentTime + 0.02; src.start(h.t0); h.started = true; note(id, 'started');
      try { h.onstart && h.onstart(h); } catch (e) {}
    }, () => done('load-failed'));
    note(id, 'asked');
    return h;
  }
  function stop() { for (const h of [...active]) h.stop(); }

  // ---------------------------------------------------------------- the subtitle box (and the old one-shot API)
  let subs = false; try { subs = localStorage.getItem('jhp_subtitles') === '1'; } catch (e) {}
  function say(lineId, who, text, ms, o) {
    o = o || {};
    if (!o.bubble || subs) window.Room?.say(String(who), esc(text), ms > 0 ? ms : 4200);
    if (o.audio === false) return null;
    if (!o.keep) stop();
    return play(lineId, o);
  }
  document.addEventListener('audiochange', () => { if (!on()) stop(); });
  const api = {
    say, play, stopVoice: stop, prefetch, voiceReady: ready,
    voiceInfo: id => { const m = info(id); return m ? { dur: +m.dur || 0, character: m.character } : null; },
    get voice() { return manifest || {}; },
    loadVoices: loadManifest,
    get subtitles() { return subs; },
    set subtitles(v) { subs = !!v; try { localStorage.setItem('jhp_subtitles', subs ? '1' : '0'); } catch (e) {} document.dispatchEvent(new Event('subtitleschange')); },
    get voiceLog() { return log.slice(); },
    get voicesPlaying() { return [...active].filter(h => h.started && !h.ended).map(h => h.lineId); },
  };
  if (window.st) Object.defineProperties(window.st, Object.getOwnPropertyDescriptors(api)); else window.st = api; // (getters kept)
})();

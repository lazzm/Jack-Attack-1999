/* np-bubble: comic speech bubbles over the family's heads when they talk (js/np-life.js), like the talky late-90s
 * adventure games: a white balloon with a little name tab, hung above the speaker's head in 3D (projected to the
 * screen every frame), its tail pointing at their mouth, the words typed on in step with the recording (js/st-voice.js).
 * When the speaker is off-screen, behind you or in another room (Mom shouting from downstairs) the balloon sits at the
 * edge of the screen on the side they are, with its tail as an arrow pointing their way. Balloons keep clear of the
 * crosshair, the carry panel, the objective line, the map and the touch controls, and of each other.
 *   NPCBubble.show({ key, who, text, ms, anchor, voice, shout, color }) -> { close(), el }
 *     anchor: { top(v3) -> v3|null (world, above the hair), mouth(v3) -> v3|null, seen() -> bool (in a room you can
 *     see, same floor), where(v3) -> v3|null (world position for the edge arrow), place: '' | 'downstairs' ... }
 *   NPCBubble.ok() -> true when bubbles can be shown (the house HUD is up); otherwise the caller uses the subtitle box.
 *   NPCBubble.layout(...) is the pure placement maths (tests). */
(function () {
  'use strict';
  if (window.NPCBubble) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const COLORS = { mom: '#a8455f', dad: '#2f5f8e', sister: '#7a4aa6', gran: '#4c7d55' };

  // ---------------------------------------------------------------- pure layout maths (screen px, y down)
  const hit = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  // Put a w x h balloon above point p (the head top) inside the view, out of the keep-out rects. Returns {x, y} (top-left).
  function place(p, w, h, view, keep, gap) {
    const m = view.m, minY = view.top;
    let x = clamp(p.x - w / 2, m, view.w - m - w), y = clamp(p.y - gap - h, minY, view.h - m - h);
    for (let pass = 0; pass < 4; pass++) {
      const r = { x, y, w, h }, k = keep.find(k => hit(r, k, 6)); if (!k) break;
      const up = k.y - 8 - h, down = k.y + k.h + 8, left = k.x - 8 - w, right = k.x + k.w + 8;
      const opts = [];
      if (up >= minY) opts.push({ x, y: up });
      if (down + h <= view.h - m) opts.push({ x, y: down });
      if (left >= m) opts.push({ x: left, y });
      if (right + w <= view.w - m) opts.push({ x: right, y });
      if (!opts.length) break;
      opts.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
      ({ x, y } = opts[0]);
    }
    return { x, y };
  }
  // Off-screen: where the ray from the middle of the view towards direction d (unit, y down) meets the inset edge.
  function edge(d, w, h, view, keep) {
    const m = view.m + 26, cx = view.w / 2, cy = view.h / 2, x0 = m + w / 2, x1 = view.w - m - w / 2, y0 = view.top + 22 + h / 2, y1 = view.h - m - h / 2;
    const tx = d.x > 1e-4 ? (x1 - cx) / d.x : d.x < -1e-4 ? (cx - x0) / -d.x : 1e9, ty = d.y > 1e-4 ? (y1 - cy) / d.y : d.y < -1e-4 ? (cy - y0) / -d.y : 1e9;
    const t = Math.max(0, Math.min(tx, ty)), x = clamp(cx + d.x * t, x0, Math.max(x0, x1)), y = clamp(cy + d.y * t, y0, Math.max(y0, y1));
    return place({ x, y: y + h / 2 }, w, h, view, keep, 0);
  }
  // The tail: base on the balloon's side facing the target, tip towards it (at most len px).
  function tail(r, t, len, rad) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, inset = rad + 8;
    let bx, by, side;
    if (t.y >= r.y + r.h) { side = 'b'; bx = clamp(t.x, r.x + inset, r.x + r.w - inset); by = r.y + r.h; }
    else if (t.y <= r.y) { side = 't'; bx = clamp(t.x, r.x + inset, r.x + r.w - inset); by = r.y; }
    else if (t.x < cx) { side = 'l'; bx = r.x; by = clamp(t.y, r.y + inset, r.y + r.h - inset); }
    else { side = 'r'; bx = r.x + r.w; by = clamp(t.y, r.y + inset, r.y + r.h - inset); }
    let dx = t.x - bx, dy = t.y - by; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const k = Math.min(L, len);
    return { side, bx, by, tx: bx + dx * k, ty: by + dy * k };
  }
  // Two balloons on top of each other: the newer one moves up (or down when there's no room above).
  function separate(rects, view) {
    for (let i = 1; i < rects.length; i++) for (let j = 0; j < i; j++) {
      const a = rects[j], b = rects[i]; if (!hit(a, b, 6)) continue;
      const up = a.y - 8 - b.h; if (up >= view.top) b.y = up; else b.y = a.y + a.h + 8;
    }
    return rects;
  }

  // ---------------------------------------------------------------- the DOM layer
  const H = window.House;
  let layer = null, back = null, front = null, sr = null;
  const live = new Set();
  const NS = 'http://www.w3.org/2000/svg';
  function ensure() {
    if (layer) return layer;
    const host = H && H.ui && H.ui.el; if (!host) return null;
    layer = document.createElement('div'); layer.className = 'np-bubbles'; layer.setAttribute('aria-hidden', 'true');
    back = document.createElementNS(NS, 'svg'); back.setAttribute('class', 'np-tails'); front = document.createElementNS(NS, 'svg'); front.setAttribute('class', 'np-tails np-tails-top');
    layer.appendChild(back); layer.appendChild(front);
    host.insertBefore(layer, host.firstChild);
    sr = document.createElement('div'); sr.className = 'np-bubble-sr'; sr.setAttribute('role', 'status'); sr.setAttribute('aria-live', 'polite'); host.appendChild(sr);
    addEventListener('resize', () => { for (const b of live) b.measure = true; });
    return layer;
  }
  function ok() {
    if (!H || !H.ok || !H.live || !H.camera || !ensure()) return false;
    const st = getComputedStyle(H.ui.el); return st.display !== 'none' && st.visibility !== 'hidden';
  }
  // what to keep clear of (refreshed a few times a second)
  const KEEP = '.hs-hold:not([hidden]),.st-objective:not([hidden]),.hs-top,.hs-map,.hs-tip.carry.on,.ht-acts>.ht-b,.ht-top>.ht-b,.ht-stick.on,.ht-target.on,.ht-tapmark.on,.ht-coach,.hs-getup:not([hidden]),.ch-chip:not([hidden]),.hs-voice.on';
  let keep = [], keepAt = 0, view = null;
  function refreshKeep(now) {
    if (now - keepAt < 300 && view) return; keepAt = now;
    const vw = document.documentElement.clientWidth || innerWidth, vh = document.documentElement.clientHeight || innerHeight;
    const phone = Math.min(vw, vh) < 560;
    view = { w: vw, h: vh, m: phone ? 10 : 16, top: phone ? 8 : 12 };
    keep = [];
    for (const el of document.querySelectorAll(KEEP)) {
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue;
      keep.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    const c = phone ? 34 : 44; keep.push({ x: vw / 2 - c, y: vh / 2 - c, w: c * 2, h: c * 2 }); // the crosshair
  }
  let V = null, V2 = null, M = null;
  function project(p) { // world -> {x, y, front}
    const cam = H.camera; V2.copy(p).applyMatrix4(cam.matrixWorldInverse); const front = V2.z < -1;
    V.copy(p).project(cam);
    return { x: (V.x * 0.5 + 0.5) * view.w, y: (-V.y * 0.5 + 0.5) * view.h, front, cam: V2.clone() };
  }
  const skipPick = m => !!(m.userData.npc || (m.material && m.material.visible === false) || m.userData.contactShadow);
  function blocked(q) {
    if (!H.pick) return false;
    const d = q.cam.length(); let h = null;
    try { h = H.pick(q.x, q.y, { far: d + 5, skip: skipPick }); } catch (e) { return false; }
    return !!(h && h.dist < d - 35);
  }
  let raf = 0;
  function frame() {
    raf = 0; if (!live.size) return;
    const now = performance.now();
    refreshKeep(now);
    if (!V && window.THREE) { V = new THREE.Vector3(); V2 = new THREE.Vector3(); M = new THREE.Vector3(); }
    if (H.camera) H.camera.updateMatrixWorld(); // (a camera's world matrix update refreshes its inverse too)
    let bp = '', fp = '';
    const placed = [];
    for (const b of live) try {
      // the words, typed on with the voice (or the line's time when there's no recording)
      const v = b.voice, el = now - b.t0;
      let p = v && v.started ? v.progress() * 1.06 + 0.04 : v && !v.ended && el < 5000 ? 0 : el / Math.max(600, b.ms * 0.8);
      if (v && v.ended) p = 1;
      const n = Math.min(b.text.length, Math.ceil(clamp(p, 0, 1) * b.text.length));
      if (n !== b.n) { b.n = n; b.said.textContent = b.text.slice(0, n); b.rest.textContent = b.text.slice(n); }
      if (b.measure) { b.measure = false; b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; }
      // where: over the head, or at the edge pointing their way
      const A = b.anchor; let mode = 'edge', top = null, mouth = null, dir = null;
      try {
        const seen = A && A.seen && A.seen();
        if (seen && V && A.top(M)) { top = project(M); if (A.mouth && A.mouth(M)) mouth = project(M); }
        const inView = q => q && q.front && q.x > -20 && q.x < view.w + 20 && q.y > -40 && q.y < view.h + 20;
        if (top && mouth && inView(mouth) && top.front) {
          // behind a wall or a shut door? (a ray at their mouth, a few times a second)
          if (now - (b.occT || 0) > 280) { b.occT = now; b.occ = blocked(mouth); }
          if (!b.occ) mode = 'head';
        }
        if (mode === 'head') {} // (pointing at the mouth)
        else if (V && A && (A.where ? A.where(M) : A.top(M))) { const q = project(M), c = q.cam; let dx = c.x, dy = -c.y; if (c.z > 0) { const L0 = Math.hypot(dx, dy) || 1; dx /= L0; dy = Math.max(Math.abs(dy / L0), 0.75); } /* (behind you: the bottom of the screen, on their side) */ const L = Math.hypot(dx, dy); dir = L > 1e-3 ? { x: dx / L, y: dy / L } : { x: 0, y: 1 }; if (A.below && A.below()) dir = { x: dir.x * 0.5, y: 1 }; const L2 = Math.hypot(dir.x, dir.y); dir.x /= L2; dir.y /= L2; }
        else dir = { x: 0, y: 1 };
      } catch (e) { dir = { x: 0, y: 1 }; }
      if (mode !== b.mode) { b.mode = mode; b.el.classList.toggle('np-edge', mode === 'edge'); b.measure = true; b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; }
      const others = keep.concat(placed);
      const pos = mode === 'head' ? place({ x: top.x, y: Math.min(top.y, mouth.y - 30) }, b.w, b.h, view, others, 18) : edge(dir, b.w, b.h, view, others);
      const r = { x: pos.x, y: pos.y, w: b.w, h: b.h };
      // ease towards the new place (people bob and the view turns; balloons shouldn't jitter)
      if (b.x == null || b.jump) { b.x = r.x; b.y = r.y; b.jump = false; } else { const k = 1 - Math.exp(-(now - (b.lastT || now)) / 70); b.x += (r.x - b.x) * k; b.y += (r.y - b.y) * k; }
      b.lastT = now; r.x = b.x; r.y = b.y;
      placed.push(r);
      b.el.style.transform = `translate(${r.x.toFixed(1)}px,${r.y.toFixed(1)}px)`;
      const target = mode === 'head' ? mouth : { x: r.x + r.w / 2 + dir.x * 400, y: r.y + r.h / 2 + dir.y * 400 };
      const T = tail(r, target, mode === 'head' ? 46 : 22, 14);
      const bw = mode === 'head' ? 9 : 11, px = T.side === 'b' || T.side === 't' ? [bw, 0] : [0, bw], inn = T.side === 'b' ? [0, -3] : T.side === 't' ? [0, 3] : T.side === 'l' ? [3, 0] : [-3, 0];
      const o = b.out ? 0 : clamp((now - b.t0 - 60) / 180, 0, 1);
      if (o > 0) {
        const op = o < 1 ? ` opacity="${o.toFixed(2)}"` : '';
        bp += `<path${op} d="M${(T.bx - px[0] + inn[0]).toFixed(1)} ${(T.by - px[1] + inn[1]).toFixed(1)}L${T.tx.toFixed(1)} ${T.ty.toFixed(1)}L${(T.bx + px[0] + inn[0]).toFixed(1)} ${(T.by + px[1] + inn[1]).toFixed(1)}Z"${b.shout ? ' class="np-sh"' : ''}/>`;
        fp += `<path${op} d="M${(T.bx - px[0] * 0.72 + inn[0]).toFixed(1)} ${(T.by - px[1] * 0.72 + inn[1]).toFixed(1)}L${(T.bx + (T.tx - T.bx) * 0.55).toFixed(1)} ${(T.by + (T.ty - T.by) * 0.55).toFixed(1)}L${(T.bx + px[0] * 0.72 + inn[0]).toFixed(1)} ${(T.by + px[1] * 0.72 + inn[1]).toFixed(1)}Z"/>`;
      }
      b.tail = T;
    } catch (e) { if (!b.err) { b.err = true; console.warn('np-bubble', e); } }
    back.innerHTML = bp; front.innerHTML = fp;
    raf = requestAnimationFrame(frame);
  }
  function show(o) {
    if (!ok()) return null;
    for (const b of live) if (b.key === o.key) b.close(true);
    const el = document.createElement('div'); el.className = 'np-bub' + (o.shout ? ' np-shout' : '');
    el.style.setProperty('--np-tab', o.color || COLORS[o.key] || '#6b5a3a');
    el.innerHTML = '<b class="np-bub-name"></b><p><span class="np-said"></span><span class="np-rest"></span></p>';
    el.querySelector('.np-bub-name').textContent = o.who + (o.place ? ' ' + o.place : '');
    const b = { key: o.key, el, text: String(o.text || ''), ms: o.ms || 3000, t0: performance.now(), voice: o.voice || null, anchor: o.anchor || null, shout: !!o.shout,
      said: el.querySelector('.np-said'), rest: el.querySelector('.np-rest'), n: -1, measure: true, mode: '', x: null, y: null, jump: true, out: false,
      close(now) {
        if (b.out) return; b.out = true; el.classList.add('np-out');
        setTimeout(() => { el.remove(); live.delete(b); }, now ? 0 : 240);
      } };
    b.rest.textContent = b.text; // (the whole line is laid out from the start, so the balloon never grows while typing)
    layer.appendChild(el); live.add(b);
    sr.textContent = o.who + ': ' + b.text;
    if (!raf) raf = requestAnimationFrame(frame);
    return b;
  }
  window.NPCBubble = { show, ok, layout: { place, edge, tail, separate }, get live() { return [...live].map(b => ({ key: b.key, mode: b.mode, x: b.x, y: b.y, w: b.w, h: b.h, said: b.said.textContent, text: b.text, out: b.out, tail: b.tail })); }, clear() { for (const b of live) b.close(true); } };
})();

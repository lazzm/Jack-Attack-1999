/* JackOS coordinates are the monitor's logical pixels, not the browser viewport.
 * Load before desk.js / ie.js. World, boot and editor UI must use their own roots. */
(function () {
  'use strict';
  const root = () => document.getElementById('monitorSurface') || document.body;
  const width = () => root() === document.body ? innerWidth : root().clientWidth || 1024;
  const height = () => root() === document.body ? innerHeight : root().clientHeight || 768;
  const ready = () => !root().classList.contains('pc-starting') &&
    (document.body.classList.contains('pc-monitor') || !document.getElementById('boot'));
  let host, probes;
  function projection() {
    const surface = root();
    if (surface === document.body) return null;
    if (host !== surface || !probes || !probes[0].isConnected) {
      if (probes) probes.forEach(p => p.remove());
      host = surface;
      probes = [[0, 0], [100, 0], [100, 100], [0, 100]].map(([x, y]) => {
        const p = document.createElement('span');
        p.setAttribute('aria-hidden', 'true');
        p.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:0;height:0;padding:0;margin:0;border:0;pointer-events:none;visibility:hidden`;
        surface.appendChild(p); return p;
      });
    }
    // Four projected points recover the plane homography, including matrix3d
    // perspective during the camera glide. A bounding rectangle cannot do that.
    const [p0, p1, p2, p3] = probes.map(p => p.getBoundingClientRect());
    const dx1 = p1.left - p2.left, dx2 = p3.left - p2.left;
    const dy1 = p1.top - p2.top, dy2 = p3.top - p2.top;
    const sx = p0.left - p1.left + p2.left - p3.left;
    const sy = p0.top - p1.top + p2.top - p3.top;
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-8) return null; // edge-on / temporarily hidden
    const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
    const a = p1.left - p0.left + g * p1.left, b = p3.left - p0.left + h * p3.left;
    const d = p1.top - p0.top + g * p1.top, e = p3.top - p0.top + h * p3.top;
    return {a, b, d, e, g, h, x: p0.left, y: p0.top};
  }
  function client(x, y) {
    const p = projection();
    if (!p) return {x, y};
    const u = x / width(), v = y / height(), w = p.g * u + p.h * v + 1;
    return {x: (p.a * u + p.b * v + p.x) / w, y: (p.d * u + p.e * v + p.y) / w};
  }
  function point(clientX, clientY) {
    const p = projection();
    if (!p) return {x: clientX, y: clientY};
    const {a, b, d, e, g, h} = p;
    const A = a - clientX * g, B = b - clientX * h, D = d - clientY * g, E = e - clientY * h;
    const X = clientX - p.x, Y = clientY - p.y, inv = A * E - B * D;
    if (Math.abs(inv) < 1e-8) return { x: 0, y: 0 };
    return { x: (X * E - B * Y) / inv * width(), y: (A * Y - X * D) / inv * height() };
  }
  function rect(el) {
    const surface = root();
    if (surface === document.body || !surface.contains(el)) return el.getBoundingClientRect();
    if (el === surface) return { x: 0, y: 0, left: 0, top: 0, right: width(), bottom: height(), width: width(), height: height() };
    if (typeof el.offsetWidth !== 'number') {
      const r = el.getBoundingClientRect(), a = point(r.left, r.top), b = point(r.right, r.bottom);
      return { x: a.x, y: a.y, left: a.x, top: a.y, right: b.x, bottom: b.y, width: b.x - a.x, height: b.y - a.y };
    }
    let left = 0, top = 0, p = el;
    while (p && p !== surface) {
      left += p.offsetLeft || 0; top += p.offsetTop || 0;
      p = p.offsetParent;
      if (p && p !== surface) { left += p.clientLeft || 0; top += p.clientTop || 0; }
    }
    for (p = el.parentElement; p && p !== surface; p = p.parentElement) { left -= p.scrollLeft; top -= p.scrollTop; }
    const w = el.offsetWidth, h = el.offsetHeight;
    return { x: left, y: top, left, top, right: left + w, bottom: top + h, width: w, height: h };
  }
  window.DesktopSurface = { root, point, client, ready, width, height, rect };

  // Native browser title bubbles escape a transformed screen. Keep desktop
  // tooltips in JackOS too; world and editor titles retain their own behaviour.
  let titleOwner, titleText, tip, tipTimer;
  function hideTitle() {
    clearTimeout(tipTimer);
    if (tip) tip.remove(); tip = null;
    if (titleOwner && !titleOwner.hasAttribute('title')) titleOwner.setAttribute('title', titleText);
    titleOwner = null;
  }
  document.addEventListener('pointerover', ev => {
    if (ev.pointerType !== 'mouse') return;
    const el = ev.target.closest && ev.target.closest('[title]');
    if (!el || el.id === 'clock' || !root().contains(el) || !el.title || el === titleOwner) return;
    hideTitle(); titleOwner = el; titleText = el.title; el.removeAttribute('title');
    tipTimer = setTimeout(() => {
      if (!el.isConnected) return hideTitle();
      tip = document.createElement('div'); tip.className = 'sys-tooltip'; tip.setAttribute('role', 'tooltip'); tip.textContent = titleText;
      tip.style.cssText = 'position:absolute;pointer-events:none;white-space:pre-line;max-width:300px;z-index:99999';
      root().appendChild(tip);
      const r = rect(el);
      tip.style.left = Math.max(4, Math.min(width() - tip.offsetWidth - 4, r.left)) + 'px';
      tip.style.top = Math.max(4, r.bottom + tip.offsetHeight + 6 < height() ? r.bottom + 4 : r.top - tip.offsetHeight - 4) + 'px';
    }, 650);
  });
  document.addEventListener('pointerout', ev => { if (titleOwner && titleOwner.contains(ev.target) && !titleOwner.contains(ev.relatedTarget)) hideTitle(); });
  document.addEventListener('pointerdown', hideTitle, true);
  document.addEventListener('keydown', hideTitle, true);
  window.addEventListener('blur', hideTitle);
})();

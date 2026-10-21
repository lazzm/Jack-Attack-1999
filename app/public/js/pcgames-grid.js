/* pcgames-grid: the level format shared by JAQUAKE, JACKREAL TOURNAMENT and the arena server mod (mods/arena.js).
 * A level is an ASCII grid; every character is a cell from the legend (solid wall, floor at a height, void, liquid...)
 * optionally carrying an entity (spawn, pickup, monster...). Cells are S units wide. Plain JS, no THREE, so the server
 * can require() it to check positions and line of sight. Written from scratch for jacklm.com, 1999 forever. */
(function (root, factory) {
  const G = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.PCGGrid = G;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const S = 2; // world units per cell
  const VOIDF = -1000;
  const BASE = { '#': { s: 1 }, '~': { v: 1 }, '.': { f: 0 }, ' ': { s: 1 } };
  for (let d = 1; d <= 9; d++) BASE[String(d)] = { f: d * 0.5 };

  // resolve a legend char into a flat cell spec (entities point at a base cell with `base`)
  function spec(legend, ch, depth) {
    const L = legend[ch];
    if (!L) return { s: 1 };
    if (L.base && depth < 6) { const b = spec(legend, L.base, depth + 1); const o = Object.assign({}, b, L); delete o.base; if (!L.e) delete o.e; return o; }
    return L;
  }
  function mirrorRows(rows, legend, axis) {
    const swap = ch => { const L = legend[ch]; if (!L) return ch; if (L.one && L.one.indexOf(axis) >= 0) return L.base || '.'; const k = axis === 'x' ? L.mx : L.my; return k || ch; };
    if (axis === 'x') return rows.map(r => r + [...r].reverse().map(swap).join(''));
    return rows.concat(rows.slice().reverse().map(r => [...r].map(swap).join('')));
  }

  function parse(def) {
    const legend = Object.assign({}, BASE, def.legend || {});
    let rows = def.rows.slice();
    if (def.mirror && def.mirror.indexOf('x') >= 0) rows = mirrorRows(rows, legend, 'x');
    if (def.mirror && def.mirror.indexOf('y') >= 0) rows = mirrorRows(rows, legend, 'y');
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const D = Object.assign({ c: 4, sky: false, h: 6 }, def.defaults || {});
    const cells = new Array(w * h), ents = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ch = rows[j][i] || '#', sp = spec(legend, ch, 0);
      const c = { i, j, ch, s: !!sp.s, v: !!sp.v, f: sp.v ? VOIDF : (sp.f != null ? sp.f : 0), c: sp.c != null ? sp.c : D.c, sky: sp.sky != null ? !!sp.sky : !!D.sky,
        h: sp.h != null ? sp.h : D.h, ft: sp.ft || D.ft, ct: sp.ct || D.ct, wt: sp.wt || D.wt, st: sp.st || D.st, liq: sp.liq || '', lv: 0, slab: sp.slab != null ? sp.slab : (D.slab || 0), tag: sp.tag || '', x: sp };
      if (c.liq) { c.lv = c.f; c.f = c.f - (sp.depth || 1.2); }
      cells[j * w + i] = c;
      if (sp.e) ents.push(Object.assign({}, sp.ep || {}, { e: sp.e, i, j, ch, x: (i + 0.5) * S, z: (j + 0.5) * S, y: c.f }));
    }
    const M = { def, w, h, S, cells, ents, rows };
    M.cell = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? OUT : cells[j * w + i];
    M.at = (x, z) => M.cell(Math.floor(x / S), Math.floor(z / S));
    M.floorAt = (x, z) => { const c = M.at(x, z); return c.s ? 1e3 : c.f; };
    M.los = (ax, ay, az, bx, by, bz, pad) => los(M, ax, ay, az, bx, by, bz, pad);
    M.ray = (ox, oy, oz, dx, dy, dz, max) => ray(M, ox, oy, oz, dx, dy, dz, max);
    M.find = e => ents.filter(x => x.e === e);
    return M;
  }
  const OUT = { s: true, v: false, f: 1e3, c: 1e3, sky: false, h: 8, out: true };

  // is the point inside empty space? (cells may have runtime f/c changes: doors and lifts)
  function open(M, x, y, z) {
    const c = M.at(x, z);
    if (c.s) return false;
    if (y < c.f - 0.001) return false;
    if (!c.sky && y > c.c + 0.001) return false;
    return true;
  }
  // straight-line visibility, sampled (cheap and good enough for grid levels)
  function los(M, ax, ay, az, bx, by, bz, pad) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
    const n = Math.ceil(d / 0.25); pad = pad || 0;
    for (let k = 1; k < n; k++) {
      const t = k / n; if (t * d < pad || (1 - t) * d < pad) continue;
      if (!open(M, ax + dx * t, ay + dy * t, az + dz * t)) return false;
    }
    return true;
  }
  // first blocking distance along a unit direction (null if nothing within max)
  function ray(M, ox, oy, oz, dx, dy, dz, max) {
    const st = 0.08;
    for (let t = st; t < max; t += st) if (!open(M, ox + dx * t, oy + dy * t, oz + dz * t)) {
      // refine
      let a = t - st, b = t;
      for (let k = 0; k < 5; k++) { const m = (a + b) / 2; if (open(M, ox + dx * m, oy + dy * m, oz + dz * m)) a = m; else b = m; }
      return a;
    }
    return null;
  }
  return { S, VOIDF, parse, open, los, ray };
});

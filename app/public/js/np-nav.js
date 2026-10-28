/* np-nav: where the family can walk. Built from the house's own walk/block rectangles (js/hs-world.js), so it always
 * matches what the player can walk on, with every door counted as openable and every swinging leaf kept clear.
 * One clearance field per floor (a chamfer distance transform, cm to the nearest wall/furniture); routes are A* on it,
 * pulled tight, with rounded corners that are re-checked against the player's own 22 cm clearance. The stairs join the
 * floors (a straight run down the middle). Each route lists the doors it goes through, so a walker can open them.
 *   NPCNav.route(from, to)   from/to: { lvl:'U'|'G', x, z } -> { pts:[{x,z,lvl}], doors:[{id,s0,s1}], len } | null
 *   NPCNav.clear(lvl, x, z)  cm of clearance at a point (0 = blocked)     NPCNav.snap(lvl, x, z, r) nearest walkable point
 *   NPCNav.floor(lvl, x, z)  the floor height (house y, down) incl. the stair treads; NPCNav.ramp(z) a smooth stair line */
(function () {
  'use strict';
  const H = window.House;
  if (!H || !H.ok || window.NPCNav) return;
  const GR = { x0: -360, z0: -600, cs: 5, nx: 220, nz: Math.ceil((H.FRONT.STREET.pave[1]+600)/5) } /* x -360..740, z through the shared front pavement */, NEED = 25.5, CHECK = 25, D2R = Math.PI / 180;
  const STAIR = { x: 371.5, top: 214, bottom: 634, z0: 250, z1: 600 }; // walk down the middle of the flight
  const field = { U: null, G: null }, sig = { v: '' };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------------------------------------------------------------- the clearance fields
  function signature() {
    const g = H._.grids, t = [];
    for (const id in H.THINGS) { const o = H.THINGS[id]; if (blocksFloor(o)) t.push(id + ':' + Math.round(o.at.x / 5) + ',' + Math.round(o.at.z / 5) + ',' + Math.round(o.at.ry || 0)); }
    return g.walk.length + '|' + g.block.filter(b => !b.off).length + '|' + t.join(';');
  }
  function blocksFloor(o) { // things standing on a floor (furniture, a parcel, a dropped chair) block the way; small bits don't
    if (!o || o.at.hide || !['rest', 'snap', 'fall'].includes(o.st) || H.held() === o.id) return false;
    const r = H.ROOMS[o.at.room]; if (!r || r.id === 'bedroom' && o.at.y < 60) { /* bedroom things count too */ }
    if (!r) return false;
    return !!o.obstacle && Math.abs(o.at.y - H.LV[r.lvl]) < 25; // the same things the player bumps into
  }
  function rebuild() {
    const g = H._.grids;
    for (const lvl of ['U', 'G']) {
      const m = new Uint8Array(GR.nx * GR.nz);
      const mark = (x0, z0, x1, z1, v) => {
        const i0 = clamp(Math.floor((x0 - GR.x0) / GR.cs), 0, GR.nx - 1), i1 = clamp(Math.ceil((x1 - GR.x0) / GR.cs) - 1, 0, GR.nx - 1);
        const j0 = clamp(Math.floor((z0 - GR.z0) / GR.cs), 0, GR.nz - 1), j1 = clamp(Math.ceil((z1 - GR.z0) / GR.cs) - 1, 0, GR.nz - 1);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) m[j * GR.nx + i] = v;
      };
      for (const w of g.walk) if (w.lvl === lvl && (!w.door || H.DOORS[w.door])) mark(w.x0, w.z0, w.x1, w.z1, 1);
      for (const b of g.block) if (b.lvl === lvl && !b.off) mark(b.x0, b.z0, b.x1, b.z1, 0);
      for (const id in H.THINGS) { const o = H.THINGS[id]; if (!blocksFloor(o) || H.ROOMS[o.at.room].lvl !== lvl) continue; const a = (o.at.ry || 0) * D2R, hx = Math.abs(Math.cos(a)) * o.hx + Math.abs(Math.sin(a)) * o.hz, hz = Math.abs(Math.sin(a)) * o.hx + Math.abs(Math.cos(a)) * o.hz; mark(o.at.x - hx, o.at.z - hz, o.at.x + hx, o.at.z + hz, 0); }
      field[lvl] = distance(m);
    }
    sig.v = signature(); routes.clear();
  }
  // two-pass chamfer distance (cm) to the nearest blocked cell; the grid's edge counts as blocked
  function distance(m) {
    const n = GR.nx, R = GR.nz, d = new Float32Array(n * R), INF = 1e6, a = GR.cs, b = GR.cs * Math.SQRT2;
    for (let i = 0; i < d.length; i++) d[i] = m[i] ? INF : 0;
    for (let j = 0; j < R; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i; if (!d[k]) continue;
      let v = d[k];
      v = Math.min(v, i > 0 ? d[k - 1] + a : a, j > 0 ? d[k - n] + a : a, i > 0 && j > 0 ? d[k - n - 1] + b : b, i < n - 1 && j > 0 ? d[k - n + 1] + b : b);
      d[k] = v;
    }
    for (let j = R - 1; j >= 0; j--) for (let i = n - 1; i >= 0; i--) {
      const k = j * n + i; if (!d[k]) continue;
      let v = d[k];
      v = Math.min(v, i < n - 1 ? d[k + 1] + a : a, j < R - 1 ? d[k + n] + a : a, i < n - 1 && j < R - 1 ? d[k + n + 1] + b : b, i > 0 && j < R - 1 ? d[k + n - 1] + b : b);
      d[k] = v;
    }
    return d;
  }
  let lastSig = 0;
  function fresh() { if (!field.U) rebuild(); else if (performance.now() - lastSig > 1500) { lastSig = performance.now(); if (signature() !== sig.v) rebuild(); } }
  const cell = (x, z) => { const i = Math.floor((x - GR.x0) / GR.cs), j = Math.floor((z - GR.z0) / GR.cs); return i >= 0 && j >= 0 && i < GR.nx && j < GR.nz ? j * GR.nx + i : -1; };
  function clear(lvl, x, z) { fresh(); const k = cell(x, z); return k < 0 || !field[lvl] ? 0 : field[lvl][k] - GR.cs * 0.5; }
  function snap(lvl, x, z, r) {
    fresh(); if (clear(lvl, x, z) >= NEED) return { lvl, x, z };
    let best = null, bd = 1e9; const R = r || 120;
    for (let dz = -R; dz <= R; dz += 5) for (let dx = -R; dx <= R; dx += 5) { const d = dx * dx + dz * dz; if (d < bd && clear(lvl, x + dx, z + dz) >= NEED + 1) { bd = d; best = { lvl, x: x + dx, z: z + dz }; } }
    return best;
  }

  // ---------------------------------------------------------------- A* on one floor
  function astar(lvl, ax, az, bx, bz, avoid) {
    const f = field[lvl], n = GR.nx, s = cell(ax, az), t = cell(bx, bz);
    if (s < 0 || t < 0) return null;
    const free = k => !avoid || !avoid.some(a => Math.hypot(GR.x0 + (k % n + 0.5) * GR.cs - a.x, GR.z0 + (((k / n) | 0) + 0.5) * GR.cs - a.z) < a.r);
    const ok = k => f[k] - GR.cs * 0.5 >= NEED && (k === s || free(k));
    if (!ok(t)) return null;
    const g = new Float32Array(f.length).fill(Infinity), from = new Int32Array(f.length).fill(-1), closed = new Uint8Array(f.length);
    const heap = [], push = (k, p) => { heap.push([p, k]); let i = heap.length - 1; while (i) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
    const tx = t % n, tz = (t / n) | 0, hh = k => { const dx = Math.abs(k % n - tx), dz = Math.abs(((k / n) | 0) - tz); return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)) * GR.cs; };
    g[s] = 0; push(s, hh(s));
    const N = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
    let it = 0;
    while (heap.length && it++ < 400000) {
      const k = pop(); if (closed[k]) continue; closed[k] = 1;
      if (k === t) break;
      const x = k % n, z = (k / n) | 0;
      for (const [dx, dz, c] of N) {
        const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= n || zz >= GR.nz) continue;
        const kk = zz * n + xx; if (closed[kk] || !ok(kk)) continue;
        // walls feel close: prefer the middle of corridors a little
        const cost = g[k] + c * GR.cs * (1 + Math.max(0, 40 - f[kk]) / 80);
        if (cost < g[kk]) { g[kk] = cost; from[kk] = k; push(kk, cost + hh(kk)); }
      }
    }
    if (from[t] < 0 && s !== t) return null;
    const out = []; for (let k = t; k >= 0; k = from[k]) { out.push([GR.x0 + (k % n + 0.5) * GR.cs, GR.z0 + (((k / n) | 0) + 0.5) * GR.cs]); if (k === s) break; }
    out.reverse(); out[0] = [ax, az]; out[out.length - 1] = [bx, bz];
    return pull(lvl, out, avoid);
  }
  let AV = null; // people to keep clear of while planning this leg
  function sight(lvl, a, b, need) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / 2.5);
    for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; if (clear(lvl, x, z) < need || AV && AV.some(q => Math.hypot(x - q.x, z - q.z) < q.r)) return false; }
    return true;
  }
  function pull(lvl, p, avoid) {
    AV = avoid || null; // string-pulling: keep a point only when the straight line round it would scrape something
    const out = [p[0]]; let i = 0;
    while (i < p.length - 1) { let j = p.length - 1; while (j > i + 1 && !sight(lvl, p[i], p[j], NEED - 0.5)) j--; out.push(p[j]); i = j; }
    return out;
  }
  // rounded corners (a short curve at each turn), each one checked against the player's own clearance
  function round(lvl, p) {
    if (p.length < 3) return p;
    const out = [p[0]];
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1], b = p[i], c = p[i + 1];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      let r = Math.min(38, l1 * 0.45, l2 * 0.45), done = false;
      while (r > 4 && !done) {
        const p0 = [b[0] + (a[0] - b[0]) * r / l1, b[1] + (a[1] - b[1]) * r / l1], p2 = [b[0] + (c[0] - b[0]) * r / l2, b[1] + (c[1] - b[1]) * r / l2];
        const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p2[1]]); }
        const chain = [out[out.length - 1]].concat(pts);
        if (chain.every((q, k) => k === 0 || sight(lvl, chain[k - 1], q, CHECK))) { out.push(...pts); done = true; } else r *= 0.6;
      }
      if (!done) out.push(b);
    }
    out.push(p[p.length - 1]);
    return out;
  }

  // ---------------------------------------------------------------- whole routes (stairs between the floors, doors on the way)
  const routes = new Map();
  function leg(lvl, a, b, avoid) { const r = astar(lvl, a.x, a.z, b.x, b.z, avoid); AV = avoid || null; const out = r ? round(lvl, r).map(q => ({ x: q[0], z: q[1], lvl })) : null; AV = null; return out; }
  function route(from, to, opts) {
    const avoid = opts && opts.avoid;
    fresh();
    const A = snap(from.lvl, from.x, from.z, 80), B = snap(to.lvl, to.x, to.z, 80); if (!A || !B) return null;
    const key = [A.lvl, Math.round(A.x / 5), Math.round(A.z / 5), B.lvl, Math.round(B.x / 5), Math.round(B.z / 5)].join(',');
    if (!avoid && routes.has(key)) return routes.get(key);
    let pts;
    if (A.lvl === B.lvl) pts = leg(A.lvl, A, B, avoid);
    else {
      const top = { lvl: 'U', x: STAIR.x, z: STAIR.top }, bot = { lvl: 'G', x: STAIR.x, z: STAIR.bottom };
      const [p, q] = A.lvl === 'U' ? [leg('U', A, top, avoid), leg('G', bot, B, avoid)] : [leg('G', A, bot, avoid), leg('U', top, B, avoid)];
      if (p && q) {
        const flight = []; const z0 = A.lvl === 'U' ? STAIR.top : STAIR.bottom, z1 = A.lvl === 'U' ? STAIR.bottom : STAIR.top;
        for (let k = 1; k < 12; k++) { const z = z0 + (z1 - z0) * k / 12; flight.push({ x: STAIR.x, z, lvl: z > 425 ? 'G' : 'U', stairs: true }); }
        pts = p.concat(flight, q);
      }
    }
    if (!pts) { if (!avoid) routes.set(key, null); return null; }
    // de-duplicate, measure, find the doors it passes through
    const P = [pts[0]]; for (const q of pts.slice(1)) { const l = P[P.length - 1]; if (Math.hypot(q.x - l.x, q.z - l.z) > 0.5) P.push(q); }
    let s = 0; P[0].s = 0; for (let i = 1; i < P.length; i++) { s += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z); P[i].s = s; }
    const doors = [];
    for (const d of Object.values(H.DOORS)) {
      const b = d.closedBounds; if (!b || d.always) continue;
      let s0 = null, s1 = null;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], c = P[i], n = Math.ceil((c.s - a.s) / 4);
        for (let k = 0; k <= n; k++) { const t = n ? k / n : 0, x = a.x + (c.x - a.x) * t, z = a.z + (c.z - a.z) * t; if (x > b.x0 - 6 && x < b.x1 + 6 && z > b.z0 - 6 && z < b.z1 + 6 && d.rooms.some(id => H.ROOMS[id]?.lvl === c.lvl)) { const ss = a.s + (c.s - a.s) * t; if (s0 == null) s0 = ss; s1 = ss; } }
      }
      if (s0 != null) doors.push({ id: d.id, s0, s1 });
    }
    doors.sort((a, b) => a.s0 - b.s0);
    const r = { pts: P, doors, len: s };
    if (!avoid) { routes.set(key, r); if (routes.size > 200) routes.delete(routes.keys().next().value); }
    return r;
  }
  // the point (and heading) at arc length s
  function at(r, s) {
    const P = r.pts; s = clamp(s, 0, r.len);
    if (P.length < 2) return { x: P[0].x, z: P[0].z, lvl: P[0].lvl, h: 0, stairs: !!P[0].stairs };
    let i = 1; while (i < P.length - 1 && P[i].s < s) i++;
    const a = P[i - 1], b = P[i], t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, lvl: t < 0.5 ? a.lvl : b.lvl, h: Math.atan2(b.x - a.x, b.z - a.z), stairs: !!(a.stairs || b.stairs) };
  }
  // floors: the stair treads for feet, a smooth ramp for the body
  const stairs = () => H._.grids.stairs[0];
  const onFlight = (x, z) => { const s = stairs(); return s && x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1; };
  function floor(lvl, x, z) { const s = stairs(); if (s && onFlight(x, z) && (lvl === 'U' ? z < 440 : z > 410)) return s.y(x, z); return H.LV[lvl]; }
  const ramp = z => H.LV.U + (H.LV.G - H.LV.U) * clamp((z - STAIR.z0 + 12) / (STAIR.z1 - STAIR.z0), 0, 1);

  window.NPCNav = { route, at, clear, snap, floor, ramp, onFlight, rebuild, field: lvl => field[lvl], GR, NEED, CHECK, STAIR, get ready() { return !!field.U; } };
})();

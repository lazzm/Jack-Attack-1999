/* hs-physics: the house's own small rigid-body solver (docs/PHYSICS.md explains the choice and the rules).
 *
 * Every collider is a box (or an upright cylinder) with a real HEIGHT: a yaw-rotated footprint plus a vertical range, so a
 * chair seat slides under a desk top that is higher than it, a book fits under the bed only if it really fits, and the
 * player's capsule (a 22 cm circle from its step height to the top of its head) can never pass under low furniture.
 * Bodies are compounds of those parts. They slide, spin, swivel (a chair's seat and back turn on the gas column), wobble
 * when bumped (a spring "tip" that always returns upright), fall, land, stack and go to sleep when still. Only awake bodies
 * are simulated, at a fixed 60 Hz step; a sleeping body costs nothing until something touches it.
 *
 * Coordinates are the engine's: cm, x right, z towards the front, y DOWN (a bigger y is lower). A body's y is its BOTTOM.
 * Part heights (lo, hi) are measured UP from the body's bottom. Static boxes carry top/bot as engine y (top < bot).
 * No DOM, no three.js: hs-world.js feeds it the world, and tests/physics-unit.cjs runs it in Node. */
(function (root) {
  'use strict';
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const CELL = 64;

  function create(opts) {
    const o = Object.assign({ gravity: 980, step: 1 / 60, maxSteps: 4, floors: { U: 73, G: 353 }, stepUp: 8, pushPower: 6 }, opts || {});
    const G = o.gravity, H = o.step;
    const levels = {}; // lvl -> { statics:[], grid:Map, kin:Map }
    const bodies = new Map();
    const awake = new Set();
    const stats = { steps: 0, ms: 0, awake: 0, last: 0, peak: 0 };
    let acc = 0;
    const W = {
      bodies, awake, stats, levels, opts: o,
      player: null, ghost: new Set(),
      onSleep: null, onWake: null, onMove: null, onImpact: null, onPush: null,
    };
    const level = l => levels[l] || (levels[l] = { statics: [], grid: new Map(), kin: new Map() });

    // ------------------------------------------------------------ world parts
    function worldBox(s) { // a static or kinematic box: {x,z,hx,hz,ry} or {x0,z0,x1,z1}, plus top/bot
      const b = s.x0 != null ? { x: (s.x0 + s.x1) / 2, z: (s.z0 + s.z1) / 2, hx: Math.abs(s.x1 - s.x0) / 2, hz: Math.abs(s.z1 - s.z0) / 2, ry: 0 } : { x: s.x, z: s.z, hx: s.hx, hz: s.hz, ry: s.ry || 0 };
      const a = b.ry * D2R; b.c = Math.cos(a); b.s = Math.sin(a); b.t = s.r ? 'cyl' : 'box'; if (s.r) b.r = s.r;
      b.top = s.top; b.bot = s.bot; b.id = s.id || null; b.kind = s.kind || 'static'; b.support = s.support !== false; b.player = !!s.player;
      const ex = b.t === 'cyl' ? b.r : Math.abs(b.c) * b.hx + Math.abs(b.s) * b.hz, ez = b.t === 'cyl' ? b.r : Math.abs(b.s) * b.hx + Math.abs(b.c) * b.hz;
      b.ax0 = b.x - ex; b.ax1 = b.x + ex; b.az0 = b.z - ez; b.az1 = b.z + ez;
      return b;
    }
    function setStatic(lvl, list) {
      const L = level(lvl); L.statics = list.map(worldBox); L.grid = new Map();
      for (const b of L.statics) for (let i = Math.floor(b.ax0 / CELL); i <= Math.floor(b.ax1 / CELL); i++) for (let j = Math.floor(b.az0 / CELL); j <= Math.floor(b.az1 / CELL); j++) {
        const k = i * 4096 + j; let a = L.grid.get(k); if (!a) L.grid.set(k, a = []); a.push(b);
      }
      // A sleeping body stays exactly where it is (authored poses survive) unless the new world overlaps it.
      for (const b of bodies.values()) if (b.lvl === lvl && b.active && !awake.has(b) && blockedAt(b, true)) wakeBody(b);
    }
    function setKinematic(id, lvl, box) {
      const L = level(lvl);
      if (!box) { if (L.kin.delete(id)) {} return; }
      const prev = L.kin.get(id), next = worldBox(Object.assign({ id, kind: 'kinematic' }, box));
      L.kin.set(id, next);
      if (!prev || Math.abs(prev.x - next.x) + Math.abs(prev.z - next.z) + Math.abs(prev.c - next.c) + Math.abs(prev.s - next.s) > 1e-4) {
        for (const b of bodies.values()) if (b.lvl === lvl && b.active && !awake.has(b) && aabbHit(b, next.ax0, next.az0, next.ax1, next.az1, 2)) wakeBody(b);
      }
    }
    let seen = 0;
    function staticsNear(lvl, x0, z0, x1, z1, out) {
      const L = levels[lvl]; out.length = 0; if (!L) return out; seen++;
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
        const a = L.grid.get(i * 4096 + j); if (!a) continue;
        for (const b of a) if (b._seen !== seen && b.ax1 >= x0 && b.ax0 <= x1 && b.az1 >= z0 && b.az0 <= z1) { b._seen = seen; out.push(b); }
      }
      for (const b of L.kin.values()) if (b.ax1 >= x0 && b.ax0 <= x1 && b.az1 >= z0 && b.az0 <= z1) out.push(b);
      return out;
    }

    // ------------------------------------------------------------ bodies
    function add(id, spec) {
      const b = Object.assign({
        id, lvl: 'U', x: 0, y: 0, z: 0, ry: 0, sw: 0, vx: 0, vy: 0, vz: 0, wy: 0, wsw: 0, tx: 0, tz: 0, tvx: 0, tvz: 0,
        mass: 1, mu: 0.6, swDamp: 0.9, tip: 0.6, coast: 0.5, push: null, active: true, still: 0, grounded: true, support: null,
        parts: [{ t: 'box', x: 0, z: 0, hx: 5, hz: 5, lo: 0, hi: 10 }], user: null,
      }, spec);
      b.h = Math.max(...b.parts.map(p => p.hi));
      // what can be stacked on: parts flagged top (a chair's seat), else the highest part (never for noStack bodies)
      const flagged = b.parts.filter(p => p.top);
      b.supParts = new Set(flagged.length ? flagged : b.noStack ? [] : b.parts.filter(p => p.hi >= b.h - 0.01));
      b.com = b.parts.reduce((n, p) => Math.max(n, p.hi), 0) * 0.42;
      b.rad = Math.max(...b.parts.map(p => Math.hypot(p.x, p.z) + (p.t === 'cyl' ? p.r : Math.hypot(p.hx, p.hz))));
      if (b.push == null) b.push = 1 / (1 + b.mass * b.mu / o.pushPower);
      b.wp = b.parts.map(() => ({}));
      b.minHalf = Math.max(1, Math.min(...b.parts.map(p => p.t === 'cyl' ? p.r : Math.min(p.hx, p.hz))));
      bodies.set(id, b); update(b);
      return b;
    }
    function remove(id) { const b = bodies.get(id); if (!b) return; awake.delete(b); bodies.delete(id); }
    function update(b) { // world parts + aabb (skipped when the pose hasn't changed since last time)
      if (b._x === b.x && b._z === b.z && b._y === b.y && b._ry === b.ry && b._sw === b.sw) return;
      b._x = b.x; b._z = b.z; b._y = b.y; b._ry = b.ry; b._sw = b.sw;
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      const by = b.ry * D2R, bc = Math.cos(by), bs = Math.sin(by);
      for (let i = 0; i < b.parts.length; i++) {
        const p = b.parts[i], w = b.wp[i], yaw = p.sw ? (b.ry + b.sw) * D2R : by, c = Math.cos(yaw), s = Math.sin(yaw);
        // a swivelling part turns about the body's own centre (the gas column)
        const pc = p.sw ? c : bc, ps = p.sw ? s : bs;
        w.t = p.t; w.x = b.x + p.x * pc + p.z * ps; w.z = b.z - p.x * ps + p.z * pc; w.c = c; w.s = s; w.hx = p.hx; w.hz = p.hz; w.r = p.r;
        w.top = b.y - p.hi; w.bot = b.y - p.lo; w.lo = p.lo; w.hi = p.hi; w.player = p.player !== false; w.base = p.lo < 1.5; w.body = b; w.part = p;
        const ex = p.t === 'cyl' ? p.r : Math.abs(c) * p.hx + Math.abs(s) * p.hz, ez = p.t === 'cyl' ? p.r : Math.abs(s) * p.hx + Math.abs(c) * p.hz;
        w.ax0 = w.x - ex; w.ax1 = w.x + ex; w.az0 = w.z - ez; w.az1 = w.z + ez;
        if (w.ax0 < x0) x0 = w.ax0; if (w.ax1 > x1) x1 = w.ax1; if (w.az0 < z0) z0 = w.az0; if (w.az1 > z1) z1 = w.az1;
      }
      b.ax0 = x0; b.az0 = z0; b.ax1 = x1; b.az1 = z1; b.top = b.y - b.h;
    }
    const aabbHit = (b, x0, z0, x1, z1, m) => b.ax1 + m >= x0 && b.ax0 - m <= x1 && b.az1 + m >= z0 && b.az0 - m <= z1;
    function wakeBody(b) {
      if (!b.active || awake.has(b)) return;
      awake.add(b); b.still = 0; b.grounded = false;
      if (W.onWake) try { W.onWake(b); } catch (e) { console.error(e); }
    }
    function sleepBody(b) {
      b.vx = b.vy = b.vz = b.wy = b.wsw = b.tvx = b.tvz = 0; b.tx = b.tz = 0;
      if (b.restY != null) b.y = b.restY;
      update(b); awake.delete(b); b.still = 0;
      if (W.onSleep) try { W.onSleep(b); } catch (e) { console.error(e); }
    }
    function setActive(b, on) { b.active = !!on; if (!on) { awake.delete(b); b.vx = b.vy = b.vz = b.wy = b.wsw = 0; b.tx = b.tz = b.tvx = b.tvz = 0; } }

    // ------------------------------------------------------------ narrow phase (footprints; heights are checked by the caller)
    function boxBox(a, b) { // normal points from b to a
      const dx = a.x - b.x, dz = a.z - b.z;
      let best = Infinity, nx = 0, nz = 0;
      for (let k = 0; k < 4; k++) {
        const ux = k === 0 ? a.c : k === 1 ? a.s : k === 2 ? b.c : b.s, uz = k === 0 ? -a.s : k === 1 ? a.c : k === 2 ? -b.s : b.c;
        const ra = a.hx * Math.abs(a.c * ux - a.s * uz) + a.hz * Math.abs(a.s * ux + a.c * uz);
        const rb = b.hx * Math.abs(b.c * ux - b.s * uz) + b.hz * Math.abs(b.s * ux + b.c * uz);
        const d = dx * ux + dz * uz, ov = ra + rb - Math.abs(d);
        if (ov <= 0) return null;
        if (ov < best) { best = ov; const g = d < 0 ? -1 : 1; nx = ux * g; nz = uz * g; }
      }
      return { nx, nz, depth: best };
    }
    function circleBoxLocal(x, z, hx, hz, r) { // circle centre in the box's own frame
      const qx = clamp(x, -hx, hx), qz = clamp(z, -hz, hz), dx = x - qx, dz = z - qz, d = Math.hypot(dx, dz);
      if (d >= r) return null;
      if (d < 1e-6) { // centre inside: out through the nearest side
        const sx = hx - Math.abs(x), sz = hz - Math.abs(z);
        return sx < sz ? { nx: x < 0 ? -1 : 1, nz: 0, depth: r + sx } : { nx: 0, nz: z < 0 ? -1 : 1, depth: r + sz };
      }
      return { nx: dx / d, nz: dz / d, depth: r - d };
    }
    function circleBox(cx, cz, r, b) { // normal points from the box to the circle
      const dx = cx - b.x, dz = cz - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      const h = circleBoxLocal(lx, lz, b.hx, b.hz, r); if (!h) return null;
      return { nx: h.nx * b.c + h.nz * b.s, nz: -h.nx * b.s + h.nz * b.c, depth: h.depth };
    }
    function circleCircle(ax, az, ar, bx, bz, br) {
      const dx = ax - bx, dz = az - bz, d = Math.hypot(dx, dz), depth = ar + br - d;
      if (depth <= 0) return null;
      return d > 1e-6 ? { nx: dx / d, nz: dz / d, depth } : { nx: 1, nz: 0, depth };
    }
    function footprint(a, b) { // a and b: world parts/boxes; normal points from b to a
      if (a.ax1 < b.ax0 || a.ax0 > b.ax1 || a.az1 < b.az0 || a.az0 > b.az1) return null;
      if (a.t === 'cyl' && b.t === 'cyl') return circleCircle(a.x, a.z, a.r, b.x, b.z, b.r);
      if (a.t === 'cyl') return circleBox(a.x, a.z, a.r, b);
      if (b.t === 'cyl') { const h = circleBox(b.x, b.z, b.r, a); return h && { nx: -h.nx, nz: -h.nz, depth: h.depth }; }
      return boxBox(a, b);
    }
    const vOverlap = (a, b) => Math.min(a.bot, b.bot) - Math.max(a.top, b.top);
    function inside(px, pz, b, m) { // is a point over this footprint (m: margin)
      if (b.t === 'cyl') return Math.hypot(px - b.x, pz - b.z) <= b.r + m;
      const dx = px - b.x, dz = pz - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      return Math.abs(lx) <= b.hx + m && Math.abs(lz) <= b.hz + m;
    }
    // Is this part resting on (or hovering just above) that collider? Then it is a support, never a wall.
    function onTop(w, s, b) { return w.bot <= s.top + 0.75 && w.base && inside(b.x, b.z, s, 1.5); }

    // Bodies that could be near a region: the player's neighbourhood list when it covers it (rebuilt every frame with a
    // 30 cm margin, so a body moving a few cm this frame is still in it), else every body.
    function near0(lvl, x0, z0, x1, z1) { const k = nearKey; return k && k.lvl === lvl && x0 >= k.x0 && x1 <= k.x1 && z0 >= k.z0 && z1 <= k.z1 ? nearList : bodies.values(); }
    // ------------------------------------------------------------ contacts for one body
    const near = [], tmpParts = [];
    function others(b, x0, z0, x1, z1, out) {
      out.length = 0;
      for (const q of near0(b.lvl, x0, z0, x1, z1)) if (q !== b && q.active && q.lvl === b.lvl && aabbHit(q, x0, z0, x1, z1, 0.5)) out.push(q);
      return out;
    }
    // Push b out of everything solid beside it. Returns the contacts used (for velocity response).
    function resolve(b, pushBodies, maxIter) {
      let any = false, hitN = null;
      for (let it = 0; it < (maxIter || 3); it++) {
        update(b);
        let worst = null;
        staticsNear(b.lvl, b.ax0, b.az0, b.ax1, b.az1, near);
        others(b, b.ax0, b.az0, b.ax1, b.az1, tmpParts);
        for (const w of b.wp) {
          for (const s of near) {
            if (w.ax1 < s.ax0 || w.ax0 > s.ax1 || w.az1 < s.az0 || w.az0 > s.az1 || vOverlap(w, s) <= 0.3 || onTop(w, s, b)) continue;
            const h = footprint(w, s); if (h && h.depth > 0.01 && (!worst || h.depth > worst.depth)) worst = { nx: h.nx, nz: h.nz, depth: h.depth, other: null, kin: s.kind === 'kinematic' };
          }
          for (const q of tmpParts) for (const v of q.wp) {
            if (vOverlap(w, v) <= 0.3 || onTop(w, v, b)) continue;
            if (v.bot <= w.top + 0.75 && v.base && inside(q.x, q.z, w, 1.5)) continue; // q rests on us
            const h = footprint(w, v); if (h && h.depth > 0.01 && (!worst || h.depth > worst.depth)) worst = { nx: h.nx, nz: h.nz, depth: h.depth, other: q };
          }
        }
        // the player is kinematic: a body never stays inside them
        const P = W.player;
        if (P && P.lvl === b.lvl && !W.ghost.has(b.id) && !b.ignorePlayer) for (const w of b.wp) {
          if (!w.player || w.hi <= o.stepUp || Math.min(w.bot, P.feet - o.stepUp) - Math.max(w.top, P.head) <= 0) continue;
          let h;
          if (w.t === 'cyl') h = circleCircle(w.x, w.z, w.r, P.x, P.z, P.r);
          else { const c = circleBox(P.x, P.z, P.r, w); h = c && { nx: -c.nx, nz: -c.nz, depth: c.depth }; }
          if (h && h.depth > 0.01 && (!worst || h.depth > worst.depth)) worst = { nx: h.nx, nz: h.nz, depth: h.depth, other: null, player: true };
        }
        if (!worst) break;
        any = true;
        const d = worst.depth + 0.02;
        if (worst.other && pushBodies) {
          const q = worst.other, share = q.mass * q.mu > 0 ? b.mass / (b.mass + q.mass) : 0.5;
          const qa = shove(q, -worst.nx * d * share, -worst.nz * d * share);
          const left = d - Math.hypot(qa[0], qa[1]);
          if (left > 0) { b.x += worst.nx * left; b.z += worst.nz * left; }
          wakeBody(q);
        } else { b.x += worst.nx * d; b.z += worst.nz * d; }
        hitN = worst;
      }
      if (any) update(b);
      return hitN;
    }
    // Move another body by a nudge, resolving it against the world only (no chains): returns what it managed.
    function shove(q, dx, dz) {
      if (q.fixed) return [0, 0]; // held in a slot, or in your hands: as solid as a wall
      const x0 = q.x, z0 = q.z; q.x += dx; q.z += dz; resolve(q, false, 2); wakeBody(q);
      const ax = q.x - x0, az = q.z - z0;
      if (Math.hypot(ax, az) > 0.01 && W.onMove) W.onMove(q);
      return [ax, az];
    }

    // ------------------------------------------------------------ supports (what's under a body)
    const supNear = [], supBodies = [];
    function supportUnder(b, fromY, x, z) { // the highest top under the base parts at or below fromY; COM must be over it
      const L = o.floors[b.lvl] != null ? o.floors[b.lvl] : 0;
      let best = L, ref = null;
      const cx = x == null ? b.x : x, cz = z == null ? b.z : z;
      staticsNear(b.lvl, b.ax0, b.az0, b.ax1, b.az1, supNear);
      const consider = (s, owner) => {
        if (!s.support && !owner) return;
        if (s.top < fromY - 0.75 || s.top >= best) return; // above us, or no higher than what we have
        let touch = false;
        for (const w of b.wp) if (w.base && footprint(w, s)) { touch = true; break; }
        if (!touch) return;
        if (!inside(cx, cz, s, 1.5)) return; // centre of mass off the edge: it tips off rather than balancing
        best = s.top; ref = owner || s;
      };
      for (const s of supNear) consider(s, null);
      for (const q of others(b, b.ax0, b.az0, b.ax1, b.az1, supBodies)) for (const v of q.wp) if (q.supParts.has(v.part)) consider(v, q);
      return { y: best, ref };
    }

    // ------------------------------------------------------------ the fixed step
    function integrate(b) {
      const h = H;
      // tip: a damped spring back to upright
      if (b.tx || b.tz || b.tvx || b.tvz) {
        b.tvx += (-90 * b.tx - 9 * b.tvx) * h; b.tvz += (-90 * b.tz - 9 * b.tvz) * h;
        b.tx = clamp(b.tx + b.tvx * h, -14, 14); b.tz = clamp(b.tz + b.tvz * h, -14, 14);
        if (Math.abs(b.tx) < 0.02 && Math.abs(b.tvx) < 0.05) b.tx = b.tvx = 0;
        if (Math.abs(b.tz) < 0.02 && Math.abs(b.tvz) < 0.05) b.tz = b.tvz = 0;
      }
      // friction: Coulomb on the floor, a little air drag otherwise
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0) {
        const dec = b.grounded ? b.mu * G * h : 0.02 * sp;
        const k = sp > dec ? (sp - dec) / sp : 0; b.vx *= k; b.vz *= k;
      }
      if (b.wy) { const d = (b.grounded ? b.mu * 900 : 30) * h; b.wy = Math.abs(b.wy) > d ? b.wy - Math.sign(b.wy) * d : 0; }
      if (b.wsw) { b.wsw *= Math.pow(b.swDamp, h * 60); if (Math.abs(b.wsw) < 1) b.wsw = 0; }
      // horizontal, in short substeps so nothing tunnels through a thin wall or a door leaf
      const mx = b.vx * h, mz = b.vz * h, minHalf = b.minHalf;
      const n = Math.max(1, Math.ceil(Math.hypot(mx, mz) / Math.min(3, minHalf * 0.6)));
      const x0 = b.x, z0 = b.z, ry0 = b.ry, sw0 = b.sw;
      for (let i = 0; i < n; i++) {
        b.x += mx / n; b.z += mz / n;
        const hit = resolve(b, true, 2);
        if (hit) { // lose the velocity into the contact, keep the slide along it
          const vn = b.vx * hit.nx + b.vz * hit.nz;
          if (vn < 0) { b.vx -= hit.nx * vn * 1.08; b.vz -= hit.nz * vn * 1.08; if (vn < -40 && W.onImpact) W.onImpact(b, -vn); }
        }
      }
      // yaw and swivel; undo a turn that would wedge it into something
      if (b.wy || b.wsw) {
        b.ry += b.wy * h; b.sw += b.wsw * h; const bx = b.x, bz = b.z;
        const hit = resolve(b, true, 2);
        if (hit && Math.hypot(b.x - bx, b.z - bz) > 1.5) { b.x = bx; b.z = bz; b.ry = ry0; b.sw = sw0; b.wy *= -0.2; b.wsw *= -0.3; update(b); }
      }
      // vertical: fall onto the highest support under the base
      const prevBottom = b.y;
      b.vy += G * h; b.y += b.vy * h; update(b);
      const sup = supportUnder(b, prevBottom);
      if (b.y >= sup.y) {
        const v = b.vy; b.y = sup.y; b.support = sup.ref; b.restY = sup.y;
        if (v > 160) { b.vy = -v * 0.18; b.grounded = false; if (W.onImpact) W.onImpact(b, v); }
        else { b.vy = 0; b.grounded = true; }
        update(b);
      } else { b.grounded = false; b.support = null; }
      // riders: things resting on a moving body move with it
      const dx = b.x - x0, dz = b.z - z0, dr = b.ry - ry0;
      if (Math.abs(dx) + Math.abs(dz) + Math.abs(dr) > 1e-4) carry(b, dx, dz, dr, x0, z0);
      return Math.abs(dx) + Math.abs(dz) + Math.abs(dr) + Math.abs(b.sw - sw0) > 0.002 || Math.abs(b.y - prevBottom) > 0.002;
    }
    function carry(b, dx, dz, dr, cx, cz) {
      for (const q of near0(b.lvl, b.ax0 - 10, b.az0 - 10, b.ax1 + 10, b.az1 + 10)) {
        if (q === b || !q.active || q.support !== b) continue;
        const a = -dr * D2R, rx = q.x - cx, rz = q.z - cz;
        q.x = cx + dx + rx * Math.cos(a) - rz * Math.sin(a); q.z = cz + dz + rx * Math.sin(a) + rz * Math.cos(a); q.ry += dr;
        update(q);
        if (W.onMove) W.onMove(q);
      }
    }
    function supportGone(b) { // something under a sleeping body moved away: let it fall
      for (const q of near0(b.lvl, b.ax0 - 10, b.az0 - 10, b.ax1 + 10, b.az1 + 10)) if (q.support === b && q.active && !awake.has(q)) wakeBody(q);
    }
    function stepOnce() {
      for (const b of Array.from(awake)) {
        if (!b.active) { awake.delete(b); continue; }
        const moved = integrate(b);
        if (moved && W.onMove) W.onMove(b);
        const still = b.grounded && Math.abs(b.vx) < 1.5 && Math.abs(b.vz) < 1.5 && Math.abs(b.vy) < 1 && Math.abs(b.wy) < 3 && Math.abs(b.wsw) < 3 && !b.tx && !b.tz;
        b.still = still ? b.still + H : 0;
        if (b.still > 0.25) sleepBody(b);
        if (moved) supportGone(b);
      }
    }
    function step(dt) {
      const t0 = now();
      acc = Math.min(acc + Math.max(0, dt), H * o.maxSteps);
      let n = 0;
      while (acc >= H - 1e-9 && awake.size) { acc -= H; stepOnce(); n++; }
      if (!awake.size) acc = 0;
      const ms = now() - t0;
      stats.steps += n; stats.last = ms; stats.ms = stats.ms * 0.9 + ms * 0.1; stats.peak = Math.max(stats.peak * 0.995, ms); stats.awake = awake.size;
      return n;
    }
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // ------------------------------------------------------------ the player: a kinematic capsule
    // The player's queries run hundreds of times a frame (the movement sweep): only bodies near the player are tested.
    let nearList = null, nearKey = null;
    function playerRegion(lvl, x, z, reach) {
      nearKey = { lvl, x0: x - reach, z0: z - reach, x1: x + reach, z1: z + reach };
      nearList = []; for (const q of bodies.values()) if (q.active && q.lvl === lvl && aabbHit(q, nearKey.x0, nearKey.z0, nearKey.x1, nearKey.z1, 30)) nearList.push(q);
      tallList = nearList.filter(q => q.parts.some(p => p.player !== false && p.hi > o.stepUp));
    }
    let tallList = null;
    function capsuleParts(lvl, x, z, r, feet, head, fn) {
      const x0 = x - r, z0 = z - r, x1 = x + r, z1 = z + r;
      const k = nearKey, cached = k && k.lvl === lvl && x0 >= k.x0 && x1 <= k.x1 && z0 >= k.z0 && z1 <= k.z1;
      stats.queries = (stats.queries || 0) + 1;
      for (const q of cached ? tallList : bodies.values()) {
        if (!q.active || q.lvl !== lvl || W.ghost.has(q.id) || !aabbHit(q, x0, z0, x1, z1, 0.5)) continue;
        for (const w of q.wp) {
          if (!w.player || w.hi <= o.stepUp) continue;
          if (Math.min(w.bot, feet - o.stepUp) - Math.max(w.top, head) <= 0) continue;
          fn(q, w);
        }
      }
    }
    function playerHit(x, z, r, w) { // normal from the part to the player
      return w.t === 'cyl' ? circleCircle(x, z, r, w.x, w.z, w.r) : circleBox(x, z, r, w);
    }
    function playerContacts(lvl, x, z, r, feet, head) {
      const out = [];
      capsuleParts(lvl, x, z, r, feet, head, (q, w) => { const h = playerHit(x, z, r, w); if (h && h.depth > 0.001) out.push({ nx: h.nx, nz: h.nz, depth: h.depth, id: q.id }); });
      return out;
    }
    // (the movement sweep asks this most often: a tight loop over just the tall bodies near the player)
    function playerBlocked(lvl, x, z, r, feet, head) {
      const x0 = x - r, z0 = z - r, x1 = x + r, z1 = z + r, k = nearKey;
      const list = k && k.lvl === lvl && x0 >= k.x0 && x1 <= k.x1 && z0 >= k.z0 && z1 <= k.z1 ? tallList : bodies.values();
      const lo = feet - o.stepUp;
      for (const q of list) {
        if (!q.active || q.lvl !== lvl || q.ax1 + 0.5 < x0 || q.ax0 - 0.5 > x1 || q.az1 + 0.5 < z0 || q.az0 - 0.5 > z1 || W.ghost.has(q.id)) continue;
        for (const w of q.wp) {
          if (!w.player || w.hi <= o.stepUp || Math.min(w.bot, lo) - Math.max(w.top, head) <= 0) continue;
          if (w.t === 'cyl') { const dx = x - w.x, dz = z - w.z, rr = r + w.r; if (dx * dx + dz * dz < rr * rr - 0.002 * rr) return true; }
          else { const h = circleBox(x, z, r, w); if (h && h.depth > 0.001) return true; }
        }
      }
      return false;
    }
    // Bodies the player is already inside (a refresh, a door swinging something into them): walk out freely.
    // A body stays a ghost until the player is completely clear of it; a new one needs a real (>1 cm) overlap.
    function updateGhosts(lvl, x, z, r, feet, head) {
      const keep = new Set(), was = new Set(W.ghost);
      W.ghost.clear(); // query everything, ghosts included
      capsuleParts(lvl, x, z, r + 0.5, feet, head, (q, w) => { const h = playerHit(x, z, r, w); if (h && (h.depth > 1 || (was.has(q.id) && h.depth > 0))) keep.add(q.id); });
      for (const id of keep) W.ghost.add(id);
      return W.ghost;
    }
    // Walking into a body shoves it ahead of you: light things slide, heavy ones barely budge (and you slow down).
    function playerPush(lvl, x, z, r, feet, head, dx, dz, dt) {
      const len = Math.hypot(dx, dz); if (len < 1e-5) return 0;
      const tx = x + dx, tz = z + dz; let pushed = 0;
      const done = new Set();
      capsuleParts(lvl, tx, tz, r + 0.06, feet, head, (q, w) => {
        if (done.has(q)) return;
        const h = playerHit(tx, tz, r + 0.06, w); if (!h || h.depth <= 0) return;
        if (q.fixed) return; // furniture that's being held, or locked by a job
        done.add(q);
        // push along the contact normal, by what the player wants to move into it
        const into = -(dx * h.nx + dz * h.nz); if (into <= 0) return;
        const want = Math.min(h.depth, into) * q.push;
        const px = -h.nx * want, pz = -h.nz * want;
        const x0 = q.x, z0 = q.z;
        q.x += px; q.z += pz; resolve(q, true, 2);
        const ax = q.x - x0, az = q.z - z0, got = Math.hypot(ax, az);
        // spin: an off-centre shove turns it (a chair's seat swivels instead)
        const cx = tx - h.nx * r, cz = tz - h.nz * r; // contact point on the player
        const lx = cx - q.x, lz = cz - q.z, torque = (lx * -pz - lz * -px); // y-down: + turns like ry
        const sweep = got / Math.max(dt, 1e-3);
        if (w.part.sw) q.wsw = clamp(q.wsw + torque / Math.max(80, q.rad * q.rad) * 520 * (q.swing || 1), -260, 260);
        else if (!q.noSpin) q.wy = clamp(q.wy + torque / Math.max(120, q.rad * q.rad * q.mass) * 140, -120, 120);
        // keep a little of the shove as momentum (castors coast; a beanbag doesn't)
        q.vx = q.vx * 0.5 + (ax / Math.max(dt, 1e-3)) * q.coast; q.vz = q.vz * 0.5 + (az / Math.max(dt, 1e-3)) * q.coast;
        // tip: pushed above its centre of mass, it rocks over a bit and back
        // (tx, tz) is the direction the top leans, in degrees; the host turns it into a rotation about the base
        if (q.tip > 0 && got > 0.01) { const hit = Math.min(q.h, (feet - head) * 0.55) * 0.8, lever = clamp((hit - q.com) / Math.max(10, q.h), 0, 1), k = clamp(sweep * lever * q.tip * 0.35, 0, 60); q.tvx += px / got * k; q.tvz += pz / got * k; }
        wakeBody(q); pushed += got;
        if (W.onPush) W.onPush(q, got, sweep);
        if (W.onMove && got > 0.01) W.onMove(q);
      });
      return pushed;
    }

    // ------------------------------------------------------------ moves and queries for the host
    // Slide a body by (dx, dz) through the world, pushing other bodies a little: what it managed.
    function tryMove(b, dx, dz, maxStep) {
      const len = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(len / (maxStep || 2.5)));
      const x0 = b.x, z0 = b.z;
      for (let i = 0; i < n; i++) { b.x += dx / n; b.z += dz / n; resolve(b, true, 3); }
      update(b);
      if (W.onMove) W.onMove(b);
      return [b.x - x0, b.z - z0];
    }
    function tryTurn(b, dRy, dSw) {
      const ry = b.ry, sw = b.sw, x = b.x, z = b.z;
      b.ry += dRy || 0; b.sw += dSw || 0; resolve(b, true, 3);
      if (Math.hypot(b.x - x, b.z - z) > 4) { b.ry = ry; b.sw = sw; b.x = x; b.z = z; update(b); return false; }
      if (W.onMove) W.onMove(b);
      return true;
    }
    // Where would this shape come to rest if lowered at (x, z) from fromY? ok: it fits without touching anything.
    const probe = { id: '__probe', lvl: 'U', x: 0, y: 0, z: 0, ry: 0, sw: 0, parts: [], wp: [], active: false, h: 0 };
    function findRest(spec, lvl, x, z, ry, fromY, exclude, sw) {
      probe.lvl = lvl; probe.x = x; probe.z = z; probe.ry = ry || 0; probe.sw = sw || 0; probe.parts = spec.parts; probe.h = spec.h || Math.max(...spec.parts.map(p => p.hi));
      if (probe.wp.length !== spec.parts.length) probe.wp = spec.parts.map(() => ({}));
      probe.y = fromY; probe._x = NaN; update(probe);
      const ex = exclude ? (exclude instanceof Set ? exclude : new Set([].concat(exclude))) : null;
      const saved = []; if (ex) for (const id of ex) { const q = bodies.get(id); if (q && q.active) { saved.push(q); q.active = false; } }
      try {
        const sup = supportUnder(probe, fromY);
        probe.y = sup.y; update(probe);
        const why = blockedAt(probe);
        return { y: sup.y, ok: !why, why, support: sup.ref, onFloor: !sup.ref && Math.abs(sup.y - o.floors[lvl]) < 0.01 };
      } finally { for (const q of saved) q.active = true; }
    }
    function blockedAt(b, staticOnly) { // first thing this pose overlaps, or null
      staticsNear(b.lvl, b.ax0, b.az0, b.ax1, b.az1, near);
      for (const w of b.wp) {
        for (const s of near) { if (vOverlap(w, s) <= 0.3 || onTop(w, s, b)) continue; const h = footprint(w, s); if (h && h.depth > 0.4) return s.kind === 'kinematic' ? 'door' : 'solid'; }
        if (staticOnly) continue;
        for (const q of bodies.values()) {
          if (q === b || !q.active || q.lvl !== b.lvl || !aabbHit(q, b.ax0, b.az0, b.ax1, b.az1, 0)) continue;
          for (const v of q.wp) { if (vOverlap(w, v) <= 0.3 || onTop(w, v, b)) continue; if (v.bot <= w.top + 0.75 && v.base && inside(q.x, q.z, w, 1.5)) continue; const h = footprint(w, v); if (h && h.depth > 0.4) return 'body:' + q.id; }
        }
        const P = W.player;
        if (P && P.lvl === b.lvl && w.player && w.hi > o.stepUp && Math.min(w.bot, P.feet - o.stepUp) - Math.max(w.top, P.head) > 0) {
          const h = w.t === 'cyl' ? circleCircle(w.x, w.z, w.r, P.x, P.z, P.r) : circleBox(P.x, P.z, P.r, w);
          if (h && h.depth > 0.4) return 'player';
        }
      }
      return null;
    }
    function overlapping(b) { update(b); return blockedAt(b); }
    // Put a body somewhere valid right now (old saves, the story moving things): out of solids, down onto a support.
    function settle(b, maxShift) {
      const x0 = b.x, z0 = b.z, y0 = b.y;
      update(b); resolve(b, false, 6);
      if (Math.hypot(b.x - x0, b.z - z0) > (maxShift == null ? 60 : maxShift)) { b.x = x0; b.z = z0; update(b); }
      const sup = supportUnder(b, Math.min(b.y, y0) - 0.5);
      b.y = sup.y; b.restY = sup.y; b.support = sup.ref; b.vx = b.vy = b.vz = b.wy = b.wsw = 0; update(b);
      return Math.hypot(b.x - x0, b.z - z0, b.y - y0);
    }
    Object.assign(W, { playerRegion, setStatic, setKinematic, add, remove, get: id => bodies.get(id), update, wake: wakeBody, sleep: sleepBody, setActive, step, playerContacts, playerBlocked, playerPush, updateGhosts, tryMove, tryTurn, findRest, settle, overlapping, supportUnder, staticsNear: (lvl, x0, z0, x1, z1) => staticsNear(lvl, x0, z0, x1, z1, []).slice(), supportGone,
      _: { boxBox, circleBox, circleCircle, footprint, worldBox } });
    return W;
  }

  // Walls for bodies: the floor plan's walkable rectangles, inverted into a few solid boxes (merged greedily).
  function wallsFrom(regions, pad, top, bot) {
    if (!regions.length) return [];
    const xs = new Set(), zs = new Set();
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const r of regions) { x0 = Math.min(x0, r.x0); z0 = Math.min(z0, r.z0); x1 = Math.max(x1, r.x1); z1 = Math.max(z1, r.z1); }
    x0 -= pad; z0 -= pad; x1 += pad; z1 += pad;
    for (const r of regions) { xs.add(r.x0); xs.add(r.x1); zs.add(r.z0); zs.add(r.z1); }
    xs.add(x0); xs.add(x1); zs.add(z0); zs.add(z1);
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b), nx = X.length - 1, nz = Z.length - 1;
    const solid = new Uint8Array(nx * nz);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      solid[j * nx + i] = regions.some(r => cx > r.x0 && cx < r.x1 && cz > r.z0 && cz < r.z1) ? 0 : 1;
    }
    const out = [], used = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (!solid[j * nx + i] || used[j * nx + i]) continue;
      let i1 = i; while (i1 + 1 < nx && solid[j * nx + i1 + 1] && !used[j * nx + i1 + 1]) i1++;
      let j1 = j; grow: while (j1 + 1 < nz) { for (let k = i; k <= i1; k++) if (!solid[(j1 + 1) * nx + k] || used[(j1 + 1) * nx + k]) break grow; j1++; }
      for (let jj = j; jj <= j1; jj++) for (let k = i; k <= i1; k++) used[jj * nx + k] = 1;
      out.push({ x0: X[i], z0: Z[j], x1: X[i1 + 1], z1: Z[j1 + 1], top, bot, kind: 'wall' });
    }
    return out;
  }

  const API = { create, wallsFrom, version: 1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.HousePhysics = API;
})(typeof window !== 'undefined' ? window : globalThis);

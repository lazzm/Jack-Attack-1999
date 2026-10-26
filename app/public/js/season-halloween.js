/* season-halloween: HALLOWEEN 1999 in the player's own house (docs/EVENTS-1999.md section 2). Loaded by js/season.js
 * only while the event is on (24 Oct to noon on 1 Nov in the 1999 calendar, or the owner's clock). Everything here is
 * solid geometry built once per room into batched groups and toggled by visibility: carved pumpkins with real holes
 * (alpha-cut skin over a glowing inner shell), cobwebs of thin strands with solid spiders, paper chains of real loops,
 * bats with extruded wings, a cauldron, a cardboard gravestone, a bedsheet ghost, and the trick-or-treaters.
 *   Kitchen: the six-step pumpkin carving (newspaper, lid, scoop, face, carve, tea-light) at the kitchen table.
 *   Hall: {sister}'s box of decorations, the porch-light switch, the sweets bowl by the front door, the tin of sweets
 *         in the cupboard under the stairs; the front door: trick-or-treaters knock from 16:00 on the 31st.
 *   Tail (1 Nov): sweet wrappers on the hall floor for the bin. Progress is server state (mods/season.js).
 * No new lights: the porch lamp is re-coloured and lanterns join the pooled per-room rig; flicker only on Medium/High. */
(function () {
  'use strict';
  const SE = window.Season, C = window.SeasonCat, H = window.House, R = window.Room;
  if (!SE || !C || !H || !H.ok || !R || window.Halloween) return;
  const T = H.T, K = H.K, M = K.mat, D2R = Math.PI / 180, GY = 353, GC = 95;
  const E = C.byId.halloween99, EID = E.id;
  const cast = s => SE.cast(s);
  const sis = () => { try { return Cast.n('sister'); } catch (e) { return 'my sister'; } };
  const low = () => H.Q?.tier === 'low';
  const srv = () => SE.st(EID) || {};
  const done = o => !!srv().obj?.[o];
  const got = (o, s) => !!srv().steps?.[o]?.[s];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rnd = K.rnd;
  let phase = null, on = false;
  const sf = H.sfx;
  const snd = {
    knock() { for (let i = 0; i < 3; i++) { sf.tone(92, .1, 'sine', .16, i * .24, 52); sf.noise(.06, .09, 700, i * .24, 'lowpass', 900); } },
    bell() { sf.tone(660, .6, 'sine', .07); sf.tone(523, .9, 'sine', .07, .42); },
    saw() { sf.noise(.08, .03, 2600, 0, 'bandpass', 1700); },
    scoop() { sf.noise(.16, .045, 650, 0, 'lowpass', 420); },
    pop() { sf.tone(640 + Math.random() * 300, .05, 'sine', .04, 0, 1100); },
    rustle() { sf.noise(.25, .05, 3000, 0, 'highpass', 5000); },
    sting() { [392, 523, 659, 784].forEach((f, i) => sf.tone(f, .18, 'triangle', .05, i * .1)); },
    rattle() { for (let i = 0; i < 5; i++) sf.tone(1500 + Math.random() * 900, .03, 'square', .014, i * .05); },
    click() { sf.tone(1300, .03, 'square', .03); sf.tone(900, .04, 'square', .02, .03); },
    match() { sf.noise(.18, .06, 3200, 0, 'highpass', 1800); sf.noise(.5, .02, 900, .15, 'lowpass', 300); },
  };
  // family lines: on screen (with the recorded voice when its id exists in tools/audio/voice-lines.json)
  const SAID_KEY = 'jhp_se_said';
  const said = (() => { try { const s = JSON.parse(localStorage.getItem(SAID_KEY) || 'null'); return s && s.e === EID && s.ids ? s : { e: EID, ids: {} }; } catch (e) { return { e: EID, ids: {} }; } })();
  function say(id, who, text, once) {
    if (once) { if (said.ids[id]) return false; said.ids[id] = 1; try { localStorage.setItem(SAID_KEY, JSON.stringify(said)); } catch (e) {} }
    const t = cast(text), w = cast(who);
    if (window.st?.say) window.st.say(id, w, t); else H.say(w, t, 4600);
    return true;
  }
  const think = (title, text, ms) => H.say(cast(title), cast(text), ms || 4200);

  // ================================================================ shared geometry: a ribbed gourd (pumpkin, turnip)
  // u goes round (0.5 = the front, +z; the seam is at the back), v from the top (0) to the bottom (1). y is down.
  function gourd(R0, Hh, o) {
    o = o || {};
    const ribs = o.ribs || 10, depth = o.rib == null ? .055 : o.rib, segU = o.seg || 48, segV = o.rows || 24, v0 = o.v0 || 0, v1 = o.v1 == null ? 1 : o.v1, u0 = o.u0 || 0, u1 = o.u1 == null ? 1 : o.u1, s = o.s || 1, dimple = o.dimple == null ? Hh * .22 : o.dimple;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= segV; j++) {
      const v = v0 + (v1 - v0) * j / segV, th = Math.PI * v, st = Math.sin(th), ct = Math.cos(th);
      for (let i = 0; i <= segU; i++) {
        const u = u0 + (u1 - u0) * i / segU, a = 2 * Math.PI * u - Math.PI, rib = 1 + depth * Math.cos(ribs * a) - depth * .4;
        const y = -ct * (Hh - dimple * Math.pow(1 - st, 3)) * s, r = R0 * st * rib * s;
        pos.push(r * Math.sin(a), y, r * Math.cos(a));
        uv.push(o.uvLocal ? (u - u0) / (u1 - u0) : u, o.uvLocal ? (v - v0) / (v1 - v0) : v);
      }
    }
    for (let j = 0; j < segV; j++) for (let i = 0; i < segU; i++) { const a = j * (segU + 1) + i, b = a + segU + 1; idx.push(a, d(a), b, b, d(a), b + 1); }
    function d(a) { return a + 1; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // outward winding (checked, not assumed), and the seam's normals averaged so it never shows
    const P = g.attributes.position, Nn = g.attributes.normal, mid = Math.floor(segV / 2) * (segU + 1) + Math.floor(segU / 2);
    if (Nn.getX(mid) * P.getX(mid) + Nn.getY(mid) * P.getY(mid) + Nn.getZ(mid) * P.getZ(mid) < 0) { const I = g.index.array; for (let k = 0; k < I.length; k += 3) { const t = I[k]; I[k] = I[k + 1]; I[k + 1] = t; } g.computeVertexNormals(); }
    if (u0 === 0 && u1 === 1) for (let j = 0; j <= segV; j++) { const a = j * (segU + 1), b = a + segU; const n = new T.Vector3(Nn.getX(a) + Nn.getX(b), Nn.getY(a) + Nn.getY(b), Nn.getZ(a) + Nn.getZ(b)).normalize(); Nn.setXYZ(a, n.x, n.y, n.z); Nn.setXYZ(b, n.x, n.y, n.z); }
    return g;
  }
  // the cut edge between the outer skin and the inner shell at a given v (a ring strip: the thickness you can see)
  function rimRing(R0, Hh, v, sIn, o) {
    o = o || {}; const ribs = o.ribs || 10, depth = o.rib == null ? .055 : o.rib, seg = o.seg || 48, dimple = o.dimple == null ? Hh * .22 : o.dimple;
    const th = Math.PI * v, st = Math.sin(th), ct = Math.cos(th), pos = [], idx = [], uv = [];
    for (let i = 0; i <= seg; i++) for (const s of [1, sIn]) {
      const a = 2 * Math.PI * i / seg - Math.PI, rib = 1 + depth * Math.cos(ribs * a) - depth * .4, r = R0 * st * rib * s, y = -ct * (Hh - dimple * Math.pow(1 - st, 3)) * s;
      pos.push(r * Math.sin(a), y, r * Math.cos(a)); uv.push(i / seg, s === 1 ? 0 : 1);
    }
    for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // the pumpkin's skin, painted once: ribs, grooves, a green-brown crown round the stalk; lantern faces cut as real holes
  const SKIN = { ribs: 10 };
  function paintSkin(g, w, h, o) {
    o = o || {};
    const base = o.base || ['#f08a24', '#e2741a', '#c95f12'];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, o.top || '#8a6a22'); gr.addColorStop(.12, base[2]); gr.addColorStop(.3, base[0]); gr.addColorStop(.62, base[1]); gr.addColorStop(.9, base[2]); gr.addColorStop(1, '#7a4a14');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const ribs = o.ribs || SKIN.ribs;
    for (let k = 0; k < ribs; k++) {
      const x = (0.5 + (2 * k + 1) / (2 * ribs)) % 1 * w, xc = (0.5 + k / ribs) % 1 * w, wd = w / ribs;
      const gg = g.createLinearGradient(x - wd * .5, 0, x + wd * .5, 0); gg.addColorStop(0, 'rgba(90,40,0,0)'); gg.addColorStop(.5, o.groove || 'rgba(90,40,0,.38)'); gg.addColorStop(1, 'rgba(90,40,0,0)');
      g.fillStyle = gg; g.fillRect(x - wd * .5, 0, wd, h);
      const hl = g.createLinearGradient(xc - wd * .3, 0, xc + wd * .3, 0); hl.addColorStop(0, 'rgba(255,200,120,0)'); hl.addColorStop(.5, o.shine || 'rgba(255,196,110,.22)'); hl.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = hl; g.fillRect(xc - wd * .3, h * .15, wd * .6, h * .7);
    }
    const r = rnd(o.seed || 31); for (let i = 0; i < (o.speck || 900); i++) { g.fillStyle = r() < .5 ? 'rgba(120,60,10,.18)' : 'rgba(255,210,140,.14)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); }
  }
  // a face shape library in cm (x right, y down, from the middle of the front); converted to skin pixels
  const FACES = {
    grin: [[[-6.3, -3.1], [-2, -3.1], [-4.15, -7.3]], [[2, -3.1], [6.3, -3.1], [4.15, -7.3]], [[-1.2, -.3], [1.2, -.3], [0, -2.6]],
      [[-7.6, 1], [-5, 2.2], [-4, 1.1], [-2.8, 2.7], [2.8, 2.7], [4, 1.1], [5, 2.2], [7.6, 1], [5.6, 4.6], [2.4, 6], [-2.4, 6], [-5.6, 4.6]]],
    surprised: [ring(-4, -4.6, 2.3, 2.5), ring(4, -4.6, 2.3, 2.5), [[-.9, -.9], [.9, -.9], [0, -2.5]], ring(0, 3.4, 2.5, 3.1)],
    cat: [lens(-4.3, -4, 2.6, 1.5, -12), lens(4.3, -4, 2.6, 1.5, 12), [[-1.2, -.7], [1.2, -.7], [0, .7]],
      [[-4.6, 1.6], [-2.3, 3.2], [0, 1.9], [2.3, 3.2], [4.6, 1.6], [4.4, 2.9], [2.3, 4.7], [0, 3.3], [-2.3, 4.7], [-4.4, 2.9]]],
    spooky: [[[-6.8, -5.6], [-1.8, -3.6], [-2.3, -2.2], [-6.2, -2.9]], [[6.8, -5.6], [1.8, -3.6], [2.3, -2.2], [6.2, -2.9]], [[0, -1.9], [1, -.7], [0, .4], [-1, -.7]],
      [[-7.4, 1.6], [-5.6, 3.2], [-3.7, 1.8], [-1.85, 3.4], [0, 1.8], [1.85, 3.4], [3.7, 1.8], [5.6, 3.2], [7.4, 1.6], [6.2, 5.4], [3.7, 4.4], [1.85, 5.8], [0, 4.6], [-1.85, 5.8], [-3.7, 4.4], [-6.2, 5.4]]],
  };
  function ring(cx, cy, rx, ry) { const p = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
  function lens(cx, cy, rx, ry, rot) { const p = [], c = Math.cos(rot * D2R), s = Math.sin(rot * D2R); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry * (1 - .35 * Math.abs(Math.cos(a))); p.push([cx + x * c - y * s, cy + x * s + y * c]); } return p; }
  const FACE_NAMES = { grin: 'Grinning', surprised: 'Surprised', cat: 'Black cat', spooky: 'Spooky' };
  const FACE_ORDER = ['grin', 'surprised', 'cat', 'spooky'];
  // cm on the front -> skin pixels (w x h canvas), for a gourd of radius R0, half-height Hh
  function toPx(x, y, w, h, R0, Hh) { const th = Math.PI / 2 + y / Hh, u = .5 + x / (2 * Math.PI * R0 * Math.max(.3, Math.sin(th))); return [u * w, th / Math.PI * h]; }
  function cutFace(g, w, h, R0, Hh, polys, rim) {
    for (const poly of polys) {
      const pts = poly.map(([x, y]) => toPx(x, y, w, h, R0, Hh));
      const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
      g.save(); path(); g.lineJoin = 'round'; g.strokeStyle = rim || '#f6c27a'; g.lineWidth = Math.max(3, w / 110); g.stroke(); g.strokeStyle = 'rgba(120,60,10,.55)'; g.lineWidth = Math.max(1, w / 500); g.stroke(); g.restore();
      g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = '#000'; path(); g.fill(); g.restore();
    }
  }
  function skinTex(key, w, h, o) {
    const t = K.tex(key, w, h, (g) => { paintSkin(g, w, h, o); if (o?.face) cutFace(g, w, h, o.R || 15, o.Hh || 12, o.face); }, { clamp: true });
    t.flipY = false; t.needsUpdate = true; return t;
  }

  // ================================================================ materials (cached by the kit, shared by every room)
  const mats = {};
  function mm() {
    if (mats.ok) return mats;
    mats.ok = true;
    mats.skin = M({ c: '#fff', map: skinTex('hw.skin.plain', 512, 256, {}), sh: 26, sp: '#3a2410' });
    mats.lantern = M({ c: '#fff', map: skinTex('hw.skin.lantern', 512, 256, { face: FACES.grin }), at: .5, sh: 26, sp: '#3a2410' });
    mats.lantern2 = M({ c: '#fff', map: skinTex('hw.skin.lantern2', 512, 256, { face: FACES.spooky, seed: 7 }), at: .5, sh: 26, sp: '#3a2410' });
    mats.glow = M({ c: '#ffe2a0', e: '#ffb24a', side: 1 });
    mats.flesh = M({ c: '#efb460', side: 1, sh: 4 });
    mats.cut = M({ c: '#f2c072', sh: 4 });
    mats.stalk = M({ c: '#6b6a2c', sh: 6 });
    mats.stalkDry = M({ c: '#7a6a3a', sh: 4 });
    mats.black = M({ c: '#17161a', sh: 14, sp: '#222' });
    mats.chainO = M({ c: '#ee7a1c', sh: 4, side: 2 }); mats.chainB = M({ c: '#1c1a20', sh: 6, side: 2 });
    mats.orange = M({ c: '#e8761c', sh: 6 });
    mats.cord = M({ c: '#1f2a1f', sh: 10 });
    mats.bead = M({ c: '#ff9a3a', e: '#e8650a' });
    mats.beadY = M({ c: '#ffd070', e: '#d89a20' });
    mats.web = M({ c: '#e6e6de', o: .72, tr: true, dw: false, sh: 30, sp: '#fff' });
    mats.spider = M({ c: '#1a1714', sh: 40, sp: '#555' });
    mats.card = M({ c: '#c4b08a', sh: 2 });
    mats.cardDark = M({ c: '#9a8562', sh: 2 });
    mats.wood = M({ c: '#fff', map: window.HouseArt?.t?.('oak') || null, sh: 10 });
    mats.metal = M({ c: '#9a9aa0', sh: 60, sp: '#888' });
    mats.foil = M({ c: '#b9bcc0', sh: 80, sp: '#ddd' });
    mats.sheet = M({ c: '#f2f0ea', sh: 4 });
    mats.sheet2 = M({ c: '#f2f0ea', sh: 4, side: 2 });
    mats.black2 = M({ c: '#17161a', sh: 14, sp: '#222', side: 2 });
    mats.eye = M({ c: '#120f10', sh: 30, sp: '#333' });
    mats.brew = M({ c: '#4aa83a', e: '#2a8a1a', sh: 60, sp: '#9f9' });
    mats.paper = M({ c: '#e9e4d4', sh: 2 });
    mats.wax = M({ c: '#f6f2e6', sh: 20 });
    mats.flame = M({ c: '#ffd890', e: '#ffb040', basic: true });
    return mats;
  }

  // ================================================================ small builders (all solid: thickness on every face)
  function pumpkinStatic(B, x, y, z, s, ry, kind, sh) { // a whole pumpkin (kind: 'plain'), or a lit lantern ('lantern' | 'lantern2')
    const m = mm(), P = B.at(x, y, z, ry || 0, { sx: s, sy: s, sz: s }), R0 = 15, Hh = 12;
    if (kind === 'plain') P.geo(gourd(R0, Hh, { seg: 32, rows: 16 }), 0, -Hh, 0, m.skin);
    else { P.geo(gourd(R0, Hh, { seg: 32, rows: 16 }), 0, -Hh, 0, m[kind]); P.geo(gourd(R0, Hh, { seg: 24, rows: 12, s: .9 }), 0, -Hh, 0, m.glow); }
    P.cyl(0, -Hh * 2 - 1.5, 0, .9, 1.4, 4.4, 7, m.stalk, { rz: 8 });
    P.shadow(0, 0, 0, R0 * 2.4 * (sh || 1), R0 * 2.4 * (sh || 1), .55);
  }
  // a catenary: n points from a to b, sagging by sag (y down)
  function swag(a, b, sag, n) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new T.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t)); } return pts; }
  function cordTube(B, pts, r, m) { const c = new T.CatmullRomCurve3(pts); B.geo(new T.TubeGeometry(c, Math.max(8, pts.length * 2), r, 4, false), 0, 0, 0, m); return c; }
  // paper chain: interlinked card loops, alternating orange and black, hung in a swag
  const loopGeo = () => new T.CylinderGeometry(2.2, 2.2, 1.5, 10, 1, true);
  function chain(B, a, b, sag) {
    const m = mm(), len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(4, Math.round(len / 3.3)), c = new T.CatmullRomCurve3(swag(a, b, sag, 24));
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = c.getPointAt(t), tg = c.getTangentAt(t), ry = Math.atan2(tg.x, tg.z) / D2R + 90, rz = Math.atan2(tg.y, Math.hypot(tg.x, tg.z)) / D2R;
      // a band's axis lies across the chain; alternate links turn a quarter so they really interlock
      B.geo(loopGeo(), p.x, p.y, p.z, i % 2 ? m.chainB : m.chainO, { ry: ry - 90, rx: -rz, rz: i % 2 ? 90 : 0 });
    }
  }
  // battery pumpkin lights: a green cord with little emissive pumpkins
  function pumpkinLights(B, pts, n) {
    const m = mm(), c = cordTube(B, pts, .22, m.cord);
    for (let i = 1; i < n; i++) { const p = c.getPointAt(i / n); B.ball(p.x, p.y + 2.2, p.z, 1.7, 1.4, 1.7, i % 3 ? m.bead : m.beadY, 8); B.cyl(p.x, p.y + .6, p.z, .45, .45, 1.2, 5, m.stalk); }
  }
  // a cobweb across a corner: radial threads from the hub to the walls and ceiling, and sagging spiral threads
  function cobweb(B, o, a, b, size, seed) {
    const m = mm(), r = rnd(seed || 5), V = (x, y, z) => new T.Vector3(x, y, z), O = V(...o), A = V(...a), Bv = V(...b), D = V(0, 1, 0);
    const corners = [O.clone().addScaledVector(A, size), O.clone().addScaledVector(D, size * .8), O.clone().addScaledVector(Bv, size)];
    const hub = O.clone().addScaledVector(A, size * .26).addScaledVector(Bv, size * .26).addScaledVector(D, size * .2);
    const rays = [];
    for (let k = 0; k < 3; k++) for (let i = 0; i < 3; i++) { const t = (i + .5) / 3 + (r() - .5) * .12, p = corners[k].clone().lerp(corners[(k + 1) % 3], t); rays.push(p); }
    rays.push(...corners);
    const thread = (p, q, sag) => { const mid = p.clone().lerp(q, .5); mid.y += sag; B.geo(new T.TubeGeometry(new T.QuadraticBezierCurve3(p, mid, q), 6, .07, 3, false), 0, 0, 0, m.web); };
    const ang = p => Math.atan2(p.clone().sub(hub).dot(Bv) - p.clone().sub(hub).dot(A), p.clone().sub(hub).y);
    rays.sort((p, q) => ang(p) - ang(q));
    for (const p of rays) thread(hub, p, .4);
    for (const f of [.22, .4, .58, .76, .92]) for (let i = 0; i < rays.length; i++) { const p = hub.clone().lerp(rays[i], f), q = hub.clone().lerp(rays[(i + 1) % rays.length], f); if (p.distanceTo(q) < size * .9) thread(p, q, .6 + f); }
    return hub;
  }
  // a solid little spider: two body parts, eyes, eight bent legs
  function spider(B, x, y, z, s, ry) {
    const m = mm(), S = B.at(x, y, z, ry || 0, { sx: s, sy: s, sz: s });
    S.ball(0, 0, -.9, 1.25, 1, 1.5, m.spider, 10); S.ball(0, -.1, .9, .85, .75, .8, m.spider, 8);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
      const z0 = .7 - i * .45, ry2 = sx * (30 + i * 28);
      const L = S.at(sx * .6, 0, z0, 0); L.cyl(sx * 1.1, -.55, 0, .12, .12, 2.5, 4, m.spider, { rz: sx * 62, ry: ry2 * .3 }); L.cyl(sx * 2.5, .5, 0, .1, .08, 2.6, 4, m.spider, { rz: -sx * 30, ry: ry2 * .3 });
    }
    for (const sx of [-.3, .3]) S.ball(sx, -.4, 1.6, .16, .16, .16, m.beadY, 5);
  }
  // a bat: furry body, ears, extruded scalloped wings, beady eyes (built hanging upright, wings half open)
  const wingShape = (() => { const s = new T.Shape(); s.moveTo(0, -1.2); s.bezierCurveTo(3, -3.5, 7, -4.2, 10.5, -2.4); s.quadraticCurveTo(8.6, -.6, 8, 1.4); s.quadraticCurveTo(6.4, .2, 5, 1.6); s.quadraticCurveTo(3.4, .4, 2, 1.8); s.quadraticCurveTo(1, .6, 0, 1.2); s.closePath(); return s; })();
  function bat(B, x, y, z, s, ry, thread) {
    const m = mm(), Bt = B.at(x, y, z, ry || 0, { sx: s, sy: s, sz: s });
    Bt.ball(0, 0, 0, 1.9, 2.8, 1.7, m.black, 10); Bt.ball(0, -3.2, .2, 1.5, 1.4, 1.4, m.black, 10);
    for (const sx of [-1, 1]) { Bt.cyl(sx * .8, -4.8, .2, .05, .55, 1.6, 5, m.black, { rz: sx * -18 }); Bt.ball(sx * .55, -3.4, 1.35, .22, .22, .18, m.beadY, 5); }
    const wg = new T.ExtrudeGeometry(wingShape, { depth: .35, bevelEnabled: false, curveSegments: 6 });
    Bt.geo(wg, .9, -1.4, -.2, m.black, { ry: -18, rz: 18 });
    Bt.geo(wg.clone().scale(-1, 1, 1), -.9, -1.4, -.2, m.black, { ry: 18, rz: -18 });
    if (thread) Bt.cyl(0, -3.6 - thread / 2, 0, .06, .06, thread, 3, mm().web);
  }
  function witchHat(B, x, y, z, s, ry) {
    const m = mm(), W = B.at(x, y, z, ry || 0, { sx: s, sy: s, sz: s });
    W.cyl(0, -.4, 0, 11, 11, .8, 28, m.black);
    W.lathe(0, -.8, 0, [[0, -27], [.8, -25.4], [1.8, -22], [3.2, -16], [4.6, -8], [5.6, 0]], 20, m.black, { rz: 4 });
    W.cyl(0, -2.2, 0, 5.75, 5.75, 2.8, 20, M({ c: '#6a2a8a', sh: 10 })); W.box(0, -2.2, 5.8, 2.4, 2.4, .4, M({ c: '#c8a040', sh: 70, sp: '#a08040' }));
    W.shadow(0, 0, 0, 24, 24, .45);
  }
  function cauldron(B, x, y, z) {
    const m = mm(), Cd = B.at(x, y, z);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; Cd.cyl(Math.cos(a) * 6.5, -1.1, Math.sin(a) * 6.5, .9, .7, 2.2, 6, m.black); }
    Cd.lathe(0, -2, 0, [[7.4, -14.6], [8.6, -13.2], [9.6, -9.5], [9.8, -6], [8.6, -2.4], [5.2, -.4], [0, 0]], 24, m.black2);
    Cd.geo(new T.TorusGeometry(7.9, .7, 6, 24), 0, -16.4, 0, m.black, { rx: 90 });
    Cd.cyl(0, -13.6, 0, 8.4, 8.4, .6, 22, m.brew);
    [[-2, 1, 1.1], [3, -2, .8], [1, 3.2, .6]].forEach(([bx, bz, r]) => Cd.ball(bx, -14, bz, r, r * .8, r, m.brew, 6));
    Cd.geo(new T.TorusGeometry(8.4, .35, 4, 16, Math.PI), 0, -15.6, 0, m.metal, { rx: 0, ry: 90 });
    Cd.shadow(0, 0, 0, 22, 22, .55);
  }
  function gravestone(B, x, y, z, ry) {
    const m = mm(), G = B.at(x, y, z, ry || 0), s = new T.Shape();
    s.moveTo(-15, 0); s.lineTo(-15, -38); s.absarc(0, -38, 15, Math.PI, 0, true); s.lineTo(15, 0); s.closePath();
    G.geo(new T.ExtrudeGeometry(s, { depth: 5, bevelEnabled: true, bevelSize: .8, bevelThickness: .8, bevelSegments: 2, curveSegments: 14 }), 0, 0, -2.5, m.foil);
    const t = K.tex('hw.rip', 256, 320, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.fillStyle = '#2a2a30'; g.textAlign = 'center'; g.font = '700 54px "Comic Sans MS","Z003",cursive'; g.fillText('R.I.P.', w / 2, 112); g.font = '700 34px "Comic Sans MS","Z003",cursive'; g.fillText('MY', w / 2, 172); g.fillText('HOMEWORK', w / 2, 216); g.font = '22px "Comic Sans MS","Z003",cursive'; g.fillText('1999 - 1999', w / 2, 262); }, { clamp: true });
    G.plane(0, -30, 3.45, 26, 32, M({ c: '#fff', map: t, tr: true, po: -2, sh: 20 }));
    G.box(0, -1, 0, 34, 2, 9, M({ c: '#5a4a32', sh: 2 }));
    G.shadow(0, 0, 0, 40, 18, .5, { sq: true });
  }
  function sheetGhost(B, x, y, z, ry) { // a bedsheet over a broom stood in an upturned bucket: arms on a crossbar
    const m = mm(), G = B.at(x, y, z, ry || 0);
    G.lathe(0, 0, 0, [[0, -24], [9, -24], [10.5, -12], [11, -1], [0, 0]], 18, m.metal);
    G.cyl(0, -60, 0, 1.3, 1.3, 70, 8, M({ c: '#8a6a3a', sh: 8 }));
    G.lathe(0, -24, 0, [[0, -92], [6, -91], [9.6, -86.5], [10.4, -80], [9, -74], [12, -70], [13, -50], [15.5, -25], [18.5, -3], [16.8, 0], [14, -1.4]], 22, m.sheet2);
    for (const sx of [-1, 1]) G.cyl(sx * 18, -90, 0, 3.4, 5.6, 22, 10, m.sheet, { rz: sx * 72 });
    for (const sx of [-3.4, 3.4]) G.ball(sx, -106, 9.4, 1.6, 2.6, .9, m.eye, 8);
    G.ball(0, -98, 10.1, 2, 1.4, .8, m.eye, 8);
    G.shadow(0, 0, 0, 44, 40, .5);
  }
  function turnip(B, x, y, z, ry) { // Gran's way: a swede/turnip lantern, carved, on a saucer
    const R0 = 9, Hh = 8, t = skinTex('hw.skin.turnip', 256, 128, { base: ['#efe2c8', '#e3cfa8', '#9a5a8a'], top: '#6a2a6a', ribs: 6, groove: 'rgba(80,40,80,.25)', shine: 'rgba(255,255,255,.2)', speck: 400, face: [[[-3.8, -2.2], [-1, -2.2], [-2.4, -4.6]], [[1, -2.2], [3.8, -2.2], [2.4, -4.6]], [[-4.2, 1], [-1.5, 2.2], [1.5, 2.2], [4.2, 1], [2.4, 3.8], [-2.4, 3.8]]], R: R0, Hh, seed: 9 });
    const P = B.at(x, y, z, ry || 0);
    P.cyl(0, -.5, 0, 9, 7, 1, 18, M({ c: '#e8e2d6', sh: 40 }));
    P.geo(gourd(R0, Hh, { seg: 28, rows: 14, ribs: 6, rib: .03 }), 0, -1 - Hh, 0, M({ c: '#fff', map: t, at: .5, sh: 18 }));
    P.geo(gourd(R0, Hh, { seg: 20, rows: 10, ribs: 6, rib: .03, s: .88 }), 0, -1 - Hh, 0, mm().glow);
    for (let i = 0; i < 3; i++) P.cyl((i - 1) * 1.4, -1 - Hh * 2 - 2.4, 0, .25, .5, 5, 4, M({ c: '#4a7a2a', sh: 6 }), { rz: (i - 1) * 24 });
    P.shadow(0, 0, 0, 17, 15, .5);
  }
  function soupPot(B, x, y, z) {
    const P = B.at(x, y, z), e = M({ c: '#c8562a', sh: 50, sp: '#a88' });
    P.lathe(0, 0, 0, [[9, -15], [9.4, -13], [9.4, -1], [8.4, 0], [0, 0]], 22, e); 
    P.lathe(0, -15, 0, [[0, -3.4], [2, -3], [9.6, -.4], [9.8, 0]], 22, e); P.ball(0, -18.8, 0, 1.4, 1, 1.4, M('#222'), 8);
    for (const sx of [-1, 1]) P.box(sx * 11, -11, 0, 3.4, 1.6, 4.4, M('#222'));
  }
  function fingersTray(B, x, y, z, ry) {
    const P = B.at(x, y, z, ry || 0), dough = M({ c: '#dcb072', sh: 10 }), nail = M({ c: '#c87a5a', sh: 30 });
    P.box(0, -.4, 0, 26, .8, 17, M({ c: '#9a9aa0', sh: 50, sp: '#777' })); P.box(0, -.9, 0, 24.6, .3, 15.8, M({ c: '#f2eee2' }));
    const r = rnd(44);
    for (let i = 0; i < 7; i++) {
      const fx = -9.6 + i * 3.2, rz = (r() - .5) * 8;
      const F = P.at(fx, -1.9, (r() - .5) * 1.4, 90 + rz);
      F.cyl(0, 0, 0, .78, .9, 10.5, 8, dough, { rz: 90 }); F.ball(5.2, 0, 0, .8, .78, .78, dough, 8); F.ball(-5.2, 0, 0, .9, .85, .85, dough, 8);
      F.ball(5.5, -.55, 0, .62, .25, .5, nail, 6);
      for (const kx of [-1.4, 1.8]) F.cyl(kx, -.5, 0, .9, .9, .25, 8, M({ c: '#c69a5a' }), { rz: 90 });
    }
  }
  // the decoration box: a cardboard box with open flaps and {sister}'s writing on it
  function decorBox(B) {
    const m = mm(), lbl = K.tex('hw.box.' + sis(), 256, 128, (g, w, h) => { g.fillStyle = '#c4b08a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.font = '700 30px "Comic Sans MS","Z003",cursive'; g.textAlign = 'center'; g.fillText('SPOOKY STUFF', w / 2, 52); g.fillStyle = '#a0201a'; g.font = '700 22px "Comic Sans MS","Z003",cursive'; g.fillText(cast("{sister}'s! KEEP OUT"), w / 2, 92, w - 20); }, { clamp: true, identity: true });
    const Bx = B.at(236, GY, 330, 8);
    Bx.box(0, -.6, 0, 38, 1.2, 28, m.cardDark);
    Bx.box(0, -12, 13.6, 38, 22, .8, { f: M({ c: '#fff', map: lbl, sh: 2 }), all: m.card });
    Bx.box(0, -12, -13.6, 38, 22, .8, m.card); for (const sx of [-1, 1]) Bx.box(sx * 18.6, -12, 0, .8, 22, 28, m.card);
    Bx.box(0, -23.4, 18.6, 38, .6, 10, m.cardDark, { rx: 38 }); Bx.box(0, -23.4, -18.6, 38, .6, 10, m.cardDark, { rx: -38 });
    Bx.box(23.5, -23.4, 0, 10, .6, 26, m.cardDark, { rz: -36 }); Bx.box(-23.5, -23.4, 0, 10, .6, 26, m.cardDark, { rz: 36 });
    Bx.box(0, -1.4, 0, 36.4, .4, 26.4, M({ c: '#d8cfb0' })); // crumpled tissue at the bottom
    Bx.shadow(0, 0, 0, 46, 36, .6, { sq: true });
  }
  function sideTable(B, x, z) { // Gran's little side table by the front door
    const m = mm(), P = B.at(x, GY, z);
    P.rbox(0, -61, 0, 28, 2.4, 44, .4, m.wood); for (const [a, b] of [[-11, -19], [11, -19], [-11, 19], [11, 19]]) P.cyl(a, -30, b, 1.1, .9, 60, 8, m.wood);
    P.box(0, -16, 0, 24, 1.2, 40, m.wood); P.shadow(0, 0, 0, 34, 50, .55, { sq: true });
  }

  // ================================================================ the per-room decoration sets (built once, then shown/hidden)
  const DEC = {}; // rid -> { group, parts: { all, day, tail } }
  const BUILDERS = {
    hall(r, P) {
      const B = K.into(P.all.batch);
      chain(B, [207, GC + 6, 64], [207, GC + 6, 250], 16); chain(B, [207, GC + 6, 250], [207, GC + 6, 470], 18); chain(B, [207, GC + 6, 570], [207, GC + 6, 696], 12);
      chain(B, [209, GC + 6, 62], [408, GC + 6, 62], 20);
      pumpkinLights(B, swag([214, GC + 9, 696.5], [404, GC + 9, 696.5], 15, 24), 13);
      const hub = cobweb(B, [408.5, GC + .5, 698.5], [-1, 0, 0], [0, 0, -1], 30, 3); spider(B, hub.x - .8, hub.y + 1.2, hub.z + .6, .9, 30);
      sideTable(B, 224, 674); witchHat(B, 224, GY - 62.6, 687, .9, -20);
      decorBox(B);
      P.blocks.push(H.block('G', 207, 650, 241, 698, { off: true }), H.block('G', 215, 314, 257, 346, { off: true }));
    },
    lounge(r, P) {
      const B = K.into(P.all.batch);
      chain(B, [-278, GC + 41, 307.5], [-120, GC + 41, 307.5], 20); chain(B, [-120, GC + 41, 307.5], [40, GC + 41, 307.5], 20); chain(B, [40, GC + 41, 307.5], [193, GC + 41, 307.5], 20);
      const hub = cobweb(B, [194.5, GC + .5, 699.5], [-1, 0, 0], [0, 0, -1], 34, 11); spider(B, hub.x - 1, hub.y + 1, hub.z + .5, 1, -20);
      cobweb(B, [-279.5, GC + .5, 699.5], [1, 0, 0], [0, 0, -1], 26, 17);
      cauldron(B, -62, GY - 43.5, 433);
    },
    kitchen(r, P) {
      const B = K.into(P.all.batch);
      soupPot(B, -24, GY - 95.2, -38); fingersTray(B, -172, GY - 93, -13, 4);
      cobweb(B, [-279.5, GC + .5, 292.5], [1, 0, 0], [0, 0, -1], 24, 23);
    },
    drive(r, P) {
      const B = K.into(P.all.batch);
      pumpkinStatic(B, 480, GY - 70, 1095, .7, 200, 'lantern');
      turnip(B, -112, 298, 708.5, 10); pumpkinStatic(B, -14, 298, 708.5, .55, -10, 'lantern2', .5); pumpkinStatic(B, 30, 298, 709, .42, 20, 'plain', .5);
      gravestone(B, 74, GY + .4, 846, 40); sheetGhost(B, -96, GY + .4, 914, 25);
      bat(B, 300, GY - 205, 712, .9, 180, 8);
      P.blocks.push(H.block('G', 56, 832, 92, 862, { off: true }), H.block('G', -120, 890, -72, 938, { off: true }));
    },
    garden(r, P) {
      const B = K.into(P.all.batch);
      pumpkinLights(B, swag([-293, GY - 187, -394.5], [-212, GY - 221, -394.5], 6, 16), 9); pumpkinLights(B, swag([-212, GY - 221, -394.5], [-131, GY - 187, -394.5], 6, 16), 9);
      pumpkinStatic(B, 30, GY - .3, -82, .85, 200, 'lantern2'); pumpkinStatic(B, -14, GY - .3, -86, .7, 160, 'plain');
      P.blocks.push(H.block('G', 14, -98, 46, -66, { off: true }), H.block('G', -28, -100, 0, -72, { off: true }));
    },
  };
  function buildDecor(rid) {
    const r = H.ROOMS[rid]; if (!r || !r.built || DEC[rid] || !BUILDERS[rid]) return;
    const group = new T.Group(); group.name = 'seasonal:' + EID + ':' + rid; group.visible = false; r.group.add(group);
    const P = { blocks: [] }; for (const k of ['all', 'day', 'tail']) { const g = new T.Group(); g.name = group.name + ':' + k; group.add(g); P[k] = { group: g, batch: K.batch() }; }
    try { BUILDERS[rid](r, P); } catch (e) { console.error('halloween decor', rid, e); }
    for (const k of ['all', 'day', 'tail']) { P[k].batch.build(P[k].group); P[k].group.traverse(o => { if (o.isMesh && (o.material === mats.web || o.material?.transparent)) o.userData.noPick = true; }); }
    DEC[rid] = { group, P };
    sync();
  }
  function showDecor() {
    let blocks = false;
    for (const rid in DEC) {
      const d = DEC[rid]; d.group.visible = on; d.P.day.group.visible = phase === 'day' || phase === 'tail'; d.P.tail.group.visible = phase === 'tail';
      for (const b of d.P.blocks) if (b.off === on) { b.off = !on; blocks = true; }
    }
    if (blocks) H._.grids.dirty = true;
  }

  // ================================================================ interactive pieces (registered only while the event is on)
  const IT = {}; // id -> { kind:'thing'|'spot'|'snap' }
  const PICKM = new T.MeshBasicMaterial({ visible: false });
  function addSpot(id, def) { H.spot(id, def); IT[id] = 'spot'; return H.SPOTS[id]; }
  function addThing(id, def) { const t = R.grabbable(id, Object.assign({ noSave: true }, def)); if (t) { t.noSave = true; IT[id] = 'thing'; } return t; }
  function addSnap(id, def) { R.addSnap(id, def); IT[id] = 'snap'; return H.SNAPS[id]; }
  function removeAll() {
    if (H.held() && IT[H.held()] === 'thing') H.putBack();
    for (const id in IT) {
      if (IT[id] === 'thing') { const t = H.THINGS[id]; if (t) { t.obj.parent?.remove(t.obj); delete H.THINGS[id]; } H.unspot(id); }
      else if (IT[id] === 'spot') { const s = H.SPOTS[id]; if (s?.obj?.userData?.hwOwn) s.obj.parent?.remove(s.obj); H.unspot(id); }
      else delete H.SNAPS[id];
      delete IT[id];
    }
    built.items = false; H.dirty();
  }
  const built = { items: false };
  function pickBox(r, x, y, z, w, h, d) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), PICKM); m.position.set(x, y, z); m.userData.hwOwn = 1; r.group.add(m); return m; }
  function setAt(t, room, p, snapId) { // put a grab-API thing at a pose (a saved server state), resting or snapped
    t.at = { room, x: p.x, y: p.y, z: p.z, ry: p.ry || 0 }; t.rx = p.rx || 0; t.rz = p.rz || 0;
    t.st = snapId ? 'snap' : 'rest'; t.snap = snapId || null;
    const rr = H.ROOMS[room]; if (rr && t.obj.parent !== rr.things) rr.things.add(t.obj);
    H.place(t); H.layerFor(t);
  }

  // ---------------------------------------------------------------- {sister}'s decorations: five things, five glowing places
  const DECOR = {
    bat: { label: 'a rubber bat', room: 'hall', home: { x: 228, y: GY - 1.6, z: 326, ry: 20 }, snap: { x: 268, y: GC + 15, z: 420, ry: 90 }, box: [16, 16, 16], hint: 'Hang the bat from the ceiling' },
    web: { label: 'a stretchy cobweb', room: 'hall', home: { x: 240, y: GY - 1.6, z: 334, ry: 0 }, snap: { x: 216, y: GC + 9, z: 71, ry: 0 }, box: [20, 18, 20], hint: 'Stretch the cobweb into the corner' },
    spider: { label: 'a plastic spider', room: 'hall', home: { x: 247, y: GY - 1.6, z: 324, ry: 40 }, snap: { x: 208.6, y: GY - 180.2, z: 300, ry: 90 }, box: [8, 4, 8], hint: 'The spider goes on top of the mirror' },
    lantern: { label: 'a paper lantern', room: 'lounge', home: null, snap: { x: -239, y: GY - 114.2, z: 442, ry: 90 }, box: [12, 18, 12], hint: 'The lantern goes on the mantelpiece' },
    ghost: { label: 'a little hanging ghost', room: 'lounge', home: null, snap: { x: -60, y: 134 + 46, z: 686, ry: 180 }, box: [22, 46, 10], hint: 'Hang the ghost from the curtain pole in the window' },
  };
  DECOR.lantern.home = { x: 232, y: GY - 1.6, z: 338, ry: 0 }; DECOR.ghost.home = { x: 244, y: GY - 1.6, z: 336, ry: -30 };
  function decorModel(id) {
    const g = new T.Group(), packed = new T.Group(), up = new T.Group(); g.add(packed, up); packed.name = 'packed'; up.name = 'up';
    const P = K.into(packed), U = K.into(up), m = mm();
    if (id === 'bat') { const make = (B, th) => bat(B, 0, -6, 0, .9, 0, th); make(P, 0); make(U, 30); }
    if (id === 'spider') { spider(P, 0, -1.2, 0, 1.3, 0); spider(U, 0, -1.2, 0, 1.3, 0); }
    if (id === 'web') { P.ball(0, -3.4, 0, 4.2, 3.4, 3.8, m.web, 10); P.ball(1.5, -2.2, 1, 2.4, 2, 2.2, M({ c: '#f2f2ec', sh: 4 }), 8); cobweb(U, [-9, -18, -9], [1, 0, 0], [0, 0, 1], 26, 41); }
    if (id === 'lantern') { const lt = (B) => { B.cyl(0, -.5, 0, 3.6, 3.6, 1, 12, M('#2a2a2a')); B.lathe(0, -1, 0, [[1.8, -15], [4, -13.4], [5.4, -9], [5.6, -6], [5, -2.4], [3.6, 0]], 14, M({ c: '#f08a2a', e: '#7a2a00', side: 2, sh: 4 })); for (let i = 0; i < 5; i++) B.geo(new T.TorusGeometry(5.1 - Math.abs(i - 2) * .55, .12, 3, 16), 0, -3.4 - i * 2.4, 0, M('#2a2a2a'), { rx: 90 }); B.cyl(0, -15.6, 0, 2, 2, 1.2, 10, M('#2a2a2a')); B.geo(new T.TorusGeometry(1.4, .15, 3, 10), 0, -17.4, 0, M('#2a2a2a')); }; lt(P); lt(U); }
    if (id === 'ghost') { // a little cloth ghost: round head, stubby arms, a hem that hangs in folds
      const gh = (B, str) => {
        B.lathe(0, 0, 0, [[0, -24], [3.4, -23.4], [5.8, -21.4], [6.9, -18.4], [6.9, -15], [6.3, -12.6], [7, -9], [8.6, -4.6], [9.8, -1.6], [10, -.4], [9.2, 0]], 18, m.sheet2);
        for (let i = 0; i < 9; i++) { const a = (i + .5) / 9 * Math.PI * 2; B.ball(Math.sin(a) * 9.1, -.9, Math.cos(a) * 9.1, 2.4, 1.6, 1.5, m.sheet2, 8, { ry: a / D2R }); }
        for (const sx of [-1, 1]) B.ball(sx * 7.4, -10.6, 1, 3.2, 1.6, 1.8, m.sheet2, 8, { rz: sx * -30 });
        for (const sx of [-2.1, 2.1]) B.ball(sx, -18, 6.3, 1.05, 1.6, .6, m.eye, 8);
        B.ball(0, -14.4, 6.6, 1.3, 1.1, .6, m.eye, 8);
        if (str) B.cyl(0, -24 - str / 2, 0, .1, .1, str, 3, M('#ddd'));
      }; gh(P, 0); gh(U, 22);
    }
    up.visible = false;
    K.into(packed).shadow(0, 0, 0, 10, 10, .4);
    return g;
  }
  function buildDecorItems() {
    for (const id in DECOR) {
      const d = DECOR[id], tid = 'hw.decor.' + id, sid = 'hw.s.' + id;
      const t = addThing(tid, { obj: decorModel(id), home: Object.assign({ room: 'hall' }, d.home), kind: 'hw.decor.' + id, label: cast("{sister}'s box: ") + d.label, holdD: 42 });
      if (!t) continue;
      addSnap(sid, { room: d.room, x: d.snap.x, y: d.snap.y, z: d.snap.z, r: 34, box: d.box, pose: Object.assign({}, d.snap), hint: d.hint, accepts: k => k === 'hw.decor.' + id,
        onSnap: () => { decorUp(id, true); Season.step(EID, 'hw-decorate', id); snd.pop(); if (id === 'bat') say('hw.sis.bat', '{sister}', "Higher! No, lower! Perfect. It's watching you.", true); if (id === 'ghost') say('hw.sis.ghost', '{sister}', 'Now the whole street can see him. His name is Gerald.', true); } });
    }
  }
  function decorUp(id, up) {
    const t = H.THINGS['hw.decor.' + id]; if (!t) return;
    t.obj.getObjectByName('packed').visible = !up; t.obj.getObjectByName('up').visible = up;
    t.canGrab = up ? () => false : null; const s = H.SPOTS['hw.decor.' + id]; if (s) s.off = up; H.dirty();
  }
  function syncDecorItems() {
    const placed = srv().decor || {};
    for (const id in DECOR) {
      const t = H.THINGS['hw.decor.' + id]; if (!t || t.st === 'held' || t.st === 'anim') continue;
      if (placed[id]) { if (t.snap !== 'hw.s.' + id) setAt(t, DECOR[id].room, DECOR[id].snap, 'hw.s.' + id); decorUp(id, true); }
      else if (t.st === 'snap' && t.snap === 'hw.s.' + id) { setAt(t, 'hall', DECOR[id].home); decorUp(id, false); }
    }
  }

  // ---------------------------------------------------------------- the porch light: a switch by the front door
  let porchRocker = null;
  function buildPorch() {
    const hall = H.ROOMS.hall; if (!hall?.built) return;
    const g = new T.Group(); g.position.set(354, GY - 118, 697.4); g.rotation.y = Math.PI; g.userData.hwOwn = 1; hall.group.add(g); const B = K.into(g);
    B.rbox(0, 0, 0, 8, 10, 1.2, .35, M({ c: '#efece4', sh: 20, sp: '#222' }));
    for (const yy of [-3.7, 3.7]) B.cyl(0, yy, .7, .35, .35, .2, 10, mm().metal, { rx: 90 });
    porchRocker = B.rbox(0, 0, .9, 3.4, 5.4, .8, .25, M('#d6d0c2')); porchRocker.matrix.decompose(porchRocker.position, porchRocker.quaternion, porchRocker.scale); porchRocker.matrixAutoUpdate = true;
    const lab = K.tex('hw.porchlabel', 64, 24, (gg, w, h) => { gg.fillStyle = '#f4f0e0'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#333'; gg.font = '700 13px "Courier New",monospace'; gg.textAlign = 'center'; gg.fillText('PORCH', w / 2, 17); }, { clamp: true });
    B.box(0, -7.2, .1, 6, 2.2, .3, { f: M({ c: '#fff', map: lab }), all: M('#e8e4d8') });
    addSpot('hw.porch', { label: () => porchOn() ? 'Porch light: switch off' : 'Porch light: switch on', obj: g, room: 'hall', act: () => { SE.step(EID, 'hw-lights', 'on'); snd.click(); window.Sound?.world?.('switch'); } });
    // Mom's note about the clocks, stuck on the wall above the side table (a real slip of paper with thickness)
    noteTex = K.tex('hw.clocknote', 192, 256, () => {}, { clamp: true });
    const ng = new T.Group(); ng.position.set(205.25, GY - 100, 690); ng.userData.hwOwn = 1; hall.group.add(ng);
    K.into(ng).box(0, 0, 0, .25, 15, 11.5, { r: M({ c: '#fff', map: noteTex, sh: 4 }), all: M('#efe08a') }, { rz: 3 });
    K.into(ng).box(.2, -6.6, 0, .3, 1, 1, M({ c: '#d02a2a', sh: 60 }));
    addSpot('hw.clocknote', { label: "Mom's note", obj: ng, room: 'hall', act: () => think("Mom's note", SE.today().md < 1031 ? 'CLOCKS GO BACK on Saturday night (2am Sunday). Extra hour in bed! Mom x' : 'The clocks went back last night. That extra hour in bed was the best hour of the year.') });
    paintNote();
  }
  let noteTex = null;
  function paintNote() {
    if (!noteTex) return; const g = noteTex.userData.g, w = 192, h = 256, before = SE.today().md < 1031;
    g.fillStyle = '#f7e98e'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, 26);
    g.fillStyle = '#1a3a9a'; g.textAlign = 'center'; g.font = '700 30px "Comic Sans MS","Z003",cursive';
    (before ? ['CLOCKS GO', 'BACK', 'Sat night!'] : ['Clocks went', 'back last', 'night!']).forEach((l, i) => g.fillText(l, w / 2, 70 + i * 38));
    g.font = '24px "Comic Sans MS","Z003",cursive'; g.fillText(before ? 'Extra hour in bed!' : 'Extra hour in bed', w / 2, 190); g.fillStyle = '#c01a4a'; g.fillText('Mom x', w - 50, h - 22);
    noteTex.needsUpdate = true; H.dirty();
  }
  const porchOn = () => !!srv().porch;

  // ---------------------------------------------------------------- the sweets bowl, the tin of sweets
  const SWEETS = E.sweets, BOWL = { room: 'hall', x: 224, y: GY - 62.2, z: 663, ry: 10 };
  const sweetGeo = (() => { const p = [[0, -2.6], [.9, -2.4], [.35, -1.6], [.85, -1], [1.05, 0], [.85, 1], [.35, 1.6], [.9, 2.4], [0, 2.6]].map(([r, y]) => new T.Vector2(r, y)); const g = new T.LatheGeometry(p, 8); g.rotateZ(Math.PI / 2); return g; })();
  let bowlInst = null, bowlSlots = [];
  function bowlModel() {
    const g = new T.Group(), B = K.into(g);
    B.lathe(0, 0, 0, [[0, -.6], [4.6, -.6], [8, -2.6], [10.2, -6.4], [10.8, -9], [11.2, -9.2], [11.4, -8.8], [10.6, -6.2], [8.4, -2], [5, 0], [0, 0]], 28, M({ c: '#3a2a6a', sh: 60, sp: '#888', side: 2 }));
    B.lathe(0, -1, 0, [[0, -.4], [4.4, -.4], [7.6, -2.4], [9.8, -6.2], [10.4, -8.8]], 28, M({ c: '#e6e0ce', sh: 40, side: 2 }));
    B.shadow(0, 0, 0, 26, 26, .5);
    // up to 40 visible sweets in one instanced draw (each a wrapped sweet with twisted ends, in its wrapper colour)
    const mat = new T.MeshPhongMaterial({ color: 0xffffff, shininess: 70, specular: 0x666666 });
    bowlInst = new T.InstancedMesh(sweetGeo, mat, 48); bowlInst.userData.thing = 1;
    const r = rnd(77); bowlSlots = [];
    for (let i = 0; i < 48; i++) { const layer = Math.floor(i / 12), a = i * 2.4 + r() * .4, rr = (layer < 2 ? 3 + (i % 12) / 12 * 5.4 : 2 + r() * 4) * (1 - layer * .1); bowlSlots.push({ x: Math.cos(a) * rr, y: -2.2 - layer * 1.5 - (rr < 4 ? 0 : (rr - 4) * .55), z: Math.sin(a) * rr, rx: r() * 3, ry: r() * 6, rz: r() * .6 }); }
    // (instance colours exist from the start, sized for all 48: the shader never changes later)
    for (let i = 0; i < 48; i++) { bowlInst.setMatrixAt(i, _m4.identity()); bowlInst.setColorAt(i, _c.set('#ffffff')); }
    bowlInst.count = 0;
    g.add(bowlInst);
    return g;
  }
  const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3(1, 1, 1), _c = new T.Color();
  let bowlMap = [];
  function paintBowl(counts) {
    if (!bowlInst) return;
    counts = counts || srv().bowl || []; bowlMap = [];
    const total = counts.reduce((a, b) => a + b, 0), show = Math.min(48, total), seq = [];
    const left = counts.slice(); while (seq.length < show) for (let k = 0; k < left.length && seq.length < show; k++) if (left[k] > 0) { left[k]--; seq.push(k); }
    for (let i = 0; i < show; i++) {
      const s = bowlSlots[i], k = seq[i]; _e.set(s.rx, s.ry, s.rz); _q.setFromEuler(_e); _p.set(s.x, s.y, s.z); _m4.compose(_p, _q, _s); bowlInst.setMatrixAt(i, _m4);
      _c.set(SWEETS[k].wrap); bowlInst.setColorAt(i, _c); bowlMap[i] = k;
    }
    bowlInst.count = show; bowlInst.instanceMatrix.needsUpdate = true; if (bowlInst.instanceColor) bowlInst.instanceColor.needsUpdate = true; H.dirty();
  }
  const bowlTotal = () => (srv().bowl || []).reduce((a, b) => a + b, 0);
  function tinModel() {
    const g = new T.Group(), B = K.into(g), t = K.tex('hw.tin', 256, 64, (gg, w, h) => { gg.fillStyle = '#6a1a6a'; gg.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { gg.fillStyle = ['#f0a020', '#2ab04a', '#f4f0e0'][i % 3]; gg.beginPath(); gg.arc(14 + i * 29, 46, 7, 0, 7); gg.fill(); } gg.fillStyle = '#ffd040'; gg.font = '700 20px Arial,sans-serif'; gg.textAlign = 'center'; gg.fillText('FUN-SIZE PARTY TIN', w / 2, 26); }, { clamp: true });
    B.cyl(0, -8, 0, 10, 10, 16, 24, M({ c: '#fff', map: t, sh: 60, sp: '#999' })); B.cyl(0, -16.6, 0, 10.5, 10.5, 1.6, 24, M({ c: '#6a1a6a', sh: 60, sp: '#999' }));
    B.shadow(0, 0, 0, 24, 24, .55); return g;
  }
  function buildBowl() {
    const t = addThing('hw.bowl', { obj: bowlModel(), home: Object.assign({}, BOWL), kind: 'hw.bowl', label: () => 'The sweets bowl' + (bowlTotal() ? ' (' + bowlTotal() + ' sweets)' : ' (empty)'), holdD: 46, useLabel: 'Hand out sweets', use: () => handOut() });
    if (t) t.faceYou = false;
    addThing('hw.tin', { obj: tinModel(), home: { room: 'cupboard', x: 348, y: GY, z: 422, ry: -30 }, kind: 'hw.tin', label: () => 'Tin of fun-size sweets' + (srv().tin > 0 ? '' : ' (empty)'), holdD: 50 });
    addSnap('hw.s.bowl', { room: 'hall', x: BOWL.x, y: BOWL.y - 12, z: BOWL.z, r: 30, box: [26, 14, 26], pose: { x: BOWL.x, y: BOWL.y, z: BOWL.z + 22, ry: 0 }, hint: 'Pour the sweets into the bowl',
      enabled: () => H.THINGS['hw.bowl']?.st === 'rest' && H.THINGS['hw.bowl'].at.room === 'hall',
      accepts: (k) => k === 'hw.tin' && srv().tin > 0, onSnap: () => pour() });
    paintBowl();
  }
  function pour() {
    const t = H.THINGS['hw.tin']; if (!t) return;
    const first = !done('hw-bowl'); snd.rattle(); setTimeout(snd.rattle, 260); setTimeout(snd.rattle, 520);
    if (first) Season.step(EID, 'hw-bowl', 'fill'); else Season.send({ t: 'seTop', e: EID });
    const o = t.obj, r0 = o.rotation.z; let t0 = performance.now();
    H.anims.set('hw.pour', now => { const k = Math.min(1, (now - t0) / 1100); o.rotation.z = r0 - Math.sin(k * Math.PI) * 1.9; H.dirty(); if (k >= 1) { o.rotation.z = r0; setTimeout(() => { if (H.THINGS['hw.tin'] && H.held() !== 'hw.tin') setAt(H.THINGS['hw.tin'], 'cupboard', H.THINGS['hw.tin'].home); }, 400); return false; } return true; });
    if (first) setTimeout(() => { say('c4.hal.treat.dad', 'Dad', "What? I'm checking quality.", true); setTimeout(() => say('c4.hal.treat.mom', 'Mom', 'Put them back!', true), 2600); }, 1800);
  }

  // ---------------------------------------------------------------- the carved pumpkin (the kitchen table) and its six steps
  const PK = { R: 15, Hh: 12, vLid: .2, x: -45, z: 174, y: GY - 77 };
  let pk = null; // the model and its state
  function buildPumpkin() {
    const kit = H.ROOMS.kitchen; if (!kit || pk) return;

    const m = mm(), root = new T.Group(); root.name = 'hw-carving-pumpkin'; root.position.set(PK.x, PK.y, PK.z); root.rotation.y = 0; root.userData.hwOwn = 1;
    // the skin canvas: painted once, faces cut into its alpha as the player carves
    const skin = K.tex('hw.skin.carve', 1024, 512, (g, w, h) => paintSkin(g, w, h, { seed: 99 }), { clamp: true }); skin.flipY = false; skin.needsUpdate = true;
    const mSkin = new T.MeshPhongMaterial({ color: 0xffffff, map: skin, alphaTest: .5, shininess: 26, specular: new T.Color('#3a2410') });
    const mIn = new T.MeshPhongMaterial({ color: new T.Color('#efb460'), side: T.BackSide, shininess: 4, emissive: new T.Color('#000') });
    const body = new T.Group(); body.position.y = -PK.Hh; root.add(body);
    const outer = new T.Mesh(gourd(PK.R, PK.Hh, { v0: PK.vLid, seg: 56, rows: 26 }), mSkin), inner = new T.Mesh(gourd(PK.R, PK.Hh, { v0: PK.vLid, seg: 40, rows: 18, s: .9 }), mIn);
    const rim = new T.Mesh(rimRing(PK.R, PK.Hh, PK.vLid, .9, { seg: 56 }), m.cut);
    body.add(outer, inner, rim);
    // the lid: the same skin, its own inner shell and cut edge, and the stalk
    const lid = new T.Group(); body.add(lid);
    lid.add(new T.Mesh(gourd(PK.R, PK.Hh, { v1: PK.vLid, seg: 56, rows: 6 }), mSkin), new T.Mesh(gourd(PK.R, PK.Hh, { v1: PK.vLid, seg: 40, rows: 4, s: .9 }), mIn), new T.Mesh(rimRing(PK.R, PK.Hh, PK.vLid, .9, { seg: 56 }), m.cut));
    K.into(lid).cyl(.3, -PK.Hh - 2.6 + 2.6 * .22, 0, 1.1, 1.6, 5.4, 8, m.stalk, { rz: 10 });
    // the guide ring for the lid cut, and the seeds and strings inside
    const guide = new T.Mesh(new T.TorusGeometry(PK.R * Math.sin(Math.PI * PK.vLid) * 1.03, .22, 4, 48), M({ c: '#3a3a8a', e: '#202060' })); guide.rotation.x = Math.PI / 2;
    guide.position.y = -Math.cos(Math.PI * PK.vLid) * (PK.Hh - PK.Hh * .22 * Math.pow(1 - Math.sin(Math.PI * PK.vLid), 3)) - .2; body.add(guide);
    const guts = new T.Group(); body.add(guts); const GU = K.into(guts), r = rnd(5);
    const gutM = M({ c: '#e89a3a', sh: 30, sp: '#553' }), seedM = M({ c: '#f2e6c0', sh: 20 });
    const blobs = [];
    for (let i = 0; i < 12; i++) { const a = r() * 6.28, rr = r() * 6.5, y = -6 + r() * 7, b = new T.Group(); b.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); guts.add(b); const BB = K.into(b); BB.ball(0, 0, 0, 2.4 + r() * 1.4, 1.6 + r(), 2.2 + r(), gutM, 7); for (let k = 0; k < 3; k++) BB.ball((r() - .5) * 3, -1, (r() - .5) * 3, .7, .3, .45, seedM, 5); blobs.push(b); }
    // the stencil: a sheet of paper stuck to the front, conforming to the curve
    const sten = K.tex('hw.stencil', 512, 512, () => {}, { clamp: true }); sten.flipY = false;
    const stencil = new T.Mesh(gourd(PK.R, PK.Hh, { u0: .5 - .14, u1: .5 + .14, v0: .3, v1: .72, seg: 16, rows: 10, s: 1.012, uvLocal: true }), new T.MeshPhongMaterial({ color: 0xffffff, map: sten, shininess: 4, side: T.DoubleSide }));
    stencil.visible = false; body.add(stencil);
    // the tea-light (on the table, then inside) and its flame
    const tl = new T.Group(); root.add(tl); const TL = K.into(tl); TL.cyl(0, -.8, 0, 2, 2, 1.6, 14, m.metal); TL.cyl(0, -1.65, 0, 1.8, 1.8, .2, 14, m.wax); TL.cyl(0, -2.1, 0, .08, .08, .8, 3, M('#222'));
    const flame = new T.Mesh(new T.ConeGeometry(.5, 1.9, 8), m.flame); flame.rotation.x = Math.PI; flame.position.y = -3.2; tl.add(flame); flame.visible = false;
    kit.group.add(root);
    // the table's props: newspaper (spread), the tools, {sister}'s sheet of faces, the bowl for the guts
    const news = new T.Group(); kit.group.add(news); news.position.set(PK.x, PK.y, PK.z); const NW = K.into(news), nt = K.tex('hw.news', 256, 256, (g, w, h) => { g.fillStyle = '#e8e4d6'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = '700 26px Georgia,serif'; g.fillText('THE DAILY', 12, 34); g.fillRect(10, 42, w - 20, 2); g.fillStyle = '#999'; for (let i = 0; i < 30; i++) g.fillRect(12 + (i % 3) * 80, 56 + Math.floor(i / 3) * 18, 70, 6); g.fillStyle = '#bbb'; g.fillRect(170, 60, 70, 60); });
    NW.box(-4, -.12, 0, 46, .24, 34, M({ c: '#fff', map: nt, sh: 2 }), { ry: 6 }); NW.box(14, -.36, -8, 40, .24, 30, M({ c: '#fff', map: nt, sh: 2 }), { ry: -14 }); NW.box(-18, -.6, 9, 36, .24, 28, M({ c: '#fff', map: nt, sh: 2 }), { ry: 24 });
    news.visible = false;
    const tools = new T.Group(); kit.group.add(tools); tools.position.set(PK.x, PK.y, PK.z); const TO = K.into(tools);
    const saw = makeSaw(), spoon = makeSpoon(); tools.add(saw, spoon); saw.position.set(22, -.9, -6); saw.rotation.set(0, 30 * D2R, 0); spoon.position.set(23, -1.2, 8); spoon.rotation.set(0, -20 * D2R, 0);
    TO.lathe(-26, 0, -12, [[0, -.5], [4, -.5], [7.6, -3], [9, -6], [9.4, -6.4], [9.8, -6], [8.2, -2.6], [4.4, 0], [0, 0]], 24, M({ c: '#d8d4cc', sh: 50, sp: '#888' }));
    TO.shadow(-26, 0, -12, 22, 22, .5);
    const bowlGuts = new T.Group(); tools.add(bowlGuts); bowlGuts.position.set(-26, -2.6, -12);
    const facesTex = K.tex('hw.faces.' + sis(), 512, 512, (g, w, h) => paintFaceSheet(g, w, h), { clamp: true, identity: true });
    const sheet = new T.Mesh(new T.BoxGeometry(24, .2, 24), [M('#eeeadb'), M('#eeeadb'), M('#eeeadb'), M({ c: '#fff', map: facesTex, sh: 2 }), M('#eeeadb'), M('#eeeadb')]); sheet.position.set(-25, -.15, 14); sheet.rotation.y = 12 * D2R; tools.add(sheet);
    tl.position.set(18, 0, 18);
    for (const g of [news, tools]) g.traverse(o => { o.userData.noPick = false; });
    pk = { root, body, outer, inner, lid, guide, guts, blobs, stencil, sten, skin, mSkin, mIn, tl, flame, news, tools, saw, spoon, sheet, bowlGuts, cut: {}, face: null, wob: [], lidOff: false };
    root.traverse(o => { if (o.isMesh) o.userData.own = 1; });
    // the newspaper bundle on the chair and the table snap it opens out on
    const bundle = new T.Group(), BU = K.into(bundle); BU.box(0, -1.6, 0, 30, 3.2, 22, M({ c: '#fff', map: nt, sh: 2 })); BU.box(0, -3.3, 0, 30.4, .2, 22.4, M('#e8e4d6')); BU.shadow(0, 0, 0, 34, 26, .5, { sq: true });
    addThing('hw.paper', { obj: bundle, home: { room: 'kitchen', x: -130, y: GY - 45.5, z: 170, ry: 80 }, kind: 'hw.paper', label: 'Old newspapers', holdD: 44 });
    addSnap('hw.s.paper', { room: 'kitchen', x: PK.x, y: PK.y - 1, z: PK.z, r: 40, box: [50, 2, 40], pose: { x: PK.x, y: PK.y, z: PK.z, ry: 0, hide: true }, hide: true, hint: 'Spread the newspaper on the table', accepts: k => k === 'hw.paper',
      onSnap: () => { snd.rustle(); Season.step(EID, 'hw-pumpkin', 'paper'); pk.news.visible = true; say('c4.hal.dad', 'Dad', 'Right, pumpkin. How hard can it be? Mind your fingers, now.', true); H.dirty(); } });
    addSpot('hw.pumpkin', { label: () => pumpkinLabel(), obj: pk.root, room: 'kitchen', range: 220, act: () => carve() });
    syncPumpkin();
  }
  function paintFaceSheet(g, w, h) {
    g.fillStyle = '#f2eedf'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,120,200,.25)'; for (let y = 40; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#c0202a'; g.font = '700 30px "Comic Sans MS","Z003",cursive'; g.textAlign = 'center'; g.fillText(cast('PICK A FACE! love {sister}'), w / 2, 36, w - 20);
    FACE_ORDER.forEach((f, i) => {
      const cx = (i % 2 + .5) * w / 2, cy = (Math.floor(i / 2) + .5) * (h - 60) / 2 + 52;
      g.fillStyle = '#f08a24'; g.beginPath(); g.ellipse(cx, cy, 86, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#8a4a10'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#2a1a0a'; for (const poly of FACES[f]) { g.beginPath(); poly.forEach(([x, y], k) => { const px = cx + x * 9.5, py = cy + y * 8.5; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill(); }
      g.fillStyle = '#2a3a8a'; g.font = '22px "Comic Sans MS","Z003",cursive'; g.fillText((i + 1) + '. ' + FACE_NAMES[f], cx, cy + 96);
    });
  }
  function makeSaw() { const g = new T.Group(), B = K.into(g); B.rbox(0, -1, -5, 2.2, 2, 8, .5, M({ c: '#e8761c', sh: 30 })); B.box(0, -1, 3.4, .25, 1.6, 9, mm().metal); for (let i = 0; i < 8; i++) B.box(0, -.15, -.4 + i * 1.1, .26, .4, .5, mm().metal, { rx: 45 }); return g; }
  function makeSpoon() { const g = new T.Group(), B = K.into(g); B.box(0, -.6, -6, 1.6, .5, 13, mm().metal); B.lathe(0, -.6, 3.6, [[0, -1.5], [2.2, -1.2], [3, -.3], [3.1, 0]], 14, M({ c: '#aab0b4', sh: 70, sp: '#aaa', side: 2 }), { sx: .8 }); return g; }
  function pumpkinLabel() {
    const s = srv().steps?.['hw-pumpkin'] || {};
    if (done('hw-pumpkin')) return 'My jack-o\'-lantern';
    if (!s.paper) return 'The pumpkin (newspaper on the table first)';
    if (!s.lid) return 'The pumpkin: cut the lid';
    if (!s.scoop) return 'The pumpkin: scoop it out';
    if (!s.face) return 'The pumpkin: pick a face';
    if (!s.carve) return 'The pumpkin: carve the face';
    if (!s.candle) return 'The pumpkin: the tea-light';
    return 'My jack-o\'-lantern';
  }
  // the server's carving state -> the model (refresh safe)
  function syncPumpkin() {
    if (!pk) return;
    const s = srv().steps?.['hw-pumpkin'] || {}, cv = srv().carve;
    pk.news.visible = !!s.paper && !s.place;
    const tp = H.THINGS['hw.paper']; if (tp && tp.st !== 'held') { if (s.paper) { tp.obj.visible = false; tp.at.hide = true; tp.canGrab = () => false; } else { tp.at.hide = false; tp.obj.visible = true; tp.canGrab = null; } }
    if (!carving) {
      pk.lidOff = !!s.lid && !s.candle; placeLid(pk.lidOff, true);
      pk.guide.visible = !!s.paper && !s.lid;
      for (const b of pk.blobs) b.visible = !s.scoop;
      fillGutsBowl(s.scoop ? pk.blobs.length : 0);
      if (cv?.face && (s.face || s.carve)) { if (pk.face !== cv.face || (s.carve && !pk.allCut)) { pk.face = cv.face; repaintSkin(s.carve ? FACES[cv.face].map((_, i) => i) : [], s.carve ? cv.wob : []); } }
      else if (pk.face) { pk.face = null; repaintSkin([], []); }
      pk.stencil.visible = !!s.face && !s.carve; if (pk.stencil.visible) paintStencil(-1);
      const lit = !!s.place || done('hw-pumpkin'); pk.flame.visible = lit; pk.mIn.emissive.set(lit ? '#ff8a1e' : '#000');
      pk.tl.position.set(s.candle ? 0 : 18, s.candle ? -1.4 : 0, s.candle ? 0 : 18);
      if (s.candle) pk.tl.parent !== pk.body && pk.body.add(pk.tl); else pk.tl.parent !== pk.root && pk.root.add(pk.tl);
      if (s.candle) pk.tl.position.set(0, PK.Hh - 1.4, 0); else pk.tl.position.set(18, 0, 18);
    }
    // once the tea-light is in, the lantern is a thing you carry; placed, it lives on the front step
    const lantern = !!s.candle;
    if (lantern && !H.THINGS['hw.lantern']) makeLantern();
    const lt = H.THINGS['hw.lantern'];
    if (lt && lt.st !== 'held' && lt.st !== 'anim') { if (s.place) { if (lt.snap !== 'hw.s.step') setAt(lt, 'drive', STEP, 'hw.s.step'); lt.canGrab = () => false; } else if (lt.at.room === 'drive') setAt(lt, 'kitchen', lt.home); }
    if (H.SPOTS['hw.pumpkin']) H.SPOTS['hw.pumpkin'].off = lantern;
    // the morning after: a bit soft, a bit sorry for itself
    pk.root.scale.set(1, phase === 'tail' ? .86 : 1, 1); pk.mSkin.color.set(phase === 'tail' ? '#c8b8a0' : '#ffffff');
    H.dirty();
  }
  const STEP = { x: 300, y: GY - 70, z: 1095, ry: -140 }; // the gatepost: everyone coming up the path sees it
  function makeLantern() {
    if (!pk) return;
    pk.root.parent?.remove(pk.root); pk.root.position.set(0, 0, 0); pk.root.rotation.set(0, 0, 0);
    const holder = new T.Group(); holder.add(pk.root); K.into(holder).shadow(0, 0, 0, 34, 34, .55);
    addThing('hw.lantern', { obj: holder, home: { room: 'kitchen', x: PK.x, y: PK.y, z: PK.z, ry: 0 }, kind: 'hw.lantern', label: () => phase === 'tail' ? 'My jack-o\'-lantern (a bit soft now)' : 'My jack-o\'-lantern', holdD: 52 });
    addSnap('hw.s.step', { room: 'drive', x: STEP.x, y: STEP.y - 2, z: STEP.z, r: 46, box: [32, 2, 32], pose: Object.assign({}, STEP), hint: 'Put it on the gatepost', accepts: k => k === 'hw.lantern',
      onSnap: () => { lightIt(); } });
    H.unspot('hw.pumpkin'); delete IT['hw.pumpkin'];
  }
  function lightIt() {
    say('hw.dad.match', 'Dad', 'Hang on, matches are my job. Long match, arm\'s length... there we go.', true); snd.match();
    setTimeout(() => { if (!pk) return; pk.flame.visible = true; pk.mIn.emissive.set('#ff8a1e'); Season.step(EID, 'hw-pumpkin', 'place'); H.relight(); H.dirty(); setTimeout(() => say('c4.hal.dad.carve', 'Dad', "Is it supposed to look like that? Maybe it's meant to be scary. Because it is.", true), 2400); }, 1300);
  }
  function placeLid(off, now) {
    if (!pk) return; const lid = pk.lid, to = off ? { x: -15, y: PK.Hh * 2 - 2.6, z: -10, rx: 0, rz: 160 * D2R } : { x: 0, y: 0, z: 0, rx: 0, rz: 0 };
    if (now) { lid.position.set(to.x, to.y, to.z); lid.rotation.set(to.rx, 0, to.rz); H.dirty(); return; }
    const f = { x: lid.position.x, y: lid.position.y, z: lid.position.z, rz: lid.rotation.z }, t0 = performance.now();
    H.anims.set('hw.lid', n => { const k = ease(Math.min(1, (n - t0) / 900)); lid.position.set(f.x + (to.x - f.x) * k, f.y + (to.y - f.y) * k - Math.sin(k * Math.PI) * 14, f.z + (to.z - f.z) * k); lid.rotation.z = f.rz + (to.rz - f.rz) * k; H.dirty(); return k < 1; });
  }
  function fillGutsBowl(n) {
    if (!pk) return; const g = pk.bowlGuts; while (g.children.length) g.remove(g.children[0]);
    const B = K.into(g), r = rnd(13), gm = M({ c: '#e89a3a', sh: 30, sp: '#553' });
    for (let i = 0; i < n; i++) { const a = r() * 6.28, rr = r() * 5; B.ball(Math.cos(a) * rr, -1 - i * .25, Math.sin(a) * rr, 2.2, 1.2, 2, gm, 6); }
    H.dirty();
  }
  // cut a face into the skin: template polygons nudged by how the player actually traced them (wob)
  function facePolys(face, wob) {
    return FACES[face].map((poly, i) => { const w = wob?.[i] || [0, 0]; return poly.map(([x, y], k) => { const j = ((k * 37 + i * 11) % 10) / 10; return [x + w[0] * .05 * (.4 + .6 * j), y + w[1] * .05 * (.4 + .6 * (1 - j))]; }); });
  }
  function repaintSkin(cutIdx, wob) {
    const g = pk.skin.userData.g, w = 1024, h = 512; g.save(); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); paintSkin(g, w, h, { seed: 99 });
    if (pk.face) {
      const polys = facePolys(pk.face, wob);
      // marker lines first (they stay round the edges, like the real thing), then the holes
      g.strokeStyle = 'rgba(30,20,60,.75)'; g.lineWidth = 3; for (const poly of polys) { g.beginPath(); poly.forEach(([x, y], k) => { const [px, py] = toPx(x, y, w, h, PK.R, PK.Hh); k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.stroke(); }
      cutFace(g, w, h, PK.R, PK.Hh, cutIdx.map(i => polys[i]));
    }
    g.restore(); pk.skin.needsUpdate = true; pk.allCut = pk.face && cutIdx.length === FACES[pk.face].length; H.dirty();
  }
  // the stencil sheet on the front: faint outlines, the one to cut next in red, cut ones ticked off
  function paintStencil(active) {
    const g = pk.sten.userData.g, w = 512, h = 512; g.clearRect(0, 0, w, h); g.fillStyle = '#f4f0e2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,130,200,.2)'; g.lineWidth = 2; for (let y = 30; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    if (pk.face) FACES[pk.face].forEach((poly, i) => {
      g.beginPath(); poly.forEach(([x, y], k) => { const [px, py] = toPx(x, y, 1024, 512, PK.R, PK.Hh), sx = (px / 1024 - (.5 - .14)) / .28 * w, sy = (py / 512 - .3) / .42 * h; k ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.closePath();
      if (pk.cut[i]) { g.fillStyle = 'rgba(0,0,0,0)'; g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore(); }
      else { g.strokeStyle = i === active ? '#d0201a' : '#2a2a6a'; g.lineWidth = i === active ? 6 : 4; g.setLineDash(i === active ? [] : [10, 6]); g.stroke(); g.setLineDash([]); }
    });
    pk.sten.needsUpdate = true; H.dirty();
  }

  // ---------------------------------------------------------------- carving: a close-up at the table, with the mouse (or a finger)
  let carving = null;
  const TOP = () => ({ x: PK.x, y: PK.y - 66, z: PK.z + 42, ry: 0, rx: -52, lvl: 'G' });
  const FRONT = () => ({ x: PK.x, y: PK.y - 18, z: PK.z + 50, ry: 0, rx: -7, lvl: 'G' });
  function poseOf(p) { return { x: p.x, y: p.y, z: p.z, rx: p.rx, ry: p.ry, lvl: 'G', seat: 1 }; }
  function carve() {
    if (!pk || carving || !on) return;
    const s = srv().steps?.['hw-pumpkin'] || {};
    if (!s.paper) { think('The pumpkin', 'Mom: "Newspaper on the table FIRST, please. That pumpkin is going to be messy." (Old newspapers on the chair.)'); return; }
    if (s.candle) return;
    const next = !s.lid ? 'lid' : !s.scoop ? 'scoop' : !s.face ? 'face' : !s.carve ? 'carve' : 'candle';
    const pose = ['lid', 'scoop'].includes(next) ? TOP() : FRONT();
    if (!H.focus(poseOf(pose), { label: 'Stop carving', ms: 800, enter: () => startStep(next), exit: () => endCarve() })) return;
    carving = { step: next, prog: new Set(), rub: 0, t0: Date.now(), samples: null, wob: [], down: false };
  }
  const bar = document.createElement('div'); bar.className = 'se-bar'; bar.hidden = true; (H.ui?.el || document.body).appendChild(bar);
  function setBar(title, hint, buttons) {
    bar.hidden = false; bar.innerHTML = '';
    const b = document.createElement('b'); b.textContent = title; const sp = document.createElement('span'); sp.className = 'se-hint'; sp.innerHTML = hint; bar.append(b, sp);
    if (buttons?.length) { const row = document.createElement('span'); row.className = 'se-btns'; for (const [label, fn, cls] of buttons) { const bt = document.createElement('button'); bt.type = 'button'; bt.innerHTML = label; if (cls) bt.className = cls; bt.addEventListener('click', ev => { ev.stopPropagation(); fn(); }); row.appendChild(bt); } bar.appendChild(row); }
  }
  function hideBar() { bar.hidden = true; bar.innerHTML = ''; }
  function startStep(step) {
    if (!carving) return; carving.step = step; carving.prog = new Set(); carving.rub = 0;
    const tool = step === 'lid' || step === 'carve' ? pk.saw : step === 'scoop' ? pk.spoon : null;
    carving.tool = tool;
    if (step === 'lid') { pk.guide.visible = true; setBar('Cut the lid', 'Drag the saw round the stalk, along the blue line. Keep your other hand out of the way!'); say('hw.mom.hand', 'Mom', 'Away from your hand, {me}! Saw AWAY from your hand.', true); }
    if (step === 'scoop') { setBar('Scoop it out', 'Hold the button and rub the spoon round inside. Seeds and stringy bits into the bowl. <i>0 / ' + pk.blobs.length + '</i>'); say('hw.sis.scoop', '{sister}', 'Ewww! It looks like brains. Can I keep the seeds?', true); }
    if (step === 'face') { setBar('Pick a face', 'Click a face on ' + cast("{sister}'s") + ' drawing (or press 1-4).', FACE_ORDER.map((f, i) => [(i + 1) + '. ' + FACE_NAMES[f], () => chooseFace(f)])); }
    if (step === 'carve') { prepCarve(); setBar('Carve the face', 'Trace the red outline with the saw. Wobbly is fine: it gives it character.'); }
    if (step === 'candle') { setBar('The tea-light', 'Click the tea-light to pop it inside, then the lid goes back on.'); }
    H.dirty();
  }
  function endCarve() {
    const c = carving; carving = null; hideBar();
    if (c?.tool) { pk.tools.add(c.tool); restTool(c.tool); }
    syncPumpkin();
  }
  function restTool(t) { if (t === pk.saw) { t.position.set(22, -.9, -6); t.rotation.set(0, 30 * D2R, 0); } else { t.position.set(23, -1.2, 8); t.rotation.set(0, -20 * D2R, 0); } }
  const ray = new T.Raycaster(); ray.layers.enableAll(); const ndc = new T.Vector2(), _z = new T.Vector3(0, 0, 1);
  function hitAt(ev, objs) { const el = H.ren.domElement.getBoundingClientRect(); ndc.set((ev.clientX - el.left) / el.width * 2 - 1, -(ev.clientY - el.top) / el.height * 2 + 1); ray.setFromCamera(ndc, H.camera); return ray.intersectObjects(objs, true)[0] || null; }
  // the tool follows the pointer on the pumpkin's surface (in the pumpkin's own space)
  function toolTo(hit) {
    const t = carving?.tool; if (!t || !hit) return;
    if (t.parent !== pk.body) pk.body.add(t);
    const p = pk.body.worldToLocal(hit.point.clone()), n = hit.face ? hit.face.normal.clone() : new T.Vector3(0, 0, 1);
    t.position.copy(p).addScaledVector(n, carving.step === 'scoop' ? -1 : .4);
    t.quaternion.setFromUnitVectors(_z, n.clone().negate().normalize());
    H.dirty();
  }
  function onDown(ev) {
    if (!carving || H.paused || ev.target.closest?.('button,input,select,a,.se-bar')) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); carving.down = true; onMove(ev, true);
  }
  function onUp() { if (carving) carving.down = false; }
  function onMove(ev, first) {
    const c = carving; if (!c || H.paused) return;
    if (c.step === 'face') { if (first) { const h = hitAt(ev, [pk.sheet]); if (h?.uv) { const i = (h.uv.x > .5 ? 1 : 0) + (h.uv.y < .5 ? 2 : 0); chooseFace(FACE_ORDER[Math.min(3, i)]); } } return; }
    if (c.step === 'candle') { if (first) { const h = hitAt(ev, [pk.tl]); if (h) putCandle(); } return; }
    if (c.step === 'lid') {
      const h = hitAt(ev, [pk.outer, pk.lid]); if (h) toolTo(h); if (!h || !c.down) return;
      const p = pk.body.worldToLocal(h.point.clone()), th = Math.acos(clamp(-p.y / PK.Hh, -1, 1)) / Math.PI;
      if (Math.abs(th - PK.vLid) > .09) return;
      const sector = Math.floor((Math.atan2(p.x, p.z) + Math.PI) / (2 * Math.PI) * 24) % 24;
      if (!c.prog.has(sector)) { c.prog.add(sector); snd.saw(); setBar('Cut the lid', 'Round the stalk... <i>' + Math.round(c.prog.size / 24 * 100) + '%</i>'); }
      if (c.prog.size >= 21) { c.step = 'busy'; pk.guide.visible = false; snd.pop(); placeLid(true); Season.step(EID, 'hw-pumpkin', 'lid'); setTimeout(() => nextStep('scoop'), 1100); }
      return;
    }
    if (c.step === 'scoop') {
      const h = hitAt(ev, [pk.inner, pk.guts]); if (h) toolTo(h); if (!h || !c.down) return;
      const dx = Math.abs(ev.movementX || 0) + Math.abs(ev.movementY || 0); c.rub += Math.min(40, dx || 6);
      const left = pk.blobs.filter(b => b.visible);
      if (left.length && c.rub > 70) {
        c.rub = 0; const b = left[Math.floor(Math.random() * left.length)]; b.visible = false; snd.scoop();
        const n = pk.blobs.length - left.length + 1; fillGutsBowl(n); setBar('Scoop it out', 'Keep scooping... <i>' + n + ' / ' + pk.blobs.length + '</i>');
        if (n >= pk.blobs.length) { c.step = 'busy'; const secs = (Date.now() - c.t0) / 1000; Season.step(EID, 'hw-pumpkin', 'scoop'); think('Scooped!', secs < 25 ? 'Spotless inside. ' + cast('{sister}') + ' gets the seeds for roasting. (Three stars.)' : 'Clean enough. Mom says she has seen worse. (Two stars.)'); setTimeout(() => nextStep('face'), 1000); }
      }
      return;
    }
    if (c.step === 'carve') {
      const h = hitAt(ev, [pk.outer]); if (h) toolTo(h); if (!h || !c.down || !h.uv) return;
      const px = h.uv.x * 1024, py = h.uv.y * 512, F = c.samples; let changed = false;
      for (let i = 0; i < F.length; i++) {
        if (pk.cut[i]) continue;
        for (const s of F[i].pts) if (!s.hit) { const d = Math.hypot(s.x - px, s.y - py); if (d < 15) { s.hit = true; F[i].dx += px - s.x; F[i].dy += py - s.y; F[i].n++; changed = true; } }
        const frac = F[i].pts.filter(s => s.hit).length / F[i].pts.length;
        if (frac >= .8 && !pk.cut[i]) {
          pk.cut[i] = true; const wob = [clamp(Math.round(F[i].dx / Math.max(1, F[i].n)), -20, 20), clamp(Math.round(F[i].dy / Math.max(1, F[i].n)), -20, 20)]; c.wob[i] = wob;
          repaintSkin(Object.keys(pk.cut).map(Number), c.wob); dropChip(i); snd.pop();
          const next = F.findIndex((_, k) => !pk.cut[k]); paintStencil(next);
          if (next < 0) { c.step = 'busy'; Season.step(EID, 'hw-pumpkin', 'carve', c.wob.map(w => w || [0, 0])); peelStencil(); setTimeout(() => nextStep('candle'), 1300); }
        }
      }
      if (changed && Math.random() < .35) snd.saw();
    }
  }
  function nextStep(step) {
    if (!carving) return;
    const pose = ['lid', 'scoop'].includes(step) ? TOP() : FRONT();
    H.glideTo(poseOf(pose), { ms: 650, lock: true, done: () => startStep(step) }); carving.step = 'busy';
    if (carving.tool) { pk.tools.add(carving.tool); restTool(carving.tool); carving.tool = null; }
  }
  function chooseFace(f) {
    if (!carving || carving.step !== 'face') return;
    carving.step = 'busy'; pk.face = f; pk.cut = {}; repaintSkin([], []); paintStencil(0); pk.stencil.visible = true; snd.rustle();
    Season.step(EID, 'hw-pumpkin', 'face', f);
    think('Drawn on', FACE_NAMES[f] + '. ' + cast('{sister}') + '\'s stencil is taped on. Now trace it with the little saw.');
    setTimeout(() => { if (carving) startStep('carve'); }, 900);
  }
  function prepCarve() {
    const polys = FACES[pk.face || 'grin']; pk.cut = {};
    carving.samples = polys.map(poly => { const pts = []; const P = poly.map(([x, y]) => toPx(x, y, 1024, 512, PK.R, PK.Hh)); for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 7)); for (let k = 0; k < n; k++) pts.push({ x: a[0] + (b[0] - a[0]) * k / n, y: a[1] + (b[1] - a[1]) * k / n, hit: false }); } return { pts, dx: 0, dy: 0, n: 0 }; });
    carving.wob = []; paintStencil(0);
  }
  function dropChip(i) { // the cut piece drops in (a solid little wedge of pumpkin)
    const poly = FACES[pk.face][i], cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    const chip = new T.Group(), B = K.into(chip); B.box(0, 0, 0, 1.6, 1.2, .9, mm().orange); B.box(0, 0, -.5, 1.4, 1, .2, mm().cut);
    chip.position.set(cx * .95, -PK.Hh + PK.Hh + cy, PK.R * .98); pk.body.add(chip);
    const t0 = performance.now(), y0 = chip.position.y, z0 = chip.position.z;
    H.anims.set('hw.chip' + i, n => { const k = Math.min(1, (n - t0) / 700); chip.position.z = z0 - k * 13; chip.position.x = cx * .95 * (1 - k * .5); chip.position.y = y0 + k * k * (PK.Hh * .82 - y0); chip.rotation.set(k * 1.57, k * i, 0); H.dirty(); return k < 1; });

  }
  function peelStencil() { const st = pk.stencil, t0 = performance.now(); snd.rustle(); H.anims.set('hw.peel', n => { const k = Math.min(1, (n - t0) / 600); st.position.z = k * 6; st.rotation.x = -k * .6; st.scale.setScalar(1 - k * .3); H.dirty(); if (k >= 1) { st.visible = false; st.position.set(0, 0, 0); st.rotation.set(0, 0, 0); st.scale.setScalar(1); return false; } return true; }); }
  function putCandle() {
    if (!carving || carving.step !== 'candle') return; carving.step = 'busy';
    const tl = pk.tl, from = tl.position.clone(), t0 = performance.now();
    H.anims.set('hw.candle', n => { const k = ease(Math.min(1, (n - t0) / 900)); tl.position.set(from.x * (1 - k), from.y - Math.sin(k * Math.PI) * 30 - k * 4, from.z * (1 - k)); H.dirty(); if (k >= 1) { pk.body.add(tl); tl.position.set(0, PK.Hh - 1.4, 0); placeLid(false); Season.step(EID, 'hw-pumpkin', 'candle'); snd.pop(); setTimeout(() => { if (H.focused) H.unfocus(); think('Done!', 'Tea-light in, lid on. Now carry it out to the gatepost by the front gate (E). Dad does the match.'); }, 1000); return false; } return true; });
  }
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointermove', ev => { if (carving) onMove(ev, false); }, true);
  document.addEventListener('pointerup', onUp, true); document.addEventListener('pointercancel', onUp, true);
  addEventListener('keydown', ev => {
    if (!carving || window.OwnerTools?.typing?.(ev.target)) return;
    if (carving.step === 'face' && /^[1-4]$/.test(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); chooseFace(FACE_ORDER[+ev.key - 1]); }
    if (carving.step === 'candle' && (ev.key === 'f' || ev.key === 'F')) { ev.preventDefault(); ev.stopImmediatePropagation(); putCandle(); }
  }, true);

  // ---------------------------------------------------------------- wrappers (the morning after)
  const WRAPS = [[232, 668, 30], [262, 640, 110], [300, 676, 200], [244, 560, 60], [281, 410, 150], [355, 655, 260]];
  function buildWrappers() {
    WRAPS.forEach(([x, z, ry], i) => {
      const sw = SWEETS[i % SWEETS.length], g = new T.Group(), B = K.into(g), col = M({ c: sw.wrap, sh: 80, sp: '#ccc' });
      B.box(0, -.25, 0, 4.4, .5, 2.6, col, { rz: 3 }); for (const sx of [-1, 1]) B.cyl(sx * 3, -.3, 0, .5, 1.1, 1.8, 6, col, { rz: sx * 90 });
      addThing('hw.wrap.' + (i + 1), { obj: g, home: { room: 'hall', x, y: GY, z, ry }, kind: 'hw.wrapper', label: 'A ' + sw.name + ' wrapper', holdD: 32 });
    });
    addSnap('hw.s.kbin', { room: 'kitchen', x: 170, y: GY - 62, z: 20, r: 30, box: [34, 2, 34], pose: { x: 170, y: GY - 40, z: 20, hide: true }, hide: true, hint: 'In the bin with it', accepts: k => k === 'hw.wrapper',
      onSnap: t => { const n = t.id.split('.').pop(); Season.step(EID, 'hw-clean', 'w' + n); snd.rustle(); } });
  }
  function syncWrappers() {
    const st = srv().steps?.['hw-clean'] || {};
    for (let i = 1; i <= 6; i++) { const t = H.THINGS['hw.wrap.' + i]; if (!t || t.st === 'held' || t.st === 'anim') continue; const gone = !!st['w' + i] || done('hw-clean'); t.at.hide = gone; t.obj.visible = !gone && phase === 'tail'; if (H.SPOTS[t.id]) H.SPOTS[t.id].off = gone || phase !== 'tail'; }
  }

  // ================================================================ the trick-or-treaters
  const KIDS = 24; for (let i = 0; i < KIDS; i++) { try { if (window.Cast?.add && !Cast.get?.('hwkid' + i)?.role?.includes('trick')) Cast.add('hwkid' + i, { role: 'a trick-or-treater from down the road (about 7)', pool: ['childF', 'childM'] }); } catch (e) {} }
  const kidName = k => { try { return Cast.n('hwkid' + k); } catch (e) { return 'a kid'; } };
  const COST = { ghost: 'ghost', witch: 'witch', skeleton: 'skeleton', wizard: 'wizard', dragon: 'dragon', pumpkin: 'pumpkin', mummy: 'mummy', bat: 'bat' };
  const SKIN_T = ['#f1c9a5', '#e0ac7e', '#c68a5c', '#8d5a3b', '#5c3a25'];
  function kidModel(kid, h) { // a simple, solid, chunky kid in a costume (feet at the origin, facing +z), holding a treat pail
    const g = new T.Group(), B = K.into(g), r = rnd(kid.k * 13 + 7), s = h / 120;
    const skin = M({ c: SKIN_T[Math.floor(r() * SKIN_T.length)], sh: 8 }), shoe = M({ c: ['#2a2a2e', '#7a2a2a', '#2a3a6a', '#e8e4dc'][Math.floor(r() * 4)], sh: 20 });
    const c = kid.c, m = mm();
    const legs = (col) => { for (const sx of [-1, 1]) { B.cyl(sx * 5 * s, -24 * s, 0, 3.2 * s, 2.8 * s, 44 * s, 8, col); B.rbox(sx * 5 * s, -2.2 * s, 2 * s, 6.4 * s, 4.4 * s, 11 * s, 1.4 * s, shoe); } };
    const head = (col, y) => B.ball(0, -(y || 104) * s, 0, 9 * s, 10 * s, 9 * s, col || skin, 14);
    const eyes = (y, z) => { for (const sx of [-3.2, 3.2]) B.ball(sx * s, -(y || 106) * s, (z || 8.3) * s, 1.2 * s, 1.5 * s, .6 * s, m.eye, 6); };
    const arms = (col, len) => { for (const sx of [-1, 1]) B.cyl(sx * 13 * s, -70 * s, 4 * s, 2.6 * s, 2.4 * s, (len || 32) * s, 8, col, { rz: sx * 18, rx: -30 }); };
    if (c === 'ghost') { legs(M('#3a3a44')); B.lathe(0, -10 * s, 0, [[0, -110 * s], [8 * s, -108 * s], [12 * s, -100 * s], [13 * s, -88 * s], [15 * s, -60 * s], [19 * s, -18 * s], [21 * s, -2 * s], [19.5 * s, 0]], 20, m.sheet2); for (const sx of [-4, 4]) B.ball(sx * s, -103 * s, 11.6 * s, 2 * s, 2.8 * s, .9 * s, m.eye, 8); B.ball(0, -94 * s, 12.6 * s, 2.4 * s, 1.6 * s, .8 * s, m.eye, 8); }
    if (c === 'witch') { legs(M('#3a2a4a')); B.lathe(0, -18 * s, 0, [[6 * s, -70 * s], [9 * s, -64 * s], [14 * s, -30 * s], [18 * s, -2 * s], [17 * s, 0]], 18, m.black2); arms(m.black); head(M({ c: '#9ad08a', sh: 8 })); eyes(); B.cyl(0, -112 * s, 0, 15 * s, 15 * s, 1 * s, 22, m.black); B.lathe(0, -112 * s, 0, [[0, -30 * s], [2 * s, -24 * s], [6 * s, -10 * s], [8.6 * s, 0]], 14, m.black, { rz: 10 }); for (const sx of [-1, 1]) B.box(sx * 8.6 * s, -98 * s, -1 * s, 2.4 * s, 18 * s, 6 * s, M('#e8761c')); B.cyl(16 * s, -60 * s, 8 * s, 1 * s, 1 * s, 90 * s, 6, M('#8a6a3a'), { rz: 12 }); B.cyl(24 * s, -14 * s, 9 * s, 1.5 * s, 6 * s, 16 * s, 8, M('#c8a050'), { rz: 12 }); }
    if (c === 'skeleton') { legs(m.black); B.rbox(0, -64 * s, 0, 22 * s, 40 * s, 13 * s, 4 * s, m.black); for (let i = 0; i < 4; i++) B.box(0, -(72 - i * 6) * s, 6.7 * s, (16 - i) * s, 1.6 * s, .6 * s, m.sheet); B.box(0, -64 * s, 6.8 * s, 1.6 * s, 22 * s, .6 * s, m.sheet); for (const sx of [-1, 1]) { B.box(sx * 5 * s, -30 * s, 3.3 * s, 1.5 * s, 18 * s, .5 * s, m.sheet); } arms(m.black); head(m.sheet); for (const sx of [-3.3, 3.3]) B.ball(sx * s, -105 * s, 8 * s, 2.2 * s, 2.6 * s, 1 * s, m.eye, 8); B.ball(0, -100 * s, 8.6 * s, .9 * s, 1.2 * s, .6 * s, m.eye, 6); B.box(0, -96 * s, 8.4 * s, 6 * s, 1 * s, .6 * s, m.eye); }
    if (c === 'wizard') { legs(M('#2a2a5a')); const robe = M({ c: '#2a3a9a', sh: 20 }); B.lathe(0, -10 * s, 0, [[6 * s, -78 * s], [11 * s, -70 * s], [15 * s, -36 * s], [19 * s, -2 * s], [18 * s, 0]], 18, M({ c: '#2a3a9a', sh: 20, side: 2 })); arms(robe); head(); eyes(); B.cyl(0, -89 * s, 6.4 * s, 6 * s, .6 * s, 15 * s, 9, M({ c: '#f2f2ea', sh: 4 }), { rx: 12 }); B.cyl(0, -113 * s, 0, 12 * s, 12 * s, 1 * s, 18, robe); B.lathe(0, -113 * s, 0, [[0, -36 * s], [3 * s, -24 * s], [7 * s, -8 * s], [8.5 * s, 0]], 12, robe); for (let i = 0; i < 6; i++) { const a = i * 1.1; B.ball(Math.cos(a) * 13 * s, -(30 + i * 9) * s, Math.sin(a) * 13 * s + 2, 1.2 * s, 1.2 * s, .5 * s, M({ c: '#f0d040', e: '#5a4a00' }), 5); } B.cyl(-15 * s, -64 * s, 10 * s, .7 * s, .7 * s, 30 * s, 6, M('#3a2a1a'), { rz: -30, rx: -40 }); }
    if (c === 'dragon') { const gr = M({ c: '#3a9a3a', sh: 20 }); legs(gr); B.rbox(0, -62 * s, 0, 26 * s, 46 * s, 18 * s, 7 * s, gr); B.rbox(0, -62 * s, 7 * s, 15 * s, 34 * s, 6 * s, 3 * s, M({ c: '#d8d070', sh: 10 })); arms(gr); head(gr); B.rbox(0, -101 * s, 9 * s, 10 * s, 7 * s, 8 * s, 2.4 * s, gr); for (const sx of [-2.4, 2.4]) B.ball(sx * s, -103 * s, 13 * s, .8 * s, .6 * s, .5 * s, m.eye, 5); eyes(110, 7.6); for (let i = 0; i < 6; i++) B.cyl(0, -(118 - i * 12) * s, -(9 + (i > 1 ? 2 : 0)) * s, .2 * s, 3 * s, 6 * s, 6, M('#e8a020'), { rx: -60 }); B.cyl(0, -36 * s, -18 * s, 1 * s, 5 * s, 30 * s, 8, gr, { rx: -64 }); }
    if (c === 'pumpkin') { legs(M('#2a6a2a')); B.geo(gourd(19 * s, 17 * s, { seg: 20, rows: 12 }), 0, -64 * s, 0, mm().skin); arms(M('#2a6a2a'), 26); head(); eyes(); B.ball(0, -108 * s, -1.4 * s, 9.5 * s, 7.4 * s, 9.6 * s, M(['#3a2a1a', '#8a5a2a', '#1a1414', '#c89a4a'][kid.k % 4]), 12);
 B.cyl(0, -116 * s, 0, 2 * s, 3 * s, 6 * s, 8, mm().stalk); for (const sx of [-1, 1]) B.box(sx * 4 * s, -116 * s, 0, 6 * s, .6 * s, 3.4 * s, M('#3a8a2a'), { rz: sx * 20 }); }
    if (c === 'mummy') { const band = M({ c: '#e8e0c8', sh: 4 }), band2 = M({ c: '#d6ccb0', sh: 4 }); legs(band); B.rbox(0, -64 * s, 0, 23 * s, 44 * s, 14 * s, 6 * s, band); for (let i = 0; i < 7; i++) B.rbox(0, -(44 + i * 6.4) * s, 0, 24 * s, 2 * s, 15 * s, 1 * s, band2, { rz: (i % 2 ? 6 : -6) }); arms(band); head(band); for (let i = 0; i < 4; i++) { const dy = -6 + i * 4.2, rr = 9 * Math.sqrt(Math.max(.05, 1 - (dy / 10) * (dy / 10))) + .25; B.geo(new T.TorusGeometry(rr * s, .55 * s, 4, 18), 0, -(104 + dy) * s, 0, band2, { rx: 90, rz: i % 2 ? 7 : -7 }); }
 B.box(0, -105 * s, 8.2 * s, 11 * s, 2.4 * s, 1.4 * s, m.eye); for (const sx of [-3, 3]) B.ball(sx * s, -105 * s, 9 * s, 1 * s, 1 * s, .5 * s, M({ c: '#fff', e: '#555' }), 5); }
    if (c === 'bat') { legs(m.black); B.rbox(0, -64 * s, 0, 22 * s, 40 * s, 13 * s, 5 * s, m.black); const wg = new T.ExtrudeGeometry(wingShape, { depth: .8, bevelEnabled: false }); B.geo(wg, 9 * s, -82 * s, -2 * s, m.black, { sx: 2.2 * s, sy: 2.4 * s, sz: s, rz: 12 }); B.geo(wg.clone().scale(-1, 1, 1), -9 * s, -82 * s, -2 * s, m.black, { sx: 2.2 * s, sy: 2.4 * s, sz: s, rz: -12 }); head(); eyes(); B.ball(0, -108 * s, -1 * s, 9.6 * s, 7 * s, 9.6 * s, m.black, 12); for (const sx of [-1, 1]) B.cyl(sx * 5 * s, -118 * s, 0, .2 * s, 2.6 * s, 8 * s, 6, m.black, { rz: sx * -16 }); }
    // the treat pail: an orange plastic pumpkin bucket with a black handle
    const pail = B.at(10 * s, -42 * s, 10 * s); pail.lathe(0, 0, 0, [[5.6, -11], [7.4, -9], [7.8, -4], [6.6, 0], [0, 0]], 16, M({ c: '#f07a1a', sh: 40 })); pail.cyl(0, -10, 0, 5.5, 5.5, .4, 16, M('#5a2a08')); pail.geo(new T.TorusGeometry(6, .35, 4, 12, Math.PI), 0, -11, 0, m.black, { rz: 180, ry: 90 });
    B.shadow(0, 0, 0, 34 * s, 30 * s, .55);
    return g;
  }
  function parentModel() { const g = new T.Group(), B = K.into(g), coat = M({ c: '#4a5a6a', sh: 6 }); for (const sx of [-1, 1]) { B.cyl(sx * 7, -40, 0, 4.4, 4, 80, 8, M('#2a2a32')); B.rbox(sx * 7, -2.4, 2, 8, 4.8, 13, 1.6, M('#1a1a1a')); } B.rbox(0, -112, 0, 38, 66, 22, 8, coat); for (const sx of [-1, 1]) B.cyl(sx * 21, -112, 0, 4, 4, 56, 8, coat, { rz: sx * 6 }); B.cyl(0, -146, 0, 5, 6, 6, 10, M('#a03a3a')); B.ball(0, -160, 0, 10, 12, 10, M({ c: '#e0b08a', sh: 8 }), 12); B.ball(0, -168, -1, 10.6, 7, 10.6, M('#3a2a20'), 10); B.cyl(-24, -96, 8, 2.6, 2.6, 12, 8, M('#222'), { rx: 70 }); B.ball(-24, -96, 15, 2.2, 2.2, .8, M({ c: '#fff4c0', e: '#ffd060' }), 6); B.shadow(0, 0, 0, 50, 36, .5); return g; }
  let kids = null; // { g:id, group, list:[{obj, kid, want, got:[]}], parent, state, at }
  const DOORSTEP = [[276, 792], [300, 784], [324, 792], [288, 812], [312, 812]];
  function spawnKids(gr, walk) {
    clearKids(true);
    const drive = H.ROOMS.drive; if (!drive?.built) return;
    const group = new T.Group(); group.name = 'hw-trick-or-treaters'; drive.group.add(group);
    const list = gr.kids.map((kid, i) => { const h = 104 + ((kid.k * 7) % 24), o = kidModel(kid, h); const [x, z] = DOORSTEP[i]; o.position.set(x, GY - 1, z); o.rotation.y = Math.PI + (i - 2) * .12; group.add(o); o.userData.home = { x, z }; return { obj: o, kid, want: kid.want, got: [] }; });
    const parent = parentModel(); parent.position.set(262, GY - 1.6, 1128); parent.rotation.y = Math.PI * .9; group.add(parent);
    group.traverse(o => { if (o.isMesh) o.userData.kid = 1; });
    kids = { g: gr.id, n0: srv().treat?.n | 0, gr, group, list, parent, state: walk ? 'walk' : 'wait', t0: performance.now(), answered: false, knocks: 0, lastKnock: 0, block: null };
    const pick = new T.Mesh(new T.BoxGeometry(70, 120, 46), PICKM); pick.position.set(300, GY - 60, 798); pick.userData.hwOwn = 1; group.add(pick);
    addSpot('hw.kids', { label: () => kids ? 'Trick-or-treaters (' + kids.list.length + ')' : 'Trick-or-treaters', obj: pick, room: 'drive', range: 320, act: () => handOut() });
    if (walk) for (const k of list) { k.obj.position.z = 1150 + Math.random() * 30; k.obj.position.x = 262 + Math.random() * 20; }
    // they stand on the path: keep the player out of them (never trapping anyone already there)
    if (!(H.W.lvl === 'G' && Math.abs(H.W.x - 300) < 70 && H.W.z > 750 && H.W.z < 840)) { kids.block = H.block('G', 262, 772, 338, 826); }
    if (walk) H.anims.set('hw.kids', kidTick); H.dirty();
  }
  function fidget(now) { // a little bob while they wait (only while the front is drawn, never on Low)
    const k = kids; if (!k || k.state !== 'wait' || low() || !H.ROOMS.drive?.group.visible) return;
    const cheer = k.cheer && now < k.cheer; k.list.forEach((kd, i) => { kd.obj.position.y = GY - 1 - Math.max(0, Math.sin(now / 260 + i * 1.7)) * (cheer ? 4 : .6); }); H.dirty();
  }
  function kidTick(now) {
    if (!kids) return false;
    const k = kids, visible = H.ROOMS.drive?.group.visible;
    if (k.state === 'walk') {
      const t = Math.min(1, (now - k.t0) / 5200);
      k.list.forEach((kd, i) => { const h = kd.obj.userData.home, e = ease(t); kd.obj.position.x = 268 + (h.x - 268) * e; kd.obj.position.z = 1150 + (h.z - 1150) * e - i * 6 * (1 - e); kd.obj.position.y = GY - 1 - Math.abs(Math.sin(now / 130 + i)) * 2 * (1 - t); });
      if (t >= 1) { k.state = 'wait'; if (!fdOpen()) knockNow(); }
    } else if (k.state === 'leave') {
      const t = Math.min(1, (now - k.t0) / 4200);
      k.list.forEach((kd, i) => { const h = kd.obj.userData.home; kd.obj.rotation.y = 0; kd.obj.position.z = h.z + (1160 - h.z) * ease(t); kd.obj.position.x = h.x + (268 - h.x) * ease(t); kd.obj.position.y = GY - 1 - Math.abs(Math.sin(now / 130 + i)) * 2; });
      k.parent.position.z = 1128 + t * 40;
      if (t >= 1) { clearKids(); return false; }
    } else return false; // waiting: the gentle fidget runs on the house's 20 Hz ambient tick instead
    void visible; H.dirty(); return true;
  }
  function clearKids(quiet) {
    if (!kids) return; kids.group.parent?.remove(kids.group);
    if (kids.block) { kids.block.off = true; H._.grids.dirty = true; }
    H.unspot('hw.kids'); delete IT['hw.kids'];
    kids = null; if (handing) endHand(); H.anims.delete('hw.kids'); H.dirty();
    if (!quiet) H.relight();
  }
  function knockNow() {
    if (!kids) return; kids.knocks++; kids.lastKnock = Date.now();
    snd.knock(); setTimeout(snd.bell, 700);
    const first = !srv().treat?.n && kids.knocks === 1;
    if (first) say('c4.hal.treat', 'Mom', 'Trick or treat, here they come. Be nice. Give them a handful, not the whole bowl.', true);
    else if (kids.knocks === 1) say('hw.mom.door.' + kids.g, 'Mom', ['{me}, can you get that?', 'Door, {me}! More of them!', "That'll be the Witch Brigade again. Door!", '{me}! Door! I\'ve got my hands full.'][kids.g % 4]);
    else say('hw.mom.door2.' + kids.g, 'Mom', '{me}! They\'re still waiting at the door!');
  }
  const fdOpen = () => !!H.DOORS.front?.open;
  let lastDoor = false;
  setInterval(() => {
    if (!on || !kids) { lastDoor = fdOpen(); return; }
    const open = fdOpen();
    if (open && kids.state === 'wait' && !kids.answered) { kids.answered = true; kids.cheer = performance.now() + 1600; greet(); }
    if (!open && kids.state === 'wait' && Date.now() - kids.lastKnock > 25000 && kids.knocks < 4) knockNow();
    lastDoor = open;
  }, 400);
  function greet() {
    if (!kids) return; const gr = kids.gr, names = kids.list.map(k => kidName(k.kid.k)), avoid = kids.list.find(k => k.kid.avoid), two = kids.list.find(k => k.want > 1);
    const opener = gr.wrong ? 'Treat or trick! ...TRICK OR TREAT!' : ['TRICK OR TREAT!', 'Trick or treat! Smell my feet!', 'TRICK... OR... TREAT!'][gr.id % 3];
    let ask = 'One each, please!';
    if (two) ask = 'Can ' + kidName(two.kid.k) + ' have two? It\'s ' + Cast.t('{hwkid' + two.kid.k + '.his}') + ' first time!';
    if (avoid) ask = 'One each, please. ' + kidName(avoid.kid.k) + (avoid.kid.avoid === 'nuts' ? ' can\'t have nuts.' : ' can\'t have chocolate, it melts in ' + Cast.t('{hwkid' + avoid.kid.k + '.his}') + ' gloves.');
    H.say(names.slice(0, 2).join(' and ') + (names.length > 2 ? ' and friends' : '') + ' (at the door)', esc(opener + ' ' + ask), 6000);
    if (!srv().treat?.n && !said.ids['hw.dad.safe']) setTimeout(() => say('hw.dad.safe', 'Dad', 'Only knock on doors with the lights on, and never go in anyone\'s house. Mom\'s rules. And mine.', true), 6500);
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------------------------------------------------------------- handing out sweets: the bowl in your hands, the kids on the step
  let handing = null;
  let handWhy = '';
  function handOut() { handWhy = handOut2() || 'ok'; return handWhy; }
  function handOut2() {
    if (!on) return 'off';
    if (!kids || kids.state !== 'wait') { think('The sweets bowl', srv().porch ? 'Nobody at the door yet. They knock when they come.' : 'Nobody will knock with the porch light off. Mom\'s rule. The switch is by the front door.'); return 'nobody'; }
    if (!fdOpen()) { think('Trick or treat', 'Open the front door first (F).'); return 'door'; }
    if (H.held() !== 'hw.bowl') { think('The sweets bowl', 'Pick up the sweets bowl first (E). It\'s on the little table by the door.'); return 'bowl'; }
    if (!bowlTotal()) { think('Uh oh', 'The bowl is empty! ' + (srv().tin > 0 ? 'The tin in the cupboard under the stairs has more.' : 'Sorry, all gone.'), 5000); setBar('Trick or treat', 'The bowl is empty.', [['Sorry, all gone!', () => give(true)]]); handing = { ids: [], empty: true }; setTimeout(() => { if (handing?.empty) endHand(); }, 5000); return 'empty'; }
    const grip = H.suspendGrip('hw.bowl'); if (!grip) return 'grip';
    const pose = { x: 300, y: GY - 122, z: 668, ry: 180, rx: -12, lvl: 'G', seat: 1 };
    if (!H.focus(pose, { label: 'Stop (Q)', ms: 700, enter: () => startHand(grip), exit: () => endHand() })) { H.restoreGrip(grip); return 'focus:' + H.mode + (H.focused ? ':focused' : ''); }
    handing = { grip, given: [], busy: false };
  }
  function startHand() {
    if (!handing || !kids) return;
    const t = H.THINGS['hw.bowl'], f = H.fwd(); t.obj.position.set(H.P.x + f.x * 50, H.P.y + f.y * 50 + 17, H.P.z + f.z * 50); t.obj.rotation.set(-.5, Math.PI, 0); H.dirty();

    renderHand(); hintHand();
  }
  function hintHand() { setBar('Trick or treat', 'Click a sweet in the bowl (or press 1-6) to give it to the next one. ' + kidsLine(), SWEETS.map((s, i) => [(i + 1) + '. ' + s.name + ' <i>' + ((srv().bowl || [])[i] | 0) + '</i>' + (s.nuts ? ' <small>(nuts)</small>' : ''), () => giveSweet(i), 'se-sweet se-s' + i]).concat([['Done', () => give(false)]])); }
  function kidsLine() { return kids ? kids.list.map(k => '<span class="se-kid' + (k.got.length >= k.want ? ' ok' : '') + '">' + esc(kidName(k.kid.k)) + ' the ' + k.kid.c + (k.want > 1 ? ' (2)' : '') + (k.got.length >= k.want ? ' &#10004;' : '') + '</span>').join(' ') : ''; }
  function renderHand() { const local = (srv().bowl || []).slice(); if (handing) for (const [, si] of handing.given) local[si]--; paintBowl(local); }
  function giveSweet(si) {
    if (!handing || !kids || handing.busy) return;
    const left = ((srv().bowl || [])[si] | 0) - handing.given.filter(([, s]) => s === si).length; if (left <= 0) { think('None left', 'No ' + SWEETS[si].name + ' left in the bowl.'); return; }
    const ki = kids.list.findIndex(k => k.got.length < k.want); if (ki < 0) return;
    const kd = kids.list[ki], sw = SWEETS[si];
    if (kd.kid.avoid === 'nuts' && sw.nuts || kd.kid.avoid === 'choc' && sw.choc) { H.say(kidName(kd.kid.k), esc('No thanks, I can\'t have that' + (kd.kid.avoid === 'nuts' ? ', I\'ve got a nut allergy.' : '. Chocolate melts in my gloves.') + ' Have you got anything else?'), 4200); return; }
    kd.got.push(si); handing.given.push([ki, sw.id === undefined ? si : si]); snd.pop(); flySweet(si, kd);
    renderHand(); hintHand();
    if (kids.list.every(k => k.got.length >= k.want)) { handing.busy = true; setTimeout(() => give(false), 700); }
  }
  function flySweet(si, kd) {
    const t = H.THINGS['hw.bowl'], drive = H.ROOMS.drive, from = new T.Vector3(); t.obj.getWorldPosition(from);
    const m = new T.Mesh(sweetGeo, M({ c: SWEETS[si].wrap, sh: 70, sp: '#666' })); drive.group.add(m); m.position.set(from.x, -from.y, from.z);
    const to = kd.obj.position.clone(); to.y -= 46; to.x += 10; to.z += 10; const p0 = m.position.clone(), t0 = performance.now();
    H.anims.set('hw.fly' + t0, n => { const k = Math.min(1, (n - t0) / 520); m.position.lerpVectors(p0, to, k); m.position.y -= Math.sin(k * Math.PI) * 22; m.rotation.x += .3; H.dirty(); if (k >= 1) { drive.group.remove(m); return false; } return true; });
  }
  function give(refuse) {
    if (!kids) { endHand(); return; }
    const all = kids.list.every(k => k.got.length >= k.want);
    const giveList = refuse || !all ? [] : kids.list.flatMap((k, i) => k.got.map(si => [i, SWEETS[si].id]));
    if (!refuse && !all && handing && handing.given.length) { think('Not yet', 'Somebody hasn\'t had theirs yet.'); if (handing) handing.busy = false; return; }
    Season.send({ t: 'seTreat', e: EID, g: kids.g, give: giveList });
    kids.pendingGive = giveList.length ? 'treat' : 'trick';
    if (H.focused && handing) H.unfocus(); else endHand();
  }
  function endHand() {
    const h = handing; handing = null; hideBar();
    if (h?.grip) { H.restoreGrip(h.grip); }
    paintBowl(); H.dirty();
  }
  // a pick on the bowl's sweets while handing out (the real thing in your hands)
  document.addEventListener('pointerdown', ev => {
    if (!handing || !bowlInst || H.paused || ev.target.closest?.('button,.se-bar')) return;
    const h = hitAt(ev, [bowlInst]); if (!h || h.instanceId == null) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); const si = bowlMap[h.instanceId]; if (si != null) giveSweet(si);
  }, true);
  addEventListener('keydown', ev => {
    if (!handing || window.OwnerTools?.typing?.(ev.target)) return;
    if (/^[1-6]$/.test(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); giveSweet(+ev.key - 1); }
    if (ev.key === 'Enter') { ev.preventDefault(); give(false); }
  }, true);
  // ---- the server's answers
  if (window.Net) {
    // keep the local copy of the server's view in step, so a later sync never sends a fresh group away
    Net.on('seGroup', m => { if (m.e !== EID || !on) return; const s = srv(); if (s.treat) s.treat.g = m.g; spawnKids(m.g, H.ROOMS.drive?.group.visible || H.here === 'hall'); });
    Net.on('seKnock', m => { if (m.e !== EID) return; knockWait = false; if (m.wait === 'porch' && phase === 'day') say('hw.mom.porch', 'Mom', "Porch light on, love. No light, no trick-or-treaters. That's the rule.", true); if (m.wait === 'done') { if (!said.ids['c4.hal.night']) { say('c4.hal.night', 'Dad', "Everyone ready? Spooky telly, lights off. Who's brave enough?", true); setTimeout(() => say('c4.hal.night2', '{sister}', "I'm not scared. I'm just hiding. For fun.", true), 4200); } } if (m.g && !kids) spawnKids(m.g, false); });
    Net.on('seTreat', m => {
      if (m.e !== EID) return;
      if (!m.ok) { if (kids && m.why !== 'gone') { kids.list.forEach(k => { k.got = []; }); think('Hmm', m.why === 'stock' ? 'The bowl has run short. Try different sweets.' : 'They want something else.'); } else if (kids) leave('gone'); return; }
      const s = srv(); if (s.treat) { s.treat.g = null; s.treat.n = m.n; }
      leave(m.happy ? 'treat' : 'trick', m);
    });
  }
  function leave(how, m) {
    if (!kids || kids.state === 'leave') return;
    if (how === 'treat') { H.say('Trick-or-treaters', esc(['THANK YOU! Happy Halloween!', 'Thank yooou! Nice costume! (I\'m not wearing a costume.)', 'Thanks! Your house is the best one on the road!', 'Thank you! ...Mum, can we go home now? My bag is FULL.'][kids.g % 4]), 4200); if (m?.h === 5) setTimeout(() => say('hw.mom.five', 'Mom', 'Five lots! The neighbours will think we\'re ever so organised.', true), 4600); }
    else if (how === 'trick') { H.say('Trick-or-treaters', 'Aww! ...TRICK, then! <i>(Something rubbery lands on the doormat.)</i>', 4600); rubberSpider(); }
    kids.state = 'leave'; kids.t0 = performance.now(); if (kids.block) { kids.block.off = true; H._.grids.dirty = true; kids.block = null; }
    H.unspot('hw.kids'); delete IT['hw.kids']; H.anims.set('hw.kids', kidTick);
  }
  let spiderMat = null;
  function rubberSpider() { const d = H.ROOMS.drive; if (!d || spiderMat) return; spiderMat = new T.Group(); spiderMat.userData.hwOwn = 1; d.group.add(spiderMat); spider(K.into(spiderMat), 300 + (Math.random() - .5) * 20, GY - 3.2, 734, 2.2, Math.random() * 360); H.dirty(); }
  // ask the server for the next group while it's their time, the player is in the house and nothing is waiting
  let knockWait = false, lastAsk = 0;
  setInterval(() => {
    if (!on || phase !== 'day' || knockWait || kids || !H.live || H.mode === 'monitor' || H.mode === 'off' || !srv().open) return;
    const t = SE.today(); if (t.hour < E.treatHours[0] || t.hour >= E.treatHours[1]) return;
    if (Date.now() - lastAsk < 6000) return; lastAsk = Date.now(); knockWait = true; Season.send({ t: 'seKnock', e: EID, h: t.hour }); setTimeout(() => { knockWait = false; }, 5000);
  }, 1500);

  // ================================================================ mood: the porch lamp, lanterns in the pooled rig, cooler dusk outside
  const MOOD_ROOMS = ['drive', 'garden', 'hall', 'lounge', 'kitchen'];
  const dark = () => { const pb = document.getElementById('bootPower')?.classList; return !!pb && (pb.contains('rm-night') || pb.contains('rm-dusk')); };
  function wrapMood(rid) {
    const r = H.ROOMS[rid]; if (!r || r._hwMood) return;
    const L0 = r.lights, A0 = r.amb; r._hwMood = { L0, A0 };
    r.lights = () => {
      const L = (typeof L0 === 'function' ? L0() : L0 || []).slice(); if (!on) return L;
      if (rid === 'drive') { const i = L.findIndex(l => l.x === 360 && l.z === 730); if (i >= 0) L[i] = Object.assign({}, L[i], { c: '#ffb45a', i: porchOn() ? (dark() ? 1 : .25) : 0, d: 440 }); else if (porchOn()) L.push({ x: 360, y: GY - 124, z: 730, c: '#ffb45a', i: dark() ? 1 : .25, d: 440 }); if (litLantern()) L.push({ x: STEP.x, y: STEP.y - 30, z: STEP.z - 20, c: '#ff8a2a', i: dark() ? .55 : 0, d: 220 }); L.push({ x: 480, y: GY - 100, z: 1080, c: '#ff8a2a', i: dark() ? .3 : 0, d: 220 }, { x: -60, y: 280, z: 730, c: '#ff9a3a', i: dark() ? .3 : 0, d: 200 }); }
      if (rid === 'garden') L.push({ x: 20, y: GY - 30, z: -90, c: '#ff8a2a', i: dark() ? .5 : 0, d: 220 }, { x: -212, y: GY - 205, z: -380, c: '#ffa040', i: dark() ? .4 : 0, d: 260 });
      if (rid === 'hall') L.push({ x: 300, y: GC + 30, z: 680, c: '#ff9a40', i: dark() ? .35 : .12, d: 260 });
      if (rid === 'lounge') L.push({ x: -62, y: GY - 70, z: 433, c: '#7ad86a', i: dark() ? .18 : 0, d: 160 });
      return L;
    };
    r.amb = () => {
      const a = Object.assign({}, typeof A0 === 'function' ? A0() : A0); if (!on || !dark()) return a;
      if (r.outside) return { sky: '#5f5a8c', gnd: '#3a3c38', i: a.i * .92 };
      return { sky: a.sky, gnd: '#6a5040', i: a.i };
    };
  }
  const litLantern = () => !!srv().steps?.['hw-pumpkin']?.place;
  // emissive flicker on lanterns and the candle (Medium/High, only while the front or the garden is drawn)
  let flickerT = 0;
  function flicker(now) {
    if (!on) return;
    fidget(now);
    if (low() || now - flickerT < 110) return; flickerT = now;
    const vis = H.ROOMS.drive?.group.visible || H.ROOMS.garden?.group.visible || H.ROOMS.kitchen?.group.visible; if (!vis) return;
    const k = .82 + Math.sin(now / 90) * .08 + Math.sin(now / 37) * .06 + Math.random() * .05;
    mm().glow.emissive.setRGB(1 * k, .7 * k, .29 * k); if (pk && litLantern()) { pk.mIn.emissive.setRGB(1 * k, .7 * k, .29 * k); pk.flame.scale.set(1, .85 + Math.random() * .3, 1); }
    H.dirty();
  }
  let ambientAdded = false;

  // ================================================================ on / off, sync with the server, guidance
  function buildAll() {
    mm();
    for (const rid of Object.keys(BUILDERS)) buildDecor(rid);
    for (const rid of MOOD_ROOMS) wrapMood(rid);
    if (!built.items && H.ROOMS.hall?.built && H.ROOMS.kitchen && H.ROOMS.cupboard && H.ROOMS.drive && H.ROOMS.lounge && window.HouseRooms?.ready) {
      built.items = true; buildPorch(); buildDecorItems(); buildBowl(); buildPumpkin(); buildWrappers();
    }
    if (!ambientAdded && H.ambient?.add) { ambientAdded = true; H.ambient.add(flicker); }
  }
  function sync() {
    if (!on) return;
    showDecor();
    if (porchRocker) porchRocker.rotation.x = (porchOn() ? -12 : 12) * D2R;
    syncDecorItems(); syncPumpkin(); syncWrappers(); paintNote();

    for (const id of ['hw.tin', 'hw.bowl']) { const t = H.THINGS[id], s = H.SPOTS[id]; const ok = phase === 'day' || id === 'hw.bowl'; if (t) { t.obj.visible = ok && !t.at.hide; } if (s) s.off = !ok; }
    if (!handing) paintBowl();
    // the server's group at the door (refresh, another tab); a group the server has finished with walks off
    const tr = srv().treat || {}, g = tr.g;
    if (g && phase === 'day' && (!kids || kids.g < g.id)) spawnKids(g, false);
    if (!g && kids && kids.state === 'wait' && (tr.n | 0) > kids.n0) leave(kids.pendingGive || 'gone');

    H.relight(); H.dirty();
  }
  function lines() {
    if (phase === 'lead') say('hw.mom.lead', 'Mom', "I've got a pumpkin for you two to carve. It's on the kitchen table. Newspaper down first, please!", true);
    if (phase === 'day') { say('c4.hal.mom', 'Mom', "It's Halloween! Don't worry, I've got a bowl of sweets. Sweets for them, not for you.", true); setTimeout(() => say('hw.mom.clocks', 'Mom', 'And the clocks went back last night. An extra hour in bed, and I\'m STILL tired.', true), 5200); }
    if (phase === 'day' && SE.today().hour >= 16) setTimeout(() => say('c4.hal.sis', '{sister}', 'Wooooo! I\'m a ghost! Do I look scary? Say yes.', true), 10500);
    if (phase === 'tail') say('hw.mom.tail', 'Mom', 'Look at the state of this hall. Wrappers everywhere! Bin, please, {me}. And who ate all the Choc Bits?', true);
  }
  function enable(ph) {
    const was = on, wasPh = phase; on = true; phase = ph;
    buildAll();
    if (!was || wasPh !== ph) { fade(); lines(); }
    sync();
  }
  function disable() {
    if (!on) return; on = false; phase = null;
    if (carving && H.focused) H.unfocus(); if (handing && H.focused) H.unfocus();
    clearKids(true); if (spiderMat) { spiderMat.parent?.remove(spiderMat); spiderMat = null; }
    for (const rid in DEC) DEC[rid].group.visible = false;
    showDecor(); removeAll(); if (pk) { pk.root.parent?.remove(pk.root); pk.news.parent?.remove(pk.news); pk.tools.parent?.remove(pk.tools); pk = null; }
    if (ambientAdded) { H.ambient.delete(flicker); ambientAdded = false; }
    fade(); H.relight(); H.dirty();
  }
  function fade() { try { if (H.live && H.ui?.fade && !document.querySelector('.hs-loading,#houseEntry')) { H.ui.fade(true, 180); setTimeout(() => H.ui.fade(false, 420), 220); } } catch (e) {} }
  H.on('built', rid => { if (on) { buildAll(); sync(); } });

  function targets(c) {
    const held = H.held(), s = srv().steps || {};
    if (c.o.id === 'hw-pumpkin') {
      if (held === 'hw.paper') return ['hw.s.paper']; if (held === 'hw.lantern') return ['hw.s.step'];
      if (!s['hw-pumpkin']?.paper) return ['hw.paper'];
      if (!s['hw-pumpkin']?.candle) return ['hw.pumpkin'];
      return ['hw.lantern'];
    }
    if (c.o.id === 'hw-decorate') { if (held?.startsWith('hw.decor.')) return ['hw.s.' + held.slice(9)]; return Object.keys(DECOR).filter(id => !srv().decor?.[id]).map(id => 'hw.decor.' + id).slice(0, 2); }
    if (c.o.id === 'hw-lights') return ['hw.porch'];
    if (c.o.id === 'hw-bowl') return held === 'hw.tin' ? ['hw.s.bowl'] : ['hw.tin'];
    if (c.o.id === 'hw-treat') { if (!kids || kids.state !== 'wait') return []; if (!fdOpen()) return ['hs.frontdoor']; return held === 'hw.bowl' ? ['hw.kids'] : ['hw.bowl']; }
    if (c.o.id === 'hw-clean') { if (held?.startsWith('hw.wrap.')) return ['hw.s.kbin']; for (let i = 1; i <= 6; i++) if (!s['hw-clean']?.['w' + i]) return ['hw.wrap.' + i]; }
    return [];
  }
  function describe(id) {
    const D = {
      'hw.paper': ['Old newspapers', 'E: pick up the newspapers'], 'hw.s.paper': ['The kitchen table', 'E: spread the newspaper here'],
      'hw.pumpkin': ['The pumpkin', 'F: carve the pumpkin'], 'hw.lantern': ["My jack-o'-lantern", 'E: carry it out to the front gate'], 'hw.s.step': ['The gatepost', 'E: put the lantern here'],
      'hw.porch': ['Porch light switch', 'F: porch light on'], 'hw.tin': ['Tin of sweets', 'E: pick up the tin'], 'hw.s.bowl': ['The sweets bowl', 'E: pour the sweets in'],
      'hw.bowl': ['The sweets bowl', 'E: pick up the bowl'], 'hw.kids': ['Trick-or-treaters', 'F: hand out sweets'], 'hs.frontdoor': ['The front door', 'F: answer the door'],
      'hw.s.kbin': ['The kitchen bin', 'E: in the bin'],
    };
    if (D[id]) return { label: D[id][0], action: D[id][1] };
    if (id.startsWith('hw.decor.')) return { label: cast("{sister}'s ") + DECOR[id.slice(9)].label.replace(/^an? /, ''), action: 'E: pick it up' };
    if (id.startsWith('hw.s.') && DECOR[id.slice(5)]) return { label: DECOR[id.slice(5)].hint, action: 'E: put it here' };
    if (id.startsWith('hw.wrap.')) return { label: 'A sweet wrapper', action: 'E: pick it up' };
    return null;
  }

  window.Halloween = { get on() { return on; }, get phase() { return phase; }, get kids() { return kids ? { g: kids.g, n: kids.list.length, state: kids.state, list: kids.list.map(k => ({ want: k.want, avoid: k.kid.avoid, got: k.got.length, c: k.kid.c })) } : null; },
    get carving() { return carving ? carving.step : null; }, get handing() { return !!handing; }, DEC, FACES, PK, SWEETS, giveSweet, give, chooseFace, putCandle, carve, handOut,
    // diagnostics (tests): screen points (CSS px) of the lid line, the guts, the tea-light, or one face feature's outline
    _: { pk: () => pk, DECOR, STEP, BOWL, facePolys, toPx, get why() { return handWhy; }, screen(kind, i) {

      if (!pk) return [];
      const el = H.ren.domElement.getBoundingClientRect(), out = [], P = v => { const w = pk.body.localToWorld(v.clone()).project(H.camera); return [el.left + (w.x + 1) / 2 * el.width, el.top + (1 - w.y) / 2 * el.height]; };
      const surf = (u, v, s) => { const a = 2 * Math.PI * u - Math.PI, th = Math.PI * v, st = Math.sin(th), ct = Math.cos(th), rib = 1 + .055 * Math.cos(10 * a) - .022, r = PK.R * st * rib * (s || 1); return new T.Vector3(r * Math.sin(a), -ct * (PK.Hh - PK.Hh * .22 * Math.pow(1 - st, 3)) * (s || 1), r * Math.cos(a)); };
      if (kind === 'lid') for (let k = 0; k <= 48; k++) out.push(P(surf(k / 48, PK.vLid, 1.005)));
      if (kind === 'guts') for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; out.push(P(new T.Vector3(Math.cos(a) * 5, -PK.Hh * .2 + 3, Math.sin(a) * 5))); }
      if (kind === 'candle') { const w = new T.Vector3(); pk.tl.getWorldPosition(w); w.project(H.camera); out.push([el.left + (w.x + 1) / 2 * el.width, el.top + (1 - w.y) / 2 * el.height]); }
      if (kind === 'face') { const poly = FACES[pk.face][i], pts = poly.concat([poly[0]]); for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 5; j++) { const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * j / 5, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * j / 5, [px, py] = toPx(x, y, 1024, 512, PK.R, PK.Hh); out.push(P(surf(px / 1024, py / 512, 1.002))); } }
      return out;
    } } };

  SE.pack(EID, { on: enable, off: disable, targets, describe });
})();

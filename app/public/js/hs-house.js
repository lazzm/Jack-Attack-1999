/* hs-house: THE REST OF JACK'S HOUSE (loaded the first time the bedroom door opens): the landing, the stairs, the hall,
 * the cupboard under the stairs (with the old SNES on a box: Agent L's games, through js/rm-tv.js), the lounge (the family
 * telly with TELLY-TEXT and the video recorder: js/hs-telly.js; the landline: js/hs-life.js), and the kitchen (the fridge
 * door, the biscuit tin, the microwave flashing 12:00). Same kit, same look as the bedroom (js/rm-room.js).
 *
 * The plan (cm, y down). Upstairs floor y 73, ceiling y -185; downstairs floor y 353, ceiling y 95.
 *   upstairs:   Jack's room x -280..240, z -56..250 | the landing x 250..410, z 130..250 and x 250..330, z 250..700
 *   the stairs: x 330..410, from the landing at z 250 (y 73) down to the hall at z 600 (y 353)
 *   downstairs: the kitchen x -280..195, z -56..295 | the lounge x -280..195, z 305..700 | the hall x 205..410 (round the stairs)
 *               the cupboard under the stairs x 332..408, z 252..440 (mind your head)
 * For other packs: spot ids here start 'hs.' (Room.addClue works on them too); finds can hide in 'hs.cup.box',
 * 'hs.cup.bag', 'hs.cup.shelf' (the cupboard), 'hs.sofa', 'hs.kit.drawer' via RoomCat FINDS (spot: id). The SNES spot is
 * 'snes': it opens RoomTV.open('snes', ...) once rm-tv.js knows the console (RoomCat.CONSOLES.snes + RoomTV.LOOK.snes). */
(function () {
  'use strict';
  const H = window.House; if (!H || !H.ok || window.HouseRooms) return;
  const K = H.K, T = H.T, A = window.HouseArt, M = K.mat, D2R = Math.PI / 180;
  const R = window.Room, CAT = window.RoomCat;
  const UY = 73, UC = -185, GY = 353, GC = 95;
  const tex = n => A.t(n);
  const say = (t, x, ms) => H.say(t, x, ms);
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  const sis = () => { try { return Cast.n('sister'); } catch (e) { return 'my sister'; } };
  const secret = id => { try { R._.secret(id); } catch (e) {} };
  const mWhite = M({ c: '#efece4', sh: 20, sp: '#222' }), mSkirt = M({ c: '#efebe0', map: tex('whiteGloss'), sh: 30, sp: '#333' });
  const mBrass = M({ c: '#c8a040', sh: 70, sp: '#a08040' }), mMetal = M({ c: '#9a9aa0', sh: 60, sp: '#888' }), mDark = M({ c: '#1b1b1e', sh: 20, sp: '#222' });
  const PICK = new T.MeshBasicMaterial({ visible: false });
  const SECRETS = [
    ['hs.downstairs', 'Downstairs', 'Leave Jack\'s room and go downstairs.'],
    ['hs.cupboard', 'Mind Your Head', 'Find the light in the cupboard under the stairs.'],
    ['hs.ttx', 'Page 100', 'Read TELLY-TEXT on the family telly.'],
    ['hs.ttx.hidden', 'Off the Index', 'Find a TELLY-TEXT page that is not on any index.'],
    ['hs.vhs', 'Be Kind, Rewind', 'Rewind a video tape all the way to the start.'],
    ['hs.timer', 'Set the Timer', 'Try (and fail) to set the video recorder to record something.'],
    ['hs.phone', 'Get Off the Phone!', 'Answer the family phone.'],
    ['hs.1471', 'Who Was That?', 'Dial the number that tells you who rang last.'],
    ['hs.tin', 'Biscuit Thief', 'Raid the biscuit tin.'],
    ['hs.micro', '12:00', 'Set the clock on the microwave. Finally.'],
    ['hs.fridge', 'Fridge Poet', 'Spell something with the fridge magnets.'],
    ['hs.sister', 'Keep Out', 'Try to go into your little sister\'s room.'],
    ['hs.snes', 'Old Faithful', 'Play the old console in the cupboard under the stairs.'],
    ['hs.bamboozle', 'Befuddled!', 'Get every question right on the TELLY-TEXT quiz in one go.'],
  ];
  try { for (const [id, n, h] of SECRETS) Apps.defineSecret(id, n, h); } catch (e) {}

  // ================================================================ building helpers: a room's shell with holes for doors and windows
  // walls face into the room. holes: { n: [[a0, a1, top, bottom]], ... } a = along the wall (x for n/s, z for e/w)
  function shell(B, d) {
    const { x0, z0, x1, z1, fy, cy } = d, wm = d.wall, H0 = fy - cy;
    const side = (k, s0, s1, fixed, ry) => {
      const holes = ((d.holes || {})[k] || []).slice().sort((p, q) => p[0] - q[0]);
      const seg = (a0, a1, top, bot) => { if (a1 - a0 < 0.1 || bot - top < 0.1) return; const mid = (a0 + a1) / 2, my = (top + bot) / 2; const pos = k === 'n' || k === 's' ? [mid, my, fixed] : [fixed, my, mid]; B.plane(pos[0], pos[1], pos[2], a1 - a0, bot - top, wm, { ry, uv: d.uv || 128 }); };
      let a = s0;
      for (const h of holes) { seg(a, h[0], cy, fy); seg(h[0], h[1], cy, h[2]); seg(h[0], h[1], h[3], fy); a = h[1]; }
      seg(a, s1, cy, fy);
      // skirting along the solid bits (not across doorways)
      if (d.skirt !== false) {
        let b = s0; const sk = (p, q) => { if (q - p < 1) return; const mid = (p + q) / 2; const off = k === 'n' ? [mid, fixed + 0.8] : k === 's' ? [mid, fixed - 0.8] : k === 'w' ? [fixed + 0.8, mid] : [fixed - 0.8, mid]; B.box(off[0], fy - 4.5, off[1], k === 'n' || k === 's' ? q - p : 1.6, 9, k === 'n' || k === 's' ? 1.6 : q - p, mSkirt); };
        for (const h of holes) { if (h[3] >= fy - 0.5) { sk(b, h[0]); b = h[1]; } }
        sk(b, s1);
      }
    };
    side('n', x0, x1, z0, 0); side('s', x0, x1, z1, 180); side('w', z0, z1, x0, 90); side('e', z0, z1, x1, -90);
    if (d.floor) B.plane((x0 + x1) / 2, fy, (z0 + z1) / 2, x1 - x0, z1 - z0, d.floor, { rx: 90, uv: d.fuv || 90 });
    if (d.ceil !== false) B.plane((x0 + x1) / 2, cy, (z0 + z1) / 2, x1 - x0, z1 - z0, d.ceil || M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 });
    // darkness in the corners: where the walls meet the floor and the ceiling
    const w = x1 - x0, dd = z1 - z0;
    [[(x0 + x1) / 2, z0 + 0.3, w, 0], [(x0 + x1) / 2, z1 - 0.3, w, 180], [x0 + 0.3, (z0 + z1) / 2, dd, 90], [x1 - 0.3, (z0 + z1) / 2, dd, -90]].forEach(([x, z, len, ry]) => {
      B.ao(x, fy - 16, z, len, 32, { ry, rx: 180, a: 0.5 }); B.ao(x, cy + 13, z, len, 26, { ry, a: 0.3 });
    });
    [[(x0 + x1) / 2, z0 + 14, w, 28, 180], [(x0 + x1) / 2, z1 - 14, w, 28, 0], [x0 + 14, (z0 + z1) / 2, dd, 28, -90], [x1 - 14, (z0 + z1) / 2, dd, 28, 90]].forEach(([x, z, len, dep, ry]) => B.ao(x, fy - 0.15, z, len, dep, { rx: 90, ry, a: 0.4 }));
  }
  // a flat polygon from 3D points [x, y, z] (any plane), double-sided material expected
  function poly(B, pts, m) {
    const g = new T.BufferGeometry(), pos = [], idx = [], uv = [];
    pts.forEach((p, i) => { pos.push(p[0], p[1], p[2]); uv.push(0, 0); if (i > 1) idx.push(0, i - 1, i); });
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return B.geo(g, 0, 0, 0, m, { uv: 128 });
  }
  // a door in a wall, on a hinge (k: n/s/e/w side of the room it's built in; a0..a1 along the wall)
  function doorway(r, B, id, k, fixed, a0, a1, fy, o) {
    o = o || {};
    const hgt = o.h || 205, top = fy - hgt, mid = (a0 + a1) / 2, dw = a1 - a0 + 0.2;
    const along = k === 'n' || k === 's';
    const P = (a, y, n) => along ? [a, y, fixed + n * (k === 'n' ? 1 : -1)] : [fixed + n * (k === 'w' ? 1 : -1), y, a];
    // the frame (architrave) both sides, and the reveal
    for (const sgn of (o.noframe ? [] : [1, -1])) {
      const [ax, ay, az] = P(a0 - 3.3, (top + fy) / 2, sgn); const [bx, by, bz] = P(a1 + 3.3, (top + fy) / 2, sgn); const [tx, ty, tz] = P(mid, top - 3.3, sgn);
      B.box(ax, ay, az, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mWhite); B.box(bx, by, bz, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mWhite); B.box(tx, ty, tz, along ? dw + 13 : 2.4, 6, along ? 2.4 : dw + 13, mWhite);
    }
    const rv = M({ c: '#e4e0d4', side: 2 }); // (double-sided: no see-through slot beside the open leaf)
    if (o.noframe) { /* (the frame and reveal were built with the wall) */ } else if (along) { B.plane(a0, (top + fy) / 2, fixed, 10, hgt, rv, { ry: 90 }); B.plane(a1, (top + fy) / 2, fixed, 10, hgt, rv, { ry: -90 }); B.plane(mid, top, fixed, a1 - a0, 10, rv, { rx: -90 }); }
    else { B.plane(fixed, (top + fy) / 2, a0, 10, hgt, rv, { ry: 0 }); B.plane(fixed, (top + fy) / 2, a1, 10, hgt, rv, { ry: 180 }); B.plane(fixed, top, mid, 10, a1 - a0, rv, { rx: -90 }); }
    if (o.leaf === false) return null;
    // the leaf, hinged at a1 (or a0 with o.flip), swinging into the room on the + side
    const hinge = o.flip ? a0 : a1, pv = new T.Group();
    const [hx, , hz] = P(hinge, 0, o.inside ? 2.5 : -2.5); pv.position.set(hx, 0, hz); r.group.add(pv);
    const D = K.into(pv), lm = o.mat || M({ c: '#efebe2', map: tex('whiteGloss'), sh: 24, sp: '#333' });
    const sgnA = o.flip ? 1 : -1; // leaf goes from the hinge back across the opening
    const cx = along ? sgnA * dw / 2 : 0, cz = along ? 0 : sgnA * dw / 2;
    D.box(cx, top + 0.3 + (hgt - 0.2) / 2, cz, along ? dw : 3.6, hgt - 0.2, along ? 3.6 : dw, lm);
    // panels both sides, the handle both sides
    for (const sgn of [-1, 1]) {
      for (const [u, v] of (o.glass ? [[-0.17, 0.2], [0.17, 0.2]] : [[-0.17, -0.25], [0.17, -0.25], [-0.17, 0.2], [0.17, 0.2]])) {
        const ph = (hgt - 1) * 0.38, pw = dw * 0.34, py = top + 0.5 + (hgt - 1) * (0.5 + v), pa = sgnA * dw / 2 + u * dw * 1.5;
        if (along) D.box(pa, py, sgn * 1.95, pw, ph, 0.4, (o.panel || M('#e2ded4'))); else D.box(sgn * 1.95, py, pa, 0.4, ph, pw, (o.panel || M('#e2ded4')));
      }
      const ha = sgnA * (dw - 7); if (along) { D.box(ha, fy - 103, sgn * 2.4, 1.6, 2.2, 1.2, mBrass); D.box(ha - sgnA * 3, fy - 103, sgn * 4, 7, 1.4, 1.4, mBrass); } else { D.box(sgn * 2.4, fy - 103, ha, 1.2, 2.2, 1.6, mBrass); D.box(sgn * 4, fy - 103, ha - sgnA * 3, 1.4, 1.4, 7, mBrass); }
    }
    if (o.deco) o.deco(D, { along, sgnA, dw, top, hgt, fy });
    return pv;
  }
  const pickBox = (r, id, x, y, z, w, h, d, ry) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), PICK); m.position.set(x, y, z); m.rotation.y = (ry || 0) * D2R; r.group.add(m); m.userData.spot = id; const s = H.SPOTS[id]; H.spot(id, Object.assign({}, s || { label: id }, { obj: m })); return m; };
  const look = (lvl, fx, fz, tx, ty, tz, eye) => { const fy = lvl === 'U' ? UY : GY, ey = fy - (eye || 158); return { x: fx, y: ey, z: fz, ry: Math.atan2(tx - fx, -(tz - fz)) / D2R, rx: Math.atan2(-(ty - ey), Math.hypot(tx - fx, tz - fz)) / D2R, lvl }; };
  const sayLines = (id, title, lines) => { let i = 0; return () => { say(typeof title === 'function' ? title() : title, cast(lines[i++ % lines.length])); }; };
  const wrapSpot = (id, def) => { // a spot whose clicks go through the bedroom's wrapper (clues from other packs, finds)
    const s = H.spot(id, def); const inner = s.act; s.wrapped = 1;
    s.act = () => { const cl = (R._clues && R._clues(id)) || []; if (cl.length) { const c = cl[0]; say(c.title || (typeof s.label === 'function' ? s.label() : s.label), typeof c.text === 'function' ? c.text() : c.text); if (c.secret) secret(c.secret); return; }
      const hid = (CAT && CAT.FINDS || []).filter(f => f.spot === id && R._.isOut(f.from) && !R._.S.f[f.id]); if (hid.length) return R._.foundIt(hid[0]); if (inner) inner(id); };
    return s;
  };
  // time of day for lighting (the same rough sunrise/sunset as the bedroom)
  const pbEl = document.getElementById('bootPower');
  const phase = () => { const c = pbEl ? pbEl.classList : null; if (c && (c.contains('rm-night') || c.contains('rm-dusk') || c.contains('rm-dawn') || c.contains('rm-day'))) return c.contains('rm-night') ? 'night' : c.contains('rm-dusk') ? 'dusk' : c.contains('rm-dawn') ? 'dawn' : 'day'; const h = new Date().getHours(); return h < 6 || h >= 20 ? 'night' : h < 8 ? 'dawn' : h >= 18 ? 'dusk' : 'day'; };
  const lightsOn = {}; // room -> ceiling light on? (set by the switches; js/hs-life.js decides the defaults)
  const lit = id => lightsOn[id] != null ? lightsOn[id] : (phase() !== 'day');
  function interiorAmb(id, dayIntensity = .64) {
    if (phase() === 'day') return {sky: '#d6dfe8', gnd: '#887d6e', i: dayIntensity};
    if (lit(id)) return {sky: '#ded1bc', gnd: '#7a6853', i: .5};
    return phase() === 'night' ? {sky: '#7887a2', gnd: '#45464c', i: .3} : {sky: '#c1adb2', gnd: '#746251', i: .46};
  }
  function outdoorAmb(ground) {
    return phase() === 'day' ? {sky: '#cfe0ff', gnd: ground, i: .78} : phase() === 'night' ? {sky: '#7283a4', gnd: '#49514e', i: .46} : {sky: '#d9b6ae', gnd: '#66654f', i: .62};
  }
  const sky = () => K.TEX['rm.sky'];
  const phaseTextures = new Set();
  function phaseTex(key, w, h, paint, options) {
    const t = K.tex(key, w, h, paint, options);
    t.userData.repaintPhase = () => {paint(t.userData.g, w, h); t.needsUpdate = true;};
    phaseTextures.add(t); return t;
  }

  // ================================================================ THE LANDING (and the stairs going down)
  function buildLanding(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperHall') }), carpet = M({ c: '#fff', map: tex('carpetBeige') });
    // floor: round the stairwell (the hole the stairs come up through)
    B.plane(330, UY, 189.5, 160, 121, carpet, { rx: 90, uv: 90 }); B.plane(290, UY, 475, 80, 450, carpet, { rx: 90, uv: 90 }); B.plane(370, UY, 650, 80, 100, carpet, { rx: 90, uv: 90 });
    // walls
    const wl = (x, y, z, w, h, ry) => B.plane(x, y, z, w, h, wall, { ry, uv: 128 });
    // west wall x 250: doors to Jack's room (150..230), the bathroom (300..380), the little sister's room (450..530)
    [[130, 150], [230, 300], [380, 450], [530, 700]].forEach(([a, b]) => wl(250, (UC + UY) / 2, (a + b) / 2, b - a, UY - UC, 90));
    [[150, 230], [300, 380], [450, 530]].forEach(([a, b]) => wl(250, (UC - 132) / 2, (a + b) / 2, b - a, -132 - UC, 90));
    wl(330, (UC + UY) / 2, 130, 160, UY - UC, 0); // the end wall (north)
    // east wall x 410: right down the stairwell to the hall floor, with a little window halfway
    wl(410, (UC + GY) / 2, 190, 120, GY - UC, -90); wl(410, (UC + GY) / 2, 650, 100, GY - UC, -90);
    wl(410, (UC + GY) / 2, (250 + 400) / 2, 150, GY - UC, -90); wl(410, (UC + GY) / 2, (480 + 600) / 2, 120, GY - UC, -90);
    wl(410, (UC - 80) / 2, 440, 80, -80 - UC, -90); wl(410, (60 + GY) / 2, 440, 80, GY - 60, -90);
    // the landing window (frosted, bubbly 70s glass Dad never replaced)
    B.plane(410.8, -10, 440, 80, 140, M({ c: '#d8e0e8', o: 0.5, tr: true, sh: 80, sp: '#fff' }), { ry: -90 });
    B.plane(500, -10, 440, 300, 400, M({ c: '#fff', map: sky(), basic: true }), { ry: -90 });
    [[400, -80, 440, 1, 6, 80], [400, 60, 440, 1, 6, 80], [400, -10, 400, 1, 146, 6], [400, -10, 480, 1, 146, 6]].forEach(([x, y, z, w, h, d]) => B.box(x + 8.75, y, z, 1.5, h, d, mWhite));
    B.rbox(408.5, 62, 440, 3, 3, 90, 0.8, mWhite);
    wl(330, (UC + UY) / 2, 700, 160, UY - UC, 180); // the front end (south): Mom and Dad's door
    // the ceiling (with a loft hatch) and the stairwell's upper walls
    B.plane(330, UC, 190, 160, 120, M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 }); B.plane(330, UC, 475, 160, 450, M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 });
    B.box(290, UC + 0.5, 600, 60, 1.6, 70, mWhite); B.box(290, UC + 1.2, 600, 56, 0.6, 66, M('#d8d4c8'));
    // the floor's edge round the stairwell (you can see its thickness from the stairs)
    const edgeM = M('#d8d0c0');
    B.plane(329.9, (UY + GC) / 2, 425, 350, GC - UY, edgeM, { ry: 90 }); B.plane(370, (UY + GC) / 2, 600.1, 80, GC - UY, edgeM, { ry: 180 }); // (the slab ends at the stairwell: edge faces the stairs)
    B.box(331.4, UY - 0.6, 425, 3.2, 1.2, 350, mSkirt); B.box(370, UY - 0.6, 598.4, 80, 1.2, 3.2, mSkirt); // the nosing round the opening
    B.box(245, UY + 1.1, 190, 10.4, 2.2, 80, M({ c: '#fff', map: tex('oak') })); B.box(245, UY - 0.45, 190, 10.4, 0.9, 80, M({ c: '#fff', map: tex('oak') })); // the threshold strip: fills the wall thickness between Jack's carpet and the landing, flush with both
    
    // the banisters: round the stairwell up here, and down the stairs
    banister(B, [[330, 252], [330, 600], [410, 600]], UY); // (the whole open edge of the stairwell: newels with round caps at the corners; blocked below)
    // skirting on the landing walls
    [[130, 150], [230, 300], [380, 450], [530, 700]].forEach(([a, b]) => B.box(250.8, UY - 4.5, (a + b) / 2, 1.6, 9, b - a, mSkirt));
    stairs(B);
    // ao along the landing walls
    B.ao(250.3, UY - 16, 415, 570, 32, { ry: 90, rx: 180, a: 0.5 }); B.ao(330, UY - 16, 130.3, 160, 32, { rx: 180, a: 0.5 });
    batch.build(r.group);
    // doors: Jack's (already there: js/rm-room.js), the bathroom, the little sister's room, Mom and Dad's
    const Bd = K.into(K.batch()); // (frames go in the batch below)
    const fb = K.batch(), F = K.into(fb);
    doorway(r, F, 'jackframe', 'w', 250, 150, 230, UY, { leaf: false }); // (Jack's door from the landing side: architrave and reveal; the leaf is in js/rm-room.js)
    doorway(r, F, 'bath', 'w', 250, 300, 380, UY, { leaf: true, inside: true });
    const sd = doorway(r, F, 'sis', 'w', 250, 450, 530, UY, { inside: true, deco: (D, g) => { D.plane(g.along ? 0 : 2.6, -64, g.sgnA * g.dw / 2, 30, 20, M({ c: '#fff', map: sisSign() }), { ry: 90 }); } });
    const md = doorway(r, F, 'mum', 's', 700, 260, 340, UY, { inside: true });
    fb.build(r.group); void Bd;
    H.spot('hs.bath', { label: 'The bathroom', act: sayLines('hs.bath', 'The bathroom', ['Somebody is in there. Somebody is ALWAYS in there.', 'Mom says the bath is for Sunday nights and the immersion heater is not made of money.', 'There is a queue. There is only one bathroom. There are four of us. Maths.']) }); pickBox(r, 'hs.bath', 250, -30, 340, 6, 200, 80);
    H.spot('hs.sis', { label: () => sis() + "'s room", act: () => { secret('hs.sister'); say(sis() + "'s room", cast(['"KEEP OUT. THIS MEANS YOU JACK." There is a drawing of me with horns.', '{sister} is in there playing {sister.his} Spice Girls tape. Again. On repeat. Since 4 o\'clock.', 'I knocked. A voice said "GO AWAY". Fair enough.'][((H.SPOTS['hs.sis'].n = (H.SPOTS['hs.sis'].n | 0) + 1) - 1) % 3])); } }); pickBox(r, 'hs.sis', 250, -30, 490, 6, 200, 80);
    H.spot('hs.mum', { label: "Mom and Dad's room", act: sayLines('hs.mum', "Mom and Dad's room", ['Not allowed. There is nothing in there anyway, except Dad\'s exercise bike being used as a clothes horse.', 'The door\'s shut. Christmas presents get hidden in there. Allegedly.']) }); pickBox(r, 'hs.mum', 300, -30, 698, 80, 200, 6);
    H.spot('hs.loft', { label: 'The loft hatch', act: sayLines('hs.loft', 'The loft', ['The loft. Dad goes up there once a year for the Christmas decorations and comes down covered in fibreglass.', 'There\'s a pole with a hook for opening it. Nobody knows where the pole is.']) }); pickBox(r, 'hs.loft', 290, UC + 2, 600, 60, 3, 70);
    H.spot('hs.lwin', { label: 'The landing window', act: () => say('The landing window', 'Bubbly glass, so you can\'t see out properly. You can see it\'s ' + ({ day: 'daytime', night: 'dark', dusk: 'getting dark', dawn: 'getting light' })[phase()] + ' though.') }); pickBox(r, 'hs.lwin', 408, -10, 440, 4, 140, 80);
    H.spot('hs.banister', { label: 'The banister', act: sayLines('hs.banister', 'The banister', ['I am not allowed to slide down it. I have slid down it.', 'Polished smooth from sixteen years of hands. And one slide.']) }); pickBox(r, 'hs.banister', 330, 30, 425, 6, 90, 350);
    // where you can walk up here
    H.walkRect('U', 252, 132, 408, 250, { room: 'landing' }); H.walkRect('U', 252, 250, 328, 698, { room: 'landing' }); H.walkRect('U', 332, 602, 408, 698, { room: 'landing' });
    H.block('U', 324, 250, 336, 600); H.block('U', 330, 596, 410, 606); // the banisters
  }
  function sisSign() { return K.tex('hs.sissign', 256, 170, (g, w, h) => { g.fillStyle = '#ff9ad0'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { A.star(g, (i * 53) % w, (i * 37) % h, 6, 5); g.fill(); } A.text(g, cast("{sister}'S ROOM").toUpperCase(), 128, 60, '34px ' + A.FONT, '#b0106a', 'center'); A.text(g, 'KEEP OUT!!!', 128, 104, '30px ' + A.FONT, '#c00', 'center'); A.text(g, '(this means YOU Jack)', 128, 140, '700 16px ' + A.HAND, '#333', 'center'); }); }
  // spindles and a handrail along a run of points (on the landing, round the stairwell)
  function banister(B, pts, fy) {
    const wood = M({ c: '#fff', map: tex('oak') }), spin = M({ c: '#f0ece2', sh: 30 });
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) / D2R;
      B.box((x0 + x1) / 2, fy - 90, (z0 + z1) / 2, 6, 5, len + 6, wood, { ry }); // the rail
      B.box((x0 + x1) / 2, fy - 3, (z0 + z1) / 2, 6, 6, len, wood, { ry }); // the base rail
      const n = Math.floor(len / 12);
      for (let k = 1; k < n; k++) { const t = k / n; B.cyl(x0 + (x1 - x0) * t, fy - 46.5, z0 + (z1 - z0) * t, 1.4, 1.4, 81, 8, spin); }
    }
    for (const [x, z] of pts) { B.box(x, fy - 52, z, 9, 104, 9, wood); B.ball(x, fy - 106, z, 4.6, 4.6, 4.6, wood, 12); }
  }
  // the stairs: 14 steps of 20 cm, a carpet runner, the handrail down the open side, the panelled side under it
  function stairs(B) {
    // ONE flight: 13 treads of going 25 and rise 20, between the string on the banister side (x 327..333) and the east wall (x 410).
    const carpet0 = M({ c: '#fff', map: tex('carpetBeige') }), tread = M({ c: '#fff', map: tex('carpetBeige') }), wood = M({ c: '#fff', map: tex('oak') }), riser = M({ c: '#fff', map: tex('carpetBeige') }), spin = M({ c: '#f0ece2', sh: 30 });
    const X0 = 333, X1 = 409.8, XC = (X0 + X1) / 2, XW = X1 - X0, pitch = z => UY + 0.8 * (z - 250);
    for (let k = 1; k <= 13; k++) {
      const z0 = 250 + 25 * (k - 1), y = UY + 20 * k;
      B.box(XC, y + 1.5, z0 + 13.5, XW, 3, 27, { t: tread, all: M('#7a6a52') }); // tread (with a nosing)
      B.box(XC, y - 9.9, z0 + 0.5, XW, 19.8, 1.2, riser); // riser (its top is hidden inside the tread above)
      B.box(XC, y + 3.2, z0 + 25.5, XW - 2, 0.6, 2, mBrass); // the stair rod (carpet grip)
    }
    B.box(XC, GY - 9.9, 575, XW, 19.8, 1.2, riser); B.plane(370, GY, 520.5, 80, 159, carpet0, { rx: 90, uv: 90 }); // (the foot of the stairs, and the hall floor under them)
    // the closed string on the open side: from just above the nosings to just under the soffit; the handrail and spindles stand on it
    const ang = Math.atan2(0.8, 1) / D2R, z1 = 252, z2 = 600, zc = (z1 + z2) / 2, L = Math.hypot(z2 - z1, 0.8 * (z2 - z1));
    B.box(330, pitch(zc) + 8, zc, 6, 25, L, wood, { rx: -ang });
    B.box(330, pitch(zc) - 92, zc, 6, 5, L, wood, { rx: -ang });
    for (let k = 1; k <= 13; k++) { const z = 250 + 25 * k - 12.5; B.cyl(330, pitch(z) - 48.75, z, 1.4, 1.4, 82.5, 8, spin); }
    B.box(330, GY - 52, 600, 10, 104, 10, wood); B.ball(330, GY - 107, 600, 5, 5, 5, wood, 12); // the newel post at the bottom
  }

  // ================================================================ THE HALL (round the bottom of the stairs)
  function buildHall(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperHall') }), carpet = M({ c: '#fff', map: tex('carpetBeige') });
    // the floor and the ceiling (except over the stairs)
    B.plane(307.5, GY, 155, 205, 190, carpet, { rx: 90, uv: 90 }); B.plane(267.5, GY, 425, 125, 350, carpet, { rx: 90, uv: 90 }); B.plane(307.5, GY, 650, 205, 100, carpet, { rx: 90, uv: 90 });
    const art = M({ c: '#fff', map: tex('artex') });
    B.plane(307.5, GC, 155, 205, 190, art, { rx: -90, uv: 110 }); B.plane(267.5, GC, 425, 125, 350, art, { rx: -90, uv: 110 }); B.plane(370, GC, 650, 80, 100, art, { rx: -90, uv: 110 }); B.plane(267.5, GC, 650, 125, 100, art, { rx: -90, uv: 110 });
    const wl = (x, y, z, w, h, ry) => B.plane(x, y, z, w, h, wall, { ry, uv: 128 });
    // west wall x 205: the kitchen door (150..230), the lounge door (480..560)
    [[60, 150], [230, 480], [560, 700]].forEach(([a, b]) => wl(205, (GC + GY) / 2, (a + b) / 2, b - a, GY - GC, 90));
    [[150, 230], [480, 560]].forEach(([a, b]) => wl(205, (GC + GY - 205) / 2, (a + b) / 2, b - a, GY - 205 - GC, 90));
    wl(307.5, (GC + GY) / 2, 60, 205, GY - GC, 0); // the back wall
    wl(410, (GC + GY) / 2, 155, 190, GY - GC, -90); // the east wall (the back bit)
    // the wall under the stairs (the cupboard), with its little door (360..440)
    // the cupboard's front wall (x 330) follows the slope of the flight; the open stairs show above it; the back wall (z 250.5) closes it from the hall
    const yU = z => UY + 0.8 * (z - 250) + 23.5, zF = 250 + (GY - UY - 23.5) / 0.8, wall2 = M({ c: '#fff', map: tex('wallpaperHall'), side: 2 }), ZB = 250.5;
    const pw = pts => poly(B, pts.map(([z, y]) => [330, y, z]), wall2);
    pw([[ZB, GY], [ZB, yU(ZB)], [362, yU(362)], [362, GY]]); pw([[362, yU(362)], [438, yU(438)], [438, GY - 94], [362, GY - 94]]); pw([[438, GY], [438, yU(438)], [zF, GY]]);
    poly(B, [[330, GC, ZB], [410, GC, ZB], [410, GY, ZB], [330, GY, ZB]], wall2);
    // the fuse box: on the hall's east wall, flush with it
    const fz = B.at(410, GY - 165, 130); fz.box(-3, 0, 0, 6, 26, 20, M('#efece4')); fz.box(-6.15, 0, 0, 0.5, 21, 16, M('#d8d4c8')); fz.box(-6.5, 0, 0, 0.3, 2, 4, M('#555'));
    // the front: the front door (260..340), the bottom of the stairs, the east wall down there
    [[205, 260], [340, 410]].forEach(([a, b]) => wl((a + b) / 2, (GC + GY) / 2, 700, b - a, GY - GC, 180));
    wl(300, (GC + GY - 210) / 2, 700, 80, GY - 210 - GC, 180);
    wl(410, (GC + GY) / 2, 650, 100, GY - GC, -90);
    // skirting
    [[60, 150], [230, 480], [560, 700]].forEach(([a, b]) => B.box(205.8, GY - 4.5, (a + b) / 2, 1.6, 9, b - a, mSkirt));
    B.box(307.5, GY - 4.5, 60.8, 205, 9, 1.6, mSkirt); B.box(329.2, GY - 4.5, 305.25, 1.6, 9, 109.5, mSkirt); B.box(329.2, GY - 4.5, 505, 1.6, 9, 130, mSkirt);
    B.ao(205.3, GY - 16, 380, 640, 32, { ry: 90, rx: 180, a: 0.5 }); B.ao(329.7, GY - 16, 425, 350, 32, { ry: -90, rx: 180, a: 0.45 });
    B.ao(206 + 14, GY - 0.3, 380, 640, 28, { rx: 90, ry: -90, a: 0.4 });
    // the front door's frame (its leaf is hinged on in init, with the drive beyond); the doormat
    doorway(r, B, 'frontframe', 's', 700, 260, 340, GY, { leaf: false });
    const fd = B.at(300, GY, 700);
    fd.box(0, -1, -42, 70, 2, 44, M({ c: '#fff', map: matTex() }));
    B.shadow(300, GY, 660, 74, 48, 0.5, { sq: true });
    // coat hooks with coats, a mirror, a radiator, the hall table with the keys bowl, a ceiling light
    const ch = B.at(206, GY - 170, 640);
    ch.box(2, 0, 0, 3, 8, 80, M({ c: '#fff', map: tex('oak') }));
    [['#2a3a5a', -28], ['#7a1a1a', -6], ['#c8a060', 16], ['#1a1a1a', 30]].forEach(([c, z]) => ch.rbox(9, 40, z, 12, 76, 22, 5, M(c)));
    const mi = B.at(206, GY - 150, 300); mi.box(1, 0, 0, 2, 60, 40, M({ c: '#fff', map: tex('oak') })); mi.plane(2.2, 0, 0, 36, 56, M({ c: '#a8b8c8', sh: 120, sp: '#fff' }), { ry: 90 });
    const rd = B.at(206, GY - 36, 400); rd.box(4, 0, 0, 3.6, 56, 90, { all: M('#e8e5dc'), r: M({ c: '#fff', map: tex('radiator'), sh: 40 }) });
    const ht = B.at(222, GY, 110); ht.box(0, -76, 0, 30, 3, 60, M({ c: '#fff', map: tex('oak') })); [[-12, -26], [12, -26], [-12, 26], [12, 26]].forEach(([x, z]) => ht.box(x, -37, z, 3, 74, 3, M({ c: '#fff', map: tex('oak') })));
    ht.lathe(0, -79, -10, [[8, -4], [3, 0]], 16, M({ c: '#c8a070', sh: 40 })); ht.box(4, -80, 12, 6, 1, 3, mMetal);
    ht.shadow(0, 0, 0, 36, 66, 0.6, { sq: true });
    B.cyl(300, GC + 1.5, 200, 6, 6, 3, 14, mWhite); B.cyl(300, GC + 15, 200, 0.3, 0.3, 26, 4, M('#eee')); B.lathe(300, GC + 26, 200, [[2, -2], [14, 10]], 18, M({ c: '#f0e0b8', sh: 10, side: 2, e: '#000' }));
    batch.build(r.group);
    // the front door (it's cold out), the coats, the hall table
    // the doormat: where the post (and mail-order parcels: Agent P's pack) lands. Things can rest on it: { room: 'hall', x: 300, y: 353, z: 655 }
    wrapSpot('hs.mat', { label: 'The doormat', act: () => say('The doormat', ['WELCOME, it says. Mom hoovers it. It is the cleanest thing in the house.', 'The post lands here. Mostly bills, and catalogues for Mom. Sometimes a parcel for ME.'][((r.mn = (r.mn | 0) + 1)) % 2]) }); pickBox(r, 'hs.mat', 300, GY - 1.2, 658, 70, 2.4, 44);
    wrapSpot('hs.coats', { label: 'Coats', act: sayLines('hs.coats', 'Coats', ['Dad\'s anorak, Mom\'s good coat, my school coat (too small), ' + sis() + '\'s pink one.', 'In my coat pocket: 20p, a bus ticket and a Chupa Chups wrapper.']) }); pickBox(r, 'hs.coats', 214, GY - 130, 640, 20, 90, 80);
    H.spot('hs.keys', { label: 'Keys bowl', act: sayLines('hs.keys', 'The keys bowl', ['Car keys, the spare front door key, a key nobody knows what it\'s for, and three buttons.']) }); pickBox(r, 'hs.keys', 222, GY - 82, 110, 30, 10, 50);
    H.spot('hs.mirror', { label: 'Mirror', act: sayLines('hs.mirror', 'Mirror', ['Still got the hair gel in from yesterday. Spiky. Excellent.', 'Is that a spot? It\'s a spot. Oh no.']) }); pickBox(r, 'hs.mirror', 207, GY - 150, 300, 3, 60, 40);
    // the cupboard door (it's a small one)
    const cd = doorway(r, K.into(r.cupFrames = K.batch()), 'cupdoor', 'w', 330, 362, 438, GY, { h: 94, inside: false, flip: false });
    r.cupFrames.build(r.group);
    H.door('cupboard', { rooms: ['hall', 'cupboard'], pivot: cd, swing: 100, dir: -1 });
    H.spot('hs.cupdoor', { label: () => H.DOORS.cupboard.open ? 'Shut the cupboard' : 'The cupboard under the stairs', obj: cd, act: () => { H.setDoor('cupboard', !H.DOORS.cupboard.open); } });
    H.walkRect('G', 207, 62, 408, 250, { room: 'hall' }); H.walkRect('G', 207, 250, 328, 600, { room: 'hall' }); H.walkRect('G', 207, 600, 408, 698, { room: 'hall' });
    H.block('G', 205, 80, 240, 140); // the hall table
  }
  function matTex() { return K.tex('hs.mat', 256, 160, (g, w, h) => { g.fillStyle = '#8a5a2a'; g.fillRect(0, 0, w, h); const r = K.rnd(5); for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,220,160,.15)'; g.fillRect(r() * w, r() * h, 1, 2); } A.text(g, 'WELCOME', 128, 96, '44px ' + A.FONT, '#3a1a0a', 'center'); }); }

  // ================================================================ THE CUPBOARD UNDER THE STAIRS (the old SNES lives here)
  function buildCupboard(r) {
    const batch = K.batch(), B = K.into(batch);
    const yAt = z => UY + (z - 250) / 350 * 280 + 22; // the sloping ceiling (the underside of the stairs)
    const wall = M({ c: '#d8d0bc', map: tex('wallWarm') });
    // enclosed under the flight: back wall (hall build), front wall (hall build), the east wall is the stairwell's own (x 410), the sloping soffit is the ceiling
    const wallD = M({ c: '#d8d0bc', map: tex('wallWarm'), side: 2 }), yU = z => UY + 0.8 * (z - 250) + 23.5, zF = 250 + (GY - UY - 23.5) / 0.8;
    B.plane(370, GY, (250.5 + 441) / 2, 80, 441 - 250.5, M({ c: '#fff', map: tex('carpetBeige') }), { rx: 90, uv: 90 });
    poly(B, [[330, yU(250.5), 250.5], [410, yU(250.5), 250.5], [410, GY, zF], [330, GY, zF]], M({ c: '#d8d2c4', side: 2 }));
    // a bare bulb on a pull cord, the electricity meter (its disc really spins), the fuse box
    B.cyl(370, 125.5, 290, 2, 2, 6, 10, mWhite); r.bulb = B.group ? null : null;
    const meter = new T.Group(); meter.position.set(410, GY - 125, 300); r.group.add(meter); const MT = K.into(meter);
    MT.box(-2, 0, 0, 4, 26, 18, M('#2a2a2a')); MT.plane(-4.1, -4, 0, 14, 10, M({ c: '#fff', map: K.tex('hs.meter', 128, 96, (g) => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 128, 96); A.text(g, 'kWh', 64, 20, '700 14px ' + A.UIF, '#222', 'center'); g.fillStyle = '#111'; g.fillRect(14, 30, 100, 26); g.fillStyle = '#fff'; [0, 4, 7, 2, 9].forEach((n, i) => A.text(g, String(n), 26 + i * 19, 50, '700 18px "Courier New",monospace', '#fff', 'center')); A.text(g, 'ELECTRICITY BOARD', 64, 84, '9px ' + A.UIF, '#555', 'center'); }) }), { ry: -90 });
    r.disc = MT.cyl(-4.6, 6, 0, 5, 5, 0.3, 24, M({ c: '#c8c8c8', sh: 80, sp: '#fff', map: K.tex('hs.disc', 64, 64, (g) => { g.fillStyle = '#c8c8cc'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c01a1a'; g.fillRect(28, 0, 8, 12); }) }), { rz: 90 });
    // the old portable telly on a box, the SNES on another, a tangle of leads
    const bx = B.at(380, GY, 300); bx.box(0, -22, 0, 44, 44, 34, { all: M('#b89060'), t: M({ c: '#fff', map: boxTex('TEA CHEST', '#b89060') }) }); bx.shadow(0, 0, 0, 52, 42, 0.7, { sq: true });
    const tv = new T.Group(); tv.position.set(380, GY - 44, 296); tv.rotation.y = -20 * D2R; r.group.add(tv); const TV = K.into(tv);
    TV.rbox(0, -14, 2, 34, 28, 10, 1.4, M({ c: '#d8d4c8', sh: 20 })); TV.geo(taperG(30, 24, 16, 0.6), 0, -14, -11, M('#c8c4b8'));
    r.cupScreen = new T.Mesh(new T.PlaneGeometry(24, 18), new T.MeshBasicMaterial({ color: 0xffffff, map: tex('screenOff') })); flipUV(r.cupScreen.geometry); r.cupScreen.position.set(-2, -15, 7.15); tv.add(r.cupScreen);
    TV.box(13, -10, 7.2, 3, 1.4, 0.4, M('#444')); TV.box(13, -6, 7.2, 3, 1.4, 0.4, M('#444')); TV.shadow(0, 0, 0, 38, 28, 0.6, { sq: true });
    H.spot('cuptv', { label: 'The old portable telly', obj: tv, act: () => H.act('snes') });
    const sn = new T.Group(); sn.position.set(352, GY, 340); sn.rotation.y = 15 * D2R; r.group.add(sn); const SN = K.into(sn); r.snesObj = sn;
    SN.box(0, -14, 0, 30, 28, 30, { all: M('#a07a4a'), t: M({ c: '#fff', map: boxTex('XMAS DECS', '#a07a4a') }) }); SN.shadow(0, 0, 0, 36, 36, 0.6, { sq: true });
    SN.rbox(0, -31.5, 0, 24, 6, 20, 1.2, M({ c: '#c8c6c0', sh: 20 })); SN.rbox(0, -35, -1, 14, 2, 8, 0.8, M('#a8a6a0'));
    SN.box(-6, -36.4, -1, 4, 1, 2.4, M('#7a5aa8')); SN.box(6, -36.4, -1, 4, 1, 2.4, M('#7a5aa8')); SN.box(0, -35.6, 6.8, 10, 1, 4, M('#5a5a5e'));
    SN.rbox(-4, -28.6, 18, 14, 2.4, 6, 1, M({ c: '#c8c6c0', sh: 20 })); SN.cyl(-8, -30, 18, 1.2, 1.2, 0.4, 4, M('#333'), { ry: 45 }); [[-1, 17, '#2a8a3a'], [0.4, 18.4, '#d02a2a'], [1.8, 17, '#2a5ad0'], [0.4, 15.6, '#e8c020']].forEach(([x, z, c]) => SN.cyl(x, -30, z, 0.6, 0.6, 0.4, 8, M(c)));
    const cords = new T.CatmullRomCurve3([new T.Vector3(0, -32, -10), new T.Vector3(8, -2, -20), new T.Vector3(20, -1, -40), new T.Vector3(28, -45, -42)]); SN.geo(new T.TubeGeometry(cords, 20, 0.4, 5), 0, 0, 0, M('#1a1a1a'));
    H.spot('snes', { label: 'The old console (Super Famicart)', obj: sn, act: snes });
    // the hoover, the ironing board, Dad's toolbox, wellies, a bag of old toys, a shelf of paint tins
    const hv = B.at(398, GY, 420); hv.cyl(0, -15, 0, 11, 12, 30, 18, M({ c: '#d02a2a', sh: 40, sp: '#444' })); hv.lathe(0, -30, 0, [[11, 0], [7, -6], [0.5, -9]], 18, M('#d02a2a')); hv.ball(0, -40, 0, 4, 4, 4, M('#222'), 8); hv.cyl(-10, -20, 10, 1.4, 1.4, 50, 8, M('#444'), { rx: 40, rz: 20 }); hv.shadow(0, 0, 0, 30, 30, 0.7);
    B.box(346, GY - 70, 260, 32, 140, 3, M('#9aa0a8'), { rx: -12 }); B.box(346, GY - 70, 262, 34, 4, 3, M('#7a7a80'), { rx: -12 });
    const tb = B.at(350, GY, 390); tb.box(0, -10, 0, 40, 20, 20, M({ c: '#c82a1a', sh: 50, sp: '#555' })); tb.box(0, -22, 0, 30, 4, 4, M('#333')); tb.shadow(0, 0, 0, 46, 26, 0.6, { sq: true });
    const bg = B.at(395, GY, 260); bg.ball(0, -16, 0, 14, 16, 12, M({ c: '#e8e4dc', sh: 30, sp: '#555' }), 12); bg.box(-8, -30, 0, 4, 8, 4, M('#5a8ad0')); bg.ball(6, -32, 2, 4, 4, 4, M('#f0c000'), 8); bg.shadow(0, 0, 0, 30, 26, 0.6);
    const sh = B.at(410, GY - 120, 360); sh.box(-8, 0, 0, 16, 2, 60, M({ c: '#fff', map: tex('pine') })); [[-8, -16], [-8, 0], [-8, 16]].forEach(([x, z], i) => sh.cyl(x, -7, z, 5, 5, 12, 14, M(['#e8e4dc', '#a8c8e0', '#f0d080'][i])));
    batch.build(r.group);
    // the light (a pull cord)
    const bl = new T.Group(); bl.position.set(370, 127, 290); r.group.add(bl); const BL = K.into(bl);
    BL.cyl(0, 6, 0, 0.3, 0.3, 12, 4, M('#eee')); r.bulbMesh = BL.ball(0, 15, 0, 3.4, 4.4, 3.4, M({ c: '#f4f0e0', e: '#000' }).clone(), 12);
    BL.cyl(6, 40, 0, 0.15, 0.15, 74, 4, M('#ddd')); BL.ball(6, 78, 0, 0.9, 1.4, 0.9, M('#e8e0c8'), 8);
    H.spot('hs.cord', { label: 'Light cord', obj: bl, act: () => { lightsOn.cupboard = !lit('cupboard'); secret('hs.cupboard'); cupLight(r); H.relight(); H.sfx.tone(900, 0.03, 'square', 0.06); } });
    wrapSpot('hs.cup.box', { label: 'Box of old games', act: () => say('Box of old games', 'My old games box: Segue manuals with no games, a broken Game Gear, and a Tiny Toons sticker book.') }); pickBox(r, 'hs.cup.box', 380, GY - 20, 300, 44, 44, 34);
    wrapSpot('hs.cup.bag', { label: 'Bag of old toys', act: () => say('Bag of old toys', 'He-Man, a Big Trak with no batteries, half a Ker-Plunk, and every Kinder Egg toy from 1993.') }); pickBox(r, 'hs.cup.bag', 395, GY - 16, 260, 28, 32, 24);
    wrapSpot('hs.cup.shelf', { label: 'Shelf of paint tins', act: () => say('Paint tins', 'Magnolia, magnolia, "Barley White" (magnolia), and a tiny pot of the blue from my room.') }); pickBox(r, 'hs.cup.shelf', 400, GY - 128, 360, 16, 14, 60);
    H.spot('hs.hoover', { label: 'The hoover', act: () => (window.Chores && Chores.take && Chores.take('hoover')) || loadLife().then(() => HouseLife.chore('hoover'), () => {}) }); pickBox(r, 'hs.hoover', 398, GY - 22, 420, 24, 44, 24);
    H.spot('hs.meter', { label: 'Electricity meter', obj: meter, act: () => say('Electricity meter', 'The little disc goes round faster when the immersion heater\'s on. Dad watches it like it\'s the Grand National.') });
    H.spot('hs.tools', { label: "Dad's toolbox", act: sayLines('hs.tools', "Dad's toolbox", ['Do NOT touch Dad\'s toolbox. (A spirit level, 400 screws, no screwdriver.)']) }); pickBox(r, 'hs.tools', 350, GY - 12, 390, 40, 24, 20);
    H.ambient.add(() => { if (r.disc && r.group.visible) r.disc.rotation.y += lit('cupboard') ? 0.08 : 0.03; });
    H.walkRect('G', 334, 254, 406, 372, { room: 'cupboard' }); H.walkRect('G', 326, 366, 338, 434, { door: 'cupboard', room: 'hall' });
    H.block('G', 356, 280, 406, 322); H.block('G', 334, 322, 372, 360); H.block('G', 380, 246, 410, 276);
    cupLight(r);
  }
  function cupLight(r) { if (!r.bulbMesh) return; const ms = [].concat(r.bulbMesh.material); for (const m of ms) { m.emissive.set(lit('cupboard') ? '#ffe8a0' : '#000'); m.userData.e0 = m.emissive.clone(); } H.dirty(); }
  function boxTex(label, col) { return K.tex('hs.box.' + label, 128, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); A.grain(g, w, h, 900, 0.08, label.length); g.fillStyle = 'rgba(200,170,120,.6)'; g.fillRect(0, 56, w, 16); A.text(g, label, 64, 50, '700 15px ' + A.HAND, '#222', 'center'); }); }
  function taperG(w, h, d, k) { const g = new T.BoxGeometry(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); } g.computeVertexNormals(); return g; }
  function flipUV(geo) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); }
  // the SNES: Agent L's games through rm-tv.js (when it knows the console)
  function snes() {
    const go = () => {
      const ok = window.RoomTV && RoomTV.LOOK && RoomTV.LOOK.sn && CAT && CAT.CONSOLES && CAT.CONSOLES.sn;
      if (!ok) return say('The old console', 'My old 16-bit console from when I was little. It still works (blow on the cartridges). The games are in the box somewhere... (Coming soon: the cartridges are being dug out of the cupboard.)', 7000);
      secret('hs.snes');
      const scr = HouseRooms.rooms.cupboard.cupScreen;
      const done = () => { R.offClose && R.offClose(done); if (H.focused) H.unfocus(); };
      H.focus({ x: 368, y: GY - 62, z: 350, rx: -6, ry: -18, lvl: 'G', seat: 1 }, { ms: 700, label: 'Get up', enter: () => { try { RoomTV.open('sn', rectOf(scr)); R.onClose(done); } catch (e) { console.error(e); } } });
    };
    if (window.RoomTV) go(); else loadJs('js/rm-tv.js').then(go, () => say('Hmm', 'Try that again in a minute.'));
  }
  const loadJs = src => (window.Apps && Apps.load) ? Apps.load(src) : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  const rectOf = obj => { const b = new T.Box3().setFromObject(obj); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = H.toScreen(x, -y, z); if (!p) continue; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); } return { getBoundingClientRect: () => ({ left: x0, top: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0), right: x1, bottom: y1 }) }; };

  // ================================================================ THE LOUNGE (the family telly, the video, the phone, the fire)
  const LT = { x: -60, z: 340 }; // the telly
  function buildLounge(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperLounge') });
    shell(B, { x0: -280, z0: 305, x1: 195, z1: 700, fy: GY, cy: GC, wall, floor: M({ c: '#fff', map: tex('carpetRed') }), fuv: 44, holes: { e: [[480, 560, GY - 205, GY]], s: [[-170, 50, 150, 300]] } });
    // a picture rail and a dado-ish border
    const rail = M({ c: '#fff', map: tex('oak') });
    [[-42.5, 305.8, 475, 0], [-280 + 0.8, 502.5, 395, 90]].forEach(([x, z, len, ry]) => B.box(x, GC + 40, z, len, 3, 1.6, rail, { ry }));
    // the bay window at the front: net curtains, heavy curtains, the street outside
    const sw = -60;
    B.plane(sw, (150 + 300) / 2, 700 + 8, 220, 150, M({ c: '#fff', o: 0.18, tr: true, sh: 80, sp: '#fff' }), { ry: 180 });
    B.plane(sw, -70, 700 + 1500, 3000, 1500, M({ c: '#fff', map: streetTex(), basic: true }), { ry: 180 });
    [[sw - 110, 0], [sw + 110, 0], [sw, 0]].forEach(([x], i) => B.box(x, 225, 703, i === 2 ? 5 : 8, 150, 8, M({ c: '#f2f0ea', sh: 40 })));
    B.box(sw, 147, 703, 220, 6, 8, M('#f2f0ea')); B.box(sw, 300, 708, 236, 4, 18, mWhite); B.box(sw, 297, 700 - 4, 236, 3, 10, mWhite);
    const net = M({ c: '#fff', map: netTex(), tr: true, o: 0.85, side: 2 });
    B.plane(sw, 222, 696, 214, 140, net, { ry: 180 });
    curtainG(B, sw - 136, 140, 690, 46, 210, M({ c: '#fff', map: curtTex(), side: 2 })); curtainG(B, sw + 136, 140, 690, 46, 210, M({ c: '#fff', map: curtTex(), side: 2 }));
    B.cyl(sw, 134, 690, 1.6, 1.6, 340, 10, mBrass, { rz: 90 });
    // the fireplace on the west wall: a chimney breast, a tiled hearth, a gas fire, the mantelpiece
    const fp = B.at(-280, GY, 500);
    fp.box(20, -129, 0, 40, GY - GC, 150, M({ c: '#fff', map: tex('wallpaperLounge') }), { uv: 128, sides: 'rfb' });
    fp.box(42, -1, 0, 26, 2, 110, M({ c: '#fff', map: tileTex() }));
    fp.box(41, -112, 0, 14, 4, 140, M({ c: '#fff', map: tex('oak') }));
    fp.box(41, -58, 0, 3, 106, 112, M({ c: '#fff', map: tex('oak') })); [-1, 1].forEach(sd => fp.box(42.5, -52, sd * 50, 4, 96, 12, M({ c: '#fff', map: tex('oak') }))); fp.box(42.5, -104, 0, 4, 12, 112, M({ c: '#fff', map: tex('oak') })); // the wooden surround
    fp.plane(43.6, -52, 0, 84, 80, M({ c: '#fff', map: tileTex() }), { ry: 90 }); fp.box(43, -36, 0, 4, 58, 56, M('#1a1512')); // tiled inset, the dark opening
    for (let i = 0; i < 9; i++) fp.ball(44 + (i % 3) * 1.5, -8 - Math.floor(i / 3) * 5, -16 + (i % 5) * 8 + Math.floor(i / 5) * 3, 4, 3, 4, M({ c: ['#2a2220', '#3a2a24', '#201a18'][i % 3], sh: 20 }), 7); // the fake coals
    [-18, -6, 6, 18].forEach(z => fp.box(46, -14, z, 1, 1, 1.2, M('#444'), { rz: 0 })); fp.box(46, -17, 0, 1.2, 1.2, 40, M({ c: '#c8a040', sh: 60 })); // the grate bars and brass trim
    fp.box(58, -4, 0, 30, 8, 1.6, M({ c: '#c8a040', sh: 70, sp: '#a08040' }), { ry: 90 }); [-1, 1].forEach(sd => fp.box(50, -4, sd * 55, 16, 8, 1.6, M({ c: '#c8a040', sh: 70, sp: '#a08040' }))); // the brass fender
    r.flames = []; for (let i = 0; i < 5; i++) { const f = new T.Mesh(new T.PlaneGeometry(9, 14), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.0, depthWrite: false })); f.position.set(-280 + 45.5, GY - 22, 500 - 20 + i * 10); f.rotation.y = 90 * D2R; r.group.add(f); r.flames.push(f); }
    // on the mantelpiece: a carriage clock, photos, cards
    const mp = B.at(-280 + 44, GY - 114, 500);
    mp.box(0, -8, 0, 7, 16, 12, mBrass); mp.disc(3.6, -9, 0, 4, M('#f8f4e8'), 18, { rz: 90, ry: 90 });
    [[-40, '#2a5a9a'], [-26, '#9a2a5a'], [30, '#3a7a3a']].forEach(([z, c]) => { mp.box(0, -8, z, 2, 14, 11, M('#c8a040')); mp.plane(1.2, -8, z, 9, 12, M({ c: '#fff', map: photoTex(c) }), { ry: 90 }); });
    mp.box(0, -9, 44, 1, 16, 12, M('#f4f0e0'), { ry: 20 }); mp.box(0, -8, 52, 1, 14, 10, M('#e8d8f0'), { ry: -15 });
    // the family telly on its stand, the video underneath, the tapes
    buildTelly(r, B);
    // the sofa (3-seater, floral) facing the telly, Dad's armchair, the coffee table
    sofa(B, -60, 560, 180, 200, M({ c: '#fff', map: sofaTex() }));
    sofa(B, 110, 430, -118, 90, M({ c: '#fff', map: sofaTex() }));
    const ct = B.at(-60, GY, 450); ct.box(0, -42, 0, 100, 3, 55, M({ c: '#fff', map: tex('oak') })); [[-45, -23], [45, -23], [-45, 23], [45, 23]].forEach(([x, z]) => ct.box(x, -20.5, z, 4, 41, 4, M({ c: '#fff', map: tex('oak') }))); ct.box(0, -8, 0, 92, 2, 48, M({ c: '#fff', map: tex('oak') }));
    ct.box(-28, -44, 6, 21, 0.8, 28, { t: M({ c: '#fff', map: guideTex() }), all: M('#f0eee8') }, { ry: -12 }); // the TV guide
    ct.box(20, -45, -6, 12, 3, 10, M({ c: '#fff', map: tex('pillow') })); ct.lathe(28, -43.5, 10, [[8, -4], [5, 0]], 16, M({ c: '#d8e8f0', o: 0.5, sh: 120, sp: '#fff' }));
    ct.shadow(0, 0, 0, 108, 62, 0.65, { sq: true });
    // the phone table by the door, a standard lamp, the display cabinet, a rubber plant
    const pt = B.at(170, GY, 610); pt.box(0, -64, 0, 40, 3, 36, M({ c: '#fff', map: tex('oak') })); [[-17, -15], [17, -15], [-17, 15], [17, 15]].forEach(([x, z]) => pt.box(x, -31, z, 3, 62, 3, M({ c: '#fff', map: tex('oak') }))); pt.box(0, -20, 0, 36, 2, 32, M({ c: '#fff', map: tex('oak') }));
    pt.box(-6, -24, 0, 22, 4, 28, M({ c: '#c8a050', map: K.tex('hs.pbook', 128, 160, (g) => { g.fillStyle = '#e8c840'; g.fillRect(0, 0, 128, 160); A.text(g, 'PHONE BOOK', 64, 60, '22px ' + A.FONT, '#1a1a1a', 'center'); A.text(g, '1999/2000', 64, 90, '700 14px ' + A.UIF, '#1a1a1a', 'center'); }) }));
    pt.shadow(0, 0, 0, 46, 42, 0.6, { sq: true });
    // the family phone: a cordless on its base (the handset stands in the charger at an angle; js/hs-life.js makes it ring)
    const ph = new T.Group(); ph.position.set(170, GY - 65.5, 604); ph.rotation.y = -100 * D2R; r.group.add(ph); const PH = K.into(ph), cream = M({ c: '#e4ddc8', sh: 40, sp: '#555' }), grey = M({ c: '#4a4c54', sh: 40, sp: '#444' });
    PH.rbox(0, -1.8, 2, 11, 3.6, 16, 1.2, cream); PH.rbox(0, -4.6, -2, 9, 3.2, 6, 1, cream, { rx: -20 }); // the base: a wedge with the cradle at the back
    PH.rbox(0, -5.4, -1.6, 5.6, 1.2, 3.2, 0.4, grey); PH.ball(3.6, -3.8, 5, 0.4, 0.4, 0.3, M({ c: '#e01a1a', e: '#900' }), 6); // the cradle slot, the charge LED
    PH.plane(-2, -3.62, 5.5, 4, 1, M({ c: '#fff', map: K.tex('hs.phbrand', 96, 24, (g) => { g.fillStyle = '#e4ddc8'; g.fillRect(0, 0, 96, 24); A.text(g, 'DIALOGUE 200', 48, 17, '700 11px ' + A.UIF, '#777', 'center'); }) }), { rx: -90 });
    const hs = new T.Group(); hs.position.set(0, -5.2, -1.8); hs.rotation.x = 16 * D2R; /* (leaning back in the cradle, its face to the room) */ ph.add(hs); r.handset = hs; const HS = K.into(hs);
    HS.rbox(0, -9.5, 0, 5, 19, 2.4, 1, cream); HS.rbox(0, -15.5, 1.1, 3.6, 2.6, 0.4, 0.3, M({ c: '#a8c878', e: '#22400e', sh: 30 })); // the handset, its little LCD
    for (let i = 0; i < 12; i++) HS.rbox(-1.4 + (i % 3) * 1.4, -12.6 + Math.floor(i / 3) * 1.4, 1.2, 1.1, 1.0, 0.3, 0.2, grey); // the keypad
    HS.rbox(0, -17.6, 1.2, 1.6, 0.6, 0.3, 0.2, M('#3a8a3a')); HS.rbox(-1.6, -17.6, 1.2, 1, 0.6, 0.3, 0.2, M('#c02a2a')); // talk / end
    for (let i = 0; i < 4; i++) HS.cyl(-0.9 + i * 0.6, -18.4, 1.2, 0.1, 0.1, 0.2, 6, grey); // the earpiece
    HS.cyl(1.8, -20, 0, 0.3, 0.3, 2.6, 8, M('#222')); HS.ball(1.8, -21.4, 0, 0.4, 0.4, 0.4, M('#222'), 6); // the antenna
    PH.shadow(0, 0, 2, 15, 22, 0.6, { sq: true });
    r.phone = ph;
    H.spot('hs.phone', { label: () => (window.HouseLife && HouseLife.ringing && HouseLife.ringing()) ? 'The phone! (it\'s ringing)' : 'The phone', obj: ph, act: () => life('phone') });
    H.spot('hs.pbook', { label: 'Phone book', act: () => life('pbook') }); pickBox(r, 'hs.pbook', 164, GY - 44, 610, 24, 6, 30);
    const sl = B.at(160, GY, 360); sl.cyl(0, -1.5, 0, 14, 15, 3, 18, M('#2a2a2a')); sl.cyl(0, -75, 0, 1, 1, 148, 8, mBrass); sl.cyl(0, -158, 0, 12, 20, 26, 20, M({ c: '#f0dcb0', side: 2, e: '#000' }), { open: true }); sl.shadow(0, 0, 0, 36, 36, 0.6);
    const dc = B.at(-180, GY, 315); dc.box(0, -60, 7, 90, 120, 26, M({ c: '#fff', map: tex('oak') }), { uv: 50 }); dc.plane(0, -80, 20.2, 80, 70, M({ c: '#c8d8e8', o: 0.35, tr: true, sh: 100, sp: '#fff' }));
    [[-25, '#f4f0f8'], [0, '#d8b880'], [24, '#a8d8c8']].forEach(([x, c]) => dc.lathe(x, -96, 10, [[3, -10], [5, -4], [2, 0]], 14, M({ c, sh: 80, sp: '#fff' })));
    dc.box(0, -1, 7, 90, 2, 26, M('#3a2414')); dc.shadow(0, 0, 7, 96, 32, 0.6, { sq: true });
    const pl = B.at(-250, GY, 660); pl.lathe(0, 0, 0, [[12, -26], [10, 0], [0.5, 0]], 16, M('#b8582a')); for (let i = 0; i < 9; i++) pl.ball(Math.cos(i) * 10, -40 - i * 7, Math.sin(i * 2) * 10, 9, 2, 5, M({ c: '#2a5a2a', sh: 40, sp: '#444' }), 8, { ry: i * 40, rz: 20 }); pl.cyl(0, -50, 0, 0.8, 0.8, 50, 6, M('#4a3a1a'));
    // the ceiling light: a three-arm brass thing Mom loves
    const cl = B.at(-60, GC, 500); cl.cyl(0, 2, 0, 7, 7, 4, 16, mBrass); cl.cyl(0, 16, 0, 0.6, 0.6, 26, 6, mBrass);
    [0, 120, 240].forEach(a => { const x = Math.cos(a * D2R) * 16, z = Math.sin(a * D2R) * 16; cl.cyl(x / 2, 30, z / 2, 0.5, 0.5, 18, 4, mBrass, { rz: 90, ry: -a }); cl.lathe(x, 28, z, [[1.5, -2], [6, 8]], 14, M({ c: '#f8f0e0', side: 2, e: '#000' })); });
    // a radiator under the window, a picture over the sofa
    B.box(-60, GY - 34, 694, 160, 54, 3.6, { all: M('#e8e5dc'), b: M({ c: '#fff', map: tex('radiator') }) });
    const pic = B.at(-280 + 41.5, GY - 175, 500, 90); pic.wshadow(1, 2, -1.3, 86, 62, 0.5); pic.box(0, 0, 0, 80, 56, 2.4, M('#6a4a2a')); pic.plane(0, 0, 1.3, 72, 48, M({ c: '#fff', map: landTex() }));
    batch.build(r.group);
    // spots
    wrapSpot('hs.sofa', { label: 'The sofa', act: sayLines('hs.sofa', 'The sofa', ['Down the back of the sofa: 37p, a hair bobble, a Lego man and a fossilised Quaver.', 'Dad\'s end, Mom\'s end, and the middle bit where the spring goes.']) }); pickBox(r, 'hs.sofa', -60, GY - 30, 560, 200, 60, 80);
    H.spot('hs.chair', { label: "Dad's chair", act: sayLines('hs.chair', "Dad's chair", ['Dad\'s chair. Nobody sits in Dad\'s chair. It is the law.', 'It has a dent in the exact shape of Dad.']) }); pickBox(r, 'hs.chair', 110, GY - 30, 430, 90, 60, 80, -70);
    H.spot('hs.fire', { label: 'The gas fire', act: () => { r.fireOn = !r.fireOn; H.relight(); say('The gas fire', r.fireOn ? 'Click click click WHUMP. The fake coals glow orange. Toasty.' : 'Off. Mom says not to leave it on, it costs a fortune.'); } }); pickBox(r, 'hs.fire', -280 + 44, GY - 50, 500, 6, 100, 104);
    H.spot('hs.mantel', { label: 'The mantelpiece', act: sayLines('hs.mantel', 'The mantelpiece', ['A carriage clock (ten minutes fast, on purpose, so we\'re never late), my school photo from Year 7 (bowl haircut, braces), and {sister}\'s ballet certificate.', 'The school photo. Mom refuses to take it down. I have asked. Many times.']) }); pickBox(r, 'hs.mantel', -280 + 44, GY - 124, 500, 10, 22, 140);
    H.spot('hs.cabinet', { label: 'Display cabinet', act: sayLines('hs.cabinet', 'The display cabinet', ['Mom\'s best glasses, a crystal swan, and a plate from Torquay. We are not allowed to open it. We have never opened it.']) }); pickBox(r, 'hs.cabinet', -180, GY - 60, 322, 90, 120, 26);
    H.spot('hs.guide', { label: 'The TV guide', act: () => { if (window.HouseTelly) HouseTelly.guide(); else say('The TV guide', 'This week\'s telly, circled in Dad\'s biro.'); } }); pickBox(r, 'hs.guide', -88, GY - 45, 456, 24, 3, 30);
    H.spot('hs.lamp', { label: 'Standard lamp', act: () => { lightsOn.loungeLamp = !(lightsOn.loungeLamp == null ? phase() !== 'day' : lightsOn.loungeLamp); H.relight(); H.sfx.tone(1500, 0.02, 'square', 0.05); } }); pickBox(r, 'hs.lamp', 160, GY - 100, 360, 30, 200, 30);
    H.spot('hs.window', { label: 'The bay window', act: () => say('The bay window', ['Through the nets: the street, the lamp-post, next door\'s Sierra.', 'The milk float hums past. Mom has a pint of gold top and a yoghurt on order.', 'Somebody\'s walking a dog. The dog has a little coat on.'][((r.wn = (r.wn | 0) + 1)) % 3]) }); pickBox(r, 'hs.window', -60, 225, 694, 220, 150, 6);
    // walking
    H.walkRect('G', -278, 307, 193, 698, { room: 'lounge' });
    H.block('G', LT.x - 48, 305, LT.x + 48, 352); // the telly
    H.block('G', -165, 525, 45, 600); H.block('G', 66, 386, 156, 476); H.block('G', -115, 418, -5, 482); // sofa, chair, table
    H.block('G', 146, 588, 194, 634); H.block('G', -230, 305, -130, 330); H.block('G', -280, 420, -230, 580); H.block('G', 144, 344, 176, 376); H.block('G', -268, 646, -232, 676);
    H.support('lounge', -110, 422, -10, 478, GY - 43.5); H.support('lounge', 150, 592, 190, 628, GY - 65.5); H.support('lounge', -280, 430, -230, 570, GY - 114);
  }
  function sofa(B, x, z, ry, w, m) {
    const S = B.at(x, GY, z, ry), pipe = M({ c: '#8a6a4a', sh: 10 });
    S.rbox(0, -18, 4, w - 4, 24, 74, 5, m); // the base
    const n = w > 120 ? 3 : 1, cw = n === 3 ? (w - 44) / 3 : w - 36;
    for (let i = 0; i < n; i++) { const cx = n === 1 ? 0 : (i - 1) * (w - 40) / 3; S.rbox(cx, -37, 2, cw - 2, 16, 62, 7, m); S.geo(new T.TorusGeometry(1, 0.5, 6, 4), cx, -45, 33, pipe, { sx: cw / 2 - 2, sz: 1, rx: 90 }); } // seat cushions, a seam at the front
    for (let i = 0; i < n; i++) { const cx = n === 1 ? 0 : (i - 1) * (w - 40) / 3; S.rbox(cx, -66, -26, cw - 2, 44, 16, 7, m, { rx: 8 }); } // back cushions, leaning back
    S.rbox(0, -56, -36, w, 56, 12, 6, m); // the frame behind
    [-1, 1].forEach(s => { S.rbox(s * (w / 2 - 9), -36, 4, 18, 40, 78, 8, m); S.rbox(s * (w / 2 - 9), -58, 4, 20, 8, 80, 4, m); }); // arms with a padded roll
    if (n === 3) { S.rbox(-w / 2 + 34, -62, -8, 30, 30, 10, 5, M({ c: '#7a2a2a', sh: 8 }), { ry: 12, rz: 6 }); S.rbox(w / 2 - 40, -60, -10, 30, 30, 10, 5, M({ c: '#c8a850', sh: 8 }), { ry: -18, rz: -4 }); } // scatter cushions
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => S.cyl(a * (w / 2 - 10), -3, 4 + b * 34, 3, 3.6, 6, 10, M('#3a2414'))); // feet
    S.shadow(0, 0, 4, w + 12, 88, 0.75, { sq: true });
  }
  function curtainG(B, x, y, z, w, h, m) { const g = new T.PlaneGeometry(w, h, 40, 10), p = g.attributes.position, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { const px = p.getX(i); p.setZ(i, Math.sin(px / w * Math.PI * 10) * 3.2 + 3); u.setY(i, 1 - u.getY(i)); } g.computeVertexNormals(); B.geo(g, x, y + h / 2, z, m, { ry: 180 }); }
  function sofaTex() { return K.tex('hs.sofa', 256, 256, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); const r = K.rnd(8); for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; g.fillStyle = ['#b04a4a', '#c86a5a', '#a03a4a'][i % 3]; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 7, y + Math.sin(k * 1.26) * 7, 6, 4, k * 1.26, 0, 7); g.fill(); } g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.fillStyle = '#5a7a4a'; g.beginPath(); g.ellipse(x + 14, y + 10, 8, 3, 0.6, 0, 7); g.fill(); } A.grain(g, w, h, 4000, 0.06, 9); }); }
  function curtTex() { return K.tex('hs.curt', 128, 128, (g, w, h) => { g.fillStyle = '#6a2a2e'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(220,180,100,.2)'; g.fillRect(x, 0, 2, h); } A.grain(g, w, h, 1500, 0.06, 10); }); }
  function netTex() { return K.tex('hs.net', 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 * 2; x < w; x += 4) g.fillRect(x, y, 2, 2); g.strokeStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(64, 128, 20 + i * 18, Math.PI, 0); g.stroke(); } }); }
  function tileTex() { return K.tex('hs.hearth', 128, 64, (g, w, h) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#7a4a2a' : '#8a5a34'; g.fillRect(x * 16, y * 16, 16, 16); } g.strokeStyle = '#3a2414'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 64); g.stroke(); } }); }
  function photoTex(c) { return K.tex('hs.photo.' + c, 64, 80, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = A.lin(g, 0, 4, 0, 70, [[0, c], [1, '#e8e0d0']]); g.fillRect(4, 4, w - 8, h - 8); g.fillStyle = '#e0b090'; g.beginPath(); g.arc(32, 34, 10, 0, 7); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(22, 24, 20, 6); g.fillStyle = c; g.fillRect(20, 46, 24, 28); }); }
  function landTex() { return K.tex('hs.land', 256, 170, (g, w, h) => { g.fillStyle = A.lin(g, 0, 0, 0, h, [[0, '#a8c0d8'], [0.55, '#e8d8b8'], [0.56, '#6a8a4a'], [1, '#3a5a2a']]); g.fillRect(0, 0, w, h); g.fillStyle = '#5a6a7a'; g.beginPath(); g.moveTo(0, 95); g.lineTo(70, 50); g.lineTo(130, 90); g.lineTo(190, 40); g.lineTo(256, 95); g.fill(); g.fillStyle = '#f4f0e8'; g.fillRect(150, 100, 30, 20); g.fillStyle = '#8a2a1a'; g.beginPath(); g.moveTo(146, 100); g.lineTo(165, 88); g.lineTo(184, 100); g.fill(); A.grain(g, w, h, 3000, 0.08, 12); }); }
  function guideTex() { return K.tex('hs.guide', 256, 340, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#c01a1a'; g.fillRect(0, 0, w, 70); A.text(g, 'TELLY TIMES', 128, 52, '44px ' + A.FONT, '#fff', 'center'); g.fillStyle = A.lin(g, 0, 80, 0, 290, [[0, '#2a4a8a'], [1, '#0a1a3a']]); g.fillRect(10, 80, 236, 210); A.text(g, 'THIS WEEK', 20, 316, '26px ' + A.FONT, '#111'); A.text(g, 'ALL 5 CHANNELS', 20, 334, '700 12px ' + A.UIF, '#c01a1a'); }); }
  function streetTex() { return K.tex('hs.street', 512, 256, (g, w, h) => {
    const ph = phase(), N = ph === 'night', D = ph === 'day';
    g.fillStyle = A.lin(g, 0, 0, 0, h, D ? [[0, '#4a8ae0'], [1, '#c8e0ff']] : N ? [[0, '#03050f'], [1, '#18224a']] : [[0, '#3a2a6a'], [1, '#ffa06a']]); g.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) { const x = -20 + k * 92, y = 100; g.fillStyle = D ? ['#c8a080', '#b08a6a', '#d8b896'][k % 3] : N ? '#0c0d14' : '#3a2e34'; g.fillRect(x, y, 90, 110); g.fillStyle = D ? '#6a5a50' : '#07080d'; g.beginPath(); g.moveTo(x - 4, y + 2); g.lineTo(x + 45, y - 30); g.lineTo(x + 94, y + 2); g.fill(); for (const [wx, wy] of [[x + 12, y + 18], [x + 56, y + 18], [x + 12, y + 62]]) { g.fillStyle = N && (wx + k) % 3 === 0 ? '#ffd27a' : D ? '#9ab8d8' : '#1a1a2a'; g.fillRect(wx, wy, 24, 22); } g.fillStyle = D ? '#5a2a1a' : '#0a0606'; g.fillRect(x + 58, y + 62, 18, 48); }
    g.fillStyle = D ? '#6a6a6a' : '#141418'; g.fillRect(0, 210, w, 46); g.fillStyle = D ? '#8a8a88' : '#1a1a1e'; g.fillRect(0, 206, w, 6);
    g.fillStyle = D ? '#2a4a9a' : '#0a0e1a'; g.fillRect(300, 196, 70, 22); g.fillRect(310, 184, 46, 14); g.fillStyle = '#111'; g.beginPath(); g.arc(316, 218, 6, 0, 7); g.arc(356, 218, 6, 0, 7); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(150, 120, 4, 90); g.fillStyle = N ? '#ffe9a0' : '#ddd'; g.beginPath(); g.arc(152, 120, 6, 0, 7); g.fill(); if (N) { const gr = g.createRadialGradient(152, 130, 2, 152, 160, 60); gr.addColorStop(0, 'rgba(255,220,140,.4)'); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(90, 110, 124, 110); }
  }, { clamp: true }); }

  // ---- the family telly: a 21-inch, on a black ash stand with glass doors, the video recorder, the tapes
  function buildTelly(r, B) {
    const st = B.at(LT.x, GY, LT.z);
    st.box(0, -24, 0, 96, 3, 44, M({ c: '#222024', sh: 30, sp: '#333' })); st.box(0, -1.5, 0, 96, 3, 44, M('#222024')); [-46.5, 46.5].forEach(x => st.box(x, -12.5, 0, 3, 22, 44, M('#222024')));
    st.box(0, -46, 0, 96, 3, 44, M({ c: '#222024', sh: 30, sp: '#333' })); [-46.5, 46.5].forEach(x => st.box(x, -35, 0, 3, 22, 44, M('#222024')));
    st.plane(0, -35, 22.2, 90, 20, M({ c: '#8090a0', o: 0.25, tr: true, sh: 120, sp: '#fff' }));
    st.shadow(0, 0, 0, 104, 52, 0.75, { sq: true });
    // the telly
    const tv = new T.Group(); tv.position.set(LT.x, GY - 47.5, LT.z - 4); r.group.add(tv); const TV = K.into(tv);
    TV.rbox(0, -25, 6, 66, 50, 16, 2.4, M({ c: '#2a2a2e', sh: 30, sp: '#333' })); TV.geo(taperG(56, 42, 30, 0.6), 0, -25, -16, M('#222226'));
    TV.box(0, -2.4, 14.3, 60, 4, 0.4, M('#1c1c20'));
    const scr = new T.Mesh(new T.PlaneGeometry(50, 37.5), new T.MeshBasicMaterial({ color: 0xffffff, map: tex('screenOff') })); flipUV(scr.geometry); scr.position.set(-4, -27, 14.25); tv.add(scr);
    r.tvScreen = scr; r.tvGroup = tv;
    TV.box(26, -26, 14.3, 6, 30, 0.4, M('#1a1a1c')); [-14, -8, -2, 4].forEach(y => TV.box(26, -26 + y, 14.6, 3.6, 2.4, 0.6, M('#333'))); r.tvLed = TV.ball(26, -40, 14.5, 0.7, 0.7, 0.3, M({ c: '#e01a1a', e: '#900' }).clone(), 6);
    TV.shadow(0, 0, 0, 70, 46, 0.5, { sq: true });
    // the video recorder (the clock flashes 12:00, of course)
    const vcr = new T.Group(); vcr.position.set(LT.x - 8, GY - 26, LT.z + 2); r.group.add(vcr); const VC = K.into(vcr);
    VC.rbox(0, -4.5, 0, 42, 9, 30, 0.8, M({ c: '#2a2a2e', sh: 40, sp: '#444' })); VC.box(-6, -5, 15.1, 20, 3, 0.4, M('#101012'));
    r.vcrTex = K.tex('hs.vcrclock', 128, 32, () => {}, { clamp: true });
    const vd = new T.Mesh(new T.PlaneGeometry(9, 2.4), new T.MeshBasicMaterial({ map: r.vcrTex })); flipUV(vd.geometry); vd.position.set(12, -5, 15.15); vcr.add(vd);
    [0, 1, 2, 3, 4].forEach(i => VC.box(-14 + i * 4, -1.5, 15.2, 3, 1.2, 0.5, M('#5a5a5e')));
    r.vcr = vcr; VC.shadow(0, 0, 0, 44, 32, 0.5, { sq: true });
    // tapes on the bottom shelf, and a remote control on the coffee table
    const rm = new T.Group(); rm.position.set(-30, GY - 45, 440); rm.rotation.y = 30 * D2R; r.group.add(rm); const RM = K.into(rm);
    RM.rbox(0, -1.2, 0, 5.4, 2.4, 18, 1, M({ c: '#2a2a2e', sh: 30 })); for (let i = 0; i < 12; i++) RM.cyl(-1.4 + (i % 3) * 1.4, -2.5, -2 + Math.floor(i / 3) * 1.6, 0.45, 0.45, 0.4, 8, M('#888')); [['#c02a2a', -4], ['#2a8a3a', -2.6], ['#e8c020', -1.2], ['#2a5ad0', 0.2]].forEach(([c, x]) => RM.box(x + 1.5, -2.5, -6, 1, 0.4, 0.8, M(c)));
    RM.shadow(0, 0, 0, 7, 20, 0.5);
    r.remote = rm;
    H.spot('hs.telly', { label: 'The family telly', obj: tv, act: () => telly() });
    H.spot('hs.remote', { label: 'The remote', obj: rm, act: () => telly() });
    H.spot('hs.vcr', { label: 'Video recorder', obj: vcr, act: () => telly('vcr') });
    H.spot('hs.tapes', { label: 'Video tapes', act: () => telly('tapes') }); pickBox(r, 'hs.tapes', LT.x + 26, GY - 13, LT.z, 20, 20, 12);
    setTimeout(() => loadJs('js/hs-telly.js').catch(() => {}), 300); // (the tapes are real things: the telly's file puts them on the shelf)
  }
  function telly(what) {
    const go = () => { if (window.HouseTelly) HouseTelly.open(what); };
    if (window.HouseTelly) return go();
    loadJs('js/hs-telly.js').then(go, () => say('Hmm', 'The telly is warming up. Try again in a minute.'));
  }

  // ================================================================ THE KITCHEN (the fridge, the biscuit tin, the microwave)
  function buildKitchen(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#f0e6b8', map: tex('wallWarm') });
    shell(B, { x0: -280, z0: -56, x1: 195, z1: 295, fy: GY, cy: GC, wall, floor: M({ c: '#fff', map: tex('lino') }), fuv: 60, holes: { e: [[150, 230, GY - 205, GY]], n: [[-140, -20, 195, 290], [80, 160, GY - 205, GY]] } });
    // the window over the sink and the back door (half glass): the garden outside
    B.plane(-80, 200, -56 - 420, 1400, 700, M({ c: '#fff', map: sky(), basic: true }));
    winFrame(B, -140, -20, 195, 290, -56);
    doorway(r, B, 'backframe', 'n', -56, 80, 160, GY, { leaf: false });
    B.plane(120, 200, -56 - 420, 1, 1, M('#000')); // (the garden is the room beyond: built when the door opens)
    // the units along the back wall: base cupboards, the worktop, wall cupboards, the sink, the cooker, the washing machine
    const doorM = M({ c: '#fff', map: unitTex() }), top = M({ c: '#fff', map: worktopTex(), sh: 40, sp: '#555' });
    const unit = (x0, x1) => { const cx = (x0 + x1) / 2, w = x1 - x0; B.box(cx, GY - 46, -26, w, 86, 58, { f: doorM, all: M('#e8e2d0') }); B.box(cx, GY - 4, -24, w, 8, 54, M('#3a3a3a'), { sides: 'f' }); };
    unit(-280, -160); unit(-160, -40); unit(20, 80);
    B.box(-150, GY - 91.5, -23, 260, 3, 66, top); B.box(50, GY - 91.5, -23, 60, 3, 66, top);
    B.plane(-90, GY - 120, -55.8, 380, 56, M({ c: '#fff', map: tex('tiles') }), { uv: 0 });
    const wu = (x0, x1) => { const cx = (x0 + x1) / 2; B.box(cx, GC + 80, -40, x1 - x0, 70, 32, { f: doorM, all: M('#e8e2d0') }); };
    wu(-280, -160); wu(20, 80);
    B.shadow(-110, GY, -26, 270, 70, 0.7, { sq: true });
    // the sink (stainless steel), the taps, the washing-up
    const sk = B.at(-80, GY - 93, -26); sk.box(0, 0, 0, 50, 1, 40, M({ c: '#c8ccd0', sh: 90, sp: '#fff' })); sk.box(0, 6, 0, 40, 12, 30, M({ c: '#9aa0a8', sh: 80, sp: '#ddd', side: 2 }), { sides: 'u' }); sk.cyl(-6, -10, -16, 0.9, 0.9, 18, 8, mMetal); sk.cyl(-6, -18, -10, 0.8, 0.8, 12, 8, mMetal, { rx: 90 }); sk.cyl(6, -4, -16, 1.6, 1.6, 6, 8, mMetal);
    sk.box(18, -6, 0, 8, 12, 4, M('#3a8ad0')); // washing-up liquid
    // the cooker (freestanding, four rings, an eye-level grill), the washing machine
    const ck = B.at(-10, GY, -26); ck.box(0, -46, 0, 58, 92, 58, { f: M({ c: '#fff', map: cookerTex() }), all: M('#e8e8e4') }); ck.box(0, -93, 0, 58, 2, 58, M({ c: '#efefec', sh: 60 })); [[-14, -12], [14, -12], [-14, 12], [14, 12]].forEach(([x, z]) => ck.cyl(x, -94.6, z, 8, 8, 0.6, 18, M('#2a2a2a')));
    ck.box(0, -150, -18, 58, 20, 24, M('#e8e8e4'));
    for (let i = 0; i < 5; i++) { ck.cyl(-20 + i * 10, -84, 29.3, 2.4, 2.4, 1.4, 12, M({ c: '#2a2a2a', sh: 40 }), { rx: 90 }); ck.box(-20 + i * 10, -84, 30.2, 0.6, 2.2, 0.4, M('#ddd')); }
    ck.cyl(0, -52, 30.4, 1, 1, 46, 8, mMetal, { rz: 90 }); ck.plane(0, -45, 29.2, 44, 22, M({ c: '#1a1a1a', sh: 90, sp: '#888', o: 0.9, tr: true }));
    const wm = B.at(50, GY, -26); wm.geo(new T.TorusGeometry(13, 1.6, 8, 28), 0, -45, 29.4, M({ c: '#c8ccd0', sh: 60, sp: '#888' })); wm.cyl(0, -45, 29.2, 11.5, 11.5, 0.6, 28, M({ c: '#2a3440', sh: 120, sp: '#fff' }), { rx: 90 }); wm.cyl(0, -45, 29.6, 8, 8, 0.3, 24, M({ c: '#7a8a9a', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { rx: 90 });
    wm.box(-14, -82, 29.4, 16, 5, 1.2, M('#d8d8d4')); wm.cyl(12, -82, 29.8, 2.2, 2.2, 1.2, 14, M({ c: '#333', sh: 40 }), { rx: 90 }); [4, 18, 22].forEach(x => wm.box(x - 10, -82, 29.6, 1.2, 1.2, 0.5, M('#1a8a3a')));
    // the fridge-freezer (the magnets and notes are the fridge door: js/hs-life.js)
    const fr = B.at(-250, GY, -20); fr.rbox(0, -85, 0, 60, 170, 64, 2, M({ c: '#f4f2ec', sh: 50, sp: '#555' })); fr.box(0, -110, 32.2, 58, 1.2, 0.8, M('#c8c6c0'));
    [[-130, 36], [-70, 46]].forEach(([y, hh]) => { fr.rbox(26, y, 33.6, 2.2, hh, 2.2, 0.8, M({ c: '#e0dcd4', sh: 60, sp: '#888' })); fr.box(26, y - hh / 2 + 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); fr.box(26, y + hh / 2 - 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); });
    fr.plane(-14, -160, 32.3, 16, 4, M({ c: '#fff', map: K.tex('hs.frlogo', 128, 32, (g) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 128, 32); A.text(g, 'FROSTMASTER', 64, 22, '700 15px ' + A.UIF, '#8a8a8a', 'center'); }) }));
    fr.box(0, -2, 20, 56, 4, 24, M('#1a1a1a')); // the plinth
    fr.shadow(0, 0, 0, 68, 70, 0.7, { sq: true });
    // things on the worktop: the kettle, the toaster, the bread bin, the microwave, the radio (the biscuit tin is its own)
    const kt = B.at(-200, GY - 93, -36); kt.lathe(0, 0, 0, [[9, -22], [10.5, -14], [10, 0], [0.5, 0]], 18, M({ c: '#f0f0ec', sh: 60, sp: '#666' })); kt.box(-11, -14, 0, 2, 14, 3, M('#f0f0ec')); kt.cyl(0, -1, 0, 11, 11, 2, 18, M('#333')); kt.shadow(0, 0, 0, 24, 24, 0.6);
    const ts = B.at(-140, GY - 93, -36); ts.rbox(0, -9, 0, 26, 18, 16, 3, M({ c: '#d8d8d4', sh: 70, sp: '#888' })); ts.box(-5, -18.4, 0, 3, 1, 12, M('#111')); ts.box(5, -18.4, 0, 3, 1, 12, M('#111')); ts.shadow(0, 0, 0, 30, 20, 0.6, { sq: true });
    const bb = B.at(40, GY - 93, -36); bb.rbox(0, -12, 0, 34, 24, 24, 6, M({ c: '#c83a2a', sh: 40, sp: '#555' })); bb.shadow(0, 0, 0, 38, 28, 0.6, { sq: true });
    const rd = B.at(-30, GY - 93, -46); rd.rbox(0, -10, 0, 24, 14, 8, 2, M('#3a3a3e')); rd.cyl(6, -10, 4.2, 4, 4, 0.4, 16, M('#666'), { rx: 90 }); rd.box(-5, -12, 4.2, 8, 3, 0.4, M({ c: '#d8a040', e: '#3a2000' })); rd.cyl(-8, -24, -2, 0.3, 0.3, 20, 4, mMetal, { rz: 20 });
    // the microwave: the clock is flashing 12:00
    const mw = new T.Group(); mw.position.set(-250, GY - 93, -6); mw.rotation.y = 90 * D2R; r.group.add(mw); const MW = K.into(mw); r.mw = mw;
    MW.rbox(0, -16, 0, 46, 30, 34, 1.4, M({ c: '#e8e6e0', sh: 30 })); MW.plane(-6, -16, 17.1, 30, 22, M({ c: '#2a2a2a', sh: 90, sp: '#888' }));
    r.mwTex = K.tex('hs.mwclock', 128, 40, () => {}, { clamp: true });
    const md = new T.Mesh(new T.PlaneGeometry(9, 3), new T.MeshBasicMaterial({ map: r.mwTex })); flipUV(md.geometry); md.position.set(15, -26, 17.12); mw.add(md);
    for (let i = 0; i < 6; i++) MW.box(12 + (i % 3) * 3, -18 + Math.floor(i / 3) * 3, 17.2, 2.4, 2, 0.4, M('#aaa'));
    MW.shadow(0, 0, 0, 48, 36, 0.6, { sq: true });
    const kb = new T.Group(); kb.position.set(170, GY, 20); r.group.add(kb); const KB = K.into(kb);
    KB.cyl(0, -30, 0, 15, 14, 60, 20, M({ c: '#d8d8d4', sh: 70, sp: '#888' })); KB.cyl(0, -61, 0, 15.6, 15.6, 2.4, 20, M({ c: '#c8c8c4', sh: 80, sp: '#999' })); KB.box(0, -1.5, 15, 8, 3, 6, M('#333')); KB.shadow(0, 0, 0, 36, 36, 0.6);
    H.spot('hs.bin', { label: 'Kitchen bin', obj: kb, act: () => life('bin') }); H.block('G', 152, 2, 188, 38);
    H.spot('hs.micro', { label: 'Microwave', obj: mw, act: () => life('micro') });
    // the kitchen table and chairs, a fruit bowl, the newspaper
    const kt2 = B.at(-60, GY, 170); kt2.box(0, -74, 0, 120, 4, 80, M({ c: '#fff', map: tex('pine') }), { uv: 50 }); [[-54, -34], [54, -34], [-54, 34], [54, 34]].forEach(([x, z]) => kt2.box(x, -36, z, 5, 72, 5, M({ c: '#fff', map: tex('pine') })));
    kt2.lathe(-20, -76, -8, [[12, -6], [6, 0]], 18, M({ c: '#d8c8a8', sh: 30 })); [[-24, -10, '#e8c020'], [-16, -6, '#d03a2a'], [-20, -14, '#6aa03a']].forEach(([x, z, c]) => kt2.ball(x, -82, z, 3.4, 3.4, 3.4, M(c), 10));
    kt2.box(26, -76.5, 10, 30, 1, 40, M({ c: '#fff', map: paperTex() }), { ry: 8 });
    kt2.shadow(0, 0, 0, 130, 90, 0.7, { sq: true });
    [[-60, 110, 0], [-60, 230, 180], [-130, 170, 90], [10, 170, -90]].forEach(([x, z, ry]) => chair(B, x, z, ry));
    // a wall clock, the calendar, the cork board with Mom's lists
    const wc = B.at(-280 + 1, GC + 50, 120); wc.cyl(1, 0, 0, 16, 16, 2, 30, M('#f4f0e4'), { rz: 90 }); wc.cyl(2.2, 0, 0, 16.5, 16.5, 1, 30, M('#c83a2a'), { rz: 90 });
    r.clockHands = wc;
    const cal = B.at(194, GY - 150, 60); cal.plane(-0.2, 0, 0, 30, 42, M({ c: '#fff', map: tex('calendar') }), { ry: -90 });
    batch.build(r.group);
    // the clock hands (they move)
    const hands = new T.Group(); hands.position.set(-280 + 3.6, GC + 50, 120); r.group.add(hands); const HN = K.into(hands);
    r.hh = new T.Group(); hands.add(r.hh); K.into(r.hh).box(0.3, -4, 0, 0.6, 8, 1.4, M('#111')); r.mh = new T.Group(); hands.add(r.mh); K.into(r.mh).box(0.6, -6, 0, 0.6, 12, 0.9, M('#111')); void HN;
    // the biscuit tin (a daily raid: js/hs-life.js asks the server)
    const tin = new T.Group(); tin.position.set(-110, GY - 93, -40); r.group.add(tin); const TN = K.into(tin);
    TN.cyl(0, -9, 0, 11, 11, 18, 24, M({ c: '#fff', map: tinTex(), sh: 60, sp: '#888' }));
    const lid = new T.Group(); lid.position.set(0, -18, -11); tin.add(lid); K.into(lid).cyl(0, -0.8, 11, 11.6, 11.6, 2.2, 24, M({ c: '#2a5ab0', sh: 60, sp: '#888' })); r.tinLid = lid;
    TN.shadow(0, 0, 0, 26, 26, 0.6);
    H.spot('hs.tin', { label: 'The biscuit tin', obj: tin, act: () => life('tin') });
    H.spot('hs.fridge', { label: 'The fridge', act: () => life('fridge') }); pickBox(r, 'hs.fridge', -250, GY - 85, 14, 60, 170, 4);
    H.spot('hs.kettle', { label: 'The kettle', act: () => { H.sfx.noise(2.2, 0.05, 900, 0, 'lowpass', 2400); say('The kettle', ['On it goes. In 1999 the kettle is the most important thing in any house.', 'Mom: "Put the kettle on, love." It is always on. The kettle never rests.'][((r.kn = (r.kn | 0) + 1)) % 2]); } }); pickBox(r, 'hs.kettle', -200, GY - 104, -36, 24, 24, 22);
    H.spot('hs.toaster', { label: 'Toaster', act: sayLines('hs.toaster', 'Toaster', ['The toaster has two settings: still bread, and charcoal.']) }); pickBox(r, 'hs.toaster', -140, GY - 102, -36, 28, 20, 18);
    H.spot('hs.radio', { label: 'Kitchen radio', act: sayLines('hs.radio', 'Kitchen radio', ['Tuned to the local station. A man is reading out the traffic. There is no traffic.', 'Mom has it on all day. She knows all the adverts off by heart.']) }); pickBox(r, 'hs.radio', -30, GY - 103, -46, 26, 16, 10);
    H.spot('hs.paper', { label: 'The newspaper', act: () => life('paper') }); pickBox(r, 'hs.paper', -34, GY - 77, 180, 30, 2, 40);
    H.spot('hs.cooker', { label: 'The cooker', act: sayLines('hs.cooker', 'The cooker', ['Tonight: ' + ['fish fingers, chips and beans', 'spag bol', 'a Findus Crispy Pancake each', 'shepherd\'s pie', 'a chicken Kiev (garlic everywhere)'][new Date().getDay() % 5] + '. Mom says do NOT touch the knobs.']) }); pickBox(r, 'hs.cooker', -10, GY - 46, 3, 58, 92, 4);
    H.spot('hs.washer', { label: 'Washing machine', act: sayLines('hs.washer', 'Washing machine', ['It walks across the floor on the spin cycle. We have found it in the middle of the kitchen before.']) }); pickBox(r, 'hs.washer', 50, GY - 46, 3, 58, 86, 4);
    H.spot('hs.wclock', { label: 'Kitchen clock', act: () => { const d = new Date(); say('Kitchen clock', 'It says ' + d.getHours() % 12 + ':' + String(d.getMinutes()).padStart(2, '0') + '. (It\'s right. The microwave isn\'t.)'); } }); pickBox(r, 'hs.wclock', -278, GC + 50, 120, 4, 32, 32);
    H.ambient.add(() => { if (!r.group.visible) return; const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60; r.mh.rotation.x = -m / 60 * Math.PI * 2; r.hh.rotation.x = -h / 12 * Math.PI * 2; });
    H.walkRect('G', -278, -54, 193, 293, { room: 'kitchen' });
    H.block('G', -280, -56, 82, 6); H.block('G', -280, -56, -218, 14); H.block('G', -124, 126, 4, 214); H.block('G', -80, 92, -40, 128); H.block('G', -80, 212, -40, 248); H.block('G', -150, 150, -110, 190); H.block('G', -10, 150, 30, 190);
    H.support('kitchen', -280, -56, 80, 10, GY - 93); H.support('kitchen', -120, 130, 0, 210, GY - 76);
  }
  function winFrame(B, x0, x1, y0, y1, z) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0, fm = M({ c: '#f2f0ea', sh: 40, sp: '#444' }), fz = z - 8; B.box(cx, y0 + 3, fz, w, 6, 6, fm); B.box(cx, y1 - 3, fz, w, 6, 6, fm); B.box(x0 + 3, cy, fz, 6, h, 6, fm); B.box(x1 - 3, cy, fz, 6, h, 6, fm); B.box(cx, cy, fz, 5, h, 6, fm); B.plane(cx, cy, fz - 1, w - 6, h - 6, M({ c: '#c8d8f0', o: 0.12, tr: true, sh: 120, sp: '#fff' })); B.plane(cx, y0, z - 6, w, 12, M('#d8d4c8'), { rx: -90 }); B.plane(x0, cy, z - 6, 12, h, M('#d0ccc0'), { ry: 90 }); B.plane(x1, cy, z - 6, 12, h, M('#d0ccc0'), { ry: -90 }); B.rbox(cx, y1 + 1.5, z + 2, w + 10, 3, 10, 0.8, M('#efece4')); }
  function chair(B, x, z, ry) { const C = B.at(x, GY, z, ry), w = M({ c: '#fff', map: tex('pine') }); C.box(0, -44, 0, 40, 3, 40, w); [[-17, -17], [17, -17], [-17, 17], [17, 17]].forEach(([a, b]) => C.box(a, -22, b, 3, 44, 3, w)); C.box(0, -66, -18.5, 40, 6, 3, w); [-12, 0, 12].forEach(a => C.box(a, -56, -18.5, 3, 24, 2, w)); C.shadow(0, 0, 0, 46, 46, 0.5, { sq: true }); }
  function unitTex() { return K.tex('hs.unit', 256, 256, (g, w, h) => { g.fillStyle = '#e8dfc4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 3; g.strokeRect(10, 10, w / 2 - 15, h - 20); g.strokeRect(w / 2 + 5, 10, w / 2 - 15, h - 20); g.strokeStyle = '#d8ccae'; g.lineWidth = 6; g.strokeRect(22, 22, w / 2 - 39, h - 44); g.strokeRect(w / 2 + 17, 22, w / 2 - 39, h - 44); g.fillStyle = '#a8883a'; g.fillRect(w / 2 - 22, h / 2 - 20, 6, 40); g.fillRect(w / 2 + 16, h / 2 - 20, 6, 40); A.grain(g, w, h, 1200, 0.04, 33); }); }
  function worktopTex() { return K.tex('hs.worktop', 256, 64, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); const r = K.rnd(7); for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,40,.3)' : 'rgba(255,250,230,.3)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }); }
  function cookerTex() { return K.tex('hs.cooker', 256, 256, (g, w, h) => { g.fillStyle = '#ecebe6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.fillRect(24, 70, 208, 160); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(30, 76, 90, 30); g.fillStyle = '#c8c8c4'; g.fillRect(40, 60, 176, 6); for (let i = 0; i < 5; i++) { g.fillStyle = '#333'; g.beginPath(); g.arc(40 + i * 44, 30, 11, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.fillRect(38 + i * 44, 20, 4, 10); } }); }
  function tinTex() { return K.tex('hs.tin', 256, 64, (g, w, h) => { g.fillStyle = '#2a5ab0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = ['#e8c040', '#d02a2a', '#f4f0e0'][i % 3]; g.beginPath(); g.arc(16 + i * 32, 32, 10, 0, 7); g.fill(); } g.fillStyle = '#e8c040'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); A.text(g, 'ASSORTED', 128, 36, '700 12px ' + A.UIF, '#fff', 'center'); }); }
  function paperTex() { return K.tex('hs.paper', 256, 340, (g, w, h) => { g.fillStyle = '#efece2'; g.fillRect(0, 0, w, h); A.text(g, 'THE DAILY', 128, 40, '38px ' + A.FONT, '#111', 'center'); g.fillStyle = '#111'; g.fillRect(10, 50, 236, 2); g.fillStyle = '#888'; for (let i = 0; i < 26; i++) g.fillRect(14 + (i % 2) * 120, 70 + Math.floor(i / 2) * 18, 104, 6); }); }
  let lifeP = null;
  const loadLife = () => window.HouseLife ? Promise.resolve() : (lifeP = lifeP || loadJs('js/hs-cat.js').then(() => loadJs('js/hs-life.js')).catch(e => { lifeP = null; throw e; }));
  function life(what) { loadLife().then(() => { if (window.HouseLife) HouseLife.use(what); }, () => say('Hmm', 'Try that again in a minute.')); }

  // ================================================================ OUTSIDE: the back garden and the front drive (Agent J's chores live out here)
  // the sky is a big painted dome; the sun is the real time of day (the same phase as the bedroom window)
  function skyDome(B, cx, cz) {
    const dome = new T.SphereGeometry(1800, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); // (a hemisphere: our y is down, so it's flipped with sy)
    B.geo(dome, cx, GY + 2, cz, M({ c: '#fff', map: skyOutTex(), basic: true, side: 2 }), { sy: -1 }); // (both sides: the flip turns its faces inside out)
  }
  function skyOutTex() { return phaseTex('hs.skyout', 512, 256, (g, w, h) => {
    const ph = phase(), D = ph === 'day', N = ph === 'night';
    g.fillStyle = A.lin(g, 0, 0, 0, h, D ? [[0, '#2a6ad8'], [0.5, '#7ab0f0'], [1, '#d8e8ff']] : N ? [[0, '#02040c'], [0.6, '#0a1230'], [1, '#1c2448']] : [[0, '#2a2a6a'], [0.5, '#a05a7a'], [1, '#ffb070']]); g.fillRect(0, 0, w, h);
    if (N) { const r = K.rnd(12); for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; g.fillRect(r() * w, r() * h * 0.8, r() < 0.1 ? 2 : 1, 1); } g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(400, 70, 12, 0, 7); g.fill(); g.fillStyle = '#0a1230'; g.beginPath(); g.arc(405, 66, 11, 0, 7); g.fill(); }
    else if (D) { g.fillStyle = 'rgba(255,255,255,.8)'; [[80, 90, 70], [260, 60, 55], [430, 110, 80], [360, 150, 50]].forEach(([x, y, ww]) => { g.beginPath(); g.ellipse(x, y, ww, 14, 0, 0, 7); g.ellipse(x - ww * 0.3, y - 9, ww * 0.45, 13, 0, 0, 7); g.ellipse(x + ww * 0.3, y - 6, ww * 0.4, 11, 0, 0, 7); g.fill(); }); }
    const gr = g.createRadialGradient(140, 60, 2, 140, 60, 80); gr.addColorStop(0, N ? 'rgba(0,0,0,0)' : 'rgba(255,250,220,.95)'); gr.addColorStop(0.3, N ? 'rgba(0,0,0,0)' : 'rgba(255,240,190,.5)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(60, -20, 160, 160);
  }, { clamp: true }); }
  const mFence = () => M({ c: '#fff', map: K.tex('hs.fence', 256, 256, (g, w, h) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = x % 64 ? '#946f48' : '#7e6040'; g.fillRect(x, 0, 30, h); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 30, 0, 2, h); } A.grain(g, w, h, 2500, 0.08, 61); for (let x = 0; x < w; x += 32) for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(60,40,20,.25)'; g.beginPath(); g.moveTo(x + 4, i * 40 + (x % 7) * 3); g.lineTo(x + 26, i * 40 + 20); g.stroke(); } }) });
  const mGrass = () => M({ c: '#fff', map: K.tex('hs.grass', 256, 256, (g, w, h) => { g.fillStyle = '#4a7a2e'; g.fillRect(0, 0, w, h); const r = K.rnd(62); for (let i = 0; i < 14000; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(30,70,20,.4)' : v < 0.9 ? 'rgba(130,190,70,.3)' : 'rgba(220,200,90,.35)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 2); } A.mottle(g, w, h, 20, 'rgba(0,0,0,.08)', 40, 63); }) });
  const mSlab = () => M({ c: '#fff', map: K.tex('hs.slab', 256, 256, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = ['#a8a49a', '#9e9a90', '#b0aca2'][(x + y * 3) % 3]; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = '#5a5a52'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } A.grain(g, w, h, 4000, 0.07, 64); A.mottle(g, w, h, 12, 'rgba(40,60,20,.15)', 30, 65); }) });
  const mBrick = () => M({ c: '#fff', map: K.tex('hs.brick', 256, 128, (g, w, h) => { g.fillStyle = '#b8b0a4'; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) { const off = y % 2 ? 16 : 0; g.fillStyle = ['#a85a3a', '#b0633f', '#9a5236', '#b86a44'][(x + y * 5) % 4]; g.fillRect(x * 32 + off + 1, y * 16 + 1, 30, 14); } A.grain(g, w, h, 1500, 0.08, 66); }) });
  const mTarmac = () => M({ c: '#fff', map: K.tex('hs.tarmac', 256, 256, (g, w, h) => { g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); const r = K.rnd(67); for (let i = 0; i < 12000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.12)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }) });
  function tree(B, x, z, hgt, spread) {
    const trunk = M({ c: '#fff', map: tex('oak') }), leaf = M({ c: '#2e6a2a', sh: 10 });
    B.cyl(x, GY - hgt * 0.3, z, 7, 11, hgt * 0.6, 10, trunk);
    for (let i = 0; i < 6; i++) { const a = i * 1.1, rr = spread * (0.5 + (i % 3) * 0.22); B.ball(x + Math.cos(a) * spread * 0.45, GY - hgt * 0.62 - (i % 2) * spread * 0.3, z + Math.sin(a) * spread * 0.45, rr, rr * 0.8, rr, M({ c: ['#2e6a2a', '#3a7a30', '#27602a'][i % 3], sh: 10 }), 10); }
    B.shadow(x, GY, z, spread * 2.2, spread * 2.2, 0.5);
  }
  function buildGarden(r) {
    const batch = K.batch(), B = K.into(batch);
    const x0 = -300, x1 = 215, z0 = -560, z1 = -56; // (behind the kitchen; the back wall of the house is z = -56)
    skyDome(B, (x0 + x1) / 2, (z0 + z1) / 2 - 300);
    B.plane((x0 + x1) / 2, GY, (z0 + z1) / 2, x1 - x0, z1 - z0, mGrass(), { rx: 90, uv: 110 });
    B.plane((x0 + x1) / 2, GY + 0.1, (z0 + z1) / 2 + 400, 4000, 4000, mGrass(), { rx: 90, uv: 110 }); // (the world beyond the fence)
    B.plane(-50, GY - 0.3, -126, 330, 130, mSlab(), { rx: 90, uv: 100 }); // the patio by the back door
    // the back of the house: brick, the kitchen window and the back door from outside, Jack's window up above
    B.plane(-110, GY - 300, -57, 380, 606, mBrick(), { ry: 180, uv: 128 }); B.plane(290, GY - 300, -57, 260, 606, mBrick(), { ry: 180, uv: 128 }); B.plane(120, -51, -57, 80, 398, mBrick(), { ry: 180, uv: 128 }); // (the back door's opening is cut: x 80..160, up to y GY-205)
    B.box(60, GY - 603, -40, 740, 6, 40, M('#5a3a2a')); B.box(60, GY - 625, -20, 740, 40, 2, M('#7a3a2a'));
    B.plane(300, GY - 420, -57.5, 70, 80, M({ c: '#c8d8f0', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); B.plane(300, GY - 420, -59, 64, 74, M({ c: '#1a2a3a', o: 0.6, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); // the bathroom window
    B.plane(-80, 242, -57.5, 120, 95, M({ c: '#c8d8f0', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); B.box(-80, 242, -58, 124, 99, 2, M({ c: '#f2f0ea', sh: 40 }), { sides: 'frltub' }); B.plane(-80, 242, -59.2, 116, 91, M({ c: '#1a2a3a', o: 0.6, tr: true, sh: 100, sp: '#fff' }), { ry: 180 });
    B.box(77, GY - 102, -58.5, 6, 204, 3, mWhite); B.box(163, GY - 102, -58.5, 6, 204, 3, mWhite); B.box(120, GY - 206, -58.5, 92, 6, 3, mWhite); B.box(120, GY - 0.8, -58, 80, 1.6, 8, M('#9a9a92')); // (the opening, framed, with a step)
    B.plane(191, -63, -57.5, 70, 98, M({ c: '#c8d8f0', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); B.plane(191, -63, -59, 64, 92, M({ c: '#1a2a3a', o: 0.6, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); // Jack's window
    B.cyl(200, (GY - 300) / 2, -60, 5, 5, 600, 8, M('#2a2a2a')); // the drainpipe
    // fences down both sides and across the end, the gate at the end, next door's roofs over the top
    const fm = mFence();
    B.plane(x0 + 1, GY - 90, (z0 + z1) / 2, z1 - z0, 180, fm, { ry: 90, uv: 100 }); B.plane(x1 - 1, GY - 90, (z0 + z1) / 2, z1 - z0, 180, fm, { ry: -90, uv: 100 });
    B.plane((x0 + x1) / 2, GY - 90, z0 + 1, x1 - x0, 180, fm, { ry: 0, uv: 100 });
    for (let z = z0; z <= z1; z += 180) { B.box(x0 + 2, GY - 92, z, 8, 190, 8, M('#5a3a22')); B.box(x1 - 2, GY - 92, z, 8, 190, 8, M('#5a3a22')); }
    for (let x = x0; x <= x1; x += 172) B.box(x, GY - 92, z0 + 2, 8, 190, 8, M('#5a3a22'));
    B.plane(-42.5, GY - 230, z0 - 400, 1400, 300, M({ c: '#fff', map: phaseTex('hs.roofs', 512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const N = phase() === 'night'; for (let k = 0; k < 6; k++) { const x = k * 90 - 10; g.fillStyle = N ? '#0c0d14' : '#b08060'; g.fillRect(x, 70, 88, 58); g.fillStyle = N ? '#07080d' : '#5a4a48'; g.beginPath(); g.moveTo(x - 4, 72); g.lineTo(x + 44, 34); g.lineTo(x + 92, 72); g.fill(); g.fillStyle = N ? '#0a0b10' : '#8a6a5a'; g.fillRect(x + 60, 26, 10, 26); for (const wx of [x + 12, x + 50]) { g.fillStyle = N && (k + wx) % 3 === 0 ? '#ffd27a' : N ? '#0a0e18' : '#9ab8d8'; g.fillRect(wx, 84, 22, 18); } } }, { clamp: true }), tr: true, basic: true }), {});
    // the shed (Dad's), the whirly washing line, the wheelie bin, a flower bed, the water butt, a tree
    const sh = B.at(-230, GY, -470, 8), shw = M({ c: '#fff', map: tex('pineDark') });
    sh.box(0, -95, 0, 150, 190, 120, shw, { uv: 60 }); sh.box(0, -200, 0, 162, 20, 132, M('#3a3a3a')); sh.box(0, -190, 0, 150, 2, 120, M('#2a2a2a'));
    sh.box(30, -90, 61, 50, 160, 3, shw, { uv: 60 }); sh.box(30, -90, 63, 44, 150, 1, M('#8a6a44')); sh.box(50, -90, 64, 3, 10, 2, mMetal);
    sh.plane(-40, -120, 61.6, 40, 36, M({ c: '#7a8a7a', o: 0.6, tr: true, sh: 100 })); sh.box(-40, -120, 61.2, 44, 40, 1, M('#f0f0ea'), { sides: 'frltub' });
    sh.shadow(0, 0, 0, 170, 140, 0.6, { sq: true });
    const wl = B.at(80, GY, -330); wl.cyl(0, -100, 0, 2, 2.4, 200, 8, mMetal); for (let i = 0; i < 4; i++) wl.geo(new T.TorusGeometry(40 + i * 28, 0.5, 4, 32), 0, -196 + i * 4, 0, M('#ddd'), { rx: 90 }); for (let i = 0; i < 4; i++) wl.cyl(Math.cos(i * 1.57) * 60, -170, Math.sin(i * 1.57) * 60, 0.6, 0.6, 70, 4, mMetal, { rz: Math.cos(i * 1.57) * 50, rx: Math.sin(i * 1.57) * 50 });
    [['#fff', 0], ['#2a5ad0', 1], ['#ff9ad0', 2], ['#e8e8e8', 3]].forEach(([c, i]) => wl.rbox(Math.cos(i * 1.57 + 0.4) * 90, -150, Math.sin(i * 1.57 + 0.4) * 90, 30, 40, 2, 3, M({ c, side: 2 }), { ry: i * 90 }));
    wl.shadow(0, 0, 0, 40, 40, 0.5);
    const wb = B.at(150, GY, -110); wb.rbox(0, -55, 0, 58, 110, 70, 4, M({ c: '#2a5a2a', sh: 30, sp: '#333' })); wb.rbox(0, -112, 4, 60, 6, 74, 2, M('#245024')); wb.cyl(0, -8, -36, 12, 12, 8, 14, M('#111'), { rx: 90 }); wb.cyl(-22, -8, -36, 12, 12, 8, 14, M('#111'), { rx: 90 }); wb.shadow(0, 0, 0, 70, 84, 0.6, { sq: true });
    const fb = B.at(-200, GY, -200); fb.box(0, -4, 0, 110, 8, 60, M('#3a2a1a')); for (let i = 0; i < 12; i++) { const c = ['#ff3a3a', '#ffd400', '#ff8ad0', '#fff', '#ff8a20'][i % 5]; fb.cyl(-48 + i * 9, -14, -14 + (i % 3) * 14, 0.5, 0.5, 14, 4, M('#2a6a2a')); fb.ball(-48 + i * 9, -22, -14 + (i % 3) * 14, 4, 3, 4, M(c), 8); }
    const wbt = B.at(200, GY, -80); wbt.cyl(0, -45, 0, 26, 24, 90, 16, M({ c: '#2a6a2a', sh: 30 })); wbt.cyl(0, -91, 0, 27, 27, 2, 16, M('#1a4a1a'));
    tree(B, 140, -500, 280, 70); tree(B, -40, -540, 240, 55);
    B.box(-50, GY - 44, -126 + 60, 330, 2, 2, M('#6a6a62')); // the patio's edge
    batch.build(r.group);
    H.spot('hs.shed', { label: "Dad's shed", act: sayLines('hs.shed', "Dad's shed", ['Dad\'s shed. Padlocked. Inside: the lawnmower, 200 jam jars of screws, and a radio tuned to the cricket.', 'Dad goes in the shed "to sort it out". He has been sorting it out since 1994.']) }); pickBox(r, 'hs.shed', -230, GY - 95, -470, 150, 190, 120, 8);
    H.spot('hs.wheelie', { label: 'The wheelie bin', act: sayLines('hs.wheelie', 'The wheelie bin', ['Bin day is Tuesday. Dad wheels it out at 6am like it\'s a race.', 'It smells. It always smells. Don\'t open it.']) }); pickBox(r, 'hs.wheelie', 150, GY - 55, -110, 58, 110, 70);
    H.spot('hs.washline', { label: 'The washing line', act: sayLines('hs.washline', 'The washing line', ['The whirly washing line. Mom\'s sheets, Dad\'s work shirts, and my PE kit, flapping about for the whole street to see.', 'If you spin it fast enough the pegs fly off. Don\'t.']) }); pickBox(r, 'hs.washline', 80, GY - 150, -330, 190, 110, 190);
    H.spot('hs.flowers', { label: "Mom's flower bed", act: sayLines('hs.flowers', "Mom's flower bed", ['Mom\'s flowers. Do NOT kick the football near Mom\'s flowers. (I have kicked the football into Mom\'s flowers.)']) }); pickBox(r, 'hs.flowers', -200, GY - 14, -200, 110, 28, 60);
    H.spot('hs.butt', { label: 'The water butt', act: sayLines('hs.butt', 'The water butt', ['The water butt. Full of rainwater and one very confused frog.']) }); pickBox(r, 'hs.butt', 200, GY - 45, -80, 52, 90, 52);
    H.spot('hs.jackwin', { label: "Jack's window (from outside)", act: () => say("My window", 'That\'s my room up there. You can see the posters. Dave throws stones at it when my Mom won\'t let him ring the bell.') }); pickBox(r, 'hs.jackwin', 191, -63, -58, 70, 98, 4);
    H.walkRect('G', x0 + 6, z0 + 6, x1 - 6, z1 - 2, { room: 'garden' }); H.walkRect('G', 84, -60, 156, -50, { door: 'back', room: 'garden' });
    H.block('G', -310, -540, -150, -400); H.block('G', 152, -148, 182, -72); // (clear of the back door's path) H.block('G', -258, -234, -142, -166); H.block('G', 172, -108, 228, -52); H.block('G', 70, -340, 90, -320); H.block('G', -170, -500, -130, -460);
    H.support('garden', -215, -191, -27, -61, GY - 0.3); H.support('garden', -305, -530, -155, -410, GY - 190);
    H.support('garden', 121, -145, 179, -75, GY - 112);
  }
  function buildDrive(r) {
    const batch = K.batch(), B = K.into(batch);
    const x0 = 120, x1 = 470, z0 = 700, z1 = 1100; // (in front of the hall's front door; the street runs along z = 1100)
    skyDome(B, (x0 + x1) / 2, (z0 + z1) / 2 + 200);
    B.plane((x0 + x1) / 2 + 2000, GY + 0.1, (z0 + z1) / 2, 6000, 6000, mGrass(), { rx: 90, uv: 110 });
    B.plane(295, GY, 900, 350, 400, mTarmac(), { rx: 90, uv: 120 }); // the drive
    B.plane(-180, GY, 900, 600, 400, mGrass(), { rx: 90, uv: 110 }); // the front lawn (in front of the lounge's bay)
    B.plane(600, GY, 900, 260, 400, mGrass(), { rx: 90, uv: 110 });
    B.plane(300, GY - 0.2, 1150, 1800, 100, mSlab(), { rx: 90, uv: 100 }); // the pavement
    B.plane(300, GY, 1450, 1800, 500, mTarmac(), { rx: 90, uv: 120 }); // the road
    B.box(300, GY - 6, 1200, 1800, 12, 10, M('#9a9a92')); // the kerb
    B.plane(300, GY - 0.3, 1440, 1800, 3, M('#f4f0e0'), { rx: 90 });
    // the front of the house: brick, the bay window, the front door from outside, the number
    B.plane(-38.75, GY - 150, 701, 597.5, 600, mBrick(), { uv: 128 }); B.plane(381.25, GY - 150, 701, 82.5, 600, mBrick(), { uv: 128 }); B.plane(300, 25.5, 701, 80, 245, mBrick(), { uv: 128 }); // (the front door's opening is cut: x 260..340, up to y GY-205)
    B.box(42.5, GY - 300, 690, 790, 6, 60, M('#5a3a2a')); B.box(42.5, GY - 318, 714, 790, 30, 2, M('#7a3a2a'));
    B.box(-60, 225, 704, 236, 160, 8, M({ c: '#f2f0ea', sh: 40 }), { sides: 'frltub' }); B.plane(-60, 225, 708.5, 220, 150, M({ c: '#1a2a3a', o: 0.65, tr: true, sh: 100, sp: '#fff' }));
    B.box(257, GY - 102, 703, 6, 204, 3, mWhite); B.box(343, GY - 102, 703, 6, 204, 3, mWhite); B.box(300, GY - 206, 703, 92, 6, 3, mWhite); // (the opening, framed)
    B.box(300, GY - 215, 704, 100, 14, 40, M('#e8e4dc')); B.box(300, GY - 222, 724, 100, 2, 2, M('#9a9a92')); // the porch roof
    B.plane(340, GY - 180, 702.6, 16, 20, M({ c: '#fff', map: K.tex('hs.numb', 64, 80, (g) => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 64, 80); A.text(g, '42', 32, 58, '48px ' + A.FONT, '#f0d080', 'center'); }) }));
    B.box(300, GY - 1, 730, 70, 2, 44, M({ c: '#fff', map: matTex() })); B.cyl(360, GY - 60, 730, 2, 2, 120, 8, M('#2a2a2a')); B.ball(360, GY - 124, 730, 8, 8, 8, M({ c: '#f4ecd8', e: phase() === 'night' ? '#a08040' : '#000' }), 12);
    B.plane(560, GY - 150, 701, 300, 600, mBrick(), { uv: 128 }); // next door
    B.box(560, GY - 300, 690, 300, 6, 60, M('#5a3a2a'));
    // a low front wall with a gate, the hedge, a lamp-post on the pavement
    B.box(-60, GY - 35, 1095, 600, 70, 20, mBrick(), { uv: 128 }); B.box(-60, GY - 72, 1095, 600, 4, 24, M('#9a9a92'));
    B.box(300, GY - 35, 1095, 20, 70, 20, mBrick(), { uv: 128 }); B.box(480, GY - 35, 1095, 20, 70, 20, mBrick(), { uv: 128 });
    for (let x = -340; x < 230; x += 32) B.ball(x, GY - 52, 1060, 22, 30, 20, M({ c: ['#2e6a2a', '#3a7a30'][(x / 32) % 2 ? 1 : 0], sh: 6 }), 8);
    const lp = B.at(220, GY, 1170); lp.cyl(0, -220, 0, 5, 7, 440, 10, M('#3a3a40')); lp.box(0, -445, 0, 14, 10, 30, M('#2a2a2a'));
    r.streetGlow = M({ c: '#fff4c8', e: phase() === 'day' ? '#000' : '#ffd27a' }).clone();
    lp.box(0, -440, 10, 10, 6, 10, r.streetGlow);
    // Dad's car: a burgundy family saloon (no real make), on the drive, nose to the street
    const car = B.at(430, GY, 906, 0, { sx: 0.82, sy: 0.82, sz: 0.82 }), cm = M({ c: '#6a1a2a', sh: 80, sp: '#aaa' }), gl = M({ c: '#7a98b0', o: 0.85, tr: true, sh: 120, sp: '#fff' });
    car.rbox(0, -52, 0, 170, 46, 400, 9, cm);
    car.rbox(0, -78, -10, 166, 10, 300, 4, cm); // the sills/belt line
    { const cab = new T.BoxGeometry(150, 54, 210); const P2 = cab.attributes.position; for (let k = 0; k < P2.count; k++) if (P2.getY(k) > 0) { P2.setX(k, P2.getX(k) * 0.9); P2.setZ(k, P2.getZ(k) * 0.72 - 6); } cab.computeVertexNormals(); car.geo(cab, 0, -102, -14, gl, { sy: -1 }); }
    car.rbox(0, -131, -20, 134, 5, 150, 2, cm); // the roof
    [[-66, 60], [66, 60], [-66, -96], [66, -96]].forEach(([x, z]) => car.box(x, -103, z, 5, 52, 6, cm, { rx: z > 0 ? 24 : -20 }));
    [[-72, 140], [72, 140], [-72, -140], [72, -140]].forEach(([x, z]) => { car.cyl(x, -30, z, 30, 30, 20, 20, M('#111'), { rz: 90 }); car.cyl(x + (x > 0 ? 1 : -1) * 10.5, -30, z, 18, 18, 1, 20, M({ c: '#c8c8cc', sh: 90, sp: '#fff' }), { rz: 90 }); });
    car.box(0, -40, 201, 170, 16, 6, M('#2a2a2a')); car.box(0, -40, -201, 170, 16, 6, M('#2a2a2a'));
    [-60, 60].forEach(x => { car.box(x, -62, 203, 26, 12, 2, M({ c: '#fff4c8', e: '#fff0a0' })); car.box(x, -62, -203, 26, 12, 2, M({ c: '#ff3a3a', e: '#800' })); });
    car.box(0, -62, 203.2, 40, 10, 1, M('#222')); car.plane(0, -56, 203.8, 50, 12, M({ c: '#fff', map: K.tex('hs.plate', 128, 32, (g) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 128, 32); A.text(g, 'T42 JAK', 64, 24, '700 22px "Arial Narrow",Arial,sans-serif', '#111', 'center'); }) }));
    car.box(-78, -96, 60, 6, 8, 16, M('#222')); car.box(78, -96, 60, 6, 8, 16, M('#222')); // mirrors
    car.ball(0, -84, -120, 8, 6, 8, M('#c8a060'), 8); // the nodding dog on the parcel shelf
    car.shadow(0, 0, 0, 200, 430, 0.7, { sq: true });
    batch.build(r.group);
    H.spot('hs.car', { label: "Dad's car", act: sayLines('hs.car', "Dad's car", ['Dad\'s car. Burgundy. It has a cassette player and a tin of travel sweets that are all stuck together.', 'Dad washes it every Sunday "because it\'s a nice thing to do". It is never a nice thing to do.', 'There\'s a nodding dog on the parcel shelf. ' + 'My sister' + ' named it.']) }); pickBox(r, 'hs.car', 430, GY - 70, 915, 140, 120, 330);
    H.spot('hs.gate', { label: 'The front gate', act: sayLines('hs.gate', 'The front gate', ['The gate squeaks. Dad says he\'ll oil it. The gate has squeaked since 1991.', 'Beyond the gate: the street, the lamp-post, the postbox at the end. We don\'t go further than that today.']) }); pickBox(r, 'hs.gate', 390, GY - 35, 1095, 160, 70, 20);
    H.spot('hs.lamppost', { label: 'The lamp-post', act: sayLines('hs.lamppost', 'The lamp-post', ['The lamp-post. Orange at night. Moths love it. We used it as the goal for about six years.']) }); pickBox(r, 'hs.lamppost', 220, GY - 220, 1170, 14, 440, 14);
    H.spot('hs.bay', { label: 'The lounge window (from outside)', act: () => say('The bay window', 'The lounge. You can see the telly flickering through the nets. Mom twitches those nets at EVERYONE who walks past.') }); pickBox(r, 'hs.bay', -60, 225, 703, 236, 160, 6);
    H.walkRect('G', 124, 704, 466, 1120, { room: 'drive' }); H.walkRect('G', -340, 704, 124, 1060, { room: 'drive' }); H.walkRect('G', 262, 660, 338, 710, { door: 'front', room: 'drive' });
    H.block('G', 352, 700, 502, 1104); // (the car is parked off to the side: the front door's path is clear) H.block('G', -360, 1050, 232, 1120); H.block('G', 340, 706, 380, 750);
    H.support('drive', 355, 700, 505, 1100, GY - 80); H.support('drive', 265, 708, 335, 752, GY - 2);
  }

  // ================================================================ the rooms, their lights, their views
  const ROOMDEF = {
    landing: { name: 'The landing', title: 'THE LANDING', lvl: 'U', area: [[250, 130, 410, 250], [250, 250, 330, 700], [330, 250, 410, 700]], bx0: 252, bx1: 408, bz0: 132, bz1: 698, build: buildLanding,
      lights: () => [{ x: 300, y: -150, z: 400, c: '#fff0d8', i: lit('landing') ? 0.9 : 0, d: 520 }, { x: 390, y: -10, z: 440, c: phase() === 'day' ? '#e8f0ff' : '#5a6a9a', i: phase() === 'day' ? 1.3 : 0.25, d: 560 }, { x: 300, y: -60, z: 180, c: '#f0ece0', i: phase() === 'day' ? 0.4 : 0.1, d: 320 }],
      amb: () => interiorAmb('landing', .68),
      stations: [{ id: 'top', n: 'Top of the stairs', pose: () => look('U', 300, 175, 370, 220, 520, 158) }, { id: 'doors', n: 'Landing', pose: () => look('U', 310, 640, 250, -40, 420, 158) }] },
    hall: { name: 'The hall', title: 'THE HALL', lvl: 'G', area: [[205, 60, 410, 250], [205, 250, 330, 600], [205, 600, 410, 700], [330, 440, 410, 600]], bx0: 207, bx1: 408, bz0: 62, bz1: 698, build: buildHall,
      lights: () => { const day = phase() === 'day'; return [{ x: 300, y: 130, z: 200, c: '#fff0d8', i: lit('hall') ? 1.0 : 0, d: 520 }, { x: 300, y: 130, z: 560, c: '#fff0d8', i: lit('hall') ? 0.8 : 0, d: 420 }, { x: 300, y: 200, z: 690, c: day ? '#dfe8ff' : '#3a4a7a', i: day ? 1.3 : 0.2, d: 520 }, { x: 390, y: 180, z: 440, c: day ? '#e8f0ff' : '#5a6a9a', i: day ? 1.0 : 0.2, d: 460 }, { x: 260, y: 220, z: 150, c: day ? '#f0f0f0' : '#333', i: day ? 0.5 : 0.1, d: 300 }]; },
      amb: () => interiorAmb('hall', .68),
      stations: [{ id: 'stairs', n: 'Bottom of the stairs', pose: () => look('G', 268, 660, 370, 230, 380, 158) }, { id: 'back', n: 'The hall', pose: () => look('G', 300, 640, 260, 260, 150, 158) }] },
    cupboard: { name: 'Under the stairs', title: 'UNDER THE STAIRS', lvl: 'G', area: [[332, 252, 408, 440]], bx0: 334, bx1: 406, bz0: 254, bz1: 438, eye: 112, build: buildCupboard, noMap: false,
      lights: () => [{ x: 370, y: 150, z: 290, c: '#ffe4b8', i: lit('cupboard') ? 1.1 : 0, d: 260 }, { x: 336, y: 290, z: 400, c: '#e8e0d0', i: H.DOORS.cupboard && H.DOORS.cupboard.open ? (phase() === 'day' ? .65 : .25) : 0, d: 220 }],
      amb: () => ({ sky: lit('cupboard') ? '#b2a18b' : '#7d8190', gnd: '#5b5145', i: lit('cupboard') ? .46 : (H.DOORS.cupboard && H.DOORS.cupboard.open ? .3 : .22) }),
      stations: [{ id: 'snes', n: 'The old console', pose: () => look('G', 362, 400, 358, GY - 38, 330, 112) }] },
    lounge: { name: 'The lounge', title: 'THE LOUNGE', lvl: 'G', area: [[-280, 305, 195, 700]], bx0: -278, bx1: 193, bz0: 307, bz1: 698, build: buildLounge,
      lights: () => { const L = [{ x: -60, y: GC + 30, z: 500, c: '#fff0d0', i: lit('lounge') ? 0.95 : 0, d: 700 }, { x: -60, y: 220, z: 690, c: phase() === 'day' ? '#e8f0ff' : '#4a5a8a', i: phase() === 'day' ? 1.1 : 0.2, d: 650 }]; const lamp = lightsOn.loungeLamp == null ? phase() !== 'day' : lightsOn.loungeLamp; if (lamp) L.push({ x: 160, y: GY - 160, z: 360, c: '#ffd8a0', i: 0.8, d: 380 }); if (HouseRooms.rooms.lounge.fireOn) L.push({ x: -240, y: GY - 30, z: 500, c: '#ff8a40', i: 0.9, d: 300 }); if (window.HouseTelly && HouseTelly.on) L.push({ x: LT.x, y: GY - 80, z: LT.z + 60, c: '#8aa8ff', i: 0.55, d: 320 }); return L; },
      amb: () => interiorAmb('lounge', .6),
      sun: () => phase() === 'day' ? { x: -60, y: -100, z: 1200, tx: -60, ty: GY, tz: 400, c: '#fff4e0', i: 0.35 } : null,
      stations: [{ id: 'telly', n: 'The telly', pose: () => look('G', -50, 640, LT.x, GY - 70, LT.z, 150) }, { id: 'fire', n: 'The fireplace', pose: () => look('G', 100, 560, -270, GY - 90, 500, 158) }, { id: 'window', n: 'The window', pose: () => look('G', -40, 420, -60, 230, 700, 158) }] },
    garden: { name: 'The back garden', title: 'THE BACK GARDEN', lvl: 'G', area: [[-300, -560, 215, -56]], bx0: -298, bx1: 213, bz0: -558, bz1: -58, build: buildGarden, outside: true,
      lights: () => [{ x: 120, y: GY - 230, z: -70, c: '#ffe0a0', i: phase() === 'day' ? 0 : 0.7, d: 500 }],
      amb: () => outdoorAmb('#78855a'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: -900, tx: 0, ty: GY, tz: -300, c: '#8090c8', i: 0.15 } : { x: 400, y: -900, z: -600, tx: 0, ty: GY, tz: -300, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'patio', n: 'The garden', pose: () => look('G', 40, -90, -80, GY - 80, -420, 158) }, { id: 'shed', n: 'The shed', pose: () => look('G', -40, -300, -230, GY - 100, -470, 158) }, { id: 'house', n: 'The house', pose: () => look('G', 20, -360, 80, 60, -56, 158) }] },
    drive: { name: 'The front', title: 'OUT THE FRONT', lvl: 'G', area: [[-340, 700, 470, 1120]], bx0: -338, bx1: 468, bz0: 702, bz1: 1118, build: buildDrive, outside: true,
      lights: () => [{ x: 360, y: GY - 124, z: 730, c: '#ffe0a0', i: phase() === 'day' ? 0 : 0.7, d: 420 }, { x: 220, y: GY - 430, z: 1170, c: '#ffb860', i: phase() === 'day' ? 0 : 1.2, d: 900 }],
      amb: () => outdoorAmb('#797b70'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: 1700, tx: 300, ty: GY, tz: 900, c: '#8090c8', i: 0.15 } : { x: -400, y: -900, z: 1500, tx: 300, ty: GY, tz: 900, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'car', n: "Dad's car", pose: () => look('G', 60, 1060, 370, GY - 70, 880, 158) }, { id: 'house', n: 'The house', pose: () => look('G', 180, 1040, 150, 120, 700, 158) }, { id: 'street', n: 'The street', pose: () => look('G', 200, 760, 240, GY - 120, 1400, 158) }] },
    kitchen: { name: 'The kitchen', title: 'THE KITCHEN', lvl: 'G', area: [[-280, -56, 195, 295]], bx0: -278, bx1: 193, bz0: -54, bz1: 293, build: buildKitchen,
      lights: () => [{ x: -60, y: GC + 10, z: 120, c: '#f4f8ff', i: lit('kitchen') ? .9 : 0, d: 700 }, { x: -80, y: 240, z: -40, c: phase() === 'day' ? '#e8f0ff' : '#4a5a8a', i: phase() === 'day' ? .72 : .16, d: 600 }],
      amb: () => interiorAmb('kitchen', .64),
      sun: () => phase() === 'day' ? { x: -80, y: -100, z: -800, tx: -80, ty: GY, tz: 120, c: '#fff4e0', i: 0.3 } : null,
      stations: [{ id: 'fridge', n: 'The fridge', pose: () => look('G', -120, 160, -250, GY - 110, -10, 158) }, { id: 'sink', n: 'The sink', pose: () => look('G', -40, 180, -80, GY - 110, -56, 158) }, { id: 'table', n: 'The table', pose: () => look('G', 120, 260, -60, GY - 76, 170, 158) }] },
  };
  const HouseRooms = window.HouseRooms = {
    rooms: {}, ready: false, lightsOn, lit, phase,
    init() {
      if (this.ready) return Promise.resolve();
      for (const id in ROOMDEF) {
        const d = ROOMDEF[id]; let r = H.ROOMS[id];
        if (r) { Object.assign(r, d); r.built = false; } else r = H.room(id, d); // (the landing was a stub, so the bedroom door knew where it went)
        this.rooms[id] = r;
      }
      // the links: stairs (always open) between the landing and the hall; doors to the lounge, the kitchen, the cupboard
      H.door('stairs', { rooms: ['landing', 'hall'], always: true, open: true });
      H.stairs({ x0: 333, z0: 200, x1: 410, z1: 650, m0: 250, m1: 600, y: (x, z) => UY + 20 * Math.max(0, Math.min(14, Math.ceil((z - 250) / 25))) });
      // the bedroom door's link to the landing (if the landing was made after it)
      if (!H.ROOMS.landing.links.includes('bedroom')) H.ROOMS.landing.links.push('bedroom');
      this.ready = true;
      // the doors downstairs (built with the hall; their links are made here)
      return Promise.resolve().then(() => {
        H.buildRoom(H.ROOMS.hall);
        // the lounge and kitchen doors are built into the hall's west wall
        const hall = H.ROOMS.hall, fb = K.batch(), F = K.into(fb);
        const kd = doorway(hall, F, 'kitdoor', 'w', 205, 150, 230, GY, { inside: true });
        const ld = doorway(hall, F, 'loudoor', 'w', 205, 480, 560, GY, { inside: true });
        fb.build(hall.group);
        H.door('kitchen', { rooms: ['hall', 'kitchen'], pivot: kd, swing: 95, dir: -1 }); H.door('lounge', { rooms: ['hall', 'lounge'], pivot: ld, swing: 95, dir: -1 });
        H.walkRect('G', 193, 154, 209, 226, { door: 'kitchen', room: 'hall' }); H.walkRect('G', 193, 484, 209, 556, { door: 'lounge', room: 'hall' });
        H.spot('hs.kitdoor', { label: () => H.DOORS.kitchen.open ? 'Shut the kitchen door' : 'The kitchen', obj: kd, act: () => H.setDoor('kitchen', !H.DOORS.kitchen.open) });
        H.spot('hs.loudoor', { label: () => H.DOORS.lounge.open ? 'Shut the lounge door' : 'The lounge', obj: ld, act: () => H.setDoor('lounge', !H.DOORS.lounge.open) });
        
        // outside: the back door (kitchen -> garden) and the front door (hall -> drive). The doors are the painted ones already there: they swing
        const kit = H.ROOMS.kitchen, kb = K.batch(), KB = K.into(kb);
        const bd = doorway(kit, KB, 'backdoor', 'n', -56, 80, 160, GY, { inside: true, noframe: true, mat: M({ c: '#f2f0ea', sh: 40, sp: '#444' }), deco: (Dd, g2) => { Dd.plane(g2.sgnA * g2.dw / 2, g2.top + 50, -1.9, 50, 70, M({ c: '#c8e0f0', o: 0.4, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); Dd.plane(g2.sgnA * g2.dw / 2, g2.top + 50, 1.9, 50, 70, M({ c: '#c8e0f0', o: 0.4, tr: true, sh: 100, sp: '#fff' })); } });
        kb.build(kit.group);
        const gl = () => M({ c: '#dfe8ee', o: 0.7, tr: true, sh: 90, sp: '#fff' });
        const fd2 = doorway(hall, K.into(fb), 'frontdoor', 's', 700, 260, 340, GY, { inside: true, leaf: true, noframe: true, glass: true, panel: M({ c: '#27402f', sh: 8, sp: '#1a1a1a' }), mat: M({ c: '#2f4d3a', sh: 10, sp: '#1a1a1a' }), deco: (Dd, g2) => { const cx = g2.sgnA * g2.dw / 2;
          for (const sg of [-1, 1]) { Dd.plane(cx, g2.top + 42, sg * 1.9, 30, 46, gl(), sg < 0 ? { ry: 180 } : {}); Dd.box(cx, g2.fy - 100, sg * 2.1, 24, 4, 0.8, mBrass); Dd.box(cx, g2.fy - 100, sg * 2.5, 20, 1.2, 0.4, M('#3a2a10')); Dd.box(cx, g2.fy - 80, sg * 2.2, 4, 8, 1, mBrass); } } });
        fb.build(hall.group);
        H.door('back', { rooms: ['kitchen', 'garden'], pivot: bd, swing: 100, dir: -1 }); H.door('front', { rooms: ['hall', 'drive'], pivot: fd2, swing: 100, dir: 1 });
        H.spot('hs.backdoor', { label: () => H.DOORS.back.open ? 'Shut the back door' : 'The back door (to the garden)', obj: bd, act: () => { const o = !H.DOORS.back.open; H.setDoor('back', o); if (o && phase() !== 'day') say('The back door', 'Brrr. It\'s dark out there. Mind the step.'); } });
        H.spot('hs.frontdoor', { label: () => H.DOORS.front.open ? 'Shut the front door' : 'The front door (out the front)', obj: fd2, act: () => { if (window.Chores && Chores.door && Chores.door('front')) return; const o = !H.DOORS.front.open; H.setDoor('front', o); if (o) say('The front door', 'The front door. Out the front: the drive, Dad\'s car, the street. Mom: "Shut that door, you\'re letting the heat out!"', 5000); } });
        H.visCalc();
        H.on('room', id => { if (id === 'hall' || id === 'lounge' || id === 'kitchen' || id === 'cupboard') secret('hs.downstairs'); });
        // the life of the house (Mom, the phone, the time of day) starts once you're out of your room
        loadLife().catch(() => {});
      });
    },
    relight() { H.relight(); },
  };
  // the VCR's clock and the microwave's: flashing 12:00 (until somebody sets them)
  let lastPhase = phase();
  H.ambient.add(now => {
    const ph = phase();
    if (ph !== lastPhase) {
      lastPhase = ph;
      for (const t of phaseTextures) t.userData.repaintPhase();
      const drive = HouseRooms.rooms.drive;
      if (drive && drive.streetGlow) drive.streetGlow.emissive.set(ph === 'day' ? '#000' : '#ffd27a');
      const cupboard = HouseRooms.rooms.cupboard; if (cupboard) cupLight(cupboard);
      H.relight();
    }
    const blink = Math.floor(now / 600) % 2 === 0;
    for (const [rid, key, set] of [['lounge', 'vcrTex', 'vcrSet'], ['kitchen', 'mwTex', 'mwSet']]) {
      const r = HouseRooms.rooms[rid]; if (!r || !r[key] || !r.group.visible) continue;
      const d = new Date(), txt = (window.HouseLife && HouseLife[set] && HouseLife[set]()) ? (d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')) : (blink ? '12:00' : '');
      if (r['_' + key] === txt) continue; r['_' + key] = txt;
      const g = r[key].userData.g, w = r[key].image.width, hh = r[key].image.height; g.fillStyle = '#081008'; g.fillRect(0, 0, w, hh); g.font = '700 ' + (hh - 6) + 'px "Courier New",monospace'; g.textAlign = 'center'; g.fillStyle = rid === 'lounge' ? '#3affb0' : '#7affe0'; g.shadowColor = g.fillStyle; g.shadowBlur = 6; g.fillText(txt, w / 2, hh - 6); g.shadowBlur = 0; r[key].needsUpdate = true; H.dirty();
    }
    const lo = HouseRooms.rooms.lounge; if (lo && lo.flames && lo.group.visible) lo.flames.forEach((f, i) => { f.material.opacity = lo.fireOn ? 0.45 + Math.sin(now / 120 + i * 1.7) * 0.25 : 0; f.scale.y = 1 + Math.sin(now / 90 + i) * 0.15; });
  });
})();

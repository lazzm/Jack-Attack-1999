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
  // The front plot (docs/HOUSE-SCALE.md; the numbers are shared with js/hs-world.js, which migrates old saves): the front
  // garden runs from the house front (z 702) to the pavement at FZ: a real 6 m semi front garden with a full-size saloon.
  const { FZ, CAR } = H.FRONT, FRONT_PIERS = [236, 344, 632], LAMP = { x: 700, z: FZ + 88 };
  const tex = n => A.t(n);
  const say = (t, x, ms) => H.say(cast(t), cast(x), ms);
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  const sis = () => { try { return Cast.n('sister'); } catch (e) { return 'my sister'; } };
  const secret = id => { try { R._.secret(id); } catch (e) {} };
  const mWhite = M({ c: '#efece4', sh: 20, sp: '#222' }), mSkirt = M({ c: '#efebe0', map: tex('whiteGloss'), sh: 30, sp: '#333' });
  const mBrass = M({ c: '#c8a040', sh: 70, sp: '#a08040' }), mMetal = M({ c: '#9a9aa0', sh: 60, sp: '#888' }), mDark = M({ c: '#1b1b1e', sh: 20, sp: '#222' });
  const PICK = new T.MeshBasicMaterial({ visible: false });
  const SECRETS = [
    ['hs.downstairs', 'Downstairs', 'Leave your room and go downstairs.'],
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
      const seg = (a0, a1, top, bot) => { if (a1 - a0 < 0.1 || bot - top < 0.1) return; const mid = (a0 + a1) / 2, my = (top + bot) / 2; const pos = k === 'n' || k === 's' ? [mid, my, fixed] : [fixed, my, mid]; B.panel(pos[0], pos[1], pos[2], a1 - a0, bot - top, (d.thin || {})[k] || 4, wm, { ry, uv: d.uv || 128 }); }; // (outside walls stay inside the brick skin)
      let a = s0;
      for (const h of holes) { seg(a, h[0], cy, fy); seg(h[0], h[1], cy, h[2]); seg(h[0], h[1], h[3], fy); a = h[1]; }
      seg(a, s1, cy, fy);
      // skirting along the solid bits (not across doorways)
      if (d.skirt !== false) {
        let b = s0; const sk = (p, q) => { if (q - p < 1) return; const mid = (p + q) / 2; const off = k === 'n' ? [mid, fixed + 0.8] : k === 's' ? [mid, fixed - 0.8] : k === 'w' ? [fixed + 0.8, mid] : [fixed - 0.8, mid]; B.rbox(off[0], fy - 4.5, off[1], k === 'n' || k === 's' ? q - p : 1.6, 9, k === 'n' || k === 's' ? 1.6 : q - p, 0.55, mSkirt); };
        for (const h of holes) { if (h[3] >= fy - 0.5) { sk(b, h[0] - 6.3); b = h[1] + 6.3; } }
        sk(b, s1);
      }
    };
    side('n', x0, x1, z0, 0); side('s', x0, x1, z1, 180); side('w', z0, z1, x0, 90); side('e', z0, z1, x1, -90);
    if (d.floor) B.panel((x0 + x1) / 2, fy, (z0 + z1) / 2, x1 - x0, z1 - z0, 2, d.floor, { rx: 90, uv: d.fuv || 90 });
    // plaster coving: a solid 45-degree bar run into the wall/ceiling angle, so the corner reads as a moulding
    if (d.cove) { const cm = M({ c: '#f1ede2', sh: 10 }); B.box((x0 + x1) / 2, cy, z0, x1 - x0, 7, 7, cm, { rx: 45 }); B.box((x0 + x1) / 2, cy, z1, x1 - x0, 7, 7, cm, { rx: 45 }); B.box(x0, cy, (z0 + z1) / 2, 7, 7, z1 - z0, cm, { rz: 45 }); B.box(x1, cy, (z0 + z1) / 2, 7, 7, z1 - z0, cm, { rz: 45 }); }
    if (d.ceil !== false) B.panel((x0 + x1) / 2, cy, (z0 + z1) / 2, x1 - x0, z1 - z0, 2, d.ceil || M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 });
    // darkness in the corners: where the walls meet the floor and the ceiling
    for(const [k,a0,a1,fixed,ry,fry]of [['n',x0,x1,z0,0,180],['s',x0,x1,z1,180,0],['w',z0,z1,x0,90,-90],['e',z0,z1,x1,-90,90]]){
      const along=k==='n'||k==='s',sign=k==='n'||k==='w'?1:-1;
      const draw=(a,b)=>{if(b-a<0.1)return;const mid=(a+b)/2,x=along?mid:fixed+sign*0.3,z=along?fixed+sign*0.3:mid;
        B.ao(x,fy-16,z,b-a,32,{ry,rx:180,a:0.5});B.ao(along?mid:fixed+sign*14,fy-0.15,along?fixed+sign*14:mid,b-a,28,{rx:90,ry:fry,a:0.4});};
      let a=a0;for(const h of (((d.holes||{})[k]||[]).filter(h=>h[3]>=fy-0.5).sort((p,q)=>p[0]-q[0]))){draw(a,h[0]);a=Math.max(a,h[1])}draw(a,a1);
      B.ao(along?(a0+a1)/2:fixed+sign*0.3,cy+13,along?fixed+sign*0.3:(a0+a1)/2,a1-a0,26,{ry,a:0.3});
    }
  }
  // a flat polygon from 3D points [x, y, z] (any plane), double-sided material expected
  function poly(B, pts, m) {
    const g = new T.BufferGeometry(), pos = [], idx = [], uv = [];
    pts.forEach((p, i) => { pos.push(p[0], p[1], p[2]); uv.push(0, 0); if (i > 1) idx.push(0, i - 1, i); });
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal;
    return B.geo(K.thicken(g, .6, [n.getX(0),n.getY(0),n.getZ(0)]), 0, 0, 0, m, { uv: 128 });
  }
  // a door in a wall, on a hinge (k: n/s/e/w side of the room it's built in; a0..a1 along the wall)
  function doorway(r, B, id, k, fixed, a0, a1, fy, o) {
    o = o || {};
    const hgt = o.h || 205, top = fy - hgt, mid = (a0 + a1) / 2, dw = a1 - a0 + 0.2;
    const along = k === 'n' || k === 's';
    const P = (a, y, n) => along ? [a, y, fixed + n * (k === 'n' ? 1 : -1)] : [fixed + n * (k === 'w' ? 1 : -1), y, a];
    // Each casing sits on its own wall face. The old +/-1 cm layers
    // intersected, leaving coincident side faces around the opening.
    const depth = o.depth == null ? 10 : o.depth;
    for (const side of (o.noframe ? [] : (o.frameSides || [1, -1]))) {
      const normal = side === 1 ? 1.1 : -depth - 1.1;
      const [ax, ay, az] = P(a0 - 3.3, (top + fy) / 2, normal), [bx, by, bz] = P(a1 + 3.3, (top + fy) / 2, normal), [tx, ty, tz] = P(mid, top - 3, normal);
      B.box(ax, ay, az, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mWhite);
      B.box(bx, by, bz, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mWhite);
      B.box(tx, ty, tz, along ? a1 - a0 + 12.6 : 2.4, 6, along ? 2.4 : a1 - a0 + 12.6, mWhite);
    }
    // Solid jambs close the wall thickness; Jack's shared jamb is bedroom-owned.
    if (!o.noframe && !o.noreveal) {
      const rv = M('#e4e0d4'), rear = -depth + K.SURFACE_LIFT, front = -K.SURFACE_LIFT, jd = front - rear, jn = (front + rear) / 2;
      // The existing leaf is 0.2 cm wider than the opening for its light seal.
      // Leave 0.3 cm at each edge and butt the jamb ends to the casing backs.
      for (const a of [a0 - 1.3, a1 + 1.3]) {
        const [x, y, z] = P(a, (top + fy) / 2, jn);
        B.box(x, y, z, along ? 2 : jd, hgt, along ? jd : 2, rv);
      }
      const [x, y, z] = P(mid, top - 1, jn);
      B.box(x, y, z, along ? a1 - a0 + 4.6 : jd, 2, along ? jd : a1 - a0 + 4.6, rv);
    }
    if (o.leaf === false) return null;
    // the leaf, hinged at a1 (or a0 with o.flip), swinging into the room on the + side
    const hinge = o.flip ? a0 : a1, pv = new T.Group();
    const [hx, , hz] = P(hinge, 0, o.hingeNormal ?? (o.inside ? 2.5 : -2.5)); pv.position.set(hx, 0, hz); r.group.add(pv);
    const D = K.into(pv), lm = o.mat || M({ c: '#efebe2', map: tex('whiteGloss'), sh: 24, sp: '#333' });
    const sgnA = o.flip ? 1 : -1; // leaf goes from the hinge back across the opening
    const cx = along ? sgnA * dw / 2 : 0, cz = along ? 0 : sgnA * dw / 2;
    // A low cupboard needs its own latch height, measured from its floor.
    const ha = sgnA * (dw - 7), hy = fy - Math.min(103, hgt * 0.55);
    K.doorLeaf(pv, { cx, cy: top + 0.3 + (hgt - 0.2) / 2, cz, w: dw, h: hgt - 0.2, t: 3.6, along, leaf: lm, mould: o.panel ? lm : M({ c: '#ece8de', sh: 18, sp: '#2a2a2a' }), field: o.panel || M('#dcd7cb'),
      brass: mBrass, hinge: M({ c: '#a8884a', sh: 50, sp: '#806a3a' }), handleA: ha, handleY: hy, leverDir: -sgnA, hingeA: -sgnA * 0.4, hingeSide: o.inside ? 1 : -1, glass: !!o.glass });
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
  const lightsOn = Object.create(null), lightKeys=['landing','hall','cupboard','lounge','kitchen','loungeLamp','loungeFire'];
  try {const saved=JSON.parse(localStorage.getItem('jhp_hs_house_lights')||'{}');for(const id of lightKeys)if(typeof saved[id]==='boolean')lightsOn[id]=saved[id]}catch(e){}
  const saveHouseLights=()=>{try{localStorage.setItem('jhp_hs_house_lights',JSON.stringify(lightsOn))}catch(e){}};
  const lit = id => lightsOn[id] != null ? lightsOn[id] : (phase() !== 'day');
  const standardLampOn=()=>lightsOn.loungeLamp==null?phase()!=='day':lightsOn.loungeLamp;
  function standardLampLook(r){if(r&&r.standardBulbMaterial){r.standardBulbMaterial.emissive.set(standardLampOn()?'#c89b58':'#000000');r.standardBulbMaterial.userData.e0=r.standardBulbMaterial.emissive.clone();H.dirty()}}
  const ceilingSwitches=new Map();
  function switchLook(){for(const [id,rocker]of ceilingSwitches){rocker.rotation.x=(lit(id)?-12:12)*D2R;rocker.updateMatrix()}H.dirty()}
  function ceilingSwitch(r,id,x,y,z,ry){
    const group=new T.Group();group.position.set(x,y,z);group.rotation.y=ry*D2R;group.name='ceiling-switch-'+id;r.group.add(group);const B=K.into(group);
    B.rbox(0,0,0,8,10,1.2,0.35,mWhite);
    for(const yy of [-3.7,3.7]){B.cyl(0,yy,0.7,0.35,0.35,0.2,10,mMetal,{rx:90});B.box(0,yy,0.82,0.42,0.08,0.05,M('#555'))}
    const rocker=B.rbox(0,0,0.9,3.4,5.4,0.8,0.25,M('#d6d0c2'));rocker.matrix.decompose(rocker.position,rocker.quaternion,rocker.scale);ceilingSwitches.set(id,rocker);
    H.spot('hs.switch.'+id,{label:()=>lit(id)?'Ceiling light: switch off':'Ceiling light: switch on',obj:group,act:()=>{lightsOn[id]=!lit(id);saveHouseLights();switchLook();H.relight();window.Sound?.world('switch')}});
    switchLook();
  }
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
    // These adjoining floor panels need per-pixel matte lighting even on Low;
    // vertex-lit large quads otherwise leave a visible brightness seam.
    const wall = M({ c: '#fff', map: tex('wallpaperHall') }), carpet = M({ c: '#fff', map: tex('carpetBeige'), sh: 1, sp: '#000' });
    // floor: round the stairwell (the hole the stairs come up through)
    B.panel(330, UY, 189.5, 160, 121, 2, carpet, { rx: 90, uv: 90 }); B.panel(290, UY, 475, 80, 450, 2, carpet, { rx: 90, uv: 90 }); B.panel(370, UY, 650, 80, 100, 2, carpet, { rx: 90, uv: 90 });
    // walls
    const wl = (x, y, z, w, h, ry) => B.panel(x, y, z, w, h, 4, wall, { ry, uv: 128 });
    // west wall x 250: doors to Jack's room (150..230), the bathroom (300..380), the little sister's room (450..530)
    [[130, 150], [230, 300], [380, 450], [530, 700]].forEach(([a, b]) => wl(250, (UC + UY) / 2, (a + b) / 2, b - a, UY - UC, 90));
    [[150, 230], [300, 380], [450, 530]].forEach(([a, b]) => wl(250, (UC - 132) / 2, (a + b) / 2, b - a, -132 - UC, 90));
    wl(330, (UC + UY) / 2, 130, 160, UY - UC, 0); // the end wall (north)
    // east wall x 410: right down the stairwell to the hall floor, with a little window halfway
    // The hall owns the lower portions; do not draw them twice with two rigs.
    wl(410, (UC + GC) / 2, 190, 120, GC - UC, -90); wl(410, (UC + GC) / 2, 650, 100, GC - UC, -90);
    wl(410, (UC + GY) / 2, (250 + 400) / 2, 150, GY - UC, -90); wl(410, (UC + GY) / 2, (480 + 600) / 2, 120, GY - UC, -90);
    wl(410, (UC - 80) / 2, 440, 80, -80 - UC, -90); wl(410, (60 + GY) / 2, 440, 80, GY - 60, -90);
    // the landing window (frosted, bubbly 70s glass Dad never replaced)
    B.plane(410.8, -10, 440, 80, 140, M({ c: '#fff', o: 0.62, tr: true, sh: 80, sp: '#fff', map: K.tex('hs.obscureglass', 128, 128, (g, w, h) => { // 1970s "bubble" obscure glass: dimples catch the light
      g.fillStyle = '#d4dde6'; g.fillRect(0, 0, w, h); const r = K.rnd(4410);
      for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rr = 2 + r() * 5, gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(190,205,220,.25)'); gr.addColorStop(1, 'rgba(120,140,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
    }, { rep: [3, 5] }) }), { ry: -90 });
    // The common outdoor scene is visible through the frosted glass.
    [[400, -80, 440, 1, 6, 80], [400, 60, 440, 1, 6, 80], [400, -10, 400, 1, 146, 6], [400, -10, 480, 1, 146, 6]].forEach(([x, y, z, w, h, d]) => B.box(x + 8.75, y, z, 1.5, h, d, mWhite));
    B.rbox(408.5, 62, 440, 3, 3, 90, 0.8, mWhite);
    // Cut the parents' doorway out of the wallpaper, as for the west doors.
    // (the front wall is only 0.8 thick so it never shows through the brick skin at z 701..703)
    for (const [a, b] of [[250, 260], [340, 410]]) B.panel((a + b) / 2, (UC + UY) / 2, 700, b - a, UY - UC, 0.8, wall, { ry: 180, uv: 128 });
    B.panel(300, (UC - 132) / 2, 700, 80, -132 - UC, 0.8, wall, { ry: 180, uv: 128 });
    // the ceiling (with a loft hatch) and the stairwell's upper walls
    B.panel(330, UC, 190, 160, 120, 2, M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 }); B.panel(330, UC, 475, 160, 450, 2, M({ c: '#fff', map: tex('artex') }), { rx: -90, uv: 110 });
    B.box(290, UC + 0.5, 600, 60, 1.6, 70, mWhite); B.box(290, UC + 1.2, 600, 56, 0.6, 66, M('#d8d4c8'));
    // the floor's edge round the stairwell (you can see its thickness from the stairs)
    const edgeM = M('#d8d0c0');
    B.box(329, (UY + GC) / 2, 425, 2, GC - UY - 4, 350, edgeM);
    B.box(370, (UY + GC) / 2, 599, 80, GC - UY - 4, 2, edgeM);
    // The oak base rail caps this edge. A second white nosing used to share
    // its outer face and flicker through the oak at floor level.
    B.box(245, UY + 1.1, 190, 10.4, 2.2, 80, M({ c: '#fff', map: tex('oak') })); B.box(245, UY - 0.45, 190, 10.4, 0.9, 80, M({ c: '#fff', map: tex('oak') })); // the threshold strip: fills the wall thickness between Jack's carpet and the landing, flush with both

    // the banisters: round the stairwell up here, and down the stairs
    banister(B, [[330, 252], [330, 600], [410, 600]], UY); // (the whole open edge of the stairwell: newels with round caps at the corners; blocked below)
    // skirting on the landing walls
    [[130, 143.7], [236.3, 293.7], [386.3, 443.7], [536.3, 700]].forEach(([a, b]) => B.rbox(250.8, UY - 4.5, (a + b) / 2, 1.6, 9, b - a, 0.55, mSkirt));
    stairs(B);
    // ao along the landing walls
    [[130,150],[230,300],[380,450],[530,700]].forEach(([a,b])=>B.ao(250.3,UY-16,(a+b)/2,b-a,32,{ry:90,rx:180,a:0.5}));B.ao(330, UY - 16, 130.3, 160, 32, { rx: 180, a: 0.5 });
    batch.build(r.group);
    // doors: Jack's (already there: js/rm-room.js), the bathroom, the little sister's room, Mom and Dad's
    const Bd = K.into(K.batch()); // (frames go in the batch below)
    const fb = K.batch(), F = K.into(fb);
    doorway(r, F, 'jackframe', 'w', 250, 150, 230, UY, { leaf: false, noreveal:true, frameSides: [1] }); // bedroom owns the shared reveal and reverse casing
    doorway(r, F, 'bath', 'w', 250, 300, 380, UY, { leaf: true, inside: true });
    const sd = doorway(r, F, 'sis', 'w', 250, 450, 530, UY, { inside: true, deco: (D, g) => { D.box(g.along ? 0 : 2.65, -64, g.sgnA * g.dw / 2, 0.16, 20, 30, { r: M({ c: '#fff', map: sisSign() }), all: M('#f2a6cf') }, { rz: 2 }); } });
    const md = doorway(r, F, 'mum', 's', 700, 260, 340, UY, { inside: true });
    fb.build(r.group); void Bd;
    H.spot('hs.bath', { label: 'The bathroom', act: sayLines('hs.bath', 'The bathroom', ['Somebody is in there. Somebody is ALWAYS in there.', 'Mom says the bath is for Sunday nights and the immersion heater is not made of money.', 'There is a queue. There is only one bathroom. There are four of us. Maths.']) }); pickBox(r, 'hs.bath', 250, -30, 340, 6, 200, 80);
    H.spot('hs.sis', { label: () => sis() + "'s room", act: () => { secret('hs.sister'); say(sis() + "'s room", cast(['"KEEP OUT. THIS MEANS YOU {me.NAME}." There is a drawing of me with horns.', '{sister} is in there playing {sister.his} Seasoning Girls tape. Again. On repeat. Since 4 o\'clock.', 'I knocked. A voice said "GO AWAY". Fair enough.'][((H.SPOTS['hs.sis'].n = (H.SPOTS['hs.sis'].n | 0) + 1) - 1) % 3])); } }); pickBox(r, 'hs.sis', 250, -30, 490, 6, 200, 80);
    H.spot('hs.mum', { label: "Mom and Dad's room", act: sayLines('hs.mum', "Mom and Dad's room", ['Not allowed. There is nothing in there anyway, except Dad\'s exercise bike being used as a clothes horse.', 'The door\'s shut. Christmas presents get hidden in there. Allegedly.']) }); pickBox(r, 'hs.mum', 300, -30, 698, 80, 200, 6);
    H.spot('hs.loft', { label: 'The loft hatch', act: sayLines('hs.loft', 'The loft', ['The loft. Dad goes up there once a year for the Christmas decorations and comes down covered in fibreglass.', 'There\'s a pole with a hook for opening it. Nobody knows where the pole is.']) }); pickBox(r, 'hs.loft', 290, UC + 2, 600, 60, 3, 70);
    H.spot('hs.lwin', { label: 'The landing window', act: () => say('The landing window', 'Bubbly glass, so you can\'t see out properly. You can see it\'s ' + ({ day: 'daytime', night: 'dark', dusk: 'getting dark', dawn: 'getting light' })[phase()] + ' though.') }); pickBox(r, 'hs.lwin', 408, -10, 440, 4, 140, 80);
    H.spot('hs.banister', { label: 'The banister', act: sayLines('hs.banister', 'The banister', ['I am not allowed to slide down it. I have slid down it.', 'Polished smooth from sixteen years of hands. And one slide.']) }); pickBox(r, 'hs.banister', 330, 30, 425, 6, 90, 350);
    // where you can walk up here
    H.walkRect('U', 252, 132, 408, 250, { room: 'landing' }); H.walkRect('U', 252, 250, 328, 698, { room: 'landing' }); H.walkRect('U', 332, 602, 408, 698, { room: 'landing' });
    H.block('U', 324, 250, 336, 600); H.block('U', 330, 596, 410, 606); // the banisters
  }
  function sisSign() { return K.tex('hs.sissign', 256, 170, (g, w, h) => { g.fillStyle = '#ff9ad0'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { A.star(g, (i * 53) % w, (i * 37) % h, 6, 5); g.fill(); } A.text(g, cast("{sister}'S ROOM").toUpperCase(), 128, 60, '34px ' + A.FONT, '#b0106a', 'center'); A.text(g, 'KEEP OUT!!!', 128, 104, '30px ' + A.FONT, '#c00', 'center'); A.text(g, '(this means YOU!)', 128, 140, '700 16px ' + A.HAND, '#333', 'center'); }); }
  // A turned softwood spindle (painted): square ends where it is housed into the rail and string, a lathe-turned
  // shaft with a vase and two beads between. len = the clear height between string/base rail and handrail.
  function spindle(B, x, yTop, z, len, m) {
    const sq = Math.min(7, len * 0.12), shaft = len - sq * 2;
    B.rbox(x, yTop + sq / 2, z, 3.2, sq, 3.2, 0.35, m); B.rbox(x, yTop + len - sq / 2, z, 3.2, sq, 3.2, 0.35, m);
    const f = t => yTop + sq + shaft * t;
    B.lathe(x, 0, z, [[1.15, f(0)], [1.55, f(0.03)], [1.05, f(0.07)], [1.0, f(0.3)], [1.25, f(0.55)], [1.5, f(0.68)], [1.2, f(0.78)], [1.0, f(0.86)], [1.55, f(0.93)], [1.15, f(1)]], 10, m);
  }
  // A newel post: a chamfered square post, a moulded collar where the rails meet, a capping and a turned ball
  // finial (the y passed is the floor it stands on; the post is 104 cm to the cap like the old one).
  function newel(B, x, fy, z, wood, w) {
    w = w || 9.5;
    B.rbox(x, fy - 2, z, w + 1.6, 4, w + 1.6, 0.5, wood, { uv: 60 });               // plinth block
    B.rbox(x, fy - 52, z, w, 100, w, 0.7, wood, { uv: 60 });                        // the post
    B.rbox(x, fy - 101, z, w + 1.4, 2.4, w + 1.4, 0.6, wood, { uv: 60 });           // collar under the cap
    B.rbox(x, fy - 104.2, z, w + 2.6, 2.8, w + 2.6, 0.9, wood, { uv: 60 });         // capping
    const ball = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 10; ball.push([Math.max(0.05, Math.sin(a) * 4.3), fy - 112.4 - Math.cos(a) * 4.6]); }
    B.lathe(x, 0, z, [...ball, [1.4, fy - 107.6], [1.4, fy - 106.8], [2.6, fy - 106.0], [2.6, fy - 105.5]], 24, wood);
  }
  // spindles and a handrail along a run of points (on the landing, round the stairwell)
  function banister(B, pts, fy) {
    const wood = M({ c: '#fff', map: tex('oak') }), spin = M({ c: '#f0ece2', sh: 30 });
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) / D2R;
      B.rbox((x0 + x1) / 2, fy - 90, (z0 + z1) / 2, 6.4, 5.2, len - 9, 1.6, wood, { ry, uv: 60 }); // handrail (moulded), housed into the newel shoulders
      B.rbox((x0 + x1) / 2, fy - 3, (z0 + z1) / 2, 6, 6, len - 9, 0.6, wood, { ry, uv: 60 }); // base rail
      const n = Math.floor(len / 12);
      for (let k = 1; k < n; k++) { const t = k / n; spindle(B, x0 + (x1 - x0) * t, fy - 87.4, z0 + (z1 - z0) * t, 81.4, spin); }
    }
    for (const [x, z] of pts) newel(B, x, fy, z, wood, 9);
  }
  // the stairs: one straight flight of 13 carpeted steps, brass stair rods, a closed string on the open side and a
  // painted wall string on the wall side, turned spindles under a moulded handrail, a proper newel at the foot
  function stairs(B) {
    // ONE flight: 13 treads of going 25 and rise 20, between the string on the banister side (x 327..333) and the wall string (x 407.6..410).
    const carpet = tex('carpetBeige'), tread = M({ c: '#fff', map: carpet }), riser = M({ c: '#d9cfbd', map: carpet }), wood = M({ c: '#fff', map: tex('oak') }), spin = M({ c: '#f0ece2', sh: 30 });
    const X0 = 333, X1 = 407.6, XC = (X0 + X1) / 2, XW = X1 - X0, pitch = z => UY + 0.8 * (z - 250);
    for (let k = 1; k <= 13; k++) {
      const z0 = 250 + 25 * k - 25, y = UY + 20 * k;
      B.box(XC, y + 1.5, z0 + 12.6, XW, 3, 25.2, { t: tread, all: M('#7a6a52') }, { sides: 'tlrbu' }); // tread
      B.cyl(XC, y + 1.5, z0 + 25.2, 1.5, 1.5, XW, 10, tread, { rz: 90 });     // the carpet wrapped round the nosing
      B.box(XC, y - 9.9, z0 + 0.5, XW, 19.8, 1.2, riser);                     // riser (its top is hidden inside the tread above)
      B.cyl(XC, y - 0.75, z0 + 1.9, 0.55, 0.55, XW - 7, 10, mBrass, { rz: 90 }); // the brass stair rod in the angle, with its clips
      for (const x of [X0 + 2.6, X1 - 2.6]) B.rbox(x, y - 0.7, z0 + 1.7, 1.6, 1.4, 1.8, 0.3, mBrass);
      // contact shading: in the angle of tread and riser, and under each nosing
      B.ao(XC, y - 0.12, z0 + 1.1 + 5, XW, 10, { rx: 90, ry: 180, a: 0.38 });
      B.ao(XC, y - 5, z0 + 1.2, XW, 10, { rx: 180, a: 0.32 });
      if (k > 1) B.ao(XC, y - 19.8 + 2.6, z0 + 1.2, XW, 5.2, { a: 0.42 });
    }
    B.box(XC, GY - 9.9, 575, XW, 19.8, 1.2, riser);
    B.ao(XC, GY - 19.8 + 2.6, 575.7, XW, 5.2, { a: 0.42 }); B.ao(XC, GY - 5, 575.7, XW, 10, { rx: 180, a: 0.3 });
    // the closed string on the open side: from just above the nosings to just under the soffit; the handrail and spindles stand on it
    const ang = Math.atan2(0.8, 1) / D2R, z1 = 252, z2 = 600, zc = (z1 + z2) / 2, L = Math.hypot(z2 - z1, 0.8 * (z2 - z1));
    B.rbox(330, pitch(zc) + 8, zc, 6, 25, L, 0.6, wood, { rx: -ang, uv: 60 });
    // the wall string: a painted board following the pitch, like the skirting it meets top and bottom
    B.rbox(408.8, pitch(zc) + 7, zc, 2.4, 25, L + 2, 0.6, mSkirt, { rx: -ang });
    { // a soft shadow on the wall just above the wall string, along the whole flight
      const g = new T.BufferGeometry(), za = 252, zb = 598, top = z => pitch(z) - 5.5, h = 26;
      g.setAttribute('position', new T.Float32BufferAttribute([409.8, top(za), za, 409.8, top(za) - h, za, 409.8, top(zb), zb, 409.8, top(zb) - h, zb], 3));
      g.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 0, 0, 1, 1, 1, 0], 2)); g.setIndex([0, 2, 1, 1, 2, 3]); g.computeVertexNormals();
      B.geo(g, 0, 0, 0, M({ c: '#000', map: K.TEX.fade, basic: true, tr: true, o: 0.4, dw: false, po: -2, side: 2 }));
    }
    // The flight runs along the landing's open edge (x 330), whose own balustrade stands on the landing floor.
    // Where the stair balustrade would pass through that one (and the landing's slab edge), the open side is a
    // plastered spandrel under the landing instead; the stair handrail starts at a drop newel hung from the
    // landing edge and runs down to the bottom newel. (R04: no rail crossing the landing balusters.)
    const zDrop = 392, edgeBottom = GC - 3; // (1 cm into the landing's slab edge: no shared faces)
    B.rbox(330, (edgeBottom + pitch(zDrop) - 4) / 2, zDrop, 9, pitch(zDrop) - 4 - edgeBottom, 9, 0.7, wood, { uv: 60 });
    B.lathe(330, 0, zDrop, [[3.4, pitch(zDrop) - 4.2], [2.2, pitch(zDrop) - 1.5], [3, pitch(zDrop) + 1.5], [0.05, pitch(zDrop) + 2.6]], 16, wood); // the drop's turned pendant
    { const zs = [286, zDrop], top = GC - 1.95; poly(B, [[330, top, zs[0]], [330, top, zs[1]], [330, pitch(zs[1]) - 6, zs[1]], [330, pitch(zs[0]) - 6, zs[0]]], M({ c: '#fff', map: tex('wallpaperHall'), side: 2 })); }
    const rail0 = zDrop + 4.5, rail1 = z2 - 5, railMid = (rail0 + rail1) / 2;
    B.rbox(330, pitch(railMid) - 92, railMid, 6.4, 5.2, Math.hypot(rail1 - rail0, 0.8 * (rail1 - rail0)), 1.6, wood, { rx: -ang, uv: 60 });
    // Turned spindles, plumb, two per tread, from the string to the underside of the handrail.
    for (let k = 1; k <= 26; k++) { const z = 250 + 12.5 * k - 6.25; if (z > z2 - 6 || z < zDrop + 6) continue; spindle(B, 330, pitch(z) - 89.3, z, 84.4, spin); }
    newel(B, 330, GY, 600, wood, 10); // the newel post at the bottom
  }

  // ================================================================ THE HALL (round the bottom of the stairs)
  function buildHall(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperHall') }), carpet = M({ c: '#fff', map: tex('carpetBeige'), sh: 1, sp: '#000' });
    // the floor and the ceiling (except over the stairs)
    B.panel(307.5, GY, 155, 205, 190, 2, carpet, { rx: 90, uv: 90 }); B.panel(267.5, GY, 425, 125, 350, 2, carpet, { rx: 90, uv: 90 }); B.panel(307.5, GY, 650, 205, 100, 2, carpet, { rx: 90, uv: 90 });
    B.panel(370,GY,520.5,80,159,2,carpet,{rx:90,uv:90}); // same hall floor/light rig, not an upstairs-lit rectangle
    const art = M({ c: '#fff', map: tex('artex') });
    B.panel(307.5, GC, 155, 205, 190, 2, art, { rx: -90, uv: 110 }); B.panel(267.5, GC, 425, 125, 350, 2, art, { rx: -90, uv: 110 }); B.panel(370, GC, 650, 80, 100, 2, art, { rx: -90, uv: 110 }); B.panel(267.5, GC, 650, 125, 100, 2, art, { rx: -90, uv: 110 });
    const wl = (x, y, z, w, h, ry) => B.panel(x, y, z, w, h, 4, wall, { ry, uv: 128 });
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
    [[205, 260], [340, 410]].forEach(([a, b]) => B.panel((a + b) / 2, (GC + GY) / 2, 700, b - a, GY - GC, 0.8, wall, { ry: 180, uv: 128 }));
    B.panel(300, (GC + GY - 210) / 2, 700, 80, GY - 210 - GC, 0.8, wall, { ry: 180, uv: 128 });
    wl(410, (GC + GY) / 2, 650, 100, GY - GC, -90);
    // skirting
    [[60, 143.7], [236.3, 473.7], [566.3, 700]].forEach(([a, b]) => B.rbox(205.8, GY - 4.5, (a + b) / 2, 1.6, 9, b - a, 0.55, mSkirt));
    B.rbox(307.5, GY - 4.5, 60.8, 205, 9, 1.6, 0.55, mSkirt); B.rbox(329.2, GY - 4.5, 303.1, 1.6, 9, 105.2, 0.55, mSkirt); B.rbox(329.2, GY - 4.5, 507.15, 1.6, 9, 125.7, 0.55, mSkirt);
    [[60,150],[230,480],[560,700]].forEach(([a,b])=>{B.ao(205.3,GY-16,(a+b)/2,b-a,32,{ry:90,rx:180,a:0.5});B.ao(220,GY-0.3,(a+b)/2,b-a,28,{rx:90,ry:-90,a:0.4})});
    const fadeStart=250+(GY-32-UY-23.5)/0.8;
    [[250,362],[438,fadeStart]].forEach(([a,b])=>B.ao(329.7,GY-16,(a+b)/2,b-a,32,{ry:-90,rx:180,a:0.45}));
    const edgeFade=new T.BufferGeometry();edgeFade.setAttribute('position',new T.Float32BufferAttribute([329.7,GY-32,fadeStart,329.7,GY,fadeStart,329.7,GY,zF],3));edgeFade.setAttribute('uv',new T.Float32BufferAttribute([0,0,0,1,1,1],2));edgeFade.setIndex([0,2,1]);edgeFade.computeVertexNormals();
    B.geo(edgeFade,0,0,0,M({c:'#000',map:K.TEX.fade,basic:true,tr:true,o:0.45,dw:false,po:-2}));
    // the front door's frame (its leaf is hinged on in init, with the drive beyond); the doormat
    doorway(r, B, 'frontframe', 's', 700, 260, 340, GY, { leaf: false, depth: 1 });
    const fd = B.at(300, GY, 700);
    fd.rbox(0, -1, -42, 70, 2, 44, 0.7, { t: M({ c: '#fff', map: matTex() }), all: M('#8a6232') }); // a coir mat: printed top, bristly bound edges
    B.shadow(300, GY, 660, 74, 48, 0.5, { sq: true });
    // coat hooks with coats, a mirror, a radiator, the hall table with the keys bowl, a ceiling light
    const ch = B.at(206, GY - 170, 640);
    ch.box(2, 0, 0, 3, 8, 80, M({ c: '#fff', map: tex('oak') }));
    // Coats hang from real pegs: closed, softly bevelled silhouettes with
    // shoulders, sleeves, a neck opening and a hem, rather than padded blocks.
    [['#2a3a5a', -29, 74], ['#967a59', -8, 81], ['#363c47', 13, 64], ['#a96379', 31, 53]].forEach(([c, z, h], i) => {
      const reach = 9 + i * 1.2, C = ch.at(reach, -1, z, 90), cloth = M({ c, sh: 2, sp: '#080808' });
      ch.cyl((3.5 + reach) / 2, -1, z, .65, .65, reach - 3.5, 10, mBrass, { rz: 90 });
      ch.ball(reach, -2, z, 1, 1.4, 1, mBrass, 8);
      const w = i === 3 ? 8 : 10, shape = new T.Shape();
      [[-3,0],[-w,4],[-w-5,25],[-w+1,28],[-w+3,19],[-w+1,h-1],[0,h],[w-1,h-1],[w-3,19],[w-1,28],[w+5,25],[w,4],[3,0],[2,3],[-2,3]].forEach(([x,y],j) => j ? shape.lineTo(x,y) : shape.moveTo(x,y));
      shape.closePath();
      C.geo(new T.ExtrudeGeometry(shape, { depth: 3.6, steps: 1, bevelEnabled: true, bevelSegments: 2, bevelSize: .8, bevelThickness: .7, curveSegments: 1 }), 0, 0, -1.8, cloth);
      C.rbox(0, h / 2 + 2, 2.7, .7, h - 8, .6, .25, M({ c, sh: 4 }));
      for (let y = 12; y < h - 9; y += 12) C.ball(1, y, 3.1, .6, .6, .3, mDark, 6);
      for (const x of [-w*.5, w*.5]) C.rbox(x, h*.6, 2.7, w*.65, 1, .6, .25, M({ c, sh: 4 }));
    });
    const mi = B.at(206, GY - 150, 300); mi.box(1, 0, 0, 2, 60, 40, M({ c: '#fff', map: tex('oak') })); mi.plane(2.2, 0, 0, 36, 56, M({ c: '#a8b8c8', sh: 120, sp: '#fff' }), { ry: 90 });
    const rd = B.at(206, GY - 36, 400); rd.box(4, 0, 0, 3.6, 56, 90, { all: M('#e8e5dc'), r: M({ c: '#fff', map: tex('radiator'), sh: 40 }) });
    const ht = B.at(222, GY, 110); ht.box(0, -76, 0, 30, 3, 60, M({ c: '#fff', map: tex('oak') })); [[-12, -26], [12, -26], [-12, 26], [12, 26]].forEach(([x, z]) => ht.box(x, -37, z, 3, 74, 3, M({ c: '#fff', map: tex('oak') })));
    // A closed ceramic bowl with a rounded lip and inner basin, not an open
    // cone whose back faces vanished when seen from above.
    ht.lathe(0,-78,-10,[[0,-.5],[3,-.5],[5,-1.4],[7.2,-4.6],[7.8,-4.8],[8.2,-4.5],[7.7,-3],[5,0],[2.8,.2],[0,.2]],24,M({c:'#b68b59',sh:35,sp:'#333',side:2}));ht.shadow(0,-77.5,-10,18,18,.25);
    const keys=ht.at(4,-77.9,12,22);keys.geo(new T.TorusGeometry(1.7,.3,6,18),0,0,0,mMetal,{rx:90});
    for(const [x,ry,material]of [[-1,-20,mMetal],[1,30,mBrass]]){const key=keys.at(x,0,1,ry);key.cyl(0,.1,0,1.05,1.05,.4,12,material);key.box(0,.1,3,.75,.4,4.3,material);for(const z of [3.6,4.7])key.box(.55,.1,z,.7,.4,.65,material)}
    ht.shadow(0, 0, 0, 36, 66, 0.6, { sq: true });
    B.cyl(300, GC + 1.5, 200, 6, 6, 3, 14, mWhite); B.cyl(300, GC + 15, 200, 0.3, 0.3, 26, 4, M('#eee')); B.lathe(300, GC + 26, 200, [[2, -2], [14, 10]], 18, M({ c: '#f0e0b8', sh: 10, side: 2, e: '#000' }));
    batch.build(r.group);
    // the front door (it's cold out), the coats, the hall table
    // the doormat: where the post (and mail-order parcels: Agent P's pack) lands. Things can rest on it: { room: 'hall', x: 300, y: 353, z: 655 }
    wrapSpot('hs.mat', { label: 'The doormat', act: () => say('The doormat', ['WELCOME, it says. Mom hoovers it. It is the cleanest thing in the house.', 'The post lands here. Mostly bills, and catalogues for Mom. Sometimes a parcel for ME.'][((r.mn = (r.mn | 0) + 1)) % 2]) }); pickBox(r, 'hs.mat', 300, GY - 1.2, 658, 70, 2.4, 44);
    wrapSpot('hs.coats', { label: 'Coats', act: sayLines('hs.coats', 'Coats', ['Dad\'s anorak, Mom\'s good coat, my school coat (too small), ' + sis() + '\'s pink one.', 'In my coat pocket: 20p, a bus ticket and a Chompa Chomps wrapper.']) }); pickBox(r, 'hs.coats', 214, GY - 130, 640, 20, 90, 80);
    H.spot('hs.keys', { label: 'Keys bowl', act: sayLines('hs.keys', 'The keys bowl', ['Car keys, the spare front door key, a key nobody knows what it\'s for, and three buttons.']) }); pickBox(r, 'hs.keys', 222, GY - 82, 110, 30, 10, 50);
    H.spot('hs.mirror', { label: 'Mirror', act: sayLines('hs.mirror', 'Mirror', ['Still got the hair gel in from yesterday. Spiky. Excellent.', 'Is that a spot? It\'s a spot. Oh no.']) }); pickBox(r, 'hs.mirror', 207, GY - 150, 300, 3, 60, 40);
    // the cupboard door (it's a small one)
    const cd = doorway(r, K.into(r.cupFrames = K.batch()), 'cupdoor', 'w', 330, 362, 438, GY, { h: 94, inside: false, flip: false, depth: 1 });
    r.cupFrames.build(r.group);
    H.door('cupboard', { rooms: ['hall', 'cupboard'], pivot: cd, swing: 100, dir: -1, lintelPlane: 330 });
    H.spot('hs.cupdoor', { label: () => H.DOORS.cupboard.open ? 'Shut cupboard (C: crouch through)' : 'The cupboard under the stairs', obj: cd, act: () => { H.setDoor('cupboard', !H.DOORS.cupboard.open); } });
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
    B.panel(370, GY, (250.5 + 441) / 2, 80, 441 - 250.5, 2, M({ c: '#fff', map: tex('carpetBeige') }), { rx: 90, uv: 90 });
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
    H.spot('snes', { label: 'The old console (Super Fanicart)', obj: sn, act: snes });
    if(R.hasConsole&&!R.hasConsole('sn')){sn.visible=false;H.SPOTS.snes.off=true;}
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
    H.spot('hs.cord', { label: 'Light cord', obj: bl, act: () => { lightsOn.cupboard = !lit('cupboard');saveHouseLights(); secret('hs.cupboard'); cupLight(r); H.relight(); window.Sound?.world('switch'); } });
    wrapSpot('hs.cup.box', { label: 'Box of old games', act: () => say('Box of old games', 'My old games box: Segue manuals with no games, a broken Segue Gear, and a Teeny Loons sticker book.') }); pickBox(r, 'hs.cup.box', 380, GY - 20, 300, 44, 44, 34);
    wrapSpot('hs.cup.bag', { label: 'Bag of old toys', act: () => say('Bag of old toys', 'Him-Bloke, a Big Trek with no batteries, half a Ker-Plonk, and every Wonder Egg toy from 1993.') }); pickBox(r, 'hs.cup.bag', 395, GY - 16, 260, 28, 32, 24);
    wrapSpot('hs.cup.shelf', { label: 'Shelf of paint tins', act: () => say('Paint tins', 'Magnolia, magnolia, "Barley White" (magnolia), and a tiny pot of the blue from my room.') }); pickBox(r, 'hs.cup.shelf', 400, GY - 128, 360, 16, 14, 60);
    H.spot('hs.hoover', { label: 'The vacuum', act: () => (window.Chores && Chores.take && Chores.take('hoover')) || loadLife().then(() => HouseLife.chore('hoover'), () => {}) }); pickBox(r, 'hs.hoover', 398, GY - 22, 420, 24, 44, 24);
    H.spot('hs.meter', { label: 'Electricity meter', obj: meter, act: () => say('Electricity meter', 'The little disc goes round faster when the immersion heater\'s on. Dad watches it like it\'s the Grand National.') });
    H.spot('hs.tools', { label: "Dad's toolbox", act: sayLines('hs.tools', "Dad's toolbox", ['Do NOT touch Dad\'s toolbox. (A spirit level, 400 screws, no screwdriver.)']) }); pickBox(r, 'hs.tools', 350, GY - 12, 390, 40, 24, 20);
    H.ambient.add(() => { if (r.disc && r.group.visible) r.disc.rotation.y += lit('cupboard') ? 0.08 : 0.03; });
    // Continue the clear floor behind the doorway. Ending it at z372 left
    // only a 6 cm overlap with the entrance, erased by the body-radius grid.
    // The rear limit still keeps the eye clear of the descending soffit.
    H.walkRect('G', 334, 254, 406, 423, { room: 'cupboard' }); H.walkRect('G', 326, 366, 338, 434, { door: 'cupboard', room: 'hall' });
    H.block('G', 356, 280, 406, 322); H.block('G', 334, 322, 372, 360); H.block('G', 380, 246, 410, 276);
    cupLight(r);
  }
  function cupLight(r) { if (!r.bulbMesh) return; const ms = [].concat(r.bulbMesh.material); for (const m of ms) { m.emissive.set(lit('cupboard') ? '#ffe8a0' : '#000'); m.userData.e0 = m.emissive.clone(); } H.dirty(); }
  function boxTex(label, col) { return K.tex('hs.box.' + label, 128, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); A.grain(g, w, h, 900, 0.08, label.length); g.fillStyle = 'rgba(200,170,120,.6)'; g.fillRect(0, 56, w, 16); A.text(g, label, 64, 50, '700 15px ' + A.HAND, '#222', 'center'); }); }
  function taperG(w, h, d, k) { const g = new T.BoxGeometry(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); } g.computeVertexNormals(); return g; }
  function flipUV(geo) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); }
  // the SNES: Agent L's games through rm-tv.js (when it knows the console)
  function snes() {
    if(R.hasConsole&&!R.hasConsole('sn'))return say('No console','You do not own the old console.');
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
    r.fireOn=lightsOn.loungeFire===true;
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperLounge') });
    shell(B, { x0: -280, z0: 305, x1: 195, z1: 700, fy: GY, cy: GC, wall, floor: M({ c: '#fff', map: tex('carpetRed') }), fuv: 44, thin: { s: 0.8 }, holes: { e: [[480, 560, GY - 205, GY]], s: [[-170, 50, 150, 300]] } });
    // a picture rail and a dado-ish border
    const rail = M({ c: '#fff', map: tex('oak') });
    [[-42.5, 305.8, 475, 0], [-280 + 0.8, 502.5, 395, 90]].forEach(([x, z, len, ry]) => B.box(x, GC + 40, z, len, 3, 1.6, rail, { ry }));
    // the bay window at the front: net curtains, heavy curtains, the street outside
    const sw = -60;
    B.plane(sw, (150 + 300) / 2, 700 + 8, 220, 150, M({ c: '#fff', o: 0.18, tr: true, sh: 80, sp: '#fff' }), { ry: 180 });
    // Shared solid neighbourhood beyond the glass, not a painted street card.
    [[sw - 110, 0], [sw + 110, 0], [sw, 0]].forEach(([x], i) => B.box(x, 225, 703, i === 2 ? 5 : 8, 150, 8, M({ c: '#f2f0ea', sh: 40 })));
    B.box(sw, 147, 703, 220, 6, 8, M('#f2f0ea')); B.box(sw, 300, 708, 236, 4, 18, mWhite); B.box(sw, 297, 700 - 4, 236, 3, 9.6, mWhite);
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
    sofa(B, -60, 560, 180, 200, M({ c: '#fff', map: sofaTex(), sh: 2, sp: '#080808' }));
    sofa(B, 110, 430, -118, 90, M({ c: '#fff', map: sofaTex(), sh: 2, sp: '#080808' }));
    const ct = B.at(-60, GY, 450); ct.box(0, -42, 0, 100, 3, 55, M({ c: '#fff', map: tex('oak') })); [[-45, -23], [45, -23], [-45, 23], [45, 23]].forEach(([x, z]) => ct.box(x, -20.5, z, 4, 41, 4, M({ c: '#fff', map: tex('oak') }))); ct.box(0, -8, 0, 92, 2, 48, M({ c: '#fff', map: tex('oak') }));
    if(window.Magazines)Magazines.makePaper('hs.tvguide',{room:'lounge',x:-88,y:GY-43.5,z:456,ry:-12},guideTex(),.8);
    else ct.box(-28,-44,6,21,.8,28,{t:M({c:'#fff',map:guideTex()}),all:M('#f0eee8')},{ry:-12});
    ct.box(20, -45, -6, 12, 3, 10, M({ c: '#fff', map: tex('pillow') }));
    ct.lathe(28,-43.5,10,[[0,-0.7],[4.4,-0.7],[6.4,-2.4],[7.7,-4.3],[8,-4.2],[8.2,-3.9],[6.8,-1.7],[4.8,0],[0,0]],32,M({c:'#c9d7de',sh:65,sp:'#777f84'}));
    ct.shadow(0, 0, 0, 108, 62, 0.65, { sq: true });
    // the phone table by the door, a standard lamp, the display cabinet, a rubber plant
    const pt = B.at(170, GY, 610); pt.box(0, -64, 0, 40, 3, 36, M({ c: '#fff', map: tex('oak') })); [[-17, -15], [17, -15], [-17, 15], [17, 15]].forEach(([x, z]) => pt.box(x, -31, z, 3, 62, 3, M({ c: '#fff', map: tex('oak') }))); pt.box(0, -20, 0, 36, 2, 32, M({ c: '#fff', map: tex('oak') }));
    const directory=A.printed('hs.pbook',320,400,(g,w,h)=>{g.fillStyle='#ead28b';g.fillRect(0,0,w,h);window.PrintArt?.paint(g,'hs.pbook',14,126,w-28,210);A.text(g,'PHONE BOOK',w/2,66,'45px '+A.FONT,'#273849','center');A.text(g,'JACKNET • 1999',w/2,102,'bold 18px '+A.UIF,'#273849','center');A.text(g,'THE FAMILY DIRECTORY',w/2,376,'bold 16px '+A.UIF,'#273849','center')},{clamp:true});
    if(window.Magazines)Magazines.makePaper('hs.pbook',{room:'lounge',x:164,y:GY-21,z:610,ry:0},directory,4);
    else pt.box(-6,-24,0,22,4,28,M({c:'#c8a050',map:directory}));
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
    if(!H.THINGS['hs.pbook']){H.spot('hs.pbook',{label:'Phone book',act:()=>life('pbook')});pickBox(r,'hs.pbook',164,GY-24,610,24,6,30)}
    const sl=B.at(160,GY,360);sl.cyl(0,-1.5,0,14,15,3,28,M('#2a2a2a'));sl.cyl(0,-77,0,1,1,151,12,mBrass);
    sl.lathe(0,-158,0,[[11.6,-13.2],[12,-13.4],[20.2,12.8],[20.1,13.3],[19.6,13.3],[11.2,-12.7],[11.6,-13.2]],32,M({c:'#e8d2a4',sh:7}));
    for(const yy of [-171.3,-144.7])sl.geo(new T.TorusGeometry(yy===-171.3?11.6:19.9,0.22,5,40),0,yy,0,M('#bba67f'),{rx:90});
    sl.cyl(0,-151,0,2,2,5,16,M('#d5cbb6'));sl.cyl(0,-154.5,0,1.1,1.1,4,14,mMetal);r.standardBulbMaterial=M({c:'#f7e9cd',e:'#000000',sh:18}).clone();sl.ball(0,-160,0,3.1,4,3.1,r.standardBulbMaterial,20);sl.shadow(0,0,0,36,36,0.6);
    B.rbox(194.4,GY-18,360,1.2,8,12,0.4,mWhite);B.rbox(193.1,GY-18,360,1.4,3.8,3.3,0.3,M('#353536'));B.cyl(192,GY-18,360,0.5,0.5,0.8,10,M('#29292b'),{rz:90});
    r.standardLampCable=routedCord(B,[[174.8,GY-1.5,360],[176,GY-0.5,360],[185.5,GY-0.5,366],[192.7,GY-0.5,366],[192.7,GY-11,366],[191.8,GY-18,360]],'#33312d');
    // A real cabinet, not a solid block hiding everything behind its glass.
    const dc=B.at(-180,GY,315),oak=M({c:'#fff',map:tex('oak')});
    for(const x of [-44,44])dc.box(x,-60,6,2,120,30,oak,{uv:50});
    dc.box(0,-119,6,86,2,30,oak,{uv:50});dc.box(0,-1,6,86,2,30,oak,{uv:50});dc.box(0,-60,-8.4,86,116,1.2,M('#54402b'));
    for(const y of [-92,-58,-24])dc.box(0,y,6,86,2,28,oak,{uv:50});
    for(let side=0;side<2;side++){
      const door=new T.Group(),base=-222+side*42;door.position.set(base,GY,336+side*2.3);r.group.add(door);const D=K.into(door);
      for(const x of [1,41])D.box(x,-60,0,2,116,2,oak,{uv:50});for(const y of [-117,-3])D.box(21,y,0,40,2,2,oak,{uv:50});
      D.box(21,-60,-0.2,38,110,0.4,M({c:'#d4e0e5',o:0.15,tr:true,sh:90,sp:'#bbb'}));D.rbox(side?34:8,-64,1.4,1.2,7,1.2,0.3,mBrass);
      H.openable('hs.display.'+side,{label:()=>H.OPEN['hs.display.'+side].open?'Slide the glass door shut':'Slide the glass door open',pivot:door,type:'slide',axis:'x',base,amt:side?-38:38});
    }
    [[-25,'#f4f0f8'],[0,'#d8b880'],[24,'#a8d8c8']].forEach(([x,c])=>{dc.lathe(x,-93,8,[[0,-11],[2,-11],[3,-10],[5,-4],[2.5,0],[0,0]],24,M({c,sh:65,sp:'#777'}));dc.cyl(x,-104.5,8,2,2,1,16,mBrass)});
    for(const [x,c]of [[-24,'#d8c6b0'],[0,'#c3d1c5'],[24,'#bdc8d9']]){dc.cyl(x,-65,6,6,6,0.7,32,M({c,sh:45}),{rx:90});dc.cyl(x,-65,6.5,4.6,4.6,0.15,32,M('#e9e2cf'),{rx:90})}
    dc.shadow(0,0,6,96,36,0.6,{sq:true});
    const pl=B.at(-250,GY-.8,660),clay=M({c:'#b8582a',sh:4,sp:'#0b0805',side:2}),stem=M('#4a3a1a');
    pl.lathe(0,0,0,[[0,0],[9.5,0],[12,-25],[12,-26],[10.8,-26],[10.5,-24],[8.6,-2],[0,-2]],24,clay);
    pl.geo(new T.TorusGeometry(11.4,.7,6,24),0,-25.7,0,clay,{rx:90});pl.cyl(0,.4,0,13.5,13.5,.8,24,clay);
    pl.cyl(0,-23.6,0,10.5,10.5,.8,24,M({c:'#382c20',sh:2,sp:'#000000'}));pl.cyl(0,-62.5,0,.45,.9,77,8,stem);
    for(let i=0;i<9;i++){
      const x=Math.cos(i)*10,y=-40-i*7,z=Math.sin(i*2)*10,a=new T.Vector3(0,y+3,0),b=new T.Vector3(x*.8,y,z*.8),d=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),branch=new T.CylinderGeometry(.28,.4,d.length(),6);
      branch.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));pl.geo(branch,mid.x,mid.y,mid.z,stem);
      pl.ball(x,y,z,9,2,5,M({c:i%3?'#2a5a2a':'#335f2d',sh:12,sp:'#182d18'}),10,{ry:i*40,rz:20});
    }
    pl.shadow(0,.8,0,31,31,.4);
    // the ceiling light: a three-arm brass thing Mom loves
    const cl = B.at(-60, GC, 500); cl.cyl(0, 2, 0, 7, 7, 4, 16, mBrass); cl.cyl(0, 16, 0, 0.6, 0.6, 26, 6, mBrass);
    [0, 120, 240].forEach(a => { const x = Math.cos(a * D2R) * 16, z = Math.sin(a * D2R) * 16; cl.cyl(x / 2, 30, z / 2, 0.5, 0.5, 18, 4, mBrass, { rz: 90, ry: -a }); cl.lathe(x, 28, z, [[1.5, -2], [6, 8]], 14, M({ c: '#f8f0e0', side: 2, e: '#000' })); });
    // a radiator under the window, a picture over the sofa
    B.box(-60, GY - 34, 694, 160, 54, 3.6, { all: M('#e8e5dc'), b: M({ c: '#fff', map: tex('radiator') }) });
    const pic = B.at(-280 + 41.5, GY - 175, 500, 90); pic.wshadow(1, 2, -1.3, 86, 62, 0.5); pic.box(0, 0, 0, 80, 56, 2.4, M('#6a4a2a')); pic.plane(0, 0, 1.3, 72, 48, M({ c: '#fff', map: landTex() }));
    batch.build(r.group);
    // spots
    wrapSpot('hs.sofa', { label: 'The sofa', act: sayLines('hs.sofa', 'The sofa', ['Down the back of the sofa: 37p, a hair bobble, a Buildo man and a fossilised Waver.', 'Dad\'s end, Mom\'s end, and the middle bit where the spring goes.']) }); pickBox(r, 'hs.sofa', -60, GY - 30, 560, 200, 60, 80);
    H.spot('hs.chair', { label: "Dad's chair", act: sayLines('hs.chair', "Dad's chair", ['Dad\'s chair. Nobody sits in Dad\'s chair. It is the law.', 'It has a dent in the exact shape of Dad.']) });pickBox(r,'hs.chair',110,GY-47,430,90,94,88,-118);
    H.spot('hs.fire', { label: 'The gas fire', act: () => { r.fireOn = !r.fireOn;lightsOn.loungeFire=r.fireOn;saveHouseLights(); H.relight(); say('The gas fire', r.fireOn ? 'Click click click WHUMP. The fake coals glow orange. Toasty.' : 'Off. Mom says not to leave it on, it costs a fortune.'); } }); pickBox(r, 'hs.fire', -280 + 44, GY - 50, 500, 6, 100, 104);
    H.spot('hs.mantel', { label: 'The mantelpiece', act: sayLines('hs.mantel', 'The mantelpiece', ['A carriage clock (ten minutes fast, on purpose, so we\'re never late), my school photo from Year 7 (bowl haircut, braces), and {sister}\'s ballet certificate.', 'The school photo. Mom refuses to take it down. I have asked. Many times.']) }); pickBox(r, 'hs.mantel', -280 + 44, GY - 124, 500, 10, 22, 140);
    H.spot('hs.cabinet', { label: 'Display cabinet', act: sayLines('hs.cabinet', 'The display cabinet', ['Mom\'s best glasses, a crystal swan, and a souvenir plate from the seaside. We are not allowed to open it. We have never opened it.']) }); pickBox(r, 'hs.cabinet', -180, GY - 60, 322, 90, 120, 26);
    H.spot('hs.guide', { label: 'The TV guide', act: () => { if (window.HouseTelly) HouseTelly.guide(); else say('The TV guide', 'This week\'s telly, circled in Dad\'s biro.'); } }); pickBox(r, 'hs.guide', -88, GY - 45, 456, 24, 3, 30);
    H.spot('hs.lamp', { label:()=>standardLampOn()?'Standard lamp: switch off':'Standard lamp: switch on', act: () => { lightsOn.loungeLamp=!standardLampOn();saveHouseLights();standardLampLook(r);H.relight();window.Sound?.world('switch'); } }); pickBox(r,'hs.lamp',160,GY-100,360,42,200,42);standardLampLook(r);
    H.spot('hs.window', { label: 'The bay window', act: () => say('The bay window', ['Through the nets: the street, the lamp-post, next door\'s estate car.', 'The milk float hums past. Mom has a pint of gold top and a yoghurt on order.', 'Somebody\'s walking a dog. The dog has a little coat on.'][((r.wn = (r.wn | 0) + 1)) % 3]) }); pickBox(r, 'hs.window', -60, 225, 694, 220, 150, 6);
    // walking
    H.walkRect('G', -278, 307, 193, 698, { room: 'lounge' });
    H.block('G', LT.x - 48, 305, LT.x + 48, 352); // the telly
    H.block('G',-162,516,42,606);H.block('G',49,369,171,492);H.block('G',-115,418,-5,482); // full sofa/chair footprints, not just their seat centres
    H.block('G', 146, 588, 194, 634); H.block('G', -230, 305, -130, 342); H.block('G', -280, 420, -230, 580); H.block('G', 144, 344, 176, 376); H.block('G', -268, 646, -232, 676);
    H.support('lounge', -110, 422, -10, 478, GY - 43.5); H.support('lounge', 150, 592, 190, 628, GY - 65.5); H.support('lounge', -280, 430, -230, 570, GY - 114);
    H.support('lounge',152,594,188,626,GY-21); // the phone book's lower shelf
  }
  function routedCord(B,pts,col){
    const points=pts.map(p=>new T.Vector3(...p)),curve=new T.CurvePath();let from=points[0];
    for(let i=1;i<points.length-1;i++){const p=points[i],r=Math.min(1,p.distanceTo(points[i-1])*0.2,p.distanceTo(points[i+1])*0.2),a=p.clone().add(points[i-1].clone().sub(p).setLength(r)),b=p.clone().add(points[i+1].clone().sub(p).setLength(r));curve.add(new T.LineCurve3(from,a));curve.add(new T.QuadraticBezierCurve3(a,p,b));from=b}
    curve.add(new T.LineCurve3(from,points[points.length-1]));B.geo(new T.TubeGeometry(curve,72,0.25,6),0,0,0,M({c:col,sh:10}));return curve.getSpacedPoints(160).map(p=>p.toArray());
  }
  function sofa(B, x, z, ry, w, m) {
    const S = B.at(x, GY, z, ry), pipe = M({ c: '#8a6a4a', sh: 2 });
    // All upholstered faces use the same centimetres-per-repeat. Stretching
    // one floral tile over each box made the plinth flowers enormous and
    // flattened them into stripes along the arms and cushion edges.
    const fabric = { uv: 60 };
    S.rbox(0, -18, 4, w - 4, 24, 74, 5, m, fabric);
    S.rbox(0, -56, -36, w, 56, 12, 6, m, fabric);
    const n = w > 120 ? 3 : 1, gap = 1.2, cw = (w - 40 - (n - 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * (cw + gap);
      // A small compression into the deck and back pads closes the former
      // daylight joins without hiding the separate cushion silhouettes.
      S.rbox(cx, -37, 2, cw, 16, 62, 7, m, fabric);
      cushionPiping(S,cx,-37,2,cw+.12,62.12,7,pipe);
      S.rbox(cx, -64, -26, cw, 44, 16, 7, m, { rx: 8, uv: 60 });
    }
    [-1, 1].forEach(s => {
      S.rbox(s * (w / 2 - 9), -36, 4, 18, 40, 78, 8, m, fabric);
      S.rbox(s * (w / 2 - 9), -58, 4, 20, 8, 80, 4, m, fabric);
    });
    if(n===3){S.rbox(-w/2+34,-58,-13,26,28,10,4.5,M({c:'#7a2a2a',sh:8}),{ry:12,rx:12,rz:6});S.rbox(w/2-40,-58,-13,26,28,10,4.5,M({c:'#c8a850',sh:8}),{ry:-18,rx:12,rz:-4})}
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => S.cyl(a * (w / 2 - 10), -3, 4 + b * 34, 3, 3.6, 6, 10, M('#3a2414'))); // feet
    S.shadow(0, 0, 4, w + 12, 88, 0.75, { sq: true });
  }
  function cushionPiping(B,x,y,z,w,d,r,m){
    const path=new T.CurvePath(),v=(a,b)=>new T.Vector3(a,0,b),a=w/2,b=d/2,points=[[-a+r,-b],[a-r,-b],[a,-b+r],[a,b-r],[a-r,b],[-a+r,b],[-a,b-r],[-a,-b+r]],corners=[[a,-b],[a,b],[-a,b],[-a,-b]];
    for(let i=0;i<8;i++){const p=v(...points[i]),q=v(...points[(i+1)%8]);path.add(i%2?new T.CubicBezierCurve3(p,p.clone().lerp(v(...corners[(i-1)/2]),.55228475),q.clone().lerp(v(...corners[(i-1)/2]),.55228475),q):new T.LineCurve3(p,q))}
    B.geo(new T.TubeGeometry(path,56,0.18,5,true),x,y,z,m);
  }
  function curtainG(B, x, y, z, w, h, m) { const g = new T.PlaneGeometry(w, h, 40, 10), p = g.attributes.position, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { const px = p.getX(i); p.setZ(i, Math.sin(px / w * Math.PI * 10) * 3.2 + 3); u.setY(i, 1 - u.getY(i)); } g.computeVertexNormals(); B.geo(g, x, y + h / 2, z, m, { ry: 180 }); }
  function sofaTex() { return K.tex('hs.sofa', 256, 256, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); const r = K.rnd(8); for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; g.fillStyle = ['#b04a4a', '#c86a5a', '#a03a4a'][i % 3]; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 7, y + Math.sin(k * 1.26) * 7, 6, 4, k * 1.26, 0, 7); g.fill(); } g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.fillStyle = '#5a7a4a'; g.beginPath(); g.ellipse(x + 14, y + 10, 8, 3, 0.6, 0, 7); g.fill(); } A.grain(g, w, h, 4000, 0.06, 9); }); }
  function curtTex() { return K.tex('hs.curt', 128, 128, (g, w, h) => { g.fillStyle = '#6a2a2e'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(220,180,100,.2)'; g.fillRect(x, 0, 2, h); } A.grain(g, w, h, 1500, 0.06, 10); }); }
  function netTex() { return K.tex('hs.net', 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 * 2; x < w; x += 4) g.fillRect(x, y, 2, 2); g.strokeStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(64, 128, 20 + i * 18, Math.PI, 0); g.stroke(); } }); }
  function tileTex() { return K.tex('hs.hearth', 128, 64, (g, w, h) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#7a4a2a' : '#8a5a34'; g.fillRect(x * 16, y * 16, 16, 16); } g.strokeStyle = '#3a2414'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 64); g.stroke(); } }); }
  function photoTex(c) { return K.tex('hs.photo.' + c, 64, 80, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = A.lin(g, 0, 4, 0, 70, [[0, c], [1, '#e8e0d0']]); g.fillRect(4, 4, w - 8, h - 8); g.fillStyle = '#e0b090'; g.beginPath(); g.arc(32, 34, 10, 0, 7); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(22, 24, 20, 6); g.fillStyle = c; g.fillRect(20, 46, 24, 28); }); }
  function landTex() { return K.tex('hs.land', 256, 170, (g, w, h) => { g.fillStyle = A.lin(g, 0, 0, 0, h, [[0, '#a8c0d8'], [0.55, '#e8d8b8'], [0.56, '#6a8a4a'], [1, '#3a5a2a']]); g.fillRect(0, 0, w, h); g.fillStyle = '#5a6a7a'; g.beginPath(); g.moveTo(0, 95); g.lineTo(70, 50); g.lineTo(130, 90); g.lineTo(190, 40); g.lineTo(256, 95); g.fill(); g.fillStyle = '#f4f0e8'; g.fillRect(150, 100, 30, 20); g.fillStyle = '#8a2a1a'; g.beginPath(); g.moveTo(146, 100); g.lineTo(165, 88); g.lineTo(184, 100); g.fill(); A.grain(g, w, h, 3000, 0.08, 12); }); }
  function guideTex() { return A.printed('hs.guide',384,512,(g,w,h)=>{g.fillStyle='#fff0d4';g.fillRect(0,0,w,h);g.fillStyle='#982c39';g.fillRect(0,0,w,106);A.text(g,'TELLY TIMES',w/2,78,'64px '+A.FONT,'#fff','center');g.fillStyle='#192b45';g.fillRect(12,118,w-24,320);window.PrintArt?.paint(g,'hs.tvguide',12,118,w-24,320);g.fillStyle='#111b';g.fillRect(12,388,w-24,50);A.text(g,'GALAXY WALK',w/2,425,'36px '+A.FONT,'#fff','center');A.text(g,'THIS WEEK',22,478,'34px '+A.FONT,'#111');A.text(g,'ALL 5 CHANNELS • 1999',22,502,'bold 17px '+A.UIF,'#982c39')},{clamp:true}); }
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
    const wall = M({ c: '#fff', map: tex('wallKitchen') });
    shell(B, { x0: -280, z0: -56, x1: 195, z1: 295, fy: GY, cy: GC, wall, uv: 48, cove: true, thin: { n: 0.7 }, floor: M({ c: '#fff', map: tex('lino') }), fuv: 60, holes: { e: [[150, 230, GY - 205, GY]], n: [[-140, -20, 195, 290], [80, 160, GY - 205, GY]] } });
    // the window over the sink and the back door (half glass): the garden outside
    // Shared sky/neighbourhood; no overlapping bedroom/kitchen sky cards.
    winFrame(B, -140, -20, 195, 290, -56);
    doorway(r, B, 'backframe', 'n', -56, 80, 160, GY, { leaf: false, depth: 1, frameSides: [1] });
    // the units along the back wall: base cupboards, the worktop, wall cupboards, the sink, the cooker, the washing machine
    const doorM = M({ c: '#fff', map: unitTex() }), top = M({ c: '#fff', map: worktopTex(), sh: 40, sp: '#555' });
    const unit = (x0, x1, appliance) => { const cx=(x0+x1)/2,w=x1-x0,carcass=M('#e8e2d0');
      // The washer bay's rear corner clears the back-door architrave.
      const rear = appliance ? -53 : -55;
      for(const x of [x0+1,x1-1])B.box(x,GY-46,(rear+3)/2,2,86,3-rear,carcass);
      B.box(cx,GY-46,rear+1,w-4,86,2,carcass);B.box(cx,GY-5,-26,w-4,2,54,carcass);
      if(appliance)B.box(cx,GY-46,2,w-4,84,2,M({c:'#eeeae2',sh:24}));else{B.box(cx,GY-46,1.6,w-4,84,1.2,M({ c: '#d9cba6', sh: 18, sp: '#222' }));unitDoors(B,cx,GY-46,2.2,w-4,83,1);}
      B.box(cx,GY-4,-3,w-4,8,2,M('#3a3a3a')); // solid recessed kickboard
    };
    unit(-214.5,-160);unit(-160,-40);unit(20,80,true);
    // Reserve the fridge bay and cut a real opening for the sink bowl.
    const work=(x0,x1,z0,z1)=>B.box((x0+x1)/2,GY-91.5,(z0+z1)/2,x1-x0,3,z1-z0,top);
    work(-214.5,-103,-56,10);work(-57,-40,-56,10);work(-103,-57,-56,-44);work(-103,-57,-8,10);work(20,73.5,-56,10);work(73.5,80,-53,10);
    // Sixteen 12 cm tiles per texture: world UVs keep the grout square and
    // the fruit motifs round instead of stretching them across the wall.
    // Leave the actual window and back-door opening clear. The old single
    // strip also hid most of the window and fought the door casing for depth.
    for(const [x0,x1]of [[-280,-140],[-20,73.5]])B.plane((x0+x1)/2,GY-120,-55.8,x1-x0,56,M({c:'#fff',map:tex('tiles')}),{uv:192});
    const wu = (x0, x1) => { const cx = (x0 + x1) / 2; B.box(cx, GC + 80, -40, x1 - x0, 70, 32, { f: M({ c: '#d9cba6', sh: 18, sp: '#222' }), all: M('#e8e2d0') }); unitDoors(B, cx, GC + 80, -24, x1 - x0, 69, 1, true); };
    wu(-214.5,-160);wu(20,71.5); // 2.2 cm clear of the door casing
    B.shadow(-110, GY, -26, 270, 70, 0.7, { sq: true });
    // the sink (stainless steel), the taps, the washing-up
    const sk=B.at(-80,GY-93,-26),steel=M({c:'#b4bcc4',sh:70,sp:'#aab4bd'});
    for(const x of [-24,24])sk.rbox(x,-0.3,0,2,0.6,40,0.25,steel);
    for(const z of [-19,19])sk.rbox(0,-0.3,z,46,0.6,2,0.25,steel);
    sk.box(0,13,0,46,2,36,steel);for(const x of [-22.5,22.5])sk.box(x,6,0,1,12,36,steel);for(const z of [-17.5,17.5])sk.box(0,6,z,44,12,1,steel);
    sk.cyl(0,11.9,0,2.2,2.2,0.2,20,M('#454b50'));sk.cyl(0,11.7,0,1.5,1.5,0.2,20,mMetal);
    for(let a=0;a<8;a++)sk.cyl(Math.cos(a*Math.PI/4),11.55,Math.sin(a*Math.PI/4),0.12,0.12,0.12,6,M('#25282b'));
    sk.cyl(-6,-10,-16,0.9,0.9,18,12,mMetal);sk.cyl(-6,-18,-10,0.8,0.8,12,12,mMetal,{rx:90});sk.cyl(6,-4,-16,1.6,1.6,6,12,mMetal);
    for(const [x,c]of [[-6,'#c54b40'],[6,'#3f6999']]){sk.cyl(x,-7.3,-16,1.7,1.7,0.6,12,mWhite);sk.cyl(x,-7.7,-16,0.7,0.7,0.25,12,M(c))}
    // the cooker (freestanding, four rings, an eye-level grill), the washing machine
    const ck = B.at(-10, GY, -26); ck.box(0, -46, 0, 58, 92, 58, { f: M({ c: '#fff', map: cookerTex() }), all: M('#e8e8e4') }); ck.box(0, -93, 0, 58, 2, 58, M({ c: '#efefec', sh: 60 })); [[-14, -12], [14, -12], [-14, 12], [14, 12]].forEach(([x, z]) => ck.cyl(x, -94.6, z, 8, 8, 0.6, 18, M('#2a2a2a')));
    ck.box(0, -150, -18, 58, 20, 24, M('#e8e8e4'));
    for(const x of [-26,26])ck.box(x,-121,-25,2.4,58,3,M('#aaa9a4'));
    ck.box(0,-148,-5.8,48,11,0.6,M('#333335'));ck.box(0,-142.3,-4,48,0.8,7,mMetal);ck.cyl(0,-146,-1,0.8,0.8,42,10,mMetal,{rz:90});
    for (let i = 0; i < 5; i++) { ck.cyl(-20 + i * 10, -84, 29.3, 2.4, 2.4, 1.4, 12, M({ c: '#2a2a2a', sh: 40 }), { rx: 90 }); ck.box(-20 + i * 10, -84, 30.2, 0.6, 2.2, 0.4, M('#ddd')); }
    ck.cyl(0, -52, 30.4, 1, 1, 46, 8, mMetal, { rz: 90 }); ck.plane(0, -45, 29.2, 44, 22, M({ c: '#1a1a1a', sh: 90, sp: '#888', o: 0.9, tr: true }));
    const wm = B.at(50, GY, -26); wm.geo(new T.TorusGeometry(13, 1.6, 8, 28), 0, -45, 29.4, M({ c: '#c8ccd0', sh: 60, sp: '#888' })); wm.cyl(0, -45, 29.2, 11.5, 11.5, 0.6, 28, M({ c: '#2a3440', sh: 120, sp: '#fff' }), { rx: 90 }); wm.cyl(0, -45, 29.6, 8, 8, 0.3, 24, M({ c: '#7a8a9a', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { rx: 90 });
    wm.box(-14, -82, 29.4, 16, 5, 1.2, M('#d8d8d4')); wm.cyl(12, -82, 29.8, 2.2, 2.2, 1.2, 14, M({ c: '#333', sh: 40 }), { rx: 90 }); [4, 18, 22].forEach(x => wm.box(x - 10, -82, 29.6, 1.2, 1.2, 0.5, M('#1a8a3a')));
    // the fridge-freezer (the magnets and notes are the fridge door: js/hs-life.js)
    r.fridgeFrame={x:-247.5,z:-20,w:60,h:170,d:64};
    // warm white enamel (pure white blew out under the window light), a dark door seal line, and a busy door
    const fr = B.at(r.fridgeFrame.x,GY,r.fridgeFrame.z); fr.rbox(0, -85, 0, 60, 170, 64, 2, M({ c: '#e6e1d5', sh: 30, sp: '#4a4a48' })); fr.box(0, -110, 32.2, 58, 1.2, 0.8, M('#8e8a82'));
    for (const [x, y, c] of [[-18, -128, '#d02a2a'], [-9, -131, '#2a5ad0'], [3, -126, '#e8c020'], [-12, -98.5, '#2a8a3a'], [6, -101, '#d02a2a'], [-4, -64, '#e8c020'], [10, -60, '#2a5ad0']]) fr.rbox(x, y, 32.6, 2.6, 2.2, 1, 0.4, M(c)); // (same plastics as the notice-board pins: one draw each)
    fr.box(-12, -88, 32.15, 15, 20, 0.12, M({ c: '#fff', map: tex('note') }), { rz: -3 }); fr.box(6, -92, 32.2, 13, 17, 0.12, M({ c: '#fff', map: tex('photo') }), { rz: 4 });
    fr.box(-6, -136, 32.15, 18, 13, 0.12, M({ c: '#fff', map: tex('noteBlue') }), { rz: 2 });
    [[-130, 36], [-70, 46]].forEach(([y, hh]) => { fr.rbox(26, y, 33.6, 2.2, hh, 2.2, 0.8, M({ c: '#e0dcd4', sh: 60, sp: '#888' })); fr.box(26, y - hh / 2 + 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); fr.box(26, y + hh / 2 - 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); });
    fr.plane(-14, -160, 32.3, 16, 4, M({ c: '#fff', map: K.tex('hs.frlogo', 128, 32, (g) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 128, 32); A.text(g, 'FROSTMASTER', 64, 22, '700 15px ' + A.UIF, '#8a8a8a', 'center'); }) }));
    fr.box(0, -2.1, 20, 56, 4, 24, M('#1a1a1a')); // the plinth (a hair off the floor plane the cabinet stands on)
    fr.shadow(0, 0, 0, 68, 70, 0.7, { sq: true });
    // things on the worktop: the kettle, the toaster, the bread bin, the microwave, the radio (the biscuit tin is its own)
    const kt=B.at(-200,GY-93,-36),enamel=M({c:'#ecece5',sh:35,sp:'#666'}),handle=M({c:'#343638',sh:24});
    kt.lathe(0,0,0,[[0,-22],[6,-22],[8,-20],[10,-14],[9.6,-2],[9,-1],[0,-1]],28,enamel);kt.cyl(0,-0.5,0,10.8,10.8,1,28,handle);
    kt.cyl(0,-22.3,0,5.6,5.6,0.6,24,handle);kt.rbox(0,-23.4,0,3.2,1.8,2,0.5,handle);
    kt.geo(new T.TorusGeometry(7.3,1.15,8,24,Math.PI),-8.8,-12,0,handle,{rz:90});
    kt.cyl(10,-18,0,2.2,3,8,18,enamel,{rz:45});kt.cyl(12.83,-20.83,0,1.5,1.5,0.4,16,M('#4b4f50'),{rz:45});kt.rbox(-9,-3,0,2,1,3,0.3,handle);kt.shadow(0,0,0,26,24,0.5);
    const ts = B.at(-140, GY - 93, -36); ts.rbox(0, -9, 0, 26, 18, 16, 3, M({ c: '#d8d8d4', sh: 70, sp: '#888' })); ts.box(-5, -18.4, 0, 3, 1, 12, M('#111')); ts.box(5, -18.4, 0, 3, 1, 12, M('#111')); ts.shadow(0, 0, 0, 30, 20, 0.6, { sq: true });
    const bb = B.at(40, GY - 93, -36); bb.rbox(0, -12, 0, 34, 24, 24, 6, M({ c: '#c83a2a', sh: 40, sp: '#555' }));bb.rbox(0,-11,12.1,24,0.4,0.4,0.15,M('#76291f'));bb.rbox(0,-8,12.8,8,1.3,1.2,0.4,mMetal);bb.shadow(0, 0, 0, 38, 28, 0.6, { sq: true });
    const rd = B.at(65,GY-93,-5); rd.rbox(0,-7,0,24,14,8,2,M('#3a3a3e')); rd.cyl(6,-7,4.2,4,4,0.4,16,M('#555'),{rx:90});rd.box(-5,-9,4.2,8,3,0.4,M({c:'#d8a040',e:'#3a2000'}));rd.cyl(-8,-21,-2,0.3,0.3,20,6,mMetal,{rz:20});
    // the microwave: the clock is flashing 12:00
    const mw = new T.Group();mw.name='kitchen-microwave';mw.position.set(r.fridgeFrame.x,GY-169,-20);r.group.add(mw);const MW=K.into(mw);r.mw=mw;
    MW.rbox(0, -16, 0, 46, 30, 34, 1.4, M({ c: '#e8e6e0', sh: 30 })); MW.plane(-6, -16, 17.1, 30, 22, M({ c: '#2a2a2a', sh: 90, sp: '#888' }));
    r.mwTex = K.tex('hs.mwclock', 128, 40, () => {}, { clamp: true });
    const md = new T.Mesh(new T.PlaneGeometry(9, 3), new T.MeshBasicMaterial({ map: r.mwTex })); flipUV(md.geometry); md.position.set(15, -26, 17.12); mw.add(md);
    for (let i = 0; i < 6; i++) MW.box(12 + (i % 3) * 3, -18 + Math.floor(i / 3) * 3, 17.2, 2.4, 2, 0.4, M('#aaa'));
    MW.rbox(9.5,-16,18,1.1,15,1.5,0.4,M('#9b9b96'));for(let i=0;i<7;i++)MW.box(-23.1,-21+i*1.3,0,0.2,0.5,19,M('#666964'));
    MW.shadow(0,-1,0,48,36,0.45,{sq:true});
    const kb = new T.Group(); kb.position.set(170, GY, 20); r.group.add(kb); const KB = K.into(kb);
    KB.cyl(0, -30, 0, 15, 14, 60, 20, M({ c: '#d8d8d4', sh: 70, sp: '#888' })); KB.cyl(0, -61, 0, 15.6, 15.6, 2.4, 20, M({ c: '#c8c8c4', sh: 80, sp: '#999' })); KB.box(0, -1.5, 15, 8, 3, 6, M('#333')); KB.shadow(0, 0, 0, 36, 36, 0.6);
    H.spot('hs.bin', { label: 'Kitchen bin', obj: kb, act: () => life('bin') }); H.block('G', 152, 2, 188, 38);
    H.spot('hs.micro', { label: 'Microwave', obj: mw, act: () => life('micro') });
    // the kitchen table and chairs, a fruit bowl, the newspaper
    // A 1990s pine farmhouse table: rounded top, aprons under it, turned legs.
    const kt2 = B.at(-60, GY, 170), pineM = M({ c: '#fff', map: tex('pine') });
    kt2.rbox(0, -74, 0, 120, 4, 80, 1.2, pineM, { uv: 50, seg: 2 });
    kt2.box(0, -68.5, -33.4, 103, 7, 2.2, pineM, { uv: 50 }); kt2.box(0, -68.5, 33.4, 103, 7, 2.2, pineM, { uv: 50 });
    kt2.box(-52.4, -68.5, 0, 2.2, 7, 62, pineM, { uv: 50 }); kt2.box(52.4, -68.5, 0, 2.2, 7, 62, pineM, { uv: 50 });
    [[-54, -34], [54, -34], [-54, 34], [54, 34]].forEach(([x, z]) => turnedLeg(kt2, x, -72, z, 72, 5.6, pineM));
    // the fruit bowl: a glazed stoneware bowl on a foot ring, with real fruit in it (it is never eaten)
    const tprops = new T.Group(); tprops.position.set(-60, GY, 170); r.group.add(tprops); r.tableProps = tprops; /* (a group of its own so the Halloween carving can clear the table) */ const KT = K.into(tprops);
    const bowl = KT.at(-20, -76, -8);
    bowl.lathe(0, 0, 0, [[12.2, -6.6], [12.4, -6.2], [11.6, -3.4], [9, -1.6], [6.2, -0.9], [6, 0], [0.05, 0], [0.05, -1.4], [4.6, -1.6], [8.4, -2.6], [10.8, -4.6], [11.7, -6.4], [12.2, -6.6]], 28, M({ c: '#c9b48c', sh: 40, sp: '#555' }));
    bowl.lathe(0, 0, 0, [[12.25, -6.7], [12.45, -6.3]], 28, M({ c: '#6b4a2a', sh: 40 }));
    [[-3.6, -4.2, 1.5, '#e8901a', 3.6], [3.2, -4.4, -2.4, '#e8901a', 3.5], [1.2, -4.6, 3.8, '#b9241e', 3.4], [-1.4, -7.6, -0.6, '#7ab03a', 3.3]].forEach(([x, y, z, c, r]) => {
      bowl.ball(x, y, z, r, r * 0.93, r, M({ c, sh: 30, sp: '#444' }), 14);
      if (c !== '#e8901a') bowl.cyl(x, y - r * 0.93 - 0.6, z, 0.18, 0.25, 1.4, 5, M('#4a4424'), { rz: 12 });
      else bowl.ball(x, y - r * 0.93 + 0.1, z, 0.5, 0.25, 0.5, M('#4a4424'), 6);
    });
    bowl.geo(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(-8, -6.2, -3), new T.Vector3(-1, -12.5, -6), new T.Vector3(7, -7.4, -4)), 14, 1.5, 8, false), 0, 0, 0, M({ c: '#e8cf4a', sh: 20 }));
    bowl.shadow(0, 0, 0, 16, 16, 0.5);
    // the paper: a folded broadsheet with a real front page, one leaf lifting
    const paper = KT.at(38, -76, 19, -6), print = M({ c: '#fff', map: paperTex(), sh: 2 });
    paper.box(0, -0.12, 0, 28, 0.24, 36, { t: M({ c: '#fff', map: paperBackTex(), sh: 2 }), all: M('#d9d5c8') });
    { const g = new T.PlaneGeometry(28, 36, 1, 10), pp = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pp.count; i++) { const t = (pp.getY(i) + 18) / 36; pp.setZ(i, Math.pow(Math.max(0, t - 0.55), 2) * 9); uv.setX(i, 1 - uv.getX(i)); }
      g.computeVertexNormals(); paper.geo(K.thicken(g, 0.08), 0.4, -0.3, 0.6, print, { rx: 90, ry: 180 }); }
    paper.shadow(0, 0, 0, 31, 39, 0.35, { sq: true });
    kt2.shadow(0, 0, 0, 130, 90, 0.7, { sq: true });
    [[-60, 104, 0], [-60, 236, 180], [-136, 170, 90], [16, 170, -90]].forEach(([x, z, ry]) => chair(B, x, z, ry)); // (set 6 cm back: legs clear of the table legs and aprons)
    // a wall clock, the calendar, the cork board with Mom's lists
    const wc = B.at(-280 + 1, GC + 50, 120); wc.cyl(1, 0, 0, 16, 16, 2, 30, M('#f4f0e4'), { rz: 90 }); wc.cyl(2.2, 0, 0, 16.5, 16.5, 1, 30, M('#c83a2a'), { rz: 90 });
    r.clockHands = wc;
    const cal = B.at(194, GY - 150, 60); cal.box(-0.25, 0, 0, 0.3, 42, 30, { l: M({ c: '#fff', map: tex('calendar') }), all: M('#e9e4d6') }); cal.cyl(-0.6, -22.5, 0, 0.35, 0.35, 0.8, 8, mMetal, { rz: 90 });
    // Mom's notice board over the table: lists, a takeaway menu, the school photo
    const nb = B.at(-280, GY - 150, 205, 90), corkM = M({ c: '#fff', map: tex('cork') }), nbFrame = M({ c: '#fff', map: tex('pine') });
    nb.wshadow(0.8, 1.2, 0.1, 58, 44, 0.45); nb.box(0, 0, 0.9, 52, 38, 1.6, corkM);
    for (const e of [-1, 1]) { nb.rbox(0, e * 19.6, 1.3, 55.2, 2, 2.6, 0.4, nbFrame); nb.rbox(e * 26.6, 0, 1.3, 2, 37.2, 2.6, 0.4, nbFrame); }
    nb.box(-14, -2, 1.78, 15, 20, 0.12, M({ c: '#fff', map: tex('note') }), { rz: 3 }); nb.box(6, -5, 1.8, 16, 11, 0.12, M({ c: '#fff', map: tex('photo') }), { rz: -4 });
    nb.box(16, 7, 1.76, 11, 14, 0.12, M({ c: '#fff', map: tex('noteBlue') }), { rz: 5 }); nb.box(-2, 10, 1.77, 13, 9, 0.12, M({ c: '#fff', map: tex('calendar') }), { rz: -2 });
    [[-14, -10.5, '#d02a2a'], [6, -9.8, '#2a8a3a'], [16, -0.2, '#e8c020'], [-2, 6, '#2a5ad0']].forEach(([x, y, c]) => nb.cyl(x, y, 2.3, 0.8, 0.8, 1, 10, M(c), { rx: 90 }));
    batch.build(r.group);
    // the clock hands (they move)
    const hands = new T.Group(); hands.position.set(-280 + 3.6, GC + 50, 120); r.group.add(hands); const HN = K.into(hands);
    r.hh = new T.Group(); hands.add(r.hh); K.into(r.hh).box(0.3, -4, 0, 0.6, 8, 1.4, M('#111')); r.mh = new T.Group(); hands.add(r.mh); K.into(r.mh).box(0.6, -6, 0, 0.6, 12, 0.9, M('#111')); void HN;
    // the biscuit tin (a daily raid: js/hs-life.js asks the server)
    const tin = new T.Group();tin.position.set(40,GY-93,-4);r.group.add(tin);const TN=K.into(tin);
    TN.cyl(0, -9, 0, 11, 11, 18, 24, M({ c: '#fff', map: tinTex(), sh: 60, sp: '#888' }));
    const lid = new T.Group(); lid.position.set(0, -18, -11); tin.add(lid); K.into(lid).cyl(0, -0.8, 11, 11.6, 11.6, 2.2, 24, M({ c: '#2a5ab0', sh: 60, sp: '#888' })); r.tinLid = lid;
    TN.shadow(0, 0, 0, 26, 26, 0.6);
    H.spot('hs.tin', { label: 'The biscuit tin', obj: tin, act: () => life('tin') });
    H.spot('hs.fridge', { label: 'The fridge', act: () => life('fridge') });pickBox(r,'hs.fridge',r.fridgeFrame.x,GY-85,14,60,170,4);
    H.spot('hs.kettle', { label: 'The kettle', act: () => { window.Sound?.world('kettle'); say('The kettle', ['On it goes. In 1999 the kettle is the most important thing in any house.', 'Mom: "Put the kettle on, love." It is always on. The kettle never rests.'][((r.kn = (r.kn | 0) + 1)) % 2]); } }); pickBox(r, 'hs.kettle', -200, GY - 104, -36, 24, 24, 22);
    H.spot('hs.toaster', { label: 'Toaster', act: sayLines('hs.toaster', 'Toaster', ['The toaster has two settings: still bread, and charcoal.']) }); pickBox(r, 'hs.toaster', -140, GY - 102, -36, 28, 20, 18);
    H.spot('hs.radio', { label: 'Kitchen radio', act: sayLines('hs.radio', 'Kitchen radio', ['Tuned to the local station. A man is reading out the traffic. There is no traffic.', 'Mom has it on all day. She knows all the adverts off by heart.']) });pickBox(r,'hs.radio',65,GY-100,-5,26,16,10);
    H.spot('hs.paper', { label: 'The newspaper', act: () => life('paper') }); pickBox(r, 'hs.paper', -22, GY - 77, 189, 30, 2, 38);
    H.spot('hs.cooker', { label: 'The cooker', act: sayLines('hs.cooker', 'The cooker', ['Tonight: ' + ['fish fingers, chips and beans', 'spag bol', 'a Fondus Crispy Pancake each', 'shepherd\'s pie', 'a chicken Kiev (garlic everywhere)'][new Date().getDay() % 5] + '. Mom says do NOT touch the knobs.']) }); pickBox(r, 'hs.cooker', -10, GY - 46, 3, 58, 92, 4);
    H.spot('hs.washer', { label: 'Washing machine', act: sayLines('hs.washer', 'Washing machine', ['It walks across the floor on the spin cycle. We have found it in the middle of the kitchen before.']) }); pickBox(r, 'hs.washer', 50, GY - 46, 3, 58, 86, 4);
    H.spot('hs.wclock', { label: 'Kitchen clock', act: () => { const d = new Date(); say('Kitchen clock', 'It says ' + d.getHours() % 12 + ':' + String(d.getMinutes()).padStart(2, '0') + '. (It\'s right. The microwave isn\'t.)'); } }); pickBox(r, 'hs.wclock', -278, GC + 50, 120, 4, 32, 32);
    H.ambient.add(() => { if (!r.group.visible) return; const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60; r.mh.rotation.x = -m / 60 * Math.PI * 2; r.hh.rotation.x = -h / 12 * Math.PI * 2; });
    H.walkRect('G', -278, -54, 193, 293, { room: 'kitchen' });
    H.block('G', -280, -56, 82, 6); H.block('G', -280, -56, -218, 14); H.block('G', -124, 126, 4, 214); H.block('G', -80, 86, -40, 122); H.block('G', -80, 218, -40, 254); H.block('G', -156, 150, -116, 190); H.block('G', -4, 150, 36, 190);
    H.support('kitchen',-214.5,-56,-103,10,GY-93);H.support('kitchen',-57,-56,-40,10,GY-93);H.support('kitchen',-103,-56,-57,-44,GY-93);H.support('kitchen',-103,-8,-57,10,GY-93);H.support('kitchen',-103,-44,-57,-8,GY-81);
    H.support('kitchen',-39,-55,19,3,GY-94);H.support('kitchen',20,-56,80,10,GY-93);H.support('kitchen',-277.5,-52,-217.5,12,GY-170);H.support('kitchen',-120,130,0,210,GY-76);
  }
  function winFrame(B, x0, x1, y0, y1, z) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0, fm = M({ c: '#f2f0ea', sh: 40, sp: '#444' }), fz = z - 8; B.box(cx, y0 + 3, fz, w, 6, 6, fm); B.box(cx, y1 - 3, fz, w, 6, 6, fm); B.box(x0 + 3, cy, fz, 6, h, 6, fm); B.box(x1 - 3, cy, fz, 6, h, 6, fm); B.box(cx, cy, fz, 5, h, 6, fm); B.plane(cx, cy, fz - 1, w - 6, h - 6, M({ c: '#c8d8f0', o: 0.12, tr: true, sh: 120, sp: '#fff' })); B.panel(cx, y0, z - 6, w, 12, .4, M('#d8d4c8'), { rx: -90 }); B.panel(x0, cy, z - 6, 12, h, .4, M('#d0ccc0'), { ry: 90 }); B.panel(x1, cy, z - 6, 12, h, .4, M('#d0ccc0'), { ry: -90 }); B.rbox(cx, y1 + 1.5, z + 2, w + 10, 3, 10, 0.8, M('#efece4')); }
  // a lathe-turned table/chair leg with a square top block (for the aprons) and a turned lower part
  function turnedLeg(B, x, yTop, z, h, w, m) {
    const blk = Math.min(14, h * 0.2), f = t => yTop + blk + (h - blk) * t;
    B.rbox(x, yTop + blk / 2, z, w, blk, w, 0.4, m, { uv: 40 });
    B.lathe(x, 0, z, [[w * 0.36, f(0)], [w * 0.5, f(0.04)], [w * 0.34, f(0.1)], [w * 0.42, f(0.22)], [w * 0.36, f(0.35)], [w * 0.3, f(0.8)], [w * 0.36, f(0.9)], [w * 0.28, f(0.98)], [w * 0.26, f(1)]], 12, m);
  }
  // shaker-style kitchen unit doors (cream, with a darker moulded frame and brass bar handles)
  function unitDoors(B, cx, cy, z, w, h, s, wall) {
    const n = Math.max(1, Math.round(w / 52)), dw = w / n - 0.6, door = M({ c: '#e9e0c6', sh: 14, sp: '#222' }), frame = M({ c: '#d9cba6', sh: 18, sp: '#222' }), brass = mBrass;
    for (let i = 0; i < n; i++) {
      const x = cx - w / 2 + (i + 0.5) * (w / n), fz = z + s * 0.9;
      B.rbox(x, cy, fz, dw, h - 0.6, 1.8, 0.6, door);
      const fw = Math.min(6, dw * 0.12), zz = fz + s * 1.05;
      for (const e of [-1, 1]) { B.box(x + e * (dw / 2 - fw / 2), cy, zz, fw, h - 0.6, 0.5, frame); B.box(x, cy + e * ((h - 0.6) / 2 - fw / 2), zz, dw - fw * 2 + 0.2, fw, 0.5, frame); }
      const hx = x + (n === 1 ? 1 : (i % 2 ? -1 : 1)) * (dw / 2 - fw / 2), hy = wall ? cy + h / 2 - 9 : cy - h / 2 + 9;
      for (const dy of [-4.2, 4.2]) B.cyl(hx, hy + dy, zz + s * 0.9, 0.35, 0.35, 1.6, 8, brass, { rx: 90 });
      B.rbox(hx, hy, zz + s * 1.75, 1.1, 10, 1.1, 0.5, brass);
    }
  }
  // a 1990s pine kitchen chair: rounded seat, turned front legs, raked back with a shaped crest rail and slats, stretchers
  function chair(B, x, z, ry) {
    const C = B.at(x, GY, z, ry), w = M({ c: '#fff', map: tex('pine') });
    C.rbox(0, -45.4, 0.5, 41, 3.2, 40, 0.9, w, { uv: 40, seg: 2 });
    for (const sx of [-17, 17]) { turnedLeg(C, sx, -43.8, 16, 43.8, 3.8, w); C.rbox(sx, -21.9, -17, 3.4, 43.8, 3.4, 0.5, w, { uv: 40 }); C.rbox(sx, -67.5, -19.4, 3.2, 46, 3.2, 0.6, w, { uv: 40, rx: 7 }); C.cyl(sx, -12, -0.5, 0.9, 0.9, 31, 8, w, { rx: 90 }); }
    C.cyl(0, -15, 16, 0.85, 0.85, 31, 8, w, { rz: 90 });
    C.rbox(0, -86.5, -21.9, 37.5, 7.5, 2.6, 1.1, w, { uv: 40, rx: 7, seg: 2 }); C.rbox(0, -59.5, -18.7, 31, 3.2, 2.2, 0.6, w, { uv: 40, rx: 7 });
    for (const sx of [-9, 0, 9]) C.rbox(sx, -71.5, -20.2, 3, 21, 1.4, 0.45, w, { uv: 40, rx: 7 });
    C.shadow(0, 0, 0, 46, 46, 0.5, { sq: true });
  }
  function unitTex() { return K.tex('hs.unit', 256, 256, (g, w, h) => { g.fillStyle = '#e8dfc4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 3; g.strokeRect(10, 10, w / 2 - 15, h - 20); g.strokeRect(w / 2 + 5, 10, w / 2 - 15, h - 20); g.strokeStyle = '#d8ccae'; g.lineWidth = 6; g.strokeRect(22, 22, w / 2 - 39, h - 44); g.strokeRect(w / 2 + 17, 22, w / 2 - 39, h - 44); g.fillStyle = '#a8883a'; g.fillRect(w / 2 - 22, h / 2 - 20, 6, 40); g.fillRect(w / 2 + 16, h / 2 - 20, 6, 40); A.grain(g, w, h, 1200, 0.04, 33); }); }
  function worktopTex() { return K.tex('hs.worktop', 256, 64, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); const r = K.rnd(7); for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,40,.3)' : 'rgba(255,250,230,.3)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }); }
  function cookerTex() { return K.tex('hs.cooker', 256, 256, (g, w, h) => { g.fillStyle = '#ecebe6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.fillRect(24, 70, 208, 160); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(30, 76, 90, 30); g.fillStyle = '#c8c8c4'; g.fillRect(40, 60, 176, 6); for (let i = 0; i < 5; i++) { g.fillStyle = '#333'; g.beginPath(); g.arc(40 + i * 44, 30, 11, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.fillRect(38 + i * 44, 20, 4, 10); } }); }
  function tinTex() { return K.tex('hs.tin', 256, 64, (g, w, h) => { g.fillStyle = '#2a5ab0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = ['#e8c040', '#d02a2a', '#f4f0e0'][i % 3]; g.beginPath(); g.arc(16 + i * 32, 32, 10, 0, 7); g.fill(); } g.fillStyle = '#e8c040'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); A.text(g, 'ASSORTED', 128, 36, '700 12px ' + A.UIF, '#fff', 'center'); }); }
  // newsprint: tiny grey "words" in justified columns read as text at any distance without a font
  function newsCols(g, x, y, w, h, cols, seed) {
    const r = K.rnd(seed), cw = (w - (cols - 1) * 8) / cols;
    for (let c = 0; c < cols; c++) for (let yy = y; yy < y + h; yy += 7) { let xx = x + c * (cw + 8); const end = xx + cw - (r() < 0.12 ? cw * r() * 0.7 : 0);
      g.fillStyle = 'rgba(40,40,40,.62)'; while (xx < end - 3) { const ww = Math.min(end - xx, 4 + r() * 16); g.fillRect(xx, yy, ww, 3); xx += ww + 3; } }
  }
  function paperTex() { return K.tex('hs.paper2', 512, 680, (g, w, h) => { g.fillStyle = '#ece8dc'; g.fillRect(0, 0, w, h);
    A.text(g, 'THE DAILY', 256, 74, '78px ' + A.FONT, '#111', 'center'); g.fillStyle = '#111'; g.fillRect(20, 88, 472, 3); g.fillRect(20, 112, 472, 1);
    A.text(g, 'EVERY MORNING  ~  1999  ~  32p', 256, 106, '700 13px ' + A.UIF, '#333', 'center');
    A.text(g, 'MILLENNIUM BUG:', 256, 160, '44px ' + A.FONT, '#111', 'center'); A.text(g, 'ARE WE READY?', 256, 206, '44px ' + A.FONT, '#111', 'center');
    g.fillStyle = '#8a8a86'; g.fillRect(24, 226, 220, 150); g.fillStyle = '#6c6c68'; g.fillRect(40, 250, 90, 110); g.fillStyle = '#a5a5a0'; g.fillRect(140, 240, 90, 70);
    newsCols(g, 256, 228, 232, 150, 2, 11); newsCols(g, 24, 392, 464, 260, 3, 12);
    A.text(g, 'Computers may think it is 1900, experts warn - page 4', 24, 670, 'italic 13px ' + A.UIF, '#333'); }, { clamp: true }); }
  function paperBackTex() { return K.tex('hs.paperB', 512, 680, (g, w, h) => { g.fillStyle = '#e9e5d8'; g.fillRect(0, 0, w, h);
    A.text(g, 'TV & RADIO', 24, 44, '34px ' + A.FONT, '#111'); g.fillStyle = '#111'; g.fillRect(20, 54, 472, 2);
    newsCols(g, 24, 70, 464, 380, 4, 21); g.fillStyle = '#9a9a96'; g.fillRect(24, 470, 160, 110); newsCols(g, 200, 470, 288, 190, 2, 22); }, { clamp: true }); }
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
  const mGrass = () => M({ c: '#fff', map: K.tex('hs.grass', 256, 256, (g, w, h) => { g.fillStyle = '#465e35'; g.fillRect(0, 0, w, h); const r = K.rnd(62); for (let i = 0; i < 14000; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(35,58,25,.35)' : v < 0.9 ? 'rgba(102,136,75,.25)' : 'rgba(160,151,88,.18)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 2); } A.mottle(g, w, h, 20, 'rgba(0,0,0,.08)', 40, 63); }) });
  const mSlab = () => M({ c: '#fff', map: K.tex('hs.slab', 256, 256, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = ['#a8a49a', '#9e9a90', '#b0aca2'][(x + y * 3) % 3]; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = '#5a5a52'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } A.grain(g, w, h, 4000, 0.07, 64); A.mottle(g, w, h, 12, 'rgba(40,60,20,.15)', 30, 65); }) });
  const mBrick=()=>M({c:'#fff',map:K.tex('hs.brick.v2',256,256,(g,w,h)=>{g.fillStyle='#a69b87';g.fillRect(0,0,w,h);const r=K.rnd(66);for(let y=0;y<24;y++)for(let x=-1;x<9;x++){g.fillStyle=['#98664e','#a26d51','#936049','#ac7859'][(r()*4)|0];g.fillRect(x*32+(y%2)*16+.7,y*h/24+.7,30.6,h/24-1.4)}A.grain(g,w,h,1500,.06,66)})});
  const mTarmac = () => M({ c: '#fff', map: K.tex('hs.tarmac', 256, 256, (g, w, h) => { g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); const r = K.rnd(67); for (let i = 0; i < 12000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.12)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }) });
  function tree(B, x, z, hgt, spread) {
    const trunk = M({ c: '#fff', map: tex('oak') }), leaf = M({ c: '#2e6a2a', sh: 10 });
    B.cyl(x, GY - hgt * 0.41, z, 7, 11, hgt * 0.82, 10, trunk);
    for (let i = 0; i < 6; i++) { const a = i * 1.1, rr = spread * (0.5 + (i % 3) * 0.22); B.ball(x + Math.cos(a) * spread * 0.45, Math.min(GY - hgt * 0.78 - (i % 2) * spread * 0.3, GY - 185 - rr * 0.8), z + Math.sin(a) * spread * 0.45, rr, rr * 0.8, rr, M({ c: ['#2e6a2a', '#3a7a30', '#27602a'][i % 3], sh: 10 }), 10); }
    B.shadow(x, GY, z, spread * 2.2, spread * 2.2, 0.5);
  }
  let exteriorRoof=null;
  function houseRoof(){
    if(exteriorRoof)return;exteriorRoof=new T.Group();exteriorRoof.name='family-house-roof';H.root.add(exteriorRoof);
    const batch=K.batch(),B=K.into(batch),tile=M({c:'#fff',sh:4,map:K.tex('hs.roof.slates',256,256,(g,w,h)=>{const r=K.rnd(301);g.fillStyle='#373d3b';g.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=-1;x<9;x++){g.fillStyle=['#5a5049','#62574f','#514b45'][(r()*3)|0];g.fillRect(x*32+(y%2)*16+1,y*32+1,30,30)}A.grain(g,w,h,1200,.045,301)})}),edge=M('#413b37'),cream=M('#ddd6c5');
    const slab=(points,z,depth,material)=>{const q=new T.Shape();points.forEach(([x,y],i)=>q[i?'lineTo':'moveTo'](x,y));q.closePath();B.geo(new T.ExtrudeGeometry(q,{depth,bevelEnabled:false}),0,0,z,material,{uv:material===tile?256:128})};
    // Complete solid roof across both storeys, shared by front/back views.
    slab([[-326,-200],[60,-370],[60,-363],[-326,-193]],-82,808,tile);
    slab([[60,-370],[446,-200],[446,-193],[60,-363]],-82,808,tile);
    for(const z of [-59,701])slab([[-300,-196],[-300,-204.5],[60,-363],[420,-204.5],[420,-196]],z,2,mBrick());
    // Both flank walls, ground to eaves. The rooms inside are hidden while you are outside (room visibility), so the
    // exterior shell must close on its own: these butt between the back wall (z -56.6) and the front wall (z 701),
    // outer faces on x -300 / 420 (the downpipe brackets' wall line), tops tucked into the roof slab.
    for(const x of [-299,419])B.box(x,(GY-205)/2,(701-56.6)/2,2,GY+205,701+56.6,mBrick(),{uv:128});
    // Side gates close both passages beside the house a metre behind the front, so you never see through to the back.
    { const fm=mFence(),post=M({c:'#fff',map:tex('pineDark')}),iron=M({c:'#1d1e1f',sh:40,sp:'#444'}),gz=600;
      const run=(a,b,gate)=>{ // a..b along x at gz; gate: [x0,x1] for a ledged leaf hung on its own posts
        const posts=[a+4,b-4];if(gate)for(const x of [gate[0]-4,gate[1]+4])if(posts.every(q=>Math.abs(q-x)>1))posts.push(x);
        for(const x of posts){B.box(x,GY-95,gz,8,190,8,post,{uv:60});B.rbox(x,GY-191,gz,9.4,2,9.4,.5,post,{uv:60})}
        const xs=[...new Set(posts)].sort((p,q)=>p-q);
        for(let i=1;i<xs.length;i++){const x0=xs[i-1]+4,x1=xs[i]-4;if(x1-x0<1)continue;
          if(gate&&x0>=gate[0]-.5&&x1<=gate[1]+.5){const cx=(x0+x1)/2,w=x1-x0-1.6; // the gate leaf: boards, ledges and a brace behind, black ironmongery in front
            B.box(cx,GY-92,gz,w,172,2.4,fm,{uv:100});for(const y of [-24,-160])B.box(cx,GY+y,gz-2.6,w-6,9,2.8,post);
            B.box(cx,GY-92,gz-2.6,Math.hypot(w-14,128),7,2.4,post,{rz:Math.atan2(128,w-14)/D2R});
            for(const y of [-24,-160])B.box(x0+16,GY+y,gz+1.6,30,2.2,.8,iron);B.cyl(x1-12,GY-104,gz+2.4,2.6,2.6,1.2,10,iron,{rx:90});B.box(x1-12,GY-104,gz+3.4,7,1.2,1.4,iron);
          }else B.box((x0+x1)/2,GY-90,gz,x1-x0,180,3,fm,{uv:100});
        }
      };
      run(420,734,[428,518]);run(-694,-300,[-398,-308]); // (out to next door's fences on both sides)
    }
    B.cyl(60,-369,322,4.5,4.5,816,12,edge,{rx:90});
    for(const x of [-322,442]){B.box(x,-195,322,9,13,808,cream);B.cyl(x,-188,322,4,4,814,10,edge,{rx:90})}
    // Tile courses are thin raised battens on the slopes, never coplanar planes.
    for(let n=1;n<=9;n++){const t=n/10,y=-200-170*t;for(const sign of [-1,1])B.box(60+sign*386*(1-t),y-.8,322,1.6,1.5,802,M(n%2?'#4e4541':'#60534b'))}
    // A proper stack for a 1960s semi: big enough to read at the ridge, with a stone cap, flaunching and three pots.
    const c=B.at(-135,-260,360);c.box(0,-82,0,88,165,72,mBrick(),{uv:90});c.rbox(0,-168,0,98,9,82,1,M('#a19786'));c.box(0,-174,0,84,4,66,M('#8d8476'));
    for(const x of [-26,0,26]){c.lathe(x,0,0,[[7,-212],[7.6,-210],[7.6,-207],[8.4,-206],[11.2,-182],[11.6,-176],[0.05,-176]],14,M('#9c6a4f'));c.cyl(x,-211.6,0,6.2,6.2,.6,14,M('#252622'))}
    // Barge boards along both verges of the front and back gables, so the roof edge has real thickness.
    for(const z of [-83.6,727.6]){
      for(const sign of [-1,1]){const len=Math.hypot(386,170),ang=Math.atan2(170,386)/D2R,ux=sign*386/len,uy=170/len,cx=60+sign*193+ux*4,cy=-283.5+uy*4;
        B.box(cx,cy,z,len-8,20,3,cream,{rz:sign*ang});B.box(cx,cy-9.2,z,len-7,3,5,edge,{rz:sign*ang})}
      B.box(60,-366,z,16.4,26,3.6,cream);B.box(60,-380,z,6,4,5.4,edge); // the apex block the two boards butt into (no shared faces)
    }
    // Downpipes fixed to the side walls by stand-off brackets, fed from the gutters by a swan neck.
    for(const [x,wx] of [[-306.2,-300],[426.2,420]])for(const z of [-40,684]){
      const sx=Math.sign(x-wx),gx=x+sx*15.8;
      B.cyl(x,92,z,3.1,3.1,520,10,edge);
      B.geo(new T.TubeGeometry(new T.CubicBezierCurve3(new T.Vector3(gx,-186,z),new T.Vector3(gx,-176,z),new T.Vector3(x,-180,z),new T.Vector3(x,-166,z)),10,3.1,10,false),0,0,0,edge);
      for(const y of [-120,30,180,310]){B.box((x+wx)/2,y,z,Math.abs(x-wx)+1.4,2.2,2.4,edge);B.cyl(x,y,z,3.6,3.6,2.4,10,edge)}
      B.box(x,352,z,18,3,18,M('#545953'));for(let n=-2;n<=2;n++)B.box(x+n*2.5,350.43,z,1.2,.12,12,M('#232825'));
    }
    batch.build(exteriorRoof);H.dirty();
  }
  const shedWood=()=>M({c:'#fff',map:K.tex('hs.shed.boards',128,256,(g,w,h)=>{const r=K.rnd(177);g.fillStyle='#847351';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=32){g.fillStyle=['#897856','#7e6f51','#918061','#827154'][x/32];g.fillRect(x+1,0,30,h);g.fillStyle='#574d3b';g.fillRect(x,0,1,h);for(let n=0;n<12;n++){g.strokeStyle=n%2?'rgba(42,39,25,.13)':'rgba(192,176,137,.12)';g.beginPath();let xx=x+3+r()*25;g.moveTo(xx,0);for(let y=8;y<=h;y+=8)g.lineTo(xx+Math.sin(y*.025+n)*.7,y);g.stroke()}}})});
  function buildGarden(r) {
    houseRoof();
    const batch = K.batch(), B = K.into(batch);
    const x0 = -300, x1 = 215, z0 = -560, z1 = -56; // (behind the kitchen; the back wall of the house is z = -56)
    r.wheelie={x:160,z:-190};r.waterButt={x:180,z:-102};
    B.box((x0+x1)/2,GY+2,(z0+z1)/2,x1-x0,4,z1-z0,mGrass(),{uv:110});
    B.box(-50,GY+1.7,-126,330,4,130,mSlab(),{uv:100}); // the patio by the back door
    // the back of the house: brick, the kitchen window and the back door from outside, Jack's window up above
    const openings=[[-140,-20,195,290],[80,160,GY-205,356],[156,226,-112,-14]],cuts=[...new Set([-300,420,...openings.flatMap(h=>h.slice(0,2))])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const x0=cuts[i],x1=cuts[i+1],holes=openings.filter(h=>h[0]<x1&&h[1]>x0).sort((a,b)=>a[2]-b[2]);let top=-196;
      const wall=(a,b)=>{if(b>a)B.panel((x0+x1)/2,(a+b)/2,-57,x1-x0,b-a,.8,mBrick(),{ry:180,uv:128})};
      for(const h of holes){wall(top,h[2]);top=Math.max(top,h[3])}wall(top,356);
    }

    B.box(300,-67,-58.5,70,80,2,M({c:'#789095',sh:28,sp:'#879a9b'}));
    for(const x of [263,337])B.box(x,-67,-60,5,88,5,mWhite);for(const y of [-109,-25])B.box(300,y,-60,70,4,5,mWhite);B.box(300,-69,-61,70,3,3,mWhite);B.box(300,-20,-63,82,5,10,M('#bbb5a5'));
    for(const x of [-138,-22,-80])B.box(x,242.5,-59,4,x===-80?87:95,3,mWhite);
    for(const y of [197,288])B.box(-80,y,-59,112,4,3,mWhite);
    B.plane(-80,242.5,-61.2,112,87,M({c:'#c8d8f0',o:.12,tr:true,sh:80,sp:'#7c8f99'}),{ry:180});
    B.box(76.8, GY - 102, -58.5, 5.6, 204, 3, mWhite); B.box(163.2, GY - 102, -58.5, 5.6, 204, 3, mWhite); B.box(120, GY - 206, -58.5, 92, 6, 3, mWhite); B.box(120, GY - 0.8, -58, 80, 1.6, 8, M('#9a9a92')); // trim clears the shared interior reveals
    B.plane(191,-63,-57.5,70,98,M({c:'#c8d8f0',o:.12,tr:true,sh:80,sp:'#7c8f99'}),{ry:180}); // the real bedroom remains visible behind the glass

    // fences down both sides and across the end, the gate at the end, next door's roofs over the top
    const fm = mFence();
    // One post per corner; panel ends butt against post shoulders. The old
    // full-length panels and two offset corner posts shared exposed faces.
    const left = x0 + 4, right = x1 - 4, rear = z0 + 4, front = z1 - 4;
    const postM = M({ c: '#fff', map: tex('pineDark') }), zs = [rear, -390, -224, front];
    const post = (x,z) => { B.box(x,GY-94,z,8,188,8,postM,{uv:60}); B.rbox(x,GY-189,z,9.2,2,9.2,.5,postM,{uv:60}); };
    for (const x of [left, right]) {
      for (const z of zs) post(x,z);
      for (let i=1;i<zs.length;i++) B.box(x===left?x0+1.5:x1-1.5,GY-90,(zs[i-1]+zs[i])/2,3,180,zs[i]-zs[i-1]-8,fm,{uv:100});
    }
    const xs = [left, left+(right-left)/3, left+2*(right-left)/3, right];
    for (let i=1;i<xs.length-1;i++) post(xs[i],rear);
    for (let i=1;i<xs.length;i++) B.box((xs[i-1]+xs[i])/2,GY-90,z0+1.5,xs[i]-xs[i-1]-8,180,3,fm,{uv:100});
    // the shed (Dad's), the whirly washing line, the wheelie bin, a flower bed, the water butt, a tree
    const sh=B.at(-212,GY,-462),shw=shedWood();
    sh.box(0,-95,0,150,190,120,shw,{uv:60});
    const gable=new T.Shape();gable.moveTo(-75,-190);gable.lineTo(0,-221);gable.lineTo(75,-190);gable.closePath();sh.geo(new T.ExtrudeGeometry(gable,{depth:120,bevelEnabled:false}),0,0,-60,shw,{uv:60});
    const roof=new T.Shape();roof.moveTo(-81,-190);roof.lineTo(0,-224);roof.lineTo(81,-190);roof.lineTo(81,-184);roof.lineTo(0,-218);roof.lineTo(-81,-184);roof.closePath();sh.geo(new T.ExtrudeGeometry(roof,{depth:132,bevelEnabled:false}),0,0,-66,M({c:'#3d4140',sh:5}));
    sh.box(30, -90, 61, 50, 160, 3, shw, { uv: 60 }); sh.box(30, -90, 63, 44, 150, 1, shedWood()); sh.box(50, -90, 64, 3, 10, 2, mMetal);
    sh.box(-40,-120,60.5,40,36,.5,M({c:'#6c7f84',sh:75,sp:'#bac8cc'}));for(const x of [-61,-19])sh.box(x,-120,61.5,2,40,2,mWhite);for(const y of [-139,-101])sh.box(-40,y,61.5,40,2,2,mWhite);sh.box(-40,-120,61.8,1.5,36,1,mWhite);
    for(const y of [-145,-40]){sh.box(7,y,63,9,2,1,mMetal);sh.cyl(3,y,63,1,1,5,10,mMetal)}sh.rbox(50,-84,65.4,4,5,2,.5,mMetal);sh.cyl(50,-83.5,66.5,.35,.35,.3,8,M('#282a2b'),{rx:90});
    sh.shadow(0, 0, 0, 170, 140, 0.6, { sq: true });
    const wl=B.at(80,GY,-280);wl.cyl(0,-100,0,2,2.4,200,10,mMetal);wl.cyl(0,-201,0,3,3,5,12,mMetal);
    for(let i=0;i<4;i++)wl.geo(new T.TorusGeometry(40+i*28,.5,4,32),0,-196+i*4,0,M('#ddd'),{rx:90});
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2,a=new T.Vector3(0,-202,0),b=new T.Vector3(Math.cos(angle)*126,-183.71,Math.sin(angle)*126),d=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),arm=new T.CylinderGeometry(.8,.8,d.length(),8);
      arm.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));wl.geo(arm,mid.x,mid.y,mid.z,mMetal);
    }
    // Peg actual garments to the third line; the old painted blocks floated
    // below the wires. Fabric has a closed edge and a gently uneven drape.
    [['#ece9de',46,65,'sheet'],['#31588e',26,30,'shorts'],['#cb8b97',34,40,'shirt'],['#c6c6bb',30,45,'sheet']].forEach(([colour,w,h,kind],i)=>{
      const angle=i*Math.PI/2+.4,peg=kind==='shirt'?8:w/2-5,radius=Math.sqrt(96*96-peg*peg),C=wl.at(Math.cos(angle)*radius,-188,Math.sin(angle)*radius,(-angle-Math.PI/2)/D2R),fabric=M({c:colour,sh:3,sp:'#050505'});
      if(kind==='sheet'){
        const cloth=new T.PlaneGeometry(w,h,8,10),a=cloth.attributes.position;
        for(let j=0;j<a.count;j++){const down=a.getY(j)+h/2;a.setY(j,down);a.setZ(j,Math.sin(a.getX(j)*.4+i)*.7*Math.min(1,down/8)+Math.sin(down*.13)*.35)}cloth.computeVertexNormals();C.geo(K.thicken(cloth,.55),0,0,0,fabric);
        C.box(0,h-.7,-.25,w,1,.7,M({c:colour,sh:2}));
      }else{
        const points=kind==='shirt'?[[-5,0],[-10,1],[-17,9],[-12,14],[-8,10],[-8,40],[8,40],[8,10],[12,14],[17,9],[10,1],[5,0],[3,3],[-3,3]]:[[-13,0],[13,0],[12,29],[2,29],[0,19],[-2,29],[-12,29]];
        const shape=new T.Shape();points.forEach(([x,y],j)=>j?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();C.geo(new T.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:false}),0,0,-.3,fabric);
        if(kind==='shirt'){C.box(0,20,.45,.65,32,.25,M('#b77582'));for(let y=7;y<36;y+=7)C.ball(0,y,.8,.55,.55,.3,M('#e1d8cf'),6)}else C.box(0,1.5,.45,25,2,.3,M('#243d63'));
      }
      for(const x of [-peg,peg]){C.rbox(x,.5,0,1.3,4,1.4,.3,M('#b69a68'));C.cyl(x,.3,.8,.45,.45,.25,8,mMetal,{rx:90})}
    });
    wl.shadow(0, 0, 0, 40, 40, 0.5);
    const wb=B.at(r.wheelie.x,GY,r.wheelie.z),green=M({c:'#2a5a2a',sh:20,sp:'#333'});
    wb.rbox(0,-61,0,58,98,70,4,green);wb.rbox(0,-112,4,60,6,74,2,M('#245024'));
    for(const x of [-22,22]){wb.cyl(x,-12,-28,12,12,7,24,M('#202224'),{rz:90});wb.cyl(x+(x<0?-3.6:3.6),-12,-28,4,4,.4,14,M('#777b7c'),{rz:90});wb.box(x,-6,26,4,12,5,green)}
    wb.cyl(0,-12,-28,1.2,1.2,49,12,mMetal,{rz:90});for(const x of [-18,18]){wb.box(x,-60,35.2,1.2,74,.8,M('#245024'));wb.box(x,-109,-37,3,8,7,green)}wb.cyl(0,-112,-40,1.4,1.4,39,12,green,{rz:90});wb.shadow(0,0,0,70,84,.6,{sq:true});
    const fb=B.at(-230,GY,-270);
    // Soil meets the inner faces; end boards fit BETWEEN the side boards.
    fb.box(0,-4,0,106,8,56,M('#3a2a1a'));
    for(const x of [-55,55])fb.box(x,-5,0,4,10,64,M('#725437'));
    for(const z of [-30,30])fb.box(0,-5,z,106,10,4,M('#725437'));
    for(let i=0;i<12;i++){const x=-46+i*8.3,z=-16+(i%3)*16,c=['#cf4e5d','#e2bd45','#c97ba0','#e4dfd0','#d78441'][i%5],petal=M(c);fb.cyl(x,-15,z,.35,.35,14,6,M('#376f39'));for(let k=0;k<5;k++){const a=k*Math.PI*2/5;fb.ball(x+Math.cos(a)*2.4,-22,z+Math.sin(a)*2.4,2.1,.7,1.4,petal,8,{ry:-a/D2R})}fb.ball(x,-22.5,z,1.1,.7,1.1,M('#d0a542'),8);for(const s of [-1,1])fb.ball(x+s*1.9,-15,z,2.4,.3,1,M('#4c8249'),8,{rz:s*25})}
    const wbt=B.at(r.waterButt.x,GY,r.waterButt.z);wbt.cyl(0,-45,0,26,24,90,28,M({c:'#315d39',sh:15}));wbt.cyl(0,-91,0,27,27,2,28,M('#24482c'));
    for(const y of [-20,-68])wbt.geo(new T.TorusGeometry(y===-20?24.5:25.5,.65,6,40),0,y,0,M('#284b30'),{rx:90});wbt.cyl(0,-14,25.5,1.4,1.4,6,12,M('#292d2e'),{rx:90});wbt.box(0,-17,29,7,1.3,2,M('#292d2e'));wbt.shadow(0,0,0,58,58,.5);
    tree(B,145,-500,250,58); tree(B, -40, -540, 240, 55);
    B.box(-50,GY-1,-66,330,2,2,M('#6a6a62')); // grounded edging, not a floating bar
    batch.build(r.group);
    H.spot('hs.shed', { label: "Dad's shed", act: sayLines('hs.shed', "Dad's shed", ['Dad\'s shed. Padlocked. Inside: the lawnmower, 200 jam jars of screws, and a radio tuned to the cricket.', 'Dad goes in the shed "to sort it out". He has been sorting it out since 1994.']) });pickBox(r,'hs.shed',-212,GY-95,-462,150,190,120);
    H.spot('hs.wheelie', { label: 'The wheelie bin', act: sayLines('hs.wheelie', 'The wheelie bin', ['Bin day is Tuesday. Dad wheels it out at 6am like it\'s a race.', 'It smells. It always smells. Don\'t open it.']) });pickBox(r,'hs.wheelie',r.wheelie.x,GY-55,r.wheelie.z,60,116,82);
    H.spot('hs.washline', { label: 'The washing line', act: sayLines('hs.washline', 'The washing line', ['The whirly washing line. Mom\'s sheets, Dad\'s work shirts, and my PE kit, flapping about for the whole street to see.', 'If you spin it fast enough the pegs fly off. Don\'t.']) }); pickBox(r, 'hs.washline', 80, GY - 150, -280, 190, 110, 190);
    H.spot('hs.flowers', { label: "Mom's flower bed", act: sayLines('hs.flowers', "Mom's flower bed", ['Mom\'s flowers. Do NOT kick the football near Mom\'s flowers. (I have kicked the football into Mom\'s flowers.)']) });pickBox(r,'hs.flowers',-230,GY-14,-270,114,28,64);
    H.spot('hs.butt', { label: 'The water butt', act: sayLines('hs.butt', 'The water butt', ['The water butt. Full of rainwater and one very confused frog.']) });pickBox(r,'hs.butt',r.waterButt.x,GY-45,r.waterButt.z,56,94,60);
    H.spot('hs.jackwin', { label: 'My window (from outside)', act: () => say("My window", 'That\'s my room up there. You can see the posters. {mate1} throws stones at it when my Mom won\'t let {mate1.him} ring the bell.') }); pickBox(r, 'hs.jackwin', 191, -63, -58, 70, 98, 4);
    H.walkRect('G', x0 + 6, z0 + 6, x1 - 6, z1 - 2, { room: 'garden' }); H.walkRect('G', 84, -60, 156, -50, { door: 'back', room: 'garden' });
    H.block('G',-300,-64,80,-48);H.block('G',160,-64,420,-48); // solid rear wall; the back-door corridor stays open
    H.block('G',-289,-524,-135,-400);H.block('G',129,-232,191,-147);
    H.block('G',-287,-302,-173,-238);H.block('G',152,-130,208,-70);H.block('G',77,-283,83,-277);H.block('G',134,-511,156,-489);H.block('G',-51,-551,-29,-529);
    H.support('garden',-215,-191,115,-61,GY-.3);H.support('garden',129,-223,191,-149,GY-115);
  }
  function buildDrive(r) {
    houseRoof();
    const batch = K.batch(), B = K.into(batch);
    // (in front of the hall's front door; the pavement starts at z = FZ). Tarmac: the hardstanding by the door
    // (x 120..248), the path (248..332) and the car's drive (332..620, through the wide gateway).
    B.box(370,GY+2,(700+FZ)/2,500,4,FZ-700,mTarmac(),{uv:120});
    // The turf bed fits the real plot. The mowable inset sits .6 cm above it.
    B.box(-110,GY+2.6,(700+FZ-15)/2,460,4,FZ-715,mGrass(),{uv:110});
    B.box(675,GY+2,(700+FZ)/2,110,4,FZ-700,mGrass(),{uv:110});
    B.box(300,GY+1.6,FZ+50,1800,4,100,mSlab(),{uv:100});
    B.box(300,GY+3,FZ+350,1800,4,500,mTarmac(),{uv:120});
    B.box(300,GY-1,FZ+98,1800,6,9,M('#9a9a92'));
    for(let x=-520;x<1200;x+=260)B.box(x,GY+.87,FZ+350,130,.2,8,M('#d2cdb6'));
    for(const x of [120,-340])B.box(x,GY-1,(685+FZ)/2,3,3,FZ-715,M('#8c8679'));
    // A clear pedestrian route beside the parked car.
    B.box(290,GY-.45,(752+FZ)/2,84,1,FZ-752,mSlab(),{uv:100});
    for(const x of [246.5,333.5])B.box(x,GY-.7,(752+FZ)/2,3,1.5,FZ-752,M('#8c8679')); // a brick-on-edge border each side
    // the front of the house: brick, the bay window, the front door from outside, the number
    const holes=[[-170,50,150,300],[260,340,GY-205,GY]],cuts=[-300,-170,50,260,340,420];
    for(let i=0;i<cuts.length-1;i++){const a=cuts[i],b=cuts[i+1];let y=-196;
      const wall=(top,bottom)=>{if(bottom>top)B.box((a+b)/2,(top+bottom)/2,702,b-a,bottom-top,2,mBrick(),{uv:128})};
      for(const h of holes.filter(h=>h[0]<b&&h[1]>a).sort((a,b)=>a[2]-b[2])){wall(y,h[2]);y=h[3]}wall(y,GY);
    }
    // Recessed upstairs glazing is framed on all sides, with proper sill depth.
    const upperGlass=M({c:'#fff',sh:42,sp:'#809294',map:K.tex('hs.upperglass',128,128,(g,w,h)=>{const c=g.createLinearGradient(0,0,30,h);c.addColorStop(0,'#71828a');c.addColorStop(.5,'#4c626a');c.addColorStop(1,'#344d59');g.fillStyle=c;g.fillRect(0,0,w,h);g.fillStyle='rgba(208,199,172,.2)';g.fillRect(2,0,15,h);g.fillRect(w-17,0,15,h);g.fillStyle='rgba(215,227,221,.1)';g.beginPath();g.moveTo(0,24);g.lineTo(w,65);g.lineTo(w,75);g.lineTo(0,34);g.fill()},{clamp:true})});
    for(const [x,w]of [[-175,108],[55,108],[330,72]]){B.box(x,-57,703.3,w+10,138,2,M('#383c38'));B.box(x,-57,705,w,128,1.2,upperGlass);
      for(const side of [-1,1])B.box(x+side*(w/2+2.5),-57,706,5,138,6,mWhite);
      for(const y of [-123,9])B.box(x,y,706,w,5,6,mWhite);B.box(x,-57,706,4,128,4,mWhite);B.box(x,15,708,w+15,6,12,M('#b8b4a5'));
    }
    // Open frame, not a solid white panel hiding the lounge window.
    for(const x of [-174,54])B.box(x,225,704.3,8,160,8,mWhite);
    for(const y of [147.2,302.5])B.box(-60,y,704.3,220,5,8,mWhite); // no coplanar underside with the lounge's frame
    B.plane(-60,225,708.5,220,150,M({c:'#1a2a3a',o:.28,tr:true,sh:100,sp:'#fff'}));
    // a deep stone sill under the lounge window and a concrete lintel over it, both proud of the brick
    B.rbox(-60,308.5,709.5,240,6,15,0.8,M('#b8b4a5'));B.box(-60,143.6,704.2,232,7,2.4,M('#a59d8f'));
    B.box(256.8, GY - 102, 703, 5.6, 204, 3, mWhite); B.box(343.2, GY - 102, 703, 5.6, 204, 3, mWhite); B.box(300, GY - 206, 703, 92, 6, 3, mWhite);
    B.box(300, GY - 215, 704, 100, 14, 40, M('#e8e4dc')); B.box(300, GY - 222, 724, 100, 2, 2, M('#9a9a92')); // the porch roof
    B.plane(340, GY - 180, 702.6, 16, 20, M({ c: '#fff', map: K.tex('hs.numb', 64, 80, (g) => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 64, 80); A.text(g, '42', 32, 58, '48px ' + A.FONT, '#f0d080', 'center'); }) }));
    B.rbox(300, GY - 1, 730, 70, 2, 44, 0.7, { t: M({ c: '#fff', map: matTex() }), all: M('#8a6232') });
    // a black coach lantern on the wall beside the front door (the old free-standing post stood in front of the car boot)
    { const ln = B.at(354, GY - 176, 703), black = M({ c: '#1d1e1f', sh: 40, sp: '#444' }), lit = phase() === 'night' ? '#a08040' : '#000';
      ln.rbox(0, 0, 1.2, 7, 15, 2.4, 0.6, black); ln.cyl(0, -1, 6.6, 0.8, 0.8, 9, 8, black, { rx: 90 });
      ln.cyl(0, 9, 11.5, 6.2, 5, 16, 4, M({ c: '#f2e7c6', e: lit, o: 0.86, tr: true, sh: 80, sp: '#fff' }), { ry: 45 });
      ln.cyl(0, 0.2, 11.5, 1.4, 8.6, 4.4, 4, black, { ry: 45 }); ln.cyl(0, 17.6, 11.5, 5.4, 5.4, 1.8, 4, black, { ry: 45 }); ln.ball(0, -2.6, 11.5, 1.3, 1.3, 1.3, black, 8); ln.cyl(0, 20, 11.5, 0.5, 1.2, 3, 8, black);
      for (const [dx, dz] of [[-4.1, 0], [4.1, 0], [0, -4.1], [0, 4.1]]) ln.box(dx, 9, 11.5 + dz, 0.6, 16, 0.6, black, { ry: 45 }); }
    // Next door is a complete solid model in the shared neighbourhood.
    // a low front wall with a gate, the hedge, a lamp-post on the pavement
    // Openings: the pedestrian gate (x 248..332, on the path's line) and the wide gateway Dad drives through (356..620).
    const capM = M('#9a9a92');
    for (const [a, b] of [[-360, 224], [644, 730]]) { B.box((a + b) / 2, GY - 35, FZ - 5, b - a, 70, 20, mBrick(), { uv: 128 }); B.box((a + b) / 2, GY - 72, FZ - 5, b - a, 4, 24, capM); }
    for (const x of FRONT_PIERS) { B.box(x, GY - 40, FZ - 5, 24, 80, 24, mBrick(), { uv: 128 }); B.box(x, GY - 82, FZ - 5, 29, 4, 29, capM); B.box(x, GY - 86.5, FZ - 5, 18, 5, 18, capM); }
    // The pedestrian gate: a black steel leaf standing open against the inside of its pier (it squeaks).
    { const gt = B.at(FRONT_PIERS[1] - 10, GY, FZ - 18, -90), iron = M({ c: '#1f2122', sh: 40, sp: '#555' });
      for (const y of [-12, -46, -80]) gt.box(-40, y, 0, 78, 3, 3, iron);
      for (let x = -76; x <= -4; x += 9) gt.box(x, -46, 0, 1.8, 70, 1.8, iron);
      gt.box(-2, -46, 0, 3.4, 74, 3.4, iron); gt.box(-78, -46, 0, 3.4, 74, 3.4, iron); for (const y of [-20, -72]) gt.cyl(-.5, y, 0, 2, 2, 5, 8, iron);
      gt.box(-74, -52, 2.5, 3, 6, 2, M({ c: '#c8a040', sh: 70, sp: '#a08040' })); gt.shadow(-40, 0, 0, 84, 14, .35, { sq: true }); }
    const clippedHedge=M({c:'#fff',sh:2,sp:'#142316',map:K.tex('hs.hedge.leaves',128,128,(g,w,h)=>{const r=K.rnd(812);g.fillStyle='#3e5934';g.fillRect(0,0,w,h);for(let i=0;i<1900;i++){g.fillStyle=['#405a34','#48653a','#344e2d','#516d40'][(r()*4)|0];g.beginPath();g.ellipse(r()*w,r()*h,1.5+r(),.7+r()*.6,r()*Math.PI,0,Math.PI*2);g.fill()}})});
    B.rbox(-68,GY-42,FZ-36,554,84,30,8,clippedHedge,{uv:60});
    // The street lamp stands at the kerb, off to the side of the plot (not across the front of the house):
    // a tapered steel column on a base with its access door, a swan-neck arm and a sodium lantern over the road.
    const lp = B.at(LAMP.x, GY, LAMP.z), col = M({ c: '#4a4f4c', sh: 30, sp: '#3a3f3c' });
    lp.rbox(0, -24, 0, 20, 48, 20, 1.2, col); lp.box(0, -26, 10.2, 9, 26, 0.6, M('#3d423f')); lp.box(0, -26, 10.6, 1.4, 1.4, 0.6, M('#262826'));
    lp.lathe(0, 0, 0, [[0.05, -506], [4.2, -506], [4.6, -490], [5.6, -300], [6.6, -120], [7.6, -48], [8, -46], [0.05, -46]], 14, col);
    lp.geo(new T.TubeGeometry(new T.CubicBezierCurve3(new T.Vector3(0, -500, 0), new T.Vector3(0, -545, 0), new T.Vector3(0, -548, 30), new T.Vector3(0, -530, 62)), 18, 3, 10, false), 0, 0, 0, col);
    lp.rbox(0, -524, 72, 18, 10, 46, 3, M({ c: '#2f3332', sh: 30 }), { rx: -12 });
    r.streetGlow = M({ c: '#f3c98a', e: phase() === 'day' ? '#000' : '#ffb24a', sh: 60, sp: '#fff' }).clone();
    lp.rbox(0, -519, 73, 14, 3, 38, 1.2, r.streetGlow, { rx: -12 });
    lp.shadow(0, 0, 0, 30, 30, 0.45, { sq: true });
    // Dad's car: a burgundy family saloon (no real make), on the drive, nose to the street
    const frame = r.carFrame = Object.assign({}, CAR);
    const car = B.at(frame.x, frame.y, frame.z, 0, { sx: frame.s, sy: frame.s, sz: frame.s }), cm = M({ c: '#6a1a2a', sh: 35, sp: '#30282d' });
    const rubber=M({c:'#24262a',sh:9,sp:'#17191b'}),chrome=M({c:'#a3a6a8',sh:48,sp:'#8b9399'});
    const glassPrint=K.tex('hs.car.glass',128,128,(g,w,h)=>{const sky=g.createLinearGradient(0,0,w*.3,h);sky.addColorStop(0,'#526b79');sky.addColorStop(.52,'#3b5260');sky.addColorStop(1,'#263d4a');g.fillStyle=sky;g.fillRect(0,0,w,h);const sheen=g.createLinearGradient(0,0,w,h*.55);sheen.addColorStop(0,'rgba(180,199,207,0)');sheen.addColorStop(.38,'rgba(180,199,207,.13)');sheen.addColorStop(.52,'rgba(180,199,207,.04)');sheen.addColorStop(1,'rgba(180,199,207,0)');g.fillStyle=sheen;g.fillRect(0,0,w,h)},{clamp:true});
    const gl=M({c:'#fff',map:glassPrint,sh:58,sp:'#6c7c85'});
    car.rbox(0, -52, 40, 170, 46, 320, 9, cm);
    // Hollow boot: a solid floor, wheel-side walls and rear valance under a hinged lid.
    car.box(0,-20,-157,166,5,86,cm);
    car.box(0,-47,-199,166,52,4,cm);
    car.box(0,-47,-119,160,52,4,cm);
    for(const x of [-81,81])car.box(x,-48,-158,5,54,80,cm);
    car.box(0,-23,-157,154,1,76,M('#343235'));
    // Dad's tartan travel rug, spread over the boot carpet so whatever rides in the boot sits on something soft.
    { const g=new T.PlaneGeometry(146,70,24,10),pp=g.attributes.position;for(let i=0;i<pp.count;i++){const x=pp.getX(i),y=pp.getY(i);pp.setZ(i,.35+.35*Math.sin(x*.09+y*.05)*Math.cos(y*.13)+(Math.abs(y)>31?.6:0))}
      g.computeVertexNormals();const rug=K.tex('hs.car.rug',128,128,(c,w,h)=>{c.fillStyle='#5a2226';c.fillRect(0,0,w,h);c.fillStyle='rgba(28,52,40,.75)';for(let k=0;k<w;k+=32){c.fillRect(k+6,0,12,h);c.fillRect(0,k+6,w,12)}c.fillStyle='rgba(214,190,120,.55)';for(let k=0;k<w;k+=32){c.fillRect(k+24,0,2,h);c.fillRect(0,k+24,w,2)}A.grain(c,w,h,900,.06,77)});
      car.geo(K.thicken(g,.3),0,-23.55,-157,M({c:'#fff',map:rug,sh:2}),{rx:90}); }
    const hinge = new T.Group(); hinge.position.set(frame.x,frame.y-79*frame.s,frame.z-120*frame.s);
    hinge.scale.setScalar(frame.s); r.group.add(hinge);
    const lid=K.into(hinge);lid.rbox(0,0,-39,166,5,80,2,cm);
    lid.box(0,2.9,-39,150,1.2,68,M('#423137'));
    for(const x of [-53,53])lid.box(x,4,-20,3,4,34,M('#55333d'));
    lid.rbox(0,1,-78,16,3,2,1,M('#aaa9a0'));
    let bootOpen=false;try{bootOpen=localStorage.getItem('jhp_car_boot')==='1';}catch(e){}
    hinge.rotation.x=bootOpen?-1.25:0;
    r.carBoot={hinge,open:bootOpen,toggle(){
      this.open=!this.open;try{localStorage.setItem('jhp_car_boot',this.open?'1':'0');}catch(e){} const from=hinge.rotation.x,to=this.open?-1.25:0,start=performance.now();
      window.Sound?.play(this.open?'carboot':'carclose');
      H.anims.set('story-car-boot',now=>{const t=Math.min(1,(now-start)/650);hinge.rotation.x=from+(to-from)*t*t*(3-2*t);H.dirty();return t<1});
      H.dirty();
    }};
    car.rbox(0, -78, 20, 166, 10, 240, 4, cm); // the sills/belt line
    // Build in the house's y-down frame. Baking a negative scale into a batch
    // reverses triangle winding and makes the near windows disappear.
    { const cab = new T.BoxGeometry(150, 54, 210); const P2 = cab.attributes.position; for (let k = 0; k < P2.count; k++) if (P2.getY(k) < 0) { P2.setX(k, P2.getX(k) * 0.9); P2.setZ(k, P2.getZ(k) * 0.72 - 6); } cab.computeVertexNormals(); car.geo(cab, 0, -102, -14, gl); }
    car.rbox(0, -131, -20, 134, 5, 150, 2, cm); // the roof
    const trim = (top,bottom,material,width=1,overlap=0) => {const a=new T.Vector3(...top),b=new T.Vector3(...bottom),delta=b.clone().sub(a),centre=a.clone().add(b).multiplyScalar(.5);const geo=new T.BoxGeometry(width,delta.length()+overlap,width);geo.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize())));car.geo(geo,centre.x,centre.y,centre.z,material);};
    for(const side of [-1,1])for(const [top,bottom]of [[[side*67.5,-130,55.6],[side*75,-75,91]],[[side*67.5,-130,-95.6],[side*75,-75,-119]],[[side*67.5,-130,-14],[side*75,-75,-14]]]){trim(top,bottom,rubber,7,2);trim(top,bottom,cm,5.5,2)}
    for(const [y,z,width]of [[-129.5,55.9,134],[-75.3,91.2,150],[-129.5,-96,134],[-75.3,-119.3,150]])trim([-width/2,y,z],[width/2,y,z],rubber,2);
    // Wipers sit on the sloping windscreen, rear heater lines on the rear glass.
    for(const x of [-32,30]){trim([x-23,-81,87.7],[x+16,-88,83.2],rubber,1.2);trim([x-3,-77.5,90],[x-2,-84.5,85.6],rubber,1.5)}
    for(let y=-90;y>=-118;y-=7){const z=-119+(y+75)*(-23.4/55)-.35;trim([-64,y,z],[64,y,z],M('#786552'),.28)}
    [[-80,140],[80,140],[-80,-140],[80,-140]].forEach(([x,z])=>{
      const side=x>0?1:-1;car.cyl(x,-30,z,30,30,20,24,rubber,{rz:90});
      car.geo(new T.TorusGeometry(26.5,2.8,8,24),x+side*8.5,-30,z,rubber,{ry:90});
      car.cyl(x+side*10.5,-30,z,18,18,1.5,24,chrome,{rz:90});car.cyl(x+side*11.4,-30,z,6,6,1,12,M('#5b5c60'),{rz:90});
      for(let n=0;n<8;n++){const a=n*Math.PI/4;car.cyl(x+side*11.45,-30+Math.sin(a)*12.5,z+Math.cos(a)*12.5,1.9,1.9,.35,8,rubber,{rz:90})}
      for(let n=0;n<4;n++){const a=n*Math.PI/2;car.cyl(x+side*12,-30+Math.sin(a)*8.2,z+Math.cos(a)*8.2,1,1,.7,6,chrome,{rz:90})}
    });
    car.cyl(-85.5,-58,-103,4.8,4.8,.5,16,cm,{rz:90});car.box(-86,-58,-103,.3,.5,3,rubber);
    trim([-65,-82,-108],[-65,-121,-108],chrome,.7);car.cyl(-65,-82,-108,2,2,2,12,rubber);
    // Dark window seals, centre pillars, door trim and inset handles make the
    // opaque glazing read as glass, without a transparent empty cabin.
    for (const side of [-1,1]) {
      car.box(side*83.8,-77,-12,1.4,3,284,M('#232529'));
      car.box(side*85.1,-52,-12,.5,33,1.2,M('#431b24'));
      for (const z of [-64,48]) car.rbox(side*85.3,-68,z,1,3.2,13,1,M('#27272a'));
    }
    car.box(0, -40, 201, 170, 16, 6, M('#2a2a2a')); car.box(0, -40, -201, 170, 16, 6, M('#2a2a2a'));
    [-60, 60].forEach(x => { car.rbox(x,-62,203,28,14,2,1,rubber);car.box(x,-62,204.1,25,11,.6,M({c:'#dedbc5',sh:55,sp:'#b6b8b3'}));car.rbox(x,-62,-203,28,14,2,1,rubber);car.box(x,-62,-204.1,25,11,.6,M({c:'#a92b30',sh:46,sp:'#a35b5e'}));car.box(x+Math.sign(x)*8,-62,-204.5,7,10,.5,M('#c17728')); });
    car.box(0,-62,203.2,40,10,1,rubber);for(let y=-65;y<=-59;y+=2)car.box(0,y,203.8,38,.7,.5,chrome);
    for(const rear of [false,true]){const plate=M({c:'#fff',map:K.tex('hs.plate.'+(rear?'rear':'front'),256,64,g=>{g.fillStyle=rear?'#dbbc49':'#e8e7df';g.fillRect(0,0,256,64);A.text(g,'T42 JAK',128,47,'700 46px "Arial Narrow",Arial,sans-serif','#17191b','center')},{clamp:true})});car.box(0,-54,rear?-204:204,51,13,.8,{all:rubber,[rear?'b':'f']:plate});}
    for(const side of [-1,1]){car.box(side*76,-92,65,10,2.4,3,rubber);car.rbox(side*83,-94,65,8,8,17,1.5,rubber);car.box(side*87.1,-94,65,.4,5.8,13.8,M({c:'#8199a4',sh:80,sp:'#b7c9cf'}));}
    car.ball(0, -84, -96, 8, 6, 8, M('#c8a060'), 8); // inside the rear glazing, not poking through it
    car.shadow(0, 0, 0, 200, 430, 0.7, { sq: true });
    batch.build(r.group);
    H.spot('hs.carboot',{obj:r.carBoot.hinge,label:'Car boot',range:185,act:()=>r.carBoot.toggle()});
    H.spot('hs.car', { label: "Dad's car", act: sayLines('hs.car', "Dad's car", ['Dad\'s car. Burgundy. It has a cassette player and a tin of travel sweets that are all stuck together.', 'Dad washes it every Sunday "because it\'s a nice thing to do". It is never a nice thing to do.', 'There\'s a nodding dog on the parcel shelf. ' + 'My sister' + ' named it.']) }); pickBox(r,'hs.car',frame.x,GY-70*frame.s,frame.z+40*frame.s,170*frame.s,120*frame.s,300*frame.s);
    H.spot('hs.gate', { label: 'The front gate', act: sayLines('hs.gate', 'The front gate', ['The gate squeaks. Dad says he\'ll oil it. The gate has squeaked since 1991.', 'Beyond the gate: the street, the lamp-post, the postbox at the end. We don\'t go further than that today.']) }); pickBox(r, 'hs.gate', 290, GY - 40, FZ - 5, 84, 80, 20);
    H.spot('hs.lamppost', { label: 'The lamp-post', act: sayLines('hs.lamppost', 'The lamp-post', ['The lamp-post. Orange at night. Moths love it. We used it as the goal for about six years.']) }); pickBox(r, 'hs.lamppost', LAMP.x, GY - 260, LAMP.z, 18, 520, 18);
    H.spot('hs.bay', { label: 'The lounge window (from outside)', act: () => say('The bay window', 'The lounge. You can see the telly flickering through the nets. Mom twitches those nets at EVERYONE who walks past.') }); pickBox(r, 'hs.bay', -60, 225, 703, 236, 160, 6);
    // The front garden: the lawn, the path and the drive, round the car on both sides, out through either gate onto the
    // pavement (the far kerb is as far as we go today).
    H.walkRect('G', 124, 704, 716, FZ + 70, { room: 'drive' }); H.walkRect('G', -340, 704, 124, FZ - 52, { room: 'drive' }); H.walkRect('G', -340, FZ - 20, 124, FZ + 70, { room: 'drive' }); H.walkRect('G', 262, 660, 338, 710, { door: 'front', room: 'drive' });
    H.block('G',-300,694,260,708);H.block('G',340,694,420,708); // no walking through front windows
    H.block('G', frame.x - 91 * frame.s, frame.z - 205 * frame.s, frame.x + 91 * frame.s, frame.z + 205 * frame.s, H.solid ? { solid: false } : undefined); // Dad's car (both sides stay walkable)
    // Things: the car is solid around a hollow boot. With the lid up you can put things in on Dad's rug (the story's PC parts
    // ride there); a shut lid closes it. (The car used to be one solid block up to the roof: nothing could go in the boot.)
    if (H.solid) {
      const cs = frame.s, X = lx => frame.x + lx * cs, Z = lz => frame.z + lz * cs, kind = 'car';
      H.solid('G', X(-91), Z(-121), X(91), Z(205), GY - 133.5 * cs, GY + 1, { kind }); // bonnet, cabin, roof
      H.solid('G', X(-91), Z(-205), X(91), Z(-121), GY - 23 * cs, GY + 1, { kind }); // the boot floor and what's under it
      H.solid('G', X(-91), Z(-205), X(91), Z(-197), GY - 73 * cs, GY - 23 * cs, { kind, support: false }); // the rear valance
      for (const sx of [-1, 1]) H.solid('G', X(sx < 0 ? -91 : 78.5), Z(-205), X(sx < 0 ? -78.5 : 91), Z(-121), GY - 75 * cs, GY - 23 * cs, { kind, support: false }); // the wheel-arch sides
      H.solid('G', X(-79), Z(-197), X(79), Z(-121), GY - 79 * cs, GY - 23 * cs, { kind, support: false, when: () => !r.carBoot.open }); // the shut lid
    }
    H.block('G', -360, FZ - 52, 224, FZ + 5); H.block('G', 644, FZ - 15, 740, FZ + 5); // the front wall, with the hedge behind it
    for (const x of FRONT_PIERS) H.block('G', x - 12, FZ - 17, x + 12, FZ + 7);
    H.block('G', FRONT_PIERS[1] - 12, FZ - 100, FRONT_PIERS[1] - 6, FZ - 17); // the open gate leaf
    H.block('G', 716, 704, 740, FZ - 15); // next door's hedge
    H.support('drive',frame.x-56*frame.s,frame.z-85*frame.s,frame.x+56*frame.s,frame.z+45*frame.s,GY-133.5*frame.s); H.support('drive', 265, 708, 335, 752, GY - 2);
  }

  // ================================================================ the rooms, their lights, their views
  const rearGlass=[[-140,195,-66,-20,290,-54],[95,163,-60,145,233,-54]],bedroomGlass=[[156,-112,-60,226,-14,-54]],bayGlass=[[-170,150,696,50,300,710]],frontGlass=[[285,167,698,315,213,706]];
  const ROOMDEF = {
    landing: { name: 'The landing', title: 'THE LANDING', lvl: 'U', area: [[250, 130, 410, 250], [250, 250, 330, 700], [330, 250, 410, 700]], bx0: 252, bx1: 408, bz0: 132, bz1: 698, build: buildLanding,
      lights: () => [{ x: 300, y: -150, z: 400, c: '#fff0d8', i: lit('landing') ? 0.9 : 0, d: 520 }, { x: 390, y: -10, z: 440, c: phase() === 'day' ? '#e8f0ff' : '#5a6a9a', i: phase() === 'day' ? 1.3 : 0.25, d: 560 }, { x: 300, y: -60, z: 180, c: '#f0ece0', i: phase() === 'day' ? 0.4 : 0.1, d: 320 }],
      amb: () => interiorAmb('landing', .68),
      stations: [{ id: 'top', n: 'Top of the stairs', pose: () => look('U', 300, 175, 370, 220, 520, 158) }, { id: 'doors', n: 'Landing', pose: () => look('U', 310, 640, 250, -40, 420, 158) }] },
    hall: { name: 'The hall', title: 'THE HALL', lvl: 'G', area: [[205, 60, 410, 250], [205, 250, 330, 600], [205, 600, 410, 700], [330, 440, 410, 600]], bx0: 207, bx1: 408, bz0: 62, bz1: 698, build: buildHall, windowViews:[{room:'drive',bounds:frontGlass}],
      lights: () => { const day = phase() === 'day'; return [{ x: 300, y: 130, z: 200, c: '#fff0d8', i: lit('hall') ? 1.0 : 0, d: 520 }, { x: 300, y: 130, z: 560, c: '#fff0d8', i: lit('hall') ? 0.8 : 0, d: 420 }, { x: 300, y: 200, z: 690, c: day ? '#dfe8ff' : '#3a4a7a', i: day ? 1.3 : 0.2, d: 520 }, { x: 390, y: 180, z: 440, c: day ? '#e8f0ff' : '#5a6a9a', i: day ? 1.0 : 0.2, d: 460 }, { x: 260, y: 220, z: 150, c: day ? '#f0f0f0' : '#333', i: day ? 0.5 : 0.1, d: 300 }]; },
      amb: () => interiorAmb('hall', .68),
      stations: [{ id: 'stairs', n: 'Bottom of the stairs', pose: () => look('G', 268, 660, 370, 230, 380, 158) }, { id: 'back', n: 'The hall', pose: () => look('G', 300, 640, 260, 260, 150, 158) }] },
    cupboard: { name: 'Under the stairs', title: 'UNDER THE STAIRS', lvl: 'G', area: [[332, 252, 408, 440]], bx0: 334, bx1: 406, bz0: 254, bz1: 438, eye: 112, ceilingAt:(x,z)=>UY+.8*(z-250)+23.5, build: buildCupboard, noMap: false,
      lights: () => [{ x: 370, y: 150, z: 290, c: '#ffe4b8', i: lit('cupboard') ? 1.1 : 0, d: 260 }, { x: 336, y: 290, z: 400, c: '#e8e0d0', i: H.DOORS.cupboard && H.DOORS.cupboard.open ? (phase() === 'day' ? .65 : .25) : 0, d: 220 }],
      amb: () => ({ sky: lit('cupboard') ? '#b2a18b' : '#7d8190', gnd: '#5b5145', i: lit('cupboard') ? .46 : (H.DOORS.cupboard && H.DOORS.cupboard.open ? .3 : .22) }),
      stations: [{ id: 'snes', n: 'The old console', pose: () => look('G', 362, 400, 358, GY - 38, 330, 112) }] },
    lounge: { name: 'The lounge', title: 'THE LOUNGE', lvl: 'G', area: [[-280, 305, 195, 700]], bx0: -278, bx1: 193, bz0: 307, bz1: 698, build: buildLounge, windowViews:[{room:'drive',bounds:bayGlass}],
      lights: () => { const L = [{ x: -60, y: GC + 30, z: 500, c: '#fff0d0', i: lit('lounge') ? 0.95 : 0, d: 700 }, { x: -60, y: 220, z: 690, c: phase() === 'day' ? '#e8f0ff' : '#4a5a8a', i: phase() === 'day' ? 1.1 : 0.2, d: 650 }]; const lamp = lightsOn.loungeLamp == null ? phase() !== 'day' : lightsOn.loungeLamp; if (lamp) L.push({ x: 160, y: GY - 160, z: 360, c: '#ffd8a0', i: 0.8, d: 380 }); if (HouseRooms.rooms.lounge.fireOn) L.push({ x: -240, y: GY - 30, z: 500, c: '#ff8a40', i: 0.9, d: 300 }); if (window.HouseTelly && HouseTelly.on) L.push({ x: LT.x, y: GY - 80, z: LT.z + 60, c: '#8aa8ff', i: 0.55, d: 320 }); return L; },
      amb: () => interiorAmb('lounge', .6),
      sun: () => phase() === 'day' ? { x: -60, y: -100, z: 1200, tx: -60, ty: GY, tz: 400, c: '#fff4e0', i: 0.35 } : null,
      stations: [{ id: 'telly', n: 'The telly', pose: () => look('G', -50, 640, LT.x, GY - 70, LT.z, 150) }, { id: 'fire', n: 'The fireplace', pose: () => look('G', 100, 560, -270, GY - 90, 500, 158) }, { id: 'window', n: 'The window', pose: () => look('G', -40, 420, -60, 230, 700, 158) }] },
    garden: { name: 'The back garden', title: 'THE BACK GARDEN', lvl: 'G', area: [[-300, -560, 215, -56]], bx0: -298, bx1: 213, bz0: -558, bz1: -58, build: buildGarden, outside: true, windowViews:[{room:'bedroom',bounds:bedroomGlass},{room:'kitchen',bounds:rearGlass}],
      lights: () => [{ x: 120, y: GY - 230, z: -70, c: '#ffe0a0', i: phase() === 'day' ? 0 : 0.7, d: 500 }],
      amb: () => outdoorAmb('#78855a'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: -900, tx: 0, ty: GY, tz: -300, c: '#8090c8', i: 0.15 } : { x: 400, y: -900, z: -600, tx: 0, ty: GY, tz: -300, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'patio', n: 'The garden', pose: () => look('G', 40, -90, -80, GY - 80, -420, 158) }, { id: 'shed', n: 'The shed', pose: () => look('G', -40, -300, -230, GY - 100, -470, 158) }, { id: 'house', n: 'The house', pose: () => look('G', 20, -360, 80, 60, -56, 158) }] },
    drive: { name: 'The front', title: 'OUT THE FRONT', lvl: 'G', area: [[-340, 700, 720, FZ + 72]], bx0: -338, bx1: 718, bz0: 702, bz1: FZ + 70, build: buildDrive, outside: true, windowViews:[{room:'lounge',bounds:bayGlass},{room:'hall',bounds:frontGlass}],
      lights: () => [{ x: 360, y: GY - 124, z: 730, c: '#ffe0a0', i: phase() === 'day' ? 0 : 0.7, d: 420 }, { x: LAMP.x - 100, y: GY - 430, z: LAMP.z, c: '#ffb860', i: phase() === 'day' ? 0 : 1.2, d: 900 }],
      amb: () => outdoorAmb('#797b70'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: 1700, tx: 300, ty: GY, tz: 900, c: '#8090c8', i: 0.15 } : { x: -400, y: -900, z: 1500, tx: 300, ty: GY, tz: 900, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'car', n: "Dad's car", pose: () => look('G', 290, FZ - 50, CAR.x, GY - 70, CAR.z, 158) }, { id: 'house', n: 'The house', pose: () => look('G', 180, FZ - 70, 150, 120, 700, 158) }, { id: 'street', n: 'The street', pose: () => look('G', 200, 760, 240, GY - 120, FZ + 300, 158) }] },
    kitchen: { name: 'The kitchen', title: 'THE KITCHEN', lvl: 'G', area: [[-280, -56, 195, 295]], bx0: -278, bx1: 193, bz0: -54, bz1: 293, build: buildKitchen, windowViews:[{room:'garden',bounds:rearGlass}],
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
        const build=d.build;d.build=room=>{build(room);const positions={landing:[250.6,UY-118,244,90],hall:[205.6,GY-118,244,90],lounge:[194.4,GY-118,576,-90],kitchen:[194.4,GY-118,246,-90]};if(positions[id])ceilingSwitch(room,id,...positions[id])};
        if (r) { Object.assign(r, d); r.built = false; } else r = H.room(id, d); // (the landing was a stub, so the bedroom door knew where it went)
        this.rooms[id] = r;
      }
      // the links: stairs (always open) between the landing and the hall; doors to the lounge, the kitchen, the cupboard
      H.door('stairs', { rooms: ['landing', 'hall'], always: true, open: true });
      // Visual treads stay solid; the body follows one continuous ramp.
      H.stairs({ x0: 333, z0: 200, x1: 410, z1: 650, m0: 250, m1: 600, y: (x, z) => UY + .8 * Math.max(0, Math.min(350, z - 250)) });
      // the bedroom door's link to the landing (if the landing was made after it)
      if (!H.ROOMS.landing.links.includes('bedroom')) H.ROOMS.landing.links.push('bedroom');
      this.ready = true;
      // the doors downstairs (built with the hall; their links are made here)
      return Promise.resolve().then(() => {
        H.buildRoom(H.ROOMS.hall);
        // the lounge and kitchen doors are built into the hall's west wall
        const hall = H.ROOMS.hall, fb = K.batch(), F = K.into(fb);
        // These leaves open into their rooms. Across the narrow hall an 80 cm
        // open leaf left only a few centimetres of usable body clearance.
        const kd = doorway(hall, F, 'kitdoor', 'w', 205, 150, 230, GY, { hingeNormal: -12.5 });
        const ld = doorway(hall, F, 'loudoor', 'w', 205, 480, 560, GY, { hingeNormal: -12.5 });
        fb.build(hall.group);
        H.door('kitchen', { rooms: ['hall', 'kitchen'], pivot: kd, swing: 95, dir: 1 }); H.door('lounge', { rooms: ['hall', 'lounge'], pivot: ld, swing: 95, dir: 1 });
        H.walkRect('G', 193, 154, 209, 226, { door: 'kitchen', room: 'hall' }); H.walkRect('G', 193, 484, 209, 556, { door: 'lounge', room: 'hall' });
        H.spot('hs.kitdoor', { label: () => H.DOORS.kitchen.open ? 'Shut the kitchen door' : 'The kitchen', obj: kd, act: () => H.setDoor('kitchen', !H.DOORS.kitchen.open) });
        H.spot('hs.loudoor', { label: () => H.DOORS.lounge.open ? 'Shut the lounge door' : 'The lounge', obj: ld, act: () => H.setDoor('lounge', !H.DOORS.lounge.open) });
        
        // outside: the back door (kitchen -> garden) and the front door (hall -> drive). The doors are the painted ones already there: they swing
        const kit = H.ROOMS.kitchen, kb = K.batch(), KB = K.into(kb);
        const bd = doorway(kit, KB, 'backdoor', 'n', -56, 80, 160, GY, { inside: true, noframe: true, glass: true, mat: M({ c: '#f2f0ea', sh: 40, sp: '#444' }), deco: (Dd, g2) => { Dd.plane(g2.sgnA * g2.dw / 2, g2.top + 50, -1.9, 50, 70, M({ c: '#c8e0f0', o: 0.4, tr: true, sh: 100, sp: '#fff' }), { ry: 180 }); Dd.plane(g2.sgnA * g2.dw / 2, g2.top + 50, 1.9, 50, 70, M({ c: '#c8e0f0', o: 0.4, tr: true, sh: 100, sp: '#fff' })); } });
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
  let lastPhase = phase(),clockNext=0,clockDate=null;
  const clockDisplays=[['lounge','vcrTex','vcrSet'],['kitchen','mwTex','mwSet']];
  H.ambient.add(now => {
    const ph = phase();
    if (ph !== lastPhase) {
      lastPhase = ph;
      for (const t of phaseTextures) t.userData.repaintPhase();
      const drive = HouseRooms.rooms.drive;
      if (drive && drive.streetGlow) drive.streetGlow.emissive.set(ph === 'day' ? '#000' : '#ffb24a');
      const cupboard = HouseRooms.rooms.cupboard; if (cupboard) cupLight(cupboard);
      standardLampLook(HouseRooms.rooms.lounge);
      switchLook();
      H.relight();
    }
    const blink = Math.floor(now / 600) % 2 === 0;
    if(!clockDate||now>=clockNext){clockNext=now+1000;clockDate=window.OwnerTools?.now()||new Date()}
    for (const [rid, key, set] of clockDisplays) {
      const r = HouseRooms.rooms[rid]; if (!r || !r[key] || !r.group.visible) continue;
      const d = clockDate, txt = (window.HouseLife && HouseLife[set] && HouseLife[set]()) ? (d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')) : (blink ? '12:00' : '');
      if (r['_' + key] === txt) continue; r['_' + key] = txt;
      const g = r[key].userData.g, w = r[key].image.width, hh = r[key].image.height; g.fillStyle = '#081008'; g.fillRect(0, 0, w, hh); g.font = '700 ' + (hh - 6) + 'px "Courier New",monospace'; g.textAlign = 'center'; g.fillStyle = rid === 'lounge' ? '#3affb0' : '#7affe0'; g.shadowColor = g.fillStyle; g.shadowBlur = 6; g.fillText(txt, w / 2, hh - 6); g.shadowBlur = 0; r[key].needsUpdate = true; H.dirty();
    }
    const lo = HouseRooms.rooms.lounge; if(lo&&!lo.fireOn&&lo._flamesLit){for(const f of lo.flames)f.material.opacity=0;lo._flamesLit=false;H.dirty()}
    if (lo && lo.flames && lo.group.visible && lo._renderDrawn!==false && lo.fireOn) {lo._flamesLit=true;lo.flames.forEach((f, i) => { f.material.opacity = lo.fireOn ? 0.45 + Math.sin(now / 120 + i * 1.7) * 0.25 : 0; f.scale.y = 1 + Math.sin(now / 90 + i) * 0.15; });}
    return !!(lo&&lo.flames&&lo.group.visible&&lo._renderDrawn!==false&&lo.fireOn);
  });
})();

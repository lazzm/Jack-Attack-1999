/* hs-house: THE REST OF JACK'S HOUSE (loaded the first time the bedroom door opens): the landing, the stairs, the hall,
 * the cupboard under the stairs (with the old SNES on a box: Agent L's games, through js/rm-tv.js), the lounge (the family
 * telly with TELLY-TEXT and the video recorder: js/hs-telly.js; the landline: js/hs-life.js), and the kitchen (the fridge
 * door, the biscuit tin, the microwave flashing 12:00). Same kit, same look as the bedroom (js/rm-room.js).
 *
 * The plan (cm, y down). Upstairs floor y 73, ceiling y -185; downstairs floor y 353, ceiling y 95.
 *   upstairs:   Jack's room x -280..240, z -56..250 | the landing x 250..410, z 130..250 and x 250..330, z 250..700
 *   the stairs: x 330..410, from the landing at z 250 (y 73) down to the hall at z 600 (y 353)
 *   downstairs: the kitchen x -280..195, z -176..295 | the lounge x -280..195, z 305..700 | the hall x 205..410 (round the stairs)
 *               the cupboard under the stairs x 332..408, z 252..548 (low storage at the far end)
 * For other packs: spot ids here start 'hs.' (Room.addClue works on them too); finds can hide in 'hs.cup.box',
 * 'hs.cup.bag', 'hs.cup.shelf' (the cupboard), 'hs.sofa', 'hs.kit.drawer' via RoomCat FINDS (spot: id). The SNES spot is
 * 'snes': it opens RoomTV.open('snes', ...) once rm-tv.js knows the console (RoomCat.CONSOLES.snes + RoomTV.LOOK.snes). */
(function () {
  'use strict';
  // Before JackOS loads, use this pack's build token for its own lazy dependencies.
  const PACK_STAMP = new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v');
  const H = window.House; if (!H || !H.ok || window.HouseRooms) return;
  const K = H.K, T = H.T, A = window.HouseArt, M = K.mat, D2R = Math.PI / 180;
  const R = window.Room, CAT = window.RoomCat;
  const UY = 73, UC = -185, GY = 353, GC = 95;
  // PV12: the cupboard uses the whole reachable wedge, without moving the flight.
  const CUP = Object.freeze({a0:270,a1:346,end:548,soffit:z=>UY+.8*(z-250)+23.5});
  // The front plot (docs/HOUSE-SCALE.md; the numbers are shared with js/hs-world.js, which migrates old saves): the front
  // garden runs from the house front (z 702) to the pavement at FZ: the approved 7 m semi front garden with a full-size saloon.
  const { FZ, CAR, STREET, HEDGE, PIER_TOP } = H.FRONT, FRONT_PIERS = H.FRONT.PIERS, LAMP = { x: 700, z: STREET.kerb - 22 };
  const REAR = H.REAR;
  const tex = n => A.t(n);
  const say = (t, x, ms) => H.say(cast(t), cast(x), ms);
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  const sis = () => { try { return Cast.n('sister'); } catch (e) { return 'my sister'; } };
  const secret = id => { try { R._.secret(id); } catch (e) {} };
  const mWhite = M({ c: '#efece4', family: 'plastic' }), mSkirt = M({ c: '#efebe0', map: tex('whiteGloss'), sh: 30, sp: '#333' });
  const mBrass = M({ c: '#c8a040', family: 'brass' }), mMetal = M({ c: '#9a9aa0', family: 'metal' }), mDark = M({ c: '#1b1b1e', family: 'plastic' });
  // Same gloss class as the casings: static batching shares their draw calls.
  const mSpindle = M({ c: '#f5f1e7', family: 'glossPaint' });
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
      const seg = (a0, a1, top, bot) => { if (a1 - a0 < 0.1 || bot - top < 0.1) return; const mid = (a0 + a1) / 2, my = (top + bot) / 2; const pos = k === 'n' || k === 's' ? [mid, my, fixed] : [fixed, my, mid]; B.panel(pos[0], pos[1], pos[2], a1 - a0, bot - top, (d.thin || {})[k] || 4, d.fadedSide===k?d.fadedWall:wm, { ry, uv: d.uv || 128 }); }; // (outside walls stay inside the brick skin)
      let a = s0;
      for (const h of holes) { seg(a, h[0], cy, fy); seg(h[0], h[1], cy, h[2]); seg(h[0], h[1], h[3], fy); a = h[1]; }
      seg(a, s1, cy, fy);
      // The panel front is the wall plane. Bury the skirting back 1 mm
      // into it, including thin walls; butt its ends into the casing backs.
      if (d.skirt !== false) {
        let b = s0; const sk = (p, q) => { if (q - p < 1) return; const mid = (p + q) / 2; const off = k === 'n' ? [mid, fixed + 0.7] : k === 's' ? [mid, fixed - 0.7] : k === 'w' ? [fixed + 0.7, mid] : [fixed - 0.7, mid]; B.rbox(off[0], fy - 4.5, off[1], k === 'n' || k === 's' ? q - p : 1.6, 9, k === 'n' || k === 's' ? 1.6 : q - p, 0.55, mSkirt); };
        for (const h of holes) { if (h[3] >= fy - 0.5) { sk(b, h[0] - 6.1); b = h[1] + 6.1; } }
        sk(b, s1);
      }
    };
    side('n', x0, x1, z0, 0); side('s', x0, x1, z1, 180); side('w', z0, z1, x0, 90); side('e', z0, z1, x1, -90);
    if (d.floor) B.panel((x0 + x1) / 2, fy, (z0 + z1) / 2, x1 - x0, z1 - z0, 2, d.floor, { rx: 90, uv: d.fuv || 90 });
    // plaster coving: a solid 45-degree bar run into the wall/ceiling angle, so the corner reads as a moulding
    if (d.cove) { const cm = M({ c: '#f1ede2', family: 'plaster' }); B.box((x0 + x1) / 2, cy, z0, x1 - x0, 7, 7, cm, { rx: 45 }); B.box((x0 + x1) / 2, cy, z1, x1 - x0, 7, 7, cm, { rx: 45 }); B.box(x0, cy, (z0 + z1) / 2, 7, 7, z1 - z0, cm, { rz: 45 }); B.box(x1, cy, (z0 + z1) / 2, 7, 7, z1 - z0, cm, { rz: 45 }); }
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
  // The hall owns the carpet through each jamb, to x193. Trim the room
  // finish around that strip so the lino/red carpet never overlaps it.
  function thresholdFloor(B,z0,z1,door,material,uv){
    for(const [x0,a,x1,b]of [[-280,z0,193,z1],[193,z0,195,door-48],[193,door+48,195,z1]])
      B.panel((x0+x1)/2,GY,(a+b)/2,x1-x0,b-a,2,material,{rx:90,uv});
  }
  // a flat polygon from 3D points [x, y, z] (any plane), double-sided material expected
  function poly(B, pts, m) {
    const g = new T.BufferGeometry(), pos = [], idx = [], uv = [];
    pts.forEach((p, i) => { pos.push(p[0], p[1], p[2]); uv.push(0, 0); if (i > 1) idx.push(0, i - 1, i); });
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal;
    return B.geo(K.thicken(g, .6, [n.getX(0),n.getY(0),n.getZ(0)]), 0, 0, 0, m, { uv: 128 });
  }
  // One closed, triangulated wall around its openings. Separate touching boxes
  // left subpixel cracks above the doors; overlapping their faces would flicker.
  function solidWall(B, x, z, ry, outline, material, depth, holes) {
    const shape = new T.Shape(), sign = ry === 90 || ry === 180 ? -1 : 1;
    const path = (p, points) => { points.forEach(([a,y],i) => i ? p.lineTo(a*sign,y) : p.moveTo(a*sign,y)); p.closePath(); return p; };
    path(shape, outline);
    for (const points of holes || []) shape.holes.push(path(new T.Path(), points));
    const geo = new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:1});
    geo.translate(0,0,-depth); B.geo(geo,x,0,z,material,{ry,uv:128});
  }
  function doorWall(B,x,z,ry,a0,a1,cy,fy,doors,material,depth=4) {
    const mid = ry === 0 || ry === 180 ? x : z;
    const outline=[[a0-mid,cy],[a1-mid,cy],[a1-mid,fy]];
    for(const [a,b,top] of [...doors].sort((p,q)=>q[0]-p[0]))outline.push([b-mid,fy],[b-mid,top],[a-mid,top],[a-mid,fy]);
    outline.push([a0-mid,fy]); solidWall(B,x,z,ry,outline,material,depth);
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
      B.box(ax, ay, az, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mSkirt);
      B.box(bx, by, bz, along ? 6 : 2.4, hgt, along ? 2.4 : 6, mSkirt);
      B.box(tx, ty, tz, along ? a1 - a0 + 12.6 : 2.4, 6, along ? 2.4 : a1 - a0 + 12.6, mSkirt);
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
    K.doorLeaf(pv, { cx, cy: top + 0.3 + (hgt - 0.2) / 2, cz, w: dw, h: hgt - 0.2, t: 3.6, along, leaf: lm, mould: o.panel ? lm : M({ c: '#ece8de', family: 'glossPaint' }), field: o.panel || M({c:'#dcd7cb',family:'glossPaint'}),
      brass: mBrass, hinge: M({ c: '#a8884a', sh: 50, sp: '#806a3a' }), handleA: ha, handleY: hy, leverDir: -sgnA, hingeA: -sgnA * 0.4, hingeSide: o.inside ? 1 : -1, glass: !!o.glass,
      glazing: o.glass ? { w: o.glass.w || 44, h: 78, y: top + 58 - (top + .3 + (hgt - .2)/2), material: doorGlass() } : null });
    if (o.deco) o.deco(D, { along, sgnA, dw, top, hgt, fy });
    return pv;
  }
  function doorGlass() {
    return M({c:'#fff',map:K.tex('hs.door.reeded',128,256,(g,w,h)=>{
      g.fillStyle='#c8d3c5';g.fillRect(0,0,w,h);
      // Fine vertical reeds and a small amber/green leaded diamond. The real
      // world is visible through it; no bloom or opaque panel behind the glass.
      for(let x=0;x<w;x+=4){g.fillStyle='rgba(255,255,235,.25)';g.fillRect(x,0,1,h);g.fillStyle='rgba(66,89,83,.16)';g.fillRect(x+2,0,1,h);}
      const diamond=(cx,cy,rx,ry,c)=>{g.beginPath();g.moveTo(cx,cy-ry);g.lineTo(cx+rx,cy);g.lineTo(cx,cy+ry);g.lineTo(cx-rx,cy);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle='#59615a';g.lineWidth=2.5;g.stroke();};
      diamond(w/2,h/2,27,57,'#bca36b');diamond(w/2,h/2,14,32,'#6d8c78');
      g.strokeStyle='rgba(237,241,218,.7)';g.lineWidth=2;g.strokeRect(5,5,w-10,h-10);
    },{clamp:true}),o:.58,tr:true,dw:false,sh:36,sp:'#4d5e59'});
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
  // No window under the stairs: daylight must not switch its bulb off.
  const lit = id => lightsOn[id] != null ? lightsOn[id] : (id === 'cupboard' || phase() !== 'day');
  const standardLampOn=()=>lightsOn.loungeLamp==null?phase()!=='day':lightsOn.loungeLamp;
  function standardLampLook(r){if(r&&r.standardBulbMaterial){if(r.standardShadeMaterial){r.standardShadeMaterial.emissive.set(standardLampOn()?'#63401f':'#000000');r.standardShadeMaterial.userData.e0=r.standardShadeMaterial.emissive.clone()}r.standardBulbMaterial.emissive.set(standardLampOn()?'#c89b58':'#000000');r.standardBulbMaterial.userData.e0=r.standardBulbMaterial.emissive.clone();exteriorLightLook(HouseRooms.rooms.drive);H.dirty()}}
  const ceilingSwitches=new Map();
  function exteriorLightLook(r){
    if(!r)return;const night=phase()!=='day';
    for(const [m,on,c]of [[r.gardenPathNight,night,'#060b13'],[r.shedLatch,night,'#0b1018'],[r.porchGlow,night,'#ffd08a'],[r.streetGlow,night,'#ffb24a'],[r.bayGlow,night&&(lit('lounge')||standardLampOn()||HouseRooms.rooms.lounge?.fireOn),'#916039']]){
      if(!m)continue;m.emissive.set(on?c:'#000');m.userData.e0=m.emissive.clone();
    }
  }
  function switchLook(){for(const [id,r]of Object.entries(HouseRooms.rooms))for(const m of r.ceilingGlow||[]){m.emissive.set(lit(id)?m.userData.litColour:'#000');m.userData.e0=m.emissive.clone()}for(const [id,rocker]of ceilingSwitches){rocker.rotation.x=(lit(id)?-12:12)*D2R;rocker.updateMatrix()}exteriorLightLook(HouseRooms.rooms.drive);H.dirty()}
  function ceilingGlow(r,colour,lightColour){
    const key=colour+lightColour,cache=r.ceilingMaterials||(r.ceilingMaterials=new Map());
    if(cache.has(key))return cache.get(key);
    const m=M({c:colour,sh:5,sp:'#101010'}).clone();
    m.userData.litColour=lightColour;(r.ceilingGlow||(r.ceilingGlow=[])).push(m);cache.set(key,m);return m;
  }
  // Real fittings at the existing light positions: closed shade profiles and
  // solid opal diffusers, with the same saved switch state as their light pool.
  function pendant(B,r,x,cy,z){
    B.cyl(x,cy+1.5,z,6,6,3,14,mWhite);
    const glow=ceilingGlow(r,'#f0e0b8','#ffcc83');glow.userData.pendant=true;
    const cord=new T.CylinderGeometry(.3,.3,26,6);
    for(let i=0;i<cord.attributes.uv.count;i++)cord.attributes.uv.setX(i,0);
    B.geo(cord,x,cy+15,z,glow);
    glow.emissiveMap=K.tex('hs.pendant.emission',8,8,g=>{g.fillStyle='#353535';g.fillRect(0,0,4,8);g.fillStyle='#fff';g.fillRect(4,0,4,8)},{clamp:true});
    // One submission: the solid shade samples the dim half, the bulb the hot half.
    const shade=new T.LatheGeometry([[2,-2],[2.35,-2],[14.35,10],[14,10],[2,-2]].map(([r,y])=>new T.Vector2(r,y)),24);
    const bulb=new T.SphereGeometry(1,12,8);
    for(const [geo,u]of [[shade,.25],[bulb,.75]]){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,u)}
    B.geo(shade,x,cy+26,z,glow);B.geo(bulb,x,cy+30,z,glow,{sx:2.6,sy:3.5,sz:2.6});
  }
  function ceilingSwitch(r,id,x,y,z,ry){
    const group=new T.Group();group.position.set(x,y,z);group.rotation.y=ry*D2R;group.name='ceiling-switch-'+id;r.group.add(group);const B=K.into(group);
    B.rbox(0,0,0,8.6,8.6,.7,0.35,mWhite); // standard square single-gang plate, not a tall overseas one
    for(const xx of [-3,3]){B.cyl(xx,0,.45,0.25,0.25,0.2,10,mMetal,{rx:90});B.box(xx,0,.57,0.32,0.06,0.05,M('#555'))}
    const rocker=B.rbox(0,0,.65,2.4,3.4,0.8,0.25,M('#d6d0c2'));rocker.matrix.decompose(rocker.position,rocker.quaternion,rocker.scale);rocker.name='switch-rocker';ceilingSwitches.set(id,rocker);
    H.spot('hs.switch.'+id,{label:()=>lit(id)?'Ceiling light: switch off':'Ceiling light: switch on',obj:group,act:()=>{lightsOn[id]=!lit(id);saveHouseLights();switchLook();H.relight();window.Sound?.world('switch')}});
    switchLook();
  }
  function interiorAmb(id, dayIntensity = .64) {
    if (phase() === 'day') return {sky: '#e2e2d9', gnd: '#8b7b64', i: dayIntensity*(id==='kitchen'?1.1:1)};
    if (phase() === 'night') return {sky: '#8699bd', gnd: '#51483f', i: lit(id)?(id==='landing'||id==='hall'?.24:id==='kitchen'?.18:.14):(id==='landing'||id==='hall'?.19:.105)};
    return phase() === 'dawn' ? {sky:'#c3d7f2',gnd:'#666674',i:.23} : {sky:'#d3ad91',gnd:'#615044',i:.2};
  }
  function outdoorAmb(ground) {
    return phase() === 'day' ? {sky: '#cfe0ff', gnd: ground, i: .78} : phase() === 'night' ? {sky: '#8795af', gnd: '#57604f', i: .52} : {sky: '#d9b6ae', gnd: '#66654f', i: .62};
  }
  const sky = () => K.TEX['rm.sky'];
  const phaseTextures = new Set();
  function phaseTex(key, w, h, paint, options) {
    const t = K.tex(key, w, h, paint, options);
    t.userData.repaintPhase = () => {paint(t.userData.g, w, h); t.needsUpdate = true;};
    phaseTextures.add(t); return t;
  }

  // Shared print sheet: framed family snaps, engraved door plates, bound rug
  // and address book. All sit on closed meshes; no floating picture cards.
  function hallPrints() { return M({c:'#fff',pr:true,map:K.tex('hs.family.prints',1024,512,(g)=>{
    const tile=(i,paint)=>{g.save();g.translate(i%4*256,Math.floor(i/4)*256);paint();g.restore();};
    const title=(s,y,size=30)=>{g.fillStyle='#344b53';g.textAlign='center';g.font='bold '+size+'px Georgia';while(g.measureText(s).width>224&&size>10)g.font='bold '+(--size)+'px Georgia';g.fillText(s,128,y);};
    for(let i=0;i<3;i++)tile([0,1,4][i],()=>{
      g.fillStyle='#f2e6cb';g.fillRect(0,0,256,256);g.fillStyle=i?'#9aa99a':'#9eb6bf';g.fillRect(17,17,222,180);
      g.fillStyle=i?'#697a62':'#6f9398';g.fillRect(17,101,222,62);g.fillStyle=i?'#87916b':'#c9b991';g.fillRect(17,157,222,40);
      if(!i){g.fillStyle='#d7d5bf';g.fillRect(17,138,222,5);}
      if(i===2){g.strokeStyle='#b2a17c';g.lineWidth=4;for(let x=35;x<240;x+=38){g.beginPath();g.moveTo(x,20);g.lineTo(x,194);g.stroke();}for(let y=45;y<170;y+=34){g.beginPath();g.moveTo(18,y);g.lineTo(238,y);g.stroke();}for(let n=0;n<20;n++){g.fillStyle='#7f9b69';g.beginPath();g.ellipse(37+(n*43)%193,61+(n*17)%110,8,12,.5,0,7);g.fill();g.fillStyle='#a9583b';g.beginPath();g.arc(37+(n*43)%193,65+(n*17)%110,5,0,7);g.fill();}}
      const people=i===2?[[104,50,137,'#58637b']]:i?[[95,70,88,'#566782'],[164,98,63,'#a66b78']]:[[62,58,130,'#58637b'],[111,72,116,'#a67d70'],[158,99,88,'#6b8060'],[197,126,61,'#a66b78']];
      for(const [x,y,h,c]of people){g.fillStyle=c;g.beginPath();g.moveTo(x-12,y+27);g.lineTo(x+12,y+27);g.lineTo(x+18,y+h);g.lineTo(x-18,y+h);g.fill();g.lineWidth=9;g.strokeStyle=c;g.beginPath();g.moveTo(x-13,y+34);g.lineTo(x-22,y+h*.8);g.moveTo(x+13,y+34);g.lineTo(x+23,y+h*.8);g.stroke();g.fillStyle='#b88d6b';g.beginPath();g.ellipse(x,y+13,11,15,0,0,7);g.fill();g.fillStyle='#544638';g.beginPath();g.ellipse(x,y+4,11,7,0,Math.PI,Math.PI*2);g.fill();g.fillStyle='#493e35';g.fillRect(x-5,y+13,2,2);g.fillRect(x+3,y+13,2,2);g.fillRect(x-3,y+21,6,1);}
      g.fillStyle='rgba(243,221,179,.13)';g.fillRect(17,17,222,180);g.textAlign='center';let size=21;g.font='italic '+size+'px Georgia';const caption=['A day at the seaside','First day back, 1998',"Dad's prize tomatoes"][i];while(g.measureText(caption).width>222)g.font='italic '+(--size)+'px Georgia';g.fillStyle='#685749';g.fillText(caption,128,230);
    });
    ['BATHROOM','MOM & DAD'].forEach((s,j)=>tile(j+2,()=>{g.fillStyle='#d8c794';g.fillRect(0,0,256,256);g.strokeStyle='#938157';g.lineWidth=4;g.strokeRect(9,18,238,220);g.translate(0,128);g.scale(1,3.4);title(s,11,30);}));
    tile(5,()=>{g.fillStyle='#e9dfc2';g.fillRect(0,0,256,256);title('PHONE',104,34);title('NUMBERS',154,34);g.strokeStyle='#ad9472';g.lineWidth=3;g.strokeRect(12,12,232,232);});
    tile(6,()=>{g.fillStyle='#69433a';g.fillRect(0,0,256,256);g.fillStyle='#b59a69';g.fillRect(9,4,238,248);g.fillStyle='#344b50';g.fillRect(17,8,222,240);g.fillStyle='#9b7957';g.fillRect(29,14,198,228);g.fillStyle='#6e493e';g.fillRect(36,17,184,222);for(let y=29;y<242;y+=33){g.strokeStyle='#c5ad7f';g.lineWidth=3;g.beginPath();g.moveTo(128,y-11);g.lineTo(159,y);g.lineTo(128,y+11);g.lineTo(97,y);g.closePath();g.stroke();}const fade=g.createLinearGradient(0,0,256,0);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(.3,'rgba(206,173,127,.02)');fade.addColorStop(.5,'rgba(206,173,127,.25)');fade.addColorStop(.7,'rgba(206,173,127,.02)');fade.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fade;g.fillRect(0,0,256,256);const rand=K.rnd(1199);for(let n=0;n<9000;n++){g.fillStyle=rand()<.5?'#ffffff0b':'#0000000b';g.fillRect(rand()*256,rand()*256,1,1);}});
    tile(7,()=>{g.fillStyle='#f2e6cb';g.fillRect(0,0,256,256);g.fillStyle='#b5a58c';g.fillRect(17,17,222,180);g.fillStyle='#704e46';g.fillRect(17,157,222,40);g.strokeStyle='#8a7350';g.lineWidth=14;g.beginPath();g.moveTo(149,159);g.bezierCurveTo(218,196,213,157,189,151);g.stroke();g.fillStyle='#967d55';g.beginPath();g.ellipse(129,151,35,29,0,0,7);g.ellipse(129,113,24,23,0,0,7);g.fill();for(const s of [-1,1]){g.beginPath();g.moveTo(129+s*20,108);g.lineTo(129+s*21,82);g.lineTo(129+s*7,96);g.fill();g.fillStyle='#4a4935';g.fillRect(129+s*9-2,111,4,4);g.fillStyle='#967d55';g.fillRect(129+s*10-4,157,8,28);}g.fillStyle='#d1b99a';g.beginPath();g.ellipse(129,124,8,5,0,0,7);g.fill();g.fillStyle='#5e513c';g.fillRect(127,121,4,3);g.strokeStyle='#64583f';g.lineWidth=2;for(const s of [-1,1])for(let y=0;y<3;y++){g.beginPath();g.moveTo(129+s*7,123+y);g.lineTo(129+s*33,117+y*5);g.stroke();}g.textAlign='center';g.font='italic 20px Georgia';g.fillStyle='#685749';g.fillText('Caught sitting still!',128,230);});
  },{clamp:true,identity:true})}); }
  function printBlock(B,x,y,z,w,h,d,tile,o) {
    const geo=new T.BoxGeometry(w,h,d),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(tile%4+uv.getX(i))/4,(2-Math.floor(tile/4)-uv.getY(i))/2);
    return B.geo(geo,x,y,z,hallPrints(),o);
  }
  function familyFrame(B,x,y,z,w,h,tile,ry=0) {
    const F=B.at(x,y,z,ry),oak=M({c:'#fff',map:tex('oak')});
    F.rbox(0,0,1.1,w,h,2.2,.4,oak);
    // The image is inset into a solid frame; a millimetre lip catches the light.
    printBlock(F,0,0,2.25,w-4,h-4,.3,tile);
    for(const s of [-1,1]){F.box(s*(w/2-1),0,2.6,1.7,h,1.2,oak);F.box(0,s*(h/2-1),2.6,w-3,1.7,1.2,oak);}
    F.wshadow(0,1,-.1,w+5,h+5,.24,{m:3});
  }
  function doorPlate(D,at,w,tile,ry=0) {
    const P=D.at(...at,ry);P.rbox(0,0,0,w,9,.8,.35,mBrass);printBlock(P,0,0,.45,w-1,7.6,.15,tile);
    for(const s of [-1,1])P.cyl(s*(w/2-1.2),0,.6,.33,.33,.25,6,mDark,{rx:90});
  }
  function runner(B,x,fy,z,w,d) {
    // Bound wool, 5 mm thick. It rides on the carpet, never changes the floor
    // height/collision and stops well before every doorway and stair tread.
    const wool=M({c:'#fff',family:'carpet',map:K.tex('hs.runner.wool',512,1024,(q,w,h)=>{
      q.save();q.scale(2,4);q.fillStyle='#69433a';q.fillRect(0,0,256,256);q.fillStyle='#b59a69';q.fillRect(9,4,238,248);q.fillStyle='#344b50';q.fillRect(17,8,222,240);q.fillStyle='#9b7957';q.fillRect(29,14,198,228);q.fillStyle='#6e493e';q.fillRect(36,17,184,222);
      for(let y=29;y<242;y+=33){q.strokeStyle='#c5ad7f';q.lineWidth=3;q.beginPath();q.moveTo(128,y-11);q.lineTo(159,y);q.lineTo(128,y+11);q.lineTo(97,y);q.closePath();q.stroke()}q.restore();
      const fade=q.createLinearGradient(0,0,w,0);fade.addColorStop(0,'rgba(203,176,131,0)');fade.addColorStop(.3,'rgba(203,176,131,.02)');fade.addColorStop(.5,'rgba(203,176,131,.23)');fade.addColorStop(.7,'rgba(203,176,131,.02)');fade.addColorStop(1,'rgba(203,176,131,0)');q.fillStyle=fade;q.fillRect(0,0,w,h);
      const r=K.rnd(1199);for(let y=0;y<h;y+=2)for(let x=y%4?0:1;x<w;x+=2){q.fillStyle=r()<.5?'rgba(255,239,210,.14)':'rgba(28,20,17,.17)';q.fillRect(x+r(),y,1,1)}
    },{clamp:true})});B.box(x,fy-.25,z,w,.5,d,wool);B.shadow(x,fy,z,w+2,d+2,.24,{sq:true,m:1.4});
  }
  // Closed rings give hung cloth a round back, shoulders, tapered cuffs and a
  // weighted hem. Low segment counts replace the old heavily bevelled slab.
  function clothBody(B,rings,material) {
    const n=12,pos=[],idx=[];
    for(let r=0;r<rings.length;r++){
      const [x,y,z,rx,rz]=rings[r];
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2,fold=1+.055*Math.cos(a*6);pos.push(x+Math.cos(a)*rx*fold,y+(r===rings.length-1?Math.sin(a*3)*.45:0),z+Math.sin(a)*rz*fold);}
    }
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const a=r*n+i,b=r*n+(i+1)%n,c=b+n,d=a+n;idx.push(a,d,b,b,d,c);}
    // Caps close both ends; they are tucked inside the collar / sleeve cuffs.
    for(const [r,reverse]of [[0,false],[rings.length-1,true]]){const center=pos.length/3;pos.push(...rings[r].slice(0,3));for(let i=0;i<n;i++){const a=r*n+i,b=r*n+(i+1)%n;idx.push(center,reverse?b:a,reverse?a:b);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
    B.geo(geo,0,0,0,material);
  }
  function hallCoat(B,c,h,w,type) {
    const cloth=M({c,map:K.tex('hs.coat.twill',128,128,(g,w,h)=>{g.fillStyle='#f3f1e9';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){g.fillStyle='rgba(32,28,23,.2)';g.fillRect(x,y,2,1);g.fillStyle='rgba(255,255,247,.35)';g.fillRect(x+(y%6?1:0),y+1,1,2)}},{world:7,family:'fabric'}),family:'fabric'}),scale=w/9.2,hood=type==='anorak'||type==='child',mac=type==='mac';
    B.geo(new T.TorusGeometry(2.7*scale,.55,6,12),0,0,0,cloth);
    clothBody(B,[[0,3,0,4*scale,2.4],[0,8,0,w,4.5],[0,h*.35,.6,w-(mac?2:1.2),4],[0,h-6,1,w+(mac?.8:0),5],[0,h,1,w-(mac?0:1),4.1]],cloth);
    for(const side of [-1,1]){
      const cuff=h*(type==='anorak'?.91:type==='child'?.86:.68);
      clothBody(B,[[side*(w-2*scale),8,0,3.9*scale,3.8*scale],[side*(w+3*scale),h*.29,1,3.5*scale,3.6*scale],[side*(w+2.8*scale),cuff-4,2,2.5*scale,2.7*scale],[side*(w+2*scale),cuff,2.2,2.3*scale,2.5*scale]],cloth);
      B.rbox(side*w*.5,h*(mac?.65:.7),5.2,w*.67,6*scale,1,.6,cloth,{rz:side*(mac?-3:-9)});
      if(!hood)B.rbox(side*(mac?3.2:2.5)*scale,mac?8:4.5,4,4*scale,mac?13:7,1.5,.6,cloth,{rz:side*(mac?20:30)});
    }
    if(hood){
      clothBody(B,[[0,-4*scale,-1,1.8*scale,1.8*scale],[0,-scale,-1,5.1*scale,4*scale],[0,6*scale,-1.3,5.8*scale,4.2*scale],[0,12*scale,-1.2,3.8*scale,3*scale]],cloth);
      B.rbox(0,3*scale,3*scale,5*scale,7*scale,.5,1,M({c:'#222b31',sh:2,sp:'#080808'}));
    }
    const front=y=>y<h*.35?4.5:4.6+(y-h*.35)/(h*.65)*1.4;
    B.geo(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,8,4.6),new T.Vector3(0,h*.35,4.7),new T.Vector3(0,h-7,6)]),8,.25,4,false),0,0,0,mac?cloth:mDark);
    B.ball(0,8,4.6,.25,.25,.25,cloth,6);B.ball(0,h-7,6,.25,.25,.25,cloth,6);
    for(let y=mac?22:15;y<h-8;y+=mac?16:13)for(const x of mac?[-2.3,2.3]:[1])B.ball(x,y,front(y)+.15,.55,.55,.3,mDark,6);
    if(mac)B.rbox(0,h*.46,5.2,w*1.65,1.8,.8,.25,cloth);
  }
  function hallMirror() {
    return M({c:'#fff',basic:true,map:phaseTex('hs.mirror.hall',256,384,(g,w,h)=>{
      const night=phase()==='night',wall=night?'#686351':'#a29d89';
      g.fillStyle=wall;g.fillRect(0,0,w,h);
      // The opposite stairwell, its high window, carpet and oak rail. This
      // intentionally cheap silvered silhouette costs no reflection camera.
      g.fillStyle=night?'#4a493f':'#898775';g.beginPath();g.moveTo(0,15);g.lineTo(172,54);g.lineTo(172,305);g.lineTo(0,384);g.fill();
      g.fillStyle=night?'#737469':'#bbc1b0';g.fillRect(190,48,39,103);g.strokeStyle=night?'#8a8570':'#d0c9b5';g.lineWidth=5;g.strokeRect(190,48,39,103);
      g.fillStyle=night?'#5d5342':'#8e8066';g.beginPath();g.moveTo(0,384);g.lineTo(172,284);g.lineTo(256,314);g.lineTo(256,384);g.fill();
      for(let x=18;x<251;x+=27){const top=90+x*.7;g.fillStyle=night?'#918a72':'#d5d0b8';g.fillRect(x,top,5,260-top);g.fillRect(x-1,top+22,7,5);}
      g.strokeStyle=night?'#4b3828':'#6f5137';g.lineWidth=12;g.beginPath();g.moveTo(-8,80);g.lineTo(265,271);g.stroke();
      g.fillStyle=night?'#6c5339':'#93724e';g.fillRect(149,218,13,110);g.beginPath();g.arc(155,214,9,0,7);g.fill();
      const silver=g.createLinearGradient(0,0,w,h);silver.addColorStop(0,'rgba(211,221,207,.14)');silver.addColorStop(.48,'rgba(220,223,204,.03)');silver.addColorStop(1,'rgba(80,91,83,.13)');g.fillStyle=silver;g.fillRect(0,0,w,h);
      g.strokeStyle='rgba(218,225,211,.24)';g.lineWidth=2;g.strokeRect(2,2,w-4,h-4);
    },{clamp:true})});
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
    doorWall(B,250,415,90,130,700,UC,UY,[[150,230,-132],[300,380,-132],[450,530,-132]],wall);
    wl(330, (UC + UY) / 2, 130, 160, UY - UC, 0); // the end wall (north)
    // east wall x 410: right down the stairwell to the hall floor, with a little window halfway
    // The hall owns the lower portions; do not draw them twice with two rigs.
    solidWall(B,410,415,-90,[[-285,UC],[285,UC],[285,GC],[185,GC],[185,GY],[-165,GY],[-165,GC],[-285,GC]],wall,4,[[[-15,-80],[65,-80],[65,60],[-15,60]]]);
    // the landing window (frosted, bubbly 70s glass Dad never replaced)
    B.box(414, -10, 440, .65, 140, 80, M({ c: '#fff', o: 0.62, tr: true, dw:false, family:'glass', reflect:.1, map: K.tex('hs.obscureglass', 128, 128, (g, w, h) => { // 1970s "bubble" obscure glass: dimples catch the light
      g.fillStyle = '#d4dde6'; g.fillRect(0, 0, w, h); const r = K.rnd(4410);
      for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rr = 2 + r() * 5, gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(190,205,220,.25)'); gr.addColorStop(1, 'rgba(120,140,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
    }, { rep: [3, 5] }) }));
    for(const z of [403.8,476.2])B.box(413.55,-10,z,.7,132,.5,K.glassEdge());
    // The common outdoor scene is visible through the frosted glass.
    [[400, -80, 440, 1, 6, 80], [400, 60, 440, 1, 6, 80], [400, -10, 400, 1, 146, 6], [400, -10, 480, 1, 146, 6]].forEach(([x, y, z, w, h, d]) => B.box(x + 8.75, y, z, 1.5, h, d, mWhite));
    B.rbox(408.5, 62, 440, 3, 3, 90, 0.8, mWhite);
    for(const z of [400,480])B.box(414,-10,z,8.2,140,1,mWhite);
    for(const y of [-80,60])B.box(414,y,440,8.2,1,80,mWhite);
    // Cut the parents' doorway out of the wallpaper, as for the west doors.
    // (the front wall is only 0.8 thick so it never shows through the brick skin at z 701..703)
    doorWall(B,330,700,180,250,410,UC,UY,[[260,340,-132]],wall,.8);
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
    [[130, 143.7], [236.3, 293.7], [386.3, 443.7], [536.3, 700]].forEach(([a, b]) => B.rbox(250.7, UY - 4.5, (a + b) / 2, 1.6, 9, b - a, 0.55, mSkirt));
    stairs(B);
    // ao along the landing walls
    [[130,150],[230,300],[380,450],[530,700]].forEach(([a,b])=>B.ao(250.3,UY-16,(a+b)/2,b-a,32,{ry:90,rx:180,a:0.5}));B.ao(330, UY - 16, 130.3, 160, 32, { rx: 180, a: 0.5 });
    pendant(B,r,300,UC,400);
    familyFrame(B,330,-75,130.15,58,44,0);
    familyFrame(B,250.15,-83,415,36,43,1,90);
    runner(B,289,UY,466,44,296);
    batch.build(r.group);
    // doors: Jack's (already there: js/rm-room.js), the bathroom, the little sister's room, Mom and Dad's
    const Bd = K.into(K.batch()); // (frames go in the batch below)
    const fb = K.batch(), F = K.into(fb);
    doorway(r, F, 'jackframe', 'w', 250, 150, 230, UY, { leaf: false, noreveal:true, frameSides: [1] }); // bedroom owns the shared reveal and reverse casing
    doorway(r, F, 'bath', 'w', 250, 300, 380, UY, { leaf: true, inside: true, deco:(D,g)=>doorPlate(D,[2.4,-76,g.sgnA*g.dw/2],29,2,90) });
    const sd = doorway(r, F, 'sis', 'w', 250, 450, 530, UY, { inside: true, deco: (D, g) => { D.box(g.along ? 0 : 2.65, -64, g.sgnA * g.dw / 2, .8, 20, 30, { r: M({ c: '#fff', map: sisSign() }), all: M('#f2a6cf') }, { rx: 2 }); } });
    const md = doorway(r, F, 'mum', 's', 700, 260, 340, UY, { inside: true, deco:(D,g)=>doorPlate(D,[g.sgnA*g.dw/2,-76,-2.4],31,3,180) });
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
  function sisSign() { return K.tex('hs.sissign', 256, 170, (g, w, h) => { g.fillStyle = '#ff9ad0'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { A.star(g, (i * 53) % w, (i * 37) % h, 6, 5); g.fill(); } const title=cast("{sister}'S ROOM").toUpperCase();let size=34;g.font=size+'px '+A.FONT;while(g.measureText(title).width>w-20&&size>12)g.font=(--size)+'px '+A.FONT;A.text(g,title,128,60,g.font,'#b0106a','center'); A.text(g, 'KEEP OUT!!!', 128, 104, '30px ' + A.FONT, '#c00', 'center'); A.text(g, '(this means YOU!)', 128, 140, '700 16px ' + A.HAND, '#333', 'center'); }); }
  // A turned softwood spindle (painted): square ends where it is housed into the rail and string, a lathe-turned
  // shaft with a vase and two beads between. len = the clear height between string/base rail and handrail.
  function spindle(B, x, yTop, z, len, m) {
    // One closed piece of painted stock. Square ends and turned rings share
    // the exact centreline; broad shoulders blend into the shaft, not caps.
    const sq=Math.min(15,len*.2),turn=len-2*sq,n=8,rings=[
      [0,1.65,true],[sq,1.65,true],[sq+.8,1.4,false],
      [sq+turn*.18,1.62,false],[sq+turn*.3,1.3,false],
      [sq+turn*.7,1.3,false],[sq+turn*.82,1.62,false],
      [len-sq-.8,1.4,false],[len-sq,1.65,true],[len,1.65,true]
    ],pos=[],idx=[];
    for(const[y,r,square]of rings)for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=square?r/Math.max(Math.abs(c),Math.abs(s)):r;
      pos.push(c*k,y,s*k);
    }
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
      const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;idx.push(a,d,b,b,d,c);
    }
    for(const[j,reverse]of [[0,false],[rings.length-1,true]]){
      const c=pos.length/3;pos.push(0,rings[j][0],0);
      for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;idx.push(c,reverse?b:a,reverse?a:b);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
    // Keep the square blocks' faces flat; the turned middle stays smooth.
    const flat=geo.toNonIndexed(),P=flat.attributes.position,N=flat.attributes.normal;
    for(let i=0;i<P.count;i+=3){const y=(P.getY(i)+P.getY(i+1)+P.getY(i+2))/3;if(y>sq&&y<len-sq)continue;
      const a=new T.Vector3().fromBufferAttribute(P,i),b=new T.Vector3().fromBufferAttribute(P,i+1),c=new T.Vector3().fromBufferAttribute(P,i+2),normal=b.sub(a).cross(c.sub(a)).normalize();
      for(let k=0;k<3;k++)N.setXYZ(i+k,normal.x,normal.y,normal.z);
    }
    geo.dispose();B.geo(flat,x,yTop,z,m);
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
    const wood = M({ c: '#fff', map: tex('oak') }), spin = mSpindle;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) / D2R;
      B.rbox((x0 + x1) / 2, fy - 90, (z0 + z1) / 2, 5.6, 5.2, len - 7, 1.4, wood, { ry, uv: 60 }); // ordinary graspable rail; same spindle housing height
      B.rbox((x0 + x1) / 2, fy - 3, (z0 + z1) / 2, 7, 6, len - 7, 0.6, wood, { ry, uv: 60 }); // a continuous base rail under every square foot
      const n = Math.floor(len / 12);
      for (let k = 1; k < n; k++) { const t = k / n; spindle(B, x0 + (x1 - x0) * t, fy - 87.4, z0 + (z1 - z0) * t, 81.4, spin); }
    }
    for (const [x, z] of pts) newel(B, x, fy, z, wood, 9);
  }
  // the stairs: one straight flight of 13 carpeted steps, brass stair rods, a closed string on the open side and a
  // painted wall string on the wall side, turned spindles under a moulded handrail, a proper newel at the foot
  function stairs(B) {
    // ONE flight: 13 treads of going 25 and rise 20, between the string on the banister side (x 327..333) and the wall string (x 407.6..410).
    const carpet = tex('carpetBeige'), tread = M({ c: '#fff', map: carpet }), riser = M({ c: '#d9cfbd', map: carpet }), wood = M({ c: '#fff', map: tex('oak') }), spin = mSpindle;
    const worn=M({c:'#fff',map:K.tex('hs.stair.wear',256,128,(q,w,h)=>{const g=q.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(201,181,140,0)');g.addColorStop(.2,'rgba(201,181,140,0)');g.addColorStop(.4,'rgba(201,181,140,.24)');g.addColorStop(.6,'rgba(201,181,140,.24)');g.addColorStop(.8,'rgba(201,181,140,0)');g.addColorStop(1,'rgba(201,181,140,0)');q.fillStyle=g;q.fillRect(0,0,w,h);const r=K.rnd(1515);for(let n=0;n<2000;n++){q.clearRect(r()*w,r()*h,1,1)}},{clamp:true}),tr:true,dw:false,sh:1,sp:'#000'});
    const X0 = 333, X1 = 407.6, XC = (X0 + X1) / 2, XW = X1 - X0, pitch = z => UY + 0.8 * (z - 250);
    for (let k = 1; k <= 13; k++) {
      const z0 = 250 + 25 * k - 25, y = UY + 20 * k;
      B.box(XC, y + 1.5, z0 + 12.6, XW, 3, 25.2, { t: tread, all: M('#7a6a52') }, { sides: 'tlrbu' }); // tread
      B.box(XC,y-.025,z0+13,XW-3,.05,23,{t:worn,all:tread});
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
    const rail0 = zDrop + 3.5, rail1 = z2 - 3, railMid = (rail0 + rail1) / 2;
    B.rbox(330, pitch(railMid) - 92, railMid, 5.6, 5.2, Math.hypot(rail1 - rail0, 0.8 * (rail1 - rail0)), 1.4, wood, { rx: -ang, uv: 60 });
    // Turned spindles, plumb, two per tread, from the string to the underside of the handrail.
    for (let k = 1; k <= 26; k++) { const z = 250 + 12.5 * k - 6.25; if (z > z2 - 6 || z < zDrop + 6) continue; spindle(B, 330, pitch(z) - 89.3, z, 84.4, spin); }
    newel(B, 330, GY, 600, wood, 9); // same 90 mm stock as the landing
  }

  // ================================================================ THE HALL (round the bottom of the stairs)
  function buildHall(r) {
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperHall') }), carpet = M({ c: '#fff', map: tex('carpetBeige'), sh: 1, sp: '#000' });
    // the floor and the ceiling (except over the stairs)
    B.panel(307.5, GY, 155, 205, 190, 2, carpet, { rx: 90, uv: 90 }); B.panel(267.5, GY, 425, 125, 350, 2, carpet, { rx: 90, uv: 90 }); B.panel(307.5, GY, 650, 205, 100, 2, carpet, { rx: 90, uv: 90 });
    B.panel(370,GY,574,80,52,2,carpet,{rx:90,uv:90});
    // Continue the hall carpet through the wall thickness at both doorways.
    // The old 195..205 cm strip was open to the plot's green ground below.
    for(const z of [190,520])B.panel(199,GY,z,12,96,2,carpet,{rx:90,uv:90}); // same hall floor/light rig, not an upstairs-lit rectangle
    const art = M({ c: '#fff', map: tex('artex') });
    B.panel(307.5, GC, 155, 205, 190, 2, art, { rx: -90, uv: 110 }); B.panel(267.5, GC, 425, 125, 350, 2, art, { rx: -90, uv: 110 }); B.panel(370, GC, 650, 80, 100, 2, art, { rx: -90, uv: 110 }); B.panel(267.5, GC, 650, 125, 100, 2, art, { rx: -90, uv: 110 });
    const wl = (x, y, z, w, h, ry) => B.panel(x, y, z, w, h, 4, wall, { ry, uv: 128 });
    // west wall x 205: the kitchen door (150..230), the lounge door (480..560)
    doorWall(B,205,380,90,60,700,GC,GY,[[150,230,GY-205],[480,560,GY-205]],wall);
    wl(307.5, (GC + GY) / 2, 60, 205, GY - GC, 0); // the back wall
    wl(410, (GC + GY) / 2, 155, 190, GY - GC, -90); // the east wall (the back bit)
    // The slope-cut cupboard entrance is at the high end (270..346).
    // the cupboard's front wall (x 330) follows the slope of the flight; the open stairs show above it; the back wall (z 250.5) closes it from the hall
    const yU = z => UY + 0.8 * (z - 250) + 23.5, zF = 250 + (GY - UY - 23.5) / 0.8, ZB = 250.5;
    solidWall(B,329.7,0,-90,[[ZB,yU(ZB)],[zF,GY],[CUP.a1,GY],[CUP.a1,yU(CUP.a1)+7],[CUP.a0,yU(CUP.a0)+7],[CUP.a0,GY],[ZB,GY]],wall,.6);
    B.panel(370,(GC+GY)/2,ZB+.3,80,GY-GC,.9,wall); // overlaps the return inside the stair wall's thickness
    // the fuse box: on the hall's east wall, flush with it
    const fz = B.at(410, GY - 165, 130); fz.box(-3, 0, 0, 6, 26, 20, M('#efece4')); fz.box(-6.15, 0, 0, 0.5, 21, 16, M('#d8d4c8')); fz.box(-6.5, 0, 0, 0.3, 2, 4, M('#555'));
    // the front: the front door (260..340), the bottom of the stairs, the east wall down there
    doorWall(B,307.5,700,180,205,410,GC,GY,[[260,340,GY-205]],wall,.8);
    wl(410, (GC + GY) / 2, 650, 100, GY - GC, -90);
    // skirting
    [[60, 143.7], [236.3, 473.7], [566.3, 700]].forEach(([a, b]) => B.rbox(205.8, GY - 4.5, (a + b) / 2, 1.6, 9, b - a, 0.55, mSkirt));
    B.rbox(307.5, GY - 4.5, 60.8, 205, 9, 1.6, 0.55, mSkirt); [[250.5,CUP.a0-6.3],[CUP.a1+6.3,570]].forEach(([a,b])=>B.rbox(329.2,GY-4.5,(a+b)/2,1.6,9,b-a,.55,mSkirt));
    [[60,150],[230,480],[560,700]].forEach(([a,b])=>{B.ao(205.3,GY-16,(a+b)/2,b-a,32,{ry:90,rx:180,a:0.5});B.ao(220,GY-0.3,(a+b)/2,b-a,28,{rx:90,ry:-90,a:0.4})});
    const fadeStart=250+(GY-32-UY-23.5)/0.8;
    [[250,CUP.a0],[CUP.a1,fadeStart]].forEach(([a,b])=>B.ao(329.7,GY-16,(a+b)/2,b-a,32,{ry:-90,rx:180,a:0.45}));
    const edgeFade=new T.BufferGeometry();edgeFade.setAttribute('position',new T.Float32BufferAttribute([329.7,GY-32,fadeStart,329.7,GY,fadeStart,329.7,GY,zF],3));edgeFade.setAttribute('uv',new T.Float32BufferAttribute([0,0,0,1,1,1],2));edgeFade.setIndex([0,2,1]);edgeFade.computeVertexNormals();
    B.geo(edgeFade,0,0,0,M({c:'#000',map:K.TEX.fade,basic:true,tr:true,o:0.45,dw:false,po:-2}));
    // the front door's frame (its leaf is hinged on in init, with the drive beyond); the doormat
    doorway(r, B, 'frontframe', 's', 700, 260, 340, GY, { leaf: false, depth: 1 });
    const fd = B.at(300, GY, 700);
    fd.rbox(0, -1, -42, 70, 2, 44, 0.7, { t: M({ c: '#fff', map: matTex() }), all: M('#8a6232') }); // a coir mat: printed top, bristly bound edges
    B.shadow(300, GY, 660, 74, 48, 0.5, { sq: true });
    // coat hooks with coats, a mirror, a radiator, the hall table with the keys bowl, a ceiling light
    runner(B,268,GY,402,68,242);
    familyFrame(B,309,GC+99,60.15,66,50,7);
    familyFrame(B,205.15,GY-157,580,26,33,4,90);
    const ch = B.at(206, GY - 170, 640);
    ch.box(2, 0, 0, 3, 8, 80, M({ c: '#fff', map: tex('oak') }));
    [['#35475b',-29,49,10,1,'anorak'],['#9d8366',-7,86,10.1,-7,'mac'],['#4b4e52',15,65,8.2,0,'coat'],['#b57887',34,39,6.4,15,'child']].forEach(([c,z,h,w,hookY,type],i)=>{
      const reach=10+i*1.1,C=ch.at(reach,hookY-1,z,90),oak=M({c:'#fff',map:tex('oak')});
      // Short solid mounting straps stagger the pegs; the child's is lower.
      ch.box(2,hookY/2,z,3,Math.abs(hookY)+6,6,oak);
      ch.rbox(2,hookY-1,z,3,8,9,.6,oak);
      ch.cyl((3.5+reach)/2,hookY-3,z,.7,.7,reach-3.5,8,mBrass,{rz:90});ch.ball(reach,hookY-4,z,1.4,1.4,1.4,mBrass,8);
      hallCoat(C,c,h,w,type);
      ch.wshadow(-.75,hookY+h*.5,z,27,h+10,.26,{ry:90,m:5});
    });
    const mi=B.at(205.15,GY-150,300,90),oak=M({c:'#fff',map:tex('oak')});
    mi.rbox(0,0,1.3,40,60,2.6,.5,oak);mi.box(0,0,2.75,35,55,.5,hallMirror());
    for(const side of [-1,1]){mi.rbox(side*19,0,3.1,2,60,1.2,.3,oak);mi.rbox(0,side*29,3.1,36,2,1.2,.3,oak);}
    mi.wshadow(0,1,-.1,45,65,.24,{m:3});
    const bag=B.at(214,GY-100,579,90),canvas=M({c:'#5a6554',family:'fabric'});
    bag.rbox(0,0,1,21,30,11,3,canvas);bag.rbox(0,6,7.5,17,13,3,1.5,canvas);bag.rbox(0,-6,7,19,13,1.4,1,canvas);
    for(const x of [-6,6])bag.rbox(x,2,9.1,2,14,.7,.3,mDark);
    bag.geo(new T.TorusGeometry(3,.75,6,12,Math.PI),0,-15,0,canvas,{rz:180});
    B.box(206.1,GY-116,579,2,7,5,oak);B.cyl(210.6,GY-116.5,579,.7,.7,7.5,8,mBrass,{rz:90});B.ball(214.5,GY-116.5,579,1.3,1.3,1.3,mBrass,8);
    B.wshadow(205.15,GY-100,579,28,38,.26,{ry:90,m:5});
    const rd = B.at(206, GY - 36, 400); rd.box(4, 0, 0, 3.6, 56, 90, { all: M('#e8e5dc'), r: M({ c: '#fff', map: tex('radiator'), sh: 40 }) });
    const ht = B.at(222, GY, 110); ht.box(0, -76, 0, 30, 3, 60, M({ c: '#fff', map: tex('oak') })); [[-12, -26], [12, -26], [-12, 26], [12, 26]].forEach(([x, z]) => ht.box(x, -37, z, 3, 74, 3, M({ c: '#fff', map: tex('oak') })));
    // A closed ceramic bowl with a rounded lip and inner basin, not an open
    // cone whose back faces vanished when seen from above.
    ht.lathe(0,-78,-10,[[0,-.5],[3,-.5],[5,-1.4],[7.2,-4.6],[7.8,-4.8],[8.2,-4.5],[7.7,-3],[5,0],[2.8,.2],[0,.2]],24,M({c:'#b68b59',family:'ceramic',side:2}));ht.shadow(0,-77.5,-10,18,18,.25);
    const keys=ht.at(4,-77.9,12,22);keys.geo(new T.TorusGeometry(1.7,.3,6,18),0,0,0,mMetal,{rx:90});
    for(const [x,ry,material]of [[-1,-20,mMetal],[1,30,mBrass]]){const key=keys.at(x,0,1,ry);key.cyl(0,.1,0,1.05,1.05,.4,12,material);key.box(0,.1,3,.75,.4,4.3,material);for(const z of [3.6,4.7])key.box(.55,.1,z,.7,.4,.65,material)}
    const book=ht.at(0,-77.5,-23);book.rbox(0,-1,0,16,2,11,.4,M('#e3d9b9'));printBlock(book,0,-2.15,0,17,12,.3,5,{rx:90});book.shadow(0,0,0,19,14,.25,{sq:true});
    ht.shadow(0, 0, 0, 36, 66, 0.6, { sq: true });
    pendant(B,r,300,GC,200);pendant(B,r,300,GC,560);
    batch.build(r.group);
    // the front door (it's cold out), the coats, the hall table
    // the doormat: where the post (and mail-order parcels: Agent P's pack) lands. Things can rest on it: { room: 'hall', x: 300, y: 353, z: 655 }
    wrapSpot('hs.mat', { label: 'The doormat', act: () => say('The doormat', ['WELCOME, it says. Mom hoovers it. It is the cleanest thing in the house.', 'The post lands here. Mostly bills, and catalogues for Mom. Sometimes a parcel for ME.'][((r.mn = (r.mn | 0) + 1)) % 2]) }); pickBox(r, 'hs.mat', 300, GY - 1.2, 658, 70, 2.4, 44);
    wrapSpot('hs.coats', { label: 'Coats', act: sayLines('hs.coats', 'Coats', ['Dad\'s anorak, Mom\'s good coat, my school coat (too small), ' + sis() + '\'s pink one.', 'In my coat pocket: 20p, a bus ticket and a Chompa Chomps wrapper.']) }); pickBox(r, 'hs.coats', 214, GY - 130, 640, 20, 90, 80);
    H.spot('hs.keys', { label: 'Keys bowl', act: sayLines('hs.keys', 'The keys bowl', ['Car keys, the spare front door key, a key nobody knows what it\'s for, and three buttons.']) }); pickBox(r, 'hs.keys', 222, GY - 82, 110, 30, 10, 50);
    H.spot('hs.mirror', { label: 'Mirror', act: sayLines('hs.mirror', 'Mirror', ['Still got the hair gel in from yesterday. Spiky. Excellent.', 'Is that a spot? It\'s a spot. Oh no.']) }); pickBox(r, 'hs.mirror', 207, GY - 150, 300, 3, 60, 40);
    // Offset butt-hinge axis: at 180 degrees the leaf and both handles clear
    // the hall casing, leaving the full hall route free. The top follows the soffit.
    const frames=K.batch(), FB=K.into(frames), top=z=>CUP.soffit(z)+7;
    // Each face is one continuous, closed mitered casing. Flat-topped
    // posts beside a separate sloping strip left little white ears at the joins.
    const casing=[[CUP.a0-6.3,GY],[CUP.a0-6.3,top(CUP.a0-6.3)-6],[CUP.a1+6.3,top(CUP.a1+6.3)-6],[CUP.a1+6.3,GY],[CUP.a1+.3,GY],[CUP.a1+.3,top(CUP.a1+.3)],[CUP.a0-.3,top(CUP.a0-.3)],[CUP.a0-.3,GY]];
    for(const x of [326.8,330.8])solidWall(FB,x,0,-90,casing,mWhite,2.4);
    for(const z of [CUP.a0-1.2,CUP.a1+1.2])solidWall(FB,328,0,-90,[[z-1,GY],[z-1,top(z-1)],[z+1,top(z+1)],[z+1,GY]],mWhite,4);
    // A rebated head stop sits behind the leaf, sealing its fitting clearance.
    solidWall(FB,329.8,0,-90,[[CUP.a0,top(CUP.a0)],[CUP.a1,top(CUP.a1)],[CUP.a1,top(CUP.a1)+3],[CUP.a0,top(CUP.a0)+3]],mWhite,1.5);
    frames.build(r.group);
    const cd=new T.Group();cd.position.set(324.5,0,CUP.a0);r.group.add(cd);
    const width=CUP.a1-CUP.a0, bottom=GY-2, high=top(CUP.a0)+2, low=top(CUP.a1)+2;
    const leaf=M({c:'#efebe2',map:tex('whiteGloss'),sh:24,sp:'#333'}), D=K.into(cd);
    // A real closed BoxGeometry with its top vertices cut to the slope. Keeping
    // the slab's type preserves the engine's leaf collision and physics queries.
    const slab=D.box(3,(high+bottom)/2,width/2,3.6,bottom-high,width,leaf);
    const pos=slab.geometry.attributes.position;
    for(let i=0;i<pos.count;i++)if(pos.getY(i)<0)pos.setY(i,high+.8*(pos.getZ(i)+width/2)-(high+bottom)/2);
    pos.needsUpdate=true;slab.geometry.computeVertexNormals();slab.geometry.computeBoundingBox();slab.geometry.computeBoundingSphere();
    const db=K.batch(), DB=K.into(db);
    for(const x of [.95,5.05]){
      // Solid raised timber fields on each face, with a sloped upper panel.
      poly(DB,[[x,high+14,9],[x,low+6,width-9],[x,260,width-9],[x,260,9]],mWhite);
      DB.rbox(x,300,width/2,.8,56,width-18,.4,mWhite);
      DB.cyl(x,250,width-9,2.5,2.5,.6,16,mBrass,{rz:90});
      DB.box(x+(x<3?-1:1),250,width-12,2,1.4,9,mBrass);
    }
    for(const y of [GY-25,GY-102,high+20])DB.cyl(0,y,0,.65,.65,8,10,mBrass);
    db.build(cd);
    H.door('cupboard',{rooms:['hall','cupboard'],pivot:cd,swing:180,dir:-1,lintelPlane:330,safeSwing:true});
    H.spot('hs.cupdoor',{label:()=>H.DOORS.cupboard.open?'Shut cupboard':'Open the cupboard under the stairs',obj:cd,act:()=>H.setDoor('cupboard',!H.DOORS.cupboard.open)});
    H.walkRect('G', 207, 62, 408, 250, { room: 'hall' }); H.walkRect('G', 207, 250, 328, 600, { room: 'hall' }); H.walkRect('G', 207, 600, 408, 698, { room: 'hall' });
    H.block('G', 205, 80, 240, 140); // the hall table
    H.solid('G',205,565,227,692,GY-185,GY-81,{kind:'fixed'}); // wall-mounted coats and school bag
  }
  function matTex() { return K.tex('hs.mat', 256, 160, (g, w, h) => { g.fillStyle = '#8a5a2a'; g.fillRect(0, 0, w, h); const r = K.rnd(5); for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,220,160,.15)'; g.fillRect(r() * w, r() * h, 1, 2); } A.text(g, 'WELCOME', 128, 96, '44px ' + A.FONT, '#3a1a0a', 'center'); }); }

  // ================================================================ THE CUPBOARD UNDER THE STAIRS (the old SNES lives here)
  function buildCupboard(r) {
    const batch = K.batch(), B = K.into(batch);
    // enclosed under the flight: back wall (hall build), front wall (hall build), the east wall is the stairwell's own (x 410), the sloping soffit is the ceiling
    const yU = z => UY + 0.8 * (z - 250) + 23.5, zF = 250 + (GY - UY - 23.5) / 0.8;
    const plaster = M({c:'#fff',map:K.tex('hs.cupboard.plaster',128,128,g=>{g.fillStyle='#c8bfab';g.fillRect(0,0,128,128);const rand=K.rnd(188);for(let i=0;i<1800;i++){g.fillStyle=rand()<.5?'rgba(255,255,245,.035)':'rgba(75,65,48,.035)';g.fillRect(rand()*128,rand()*128,1,1)}}),sh:2,side:2});
    // Independent inner lining: finer painted plaster in this tiny space only.
    // Keep the hall's wallpaper and its texture scale on the outside faces.
    const lining=(x,pts)=>poly(B,pts.map(([z,y])=>[x,y,z]),plaster);
    solidWall(B,331,0,-90,[[251.2,yU(251.2)],[zF,GY],[CUP.a1,GY],[CUP.a1,yU(CUP.a1)+7],[CUP.a0,yU(CUP.a0)+7],[CUP.a0,GY],[251.2,GY]],plaster,.6);
    lining(409,[[251.2,GY],[251.2,yU(251.2)],[zF,GY]]);
    B.panel(370,(yU(251.2)+GY)/2,251.2,78,GY-yU(251.2),.6,plaster,{uv:28});
    B.panel(370,GY,(250.5+CUP.end)/2,80,CUP.end-250.5,2,M({c:'#fff',map:tex('carpetBeige')}),{rx:90,uv:90});
    // Close the last 20 cm as a shallow back board, entirely below the slope.
    B.box(370,(yU(CUP.end)+GY)/2,CUP.end,78,GY-yU(CUP.end),1.6,plaster);
    // A closed plaster slab, with separate face normals and real-scale grain.
    // Its lower face follows the old headroom plane; thickness goes into the
    // stair structure, clear of the treads and both strings.
    const pitch = Math.atan(.8), midZ = (250.5 + zF) / 2, soffitDepth = 1.8;
    B.box(370, yU(midZ) - Math.cos(pitch) * soffitDepth / 2, midZ + Math.sin(pitch) * soffitDepth / 2,
      80, soffitDepth, Math.hypot(zF - 250.5, yU(zF) - yU(250.5)), plaster, { rx: -pitch / D2R, uv: 28 });
    // a bare bulb on a pull cord, the electricity meter (its disc really spins), the fuse box
    B.cyl(370, 152.8, 320, 3.5, 3.5, 1.2, 12, mWhite, {rx:-pitch/D2R});
    const meter = new T.Group(); meter.position.set(409, GY - 145, 300); r.group.add(meter); const MT = K.into(meter);
    MT.box(-2, 0, 0, 4, 26, 18, M('#2a2a2a')); MT.plane(-4.1, -4, 0, 14, 10, M({ c: '#fff', map: K.tex('hs.meter', 128, 96, (g) => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 128, 96); A.text(g, 'kWh', 64, 20, '700 14px ' + A.UIF, '#222', 'center'); g.fillStyle = '#111'; g.fillRect(14, 30, 100, 26); g.fillStyle = '#fff'; [0, 4, 7, 2, 9].forEach((n, i) => A.text(g, String(n), 26 + i * 19, 50, '700 18px "Courier New",monospace', '#fff', 'center')); A.text(g, 'ELECTRICITY BOARD', 64, 84, '9px ' + A.UIF, '#555', 'center'); }) }), { ry: -90 });
    r.disc = MT.cyl(-4.6, 6, 0, 5, 5, 0.3, 24, M({ c: '#c8c8c8', sh: 80, sp: '#fff', map: K.tex('hs.disc', 64, 64, (g) => { g.fillStyle = '#c8c8cc'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c01a1a'; g.fillRect(28, 0, 8, 12); }) }), { rz: 90 });
    // the old portable telly on a box, the SNES on another, a tangle of leads
    const bx = B.at(385, GY, 273); bx.box(0, -22, 0, 40, 44, 34, { all: M('#b89060'), t: M({ c: '#fff', map: boxTex('TEA CHEST', '#b89060') }) }); bx.shadow(0, 0, 0, 52, 42, 0.7, { sq: true });
    const tv = new T.Group(); tv.position.set(385, GY - 44, 275); tv.rotation.y = 0; r.group.add(tv); const TV = K.into(tv);
    TV.rbox(0, -14, 2, 34, 28, 10, 1.4, M({ c: '#d8d4c8', sh: 20 })); TV.geo(taperG(30, 24, 16, 0.6), 0, -14, -11, M('#c8c4b8'));
    r.cupScreen = new T.Mesh(new T.PlaneGeometry(24, 18), new T.MeshBasicMaterial({ color: 0xffffff, map: tex('screenOff') })); flipUV(r.cupScreen.geometry); r.cupScreen.position.set(-2, -15, 7.15); tv.add(r.cupScreen);
    TV.box(13, -10, 7.2, 3, 1.4, 0.4, M('#444')); TV.box(13, -6, 7.2, 3, 1.4, 0.4, M('#444')); TV.shadow(0, 0, 0, 38, 28, 0.6, { sq: true });
    H.spot('cuptv', { label: 'The old portable telly', obj: tv, act: () => H.act('snes') });
    const sn = new T.Group(); sn.position.set(348, GY, 275); sn.rotation.y = 0; r.group.add(sn); const SN = K.into(sn); r.snesObj = sn;
    SN.box(0, -14, 0, 30, 28, 30, { all: M('#a07a4a'), t: M({ c: '#fff', map: boxTex('XMAS DECS', '#a07a4a') }) }); SN.shadow(0, 0, 0, 36, 36, 0.6, { sq: true });
    SN.rbox(0, -31.5, 0, 24, 6, 20, 1.2, M({ c: '#c8c6c0', sh: 20 })); SN.rbox(0, -35, -1, 14, 2, 8, 0.8, M('#a8a6a0'));
    SN.box(-6, -36.4, -1, 4, 1, 2.4, M('#7a5aa8')); SN.box(6, -36.4, -1, 4, 1, 2.4, M('#7a5aa8')); SN.box(0, -35.6, 6.8, 10, 1, 4, M('#5a5a5e'));
    SN.rbox(-4, -28.6, 18, 14, 2.4, 6, 1, M({ c: '#c8c6c0', sh: 20 })); SN.cyl(-8, -30, 18, 1.2, 1.2, 0.4, 4, M('#333'), { ry: 45 }); [[-1, 17, '#2a8a3a'], [0.4, 18.4, '#d02a2a'], [1.8, 17, '#2a5ad0'], [0.4, 15.6, '#e8c020']].forEach(([x, z, c]) => SN.cyl(x, -30, z, 0.6, 0.6, 0.4, 8, M(c)));
    const cords = new T.CatmullRomCurve3([new T.Vector3(0, -32, -10), new T.Vector3(9,-4,8),new T.Vector3(25,-4,16),new T.Vector3(30,-45,-2)]); SN.geo(new T.TubeGeometry(cords, 20, 0.4, 5), 0, 0, 0, M('#1a1a1a'));
    H.spot('snes', { label: 'The old console (Super Ultra)', obj: sn, act: snes });
    if(R.hasConsole&&!R.hasConsole('sn')){sn.visible=false;H.SPOTS.snes.off=true;}
    // the hoover, the ironing board, Dad's toolbox, wellies, a bag of old toys, a shelf of paint tins
    // Closed ring surfaces: actual folds, rolled rims and recessed openings,
    // not painted cards. All parts share the room's existing material batches.
    const rings=(profiles,n,fold=0)=>{
      const p=[],idx=[];
      profiles.forEach(([y,rx,rz,cx=0],j)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1+fold*Math.sin(a*7+j*.55);p.push(cx+Math.cos(a)*rx*k,y,Math.sin(a)*rz*k)}});
      for(let j=0;j<profiles.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;idx.push(a,b,d,b,c,d)}
      const cap=(j,flip)=>{const centre=p.length/3;p.push(profiles[j][3]||0,profiles[j][0],0);for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;idx.push(centre,flip?b:a,flip?a:b)}};cap(0,true);cap(profiles.length-1,false);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
    };
    const tube=(P,points,r,material,segments=20)=>{const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));P.geo(new T.TubeGeometry(curve,segments,r,6),0,0,0,material);return curve};
    const hv=B.at(345,GY,450),red=M({c:'#d02a2a',family:'plastic'}),black=M('#222'),hose=M('#444');
    // Late-90s cylinder vacuum: low wheeled chassis, clipped lid, carrying
    // handle, ribbed hose, parked floor head and the cable wound on its back.
    hv.rbox(0,-5,0,21,5,21,2,black);
    for(const x of [-9.5,9.5]){hv.cyl(x,-4,0,4,4,2.5,12,black,{rz:90});hv.cyl(x+(x<0?-1.3:1.3),-4,0,1.7,1.7,.25,10,mMetal,{rz:90})}
    hv.cyl(0,-16,0,9.2,10,22,16,red);
    hv.cyl(0,-27.5,0,10,10,1.4,16,black);
    hv.lathe(0,-28.2,0,[[9.8,0],[9.7,-2],[8.5,-5],[6,-7],[0,-7]],16,red);
    for(const x of [-7,7]){hv.rbox(x,-28,6.8,2.3,6,1.2,.4,mMetal);hv.box(x,-28,7.5,1,2,.5,black)}
    for(const x of [-4.5,4.5])hv.rbox(x,-38,0,2,7,2,.7,black);
    hv.rbox(0,-41.2,0,10.5,2,2.6,.8,black);hv.rbox(3,-35,4,3,1.2,3,.4,mWhite);
    hv.cyl(0,-18,0,9.6,9.8,4,16,black);
    const hc=tube(hv,[[7,-23,-6],[9,-38,-6],[2,-47,-1],[-5,-39,-8],[-5,-16,-9],[-4,-7,-9]],1.15,hose,24);
    for(let i=1;i<20;i++){const t=i/20,p=hc.getPoint(t),q=hc.getTangent(t),g=new T.TorusGeometry(1.2,.22,4,8);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),q)));hv.geo(g,p.x,p.y,p.z,black)}
    hv.rbox(-2,-3,-9.5,18,4,5,1.1,hose);hv.box(-2,-1,-12.1,14,1,.35,black);
    for(let i=0;i<3;i++)hv.geo(new T.TorusGeometry(6.4,.38,4,18),0,-16,9.7+i*.65,black);
    for(const y of [-23,-9])hv.rbox(0,y,10,3,2,3,.4,black);
    hv.rbox(6,-7,10,2.4,3,1.8,.4,black);
    for(const a of [-30,20])hv.box(Math.sin(a*D2R)*9.75,-13,Math.cos(a*D2R)*9.75,1.4,.35,.18,mMetal,{ry:a});
    hv.shadow(0,0,0,30,30,.7);
    // Folded ironing board: rounded padded nose, woven cover and the folded
    // steel frame behind it. Store it upright along the east lining, with its
    // rounded foot on the carpet and the folded legs clear of the doorway.
    const ib = B.at(403, GY - 66 - .8, 359, 90);
    const outline = new T.Shape();
    outline.moveTo(-15.5, 62); outline.lineTo(-15.5, -40);
    outline.quadraticCurveTo(-15.5, -69, 0, -69); outline.quadraticCurveTo(15.5, -69, 15.5, -40);
    outline.lineTo(15.5, 62); outline.quadraticCurveTo(15.5, 66, 11.5, 66); outline.lineTo(-11.5, 66); outline.quadraticCurveTo(-15.5, 66, -15.5, 62);
    outline.closePath();
    const cover = K.tex('hs.ironing.cover',128,128,g=>{g.fillStyle='#b9c9c6';g.fillRect(0,0,128,128);g.strokeStyle='rgba(76,100,104,.2)';g.lineWidth=1;for(let n=0;n<128;n+=8){g.beginPath();g.moveTo(n,0);g.lineTo(n,128);g.moveTo(0,n);g.lineTo(128,n);g.stroke()}});
    ib.geo(new T.ExtrudeGeometry(outline,{depth:1.4,bevelEnabled:true,bevelSize:.8,bevelThickness:.5,bevelSegments:2,curveSegments:10}),0,0,0,M({c:'#fff',map:cover,sh:2}),{uv:24});
    for(const sg of [-1,1]){ib.cyl(0,13,-2,.8,.8,96,10,M('#a3aaa7'),{rz:sg*13});ib.rbox(sg*11,59,-2,6,3,3,.7,M('#656c6b'));}
    ib.cyl(0,13,-3.3,2,2,1.2,12,mMetal,{rx:90});
    ib.rbox(0,7,2.1,2.2,6,.8,.3,M('#888b80'));
    B.shadow(401,GY,359,8,35,.35,{sq:true});
    const tb=B.at(352,GY,510),enamel=M({c:'#c82a1a',sh:50,sp:'#555'}),toolDark=M('#333');
    // Pressed-steel toolbox, shut: rolled lid, folded seam,
    // real clasp straps, back hinges, handle brackets and rubbed paint edges.
    tb.rbox(0,-8,0,38,14,18,1.1,enamel);
    tb.rbox(0,-14.7,0,39,.8,19,.4,toolDark);tb.rbox(0,-16,0,39,2,19,1,enamel);
    for(const x of [-12,12]){
      tb.rbox(x,-13,-9.7,3.2,5,.7,.3,mMetal);tb.box(x,-12,-10.15,1.8,1.4,.3,toolDark);
      tb.cyl(x,-15,9.7,.7,.7,5,8,mMetal,{rz:90});
      tb.rbox(x/2,-19.2,0,1.7,5,2,.4,mMetal);
    }
    tb.rbox(0,-22.4,0,14,1.8,2.2,.6,toolDark);
    for(const z of [-6,6])tb.rbox(0,-17.2,z,28,.5,.8,.25,enamel);
    for(const x of [-17,16]){tb.box(x,-4,-9.04,2,.45,.12,mMetal);tb.box(x,-10,-9.04,.6,1.8,.12,mMetal)}
    for(const z of [-6,6])tb.rbox(0,-.7,z,28,1.4,2,.4,toolDark);
    tb.shadow(0,0,0,46,26,.6,{sq:true});
    const bg=B.at(393,GY,508),canvas=M({c:'#e8e4dc',family:'fabric'}),toyBlue=M('#5a8ad0'),toyYellow=M('#f0c000');
    // Heavy folded sack, with a thick rolled mouth and a real inner bowl.
    bg.geo(rings([[0,8,6],[-3,11.5,9],[-11,12.5,10.3],[-21,11.8,9.8],[-28,7,6],[-31,7.6,6.4],[-31,6.5,5.3],[-26,6,4.8],[-25,0,0]],20,.055),0,0,0,canvas);
    for(const side of [-1,1])tube(bg,[[side*6,-29,-3],[side*8,-37,-2],[side*7,-38,1],[side*6,-29,3]],.65,canvas,10);

    // A little wooden engine and a teddy poke out; no invented brand lettering.
    const train=bg.at(-2,-30,-1,-12);train.rbox(0,-2,0,13,4.5,5,.5,toyBlue);train.rbox(-4,-5,0,4,5,5,.4,toyBlue);
    train.cyl(3,-6,0,1,1,4,8,toolDark);
    for(const x of [-5,0,4])for(const z of [-2.7,2.7])train.cyl(x,0,z,1.6,1.6,.7,8,toolDark,{rx:90});
    const bear=bg.at(7,-31,6,12);bear.ball(0,0,0,2.7,3.5,2.4,toyYellow,10);bear.ball(0,-5,0,3.2,3.1,2.8,toyYellow,10);
    for(const x of [-2.6,2.6]){bear.ball(x,-7.1,0,1.15,1.15,.9,toyYellow,8);bear.ball(x,.2,.5,1.3,2,1.2,toyYellow,8)}
    bear.ball(0,-4,2.5,1.7,1.1,1,canvas,8);bear.ball(0,-4.5,3.3,.5,.4,.35,toolDark,8);
    for(const x of [-1.2,1.2])bear.ball(x,-5.5,2.5,.3,.35,.25,toolDark,6);
    bg.shadow(0,0,0,30,26,.6);
    const sh = B.at(409, GY - 120, 360); sh.box(-8, 0, 0, 16, 2, 60, M({ c: '#fff', map: tex('pine') })); [[-8, -16], [-8, 0], [-8, 16]].forEach(([x, z], i) => sh.cyl(x, -7, z, 5, 5, 12, 14, M(['#e8e4dc', '#a8c8e0', '#f0d080'][i])));
    // Low storage: paired moulded wellies and the tree carton, with real
    // soles, shafts, lid and packing straps; reuse the cupboard's paints.
    for(const z of [476,490]){
      const boot=B.at(345,GY,z),rubber=M({c:'#29352e',map:K.tex('hs.boot.rubber',128,128,(g,w,h)=>{g.fillStyle='#d6d7ce';g.fillRect(0,0,w,h);const r=K.rnd(515);for(let n=0;n<1100;n++){g.fillStyle=n%3?'rgba(26,34,26,.18)':'rgba(221,215,189,.22)';g.fillRect(r()*w,r()*h,.8+r()*2,.6+r())}for(let n=0;n<30;n++){const x=r()*w,y=r()*h;g.strokeStyle='rgba(234,225,194,.26)';g.lineWidth=.65;g.beginPath();g.moveTo(x,y);g.lineTo(x+2+r()*8,y+1);g.stroke()}},{world:20}),sh:7,sp:'#1d2521'}),scuff=M('#5a5a5e');
      // Rounded toe and instep extruded across the foot, with a distinct heel,
      // thick treaded outsole and tapered hollow shaft. Both boots are solid.
      boot.rbox(0,-1.3,0,22,2.6,11,1.1,rubber);boot.rbox(-7,-2.8,0,6,3,10,.6,rubber);
      const foot=new T.Shape();foot.moveTo(-10,-2.6);foot.lineTo(10,-2.6);foot.quadraticCurveTo(11,-5,9,-6.7);foot.quadraticCurveTo(5,-9.2,0,-9.8);foot.lineTo(-5,-12);foot.lineTo(-9,-8);foot.closePath();
      const fg=new T.ExtrudeGeometry(foot,{depth:9.2,bevelEnabled:true,bevelSize:.45,bevelThickness:.3,bevelSegments:1,curveSegments:4});fg.translate(0,0,-4.6);boot.geo(fg,0,0,0,rubber);
      boot.geo(rings([[-7,4.4,4.5,-4.5],[-11,4,4.2,-4.5],[-23,4.1,4.4,-4.7],[-30.6,4.8,5,-5],[-32,4.9,5.1,-5],[-32,4.1,4.3,-5],[-28.5,3.9,4.1,-5],[-28.5,0,0,-5]],12),0,0,0,rubber);
      boot.cyl(-5,-28.6,0,3.7,3.7,.2,12,scuff);
      for(const x of [-8,-4,0,4,8])boot.rbox(x,-.6,0,1.2,1.2,9,.25,scuff);
      for(const zz of [-4.6,4.6])boot.rbox(7,-5.2,zz,2.8,.35,.15,.06,scuff);
      boot.cyl(-9.1,-20,0,.2,.2,20,6,rubber);
      boot.shadow(0,0,0,25,14,.35,{sq:true});
    }
    const tree=B.at(383,GY,533),carton=M({c:'#a07a4a',family:'paper'});
    tree.box(0,-9,0,42,18,24,{all:carton,t:M({c:'#fff',map:boxTex('XMAS TREE','#a07a4a')})});
    for(const x of [-12,12]){tree.box(x,-18.2,0,1.5,.4,24,mDark);tree.box(x,-9,12.15,1.5,18,.3,mDark)}
    tree.shadow(0,0,0,46,28,.45,{sq:true});
    batch.build(r.group);
    // the light (a pull cord)
    const bl = new T.Group(); bl.position.set(370, 153, 320); r.group.add(bl); const BL = K.into(bl);
    BL.cyl(0, 17, 0, .3, .3, 34, 6, M('#eee')); BL.cyl(0,37,0,2,2,6,12,mWhite);
    BL.cyl(0,42,0,1.25,1.25,4,12,M('#e8e2d4'));
    r.bulbMesh = BL.ball(0, 47, 0, 3.4, 4.4, 3.4, M({ c: '#f4f0e0', e: '#000' }).clone(), 16);
    BL.cyl(6, 46, 0, .15, .15, 90, 6, M('#ddd')); BL.ball(6, 92, 0, .9, 1.4, .9, M('#e8e0c8'), 8);
    H.spot('hs.cord', { label: 'Light cord', obj: bl, act: () => { lightsOn.cupboard = !lit('cupboard');saveHouseLights(); secret('hs.cupboard'); cupLight(r); H.relight(); window.Sound?.world('switch'); } });
    wrapSpot('hs.cup.box', { label: 'Box of old games', act: () => say('Box of old games', 'My old games box: Segue manuals with no games, a broken Segue Gear, and a Teeny Loons sticker book.') }); pickBox(r, 'hs.cup.box', 385, GY - 20, 273, 40, 44, 34);
    wrapSpot('hs.cup.bag', { label: 'Bag of old toys', act: () => say('Bag of old toys', 'Him-Bloke, a Big Trek with no batteries, half a Ker-Plonk, and every Wonder Egg toy from 1993.') }); pickBox(r, 'hs.cup.bag', 393, GY - 20, 508, 28, 40, 24);
    wrapSpot('hs.cup.shelf', { label: 'Shelf of paint tins', act: () => say('Paint tins', 'Magnolia, magnolia, "Barley White" (magnolia), and a tiny pot of the blue from my room.') }); pickBox(r, 'hs.cup.shelf', 400, GY - 128, 360, 16, 14, 60);
    H.spot('hs.hoover', { label: 'The vacuum', act: () => (window.Chores && Chores.take && Chores.take('hoover')) || loadLife().then(() => HouseLife.chore('hoover'), () => {}) }); pickBox(r, 'hs.hoover', 345, GY - 26, 450, 24, 52, 24);
    H.spot('hs.meter', { label: 'Electricity meter', obj: meter, act: () => say('Electricity meter', 'The little disc goes round faster when the immersion heater\'s on. Dad watches it like it\'s the Grand National.') });
    H.spot('hs.tools', { label: "Dad's toolbox", act: sayLines('hs.tools', "Dad's toolbox", ['Do NOT touch Dad\'s toolbox. (A spirit level, 400 screws, no screwdriver.)']) }); pickBox(r, 'hs.tools', 352, GY - 12, 510, 40, 24, 20);
    H.ambient.add(() => { if (r.disc && r.group.visible) r.disc.rotation.y += lit('cupboard') ? 0.08 : 0.03; });
    H.walkRect('G',334,254,406,CUP.end,{room:'cupboard'});
    H.walkRect('G',326,CUP.a0,338,CUP.a1,{door:'cupboard',room:'hall'});
    H.block('G',365,253,405,293,{top:GY-44});
    H.block('G',332,255,364,298,{solid:false});
    H.solid('G',333,260,363,290,GY-28,GY,{kind:'fixed'});
    H.solid('G',336,265,360,285,GY-37,GY-28,{kind:'fixed'});
    H.support('cupboard',334,261,362,289,GY-28);
    H.solid('G',368,255,402,283,GY-72,GY-44,{kind:'fixed'});
    H.support('cupboard',365,256,405,290,GY-44);
    H.solid('G',398,343,407,376,GY-137,GY,{kind:'fixed'});
    H.solid('G',393,330,409,390,GY-134,GY-119,{kind:'fixed'});
    H.solid('G',403,290,409,310,GY-158,GY-132,{kind:'fixed'});
    H.solid('G',333,438,357,463,GY-52,GY,{kind:'fixed'});
    H.solid('G',331,500,373,520,GY-24,GY,{kind:'fixed'});
    H.solid('G',379,496,407,520,GY-40,GY,{kind:'fixed'});
    H.solid('G',334,469,356,497,GY-33,GY,{kind:'fixed'});
    H.solid('G',362,521,404,545,GY-18,GY,{kind:'fixed'});
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
  const loadJs = src => (window.Apps && Apps.load) ? Apps.load(src) : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = PACK_STAMP ? src + (src.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(PACK_STAMP) : src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  const rectOf = obj => { const b = new T.Box3().setFromObject(obj); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = H.toScreen(x, -y, z); if (!p) continue; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); } return { getBoundingClientRect: () => ({ left: x0, top: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0), right: x1, bottom: y1 }) }; };

  // ================================================================ THE LOUNGE (the family telly, the video, the phone, the fire)
  const LT = { x: -60, z: 340 }; // the telly
  // The lounge's big furniture (also js/np-life.js seats, js/ch-lounge.js cushions; js/hs-world.js pv 5 moved saved things clear).
  const SOFA = { x: -60, z: 605, w: 190 }, CHAIR = { x: 136, z: 400, ry: -110, w: 86 }, COFFEE = { x: -72, z: 456.5, w: 90, d: 44 }, LAMPST = { x: 176, z: 324 };
  function buildLounge(r) {
    r.fireOn=lightsOn.loungeFire===true;
    r.peopleSeats=[]; // Original model surfaces for rig contacts; no extra destinations.
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallpaperLounge') });
    shell(B, { x0: -280, z0: 305, x1: 195, z1: 700, fy: GY, cy: GC, wall, fadedSide:'s',fadedWall:M({c:'#fff',map:K.tex('hs.paper.sunfade',512,512,(q,w,h)=>{q.drawImage(tex('wallpaperLounge').image,0,0,w,h);q.fillStyle='rgba(250,244,216,.2)';q.fillRect(0,0,w,h)},{world:128,family:'plaster'})}),floor: false, fuv: 44, thin: { s: 0.8 }, holes: { e: [[480, 560, GY - 205, GY]], s: [[-170, 50, 150, 300]] } });
    thresholdFloor(B,305,700,520,M({c:'#fff',map:tex('carpetRed')}),44);
    // a picture rail and a dado-ish border
    const rail = M({ c: '#fff', map: tex('oak') });
    [[-42.5, 305.8, 475, 0], [-280 + 0.8, 502.5, 395, 90]].forEach(([x, z, len, ry]) => B.box(x, GC + 40, z, len, 3, 1.6, rail, { ry }));
    // the bay window at the front: net curtains, heavy curtains, the street outside
    const sw = -60;
    B.box(sw,225,708,220,150,.45,K.glazing(.36));
    // Shared solid neighbourhood beyond the glass, not a painted street card.
    [[sw - 110, 0], [sw + 110, 0], [sw, 0]].forEach(([x], i) => B.box(x, 225, 703, i === 2 ? 5 : 8, 150, 8, M({ c: '#f2f0ea', sh: 40 })));
    B.box(sw, 147, 703, 220, 6, 8, M('#f2f0ea')); B.box(sw, 300, 708, 236, 4, 18, mWhite); B.box(sw, 297, 700 - 4, 236, 3, 9.6, mWhite);
    const net = M({ c: '#fff', map: netTex(), tr: true, o: .85, dw:false, sh:2 });
    // Closed voile with shallow folds: no repeated dots or high-frequency mesh.
    const voile=new T.BoxGeometry(214,140,.14,48,1,1),vp=voile.attributes.position;
    for(let i=0;i<vp.count;i++)vp.setZ(i,vp.getZ(i)+Math.sin(vp.getX(i)/214*Math.PI*16)*.85);
    const vu=voile.attributes.uv;for(let i=0;i<vu.count;i++)vu.setY(i,1-vu.getY(i));
    voile.computeVertexNormals();B.geo(voile,sw,222,696,net,{ry:180});
    curtainG(B, sw - 136, 140, 690, 46, 210, M({ c: '#fff', map: curtTex() })); curtainG(B, sw + 136, 140, 690, 46, 210, M({ c: '#fff', map: curtTex() }));
    B.cyl(sw, 134, 690, 1.6, 1.6, 340, 10, mBrass, { rz: 90 });
    // the fireplace on the west wall: a chimney breast, a tiled hearth, a gas fire, the mantelpiece
    const fp = B.at(-280, GY, 500);
    fp.box(20, -129, 0, 40, GY - GC, 150, M({ c: '#fff', map: tex('wallpaperLounge') }), { uv: 128, sides: 'rfb' });
    fp.box(42, -1, 0, 26, 2, 110, M({ c: '#fff', map: tileTex() }));
    fp.box(41, -112, 0, 14, 4, 140, M({ c: '#fff', map: tex('oak') }));
    fp.box(41, -58, 0, 3, 106, 112, M({ c: '#fff', map: tex('oak') })); [-1, 1].forEach(sd => fp.box(42.5, -52, sd * 50, 4, 96, 12, M({ c: '#fff', map: tex('oak') }))); fp.box(42.5, -104, 0, 4, 12, 112, M({ c: '#fff', map: tex('oak') })); // the wooden surround
    fp.plane(43.6, -52, 0, 84, 80, M({ c: '#fff', map: tileTex() }), { ry: 90 }); fp.box(43, -36, 0, 4, 58, 56, M('#1a1512')); // tiled inset, the dark opening
    // A proper coal-effect gas fire in the opening, not a black slab: a polished brass frame and canopy hood, the burner
    // fret along the bottom with its control knob, the fire box behind the coals.
    { const brass = M({ c: '#bfa05c', sh: 38, sp: '#554527' }), blackSteel = M({ c: '#202020', sh: 30, sp: '#555' });
      fp.box(45.6, -66.5, 0, 2, 3, 62, brass); fp.box(45.6, -6.2, 0, 2, 2.4, 62, brass); for (const sd of [-1, 1]) fp.box(45.6, -36.4, sd * 29.5, 2, 57.8, 3, brass);
      fp.box(48.2, -62, 0, 6, 3.4, 58, brass, { rz: -28 }); fp.box(47, -10.5, 0, 4, 6.5, 54, blackSteel);
      for (let k = -4; k <= 4; k++) fp.box(49.1, -10.5, k * 5.6, .4, 4.6, 2.2, brass);
      fp.cyl(47.6, -10.5, 24.5, 1.7, 1.7, 1.4, 14, brass, { rz: 90 }); }
    for (let i = 0; i < 9; i++) fp.ball(44 + (i % 3) * 1.5, -8 - Math.floor(i / 3) * 5, -16 + (i % 5) * 8 + Math.floor(i / 5) * 3, 4, 3, 4, M({ c: ['#2a2220', '#3a2a24', '#201a18'][i % 3], sh: 20 }), 7); // the fake coals
    [-18, -6, 6, 18].forEach(z => fp.box(46, -14, z, 1, 1, 1.2, M('#444'), { rz: 0 })); fp.box(46, -17, 0, 1.2, 1.2, 40, M({ c: '#c8a040', sh: 60 })); // the grate bars and brass trim
    fp.box(58, -4, 0, 30, 8, 1.6, M({ c: '#c8a040', family: 'brass' }), { ry: 90 }); [-1, 1].forEach(sd => fp.box(50, -4, sd * 55, 16, 8, 1.6, M({ c: '#c8a040', family: 'brass' }))); // the brass fender
    r.flames = []; for (let i = 0; i < 5; i++) { const f = new T.Mesh(new T.PlaneGeometry(9, 14), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.0, depthWrite: false })); f.position.set(-280 + 45.5, GY - 22, 500 - 20 + i * 10); f.rotation.y = 90 * D2R; r.group.add(f); r.flames.push(f); }
    // on the mantelpiece: a carriage clock, photos, cards
    const mp = B.at(-280 + 44, GY - 114, 500);
    mp.box(0, -8, 0, 7, 16, 12, mBrass); mp.disc(3.6, -9, 0, 4, M('#f8f4e8'), 18, { rz: 90, ry: 90 });
    [[-40, '#2a5a9a'], [-26, '#9a2a5a'], [30, '#3a7a3a']].forEach(([z, c]) => { mp.box(0, -8, z, 2, 14, 11, M('#c8a040')); mp.plane(1.2, -8, z, 9, 12, M({ c: '#fff', map: photoTex(c) }), { ry: 90 }); });
    mp.box(0, -9, 44, 1, 16, 12, M('#f4f0e0'), { ry: 20 }); mp.box(0, -8, 52, 1, 14, 10, M('#e8d8f0'), { ry: -15 });
    // the family telly on its stand, the video underneath, the tapes
    buildTelly(r, B);
    // the sofa (3-seater, floral) facing the telly, Dad's armchair, the coffee table
    // Keep the main chair/table aisle over a metre wide, with 80 cm crossways
    // between the slimmer table, telly and settee. Dad's chair stays angled at the screen.
    sofa(B, SOFA.x, SOFA.z, 180, SOFA.w, M({ c: '#fff', map: sofaTex(), sh: 2, sp: '#080808' }),r);
    sofa(B, CHAIR.x, CHAIR.z, CHAIR.ry, CHAIR.w, M({ c: '#fff', map: sofaTex(), sh: 2, sp: '#080808' }),r);
    const ct = B.at(COFFEE.x, GY, COFFEE.z), coffeeOak = M({ c: '#fff', map: tex('oak') });
    ct.rbox(0, -42, 0, COFFEE.w, 3, COFFEE.d, .7, coffeeOak);
    [[-40, -17.5], [40, -17.5], [-40, 17.5], [40, 17.5]].forEach(([x, z]) => ct.rbox(x, -20.5, z, 4, 41, 4, .4, coffeeOak));
    for (const z of [-17.5,17.5]) ct.box(0,-37,z,78,7,2,coffeeOak);
    for (const x of [-40,40]) ct.box(x,-37,0,2,7,33,coffeeOak);
    ct.rbox(0, -8, 0, 82, 2, 37, .4, coffeeOak);
    if(window.Magazines)Magazines.makePaper('hs.tvguide',{room:'lounge',x:COFFEE.x-28,y:GY-43.5,z:COFFEE.z+6,ry:-12},guideTex(),.8);
    else ct.box(-28,-44,6,21,.8,28,{t:M({c:'#fff',map:guideTex()}),all:M('#f0eee8')},{ry:-12});
    ct.box(20, -45, -6, 12, 3, 10, M({ c: '#fff', map: tex('pillow') }));
    ct.lathe(28,-43.5,10,[[0,-0.7],[4.4,-0.7],[6.4,-2.4],[7.7,-4.3],[8,-4.2],[8.2,-3.9],[6.8,-1.7],[4.8,0],[0,0]],32,M({c:'#c9d7de',sh:65,sp:'#777f84'}));
    ct.shadow(0, 0, 0, 106, 56, 0.65, { sq: true });
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
    const sl=B.at(LAMPST.x,GY,LAMPST.z);sl.cyl(0,-1.5,0,14,15,3,28,M('#2a2a2a'));sl.cyl(0,-77,0,1,1,151,12,mBrass);
    r.standardShadeMaterial=M({c:'#e8d2a4',sh:7}).clone();
    sl.lathe(0,-158,0,[[11.6,-13.2],[12,-13.4],[20.2,12.8],[20.1,13.3],[19.6,13.3],[11.2,-12.7],[11.6,-13.2]],32,r.standardShadeMaterial);
    for(const yy of [-171.3,-144.7])sl.geo(new T.TorusGeometry(yy===-171.3?11.6:19.9,0.22,5,40),0,yy,0,M('#bba67f'),{rx:90});
    sl.cyl(0,-151,0,2,2,5,16,M('#d5cbb6'));sl.cyl(0,-154.5,0,1.1,1.1,4,14,mMetal);r.standardBulbMaterial=M({c:'#f7e9cd',e:'#000000',sh:18}).clone();sl.ball(0,-160,0,3.1,4,3.1,r.standardBulbMaterial,20);sl.shadow(0,0,0,36,36,0.6);
    B.rbox(194.4,GY-18,360,1.2,8,12,0.4,mWhite);B.rbox(193.1,GY-18,360,1.4,3.8,3.3,0.3,M('#353536'));B.cyl(192,GY-18,360,0.5,0.5,0.8,10,M('#29292b'),{rz:90});
    r.standardLampCable=routedCord(B,[[LAMPST.x+14.8,GY-1.5,LAMPST.z],[LAMPST.x+16,GY-0.5,LAMPST.z+2],[192.7,GY-0.5,LAMPST.z+8],[192.7,GY-0.5,366],[192.7,GY-11,366],[191.8,GY-18,360]],'#33312d');
    // A real cabinet, not a solid block hiding everything behind its glass.
    const dc=B.at(-180,GY,315),oak=M({c:'#fff',map:tex('oak')});
    for(const x of [-44,44])dc.box(x,-60,6,2,120,30,oak,{uv:50});
    dc.box(0,-119,6,86,2,30,oak,{uv:50});dc.box(0,-1,6,86,2,30,oak,{uv:50});dc.box(0,-60,-8.4,86,116,1.2,M('#54402b'));
    for(const y of [-92,-58,-24])dc.box(0,y,6,86,2,28,oak,{uv:50});
    for(let side=0;side<2;side++){
      const door=new T.Group(),base=-222+side*42;door.position.set(base,GY,336+side*2.3);r.group.add(door);const D=K.into(door);
      for(const x of [1,41])D.box(x,-60,0,2,116,2,oak,{uv:50});for(const y of [-117,-3])D.box(21,y,0,40,2,2,oak,{uv:50});
      D.box(21,-60,-.2,38,110,.55,K.glazing(.48));D.rbox(side?34:8,-64,1.4,1.2,7,1.2,0.3,mBrass);
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
    const ceilingShade=ceilingGlow(r,'#f8f0e0','#51412b'),ceilingBulb=ceilingGlow(r,'#eee6ce','#ffcf91');
    [0, 120, 240].forEach(a => { const x = Math.cos(a * D2R) * 16, z = Math.sin(a * D2R) * 16; cl.cyl(x / 2, 30, z / 2, 0.5, 0.5, 18, 4, mBrass, { rz: 90, ry: -a }); cl.lathe(x,28,z,[[1.5,-2],[1.8,-2],[6.3,8],[6,8],[1.5,-2]],18,ceilingShade);cl.ball(x,32,z,2,2.8,2,ceilingBulb,10); });
    // a radiator under the window, a picture over the sofa
    B.box(-60, GY - 34, 694, 160, 54, 3.6, { all: M('#e8e5dc'), b: M({ c: '#fff', map: tex('radiator') }) });
    const pic = B.at(-280 + 41.5, GY - 175, 500, 90); pic.wshadow(1, 2, -1.3, 86, 62, 0.5); pic.box(0, 0, 0, 80, 56, 2.4, M('#6a4a2a')); pic.plane(0, 0, 1.3, 72, 48, M({ c: '#fff', map: landTex(), pr: 1 }));
    batch.build(r.group);
    // spots
    wrapSpot('hs.sofa', { label: 'The sofa', act: sayLines('hs.sofa', 'The sofa', ['Down the back of the sofa: 37p, a hair bobble, a Buildo man and a fossilised Waver.', 'Dad\'s end, Mom\'s end, and the middle bit where the spring goes.']) }); pickBox(r, 'hs.sofa', SOFA.x, GY - 30, SOFA.z, SOFA.w, 60, 85);
    H.spot('hs.chair', { label: "Dad's chair", act: sayLines('hs.chair', "Dad's chair", ['Dad\'s chair. Nobody sits in Dad\'s chair. It is the law.', 'It has a dent in the exact shape of Dad.']) });pickChair(r);
    H.spot('hs.fire', { label: 'The gas fire', act: () => { r.fireOn = !r.fireOn;lightsOn.loungeFire=r.fireOn;saveHouseLights(); H.relight(); say('The gas fire', r.fireOn ? 'Click click click WHUMP. The fake coals glow orange. Toasty.' : 'Off. Mom says not to leave it on, it costs a fortune.'); } }); pickBox(r, 'hs.fire', -280 + 44, GY - 50, 500, 6, 100, 104);
    H.spot('hs.mantel', { label: 'The mantelpiece', act: sayLines('hs.mantel', 'The mantelpiece', ['A carriage clock (ten minutes fast, on purpose, so we\'re never late), my school photo from Year 7 (bowl haircut, braces), and {sister}\'s ballet certificate.', 'The school photo. Mom refuses to take it down. I have asked. Many times.']) }); pickBox(r, 'hs.mantel', -280 + 44, GY - 124, 500, 10, 22, 140);
    H.spot('hs.cabinet', { label: 'Display cabinet', act: sayLines('hs.cabinet', 'The display cabinet', ['Mom\'s best glasses, a crystal swan, and a souvenir plate from the seaside. We are not allowed to open it. We have never opened it.']) }); pickBox(r, 'hs.cabinet', -180, GY - 60, 322, 90, 120, 26);
    H.spot('hs.guide', { label: 'The TV guide', act: () => { if (window.HouseTelly) HouseTelly.guide(); else say('The TV guide', 'This week\'s telly, circled in Dad\'s biro.'); } }); pickBox(r, 'hs.guide', COFFEE.x-28, GY - 45, COFFEE.z+6, 24, 3, 30);
    H.spot('hs.lamp', { label:()=>standardLampOn()?'Standard lamp: switch off':'Standard lamp: switch on', act: () => { lightsOn.loungeLamp=!standardLampOn();saveHouseLights();standardLampLook(r);H.relight();window.Sound?.world('switch'); } }); pickBox(r,'hs.lamp',LAMPST.x,GY-100,LAMPST.z,42,200,42);standardLampLook(r);
    H.spot('hs.window', { label: 'The bay window', act: () => say('The bay window', ['Through the nets: the street, the lamp-post, next door\'s estate car.', 'The milk float hums past. Mom has a pint of gold top and a yoghurt on order.', 'Somebody\'s walking a dog. The dog has a little coat on.'][((r.wn = (r.wn | 0) + 1)) % 3]) }); pickBox(r, 'hs.window', -60, 225, 694, 220, 150, 6);
    // walking
    H.walkRect('G', -278, 307, 193, 698, { room: 'lounge' });
    H.block('G', LT.x - 48, 305, LT.x + 48, 352); // the telly
    H.block('G',SOFA.x-SOFA.w/2-2,SOFA.z-44,SOFA.x+SOFA.w/2+2,SOFA.z+43);H.block('G',79,343,192,457,{solid:false});H.block('G',COFFEE.x-47,COFFEE.z-24,COFFEE.x+47,COFFEE.z+24); // full sofa/chair footprints, not just their seat centres
    H.block('G', 146, 588, 194, 634); H.block('G', -230, 305, -130, 342); H.block('G', -280, 420, -230, 580); H.block('G', LAMPST.x - 16, LAMPST.z - 16, LAMPST.x + 16, LAMPST.z + 16); H.block('G', -268, 646, -232, 676);
    H.support('lounge', COFFEE.x-45, COFFEE.z-22, COFFEE.x+45, COFFEE.z+22, GY - 43.5); H.support('lounge', 150, 592, 190, 628, GY - 65.5); H.support('lounge', -280, 430, -230, 570, GY - 114);
    H.support('lounge',152,594,188,626,GY-21); // the phone book's lower shelf
  }
  // Follow the solid upholstery, leaving the air over the seat pickable.
  // The former full-height box intercepted F on the cushion inside it.
  function pickChair(r){
    const g=new T.Group(),P=K.into(g),w=CHAIR.w,e=.12;
    g.name='chair-upholstery-pick';g.position.set(CHAIR.x,GY-47,CHAIR.z);g.rotation.y=CHAIR.ry*D2R;
    P.rbox(0,29,4,w-4+e,24+e,74+e,5,PICK);
    P.rbox(0,-9,-36,w+e,56+e,12+e,6,PICK);
    P.rbox(0,10,2,w-40+e,16+e,62+e,7,PICK);
    P.rbox(0,-17,-26,w-40+e,44+e,16+e,7,PICK,{rx:8});
    for(const side of [-1,1]){P.rbox(side*(w/2-9),11,4,18+e,40+e,78+e,8,PICK);P.rbox(side*(w/2-9),-11,4,20+e,8+e,80+e,4,PICK)}
    for(const x of [-1,1])for(const z of [-1,1])P.cyl(x*(w/2-10),44,4+z*34,3.06,3.66,6.12,10,PICK);
    g.traverse(o=>{if(o.isMesh)o.userData.spot='hs.chair'});r.group.add(g);H.spot('hs.chair',Object.assign({},H.SPOTS['hs.chair'],{obj:g}));
  }
  function routedCord(B,pts,col){
    const points=pts.map(p=>new T.Vector3(...p)),curve=new T.CurvePath();let from=points[0];
    for(let i=1;i<points.length-1;i++){const p=points[i],r=Math.min(1,p.distanceTo(points[i-1])*0.2,p.distanceTo(points[i+1])*0.2),a=p.clone().add(points[i-1].clone().sub(p).setLength(r)),b=p.clone().add(points[i+1].clone().sub(p).setLength(r));curve.add(new T.LineCurve3(from,a));curve.add(new T.QuadraticBezierCurve3(a,p,b));from=b}
    curve.add(new T.LineCurve3(from,points[points.length-1]));B.geo(new T.TubeGeometry(curve,72,0.25,6),0,0,0,M({c:col,sh:10}));return curve.getSpacedPoints(160).map(p=>p.toArray());
  }
  function sofa(B, x, z, ry, w, m, room) {
    const S = B.at(x, GY, z, ry), pipe = M({ c: '#8a6a4a', family:'fabric' });
    // All upholstered faces use the same centimetres-per-repeat. Stretching
    // one floral tile over each box made the plinth flowers enormous and
    // flattened them into stripes along the arms and cushion edges.
    const fabric = { uv: 60 };
    S.rbox(0, -18, 4, w - 4, 24, 74, 5, m, fabric);
    S.rbox(0, -56, -36, w, 56, 12, 6, m, fabric);
    const n = w > 120 ? 3 : 1, gap = 1.2, cw = (w - 40 - (n - 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * (cw + gap);
      if(room){const a=ry*D2R,c=Math.cos(a),s=Math.sin(a),side=cx>0||n===1?1:-1,arm=side*(w/2-9),support=n===1||i===0||i===n-1?{side:side>0?'L':'R',x:x+arm*c+24*s,y:GY-63.3,z:z-arm*s+24*c}:{side:'L',x:x+(cx+12)*c+35*s,y:GY-43.3,z:z-(cx+12)*s+35*c,edge:true,yaw:a+Math.PI};
        room.peopleSeats.push({id:n===1?'armchair':'sofa'+i,room:'lounge',lvl:'G',x:x+cx*c+2*s,z:z-cx*s+2*c,face:ry,h:45,back:true,front:33,footForward:54,support});}
      // A small compression into the deck and back pads closes the former
      // daylight joins without hiding the separate cushion silhouettes.
      S.geo(K.softBox(cw,16,62,7,i+1,.11),cx,-37,2,m,fabric);
      cushionPiping(S,cx,-37,2,cw-.1,61.9,7,pipe);
      S.geo(K.softBox(cw,44,16,7,i+3),cx,-64,-26,m,{rx:8,uv:60});
    }
    [-1, 1].forEach(s => {
      S.rbox(s * (w / 2 - 9), -36, 4, 18, 40, 78, 8, m, fabric);
      S.rbox(s * (w / 2 - 9), -58, 4, 20, 8, 80, 4, m, fabric);
    });
    if(n===3){S.geo(K.softBox(26,28,10,4.5,1),-w/2+34,-58,-13,M({c:'#7a2a2a',family:'fabric'}),{ry:12,rx:12,rz:6});S.geo(K.softBox(26,28,10,4.5,4),w/2-40,-58,-13,M({c:'#c8a850',family:'fabric'}),{ry:-18,rx:12,rz:-4})}
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => S.cyl(a * (w / 2 - 10), -3, 4 + b * 34, 3, 3.6, 6, 10, M('#3a2414'))); // feet
    if (n === 1) {
      // Keep the walking footprint, but let carried objects reach the real seat
      // rather than meeting the former invisible floor-to-ceiling block.
      const a = ry * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
      const part = (lx, cy, lz, width, height, depth) => H.solid('G', null, null, null, null,
        GY + cy - height / 2, GY + cy + height / 2, {
          x: x + lx * c + lz * sn, z: z - lx * sn + lz * c,
          hx: width / 2, hz: depth / 2, ry, kind: 'lounge-chair'
        });
      part(0, -18, 4, w - 4, 24, 74);
      part(0, -56, -36, w, 56, 12);
      part(0, -37, 2, cw, 16, 62);
      const tilt = 8 * Math.PI / 180;
      part(0, -64, -26, cw, 44 * Math.cos(tilt) + 16 * Math.sin(tilt), 16 * Math.cos(tilt) + 44 * Math.sin(tilt));
      for (const side of [-1, 1]) {
        part(side * (w / 2 - 9), -36, 4, 18, 40, 78);
        part(side * (w / 2 - 9), -58, 4, 20, 8, 80);
        for (const end of [-1, 1]) part(side * (w / 2 - 10), -3, 4 + end * 34, 7.2, 6, 7.2);
      }
    }
    S.shadow(0, 0, 4, w + 12, 88, 0.75, { sq: true });
  }
  function cushionPiping(B,x,y,z,w,d,r,m){
    const path=new T.CurvePath(),v=(a,b)=>new T.Vector3(a,0,b),a=w/2,b=d/2,points=[[-a+r,-b],[a-r,-b],[a,-b+r],[a,b-r],[a-r,b],[-a+r,b],[-a,b-r],[-a,-b+r]],corners=[[a,-b],[a,b],[-a,b],[-a,-b]];
    for(let i=0;i<8;i++){const p=v(...points[i]),q=v(...points[(i+1)%8]);path.add(i%2?new T.CubicBezierCurve3(p,p.clone().lerp(v(...corners[(i-1)/2]),.55228475),q.clone().lerp(v(...corners[(i-1)/2]),.55228475),q):new T.LineCurve3(p,q))}
    B.geo(new T.TubeGeometry(path,56,0.36,5,true),x,y,z,m);
  }
  function curtainG(B,x,y,z,w,h,m) {
    const g=new T.PlaneGeometry(w,h,40,12),p=g.attributes.position,u=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const px=p.getX(i),py=p.getY(i),down=py/h+.5,t=px/w;
      const phase=t*Math.PI*10+.3*Math.sin(down*4+t*3),full=.64+.36*down;
      p.setZ(i,3.8+Math.sin(phase)*3.2*full+.45*Math.sin(down*8+t*7)*Math.sin(down*Math.PI));
      p.setX(i,px*(.97+.03*down)+.8*Math.sin(down*Math.PI)*Math.sin(t*6));
      p.setY(i,py+Math.sin(phase)*.9*Math.pow(down,6));
      u.setX(i,u.getX(i)*w*1.6/64);u.setY(i,(1-u.getY(i))*h/64);
    }
    g.computeVertexNormals();B.geo(K.thicken(g,.5),x,y+h/2,z,m,{ry:180});
  }
  function sofaTex() { return K.tex('hs.sofa', 512, 512, (g, w, h) => { g.save();g.scale(2,2);w/=2;h/=2; g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); const r = K.rnd(8); for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; g.fillStyle = ['#b04a4a', '#c86a5a', '#a03a4a'][i % 3]; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 7, y + Math.sin(k * 1.26) * 7, 6, 4, k * 1.26, 0, 7); g.fill(); } g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.fillStyle = '#5a7a4a'; g.beginPath(); g.ellipse(x + 14, y + 10, 8, 3, 0.6, 0, 7); g.fill(); } A.grain(g, w, h, 4000, 0.06, 9);g.restore();for(let y=0;y<512;y+=3)for(let x=y%6?0:1;x<512;x+=3){g.fillStyle=(x+y)%2?'rgba(252,237,202,.18)':'rgba(40,29,18,.18)';g.fillRect(x,y,2,1)} }, {world:60}); }
  function curtTex() { return K.tex('hs.curt', 128, 128, (g, w, h) => { g.fillStyle = '#6a2a2e'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(220,180,100,.2)'; g.fillRect(x, 0, 2, h); } for(let x=0;x<w;x++){g.fillStyle='rgba(6,2,3,'+(.1+.12*Math.sin(x*Math.PI/16))+')';g.fillRect(x,0,1,h)}for(let y=0;y<h;y+=3){g.fillStyle='rgba(223,190,151,.12)';g.fillRect(0,y,w,1)}A.grain(g,w,h,1500,.09,10); }); }
  function netTex() { return K.tex('hs.net.voile', 256, 128, (g,w,h) => {
    // Broad, low-contrast folds survive minification without moire.
    const fold=g.createLinearGradient(0,0,w,0);
    for(let i=0;i<=16;i++)fold.addColorStop(i/16,i%2?'rgba(249,245,225,.35)':'rgba(255,253,238,.21)');
    g.fillStyle=fold;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(247,243,225,.4)';g.fillRect(0,h-5,w,3);
  },{clamp:true}); }
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
    const shell=M({c:'#343438',map:K.tex('hs.av.satin',128,128,(g,w,h)=>{g.fillStyle='#e7e7e2';g.fillRect(0,0,w,h);const r=K.rnd(814);for(let n=0;n<6000;n++){g.fillStyle=n%2?'rgba(14,16,18,.1)':'rgba(255,254,235,.12)';g.fillRect(r()*w,r()*h,1,1)}for(let n=0;n<18;n++){const x=r()*w,y=r()*h;g.strokeStyle='rgba(215,212,190,.17)';g.lineWidth=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+2+r()*8,y+1);g.stroke()}},{world:18}),family:'plastic'});
    const ash=M({c:'#383338',map:tex('oak'),family:'wood'});
    const compact=(root,keep)=>{const b=K.batch();for(const mesh of root.children.slice())if(mesh.isMesh&&!keep.includes(mesh)&&![].concat(mesh.material).some(m=>m.transparent)){b.add(mesh.geometry,mesh.matrix,Array.isArray(mesh.material)?i=>mesh.material[i]:mesh.material);root.remove(mesh);mesh.geometry.dispose()}b.build(root)};

    const st = B.at(LT.x, GY, LT.z);
    st.box(0, -24, 0, 96, 3, 44, ash); st.box(0, -1.5, 0, 96, 3, 44, ash); [-46.5, 46.5].forEach(x => st.box(x, -12.5, 0, 3, 22, 44, ash));
    st.box(0, -46, 0, 96, 3, 44, ash); [-46.5, 46.5].forEach(x => st.box(x, -35, 0, 3, 22, 44, ash));
    st.box(0,-35,22.2,90,20,.5,K.glazing(.48));
    st.shadow(0, 0, 0, 104, 52, 0.75, { sq: true });
    // the telly
    const tv = new T.Group(); tv.position.set(LT.x, GY - 47.5, LT.z - 4); r.group.add(tv); const TV = K.into(tv);
    TV.rbox(0, -25, 6, 66, 50, 16, 2.4, shell); TV.geo(taperG(56, 42, 30, 0.6), 0, -25, -16, M('#222226'));
    TV.box(0, -2.4, 14.3, 60, 4, 0.4, M('#1c1c20'));
    const scr = new T.Mesh(new T.PlaneGeometry(50, 37.5), new T.MeshBasicMaterial({ color: 0xffffff, map: tex('screenOff') })); flipUV(scr.geometry); scr.position.set(-4, -27, 14.25); tv.add(scr);
    r.tvScreen = scr; r.tvGroup = tv;
    TV.box(26, -26, 14.3, 6, 30, 0.4, M('#1a1a1c')); [-14, -8, -2, 4].forEach(y => TV.box(26, -26 + y, 14.6, 3.6, 2.4, 0.6, M('#333'))); r.tvLed = TV.ball(26, -40, 14.5, 0.7, 0.7, 0.3, M({ c: '#e01a1a', e: '#900' }).clone(), 6);
    for(let j=0;j<17;j++)TV.box(-27+j*2.8,-6.4,14.18,.65,1.7,.45,M('#1a1a1c'));
    TV.box(0,-3.5,14.7,20,.45,.45,M('#333')); // mould parting line
    for(const side of [-1,1]){for(let n=0;n<7;n++)TV.box(side*33.05,-30+n*1.7,5,.3,.5,10,M('#1a1a1c'));for(const y of [-31,-18.8])TV.box(side*33.16,y,5,.5,.6,11.2,shell);for(const z of [-.5,10.5])TV.box(side*33.16,-24.9,z,.5,12,.6,shell);}
    TV.shadow(0, 0, 0, 70, 46, 0.5, { sq: true });
    compact(tv,[scr,r.tvLed]);
    // the video recorder (the clock flashes 12:00, of course)
    const vcr = new T.Group(); vcr.position.set(LT.x - 8, GY - 26, LT.z + 2); r.group.add(vcr); const VC = K.into(vcr);
    VC.rbox(0, -4.5, 0, 42, 9, 30, 0.8, shell); VC.box(-6, -5, 15.1, 20, 3, 0.4, M('#101012'));
    r.vcrTex = K.tex('hs.vcrclock', 128, 32, () => {}, { clamp: true });
    const vd = new T.Mesh(new T.PlaneGeometry(9, 2.4), new T.MeshBasicMaterial({ map: r.vcrTex })); flipUV(vd.geometry); vd.position.set(12, -5, 15.15); vcr.add(vd);
    [0, 1, 2, 3, 4].forEach(i => VC.box(-14 + i * 4, -1.5, 15.2, 3, 1.2, 0.5, M('#5a5a5e')));
    for(let n=0;n<10;n++)VC.box(-17+n*3.7,-9.15,-4,.7,.35,13,M('#101012'));
    compact(vcr,[vd]);
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
    r.peopleSeats=[];
    const batch = K.batch(), B = K.into(batch);
    const wall = M({ c: '#fff', map: tex('wallKitchen') });
    B.rbox(-60,GC+2,120,120,4,16,.8,mWhite);
    B.rbox(-60,GC+5.6,120,113,3.2,12,1.2,ceilingGlow(r,'#e7e8dc','#a4a89b'));
    shell(B, { x0: -280, z0: REAR.z1, x1: 195, z1: 295, fy: GY, cy: GC, wall, fadedSide:'n',fadedWall:M({c:'#fff',map:K.tex('hs.kitchen.sunfade',512,512,(q,w,h)=>{q.drawImage(tex('wallKitchen').image,0,0,w,h);q.fillStyle='rgba(246,238,209,.18)';q.fillRect(0,0,w,h)},{world:48,family:'plaster'})}), uv: 48, cove: true, thin: { n: 0.7 }, floor: false, fuv: 60, holes: { e: [[-160,-80,143,235],[150, 230, GY - 205, GY]], n: [[-160, -40, 143, 253], [80, 160, GY - 205, GY]] } });
    thresholdFloor(B,REAR.z1,295,190,M({c:'#fff',map:tex('lino')}),60);
    // the window over the sink and the back door (half glass): the garden outside
    // Shared sky/neighbourhood; no overlapping bedroom/kitchen sky cards.
    winFrame(B, -160, -40, 143, 253, REAR.z1);
    // Real side casement in the extension: shared geometry is visible from the side garden.
    const sideFrame=M({c:'#f2f0ea',family:'glossPaint'});
    for(const y of [146,232])B.box(202,y,-120,8,6,80,sideFrame);
    for(const z of [-157,-120,-83])B.box(202,189,z,8,86,z===-120?5:6,sideFrame);
    for(const y of [143,235])B.box(198,y,-120,10,.8,80,M('#d8d4c8'));
    for(const z of [-160,-80])B.box(198,189,z,10,92,.8,M('#d0ccc0'));
    B.box(201.8,189,-120,.4,80.2,68.2,K.glazing(.36));
    B.rbox(195,236.5,-120,20,3,88,.8,sideFrame);
    H.support('kitchen',185,-164,205,-76,235);

    doorway(r, B, 'backframe', 'n', REAR.z1, 80, 160, GY, { leaf: false, depth: 1, frameSides: [1] });
    const WB = B.at(0,0,-REAR.extension);
    // the units along the back wall: base cupboards, the worktop, wall cupboards, the sink, the cooker, the washing machine
    const doorM = M({ c: '#fff', map: unitTex() }), top = M({ c: '#fff', map: worktopTex(), sh: 40, sp: '#555' });
    const unit = (x0, x1, appliance) => { const cx=(x0+x1)/2,w=x1-x0,carcass=M('#e8e2d0');
      // The washer bay's rear corner clears the back-door architrave.
      const rear = appliance ? -53 : -55;
      for(const x of [x0+1,x1-1])WB.box(x,GY-46,(rear+3)/2,2,86,3-rear,carcass);
      WB.box(cx,GY-46,rear+1,w-4,86,2,carcass);WB.box(cx,GY-5,-26,w-4,2,54,carcass);
      if(appliance)WB.box(cx,GY-46,2,w-4,84,2,M({c:'#eeeae2',sh:24}));else{WB.box(cx,GY-46,1.6,w-4,84,1.2,M({ c: '#d9cba6', sh: 18, sp: '#222' }));unitDoors(WB,cx,GY-46,2.2,w-4,83,1);}
      WB.box(cx,GY-4,-3,w-4,8,2,M('#3a3a3a')); // solid recessed kickboard
    };
    unit(-214.5,-160);unit(-160,-40);unit(20,80,true);
    // Reserve the fridge bay and cut a real opening for the sink bowl.
    const wornTop=M({c:'#fff',map:worktopTex(true)}),trim=M('#3a3a3a');
    const work=(x0,x1,z0,z1)=>{WB.box((x0+x1)/2,GY-91.5,(z0+z1)/2,x1-x0,3,z1-z0,x0<-40&&x1>-160?wornTop:top);if(z1>=9)WB.rbox((x0+x1)/2,GY-90.5,z1+.15,x1-x0,1.8,.8,.25,trim)};
    work(-214.5,-103,-56,10);work(-57,-40,-56,10);work(-103,-57,-56,-44);work(-103,-57,-8,10);work(20,73.5,-56,10);work(73.5,80,-53,10);
    // Sixteen 12 cm tiles per texture: world UVs keep the grout square and
    // the fruit motifs round instead of stretching them across the wall.
    // Leave the actual window and back-door opening clear. The old single
    // strip also hid most of the window and fought the door casing for depth.
    const splash=K.tex('hs.kitchen-plain-tiles',256,256,(g,w,h)=>{
      g.fillStyle='#efece4';g.fillRect(0,0,w,h);g.strokeStyle='#b8b2a2';g.lineWidth=1.2;
      for(let i=0;i<=16;i++){g.beginPath();g.moveTo(i*16,0);g.lineTo(i*16,h);g.stroke();g.beginPath();g.moveTo(0,i*16);g.lineTo(w,i*16);g.stroke()}
      A.mottle(g,w,h,20,'rgba(255,255,255,.2)',20,56);
    },{world:192});
    for(const [x0,x1]of [[-280,-160],[-40,73.5]])WB.plane((x0+x1)/2,GY-120,-55.8,x1-x0,56,M({c:'#fff',map:splash,family:'ceramic'}),{uv:192});
    const wu = (x0, x1) => { const cx = (x0 + x1) / 2; WB.box(cx, GC + 80, -40, x1 - x0, 70, 32, { f: M({ c: '#d9cba6', sh: 18, sp: '#222' }), all: M('#e8e2d0') }); unitDoors(WB, cx, GC + 80, -24, x1 - x0, 69, 1, true); };
    wu(-214.5,-166);wu(20,71.5); // 2.2 cm clear of the door casing
    WB.shadow(-110, GY, -26, 270, 70, 0.7, { sq: true });
    // the sink (stainless steel), the taps, the washing-up
    const sk=WB.at(-80,GY-93,-26),steel=M({c:'#b4bcc4',family:'metal'}),chrome=M({c:'#c5cbcc',family:'metal',reflect:.34});
    for(const x of [-24,24])sk.rbox(x,-0.3,0,2,0.6,40,0.25,steel);
    for(const z of [-19,19])sk.rbox(0,-0.3,z,46,0.6,2,0.25,steel);
    sk.box(0,13,0,46,2,36,steel);for(const x of [-22.5,22.5])sk.box(x,6,0,1,12,36,steel);for(const z of [-17.5,17.5])sk.box(0,6,z,44,12,1,steel);
    sk.cyl(0,11.9,0,2.2,2.2,0.2,20,M('#454b50'));sk.cyl(0,11.7,0,1.5,1.5,0.2,20,mMetal);
    for(let a=0;a<8;a++)sk.cyl(Math.cos(a*Math.PI/4),11.55,Math.sin(a*Math.PI/4),0.12,0.12,0.12,6,M('#25282b'));
    sk.cyl(-6,-10,-16,0.9,0.9,18,12,chrome);sk.cyl(-6,-18,-10,0.8,0.8,12,12,chrome,{rx:90});sk.cyl(6,-4,-16,1.6,1.6,6,12,chrome);
    for(const [x,c]of [[-6,'#c54b40'],[6,'#3f6999']]){sk.cyl(x,-7.3,-16,1.7,1.7,0.6,12,mWhite);sk.cyl(x,-7.7,-16,0.7,0.7,0.25,12,M(c))}
    // the cooker (freestanding, four rings, an eye-level grill), the washing machine
    const ck = WB.at(-10, GY, -26); ck.box(0, -46, 0, 58, 92, 58, { f: M({ c: '#fff', map: cookerTex() }), all: M('#e8e8e4') }); ck.box(0, -93, 0, 58, 2, 58, M({ c: '#efefec', sh: 60 })); [[-14, -12], [14, -12], [-14, 12], [14, 12]].forEach(([x, z]) => ck.cyl(x, -94.6, z, 8, 8, 0.6, 18, M('#2a2a2a')));
    // Wall-mounted enamel extractor, with a solid flue to the ceiling. Its
    // underside clears the window head; nothing stands down in the hob rings.
    const hood=M({c:'#e1ded5',family:'ceramic'});
    ck.rbox(0,-184,-12,58,12,36,1.2,hood);
    ck.box(0,(GC+GY-190)/2-GY,-22,24,GY-190-GC,16,hood);
    ck.box(0,-177.7,-12,49,.6,25,M('#595d59'));
    for(const x of [-16,-8,0,8,16])ck.box(x,-177.25,-12,.8,.3,22,mMetal);
    ck.box(0,-183,6.3,54,3,.6,M('#4a4b46'));
    for(const x of [17,22])ck.box(x,-183,6.8,2,1.5,.5,mWhite);
    for (let i = 0; i < 5; i++) { ck.cyl(-20 + i * 10, -84, 29.3, 2.4, 2.4, 1.4, 12, M({ c: '#2a2a2a', sh: 40 }), { rx: 90 }); ck.box(-20 + i * 10, -84, 30.2, 0.6, 2.2, 0.4, M('#ddd')); }
    ck.cyl(0, -52, 30.4, 1, 1, 46, 8, mMetal, { rz: 90 }); ck.plane(0, -45, 29.2, 44, 22, M({ c: '#1a1a1a', sh: 90, sp: '#888', o: 0.9, tr: true }));
    const wm = WB.at(50, GY, -26); wm.geo(new T.TorusGeometry(13, 1.6, 8, 28), 0, -45, 29.4, M({ c: '#c8ccd0', sh: 60, sp: '#888' })); wm.cyl(0, -45, 29.2, 11.5, 11.5, 0.6, 28, M({ c: '#2a3440', sh: 120, sp: '#fff' }), { rx: 90 }); wm.cyl(0, -45, 29.6, 8, 8, 0.3, 24, M({ c: '#7a8a9a', o: 0.5, tr: true, sh: 100, sp: '#fff' }), { rx: 90 });
    wm.box(-14, -82, 29.4, 16, 5, 1.2, M('#d8d8d4')); wm.cyl(12, -82, 29.8, 2.2, 2.2, 1.2, 14, M({ c: '#333', sh: 40 }), { rx: 90 }); [4, 18, 22].forEach(x => wm.box(x - 10, -82, 29.6, 1.2, 1.2, 0.5, M('#1a8a3a')));
    // the fridge-freezer (the magnets and notes are the fridge door: js/hs-life.js)
    r.fridgeFrame={x:-247.5,z:-140,w:60,h:170,d:64};
    // warm white enamel (pure white blew out under the window light), a dark door seal line, and a busy door
    const fr = WB.at(r.fridgeFrame.x,GY,-20); fr.rbox(0, -85, 0, 60, 170, 64, 2, M({c:'#fff',map:fridgePaint(),family:'ceramic'})); fr.box(0, -110, 32.2, 58, 1.2, 0.8, M('#8e8a82'));for(const x of [-28.5,28.5])fr.box(x,-85,32.3,.55,164,.4,M('#8e8a82'));for(let x=-20;x<=20;x+=5)fr.box(x,-7,32.25,3,5,.7,M('#1a1a1a'));
    for (const [x, y, c] of [[-18, -128, '#d02a2a'], [-9, -131, '#2a5ad0'], [3, -126, '#e8c020'], [-12, -98.5, '#2a8a3a'], [6, -101, '#d02a2a'], [-4, -64, '#e8c020'], [10, -60, '#2a5ad0']]) fr.rbox(x, y, 32.6, 2.6, 2.2, 1, 0.4, M(c)); // (same plastics as the notice-board pins: one draw each)
    fr.box(-12, -88, 32.15, 15, 20, 0.12, M({ c: '#fff', map: tex('note'), pr: 1 }), { rz: -3 }); fr.box(6, -92, 32.2, 13, 17, 0.12, M({ c: '#fff', map: tex('photo'), pr: 1 }), { rz: 4 });
    fr.box(-6, -136, 32.15, 18, 13, 0.12, M({ c: '#fff', map: tex('noteBlue'), pr: 1 }), { rz: 2 });
    [[-130, 36], [-70, 46]].forEach(([y, hh]) => { fr.rbox(26, y, 33.6, 2.2, hh, 2.2, 0.8, M({c:'#e0dcd4',family:'glossPaint'})); fr.box(26, y - hh / 2 + 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); fr.box(26, y + hh / 2 - 1, 32.8, 2.2, 2, 1.2, M('#d0ccc4')); });
    fr.box(-14, -160, 32.05, 16, 4, .3, {f:M({ c: '#fff', map: K.tex('hs.frlogo', 128, 32, (g) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 128, 32); A.text(g, 'FROSTMASTER', 64, 22, '700 15px ' + A.UIF, '#8a8a8a', 'center'); }) }),all:M({c:'#fff',map:fridgePaint(),family:'ceramic'})});
    fr.box(0, -2.1, 20, 56, 4, 24, M('#1a1a1a')); // the plinth (a hair off the floor plane the cabinet stands on)
    fr.shadow(0, 0, 0, 68, 70, 0.7, { sq: true });
    // things on the worktop: the kettle, the toaster, the bread bin, the microwave, the radio (the biscuit tin is its own)
    const kt=WB.at(-200,GY-93,-36),enamel=M({c:'#ecece5',family:'ceramic'}),handle=M({c:'#343638',family:'plastic'});
    kt.lathe(0,0,0,[[0,-22],[6,-22],[8,-20],[10,-14],[9.6,-2],[9,-1],[0,-1]],28,enamel);kt.cyl(0,-0.5,0,10.8,10.8,1,28,handle);
    kt.cyl(0,-22.3,0,5.6,5.6,0.6,24,handle);kt.rbox(0,-23.4,0,3.2,1.8,2,0.5,handle);
    kt.geo(new T.TorusGeometry(7.3,1.15,8,24,Math.PI),-8.8,-12,0,handle,{rz:90});
    kt.cyl(10,-18,0,2.2,3,8,18,enamel,{rz:45});kt.cyl(12.83,-20.83,0,1.5,1.5,0.4,16,M('#4b4f50'),{rz:45});kt.rbox(-9,-3,0,2,1,3,0.3,handle);kt.shadow(0,0,0,26,24,0.5);
    const ts = WB.at(-140, GY - 93, -36); ts.rbox(0, -9, 0, 26, 18, 16, 3, M({ c: '#d8d8d4', family: 'metal' })); ts.box(-5, -18.4, 0, 3, 1, 12, M('#111')); ts.box(5, -18.4, 0, 3, 1, 12, M('#111')); ts.shadow(0, 0, 0, 30, 20, 0.6, { sq: true });
    const bb = WB.at(63, GY - 93, -36); bb.rbox(0, -12, 0, 30, 24, 24, 6, M({ c: '#c83a2a', sh: 40, sp: '#555' }));bb.rbox(0,-11,12.1,24,0.4,0.4,0.15,M('#76291f'));bb.rbox(0,-8,12.8,8,1.3,1.2,0.4,mMetal);bb.shadow(0, 0, 0, 34, 28, 0.6, { sq: true });
    const rd = WB.at(65,GY-93,-5); rd.rbox(0,-7,0,24,14,8,2,M('#3a3a3e')); rd.cyl(6,-7,4.2,4,4,0.4,16,M('#555'),{rx:90});rd.box(-5,-9,4.2,8,3,0.4,M({c:'#d8a040',e:'#3a2000'}));rd.cyl(-8,-21,-2,0.3,0.3,20,6,mMetal,{rz:20});
    // the microwave: the clock is flashing 12:00
    const mw = new T.Group();mw.name='kitchen-microwave';mw.position.set(r.fridgeFrame.x,GY-169,-140);r.group.add(mw);const MW=K.into(mw);r.mw=mw;
    MW.rbox(0, -16, 0, 46, 30, 34, 1.4, M({ c: '#e8e6e0', sh: 30 })); MW.plane(-6, -16, 17.1, 30, 22, M({ c: '#2a2a2a', sh: 90, sp: '#888' }));
    r.mwTex = K.tex('hs.mwclock', 128, 40, () => {}, { clamp: true });
    const md = new T.Mesh(new T.PlaneGeometry(9, 3), new T.MeshBasicMaterial({ map: r.mwTex })); flipUV(md.geometry); md.position.set(15, -26, 17.12); mw.add(md);
    for (let i = 0; i < 6; i++) MW.box(12 + (i % 3) * 3, -18 + Math.floor(i / 3) * 3, 17.2, 2.4, 2, 0.4, M('#aaa'));
    MW.rbox(9.5,-16,18,1.1,15,1.5,0.4,M('#9b9b96'));for(let i=0;i<7;i++)MW.box(-23.1,-21+i*1.3,0,0.2,0.5,19,M('#666964'));
    MW.shadow(0,-1,0,48,36,0.45,{sq:true});
    const kb = new T.Group(); kb.position.set(170, GY, 20); r.group.add(kb); const KB = K.into(kb);
    KB.cyl(0, -30, 0, 15, 14, 60, 20, M({ c: '#d8d8d4', family: 'metal' })); KB.cyl(0, -61, 0, 15.6, 15.6, 2.4, 20, M({ c: '#c8c8c4', family: 'metal' })); KB.box(0, -1.5, 15, 8, 3, 6, M('#333')); KB.shadow(0, 0, 0, 36, 36, 0.6);
    H.spot('hs.bin', { label: 'Kitchen bin', obj: kb, act: () => life('bin') }); H.block('G', 152, 2, 188, 38);
    H.spot('hs.micro', { label: 'Microwave', obj: mw, act: () => life('micro') });
    // the kitchen table and chairs, a fruit bowl, the newspaper
    // A 1990s pine farmhouse table: rounded top, aprons under it, turned legs.
    const kt2 = B.at(-60, GY, 110), pineM = M({ c: '#fff', map: tex('pine') });
    kt2.rbox(0, -74, 0, 120, 4, 80, 1.2, pineM, { uv: 50, seg: 2 });
    kt2.box(0, -68.5, -33.4, 103, 7, 2.2, pineM, { uv: 50 }); kt2.box(0, -68.5, 33.4, 103, 7, 2.2, pineM, { uv: 50 });
    kt2.box(-52.4, -68.5, 0, 2.2, 7, 62, pineM, { uv: 50 }); kt2.box(52.4, -68.5, 0, 2.2, 7, 62, pineM, { uv: 50 });
    [[-54, -34], [54, -34], [-54, 34], [54, 34]].forEach(([x, z]) => turnedLeg(kt2, x, -72, z, 72, 5.6, pineM));
    // the fruit bowl: a glazed stoneware bowl on a foot ring, with real fruit in it (it is never eaten)
    const tprops = new T.Group(); tprops.position.set(-60, GY, 110); r.group.add(tprops); r.tableProps = tprops; /* (a group of its own so the Halloween carving can clear the table) */ const KT = K.into(tprops);
    const bowl = KT.at(-20, -76, -8);
    bowl.lathe(0, 0, 0, [[12.2, -6.6], [12.4, -6.2], [11.6, -3.4], [9, -1.6], [6.2, -0.9], [6, 0], [0.05, 0], [0.05, -1.4], [4.6, -1.6], [8.4, -2.6], [10.8, -4.6], [11.7, -6.4], [12.2, -6.6]], 28, M({ c: '#c9b48c', family:'ceramic' }));
    bowl.lathe(0, 0, 0, [[12.25, -6.7], [12.45, -6.3]], 28, M({ c: '#6b4a2a', family:'ceramic' }));
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
    [[-60, 44, 0], [-60, 176, 180], [-136, 110, 90], [16, 110, -90]].forEach(([x, z, ry]) => chair(B, x, z, ry,r)); // (set 6 cm back: legs clear of the table legs and aprons)
    // a wall clock, the calendar, the cork board with Mom's lists
    const wc = B.at(-154, GY-181, 293.5, 180);wc.wshadow(.6,1,-1.45,39,39,.35);
    wc.cyl(0,0,0,18,18,3,40,M({c:'#9e352a',sh:45}),{rx:90});
    wc.cyl(0,0,1.7,16.5,16.5,.6,40,M('#f4f0e4'),{rx:90});
    const dial=K.tex('hs.kitchen-dial',256,256,(g,w,h)=>{
      g.fillStyle='#f4f0e4';g.fillRect(0,0,w,h);
      for(let i=0;i<60;i++){const a=i*Math.PI/30;g.strokeStyle='#433e32';g.lineWidth=i%5?1:3;g.beginPath();g.moveTo(128+Math.sin(a)*(i%5?114:108),128-Math.cos(a)*(i%5?114:108));g.lineTo(128+Math.sin(a)*119,128-Math.cos(a)*119);g.stroke()}
      for(let i=1;i<=12;i++){const a=i*Math.PI/6;A.text(g,String(i),128+Math.sin(a)*91,136-Math.cos(a)*91,'700 22px '+A.UIF,'#352f27','center')}
    },{clamp:true});
    const dialFace=new T.CircleGeometry(16.3,40);flipUV(dialFace);wc.geo(dialFace,0,0,2.08,M({c:'#fff',map:dial,pr:1}));
    const cal = B.at(35,GY-160,294.4,180);r.calendarTex=tex('calendar');
    cal.box(0,0,0,32,46,1,{f:M({c:'#fff',map:r.calendarTex,pr:1}),all:M('#e9e4d6')});
    cal.cyl(0,-24,0,.65,.65,1.2,10,mMetal,{rx:90});
    for(let x=-12;x<=12;x+=3)cal.cyl(x,-22,.8,.25,.25,3,6,mMetal);
    // Mom's notice board over the table: lists, a takeaway menu, the school photo
    const nb = B.at(-60,GY-157,294.8,180,{sx:1.4,sy:1.4}), corkM = M({ c: '#fff', map: tex('cork'), pr: 1 }), nbFrame = M({ c: '#fff', map: tex('pine') });
    nb.wshadow(0.8, 1.2, 0.1, 58, 44, 0.45); nb.box(0, 0, 0.9, 52, 38, 1.6, corkM);
    for (const e of [-1, 1]) { nb.rbox(0, e * 19.6, 1.3, 55.2, 2, 2.6, 0.4, nbFrame); nb.rbox(e * 26.6, 0, 1.3, 2, 37.2, 2.6, 0.4, nbFrame); }
    const memo=(key,col,lines)=>K.tex('hs.memo.'+key,192,256,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);lines.forEach((line,i)=>A.text(g,line,w/2,49+i*41,'700 23px '+A.HAND,'#293c52','center'))},{clamp:true});
    nb.box(-14,-2,1.9,15,20,.18,M({c:'#fff',map:memo('jobs','#fff1b0',['JOBS','ON THE','FRIDGE','Mom x']),pr:1}),{rz:3});
    nb.box(6,-5,1.9,16,11,.18,M({c:'#fff',map:tex('photo'),pr:1}),{rz:-4});
    nb.box(16,7,1.9,11,14,.18,M({c:'#fff',map:memo('school','#c5e4e3',['PE KIT','MONDAY','WASH IT!']),pr:1}),{rz:5});
    nb.box(-2,10,1.9,13,9,.18,M({c:'#fff',map:tex('calendar'),pr:1}),{rz:-2});
    [[-14, -10.5, '#d02a2a'], [6, -9.8, '#2a8a3a'], [16, -0.2, '#e8c020'], [-2, 6, '#2a5ad0']].forEach(([x, y, c]) => nb.cyl(x, y, 2.3, 0.8, 0.8, 1, 10, M(c), { rx: 90 }));
    batch.build(r.group);
    // the clock hands (they move)
    const hands = new T.Group(); hands.name='kitchen-clock-hands';hands.position.set(-154,GY-181,291.2);hands.rotation.y=Math.PI;r.group.add(hands);
    r.hh=new T.Group();hands.add(r.hh);K.into(r.hh).box(0,-4,0,1,8,.5,M('#292824'));
    r.mh=new T.Group();hands.add(r.mh);K.into(r.mh).box(0,-6,.4,.65,12,.4,M('#292824'));K.into(hands).cyl(0,0,.9,.8,.8,.8,12,mMetal,{rx:90});
    // the biscuit tin (a daily raid: js/hs-life.js asks the server)
    const tin = new T.Group();tin.position.set(40,GY-93,-124);r.group.add(tin);const TN=K.into(tin);
    TN.cyl(0, -9, 0, 11, 11, 18, 24, M({ c: '#fff', map: tinTex(), sh: 60, sp: '#888' }));
    const lid = new T.Group(); lid.position.set(0, -18, -11); tin.add(lid); K.into(lid).cyl(0, -0.8, 11, 11.6, 11.6, 2.2, 24, M({ c: '#2a5ab0', sh: 60, sp: '#888' })); r.tinLid = lid;
    TN.shadow(0, 0, 0, 26, 26, 0.6);
    H.spot('hs.tin', { label: 'The biscuit tin', obj: tin, act: () => life('tin') });
    H.spot('hs.fridge', { label: 'The fridge', act: () => life('fridge') });pickBox(r,'hs.fridge',r.fridgeFrame.x,GY-85,-106,60,170,4);
    H.spot('hs.kettle', { label: 'The kettle', act: () => { window.Sound?.world('kettle'); say('The kettle', ['On it goes. In 1999 the kettle is the most important thing in any house.', 'Mom: "Put the kettle on, love." It is always on. The kettle never rests.'][((r.kn = (r.kn | 0) + 1)) % 2]); } }); pickBox(r, 'hs.kettle', -200, GY - 104, -156, 24, 24, 22);
    H.spot('hs.toaster', { label: 'Toaster', act: sayLines('hs.toaster', 'Toaster', ['The toaster has two settings: still bread, and charcoal.']) }); pickBox(r, 'hs.toaster', -140, GY - 102, -156, 28, 20, 18);
    H.spot('hs.radio', { label: 'Kitchen radio', act: sayLines('hs.radio', 'Kitchen radio', ['Tuned to the local station. A man is reading out the traffic. There is no traffic.', 'Mom has it on all day. She knows all the adverts off by heart.']) });pickBox(r,'hs.radio',65,GY-100,-125,26,16,10);
    H.spot('hs.paper', { label: 'The newspaper', act: () => life('paper') }); pickBox(r, 'hs.paper', -22, GY - 77, 129, 30, 2, 38);
    H.spot('hs.cooker', { label: 'The cooker', act: sayLines('hs.cooker', 'The cooker', ['Tonight: ' + ['fish fingers, chips and beans', 'spag bol', 'a Fondus Crispy Pancake each', 'shepherd\'s pie', 'a chicken Kiev (garlic everywhere)'][new Date().getDay() % 5] + '. Mom says do NOT touch the knobs.']) }); pickBox(r, 'hs.cooker', -10, GY - 46, -117, 58, 92, 4);
    H.spot('hs.washer', { label: 'Washing machine', act: sayLines('hs.washer', 'Washing machine', ['It walks across the floor on the spin cycle. We have found it in the middle of the kitchen before.']) }); pickBox(r, 'hs.washer', 50, GY - 46, -117, 58, 86, 4);
    H.spot('hs.wclock', { label: 'Kitchen clock', act: () => { const d=window.OwnerTools?.now()||new Date();say('Kitchen clock','It says '+(d.getHours()%12||12)+':'+String(d.getMinutes()).padStart(2,'0')+'. (It\'s right. The microwave isn\'t.)'); } });pickBox(r,'hs.wclock',-154,GY-181,290,36,36,5);
    H.spot('hs.kcalendar',{label:"Mom's calendar",act:()=>{const d=window.OwnerTools?.now()||new Date(),t=window.Desk?.today99?.()||{m:d.getMonth()+1,d:d.getDate()},day=t.m===2?Math.min(28,t.d):t.d;say("Mom's calendar",day+'/'+t.m+'/1999. Today is ringed in red. Mom: "Your jobs are on the fridge. Do those before you go out!"')}});pickBox(r,'hs.kcalendar',35,GY-160,291,33,48,3);
    H.spot('hs.kboard',{label:"Mom's notice board",act:()=>{const next=window.st?.objectives?.().find(o=>!o.done);say("Mom's notice board",'PE kit on Monday. School photo. Three pins missing. '+(next?next.hint||next.text:'Mom: "Jobs first, then games. Your list is on the fridge."'),6500)}});pickBox(r,'hs.kboard',-60,GY-157,290,78,57,4);
    H.walkRect('G', -278, REAR.z1+2, 193, 293, { room: 'kitchen' });
    H.block('G', -280, -176, 82, -114); H.block('G', -280, -176, -218, -106); for(const box of REAR.kitchenBlocks)H.block('G',...box);
    H.support('kitchen',-214.5,-176,-103,-110,GY-93);H.support('kitchen',-57,-176,-40,-110,GY-93);H.support('kitchen',-103,-176,-57,-164,GY-93);H.support('kitchen',-103,-128,-57,-110,GY-93);H.support('kitchen',-103,-164,-57,-128,GY-81);
    H.support('kitchen',-39,-175,19,-117,GY-94);H.support('kitchen',20,-176,80,-110,GY-93);H.support('kitchen',-277.5,-172,-217.5,-108,GY-170);H.support('kitchen',-120,70,0,150,GY-76);
    for(const x of [-24,4])for(const z of [-158,-134])H.support('kitchen',x-8,z-8,x+8,z+8,GY-94.9);
  }
  function winFrame(B, x0, x1, y0, y1, z) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0, fm = M({ c: '#f2f0ea', family: 'glossPaint' }), fz = z - 8; B.box(cx, y0 + 3, fz, w, 6, 6, fm); B.box(cx, y1 - 3, fz, w, 6, 6, fm); B.box(x0 + 3, cy, fz, 6, h, 6, fm); B.box(x1 - 3, cy, fz, 6, h, 6, fm); B.box(cx, cy, fz, 5, h, 6, fm); B.box(cx,cy,fz-1,w-11.8,h-11.8,.4,K.glazing(.36)); B.panel(cx, y0, z - 6, w, 12, .4, M('#d8d4c8'), { rx: -90 }); B.panel(x0, cy, z - 6, 12, h, .4, M('#d0ccc0'), { ry: 90 }); B.panel(x1, cy, z - 6, 12, h, .4, M('#d0ccc0'), { ry: -90 }); B.rbox(cx, y1 + 1.5, z + 2, w + 10, 3, 10, 0.8, M('#efece4')); }
  // a lathe-turned table/chair leg with a square top block (for the aprons) and a turned lower part
  function turnedLeg(B, x, yTop, z, h, w, m) {
    const blk = Math.min(14, h * 0.2), f = t => yTop + blk + (h - blk) * t;
    B.rbox(x, yTop + blk / 2, z, w, blk, w, 0.4, m, { uv: 40 });
    B.lathe(x, 0, z, [[w * 0.36, f(0)], [w * 0.5, f(0.04)], [w * 0.34, f(0.1)], [w * 0.42, f(0.22)], [w * 0.36, f(0.35)], [w * 0.3, f(0.8)], [w * 0.36, f(0.9)], [w * 0.28, f(0.98)], [w * 0.26, f(1)]], 12, m);
  }
  function cupboardPaint(){return K.tex('hs.unit.paint',256,512,(g,w,h)=>{
    g.fillStyle='#e7ddc3';g.fillRect(0,0,w,h);const r=K.rnd(812);
    for(let x=0;x<w;x+=2){g.fillStyle='rgba(103,87,49,'+(.025+r()*.055)+')';g.fillRect(x,r()*8,.65,h-8)}
    g.strokeStyle='rgba(93,75,43,.24)';g.lineWidth=2;g.strokeRect(2,2,w-4,h-4);g.strokeStyle='rgba(255,249,222,.46)';g.strokeRect(5,5,w-10,h-10);
    for(const yy of [h*.84,h*.13])for(let n=0;n<35;n++){g.strokeStyle='rgba(109,91,59,.07)';g.lineWidth=.8;g.beginPath();g.ellipse(w*.89,yy,5+n*.24,7+n*.4,.1,.3,2.7);g.stroke()}
    for(let n=0;n<30;n++){const x=r()<.5?2+r()*5:w-7+r()*5,y=r()*h;g.fillStyle='rgba(115,96,59,.24)';g.fillRect(x,y,1,1+r()*4)}
  },{clamp:true,family:'glossPaint'})}
  function fridgePaint(){return K.tex('hs.fridge.enamel',256,512,(g,w,h)=>{
    g.fillStyle='#e0dcd1';g.fillRect(0,0,w,h);const r=K.rnd(813);for(let n=0;n<18000;n++){g.fillStyle=n%2?'rgba(91,91,80,.05)':'rgba(255,255,243,.11)';g.fillRect(r()*w,r()*h,1,1)}
    g.fillStyle='rgba(112,104,77,.13)';g.fillRect(0,h-7,w,7);for(let n=0;n<40;n++){g.strokeStyle='rgba(126,119,94,.045)';g.lineWidth=.65;g.beginPath();g.ellipse(w*.94,h*.48,3+n*.3,9+n*.6,-.1,.2,2.8);g.stroke()}
    g.strokeStyle='rgba(91,96,85,.15)';g.lineWidth=1;g.strokeRect(1,1,w-2,h-2);
  },{clamp:true,family:'ceramic'})}
  // shaker-style kitchen unit doors (cream, with a darker moulded frame and brass bar handles)
  function unitDoors(B, cx, cy, z, w, h, s, wall) {
    const n = Math.max(1, Math.round(w / 52)), dw = w / n - 0.6, door = M({c:'#fff',map:cupboardPaint(wall),family:'glossPaint'}), frame = M({c:'#c7b992',family:'glossPaint'}), brass = mBrass;
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
  function chair(B, x, z, ry, room) {
    if(room){const a=ry*D2R;room.peopleSeats.push({id:'kitchen-chair'+room.peopleSeats.length,room:'kitchen',lvl:'G',x,z,face:ry,h:47,back:false,front:20.5,hipForward:0,footForward:38,support:{side:'L',x:x+21.5*Math.cos(a)+10*Math.sin(a),y:GY-46,z:z-21.5*Math.sin(a)+10*Math.cos(a),edge:true,yaw:a-Math.PI/2}});}
    const C = B.at(x, GY, z, ry), w = M({ c: '#fff', map: tex('pine') });
    C.rbox(0, -45.4, 0.5, 41, 3.2, 40, 0.9, w, { uv: 40, seg: 2 });
    for (const sx of [-17, 17]) { turnedLeg(C, sx, -43.8, 16, 43.8, 3.8, w); C.rbox(sx, -21.9, -17, 3.4, 43.8, 3.4, 0.5, w, { uv: 40 }); C.rbox(sx, -67.5, -19.4, 3.2, 46, 3.2, 0.6, w, { uv: 40, rx: 7 }); C.cyl(sx, -12, -0.5, 0.9, 0.9, 31, 8, w, { rx: 90 }); }
    C.cyl(0, -15, 16, 0.85, 0.85, 31, 8, w, { rz: 90 });
    C.rbox(0, -86.5, -21.9, 37.5, 7.5, 2.6, 1.1, w, { uv: 40, rx: 7, seg: 2 }); C.rbox(0, -59.5, -18.7, 31, 3.2, 2.2, 0.6, w, { uv: 40, rx: 7 });
    for (const sx of [-9, 0, 9]) C.rbox(sx, -71.5, -20.2, 3, 21, 1.4, 0.45, w, { uv: 40, rx: 7 });
    C.shadow(0, 0, 0, 46, 46, 0.5, { sq: true });
  }
  function unitTex() { return K.tex('hs.unit', 256, 256, (g, w, h) => { g.fillStyle = '#e8dfc4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 3; g.strokeRect(10, 10, w / 2 - 15, h - 20); g.strokeRect(w / 2 + 5, 10, w / 2 - 15, h - 20); g.strokeStyle = '#d8ccae'; g.lineWidth = 6; g.strokeRect(22, 22, w / 2 - 39, h - 44); g.strokeRect(w / 2 + 17, 22, w / 2 - 39, h - 44); g.fillStyle = '#a8883a'; g.fillRect(w / 2 - 22, h / 2 - 20, 6, 40); g.fillRect(w / 2 + 16, h / 2 - 20, 6, 40); A.grain(g, w, h, 1200, 0.04, 33); }); }
  function worktopTex(worn=false) { return K.tex(worn?'hs.worktop.sink-wear':'hs.worktop',512,512,(g,w,h)=>{
    g.fillStyle='#746b58';g.fillRect(0,0,w,h);const r=K.rnd(7);
    for(let i=0;i<16000;i++){g.fillStyle=['#b5aa8d','#403c34','#958c73','#d2c7a4'][i%4];g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}
    for(let n=0;n<70;n++){g.strokeStyle=n%3?'rgba(32,28,20,.22)':'rgba(235,218,181,.3)';const x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+4+r()*16,y-1-r()*3);g.stroke()}
    if(worn){for(const [x,y,R]of [[105,330,29],[356,190,37]]){g.strokeStyle='rgba(224,215,181,.4)';g.lineWidth=2;g.beginPath();g.ellipse(x,y,R,R*.7,.2,0,7);g.stroke()}g.fillStyle='rgba(35,34,23,.17)';g.fillRect(0,0,w,9);}
  },{world:64,family:'lino'}); }

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
  function weatherWood(key,w,h,boards){return K.tex(key,w,h,(q,w,h)=>{
    const r=K.rnd(61),bw=w/boards;for(let b=0;b<boards;b++){
      q.fillStyle=['#99907b','#878777','#a09a83','#7f8272'][b%4];q.fillRect(b*bw,0,bw,h);q.fillStyle='#4d5146';q.fillRect(b*bw,0,1.5,h);
      for(let n=0;n<44;n++){const x=b*bw+2+r()*(bw-4);q.strokeStyle=n%3?'rgba(34,41,29,.27)':'rgba(220,216,188,.3)';q.lineWidth=.5+r()*.5;q.beginPath();q.moveTo(x,0);for(let y=8;y<=h;y+=8)q.lineTo(x+Math.sin(y*.025+n)*1.1,y);q.stroke()}
      const x=b*bw+bw*.6,y=h*(.2+r()*.6);for(let n=0;n<4;n++){q.strokeStyle='rgba(47,49,34,.3)';q.lineWidth=.8;q.beginPath();q.ellipse(x,y,2+n*1.6,5+n*3,.1,0,7);q.stroke()}
      for(const y of [h*.15,h*.8]){q.fillStyle='#3e443a';q.beginPath();q.arc(b*bw+bw*.5,y,2,0,7);q.fill();q.fillStyle='#aab0a0';q.fillRect(b*bw+bw*.5-1,y-1,1.4,1)}
    }
  });}
  const mFence=()=>{const m=M({c:'#fff',vc:true,map:weatherWood('hs.fence.grain',512,512,8)});m.userData.nature='fence';return m;};
  // Colour continuous world-space masses after batching (HouseKit batches positions/normals/UVs).
  function natureColours(meshes){
    for(const mesh of meshes){
      const kind=mesh.material.userData.nature;if(!kind)continue;
      const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,colours=[];
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        if(kind==='turf'){
          const fence=Math.min(x-REAR.x0,REAR.x1-x,z-REAR.z0),edge=Math.max(0,1-fence/35);
          const path=z>-1315&&z<-385?Math.exp(-(((x+218)/24)**2)):0;
          const line=Math.exp(-(((x-255)/53)**2)-((z+760)/225)**2),wear=Math.max(path*.65,line*.55);
          const stripe=.055*Math.cos((x-REAR.x0)*Math.PI/58),patch=.025*Math.sin(x*.029+z*.019)*Math.sin(z*.041);
          colours.push(1-edge*.17+wear*.11+patch+stripe,1-edge*.11-wear*.10+patch+stripe,1-edge*.23-wear*.14+patch+stripe);continue;
        }
        const shade=kind==='leaf'
          ? .88+.06*Math.sin(x*.075+z*.051)*Math.sin(y*.061)+.05*Math.max(0,-n.getY(i))
          : .91+.07*Math.sin(x*.023+z*.031);
        if(kind==='fence'){const green=Math.max(0,Math.min(1,(y-(GY-50))/50)),grey=Math.max(0,Math.min(1,(GY-y-115)/65));colours.push(shade*(1-.23*green-.13*grey),shade*(.98+.12*green+.04*grey),shade*(.94-.18*green+.23*grey));}else colours.push(shade,shade,shade);
      }
      mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));
    }
  }
  const mGrass = () => M({ c: '#fff', map: K.tex('hs.grass', 256, 256, (g, w, h) => { g.fillStyle = '#465e35'; g.fillRect(0, 0, w, h); const r = K.rnd(62); for (let i = 0; i < 14000; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(35,58,25,.35)' : v < 0.9 ? 'rgba(102,136,75,.25)' : 'rgba(160,151,88,.18)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 2); } A.mottle(g, w, h, 20, 'rgba(0,0,0,.08)', 40, 63); }) });
  const mSlab = () => M({ c: '#fff', map: K.tex('hs.slab', 256, 256, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = ['#a8a49a', '#9e9a90', '#b0aca2'][(x + y * 3) % 3]; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = '#5a5a52'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } A.grain(g, w, h, 4000, 0.07, 64); A.mottle(g, w, h, 12, 'rgba(40,60,20,.15)', 30, 65); }) });
  const mBrick=()=>M({c:'#fff',map:K.tex('hs.brick.v2',256,256,(g,w,h)=>{g.fillStyle='#a69b87';g.fillRect(0,0,w,h);const r=K.rnd(66);for(let y=0;y<24;y++)for(let x=-1;x<9;x++){g.fillStyle=['#98664e','#a26d51','#936049','#ac7859'][(r()*4)|0];g.fillRect(x*32+(y%2)*16+.7,y*h/24+.7,30.6,h/24-1.4)}A.grain(g,w,h,1500,.06,66)})});
  const mTarmac = () => M({ c: '#fff', map: K.tex('hs.tarmac', 256, 256, (g, w, h) => { g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); const r = K.rnd(67); for (let i = 0; i < 12000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.07)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }for(let n=0;n<950;n++){const x=r()*w,y=r()*h,size=1+r()*2.7;g.fillStyle=['#626362','#383b3b','#75736b'][n%3];g.beginPath();g.moveTo(x,y);g.lineTo(x+size,y+.2);g.lineTo(x+size*.7,y+size*.8);g.lineTo(x-.3,y+size*.7);g.closePath();g.fill()}g.strokeStyle='rgba(27,29,28,.7)';g.lineWidth=.7;g.beginPath();g.moveTo(0,86);g.lineTo(34,79);g.lineTo(51,92);g.lineTo(89,89);g.moveTo(34,79);g.lineTo(38,61);g.stroke(); }) });
  function treeFoliage(){return K.tex('hs.tree.foliage',128,128,(g,w,h)=>{
    const r=K.rnd(723);g.fillStyle='#b9c49d';g.fillRect(0,0,w,h);
    for(let i=0;i<1350;i++){
      const x=r()*w,y=r()*h,a=r()*Math.PI;g.fillStyle=['#97ab80','#cdd3ac','#acbb8c','#859b71'][i%4];g.beginPath();g.ellipse(x,y,1.4+r()*1.6,.6+r()*.5,a,0,Math.PI*2);g.fill();
    }
  })}
  function tree(B, x, z, hgt, spread, species=0,foliage=null) {
    const trunk=M({c:species===1?'#d3c7a3':'#a8916d',map:tex('oak'),family:'rawWood'}),leaf=M({c:'#729452',vc:true,sh:2,map:treeFoliage()});leaf.userData.nature='leaf';
    K.branchingTree(B,x,GY,z,hgt,spread,trunk,leaf,species,true,foliage);
    B.shadow(x,GY,z,spread*2.5,spread*2.5,.36);
  }
  let exteriorRoof=null;
  function houseRoof(){
    if(exteriorRoof)return;exteriorRoof=new T.Group();exteriorRoof.name='family-house-roof';H.root.add(exteriorRoof);
    const batch=K.batch(),B=K.into(batch),tile=M({c:'#fff',sh:4,map:K.tex('hs.roof.slates',256,256,(g,w,h)=>{const r=K.rnd(301);g.fillStyle='#373d3b';g.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=-1;x<9;x++){g.fillStyle=['#5a5049','#62574f','#514b45'][(r()*3)|0];g.fillRect(x*32+(y%2)*16+1,y*32+1,30,30)}A.grain(g,w,h,1200,.045,301)})}),edge=M('#413b37'),cream=M('#ddd6c5');
    const slab=(points,z,depth,material)=>{const q=new T.Shape();points.forEach(([x,y],i)=>q[i?'lineTo':'moveTo'](x,y));q.closePath();B.geo(new T.ExtrudeGeometry(q,{depth,bevelEnabled:false}),0,0,z,material,{uv:material===tile?256:128})};
    // Complete solid roof across both storeys, shared by front/back views.
    slab([[-326,-200],[60,-370],[60,-363],[-326,-193]],-82,808,tile);
    slab([[60,-370],[446,-200],[446,-193],[60,-363]],-82,808,tile);
    for(const z of [-62.6,701])slab([[-300,-196],[-300,-204.5],[60,-363],[420,-204.5],[420,-196]],z,2,mBrick());
    // Both flank walls, ground to eaves. The rooms inside are hidden while you are outside (room visibility), so the
    // exterior shell must close on its own: these butt between the back wall (z -56.6) and the front wall (z 701),
    // outer faces on x -300 / 420 (the downpipe brackets' wall line), tops tucked into the roof slab.
    B.box(-299,(GY-205)/2,(701-62.6)/2,2,GY+205,701+62.6,mBrick(),{uv:128});
    // The landing window continues through the outer skin, rather than looking
    // straight into a brick wall ten centimetres behind its frosted pane.
    solidWall(B,420,319.2,90,[[-381.8,-205],[381.8,-205],[381.8,GY],[-381.8,GY]],mBrick(),2,[[[80.8,-80],[160.8,-80],[160.8,60],[80.8,60]]]);
    // Side gates close both passages beside the house a metre behind the front, so you never see through to the back.
    { const fm=mFence(),post=M({c:'#fff',map:tex('pineDark'),family:'rawWood'}),iron=M({c:'#1d1e1f',sh:40,sp:'#444'}),gz=600;
      const run=(a,b,gate)=>{ // a..b along x at gz; gate: [x0,x1] for a ledged leaf hung on its own posts
        const posts=[a+4,b-4];if(gate)for(const x of [gate[0]-4,gate[1]+4])if(posts.every(q=>Math.abs(q-x)>1))posts.push(x);
        for(const x of posts){B.box(x,GY-95,gz,8,190,8,post,{uv:60});B.rbox(x,GY-191,gz,9.4,2,9.4,.5,post,{uv:60})}
        const xs=[...new Set(posts)].sort((p,q)=>p-q);
        for(let i=1;i<xs.length;i++){const x0=xs[i-1]+4,x1=xs[i]-4;if(x1-x0<1)continue;
          if(gate&&x0>=gate[0]-.5&&x1<=gate[1]+.5){const cx=(x0+x1)/2,w=x1-x0-1.6; // the gate leaf: boards, ledges and a brace behind, black ironmongery in front
            B.box(cx,GY-92,gz,w,172,2.4,fm,{uv:100});for(const y of [-24,-160])B.box(cx,GY+y,gz-2.6,w-6,9,2.8,post);
            B.box(cx,GY-92,gz-2.6,Math.hypot(w-14,128),7,2.4,post,{rz:Math.atan2(128,w-14)/D2R});
            for(const y of [-24,-160]){B.box(x0+16,GY+y,gz+1.6,30,2.2,.8,iron);B.cyl(x0+1.4,GY+y,gz+2.7,1,1,12,8,iron);}
            B.cyl(x1-12,GY-104,gz+2.4,2.6,2.6,1.2,10,iron,{rx:90});
            B.geo(new T.TorusGeometry(2.4,.55,6,12),x1-12,GY-99,gz+4.3,iron);
            B.rbox(x1-6,GY-104,gz+3.3,20,1.7,1.8,.4,iron);B.rbox(x1+3,GY-104,gz+3.1,3.2,5,2.4,.4,iron);
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
    natureColours(batch.build(exteriorRoof));H.dirty();
  }
  const shedWood=()=>{const m=M({c:'#fff',vc:true,map:weatherWood('hs.shed.boards',256,512,4)});m.userData.nature='fence';return m;};
  function buildGarden(r) {
    houseRoof();
    const batch = K.batch(), B = K.into(batch);
    const {x0,x1,z0,z1} = REAR; // (behind the kitchen; the extension rear wall is z = -176)
    r.wheelie=REAR.wheelie;r.waterButt=REAR.butt;
    const edgeTurf=mGrass().clone();edgeTurf.vertexColors=true;edgeTurf.userData.nature='turf';
    B.geo(new T.BoxGeometry(x1-x0,4,z1-z0,26,1,30),(x0+x1)/2,GY+2,(z0+z1)/2,edgeTurf,{uv:110});
    B.box((205+x1)/2,GY+2,(z1-56)/2,x1-205,4,-56-z1,mGrass(),{uv:110});
    // Patio, 90 cm path, shed apron and the short turn joining path to patio. Adjacent edges share no faces.
    const paving=r.gardenPathNight=mSlab().clone();for(const [a,b,c,d]of REAR.paving)B.box((a+c)/2,GY+1.7,(b+d)/2,c-a,4,d-b,paving,{uv:100});
    // the back of the house: brick, the kitchen window and the back door from outside, Jack's window up above
    // Original upper rear elevation; the kitchen below now projects 1.2 m under a shallow felt roof.
    solidWall(B,60,-62.6,180,[[-360,-196],[360,-196],[360,94],[-360,94]],mBrick(),.8,[...REAR.bedroomWindows.map(w=>[[w.x0-60,w.y0],[w.x1-60,w.y0],[w.x1-60,w.y1],[w.x0-60,w.y1]]),[[210,-137],[320,-137],[320,-14],[210,-14]]]);
    solidWall(B,312.5,-57.4,180,[[-107.5,95],[107.5,95],[107.5,356],[-107.5,356]],mBrick(),1.6,[[[-42.5,143],[67.5,143],[67.5,253],[-42.5,253]]]);
    solidWall(B,-47.5,-177,180,[[-252.5,95],[252.5,95],[252.5,356],[207.5,356],[207.5,GY-205],[127.5,GY-205],[127.5,356],[-252.5,356]],mBrick(),.8,[[[-112.5,143],[7.5,143],[7.5,253],[-112.5,253]]]);
    B.box(-292.5,225,-116.6,15,260,121.2,mBrick(),{uv:128});
    for(const [y,h]of [[119,48],[295,120]])B.box(203,y,-116.6,6,h,121.2,mBrick(),{uv:128});
    for(const [z,d]of [[-168.6,17.2],[-68,24]])B.box(203,189,z,6,92,d,mBrick(),{uv:128});
    const felt=M({c:'#535650',sh:3}),fascia=M('#ded9cd');
    B.box(-47.5,77,-64,525,2,20,M('#414842')); // lead flashing up to the old rear wall
    B.box(-47.5,86,-121,525,16,150,felt); // solid roof including soffit, fall carried by its thick front fascia
    B.box(-47.5,94,-195,525,12,4,fascia);
    for(const x of [-308,213])B.box(x,94,-121,4,12,144,fascia);
    B.cyl(-47.5,99,-199,4,4,529,10,M('#414842'),{rz:90});
    B.cyl(207,224,-193,3.5,3.5,250,10,M('#414842'));
    {const a=new T.Vector3(207,218,-193),b=new T.Vector3(REAR.butt.x,GY-92,REAR.butt.z),d=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),pipe=new T.CylinderGeometry(2.2,2.2,d.length(),8);pipe.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));B.geo(pipe,mid.x,mid.y,mid.z,M('#414842'));}
    // The rooms behind the east rear wall are not walkable: deep closed curtains seal their reveals.
    const closedRearWindow=(cx,y0,y1,z)=>{
      const w=110,h=y1-y0,cy=(y0+y1)/2,frame=M({c:'#f2f0ea',family:'glossPaint'}),fabric=M('#d9d1bb');
      B.box(cx,cy,z+7,w-4,h-4,2,M('#827b70'));
      for(let i=0;i<16;i++)B.rbox(cx-w/2+5+i*(w-10)/15,cy,z+3+(i%2)*1.3,8,h-7,3,1,fabric);
      for(const x of [cx-w/2+3,cx,cx+w/2-3])B.box(x,cy,z-3,6,h,9,frame);
      for(const y of [y0+3,y1-3])B.box(cx,y,z-3,w,6,9,frame);
      for(const x of [cx-w/2,cx+w/2])B.box(x,cy,z+2,1,h,14,M('#c5bfb0'));
      B.box(cx,cy,z-4,w-6,h-6,.35,M({c:'#c8d8f0',o:.14,tr:true,sh:90,sp:'#fff'}));
      B.rbox(cx,y1+2,z-4,w+12,4,16,.8,frame);
    };
    closedRearWindow(325,-137,-14,-66);closedRearWindow(325,143,253,-61);
    const EW = B.at(0,0,-120);
    for(const x of [-158,-42,-100])EW.box(x,198,-59,4,x===-100?102:110,3,mWhite);
    for(const y of [145,251])EW.box(-100,y,-59,112,4,3,mWhite);
    EW.plane(-100,198,-61.2,112,102,M({c:'#c8d8f0',o:.12,tr:true,sh:80,sp:'#7c8f99'}),{ry:180});
    EW.box(76.8,GY-102,-58.5,5.6,204,3,mWhite);EW.box(163.2,GY-102,-58.5,5.6,204,3,mWhite);EW.box(120,GY-206,-58.5,92,6,3,mWhite);EW.box(120,GY-.8,-58,80,1.6,8,M('#9a9a92'));

    // fences down both sides and across the end, the gate at the end, next door's roofs over the top
    const fm = mFence();
    // One post per corner; panel ends butt against post shoulders. The old
    // full-length panels and two offset corner posts shared exposed faces.
    const left = x0 + 4, right = x1 - 4, rear = z0 + 4, front = z1 - 4;
    const postM = M({ c: '#fff', map: tex('pineDark'), family:'rawWood' }), zs = Array.from({length:9},(_,i)=>rear+(front-rear)*i/8);
    const post = (x,z) => { B.box(x,GY-94,z,8,188,8,postM,{uv:60}); B.rbox(x,GY-189,z,9.2,2,9.2,.5,postM,{uv:60}); };
    for (const x of [left, right]) {
      const run=x===right?zs.map((z,i)=>z+120*i/(zs.length-1)):zs;
      for (const z of run) post(x,z);
      for (let i=1;i<run.length;i++) {
        const px=x===left?x0+1.5:x1-1.5,cz=(run[i-1]+run[i])/2,len=run[i]-run[i-1]-8,inside=x===left?1:-1;
        B.geo(new T.BoxGeometry(3,180,len,1,6,1),px,GY-90,cz,fm,{uv:100});
        B.box(px+inside*1.5,GY-6,cz,5,12,len,M('#827c6b'));
        B.rbox(px,GY-181,cz,5,3,len+1,.5,postM,{uv:60});
        for(const yy of [-48,-139])B.box(px+inside*3.2,GY+yy,cz,3.2,7,len,postM,{uv:60});
      }
    }
    B.box(-316,GY-90,-178,32,180,3,fm,{uv:100});
    post(424,-60);B.box(430,GY-90,-61.5,4,180,3,fm,{uv:100});
    const xs = [left, left+(right-left)/3, left+2*(right-left)/3, right];
    for (let i=1;i<xs.length-1;i++) post(xs[i],rear);
    for (let i=1;i<xs.length;i++) {
      const cx=(xs[i-1]+xs[i])/2,len=xs[i]-xs[i-1]-8;
      B.box(cx,GY-90,z0+1.5,len,180,3,fm,{uv:100});
      B.box(cx,GY-6,z0+3,len,12,5,M('#827c6b'));
      B.rbox(cx,GY-181,z0+1.5,len+1,3,5,.5,postM,{uv:60});
      for(const yy of [-48,-139])B.box(cx,GY+yy,z0+4.7,len,7,3.2,postM,{uv:60});
    }
    // Small solid tufts grow over the gravel board, clear of the walking route.
    const weed=M('#526340');
    for(let i=0;i<18;i++){const x=left+12+i*(right-left-24)/17,z=rear+8+(i%3)*1.2;
      for(let j=0;j<3;j++)B.ball(x+(j-1)*2.1,GY-3-(j%2)*1.5,z,1.5,4+j,1.2,weed,5,{rz:(j-1)*23});
    }
    for(const [x,end]of [[left+8,front-12],[right-8,-72]])for(let z=rear+45;z<end;z+=140){
      for(let j=0;j<3;j++)B.ball(x+(j%2)*1.3,GY-3-(j%2)*1.5,z+(j-1)*2.1,1.2,4+j,1.5,weed,5,{rx:(j-1)*23});
    }
    for(const [x,z]of [[-318,-186],[-306,-186],[428,-69]])for(let j=0;j<3;j++)B.ball(x+(j-1)*2.1,GY-3-(j%2)*1.5,z,1.5,4+j,1.2,weed,5,{rz:(j-1)*23});
    // the shed (Dad's), the whirly washing line, the wheelie bin, a flower bed, the water butt, a tree
    const sh=B.at(REAR.shed.x,GY,REAR.shed.z,0,{sx:1.2,sy:.9}),shw=shedWood();
    r.shedLatch=M({c:'#a0a597',sh:30,sp:'#505448'}).clone();exteriorLightLook(r);
    sh.geo(new T.BoxGeometry(150,200,120,1,6,1),0,-100,0,shw,{uv:60});
    const gable=new T.Shape();gable.moveTo(-75,-200);gable.lineTo(0,-221);gable.lineTo(75,-200);gable.closePath();sh.geo(new T.ExtrudeGeometry(gable,{depth:120,bevelEnabled:false}),0,0,-60,shw,{uv:60});
    const roof=new T.Shape();roof.moveTo(-81,-200);roof.lineTo(0,-224);roof.lineTo(81,-200);roof.lineTo(81,-194);roof.lineTo(0,-218);roof.lineTo(-81,-194);roof.closePath();sh.geo(new T.ExtrudeGeometry(roof,{depth:132,bevelEnabled:false}),0,0,-66,M({c:'#3d4140',sh:5}));
    sh.box(20, -99, 61, 63.33, 194.4, 3, shw, { uv: 60 }); sh.box(20, -99, 63, 59, 186, 1, shedWood()); sh.box(50, -90, 64, 3, 10, 2, r.shedLatch);
    sh.box(-48,-120,60.5,30,36,.5,M({c:'#6c7f84',sh:75,sp:'#bac8cc'}));for(const x of [-64,-32])sh.box(x,-120,61.5,2,40,2,mWhite);for(const y of [-139,-101])sh.box(-48,y,61.5,30,2,2,mWhite);sh.box(-48,-120,61.8,1.5,36,1,mWhite);
    for(const y of [-160,-40]){sh.box(-10,y,63,9,2,1,mMetal);sh.cyl(-12,y,63,1,1,5,10,mMetal)}sh.rbox(50,-84,65.4,4,5,2,.5,r.shedLatch);sh.cyl(50,-83.5,66.5,.35,.35,.3,8,M('#282a2b'),{rx:90});
    sh.shadow(0, 0, 0, 170, 140, 0.6, { sq: true });
    const washingBatch=K.batch(),wl=K.into(washingBatch).at(REAR.dryer.x,GY,REAR.dryer.z);wl.cyl(0,-100,0,2,2.4,200,10,mMetal);wl.cyl(0,-201,0,3,3,5,12,mMetal);
    for(let i=0;i<4;i++)wl.geo(new T.TorusGeometry(40+i*28,.5,4,32),0,-196+i*4,0,M('#ddd'),{rx:90});
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2,a=new T.Vector3(0,-202,0),b=new T.Vector3(Math.cos(angle)*126,-183.71,Math.sin(angle)*126),d=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),arm=new T.CylinderGeometry(.8,.8,d.length(),8);
      arm.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));wl.geo(arm,mid.x,mid.y,mid.z,mMetal);
    }
    // Peg actual garments to the third line; the old painted blocks floated
    // below the wires. Fabric has a closed edge and a gently uneven drape.
    [['#ece9de',46,65,'sheet'],['#31588e',26,30,'shorts'],['#cb8b97',34,40,'shirt'],['#c6c6bb',30,45,'sheet']].forEach(([colour,w,h,kind],i)=>{
      const angle=i*Math.PI/2+.4,peg=kind==='shirt'?8:w/2-5,radius=Math.sqrt(96*96-peg*peg),C=wl.at(Math.cos(angle)*radius,-188,Math.sin(angle)*radius,(-angle-Math.PI/2)/D2R),fabric=M({c:colour,family:'fabric'});
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
    r.washingLine=new T.Group();r.washingLine.name='garden:washing-line';washingBatch.build(r.washingLine);r.group.add(r.washingLine);
    const wb=B.at(r.wheelie.x,GY,r.wheelie.z),green=M({c:'#2a5a2a',family:'outdoorPlastic'});
    const number=M({c:'#fff',map:K.tex('hs.bin.number',256,512,(q,w,h)=>{q.save();q.scale(1,4/3);h=384;const fade=q.createLinearGradient(0,0,w,h);fade.addColorStop(0,'#467044');fade.addColorStop(.55,'#2a522c');fade.addColorStop(1,'#213f25');q.fillStyle=fade;q.fillRect(0,0,w,h);q.font='bold 110px '+A.UIF;q.textAlign='center';q.fillStyle='#b9bea1';q.fillText('99',128,205);const r=K.rnd(1717);for(let i=0;i<450;i++){q.fillStyle=i%2?'rgba(26,52,28,.4)':'rgba(197,207,172,.14)';q.fillRect(r()*w,r()*h,1+r()*9,1+r()*2)}for(let i=0;i<18;i++){const x=r()*w;q.fillStyle='rgba(18,31,16,.16)';q.fillRect(x,r()*h,1,25+r()*100)}q.restore()},{clamp:true,family:'outdoorPlastic'})});
    const body=K.roundBox(58,98,70,4,2),bp=body.attributes.position;for(let i=0;i<bp.count;i++){const k=.925-bp.getY(i)/98*.15;bp.setX(i,bp.getX(i)*k);bp.setZ(i,bp.getZ(i)*k)}body.computeVertexNormals();const bu=body.attributes.uv;for(let i=0;i<bu.count;i++)bu.setY(i,1-bu.getY(i));batch.add(body,K.xform(wb.base,0,-61,0),i=>i<2?number:green);body.dispose();
    const rib=M({c:'#245024',family:'outdoorPlastic'});wb.rbox(0,-112,4,60,6,74,2,rib);
    for(const side of [-1,1])for(const z of [-21,0,21])wb.box(side*27,-62,z,1.7,72,3,rib,{rz:side*2.5});
    for(const x of [-22,22])wb.box(x,-115.3,5,2,.6,55,green);
    for(const z of [-22,29])wb.box(0,-115.3,z,42,.6,2,green);


    for(const x of [-22,22]){wb.cyl(x,-12,-28,12,12,7,24,M('#202224'),{rz:90});wb.cyl(x+(x<0?-3.6:3.6),-12,-28,4,4,.4,14,M('#777b7c'),{rz:90});wb.box(x,-6,26,4,12,5,green)}
    wb.cyl(0,-12,-28,1.2,1.2,49,12,mMetal,{rz:90});for(const x of [-18,18]){wb.box(x,-60,35.2,1.2,74,.8,M({c:'#245024',family:'outdoorPlastic'}));wb.box(x,-109,-37,3,8,7,green)}wb.cyl(0,-112,-40,1.4,1.4,39,12,green,{rz:90});wb.shadow(0,0,0,70,84,.6,{sq:true});
    const fb=B.at(REAR.flowers.x,GY,REAR.flowers.z);
    // Soil meets the inner faces; end boards fit BETWEEN the side boards.
    fb.box(0,-4,0,106,8,56,M('#3a2a1a'));
    for(const x of [-55,55])fb.box(x,-5,0,4,10,64,M('#725437'));
    for(const z of [-30,30])fb.box(0,-5,z,106,10,4,M('#725437'));
    for(let i=0;i<12;i++){const x=-46+i*8.3,z=-16+(i%3)*16,c=['#cf4e5d','#e2bd45','#c97ba0','#e4dfd0','#d78441'][i%5],petal=M(c);fb.cyl(x,-15,z,.35,.35,14,6,M('#376f39'));for(let k=0;k<5;k++){const a=k*Math.PI*2/5;fb.ball(x+Math.cos(a)*2.4,-22,z+Math.sin(a)*2.4,2.1,.7,1.4,petal,8,{ry:-a/D2R})}fb.ball(x,-22.5,z,1.1,.7,1.1,M('#d0a542'),8);for(const s of [-1,1])fb.ball(x+s*1.9,-15,z,2.4,.3,1,M('#4c8249'),8,{rz:s*25})}
    const wbt=B.at(r.waterButt.x,GY,r.waterButt.z);wbt.cyl(0,-45,0,26,24,90,28,M({c:'#315d39',family:'outdoorPlastic'}));wbt.cyl(0,-91,0,27,27,2,28,M({c:'#24482c',family:'outdoorPlastic'}));
    for(const y of [-20,-68])wbt.geo(new T.TorusGeometry(y===-20?24.5:25.5,.65,6,40),0,y,0,M('#284b30'),{rx:90});wbt.cyl(0,-14,25.5,1.4,1.4,6,12,M('#292d2e'),{rx:90});wbt.box(0,-17,29,7,1.3,2,M('#292d2e'));wbt.shadow(0,0,0,58,58,.5);
    // A spreading old apple and a slender pear: different branch rhythms and crowns.
    const foliage=[];tree(B,330,-1335,250,62,0,foliage);tree(B,90,-1400,275,48,2,foliage);
    const shrub=M({c:'#729452',vc:true,sh:2,map:treeFoliage()});shrub.userData.nature='leaf';
    for(const [x,z,w,h]of [[382,-1438,30,37],[351,-1445,35,25],[168,-1442,32,30],[199,-1441,24,23]]){
      foliage.push({matrix:K.xform(B.base,x,GY-h*.74,z,{sx:w,sy:h,sz:w*.76,ry:x}),seed:Math.round(x)});B.shadow(x,GY,z,w*2,w*1.6,.36);
      H.block('G',x-w*.5,z-w*.4,x+w*.5,z+w*.4,{top:GY-h*1.74});
    }
    B.box(-10,GY-1,-181,410,2,2,M('#6a6a62')); // grounded edging, not a floating bar
    natureColours(batch.build(r.group));
    r.group.add(K.foliageInstances(foliage,shrub));
    H.spot('hs.shed', { label: "Dad's shed", act: sayLines('hs.shed', "Dad's shed", ['Dad\'s shed. Padlocked. Inside: the lawnmower, 200 jam jars of screws, and a radio tuned to the cricket.', 'Dad goes in the shed "to sort it out". He has been sorting it out since 1994.']) });pickBox(r,'hs.shed',REAR.shed.x,GY-90,REAR.shed.z,180,180,120);
    H.spot('hs.wheelie', { label: 'The wheelie bin', act: sayLines('hs.wheelie', 'The wheelie bin', ['Bin day is Tuesday. Dad wheels it out at 6am like it\'s a race.', 'It smells. It always smells. Don\'t open it.']) });pickBox(r,'hs.wheelie',r.wheelie.x,GY-55,r.wheelie.z,60,116,82);
    H.spot('hs.washline', { label: 'The washing line', act: sayLines('hs.washline', 'The washing line', ['The whirly washing line. Mom\'s sheets, Dad\'s work shirts, and my PE kit, flapping about for the whole street to see.', 'If you spin it fast enough the pegs fly off. Don\'t.']) }); pickBox(r, 'hs.washline', REAR.dryer.x, GY - 150, REAR.dryer.z, 190, 110, 190);
    H.spot('hs.flowers', { label: "Mom's flower bed", act: sayLines('hs.flowers', "Mom's flower bed", ['Mom\'s flowers. Do NOT kick the football near Mom\'s flowers. (I have kicked the football into Mom\'s flowers.)']) });pickBox(r,'hs.flowers',REAR.flowers.x,GY-14,REAR.flowers.z,114,28,64);
    H.spot('hs.butt', { label: 'The water butt', act: sayLines('hs.butt', 'The water butt', ['The water butt. Full of rainwater and one very confused frog.']) });pickBox(r,'hs.butt',r.waterButt.x,GY-45,r.waterButt.z,56,94,60);
    H.spot('hs.jackwin', { label: 'My window (from outside)', act: () => say("My window", 'That\'s my room up there. You can see the posters. {mate1} throws stones at it when my Mom won\'t let {mate1.him} ring the bell.') }); pickBox(r, 'hs.jackwin', 191, -63, -58, 70, 98, 4);
    H.walkRect('G',x0+6,z0+6,x1-6,z1-2,{room:'garden'});
    H.walkRect('G',205,z1-2,x1-6,-58,{room:'garden'});
    H.walkRect('G',84,z1-4,156,z1+6,{door:'back',room:'garden'});
    H.block('G',-300,z1-8,80,z1+8);H.block('G',160,z1-8,205,z1+8);
    H.block('G',-322,-1392,-138,-1268);H.block('G',339,-322,401,-237);
    H.block('G',-227,-732,-113,-668);H.block('G',207,-250,263,-190,{top:GY-92});H.block('G',247,-653,253,-647);
    H.block('G',319,-1346,341,-1324);H.block('G',79,-1411,101,-1389);
    H.support('garden',217,-240,253,-204,GY-92);for(const p of REAR.paving)H.support('garden',...p,GY-.3);H.support('garden',339,-313,401,-239,GY-115);
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
    // The street in front (js/hs-world.js FRONT.STREET; js/hs-environment.js carries it on both ways): the pavement, the kerb, the road.
    const [pv0,pv1]=STREET.pave,[rd0,rd1]=STREET.road;
    B.box(300,GY+1.6,(pv0+pv1)/2,1800,4,pv1-pv0,mSlab(),{uv:100});
    // The neighbourhood owns the continuous carriageway, including this
    // stretch. A separate house-lit slab used to leave a hard colour seam.
    // The near kerb meets the street's 12 cm kerb at both ends. Real joints
    // are shallow grooves in closed blocks, with a darker seated foot course.
    const kerbStone=M('#9a9a92');
    for(let x=-600;x<1200;x+=100)B.rbox(x+50,GY-5,STREET.kerb,99.6,14,rd0-pv1,.45,kerbStone);
    B.box(300,GY+2.1,STREET.kerb,1800,1.8,rd0-pv1,M('#55564f'));
    const drainIron=M({c:'#1f2122',sh:40,sp:'#555'}),drainZ=rd0+13;
    B.box(675,GY+.7,drainZ,38,2,22,drainIron);
    const grateSteel=M({c:'#4a4f4c',sh:30,sp:'#3a3f3c'}); // shares the lamp column's material
    for(let x=660;x<=690;x+=5)B.box(x,GY-.1,drainZ,2.4,.8,18,grateSteel);
    for(const x of [120,-340])B.box(x,GY-1,(685+FZ)/2,3,3,FZ-715,M('#8c8679'));
    // A clear pedestrian route beside the parked car.
    B.box(290,GY-.45,(752+FZ)/2,84,1,FZ-752,mSlab(),{uv:100});
    for(const x of [246.5,333.5])B.box(x,GY-.7,(752+FZ)/2,3,1.5,FZ-752,M('#8c8679')); // a brick-on-edge border each side
    // the front of the house: brick, the bay window, the front door from outside, the number
    solidWall(B,60,703,0,[[-360,-196],[360,-196],[360,GY],[280,GY],[280,GY-205],[200,GY-205],[200,GY],[-360,GY]],mBrick(),2,[[[-230,150],[-10,150],[-10,300],[-230,300]]]);
    // Recessed upstairs glazing is framed on all sides, with proper sill depth.
    const upperGlass=M({c:'#fff',sh:42,sp:'#809294',map:K.tex('hs.upperglass',128,128,(g,w,h)=>{const c=g.createLinearGradient(0,0,30,h);c.addColorStop(0,'#71828a');c.addColorStop(.5,'#4c626a');c.addColorStop(1,'#344d59');g.fillStyle=c;g.fillRect(0,0,w,h);g.fillStyle='rgba(208,199,172,.2)';g.fillRect(2,0,15,h);g.fillRect(w-17,0,15,h);g.fillStyle='rgba(215,227,221,.1)';g.beginPath();g.moveTo(0,24);g.lineTo(w,65);g.lineTo(w,75);g.lineTo(0,34);g.fill()},{clamp:true})});
    for(const [x,w]of [[-175,108],[55,108],[330,72]]){B.box(x,-57,703.3,w+10,138,2,M('#383c38'));B.box(x,-57,705,w,128,1.2,upperGlass);
      for(const side of [-1,1])B.box(x+side*(w/2+2.5),-57,706,5,138,6,mWhite);
      for(const y of [-123,9])B.box(x,y,706,w,5,6,mWhite);B.box(x,-57,706,4,128,4,mWhite);B.box(x,15,708,w+15,6,12,M('#b8b4a5'));
    }
    // Open frame, not a solid white panel hiding the lounge window.
    for(const x of [-174,54])B.box(x,225,704.3,8,160,8,mWhite);
    for(const y of [147.2,302.5])B.box(-60,y,704.3,220,5,8,mWhite); // no coplanar underside with the lounge's frame
    r.bayGlow=M({c:'#1a2a3a',o:.28,tr:true,sh:100,sp:'#fff'}).clone();
    B.plane(-60,225,708.5,220,150,r.bayGlow);
    // a deep stone sill under the lounge window and a concrete lintel over it, both proud of the brick
    B.rbox(-60,308.5,709.5,240,6,15,0.8,M('#b8b4a5'));B.box(-60,143.6,704.2,232,7,2.4,M('#a59d8f'));
    B.box(256.8, GY - 102, 703, 5.6, 204, 3, mWhite); B.box(343.2, GY - 102, 703, 5.6, 204, 3, mWhite); B.box(300, GY - 206, 703, 92, 6, 3, mWhite);
    B.box(300, GY - 215, 715, 100, 14, 26, M('#e8e4dc')); B.box(300, GY - 222, 728, 100, 2, 2, M('#9a9a92')); // the porch roof, housed into the outer brickwork
    // Clear of both the door frame and lantern: a solid enamel plaque with brass ink.
    B.rbox(229,GY-174,703.8,24,28,2.4,1.2,M('#272c2a'));
    B.box(229,GY-174,705.1,21,25,.22,{all:M('#272c2a'),f:M({c:'#fff',map:K.tex('hs.numb',128,160,g=>{
      g.fillStyle='#272c2a';g.fillRect(0,0,128,160);g.strokeStyle='#a58c4c';g.lineWidth=3;g.strokeRect(5,5,118,150);
      A.text(g,'42',64,113,'bold 92px Georgia','#e9cf8f','center');
    },{clamp:true})})});
    // The single WELCOME mat is inside the hall, where the post lands.
    // a black coach lantern on the wall beside the front door (the old free-standing post stood in front of the car boot)
    { const ln = B.at(354, GY - 176, 703), black = M({ c: '#1d1e1f', sh: 40, sp: '#444' });
      ln.rbox(0, 0, 1.2, 7, 15, 2.4, 0.6, black); ln.cyl(0, -1, 6.6, 0.8, 0.8, 9, 8, black, { rx: 90 });
      r.porchGlow=M({c:'#f2e7c6',o:.86,tr:true,sh:80,sp:'#fff'}).clone();
      ln.cyl(0, 9, 11.5, 6.2, 5, 16, 4, r.porchGlow, { ry: 45 });
      ln.cyl(0, 0.2, 11.5, 1.4, 8.6, 4.4, 4, black, { ry: 45 }); ln.cyl(0, 17.6, 11.5, 5.4, 5.4, 1.8, 4, black, { ry: 45 }); ln.ball(0, -2.6, 11.5, 1.3, 1.3, 1.3, black, 8); ln.cyl(0, 20, 11.5, 0.5, 1.2, 3, 8, black);
      for (const [dx, dz] of [[-4.1, 0], [4.1, 0], [0, -4.1], [0, 4.1]]) ln.box(dx, 9, 11.5 + dz, 0.6, 16, 0.6, black, { ry: 45 }); }
    // Next door is a complete solid model in the shared neighbourhood.
    // a low front wall with a gate, the hedge, a lamp-post on the pavement
    // Openings: the pedestrian gate (x 248..332, on the path's line) and the wide gateway Dad drives through (356..620).
    const capM = M('#9a9a92');
    // A low wall (50 cm of brick under a 5 cm coping, 22 thick) between proper piers: 33 cm square, 114 cm of brick under
    // a 42 cm stone cap and a smaller one on that (PIER_TOP above the ground: the Halloween lantern stands on it).
    for (const [a, b] of [[-360, FRONT_PIERS[0] - 16.5], [FRONT_PIERS[2] + 16.5, 730]]) { B.box((a + b) / 2, GY - 25, FZ - 5, b - a, 50, 22, mBrick(), { uv: 128 }); B.rbox((a + b) / 2, GY - 52.5, FZ - 5, b - a, 5, 26, .8, capM); }
    for (const x of FRONT_PIERS) { B.box(x, GY - 57, FZ - 5, 33, 114, 33, mBrick(), { uv: 128 }); B.rbox(x, GY - 117, FZ - 5, 42, 6, 42, 1, capM); B.rbox(x, GY - PIER_TOP + 2, FZ - 5, 34, 4, 34, .8, capM); }
    // The pedestrian gate: a black steel leaf standing open against the inside of its pier (it squeaks).
    { const gt = B.at(FRONT_PIERS[1] - 10, GY, FZ - 25, -90), iron = M({ c: '#1f2122', sh: 40, sp: '#555' });
      for (const y of [-12, -46, -80]) gt.box(-40, y, 0, 78, 3, 3, iron);
      for (let x = -76; x <= -4; x += 9) gt.box(x, -46, 0, 1.8, 70, 1.8, iron);
      gt.box(-2, -46, 0, 3.4, 74, 3.4, iron); gt.box(-78, -46, 0, 3.4, 74, 3.4, iron); for (const y of [-20, -72]) gt.cyl(-.5, y, 0, 2, 2, 5, 8, iron);
      gt.box(-74, -52, 2.5, 3, 6, 2, M({ c: '#c8a040', family: 'brass' })); gt.shadow(-40, 0, 0, 84, 14, .35, { sq: true }); }
    const clippedHedge=M({c:'#fff',vc:true,sh:2,sp:'#142316',map:K.tex('hs.hedge.leaves',128,128,(g,w,h)=>{const r=K.rnd(812);g.fillStyle='#3e5934';g.fillRect(0,0,w,h);for(let i=0;i<1900;i++){g.fillStyle=['#405a34','#48653a','#344e2d','#516d40'][(r()*4)|0];g.beginPath();g.ellipse(r()*w,r()*h,1.5+r(),.7+r()*.6,r()*Math.PI,0,Math.PI*2);g.fill()}})});
    clippedHedge.userData.nature='leaf';
    // One closed clipped hedge: a softly rounded continuous body, with small leaf-scale undulations rather than separate balls.
    function clippedBoundary(x0,x1,z0,z1,height,base=GY){
      const width=x1-x0,depth=z1-z0,round=Math.min(9,width/3,depth/3);
      const geo=new T.BoxGeometry(width,height,depth,Math.ceil(width/18),8,Math.ceil(depth/18)),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i),cx=Math.max(-width/2+round,Math.min(width/2-round,x)),cy=Math.max(-height/2+round,Math.min(height/2-round,y)),cz=Math.max(-depth/2+round,Math.min(depth/2-round,z));
        const dx=x-cx,dy=y-cy,dz=z-cz,len=Math.hypot(dx,dy,dz)||1;
        const bottom=Math.max(0,Math.min(1,(height/2-y)/10)),ripple=(2.4*Math.sin(x*.1+z*.08)*Math.sin(y*.08)+1.4*Math.sin(x*.21+y*.16+z*.08))*bottom;
        const top=Math.max(0,Math.min(1,(-y-height/2+16)/12)),swell=(1.2*Math.sin(x*.06)+.6*Math.sin(x*.24))*top;
        p.setXYZ(i,cx+dx/len*(round+ripple),cy+dy/len*(round+ripple)+swell,cz+dz/len*(round+ripple));
      }
      geo.computeVertexNormals();
      // Box-face seams share their averaged normals, keeping the round top continuous from every walkable side.
      const n=geo.attributes.normal,sums=new Map(),keys=[];
      for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1000)).join(',');keys.push(key);const q=sums.get(key)||new T.Vector3();q.x+=n.getX(i);q.y+=n.getY(i);q.z+=n.getZ(i);sums.set(key,q)}
      for(const q of sums.values())q.normalize();for(let i=0;i<n.count;i++){const q=sums.get(keys[i]);n.setXYZ(i,q.x,q.y,q.z)}
      B.geo(geo,(x0+x1)/2,base-height/2,(z0+z1)/2,clippedHedge,{uv:80});
      // Small overlapping tips break the clipped silhouette without turning
      // the face into a row of separate balls. The continuous body carries it.
      if(width>depth)for(let i=0;i<20;i++){
        const cx=x0+22+i*(width-44)/19;
        B.ball(cx,base-height+10-(i%3)*1.4,(z0+z1)/2,22,17+(i%2)*2,depth*.49,clippedHedge,10);
      }
    }
    clippedBoundary(-360,FRONT_PIERS[0]-17.5,HEDGE[0],HEDGE[1],124);
    B.shadow((-360+FRONT_PIERS[0]-17.5)/2,GY,(HEDGE[0]+HEDGE[1])/2-30,FRONT_PIERS[0]+342.5,24,.35,{sq:true});
    // Low brick garden boundary: entirely outside the mowable turf. The short
    // return meets the house corner without running through the side-gate leaf.
    const boundaryStart=600,leftStart=700,boundaryEnd=FZ-5;
    B.box(-352,GY-34,(leftStart+boundaryEnd)/2,18,68,boundaryEnd-leftStart,mBrick(),{uv:128});
    B.rbox(-352,GY-70,(leftStart+boundaryEnd)/2,23,4,boundaryEnd-leftStart,.7,capM);
    B.box(-326,GY-34,leftStart,52,68,18,mBrick(),{uv:128});
    B.rbox(-326,GY-70,leftStart,52,4,23,.7,capM);
    for(let z=leftStart;z<boundaryEnd-20;z+=195){
      B.box(-352,GY-43,z,26,86,26,mBrick(),{uv:128});B.rbox(-352,GY-88,z,30,4,30,.6,capM);
    }
    // The drive side shares the existing collider (716..740). Keep its full
    // clear width, car, boot, gate and all saved placements in place.
    B.box(728,GY-15,(boundaryStart+FZ-16)/2,24,30,FZ-16-boundaryStart,mBrick(),{uv:128});
    clippedBoundary(717,739,boundaryStart,FZ-16,102,GY-25);
    // The street lamp stands at the kerb, off to the side of the plot (not across the front of the house):
    // a tapered steel column on a base with its access door, a swan-neck arm and a sodium lantern over the road.
    const lp = B.at(LAMP.x, GY, LAMP.z), col = M({ c: '#4a4f4c', sh: 30, sp: '#3a3f3c' });
    lp.rbox(0, -30, 0, 30, 60, 25, 1.4, col); lp.box(0, -32, 12.8, 16, 34, 0.6, M('#3d423f')); lp.box(4, -32, 13.2, 1.4, 1.4, 0.6, M('#262826')); // (the base cabinet with its access door: a real one, 30 x 60)
    lp.lathe(0, 0, 0, [[0.05, -506], [4.2, -506], [4.6, -490], [5.6, -300], [6.6, -120], [7.6, -48], [8, -46], [0.05, -46]], 14, col);
    lp.geo(new T.TubeGeometry(new T.CubicBezierCurve3(new T.Vector3(0, -500, 0), new T.Vector3(0, -545, 0), new T.Vector3(0, -548, 30), new T.Vector3(0, -530, 62)), 18, 3, 10, false), 0, 0, 0, col);
    lp.rbox(0, -524, 72, 18, 10, 46, 3, M({ c: '#2f3332', sh: 30 }), { rx: -12 });
    r.streetGlow = M({ c: '#f3c98a', e: phase() === 'day' ? '#000' : '#ffb24a', sh: 60, sp: '#fff' }).clone();
    lp.rbox(0, -519, 73, 14, 3, 38, 1.2, r.streetGlow, { rx: -12 });
    lp.shadow(0, 0, 0, 40, 36, 0.45, { sq: true });
    exteriorLightLook(r);
    // Dad's car: a burgundy family saloon (no real make), on the drive, nose to the street
    const frame = r.carFrame = Object.assign({}, CAR);
    const carBatch = K.batch(), carGroup = new T.Group();carGroup.name = 'Dads car';carGroup.userData.staticBatch = true;r.group.add(carGroup);
    const parked = r.car = { present: !window.HouseFamily?.carAway, known: !!window.HouseFamily?.ready, travelled: false, group: carGroup };
    const riding = t => t.at.room === 'drive' && ['rest','snap'].includes(t.st) && H.held() !== t.id && !t.at.hide && t.at.y < GY-6 && t.at.y >= GY-170 && Math.abs(t.at.x-frame.x)<=91*frame.s && Math.abs(t.at.z-frame.z)<=205*frame.s;
    r.awayThing = t => !parked.present && riding(t);
    const car = K.into(carBatch).at(frame.x, frame.y, frame.z, 0, { sx: frame.s, sy: frame.s, sz: frame.s }), cm = M({c:'#fff',map:K.tex('hs.car.paint',256,256,(g,w,h)=>{g.fillStyle='#752637';g.fillRect(0,0,w,h);const r=K.rnd(840);for(let n=0;n<14000;n++){g.fillStyle=n%3?'rgba(24,10,14,.07)':'rgba(219,142,153,.09)';g.fillRect(r()*w,r()*h,1,1)}for(let n=0;n<26;n++){const x=r()*w,y=r()*h;g.strokeStyle='rgba(196,126,139,.15)';g.lineWidth=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+3+r()*12,y+.7);g.stroke()}},{world:120}),sh:62,sp:'#64535d',reflect:.13,vc:true});
    const rubber=M({c:'#25282a',map:K.tex('hs.car.rubber',128,128,(g,w,h)=>{g.fillStyle='#deded5';g.fillRect(0,0,w,h);const r=K.rnd(841);for(let n=0;n<6000;n++){g.fillStyle=n%2?'rgba(18,20,18,.09)':'rgba(255,253,235,.09)';g.fillRect(r()*w,r()*h,1,1)}g.strokeStyle='rgba(47,50,44,.18)';g.lineWidth=1;for(let y=0;y<h;y+=12){g.beginPath();g.moveTo(0,y);g.lineTo(w*.5,y+6);g.lineTo(w,y);g.stroke()}},{world:16}),sh:6,sp:'#101312'}),chrome=M({c:'#a3a6a8',family:'metal',reflect:.12});
    // Lightly tinted glazing shares the small reflection cube and its cheap-
    // lighting guard. The cabin supplies the depth; no painted tree silhouettes.
    const gl=M({c:'#b2cbc5',family:'glass',sh:64,sp:'#334b50',reflect:.16,o:.32,tr:true,dw:false,side:2});gl.name='car glazing';
    car.rbox(0, -52, 40, 170, 46, 320, 9, cm);
    // Hollow boot: a solid floor, wheel-side walls and rear valance under a hinged lid.
    car.box(0,-20,-157,166,5,86,cm);
    car.box(0,-50.25,-199,166,58.5,4,cm);
    car.box(0,-50.25,-119,160,58.5,4,cm);
    for(const x of [-81,81])car.box(x,-50.25,-158,5,58.5,80,cm);
    car.box(0,-23,-157,154,1,76,M('#343235'));
    // Dad's tartan travel rug, spread over the boot carpet so whatever rides in the boot sits on something soft.
    { const g=new T.PlaneGeometry(146,70,24,10),pp=g.attributes.position;for(let i=0;i<pp.count;i++){const x=pp.getX(i),y=pp.getY(i);pp.setZ(i,.35+.35*Math.sin(x*.09+y*.05)*Math.cos(y*.13)+(Math.abs(y)>31?.6:0))}
      g.computeVertexNormals();const rug=K.tex('hs.car.rug',128,128,(c,w,h)=>{c.fillStyle='#5a2226';c.fillRect(0,0,w,h);c.fillStyle='rgba(28,52,40,.75)';for(let k=0;k<w;k+=32){c.fillRect(k+6,0,12,h);c.fillRect(0,k+6,w,12)}c.fillStyle='rgba(214,190,120,.55)';for(let k=0;k<w;k+=32){c.fillRect(k+24,0,2,h);c.fillRect(0,k+24,w,2)}A.grain(c,w,h,900,.06,77)});
      car.geo(K.thicken(g,.3),0,-23.55,-157,M({c:'#fff',map:rug,sh:2}),{rx:90});
      // The fabric sits above the boot's rigid floor: thin things must ride on
      // its folds, including saved props restored while this room is hidden.
      H.soft('drive',frame.x-73*frame.s,frame.z-192*frame.s,frame.x+73*frame.s,frame.z-122*frame.s,frame.y-23*frame.s,{sampleHidden:true,find:()=>{const meshes=[];r.group.traverse(o=>{if(o.isMesh&&!o.userData.noPick&&[].concat(o.material).some(m=>m.map===rug))meshes.push(o)});return meshes}});
      H.on('room',id=>{if(id==='drive')H.softChanged('drive')});
    }
    const hinge = new T.Group(); hinge.position.set(frame.x,frame.y-79*frame.s,frame.z-120*frame.s);
    hinge.scale.setScalar(frame.s); carGroup.add(hinge);
    const lid=K.into(hinge);lid.rbox(0,0,-39,166,5,80,2,cm);
    lid.box(0,2.9,-39,150,1.2,68,M('#423137'));
    for(const x of [-53,53])lid.box(x,4,-20,3,4,34,M('#55333d'));
    lid.rbox(0,1,-78,16,3,2,1,M('#aaa9a0'));
    let bootOpen=false;try{bootOpen=localStorage.getItem('jhp_car_boot')==='1';}catch(e){}
    hinge.rotation.x=bootOpen?-1.25:0;
    r.carBoot={hinge,open:bootOpen,toggle(){
      if (!parked.present) return false;
      this.open=!this.open;try{localStorage.setItem('jhp_car_boot',this.open?'1':'0');}catch(e){} const from=hinge.rotation.x,to=this.open?-1.25:0,start=performance.now();
      window.Sound?.play(this.open?'carboot':'carclose');
      H.anims.set('story-car-boot',now=>{const t=Math.min(1,(now-start)/650);hinge.rotation.x=from+(to-from)*t*t*(3-2*t);H.dirty();return t<1});
      H.dirty();
    }};
    car.rbox(0, -78, 20, 166, 10, 240, 4, cm); // the sills/belt line
    // Build in the house's y-down frame. Baking a negative scale into a batch
    // reverses triangle winding and makes the near windows disappear.
    // The glasshouse: 47 cm of glass (a saloon's, not an aquarium's) under a saloon's roof, raked front and back.
    { const cab = new T.BoxGeometry(150, 47, 210); const P2 = cab.attributes.position; for (let k = 0; k < P2.count; k++) if (P2.getY(k) < 0) { P2.setX(k, P2.getX(k) * 0.88); P2.setZ(k, P2.getZ(k) * 0.74 - 5); } cab.computeVertexNormals(); car.geo(cab, 0, -98.5, -14, gl); }
    car.rbox(0, -124.4, -19, 132, 5, 158, 2, cm); // the roof
    const trim = (top,bottom,material,width=1,overlap=0) => {const a=new T.Vector3(...top),b=new T.Vector3(...bottom),delta=b.clone().sub(a),centre=a.clone().add(b).multiplyScalar(.5);const geo=new T.BoxGeometry(width,delta.length()+overlap,width);geo.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize())));car.geo(geo,centre.x,centre.y,centre.z,material);};
    for(const side of [-1,1])for(const [top,bottom]of [[[side*66,-122,58.7],[side*75,-75,91]],[[side*66,-122,-96.7],[side*75,-75,-119]],[[side*66,-122,-14],[side*75,-75,-14]]]){trim(top,bottom,rubber,5,2);trim(top,bottom,cm,4,2)} // slim pillars
    for(const [y,z,width]of [[-121.6,58.9,132],[-75.3,91.2,150],[-121.6,-96.9,132],[-75.3,-119.3,150]])trim([-width/2,y,z],[width/2,y,z],rubber,2);
    // A complete, low-cost cabin can be seen through every pane. These solid
    // seats, headrests, dash and wheel stay in the existing static car batches.
    const cabin=M({c:'#343a3a',family:'plastic'}),seatCloth=M({c:'#535b62',family:'fabric'});seatCloth.name='car upholstery';
    car.box(0,-83.6,-15,140,1,196,cabin);
    for(const x of [-36,36]){
      car.rbox(x,-88,5,47,8,43,3,seatCloth);
      car.rbox(x,-103,-15,47,27,8,3,seatCloth,{rx:-8});
      car.rbox(x,-118,-18,23,8,9,2,seatCloth);
      for(const xx of [-7,7])car.cyl(x+xx,-113.5,-17,.65,.65,5,6,chrome);
    }
    car.rbox(0,-88,-76,130,8,40,3,seatCloth);
    car.rbox(0,-103,-94,130,28,8,3,seatCloth);
    for(const x of [-40,40])car.rbox(x,-118,-94,23,8,9,2,seatCloth);
    car.rbox(0,-91,66,138,13,20,3,cabin);
    car.rbox(-36,-99,61,38,8,13,2,cabin);
    car.geo(new T.TorusGeometry(14,1.5,6,18),-36,-104,43,cabin,{rx:-20});
    trim([-49,-104,43],[-23,-104,43],cabin,1.8);
    trim([-36,-104,43],[-36,-115,47],cabin,1.8);
    trim([-36,-104,43],[-36,-94,57],cabin,3);
    car.box(0,-87,13,13,9,40,cabin);
    car.ball(0,-96,20,2,2,2,cabin,8);car.cyl(0,-91,20,.7,.7,8,6,cabin);
    for(const side of [-1,1])car.box(side*72,-92,-14,2,18,190,cabin);
    // Wipers sit on the sloping windscreen, rear heater lines on the rear glass.
    for(const x of [-32,30]){trim([x-23,-81,87.7],[x+16,-88,83.2],rubber,1.2);trim([x-3,-77.5,90],[x-2,-84.5,85.6],rubber,1.5)}
    for(let y=-88;y>=-116;y-=7){const z=-119+(y+75)*(-22.3/47)-.35;trim([-64,y,z],[64,y,z],M('#786552'),.28)}
    [[-80,140],[80,140],[-80,-140],[80,-140]].forEach(([x,z])=>{
      const side=x>0?1:-1;car.cyl(x,-30,z,30,30,20,24,rubber,{rz:90});
      for(let n=0;n<24;n++){const a=n*Math.PI/12;if(Math.sin(a)>.94)continue;car.box(x,-30+Math.sin(a)*30,z+Math.cos(a)*30,17,.75,2.5,rubber,{rx:90-n*15})}
      car.geo(new T.TorusGeometry(26.5,2.8,8,24),x+side*8.5,-30,z,rubber,{ry:90});
      car.cyl(x+side*10.5,-30,z,18,18,1.5,24,chrome,{rz:90});car.cyl(x+side*11.4,-30,z,6,6,1,12,M('#5b5c60'),{rz:90});
      for(let n=0;n<8;n++){const a=n*Math.PI/4;car.cyl(x+side*11.45,-30+Math.sin(a)*12.5,z+Math.cos(a)*12.5,1.9,1.9,.35,8,rubber,{rz:90})}
      for(let n=0;n<4;n++){const a=n*Math.PI/2;car.cyl(x+side*12,-30+Math.sin(a)*8.2,z+Math.cos(a)*8.2,1,1,.7,6,chrome,{rz:90})}
    });
    car.cyl(-85.5,-58,-103,4.8,4.8,.5,16,cm,{rz:90});car.box(-86,-58,-103,.3,.5,3,rubber);
    trim([-65,-82,-108],[-65,-121,-108],chrome,.7);car.cyl(-65,-82,-108,2,2,2,12,rubber);
    // Dark window seals, centre pillars, door trim and inset handles frame the glass.
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
    hinge.traverse(o=>{if(o.isMesh&&o.material===cm&&!o.geometry.attributes.color){const colors=new Float32Array(o.geometry.attributes.position.count*3);colors.fill(1);o.geometry.setAttribute('color',new T.BufferAttribute(colors,3))}});
    const carMeshes=carBatch.build(carGroup);
    for(const mesh of carMeshes)if(mesh.material===cm){const p=mesh.geometry.attributes.position,colors=[];for(let i=0;i<p.count;i++){const y=(p.getY(i)-frame.y)/frame.s,dirt=Math.max(0,Math.min(1,(y+68)/45));colors.push(1-.13*dirt,1-.18*dirt,1-.16*dirt)}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3))}

    natureColours(batch.build(r.group));
    H.spot('hs.carboot',{obj:r.carBoot.hinge,label:'Car boot',range:185,act:()=>r.carBoot.toggle()});
    H.spot('hs.car', { label: "Dad's car", act: sayLines('hs.car', "Dad's car", ['Dad\'s car. Burgundy. It has a cassette player and a tin of travel sweets that are all stuck together.', 'Dad washes it every weekend "because it\'s a nice thing to do". It is never a nice thing to do.', 'There\'s a nodding dog on the parcel shelf. ' + 'My sister' + ' named it.']) }); pickBox(r,'hs.car',frame.x,GY-70*frame.s,frame.z+40*frame.s,170*frame.s,120*frame.s,300*frame.s);
    H.spot('hs.gate', { label: 'The front gate', act: sayLines('hs.gate', 'The front gate', ['The gate squeaks. Dad says he\'ll oil it. The gate has squeaked since 1991.', 'Beyond the gate: the street, the lamp-post, the postbox at the end. We don\'t go further than that today.']) }); pickBox(r, 'hs.gate', 290, GY - 40, FZ - 5, 84, 80, 20);
    H.spot('hs.lamppost', { label: 'The lamp-post', act: sayLines('hs.lamppost', 'The lamp-post', ['The lamp-post. Orange at night. Moths love it. We used it as the goal for about six years.']) }); pickBox(r, 'hs.lamppost', LAMP.x, GY - 260, LAMP.z, 18, 520, 18);
    H.spot('hs.bay', { label: 'The lounge window (from outside)', act: () => say('The bay window', 'The lounge. You can see the telly flickering through the nets. Mom twitches those nets at EVERYONE who walks past.') }); pickBox(r, 'hs.bay', -60, 225, 703, 236, 160, 6);
    // The front garden: the lawn, the path and the drive, round the car on both sides, out through either gate onto the
    // pavement (the far kerb is as far as we go today).
    H.walkRect('G', 124, 704, 716, STREET.pave[1] - 5, { room: 'drive' }); H.walkRect('G', -340, 704, 124, HEDGE[0] - 4, { room: 'drive' }); H.walkRect('G', -340, FZ - 20, 124, STREET.pave[1] - 5, { room: 'drive' }); H.walkRect('G', 262, 660, 338, 710, { door: 'front', room: 'drive' });
    H.block('G',-300,694,260,708);H.block('G',340,694,420,708); // no walking through front windows
    const carBlock = H.block('G', frame.x - 91 * frame.s, frame.z - 205 * frame.s, frame.x + 91 * frame.s, frame.z + 205 * frame.s, { solid: false, off: !parked.present }); // Dad's car (both sides stay walkable)
    // Things: the car is solid around a hollow boot. With the lid up you can put things in on Dad's rug (the story's PC parts
    // ride there); a shut lid closes it. (The car used to be one solid block up to the roof: nothing could go in the boot.)
    if (H.solid) {
      const cs = frame.s, X = lx => frame.x + lx * cs, Z = lz => frame.z + lz * cs, kind = 'car';
      H.solid('G', X(-91), Z(-121), X(91), Z(205), GY - frame.roof * cs, GY + 1, { kind, when: () => parked.present }); // bonnet, cabin, roof (the 47 cm glasshouse)
      H.solid('G', X(-91), Z(-205), X(91), Z(-121), GY - 23 * cs, GY + 1, { kind, when: () => parked.present }); // the boot floor and what's under it
      H.solid('G', X(-91), Z(-205), X(91), Z(-197), GY - 79.5 * cs, GY - 23 * cs, { kind, support: false, when: () => parked.present }); // the rear valance
      for (const sx of [-1, 1]) H.solid('G', X(sx < 0 ? -91 : 78.5), Z(-205), X(sx < 0 ? -78.5 : 91), Z(-121), GY - 79.5 * cs, GY - 23 * cs, { kind, support: false, when: () => parked.present }); // the wheel-arch sides
      H.solid('G', X(-79), Z(-197), X(79), Z(-121), GY - 81.5 * cs, GY - 76.5 * cs, { kind, when: () => parked.present && !r.carBoot.open }); // the 5 cm lid, leaving the storage space hollow
    }
    H.block('G', -360, HEDGE[0], FRONT_PIERS[0] - 16.5, FZ + 6); H.block('G', FRONT_PIERS[2] + 16.5, FZ - 16, 740, FZ + 6); // the front wall, with the hedge behind it
    for (const x of FRONT_PIERS) H.block('G', x - 16.5, FZ - 21.5, x + 16.5, FZ + 11.5);
    H.block('G', FRONT_PIERS[1] - 12, FZ - 104, FRONT_PIERS[1] - 6, FZ - 21.5); // the open gate leaf
    H.block('G', -365, 700, -339, FZ + 6); // capped side wall, outside the mowing inset
    H.block('G', -365, 691, -300, 709); // the return into the house corner
    H.block('G', 716, 600, 740, FZ - 15); // solid drive boundary joins the side-gate return
    H.block('G', LAMP.x - 16, LAMP.z - 14, LAMP.x + 16, LAMP.z + 14); // the lamp-post's base, now the whole pavement is walkable
    H.support('drive',frame.x-58*frame.s,frame.z-96*frame.s,frame.x+58*frame.s,frame.z+60*frame.s,GY-frame.roof*frame.s,{when:()=>parked.present}); H.support('drive', 265, 708, 335, 752, GY - 2);
    // The shell, lid, contact shadow and picks leave together. The separate batch
    // keeps scenery merging from baking the parked car permanently into the drive.
    const carPick = H.SPOTS['hs.car'].obj;carGroup.add(carPick);
    const carBounds = new T.Box3(), frustum = new T.Frustum(), projection = new T.Matrix4();
    const nearCar = margin => H.W.lvl === 'G' && H.W.x > carBlock.x0-margin && H.W.x < carBlock.x1+margin && H.W.z > carBlock.z0-margin && H.W.z < carBlock.z1+margin;
    const onScreen = () => {
      if (!r.group.visible) return false;
      carGroup.updateWorldMatrix(true,true);carBounds.setFromObject(carGroup);
      H.camera.updateMatrixWorld();projection.multiplyMatrices(H.camera.projectionMatrix,H.camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
      return frustum.intersectsBox(carBounds);
    };
    const bayOccupied = () => {
      for(const c of Object.values(window.HouseFamily?.chars||{}))if(c.present&&c.lvl==='G'&&c.x>carBlock.x0-28&&c.x<carBlock.x1+28&&c.z>carBlock.z0-28&&c.z<carBlock.z1+28)return true;
      for (const id in H.THINGS) {
        const t=H.THINGS[id];if(t.at.room!=='drive'||t.at.hide||riding(t)||H.held()===id)continue;
        const b=H.physics.body(id);if(!b?.active)continue;
        if(b.ax1>carBlock.x0&&b.ax0<carBlock.x1&&b.az1>carBlock.z0&&b.az0<carBlock.z1&&b.y>GY-6)return true;
      }
      if(H.held()){const g=H.placement()?.aim;if(g?.room==='drive'&&g.x>carBlock.x0&&g.x<carBlock.x1&&g.z>carBlock.z0&&g.z<carBlock.z1)return true;}
      return false;
    };
    const apply = present => {
      parked.present=present;carGroup.visible=present;carBlock.off=!present;
      for(const id of ['hs.car','hs.carboot'])H.SPOTS[id].off=!present;window.ChoreKit?.MODS.car?.sync();
      // Dad shuts the lid before taking the car. The contents keep their own save records.
      if(parked.travelled){r.carBoot.open=false;hinge.rotation.x=0;try{localStorage.setItem('jhp_car_boot','0')}catch{}}
      for(const id in H.THINGS){const t=H.THINGS[id];if(riding(t))H.place(t);}
      H._.rebuildGrids();H.physics.rebuild();window.NPCNav?.rebuild();H.softChanged('drive');H.dirty();
    };
    parked.update = () => {
      const family=window.HouseFamily;if(!family?.ready||H.paused)return;
      const present=!family.carAway,initial=!parked.known;parked.known=true;if(family.ready&&!present)parked.travelled=true;
      if(present===parked.present)return;
      if(!(initial&&(!H.live||window.AccountGate?.blocked))&&(onScreen()||nearCar(present?40:185)||(!present&&H.anims.has('story-car-boot'))))return;
      // Wait for a clear parking space; never materialise a car on a person or their things.
      if(present&&bayOccupied())return;
      apply(present);
    };
    // Restore the home car before validating the saved capsule. Being near the
    // boot is legal: only an actual overlap defers parking. This also repairs
    // old saves whose valid boot approach previously hid the car and its cargo.
    r.preparePose = p => {
      if(window.HouseFamily?.carAway){if(parked.present)apply(false);return;}
      if(!parked.present)apply(true);
      if(p.lvl==='G'&&p.x>carBlock.x0-30&&p.x<carBlock.x1+30&&p.z>carBlock.z0-30&&p.z<carBlock.z1+30&&!H._.floorAt(p.x,p.z,'G',H.LV.G,Math.max(60,H.LV.G-p.y)))apply(false);
    };
    apply(parked.present);
    let nextCar=0;H.ambient.add(now=>{if(now<nextCar)return false;nextCar=now+250;parked.update();return false;});
  }

  // ================================================================ the rooms, their lights, their views
  const rearGlass=[[-160,143,-186,-40,253,-174],[95,167,-180,145,245,-174],[193,143,-160,207,235,-80]],bedroomGlass=REAR.bedroomWindows.map(w=>[w.x0,w.y0,-74,w.x1,w.y1,-50]),bayGlass=[[-170,150,696,50,300,710]],frontGlass=[[279,167,698,321,245,706]];
  const ROOMDEF = {
    landing: { name: 'The landing', title: 'THE LANDING', lvl: 'U', area: [[250, 130, 410, 250], [250, 250, 330, 700], [330, 250, 410, 700]], bx0: 252, bx1: 408, bz0: 132, bz1: 698, build: buildLanding, windowViews:[{room:'drive',bounds:[[410,-80,400,420,60,480]]}],
      lights: () => [{ x: 300, y: -150, z: 400, c: '#fff0d8', i: lit('landing') ? 0.9 : 0, d: 520 }, { x: 390, y: -10, z: 440, c: phase() === 'day' ? '#e8f0ff' : '#5a6a9a', i: phase() === 'day' ? 1.3 : 0.25, d: 560 }, { x: 300, y: -60, z: 180, c: '#f0ece0', i: phase() === 'day' ? 0.4 : 0.1, d: 320 }, { x: 300, y: 130, z: 560, c: '#fff0d8', i: lit('hall') ? 1.05 : 0, d: 580 }],
      amb: () => interiorAmb('landing', .68),
      stations: [{ id: 'top', n: 'Top of the stairs', pose: () => look('U', 300, 175, 370, 220, 520, 158) }, { id: 'doors', n: 'Landing', pose: () => look('U', 310, 640, 250, -40, 420, 158) }] },
    hall: { name: 'The hall', title: 'THE HALL', lvl: 'G', area: [[205, 60, 410, 250], [205, 250, 330, 600], [205, 600, 410, 700], [330, 570.625, 410, 600]], bx0: 207, bx1: 408, bz0: 62, bz1: 698, build: buildHall, windowViews:[{room:'drive',bounds:frontGlass}],
      lights: () => { const day = phase() === 'day'; return [{ x: 300, y: 130, z: 200, c: '#fff0d8', i: lit('hall') ? 1.0 : 0, d: 520 }, { x: 300, y: 130, z: 560, c: '#fff0d8', i: lit('hall') ? 0.8 : 0, d: 420 }, { x: 300, y: 200, z: 690, c: day ? '#dfe8ff' : '#3a4a7a', i: day ? 1.3 : 0.2, d: 520 }, { x: 390, y: 180, z: 440, c: day ? '#e8f0ff' : '#5a6a9a', i: day ? 1.0 : 0.2, d: 460 }, { x: 260, y: 220, z: 150, c: day ? '#f0f0f0' : '#333', i: day ? 0.5 : 0.1, d: 300 }]; },
      amb: () => interiorAmb('hall', .68),
      stations: [{ id: 'stairs', n: 'Bottom of the stairs', pose: () => look('G', 268, 660, 370, 230, 380, 158) }, { id: 'back', n: 'The hall', pose: () => look('G', 300, 640, 260, 260, 150, 158) }] },
    cupboard: { name: 'Under the stairs', title: 'UNDER THE STAIRS', lvl: 'G', area: [[332, 252, 408, CUP.end]], bx0: 334, bx1: 406, bz0: 254, bz1: CUP.end-2, eye: H.STAND, ceilingAt:(x,z)=>UY+.8*(z-250)+23.5, build: buildCupboard, noMap: false,
      lights: () => [
        { x: 370, y: 205, z: 320, c: '#ffdda0', i: lit('cupboard') ? 1.3 : 0, d: 300, flicker: .012 },
        // Warm plaster bounce reaches the fronts of the CRT and stored things;
        // the bare bulb above/behind them otherwise only lights their backs.
        { x: 368, y: 258, z: 386, c: '#e8c99a', i: lit('cupboard') ? .4 : 0, d: 260 },
        { x: 336, y: 235, z: 315, c: '#e8e0d0', i: H.DOORS.cupboard && H.DOORS.cupboard.open ? (phase() === 'day' ? .65 : .25) : 0, d: 220 }
      ],
      amb: () => ({ sky: lit('cupboard') ? '#c6b392' : '#7d8190', gnd: '#77654c', i: lit('cupboard') ? .5 : (H.DOORS.cupboard && H.DOORS.cupboard.open ? .34 : .22) }),
      stations: [{ id: 'snes', n: 'The old console', pose: () => look('G',370,345,367,GY-50,275,130) }] },
    lounge: { coffeeFrame: COFFEE, name: 'The lounge', title: 'THE LOUNGE', lvl: 'G', area: [[-280, 305, 195, 700]], bx0: -278, bx1: 193, bz0: 307, bz1: 698, build: buildLounge, windowViews:[{room:'drive',bounds:bayGlass}],
      lights: () => { const L = [{ x: -60, y: GC + 30, z: 500, c: '#fff0d0', i: lit('lounge') ? 0.95 : 0, d: 700 }, { x: -60, y: 220, z: 690, c: phase() === 'day' ? '#e8f0ff' : '#4a5a8a', i: phase() === 'day' ? 1.1 : 0.2, d: 650 }]; const lamp = lightsOn.loungeLamp == null ? phase() !== 'day' : lightsOn.loungeLamp; if (lamp) L.push({ x: LAMPST.x, y: GY - 160, z: LAMPST.z, c: '#ffd8a0', i: 0.8, d: 380 }); if (HouseRooms.rooms.lounge.fireOn) L.push({ x: -240, y: GY - 30, z: 500, c: '#ff8a40', i: 0.9, d: 300 }); if (window.HouseTelly && HouseTelly.on) L.push({ x: LT.x, y: GY - 80, z: LT.z + 60, c: '#8aa8ff', i: phase()==='day'?.25:1.6, d: 460, tv: true }); return L; },
      amb: () => interiorAmb('lounge', .6),
      sun: () => phase() === 'day' ? { x: -60, y: -100, z: 1200, tx: -60, ty: GY, tz: 400, c: '#fff4e0', i: 0.35 } : null,
      stations: [{ id: 'telly', n: 'The telly', pose: () => look('G', -50, 521, LT.x, GY - 70, LT.z, 150) }, { id: 'fire', n: 'The fireplace', pose: () => look('G', 100, 521, -270, GY - 90, 500, 158) }, { id: 'window', n: 'The window', pose: () => look('G', 70, 521, -60, 230, 700, 158) }] },
    garden: { name: 'The back garden', title: 'THE BACK GARDEN', lvl: 'G', area: [[-340,-1476,440,-176],[205,-176,440,-56]], bx0:-338, bx1:438, bz0:-1474, bz1:-58, build: buildGarden, outside: true, windowViews:[{room:'bedroom',bounds:bedroomGlass},{room:'kitchen',bounds:rearGlass}],
      lights: () => [{ x: 120, y: GY - 230, z: -190, c: '#ffe0a0', i: phase() === 'day' ? 0 : 0.7, d: 500 }],
      amb: () => outdoorAmb('#78855a'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: -900, tx: 0, ty: GY, tz: -300, c: '#8090c8', i: 0.15 } : { x: 400, y: -900, z: -600, tx: 0, ty: GY, tz: -300, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'patio', n: 'The garden', pose: () => look('G',120,-260,-40,GY-80,-1000,H.STAND) }, { id: 'shed', n: 'The shed', pose: () => look('G',-180,-1120,-230,GY-100,-1330,H.STAND) }, { id: 'house', n: 'The house', pose: () => look('G',20,-900,80,60,-176,H.STAND) }] },
    drive: { name: 'The front', title: 'OUT THE FRONT', lvl: 'G', area: [[-340, 700, 720, STREET.pave[1] - 3]], bx0: -338, bx1: 718, bz0: 702, bz1: STREET.pave[1] - 5, build: buildDrive, outside: true, windowViews:[{room:'lounge',bounds:bayGlass},{room:'hall',bounds:frontGlass}],
      lights: () => phase()==='day'?[]:[
        {x:354,y:GY-167,z:724,c:'#ffda9d',i:1.25,d:750},
        {x:LAMP.x,y:GY-519,z:LAMP.z+73,c:'#ffbd70',i:1.8,d:1350},
        ...(window.HouseEnvironment?.streetLamps||[])
      ],
      amb: () => outdoorAmb('#797b70'),
      sun: () => phase() === 'night' ? { x: 200, y: -800, z: 1700, tx: 300, ty: GY, tz: 900, c: '#8090c8', i: 0.15 } : { x: -400, y: -900, z: 1500, tx: 300, ty: GY, tz: 900, c: phase() === 'day' ? '#fff4e0' : '#ffb070', i: phase() === 'day' ? 0.9 : 0.5 },
      stations: [{ id: 'car', n: "Dad's car", pose: () => look('G', 290, FZ - 50, CAR.x, GY - 70, CAR.z, 158) }, { id: 'house', n: 'The house', pose: () => look('G', 180, FZ - 70, 150, 120, 700, 158) }, { id: 'street', n: 'The street', pose: () => look('G', 200, 760, 240, GY - 120, FZ + 300, 158) }] },
    kitchen: { name: 'The kitchen', title: 'THE KITCHEN', lvl: 'G', area: [[-280,-176,195,295]], bx0:-278, bx1:193, bz0:-174, bz1:293, build: buildKitchen, windowViews:[{room:'garden',bounds:rearGlass}],
      lights: () => [{ x: -60, y: GC + 10, z: 120, c: '#ffe4b8', i: lit('kitchen') ? .9 : 0, d: 700 }, { x: -100, y: 198, z: -160, c: phase() === 'day' ? '#e8f0ff' : '#4a5a8a', i: phase() === 'day' ? .72 : .16, d: 600 }],
      amb: () => interiorAmb('kitchen', .64),
      sun: () => phase() === 'day' ? { x: -80, y: -100, z: -800, tx: -80, ty: GY, tz: 120, c: '#fff4e0', i: 0.3 } : null,
      stations: [{ id: 'fridge', n: 'The fridge', pose: () => look('G', -120, 160, -250, GY - 110, -130, H.STAND) }, { id: 'sink', n: 'The sink', pose: () => look('G', -40, 180, -80, GY - 110, -176, H.STAND) }, { id: 'table', n: 'The table', pose: () => look('G', 120, 260, -60, GY - 76, 110, H.STAND) }] },
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
        // Seat the shut leaf inside the shallow exterior casing. The default
        // inside hinge offset left its outer face nearly 5 cm behind that
        // casing, exposing a dark, apparently skewed gap in the pitched view.
        const bd = doorway(kit, KB, 'backdoor', 'n', REAR.z1, 80, 160, GY, { inside: true, hingeNormal: -1, noframe: true, glass: {w:50}, mat: M({ c: '#f2f0ea', family: 'glossPaint' }) });
        kb.build(kit.group);
        const fd2 = doorway(hall, K.into(fb), 'frontdoor', 's', 700, 260, 340, GY, { inside: true, leaf: true, noframe: true, glass: {w:42}, panel: M({ c: '#27402f', sh: 8, sp: '#1a1a1a' }), mat: M({ c: '#2f4d3a', sh: 10, sp: '#1a1a1a' }), deco: (Dd, g2) => { const cx = g2.sgnA * g2.dw / 2;
          for (const sg of [-1, 1]) { Dd.box(cx, g2.fy - 100, sg * 2.1, 24, 4, 0.8, mBrass); Dd.box(cx, g2.fy - 100, sg * 2.5, 20, 1.2, 0.4, M('#3a2a10')); Dd.box(cx, g2.fy - 80, sg * 2.2, 4, 8, 1, mBrass); } } });
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
      exteriorLightLook(drive);exteriorLightLook(HouseRooms.rooms.garden);
      const cupboard = HouseRooms.rooms.cupboard; if (cupboard) cupLight(cupboard);
      standardLampLook(HouseRooms.rooms.lounge);
      switchLook();
      H.relight();
    }
    const blink = Math.floor(now / 600) % 2 === 0;
    if(!clockDate||now>=clockNext){
      clockNext=now+1000;clockDate=window.OwnerTools?.now()||new Date();
      const r=HouseRooms.rooms.kitchen;
      if(r?.hh){const m=clockDate.getMinutes()+clockDate.getSeconds()/60,h=clockDate.getHours()%12+m/60;r.mh.rotation.z=m/60*Math.PI*2;r.hh.rotation.z=h/12*Math.PI*2;}
      if(r?.calendarTex){const t=window.Desk?.today99?.()||{m:clockDate.getMonth()+1,d:clockDate.getDate()},key=t.m+'-'+t.d;if(r.calendarDay!==key){r.calendarDay=key;const tx=r.calendarTex,g=tx.userData.g,p=A.P.calendar;g.save();g.setTransform(tx.image.width/p[0],0,0,tx.image.height/p[1],0,0);p[2](g,p[0],p[1]);g.restore();tx.needsUpdate=true;H.dirty()}}
    }
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

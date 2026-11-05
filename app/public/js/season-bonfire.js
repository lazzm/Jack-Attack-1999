/* Bonfire Night 1999. Account-owned progress is in mods/season.js; all preparations use real props, the grab API
 * and the shared close-up camera. One bounded soft-sprite pool draws every spark, including the neighbourhood sky.
 * Uses the shared pooled light rig; no downloaded textures, TTS, currency writes or per-frame geometry allocations. */
(function () {
  'use strict';
  const SE = window.Season, H = window.House, R = window.Room, C = window.SeasonCat;
  if (!SE || !H?.ok || !R || window.Bonfire) return;
  const T = H.T, K = H.K, M = K.mat, EID = 'bonfire99', GY = 353, D = Math.PI / 180;
  // Keep metres of separation between the patio spectators and Dad's display.
  const gardenZ = z => Math.round((-176+(z+56)*1300/504)*10)/10;
  const state = () => SE.st(EID) || {}, got = (o, s) => !!state().steps?.[o]?.[s], done = o => !!state().obj?.[o];
  const ITEMS = {}, DEC = {}, PARTS = [], low = () => H.Q?.adapt >= 3 || H.Q?.mob || /low|potato/.test(H.Q?.tier), enabled = () => on && state().open;
  let on = false, phase = null, built = false, building = false, work = null, catHome = null, catAct0 = null, nextSky = 0, nextFire = 0, lastStage = '', lastCrackle = 0;
  const mat = {
    wood: M({ c: '#b59c76', map: window.HouseArt?.t?.('pineDark') || null, sh: 3 }), end: M('#b89969'), paper: M('#e5dcc5'), ink: M('#28333d'),
    card: M('#ac885b'), metal: M({ c: '#9da9a5', sh: 65, sp: '#b7c9c9' }), dark: M('#30342e'),
    blue: M('#344b5b'), cloth: M('#94754d'), red: M('#b74b38'), string: M('#d0bc8d'), glove: M('#79573e'),
    foil: M({ c: '#c7c9c3', sh: 95, sp: '#ffffff' }), potato: M('#ad8045'), cake: M({ c: '#fff', sh: 3, map: K.tex('bf.parkin-crumb', 128, 128, c => { const r = K.rnd(519); c.fillStyle = '#684124'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 1000; i++) { c.fillStyle = ['#80502c','#4b2b19','#96633b'][i % 3]; c.fillRect(r() * 128, r() * 128, 1 + r() * 2, 1 + r()); } }, { clamp: true }) }), water: M({ c: '#497883', sh: 90, sp: '#c6dede' }),
    coal: M('#282725'), ash: M('#605d54'), ember: M({ c: '#a74b23', e: '#7d2308' }), flame: M({ c: '#ffac38', e: '#ff6518', basic: true }),
    yellow: M({ c: '#ffcc75', e: '#ff9c34', basic: true }), green: M('#3f5243'),
  };
  const say = (id, who, text) => {
    const t = SE.cast(text), key = id.startsWith('c4.') ? id : 'bf.' + id, person = who === 'Mom' ? 'mom' : who === 'Dad' ? 'dad' : who === '{sister}' ? 'sister' : null;
    if(window.st?.speakLine)return st.speakLine(key,person||who,t);
    if (person && window.HouseFamily?.speak?.(person, key, t)) return;
    if (window.st?.say) window.st.say(key, SE.cast(who), t); else H.say(SE.cast(who), t, 5200);
  };
  const sound = {
    rustle: () => H.sfx.noise(.24, .035, 1800, 0, 'highpass', 3500),
    hiss: () => H.sfx.noise(.65, .025, 1400, 0, 'bandpass', 3000),
    bang: (far, distance = 40) => { const delay = distance / 343; H.sfx.noise(far ? .7 : 1.1, far ? .018 : .065, 170, delay, 'lowpass', 650); H.sfx.tone(far ? 44 : 58, .65, 'sine', far ? .018 : .065, delay, 24); },
    whistle: () => H.sfx.tone(520, 1.1, 'sine', .025, 0, 1700),
  };
  function group(name, room, x = 0, y = 0, z = 0, build) {
    const g = new T.Group(); g.name = 'bonfire:' + name; g.position.set(x, y, z);
    const b = K.batch(); build?.(K.into(b)); b.build(g); H.ROOMS[room].group.add(g); return g;
  }
  function labelTex(key, lines, bg = '#dfcc9d', fg = '#382b20') {
    return K.tex('bf.' + key, 512, 256, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = fg; c.lineWidth = 9; c.strokeRect(12, 12, w - 24, h - 24);
      c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < lines.length; i++) { c.font = (i ? 'bold 27px' : 'bold 35px') + ' Courier New'; c.fillText(lines[i], w / 2, 48 + i * 48); }
    }, { clamp: true });
  }
  function sign(B, key, x, y, z, lines, w = 52, h = 28, bg, fg) {
    B.box(x, y, z, w, h, 1.3, mat.wood);
    B.panel(x, y, z + .72, w - 1.5, h - 1.5, .12, M({ c: '#fff', map: labelTex(key, lines, bg, fg), sh: 3 }));
  }
  const newsMap = K.tex('bf.garden-gazette', 512, 384, c => {
    c.fillStyle = '#ded4b9'; c.fillRect(0, 0, 512, 384); c.fillStyle = '#39403e'; c.textAlign = 'center';
    c.font = 'bold 36px Georgia'; c.fillText('THE DAILY WAFFLE', 256, 43); c.font = '13px Courier New'; c.fillText('Friday 29 October 1999     FOURPENCE', 256, 65);
    c.fillRect(18, 76, 476, 2); c.font = 'bold 23px Georgia'; c.fillText('LOCAL DAD FINDS HIS HAT', 256, 105);
    c.textAlign = 'left'; c.font = '11px Georgia';
    for (let col = 0; col < 3; col++) for (let line = 0; line < 21; line++) c.fillText(['Experts were baffled by the', 'unexpected turn of events.', 'Neighbours said it was quite', 'a surprise. More on page 9.'][line % 4], 20 + col * 163, 132 + line * 11);
    c.strokeStyle = '#777263'; c.strokeRect(182, 140, 140, 94); c.font = 'bold 15px Georgia'; c.fillText('HAT FOUND!', 194, 183);
  }, { clamp: true });
  const newsMat = M({ c: '#fff', map: newsMap, sh: 1 });
  function newspaper(B, x, y, z, s = 1) {
    B.box(x, y - .15, z, 22 * s, .3, 17 * s, mat.paper);
    B.panel(x, y - .32, z, 21.8 * s, 16.8 * s, .04, newsMat, { rx: 90 });
  }
  function log(B, x, y, z, angle, length = 65, r = 4) {
    const A = B.at(x, y, z, angle); A.cyl(0, 0, 0, r, r * .72, length, 7, mat.wood, { rz: 90 });
    A.cyl(-length / 2 - .1, 0, 0, r * .8, r * .8, .3, 7, mat.end, { rz: 90 });
    for (let j = 0; j < 3; j++) A.box(-length * .3 + j * length * .27, -r * .72, r * .25, length * .18, .35, .6, j % 2 ? mat.dark : mat.end, { ry: j * 7 });
  }
  function branch(B, a, b, radius = 3) {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b), mid = av.clone().add(bv).multiplyScalar(.5), d = bv.clone().sub(av), length = d.length();
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    const geometry = new T.CylinderGeometry(radius * .45, radius, length, 7); geometry.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(q)); B.geo(geometry, mid.x, mid.y, mid.z, mat.wood);
    const bend=Math.sin(a[0]*.7+a[2]*.3), fork = av.clone().lerp(bv, .5+Math.abs(bend)*.25), tip = fork.clone().add(new T.Vector3(Math.cos(a[0]+a[2])*15,-12-Math.abs(bend)*17,Math.sin(a[0]-a[2])*16));
    const fd = tip.clone().sub(fork); const fg = new T.CylinderGeometry(.45, radius * .45, fd.length(), 5); fg.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), fd.normalize())));
    const fm = fork.add(tip).multiplyScalar(.5); B.geo(fg, fm.x, fm.y, fm.z, mat.wood);
    for (let i = 1; i <= 3; i++) { const v = av.clone().lerp(bv, i / 5); B.ball(v.x, v.y, v.z, radius * .75, 1.2, radius * .75, i % 2 ? mat.end : mat.dark, 5); }
  }
  function bucket(B, water) {
    B.lathe(0, 0, 0, [[0, 0], [10, 0], [12, -25], [10.8, -25], [9, -2], [0, -2]], 16, mat.metal);
    B.geo(new T.TorusGeometry(11.4, .65, 4, 20), 0, -25, 0, mat.metal, { rx: 90 });
    B.geo(new T.TorusGeometry(11.8, .65, 4, 20, Math.PI), 0, -25, 0, mat.metal, { rz: 180 });
    if (water) B.cyl(0, -19, 0, 10.8, 10.8, .8, 16, mat.water);
    B.shadow(0, 0, 0, 29, 29, .5);
  }
  function glove(B, x, y, z, s = 1) {
    B.rbox(x, y - 2 * s, z, 8 * s, 4 * s, 13 * s, 1.3 * s, mat.glove);
    B.rbox(x - 4 * s, y - 2 * s, z - 1 * s, 4 * s, 3 * s, 6 * s, 1.2 * s, mat.glove, { ry: -25 });
    for (let i = 0; i < 4; i++) B.box(x - 2.6 * s + i * 1.7 * s, y - 4.1 * s, z - 3 * s, .3, .15, 5 * s, mat.cloth);
  }
  function wellies(B, x, z) {
    for (const dx of [-7, 7]) { B.lathe(x + dx, -6, z - 2, [[0, -30], [5.5, -30], [5.8, -28], [4.8, -10], [5, 0], [0, 0]], 10, mat.green); B.ball(x + dx, -4, z + 3, 5.6, 4, 11, mat.green, 8); B.box(x + dx, -.8, z + 4, 11, 1.5, 23, mat.dark); }
  }
  function thing(id, room, x, y, z, label, kind, builder, extra = {}) {
    const g = new T.Group(), b = K.batch(); builder(K.into(b)); b.build(g);
    const t = R.grabbable(id, { obj: g, noSave: true, home: { room, x, y, z, ry: 0 }, label, kind, holdD: 40, ...extra, canGrab: () => enabled() && (!extra.canGrab || extra.canGrab()) });
    if (t) { t.noSave = true; ITEMS[id] = 'thing'; } return t;
  }
  function spot(id, room, x, y, z, w, h, d, label, act, obj) {
    if (!obj) { obj = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ visible: false })); obj.position.set(x, y, z); H.ROOMS[room].group.add(obj); obj.userData.bfOwn = true; }
    H.spot(id, { obj, label, act }); ITEMS[id] = 'spot'; return obj;
  }
  function snap(id, room, x, y, z, box, kind, hint, onSnap, pose = {}) {
    R.addSnap(id, { room, x, y, z, r: 48, box, pose: { x, y, z, ...pose }, hint, accepts: k => k === kind && enabled() && phase !== 'tail', onSnap }); ITEMS[id] = 'snap';
  }
  function at(t, p, snapId) {
    if (!t || t.st === 'held' || t.st === 'anim') return;
    t.at = { room: p.room || t.home.room, x: p.x, y: p.y, z: p.z, ry: p.ry || 0, hide: !!p.hide }; t.st = snapId ? 'snap' : 'rest'; t.snap = snapId || null;
    H.ROOMS[t.at.room].things.add(t.obj); H.place(t); H.layerFor(t);
  }
  const WOOD = ['paper', 'kindling', 'branch1', 'branch2', 'box1', 'branch3', 'box2', 'branch4', 'branch5', 'box3'];
  const PILE = { x: -65, y: GY, z: -1068.5 }, TABLE = { x: -60, y: GY - 76, z: 141 }, WHEEL = {x:-20,z:-1372.8};
  const woodHome = i => ({ x: -116 + i % 2 * 75, y: GY, z: gardenZ(-350 + Math.floor(i / 2) * 33) });
  function woodModel(B, id, i) {
    if (id === 'paper') newspaper(B, 0, 0, 0, 1.2);
    else if (id.startsWith('box')) { B.box(0, -9, 0, 29, 18, 24, mat.card); B.box(0, -18.2, 0, 3, .3, 24, mat.string); for (const z of [-12.2, 12.2]) B.box(0, -8, z, 14, 4, .3, mat.paper); }
    else if (id === 'kindling') for (let k = 0; k < 6; k++) log(B, (k % 2) * 5, -2 - Math.floor(k / 2) * 2.4, 0, k * 13, 28, 1.2);
    else { log(B, 0, -4, 0, i * 11, 47 + i * 2, 3.4); B.cyl(4, -5, -7, 1.3, 2, 17, 6, mat.wood, { rx: 60 }); }
    B.shadow(0, 0, 0, 46, 30, .35);
  }
  function makeWood() {
    WOOD.forEach((id, i) => {
      const p = woodHome(i); thing('bf.wood.' + id, 'garden', p.x, p.y, p.z, id === 'paper' ? 'Dry newspaper for tinder' : id === 'kindling' ? 'Dry kindling' : id.startsWith('box') ? 'An old empty cardboard box' : 'A dry fallen branch', 'bf.wood.' + id, B => woodModel(B, id, i), {
        canGrab: () => !got('bf-wood', id) && (i === 0 || got('bf-wood', 'paper')) && (i < 2 || got('bf-wood', 'kindling')),
        use: () => say('wood', 'Dad', 'Dry wood and cardboard only. Paper, then kindling. No aerosols, glass, paint, plastic or fireworks on the fire. We check for hedgehogs before lighting.'),
      });
      snap('bf.s.' + id, 'garden', PILE.x, GY - 12, PILE.z, [95, 35, 95], 'bf.wood.' + id, 'Add this to the safe stack', () => { SE.step(EID, 'bf-wood', id); sound.rustle(); }, { x: PILE.x, y: GY, z: PILE.z, hide: true });
      PARTS.push(group('stack.' + id, 'garden', PILE.x, GY, PILE.z, B => {
        if (i < 2) woodModel(B, id, i);
        else if (id.startsWith('box')) { const A=B.at((i%3-1)*13,-3,(i%2? -1:1)*13,i*27); woodModel(A,id,i); for(let j=0;j<5;j++) log(B,(j-2)*7,-20-j%2*6,-5+j*3,j*29+i*12,38+j*4,1.3); }
        else for(let j=0;j<4;j++) { const a = i * 2.39996+j*.35; branch(B, [Math.cos(a) * (39+j*2), -3, Math.sin(a) * (39+j*2)], [Math.cos(a + .3) * 7, -108 - i * 3.5+j*5, Math.sin(a + .3) * 7], 2.1 + (i+j) % 3 * .65); }
      }));
    });
  }
  let guy, faceMap, guyFull, guyChair, foodTray;
  const foodPotatoes = [], foilPotatoes = [], prickMarks = [];
  // A rounded, uneven paper sack. Box-face UVs survive deformation, so the player's ink stays on the front.
  function bagGeometry(w=23,h=24,d=20){
    const g=new T.BoxGeometry(w,h,d,5,5,4),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.min(w,h,d)*.16;
      const cx=Math.max(-w/2+r,Math.min(w/2-r,x)),cy=Math.max(-h/2+r,Math.min(h/2-r,y)),cz=Math.max(-d/2+r,Math.min(d/2-r,z));
      const v=new T.Vector3(x-cx,y-cy,z-cz).normalize().multiplyScalar(r),t=(y+h/2)/h,k=1-.42*Math.pow(Math.max(0,(t-.68)/.32),2);
      p.setXYZ(i,(cx+v.x)*k+.35*Math.sin(y*.73+z*.4),(cy+v.y)+.35*Math.sin(x*.57+z*.33),(cz+v.z)*k+.3*Math.sin(x*.7+y*.55));
    }
    g.computeVertexNormals();return g;
  }
  function bagModel(B){
    const g=bagGeometry();B.geo(g,0,-82,0,mat.paper);
    // The face follows the crumpled front surface, with a tiny normal offset, rather than a flat label.
    const n=g.toNonIndexed(),front=n.groups.find(q=>q.materialIndex===4),f=new T.BufferGeometry();
    for(const name of ['position','normal','uv']){const a=n.attributes[name],data=a.array.slice(front.start*a.itemSize,(front.start+front.count)*a.itemSize);f.setAttribute(name,new T.BufferAttribute(data,a.itemSize));}
    const p=f.attributes.position,normal=f.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+normal.getX(i)*.09,p.getY(i)+normal.getY(i)*.09,p.getZ(i)+normal.getZ(i)*.09);
    B.geo(f,0,-82,0,M({c:'#fff',map:faceMap,sh:2}));B.geo(new T.TorusGeometry(6,.55,5,16),0,-69,0,mat.string,{rx:90});
    for(let i=0;i<5;i++)B.box(Math.sin(i*2.4)*4,-67,Math.cos(i*2.4)*3,.45,6,.5,mat.cloth,{rz:i*23});
  }
  function guyModel(B, full) {
    // Sagging work shirt and trousers: cloth silhouettes rather than a mannequin body.
    B.rbox(0, -52, 0, 30, 34, 18, 3, mat.blue); B.rbox(0, -34, 0, 27, 8, 17, 1.5, mat.blue);
    B.box(0, -52, 9.3, 2, 31, .7, mat.cloth);
    for (const side of [-1, 1]) {
      const A = B.at(side * 17, -63, 0); A.cyl(side * 5, 8, 0, 7, 5, 25, 7, mat.blue, { rz: side * -37 });
      A.box(side * 12, 18, 0, 9, 5, 13, mat.cloth, { rz: side * -37 });
      B.box(side * 6, -68, 6, 9, 10, 2, mat.paper, { rz: side * 27, rx: -20 });
      if (full === 'seated') { B.rbox(side * 8, -21, 12, 13, 15, 34, 2, mat.cloth); B.rbox(side * 8, 12, 25, 12, 53, 14, 2, mat.cloth); B.box(side * 8, 37, 25, 13, 4, 15, mat.blue); }
      else { B.rbox(side * 8, -17, 0, 13, 32, 16, 2, mat.cloth, { rz: side * -4 }); B.box(side * 9, -1, 0, 14, 4, 17, mat.blue); }
      // Crumpled newspaper at the open cuffs and ankles, not shoes or hands.
      B.rbox(side * 31, -42, 0, 8, 6, 9, 1, newsMat, { rz: side * 22 });
      B.rbox(side * 9, full === 'seated' ? 40 : 2, full === 'seated' ? 25 : 0, 8, 5, 10, 1, newsMat, { rz: side * 13 });
      B.cyl(side * 9, full === 'seated' ? 34 : -4, full === 'seated' ? 25 : 0, 7.2, 7.2, .8, 7, mat.string);
    }
    for(const side of [-1,1])B.rbox(side*4,-70,2,5,6,7,.8,newsMat,{rz:side*18});
    for (let j = 0; j < 4; j++) B.ball(0, -62 + j * 7, 9.9, .8, .8, .45, mat.paper, 5);
    if (full) { bagModel(B); B.cyl(0, -95, 0, 16, 16, 2, 12, mat.dark); B.cyl(0, -101, 0, 10.5, 12, 10, 12, mat.dark); }
  }
  function makeGuy() {
    guy = group('guy-work', 'kitchen', TABLE.x, TABLE.y - 12, TABLE.z, B => { B.box(0,10.8,-31,118,.3,78,mat.card); newspaper(B, 0, 10.3, -35, 3.8); });
    // Clothes lie on the newspaper, with the paper-bag head propped up to draw on.
    const g = group('clothes', 'kitchen', TABLE.x, TABLE.y - 3, TABLE.z, B => guyModel(B, false)); g.rotation.x = Math.PI / 2; g.scale.setScalar(.6); guy.add(g); g.position.set(-17, -4, -6); guyFull = g;
    faceMap = K.tex('bf.guy-face', 256, 256, c => { c.fillStyle = '#dbcba4'; c.fillRect(0, 0, 256, 256); }, { clamp: true });
    const head = new T.Mesh(bagGeometry(17,17,16),[mat.paper,mat.paper,mat.paper,mat.paper,M({c:'#fff',map:faceMap,sh:2}),mat.paper]); head.position.set(3, 1.5, -12); guy.add(head); guy.userData.head = head;

    const b = K.batch(), A = K.into(b); A.cyl(27, 9, -35, 11, 11, 2, 12, mat.dark); A.cyl(27, 4.5, -35, 6.8, 7.8, 7, 12, mat.dark); b.build(guy);
    spot('bf.guy', 'kitchen', TABLE.x, TABLE.y - 10, TABLE.z - 20, 58, 36, 80, () => done('bf-guy') ? 'The newspaper work mat' : SE.cast('Make the Guy with {sister}'), () => openWork('guy'));
    thing('bf.guy.ready', 'kitchen', TABLE.x, TABLE.y, TABLE.z, 'Our finished Guy', 'bf.guy', B => { guyModel(B, true); }, { canGrab: () => got('bf-guy', 'hat') && !done('bf-guy') });
    guyChair = group('guy-chair', 'garden', -154, GY, -550, B => {
      B.box(0, -42, 0, 37, 4, 35, mat.wood); for (const x of [-15, 15]) for (const z of [-14, 14]) B.box(x, -22, z, 3, 44, 3, mat.wood);
      for (const x of [-15, 15]) B.box(x, -63, -14, 3, 39, 3, mat.wood); for (const y of [-64, -79]) B.box(0, y, -14, 30, 7, 3, mat.wood); B.shadow(0, 0, 0, 50, 50, .45);
    });
    DEC.guySeated = group('guy-seated', 'garden', -154, GY - 43, -550, B => { guyModel(B, 'seated'); }); DEC.guySeated.rotation.y = 15 * D;
    snap('bf.s.guy', 'garden', -154, GY - 44, -550, [42, 70, 38], 'bf.guy', 'Sit the Guy on his chair', () => { SE.step(EID, 'bf-guy', 'place'); say('guy.ready', '{sister}', "He looks just like Dad on a Sunday. Can we keep him? Penny for the Guy! He only takes pretend pennies."); }, { y: GY - 43, ry: 15, hide: true });
  }
  function potato(B, x, y, z, foil) {
    B.ball(x, y - 4, z, 7, 4, 5, foil ? mat.foil : mat.potato, 9);
    for (let j = 0; j < 4; j++) B.ball(x - 3 + j * 2, y - 7.5, z + Math.sin(j) * 2, .5, .25, .5, foil ? mat.metal : mat.cake, 5);
  }
  function trayModel(B) {
    B.rbox(0, -1, 0, 35, 2, 26, 2, mat.metal); for (const x of [-18, 18]) B.box(x, -2, 0, 2, 3, 20, mat.metal);
    for (const x of [-8, 8]) for (const z of [-6, 6]) potato(B, x, -2, z, true); B.shadow(0, 0, 0, 43, 32, .3);
  }
  function makeFood() {
    DEC.food = group('food-work', 'kitchen', -174, GY - 93, -138, B => {
      B.box(0, -.6, 0, 36, 1.2, 27, mat.wood);
      const bowl = B.at(35, 0, 0); bowl.lathe(0, 0, 0, [[0, 0], [8, 0], [11, -8], [10, -8], [7, -1], [0, -1]], 14, mat.paper); bowl.cyl(0, -5, 0, 9.4, 9.4, .5, 14, mat.water);
      B.box(18, -1.5, 13, 3, 2, 12, mat.wood); for (const x of [17, 18, 19]) B.cyl(x, -1.5, 5, .2, .2, 5, 5, mat.metal, { rx: 90 });
      B.cyl(24, -1.5, 0, 1.7, 1.7, 23, 8, mat.foil, { rz: 90 }); glove(B, -25, -1, 0); glove(B, -36, -1, -3);
    });
    for (const x of [-8, 8]) for (const z of [-6, 6]) {
      const raw = new T.Group(), foil = new T.Group(), mark = new T.Group();
      for (const [g, wrapped] of [[raw, false], [foil, true]]) { const b = K.batch(); potato(K.into(b), 0, -1, 0, wrapped); b.build(g); g.position.set(x, 0, z); DEC.food.add(g); }
      const b = K.batch(), B = K.into(b); for (let j = 0; j < 4; j++) B.cyl(-3 + j * 2, -8.6, 0, .35, .35, .25, 5, mat.ink); b.build(mark); mark.position.set(x, 0, z); DEC.food.add(mark);
      foodPotatoes.push(raw); foilPotatoes.push(foil); prickMarks.push(mark); foil.visible = false; mark.visible = false;
    }
    spot('bf.food', 'kitchen', -174, GY - 99, -138, 44, 20, 32, 'Prepare the jacket potatoes with Mom', () => openWork('food'));
    foodTray = thing('bf.tray', 'kitchen', -174, GY - 93, -138, "Mom's hot supper tray (oven gloves on)", 'bf.food', trayModel, { canGrab: () => got('bf-food', 'gloves') && !done('bf-food') });
    snap('bf.s.supper', 'garden', -108, GY - 66, -305, [68, 12, 42], 'bf.food', 'Put supper on the garden table', () => { SE.step(EID, 'bf-food', 'serve'); say('supper', 'Mom', "Cheese and beans in your jacket potato? Parkin in the tin, treacle toffee on the plate. Mind your teeth. Hot sugar is my job, thank you."); });
    DEC.supper = group('supper-table', 'garden', -108, GY, -305, B => { B.box(0, -64, 0, 70, 4, 43, mat.wood); for (const x of [-29, 29]) for (const z of [-15, 15]) B.box(x, -31, z, 4, 62, 4, mat.wood); B.shadow(0, 0, 0, 80, 54, .4); });
    const cakeUnit = thing('bf.parkin', 'kitchen', -246, GY, 300, 'Parkin and treacle toffee on the side unit', 'bf.supper-unit', B => {
      B.box(0,-91,0,56,4,72,mat.wood);for(const x of [-23,23])for(const z of [-30,30])B.box(x,-45,z,4,90,4,mat.wood); B.box(0,-18,0,49,3,64,mat.wood);B.shadow(0,0,0,64,80,.4);B=B.at(0,-93,0);
      B.box(0, -2, 0, 32, 4, 26, mat.metal); for (const x of [-9, 0, 9]) for (const z of [-6, 5]) B.rbox(x, -5.5, z, 8, 7, 9, .5, mat.cake);
      B.box(0, -8, -12, 12, 7, .4, mat.paper, { rx: -12 }); B.panel(0, -8, -11.7, 11.7, 6.7, .05, M({c:'#fff',map:K.tex('bf.parkin-note',256,128,c=>{c.fillStyle='#ece1c4';c.fillRect(0,0,256,128);c.fillStyle='#3c4760';c.font='italic 43px cursive';c.fillText('Parkin',24,53);c.font='italic 29px cursive';c.fillText('Mom x',88,102);},{clamp:true}),sh:1}), {rx:-12});
      B.cyl(-3, -1, 23, 10, 10, 1.4, 16, mat.paper); for (let i = 0; i < 9; i++) B.rbox(-10 + i % 3 * 7, -3, 18 + Math.floor(i / 3) * 5, 5, 3, 4, .35, M({ c: '#713e1d', sh: 75, sp: '#9a6945' }), { ry: i * 23 });
    }, { canGrab: () => false, floorOnly: true, physics: {mass:25,mu:1.2,tip:0}, use: () => say('parkin', 'Mom', 'Sticky ginger cake. Best made a day or two ahead. There is treacle toffee too. You can help with the potatoes; I do the hot oven and hot sugar.') });
    DEC.cakes = cakeUnit.obj;
  }
  function makeCode() {
    DEC.tin = group('tin', 'garden', -184, GY - 156, -1251, B => {
      B.box(0, 2, -3, 61, 4, 30, mat.wood); for (const x of [-22, 22]) { B.box(x, 13, -18.5, 3, 25, 3, mat.metal); B.box(x, 11, -4, 3, 3, 28, mat.metal, {rx:-40}); } B.rbox(0, -15, -3, 49, 30, 25, 2, mat.metal); B.box(0, -32, -3, 51, 3, 27, mat.dark);
      sign(B, 'tin', 0, -17, 10, ['FIZZLE & POP', 'FAMILY SELECTION', 'DAD KEEPS THE KEY'], 45, 24); B.box(17, -25, 11, 4, 6, 2, mat.metal);
    });
    spot('bf.tin', 'garden', -184, GY - 173, -1238, 51, 34, 8, 'Closed tin on the high shed-wall shelf — Dad keeps the key', () => { SE.step(EID, 'bf-code', 'tin'); say('tin', 'Dad', 'Shop-bought, in their closed tin, up out of reach. No fireworks in pockets. I read the instructions and light one at a time. You watch from behind the rope.'); });
    DEC.bucketEmpty = group('bucket-empty', 'garden', 12, GY, -384.9, B => bucket(B, false));
    DEC.bucketFull = group('bucket-full', 'garden', 12, GY, -384.9, B => { bucket(B, true); sign(B, 'bucket', 0, -13, 12, ['WATER', 'HOT ENDS DOWN'], 18, 10); });
    spot('bf.water', 'garden', 235, GY - 18, -196, 20, 28, 12, 'Fill the sparkler bucket from the water butt', () => { SE.step(EID, 'bf-code', 'water'); sound.hiss(); say('water', 'Dad', 'Bucket filled and parked behind the rope. Used sparklers go in hot end first. The wire stays hot, even when it looks cold.'); });
    const butt=H.SPOTS['hs.butt'];if(butt){const original=butt.act;butt.act=()=>enabled()&&phase!=='tail'?H.SPOTS['bf.water'].act():original?.();}
    DEC.line = group('watching-line', 'garden', 0, GY, -498.4, B => {
      for (const x of [-126, 20]) { B.cyl(x, -32, 0, 2, 2.5, 64, 8, mat.wood); B.shadow(x, 0, 0, 10, 10, .3); }
      B.cyl(-53, -52, 0, .65, .65, 146, 6, mat.string, { rz: 90 });
      sign(B, 'line', -53, -60, 1, ['WATCH FROM HERE', 'STAND WELL BACK', 'NEVER GO BACK'], 65, 30, '#dfcb86');
    });
    spot('bf.line', 'garden', -53, GY - 62, -490.7, 67, 34, 3, () => catchup() ? 'Watch Dad’s leftovers from the rope' : 'Read the watching-line notice', () => { if (catchup()) return startDisplay(); SE.step(EID, 'bf-code', 'line'); say('line', 'Dad', 'Everyone stays behind the rope. Always follow the distance on the box. Never throw fireworks and NEVER go back to one, even if it has gone quiet. Leave it to me.'); });
    DEC.taper = group('taper', 'garden', -176, GY - 73, -1219, B => {
      B.box(0, 0, 0, 27, 3, 16, mat.wood); for (const x of [-10, 10]) B.box(x, 36, 0, 3, 72, 3, mat.wood);
      B.cyl(0, -3, 0, .6, .6, 24, 6, mat.string, { rz: 90 }); B.cyl(0, -3, -5, 1.6, 1.6, 12, 8, mat.dark, { rz: 90 });
    });
    spot('bf.taper', 'garden', -176, GY - 77, -1219, 32, 15, 20, "Dad's taper and torch", () => {
      if (!['tin', 'water', 'pets', 'line'].every(s => got('bf-code', s))) return say('code.wait', 'Dad', 'Closed tin, water, pets indoors, watching line. Check all four first. Then we can talk about the taper.');
      SE.step(EID, 'bf-code', 'taper'); say('taper', 'Dad', 'A long taper, at arm length. One adult in charge: me. Check! We light the bonfire after checking it for animals. No petrol or paraffin. All ready for Friday evening.');
    });
    DEC.gear = group('warm-clothes', 'kitchen', 174, GY, -148, B => {
      wellies(B, 0, 0); B.box(0, -51, 0, 34, 4, 22, mat.wood); for (const x of [-14, 14]) B.box(x, -25, 0, 3, 50, 3, mat.wood);
      glove(B, -8, -54, 0); glove(B, 5, -54, 0); B.ball(2, -57, -7, 11, 7, 9, mat.red, 10); B.cyl(2, -54, -7, 11, 11, 4, 12, mat.red); B.ball(2, -64, -7, 3, 3, 3, mat.string, 7);
    });
    spot('bf.gloves', 'kitchen', 174, GY - 57, -148, 35, 20, 27, 'Put on warm gloves and hat', () => {
      if (!done('bf-code') || phase !== 'day') return displayEvening() ? say('gloves.wait', 'Mom', 'Hat, gloves, wellies. It will be cold tonight. Do the Firework Code with Dad before the sparklers.') : say('gloves.wait.prep', 'Mom', 'Hat, gloves, wellies ready for Bonfire Night. Do the Firework Code with Dad before the sparklers.');
      SE.step(EID, 'bf-sparkler', 'gloves'); say('c4.bon.mom', 'Mom', 'Gloves on! And nobody waves one near anyone else.');
    });
    DEC.sparklers = group('sparklers', 'garden', -23, GY - 48, -384.9, B => {
      B.box(0, 1, 0, 28, 2, 20, mat.wood); for (const x of [-10, 10]) B.box(x, 24, 0, 3, 48, 3, mat.wood);
      B.box(0, -1.5, 0, 22, 3, 9, mat.blue); sign(B, 'sparklers', 0, -4, 4.7, ['STAR SCRIBBLERS', 'GLOVES ON!'], 22, 7);
      for (let i = 0; i < 3; i++) B.cyl(-6 + i * 4, -4, -1, .23, .23, 25, 5, mat.metal, { rz: 90 });
    });
    spot('bf.sparklers', 'garden', -23, GY - 54, -384.9, 30, 17, 21, 'Dad lights one sparkler', () => {
      if (!done('bf-light')) return say('sparkler.wait', 'Dad', 'Display first, sparklers afterwards. I have not forgotten.');
      if (!got('bf-sparkler', 'gloves')) return say('sparkler.gloves', 'Mom', 'Gloves first! They are on the stool by the back door.');
      if (done('bf-sparkler')) return say('sparkler.done', 'Dad', done('bf-bucket') ? 'That was lovely. All the hot wires are in the water. Supper time.' : 'Hot wire into the bucket now, please.');
      if (!got('bf-sparkler', 'light')) SE.step(EID, 'bf-sparkler', 'light');
      say('c4.bon.dad', 'Dad', 'Right. Sparklers. Gloves on, everyone. Hold it by the bottom, point it away, stay back.');
      openWork('sparkler');
    });
    thing('bf.spent', 'garden', -23, GY - 50, -384.9, 'Used sparkler — still hot! Hold the cool end', 'bf.spent', B => { B.cyl(0, -9, 0, .3, .3, 18, 5, mat.metal); B.cyl(0, -22, 0, .7, .7, 9, 6, mat.coal); }, { canGrab: () => done('bf-sparkler') && !done('bf-bucket') });
    snap('bf.s.bucket', 'garden', 12, GY - 20, -384.9, [24, 20, 24], 'bf.spent', 'Lower the hot end into the water', () => { SE.step(EID, 'bf-bucket', 'cool'); sound.hiss(); say('cooled', 'Dad', 'Hot end down. Lovely. You remembered the important bit. Leave the wires in the water.'); }, { hide: true });
    DEC.torchStool = group('torch-stool', 'garden', -60, GY, -400.4, B => { B.cyl(0, -45, 0, 16, 16, 3, 12, mat.wood); for (const a of [0, 2.094, 4.189]) B.cyl(Math.cos(a) * 10, -22, Math.sin(a) * 10, 1.8, 2.5, 44, 8, mat.wood); B.shadow(0, 0, 0, 39, 39, .4); });
    DEC.torch = group('torch', 'garden', -60, GY - 47, -400.4, B => { B.cyl(0, 0, 0, 2.2, 3.2, 19, 10, mat.dark, { rx: 90 }); B.cyl(0, 0, 10, 3.4, 3.4, 2, 10, mat.metal, { rx: 90 }); B.cyl(0, 0, 11.2, 2.8, 2.8, .5, 10, mat.yellow, { rx: 90 }); });
    const torch = R.grabbable('bf.torch', { obj: DEC.torch, noSave: true, home: { room: 'garden', x: -60, y: GY - 47, z: -400.4, ry: 0 }, kind: 'bf.torch', label: 'Hold the torch for Dad / watch the display', holdD: 35, useLabel: 'Hold the torch for Dad', use: startDisplay, canGrab: () => phase === 'day' && done('bf-code') && done('bf-wood') });
    torch.noSave = true; ITEMS['bf.torch'] = 'thing';
    spot('bf.petcheck', 'bedroom', 122, 70, 112, 25, 10, 25, 'Check the cat is safe indoors', () => { SE.step(EID, 'bf-code', 'pets'); say('cat', 'Mom', "The cat is indoors with the curtains shut. Let the cat hide under the bed; keep the noise down in here. No need to pull the cat out."); });
    // The cold rubbish is available only after Dad's morning inspection, never during the display.
    for (let i = 1; i <= 6; i++) {
      const x = -150 + i % 3 * 35, z = gardenZ(-300 - Math.floor((i - 1) / 3) * 42);
      thing('bf.clean.' + i, 'garden', x, GY, z, i % 2 ? 'A cold spent rocket stick (Dad checked it)' : 'A cold supper wrapper', 'bf.rubbish', B => { if (i % 2) {const A=B.at(0,0,0,i*34);A.box(0,-.5,2,.65,.65,43,mat.wood);A.box(0,-.55,-15,.7,.7,9,mat.coal);A.cyl(0,-1.65,-14,1.15,1.05,6,10,M('#4a4035'),{rx:90});A.cyl(0,-1.65,-17.1,.8,.8,.2,10,mat.coal,{rx:90});B.box(0,-2,0,8,6,45,new T.MeshBasicMaterial({visible:false})); } else B.box(0, -.5, 0, 10, 1, 8, mat.foil, { rz: 5 }); B.shadow(0, 0, 0, 17, 35, .25); }, { canGrab: () => phase === 'tail' && !got('bf-clean', 'c' + i) });
    }
    R.addSnap('bf.s.bin', { room: 'garden', x: 370, y: GY - 113, z: -280, r: 52, box: [58, 5, 70], hide: true, pose: { x: 370, y: GY - 90, z: -280, hide: true }, hint: 'Dad checked these: into the bin', accepts: k => k === 'bf.rubbish' && phase === 'tail', onSnap: t => SE.step(EID, 'bf-clean', 'c' + t.id.split('.').pop()) }); ITEMS['bf.s.bin'] = 'snap';
  }

  // ------------------------------------------------ close-ups: gestures land on physical work surfaces, never a 2D mini-game canvas.
  const bar = document.createElement('div'); bar.className = 'se-bar bf-bar'; bar.hidden = true; H.ui.el.appendChild(bar);
  const ray = new T.Raycaster(); ray.layers.enableAll();
  const ndc = new T.Vector2(), trace = [], temp = new T.Vector3();
  function panel(title, hint, button) {
    bar.replaceChildren(); bar.hidden = false;
    const b = document.createElement('b'), s = document.createElement('span'); b.textContent = title; s.textContent = hint; s.className = 'se-hint'; bar.append(b, s);
    if (button) { const row = document.createElement('span'); row.className = 'se-btns'; const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = button[0]; bt.addEventListener('click', button[1]); row.append(bt); bar.append(row); }
  }
  const plan = kind => kind === 'guy' ? ['stuff', 'tie', 'face', 'hat'] : kind === 'food' ? ['wash', 'prick', 'foil', 'oven', 'gloves'] : ['write'];
  const oid = kind => kind === 'guy' ? 'bf-guy' : kind === 'food' ? 'bf-food' : 'bf-sparkler';
  function nextWork() {
    if (!work) return;
    const next = plan(work.kind).find(s => !got(oid(work.kind), s));
    if (!next) { if (H.focused) H.unfocus(); return; }
    if (work.step === next) return;
    work.step = next; work.n = 0; work.ink = []; work.sectors = new Set(); work.last = null; work.pending = false; work.down = false; // (each job takes its own press: a long drag can't finish the next one too)
    const text = {
      stuff: ['Stuff the old clothes', 'Hold and drag newspaper into the shirt and trousers. Fill both legs and sleeves.'],
      tie: ['Tie the string', 'Drag a loop round the blue shirt, then cross the ends. No stuffing escaping!'],
      face: ['Draw his face', 'Hold and drag on the paper-bag head. Give him a friendly face. Wobbles welcome.'],
      hat: ["Dad's old hat", 'Click the hat beside him to finish.', ['Put his hat on', () => finishGesture('hat')]],
      wash: ['Wash the potatoes', 'Mom has brought a bowl of water. Hold and drag over all four potatoes.'],
      prick: ['Prick the skins', 'Click each potato with the fork so steam can get out. Mom is watching.'],
      foil: ['Wrap them in foil', 'Hold and drag across the tray to fold the foil round each potato.'],
      oven: ["Mom does the hot oven", 'Our tray goes in. Her earlier batch comes out when the timer rings.', ['Give Mom the tray', () => finishGesture('oven')]],
      gloves: ['Oven gloves', 'Wait for the timer, then use the oven gloves. Mom lifts the tray with you.', ['Put on oven gloves', () => finishGesture('gloves')]],
      write: ['Write your name in the dark', 'Gloves on. Hold it away from you and everyone else. Hold and drag to draw letters or a shape; then put the hot wire in water.', ['Finished writing', finishWriting]],
    }[next];
    panel(text[0], text[1], text[2]);
    if (next === 'stuff') say('guy', '{sister}', "Dad said we could have his OLD clothes. Not his work trousers. I have checked twice.");
    if (next === 'face') say('history', 'Dad', "Bonfire Night remembers a plot in 1605 to blow up Parliament. Our Guy is old clothes and newspaper. Dad nearly donated his good trousers.");
    H.dirty();
  }
  function openWork(kind) {
    if (!enabled() || phase === 'tail' || work || H.held()) return;
    if (kind !== 'sparkler' && done(oid(kind))) return kind === 'food' ? say('already.food', 'Mom', 'Supper is on the garden table. Help yourself.') : say('already.guy', '{sister}', 'Our Guy is sitting in the garden, guarding the parkin.');
    if (kind === 'guy' && got('bf-guy', 'hat')) return say('carry.guy', '{sister}', 'E carries him out to his garden chair. Careful with his head!');
    if (kind === 'food' && got('bf-food', 'gloves')) return say('carry.food', 'Mom', 'E carries the tray to the little garden table. Gloves on, mind.');
    const p = kind === 'guy' ? { x: -65, y: TABLE.y - 76, z: 160, rx: -48, ry: 0, lvl: 'G' }
      : kind === 'food' ? { x: -174, y: GY - 161, z: -51, rx: -46, ry: 0, lvl: 'G' }
        : { x: -60, y: GY - 143, z: -379.8, rx: 3, ry: 0, lvl: 'G' };
    bar.classList.toggle('bf-sparkler',kind==='sparkler');
    work = { kind, step: null, down: false, ink: [], n: 0, sectors: new Set() };
    if (!H.focus({ ...p, seat: 1 }, { ms: 650, label: 'Put the tools down', enter: nextWork, exit: closeWork })) { work = null; return; }
    if (kind === 'sparkler') { sparkHand.visible = true; sparkHand.position.set(10,-9,-35);sparkHand.quaternion.identity(); trace.length = 0; sound.hiss();H.relight(); }
  }
  function closeWork() { work = null; bar.hidden = true; if (sparkHand) sparkHand.visible = false; sync(); }
  function finishGesture(step) {
    if (!work || work.step !== step || work.pending || H.paused) return;
    if (step === 'gloves' && Date.now() - (state().steps?.['bf-food']?.oven || Date.now()) < 6000) { panel('Oven timer', 'A few more seconds. Mom is doing the hot part.', ['Put on oven gloves', () => finishGesture('gloves')]); return; }
    work.pending = true; SE.step(EID, oid(work.kind), step, ['face', 'write'].includes(step) ? work.ink.slice(0, 160) : undefined); sound.rustle();
  }
  function finishWriting() {
    if (!work || work.kind !== 'sparkler' || work.ink.length < 12 || work.n < 160) return;
    say('c4.bon.sis', '{sister}', "Look! I'm writing in the air! Can you read it?");
    finishGesture('write');
  }
  function project(x, y, z) { const el = H.ren.domElement.getBoundingClientRect(); temp.set(x, y, z).project(H.camera); return [el.left + (temp.x + 1) * el.width / 2, el.top + (1 - temp.y) * el.height / 2]; }
  function workBounds() {
    if (!work) return null;
    if (work.kind === 'sparkler') return { x: innerWidth * .13, y: innerHeight * .22, w: innerWidth * .74, h: innerHeight * .42 };
    const box = new T.Box3().setFromObject(work.kind === 'guy' ? (work.step === 'face' ? guy.userData.head : guy) : DEC.food);
    const pts = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(project(x, y, z));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  function pointer(ev, first) {
    if (!work || H.paused || H.gliding || work.pending || ev.target.closest?.('button,.se-bar,.hs-touch,.hs-menu')) return;
    const b = workBounds(); if (!b || ev.clientX < b.x || ev.clientX > b.x + b.w || ev.clientY < b.y || ev.clientY > b.y + b.h) return;
    if (first) { ev.preventDefault(); ev.stopImmediatePropagation(); work.down = true; }
    if (!work.down) return;
    const x = (ev.clientX - b.x) / b.w, y = (ev.clientY - b.y) / b.h;
    const last = work.last; work.last = [ev.clientX, ev.clientY];
    const dist = last ? Math.min(40, Math.hypot(last[0] - ev.clientX, last[1] - ev.clientY)) : 0;
    const step = work.step;
    if (step === 'prick') {
      if (!first) return;
      const el = H.ren.domElement.getBoundingClientRect(); ndc.set((ev.clientX - el.left) / el.width * 2 - 1, 1 - (ev.clientY - el.top) / el.height * 2); ray.setFromCamera(ndc, H.camera);
      const index = foodPotatoes.findIndex(g => ray.intersectObject(g, true).length); if (index < 0) return;
      work.sectors.add(index); prickMarks[index].visible = true; sound.rustle();
      if (work.sectors.size >= 4) finishGesture(step); else panel('Prick the skins', 'Potatoes checked: ' + work.sectors.size + ' / 4. Click each one.'); return;
    }
    if (step === 'hat' && first) return finishGesture(step);
    if (['stuff', 'wash', 'foil', 'tie', 'face', 'write'].includes(step)) {
      if (dist < 2) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); work.n += dist; work.ink.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
      if (work.ink.length > 150) work.ink.splice(1, 1);
      work.sectors.add((x > .5 ? 1 : 0) + (y > .5 ? 2 : 0));
      if (step === 'face') {
        const c = faceMap.userData.g; c.strokeStyle = '#26313b'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); const prev = work.ink[work.ink.length - 2] || [x, y]; c.moveTo(prev[0] * 256, prev[1] * 256); c.lineTo(x * 256, y * 256); c.stroke(); faceMap.needsUpdate = true;
      } else if (step === 'write') {
        // The actual wire tip and drawn trail meet on the pointer ray; the afterglow lasts three seconds.
        ndc.set(ev.clientX / innerWidth * 2 - 1, 1 - ev.clientY / innerHeight * 2); ray.setFromCamera(ndc, H.camera);
        const direction=H.camera.worldToLocal(ray.ray.at(95,new T.Vector3())).normalize(), base=H.camera.worldToLocal(new T.Vector3(.26,-.58,.5).unproject(H.camera)).normalize().multiplyScalar(48);
        const dot=direction.dot(base), reach=dot+Math.sqrt(Math.max(1,dot*dot-base.lengthSq()+47*47)), tip=direction.multiplyScalar(reach);
        sparkHand.position.copy(base);sparkHand.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),tip.clone().sub(base).normalize());
        const p=H.camera.localToWorld(tip);p.y*=-1;trace.push({x:p.x,y:p.y,z:p.z,at:performance.now()});if(trace.length>160)trace.shift();
        if (work.n > 160 && work.ink.length >= 12) panel('Lovely sparkler writing!', 'Your name, a star or a very wobbly spaceship. Finish, then hot wire into water.', ['Finished writing', finishWriting]);
      } else {
        if (step === 'stuff') guyFull.scale.set(.6 + Math.min(.14, work.n / 5000), .6, .6 + Math.min(.08, work.n / 7000));
        if (Math.random() < .1) sound.rustle();
      }
      if (step !== 'write' && work.n > (step === 'stuff' ? 650 : step === 'tie' ? 450 : 380) && work.ink.length >= 12 && (step === 'face' || work.sectors.size >= 3)) finishGesture(step);
      H.dirty();
    }
  }
  document.addEventListener('pointerdown', e => pointer(e, true), true);
  document.addEventListener('pointermove', e => pointer(e, false), true);
  for (const k of ['pointerup', 'pointercancel']) document.addEventListener(k, () => { if (work) { work.down = false; work.last = null; } }, true);
  addEventListener('keydown', e => {
    if (!work || /input|textarea|select/i.test(e.target?.tagName) || e.ctrlKey || e.metaKey) return;
    if (['f', 'i'].includes(e.key.toLowerCase()) && ['hat', 'oven', 'gloves', 'write'].includes(work.step)) { e.preventDefault(); e.stopImmediatePropagation(); if (work.step === 'write') finishWriting(); else finishGesture(work.step); }
  }, true);

  // ------------------------------------------------ fireworks: two draw calls, fixed buffers, independent of room culling.
  const MAX = 1400, particles = Array.from({ length: MAX }, () => ({ life: 0 }));
  const DOTS=10, dots = new Float32Array(MAX * DOTS * 3), dotcols = new Float32Array(MAX * DOTS * 3), dotSizes = new Float32Array(MAX * DOTS), dotKinds=new Float32Array(MAX*DOTS);
  let cursor = 0, fx, sparkHand, trailGeo, traceLines, fire = null, flash = 0, shellIndex = 0, lastLight = 0, lastEmber = 0;
  const crackles = Array.from({length:48},()=>({at:0,x:0,y:0,z:0})); let crackleCursor=0;
  const tongues = [], sparkWhite = new T.Color('#fff2cd');
  const palette = [new T.Color('#ff982b'), new T.Color('#ff607e'), new T.Color('#6ae4ff'), new T.Color('#b6ff83'), new T.Color('#dba6ff')];
  function makeFX() {
    fx = new T.Group(); fx.name = 'bonfire-sky'; H.root.add(fx);
    const dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(dots, 3).setUsage(T.DynamicDrawUsage)); dg.setAttribute('color', new T.BufferAttribute(dotcols, 3).setUsage(T.DynamicDrawUsage)); dg.setAttribute('size',new T.BufferAttribute(dotSizes,1).setUsage(T.DynamicDrawUsage)); dg.setAttribute('kind',new T.BufferAttribute(dotKinds,1).setUsage(T.DynamicDrawUsage));
    const dm = new T.ShaderMaterial({ uniforms:{time:{value:0},pointScale:{value:650}}, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false,
      vertexShader: 'uniform float pointScale; attribute float size; attribute float kind; varying float vKind; varying vec3 vColor; void main(){vKind=kind;vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*pointScale/max(1.0,-p.z),1.5,256.0);}',
      fragmentShader: 'uniform float time; varying float vKind; varying vec3 vColor; void main(){if(vKind>.5){vec2 p=gl_PointCoord;float y=1.0-p.y;float w=max(.02,(1.0-y)*.46);float d=abs(p.x-.5+sin(y*9.0+time*7.0)*.055)/w;float a=(1.0-smoothstep(.4,1.0,d))*smoothstep(0.0,.14,y)*(1.0-smoothstep(.75,1.0,y));vec3 c=mix(vec3(1.0,.12,.01),vec3(1.0,.88,.28),pow(1.0-y,2.0));gl_FragColor=vec4(c*1.4,a*.65*vColor.r);return;}float d=length(gl_PointCoord-.5)*2.0;if(d>1.0)discard;float a=exp(-d*d*5.0)*(1.0-smoothstep(.75,1.0,d));gl_FragColor=vec4(vColor*1.5,a);}' });
    dg.setDrawRange(0,0); const points = new T.Points(dg, dm); points.frustumCulled = false; points.userData.noPick = true; fx.add(points); Object.assign(fx.userData, { dg,dm });
    trailGeo = new T.BufferGeometry(); trailGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(1600 * 3), 3).setUsage(T.DynamicDrawUsage)); trailGeo.setAttribute('color',new T.BufferAttribute(new Float32Array(1600*3),3).setUsage(T.DynamicDrawUsage)); trailGeo.setAttribute('size',new T.BufferAttribute(new Float32Array(1600),1).setUsage(T.DynamicDrawUsage));trailGeo.setAttribute('kind',new T.BufferAttribute(new Float32Array(1600),1));
    trailGeo.setDrawRange(0,0); traceLines = new T.Points(trailGeo, dm.clone()); traceLines.frustumCulled = false; fx.add(traceLines);
    sparkHand = new T.Group(); const b = K.batch(), B = K.into(b); B.cyl(0, 0, -28, .25, .25, 35, 5, M({c:'#cec8b4',e:'#493d1b'}), { rx: 90 }); B.cyl(0, 0, -43, .6, .6, 11, 6, mat.dark, { rx: 90 }); glove(B, 0, 3, -11, .74); B.cyl(0, 3, 0, 2.8, 3.1, 11, 20, mat.blue, { rx: 90 }); b.build(sparkHand);
    if(!H.camera.parent)H.scene.add(H.camera); H.camera.add(sparkHand); sparkHand.position.set(12, -12, -35); sparkHand.renderOrder=20; sparkHand.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.emissive)o.material.emissive.copy(o.material.color).multiplyScalar(.18);o.material.depthTest=true;o.material.depthWrite=true;o.renderOrder=20;}}); sparkHand.visible = false;
  }
  const cap = () => H.Q?.adapt >= 5 || H.Q?.tier === 'potato' ? 120 : low() || innerWidth < 900 ? 430 : 1000;
  function emit(x, y, z, vx, vy, vz, color, life = 2.6, gravity = 32, tail = .08) {
    const p = particles[cursor++ % cap()]; Object.assign(p, { x, y, z, px: x, py: y, pz: z, vx, vy, vz, color, life, max: life, gravity, tail, born:performance.now(), flame:0, size: gravity===0 ? 6 : cap()===120?9:6 });
  }
  // Four shell silhouettes share the same bounded point/streak pool, including the hanging willow tails.
  function burst(x, y, z, style = 0, far = false, gold = false) {
    const n = cap()===120 ? 34 : cap()===430 ? 90 : 190, shape = style % 4, color = gold ? palette[0] : palette[(style + 1) % palette.length];
    for (let i = 0; i < n; i++) {
      const a = i * 2.399963, zz = shape === 3 ? Math.sin(i * 6.283 / n) * .16 : 1 - 2 * (i + .5) / n;
      const r = Math.sqrt(1 - zz * zz), speed = (shape === 1 ? 86 : shape === 2 ? 90 : 112) * (.87 + Math.random() * .2);
      const ring = i * Math.PI * 2 / n;
      const vx = shape === 3 ? Math.cos(ring) * speed : Math.cos(a) * r * speed;
      const vy = shape === 3 ? Math.sin(ring) * speed : zz * speed - (shape === 1 ? 28 : 0);
      const vz = shape === 3 ? Math.sin(ring) * speed * .2 : Math.sin(a) * r * speed;
      emit(x, y, z, vx, vy, vz, gold || shape === 1 ? palette[0] : i % 9 ? color : palette[0], shape === 1 ? 5.4 : shape === 2 ? 3.2 : 3.8, shape === 1 ? 34 : 21, shape === 1 ? .9 : shape === 2 ? .22 : .3);
    }
    if (shape === 2) for (let i=0;i<(low()?5:12);i++) { const a=i*2.39996,r=35+(i%4)*13; Object.assign(crackles[crackleCursor++%crackles.length],{at:performance.now()+650+i*55,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,z:z+Math.sin(i*3)*r*.5}); }
    emit(x,y,z,0,0,0,gold?palette[0]:color,.38,0,0); particles[(cursor-1)%cap()].size=125;
    flash = Math.max(flash, far ? .12 : .9);
    if (on && SE.today().hour >= 17) sound.bang(far, Math.hypot(x-H.P.x, y-H.P.y, z-H.P.z) / 100);
  }
  function rocket(x, z, style = 0, distant = false, delay = 0, gold = false) {
    const y0 = distant ? -20 : GY - 30, height = distant ? 650 : 335 + (style % 3) * 15;
    let fired = false, whistled = false; const t0 = performance.now() + delay, key = 'bf.rocket.' + t0 + '.' + Math.random();
    H.anims.set(key, now => {
      if (!on) return false; const t = (now - t0) / 1400; if (t < 0) return true;
      if (!whistled) { whistled = true; if (!distant && H.here === 'garden') sound.whistle(); }
      if (t < 1) { emit(x + Math.sin(t * 12) * 2, y0 - height * t, z - (distant?0:220*t), (Math.random() - .5) * 8, 36, 0, palette[0], .7, 18); return true; }
      if (!fired) { fired = true; burst(x, y0 - height, distant?z:z-220, style, distant, gold); } return false;
    });
  }
  function makeFire() {
    DEC.ash = group('ash', 'garden', PILE.x, GY, PILE.z, B => {
      const tex=K.tex('bf.scorch',256,256,c=>{const r=K.rnd(682);const g=c.createRadialGradient(128,128,12,128,128,124);g.addColorStop(0,'rgba(30,26,21,.93)');g.addColorStop(.5,'rgba(35,29,23,.8)');g.addColorStop(.8,'rgba(44,32,21,.35)');g.addColorStop(1,'rgba(44,32,21,0)');c.fillStyle=g;c.fillRect(0,0,256,256);for(let i=0;i<650;i++){const x=r()*256,y=r()*256,d=Math.hypot(x-128,y-128)/128;c.fillStyle='rgba(14,12,10,'+(Math.max(0,1-d)*r()*.35)+')';c.fillRect(x,y,1+r()*5,1+r()*3);}}, {clamp:true});
      const g=new T.CircleGeometry(60,40),p=g.attributes.position;for(let i=1;i<p.count;i++){const k=1+Math.sin(i*2.7)*.06+Math.cos(i*1.3)*.035;p.setX(i,p.getX(i)*k);p.setY(i,p.getY(i)*k);}
      B.geo(g,0,-.35,0,new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),{rx:90});
      const r=K.rnd(287);for(let i=0;i<15;i++){const x=(r()-.5)*66,z=(r()-.5)*62;B.ball(x,-.8,z,2+r()*4,.6+r()*.8,2+r()*4,i%3?mat.coal:M('#403b32'),7);}
      for(let i=0;i<11;i++){const A=B.at((r()-.5)*66,-1.4,(r()-.5)*62,r()*360);A.cyl(0,0,0,.55+r()*.65,.45,11+r()*20,6,mat.coal,{rz:90});}
      for(const [x,z]of[[-9,7],[17,-11]])B.ball(x,-1.6,z,1.2,.45,.8,M({c:'#67412a',e:'#281006'}),6);
    });
    fire = new T.Group(); fire.name = 'bonfire-flames'; fire.position.set(PILE.x, GY - 16, PILE.z); H.ROOMS.garden.group.add(fire);
    for (let i = 0; i < 12; i++) {
      const height = 58 + i % 4 * 23, radius = 7 + i % 3 * 3, geometry = new T.CylinderGeometry(radius, .2, height, 7, 4);
      const a = geometry.attributes.position; for (let j = 0; j < a.count; j++) { const y = a.getY(j), k = (height/2-y)/height; a.setXYZ(j, a.getX(j)+Math.sin(k*6+i)*k*5, y, a.getZ(j)+Math.cos(k*5+i)*k*4); } geometry.computeVertexNormals();
      const m = new T.Mesh(geometry, i % 3 ? mat.flame : mat.yellow); m.position.set(Math.sin(i*2.4)*23, -height/2+5, Math.cos(i*2.4)*23); m.userData.noPick = true; fire.add(m); tongues.push(m);
    }
    DEC.launch = group('launch-area', 'garden', 38, GY, -1205.2, B => { B = B.at(0,0,0);  B.cyl(0, -5, 0, 1, 4.5, 10, 10, mat.red); B.cyl(0, -10.5, 0, .3, .3, 1.3, 6, mat.string); B.cyl(18, -7, 0, 8, 9, 14, 12, mat.metal); B.cyl(18, -14.2, 0, 7.2, 7.2, .5, 12, mat.end); B.cyl(18, -21, 0, .45, .45, 28, 8, mat.dark); B.cyl(18, -36, 0, 1.8, 1.8, 10, 8, mat.blue); B.cyl(18, -43, 0, .1, 2, 4, 8, mat.red); B.shadow(8, 0, 0, 44, 33, .4); });
    DEC.wheel = group('wheel', 'garden', WHEEL.x, GY - 160, WHEEL.z, B => { B.box(0, 75, 0, 6, 170, 6, mat.wood); B.cyl(0, 0, 4, 14, 14, 3, 16, mat.card, { rx: 90 }); B.cyl(0, 0, 6, 2, 2, 3, 8, mat.metal, { rx: 90 }); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; B.cyl(Math.cos(a) * 9, Math.sin(a) * 9, 6, 1.5, 1.5, 9, 8, mat.red, { rz: i * 90 }); } });
    // A shared exclusion for the hot area; switched off outside the display, never across the back-door route.
    DEC.smoke = new T.Group(); DEC.smoke.name = 'bonfire-smoulder'; DEC.smoke.position.set(PILE.x, GY - 7, PILE.z); H.ROOMS.garden.group.add(DEC.smoke);
    for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: '#adb0a8', transparent: true, opacity: .08, depthWrite: false })); m.userData.noPick = true; DEC.smoke.add(m); }
    H.ambient.add(now => { if (!on || !(phase === 'tail' || showStart()) || !H.ROOMS.garden.group.visible || now < (DEC.smoke.userData.next || 0)) return false; DEC.smoke.userData.next = now + 150; DEC.smoke.children.forEach((m, i) => { const k = (now / 5500 + i / 3) % 1; m.position.set(k * 13 + Math.sin(i * 7) * 8, -k * (phase === 'tail' ? 54 : 190), Math.cos(i * 7) * 8); m.scale.set(4 + k * 12, 3 + k * 8, 4 + k * 10); m.material.opacity = Math.sin(k * Math.PI) * (phase === 'tail' ? .065 : .11); }); return true; });
    const guard = H.block('G', -132, gardenZ(-478), 15, gardenZ(-311), { off: true }); DEC.guard = guard;
  }
  const eveningHour = () => { const t = SE.today(); return t.hour + (t.owner ? 0 : (window.Seasons?.now?.() || new Date()).getMinutes() / 60); };
  const showStart = () => state().steps?.['bf-light']?.start || 0;
  const catchup = () => phase === 'tail' && !done('bf-light') && eveningHour() >= 18.5 && eveningHour() < 22;
  const leftover = () => state().display === 'leftovers';
  const duration = () => leftover() ? 90000 : 180000;
  function startDisplay() {
    if (!enabled() || !(phase === 'day' || catchup() || phase === 'tail' && leftover() && showStart())) return;
    if (done('bf-light')) return say('display.done', '{sister}', 'The golden one was my favourite!');
    const starting = !showStart() || catchup() && !leftover();
    if (starting && (eveningHour() < 18.5 || eveningHour() >= 22)) return say('display.time', 'Dad', 'Half past six until ten in the evening. Warm things on, and watch from the rope.');
    if (phase === 'day' && (!done('bf-code') || !done('bf-wood'))) return say('display.checks', 'Dad', 'Finish the dry stack and all five Firework Code checks first.');
    if (phase === 'day' && H.held() !== 'bf.torch' && (H.held() || !H.grab('bf.torch'))) return;
    if (starting) { SE.step(EID, 'bf-light', 'start', { hour: eveningHour() }); nextFire = 0; lastStage = ''; say('display.start', 'Dad', catchup() ? 'Missed Friday? I saved a few. No jobs tonight: just stay behind the rope and watch. I do all the lighting. The show carries on if you leave; come back here to finish.' : 'I have checked for animals. Torch this way, everyone behind the rope. I light one, then come back. The display carries on if you leave; come back to the rope to finish.'); }
    else say('display.resume', 'Dad', stageAt() === 'over' ? 'You are back! All finished safely. Stay at the rope while I check everything.' : 'The display carried on. Come back behind the rope and look up.');
    if(H.here==='garden' && H.P.z>gardenZ(-220) && H.P.z< -200) H.glideTo({x:-60,y:GY-H.STAND,z:-405,rx:8,ry:0,lvl:'G',seat:0},{ms:650,kind:'bonfire-watch'}); else {H.P.rx=8;H.P.ry=0;H.dirty();}
  }
  function stageAt() { if (!showStart() || phase === 'tail' && !leftover()) return null; const s = (Date.now() - showStart()) / duration(); return s < .195 ? 'fountain' : s < .39 ? 'wheel' : s < .612 ? 'rocket' : s < 1 ? 'finale' : 'over'; }
  function tick(now, dt) {
    if (!on) return false;
    const frameSeconds=Math.min(2,Math.max(.001,(now-(tick.lastTime||now-16))/1000));tick.lastTime=now;
    const t = SE.today(), night = t.hour >= 17 && t.hour < 24, visible = H.ROOMS.garden?.group.visible || H.ROOMS.bedroom?.group.visible || H.ROOMS.kitchen?.group.visible;
    const stage = night ? stageAt() : null;
    if (night && visible && now > nextSky) { nextSky = now + (low() ? 10500 : 7000) + Math.random() * 5000; rocket(-600 + Math.random() * 1500, -1900 - Math.random() * 750, Math.floor(Math.random() * 5), true); }
    if (stage && stage !== 'over' && visible && now > nextFire) {
      const elapsed = Date.now() - showStart(), remaining = duration() - elapsed;
      nextFire = now + (stage === 'finale' ? 6800 : 5200);
      if (stage === 'rocket') rocket(56, -1205.2, shellIndex++ % 4);
      if (stage === 'finale' && remaining > 11500) {
        for (let i = 0; i < 3; i++) rocket(-80+i*85, -1205.2-i%2*45, 1, false, i*420, true);
      } else if (stage === 'finale' && tick.lastBang !== showStart() && remaining <= 11500 && remaining > 5000) {
        tick.lastBang = showStart(); rocket(10, -1269.7, 1, false, 0, true); rocket(-85, -1218.1, 3, false, 350, true); rocket(95, -1218.1, 1, false, 700, true);
      }
      if (stage !== lastStage) { lastStage = stage; if (stage === 'wheel') say('wheel', '{sister}', 'A Catherine wheel! It is doing cartwheels!'); if (stage === 'rocket') say('rocket', 'Dad', 'Here comes the rocket. Stay back. Never go back to a firework, even if it seems to have stopped.'); if (stage === 'finale') say('finale', 'Mom', 'Ooooh! Look at those gold ones. Like golden rain!'); }
    }
    if (stage === 'fountain' || stage === 'wheel') {
      const n=Math.min(60,Math.max(1,Math.ceil(frameSeconds*(cap()===120?60:cap()===430?120:300))));
      for (let i = 0; i < n; i++) {
        const a = now / 75 + i * 1.9;
        if (stage === 'wheel') emit(WHEEL.x + Math.cos(a) * 15, GY - 160 + Math.sin(a) * 15, WHEEL.z + 6, Math.cos(a) * 120, Math.sin(a) * 120, 20 + Math.random() * 15, palette[i % 2], .9, 70);
        else emit(38, GY - 15, -1205.2, (Math.random() - .5) * 90, -110 - Math.random() * 150, (Math.random() - .5) * 65, palette[0], 1.2, 140);
      }
    }
    for (const c of crackles) if(c.at && now>=c.at){c.at=0;for(let i=0;i<(low()?4:8);i++){const a=i*Math.PI*2/(low()?4:8);emit(c.x,c.y,c.z,Math.cos(a)*40,Math.sin(a)*40,Math.cos(a*3)*25,sparkWhite,.5,25,.08);}if(H.here==='garden')H.sfx.noise(.08,.008,1800,Math.hypot(c.x-H.P.x,c.y-H.P.y,c.z-H.P.z)/34300,'highpass',3500);}
    const dad = window.HouseFamily?.chars?.dad;
    if (dad?.rig?.bones?.handR) {
      if (!dad.rig.group.userData.bonfireTaper) {
        const g = new T.Group(), b = K.batch(), B = K.into(b); B.cyl(0, 0, 14, .35, .35, 30, 6, mat.string, { rx: 90 }); B.ball(0, 0, 29, .65, .65, .65, mat.ember, 6); b.build(g); dad.rig.bones.handR.add(g); dad.rig.group.userData.bonfireTaper = g;
      }
      dad.rig.group.userData.bonfireTaper.visible = !!stage && stage !== 'over';
    }
    if (stage && stage !== 'over' && H.here === 'garden' && now > lastCrackle) { lastCrackle = now + 1700; H.sfx.noise(.18, .014, 1100, 0, 'lowpass', 1900); }
    const burning = phase === 'day' && !!showStart() && stage !== 'over';
    if (fire) {
      fire.visible = burning;
      if (burning) { const remaining = Math.max(.25, 1-(Date.now()-showStart())/duration()*.7); fire.scale.set(1, remaining, 1); tongues.forEach((m,i) => { m.scale.set(1+Math.sin(now/97+i)*.12, .76+Math.sin(now/(71+i*4)+i)*.24, 1); m.rotation.y=now/2200+i; });
        if (now > lastEmber) { lastEmber = now + (low()?100:45); emit(PILE.x+(Math.random()-.5)*42, GY-32, PILE.z+(Math.random()-.5)*36, 5, -45-Math.random()*38, 3, palette[0], 2.8, -4, .1); emit(PILE.x,GY-34,PILE.z,0,0,0,palette[0],.2,0,0); particles[(cursor-1)%cap()].size=68; for(let j=0;j<2;j++){emit(PILE.x+(Math.random()-.5)*38,GY-58,PILE.z+(Math.random()-.5)*25,0,-28,0,sparkWhite,.75,0,0);const p=particles[(cursor-1)%cap()];p.flame=1;p.size=100+Math.random()*38;} }
        for (const g of PARTS) { g.scale.y=remaining; g.position.y=GY; } for (let i=0;i<4;i++) { DEC['foundation'+i].scale.y=remaining; }
      }
    }
    flash = Math.max(0, flash-(dt||.016)*2.3);
    if (now-lastLight>160 && (burning || flash>0 || stage==='fountain' || stage==='wheel')) { lastLight=now; H.relight(); }
    if (phase === 'tail' && visible && !low() && Math.random() < .06) emit(PILE.x + Math.random() * 25, GY - 6, PILE.z, 2, -6, 0, palette[0], 1, 0);
    if (work?.kind === 'sparkler') {
      const v = new T.Vector3(0, 0, -47); sparkHand.localToWorld(v); v.y *= -1;
      emit(v.x, v.y, v.z, 0, 0, 0, sparkWhite, .07, 0);
      for (let i=0;i<(low()?2:4);i++) emit(v.x, v.y, v.z, (Math.random()-.5)*65, -Math.random()*45, (Math.random()-.5)*45, i%2 ? sparkWhite : palette[0], .35+Math.random()*.35, 90);
    }
    const watching = H.here === 'garden' && H.P.z > -498.4 && H.P.z < gardenZ(-70) && Math.abs(H.P.x + 60) < 120;
    if (tick.watching && !watching && stage && stage !== 'over' && !done('bf-light')) say('display.away', 'Dad', 'The display will carry on. Come back behind the rope when you are ready; you can still finish watching.');
    tick.watching = watching;
    // Collect elapsed milestones at the rope, including after returning from elsewhere or after the last bang.
    if (stage && !done('bf-light') && H.here === 'garden' && H.P.z > -498.4 && H.P.z < gardenZ(-70) && Math.abs(H.P.x + 60) < 120 && !H.paused && H.mode === 'walk') {
      const s = Date.now() - showStart(), order = leftover() ? [['fountain', 15000], ['wheel', 30000], ['rocket', 50000], ['finale', 90000]] : [['fountain', 35000], ['wheel', 70000], ['rocket', 110000], ['finale', 180000]];
      const next = order.find(([id]) => !got('bf-light', id));
      if (next && s >= next[1] && now > (tick.nextAck || 0)) { tick.nextAck = now + 1300; SE.step(EID, 'bf-light', next[0], { hour: eveningHour() }); }
    }
    const limit = cap(); let count = 0;
    for (let i = 0; i < MAX; i++) {
      const p = particles[i]; if (p.life <= 0 || i >= limit) { if (i >= limit) p.life = 0; continue; }
      const age=Math.max(0,(now-p.born)/1000),delta=Math.min(frameSeconds,age);p.life=p.max-age;if(p.life<=0)continue;
      p.px = p.x; p.py = p.y; p.pz = p.z; p.vy += p.gravity * delta; const drag = Math.pow(.84, delta); p.vx *= drag; p.vy *= drag; p.vz *= drag;
      p.x += p.vx * delta; p.y += p.vy * delta; p.z += p.vz * delta;
      const fade = Math.min(1,p.life/Math.min(1.5,p.max)) * (p.tail<.25?.75+Math.sin(p.life*61+i)*.25:1), c=p.color;
      const samples=p.tail?DOTS:1;
      for(let trail=0;trail<samples;trail++){
        const age=trail/(DOTS-1)*p.tail, j=(count*DOTS+trail)*3, f=fade*Math.pow(1-trail/DOTS,1.4);
        dots[j]=p.x-p.vx*age; dots[j+1]=p.y-p.vy*age+.5*p.gravity*age*age; dots[j+2]=p.z-p.vz*age;
        dotcols[j]=c.r*f;dotcols[j+1]=c.g*f;dotcols[j+2]=c.b*f;dotSizes[count*DOTS+trail]=p.size*(trail? .75:1.3);dotKinds[count*DOTS+trail]=p.flame;
      }
      for(let trail=samples;trail<DOTS;trail++){dotSizes[count*DOTS+trail]=0;dotcols.fill(0,(count*DOTS+trail)*3,(count*DOTS+trail+1)*3);}
      count++;
    }
    fx.userData.dm.uniforms.time.value=now/1000;const pointScale=innerHeight*.5*H.camera.projectionMatrix.elements[5];fx.userData.dm.uniforms.pointScale.value=pointScale;traceLines.material.uniforms.pointScale.value=pointScale;fx.userData.dg.setDrawRange(0,count*DOTS);
    for(const a of Object.values(fx.userData.dg.attributes))a.needsUpdate=true;
    const a=trailGeo.attributes.position.array,c=trailGeo.attributes.color.array,sz=trailGeo.attributes.size.array;let n=0;
    const traceAt=trace.length?trace[trace.length-1].at:0;if(now-traceAt>3200)trace.length=0;
    for(let i=1;i<trace.length;i++){
      const p=trace[i-1],q=trace[i], fade=Math.max(0,1-(now-traceAt)/3200);
      for(let j=0;j<8&&n<1600;j++,n++){const t=j/8,k=n*3;a[k]=p.x+(q.x-p.x)*t;a[k+1]=p.y+(q.y-p.y)*t;a[k+2]=p.z+(q.z-p.z)*t;c[k]=fade;c[k+1]=fade*.8;c[k+2]=fade*.32;sz[n]=2.6;}
    }
    trailGeo.setDrawRange(0,n);for(const a of Object.values(trailGeo.attributes))a.needsUpdate=true;
    syncCat(); H.dirty(); return true;
  }

  // ------------------------------------------------ account reconciliation, family routines and quiet quest guidance.
  function petCheck() { SE.step(EID, 'bf-code', 'pets'); say(catHome || displayEvening() ? 'cat.check' : 'cat.check.prep', 'Mom', catHome ? "The cat is safely indoors, hiding under the bed. Let the cat stay cosy." : displayEvening() ? "The cat is indoors. Keep the bedroom window shut tonight. Give the cat a quiet place to hide when the bangs start." : "The cat is indoors. Keep the bedroom window shut for the display. Give the cat a quiet place to hide when the bangs start."); if(catHome && H.here==='bedroom' && !H.focused && !H.held())H.focus({x:115,y:68,z:145,rx:0,ry:49,lvl:'U',seat:1},{ms:650,label:'Leave the cat cosy'}); }
  function syncCat() {
    const cat = H.SPOTS.cat?.obj; if (!cat) return;
    const hiding = on && SE.today().hour >= 17 && SE.today().hour < 24;
    if (on && !catAct0) catAct0 = H.SPOTS.cat.act;
    if (hiding && !catHome) {
      catHome = { p: cat.position.clone(), r: cat.rotation.clone(), s: cat.scale.clone(), pose: cat.userData.poseName, act: H.SPOTS.cat.act };
      cat.position.set(174, 73, 93); cat.rotation.y = -Math.PI / 2; cat.scale.y = .42; cat.userData.pose?.('sleep');
      H.SPOTS.cat.act = () => { SE.step(EID, 'bf-code', 'pets'); say('cat.safe', 'Mom', "The cat is safely indoors, hiding under the bed. Let the cat stay cosy. We will feed the cat when the bangs have stopped."); };
    } else if (!hiding && catHome) {
      cat.position.copy(catHome.p); cat.rotation.copy(catHome.r); cat.scale.copy(catHome.s); cat.userData.pose?.(catHome.pose || 'sleep'); H.SPOTS.cat.act = catHome.act; catHome = null;
    }
    if (on) {
      H.SPOTS.cat.act = petCheck;
      H.SPOTS['bf.petcheck']?.obj.position.set(122,70,112);
    } else if (catAct0) { H.SPOTS.cat.act = catAct0; catAct0 = null; }
  }
  function restoreFace() {
    const draw = state().art?.face; if (!draw || faceMap.userData.saved === draw.length) return;
    const c = faceMap.userData.g; c.fillStyle = '#dbcba4'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#26313b'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); draw.forEach((p, i) => i ? c.lineTo(p[0] * 256, p[1] * 256) : c.moveTo(p[0] * 256, p[1] * 256)); c.stroke(); faceMap.needsUpdate = true; faceMap.userData.saved = draw.length;
  }
  const counterProps = new Map();
  function clearCounter(clear) {
    if (clear) { for (const [id,t] of Object.entries(H.THINGS)) if (/^ch\.t\.(?:[pkg]\d|sauce)$/.test(id) && t.at.room === 'kitchen' && t.at.x < -120 && t.at.z < 40 && t.st !== 'held') { if(!counterProps.has(id))counterProps.set(id,{visible:t.obj.visible,off:H.SPOTS[id]?.off});t.obj.visible=false;if(H.SPOTS[id])H.SPOTS[id].off=true; } }
    else { for(const [id,p] of counterProps){const t=H.THINGS[id];if(t)t.obj.visible=p.visible;if(H.SPOTS[id])H.SPOTS[id].off=p.off;}counterProps.clear(); }
  }
  function sync() {
    if (!built) return;
    const packedLine=on&&phase!=='lead',washing=H.ROOMS.garden.washingLine,pickLine=H.SPOTS['hs.washline'];
    if(washing)washing.visible=!packedLine;if(pickLine){pickLine.off=packedLine;pickLine.obj.visible=!packedLine;pickLine.obj.userData.noPick=packedLine;}
    for (const [id, d] of Object.entries(DEC)) if (d?.isObject3D) d.visible = on;
    for (let i = 0; i < 4; i++) if (DEC['foundation' + i]) DEC['foundation' + i].visible = on && phase !== 'tail' && SE.today().dd >= i + 2;
    if (DEC.launch) DEC.launch.visible = on && phase !== 'tail';
    for (let i = 0; i < WOOD.length; i++) {
      const id = WOOD[i], t = H.THINGS['bf.wood.' + id], placed = got('bf-wood', id);
      PARTS[i].visible = on && phase !== 'tail' && placed;
      if (!placed && t?.st === 'snap') at(t, t.home);
      if (t?.st !== 'held' && t?.st !== 'anim') { t.at.hide = placed || !on || phase === 'tail'; H.place(t); }
      if (H.SPOTS[t?.id]) H.SPOTS[t.id].off = !on || placed || phase === 'tail';
      H.SNAPS['bf.s.' + id].off = !on || phase === 'tail' || placed;
    }
    for (let i = 1; i <= 6; i++) {
      const t = H.THINGS['bf.clean.' + i], hide = !on || phase !== 'tail' || eveningHour() >= 12 || got('bf-clean', 'c' + i);
      if (!got('bf-clean', 'c' + i) && t.st === 'snap') at(t, t.home);
      if (t.st !== 'held' && t.st !== 'anim') { t.at.hide = hide; H.place(t); } H.SPOTS[t.id].off = hide;
    }
    const ready = got('bf-guy', 'hat'), placed = done('bf-guy'), gt = H.THINGS['bf.guy.ready'];
    guy.visible = on && !ready && phase !== 'tail';
    if (gt.st !== 'held' && gt.st !== 'anim') {
      if (!placed && gt.st === 'snap') at(gt, gt.home);
      if (placed) at(gt, { room: 'garden', x: -154, y: GY - 43, z: -550, ry: 15 }, 'bf.s.guy');
      gt.at.hide = !on || !ready || placed || phase === 'tail'; H.place(gt);
    }
    H.SPOTS[gt.id].off = !on || !ready || placed || phase === 'tail';
    H.SPOTS['bf.guy'].off = !on || ready || phase === 'tail'; H.SNAPS['bf.s.guy'].off = !on || placed || !ready || phase === 'tail'; guyChair.visible = on; DEC.guySeated.visible = on && placed && phase !== 'tail';
    clearCounter(on && phase !== 'tail' && !done('bf-food'));
    const cakeUnit = H.THINGS['bf.parkin'];cakeUnit.at.hide=!on || phase==='tail'&&eveningHour()>=12;H.place(cakeUnit);H.SPOTS['bf.parkin'].off=cakeUnit.at.hide;
    const cooked = got('bf-food', 'gloves'), served = done('bf-food'); DEC.food.visible = on && !cooked && phase !== 'tail'; DEC.cakes.visible = on;
    for (let i = 0; i < foodPotatoes.length; i++) { foodPotatoes[i].visible = !got('bf-food', 'foil'); foilPotatoes[i].visible = got('bf-food', 'foil'); prickMarks[i].visible = got('bf-food', 'prick') && !got('bf-food', 'foil'); }
    if (foodTray.st !== 'held' && foodTray.st !== 'anim') {
      if (!served && foodTray.st === 'snap') at(foodTray, foodTray.home);
      if (served) at(foodTray, { room: 'garden', x: -108, y: GY - 66, z: -305 }, 'bf.s.supper');
      foodTray.at.hide = !on || !cooked || phase === 'tail'; H.place(foodTray);
    }
    H.SPOTS['bf.tray'].off = !on || !cooked || served || phase === 'tail'; H.SPOTS['bf.food'].off = !on || cooked || phase === 'tail';
    H.SNAPS['bf.s.supper'].off = !on || served || phase === 'tail';
    DEC.bucketEmpty.visible = on && !got('bf-code', 'water'); DEC.bucketFull.visible = on && got('bf-code', 'water');
    const spent = H.THINGS['bf.spent']; if (spent.st !== 'held' && spent.st !== 'anim') { spent.at.hide = !on || !done('bf-sparkler') || done('bf-bucket') || phase !== 'day'; H.place(spent); }
    H.SPOTS['bf.spent'].off = !on || phase !== 'day' || !done('bf-sparkler') || done('bf-bucket'); H.SNAPS['bf.s.bucket'].off = !on || !got('bf-code', 'water') || done('bf-bucket') || phase !== 'day';
    const hot = on && phase === 'day' && showStart() && stageAt() !== 'over';
    DEC.guard.off = !hot;
    if (!showStart()) { for (const g of PARTS) g.scale.y = 1; for (let i=0;i<4;i++) DEC['foundation'+i].scale.y=1; } H._.grids.dirty = true;
    H.SPOTS['bf.torch'].off = !on || phase !== 'day';
    if (H.THINGS['bf.torch'].st !== 'held') { H.THINGS['bf.torch'].at.hide = !on || phase !== 'day'; H.place(H.THINGS['bf.torch']); }
    DEC.ash.visible = on && (phase === 'tail' || stageAt() === 'over'); DEC.smoke.visible = on && (phase === 'tail' || !!showStart()); fx.visible = on;
    for (const [id, type] of Object.entries(ITEMS)) {
      if (type === 'spot' && !['bf.guy', 'bf.food', 'bf.petcheck'].includes(id)) H.SPOTS[id].off = !on || phase === 'tail';
      if (id === 'bf.petcheck') H.SPOTS[id].off = !on || phase === 'tail';
      if (id === 'bf.s.bin') H.SNAPS[id].off = !on || phase !== 'tail' || eveningHour() >= 12;
    }
    if (on && phase === 'tail' && eveningHour() >= 12) {
      for (const [id, d] of Object.entries(DEC)) if (d?.isObject3D && !['ash', 'smoke'].includes(id)) d.visible = false;
      guyChair.visible = false;
      if (catchup() || leftover() && showStart() && !done('bf-light')) { DEC.line.visible = true; DEC.launch.visible = true; DEC.wheel.visible = true; H.SPOTS['bf.line'].off = false; }
    }
    H.SPOTS['bf.sparklers'].off=!on || phase!=='day' || done('bf-sparkler');
    // Disabled close-up volumes must not intercept rays to the newly finished, carryable prop.
    for(const [id,type] of Object.entries(ITEMS)) if(type==='spot' && H.SPOTS[id]?.obj.userData.bfOwn){const s=H.SPOTS[id];s.obj.visible=!s.off;s.obj.userData.noPick=!!s.off;}
    // Stop chapter props covering the table only while the Guy is being made. Nothing is removed from a save.
    if (H.ROOMS.kitchen.tableProps) H.ROOMS.kitchen.tableProps.visible = !on || ready || phase === 'tail';
    if (!got('bf-guy', 'face') && !work) { const c = faceMap.userData.g; c.fillStyle = '#dbcba4'; c.fillRect(0, 0, 256, 256); faceMap.userData.saved = 0; faceMap.needsUpdate = true; }
    restoreFace(); syncCat(); if (work) nextWork(); H.relight(); H.dirty();
  }
  function buildAll() {
    if (built || building || !H.live || !state().open || window.AccountGate?.allowed === false || document.readyState !== 'complete' || document.querySelector('.hs-loading,#houseEntry') || !H.ROOMS.garden || !H.ROOMS.kitchen || !window.HouseRooms?.ready) return;
    building = true;
    for (const r of ['garden', 'kitchen', 'bedroom']) H.buildRoom(H.ROOMS[r]);
    built = true; makeWood(); makeGuy(); makeFood(); makeCode(); makeFire(); makeFX();
    // Real dry wood already collected by Dad: a few more pieces appear each day, beneath the player's stack.
    for (let i = 0; i < 4; i++) DEC['foundation' + i] = group('dad-stack.' + i, 'garden', PILE.x, GY - 4 - i * 6, PILE.z, B => { for (let j = 0; j < 8; j++) { const a = (i * 8 + j) * 2.39996; branch(B, [Math.cos(a)*46, i*6, Math.sin(a)*46], [Math.cos(a+.2)*9, -70-i*10, Math.sin(a+.2)*9], 2.0+j%3*.4); } for(let j=0;j<9;j++) log(B,Math.sin(j*9)*19,-5-j*4,Math.cos(j*9)*19,j*37,35+j%3*9,1.4); newspaper(B,0,-8-i*8,0,1.5); });
    const r = H.ROOMS.garden, a0 = r.amb, l0 = r.lights;
    r.amb = () => { const a = typeof a0 === 'function' ? a0() : a0; return on && SE.today().hour >= 17 ? { ...a, sky: '#777b9c', gnd: '#625347', i: Math.max(a?.i || .2, .33) } : a; };
    r.lights = () => { const a = (typeof l0 === 'function' ? l0() : l0 || []).slice(); if (on && SE.today().hour >= 17) { const burning = phase === 'day' && showStart() && stageAt() !== 'over'; a.push({x:PILE.x,y:GY-95,z:PILE.z+55,c:'#ff963f',i:burning ? 2.7+Math.sin(performance.now()/83)*.3 : .15,d:650}); if (flash > .02) a.push({x:0,y:GY-170,z:gardenZ(-220),c:'#ffe5b4',i:flash*1.8,d:850});if(work?.kind==='sparkler')a.push({x:H.P.x+12,y:H.P.y+12,z:H.P.z-40,c:'#ffe1a4',i:1,d:200}); } return a; };
    building = false;
    H.on('grab', id => { if (id.startsWith('bf.')) H.dirty(); });
  }
  function enable(ph) {
    const fresh = !on || phase !== ph; on = true; phase = ph; buildAll(); sync();
    if (built && SE.today().hour >= 17 && SE.today().hour < 24) { if (!H.anims.has('bf.tick')) H.anims.set('bf.tick', tick); } else { H.anims.delete('bf.tick'); if (fire) fire.visible = false; if(fx){for(const p of particles)p.life=0;fx.userData.dg.setDrawRange(0,0);trailGeo.setDrawRange(0,0);} }
    if (fresh) {
      if (ph === 'lead') say('lead', 'Dad', 'Bonfire Night on Friday. Help me stack the dry garden wood, and you two can make a Guy. Closed firework tin stays with me.');
      if (ph === 'day') say('day', 'Mom', 'Bonfire Night! Potatoes, parkin and warm gloves. The washing is in and Dad has put the whirly line away. Keep the cat indoors.');
      if (ph === 'tail') say('tail', 'Dad', 'I have damped the fire right down and checked the cold rubbish. Sticks and wrappers into the bin, please. Leave the ash alone; I will check it again.');
    }
    if (built) for (let i = 0; i < 4; i++) DEC['foundation' + i].visible = on && phase !== 'tail' && SE.today().dd >= i + 2;
  }
  function disable() {
    if (!on) return; on = false; phase = null;
    if (work && H.focused) H.unfocus(); if (H.held()?.startsWith('bf.')) H.putBack();
    if (built) { for (const p of particles) p.life = 0; for(const c of crackles)c.at=0; fire.visible = false; sparkHand.visible = false; sync(); }
    const taper = window.HouseFamily?.chars?.dad?.rig?.group.userData.bonfireTaper; if (taper) taper.visible = false;
    H.anims.delete('bf.tick'); syncCat(); H.relight(); H.dirty();
  }
  function targets(c) {
    if (!built) return [];
    const o = c.o.id, held = H.held();
    if (o === 'bf-wood') { if (held?.startsWith('bf.wood.')) return ['bf.s.' + held.slice(8)]; return WOOD.filter(s => !got(o, s)).slice(0, 2).map(s => 'bf.wood.' + s); }
    if (o === 'bf-guy') return held === 'bf.guy.ready' ? ['bf.s.guy'] : [got(o, 'hat') ? 'bf.guy.ready' : 'bf.guy'];
    if (o === 'bf-food') return held === 'bf.tray' ? ['bf.s.supper'] : [got(o, 'gloves') ? 'bf.tray' : 'bf.food'];
    if (o === 'bf-code') { const s = ['tin', 'water', 'pets', 'line', 'taper'].find(s => !got(o, s)); return [s === 'pets' ? 'bf.petcheck' : 'bf.' + s]; }
    if (o === 'bf-light') return catchup() || held === 'bf.torch' || showStart() ? ['bf.line'] : ['bf.torch'];
    if (o === 'bf-sparkler') return [got(o, 'gloves') ? 'bf.sparklers' : 'bf.gloves'];
    if (o === 'bf-bucket') return [held === 'bf.spent' ? 'bf.s.bucket' : 'bf.spent'];
    if (o === 'bf-clean') return held?.startsWith('bf.clean.') ? ['bf.s.bin'] : ['bf.clean.' + [1, 2, 3, 4, 5, 6].find(i => !got(o, 'c' + i))];
    return [];
  }
  function describe(id) {
    if (!id.startsWith('bf.')) return null;
    const t = H.THINGS[id], s = H.SPOTS[id], sn = H.SNAPS[id];
    return { label: typeof s?.label === 'function' ? s.label() : s?.label || sn?.hint || t?.label || 'Bonfire Night', action: sn ? 'E: ' + sn.hint : t ? 'E: pick it up' : 'F: use / look closely' };
  }
  // np-life uses these goals through its normal routes, doors, personal space and arrival animations.
  let watchBank='right';
  const watchFire = {x:-65,y:255,z:-1068.5}, watchSky = {x:0,y:-180,z:-1708.1};
  function familyLook() {
    if (!enabled() || !(phase==='day'||catchup()||leftover()&&showStart()) || !showStart()) return null;
    const hour=SE.today().hour;if(hour<17||hour>=22)return null;
    const stage = stageAt();
    return stage === 'rocket' || stage === 'finale' ? watchSky : watchFire;
  }
  function familySpace(){return enabled() && (phase==='day'||catchup()||leftover()&&showStart()) && SE.today().hour>=17 && H.here==='garden'?150:0;}
  function familyGoal(id) {
    if (!enabled() || !(phase === 'day' || catchup() || leftover() && showStart()) || SE.today().hour < 17 || SE.today().hour >= 22) return null;
    const showing = showStart() && stageAt() !== 'over', elapsed = showStart() ? (Date.now() - showStart()) / 1000 : 0;
    if (id === 'mom' && !showStart()) return { key: 'bf.mom.supper', spot: { lvl: 'G', x: -10, z: -84, face: 180 }, act: 'cook' };
    const px=H.P?.x??-60;if(watchBank==='right'&&px>-40)watchBank='left';else if(watchBank==='left'&&px< -50)watchBank='right';
    const bank=watchBank==='right'?{mom:[300,-310,220],dad:[250,-370,190],sister:[300,-450,215]}:{mom:[-290,-310,140],dad:[-240,-370,170],sister:[-290,-450,155]};
    const lighting = showing && elapsed % 16 < 7;
    const p = id === 'dad' && lighting ? (stageAt() === 'wheel' ? [150,-1269.7,236] : [155,-1096.9,180]) : bank[id];
    return { key: 'bf.' + id + (lighting && id === 'dad' ? '.light.' + stageAt() : '.watch.'+watchBank), spot: { lvl: 'G', x: p[0], z: p[1], face: p[2] }, act: lighting && id === 'dad' ? 'reach' : null };
  }
  function displayEvening() { return phase === 'day' && SE.today().hour >= 17 && SE.today().hour < 22; }
  function talk(id) {
    if (!enabled()) return false;
    if (phase === 'tail') { if (id === 'dad') { if (catchup()) startDisplay(); else say('tail.talk.times', 'Dad', 'Cold sticks in the bin. Leave the ash alone. If you missed Friday, I saved leftovers for the evening, half past six until ten.'); return true; } return false; }
    if (id === 'dad') say('dad.talk', 'Dad', done('bf-code') ? 'Safety checks all done. Dry wood only on the stack. Friday evening: torch at the rope, then supper. I do the lighting.' : 'Tin shut, bucket full, pets indoors, everyone behind the rope, long taper. Five checks. No cutting corners.');
    else if (id === 'mom' && phase === 'day' && SE.today().hour >= 22) say('mom.talk.late', 'Mom', 'It is getting late. Help me put the supper things away, then off to bed.');
    else if (id === 'mom') displayEvening() ? say('mom.talk', 'Mom', 'Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Then warm clothes on. No cold fingers tonight.') : say('mom.talk.prep', 'Mom', 'Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Have warm clothes ready for Bonfire Night. No cold fingers when we watch the display.');
    else say('sister.talk', '{sister}', done('bf-guy') ? 'Remember, remember, the fifth of November! I remembered. Dad forgot where he put his hat.' : "Will you help me stuff the Guy? Dad's old shirt is on the kitchen table. He says it was fashionable once.");
    return true;
  }
  SE.on('state', sync);
  // The house registers its doors after its room definitions. Wait until that boot has finished before adding bodies.
  setInterval(() => { if (on && !built) enable(phase); }, 1000);
  if (window.Net) Net.on('seStep', m => {
    if (m.e !== EID) return;
    if (!m.ok && work) { work.pending = false; panel('One moment', m.why === 'quick' ? 'Give Mom a moment, then try again.' : 'Finish the safety checks first.'); }
    if (m.ok && work?.pending) setTimeout(() => { if (work) { work.pending = false; nextWork(); } }, 100);
    if (m.ok && m.o === 'bf-light' && m.s === 'finale') { sync(); say('end', 'Dad', 'All finished. I am making everything safe. Stay here while I check. Thank you for watching from the rope!'); }
  });
  window.Bonfire = { get on() { return on; }, get phase() { return phase; }, get activity() { return work?.kind || null; }, get step() { return work?.step || null; }, get catHiding() { return !!catHome; }, familyGoal, familyLook, familySpace, talk, petCheck, DEC,
    _: { WOOD, woodHome, PILE, TABLE, stageAt, workBounds, potatoPoints: () => foodPotatoes.map(g => {const p = new T.Vector3(0, -5, 0);g.localToWorld(p);return project(p.x, p.y, p.z);}), get fxCount() { return (fx?.userData.dg.drawRange.count || 0)/DOTS; }, get fxLimit() { return cap(); }, path() {
      const b = workBounds(); if (!b) return [];
      const p = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) p.push([b.x + b.w * (.18 + .64 * (j % 2 ? 1 - i / 11 : i / 11)), b.y + b.h * (.2 + j * .15)]); return p;
    } },
  };
  SE.pack(EID, { on: enable, off: disable, targets, describe });
})();

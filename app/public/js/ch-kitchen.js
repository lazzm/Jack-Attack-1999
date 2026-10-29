/* ch-kitchen: Mom's jobs in THE KITCHEN (js/ch-core.js is the engine; the kitchen itself is js/hs-house.js).
 *   washup    click the sink: the hot tap into the washing-up bowl, then a squirt of washing-up liquid (bubbles!). Each dirty
 *             thing off the cooker goes in the water (one at a time), gets scrubbed (click it, four goes) and stands in
 *             the draining rack.
 *   table     four places at the kitchen table: a plate, a knife and fork and a glass on each mat, and the ketchup in the
 *             middle (Dad insists). They're stacked on the worktop by the kettle.
 *   shopping  two carrier bags on the floor: milk, eggs and cheese in the fridge (the bottom door), peas and fish fingers
 *             in the freezer (the top door), tins and cereal in the cupboard, the bread in the bread bin. Then fold the bags.
 * Mom's list is stuck on the freezer door with a magnet. Kitchen: x -280..195, z -56..295, floor y 353, worktop y 260. */
(function () {
  'use strict';
  const CK = window.ChoreKit; if (!CK || CK.MODS.washup) return;
  const { H, T, K, A, M, D2R } = CK;
  const GY = 353, WT = GY - 93; // the floor, the worktop
  const mat = (c, o) => M(Object.assign({ c, sh: 12, sp: '#222' }, o || {}));
  const grp = fn => { const g = new T.Group(); fn(K.into(g), g); return g; };
  const KR = () => H.ROOMS.kitchen;
  // (a picture on something round: cylinders, balls and lathes map their pictures the other way up in this y-down world)
  const flip = paint => (g, w, h) => { g.save(); g.translate(0, h); g.scale(1, -1); paint(g, w, h); g.restore(); };

  // ================================================================ dirt (each dirty thing has its own, so it can fade as you scrub)
  const dirtTex = (key, cols, seed) => K.tex('ch.dirt.' + key, 128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = K.rnd(seed);
    for (let i = 0; i < 18; i++) { const x = 20 + r() * 88, y = 20 + r() * 88, rr = 5 + r() * 16; const gr = g.createRadialGradient(x, y, 0, x, y, rr); const c = cols[i % cols.length]; gr.addColorStop(0, c); gr.addColorStop(0.7, c.replace(/[\d.]+\)$/, '0.5)')); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + r() * 0.6), r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(16 + r() * 96, 16 + r() * 96, 2 + r() * 3, 2 + r() * 2); }
  }, { clamp: true });
  const BEANS = ['rgba(200,80,20,.9)', 'rgba(160,60,10,.85)', 'rgba(230,180,40,.8)'], TEA = ['rgba(110,60,20,.8)', 'rgba(140,90,40,.6)'], FILM = ['rgba(255,255,255,.55)', 'rgba(240,235,220,.45)'], BURNT = ['rgba(60,30,10,.9)', 'rgba(190,70,20,.85)', 'rgba(110,50,10,.8)'];
  function dirt(G, key, cols, seed, y, r) { const m = M({ c: '#fff', map: dirtTex(key, cols, seed), tr: true, dw: false, sh: 30 }).clone(); const d = G.disc(0, y, 0, r, m, 24); d.renderOrder = 3; d.userData.own = true; d.name = 'washup-dirt-' + key; return m; }
  // the dirty things: [type, model]
  const DISH = [
    ['plate', () => grp(G => { G.lathe(0, 0, 0, [[12, -1.7], [10.6, -1.3], [7.2, -0.4], [0.1, -0.4]], 28, mat('#f6f4ee', { sh: 70, sp: '#999', side: 2 })); G.lathe(0, 0, 0, [[0.1, 0], [7.2, 0], [12, -1.7]], 28, mat('#e8e4da')); G.lathe(0, 0, 0, [[11.2, -1.62], [11.6, -1.66]], 28, mat('#2a5ad0')); G.group.userData.dirt = dirt(G, 'p0', BEANS, 3, -0.6, 9.6); })],
    ['plate', () => grp(G => { G.lathe(0, 0, 0, [[12, -1.7], [10.6, -1.3], [7.2, -0.4], [0.1, -0.4]], 28, mat('#f6f4ee', { sh: 70, sp: '#999', side: 2 })); G.lathe(0, 0, 0, [[0.1, 0], [7.2, 0], [12, -1.7]], 28, mat('#e8e4da')); G.lathe(0, 0, 0, [[11.2, -1.62], [11.6, -1.66]], 28, mat('#2a5ad0')); G.group.userData.dirt = dirt(G, 'p1', ['rgba(240,200,40,.9)', 'rgba(250,240,200,.7)', 'rgba(120,80,40,.7)'], 5, -0.6, 9.6); })],
    ['plate2', () => grp(G => { G.lathe(0, 0, 0, [[9, -1.4], [8, -1.1], [5.4, -0.4], [0.1, -0.4]], 26, mat('#f6f4ee', { sh: 70, sp: '#999', side: 2 })); G.lathe(0, 0, 0, [[0.1, 0], [5.4, 0], [9, -1.4]], 26, mat('#e8e4da')); G.group.userData.dirt = dirt(G, 'p2', ['rgba(120,70,30,.8)', 'rgba(230,200,150,.8)'], 7, -0.6, 7.4); })],
    ['bowl', () => grp(G => { G.lathe(0, 0, 0, [[0.001, 0], [4.3, 0], [7.4, -2.5], [7.8, -5], [7.5, -5.2], [7.2, -4.8], [6.7, -2.8], [3.6, -0.6], [0.001, -0.6]], 28, mat('#f2ece0', { sh: 60, sp: '#888', side: 2 })); G.group.userData.dirt = dirt(G, 'b', ['rgba(250,245,230,.85)', 'rgba(230,170,50,.85)'], 9, -0.65, 3.4); })],
    ['mug', () => grp(G => { const mm = mat('#d02a3a', { sh: 70, sp: '#999', side: 2 }); G.lathe(0, 0, 0, [[0.001, 0], [3.6, 0], [4.2, -0.6], [4.2, -9.6], [3.9, -10], [3.65, -9.8]], 24, mm); G.lathe(0, 0, 0, [[3.65, -9.8], [3.35, -1.2], [0.001, -1.2]], 24, mat('#efe8dc', { sh: 70, sp: '#999', side: 2 })); G.geo(new T.TorusGeometry(2.6, 0.7, 8, 16), 4.6, -5, 0, mm); G.group.userData.dirt = dirt(G, 'm', TEA, 11, -1.25, 3.2); })],
    ['glass', () => grp(G => { G.lathe(0, 0, 0, [[0.001, 0], [3, 0], [3.4, -0.8], [3.4, -11.7], [3.2, -12], [2.95, -11.7], [2.65, -1], [0.001, -1]], 24, M({ c: '#d8ecf4', o: 0.38, sh: 120, sp: '#fff', side: 2 })); G.group.userData.dirt = dirt(G, 'g', FILM, 13, -1.05, 2.6); })],
    ['pan', () => grp(G => { const al = mat('#b8bcc4', { sh: 90, sp: '#ddd', side: 2 }); G.lathe(0, 0, 0, [[0.001, 0], [8, 0], [9, -1], [9, -8.8], [9.2, -9], [8.6, -9], [8.4, -1.2], [0.001, -1.2]], 28, al); G.rbox(16, -7.5, 0, 14, 1.6, 2.6, 0.6, mat('#1a1a1a', { sh: 40 })); G.group.userData.dirt = dirt(G, 'pan', BURNT, 15, -1.25, 8); })],
  ];
  const DISHN = ['Dinner plate (baked beans)', 'Dinner plate (egg. EGG.)', 'Side plate (toast crusts)', 'Cereal bowl', 'Mug (tea ring)', 'Glass (milky)', 'Saucepan (burnt beans!)'];
  const PILE = [[-12, WT, -16, 0], [-12, WT - 1.8, -16, 30], [-12, WT - 3.5, -16, 70], [8, WT, -34, 0], [-26, WT, -38, 20], [-30, WT, -16, 0], [-12, WT - 4.9, -16, 0]];
  const RACK = { x: -132, z: -9 };
  // where each one stands in the rack: plates on their edges at the back, cups upside down at the front
  // Exact ceramic sizes: 24 cm dinner plates, 18 cm side plate. Their lower
  // edges sit on the cross-wire, faces between the uprights, never tilted through them.
  const RPOSE = [
    { x: -152.35, y: WT - 14.32, z: -8, rz: 90 }, { x: -147.35, y: WT - 14.32, z: -8, rz: 90 }, { x: -142.35, y: WT - 11.32, z: -8, rz: 90 },
    { x: -129.5, y: WT - 7.52, z: 0.5, rx: 180 }, { x: -116, y: WT - 12.32, z: 3, rx: 180 }, { x: -133, y: WT - 14.32, z: -19, rx: 180 }, { x: -117, y: WT - 11.32, z: -16, rx: 180, ry: 90 },
  ];
  // the washing-up bowl (red plastic, in the sink: every kitchen in 1999 had one), and the water in it
  const SINK = { x: -84, y: WT + 12, z: -26 }, LOW = SINK.y - 1, HALF = SINK.y - 5, FULL = SINK.y - 9;
  const tubR = y => 11.5 + Math.min(1, (SINK.y - y) / 12.8) * 2.7;
  // Only known factory poses move with a layout correction. Player placements,
  // snapped dishes and finished chore steps retain their saved state.
  function updateFactoryPose(t,old){if(!t||t.at.hide||t.st!=='rest'||t.at.room!=='kitchen'||!['x','y','z','ry'].every((k,i)=>Math.abs((t.at[k]||0)-old[i])<.11))return;CK.home(t.id)}
  let dishes = [], water = null, suds = null, tub = null, sinkSpot = null, soapBottle = null, extraSuds = 0, spongeBrush = null;
  const W = () => (CK.S.v.wash = CK.S.v.wash || { sc: {}, inn: -1 });
  const filled = () => CK.has('washup', 'fill');
  const inSink = () => dishes.findIndex(t => t && t.st === 'snap' && t.snap === 'ch.s.wsink');
  CK.add({
    id: 'washup', room: 'kitchen',
    build(r) {
      // the washing-up bowl, the water, the bubbles
      tub = grp(G => { const pm = mat('#d8283a', { sh: 40, sp: '#555', side: 2 }); G.lathe(0, 0, 0, [[14.6, -13.4], [14.2, -12.6], [11.5, -0.6], [11, 0], [0.1, 0]], 32, pm, { sz: 0.74 }); G.lathe(0, 0, 0, [[14.3, -13.2], [15.2, -13.4], [15.2, -12.8]], 32, mat('#c01a2a', { sh: 50 }), { sz: 0.74 }); G.disc(0, -0.7, 0, 11, mat('#b81a2a'), 28, { sz: 0.74 }); });
      tub.position.set(SINK.x,SINK.y,SINK.z);tub.name='washing-up-bowl';r.group.add(tub);
      water = new T.Mesh(new T.CircleGeometry(1, 32), M({ c: '#c8d8e0', o: 0.62, tr: true, sh: 120, sp: '#fff', side: 2 }).clone()); water.rotation.x = Math.PI / 2; water.position.set(SINK.x, LOW, SINK.z); water.visible = false; water.renderOrder = 2; r.group.add(water);
      suds = grp(G => { const r2 = K.rnd(21), sm = M({ c: '#ffffff', o: 0.94, tr: true, sh: 60, sp: '#fff' }); for (let i = 0; i < 52; i++) { const a = r2() * Math.PI * 2, d = Math.sqrt(r2()) * 12.4, s = 1.4 + r2() * 3; G.ball(Math.cos(a) * d, -s * 0.25, Math.sin(a) * d * 0.74, s, s * 0.65, s, sm, 10); } });
      suds.position.set(SINK.x, LOW, SINK.z); suds.visible = false; r.group.add(suds);
      // the washing-up liquid bottle (green, of course)
      soapBottle = grp(G => { G.lathe(0, 0, 0, [[0.4, -25], [1.1, -24], [1.3, -21], [3.2, -18.5], [4.2, -14], [4.2, -2], [3.8, 0], [0.1, 0]], 20, mat('#f4f4f0', { sh: 90, sp: '#bbb' }), { sz: 0.7 }); G.cyl(0, -25.6, 0, 1, 1.4, 2, 12, mat('#1a9a3a', { sh: 80 })); G.plane(0, -8, 2.98, 6, 9, M({ c: '#fff', map: K.tex('ch.soap', 64, 96, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a9a3a'; g.fillRect(0, 0, w, 16); A.text(g, 'WASHING', 32, 38, '700 11px ' + A.UIF, '#1a7a2a', 'center'); A.text(g, 'UP', 32, 52, '700 11px ' + A.UIF, '#1a7a2a', 'center'); A.text(g, 'LIQUID', 32, 66, '700 11px ' + A.UIF, '#1a7a2a', 'center'); A.text(g, 'original', 32, 84, 'italic 9px ' + A.UIF, '#555', 'center'); }) }), {}); G.shadow(0, 0, 0, 10, 8, 0.5); });
      soapBottle.position.set(SINK.x+37,WT,SINK.z+14);r.group.add(soapBottle);
      CK.spot(r, 'ch.soap', soapBottle, { label: 'Washing-up liquid (shop\'s own)', act: () => { if (!CK.has('washup', 'plug')) return CK.jack('Washing up', 'Hot water first. (Click the sink: the hot tap.)'); if (!filled()) return fill(); sinkClick(); } });
      const sponge = new T.Group();
      spongeBrush = grp(G => {
        const foam=M({c:'#f4c844',map:K.tex('ch.sponge',64,64,(g,w,h)=>{g.fillStyle='#f4c844';g.fillRect(0,0,w,h);const r=K.rnd(62);for(let i=0;i<220;i++){g.fillStyle=i%3?'#d6a736':'#ffe477';g.beginPath();g.ellipse(r()*w,r()*h,.5+r()*1.2,.5+r(),0,0,7);g.fill()}},{clamp:true}),sh:2,sp:'#111'});
        G.rbox(0,-1.6,0,7,2,4.5,.55,foam);
        G.rbox(0,-.3,0,7,.6,4.5,.15,mat('#356a41',{sh:2}));
      });
      sponge.add(spongeBrush);
      CK.thing('ch.sponge',{obj:sponge,kind:'washsponge',label:'Washing-up sponge',chore:'washup',holdD:40,home:{room:'kitchen',x:-51,y:WT,z:-2,ry:-12},useLabel:'Scrub the dish',use:()=>{
        if(H.here!=='kitchen'||Math.hypot(H.W.x-SINK.x,H.W.z-SINK.z)>125)return CK.jack('Washing up','Stand by the sink to use the sponge.');
        const i=inSink();if(i>=0&&CK.has('washup','w'+i))return CK.jack('Washing up','Clean! Put the sponge down, then lift the dish into the rack.');
        sinkClick();
      }});
      // the draining rack (white plastic-coated wire, a drip tray underneath)
      const rk = grp(G => {
        const wm = mat('#f2f2ee', { sh: 70, sp: '#999' });
        G.rbox(0, -0.6, 0, 50, 1.2, 34, 0.5, mat('#d8e4ec', { sh: 90, sp: '#fff' }));
        // A proper wire floor, with the plate support directly under their lower edge.
        for (const z of [-14, -10, -5, 1, 7, 12, 16]) G.cyl(0, -2.15, z, 0.25, 0.25, 48, 8, wm, { rz: 90 });
        for (const z of [-16, 16]) G.cyl(0, -7, z, 0.3, 0.3, 49, 8, wm, { rz: 90 });
        for (const x of [-24, 24]) for (const z of [-16, 16]) G.cyl(x, -4, z, 0.3, 0.3, 6, 8, wm);
        for (const x of [-22, -17, -12, -7]) for (const z of [-8, 10]) {
          G.cyl(x, -7.15, z, 0.3, 0.3, 10, 8, wm);
          G.ball(x, -12.15, z, 0.3, 0.3, 0.3, wm, 8);
        }
        G.shadow(0, 0, 0, 52, 36, 0.45, { sq: true });
      });
      rk.position.set(RACK.x, WT, RACK.z); r.group.add(rk);
      // the dirty things
      dishes = DISH.map(([type, mk], i) => CK.thing('ch.d.' + i, { obj: mk(), kind: 'wdish', label: DISHN[i], chore: 'washup', holdD: 45, home: { room: 'kitchen', x: PILE[i][0], y: PILE[i][1], z: PILE[i][2], ry: PILE[i][3] } }));
      dishes.forEach(t=>{t.factoryHome=Object.assign({},t.home)});
      if(!CK.has('washup','w6')&&!CK.has('washup','r6'))updateFactoryPose(dishes[6],[6,WT,-6,-30]);
      dishes.forEach((t, i) => { if (!t) return; t.dishI = i; t.canGrab = () => canGrabDish(i); const sp = H.SPOTS[t.id]; sp.use = true; sp.act = () => dishClick(i); sp.label = () => dishLabel(i); });
      CK.snap('ch.s.wsink', { room: 'kitchen', x: SINK.x, y: SINK.y - 6, z: SINK.z, r: 36, box: [38, 2, 28], accepts: (k, t) => k === 'wdish' && filled() && inSink() < 0 && !CK.has('washup', 'w' + t.dishI), pose: { x: SINK.x, y: LOW - 0.2, z: SINK.z, ry: 15 }, hint: 'Let go: in the washing-up water', onSnap: t => { CK.snd.splash(); CK.fx.burst(KR(), SINK.x, FULL, SINK.z, { n: 14, tex: 'bub', size: 2.4, life: 1.2, spd: 18, up: 30, grav: 40 }); W().inn = t.dishI; CK.save(); if (!W().tipShown) { W().tipShown = 1; CK.jack('Washing up', 'In the water. Pick up the sponge: F scrubs till it squeaks. You can also click the dish.', 4500); } } });
      const rs = CK.snap('ch.s.rack', { room: 'kitchen', x: RACK.x, y: WT - 10, z: RACK.z, r: 38, box: [50, 2, 34], accepts: (k, t) => { if (k !== 'wdish' || !CK.has('washup', 'w' + t.dishI) || CK.has('washup', 'r' + t.dishI)) return false; rs.pose = RPOSE[t.dishI]; return true; }, hint: 'Let go: in the draining rack', onSnap: t => { const v=W();(v.rackAt||(v.rackAt={}))[t.dishI]=Date.now();CK.save();setTimeout(()=>{CK.MODS.washup.sync()},12100);CK.snd.clink(); CK.lock(t.id); t.home = Object.assign({}, t.at); CK.keep(t.id); CK.step('washup', 'r' + t.dishI); } });
      // the sink: hot tap, washing-up liquid, scrubbing (whatever's needed next)
      sinkSpot = CK.pickBox(r, 'ch.sink', SINK.x, WT - 7, SINK.z, 34, 16, 26, 0, { label: () => sinkLabel(), act: () => sinkClick() });
      CK.guard('hs.sink', () => { sinkClick(); return true; });
      this.sync();
    },
    sync() {
      const v = W(), plugged = CK.has('washup', 'plug'), full = filled(), dn = CK.done('washup') && !H.anims.has('ch.drain');
      const lvl = full ? FULL : HALF, rr = tubR(lvl) - 0.3;
      if (water) { water.visible = plugged && !dn; water.position.y = lvl; water.scale.set(rr, rr * 0.74, 1); }
      if (suds) { suds.visible = full && !dn; suds.position.y = lvl; const s = 1 + Math.min(1.5, extraSuds * 0.35); suds.scale.set(1, s, 1); }
      dishes.forEach((t, i) => {
        if (!t) return; const m = t.obj.userData.dirt, sc = CK.has('washup', 'w' + i) ? 4 : (v.sc[i] | 0);
        if (m) { m.opacity = Math.max(0, 1 - sc / 4); m.visible = sc < 4; }
        if (CK.has('washup', 'r' + i)) {
          const pose=RPOSE[i];t.home=Object.assign({room:'kitchen'},pose);CK.lock(t.id);
          // Finished steps own the rack pose, including saves made with the old rack.
          const moved=t.at.room!=='kitchen'||['x','y','z','ry'].some(k=>Math.abs((t.at[k]||0)-(pose[k]||0))>.01);
          t.at=Object.assign({room:'kitchen'},pose);t.rx=pose.rx||0;t.rz=pose.rz||0;t.st='snap';t.snap='ch.s.rack';H.place(t);H.layerFor(t);if(moved)CK.keep(t.id);
        }
        else CK.lock(t.id, false);
        const wet=CK.has('washup','w'+i)&&(!CK.has('washup','r'+i)||v.rackAt?.[i]&&Date.now()-v.rackAt[i]<12000);
        t.obj.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material)){if(m===t.obj.userData.dirt||!m.specular)continue;const dry=m.userData.washDry||(m.userData.washDry={sh:m.shininess,sp:m.specular.clone()});m.shininess=wet?Math.max(110,dry.sh):dry.sh;m.specular.copy(dry.sp);if(wet)m.specular.lerp(new T.Color('#fff'),.45)}});
      });
      // a refresh with something in the water: back in the water
      if (v.inn >= 0 && dishes[v.inn] && inSink() < 0 && !CK.has('washup', 'r' + v.inn)) { const t = dishes[v.inn]; if (Math.abs(t.at.x - SINK.x) < 6 && Math.abs(t.at.z - SINK.z) < 6) { t.st = 'snap'; t.snap = 'ch.s.wsink'; } else v.inn = -1; }
      const inWater=inSink();if(inWater>=0){const t=dishes[inWater];if(Math.abs(t.at.y-(LOW-.2))>.1){t.at.y=LOW-.2;H.place(t);CK.keep(t.id)}}
      H.dirty();
    },
    reset() { extraSuds = 0; CK.S.v.wash={sc:{},inn:-1};dishes.forEach(t => { if (t) { t.rx = 0; t.rz = 0;t.home=Object.assign({},t.factoryHome);CK.home(t.id); } }); this.sync(); },
    take() { sinkClick(); return true; },
  });
  function canGrabDish(i) {
    if (CK.done('washup') || CK.has('washup', 'r' + i)) return false;
    const t = dishes[i];
    if (t.st === 'snap' && t.snap === 'ch.s.wsink' && !CK.has('washup', 'w' + i)) return false; // (scrub it first)
    return true;
  }
  function dishLabel(i) { const t = dishes[i]; if (t.st === 'snap' && t.snap === 'ch.s.wsink') return CK.has('washup', 'w' + i) ? 'Clean! Into the rack with it' : DISHN[i] + ' (scrub it!)'; return CK.has('washup', 'w' + i) ? DISHN[i].replace(/ \(.*/, '') + ' (clean)' : DISHN[i]; }
  function dishClick(i) { const t = dishes[i]; if (t.st === 'snap' && t.snap === 'ch.s.wsink') return sinkClick(); if (!canGrabDish(i)) return CK.jack('Washing up', 'That one\'s done. In the rack, drip drying. Leave it.'); if (!filled()) CK.jack('Washing up', 'Water first. Click the sink: hot tap on, then the washing-up liquid.', 3000); H.grab(t.id); }
  function sinkLabel() { if (CK.done('washup')) return 'The sink (sparkling)'; if (!CK.has('washup', 'plug')) return 'The sink (hot tap on!)'; if (!filled()) return 'The sink (washing-up liquid!)'; const i = inSink(); if (i >= 0) return CK.has('washup', 'w' + i) ? 'The sink (take it out: into the rack)' : 'The sink (scrub with the sponge!)'; return 'The sink (put something in)'; }
  function rise(from, to, ms, each, done) { const t0 = performance.now(); H.anims.set('ch.rise', now => { const k = Math.min(1, (now - t0) / ms), y = from + (to - from) * CK.ease(k), rr = tubR(y) - 0.3; water.position.y = y; water.scale.set(rr, rr * 0.74, 1); if (each) each(k, now, y); if (k < 1) return true; if (done) done(); return false; }); }
  function sinkClick() {
    if (CK.done('washup')) return CK.jack('The sink', 'Done. The water\'s gone grey and there\'s a lone pea floating in it. Lovely.');
    if (!CK.has('washup', 'plug')) return hotTap();
    if (!filled()) return fill();
    const i = inSink();
    if (i < 0) {
      extraSuds++; CK.snd.pop(); CK.fx.burst(KR(), SINK.x, FULL - 1, SINK.z, { n: 20, tex: 'bub', size: 2.6, life: 1.4, spd: 14, up: 24, grav: 20 }); CK.MODS.washup.sync();
      if (extraSuds >= 4) CK.secret('ch.rinse');
      return CK.jack('Washing up', extraSuds >= 4 ? 'BUBBLES! Bubbles everywhere! (Now actually wash something: the dirty stuff is on the cooker.)' : 'Swish swish. Now put something in: the dirty stuff is piled up on the cooker.', 3500);
    }
    if (CK.has('washup', 'w' + i)) { H.grab(dishes[i].id); return; }
    scrub(i);
  }
  let running = false;
  function hotTap() { // the hot tap: it runs cold for ages first, obviously
    if (running) return; running = true;
    CK.begin('washup');
    const r = KR(); CK.snd.pour(2.4); water.visible = true; let last = 0;
    rise(LOW, HALF, 2200, (k, now, y) => { if (now - last > 80) { last = now; CK.fx.stream(r, [SINK.x - 2, WT - 17, SINK.z - 4], [SINK.x - 2, y, SINK.z - 4], { col: '#e0f0ff' }); } }, () => { running = false; CK.step('washup', 'plug'); });
    CK.jack('Washing up', 'Hot tap on. (It runs cold for a whole minute first. Every time.) Now a squirt of washing-up liquid: click the sink again, or the bottle.', 4500);
  }
  function fill() {
    if (running) return; running = true;
    CK.begin('washup');
    const r = KR(), v = W(); CK.snd.squeak(); CK.snd.pour(1.6);
    suds.visible = true; suds.scale.set(0.3, 0.05, 0.3); let last = 0;
    rise(HALF, FULL, 1800, (k, now, y) => {
      suds.position.y = y; suds.scale.set(0.3 + 0.7 * k, 0.05 + 0.95 * k, 0.3 + 0.7 * k);
      if (now - last > 90) { last = now; if (k < 0.45) CK.fx.burst(r, soapBottle.position.x - 3, WT - 23, soapBottle.position.z, { n: 3, col: '#5ae86a', size: 1.2, life: 0.5, spd: 10, up: -5, grav: 600, to: [SINK.x + 4, y, SINK.z] }); CK.fx.burst(r, SINK.x + (Math.random() - 0.5) * 16, y - 1, SINK.z + (Math.random() - 0.5) * 10, { n: 3, tex: 'bub', size: 2.2, life: 1, spd: 8, up: 18, grav: 10 }); }
    }, () => { running = false; CK.step('washup', 'fill'); v.full = 1; CK.save(); CK.MODS.washup.sync(); });
    CK.jack('Washing up', 'A big squirt of washing-up liquid. BUBBLES. Now the dirty stuff off the cooker, one at a time, into the water.', 5000);
  }
  function scrub(i) {
    const v = W(), t = dishes[i], m = t.obj.userData.dirt;
    v.sc[i] = (v.sc[i] | 0) + 1; CK.save();
    CK.snd.scrub(); if (v.sc[i] >= 3) CK.snd.squeak();
    const k = v.sc[i];
    if(spongeBrush&&H.held()==='ch.sponge'){
      const start=performance.now();H.anims.set('ch.sponge',now=>{const k=Math.min(1,(now-start)/600),wave=Math.sin(k*Math.PI*4)*Math.sin(k*Math.PI);spongeBrush.position.set(wave*1.1,-Math.abs(wave)*.5,0);spongeBrush.rotation.z=wave*.12;if(k<1)return true;spongeBrush.position.set(0,0,0);spongeBrush.rotation.z=0;return false});
    }
    if (m) { m.opacity = Math.max(0, 1 - k / 4); }
    CK.fx.burst(KR(), t.obj.position.x + (Math.random() - 0.5) * 8, FULL - 1, t.obj.position.z + (Math.random() - 0.5) * 6, { n: 10, tex: 'bub', size: 2, life: 1, spd: 16, up: 26, grav: 30 });
    const r0 = t.obj.rotation.y; CK.tween(t.obj, { ry: r0 + 0.5 }, 160).then(() => CK.tween(t.obj, { ry: r0 }, 160));
    if (k >= 4) {
      if (m) m.visible = false;
      CK.fx.burst(KR(), t.obj.position.x, FULL - 2, t.obj.position.z, { n: 12, col: '#ffffff', size: 1.4, life: 0.7, spd: 30, up: 30, grav: 10 });
      CK.step('washup', 'w' + i);
      if (CK.count('washup') <= 4) CK.jack('Washing up', 'Squeaky clean! Lift it out (click it) and stand it in the draining rack to the left of the sink.', 4000);
    }
  }
  H.on('grab', id => { const t = dishes.find(x => x && x.id === id); if (!t) return; if (W().inn === t.dishI) { W().inn = -1; CK.save(); } if (CK.has('washup', 'w' + t.dishI)) drip(t); });
  function drip(t) { let n = 0; const iv = setInterval(() => { if (t.st !== 'held' || ++n > 12) return clearInterval(iv); const p = t.obj.position; CK.fx.burst(KR(), p.x, p.y + 1, p.z, { n: 1, col: '#c8e4ff', size: 0.9, life: 0.6, spd: 2, up: -10, grav: 600, fade: false }); }, 220); }
  CK.on('done', id => { if (id !== 'washup' || !water) return; const t0 = performance.now(), y0 = water.position.y; CK.snd.pour(1.6); H.anims.set('ch.drain', now => { const k = Math.min(1, (now - t0) / 1600); water.position.y = y0 + (LOW - y0) * k; suds.position.y = water.position.y; suds.scale.y = Math.max(0.05, 1 - k); if (k < 1) return true; CK.MODS.washup.sync(); return false; }); });

  // ================================================================ LAY THE TABLE
  const TY = GY - 76; // the table top
  // Clear of all four place settings and the seasonal carving pumpkin.
  const SAUCE = {room: 'kitchen', x: -87, y: TY, z: 165, ry: 0};
  // each place: its mat [x, z, w, d], the plate, the knife and fork [x, z, ry], the glass
  const PLACES = [
    // (each mat sits 3.5 cm in from the rounded table edge, not hanging over it)
    { mat: [-56, 144.5, 38, 22], p: [-62, 144.5], k: [-44, 144.5, 0], g: [-45, 159.5] },
    { mat: [-64, 195.5, 38, 22], p: [-58, 195.5], k: [-76, 195.5, 0], g: [-76, 180.5] },
    { mat: [-104.5, 178, 22, 38], p: [-104.5, 172], k: [-104.5, 190, 90], g: [-91.5, 189] },
    { mat: [-15.5, 150, 22, 36], p: [-15.5, 156], k: [-15.5, 139, 90], g: [-28.5, 140] },
  ];
  const placeOf = (P, k) => ({ x: P[k][0], z: P[k][1] });
  const tbl = { p: [], k: [], g: [], sauce: null }, tableHomes = {};
  CK.add({
    id: 'table', room: 'kitchen',
    build(r) {
      // the place mats (cork, with a hunting scene: every 1999 kitchen had these)
      // (cork-backed place mats with an old country picture on: a cottage, trees, a duck pond)
      const matTex = K.tex('ch.mat', 192, 112, (g, w, h) => {
        g.fillStyle = '#5a1414'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ecd8'; g.fillRect(5, 5, w - 10, h - 10);
        g.fillStyle = A.lin(g, 0, 10, 0, h - 10, [[0, '#a8c8e4'], [0.55, '#e8eed8'], [0.56, '#6a9a4a'], [1, '#3a6a2a']]); g.fillRect(10, 10, w - 20, h - 20);
        g.fillStyle = '#efe4c8'; g.fillRect(104, 44, 34, 20); g.fillStyle = '#7a3a1a'; g.beginPath(); g.moveTo(100, 45); g.lineTo(121, 30); g.lineTo(142, 45); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(117, 52, 7, 12); g.fillStyle = '#8ab8e0'; g.fillRect(108, 48, 6, 5); g.fillRect(128, 48, 6, 5);
        g.fillStyle = '#2a4a1a'; [[30, 50, 12], [48, 44, 10], [164, 52, 11]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); g.fillStyle = '#4a3020'; [[30, 58], [48, 52], [164, 60]].forEach(([x, y]) => g.fillRect(x - 2, y, 4, 10));
        g.fillStyle = '#6a9ac8'; g.beginPath(); g.ellipse(60, 84, 26, 7, 0, 0, 7); g.fill(); g.fillStyle = '#f4f4f4'; g.beginPath(); g.ellipse(56, 82, 4, 2.4, 0, 0, 7); g.fill();
        g.strokeStyle = '#c8a040'; g.lineWidth = 2; g.strokeRect(9, 9, w - 18, h - 18); A.grain(g, w, h, 600, 0.05, 3);
      });
      PLACES.forEach(P => { const [x, z, w, d] = P.mat, m = new T.Group(); m.position.set(x, TY, z); K.into(m).box(0, -0.35, 0, Math.max(w, d), 0.7, Math.min(w, d), { t: M({ c: '#fff', map: matTex, sh: 5, sp: '#141414' }), all: mat('#3a1a0a') }, { ry: w >= d ? 0 : 90 }); r.group.add(m); });
      const plateM = () => grp(G => { G.lathe(0, 0, 0, [[.001, -.6], [7.1, -.6], [10.6, -1.3], [12, -1.7], [12.05, -1.3], [10.65, -.8], [7.3, .05], [7, .45], [6.5, .45], [6.3, .1], [.001, .1]], 28, mat('#f6f4ee', { sh: 70, sp: '#999' })); G.lathe(0, 0, 0, [[10.4, -1.272], [10.8, -1.369]], 28, mat('#c8a040', { sh: 80 })); });
      const cutM = () => grp(G => { const st = mat('#d4d8de', { sh: 110, sp: '#fff' }); G.box(-1.6, -0.3, 0, 1.4, 0.4, 19, st); G.box(-1.6, -0.35, -7, 1.8, 0.5, 5, mat('#2a1a10')); G.box(1.8, -0.3, 2, 1.2, 0.4, 13, st); G.box(1.8, -0.35, -6, 1.6, 0.5, 6, mat('#2a1a10')); for (let i = 0; i < 4; i++) G.box(1.0 + i * 0.55, -0.3, 10, 0.3, 0.3, 3, st); G.shadow(0, 0, 0, 8, 22, 0.3, { sq: true }); });
      const glassM = () => grp(G => { G.cyl(0, -6, 0, 3.6, 3, 12, 18, M({ c: '#d8ecf4', o: 0.35, sh: 120, sp: '#fff', side: 2 }), { open: true }); G.disc(0, -0.4, 0, 3, M({ c: '#d8ecf4', o: 0.5, sh: 120 }), 16); G.shadow(0, 0, 0, 9, 9, 0.3); });
      for (let i = 0; i < 4; i++) {
        tbl.p[i] = CK.thing('ch.t.p' + i, { obj: plateM(), kind: 'tplate', label: 'Dinner plate', chore: 'table', holdD: 45, home: { room: 'kitchen', x: -201, y: WT - i * 1.8, z: -4, ry: i * 20 } });
        tbl.k[i] = CK.thing('ch.t.k' + i, { obj: cutM(), kind: 'tcut', label: 'Knife and fork', chore: 'table', holdD: 40, home: { room: 'kitchen', x: -186 + (i % 2) * 6, y: WT - Math.floor(i / 2) * 0.8, z: -2, ry: 0 } });
        tbl.g[i] = CK.thing('ch.t.g' + i, { obj: glassM(), kind: 'tglass', label: 'Glass', chore: 'table', holdD: 40, home: { room: 'kitchen', x: -170 + (i % 2) * 8, y: WT, z: -6 + Math.floor(i / 2) * 8, ry: 0 } });
        if(!CK.has('table','p'+i))updateFactoryPose(tbl.p[i],[-214,WT-i*1.8,-2,i*20]);
        if(!CK.has('table','k'+i))updateFactoryPose(tbl.k[i],[-190+(i%2)*6,WT-Math.floor(i/2)*.8,-2,-10+i*8]);
        if(!CK.has('table','g'+i))updateFactoryPose(tbl.g[i],[-172+(i%2)*8,WT,-6+Math.floor(i/2)*8,0]);
      }
      const ketchup = grp(G => { G.lathe(0, 0, 0, [[0.1, -19], [1.6, -18.6], [1.8, -16], [3.6, -12.5], [3.8, -3], [3.4, 0], [0.1, 0]], 18, M({ c: '#c8100a', sh: 90, sp: '#fff' })); G.cyl(0, -19.5, 0, 1.4, 1.6, 1.6, 12, mat('#f4f4f4')); G.cyl(0, -8, 0, 3.86, 3.86, 7, 18, M({ c: '#fff', map: K.tex('ch.ketchup', 128, 48, flip((g, w, h) => { g.fillStyle = '#f4f0e0'; g.fillRect(0, 0, w, h); A.text(g, 'TOMATO', 64, 22, '700 15px ' + A.FONT, '#c8100a', 'center'); A.text(g, 'KETCHUP', 64, 42, '700 15px ' + A.FONT, '#1a6a1a', 'center'); })) }), { open: true }); G.shadow(0, 0, 0, 10, 10, 0.4); });
      tbl.sauce = CK.thing('ch.t.sauce', { obj: ketchup, kind: 'sauce', label: 'Ketchup', chore: 'table', holdD: 40, home: { room: 'kitchen', x: -168, y: WT, z: -20, ry: 0 } });
      if(!CK.has('table','sauce'))updateFactoryPose(tbl.sauce,[-156,WT,4,0]);
      for (const t of [...tbl.p, ...tbl.k, ...tbl.g, tbl.sauce]) tableHomes[t.id] = Object.assign({}, t.home);
      // where they go
      PLACES.forEach((P, i) => {
        for (const [k, kind, n] of [['p', 'tplate', 'a plate'], ['k', 'tcut', 'the knife and fork'], ['g', 'tglass', 'a glass']]) {
          const q = placeOf(P, k), kr = k === 'k' ? P.k[2] : 0;
          CK.snap('ch.s.t' + k + i, { room: 'kitchen', x: q.x, y: TY - (k === 'g' ? 6 : 2), z: q.z, r: k === 'p' ? 22 : 16, ry: kr, box: k === 'p' ? [24, 1.5, 24] : k === 'k' ? [8, 1.5, 20] : [8, 1.5, 8], accepts: kk => kk === kind && !CK.has('table', k + i), pose: { x: q.x, y: TY - (k === 'g' ? 0 : 0.7), z: q.z, ry: kr }, hint: 'Let go: ' + n + ' for ' + ['Dad', 'Mom', CK.cast('{sister}'), 'me'][i], onSnap: t => { CK.snd.clink(); CK.lock(t.id); t.home = Object.assign({}, t.at); CK.keep(t.id); CK.step('table', k + i); } });
        }
      });
      CK.snap('ch.s.sauce', { room: 'kitchen', x: SAUCE.x, y: TY - 8, z: SAUCE.z, r: 20, box: [10, 1.5, 10], accepts: k => k === 'sauce', pose: Object.assign({}, SAUCE), hint: 'Let go: ketchup on the table', onSnap: t => { CK.snd.thud(); CK.lock(t.id); t.home = Object.assign({}, t.at); CK.keep(t.id); CK.step('table', 'sauce'); CK.secret('ch.ketchup'); CK.jack('Ketchup', 'Ketchup in the middle. Dad will put it on EVERYTHING. Including the trifle, probably.', 3500); } });
      this.sync();
    },
    sync() {
      const lockIf = (t, s) => { if (!t) return; if (CK.has('table', s)) CK.lock(t.id); };
      ['p', 'k', 'g'].forEach(k => tbl[k].forEach((t, i) => {
        if (!t || !CK.has('table', k + i) || !['rest', 'snap'].includes(t.st) || !isPlaced(t)) return;
        const s = H.SNAPS['ch.s.t' + k + i];
        const moved = ['x', 'y', 'z', 'ry'].some(key => Math.abs((t.at[key] || 0) - (s.pose[key] || 0)) > .01);
        Object.assign(t.at, s.pose); t.rx = t.rz = 0; t.st = 'snap'; t.snap = s.id;
        t.home = Object.assign({}, t.at); CK.lock(t.id); H.place(t); H.layerFor(t); if (moved) CK.keep(t.id);
      }));
      const t = tbl.sauce;
      // Old completed jobs restore as rest objects. Move only the former fixed
      // table position, leaving loose bottles and every progress flag intact.
      if (t && ['rest', 'snap'].includes(t.st) && t.at.room === 'kitchen' && !t.at.hide &&
          (t.snap === 'ch.s.sauce' || CK.has('table', 'sauce') && Math.abs(t.at.y - TY) < .11 &&
            (Math.abs(t.at.x + 54) < .11 && Math.abs(t.at.z - 172) < .11 || Math.abs(t.at.x - SAUCE.x) < .11 && Math.abs(t.at.z - SAUCE.z) < .11))) {
        const moved = ['x', 'y', 'z', 'ry'].some(k => Math.abs((t.at[k] || 0) - SAUCE[k]) > .01);
        if (moved) { Object.assign(t.at, SAUCE); H.place(t); H.layerFor(t); CK.keep(t.id); }
        t.home = Object.assign({}, SAUCE); t.st = 'snap'; t.snap = 'ch.s.sauce'; H.place(t);
      }
      lockIf(t, 'sauce');
    },
    reset() { for (const t of [...tbl.p, ...tbl.k, ...tbl.g, tbl.sauce]) if (t) { t.home = Object.assign({}, tableHomes[t.id]); CK.lock(t.id, false); CK.home(t.id); } },
  });
  function isPlaced(t) { return Math.abs(t.at.y - TY) < 1.5 && t.at.x > -125 && t.at.x < 5 && t.at.z > 125 && t.at.z < 215; }
  CK.whenBuilt('kitchen', () => CK.guard('hs.ktable', () => { if (CK.done('table')) return false; CK.jack('The kitchen table', CK.started('table') ? 'Plate in the middle of each mat, knife and fork by it, a glass. Ketchup in the middle.' : 'Tea\'s at six. The plates, knives and forks and glasses are on the worktop by the kettle. Four of everything.', 4000); return true; }));

  // ================================================================ PUT THE SHOPPING AWAY
  const BAGS = [{ x: 46, z: 74, ry: 20 }, { x: 84, z: 52, ry: -30 }];
  const SHOP = [ // id, label, where, model
    ['milk', 'Milk (four pints)', 'fridge'], ['eggs', 'Eggs (half a dozen)', 'fridge'], ['cheese', 'Cheddar (mature)', 'fridge'],
    ['peas', 'Frozen peas', 'freezer'], ['fish', 'Fish fingers', 'freezer'],
    ['beans', 'Baked beans', 'cupboard'], ['soup', 'Tomato soup', 'cupboard'], ['flakes', 'Cornflakes', 'cupboard'],
    ['bread', 'Sliced white', 'breadbin'],
  ];
  const WHERE = { fridge: { x: -247.5, y: GY - 62, z: 22, r: 40, n: 'in the fridge (bottom door)' }, freezer: { x: -247.5, y: GY - 140, z: 22, r: 32, n: 'in the freezer (top door)' }, cupboard: { x: -187, y: GC() + 80, z: -12, r: 32, n: 'in the cupboard' }, breadbin: { x: 40, y: WT - 12, z: -32, r: 30, n: 'in the bread bin' } };
  function GC() { return 95; }
  const SHOPPRINT = {
    milk: ['pack.milk', ['SEMI-SKIMMED', '4 PINTS'], '#2a9a3a'],
    eggs: ['pack.eggs', ['FREE RANGE', '6 LARGE EGGS'], '#6a4a1a'],
    cheese: ['pack.cheese', ['MATURE'], '#7a1a3a'],
    peas: ['pack.peas', ['GARDEN PEAS'], '#1a6a2a'],
    fish: ['pack.fish', ["OLD SALTY'S", 'FISH FINGERS'], '#1a3a8a'],
    beans: ['pack.beans', ['BAKED BEANS'], '#c8401a'],
    soup: ['pack.soup', ['CREAM OF', 'TOMATO SOUP'], '#c8101a'],
    flakes: ['pack.cereal', ['SUNNY', 'FLAKES', 'with real sunshine*'], '#c8401a'],
    bread: ['pack.bread', ['MEDIUM SLICED', 'WHITE'], '#1a3a8a'],
  };
  function shopPrint(textureKey, key, w, h, paint, round) {
    const [art, words, ink] = SHOPPRINT[key];
    const draw = (g, ww, hh) => {
      g.fillStyle = '#f4f0e0'; g.fillRect(0, 0, ww, hh);
      const tall = hh > ww, box = tall ? [6, hh * .22, ww - 12, hh * .51] : [4, 4, ww * .4, hh - 8];
      if (!window.PrintArt?.paint(g, art, ...box, 'contain')) { paint(g, ww, hh); return; }
      const x = tall ? ww / 2 : ww * .72, max = tall ? ww - 12 : ww * .5;
      words.forEach((word, i) => {
        let size = tall ? (i === 2 ? 9 : 30) : Math.min(16, hh * .25);
        do { g.font = (tall && i < 2 ? '' : '700 ') + size + 'px ' + (i === 2 ? A.UIF : A.FONT); if (g.measureText(word).width <= max) break; size -= .5; } while (size > 5);
        const y = tall ? [hh * .16, hh * .84, hh * .95][i] : hh * (.5 + (i - (words.length - 1) / 2) * .34) + size * .34;
        A.text(g, word, x, y, g.font, ink, 'center');
      });
    };
    // Keep the original UV orientation and fallback; only increase print resolution.
    return A.printed(textureKey, w * 2, h * 2, (g, W, HH) => {
      g.save(); g.scale(W / w, HH / h); (round ? flip(draw) : draw)(g, w, h); g.restore();
    }, { clamp: true });
  }
  const label = (key, w, h, paint, round) => M({ c: '#fff', map: shopPrint('ch.shop.' + key, key, w, h, paint, round) });
  const SHOPM = {
    milk: () => grp(G => { G.lathe(0, 0, 0, [[0.1, -24], [1.8, -24], [1.9, -21.5], [3.4, -19], [5.2, -15], [5.4, -2], [5, 0], [0.1, 0]], 18, M({ c: '#f8f8f4', sh: 60, sp: '#888' })); G.cyl(0, -24.6, 0, 1.9, 1.9, 1.4, 12, mat('#2a9a3a', { sh: 60 })); G.cyl(0, -9, 0, 5.45, 5.45, 8, 18, label('milk', 128, 48, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a9a3a'; g.fillRect(0, 0, w, 12); A.text(g, 'SEMI-SKIMMED', 64, 30, '700 12px ' + A.UIF, '#2a9a3a', 'center'); A.text(g, '4 PINTS', 64, 44, '700 11px ' + A.UIF, '#333', 'center'); }, 1), { open: true }); G.shadow(0, 0, 0, 13, 13, 0.5); }),
    eggs: () => grp(G => { G.rbox(0, -3.2, 0, 15, 6.4, 10, 1.4, M({ c: '#fff', map: shopPrint('ch.eggs', 'eggs', 128, 96, (g, w, h) => { g.fillStyle = '#b8b0a0'; g.fillRect(0, 0, w, h); A.grain(g, w, h, 800, 0.1, 5); g.fillStyle = '#f4e8c0'; g.fillRect(16, 26, 96, 40); A.text(g, 'FREE RANGE', 64, 44, '700 12px ' + A.UIF, '#6a4a1a', 'center'); A.text(g, '6 LARGE EGGS', 64, 60, '700 11px ' + A.UIF, '#6a4a1a', 'center'); }, true) })); G.shadow(0, 0, 0, 18, 13, 0.5, { sq: true }); }),
    cheese: () => grp(G => { G.box(0, -3, 0, 11, 6, 7, { t: label('cheese', 128, 80, (g, w, h) => { g.fillStyle = '#f0c040'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1a3a'; g.fillRect(0, 22, w, 36); A.text(g, 'MATURE', 64, 46, '700 16px ' + A.FONT, '#fff', 'center'); }), all: mat('#f0c040', { sh: 50 }) }); G.shadow(0, 0, 0, 13, 9, 0.5, { sq: true }); }),
    peas: () => grp(G => { G.ball(0, -3, 0, 9, 3, 12, label('peas', 128, 128, (g, w, h) => { g.fillStyle = '#1a6a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#7ad04a'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc((i * 37) % 128, (i * 61) % 128, 7, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(14, 46, 100, 36); A.text(g, 'GARDEN PEAS', 64, 70, '700 14px ' + A.FONT, '#1a6a2a', 'center'); }, 1), 16); G.box(0, -1.8, 12, 16, 0.6, 1.6, mat('#1a6a2a')); G.shadow(0, 0, 0, 20, 26, 0.45); }),
    fish: () => grp(G => { G.box(0, -2.5, 0, 20, 5, 12, { t: label('fish', 192, 128, (g, w, h) => { g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff9a2a'; g.fillRect(0, 84, w, 44); A.text(g, "OLD SALTY'S", 96, 36, '24px ' + A.FONT, '#fff', 'center'); A.text(g, 'FISH FINGERS', 96, 64, '700 18px ' + A.UIF, '#ffd400', 'center'); for (let i = 0; i < 4; i++) { g.fillStyle = '#e8a040'; g.fillRect(16 + i * 42, 94, 34, 22); } }), all: mat('#1a3a8a') }); G.shadow(0, 0, 0, 23, 15, 0.5, { sq: true }); }),
    beans: () => grp(G => { G.cyl(0, -5.5, 0, 3.8, 3.8, 11, 20, { s: label('beans', 128, 64, (g, w, h) => { g.fillStyle = '#1aa8b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f0e0'; g.fillRect(0, 20, w, 26); A.text(g, 'BAKED BEANS', 64, 38, '700 13px ' + A.FONT, '#c8401a', 'center'); g.fillStyle = '#e86a20'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(8 + i * 14, 54, 5, 3, 0.3, 0, 7); g.fill(); } }, 1), t: mat('#c8c8cc', { sh: 90 }), u: mat('#c8c8cc') }); G.shadow(0, 0, 0, 10, 10, 0.5); }),
    soup: () => grp(G => { G.cyl(0, -5.5, 0, 3.8, 3.8, 11, 20, { s: label('soup', 128, 64, (g, w, h) => { g.fillStyle = '#c8101a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f0e0'; g.fillRect(0, 26, w, 18); A.text(g, 'TOMATO SOUP', 64, 40, '700 12px ' + A.FONT, '#c8101a', 'center'); A.text(g, 'CREAM OF', 64, 18, '700 10px ' + A.UIF, '#fff', 'center'); }, 1), t: mat('#c8c8cc', { sh: 90 }), u: mat('#c8c8cc') }); G.shadow(0, 0, 0, 10, 10, 0.5); }),
    flakes: () => grp(G => { G.box(0, -15, 0, 19, 30, 7, { f: label('flakes', 128, 192, (g, w, h) => { g.fillStyle = '#f4f0e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffb81a'; g.beginPath(); g.arc(64, 90, 40, 0, 7); g.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(64 + Math.cos(a) * 46 - 3, 90 + Math.sin(a) * 46 - 3, 6, 6); } A.text(g, 'SUNNY', 64, 30, '30px ' + A.FONT, '#c8401a', 'center'); A.text(g, 'FLAKES', 64, 160, '30px ' + A.FONT, '#c8401a', 'center'); A.text(g, 'with real sunshine*', 64, 182, '9px ' + A.UIF, '#555', 'center'); }), all: mat('#ffb81a') }); G.shadow(0, 0, 0, 22, 10, 0.5, { sq: true }); }),
    bread: () => grp(G => { G.rbox(0, -6, 0, 24, 12, 11, 4, label('bread', 128, 64, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8101a'; g.fillRect(0, 0, w, 14); g.fillStyle = '#ffd400'; g.fillRect(0, 14, w, 6); A.text(g, 'MEDIUM SLICED', 64, 40, '700 12px ' + A.UIF, '#d8101a', 'center'); A.text(g, 'WHITE', 64, 56, '700 12px ' + A.FONT, '#1a3a8a', 'center'); }, 1)); G.cyl(13, -6, 0, 1.2, 0.6, 3, 8, mat('#d8101a'), { rz: 90 }); G.shadow(0, 0, 0, 28, 14, 0.5, { sq: true }); }),
  };
  let bagsG = null;
  const SPREAD = [[30, 92, 20], [56, 96, -30], [62, 70, 60], [24, 62, 10], [70, 30, 40], [100, 64, -60], [96, 38, 10], [40, 44, 80], [110, 46, 0]];
  CK.add({
    id: 'shopping', room: 'kitchen',
    build(r) {
      bagsG = new T.Group(); r.group.add(bagsG);
      const bagTex = K.tex('ch.carrier', 256, 256, flip((g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a5ad0'; for (let y = 0; y < h; y += 34) g.fillRect(0, y, w, 6); g.fillStyle = '#fff'; g.fillRect(60, 90, 136, 70); g.strokeStyle = '#d0101a'; g.lineWidth = 4; g.strokeRect(60, 90, 136, 70); A.text(g, 'SHOPWISE', 128, 132, '30px ' + A.FONT, '#d0101a', 'center'); A.text(g, 'your friendly grocer', 128, 152, '11px ' + A.UIF, '#1a5ad0', 'center'); }));
      BAGS.forEach((B, i) => {
        const bg = grp(G => { const bm = M({ c: '#fff', map: bagTex, o: 0.94, tr: true, sh: 50, sp: '#888', side: 2 }); const geo = new T.CylinderGeometry(13, 15, 30, 18, 6, true), p = geo.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) * (1 + Math.sin(k * 1.7) * 0.06) * (y > 8 ? 0.85 : 1)); p.setZ(k, p.getZ(k) * 0.62); } geo.computeVertexNormals(); G.geo(geo, 0, -15, 0, bm); [-6, 6].forEach(x => G.geo(new T.TorusGeometry(4.5, 0.6, 6, 14, Math.PI), x, -30, 0, bm, { rz: 180 })); G.shadow(0, 0, 0, 34, 24, 0.5); });
        bg.position.set(B.x, GY, B.z); bg.rotation.y = B.ry * D2R; bagsG.add(bg);
      });
      CK.spot(r, 'ch.bags', bagsG, { label: () => CK.has('shopping', 'bags') ? 'Carrier bags (folded)' : 'Carrier bags (the shopping!)', act: () => bagsClick() });
      this.items = SHOP.map(([id, n, where], i) => CK.thing('ch.sh.' + id, { obj: SHOPM[id](), kind: 'shop.' + where, label: n, chore: 'shopping', holdD: 45, home: { room: 'kitchen', x: SPREAD[i][0], y: GY, z: SPREAD[i][1], ry: SPREAD[i][2] } }));
      for (const w in WHERE) {
        const Wd = WHERE[w];
        CK.snap('ch.s.' + w, { room: 'kitchen', x: Wd.x, y: Wd.y, z: Wd.z, r: Wd.r, box: [30, 2, 14], accepts: k => k === 'shop.' + w, hide: true, hint: 'Let go: ' + Wd.n, onSnap: t => { if (w === 'fridge' || w === 'freezer') { CK.snd.thud(); setTimeout(() => H.sfx.tone(90, 0.2, 'sine', 0.06), 160); CK.fx.burst(KR(), Wd.x, Wd.y, Wd.z, { n: 8, col: w === 'freezer' ? '#d8f0ff' : '#f0f8ff', size: 2.4, life: 0.9, spd: 14, up: 4, grav: -10, op: 0.6 }); } else CK.snd.thud(); const i = SHOP.findIndex(x => 'ch.sh.' + x[0] === t.id); t.home = Object.assign({}, t.at, { hide: true }); CK.lock(t.id); CK.keep(t.id); CK.step('shopping', 'i' + i); if (CK.count('shopping') === 9) CK.jack('The shopping', 'All away. Now fold up the carrier bags (click them) and put them in the bag of bags. Every house has a bag of bags.', 4500); } });
      }
      this.sync();
    },
    sync() {
      (this.items || []).forEach((t, i) => { if (!t) return; if (CK.has('shopping', 'i' + i)) { t.home = Object.assign({}, t.home, { hide: true }); CK.lock(t.id); if (!t.at.hide && t.st !== 'held') CK.home(t.id, { hide: true }); } else CK.lock(t.id, false); });
      if (bagsG) { const f = CK.has('shopping', 'bags'); bagsG.visible = !f; }
      H.dirty();
    },
    reset() { (this.items || []).forEach(t => { if (t) { t.home = Object.assign({}, t.home, { hide: false }); CK.lock(t.id, false); CK.home(t.id, { hide: false }); } }); this.sync(); },
  });
  function bagsClick() {
    if (CK.has('shopping', 'bags')) return;
    const left = SHOP.filter((x, i) => !CK.has('shopping', 'i' + i)).length;
    CK.begin('shopping');
    if (left) return CK.jack('The shopping', `Still ${left} thing${left > 1 ? 's' : ''} to put away. Fridge, freezer, cupboard, bread bin. (Look at the labels.)`, 3500);
    CK.snd.rustle();
    CK.tween(bagsG, { s: 0.15 }, 500).then(() => { bagsG.visible = false; bagsG.scale.set(1, 1, 1); CK.step('shopping', 'bags'); });
  }

  // ================================================================ Mom's list, on the freezer door (under a magnet shaped like a strawberry)
  CK.add({ id: '_list.kitchen', room: 'kitchen', build(r) { CK.paper(r, -257, GY - 140, 16.6, 0, { id: 'ch.list.kitchen', w: 22, magnet: '#e02a3a' }); } });
})();

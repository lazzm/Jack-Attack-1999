/* ch-out: Mom's jobs OUTSIDE (js/ch-core.js is the engine; the back garden and the front are js/hs-house.js).
 *   bins   the kitchen pedal bin: pull the bag out and tie it (click the bin), carry it out the back door to the wheelie bin,
 *          then a new bag in the kitchen bin (click it again).
 *   car    Dad's car on the drive: a sponge out of the bucket (click the bucket), scrub every splodge of mud (click each one,
 *          three goes), then chuck the bucket over it to rinse. Somebody has written CLEAN ME in the dirt on the boot.
 *   lawn   the front lawn: the orange hover mower lives by the front door. Plug it into the outside socket and go up and
 *          down till every strip of the lawn is mown (proper stripes!), mind the gnome, then put it back.
 *   sweep  the broom leans by the front door: sweep up every pile of leaves on the drive, then tip them in the garden sack.
 * Outside: the garden x -300..215, z -560..-56; the front x -340..470, z 700..1120 (the drive x 124..282 beside Dad's car,
 * which is x 285..455, z 700..1100; the front lawn x -340..124). The ground is y 353. */
(function () {
  'use strict';
  const CK = window.ChoreKit; if (!CK || CK.MODS.car) return;
  const { H, T, K, A, M, D2R } = CK;
  const GY = 353;
  const mat = (c, o) => M(Object.assign({ c, sh: 12, sp: '#222' }, o || {}));
  const grp = fn => { const g = new T.Group(); fn(K.into(g), g); return g; };
  const R = id => H.ROOMS[id];
  const quiet = () => { try { return !!(window.HouseLife && HouseLife.quiet && HouseLife.quiet()); } catch (e) { return false; } };
  const flip = paint => (g, w, h) => { g.save(); g.translate(0, h); g.scale(1, -1); paint(g, w, h); g.restore(); };

  // ================================================================ TAKE THE BINS OUT (the kitchen bin -> the wheelie bin)
  let kbag = null;
  const KBIN = { x: 170, z: 20 }, KBAG = { x: 142, z: 50 };
  CK.add({
    id: 'bins', room: 'kitchen',
    build(r) {
      const bag = grp(G => { const wm = M({ c: '#f4f4f0', o: 0.92, tr: true, sh: 80, sp: '#999', side: 2 }); G.lathe(0, 0, 0, [[0.5, -46], [2.4, -43.5], [1.6, -41], [7, -36], [13, -27], [14, -14], [12.5, -4], [8, -0.6], [0.1, -0.2]], 20, wm); G.ball(-2.6, -46.5, 0, 2.6, 1.3, 1.6, wm, 8, { rz: 30 }); G.ball(2.6, -46.5, 0, 2.6, 1.3, 1.6, wm, 8, { rz: -30 }); G.ball(-4, -20, 9, 4, 3, 2, M({ c: '#d8a040', o: 0.8, tr: true }), 8); G.ball(5, -14, 10, 3, 2.4, 2, M({ c: '#8a3a2a', o: 0.7, tr: true }), 8); G.shadow(0, 0, 0, 30, 30, 0.5); });
      kbag = CK.thing('ch.kbag', { obj: bag, kind: 'kbag', label: 'Kitchen bin bag (tied up)', chore: 'bins', holdD: 70, home: { room: 'kitchen', x: KBAG.x, y: GY, z: KBAG.z, ry: 20, hide: true } });
      CK.guard('hs.bin', () => binClick());
      this.sync();
    },
    also: {
      garden: () => CK.snap('ch.s.wheelie', { room: 'garden', x: 150, y: GY - 118, z: -110, r: 46, box: [50, 2, 60], accepts: k => k === 'kbag', hide: true, hint: 'Let go: in the wheelie bin', onSnap: t => {
        CK.snd.thud(); setTimeout(() => H.sfx.tone(70, 0.25, 'sine', 0.08), 120); t.home = Object.assign({}, t.at, { hide: true }); CK.lock(t.id); CK.keep(t.id);
        CK.step('bins', 'out'); CK.jack('The wheelie bin', 'THUNK. In it goes. It smells like a fox has been in there. A fox HAS been in there. Now a new bag in the kitchen bin.', 4500);
      } }),
    },
    sync() {
      if (!kbag) return; const tied = CK.has('bins', 'tie'), out = CK.has('bins', 'out');
      if (!tied || out) { kbag.home = Object.assign({}, kbag.home, { hide: true }); if (!kbag.at.hide && kbag.st !== 'held') CK.home('ch.kbag', { hide: true }); CK.lock('ch.kbag'); }
      else { kbag.home = { room: 'kitchen', x: KBAG.x, y: GY, z: KBAG.z, ry: 20 }; CK.lock('ch.kbag', false); if (kbag.at.hide && kbag.st !== 'held') CK.home('ch.kbag'); }
    },
    reset() { CK.home('ch.kbag', { hide: true }); this.sync(); },
    take() { binClick(); return true; },
  });
  function binClick() {
    if (CK.done('bins')) return false; // (the house's own words about its bin)
    const kb = H.SPOTS['hs.bin'] && H.SPOTS['hs.bin'].obj;
    const bounce = () => { if (!kb) return; kb.scale.set(1, 0.95, 1); H.dirty(); setTimeout(() => { kb.scale.set(1, 1, 1); H.dirty(); }, 130); };
    if (!CK.has('bins', 'tie')) {
      CK.begin('bins'); CK.snd.bag(); bounce();
      setTimeout(() => { CK.step('bins', 'tie'); CK.MODS.bins.sync(); kbag.obj.scale.set(1, 0.4, 1); CK.tween(kbag.obj, { s: 1 }, 1).then(() => {}); kbag.obj.scale.set(1, 1, 1); CK.secret('ch.knot'); }, 350);
      CK.jack('Kitchen bin', 'Foot on the pedal, lid up, heave the bag out and tie it. It\'s heavy. It\'s dripping. Out the back door to the wheelie bin with it.', 5000);
      return true;
    }
    if (!CK.has('bins', 'out')) { CK.jack('Kitchen bin', 'The full bag\'s on the floor by the bin. It goes out the BACK door, into the wheelie bin by the fence.', 4000); return true; }
    if (!CK.has('bins', 'liner')) {
      CK.snd.rustle(); bounce(); setTimeout(CK.snd.rustle, 250);
      setTimeout(() => CK.step('bins', 'liner'), 400);
      CK.jack('Kitchen bin', 'A new bag off the roll under the sink. Flap it open, in it goes, fold it over the rim. Job done.', 4000);
      return true;
    }
    return false;
  }

  // ================================================================ WASH DAD'S CAR (on the drive, beside the car)
  const BUCKET = { x: 248, z: 1000 };
  const MUD = [ // Car-local coordinates: keep chore IDs stable when the model moves/scales.
    [-85.15,-48,-155,'s'],[-85.15,-55,-95,'s'],[-85.15,-46,-35,'s'],[-85.15,-58,25,'s'],[-85.15,-48,85,'s'],[-85.15,-54,155,'s'],
    [-32,-75.15,170,'t'],[32,-75.15,170,'t'],[-36,-75.15,-178,'t'],[30,-133.65,-20,'t'],
  ];
  function carPoint(x,y,z) {const f=R('drive').carFrame; return {x:f.x+x*f.s,y:f.y+y*f.s,z:f.z+z*f.s};}
  let mud = [], sponge = null, bucket = null, carTool = null;
  const CV = () => (CK.S.v.car = CK.S.v.car || { sc: {} });
  const mudTex = (i, pigeon) => K.tex('ch.mud' + i, 128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = K.rnd(40 + i);
    if (pigeon) { g.fillStyle = 'rgba(250,250,245,.95)'; g.beginPath(); g.ellipse(64, 64, 24, 18, 0.3, 0, 7); g.fill(); g.fillStyle = 'rgba(200,200,190,.9)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(64 + Math.cos(k) * 30, 64 + Math.sin(k * 1.3) * 26, 4 + r() * 5, 0, 7); g.fill(); } g.fillStyle = 'rgba(60,60,40,.7)'; g.beginPath(); g.arc(60, 60, 6, 0, 7); g.fill(); return; }
    for (let k = 0; k < 14; k++) { const x = 30 + r() * 68, y = 30 + r() * 68, rr = 8 + r() * 22, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(150,118,74,.97)'); gr.addColorStop(0.6, 'rgba(165,132,88,.75)'); gr.addColorStop(1, 'rgba(165,132,88,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); }
    for (let k = 0; k < 30; k++) { g.fillStyle = k % 3 ? 'rgba(120,92,56,.95)' : 'rgba(186,156,110,.95)'; g.beginPath(); g.arc(20 + r() * 88, 20 + r() * 88, 1 + r() * 3, 0, 7); g.fill(); }
  }, { clamp: true });
  CK.add({
    id: 'car', room: 'drive',
    build(r) {
      const scale = r.carFrame.s;
      MUD.forEach(([lx, ly, lz, f], i) => {
        const {x,y,z}=carPoint(lx,ly,lz);
        const m = M({ c: '#fff', map: mudTex(i, i === 9), tr: true, dw: false, sh: 10 }).clone();
        const pl = new T.Mesh(new T.PlaneGeometry(i === 9 ? 18 : 30, i === 9 ? 18 : 24), m); pl.renderOrder = 3;
        pl.position.set(x, y, z); pl.scale.setScalar(scale); if (f === 's') pl.rotation.y = -Math.PI / 2; else pl.rotation.x = Math.PI / 2;
        r.group.add(pl);
        const pk = new T.Mesh(new T.BoxGeometry(f === 's' ? 3 : 32, f === 's' ? 26 : 3, f === 's' ? 32 : 26), new T.MeshBasicMaterial({ visible: false })); pk.position.set(f === 's' ? x - .5 : x, f === 's' ? y : y - .5, z); pk.scale.setScalar(scale); r.group.add(pk);
        H.spot('ch.mud' + i, { obj: pk, room: 'drive', range: 260, label: i === 9 ? 'Pigeon business (on the roof)' : 'Mud', act: () => scrubMud(i) });
        mud.push({ pl, m, pk });
      });
      // CLEAN ME, in the dirt on the boot
      const cm = new T.Mesh(new T.PlaneGeometry(60, 26), M({ c: '#fff', map: K.tex('ch.cleanme', 256, 112, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(120,96,60,.55)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-out'; g.font = '700 46px "Comic Sans MS",cursive'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText('CLEAN ME', 128, 72); g.font = '20px "Comic Sans MS",cursive'; g.fillText('(also, Dave woz ere)', 128, 100); g.globalCompositeOperation = 'source-over'; }, { clamp: true }), tr: true, dw: false }).clone());
      const boot=carPoint(20,-75.2,-178); cm.rotation.x = Math.PI / 2; cm.position.set(boot.x,boot.y,boot.z); cm.scale.setScalar(scale); cm.renderOrder = 3; r.group.add(cm); this.cleanme = cm;
      // the bucket of soapy water, the sponge in it
      bucket = grp(G => { G.lathe(0, 0, 0, [[12.4, -28], [13, -27.4], [10.2, 0], [0.1, 0]], 22, mat('#e8c020', { sh: 50, sp: '#666', side: 2 })); G.disc(0, -23, 0, 11.6, M({ c: '#e8eef0', sh: 90, sp: '#fff' })); for (let i = 0; i < 12; i++) G.ball(Math.cos(i * 0.6) * (4 + (i % 4) * 2), -23.5, Math.sin(i * 0.6) * (4 + (i % 4) * 2), 2.4, 1.4, 2.4, M({ c: '#fff', o: 0.9, tr: true }), 8); G.geo(new T.TorusGeometry(12.6, 0.4, 5, 20, Math.PI), 0, -28, 0, mat('#888', { sh: 80 }), { rz: 180, rx: 90 }); G.shadow(0, 0, 0, 32, 32, 0.6); });
      bucket.position.set(BUCKET.x, GY, BUCKET.z); r.group.add(bucket);
      sponge = grp(G => { G.rbox(0, -3, 0, 14, 6, 9, 2.2, mat('#ffd23a', { sh: 6 })); G.rbox(0, -6.2, 0, 13.6, 1.4, 8.6, 0.6, mat('#2a8a3a', { sh: 20 })); });
      const sIn = sponge; sIn.position.set(BUCKET.x + 3, GY - 25, BUCKET.z - 2); sIn.rotation.z = 0.3; r.group.add(sIn);
      CK.spot(r, 'ch.bucket', bucket, { label: () => carTool ? (mud.every((x, i) => CK.has('car', 'm' + i)) ? 'The bucket (chuck it over the car!)' : 'The bucket (dunk the sponge)') : 'Bucket of soapy water (and a sponge)', act: () => bucketClick() });
      this.sync();
    },
    sync() {
      const v = CV();
      mud.forEach((p, i) => { const sc = CK.has('car', 'm' + i) ? 3 : (v.sc[i] | 0); p.m.opacity = Math.max(0, 1 - sc / 3); p.pl.visible = sc < 3; const s = H.SPOTS['ch.mud' + i]; if (s) { s.off = sc >= 3; p.pk.visible = sc < 3; } });
      if (this.cleanme) this.cleanme.visible = !CK.has('car', 'rinse') && !CK.done('car');
      H.dirty();
    },
    reset() { CV().sc = {}; this.sync(); },
  });
  function takeSponge() {
    if (carTool) return;
    CK.begin('car'); CK.snd.splash();
    carTool = { id: 'sponge', name: 'The sponge (dripping)', obj: sponge, hand: true, hint: 'Click the mud on Dad\'s car to scrub it.', drop: () => { carTool = null; sponge.position.set(BUCKET.x + 3, GY - 25, BUCKET.z - 2); sponge.rotation.set(0, 0, 0.3); const rr = R('drive'); if (rr && sponge.parent !== rr.group) rr.group.add(sponge); } };
    CK.tool.take(carTool);
    if (!CK.has('car', 'bucket')) CK.step('car', 'bucket');
  }
  function bucketClick() {
    if (CK.done('car')) return CK.jack('The bucket', 'Empty. And so is the car of mud. Gleaming.');
    if (mud.every((x, i) => CK.has('car', 'm' + i))) return rinse();
    if (!carTool) { takeSponge(); return CK.jack("Dad's car", 'Sponge out of the bucket. Warm soapy water (Mom\'s good washing-up liquid, don\'t tell her). Now the mud.', 4000); }
    CK.snd.splash(); CK.jack('The bucket', 'Dunk. Squeeze. Full of suds again.');
  }
  function scrubMud(i) {
    if (CK.has('car', 'm' + i)) return;
    if (!carTool) return CK.jack("Dad's car", i === 9 ? 'A pigeon has been on the roof. A BIG pigeon. I need the sponge (it\'s in the bucket).' : 'Mud everywhere. Dad drove through a puddle "on purpose, to test the suspension". I need the sponge out of the bucket.', 4000);
    const v = CV(); v.sc[i] = (v.sc[i] | 0) + 1; CK.save();
    const p = mud[i], k = v.sc[i];
    p.m.opacity = Math.max(0, 1 - k / 3);
    CK.snd.scrub(); if (k >= 2) CK.snd.squeak();
    const pos = p.pl.position;
    CK.fx.burst(R('drive'), pos.x - (MUD[i][3] === 's' ? 3 : 0), pos.y, pos.z, { n: 12, tex: 'bub', size: 2.4, life: 1.1, spd: 14, up: -10, grav: 60 });
    CK.fx.burst(R('drive'), pos.x - 2, pos.y, pos.z, { n: 6, col: '#8a6a40', size: 1.2, life: 0.8, spd: 10, up: -5, grav: 400, floor: GY - 0.5 });
    if (k >= 3) { p.pl.visible = false; H.SPOTS['ch.mud' + i].off = true; p.pk.visible = false; CK.step('car', 'm' + i); if (i === 9) CK.jack('Pigeon business', 'Gone. I am never eating a Cornish pasty on this drive again.', 3500); if (mud.every((x, j) => CK.has('car', 'm' + j))) CK.jack("Dad's car", 'All the mud\'s off. Now chuck the bucket over it to rinse (click the bucket).', 4000); }
  }
  function rinse() {
    if (carTool) CK.tool.drop(true);
    const r = R('drive'); CK.snd.splash(); setTimeout(CK.snd.splash, 200);
    for (let k = 0; k < 6; k++) setTimeout(() => {const p=carPoint(-88,-95,-150+k*55); CK.fx.burst(r,p.x,p.y,p.z,{ n: 22, col: '#c8e4ff', size: 2, life: 1.2, spd: 30, up: 10, grav: 300, floor: GY - 0.5, op: 0.8 });}, k * 90);
    setTimeout(() => { CK.step('car', 'rinse'); CK.MODS.car.sync(); for (let k = 0; k < 8; k++) setTimeout(() => {const p=carPoint(-80+Math.random()*160,-60-Math.random()*70,-170+Math.random()*340); CK.fx.burst(r,p.x,p.y,p.z,{ n: 4, col: '#ffffff', size: 1.4, life: 0.6, spd: 6, up: 6, grav: 0 });}, k * 120); }, 700);
    CK.jack("Dad's car", 'SPLOOSH. Half over the car, half over my trainers. It\'s sparkling though. Dad will still say it\'s "a bit streaky".', 4500);
  }

  // ================================================================ MOW THE FRONT LAWN (the orange hover mower, the outside socket)
  const LAWN = { x0: -330, x1: 116, z0: 712, z1: 1048 }, CELL = 14, STRIPS = 8;
  const MOWHOME = { x: 196, z: 748, ry: 200 }, OSOCK = { x: 236, y: GY - 46, z: 701.6 };
  const GNOME = { x: -132, z: 884 };
  const NX = Math.ceil((LAWN.x1 - LAWN.x0) / CELL), NZ = Math.ceil((LAWN.z1 - LAWN.z0) / CELL);
  let mower = null, grassTex = null, cut = null, mowing = false, gnome = null, lastPaint = 0, stripeDir = {};
  const LV = () => (CK.S.v.lawn = CK.S.v.lawn || {});
  function mowerModel() {
    const g = new T.Group(), G = K.into(g), or = mat('#f07a10', { sh: 60, sp: '#777' }), dk = mat('#222', { sh: 30 });
    G.lathe(0, 0, 0, [[0.1, -18], [8, -17], [16, -13], [20, -7], [21, -3], [20.6, 0], [0.1, 0]], 26, or);
    G.cyl(0, -18.6, 0, 6, 7, 2, 18, dk); G.box(0, -17, 14, 14, 3, 6, M({ c: '#fff', map: K.tex('ch.mowlogo', 128, 32, (q, w, h) => { q.fillStyle = '#f07a10'; q.fillRect(0, 0, w, h); A.text(q, 'HOVER-MO', 64, 23, '700 18px ' + A.FONT, '#111', 'center'); }) }), { rx: -20 });
    G.shadow(0, 0, 0, 46, 46, 0.6);
    const pv = new T.Group(); pv.position.set(0, -12, -14); g.add(pv); g.userData.pivot = pv; const P = K.into(pv);
    [-11, 11].forEach(x => P.cyl(x, -38, -6, 1.1, 1.1, 78, 8, mat('#c8c8cc', { sh: 80 }), { rx: -18 }));
    P.cyl(0, -74, -18, 1.4, 1.4, 26, 8, dk, { rz: 90 }); P.box(9, -70, -16, 4, 8, 4, mat('#d01a1a'));
    return g;
  }
  CK.add({
    id: 'lawn', room: 'drive',
    build(r) {
      // the long grass (a texture over the lawn: mowing draws the stripes into it)
      grassTex = K.tex('ch.grass', NX * 4, NZ * 4, () => {}, { clamp: true });
      grassTex.magFilter = T.LinearFilter;
      const gm = M({ c: '#fff', map: grassTex, tr: true, sh: 4 }).clone();
      const gp = new T.Mesh(new T.PlaneGeometry(LAWN.x1 - LAWN.x0, LAWN.z1 - LAWN.z0), gm); gp.rotation.x = Math.PI / 2; gp.position.set((LAWN.x0 + LAWN.x1) / 2, GY - 0.5, (LAWN.z0 + LAWN.z1) / 2); gp.renderOrder = 1; gp.userData.noPick = 1; r.group.add(gp);
      cut = new Uint8Array(NX * NZ);
      const v = LV(); if (v.day === CK.day() && v.cut) { const raw = atob(v.cut); for (let i = 0; i < cut.length && i < raw.length; i++) cut[i] = raw.charCodeAt(i); }
      paintGrass();
      // the gnome (do NOT mow the gnome)
      gnome = grp(G => { G.cyl(0, -10, 0, 4, 6, 20, 12, mat('#2a5ad0')); G.ball(0, -24, 0, 4.4, 4.4, 4.4, mat('#f0c8a0'), 12); G.ball(0, -19, 2.4, 4, 4, 2.6, mat('#f4f4f4'), 10); G.lathe(0, -27, 0, [[0.1, -14], [4.8, 0]], 12, mat('#d01a1a'), { rz: 8 }); G.ball(2.6, -8, 3.4, 1.8, 1.8, 1.8, mat('#6a3a1a'), 8); G.shadow(0, 0, 0, 16, 16, 0.6); });
      gnome.position.set(GNOME.x, GY, GNOME.z); gnome.rotation.y = 0.4; r.group.add(gnome);
      CK.spot(r, 'ch.gnome', gnome, { label: 'Gerald (the gnome)', act: () => CK.jack('Gerald', 'Gerald the gnome. Mom got him at a car boot sale. He has a fishing rod and no fish. Do NOT mow Gerald.', 4000) });
      // the mower, by the front door; the outside socket
      mower = mowerModel(); r.group.add(mower);
      CK.spot(r, 'ch.mower', mower, { label: () => CK.tool.cur && CK.tool.cur.id === 'mower' ? 'The mower (you\'ve got it)' : 'The hover mower', act: () => takeMower() });
      const os = grp(G => { G.rbox(0, 0, 0, 10, 12, 4, 0.8, mat('#e8e4dc', { sh: 30 })); G.box(0, -1.6, 2.1, 8, 7, 0.6, mat('#d8d4cc')); G.box(0, 4, 2.2, 3, 1, 0.4, mat('#c81a1a')); });
      os.position.set(OSOCK.x, OSOCK.y, OSOCK.z + 2); r.group.add(os);
      CK.spot(r, 'ch.osocket', os, { label: 'Outside socket (weatherproof, allegedly)', act: () => { if (CK.tool.cur && CK.tool.cur.id === 'mower') { if (!CK.tool.plugged) return plugMower(); return CK.jack('Outside socket', 'Plugged in already. Off you go.'); } CK.jack('Outside socket', 'Dad put this in himself. It has a little flap to keep the rain out. The flap fell off in 1997.'); } });
      this.sync();
    },
    sync() {
      if (!mower || mowing) return;
      const v = LV(), at = v.day === CK.day() && v.at;
      if (CK.has('lawn', 'away') || !at) { mower.position.set(MOWHOME.x, GY, MOWHOME.z); mower.rotation.set(0, MOWHOME.ry * D2R, 0); }
      else { mower.position.set(at[0], GY, at[1]); mower.rotation.set(0, at[2], 0); }
      H.dirty();
    },
    reset() { LV().cut = ''; LV().at = null; if (cut) { cut.fill(0); paintGrass(); } this.sync(); },
  });
  function paintGrass(cells) {
    const g = grassTex.userData.g, w = NX * 4, h = NZ * 4;
    const long = (x, z) => { const k = (x * 7 + z * 13) % 5; return ['#2f6a22', '#356f26', '#2a6320', '#3a7428', '#316b24'][k]; };
    const draw = (i, j) => {
      const c = cut[j * NX + i];
      const y = (NZ - 1 - j) * 4; // (the canvas's top row is the far end of the lawn)
      if (!c) { g.fillStyle = long(i, j); g.fillRect(i * 4, y, 4, 4); g.fillStyle = 'rgba(80,140,50,.6)'; g.fillRect(i * 4 + ((i * 3 + j) % 4), y, 1, 3); }
      else { g.fillStyle = c === 1 ? '#6aa848' : '#5a9a3c'; g.fillRect(i * 4, y, 4, 4); }
    };
    if (cells) cells.forEach(([i, j]) => draw(i, j)); else { g.clearRect(0, 0, w, h); for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) draw(i, j); }
    grassTex.needsUpdate = true; H.dirty();
  }
  function plugMower() { if (CK.tool.plug()) { CK.step('lawn', 'plug'); CK.jack('The mower', 'Plugged in. WHUMMMMMM. It hovers! It actually hovers! Up and down in nice straight lines, like Dad does.', 4000); mowUi(); } }
  let nearHomeM = false, nearSockM = false;
  function mowHint() { if (!CK.tool.plugged) return 'Plug it in: the outside socket by the front door.'; const left = stripsLeft(); return left ? `Mow the lawn: ${left} strip${left > 1 ? 's' : ''} to go. Mind the gnome. Mind the cable.` : 'Lawn done! Put the mower back by the front door.'; }
  function mowButtons() { const out = []; if (!CK.tool.plugged && nearSockM) out.push(['Plug it in', plugMower]); if (nearHomeM) out.push(['Put it back', putMowerBack]); return out; }
  function mowUi() { CK.tool.hint(mowHint()); CK.tool.buttons(); }
  const stripsLeft = () => Array.from({ length: STRIPS }, (_, s) => s).filter(s => !CK.has('lawn', 'l' + s)).length;
  function takeMower() {
    if (CK.tool.cur && CK.tool.cur.id === 'mower') return;
    if (quiet()) return CK.jack('The mower', 'Mowing the lawn at THIS time of night? The neighbours would call the police. Mr Grimsdale definitely would.', 4500);
    if (CK.done('lawn')) return CK.jack('The mower', 'The lawn\'s done. Look at those stripes. Wimbledon, eat your heart out.');
    CK.begin('lawn'); mowing = true;
    CK.tool.take({
      id: 'mower', name: 'The hover mower', obj: mower, dist: 58, tilt: 0.35, rear: 20, hz: 150,
      cable: { room: 'drive', x: OSOCK.x, y: OSOCK.y + 4, z: OSOCK.z + 3, nx: 0, nz: 1, max: 1000, col: '#f07a10' },
      hint: mowHint(), buttons: () => mowButtons(), frame: head => mowFrame(head),
      unplugged: () => { CK.secret('ch.plug'); CK.jack('PING!', 'The plug came out of the outside socket. (Plug it back in by the front door.)', 3500); mowUi(); },
      drop: () => { mowing = false; const v = LV(); v.day = CK.day(); v.at = [+mower.position.x.toFixed(1), +mower.position.z.toFixed(1), +mower.rotation.y.toFixed(3)]; CK.save(); CK.MODS.lawn.sync(); },
    });
  }
  function putMowerBack() {
    CK.tool.drop(true); const v = LV(); v.at = null; CK.save();
    if (!stripsLeft()) CK.step('lawn', 'away'); else CK.jack('The mower', 'Back by the door... but the lawn\'s only half done. Mom can see it from the kitchen window. (She can\'t. She can.)', 3500);
    CK.MODS.lawn.sync();
  }
  function mowFrame(head) {
    const ns = Math.hypot(H.W.x - OSOCK.x, H.W.z - OSOCK.z) < 150, nh = Math.hypot(H.W.x - MOWHOME.x, H.W.z - MOWHOME.z) < 110;
    if (ns !== nearSockM || nh !== nearHomeM) { nearSockM = ns; nearHomeM = nh; mowUi(); }
    if (!CK.tool.plugged) return;
    mower.position.y = GY - 1.2 - Math.sin(performance.now() / 60) * 0.2; // (it hovers!)
    // the gnome
    if (Math.hypot(head.x - GNOME.x, head.z - GNOME.z) < 24 && !gnome.userData.hit) { gnome.userData.hit = 1; CK.oops('lawn'); H.sfx.tone(300, 0.1, 'square', 0.06); CK.tween(gnome, { rz: 0.5 }, 120).then(() => CK.tween(gnome, { rz: 0 }, 400)); CK.jack('CLONK', 'I mowed Gerald. Gerald has lost the end of his fishing rod. Mom must NEVER know.', 3500); setTimeout(() => { gnome.userData.hit = 0; }, 3000); }
    // the grass under it
    const now = performance.now(); if (now - lastPaint < 90) return; lastPaint = now;
    if (head.x < LAWN.x0 - 10 || head.x > LAWN.x1 + 10 || head.z < LAWN.z0 - 10 || head.z > LAWN.z1 + 10) return;
    const stripe = Math.abs(head.fz) > Math.abs(head.fx) ? (head.fz > 0 ? 1 : 2) : (head.fx > 0 ? 1 : 2);
    const ci = Math.floor((head.x - LAWN.x0) / CELL), cj = Math.floor((head.z - LAWN.z0) / CELL), rr = 2, cells = [];
    for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; if ((i - ci) ** 2 + (j - cj) ** 2 > rr * rr + 1) continue; if (!cut[j * NX + i]) { cut[j * NX + i] = stripe; cells.push([i, j]); } }
    if (!cells.length) return;
    paintGrass(cells);
    CK.fx.burst(R('drive'), head.x - head.fx * 22, GY - 3, head.z - head.fz * 22, { n: 5, col: '#5aa040', size: 1.2, life: 0.7, spd: 26, up: 14, grav: 200, floor: GY - 0.6 });
    const v = LV(); v.day = CK.day(); v.cut = btoa(String.fromCharCode.apply(null, cut)); CK.save();
    // a strip is done when nearly all of it is mown (the strips run up and down the lawn)
    for (let s = 0; s < STRIPS; s++) {
      if (CK.has('lawn', 'l' + s)) continue;
      const i0 = Math.floor(s * NX / STRIPS), i1 = Math.floor((s + 1) * NX / STRIPS); let n = 0, m = 0;
      for (let j = 0; j < NZ; j++) for (let i = i0; i < i1; i++) { n++; if (cut[j * NX + i]) m++; }
      if (m / n >= 0.8) { CK.step('lawn', 'l' + s); mowUi(); if (!stripsLeft()) CK.jack('The mower', 'STRIPES! Proper ones! Now put the mower back by the front door.', 4000); }
    }
  }

  // ================================================================ SWEEP THE DRIVE (the broom, the leaves, the garden sack)
  const LEAVES = [[150, 742], [214, 790], [168, 860], [236, 924], [150, 980], [222, 1044], [176, 1076]];
  const BROOM = { x: 136, z: 716, ry: 160 }, SACK = { x: 140, z: 1030 };
  let broom = null, piles = [], sack = null, sweeping = false;
  function broomModel() {
    const g = new T.Group(), G = K.into(g);
    G.rbox(0, -3, 0, 40, 6, 7, 1.5, mat('#7a4a22', { sh: 10 })); for (let i = 0; i < 20; i++) G.box(-18 + i * 1.9, -0.8, 0, 0.8, 1.6, 5.4, mat('#2a2218'));
    G.shadow(0, 0, 0, 46, 14, 0.5, { sq: true });
    const pv = new T.Group(); pv.position.set(0, -6, 0); g.add(pv); g.userData.pivot = pv; K.into(pv).cyl(0, -62, -2, 1.3, 1.3, 124, 8, mat('#c8a060', { sh: 20 }));
    return g;
  }
  function pileModel(seed) { const g = new T.Group(), G = K.into(g), r = K.rnd(seed); for (let i = 0; i < 26; i++) { const a = r() * 7, d = Math.sqrt(r()) * 13, c = ['#c8601a', '#e0a020', '#a8401a', '#8a6a2a', '#d8802a'][i % 5]; G.ball(Math.cos(a) * d, -0.6 - r() * 2.5 * (1 - d / 14), Math.sin(a) * d, 3 + r() * 1.6, 0.4, 2 + r(), mat(c, { side: 2 }), 6, { ry: r() * 180 }); } G.shadow(0, 0, 0, 30, 30, 0.35); return g; }
  CK.add({
    id: 'sweep', room: 'drive',
    build(r) {
      piles = LEAVES.map(([x, z], i) => { const g = pileModel(i + 11); g.position.set(x, GY, z); r.group.add(g); return { g, x, z }; });
      sack = grp(G => { G.lathe(0, 0, 0, [[0.1, -48], [17, -47], [19, -30], [18, -6], [14, 0], [0.1, 0]], 18, mat('#2a6a2a', { sh: 40, sp: '#444', side: 2 })); G.disc(0, -40, 0, 16, mat('#6a4a1a')); G.shadow(0, 0, 0, 40, 40, 0.5); });
      sack.position.set(SACK.x, GY, SACK.z); r.group.add(sack);
      CK.spot(r, 'ch.sack', sack, { label: 'Garden sack (for leaves)', act: () => tipLeaves() });
      broom = broomModel(); r.group.add(broom);
      CK.spot(r, 'ch.broom', broom, { label: () => CK.tool.cur && CK.tool.cur.id === 'broom' ? 'The broom (you\'ve got it)' : 'The yard broom', act: () => takeBroom() });
      this.sync();
    },
    sync() {
      piles.forEach((p, i) => { p.g.visible = !CK.has('sweep', 'l' + i); });
      if (broom && !sweeping) { const v = CK.S.v.broom; if (v && v.day === CK.day() && v.at && !CK.done('sweep')) { broom.position.set(v.at[0], GY, v.at[1]); broom.rotation.set(0, v.at[2], 0); } else { broom.position.set(BROOM.x, GY, BROOM.z); broom.rotation.set(0, BROOM.ry * D2R, 0); } }
      H.dirty();
    },
    reset() { CK.S.v.broom = null; this.sync(); },
  });
  function takeBroom() {
    if (CK.tool.cur && CK.tool.cur.id === 'broom') return;
    if (CK.done('sweep')) return CK.jack('The broom', 'The drive\'s swept. One leaf has already landed on it. ONE LEAF.');
    CK.begin('sweep'); sweeping = true;
    CK.tool.take({ id: 'broom', name: 'The yard broom', obj: broom, dist: 50, tilt: 0.7, hint: 'Push it into every pile of leaves on the drive.', frame: head => sweepFrame(head),
      buttons: () => (piles.every((p, i) => CK.has('sweep', 'l' + i)) && Math.hypot(H.W.x - SACK.x, H.W.z - SACK.z) < 140 ? [['Tip them in the sack', tipLeaves]] : []),
      drop: () => { sweeping = false; CK.S.v.broom = { day: CK.day(), at: [+broom.position.x.toFixed(1), +broom.position.z.toFixed(1), +broom.rotation.y.toFixed(3)] }; CK.save(); } });
  }
  let nearSack = false;
  function sweepFrame(head) {
    const ns = Math.hypot(H.W.x - SACK.x, H.W.z - SACK.z) < 140; if (ns !== nearSack) { nearSack = ns; CK.tool.buttons(); }
    const moving = Math.hypot(H.W.vx || 0, H.W.vz || 0) > 20;
    if (moving && Math.random() < 0.15) H.sfx.noise(0.12, 0.03, 3000, 0, 'bandpass', 1800);
    piles.forEach((p, i) => {
      if (p.going || CK.has('sweep', 'l' + i)) return;
      if (Math.hypot(p.x - head.x, p.z - head.z) > 26) return;
      p.going = true;
      CK.fx.burst(R('drive'), p.x, GY - 2, p.z, { n: 16, col: '#d8802a', size: 2.4, life: 1, spd: 40, up: 20, grav: 160, floor: GY - 0.5, fade: true });
      H.sfx.noise(0.4, 0.06, 2600, 0, 'bandpass', 1200);
      CK.tween(p.g, { s: 0.1, x: head.x, z: head.z }, 450).then(() => { p.g.visible = false; p.g.scale.set(1, 1, 1); p.g.position.set(p.x, GY, p.z); p.going = false; CK.step('sweep', 'l' + i); const left = piles.filter((q, j) => !CK.has('sweep', 'l' + j)).length; CK.tool.hint(left ? `Push it into every pile of leaves (${left} left).` : 'All swept up! Tip them in the green garden sack by the hedge.'); CK.tool.buttons(); });
    });
  }
  function tipLeaves() {
    if (CK.done('sweep') || CK.has('sweep', 'tip')) return CK.jack('Garden sack', 'Full of leaves. Dad takes it to the tip on Sundays, with the radio on.');
    if (!piles.every((p, i) => CK.has('sweep', 'l' + i))) return CK.jack('Garden sack', 'Leaves go in here, once they\'re swept up. The broom is leaning by the front door.', 3500);
    if (CK.tool.cur && CK.tool.cur.id === 'broom') CK.tool.drop(true);
    CK.snd.rustle(); setTimeout(CK.snd.rustle, 250);
    CK.fx.burst(R('drive'), SACK.x, GY - 50, SACK.z, { n: 18, col: '#d8802a', size: 2.4, life: 0.9, spd: 14, up: -6, grav: 200, floor: GY - 40 });
    CK.step('sweep', 'tip');
  }
})();

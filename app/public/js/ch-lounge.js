/* ch-lounge: Mom's jobs in THE LOUNGE (js/ch-core.js is the engine; the lounge itself is js/hs-house.js).
 *   hoover    Mom's new upright stands in the hall by the lounge door. Take it (click it), plug it in at the socket by the
 *             telly, and push it over every crumb on the carpet (biscuits, crisps, popcorn, fluff, one Lego brick). Mind the
 *             cable: go too far and the plug pops out. Then stand it back in the hall.
 *   videos    six tapes left out on the carpet: back in the video tower next to the telly.
 *   cushions  four scatter cushions on the floor: three on the settee, one on Dad's chair, then plump each one (click it) so
 *             it sits on its corner like a diamond, the way Mom likes.
 * The lounge: x -280..195, z 305..700, floor y 353. The hall: x 205..410, z 60..700. */
(function () {
  'use strict';
  const CK = window.ChoreKit; if (!CK || CK.MODS.hoover) return;
  const { H, T, K, A, M, D2R } = CK;
  const GY = 353;
  const mat = (c, o) => M(Object.assign({ c, sh: 12, sp: '#222' }, o || {}));
  const grp = fn => { const g = new T.Group(); fn(K.into(g), g); return g; };
  const LR = () => H.ROOMS.lounge, CC = () => CK.CC;
  const quiet = () => { try { return !!(window.HouseLife && HouseLife.quiet && HouseLife.quiet()); } catch (e) { return false; } };

  // ================================================================ HOOVER THE LOUNGE
  const HOME = { room: 'hall', x: 224, z: 452, ry: 90 }; // (in the hall, by the lounge door)
  const SOCKET = { room: 'lounge', x: 60, y: GY - 28, z: 306.6, nx: 0, nz: 1 };
  const CRUMBS = [[-215, 385], [-150, 402], [-205, 478], [-182, 628], [-58, 386], [22, 402], [32, 498], [-92, 506], [104, 520], [60, 642], [-60, 652], [-215, 520]];
  const KINDS = [['lego', 'A Blocko brick'], ['biscuit', 'Biscuit crumbs'], ['crisps', 'Crisp bits'], ['popcorn', 'Popcorn'], ['fluff', 'Fluff'], ['biscuit', 'Custard cream crumbs'], ['crisps', 'Quavver dust'], ['fluff', 'Cat hair (next door\'s)'], ['glitter', 'Glitter (' + CK.cast('{sister}') + '\'s)']];
  let hv = null, patches = [], socketObj = null, hoovering = false;
  const V = () => (CK.S.v.hoover = CK.S.v.hoover || {});
  function hooverModel() {
    const g = new T.Group(), G = K.into(g), red = mat('#c41c2a', { sh: 60, sp: '#777' }), grey = mat('#9a9ca4', { sh: 30, sp: '#444' }), dk = mat('#222226', { sh: 30 });
    G.rbox(0, -4.5, 3, 32, 9, 22, 2.4, red); G.box(0, -1.4, 14.2, 32, 2.6, 1.2, dk); G.box(0, -0.4, 4, 28, 0.6, 16, dk);
    [-13, 13].forEach(x => G.cyl(x, -3, -7, 3.2, 3.2, 2.4, 14, dk, { rz: 90 }));
    G.box(0, -9.4, 9, 20, 0.6, 6, M({ c: '#fff', map: K.tex('ch.hvlogo', 128, 32, (q, w, h) => { q.fillStyle = '#c41c2a'; q.fillRect(0, 0, w, h); A.text(q, 'TURBO 2000', 64, 23, '700 18px ' + A.FONT, '#fff', 'center'); }) }));
    G.shadow(0, 0, 2, 40, 30, 0.6, { sq: true });
    const pv = new T.Group(); pv.position.set(0, -7, -4); g.add(pv); g.userData.pivot = pv; const P = K.into(pv);
    P.rbox(0, -38, -2, 22, 62, 13, 6, mat('#b8b8be', { sh: 8 })); // the bag
    P.rbox(0, -72, -2, 21, 10, 14, 3, red); P.rbox(0, -6, -2, 23, 12, 15, 3, red);
    P.cyl(0, -96, -2, 1.5, 1.5, 40, 10, grey); P.rbox(0, -118, -2, 15, 3.4, 4, 1.4, dk);
    P.box(6.5, -60, -9.6, 2, 3, 3, dk); P.box(6.5, -26, -9.6, 2, 3, 3, dk); // cable hooks
    for (let i = 0; i < 6; i++) P.cyl(6.5, -30 - i * 5.4, -10.5, 0.6, 0.6, 2.6, 6, mat('#e8e4dc'), { rz: 90 }); // the cable wound round them
    P.box(-12, -40, -2, 0.6, 30, 8, mat('#e8e4dc')); // the zip
    return g;
  }
  function crumbPatch(kind, seed) {
    const g = new T.Group(), G = K.into(g), r = K.rnd(seed);
    const col = { biscuit: ['#c89050', '#a87038', '#e0b070'], crisps: ['#f0c840', '#e8a830', '#fff0a0'], popcorn: ['#fff8e0', '#f0e0b0'], fluff: ['#9a9aa8', '#c8c8d0', '#6a6a72'], glitter: ['#ff4ab0', '#4ad8ff', '#ffe14a', '#8aff4a'], lego: ['#c8a050'] }[kind];
    const n = kind === 'popcorn' ? 9 : kind === 'fluff' ? 6 : 18;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 13, x = Math.cos(a) * d, z = Math.sin(a) * d, c = col[i % col.length];
      if (kind === 'popcorn') G.ball(x, -1.2, z, 1.4 + r() * 0.6, 1.1, 1.3, mat(c, { flat: true }), 5);
      else if (kind === 'fluff') G.ball(x, -0.9, z, 2 + r() * 1.5, 0.9, 1.6 + r(), mat(c), 6);
      else if (kind === 'glitter') G.box(x, -0.15, z, 0.6, 0.15, 0.6, M({ c, sh: 120, sp: '#fff', e: c }), { ry: r() * 90 });
      else G.box(x, -0.3, z, 0.6 + r() * 1.2, 0.4 + r() * 0.4, 0.5 + r() * 1, mat(c, { flat: true }), { ry: r() * 180 });
    }
    if (kind === 'lego') { G.box(0, -1.6, 0, 6.4, 3.2, 3.2, mat('#d01a1a', { sh: 80, sp: '#fff' })); [-2.4, -0.8, 0.8, 2.4].forEach(x => [-0.8, 0.8].forEach(z => G.cyl(x, -3.6, z, 0.5, 0.5, 0.9, 8, mat('#d01a1a', { sh: 80 })))); }
    return g;
  }
  CK.add({
    id: 'hoover', room: 'hall',
    build(hall) {
      hv = hooverModel(); hall.group.add(hv);
      CK.spot(hall, 'ch.hoover', hv, { label: () => CK.tool.cur && CK.tool.cur.id === 'hoover' ? 'The vacuum (you\'ve got it)' : 'Mom\'s new vacuum (the TURBO 2000)', act: () => takeHoover() });
      this.sync();
    },
    also: {
      lounge: r => {
        // the double socket by the telly
        socketObj = grp(G => { G.rbox(0, 0, 0, 15, 8.4, 1.4, 0.4, mat('#f2f0ea', { sh: 40 })); [-3.6, 3.6].forEach(x => { G.box(x, -1, 0.75, 1.1, 2.4, 0.2, mat('#222')); G.box(x - 1.4, 1.2, 0.75, 0.9, 0.9, 0.2, mat('#222')); G.box(x + 1.4, 1.2, 0.75, 0.9, 0.9, 0.2, mat('#222')); G.box(x, -3.2, 0.75, 1.6, 0.6, 0.3, mat('#c81a1a')); }); });
        socketObj.position.set(SOCKET.x, SOCKET.y, SOCKET.z); r.group.add(socketObj);
        CK.spot(r, 'ch.socket', socketObj, { label: 'Plug socket', act: () => { if (CK.tool.cur && CK.tool.cur.cable) { if (CK.tool.plugged) return CK.jack('Plug socket', 'Already plugged in. Get hoovering.'); if (Math.hypot(H.W.x - SOCKET.x, H.W.z - SOCKET.z) > 200) return CK.jack('Plug socket', 'Bring the vacuum over here first.'); return plugIn(); } CK.jack('Plug socket', 'A double socket. One for the telly, one for the video, and Dad says the vacuum can unplug the video, "it\'ll only flash 12:00 again".'); } });
        // today's crumbs
        layCrumbs(r);
      },
    },
    sync() {
      if (!hv || hoovering) return;
      const v = V(), at = v.at;
      if (CK.has('hoover', 'away') || !at) { const hall = H.ROOMS.hall; if (hv.parent !== hall.group) hall.group.add(hv); hv.position.set(HOME.x, GY, HOME.z); hv.rotation.set(0, HOME.ry * D2R, 0); }
      else { const rr = H.ROOMS[at[0]]; if (rr && hv.parent !== rr.group) rr.group.add(hv); hv.position.set(at[1], GY, at[2]); hv.rotation.set(0, at[3], 0); }
      patches.forEach((p, i) => { p.g.visible = !CK.has('hoover', 'd' + i); });
      H.dirty();
    },
    reset() { V().at = null; patches.forEach(p => { p.g.visible = true; p.g.scale.set(1, 1, 1); }); if (LR() && LR().built) { patches.forEach(p => p.g.parent && p.g.parent.remove(p.g)); patches = []; layCrumbs(LR()); } this.sync(); },
    dbg: () => patches.map(p => [p.x, p.z]),
    take() { // (the house's old hoover in the cupboard)
      CK.jack('The old vacuum', 'Not the old one: it smells of burning and Dad has banned it. Mom\'s NEW one (the TURBO 2000) is standing in the hall, by the lounge door.', 5000); return true;
    },
  });
  function layCrumbs(r) {
    const d = CK.day(), rng = CC().rng('chcrumbs|' + d), cand = CC().shuffle(CRUMBS, rng);
    const reach = (x, z) => { for (let a = 0; a < 16; a++) for (const rr of [0, 20, 35]) if (H._.cellOk('G', x + Math.cos(a / 16 * Math.PI * 2) * rr, z + Math.sin(a / 16 * Math.PI * 2) * rr)) return true; return false; };
    const ok = cand.filter(([x, z]) => reach(x, z)).concat(cand.filter(([x, z]) => !reach(x, z)));
    patches = KINDS.map(([kind, n], i) => { const [x, z] = ok[i % ok.length], g = crumbPatch(kind, i * 7 + 3); g.position.set(x, GY, z); g.rotation.y = rng() * 6; r.group.add(g); return { g, kind, n, x, z }; });
    patches.forEach((p, i) => { p.g.visible = !CK.has('hoover', 'd' + i); });
  }
  function takeHoover() {
    if (CK.tool.cur && CK.tool.cur.id === 'hoover') return;
    if (quiet()) return CK.jack('The vacuum', 'Hoovering? NOW? Everybody\'s asleep. Mom would come down in her dressing gown and that is a sight nobody needs.', 4500);
    if (CK.done('hoover')) return CK.jack('The vacuum', 'Already done the lounge today. Look at those lines in the carpet. Beautiful.');
    CK.begin('hoover');
    hoovering = true;
    CK.tool.take({
      id: 'hoover', name: 'The TURBO 2000', obj: hv, dist: 52, tilt: 0.55, rear: 16, hz: 112,
      cable: { room: SOCKET.room, x: SOCKET.x, y: SOCKET.y + 2, z: SOCKET.z + 0.6, nx: 0, nz: 1, max: 900, col: '#e8e4dc' },
      hint: hint(), buttons: () => buttons(),
      frame: head => frame(head),
      unplugged: () => { CK.secret('ch.plug'); CK.jack('PING!', 'The plug shot out of the wall. The cable only goes so far. (Plug it back in at the socket by the telly.)', 4000); refreshUi(); },
      drop: () => { hoovering = false; const v = V(); v.at = [H.here, +hv.position.x.toFixed(1), +hv.position.z.toFixed(1), +hv.rotation.y.toFixed(3)]; CK.save(); CK.MODS.hoover.sync(); },
    });
    if (!V().told) { V().told = 1; CK.save(); CK.jack('The vacuum', 'Got it. It weighs a TONNE. Push it into the lounge, plug it in at the socket by the telly, then walk it over every crumb on the carpet.', 6000); }
  }
  let nearHome = false, nearSock = false;
  function hint() { if (!CK.tool.plugged) return CK.touchy() ? 'Plug it in: the socket by the telly.' : 'Walk with <b>W A S D</b>. Plug it in at the socket by the telly.'; const left = patches.filter((p, i) => !CK.has('hoover', 'd' + i)).length; return left ? `Push it over the crumbs (${left} left). Mind the cable.` : 'All done! Stand it back in the hall, by the lounge door.'; }
  function buttons() { const out = []; if (!CK.tool.plugged && nearSock) out.push(['Plug it in', plugIn]); if (nearHome) out.push(['Put it away', putAway]); return out; }
  function refreshUi() { CK.tool.hint(hint()); CK.tool.buttons(); }
  function plugIn() { if (CK.tool.plug()) { CK.step('hoover', 'plug'); CK.jack('The vacuum', 'Plugged in and... VRRRRRRRRMMMMMM. Mom: "WHAT? I CAN\'T HEAR YOU, THE VACUUM\'S ON!"', 3500); refreshUi(); } }
  function putAway() {
    CK.tool.drop(true);
    hv.position.set(HOME.x, GY, HOME.z); hv.rotation.set(0, HOME.ry * D2R, 0); const v = V(); v.at = null; CK.save();
    if (patches.every((p, i) => CK.has('hoover', 'd' + i))) CK.step('hoover', 'away'); else CK.jack('The vacuum', 'Put it back... but there are still crumbs in the lounge. Mom WILL notice.', 3500);
    CK.MODS.hoover.sync();
  }
  function frame(head) {
    const ns = head.room === 'lounge' && Math.hypot(H.W.x - SOCKET.x, H.W.z - SOCKET.z) < 160, nh = head.room === 'hall' && Math.hypot(H.W.x - HOME.x, H.W.z - HOME.z) < 110;
    if (ns !== nearSock || nh !== nearHome) { nearSock = ns; nearHome = nh; refreshUi(); }
    if (!CK.tool.plugged || head.room !== 'lounge') return;
    // the brush bar: a little shake while it runs
    hv.userData.pivot.position.y = -7 + Math.sin(performance.now() / 30) * 0.15;
    patches.forEach((p, i) => {
      if (!p.g.visible || p.going || CK.has('hoover', 'd' + i)) return;
      const hx = head.x + head.fx * 6, hz = head.z + head.fz * 6;
      if (Math.hypot(p.x - hx, p.z - hz) > 24) return;
      p.going = true;
      if (p.kind === 'lego') { for (let k = 0; k < 6; k++) H.sfx.noise(0.04, 0.08, 3200, k * 0.05, 'bandpass', 2000); CK.jack('CLACK-A-CLACK-CLACK', 'The vacuum ate a Blocko brick. It is rattling round inside like a maraca. That\'s fine. That\'s probably fine.', 3500); }
      else H.sfx.noise(0.25, 0.05, 2600, 0, 'highpass', 4000);
      const sx = p.g.position.x, sz = p.g.position.z;
      CK.tween(p.g, { x: hx, z: hz, s: 0.05 }, 380).then(() => { p.g.visible = false; p.g.position.set(sx, GY, sz); p.g.scale.set(1, 1, 1); p.going = false; CK.step('hoover', 'd' + i); refreshUi(); if (patches.every((q, j) => CK.has('hoover', 'd' + j))) CK.jack('The vacuum', 'Every crumb! The carpet has stripes in it now. Unplug it (just walk off) and stand it back in the hall.', 4500); });
    });
  }

  // ================================================================ TIDY THE VIDEOS (into the video tower by the telly)
  const TOWER = { x: 14, z: 322 };
  const VIDS = [['BASHIATORS - THE FINAL', '#f4f0e0'], ['DOCTOR WHEN (TAPED 1996)', '#d8e8ff'], ["CHILDREN IN KNEAD '98", '#ffe680'], ['GALAXY WALK: THE NEXT SHIFT', '#f4f0e0'], ['THE SNOWBLOKE (XMAS)', '#e0f4e0'], ['DO NOT TAPE OVER - MOM', '#ffd0e0']];
  const VIDART = ['vhs.bash', 'space', 'band', 'vhs.galaxy', 'winter', 'city'];
  const VSPOT = [[-150, 382, 20], [-24, 398, -40], [40, 436, 60], [-142, 500, 10], [-205, 432, 80], [62, 508, -20]];
  let vids = [], towerN = 0;
  function tapeModel(i) {
    const [lab, col] = VIDS[i];
    const lbl = A.printed('ch.vhs.l' + i, 512, 280, (q,w,h)=>{q.fillStyle='#151515';q.fillRect(0,0,w,h);q.fillStyle='#2a2a2a';q.fillRect(60,145,392,100);q.fillStyle='#777';for(const x of [160,352]){q.beginPath();q.arc(x,195,36,0,7);q.fill();q.fillStyle='#222';q.beginPath();q.arc(x,195,12,0,7);q.fill();q.fillStyle='#777'}q.fillStyle=col;q.fillRect(28,18,456,112);
      const illustrated = window.PrintArt?.paint(q, VIDART[i], 34, 24, 112, 100, 'contain');
      q.fillStyle='#152b52';q.font='700 '+(illustrated?22:28)+'px "Courier New",monospace';K.wrapText(q,lab,illustrated?158:42,illustrated?51:59,illustrated?312:428,illustrated?30:36)
    },{clamp:true});
    const sp = K.tex('ch.vhs.s' + i,512,72,(q,w,h)=>{q.fillStyle='#151515';q.fillRect(0,0,w,h);q.fillStyle=col;q.fillRect(12,8,w-24,h-16);let size=30;do{q.font='700 '+size+'px "Courier New",monospace';if(q.measureText(lab).width<=w-40)break;size--}while(size>16);q.fillStyle='#152b52';q.fillText(lab,20,47)},{clamp:true});
    return grp(G => { G.box(0, -1.25, 0, 18.7, 2.5, 10.3, { t: M({ c: '#fff', map: lbl }), f: M({ c: '#fff', map: sp }), all: mat('#1a1a1a', { sh: 30, sp: '#333' }) }); G.shadow(0, 0, 0, 21, 12, 0.45, { sq: true }); });
  }
  CK.add({
    id: 'videos', room: 'lounge',
    build(r) {
      // the video tower (pine, seven shelves): the tapes go in spine out
      const tw = grp(G => { const pm = M({ c: '#fff', map: A.t('pine') }); G.box(-12, -39, 0, 1.6, 78, 22, pm); G.box(12, -39, 0, 1.6, 78, 22, pm); G.box(0, -39, -10.4, 24, 78, 1.2, M({ c: '#fff', map: A.t('pineDark') })); for (let i = 0; i < 8; i++) G.box(0, -1 - i * 10.8, 0, 22.4, 1.4, 22, pm); G.shadow(0, 0, 0, 30, 28, 0.6, { sq: true }); });
      tw.position.set(TOWER.x, GY, TOWER.z); r.group.add(tw);
      H.block('G', TOWER.x - 14, TOWER.z - 13, TOWER.x + 14, TOWER.z + 13);
      vids = VIDS.map((v, i) => CK.thing('ch.v.' + i, { obj: tapeModel(i), kind: 'chvhs', label: 'Video: ' + v[0], chore: 'videos', holdD: 42, home: { room: 'lounge', x: VSPOT[i][0], y: GY, z: VSPOT[i][1], ry: VSPOT[i][2] } }));
      const ts = CK.snap('ch.s.tower', { room: 'lounge', x:TOWER.x,y:GY-40,z:TOWER.z+8,r:40,box:[21,2.6,11],accepts:(k,t)=>{if(k!=='chvhs')return false;const i=+t.id.slice(5);ts.pose={x:TOWER.x,y:GY-2.2-(5-i)*10.8,z:TOWER.z+.8,ry:0};ts.preview={x:TOWER.x,y:ts.pose.y-1.3,z:ts.pose.z};return true},hint:'Let go: in its video tower slot',onSnap:t=>{CK.snd.thud();const i=+t.id.slice(5);t.home=Object.assign({},t.at);CK.keep(t.id);CK.step('videos','v'+i)} });
      this.sync();
    },
    sync() { vids.forEach((t,i)=>{if(!t)return;CK.lock(t.id,false);if(CK.has('videos','v'+i))t.home={room:'lounge',x:TOWER.x,y:GY-2.2-(5-i)*10.8,z:TOWER.z+.8,ry:0};});if(window.HouseTelly)HouseTelly.tapes(); },
    reset() { vids.forEach(t => { if (t) { CK.lock(t.id, false); CK.home(t.id); } }); },
  });

  // ================================================================ PLUMP THE CUSHIONS (three on the settee, one on Dad's chair)
  const SEATS = [{ x: -96, z: 547, ry: 0 }, { x: -63, z: 547, ry: -4 }, { x: -30, z: 547, ry: 3 }, { x: 123, z: 425, ry: -70 }];
  const CHOME = [[-182, 458, 30], [2, 500, -20], [-112, 382, 70], [-30, 395, -50]];
  const CCOL = [['#7a2a6a', '#e8b0d8'], ['#2a5a8a', '#a8d0f0'], ['#c8a020', '#fff0a0'], ['#2a7a4a', '#b0e8c0']];
  let cush = [];
  const CV = () => (CK.S.v.cush = CK.S.v.cush || { seat: {} });
  const seatOf = i => { const s = CV().seat || {}; return s[i] == null ? -1 : s[i]; };
  const seatFree = k => !Object.values(CV().seat || {}).includes(k);
  function seatSet(i, k) { const v = CV(); v.seat = v.seat || {}; v.seat[i] = k; CK.save(); }
  function cushionModel(i) {
    const [c1, c2] = CCOL[i];
    const tex = K.tex('ch.cush' + i, 128, 128, (q, w, h) => { q.fillStyle = c1; q.fillRect(0, 0, w, h); q.strokeStyle = c2; q.lineWidth = 6; for (let k = -2; k < 6; k++) { q.beginPath(); q.moveTo(k * 32, 0); q.lineTo(k * 32 + 128, 128); q.stroke(); } q.fillStyle = c2; q.beginPath(); q.arc(64, 64, 12, 0, 7); q.fill(); A.grain(q, w, h, 900, 0.08, i + 4); });
    const g = new T.Group(), body = new T.Group(); body.position.set(0, -15, 0); g.add(body); g.userData.body = body;
    const B = K.into(body), m = M({ c: '#fff', map: tex, sh: 10 });
    B.rbox(0, 0, 0, 30, 30, 9, 4.2, m);
    B.geo(new T.TorusGeometry(20.6, 0.8, 6, 4), 0, 0, 0, mat(c2, { sh: 30 }), { rz: 45 }); // (the piping round the edge)
    [-1, 1].forEach(s => B.cyl(0, 0, s * 4.6, 1.4, 1.4, 1, 10, mat(c2), { rx: 90 }));
    return g;
  }
  CK.add({
    id: 'cushions', room: 'lounge',
    build(r) {
      cush = CCOL.map((c, i) => {
        const t = CK.thing('ch.c.' + i, { obj: cushionModel(i), kind: 'cushion', label: 'Cushion', chore: 'cushions', holdD: 55, home: { room: 'lounge', x: CHOME[i][0], y: GY - 4.5, z: CHOME[i][1], ry: CHOME[i][2] } });
        if (!t) return null;
        t.cI = i; const sp = H.SPOTS[t.id]; sp.use = true; sp.act = () => cushClick(i);
        sp.label = () => CK.has('cushions', 'p' + i) ? 'Cushion (plumped, perfect)' : seatOf(i) >= 0 ? 'Cushion (plump it!)' : 'Cushion (on the floor)';
        return t;
      });
      SEATS.forEach((S, k) => CK.snap('ch.s.cush' + k, { room: 'lounge', x: S.x, y: GY - 55, z: S.z - (k === 3 ? 0 : 6), r: 34, box: [28, 2, 8], ry: S.ry, accepts: kind => kind === 'cushion' && seatFree(k), pose: { x: S.x, y: GY - 45, z: S.z, ry: S.ry, rx: 12 }, hint: k === 3 ? 'Let go: on Dad\'s chair' : 'Let go: on the settee', onSnap: t => { CK.snd.thud(); CK.fx.burst(LR(), S.x, GY - 50, S.z, { n: 8, col: '#e8e0d0', size: 2, life: 0.8, spd: 14, up: 8, grav: 10, op: 0.5 }); seatSet(t.cI, k); CK.step('cushions', 'c' + t.cI); } }));
      this.sync();
    },
    sync() {
      const v = CV();
      cush.forEach((t, i) => {
        if (!t) return; const k = seatOf(i);
        if (k >= 0 && CK.has('cushions', 'c' + i)) { const S = SEATS[k]; t.home = { room: 'lounge', x: S.x, y: GY - 45, z: S.z, ry: S.ry }; t.rx = 12; t.rz = 0; if (t.st !== 'snap' && t.st !== 'held' && (Math.abs(t.at.x - S.x) > 1 || Math.abs(t.at.z - S.z) > 1 || Math.abs(t.at.y - (GY - 45)) > 1)) CK.home(t.id); t.rx = 12; H.place(t); }
        else if (!CK.S.at[t.id] && t.st !== 'held') { t.rx = 90; H.place(t); }
        t.obj.userData.body.rotation.z = CK.has('cushions', 'p' + i) ? Math.PI / 4 : 0;
        CK.lock(t.id, CK.has('cushions', 'c' + i) ? undefined : false);
        const sp = H.SPOTS[t.id]; if (sp && CK.has('cushions', 'c' + i)) sp.off = false; // (placed ones still take a click: to plump them)
      });
      void v; H.dirty();
    },
    reset() { CV().seat = {}; cush.forEach(t => { if (t) { CK.lock(t.id, false); t.rx = 90; t.rz = 0; t.obj.userData.body.rotation.z = 0; CK.home(t.id); t.rx = 90; H.place(t); } }); },
  });
  function cushClick(i) {
    const t = cush[i];
    if (!CK.has('cushions', 'c' + i)) return H.grab(t.id);
    if (CK.has('cushions', 'p' + i)) return CK.jack('Cushion', 'Plumped. On its corner. Like a diamond. Don\'t touch it, or Mom will know.');
    CK.begin('cushions');
    const b = t.obj.userData.body, t0 = performance.now();
    CK.snd.thud(); setTimeout(CK.snd.thud, 180);
    H.anims.set('ch.plump' + i, now => {
      const k = Math.min(1, (now - t0) / 700), e = CK.ease(k);
      const sq = Math.sin(k * Math.PI * 3) * (1 - k) * 0.22;
      b.scale.set(1 + sq, 1 - sq, 1 + sq * 1.5); b.rotation.z = e * Math.PI / 4;
      if (k < 1) return true;
      b.scale.set(1, 1, 1); CK.step('cushions', 'p' + i); return false;
    });
    const p = t.obj.position; CK.fx.burst(LR(), p.x, p.y - 15, p.z, { n: 12, col: '#e8e0d0', size: 1.6, life: 1.2, spd: 16, up: 6, grav: 4, op: 0.45 });
    if (!CV().told) { CV().told = 1; CK.save(); CK.jack('Plumping', 'Punch punch, fluff fluff, and stand it on its corner. Mom says it\'s "how they do it in the magazines".', 4000); }
  }
})();

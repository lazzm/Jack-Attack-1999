/* ch-bed: Mom's jobs in JACK'S ROOM (js/ch-core.js is the engine). Five of them, all done with your hands:
 *   tidy   today's mess (clothes, rubbish, mags, a CD, a plate or a mug) goes where it lives: the washing basket, the bin,
 *          the mag pile by the telly, the CD rack, and dirty plates DOWN to the kitchen sink
 *   bed    the pillow off the floor, the pyjamas under it, then pull the duvet straight (click the bed: three goes)
 *   bin    tie up the bag in your bin (click it) and carry it down to the kitchen bin
 *   cat    shake the cat biscuits into the bowl, then give next door's cat a shout: it hops down and has its tea
 *   plant  water Gran's spider plant (hold the watering can over it and pour), pick off the brown leaves, turn it round
 * Mom's list (a copy) is pinned on the wall at the foot of the bed. Coordinates: js/rm-room.js (cm, y down, floor y 73). */
(function () {
  'use strict';
  const CK = window.ChoreKit; if (!CK || CK.MODS.tidy) return;
  const { H, T, K, A, M, CC, D2R } = CK;
  const FY = 73, GY = 353;
  const sparse=(()=>{try{return localStorage.getItem('jhp_starter')==='1'}catch(e){return false}})();
  const S = () => CK.S;
  const V = () => (CK.S.v.bed = CK.S.v.bed || {});
  const mat = (c, o) => M(Object.assign({ c, sh: 12, sp: '#222' }, o || {}));
  const rnd = K.rnd;
  const grp = (fn) => { const g = new T.Group(); fn(K.into(g), g); return g; };

  // ================================================================ cloth: a crumpled heap of fabric (a silhouette on a lumpy sheet)
  function clothTex(key, w, h, paint) { return K.tex('ch.cl.' + key, w, h, (g, ww, hh) => { g.clearRect(0, 0, ww, hh); paint(g, ww, hh); }, { clamp: true }); }
  function cloth(key, w, d, hgt, paint, seed) {
    const colours={tshirt:'#ad2630',jeans:'#375983',shirt:'#deddd6',pe:'#253861',jumper2:'#666a73',pjs:'#94b6d5'},base=colours[key]||'#5d6d87';
    const tex=K.tex('ch.solidcloth.'+key,128,128,(g,ww,hh)=>{g.fillStyle=base;g.fillRect(0,0,ww,hh);paint(g,ww,hh)},{clamp:true});
    const outline=key==='jeans'?[[30,6],[98,6],[104,122],[72,122],[64,46],[56,122],[24,122]]:key==='pe'?[[16,24],[112,24],[120,104],[72,104],[64,70],[56,104],[8,104]]:[[34,12],[52,8],[64,18],[76,8],[94,12],[122,key==='tshirt'?34:70],[108,key==='tshirt'?52:76],[96,44],[98,120],[30,120],[32,44],[20,key==='tshirt'?52:76],[6,key==='tshirt'?34:70]];
    const shape=new T.Shape();outline.forEach(([x,z],i)=>shape[i?'lineTo':'moveTo']((x/128-.5)*w,(.5-z/128)*d));shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:Math.max(.7,hgt*.28),bevelEnabled:true,bevelThickness:.18,bevelSize:.3,bevelSegments:1,steps:1});geo.rotateX(Math.PI/2);
    const pos=geo.attributes.position,uv=geo.attributes.uv;let bottom=-Infinity;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i)-hgt*.16*(1+Math.sin(x*.27+z*.12+seed));pos.setY(i,y);bottom=Math.max(bottom,y);uv.setXY(i,x/w+.5,.5-z/d)}
    for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)-bottom);geo.computeVertexNormals();
    return grp(G=>{G.geo(geo,0,0,0,M({c:'#fff',map:tex,sh:2}));G.shadow(0,0,0,w*.9,d*.9,.4)});

  }
  const P = {
    tshirt: (g, w, h) => { g.fillStyle = '#c0202c'; g.beginPath(); g.moveTo(34, 12); g.lineTo(52, 8); g.quadraticCurveTo(64, 20, 76, 8); g.lineTo(94, 12); g.lineTo(122, 34); g.lineTo(108, 52); g.lineTo(96, 44); g.lineTo(98, 120); g.lineTo(30, 120); g.lineTo(32, 44); g.lineTo(20, 52); g.lineTo(6, 34); g.closePath(); g.fill(); A.grain(g, w, h, 500, 0.08, 3); A.text(g, 'MODEM', 64, 70, '700 15px ' + A.FONT, '#fff', 'center'); A.text(g, 'BOYS', 64, 88, '700 15px ' + A.FONT, '#ffd400', 'center'); A.text(g, "TOUR '99", 64, 104, '9px ' + A.UIF, '#fff', 'center'); },
    jeans: (g, w, h) => { g.fillStyle = '#3a5a8a'; g.beginPath(); g.moveTo(30, 6); g.lineTo(98, 6); g.lineTo(104, 122); g.lineTo(72, 122); g.lineTo(64, 46); g.lineTo(56, 122); g.lineTo(24, 122); g.closePath(); g.fill(); for (let i = 0; i < 400; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,30,.15)'; g.fillRect((i * 37) % 128, (i * 53) % 128, 2, 1); } g.strokeStyle = '#c8a050'; g.lineWidth = 1; g.strokeRect(32, 8, 64, 8); g.fillStyle = '#c8a050'; g.fillRect(62, 18, 4, 14); },
    shirt: (g, w, h) => { g.fillStyle = '#f2f2ee'; g.beginPath(); g.moveTo(36, 10); g.lineTo(54, 6); g.lineTo(64, 18); g.lineTo(74, 6); g.lineTo(92, 10); g.lineTo(124, 46); g.lineTo(110, 58); g.lineTo(96, 46); g.lineTo(98, 122); g.lineTo(30, 122); g.lineTo(32, 46); g.lineTo(18, 58); g.lineTo(4, 46); g.closePath(); g.fill(); g.strokeStyle = '#ccc'; g.beginPath(); g.moveTo(64, 18); g.lineTo(64, 120); g.stroke(); g.fillStyle = '#1a2a6a'; g.beginPath(); g.moveTo(60, 14); g.lineTo(68, 14); g.lineTo(70, 60); g.lineTo(64, 66); g.lineTo(58, 60); g.closePath(); g.fill(); g.fillStyle = '#c8a020'; for (let y = 24; y < 60; y += 10) g.fillRect(58, y, 12, 2); },
    pe: (g, w, h) => { g.fillStyle = '#1a2a6a'; g.beginPath(); g.moveTo(16, 24); g.lineTo(112, 24); g.lineTo(120, 104); g.lineTo(72, 104); g.lineTo(64, 70); g.lineTo(56, 104); g.lineTo(8, 104); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(16, 24, 96, 6); g.fillRect(10, 96, 4, 8); g.fillRect(114, 96, 4, 8); },
    jumper2: (g, w, h) => { g.fillStyle = '#6a6e74'; g.beginPath(); g.moveTo(30, 12); g.quadraticCurveTo(64, 2, 98, 12); g.lineTo(124, 70); g.lineTo(108, 76); g.lineTo(98, 52); g.lineTo(98, 122); g.lineTo(30, 122); g.lineTo(30, 52); g.lineTo(20, 76); g.lineTo(4, 70); g.closePath(); g.fill(); A.grain(g, w, h, 900, 0.08, 9); g.fillStyle = '#585c62'; g.fillRect(40, 70, 48, 26); A.text(g, 'JNET', 64, 60, '700 13px ' + A.FONT, '#ff7a00', 'center'); },
    pjs: (g, w, h) => { g.fillStyle = '#9ac0e8'; g.beginPath(); g.moveTo(26, 8); g.lineTo(102, 8); g.lineTo(120, 40); g.lineTo(104, 50); g.lineTo(100, 120); g.lineTo(28, 120); g.lineTo(24, 50); g.lineTo(8, 40); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-atop'; for (let x = -128; x < 128; x += 14) { g.fillStyle = '#e8f0ff'; g.fillRect(x + 40, 0, 5, 128); } for (let i = 0; i < 6; i++) A.star(g, 20 + (i * 47) % 100, 30 + (i * 31) % 80, 5, 5), g.fillStyle = '#ffd400', g.fill(); g.globalCompositeOperation = 'source-over'; },
  };

  // ================================================================ the little things in the mess (each built bottom-centre on y = 0)
  const mags = { mag1: 'mag', mag2: 'magB' };
  const comicTex = () => K.tex('ch.comic', 192, 256, (g, w, h) => { g.fillStyle = '#ffe14a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d0102a'; g.fillRect(0, 0, w, 52); A.text(g, 'SPACE KAT', 96, 38, '34px ' + A.FONT, '#fff', 'center'); g.fillStyle = '#1a1a40'; g.beginPath(); g.arc(96, 150, 62, 0, 7); g.fill(); g.fillStyle = '#ff7aa0'; g.beginPath(); g.arc(96, 150, 34, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(70, 124); g.lineTo(78, 96); g.lineTo(90, 122); g.moveTo(102, 122); g.lineTo(114, 96); g.lineTo(122, 124); g.fill(); A.text(g, 'No. 47', 20, 244, '700 16px ' + A.UIF, '#111'); A.text(g, '50p', 172, 244, '700 16px ' + A.UIF, '#111', 'right'); });
  const flip = paint => (g, w, h) => { g.save(); g.translate(0, h); g.scale(1, -1); paint(g, w, h); g.restore(); }; // (round things map pictures upside down here)
  const crispTex = () => K.tex('ch.crisps', 256, 128, flip((g, w, h) => { g.fillStyle = '#2a7ad8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(128, 64, 92, 40, -0.1, 0, 7); g.fill(); A.text(g, 'CRUNCHIES', 128, 62, '34px ' + A.FONT, '#d01a1a', 'center'); A.text(g, 'SALT & VINEGAR', 128, 88, '700 13px ' + A.UIF, '#2a7ad8', 'center'); g.fillStyle = '#e8c040'; g.beginPath(); g.ellipse(214, 100, 18, 12, 0.4, 0, 7); g.fill(); }));
  const canTex = () => K.tex('ch.can', 256, 128, flip((g, w, h) => { g.fillStyle = A.lin(g, 0, 0, 0, h, [[0, '#ff8a10'], [0.5, '#ffb030'], [1, '#e86a00']]); g.fillRect(0, 0, w, h); A.text(g, 'ZING!', 128, 78, '54px ' + A.FONT, '#fff', 'center'); A.text(g, 'ORANGE FIZZ', 128, 104, '700 12px ' + A.UIF, '#7a2a00', 'center'); g.fillStyle = '#c8c8cc'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); }));
  const psTex = () => K.tex('ch.pscase', 256, 224, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = A.lin(g, 0, 20, 0, h, [[0, '#4a1a8a'], [1, '#d0306a']]); g.fillRect(30, 6, w - 36, h - 12); g.fillStyle = '#f4f4f4'; g.fillRect(6, 6, 20, h - 12); A.text(g, 'SPIKE', 140, 90, '44px ' + A.FONT, '#ffd400', 'center'); A.text(g, 'THE STEGOSAUR', 140, 116, '700 15px ' + A.UIF, '#fff', 'center'); g.fillStyle = '#5ad04a'; g.beginPath(); g.ellipse(140, 170, 44, 22, 0, 0, 7); g.fill(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(110 + i * 14, 152); g.lineTo(117 + i * 14, 134); g.lineTo(124 + i * 14, 152); g.fillStyle = '#ffa020'; g.fill(); } });
  const cdTex = () => K.tex('ch.cdface', 128, 128, (g, w, h) => { const gr = g.createConicGradient ? g.createConicGradient(0, 64, 64) : null; if (gr) { ['#e8e8f4', '#ffd8f0', '#d8f0ff', '#f4ffd8', '#ffe8c8', '#e8e8f4'].forEach((c, i) => gr.addColorStop(i / 5, c)); g.fillStyle = gr; } else g.fillStyle = '#e0e4ec'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.fill(); A.text(g, 'NOW 43', 64, 54, '700 14px ' + A.FONT, '#d01a1a', 'center'); A.text(g, "That's what I call music", 64, 70, '7px ' + A.UIF, '#333', 'center'); g.fillStyle = '#c8c8cc'; g.beginPath(); g.arc(64, 64, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(64, 64, 4, 0, 7); g.fill(); }, { clamp: true });
  const MODELS = {
    socks: () => grp(G => { const wm = mat('#ece8de'), gm = mat('#9a9aa0'); G.ball(-3, -2.1, 0, 4.2, 2.1, 3, wm, 12); G.ball(3.5, -2, 1.5, 4, 2, 2.8, wm, 12, { ry: 30 }); G.ball(-5.6, -2.2, 0.5, 1.8, 1.6, 2.4, gm, 8); G.box(5, -1, -4, 9, 1.6, 3.2, wm, { ry: -20 }); G.shadow(0, 0, 0, 18, 12, 0.45); }),
    tshirt: () => cloth('tshirt', 40, 36, 3.5, P.tshirt, 11),
    jeans: () => cloth('jeans', 38, 52, 3, P.jeans, 12),
    shirt: () => cloth('shirt', 40, 38, 3, P.shirt, 13),
    pe: () => cloth('pe', 30, 24, 2.4, P.pe, 14),
    jumper2: () => cloth('jumper2', 44, 40, 4.5, P.jumper2, 15),
    mag1: () => grp(G => { G.box(0, -0.45, 0, 21, 0.9, 28, { t: M({ c: '#fff', map: A.t('mag') }), all: mat('#f0eee8') }); G.box(1, -1.1, 1, 20, 0.4, 27, mat('#f4f2ea'), { ry: 6 }); G.shadow(0, 0, 0, 26, 32, 0.45, { sq: true }); }),
    mag2: () => grp(G => { G.box(0, -0.45, 0, 21, 0.9, 28, { t: M({ c: '#fff', map: A.t('magB') }), all: mat('#f0eee8') }); G.shadow(0, 0, 0, 26, 32, 0.45, { sq: true }); }),
    comic: () => grp(G => { G.box(0, -0.3, 0, 17, 0.6, 26, { t: M({ c: '#fff', map: comicTex() }), all: mat('#f4f0e0') }); G.shadow(0, 0, 0, 22, 30, 0.4, { sq: true }); }),
    crisps: () => grp(G => { G.ball(0, -2.2, 0, 7.5, 2.2, 10, M({ c: '#fff', map: crispTex(), sh: 70, sp: '#888' }), 16); G.box(0, -1.4, 9.8, 14, 0.6, 1.8, mat('#2a7ad8', { sh: 70 })); G.box(0, -1.4, -9.8, 14, 0.6, 1.8, mat('#2a7ad8', { sh: 70 })); G.shadow(0, 0, 0, 18, 24, 0.4); }),
    can: () => grp(G => { G.cyl(0, -3.2, 0, 3.2, 3.2, 11.5, 18, { s: M({ c: '#fff', map: canTex(), sh: 90, sp: '#ccc' }), t: mat('#c8c8cc', { sh: 90 }), u: mat('#c8c8cc') }, { rz: 90, ry: 25 }); G.shadow(0, 0, 0, 14, 9, 0.5); }),
    wrap: () => grp(G => { [['#d01a6a', -4, 0, 10], ['#ffd400', 3, 3, -30], ['#2a9a4a', 1, -4, 60]].forEach(([c, x, z, ry]) => { const m = mat(c, { sh: 90, sp: '#fff' }); G.ball(x, -0.8, z, 2.2, 0.8, 1.2, m, 8, { ry }); G.lathe(x + Math.cos(ry * D2R) * 2.6, -0.8, z - Math.sin(ry * D2R) * 2.6, [[0.2, -0.8], [1.2, 0.8]], 6, m, { rz: 90, ry }); }); G.shadow(0, 0, 0, 14, 12, 0.35); }),
    core: () => grp(G => { G.lathe(0, -3.5, 0, [[0.6, -4], [2.4, -3.2], [1.2, -1.5], [1.1, 0], [1.3, 1.5], [2.6, 3.2], [0.6, 4]], 12, mat('#f0e0a8'), { rz: 90 }); G.ball(-3.6, -3.5, 0, 0.9, 2.4, 2.4, mat('#a02a1a'), 8); G.ball(3.6, -3.5, 0, 0.9, 2.3, 2.3, mat('#a02a1a'), 8); G.cyl(5.4, -3.6, 0, 0.2, 0.2, 2.2, 5, mat('#5a3a1a'), { rz: 80 }); G.shadow(0, 0, 0, 12, 7, 0.4); }),
    paper: () => grp((G, g) => { const geo = new T.IcosahedronGeometry(4, 1), p = geo.attributes.position, r = rnd(31); for (let i = 0; i < p.count; i++) { const k = 0.75 + r() * 0.4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } geo.computeVertexNormals(); G.geo(geo, 0, -3.6, 0, M({ c: '#f4f2ea', flat: true, sh: 4 })); G.shadow(0, 0, 0, 10, 10, 0.45); }),
    plate: () => grp(G => { G.lathe(0, 0, 0, [[12, -1.6], [10.5, -1.3], [7, -0.4], [0.1, -0.4]], 28, mat('#f6f4ee', { sh: 60, sp: '#888' })); G.lathe(0, 0, 0, [[0.1, 0], [7, 0], [12, -1.6]], 28, mat('#e8e4da')); [[3, 2, 20], [-2, 4, -40], [1, -3, 70]].forEach(([x, z, ry]) => G.rbox(x, -1.4, z, 6, 1.2, 1.6, 0.4, mat('#a86a30'), { ry })); for (let i = 0; i < 9; i++) G.box(((i * 37) % 11) - 5, -0.6, ((i * 23) % 9) - 4, 0.6, 0.4, 0.6, mat('#c89050')); G.shadow(0, 0, 0, 26, 26, 0.45); }),
    mug: () => grp(G => { G.cyl(0, -5, 0, 4.2, 4, 10, 18, { s: mat('#2a5ad0', { sh: 60, sp: '#888' }), t: mat('#6a4020'), u: mat('#2a5ad0') }, { open: false }); G.geo(new T.TorusGeometry(2.6, 0.7, 6, 12), 4.6, -5, 0, mat('#2a5ad0', { sh: 60 })); G.cyl(0, -9.6, 0, 3.6, 3.6, 0.3, 16, mat('#7a5030', { sh: 40 })); G.box(0, -6, 4.15, 4, 1, 0.1, mat('#fff')); G.shadow(0, 0, 0, 12, 12, 0.5); }),
    bowl: () => grp(G => { G.lathe(0, 0, 0, [[7.5, -5], [7, -2.5], [4, 0], [0.1, 0]], 22, mat('#f2ece0', { sh: 50, sp: '#666', side: 2 })); G.disc(0, -1.6, 0, 5.4, mat('#f8f4e8')); for (let i = 0; i < 6; i++) G.box(Math.cos(i) * 3, -1.9, Math.sin(i * 1.7) * 3, 1.6, 0.4, 1.3, mat('#e8a830'), { ry: i * 40 }); G.cyl(4, -6, 1, 0.4, 0.4, 9, 6, mat('#c8c8cc', { sh: 90 }), { rz: 70 }); G.shadow(0, 0, 0, 18, 18, 0.5); }),
    cd1: () => grp(G => { G.cyl(0, -0.1, 0, 6, 6, 0.2, 32, { s: mat('#ccc'), t: M({ c: '#fff', map: cdTex(), sh: 120, sp: '#fff' }), u: mat('#d8dce8', { sh: 120, sp: '#fff' }) }); G.shadow(0, 0, 0, 14, 14, 0.35); }),
    cd2: () => grp(G => { G.box(0, -0.6, 0, 14.2, 1.2, 12.4, { t: M({ c: '#fff', map: psTex(), sh: 60, sp: '#666' }), all: mat('#111') }); G.shadow(0, 0, 0, 17, 15, 0.5, { sq: true }); }),
  };
  // where today's mess can lie (the floor: anything on the bed would be under the bed's own click box)
  const SPOTS = [[-30, FY, 112, 20], [40, FY, 152, -35], [-112, FY, 140, 60], [92, FY, 82, 10], [-82, FY, 226, -20], [22, FY, 222, 45], [-150, FY, 182, 80], [-20, FY, 176, 15], [70, FY, 198, -10], [-188, FY, 124, 30], [-62, FY, 148, 30], [-104, FY, 196, -40]];
  function layout(day) { const items = CC.tidyFor(day,sparse), r = CC.rng('chpos|' + day), sp = CC.shuffle(SPOTS, r); return items.map((m, i) => ({ m, at: sp[i % sp.length] })); }

  // ================================================================ TIDY YOUR ROOM
  let tidyR = null, magN = 0, basketPile = null, basketN = 0;
  CK.add({
    id: 'tidy', room: 'bedroom',
    build(r) {
      tidyR = r;
      for (const m of CC.MESS) {
        if(sparse&&['mag','cd'].includes(m.kind))continue;
        const id = 'ch.m.' + m.id;
        CK.thing(id, { obj: MODELS[m.id](), kind: 'mess.' + m.kind, label: m.n, chore: 'tidy', holdD: m.kind === 'clothes' ? 60 : 45, home: { room: 'bedroom', x: 0, y: FY, z: 100, hide: true } });
      }
      // where things go
      CK.snap('ch.s.basket', { room: 'bedroom', x: 110, y: FY - 46, z: 222, r: 34, box: [34, 2, 34], accepts: k => k === 'mess.clothes', hide: true, hint: 'Let go: in the washing basket', onSnap: t => put(t) });
      CK.snap('ch.s.bin', { room: 'bedroom', x: -118, y: FY - 30, z: -42, r: 26, box: [22, 2, 22], accepts: k => k === 'mess.rubbish', hide: true, hint: 'Let go: in the bin', onSnap: t => put(t) });
      CK.snap('ch.s.rack', { room: 'bedroom', x: -234, y: FY - 46, z: -30, r: 28, box: [22, 30, 6], accepts: k => k === 'mess.cd', hide: true, hint: 'Let go: back in the CD rack', onSnap: t => put(t) });
      const pile = CK.snap('ch.s.mags', { room: 'bedroom', x: -144, y: FY - 4, z: 58, r: 30, box: [24, 2, 30], accepts: k => { if (k !== 'mess.mag') return false; pile.pose = { x: -144 + magN * 0.8, y: FY - 2.8 - magN * 1.1, z: 58 + magN * 0.6, ry: -8 + magN * 7 }; return true; }, hint: 'Let go: on the pile of mags', onSnap: t => { magN++; put(t, true); } });
      const receptacles=[['ch.s.basket','washing',44],['ch.s.bin','bin',27]];
      for(const [slot,id]of receptacles)H.SNAPS[slot].enabled=()=>{const target=H.THINGS[id];return !!target&&['rest','snap'].includes(target.st)&&!target.at.hide};
      H.ambient.add(()=>{for(const [slot,id,offset]of receptacles){
        const target=H.THINGS[id],snap=H.SNAPS[slot];if(!target||!snap)continue;
        Object.assign(snap,{room:target.at.room,x:target.at.x,y:target.at.y-offset,z:target.at.z});
        if(id==='washing'&&basketPile){const r=H.ROOMS[target.at.room];if(r&&basketPile.parent!==r.things)r.things.add(basketPile);basketPile.position.set(target.at.x,target.at.y-offset,target.at.z);basketPile.visible=basketN>0&&target.st==='rest'}
      }});
      // the basket fills up as clothes go in
      basketPile = grp(G => { ['#c0202c', '#3a5a8a', '#f2f2ee', '#6a6e74', '#1a2a6a'].forEach((c, i) => G.ball(Math.cos(i * 2.1) * 5, -2 - i * 1.4, Math.sin(i * 2.1) * 5, 9, 3, 7, mat(c), 10, { ry: i * 50 })); });
      basketPile.position.set(110, FY - 44, 222); basketPile.visible = false; r.group.add(basketPile);
      this.lay();
      CK.guard('washing', () => { CK.jack('Washing basket', CK.done('tidy') ? 'Full of my clothes. Mom does the washing on a Monday. Or whenever the basket explodes.' : 'Clothes off the floor go in here. (That\'s half of tidying my room.)'); return true; });
    },
    also: {
      kitchen: () => CK.snap('ch.s.sink', { room: 'kitchen', x: -80, y: GY - 96, z: -26, r: 32, box: [40, 2, 30], accepts: k => k === 'mess.dish', hide: true, hint: 'Let go: in the sink', onSnap: t => { CK.snd.splash(); put(t); } }),
    },
    lay() { // today's mess (and anything already put away stays put away)
      const d = CK.day(), L = layout(d), on = new Set(L.map(x => x.m.id));
      magN = 0;
      for (const m of CC.MESS) {
        const id = 'ch.m.' + m.id, t = CK.MINE[id]; if (!t) continue;
        const it = L.find(x => x.m.id === m.id);
        if (!on.has(m.id)) { t.home = { room: 'bedroom', x: 0, y: FY, z: 100, hide: true }; if (!t.at.hide || t.st === 'held') CK.home(id); CK.lock(id); continue; }
        const [x, y, z, ry] = it.at;
        t.home = { room: 'bedroom', x, y, z, ry };
        if (CK.has('tidy', m.id)) { t.home = Object.assign({}, t.home, { hide: true }); if (m.kind === 'mag') { magN++; const a = CK.S.at[id]; if (a) { t.at = { room: a[0], x: a[1], y: a[2], z: a[3], ry: a[4] };t.snap=a[7]&&H.SNAPS[a[7]]?a[7]:null;t.st=t.snap?'snap':'rest';t.rx=a[5]||0;t.rz=a[6]||0; H.place(t); } } else if (!t.at.hide) CK.home(id, { hide: true }); CK.lock(id,m.kind!=='mag'); continue; }
        CK.lock(id, false);
        if (!CK.S.at[id]) CK.home(id);
      }
    },
    reset() { this.lay(); this.sync(); },
    sync() {
      basketN = CC.tidyFor(CK.day(),sparse).filter(m => m.kind === 'clothes' && CK.has('tidy', m.id)).length;
      if (basketPile) { basketPile.visible = basketN > 0; basketPile.scale.set(1, 0.6 + basketN * 0.4, 1); H.dirty(); }
    },
    take() { return true; }, // (the house's own "tidy" check: this is the real one)
  });
  function put(t, stay) {
    const mid = t.id.slice(5);
    if (!stay) t.home = Object.assign({}, t.at, { hide: true });
    else t.home = Object.assign({}, t.at);
    CK.lock(t.id,!stay); CK.keep(t.id);
    if(stay&&CK.S.at[t.id]){CK.S.at[t.id][5]=t.rx||0;CK.S.at[t.id][6]=t.rz||0;CK.S.at[t.id][7]=t.snap||null;CK.save()}
    const m = CC.MESSID[mid];
    if (m && m.id === 'socks' && Math.random() < 0.35) setTimeout(() => { CK.jack('Socks', 'Two socks went in. Wait: these are two DIFFERENT socks. Where are the other two? (Behind the radiator, probably. The sock monster lives there.)'); }, 300);
    CK.step('tidy', mid);
    CK.MODS.tidy.sync();
  }
  H.on('reading-shelved',t=>{if(t.kind==='mess.mag')put(t,true)});
  CK.R.addClue('radiator', { title: 'Behind the radiator', when: () => CK.has('tidy', 'socks') || CK.done('tidy'), once: true, secret: 'ch.sock', text: 'Behind the radiator: FOUR odd socks, a 1997 Panino sticker and a fluff ball the size of a hamster. So THIS is where they go. The sock monster is real.' });

  // ================================================================ MAKE YOUR BED
  let duv = null, duvBase = null, duvK = { s: 0, f: 0, t: 0, lift: 0 };
  const BED = { x0: 148, x1: 238, z0: -55, z1: 140 };
  const bw = BED.x1 - BED.x0, bl = BED.z1 - BED.z0, bcx = (BED.x0 + BED.x1) / 2, bcz = (BED.z0 + BED.z1) / 2;
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function duvShape() {
    if (!duv) return;
    const p = duv.geometry.attributes.position, W = bw + 14, L = bl - 34;
    for (let i = 0; i < p.count; i++) {
      const x = duvBase[i * 2], y = duvBase[i * 2 + 1], u = x / W + 0.5, v = y / L + 0.5;
      // the way it was left (js/rm-room.js draws exactly this), and the way Mom wants it
      let base = -Math.sin(u * Math.PI) * 6; if (u < 0.08) base += (0.08 - u) * 190; if (u > 0.94) base += (u - 0.94) * 140;
      const wr = -Math.sin(v * 9 + u * 5) * 1.6 - Math.sin(u * 13 - v * 4) * 1.2;
      let neat = -Math.sin(u * Math.PI) * 2.6 - 0.6; if (u < 0.07) neat += (0.07 - u) * 240; if (u > 0.95) neat += (u - 0.95) * 160; if (v > 0.97) neat += (v - 0.97) * 90;
      const b = Math.max(0, Math.min(1, duvK.s * (1 - sstep(0.35, 0.65, u)) + duvK.f * sstep(0.35, 0.65, u)));
      const y2 = base + (neat - base) * b + wr * (1 - duvK.t) * (1 - 0.5 * b) - duvK.lift * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      p.setZ(i,-y2+(duv.geometry.attributes.clothDepth?.getX(i)||0));
    }
    p.needsUpdate=true;duv.geometry.computeVertexNormals();duv.geometry.computeBoundingSphere();H.dirty();
  }
  function pull(which) {
    const key = { pullL: 's', pullR: 'f', smooth: 't' }[which], t0 = performance.now(), ms = 700;
    CK.snd.whoosh();
    H.anims.set('ch.duv', now => { const k = Math.min(1, (now - t0) / ms); duvK[key] = CK.ease(k); duvK.lift = Math.sin(k * Math.PI) * (which === 'smooth' ? 1.5 : 5); duvShape(); return k < 1; });
  }
  let pillowT = null, pjsT = null;
  CK.add({
    id: 'bed', room: 'bedroom',
    build(r) {
      // the duvet: ours now (the room's own one, which is exactly the same shape, is hidden)
      const dtex = A.t('duvet');
      r.group.traverse(o => { if (o.isMesh && o.material && o.material.map === dtex && !o.userData.ch) o.visible = false; });
      const W=bw+14,L=bl-34,geo=K.thicken(new T.PlaneGeometry(W,L,22,30),.8);
      duvBase = new Float32Array(geo.attributes.position.count * 2);
      for (let i = 0; i < geo.attributes.position.count; i++) { duvBase[i * 2] = geo.attributes.position.getX(i); duvBase[i * 2 + 1] = geo.attributes.position.getY(i); }
      const g = new T.Group(); r.group.add(g);
      duv = K.into(g).geo(geo, bcx, 36, bcz + 14, M({ c: '#fff', map: dtex, side: 2 }).clone(), { rx: 90 }); duv.userData.ch = 1;
      // The bed's only pillow starts on the floor, beside the pyjamas.
      const pil = grp(G => { G.rbox(0, -5, 0, 50, 10, 30, 4.8, M({ c: '#fff', map: A.t('pillow'), sh: 8 })); G.ball(0, -7, 0, 22, 4, 12, M({ c: '#fff', map: A.t('pillow'), sh: 8 }), 14); G.shadow(0, 0, 0, 56, 34, 0.5, { sq: true }); });
      pillowT = CK.thing('ch.pillow', { obj: pil, kind: 'pillow', label: 'Pillow (on the floor, obviously)', chore: 'bed', holdD: 70, home: { room: 'bedroom', x: 40, y: FY, z: 72, ry: 80 } });
      pjsT = CK.thing('ch.pjs', { obj: cloth('pjs', 34, 32, 3, P.pjs, 21), kind: 'pjs', label: 'Pyjamas', chore: 'bed', holdD: 55, home: { room: 'bedroom', x: 112, y: FY, z: 150, ry: -20 } });
      CK.snap('ch.s.pillow', { room: 'bedroom', x: 180, y: 0, z: 10, r: 80, box: [80, 2, 120], accepts: k => k === 'pillow', pose: { x: 190, y: 37, z: -33, ry: 0 }, hint: 'Let go: on the bed', onSnap: () => { CK.lock('ch.pillow'); CK.step('bed', 'pillow'); CK.snd.thud(); } });
      CK.snap('ch.s.pjs', { room: 'bedroom', x: 180, y: 0, z: 10, r: 80, box: [80, 2, 120], pose: { x: 188, y: 24, z: -30, ry: 0 }, accepts: k => k === 'pjs', hide: true, hint: 'Let go: under the pillow', onSnap: () => { CK.lock('ch.pjs'); CK.step('bed', 'pjs'); CK.snd.rustle(); } });
      // clicking the bed straightens the duvet (once it's made, the bed is the bed again: there might be something in it)
      CK.guard('bed', () => bedClick());
      this.sync();
    },
    sync() {
      const v = V(), dn = CK.done('bed');
      duvK.s = CK.has('bed', 'pullL') ? 1 : 0; duvK.f = CK.has('bed', 'pullR') ? 1 : 0; duvK.t = CK.has('bed', 'smooth') ? 1 : 0; duvK.lift = 0; duvShape();
      if (pillowT) { if (CK.has('bed', 'pillow')) { pillowT.home = { room: 'bedroom', x: 190, y: 37, z: -33, ry: 0 }; CK.lock('ch.pillow'); if (Math.abs(pillowT.at.x - 190) > 2 || pillowT.at.y !== 37) CK.home('ch.pillow'); } else CK.lock('ch.pillow', false); }
      if (pjsT) { if (CK.has('bed', 'pjs')) { pjsT.home = { room: 'bedroom', x: 112, y: FY, z: 150, hide: true }; CK.lock('ch.pjs'); if (!pjsT.at.hide) CK.home('ch.pjs'); } else CK.lock('ch.pjs', false); }
      void v; void dn;
    },
    reset() { CK.home('ch.pillow'); CK.home('ch.pjs'); this.sync(); },
  });
  function bedClick() {
    if (CK.done('bed')) return false;
    const next = ['pullL', 'pullR', 'smooth'].find(s => !CK.has('bed', s));
    if (!next) return false;
    CK.begin('bed');
    pull(next);
    setTimeout(() => CK.step('bed', next), 380);
    const L = { pullL: 'Grab the edge... and PULL. It flaps up like a parachute.', pullR: 'Now the other side: tuck it in down the side by the wall.', smooth: 'Smooth it all out flat. Look at that. Like a hotel.' };
    CK.jack('Making the bed', L[next] + (next === 'smooth' && !CK.has('bed', 'pillow') ? '<br><small>(The spare pillow\'s still on the floor. And my pyjamas.)</small>' : ''), 3200);
    return true;
  }

  // ================================================================ EMPTY YOUR BIN
  let bag = null, bagOpen = null, bagTied = null, liner = null, binStuff = [];
  CK.add({
    id: 'bin', room: 'bedroom',
    build(r) {
      const binObj = H.SPOTS.bin && H.SPOTS.bin.obj;
      if (binObj) binObj.children.forEach(o => { if (o.isMesh && o.geometry && (o.geometry.type === 'BoxGeometry' || o.geometry.type === 'SphereGeometry')) binStuff.push(o); });
      const bm = mat('#1c1c20', { sh: 70, sp: '#555' });
      const g = new T.Group();
      bagOpen = grp(G => { G.lathe(0, 0, 0, [[10.6, -27.4], [9.6, -26.6], [8.9, -23], [9.1, -14], [8.6, -5], [6.5, -0.8], [0.1, -0.3]], 20, bm.clone ? M({ c: '#1c1c20', sh: 70, sp: '#555', side: 2 }) : bm); G.ball(-3, -21.5, 2, 4, 2.4, 3.5, M({ c: '#fff', map: crispTex() }), 10); G.ball(3, -21, -2, 3, 2.6, 3, mat('#f4f2ea'), 8); G.box(1, -22, 4, 4, 1, 3, mat('#d01a6a', { sh: 80 }), { ry: 30 }); });
      bagTied = grp(G => { G.lathe(0, 0, 0, [[0.6, -34], [2.2, -32], [1.4, -29.5], [5.5, -26], [9.4, -19], [9.6, -10], [8.6, -3], [6, -0.6], [0.1, -0.2]], 20, bm); G.ball(-2.4, -34.5, 0, 2.2, 1.2, 1.4, bm, 8, { rz: 30 }); G.ball(2.4, -34.5, 0, 2.2, 1.2, 1.4, bm, 8, { rz: -30 }); });
      bagTied.visible = false; g.add(bagOpen); g.add(bagTied);
      bag = CK.thing('ch.binbag', { obj: g, kind: 'binbag', label: 'Bin bag', chore: 'bin', holdD: 60, home: { room: 'bedroom', x: -118, y: FY - 0.5, z: -42, ry: 0 } });
      bag.canGrab = () => CK.has('bin', 'tie');
      const sp = H.SPOTS['ch.binbag']; sp.use = true; sp.act = () => { if (!CK.has('bin', 'tie')) return tie(); H.grab('ch.binbag'); };
      sp.label = () => CK.has('bin', 'tie') ? 'Bin bag (tied up: take it downstairs)' : 'Bin bag (full: tie it up)';
      // a fresh bag goes in once the old one's out
      liner = grp(G => { G.lathe(0, 0, 0, [[10.6, -27.4], [9.6, -26.6], [8.4, -24], [8.4, -2], [0.1, -1]], 20, M({ c: '#2a2a30', sh: 70, sp: '#444', side: 2 })); });
      liner.position.set(-118, FY - 0.5, -42); liner.visible = false; r.group.add(liner);
      this.sticky = CK.sticky(r, 'bin', -118, FY - 18, -31.5, { text: 'EMPTY ME! It is ALIVE.', size: 8, rz: -6 });
      this.sync();
    },
    also: {
      kitchen: () => {
        CK.snap('ch.s.kbin', { room: 'kitchen', x: 170, y: GY - 66, z: 20, r: 40, box: [30, 2, 30], accepts: k => k === 'binbag', hide: true, hint: 'Let go: in the kitchen bin', onSnap: () => {
          CK.snd.thud(); CK.lock('ch.binbag'); bag.home = Object.assign({}, bag.at, { hide: true });
          const kb = H.SPOTS['hs.bin'] && H.SPOTS['hs.bin'].obj; if (kb) { const s0 = kb.scale.y; CK.tween(kb, { s: 1 }, 1, {}).then(() => { kb.scale.set(1, s0 * 0.94, 1); setTimeout(() => { kb.scale.set(1, 1, 1); H.dirty(); }, 140); }); }
          CK.step('bin', 'bag'); CK.MODS.bin.sync();
        } });
      },
    },
    sync() {
      const tied = CK.has('bin', 'tie'), gone = CK.has('bin', 'bag') || CK.done('bin');
      if (bagOpen) { bagOpen.visible = !tied; bagTied.visible = tied; }
      if (bag) { if (gone) { bag.home = { room: 'bedroom', x: -118, y: FY - 0.5, z: -42, hide: true }; CK.lock('ch.binbag'); if (!bag.at.hide && bag.st !== 'held') CK.home('ch.binbag'); } else CK.lock('ch.binbag', false); }
      const out = gone || (bag && bag.st === 'held') || (bag && (Math.abs(bag.at.x + 118) > 6 || Math.abs(bag.at.z + 42) > 6));
      if (liner) liner.visible = !!out;
      binStuff.forEach(o => { o.visible = !out || tidyInBin() > 0; });
      if (this.sticky) this.sticky.visible = CK.onList('bin') && !CK.done('bin');
      H.dirty();
    },
    reset() { CK.home('ch.binbag'); this.sync(); },
  });
  H.on('grab', id => { if (id === 'ch.binbag') CK.MODS.bin.sync(); });
  H.on('rest', id => { if (id === 'ch.binbag') CK.MODS.bin.sync(); });
  function tidyInBin() { return CC.tidyFor(CK.day(), sparse).filter(m => m.kind === 'rubbish' && CK.has('tidy', m.id)).length; }
  function tie() {
    CK.begin('bin');
    const g = bag.obj, s0 = 1;
    CK.snd.bag(); CK.secret('ch.knot');
    CK.tween(g, { s: s0 }, 1).then(() => {
      const t0 = performance.now();
      H.anims.set('ch.tie', now => { const k = Math.min(1, (now - t0) / 500); bagOpen.scale.set(1 - k * 0.3, 1 + k * 0.15, 1 - k * 0.3); if (k >= 1) { bagOpen.scale.set(1, 1, 1); CK.step('bin', 'tie'); CK.MODS.bin.sync(); return false; } return true; });
    });
    CK.jack('Bin bag', 'Twist, twist, double knot. Now it\'s a proper bin bag. It smells of crisps and regret. Take it down to the kitchen bin.', 4500);
    return true;
  }

  // ================================================================ FEED THE CAT
  let bowl = null, bowlFill = null, catBox = null, catHome = null, catBusy = false;
  const BOWL = { x: 122, z: 112 };
  CK.add({
    id: 'cat', room: 'bedroom',
    build(r) {
      bowl = grp(G => { const shell=G.lathe(0, 0, 0, [[0,0],[10,0],[9.4,-3.8],[8.6,-4.6],[8,-4.2],[7.4,-1.2],[0,-1.2],[0,0]].reverse(), 24, mat('#ac4476',{sh:25,sp:'#483344'}));const p=shell.geometry.attributes.position,n=shell.geometry.attributes.normal;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)+1.2)<.001)n.setXYZ(i,0,-1,0); G.shadow(0, 0, 0, 24, 24, 0.5); });
      bowl.position.set(BOWL.x, FY, BOWL.z); r.group.add(bowl);
      const nameTex = K.tex('ch.bowlname', 128, 32, (g, w, h) => { g.fillStyle='#a92f70';g.fillRect(0,0,w,h); A.text(g, CK.cast('{cat}').toUpperCase(), 64, 24, '700 20px ' + A.FONT, '#fff', 'center'); }, { clamp: true });
      const band=new T.PlaneGeometry(10,2.5,24,1),bp=band.attributes.position,bu=band.attributes.uv;
      for(let i=0;i<bp.count;i++){const y=bp.getY(i)-2.3,a=bp.getX(i)/10,r=10+y*.158+.09;bp.setXYZ(i,Math.sin(a)*r,y,Math.cos(a)*r);bu.setY(i,1-bu.getY(i))}band.computeVertexNormals();
      K.into(bowl).geo(K.thicken(band,.06),0,0,0,M({c:'#fff',map:nameTex,sh:14,sp:'#332631'}));
      bowlFill = grp(G => { const r2 = rnd(77); for (let i = 0; i < 26; i++) { const a = r2() * Math.PI * 2, d = Math.sqrt(r2()) * 6.2; G.ball(Math.cos(a) * d, -1.6 - r2() * 1.6 - (6.2 - d) * 0.25, Math.sin(a) * d, 1.1, 0.8, 1.1, mat(['#a0642a', '#8a4a1a', '#c08040'][i % 3], { sh: 20 }), 6); } });
      bowl.add(bowlFill); bowlFill.visible = false;
      CK.spot(r, 'ch.bowl', bowl, { label: () => `${CK.cast('{cat}')}'s bowl`, act: () => CK.jack(CK.cast('{cat}\'s bowl'), CK.has('cat', 'pour') ? 'Full of biscuits. Now give {cat} a shout (click {cat.him} on the bed).'.replace(/\{[^}]+\}/g, x => CK.cast(x)) : CK.cast('Empty. {cat} keeps looking at it, then at me. The cat biscuits are on my desk.')) });
      // the cat biscuits
      const boxTex = K.tex('ch.catbox', 128, 192, (g, w, h) => { g.fillStyle = '#7a2a9a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, 44); A.text(g, 'KITTY', 64, 34, '34px ' + A.FONT, '#7a2a9a', 'center'); A.text(g, 'CRUNCH', 64, 80, '32px ' + A.FONT, '#fff', 'center'); g.fillStyle = '#ff9a3a'; g.beginPath(); g.arc(64, 130, 30, 0, 7); g.fill(); g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(40, 112); g.lineTo(44, 88); g.lineTo(58, 104); g.moveTo(70, 104); g.lineTo(84, 88); g.lineTo(88, 112); g.fill(); g.fillStyle = '#111'; g.fillRect(52, 124, 6, 6); g.fillRect(70, 124, 6, 6); A.text(g, 'with real tuna*', 64, 182, '10px ' + A.UIF, '#ffd400', 'center'); });
      const cb = grp(G => { G.box(0, -8, 0, 11, 16, 4.5, { f: M({ c: '#fff', map: boxTex }), b: M({ c: '#fff', map: boxTex }), all: mat('#6a2a8a') }); G.box(0,-16.12,-1.12,11,.24,2.24,mat('#d4ac2c'));G.box(0,-16.17,1.1,11,.24,2.18,mat('#e5bd34'));G.box(0,-16.32,0,10.4,.15,.28,mat('#9b7927'));G.box(-5.51,-8,0,.08,15,3.6,mat('#592071')); G.shadow(0, 0, 0, 14, 8, 0.5, { sq: true }); });
      catBox = CK.thing('ch.catbox', { obj: cb, kind: 'catfood', label: 'Cat biscuits', chore: 'cat', holdD: 45, home: { room: 'bedroom', x: 64, y: 0, z: 4, ry: 20 }, useLabel: 'Shake some out', use: () => shake() });
      const cat = H.SPOTS.cat && H.SPOTS.cat.obj;
      if (cat) { catHome = { x: cat.position.x, y: cat.position.y, z: cat.position.z, ry: cat.rotation.y }; CK.guard('cat', () => callCat()); }
      this.sticky = CK.sticky(r, 'cat', BOWL.x, FY - 0.2, BOWL.z + 16, { text: 'Feed {cat}! (NOT ham)', size: 8, rx: -88 });
      this.sync();
    },
    sync() {
      const poured = CK.has('cat', 'pour'), ate = CK.has('cat', 'ate');
      if (bowlFill && !catBusy) { bowlFill.visible = poured && !ate; bowlFill.scale.set(1, 1, 1); }
      if (this.sticky) this.sticky.visible = CK.onList('cat') && !CK.done('cat');
      H.dirty();
    },
    reset() { CK.home('ch.catbox'); this.sync(); },
  });
  function shake() {
    if (CK.done('cat') || CK.has('cat', 'pour')) return CK.jack('Cat biscuits', CK.cast('{cat}\'s had {cat.his} tea. Any more and {cat.he}\'ll be too fat to fit through the window.'));
    const p = catBox.obj.position, d = Math.hypot(p.x - BOWL.x, p.z - BOWL.z);
    CK.begin('cat');
    if (d > 42) { CK.snd.rustle(); CK.fx.burst(CK.MODS.cat._r || H.ROOMS.bedroom, p.x, p.y, p.z, { n: 6, col: '#a0642a', size: 1.6, life: 1.1, spd: 12, up: 5, grav: 300, floor: FY - 0.3, fade: false }); CK.oops('cat'); return CK.jack('Cat biscuits', 'Oops. Biscuits on the carpet. Over the BOWL, Jack. (Walk to the bowl by the bed and shake them in.)'); }
    const r = H.ROOMS.bedroom; let n = 0;
    CK.snd.rustle(); setTimeout(CK.snd.rustle, 300); setTimeout(CK.snd.rustle, 600);
    const iv = setInterval(() => { CK.fx.burst(r, p.x, p.y + 2, p.z, { n: 5, col: '#9a5a24', size: 1.5, life: 0.9, spd: 4, up: -5, grav: 700, floor: FY - 2.5, fade: false, to: [BOWL.x, FY - 3, BOWL.z] }); if (++n >= 7) clearInterval(iv); }, 140);
    setTimeout(() => { bowlFill.visible = true; bowlFill.scale.set(1, 0.2, 1); CK.tween(bowlFill, { s: 1 }, 400); CK.step('cat', 'pour'); CK.jack('Cat biscuits', CK.cast('Rattle rattle. One ear on the bed just twitched. Now give {cat} a shout: click {cat.him}.'), 4500); }, 900);
  }
  function callCat() {
    if (catBusy) return true;
    if (!CK.has('cat', 'pour') || CK.has('cat', 'ate')) return false;
    const cat = H.SPOTS.cat.obj; catBusy = true;
    CK.step('cat', 'call');
    CK.jack(CK.cast('{cat}'), CK.cast('"Psss psss psss! {cat}! DINNER!" One eye opens. Then the other. Then {cat.he} remembers {cat.he}\'s a cat and takes {cat.his} time about it.'), 5000);
    const ry = 24 * D2R;
    setTimeout(() => {
      CK.snd.thud();
      CK.tween(cat, { x: BOWL.x + 19, y: FY, z: BOWL.z - 7, ry }, 650, { arc: 18 }).then(() => {
        CK.snd.thud(); CK.fx.burst(H.ROOMS.bedroom, cat.position.x, FY - 1, cat.position.z, { n: 10, col: '#c8c0b0', size: 2.2, life: 0.8, spd: 25, up: 4, grav: 30, op: 0.5 });
        const t0 = performance.now(), dur = 5200;
        let lastC = 0;
        H.anims.set('ch.eat', now => {
          const k = Math.min(1, (now - t0) / dur);
          cat.rotation.z = Math.sin(now / 160) * 0.05 + 0.08; cat.position.y = FY + Math.abs(Math.sin(now / 160)) * -0.4;
          bowlFill.scale.set(1, Math.max(0.05, 1 - k), 1);
          if (now - lastC > 420) { lastC = now; CK.snd.crunch(); }
          if (k < 1) return true;
          cat.rotation.z = 0; bowlFill.visible = false;
          CK.step('cat', 'ate'); CK.snd.purr(); CK.secret('ch.purr');
          CK.jack(CK.cast('{cat}'), CK.cast('Every last biscuit. {cat.He} licked the bowl, licked {cat.his} paws, and now {cat.he}\'s purring like a moped.'), 5000);
          setTimeout(() => { CK.tween(cat, { x: catHome.x, y: catHome.y, z: catHome.z, ry: catHome.ry }, 700, { arc: 22 }).then(() => { catBusy = false; CK.snd.thud(); }); }, 2600);
          return false;
        });
      });
    }, 1400);
    return true;
  }

  // ================================================================ WATER YOUR PLANT (on the windowsill, by the dead cactus)
  const POT = { x: 170, y: -14, z: -52 };
  let plant = null, leaves = null, soil = null, deadLeaves = [], canT = null, plantR = null, turning = false, pouring = false;
  function ribbon(pts, w0, w1, m) { // a leaf: a strip along a curve, wide at the base, pointed at the tip
    const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), N = 10, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = c.getPoint(t), tg = c.getTangent(t), side = new T.Vector3(-tg.z, 0, tg.x).normalize(), w = (w0 + (w1 - w0) * t) / 2; pos.push(p.x - side.x * w, p.y, p.z - side.z * w, p.x + side.x * w, p.y, p.z + side.z * w); uv.push(0, t, 1, t); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return new T.Mesh(g, m);
  }
  CK.add({
    id: 'plant', room: 'bedroom',
    build(r) {
      plantR = r;
      plant = new T.Group(); plant.position.set(POT.x, POT.y, POT.z); r.group.add(plant);
      const PG = K.into(plant);
      PG.lathe(0, 0, 0, [[8.2, -11.5], [8.4, -10], [7.6, -9.6], [5.6, 0], [0.1, 0]], 22, mat('#b8582a', { sh: 14 }));
      PG.cyl(0, -0.5, 0, 8.6, 8.6, 1, 22, mat('#a04a22')); PG.shadow(0, 0, 0, 22, 22, 0.55);
      soil = PG.disc(0, -10.4, 0, 7.6, M({ c: '#9a7a5a', sh: 4 }).clone());
      const lm = M({ c: '#fff', map: K.tex('ch.leaf', 16, 64, (g, w, h) => { g.fillStyle = '#3a8a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8f0c8'; g.fillRect(6, 0, 4, h); g.fillStyle = '#2a6a1a'; g.fillRect(0, 0, 2, h); g.fillRect(14, 0, 2, h); }), side: 2, sh: 30, sp: '#333' });
      leaves = new T.Group(); leaves.position.y = -10.5; plant.add(leaves);
      const rr = rnd(9);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2 + rr() * 0.3, len = 16 + rr() * 12, up = 8 + rr() * 10, out = len;
        const ca = Math.cos(a), sa = Math.sin(a);
        leaves.add(ribbon([[ca * 1, 0, sa * 1], [ca * out * 0.35, -up, sa * out * 0.35], [ca * out * 0.75, -up * 0.85, sa * out * 0.75], [ca * out, -up * 0.2 + 6, sa * out]], 1.6, 0.2, lm));
      }
      // three brown leaves to pick off
      const dm = M({ c: '#b8903a', side: 2, sh: 10 });
      [[0.7, 20], [2.6, 18], [4.6, 22]].forEach(([a, len], i) => {
        const ca = Math.cos(a), sa = Math.sin(a), lg = new T.Group(); leaves.add(lg);
        lg.add(ribbon([[ca, 0, sa], [ca * len * 0.4, -9, sa * len * 0.4], [ca * len * 0.8, -6, sa * len * 0.8], [ca * len, 4, sa * len]], 1.5, 0.3, dm));
        const pk = new T.Mesh(new T.BoxGeometry(9, 9, 9), new T.MeshBasicMaterial({ visible: false })); pk.position.set(ca * len * 0.7, -5, sa * len * 0.7); lg.add(pk);
        deadLeaves.push(lg);
      });
      CK.spot(r, 'ch.pot', plant, { label: "Gran's spider plant", act: () => turnPot() });
      deadLeaves.forEach((lg, i) => H.spot('ch.leaf' + i, { obj: lg, room: 'bedroom', label: 'A brown leaf (pick it off)', range: 240, act: () => pluck(i) })); // (after the pot: the leaves are their own spots)
      // the watering can
      const can=grp((G,model)=>{
        model.name='watering-can';
        const green=mat('#387b4e',{sh:28,sp:'#354d3c'}),dark=mat('#285c3a',{sh:20}),brass=mat('#ab925b',{sh:38,sp:'#5d5643'});
        // A closed wall section: rolled fill opening, inner wall and solid base.
        G.lathe(0,0,0,[[0,0],[5.6,0],[6.4,-1.2],[7,-4],[7,-11],[6.2,-14.6],[4.6,-16],[3.5,-16],[3.5,-15.3],[5.55,-14],[6.3,-10.8],[6.3,-4],[5.65,-1],[0,-1],[0,0]].reverse(),28,green,{sz:.72});
        G.disc(0,-11.8,0,5.85,mat('#466660',{sh:55,sp:'#788e83'}),28,{sy:.72});
        G.geo(new T.TorusGeometry(3.55,.25,8,28),0,-15.9,0,dark,{rx:90,sy:.72});
        const pipe=new T.Shape();pipe.absarc(0,0,1,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,.65,0,Math.PI*2,true);pipe.holes.push(hole);
        const path=new T.CatmullRomCurve3([new T.Vector3(5.4,-5.2,0),new T.Vector3(9,-7,0),new T.Vector3(13,-12,0),new T.Vector3(17,-15.6,0)]);
        G.geo(new T.ExtrudeGeometry(pipe,{extrudePath:path,steps:14,bevelEnabled:false,curveSegments:10}),0,0,0,green);
        // Both handle ends enter the body; no floating half-torus.
        const handle=new T.CatmullRomCurve3([new T.Vector3(-5.8,-13.6,0),new T.Vector3(-11,-14,0),new T.Vector3(-14,-10,0),new T.Vector3(-12,-4,0),new T.Vector3(-6,-2.4,0)]);
        G.geo(new T.TubeGeometry(handle,18,.85,10,false),0,0,0,dark);
        for(const y of [-11,-9.5,-8])G.rbox(-13.5,y,0,1.8,.35,1.9,.15,green);
        const rose=new T.Group();rose.position.set(17,-15.6,0);rose.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(4,-3.6,0).normalize());model.add(rose);const R=K.into(rose);
        R.cyl(0,0,0,1.05,2.25,2,20,brass);R.cyl(0,1.04,0,2.3,2.3,.14,20,dark);
        for(let n=0;n<13;n++){const a=n*Math.PI*2/12,r=n===12?0:1.55;R.cyl(Math.cos(a)*r,1.12,Math.sin(a)*r,.13,.13,.05,6,mat('#22372a'))}
        G.shadow(0,0,0,31,13,.45);
      });
      canT = CK.thing('ch.can', { obj: can, kind: 'can', label: 'Watering can (full)', chore: 'plant', holdD: 48, home: { room: 'bedroom', x: 128, y: FY, z: 22, ry: 200 }, useLabel: 'Pour', use: () => pour() });
      this.sticky = CK.sticky(r, 'plant', POT.x, POT.y - 5, POT.z + 7.4, { text: 'Water me! x the plant', size: 7, ry: 0, sign: false });
      this.sync();
    },
    sync() {
      const wet = CK.has('plant', 'water');
      if (soil) { soil.material.color.set(wet ? '#3a2416' : '#9a7a5a'); }
      if (leaves) { leaves.scale.set(1, wet ? 1 : 0.62, 1); leaves.rotation.x = wet ? 0 : 0.05; }
      deadLeaves.forEach((l, i) => { const gone = CK.has('plant', 'leaf' + i); l.visible = !gone; if (H.SPOTS['ch.leaf' + i]) H.SPOTS['ch.leaf' + i].off = gone; });
      if (plant && !turning) plant.rotation.y = CK.has('plant', 'turn') ? Math.PI : 0;
      if (this.sticky) this.sticky.visible = CK.onList('plant') && !CK.done('plant');
      H.dirty();
    },
    reset() { CK.home('ch.can'); this.sync(); },
  });
  function pluck(i) {
    if (CK.has('plant', 'leaf' + i)) return;
    CK.begin('plant');
    const l = deadLeaves[i]; CK.snd.rustle();
    H.SPOTS['ch.leaf' + i].off = true;
    CK.tween(l, { y: 30, rz: 0.8 }, 700).then(() => { l.visible = false; l.position.y = 0; l.rotation.z = 0; CK.step('plant', 'leaf' + i); });
    if (i === 0) CK.jack("Gran's spider plant", 'Pick, pick. Dead leaves off. Gran says talking to plants helps. I\'m not talking to it. ...Alright, I said "hello".', 4000);
  }
  function turnPot() {
    if (CK.has('plant', 'turn') || CK.done('plant')) return CK.jack("Gran's spider plant", CK.has('plant', 'water') ? 'Happy plant. Leave it alone now.' : 'It looks thirsty. The watering can\'s on the floor by my bedside table.');
    CK.begin('plant'); turning = true;
    CK.snd.rustle();
    CK.tween(plant, { ry: Math.PI }, 900).then(() => { turning = false; CK.step('plant', 'turn'); CK.jack("Gran's spider plant", 'Turned round, so the other side gets the light from the window. Plants. Who knew.', 3500); });
  }
  function pour() {
    if (pouring) return; const p = canT.obj.position, d = Math.hypot(p.x - POT.x, p.z - POT.z), r = H.ROOMS.bedroom;
    const cactus = Math.hypot(p.x - 216, p.z + 53) < 45;
    CK.snd.pour(1.4); pouring = true; setTimeout(() => { pouring = false; }, 1500);
    const to = d < 50 ? [POT.x, POT.y - 10.5, POT.z] : cactus ? [216, -16, -53] : [p.x + 8, FY - 0.3, p.z];
    const tip = () => { const v = new T.Vector3(17.85, -16.37, 0); canT.obj.localToWorld(v); return [v.x, -v.y, v.z]; };
    let n = 0; const iv = setInterval(() => { CK.fx.stream(r, tip(), to); if (++n > 14) clearInterval(iv); }, 90);
    if (d < 50) {
      if (CK.has('plant', 'water')) return setTimeout(() => CK.jack("Gran's spider plant", 'It\'s had enough. Any more and it\'ll be a swimming pool.'), 600);
      CK.begin('plant');
      setTimeout(() => { CK.step('plant', 'water'); CK.MODS.plant.sync(); leaves.scale.y = 0.62; CK.tween(leaves, { s: 1 }, 1, {}).then(() => { const t0 = performance.now(); H.anims.set('ch.perk', now => { const k = Math.min(1, (now - t0) / 1200); leaves.scale.set(1, 0.62 + 0.38 * CK.ease(k), 1); return k < 1; }); }); CK.jack("Gran's spider plant", 'Glug glug. The soil goes dark and the leaves perk up. You can practically hear it say "about TIME".', 4000); }, 1300);
    } else if (cactus) {
      CK.secret('ch.cactus'); setTimeout(() => CK.jack('The cactus', 'Watered the dead cactus. It\'s been dead since 1997. Never give up, little guy.'), 900);
    } else {
      CK.oops('plant'); setTimeout(() => CK.jack('Watering can', 'That was the carpet. The carpet does not need watering. (Hold it over the plant on the windowsill.)'), 700);
    }
  }

  // ================================================================ Mom's list on the wall (above the foot of the bed, by the door)
  CK.add({ id: '_list.bed', room: 'bedroom', build(r) { CK.paper(r, 239.2, -46, 112, -90, { id: 'ch.list.bedroom', w: 22 }); } });
})();

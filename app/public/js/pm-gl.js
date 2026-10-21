/* pm-gl: Jack's physical media as real things in his (WebGL) room. js/pm-media.js is the PC side (what you own, drive
 * D: = discs.js's jhp_discs.cd, drive A:), js/pm-art.js draws the artwork, the room engine is js/hs-world.js through
 * js/rm-room.js's window.Room grab API. Here:
 *   - the games shelf: a beech-effect flat-pack bookcase against the left wall (between the CD rack and the wardrobe):
 *     big-box PC games, jewel cases and magazines stand upright in reserved spine-out slots
 *   - the floppy box on the desk (a snap: drop a floppy on it and it goes in; click it and the next one comes out)
 *   - parcels from the Pixel Post mail order, on the floor in front of the shelf
 * Everything is a grabbable thing: pick it up, carry it, put it down anywhere. A box or a jewel case opens on a real
 * hinge and the disc is its own thing: F (or the button) while you hold the box opens it and lifts the disc out. Put the
 * disc on the PC's open CD tray ('pc.cd', rm-room.js) and shut it: the PC has it in drive D:. Floppies go in 'pc.floppy'.
 * Whatever the PC does (Eject in My Computer, the "lean back and grab a disc" window on a phone) the room follows:
 * the disc goes back in its case, or into the drive.
 * Thing ids: pmb.<item> (box / case / mag / sleeve / cart), pmd.<item> (its disc), pmf.<floppy id>. */
(function () {
  'use strict';
  const R = window.Room, PM = window.PM, D = window.Discs, A = window.PMArt;
  if (!R || !R.grabbable || !PM || !D || !A || window.PMGL) return;
  const H = R.House; if (!H || !H.ok) return;
  const T = R.T, K = R.K, M = K.mat;
  const D2R = Math.PI / 180;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const secret = id => { try { Apps.secret(id); } catch (e) {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, x, ms) => { try { R.say(t, x, ms); } catch (e) {} };

  // ================================================================ artwork -> textures (SVG drawn onto canvases, with the site's fonts inside)
  let FONTS = null;
  const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const fonts = () => FONTS || (FONTS = Promise.all(['anton', 'bangers'].map(n => fetch('fonts/' + n + '.woff2').then(r => r.arrayBuffer()).then(b64)))
    .then(([a, b]) => ({ Anton: `@font-face{font-family:Anton;src:url(data:font/woff2;base64,${a})}`, Bangers: `@font-face{font-family:Bangers;src:url(data:font/woff2;base64,${b})}` })).catch(() => ({})));
  const TEX = {}, QUEUE = [];
  let loadingPanel = null;
  function prepareArtwork() {
    if (loadingPanel) return;
    const panel = loadingPanel = document.createElement('div'); panel.className = 'hs-loading';
    panel.innerHTML = '<b>PREPARING ROOM</b><span>Loading game artwork</span><div class="hs-load-track"><i></i></div>';
    panel.setAttribute('role', 'status'); H.ui.el.appendChild(panel); H.emit('loading', true);
    const start = performance.now(); let total = Math.max(1, QUEUE.length + busyRaster);
    const check = () => {
      total = Math.max(total, QUEUE.length + busyRaster);
      panel.querySelector('i').style.width = (100 * (1 - (QUEUE.length + busyRaster) / total)) + '%';
      if (QUEUE.length || busyRaster) {if (performance.now() - start < 12000) return setTimeout(check, 40);}
      // Texture uploads belong to loading, not the first frame the player turns toward a shelf.
      try { for (const t of Object.values(TEX)) if (H.ren.initTexture) H.ren.initTexture(t); }
      finally { panel.remove(); loadingPanel = null; H.emit('loading', false); H.dirty(); }
    };
    setTimeout(check, 0);
  }
  let busyRaster = 0;
  const LANES = 3;
  function pump() { // Begin immediately; unrelated page images must not hold the room's artwork hostage.
    if (busyRaster >= LANES || !QUEUE.length) return;
    busyRaster++; const job = QUEUE.shift();
    if (QUEUE.length) setTimeout(pump, 0);
    fonts().then(F => {
      let s = '';
      try { s = typeof job.svg === 'function' ? job.svg() : job.svg; } catch (e) { console.warn('[pm] art', job.key, e); busyRaster--; setTimeout(pump, 0); return; }
      const css = Object.keys(F).filter(f => s.includes(f)).map(f => F[f]).join(''); // (only the fonts it uses)
      s = s.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"').replace(/^(<svg[^>]*>)/, '$1' + (css ? '<style>' + css + '</style>' : ''));
      const img = new Image();
      const done = () => { busyRaster--; setTimeout(pump, 0); };
      job.started = true;
      const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      img.onload = () => { try { const g = job.t.userData.g; g.clearRect(0, 0, job.w, job.h); g.drawImage(img, 0, 0, job.w, job.h); job.t.needsUpdate = true; H.dirty(); } catch (e) {} URL.revokeObjectURL(url); done(); };
      img.onerror = () => { URL.revokeObjectURL(url); done(); };
      img.src = url;
    });
  }
  function svgTex(key, w, h, svg, fill) {
    if (TEX[key]) return TEX[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = fill || '#444'; g.fillRect(0, 0, w, h);
    // A readable printed cover remains if an image cannot decode; never a grey box.
    const it = PM.items().find(it => key.endsWith('.' + it.id));
    if (it) {
      g.fillStyle = it.c1 || '#172d49'; g.fillRect(0, 0, w, h);
      g.fillStyle = it.c3 || '#cda94b'; g.fillRect(0, 0, w, h * .12);
      g.fillStyle = it.c2 || '#f5e8c9'; g.font = `bold ${Math.max(9, Math.min(w / 9, h / 8))}px Arial`; g.textAlign = 'center';
      K.wrapText(g, it.title.toUpperCase(), w / 2, h * .3, w * .86, Math.max(12, h * .12));
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.anisotropy = 4; t.minFilter = T.LinearMipmapLinearFilter;
    t.userData = { g, canvas: c };
    QUEUE.push({ t, w, h, svg, key }); pump();
    return TEX[key] = t;
  }
  // the thing in your hands gets its pictures first
  function bump(id) { const mine = QUEUE.filter(j => j.key.endsWith('.' + id) || j.key.includes('.' + id + '.')); if (!mine.length) return; for (const j of mine) QUEUE.splice(QUEUE.indexOf(j), 1); QUEUE.unshift(...mine); }
  const mat = (key, w, h, svg, o) => M(Object.assign({ c: '#ffffff', map: svgTex(key, w, h, svg, (o && o.fill) || '#555') }, o && o.m));
  const GLOSS = { sh: 60, sp: '#3a3a3a' }, PLASTIC = { sh: 90, sp: '#5a5a5a' };

  // ================================================================ the models (house coordinates: cm, y down, origin at the bottom centre)
  const lidFor = new Map(); // obj -> { pivot, max, k }
  function hinge(g, x, z, max) { const p = new T.Group(); p.position.set(x, 0, z); g.add(p); return { pivot: p, max, k: 0 }; }
  function bigBox(it) {
    const g = new T.Group(), w = 19, h = 24, d = 5, B = K.into(g), id = it.id;
    const edge = M(A.tint(it.c1 || '#333', -0.3));
    B.box(0, -h / 2, -0.1, w, h, d - 0.2, { l: mat('pm.sp.' + id, 64, 320, () => A.spineBig(it), { m: GLOSS }), t: mat('pm.tp.' + id, 256, 64, () => A.topBig(it)), b: M(A.tint(it.c1 || '#333', -0.2)), r: edge, u: edge, f: M('#141414') });
    B.box(0, -h / 2 + 1, d / 2 - 0.35, w - 1.2, h - 2.5, 0.2, M('#0c0c0c'));            // the black plastic tray inside
    const L = hinge(g, -w / 2, d / 2 - 0.08, -150);
    K.into(L.pivot).box(w / 2, -h / 2, 0, w, h, 0.16, { f: mat('pm.fr.' + id, 256, 324, () => A.frontBig(it, 200, 270), { m: GLOSS }), b: M(A.tint(it.c1 || '#333', -0.45)), all: edge });
    B.shadow(0, 0, 0, w + .6, d + .5, 0.32, { sq: true });
    lidFor.set(g, L); g.userData.back = () => mat('pm.bk.' + id, 256, 324, () => A.backBig(it), { m: GLOSS }); g.userData.backFace = 'b';
    g.userData.edges = () => [mat('pm.ed.' + id, 64, 320, () => A.edgeBig(it, 50, 240)), mat('pm.eu.' + id, 256, 64, () => A.edgeBig(it, 190, 50))]; // (the outer edge and the bottom: printed too, drawn on the first pick-up)
    return g;
  }
  function jewel(it) {
    const g = new T.Group(), w = 14.2, h = 12.5, d = 1.0, B = K.into(g), id = it.id, clear = it.kind === 'cdr' || it.id === 'pm.mix';
    const plastic = M({ c: '#cfd6de', o: 0.45, sh: 120, sp: '#ffffff' });
    B.box(0, -h / 2, -0.15, w, h, d - 0.3, { l: mat('pm.js.' + id, 32, 256, () => A.inlaySpine(it), { m: PLASTIC }), b: M('#202020'), t: plastic, u: plastic, r: plastic, f: M('#151515') });
    const L = hinge(g, -w / 2 + 0.3, d / 2 - 0.1, -112);
    const lidMesh = K.into(L.pivot).box(w / 2 - 0.3, -h / 2, 0, w, h, 0.12, { f: clear ? M({ c: '#ffffff', map: svgTex('pm.jf.' + id, 284, 250, () => A.jewelFront(it, true), '#dfe6ee'), tr: true, o: 0.5, sh: 120, sp: '#ffffff', dw: false }) : mat('pm.jf.' + id, 284, 250, () => A.jewelFront(it, false), { m: PLASTIC }), b: clear ? M({ c: '#dfe6ee', o: 0.3 }) : M('#f4f1e8'), all: plastic });
    if (clear) K.into(g).plane(0.3, -h / 2, 0.24, 12, 12, M({ c: '#fff', map: svgTex('pm.dl.' + id, 256, 256, () => A.discLabel(it), '#d8d2b0') })); // (no inlay: you see the disc through the lid)
    B.shadow(0, 0, 0, w + .4, d + .3, 0.28, { sq: true });
    lidFor.set(g, L);
    if (!clear) g.userData.lazy = () => { const base = g.children.find(m => m.isMesh && Array.isArray(m.material)); if (base) { base.material = base.material.slice(); base.material[5] = mat('pm.jb.' + id, 256, 200, () => A.inlayBack(it), { m: PLASTIC }); } if (lidMesh && Array.isArray(lidMesh.material)) { lidMesh.material = lidMesh.material.slice(); lidMesh.material[5] = mat('pm.jbk.' + id, 256, 220, () => A.booklet(it)); } }; // (the back and the booklet: drawn when you first pick it up)
    return g;
  }
  function sleeve(it) {
    const g = new T.Group(), w = 12.6, h = 12.6, d = 0.3, art = it.box ? () => D.front(it.box).replace('<svg ', '<svg preserveAspectRatio="none" ') : () => A.insertArt(it);
    K.into(g).box(0, -h / 2, 0, w, h, d, { f: mat('pm.sv.' + it.id, 256, 256, art), all: M('#e8e6dc') });
    K.into(g).shadow(0, 0, 0, w + 3, 4, 0.5, { sq: true });
    return g;
  }
  function cart(it) {
    const g = new T.Group(), w = 11.6, h = 2, d = 7.6;
    K.into(g).rbox(0, -h / 2, 0, w, h, d, 0.4, M('#8a8a8a'));
    K.into(g).box(0, -h - 0.01, 0, w - 1.6, 0.02, d - 1.6, { t: mat('pm.ct.' + it.id, 256, 168, () => D.front(it.box).replace('<svg ', '<svg preserveAspectRatio="none" ')) , all: M('#888') });
    K.into(g).shadow(0, 0, 0, w + 3, d + 3, 0.5, { sq: true });
    return flat(g, 5);
  }
  function magModel(it) {
    const g = new T.Group(), w = 21, h = 26.5, d = 0.7;
    const pages = M({ c: '#f2efe4', map: K.tex('pm.pages', 8, 64, (c, W, H2) => { c.fillStyle = '#f4f1e6'; c.fillRect(0, 0, W, H2); c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H2; y += 3) c.fillRect(0, y, W, 1); }) });
    K.into(g).box(0, -h / 2, 0, w, h, d, { b: mat('pm.mb.' + it.id, 210, 280, () => A.magBack(it)), l: mat('pm.ms.' + it.id, 24, 320, () => A.svg('0 0 24 320', '<rect width="24" height="320" fill="#a51924"/>' + A.T(12, 26, 'JA', 14, '#ffe6a0') + `<g transform="translate(16 160) rotate(-90)">${A.T(0, 0, PM.MONTHS[it.m - 1].toUpperCase() + ' 1999', 12, '#fff')}</g>`)), all: pages });
    const withDisc = PM.where(it.id) === 'shelf';
    const cover = (on) => mat('pm.mc.' + it.id + (on ? '.d' : ''), 252, 336, () => A.magCover(it, on), { m: GLOSS });
    const plane = K.into(g).box(0, -h / 2, d / 2 + 0.025, w, h, 0.05, {f: cover(withDisc), all: pages});
    g.userData.cover = on => { plane.material[4] = cover(on); H.dirty(); };
    K.into(g).shadow(0, 0, 0, w + 1, d + 0.4, 0.35, { sq: true });
    return g;
  }
  function discModel(it) {
    const g = new T.Group();
    const rainbow = M({ c: '#ffffff', sh: 140, sp: '#ffffff', map: K.tex('pm.rainbow', 128, 128, (c, w, h) => { const gr = c.createConicGradient ? c.createConicGradient(0.3, w / 2, h / 2) : null; if (gr) { ['#d8dce4', '#f4f0ff', '#c0e4ff', '#ffe4f4', '#d4ffe0', '#fff4c8', '#d0d8e8', '#d8dce4'].forEach((col, i, a) => gr.addColorStop(i / (a.length - 1), col)); c.fillStyle = gr; } else c.fillStyle = '#dde'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.06, 0, 7); c.fill(); }) });
    K.into(g).cyl(0, -0.06, 0, 6, 6, 0.12, 48, M({ c: '#c8ccd2', sh: 80, sp: '#888' }), { open: true });
    const lab = K.into(g).disc(0, -0.125, 0, 6, M({ c: A.tint(it.c1 || '#888', 0.2), sh: 40, sp: '#2a2a2a' }), 48);
    g.userData.ensure = () => { if (lab.userData.ok) return; lab.userData.ok = 1; lab.material = mat('pm.dl.' + it.id, 256, 256, () => A.discLabel(it), { m: { sh: 40, sp: '#2a2a2a' } }); bump(it.id); H.dirty(); }; // (drawn the first time it's out of its case)
    K.into(g).disc(0, -0.005, 0, 6, rainbow, 48, { rx: 180 });
    K.into(g).shadow(0, 0, 0, 13, 13, 0.4);
    return flat(g, 6);
  }
  function floppyModel(it) {
    const g = new T.Group(), w = 9, h = 0.34, d = 9.4, col = A.FLOPCOL[((it.fl || {}).c | 0) % A.FLOPCOL.length];
    K.into(g).box(0, -h / 2, 0, w, h, d, { t: mat('pm.fl.' + it.id + '.' + (it.label || ''), 128, 134, () => A.floppyFront(it), { m: PLASTIC }), u: mat('pm.flb.' + ((it.fl || {}).c | 0), 128, 134, () => A.floppyBack(it), { m: PLASTIC }), all: M({ c: col[0], sh: 40 }) });
    K.into(g).shadow(0, 0, 0, w + 2, d + 2, 0.45, { sq: true });
    return flat(g, 4.5);
  }
  const MODEL = { box: bigBox, jewel, cdr: jewel, sleeve, cart, mag: magModel };
  // flat things (discs, floppies, mags, carts) lie down; in your hands they tip up to face you
  function flat(g, lift) { const outer = new T.Group(), inner = new T.Group(); while (g.children.length) inner.add(g.children[0]); for (const k in g.userData) outer.userData[k] = g.userData[k]; inner.position.y = 0; outer.add(inner); outer.userData.tilt = inner; outer.userData.lift = lift || 0; return outer; }
  const TILT = new Map();
  function tilt(id, on) {
    const t = H.THINGS[id]; if (!t || !t.obj.userData.tilt) return;
    const inner = t.obj.userData.tilt, to = on ? 1 : 0, from = TILT.get(id) || 0; if (from === to) return;
    const t0 = performance.now();
    H.anims.set('pmtilt:' + id, n => { const k = Math.min(1, (n - t0) / 260), e = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); TILT.set(id, e); inner.rotation.x = -1.25 * e; inner.position.y = -(t.obj.userData.lift || 4) * e; H.dirty(); return k < 1; });
  }
  const ensure = id => { const t = H.THINGS[id]; if (t && t.obj.userData.ensure) t.obj.userData.ensure(); };
  H.on('grab', id => { if (THING[id]) { ensure(id); tilt(id, true); bump(THING[id]); } });
  for (const ev of ['rest', 'snap', 'place', 'unsnap']) H.on(ev, (a, b) => { const id = THING[a] ? a : b; if (THING[id] && H.held() !== id) tilt(id, false); });
  // the lid opening (0 shut .. 1 open)
  function setLid(g, k) { const L = lidFor.get(g); if (!L) return; L.k = k; L.pivot.rotation.y = L.max * k * D2R; H.dirty(); }
  function animLid(g, to, ms) { const L = lidFor.get(g); if (!L) return Promise.resolve(); const from = L.k, t0 = performance.now(); return new Promise(res => { H.anims.set('pmlid:' + g.uuid, n => { const k = Math.min(1, (n - t0) / (ms || 450)); setLid(g, from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)); if (k < 1) return true; res(); return false; }); }); }

  // ================================================================ the games shelf (against the left wall, between the CD rack and the wardrobe)
  const SH = { x: -265.5, z: 10, w: 48, d: 29, t: 1.8, boards: [-49, -19, 11, 41, 71] }; // four usable, evenly spaced bays
  let slotG;
  const toWorld = (lx, lz) => ({ x: SH.x + lz, z: SH.z - lx }); // (it faces +x: turned 90 degrees)
  const SHELF_RY = 90;
  let built = false;
  function buildShelf() {
    const r = H.ROOMS.bedroom, g = new T.Group();
    const B = K.into(g).at(0, 0, 0, SHELF_RY);
    slotG = new T.Group(); g.add(slotG); slotG.rotation.y = SHELF_RY * D2R;
    const wood = M({ c: '#e8cfa4', map: window.HouseArt ? HouseArt.t('pine') : null }), edge = M('#e6c99a'), back = M('#5a4128');
    const { w, d, t, boards } = SH, top = boards[0], H0 = 73 - top;
    B.box(0, (top + 73) / 2, -d / 2 + 0.4, w - 0.4, H0, 0.5, back);                                                   // hardboard back
    for (const sx of [-1, 1]) B.box(sx * (w / 2 - t / 2), (top + 73) / 2, 0, t, H0, d, { all: wood, f: edge }, { uv: 40 }); // the sides
    boards.forEach((y, i) => B.box(0, y - (i === 0 ? t / 2 : 0), 0, i === 0 ? w : w - 2 * t, t, d - 0.6, { all: wood, f: edge }, { uv: 40 }));
    B.box(0, 72, d / 2 - 1.5, w - 2 * t, 2, 1, M('#8a6a44'));                                                          // the plinth
    B.box(-w / 2 + 6.5, boards[1] + 0.1, d / 2 - 0.25, 8, 1.4, 0.1, mat('pm.dymo', 128, 24, () => A.svg('0 0 128 24', '<rect width="128" height="24" rx="3" fill="#161616"/>' + A.T(64, 17, 'GAMES!!', 15, '#fff', { f: '"Courier New",monospace', w: 700, ls: 3 }))), { rz: -2 });
    B.shadow(0, 73, 4, w + 14, d + 12, 0.55, { sq: true });
    const spot = R.addSpot('pm.shelf', { label: 'My games shelf', x: SH.x, y: 0, z: SH.z, mesh: g, room: 'bedroom',
      view: { x: -138, y: -80, z: SH.z, rx: -28, ry: -90 }, act: () => shelfNote() });
    void spot;
    // the shelves are surfaces: things put down on them stay there
    boards.forEach((y, i) => { const a = toWorld(-w / 2 + t, -d / 2 + 0.6), b = toWorld(w / 2 - t, d / 2); H.support('bedroom', Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z), y - (i === 0 ? t : t / 2)); });
    H.block('U', SH.x - d / 2, SH.z - w / 2, SH.x + d / 2, SH.z + w / 2);
    void r;
  }
  function shelfNote() {
    secret('disc.cupboard');
    const n = PM.items().filter(x => x.kind !== 'floppy').length;
    say('My games shelf', `${n} games, CDs and mags. Click to pick one up; <b>F</b> opens it. Return a loose disc to its own case first, then bring the case to its highlighted shelf slot. <button type="button" class="pm-tidy-shelf">Put everything back</button>${PM.parcels().length ? ' <b>There\'s a parcel on the floor!</b>' : ''}`, 12000);
    const button = document.querySelector('.pm-tidy-shelf');
    if (button) button.addEventListener('click', ev => {ev.stopPropagation(); Room.tidy(); H.hush();});
  }

  // ================================================================ the floppy box on the desk
  const FB = { x: 58, z: -44, ry: -12 };
  function buildFloppyBox() {
    const g = new T.Group(), B = K.into(g);
    const smoke = M({ c: '#3a4250', o: 0.55, sh: 100, sp: '#aaaaaa' });
    B.box(0, -0.2, 0, 11, 0.4, 17, M('#22262e'));
    B.box(0, -3.8, 8.4, 11, 7.2, 0.2, smoke); B.box(0, -3.8, -8.4, 11, 7.2, 0.2, smoke);
    B.box(-5.4, -3.8, 0, 0.2, 7.2, 17, smoke); B.box(5.4, -3.8, 0, 0.2, 7.2, 17, smoke);
    B.box(0, -10.8, -10.6, 11.2, 7.6, 0.25, smoke, { rx: -68 });                                                        // the lid, flipped open
    B.box(0, -4.8, 8.55, 7, 2.8, 0.05, mat('pm.fblab', 128, 52, () => A.svg('0 0 128 52', '<rect width="128" height="52" fill="#fbfbf0"/>' + A.T(64, 22, 'DISKS', 18, '#14148a', { f: '"Comic Sans MS",cursive', w: 700 }) + A.T(64, 42, 'DO NOT TOUCH (DAVE)', 10, '#c00000', { f: '"Comic Sans MS",cursive', w: 700 }))));
    // a row of floppies standing in it (just their tops: the real ones are things, these are the look)
    const rowG = new T.Group(); g.add(rowG); g.userData.row = rowG;
    B.shadow(0, 0, 0, 16, 22, 0.55, { sq: true });
    g.rotation.y = FB.ry * D2R;
    R.addSpot('pm.flops', { label: 'Floppy disk box', x: FB.x, y: 0, z: FB.z, mesh: g, room: 'bedroom', act: () => nextFloppy() });
    H.snap('pm.flops', { room: 'bedroom', x: FB.x, y: -6, z: FB.z, r: 13, box: [11, 8, 17], accepts: k => k === 'floppy', hint: 'Let go to put it back in the box', pose: { x: FB.x, y: -2, z: FB.z, ry: FB.ry }, hide: true,
      onSnap: t => { sfx('click'); fillRow(); } });
    boxG = g;
  }
  let boxG = null;
  let flopIdx = 0;
  function nextFloppy() { // click the box: the next floppy comes out into your hand
    if (H.held()) return say('Floppy disk box', 'Put down what you\'re holding first. (Drop a floppy on the box to put it back in.)', 3500);
    const inBox = floppyThings().filter(t => t.st === 'snap' && t.snap === 'pm.flops');
    if (!inBox.length) return say('Floppy disk box', 'Empty! Where have all my floppies gone? (Dave.)', 3500);
    const t = inBox[(flopIdx++) % inBox.length];
    t.snap = null; t.st = 'rest'; t.rx = 0; t.at = { room: 'bedroom', x: FB.x, y: -6, z: FB.z, ry: FB.ry }; H.place(t); t.obj.visible = true;
    sfx('click'); fillRow();
    setTimeout(() => H.grab(t.id), 20);
  }
  function fillRow() { // the tops of the floppies in the box
    if (!boxG) return; const row = boxG.userData.row; while (row.children.length) row.remove(row.children[0]);
    const inBox = floppyThings().filter(t => t.st === 'snap' && t.snap === 'pm.flops').slice(-16);
    inBox.forEach((t, i) => { const it = PM.item(t.pm); if (!it) return; const col = A.FLOPCOL[((it.fl || {}).c | 0) % A.FLOPCOL.length]; K.into(row).box(0, -4.4 - (i % 2) * 0.1, 7 - i * (14 / Math.max(16, inBox.length)), 9, 9.2, 0.34, { all: M(col[0]), f: mat('pm.fl.' + it.id + '.' + (it.label || ''), 128, 134, () => A.floppyFront(it), { m: PLASTIC }) }, { rx: -6 - (i % 3) * 3 }); });
    H.dirty();
  }

  // ================================================================ the things
  const THING = {}; // thing id -> item id
  const migrateLegacyShelf = !Apps.store.get('jhp_pm_slots', null);
  const tb = id => 'pmb.' + id, td = id => 'pmd.' + id, tf = id => 'pmf.' + id;
  const floppyThings = () => Object.keys(THING).filter(k => k.startsWith('pmf.')).map(k => H.THINGS[k]).filter(Boolean);
  // where each thing lives on the shelf
  function homes() {
    const out = {}, inner = SH.w - SH.t * 2 - 1.2, rows = [0, 0, 0, 0];
    const saved = Apps.store.get('jhp_pm_slots', {}), slots = saved && typeof saved === 'object' ? saved : {};
    const all = PM.items().filter(it => it.kind !== 'floppy');
    for (const id of Object.keys(slots)) { const s = slots[id]; if (Number.isInteger(s.row) && s.row >= 0 && s.row < 4 && s.end <= inner && s.end > 0) rows[s.row] = Math.max(rows[s.row], s.end); else delete slots[id]; }
    for (const it of all) {
      const th = it.kind === 'box' ? 5 : it.kind === 'cart' ? 7.6 : it.kind === 'mag' ? .8 : it.kind === 'sleeve' ? .3 : 1;
      let s = slots[it.id];
      if (!s) {
        const row = rows.indexOf(Math.min(...rows)), start = rows[row];
        if (start + th + .8 > inner) throw new Error('PC bookcase capacity exceeded');
        s = slots[it.id] = { row, lx: -inner / 2 + start + .4 + th / 2, end: start + th + .8, th };
        rows[row] = s.end;
      }
      const depth = it.kind === 'box' ? 19 : it.kind === 'mag' ? 21 : it.kind === 'cart' ? 11.6 : it.kind === 'sleeve' ? 12.6 : 14.2;
      const p = toWorld(s.lx, SH.d / 2 - 1.4 - depth / 2);
      out[it.id] = {x: p.x, y: SH.boards[s.row + 1] - SH.t / 2, z: p.z, ry: 180, snap: 'pm.slot.' + it.id};
      if (slotG && !slotG.getObjectByName(it.id)) {
        const mark = new T.Group(); mark.name = it.id; slotG.add(mark);
        const b = K.into(mark), y = out[it.id].y;
        b.box(s.lx, y - .035, 0, th + .55, .07, SH.d - 3, M('#574733'));
        for (const side of [-1, 1]) b.box(s.lx + side * (th / 2 + .3), y - .8, 0, .12, 1.6, SH.d - 3, M('#b59a72'));
      }
    }
    Apps.store.set('jhp_pm_slots', slots);
    return out;
  }
  const LINE = {
    box: ['A proper big box. The ones with all the air in.', 'Big box. Small disc. Lots of cardboard.', 'Smells like a new game. Best smell in the world.'],
    jewel: ['A jewel case. The hinge is always the first thing to break.', 'Shiny side down, label side up. Everyone knows that.'],
    disc: ['Hold it by the edges. Fingerprints make it skip.', 'The shiny side is the side the laser reads. Don\'t scratch it. (CALLUM.)'],
  };
  const pick = L => L[Math.floor(Math.random() * L.length)];
  function caseThing(it, home) {
    const id = tb(it.id); THING[id] = it.id;
    if (H.THINGS[id]) return H.THINGS[id];
    const obj = (MODEL[it.kind] || jewel)(it);
    // Every face is prepared before the first grab, not swapped in while it is in your hands.
    if (obj.userData.lazy) {obj.userData.lazy(); obj.userData.lazy = null;}
    if (obj.userData.back) {
      const mesh = obj.children.find(m => m.isMesh && Array.isArray(m.material));
      if (mesh) {mesh.material = mesh.material.slice(); mesh.material[5] = obj.userData.back();
        if (obj.userData.edges) {const [right, under] = obj.userData.edges(); mesh.material[0] = right; mesh.material[2] = under;}}
      obj.userData.back = null;
    }
    H.snap(home.snap, {room: 'bedroom', x: home.x, y: home.y - (it.kind === 'box' ? 12 : it.kind === 'mag' ? 13.25 : 6.25), z: home.z, r: 24,
      pose: home, preview: {x: home.x, y: home.y - (it.kind === 'box' ? 12 : it.kind === 'mag' ? 13.25 : 6.25), z: home.z},
      box: [it.kind === 'box' ? 19 : it.kind === 'mag' ? 21 : 14.2, it.kind === 'box' ? 24 : it.kind === 'mag' ? 26.5 : 12.5, it.kind === 'box' ? 5.4 : 1.2],
      accepts: (kind, t) => t.id === id, hint: 'Let go to slide it into its shelf slot', onSnap: () => {setLid(obj, 0);} });
    const hasDisc = !!it.disc && it.kind !== 'cart';
    const t = R.grabbable(id, { obj, kind: it.kind === 'cart' ? 'cart' : 'case', label: it.kind === 'mag' ? `JACK ATTACK! ${PM.MONTHS[it.m - 1]} (cover CD taped on)` : it.title,
      home: Object.assign({ room: 'bedroom' }, home), holdD: it.kind === 'box' ? 52 : 40,
      use: it.id === 'pm.netplanet' ? () => { secret('pm.coaster'); say('A coaster!', 'Perfect. A coaster for my squash. That\'s what these are for. (I have nine.) Mom says it\'s "not a coaster, it\'s litter".', 5000); } : hasDisc ? () => takeDisc(it) : it.kind === 'cart' ? () => say(it.title, 'It\'s a cartridge. It goes in an N64, not the PC. (Luke says if you blow on it, it\'ll go in the CD tray. Luke is wrong.)') : null,
      useLabel: it.id === 'pm.netplanet' ? 'Use it as a coaster' : it.kind === 'mag' ? 'Peel the CD off' : it.kind === 'sleeve' ? 'Slide the disc out' : 'Take the disc out',
      onGrab: () => { if (it.kind === 'box') { secret('pm.shelf'); secret('disc.cupboard'); } if (obj.userData.lazy) { obj.userData.lazy(); obj.userData.lazy = null; bump(it.id); } const b = obj.userData.back; if (b) { obj.userData.back = null; try { const mesh = obj.children.find(m => m.isMesh && Array.isArray(m.material)); if (mesh) { mesh.material = mesh.material.slice(); mesh.material[5] = b(); if (obj.userData.edges) { const [r, u] = obj.userData.edges(); mesh.material[0] = r; mesh.material[2] = u; } bump(it.id); H.dirty(); } } catch (e) {} }
        say(it.title, esc(it.owner === 'Callum' ? 'Callum\'s. He wants it back. He keeps saying "GIVE IT BACK" at school.' : it.blurb || pick(LINE[it.kind] || LINE.jewel)), 4000); },
    });
    // Migrate only the old crowded shelf poses, never objects left elsewhere.
    if (t.st === 'rest' && (t.at.snap === home.snap || (migrateLegacyShelf && !t.at.hide && Math.abs(t.at.x - SH.x) < 16 && Math.abs(t.at.z - SH.z) < 24 && t.at.y < 72))) {
      t.st = 'snap'; t.snap = home.snap; t.at = Object.assign({room: 'bedroom'}, home); t.rx = t.rz = 0; H.place(t);
    }
    return t;
  }
  function discThing(it) {
    const id = td(it.id); THING[id] = it.id;
    if (H.THINGS[id]) return H.THINGS[id];
    const boxSlot = 'pm.case.' + it.id;
    H.snap(boxSlot, {room: 'bedroom', x: 0, y: 0, z: 0, r: 26, hide: true, box: [13, 1, 13],
      accepts: (kind, t) => t.id === id, enabled: () => !!H.THINGS[tb(it.id)] && !H.THINGS[tb(it.id)].at.hide,
      hint: 'Let go to put the disc back in its own case',
      onSnap: () => discHome(it)});
    const t = R.grabbable(id, { obj: discModel(it), kind: 'disc', label: it.title + ' (the disc)', holdD: 30,
      home: Object.assign({ room: 'bedroom', hide: true }, homeOf(it.id)),
      use: () => discHome(it), useLabel: it.kind === 'mag' ? 'Put it back on the mag' : 'Put it back in its case',
      onGrab: () => say(it.title, esc(pick(LINE.disc)) + ' <small>(Open the PC\'s CD tray with its eject button, then put it on the tray.)</small>', 5000) });
    ensure(id);
    return t;
  }
  function floppyThing(it) {
    const id = tf(it.id); THING[id] = it.id;
    if (H.THINGS[id]) return H.THINGS[id];
    const t = R.grabbable(id, { obj: floppyModel(it), kind: 'floppy', label: it.label ? `Floppy: "${it.label}"` : 'A blank floppy disk', holdD: 30,
      home: { room: 'bedroom', x: FB.x, y: -2, z: FB.z, ry: FB.ry, hide: true },
      onGrab: () => { say(it.label ? `"${it.label}"` : 'A blank floppy', esc(floppyLine(it)) + ' <small>(Push it into the slot on the PC: the one under the CD drive.)</small>', 4500); fillRow(); } });
    t.pm = it.id;
    // a floppy that has never been anywhere starts in the box
    if (t.st === 'rest' && t.at.hide && t.snap == null) { t.st = 'snap'; t.snap = 'pm.flops'; }
    return t;
  }
  function floppyLine(it) {
    const k = it.fl ? it.fl.k : it.id === 'gquest' ? 'quest' : '';
    return { blank: 'Blank. 1.44 MB of nothing. Downloads go on these.', dl: 'Something I downloaded, saved onto a floppy so I never have to download it again.', gcse: 'My GCSE coursework. The ONLY copy. This is fine.', dave: 'Dave\'s disk. He said DON\'T LOOK ON IT. So obviously...', boot: 'The JackOS 98 Startup Disk. For emergencies. (Every day.)', quest: 'The text adventure. Shareware! Please copy!' }[k] || 'A floppy disk. 1.44 MB. That\'s, like, 700 pages of homework.';
  }
  let HOMES = {};
  H.ambient.add(() => {
    if (!/^pmd\./.test(H.held() || '')) return;
    for (const id in HOMES) {
      const box = H.THINGS[tb(id)], sn = H.SNAPS['pm.case.' + id]; if (!box || !sn) continue;
      sn.room = box.at.room; sn.x = box.obj.position.x; sn.y = box.obj.position.y - 5; sn.z = box.obj.position.z;
      sn.pose = {x: sn.x, y: sn.y, z: sn.z, ry: box.at.ry || 0};
    }
  });
  const homeOf = id => HOMES[id] || { x: SH.x + 4, y: SH.boards[3] - 1, z: SH.z };
  H.on('tidy', rid => {
    if (rid && rid !== 'bedroom') return;
    // Cancel pending lid/placement animations before they can undo tidying.
    for (const it of PM.items()) {
      const box = H.THINGS[tb(it.id)], disc = H.THINGS[td(it.id)];
      for (const t of [box, disc]) if (t) {
        H.anims.delete('snap:' + t.id); H.anims.delete('pmtilt:' + t.id);
        t.rx = t.rz = 0; H.place(t);
      }
      if (box) {H.anims.delete('pmlid:' + box.obj.uuid); setLid(box.obj, 0);}
      if (disc) {disc.st = 'rest'; disc.snap = null; disc.at = Object.assign({}, box ? box.home : disc.home, {hide: true}); H.place(disc);}
      if (box && box.obj.userData.cover) box.obj.userData.cover(true);
    }
    const cd = R.drive('cd');
    if (cd && isDisc(cd.thing)) {const sn = H.SNAPS['pc.cd']; if (sn.onUnsnap) sn.onUnsnap(H.THINGS[cd.thing]); PM.ejectD();}
  });
  function sync() { // make a thing for everything you own (new things turn up on the shelf)
    if (!built) return;
    HOMES = homes();
    for (const it of PM.items()) {
      if (it.kind === 'floppy') { floppyThing(it); continue; }
      const t = caseThing(it, HOMES[it.id] || homeOf(it.id));
      if (t && HOMES[it.id]) t.home = Object.assign({ room: 'bedroom' }, HOMES[it.id]);
      if (it.disc && it.kind !== 'cart') { const dt = discThing(it); if (it.kind === 'mag' && t.obj.userData.cover) t.obj.userData.cover(dt.st === 'rest' && !!dt.at.hide && PM.where(it.id) === 'shelf'); }
    }
    fillRow(); drives(); parcels(); H.saveThings();
  }

  // ---- the disc: out of its case and into your hand, and back again
  async function takeDisc(it) {
    const box = H.THINGS[tb(it.id)], disc = H.THINGS[td(it.id)]; if (!box || !disc) return;
    const w = PM.where(it.id);
    if (w === 'D') return say(it.title, 'The disc isn\'t in here: it\'s in the PC. (Press the CD eject button on the tower to get it out.)', 4500);
    if (disc.st !== 'rest' || !disc.at.hide) return say(it.title, `The disc isn't in here. ${disc.st === 'snap' ? 'It\'s in the PC\'s tray.' : 'I left it somewhere. Look around!'}`, 4500);
    if (it.kind === 'mag') { box.obj.userData.cover && box.obj.userData.cover(false); }
    else if (lidFor.get(box.obj)) { sfx('click'); await animLid(box.obj, 1, 420); }
    secret('pm.open');
    // the box goes back where it came from; the disc comes up out of it into your hand
    const p = box.obj.position.clone();
    H.putBack();
    setTimeout(() => { if (lidFor.get(box.obj)) animLid(box.obj, 0, 500); }, 420);
    disc.at = { room: box.at.room || 'bedroom', x: p.x, y: -p.y, z: p.z, ry: 0 };
    disc.st = 'rest'; disc.obj.position.copy(p); disc.obj.position.y -= 3; disc.obj.visible = true; disc.at.hide = false;
    setTimeout(() => { if (!H.grab(disc.id)) { disc.at.hide = false; H.place(disc); } }, 30);
  }
  // let go of what you're holding without it clicking into a drive (putBack would put it back IN the drive it came from)
  function release() {
    const saved = {}; for (const id in H.SNAPS) { saved[id] = H.SNAPS[id].enabled; H.SNAPS[id].enabled = () => false; }
    try { H.drop(); } finally { for (const id in saved) H.SNAPS[id].enabled = saved[id]; }
  }
  function discHome(it) { // back in its case (wherever the case is)
    const disc = H.THINGS[td(it.id)], box = H.THINGS[tb(it.id)]; if (!disc) return;
    if (H.held() === disc.id) release();
    setTimeout(() => {
      disc.st = 'rest'; disc.snap = null; disc.at = Object.assign({}, box ? box.at : disc.home, { hide: true }); H.place(disc); disc.obj.visible = false;
      if (it.kind === 'mag' && box) box.obj.userData.cover && box.obj.userData.cover(true);
      H.saveThings(); sfx('click');
    }, 20);
  }

  // ================================================================ the drives: the room and the PC agree
  const itemOfThing = id => THING[id] || null;
  const isDisc = id => /^pmd\./.test(id || ''), isFloppy = id => /^pmf\./.test(id || '');
  let quiet = false;
  R.on('drive', e => {
    if (e && e.thing) ensure(e.thing);
    if (quiet || !e) return;
    const it = itemOfThing(e.thing);
    if (e.drive === 'cd') {
      if (e.inserted) {
        if (it && isDisc(e.thing)) { PM.insert(it, { room: true }); secret('pm.tray'); }
        else if (D.drive) { D.eject(); } // (a disc the PC can't read: drive D: is as good as empty)
      } else if (D.drive && (!it || PM.discItem(D.drive) === it)) PM.ejectD();
    } else if (e.drive === 'floppy') {
      if (e.inserted) { if (it && isFloppy(e.thing)) { PM.insertA(it, { quiet: true }); secret('pm.floppy'); } }
      else if (it && PM.driveA === it) PM.ejectA();
    }
  });
  function drives() { // the PC changed a drive (Eject in My Computer, the grab window...): move the things to match
    if (!built) return;
    quiet = true;
    try {
      const cd = R.drive('cd') || {}, want = D.drive ? td(PM.discItem(D.drive)) : null;
      if (cd.thing !== want && !cd.open) {
        const sn = H.SNAPS['pc.cd'];
        if (cd.thing && isDisc(cd.thing)) { const t = H.THINGS[cd.thing]; if (t && sn && sn.onUnsnap) sn.onUnsnap(t); if (t) { t.snap = null; discHome({ id: THING[cd.thing], kind: (PM.item(THING[cd.thing]) || {}).kind }); } }
        if (want && H.THINGS[want] && H.held() !== want && !(R.drive('cd') || {}).thing) {
          const t = H.THINGS[want], p = sn.pose || sn;
          t.st = 'snap'; t.snap = 'pc.cd'; t.at = { room: 'bedroom', x: p.x, y: p.y, z: p.z, ry: p.ry || 0, hide: true }; H.place(t);
          try { sn.onSnap(t); H.hush && H.hush(); } catch (e) {}
          t.obj.visible = false; t.at.hide = true;
          const box = H.THINGS[tb(THING[want])]; if (box && box.obj.userData.cover) box.obj.userData.cover(false);
        }
      }
      const fd = R.drive('floppy') || {}, wa = PM.driveA ? tf(PM.driveA) : null;
      if (fd.thing !== wa) {
        const sn = H.SNAPS['pc.floppy'], box = H.SNAPS['pm.flops'];
        if (fd.thing && isFloppy(fd.thing)) { const t = H.THINGS[fd.thing]; if (t) { if (sn && sn.onUnsnap) sn.onUnsnap(t); t.st = 'snap'; t.snap = 'pm.flops'; t.rx = 0; t.at = Object.assign({ room: 'bedroom' }, box.pose, { hide: true }); H.place(t); t.obj.visible = false; } }
        if (wa && H.THINGS[wa] && H.held() !== wa) { const t = H.THINGS[wa], p = sn.pose; t.st = 'snap'; t.snap = 'pc.floppy'; t.at = { room: 'bedroom', x: p.x, y: p.y, z: p.z, ry: 0, hide: true }; t.rx = p.rx || 0; H.place(t); t.obj.visible = false; try { sn.onSnap(t); } catch (e) {} }
      }
      H.saveThings(); fillRow();
    } catch (e) { console.error(e); }
    quiet = false;
  }

  // ================================================================ parcels (Pixel Post): Mom puts them on Jack's bed (until there's a doormat downstairs)
  const POST = { x: 210, y: 30, z: 112 }; // (on the duvet, clear of the cat and the competition parcel)
  const PARCEL = new Map(); // order item id -> { spot, g, flaps }
  const parcelFace = () => mat('pm.parcelf', 256, 154, () => A.svg('0 0 256 154', `<rect width="256" height="154" fill="#c49a62"/><rect x="118" y="0" width="20" height="40" fill="#d8c690"/><g transform="rotate(-2 70 90)"><rect x="18" y="56" width="128" height="62" fill="#fff"/>${A.T(82, 76, 'MR J. JACK', 14, '#14148a', { f: "'Comic Sans MS',cursive", w: 700 })}${A.T(82, 94, 'JACK\'S ROOM', 12, '#14148a', { f: "'Comic Sans MS',cursive", w: 700 })}${A.T(82, 110, '(TOP OF THE STAIRS)', 9, '#14148a', { f: "'Comic Sans MS',cursive", w: 700 })}</g><g transform="rotate(9 210 80)"><rect x="168" y="62" width="80" height="30" fill="none" stroke="#c00000" stroke-width="4"/>${A.T(208, 84, 'PIXEL POST', 16, '#c00000')}</g>${A.T(200, 140, 'SIGNED FOR: MOM', 9, '#333', { f: "'Comic Sans MS',cursive", w: 700 })}`));
  function parcelModel() {
    const g = new T.Group(), B = K.into(g), w = 30, h = 14, d = 22;
    const card = M({ c: '#c49a62', map: window.HouseArt ? HouseArt.t('mdf') : null }), tape = M('#d8c690'), inside = M('#7a5a36');
    B.box(0, -h / 2, 0, w, h, d, { all: card, t: inside, f: parcelFace() });
    B.box(0, -h + 1.2, 0, w - 0.8, 0.4, d - 0.8, M('#f4f4ee'));                      // polystyrene chips under the flaps
    const flaps = [-1, 1].map(sx => { const p = new T.Group(); p.position.set(sx * w / 2, -h, 0); g.add(p); K.into(p).box(-sx * w / 4, -0.08, 0, w / 2, 0.16, d, { all: card, t: M('#b88e58') }); if (sx < 0) K.into(p).box(w / 2 - 0.3, -0.2, 0, 1.2, 0.1, d + 0.4, tape); return { p, sx }; });
    B.shadow(0, 0, 0, w + 6, d + 6, 0.55, { sq: true });
    return { g, flaps };
  }
  function parcels() {
    const r = H.ROOMS.bedroom; if (!r) return;
    const want = PM.parcels();
    for (const [id, P] of PARCEL) if (!want.includes(id) && !P.opening) { if (P.spot.obj.parent) P.spot.obj.parent.remove(P.spot.obj); try { H.unspot('pm.parcel.' + id); } catch (e) {} PARCEL.delete(id); }
    want.forEach((id, i) => {
      if (PARCEL.has(id)) return;
      const m = parcelModel(); m.g.rotation.y = [12, -20, 30, -8, 18][i % 5] * D2R;
      const it = PM.item(id) || { title: PM.titleOfShop(id) };
      const spot = R.addSpot('pm.parcel.' + id, { label: 'A parcel from Pixel Post!', x: POST.x - (i % 2) * 34, y: POST.y - Math.floor(i / 2) * 14, z: POST.z - (i % 3) * 6, mesh: m.g, room: 'bedroom', act: () => openParcel(id) });
      PARCEL.set(id, { spot, g: m.g, flaps: m.flaps, title: it.title });
    });
    H.dirty();
  }
  function openParcel(id) {
    if (H.held()) return say('A parcel!', 'Put down what you\'re holding first.', 3000);
    const P = PARCEL.get(id); if (!P || P.opening) return;
    P.opening = true; sfx('click');
    const t0 = performance.now();
    H.anims.set('pmparcel:' + id, n => { const k = Math.min(1, (n - t0) / 650); P.flaps.forEach(f => { f.p.rotation.z = -f.sx * 2.1 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); }); H.dirty(); return k < 1; });
    setTimeout(() => {
      const got = PM.openParcel(id); if (!got) { P.opening = false; return; }
      sfx('solve'); secret('pm.post');
      sync();
      const it = PM.item(got), box = H.THINGS[tb(got)], wp = new T.Vector3(); P.spot.obj.getWorldPosition(wp);
      if (box) say('IT CAME!', `${esc(it ? it.title : 'A game')}! Rip, rip, rip. Polystyrene everywhere. (Mom will love that.) <small>(It lives on your games shelf: Esc puts it there.)</small>`, 6000);
      else if (/^cart\./.test(got)) setTimeout(() => say('IT CAME!', `${esc(PM.titleOfShop(got))}! Rip, rip, rip. It's on the games shelf by the telly now (${/^cart\.sn\./.test(got) ? 'well, in the cupboard under the stairs with the Super Nintendo' : 'click the console to play it'}).`, 6500), 1200);
      if (box) { box.at = Object.assign({}, box.home); box.obj.position.set(wp.x, wp.y + 14, wp.z); box.obj.visible = true; setTimeout(() => H.grab(box.id), 60); }
      // Mom takes the empty box away for the recycling
      setTimeout(() => { P.opening = false; parcels(); }, 5000);
    }, 700);
  }

  // ================================================================ the Pixel Post catalogue: a thick glossy paper one, on the bed (F turns the page)
  const CW = 21, CH = 28, LEAF = 0.06;
  let catPages = null;
  function catalogPages() {
    const C = PM.CAT, items = (C.ITEMS || []).slice(), md = (PM.srv && PM.srv.md) || 0;
    const out = [() => A.catCover()];
    out.push(() => A.catIntro());
    for (let i = 0; i < items.length; i += 2) { const a = items[i], b = items[i + 1], n = out.length + 1; out.push(() => A.catPage([a, b].filter(Boolean).map(x => Object.assign({}, x, { art: PM.shopArt(x), title: PM.titleOfShop(x.id), soon: md && !C.out(x, md) })), n)); }
    if (out.length % 2) out.push(() => A.catOrder());
    out.push(() => A.catBack());
    if (out.length % 2) out.push(() => A.catOrder());
    return out;
  }
  function catalogueModel() {
    const g = new T.Group(), B = K.into(g);
    const pages = catalogPages(), leaves = pages.length / 2;
    const edge = M({ c: '#f2efe4', map: K.tex('pm.pages', 8, 64, (c, W, H2) => { c.fillStyle = '#f4f1e6'; c.fillRect(0, 0, W, H2); c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H2; y += 3) c.fillRect(0, y, W, 1); }) });
    B.box(0, -0.3, 0, CW, 0.6, CH, { all: edge, u: M('#e10600') });                                 // the page block under the leaves
    const L = [];
    for (let i = 0; i < leaves; i++) {
      const piv = new T.Group(); piv.position.set(-CW / 2, -0.6 - (leaves - i) * LEAF, 0); g.add(piv);
      const front = K.into(piv).plane(CW / 2, -0.012, 0, CW, CH, M({ c: '#ffffff' }), { rx: 90 }), back = K.into(piv).plane(CW / 2, 0.012, 0, CW, CH, M({ c: '#ffffff' }), { rx: -90, rz: 180 });
      L.push({ piv, front, back, f: pages[i * 2], b: pages[i * 2 + 1], k: 0, ready: false });
    }
    K.into(g).shadow(0, 0, 0, CW + 4, CH + 4, 0.5, { sq: true });
    const out = flat(g, 14); out.userData.leaves = L; out.userData.turned = 0;
    out.userData.ensure = () => { L.forEach((l, i) => { if (l.ready) return; l.ready = true; l.front.material = mat('pm.cat.' + (i * 2), 252, 336, l.f, { m: GLOSS }); l.back.material = mat('pm.cat.' + (i * 2 + 1), 252, 336, l.b, { m: GLOSS }); }); bump('cat'); H.dirty(); };
    // the cover shows from the start (the rest is drawn when you pick it up)
    L[0].front.material = mat('pm.cat.0', 252, 336, L[0].f, { m: GLOSS });
    return out;
  }
  function turnPage(t) {
    const L = t.obj.userData.leaves; if (!L) return;
    let n = t.obj.userData.turned;
    const closing = n >= L.length;
    const anim = (leaf, to) => { const from = leaf.k, t0 = performance.now(); H.anims.set('pmleaf:' + L.indexOf(leaf), now => { const k = Math.min(1, (now - t0) / 520); leaf.k = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); leaf.piv.rotation.z = -Math.PI * leaf.k; leaf.piv.position.y = -0.6 - (leaf.k > 0.5 ? L.indexOf(leaf) + 1 : L.length - L.indexOf(leaf)) * LEAF; H.dirty(); return k < 1; }); };
    sfx('click');
    if (closing) { L.slice().reverse().forEach((l, i) => setTimeout(() => anim(l, 0), i * 60)); t.obj.userData.turned = 0; secret('pm.catalogue'); return; }
    anim(L[n], 1); t.obj.userData.turned = n + 1;
    if (n === 0) say('The Pixel Post catalogue', 'Autumn 1999. Prices in Rupees. You order on the Internet: www.pixelpost.jnet (sit down at the PC). It comes the same day!', 6000);
  }
  function catalogueThing() {
    if (H.THINGS['pm.catalogue']) return;
    THING['pm.catalogue'] = 'catalogue';
    R.grabbable('pm.catalogue', { obj: catalogueModel(), kind: 'catalogue', label: 'The Pixel Post games catalogue', holdD: 72,
      home: { room: 'bedroom', x: 168, y: 30, z: 122, ry: -14 }, use: t => turnPage(t), useLabel: 'Turn the page',
      onGrab: () => {} });
  }

  // ================================================================ go (when the room is built: straight away, or when Jack stands up)
  function go() {
    if (built || !H.ROOMS.bedroom || !H.ROOMS.bedroom.built || !H.SNAPS['pc.cd']) return;
    built = true;
    try { buildShelf(); buildFloppyBox(); catalogueThing(); sync(); prepareArtwork(); } catch (e) { console.error('[pm]', e); }
  }
  H.on('built', id => { if (id === 'bedroom') setTimeout(go, 0); });
  go(); setTimeout(go, 500); setTimeout(go, 2000);
  PM.on('change', () => { if (built) setTimeout(sync, 0); });

  window.PMGL = { _q: () => ({ n: QUEUE.length, busy: busyRaster, keys: QUEUE.slice(0, 5).map(j => j.key) }), sync, drives, takeDisc: id => takeDisc(PM.item(id)), discHome: id => discHome(PM.item(id)), openParcel, get built() { return built; }, homes: () => HOMES, THING, setLid };
})();

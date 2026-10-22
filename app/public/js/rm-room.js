/* rm-room: JACK'S BEDROOM, the room round the family PC, now a real 3D room you walk round (WebGL: js/hs-world.js is the
 * engine, js/hs-kit.js the building kit, js/hs-art.js the painted surfaces). Jack is 16, it's 1999, and this is his room:
 * the telly with his consoles under it (all playable: js/rm-tv.js), posters, the shelf of models, GCSE revision he's
 * avoiding, the window (the real time of day), the bed with next door's cat on it, the wardrobe, the beanbag, the bin...
 * The family PC on the desk is boot.js's (CSS 3D, with the power button and the fly-in), kept in step with our camera.
 * The door leads out to the landing and downstairs (js/hs-house.js).
 *
 * DECISION (2026-10-20): the house is WebGL (three.js r128), not CSS 3D: free walking needs it to hold up from anywhere.
 *
 * GRAB API READY. HOOKS FOR OTHER PACKS: window.Room (the old calls still work)
 *   Coordinates: cm. x right (the back wall runs along x), y DOWN (the desk top is y = 0, the bedroom floor y = 73),
 *   z towards the front of the room (the back wall is z = -56, the front wall z = 250). The PC sits at about x -35..30.
 *   Room.spots()                          every clickable thing's id
 *   Room.addClue(spot, { text, title, secret, once, when })   as before: the next click on that spot shows `text` (a
 *        string or a function) as Jack's note and unlocks `secret`; clues on 'drawer' also turn up as letters in the drawer
 *   Room.addSpot(id, { label, x, y, z, w, h, d, col, paint(g, w, h), html, mesh, act(), range, view, room })
 *        a clickable box (w x h x d centred on x, y, z). Its look: `mesh` (your own THREE.Object3D, built in house
 *        coordinates relative to x, y, z), or `paint` (a canvas painter for its front), or `col`, or `html` (its text is
 *        printed on the front). Returns { obj, id }. `view` = { x, y, z, rx, ry }: where to stand to use it (else automatic).
 *   Room.grabbable(id, { obj | mesh | w, h, d, col, paint, home: { room, x, y, z, ry }, kind, label, use(t), useLabel,
 *        holdD, onGrab, onPlace }) -> thing. A thing you pick up (click / E) and put down anywhere (it lands on surfaces,
 *        bounces a little, can't go through walls, and stays where you left it: saved per visitor, roams with members).
 *        The object's origin must be its BOTTOM centre (it sits on y = 0, going up into negative y).
 *        kind: 'disc' | 'floppy' | 'cart' | 'box' | anything: snap targets check it. use(): an action while held (F key).
 *   Room.addSnap(id, { x, y, z, r, accepts(kind, thing), pose: { x, y, z, rx, ry, rz }, hide, hint, box: [w, h, d],
 *        onSnap(thing), onUnsnap(thing), enabled(), room })  a place a thing clicks into when you let go near it
 *        (highlighted while you carry an accepted thing within r). Built in: 'pc.cd' (the PC's CD tray, when it's out:
 *        accepts 'disc'), 'pc.floppy' (the floppy slot: accepts 'floppy').
 *   Room.drive(name) -> { open, thing } for 'cd' and 'floppy'; Room.eject('cd' | 'floppy'); Room.held() -> thing id or null
 *   Room.tidy(room?)                      everything back where it lives (Mom tidied up)
 *   Room.on(ev, fn)  ev: 'click' (spot), 'find' (id), 'play' (gameId), 'open' (what), 'close', 'grab' (id), 'place' (id),
 *        'snap' (snapId, thingId), 'unsnap' (snapId, thingId), 'drive' ({ drive, thing, inserted }), 'room' (roomId)
 *   Room.say(title, text)  Room.toast(title, text)  Room.look('desk' | 'telly' | 'window' | 'door') glides to that view
 *   Room.found(id)  Room.owned(gameId)  Room.where() -> the room you're in  Room.T (THREE)  Room.K (hs-kit)  Room.House
 * State: localStorage jhp_rm = { f:{id:ts}, seen:{spot:1}, pl, post } (members: the server keeps finds, mods/rm.js);
 * where things are: Apps.saveGame('hs.things'). */
(function () {
  'use strict';
  // in the PC: Start > Run "room" stands you up from the PC (it stays on)
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.Apps || !Apps.cmd) return;
    try {
      Apps.fs.add('C:/My Documents', { name: 'LOST GAMES.TXT', type: 'txt', date: '18/10/99', size: '1 KB', text: 'LOST GAMES (IN MY ROOM SOMEWHERE)\r\n=================================\r\n\r\nUltra 64: the spy one and the island one. One is in with my letters, I think.\r\nPlaySpace: the fighting one (under something?) and the hover racing one (Mom tidied up. Uh oh.)\r\nGame Lad: Pocket Critters!!! 3 hours on my save. Check where I sit to play.\r\nSegue: the beat-em-up. Behind the telly with all the leads?\r\nDaydream: the hedgehog one came WITH it (check the box).\r\n\r\nAlso lost: my shooter marble, a tazo, my robot club badge, the hologram sticker,\r\nthe key to my money box, and the cheat card off the front of a mag.\r\n\r\nTO FIND THEM: stand up from the PC (F2, or Esc > Back to the room)\r\nand look round my room. Pick things up. Look under things. Click EVERYTHING.\r\n(Mom says if I find her lost change I can keep it.)\r\n' });
    } catch (e) {}
    Apps.cmd(['room', 'bedroom', 'my room', 'jacksroom', 'stand', 'standup', 'stand up'], () => {
      if (window.House && House.canStand && House.canStand()) return House.standUp();
      Desk.msgbox('My Room', 'Your room is all round you. Stand up from the PC (F2, the chair button, or Esc > Back to the room) and have a look. The PC stays on.', 'info');
    });
  });
  const pb = document.getElementById('bootPower'); if (!pb) return;
  const CAT = window.RoomCat; if (!CAT) return;
  const H = window.House, GL = !!(H && H.ok);
  const mode = window.JHPBoot || 'room';
  const live = mode === 'room' || mode === 'old' || mode === 'forced';
  const store = { get() { try { return JSON.parse(localStorage.getItem('jhp_rm') || 'null') || {}; } catch (e) { return {}; } }, set(v) { try { localStorage.setItem('jhp_rm', JSON.stringify(v)); } catch (e) {} } };
  const S = store.get(); S.f = S.f || {}; S.seen = S.seen || {};
  const save = () => store.set(S);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const today = () => { try { return Desk.today99(); } catch (e) { const d = new Date(); return { m: d.getMonth() + 1, d: d.getDate(), md: (d.getMonth() + 1) * 100 + d.getDate() }; } };
  const isOut = from => !from || CAT.md(from) <= today().md;
  const cast = s => { try { return window.Cast ? Cast.t(String(s).replace(/Mr Tibbs/g, '{cat}')) : s; } catch (e) { return s; } };
  const catName = () => { try { return window.Cast ? Cast.n('cat') : 'Mr Tibbs'; } catch (e) { return 'Mr Tibbs'; } };
  const MY_SECRETS = [
    ['hs.stand', 'Stretch Your Legs', 'Get up from the PC while it is still on.'],
    ['hs.juggle', 'Butterfingers', 'Carry something all the way round Jack\'s room.'],
    ['hs.disc', 'Insert Disc', 'Put a disc in the PC with your own hands.'],
    ['hs.lights', 'Who Turned the Lights Out?', 'Find the light switch in Jack\'s room.'],
    ['hs.revise', 'Revision', 'Open one of Jack\'s GCSE revision books. Just one.'],
    ['hs.hifi', 'Turn It Up!', 'Play a CD on Jack\'s hi-fi.'],
    // downstairs (js/hs-house.js and friends; defined here so the Secrets window counts them from the start)
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
  const defSecrets = () => { try { if (window.Apps && Apps.defineSecret) { for (const [id, n, h] of CAT.SECRETS) Apps.defineSecret(id, n, h); for (const [id, n, h] of MY_SECRETS) Apps.defineSecret(id, n, h); } } catch (e) {} };
  if (window.Apps) defSecrets(); else document.addEventListener('DOMContentLoaded', defSecrets);
  const EVS = {}; const emit = (ev, ...a) => (EVS[ev] || []).forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });
  function secret(id) { try { if (window.Apps && Apps.secrets && Apps.secrets[id] && !Apps.found[id]) { Apps.secret(id); toast('★ SECRET FOUND! ★', Apps.secrets[id].name); } } catch (e) {} }
  const say = (t, x, ms) => { if (GL) H.say(t, x, ms); };
  const toast = (t, x) => { if (GL) H.toast(t, x); };

  // ================================================================ no WebGL: the PC on its own (the old dark room), the hook still there
  if (!GL) {
    const entry = document.getElementById('houseEntry');
    if (entry) {
      entry.setAttribute('role','alert');
      entry.querySelector('strong').textContent = '3D GRAPHICS UNAVAILABLE';
      entry.querySelector('span').textContent = 'The house needs WebGL graphics. Check hardware acceleration in your browser, then reload.';
      const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Reload'; retry.addEventListener('click', () => location.reload()); entry.appendChild(retry);
    }
    pb.classList.add('hs-nogl');
    window.Room = { spots: () => [], _clues: () => [], addClue() {}, addSpot() { return { obj: null }; }, grabbable() { return null; }, addSnap() {}, on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, say() {}, toast() {}, look() {}, found: id => !!S.f[id], owned: () => false, where: () => '', tidy() {}, held: () => null, drive: () => ({}), eject() {},
      _: { S, save, spot() {}, SPOTS: {}, emit, secret, isOut, foundIt() {}, search() {}, freeze: () => true, sfx, esc, pb, coin: {}, tvOn() {} } };
    return;
  }
  const K = H.K, T = H.T, A = window.HouseArt, M = K.mat;
  const D2R = Math.PI / 180;

  // ================================================================ the room: walls x -280..240, z -56..250, floor y 73, ceiling y -185
  const BZ = -56, LX = -280, RX = 240, FZ = 250, FY = 73, CY = -185;
  const TX = -178; // the telly corner
  const WIN = { x0: 156, x1: 226, y0: -112, y1: -14 }; // the window in the back wall
  const DOOR = { z0: 150, z1: 230, y0: -132 }; // the door in the right-hand wall (to the landing)
  const tex = n => A.t(n);
  const repT = (n, rx, ry) => { const t = tex(n).clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; };
  const mWall = () => M({ c: '#ffffff', map: tex('wallBlue') });
  const mSkirt = M({ c: '#efebe0', map: tex('whiteGloss'), sh: 30, sp: '#333' });
  const mPine = () => M({ c: '#ffffff', map: tex('pine') });
  const mDesk = () => M({ c: '#ffffff', map: tex('deskWood') });
  const mDark = M({ c: '#1b1b1e', sh: 20, sp: '#222' });
  const mMetal = M({ c: '#9a9aa0', sh: 60, sp: '#888' });
  const mBrass = M({ c: '#c8a040', sh: 70, sp: '#a08040' });
  const mWhite = M({ c: '#efece4', sh: 20, sp: '#222' });
  const mBluTack = M({ c: '#4a7ad8', sh: 10 });

  // a poster on a wall: paper with a slight curl at the bottom, Blu-Tack at the corners, a soft shadow behind
  function poster(B, x, y, z, w, h, t, ry) {
    const P = B.at(x, y, z, ry || 0);
    P.wshadow(0.6, 1.2, 0.08, w * 1.1, h * 1.08, 0.5);
    const m = M({ c: '#ffffff', map: t, sh: 4 });
    const lift = 0.25, curlH = h * 0.12;
    const top = new T.PlaneGeometry(w, h - curlH); { const uv = top.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i) * ((h - curlH) / h)); }
    P.geo(top, 0, -curlH / 2, lift, m, {});
    const sub = new T.PlaneGeometry(w, curlH); { const uv = sub.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, (1 - uv.getY(i)) * (curlH / h)); }
    P.geo(sub, 0, h / 2 - curlH / 2 + 0.2, lift + 0.55, m, { rx: -9 });
    [[-1, -1], [1, -1], [-1, 1]].forEach(([sx, sy]) => P.ball(sx * (w / 2 - 1.2), sy * (h / 2 - 1.4) - (sy > 0 ? curlH * 0.6 : 0), lift + 0.05, 0.7, 0.7, 0.35, mBluTack, 6));
  }
  // a framed print or pinboard
  function frame(B, x, y, z, w, h, d, m, mf, ry) {
    const P = B.at(x, y, z, ry || 0);
    P.wshadow(0.8, 1.4, -d / 2 + 0.08, w * 1.12, h * 1.1, 0.55);
    P.box(0, 0, 0, w, h, d, mf);
    P.plane(0, 0, d / 2 + 0.05, w - 3, h - 3, m);
  }

  // ---------------------------------------------------------------- the sky outside the window (the visitor's real clock)
  const skyTex = K.tex('rm.sky', 512, 256, () => {}, { clamp: true });
  let skyPhase = '';
  function paintSky() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, mo = d.getMonth();
    const rise = 7.5 - Math.cos((mo + 0.5) / 12 * Math.PI * 2) * 1.6, set = 17.5 + Math.cos((mo + 0.5) / 12 * Math.PI * 2) * -2.2 + 0.4; // (rough, for southern England)
    const ph = h < rise - 0.7 || h > set + 0.7 ? 'night' : h < rise + 0.6 ? 'dawn' : h > set - 0.6 ? 'dusk' : 'day';
    pb.classList.remove('rm-day', 'rm-dusk', 'rm-dawn', 'rm-night'); pb.classList.add('rm-' + ph);
    const g = skyTex.userData.g, W = 512, Hh = 256, p = Math.max(0, Math.min(1, (h - rise) / (set - rise)));
    const cols = { day: ['#3a7ae0', '#8ab8f0', '#d0e4ff'], dusk: ['#2a2a6a', '#a04a6a', '#ffa05a'], dawn: ['#3a3a7a', '#c07a8a', '#ffd09a'], night: ['#03050f', '#0a1230', '#18224a'] }[ph];
    g.fillStyle = A.lin(g, 0, 0, 0, Hh, [[0, cols[0]], [0.6, cols[1]], [1, cols[2]]]); g.fillRect(0, 0, W, Hh);
    if (ph === 'night') { const r = K.rnd(9); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; g.fillRect(r() * W, r() * Hh * 0.7, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1); } g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(380, 60, 13, 0, 7); g.fill(); g.fillStyle = cols[0]; g.beginPath(); g.arc(386, 56, 12, 0, 7); g.fill(); }
    else { const sx = 60 + p * 390, sy = 170 - Math.sin(p * Math.PI) * 130; const gr = g.createRadialGradient(sx, sy, 2, sx, sy, 60); gr.addColorStop(0, 'rgba(255,252,230,1)'); gr.addColorStop(0.25, 'rgba(255,240,190,.6)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(sx - 60, sy - 60, 120, 120); if (ph === 'day') { g.fillStyle = 'rgba(255,255,255,.75)'; [[90, 60, 70], [300, 40, 50], [420, 90, 60]].forEach(([x, y, w]) => { g.beginPath(); g.ellipse(x, y, w, 14, 0, 0, 7); g.ellipse(x - w * 0.3, y - 8, w * 0.4, 12, 0, 0, 7); g.fill(); }); } }
    // the backs of the houses over the way (lit windows at night), a tree, the fence, the shed, our lawn
    const N = ph === 'night', D = ph === 'day', sh = (d, n, m) => D ? d : N ? n : m;
    for (let k = 0; k < 7; k++) {
      const x = -30 + k * 82, y = 112 + (k % 2) * 3, w = 82, hh = 62;
      g.fillStyle = sh(['#b98a6a', '#a8826a', '#c09a7a'][k % 3], '#0c0d14', '#3a2e34'); g.fillRect(x, y, w, hh + 30);
      g.fillStyle = sh('#5a4a48', '#07080d', '#241c26'); g.beginPath(); g.moveTo(x - 4, y + 2); g.lineTo(x + w / 2, y - 26); g.lineTo(x + w + 4, y + 2); g.fill();
      g.fillStyle = sh('#8a6a5a', '#0a0b10', '#2c2228'); g.fillRect(x + w * 0.7, y - 34, 10, 20); g.fillStyle = sh('#6a5a50', '#06070a', '#1a1418'); g.fillRect(x + w * 0.7 - 1, y - 36, 12, 3);
      for (const [wx, wy] of [[x + 12, y + 14], [x + 48, y + 14], [x + 12, y + 50], [x + 48, y + 50]]) {
        const lit = N && ((k * 7 + wx) % 3 === 0);
        g.fillStyle = lit ? '#ffd27a' : sh('#9ab8d8', '#0a0e18', '#4a4a6a'); g.fillRect(wx, wy, 22, 18);
        g.fillStyle = sh('#f0ece4', '#15161c', '#5a5056'); g.fillRect(wx + 10, wy, 2, 18); g.fillRect(wx, wy + 8, 22, 2);
      }
    }
    g.fillStyle = sh('#2e4a26', '#05080a', '#1a2420'); g.beginPath(); g.arc(120, 150, 48, 0, 7); g.arc(150, 128, 40, 0, 7); g.arc(92, 132, 34, 0, 7); g.arc(170, 160, 30, 0, 7); g.fill();
    g.fillStyle = sh('#4a3a2a', '#05060a', '#1a1414'); g.fillRect(116, 160, 9, 60);
    g.fillStyle = sh('#7a5a3a', '#100c08', '#2a2018'); g.fillRect(0, 196, W, 26);
    g.fillStyle = sh('#8a6a44', '#140f0a', '#32261c'); for (let x = 0; x < W; x += 16) g.fillRect(x, 192, 13, 30);
    g.fillStyle = sh('#4a7a32', '#0a120a', '#24301c'); g.fillRect(0, 222, W, 34);
    g.fillStyle = sh('#6a8a3a', '#0c140c', '#2c3a22'); for (let x = 0; x < W; x += 6) g.fillRect(x, 222 + (x * 7) % 5, 2, 3);
    g.fillStyle = sh('#6a5236', '#120d08', '#2c2018'); g.fillRect(338, 170, 76, 46); g.fillStyle = sh('#4a3a2a', '#0a0806', '#201812'); g.beginPath(); g.moveTo(332, 172); g.lineTo(376, 152); g.lineTo(420, 172); g.fill();
    g.fillStyle = sh('#2a2018', '#050403', '#120e0a'); g.fillRect(366, 186, 16, 30);
    if (N) { g.fillStyle = 'rgba(0,0,20,.35)'; g.fillRect(0, 100, W, 156); }
    skyTex.needsUpdate = true;
    if (ph !== skyPhase) { skyPhase = ph; H.relight(); }
    return ph;
  }
  const night = () => skyPhase === 'night';

  // ---------------------------------------------------------------- things that switch on and off (the room's lights follow them)
  const LIGHT = { lamp: true, main: false, lava: true, telly: false, hifi: false };
  try { const l = JSON.parse(localStorage.getItem('jhp_hs_lights') || 'null'); if (l) Object.assign(LIGHT, l, { telly: false, hifi: false }); } catch (e) {}
  const saveLights = () => { try { localStorage.setItem('jhp_hs_lights', JSON.stringify(LIGHT)); } catch (e) {} };
  const L0 = () => (window.RoomCam && RoomCam.L) || { mx: -15, tx: 17, tz: -30, kx: -15, ux: 8, uz: 9.5 };

  // ================================================================ BUILDING IT
  const R = {}; // the bits we need later (meshes, materials)
  let pcPowered = mode === 'wake';
  const room = H.room('bedroom', {
    name: "Jack's room", title: "JACK'S ROOM", lvl: 'U', area: [[LX, BZ, RX, FZ]],
    bx0: LX + 2, bx1: RX - 2, bz0: BZ + 2, bz1: FZ - 2,
    lights: () => {
      const L = [];
      const ph = skyPhase || 'day', day = ph === 'day', dim = ph === 'dusk' || ph === 'dawn';
      if (LIGHT.lamp) { const p=R.lampSource||{x:-52.65,y:-33.65,z:-30};L.push({x:p.x,y:p.y,z:p.z,c:'#ffd6a3',i:1.2,d:190}); }
      if (LIGHT.main) L.push({ x: -20, y: -140, z: 90, c: '#fff0d6', i: 1.15, d: 680 });
      L.push({ x: 191, y: -60, z: -10, c: day ? '#e2ecff' : dim ? '#ffd0af' : '#8c9fc4', i: day ? .85 : dim ? .5 : .16, d: day ? 620 : 420 });
      if (LIGHT.lava) L.push({ x: 134, y: 4.6, z: BZ + 21, c: '#ff6d9c', i: .32, d: 150 });
      if (LIGHT.telly) L.push({ x: TX, y: -8, z: 20, c: '#9bb5ed', i: .32, d: 180 });
      if (pcPowered) L.push({ x: L0().mx, y: -24, z: 20, c: '#b3caec', i: .22, d: 150 });
      return L;
    },
    amb: () => { const ph = skyPhase || 'day'; if (ph === 'day') return {sky: '#d6dfe8', gnd: '#827361', i: .62 + (LIGHT.main ? .08 : 0)};
      if (LIGHT.main) return {sky: '#dfc9ad', gnd: '#75624e', i: .54};
      return ph === 'night' ? {sky: '#8896b0', gnd: '#4d4d58', i: .38} : {sky: '#c3a9aa', gnd: '#75614f', i: .52}; },
    sun: () => { const ph = skyPhase || 'day'; return { x: 260, y: -300, z: -420, tx: 0, ty: 73, tz: 60, c: ph === 'night' ? '#a2b6dc' : ph === 'day' ? '#fff2dc' : '#ffcfac', i: ph === 'night' ? .055 : ph === 'day' ? .28 : .16 }; },
    build(r) { buildBedroom(r); },
  });
  function buildBedroom(r) {
    const batch = K.batch(), B = K.into(batch);
    // ---- walls (the back one has the window in it, the right one the door), floor, Artex ceiling
    const wm = mWall();
    const wall = (x, y, z, w, h, ry) => B.plane(x, y, z, w, h, wm, { ry, uv: 128 });
    wall((LX + WIN.x0) / 2, (CY + FY) / 2, BZ, WIN.x0 - LX, FY - CY, 0);
    wall((WIN.x1 + RX) / 2, (CY + FY) / 2, BZ, RX - WIN.x1, FY - CY, 0);
    wall((WIN.x0 + WIN.x1) / 2, (CY + WIN.y0) / 2, BZ, WIN.x1 - WIN.x0, WIN.y0 - CY, 0);
    wall((WIN.x0 + WIN.x1) / 2, (WIN.y1 + FY) / 2, BZ, WIN.x1 - WIN.x0, FY - WIN.y1, 0);
    wall(LX, (CY + FY) / 2, (BZ + FZ) / 2, FZ - BZ, FY - CY, 90);
    wall((LX + RX) / 2, (CY + FY) / 2, FZ, RX - LX, FY - CY, 180);
    wall(RX, (CY + FY) / 2, (BZ + DOOR.z0) / 2, DOOR.z0 - BZ, FY - CY, -90);
    wall(RX, (CY + FY) / 2, (DOOR.z1 + FZ) / 2, FZ - DOOR.z1, FY - CY, -90);
    wall(RX, (CY + DOOR.y0) / 2, (DOOR.z0 + DOOR.z1) / 2, DOOR.z1 - DOOR.z0, DOOR.y0 - CY, -90);
    B.plane((LX + RX) / 2, FY, (BZ + FZ) / 2, RX - LX, FZ - BZ, M({ c: '#ffffff', map: tex('carpetBlue') }), { rx: 90, uv: 90 });
    B.plane((LX + RX) / 2, CY, (BZ + FZ) / 2, RX - LX, FZ - BZ, M({ c: '#ffffff', map: tex('artex') }), { rx: -90, uv: 110 });
    // skirting boards, the wallpaper border, coving where the walls meet the ceiling
    const skirt = (x0, z0, x1, z1, ry) => { const len = Math.hypot(x1 - x0, z1 - z0); B.box((x0 + x1) / 2, FY - 4.5, (z0 + z1) / 2, len, 9, 1.6, mSkirt, { ry }); };
    skirt(LX, BZ + 0.8, RX, BZ + 0.8, 0); skirt(LX + 0.8, BZ, LX + 0.8, FZ, 90); skirt(LX, FZ - 0.8, RX, FZ - 0.8, 0);
    skirt(RX - 0.8, BZ, RX - 0.8, DOOR.z0, 90); skirt(RX - 0.8, DOOR.z1, RX - 0.8, FZ, 90);
    const bm = M({ c: '#ffffff', map: tex('border') });
    for (const [x0, x1] of [[LX, WIN.x0], [WIN.x1, RX]]) borderRun(B, bm, x0, BZ + 0.15, x1, BZ + 0.15, 0);
    borderRun(B, bm, LX + 0.15, BZ, LX + 0.15, FZ, 90); borderRun(B, bm, LX, FZ - 0.15, RX, FZ - 0.15, 180);
    borderRun(B, bm, RX - 0.15, BZ, RX - 0.15, DOOR.z0, -90); borderRun(B, bm, RX - 0.15, DOOR.z1, RX - 0.15, FZ, -90);
    const cove = (x, z, len, ry) => B.plane(x, CY + 3.5, z, len, 7, mWhite, { ry, rx: 45 });
    cove((LX + RX) / 2, BZ + 3.5, RX - LX, 0); cove(LX + 3.5, (BZ + FZ) / 2, FZ - BZ, 90); cove((LX + RX) / 2, FZ - 3.5, RX - LX, 180); cove(RX - 3.5, (BZ + FZ) / 2, FZ - BZ, -90);
    // a little darkness where walls meet the floor and the ceiling (it reads as a real corner)
    const ao = (x, z, w, ry) => B.ao(x, FY - 17, z, w, 34, { ry, rx: 180, a: 0.55 });
    ao((LX + RX) / 2, BZ + 0.3, RX - LX, 0); ao(LX + 0.3, (BZ + FZ) / 2, FZ - BZ, 90); ao((LX + RX) / 2, FZ - 0.3, RX - LX, 180);
    [[BZ,DOOR.z0],[DOOR.z1,FZ]].forEach(([a,b])=>ao(RX-0.3,(a+b)/2,b-a,-90));
    const aoF = (x, z, w, d, ry) => B.ao(x, FY - 0.15, z, w, d, { rx: 90, ry, a: 0.45 });
    aoF((LX + RX) / 2, BZ + 15, RX - LX, 30, 180); aoF(LX + 15, (BZ + FZ) / 2, FZ - BZ, 30, -90); aoF((LX + RX) / 2, FZ - 15, RX - LX, 30, 0);
    [[BZ,DOOR.z0],[DOOR.z1,FZ]].forEach(([a,b])=>aoF(RX-15,(a+b)/2,b-a,30,90));
    const aoC = (x, z, w, ry) => B.ao(x, CY + 14, z, w, 28, { ry, a: 0.35 });
    aoC((LX + RX) / 2, BZ + 0.3, RX - LX, 0); aoC(LX + 0.3, (BZ + FZ) / 2, FZ - BZ, 90); aoC((LX + RX) / 2, FZ - 0.3, RX - LX, 180); aoC(RX - 0.3, (BZ + FZ) / 2, FZ - BZ, -90);

    buildWindow(B, r); buildDesk(B, r); buildTellyCorner(B, r); buildBed(B, r); buildWardrobe(B, r); buildFront(B, r); buildDoor(B, r); buildCeiling(B, r);
    batch.build(r.group);
    // where you can walk (the furniture is in the way: see the blocks in each part)
    H.walkRect('U', LX, BZ, RX, FZ, { room: 'bedroom' });
    H.walkRect('U', RX - 6, DOOR.z0 + 4, RX + 16, DOOR.z1 - 4, { door: 'bedroom', room: 'bedroom' });
    H.support('bedroom', -76, -55, 76, 31, 0); // the desk top
    const L = L0(); // the PC's own surfaces (things can sit on the tower and the keyboard)
    H.support('bedroom', L.tx - 9.5, L.tz - 16.5, L.tx + 9.5, L.tz + 17.5, -42.3);
    H.support('bedroom', L.kx - 14, 7, L.kx + 14, 16, -2.2);
    H.support('bedroom', 104, BZ, 140, -20, 21.6); // the bedside table
    H.support('bedroom', 150, BZ + 6, 236, 136, 30); // the bed
    H.support('bedroom', LX, 178, LX + 46, 246, -9); // the chest of drawers
    H.support('bedroom', TX - 36, -55, TX + 36, -13, 27.4); // the TV cabinet top
    H.block('U', -76, -60, 76, 33); // the desk
    paintSky();
  }
  function borderRun(B, m, x0, z0, x1, z1, ry) { const len = Math.hypot(x1 - x0, z1 - z0); const g = new T.PlaneGeometry(len, 13); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setX(i, uv.getX(i) * len / 120); uv.setY(i, 1 - uv.getY(i)); } B.geo(g, (x0 + x1) / 2, -96, (z0 + z1) / 2, m, { ry }); }

  // ---------------------------------------------------------------- the window (UPVC, double glazed, 1999), the curtains
  function buildWindow(B) {
    const cx = (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2, w = WIN.x1 - WIN.x0, h = WIN.y1 - WIN.y0, dep = 14;
    // the reveal (the wall is thick) and the outside
    B.plane(cx, WIN.y0, BZ - dep / 2, w, dep, M('#d8d4c8'), { rx: -90 });
    B.plane(cx, WIN.y1, BZ - dep / 2, w, dep, M('#d8d4c8'), { rx: 90 });
    B.plane(WIN.x0, cy, BZ - dep / 2, dep, h, M('#d0ccc0'), { ry: 90 });
    B.plane(WIN.x1, cy, BZ - dep / 2, dep, h, M('#d0ccc0'), { ry: -90 });
    // Outside is shared with the kitchen: never stack two sky cards here.
    // UPVC frame: outer frame, mullion, transom with a top opener
    const fm = M({ c: '#f2f0ea', sh: 40, sp: '#444' }), fz = BZ - dep + 3;
    B.box(cx, WIN.y0 + 3, fz, w, 6, 6, fm); B.box(cx, WIN.y1 - 3, fz, w, 6, 6, fm);
    B.box(WIN.x0 + 3, cy, fz, 6, h, 6, fm); B.box(WIN.x1 - 3, cy, fz, 6, h, 6, fm);
    B.box(cx, cy, fz, 5, h, 6, fm); B.box(cx, WIN.y0 + 30, fz, w, 5, 6, fm);
    B.box(cx + 18, WIN.y0 + 36, fz + 3.5, 8, 2, 2, mWhite); B.box(cx - 18, WIN.y0 + 36, fz + 3.5, 8, 2, 2, mWhite);
    B.plane(cx, cy, fz - 1, w - 6, h - 6, M({ c: '#c8d8f0', o: 0.12, sh: 120, sp: '#ffffff', tr: true }), {});
    // the sill: a dead cactus on it
    B.rbox(cx, WIN.y1 + 1.6, BZ + 1, w + 14, 3.2, 10 + dep - 6, 0.8, mWhite);
    B.shadow(cx, WIN.y1 + 3.4, BZ + 8, w + 10, 6, 0.4, { sq: true });
    const pot = B.at(WIN.x1 - 10, WIN.y1, BZ + 3);
    pot.lathe(0, -8, 0, [[3.6, -4], [3.2, 4]], 14, M('#b8582a'));
    pot.cyl(0, -14, 0, 1.6, 2, 8, 10, M({ c: '#5a7a3a', flat: true })); pot.ball(0, -18, 0, 1.6, 1.4, 1.6, M('#5a7a3a'), 8);
    pot.shadow(0, 0, 0, 10, 10, 0.5);
    // the curtain pole and the curtains, gathered at the sides (real folds, not a flat sheet)
    B.cyl(cx, WIN.y0 - 12, BZ + 6, 1.4, 1.4, w + 70, 10, mBrass, { rz: 90 });
    B.ball(cx - w / 2 - 37, WIN.y0 - 12, BZ + 6, 2.6, 2.6, 2.6, mBrass, 10); B.ball(cx + w / 2 + 37, WIN.y0 - 12, BZ + 6, 2.6, 2.6, 2.6, mBrass, 10);
    const cm = M({ c: '#ffffff', map: tex('curtain'), side: 2 });
    curtain(B, WIN.x0 - 20, WIN.y0 - 10, BZ + 7, 32, 128, cm);
    curtain(B, WIN.x1 + 20, WIN.y0 - 10, BZ + 7, 32, 128, cm);
  }
  function curtain(B, x, y, z, w, h, m) { // gathered fabric: soft pleats, a little fuller at the bottom
    const g = new T.PlaneGeometry(w, h, 48, 12), p = g.attributes.position, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), k = 0.75 + 0.25 * (py / h + 0.5); p.setZ(i, Math.sin(px / w * Math.PI * 14) * 2.6 * k + 2.6); u.setY(i, 1 - u.getY(i)); }
    g.computeVertexNormals();
    B.geo(K.thicken(g,.12),x,y+h/2,z,m,{});
  }

  // ---------------------------------------------------------------- the desk: the PC lives on it (boot.js), the lamp, the shelf above
  function loose(id,obj,home,label,options){
    const old=H.SPOTS[id],use=old&&old.act;
    if(old&&old.obj&&old.obj!==obj)old.obj.traverse(o=>{o.userData.noPick=true});
    obj.position.set(0,0,0);obj.rotation.set(0,0,0);obj.updateMatrixWorld(true);
    const t=H.thing(id,Object.assign({obj,home,label,kind:'roomprop',holdD:55,use:use?()=>wrap(id,use)(id):()=>H.inspect(id),useLabel:use?'Look inside':'Inspect'},options||{}));
    H.restoreThing(t);return t;
  }
  function buildDesk(B, r) {
    const dm = mDesk();
    B.rbox(0, 1.6, -12, 152, 3.2, 86, 0.6, dm, { uv: 60 });
    B.box(-74, 37, -12, 4, 70, 84, dm, { uv: 60 }); // the left end
    B.box(0, 36, -52.7, 144, 60, 1.4, M('#2a1c10')); // inset from both end boards
    // the drawer unit on the right (the top drawer opens: letters and floppies)
    B.box(56, 37.5, -11, 36, 71, 82, dm, { uv: 60, sides: 'trlbu' });
    B.box(56, 26, 29.4, 34, 22, 1.2, dm, { uv: 60 }); B.box(56, 49, 29.4, 34, 22, 1.2, dm, { uv: 60 });
    [26, 49].forEach(y => B.box(56, y, 30.6, 10, 1.6, 1.4, mBrass));
    B.shadow(0, FY, -12, 170, 100, 0.75, { sq: true });
    const dg = new T.Group(); dg.position.set(56, 0, 0); r.group.add(dg);
    const D = K.into(dg); D.box(0, 6.5, 29.4, 34, 9, 1.2, dm, { uv: 60 }); D.box(0, 6.5, 30.6, 10, 1.6, 1.4, mBrass); D.box(0, 10.5, 0, 32, 1, 58, M('#4a3420')); D.box(-15.5, 7, 0, 1, 8, 58, M('#4a3420')); D.box(15.5, 7, 0, 1, 8, 58, M('#4a3420'));
    D.plane(-5, 9.9, 6, 18, 24, M({ c: '#f4f0e0' }), { rx: 90, rz: 12 }); D.plane(6, 9.8, 12, 16, 20, M('#fffbe0'), { rx: 90, rz: -8 }); D.box(4, 9.4, -10, 9, 0.6, 9.4, M({ c: '#fff', map: tex('floppyLabel') }));
    H.openable('drawer', { label: 'Desk drawer', pivot: dg, type: 'slide', axis: 'z', amt: 22, base: 0, onToggle: open => { if (open) setTimeout(() => { if (H.OPEN.drawer && H.OPEN.drawer.open) bits('drawer'); }, 420); } });
    // An ordinary late-90s armless task chair: woven upholstery, a separate
    // padded back, moulded shell, gas lift and five twin-wheel castors.
    const chairGroup=new T.Group();chairGroup.name='desk-chair';
    const chairBatch=K.batch(),ch=K.into(chairBatch),chp=M({c:'#292b2f',sh:18,sp:'#24272a'}),steel=M({c:'#272a2c',sh:30}),chrome=M({c:'#90989e',sh:65,sp:'#727d83'}),rubber=M({c:'#202226',sh:2});
    const fabric=K.tex('rm.chair.fabric',128,128,(g,w,h)=>{g.fillStyle='#555e70';g.fillRect(0,0,w,h);const rand=K.rnd(9904);for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){g.fillStyle=rand()<.5?'rgba(19,26,40,.13)':'rgba(194,198,205,.11)';g.fillRect(x,y,1,2)}},{rep:[3,3]});
    const upholstery=M({c:'#d3d8df',map:fabric,sh:2,sp:'#090b0d'});
    const leg=new T.BoxGeometry(6,3.2,29,1,1,4),lp=leg.attributes.position;
    for(let i=0;i<lp.count;i++){const t=(lp.getZ(i)+14.5)/29;lp.setX(i,lp.getX(i)*(1-.48*t));lp.setY(i,lp.getY(i)+t*2.2)}leg.computeVertexNormals();
    for(let i=0;i<5;i++){
      const a=i*72,b=ch.at(0,0,0,a);b.geo(leg,0,-9.2,16.5,chp);
      const caster=b.at(0,0,29.5);caster.cyl(0,-6.4,0,.9,.9,2.4,12,chrome);caster.rbox(0,-4.8,-.5,1.8,4,3.8,.6,chp);caster.cyl(0,-3,0,.65,.65,5.6,12,steel,{rz:90});
      for(const side of [-1,1]){caster.cyl(side*2,-3,0,3,3,1.8,20,rubber,{rz:90});caster.cyl(side*2.94,-3,0,1.5,1.5,.16,16,chp,{rz:90});}
    }leg.dispose();
    ch.cyl(0,-8,0,5.5,6.4,8,24,chp);ch.cyl(0,-14,0,3.4,4.1,14,20,chp);ch.cyl(0,-25.5,0,2,2,23,20,chrome);ch.cyl(0,-35.5,0,4,3.8,4.5,20,steel);
    ch.rbox(0,-35.3,1,22,4.8,19,1.3,steel);ch.rbox(0,-39.2,1,45,3,42,1.4,chp);ch.rbox(0,-44.5,2,45,9,43,4,upholstery);
    // Backrest support stays attached to the seat pan and the rear shell.
    ch.rbox(0,-36.4,-17,6,3,15,1,steel);ch.rbox(0,-50,-23,5,30,3.5,1,steel);
    for(let i=0;i<8;i++)ch.box(0,-45-i*1.9,-25,5.6,.65,1.1,chp);
    ch.cyl(0,-52,-26.5,2.5,2.5,2.8,16,chp,{rx:90});ch.box(0,-52,-28,3.5,.65,.5,steel);
    const back=ch.at(0,-72,-20,0,{rx:-8});back.rbox(0,0,-2.2,42,33,7,3.2,chp);back.rbox(0,0,2.8,39.5,30.5,6,2.9,upholstery);
    for(const x of [-12,12]){back.rbox(x,0,-5.9,1.6,17,.8,.35,chp);for(const y of [-8,8])back.cyl(x,y,-6.4,.7,.7,.2,10,steel,{rx:90});}
    ch.cyl(17,-35,6,.55,.55,19,12,steel,{rz:90});ch.rbox(27,-35,6,7,2.4,4,1,chp);
    for(const x of [-8,8])for(const z of [-5,7])ch.cyl(x,-32.7,z,.65,.65,.5,10,chrome);
    const tag=K.tex('rm.chair.label',192,96,(g,w,h)=>{g.fillStyle='#c9c5af';g.fillRect(0,0,w,h);A.text(g,'TASKMATE',96,32,'700 22px '+A.UIF,'#272b2c','center');A.text(g,'TYPE 98 / CHECK FIXINGS',96,61,'12px '+A.UIF,'#272b2c','center');A.text(g,'HEIGHT ADJUSTMENT →',96,81,'11px '+A.UIF,'#272b2c','center')},{clamp:true});
    ch.decal(-14,-37.66,7,8,4,M({c:'#fff',map:tag}),{rx:-90});
    chairBatch.build(chairGroup);K.into(chairGroup).shadow(0,0,0,70,70,.52);
    chairGroup.userData.periodChair={type:'armless upholstered task chair',castors:5,wheels:10,seatHeight:44.5};
    loose('chair',chairGroup,{room:'bedroom',x:L0().mx+92,y:FY,z:100,ry:38},'My office chair',{kind:'furniture',holdD:90,obstacle:true,floorOnly:true,use:null});
    // the desk lamp (an anglepoise; it really lights the room)
    buildDeskLamp(r);
    // little things on the desk: revision books, a mug of cold tea, a pencil pot
    const books=new T.Group(),bk=K.into(books);
    ['MATHS','SCIENCE','ENGLISH','FRENCH'].forEach((subject,i)=>{const c=['#a73732','#355a91','#c59b36','#4b7552'][i],x=i*.6-1,y=-1.1-i*2.2,z=i*.4,cover=M(c);
      bk.box(x,y,z,20.4,1.6,28.4,M('#dedace'));bk.box(x-10.25,y,z,.5,2,29,cover);
      for(const yy of [y-.9,y+.9])bk.box(x,yy,z,21,.2,29,cover);
      const print=K.tex('rm.revision.'+subject,128,180,(g,w,h)=>{g.fillStyle=c;g.fillRect(0,0,w,h);g.fillStyle='#e9e4d5';g.fillRect(8,10,w-16,3);A.text(g,'GCSE',14,42,'700 22px '+A.UIF,'#eee9da');A.text(g,subject,14,72,'700 15px '+A.UIF,'#eee9da');A.text(g,'REVISION GUIDE',14,91,'10px '+A.UIF,'#eee9da');for(let k=0;k<5;k++){g.fillStyle='rgba(245,240,220,.2)';g.fillRect(14,113+k*7,80-k*8,2)}A.text(g,'1999 EDITION',14,163,'9px '+A.UIF,'#eee9da')},{clamp:true});
      bk.decal(x,y-1.01,z,20.5,28.5,M({c:'#fff',map:print}),{rx:90});
      for(let k=0;k<3;k++)bk.box(x+10.23,y-.5+k*.45,z,.08,.04,27.8,M('#b8b1a1'));
    });
    bk.shadow(0, 0, 0, 26, 34, 0.6, { sq: true });
    H.spot('books', { label: 'GCSE revision guides', act: () => { secret('hs.revise'); say('GCSE revision guides', ['MATHS, SCIENCE, ENGLISH, FRENCH. Exams in June. The spines aren\'t even cracked yet.', 'I opened the Maths one. Simultaneous equations. I closed the Maths one.', 'Mom bought these. She checks if they\'ve moved. I move them a bit every week.'][(S.bk = ((S.bk | 0) + 1) % 3)]); save(); } });
    loose('books',books,{room:'bedroom',x:-40,y:0,z:-38,ry:8},'GCSE revision guides');
    const mugObj=new T.Group(),mug=K.into(mugObj);
    const glaze=M({c:'#c54132',sh:40,sp:'#777'});
    mug.lathe(0,0,0,[[0,-.8],[3,-.8],[3.1,-8.7],[3.35,-9.4],[3.8,-9.5],[3.95,-9.2],[3.95,-.8],[3.4,0],[0,0]],32,glaze);
    mug.disc(0,-7.6,0,3.07,M({c:'#62432a',sh:28}),28);mug.geo(new T.TorusGeometry(2.6,.6,8,24,Math.PI),4.2,-4.6,0,glaze,{rz:-90});
    const mugLabel=K.tex('rm.mugprint',128,112,(g,w,h)=>{g.fillStyle='#c54132';g.fillRect(0,0,w,h);g.translate(0,h);g.scale(1,-1);A.text(g,"WORLD'S",64,32,'700 19px '+A.UIF,'#f6e8c9','center');A.text(g,'BEST SON',64,65,'700 18px '+A.UIF,'#f6e8c9','center');A.text(g,'from Gran',64,91,'italic 14px '+A.UIF,'#f6e8c9','center')},{clamp:true});
    mug.geo(new T.CylinderGeometry(3.98,3.98,4.5,24,1,true,-.66,1.32),0,-4.8,0,M({c:'#fff',map:mugLabel,sh:40}));
    mug.shadow(0, 0, 0, 11, 11, 0.6);
    H.spot('mug', { label: 'Mug of tea', act: () => say('Mug of tea', ['Stone cold. Mom made it at four o\'clock. There\'s a skin on it.', 'It says WORLD\'S BEST SON on it. Gran got it. Gran is biased.'][(S.mg = ((S.mg | 0) + 1) % 2)]) });
    loose('mug',mugObj,{room:'bedroom',x:46,y:0,z:-8,ry:0},'Mug of tea');
    const potObj=new T.Group(),pot=K.into(potObj);
    pot.lathe(0,0,0,[[0,-.5],[2.7,-.5],[2.7,-9.7],[2.9,-10],[3.2,-9.8],[3.2,0],[0,0]],24,M({c:'#355a91',sh:24}));pot.shadow(0,0,0,10,10,.5);
    [[-1,'#c6a347',8],[1,'#a9443a',-6],[0,'#34363a',3]].forEach(([dx,c,a])=>{const pen=pot.at(dx,-12,0,0,{rz:a});pen.cyl(0,0,0,.35,.35,14,6,M(c));pen.cyl(0,-7.5,0,.12,.35,1,6,M('#bca079'));pen.cyl(0,-8.1,0,.04,.12,.3,6,M('#252525'))});
    loose('pencilpot',potObj,{room:'bedroom',x:35,y:0,z:-42,ry:0},'Pencil pot');
    // the wall shelf over the desk: BUILDO shuttle, Buildex coaster, trophy, robot, PC game boxes
    const shY = -128, sh = B.at(-14, shY, BZ + 9);
    sh.rbox(0, 0, 0, 104, 2.4, 18, 0.4, mPine(), { uv: 50 });
    [-40, 40].forEach(x => { sh.box(x, 4, -7, 1.6, 6, 3, mMetal); sh.box(x, 3, -3, 1.6, 1.4, 9, mMetal); });
    B.wshadow(-14, shY + 9, BZ + 0.1, 108, 16, 0.5);
    shelfModels(r, -14, shY - 1.2, BZ + 9);
    // the cork board, the timetable
    const ck = new T.Group(); ck.position.set(42, -84, BZ + 1); r.group.add(ck); const CK = K.into(ck);
    CK.wshadow(0.8, 1.4, -0.85, 47, 35, 0.5);
    CK.box(0, 0, 0, 42, 30, 1.6, M({ c: '#ffffff', map: tex('cork') }));
    CK.box(0, -15.5, 0.4, 44, 1.6, 2.4, mPine()); CK.box(0, 15.5, 0.4, 44, 1.6, 2.4, mPine()); CK.box(-21.5, 0, 0.4, 1.6, 32, 2.4, mPine()); CK.box(21.5, 0, 0.4, 1.6, 32, 2.4, mPine());
    CK.plane(-12, -1, 1, 13, 18, M({ c: '#fff', map: tex('calendar') }), { rz: -2 }); CK.plane(4, -6, 1.1, 9, 8, M({ c: '#fff', map: tex('note') }), { rz: 5 }); CK.plane(13, -5, 1.15, 9, 9, M({ c: '#fff', map: tex('noteBlue') }), { rz: -4 });
    CK.plane(8, 6, 1.2, 14, 10, M({ c: '#fff', map: tex('photo') }), { rz: -3 });
    [[-12, -9.5], [4, -9.5], [13, -9], [8, 1.5]].forEach(([x, y], i) => CK.cyl(x, y, 1.9, 0.9, 0.9, 1.4, 8, M(['#d02a2a', '#2a8a3a', '#e8c020', '#2a5ad0'][i]), { rx: 90 }));
    H.spot('cork', { label: 'Cork board', obj: ck });
    poster(B, -52, -82, BZ, 30, 42, tex('posterShuttle'), 0); pickBox(r, 'postershuttle', -52, -82, BZ + 1, 30, 42, 2); H.SPOTS.postershuttle.label = 'Space shuttle poster';
    frame(B, 92, -84, BZ + 0.8, 24, 33, 1.4, M({ c: '#fff', map: tex('timetable') }), M('#2a2a2a'));
    H.spot('timetable', { label: 'School timetable', act: () => say('My timetable', 'Year 11. GCSE year. Double Maths on a Monday morning should be against the law. Tuesday has IT, the best lesson: we get to play Minesweeper at the end if we\'re quiet.') });
    pickBox(r, 'timetable', 92, -84, BZ + 1, 24, 33, 2);
  }
  // models on the shelf: proper little solids
  function shelfModels(r, x0, y, z) {
    const g = new T.Group(); g.position.set(x0, y, z); r.group.add(g); const S2 = K.into(g);
    const sp = S2.at(-36, 0, 0); // the BUILDO space shuttle stack (tank, boosters, orbiter) on a black base
    sp.box(0, -1, 0, 14, 2, 10, M('#2a2a2a')); sp.cyl(0, -16, 0, 2.6, 2.6, 26, 14, M({ c: '#d8742a' })); sp.lathe(0, -29, 0, [[0.1, -4], [2.6, 0]], 14, M('#d8742a'));
    [-3.8, 3.8].forEach(x => { sp.cyl(x, -14, 0, 1.3, 1.3, 24, 10, mWhite); sp.lathe(x, -26, 0, [[0.1, -2.5], [1.3, 0]], 10, mWhite); });
    sp.box(0, -14, 3.4, 4, 20, 3, mWhite); sp.box(0, -8, 4.5, 10, 2, 5, mWhite); sp.box(0, -24, 4, 3, 3, 2.2, M('#222'));
    sp.shadow(0, 0, 0, 16, 12, 0.6, { sq: true });
    const kx = S2.at(4, 0, -2), rod = M('#9a9aa0'), conn = M('#2a6ae0'), trk = M('#d8261c'); // the Buildex roller coaster
    [[-14, 14], [-4, 18], [6, 13], [14, 9]].forEach(([x, hgt]) => [-3, 3].forEach(zz => { kx.cyl(x, -hgt / 2, zz, 0.3, 0.3, hgt, 5, rod); kx.ball(x, -hgt, zz, 0.8, 0.8, 0.8, conn, 6); }));
    const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, x = -16 + t * 32; pts.push(new T.Vector3(x, -(10 + Math.sin(t * Math.PI * 2.2) * 6 + (1 - t) * 6), 0)); }
    [-3, 3].forEach(zz => kx.geo(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => p.clone().setZ(zz))), 40, 0.4, 5), 0, 0, 0, trk));
    kx.box(-6, -19.5, 0, 3.4, 2, 6.6, M('#22aa44')); kx.box(0, -0.5, 0, 34, 1, 9, M('#d8d8d8'));
    const tr = S2.at(30, 0, 0); tr.box(0, -1.5, 0, 6, 3, 5, M('#2a1a10')); tr.cyl(0, -5, 0, 0.8, 1.2, 4, 8, mBrass); tr.lathe(0, -11, 0, [[3.4, -4], [2.6, 0], [0.8, 3]], 14, M({ c: '#f0c030', sh: 90, sp: '#ffe080' })); tr.shadow(0, 0, 0, 8, 7, 0.5, { sq: true });
    const rb = S2.at(44, 0, 1), rm = M({ c: '#c8c8d0', sh: 40, sp: '#666' }); // the robot from robot club
    rb.box(-2, -2.5, 0, 2, 5, 2.2, rm); rb.box(2, -2.5, 0, 2, 5, 2.2, rm); rb.rbox(0, -8.5, 0, 7, 7, 4.4, 0.6, rm); rb.rbox(0, -14, 0, 5.4, 4, 4, 0.6, M('#d8d8e0'));
    rb.ball(-1.2, -14.4, 2, 0.7, 0.7, 0.3, M({ c: '#e8261c', e: '#600' }), 6); rb.ball(1.2, -14.4, 2, 0.7, 0.7, 0.3, M({ c: '#e8261c', e: '#600' }), 6);
    rb.box(-4.6, -9, 0, 1.6, 5, 1.8, M('#a8a8b0')); rb.box(4.6, -9, 0, 1.6, 5, 1.8, M('#a8a8b0')); rb.cyl(0, -17, 0, 0.2, 0.2, 2.4, 4, mMetal); rb.ball(0, -18.4, 0, 0.6, 0.6, 0.6, M('#f0c000'), 6);
    rb.box(0, -9, 2.3, 4, 3, 0.4, M({ c: '#2a6ae0', e: '#0a1a40' }));
    [['#1a1a2a', 0], ['#7a1a1a', 4]].forEach(([c, dx]) => S2.rbox(-50 + dx, -12, 0, 3.6, 24, 17, 0.3, M(c), { rz: dx ? -6 : 0 }));
    H.spot('shelf', { label: 'My shelf', obj: g });
  }
  // an invisible click box (for things built into the room's merged geometry)
  const PICK = new T.MeshBasicMaterial({ visible: false });
  function pickBox(r, id, x, y, z, w, h, d, ry) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), PICK); m.position.set(x, y, z); m.rotation.y = (ry || 0) * D2R; r.group.add(m); m.userData.spot = id; const s = H.SPOTS[id]; H.spot(id, Object.assign({}, s || { label: id }, { obj: m })); return m; }

  function buildDeskLamp(r) {
    const lamp=new T.Group();lamp.name='desk-lamp';lamp.position.set(-62,0,-40);r.group.add(lamp);
    const fixed=K.batch(),LP=K.into(fixed),enamel=M({c:'#303238',sh:28,sp:'#35363a'});
    LP.cyl(0,-1.25,0,6.1,6.5,2.5,32,enamel);LP.cyl(0,-0.16,0,6.1,6.1,0.25,32,M('#1a1c20'));LP.shadow(0,0,0,17,17,0.6);
    LP.cyl(-1,-3,0,1.6,1.8,1.8,16,enamel);
    const base=new T.Vector3(-1,-3,0),elbow=new T.Vector3(-7,-23,0),head=new T.Vector3(10,-35,10),angle=0.45;
    const wrist=new T.Vector3(head.x+Math.sin(angle)*5,head.y-Math.cos(angle)*5,0);
    function rod(a,b,radius,material){const d=b.clone().sub(a),g=new T.CylinderGeometry(radius,radius,d.length(),10);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));const mid=a.clone().add(b).multiplyScalar(0.5);LP.geo(g,mid.x,mid.y,mid.z,material)}
    for(const [a,b]of [[base,elbow],[elbow,wrist]]){
      for(const z of [-0.9,0.9])rod(a.clone().setZ(z),b.clone().setZ(z),0.38,enamel);
      const p=a.clone().lerp(b,0.22).setZ(1.45),q=a.clone().lerp(b,0.78).setZ(1.45),axis=q.clone().sub(p).normalize(),side=new T.Vector3(-axis.y,axis.x,0),pts=[];
      for(let i=0;i<=100;i++){const t=i/100,phase=t*Math.PI*18,rad=0.38*Math.sin(Math.PI*t);pts.push(p.clone().lerp(q,t).addScaledVector(side,Math.cos(phase)*rad).add(new T.Vector3(0,0,Math.sin(phase)*rad)))}
      LP.geo(new T.TubeGeometry(new T.CatmullRomCurve3(pts),120,0.09,5),0,0,0,mMetal);
      for(const v of [p,q]){rod(v.clone().setZ(0.9),v,0.15,mMetal);LP.ball(v.x,v.y,v.z,0.22,0.22,0.22,mMetal,8)}
    }
    for(const p of [base,elbow,wrist]){LP.cyl(p.x,p.y,0,1.1,1.1,2.8,16,enamel,{rx:90});for(const z of [-1.5,1.5])LP.cyl(p.x,p.y,z,0.55,0.55,0.3,12,mMetal,{rx:90})}
    rod(wrist,new T.Vector3(wrist.x,wrist.y,head.z),0.65,enamel); // mount behind the head: neither arm crosses the shade opening
    fixed.build(lamp);
    const shade=new T.Group();shade.name='lamp-shade';shade.position.copy(head);shade.rotation.z=angle;lamp.add(shade);const SH=K.into(shade);
    // A closed metal shell with a rolled rim and separately lit cream interior.
    const profile=[[1.9,-5],[2.4,-4.7],[3.2,-2],[5.2,1.5],[7.4,4.5],[7.6,5],[7.3,5.3],[7,4.8],[4.8,1.7],[2.8,-1.7],[1.8,-4.2],[1.5,-4.2],[1.5,-5],[1.9,-5]];
    const shell=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),32),indices=shell.index.array,outer=[],inner=[];
    for(let seg=0;seg<32;seg++)for(let j=0;j<profile.length-1;j++){const dest=j>=6&&j<=10?inner:outer,start=(seg*(profile.length-1)+j)*6;for(let k=0;k<6;k++)dest.push(indices[start+k])}
    shell.setIndex(outer.concat(inner));shell.clearGroups();shell.addGroup(0,outer.length,0);shell.addGroup(outer.length,inner.length,1);
    R.lampLiner=M({c:'#d9d2bd',e:'#000000',sh:12}).clone();
    const shellMesh=new T.Mesh(shell,[enamel,R.lampLiner]);shellMesh.name='lamp-shell';shade.add(shellMesh);
    SH.cyl(0,-3,0,1.35,1.35,3,16,M('#4a4540'));SH.cyl(0,-0.8,0,1,1,1.6,16,mMetal);
    R.bulb=SH.ball(0,1.5,0,2,2.4,2,M({c:'#e4dfd0',e:'#000000',sh:25}).clone(),20);R.bulb.name='lamp-bulb';
    R.lampSource=new T.Vector3(0,1.5,0).applyAxisAngle(new T.Vector3(0,0,1),angle).add(head).add(lamp.position);
    R.lampButton=K.into(lamp).rbox(2,-2.6,1.4,2.2,0.8,1.4,0.25,M('#55585d'));R.lampButton.name='lamp-switch';R.lampButton.matrix.decompose(R.lampButton.position,R.lampButton.quaternion,R.lampButton.scale);
    const cable=K.into(lamp);lead(cable,[[0,-1.1,-6.2],[-3,-0.65,-9],[-8,-0.65,-10],[-10,-0.65,-12],[-10,-0.65,-15],[-10,-0.65,-15.65],[-10,0.2,-15.65],[-10,6,-15.65],[-19,20,-15.65],[-25,42,-13.3],[-32,50,-12.5],[-32,54,-12.5]],'#28282b','desk-lamp-power');
    cable.rbox(-32,54,-13.9,3.3,3.8,1.4,0.35,M('#353536'));cable.cyl(-32,54,-12.9,0.5,0.5,0.8,10,M('#29292b'),{rx:90});
    H.spot('lamp',{label:'Desk lamp',obj:lamp,act:()=>{
      LIGHT.lamp=!LIGHT.lamp;saveLights();lampLook();H.relight();sfx('click');
      const hidden=CAT.FINDS.filter(f=>f.spot==='lamp'&&isOut(f.from)&&!S.f[f.id]);if(hidden.length&&Math.random()<0.5)return foundIt(hidden[0]);
      say('Desk lamp',LIGHT.lamp?'Click. On. It gets REALLY hot. Do not touch the shade.':'Click. Off. Spooky.');
    }});
    R.lampLiner=shellMesh.material[1]; // interaction adoption gives each picked mesh its own materials
  }

  // ---------------------------------------------------------------- the telly corner: cabinet, telly, consoles, CD rack, beanbag
  function buildTellyCorner(B, r) {
    const pm = mPine();
    const cab = B.at(TX, 0, -34); // the TV cabinet (pine, two shelves, open front)
    cab.box(0, 28.6, 0, 72, 2.4, 42, pm, { uv: 50 }); cab.box(0, 71.6, 0, 72, 2.4, 42, pm, { uv: 50 }); cab.box(0, 51, 0, 68, 1.8, 40, pm, { uv: 50 });
    cab.box(-35, 50, 0, 2.2, 44, 42, pm, { uv: 50 }); cab.box(35, 50, 0, 2.2, 44, 42, pm, { uv: 50 });
    // Rear braces leave real cable-access openings behind both shelves.
    const back=M('#3a2414');
    [-32,0,32].forEach(x=>cab.box(x,50,-20.4,4,40,1.2,back));
    [30,52.5,70].forEach(y=>cab.box(0,y,-20.4,68,3,1.2,back));
    cab.shadow(0, FY, 0, 80, 50, 0.7, { sq: true });
    // the telly: a 14-inch portable, with a proper deep back
    const tv = new T.Group(); tv.position.set(TX, 27.4, -36); r.group.add(tv); const TV = K.into(tv);
    TV.rbox(0, -17, 4, 46, 34, 14, 1.6, M({ c: '#4a4c52', sh: 25, sp: '#333' }));
    TV.geo(taper(38, 28, 14, 0.62), 0, -17, -10, M('#36383d')); // deep CRT back, clear of the wall and its leads
    TV.box(0, -2.5, 10.9, 40, 4, 0.4, M('#2a2c30'));
    TV.rbox(-3, -19, 11.12, 35.2, 27, 0.72, 0.34, M({ c: '#111619', sh: 45, sp: '#35424b' }));
    const scr = new T.Mesh(crtGlass(33, 24.75, 0.3, 0.38), new T.MeshBasicMaterial({ color: 0xffffff, map: tex('screenOff') }));
    scr.position.set(-3, -19, 11.52); tv.add(scr); R.tvScreen = scr;
    TV.plane(18.5, -22, 11.21, 5.5, 7, M({ c: '#fff', map: K.tex('rm.grille', 32, 64, (g, w, h) => { g.fillStyle = '#3a3c42'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1b1f'; for (let y = 2; y < h; y += 4) g.fillRect(2, y, w - 4, 2); }) }));
    TV.cyl(18.5, -12, 11.4, 1.6, 1.6, 0.8, 14, M({ c: '#2a2c30', sh: 40 }), { rx: 90 }); TV.box(18.5, -12, 11.9, 0.5, 2.2, 0.3, M('#ddd'));
    [-8.5, -6.5, -4.5].forEach(y => TV.cyl(17, y, 11.3, 0.55, 0.55, 0.6, 8, M('#111'), { rx: 90 })); [-8.5, -6.5, -4.5].forEach(y => TV.cyl(20, y, 11.3, 0.55, 0.55, 0.6, 8, M('#111'), { rx: 90 }));
    TV.plane(-3, -3.2, 11.21, 10, 1.6, M({ c: '#fff', map: K.tex('rm.tvbrand', 128, 20, (g, w, h) => { g.fillStyle = '#4a4c52'; g.fillRect(0, 0, w, h); A.text(g, 'FERGUSSON', 64, 15, '700 13px ' + A.UIF, '#c8c8c8', 'center'); }) }));
    TV.ball(18.5, -2.8, 11.1, 0.6, 0.6, 0.3, M({ c: '#e01a1a', e: '#a00' }), 6);
    TV.box(0, -34.5, -2, 10, 1.2, 8, M('#222')); TV.geo(new T.TorusGeometry(9, 0.35, 6, 24), 0, -45, -2, M('#888'));
    TV.cyl(-5, -40, -2, 0.25, 0.25, 12, 4, mMetal, { rz: 25 }); TV.cyl(5, -40, -2, 0.25, 0.25, 12, 4, mMetal, { rz: -25 });
    TV.shadow(0, 0, 0, 52, 38, 0.6, { sq: true });
    H.spot('telly', { label: 'The telly', obj: tv });
    // consoles on the shelves (each a solid, with its own top)
    con(r, 'n64', TX - 17, 50.1, -26, 26, 7, 19, 'n64top', '#2b2b2e', 'Ultra 64');
    con(r, 'ps', TX + 16, 51 - 0.9, -26, 27, 6, 19, 'pstop', '#b9b6ae', 'PlaySpace');
    con(r, 'md', TX - 17, 70.4, -26, 26, 6, 19, 'mdtop', '#18181a', 'Segue');
    const dcOut = isOut(CAT.CONSOLES.dc.from); R.dcOut = dcOut;
    if (dcOut) con(r, 'dc', TX + 16, 70.4, -26, 21, 7, 19, 'dctop', '#efeee8', 'Daydream');
    else { const wl = new T.Group(); wl.position.set(TX + 16, 70, -20); r.group.add(wl); K.into(wl).plane(0, -6, 0, 18, 12, M({ c: '#fff', map: wishTex() }), { rx: -8 }); H.spot('dcbox', { label: 'Christmas list', obj: wl }); }
    if (dcOut) { // the Daydream's box, on the floor by the cabinet (there's still stuff in it)
      const db = new T.Group(); db.position.set(TX + 52, FY, -28); db.rotation.y = -20 * D2R; r.group.add(db); const DB = K.into(db);
      DB.box(0, -11, 0, 30, 22, 24, { f: M({ c: '#fff', map: dcBoxTex() }), all: M('#e8e8e2') }); DB.shadow(0, 0, 0, 34, 28, 0.6, { sq: true });
      H.spot('dcbox', { label: 'Daydream box', obj: db }); H.block('U', TX + 34, -44, TX + 70, -10);
    }
    // the leads and controllers on the rug
    const pads = new T.Group(); r.group.add(pads); const padsBatch=K.batch(),PD=K.into(padsBatch);
    pads.name='console-controllers';
    const padY=FY-0.3, floorY=FY-0.62;
    padN64(PD.at(TX - 10, padY, 26, 16)); padPS(PD.at(TX + 16, padY, 30, -12));
    const socket=(x,y,col)=>{PD.rbox(x,y,-15.15,2.6,1.5,2.5,0.3,M(col));};
    const end=(x,z,ry)=>{const a=ry*D2R;return[x-Math.sin(a)*7.2,padY-1.8,z-Math.cos(a)*7.2]};
    socket(TX-24.54,48,'#222326');socket(TX+8.17,48,'#85847f');
    // Stay in front of the shelf lip while descending; slack rests ON the rug.
    lead(PD,[[TX-24.54,48,-13.9],[TX-24.54,48,-9],[TX-24.54,68,-7],[TX-25,floorY,-3],[TX-26,floorY,7],[TX-22,floorY,14],[TX-15,floorY,15],end(TX-10,26,16)],'#27282b','ultra-pad');
    lead(PD,[[TX+8.17,48,-13.9],[TX+8.17,48,-8],[TX+8.17,68,-6],[TX+10,floorY,1],[TX+23,floorY,8],[TX+26,floorY,17],[TX+21,floorY,21],end(TX+16,30,-12)],'#8a877f','playspace-pad');
    lead(PD,[[TX+5,16,-53],[TX+5,16,-55.45],[TX+27,24,-55.45],[TX+29,60,-55.45],[TX+39,60,-55.45],[TX+39,60,-53.85],[TX+39,FY-0.6,-53.85],[-105,FY-0.6,-53.85],[-100,69,-53.85],[-100,60,-52.5],[-100,54,-52.5]],'#252527','tv-power');
    PD.rbox(-97,54,BZ+0.7,18,8,1.4,0.5,mWhite);
    PD.rbox(-100,54,-53.9,3.3,3.8,1.4,0.35,M('#353536'));
    PD.cyl(-100,54,-52.9,0.5,0.5,0.8,10,M('#29292b'),{rx:90});
    PD.box(-90.5,53.7,-54.52,1.2,1.8,0.2,M('#a39c8d'));
    padsBatch.build(pads);pads.userData.cables=padsBatch.routes;
    H.spot('pads', { label: 'Controllers', obj: pads, act: () => say('Controllers', 'The Ultra 64 pad and the PlaySpace pad. D-pads, shoulder buttons, and a loose stick from too much Kart Kaos. Their leads run back to the console sockets.') });
    // behind the telly: a nest of leads (where the Segue game fell)
    const nest = new T.Group(); nest.name='console-av-leads';r.group.add(nest);const nestBatch=K.batch(),NS=K.into(nestBatch);
    // Connected AV leads through the rear openings, not through the solid back/shelves.
    lead(NS,[[TX-17,46,-35.4],[TX-17,46,-55.45],[TX-23,40,-55.45],[TX-23,22,-55.45],[TX-8,18,-55.45],[TX-8,18,-53]],'#242426','ultra-av');
    lead(NS,[[TX+16,47,-35.4],[TX+16,47,-55.45],[TX+22,39,-55.45],[TX+22,23,-55.45],[TX-3,18.5,-55.45],[TX-3,18.5,-53]],'#76746f','playspace-av');
    nestBatch.build(nest);nest.userData.cables=nestBatch.routes;
    pickBox(r, 'tvback', TX, 14, -50, 46, 30, 10);
    // the rug
    B.plane(TX + 10, FY - 0.25, 30, 120, 76, M({ c: '#fff', map: tex('rug') }), { rx: 90 });
    B.box(TX + 10, FY - 0.15, 30, 121, 0.3, 77, M('#5a1818'), { sides: 'frlb' });
    pickBox(r, 'rug', TX + 10, FY - 1, 30, 120, 2, 76);
    // the beanbag: a soft lump with a dent where he sits
    const bb = new T.Group(); bb.position.set(TX + 78, FY, 56); r.group.add(bb); const BG = K.into(bb), bm = M({ c: '#ffffff', map: tex('beanbag'), sh: 3, sp: '#231112' });
    bb.name = 'beanbag';
    // One closed fabric skin: a depressed seat, raised back and squashy floor contact.
    const profile = [[0,-17],[5,-17],[10,-18],[15,-21],[20,-26],[24,-29],[28,-27],[31,-21],[32,-13],[31,-6],[28,-1],[20,-0.1],[0,-0.1]];
    const clothPoint = (rad,y,a) => {
      const fold = Math.sin(a*6+0.4)*0.55*Math.sin(Math.PI*rad/32);
      const squash=(Math.max(0,Math.cos(a))*7-Math.max(0,-Math.cos(a))*12)*Math.sin(Math.PI*rad/32);
      return new T.Vector3(Math.sin(a)*(rad+fold),y+squash,Math.cos(a)*(rad+fold)*0.88);
    };
    const skin = new T.LatheGeometry(profile.map(([rad,y])=>new T.Vector2(rad,y)),48), pos=skin.attributes.position;
    for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getX(i),pos.getZ(i)),p=clothPoint(Math.hypot(pos.getX(i),pos.getZ(i)),pos.getY(i),a);pos.setXYZ(i,p.x,p.y,p.z)}
    skin.computeVertexNormals(); BG.geo(skin,0,0,0,bm);
    const seamM=M({c:'#b85b51',sh:3}),seams=K.batch(),SB=K.into(seams);
    for(let panel=0;panel<6;panel++){
      const points=profile.map(([rad,y])=>clothPoint(rad+0.12,y-0.14,panel*Math.PI/3));
      for(let i=1;i<points.length;i++)SB.geo(new T.TubeGeometry(new T.LineCurve3(points[i-1],points[i]),1,0.055,4),0,0,0,seamM);
    }
    seams.build(bb);
    BG.rbox(0,-4,-26.9,7,0.7,1,0.2,M('#601b20')); // concealed refill zip and pull, above the carpet
    BG.box(3.1,-4.5,-27.1,0.7,0.25,1.1,mMetal);
    BG.shadow(0,0,0,67,60,0.65);
    loose('beanbag',bb,{room:'bedroom',x:TX+78,y:FY,z:56,ry:0},'The beanbag',{kind:'furniture',holdD:95,obstacle:true,floorOnly:true,use:null});
    // the games mags on the floor
    const mg = new T.Group(); mg.position.set(TX + 34, FY, 58); mg.rotation.y = -8 * D2R; r.group.add(mg); const MG = K.into(mg);
    ['magC', 'magB', 'mag'].forEach((t, i) => MG.box(i * 0.8 - 1, -0.45 - i * 0.9, i * 0.6, 21, 0.8, 28, { t: M({ c: '#fff', map: tex(t) }), all: M('#f0eee8') }, { ry: [6, -5, 9][i] }));
    MG.shadow(0, 0, 0, 28, 34, 0.6, { sq: true });
    H.spot('mags', { label: 'Games mags', obj: mg });
    // Open media rack: twenty separate slots, with enough clearance for a disc
    // or cartridge. Its shelves really support objects dropped onto them.
    const rk = new T.Group(); rk.position.set(TX - 56, FY, -44); r.group.add(rk); const RK = K.into(rk);
    const rackM = M({ c: '#36322d', sh: 18 });
    RK.box(-16, -40, 0, 1.2, 80, 22, rackM); RK.box(16, -40, 0, 1.2, 80, 22, rackM);
    RK.box(0, -40, -10.5, 31, 80, 1, M('#22201e'));
    RK.box(0, -80.5, 0, 33.2, 1.2, 22, rackM);
    for (let row = 0; row < 5; row++) {
      const y = 7 + row * 15;
      RK.box(0, y - FY + 0.6, 0, 31, 1.2, 22, rackM);
      H.support('bedroom', TX - 71.4, -54, TX - 40.6, -33, y);
      for (let col = 0; col < 4; col++) {
        RK.box(-10.5 + col * 7, y - FY - 0.3, 3, 0.5, 0.6, 15, M('#151515'), { ry: 65 });
      }
    }
    RK.shadow(0, 0, 0, 36, 26, 0.7, { sq: true });
    H.spot('rack', { label: 'Game shelf', obj: rk }); H.block('U', TX - 74, -56, TX - 38, -31);
    H.block('U', TX - 38, -60, TX + 38, -11); // the cabinet
    // posters over the telly and on the side wall
    poster(B, TX, -64, BZ, 34, 46, tex('posterBand'), 0); pickBox(r, 'posterband', TX, -64, BZ + 1, 34, 46, 2); H.SPOTS.posterband.label = 'Band poster';
    poster(B, TX - 58, -96, BZ, 28, 40, tex('posterFilm'), 0); pickBox(r, 'posterfilm', TX - 58, -96, BZ + 1, 28, 40, 2); H.SPOTS.posterfilm.label = 'Film poster';
    poster(B, LX, -70, 20, 32, 45, tex('posterGame'), 90); pickBox(r, 'postergame', LX + 1, -70, 20, 2, 45, 32);
    H.spot('postergame', { label: 'HYPER DRIVE 2000 poster', act: () => say('HYPER DRIVE 2000', 'A free poster off the front of JACK ATTACK! issue 9. The game isn\'t even out yet. It might never be. The poster is still amazing.') });
    // the bin (round, a crisp packet poking out)
    const bn = new T.Group(); bn.position.set(-118, FY, -42); r.group.add(bn); const BN = K.into(bn);
    BN.lathe(0, 0, 0, [[9, -27], [10.2, -27], [8.4, 0], [0.2, 0]], 18, M({ c: '#2a5ad0', sh: 30, sp: '#333', side: 2 }));
    BN.disc(0, -20, 0, 9, M('#111'), 18);
    BN.box(2, -27, 0, 9, 7, 2, M('#e8c020'), { rz: 20, ry: 20 }); BN.ball(-3, -24, 2, 4, 3, 4, M('#f4f4f4'), 8);
    BN.shadow(0, 0, 0, 24, 24, 0.7);
    H.spot('bin', { label: 'The bin', obj: bn }); H.block('U', -130, -56, -106, -30);
  }
  // a console: a body (rounded), its top painted, extra details
  function con(r, id, x, y, z, w, h, d, top, col, label, extra) {
    const g = new T.Group(); g.position.set(x, y, z); r.group.add(g); const C = K.into(g);
    C.rbox(0, -h / 2, 0, w, h, d, 0.8, M({ c: col, sh: 18, sp: '#222' }));
    C.plane(0, -h - 0.02, 0, w - 1.6, d - 1.6, M({ c: '#fff', map: tex(top) }), { rx: 90 });
    const slotY = y - h - 0.24;
    R.consoles = R.consoles || {};
    const machine = R.consoles[id] = { obj: g, x, y: slotY, z: z - 1, disc: CAT.CONSOLES[id].media === 'disc' };
    if (machine.disc) {
      C.cyl(0, -h - 0.14, -1, 6.8, 6.8, 0.2, 40, M('#292a2d'));
      C.cyl(0, -h - 0.28, -1, 0.7, 0.7, 0.4, 12, M('#777b80'));
      const lid = new T.Group(); lid.position.set(0, -h - 0.3, -7.5); g.add(lid);
      K.into(lid).cyl(0, 0, 6.5, 6.8, 6.8, 0.45, 40, M({ c: col, sh: 28, sp: '#555' }));
      machine.lid = lid; lid.rotation.x = 72 * D2R;
    } else {
      C.rbox(0, -h - 0.18, -1, 11.4, 0.45, 3.4, 0.18, M('#4b4b50'));
      C.box(0, -h - 0.43, -1, 10.4, 0.12, 2.3, M('#0c0d0e'));
    }
    for (const xx of [-w * 0.29, w * 0.29]) C.rbox(xx, -2.1, d / 2 + 0.08, 3.2, 1.5, 0.4, 0.15, M('#17181a'));
    C.shadow(0, 0, 0, w + 4, d + 4, 0.55, { sq: true });
    if (extra) extra(g);
    H.spot(id, { label, obj: g });
  }
  function padShell(P,shape,col) {
    const shell=(depth,y,scale,m)=>{const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:0.16,bevelThickness:0.16,bevelSegments:2,curveSegments:6,steps:1});g.rotateX(Math.PI/2);g.scale(scale,1,scale);P.geo(g,0,y,0,m)};
    shell(1.2,-0.2,1,M({c:'#33353a',sh:15}));
    shell(1.35,-1.4,0.985,M({c:col,sh:19,sp:'#303136'}));
    // Rear strain relief and shoulder buttons, all separate solids.
    P.cyl(0,-1.8,-6.65,0.43,0.43,1.3,10,M('#26272a'),{rx:90});
    [-5.3,5.3].forEach(x=>P.rbox(x,-2.45,-4.7,3.7,0.95,1.7,0.3,M('#44464c')));
    [-5,5].forEach(x=>P.cyl(x,-0.21,1,0.38,0.38,0.2,8,M('#222326')));
  }
  function dpad(P,x,z) {
    const m=M({c:'#33363b',sh:12});P.cyl(x,-2.88,z,1.9,1.9,0.16,20,M('#76777c'));
    P.rbox(x,-3.1,z,1.05,0.55,3.2,0.13,m);P.rbox(x,-3.1,z,3.2,0.55,1.05,0.13,m);P.cyl(x,-3.4,z,0.45,0.45,0.1,12,m);
  }
  function padN64(P) {
    const s=new T.Shape();s.moveTo(-7,-5);s.quadraticCurveTo(-9,-4,-8,0);s.lineTo(-7.8,7);s.quadraticCurveTo(-6,10,-4.5,7);s.lineTo(-3,2.8);s.quadraticCurveTo(-2,2,-1.9,4);s.lineTo(-1.7,9);s.quadraticCurveTo(0,11,1.7,9);s.lineTo(1.9,4);s.quadraticCurveTo(2,2,3,2.8);s.lineTo(4.5,7);s.quadraticCurveTo(6,10,7.8,7);s.lineTo(8,0);s.quadraticCurveTo(9,-4,7,-5);s.quadraticCurveTo(0,-7,-7,-5);s.closePath();
    padShell(P,s,'#71747c');dpad(P,-4.8,-1.9);
    P.cyl(0,-2.9,1.2,2,2,0.25,8,M('#40434a'));P.cyl(0,-3.65,1.2,0.38,0.4,1.2,12,M('#a6a7ad'));P.cyl(0,-4.3,1.2,1.05,0.8,0.5,16,M('#c4c4c2'));
    for(const [x,z,c,r] of [[3.2,1,'#2e814b',0.8],[4.8,-0.2,'#395caa',0.7],[4.2,-3.5,'#cfaf40',0.48],[5.5,-2.4,'#cfaf40',0.48],[6.8,-3.5,'#cfaf40',0.48],[5.5,-4.5,'#cfaf40',0.48]])P.cyl(x,-3.04,z,r,r,0.65,14,M({c,sh:28}));
    P.cyl(0,-3.02,-2.9,0.65,0.65,0.6,14,M('#ac4342'));P.rbox(0,-1.5,5.8,1.6,1.4,2.8,0.4,M('#474b53'));P.shadow(0,0,1,21,24,0.5);
  }
  function padPS(P) {
    const s=new T.Shape();s.moveTo(-6.5,-5);s.quadraticCurveTo(-9,-5,-9,0);s.lineTo(-8,7);s.quadraticCurveTo(-7,10,-5,7);s.lineTo(-3,3);s.quadraticCurveTo(0,2,3,3);s.lineTo(5,7);s.quadraticCurveTo(7,10,8,7);s.lineTo(9,0);s.quadraticCurveTo(9,-5,6.5,-5);s.quadraticCurveTo(0,-6.5,-6.5,-5);s.closePath();
    padShell(P,s,'#c2bfb7');dpad(P,-5.2,-1);
    P.cyl(5,-2.9,-1,2.6,2.6,0.18,24,M('#a29e98'));
    [[5,-2.7,'#589e8f'],[6.7,-1,'#bb6869'],[5,0.7,'#687db0'],[3.3,-1,'#a4769c']].forEach(([x,z,c])=>P.cyl(x,-3.12,z,0.68,0.68,0.65,16,M({c,sh:28})));
    [-1,1].forEach(x=>P.rbox(x,-3.02,-0.8,1.3,0.45,0.65,0.2,M('#56585c'),{ry:-12}));
    for(const x of [-2.3,2.3]){P.cyl(x,-2.95,3.2,1.55,1.55,0.4,20,M('#8d8a84'));P.cyl(x,-3.35,3.2,0.45,0.45,0.7,12,M('#33363a'));P.ball(x,-3.85,3.2,1.1,0.45,1.1,M({c:'#36383c',sh:6}),16)}
    P.shadow(0,0,1,23,22,0.5);
  }
  function lead(P,pts,col,id) {
    // Rounded polyline stays inside each route's clearances: Catmull-Rom overshot
    // shelf/floor corners and made disconnected-looking buried cable sections.
    const points=pts.map(p=>new T.Vector3(...p)),path=new T.CurvePath();let start=points[0];
    for(let i=1;i<points.length-1;i++){
      const p=points[i],trim=Math.min(1.3,p.distanceTo(points[i-1])*0.24,p.distanceTo(points[i+1])*0.24);
      const a=p.clone().add(points[i-1].clone().sub(p).setLength(trim)),b=p.clone().add(points[i+1].clone().sub(p).setLength(trim));
      path.add(new T.LineCurve3(start,a));path.add(new T.QuadraticBezierCurve3(a,p,b));start=b;
    }
    path.add(new T.LineCurve3(start,points[points.length-1]));const radius=0.28;
    P.geo(new T.TubeGeometry(path,Math.max(48,pts.length*12),radius,6),0,0,0,M({c:col,sh:14,sp:'#222'}));
    const routes=P.batch?(P.batch.routes=P.batch.routes||[]):P.group?(P.group.userData.cables=P.group.userData.cables||[]):null;
    if(routes)routes.push({id,radius,points:path.getSpacedPoints(160).map(p=>p.toArray())});
  }
  function taper(w, h, d, k) { const g = new T.BoxGeometry(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); } g.computeVertexNormals(); return g; }
  function flipUV(geo) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); }
  // A closed lens, including sides and back. The face gently bows forward;
  // rounded corners and the surrounding solid lip keep the edge seated.
  function crtGlass(w, h, depth, bow) {
    const geo = new T.BoxGeometry(w, h, depth, 32, 24, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), nx = x / (w / 2), ny = y / (h / 2);
      p.setX(i, x * (1 - 0.015 * Math.pow(Math.abs(ny), 12)));
      p.setY(i, y * (1 - 0.02 * Math.pow(Math.abs(nx), 12)));
      if (p.getZ(i) > 0) p.setZ(i, depth / 2 + bow * (1 - nx * nx) * (1 - ny * ny));
    }
    flipUV(geo); geo.computeVertexNormals(); return geo;
  }
  function wishTex() { return K.tex('rm.wish', 128, 96, (g, w, h) => { g.fillStyle = '#fffbe0'; g.fillRect(0, 0, w, h); A.text(g, 'CHRISTMAS LIST', 64, 22, '700 13px ' + A.HAND, '#c01010', 'center'); A.text(g, '1. Daydream!!!', 10, 48, '12px ' + A.HAND, '#1a3a9a'); A.text(g, '(out 14 Oct)', 10, 70, '12px ' + A.HAND, '#1a3a9a'); }); }
  function dcBoxTex() { return K.tex('rm.dcbox', 256, 192, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff7a00'; g.lineWidth = 10; g.beginPath(); for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 4.2, R2 = 4 + i / 90 * 50; g.lineTo(70 + Math.cos(a) * R2, 90 + Math.sin(a) * R2 * 0.95); } g.stroke(); A.text(g, 'DAYDREAM', 150, 100, '300 26px Arial,sans-serif', '#555'); A.text(g, 'WITH MODEM!', 150, 130, '700 13px ' + A.UIF, '#c05a00'); }); }

  // ---------------------------------------------------------------- the bed, the bedside table, the cat
  function buildBed(B, r) {
    const pm = mPine(), x0 = 148, x1 = 238, z0 = BZ + 1, z1 = 140, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, bw = x1 - x0, bl = z1 - z0;
    B.box(cx, 57, cz, bw, 12, bl, pm, { uv: 50 }); // the base
    [[x0 + 3, z1 - 3], [x1 - 3, z1 - 3]].forEach(([x, z]) => B.box(x, 66, z, 6, 14, 6, pm));
    B.box(cx, 26, z0 + 2, bw + 4, 48, 4, pm, { uv: 50 }); // the headboard (low, under the window)
    B.box(cx, 1.5, z0 + 2, bw + 8, 3, 6, pm, { uv: 50 });
    for (let i = 0; i < 5; i++) B.box(x0 + 12 + i * 16.5, 20, z0 + 4.4, 6, 26, 1.2, M('#b88a50'));
    B.box(cx, 44.5, cz + 2, bw - 4, 15, bl - 6, M({ c: '#fff', map: tex('sheet') })); // the mattress
    B.box(cx, 64, z1 + 1.5, bw, 18, 3, pm, { uv: 50 }); // the foot board
    B.shadow(cx, FY, cz, bw + 20, bl + 16, 0.8, { sq: true });
    // the duvet: rumpled, slipping off one side
    const dg = new T.PlaneGeometry(bw + 14, bl - 34, 18, 24); const p = dg.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (bw + 14) + 0.5, v = p.getY(i) / (bl - 34) + 0.5; let y = -Math.sin(u * Math.PI) * 6 - Math.sin(v * 9 + u * 5) * 1.6 - Math.sin(u * 13 - v * 4) * 1.2; if (u < 0.08) y += (0.08 - u) * 190; if (u > 0.94) y += (u - 0.94) * 140; p.setZ(i, -y); }
    dg.computeVertexNormals();
    B.geo(K.thicken(dg,.8),cx,36,cz+14,M({c:'#ffffff',map:tex('duvet')}),{rx:90});
    // The chore pillow is the bed's only pillow: it starts on the floor.
    pickBox(r, 'bed', cx, 32, cz + 10, bw, 24, bl - 10);
    H.block('U', x0 - 2, BZ, RX, z1 + 4);
    // the bedside table: lava lamp, the radio alarm clock (the real time), a glass of water
    const bs = B.at(122, 0, BZ + 18);
    bs.box(0, 48, 0, 34, 50, 34, mPine(), { uv: 50 }); bs.box(0, 22.6, 0, 36, 2, 36, mPine());
    bs.box(0, 38, 17.2, 28, 12, 0.8, M({ c: '#fff', map: tex('pineDark') })); bs.box(0, 38, 17.8, 6, 1.2, 1, mBrass);
    bs.shadow(0, FY, 0, 40, 40, 0.7, { sq: true });
    H.block('U', 103, BZ, 141, -18);
    // the lava lamp (a real lamp: it lights the corner pink)
    const lv=new T.Group();lv.name='lava-lamp';lv.position.set(134,21.6,BZ+21);r.group.add(lv);const LV=K.into(lv),silver=M({c:'#b4b7be',sh:55,sp:'#b5bec6'});
    LV.lathe(0,0,0,[[0,-8],[3.5,-8],[4.5,-5],[4.8,-1],[4.6,0],[0,0]],28,silver);
    LV.lathe(0,-8,0,[[0,-18],[1.8,-18],[3.4,-2],[3,0],[0,0]],28,M({c:'#be6287',e:'#3a1023',o:.32,tr:true,sh:70,sp:'#a8b5c0'}));
    LV.lathe(0,-26,0,[[0,-3],[.5,-3],[1.8,0],[0,0]],24,silver);
    R.blobs = [0, 1, 2].map(i => { const b = new T.Mesh(new T.SphereGeometry(1, 10, 8), M({ c: '#ffd23a', e: '#c08000' })); b.scale.set(1.2, 1.6, 1.2); b.position.set(0, -12 - i * 4, 0); lv.add(b); return b; });
    LV.shadow(0, 0, 0, 12, 12, 0.6);
    H.spot('lava', { label: 'Lava lamp', obj: lv });
    const ck = new T.Group(); ck.position.set(114, 21.6, BZ + 22); ck.rotation.y = 12 * D2R; r.group.add(ck); const CK = K.into(ck); // the radio alarm clock
    CK.rbox(0, -3.6, 0, 15, 7.2, 8, 0.8, M('#1a1a1c'));
    [-5, -3.2, -1.4].forEach(x => CK.box(x, -7.3, -1.5, 1.4, 0.3, 1.2, M('#3a3a3e'))); CK.box(4.5, -7.3, -1.5, 4, 0.3, 1.8, M('#5a3a3a')); // snooze (the big one)
    CK.plane(5, -3.5, 4.05, 3.6, 4.4, M({ c: '#fff', map: K.tex('rm.clkgrille', 32, 32, (gg) => { gg.fillStyle = '#1a1a1c'; gg.fillRect(0, 0, 32, 32); gg.fillStyle = '#0a0a0c'; for (let y = 2; y < 32; y += 4) for (let x = 2; x < 32; x += 4) gg.fillRect(x, y, 2, 2); }) }));
    CK.cyl(-6.5, -3.5, 4.3, 0.8, 0.8, 0.6, 10, M('#333'), { rx: 90 });
    R.clockTex = K.tex('rm.clock', 128, 48, () => {}, { clamp: true });
    const cs = new T.Mesh(new T.PlaneGeometry(9, 3.4), new T.MeshBasicMaterial({ map: R.clockTex })); flipUV(cs.geometry); cs.position.set(-1.5, -4, 4.05); ck.add(cs);
    CK.shadow(0, 0, 0, 18, 11, 0.6, { sq: true });
    H.spot('clock', { label: 'Radio alarm clock', obj: ck });
    const gl=B.at(126,21.6,BZ+27);gl.lathe(0,0,0,[[0,-.7],[1.9,-.7],[2.28,-9.8],[2.45,-10],[2.6,-9.8],[2.2,0],[0,0]],28,M({c:'#d8e8f0',o:.24,tr:true,sh:90,sp:'#fff'}));gl.disc(0,-3.5,0,2.12,M({c:'#9cb9c8',o:.35,tr:true,sh:60}),24);
    // the cat (next door's): a curled-up loaf, breathing
    const cat = new T.Group(); cat.position.set(206, 30, 72); cat.rotation.y = -34 * D2R; r.group.add(cat); R.cat = cat;
    const CT = K.into(cat), fur = M({ c: '#1c1c22', sh: 6 }), wht = M({ c: '#e8e8e8', sh: 6 });
    R.catBody = CT.ball(0, -6, 0, 13, 6.5, 9, fur, 16);
    CT.ball(-11, -7, 3, 5.8, 5.2, 5.4, fur, 14); CT.ball(-14.5, -6.2, 5.6, 2.4, 1.8, 1.4, wht, 10);
    CT.lathe(-12.5, -11.8, 0.6, [[0.1, -4], [1.8, 0]], 6, fur, { rz: -15 }); CT.lathe(-9, -11.8, 1.4, [[0.1, -4], [1.8, 0]], 6, fur, { rz: 15 });
    CT.ball(-16.4, -6.4, 5.8, 0.42, 0.3, 0.3, M({ c: '#f0a0a8', sh: 60 }), 6); // the nose
    [[-15.2, 3.4], [-15.2, 7.4]].forEach(([x, z]) => CT.box(x, -8.2, z, 0.6, 0.12, 1.6, M('#0a0a0c'), { rz: 0 })); // closed eyes
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) CT.cyl(-15.8, -5.6 + k * 0.5, 5.6 + sd * (2.2 + k * 0.3), 0.06, 0.06, 7, 3, M('#e8e8e8'), { rz: 90, ry: sd * (18 + k * 10) }); // whiskers
    CT.ball(-13.5, -7.6, 5.4, 4, 3.2, 3.4, M({ c: '#2a2a30', sh: 6 }), 10); // the muzzle
    const tail = new T.CatmullRomCurve3([new T.Vector3(11, -3, -3), new T.Vector3(13, -2, 4), new T.Vector3(6, -1.5, 9), new T.Vector3(-4, -1.5, 9)]);
    CT.geo(new T.TubeGeometry(tail, 16, 1.4, 6), 0, 0, 0, fur);
    CT.ball(-5, -1.6, 7, 3.4, 1.4, 2.2, wht, 10); CT.ball(-9, -1.4, 7.5, 2, 1.2, 1.8, wht, 8);
    CT.shadow(0, 0, 0, 34, 24, 0.55);
    H.spot('cat', { label: () => catName(), obj: cat });
    // a parcel on the bed (it comes after you've played five different games: a competition prize)
    const post = new T.Group(); post.position.set(170, 30, 100); post.rotation.y = 14 * D2R; r.group.add(post); R.post = post;
    const PO = K.into(post); PO.box(0, -5, 0, 24, 10, 18, M('#c8a070')); PO.plane(0, -10.05, 0, 14, 8, M({ c: '#fff', map: K.tex('rm.addr', 128, 72, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 72); A.text(g, 'J. JACK', 10, 28, '700 14px ' + A.HAND, '#222'); A.text(g, "JACK'S ROOM", 10, 52, '13px ' + A.HAND, '#222'); g.fillStyle = '#c02020'; g.fillRect(100, 6, 20, 24); }) }), { rx: -90 });
    PO.box(0, -10.1, 0, 24.2, 0.2, 3, M('#c8b890')); PO.shadow(0, 0, 0, 28, 22, 0.6, { sq: true });
    H.spot('post', { label: 'A parcel!', obj: post }); post.visible = false;
    // a school jumper on the floor at the end of the bed
    const jp = B.at(190, FY, 170, 20); jp.ball(0, -1.6, 0, 22, 2.2, 15, M({ c: '#1a2a5a', sh: 4 }), 12); jp.ball(-14, -1.2, 10, 10, 1.6, 5, M('#1a2a5a'), 10); jp.ball(10, -1.4, -8, 6, 2, 6, M('#1a2a5a'), 8); jp.shadow(0, 0, 0, 52, 36, 0.4);
    H.spot('jumper', { label: 'School jumper', act: () => say('School jumper', 'My school jumper. On the floor. Mom says the floor is not a wardrobe. The floor disagrees.') }); pickBox(r, 'jumper', 190, FY - 2, 170, 44, 4, 30, 20);
  }

  // ---------------------------------------------------------------- the wardrobe, the chest of drawers and the hi-fi
  function buildWardrobe(B, r) {
    const pm = mPine(), x0 = LX + 2.4, x1 = LX + 58, z0 = 70, z1 = 170, top = FY - 192;
    { const xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, yc = (top + FY) / 2, hh = FY - top; // an open-fronted carcass: back, two ends, top and bottom boards
      B.box(x0 + 1, yc-.5, zc, 2, hh-5, z1-z0-4, pm, { uv: 50 }); B.box(xc, yc-.5, z0 + 1, x1 - x0, hh-5, 2, pm, { uv: 50 }); B.box(xc, yc-.5, z1 - 1, x1 - x0, hh-5, 2, pm, { uv: 50 });
      B.box(xc, top + 1, zc, x1 - x0, 2, z1 - z0, pm, { uv: 50 }); B.box(xc, FY - 1.5, zc, x1 - x0, 3, z1 - z0, pm, { uv: 50 }); }
    B.box((x0 + x1) / 2, top - 2, (z0 + z1) / 2, x1 - x0 + 4, 4, z1 - z0 + 4, pm, { uv: 50 });
    B.box(x1 + .2, FY - 4, (z0 + z1) / 2, 1.6, 8, z1-z0-4, M('#8a6038'));
    B.plane(x0 + 2.1, (top + FY) / 2, (z0 + z1) / 2, z1 - z0 - 4, FY - top - 8, M('#2a2018'), { ry: 90 }); // (the inside back)
    B.shadow((x0 + x1) / 2, FY, (z0 + z1) / 2, x1 - x0 + 12, z1 - z0 + 14, 0.75, { sq: true });
    const rail = B.at(x0 + 30, top + 12, (z0 + z1) / 2); rail.cyl(0, 0, 0, 0.8, 0.8, z1 - z0 - 6, 8, mMetal, { rx: 90 });
    [['#2a2a3a', -40], ['#e8e8e8', -28], ['#1a2a5a', -16], ['#7a1a1a', -4], ['#3a5a2a', 8], ['#c8a060', 20], ['#1a1a1a', 34]].forEach(([c, z]) => rail.rbox(0, 40, z, 34, 76, 5, 2, M(c)));
    const sh = B.at(x0 + 30, FY - 12, z0 + 18); sh.box(0, 0, 0, 30, 20, 14, M('#1a1a1a'), { rz: 10 }); sh.cyl(4, -2, 40, 5, 6, 26, 12, M('#2a5a2a')); // the welly
    // two doors on hinges
    [[z0, 1], [z1, -1]].forEach(([hz, s], i) => {
      const dr = new T.Group(); dr.position.set(x1 + 0.6, 0, hz); r.group.add(dr); const DR = K.into(dr);
      DR.box(0.6, (top + FY) / 2 + 2, s * 25, 1.8, FY - top - 16, 50, M({ c: '#fff', map: tex('pine') }), { uv: 50 });
      DR.box(2, -30, s * 43, 2, 8, 2, mBrass);
      DR.box(1.7, (top + FY) / 2 + 2, s * 25, 0.4, FY - top - 40, 38, M('#b88a50'), { sides: 'r' });
      if (i === 0) DR.plane(1.95, -64, s * 25, 26, 16, M({ c: '#fff', map: K.tex('rm.keep', 256, 160, (g, w, h) => { g.fillStyle = '#ffe600'; g.fillRect(0, 0, w, h); A.text(g, 'KEEP OUT', 128, 80, '64px ' + A.FONT, '#c00', 'center'); A.text(g, '(except Mom)', 128, 130, '700 24px ' + A.HAND, '#333', 'center'); }) }), { ry: 90, rz: -6 });
      H.openable('wardrobe' + i, { label: 'The wardrobe', pivot: dr, type: 'hinge', axis: 'y', amt: s * 100, pick: dr, onToggle: open => { if (open) setTimeout(() => search('wardrobe'), 450); } });
      H.SPOTS['wardrobe' + i].alias = 'wardrobe';
    });
    H.block('U', x0, z0 - 2, x1 + 4, z1 + 2);
    // the chest of drawers, the hi-fi on top
    const cx = LX + 24, cz = 212;
    const bx0 = LX + 1.5, bx1 = cx + 21.2; // a solid carcass (sides, back, top board, plinth) with the drawer fronts flush in its face
    B.box((bx0 + bx1) / 2, FY - 42, cz, bx1 - bx0, 76, 66, pm, { uv: 50 }); B.box(cx - 2, FY - 2, cz, 40, 4, 62, M('#3a2a18'));
    B.box(cx, FY - 81, cz, 46, 2, 68, pm, { uv: 50 });
    [-32, 32].forEach(dz => B.box(cx + 21.6, FY - 42, cz + dz, 0.8, 76, 2, pm, { uv: 50 })); for (let k = 0; k < 4; k++) B.box(cx + 21.6, FY - 79.5 + k * 25, cz, 0.8, 1, 62, pm, { uv: 50 });
    const dfm = M({ c: '#fff', map: tex('pineDark') });
    for (let i = 0; i < 3; i++) { B.box(cx + 21.6, FY - 67 + i * 25, cz, 0.8, 24, 62, dfm); B.box(cx + 22.7, FY - 67 + i * 25, cz, 1.4, 1.6, 12, mBrass); }
    B.shadow(cx, FY, cz, 52, 76, 0.7, { sq: true });
    H.block('U', LX, cz - 36, cx + 26, cz + 36);
    const hf = new T.Group(); hf.position.set(cx, FY - 82, cz); hf.rotation.y = 90 * D2R; r.group.add(hf); const HF = K.into(hf);
    HF.rbox(0, -12, 0, 22, 24, 24, 0.8, M({ c: '#2a2a2e', sh: 40, sp: '#444' }));
    HF.plane(0, -18, 12.05, 18, 3, M('#1a1a1a')); HF.plane(0, -12, 12.05, 10, 3, M({ c: '#3affd0', e: '#1a8a6a' })); HF.cyl(6, -6, 12.4, 2.4, 2.4, 0.8, 16, mMetal, { rx: 90 });
    [-22, 22].forEach(x => { HF.box(x, -15, 0, 14, 30, 18, M('#222225')); HF.cyl(x, -15, 9.1, 5.2, 5.2, 0.6, 18, M('#111'), { rx: 90 }); HF.cyl(x, -26, 9.1, 2, 2, 0.6, 12, M('#111'), { rx: 90 }); });
    HF.shadow(0, 0, 0, 62, 24, 0.6, { sq: true });
    H.spot('hifi', { label: 'Hi-fi', obj: hf, act: hifi });
    loose('hifi',hf,{room:'bedroom',x:cx,y:FY-82,z:cz,ry:90},'Hi-fi',{holdD:80,useLabel:'Play music'});
  }

  // ---------------------------------------------------------------- the front wall: radiator, robot poster, school bag, washing basket
  function buildFront(B, r) {
    const rd = B.at(-10, FY - 36, FZ - 5);
    rd.box(0, 0, 0, 120, 56, 3.6, { b: M({ c: '#fff', map: repT('radiator', 6, 1), sh: 40 }), all: M('#e8e5dc') });
    rd.box(-62, 26, 0, 2.4, 6, 2.4, mWhite);
    B.shadow(-10, FY, FZ - 8, 126, 14, 0.5, { sq: true });
    H.spot('radiator', { label: 'Radiator', act: () => say('Radiator', night() ? 'Off. Dad turns the heating off at 10 o\'clock "because we\'re not made of money".' : 'The radiator. It goes clunk clunk clunk when it comes on, like someone hitting the pipes with a spanner.') });
    pickBox(r, 'radiator', -10, FY - 36, FZ - 6, 120, 56, 6);
    poster(B, -10, -98, FZ, 30, 42, tex('posterRobot'), 180); pickBox(r, 'posterrobot', -10, -98, FZ - 1, 30, 42, 2);
    H.spot('posterrobot', { label: 'ROBO RUMBLE poster', act: () => say('ROBO RUMBLE', 'Dave and me are going to build a robot and enter. We have a name (KILLBOT 2000) and a drawing. We need everything else.') });
    const sb = new T.Group(); sb.position.set(58, FY, 226); sb.rotation.y = -12 * D2R; /* (by the washing basket: not in the doorway, so you can get out) */ r.group.add(sb); const SB = K.into(sb); // the school bag
    SB.rbox(0, -18, 0, 30, 36, 14, 5, M({ c: '#1a3a7a', sh: 10 })); SB.rbox(0, -10, 8, 22, 16, 5, 3, M('#163068'));
    SB.box(-4, -38, 2, 18, 8, 1, M({ c: '#fff', map: tex('timetable') }), { rz: 8 });
    SB.cyl(0, -36, -1, 1.6, 1.6, 12, 8, M('#111'), { rz: 90 });
    SB.shadow(0, 0, 0, 38, 22, 0.6);
    H.spot('schoolbag', { label: 'School bag', obj: sb, act: () => say('School bag', ['My school bag. Inside: three exercise books, a squashed banana, a letter about the Year 11 trip, and the Maths homework that was due Friday.', 'Homework diary: "French vocab test Thursday". It is not Thursday. Is it?', 'A calculator. Type 0.7734 and turn it upside down. It says hELLO. That is the whole joke. It never gets old.'][(S.sb = ((S.sb | 0) + 1) % 3)]) });
    loose('schoolbag',sb,{room:'bedroom',x:58,y:FY,z:226,ry:-12},'School bag',{obstacle:true,floorOnly:true,useLabel:'Look inside'});
    const lb = B.at(110, FY, 222); lb.lathe(0, 0, 0, [[16, -40], [17, -40], [14, 0], [0.2, 0]], 16, M({ c: '#e8e4d8', sh: 10, side: 2 })); lb.ball(0, -40, 0, 15, 6, 15, M('#5a6a8a'), 12); lb.ball(4, -44, -3, 8, 4, 6, M('#e8e8e8'), 10); lb.shadow(0, 0, 0, 40, 40, 0.6);
    H.spot('washing', { label: 'Washing basket', act: () => say('Washing basket', 'Full. Overflowing. Mom says if it doesn\'t go downstairs it doesn\'t get washed. Fair.') }); pickBox(r, 'washing', 110, FY - 22, 222, 34, 44, 34);
    H.block('U', 90, 202, 130, 242);
  }

  // ---------------------------------------------------------------- the door (to the landing), the light switch, the ceiling light
  function buildDoor(B, r) {
    const fm = mWhite, x = RX, z0 = DOOR.z0, z1 = DOOR.z1, y0 = DOOR.y0;
    B.box(x - 1, (y0 + FY) / 2, z0 - 3, 2.4, FY - y0, 6, fm); B.box(x - 1, (y0 + FY) / 2, z1 + 3, 2.4, FY - y0, 6, fm); B.box(x - 1, y0 - 3, (z0 + z1) / 2, 2.4, 6, z1 - z0 + 12, fm);
    B.plane(x + 5, (y0 + FY) / 2, z0, 10, FY - y0, M('#e4e0d4'), { ry: 0 }); B.plane(x + 5, (y0 + FY) / 2, z1, 10, FY - y0, M('#e4e0d4'), { ry: 180 }); B.plane(x + 5, y0, (z0 + z1) / 2, 10, z1 - z0, M('#e4e0d4'), { rx: -90 });
    const dp = new T.Group(); dp.position.set(x + 3, 0, z1); r.group.add(dp); const DP = K.into(dp);
    const dw = z1 - z0 - 1, dh = FY - y0 - 1, dc = -dw / 2;
    DP.box(0, y0 + 0.5 + dh / 2, dc, 3.6, dh, dw, M({ c: '#efebe2', map: tex('whiteGloss'), sh: 24, sp: '#333' }));
    [[-0.17, -0.25], [0.17, -0.25], [-0.17, 0.2], [0.17, 0.2]].forEach(([u, v]) => [-1.95, 1.95].forEach(xx => DP.box(xx, y0 + 0.5 + dh * (0.5 + v), dc + u * dw * 1.5, 0.4, dh * 0.38, dw * 0.34, M('#e2ded4'))));
    [-1, 1].forEach(s => { DP.box(s * 2.4, -30, dc - dw / 2 + 7, 1.2, 2.2, 1.6, mBrass); DP.box(s * 4, -30, dc - dw / 2 + 10, 1.4, 1.4, 7, mBrass); });
    DP.rbox(-4.5, -40, dc + 18, 4, 70, 18, 2, M('#7a1a2a')); // a dressing gown on a hook
    DP.plane(2.6, -70, dc - 4, 22, 14, M({ c: '#fff', map: K.tex('rm.sign', 256, 160, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd400'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); A.text(g, 'JACK\'S ROOM', 128, 66, '44px ' + A.FONT, '#ffd400', 'center'); A.text(g, 'KNOCK FIRST. YES, YOU, ' + ((window.Cast ? Cast.n('sister') : 'SIS')).toUpperCase(), 128, 120, '700 14px ' + A.UIF, '#fff', 'center'); }) }), { ry: 90 });
    H.door('bedroom', { rooms: ['bedroom', 'landing'], pivot: dp, swing: 96, dir: 1, open: false }); S.door = 0; // (always shut at the start of a visit)
    H.spot('door', { label: () => H.DOORS.bedroom.open ? 'Shut the door' : 'The door', range: 300, obj: dp, act: () => { const o = !H.DOORS.bedroom.open; ensureHouse().then(() => { H.setDoor('bedroom', o); S.door = o ? 1 : 0; save(); }, () => say('Hmm', 'The door is stuck. Try again in a minute.')); } });
    const sw = new T.Group(); sw.position.set(x - 0.6, -32, z0 - 16); r.group.add(sw); const SW = K.into(sw); // the light switch
    SW.box(0, 0, 0, 1.2, 8.6, 8.6, mWhite); R.rocker = SW.box(-0.8, 0, 0, 1, 2.4, 1.4, M('#d8d4c8'));R.rocker.matrix.decompose(R.rocker.position,R.rocker.quaternion,R.rocker.scale);
    H.spot('switch', { label: 'Light switch', obj: sw, range: 260, act: () => { LIGHT.main = !LIGHT.main; saveLights(); secret('hs.lights'); lampLook(); H.relight(); H.sfx.tone(1800, 0.02, 'square', 0.06); H.sfx.noise(0.03, 0.08, 3000); } });
  }
  function buildCeiling(B, r) {
    const cl = new T.Group(); cl.position.set(-20, CY, 90); r.group.add(cl); const CL = K.into(cl);
    CL.cyl(0, 1.5, 0, 6, 6, 3, 18, mWhite); CL.cyl(0, 22, 0, 0.3, 0.3, 40, 4, M('#eee'));
    R.lantern = CL.ball(0, 52, 0, 17, 17, 17, M({ c: '#f4ecd8', e: '#000000' }).clone(), 18);
    for (let i = 0; i < 6; i++) CL.geo(new T.TorusGeometry(17 * Math.sin((i + 1) / 7 * Math.PI) + 0.1, 0.15, 4, 30), 0, 52 - 17 * Math.cos((i + 1) / 7 * Math.PI), 0, M('#d8d0c0'), { rx: 90 });
    H.spot('lantern', { label: 'Ceiling light', obj: cl, act: () => H.act('switch') });
  }
  function lampLook() {
    if(R.bulb){R.bulb.material.color.set(LIGHT.lamp?'#fff1cf':'#c3beb0');R.bulb.material.emissive.set(LIGHT.lamp?'#ffc77a':'#000000');R.bulb.material.userData.e0=R.bulb.material.emissive.clone()}
    if(R.lampLiner){R.lampLiner.emissive.set(LIGHT.lamp?'#4a3520':'#000000');R.lampLiner.userData.e0=R.lampLiner.emissive.clone()}
    if(R.lampButton){R.lampButton.rotation.z=(LIGHT.lamp?-8:8)*D2R;R.lampButton.updateMatrix()}
    if (R.lantern) { const ms = [].concat(R.lantern.material); for (const m of ms) { m.emissive.set(LIGHT.main ? '#c8b890' : '#000000'); m.userData.e0 = m.emissive.clone(); } }
    if (R.rocker) {R.rocker.rotation.z = (LIGHT.main ? -12 : 12) * D2R;R.rocker.updateMatrix()}
    H.dirty();
  }

  // ================================================================ things you can pick up (the grab system)
  function things() {
    const add = (id, def) => { const t = H.thing(id, def); t.obj.userData.thing = 1; t.obj.traverse(o => { o.userData.thing = 1; }); H.restoreThing(t); return t; };
    add('gb', { home: { room: 'bedroom', x: -56, y: 0, z: 18, ry: -18 }, kind: 'handheld', label: 'Game Lad Color', obj: gbModel(), use: () => tvOpen('gb'), useLabel: 'Play it', holdD: 40 });
    const cube=add('cube',{home:{room:'bedroom',x:-40,y:0,z:-10,ry:25},kind:'toy',label:'Puzzle cube',obj:cubeModel(),use:()=>H.inspect('cube'),useLabel:'Solve it',holdD:34});
    if(cube.at.room==='bedroom'&&cube.st==='rest'&&Math.abs(cube.at.x+50)<.1&&Math.abs(cube.at.y)<.1&&Math.abs(cube.at.z+22)<.1&&Math.abs(cube.at.ry-25)<.1){cube.at=Object.assign({},cube.home);H.place(cube);H.saveThings()}
    add('vpet', { home: { room: 'bedroom', x: 40, y: 0, z: 24, ry: 10 }, kind: 'toy', label: 'Eggbert (my keyring pet)', obj: vpetModel(), use: () => bits('vpet'), useLabel: 'Check on it', holdD: 30 });
    const fb = new T.Group(); K.into(fb).ball(0, -11, 0, 11, 11, 11, M({ c: '#fff', map: K.tex('rm.ball', 256, 128, (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) { const cx = x * 43 + (y % 2) * 21, cy = 20 + y * 44; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11); } g.fill(); } }), sh: 30 }), 18);
    K.into(fb).shadow(0, 0, 0, 24, 24, 0.5);
    add('football', { home: { room: 'bedroom', x: -60, y: FY, z: 200, ry: 0 }, kind: 'ball', label: 'Football', obj: fb, holdD: 60 });
    // (real floppies, discs and game boxes are Agent P's: js/pm-gl.js, through Room.grabbable)
    H.on('grab', id => { carry.id = id; carry.d = 0; });
    H.on('place', () => { carry.id = null; });
  }
  const carry = { id: null, d: 0 };
  function gbModel() { const g = new T.Group(); const G = K.into(g); const m = M({ c: '#6a3fb0', sh: 36, sp: '#444' });
    G.rbox(0, -1.3, 0, 7.8, 2.6, 13.3, 0.9, m); // the body (7.8 x 13.3 cm, 2.6 thick)
    G.rbox(0, -2.7, -3.25, 6.8, 0.38, 6, 0.18, M({ c: '#2a2a34', sh: 70, sp: '#666' }));
    R.gbScreen = G.geo(crtGlass(4.6, 4.14, 0.05, 0.025), 0, -2.97, -3.5, new T.MeshBasicMaterial({ color: '#83956c' }), { rx: 90 });
    G.plane(0, -3.02, -5.85, 4, 0.5, M({ c: '#fff', map: K.tex('rm.gblogo', 128, 16, (gg) => { gg.fillStyle = '#2a2a34'; gg.fillRect(0, 0, 128, 16); A.text(gg, 'GAME LAD COLOR', 64, 12, '700 11px ' + A.UIF, '#c8c8d8', 'center'); }) }), { rx: 90 });
    G.box(-2.2, -2.9, 2.4, 2.2, 0.5, 0.7, M({ c: '#222', sh: 20 })); G.box(-2.2, -2.9, 2.4, 0.7, 0.5, 2.2, M({ c: '#222', sh: 20 })); // the D-pad cross
    G.cyl(1.6, -2.95, 2.9, 0.62, 0.62, 0.5, 12, M({ c: '#b02060', sh: 60, sp: '#fff' })); G.cyl(3.0, -2.95, 2.2, 0.62, 0.62, 0.5, 12, M({ c: '#b02060', sh: 60, sp: '#fff' })); // B and A
    G.plane(1.6, -2.65, 3.75, 0.5, 0.5, M({ c: '#fff', map: K.tex('rm.gbB', 16, 16, (gg) => { gg.fillStyle = '#6a3fb0'; gg.fillRect(0, 0, 16, 16); A.text(gg, 'B', 8, 13, '700 12px ' + A.UIF, '#ddd', 'center'); }) }), { rx: 90 });
    [-1, 0.2].forEach((x, i) => G.rbox(x, -2.75, 5.1, 1.4, 0.3, 0.5, 0.2, M('#4a2a88'), { ry: -25 })); // select / start, slanted
    for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) G.cyl(2.3 + c * 0.6 - r * 0.25, -2.65, 4.3 + r * 0.42, 0.14, 0.14, 0.2, 6, M('#3a1a68')); // the speaker holes
    G.box(0, -0.6, -6.5, 2.6, 0.3, 0.6, M('#4a2a88')); G.box(0, -1.5, 6.4, 1.4, 0.5, 0.6, M('#2a2a34')); // the cartridge slot lip, the link port
    G.rbox(3.5, -2.0, -1.8, 0.5, 0.5, 1.6, 0.2, M('#3a1a68')); // the volume wheel
    // Small moulding details make the shell read as a real late-90s handheld
    // from close range: a side seam, battery cover and four recessed screws.
    G.box(-3.82, -1.25, 0, 0.16, 1.15, 8.8, M('#4c2d78'));
    G.rbox(0, 0.08, 2.5, 5.4, 0.16, 5.4, 0.07, M('#583487'));
    const screw = M({ c: '#b5a3c7', sh: 80, sp: '#eee' });
    for (const z of [-5.45, 5.45]) for (const x of [-2.9, 2.9]) G.cyl(x, .025, z, 0.16, 0.16, 0.05, 8, screw);
    G.shadow(0, 0, 0, 10.5, 16, 0.6); return g; }
  function cubeModel() {
    const g = new T.Group(), core = new T.Group(), CM = window.CubeModel;
    core.position.y = -2.9; g.add(core);
    const cols = {R:'#b82e25',O:'#d16c25',W:'#e9e5d8',Y:'#dfbd28',G:'#318158',B:'#31569a'};
    let state; try {state = JSON.parse(localStorage.getItem('jhp_rm_cube'));} catch (e) {}
    if (!Array.isArray(state) || state.length !== 26 || state.some(c => !c || !Array.isArray(c.p) || c.p.length !== 3 || !c.s || c.p.some(v => ![-1,0,1].includes(v)) || Object.entries(c.s).some(([k,v]) => !CM.VEC[k] || !cols[v]))) {
      state = CM.solved(); const rnd = K.rnd(41); for (let i = 0; i < 25; i++) CM.apply(state, CM.randomMove(rnd));
    }
    let turn = null;
    function draw() {
      while (core.children.length) {const child=core.children[0];child.traverse(o=>{if(o.isMesh)o.geometry.dispose();});core.remove(child);}
      for (const c of state) {
        const part = new T.Group(); part.position.set(c.p[0]*1.92,-c.p[1]*1.92,c.p[2]*1.92); core.add(part);
        const C = K.into(part); C.rbox(0,0,0,1.88,1.88,1.88,.09,M({c:'#171819',sh:28}));
        for (const [key,col] of Object.entries(c.s)) {
          const n = CM.VEC[key], dim = n.map(v => v ? .016 : 1.64);
          C.box(n[0]*.946,-n[1]*.946,n[2]*.946,dim[0],dim[1],dim[2],M({c:cols[col],sh:38,sp:'#555'}));
        }
        part.traverse(o => {if(o.isMesh) {o.userData.cubie=c; o.userData.thing=1; o.userData.spot='cube'; o.layers.set(H.THINGS.cube && H.THINGS.cube.front ? 1 : 0);}});
      }
      H.dirty();
    }
    function finish() {
      if (!turn) return;
      const wasSolved=CM.isSolved(state);
      CM.apply(state,turn.move); turn=null; H.anims.delete('cube-turn'); draw();
      try {localStorage.setItem('jhp_rm_cube',JSON.stringify(state));} catch(e) {}
      if(!wasSolved&&CM.isSolved(state)){secret('rm.cube');H.toast('Puzzle cube','Solved! All six faces match.');}
    }
    function twist(move) {
      if (turn || !CM.validMove(move)) return false;
      const pivot = new T.Group(); core.add(pivot);
      for (const child of core.children.slice()) if (child !== pivot && child.children[0]?.userData.cubie.p[move.a] === move.l) pivot.attach(child);
      turn={move,pivot}; const t0=performance.now();
      H.anims.set('cube-turn', now => {if (!turn) return false; const k=Math.min(1,(now-t0)/180); pivot.rotation.set(0,0,0); pivot.rotation[['x','y','z'][move.a]]=(move.a===1?1:-1)*move.d*Math.PI/2*(k*k*(3-2*k)); if(k===1){finish();return false;}return true;});
      H.dirty(); return true;
    }
    g.userData.cube={get state(){return CM.clone(state);}, finish, twist, drag(hit,dx,dy) {
      if(turn) return;
      const normal=hit.face.normal.clone(); normal.y *= -1;
      const c=hit.object.userData.cubie, origin=hit.point.clone(), a0=origin.clone().project(H.camera);
      let best=null;
      for(let a=0;a<3;a++) {
        const axis=new T.Vector3(); axis.setComponent(a,1); const tangent=axis.cross(normal);
        if(tangent.lengthSq()<.5) continue; tangent.y *= -1;
        const dir=tangent.transformDirection(g.matrixWorld), p=origin.clone().add(dir).project(H.camera);
        const sx=(p.x-a0.x)*innerWidth, sy=-(p.y-a0.y)*innerHeight, len=Math.hypot(sx,sy);
        const dot=(sx*dx+sy*dy)/(len||1);
        if(!best||Math.abs(dot)>best.score) best={a,l:c.p[a],d:dot>0?1:-1,score:Math.abs(dot)};
      }
      if(best) twist({a:best.a,l:best.l,d:best.d});
    }};
    draw(); K.into(g).shadow(0,0,0,7,7,.4,{sq:true}); return g;
  }
  function vpetModel() { const g = new T.Group(); const V = K.into(g); V.ball(0, -2.2, 0, 2.8, 2.2, 3.4, M({ c: '#ff5aa8', sh: 50, sp: '#555' }), 14); V.plane(0, -4.1, 0.4, 2.4, 1.8, M({ c: '#a8b890', e: '#1a2010' }), { rx: -80 }); [-0.8, 0, 0.8].forEach(x => V.cyl(x, -3, 2.4, 0.35, 0.35, 0.4, 8, M('#ffd84a'), { rx: 60 })); V.geo(new T.TorusGeometry(1.4, 0.18, 6, 16), 0, -2.2, -4.2, M({ c: '#c8c8c8', sh: 80 }), { rx: 70 }); V.shadow(0, 0, 0, 7, 9, 0.5); return g; }
  function floppyModel(label, col) { const g = new T.Group(); const F = K.into(g); F.box(0, -0.17, 0, 9, 0.34, 9.4, { t: M({ c: '#fff', map: floppyTex(label, col) }), all: M(col) }); F.shadow(0, 0, 0, 11, 11, 0.5, { sq: true }); return g; }
  function floppyTex(label, col) { return K.tex('rm.fl.' + label, 128, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa0a8'; g.fillRect(30, 0, 70, 40); g.fillStyle = '#4a5058'; g.fillRect(74, 6, 14, 28); g.fillStyle = '#f4f0e0'; g.fillRect(12, 56, 104, 64); A.text(g, label, 64, 84, '700 13px ' + A.HAND, '#1a3a9a', 'center'); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(4, 124, 6, 4); }); }
  function discModel(col, label) { const g = new T.Group(); const D = K.into(g);
    D.box(0, -0.5, 0, 14.2, 1, 12.4, { t: M({ c: '#cfe0f0', o: 0.55, sh: 120, sp: '#fff' }), all: M('#2a2a2a') });
    D.disc(0, -1.05, 0, 5.9, M({ c: '#fff', map: K.tex('rm.cd.' + label, 128, 128, (g2, w, h) => { const gr = g2.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, '#f4f4f8'); gr.addColorStop(1, col); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); g2.fillStyle = '#d01a1a'; g2.fillRect(0, 40, 128, 26); A.text(g2, label, 64, 59, '700 12px ' + A.UIF, '#fff', 'center'); g2.fillStyle = '#ccc'; g2.beginPath(); g2.arc(64, 64, 9, 0, 7); g2.fill(); }), sh: 90, sp: '#fff' }), 28);
    D.shadow(0, 0, 0, 16, 14, 0.5, { sq: true }); return g; }

  // ================================================================ the PC's drives: the CD tray slides out (drawn over the PC), the floppy slot
  const drv = { cd: { open: false, k: 0, thing: null }, floppy: { thing: null } };
  let tray = null, clipPlane = null;
  const trayFront = () => L0().tz + 18.6;
  function trayBuild() {
    if (tray) return tray;
    const L = L0(); const g = new T.Group(); H.root.add(g); g.visible = false;
    clipPlane = new T.Plane(new T.Vector3(0, 0, 1), -trayFront()); // (only the part sticking out of the tower shows)
    const cm = (c, o) => { const m = M(Object.assign({ c }, o || {})).clone(); m.clippingPlanes = [clipPlane]; return m; };
    const TR = K.into(g);
    TR.box(0, -0.3, -7, 15.4, 0.8, 15, cm('#2a2622'));
    TR.box(0, 0.7, 0.4, 15.9, 2.1, 0.6, cm('#e2dac0', { sh: 20 }));
    TR.box(0, -0.75, -7, 12.4, 0.2, 12.4, cm('#1a1816'));
    g.traverse(o => o.layers.set(1)); g.position.set(L.tx, -39.2, trayFront());
    tray = g; H.frontFx.add(g); return g;
  }
  const clipOn = (t, on) => t.obj.traverse(o => { if (o.material) for (const m of [].concat(o.material)) { m.clippingPlanes = on ? [clipPlane] : []; m.needsUpdate = true; } });
  function trayMove(open) {
    if (!H.stood) { say('CD drive', 'The tray won\'t come out with the PC switched off. (Dave says you can poke a paperclip in the little hole. Dave says a lot of things.)'); return; }
    trayBuild(); const d = drv.cd; if (d.open === open) return;
    d.open = open; tray.visible = true; pb.classList.add('hs-trayout');
    const from = d.k, to = open ? 1 : 0, t0 = performance.now(), L = L0(), front = trayFront();
    H.sfx.noise(0.6, 0.05, 900, 0, 'bandpass', 400); H.sfx.tone(60, 0.5, 'sawtooth', 0.02);
    const t = d.thing && H.THINGS[d.thing];
    if (t) { clipOn(t, true); if (open) { t.at.hide = false; t.obj.visible = true; } }
    H.anims.set('tray', n => {
      const k = Math.min(1, (n - t0) / 700); d.k = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      tray.position.z = front + d.k * 14.5;
      if (t) { t.obj.position.set(L.tx, -39.3, tray.position.z - 7); t.at.z = tray.position.z - 7; }
      if (k < 1) return true;
      if (!open) { tray.visible = false; pb.classList.remove('hs-trayout'); if (t) { t.at.hide = true; t.obj.visible = false; H.saveThings(); emit('drive', { drive: 'cd', thing: t.id, inserted: true }); secret('hs.disc'); } }
      else if (t) emit('drive', { drive: 'cd', thing: t.id, inserted: false });
      return false;
    });
    emit('open', 'pc.cd');
  }
  function drives() {
    const L = L0(), front = trayFront(), r = H.ROOMS.bedroom;
    pcModel(L, r);
    pickBox(r, 'pc.power', L.tx, -19.7, L.tz + 19, 6.5, 6.5, 2); H.spot('pc.power', { label: () => H.stood ? 'Power button (no! sit down instead)' : 'Power button', range: 400, act: () => { if (H.stood) return H.sitDown(); if (H.live) pb.querySelector('.powerbtn').click(); } });
    // click targets on the tower's front (boot.js's PC itself takes no clicks)
    pickBox(r, 'pc.cdej', L.tx + 6.5, -37.4, front + 0.6, 4, 2, 1.4); H.spot('pc.cdej', { label: 'CD eject button', range: 200, act: () => trayMove(!drv.cd.open) });
    pickBox(r, 'pc.cdtray', L.tx, -39.2, front + 0.4, 16, 2.4, 1.2); H.spot('pc.cdtray', { label: 'CD-ROM drive', range: 200, act: () => trayMove(!drv.cd.open) });
    pickBox(r, 'pc.fdd', L.tx, -30, front + 0.4, 11, 3, 1.2); H.spot('pc.fdd', { label: 'Floppy drive', range: 200, act: () => { if (drv.floppy.thing) ejectFloppy(); else say('Floppy drive', 'A 1.44MB floppy drive. Pick up a floppy disk and put it in.'); } });
    pickBox(r, 'pc', L.mx, -24, -6, 38, 38, 22); H.spot('pc', { label: () => H.stood ? 'The PC (sit down)' : 'The PC', range: 400, act: () => { if (H.stood) return H.sitDown(); if (!H.live) return; const pw = pb.querySelector('.powerbtn'); if (pw) return pw.click(); H.glideTo(H.seatPose, { ms: 900, done: () => H.setWalkFrom(Object.assign({ seat: 1, lvl: 'U' }, H.seatPose())) }); say('The family PC', 'Press the power button on the tower to switch it on. (The big one. NOT Reset.)', 5000); } });
    pickBox(r, 'pc.tower', L.tx, -21, L.tz, 20, 42, 34); H.spot('pc.tower', { label: () => H.stood ? 'The PC (sit down)' : 'The PC', range: 400, act: () => H.act('pc') });
    H.snap('pc.cd', { room: 'bedroom', x: L.tx, y: -39.3, z: front + 7.5, r: 24, box: [16, 1.6, 14], accepts: k => k === 'disc', enabled: () => drv.cd.open && !drv.cd.thing && drv.cd.k > 0.95, hint: 'Click/E to place the disc in the tray', pose: { x: L.tx, y: -39.3, z: front + 7.5, ry: 0 },
      onSnap: t => { drv.cd.thing = t.id; trayBuild(); clipOn(t, true); say('CD-ROM', 'In the tray. Press the eject button (or click the tray) to close it.', 3500); },
      onUnsnap: t => { drv.cd.thing = null; clipOn(t, false); } });
    H.snap('pc.floppy', { room: 'bedroom', x: L.tx, y: -29.4, z: front + 3, r: 24, box: [10, 1, 6], accepts: k => k === 'floppy', enabled: () => !drv.floppy.thing, hint: 'Click/E to push it into the drive', pose: { x: L.tx, y: -29.4, z: front - 4, ry: 0, rx: -90 }, hide: true,
      onSnap: t => { drv.floppy.thing = t.id; H.sfx.tone(140, 0.05, 'square', 0.08); H.sfx.noise(0.05, 0.1, 2000, 0.06); emit('drive', { drive: 'floppy', thing: t.id, inserted: true }); },
      onUnsnap: t => { drv.floppy.thing = null; emit('drive', { drive: 'floppy', thing: t.id, inserted: false }); } });
    // (after a refresh: whatever was left in the drives is still in them)
    for (const id in H.THINGS) { const t = H.THINGS[id]; if (t.st === 'snap' && t.snap === 'pc.floppy') drv.floppy.thing = id; if (t.st === 'snap' && t.snap === 'pc.cd') { drv.cd.thing = id; trayBuild(); clipOn(t, true); t.at.hide = true; t.obj.visible = false; } }
  }
  // ================================================================ the family PC as real models in the room (switched off): the JackVision 15 CRT, the Family
  // PC 450 tower, the keyboard, the mouse on its mat. Drawn and depth-sorted with everything else, so it holds up from anywhere you
  // walk. While boot.js is flying in or out (its CSS 3D PC takes over for the BIOS hand-over) the engine hides this (House.pcGL).
  function pcModel(L, r) {
    const g = new T.Group(); g.name = 'pcGL'; const P = K.into(g);
    const BEI = M({ c: '#ece5cf', e: '#2e2a20', sh: 18, sp: '#222' }), BEI2 = M({ c: '#e0d8be', e: '#26221a', sh: 12, sp: '#1a1a1a' }) /* (a touch of glow: the beige reads as bright as boot.js's CSS PC) */, DK = M({ c: '#9a9070', sh: 8 });
    const monTex = K.tex('pc.monfront', 512, 448, (c, w, h) => {
      const s = w / 38; c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, w, h);
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(90,80,50,.16)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      // the recess round the glass
      c.fillStyle = '#b9af90'; c.beginPath(); c.roundRect ? c.roundRect(3.4 * s, 2.6 * s, 31.2 * s, 23.7 * s, 2 * s) : c.rect(3.4 * s, 2.6 * s, 31.2 * s, 23.7 * s); c.fill();
      c.fillStyle = '#10130f'; c.fillRect(4 * s, 3.2 * s, 30 * s, 22.5 * s);
      c.font = `${1.25 * s}px "Trebuchet MS",Verdana,sans-serif`; c.fillStyle = '#8a805f'; c.textBaseline = 'alphabetic'; c.fillText('JACKVISION', 3.6 * s, 28.6 * s);
      const tw = c.measureText('JACKVISION ').width; c.fillStyle = '#1d2c58'; c.fillText('15', 3.6 * s + tw, 28.6 * s);
      c.font = `${0.42 * s}px Verdana,sans-serif`; c.fillStyle = '#9a9070'; c.fillText('DIGITAL CONTROL · LOW RADIATION-ISH', 3.6 * s, 29.7 * s);
      for (let i = 0; i < 4; i++) { c.fillStyle = '#cfc6a8'; c.fillRect((20 + i * 2.2) * s, 27.6 * s, 1.6 * s, 0.8 * s); c.fillStyle = '#8f8668'; c.fillRect((20 + i * 2.2) * s, 28.3 * s, 1.6 * s, 0.12 * s); }
      c.fillStyle = '#bdb393'; c.beginPath(); c.arc(30.6 * s, 28.1 * s, 0.9 * s, 0, 7); c.fill();
    }, { clamp: true });
    const towTex = K.tex('pc.towfront', 256, 540, (c, w, h) => {
      const s = w / 20; c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, w, h);
      const bay = (y, hh, x0, ww) => { c.fillStyle = '#d9d0b4'; c.fillRect(x0 * s, y * s, ww * s, hh * s); c.strokeStyle = 'rgba(70,60,40,.55)'; c.lineWidth = 1.2; c.strokeRect(x0 * s, y * s, ww * s, hh * s); };
      bay(1.4, 4.3, 1.6, 16.8); c.fillStyle = '#d6cdb0'; c.fillRect(2.05 * s, 1.85 * s, 15.9 * s, 2.15 * s); c.strokeRect(2.05 * s, 1.85 * s, 15.9 * s, 2.15 * s);
      c.font = `bold ${0.6 * s}px Verdana`; c.fillStyle = '#6e6650'; c.fillText('CD-ROM  32X MAX', 3 * s, 5.2 * s); c.fillStyle = '#4f3d24'; c.fillRect(13 * s, 4.6 * s, 0.5 * s, 0.25 * s); c.fillStyle = '#b5ab8c'; c.fillRect(15.2 * s, 4.4 * s, 2.1 * s, 0.62 * s);
      bay(6.4, 4.3, 1.6, 16.8);
      bay(11.7, 2.9, 4.4, 11.2); c.fillStyle = '#1e1a12'; c.fillRect(5.25 * s, 12.3 * s, 9.5 * s, 0.62 * s); c.fillStyle = '#33402a'; c.fillRect(5.3 * s, 13.8 * s, 0.6 * s, 0.26 * s);
      c.fillStyle = '#f2ecd8'; c.fillRect(4.8 * s, 15.75 * s, 10.4 * s, 1.75 * s); c.strokeStyle = '#b8ae8e'; c.strokeRect(4.8 * s, 15.75 * s, 10.4 * s, 1.75 * s);
      c.font = `${1 * s}px Impact,"Arial Black",sans-serif`; c.textAlign = 'center'; c.fillStyle = '#1d2c58'; c.fillText('FAMILY PC', 9 * s, 17.1 * s); c.fillStyle = '#8a1010'; c.fillText('450', 14 * s, 17.1 * s);
      c.fillStyle = '#d2c9ab'; c.fillRect(1.6 * s, 19.6 * s, 16.8 * s, 6.6 * s); c.fillStyle = '#a59b7c'; c.fillRect(7.2 * s, 20.1 * s, 5.6 * s, 5.6 * s);
      c.fillStyle = '#5a6a3a'; c.beginPath(); c.arc(3 * s, 21 * s, 0.36 * s, 0, 7); c.fill(); c.fillStyle = '#6a3a1a'; c.beginPath(); c.arc(3 * s, 22.2 * s, 0.36 * s, 0, 7); c.fill();
      c.fillStyle = '#cfc5a7'; c.beginPath(); c.arc(17 * s, 21.1 * s, 0.52 * s, 0, 7); c.fill();
      c.fillStyle = '#fff2a0'; c.save(); c.translate(1.2 * s, 25.5 * s); c.rotate(-0.1); c.fillRect(0, 0, 6.4 * s, 2.6 * s); c.font = `${0.9 * s}px Impact,sans-serif`; c.fillStyle = '#1a3a9a'; c.textAlign = 'left'; c.fillText('JACK\'S!', 0.6 * s, 1.8 * s); c.restore();
      for (let y = 27.6; y < 37; y += 0.7) { c.fillStyle = '#3b3426'; c.fillRect(3.2 * s, y * s, 13.6 * s, 0.28 * s); }
      c.fillStyle = '#20202a'; c.fillRect(12.6 * s, 37.7 * s, 6.4 * s, 2.3 * s); c.font = `bold ${0.55 * s}px Verdana`; c.fillStyle = '#f3d266'; c.fillText('PENTIUM II', 13.2 * s, 39.1 * s);
      c.fillStyle = '#c4ba9a'; c.fillRect(0, 40.8 * s, w, 1.2 * s);
    }, { clamp: true });
    const kbTex = K.tex('pc.kbd', 512, 172, (c, w, h) => {
      const s = w / 30; c.fillStyle = '#e8e1cc'; c.fillRect(0, 0, w, h);
      const key = (x, y, ww) => { c.fillStyle = '#9c927a'; c.fillRect(x * s, y * s, ww * s, 1.06 * s); c.fillStyle = '#f2ecdc'; c.fillRect(x * s + 1, y * s + 1, ww * s - 2, 0.86 * s); };
      for (let i = 0; i < 13; i++) key(0.8 + i * 1.52, 0.6, 1.2);
      for (let r = 0; r < 5; r++) for (let i = 0; i < 13; i++) key(0.8 + i * 1.52 + (r % 2) * 0.3, 2.1 + r * 1.2, 1.36);
      key(5.6, 8.1, 9.6); for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) key(22.2 + i * 1.62, 2.1 + r * 1.2, 1.4);
      for (let i = 0; i < 3; i++) { c.fillStyle = '#4a5a3a'; c.fillRect((22.8 + i * 1.6) * s, 0.9 * s, 0.4 * s, 0.25 * s); }
    }, { clamp: true });
    const matTex = K.tex('pc.mat', 256, 218, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#23306b'); gr.addColorStop(1, '#141c45'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.font = '26px Impact,"Arial Black",sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,207,42,.85)'; c.fillText('JACK ATTACK!', w / 2, h - 18); }, { clamp: true });
    // the monitor (the glass's centre is (L.mx, -24.55, 0.02): the same place as boot.js's)
    P.rbox(L.mx, -22.5, -1.75, 38, 33, 3.5, 1.1, BEI); P.plane(L.mx, -22.5, 0.02, 36.6, 31.6, M({ c: '#fff', map: monTex, e: '#262218', sh: 16, sp: '#222' }));
    const glassM = M({ c: '#101a1b', sh: 110, sp: '#667d81' });
    const glass = { x: L.mx, y: -24.55, z: 0.70, w: 29.6, h: 22.2, depth: 0.3, bow: 0.28 };
    P.rbox(glass.x, glass.y, 0.1, 31.1, 23.7, 0.5, 0.24, M({ c: '#242b29', sh: 28, sp: '#46534f' }));
    P.geo(crtGlass(glass.w, glass.h, glass.depth, glass.bow), glass.x, glass.y, 0.25, glassM);
    P.rbox(L.mx, -22.8, -12, 33, 28.5, 17.5, 2.2, BEI2);
    P.rbox(L.mx, -22.5, -21.5, 22, 18, 4, 1.5, BEI2);
    P.box(L.mx, -4.4, -7.5, 13, 5, 10, DK);
    P.rbox(L.mx, -1, -8.5, 22, 2, 19, 0.8, BEI);
    P.shadow(L.mx, 0, -8.5, 30, 28, 0.55);
    // the tower
    P.rbox(L.tx, -21.6, L.tz, 19.5, 41.4, 34, 0.6, BEI2);
    P.rbox(L.tx, -21.6, L.tz + 17.65, 20, 42, 1.3, 0.45, BEI); P.plane(L.tx, -21.6, L.tz + 18.32, 19.4, 41.4, M({ c: '#fff', map: towTex, e: '#262218', sh: 16, sp: '#222' }));
    const btn = P.rbox(L.tx, -19.7, L.tz + 18.55, 4.6, 4.6, 0.9, 0.7, BEI);
    for (const dx of [-7, 7]) for (const dz of [-14, 14]) P.box(L.tx + dx, -0.3, L.tz + dz, 3.2, 0.6, 2, M('#1c1814'));
    P.shadow(L.tx, 0, L.tz, 26, 40, 0.6, { sq: true });
    // the keyboard and the mouse on its mat
    P.box(L.kx, -0.9, 11.5, 30, 1.8, 10, { t: M({ c: '#fff', map: kbTex, sh: 20, sp: '#222' }), all: BEI2 }, { rx: -4 });
    P.shadow(L.kx, 0, 11.5, 34, 13, 0.5, { sq: true });
    P.box(L.ux, -0.15, L.uz, 10, 0.3, 8.5, { t: M({ c: '#fff', map: matTex }), all: M('#141c45') });
    P.ball(L.ux, -1, L.uz, 1.75, 1.1, 2.9, BEI, 14);
    const cab = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(L.ux, -0.5, L.uz - 2.9), new T.Vector3(L.ux - 1, -0.4, L.uz - 9), new T.Vector3(L.ux - 4, -0.4, -6), new T.Vector3(L.ux - 6, -0.4, -24)]), 16, 0.22, 5, false);
    P.geo(cab, 0, 0, 0, M('#cfc5a7'));
    // the power LEDs (green while the PC is on and you've stood up from it)
    const ledOff = M({ c: '#33402a', sh: 60, sp: '#444' }), ledOn = M({ c: '#7dff6a', e: '#4dff3a', basic: true });
    const leds = [P.box(L.tx - 6, -21.6, L.tz + 18.4, 0.7, 0.7, 0.3, ledOff), P.box(L.mx + 11.6, -9.9, 0.1, 0.6, 0.6, 0.2, ledOff)];
    const ledSet = on => { const changed = pcPowered !== !!on; pcPowered = !!on; leds.forEach(m => { if (m) m.material = on ? ledOn : ledOff; }); if (changed) H.relight(); H.dirty(); };
    H.on('pcpower', on => ledSet(on)); H.on('stood', () => ledSet(pcPowered)); H.on('sat', () => ledSet(pcPowered)); ledSet(pcPowered);
    g.traverse(o => { if (o.isMesh) o.userData.noPick = 1; });
    g.userData.glass = glass; r.group.add(g); H.pcGL = g; H.pcGlass = glassM; H.dirty();
    return btn;
  }
  function ejectFloppy() { // ka-chunk: the disk pops out, ready to pick up
    const id = drv.floppy.thing; if (!id) return; const t = H.THINGS[id], L = L0(), front = trayFront();
    drv.floppy.thing = null; t.snap = null; t.at = { room: 'bedroom', x: L.tx, y: -29.4, z: front + 12, ry: 0 }; t.landY = 0; t.rx = 0;
    t.st = 'fall'; t.vy = 0; t.fromX = L.tx; t.fromZ = front + 4; t.t0 = performance.now(); t.obj.visible = true;
    H.sfx.tone(110, 0.08, 'square', 0.1); H.sfx.noise(0.06, 0.12, 1500);
    emit('drive', { drive: 'floppy', thing: id, inserted: false }); H.saveThings();
  }

  // ================================================================ clicking things: finds, clues, close-ups, the consoles
  const CLUES = {}, lastClue = {};
  const LINES = {
    bed: ['Under the bed: a sock, a Wobbly Wheel wrapper and a lot of fluff.', 'My bed. Space rockets on the duvet. Mom says I am too old for it. I am NOT.', 'Unmade. It\'s always unmade. What is the point, I\'m getting back in it tonight.'],
    beanbag: ['The beanbag. It leaks little white balls everywhere if you sit down too hard.', 'Best seat in the house for the Ultra 64.'],
    wardrobe: ['The wardrobe. School uniform on one side, everything else on the floor of it.', 'There is a welly in here. Just the one.'],
    bin: ['The bin. Crisp packets, a broken pencil and a letter from school I am NOT showing Mom.'],
    rug: ['The rug. It has a road map on it. I am sixteen and I still drive Micro Machines round it. Don\'t tell anyone.', 'Something rolled under the rug...'],
    window: ['The view out of my window. Back gardens, the shed and the big tree.', 'If you lean right out you can see the shop. Mom says do not lean right out.'],
    shelf: ['My shelf: the BUILDO space shuttle, the Buildex roller coaster (it works!) and my Swimming 25 Metres trophy (from when I was 7).', 'The roller coaster took three weekends. The car falls off on the loop.'],
    tvback: ['Behind the telly: about forty leads, all tangled. Nobody knows which one is which.'],
    mags: ['A pile of games mags. The free demo discs are coasters now.', 'The cheats pages are the most read bit. They are falling out.'],
    clock: () => { const d = new Date(); return `The radio alarm clock says ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}. It's tuned to the chart show. The snooze button is broken from overuse.`; },
    cork: ['My cork board: a 1999 calendar, a photo of me and Dave at the swimming baths, and a list of cheats.'],
    posterband: ['THE MODEM BOYS. Best band ever. Their song "Beep Bop Connect" was number 4 for a week.'],
    posterfilm: ['STAR SCRAPS: The Phantom Menu. A film about a space restaurant. It is a parody in a comic. Dave drew it.'],
    rack: ['My CD rack. Mostly free CD-ROMs off magazines, and THE MODEM BOYS.'],
    drawer: ['My desk drawer: letters, floppy disks, a broken Eggbert... the usual.'],
    dcbox: ['The Daydream box. Polystyrene, instructions in five languages, a VMU leaflet.'],
  };
  const rot = {};
  const lineOf = id => { let L = LINES[id]; if (typeof L === 'function') return L(); if (!L) return ''; rot[id] = ((rot[id] | 0) + 1) % L.length; return L[(rot[id] + L.length - 1) % L.length]; };
  const coin = { clue: '', got: false, member: false };
  const COINSPOT = new Set(CAT.SPOTS.map(x => x[0]));
  const labelOf = id => { const s = H.SPOTS[id]; return s ? (typeof s.label === 'function' ? s.label() : s.label) : id; };
  // every click on a spot goes through here: another pack's clue first, then today's lost change, then the thing itself
  function wrap(id, inner) {
    return () => {
      const s = H.SPOTS[id]; const sid = (s && s.alias) || id;
      emit('click', sid); S.seen[sid] = 1; save();
      let cl = (CLUES[sid] || []).find(c => !(c.once && c.done) && (!c.when || c.when()));
      if (cl && lastClue[sid] === cl && !cl.once) { lastClue[sid] = null; cl = null; }
      if (cl) { cl.done = true; lastClue[sid] = cl; const t = typeof cl.text === 'function' ? cl.text() : cl.text; say(cl.title || labelOf(id), t); if (cl.secret) secret(cl.secret); return; }
      if (coin.member && !coin.got && COINSPOT.has(sid)) { try { Net.send({ t: 'rmCoin', spot: sid }); } catch (e) {} }
      if (inner) inner(sid); else search(sid);
    };
  }
  function search(id) {
    const hid = CAT.FINDS.filter(f => f.spot === id && isOut(f.from) && !S.f[f.id]);
    if (hid.length) return foundIt(hid[0]);
    say(labelOf(id) || id, esc(cast(lineOf(id) || 'Nothing here.')));
  }
  function foundIt(f) {
    S.f[f.id] = Date.now(); save();
    sfx('solve');
    const isCart = f.id.startsWith('cart.');
    say(isCart ? 'You found a game!' : 'Treasure!', `<b>${esc(f.n)}</b><br>${esc(cast(f.d))}${isCart ? '<br><small>It\'s on the games shelf now.</small>' : '<br><small>(It\'s in your treasure tin.)</small>'}`, 7000);
    try { if (window.Net && Net.me && Net.me.member) Net.send({ t: 'rmFind', id: f.id }); } catch (e) {}
    tinCount(); emit('find', f.id);
    const out = CAT.FINDS.filter(x => isOut(x.from));
    if (out.every(x => S.f[x.id])) secret('rm.tin');
    if (out.filter(x => x.id.startsWith('cart.')).every(x => S.f[x.id])) secret('rm.allgames');
  }
  let tinEl = null;
  function tinCount() { if (tinEl) tinEl.querySelector('.rm-tinn').textContent = Object.keys(S.f).filter(k => CAT.FIND[k]).length + '/' + CAT.FINDS.filter(f => isOut(f.from)).length; }

  // ---- the consoles: the camera goes right up to the telly (or you hold the Game Lad), then the screen takes over (js/rm-tv.js)
  let tvLoad = null, lastCon = 'n64', back = null;
  const loadJs = src => (window.Apps && Apps.load) ? Apps.load(src) : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  const rectOf = obj => { // where a thing is on the screen (rm-tv.js zooms out of it)
    const b = new T.Box3().setFromObject(obj); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = H.toScreen(x, -y, z); if (!p) continue; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    return { getBoundingClientRect: () => ({ left: x0, top: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0), right: x1, bottom: y1 }) };
  };
  const canGo = () => H.mode === 'walk' || H.mode === 'glide';
  const TV_SAVE = 'jhp_console_focus';
  let tvFocus = false, tvFocusCon = 'n64', tvRequest = 0, gbPlay = null;
  function holdHandheld() {
    const t = H.THINGS.gb;
    H.anims.delete('gb-return');
    if(t.st==='fall') t.at.y=t.landY;
    gbPlay = {at:Object.assign({},t.at),st:t.st,rx:t.rx||0,rz:t.rz||0,view:Object.assign({},H.P,{rx:0,seat:1,lvl:H.W.lvl})};
    const view = gbPlay.view, yaw=view.ry*D2R, d=Math.max(8/(Math.tan(H.camera.fov*D2R/2)*.8),5/(Math.tan(H.camera.fov*D2R/2)*innerWidth/innerHeight*.8));
    t.st='play';t.inspectFront=true;H.layerFor(t);
    const pos=t.obj.position.clone(),rot=t.obj.quaternion.clone(),target=new T.Vector3(view.x+Math.sin(yaw)*d,view.y+.5,view.z-Math.cos(yaw)*d);
    const q=new T.Quaternion().setFromEuler(new T.Euler(-80*D2R,-view.ry*D2R,0,'YXZ')),t0=performance.now();
    H.anims.set('gb-pose',n=>{const k=Math.min(1,(n-t0)/650),e=k*k*(3-2*k);t.obj.position.lerpVectors(pos,target,e);t.obj.quaternion.copy(rot).slerp(q,e);return k<1;});
  }
  function returnHandheld() {
    if(!gbPlay)return; const saved=gbPlay,t=H.THINGS.gb;gbPlay=null;H.anims.delete('gb-pose');
    const pos=t.obj.position.clone(),q=t.obj.quaternion.clone(),target=new T.Vector3(saved.at.x,saved.at.y,saved.at.z);
    const end=new T.Quaternion().setFromEuler(new T.Euler(saved.rx*D2R,(saved.at.ry||0)*D2R,saved.rz*D2R,'YXZ')),t0=performance.now();
    t.st='anim';H.anims.set('gb-return',n=>{const k=Math.min(1,(n-t0)/500),e=k*k*(3-2*k);t.obj.position.lerpVectors(pos,target,e);t.obj.quaternion.copy(q).slerp(end,e);if(k<1)return true;t.at=saved.at;t.rx=saved.rx;t.rz=saved.rz;t.st='rest';t.inspectFront=false;H.place(t);H.layerFor(t);return false;});
  }
  function tvSession(value) { try { if (value) localStorage.setItem(TV_SAVE, JSON.stringify(value)); else localStorage.removeItem(TV_SAVE); } catch (e) {} }
  function inserted(con) { return Object.values(mediaThings).find(t => t && t.st === 'snap' && t.snap === 'console.' + con); }
  function tvPose(con) {
    // Fit the whole portable set, including its bezel, in either orientation.
    const aspect = innerWidth / innerHeight, fov = H.camera.fov * D2R / 2;
    if (con === 'gb') {
      if (gbPlay) return gbPlay.view;
      const a = H.THINGS.gb.at, yaw = (a.ry || 0) * D2R;
      const d = Math.max(8 / (Math.tan(fov) * .84), 4.5 / (Math.tan(fov) * aspect * .86));
      return { x: a.x + Math.sin(yaw) * d * .174, y: a.y - 2.7 - d * .985, z: a.z + Math.cos(yaw) * d * .174, rx: -80, ry: -(a.ry || 0), seat: 1, lvl: 'U' };
    }
    const d = Math.max(17.5 / (Math.tan(fov) * 0.83), 24 / (Math.tan(fov) * aspect * 0.88));
    return { x: TX - 1, y: 8.4, z: -24 + d, rx: 0, ry: 0, seat: 1, lvl: 'U' };
  }
  function tvOpen(con, gameId, resume) {
    if (!canGo() || pending || H.focused || (window.RoomTV && RoomTV.open_)) return;
    if (con === 'dc' && !R.dcOut) return;
    const loaded = inserted(con); gameId = gameId || (loaded && loaded.gameId);
    if (con !== 'gb') lastCon = con;
    H.hush();
    const go = () => { RoomTV.open(con, con === 'gb' ? rectOf(H.THINGS.gb.obj) : rectOf(R.tvScreen), { restoring: !!resume }); if (gameId) RoomTV.playPhysical(gameId); };
    const ready = () => window.RoomTV ? Promise.resolve() : (tvLoad = tvLoad || loadJs('js/rm-tv.js'));
    if (H.held()) H.putBack();
    if (con === 'gb') holdHandheld();
    tvFocusCon = con;
    clearTimeout(boT);
    const request = ++tvRequest, p = ready().then(() => true, () => { tvLoad = null; return false; });
    tvFocus = H.focus(() => tvPose(con), { label: 'Back to the room', ms: resume ? 350 : 750,
      enter: () => p.then(ok => {
        if (request !== tvRequest || !H.focused) return;
        if (!ok) { H.unfocus(); say('The telly', 'That did not load. Try again in a minute.'); return; }
        try { go(); } catch (e) { console.error(e); H.unfocus(); }
      }),
      exit: () => { returnHandheld(); tvFocus = false; ++tvRequest; if (window.RoomTV && RoomTV.open_) RoomTV.close(); else if (!(window.RoomTV && RoomTV._dbg() && RoomTV._dbg().background)) tvSession(null); }
    });
    if (tvFocus) tvSession({ con, gid: gameId || '', back: H._.focusS.back });
  }
  addEventListener('resize', () => { if (tvFocus && H.mode === 'focus') { Object.assign(H.P, tvPose(tvFocusCon)); H.dirty(); } });
  // ---- close-ups (js/rm-bits.js): the camera moves in close first, and back out after
  let bitsLoad = null, pending = false, boT = 0;
  const BITVIEW = { postershuttle: [-52, -82, BZ], posterband: [TX, -64, BZ], posterfilm: [TX - 58, -96, BZ], cork: [42, -84, BZ], window: [191, -63, BZ], lava: [134, 6, BZ + 21], mags: [TX + 34, FY, 58], rack: [TX - 56, 33, -44], drawer: [56, 6, 40] };
  function bits(id) {
    if (!canGo() || pending || (window.RoomBits && RoomBits.open_)) return;
    H.hush();
    const open = () => { try { RoomBits.open(id); } catch (e) { console.error(e); } };
    const ready = () => window.RoomBits ? Promise.resolve() : (bitsLoad = bitsLoad || loadJs('js/rm-bits.js'));
    const at = BITVIEW[id];
    if (!at) return ready().then(open, () => { bitsLoad = null; });
    if (H.held()) H.putBack();
    clearTimeout(boT); pending = true;
    if (!back) back = { x: H.P.x, y: H.P.y, z: H.P.z, rx: H.P.rx, ry: H.P.ry, lvl: 'U', seat: H.W.seat };
    const [x, y, z] = at, wallBack = z <= BZ + 2, d = wallBack ? 66 : 72;
    let ex, ez, ey;
    if (wallBack) { ex = x; ez = z + d; ey = y; }
    else { const dx = H.P.x - x, dz = H.P.z - z, n = Math.max(1, Math.hypot(dx, dz)); ex = x + dx / n * d; ez = z + dz / n * d; ey = y - 46; }
    const ry = Math.atan2(x - ex, -(z - ez)) / D2R, rx = Math.atan2(-(y - ey), Math.hypot(x - ex, z - ez)) / D2R;
    const p = ready();
    H.glideTo({ x: ex, y: ey, z: ez, rx, ry, seat: 1, lvl: 'U' }, { lock: true, ms: 700, cancel: () => { pending = false; backOut(); }, done: () => p.then(() => { pending = false; open(); }, () => { pending = false; bitsLoad = null; back = null; }) });
  }
  // back out to where you were when a close-up or the telly shuts
  function backOut() { pending = false; if (!back) return; const b = back; back = null; H.glideTo(b, { ms: 650, done: () => H.setWalkFrom(b) }); }

  // ---- the cat
  let strokes = 0;
  function catAct() {
    strokes++; sfx('pet');
    const hid = CAT.FINDS.filter(f => f.spot === 'cat' && isOut(f.from) && !S.f[f.id]);
    if (hid.length && strokes >= 3) return foundIt(hid[0]);
    if (strokes >= 6) secret('rm.tibbs');
    let he = 'he', him = 'him'; try { he = Cast.he('cat'); him = Cast.him('cat'); } catch (e) {}
    const n = catName(), He = he[0].toUpperCase() + he.slice(1);
    say(n, esc([`${n} from next door. ${He} comes in through the window and sleeps on my bed. Nobody knows why.`, `Stroke stroke. ${He} opened one eye. ${He} closed it again.`, `${He}'s stretching! There's something under ${him}...`, 'Prrrrrrr.', `PRRRRRRRRRRRR. ${He} likes that.`, `PRRRRRRRRRRRRRRRRRRR! ${He}'s rolled over! Best cat ever.`][Math.min(5, strokes - 1)]));
  }
  // ---- the hi-fi (plays a tune, if the sound's on)
  let hifiOn = false;
  function hifi() {
    secret('hs.hifi');
    try {
      if (!Sound.on) return say('Hi-fi', 'THE MODEM BOYS CD is in. (Switch the sound on to hear it: the speaker on the telly, or the one in the PC\'s taskbar.)');
      if (!hifiOn) { if (Sound.addTune) Sound.addTune('modemboys', { lead: [72, -1, 74, 76, -1, 79, 76, 74, 72, -1, 69, 0, 67, 69, 72, -1, 72, -1, 74, 76, -1, 79, 81, 79, 76, -1, 74, 0, 72, 74, 72, -1], bass: [48, 48, 45, 45, 41, 41, 43, 43, 48, 48, 45, 45, 41, 43, 48, 48], step: 0.16, hats: true }); Sound.music.play('modemboys'); hifiOn = true; say('Hi-fi', '"Beep Bop Connect" by THE MODEM BOYS. Turned up to 7. (Mom will shout at 8.)'); }
      else { Sound.music.stop(); hifiOn = false; say('Hi-fi', 'Off.'); }
    } catch (e) {}
    LIGHT.hifi = hifiOn; emit('hifi', hifiOn);
  }

  // ================================================================ the treasure tin on the HUD
  function hudExtras() {
    if (tinEl) return;
    tinEl = document.createElement('button'); tinEl.type = 'button'; tinEl.className = 'rm-tinbtn hs-tin'; tinEl.setAttribute('aria-label', 'My treasure tin');
    tinEl.innerHTML = '<i class="rm-tinico"></i><span class="rm-tinn">0</span><b class="rm-coinb" hidden title="Mom has lost some change in your room today">&pound;?</b>';
    tinEl.addEventListener('click', () => bits('tin'));
    H.ui.el.appendChild(tinEl); tinCount();
  }

  // ================================================================ stations (the arrows): the telly, the PC, the window and bed, the door
  const look = (fx, fz, tx, ty, tz, eye) => { const ey = FY - (eye || 158); const ry = Math.atan2(tx - fx, -(tz - fz)) / D2R, rx = Math.atan2(-(ty - ey), Math.hypot(tx - fx, tz - fz)) / D2R; return { x: fx, y: ey, z: fz, rx, ry, lvl: 'U' }; };
  const tall = () => !!(window.matchMedia && matchMedia('(max-aspect-ratio: 3/4)').matches);
  room.stations = [
    { id: 'telly', n: 'Consoles', pose: () => tall() ? look(-128, 160, TX + 2, 10, -30, 150) : look(-92, 140, TX - 12, 12, -26, 150) },
    { id: 'desk', n: 'The PC', pose: () => Object.assign(H.seatPose(), { seat: 1, lvl: 'U' }) },
    { id: 'window', n: 'Window', pose: () => tall() ? look(100, 214, 196, -10, -20, 160) : look(52, 196, 196, -16, -14, 160) },
    { id: 'door', n: 'The door', pose: () => tall() ? look(-70, 120, 240, -40, 190, 160) : look(-80, 110, 240, -30, 178, 160) },
  ];
  const STN = { telly: 0, desk: 1, window: 2, door: 3, bed: 2 };

  // ================================================================ members: what the server says we've found, today's lost change
  function net() {
    if (!window.Net) return;
    Net.on('rmMe', m => {
      coin.member = !!m.member; coin.got = !!(m.coin && m.coin.got); coin.clue = (m.coin && m.coin.clue) || '';
      if (tinEl) tinEl.querySelector('.rm-coinb').hidden = !(coin.member && !coin.got);
      if (m.f) { let ch = false; for (const k in m.f) if (!S.f[k] && CAT.FIND[k]) { S.f[k] = m.f[k]; ch = true; emit('find', k); } if (ch) { save(); tinCount(); } }
      if (m.member) for (const k in S.f) if (CAT.FIND[k] && !(m.f && m.f[k])) Net.send({ t: 'rmFind', id: k });
    });
    Net.on('rmFound', m => { if (m.amt > 0) toast('+' + m.amt + ' Rupees', 'For finding: ' + ((CAT.FIND[m.id] || {}).n || 'something')); if (m.all) toast('EVERY GAME FOUND!', 'A Golden Floppy Disk is in your loot!'); });
    Net.on('rmCoin', m => { if (m.ok) { coin.got = true; if (tinEl) tinEl.querySelector('.rm-coinb').hidden = true; sfx('solve'); say("Mom's lost change!", `There it is! Mom said I can keep it.<br><b>+${m.amt | 0} Rupees</b>`, 6000); } });
    const ask = () => Net.send({ t: 'rmMe' });
    Net.on('welcome', ask); Net.on('loginOk', ask);
    try { if (Net.me && Net.me.id) ask(); } catch (e) {}
  }
  net();

  // ================================================================ downstairs (js/hs-house.js, loaded the first time you open the door)
  let houseP = null;
  function ensureHouse() {
    if (houseP) return houseP; // init marks ready before its door-registration microtask finishes
    if (window.HouseRooms && HouseRooms.ready) return Promise.resolve();
    if (!houseP) houseP = loadJs('js/hs-house.js').then(() => { if (!window.HouseRooms) throw new Error('no house'); return HouseRooms.init(); }).catch(e => { houseP = null; throw e; });
    return houseP;
  }

  // ================================================================ wiring it all up
  function wire() {
    const ACT = {
      n64: () => tvOpen('n64'), ps: () => tvOpen('ps'), md: () => tvOpen('md'), dc: () => tvOpen('dc'), telly: () => tvOpen(lastCon),
      dcbox: id => { if (!R.dcOut) return say('My Christmas list', 'Number 1: a Daydream. It comes out on the 14th of October and it has a MODEM in it. You can go on the Internet ON THE TELLY.'); search(id); },
      post: () => { const f = CAT.FIND['cart.dc.duel']; if (!S.f[f.id]) { secret('rm.post'); foundIt(f); } R.post.visible = false; H.dirty(); },
      cat: catAct,
      postershuttle: () => bits('postershuttle'), posterband: () => bits('posterband'), posterfilm: () => bits('posterfilm'), cork: () => bits('cork'),
      window: () => { if (night()) secret('rm.night'); const hid = CAT.FINDS.filter(f => f.spot === 'window' && isOut(f.from) && !S.f[f.id]); if (hid.length) return foundIt(hid[0]); bits('window'); },
      lava: () => bits('lava'), mags: () => { const hid = CAT.FINDS.filter(f => f.spot === 'mags' && isOut(f.from) && !S.f[f.id]); if (hid.length) return foundIt(hid[0]); bits('mags'); }, rack: () => bits('rack'),
    };
    for (const id in H.SPOTS) {
      const s = H.SPOTS[id]; if (s.wrapped) continue;
      s.wrapped = 1;
      if (H.THINGS[id]) continue; // (things you pick up: the engine grabs them)
      const own = ACT[id] || s.act;
      s.act = wrap(id, own ? (sid => own(sid)) : null);
    }
    // (the Game Lad is a thing you pick up; a click grabs it. Its act() is still "play it", for other packs' code and the tests)
    if (H.SPOTS.gb) H.SPOTS.gb.act = () => tvOpen('gb');
  }
  let started = false;
  function startHouse() {
    if (started) return; started = true;
    // (the landing comes first, so the door knows where it goes; js/hs-house.js fills it in)
    if (!H.ROOMS.landing) H.room('landing', { name: 'The landing', lvl: 'U', area: [[250, 130, 410, 250], [250, 250, 330, 700]], stations: [], build() {} });
    H.buildRoom(room);
    pickBox(room, 'window', 191, -63, BZ - 4, 70, 98, 4); H.SPOTS.window.label = 'The window';
    things(); drives(); wire(); mediaShelf(); hudExtras();
    let clockMin = -1;
    H.ambient.add(now => { // the gentle stuff: the lava lamp's blobs, the cat breathing, the clock, the sky
      if (R.blobs && LIGHT.lava) R.blobs.forEach((b, i) => { const t = now / (2600 + i * 900) + i * 2; b.position.y = -12 - (Math.sin(t) * 0.5 + 0.5) * 12; b.scale.y = 1.6 + Math.sin(t * 2.3) * 0.5; });
      if (R.catBody) R.catBody.scale.y = 6.5 + Math.sin(now / 900) * 0.25;
      const d = new Date(); if (d.getMinutes() !== clockMin) { clockMin = d.getMinutes(); paintClock(d); if (clockMin % 5 === 0) paintSky(); }
    });
    lampLook();
    postCheck(); setInterval(postCheck, 5000);
    // (the close-ups and the consoles' screen are wanted soon: fetch them while nothing's happening)
    setTimeout(() => { if (!window.RoomBits) (bitsLoad = bitsLoad || loadJs('js/rm-bits.js')).catch(() => { bitsLoad = null; }); }, 5000);
    setTimeout(() => { if (!window.RoomTV) (tvLoad = tvLoad || loadJs('js/rm-tv.js')).catch(() => { tvLoad = null; }); }, 9000);
    setTimeout(() => { if (!window.HouseMobile) loadJs('js/hs-mobile.js').catch(() => {}); }, 2500); // Jack's mobile, on the desk
    emit('ready');
  }
  // Real games live in individually spaced slots beside the cabinet.
  const mediaThings = {};
  function mediaLabel(g, con) {
    return K.tex('media.print.' + g.id, 512, 320, (c, w, h) => {
      c.fillStyle = '#eee5cd'; c.fillRect(0, 0, w, h);
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, g.col || '#344b6c'); gr.addColorStop(1, '#161a27');
      c.fillStyle = gr; c.fillRect(8, 8, w - 16, h - 16);
      c.save(); c.beginPath(); c.rect(8, 8, w - 16, h - 16); c.clip();
      c.strokeStyle = 'rgba(255,239,171,.16)'; c.lineWidth = 14;
      for (let x = -h; x < w; x += 62) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + h, 0); c.stroke(); }
      // Original printed game art: a chequered sunburst and a small cartridge-era crest.
      c.fillStyle = '#f4cc5d'; c.beginPath(); c.arc(420, 100, 50, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#202634'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) c.fillRect(380 + x * 20, 60 + y * 20, 20, 20);
      c.restore(); c.fillStyle = '#131722'; c.fillRect(8, 8, w - 16, 43);
      c.fillStyle = '#efe5c8'; c.font = 'bold 23px Arial'; c.textAlign = 'left'; c.fillText(con.brand, 23, 38, w - 46);
      c.font = 'italic bold 42px Arial'; c.fillStyle = '#fff7df'; c.shadowColor = '#121421'; c.shadowBlur = 0; c.shadowOffsetY = 3;
      K.wrapText(c, g.title, 25, 158, 455, 45); c.shadowOffsetY = 0;
      c.fillStyle = '#e2d8bd'; c.font = '16px "Courier New"'; c.fillText('1999  •  ' + (con.media === 'disc' ? 'CD-ROM' : 'GAME PAK'), 23, 288);
      if (g.owner) { c.fillStyle = '#fff3b5'; c.fillRect(330, 254, 159, 48); c.fillStyle = '#273a65'; c.font = 'bold 19px "Courier New"'; c.fillText(g.owner.toUpperCase() + "'S", 342, 285, 140); }
    }, { clamp: true });
  }
  function mediaModel(g, con) {
    const obj = new T.Group(), B = K.into(obj), label = mediaLabel(g, con);
    if (con.media === 'disc') {
      // A closed annulus, not a solid coin: the clear hub has a real spindle hole.
      const shape = new T.Shape(); shape.absarc(0, 0, 6, 0, Math.PI * 2, false);
      const hole = new T.Path(); hole.absarc(0, 0, 0.78, 0, Math.PI * 2, true); shape.holes.push(hole);
      const geo = new T.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false, steps: 1, curveSegments: 48 });
      B.geo(geo, 0, -6, -0.09, M({ c: '#bac9d5', sh: 100, sp: '#f2dffb' }));
      const face = new T.RingGeometry(1.45, 5.82, 64); flipUV(face);
      B.geo(face, 0, -6, 0.101, M({ c: '#fff', map: label, sh: 35, sp: '#555' }));
      const back = new T.RingGeometry(1.45, 5.84, 64);
      B.geo(back, 0, -6, -0.101, M({ c: '#9fb6d1', sh: 120, sp: '#ddbded' }), { ry: 180 });
      B.geo(new T.TorusGeometry(1.14, 0.04, 6, 32), 0, -6, 0.12, M({ c: '#dfe4e8', sh: 100 }));
    } else {
      const small = g.con === 'gb', w = small ? 5.4 : 10, h = small ? 5.8 : 8, d = small ? 0.85 : 2.5;
      const shell = M({ c: g.con === 'md' ? '#28282c' : small ? '#97979c' : '#8b8c90', sh: 28, sp: '#45464c' });
      B.rbox(0, -h / 2, 0, w, h, d, small ? 0.2 : 0.5, shell);
      B.rbox(0, -h / 2, -d / 2 - 0.04, w - 0.5, h - 0.7, 0.16, 0.07, M('#5e6064'));
      B.rbox(0, -h * 0.52, d / 2 + 0.02, w * 0.78, h * 0.67, 0.12, 0.05, M('#36383c'));
      B.box(0, -h * 0.52, d / 2 + 0.095, w * 0.73, h * 0.61, 0.045, { f: M({ c: '#fff', map: label, sh: 12 }), all: M('#d1cbb7') });
      for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) B.box(sd * (w / 2 - 0.35), -h + 0.9 + i * 0.38, d / 2 + 0.05, 0.48, 0.12, 0.14, shell);
      for (const x of [-w * 0.32, w * 0.32]) {
        B.cyl(x, -h + 0.8, -d / 2 - 0.15, 0.2, 0.2, 0.08, 10, M('#a7a8aa'), { rx: 90 });
        B.box(x, -h + 0.8, -d / 2 - 0.2, 0.22, 0.05, 0.03, M('#38393b'));
      }
      B.box(0, -0.24, 0, w * 0.7, 0.48, d * 0.48, M('#292c2c'));
      for (let i = 0; i < 12; i++) B.box(-w * 0.29 + i * w * 0.053, -0.1, d * 0.26, w * 0.027, 0.2, 0.055, M({ c: '#bd9a47', sh: 65 }));
    }
    return obj;
  }
  function lidSet(con, open) {
    const machine = R.consoles && R.consoles[con]; if (!machine || !machine.lid) return;
    const from = machine.lid.rotation.x, to = open ? 72 * D2R : 0, start = performance.now();
    H.anims.set('console.lid.' + con, now => { const k = Math.min(1, (now - start) / 320); machine.lid.rotation.x = from + (to - from) * (1 - Math.pow(1 - k, 3)); return k < 1; });
  }
  function ejectMedia(con) {
    const t = inserted(con); if (!t) return;
    lidSet(con, true);
    // The grab API owns unsnapping, visibility, rotation and persistence.
    if (!H.held()) H.grab(t.id);
  }
  function mediaShelf() {
    if (mediaThings._ready) return;
    mediaThings._ready = 1;
    const games = CAT.GAMES.filter(g => !CAT.CONSOLES[g.con].away);
    const owns = g => isOut(g.from || CAT.CONSOLES[g.con].from) && (g.own || S.f['cart.' + g.id] || (window.PM && PM.owns && PM.owns('cart.' + g.id)));
    for (const [id, c] of Object.entries(R.consoles || {})) {
      Room.addSnap('console.' + id, { x: c.x, y: c.y, z: c.z, r: 14, box: c.disc ? [12, 0.4, 12] : [10, 4, 3],
        pose: { x: c.x, y: c.y + (c.disc ? -0.14 : 1), z: c.z + (c.disc ? 6 : 0), ry: 0, rx: c.disc ? 90 : 0 }, hide: c.disc,
        accepts: (kind, t) => !!(t && CAT.GAME[t.gameId] && CAT.GAME[t.gameId].con === id), enabled: () => !inserted(id),
        hint: 'Click/E to insert into the ' + CAT.CONSOLES[id].n,
        onSnap: t => { lidSet(id, false); tvOpen(id, t.gameId); }, onUnsnap: () => {lidSet(id, true); if (window.RoomTV) RoomTV.stopPhysical(id);} });
    }
    const gb = H.THINGS.gb;
    const gbSlot = Room.addSnap('console.gb', { x: 0, y: 0, z: 0, r: 10, box: [5.5, 1, 2], pose: {},
      accepts: (kind, t) => !!(t && CAT.GAME[t.gameId] && CAT.GAME[t.gameId].con === 'gb'),
      enabled: () => (gb.st === 'rest' || gb.st === 'snap') && !inserted('gb'), hint: 'Click/E to insert into the Game Lad', onSnap: t => tvOpen('gb', t.gameId),
      onUnsnap: t => {t.frontAnchor=null;if (window.RoomTV) RoomTV.stopPhysical('gb');} });
    const moveGBSlot = () => {
      gb.obj.updateWorldMatrix(true,false);
      const local=new T.Matrix4().makeRotationX(-Math.PI/2);local.setPosition(0,.28,-6.5);
      const matrix=new T.Matrix4().copy(H.root.matrixWorld).invert().multiply(gb.obj.matrixWorld).multiply(local);
      const pos=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();matrix.decompose(pos,q,scale);const rot=new T.Euler().setFromQuaternion(q,'YXZ');
      Object.assign(gbSlot,{x:pos.x,y:pos.y,z:pos.z});Object.assign(gbSlot.pose,{x:pos.x,y:pos.y,z:pos.z,rx:rot.x/D2R,ry:rot.y/D2R,rz:rot.z/D2R});
      const t=inserted('gb');if(t){t.frontAnchor='gb';t.obj.position.copy(pos);t.obj.quaternion.copy(q);H.layerFor(t);if(gb.st==='rest'||gb.st==='snap'){t.at=Object.assign({room:gb.at.room},gbSlot.pose);t.rx=rot.x/D2R;t.rz=rot.z/D2R;}}
      if(gb.st==='held'||gb.st==='inspect'||gb.st==='play'||gb.st==='anim')H.anims.set('gb-slot',()=>{moveGBSlot();return gb.st==='held'||gb.st==='inspect'||gb.st==='play'||gb.st==='anim';});
    };
    moveGBSlot(); H.ambient.add(moveGBSlot);
    const add = g => {
      if (mediaThings[g.id] || !owns(g)) return;
      const con = CAT.CONSOLES[g.con], n = games.indexOf(g), x = TX - 66.5 + (n % 4) * 7, y = 7 + Math.floor(n / 4) * 15, z = -40;
      const shelf = 'media.shelf.' + g.id;
      Room.addSnap(shelf, { x, y: y - 5, z, r: 12, box: con.media === 'disc' ? [12, 12, 0.3] : [10, 8, 2.5],
        pose: { x, y, z, ry: 65 }, accepts: (kind, thing) => !!thing && thing.id === 'media.' + g.id, hint: 'Click/E to put it in its shelf slot' });
      const t = Room.grabbable('media.' + g.id, { obj: mediaModel(g, con),
        kind: con.media === 'disc' ? 'console-disc' : 'cart', label: `${g.title} (${con.n})`, gameId: g.id,
        home: { room: 'bedroom', x, y, z, ry: 65, snap: shelf }, holdD: 34 });
      mediaThings[g.id] = t;
      if (t.st === 'snap' && t.snap === 'console.' + g.con) { const c = R.consoles[g.con]; if (c && c.lid) c.lid.rotation.x = 0; }
    };
    games.forEach(add);
    (EVS.find = EVS.find || []).push(id => { if (id && id.startsWith('cart.')) { const g = CAT.GAME[id.slice(5)]; if (g) add(g); } });
    if (window.PM && PM.on) PM.on('change', () => games.forEach(add));
    H.ambient.add(() => { if (tvFocus && !H.focused) { returnHandheld(); tvFocus = false; ++tvRequest; tvSession(null); } });
    let saved; try { saved = JSON.parse(localStorage.getItem(TV_SAVE) || 'null'); } catch (e) {}
    if (saved && CAT.CONSOLES[saved.con] && !CAT.CONSOLES[saved.con].away) {
      let tries = 0;
      const resume = () => {
        if (!H.live || (!saved.background && !canGo())) { if (++tries < 200) setTimeout(resume, 100); return; }
        const t = mediaThings[saved.gid], sn = H.SNAPS['console.' + saved.con];
        if (saved.gid && (!t || !sn || CAT.GAME[saved.gid].con !== saved.con)) { tvSession(null); return; }
        if (t) { t.st = 'snap'; t.snap = sn.id; t.at = Object.assign({ room: 'bedroom', hide: !!sn.hide }, sn.pose); t.rx = sn.pose.rx || 0; H.place(t); lidSet(saved.con, false); }
        if (saved.background) {
          const ready = window.RoomTV ? Promise.resolve() : (tvLoad = tvLoad || loadJs('js/rm-tv.js'));
          ready.then(() => {RoomTV.open(saved.con, null, {restoring: true}); if (saved.gid) RoomTV.playPhysical(saved.gid); RoomTV.close();}).catch(() => {tvLoad = null;});
          return;
        }
        const b = saved.back;
        if (b && [b.x, b.y, b.z, b.rx, b.ry].every(Number.isFinite) && b.x > LX && b.x < RX && b.z > BZ && b.z < FZ) { Object.assign(H.P, b); H.setWalkFrom(b); }
        tvOpen(saved.con, saved.gid, true);
      };
      setTimeout(resume, 150);
    }
  }
  function paintClock(d) { const t = R.clockTex; if (!t) return; const g = t.userData.g; g.fillStyle = '#140404'; g.fillRect(0, 0, 128, 48); g.font = '700 38px "Courier New",monospace'; g.textAlign = 'center'; g.fillStyle = '#ff2a1a'; g.shadowColor = '#f00'; g.shadowBlur = 8; g.fillText(d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'), 64, 38); g.shadowBlur = 0; t.needsUpdate = true; H.dirty(); }
  function postCheck() { if (!R.post) return; const v = !!(R.dcOut && S.post && !S.f['cart.dc.duel']); if (R.post.visible !== v) { R.post.visible = v; H.dirty(); } }

  // rm-tv.js and rm-bits.js say when they shut: back out of the close-up
  // (but not if another one opened straight away: switching consoles, or one close-up leading to another)
  (EVS.close = EVS.close || []).push(() => { if (tvFocus) { H.unfocus(); return; } clearTimeout(boT); boT = setTimeout(() => { if (pending || (window.RoomTV && RoomTV.open_) || (window.RoomBits && RoomBits.open_) || pb.querySelector(':scope > .rm-view:not(.bye)')) return; backOut(); }, 160); });
  (EVS.open = EVS.open || []).push(() => clearTimeout(boT));
  H.on('room', (id, old) => { emit('room', id, old); if (id && id !== 'bedroom') ensureHouse().catch(() => {}); pb.classList.toggle('rm-away', id !== 'bedroom'); });
  H.on('station', (rid, sid) => { pb.classList.toggle('rm-away', !(rid === 'bedroom' && sid === 'desk')); if (rid === 'bedroom' && sid !== 'desk') secret('rm.room'); });
  H.on('standup', () => { pb.classList.add('rm-away'); secret('rm.room'); });
  H.on('stood', () => { secret('hs.stand'); H.relight(); });
  H.on('sat', () => H.relight());
  H.on('step', () => { if (carry.id) { carry.d++; if (carry.d > 40) secret('hs.juggle'); } });

  // ================================================================ the hook (the old calls keep working)
  window.Room = {
    prepare: startHouse,
    spots: () => Object.keys(H.SPOTS).filter(id => !id.startsWith('pc.')),
    _clues: id => (CLUES[id] || []).filter(c => !c.when || c.when()),
    addClue(id, c) { (CLUES[id] = CLUES[id] || []).push(Object.assign({}, c)); },
    addSpot(id, def) {
      def = def || {}; startHouse();
      const r = H.ROOMS[def.room || 'bedroom'] || room;
      const g = new T.Group(); g.position.set(def.x || 0, def.y || 0, def.z || 0); r.group.add(g);
      if (def.mesh) g.add(def.mesh);
      else {
        const w = def.w || 6, h = def.h || 6, d = def.d || 6;
        const front = def.paint ? M({ c: '#fff', map: K.tex('spot.' + id, 256, 256, def.paint) }) : def.html ? M({ c: '#fff', map: K.tex('spot.' + id, 256, 256, (gg, ww, hh) => { gg.fillStyle = def.col || '#e8e4d8'; gg.fillRect(0, 0, ww, hh); gg.font = '700 26px ' + A.UIF; gg.fillStyle = '#222'; gg.textAlign = 'center'; K.wrapText(gg, String(def.html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), 128, 60, 220, 32); }) }) : M(def.col || '#c8c0a8');
        K.into(g).box(0, 0, 0, w, h, d, { f: front, all: M(def.col || '#b8b0a0') });
      }
      H.spot(id, { label: def.label || id, obj: g, act: wrap(id, def.act ? (() => def.act(id)) : null), wrapped: 1, view: def.view, range: def.range || 240, room: def.room || 'bedroom' });
      H.dirty();
      return { obj: g, id };
    },
    grabbable(id, def) {
      def = def || {}; startHouse();
      let obj = def.obj || def.mesh;
      if (!obj) { obj = new T.Group(); const w = def.w || 10, h = def.h || 2, d = def.d || 10; K.into(obj).box(0, -h / 2, 0, w, h, d, { t: def.paint ? M({ c: '#fff', map: K.tex('grab.' + id, 256, 256, def.paint) }) : M(def.col || '#888'), all: M(def.col || '#888') }); K.into(obj).shadow(0, 0, 0, w * 1.2, d * 1.2, 0.5, { sq: true }); }
      obj.traverse(o => { o.userData.thing = 1; });
      const t = H.thing(id, Object.assign({}, def, { obj, home: Object.assign({ room: 'bedroom', x: 0, y: 0, z: 20, ry: 0 }, def.home || {}) }));
      H.SPOTS[id].wrapped = 1;
      if (def.onGrab) H.on('grab', g => { if (g === id) def.onGrab(t); });
      if (def.onPlace) H.on('place', g => { if (g === id) def.onPlace(t); });
      H.restoreThing(t); H.dirty();
      return t;
    },
    addSnap(id, def) { return H.snap(id, Object.assign({ room: 'bedroom' }, def)); },
    drive: name => { const d = drv[name]; return d ? { open: !!d.open, thing: d.thing } : null; },
    eject: name => { if (name === 'cd') trayMove(!drv.cd.open); else if (name === 'floppy') ejectFloppy(); },
    held: () => H.held(), tidy: rid => H.tidy(rid || 'bedroom'),
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); if (['grab', 'place', 'snap', 'unsnap'].includes(ev)) H.on(ev, fn); },
    say, toast, look(n) { const i = STN[n]; if (i != null) H.goStation(i); }, get station() { const i = H._.stIdx; return (room.stations[i] || {}).id || ''; },
    found: id => !!S.f[id], owned: g => { const G = CAT.GAME[g]; return !!G && (G.own ? isOut(CAT.CONSOLES[G.con].from) : !!S.f['cart.' + g]); },
    where: () => H.here, T, K, House: H, ensureHouse,
    onClose(fn) { (EVS.close = EVS.close || []).push(fn); }, offClose(fn) { const a = EVS.close || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
    _: { ejectMedia,
      tvVisible(con) {
        const screen = con === 'gb' ? R.gbScreen : R.tvScreen; if (!screen) return false;
        for (let o = screen; o; o = o.parent) if (!o.visible) return false;
        const v = new T.Vector3(); screen.getWorldPosition(v);
        const p = H.toScreen(v.x, -v.y, v.z);
        return !!p && p.x > -100 && p.y > -100 && p.x < innerWidth + 100 && p.y < innerHeight + 100;
      },
      tvOff(con) {
        const screen = con === 'gb' ? R.gbScreen : R.tvScreen; if (!screen) return;
        const m = screen.material, tx = m.map;
        if (tx && tx.userData.jackLive) {if (tx.userData.hud) tx.userData.hud.dispose(); tx.dispose();}
        m.map = con === 'gb' ? null : tex('screenOff'); m.color.set(con === 'gb' ? '#83956c' : '#ffffff');
        m.onBeforeCompile = () => {}; m.customProgramCacheKey = () => 'room-screen-off'; m.needsUpdate = true;
        if (con !== 'gb') LIGHT.telly = false;
        H.relight(); H.dirty();
      },
      tvOn(url) { if (!R.tvScreen) return; LIGHT.telly = true; H.relight(); const m = R.tvScreen.material; if (url) new T.TextureLoader().load(url, tx => { const old = m.map; m.map = tx; m.color.set('#ffffff'); if (old && old !== tex('screenOff')) old.dispose(); m.needsUpdate = true; H.dirty(); }); else { m.color.set('#6a8aff'); m.needsUpdate = true; H.dirty(); } },
      tvLive(canvas, overlay, con) {
        const screen = con === 'gb' ? R.gbScreen : R.tvScreen;
        if (!screen || !canvas) return null;
        const m = screen.material;
        const fresh = !(m.map && m.map.userData && m.map.userData.jackLive);
        const tx = fresh ? new T.CanvasTexture(canvas) : m.map;
        tx.image = canvas; tx.userData = tx.userData || {}; tx.userData.jackLive = true; tx.minFilter = T.LinearFilter; tx.magFilter = T.LinearFilter; tx.generateMipmaps = false;
        const hud = tx.userData.hud || (tx.userData.hud = new T.CanvasTexture(overlay || document.createElement('canvas')));
        hud.image = overlay || hud.image; hud.minFilter = T.LinearFilter; hud.magFilter = T.LinearFilter; hud.generateMipmaps = false; hud.needsUpdate = true;
        tx.needsUpdate = true; m.map = tx; m.color.set('#ffffff');
        if (fresh) {
          const uniforms = tx.userData.uniforms = { rmHUD: { value: hud }, rmLines: { value: canvas.height } };
          m.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, uniforms);
            shader.fragmentShader = 'uniform sampler2D rmHUD;\nuniform float rmLines;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
              vec4 screenHUD = texture2D(rmHUD, vUv);
              diffuseColor.rgb = mix(diffuseColor.rgb, screenHUD.rgb, screenHUD.a);
              diffuseColor.rgb *= 0.94 + 0.06 * step(1.0, mod(floor(vUv.y * rmLines), 2.0));
              vec2 edge = (vUv - 0.5) * vec2(1.25, 1.0);
              diffuseColor.rgb *= 1.0 - 0.22 * smoothstep(0.3, 0.78, length(edge));
              diffuseColor.rgb += vec3(0.035, 0.042, 0.05) * pow((1.0-vUv.x)*(1.0-vUv.y), 3.0);`);
          };
          m.customProgramCacheKey = () => 'room-crt-live'; m.needsUpdate = true;
        }
        tx.userData.uniforms.rmLines.value = canvas.height;
        if (con !== 'gb' && !LIGHT.telly) { LIGHT.telly = true; H.relight(); } H.dirty();
        return tx;
      },
      S, save, spot: (id, def) => H.spot(id, def), SPOTS: H.SPOTS, emit, secret, isOut, foundIt, search, freeze: () => !canGo(), sfx, esc,
      mk: (p, c, css, html) => { const d = document.createElement('div'); d.className = c; if (css) d.style.cssText = css; if (html) d.innerHTML = html; p.appendChild(d); return d; }, pb, stage: pb.querySelector('.pc-stage'), get hud() { return H.ui.el; }, coin,
      coinToast: amt => toast('+' + amt + ' Rupees', 'For playing on the consoles') },
  };
  // first visit: a gentle hint (on paper, like Jack's other notes)
  function hint() {
    if (H.here !== 'bedroom') return; // an outdoor resume is not a first bedroom visit
    if (S.seen._hint2) return; S.seen._hint2 = 1; save();
    const touch = !!(window.matchMedia && (matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches));
    say("Jack's room", touch ? 'This is my room! Walk round with the stick (bottom left), drag to look, and press on things to use them or pick them up. The PC is on the desk: its power button is on the tower.' : 'This is my room! Walk round with <b>W A S D</b> (or the arrow keys), drag to look, click things to use them or pick them up. The arrows jump to the good spots. The PC\'s power button is on the tower.', 11000);
  }
  // (with the PC on and the room not built yet, the mobile still has to buzz on the desk when a text comes)
  if (!live) setTimeout(() => { if (!window.HouseMobile && !started) { startHouse(); loadJs('js/hs-mobile.js').catch(() => {}); } }, 6000);
  // go: build the room straight away when it's on show, otherwise when someone stands up from the PC
  const H_stand = H.standUp;
  H.standUp = function () { startHouse(); return H_stand.apply(this, arguments); };
  if (live) {
    startHouse();
    const sp = H._.savedPose();
    if (sp && !(sp.lvl === 'U' && sp.x >= LX && sp.x <= RX && sp.z >= BZ && sp.z <= FZ)) ensureHouse().then(() => H.start(), () => H.start()); else H.start();
    setTimeout(hint, 1800);
  }
})();

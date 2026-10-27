/* hs-mobile: JACK'S MOBILE, in the room. The Talkbrik T-99 (js/family-phone.js: texts, Snake, the ringtone composer) is a real
 * thing on the desk, on charge. Press F / "Use it" to lean into its live LCD and physical keys where it lies or is held.
 * The 3D phone stays in the room, so everything the program does (texts to other visitors, T9, the
 * inbox on its 1999 dates, every secret and save) works exactly as before. A text arriving buzzes the phone where it lies.
 * The PC's My Mobile program stays as a thin fallback that says where the phone is (js/family.js asks HouseMobile). */
(function () {
  'use strict';
  const H = window.House, R = window.Room;
  if (!H || !H.ok || !R || window.HouseMobile) return;
  const K = H.K, T = H.T, A = window.HouseArt, M = K.mat, D2R = Math.PI / 180;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, x, ms) => H.say(t, x, ms), toast = (t, x) => H.toast(t, x);
  const BZ = -56, GY_U = 73;
  const HOME = { room: 'bedroom', x: 40, y: 0, z: -30, ry: 22 }; // on the desk, by the tower, on charge
  const PK = 'jhp_family_phone';
  const pst = () => { try { return JSON.parse(localStorage.getItem(PK) || 'null') || {}; } catch (e) { return {}; } };
  const psave = o => { try { localStorage.setItem(PK, JSON.stringify(Object.assign(pst(), o))); } catch (e) {} };
  const letters = {2:'ABC', 3:'DEF', 4:'GHI', 5:'JKL', 6:'MNO', 7:'PQRS', 8:'TUV', 9:'WXYZ', 0:'SPACE'};
  const phoneKeys = [
    {k:'c', x:-1.5, z:-1.2, w:.9, d:.7}, {k:'sel', x:0, z:-1.2, w:1.6, d:.8},
    {k:'up', x:1.5, z:-1.45, w:.9, d:.44}, {k:'down', x:1.5, z:-.92, w:.9, d:.44},
    ...Array.from({length:12}, (_, i) => ({k:'123456789*0#'[i], x:-1.3+(i%3)*1.3, z:.2+Math.floor(i/3)*1.05, w:1.12, d:.88}))
  ];
  const keyLabel = key => key.k === 'sel' ? 'Menu / Select' : key.k === 'up' ? 'Up' : key.k === 'down' ? 'Down' : key.k.toUpperCase() + (letters[key.k] ? ' ' + letters[key.k] : '');

  // 13 x 4.8 x 2.3 cm candy-bar shell, with a separate battery cover, rubber
  // keys, recessed glass and a short aerial. Every visible edge has thickness.
  function model() {
    const g = new T.Group(), batch = K.batch(), B = K.into(batch);
    const body = M({c:'#343d50', sh:32, sp:'#596478'}), seam = M({c:'#131922', sh:12});
    const face = M({c:'#424d62', sh:38, sp:'#657080'}), rubber = M({c:'#303642', sh:14});
    B.rbox(0, -1.12, 0, 4.8, 2.24, 13, .78, body);
    B.rbox(0, -1.52, -.1, 4.72, 1.48, 12.8, .6, seam);
    B.rbox(0, -1.83, -.15, 4.64, 1.1, 12.6, .5, face);
    B.rbox(0, -.18, .65, 4.06, .36, 10.5, .16, body); // removable battery, resting on the table
    B.rbox(0, -.13, 5.05, 1.4, .2, .55, .08, seam); // battery latch on the rear
    B.rbox(0, -2.37, -3.6, 3.74, .3, 3.24, .14, seam);
    B.rbox(0, -2.53, -3.6, 3.24, .12, 2.45, .05, M({c:'#657653', sh:24}));
    lcd = K.into(g).plane(0, -2.6, -3.6, 3.12, 2.08,
      M({c:'#a8d070', e:'#2a4a12', sh:16, side:2}).clone(), {rx:-90}); // native 96:64 LCD
    const brand = K.tex('mobile.brand.3', 256, 40, c => {
      c.fillStyle='#424d62'; c.fillRect(0,0,256,40);
      A.text(c, 'TALKBRIK', 128, 29, '700 25px '+A.UIF, '#deded0', 'center');
    });
    B.box(0, -2.4, -5.55, 3.3, .05, .48, {t:M({c:'#fff', map:brand}), all:face});
    for (let i=0; i<5; i++) B.rbox(-.9+i*.45, -2.41, -6.04, .23, .08, .3, .035, seam);
    for (const key of phoneKeys) {
      B.rbox(key.x, -2.48, key.z, key.w, .32, key.d, .15,
        key.k==='sel' ? M({c:'#587bb1', sh:35}) : rubber);
      const map = K.tex('mobile.key.letters.3.'+key.k, 128, 100, c => {
        c.fillStyle=key.k==='sel'?'#587bb1':'#303642'; c.fillRect(0,0,128,100);
        const small = letters[key.k] || (key.k==='*' ? '+' : key.k==='#' ? 'aA' : '');
        c.fillStyle='#f0ebd5'; c.textAlign='center';
        c.font='bold '+(small?'48':'54')+'px Arial';
        c.fillText(key.k==='sel'?'—':key.k==='up'?'▲':key.k==='down'?'▼':key.k.toUpperCase(),64,small?50:68);
        if (small) { c.font='bold 23px Arial'; c.fillText(small,64,84); }
      }, {clamp:true});
      // A thin, solid printed cap lies above each rounded rubber key; the
      // pointer quadrilateral uses the same height and the full rubber footprint.
      B.box(key.x, -2.652, key.z, key.w*.84, .024, key.d*.83, {t:M({c:'#fff', map, sh:12}), all:rubber});
    }
    for (let i=0; i<4; i++) B.cyl(-.6+i*.4, -2.38, 5.6, .075, .075, .14, 8, seam);
    B.cyl(1.5, -1.38, -7.24, .36, .4, 1.65, 12, rubber, {rx:90});
    B.ball(1.5, -1.38, -8.05, .37, .37, .37, rubber, 12);
    B.rbox(0, -1.04, 6.48, 1.32, .58, .18, .07, seam);
    B.box(0, -1.04, 6.58, .75, .23, .04, M('#777a74'));
    K.into(g).shadow(0, 0, 0, 5.9, 14, .52, {sq:true});
    batch.build(g); return g;
  }
  // the charger: a black brick in the wall socket behind the bedside table, a thin lead to the phone (drawn as part of the room)
  function charger(r) {
    const batch = K.batch(), B = K.into(batch); // (merged: one draw per material)
    // a switched UK socket: a moulded plate with a bevelled edge, its rocker (on: the red flash shows), screw caps
    const plate = M('#efece4'), black = M({ c: '#1a1a1e', sh: 30 }); // (two materials: two draws for the whole fitting)
    B.rbox(44, -12, BZ + 0.75, 8.6, 8.6, 1.5, 0.45, plate);
    B.rbox(46.6, -14.4, BZ + 1.7, 1.7, 2.4, 0.6, 0.22, plate);
    for (const dx of [-3.1, 3.1]) B.cyl(44 + dx, -9.6, BZ + 1.52, 0.45, 0.45, 0.12, 10, plate, { rx: 90 });
    B.rbox(43.2, -11.6, BZ + 3.6, 4.2, 5.2, 4.2, 0.6, black); // the charger brick, plugged in
    const lead = new T.CatmullRomCurve3([new T.Vector3(43.2, -9.2, BZ + 5), new T.Vector3(43.6, -3, BZ + 7), new T.Vector3(43, -0.5, BZ + 11), new T.Vector3(42, -0.4, BZ + 16), new T.Vector3(40, -1.1, BZ + 19.4)]);
    B.geo(new T.TubeGeometry(lead, 24, 0.22, 6), 0, 0, 0, black);
    batch.build(r.group);
  }

  // ================================================================ the thing (grabbable), and using it
  let thing = null, win = null, surf = null, usingT = 0, lcd = null, glow = false;
  function setGlow(on) { glow = !!on; if (!lcd) return; const m = lcd.material; m.emissive.set(on ? '#5aff6a' : '#2a4a12'); m.userData.e0 = m.emissive.clone(); H.dirty(); }
  function make() {
    const r = H.ROOMS.bedroom; if (!r || thing) return;
    charger(r);
    thing = H.thing('mobile', { home: HOME, kind: 'mobile', label: () => Cast.t("{me}'s mobile (Talkbrik T-99)"), obj: model(), use: () => use(), useLabel: 'Use it', holdD: 34, faceYou: false });
    thing.obj.traverse(o => { o.userData.thing = 1; });
    H.restoreThing(thing);
    const s = H.SPOTS.mobile; if (s) s.wrapped = 1;
    H.on('rest', id => { if (id === 'mobile') charge(); });
    H.on('grab', id => { if (id === 'mobile') { psave({ charging: false }); if (!pst().seenRoom) { psave({ seenRoom: 1 }); say(Cast.t("{me}'s mobile"), 'My Talkbrik T-99. Pay as you go. &pound;' + (((pst().credit == null ? 50 : pst().credit) | 0) / 100).toFixed(2) + ' credit. Press <b>F</b> (or "Use it") to have a look at it.', 6000); } } });
    charge();
    try { const sm = JSON.parse(localStorage.getItem('jhp_family_sms') || 'null'); if (sm && sm.inbox && sm.inbox.some(x => !x.read)) setGlow(true); } catch (e) {}
  }
  const atHome = () => thing && thing.st === 'rest' && thing.at.room === 'bedroom' && Math.abs(thing.at.x - HOME.x) < 14 && Math.abs(thing.at.z - HOME.z) < 14;
  function charge() { psave({ charging: !!atHome() }); }
  const where = () => { if (!thing) return 'in your room'; if (H.held() === 'mobile' || session?.held) return 'in your hand'; const a = thing.at; if (atHome()) return 'on charge on the desk in your room'; const rn = { bedroom: 'in your room', landing: 'on the landing', hall: 'in the hall', lounge: 'in the lounge', kitchen: 'in the kitchen', cupboard: 'under the stairs', garden: 'out in the garden', drive: 'out the front' }[a.room] || 'somewhere'; return rn + (a.y < (a.room === 'bedroom' ? GY_U : 353) - 20 ? ', on something' : ', on the floor'); };
  // Focus changes only the camera. The prop's at/home/save records stay intact.
  let session = null, returning = null, lcdTexture = null, stopLCD = null;
  const poseKeys = ['jhp_hs_pose','jhp_hs_stand'];
  function poseSnapshot() {
    try { return poseKeys.map(k=>localStorage.getItem(k)); } catch (e) { return null; }
  }
  function keepReturnSnapshot() {
    const s = session || returning;
    if (!s?.saved) return;
    // The house saves on pagehide/visibilitychange, including during glides.
    // Keep the standing snapshot, never the phone camera or a halfway return.
    try { poseKeys.forEach((k,i)=>{ if (s.saved[i] !== null) localStorage.setItem(k,s.saved[i]); }); } catch (e) {}
  }
  addEventListener('pagehide', keepReturnSnapshot);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keepReturnSnapshot(); });
  function phoneMatrix() {
    thing.obj.updateWorldMatrix(true, false);
    return new T.Matrix4().copy(H.root.matrixWorld).invert().multiply(thing.obj.matrixWorld);
  }
  function closePose() {
    const m = phoneMatrix(), width = innerWidth, height = innerHeight;
    // In a short landscape view concentrate on the working face: the aerial
    // and microphone can be outside the frame, but every screen pixel/key fits.
    const short = height < 540, z0 = short ? -5.22 : -8.45, z1 = short ? 4.08 : 6.7;
    const centre = new T.Vector3(0, -1.35, (z0+z1)/2).applyMatrix4(m);
    const normal = new T.Vector3(0, -Math.cos(6*D2R), Math.sin(6*D2R)).transformDirection(m);
    const f = normal.clone().negate(), ry = Math.atan2(f.x, -f.z)/D2R, rx = Math.asin(Math.max(-1,Math.min(1,-f.y)))/D2R;
    const right = new T.Vector3(Math.cos(ry*D2R), 0, Math.sin(ry*D2R));
    const up = new T.Vector3().crossVectors(right, f).normalize();
    const top = 48, bottom = Math.min(86, height*.2), margin = 16;
    const tan = Math.tan(H.camera.fov*D2R/2), aspect = width/height;
    const fitX = Math.max(.2, (width-2*margin)/width), fitY = Math.max(.2, (height-top-bottom)/height);
    let d = 4;
    for (const x of [-2.4,2.4]) for (const y of [-2.68,0]) for (const z of [z0,z1]) {
      const v = new T.Vector3(x,y,z).applyMatrix4(m).sub(centre), depth = v.dot(f);
      d = Math.max(d, (H.camera.near||6)+.7-depth, Math.abs(v.dot(right))/(tan*aspect*fitX)-depth, Math.abs(v.dot(up))/(tan*fitY)-depth);
    }
    d *= 1.025;
    const eye = centre.clone().addScaledVector(normal,d).addScaledVector(up,d*tan*(top-bottom)/height);
    return {x:eye.x, y:eye.y, z:eye.z, rx, ry, lvl:H.W.lvl, seat:1};
  }
  function use(arg) {
    if (!thing || session || H.paused || !H.live || !(['walk','glide'].includes(H.mode)||H.mode==='focus'&&H.seated)) return;
    if (H.held() !== 'mobile' && thing.at.room !== H.here) return;
    if (H.held() && H.held() !== 'mobile') { say(Cast.t("{me}'s mobile"), 'Put down what you are holding first.'); return; }
    if (returning && H.gliding) return;
    if (thing.st === 'fall') return; // let a dropped phone finish landing
    if (H.held() === 'mobile' && H.mode === 'glide') { H.cancelGlide(true); if (H.mode !== 'walk') return; }
    H.saveWalkState(); // preserve the standing return pose before the close-up
    if (stopBuzz) stopBuzz();
    const s = session = {back:{...H.P,lvl:H.W.lvl,seat:H.W.seat}, saved:poseSnapshot(), held:H.held()==='mobile', position:thing.obj.position.clone(), rotation:thing.obj.rotation.clone(),
      onInspectKey:thing.onInspectKey, onInspectEnd:thing.onInspectEnd};
    usingT = 1;
    if (s.held) {
      // H.focus currently puts a grip back. The public inspector suspends that
      // exact grip without dropping/saving it. Borrow only that suspension; the
      // phone owns its camera/keys, and endInspect returns the original grip.
      if (!H.inspect('mobile')) { session = null; usingT = 0; return; }
      s.panel = H.ui.el.querySelector('.hs-inspection');
      if (s.panel) s.panel.style.display = 'none';
      thing.obj.position.copy(s.position); thing.obj.rotation.copy(s.rotation);
      thing.onInspectKey = phoneKey;
      thing.onInspectEnd = () => { if (session === s) H.unfocus(); };
      H._.setMode('walk');
    }
    H.hush();
    try {
      if (!H.focus(closePose(), {ms:650, label:'Lean back', enter:()=>mount(arg,s), exit:unmount})) unmount();
    } catch (e) { unmount(); throw e; }
  }
  function quad(key) { return () => {
    const m = phoneMatrix();
    return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z]) => {
      const p = new T.Vector3(key.x+x*key.w/2, -2.676, key.z+z*key.d/2).applyMatrix4(m);
      return [p.x,p.y,p.z];
    });
  }; }
  function connectLCD(canvas) {
    if (lcdTexture) lcdTexture.dispose();
    const texture = lcdTexture = new T.CanvasTexture(canvas);
    texture.flipY = false; texture.minFilter = texture.magFilter = T.NearestFilter; texture.generateMipmaps = false;
    lcd.material.map = texture; lcd.material.color.set('#fff'); lcd.material.needsUpdate = true;
    // The phone flushes its 96x64 pixel buffer with putImageData. Observe only
    // this context, compare the supplied bytes, and coalesce changed frames to
    // at most 20 uploads/sec. No ambient registration or world polling at idle.
    const context = canvas.getContext('2d'), original = context.putImageData;
    let previous = new Uint8ClampedArray(context.getImageData(0,0,canvas.width,canvas.height).data);
    let timer = null, last = performance.now(), active = true;
    function upload() { timer = null; if (!active) return; last = performance.now(); texture.needsUpdate = true; H.dirty(); }
    function flush(image, ...args) {
      const result = original.call(this,image,...args), data = image.data;
      let changed = data.length !== previous.length;
      if (!changed) for (let i=0; i<data.length; i++) if (data[i] !== previous[i]) { changed = true; break; }
      if (changed) {
        if (previous.length !== data.length) previous = new Uint8ClampedArray(data.length);
        previous.set(data);
        if (timer === null) timer = setTimeout(upload, Math.max(0,50-(performance.now()-last)));
      }
      return result;
    }
    context.putImageData = flush;
    stopLCD = () => {
      active = false; clearTimeout(timer);
      if (context.putImageData === flush) context.putImageData = original;
      // Keep the last LCD frame visible on the physical phone.
      texture.needsUpdate = true;
    };
  }
  function mount(arg, s) {
    const go = () => {
      if (session !== s || !H.focused) return;
      try {
        usingT = 0; setGlow(false); charge();
        win = FamilyPhone.open(arg);
        const canvas = win?.el.querySelector('.tb-lcd');
        if (!canvas) throw Error('Phone LCD unavailable');
        win.el.style.display = 'none'; // keep the original program, timers and saves alive
        connectLCD(canvas);
        surf = phoneKeys.map(key => {
          const b = document.createElement('button'); b.type='button'; b.className='hs-phone-key';
          b.setAttribute('aria-label','Phone '+keyLabel(key)); b.title=keyLabel(key);
          b.style.cssText='padding:0;border:0;background:transparent;cursor:pointer;touch-action:manipulation';
          b.addEventListener('click', () => { if (session === s && !H.paused) FamilyPhone.press(key.k); });
          return H.surface(b,quad(key),{w:80,h:60});
        });
        H.setWalkFrom(s.back); // camera focus must not turn the walking state into a seat
        Object.assign(H.P, closePose());
        H.ui.focusBar('Lean back'); H.dirty();
      } catch (e) {
        H.unfocus(); say(Cast.t("{me}'s mobile"), 'No signal. Try again in a minute.');
      }
    };
    (window.FamilyPhone ? Promise.resolve() : (window.Apps && Apps.load ? Apps.load('js/family-phone.js') : Promise.reject()))
      .then(go, () => { if (session === s) { H.unfocus(); say(Cast.t("{me}'s mobile"), 'No signal. Try again in a minute.'); } });
  }
  function unmount() {
    const s = session; session = null; usingT = 0;
    if (surf) { surf.forEach(s=>s.close()); surf = null; }
    if (stopLCD) { stopLCD(); stopLCD = null; }
    if (win) { try { win.close(); } catch (e) {} win = null; }
    if (s?.held) {
      thing.obj.position.copy(s.position); thing.obj.rotation.copy(s.rotation);
      thing.onInspectKey = s.onInspectKey; thing.onInspectEnd = s.onInspectEnd;
      H.endInspect();
    }
    if (s) {
      returning = s; H.setWalkFrom(s.back);
      H.anims.set('mobile-return', () => { if (H.gliding) return true; returning = null; return false; });
    }
    H.hush(); H.dirty();
  }
  function phoneKey(ev) {
    if (!surf || H.paused || ev.ctrlKey || ev.metaKey || ev.altKey ||
        ev.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return;
    // Typing a message/contact: every printable character is text, not w/a/s/d/c navigation.
    if (ev.key.length === 1 && !/^[0-9*#]$/.test(ev.key) && FamilyPhone.state?.()?.id === 'edit' && FamilyPhone.type?.(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    const k = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', Enter:'sel', Backspace:'c',
      c:'c', C:'c', w:'up', a:'left', s:'down', d:'right'}[ev.key] || (/^[0-9*#]$/.test(ev.key)?ev.key:null);
    if (k) { ev.preventDefault(); ev.stopImmediatePropagation(); FamilyPhone.press(k); }
  }
  addEventListener('keydown', phoneKey, true);
  // Suppress inspector dragging while its grip is suspended. Physical buttons
  // and the house's Q / Esc menu retain their ordinary event paths.
  for (const type of ['pointerdown','pointermove','wheel']) addEventListener(type, ev => {
    if (!session?.held || H.paused || ev.target?.closest?.('button,input,select,textarea,dialog')) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
  }, {capture:true, passive:false});
  addEventListener('resize', () => {
    if (!session || !H.focused) return;
    // The inspector's resize callback runs first: undo its temporary model pose.
    if (session.held) { thing.obj.position.copy(session.position); thing.obj.rotation.copy(session.rotation); }
    if (!usingT) { Object.assign(H.P,closePose()); H.dirty(); }
  });
  // a text arrives: the phone buzzes where it lies (and tells you where that is)
  let stopBuzz = null;
  function buzz(it) {
    if (!thing) make(); if (!thing) return false;
    setGlow(true);
    if (!H.live) { try { Sound.play('beep'); Desk.toast('*bzzzt*', `Your mobile's buzzing on the desk next to you. A text from ${it && it.from || 'someone'}. (Stand up to get it: the chair button, or Esc > Back to the room.)`, 7000); } catch (e) {} return true; }
    if (stopBuzz) stopBuzz();
    if (H.held() !== 'mobile' && !session?.held) {
      const t0 = performance.now(), o = thing.obj, st = thing.st, parent = o.parent;
      const base = {x:o.position.x, z:o.position.z, ry:o.rotation.y};
      const finish = () => {
        H.anims.delete('mobuzz'); stopBuzz = null;
        if (thing.st === st && o.parent === parent) { o.position.x=base.x; o.position.z=base.z; o.rotation.y=base.ry; }
        H.dirty();
      };
      stopBuzz = finish;
      H.anims.set('mobuzz', now => {
        const k = (now-t0)/1000;
        if (k>2.2 || thing.st!==st || o.parent!==parent) { finish(); return false; }
        const on = Math.floor(k/.55)%2===0;
        o.position.x=base.x+(on?Math.sin(now/9)*.25:0);
        o.position.z=base.z+(on?Math.cos(now/11)*.2:0);
        o.rotation.y=base.ry+(on?Math.sin(now/7)*.02:0); return true;
      });
    }
    for (let i = 0; i < 2; i++) { H.sfx.tone(140, 0.45, 'sawtooth', thing.at.room === H.here ? 0.06 : 0.02, i * 0.55); H.sfx.noise(0.45, thing.at.room === H.here ? 0.03 : 0.01, 300, i * 0.55); }
    toast(Cast.t("*bzzzt* {me}'s mobile"), `A text from ${esc(it && it.from || 'someone')}. The phone's ${where()}.`);
    return true;
  }
  if (window.Net) Net.on('smsNew', m => { if (H.live && thing) setTimeout(() => buzz(m.item), 200); });
  // the PC's program: a thin fallback that says where the phone is (the real thing's in the room)
  function fromPC(arg) {
    if (!thing || arg === 'snake' || (arg && typeof arg === 'object')) return false; // (a Snake link-up invite still opens the real program)
    const w = where();
    try { Desk.msgbox(Cast.t("{me}'s Mobile"), `Your mobile isn't in your pocket. It's ${w}.\n\nStand up from the PC (the chair button, or Esc > Back to the room) and press F by the phone to use it there, or pick it up and press F.`, 'info', [['Stand up', () => { if (H.canStand && H.canStand()) H.standUp(); }], ['OK']]); } catch (e) { return false; }
    return true;
  }
  function route(arg) {
    if (!thing) make();
    if (H.live && (H.mode === 'walk' || H.mode === 'glide')) { goGet(arg); return true; }
    if (H.canStand && H.canStand()) { // sat at the PC: get up and go and get it
      const once = () => { H.off('stood', once); setTimeout(() => goGet(arg), 300); };
      H.on('stood', once); H.standUp(); return true;
    }
    return false;
  }
  function goGet(arg) { // use it exactly where it is, whether held, on a table or on the floor
    if (H.held() === 'mobile') return use(arg);
    if (!thing || thing.at.room !== H.here) { say(Cast.t("{me}'s mobile"), "My mobile's " + where() + '.'); return; }
    use(arg);
  }
  H.on('stood', () => { if (glow) setTimeout(() => toast(Cast.t("{me}'s mobile"), "The phone's " + where() + ". The screen's lit up: a text."), 1200); });
  window.HouseMobile = { where, fromPC, buzz, use, route, setGlow, get thing() { return thing; }, make };
  make();
})();

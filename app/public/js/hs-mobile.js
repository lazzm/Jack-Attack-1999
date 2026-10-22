/* hs-mobile: JACK'S MOBILE, in the room. The Talkbrik T-99 (js/family-phone.js: texts, Snake, the ringtone composer) is a real
 * thing on the bedside table, on charge. Pick it up (the grab system), press F / "Use it" and it comes up to your face: the
 * phone's own screen and keys are laid over the 3D phone, so everything the program does (texts to other visitors, T9, the
 * inbox on its 1999 dates, every secret and save) works exactly as before. A text arriving buzzes the phone where it lies.
 * The PC's "Jack's Mobile" program stays as a thin fallback that says where the phone is (js/family.js asks HouseMobile). */
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
  const phoneKeys=[{k:'c',x:-1.5,z:-1.2,w:.9,d:.7},{k:'sel',x:0,z:-1.2,w:1.6,d:.8},{k:'up',x:1.5,z:-1.45,w:.9,d:.4},{k:'down',x:1.5,z:-.95,w:.9,d:.4},...Array.from({length:12},(_,i)=>({k:'123456789*0#'[i],x:-1.25+(i%3)*1.25,z:.2+Math.floor(i/3)*1.05,w:1.05,d:.8}))];

  // ================================================================ the model: a 1999 candy-bar phone, 13 x 4.8 x 2.3 cm, lying on its back
  function model() {
    const g = new T.Group(), B = K.into(g);
    const body = M({ c: '#3a3e4a', sh: 40, sp: '#555' }), dark = M({ c: '#15161a', sh: 60, sp: '#666' });
    B.rbox(0, -1.15, 0, 4.8, 2.3, 13, 0.9, body);
    B.rbox(0, -2.4, -3.6, 3.6, 0.2, 3.2, 0.3, dark); // the screen surround
    lcd = B.plane(0, -2.52, -3.6, 2.9, 2.1, M({ c: '#a8d070', e: '#2a4a12', sh: 30, side: 2 }).clone(), { rx: -90 }); // the green backlit LCD
    B.box(0, -2.36, -5.6, 3.4, 0.08, 0.5, { t: M({ c: '#fff', map: K.tex('hs.mob.brand2', 128, 20, (gg) => { gg.fillStyle = '#3a3e4a'; gg.fillRect(0, 0, 128, 20); A.text(gg, 'TALKBRIK', 64, 15, '700 13px ' + A.UIF, '#c8c8d0', 'center'); }) }), all: body });
    for (let i = 0; i < 5; i++) B.cyl(-1 + i * 0.5, -2.4, -6.2, 0.1, 0.1, 0.2, 6, dark); // the earpiece holes
    B.rbox(0, -2.45, -1.2, 1.6, 0.3, 0.8, 0.3, M({ c: '#5a7ad0', sh: 50 })); B.rbox(-1.5, -2.4, -1.2, 0.9, 0.25, 0.7, 0.2, M('#3a3a44')); B.rbox(1.5, -2.4, -1.2, 0.9, 0.25, 0.7, 0.2, M('#3a3a44')); // menu, C, up/down
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) B.rbox(-1.25 + c * 1.25, -2.45, 0.2 + r * 1.05, 1.05, 0.3, 0.8, 0.25, M({ c: '#3c3e48', sh: 30 })); // the keypad
    for(const key of phoneKeys){const label=key.k==='sel'?'—':key.k==='up'?'▲':key.k==='down'?'▼':key.k.toUpperCase(),map=K.tex('mobile.key.'+key.k,96,64,(c,w,h)=>{c.fillStyle='#3c3e48';c.fillRect(0,0,w,h);c.fillStyle='#eee6ca';c.font='bold 39px Arial';c.textAlign='center';c.fillText(label,w/2,47)});B.box(key.x,-2.62,key.z,key.w*.83,.025,key.d*.8,{t:M({c:'#fff',map}),all:body})}
    for (let i = 0; i < 4; i++) B.cyl(-0.6 + i * 0.4, -2.4, 5.6, 0.08, 0.08, 0.2, 6, dark); // the mic holes
    B.cyl(1.5, -1.5, -7.3, 0.42, 0.36, 1.8, 8, M({ c: '#111', sh: 20 }), { rx: 90 }); B.ball(1.5, -1.5, -8.2, 0.45, 0.45, 0.45, M('#111'), 6); // the stubby antenna (out of the top, lying flat with the phone)
    B.box(0, -1.1, 6.55, 1.2, 0.5, 0.2, M('#555')); // the charger socket
    B.shadow(0, 0, 0, 6.5, 15, 0.55, { sq: true });
    return g;
  }
  // the charger: a black brick in the wall socket behind the bedside table, a thin lead to the phone (drawn as part of the room)
  function charger(r) {
    const B = K.into(r.group);
    B.box(44, -12, BZ + 0.8, 8.6, 8.6, 1.2, M('#efece4')); B.box(43, -12, BZ + 1.5, 1.2, 1.6, 0.6, M('#ddd')); B.box(46, -12, BZ + 1.5, 1.2, 1.6, 0.6, M('#ddd')); // the double socket over the desk
    B.rbox(44, -12, BZ + 3.6, 4.2, 5.2, 4.2, 0.6, M({ c: '#1a1a1e', sh: 30 })); // the charger brick
    const lead = new T.CatmullRomCurve3([new T.Vector3(44, -9.6, BZ + 5), new T.Vector3(44, -2, BZ + 8), new T.Vector3(42, -0.6, BZ + 16), new T.Vector3(40, -1.1, BZ + 19.4)]);
    B.geo(new T.TubeGeometry(lead, 24, 0.22, 5), 0, 0, 0, M('#1a1a1e'));
  }

  // ================================================================ the thing (grabbable), and using it
  let thing = null, win = null, surf = null, usingT = 0, lcd = null, glow = false;
  function setGlow(on) { glow = !!on; if (!lcd) return; const m = lcd.material; m.emissive.set(on ? '#5aff6a' : '#2a4a12'); m.userData.e0 = m.emissive.clone(); H.dirty(); }
  function make() {
    const r = H.ROOMS.bedroom; if (!r || thing) return;
    charger(r);
    thing = H.thing('mobile', { home: HOME, kind: 'mobile', label: "Jack's mobile (Talkbrik T-99)", obj: model(), use: () => use(), useLabel: 'Use it', holdD: 34, faceYou: false });
    thing.obj.traverse(o => { o.userData.thing = 1; });
    H.restoreThing(thing);
    const s = H.SPOTS.mobile; if (s) s.wrapped = 1;
    H.on('rest', id => { if (id === 'mobile') charge(); });
    H.on('grab', id => { if (id === 'mobile') { psave({ charging: false }); if (!pst().seenRoom) { psave({ seenRoom: 1 }); say("Jack's mobile", 'My Talkbrik T-99. Pay as you go. &pound;' + (((pst().credit == null ? 50 : pst().credit) | 0) / 100).toFixed(2) + ' credit. Press <b>F</b> (or "Use it") to have a look at it.', 6000); } } });
    charge();
    try { const sm = JSON.parse(localStorage.getItem('jhp_family_sms') || 'null'); if (sm && sm.inbox && sm.inbox.some(x => !x.read)) setGlow(true); } catch (e) {}
  }
  const atHome = () => thing && thing.st === 'rest' && thing.at.room === 'bedroom' && Math.abs(thing.at.x - HOME.x) < 14 && Math.abs(thing.at.z - HOME.z) < 14;
  function charge() { psave({ charging: !!atHome() }); }
  const where = () => { if (!thing) return 'in your room'; if (H.held() === 'mobile') return 'in your hand'; const a = thing.at; if (atHome()) return 'on charge on the bedside table in your room'; const rn = { bedroom: 'in your room', landing: 'on the landing', hall: 'in the hall', lounge: 'in the lounge', kitchen: 'in the kitchen', cupboard: 'under the stairs', garden: 'out in the garden', drive: 'out the front' }[a.room] || 'somewhere'; return rn + (a.y < (a.room === 'bedroom' ? GY_U : 353) - 20 ? ', on something' : ', on the floor'); };
  // "Use it": the phone comes up to your face; the program's own screen and keys are laid over it
  function use(arg) {
    if (!thing || surf || usingT) return;
    usingT = 1;
    const a=thing.at,yaw=(a.ry||0)*D2R,d=Math.max(14.6/(2*Math.tan(H.camera.fov*D2R/2)*.78),5/(2*Math.tan(H.camera.fov*D2R/2)*innerWidth/innerHeight*.8));
    const pose={x:a.x+Math.sin(yaw)*d*.174,y:a.y-1.4-d*.985,z:a.z+Math.cos(yaw)*d*.174,rx:-80,ry:-(a.ry||0),lvl:H.W.lvl,seat:1};
    if(!H.focus(pose, { ms:650, label:'Lean back', enter:()=>mount(arg), exit:unmount }))usingT=0;
  }
  let lcdTexture=null,lcdTick=null;
  function quad(key){return()=>{thing.obj.updateWorldMatrix(true,false);const m=new T.Matrix4().copy(H.root.matrixWorld).invert().multiply(thing.obj.matrixWorld);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>{const p=new T.Vector3(key.x+x*key.w/2,-2.68,key.z+z*key.d/2).applyMatrix4(m);return[p.x,p.y,p.z]})}}
  function mount(arg) {
    const go = () => {
      if(!usingT||!H.focused)return;
      usingT = 0; setGlow(false);
      psave({ charging: !!atHome() });
      win = FamilyPhone.open(arg);
      if (!win || !win.el) return;
      const body = win.el.querySelector('.tb-ph'); if (!body) return;
      win.el.style.display = 'none'; // (the Win98 window stays alive behind the scenes: its timers, its screen)
      if(lcdTexture)lcdTexture.dispose();lcdTexture=new T.CanvasTexture(body.querySelector('.tb-lcd'));lcdTexture.flipY=false;lcdTexture.minFilter=T.NearestFilter;lcdTexture.magFilter=T.NearestFilter;lcdTexture.generateMipmaps=false;
      lcd.material.map=lcdTexture;lcd.material.color.set('#fff');lcd.material.needsUpdate=true;
      lcdTick=()=>{if(win?.el)win.el.style.display='none';lcdTexture.needsUpdate=true;H.dirty()};H.ambient.add(lcdTick);
      surf=[];
      for(const key of phoneKeys){const b=document.createElement('button');b.type='button';b.className='hs-phone-key';b.setAttribute('aria-label',key.k==='sel'?'Phone Menu / Select':'Phone '+key.k);b.title=key.k==='sel'?'Enter: Menu / Select':key.k.toUpperCase();b.style.cssText='padding:0;border:0;background:transparent;cursor:pointer';b.addEventListener('click',()=>FamilyPhone.press(key.k));surf.push(H.surface(b,quad(key),{w:80,h:60}))}
      H.ui.focusBar('Lean back');H.say('Talkbrik T-99','Click the physical keys · ↑ ↓ navigate · Enter select · C cancel · Backspace lean back',6500);
      H.dirty();
    };
    (window.FamilyPhone ? Promise.resolve() : (window.Apps && Apps.load ? Apps.load('js/family-phone.js') : Promise.reject())).then(go, () => { usingT = 0; say("Jack's mobile", 'No signal. Try again in a minute.'); });
  }
  function unmount() {
    usingT = 0;
    if (surf) { surf.forEach(s=>s.close()); surf = null; }
    if(lcdTick){H.ambient.delete(lcdTick);lcdTick=null;}
    if (win) { try { win.close(); } catch (e) {} win = null; }
    if (thing) thing.obj.visible = true;
    H.dirty();
  }
  addEventListener('keydown',ev=>{if(!surf||H.paused||ev.ctrlKey||ev.metaKey||ev.altKey||win?.el.contains(ev.target))return;const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'sel',c:'c',C:'c',w:'up',a:'left',s:'down',d:'right'}[ev.key]||(/^[0-9*#]$/.test(ev.key)?ev.key:null);if(k){ev.preventDefault();ev.stopImmediatePropagation();FamilyPhone.press(k)}},true);
  // a text arrives: the phone buzzes where it lies (and tells you where that is)
  let buzzing = 0;
  function buzz(it) {
    if (!thing) make(); if (!thing) return false;
    setGlow(true);
    if (!H.live) { try { Sound.play('beep'); Desk.toast('*bzzzt*', `Your mobile's buzzing on the desk next to you. A text from ${it && it.from || 'someone'}. (Stand up to get it: the chair button, or hold Esc.)`, 7000); } catch (e) {} return true; }
    const n = buzzing++ ? 0 : 1; void n;
    const t0 = performance.now(), o = thing.obj, base = { x: o.position.x, z: o.position.z, ry: o.rotation.y };
    H.anims.set('mobuzz', now => { const k = (now - t0) / 1000; if (k > 2.2 || H.held() === 'mobile') { o.position.x = base.x; o.position.z = base.z; o.rotation.y = base.ry; buzzing = 0; return false; } const on = Math.floor(k / 0.55) % 2 === 0; o.position.x = base.x + (on ? Math.sin(now / 9) * 0.25 : 0); o.position.z = base.z + (on ? Math.cos(now / 11) * 0.2 : 0); o.rotation.y = base.ry + (on ? Math.sin(now / 7) * 0.02 : 0); return true; });
    for (let i = 0; i < 2; i++) { H.sfx.tone(140, 0.45, 'sawtooth', thing.at.room === H.here ? 0.06 : 0.02, i * 0.55); H.sfx.noise(0.45, thing.at.room === H.here ? 0.03 : 0.01, 300, i * 0.55); }
    toast('*bzzzt* Jack\'s mobile', `A text from ${esc(it && it.from || 'someone')}. The phone's ${where()}.`);
    return true;
  }
  if (window.Net) Net.on('smsNew', m => { if (H.live && thing) setTimeout(() => buzz(m.item), 200); });
  // the PC's program: a thin fallback that says where the phone is (the real thing's in the room)
  function fromPC(arg) {
    if (!thing || arg === 'snake' || (arg && typeof arg === 'object')) return false; // (a Snake link-up invite still opens the real program)
    const w = where();
    try { Desk.msgbox("Jack's Mobile", `Your mobile isn't in your pocket. It's ${w}.\n\nStand up from the PC (the chair button, or hold Esc) and go and get it: pick it up and press F.`, 'info', [['Stand up', () => { if (H.canStand && H.canStand()) H.standUp(); }], ['OK']]); } catch (e) { return false; }
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
  function goGet(arg) { // walk over to it (if it's in this room) and pick it up, then it comes up to your face
    if (H.held() === 'mobile') return use(arg);
    const t = thing; if (!t || t.at.room !== H.here) { say("Jack's mobile", 'My mobile\'s ' + where() + '.'); return; }
    const v = H.viewFor(H.SPOTS.mobile, { p: { x: t.at.x, y: t.at.y - 2, z: t.at.z } });
    const grabThen = () => { if (H.grab('mobile')) setTimeout(() => use(arg), 350); };
    if (v && Math.hypot(v.x - H.P.x, v.z - H.P.z) > 8) H.glideTo(v, { done: grabThen }); else grabThen();
  }
  H.on('stood', () => { if (glow) setTimeout(() => toast("Jack's mobile", 'The screen\'s lit up on the desk: a text.'), 1200); });
  window.HouseMobile = { where, fromPC, buzz, use, route, setGlow, get thing() { return thing; }, make };
  make();
})();

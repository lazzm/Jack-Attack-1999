/* Diary guidance: only the tracked task, soft surface light and an edge compass. */
(function () {
  'use strict';
  const H = window.House, st = window.st;
  if (!H?.ok || !st || window.PCOnly?.desktopOnly) return;
  const T = H.T, marks = [], ray = new T.Raycaster(), bounds = new T.Box3();
  let mode = localStorage.getItem('jhp_story_guidance') || 'full', signature = '', nextSample = 0, sampled = null;
  let nextGlow = 0, titleUntil = 0, titleText = '', previous = 0, activeId = '', alpha = 0, x = 0, y = 0, angle = 0;
  const marker = document.createElement('div'), arrow = document.createElement('span'), label = document.createElement('span');
  const prompt = document.createElement('div'), card = document.createElement('div');
  marker.className = 'st-marker'; arrow.className = 'st-arrow'; label.className = 'st-marker-label';
  arrow.setAttribute('aria-hidden', 'true'); marker.append(arrow, label);
  // Chunky printed game-manual ink: a pale keyline, dark outline and yellow face
  // stay legible against both the night sky and magnolia walls.
  arrow.innerHTML = '<svg viewBox="0 0 40 34" aria-hidden="true"><path d="M5 11H21V4L35 17 21 30V23H5Z" fill="none" stroke="#fff8dd" stroke-width="7" stroke-linejoin="round"/><path d="M5 11H21V4L35 17 21 30V23H5Z" fill="#ffe36c" stroke="#161c24" stroke-width="3" stroke-linejoin="round"/></svg>';
  prompt.className = 'st-prompt'; card.className = 'st-chapter';
  for (const el of [marker, prompt, card]) { el.hidden = true; H.ui.el.appendChild(el); }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  // Seasonal objectives (js/season.js) use the same guidance whenever no chapter task is tracked.
  const seasonal = () => { const s = st.tracked(); return s ? s.season || null : window.Season?.current?.() || null; };
  const show = () => (st.getState() || seasonal()) && window.Net?.connected && window.AccountGate?.allowed && H.live && H.mode === 'walk' && !H.gliding && !H.paused && !H.focused && !window.RoomTV?.open_ && !H.surfaceScreen?.() && !window.HousePause?.open && !document.hidden && !loading();
  const has = (id, step) => !!window.ChoreKit?.has(id, step);
  function targets() {
    const s = st.tracked(); if (!s || s.season) return window.Season?.targets?.(s?.season) || [];

    const held = H.held(), CK = window.ChoreKit, chore = s.test?.startsWith('chore.') ? s.test.slice(6) : null;
    if (chore && CK?.done(chore)) return [];
    if(s.id==='lad'){if(window.HouseCases?.inserted('console.gb'))return ['gb'];const box=Object.values(H.THINGS).find(t=>t.kind==='console-case'&&t.gameId?.startsWith('gb.')&&!t.at.hide&&H.THINGS['media.'+t.gameId]?.snap==='media.case.'+t.gameId);if(box)return [held===box.id?'console.gb':box.id];const loose=Object.values(H.THINGS).find(t=>t.gameId?.startsWith('gb.')&&t.kind==='cart'&&!t.at.hide);return loose?[held===loose.id?'console.gb':loose.id]:['gb'];}
    if (s.id.startsWith('part.')) {
      // Whichever real component was picked up, guide it to its own desk spot.
      if (held?.startsWith('st.pc.')) return ['st.desk.' + held.slice(6)];
      if (!H.ROOMS.drive?.carBoot?.open) return ['st.boot'];
    }
    if (s.id === 'power' && !window.StoryAccess.available) return ['st.pc.tower'];
    if (chore) {
      const t = H.THINGS[held];
      if (t?.chore === chore && (chore !== 'bin' || has('bin','tie'))) {
        const snaps = Object.keys(H.SNAPS).filter(id => {
          const slot = H.SNAPS[id];
          return id.startsWith('ch.s.') && (!slot.enabled || slot.enabled()) && slot.accepts?.(t.kind, t);
        });
        if (snaps.length) return snaps;
      }
      if (chore === 'tidy') return Object.keys(H.THINGS).filter(id => id.startsWith('ch.m.') && !H.THINGS[id].at.hide && !has('tidy', id.slice(5)));
      if (chore === 'bed') return [...(!has('bed','pillow') && !window.ChoreKit?.MODS.bed?.pillowDocked?.() ? ['ch.pillow'] : []), ...(!has('bed','pjs') && has('bed','pillow') ? ['ch.pjs'] : []), ...(!has('bed','smooth') || (!has('bed','pillow') && window.ChoreKit?.MODS.bed?.pillowDocked?.()) ? ['bed'] : [])];
      if (chore === 'bin') return has('bin','bag') ? [] : ['ch.binbag'];
      if (chore === 'cat') return !has('cat','pour') ? ['ch.catbox','ch.bowl'] : !has('cat','ate') ? ['cat'] : [];
      if (chore === 'plant') return [...(!has('plant','water') ? ['ch.can'] : []), ...['leaf0','leaf1','leaf2'].filter(id => !has('plant',id)).map(id => 'ch.'+id), ...(!has('plant','turn') ? ['ch.pot'] : [])];
      if (chore === 'cushions') return Object.values(H.THINGS).filter(t => t.chore === chore && !has(chore,'p'+t.cI)).map(t => t.id);
      if (chore === 'car' && has('car','bucket')) {
        const mud = Array.from({length:10},(_,i)=>'ch.mud'+i).filter((id,i)=>!has('car','m'+i));
        return mud.length ? mud : ['ch.bucket'];
      }
      const sweeping = CK?.tool.cur?.id === 'broom', mowing = CK?.tool.cur?.id === 'mower', hoovering = CK?.tool.cur?.id === 'hoover';
      const swept = CK?.stepsOf('sweep').filter(s=>s.s.startsWith('l')).every(s=>has('sweep',s.s));
      const tools = {washup:!has('washup','fill')?['hs.sink','ch.soap']:['hs.sink'],table:[],shopping:['ch.bags'],bins:has('bins','out')?['hs.bin']:has('bins','tie')?['ch.kbag']:['hs.bin'],hoover:hoovering&&!has('hoover','plug')?['ch.socket']:['ch.hoover'],videos:[],cushions:[],car:['ch.bucket'],lawn:mowing&&!has('lawn','plug')?['ch.osocket']:['ch.mower'],sweep:swept?['ch.sack']:sweeping?[]:['ch.broom']};
      const things = Object.values(H.THINGS).filter(t => t.chore === chore && !t.at.hide && t.st !== 'snap' && (!t.canGrab || t.canGrab()));
      return [...things.map(t => t.id), ...(tools[chore] || [])];
    }
    if (s.ch === 2) return {save:['ch.list.bedroom'],order:['pc'],unbox:Object.keys(H.SPOTS).filter(id => id.startsWith('pm.parcel')),carry:['md','ps','n64','dc'].filter(id => window.PM?.owns('hardware.'+id) && H.THINGS[id]?.at.room !== 'bedroom'),connect:['telly'],play:['telly'],mate:['phone']}[s.id] || [];
    return s.targets || [];
  }
  function resolve(id) {
    const r = resolveThing(id), d = seasonal() && window.Season?.describe?.(id);
    if (r && d) { r.label = d.label; r.action = d.action; }
    return r;
  }
  function resolveThing(id) {
    const s = st.tracked(), t = H.THINGS[id], spot = H.SPOTS[id], snap = H.SNAPS[id];
    if (id.startsWith('np.')) { const c = window.HouseFamily?.chars?.[id.slice(3)]; if (!c?.rig || !c.present) return null; const n = id === 'np.mom' ? 'Mom' : id === 'np.dad' ? 'Dad' : (window.Cast ? Cast.n('sister') : 'my sister'); return {obj:c.rig.group, label:n, action:'F: talk to ' + n}; }
    if (id === 'st.boot') return {obj:H.ROOMS.drive?.carBoot?.hinge, label:'Dad’s car boot', action:s?.id === 'dad' ? 'Meet Dad at the car' : 'F: open the boot'};
    if (id === 'bed' && window.ChoreKit?.MODS.bed?.guide) return {obj:ChoreKit.MODS.bed.guide(),label:'The duvet',action:'F: make the bed'};
    if (t && !t.at.hide) return {obj:t.obj,label:typeof t.label === 'function' ? t.label() : t.label,action:id === 'st.pc.tower' && s?.id === 'power' ? 'F: press the power button' : id === 'ch.binbag' && !has('bin','tie') ? 'F: tie the bin bag' : id === 'gb' ? 'F: play the Game Lad' : t.chore === 'cushions' && has('cushions','c'+t.cI) ? 'F: plump the cushion' : ['ch.pillow','ch.pjs'].includes(id) ? 'E: carry to the bed' : id.startsWith('ch.m.') ? 'E: carry to '+({clothes:'the washing basket',rubbish:'the bin',dish:'the kitchen sink',mag:'the magazine pile',cd:'the CD rack'}[t.kind.slice(5)] || 'its place') : t.useLabel ? 'F: '+t.useLabel.toLowerCase()+' · E: carry' : 'E: carry · F: look closely'};
    if (snap) {
      const p = id==='console.gb' ? snap : snap.preview || snap.pose || snap;
      const object = {'ch.s.basket':'washing','ch.s.bin':'bin','ch.s.kbin':'hs.bin','ch.s.sink':'hs.sink','ch.s.pillow':'bed','ch.s.pjs':'bed','console.gb':'gb'}[id];
      return {point:new T.Vector3(p.x,-p.y,p.z),obj:object ? H.THINGS[object]?.obj || H.SPOTS[object]?.obj : null,label:id==='console.gb'?'Game Lad slot':(snap.hint || 'Put it here').replace(/^Let go:\s*/i,''),action:id==='console.gb'?(window.GameInput?.touch?'Aim at the gold slot. Press PUT IN.':'Aim at the gold slot. E: put the game in.'):snap.hint?.replace(/^Let go:/,'E:') || 'E: place here'};
    }
    if (spot?.obj) return {obj:spot.obj,label:typeof spot.label === 'function' ? spot.label() : spot.label,action:id.startsWith('st.lead.') ? 'F: connect the '+id.slice(8)+' lead' : 'F: use / look closely'};
    return null;
  }
  function clear() {
    for (const m of marks) for (const shell of m.shells) { shell.parent?.remove(shell); shell.material.dispose(); }
    marks.length = 0; sampled = null; activeId = ''; alpha = 0;
  }
  function rimMaterial() {
    return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
      uniforms:{strength:{value:0}},
      vertexShader:'varying vec3 n; varying vec3 eye; void main(){vec4 p=modelViewMatrix*vec4(position+normal*0.32,1.0); n=normalize(normalMatrix*normal); eye=normalize(-p.xyz); gl_Position=projectionMatrix*p;}',
      fragmentShader:'uniform float strength; varying vec3 n; varying vec3 eye; void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),1.8); gl_FragColor=vec4(0.93,0.79,0.49,strength*(0.04+rim*0.38));}'});
  }
  function rebuild(ids) {
    clear();
    for (const id of ids) {
      const target = resolve(id); if (!target || !target.obj && !target.point) continue;
      const shells = [], meshes = [];
      target.obj?.traverse(o => { if (o.isMesh && o.visible && !o.userData.noPick && !o.userData.contactShadow && !o.userData.questRim && o.geometry?.attributes.normal && [].concat(o.material || []).some(m => m.visible && (!m.transparent || m.opacity > .4))) meshes.push(o); });
      for (const mesh of meshes) {
        const shell = new T.Mesh(mesh.geometry, rimMaterial()); shell.userData.noPick = true; shell.userData.questRim = id; shell.visible = false; shell.raycast = () => {}; mesh.add(shell); shells.push(shell);
      }
      marks.push({...target,id,shells});
    }
  }
  // Each geometry's own box, recomputed only when its position data changes (was every sample, five times a second).
  const boxes = new WeakMap(), boxScratch = new T.Box3();
  function localBox(g) {
    const p = g.attributes.position; let c = boxes.get(g);
    if (!c || !p || p.isInterleavedBufferAttribute || c.version !== p.version || c.array !== p.array || c.count !== p.count || c.morph !== !!g.morphAttributes?.position) { g.computeBoundingBox(); c = { box: g.boundingBox.clone(), version: p?.version, array: p?.array, count: p?.count, morph: !!g.morphAttributes?.position }; boxes.set(g, c); }
    return c.box;
  }
  function pointOf(m) {
    if (m.point) return m.point.clone();
    // The shell shares geometry; exclude it from bounds and ignore pick volumes.
    bounds.makeEmpty(); m.obj.updateWorldMatrix(true,true);
    m.obj.traverse(o => { if (o.isMesh && !o.userData.questRim && !o.userData.contactShadow && o.visible) bounds.union(boxScratch.copy(localBox(o.geometry)).applyMatrix4(o.matrixWorld)); });
    return bounds.isEmpty() ? m.obj.getWorldPosition(new T.Vector3()) : bounds.getCenter(new T.Vector3());
  }
  function sample(now) {
    const ids = targets(), key = (st.tracked()?.key || seasonal()?.o.id) + '|' + ids.join('|');

    if (key !== signature || !marks.length && ids.length || marks.some(m => resolve(m.id)?.obj !== m.obj)) { signature = key; rebuild(ids); }
    const eye = H.camera.getWorldPosition(new T.Vector3()); let nearest = null;
    for (const m of marks) {
      const pos = pointOf(m), dist = pos.distanceTo(eye);
      // Keep a target until another is meaningfully nearer, avoiding equal-distance flicker.
      const score = dist * (sampled?.id === m.id ? .82 : 1);
      if (!nearest || score < nearest.score) nearest = {...m,pos,dist,score};
    }
    if (!nearest) { sampled = null; return; }
    // The border compass needs a direction, not an expensive house raycast.
    // Occlusion matters only for the nearby action prompt once the object is
    // on screen. Do not scan thousands of wall triangles for a distant task.
    const cam=nearest.pos.clone().applyMatrix4(H.camera.matrixWorldInverse),ndc=nearest.pos.clone().project(H.camera);
    if(nearest.dist>=170||cam.z>=0||Math.abs(ndc.x)>1||Math.abs(ndc.y)>1){nearest.blocked=true;sampled=nearest;nextSample=now+200;return;}
    ray.set(eye, nearest.pos.clone().sub(eye).normalize());
    const blockers = [...Object.values(H.ROOMS).filter(r => r.group.visible).map(r => r.group), ...Object.values(H.DOORS).map(d => d.pivot).filter(g => g?.visible)];
    nearest.blocked = ray.intersectObjects(blockers,true).some(hit => {
      if (hit.distance >= nearest.dist - 8 || hit.object.userData.contactShadow || hit.object.userData.questRim || [].concat(hit.object.material || []).every(m => !m.visible || m.transparent && m.opacity < .2)) return false;
      const carried = H.THINGS[H.held?.()]?.obj; // (what's in your hands never hides the place it goes)
      for (let o=hit.object;o;o=o.parent) { if (!o.visible || o === nearest.obj || o === carried) return false; }
      return true;
    });
    sampled = nearest; nextSample = now + 200;
  }
  // (media queries made once; the speech check is DOM work, so at most ten times a second: this runs every frame)
  const coarseMQ=matchMedia('(pointer:coarse)'), reduceMQ=matchMedia('(prefers-reduced-motion: reduce)');
  let speechAt=0, speechNow=false, viewW=window.innerWidth||0, viewH=window.innerHeight||0;
  window.addEventListener?.('resize',()=>{viewW=window.innerWidth;viewH=window.innerHeight;});
  // (re-checked only after the DOM changed a class, hidden flag or element; viewW is cached: innerWidth forces layout)
  let speechDirty=true,loadingDirty=true,loadingNow=false;
  function speaking(now){if((speechDirty||!watched)&&(now-speechAt>=100||now<speechAt)){speechDirty=false;speechAt=now;speechNow=!!document.querySelector('.hs-note.on,.hs-voice.on,.hs-call.on,.np-bub:not(.np-out),.ht-coach:not(.bye)') || ((watched?viewW:window.innerWidth)<=900 || coarseMQ.matches) && !!document.querySelector('.ch-chip:not([hidden])');}return speechNow;}
  function loading(){if(loadingDirty||!watched){loadingDirty=false;loadingNow=!!document.querySelector('.hs-loading,#houseEntry');}return loadingNow;}
  // Reserve the whole printed tag and the rotating arrow, not the arrow's
  // 40 x 34 parent. DOM measurements are made when the HUD changes, never on every frame.
  const inkSelector='.hs-top,.hs-map,.hs-tin,.ch-jobs,.rm-coin,.rm-tinbtn,.rm-counter,.rm-found,.rm-hunt,.hs-toast.on,.ht-coach-card,.hs-hold:not([hidden]),.hs-tip.on,.hs-note.on,.hs-voice.on,.hs-call.on,.ht-target.on,.st-objective:not([hidden]),.se-objective:not([hidden]),.ch-chip:not([hidden]),.np-bub:not(.np-out),.ht-acts .ht-b,.ht-top .ht-b,.ht-stick,.ht-look,.st-chapter:not([hidden])';
  // Without a MutationObserver (old browsers, the unit tests) everything is re-checked as before.
  const watched=typeof MutationObserver!=='undefined';
  // HUD measurement is made on change, never on every frame (2.92 perf pass, docs/PERF-AUDIT-2026-11-11.md): the rects
  // of other ink, the safe area and the label size are cached. Whenever the HUD restacks (an element appears, hides or
  // changes class; a style or CSS variable moves the objective or a notice; a slide-in transition ends; the viewport
  // resizes; the label text changes) they are re-measured in the same frame, before the marker is placed and before
  // that frame paints, so the marker is never drawn over HUD ink, not even for one frame. A style change on ink that
  // is already known re-reads only its rects (no selector query, no computed styles).
  let inkAt=0,ink=[],inkEls=[],bubEls=[],tagSize={w:180,h:46},safe={top:0,right:0,bottom:0,left:0},inkDirty=true,inkMoved=false,labelDirty=true,inkReady=false,inkRoots=[H.ui.el],measures=0,moves=0;
  // An element mid-way through a transform transition (a notice sliding in) also reserves its resting layout box.
  function rectsOf(e,out){
    const r=e.getBoundingClientRect();if(r.width&&r.height)out.push(r);
    if(e.offsetParent&&e.getAnimations?.().some(a=>a.transitionProperty==='transform')){const p=e.offsetParent.getBoundingClientRect(),l=p.left+e.offsetLeft,t=p.top+e.offsetTop;if(e.offsetWidth&&e.offsetHeight)out.push({left:l,top:t,right:l+e.offsetWidth,bottom:t+e.offsetHeight});}
  }
  function readRects(h){
    ink=[];for(const e of inkEls)rectsOf(e,ink);
    // A speech bubble's tail points at the speaker's face: keep that clear too.
    for(const e of bubEls){const r=e.getBoundingClientRect();if(r.width&&r.height)ink.push({left:r.left,right:r.right,top:r.bottom,bottom:Math.min(h,r.bottom+h*.28)});}
  }
  function measureLabel(){const lr=label.getBoundingClientRect();if(lr.width&&lr.height)tagSize={w:lr.width,h:lr.height};labelDirty=false;}
  function measureInk(h=viewH,now=performance.now()){
    inkDirty=inkMoved=false;inkAt=now+100;measures++;
    measureLabel();
    const css=getComputedStyle(H.ui.el),number=k=>parseFloat(css.getPropertyValue('--hud-safe-'+k))||0;
    safe={top:number('top'),right:number('right'),bottom:number('bottom'),left:number('left')};
    const roots=new Set([H.ui.el]),found=[];
    for(const e of document.querySelectorAll(inkSelector)){roots.add(e.closest?.('.hs-ui,.ht-hud')||e.parentElement||e);const c=getComputedStyle(e);if(c.display!=='none'&&c.visibility!=='hidden'&&(+c.opacity>0||e.getAnimations?.().length))found.push(e)} // (fading in counts from its first frame)
    inkRoots=[...roots];inkEls=found;bubEls=[...document.querySelectorAll('.np-bub:not(.np-out)')];
    readRects(h);
    inkReady=true;
  }
  // (only what the frame needs: a full measure after a structural change, the known rects after a move, the label after new text)
  function freshInk(h,now){
    if(!watched){if(now>=inkAt)measureInk(h,now);return;} // (no observer: sample at most ten times a second, as 2.91 did)
    if(inkDirty)measureInk(h,now);else if(inkMoved){inkMoved=false;moves++;readRects(h);}
    if(labelDirty)measureLabel();
  }
  function guidePosition(tx,ty,w,h,now){
    freshInk(h,now);
    if(!inkReady)return null;
    // All four borders are candidates. A name tab always faces into the view.
    // Include an eight-pixel breathing space around other ink and keep the
    // arrow's diagonal corners inside the safe area at every rotation.
    let best=null;
    for(const side of ['left','right']){
      const l=side==='left'?-27:-24-tagSize.w,r=side==='left'?24+tagSize.w:27,t=-27,b=Math.max(27,tagSize.h-17);
      const x0=safe.left+6-l,x1=w-safe.right-6-r,y0=safe.top+6-t,y1=h-safe.bottom-6-b;
      if(x1<x0||y1<y0)continue;
      const xs=[clamp(tx,x0,x1),x0,x1],ys=[clamp(ty,y0,y1),y0,y1];
      for(const o of ink){xs.push(clamp(o.left-8-r,x0,x1),clamp(o.right+8-l,x0,x1));ys.push(clamp(o.top-8-b,y0,y1),clamp(o.bottom+8-t,y0,y1));}
      const tryAt=(cx,cy)=>{
        const box={left:cx+l,right:cx+r,top:cy+t,bottom:cy+b};
        if(ink.some(o=>box.left<o.right+8&&box.right>o.left-8&&box.top<o.bottom+8&&box.bottom>o.top-8))return;
        const score=(cx-tx)**2+(cy-ty)**2+(side===(tx>w/2?'right':'left')?0:1600);
        if(!best||score<best.score)best={x:cx,y:cy,side,score};
      };
      for(const cy of ys){tryAt(x0,cy);tryAt(x1,cy);}
      for(const cx of xs){tryAt(cx,y0);tryAt(cx,y1);}
    }
    return best;
  }
  // Writes only what changed: no hide-then-show, no same-text replacement, and the marker moves by transform alone.
  const setHidden=(el,v)=>{if(el.hidden!==v)el.hidden=v;}, setText=(el,t)=>{if(el.textContent!==t)el.textContent=t;};
  const setData=(el,k,v)=>{if(el.dataset[k]!==v)el.dataset[k]=v;}, setStyle=(el,k,v)=>{if(el.style[k]!==v)el.style[k]=v;};
  // The HUD can restack after this frame's tick (a later animation-frame callback, a resize observer). While the
  // marker is up, such a change re-places it at once, still before the frame paints; the flag ends after the paint.
  let edge=null,framePhase=false;const endFrame=()=>{framePhase=false;};
  function replace(){
    if(!edge||marker.hidden)return;
    const p=guidePosition(edge.tx,edge.ty,edge.w,edge.h,performance.now());
    if(!p){setHidden(marker,true);return;}
    x=p.x;y=p.y;setData(marker,'side',p.side);setStyle(marker,'transform','translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-50%)');
  }
  function tick(now) {
    const dt=Math.min(.05,(now-(previous||now))/1000); previous=now;
    const visible=show() && mode!=='off', speech=visible&&speaking(now);
    if (!visible) {
      setHidden(marker,true);setHidden(prompt,true);setHidden(card,true);
      let dirty=false; for(const m of marks)for(const shell of m.shells){dirty ||= shell.visible;shell.visible=false;}
      if(dirty)H.dirty();nextSample=0;alpha=0;return;
    }
    if(now>=nextSample)sample(now);
    const full=mode==='full', pulse=reduceMQ.matches? .75 : .72+Math.sin(now*.0022)*.18;
    for(const m of marks)for(const shell of m.shells){shell.visible=full;shell.material.uniforms.strength.value=pulse;}
    let markerOn=false,promptOn=false;edge=null;
    const chapterInk = titleUntil === -1 || titleUntil > Date.now();
    if(sampled && full && !chapterInk) {
      const {pos,dist}=sampled, cam=pos.clone().applyMatrix4(H.camera.matrixWorldInverse), ndc=pos.clone().project(H.camera), behind=cam.z>=0;
      const w=viewW,h=viewH; // (cached on resize: reading any viewport size here forced a style/layout flush every frame)
      const marginX=25,top=25,bottom=25;
      let tx=(ndc.x+1)*w/2,ty=(1-ndc.y)*h/2;
      const off=behind||Math.abs(ndc.x)>1||Math.abs(ndc.y)>1;
      // Only the border gets an arrow. Seeing the target removes the compass,
      // and an intervening wall never gets a floating label of its own.
      if(!off){activeId='';if(!sampled.blocked&&dist<170&&!H.held()&&!window.GameInput?.touch){promptOn=true;setText(prompt,sampled.action);}}else{
      // Behind you means turn round, rather than look through the floor at a
      // low shelf. Choose a consistent right turn when exactly back-to-back.
      const dx=behind?(Math.abs(cam.x)<.001?1:cam.x):cam.x,dy=behind?0:-cam.y;
      const targetAngle=Math.atan2(dy,dx);
      if(off){
        const vx=Math.cos(targetAngle),vy=Math.sin(targetAngle),cx=w/2,cy=h/2;
        const k=Math.min((w/2-marginX)/Math.max(.001,Math.abs(vx)),(vy<0?cy-top:h-bottom-cy)/Math.max(.001,Math.abs(vy)));
        tx=cx+vx*k;ty=cy+vy*k;
      }
      tx=clamp(tx,marginX,w-marginX);ty=clamp(ty,top,h-bottom);
      setData(marker,'state','edge');
      const text=sampled.label+' · '+Math.max(1,Math.round(dist/100))+'m';if(label.textContent!==text){label.textContent=text;labelDirty=true;}
      // A hidden marker measures 0 x 0: unhide it before anything is read (same task, so nothing paints in between).
      if(labelDirty||inkDirty||inkMoved||!inkReady)setHidden(marker,false);
      edge={tx,ty,w,h};
      // No free border space (a full-width notice, say): wait rather than cover ink.
      const placement=guidePosition(tx,ty,w,h,now);
      if(placement){
      tx=placement.x;ty=placement.y;setData(marker,'side',placement.side);
      if(activeId!==sampled.id){activeId=sampled.id;x=tx;y=ty;angle=targetAngle;alpha=0;}
      const ease=1-Math.exp(-dt*12);
      // Position is pinned immediately: interpolating between edges would send
      // the arrow across the middle of the screen during a quick turn.
      x=tx;y=ty;angle+=Math.atan2(Math.sin(targetAngle-angle),Math.cos(targetAngle-angle))*ease;
      alpha+=(1-alpha)*(1-Math.exp(-dt*12));
      markerOn=true;
      setStyle(marker,'transform','translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-50%)');setStyle(marker,'opacity',alpha.toFixed(3));
      setData(marker,'border','side');
      setStyle(arrow,'transform','rotate('+angle.toFixed(4)+'rad)');
      }}
    }
    setHidden(marker,!markerOn);setHidden(prompt,!promptOn);if(!markerOn)edge=null;
    if(edge&&!framePhase){framePhase=true;setTimeout(endFrame,0);}
    if(titleUntil===-1)titleUntil=Date.now()+5000;
    setHidden(card,speech||titleUntil<Date.now()); if(!card.hidden)setText(card,titleText);
    if(full && now>=nextGlow && marks.some(m=>m.shells.length)){nextGlow=now+100;H.dirty();}
  }
  marker.style.left=marker.style.top='0px'; // (moved by transform only)
  const own=n=>marker.contains(n)||prompt.contains(n)||card.contains(n);
  // DOM changes, the whole document including <html> (its classes and CSS variables hide and restack the HUD):
  // anything added or removed, and class/hidden changes on the page or inside the HUD roots, mean a full measure; a
  // style change on known ink (a notice or the objective moving, a bubble following a face) re-reads just its rects;
  // other style changes (the stick's knob, the 3D canvas) are not ink and cost nothing.
  const docEl=document.documentElement,page=t=>t===docEl||t===document.body||t===H.ui.el;
  if(watched)new MutationObserver(records=>{
    for(const r of records){
      const t=r.target;if(own(t))continue;
      if(r.type==='childList'){inkDirty=speechDirty=loadingDirty=true;continue;}
      if(r.attributeName!=='style'){speechDirty=true;if(page(t))loadingDirty=true;if(page(t)||inkRoots.some(root=>root.contains(t)))inkDirty=true;}
      else if(page(t)||t.matches?.(inkSelector)&&!inkEls.includes(t))inkDirty=true;
      else if(inkEls.some(e=>e===t||t.contains(e)))inkMoved=true;
    }
    if(framePhase&&(inkDirty||inkMoved))replace();
  }).observe(docEl,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
  // A notice that slides or fades in has no mutation at its end: re-measure then (its rest box is reserved meanwhile).
  if(watched)for(const n of ['transitionend','animationend'])document.addEventListener(n,e=>{const t=e.target;if(!t?.matches||own(t))return;if(inkEls.includes(t))inkMoved=true;else if(t.matches(inkSelector))inkDirty=true;else return;if(framePhase)replace();},true);
  window.addEventListener?.('resize',()=>{inkDirty=true;});
  // The label's size is read when its text changes; this observer (run after layout, before paint) is the backstop:
  // a size that still differs re-places the marker in the same frame. (A hidden label reports 0 x 0: keep the last.)
  if(window.ResizeObserver)new ResizeObserver(entries=>{for(const e of entries){const b=e.borderBoxSize?.[0],w=b?b.inlineSize:e.contentRect.width,h=b?b.blockSize:e.contentRect.height;if(w&&h&&(Math.abs(w-tagSize.w)>.5||Math.abs(h-tagSize.h)>.5)){tagSize={w,h};replace();}}}).observe(label);
  window.StoryGuide={get strength(){return mode;},setting(value){if(['full','light','off'].includes(value)){mode=value;localStorage.setItem('jhp_story_guidance',mode);nextSample=0;}tick(performance.now());return mode;},chapter(n,title){titleUntil=-1;titleText='CHAPTER '+n+' — '+title;},targets,get stats(){return {measures,moves};}};
  // Screen ink follows the latest camera every frame; idle rim lighting only
  // requests ten room redraws per second and never redraws behind a screen.
  let lastFrame=0;
  function frame(now){requestAnimationFrame(frame);lastFrame=now;tick(now);}
  requestAnimationFrame(frame);
  H.on('mode',()=>tick(performance.now()));
  st.onChange(()=>{signature='';nextSample=0;tick(performance.now());});
})();

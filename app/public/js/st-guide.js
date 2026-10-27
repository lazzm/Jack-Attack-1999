/* Diary guidance: only the tracked task, soft surface light and a quiet compass. */
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
  prompt.className = 'st-prompt'; card.className = 'st-chapter';
  for (const el of [marker, prompt, card]) { el.hidden = true; H.ui.el.appendChild(el); }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  // Seasonal objectives (js/season.js) use the same guidance whenever no chapter task is tracked.
  const seasonal = () => { const s = st.tracked(); return s ? s.season || null : window.Season?.current?.() || null; };
  const show = () => (st.getState() || seasonal()) && window.Net?.connected && window.AccountGate?.allowed && H.live && H.mode === 'walk' && !H.gliding && !H.paused && !H.focused && !window.RoomTV?.open_ && !H.surfaceScreen?.() && !window.HousePause?.open && !document.hidden && !document.querySelector('.hs-loading,#houseEntry');
  const has = (id, step) => !!window.ChoreKit?.has(id, step);
  function targets() {
    const s = st.tracked(); if (!s || s.season) return window.Season?.targets?.(s?.season) || [];

    const held = H.held(), CK = window.ChoreKit, chore = s.test?.startsWith('chore.') ? s.test.slice(6) : null;
    if (chore && CK?.done(chore)) return [];
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
      if (chore === 'bed') return [...(!has('bed','pillow') ? ['ch.pillow'] : []), ...(!has('bed','pjs') ? ['ch.pjs'] : []), ...(!has('bed','smooth') ? ['bed'] : [])];
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
    if (id === 'bed' && window.ChoreKit?.MODS.bed?.guide) return {obj:ChoreKit.MODS.bed.guide(),label:'The duvet',action:'F: straighten the duvet'};
    if (t && !t.at.hide) return {obj:t.obj,label:typeof t.label === 'function' ? t.label() : t.label,action:id === 'st.pc.tower' && s?.id === 'power' ? 'F: press the power button' : id === 'ch.binbag' && !has('bin','tie') ? 'F: tie the bin bag' : id === 'gb' ? 'F: play the Game Lad' : t.chore === 'cushions' && has('cushions','c'+t.cI) ? 'F: plump the cushion' : ['ch.pillow','ch.pjs'].includes(id) ? 'E: carry to the bed' : id.startsWith('ch.m.') ? 'E: carry to '+({clothes:'the washing basket',rubbish:'the bin',dish:'the kitchen sink',mag:'the magazine pile',cd:'the CD rack'}[t.kind.slice(5)] || 'its place') : t.useLabel ? 'F: '+t.useLabel.toLowerCase()+' · E: carry' : 'E: carry · F: look closely'};
    if (snap) {
      const p = snap.preview || snap.pose || snap;
      const object = {'ch.s.basket':'washing','ch.s.bin':'bin','ch.s.kbin':'hs.bin','ch.s.sink':'hs.sink','ch.s.pillow':'bed','ch.s.pjs':'bed'}[id];
      return {point:new T.Vector3(p.x,-p.y,p.z),obj:object ? H.THINGS[object]?.obj || H.SPOTS[object]?.obj : null,label:(snap.hint || 'Put it here').replace(/^Let go:\s*/i,''),action:snap.hint?.replace(/^Let go:/,'E:') || 'E: place here'};
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
  function pointOf(m) {
    if (m.point) return m.point.clone();
    // The shell shares geometry; exclude it from bounds and ignore pick volumes.
    bounds.makeEmpty(); m.obj.updateWorldMatrix(true,true);
    m.obj.traverse(o => { if (o.isMesh && !o.userData.questRim && !o.userData.contactShadow && o.visible) { o.geometry.computeBoundingBox(); bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
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
    ray.set(eye, nearest.pos.clone().sub(eye).normalize());
    const blockers = [...Object.values(H.ROOMS).filter(r => r.group.visible).map(r => r.group), ...Object.values(H.DOORS).map(d => d.pivot).filter(g => g?.visible)];
    nearest.blocked = ray.intersectObjects(blockers,true).some(hit => {
      if (hit.distance >= nearest.dist - 8 || hit.object.userData.contactShadow || hit.object.userData.questRim || [].concat(hit.object.material || []).every(m => !m.visible || m.transparent && m.opacity < .2)) return false;
      for (let o=hit.object;o;o=o.parent) { if (!o.visible || o === nearest.obj) return false; }
      return true;
    });
    sampled = nearest; nextSample = now + 200;
  }
  function keepClear(px, py, w, h) {
    // Keep ink away from the reticle and from the header, speech and carry controls.
    const dx=px-w/2, dy=py-h/2, ex=Math.min(180,w*.22), ey=Math.min(110,h*.15);
    if (Math.abs(dx)<ex && Math.abs(dy)<ey) {
      if (Math.abs(dx)/ex > Math.abs(dy)/ey) px=w/2+(dx<0?-ex:ex); else py=h/2+(dy<0?-ey:ey);
    }
    return [px,py];
  }
  // (media queries made once; the speech check is DOM work, so at most ten times a second: this runs every frame)
  const coarseMQ=matchMedia('(pointer:coarse)'), reduceMQ=matchMedia('(prefers-reduced-motion: reduce)');
  let speechAt=0, speechNow=false, viewW=window.innerWidth||0, viewH=window.innerHeight||0;
  window.addEventListener?.('resize',()=>{viewW=window.innerWidth;viewH=window.innerHeight;});
  function speaking(now){if(now-speechAt>=100||now<speechAt){speechAt=now;speechNow=!!document.querySelector('.hs-note.on,.hs-voice.on,.hs-call.on') || (window.innerWidth<=900 || coarseMQ.matches) && !!document.querySelector('.ch-chip:not([hidden])');}return speechNow;}
  function tick(now) {
    const dt=Math.min(.05,(now-(previous||now))/1000); previous=now;
    const visible=show() && mode!=='off', speech=visible&&speaking(now);
    if (!visible) {
      marker.hidden=prompt.hidden=card.hidden=true;
      let dirty=false; for(const m of marks)for(const shell of m.shells){dirty ||= shell.visible;shell.visible=false;}
      if(dirty)H.dirty();nextSample=0;alpha=0;return;
    }
    if(now>=nextSample)sample(now);
    const full=mode==='full', pulse=reduceMQ.matches? .75 : .72+Math.sin(now*.0022)*.18;
    for(const m of marks)for(const shell of m.shells){shell.visible=full;shell.material.uniforms.strength.value=pulse;}
    marker.hidden=prompt.hidden=true;
    const chapterInk = titleUntil === -1 || titleUntil > Date.now();
    if(sampled && full && !speech && !chapterInk) {
      const {pos,dist}=sampled, cam=pos.clone().applyMatrix4(H.camera.matrixWorldInverse), ndc=pos.clone().project(H.camera), behind=cam.z>=0;
      const w=viewW,h=viewH; // (cached on resize: reading any viewport size here forced a style/layout flush every frame)
      const marginX=w<600?78:128, top=h<500?128:w<=900?192:142,bottom=window.GameInput?.touch&&h>=500?285:h<500?108:175; // (touch: clear of the thumb controls)
      let tx=(ndc.x+1)*w/2,ty=(1-ndc.y)*h/2;
      const off=behind||tx<marginX||tx>w-marginX||ty<top||ty>h-bottom;
      const dx=cam.x,dy=-cam.y;
      let targetAngle=Math.atan2(dy,Math.abs(dx)<.001&&behind?1:dx);
      if(off){
        const vx=Math.cos(targetAngle),vy=Math.sin(targetAngle),cx=w/2,cy=h/2;
        const k=Math.min((w/2-marginX)/Math.max(.001,Math.abs(vx)),(vy<0?cy-top:h-bottom-cy)/Math.max(.001,Math.abs(vy)));
        tx=cx+vx*k;ty=cy+vy*k;
      }
      [tx,ty]=keepClear(clamp(tx,marginX,w-marginX),clamp(ty,top,h-bottom),w,h);
      if(activeId!==sampled.id){activeId=sampled.id;x=tx;y=ty;angle=targetAngle;alpha=0;}
      const ease=1-Math.exp(-dt*12);
      x+=(tx-x)*ease;y+=(ty-y)*ease;angle+=Math.atan2(Math.sin(targetAngle-angle),Math.cos(targetAngle-angle))*ease;
      [x,y]=keepClear(x,y,w,h);
      alpha+=(clamp(.64+dist/1800,.64,.94)-alpha)*(1-Math.exp(-dt*7));
      marker.hidden=false;marker.dataset.state=off?'edge':sampled.blocked?'occluded':'target';
      marker.style.left=x+'px';marker.style.top=y+'px';marker.style.opacity=alpha.toFixed(3);
      marker.style.setProperty('--quest-scale',String(clamp(1.05-dist/2400,.82,1)));
      arrow.style.transform='rotate('+angle+'rad)';label.textContent=sampled.label;
      if(!off&&!behind&&!sampled.blocked&&dist<170){prompt.hidden=false;prompt.textContent=sampled.action;}
    }
    if(titleUntil===-1)titleUntil=Date.now()+5000;
    card.hidden=speech||titleUntil<Date.now(); if(!card.hidden)card.textContent=titleText;
    if(full && now>=nextGlow && marks.some(m=>m.shells.length)){nextGlow=now+100;H.dirty();}
  }
  window.StoryGuide={get strength(){return mode;},setting(value){if(['full','light','off'].includes(value)){mode=value;localStorage.setItem('jhp_story_guidance',mode);nextSample=0;}tick(performance.now());return mode;},chapter(n,title){titleUntil=-1;titleText='CHAPTER '+n+' — '+title;},targets};
  // Screen ink follows the latest camera every frame; idle rim lighting only
  // requests ten room redraws per second and never redraws behind a screen.
  // (phones and Potato draw the house at 30 Hz: the ink follows at the same rate)
  let lastFrame=0;
  function frame(now){requestAnimationFrame(frame);if(H.Q?.tier==='potato'&&now-lastFrame<30&&now>=lastFrame)return;lastFrame=now;tick(now);}
  requestAnimationFrame(frame);
  H.on('mode',()=>tick(performance.now()));
  st.onChange(()=>{signature='';nextSample=0;tick(performance.now());});
})();

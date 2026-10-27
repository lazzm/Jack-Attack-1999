/* Quiet game guidance. No screen-space furniture over a screen or close-up. */
(function () {
  'use strict';
  const H=window.House, st=window.st;
  if(!H?.ok||!st||window.PCOnly?.desktopOnly)return;
  const T=H.T, marks=[], ray=new T.Raycaster();
  let mode=localStorage.getItem('jhp_story_guidance')||'full', last='', titleUntil=0, titleText='';
  const marker=document.createElement('div'),prompt=document.createElement('div'),card=document.createElement('div');
  marker.className='st-marker';prompt.className='st-prompt';card.className='st-chapter';
  for(const el of [marker,prompt,card]){el.hidden=true;el.setAttribute('aria-live','polite');H.ui.el.appendChild(el);}
  const show=()=>st.getState()&&!st.getState().flags.veteran&&window.AccountGate?.allowed&&H.live&&H.mode==='walk'&&!H.gliding&&!H.paused&&!H.focused&&!window.HousePause?.open&&!document.querySelector('.hs-loading,#houseEntry');
  function clear(){for(const m of marks){H.scene.remove(m.box);m.box.geometry.dispose();m.box.material.dispose();}marks.length=0;}
  function targets(){
    const s=st.current();if(!s)return[];
    const held=H.held();
    if(s.id.startsWith('part.')) {
      const part=s.id.slice(5);
      if(held==='st.pc.'+part)return['st.desk.'+part];
      if(!H.ROOMS.drive?.carBoot?.open)return['st.boot'];
    }
    if(s.id==='power'&&!window.StoryAccess.available)return['st.pc.tower'];
    if(s.id==='tidy'){
      if(held?.startsWith('ch.m.')){const t=H.THINGS[held];return Object.keys(H.SNAPS).filter(id=>id.startsWith('ch.s.')&&H.SNAPS[id].accepts?.(t.kind,t));}
      const mess=Object.keys(H.THINGS).filter(id=>id.startsWith('ch.m.')&&!H.THINGS[id].at.hide&&H.THINGS[id].st!=='snap');
      if(mess.length)return mess;
    }
    if(s.id==='bed'&&held)return held==='ch.pillow'?['ch.s.pillow']:held==='ch.pjs'?['ch.s.pjs']:s.targets;
    if(s.id==='bin'&&held==='ch.binbag')return['ch.s.kbin'];
    if(s.ch===2){return {save:['ch.list.bedroom'],order:['pc'],unbox:Object.keys(H.SPOTS).filter(id=>id.startsWith('pm.parcel')),carry:['md','ps','n64','dc'],connect:['telly'],play:['telly'],mate:['phone']}[s.id]||[];}
    return s.targets||[];
  }
  function resolve(id){
    if(id.startsWith('np.')){const c=window.HouseFamily?.chars?.[id.slice(3)];if(!c?.rig)return null;const n=id==='np.mom'?'Mom':id==='np.dad'?'Dad':(window.Cast?Cast.n('sister'):'my sister');return{obj:c.rig.group,label:n,action:'F: talk to '+n};}
    if(id==='st.boot')return{obj:H.SPOTS['st.boot']?.obj,label:'the car boot',action:st.current()?.id==='dad'?'Meet Dad at the car':'F: open / close the boot'};
    const t=H.THINGS[id],spot=H.SPOTS[id],snap=H.SNAPS[id];
    if(t)return{obj:t.obj,label:typeof t.label==='function'?t.label():t.label,action:id==='st.pc.tower'&&st.current()?.id==='power'?'F: press the power button':id.startsWith('st.pc.')?'E: pick up the '+t.label:id==='gb'?'F: play the Game Lad':'F: use · E: carry'};
    if(spot?.obj)return{obj:spot.obj,label:typeof spot.label==='function'?spot.label():spot.label,action:id.startsWith('st.lead.')?'F: plug in the '+id.slice(8)+' lead':'F: use / look closely'};
    if(snap)return{point:new T.Vector3(snap.x,-snap.y,snap.z),label:snap.hint||'Put it here',action:snap.hint||'E: place here',snap};
    return null;
  }
  function rebuild(ids){
    clear();for(const id of ids){const target=resolve(id);if(!target)continue;
      let box;
      if(target.obj){box=new T.BoxHelper(target.obj,0xcbb46d);}
      else{const size=target.snap.box||[24,2,24],b=new T.Box3().setFromCenterAndSize(target.point,new T.Vector3(...size));box=new T.Box3Helper(b,0xcbb46d);}
      box.material.transparent=true;box.material.opacity=.5;box.material.depthWrite=false;box.userData.noPick=true;H.scene.add(box);marks.push({...target,box,id});
    }
  }
  function tick(){
    const visible=show()&&mode!=='off';
    const wasLit=marks.some(m=>m.box.visible);
    marker.hidden=prompt.hidden=card.hidden=true;
    for(const m of marks)m.box.visible=false;
    if(!visible){if(wasLit)H.dirty();return;}
    const ids=targets(),key=st.current()?.id+'|'+ids.join('|');if(key!==last){last=key;rebuild(ids);}
    // Late-built room objects replace initially unresolved targets.
    if(!marks.length&&ids.length)rebuild(ids);
    const light=mode==='light'||st.getState().ch>1;
    const eye=new T.Vector3().setFromMatrixPosition(H.camera.matrixWorld);
    let nearest=null;
    for(const m of marks){
      if(m.obj){m.obj.updateWorldMatrix(true,true);m.box.update?.();}
      m.box.visible=!light;m.box.material.opacity=.32+Math.sin(performance.now()*.003)*.13;
      const pos=m.point?.clone()||new T.Box3().setFromObject(m.obj).getCenter(new T.Vector3());
      const dist=pos.distanceTo(eye);
      if(!nearest||dist<nearest.dist)nearest={...m,pos,dist};
    }
    if(!nearest){H.dirty();return;}
    const {pos,dist}=nearest,ndc=pos.clone().project(H.camera),cam=pos.clone().applyMatrix4(H.camera.matrixWorldInverse),behind=cam.z>0;
    ray.set(eye,pos.clone().sub(eye).normalize());
    const blockers=[...Object.values(H.ROOMS).filter(r=>r.group.visible).map(r=>r.group),...Object.values(H.DOORS).map(d=>d.pivot).filter(g=>g?.visible)];
    const obstruction=ray.intersectObjects(blockers,true).find(hit=>{
      if(hit.distance>=dist-12||!hit.object.visible||hit.object.userData.contactShadow)return false;
      if([].concat(hit.object.material||[]).every(m=>m.transparent&&m.opacity<.1))return false;
      for(let o=hit.object;o;o=o.parent)if(o===nearest.obj)return false;
      return true;
    });
    if(!light&&(behind||Math.abs(ndc.x)>.86||Math.abs(ndc.y)>.75||dist>200||obstruction)){
      marker.hidden=false;
      let x=behind?-ndc.x:ndc.x,y=behind?-ndc.y:ndc.y;
      if(behind&&Math.abs(x)<.01)x=1;
      const edge=behind||Math.abs(x)>.86||Math.abs(y)>.75;
      if(edge){const scale=Math.max(Math.abs(x)/.86,Math.abs(y)/.69,1);x/=scale;y/=scale;}
      // A centre exclusion zone keeps even occluded targets clear of the reticle.
      if(Math.abs(x)<.34&&Math.abs(y)<.32)y=.42;
      marker.style.left=((x+1)*50)+'%';marker.style.top=((1-y)*50)+'%';
      marker.textContent=(edge?(x<-.3?'◀ ':x>.3?'▶ ':y>0?'▲ ':'▼ '):'◆ ')+nearest.label;
      marker.dataset.state=behind?'behind':obstruction?'occluded':edge?'edge':'far';
    }
    if(dist<180&&!behind&&!obstruction){prompt.hidden=false;prompt.textContent=nearest.action;}
    if(titleUntil===-1)titleUntil=Date.now()+6500;
    if(titleUntil>Date.now()){card.hidden=false;card.textContent=titleText;}
    // Carry controls appear once per account profile and never in the middle.
    if(H.held()&&!localStorage.getItem('jhp_story_carry_hint')){
      localStorage.setItem('jhp_story_carry_hint','1');
      st.say('st.controls.carry','Carrying things','E picks up / places. R turns. F uses. Q returns it safely.');
    }
    H.dirty();
  }
  window.StoryGuide={get strength(){return mode;},setting(value){if(['full','light','off'].includes(value)){mode=value;localStorage.setItem('jhp_story_guidance',mode);}tick();return mode;},chapter(n,title){titleUntil=-1;titleText='CHAPTER '+n+' — '+title;},targets};
  setInterval(tick,120);
})();

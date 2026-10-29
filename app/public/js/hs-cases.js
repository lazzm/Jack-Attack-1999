/* Physical cases: persist the resolved pair, then animate its presentation.
 * Existing thing IDs and snap records remain the save format. */
(function () {
  'use strict';
  const H=window.House,T=window.THREE;if(!H?.ok||!T)return;
  const entries=new Map(),media=new Map(),active=new Map(),D=Math.PI/180;
  let saved=null,owner='';
  function state(){const who=String(window.Net?.me?.id||window.Net?.me?.nick||'');if(!saved||owner!==who){owner=who;try{saved=window.Apps?.loadGame?Apps.loadGame('media.cases',1):JSON.parse(localStorage.getItem('jhp_case_parks.'+who)||'null')}catch(e){}if(!saved||typeof saved!=='object')saved={};if(!saved.parks||typeof saved.parks!=='object')saved.parks={}}return saved}
  function savePark(id,p){state().parks[id]={...p};try{if(!window.Apps?.saveGame('media.cases',saved,{v:1}))localStorage.setItem('jhp_case_parks.'+owner,JSON.stringify(saved))}catch(e){}}
  function parking(id,p){const old=state().parks[id];if(old&&typeof old.room==='string'&&['x','y','z'].every(k=>Number.isFinite(old[k])))p=old;const key='case.park.'+id;return H.SNAPS[key]||H.snap(key,{...p,pose:{...p},accepts:()=>false,enabled:()=>false,box:[1,1,1]})}

  const ease=k=>H.motion.H5(Math.max(0,Math.min(1,k)));
  const pose=t=>({x:t.obj.position.x,y:t.obj.position.y,z:t.obj.position.z,rx:t.obj.rotation.x/D,ry:t.obj.rotation.y/D,rz:t.obj.rotation.z/D});
  const render=(t,p)=>({x:p.x,y:H.K.restY(p.y)-(t.bottomOffset||0),z:p.z,rx:p.rx||0,ry:p.ry||0,rz:p.rz||0});
  function show(t,p){t.obj.position.set(p.x,p.y,p.z);t.obj.rotation.set((p.rx||0)*D,(p.ry||0)*D,(p.rz||0)*D,'YXZ');t.obj.visible=true;H.dirty()}
  function blend(a,b,k,arc){
    k=ease(k);const p={};for(const q of ['x','y','z'])p[q]=a[q]+(b[q]-a[q])*k;
    if(arc){const s=4*k*(1-k);p.y-=s*arc;p.z+=s*12}
    const qa=new T.Quaternion().setFromEuler(new T.Euler((a.rx||0)*D,(a.ry||0)*D,(a.rz||0)*D,'YXZ'));
    const qb=new T.Quaternion().setFromEuler(new T.Euler((b.rx||0)*D,(b.ry||0)*D,(b.rz||0)*D,'YXZ'));
    const r=new T.Euler().setFromQuaternion(qa.slerp(qb,k),'YXZ');p.rx=r.x/D;p.ry=r.y/D;p.rz=r.z/D;return p;
  }
  const slot=e=>H.SNAPS[e.slot];
  const inserted=e=>e.medium.st==='snap'&&e.medium.snap===e.slot;
  const filled=e=>e.own?e.own():e.medium.st==='snap'&&e.medium.snap===e.homeSlot;
  function park(e){
    const id='case.park.'+e.slot;
    const p=e.box.snap===id?Object.assign({},e.box.at):e.park();
    let s=H.SNAPS[id];if(!s)s=H.snap(id,{...p,pose:{...p},accepts:()=>false,enabled:()=>false,box:[1,1,1]});
    Object.assign(s,p);s.pose={...p};return s;
  }
  function set(t,p,snap,hide){t.at={room:p.room||'bedroom',x:p.x,y:p.y,z:p.z,ry:p.ry||0,hide:!!hide};t.rx=p.rx||0;t.rz=p.rz||0;t.st=snap?'snap':'rest';t.snap=snap||null;const r=H.ROOMS[t.at.room];if(r&&t.obj.parent!==r.things)r.things.add(t.obj);H.place(t);H.layerFor(t)}
  function inside(e,p){return e.inside?e.inside(p):{...p,z:p.z+.25}}
  function finish(e,inserting,grab){
    active.delete(e.slot);e.lid?.(0);H.place(e.box);H.place(e.medium);H.layerFor(e.box);H.layerFor(e.medium);
    if(inserting)e.afterInsert?.();else{e.afterEject?.();if(grab&&!H.held()&&H.mode==='walk'&&!H.paused)H.grab(e.box.id)}
    H.saveThings(true);H.dirty();
  }
  function move(e,inserting){
    if(active.size||!slot(e))return false;
    if(inserting){if(!filled(e)||e.enabled?.()===false||[...entries.values()].some(o=>o!==e&&o.slot===e.slot&&inserted(o)))return false}
    else if(!inserted(e))return false;
    const b=e.box,m=e.medium,s=slot(e),ps=park(e),pp={...ps.pose,room:ps.room};
    const beginBox=pose(b),beginMedium=pose(m),wasHeld=H.held()===b.id;
    if(H.held()&&(!inserting||!wasHeld))return false;
    if(wasHeld)H.suspendGrip(b.id);
    for(const t of [b,m])for(const key of ['snap:','return:','case.lid.'])H.anims.delete(key+t.id);
    const work={...pp,z:pp.z+30,ry:0,rx:0,rz:0},workBox=render(b,work),parkBox=render(b,pp);
    const home=inside(e,work),homeMedium=render(m,home),target=render(m,{...s.pose,room:s.room});
    active.set(e.slot,{box:b.id,medium:m.id,direction:inserting?'insert':'eject'});
    // Save a complete transaction before its first visual frame. Refresh cannot
    // leave an empty carryable case or duplicate a medium halfway between slots.
    if(inserting){set(b,pp,ps.id,false);set(m,{...s.pose,room:s.room||pp.room},s.id,!!s.hide);e.openState?.(false);e.commitInsert?.()}
    else{set(b,pp,null,false);set(m,{...pp},e.homeSlot,true);e.openState?.(false);e.commitEject?.()}
    savePark(e.slot,pp);H.saveThings(true);
    const t0=performance.now(),ms=H.motion.scale(1450);
    H.anims.set('case.flow.'+e.slot,n=>{
      const k=ms?Math.max(0,Math.min(1,(n-t0)/ms)):1;
      const arrive=ease(k/.22),leave=ease((k-.8)/.2);
      show(b,k<.22?blend(beginBox,workBox,arrive):k>.8?blend(workBox,parkBox,leave):workBox);
      const lid=k<.4?ease((k-.18)/.22):k<.72?1:1-ease((k-.72)/.15);e.lid?.(lid);
      if(inserting&&k>=.79){show(m,target);if(s.hide&&k>.9)m.obj.visible=false}
      else if(k>.3&&k<.88){m.obj.visible=true;show(m,inserting?blend(homeMedium,target,(k-.34)/.45,5):blend(beginMedium,homeMedium,(k-.3)/.42,5))}
      else m.obj.visible=false;
      if(k<1)return true;
      finish(e,inserting,!inserting);return false;
    });
    H.dirty();return true;
  }
  function reconcile(e){
    if(active.has(e.slot)||!slot(e)||state().parks[e.slot]&&!H.ROOMS[state().parks[e.slot].room])return;
    if(inserted(e)){const p=park(e);set(e.box,{...p.pose,room:p.room},p.id,false);e.openState?.(false);e.lid?.(0)}
    else if(e.box.snap==='case.park.'+e.slot){e.box.st='rest';e.box.snap=null;H.place(e.box);e.lid?.(0)}
  }
  function register(o){
    if(entries.has(o.box.id))return entries.get(o.box.id);
    const e=o;entries.set(e.box.id,e);media.set(e.medium.id,e);
    const bg=e.box.canGrab,mg=e.medium.canGrab;
    e.box.canGrab=()=>!active.size&&!inserted(e)&&(!bg||bg()!==false);
    e.medium.canGrab=()=>{if(active.size)return false;if(inserted(e)){move(e,false);return false}return !mg||mg()!==false};
    reconcile(e);return e;
  }
  H.on('built',()=>{for(const e of entries.values())reconcile(e)});
  H.on('tidy',()=>{for(const e of entries.values()){H.anims.delete('case.flow.'+e.slot);active.delete(e.slot);reconcile(e)}});
  window.HouseCases={register,parking,insert:id=>{const e=entries.get(id);return !!e&&move(e,true)},eject:id=>{const e=entries.get(id)||media.get(id)||[...entries.values()].find(o=>o.slot===id&&inserted(o));return !!e&&move(e,false)},
    accepts:(id,slotId)=>{const e=entries.get(id);return !!e&&e.slot===slotId&&!active.size&&filled(e)&&e.enabled?.()!==false},
    inserted:id=>[...entries.values()].find(e=>e.slot===id&&inserted(e)),reconcile:()=>{for(const e of entries.values())reconcile(e)},get busy(){return active.size>0},state:()=>[...active.values()]};
})();

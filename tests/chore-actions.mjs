// Place through the actual production ghost and E control; never force a saved pose.
import assert from 'node:assert/strict';
export async function placeChore(f,id,sid,{place}={}){
 const {page:p,until,view}=f;
  const s=await p.evaluate(sid=>{const s=House.SNAPS[sid];return{x:s.x,y:s.y,z:s.z,room:s.room}},sid);
  if(await p.evaluate(()=>!!House.held()))await p.evaluate(()=>House.putBack());
  const misses=[];
  const approaches=[];for(const radius of [65,85,110,135,155])for(let a=0;a<16;a++){const t=a*Math.PI/8;approaches.push([Math.sin(t)*radius,Math.cos(t)*radius])}
  for(const [dx,dz]of approaches){
   const eye=[s.x+dx,210,s.z+dz];
   if(!await p.evaluate(([x,,z])=>House._.cellOk('G',x,z),eye))continue;
   if(await p.evaluate(()=>!!House.held())){
    const returning=await p.evaluate(()=>House.held());await p.evaluate(()=>House.putBack());
    const end=Date.now()+30000;while(Date.now()<end&&!await p.evaluate(id=>['rest','snap'].includes(House.THINGS[id].st),returning))await p.waitForTimeout(100);
   }
   assert(await p.evaluate(id=>House.grab(id),id),'Cannot regrip '+id);
   await view(eye,[s.x,s.y,s.z],{level:'G'});await p.evaluate(()=>{House._.setMode('walk');House.hush()});
   await p.waitForTimeout(300);
   await p.evaluate(s=>{const H=House,P=H.P,W=H.W;W.eyeNow=W.eye;P.x=W.x;P.y=W.fy-W.eye;P.z=W.z;P.rx=Math.atan2(-(s.y-P.y),Math.hypot(s.x-P.x,s.z-P.z))*180/Math.PI;P.ry=Math.atan2(s.x-P.x,-(s.z-P.z))*180/Math.PI;H.dirty()},s);
   for(let i=0;i<9;i++){
    const g=await p.evaluate(()=>{const g=House.ghost();return g&&{ok:g.ok,snap:g.snap?.id,why:g.why}});
    if(g?.snap===sid){
     if(place)await place();else await p.keyboard.press('e');const deadline=Date.now()+30000;
     while(Date.now()<deadline&&!await p.evaluate(id=>House.THINGS[id].st==='snap',id))await p.waitForTimeout(100);
     assert(await p.evaluate(({id,sid})=>House.THINGS[id].st==='snap'&&House.THINGS[id].snap===sid,{id,sid}),'Snap animation did not commit '+id);
     console.log('STORED',id,sid);return;
    }
    misses.push(g?.snap||g?.why||'no ghost');await p.keyboard.press('+');
   }
  }
  throw Error('No real accepting ghost for '+id+' -> '+sid+': '+misses.join(','));
 
}

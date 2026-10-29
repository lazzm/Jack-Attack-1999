import assert from 'node:assert/strict';
// Find a real gold target from a clear standing position, then use the normal E path.
export async function insertCase(f,id,sid,{press}={}){
 const {page:p,view}=f,s=await p.evaluate(sid=>{const s=House.SNAPS[sid];return{x:s.x,y:s.y,z:s.z,room:s.room||'bedroom',lvl:House.ROOMS[s.room||'bedroom'].lvl}},sid);
 const missed=[];
 for(const r of [70,100,135,165])for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=s.x+Math.sin(a)*r,z=s.z+Math.cos(a)*r;
  if(!await p.evaluate(({x,z,lvl})=>House._.cellOk(lvl,x,z),{x,z,lvl:s.lvl}))continue;
  const y=await p.evaluate(lvl=>House.LV[lvl]-House.STAND,s.lvl);await view([x,y,z],[s.x,s.y,s.z],{level:s.lvl});await p.evaluate(()=>{House._.setMode('walk');House.hush()});
  if(await p.evaluate(()=>House.held())!==id)assert(await p.evaluate(id=>House.grab(id),id),'Cannot grip '+id);
  for(let j=0;j<10;j++){
   const g=await p.evaluate(()=>{const g=House.ghost();return g&&{snap:g.snap?.id,why:g.why,x:g.x,y:g.y,z:g.z}});
   if(g?.snap==='case.insert.'+sid){if(press)await press();else await p.keyboard.press('e');assert(await p.evaluate(({id,sid})=>House.THINGS[id].snap==='case.park.'+sid,{id,sid}),'Native E did not commit the case');assert(await p.evaluate(({id,g})=>{const a=House.THINGS[id].at;return Math.hypot(a.x-g.x,a.y-g.y,a.z-g.z)<.11},{id,g}),'Case did not land at its gold ghost');return}
   missed.push(g?.snap||g?.why||'no ghost');await p.keyboard.press('+');
  }
 }
 throw Error('No accepting gold case target '+id+' -> '+sid+': '+missed.slice(-20).join(','));
}

// Provision through the real, capped discovery protocol on the caller's disposable veteran account.
// Then insert its own physical case; no profile edits, currency grants or ownership bypasses.
export async function playCase(f,gid,options={}){
 const {page:p,until}=f,sid='console.'+gid.split('.')[0],box='media.box.'+gid;
 await p.evaluate(gid=>{if(!Room.owned(gid)){Net.send({t:'rmFind',id:'cart.'+gid});Net.send({t:'rmMe'})}},gid);
 let ready=false;for(let i=0;i<450;i++){if(await p.evaluate(gid=>Room.owned(gid),gid)){ready=true;break}await p.waitForTimeout(200)}assert(ready,'Fixture did not discover '+gid);
 await p.evaluate(()=>Room.syncMedia());
 const loaded=await p.evaluate(sid=>HouseCases.inserted(sid)?.medium.gameId,sid);
 if(loaded&&loaded!==gid){assert(await p.evaluate(sid=>HouseCases.eject(sid),sid));await until(()=>!HouseCases.busy);if(await p.evaluate(()=>!!House.held()))await p.evaluate(()=>House.putBack());await until(()=>!House.held())}
 if(loaded===gid)await p.evaluate(con=>House.act(con==='sn'?'snes':con),gid.split('.')[0]);else await insertCase(f,box,sid,options);
 await until(()=>window.RoomTV?._dbg()?.st==='game'&&!HouseCases.busy&&!House.gliding);assert.equal(await p.evaluate(()=>RoomTV._dbg().gid),gid);
}

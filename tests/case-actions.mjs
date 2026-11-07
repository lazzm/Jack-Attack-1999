import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const caseShotDir=new URL('./shots/light/round8/gold/',import.meta.url).pathname;
// Change game closes the TV before its camera return starts the case animation.
// Neither an idle transaction nor a committed snap alone proves ejection finished.
export function caseEjected(gid){
 const box=House.THINGS['media.box.'+gid],medium=House.THINGS['media.'+gid];
 return !!(!RoomTV.open_&&!House.gliding&&!HouseCases.busy&&medium?.snap==='media.case.'+gid&&box?.canGrab?.());
}
// view() deliberately hides the carry ghost while it positions a focus camera.
// Polling JS faster than the renderer cannot produce a new walking picture.
export async function caseGhostFrame(p,id,frame){
 // Poll from Node: this Playwright's in-page timer re-evaluates a string,
 // which the site's script-src 'self' correctly refuses after the first poll.
 const end=Date.now()+15000;let state;
 while(Date.now()<end){
  state=await p.evaluate(()=>({held:House.held(),frame:House.perf().frames,ghost:!!House.ghost(),mode:House.mode,paused:House.paused}));
  if(state.held===id&&state.frame>frame&&state.ghost)return;
  await p.waitForTimeout(50);
 }
 throw Error('No drawn case ghost after a walking frame: '+JSON.stringify({id,after:frame,...state}));
}
async function caseParked(p,id,sid){
 const end=Date.now()+3000;
 while(Date.now()<end){if(await p.evaluate(({id,sid})=>House.THINGS[id].snap==='case.park.'+sid,{id,sid}))return;await p.waitForTimeout(50)}
}
async function caseGoldShot(p,id){
 if(!process.env.LIGHTING_GHOST_SHOTS)return;
 const state=await p.evaluate(()=>({lighting:House.graphicsGet().lighting,width:innerWidth,height:innerHeight,paused:House.paused,ghost:House.ghost()?.snap?.id,frame:House.perf().frames}));assert(!state.paused);
 const dir=caseShotDir;await mkdir(dir,{recursive:true});const name=state.lighting+'-'+id.replace(/[^a-z0-9.-]/gi,'-')+'-'+state.width+'x'+state.height;
 await p.screenshot({path:dir+name+'.png'});await writeFile(dir+name+'.json',JSON.stringify(state,null,2));
}
// Find a real gold target from a clear standing position, then use the normal E path.
export async function insertCase(f,id,sid,{press}={}){
 const {page:p,view}=f,s=await p.evaluate(sid=>{const s=House.SNAPS[sid];return{x:s.x,y:s.y,z:s.z,room:s.room||'bedroom',lvl:House.ROOMS[s.room||'bedroom'].lvl}},sid);
 const missed=[],candidates=await p.evaluate(s=>{const r=House.ROOMS[s.room];return s.room==='cupboard'?(r.stations||[]).map(t=>typeof t.pose==='function'?t.pose():t.pose).filter(Boolean).map(p=>({x:p.x,z:p.z})):[]},s);
 for(const r of [70,100,135,165])for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push({x:s.x+Math.sin(a)*r,z:s.z+Math.cos(a)*r})}
 for(const{x,z}of candidates){
  const stand=await p.evaluate(({x,z,lvl})=>{const area=r=>(r.area||[]).reduce((n,a)=>n+(a[2]-a[0])*(a[3]-a[1]),0);const r=Object.values(House.ROOMS).filter(r=>r.lvl===lvl&&(r.area||[]).some(a=>x>=a[0]&&x<=a[2]&&z>=a[1]&&z<=a[3])).sort((a,b)=>area(a)-area(b))[0],eye=r?.eye||House.STAND,floor=House._.floorAt(x,z,lvl,House.LV[lvl],eye);return floor&&floor.lvl===lvl&&Math.abs(floor.y-House.LV[lvl])<1?{y:floor.y-eye}:null},{x,z,lvl:s.lvl});if(!stand)continue;
  await view([x,stand.y,z],[s.x,s.y,s.z],{level:s.lvl});await p.evaluate(()=>{House._.setMode('walk');House.hush()});
  if(await p.evaluate(()=>House.held())!==id){
   const grip=await p.evaluate(id=>{const t=House.THINGS[id],ok=House.grab(id);return{ok,exists:!!t,held:House.held(),away:t&&House.isAway(t),canGrab:t?.canGrab?.(),state:t?.st,snap:t?.snap,at:t?.at,busy:HouseCases.busy,mode:House.mode,medium:House.THINGS['media.'+id.slice('media.box.'.length)]?.snap}},id);
   assert(grip.ok,'Cannot grip '+id+': '+JSON.stringify(grip));
  }
  await caseGhostFrame(p,id,await p.evaluate(()=>House.perf().frames));
  for(let j=0;j<10;j++){
   const g=await p.evaluate(()=>{const g=House.ghost();return g&&{snap:g.snap?.id,why:g.why,x:g.x,y:g.y,z:g.z}});
   if(g?.snap==='case.insert.'+sid){await caseGoldShot(p,id);if(press)await press();else await p.keyboard.press('e');await caseParked(p,id,sid);const committed=await p.evaluate(({id,sid})=>({ok:House.THINGS[id].snap==='case.park.'+sid,snap:House.THINGS[id].snap,held:House.held(),st:House.THINGS[id].st,busy:HouseCases.busy,mode:House.mode,ghost:House.ghost()?.snap?.id,why:House.ghost()?.why}),{id,sid});assert(committed.ok,'Native E did not commit the case: '+JSON.stringify(committed));assert(await p.evaluate(({id,g})=>{const a=House.THINGS[id].at;return Math.hypot(a.x-g.x,a.y-g.y,a.z-g.z)<.11},{id,g}),'Case did not land at its gold ghost');return}
   missed.push(g?.snap||g?.why||'no ghost');const frame=await p.evaluate(()=>House.perf().frames);await p.keyboard.press('+');await caseGhostFrame(p,id,frame);
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
 await until(()=>window.RoomTV?._dbg()?.st==='game'&&!HouseCases.busy&&!House.gliding);assert.equal(await p.evaluate(()=>RoomTV._dbg().gid),gid);if(gid.startsWith('sn.'))assert.equal(await p.evaluate(gid=>House.THINGS['media.'+gid].at.room,gid),'cupboard','Super Ultra media must belong to the ground-floor cupboard');
}

import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';import{fileURLToPath}from'node:url';
import {withTestServer} from './perf/server.mjs';import{roomFixture}from'./room-fixture.mjs';
const dir=fileURLToPath(new URL('shots/case-flow/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='Case'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3,touch:true}),{page:p,until,view,errors}=f;
 const shot=n=>p.screenshot({path:dir+n+'.png',timeout:180000});
 async function room(){await p.evaluate(async()=>{await Room.ensureHouse();House.buildRoom(House.ROOMS.cupboard);Room.syncMedia()});await until(()=>!!HouseCases&&!!House.THINGS['media.box.sn.zero'])}
 async function walk(){await p.evaluate(()=>{HousePause.close();if(House.focused)House.unfocus();House.hush()});await until(()=>!House.gliding&&!House.focused);await p.evaluate(()=>{HousePause.close();House.pauseControls(false);House._.setMode('walk')})}
 async function pair(gid){
  await walk();const id='media.box.'+gid,sid='console.'+gid.split('.')[0];
  await view(gid.startsWith('sn.')?[380,225,400]:[-185,-55,120],gid.startsWith('sn.')?[352,316.5,339]:[-185,35,-26],{level:gid.startsWith('sn.')?'G':'U'});await p.evaluate(()=>{HousePause.close();House.pauseControls(false);House._.setMode('walk')});
  assert(await p.evaluate(id=>House.grab(id),id),'Cannot grab filled '+id);
  assert(await p.evaluate(({id,sid})=>HouseCases.accepts(id,sid),{id,sid}),'Case not accepted '+id);
  if(gid==='n64.kart')await p.evaluate(()=>{window.caseTestScale=House.motion.scale;House.motion.scale=ms=>caseTestScale(ms)*(ms===1450?20:1)});assert(await p.evaluate(id=>HouseCases.insert(id),id));assert(!await p.evaluate(id=>HouseCases.insert(id),id),'Rapid insert was accepted twice');if(gid==='n64.kart'){assert(await p.evaluate(()=>HouseCases.busy),'Esc fixture missed the insertion animation');await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open),'Esc did not open the menu during insertion');assert.equal(await p.evaluate(()=>House.THINGS['media.n64.kart'].snap),'console.n64');await p.keyboard.press('Escape');assert(!await p.evaluate(()=>HousePause.open),'Esc did not resume insertion');await p.evaluate(()=>House.motion.scale=window.caseTestScale)}
  await until(()=>!HouseCases.busy);await until(()=>RoomTV?._dbg()?.st==='game');
  const loaded=await p.evaluate(({id,gid,sid})=>{const b=House.THINGS[id],m=House.THINGS['media.'+gid];return{snap:m.snap,park:b.snap,fixed:House.physics.body(id).fixed,grab:House.grab(id),pos:{...b.at}}},{id,gid,sid});
  assert.equal(loaded.snap,sid);assert.equal(loaded.park,'case.park.'+sid);assert(loaded.fixed);assert.equal(loaded.grab,false);await shot(gid+'-loaded');
  await walk();assert(await p.evaluate(sid=>HouseCases.eject(sid),sid));await until(()=>!HouseCases.busy);
  assert.equal(await p.evaluate(gid=>House.THINGS['media.'+gid].snap,gid),'media.case.'+gid);console.log('CASE RETURN STATE',gid,await p.evaluate(id=>({held:House.held(),mode:House.mode,focused:House.focused,paused:House.paused,busy:HouseCases.busy,canGrab:House.THINGS[id].canGrab()}),id));if(!await p.evaluate(()=>House.held())){console.log('CASE AVAILABLE WITHOUT AUTO GRAB',gid);assert(await p.evaluate(id=>House.grab(id),id),'Returned case is not carryable')}assert.equal(await p.evaluate(()=>House.held()),id);await shot(gid+'-returned');
  await p.evaluate(()=>House.putBack());await until(()=>!House.held());console.log('CASE PAIR PASS',gid);
 }
 try{
  await room();console.log('CASE WORLD READY',await p.evaluate(()=>Object.keys(House.THINGS).filter(id=>id.startsWith('media.box.'))));
  const selected=(process.argv.find(a=>a.startsWith('--only='))?.slice(7)||'n64.kart,ps.run,gb.blocks,md.zip,dc.taxi,sn.zero,pc').split(',');
  const failures=[];for(const gid of selected.filter(id=>id!=='pc'))try{await pair(gid)}catch(e){failures.push(gid+': '+e.message);console.log('PAIR FAILED',gid,e.message)};
  if(selected.includes('pc')){
  await walk();
  const prior=await p.evaluate(()=>Room.drive('cd').thing);if(prior){
   await p.evaluate(()=>Room.eject('cd'));await until(()=>!HouseCases.busy);
   const left=await p.evaluate(()=>Room.drive('cd').thing);if(left){await until(()=>Room.drive('cd').open);await p.evaluate(id=>{if(House.grab(id))PMGL.discHome(PMGL.THING[id])},left);await until(()=>!HouseCases.busy&&!Room.drive('cd').thing)}
   if(await p.evaluate(()=>!!House.held()))await p.evaluate(()=>House.putBack());await until(()=>!House.held());await p.evaluate(()=>Room.driveTray(false));await until(()=>!Room.drive('cd').open);
  }
  const pc=await p.evaluate(()=>PM.items().find(it=>it.disc&&['box','jewel','cdr'].includes(it.kind)&&House.THINGS['pmb.'+it.id]&&PM.where(it.id)==='shelf')?.id);assert(pc,'No PC case fixture');
  await view([40,-55,155],[-63,-12,-42]);await p.evaluate(()=>{HousePause.close();House.pauseControls(false);House._.setMode('walk')});
  assert(await p.evaluate(id=>House.grab('pmb.'+id),pc));console.log('PC INSERT STATE',await p.evaluate(id=>({id,story:window.StoryAccess?.available,drive:Room.drive('cd'),where:PM.where(id),held:House.held(),disc:{st:House.THINGS['pmd.'+id]?.st,snap:House.THINGS['pmd.'+id]?.snap,at:House.THINGS['pmd.'+id]?.at},accepts:HouseCases.accepts('pmb.'+id,'pc.cd')}),pc));assert(await p.evaluate(id=>HouseCases.insert('pmb.'+id),pc));await until(()=>!HouseCases.busy);await until(()=>!Room.drive('cd').open&&!!Room.drive('cd').thing);await shot('pc-loaded');await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>Room.drive('cd').thing),'pmd.'+pc,'PC drive lost the inserted disc on refresh');assert.equal(await p.evaluate(id=>House.THINGS['pmb.'+id].snap,pc),'case.park.pc.cd');assert.equal(await p.evaluate(id=>PM.where(id),pc),'D');await shot('pc-loaded-refresh');
  assert(await p.evaluate(()=>HouseCases.eject('pc.cd')));await until(()=>!HouseCases.busy);assert.equal(await p.evaluate(()=>House.held()),'pmb.'+pc);assert.equal(await p.evaluate(id=>PM.where(id),pc),'shelf');await shot('pc-returned');
  }
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);console.log('CASE FLOW PASS:',selected.join(','),'insertion/parking/ejection, rapid insert, fixed cases, same media IDs');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});

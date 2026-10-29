// Storage/plumping review: production grip, ghost, E placement and action callbacks.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {placeChore} from './chore-actions.mjs';
import {roomFixture} from './room-fixture.mjs';
import {withTestServer} from './perf/server.mjs';
const dir=fileURLToPath(new URL('shots/chore-feedback/',import.meta.url));await mkdir(dir,{recursive:true});
const only=(process.argv.find(a=>a.startsWith('--only='))?.slice(7)||'cushions,videos,shopping,table').split(',');
await withTestServer(async base=>{
 const account='Store'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=async(name,eye,target)=>{await view(eye,target,{level:'G'});await p.evaluate(()=>House.hush());await p.screenshot({path:dir+name+'.png',timeout:180000})};
 const put=(id,sid)=>placeChore(f,id,sid);
 const failures=[];
 async function check(name,fn){try{await fn()}catch(e){failures.push({name,error:String(e.message)});console.log('STORAGE FAIL',name,e.stack);if(await p.evaluate(()=>!!House.held()))await p.evaluate(()=>House.putBack());await p.screenshot({path:dir+'fail-'+name+'.png',timeout:180000}).catch(()=>{})}}
 try{
  await p.evaluate(async()=>{for(const id of ['hall','kitchen','lounge'])House.buildRoom(House.ROOMS[id]);HouseFamily.debug.hide(true);await Chores.load();for(const id of ['bedroom','kitchen','lounge'])await Chores.part(id)});
  await until(()=>['cushions','videos','shopping','table'].every(id=>ChoreKit.MODS[id]?._built));
  if(only.includes('cushions'))await check('cushions',async()=>{
   await shot('cushions-before',[160,180,680],[-80,335,500]);
   for(let i=0;i<4;i++){await put('ch.c.'+i,'ch.s.cush'+i);await p.evaluate(i=>House.act('ch.c.'+i),i);await until(()=>!Array.from(House.anims.keys()).some(k=>k.startsWith('ch.plump')));await shot('cushion-plumped-'+i,[-60,230,450],[-60,290,590])}
   assert(await p.evaluate(()=>[0,1,2,3].every(i=>ChoreKit.has('cushions','p'+i))));
   for(const [name,eye]of [['front',[-60,230,450]],['left',[-130,230,500]],['right',[40,230,520]]])await shot('cushions-after-'+name,eye,[-60,290,590]);
   await shot('cushions-chair',[60,210,460],[122,290,388]);console.log('STORAGE FEEDBACK cushions: actual slots and four plump animations');
  });
  if(only.includes('videos'))await check('videos',async()=>{
   await shot('videos-before',[60,210,440],[14,315,322]);
   for(let i=0;i<6;i++)await put('ch.v.'+i,'ch.s.tower');
   await shot('videos-after',[60,210,440],[14,315,322]);assert(await p.evaluate(()=>[0,1,2,3,4,5].every(i=>ChoreKit.has('videos','v'+i))));console.log('STORAGE FEEDBACK videos: six real tower slots');
  });
  if(only.includes('shopping'))await check('shopping',async()=>{
   await shot('shopping-before',[160,205,250],[60,340,75]);
   const items=await p.evaluate(()=>ChoreKit.MODS.shopping.items.map(t=>({id:t.id,slot:'ch.s.'+t.kind.slice(5)})));
   for(const t of items)await put(t.id,t.slot);
   await p.evaluate(()=>House.act('ch.bags'));await until(()=>ChoreKit.has('shopping','bags'));
   assert(await p.evaluate(()=>ChoreKit.MODS.shopping.items.every(t=>t.at.hide)));
   await shot('shopping-after',[160,205,250],[60,340,75]);console.log('STORAGE FEEDBACK shopping: nine actual destinations and folded carrier bags');
  });
  if(only.includes('table'))await check('table',async()=>{
   await shot('table-before',[90,170,270],[-54,275,172]);
   for(let i=0;i<4;i++)for(const k of ['p','k','g'])await put('ch.t.'+k+i,'ch.s.t'+k+i);
   await put('ch.t.sauce','ch.s.sauce');await shot('table-after',[90,170,270],[-54,275,172]);
   console.log('STORAGE FEEDBACK table: four complete places and ketchup');
  });
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log('CHORE STORAGE FEEDBACK PASS:',only.join(','));
 }finally{await f.browser.close()}
});

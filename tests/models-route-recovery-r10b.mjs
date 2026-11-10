// Exact pending-aside state with a real checked route and a live chapter line.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const baseline=process.argv.includes('--baseline'),root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/models/r10b/';await mkdir(out,{recursive:true});
await withTestServer(async base=>{
 const account='Recovery',password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:14,onPage:async p=>{if(baseline)await p.route('**/js/np-life.js*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/np-life.js'],{cwd:root,encoding:'utf8'})}))}});
 try{
  const {page}=f;await f.until(()=>HouseFamily.ready);
  await page.evaluate(()=>{
   const F=HouseFamily,H=House,m=F.chars.mom,sp=F.debug.speech;
   F.debug.clock({md:1012,dow:2,t:14.5});F.debug.go('mom','phone');F.debug.place('mom','hallYoyo');
   H.setWalkFrom({x:200,y:353-H.STAND,z:520,lvl:'G',seat:0});
   sp.voice?.stop();sp.q.length=0;sp.cur=null;sp.voice=null;m.hold=0;m.talking=false;
   F.speak('mom','talk.mom.context.chapter.2',NPCLines['talk.mom.context.chapter.2'][1],{requested:false});
  });
  await f.until(()=>HouseFamily.debug.speech.cur?.lineId==='talk.mom.context.chapter.2');
  const result=await page.evaluate(()=>{
   const F=HouseFamily,m=F.chars.mom,sp=F.debug.speech;
   sp.freeze=true;const voice=sp.voice,line=sp.cur;
   const to={lvl:'G',x:280,z:420};const route=NPCNav.route({lvl:m.lvl,x:m.x,z:m.z},to);if(!route)throw Error('Recovery fixture has no checked aside');
   m.aside={...to,route,face:0};m.asideT=0;m.asideFor=null;m.goal=m.cur=null;m.plan=[];m.pass=null;m.pushN=0;m.pushFrom=null;m.hold=0;
   const dump=()=>({x:m.x,z:m.z,room:m.room,goal:m.goal?.key,step:m.cur?.k,aside:!!m.aside,hold:m.hold,talking:m.talking});
   const before=dump();F.debug.sim(12,.1);const aside=dump();
   House.setWalkFrom({x:300,y:353-House.STAND,z:180,lvl:'G',seat:0});F.debug.sim(60,.1);
   return {before,aside,after:dump(),sameLine:sp.cur===line,sameVoice:sp.voice===voice,line:line.lineId,talk:line.talk,requested:line.requested};
  });
  await writeFile(out+'route-'+(baseline?'before':'after')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  assert.equal(result.after.room,'lounge','Pending aside must recover the phone route');assert.equal(result.after.step,'act');assert(result.sameLine&&result.sameVoice,'Route recovery must retain its speech');assert.deepEqual(f.errors,[]);
  console.log('PASS pending checked aside reaches phone without cancelling chapter speech');
 }finally{await f.browser.close()}
});

// Matched scale evidence at the real standing eye; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert(['before','after'].includes(tag));
const dir=new URL('./shots/sizing3/'+tag+'/',import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const noShots=process.env.SIZING3_NO_SHOTS==='1',reportPath=dir+(noShots?'budget.json':'report.json');
const views=[
 ['bedroom-door','U',[225,-70,215],[-200,-5,-20]],
 ['desk','U',[0,-70,140],[0,-10,-20]],
 ['bedroom-corner','U',[-170,-70,30],[190,0,100]],
 ['telly','U',[-80,-70,150],[-185,8,-34]],
 ['bed','U',[80,-70,185],[190,15,40]],
 ['wardrobe','U',[-80,-70,170],[-250,-15,150]],
 ['landing','U',[300,-70,180],[340,55,450]],
 ['stairs','G',[240,210,680],[375,80,330]],
 ['hall','G',[260,210,90],[300,240,690]],
 ['lounge','G',[-255,210,330],[100,280,650]],
 ['front','G',[300,210,1430],[320,80,700]],
 ['car','G',[230,210,1180],[500,280,1075]],
 ['leaves','G',[320,210,1045],[222,350,1106]],
 ['sack','G',[280,210,1200],[150,310,1288]],
 ['people-dad','U',[40,-70,70],[180,-10,190]],
 ['people-mom','U',[40,-70,70],[180,-10,190]],
 ['people-sister','U',[40,-70,70],[180,-10,190]],
];
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:'Throwaway-1999'})})).ok);
const f=await roomFixture(base,{account:'Jack',signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,'Throwaway-1999','Jack',{x:100,y:-70,z:170,rx:0,ry:0,lvl:'U',seat:0}),seed:1999,onPage:async p=>{
 if(tag==='before')await p.route('**/js/*.js*',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();try{const body=execFileSync('git',['show','HEAD:app/public/js/'+name],{encoding:'utf8',maxBuffer:8*1024*1024});await route.fulfill({body,contentType:'application/javascript'})}catch{await route.continue()}});
}});
const report=process.env.SIZING3_ONLY?JSON.parse(await readFile(reportPath,'utf8').catch(()=>'[]')):[];
try{
 await f.page.evaluate(()=>{Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));House.adapt(3,{pin:true,force:true});HouseFamily.debug.clock({md:1104,dow:4,t:14});House.dirty()});
 const input=await f.page.context().newCDPSession(f.page);
 for(const phone of [false,true]){
  // Fixed actor locations prevent routine timing from changing the paired draw counts.
  await f.page.evaluate(()=>{for(const [id,spot]of [['dad','carStory'],['mom','phone'],['sister','hallYoyo']]){HouseFamily.debug.go(id,spot);HouseFamily.debug.place(id,spot)}HouseFamily.debug.sim(2,.1);HouseFamily.debug.hide(true)});
  await f.page.setViewportSize(phone?{width:390,height:844}:{width:1366,height:860});
  await input.send('Emulation.setTouchEmulationEnabled',{enabled:phone,maxTouchPoints:1});
  if(phone){await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:387,y:6}]});await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else await f.page.keyboard.press('Shift');
  await f.page.evaluate(phone=>{House.Q.mob=phone;HousePause.close();House.dirty()},phone);
  for(const [name,level,eye,target]of views){
   if(process.env.SIZING3_ONLY&&!process.env.SIZING3_ONLY.split(',').includes(name))continue;
   if(name.startsWith('people-'))await f.page.evaluate(id=>{
    for(const [who,spot]of [['dad','carStory'],['mom','phone'],['sister','hallYoyo']]){HouseFamily.debug.go(who,spot);HouseFamily.debug.place(who,spot)}
    HouseFamily.debug.spots.scalePerson={lvl:'U',x:180,z:190,face:-130};HouseFamily.debug.go(id,'scalePerson');HouseFamily.debug.place(id,'scalePerson');HouseFamily.debug.sim(1,.1);HouseFamily.debug.hide(false);
   },name.slice(7));
   await f.view(eye,target,{level});await f.page.waitForTimeout(500);
   const file=`${phone?'phone':'desktop'}-${name}.png`;
   if(!noShots)await f.page.screenshot({path:dir+file});
   report.push({file,eye,target,...await f.page.evaluate(()=>({room:House.here,calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,visible:Object.values(House.ROOMS).filter(r=>r.group.visible).map(r=>r.id)}))});
   await writeFile(reportPath,JSON.stringify([...new Map(report.map(r=>[r.file,r])).values()],null,2));console.log(noShots?'METRIC':'SHOT',file,report.at(-1).calls);
  }
 }
 assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}

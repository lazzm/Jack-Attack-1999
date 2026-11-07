// Focused native-pixel seat/contact gallery and stationary real-E beanbag grip.
import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],account='Art'+Date.now().toString(36),password='Throwaway-1999',out='tests/shots/fixqa5/';await mkdir(out,{recursive:true});
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account),hour:19,width:1366,height:860}),p=f.page,report={seats:[],grip:[]};
try{
 if(process.argv.includes('--grip-only')){try{report.seats=JSON.parse(await readFile(out+'art-grip.json','utf8')).seats.filter(s=>s.seat!=='floorTV')}catch{}}
 await f.until(()=>HouseFamily?.ready);
 await p.evaluate(()=>{HouseFamily.debug.clock({md:1107,dow:0,t:19});HousePause.close();st.clearVoiceQueue();const S=HouseFamily.debug.speech;S.q.length=0;S.cur=null;S.voice?.stop();S.bub?.close();});
 for(const [person,seat] of (process.argv.includes('--grip-only')?[['dad','floorTV']]:[['dad','armchair'],['mom','sofaL'],['sister','sofaR'],['dad','floorTV']])){
  await p.evaluate(({person,seat})=>{for(const c of Object.values(HouseFamily.chars)){c.hold=0;c.talking=false;HouseFamily.debug.scene(c.id,null)}HouseFamily.debug.scene(person,seat);HouseFamily.debug.place(person,seat);HouseFamily.debug.sim(25,.1)}, {person,seat});
  await f.until(({person,seat})=>HouseFamily.chars[person].seated&&HouseFamily.chars[person].goal?.spotKey===seat,{person,seat});
  const q=await p.evaluate(person=>{const c=HouseFamily.chars[person];return{x:c.x,z:c.z,h:c.h}},person),a=q.h;
  for(const [view,angle]of [['front',a],['side',seat==='floorTV'?a-Math.PI/2:a+Math.PI/2]]){
   const eye=seat==='floorTV'?(view==='front'?[q.x+95,250,q.z+25]:[q.x-80,250,q.z+90]):[q.x+Math.sin(angle)*160,240,q.z+Math.cos(angle)*160],target=[q.x,seat==='floorTV'?300:285,q.z];
   await f.view(eye,target,{level:'G'});
   await p.evaluate(person=>{const c=HouseFamily.chars[person];c.hold=0;c.rig.hush();c.rig.set({engage:false,action:'sit'});for(let i=0;i<120;i++)c.rig.update(1/60,true);House.dirty()},person);
   if(person==='dad'&&seat==='armchair')await p.screenshot({path:out+person+'-'+seat+'-'+view+'-idle.png'});
   await p.evaluate(person=>{const c=HouseFamily.chars[person];c.rig.set({engage:true,action:'paper'});c.rig.talk(60000,'All right? Here is something worth talking about!');for(let i=0;i<120;i++)c.rig.update(1/60,true);House.dirty()},person);
   await p.screenshot({path:out+person+'-'+seat+'-'+view+'-talk.png'});
   report.seats.push(await p.evaluate(({person,seat,view})=>{const c=HouseFamily.chars[person],r=c.rig;return{person,seat,view,anchor:[c.x,c.z],sitK:r.st.sitK,bones:Object.fromEntries(['handL','handR','foreL','foreR'].filter(k=>r.bones[k]).map(k=>[k,r.bones[k].getWorldPosition(new House.T.Vector3()).toArray()]))}},{person,seat,view}));
   await p.evaluate(person=>{HouseFamily.chars[person].rig.hush();HouseFamily.chars[person].rig.set({engage:false})},person);
  }
 }
 // Same account, native E at the beanbag and no movement input for two seconds.
 const before=await p.evaluate(()=>({...House.THINGS.beanbag.at})),upper=await p.evaluate(()=>({floor:House.LV.U,eye:House.STAND}));
 await f.view([before.x+72,upper.floor-upper.eye,before.z+119],[before.x,upper.floor-25,before.z],{level:'U'});await p.evaluate(()=>House._.setMode('walk'));
 await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'beanbag');
 const start=await p.evaluate(()=>({pose:{x:House.W.x,z:House.W.z},at:{...House.THINGS.beanbag.at}}));await p.screenshot({path:out+'beanbag-before.png'});
 await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),'beanbag');await p.waitForTimeout(2000);
 const during=await p.evaluate(()=>({pose:{x:House.W.x,z:House.W.z},at:{...House.THINGS.beanbag.at}}));await p.screenshot({path:out+'beanbag-held.png'});await p.keyboard.press('e');
 const after=await p.evaluate(()=>({pose:{x:House.W.x,z:House.W.z},at:{...House.THINGS.beanbag.at}}));
 assert(Math.hypot(during.at.x-start.at.x,during.at.z-start.at.z)<.1,'stationary beanbag must stay put');assert.equal(await p.evaluate(()=>House.held()),null);
 report.grip={start,during,after,distance:Math.hypot(after.at.x-start.at.x,after.at.z-start.at.z)};
 // A selected computer nag must be dropped when the player leaves the PC before delivery.
 const nag=await p.evaluate(()=>{const S=HouseFamily.debug.speech;st.clearVoiceQueue();S.q.length=0;S.cur=null;S.voice?.stop();S.bub?.close();S.voice=S.bub=null;S.freeze=true;House.setWalkFrom({x:260,y:House.LV.G-House.STAND,z:520,lvl:'G',seat:0});House._.setMode('monitor');st.speakLine('chore.shout','mom','Get off that computer and do your jobs!',{context:{kind:'choreNag',pc:true}});const line=S.q.find(n=>/Get off that computer/.test(n.text))?.lineId;House._.setMode('walk');S.freeze=false;return{line,pose:{x:House.W.x,z:House.W.z,mode:House.mode}}});
 assert(nag.line,'computer nag was queued while the context matched');await p.waitForTimeout(1000);assert(await p.evaluate(id=>HouseFamily.debug.speech.cur?.lineId!==id&&!HouseFamily.debug.speech.q.some(n=>n.lineId===id),nag.line),'stale computer nag dropped in hall');report.context=nag;
 await p.evaluate(()=>{Object.defineProperty(OwnerTools,'clock',{configurable:true,get:()=>({date:'1999-11-07',hour:19})});OwnerTools.now=()=>new Date('1999-11-07T19:00:00');Season.evaluate(true);const S=HouseFamily.debug.speech;S.q.length=0;S.cur=null;S.voice?.stop();S.bub?.close();S.voice=S.bub=null;for(const c of Object.values(HouseFamily.chars)){c.hold=0;c.talking=false;c.rig.hush()}HouseFamily.debug.scene('dad','armchair');HouseFamily.debug.place('dad','armchair');HouseFamily.debug.sim(25,.1);});
 // Exhaust actual response IDs, then use the real F control. It must acknowledge,
 // and rapid F must not interrupt the gesture or offer a misleading Talk prompt.
 await f.view([35,235,375],[141.6,280,402],{level:'G'});await p.evaluate(()=>{for(const [id,l]of Object.entries(NPCLines))if(l[0]==='dad')HouseFamily.freshest([id]);const S=HouseFamily.debug.speech;S.q.length=0;S.cur=null;S.voice?.stop();S.bub?.close();S.voice=S.bub=null;S.freeze=false;S.last=performance.now();for(const c of Object.values(HouseFamily.chars)){c.talking=false;c.rig.hush()}window.__ackWatch=setInterval(()=>{if(S.cur?.c.id==='dad'&&S.cur.gesture){S.freeze=true;clearInterval(__ackWatch)}},10);House._.setMode('walk');});
 assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'np.dad');await p.keyboard.press('f');await p.waitForTimeout(800);
 const ack=await p.evaluate(()=>({gesture:!!(HouseFamily.debug.speech.cur?.gesture||HouseFamily.debug.speech.q.some(n=>n.c.id==='dad'&&n.gesture)),label:House.SPOTS['np.dad'].label()}));assert(ack.gesture,'exhausted Talk has a visible acknowledgement');assert(!/Talk to/.test(ack.label),ack.label);
 for(let i=0;i<7;i++)await p.keyboard.press('f');assert(await p.evaluate(()=>HouseFamily.debug.speech.q.filter(n=>n.c.id==='dad'&&n.talk).length<=1),'rapid F does not stack unanswered requests');report.acknowledgement={...ack,rapidPresses:7};
 await p.evaluate(()=>{clearInterval(window.__ackWatch);const S=HouseFamily.debug.speech;S.freeze=false;S.q.length=0;S.cur=null;S.voice?.stop();S.bub?.close();S.voice=S.bub=null;HouseFamily.chars.dad.talking=false;});

 // Portrait/landscape phone and tablet use exactly the same seated contact solve.
 for(const [width,height]of [[390,844],[844,390],[768,1024],[1024,768]]){await p.setViewportSize({width,height});await f.view([35,235,375],[141.6,280,402],{level:'G'});await p.evaluate(()=>{const r=HouseFamily.chars.dad.rig;r.set({engage:true,action:'paper'});r.talk(60000,'All right? Come and tell me about your day.');for(let i=0;i<120;i++)r.update(1/60,true);House.dirty()});await p.screenshot({path:out+'seat-'+width+'x'+height+'.png'});}
 assert.deepEqual(f.errors,[]);console.log('ART/GRIP PASS',JSON.stringify({views:report.seats.length,beanbagCm:report.grip.distance}));
}finally{await writeFile(out+'art-grip.json',JSON.stringify(report,null,2));await f.browser.close()}

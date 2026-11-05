// Real family mouth/head and camera tracking, including an interrupted utterance.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],name='Sound'+Date.now().toString(36),password='Throwaway-1999';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
await mkdir('/tmp/sound-house',{recursive:true});
const f=await roomFixture(base,{account:name,password,signup:false,hour:18,onPage:page=>page.addInitScript(()=>{window.voiceFollowCosts=[];const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf.call(window,t=>{const start=performance.now();fn(t);if(fn.name==='follow')voiceFollowCosts.push(performance.now()-start)});})});
try{
 const p=f.page;
 await f.until(()=>HouseFamily?.ready);
 await p.keyboard.press('Shift');
 await p.evaluate(async()=>{
  const F=HouseFamily,S=F.debug.speech;
  st.clearVoiceQueue();S.q.length=0;S.cur=null;S.until=S.hard=0;S.freeze=true;
  F.debug.clock({md:1012,dow:2,t:18.1});
  for(const [id,spot]of Object.entries({dad:'kmug2',mom:'sink',sister:'floorTV'})){F.debug.go(id,spot);F.debug.place(id,spot)}
  F.debug.sim(2,.05);await st.loadVoices();st.prefetch('c2.pocket.dad');
 });
 await f.until(()=>st.voiceReady('c2.pocket.dad'));
 const mouth=await p.evaluate(()=>HouseFamily.chars.dad.rig.mouthWorld(new THREE.Vector3()).toArray());
 await f.view([mouth[0],-mouth[1],280],[mouth[0],-mouth[1],mouth[2]],{level:'G'});
 await p.evaluate(()=>{House._.setMode('walk');const S=HouseFamily.debug.speech;S.freeze=false;S.until=S.hard=0;HouseFamily.say('dad','c2.pocket.dad',{force:true,prio:9})});
 await f.until(()=>HouseFamily.debug.speech.voice?.started);
 await p.evaluate(()=>{
  const F=HouseFamily,S=F.debug.speech;S.freeze=true;window.voice=S.voice;
  window.tracking=[];window.trackingStart=performance.now();
  // The rig's public controller still walks its real path while speech is held.
  F.chars.dad.talking=false;F.chars.dad.hold=0;F.debug.go('dad','kmug3');
  window.trackingTimer=setInterval(()=>{
   const t=performance.now()-trackingStart,c=F.chars.dad,h=voice;
   if(!h?.started||h.ended)return;
   House.P.ry=(t/30)%180;House.dirty();
   const m=c.rig.mouthWorld(new THREE.Vector3()),d=c.rig.bones.head.getWorldDirection(new THREE.Vector3());
   const L=h.ctx.listener,p=h.panner;
   tracking.push({t,m:m.toArray(),d:d.toArray(),p:[p.positionX.value,p.positionY.value,p.positionZ.value],orientation:[p.orientationX.value,p.orientationY.value,p.orientationZ.value],listener:[L.forwardX.value,L.forwardY.value,L.forwardZ.value],camera:House.camera.getWorldDirection(new THREE.Vector3()).toArray(),level:h.level(),state:F.debug.dump().find(x=>x.id==='dad')});
  },40);
 });
 await p.waitForTimeout(4500);
 await p.screenshot({path:'/tmp/sound-house/walking-desktop.png'});
 const data=await p.evaluate(()=>{clearInterval(trackingTimer);return tracking});
 await writeFile('/tmp/sound-house/tracking-raw.json',JSON.stringify(data,null,2));
 const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const settled=data.filter(v=>v.t>500);
 assert(settled.length>5,'Tracking samples');
 assert(dist(data[0].m,data.at(-1).m)>15,'The person really walked');
 const errors=settled.map(v=>dist(v.m,v.p)),headErrors=settled.map(v=>dist(v.d,v.orientation));
 assert(Math.max(...errors)<45,'Panner stays at the moving mouth: '+Math.max(...errors));
 assert(Math.max(...headErrors)<1,'Cone follows head smoothly: '+Math.max(...headErrors));
 assert(dist(settled[0].listener,settled.at(-1).listener)>.2,'Listener follows player turning');
 await p.evaluate(()=>{voice.stop();HouseFamily.debug.speech.freeze=false});
 await p.waitForTimeout(100);
 assert(await p.evaluate(()=>voice.ended&&!Sound.ducked),'Stop and duck release');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'/tmp/sound-house/phone-portrait.png'});
 await p.setViewportSize({width:844,height:390});await p.screenshot({path:'/tmp/sound-house/phone-landscape.png'});
 const followCost=await p.evaluate(()=>{const a=voiceFollowCosts.sort((a,b)=>a-b);return{samples:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}});
 await writeFile('/tmp/sound-house/tracking.json',JSON.stringify({maxMouthErrorCm:Math.max(...errors),maxHeadVectorError:Math.max(...headErrors),followCost,data},null,2));
 assert.deepEqual(f.errors,[]);
 console.log('SOUND HOUSE PASS',JSON.stringify({samples:data.length,walkCm:dist(data[0].m,data.at(-1).m),maxMouthErrorCm:Math.max(...errors),maxHeadVectorError:Math.max(...headErrors),followCost}));
}finally{await f.browser.close()}

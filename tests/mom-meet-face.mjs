// R240: in Chapter 1's first meeting Mom turns to face the player while she talks to them,
// and Talk stays "Wait" until the whole exchange (including her goodbye) has finished.
// Run from any folder: node /path/to/tests/mom-meet-face.mjs [--before]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const before=process.argv.includes('--before'),phase=before?'before':'after';
const out=path.join(here,'shots','mom-meet-face',phase);await mkdir(out,{recursive:true});
const assets=['js/np-life.js'],findings=[],evidence={};
const check=(ok,why)=>{if(!ok){findings.push(why);console.log('FINDING',why);if(!before)throw Error(why)}};
await withTestServer(async base=>{
 const f=await roomFixture(base,{account:'Meet'+Date.now().toString(36),opening:true,hour:14,seed:7,width:1366,height:860,onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:path.join(here,'..'),encoding:'utf8'})}));}});
 const {page:p,until}=f;
 try{
  for(let i=0;i<240&&!(await p.evaluate(()=>!!window.HouseFamily?.ready));i++)await p.waitForTimeout(500);
  await until(()=>!!st.getState()&&!!House.THINGS['st.diary']);
  assert.equal(await p.evaluate(()=>st.current().id),'lad');
  // Fixture: the Game Lad round itself is covered by onboard.mjs; finish it through the story's own event.
  await p.evaluate(()=>st.event('lad'));await until(()=>!!st.getState()?.done.lad);
  assert.equal(await p.evaluate(()=>st.current().id),'meetmom');
  await p.evaluate(()=>HouseFamily.debug.sim(90,0.1));
  const mom=await p.evaluate(()=>{const c=HouseFamily.chars.mom;return{x:c.x,z:c.z,h:c.h,room:c.room}});
  assert.equal(mom.room,'bedroom','Mom reached my door');
  // Stand where the tester stood: beside the bed, well off Mom's line of sight, then look at her.
  const a=-2.15,eye=[mom.x+Math.sin(a)*120,0,mom.z+Math.cos(a)*120];
  await p.evaluate(({eye,mom})=>{const H=House;H.hush();H.setWalkFrom({x:eye[0],y:73-H.STAND,z:eye[2],lvl:'U',seat:0});const P=H.P;Object.assign(P,{x:eye[0],z:eye[2],rx:-8,ry:Math.atan2(mom.x-eye[0],-(mom.z-eye[2]))*180/Math.PI,seat:0,lvl:'U'});H._.setMode('walk');H.dirty()},{eye,mom});
  await p.waitForTimeout(700);
  // Mom is still facing into the hall.
  const angle=()=>p.evaluate(()=>{const c=HouseFamily.chars.mom,P=House.P,want=Math.atan2(P.x-c.x,P.z-c.z);let d=(c.h-want)%(2*Math.PI);if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;const l=House.SPOTS['np.mom']?.label;const label=typeof l==='function'?l():l;const sp=HouseFamily.debug.speech;return{dbg:{hold:+c.hold.toFixed(2),aside:!!c.aside,narrow:!!c.aside?.narrow,seated:!!c.seated,act:c.rig?.st?.action,cur:c.cur?.k,goal:c.goal?.key,h:+c.h.toFixed(2),want:+want.toFixed(2)},off:Math.abs(d)*180/Math.PI,line:sp.cur?.c?.id==='mom'?sp.cur.lineId:null,queued:sp.q.filter(q=>q.c?.id==='mom').map(q=>q.lineId),button:/\bis (busy|listening)$/.test(label||'')?'Wait':'Talk',label}});
  evidence.start=await angle();
  await p.evaluate(()=>HouseFamily.talk?HouseFamily.talk('mom'):House.interact('np.mom'));
  const trace=[];let worstGive=0,worstLeave=0,talkWhileSpeaking=[];
  for(let i=0;i<120;i++){const s=await angle();trace.push(s);
   if(s.line==='c1.mom.give'&&i>3)worstGive=Math.max(worstGive,s.off);
   if(s.line==='c1.mom.give2')worstGive=Math.max(worstGive,s.off);
   if(s.line==='c1.mom.leave')worstLeave=Math.max(worstLeave,s.off);
   if((s.line||s.queued.length)&&s.button==='Talk')talkWhileSpeaking.push(s.line||s.queued[0]);
   if(i===14)await p.screenshot({path:path.join(out,'mom-talking.png')});
   if(!s.line&&!s.queued.length&&i>10)break;await p.waitForTimeout(250)}
  evidence.trace=trace;evidence.worstGive=worstGive;evidence.worstLeave=worstLeave;evidence.talkWhileSpeaking=talkWhileSpeaking;
  console.log('MEASURE start',evidence.start.off.toFixed(0),'worst while giving',worstGive.toFixed(0),'while leaving',worstLeave.toFixed(0),'Talk shown during speech',talkWhileSpeaking.length);
  check(trace.some(s=>s.line==='c1.mom.give'),'Mom never gave the jobs');
  check(worstGive<20,'Mom talked turned '+worstGive.toFixed(0)+'° away from the player');
  check(talkWhileSpeaking.length===0,'Talk came back while Mom was still speaking: '+[...new Set(talkWhileSpeaking)].join(','));
  check(await p.evaluate(()=>!!st.getState()?.done.meetmom),'The meeting did not complete');
 }finally{await writeFile(path.join(out,'evidence.json'),JSON.stringify({phase,findings,evidence},null,1));await f.browser.close()}
});
console.log(before?'SUMMARY mom-meet-face before: '+findings.length+' findings':'PASS mom-meet-face');

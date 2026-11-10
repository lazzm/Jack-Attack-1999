// Matched art fixtures and production state/layout regressions; one browser at
// a time, only disposable localhost data. --before serves HEAD's changed files.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const before=process.argv.includes('--before'),phase=before?'before':'after';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
assert(!only||only.every(name=>['art','hud'].includes(name)),'Use --only=art,hud');
const out=new URL('./shots/fix288/'+phase+'/',import.meta.url);await mkdir(out,{recursive:true});
const evidence={phase,phone:[],washup:[],hud:[]};
await withTestServer(async base=>{
 const password='Throwaway-1999';
 for(const account of ['Jack','TouchFix'])assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 async function fixture(account,touch=false){return roomFixture(base,{account,password,signup:false,resume:true,opening:true,hour:14,seed:1999,touch,width:touch?390:1366,height:touch?844:860,contextOptions:touch?{isMobile:true,deviceScaleFactor:1}: {},storageState:await bonfireLogin(base,password,account,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{
  if(before)for(const file of ['hs-life.js','np-life.js','np-rig.js','hs-touch.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:new URL('../',import.meta.url),encoding:'utf8'})}));
  await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));
 }});}
 let f;
 if(!only||only.includes('art')){
 console.log('START',phase,'desktop');f=await fixture('Jack');
 try{
  const {page:p}=f;await f.until(()=>window.HouseFamily?.ready);
  await p.evaluate(()=>{House.hush();HousePause.close();const F=HouseFamily;F.debug.speech.freeze=true;for(const id of ['hall','lounge','kitchen'])House.buildRoom(House.ROOMS[id]);F.debug.clock({md:1012,dow:2,t:14.1});F.debug.place('mom','phone');F.debug.sim(3,.1);const r=F.chars.mom.rig;for(let i=0;i<180;i++)r.update(1/60,true);});
  for(const [angle,eye]of [['south',[140,210,670]],['southwest',[80,210,672]],['northeast',[170,210,530]]]){
   await f.view(eye,[145,240,610],{level:'G'});
   const state=await p.evaluate(()=>({action:HouseFamily.chars.mom.rig.st.action,goal:HouseFamily.chars.mom.goal.key,visible:House.ROOMS.lounge.handset.visible,heldScale:HouseFamily.chars.mom.rig.bones.p_phone.scale.x}));
   assert.equal(state.action,'phone');assert(state.goal.startsWith('phone@'),'Production weekday routine');if(!before){assert(!state.visible,'Duplicate charger handset');assert(state.heldScale>.99)}
   console.log('CAPTURE',phase,'phone',angle);await p.screenshot({path:new URL('phone-'+angle+'.png',out).pathname});evidence.phone.push({angle,...state});
  }
  await p.evaluate(()=>{const F=HouseFamily;F.debug.clock({md:1012,dow:2,t:14.6});F.debug.sim(180,.1);for(let i=0;i<120;i++)F.chars.mom.rig.update(1/60,true);HouseLife.syncPhone?.();});
  evidence.returned=await p.evaluate(()=>({visible:House.ROOMS.lounge.handset.visible,action:HouseFamily.chars.mom.rig.st.action}));assert(evidence.returned.visible,'Handset never returned after call');
  await f.view([140,210,670],[145,240,610],{level:'G'});await p.screenshot({path:new URL('phone-returned.png',out).pathname});
  // Production sink spot and tool targets, at both standing-eye side angles.
  await p.evaluate(()=>{const F=HouseFamily;F.debug.clock({md:1012,dow:2,t:12.9});F.debug.place('mom','kettle');const c=F.chars.mom;c.hold=0;c.talking=false;c.rig.hush();F.debug.sim(180,.1);const r=c.rig;Object.assign(r.st,{t:12,seed:2.7,blinkAt:Infinity,glanceAt:Infinity,saccadeAt:Infinity});r.set({look:null,engage:false});for(let i=0;i<180;i++)r.update(1/60,true);House.anims.get('ch.npcWashWater')?.();});
  for(const [width,height]of [[1366,860],[390,844],[844,390],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const [angle,eye]of [['left',[-215,225,-55]],['right',[55,225,-55]]]){
    console.log('CAPTURE',phase,'washup',width,height,angle);await f.view(eye,[-80,250,-115],{level:'G'});await p.screenshot({path:new URL('washup-'+width+'x'+height+'-'+angle+'.png',out).pathname});
    const sample=await p.evaluate(()=>{const r=HouseFamily.chars.mom.rig;r.group.updateMatrixWorld(true);return{footZ:r.st.z,eye:r.eyeWorld(new THREE.Vector3()).toArray(),sponge:r.bones.p_sponge.localToWorld(new THREE.Vector3(0,-1,1.5)).multiply(new THREE.Vector3(1,-1,1)).toArray(),surface:r.workSurface('washup'),lean:(r.bones.spine.rotation.x+r.bones.chest.rotation.x)*180/Math.PI}});
    if(!before){assert(Math.abs(sample.footZ+97)<=1,'Routine never reaches the working stance');assert(Math.abs(sample.sponge[1]-sample.surface.y)<.5,'Sponge outside water: '+JSON.stringify(sample));assert(Math.abs(sample.lean)<35,'Excessive sink lean');assert(sample.eye[1]<225,'Head too low')}
    evidence.washup.push({width,height,angle,...sample});
   }
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close();}
 }
 if(!only||only.includes('hud')){
 console.log('START',phase,'touch');f=await fixture('TouchFix',true);
 try{
  const {page:p}=f;await f.until(()=>window.ChoreKit?.MODS.tidy?._built&&window.HouseTouch&&window.HouseFamily?.ready);
  const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:195,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await p.evaluate(()=>{House.hush();HousePause.close();ChoreKit.begin('tidy');HouseFamily.debug.speech.freeze=true;HouseFamily.debug.speech.q.length=0;HouseFamily.debug.speech.cur=null;NPCBubble.clear();});
  // Aim at the real bin bag: same post-placement hover target as R238.
  for(const [width,height]of [[390,844],[844,390],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});await f.view([-30,-55,90],[-118,50,-42]);
   await p.evaluate(()=>{House._.setMode('walk');HousePause.close();House.W.eyeNow=House.W.eye;const P=House.P;P.y=House.W.fy-House.W.eye;P.rx=Math.atan2(-(50-P.y),Math.hypot(-118-P.x,-42-P.z))*180/Math.PI;P.ry=Math.atan2(-118-P.x,-(-42-P.z))*180/Math.PI;NPCBubble.clear();House.dirty();ChoreKit.chip('tidy');HouseTouch.render();});
   await p.waitForTimeout(600);
   if(width===390){
    const id=await p.evaluate(()=>{const t=Object.values(House.THINGS).find(t=>t.kind==='mess.rubbish'&&!t.at.hide);return t&&House.grab(t.id)?t.id:null});
    assert(id,'No disposable rubbish item to carry');
    for(let i=0;i<120&&!(await p.evaluate(()=>House.ghost()?.snap?.id==='ch.s.bin'));i++)await p.waitForTimeout(250);
    const goldState=await p.evaluate(()=>({held:House.held(),room:House.here,mode:House.mode,ghost:House.ghost()&&{ok:House.ghost().ok,why:House.ghost().why,snap:House.ghost().snap?.id},bin:House.THINGS.bin.at}));
    assert(goldState.ghost?.snap==='ch.s.bin','No gold bin target: '+JSON.stringify(goldState));
    await p.screenshot({path:new URL('bin-gold-390x844.png',out).pathname});
    await p.locator('.ht-acts [data-k="e"]').tap();await f.until(()=>!House.held());
    await f.until(id=>ChoreKit.has('tidy',id.slice(5)),id);
    await p.evaluate(()=>ChoreKit.chip('tidy'));await p.waitForTimeout(500);
    evidence.placement=await p.evaluate(id=>({id,completed:ChoreKit.has('tidy',id.slice(5)),held:House.held(),state:House.THINGS[id].st}),id);
    assert(evidence.placement.completed,'Native touch gold placement failed');
   }
   const layout=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};const t=document.querySelector('.ht-target'),j=document.querySelector('.ch-chip');return{label:t.textContent,on:t.classList.contains('on'),target:rect(t),job:rect(j),touch:GameInput.touch}});
   console.log('CAPTURE',phase,'bin',width,height,JSON.stringify(layout));await p.screenshot({path:new URL('bin-'+width+'x'+height+'.png',out).pathname});
   assert(layout.touch&&layout.on,'Real touch hover not visible: '+JSON.stringify(layout));
   const a=layout.target,b=layout.job;layout.overlap=a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
   if(!before)assert(!layout.overlap,'Hover label covers job title: '+JSON.stringify(layout));
   evidence.hud.push({width,height,...layout});
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close();}
 }
});
await writeFile(new URL(only?'evidence-'+only.join('-')+'.json':'evidence.json',out),JSON.stringify(evidence,null,2)+'\n');
console.log('PASS fix288',phase,JSON.stringify({phone:evidence.phone.length,washup:evidence.washup.length,hud:evidence.hud.length,returned:evidence.returned}));

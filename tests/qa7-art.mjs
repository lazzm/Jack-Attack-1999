// Matched native views; fixtures only establish approaches/line selection.
import assert from 'node:assert/strict';
import {devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
import {playCase} from './case-actions.mjs';
import {withTestServer} from './perf/server.mjs';
const before=process.argv.includes('--before'),only=(process.argv.find(a=>a.startsWith('--only='))||'--only=handheld,dad,car').slice(7).split(','),out=new URL('./shots/qa7-fixes/'+(before?'before':'after')+'/',import.meta.url).pathname;
await mkdir(out,{recursive:true});const results=[];
await withTestServer(async base=>{
 for(const name of only){console.log('START',name);
  const account='Q7'+name.slice(0,2)+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
  const f=await roomFixture(base,{debug:true,account,password,signup:false,touch:name==='handheld',contextOptions:name==='handheld'?{...devices['iPhone 13'],deviceScaleFactor:1}:{},width:name==='handheld'?390:1366,height:name==='handheld'?844:860,hour:10,timeoutScale:3,onPage:async p=>{
   await p.addInitScript(()=>{localStorage.setItem('jhp_touch_slow_asked','true');const t=setInterval(()=>{if(!window.House?.ren)return;clearInterval(t);const r=House.ren,set=r.setPixelRatio.bind(r);window.qa7Raster=set;r.setPixelRatio=n=>set(Math.min(n??1,.4));r.setPixelRatio(.4)},20)});
   if(before)for(const file of ['rm-room.js','hs-world.js','np-rig.js','np-life.js','np-lines.js','hs-house.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:new URL('../',import.meta.url),encoding:'utf8'})}));
  }}),{page:p,until}=f;
  async function shot(label){await p.evaluate(()=>{qa7Raster(1);House.dirty()});await p.waitForTimeout(300);await p.screenshot({path:out+label+'.png',timeout:90000});await p.evaluate(()=>qa7Raster(.4))}
  try{
   if(name==='handheld'){
    await p.touchscreen.tap(4,4);await playCase(f,'gb.blocks');await p.waitForTimeout(1500);await shot('r115-r235-phone-title');
    for(const k of ['start','a','b','select']){const q=await p.evaluate(k=>RoomTV._dbg().gbScreen(k),k),cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:q.x,y:q.y}]});await p.waitForTimeout(130);assert(await p.evaluate(k=>RoomTV.dbg().held(k),k),'Native '+k+' missed');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}
    for(const [w,h]of [[390,844],[844,390],[768,1024],[1024,768],[1366,860]]){
     await p.setViewportSize({width:w,height:h});await p.waitForTimeout(650);await shot('r115-r235-'+w+'x'+h);
     const labels=await p.evaluate(()=>{
      const o=House.THINGS.gb.obj,T=House.T,labels={};o.updateWorldMatrix(true,true);House.camera.updateMatrixWorld();
      for(const k of ['A','B','SELECT','START']){const map=HouseKit.TEX['rm.gb'+k];let mesh;o.traverse(m=>{if(m.isMesh&&map&&m.material.map===map)mesh=m});if(!mesh){labels[k]={exists:false};continue}mesh.geometry.computeBoundingBox();const v=mesh.geometry.boundingBox.getCenter(new T.Vector3());mesh.localToWorld(v);const ndc=v.clone().project(House.camera),origin=new T.Vector3().setFromMatrixPosition(House.camera.matrixWorld),ray=new T.Raycaster(origin,v.clone().sub(origin).normalize());ray.layers.enableAll();const hits=ray.intersectObject(o,true).filter(h=>!h.object.userData.contactShadow),first=hits[0];labels[k]={exists:true,front:first?.object===mesh,width:mesh.geometry.boundingBox.max.x-mesh.geometry.boundingBox.min.x,hit:first?.object.material.map?.uuid,map:map.uuid};}return labels;
     });results.push({name,w,h,labels});if(!before)for(const k of ['A','B','SELECT','START'])assert(labels[k].exists&&labels[k].front,'Printed '+k+' covered/missing at '+w+'x'+h+': '+JSON.stringify(labels[k]));
    }
    await p.locator('.rm-tools .rm-lean').tap();await until(()=>House.mode==='walk'&&!House.gliding);
   }
   if(name==='dad'){
    await until(()=>HouseFamily.ready);await p.evaluate(()=>{HouseFamily.debug.clock({md:1107,dow:0,t:10});HouseFamily.debug.scene('dad','armchair');HouseFamily.debug.place('dad','armchair');HouseFamily.debug.sim(20,.1);window.NPCDialogue=Object.freeze(Object.fromEntries(Object.entries(NPCDialogue).filter(([id,d])=>d.speaker!=='dad'||d.kind!=='talk'||id==='talk.dad.morning.02')))});
    const at=await p.evaluate(()=>{const c=HouseFamily.chars.dad;return{x:c.x,z:c.z,eye:c.rig.eyeWorld(new THREE.Vector3()).toArray()}});await f.view([at.x-100,210,at.z-45],at.eye,{level:'G'});await p.evaluate(()=>{House._.setMode('walk');HousePause.close()});await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'np.dad');await p.evaluate(()=>{for(const [id,line]of Object.entries(NPCLines))if(line[0]==='dad'&&id!=='talk.dad.morning.02')HouseFamily.freshest([id]);HouseFamily.chars.dad.lastBarkId=null});await p.keyboard.press('f');const deadline=Date.now()+45000;while(Date.now()<deadline){if(await p.evaluate(()=>HouseFamily.debug.speech.cur?.lineId==='talk.dad.morning.02'))break;await p.waitForTimeout(150)}assert.equal(await p.evaluate(()=>HouseFamily.debug.speech.cur?.lineId),'talk.dad.morning.02','Native F did not select staged toast line');
    await p.waitForTimeout(1900);await shot('r234-dad-toast');const mood=await p.evaluate(()=>({id:HouseFamily.debug.speech.cur?.lineId,mood:HouseFamily.chars.dad.rig.st.mood,blend:HouseFamily.chars.dad.rig.st.moodK}));results.push({name,...mood});assert.equal(mood.mood,before?'cross':'cheeky');
   }
   if(name==='car'){
    await until(()=>HouseFamily.ready);await p.evaluate(()=>{HouseFamily.debug.clock({md:1107,dow:0,t:12});House.buildRoom(House.ROOMS.drive)});await until(()=>House.ROOMS.drive.car.present);const frame=await p.evaluate(()=>House.ROOMS.drive.carFrame);
    for(const hour of (process.argv.includes('--night-only')?[22]:[12,22]))for(const level of [0,5])for(const side of ['front','side']){
     await p.evaluate(({hour,level})=>{window.auditHour=hour;HouseFamily.debug.clock({md:1107,dow:0,t:hour});dispatchEvent(new Event('ownerclock'));House.adapt(level,{pin:true,force:true});House.relight()},{hour,level});
     await f.view(side==='front'?[frame.x-25,210,frame.z+270]:[frame.x-180,210,frame.z+100],[frame.x,frame.y-100*frame.s,frame.z],{level:'G'});await shot('r233-car-'+hour+'-light'+level+'-'+side);
     const phase=await p.evaluate(()=>document.getElementById('bootPower').className);assert(phase.includes(hour===22?'rm-night':'rm-day'),'Clock fixture did not update the rendered phase: '+phase);const glass=await p.evaluate(()=>{const mats=new Set();House.ROOMS.drive.car.group.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.name==='car glazing'||m.map===HouseKit.TEX['hs.car.glass'])mats.add(m)});return [...mats].map(m=>({transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,reflection:!!m.envMap}))});results.push({name,hour,level,side,phase,glass});assert(glass.length);if(!before)for(const m of glass){assert(m.transparent&&m.opacity<.55&&!m.depthWrite);assert.equal(m.reflection,level<4)}
    }
    await p.evaluate(()=>House._.setMode('walk'));await p.keyboard.down('ArrowRight');await p.waitForTimeout(400);await p.keyboard.up('ArrowRight');assert.equal(await p.evaluate(()=>House.mode),'walk');await shot('r233-car-native-step');
   }
   assert.deepEqual(f.errors,[]);console.log('PASS',name,before?'before':'after');
  }finally{await f.browser.close();await writeFile(out+'art-results-'+only.join('-')+'.json',JSON.stringify(results,null,2))}
 }
});

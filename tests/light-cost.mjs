// Disposable, sequential comparison of main and working-tree lighting costs.
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const refs=process.argv.slice(2).filter(a=>!a.startsWith('--'));if(!refs.length)refs.push('working');
const dir=new URL('./shots/light/round3/cost/',import.meta.url);await mkdir(dir,{recursive:true});
await withTestServer(async base=>{for(const ref of refs){
 const account='Cost'+Date.now().toString(36),password='Throwaway-1999';await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
 const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,debug:true,storageState:await bonfireLogin(base,password,account,{x:-90,y:-85,z:175,rx:0,ry:0,lvl:'U',seat:0}),hour:12,onPage:async p=>{const heartbeat=setInterval(()=>p.evaluate(()=>({mode:window.House?.mode,loading:!!document.querySelector('.hs-loading,#houseEntry'),bakes:Object.fromEntries(Object.values(window.House?.ROOMS||{}).filter(r=>r.lightBake).map(r=>[r.id,r.lightBake.stats]))})).then(v=>console.log('COST PROGRESS',JSON.stringify(v))).catch(()=>{}),10000);p.once('close',()=>clearInterval(heartbeat));const cpu=Number(process.argv.find(a=>a.startsWith('--cpu='))?.slice(6));if(cpu){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu})}if(ref!=='working')for(const file of ['hs-kit.js','hs-world.js','hs-house.js','rm-room.js','hs-static.js','hs-environment.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({body:execFileSync('git',['show',ref+':app/public/js/'+file],{encoding:'utf8'}),contentType:'application/javascript'}))}});
 try{const p=f.page;await f.until(()=>Object.values(House.ROOMS).every(r=>!r.lightBake||r.lightBake.stats.ready!==false));
 const env=await p.evaluate(()=>{const rows=[],cl=document.getElementById('bootPower').classList;for(const ph of ['night','day','dusk','dawn']){for(const v of ['night','day','dusk','dawn'])cl.remove('rm-'+v);cl.add('rm-'+ph);const t=performance.now();HouseEnvironment.update(0);rows.push({phase:ph,ms:performance.now()-t})}dispatchEvent(new Event('ownerclock'));return rows});
 await p.evaluate(()=>{House.hush();House.ambient.clear();House.anims.clear();House._.setMode('focus');House.adapt(0,{pin:true,force:true});House.showFps(false);House.ren.setPixelRatio(1);House.ren.setSize(64,48,false);House._.renderForBenchmark()});await p.waitForTimeout(3000);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const pacing=await p.evaluate(()=>new Promise(resolve=>{const start=performance.now(),initial=House.perf().frames;House.anims.set('light-cost',()=>true);setTimeout(()=>{House.anims.delete('light-cost');resolve({frames:House.perf().frames-initial,elapsed:performance.now()-start})},1600)}));
 const {profile}=await cdp.send('Profiler.stop');await writeFile(new URL(ref+(process.argv.includes('--cpu=4')?'-cpu4':'')+'-profile.json',dir),JSON.stringify(profile));
 const bake=await p.evaluate(()=>Object.fromEntries(Object.values(House.ROOMS).filter(r=>r.lightBake).map(r=>[r.id,r.lightBake.stats])));const result={ref,env,pacing,bake,errors:f.errors};await writeFile(new URL(ref+(process.argv.includes('--cpu=4')?'-cpu4':'')+'.json',dir),JSON.stringify(result,null,2));console.log('LIGHT COST',JSON.stringify(result));
 }finally{await f.browser.close()}
}});

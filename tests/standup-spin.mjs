import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';

const before=process.argv.includes('--before'),touch=process.argv.includes('--touch');
const tag=(before?'before':'after')+(touch?'-touch':'');
const dir=`shots/standup-spin-${tag}`;await mkdir(dir,{recursive:true});
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18274',{touch});
const results=[];
const shot=name=>page.screenshot({path:`${dir}/${name}.png`});
const difference=(a,b)=>((b-a+540)%360+360)%360-180;
async function traceStart(){await page.evaluate(()=>{
  window.spinTrace=[];window.spinRecording=true;
  const frame=()=>{spinTrace.push({t:performance.now(),ry:House.P.ry,x:House.P.x,y:House.P.y,z:House.P.z,mode:House.mode});if(spinRecording)requestAnimationFrame(frame)};frame();
});}
async function traceEnd(name,target){
  await until(()=>House.mode==='walk');await page.waitForTimeout(350);
  const frames=await page.evaluate(()=>{spinRecording=false;return spinTrace});
  const path=frames.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.ry-frames[i].ry),0);
  const settled=frames.filter(p=>p.mode==='walk');assert(settled.length>1);
  const end=frames.at(-1),last=settled[0];
  const drift=Math.max(...settled.map(p=>Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z)));
  results.push({name,target,path,drift,frames});await shot(name+'-landed');
  if(!before){
    assert(path<=180.1,`${name}: spun ${path.toFixed(2)} degrees`);
    assert(Math.abs(difference(end.ry,target))<.01,`${name}: wrong final heading`);
    assert(drift<.1,`${name}: camera drifted after standing`);
    assert.equal(await page.evaluate(()=>House.gliding),false,`${name}: competing camera glide`);
    const speed=3*Math.abs(difference(frames[0].ry,target))/1100+.01;
    for(let i=1;i<frames.length;i++)if(frames[i-1].mode==='stand'){
      assert(Math.abs(frames[i].ry-frames[i-1].ry)<=speed*(frames[i].t-frames[i-1].t)+1,`${name}: abrupt yaw step`);
    }
  }
  console.log(name,'yaw path',path.toFixed(2),'drift',drift.toFixed(4));
}
try{
  if(before){
    const source=execFileSync('git',['show','HEAD:app/public/js/hs-world.js'],{encoding:'utf8'});
    await page.route('**/js/hs-world.js*',route=>route.fulfill({body:source,contentType:'application/javascript'}));
    await page.reload({waitUntil:'domcontentloaded'});
    await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));
  }
  for(const size of [{width:1366,height:860},{width:390,height:844}]){
    await page.setViewportSize(size);const label=size.width===390?'narrow':'desktop';
    for(const [method,yaw,full] of [['q',730,false],['F2',-725,true],['button',1085,true],['menu',-1075,false]]){
      await view([40,-55,155],[-15,-24,0]);
      // Mouse yaw is intentionally unbounded in the engine. This is the same
      // saved orientation produced by turning more than once while walking.
      await page.evaluate(yaw=>{House._.setMode('walk');House.P.ry=yaw;House.sitDown()},yaw);
      await until(()=>House.mode==='monitor');
      await page.evaluate(()=>House.desktopDisplay(false));
      if(full)await page.keyboard.press('t');
      if(full)assert(await page.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')));
      await traceStart();
      if(method==='button'){
        // The tray chair is inside the actual perspective-mapped desktop.
        if(touch)await page.locator('.hs-standbtn').tap();else await page.locator('.hs-standbtn').click();
      }else if(method==='menu'){
        await page.keyboard.press('Escape');
        if(touch)await page.locator('.hs-pause [data-pause=leave]').tap();else await page.locator('.hs-pause [data-pause=leave]').click();
      }else await page.keyboard.press(method);
      await page.waitForTimeout(350);await shot(`${label}-${method}-transition`);
      await traceEnd(`${label}-${method}`,yaw);
      assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')),false);
    }
  }
  // A partially entered PC used to retain its old glide when Q stood up.
  await view([40,-55,155],[-15,-24,0]);
  await page.evaluate(()=>{House._.setMode('walk');House.P.ry=725;House.bootPC()});
  await page.waitForTimeout(180);await traceStart();await page.keyboard.press('q');
  await traceEnd('interrupted-pc-entry',725);

  if(!before){
    // A stale drag begun before PC entry must never regain the walking camera.
    await view([40,-55,155],[-15,-24,0]);
    await page.evaluate(()=>{
      House._.setMode('walk');House.P.ry=725;
      const pb=document.getElementById('bootPower');
      pb.dispatchEvent(new PointerEvent('pointerdown',{pointerId:41,clientX:100,clientY:100,pointerType:'touch',bubbles:true}));
      pb.dispatchEvent(new PointerEvent('pointermove',{pointerId:41,clientX:120,clientY:100,pointerType:'touch',bubbles:true}));
      House.sitDown();
    });await until(()=>House.mode==='monitor');await page.keyboard.press('F2');await until(()=>House.mode==='walk');
    const heading=await page.evaluate(()=>House.P.ry);
    await page.evaluate(()=>document.getElementById('bootPower').dispatchEvent(new PointerEvent('pointermove',{pointerId:41,clientX:1100,clientY:100,pointerType:'touch',bubbles:true})));
    assert.equal(await page.evaluate(()=>House.P.ry),heading,'Old pointer drag changed the landed heading');

    // Generic inspection hooks leave Q/Esc priority and the held prop intact.
    const hooks=await page.evaluate(()=>{
      const id='reading.mag.bed',t=House.THINGS[id];window.inspectionAudit={keys:[],ended:0,events:0};
      t.inspectPose={yaw:0,pitch:0,zoom:1};
      t.onInspectKey=ev=>inspectionAudit.keys.push(ev.key);
      t.onInspectEnd=()=>{inspectionAudit.ended++;inspectionAudit.endMode=House.mode;inspectionAudit.held=House.held()};
      House.on('inspect-end',got=>{if(got===id)inspectionAudit.events++});
      House.grab(id);House.inspect(id);
      return{yaw:t.obj.rotation.y,pitch:t.obj.rotation.x,want:-House.P.ry*Math.PI/180};
    });
    assert(Math.abs(hooks.yaw-hooks.want)<.0001);assert.equal(hooks.pitch,0);
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');
    assert(await page.evaluate(()=>HousePause.open&&House.mode==='inspect'));
    await page.keyboard.press('Escape');await page.keyboard.press('q');await until(()=>House.mode==='walk');
    const audit=await page.evaluate(()=>inspectionAudit);
    assert.deepEqual(audit.keys,['ArrowLeft','ArrowRight']);assert.equal(audit.ended,1);assert.equal(audit.events,1);
    assert.equal(audit.endMode,'walk');assert.equal(audit.held,'reading.mag.bed');
    await page.evaluate(()=>{House.putBack();House.saveThings(true)});await page.waitForTimeout(500);
    await page.evaluate(()=>{House.P.ry=725;House.sitDown()});await until(()=>House.mode==='monitor');
    await page.keyboard.press('t');await page.keyboard.press('F2');await page.waitForTimeout(160);
    await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));
    assert.equal(await page.evaluate(()=>House.mode),'walk');
    assert(Math.abs(difference(await page.evaluate(()=>House.P.ry),725))<.01,'Mid-stand refresh changed heading');
    await shot('standing-refresh');
  }
  assert.deepEqual(errors,[]);await writeFile(`${dir}/traces.json`,JSON.stringify(results,null,2)+'\n');
  console.log(`STAND-UP ${tag.toUpperCase()} PASS: Q/F2/chair/menu, unwrapped +/- yaw, LOCK IN, desktop/narrow and interrupted entry${before?'':', stale drag, inspection hooks and refresh'}; zero console errors/warnings`);
}catch(e){await shot('failure');await writeFile(`${dir}/traces.json`,JSON.stringify(results,null,2)+'\n');throw e}
finally{await browser.close()}

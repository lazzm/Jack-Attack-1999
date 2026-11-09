// Native UI evidence and input regression. --before serves unchanged HEAD assets; after uses the working tree. Paths resolve from this test, including when run outside tests/.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const before=process.argv.includes('--before'), phase=before?'before':'after';
const out=new URL('./shots/ui-hud/'+phase+'/',import.meta.url);await mkdir(out,{recursive:true});
const evidence=[],failures=[],only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
// Bound a stalled software renderer as well as ordinary state waits. The
// disposable-server helper handles this signal and stops only its own child.
setTimeout(()=>{console.error('UI HUD exceeded its ten-minute browser budget');process.kill(process.pid,'SIGTERM')},600000).unref();
async function section(name,run){if(!only||only.includes(name)){console.log('SECTION',name);await run()}}
const requested=process.argv.find(a=>a.startsWith('--sizes='))?.slice(8).split(',');
const sizes=[[390,844],[844,390],[740,360],[768,1024],[1366,860]].filter(s=>!requested||requested.includes(s.join('x')));
assert(sizes.length,'No supported UI viewport selected');
for(const touch of [true,false].filter(t=>!process.argv.includes('--desktop')||!t)){
if(!sizes.some(s=>touch?s[0]!==1366:s[0]===1366))continue;
await withTestServer(async base=>{
 const account='Jack',password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
  const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,hour:12,seed:1999,touch,width:touch?390:1366,height:touch?844:860,contextOptions:{isMobile:touch,deviceScaleFactor:1,...(touch?{userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}:{})},storageState:await bonfireLogin(base,password,account,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(before)for(const file of ['js/hs-world.js','js/hs-mobile.js','js/hs-touch.js','css/hs.css','css/hs-touch.css','css/hs-captions.css'])await p.route('**/'+file+'*',route=>route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:new URL('../',import.meta.url),encoding:'utf8'})}));}});
  const {page:p}=f;const until=async(fn,arg)=>{const end=Date.now()+45000;while(Date.now()<end){if(await p.evaluate(fn,arg))return;await p.waitForTimeout(150)}throw Error('UI state timeout: '+fn)};p.setDefaultTimeout(15000);const cdp=await p.context().newCDPSession(p);
  const check=(ok,msg)=>{if(!ok){failures.push(msg);if(!before)throw Error(msg)}};
  async function finger(){if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:9,x:innerSize[0]/2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(200)}}
  let innerSize=[touch?390:1366,touch?844:860];
  async function stage(eye,target){await f.view(eye,target);await p.evaluate(target=>{HousePause.close();House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;const P=House.P;P.y=House.W.fy-House.W.eye;P.rx=Math.atan2(-(target[1]-P.y),Math.hypot(target[0]-P.x,target[2]-P.z))*180/Math.PI;P.ry=Math.atan2(target[0]-P.x,-(target[2]-P.z))*180/Math.PI;House.dirty()},target);await finger();await p.waitForTimeout(400)}
  async function press(k){const b=p.locator('.ht-hud [data-k="'+k+'"]');if(touch&&await b.isVisible())await b.tap();else await p.keyboard.press(k)}
  async function shot(name){await p.evaluate(()=>House.dirty());await p.waitForTimeout(180);console.log('CAPTURE',phase,innerSize.join('x'),name);const path=fileURLToPath(new URL(innerSize.join('x')+'-'+name+'.png',out));await p.screenshot({path,scale:'css',timeout:60000});return path}
  try{
   await section('pc',async()=>{
   // A production F ray enters the monitor, then real T/LOCK IN toggles both ways.
   await p.evaluate(()=>House.putBack());await stage([40,-55,155],[-15,-24,0]);console.log('PC ENTRY',await p.evaluate(()=>({held:House.held(),mode:House.mode,pick:House.pick(innerWidth/2,innerHeight/2)?.spot})));check(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot==='pc'),'PC fixture must aim at the real PC');await press('f');await until(()=>House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());
   await p.waitForTimeout(700);if(await p.evaluate(()=>House.desktopDisplay()))await press(touch?'lock':'t');await until(()=>!House.anims.has('pc-lock'));
   for(const [width,height]of sizes.filter(s=>touch?s[0]!==1366:s[0]===1366)){
    innerSize=[width,height];await p.setViewportSize({width,height});await finger();await p.waitForTimeout(700);
    const layout=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};return{taskbar:rect(document.querySelector('#taskbar')),chin:window.GameInput.touch?rect(document.querySelector('.ht-top')):null,controls:[...document.querySelectorAll('#taskbar button,#tray [role=button],#clock')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{id:e.id||e.textContent.trim(),...rect(e),hit:e===hit||e.contains(hit)}})}});
    const path=await shot('pc');evidence.push({size:innerSize,state:'pc',path,...layout});
    check(!layout.chin||layout.taskbar.bottom<=layout.chin.y-1,innerSize+' taskbar covered by chin');
    check(layout.controls.every(c=>c.hit),innerSize+' taskbar control obscured');
    if(!before){const start=p.locator('#startBtn');if(touch)await start.tap();else await start.click();await until(()=>document.getElementById('startBtn').getAttribute('aria-expanded')==='true');if(touch)await start.tap();else await start.click();
     await p.evaluate(()=>{window.uiTaskClicks=[];window.addEventListener('click',e=>{const b=e.target.closest('#taskbar button');if(e.isTrusted&&b)uiTaskClicks.push(b.id||b.className)},true)});
     const buttons=await p.locator('#taskbar button[id]:not(#startBtn)').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>e.id));
     for(const id of buttons){const b=p.locator('#'+id);if(touch)await b.tap();else await b.click();check(await p.evaluate(id=>uiTaskClicks.includes(id),id),innerSize+' taskbar '+id+' missed native input');if(id==='sfxBtn'){check(await p.locator('.sys-volpop').isVisible(),innerSize+' speaker did not open Volume');if(touch)await b.tap();else await b.click()}}
     evidence.at(-1).nativeButtons=buttons;
     // Each tray program has now received trusted input. Close these test-only
     // windows through their ordinary handlers before the next viewport, so
     // the comparison stays on the same desktop and does not accumulate apps.
     await p.evaluate(()=>{for(const b of document.querySelectorAll('#monitorSurface .win:not(#browser) .ctl button[aria-label="Close"]'))b.click();window.IE?.go?.('home','click')});
    }
    await press(touch?'lock':'t');await until(()=>House.desktopDisplay()&&!House.anims.has('pc-lock'));await shot('pc-lock');await press(touch?'lock':'t');await until(()=>!House.desktopDisplay()&&!House.anims.has('pc-lock'));
    if(!before&&touch&&width===844){await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());await finger();check(!await p.evaluate(()=>House.desktopDisplay()),'PC refresh changed the saved In room choice');await shot('pc-refresh');}
    if(!before){
     const stand=p.locator('.hs-standbtn');if(touch)await stand.tap();else await stand.click();await until(()=>House.mode==='walk'&&!House.gliding);
     await stage([40,-55,155],[-15,-24,0]);await press('f');await until(()=>House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());await p.waitForTimeout(500);
     if(await p.evaluate(()=>House.desktopDisplay()))await press(touch?'lock':'t');await until(()=>!House.anims.has('pc-lock'));await finger();
     const returned=await p.evaluate(()=>({bottom:document.querySelector('#taskbar').getBoundingClientRect().bottom,chin:GameInput.touch?document.querySelector('.ht-top').getBoundingClientRect().top:innerHeight}));check(returned.bottom<returned.chin,innerSize+' taskbar obscured on return');await shot('pc-return');
    }
   }
   await press(touch?'stand':'q');await until(()=>House.mode==='walk'&&!House.gliding);
   });
   await section('phone',async()=>{
   // Real F at the phone, not an API-opened close-up.
   const home=await p.evaluate(()=>HouseMobile.thing.at);let hit=false;
   for(const eye of [[90,-70,60],[40,-70,85],[105,-70,20],[65,-70,30]]){await stage(eye,[home.x,home.y-2,home.z]);if(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot==='mobile')){hit=true;break}}
   assert(hit,'Phone fixture ray');await press('f');await until(()=>window.FamilyPhone?.isOpen()&&House.focused&&!House.gliding);await p.keyboard.press('c');await p.keyboard.press('Enter');await until(()=>FamilyPhone.state().id==='menu');
   for(const [width,height]of sizes.filter(s=>touch?s[0]!==1366:s[0]===1366)){
    innerSize=[width,height];await p.setViewportSize({width,height});await finger();await p.waitForTimeout(500);
    const keys=await p.locator('.hs-phone-key').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height}}));
    const lcd=await p.evaluate(()=>{const H=House,o=HouseMobile.thing.obj,m=o.children.find(o=>o.isMesh&&o.material?.map?.image?.classList?.contains('tb-lcd'));o.updateWorldMatrix(true,true);const matrix=new H.T.Matrix4().copy(H.root.matrixWorld).invert().multiply(m.matrixWorld),points=Array.from({length:m.geometry.attributes.position.count},(_,i)=>{const v=new H.T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(matrix);return H.toScreen(v.x,v.y,v.z)});const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));return{x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y}});
    const path=await shot('phone-menu');evidence.push({size:innerSize,state:'phone',path,keys,lcd});if(touch)check(lcd.w>=192&&lcd.h>=120,innerSize+' LCD too small to read');check(keys.length===16,innerSize+' sixteen phone keys');
    if(touch)check(keys.every(r=>r.w>=43.9&&r.h>=43.9&&r.x>=0&&r.y>=0&&r.x+r.w<=width&&r.y+r.h<=height),innerSize+' phone keys below 44px or clipped');
    if(!before){const down=p.locator('.hs-phone-key[aria-label="Phone Down"]:visible');const old=await p.locator('.tb-lcd').evaluate(e=>e.toDataURL());if(touch)await down.tap();else await down.click();check(await p.locator('.tb-lcd').evaluate((e,old)=>e.toDataURL()!==old,old),innerSize+' phone Down did not redraw the LCD');await p.keyboard.press('c');await p.keyboard.press('Enter');}
   }
   await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding&&!House.focused);
   });
   await section('carry',async()=>{
   // Real E at a filled shelf case, R and Q, then a real Place input at a green ghost.
   const caseHome=await p.evaluate(()=>House.THINGS['media.box.n64.kart'].at);await stage([-220,-55,35],[caseHome.x,caseHome.y-6,-36]);await press('e');await until(()=>House.held()==='media.box.n64.kart');
   for(const [width,height]of sizes.filter(s=>touch?s[0]!==1366:s[0]===1366)){
    innerSize=[width,height];await p.setViewportSize({width,height});await stage([-80,-55,220],[-130,73,145]);await p.waitForTimeout(400);
    const path=await shot('carrying');const layout=await p.evaluate(()=>({text:document.querySelector('.hs-hold').innerText,ghost:(()=>{const g=House.ghost();return g&&{ok:g.ok,why:g.why,snap:g.snap?.id}})(),primary:[...document.querySelectorAll('.hs-hold [data-h=put],.ht-carrying [data-k=e]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').length}));evidence.push({size:innerSize,state:'carry',path,...layout});check(layout.primary===1,innerSize+' one visible Place action');
   }
   await press('r');await p.waitForTimeout(400);let placed=false;
   for(const target of [[-130,73,145],[-180,73,145],[-180,73,190],[-70,73,120]]){
    await stage([-80,-55,220],target);if(!await p.evaluate(()=>House.ghost()?.ok))continue;
    if(touch)await press('e');else await p.locator('.hs-hold [data-h=put]').click();await until(()=>!House.held());placed=true;break;
   }
   assert(placed,'Native Place control must put the case at its green ghost');
   });
   await section('pause',async()=>{
   for(const [width,height]of sizes.filter(s=>touch?s[0]!==1366:s[0]===1366)){
    innerSize=[width,height];await p.setViewportSize({width,height});await finger();await p.keyboard.press('Escape');await until(()=>HousePause.open);const dlg=p.locator('.hs-pause');await dlg.evaluate(e=>e.scrollTop=0);await finger();await shot('pause-top');
    const needsScroll=await dlg.evaluate(e=>e.scrollHeight>e.clientHeight);if(touch&&needsScroll){const r=await dlg.boundingBox(),x=r.x+r.width-26,y0=Math.min(height-30,r.y+r.height-40),y1=Math.max(r.y+110,height*.25);
     console.log('SCROLL START',innerSize,r,await p.evaluate(()=>({width:innerWidth,height:innerHeight,scale:visualViewport.scale,html:getComputedStyle(document.documentElement).touchAction,dialog:getComputedStyle(document.querySelector('.hs-pause')).touchAction,hit:document.elementFromPoint(350,780)?.className})));for(let n=0;n<4;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x,y:y0,force:1,radiusX:6,radiusY:6}]});for(let i=1;i<=4;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:7,x,y:y0+(y1-y0)*i/4,force:1,radiusX:6,radiusY:6}]});await p.waitForTimeout(50)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(120)}
    }else if(!touch){await dlg.hover();await p.mouse.wheel(0,2000)}await p.waitForTimeout(300);
    const scroll=await dlg.evaluate(e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));console.log('SCROLL END',scroll);const path=await shot('pause-scrolled');check(scroll.max===0||scroll.top>0,innerSize+' Pause scroll input did not move');const resume=await p.locator('[data-pause=resume]').evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{x:r.x,y:r.y,w:r.width,h:r.height,hit:e===hit||e.contains(hit)}});evidence.push({size:innerSize,state:'pause',path,resume,scroll});check(resume.y>=0&&resume.y+resume.h<=height&&resume.hit,innerSize+' Resume unreachable while scrolled');
    if(!before){if(touch)await p.locator('[data-pause=resume]').tap();else await p.locator('[data-pause=resume]').click()}else await p.keyboard.press('Escape');await until(()=>!HousePause.open);
   }
   });
   assert.deepEqual(f.errors,[]);console.log('PASS UI HUD '+(touch?'touch':'desktop'));
  }finally{await f.browser.close();await writeFile(new URL('evidence-'+(only?.join('-')||'all')+'-'+(touch?'touch':'desktop')+'.json',out),JSON.stringify({phase,evidence,failures},null,2))}
});
}
console.log('UI HUD '+phase+': '+evidence.length+' states; '+failures.length+' layout findings');

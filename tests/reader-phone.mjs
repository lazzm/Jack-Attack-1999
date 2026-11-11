// R239: the phone magazine reader opens with the whole page visible, square to the camera and readable;
// one finger pans when magnified and turns pages when not; two fingers pinch to zoom.
// Run from any folder: node /path/to/tests/reader-phone.mjs [--before] [--sizes=390x844,844x390,768x1024]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const before=process.argv.includes('--before'),phase=before?'before':'after';
const out=path.join(here,'shots','reader-phone',phase);await mkdir(out,{recursive:true});
const requested=process.argv.find(a=>a.startsWith('--sizes='))?.slice(8).split(',');
const sizes=[[390,844],[844,390],[768,1024]].filter(s=>!requested||requested.includes(s.join('x')));
const assets=['js/magazines.js','js/hs-world.js','js/hs-touch.js','style.css'];
const evidence=[],findings=[];
const check=(ok,why)=>{if(!ok){findings.push(why);console.log('FINDING',why);if(!before)throw Error(why)}};
await withTestServer(async base=>{
 const name='Reader',password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
 const f=await roomFixture(base,{account:name,password,signup:false,resume:true,opening:true,hour:12,seed:1999,touch:true,width:390,height:844,contextOptions:{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'},storageState:await bonfireLogin(base,password,name,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.js')?'application/javascript':'text/css',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:path.join(here,'..'),encoding:'utf8'})}));}});
 const {page:p}=f;p.setDefaultTimeout(20000);
 const until=async(fn,arg)=>{const end=Date.now()+60000;while(Date.now()<end){if(f.errors.length)throw Error(f.errors.join('; '));if(await p.evaluate(fn,arg))return;await p.waitForTimeout(150)}throw Error('State timeout '+fn)};
 const cdp=await p.context().newCDPSession(p);let size=sizes[0];
 async function touch(points,type='touchStart'){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))})}
 async function finger(){await touch([[9,size[0]/2,2]]);await touch([],'touchCancel')}
 async function resize(s){size=s;await p.setViewportSize({width:s[0],height:s[1]});await finger();await p.waitForTimeout(650)}
 async function swipe(x,y,dx,dy,steps=8){await touch([[1,x,y]]);for(let i=1;i<=steps;i++){await touch([[1,x+dx*i/steps,y+dy*i/steps]],'touchMove');await p.waitForTimeout(30)}await touch([],'touchEnd');await p.waitForTimeout(350)}
 // A player who has just picked the magazine up off the bed is looking down at it.
 async function stage(){const c=await p.evaluate(()=>{const H=House;HousePause.close();H.hush();const t=H.THINGS['reading.mag.bed'];const v=new H.T.Box3().setFromObject(t.obj).getCenter(new H.T.Vector3());return[v.x,-v.y,v.z]});await f.view([c[0]-55,c[1]-70,c[2]+45],c);await p.evaluate(()=>{House._.setMode('walk');House.W.eyeNow=House.W.eye;House.dirty()});await finger();await p.waitForTimeout(550)}
 async function shot(state,details={}){const file=path.join(out,size.join('x')+'-'+state+'.png');await p.screenshot({path:file,scale:'css'});evidence.push({size,state,file,...details});console.log('CAPTURE',size.join('x'),state);return file}
 // The page's corners on screen, and how square the page is to the camera.
 const measure=()=>p.evaluate(()=>{const H=House,root=H.THINGS[Magazines.reading.id].obj,pts=[];root.updateWorldMatrix(true,true);
  root.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position||o.userData.contactShadow)return;for(let a=o;a&&a!==root.parent;a=a.parent)if(!a.visible)return;const g=o.geometry.attributes.position;for(let i=0;i<g.count;i++){const v=new H.T.Vector3().fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld).project(H.camera);pts.push([(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2])}});
  const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1])),w=Math.max(...pts.map(p=>p[0]))-x,h=Math.max(...pts.map(p=>p[1]))-y;
  const n=new H.T.Vector3(0,0,1).applyQuaternion(root.getWorldQuaternion(new H.T.Quaternion())),cf=new H.T.Vector3(0,0,-1).applyQuaternion(H.camera.getWorldQuaternion(new H.T.Quaternion()));
  const up=new H.T.Vector3(0,1,0).applyQuaternion(root.getWorldQuaternion(new H.T.Quaternion())),cu=new H.T.Vector3(0,1,0).applyQuaternion(H.camera.getWorldQuaternion(new H.T.Quaternion()));
  const panel=document.querySelector('.hs-inspection').getBoundingClientRect(),hud=[...document.querySelectorAll('.ht-top .ht-b,.hs-tin,.hs-top')].filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}});
  return{x,y,w,h,vw:innerWidth,vh:innerHeight,tilt:Math.acos(Math.min(1,Math.abs(n.dot(cf))))*180/Math.PI,roll:Math.acos(Math.max(-1,Math.min(1,-up.dot(cu))))*180/Math.PI,panel:{x:panel.x,y:panel.y,w:panel.width,h:panel.height},hud,phase:Magazines.reading.phase,page:Magazines.reading.page,view:H.inspectView()}});
 const fits=(m,label)=>{const room=m.vw>m.vh&&m.vh<500?{r:m.panel.x,b:m.vh}:{r:m.vw,b:m.panel.y};check(m.x>=-1&&m.y>=-1&&m.x+m.w<=room.r+1&&m.y+m.h<=room.b+1,label+': page cropped '+JSON.stringify([m.x,m.y,m.w,m.h].map(Math.round))+' in '+m.vw+'x'+m.vh);check(m.tilt<3,label+': page tilted '+m.tilt.toFixed(1)+'°');check(m.roll<3,label+': page rolled '+m.roll.toFixed(1)+'°');
  // Readable: the single page fills most of the free width (or height) without zooming.
  check(m.w>=Math.min(room.r,m.vw)*.8||m.h>=room.b*.8,label+': page too small '+Math.round(m.w)+'x'+Math.round(m.h))};
 try{
  for(const s of sizes){
   await resize(s);await stage();
   const look=await p.evaluate(()=>House.P.rx);
   assert(await p.evaluate(()=>House.grab('reading.mag.bed')));await p.waitForTimeout(300);
   // Pick it up, then press F (the More → Read path calls the same use).
   await p.keyboard.press('f');await until(()=>House.mode==='inspect'&&!!Magazines.reading);await p.waitForTimeout(900);
   const cover=await measure();await shot('cover',{look,cover});fits(cover,s.join('x')+' cover');
   await p.locator('[data-turn="1"]').tap();await until(()=>!Magazines.reading.flipping);await p.waitForTimeout(500);
   if(await p.evaluate(()=>Magazines.reading.phase!=='pages')){await p.locator('[data-turn="1"]').tap();await until(()=>!Magazines.reading.flipping);await p.waitForTimeout(500)}
   const page=await measure();await shot('page',{page});fits(page,s.join('x')+' page');
   // One finger, not magnified: a left swipe turns to the next page; the page stays square.
   const room=page.vw>page.vh&&page.vh<500?page.panel.x:page.vw,cx=room/2,cy=page.vw>page.vh&&page.vh<500?page.vh/2:page.panel.y/2;
   const p0=page.page;await swipe(cx+80,cy,-170,0);await until(()=>!Magazines.reading.flipping);await p.waitForTimeout(300);
   const turned=await measure();await shot('swiped',{turned});check(turned.page>p0,s.join('x')+' swipe did not turn the page ('+p0+' -> '+turned.page+')');check(turned.tilt<3,s.join('x')+' one-finger swipe tilted the page '+turned.tilt.toFixed(1));
   // Two fingers pinch to magnify.
   await touch([[21,cx-50,cy],[22,cx+50,cy]]);for(let i=1;i<=8;i++){await touch([[21,cx-50-i*9,cy],[22,cx+50+i*9,cy]],'touchMove');await p.waitForTimeout(50)}await touch([],'touchEnd');await p.waitForTimeout(450);
   const big=await measure();await shot('pinched',{big});check(big.w>turned.w*1.3,s.join('x')+' pinch did not magnify');
   // One finger now pans along the line, without turning the page or the paper.
   await swipe(cx+60,cy,-120,-40);await p.waitForTimeout(300);
   const panned=await measure();await shot('panned',{panned});check(panned.page===big.page,s.join('x')+' one-finger drag while magnified turned the page');check(panned.tilt<3,s.join('x')+' one-finger drag while magnified tilted the page');check(panned.x<big.x-60,s.join('x')+' one-finger drag did not pan ('+Math.round(big.x)+' -> '+Math.round(panned.x)+')');
   // Pinch back out, then leave.
   await touch([[21,cx-130,cy],[22,cx+130,cy]]);for(let i=1;i<=8;i++){await touch([[21,cx-130+i*12,cy],[22,cx+130-i*12,cy]],'touchMove');await p.waitForTimeout(50)}await touch([],'touchEnd');await p.waitForTimeout(400);
   if(!before&&s[0]===390){const saved=await p.evaluate(()=>({page:Magazines.reading.page,pose:House.inspectView()}));await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='inspect'&&!!Magazines.reading&&!document.querySelector('.hs-loading,#houseEntry'));await p.waitForTimeout(900);const restored=await p.evaluate(()=>({page:Magazines.reading.page,pose:House.inspectView()}));check(JSON.stringify(saved)===JSON.stringify(restored),'Reading refresh changed bookmark/view '+JSON.stringify([saved,restored]));const m=await measure();await shot('refresh',{m});check(m.tilt<3,'refresh tilted the page');}
   await p.locator('.magazine-back').tap();await until(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.putBack());await until(()=>!House.held());
  }
 }finally{await writeFile(path.join(out,'evidence.json'),JSON.stringify({phase,findings,evidence},null,1));await f.browser.close()}
});
console.log(before?'SUMMARY reader-phone before: '+findings.length+' findings':'PASS reader-phone');

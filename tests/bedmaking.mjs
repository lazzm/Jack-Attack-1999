// Real mouse/touch cloth gestures and E placements, disposable local account only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {provisionedRoom} from './provisioned-room.mjs';
const f=await provisionedRoom(process.argv[2],{account:'Jack',timeoutScale:3,touch:true}),{page:p,until}=f;
const dir=fileURLToPath(new URL('shots/'+(process.env.BED_SHOTS||'bedmaking')+'/',import.meta.url));await mkdir(dir,{recursive:true});
async function shot(n){await p.screenshot({path:dir+n+'.png'});console.log('Captured',n)}
async function walk(){await p.evaluate(()=>{House.hush();House.setWalkFrom({x:105,y:-70,z:115,lvl:'U',seat:0});House._.setMode('walk');House.P.rx=-35;House.P.ry=45;House.saveWalkState();House.dirty()});await p.waitForTimeout(400)}
async function put(id,snap){
 await walk();await p.evaluate(()=>{const P=House.P;P.rx=-40;P.ry=Math.atan2(180-P.x,-(10-P.z))*180/Math.PI;House.dirty()});
 assert(await p.evaluate(id=>House.grab(id),id));
 for(let i=0;i<5;i++)await p.keyboard.press('+');await p.keyboard.press('e');await p.waitForTimeout(1300);
 const state=await p.evaluate(id=>({at:House.THINGS[id].at,snap:House.THINGS[id].snap,held:House.held(),ghost:House.ghost()}),id);assert.equal(state.snap,snap,JSON.stringify(state));
}
async function open(){await walk();await p.evaluate(()=>House.act('bed'));await until(()=>!!document.querySelector('.ch-bed-work'));await p.waitForTimeout(600)}
async function leave(){await p.keyboard.press('q');await until(()=>!House.focused&&!House.gliding)}
async function coords(x,z){return p.evaluate(([x,z])=>House.toScreen(x,35,z),[x,z])}
async function drag(points,touch=false,cancel=false,spare=false){
 const pts=[];for(const [x,z]of points)pts.push(await coords(x,z));
 if(touch){const c=await p.context().newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:pts[0].x,y:pts[0].y}]});for(const q of pts.slice(1)){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:q.x,y:q.y}]});await p.waitForTimeout(45)}if(spare){const q=pts.at(-1),main={id:1,x:q.x,y:q.y};await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[main,{id:2,x:20,y:100}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[main]});assert(!await p.evaluate(()=>ChoreKit.has('bed','pullR')),'Releasing a spare finger completed the active drag')}await c.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await c.detach();}
 else{await p.mouse.move(pts[0].x,pts[0].y);await p.mouse.down();for(const q of pts.slice(1))await p.mouse.move(q.x,q.y,{steps:8});await p.mouse.up()}
 await p.waitForTimeout(700);
}
try{
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom');HouseFamily.debug.hide(true)});await until(()=>!!House.THINGS['ch.pjs']);
 await f.view([100,-65,200],[193,35,40]);await shot('01-before');
 await put('ch.pillow','ch.s.pillow');assert(!await p.evaluate(()=>ChoreKit.has('bed','pillow')),'Placement skipped plumping');
 await open();await p.locator('.hs-getup').focus();await p.keyboard.press('Space');await until(()=>!House.focused&&!House.gliding);assert(!await p.evaluate(()=>ChoreKit.has('bed','pillow')),'Back-button Space committed bed work');
 await open();await shot('02-pillow-ready');
 const pt=await coords(190,-33);await p.mouse.click(pt.x,pt.y);assert(!await p.evaluate(()=>ChoreKit.has('bed','pillow')),'One click completed the pillow');
 await drag([[190,-33],[190,-20],[190,-40],[190,-20],[190,-40]]);assert(await p.evaluate(()=>ChoreKit.has('bed','pillow')),'Pillow gesture did not finish');
 await leave();await put('ch.pjs','ch.s.pjs');assert(await p.evaluate(()=>ChoreKit.has('bed','pjs')&&!House.THINGS['ch.pjs'].at.hide));
 const bundle=await p.evaluate(()=>{
  const t=House.THINGS['ch.pjs'],box=new THREE.Box3();t.obj.updateWorldMatrix(true,true);const inv=new THREE.Matrix4().copy(t.obj.matrixWorld).invert();
  t.obj.traverseVisible(o=>{if(o.isMesh&&!o.userData.contactShadow){o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)))}});
  return{parts:House.physics.body(t.id).parts,size:box.getSize(new THREE.Vector3()).toArray(),top:-box.min.y};
 });
 assert.equal(bundle.parts.length,1);for(const [actual,expected]of [[bundle.parts[0].hx,bundle.size[0]/2],[bundle.parts[0].hz,bundle.size[2]/2],[bundle.parts[0].hi,bundle.top]])assert(Math.abs(actual-expected)<.02,'Folded body differs from visible bundle: '+JSON.stringify(bundle));
 await open();await shot('03-pull-ready');
 await drag([[190,105],[190,95]]);assert(!await p.evaluate(()=>ChoreKit.has('bed','pullL')),'Short drag completed pull');
 await p.keyboard.down('Space');await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.keyboard.up('Space');await until(()=>House.paused);assert(!await p.evaluate(()=>ChoreKit.has('bed','pullL')),'Pause committed partial work');
 await p.evaluate(()=>HousePause.close());await until(()=>!House.paused);
 const powerMid=await p.evaluate(()=>localStorage.getItem('jhp_off'));
 const midStart=await coords(190,110),midEnd=await coords(190,90);await p.mouse.move(midStart.x,midStart.y);await p.mouse.down();await p.mouse.move(midEnd.x,midEnd.y,{steps:3});
 await p.reload({waitUntil:'domcontentloaded'});await p.mouse.up();await until(()=>House.live&&House.mode==='walk'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom')});await until(()=>!!House.THINGS['ch.pjs']);
 assert(await p.evaluate(()=>ChoreKit.has('bed','pillow')&&ChoreKit.has('bed','pjs')&&!ChoreKit.has('bed','pullL')),'Refresh lost finished work or committed partial work');
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),powerMid);assert.deepEqual(await p.evaluate(()=>[House.W.x,House.W.z]),[105,115]);await open();
 await drag([[190,110],[190,90],[190,70],[190,50]]);assert(await p.evaluate(()=>ChoreKit.has('bed','pullL')),'Upward drag did not pull duvet');await shot('04-pulled');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);
 await drag([[170,55],[180,55],[190,55],[200,55],[215,55]],true,true);assert(!await p.evaluate(()=>ChoreKit.has('bed','pullR')),'Cancelled touch committed tuck');
 await p.evaluate(()=>HousePause.close());await drag([[170,55],[180,55],[190,55],[200,55],[215,55]],true,false,true);assert(await p.evaluate(()=>ChoreKit.has('bed','pullR')),'Touch drag did not tuck');await shot('05-phone-tucked');
 await p.setViewportSize({width:844,height:390});await shot('06-phone-landscape');
 await drag(Array.from({length:13},(_,i)=>[i%2?215:170,60]),true);await until(()=>ChoreKit.has('bed','smooth'));await shot('07-complete-focus');await p.locator('.hs-getup').tap();await until(()=>!House.focused&&!House.gliding);
 const before=await p.evaluate(()=>({off:localStorage.getItem('jhp_off'),prog:ChoreKit.S.prog.bed}));
 for(const [width,height,name]of [[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){await p.setViewportSize({width,height});await f.view([100,-65,200],[193,35,40]);await shot('complete-'+name)}
 await p.setViewportSize({width:1366,height:860});
 for(const [name,eye]of [['side',[95,-15,55]],['head',[110,-35,-10]],['foot',[193,-55,220]]]){await f.view(eye,[193,35,35]);await shot('complete-'+name)}
 await walk();await p.evaluate(()=>House.saveWalkState());const pose=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));await p.reload({waitUntil:'domcontentloaded'});await until(()=>House.live&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom')});await until(()=>!!House.THINGS['ch.pjs']);
 assert.deepEqual(await p.evaluate(()=>({x:House.W.x,z:House.W.z})),pose);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),before.off);
 assert(await p.evaluate(()=>['pillow','pjs','pullL','pullR','smooth'].every(s=>ChoreKit.has('bed',s))&&!House.THINGS['ch.pjs'].at.hide&&House.physics.body('ch.pjs').fixed&&House.physics.body('ch.pillow').fixed));
 await shot('08-refresh');
 // Legacy partial save: PJs were hidden before the pillow had been placed.
 await p.evaluate(()=>{delete ChoreKit.S.prog.bed.pillow;delete ChoreKit.S.v.bed.pillowDocked;House.THINGS['ch.pillow'].home={room:'bedroom',x:40,y:73,z:72,ry:80};ChoreKit.home('ch.pillow');House.THINGS['ch.pjs'].at.hide=true;ChoreKit.MODS.bed.sync()});
 assert(await p.evaluate(()=>!House.THINGS['ch.pjs'].at.hide&&House.THINGS['ch.pjs'].at.y===37),'Legacy PJs float without a pillow');
 await f.view([100,-65,200],[193,35,40]);await shot('09-legacy-pjs-first');await walk();
 assert(await p.evaluate(()=>ChoreKit.ownerStart('bed')));assert(await p.evaluate(()=>!House.THINGS['ch.pjs'].at.hide&&House.THINGS['ch.pjs'].at.y===73&&House.THINGS['ch.pillow'].at.y===73));
 assert(await p.evaluate(()=>House.physics.body('ch.pjs').parts[0].hz>10),'Redo kept the folded collider');
 await open();await p.keyboard.down('Space');await until(()=>document.querySelector('.ch-bed-note progress').value===1);await p.keyboard.up('Space');await until(()=>ChoreKit.has('bed','pullL'));
 assert(await p.evaluate(()=>ChoreKit.ownerStart('bed')));assert.equal(await p.locator('.ch-bed-note b').textContent(),'Pull the duvet up','Redo kept a stale bed instruction');await leave();
 assert.deepEqual(f.errors,[]);console.log('BEDMAKING PASS: actual E, mouse pull/fluff, touch tuck/cancel, touch smooth, pause, six sizes, refresh and redo');
}catch(e){console.log(await p.evaluate(()=>({mode:House.mode,focus:House.focused,pose:House.P,prog:ChoreKit.S.prog.bed,v:ChoreKit.S.v.bed})));await shot('failure');throw e}finally{await f.browser.close()}

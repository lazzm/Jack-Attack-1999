const phase=process.env.FIXES5_PHASE||'after',fixed=phase==='after';
const sizes=[[1024,768],[768,1024],[1180,820],[1366,1024]];
const assert=(ok,msg)=>{if(fixed&&!ok)throw Error(msg)};
const capture=async name=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true)))));await p.screenshot({path:`tests/shots/fixes5/${phase}-${name}.png`,timeout:60000});await log(phase+'-'+name,await state())};
const rectangles=async selectors=>p.evaluate(selectors=>Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s),r=e?.getBoundingClientRect(),cs=e&&getComputedStyle(e);return[s,r&&{x:r.left,y:r.top,w:r.width,h:r.height,visible:!!r.width&&!!r.height&&cs.visibility!=='hidden'&&cs.display!=='none',text:e.textContent}]})),selectors);
const overlap=(a,b)=>a?.visible&&b?.visible&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
await p.evaluate(()=>{HousePause.close();RoomTV.close(true)});await wait(()=>!House.gliding);
await p.evaluate(async()=>{await Chores.load();await Chores.part('kitchen');HouseFamily.debug.speech.freeze=false;NPCBubble.clear();House.hush()});
await aim([80,200,30],[-80,220,-84],'G');
await tap(4,200);await p.evaluate(()=>{House.hush();House.grab('ch.sh.beans')});await wait(()=>House.held()==='ch.sh.beans');
await p.waitForTimeout(500);
const note=await p.evaluate(()=>{const el=document.querySelector('.hs-note');return{title:el.querySelector('b').textContent,text:el.querySelector('p').innerHTML}});
await p.evaluate(note=>{NPCBubble.clear();House.hush();House.say(note.title,note.text,600000);window.fixes5Chip=setInterval(()=>ChoreKit.chip('shopping'),1000)},note);
for(const [w,h]of [...sizes,[390,844],[844,390]]){
 await rotate(w,h);await p.waitForTimeout(300);
 const rect=await rectangles(['.hs-hold','.rm-note.on','.ch-chip','.hs-map']);await log(`${phase}-carry-${w}x${h}`,rect);
 assert(rect['.hs-hold']?.visible&&rect['.rm-note.on']?.visible&&rect['.ch-chip']?.visible,'Carry, automatic note and job progress stay visible');
 assert(!overlap(rect['.hs-hold'],rect['.rm-note.on']),'Note covers carry panel');assert(!overlap(rect['.ch-chip'],rect['.rm-note.on']),'Note covers progress');assert(!overlap(rect['.hs-hold'],rect['.ch-chip']),'Progress covers carry panel');
 await capture(`${w}x${h}-shopping`);
 if(w>=600&&h>=600)assert(rect['.hs-map'].visible,'Tablet map visible');
 if(w===1024||w===768){await press('more');await capture(`${w}x${h}-shopping-more`);await press('more');}
}
await p.evaluate(()=>{clearInterval(window.fixes5Chip);House.putBack();House.hush()});
// An ordinary talking distance, with the requested line held for paired captures.
await p.evaluate(()=>{const F=HouseFamily;F.debug.clock({md:1104,dow:4,t:14});F.debug.go('mom','sink');F.debug.place('mom','sink');F.debug.sim(4,.1);const S=F.debug.speech;S.q.length=0;S.cur=null;S.bub?.close();S.voice?.stop();S.bub=S.voice=null;NPCBubble.clear()});
await rotate(1024,768);await target('np.mom',[60,200,20],'G');
await press('f');await wait(()=>HouseFamily.debug.speech.cur?.c?.id==='mom');
await p.evaluate(()=>{const S=HouseFamily.debug.speech;S.freeze=true;clearTimeout(S.bub?.expiry);S.cur.c.rig.talk(60000,S.cur.text,null)});
for(const [w,h]of sizes){
 await rotate(w,h);await p.waitForTimeout(500);await capture(`${w}x${h}-mom-speech`);
 const face=await p.evaluate(()=>{const H=House,r=HouseFamily.chars.mom.rig,v=new H.T.Vector3(),q=world=>{world.project(H.camera);return{x:(world.x+1)*innerWidth/2,y:(1-world.y)*innerHeight/2}};const top=q(r.headTop(v).clone()),mouth=q(r.mouthWorld(v).clone()),span=Math.hypot(top.x-mouth.x,top.y-mouth.y);return{x:Math.min(top.x,mouth.x)-span*.5,y:top.y,w:Math.abs(top.x-mouth.x)+span,h:mouth.y-top.y+span*.25,visible:true}});
 const bubbles=await rectangles(['.np-bub:not(.np-out)','.hs-tin','.ch-jobs']);await log(`${phase}-face-${w}x${h}`,{face,bubbles});assert(await p.evaluate(()=>NPCBubble.live.some(b=>b.key==='mom'&&b.mode==='head')),'Speech is anchored to the visible speaker');assert(!overlap(face,bubbles['.np-bub:not(.np-out)']),'Speech covers Mom face');for(const key of ['.hs-tin','.ch-jobs'])assert(!overlap(bubbles[key],bubbles['.np-bub:not(.np-out)']),'Speech covers '+key);
}
await p.evaluate(()=>{const S=HouseFamily.debug.speech;S.freeze=false;S.q.length=0;S.bub?.close();S.voice?.stop();S.bub=S.voice=null;S.cur=null;NPCBubble.clear();House.hush()});
// Open Menu during the sit glide, then leave directly from the updated menu.
await aim([60,-85,170],[0,-35,-10]);await rotate(1024,768);
await p.evaluate(()=>House.sitDown());await wait(()=>document.documentElement.dataset.touchState==='pc');await press('menu');await log(phase+'-menu-during-sit',await p.evaluate(()=>({mode:House.mode,gliding:House.gliding,open:HousePause.open})));
await wait(()=>House.mode==='monitor'&&!House.gliding);await p.waitForTimeout(250);
for(const [w,h]of sizes){await rotate(w,h);await capture(`${w}x${h}-pause-after-sit`);assert(await p.evaluate(()=>!document.querySelector('[data-pause=leave]').hidden&&!document.querySelector('[name=desktopFull]').disabled),'Pause actions follow sit completion')}
if(fixed){await press('[data-pause=leave]');await wait(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding)}else await press('[data-pause=resume]');
await p.evaluate(async()=>{if(window.Era?.staplesCfg){const c=Era.staplesCfg();c.on=false;Era.staplesSave(c)}House.desktopDisplay(true);await Apps.open('notepad')});await p.waitForTimeout(500);
const noteWin=p.locator('.appwin').filter({has:p.locator('textarea')}).last();await noteWin.locator('.tb .t').tap();await noteWin.locator('textarea').fill('Keep my place through rotation.');await noteWin.locator('textarea').tap();
for(const [w,h]of sizes){
 await rotate(w,h);await noteWin.locator('.tb .t').tap();await capture(`${w}x${h}-jackos-window`);
 const buttons=await noteWin.locator('.ctl button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,label:e.getAttribute('aria-label')||e.dataset.w,near:[-18,18].every(d=>e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2+d)))}}));await log(phase+'-window-controls',buttons);assert(buttons.every(b=>b.w>=44&&b.h>=44&&b.near),'Window target minimum and near-centre hit areas');
}
await rotate(768,1024);await press('#startBtn');await press('#startMenu [data-sm=programs]');
const accessory=p.locator('.menu button').filter({hasText:/^Accessories$/}).first();await accessory.tap();await wait(()=>!![...document.querySelectorAll('.menu')].at(-1)?.textContent.includes('Jotpad'));await p.waitForTimeout(400);await capture('768x1024-start-submenus');
for(const [w,h]of [[1024,768],[1180,820],[1366,1024],[768,1024]]){
 await rotate(w,h);await capture(`${w}x${h}-rotated-submenus`);
 const menus=await p.evaluate(()=>[...document.querySelectorAll('.menu')].map(e=>{const r=e.getBoundingClientRect(),root=document.querySelector('#monitorSurface').getBoundingClientRect(),bar=document.querySelector('#taskbar').getBoundingClientRect();return{x:r.left,y:r.top,right:r.right,bottom:r.bottom,rootRight:root.right,barTop:bar.top,scroll:e.scrollHeight>e.clientHeight,rows:[...e.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)}}));await log(phase+'-menu-bounds',menus);assert(menus.length===2,'Menu hierarchy remains open');for(const m of menus){assert(m.x>=0&&m.right<=m.rootRight+1&&m.y>=0&&m.bottom<=m.barTop+1,'Menu remains on desktop');assert(m.rows.every(h=>h>=44),'Menu rows have finger space')}
}
// Scroll the real overflowing submenu and press its bottom row by a finger.
const menu=p.locator('.menu').last(),mr=await menu.boundingBox();
await drag(mr.x+mr.width/2,mr.y+mr.height-30,mr.x+mr.width/2,mr.y+35,700);
const scrolled=await menu.evaluate(e=>({scroll:e.scrollTop,max:e.scrollHeight-e.clientHeight}));await log(phase+'-submenu-scroll',scrolled);assert(scrolled.max<=0||scrolled.scroll>0,'Overflowing submenu scrolls by a real finger');
assert(await noteWin.locator('textarea').inputValue()==='Keep my place through rotation.','Application text survives menu refit');
await p.evaluate(()=>IE.closeMenus());await press('#startBtn');await capture('ui-complete');
await log('ui-review-complete',phase);

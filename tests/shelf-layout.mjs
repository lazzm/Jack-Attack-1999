import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18350';
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw Error('Throwaway local server only');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']}),errors=[];
const seed=()=>{if(!localStorage.getItem('shelf-layout-seeded')){const own={};for(const id of ['park','city','squigs','rts','keepa','carta','pinball','jaquake','jrt','boss','podracer','pm.os98','pm.gub','pm.mix','pm.netplanet',...Array.from({length:10},(_,i)=>'pm.mag.'+String(i+1).padStart(2,'0'))])own[id]=1;localStorage.setItem('jhp_pm',JSON.stringify({v:1,own,fl:{},seen:{},days:[]}));localStorage.setItem('shelf-layout-seeded','1')}localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))};
async function until(p,fn){for(let i=0;i<250;i++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('timeout '+fn)}
async function fresh(){const ctx=await b.newContext({viewport:{width:1366,height:860}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});await p.addInitScript(seed);await p.goto(base,{waitUntil:'domcontentloaded'});await until(p,()=>window.PMGL?.built&&!document.querySelector('.hs-loading'));return{ctx,p}}
async function stand(p){if(await p.evaluate(()=>House.mode==='monitor'))await p.keyboard.press('F2');await until(p,()=>House.mode==='walk');await p.evaluate(()=>House.hush())}
async function aim(p,id,row,lx=15){await p.evaluate(({id,row,lx})=>{const t=House.THINGS['pmb.'+id],h=t.h,pose={x:-226,y:[-19,11,41,71][row]-.9-h/2-6,z:10-lx,rx:0,ry:-90,lvl:'U',seat:1};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('walk');if(House.held()!==t.id)House.grab(t.id);House.hush();House.dirty()},{id,row,lx});await p.waitForTimeout(450)}
async function valid(p){assert(await p.evaluate(()=>{const rows=[[],[],[],[]];for(const s of Object.values(Apps.store.get('jhp_pm_slots',{}))){const a=s.end-s.th-.8;if(a<-.001||s.end>43.201||rows[s.row].some(([x,y])=>a<y-.001&&s.end>x+.001))return false;rows[s.row].push([a,s.end])}return true}),'Slot reservations overlap or leave the shelf')}
async function view(p,tag){await until(p,()=>window.PMGL?.built&&!document.querySelector('.hs-loading')&&PMGL._q().n===0&&PMGL._q().busy===0);await p.evaluate(()=>{const pose={x:-100,y:10,z:50,rx:0,ry:-74,lvl:'U',seat:0};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('focus');House.hush();House.dirty()});await p.waitForTimeout(400);await p.screenshot({path:'shots/shelf-layout-'+tag+'.png'});await p.evaluate(()=>House._.setMode('walk'))}
const run=Date.now().toString(36).slice(-6),userA='ShelfA'+run,userB='ShelfB'+run;
async function login(p,name){await p.evaluate(name=>Net.send({t:'login',name,pass:'shelf-test-1999'}),name);for(let i=0;i<300;i++){try{if(await p.evaluate(name=>window.Roam?.owner===name&&Net.me.member,name))return;if(await p.locator('[data-u]').count())await p.locator('[data-u]').click();}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('Logon/profile timeout')}
async function sync(p){for(let i=0;i<30;i++){if(await p.evaluate(()=>Roam.syncNow()))return;await p.waitForTimeout(400)}throw Error('Profile did not sync')}
try{
 const a=await fresh(),p=a.p;await stand(p);
 const defaults=await p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{})));
 const rack=await p.evaluate(()=>JSON.stringify(Object.values(House.THINGS).filter(t=>t.id.startsWith('media.')).map(t=>[t.id,t.home])));
 for(const [id,row]of[['keepa',1],['pm.os98',2],['pm.mag.01',3]]){
   await aim(p,id,row);assert.equal(await p.evaluate(row=>!!House.SNAPS['pm.free.'+row].offer,row),true);
   await p.screenshot({path:`shots/shelf-layout-preview-${id}.png`});await p.evaluate(()=>House.drop());await p.waitForTimeout(700);
   assert.equal(await p.evaluate(id=>House.THINGS['pmb.'+id].snap,id),'pm.slot.'+id);assert.equal(await p.evaluate(id=>Apps.store.get('jhp_pm_slots',{})[id].row,id),row);await valid(p);
 }
 await view(p,'rearranged');
 const beforeCancel=await p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{})));await aim(p,'keepa',2,12);await p.keyboard.press('Escape');await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{}))),beforeCancel,'Esc must not change the chosen layout');
 // Two different cases dropped without waiting for either animation.
 await aim(p,'pm.os98',1,11);await p.evaluate(()=>{House.drop();const pose={x:-226,y:11-.9-13.25-6,z:-1,rx:0,ry:-90,lvl:'U',seat:1};Object.assign(House.P,pose);House.setWalkFrom(pose);House.grab('pmb.pm.mag.01');House.drop()});await p.waitForTimeout(700);await valid(p);
 // Grab again before the slide finishes; the old animation must not steal it.
 await aim(p,'keepa',2,12);await p.evaluate(()=>House.drop());await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>House.grab('pmb.keepa')),true);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>House.held()),'pmb.keepa');await p.evaluate(()=>House.putBack());await p.waitForTimeout(700);
 // A refresh during the slide resolves to the committed, reserved home.
 await aim(p,'keepa',0,17);await p.evaluate(()=>House.drop());await p.waitForTimeout(50);await p.reload({waitUntil:'domcontentloaded'});await until(p,()=>window.PMGL?.built&&House.mode==='walk'&&!document.querySelector('.hs-loading'));
 assert.equal(await p.evaluate(()=>Apps.store.get('jhp_pm_slots',{}).keepa.row),0);assert.equal(await p.evaluate(()=>House.THINGS['pmb.keepa'].at.z===House.THINGS['pmb.keepa'].home.z),true);await valid(p);
 const arranged=await p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{})));assert.notEqual(arranged,defaults);
 await p.evaluate(()=>{const t=House.THINGS['pmb.keepa'];t.at={room:'bedroom',x:-110,y:73,z:90,ry:40};t.st='rest';House.place(t);Room.tidy()});await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{}))),arranged);await view(p,'tidied');
 assert.equal(await p.evaluate(()=>JSON.stringify(Object.values(House.THINGS).filter(t=>t.id.startsWith('media.')).map(t=>[t.id,t.home]))),rack);
 // Existing roaming profiles must carry the arrangement between browsers,
 // while another player's layout stays independent. No live accounts used.
 await login(p,userA);await p.waitForTimeout(1200);await sync(p);await a.ctx.close();
 const second=await fresh();await login(second.p,userB);await second.p.waitForTimeout(1200);await sync(second.p);assert.equal(await second.p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{}))),defaults);await second.ctx.close();
 const restored=await fresh();await restored.p.evaluate(()=>window.beforeProfileReload=true);await login(restored.p,userA);await until(restored.p,()=>!window.beforeProfileReload&&window.PMGL?.built&&Roam.owner===Net.me.nick&&!document.querySelector('.hs-loading'));
 assert.equal(await restored.p.evaluate(()=>JSON.stringify(Apps.store.get('jhp_pm_slots',{}))),arranged);await stand(restored.p);await view(restored.p,'profile-restored');
 await restored.p.setViewportSize({width:390,height:844});await view(restored.p,'narrow');await restored.ctx.close();
 assert.deepEqual(errors,[]);console.log('SHELF LAYOUT PASS: placement, races, refresh, tidy, separate players, profile restore');
}finally{await b.close()}

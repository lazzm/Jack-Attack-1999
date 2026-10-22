import assert from'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18464',{storage:{jhp_pm:{v:1,own:{city:1,keepa:1,podracer:1},fl:{},gift:99,opened:{}}}});
async function shot(name){await p.screenshot({path:'shots/print-v2-'+name+'.png'})}
async function inspect(id){await p.evaluate(id=>{House.hush();House._.setMode('walk');House.grab(id);House.inspect(id)},id);await p.waitForTimeout(500)}
async function back(){await p.keyboard.press('q');await p.evaluate(()=>House.putBack());await p.waitForTimeout(350)}
try{
 await p.evaluate(()=>PrintArt.ready);assert.equal(await p.evaluate(()=>Object.keys(PrintArtData).length),9);
 for(const[name,eye,target]of[['back-posters',[-195,-80,50],[-200,-80,-56]],['shuttle',[-50,-70,35],[-52,-82,-56]],['race-poster',[-190,-65,40],[-280,-70,20]],['robot-poster',[-10,-80,140],[-10,-98,250]],['books',[-80,-40,155],[-155,-5,234]]]){await view(eye,target);await shot(name)}
 await until(()=>House.THINGS['pmb.city']&&House.THINGS['pmb.keepa']&&PMGL._q().n===0&&PMGL._q().busy===0);
 for(const id of ['pmb.city','pmb.keepa','pmb.podracer','reading.mag.bed','reading.book.1']){await inspect(id);await shot(id);await p.setViewportSize({width:390,height:844});await shot(id+'-narrow');await p.setViewportSize({width:1366,height:860});await back()}
 await p.evaluate(()=>{Room._.S.f['cart.ps.grav']=1;Room._.emit('find','cart.ps.grav');Room._.S.f['cart.gb.mon']=1;Room._.emit('find','cart.gb.mon')});
 for(const id of ['media.box.ps.grav','media.box.gb.mon']){await until(()=>!!House.THINGS['media.box.gb.mon']);await inspect(id);await shot(id);await back()}
 await p.evaluate(()=>House.buildRoom(House.ROOMS.lounge));await until(()=>!!House.THINGS['vhs.robots']);
 await view([-30,225,390],[-30,320,342],{level:'G'});
 for(const id of ['vhs.robots','vhs.charts','vhs.dog','vhs.mom','vhs.dad','vhs.blank']){await inspect(id);await shot(id);await back()}
 await p.evaluate(()=>IE.navigate('http://www.jackattack.jnet/intergalactic-battles.htm'));await until(()=>IE.current==='starwars'&&!!document.querySelector('#swBody .swhead'));
 assert(!await p.locator('#s-starwars').innerText().then(t=>/star\s+wars/i.test(t)));assert((await p.locator('#addrBar').inputValue()).includes('intergalactic-battles.htm'));
 await p.evaluate(()=>{House.hush();House._.setMode('walk');House.sitDown()});await until(()=>House.mode==='monitor');await shot('space-page');await p.keyboard.press('Escape');await shot('pause-version');await p.setViewportSize({width:390,height:844});await shot('pause-version-narrow');await p.keyboard.press('Escape');await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.mode),'monitor');
 assert.deepEqual(errors,[]);console.log('PRINTED ART PASS: nine decoded originals; wall posters, PC/console boxes, paperbacks/mags, six VHS labels, parody shrine/address, pause version and refresh');
}catch(e){await shot('failure');console.error(await p.evaluate(()=>({mode:House.mode,pm:PMGL._q(),things:Object.keys(House.THINGS).filter(k=>k.startsWith('pmb.'))})));throw e}finally{await browser.close()}

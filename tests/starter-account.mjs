import assert from'node:assert/strict';
import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18461',{account:'test',password:'testing123',storage:{jhp_secrets:{one:1,two:1,three:1},jhp_rm:{f:{'cart.n64.range':1}},jhp_pm:{old:1,own:{rts:1,'cart.ps.run':1},fl:{},gift:99}}});
try{
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
 assert.deepEqual(await p.evaluate(()=>PM.items().map(i=>i.id)),[]);
 assert.deepEqual(await p.evaluate(()=>Object.keys(House.THINGS).filter(k=>k.startsWith('media.')&&!k.startsWith('media.box.')).sort()),['media.gb.blocks']);
 assert.equal(await p.evaluate(()=>Room.owned('n64.kart')),false);assert.equal(await p.evaluate(()=>Room.owned('gb.blocks')),true);
 assert(await p.evaluate(()=>['n64','ps','md','dc','dcbox'].every(id=>!House.SPOTS[id]?.obj?.visible)),'Starter still renders unowned consoles/packaging');
 assert(await p.evaluate(()=>!HouseRooms.rooms.cupboard?.snesObj?.visible),'Starter has the old downstairs console');
 await p.evaluate(()=>Discs.cupboard());await p.waitForTimeout(400);assert.equal(await p.locator('.dc [data-b]').count(),0,'Games cupboard lists unowned games');await p.screenshot({path:'shots/starter-empty-cupboard.png'});await p.evaluate(()=>{for(const w of document.querySelectorAll('.dc-win .tb button'))if(w.title==='Close')w.click()});
 await view([-92,-77,140],[-178,10,-26]);await p.screenshot({path:'shots/starter-media-desktop.png'});
 await p.evaluate(()=>{House._.setMode('walk');House.setWalkFrom({x:-92,y:-77,z:140,rx:0,ry:0,lvl:'U',seat:0});localStorage.setItem('jhp_starter_probe','"saved"');House.saveThings(true)});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.gb&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.mode),'walk','Refresh seated a standing player');
 await p.keyboard.press('Escape');await until(()=>HousePause.open);await p.locator('[data-pause=resetTest]').click();await p.screenshot({path:'shots/starter-reset-desktop.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/starter-reset-narrow.png'});await p.locator('[data-pause=cancelReset]').click();assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_starter_probe')),'"saved"');
 await p.locator('[data-pause=resetTest]').click();await p.locator('[data-pause=confirmReset]').click();await until(()=>!localStorage.getItem('jhp_starter_probe')&&AccountGate.allowed&&House?.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_starter')),'1');await until(()=>window.PM?.items().length===0);
 assert.deepEqual(errors,[]);console.log('STARTER BROWSER PASS: explicit signup enters PC, sparse media/empty PC shelf, standing refresh, test-only reset, cancel/confirm and profile reload');
}finally{await browser.close()}

import assert from 'node:assert/strict';
import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18462');
try{
 await p.evaluate(()=>{for(const id of ['n64.kart','n64.range','ps.run']){Room._.S.f['cart.'+id]=1;Room._.emit('find','cart.'+id)}House.hush();House._.setMode('walk')});
 for(const id of ['n64.kart','n64.range','ps.run']){
  await until(()=>Object.keys(House.THINGS).includes('media.box.n64.range'));
  await p.evaluate(id=>{House.hush();House._.setMode('walk');House.grab('media.box.'+id);House.inspect('media.box.'+id)},id);await p.waitForTimeout(900);
  await p.screenshot({path:'shots/box-art-'+id+'.png'});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/box-art-'+id+'-narrow.png'});await p.setViewportSize({width:1366,height:860});
  await p.keyboard.press('q');await p.evaluate(()=>House.putBack());await p.waitForTimeout(500);
 }
 const assets=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/box-v1/')).map(e=>e.name));assert.equal(new Set(assets).size,3);assert.deepEqual(errors,[]);console.log('BOX ART PASS: three printed illustrations loaded on inspected solid cases; desktop/narrow, no console warnings/errors');
}finally{await browser.close()}

import assert from'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18461',{width:390,height:844,touch:true});
try{
 // Arrange the fixture's case on clear floor, then exercise the actual touch USE button.
 await p.evaluate(()=>{const b=House.THINGS['media.box.n64.kart'];if(House.held())House.putBack();b.st='rest';b.snap=null;b.at={room:'bedroom',x:-130,y:73,z:145,ry:0};b.rx=b.rz=0;House.place(b)});
 await view([-130,-55,220],[-130,67,146.6]);await p.evaluate(()=>House._.setMode('walk'));
 await p.locator('.hs-use').click();await until(()=>House.THINGS['media.box.n64.kart'].caseOpen);await p.screenshot({path:'shots/media-touch-use.png'});assert.deepEqual(errors,[]);console.log('TOUCH USE PASS: coarse-pointer USE opens a placed case without a keyboard');
}finally{await browser.close()}

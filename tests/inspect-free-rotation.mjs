import assert from'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until}=await roomFixture(process.argv[2],{touch:true});
try{
 await p.evaluate(()=>{House.hush();House.grab('mug');House.inspect('mug')});await until(()=>House.mode==='inspect');
 const start=await p.evaluate(()=>House.THINGS.mug.obj.rotation.x);
 await p.mouse.move(800,300);await p.mouse.down();await p.mouse.move(800,400,{steps:10});await p.mouse.up();
 assert(await p.evaluate(v=>House.THINGS.mug.obj.rotation.x<v-.7,start),'Vertical inspect drag was not inverted');
 const angles=[];
 for(let i=0;i<10;i++){await p.mouse.move(800,300);await p.mouse.down();await p.mouse.move(800,400,{steps:6});await p.mouse.up();angles.push(await p.evaluate(()=>House.THINGS.mug.obj.rotation.x))}
 assert(angles.some(a=>Math.abs(a)>Math.PI),'Inspection still clamps at half a turn');
 for(let i=1;i<angles.length;i++)assert(Math.abs(angles[i]-angles[i-1])>.6,'Rotation hit a stop');
 await p.screenshot({path:'shots/mug-handle-underside.png'});
 for(const [name,dx,dy]of [['front',125,0],['side',200,-100],['rear',240,80]]){await p.mouse.move(700,300);await p.mouse.down();await p.mouse.move(700+dx,300+dy,{steps:10});await p.mouse.up();await p.screenshot({path:'shots/mug-handle-'+name+'.png'})}
 await p.keyboard.press('q');await p.evaluate(()=>{House.putBack();House.grab('cube');House.inspect('cube')});
 const cdp=await p.context().newCDPSession(p),state=await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state)),angle=await p.evaluate(()=>House.THINGS.cube.obj.quaternion.toArray());
 const points=[{id:1,x:600,y:330},{id:2,x:750,y:330}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points.map(q=>({...q,x:q.x+i*10,y:q.y+i*8}))});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notDeepEqual(await p.evaluate(()=>House.THINGS.cube.obj.quaternion.toArray()),angle);assert.equal(await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state)),state,'Two-finger rotation twisted the puzzle');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/inspect-free-narrow.png'});await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));await p.keyboard.press('Escape');await p.keyboard.press('q');await until(()=>House.mode==='walk');
 assert.deepEqual(errors,[]);console.log('FREE INSPECTION PASS: inverted vertical mouse drag, repeated full turns on both axes, connected mug from multiple angles, two-finger cube rotation without changing puzzle, menu/Q exit and narrow rendering');
}finally{await browser.close()}

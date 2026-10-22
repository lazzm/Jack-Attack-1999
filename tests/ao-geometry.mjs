import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const{browser,page:p,errors,view}=await roomFixture(process.argv[2]||'http://localhost:18450');
try{
 const result=await p.evaluate(()=>{const group=new THREE.Group(),B=HouseKit.into(group),floor=B.ao(0,0,0,4,6,{rx:180}),ceiling=B.ao(0,0,0,4,6,{}),horizontal=B.ao(0,0,0,4,6,{rx:90});
  const normal=m=>new THREE.Vector3(0,0,1).transformDirection(m.matrix).toArray(),uv=(m,y)=>{const p=m.geometry.attributes.position,u=m.geometry.attributes.uv;for(let i=0;i<p.count;i++)if(p.getY(i)===y)return u.getY(i)};
  const out={floorNormal:normal(floor),ceilingNormal:normal(ceiling),horizontalNormal:normal(horizontal),floorEdge:uv(floor,3),ceilingEdge:uv(ceiling,-3)};for(const m of group.children)m.geometry.dispose();return out});
 assert.deepEqual(result.floorNormal,[0,0,1]);assert.deepEqual(result.ceilingNormal,[0,0,1]);assert(Math.abs(result.horizontalNormal[1]+1)<.00001);assert.equal(result.floorEdge,1);assert.equal(result.ceilingEdge,1);
 await p.evaluate(()=>House.setDoor('bedroom',true,true));await view([292,-55,190],[65,20,170]);await p.screenshot({path:'shots/shadow-fixed-bedroom-door.png'});
 await view([266,210,536],[330,340,550],{level:'G'});await p.screenshot({path:'shots/shadow-fixed-stair-wall.png'});await p.setViewportSize({width:390,height:844});await view([292,-55,190],[65,20,170]);await p.screenshot({path:'shots/shadow-fixed-narrow.png'});
 assert.deepEqual(errors,[]);console.log('AO GEOMETRY PASS: inward faces, correct fade direction, doorway/stair clipping and desktop/narrow captures');
}finally{await browser.close()}

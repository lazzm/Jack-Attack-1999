import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,view}=await roomFixture(process.argv[2]||'http://localhost:18460');
const tag=process.argv[3]||'before';
try{
 const report=await p.evaluate(()=>{
  Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));House.scene.updateMatrixWorld(true);
  const planes=new Map(),v=new THREE.Vector3(),textures=new Map(Object.entries(HouseKit.TEX).map(([k,t])=>[t,k]));let faces=0;
  House.scene.traverse(o=>{
   if(!o.isMesh||!o.geometry||!o.visible||o.userData.noPick||o.userData.contactShadow)return;
   const g=o.geometry,a=g.attributes.position;if(!a)return;
   const ix=g.index,groups=g.groups.length?g.groups:[{start:0,count:ix?ix.count:a.count,materialIndex:0}];
   for(const gr of groups){const m=Array.isArray(o.material)?o.material[gr.materialIndex]:o.material;if(!m||!m.visible||m.depthWrite===false||m.polygonOffset)continue;
    for(let i=gr.start;i+5<gr.start+gr.count;i+=6){
     const pts=[];for(let j=0;j<6;j++){v.fromBufferAttribute(a,ix?ix.getX(i+j):i+j).applyMatrix4(o.matrixWorld);pts.push(v.toArray())}
     const unique=new Map(pts.map(q=>[q.map(n=>n.toFixed(3)).join(','),q]));if(unique.size!==4)continue;
     const lo=[0,1,2].map(k=>Math.min(...pts.map(q=>q[k]))),hi=[0,1,2].map(k=>Math.max(...pts.map(q=>q[k]))),axis=lo.findIndex((n,k)=>hi[k]-n<.001);if(axis<0)continue;
     const axes=[0,1,2].filter(k=>k!==axis);if(axes.some(k=>hi[k]-lo[k]<.02))continue;
     // Only rectangles: each corner must lie on both in-plane extrema.
     if([...unique.values()].some(q=>axes.some(k=>Math.min(Math.abs(q[k]-lo[k]),Math.abs(q[k]-hi[k]))>.002)))continue;
     const normal=new THREE.Vector3().subVectors(new THREE.Vector3(...pts[1]),new THREE.Vector3(...pts[0])).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...pts[2]),new THREE.Vector3(...pts[0]))),sign=Math.sign(normal.getComponent(axis));
     const key=axis+':'+lo[axis].toFixed(3)+':'+sign;let list=planes.get(key);if(!list)planes.set(key,list=[]);
     const room=(()=>{let parent=o;while(parent){for(const r of Object.values(House.ROOMS))if(r.group===parent)return r.id;parent=parent.parent}return 'world'})();
     list.push({room,mesh:o.name||o.uuid,material:m.uuid,texture:textures.get(m.map)||null,transparent:m.transparent,lo:axes.map(k=>lo[k]),hi:axes.map(k=>hi[k]),at:lo[axis],axis});faces++;
    }
   }
  });
  const overlaps=[];
  for(const list of planes.values()){
   list.sort((a,b)=>a.lo[0]-b.lo[0]);
   for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length&&list[j].lo[0]<list[i].hi[0]-.02;j++){
    const a=list[i],b=list[j],w=Math.min(a.hi[0],b.hi[0])-Math.max(a.lo[0],b.lo[0]),h=Math.min(a.hi[1],b.hi[1])-Math.max(a.lo[1],b.lo[1]);
    if(w>.02&&h>.02)overlaps.push({area:w*h,a,b});
   }
  }
  overlaps.sort((a,b)=>b.area-a.area);return{faces,overlaps};
 });
 await writeFile(`shots/surface-audit-${tag}.json`,JSON.stringify(report,null,2));
 if(tag!=='before'&&tag!=='whole-before')assert.deepEqual(report.overlaps.filter(x=>x.a.room!==x.b.room&&x.area>5000),[],'Large duplicate surfaces across room-lighting owners');
 console.log(JSON.stringify({faces:report.faces,overlaps:report.overlaps.length,largest:report.overlaps.slice(0,20).map(x=>({area:x.area,room:[x.a.room,x.b.room],axis:x.a.axis,at:x.a.at,texture:[x.a.texture,x.b.texture],bounds:[x.a.lo,x.a.hi,x.b.lo,x.b.hi]}))},null,2));
 for(const [name,eye,target,level]of [
  ['drive',[300,210,1030],[300,190,1500],'G'],['garden',[20,195,-150],[-40,230,-700],'G'],
  ['threshold',[290,-55,190],[50,45,170],'U'],['skirting',[-100,5,110],[-270,70,20],'U']]){
  await p.setViewportSize({width:1366,height:860});await view(eye,target,{level});await p.screenshot({path:`shots/surfaces-${tag}-${name}.png`});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:`shots/surfaces-${tag}-${name}-narrow.png`});
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}

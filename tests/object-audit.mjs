import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18460',tag=process.argv[3]||'baseline';
const {browser,page:p,errors,view}=await roomFixture(base);
const views=[
 ['desk','U',[-15,-60,110],[0,-12,-22]],['mug','U',[68,-21,24],[46,-5,-8]],
 ['bedside','U',[90,-14,40],[122,4,-38]],['bed','U',[115,-35,155],[195,35,45]],
 ['wardrobe','U',[-125,-55,70],[-240,-20,120]],['hifi','U',[-180,-35,155],[-250,-20,212]],
 ['bags','U',[32,0,175],[80,45,222]],['media','U',[-155,-35,120],[-260,-40,25]],
 ['toys','U',[-15,-107,-4],[-15,-140,-47]],['landing','U',[300,-55,180],[290,-20,500]],
 ['hall','G',[300,195,580],[220,270,110]],['hall-table','G',[285,230,160],[225,275,110]],
 ['cupboard','G',[360,245,410],[370,300,290]],
 ['lounge','G',[-50,195,640],[-60,280,350]],['sofa','G',[-40,225,440],[-60,305,560]],
 ['chair','G',[-25,225,490],[110,300,430]],['phone','G',[90,220,570],[170,275,610]],
 ['fire','G',[-140,220,490],[-250,280,500]],['plant','G',[-160,210,590],[-250,290,660]],
 ['kitchen','G',[-40,195,150],[-120,260,-26]],['worktop','G',[-140,205,65],[-145,255,-27]],
 ['sink','G',[-50,205,30],[-80,268,-26]],['cooker','G',[75,220,90],[-10,245,-26]],
 ['table','G',[100,215,250],[-60,290,170]],
 ['garden','G',[40,195,-90],[-80,280,-420]],['patio','G',[20,210,-250],[-150,300,-170]],
 ['shed','G',[-40,195,-300],[-225,260,-470]],['garden-bins','G',[80,220,-200],[175,285,-110]],
 ['car','G',[270,215,1070],[430,290,900]],['car-rear','G',[300,225,740],[430,290,880]],
 ['house','G',[180,195,1020],[80,170,700]]
];
try{
 await p.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r)});
 const inventory=await p.evaluate(()=>{
  const bad=[],seen=new Set();let meshes=0,triangles=0;
  House.scene.updateMatrixWorld(true);House.scene.traverse(o=>{if(!o.geometry||seen.has(o.geometry))return;seen.add(o.geometry);meshes++;const g=o.geometry,a=g.attributes.position;triangles+=(g.index?g.index.count:a.count)/3;for(const v of a.array)if(!Number.isFinite(v)){bad.push(o.name||o.uuid);break}});
  const things=Object.values(House.THINGS).map(t=>({id:t.id,label:t.label,kind:t.kind,home:t.home,at:t.at}));
  const spots=Object.values(House.SPOTS).map(s=>({id:s.id,label:typeof s.label==='function'?s.label():s.label,room:s.obj?(()=>{let o=s.obj;while(o){for(const r of Object.values(House.ROOMS))if(o===r.group)return r.id;o=o.parent}return null})():null}));
  return{meshes,triangles,bad,things,spots};
 });assert.deepEqual(inventory.bad,[],'Non-finite world geometry');await writeFile(`shots/object-audit-${tag}.json`,JSON.stringify(inventory,null,2));
 const selected=process.argv[4]?views.filter(v=>process.argv[4].split(',').includes(v[0])):views;
 for(const [name,level,eye,target]of selected){
  await p.setViewportSize({width:1366,height:860});await view(eye,target,{level});await p.screenshot({path:`shots/objects-${tag}-${name}.png`});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:`shots/objects-${tag}-${name}-narrow.png`});console.log('OBJECT VIEW',tag,name);
 }
 assert.deepEqual(errors,[]);console.log('OBJECT AUDIT PASS',JSON.stringify({views:selected.length,things:inventory.things.length,spots:inventory.spots.length,geometries:inventory.meshes}));
}finally{await browser.close()}

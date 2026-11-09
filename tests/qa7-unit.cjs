'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../app/public/js',name),'utf8');
// A restored open bedroom door can be drawn before hs-house registers the
// hall. The shared flight must gain its second parent when that room arrives.
{
 const src=read('hs-world.js'),code=src.slice(src.indexOf('  function visCalc()'),src.indexOf('  // Each room owns'));
 const rooms=Object.fromEntries(['bedroom','landing'].map(id=>[id,{id,links:id==='bedroom'?['bedroom']:['bedroom','stairs'],group:{visible:false}}])),doors={bedroom:{rooms:['bedroom','landing'],open:true},stairs:{rooms:['landing','hall'],always:true}};
 const c={ROOMS:rooms,DOORS:doors,cur:rooms.bedroom,rung:()=>({far:1}),buildRoom(){},lightsFor(){},dirty(){}};vm.createContext(c);vm.runInContext('let visSet,vegetationRoutes;'+code+';this.drawn=()=>[...visSet];',c);c.visCalc();assert.deepEqual(Array.from(c.drawn()).sort(),['bedroom','landing']);
 rooms.hall={id:'hall',links:['stairs'],group:{visible:false}};c.visCalc();assert(c.drawn().includes('hall'));assert(rooms.hall.group.visible);console.log('PASS QA7 cold open-door entry ignores unregistered hall, then restores shared-flight visibility');
}
// Departure while a body is still moving: no sleep callback and no pending
// debounce. The restored furniture and player must describe the same frame.
{
 const src=read('hs-world.js'),start=src.indexOf('  function saveWalkState()'),end=src.indexOf('  setInterval(saveStood',start),trace=[],store={},body={x:120},thing={x:80};
 const c={window:{AccountGate:{allowed:true}},AccountGate:{allowed:true},live:true,saveT:0,mode:'walk',focusS:null,P:{},ls:{set:(k,v)=>store[k]=v},saveGrip:()=>trace.push('grip'),flushMoved(){thing.x=body.x;trace.push('bodies')},saveThings(immediate){assert.equal(immediate,true);store.thing={...thing};trace.push('things')},savePose(){store.pose={x:110};trace.push('pose')},saveStood:()=>trace.push('stood')};
 vm.createContext(c);vm.runInContext(src.slice(start,end),c);c.saveWalkState();assert.equal(store.thing.x,120,'Awake body lost at departure without a pending save');assert(trace.indexOf('things')<trace.indexOf('pose'),'Furniture must precede the saved player');
 trace.length=0;c.AccountGate.allowed=false;c.saveWalkState();assert(!trace.includes('things'),'Blocked account must not overwrite its profile');
 console.log('PASS QA7 departure flushes awake physics without a debounce; account guard');
}
// Printed control legends must sit in front of their actual mouldings.
{
 const T=require('../app/public/vendor/three.min.js'),paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}}),c={THREE:T,console,document:{createElement:()=>({getContext:()=>paint})}};c.window=c;vm.createContext(c);vm.runInContext(read('hs-kit.js'),c);
 const src=read('rm-room.js');Object.assign(c,{T,K:c.HouseKit,M:c.HouseKit.mat,R:{},A:{UIF:'Arial',text(){}},crtGlass:(w,h)=>new T.PlaneGeometry(w,h)});vm.runInContext(src.slice(src.indexOf('  function gbModel()'),src.indexOf('  function cubeModel()'))+';this.gb=gbModel();',c);c.gb.updateMatrixWorld(true);
 for(const label of ['A','B','SELECT','START']){
  const map=c.K.TEX['rm.gb'+label];assert(map,label+' print missing');let mesh;c.gb.traverse(m=>{if(m.material?.map===map)mesh=m});assert(mesh,label+' decal missing');const at=new T.Vector3().setFromMatrixPosition(mesh.matrixWorld),ray=new T.Raycaster(new T.Vector3(at.x,-10,at.z),new T.Vector3(0,1,0));assert.equal(ray.intersectObject(c.gb,true)[0]?.object,mesh,label+' print is behind plastic');
 }
 console.log('PASS QA7 A/B/SELECT/START print clears real shell/grips/buttons');
 const scene=new T.Scene();vm.runInContext(read('hs-house.js').match(/const gl=M\(\{c:'#b2cbc5'[^\n]+/)[0],c); // declaration is intentionally scoped in its own VM script
 vm.runInContext('this.glass=gl',c);scene.add(new T.Mesh(new T.BoxGeometry(),c.glass));assert(c.glass.transparent&&c.glass.opacity<.55&&!c.glass.depthWrite);assert(c.glass.envMap);c.K.interiorAdapt(5,scene);assert.equal(c.glass.envMap,null);c.K.interiorAdapt(0,scene);assert(c.glass.envMap);
 console.log('PASS QA7 transparent car tint follows shared cheap-lighting reflection guard');
}
// Every authored pool entry carries direction. Quoted warnings and dry jokes
// must not acquire the expression of a scolding through substring matching.
{
 const T=require('../app/public/vendor/three.min.js'),paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}}),c={THREE:T,console,performance:{now:()=>0},document:{createElement:()=>({getContext:()=>paint})}};c.window=c;vm.createContext(c);vm.runInContext(read('np-lines.js')+read('np-rig.js'),c);
 const rigs=Object.fromEntries(['mom','dad','sister'].map(id=>[id,c.NPCRig.create(id,{tier:'low'})]));let count=0;
 for(const [id,d]of Object.entries(c.NPCDialogue)){assert(['neutral','happy','cheeky','tired'].includes(d.mood),id+' missing authored direction');const r=rigs[d.speaker];r.talk(5000,c.NPCLines[id][1],null,d.mood);assert.equal(r.st.mood,d.mood,id+' ignored direction');count++}
 assert.equal(c.NPCDialogue['talk.dad.morning.02'].mood,'cheeky');assert.equal(c.NPCDialogue['talk.sister.morning.12'].mood,'cheeky','Teddy being tired does not make the speaker tired');assert.equal(c.NPCDialogue['talk.sister.evening.05'].mood,'tired');
 const life=read('np-life.js'),pool=life.slice(life.indexOf('  function barkPool('),life.indexOf('  let barkAt')),barks=[...new Set([...pool.matchAll(/'((?:bark|chore)\.[^']+)'/g)].map(m=>m[1]))];
 for(const id of barks){const mood=c.VoiceDirections[id],speaker=c.NPCLines[id][0];assert(['neutral','happy','cheeky','tired','sad','cross'].includes(mood),id+' lacks a conversation cue');rigs[speaker].talk(5000,c.NPCLines[id][1],null,mood);assert.equal(rigs[speaker].st.mood,mood);}
 assert.equal(c.VoiceDirections['bark.sis.react.lounge'],'sad');assert.equal(c.VoiceDirections['bark.dad.bed2'],'cross');assert.equal(c.VoiceDirections['bark.dad.react.joke'],'cheeky');assert(life.includes('window.VoiceDirections?.[n.lineId]'));
 assert(life.includes('n.text, voice, direction'));assert(life.includes('n.text, h, direction'),'Late audio must retain the authored direction');Object.values(rigs).forEach(r=>r.dispose());console.log('PASS QA7 all '+count+' authored conversation/instruction cues, '+barks.length+' shared bark-pool cues and late voice direction');
}
// Exercise the production lesson transition: walking into a hoop cannot reuse
// an earlier landing, and an ordinary hop cannot satisfy the double hop.
{
 const src=read('rm-g-hop.js'),q={active:true,lesson:0,seen:false,airborne:false},P={x:34,z:32,y:5,st:'jump',gnd:false},prog={school:0},messages=[];
 const c={SCHOOL:q,P,prog,SCHOOL_LESSONS:[['HOP','jump','',30,26,4.5],['DOUBLE HOP','jump2','',30,26,4.5]],IN:{},Math,K:{sfx:{seq(){}}},schoolAnim(){},burst(){},schoolNext:()=>0,reveal(){},say:(...args)=>messages.push(args),saveNow(){},L:x=>x};vm.createContext(c);vm.runInContext(src.slice(src.indexOf('      function schoolUpdate()'),src.indexOf('      function tryLedge()')),c);
 const ground=(x,z)=>{Object.assign(P,{x,z,y:4.5,gnd:true,st:'idle'});c.schoolUpdate()};
 c.schoolUpdate();ground(34,32);assert.equal(prog.school,0);assert.equal(q.seen,false);assert(messages.some(a=>a[0]==='TRY THAT MOVE AGAIN!'));ground(30,26);assert.equal(prog.school,0,'Walking reused a wrong landing');
 Object.assign(P,{st:'jump',gnd:false});c.schoolUpdate();ground(30,26);assert.equal(prog.school,1);
 Object.assign(q,{active:true,lesson:1,seen:false,airborne:false});Object.assign(P,{st:'jump2',gnd:false,x:34,z:32});c.schoolUpdate();ground(34,32);ground(30,26);assert.equal(prog.school,1,'Walking reused a wrong double-hop landing');
 Object.assign(P,{st:'jump',gnd:false});c.schoolUpdate();ground(30,26);assert.equal(prog.school,1,'Ordinary hop credited Double Hop');Object.assign(P,{st:'jump2',gnd:false});c.schoolUpdate();ground(30,26);assert.equal(prog.school,3);console.log('PASS QA7 wrong landings reset; grounded entry and wrong move earn nothing; actual target landings earn both bits');
}
// Measure the real glove/cuff vertices after the production hang animation,
// rather than checking a named bone or an unrendered proxy.
{
 const T=require('../app/public/vendor/three.min.js'),src=read('rm-g-hop.js'),scene=new T.Scene(),P={x:0,y:5.7,z:0,st:'ledge',stT:1,face:0,yaw:0,vx:0,vz:0,land:0,inv:0},c={T,P,Math,console,TAU:Math.PI*2,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),wrapA:a=>Math.atan2(Math.sin(a),Math.cos(a)),tv:new T.Vector3(),mode:'play',prog:{opt:{}},powerHero(){},T3:{keep:g=>g,mat:()=>new T.MeshPhongMaterial({vertexColors:true}),add:o=>scene.add(o)}};
 vm.createContext(c);const a=src.indexOf('      const BOP ='),b=src.indexOf('      })();',a)+'      })();'.length;vm.runInContext(src.slice(src.indexOf('      const _e ='),src.indexOf('      const MC ='))+src.slice(a,b)+src.slice(src.indexOf('      function animBop('),src.indexOf('      // ================================================================ the main step'))+';this.hero=BOP;',c);
 for(const face of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  P.face=P.yaw=face;c.animBop(1/60,0);scene.updateMatrixWorld(true);
  for(const side of ['L','R']){let contact=0,highest=-Infinity;c.hero['arm'+side].traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position,col=m.geometry.attributes.color;for(let i=0;i<p.count;i++)if(col.getX(i)>.9&&col.getY(i)>.9&&col.getZ(i)>.9){const v=new T.Vector3().fromBufferAttribute(p,i);m.localToWorld(v);highest=Math.max(highest,v.y);const inward=-v.x*Math.sin(face)-v.z*Math.cos(face);if(Math.abs(v.y-7)<.06&&Math.abs(inward-.43)<.12)contact++}});assert(Math.abs(highest-7)<.05,'Glove does not reach rim height');assert(contact>0,'Glove '+side+' misses the rim at '+face+' (highest '+highest+')');}
 }
 console.log('PASS QA7 both rendered glove/cuff surfaces contact the rim in four directions');
}

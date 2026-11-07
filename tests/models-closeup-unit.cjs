'use strict';
// Close-range acceptance on production r128 bones; no browser or mock skeleton.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const T=require(path.join(__dirname,'../app/public/vendor/three.min.js'));
const baseline=process.argv.includes('--baseline'),root=path.join(__dirname,'..');
const read=file=>baseline?execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'app/public/js',file),'utf8');
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
const world={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,Math:math,performance:{now:()=>clock}};world.window=world;vm.createContext(world);vm.runInContext(read('np-rig.js'),world);
const step=(r,n)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,true)}};
const report={baseline,people:{},triangles:{},staging:[]};
for(const id of ['mom','dad','sister']){
 const r=world.NPCRig.create(id,{tier:'low'});let submissions=0;r.group.traverse(o=>{if(o.isSkinnedMesh)submissions++;});assert.equal(submissions,2,id+' adds a skinned mesh submission');r.floor=()=>0;r.teleport(0,0,0,0);Object.assign(r.st,{glanceAt:Infinity,glance:null});step(r,240);r.group.updateMatrixWorld(true);
 if(!baseline){const g=r.mesh.geometry;let cloth=0,collar=0;for(let n=0;n<g.attributes.position.count;n++){const u=g.attributes.uv.getX(n),v=g.attributes.uv.getY(n);if(u<=.5&&v<=.5){cloth++;assert(u>0&&u<.5&&v>0&&v<.5,id+' torso samples across an atlas-cell boundary');if(g.attributes.position.getY(n)>r.S.neck-.5){collar++;let chest=0;for(let k=0;k<4;k++)if(g.attributes.skinIndex.array[n*4+k]===world.NPCRig.BONES.indexOf('chest'))chest+=g.attributes.skinWeight.array[n*4+k];assert(chest>.99,id+' collar follows an arm and cuts into the neck');}}}assert(cloth>50&&collar>5,'No cloth/collar samples');}
 let collarGap=null;if(!baseline){
  const g=r.mesh.geometry,p=g.attributes.position,uv=g.attributes.uv,points=[];for(let n=0;n<p.count;n++)if(uv.getX(n)<.5&&uv.getY(n)<.5&&p.getY(n)>r.S.neck+.6){const q=[p.getX(n),p.getZ(n)];if(!points.some(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<1e-4))points.push(q);}points.sort((a,b)=>Math.atan2(a[0],a[1]+.4)-Math.atan2(b[0],b[1]+.4));assert(points.length>=9,'No closed collar outline');let area=0;for(let n=0;n<points.length;n++){const a=points[n],b=points[(n+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}const sign=Math.sign(area),first=(r.S.L.head[0]-1)*r.S.L.head[1]+2,stride=r.S.L.limb+1,y=r.S.neck+.7,t=(y-p.getY(first))/(p.getY(first+stride)-p.getY(first));collarGap=Infinity;
  for(let n=0;n<stride-1;n++){const x=p.getX(first+n)*(1-t)+p.getX(first+stride+n)*t,z=p.getZ(first+n)*(1-t)+p.getZ(first+stride+n)*t;for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length],gap=sign*((b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]))/Math.hypot(b[0]-a[0],b[1]-a[1]);collarGap=Math.min(collarGap,gap);}}
  assert(collarGap>.05,id+' neck breaks through collar by '+(-collarGap)+' cm');
 }
 let neckBurial=null;if(!baseline){
  const g=r.mesh.geometry,p=g.attributes.position,uv=g.attributes.uv,indices=g.index.array,first=(r.S.L.head[0]-1)*r.S.L.head[1]+2,stride=r.S.L.limb+1;
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const hull=points=>{points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const lo=[],hi=[];for(const q of points){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],q)<=1e-8)lo.pop();lo.push(q);}for(const q of points.slice().reverse()){while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],q)<=1e-8)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));};
  neckBurial=Infinity;
  for(const y of [r.S.neck-5.95,r.S.neck-3,r.S.neck-.5,r.S.neck+.6]){
   const points=[];for(let n=0;n<indices.length;n+=3){const tri=[indices[n],indices[n+1],indices[n+2]];if(!tri.every(i=>uv.getX(i)<.5&&uv.getY(i)<.5))continue;for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],ya=p.getY(a),yb=p.getY(b);if((ya-y)*(yb-y)<0){const t=(y-ya)/(yb-ya);points.push([p.getX(a)*(1-t)+p.getX(b)*t,p.getZ(a)*(1-t)+p.getZ(b)*t]);}}}
   const outline=hull(points);assert(outline.length>=6,'No garment cross section');const t=(y-p.getY(first))/(p.getY(first+stride)-p.getY(first));for(let k=0;k<stride-1;k++){const q=[p.getX(first+k)*(1-t)+p.getX(first+stride+k)*t,p.getZ(first+k)*(1-t)+p.getZ(first+stride+k)*t];for(let j=0;j<outline.length;j++){const a=outline[j],b=outline[(j+1)%outline.length],gap=cross(a,b,q)/Math.hypot(b[0]-a[0],b[1]-a[1]);neckBurial=Math.min(neckBurial,gap);}}
  }
  assert(neckBurial>.005,id+' lower neck breaks through clothing '+neckBurial+' cm');
 }
 const palms={};for(const sd of ['L','R']){const palm=new T.Vector3(0,0,1).transformDirection(r.bones['hand'+sd].matrixWorld);palms[sd]={towardThigh:palm.x*(sd==='L'?-1:1),up:-palm.y};if(!baseline)assert(palms[sd].towardThigh>.85,id+' '+sd+' resting palm faces away from thigh');}
 let resetFrames=0,doubleReset=0;for(let n=0;n<1200;n++){step(r,1);const a=r.bones.lidL.rotation.x,b=r.bones.lidR.rotation.x;if(a>.02||b>.02)resetFrames++;if(a>.02&&b>.02)doubleReset++;}if(!baseline){assert(resetFrames>10,id+' resting fingers never re-settle');assert.equal(doubleReset,0,id+' both hands re-settle together');}
 r.set({engage:true,look:{x:0,y:-143,z:60}});step(r,180);r.group.updateMatrixWorld(true);const gaze=new T.Vector3(0,0,1).transformDirection(r.bones.head.matrixWorld);if(!baseline){const expected=r.bones.head.localToWorld(new T.Vector3(0,r.S.eyeY-r.J.head[1],r.S.shape.front(0,r.S.eyeY)-r.J.head[2]));assert(r.eyeWorld(new T.Vector3()).distanceTo(expected)<1e-5,id+' eye target misses actual skin frame');const parent=new T.Group();parent.scale.y=-1;parent.add(r.group);assert(r.eyeWorld(new T.Vector3()).distanceTo(expected)<1e-5,id+' room parenting flips house eye target');parent.remove(r.group);}report.people[id]={palms,collarGap,neckBurial,resetFrames,doubleReset,engagedHeadPitch:Math.atan2(-gaze.y,Math.hypot(gaze.x,gaze.z))*180/Math.PI};
 if(!baseline&&id!=='sister')assert(gaze.y>0,id+' parent looks above teenager rather than down');
 r.dispose();
}
for(const tier of ['low','potato','high'])for(const id of Object.keys(world.NPCRig.OUTFITS))for(const outfit of world.NPCRig.OUTFITS[id]){
 const r=world.NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(0,near);report.triangles[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;if(tier!=='high')assert(r.tris+6<=3000,id+' exceeds Low budget');}r.dispose();
}
// The existing 32 cm retreat must use planted adjustment steps, not a forward
// walk cycle under a root travelling backwards. The life path itself is unchanged.
if(!baseline){
 const src=fs.readFileSync(path.join(root,'app/public/js/np-life.js'),'utf8'),fn=src.slice(src.indexOf('  function placeRig(c) {'),src.indexOf('  function spawn(c,'));let speed;
 const room={id:'hall',group:{add(){}}},context={roomAt:()=>room,H:{ROOMS:{hall:room},LV:{G:353},buildRoom(){}},NV:{onFlight:()=>false},hideAll:false};vm.createContext(context);vm.runInContext(fn+';this.place=placeRig;',context);
 const person={room:'hall',x:270,z:600,lvl:'G',h:Math.PI,v:30,present:true,rig:{group:{parent:room.group},root(x,y,z,h,v){speed=v}}};context.place(person);assert.equal(speed,30,'ordinary route speed changed');person.backoff={x:270,z:632};context.place(person);assert.equal(speed,0,'retreat plays a forward stride');
 report.retreat={};for(const id of ['mom','dad','sister']){
  const measure=v=>{const r=world.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);Object.assign(r.st,{seed:2,lean:1,glanceAt:Infinity,weightAt:Infinity,weightSide:1});step(r,120);let double=0,minY=Infinity,maxY=-Infinity;for(let n=0;n<90;n++){r.root(0,0,-Math.min(32,(n+1)*55/60),0,n<35?v:0);step(r,1);if(r.st.feet.every(f=>!!f.swing))double++;r.group.updateMatrixWorld(true);const y=r.bones.hips.getWorldPosition(new T.Vector3()).y;minY=Math.min(minY,y);maxY=Math.max(maxY,y);}r.dispose();return{doubleSwing:double,hipRange:maxY-minY};};
  const before=measure(30),after=measure(0);report.retreat[id]={before,after};assert.equal(after.doubleSwing,0,id+' retreat has no support foot');assert(after.hipRange<3.5,id+' half-step exceeds gentle knee flex '+after.hipRange);assert(after.hipRange<before.hipRange*.7,id+' retreat does not reduce the old forward-stride drop');
 }
}
// Paired phrase signal: one parent speaks, the other listens with a closed mouth.
if(!baseline){const speaker=world.NPCRig.create('mom',{tier:'low'}),listener=world.NPCRig.create('dad',{tier:'low'});let progress=0;const voice={started:true,ended:false,progress:()=>progress,level:()=>.7};
 speaker.teleport(0,0,0,0);listener.teleport(0,0,200,Math.PI);listener.set({listen:speaker,look:{x:0,y:-146,z:0}});speaker.talk(12000,'First we can look. Then we can try. After that we can see.',voice);let peak=0,blinks=0;
 for(let n=0;n<720;n++){progress=n/720;clock+=1000/60;speaker.update(1/60,true);listener.update(1/60,true);peak=Math.max(peak,listener.st.listenNod||0);if(listener.face.eye!==0)blinks++;assert.equal(listener.face.mouth,0,'listener speaks over partner');}
 report.listening={peakNod:peak,blinkFrames:blinks};assert(peak>.06,'listener has no phrase response');assert(blinks>0,'listener never blinks');voice.ended=true;step(listener,60);assert.equal(listener.st.listenNod,0,'listener reacts to ended voice');listener.set({listen:null});step(listener,30);assert.equal(listener.st.listenNod,0);speaker.dispose();listener.dispose();
 const source=read('hs-world.js'),start=source.indexOf('  let conversationAim = null;'),end=source.indexOf('\n  let crouchToggle',start);assert(start>0&&end>start,'staging block found');
 const aimSource=source.slice(start,end),P={x:0,y:210,z:0,rx:-35,ry:180},W={x:0,z:0};let active=true,face={x:0,y:200,z:60};const ctx={P,W,mode:'walk',controlsPaused:false,viewOpen:()=>false,performance:{now:()=>0},dirty(){},D2R:Math.PI/180,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,angd:(a,b)=>(b-a+540)%360-180,H5:t=>t*t*t*(10+t*(-15+6*t)),Math};vm.createContext(ctx);vm.runInContext(aimSource+';this.aim={begin:frameConversation,tick:tickConversationAim,cancel:cancelConversationAim,state:()=>conversationAim};',ctx);
 // Execute the production touch and mouse cancellation hooks, not substitutes.
 Object.assign(ctx,{worldLoading:false,live:true,glide:null,focusS:null,hoverQ:false,touchMove:{},ui:{crossOn(){}},cancelGlide(){},PT:new Map(),locked:()=>false,pb:{addEventListener(k,fn){ctx.mouseMove=fn}}});
 const touch=source.slice(source.indexOf('  function touchLook('),source.indexOf('  const KEYMOVE ='));
 const move=source.slice(source.indexOf('  function touchSet('),source.indexOf('  function touchLook('));
 const mouse=source.slice(source.indexOf("  pb.addEventListener('pointermove', ev => {"),source.indexOf('  const endPt ='));
 vm.runInContext(touch+move+mouse+';this.touchLook=touchLook;this.touchSet=touchSet;',ctx);
 for(const input of ['touchLook','touchMove','mouse']){ctx.aim.begin(()=>face,()=>active);ctx.aim.tick(100);assert(ctx.aim.state());if(input==='touchLook')ctx.touchLook(1,0);else if(input==='touchMove')ctx.touchSet(0,1,false);else ctx.mouseMove({pointerType:'mouse',movementX:1,movementY:0,clientX:10,clientY:10,pointerId:1});assert.equal(ctx.aim.state(),null,input+' does not cancel immediately');}
 for(const id of ['mom','dad','sister'])for(const d of [60,100,200])for(const size of [[1366,860],[844,390]]){
  const r=world.NPCRig.create(id,{tier:'low'});r.teleport(0,353,d,Math.PI);r.set({look:{x:0,y:210,z:0},engage:true});step(r,180);face=r.eyeWorld(new T.Vector3());Object.assign(P,{x:0,y:210,z:0,rx:-35,ry:180});ctx.aim.begin(()=>face,()=>active);ctx.aim.tick(200);assert(P.rx>-35&&P.rx<Math.atan2(P.y-face.y,d)*180/Math.PI,'no smooth intermediate view');ctx.aim.tick(400);
  const camera=new T.PerspectiveCamera(60,size[0]/size[1],1,2000);camera.position.set(P.x,-P.y,P.z);camera.rotation.set(P.rx*Math.PI/180,-P.ry*Math.PI/180,0,'YXZ');camera.updateMatrixWorld();const ndc=new T.Vector3(face.x,-face.y,face.z).project(camera);assert(Math.abs(ndc.y)<.01,'eyes outside face frame');assert.equal(W.x,0);assert.equal(W.z,0);assert.equal(ctx.aim.state().rx,-35,'original saved angle changed');ctx.aim.cancel();const rx=P.rx;ctx.aim.tick(800);assert.equal(P.rx,rx,'cancelled ease keeps moving');report.staging.push({id,cm:d,viewport:size,eyeNDC:ndc.toArray(),finalPitch:rx});r.dispose();
 }
}
const out=path.join(__dirname,'shots/models');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'r5-closeup-'+(baseline?'before':'after')+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('PASS close-range palm, parent gaze, listening and framing measurements'+(baseline?' (baseline measurements)':''));

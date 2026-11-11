'use strict';
// Execute the production camera and gesture functions with real three.js maths.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js'),read=name=>fs.readFileSync(require.resolve('../app/public/js/'+name),'utf8');
const room=read('rm-room.js'),start=room.indexOf('  function tvPose('),end=room.indexOf('  function tvOpen(',start);
for(const [width,height]of [[390,844],[844,390],[740,360],[768,1024],[1366,860]])for(const con of ['n64','sn'])for(const [yaw,tilt] of [[0,0],[30,0],[0,-8],[25,6]]){
 const root=new T.Group();root.scale.y=-1;const screen=new T.Mesh(new T.PlaneGeometry(con==='sn'?24:28,con==='sn'?18:21));screen.position.set(20,-30,10);screen.rotation.set(tilt*Math.PI/180,yaw*Math.PI/180,0,'YXZ');root.add(screen);root.updateMatrixWorld(true);
 const area={left:width>height?174:8,right:width>height?174:8,top:58,bottom:width>height?48:210};
 const lens=Math.max(width/2/Math.tan(47.5*Math.PI/180),Math.min(height/2/Math.tan(30*Math.PI/180),width/2/Math.tan(25*Math.PI/180))),camera=new T.PerspectiveCamera(2*Math.atan(height/2/lens)*180/Math.PI,width/height,2,11000),H={camera:new T.PerspectiveCamera(75,1,2,11000)/* a stale lens mid-rotation */,ROOMS:{cupboard:{cupScreen:screen}}},c={T,H,R:{tvScreen:screen},D2R:Math.PI/180,innerWidth:width,innerHeight:height,window:{RoomTV:{screenArea:()=>area}}};
 vm.runInNewContext(room.slice(start,end),c);const pose=c.tvPose(con);
 const S=new T.Matrix4().makeScale(1,-1,1),Rx=new T.Matrix4().makeRotationX(pose.rx*Math.PI/180),Ry=new T.Matrix4().makeRotationY(pose.ry*Math.PI/180);
 camera.matrixAutoUpdate=false;camera.matrix.copy(S).multiply(new T.Matrix4().makeTranslation(pose.x,pose.y,pose.z)).multiply(Rx.multiply(Ry).transpose()).multiply(S);camera.updateMatrixWorld(true);
 const pts=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>{const v=new T.Vector3(x*screen.geometry.parameters.width,y*screen.geometry.parameters.height,0).applyMatrix4(screen.matrixWorld).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2}});
 for(const p of pts){assert(p.x>=area.left-.1&&p.x<=width-area.right+.1,`${con} ${width} horizontal fit`);assert(p.y>=area.top-.1&&p.y<=height-area.bottom+.1,`${con} ${width} vertical fit`)}
 const w=Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),h=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));
 assert(Math.abs(Math.max(w/(width-area.left-area.right),h/(height-area.top-area.bottom))-(Math.min(width,height)>=600?.75:.9))<.01,'Glass wastes available space '+[con,width,yaw,tilt]);
 // Square-on: opposite edges of the glass project to the same length.
 assert(Math.abs(Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)-Math.hypot(pts[2].x-pts[3].x,pts[2].y-pts[3].y))<.5&&Math.abs(Math.hypot(pts[3].x-pts[0].x,pts[3].y-pts[0].y)-Math.hypot(pts[2].x-pts[1].x,pts[2].y-pts[1].y))<.5,'Camera is not square-on to the glass '+[con,width,yaw,tilt]);
}
console.log('PASS live glass: both solid sets, five viewports, rotated screens, reserved controls, phone 90% / large 75% limiting dimension, square-on');
const world=read('hs-world.js'),a=world.indexOf("  document.addEventListener('pointerdown', ev => {",world.indexOf('  function endInspect()')),b=world.indexOf('  const inspectUp=',a),handlers={};
for(const zoom of [.72,1,1.18]){
 const obj=new T.Group(),camera=new T.PerspectiveCamera(52,390/844,2,1000);camera.updateMatrixWorld(true);
 const s={t:{obj},paper:{width:21,height:28},yaw:127.3,pitch:-24.5,zoom,drag:null};
 const c={inspection:s,controlsPaused:false,T,camera,vw:390,vh:844,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),poseInspect(){},document:{addEventListener:(name,fn)=>handlers[name]=fn}};
 vm.runInNewContext(world.slice(a,b),c);
 const event=(id,x,y)=>({pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,target:{closest:()=>false},preventDefault(){},stopImmediatePropagation(){}});
 handlers.pointerdown(event(21,140,350));handlers.pointerdown(event(22,250,350));for(let i=1;i<=6;i++){handlers.pointermove(event(21,140-i*7,350));handlers.pointermove(event(22,250+i*7,350));}
 assert(Math.abs(s.zoom-zoom*110/194)<1e-9,'Spread failed to move paper nearer');assert.equal(s.yaw,127.3);assert.equal(s.pitch,-24.5);
}
console.log('PASS two-finger spread: preserves nonzero angles and magnifies from all former initial distances');
const guide=read('st-guide.js'),ga=guide.indexOf('  const inkSelector='),gb=guide.indexOf('  function tick(now)',ga);
for(const [w,h]of [[390,844],[844,390],[740,360],[768,1024],[1366,860]])for(const labelH of [29,80,114])for(const talking of [false,true]){
 const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
 const ink=[rect(w/2-70,118,140,44),rect(10,10,180,44),rect(w-124,10,114,96),rect(10,h-190,140,180),rect(w-160,h-190,150,180)];
 if(h>w)ink.push(rect(w/2-180,180,360,70));
 const bubbles=talking?[rect(w/2-Math.min(160,w/2-20),h>w?200:20,Math.min(320,w-40),h>w?100:70)]:[];ink.push(...bubbles);
 const face=bubbles.map(b=>rect(b.left,b.bottom,b.width,h*.28));
 const c={label:{textContent:'Intergalactic Battles: An Old Hope — complete long title',getBoundingClientRect:()=>({width:180,height:labelH})},H:{ui:{el:{}}},document:{querySelectorAll:sel=>sel.startsWith('.np-bub')?bubbles.map(r=>({getBoundingClientRect:()=>r})):ink.map(r=>({getBoundingClientRect:()=>r}))},getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1',getPropertyValue:()=>0}),clamp:(x,a,b)=>Math.max(a,Math.min(b,x))};
 vm.runInNewContext(guide.slice(ga,gb),c);const p=c.guidePosition(w-25,156,w,h,1000);
 // While someone talks, a tall tag may wait for the line to finish (as before), but a one-line tag still fits.
 if(!p&&talking&&labelH>29)continue;assert(p,`No space for complete label ${w}x${h} h${labelH}`);
 const box=rect(p.x+(p.side==='left'?-27:-204),p.y-27,231,Math.max(54,labelH+10));
 assert(box.left>=0&&box.right<=w&&box.top>=0&&box.bottom<=h,'Complete guidance escaped view');
 assert(![...ink,...face].some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top),'Full label/arrow collided with HUD or a speaker');
}
console.log('PASS complete guidance: five viewports, three label heights, objective/carry/controls/counters, speaker kept clear');

/* House atmosphere and contact feedback. Three r128; centimetres, y down.
 * One bounded particle pool / one draw, one surface batch / one draw. No lights,
 * textures, timers, saved state, camera shake or simulation-transform changes. */
(function () {
  'use strict';
  const H=window.House,T=window.THREE;if(!H?.ok||!T||window.HouseVFX)return;
  const MAX=128,random=H.K.rnd(19991106),pool=Array.from({length:MAX},()=>({life:0}));
  const pos=new Float32Array(MAX*3),style=new Float32Array(MAX*4),colors=new Float32Array(MAX*3);
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('style',new T.BufferAttribute(style,4).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));
  geo.setDrawRange(0,0);
  const uniforms={pointScale:{value:650}};
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms,
    vertexShader:'uniform float pointScale; attribute vec4 style; varying vec4 vStyle; varying vec3 vColor; void main(){vStyle=style;vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(style.x*pointScale/max(1.0,-p.z),.7,96.0);}',
    fragmentShader:`varying vec4 vStyle; varying vec3 vColor;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;float c=cos(vStyle.w),s=sin(vStyle.w);p=mat2(c,-s,s,c)*p;float a;
        if(vStyle.z>1.5){float edge=abs(p.x)/max(.02,(1.0-abs(p.y))*.65);a=(1.0-smoothstep(.65,1.0,edge))*(1.0-smoothstep(.82,1.0,abs(p.y)));float vein=1.0-.3*exp(-abs(p.x)*35.0);gl_FragColor=vec4(vColor*vein,vStyle.y*a);}
        else {float d=dot(p,p);if(d>1.0)discard;a=exp(-d*3.8)*(1.0-smoothstep(.6,1.0,d));gl_FragColor=vec4(vColor,a*vStyle.y);}
        if(gl_FragColor.a<.003)discard;
      }`});
  const particles=new T.Points(geo,material);particles.name='house-pooled-atmosphere';particles.frustumCulled=false;particles.visible=false;particles.userData.noPick=true;H.root.add(particles);
  const events={grab:0,contact:0,door:0,switch:0,kettle:0},pending=new Set(),pulses=new Map(),latches=new Map(),switches=new Map(),restores=[],leverRestores=[];
  let cursor=0,active=0,last=0,nextEmit=0,nextBreath=0,nextLeaf=0,nextDust=0,nextMug=0,boilingUntil=0;
  let rung=H.graphicsGet().adapt,cap=128;const tint=new T.Color(),point=new T.Vector3(),inverse=new T.Matrix4();
  function quality(){rung=H.graphicsGet().adapt;cap=[128,96,64,40,16,0][rung]??0;for(let i=cap;i<MAX;i++)pool[i].life=0;if(!cap){active=0;particles.visible=false;geo.setDrawRange(0,0);}}
  H.on('gfx',quality);quality();
  const near=(x,y,z,d=650)=>Math.hypot(x-H.P.x,y-H.P.y,z-H.P.z)<d;
  const shown=rid=>!!H.ROOMS[rid]?.group.visible;
  function emit(rid,x,y,z,vx,vy,vz,size,life,alpha,color,kind=0,effect='contact'){
    if(!shown(rid)||!near(x,y,z)||!H.stood)return;
    let p=null;for(let j=0;j<cap;j++){const i=(cursor+j)%cap;if(pool[i].life<=0){p=pool[i];cursor=(i+1)%cap;break;}}if(!p)return;
    tint.set(color);Object.assign(p,{rid,x,y,z,vx,vy,vz,size,life,total:life,alpha,r:tint.r,g:tint.g,b:tint.b,kind,effect:kind===1?'motes':kind===2?'leaves':effect,seed:random()*6.28});
  }
  function steam(rid,x,y,z,strength=1){emit(rid,x+(random()-.5)*2,y,z+(random()-.5)*2,(random()-.5)*3,-9-random()*5,(random()-.5)*2,4,1.8+random()*.5,.2*strength,'#dce5df',0,'steam');}
  function contact(id){const t=H.THINGS[id];if(!t||!pending.delete(id)||t.at.hide)return;
    events.contact++;pulse(id,'settle');
    const a=t.at,n=rung>=4?2:5,spread=Math.min(12,Math.max(t.hx||4,t.hz||4));
    for(let i=0;i<n;i++){const an=i*6.28/n;emit(a.room,a.x+Math.cos(an)*spread*.65,a.y-.35,a.z+Math.sin(an)*spread*.65,Math.cos(an)*8,-2-random()*3,Math.sin(an)*8,3+random()*2,.42+random()*.22,.16,'#b7aa91');}
  }
  function pulse(id,kind){if(H.motion.reduce)return;pulses.set(id,{kind,start:performance.now()});H.anims.set('vfx:'+id,now=>now-(pulses.get(id)?.start||0)<360);}
  H.on('grab',id=>{events.grab++;pending.delete(id);pulse(id,'pickup')});
  H.on('place',id=>{pending.add(id);pulses.delete(id)});H.on('rest',contact);H.on('snap',(slot,id)=>{pending.add(id);contact(id)});
  H.on('tidy',()=>{pending.clear();pulses.clear()});
  H.on('click',id=>{if(id==='hs.kettle'){events.kettle++;boilingUntil=performance.now()+14000;}if(id.startsWith('hs.switch.')){events.switch++;if(!H.motion.reduce){switches.set(id,performance.now());H.anims.set('vfx:'+id,now=>now-(switches.get(id)||0)<220);}}});
  H.on('door',id=>{events.door++;if(!H.motion.reduce){latches.set(id,performance.now());H.anims.set('vfx:latch:'+id,now=>now-(latches.get(id)||0)<240);}});

  // Surface-bound ink. Each quad lies on real plaster or glazing, never in mid-air.
  // TV spill and cold-glass beads share this one batch and one shader.
  const surfaceGeo=new T.BufferGeometry(),vertices=[],uvs=[],kinds=[];
  function quad(a,b,c,d,kind){for(const [v,u]of [[a,[0,0]],[b,[1,0]],[c,[1,1]],[a,[0,0]],[c,[1,1]],[d,[0,1]]]){vertices.push(...v);uvs.push(...u);kinds.push(kind)}}
  quad([-279.92,110,310],[-279.92,110,580],[-279.92,300,580],[-279.92,300,310],0);
  quad([-260,95.08,312],[80,95.08,312],[80,95.08,595],[-260,95.08,595],0);
  const rz=H.REAR.z1-8.7;
  // Sink window: split around the central mullion, inset from the frame.
  for(const [x0,x1]of [[-153,-104],[-96,-47]])quad([x0,150,rz],[x1,150,rz],[x1,246,rz],[x0,246,rz],1);
  for(const [index,w]of H.REAR.bedroomWindows.entries()){const mid=(w.x0+w.x1)/2,ys=index===0?[[w.y0+8,w.y1-8]]:[[w.y0+8,w.y0+27],[w.y0+33,w.y1-8]];for(const [x0,x1]of [[w.x0+8,mid-4],[mid+4,w.x1-8]])for(const [y0,y1]of ys)quad([x0,y0,-67.65],[x1,y0,-67.65],[x1,y1,-67.65],[x0,y1,-67.65],2);}
  surfaceGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));surfaceGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));surfaceGeo.setAttribute('kind',new T.Float32BufferAttribute(kinds,1));
  const su={tv:{value:new T.Color('#7898ae')},gain:{value:0},cold:{value:0},kitchen:{value:0},bedroom:{value:0},lounge:{value:0}};
  const surfaceMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,premultipliedAlpha:true,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendEquation:T.AddEquation,uniforms:su,
    vertexShader:'attribute float kind; varying float vKind; varying vec2 vUv; void main(){vKind=kind;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform vec3 tv; uniform float gain,cold,kitchen,bedroom,lounge; varying float vKind; varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=vUv;float a;vec3 col;
        if(vKind<.5){float d=length((p-vec2(.25,.35))*vec2(1.2,1.0));a=(1.0-smoothstep(.05,.8,d))*gain*lounge;col=tv;}
        else {vec2 cell=floor(p*vec2(34.0,26.0));vec2 q=fract(p*vec2(34.0,26.0));float seed=hash(cell);vec2 centre=vec2(.25+seed*.5,.25+hash(cell+7.0)*.5);float d=length((q-centre)*vec2(1.0,.7));float bead=(1.0-smoothstep(.04,.15,d))*step(.73,seed);float rim=smoothstep(.6,1.0,p.y)*.055+pow(abs(p.x-.5)*2.0,8.0)*.04;a=(rim+bead*.28)*cold*(vKind<1.5?kitchen:bedroom);col=vec3(.67,.77,.8);}
        if(a<.002)discard;gl_FragColor=vKind<.5?vec4(col*a*1.8,0.0):vec4(col*a,a);
      }`});
  const surfaces=new T.Mesh(surfaceGeo,surfaceMat);surfaces.name='house-plaster-and-glass-effects';surfaces.frustumCulled=false;surfaces.visible=false;surfaces.userData.noPick=true;H.root.add(surfaces);
  const sample=document.createElement('canvas');sample.width=sample.height=4;const sg=sample.getContext('2d',{willReadFrequently:true});let sampleAt=0,tvTarget=0;
  function tvFrame(canvas){const now=performance.now();if(now<sampleAt||rung>=4||!shown('lounge')||!H.stood)return;sampleAt=now+300;
    sg.drawImage(canvas,0,0,4,4);const data=sg.getImageData(0,0,4,4).data;let r=0,g=0,b=0;for(let i=0;i<64;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];}su.tv.value.setRGB(.25+r/8160,.3+g/8160,.38+b/8160);tvTarget=.035+(r+g+b)/12240*.1;
  }
  // Apply squash only during rendering and restore in finally. Collision, saves,
  // held virtual positions and the placement ghost always see original transforms.
  function levers(data,angle){const p=data.geometry.attributes.position,n=data.geometry.attributes.normal,c=Math.cos(angle),s=Math.sin(angle);for(const r of data.ranges){for(let i=r.first;i<r.first+r.count;i++){const j=i*3,x=data.position[j]-r.x,y=data.position[j+1]-r.y,z=data.position[j+2]-r.z;const nx=data.normal[j],ny=data.normal[j+1],nz=data.normal[j+2],sn=s*r.dir;
      if(r.along){p.setXYZ(i,r.x+x*c-y*sn,r.y+x*sn+y*c,r.z+z);n.setXYZ(i,nx*c-ny*sn,nx*sn+ny*c,nz)}else{p.setXYZ(i,r.x+x,r.y+y*c+z*sn,r.z-y*sn+z*c);n.setXYZ(i,nx,ny*c+nz*sn,-ny*sn+nz*c)}
    }}p.needsUpdate=n.needsUpdate=true;}
  function beforeRender(){const now=performance.now();
    for(const [id,start]of latches){const k=(now-start)/240,data=H.DOORS[id]?.pivot?.userData.vfxLevers;if(k>=1||!data||H.motion.reduce){latches.delete(id);continue}levers(data,Math.sin(k*Math.PI)*.2);leverRestores.push(data);}
    for(const [id,start]of switches){const k=(now-start)/220,o=H.SPOTS[id]?.obj?.getObjectByName('switch-rocker');if(k>=1||!o||H.motion.reduce){switches.delete(id);continue}restores.push({o,rx:o.rotation.x});o.rotation.x+=Math.sin(k*Math.PI*2)*(1-k)*.065;o.updateMatrix();}
    for(const [id,p]of pulses){const t=H.THINGS[id],k=(now-p.start)/320;if(!t||k>=1||H.motion.reduce){pulses.delete(id);continue;}if(p.kind==='pickup'&&t.st!=='held')continue;if(p.kind==='settle'&&!['rest','snap'].includes(t.st))continue;
      const o=t.obj,s=o.scale;restores.push({o,x:s.x,y:s.y,z:s.z,py:o.position.y});const v=Math.sin(Math.min(1,k)*Math.PI*2)*Math.pow(1-k,2)*(p.kind==='pickup'?.065:.024);s.set(s.x*(1+v*.5),s.y*(1-v),s.z*(1+v*.5));o.updateMatrix();}
  }
  function afterRender(){for(const r of restores){if(r.rx!==undefined)r.o.rotation.x=r.rx;else {r.o.scale.set(r.x,r.y,r.z);r.o.position.y=r.py;}r.o.updateMatrix();r.o.updateMatrixWorld(true)}restores.length=0;for(const d of leverRestores)levers(d,0);leverRestores.length=0;}
  function tick(now){
    const dt=Math.min(.12,(now-(last||now))/1000);last=now;
    if(!cap||H.paused||!H.stood||!['walk','focus','glide'].includes(H.mode)){const was=particles.visible||surfaces.visible;if(active){for(const p of pool)p.life=0;active=0;geo.setDrawRange(0,0);}particles.visible=surfaces.visible=false;return was;}
    const ph=window.HouseEnvironment?.phase||'day',date=window.OwnerTools?.now()||new Date(),month=date.getMonth(),cold=month>=10||month<=1;
    su.kitchen.value=shown('kitchen')?1:0;su.bedroom.value=shown('bedroom')?1:0;su.lounge.value=shown('lounge')?1:0;
    su.cold.value=cold&&ph!=='day'&&rung<4?1:0;
    const target=window.HouseTelly?.on&&rung<4?tvTarget:0;su.gain.value+=(target-su.gain.value)*Math.min(1,dt*5);
    surfaces.visible=su.gain.value>.002&&shown('lounge')||su.cold.value>0&&(shown('kitchen')||shown('bedroom'));
    if(now>=nextEmit){nextEmit=now+(rung>=3?420:140);if(shown('kitchen')&&near(-187,235,-156,400))steam('kitchen',-187.2,238.8,-36-H.REAR.extension,now<boilingUntil?1.4:.65);}
    if(now>=nextMug){nextMug=now+(rung>=3?900:330);for(const c of Object.values(window.HouseFamily?.chars||{})){const bone=c.rig?.bones?.p_mug;if(!c.present||!bone||bone.scale.x<.8||!shown(c.room||'kitchen'))continue;bone.updateWorldMatrix(true,false);bone.getWorldPosition(point);inverse.copy(H.root.matrixWorld).invert();point.applyMatrix4(inverse);if(near(point.x,point.y,point.z,300))steam(c.room||H.here,point.x,point.y-5,point.z,.5);}}
    if(now>=nextDust){nextDust=now+(rung>=3?1700:400);if(ph==='day'&&rung<4&&!H.motion.reduce){if(shown('bedroom')){const windows=H.REAR.bedroomWindows,w=windows[(random()*windows.length)|0];emit('bedroom',w.x0+15+random()*(w.x1-w.x0-30),w.y0+random()*(w.y1-w.y0),-35+random()*90,.6,-.6,.4,.3+random()*.35,5,.45,'#f0dfb0',1);}if(shown('kitchen'))emit('kitchen',-150+random()*95,155+random()*95,-150+random()*80,.6,-.4,.3,.35,5,.4,'#eadbbb',1);}}
    if(now>=nextBreath){nextBreath=now+4200;if(cold&&ph!=='day'&&H.ROOMS[H.here]?.outside&&!H.motion.reduce){const a=H.P.ry*Math.PI/180;for(let i=0;i<(rung>=3?2:4);i++)emit(H.here,H.P.x+Math.sin(a)*23,H.P.y+9,H.P.z-Math.cos(a)*23,Math.sin(a)*11+(random()-.5)*3,-3, -Math.cos(a)*11,4+i,1.15,.2,'#b8c8ce',0,'breath');}}
    if(now>=nextLeaf){nextLeaf=now+(rung>=3?2200:850);if(shown('garden')&&month>=8&&!H.motion.reduce)emit('garden',-240+random()*550,330-random()*18,-320-random()*600,9+random()*9,-2,3,3+random()*2,4,.85,random()>.5?'#927044':'#a1542c',2);}
    active=0;
    for(let i=0;i<cap;i++){const p=pool[i];if(p.life<=0)continue;if(p.kind===1&&ph!=='day'){p.life=0;continue;}p.life-=dt;if(p.life<=0||!shown(p.rid))continue;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const age=1-p.life/p.total,j=active*3,s=active*4;
      pos[j]=p.x+Math.sin(age*6+p.seed)*(p.kind===2?2:.45);pos[j+1]=p.y;pos[j+2]=p.z;
      colors[j]=p.r;colors[j+1]=p.g;colors[j+2]=p.b;style[s]=p.size*(p.kind===0?1+age*2:1);style[s+1]=p.alpha*Math.sin(age*Math.PI);style[s+2]=p.kind;style[s+3]=p.seed+age*(p.kind===2?5:1);active++;
    }
    const was=particles.visible;particles.visible=active>0;geo.setDrawRange(0,active);if(active){geo.attributes.position.needsUpdate=true;geo.attributes.style.needsUpdate=true;geo.attributes.color.needsUpdate=true;uniforms.pointScale.value=H.ren.domElement.height/(2*Math.tan(H.camera.fov*Math.PI/360));}
    return active>0||was||surfaces.visible&&su.gain.value>.002;
  }
  H.ambient.add(tick);
  window.HouseVFX={beforeRender,afterRender,tvFrame,stats:()=>{const sources={};for(let i=0;i<cap;i++){const p=pool[i];if(p.life>0&&shown(p.rid))sources[p.effect]=(sources[p.effect]||0)+1;}return{active,capacity:cap,draws:(particles.visible?1:0)+(surfaces.visible?1:0),events:{...events},sources,pulses:pulses.size,tvGain:su.gain.value,cold:su.cold.value}}};
})();

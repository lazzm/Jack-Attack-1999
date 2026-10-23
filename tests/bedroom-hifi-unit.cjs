'use strict';
// CPU-only model/controller checks. No browser, server, accounts or disk saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js');
const source=fs.readFileSync(require.resolve('../app/public/js/rm-room.js'),'utf8');
const kitSource=fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8');
const hifiSource=fs.readFileSync(require.resolve('../app/public/js/rm-hifi.js'),'utf8');
function fixture(saved={}, options={}) {
  const writes=new Map(),events={},listeners={},notes=[],music=[],blocks=[];
  let held=null,now=1000;
  writes.set('jhp_hifi',JSON.stringify(saved));
  const paint=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>({addColorStop(){}}),measureText:s=>({width:s.length*10})},{get:(o,k)=>k in o?o[k]:()=>{}});
  const ctx={console,THREE:T,performance:{now:()=>now},localStorage:{getItem:k=>writes.get(k)||null,setItem:(k,v)=>writes.set(k,v)},setTimeout:fn=>{fn();return 1},clearTimeout(){},document:{createElement:()=>({getContext:()=>paint}),addEventListener:(ev,fn)=>{(listeners[ev]??=[]).push(fn)}},window:null};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(kitSource,ctx);
  const K=ctx.HouseKit;
  const H={THINGS:{},SPOTS:{hifi:{}},OPEN:{},SNAPS:{},W:{x:0,z:0,lvl:'U'},here:'bedroom',_: {grids:{dirty:false}},ambient:new Set(),anims:new Map(),dirty(){},layerFor(){},saveThings(){},place(t){t.obj.position.set(t.at.x,t.at.y,t.at.z);t.obj.visible=!t.at.hide},held:()=>held,
    on(ev,fn){(events[ev]??=[]).push(fn)},emit(ev,...a){for(const fn of events[ev]||[])fn(...a)},spot(id,def){return this.SPOTS[id]={id,...def}},snap(id,def){return this.SNAPS[id]={id,...def}},
    block(lvl,x0,z0,x1,z1,o){const b={lvl,x0,z0,x1,z1,...o};blocks.push(b);return b},
    openable(id,def){this.SPOTS[id]={obj:def.pick||def.pivot};return this.OPEN[id]={id,open:false,k:0,ms:450,...def}},
    grab(id){if(held)return false;const t=this.THINGS[id];if(t.snap)this.SNAPS[t.snap]?.onUnsnap?.(t);t.snap=null;t.st='held';t.at.hide=false;t.obj.visible=true;held=id;this.emit('grab',id);return true}
  };
  const items={'pm.gub':{id:'pm.gub',audio:'gubbinz',title:'Gubbinz & The Robots: Greatest Hits'},'pm.mix':{id:'pm.mix',audio:'mix',title:"Dad's car mix"},rts:{id:'rts',title:'Game CD-ROM'}};
  const PM={item:id=>items[id],owns:id=>!!items[id]&&id!==options.unowned};
  const Sound={ready:true,musicOn:true,volume:1,addTune(){},setVolume(v){this.volume=v},music:{playing:'',play(n){this.playing=n;music.push(n)},stop(){this.playing=''}}};
  Object.assign(ctx,{T,K,H,House:H,PM,PMGL:{built:!options.deferMedia},Sound,Room:{T,K,House:H,drive:()=>({thing:options.pcDisc||null}),toast:(...a)=>notes.push(a),say:(...a)=>notes.push(a),_:{secret(){},esc:s=>s}},FY:73,LX:-280,D2R:Math.PI/180,M:K.mat,R:{},tex:n=>K.tex(n,8,8,()=>{}),mPine:()=>K.mat('#ccaa77'),mMetal:K.mat('#999'),mBrass:K.mat('#cc9'),mDark:K.mat('#222'),A:{text(){},FONT:'Arial',HAND:'Arial'},toast(){},search(){},hifi(){}});
  const start=source.indexOf('  function buildWardrobe('),end=source.indexOf('  // ---------------------------------------------------------------- the front wall:',start);
  vm.runInContext(source.slice(start,end),ctx);
  const room={group:new T.Group()},batch=K.batch();ctx.buildWardrobe(K.into(batch),room);batch.build(room.group);
  const model=ctx.R.hifi;
  function disc(id,kind='disc',snap=null){const t={id,kind,obj:new T.Group(),st:snap?'snap':'rest',snap,rx:0,rz:0,at:{room:'bedroom',x:0,y:0,z:0,hide:false}};H.THINGS[id]=t;return t}
  const cd=disc('pmd.pm.gub'),mix=disc('pmd.pm.mix'),data=disc('pmd.rts'),game=disc('media.ps.foo','console-disc');
  if(options.nativeDisc){H.THINGS[options.nativeDisc].snap='hifi.cd';H.THINGS[options.nativeDisc].st='snap'}
  const api={ctx,H,K,room,model,cd,mix,data,game,notes,music,blocks,writes,paint,disc,
    tick(ms=500){now+=ms;for(const [key,fn]of H.anims)if(!fn(now))H.anims.delete(key);for(const fn of H.ambient)fn(now)},
    init(){vm.runInContext(hifiSource,ctx);this.player=ctx.RoomHiFi.init(model);return this.player},
    insert(t){assert(model.slot.enabled());assert(model.slot.accepts(t.kind,t));assert.notEqual(model.slot.onBegin(t),false);t.st='anim';this.tick();t.st='snap';t.snap=model.slot.id;model.slot.onSnap(t)},
    release(){held=null},
    snapshot(){return JSON.parse(writes.get('jhp_hifi'))}
  };return api;
}
const f=fixture(),p=f.init();
assert.equal(f.ctx.RoomHiFi.init(f.model),p,'Double init duplicates controls');
assert(p.accepts(f.cd));assert(p.accepts(f.mix));assert(!p.accepts(f.data));assert(!p.accepts(f.game));
assert(!fixture({}, {unowned:'pm.gub'}).init().accepts(f.cd),'Unowned music accepted');
p.use();assert(p.state.open);f.tick();f.insert(f.cd);assert.equal(p.state.disc,f.cd.id);assert(!f.model.slot.enabled());
assert.equal(p.state.playing,false);p.use();assert(p.state.playing);assert.equal(f.cd.at.hide,true);assert.equal(f.ctx.Sound.music.playing,'room_hifi_gubbinz_0');
p.next();assert.equal(f.ctx.Sound.music.playing,'room_hifi_gubbinz_1');p.use();assert(!p.state.playing);
p.use();f.ctx.Sound.music.playing='some_other_game';p.stop();assert.equal(f.ctx.Sound.music.playing,'some_other_game','Hi-fi stopped another application');
p.eject();assert.equal(f.H.held(),f.cd.id);assert.equal(p.state.disc,null);assert(f.cd.obj.visible);assert.equal(f.cd.snap,null);assert.equal(f.model.tray.position.z,19);
f.release();f.insert(f.mix);p.use();assert(f.ctx.Sound.music.playing.startsWith('room_hifi_mix_'));
const restored=fixture(f.snapshot(),{nativeDisc:'pmd.pm.mix'});restored.init();assert.equal(restored.mix.snap,'hifi.cd');assert(restored.mix.at.hide);assert(restored.player.state.playing);
restored.H.emit('tidy','kitchen');assert.equal(restored.player.state.disc,restored.mix.id);
restored.H.emit('tidy','bedroom');assert.equal(restored.player.state.disc,null);
// Mid-insertion refresh: record commits the physical destination before glide.
const midway=fixture();midway.init().use();midway.tick();midway.model.slot.onBegin(midway.cd);midway.cd.st='anim';
const interrupted=fixture(midway.snapshot());interrupted.init();assert.equal(interrupted.cd.snap,'hifi.cd');assert(interrupted.cd.obj.visible);assert(interrupted.player.state.open);
// The PC keeps a disc explicitly moved there after a stale hi-fi save.
const pc=fixture({disc:'pmd.pm.gub',playing:true},{pcDisc:'pmd.pm.gub'});pc.cd.snap='pc.cd';pc.cd.st='snap';pc.init();assert.equal(pc.player.state.disc,null);assert.equal(pc.cd.snap,'pc.cd');
const stale=fixture({disc:'pmd.pm.gub',playing:true});stale.init();assert.equal(stale.cd.snap,null);assert.equal(stale.player.state.disc,null,'Stale player state took a disc back out of its case');
// PMGL returning directly to a case clears playback without a drive event.
f.mix.snap=null;f.mix.st='rest';f.tick();assert.equal(p.state.disc,null);assert.equal(f.ctx.Sound.music.playing,'');
const deferred=fixture({disc:'pmd.pm.gub',playing:true},{deferMedia:true,nativeDisc:'pmd.pm.gub'});deferred.init();assert.equal(deferred.cd.at.hide,false);deferred.ctx.PMGL.built=true;deferred.tick();assert.equal(deferred.cd.snap,'hifi.cd');
// Every generated solid has finite geometry; wardrobe leaves stop clear of
// the chest, and each drawer exposes a real box rather than a painted front.
f.room.group.updateMatrixWorld(true);
let meshes=0;f.room.group.traverse(o=>{if(o.geometry){meshes++;assert([...o.geometry.attributes.position.array].every(Number.isFinite),'Non-finite model geometry')}});assert(meshes>25);
for(let i=0;i<2;i++) {const d=f.H.OPEN['wardrobe'+i];d.pivot.rotation.y=d.amt*Math.PI/180;d.pivot.updateMatrixWorld(true);const box=new T.Box3().setFromObject(d.pivot);assert(box.max.z<178,'Wardrobe intersects chest');assert(box.min.z>65,'Wardrobe crosses neighbouring furniture')}
for(let i=0;i<3;i++){const d=f.H.OPEN['bedroom.drawer.'+i];assert.equal(d.amt,25);assert(d.pivot.children.length>0);assert(d.canToggle(true));d.open=true;d.onToggle(true);assert(f.blocks.some(b=>b.x0===-230&&!b.off),'Open drawer has no collision');d.open=false;d.onToggle(false)}
assert(!/PM\.insert\(|Discs\.insert\(|RoomTV|autorun\(/.test(hifiSource),'Hi-fi must never invoke software runtimes');
console.log('BEDROOM HI-FI UNIT PASS: actual THREE models, owned audio-only insertion, play/pause/next, removal, other music ownership, restore/deferred/mid-insertion/PC precedence, tidy and drawer/wardrobe clearances');
// Exercise the real close/room listeners with an intentionally stale upstairs
// return pose, including a pending delayed close during a room transition.
{
  const timers=new Map(),glides=[],callbacks={};let seq=0;
  const c={console,window:null,EVS:{},back:{x:10,y:-55,z:100},pending:false,boT:0,bitsEpoch:0,tvFocus:false,
    pb:{querySelector:()=>null,classList:{toggle(){}}},emit(){},ensureHouse:()=>Promise.resolve(),
    setTimeout:fn=>{timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id),
    H:{here:'kitchen',unfocus(){throw Error('Stale bedroom focus returned downstairs')},glideTo:p=>glides.push(p),setWalkFrom(){},on:(ev,fn)=>callbacks[ev]=fn}};
  c.window=c;vm.createContext(c);
  const backStart=source.indexOf('  function backOut()'),backEnd=source.indexOf('\n',backStart);
  vm.runInContext(source.slice(backStart,backEnd),c);
  const closeStart=source.indexOf('  (EVS.close ='),closeEnd=source.indexOf("  H.on('station'",closeStart);
  vm.runInContext(source.slice(closeStart,closeEnd),c);
  c.EVS.close[0]();assert.equal(timers.size,0);assert.equal(c.back,null);assert.equal(glides.length,0);
  c.H.here='bedroom';c.back={x:20,y:-55,z:140};c.EVS.close[0]();assert.equal(timers.size,1);
  c.H.here='kitchen';callbacks.room('kitchen','bedroom');assert.equal(timers.size,0);assert.equal(c.back,null);assert.equal(c.bitsEpoch,1);
  c.H.here='bedroom';callbacks.room('bedroom','kitchen');c.EVS.close[0]();for(const fn of timers.values())fn();timers.clear();assert.equal(glides.length,0);
  c.back={x:30,y:-55,z:150};c.EVS.close[0]();for(const fn of timers.values())fn();assert.equal(glides.length,1);assert.equal(glides[0].x,30);
  c.H.here='hall';c.back={x:40};c.backOut();assert.equal(glides.length,1);assert.equal(c.back,null);
  console.log('BEDROOM LIFECYCLE PASS: downstairs UI close, pending close on room change, return-room stale close and valid bedroom return');
}

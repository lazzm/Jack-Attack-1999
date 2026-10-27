'use strict';
// CPU-only phone geometry/lifecycle regression. No browser, server or disk saves.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const T = require('../app/public/vendor/three.min.js');
const source = fs.readFileSync(require.resolve('../app/public/js/hs-mobile.js'),'utf8');
const kit = fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8');
function fixture() {
  let now=0, timerId=0, held=null, inspection=null, focus=null, saves=0, dirties=0;
  const timers=new Map(), events=new Map(), storage=new Map(), surfaces=[], texts=[], dirtyTimes=[];
  for(const k of ['jhp_hs_pose','jhp_hs_stand'])storage.set(k,JSON.stringify({x:40,y:-80,z:155,seat:0}));
  events.set('pagehide',[()=>{for(const k of ['jhp_hs_pose','jhp_hs_stand'])storage.set(k,'temporary camera pose')}]);
  function element() {return {style:{},classList:{add(){}},setAttribute(k,v){this[k]=v},addEventListener(k,v){this[k]=v},remove(){this.removed=true},closest(){return null}};}
  function canvas() {
    const e=element(); e.width=96;e.height=64;
    const c={fillRect(){},fillText(t){texts.push(t)},beginPath(){},moveTo(){},lineTo(){},stroke(){},
      createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},
      putImageData(image){this.pixels=new Uint8ClampedArray(image.data)},
      getImageData(){return {data:this.pixels||new Uint8ClampedArray(e.width*e.height*4)}}};
    e.getContext=()=>c;return e;
  }
  const context={console, THREE:T, Room:{}, Cast:{t:s=>String(s).replace(/\{me\}/g,"Sam")}, HouseArt:{UIF:'Arial',text(c,t){texts.push(t)}},
    innerWidth:390,innerHeight:844,performance:{now:()=>now},Uint8ClampedArray,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{addEventListener(k,v){if(!events.has(k))events.set(k,[]);events.get(k).push(v)},createElement:t=>t==='canvas'?canvas():element()},
    addEventListener(k,v){if(!events.has(k))events.set(k,[]);events.get(k).push(v)},
    setTimeout(fn,ms=0){const id=++timerId;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)};
  context.window=context; vm.runInNewContext(kit,context);
  const root=new T.Group();root.scale.y=-1;
  const things=new T.Group(), group=new T.Group();root.add(things,group);
  const panel=element(), H=context.House={ok:true,K:context.HouseKit,T,root,
    camera:{fov:45,near:6}, P:{x:40,y:-80,z:155,rx:-8,ry:-40},W:{lvl:'U',seat:0},live:true,mode:'walk',here:'bedroom',
    ROOMS:{bedroom:{things,group}},SPOTS:{},anims:new Map(),ambient:new Set(),paused:false,
    sfx:{tone(){},noise(){}},say(){},toast(){},hush(){},restoreThing(){},
    ui:{el:{querySelector:()=>panel},focusBar(){}},on(){},
    setWalkFrom(){},dirty(){dirties++;dirtyTimes.push(now)},saveWalkState(){saves++},held:()=>held,
    thing(id,def){const t={...def,id,at:{...def.home},st:'rest'};things.add(t.obj);t.obj.position.set(t.at.x,t.at.y,t.at.z);t.obj.rotation.y=t.at.ry*Math.PI/180;return t},
    inspect(){assert.equal(held,'mobile');inspection=held;held=null;this.mode='inspect';context.HouseMobile.thing.st='inspect';return true},
    endInspect(){if(!inspection)return;held=inspection;inspection=null;this.mode='walk';context.HouseMobile.thing.st='held';context.HouseMobile.thing.onInspectEnd?.()},
    focus(pose,options){assert.equal(held,null,'H.focus must never drop a live grip');focus={pose,options,back:{...this.P}};this.mode='glide';return true},
    unfocus(){if(!focus)return;const f=focus;focus=null;f.options.exit();Object.assign(this.P,f.back);this.mode='walk'},
    get focused(){return !!focus},
    surface(el,quad){const s={el,quad,close(){el.remove();surfaces.splice(surfaces.indexOf(s),1)}};surfaces.push(s);return s},
    _:{setMode(m){H.mode=m}}};
  const lcd=canvas(), original=lcd.getContext().putImageData, presses=[];
  context.FamilyPhone={open(){return {el:{style:{},querySelector:()=>lcd},close(){}}},press:k=>presses.push(k)};
  vm.runInNewContext(source,context);
  function advance(ms){const until=now+ms;for(;;){let next=null;for(const[id,t]of timers)if(t.at<=until&&(!next||t.at<next[1].at))next=[id,t];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn()}now=until;}
  return {context,H,surfaces,lcd,original,presses,texts,storage,timers,dirtyTimes,
    get saves(){return saves}, get dirties(){return dirties},get focus(){return focus},get held(){return held},
    hold(){held='mobile';context.HouseMobile.thing.st='held'},
    async enter(){Object.assign(H.P,focus.pose);H.mode='focus';focus.options.enter();await Promise.resolve();await Promise.resolve()},advance,
    hide(){for(const fn of events.get('pagehide')||[])fn()},
    resize(w,h){context.innerWidth=w;context.innerHeight=h;for(const fn of events.get('resize')||[])fn()},
    key(key){const ev={key,target:element(),preventDefault(){},stopImmediatePropagation(){}};if(inspection)context.HouseMobile.thing.onInspectKey(ev);else for(const fn of events.get('keydown')||[])fn(ev)},
    get texture(){let found;context.HouseMobile.thing.obj.traverse(o=>{if(o.material?.map?.image===lcd)found=o.material.map});return found}
  };
}
(async()=>{
  const f=fixture(), mobile=f.context.HouseMobile, t=mobile.thing;
  assert(['ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ','SPACE'].every(s=>f.texts.includes(s)),'Physical key lettering');
  let triangles=0;t.obj.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;triangles+=p.count/3;for(const n of p.array)assert(Number.isFinite(n),'Finite geometry')}});assert(triangles>100);
  const home=JSON.stringify(t.home);
  const bounds=new T.Box3();t.obj.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrix))}});
  const size=bounds.getSize(new T.Vector3());assert(size.x>=4.7&&size.x<=4.9);assert(size.y>=2.6&&size.y<=2.8);assert(size.z>=14.8&&size.z<=15.2,'Believable candy-bar proportions with a short aerial');
  // All three placements use the same physical prop without persisting a camera pose.
  for (const placement of ['table','floor','held']) {
    if(placement==='floor'){t.at.y=73;t.obj.position.y=73}
    if(placement==='held')f.hold();
    const before=JSON.stringify(t.at), position=t.obj.position.clone(), saved=[...f.storage].filter(([k])=>k.startsWith('jhp_hs_'));
    mobile.use();assert(f.H.focused);assert.equal(JSON.stringify(t.at),before);
    mobile.use();assert.equal(f.saves,['table','floor','held'].indexOf(placement)+1,'Repeated use ignored');
    f.hide();assert.deepEqual([...f.storage].filter(([k])=>k.startsWith('jhp_hs_')),saved,'Refresh during entry keeps standing snapshots');
    await f.enter();f.hide();assert.deepEqual([...f.storage].filter(([k])=>k.startsWith('jhp_hs_')),saved,'Refresh in focus keeps standing snapshots');
    assert.equal(f.surfaces.length,16);assert.equal(f.H.ambient.size,0);
    assert(t.obj.position.equals(position),'Use never repositions phone');
    assert.equal(f.texture.flipY,false);assert.equal(f.texture.generateMipmaps,false);
    f.key('2');f.key('Backspace');assert.deepEqual(f.presses.slice(-2),['2','c']);
    f.surfaces.find(s=>s.el['aria-label']==='Phone 7 PQRS').el.click();assert.equal(f.presses.at(-1),'7');
    const version=f.texture.version, dirty=f.dirties;
    const c=f.lcd.getContext(), pixels=c.getImageData();
    for(let i=0;i<100;i++)c.putImageData(pixels,0,0);
    f.advance(1000);assert.equal(f.texture.version,version);assert.equal(f.dirties,dirty,'Unchanged LCD never dirties world');
    for(let i=0;i<100;i++){pixels.data[0]=i+1;c.putImageData(pixels,0,0)}
    f.advance(50);assert.equal(f.texture.version,version+1,'Rapid LCD flushes coalesce');
    const sustained=f.texture.version, stamp=f.dirtyTimes.length;
    for(let i=0;i<100;i++){pixels.data[1]=i+1;c.putImageData(pixels,0,0);f.advance(5)}
    assert(f.texture.version-sustained<=11,'At most ten intervals plus the initial upload in 500 ms');
    const uploaded=f.dirtyTimes.slice(stamp);for(let i=1;i<uploaded.length;i++)assert(uploaded[i]-uploaded[i-1]>=50,'LCD uploads must be at least 50 ms apart');
    for(const [w,h] of [[1366,860],[390,844],[844,390],[390,844]]){
      f.H.camera.fov=w===390?75:45;f.resize(w,h);const p=f.H.P;assert(Object.values(p).filter(v=>typeof v==='number').every(Number.isFinite));
      const rx=p.rx*Math.PI/180,ry=p.ry*Math.PI/180,forward=new T.Vector3(Math.sin(ry)*Math.cos(rx),-Math.sin(rx),-Math.cos(ry)*Math.cos(rx));
      const right=new T.Vector3(Math.cos(ry),0,Math.sin(ry)),up=new T.Vector3().crossVectors(right,forward);
      const tan=Math.tan(f.H.camera.fov*Math.PI/360), project=q=>{
        const v=new T.Vector3(...q).sub(new T.Vector3(p.x,p.y,p.z)),depth=v.dot(forward);
        assert(depth>f.H.camera.near,'Phone must clear the camera near plane');
        return{x:w/2+v.dot(right)/depth/tan*h/2,y:h/2-v.dot(up)/depth/tan*h/2};
      };
      for(const s of f.surfaces)for(const q of s.quad()){const v=project(q);assert(v.x>0&&v.x<w&&v.y>40&&v.y<h-65,`Key clipped at ${w}x${h}: ${JSON.stringify(v)}`)}
      const key=f.surfaces.find(s=>s.el['aria-label']==='Phone 2 ABC').quad().map(project);
      assert(Math.abs(key[1].x-key[0].x)>(h<540?25:43),'Keys must be large at close-up');
    }
    f.H.unfocus();f.hide();assert.deepEqual([...f.storage].filter(([k])=>k.startsWith('jhp_hs_')),saved,'Refresh on return keeps standing snapshots');
    assert.equal(f.surfaces.length,0);assert.equal(c.putImageData,f.original);
    assert.equal(JSON.stringify(t.at),before);assert.equal(JSON.stringify(t.home),home);
    const stopped=f.texture.version;f.advance(100);assert.equal(f.texture.version,stopped,'Closing cancels queued uploads');
    if(placement==='held')assert.equal(f.held,'mobile','Exit returns exact held grip');
  }
  for(const mode of ['monitor','inspect','off']){const no=fixture();no.H.mode=mode;no.context.HouseMobile.use();assert(!no.H.focused)}
  const paused=fixture();paused.H.paused=true;paused.context.HouseMobile.use();assert(!paused.H.focused);
  // Cancellation before mount and before asynchronous program load resolves.
  const g=fixture();g.hold();g.context.HouseMobile.use();g.H.unfocus();await Promise.resolve();assert.equal(g.held,'mobile');assert.equal(g.surfaces.length,0);
  let resolve;g.context.FamilyPhone=undefined;g.context.Apps={load:()=>new Promise(r=>resolve=r)};
  g.context.HouseMobile.use();await g.enter();g.H.unfocus();resolve();await Promise.resolve();assert.equal(g.surfaces.length,0);
  // A rejected load must release the camera/grip, then allow another attempt.
  g.context.Apps.load=()=>Promise.reject(Error('offline'));g.context.HouseMobile.use();await g.enter();await Promise.resolve();assert(!g.H.focused);assert.equal(g.held,'mobile');
  const b=fixture(), bt=b.context.HouseMobile.thing, start=bt.obj.position.clone();b.context.HouseMobile.buzz({from:'Dave'});b.H.anims.get('mobuzz')(100);b.context.HouseMobile.buzz({from:'Dave'});b.H.anims.get('mobuzz')(2300);assert(bt.obj.position.equals(start),'Repeated SMS buzz restores the natural resting pose');
  console.log('MOBILE PHONE UNIT PASS: solids/legends, in-place table/floor/held use, grip/cancellation/load-failure cleanup, stable refresh snapshots, portrait/landscape fit, physical keys, zero idle LCD work and coalesced uploads, natural SMS buzz');
})().catch(e=>{console.error(e);process.exitCode=1});

/* Spatial house sound. Existing meshes/door apertures only; no saved settings. */
(function () {
  'use strict';
  const S=window.Sound;if(!S)return;
  const live=new Set(),values=new WeakMap();
  let raf=0,next=0,ear=null,forward=null,up=null,acousticAt=0;
  const acousticCache=new Map();
  const value=(param,v,c,first)=>{
    if(!param||!Number.isFinite(v)||(!first&&Math.abs((values.get(param)??Infinity)-v)<.0001))return;
    values.set(param,v);
    if(first)param.setValueAtTime(v,c.currentTime);else param.setTargetAtTime(v,c.currentTime,.035);
  };
  // A cheapest acoustic route through real room links. A wide-open aperture
  // transmits much more high-frequency sound than a shut leaf; stairs stay open.
  function occlusion(from,to=window.House?.here){
    const H=window.House;if(!from||!to||from===to||!H?.DOORS)return 0;
    if(H.ROOMS?.[from]?.outside&&H.ROOMS?.[to]?.outside)return 0;
    const now=performance.now();if(now>=acousticAt){acousticAt=now+100;acousticCache.clear()}
    const key=from+'>'+to;if(acousticCache.has(key))return acousticCache.get(key);
    const result=n=>{n=Math.min(1,n);acousticCache.set(key,n);return n};
    const cost=new Map([[from,0]]),done=new Set();
    for(let i=0;i<24;i++){
      let room=null,best=Infinity;
      for(const [id,n]of cost)if(!done.has(id)&&n<best){best=n;room=id}
      if(room===to)return result(best);if(room===null)break;done.add(room);
      for(const d of Object.values(H.DOORS)){
        if(!d.rooms?.includes(room))continue;
        const aperture=d.always?1:Math.max(0,Math.min(1,d.ang||0));
        const loss=d.always ? .08 : .18+.72*(1-aperture);
        for(const id of d.rooms)if(id!==room&&best+loss<(cost.get(id)??Infinity))cost.set(id,best+loss);
      }
    }
    return result(1);
  }
  function listener(c,first){
    const cam=window.House?.camera,T=window.THREE;if(!cam||!T)return;
    if(!ear){ear=new T.Vector3();forward=new T.Vector3();up=new T.Vector3()}
    cam.updateMatrixWorld();cam.getWorldPosition(ear);cam.getWorldDirection(forward);up.set(0,1,0).applyQuaternion(cam.quaternion);
    const L=c.listener;
    if(L.positionX){
      for(const [prefix,p]of [['position',ear],['forward',forward],['up',up]])for(const axis of ['x','y','z'])value(L[prefix+axis.toUpperCase()],p[axis],c,first);
    }else{L.setPosition(ear.x,ear.y,ear.z);L.setOrientation(forward.x,forward.y,forward.z,up.x,up.y,up.z)}
  }
  const resolve=v=>typeof v==='function'?v():v;
  function update(h,first){
    const c=h.ctx,o=h.options;
    let p=null;try{p=resolve(o.position)}catch(e){}
    const centered=!!resolve(o.centered)||!p||!window.House?.live;
    value(h.direct.gain,centered?1:0,c,first);value(h.spatial.gain,centered?0:Math.SQRT2,c,first);
    if(p){for(const axis of ['x','y','z'])value(h.panner['position'+axis.toUpperCase()],p[axis],c,first)}
    const amount=centered?0:occlusion(resolve(o.room));
    value(h.wall.frequency,18000*Math.pow(900/18000,amount),c,first);value(h.wallGain.gain,1-.38*amount,c,first);
    if(o.level!==undefined)value(h.input.gain,Math.max(0,resolve(o.level)||0),c,first);
  }
  function soundFollow(now){
    raf=0;if(!live.size)return;
    if(now>=next){
      next=now+33;
      const heard=new Set();
      for(const h of live){if(h.ctx.state==='closed'){h.stop();continue}if(!heard.has(h.ctx)){listener(h.ctx,false);heard.add(h.ctx)}update(h,false)}
    }
    raf=requestAnimationFrame(soundFollow);
  }
  function emitter(c,o={}){
    if(!c)return null;
    const input=c.createGain(),panner=c.createPanner(),wall=c.createBiquadFilter(),wallGain=c.createGain(),spatial=c.createGain(),direct=c.createGain();
    panner.panningModel='equalpower';panner.distanceModel='inverse';panner.refDistance=200;panner.rolloffFactor=1;panner.maxDistance=6000;
    wall.type='lowpass';wall.Q.value=.5;
    const target=o.output||S.output(c,o.channel);
    input.connect(panner);panner.connect(wall);wall.connect(wallGain);wallGain.connect(spatial);spatial.connect(target);input.connect(direct);direct.connect(target);
    const h={ctx:c,options:o,input,panner,wall,wallGain,spatial,direct,stopped:false,
      stop(){if(h.stopped)return;h.stopped=true;live.delete(h);input.gain.cancelScheduledValues(c.currentTime);input.gain.setValueAtTime(input.gain.value,c.currentTime);input.gain.setTargetAtTime(0,c.currentTime,.012);setTimeout(()=>{for(const n of [input,panner,wall,wallGain,spatial,direct])n.disconnect()},150)}
    };
    listener(c,true);update(h,true);live.add(h);if(!raf)raf=requestAnimationFrame(soundFollow);return h;
  }
  Object.assign(S,{emitter,occlusion});
})();

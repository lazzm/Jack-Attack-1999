// Matched hall/landing art and software-renderer evidence; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import WebSocket from '../app/node_modules/ws/wrapper.mjs';
import {devices} from 'playwright';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'review2';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('shots/polish-1102/',import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const views=[
 ['landing-north',[290,-55,510],[320,-50,130],'U'],
 ['landing-south',[290,-55,270],[302,-30,700],'U'],
 ['landing-stairs',[385,-55,198],[330,110,470],'U'],
 ['hall-north',[277,225,460],[280,212,65],'G'],
 ['hall-south',[277,225,415],[295,211,700],'G'],
 ['hall-coats',[365,225,647],[210,230,630],'G'],
];
const report=await readFile(dir+tag+'-metrics.json','utf8').then(JSON.parse).catch(()=>({tag,load:os.loadavg(),views:[],errors:[]}));
const checks=process.env.POLISH_CHECKS==='1';
const originals=new Map(tag.startsWith('before')?['js/hs-house.js','js/hs-kit.js','js/hs-art.js','js/hs-world.js','js/st-guide.js','css/hs.css','css/st.css'].map(path=>['/'+path,execFileSync('git',['show','HEAD:app/public/'+path],{encoding:'utf8',maxBuffer:4e6})]):[]);
async function authenticatedStanding(){
 const name='Pol'+Date.now().toString(36);
 const session=await new Promise((resolve,reject)=>{
  const ws=new WebSocket(base.replace(/^http/,'ws')+'/ws',{origin:new URL(base).origin});let token;
  const timer=setTimeout(()=>{ws.close();reject(Error('Fixture authentication timed out'))},15000);
  ws.on('open',()=>ws.send(JSON.stringify({t:'hello',cid:'polish-fixture'})));ws.on('error',reject);
  ws.on('message',data=>{const m=JSON.parse(data);if(m.t==='welcome')ws.send(JSON.stringify({t:'login',name,pass:'Throwaway-1999',signup:true,me:{first:'Jack',g:'m'}}));if(m.t==='loginErr'){clearTimeout(timer);ws.close();reject(Error(m.msg));}if(m.t==='loginOk'){token=m.token;ws.send(JSON.stringify({t:'rmGet',since:0}));}if(m.t==='rmData'||m.t==='rmNone'){clearTimeout(timer);let profile={};if(m.data){const b=Buffer.from(m.data,'base64');profile=JSON.parse((m.enc==='gzip'?gunzipSync(b):b).toString());}ws.close();resolve({token,profile,ts:m.ts||0,rev:m.ownerRev||0});}});
 });
 const storage={...session.profile,jhp_token:session.token,jhp_everbooted:'1',jhp_off:'1',jhp_last:String(Date.now()),jhp_roam_who:name,jhp_roam_ts:String(session.ts),jhp_roam_ownerRev:String(session.rev),jhp_hs_stand:JSON.stringify({t:Date.now(),p:{x:290,y:-70,z:510,rx:0,ry:0,lvl:'U',seat:0}})};
 return {cookies:[],origins:[{origin:new URL(base).origin,localStorage:Object.entries(storage).map(([name,value])=>({name,value:String(value)}))}]};
}

const f=await roomFixture(base,{opening:true,resume:true,storageState:await authenticatedStanding(),hour:+(process.env.REVIEW_HOUR||9),width:320,height:240,touch:process.env.REVIEW_PHONE==='1',contextOptions:process.env.REVIEW_PHONE==='1'?{isMobile:true,userAgent:devices['iPhone 13'].userAgent,deviceScaleFactor:1}:{},timeoutScale:3,seed:1999,storage:{jhp_touch_slow_asked:true,jhp_world_audit:1}});
try{
 const p=f.page;p.setDefaultTimeout(120000);await p.setViewportSize({width:process.env.REVIEW_PHONE==='1'?390:1366,height:process.env.REVIEW_PHONE==='1'?844:860});
 await p.evaluate(()=>{House.adapt(3,{pin:true,force:true});House.ambient.clear();House.hush();HouseFamily.debug.speech.freeze=true;for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});
 for(const i of (process.env.REVIEW_VIEWS||'5,0,4,2').split(',').map(Number)){
  const [name,eye,target,level]=views[i];await f.view(eye,target,{level});await p.evaluate(()=>{House._.setMode('walk');House.hush();NPCBubble.clear();House.visCalc();House.dirty()});await p.waitForTimeout(500);
  const shot=async suffix=>p.screenshot({path:dir+tag+'-'+(process.env.REVIEW_HOUR||9)+'-'+name+suffix+'.png',timeout:120000});
  await shot('');
  if(process.env.REVIEW_DIAG==='1'){
   const info=await p.evaluate(()=>{
    const out=[],seen=new Set();House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.polygonOffset&&!seen.has(m)){seen.add(m);out.push({id:m.id,factor:m.polygonOffsetFactor,units:m.polygonOffsetUnits,spec:m.userData.spec,map:m.map?.name});}});return out;
   }).catch(e=>({error:e.message}));await writeFile(dir+'review2-offsets.json',JSON.stringify(info,null,2));
   await p.evaluate(()=>{House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.polygonOffset){m.userData.reviewFactor=m.polygonOffsetFactor;m.polygonOffsetFactor=0}});House.dirty()});await shot('-zero-slope');
   await p.evaluate(()=>{House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.userData.reviewFactor!==undefined)m.polygonOffsetFactor=m.userData.reviewFactor});House.dirty()});
  }

  if(process.env.REVIEW_VARIANTS==='1'){
   await p.evaluate(()=>{House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.transparent){m.userData.reviewVisible=m.visible;m.visible=false}});House.dirty()});await shot('-opaque-only');
   await p.evaluate(()=>{House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.userData.reviewVisible!==undefined)m.visible=m.userData.reviewVisible});House.camera.near=10;House.camera.updateProjectionMatrix();House.dirty()});await shot('-near10');
   await p.evaluate(()=>{House.camera.near=2;House.camera.updateProjectionMatrix();House.dirty()});
   const rays=await p.evaluate(()=>{
    const ray=new THREE.Raycaster(),out=[];ray.layers.enableAll();
    for(const[x,y]of [[1100,450],[1050,445],[900,442],[400,445],[1100,459]]){
     ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),House.camera);
     out.push({pixel:[x,y],hits:ray.intersectObject(House.scene,true).filter(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return [].concat(h.object.material).some(m=>m.visible)}).slice(0,20).map(h=>{const o=h.object,m=[].concat(o.material)[h.face.materialIndex||0],src=o.userData.auditSources?.find(s=>h.faceIndex*3>=s.start&&h.faceIndex*3<s.start+s.count);return{dist:h.distance,point:h.point.toArray(),name:o.name,geo:o.geometry.type,src:src?.source,parent:o.parent?.name,layer:o.layers.mask,tr:m.transparent,po:m.polygonOffsetFactor,map:Object.keys(House.K.TEX).find(k=>House.K.TEX[k]===m.map),color:m.color?.getHexString()}})});
    }
    return out;
   });await writeFile(dir+'review2-rays-'+name+'.json',JSON.stringify(rays,null,2));
  }

  if(process.env.REVIEW_SOURCE==='1'){
   const info=await p.evaluate(()=>{const seen=new Set(),out=[];House.scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(!seen.has(m)&&m.visible){seen.add(m);out.push({name:o.name,type:o.type,id:m.id,color:m.color?.getHexString(),basic:m.isMeshBasicMaterial,tr:m.transparent,depthTest:m.depthTest,depthWrite:m.depthWrite,map:Object.keys(House.K.TEX).find(k=>House.K.TEX[k]===m.map),program:m.type})}});return out;});await writeFile(dir+'review2-materials.json',JSON.stringify(info,null,2));
   const raw=await p.evaluate(()=>House.ren.domElement.toDataURL('image/png').split(',')[1]);await writeFile(dir+tag+'-'+(process.env.REVIEW_HOUR||9)+'-'+name+'-canvas.png',Buffer.from(raw,'base64'));
   await p.evaluate(()=>{HouseEnvironment.group.visible=false;HouseEnvironment.backdrop.visible=false;House.dirty()});await shot('-no-neighbourhood');
   await p.evaluate(()=>{HouseEnvironment.group.visible=true;HouseEnvironment.backdrop.visible=true;House.scene.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff});House.dirty()});await shot('-white-geometry');
   await p.evaluate(()=>{House.scene.overrideMaterial.dispose();House.scene.overrideMaterial=null;House.dirty()});
  }
  const counts=await p.evaluate(()=>({calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles}));console.log('REVIEW SHOT',name,JSON.stringify(counts));
 }
 assert.deepEqual(f.errors,[]);console.log('REVIEW PASS');
}finally{await f.browser.close()}

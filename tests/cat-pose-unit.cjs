// Real model geometry, every stationary/animated pose: paws on the floor, no buried meshes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js'),H={ok:true,T,root:new T.Group(),scene:new T.Scene(),dirty(){}};
const g={fillRect(){},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};
const c={window:{THREE:T,House:H},document:{createElement(){return{getContext(){return g}}}},console,T,D2R:Math.PI/180};vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),c);c.K=c.window.HouseKit;c.M=o=>c.K.mat(typeof o==='string'?{c:o}:o);
const s=fs.readFileSync(require.resolve('../app/public/js/rm-room.js'),'utf8');vm.runInContext(s.slice(s.indexOf('  function catModel()'),s.indexOf('  // a 1999 cat tree')),c);
const cat=c.catModel(),v=new T.Vector3();let maxError=0;
for(const pose of ['sleep','sit','stretch','eat','walk'])for(const t of [0,83,166,249,500,1000]){
 cat.userData.pose(pose,t);cat.updateMatrixWorld(true);let low=-Infinity,high=Infinity;
 cat.traverseVisible(m=>{if(!m.isMesh||m.userData.contactShadow)return;const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);assert(v.toArray().every(Number.isFinite));low=Math.max(low,v.y);high=Math.min(high,v.y)}});
 maxError=Math.max(maxError,Math.abs(low));assert(Math.abs(low)<.03,pose+' at '+t+' has floor error '+low);assert(high<-10,pose+' collapsed its silhouette');
}
console.log('CAT POSE PASS: five poses/six phases, visible floor contact, no buried or nonfinite geometry; max error',maxError);

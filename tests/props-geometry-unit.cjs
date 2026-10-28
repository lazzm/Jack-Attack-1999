// Real production garment geometry: inspectable undersides, closed boundaries and bounded triangle cost.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js'),s=fs.readFileSync(require.resolve('../app/public/js/ch-bed.js'),'utf8');
const c={T,rnd(seed){let n=seed;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296)}};vm.createContext(c);
vm.runInContext(s.slice(s.indexOf('  const sstep ='),s.indexOf('  // A swept tube'))+s.slice(s.indexOf('  const GARMENT ='),s.indexOf('  function cloth('))+';this.garments=GARMENT;',c);
const counts={};
for(const [name,d] of Object.entries(c.garments)){
 const g=c.sheet(d.out,d.w,d.d,d.o),p=g.attributes.position,I=g.index.array,edges=new Map();let volume=0;
 for(const v of p.array)assert(Number.isFinite(v),name+' nonfinite vertex');
 for(let i=0;i<I.length;i+=3){const ids=[I[i],I[i+1],I[i+2]],v=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k));volume+=v[0].dot(v[1].clone().cross(v[2]))/6;for(const [a,b] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){const k=Math.min(a,b)+','+Math.max(a,b);edges.set(k,(edges.get(k)||0)+1)}}
 assert([...edges.values()].every(n=>n===2),name+' has an open/nonmanifold edge');assert(volume>1,name+' lacks a closed outward-facing solid');
 g.computeBoundingBox();assert(g.boundingBox.max.y<=0,name+' extends through floor');assert(g.boundingBox.min.y<-.5,name+' lost its folds');assert(I.length/3<3000,name+' exceeds garment budget');counts[name]=I.length/3;
}
console.log('PROPS GEOMETRY PASS: closed garment undersides/boundaries, outward volume, grounded finite folds',counts);

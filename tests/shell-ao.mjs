// Exercise the actual shell builder without loading unrelated house content.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(process.argv[2]||new URL('../app/public/js/hs-house.js',import.meta.url),'utf8');
const start=source.indexOf('  function shell(B, d) {'),end=source.indexOf('\n  }',start)+4;
assert(start>=0&&end>start);
const shell=vm.runInNewContext('('+source.slice(start,end).trim()+')',{M:()=>({}),tex:()=>null,mSkirt:{}});
for(const side of ['n','s','w','e']){
 const ao=[],holes={ [side]:[[90,150,-100,200],[30,60,-100,200],[170,190,-100,150]] };
 const before=JSON.stringify(holes);
 shell({plane(){},box(){},ao(x,y,z,w,h,o){ao.push({x,y,z,w,h,o})}},
  {x0:0,z0:0,x1:220,z1:220,fy:200,cy:0,holes});
 assert.equal(JSON.stringify(holes),before,'Builder mutated opening definitions');
 const along=side==='n'||side==='s',fixed=side==='n'||side==='w'?0:220,sign=fixed===0?1:-1;
 for(const [y,offset]of [[184,.3],[199.85,14]]){
  const strips=ao.filter(s=>Math.abs(s.y-y)<.001&&Math.abs((along?s.z:s.x)-(fixed+sign*offset))<.001);
  const spans=strips.map(s=>[(along?s.x:s.z)-s.w/2,(along?s.x:s.z)+s.w/2]);
  assert.deepEqual(spans,[[0,30],[60,90],[150,220]],side+' floor/wall AO must skip doors and retain window sills');
 }
 assert(ao.some(s=>s.y===13&&s.w===220),'Ceiling shading above doors was removed');
}
console.log('SHELL AO PASS: all four walls, multiple unsorted doors, windows, ceiling and immutable inputs');

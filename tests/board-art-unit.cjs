const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const T=require('../app/public/vendor/three.min.js');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/rm-room.js'),'utf8');
const builder=source.match(/const lidBox=\(x,y,z,w,h,d,row,ry\)=>\{[\s\S]*?\n    \};/)[0];
function box(row){let geometry;const ctx={T,lidM:{},G:{geo:g=>{geometry=g}}};vm.runInNewContext(builder+';lidBox(0,0,0,36,4.2,26,'+row+',0)',ctx);return geometry}
test('board lid lettering is unmirrored and faces the reading-bookcase approach',()=>{
 for(const row of [0,1,2]){const g=box(row),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=12;i<16;i++){
   assert(Math.abs(uv.getX(i)-(p.getX(i)/36+.5))<1e-6,'Left/right lettering mirrored');
   const sourceY=(1-uv.getY(i)-row/3)*3;
   assert(Math.abs(sourceY-(p.getZ(i)/26+.5))<1e-6,'Title faces away from the room');
  }
 }
});
test('carton sides sample a single solid-ink texel, not a stretched/mipmapped art strip',()=>{
 for(const row of [0,1,2]){const uv=box(row).attributes.uv;
  for(const face of [0,1,2,4,5])for(let i=face*4;i<face*4+4;i++){
   assert.equal(uv.getX(i),.5);assert(Math.abs(uv.getY(i)-(1-row/3-2/1024))<1e-6);
  }
 }
});

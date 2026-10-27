// Exercise the actual production contact branch at ordinary and software-WebGL
// frame times. No server/browser/state is involved.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const contact=source.split('\n').find(line=>line.includes('if (a.y >= t.landY)'));
assert(contact,'Production landing branch not found');
function settle(dt,height=3,branch=contact){
 const t={st:'fall',landY:0,vy:0,fromX:1,fromZ:1},a={y:-height},events=[],sounds=[];
 const ctx={t,a,dt,sk:1,id:'case',Math,physicalSound:event=>sounds.push(event),thingWeight:()=>1,layerFor(){},saveThings(){},emit:event=>events.push(event)};
 for(let i=0;i<180&&t.st==='fall';i++){t.vy+=1800*dt;a.y+=t.vy*dt;vm.runInNewContext(branch,ctx)}
 return{t,a,events,sounds};
}
test('returned case settles at 60/30/15/10/8 fps instead of bouncing forever',()=>{
 for(const dt of [1/60,1/30,1/15,.1,.12]){const s=settle(dt);assert.equal(s.t.st,'rest','dt='+dt);assert.equal(s.a.y,0);assert.equal(s.t.vy,0);assert.deepEqual(s.events,['rest'])}
});
test('a larger dropped box still bounces and eventually rests at every frame rate',()=>{
 for(const dt of [1/60,1/30,1/15,.1,.12]){const s=settle(dt,150);assert.equal(s.t.st,'rest','dt='+dt);assert.equal(s.a.y,0);assert.deepEqual(s.events,['rest']);assert(s.sounds.length>0,'A real impact still bounces')}
});
test('the former fixed threshold reproduces the slow-frame infinite bounce',()=>{
 const old=contact.replace('Math.max(160,1800*dt)','160');assert.notEqual(old,contact);
 assert.equal(settle(.12,3,old).t.st,'fall');
});

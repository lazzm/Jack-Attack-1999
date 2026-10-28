// Exercise the production touch picker: rack help must not steal a nearby game spine.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require.resolve('../app/public/js/hs-touch.js'),'utf8');
const code=s.slice(s.indexOf('  const RING ='),s.indexOf("  // the finger's label"));
const hit=id=>({spot:id,dist:100,obj:{}}),spots={rack:{id:'rack',label:'Game shelf',range:240,touchFallback:true},box:{id:'box',label:'A game case',range:240,grab:true},door:{id:'door',label:'Open door',range:240}};
const c={H:{SPOTS:spots,THINGS:{box:{}},DOORS:{door:{open:false}},pick:()=>null},short:s=>s,verbOf:()=> 'Use'};vm.createContext(c);vm.runInContext(code,c);
c.H.pick=(x,y)=>x===100&&y===100?hit('rack'):Math.abs(x-114)<.1&&Math.abs(y-100)<.1?hit('box'):null;
assert.equal(c.aimPoint(100,100).id,'box','General shelf help stole a visible spine');assert.equal(c.aimPoint(100,100).verb,'Pick up');
c.H.pick=(x,y)=>x===100&&y===100?hit('door'):hit('box');assert.equal(c.aimPoint(100,100).id,'door','Neighbouring prop stole a direct door press');
c.H.pick=()=>hit('rack');assert.equal(c.aimPoint(100,100).id,'rack','Empty shelf lost its help action');
c.H.pick=()=>({spot:null,dist:30,obj:{}});assert.equal(c.aimPoint(100,100),null,'Picker selected through a wall');
c.H.pick=()=>({...hit('box'),dist:400});assert.equal(c.aimPoint(100,100).far,true,'Out-of-reach item became usable');
console.log('TOUCH PICKING PASS: visible case before rack help, exact door retained, empty shelf help, wall occlusion and range');

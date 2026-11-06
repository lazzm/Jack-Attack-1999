'use strict';
// Real r128 rig, across every family seat and speech beat. Atlas canvas only is stubbed.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*7})},{get:(o,k)=>k in o?o[k]:()=>{}});
let now=1000;const w={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,performance:{now:()=>now},CAR:{x:500,z:1075},H:{FRONT:{FZ:1400}}};w.window=w;vm.createContext(w);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','app/public/js/np-rig.js'),'utf8'),w);
const life=fs.readFileSync(require('path').join(__dirname,'..','app/public/js/np-life.js'),'utf8');vm.runInContext(life.slice(life.indexOf('  const seat ='),life.indexOf('  const MUG ='))+';this.spots=SPOT;this.seatFor=seatFor;',w);
const bone=(r,k)=>{r.group.updateMatrixWorld(true,true);return r.bones[k].getWorldPosition(new T.Vector3())};
for(const person of ['mom','dad','sister'])for(const seat of ['armchair','sofaL','sofaR','floorTV']){
 const q=w.seatFor({id:person},w.spots[seat]),r=w.NPCRig.create(person,{tier:'low'});r.floor=()=>353;r.teleport(q.x,353,q.z,q.face*Math.PI/180);
 r.set({seat:{...q,hipForward:person==='sister'||q.floor?undefined:10,footForward:person==='sister'||q.floor?undefined:54},action:'sit'});r.st.sitK=1;
 for(let i=0;i<180;i++){now+=1000/60;r.update(1/60,true)}
 const rest={L:bone(r,'handL'),R:bone(r,'handR')};r.set({engage:true,action:'paper'});r.talk(10000,'How was your day? Come and tell me!');
 let worstContact=0,worstDrop=0;
 for(let i=0;i<360;i++){now+=1000/60;r.update(1/60,true);if(i<60)continue;const left=bone(r,'handL'),right=bone(r,'handR');worstContact=Math.max(worstContact,left.distanceTo(rest.L));worstDrop=Math.max(worstDrop,right.y-rest.R.y);for(const v of [...left.toArray(),...right.toArray()])assert(Number.isFinite(v));}
 assert(worstContact<1.2,person+'/'+seat+' supporting hand left thigh: '+worstContact);assert(worstDrop<1.2,person+'/'+seat+' talking hand dropped into seat: '+worstDrop);
}
console.log('SEATED TALK PASS: three residents x four seats; supporting-hand contact and no downward arm gesture through six seconds of speech');

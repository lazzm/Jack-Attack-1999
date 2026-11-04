'use strict';
// Exercise the production cartridge label helper across every console/input family.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/../app/public/js/rm-tv.js','utf8');
const look=src.slice(src.indexOf('  const LOOK ='),src.indexOf('  // Game Boy Color palettes'));
const make=src.slice(src.indexOf('  function makeK('),src.indexOf('  // a go is over:'));
const input={mode:'keyboard',touch:false},canvas={width:320,height:240,getContext:()=>({})};
const c=vm.createContext({window:{GameInput:input},GameInput:input,V:{con:'n64',cv0:canvas,cv1:canvas},CAT:{GAME:{}},GBPAL:{none:[]},font:{},sfx:{},stick(){},ownPad:()=>false});
vm.runInContext(look+src.slice(src.indexOf('  const keyboardHints ='),src.indexOf('  const touchy ='))+make+';this.look=LOOK;this.make=makeK;',c);
for(const con of Object.keys(c.look)){
 c.V.con=con;const K=c.make(con+'.review',{three:true,stick:con==='n64'});
 input.mode='keyboard';input.touch=false;
 assert.equal(K.keyLabel('a'),'Z');assert.equal(K.keyLabel('start'),'ENTER');assert.equal(K.directionLabel,'ARROWS');
 for(const mode of ['touch','gamepad']){
  input.mode=mode;input.touch=mode==='touch';
  for(const [key,label]of Object.entries(c.look[con].keys))assert.equal(K.keyLabel(key),label,con+'/'+mode+'/'+key);
  assert.equal(K.directionLabel,con==='n64'?'STICK':'D-PAD');
 }
}
c.V.con='n64';input.mode='touch';input.touch=true;
const kart=c.make('n64.kart',{three:true,stick:true});
assert.equal(kart.keyLabel('a'),'A','Select names the A button, never the distinct Z trigger');assert.equal(kart.keyLabel('c'),'Z');
console.log('PASS console labels: six families, keyboard/touch/gamepad, distinct Ultra 64 A/Z, direction legends');
// The cartridge's own pad redraws every frame: legends must never accumulate.
const run=fs.readFileSync(__dirname+'/../app/public/js/rm-g-run.js','utf8');
const start=run.indexOf('draw(mode){'),body=run.slice(start+'draw(mode){'.length,run.indexOf('},end(){',start));
const buttons=Object.fromEntries(['a','x','y','l','r'].map(k=>[k,{textContent:'',hidden:false}]));
const pad=vm.createContext({buttons,root:{},RoomTV:{_dbg:()=>({gid:'ps.run'})},document:{hidden:false},window:{},K:{label:k=>c.look.ps.keys[k]},release(){}});
vm.runInContext('this.draw=function(mode){'+body+'}',pad);
for(let i=0;i<100;i++)pad.draw('hub');
assert.equal(buttons.l.textContent,'ROOM - L1');assert.equal(buttons.r.textContent,'ROOM + R1');assert.equal(buttons.a.textContent,'ENTER ★');
pad.draw('level');assert.equal(buttons.a.textContent,'JUMP ★');assert.equal(buttons.x.textContent,'SPIN #');assert.equal(buttons.y.textContent,'FLOP / ROUTE ~');
console.log('PASS custom PlaySpace pad: repeated draws preserve legends and mode actions');

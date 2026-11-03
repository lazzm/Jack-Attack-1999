'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=file=>fs.readFileSync(require.resolve('../app/public/js/'+file),'utf8');
const tv=read('rm-tv.js'),ctx={};
vm.runInNewContext(tv.slice(tv.indexOf('  const LOOK ='),tv.indexOf('  const GLYPH ='))+'\nthis.look=LOOK;this.font=FONT',ctx);
const original=/[✕○□△]/;
assert.deepEqual(Array.from(Object.values(ctx.look.ps.keys).slice(0,4)),['★','@','#','~']);
assert.deepEqual(Array.from(Object.values(ctx.look.ps.names)),['Starfish','Snail','Waffle','Worm']);
for(const [con,look]of Object.entries(ctx.look))for(const label of Object.values(look.keys)){
 assert(!original.test(label),con+' has an original face legend');
 for(const glyph of label)assert(ctx.font[glyph],con+' font can draw '+glyph);
}
for(const file of ['rm-g-run.js','rm-g-fight.js','rm-g-grav.js','rm-g-sneak.js']){
 const s=read(file);assert(!/[□△]/.test(s),file+' has no old face symbols');
 assert(!/['"`][^\n]*[✕○]/.test(s),file+' has no old button-help strings');
}
console.log('PASS all six console legends have bitmap glyphs; original PlaySpace doodles/names; all four PlaySpace game sources');
const life=read('hs-life.js');
const event=life.slice(life.indexOf('    ownerEvent(id) {'),life.indexOf('    vcrSet:'));
const spoken=[];let identity='Sam';
const box={window:{OwnerTools:{allowed:true}},cast:s=>s.replaceAll('{me}',identity),esc:String,H:{say:(who,text)=>spoken.push(text)},startRing:()=>{},ring:false};
const voice=life.slice(life.indexOf('  function voice('),life.indexOf('  const where ='));
vm.runInNewContext('let lastVoice=0;'+voice+';this.owner=({'+event+'})',box);
for(const name of ['Sam','Robin','Jack']){
 identity=name;spoken.length=0;assert(box.owner.ownerEvent('bedtime'));
 assert.equal(spoken[0],`Time for bed, ${name}. Save your game.`);
}
assert(!/\bJack\b/.test(event),'Fixed event lines must not hardcode the owner');
const moments=life.slice(life.indexOf('  function moments()'),life.indexOf('  function shoutLoop()'));
assert(!/\bJack\b/.test(moments),'Ordinary family lines must not hardcode the owner');
console.log('PASS bedtime and fixed/ordinary family tables preserve player identity templates');

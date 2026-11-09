'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const pack=require('../app/public/audio/voice-name-phonemes.json');
assert.equal(Object.keys(pack.names).length,402);
let contacts=0,cues=0,hashed=0;
for(const [id,row]of Object.entries(pack.names)){
 assert.equal(row.file,id+'.mp3');assert(row.dur>0&&row.dur<8);assert(row.cues.length>=3);
 let last=-1;for(const [t,shape]of row.cues){assert(t>=last&&t<=row.dur+.001,id+' out-of-order source clock');assert(Number.isInteger(shape)&&shape>=0&&shape<=6);last=t;cues++;if(shape===5||shape===6)contacts++}
 assert.equal(row.cues.at(-1)[1],0,id+' name tail not closed');
 const file=path.join(__dirname,'../app/public/audio/voice/names',row.file);
 if(fs.existsSync(file)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),row.sha256,id+' replaced recording needs new cues');hashed++}
}
for(const speaker of ['mom-shout','mom-call','dad-shout','sis-whine'])for(const name of ['sam','michael'])if(pack.names[speaker+'/'+name])assert(pack.names[speaker+'/'+name].cues.some(c=>c[1]===6),'missing closed contact in '+speaker+'/'+name);
for(const speaker of ['mom-shout','dad-shout','sis-whine'])if(pack.names[speaker+'/fiona'])assert(pack.names[speaker+'/fiona'].cues.some(c=>c[1]===5),'missing teeth contact in '+speaker+'/fiona');
console.log('PASS 402 source-qualified names, '+cues+' cues, '+contacts+' contact spans, '+hashed+' original hashes');

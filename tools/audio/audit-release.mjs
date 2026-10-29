// Offline release audit. Config supplies private staging paths; output records hashes, never credentials.
// node tools/audio/audit-release.mjs /path/to/config.json
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verify,probeDur} from './lines-lib.mjs';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lines=JSON.parse(fs.readFileSync(new URL('voice-lines.json',import.meta.url))).lines;
const report=JSON.parse(fs.readFileSync(cfg.report));
const generated=JSON.parse(fs.readFileSync(path.join(cfg.sourceDir,'manifest.json')));
const approved=JSON.parse(fs.readFileSync(path.join(cfg.approvedDir,'manifest.json')));
const accents=new Map();
for(const set of cfg.accentSets){
 const hashes=JSON.parse(fs.readFileSync(set.hashes));let count=0;
 for(const line of fs.readFileSync(set.log,'utf8').split('\n')){
  const m=line.match(/^(.+)\.mp3 -> ACCENT=([^;]+);.*CONFIDENCE=(\d+)/);if(!m)continue;
  const id=set.aliases?.[m[1]]||m[1],sha=hashes[id];assert(sha,'Missing audited hash: '+id);
  const key=id+'@'+sha,list=accents.get(key)||[];list.push({accent:m[2].trim(),confidence:+m[3]});accents.set(key,list);count++;
 }
 if(set.expected!==undefined)assert.equal(count,set.expected,'Incomplete accent audit: '+set.log);
}
const accepted={},excluded=[];
for(const l of lines){
 const id=l.id;assert(/^[a-z0-9.]+$/.test(id),'Unsafe line ID');
 if(approved[id]){
  const m=approved[id],file=path.join(cfg.approvedDir,m.file);assert.equal(hash(file),cfg.approvedHashes[m.file],'Approved clip changed');
  accepted[id]={...m,sha256:hash(file),preserved:true};continue;
 }
 const m=generated[id],r=report[id],reasons=[];
 if(!m||!r?.ok){excluded.push({id,reasons:['No verified candidate']});continue;}
 assert.equal(m.file,id+'.mp3');assert.equal(m.character,l.character);
 const file=path.join(cfg.sourceDir,m.file);assert(fs.existsSync(file),'Missing clip '+id);
 const sha=hash(file),observations=accents.get(id+'@'+sha)||[];
 if(!observations.length)reasons.push('No accent audit for these exact bytes');
 else if(observations.some(v=>v.accent!=='British'||v.confidence<80))reasons.push('Accent not consistently classified British at confidence80+');
 const text=r.canonical||l.line.replace(/\s*\|\s*$/,''),v=verify(l.tag,text,r.heard||'');
 if(!v.ok)reasons.push(v.leaked.length?'Spoken direction/extra tag':'Transcript boundaries or words do not match');
 assert.equal(path.basename(r.raw),r.raw,'Unsafe raw path');
 const raw=JSON.parse(fs.readFileSync(path.join(cfg.rawDir,r.raw.replace(/\.wav$/,'.json'))));
 assert(raw.items.includes(id)&&raw.character===l.character&&/British/.test(raw.prompt),'Missing British source provenance: '+id);
 const dur=probeDur(file);assert(dur>.1&&dur<90&&Math.abs(dur-m.dur)<.15,'Invalid duration '+id);
 if(reasons.length)excluded.push({id,reasons});
 else accepted[id]={...m,sha256:sha,raw:r.raw,transcriptScore:v.score,accentConfidence:Math.min(...observations.map(o=>o.confidence))};
}
const output={created:new Date().toISOString(),catalogue:lines.length,preserved:Object.values(accepted).filter(v=>v.preserved).length,acceptedCount:Object.keys(accepted).length,accepted,excluded};
fs.mkdirSync(path.dirname(cfg.output),{recursive:true});fs.writeFileSync(cfg.output,JSON.stringify(output,null,2)+'\n');
console.log('VOICE RELEASE AUDIT:',output.acceptedCount,'accepted;',output.preserved,'approved clips preserved;',excluded.length,'withheld');
console.log('Withheld:',excluded.map(v=>v.id).join(', '));

// Extra phone/tablet/High art coverage; gate supplies its own disposable localhost server.
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const quick=process.argv.includes('--grips');
const only=(process.env.PROP_ONLY || process.argv.find(a=>a.startsWith('--only='))?.slice(7) || '').split(',').filter(Boolean);
for(const [name,tier,w,h,touch] of [['desktop-low','low',1366,860,false],['phone','potato',390,844,true],['phone-landscape','potato',844,390,true],['tablet','low',768,1024,true],['tablet-landscape','low',1024,768,true],['desktop-high','high',1366,860,false]]){
 if(only.length&&!only.includes(name)||quick&&name==='desktop-high')continue;
 const r=spawnSync(process.execPath,['props-pass.mjs',base,(quick?'final-':'')+name,...(quick?['--grips']:[]),'--tier='+tier,'--width='+w,'--height='+h,...(touch?['--phone']:[])],{stdio:'inherit',timeout:name==='desktop-high'?600000:300000});if(r.error)throw r.error;assert.equal(r.status,0,name+' props gallery failed');
}

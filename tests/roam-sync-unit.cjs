'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/roam.js'),'utf8');
function fixture(){
 let autosave;
 const data=new Map([['jhp_roam_who','Player'],['jhp_save','first']]),handlers={},timers=new Map(),sent=[];let clock=0,tid=0;
 const localStorage={get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 const Net={connected:true,me:{member:true,nick:'Player'},on:(t,fn)=>handlers[t]=fn,send:m=>{if(!Net.connected)return false;sent.push(m);return true}};
 const ctx={localStorage,sessionStorage:{getItem:()=>null,removeItem:()=>{}},Net,document:{addEventListener:()=>{},querySelector:()=>null},TextEncoder,TextDecoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),Date:{now:()=>clock},setInterval:fn=>{autosave=fn},setTimeout:(fn,ms)=>{timers.set(++tid,{fn,at:clock+ms});return tid},clearTimeout:id=>timers.delete(id)};
 ctx.window=ctx;vm.runInNewContext(source,ctx);
 const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
 const advance=async ms=>{const end=clock+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;timers.delete(next[0]);next[1].fn();await flush()}clock=end;await flush()};
 const ack=(id=sent.at(-1).id)=>handlers.rmSaved({id,ts:clock+1});
 return{...ctx,data,handlers,sent,ack,flush,advance,timers,autosave:()=>autosave()};
}
(async()=>{
 let f=fixture();f.autosave();await f.flush();assert.equal(f.sent.length,1);assert.equal(f.sent[0].now,undefined,'First upload is the real background path');
 f.data.set('jhp_save','newer');const b=f.Roam.syncNow(),c=f.Roam.syncNow();await f.flush();assert.equal(f.sent.length,1,'Busy check joins first upload');
 f.ack();await f.flush();assert.equal(f.sent.length,2,'Newer edits get their own upload');
 let done=false;b.then(()=>done=true);await f.flush();assert(!done,'First receipt cannot confirm second snapshot');
 f.ack(f.sent[0].id);f.handlers.rmErr({id:f.sent[0].id,msg:'Stale failure'});f.handlers.rmBusy({id:f.sent[0].id});await f.flush();assert(!done,'Late duplicate receipt/errors ignored');
 f.ack();assert.equal(await b,true);assert.equal(await c,true);assert.equal(f.sent.length,2,'Concurrent checks coalesce the same confirmed snapshot');assert.equal(f.sent[1].now,1);assert.equal(JSON.parse(Buffer.from(f.sent[1].d,'base64')).jhp_save,'newer');
 console.log('PASS busy upload, concurrent save checks, newer edits, stale receipt');
 f=fixture();const slow=f.Roam.syncNow();await f.flush();let settled=false;slow.then(()=>settled=true);await f.advance(15000);assert(!settled,'15-second acknowledgement remains pending');f.ack();assert.equal(await slow,true);
 console.log('PASS slow acknowledgement beyond the former 8-second limit');
 f=fixture();const ticking=f.Roam.syncNow();await f.flush();f.data.set('jhp_last','clock-keeps-ticking');f.ack();assert.equal(await ticking,true,'A confirmed operation finishes despite later bookkeeping writes');assert.equal(f.sent.length,1);const later=f.Roam.syncNow();await f.flush();assert.equal(f.sent.length,2,'Later writes stay dirty, never marked saved by the first receipt');f.ack();assert.equal(await later,true);
 console.log('PASS continuous bookkeeping cannot starve a save check or become falsely confirmed');
 f=fixture();f.data.set('jhp_save','x'.repeat(25000));const send=f.Net.send;f.Net.send=m=>{const ok=send(m);if(m.i===m.n-1)f.ack(m.id);return ok};const paced=f.Roam.syncNow();await f.flush();await f.advance(700);assert.equal(await paced,true);assert.equal(f.timers.size,0,'Receipt during chunk pacing leaves no orphan timeout');
 console.log('PASS receipt is installed before chunk delivery, with clean timer lifecycle');
 f=fixture();const busy=f.Roam.syncNow();await f.flush();f.handlers.rmBusy({id:f.sent[0].id});await f.flush();await f.advance(20500);assert.equal(f.sent.length,2);f.ack();assert.equal(await busy,true);
 console.log('PASS server throttle waits then retries');
 f=fixture();f.autosave();await f.flush();const joined=f.Roam.syncNow();f.handlers.rmBusy({id:f.sent[0].id});await f.flush();assert.equal(f.sent.length,2,'Save check follows a throttled autosave using the independent sync allowance');f.ack();assert.equal(await joined,true);
 console.log('PASS explicit save joins a throttled background upload');
 f=fixture();const dropped=f.Roam.syncNow();await f.flush();f.handlers.rmBusy({id:f.sent[0].id});await f.flush();f.Net.connected=false;f.handlers._close();assert.equal(await dropped,false,'Disconnect interrupts a throttle wait');assert.equal(f.data.get('jhp_save'),'first');
 console.log('PASS real disconnect interrupts the retry allowance');
 for(const failure of ['disconnect','send','error','timeout']){
  f=fixture();if(failure==='send')f.Net.send=()=>false;
  const save=f.Roam.logoff();await f.flush();
  if(failure==='disconnect'){f.Net.connected=false;f.handlers._close()}
  if(failure==='error')f.handlers.rmErr({id:f.sent[0].id,msg:'Disk full'});
  if(failure==='timeout')await f.advance(60000);
  assert.equal(await save,false,failure);assert.equal(f.data.get('jhp_save'),'first','Failed logoff keeps files');assert.equal(f.Roam.owner,'Player');assert(!f.data.has('jhp_roam_hash'));
 }
 console.log('PASS real disconnect, send failure, server write error, missing acknowledgement: no cleared or falsely saved profile');
 f=fixture();const off=f.Roam.logoff();await f.flush();f.ack();assert.equal(await off,true);assert.equal(f.Roam.owner,'');assert(!f.data.has('jhp_save'));
 console.log('PASS confirmed logoff hands back the PC');
 f=fixture();const confirmed=f.Roam.syncNow();await f.flush();f.ack();assert.equal(await confirmed,true);f.Net.connected=false;assert.equal(await f.Roam.syncNow(),false,'An old confirmed hash must not hide a real disconnection');
 console.log('PASS disconnected cached save is reported honestly');
})().catch(e=>{console.error(e);process.exitCode=1});

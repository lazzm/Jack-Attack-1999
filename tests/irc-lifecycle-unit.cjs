// Real deferred IRC connection callbacks against close/reopen/disconnect races.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const file='app/public/js/social-irc.js';
const source=process.env.IRC_LIFECYCLE_REF?execFileSync('git',['show',process.env.IRC_LIFECYCLE_REF+':'+file],{encoding:'utf8'}):fs.readFileSync(require.resolve('../'+file),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function fixture(){
 let now=0,seq=0;const timers=[],joins=[],lines=[];
 const c={C:null,SERVER:'irc.jacknet.jnet',MAIN:'#jackattack',DEFAULTS:[],Net:{me:{id:1},relay(){}},getOnline:()=>[],host:()=> 'kid@dialup.jnet',me:()=> 'Kid',esc:String,activate(){},motd(){},got(){},title(){},closeChild(){},ircClean:String,line:(st,k,s)=>lines.push(st),join:()=>joins.push(c.C),setTimeout:(fn,ms)=>timers.push({fn,at:now+ms,seq:seq++})};
 vm.createContext(c);vm.runInContext(between('  function connect(noJoin)','  const MOTD')+between('  function quit(msg, closing)','  const err ='),c);
 const client=id=>({id,w:{closed:false},wins:new Map([['status',{id}]]),connected:false});c.C=client('old');
 function next(){timers.sort((a,b)=>a.at-b.at||a.seq-b.seq);const t=timers.shift();if(t){now=t.at;t.fn()}return !!t}
 return{c,joins,lines,client,next,drain(){while(next()){}},connected(){while(!c.C.connected){assert(next(),'connection never finished')}}};
}
{
 const f=fixture();f.c.connect();f.drain();assert.equal(f.joins.length,1);assert(f.c.C.connected);assert(!f.c.C.connecting);
 const quiet=fixture();quiet.c.connect(true);quiet.drain();assert.equal(quiet.joins.length,0);assert(quiet.c.C.connected);
}
for(const boundary of ['during-connect','before-autojoin'])for(const action of ['close','reopen','disconnect']){
 const f=fixture();f.c.connect();if(boundary==='before-autojoin')f.connected();const old=f.c.C;
 if(action==='close')f.c.C=null;
 if(action==='reopen'){old.w.closed=true;f.c.C=f.client('new')}
 if(action==='disconnect')f.c.quit('Bye',false);
 const writes=f.lines.length;f.drain();assert.equal(f.joins.length,0,boundary+' '+action+' must discard its old join');assert.equal(f.lines.length,writes,boundary+' '+action+' must discard its old progress');
 if(f.c.C)assert(!f.c.C.connected,boundary+' '+action+' must not connect the cancelled/new client');
}
{
 const f=fixture();f.c.connect();f.c.quit('Cancel',true);f.c.connect();f.drain();assert.equal(f.joins.length,1,'Only the latest same-window attempt may join');assert(f.c.C.connected);
 const c={C:null,lc:s=>String(s).toLowerCase(),CH_RE:/^#[a-z]+$/};vm.createContext(c);vm.runInContext(between('  function join(name, quiet)','  function part('),c);assert.doesNotThrow(()=>c.join('#games'),'A stale direct join after close must be harmless');
}
console.log('PASS real IRC connect/autojoin callbacks: ordinary, no-join, six close/reopen/disconnect races, retry, null join');

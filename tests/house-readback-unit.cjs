// The black-room watchdog must retain its samples without waiting on the GPU.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8'),start=source.indexOf('  function wdAsyncSample('),end=source.indexOf('  let wdReading=',start),queue=[];
const sample=vm.runInNewContext(source.slice(start,end)+';wdAsyncSample',{Uint8Array,Math,setTimeout:fn=>queue.push(fn)});
let status=1,reads=0,copies=0,draws=0,deleted=0,binding='original',result;
const gl={fenceSync:()=>({}),getBufferSubData(target,offset,pixels){copies++;pixels[0]=150},drawingBufferWidth:64,drawingBufferHeight:48,PIXEL_PACK_BUFFER_BINDING:1,PIXEL_PACK_BUFFER:2,STREAM_READ:3,RGBA:4,UNSIGNED_BYTE:5,SYNC_GPU_COMMANDS_COMPLETE:6,TIMEOUT_EXPIRED:1,WAIT_FAILED:2,createBuffer:()=>({}),getParameter:()=>binding,bindBuffer:(target,value)=>binding=value,bufferData(){},readPixels(){reads++},flush(){},isContextLost:()=>false,clientWaitSync:(sync,flags,timeout)=>{assert.equal(timeout,0,'Never block waiting for the GPU');return status},deleteSync(){deleted++},deleteBuffer(){deleted++}};
assert.equal(sample({},()=>draws++,()=>{}),false,'WebGL1 retains the existing fallback');assert.equal(draws,0);
assert(sample(gl,()=>draws++,v=>result=v));assert.equal(draws,1);assert.equal(reads,11);assert.equal(binding,'original');assert.equal(result,undefined);
queue.shift()();assert.equal(copies,0,'Unfinished fence must not copy or wait');assert.equal(result,undefined);status=3;queue.shift()();assert.equal(copies,1);assert.equal(binding,'original');assert.equal(result,true);assert.equal(deleted,2);
status=1;result=undefined;assert(sample(gl,()=>{},v=>result=v));for(let i=0;queue.length&&i<50;i++)queue.shift()();assert.equal(result,null,'A timed-out transfer must not declare the room black');assert.equal(deleted,4);
console.log('HOUSE READBACK PASS: 11 unchanged samples, zero-timeout fence polling, state restored, resources freed, WebGL1 fallback');

// Guard only the Chromium instance supplied by this test. Never inspect/kill other browsers.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
export async function memoryGuard(browser,label){
 await mkdir('/tmp/sound-round2-media',{recursive:true});
 const cdp=await browser.newBrowserCDPSession(),samples=[];let phase='startup',busy=false,stopped=false,cutoff=false;
 const start=performance.now();
 async function sample(){if(busy||stopped)return;busy=true;try{
  const {processInfo}=await cdp.send('SystemInfo.getProcessInfo');
  for(const p of processInfo.filter(p=>p.type==='renderer')){
   const status=await readFile('/proc/'+p.id+'/status','utf8').catch(()=>null);if(!status)continue;
   const rssKb=Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1]||0);samples.push({seconds:(performance.now()-start)/1000,phase,pid:p.id,rssMb:rssKb/1024});
   if(rssKb>1536*1024){cutoff=true;console.error('OWN RENDERER MEMORY CUTOFF',label,p.id,rssKb/1024);process.kill(Number(p.id),'SIGKILL');}
  }
 }catch(e){if(!stopped)console.error('Memory observer:',e.message)}finally{busy=false}}
 const timer=setInterval(sample,200);await sample();
 return{mark(name){phase=name;console.log('MEDIA PHASE',name)},async finish(){clearInterval(timer);await sample();stopped=true;const report={label,cutoff,limitMb:1536,samples};await writeFile('/tmp/sound-round2-media/memory-'+label+'.json',JSON.stringify(report,null,2));console.log('MEMORY',label,JSON.stringify({cutoff,samples:samples.length,minMb:Math.min(...samples.map(s=>s.rssMb)),maxMb:Math.max(...samples.map(s=>s.rssMb))}));return report}};
}

// Native compositor stills: suspend page animation callbacks during export only.
// Gameplay, geometry, viewport, device pixels and performance measurements stay intact.
import {writeFile} from 'node:fs/promises';
export async function stillCapture(page,{hold=false}={}){
 await page.addInitScript(()=>{
  let paused=false,serial=0;const frames=new Map(),request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window);
  const schedule=f=>{f.real=request(t=>{f.real=0;if(paused||!frames.has(f.id))return;frames.delete(f.id);f.callback(t)})};
  window.requestAnimationFrame=callback=>{const f={id:++serial,callback,real:0};frames.set(f.id,f);if(!paused)schedule(f);return f.id};
  window.cancelAnimationFrame=id=>{const f=frames.get(id);if(f){if(f.real)cancel(f.real);frames.delete(id)}};
  window.__stillPause=()=>{paused=true;for(const f of frames.values()){if(f.real)cancel(f.real);f.real=0}};
  window.__stillResume=()=>{paused=false;for(const f of frames.values())if(!f.real)schedule(f)};
 });
 const capture=page.screenshot.bind(page),cdp=await page.context().newCDPSession(page);
 page.screenshot=async(options={})=>{
  if(options.fullPage||options.clip||options.mask||options.omitBackground||options.animations||options.scale)return capture(options);
  const format=options.type||(String(options.path||'').endsWith('.jpg')?'jpeg':'png');let timer;
  await page.evaluate(()=>window.__stillPause());
  try{
   const shot=await Promise.race([cdp.send('Page.captureScreenshot',{format,...(format==='jpeg'?{quality:options.quality??100}:{}),fromSurface:true,captureBeyondViewport:false,optimizeForSpeed:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native still capture timed out')),options.timeout||90000)})]);
   const bytes=Buffer.from(shot.data,'base64');if(options.path)await writeFile(options.path,bytes);return bytes;
  }finally{clearTimeout(timer);if(!hold)await page.evaluate(()=>window.__stillResume()).catch(()=>{})}
 };
}

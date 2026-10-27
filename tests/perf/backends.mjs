// Availability check only: no game account or server needed.
import {chromium} from 'playwright';
for(const [name,angle]of [['swiftshader','swiftshader'],['llvmpipe-egl','gl-egl'],['llvmpipe-gl','gl']]){
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--headless=new','--use-gl=angle','--use-angle='+angle,'--ignore-gpu-blocklist',...(angle==='swiftshader'?['--enable-unsafe-swiftshader']:[])],env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',LP_NUM_THREADS:'2'}});
  const page=await browser.newPage(),gpu=await page.evaluate(()=>{const c=document.createElement('canvas'),gl=c.getContext('webgl2')||c.getContext('webgl');if(!gl)return null;const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
  console.log(name+': '+(gpu||'UNAVAILABLE (no WebGL context)'));
 }catch(e){console.log(name+': UNAVAILABLE ('+String(e.message).split('\n')[0]+')')}
 finally{await browser?.close()}
}

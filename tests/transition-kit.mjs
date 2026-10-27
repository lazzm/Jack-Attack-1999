// Transition capture kit: slow motion, per-frame traces, frame sequences and contact sheets.
// Used by transitions.mjs. Software WebGL draws ~5-15 frames a second, so a real-time capture
// would only see a handful of frames per transition. The kit slows the page's clock instead:
// performance.now, requestAnimationFrame timestamps, timers and CSS/WAAPI animations all run at
// `scale` (e.g. 0.08 = 12.5x slower), so a screenshot every ~120 ms real is a frame every ~10 ms
// of game time. Nothing in the game changes; only the clock it reads.
import {mkdir, writeFile} from 'node:fs/promises';

// Installs before any page script. window.__TS.set(scale) changes speed without a jump in time.
export async function installSlowmo(page){
  await page.addInitScript(()=>{
    if(window.__TS)return;
    const pn=performance.now.bind(performance),raf=window.requestAnimationFrame.bind(window);
    const st=window.setTimeout.bind(window),si=window.setInterval.bind(window);
    let scale=1,r0=0,v0=0;
    const virt=r=>v0+(r-r0)*scale;
    const TS=window.__TS={get scale(){return scale},now:()=>virt(pn()),real:pn,
      set(s){const r=pn();v0=virt(r);r0=r;scale=s}};
    performance.now=()=>virt(pn());
    window.requestAnimationFrame=cb=>raf(t=>cb(virt(t)));
    window.setTimeout=(fn,ms,...a)=>st(fn,(+ms||0)/scale,...a);
    window.setInterval=(fn,ms,...a)=>si(fn,Math.max(4,(+ms||0)/scale),...a);
    void TS;
  });
}
export async function slowmo(page,scale){
  if(!page.__cdp)page.__cdp=await page.context().newCDPSession(page);
  await page.__cdp.send('Animation.enable');
  await page.__cdp.send('Animation.setPlaybackRate',{playbackRate:scale});
  await page.evaluate(s=>window.__TS.set(s),scale);
}

// Per-frame state, sampled in a requestAnimationFrame after the house has drawn.
// probe: a function source string evaluated in the page each frame returning extra fields.
export async function startTrace(page,probe='()=>({})'){
  await page.evaluate(src=>{
    const extra=(0,eval)('('+src+')');
    const H=window.House,rec=window.__trace={frames:[],events:[],on:true};
    const vis=sel=>{const el=document.querySelector(sel);if(!el)return null;const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||el.hidden)return 0;let o=+s.opacity;for(let p=el.parentElement;p&&o>0;p=p.parentElement){const q=getComputedStyle(p);if(q.display==='none'||q.visibility==='hidden')return 0;o*=+q.opacity}return Math.round(o*1000)/1000};
    rec.vis=vis;
    const tick=t=>{if(!rec.on)return;requestAnimationFrame(tick);
      const P=H.P;let x={};try{x=extra()}catch(e){x={err:String(e.message)}}
      rec.frames.push({t:performance.now(),real:window.__TS?.real()||0,x:P.x,y:P.y,z:P.z,rx:P.rx,ry:P.ry,fov:H.camera.fov,mode:H.mode,focus:!!H.focused,glide:H.gliding,...x})};
    requestAnimationFrame(tick);
    // input and audio events, on the same clock
    rec.key=ev=>rec.events.push({t:performance.now(),type:ev.type,key:ev.key,mode:H.mode});
    addEventListener('keydown',rec.key,true);
    const S=window.Sound;if(S&&!S.__traced){S.__traced=1;for(const k of ['play','world','sfx','tone','noise','click'])if(typeof S[k]==='function'){const f=S[k].bind(S);S[k]=(...a)=>{rec.events.push({t:performance.now(),type:'sound',name:k+':'+String(a[0]).slice(0,40)});return f(...a)}}}
  },probe);
}
export async function stopTrace(page){
  return page.evaluate(()=>{const r=window.__trace;if(!r)return{frames:[],events:[]};r.on=false;removeEventListener('keydown',r.key,true);return{frames:r.frames,events:r.events}});
}
export async function markTrace(page,label){await page.evaluate(l=>window.__trace?.events.push({t:performance.now(),type:'mark',label:l}),label)}

// Screenshots until `ms` of game time have passed (or until(page) is true). Returns [{t,buf}].
export async function captureFrames(page,ms,{until,quality=70,clip,max=400}={}){
  const frames=[],t0=await page.evaluate(()=>performance.now());
  for(let i=0;i<max;i++){
    const buf=await page.screenshot({type:'jpeg',quality,...(clip?{clip}:{})});
    const t=await page.evaluate(()=>performance.now());
    frames.push({t:t-t0,buf});
    if(t-t0>=ms)break;
    if(until&&await until(page))break;
  }
  return frames;
}

// Image analysis + contact sheet in a scratch page of the same browser (no extra dependencies).
export async function analyse(browser,frames,{regions={}}={}){
  const pg=await browser.newPage();
  try{
    return await pg.evaluate(async({imgs,regions})=>{
      const out=[];let prev=null;
      for(const src of imgs){
        const im=new Image();im.src=src;await im.decode();
        const w=160,h=Math.round(im.height*160/im.width),c=document.createElement('canvas');c.width=w;c.height=h;
        const g=c.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data;
        let sum=0,black=0;const lum=new Float32Array(w*h);
        for(let i=0,j=0;i<d.length;i+=4,j++){const L=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];lum[j]=L;sum+=L;if(L<10)black++}
        let diff=0;if(prev)for(let j=0;j<lum.length;j++)diff+=Math.abs(lum[j]-prev[j]);
        const reg={};
        for(const [k,[x0,y0,x1,y1]] of Object.entries(regions)){let s=0,n=0,b=0;for(let y=Math.floor(y0*h);y<Math.ceil(y1*h);y++)for(let x=Math.floor(x0*w);x<Math.ceil(x1*w);x++){const L=lum[y*w+x];s+=L;n++;if(L<10)b++}reg[k]={mean:s/Math.max(1,n),black:b/Math.max(1,n)}}
        out.push({mean:sum/lum.length,black:black/lum.length,diff:prev?diff/lum.length:0,reg});prev=lum;
      }
      return out;
    },{imgs:frames.map(f=>'data:image/jpeg;base64,'+f.buf.toString('base64')),regions});
  }finally{await pg.close()}
}
export async function contactSheet(browser,frames,path,{cols=8,width=240,label=''}={}){
  const pg=await browser.newPage();
  try{
    const b64=await pg.evaluate(async({imgs,times,cols,width,label})=>{
      const ims=[];for(const s of imgs){const im=new Image();im.src=s;await im.decode();ims.push(im)}
      const h=Math.round(ims[0].height*width/ims[0].width),rows=Math.ceil(ims.length/cols),top=label?22:0;
      const c=document.createElement('canvas');c.width=cols*width;c.height=rows*h+top;const g=c.getContext('2d');
      g.fillStyle='#111';g.fillRect(0,0,c.width,c.height);g.font='12px monospace';
      if(label){g.fillStyle='#fff';g.fillText(label,6,15)}
      ims.forEach((im,i)=>{const x=i%cols*width,y=top+Math.floor(i/cols)*h;g.drawImage(im,x,y,width,h);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x,y+h-15,62,15);g.fillStyle='#ff0';g.fillText(Math.round(times[i])+'ms',x+3,y+h-4)});
      return c.toDataURL('image/jpeg',.82).split(',')[1];
    },{imgs:frames.map(f=>'data:image/jpeg;base64,'+f.buf.toString('base64')),times:frames.map(f=>f.t),cols,width,label});
    await writeFile(path,Buffer.from(b64,'base64'));
  }finally{await pg.close()}
}
export async function saveFrames(frames,dir,{every=1}={}){
  await mkdir(dir,{recursive:true});
  for(let i=0;i<frames.length;i+=every)await writeFile(`${dir}/${String(i).padStart(3,'0')}-${Math.round(frames[i].t)}ms.jpg`,frames[i].buf);
}

// Motion analysis of a camera trace: speeds per game-ms, snaps (a jump much larger than the
// neighbouring frames), and acceleration spikes (velocity discontinuities: double easing,
// restarts, pops). Units: cm and degrees.
export function motion(frames,{fields=['x','y','z'],angles=['rx','ry']}={}){
  const out=[];
  for(let i=1;i<frames.length;i++){
    const a=frames[i-1],b=frames[i],dt=Math.max(1e-3,b.t-a.t);
    const d=Math.hypot(...fields.map(k=>(b[k]??0)-(a[k]??0)));
    const r=Math.hypot(...angles.map(k=>{let v=((b[k]??0)-(a[k]??0))%360;if(v>180)v-=360;if(v<-180)v+=360;return v}));
    out.push({t:b.t,dt,v:d/dt,w:r/dt,d,r});
  }
  return out;
}
// A pop: a frame-to-frame step more than `k` times the larger neighbouring step, and above a floor.
export function pops(steps,{k=4,floor=1.5,key='d'}={}){
  const bad=[];
  for(let i=1;i<steps.length-1;i++){const s=steps[i][key],n=Math.max(steps[i-1][key],steps[i+1][key]);if(s>floor&&s>k*Math.max(n,1e-3))bad.push({i,t:steps[i].t,step:s,neigh:n})}
  return bad;
}

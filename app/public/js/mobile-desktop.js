/* Handheld access is JackOS only: no house construction or room save writes. */
(function () {
  'use strict';
  if (!window.PCOnly?.desktopOnly) return;
  const root=document.documentElement, surface=DesktopSurface.root();
  document.getElementById('boot')?.remove();
  document.body.classList.add('pc-monitor','online');
  let finish;window.BootDone=new Promise(resolve=>{finish=resolve});
  const key='jhp_mobile_resume';let started=false,owner='',tracked=[],poweredOff=false;
  function save(){
    if(!started||!window.AccountGate?.allowed||owner!==Net.me.nick)return;
    Apps.flushGames?.();
    const wins=tracked.filter(t=>!t.w.closed&&t.w.el.isConnected).map(t=>({id:t.id,arg:t.arg}));
    try{localStorage.setItem(key,JSON.stringify({owner,off:poweredOff,sec:window.IE?.current,y:document.getElementById('page')?.scrollTop||0,wins}))}catch(e){}
  }
  function enter(){
    if(started||!window.AccountGate?.allowed||!window.Apps)return;
    started=true;owner=Net.me.nick;let resume;
    try{resume=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
    const open=Apps.open;
    Apps.open=function(id,arg){
      const result=open.apply(this,arguments);
      const remember=w=>{if(w?.el&&!tracked.some(t=>t.w===w)){
        let safe;try{const encoded=JSON.stringify(arg);if(encoded&&encoded.length<1500)safe=JSON.parse(encoded)}catch(e){}
        tracked.push({w,id,arg:safe});
      }};
      if(result?.then)result.then(remember,()=>{});else remember(result);return result;
    };
    finish();
    if(resume?.owner===owner){
      if(resume.off){poweredOff=true;powerPanel();return;}
      if(resume.sec&&resume.sec!=='secret'&&resume.sec!=='error'&&!location.hash)IE.go(resume.sec);
      setTimeout(()=>{const page=document.getElementById('page');if(page)page.scrollTop=resume.y||0},300);
      for(const [i,item]of (resume.wins||[]).slice(0,12).entries())setTimeout(()=>{
        if(Apps.apps[item.id])Promise.resolve(Apps.open(item.id,item.arg)).catch(()=>{});
      },150+i*100);
    }
  }
  // Account/profile hydration must finish before starting apps or saving desktop state.
  const timer=setInterval(()=>{enter();if(started)clearInterval(timer)},100);
  addEventListener('pagehide',save);addEventListener('beforeunload',save);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
  setInterval(save,10000);
  function powerPanel(){
    if(surface.querySelector('.mobile-power'))return;
    const panel=document.createElement('div');panel.className='mobile-power';
    const title=document.createElement('p');title.textContent='JackOS is switched off.';
    const on=document.createElement('button');on.type='button';on.textContent='Switch on';
    on.addEventListener('click',()=>{poweredOff=false;save();location.reload()});panel.append(title,on);surface.appendChild(panel);
  }
  window.MobileDesktop={power(how){
    document.getElementById('crt')?.classList.remove('off');
    if(how!=='power'){save();location.reload();return true;}
    poweredOff=true;for(const item of tracked)item.w.close?.();tracked=[];save();powerPanel();return true;
  }};
  // These are room-only commands; JackOS still supplies Start > Log Off/Shutdown.
  addEventListener('DOMContentLoaded',()=>{
    for(const el of document.querySelectorAll('[data-app="room"],#standBtn,#pcStand'))el.hidden=true;
    root.classList.remove('house-entering','pc-wake','pc-standwake');
    surface.classList.remove('pc-starting');enter();
  });
})();

/* JackNet Owner tools. Authority arrives only on the authenticated socket.
 * Each button/key sends a packet; world changes run only after its server ack. */
(function(){
 'use strict';
 const N=window.Net;if(!N||window.OwnerTools)return;
 let allowed=false,clock=null,panel=null,info=null,seq=0,waiting=null,confirmAction=null,overlay=null,showOverlay=false,saving=false,opening=false;
 const H=()=>window.House,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const typing=target=>!!(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],#dos,.dosbox,.dos-host,.terminal')||document.activeElement?.closest?.('.pcg-host')?.houseTyping?.()||window.FamilyPhone?.state?.()?.id==='edit');
 const now=()=>clock?new Date(clock.date+'T'+String(clock.hour).padStart(2,'0')+':00:00'):new Date();
 function status(text){if(panel)panel.querySelector('[role=status]').textContent=text;}
 function busy(value){panel?.querySelectorAll('button,input,select').forEach(b=>b.disabled=value);}
 function request(action,args={}){
  if(!allowed||waiting)return Promise.resolve(false);
  const rid='owner-'+(++seq);busy(true);status('Working...');
  return new Promise(resolve=>{
   const timer=setTimeout(()=>{waiting=null;busy(false);status('No reply from JackNet. Reconnect before trying again.');resolve(false);},12000);
   waiting={rid,resolve,timer,action};
   if(!N.send({t:'ownerAction',rid,action,...args})){clearTimeout(timer);waiting=null;busy(false);status('JackNet is disconnected.');resolve(false);}
  });
 }
 function close(){if(!panel?.open)return;panel.close();confirmAction=null;panel.querySelector('.owner-confirm').hidden=true;H()?.pauseControls(false);H()?.resumeLook?.();}
 function mount(){
  if(panel)return;
  panel=document.createElement('dialog');panel.className='owner-tools';panel.setAttribute('aria-labelledby','ownerTitle');
  panel.innerHTML=`<div class="owner-title"><b id="ownerTitle">Owner tools</b><span>JACKNET / JACK</span><button type="button" data-owner="close" aria-label="Close Owner tools">×</button></div>
  <div class="owner-body"><p class="owner-intro">Jack's testing desk. Changes apply to this account. Progress replacements keep a server snapshot.</p>
  <div class="owner-tabs" role="tablist" aria-label="Owner tools pages"><button role="tab" aria-selected="true" data-tab="saves">Progress</button><button role="tab" aria-selected="false" data-tab="unlocks">Unlocks</button><button role="tab" aria-selected="false" data-tab="world">World / testing</button></div>
  <section data-page="saves"><fieldset><legend>Progress snapshots</legend><p>Save the room, JackOS files and account progress before an experiment.</p><button data-owner="snapshot">Save snapshot</button><button data-owner="list">Refresh list</button><label>Saved snapshot<select name="snapshot" size="5" aria-label="Saved snapshot"></select></label><button data-owner="restore">Restore snapshot...</button></fieldset>
  <fieldset><legend>Start again</legend><p>Start Chapter 1 with a sparse room and £0 / 0 Rupees. Your name and logon stay Jack. Daily earning limits and shared-world records are kept.</p><button data-owner="reset">Reset me to a brand-new player...</button></fieldset></section>
  <section data-page="unlocks" hidden><fieldset><legend>The collection</legend><p>Put items straight into the collection. Includes every 1999 release; use the clock to inspect later releases.</p><button data-owner="unlock" data-kind="all">Unlock all</button><button data-owner="unlock" data-kind="hardware">All consoles / hardware</button><button data-owner="unlock" data-kind="games">All games / carts / discs</button><button data-owner="unlock" data-kind="magazines">All magazines</button></fieldset>
  <fieldset><legend>My diary</legend><label>Chapter<select name="chapter"></select></label><label>Step<select name="step"></select></label><button data-owner="storyJump">Jump here</button><button data-owner="storyComplete">Complete chapter</button></fieldset>
  <fieldset><legend>Pocket money / bank</legend><div class="owner-row"><label>Currency<select name="currency"><option value="cash">Pocket money (pence)</option><option value="rupees">Rupees</option></select></label><label>Amount (+ / −)<input name="amount" type="number" step="1" min="-5000000" max="5000000" value="1000"></label></div><p>Whole numbers. Daily caps are bypassed; every adjustment is logged.</p><button data-owner="money">Apply adjustment</button></fieldset></section>
  <section data-page="world" hidden><fieldset><legend>Walk through the walls</legend><button data-owner="noclip">Enable noclip / layout editor</button><p>WASD flies, Space / C rises / falls, Shift flies faster. Close this desk to move. Esc opens the game menu. The backquote key (&#96;) opens these tools.</p></fieldset>
  <fieldset><legend>Go somewhere</legend><label>Room / station<select name="station"></select></label><button data-owner="teleport">Teleport</button><button data-owner="rebuild">Reload / rebuild current room</button></fieldset>
  <fieldset><legend>1999 clock</legend><div class="owner-row"><label>Date (1999-MM-DD)<input name="date" type="text" inputmode="numeric" maxlength="10" placeholder="1999-MM-DD"></label><label>Hour<input name="hour" type="number" min="0" max="23" step="1" value="14"></label></div><button data-owner="clock">Set clock</button><button data-owner="clockClear">Use real day / hour</button><p class="owner-clock"></p><label>Jump to event<select name="seasonJump"></select></label><button data-owner="seasonJump">Jump</button><button data-owner="seasonReset">Start this event again</button><p>Jump sets the clock to that day and hour. Starting again clears this event's progress; rewards already paid are never paid twice.</p></fieldset>
  <fieldset><legend>Household tests</legend><label>Pixel Post parcel<select name="parcel"></select></label><button data-owner="parcel">Spawn parcel by the front door</button><label>Chore<select name="chore"></select></label><button data-owner="chore">Set up chore again</button><label>Household event<select name="event"></select></label><button data-owner="event">Trigger event</button><button data-owner="overlay">Show debug overlay</button></fieldset></section>
  <div class="owner-confirm" hidden><b>Confirm replacement</b><p></p><button data-owner="confirm">Yes, continue</button><button data-owner="cancel">Cancel</button></div>
  <p role="status" aria-live="polite">Ready.</p><div class="owner-footer"><span>OWNER ACCESS · &#96;</span><button data-owner="close">Return to the house</button></div></div>`;
  document.documentElement.appendChild(panel);
  panel.addEventListener('cancel',ev=>{ev.preventDefault();if(!waiting)close();});
  panel.addEventListener('change',ev=>{if(ev.target.name==='chapter')steps();});
  panel.addEventListener('click',ev=>{
   const tab=ev.target.closest('[data-tab]');if(tab){panel.querySelectorAll('[data-page]').forEach(s=>s.hidden=s.dataset.page!==tab.dataset.tab);panel.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));return;}
   const b=ev.target.closest('[data-owner]');if(b&&!b.disabled)void click(b);
  });
 }
 const input=name=>panel.querySelector('[name="'+name+'"]');
 function options(name,items){const el=input(name),old=el.value;el.innerHTML=items.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old;}
 function steps(){const ch=+input('chapter').value;options('step',[['','Start of chapter'],...(info?.steps||[]).filter(s=>s.ch===ch).map(s=>[s.id,s.text])]);}
 function render(){
  if(!panel||!info)return;
  options('snapshot',info.snapshots.map(s=>[s.id,new Date(s.at).toLocaleString()+' — '+s.reason]));
  options('chapter',info.chapters.map(c=>[c.id,c.id+'. '+c.title+(c.soon?' (planned)':'')]));steps();
  options('seasonJump',(info.seasons||[]).flatMap(e=>e.jump.map(j=>[e.id+'|'+j.id,e.name+': '+j.label])));
  options('parcel',info.parcels.map(p=>[p.id,p.title]));options('chore',info.chores.map(c=>[c.id,c.title]));options('event',info.events.map(id=>[id,{phone:'Telephone call',tea:'Tea is ready',bedtime:'Bedtime reminder',school:'School reminder',pocket:'Pocket money reminder'}[id]]));
  const rooms=Object.values(H()?.ROOMS||{});options('station',rooms.flatMap(r=>(r.stations||[]).map((s,i)=>[r.id+'|'+i,r.name+' / '+(s.n||s.name||s.label||s.id||'Station '+(i+1))])));
  input('date').value=clock?.date||('1999-'+String(now().getMonth()+1).padStart(2,'0')+'-'+String(Math.min(now().getDate(),now().getMonth()===1?28:31)).padStart(2,'0'));input('hour').value=clock?.hour??now().getHours();
  panel.querySelector('.owner-clock').textContent=clock?'Override: '+clock.date+' at '+String(clock.hour).padStart(2,'0')+':00. Only Jack sees it.':'Using the normal 1999 calendar and local hour.';
  panel.querySelector('[data-owner=noclip]').textContent=window.HouseEdit?.on?'Disable noclip / layout editor':'Enable noclip / layout editor';
  panel.querySelector('[data-owner=overlay]').textContent=showOverlay?'Hide debug overlay':'Show debug overlay';
 }
 function confirm(action,args,text){confirmAction={action,args};const box=panel.querySelector('.owner-confirm');box.hidden=false;box.querySelector('p').textContent=text;box.scrollIntoView({block:'nearest'});box.querySelector('[data-owner=cancel]').focus();}
 async function synced(action,args={}){
  if(saving||waiting)return;saving=true;status('Saving JackOS and the room to JackNet...');busy(true);
  try{window.Apps?.flushGames?.();H()?.saveWalkState?.();if(!window.Roam||!await Roam.syncNow())throw Error('JackNet has not confirmed your current save. Try again when connected.');saving=false;await request(action,args);}catch(e){saving=false;busy(false);status(e.message);}
 }
 async function click(b){
  const a=b.dataset.owner;
  if(a==='close'){close();return;}if(a==='cancel'){confirmAction=null;panel.querySelector('.owner-confirm').hidden=true;return;}
  if(a==='reset')return confirm('reset',{confirm:'RESET JACK'},'Reset Jack to Chapter 1? A snapshot is taken first. The room will reload.');
  if(a==='restore'){if(!input('snapshot').value)return status('Choose a saved snapshot first.');return confirm('restore',{confirm:'RESTORE JACK',snapshot:input('snapshot').value},'Restore the selected snapshot exactly? Your current progress is snapshotted first. The room will reload.');}
  if(a==='confirm'){if(confirmAction){const{action,args}=confirmAction;confirmAction=null;panel.querySelector('.owner-confirm').hidden=true;return synced(action,args);}return;}
  if(a==='snapshot')return synced('snapshot');
  if(a==='unlock')return synced('unlock',{kind:b.dataset.kind});
  if(a==='list')return request('list');
  if(a==='money')return request('money',{currency:input('currency').value,amount:Number(input('amount').value)});
  if(a==='storyJump'||a==='storyComplete')return request('story',{chapter:+input('chapter').value,step:a==='storyJump'?input('step').value:'',complete:a==='storyComplete'});
  if(a==='clock')return request('clock',{date:input('date').value,hour:+input('hour').value});
  if(a==='clockClear')return request('clock',{clear:true});
  if(a==='seasonJump'||a==='seasonReset'){const[ev,jid]=String(input('seasonJump').value).split('|'),e=(info?.seasons||[]).find(x=>x.id===ev),j=e?.jump.find(x=>x.id===jid);if(!e||!j)return status('Choose an event first.');if(a==='seasonReset'){if(e.soon)return status(e.name+' is not built yet.');return request('season',{event:e.id});}return request('clock',{date:'1999-'+j.date,hour:j.hour});}
  if(a==='parcel')return request('parcel',{item:input('parcel').value});
  if(a==='noclip')return request('noclip',{on:!window.HouseEdit?.on});
  if(a==='teleport'){const[room,station]=input('station').value.split('|');return request('teleport',{room,station:+station});}
  if(a==='chore')return request('chore',{chore:input('chore').value});
  if(a==='event')return request('event',{event:input('event').value});
  if(a==='overlay')return request('overlay',{on:!showOverlay});
  if(a==='rebuild')return synced('rebuild');
 }
 async function effect(e){
  if(!e)return;
  if(e.kind==='open'){
   opening=true;await window.Room?.ensureHouse?.();if(e.god)window.HouseEdit?.setEnabled(true);
   mount();render();if(window.HousePause?.open)HousePause.close();H()?.pauseControls(true);panel.showModal();opening=false;panel.querySelector('[data-tab]').focus();status('Ready.');
  }else if(e.kind==='noclip'){
   close();if(!window.HouseEdit?.setEnabled(e.on))status('Stand up in the house before enabling noclip.');if(e.menu)window.HousePause?.show();
  }else if(e.kind==='teleport'){
   if(!H()?.ROOMS[e.room]?.stations[e.station])throw Error('That room station is unavailable.');
   close();window.HouseEdit?.setEnabled(false);window.RoomTV?.close();if(H().focused)H().unfocus();if(H().canStand())H().standUp();H().cancelGlide();H()._.setMode('walk');H().goRoom(e.room,e.station);H().saveWalkState();
  }else if(e.kind==='rebuild'){close();window.HouseEdit?.setEnabled(false);H()?.saveWalkState();location.reload();}
  else if(e.kind==='overlay'){showOverlay=e.on;if(!overlay){overlay=document.createElement('pre');overlay.className='owner-debug';document.documentElement.appendChild(overlay);}overlay.hidden=!showOverlay;render();}
  else if(e.kind==='chore'){
   close();window.HouseEdit?.setEnabled(false);await window.Room?.ensureHouse?.();if(!H()?.ROOMS[e.room])throw Error('Chore room is unavailable.');window.RoomTV?.close();if(H().focused)H().unfocus();if(H().canStand())H().standUp();H().cancelGlide();H()._.setMode('walk');H().goRoom(e.room,0);await window.Chores?.ready;for(let i=0;i<50&&!window.ChoreKit?.MODS[e.id]?._built;i++)await new Promise(r=>setTimeout(r,100));if(!window.ChoreKit?.ownerStart(e.id))throw Error('This chore has not finished loading. Try again.');
  }else if(e.kind==='event'){
   close();await window.Room?.ensureHouse?.();if(!window.HouseLife){await Apps.load('js/hs-cat.js');await Apps.load('js/hs-life.js');}if(H()?.ROOMS.lounge)H().buildRoom(H().ROOMS.lounge);if(!window.HouseLife?.ownerEvent(e.id))throw Error('Household event unavailable (the phone may already be ringing).');
  }
 }
 N.on('ownerResult',m=>{
  if(!allowed||!waiting||waiting.rid!==m.rid)return;
  const w=waiting;waiting=null;clearTimeout(w.timer);busy(false);status(m.msg);w.resolve(m.ok);
  if(m.ok)void effect(m.effect).catch(e=>{opening=false;status(e.message);H()?.toast('Owner tools',e.message);});
 });
 N.on('ownerState',m=>{if(!allowed)return;info=m;clock=m.clock;render();});
 function setClock(value){clock=value;dispatchEvent(new Event('ownerclock'));render();}
 N.on('ownerAccess',m=>{allowed=m.allowed===true;if(allowed)setClock(m.clock||null);});
 N.on('ownerClock',m=>{if(allowed){setClock(m.clock||null);for(const t of ['pmxMe','cxWins','rmMe'])N.send({t});}});
 function revoke(){opening=false;saving=false;if(waiting){clearTimeout(waiting.timer);waiting.resolve(false);waiting=null;}window.HouseEdit?.setEnabled(false);allowed=false;clock=null;showOverlay=false;if(overlay)overlay.remove();overlay=null;close();panel?.remove();panel=null;info=null;}
 N.on('_close',revoke);N.on('you',m=>{if(!m.member)revoke();});N.on('welcome',m=>{if(!m.member||allowed&&m.nick?.toLowerCase()!=='jack')revoke();});N.on('loginOk',m=>{if(allowed&&m.nick?.toLowerCase()!=='jack')revoke();});
 // Registered before house/game handlers, so modal text fields and Esc are safe.
 addEventListener('keydown',ev=>{
  if(!allowed||typing(ev.target))return;
  if(saving||waiting){if(ev.code==='Backquote'||ev.code==='F9'||panel?.open&&ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();}return;}
  if((ev.code==='Backquote'||ev.code==='F9')&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){if(panel?.open){close();void request('noclip',{on:false});}else void request('open',{god:true});}return;}
  if(panel?.open){if(ev.key==='Escape'){ev.preventDefault();if(!waiting)close();}ev.stopImmediatePropagation();}
 },true);
 setInterval(()=>{if(showOverlay&&allowed&&overlay){const d=window.__jhpDebug?.();overlay.textContent=d?'JACKNET DEBUG\n'+d.fps+' FPS / '+d.renderer.calls+' draws\nRoom: '+d.room+'\nHeld: '+(d.held||'nothing')+'\nStory: '+JSON.stringify(d.story):'JackOS desktop only';}},500);
 window.OwnerTools={get active(){return opening||!!panel?.open||waiting?.action==='open';},get allowed(){return allowed;},get clock(){return clock;},now,typing,open:()=>request('open'),toggle:()=>panel?.open?close():request('open',{god:true}),escape:()=>request('noclip',{on:false,menu:true})};
})();

/* The house's game menu. Cursor ownership is automatic, not a walking mode. */
(function(){
 'use strict';
 const H=window.House;if(!H||!H.ok||window.HousePause)return;
 function activeScreen(){
  if(['monitor','pcboot'].includes(H.mode)||document.body.classList.contains('pc-monitor'))return{type:'pc',locked:H.desktopDisplay()};
  if(window.RoomTV?.open_)return{type:'console',locked:RoomTV.lockIn()};
  const s=H.surfaceScreen();return s?{type:'surface',locked:s.locked}:null;
 }
 function lockScreen(on){const s=activeScreen();if(!s)return false;const full=typeof on==='boolean'?on:!s.locked;if(s.type==='pc')H.desktopDisplay(full);else if(s.type==='console')RoomTV.lockIn(full);else H.surfaceScreen(full);syncSettings();return full;}
 window.ScreenLock={toggle:lockScreen,get available(){return!!activeScreen()},get current(){return activeScreen()}};
 const el=document.createElement('dialog');el.className='hs-pause';el.setAttribute('aria-labelledby','hsPauseTitle');
 el.innerHTML=`<div class="hs-pause-head"><span>1999</span><h1 id="hsPauseTitle">PAUSE MENU</h1></div>
 <div class="hs-pause-main"><div class="hs-pause-actions"><button type="button" data-pause="resume">RESUME <kbd>Esc</kbd></button><button type="button" data-pause="leave" hidden>BACK TO THE ROOM</button><button type="button" data-pause="return" hidden>RETURN HELD ITEM <kbd>Q</kbd></button></div>
 <fieldset><legend>AUDIO</legend><label><input type="checkbox" name="music"> Music</label><label><input type="checkbox" name="effects"> Sound effects &amp; voices</label><label class="hs-audio-volume">Volume <output>100%</output><input type="range" name="volume" min="0" max="100" step="1" aria-label="Overall volume"></label><p class="hs-pause-mouse">Applies throughout the house, PC and games. Saved for next time.</p></fieldset>
 <fieldset><legend>SETTINGS</legend><label class="hs-pause-check"><input type="checkbox" name="desktopFull"> LOCK IN [T]<small class="hs-lock-help">Full-screen view of the screen you are using. Press T again to return. JackOS fills the window; console and handheld screens keep their original proportions.</small></label>
 <label><input type="checkbox" name="crouchToggle"> Toggle crouch [C]<small>Off: hold C. On: press C to crouch or stand.</small></label>
 <label>Guidance <select name="guidance"><option value="full">Full</option><option value="light">Light</option><option value="off">Off</option></select></label>
 <button type="button" data-pause="graphics" aria-controls="hsGraphicsMenu" aria-expanded="false">GRAPHICS OPTIONS <span class="hs-graphics-summary"></span></button>
 <button type="button" data-pause="fullscreen">FULL-SCREEN GAME</button><p class="hs-pause-mouse">Mouse: automatic. Locked while walking; cursor available for screens, inspection and menus.</p></fieldset>
 <button type="button" data-pause="owner" hidden>OWNER TOOLS <kbd>&#96;</kbd></button>
 <fieldset><legend>JACKNET ACCOUNT</legend><button type="button" data-pause="logout">LOG OUT</button><div class="hs-logout-confirm" hidden><p>Save your room and settings, then return to Log On? Your account is kept.</p><button type="button" data-pause="confirmLogout">SAVE AND LOG OUT</button><button type="button" data-pause="cancelLogout">CANCEL</button></div></fieldset>
 <fieldset class="hs-test-reset" hidden><legend>TEST ACCOUNT ONLY</legend><p>Reset this test room, media, local game saves and balances. Daily limits, chores and shared-world records are kept. Other accounts are not affected.</p><button type="button" data-pause="resetTest">RESET TEST SAVE</button><div class="hs-test-confirm" hidden><p>Start the test save again? A server backup is kept.</p><button type="button" data-pause="confirmReset">YES, RESET TEST</button><button type="button" data-pause="cancelReset">CANCEL</button></div></fieldset>
 <details class="hs-pause-controls"><summary>KEYBOARD &amp; MOUSE</summary><p class="hs-pause-keys"><kbd>WASD</kbd> Walk · <kbd>Mouse</kbd> Look · <kbd>Shift</kbd> Jog<br><kbd>F</kbd> Use / look / play / sit · <kbd>E</kbd> Pick up / place<br><kbd>R</kbd> Turn · <kbd>Wheel</kbd> Distance<br><kbd>Q</kbd> Back / return item · <kbd>T</kbd> LOCK IN<br><kbd>C</kbd> Crouch · <kbd>Space</kbd> Jump · <kbd>Esc</kbd> Menu<span class="hs-owner-key" hidden><br><kbd>&#96;</kbd> Owner tools / god mode</span></p></details>
 <p class="hs-pause-status" role="status">Movement is stopped. Online programs and the TV keep running.</p></div>`;
 document.documentElement.appendChild(el);
 const guidance=el.querySelector('[name=guidance]');guidance.value=localStorage.getItem('jhp_story_guidance')||'full';guidance.addEventListener('change',()=>window.StoryGuide?.setting(guidance.value));
 const main=el.querySelector('.hs-pause-main');let graphicsOpen=false;
 const graphicsMenu=window.HouseGraphicsMenu?.mount(el,{back:()=>graphicsBack(),resume:closeMenu});
 function graphicsBack(focus=true){graphicsOpen=false;graphicsMenu?.hide();main.hidden=false;el.querySelector('h1').textContent='PAUSE MENU';button('graphics').setAttribute('aria-expanded','false');syncSettings();el.scrollTop=0;if(focus&&el.open){button('graphics').focus({preventScroll:true});button('graphics').scrollIntoView({block:'nearest',inline:'nearest'});}}
 function openGraphics(){if(!graphicsMenu||!H.graphicsGet||!H.graphicsSet)return;graphicsOpen=true;main.hidden=true;button('graphics').setAttribute('aria-expanded','true');el.querySelector('h1').textContent='GRAPHICS';el.scrollTop=0;graphicsMenu.show();}
 const stamp=new URL(document.querySelector('script[src*="js/hs-pause.js"]')?.src||location.href).searchParams.get('v')||'',release=stamp.includes('-')?stamp.match(/^\d+\.\d+\.\d+/)?.[0]:null;
 const version=document.createElement('small');version.className='hs-pause-version';version.style.cssText='display:block;text-align:right;padding:0 16px 12px;color:#b8aa84;font:11px monospace';el.appendChild(version);
 function showVersion(v){const current=release||v||window.Net?.me.version;version.textContent=current?'VERSION '+current:'DEVELOPMENT BUILD'}showVersion();window.Net?.on('welcome',m=>showVersion(m.v));
 let previous=null,loggingOut=false;
 let logoutAck=null;
 window.Net?.on('you',m=>{if(logoutAck&&!m.member)logoutAck(true)});
 window.Net?.on('_close',()=>{if(logoutAck)logoutAck(false)});
 async function logout(){
  if(loggingOut)return;
  loggingOut=true;
  const status=el.querySelector('.hs-pause-status');
  el.querySelectorAll('button,input,select').forEach(b=>b.disabled=true);
  status.textContent='Saving your room and settings to JackNet...';
  try{
   if(!window.Net?.connected||!Net.me.member||!window.Roam)throw Error('Reconnect to JackNet, then try again. You are still logged on.');
   window.Apps?.flushGames?.();H.saveWalkState();
   if(!await Roam.syncNow())throw Error('JackNet could not confirm your save. You are still logged on. Please try again.');
   status.textContent='Saved. Logging out...';
   const ok=await new Promise(resolve=>{const finish=ok=>{clearTimeout(timer);logoutAck=null;resolve(ok)};const timer=setTimeout(()=>finish(false),8000);logoutAck=finish;if(!Net.send({t:'logoff',token:Net.store.get('jhp_token')}))finish(false)});
   if(!ok)throw Error('Your save was confirmed, but logout was not. Reconnect and try again.');
   location.reload();
  }catch(e){status.textContent=e.message;loggingOut=false;el.querySelectorAll('button,input,select').forEach(b=>b.disabled=false);syncSettings();button('cancelLogout').focus();}
 }
 const button=k=>el.querySelector('[data-pause="'+k+'"]');
 function canBack(){return!!(H.focused||H.mode==='inspect'||H.canStand()||window.RoomTV?.open_)}
 function quickBack(){if(H.paused||!canBack())return false;if(H.mode==='inspect')H.endInspect();else if(window.RoomTV?.open_)RoomTV.close();else if(H.focused)H.unfocus();else H.standUp();return true;}
 function syncAudio(){el.querySelector('[name=music]').checked=!!window.Sound?.musicOn;el.querySelector('[name=effects]').checked=!!window.Sound?.effectsOn;const volume=Math.round((window.Sound?.volume??1)*100);el.querySelector('[name=volume]').value=volume;el.querySelector('.hs-audio-volume output').textContent=volume+'%'}
 document.addEventListener('audiochange',syncAudio);
 function syncSettings(){syncAudio();const current=activeScreen(),box=el.querySelector('[name=desktopFull]');box.checked=!!current?.locked;box.disabled=!current;const graphics=button('graphics');graphics.disabled=!graphicsMenu||!H.graphicsGet||!H.graphicsSet;const preset=H.graphicsGet?.().preset;graphics.querySelector('span').textContent=window.HouseGraphicsMenu?.names[preset]||'';el.querySelector('.hs-lock-help').textContent=current?'Full-screen view of this screen. Press T again to return. JackOS fills the window; console and handheld screens keep their original proportions.':'Use a PC, console, Game Lad or family TV, then press T to LOCK IN.';}
 function openMenu(){
  if(el.open||window.stDiary?.picking||!H.live||window.House?.god||window.OwnerTools?.active||window.AccountGate&&!AccountGate.allowed)return false;
  previous=el.contains(document.activeElement)?null:document.activeElement;graphicsBack(false);el.querySelector('[name=crouchToggle]').checked=H.crouchSetting();
  button('owner').hidden=!window.OwnerTools?.allowed;el.querySelector('.hs-owner-key').hidden=!window.OwnerTools?.allowed;
  el.querySelector('.hs-test-reset').hidden=!(window.Net?.me.member&&Net.me.nick.toLowerCase()==='test'&&localStorage.getItem('jhp_starter')==='1');el.querySelector('.hs-test-confirm').hidden=true;
  el.querySelector('.hs-logout-confirm').hidden=true;
  button('leave').hidden=!(H.focused||H.mode==='inspect'||H.canStand()||window.RoomTV?.open_);
  el.querySelector('.hs-pause-status').textContent=window.RoomTV?.open_?'This console game is paused. Audio keeps playing so you can adjust it. Online programs keep running.':'Movement is stopped. Online programs and the TV keep running.';
  button('return').hidden=!H.held();H.pauseControls(true);document.documentElement.classList.add('hs-paused');el.showModal();button('resume').focus();return true;
 }
 function closeMenu(){if(!el.open||loggingOut)return;el.close();graphicsBack(false);document.documentElement.classList.remove('hs-paused');if(previous?.isConnected&&!el.contains(previous)&&previous.getClientRects().length)previous.focus({preventScroll:true});if(el.contains(document.activeElement))document.activeElement.blur();H.pauseControls(false);H.resumeLook?.();}
 function handleEscape(ev){if(window.stDiary?.handleKey?.(ev))return true;if(ev.key!=='Escape')return false;if(!el.open&&!H.live)return false;ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){if(el.open){if(graphicsOpen)graphicsBack();else closeMenu()}else openMenu()}return true;}
 el.addEventListener('cancel',ev=>{ev.preventDefault();if(graphicsOpen)graphicsBack();else closeMenu()});
 el.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-pause]');if(!b)return;
  if(b.dataset.pause==='owner'){closeMenu();window.OwnerTools?.open();}
  else if(b.dataset.pause==='graphics')openGraphics();
  else if(b.dataset.pause==='logout'){el.querySelector('.hs-logout-confirm').hidden=false;button('cancelLogout').focus();}
  else if(b.dataset.pause==='cancelLogout'){el.querySelector('.hs-logout-confirm').hidden=true;button('logout').focus();}
  else if(b.dataset.pause==='confirmLogout')logout();
  else if(b.dataset.pause==='resetTest')el.querySelector('.hs-test-confirm').hidden=false;
  else if(b.dataset.pause==='cancelReset')el.querySelector('.hs-test-confirm').hidden=true;
  else if(b.dataset.pause==='confirmReset'){b.disabled=true;Net.send({t:'testReset',confirm:'RESET TEST'});setTimeout(()=>{b.disabled=false},10000)}
  else if(b.dataset.pause==='resume')closeMenu();
  else if(b.dataset.pause==='return'){closeMenu();H.putBack()}
  else if(b.dataset.pause==='leave'){
   closeMenu();quickBack();
  }else if(b.dataset.pause==='fullscreen'){
   const action=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
   if(action?.catch)action.catch(()=>{el.querySelector('.hs-pause-status').textContent='Full-screen was unavailable. The game still works in this window.'});
  }
 });
 window.Net?.on('testResetResult',m=>{el.querySelector('.hs-pause-status').textContent=m.msg;button('confirmReset').disabled=false;if(m.ok)el.querySelector('.hs-test-confirm').hidden=true});
 el.addEventListener('change',ev=>{if(ev.target.name==='desktopFull')lockScreen(ev.target.checked);else if(ev.target.name==='crouchToggle')H.crouchSetting(ev.target.checked);else if(ev.target.name==='music')Sound.musicOn=ev.target.checked;else if(ev.target.name==='effects')Sound.effectsOn=ev.target.checked});
 el.addEventListener('input',ev=>{if(ev.target.name==='volume')Sound.setVolume(+ev.target.value/100)});
 document.addEventListener('fullscreenchange',()=>{button('fullscreen').textContent=document.fullscreenElement?'WINDOWED GAME':'FULL-SCREEN GAME'});
 // House's handler calls us first. This also shields later desktop/game
 // shortcuts while the modal owns the keyboard; native Tab/Enter still work.
 addEventListener('keydown',ev=>{if(el.open){
  if(ev.key==='Tab'){
   const items=[...el.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(n=>!n.disabled&&n.tabIndex>=0&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
   const at=items.indexOf(document.activeElement);if(items.length&&(at<0||ev.shiftKey&&at===0||!ev.shiftKey&&at===items.length-1)){ev.preventDefault();items[ev.shiftKey?items.length-1:0].focus()}
  }
  if(!handleEscape(ev))ev.stopImmediatePropagation()
 }},true);
 let owned=false;
 document.addEventListener('pointerlockchange',()=>{
  const now=!!document.pointerLockElement?.classList.contains('hs-gl'),was=owned;owned=now;
  // Browsers can consume Esc themselves to release pointer lock, without
  // delivering a keydown. Opening the menu here handles that path as well.
  if(was&&!now&&!el.open&&(H.mode==='walk'||H.mode==='focus'&&H._.focusS?.o.seatId)&&!document.hidden&&document.hasFocus())openMenu();
 });
 window.HousePause={show:openMenu,close:closeMenu,handleEscape,quickBack,get canBack(){return canBack()},get open(){return el.open},get page(){return graphicsOpen?'graphics':'main'}};
})();

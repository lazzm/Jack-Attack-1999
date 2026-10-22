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
 el.innerHTML=`<div class="hs-pause-head"><span>1999</span><h1 id="hsPauseTitle">GAME MENU</h1></div>
 <div class="hs-pause-main"><button type="button" data-pause="resume">RESUME</button><button type="button" data-pause="leave" hidden>BACK TO THE ROOM</button><button type="button" data-pause="return" hidden>PUT HELD ITEM BACK</button>
 <fieldset><legend>SETTINGS</legend><label class="hs-pause-check"><input type="checkbox" name="desktopFull"> LOCK IN [0]<small class="hs-lock-help">Full-screen view of the screen you are using. Press 0 again to return. Original proportions are preserved.</small></label>
 <label>Graphics <select name="graphics"><option value="auto">Automatic</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
 <button type="button" data-pause="fullscreen">FULL-SCREEN GAME</button><p class="hs-pause-mouse">Mouse: automatic. Locked while walking; cursor available for screens, inspection and menus.</p></fieldset>
 <p class="hs-pause-keys">WASD: walk · Mouse: look · F: interact<br>Shift: jog · C: crouch · Space: jump<br>I: inspect · R: turn · Click: place<br>0: LOCK IN · Esc: menu</p>
 <p class="hs-pause-status" role="status">Movement is stopped. Online programs and the TV keep running.</p></div>`;
 document.documentElement.appendChild(el);
 let previous=null;
 const button=k=>el.querySelector('[data-pause="'+k+'"]');
 function syncSettings(){const current=activeScreen(),box=el.querySelector('[name=desktopFull]');box.checked=!!current?.locked;box.disabled=!current;el.querySelector('.hs-lock-help').textContent=current?'Full-screen view of this screen. Press 0 again to return. Original proportions are preserved.':'Use a PC, console, Game Lad or family TV, then press 0 to LOCK IN.';}
 function openMenu(){
  if(el.open||!H.live||window.House?.god||window.AccountGate&&!AccountGate.allowed)return false;
  previous=document.activeElement;syncSettings();el.querySelector('[name=graphics]').value=H.Q.want;
  button('leave').hidden=!(H.focused||H.mode==='inspect'||H.canStand()||window.RoomTV?.open_);
  button('return').hidden=!H.held();H.pauseControls(true);document.documentElement.classList.add('hs-paused');el.showModal();button('resume').focus();return true;
 }
 function closeMenu(){if(!el.open)return;el.close();document.documentElement.classList.remove('hs-paused');if(previous?.isConnected)previous.focus({preventScroll:true});H.pauseControls(false);}
 function handleEscape(ev){if(ev.key!=='Escape')return false;if(!el.open&&!H.live)return false;ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){if(el.open)closeMenu();else openMenu()}return true;}
 el.addEventListener('cancel',ev=>{ev.preventDefault();closeMenu()});
 el.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-pause]');if(!b)return;
  if(b.dataset.pause==='resume')closeMenu();
  else if(b.dataset.pause==='return'){closeMenu();H.putBack()}
  else if(b.dataset.pause==='leave'){
   closeMenu();if(H.mode==='inspect')H.endInspect();else if(window.RoomTV?.open_)RoomTV.close();else if(H.focused)H.unfocus();else if(H.canStand())H.standUp();
  }else if(b.dataset.pause==='fullscreen'){
   const action=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
   if(action?.catch)action.catch(()=>{el.querySelector('.hs-pause-status').textContent='Full-screen was unavailable. The game still works in this window.'});
  }
 });
 el.addEventListener('change',ev=>{if(ev.target.name==='desktopFull')lockScreen(ev.target.checked);else if(ev.target.name==='graphics')H.gfx(ev.target.value)});
 document.addEventListener('fullscreenchange',()=>{button('fullscreen').textContent=document.fullscreenElement?'WINDOWED GAME':'FULL-SCREEN GAME'});
 // House's handler calls us first. This also shields later desktop/game
 // shortcuts while the modal owns the keyboard; native Tab/Enter still work.
 addEventListener('keydown',ev=>{if(el.open){if(!handleEscape(ev))ev.stopImmediatePropagation()}},true);
 let owned=false;
 document.addEventListener('pointerlockchange',()=>{
  const now=!!document.pointerLockElement?.classList.contains('hs-gl'),was=owned;owned=now;
  // Browsers can consume Esc themselves to release pointer lock, without
  // delivering a keydown. Opening the menu here handles that path as well.
  if(was&&!now&&!el.open&&H.mode==='walk'&&!document.hidden&&document.hasFocus())openMenu();
 });
 window.HousePause={show:openMenu,close:closeMenu,handleEscape,get open(){return el.open}};
 const menuButton=document.createElement('button');menuButton.type='button';menuButton.className='hs-menu-button';menuButton.textContent='MENU';menuButton.setAttribute('aria-label','Open game menu');menuButton.addEventListener('click',openMenu);document.documentElement.appendChild(menuButton);
})();

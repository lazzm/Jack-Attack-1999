/* A JackNet identity is required before entering the game. No guest bypass. */
(function(){
  'use strict';
  if(window.PCOnly?.blocked){window.AccountGate={allowed:false,blocked:true};return;}
  const root=document.documentElement,panel=document.createElement('div');
  panel.id='accountGate';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','JackNet account');
  // The on-screen keyboard shrinks the visual viewport, not always the layout viewport.
  const viewport=window.visualViewport;
  function fitKeyboard(){if(!viewport)return;if(window.PCOnly?.handheld){panel.style.height=viewport.height+'px';panel.style.top=viewport.offsetTop+'px';panel.style.bottom='auto';}if(panel.contains(document.activeElement))requestAnimationFrame(()=>document.activeElement?.scrollIntoView({block:'nearest'}));}
  viewport?.addEventListener('resize',fitKeyboard);viewport?.addEventListener('scroll',fitKeyboard);fitKeyboard();
  let creating=false,pending=false,blocked=true,identityStep=false,settingsReady=false,draft=null,waitTimer;
  const owner=()=>{try{return localStorage.getItem('jhp_roam_who')||''}catch(e){return '';}};
  const initialOwner=owner();
  creating=!initialOwner&&!Net.store.get('jhp_token')&&Net.store.get('jhp_logon_seen')!=='1';
  window.AccountGate={get allowed(){return !!(window.Net&&Net.me.member)&&!blocked;},get blocked(){return blocked;},show(){if(pending)return;creating=true;show();},profile(el){panel.replaceChildren(el);el.style.position='relative';el.style.left=el.style.top='auto';el.style.maxWidth='100%';},editIdentity(){if(pending||!Net.me.member)return;draft={...Net.me.identity,auto:false};showIdentity();}};
  function pause(){if(document.pointerLockElement)try{document.exitPointerLock();}catch(e){}if(window.House&&House.emit)House.emit('loading',true);}
  // A menu can have an asynchronous mouse-look request still in flight.
  document.addEventListener('pointerlockchange',()=>{if(blocked&&document.pointerLockElement)document.exitPointerLock();});
  function mount(){blocked=true;pause();root.classList.add('account-required');if(!panel.isConnected)root.appendChild(panel);}
  function status(message,error=false){const el=panel.querySelector('.account-error');if(el){el.textContent=message||'';el.classList.toggle('is-error',error);delete el.dataset.field;}}
  function busy(message){pending=true;clearTimeout(waitTimer);panel.querySelectorAll('input,button,summary').forEach(el=>{if(el.tagName!=='SUMMARY')el.disabled=true;});panel.querySelector('[type=submit]')?.setAttribute('aria-busy','true');status(message);waitTimer=setTimeout(()=>status('Still waiting for JackNet. Keep this window open. If nothing changes, reload and log on using the same name and password. Your saves are safe.'),10000);}
  function ready(){pending=false;clearTimeout(waitTimer);panel.querySelector('[aria-busy]')?.removeAttribute('aria-busy');panel.querySelectorAll('input,button').forEach(el=>el.disabled=false);}
  function loading(note){settingsReady=false;identityStep=false;mount();clearTimeout(waitTimer);
    panel.innerHTML='<div class="account-box account-loading"><h1>Opening your game</h1><p role="status"></p><progress aria-label="Loading saved game"></progress><p>Your account is ready. Loading your room and saved games from JackNet.</p><small>On a phone, hold it either way. Move with the left control and drag the view on the right.</small><button type="button">Reload and reconnect</button></div>';
    panel.querySelector('[role=status]').textContent=note||'Reading your saved game...';
    panel.querySelector('button').addEventListener('click',()=>location.reload());
  }
  function defaults(){if(!draft)draft={first:Cast.randomFirst('m'),g:'m',auto:true};return draft;}
  function characterHTML(){return '<label for="accountFirst">Name your family calls you</label><div class="account-name-row"><input id="accountFirst" name="first" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" minlength="2" maxlength="14" required aria-describedby="accountNameHelp firstError"><button type="button" data-roll aria-label="Choose another made-up name">&#9860;</button></div><small id="accountNameHelp">A character name, never your real name.</small><small class="account-field-error" id="firstError"></small><fieldset><legend>Your character is a...</legend><label><input type="radio" name="gender" value="m" required> Boy</label><label><input type="radio" name="gender" value="f" required> Girl</label></fieldset><small>This sets the family\'s words, such as son or daughter. Change it later in Menu &gt; About You, or JackNet &gt; Edit my profile.</small>';}
  function bindCharacter(f){
    const d=defaults(),first=f.elements.first;first.value=d.first;f.querySelector('[name=gender][value='+d.g+']').checked=true;
    const summary=()=>{const el=f.querySelector('[data-character-summary]');if(el)el.textContent='About You: '+draft.first+' · '+(draft.g==='f'?'Girl':'Boy')+' (change)';};
    f.addEventListener('input',ev=>{if(ev.target===first)draft.auto=false;else if(ev.target.name==='gender'&&draft.auto)first.value=Cast.randomFirst(f.elements.gender.value);draft={first:first.value,g:f.elements.gender.value,auto:draft.auto};summary();});
    f.querySelector('[data-roll]').addEventListener('click',()=>{first.value=Cast.randomFirst(f.elements.gender.value);draft={first:first.value,g:f.elements.gender.value,auto:true};summary();});summary();
  }
  function fieldError(field,message){
    const el=panel.querySelector('[name="'+field+'"]'),out=panel.querySelector('#'+field+'Error');
    if(out)out.textContent=message;if(el){el.setAttribute('aria-invalid','true');el.closest('details')?.setAttribute('open','');el.focus();}status(message,true);const live=panel.querySelector('.account-error');if(live)live.dataset.field=field;
  }
  function validCharacter(){draft.first=panel.querySelector('[name=first]').value.trim();draft.g=panel.querySelector('[name=gender]:checked')?.value;
    if(!/^[A-Za-z]+(?:[-'][A-Za-z]+)?$/.test(draft.first)||draft.first.length<2||draft.first.length>14){fieldError('first','Use 2 to 14 letters, with at most one hyphen or apostrophe.');return false;}return true;}
  function clearErrors(){panel.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));panel.querySelectorAll('.account-field-error').forEach(el=>el.textContent='');status('');}
  function show(note){
    if(Net.me.member)return;identityStep=false;mount();ready();
    // User-entered text is always assigned via value/textContent, never interpolated into HTML.
    panel.innerHTML='<form class="account-box account-welcome" method="post" novalidate><h1></h1><div class="account-preview"><img src="images/signup-bedroom.jpg" width="560" height="252" alt="A bedroom in the game, with a wooden desk, games shelf and a chunky telly"><p><b>Your room. Your family. Your 1999.</b><br>Explore the house, play games and get the family PC going.</p></div><p class="account-intro"></p><label for="accountUser">JackNet user name</label><input id="accountUser" name="name" type="text" enterkeyhint="next" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="16" required aria-describedby="nameHelp nameError"><small id="nameHelp">3–16 letters, numbers, - or _. Other players see this.</small><small class="account-field-error" id="nameError"></small><button type="button" data-suggestion hidden></button><label for="accountPassword">Password</label><div class="account-password-row"><input id="accountPassword" name="password" type="password" enterkeyhint="go" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="4" maxlength="64" required aria-describedby="passwordHelp passwordError"><button type="button" data-show aria-label="Show password" aria-controls="accountPassword" aria-pressed="false">Show</button></div><small id="passwordHelp"></small><small class="account-field-error" id="passwordError"></small>'+(creating?'<details class="account-character"><summary data-character-summary>About You (change)</summary>'+characterHTML()+'</details>':'<details class="account-recovery"><summary>Forgotten your password?</summary><p>Try the password saved in your browser or password manager. Check the user name and capital letters too.</p><p>If you are still signed in on another browser, keep it signed in so you can still play there.</p><p>JackNet has no password reset yet. Without a saved password or a signed-in browser, we cannot safely restore access. Creating a new account starts a separate game; it cannot recover the old one.</p><p>Never post your password or send it to anyone.</p></details>')+'<p class="account-error" role="status" aria-live="polite"></p><div class="account-buttons"><button type="submit"></button><button type="button" data-switch></button></div><small>Free account. No real name, age, email, address or real money.<br>You stay signed in on this browser until you log out. On a shared computer, use '+(window.PCOnly?.desktopOnly?'Start &gt; Log Off':'Menu &gt; Log Out')+' when finished.</small></form>';
    const f=panel.querySelector('form');f.dataset.mode=creating?'signup':'login';
    f.querySelector('h1').textContent=creating?'Create a JackNet Account':'Welcome to JackNet';
    f.querySelector('.account-intro').textContent=creating?'Pick two things to remember. Then you are in!':'New here? Create a free account to play. Already joined? Log on below.';
    f.elements.password.autocomplete=creating?'new-password':'current-password';
    f.querySelector('#passwordHelp').textContent=creating?'4–64 characters. Make it hard to guess; keep it safe.':'Use your JackNet password, including any capital letters.';
    f.querySelector('[type=submit]').textContent=creating?'Create Account & Play':'Log On & Play';f.querySelector('[data-switch]').textContent=creating?'Already joined? Log On':'Create Account';
    status(note);
    if(creating)bindCharacter(f);
    f.querySelector('[data-show]').addEventListener('click',ev=>{const on=f.elements.password.type==='password';f.elements.password.type=on?'text':'password';ev.currentTarget.textContent=on?'Hide':'Show';ev.currentTarget.setAttribute('aria-label',on?'Hide password':'Show password');ev.currentTarget.setAttribute('aria-pressed',String(on));});
    f.querySelector('[data-switch]').addEventListener('click',()=>{if(pending)return;const name=f.elements.name.value;creating=!creating;show();panel.querySelector('[name=name]').value=name;});
    f.addEventListener('input',ev=>{ev.target.removeAttribute('aria-invalid');const err=f.querySelector('#'+ev.target.name+'Error');if(err)err.textContent='';});
    f.addEventListener('submit',ev=>{
      ev.preventDefault();if(pending)return;clearErrors();
      const name=f.elements.name.value.trim(),pass=f.elements.password.value;
      if(!/^[A-Za-z0-9_-]{3,16}$/.test(name)){fieldError('name','Use 3 to 16 letters, numbers, underscores or hyphens.');return;}
      if(pass.length<4||pass.length>64){fieldError('password','Use a password of 4 to 64 characters.');return;}
      if(creating&&!validCharacter())return;
      if(!Net.connected||!Net.me.id){status('JackNet is connecting. Your details are kept here. Please try again when connected.');return;}
      if(!Net.send({t:'login',name,pass,signup:creating,...(creating?{me:{first:draft.first,g:draft.g}}:{})})){status('Could not connect. Your details are kept here; please try again.');return;}
      try{sessionStorage.setItem('jhp_login_seat','1');}catch(e){}
      busy(creating?'Creating your account and saving your character...':'Checking your account...');
    });
    // Let phone visitors read the invitation before a keyboard covers it.
    if(!window.PCOnly?.handheld)f.elements.name.focus({preventScroll:true});
  }
  function showIdentity(note){
    identityStep=true;mount();ready();defaults();
    panel.innerHTML='<form class="account-box account-identity" method="post" novalidate><h1>JackNet - About You</h1><p>Your character in the house. A made-up name is ready to use.</p>'+characterHTML()+'<p class="account-error" role="status" aria-live="polite"></p><div class="account-buttons"><button type="submit">Save & Continue</button>'+(Net.me.identity?'<button type="button" data-cancel>Cancel</button>':'')+'</div></form>';
    const f=panel.querySelector('form');bindCharacter(f);status(note);if(!window.PCOnly?.handheld){f.elements.first.focus({preventScroll:true});f.elements.first.select();}f.querySelector('[data-cancel]')?.addEventListener('click',()=>{if(!pending)unlock();});
    f.addEventListener('submit',ev=>{ev.preventDefault();if(pending)return;clearErrors();if(!validCharacter())return;if(!Net.connected){status('JackNet is reconnecting. Your choices are kept here. Please try again.');return;}if(Net.send({t:'meSet',me:{first:draft.first,g:draft.g}}))busy('Saving your character...');});
  }
  function unlock(){settingsReady=true;ready();if(!Net.me.identity){if(!identityStep)showIdentity();return;}identityStep=false;draft=null;blocked=false;panel.remove();root.classList.remove('account-required');if(window.House&&House.emit)House.emit('loading',!!document.querySelector('.hs-loading'));seatAfterLogin()}
  let seating=false;
  Net.on('stState', m => {
    window.StorySnapshot = m;
    if (window.PCOnly?.desktopOnly) return;
    const available = !!(m.flags?.veteran || m.flags?.pcOwned || m.done?.power);
    localStorage.setItem('jhp_story_pc', available ? 'owned' : 'missing');
  });
  function seatAfterLogin(){
    if(window.PCOnly?.desktopOnly){try{sessionStorage.removeItem('jhp_login_seat')}catch(e){}return;}
    let requested=false;try{requested=sessionStorage.getItem('jhp_login_seat')==='1'}catch(e){}if(!requested||seating)return;seating=true;
    const start=Date.now();(function enter(){
      if(blocked||!Net.me.member){seating=false;return}
      if (window.StorySnapshot && !window.StoryAccess?.available) {
        sessionStorage.removeItem('jhp_login_seat'); seating=false; return;
      }
      const h=window.House;
      if(h?.live&&['monitor','pcboot'].includes(h.mode)){try{sessionStorage.removeItem('jhp_login_seat')}catch(e){}seating=false;return}
      if(h?.live&&!h.busy&&window.HousePause?.canBack&&h.mode!=='walk')HousePause.quickBack();
      if(h?.live&&h.mode==='walk'&&!h.busy&&!document.querySelector('.hs-loading')){if(h.held())h.putBack();h.act('pc')}
      if(Date.now()-start<60000)setTimeout(enter,100);else seating=false;
    })();
  }
  Net.on('welcome',m=>{pending=false;if(m.member){Net.store.set('jhp_logon_seen','1');if(owner().toLowerCase()===m.nick.toLowerCase())unlock();else loading()}else{blocked=true;if(!panel.querySelector('form'))show();else{ready();status('Connected to JackNet. Ready when you are.');}}});
  Net.on('loginOk',()=>{Net.store.set('jhp_logon_seen','1');loading();});
  Net.on('meOk',()=>{pending=false;if(settingsReady)unlock()});
  Net.on('meErr',m=>{ready();if(identityStep)fieldError('first',m.msg);});
  Net.on('rmSame',unlock);Net.on('rmNone',m=>{if(m.guest)return;setTimeout(()=>{if(initialOwner&&initialOwner.toLowerCase()!==Net.me.nick.toLowerCase())location.reload();else unlock()},0)});
  Net.on('loginErr',m=>{ready();try{sessionStorage.removeItem('jhp_login_seat');}catch(e){}const f=panel.querySelector('form');if(!f)return;
    const field=/first name|hyphen|apostrophe|Boy or Girl/i.test(m.msg)&&f.elements.first?'first':/password/i.test(m.msg)?'password':/name|account.*not found/i.test(m.msg)?'name':null;
    if(field)fieldError(field,m.msg);else status(m.msg,true);
    const suggestion=f.querySelector('[data-suggestion]');if(suggestion&&typeof m.suggestion==='string'&&/^[A-Za-z0-9_-]{3,16}$/.test(m.suggestion)){suggestion.hidden=false;suggestion.textContent='Use '+m.suggestion;suggestion.onclick=()=>{f.elements.name.value=m.suggestion;suggestion.hidden=true;clearErrors();f.elements.name.focus();};}
  });
  Net.on('you',m=>{if(!m.member){pending=false;blocked=true;settingsReady=false;draft=null;creating=false;show('You have logged off. Log on to continue.')}});
  Net.on('_close',()=>{ready();if(panel.querySelector('form'))status('Connection lost. Your details are kept here. JackNet is reconnecting...');else if(blocked)loading('Connection lost while reading your saves. Reconnecting...');});
  for(const type of ['rmErr','rmBusy'])Net.on(type,m=>{if(blocked)loading(m.msg||'JackNet could not load your settings. Your saves are safe. Please retry.')});
  // Form controls keep their native behavior; game handlers below the gate never receive their events.
  for(const type of ['keydown','keyup','pointerdown','pointerup','click','wheel'])panel.addEventListener(type,ev=>ev.stopPropagation());
  // Capture before the house/desktop handlers, including body-targeted keys.
  for(const type of ['keydown','keyup','pointerdown','pointerup','click','wheel'])window.addEventListener(type,ev=>{
    if(!blocked)return;
    if(type==='keydown'&&ev.key==='Tab'){
      const fields=[...panel.querySelectorAll('input,button,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
      ev.preventDefault();ev.stopImmediatePropagation();if(fields.length){const i=fields.indexOf(document.activeElement),n=ev.shiftKey?(i<=0?fields.length-1:i-1):(i+1)%fields.length;fields[n].focus()}return;
    }
    if(!panel.contains(ev.target)||['Escape','F2','F9'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation()}
  },{capture:true,passive:false});
  if(Net.store.get('jhp_token'))loading('Connecting to JackNet to resume your game...');else show('Connecting to JackNet...');
})();

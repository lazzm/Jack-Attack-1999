/* A JackNet identity is required before entering the game. No guest bypass. */
(function(){
  'use strict';
  if(window.PCOnly?.blocked){window.AccountGate={allowed:false,blocked:true};return;}
  const root=document.documentElement, panel=document.createElement('div');panel.id='accountGate';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','JackNet account');
  let creating=false,pending=false,blocked=true,signup=null,identityStep=false,settingsReady=false;
  let draft=null;
  const owner=()=>{try{return localStorage.getItem('jhp_roam_who')||''}catch(e){return ''}};
  const initialOwner=owner();
  window.AccountGate={get allowed(){return !!(window.Net&&Net.me.member)&&!blocked;},get blocked(){return blocked;},show(){if(pending)return;creating=true;show()},profile(el){panel.replaceChildren(el);el.style.position='relative';el.style.left=el.style.top='auto';el.style.maxWidth='100%';}};
  function pause(){if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}if(window.House&&House.emit)House.emit('loading',true)}
  function loading(note){settingsReady=false;identityStep=false;blocked=true;pause();root.classList.add('account-required');if(!panel.isConnected)root.appendChild(panel);panel.textContent=typeof note==='string'?note:'Loading your JackNet settings...';if(typeof note==='string'){const retry=document.createElement('button');retry.type='button';retry.textContent='Retry';retry.addEventListener('click',()=>location.reload());panel.appendChild(retry)}}
  function show(note){
    if(Net.me.member)return;
    identityStep=false;signup=null;
    pause();
    root.classList.add('account-required');if(!panel.isConnected)root.appendChild(panel);
    panel.innerHTML='<form class="account-box"><h1>Welcome to JackNet</h1><p class="account-intro"></p><label>User name<input name="name" autocomplete="username" minlength="3" maxlength="16" required></label><label>Password<input name="password" type="password" minlength="4" maxlength="64" required></label>'+(creating?'<label>Confirm password<input name="confirm" type="password" minlength="4" maxlength="64" autocomplete="new-password" required></label>':'')+'<p class="account-error" role="status"></p><div class="account-buttons"><button type="submit"></button><button type="button" data-switch></button></div><small>Free game account. No real name, email or real money needed.</small></form>';
    panel.querySelector('h1').textContent=creating?'Create a JackNet Account':'Log On to JackNet';
    panel.querySelector('.account-intro').textContent=creating?'Choose a user name for your JackNet account.':'Log on to resume your room and saved games.';
    panel.querySelector('[name=password]').autocomplete=creating?'new-password':'current-password';
    panel.querySelector('[type=submit]').textContent=creating?'Next >':'Log On';panel.querySelector('[data-switch]').textContent=creating?'Back to Log On':'Create Account';
    panel.querySelector('.account-error').textContent=note||'';
    panel.querySelector('[data-switch]').addEventListener('click',()=>{if(!pending){creating=!creating;show()}});
    panel.querySelector('form').addEventListener('submit',ev=>{
      ev.preventDefault();if(pending)return;
      const f=ev.target,name=f.elements.name.value.trim(),pass=f.elements.password.value,err=panel.querySelector('.account-error');
      if(!/^[A-Za-z0-9_-]{3,16}$/.test(name)){err.textContent='Use 3 to 16 letters, numbers, underscores or hyphens.';return;}
      if(creating&&pass!==f.elements.confirm.value){err.textContent='The passwords do not match.';return;}
      if(!Net.connected||!Net.me.id){err.textContent='JackNet is connecting. Please try again in a moment.';return;}
      if(creating){signup={name,pass};showIdentity();return;}
      if(!Net.send({t:'login',name,pass,signup:false}))return;
      try{sessionStorage.setItem('jhp_login_seat','1')}catch(e){}
      pending=true;f.querySelectorAll('button').forEach(b=>b.disabled=true);err.textContent='Verifying your account...';
    });
    panel.querySelector('[name=name]').focus();
  }
  function showIdentity(note){
    identityStep=true;blocked=true;pause();root.classList.add('account-required');if(!panel.isConnected)root.appendChild(panel);
    if(!draft)draft={first:Cast.randomFirst('m'),g:'m',auto:true};
    panel.innerHTML='<form class="account-box account-identity"><h1>JackNet - About You</h1><p class="account-intro">Your house, your family, your adventure.</p><label for="accountFirst">What&#39;s your first name?</label><div class="account-name-row"><input id="accountFirst" name="first" autocomplete="off" autocapitalize="words" spellcheck="false" minlength="2" maxlength="14" required aria-describedby="accountNameHelp"><button type="button" data-roll aria-label="Roll a random first name" title="Roll a random first name">&#9860;</button></div><small id="accountNameHelp">A made-up name is fine. Click/press the die for another.</small><fieldset><legend>I am a...</legend><label><input type="radio" name="gender" value="m" required> Boy</label><label><input type="radio" name="gender" value="f" required> Girl</label></fieldset><p class="account-error" role="status"></p><div class="account-buttons"><button type="submit"></button>'+(signup?'<button type="button" data-back>&lt; Back</button>':'')+'</div><small>This is your character in the house. Your JackNet user name stays the same.</small></form>';
    const f=panel.querySelector('form'),first=f.elements.first;
    first.value=draft.first;f.querySelector('[value='+draft.g+']').checked=true;
    const remember=()=>{draft={first:first.value,g:f.elements.gender.value,auto:draft.auto}};
    f.addEventListener('input',ev=>{
      if(ev.target===first)draft.auto=false;
      else if(ev.target.name==='gender'&&draft.auto)first.value=Cast.randomFirst(f.elements.gender.value);
      remember();
    });
    f.querySelector('[data-roll]').addEventListener('click',()=>{first.value=Cast.randomFirst(f.elements.gender.value);draft.auto=true;remember();first.focus();first.select()});
    f.querySelector('[data-back]')?.addEventListener('click',()=>{if(!pending){remember();const previous=signup;show();panel.querySelector('[name=name]').value=previous.name;panel.querySelector('[name=password]').value=previous.pass;panel.querySelector('[name=confirm]').value=previous.pass}});
    f.querySelector('[type=submit]').textContent=signup?'Create Account':'Continue';
    f.querySelector('.account-error').textContent=note||'';
    f.addEventListener('submit',ev=>{
      ev.preventDefault();if(pending)return;remember();
      const err=f.querySelector('.account-error');
      if(!/^[A-Za-z]+(?:[-'][A-Za-z]+)?$/.test(draft.first)||draft.first.length<2||draft.first.length>14){err.textContent="Use 2 to 14 letters, with at most one hyphen or apostrophe.";return;}
      if(!Net.connected){err.textContent='JackNet is connecting. Please try again in a moment.';return;}
      const me={first:draft.first,g:draft.g};
      if(!Net.send(signup?{t:'login',...signup,signup:true,me}:{t:'meSet',me}))return;
      if(signup)try{sessionStorage.setItem('jhp_login_seat','1')}catch(e){}
      pending=true;f.querySelectorAll('input,button').forEach(el=>el.disabled=true);err.textContent='Saving your character...';
    });
    first.focus();first.select();
  }
  function unlock(){settingsReady=true;pending=false;if(!Net.me.identity){if(!identityStep)showIdentity();return;}identityStep=false;signup=null;draft=null;blocked=false;panel.remove();root.classList.remove('account-required');if(window.House&&House.emit)House.emit('loading',!!document.querySelector('.hs-loading'));seatAfterLogin()}
  let seating=false;
  function seatAfterLogin(){
    if(window.PCOnly?.desktopOnly){try{sessionStorage.removeItem('jhp_login_seat')}catch(e){}return;}
    let requested=false;try{requested=sessionStorage.getItem('jhp_login_seat')==='1'}catch(e){}if(!requested||seating)return;seating=true;
    const start=Date.now();(function enter(){
      if(blocked||!Net.me.member){seating=false;return}
      const h=window.House;
      if(h?.live&&['monitor','pcboot'].includes(h.mode)){try{sessionStorage.removeItem('jhp_login_seat')}catch(e){}seating=false;return}
      if(h?.live&&!h.busy&&window.HousePause?.canBack&&h.mode!=='walk')HousePause.quickBack();
      if(h?.live&&h.mode==='walk'&&!h.busy&&!document.querySelector('.hs-loading')){if(h.held())h.putBack();h.act('pc')}
      if(Date.now()-start<60000)setTimeout(enter,100);else seating=false;
    })();
  }
  Net.on('welcome',m=>{pending=false;if(m.member){if(owner().toLowerCase()===m.nick.toLowerCase())unlock();else loading()}else{blocked=true;show()}});
  Net.on('loginOk',()=>{signup=null;loading()});
  Net.on('meOk',()=>{pending=false;if(settingsReady)unlock()});
  Net.on('meErr',m=>{pending=false;if(identityStep)showIdentity(m.msg)});
  Net.on('rmSame',unlock);Net.on('rmNone',m=>{if(m.guest)return;setTimeout(()=>{if(initialOwner&&initialOwner.toLowerCase()!==Net.me.nick.toLowerCase())location.reload();else unlock()},0)});
  Net.on('loginErr',m=>{pending=false;try{sessionStorage.removeItem('jhp_login_seat')}catch(e){}const f=panel.querySelector('form');if(f){panel.querySelector('.account-error').textContent=m.msg;f.querySelectorAll('input,button').forEach(b=>b.disabled=false)}});
  Net.on('you',m=>{if(!m.member){pending=false;blocked=true;settingsReady=false;draft=null;show('You have logged off. Log on to continue.')}});
  Net.on('_close',()=>{pending=false;if(!Net.me.member)show('JackNet is disconnected. Your existing account and saves are safe. Reconnecting...');else if(blocked)loading('Connection lost while loading your settings. Reconnecting...')});
  for(const type of ['rmErr','rmBusy'])Net.on(type,m=>{if(blocked)loading(m.msg||'JackNet could not load your settings. Your saves are safe. Please retry.')});
  // Capture before the house/desktop handlers, including body-targeted keys.
  for(const type of ['keydown','keyup','pointerdown','pointerup','click','wheel'])window.addEventListener(type,ev=>{
    if(!blocked)return;
    if(type==='keydown'&&ev.key==='Tab'){
      const fields=[...panel.querySelectorAll('input,button,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
      ev.preventDefault();ev.stopImmediatePropagation();if(fields.length){const i=fields.indexOf(document.activeElement),n=ev.shiftKey?(i<=0?fields.length-1:i-1):(i+1)%fields.length;fields[n].focus()}return;
    }
    if(!panel.contains(ev.target)||['Escape','F2','F9'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation()}
  },{capture:true,passive:false});
  show('Connecting to JackNet...');
})();

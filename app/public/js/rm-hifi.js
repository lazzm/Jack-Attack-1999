/* Physical bedroom CD player. Uses existing owned PM discs and the house snap
 * system; never calls PM.insert, Discs.insert, autorun, or a console runtime. */
(function () {
  'use strict';
  if (window.RoomHiFi) return;
  let player = null;
  window.RoomHiFi = { init, use:()=>player?.use(), eject:()=>player?.eject(), stop:()=>player?.stop(), next:()=>player?.next(), get state(){return player?.state} };
  function init(model) {
    if (player) return player;
    const R = window.Room, H = R.House, T = R.T, K = R.K, M = K.mat;
    const {root, tray, lcd, slot} = model, KEY = 'jhp_hifi';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    try { const modern = window.Apps?.loadGame?.('room.hifi', 1); if (modern && (+modern.savedAt || 0) >= (+saved.savedAt || 0)) saved = modern; } catch (e) {}
    const st = {disc: typeof saved.disc === 'string' ? saved.disc : null, open: !!saved.open, playing: !!saved.playing, track: Math.max(0, Math.min(2, saved.track | 0))};
    let inFlight = null, restoring = true, lastDisplay = '', lastTick = 0, soundStarted = false;
    const item = t => t && t.kind === 'disc' && t.id.startsWith('pmd.') ? window.PM?.item(t.id.slice(4)) : null;
    const audio = t => { const it = item(t); return !!it && ['gubbinz','mix'].includes(it.audio) && !!window.PM?.owns(it.id); };
    const current = () => st.disc && H.THINGS[st.disc];
    const ownMusic = () => window.Sound?.music?.playing?.startsWith('room_hifi_');
    const persist = () => {
      const snapshot = {...st, inserting:!!inFlight, savedAt: Date.now()};
      try { localStorage.setItem(KEY, JSON.stringify(snapshot)); } catch (e) {}
      try { window.Apps?.saveGame?.('room.hifi', snapshot, {v:1}); } catch (e) {}
    };
    // Original little instrumental arrangements, independent of PC software.
    const tunes = {
      gubbinz: {lead:[72,76,79,84,79,-1,76,0,74,77,81,86,81,-1,77,0,76,79,83,88,83,79,76,0,74,71,67,71,72,-1,-1,0],bass:[48,55,48,55,50,57,50,57,52,59,52,59,43,50,48,48],step:.145},
      mix: {lead:[69,-1,72,76,79,-1,76,72,67,-1,71,74,77,-1,74,71,65,-1,69,72,76,-1,72,69,64,67,71,74,72,-1,69,0],bass:[45,52,45,52,43,50,43,50,41,48,41,48,40,47,45,45],step:.18}
    };
    function tuneName() { const it = item(current()); return it ? 'room_hifi_' + it.audio + '_' + st.track : ''; }
    function startSound() {
      if (!st.playing || st.open || !audio(current()) || !window.Sound?.music || !Sound.addTune) return;
      const name = tuneName(), src = tunes[item(current()).audio];
      if (!src) return;
      Sound.addTune(name, {...src, lead: src.lead.map(n => n > 0 ? n + [0,5,-3][st.track] : n), hats: st.track !== 2});
      Sound.music.play(name); soundStarted = !!Sound.ready;
    }
    function stopSound() { if (ownMusic()) Sound.music.stop(); soundStarted = false; }
    function display() {
      const text = st.open ? 'OPEN' : !st.disc ? 'NO DISC' : (st.playing ? 'PLAY ' : 'STOP ') + String(st.track+1).padStart(2,'0');
      if (text === lastDisplay) return;
      lastDisplay = text; const g = lcd.userData.g;
      g.fillStyle = '#102d28'; g.fillRect(0,0,384,80); g.fillStyle = '#99e8ba'; g.font = 'bold 42px monospace';g.textAlign='center';g.fillText(text,192,55);
      lcd.needsUpdate = true; H.dirty();
    }
    function fitDisc(t) {
      t.st='snap';t.snap=slot.id;t.rx=t.rz=0;t.at={room:'bedroom',...slot.pose,hide:!st.open};
      t.obj.userData.ensure?.();H.place(t);H.layerFor(t);
    }
    function setTray(open) {
      if (inFlight) { R.toast('Hi-fi','Let the disc settle on the tray first.'); return; }
      st.open=!!open;
      if(st.open){st.playing=false;stopSound()}
      const t=current();if(t)fitDisc(t);
      const from=tray.position.z,to=st.open?19:0,t0=performance.now();
      H.anims.set('hifi.tray',now=>{
        const f=Math.min(1,(now-t0)/400),k=f*f*(3-2*f);tray.position.z=from+(to-from)*k;
        if(t&&t.snap===slot.id&&st.open){t.obj.position.x=root.position.x+3+tray.position.z;H.dirty()}
        return f<1;
      });
      H.saveThings();persist();display();
    }
    function eject() {
      if (H.held()) { R.toast('Hi-fi','Place what you are carrying first.'); return; }
      if(inFlight)return;
      const t=current();
      if(!t){setTray(!st.open);return}
      // Open / Close with F; E or a click also takes the revealed physical disc.
      if(!st.open)setTray(true);
      H.anims.delete('hifi.tray');tray.position.z=19;fitDisc(t);
      H.grab(t.id);H.saveThings(true);
    }
    function use() {
      if(inFlight)return;
      if(st.disc&&!current()){R.toast('Hi-fi','Please wait for your physical media to finish loading.');return}
      if(!st.disc){setTray(true);R.say('Hi-fi','NO DISC. Open an owned audio CD case on the wooden games shelf, take its disc with E, then E / Click places it on this open tray. F on Play starts it. CD-ROMs and console games do not play here.',8000);return}
      if(st.open){H.anims.delete('hifi.tray');tray.position.z=0;st.open=false;fitDisc(current())}
      st.playing=!st.playing;
      if(st.playing){startSound();R._.secret('hs.hifi');R.say('Hi-fi',R._.esc(item(current()).title)+' — Track '+(st.track+1)+(window.Sound?.musicOn?'':' (music is muted; enable Music in the sound controls).'),5000)}else stopSound();
      H.saveThings();persist();display();
    }
    function stop() {st.playing=false;stopSound();persist();display()}
    function next() { if(!st.disc)return R.toast('Hi-fi','NO DISC');st.track=(st.track+1)%3;if(st.playing)startSound();persist();display() }
    function button(id,x,y,w,h,action,remove,label,round) {
      const g=new T.Group();root.add(g);const B=K.into(g);
      if(round)B.cyl(x,y,13.1,w/2,w/2,1.1,20,M({c:'#b4b9be',sh:64,sp:'#888'}),{rx:90});
      else B.rbox(x,y,13,w,h,1,.25,M({c:'#acb2b9',sh:45}));
      const spot=H.spot(id,{obj:g,label,act:action,range:210,room:'bedroom',wrapped:1});if(remove)spot.remove=remove;
      return g;
    }
    const playButton=button('hifi.play',-5.1,-5.7,7,2.3,use,null,'Hi-fi — F / Click: play / pause');
    const PB=K.into(playButton),triangle=new T.Shape();triangle.moveTo(-.7,-.9);triangle.lineTo(1,0);triangle.lineTo(-.7,.9);triangle.closePath();const glyph=PB.geo(new T.ExtrudeGeometry(triangle,{depth:.15,bevelEnabled:false}),-5.1,-5.7,13.55,M('#22352b'));glyph.userData.noPick=true;
    button('hifi.eject',5.2,-5.7,7,2.3,()=>setTray(!st.open),eject,()=>st.disc?'Hi-fi — F: open / close; E / Click: take CD':'Hi-fi — F / Click: open / close tray');
    button('hifi.stop',-6,-1.9,4,1.8,stop,null,'Hi-fi — F / Click: stop');
    button('hifi.next',.1,-1.9,4,1.8,next,null,'Hi-fi — F / Click: next track');
    button('hifi.volume',6.3,-2,3,3,()=>{
      if(!window.Sound)return;
      const v=Sound.volume>=.95?.25:Math.min(1,Sound.volume+.25);Sound.setVolume(v);
      R.toast('Hi-fi','Volume '+Math.round(v*10)+' / 10'+(!Sound.musicOn?' — Music is muted in sound controls.':''));
    },null,'Hi-fi — F / Click: adjust volume',true);
    H.spot('hifi.tray',{obj:tray,label:()=>st.disc?'CD tray — E / Click: remove disc':'CD tray — E / Click: place an audio CD',range:210,room:'bedroom',act:()=>setTray(!st.open),remove:eject,wrapped:1});
    H.SPOTS.hifi.act=use;
    slot.accepts=(kind,t)=>audio(t);
    slot.enabled=()=>st.open&&!st.disc&&!inFlight&&tray.position.z>18.9;
    slot.onBegin=t=>{
      if(!audio(t)||st.disc)return false;
      inFlight=t.id;st.disc=t.id;st.playing=false;st.track=0;
      // Persist the destination before the engine starts its 380ms glide. A
      // refresh during insertion can then restore this same owned object.
      t.at={room:'bedroom',...slot.pose,hide:false};t.st='snap';t.snap=slot.id;
      H.saveThings(true);persist();return true;
    };
    slot.onSnap=t=>{inFlight=null;st.disc=t.id;fitDisc(t);persist();display();R.toast('Hi-fi','Disc on the tray. F on Play closes it and starts the music.');};
    slot.onUnsnap=()=>{inFlight=null;st.disc=null;st.playing=false;stopSound();persist();display();};
    // Disc IDs are shared with PMGL, but this slot emits no PC drive event.
    H.on('tidy',rid=>{if(rid&&rid!=='bedroom')return;inFlight=null;st.disc=null;st.playing=false;stopSound();setTray(false)});
    function reconcile() {
      if(restoring){
        if(!window.PMGL?.built)return;
        restoring=false;
        const snapped=Object.values(H.THINGS).find(t=>t.st==='snap'&&t.snap===slot.id&&audio(t));
        // A normal restore follows the native snap record. Only an
        // interrupted insertion may recover from an unsnapped animation pose;
        // a stale player save must not take a CD back out of its case.
        const wanted=snapped||(saved.inserting?current():null);
        if(wanted&&audio(wanted)&&H.held()!==wanted.id&&!(R.drive('cd')?.thing===wanted.id)&&(!wanted.snap||wanted.snap===slot.id)){
          st.disc=wanted.id;tray.position.z=st.open?19:0;fitDisc(wanted);
          if(st.playing&&!st.open)startSound();
        }else{st.disc=null;st.playing=false}
        persist();display();
      }
      const t=current();
      // PMGL's F "return to case" and external tidy paths may move a disc
      // directly rather than invoking the slot's onUnsnap callback.
      if(t&&!inFlight&&(t.snap!==slot.id||t.st!=='snap'))slot.onUnsnap();
    }
    H.ambient.add(now=>{if(now-lastTick<250)return;lastTick=now;reconcile()});
    document.addEventListener('audiochange',()=>{if(st.playing&&!soundStarted&&Sound.musicOn)startSound()});
    document.addEventListener('pointerdown',()=>{if(st.playing&&!soundStarted)startSound()},{passive:true});
    document.addEventListener('keydown',()=>{if(st.playing&&!soundStarted)startSound()});
    tray.position.z=st.open?19:0;display();
    player={use,eject,stop,next,get state(){return {...st}},accepts:audio};
    reconcile();return player;
  }
})();

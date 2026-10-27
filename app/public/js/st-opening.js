/* Dad's office hand-me-down. Server ticks own assembly; the grab API owns the journey. */
(function () {
  'use strict';
  if (window.PCOnly?.desktopOnly) return;
  const H = window.House, R = window.Room, st = window.st;
  if (!H?.ok || !R || !st) return;
  const T = H.T, K = H.K, M = K.mat;
  const names = { tower: 'beige tower', monitor: 'heavy CRT monitor', keys: 'keyboard and mouse', speakers: 'speakers' };
  const poses = { tower: [17, 0, -30], monitor: [-15, 0, 0], keys: [-15, 0, 11.5], speakers: [48, 0, -29] };
  let built = false, dust, ports = {}, cables = {}, installing = false, installDone = false;
  let pickupRoom = null;
  const state = () => st.getState();
  const active = () => state() && !state().flags.veteran;
  function speakers() {
    const g = new T.Group(), B = K.into(g);
    for (const x of [-6, 6]) {
      B.rbox(x, -9, 0, 9, 18, 10, .7, M({c:'#ded6bc',sh:18}));
      B.rbox(x, -9.5, 5.1, 7, 13, .5, .4, M('#605b51'));
      B.cyl(x, -10, 5.5, 2.8, 2.8, .5, 20, M('#3e3e39'), {rx:90});
      B.cyl(x, -10, 5.85, 1.1, 1.1, .3, 16, M('#777567'), {rx:90});
      B.cyl(x, -2.5, 5.3, .65, .65, .8, 14, M('#c4bba2'), {rx:90});
      B.shadow(x,0,0,11,12,.4,{sq:true});
    }
    return g;
  }
  function build() {
    if (built || !active() || !H.pcGL?.userData.parts || !H.ROOMS.drive?.carBoot) return;
    built = true;
    const B = K.into(H.ROOMS.bedroom.group);
    dust = new T.Group(); H.ROOMS.bedroom.group.add(dust);
    const D = K.into(dust), dm = M({c:'#c6b99a',o:.19,tr:true});
    // Thin dusty edges and a real cable grommet leave the desktop invitingly empty.
    for (const [x,z,w,d] of [[-15,-8,38,28],[17,-30,22,36]]) {
      for (const side of [-1,1]) { D.box(x+side*w/2,-.025,z,.35,.04,d,dm); D.box(x,-.025,z+side*d/2,w,.04,.35,dm); }
    }
    D.cyl(65,-.12,-44,2.3,2.3,.25,24,M('#3c3830'));
    D.cyl(65,-.3,-44,1.6,1.6,.14,24,M('#181b1a'));
    for (const [i, part] of Object.keys(names).entries()) {
      const [x,y,z] = poses[part], obj = part === 'speakers' ? speakers() : new T.Group();
      if (part !== 'speakers') {
        const copy = H.pcGL.userData.parts[part].clone(true);
        copy.position.set(-x,-y,-z); obj.add(copy);
        obj.traverse(o => {o.userData.noPick=false;});
      }
      const cf = H.ROOMS.drive.carFrame, home = {room:'drive', x:cf.x+[-50,0,48,50][i]*cf.s,y:cf.y-23*cf.s,z:cf.z+[-158,-158,-146,-185][i]*cf.s,ry:180}; // in the boot, on Dad's rug
      const id = 'st.pc.'+part, snap = 'st.desk.'+part;
      R.addSnap(snap,{room:'bedroom',x,y,z,r:65,box:part==='monitor'?[40,2,30]:part==='tower'?[23,2,37]:[32,2,14],pose:{room:'bedroom',x,y,z,ry:0},
        enabled:()=>!state()?.done['part.'+part],accepts:(_k,t)=>t.id===id,hint:'E: set down the '+names[part],
        onSnap:()=>{Sound.play('heavy');st.event('part.'+part);}});
      R.grabbable(id,{obj,kind:'story-pc',label:names[part],home,holdD:65,holdOffset:{right:27,down:16},walkScale:part==='monitor'?.48:.85,
        canGrab:()=>active()&&!state().done['part.'+part]&&!!state().done.boot&&(H.THINGS[id]?.at.room!=='drive'||H.ROOMS.drive.carBoot.open),
        use:()=>st.say('st.carry.'+part,'Dad',state()?.done['part.'+part]?'Plug in the marked leads, then press the power button.':'E carries it. Take it to the marked place on your desk. Q puts it back safely.'),useLabel:'Carry upstairs'});
    }
    for (const [i,lead] of ['power','video','keyboard'].entries()) {
      const g = new T.Group(), P = K.into(g), x=28,y=-9-i*8,z=-23;
      // Accessible loose connectors on the desk edge, with pins and a coiled lead.
      P.box(0,0,0,1,5,7,M('#918b7e'));
      P.box(1.2,0,0,2,3,5,M(['#4b4740','#55667d','#7b6683'][i]));
      for(const dz of [-1.5,0,1.5])P.box(2.4,0,dz,.6,1,.4,M('#c4bba2'));
      P.geo(new T.TorusGeometry(2.2,.25,6,24),3,0,-6,M('#45413a'),{ry:90});
      const path = lead==='power'?[[31,y,z],[33,-1,-44],[65,-1,-44],[65,16,-48]]:lead==='video'?[[31,y,z],[34,-1,-46],[-15,-3,-25]]:[[31,y,z],[36,-1,-48],[-35,-1,-48],[-31,-1,10]];
      cables[lead]=new T.Group();H.ROOMS.bedroom.group.add(cables[lead]);
      const mounted=g.clone(true);mounted.position.set(x,y,z);cables[lead].add(mounted);
      K.into(cables[lead]).geo(new T.TubeGeometry(new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p))),20,.28,6,false),0,0,0,M('#49463e'));
      ports[lead]=R.addSpot('st.lead.'+lead,{mesh:g,x,y,z,room:'bedroom',label:'F: plug in '+lead+' lead',range:150,act:()=>{
        if(!state() || state().done['lead.'+lead] || !StoryCat.ready(state(), StoryCat.byId['lead.'+lead]))return;
        Sound.play('plug');st.event('lead.'+lead);
      }}).obj;
    }
    const cf=H.ROOMS.drive.carFrame;
    R.addSpot('st.boot',{room:'drive',x:cf.x,y:cf.y-79*cf.s,z:cf.z-170*cf.s,w:152*cf.s,h:10,d:79*cf.s,col:'#6a1a2a',label:'F: open / close the boot',range:185,act:()=>{
      if(!state()?.done.dad)return;
      H.ROOMS.drive.carBoot.toggle();if(H.ROOMS.drive.carBoot.open)st.event('boot');sync();
    }}).obj.visible=false; // pick volume only; the hinged lid is the visible model
    // Invisible pick volumes are ignored by the raycaster; use a real handle instead.
    const handle=R.addSpot('st.boot.handle',{room:'drive',x:cf.x,y:cf.y-79*cf.s,z:cf.z-199*cf.s,w:14,h:3,d:2,col:'#a3a6a8',label:'F: open / close the boot',range:185,act:()=>H.act('st.boot')});
    H.SPOTS['st.boot'].obj=handle.obj;
    H.ROOMS.drive.carBoot.hinge.attach(handle.obj);
    H.spot('st.boot',{obj:H.ROOMS.drive.carBoot.hinge});
    H.on('grab',id=>{if(id.startsWith('st.pc.'))pickupRoom=H.THINGS[id].at.room;});
    H.on('room',()=>{const t=H.THINGS[H.held()];if(t?.kind==='story-pc')t.at.room=pickupRoom||'drive';});
    H.on('pcpower',on=>{if(on)Sound.play('pcfan');});
    sync();
  }
  function fixed(t, pose, snap) {
    if (H.held()===t.id) H.putBack();
    H.anims.delete('snap:'+t.id);
    t.st='snap';t.snap=snap;t.at={...pose,hide:false};t.home={...pose,snap};t.rx=t.rz=0;
    const parent=H.ROOMS.bedroom.things;if(t.obj.parent!==parent)parent.add(t.obj);
    t.obj.position.set(pose.x,pose.y,pose.z);t.obj.rotation.set(0,0,0);
  }
  function sync() {
    if(!built)return;
    const p=state(), owned=!!(p?.flags.pcOwned||p?.flags.veteran), ready=Object.keys(names).every(part=>p?.done['part.'+part]);
    if(p?.done.dad&&!p.done.boot&&H.ROOMS.drive.carBoot.open)st.event('boot');
    dust.visible=!owned;
    const station=H.ROOMS.bedroom.stations.find(s=>s.id==='desk');if(station)station.n=owned?'The PC':'My desk';
    if(!owned)H.pcGL.visible=false;
    for(const part of Object.keys(names)) {
      const t=H.THINGS['st.pc.'+part], placed=!!p?.done['part.'+part];
      if(!placed&&t.st==='snap'&&t.snap==='st.desk.'+part)st.event('part.'+part);
      if(placed){const [x,y,z]=poses[part];fixed(t,{room:'bedroom',x,y,z,ry:0},'st.desk.'+part);}
      const show=part==='speakers'?placed||!!p?.done.dad&&!owned:!owned&&(placed||!!p?.done.dad);
      t.obj.visible=show&&(placed||H.held()===t.id||H.ROOMS.drive.carBoot.open);
      t.at.hide=!t.obj.visible;
      t.obj.traverse(o=>{o.userData.noPick=!show||placed;});
    }
    for(const [lead,obj] of Object.entries(ports)){obj.visible=ready&&!p?.done['lead.'+lead]&&!owned;cables[lead].visible=!!p?.done['lead.'+lead];}
    for(const id of ['pc','pc.power','pc.tower','pc.fdd','pc.cdej','pc.cdtray'])H.SPOTS[id]?.obj?.traverse(o=>{o.userData.noPick=!owned;});
    if(owned&&H.mode==='walk')H.pcGL.visible=true;
    enablePower();H.dirty();
  }
  async function prepare() {
    if(!active())return;
    await R.ensureHouse();H.buildRoom(H.ROOMS.drive);build();
  }
  const oldPower=H.SPOTS['pc.power']?.act;
  if(oldPower)H.SPOTS['pc.power'].act=()=>{
    if(state()&&!state().done.power&&StoryCat.ready(state(),StoryCat.byId.power)) {st.event('power');return;}
    if(window.StoryAccess.available)oldPower();
  };
  // Before ownership the actual tower button belongs to the carried tower.
  // Its F action becomes power once all leads have been connected.
  function enablePower(){const t=H.THINGS['st.pc.tower'];if(t&&state()&&!state().done.power&&StoryCat.ready(state(),StoryCat.byId.power)){
    t.use=()=>st.event('power');
    t.obj.traverse(o=>{o.userData.noPick=false;});
  }}
  st.onChange(p=>{
    if(!p)return;
    if(!built)prepare();else sync();enablePower();
    if(p.done.power&&!p.done.install&&H.mode==='walk') {
      // Authoritative ack first, then the normal BIOS and monitor camera.
      document.getElementById('bootPower').querySelector('.powerbtn').click();
    }
  });
  function needsInstall(){return active()&&!!state().done.power&&!state().done.install&&!installDone;}
  function install(done){
    if(installing)return;installing=true;
    const wait=()=>{if(!window.Setup?.recover){setTimeout(wait,100);return;}
      Setup.recover(()=>{installDone=true;installing=false;st.event('install');done();});
    };wait();
  }
  window.StoryOpening={sync,prepare,needsInstall,install,get built(){return built;}};
  setInterval(()=>{
    // Setup consumes its final button. Keep the observation until acknowledged,
    // including a dropped/rate-limited packet, instead of leaving an empty task.
    if(active()&&installDone&&!state().done.install)st.event('install');
    if(needsInstall()&&!installing&&window.JHPBoot==='wake'&&H.mode==='monitor'&&!H.gliding&&!document.querySelector('.hs-loading,#houseEntry'))install(()=>st.observe());
  },500);
  if(state())prepare();
})();

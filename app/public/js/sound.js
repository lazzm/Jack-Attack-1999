/* Sound Rumbler 16 (procedural Web Audio). Nothing plays until the visitor clicks something. */
(function () {
  let ctx = null, master = null, musicMaster = null, worldMaster = null, worldPaused = false;
  let sfxOn = false, musicOn = false, volume = 1;
  try {
    const legacy = localStorage.getItem('jhp_sfx') === '1';
    sfxOn = localStorage.getItem('jhp_audio_effects') == null ? legacy : localStorage.getItem('jhp_audio_effects') === '1';
    musicOn = localStorage.getItem('jhp_audio_music') == null ? legacy : localStorage.getItem('jhp_audio_music') === '1';
    const saved = Number(localStorage.getItem('jhp_audio_volume') ?? 1);
    volume = Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 1;
  } catch (e) {}
  const buses = new Map();
  const ready = () => typeof navigator === 'undefined' || !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function output(c, channel = 'effects') {
    let bus = buses.get(c);
    if (!bus) {
      bus = {effects:c.createGain(),music:c.createGain()}; buses.set(c,bus);
      for (const kind of ['effects','music']) { bus[kind].gain.value = volume * (kind === 'music' ? +musicOn : +sfxOn); bus[kind].connect(c.destination); }
    }
    return bus[channel === 'music' ? 'music' : 'effects'];
  }
  function changed() {
    try {
      localStorage.setItem('jhp_sfx', sfxOn || musicOn ? '1' : '0');
      localStorage.setItem('jhp_audio_effects', sfxOn ? '1' : '0');
      localStorage.setItem('jhp_audio_music', musicOn ? '1' : '0');
      localStorage.setItem('jhp_audio_volume', String(volume));
    } catch (e) {}
    for (const [c,bus] of buses) {
      if (c.state === 'closed') { buses.delete(c); continue; }
      for (const kind of ['effects','music']) {
        const gain = bus[kind].gain;
        gain.cancelScheduledValues(c.currentTime);
        gain.setTargetAtTime(volume * (kind === 'music' ? +musicOn : +sfxOn), c.currentTime, .012);
      }
    }
    if (!sfxOn || !volume) try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (sfxOn || musicOn) ac();
    document.dispatchEvent(new Event('sfxchange'));
    document.dispatchEvent(new Event('audiochange'));
  }

  function ac() {
    if (!ready()) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.25; master.connect(output(ctx));
      musicMaster = ctx.createGain(); musicMaster.gain.value = 0.25; musicMaster.connect(output(ctx,'music'));
      worldMaster = ctx.createGain(); worldMaster.gain.value = worldPaused ? 0 : 0.25; worldMaster.connect(output(ctx));
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo, channel) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol == null ? 0.3 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(channel === 'music' ? musicMaster : channel === 'world' ? worldMaster : master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, when, filterFreq, channel) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq || 1200; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(channel === 'music' ? musicMaster : channel === 'world' ? worldMaster : master);
    src.start(t);
  }

  const sfx = {
    gravel() { noise(.10,.11,0,1800); noise(.06,.06,.025,3400); },
    carboot() { tone(170,.12,'triangle',.12,0,80); noise(.45,.10,.08,650); tone(380,.3,'sine',.025,.1,460); },
    carclose() { noise(.12,.22,0,380); tone(65,.25,'sine',.22,0,32); },
    heavy() { tone(64,.23,'sine',.27,0,32); noise(.14,.14,0,380); },
    plug() { noise(.045,.18,0,2100); tone(190,.06,'triangle',.13,.035,90); },
    pcfan() { noise(3,.055,0,220); tone(82,2.5,'sine',.035,0,110); for(let i=0;i<7;i++)noise(.055,.065,.5+i*.25,1100+i*140); },
    floppy() { for(let i=0;i<12;i++){noise(.055,.09,i*.13,800+(i%3)*470);tone(110,.05,'square',.025,i*.13);} },
    click() { tone(880, 0.05, 'square', 0.15); },
    button() { tone(220, 0.08, 'square', 0.25, 0, 110); tone(660, 0.06, 'square', 0.15, 0.04); },
    turn() { noise(0.07, 0.2, 0, 2500); tone(140, 0.05, 'triangle', 0.2); },
    zap() { tone(1200 + Math.random() * 800, 0.06, 'sawtooth', 0.06, 0, 300); },
    uhoh() { tone(660, 0.12, 'sine', 0.3); tone(440, 0.22, 'sine', 0.3, 0.14); },
    join() { tone(523, 0.08, 'square', 0.12); tone(784, 0.12, 'square', 0.12, 0.08); },
    boing() { tone(180, 0.25, 'sine', 0.3, 0, 520); },
    thud() { tone(90, 0.12, 'sine', 0.35, 0, 40); noise(0.06, 0.15, 0, 400); },
    pet() { tone(988, 0.07, 'square', 0.15); tone(1319, 0.09, 'square', 0.15, 0.08); },
    dice() { for (let i = 0; i < 6; i++) noise(0.03, 0.2, i * 0.05, 3000); },
    solve() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.18, i * 0.12)); },
    waaagh() {
      // big angry ork shout: detuned saws sliding down plus noise
      for (const det of [0, 7, -5]) tone(220 + det, 1.1, 'sawtooth', 0.22, 0, 90);
      noise(1.0, 0.35, 0, 700);
      tone(55, 1.2, 'square', 0.25, 0.05, 40);
    },
    beep() { tone(1000, 0.18, 'square', 0.12); },
    crt() { tone(15000, 0.6, 'sine', 0.03, 0, 4000); noise(0.25, 0.12, 0, 300); tone(60, 0.5, 'sine', 0.25, 0, 30); },
    shutdown() { [[988, 0], [784, 0.25], [659, 0.5], [523, 0.75]].forEach(([f, t]) => tone(f, 0.9, 'triangle', 0.14, t)); tone(130.8, 1.8, 'sine', 0.2, 0.1); },
    startup() { // an original chime: a rising chord that swells and fades
      const c = ac(); if (!c) return;
      [[523, 0], [659, 0.18], [784, 0.36], [988, 0.54], [1319, 0.8]].forEach(([f, t]) => {
        const o = c.createOscillator(), g = c.createGain(), at = c.currentTime + t;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.18, at + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
        o.connect(g); g.connect(master); o.start(at); o.stop(at + 2.5);
      });
      tone(130.8, 2.6, 'sine', 0.25, 0.05);
    },
    // ---- seasonal start-up and shut-down chimes (Sound.variant picks them while the season is on)
    startup_halloween() { // a spooky organ: a minor arpeggio, a low drone and a little "wooo" on top
      [[220, 0], [261.6, 0.22], [329.6, 0.44], [440, 0.66], [415.3, 1.0]].forEach(([f, t]) => { tone(f, 1.6, 'sawtooth', 0.04, t); tone(f * 2, 1.2, 'triangle', 0.05, t); });
      tone(110, 2.8, 'sine', 0.22, 0.05); tone(880, 1.4, 'sine', 0.05, 1.3, 600);
    },
    shutdown_halloween() { [[440, 0], [349.2, 0.3], [293.7, 0.6], [220, 0.9]].forEach(([f, t]) => tone(f, 1, 'triangle', 0.13, t)); tone(700, 1.4, 'sine', 0.05, 0.4, 350); },
    startup_bonfire() { noise(0.7, 0.12, 0, 2600); tone(400, 0.7, 'sine', 0.04, 0, 1800); noise(0.25, 0.35, 0.75, 350); tone(80, 0.4, 'sine', 0.3, 0.75, 40); for (let i = 0; i < 8; i++) noise(0.03, 0.15, 1.1 + i * 0.07, 3200); [[523, 1.2], [659, 1.35], [784, 1.5]].forEach(([f, t]) => tone(f, 1.2, 'triangle', 0.1, t)); },
    shutdown_bonfire() { [[784, 0], [659, 0.25], [523, 0.5]].forEach(([f, t]) => tone(f, 0.9, 'triangle', 0.12, t)); for (let i = 0; i < 6; i++) noise(0.04, 0.08, 0.2 + i * 0.15, 2600); },
    startup_xmas() { // sleigh bells and a bright chime
      for (let i = 0; i < 10; i++) { noise(0.05, 0.1, i * 0.09, 6000); tone(2637 + (i % 3) * 200, 0.06, 'triangle', 0.03, i * 0.09); }
      [[784, 0.3], [988, 0.5], [1175, 0.7], [1568, 0.95]].forEach(([f, t]) => tone(f, 1.4, 'sine', 0.12, t)); tone(196, 2.2, 'sine', 0.2, 0.3);
    },
    shutdown_xmas() { [[1568, 0], [1175, 0.2], [988, 0.4], [784, 0.6]].forEach(([f, t]) => tone(f, 1, 'sine', 0.12, t)); for (let i = 0; i < 6; i++) noise(0.05, 0.06, 0.6 + i * 0.12, 6000); },
    startup_valentine() { [[659, 0], [784, 0.2], [988, 0.4], [1319, 0.65]].forEach(([f, t]) => tone(f, 1.4, 'sine', 0.13, t)); tone(165, 2.2, 'sine', 0.18, 0.05); },
    startup_millennium() { for (let i = 0; i < 4; i++) tone(1000 + i * 120, 0.08, 'square', 0.05, i * 0.12); [[523, 0.6], [659, 0.75], [784, 0.9], [1047, 1.1]].forEach(([f, t]) => tone(f, 1.3, 'triangle', 0.14, t)); noise(0.3, 0.2, 1.1, 1800); },
    modem() {
      const c = ac(); if (!c) return;
      // dial tone, then the number
      tone(350, 0.9, 'sine', 0.08); tone(440, 0.9, 'sine', 0.08);
      const digits = [[941, 1336], [852, 1209], [697, 1477], [770, 1336], [941, 1477], [697, 1209], [852, 1336], [770, 1209], [697, 1336], [941, 1209], [852, 1477]];
      digits.forEach((p, i) => { tone(p[0], 0.07, 'sine', 0.1, 1.0 + i * 0.1); tone(p[1], 0.07, 'sine', 0.1, 1.0 + i * 0.1); });
      let t = 1.0 + digits.length * 0.1 + 0.3;
      // ringing at the other end
      for (let r = 0; r < 2; r++) { tone(400, 0.4, 'sine', 0.06, t); tone(450, 0.4, 'sine', 0.06, t); t += 0.9; }
      // answer tone with phase-reversal clicks
      tone(2100, 1.1, 'sine', 0.09, t);
      for (let k = 0; k < 3; k++) noise(0.02, 0.06, t + 0.3 + k * 0.45, 2100);
      t += 1.2;
      // the screech: chirps, sweeps and static
      [[1200, 2400, 0.35], [2400, 900, 0.3], [980, 1180, 0.4], [1650, 1850, 0.5], [600, 3000, 0.25]].forEach(([a, b, d]) => { tone(a, d, 'square', 0.04, t, b); t += d * 0.8; });
      noise(1.6, 0.1, t, 1800); noise(1.6, 0.06, t, 3200);
      tone(1800, 1.2, 'sawtooth', 0.025, t + 0.2, 2600);
    },
  };

  // ---- the "MIDI" player: square lead, triangle bass, noise hats. Lead/bass are MIDI notes per eighth-note step;
  // 0 = rest, -1 = hold the previous note.
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const TUNES = {
    theme: { step: 0.16, hats: true,
      lead: [72, 0, 76, 79, 81, 79, 76, 72, 74, 0, 77, 81, 79, 77, 74, 71, 72, 0, 76, 79, 84, 83, 81, 79, 77, 76, 74, 72, 74, 76, 72, 0,
             69, 72, 76, 72, 77, 76, 74, 72, 71, 74, 79, 74, 77, 76, 74, 71, 72, 76, 79, 84, 83, 79, 81, 77, 79, 76, 77, 74, 72, 0, 72, 0],
      bass: [48, 48, 55, 55, 50, 50, 57, 55, 48, 48, 55, 55, 53, 53, 55, 55, 45, 45, 52, 52, 43, 43, 50, 50, 48, 48, 55, 55, 53, 55, 48, 48] },
    // Korobeiniki, the Russian folk song (public domain)
    tris: { step: 0.15, hats: false,
      lead: [76, -1, 71, 72, 74, -1, 72, 71, 69, -1, 69, 72, 76, -1, 74, 72, 71, -1, -1, 72, 74, -1, 76, -1, 72, -1, 69, -1, 69, -1, 0, 0,
             0, 74, -1, 77, 81, -1, 79, 77, 76, -1, -1, 72, 76, -1, 74, 72, 71, -1, 71, 72, 74, -1, 76, -1, 72, -1, 69, -1, 69, -1, 0, 0],
      bass: [40, 52, 40, 52, 45, 57, 45, 57, 44, 56, 40, 52, 45, 57, 45, 57, 38, 50, 38, 50, 36, 48, 36, 48, 44, 56, 40, 52, 45, 57, 45, 57] },
  };
  let musicTimer = null, step = 0, nextTime = 0, tune = TUNES.theme;
  function schedule() {
    const c = ac(); if (!c) return;
    const L = tune.lead, B = tune.bass, ST = tune.step;
    while (nextTime < c.currentTime + 0.25) {
      const when = nextTime - c.currentTime, i = step % L.length;
      if (L[i] > 0) { let len = 1; while (L[(i + len) % L.length] === -1 && len < L.length) len++; tone(N(L[i]), ST * len * 0.92, 'square', 0.09, when, null, 'music'); }
      if (step % 2 === 0) { const b = B[(step / 2) % B.length]; tone(N(b), ST * 1.8, 'triangle', 0.22, when, null, 'music'); }
      if (tune.hats && step % 2 === 1) noise(0.03, 0.05, when, 7000, 'music');
      if (step % 8 === 0) tone(60, 0.12, 'sine', 0.3, when, 35, 'music');
      nextTime += ST; step++;
    }
  }
  function addTune(name, t) { TUNES[name] = Object.assign({ step: 0.16, hats: true }, t); }
  const music = {
    playing: '',
    play(name) {
      this.stop();
      tune = TUNES[name] || TUNES.theme; this.playing = TUNES[name] ? name : 'theme';
      const c = ac(); if (!c) return;
      step = 0; nextTime = c.currentTime + 0.05;
      musicTimer = setInterval(schedule, 60); schedule();
    },
    stop() { this.playing = ''; clearInterval(musicTimer); musicTimer = null; },
  };

  // Short, original physical sounds. They share the effects/volume bus but
  // have a separate pause gain, so the menu's own buttons remain audible.
  function world(kind, o = {}) {
    if (!sfxOn || !volume || worldPaused || document.hidden) return;
    const t = (f,d,v=0.06,when=0,to,type='sine') => tone(f,d,type,v,when,to,'world');
    const n = (d,v,f,when=0) => noise(d,v,when,f,'world');
    if (kind === 'step') {
      const profiles = {carpet:[.09,.055,300],lino:[.055,.07,1050],tile:[.045,.085,1700],stairs:[.09,.08,460],paving:[.055,.075,1300],grass:[.13,.055,2300]};
      const [d,v,f] = profiles[o.surface] || profiles.carpet;
      n(d,v,f*(.92+Math.random()*.16));
      if (['lino','tile','paving','stairs'].includes(o.surface)) t(o.surface==='stairs'?95:145,.07,.045,0,65);
      if (o.surface === 'stairs' && Math.random()<.18) t(195,.16,.012,.025,145,'triangle');
    } else if (kind === 'handle') {
      const heavy=o.weight==='heavy',light=o.weight==='light';
      n(o.put?.09:.055,heavy?.09:light?.028:.055,light?2400:heavy?230:700);
      if (o.put) t(heavy?72:light?480:140,heavy?.16:.07,heavy?.12:.04,0,heavy?40:90);
    } else if (kind === 'door') {
      n(.07,.06,1800);n(.25,.025,430,.05);
      if (!o.open) {t(85,.16,.12,.28,40);n(.04,.06,1400,.3);}
      else t(175,.2,.012,.08,140,'triangle');
    } else if (kind === 'lift') { // cloth and plastic: a handheld raised from the desk or a pocket
      n(.16,.022,1500);n(.09,.018,3200,.05);t(310,.05,.012,.11,250,'triangle');
    } else if (kind === 'power') { // a slide switch, then the screen's own faint whine/hum as it comes on
      n(.012,.07,2600);t(1500,.014,.03);
      if (o.kind === 'crt') { t(15200,.5,.006,.02,15600); t(55,.35,.05,.02,48); n(.18,.02,420,.03); }
      else t(880,.06,.006,.05,1320,'triangle');
    } else if (kind === 'lockin') { n(.05,.025,2000); t(o.on?420:300,.06,.012,0,o.on?620:200,'triangle'); }
    else if (kind === 'drawer') {n(.24,.045,650);n(.055,.06,350,.22);}
    else if (kind === 'switch') {n(.015,.06,2700);t(1200,.012,.025);}
    else if (kind === 'kettle') {n(1.3,.045,800);n(1.4,.025,2400,.35);n(.025,.06,1600,1.8);}
    else if (kind === 'clock') {n(.012,.012,2100);t(o.side?1700:1450,.018,.008);}
    else if (kind === 'road') n(.7,.009,230);
    else if (kind === 'bird') {t(2450,.09,.018,0,3300);t(3100,.12,.012,.16,2200);}
  }
  window.Sound = {
    get on() { return sfxOn || musicOn; },
    set on(v) { sfxOn = musicOn = !!v; changed(); },
    get effectsOn() { return sfxOn; },
    set effectsOn(v) { sfxOn = !!v; changed(); },
    get musicOn() { return musicOn; },
    set musicOn(v) { musicOn = !!v; changed(); },
    get volume() { return volume; },
    get ready() { return ready(); },
    output,
    world,
    worldPause(on) { worldPaused=!!on; if(ctx&&worldMaster)worldMaster.gain.setTargetAtTime(on?0:.25,ctx.currentTime,.012); },
    play(name) { if (!sfxOn) return; const v = typeof window.Sound.variant === 'function' ? window.Sound.variant(name) : null, f = (v && sfx[v]) || sfx[name]; if (f) { try { f(); } catch (e) {} } },
    variant: null, // seasons-web.js: name -> seasonal variant (e.g. 'startup' -> 'startup_halloween') while a season is on
    has: name => !!sfx[name],
    setVolume(v) { if (!Number.isFinite(+v)) return; volume = Math.max(0, Math.min(1, +v)); changed(); },
    speak(utterance) { if (sfxOn && volume && window.speechSynthesis) { utterance.volume *= volume; speechSynthesis.speak(utterance); } },
    note(f, d, type) { if (sfxOn) tone(f, d || 0.25, type || 'square', 0.15); },
    music, addTune, tunes: () => Object.keys(TUNES),
    unlock: ac,
  };
  function wake() {
    if (!ready()) return;
    if (sfxOn || musicOn) ac();
    if (music.playing && !musicTimer) music.play(music.playing);
    document.dispatchEvent(new Event('audiochange'));
    document.removeEventListener('pointerdown',wake,true);document.removeEventListener('keydown',wake,true);
  }
  document.addEventListener('pointerdown',wake,true);document.addEventListener('keydown',wake,true);
})();

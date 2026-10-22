/* Sound Blaster 16 emulation (WebAudio). Nothing plays until the visitor clicks something. */
(function () {
  let ctx = null, master = null, musicMaster = null;
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
    o.connect(g); g.connect(channel === 'music' ? musicMaster : master);
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
    src.connect(f); f.connect(g); g.connect(channel === 'music' ? musicMaster : master);
    src.start(t);
  }

  const sfx = {
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
    play(name) { if (sfxOn && sfx[name]) { try { sfx[name](); } catch (e) {} } },
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

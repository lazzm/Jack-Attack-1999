/* Pod Jack Racer for JackOS 98 (lazy loaded by apps-games.js). A pseudo-3D desert pod race: two huge engines,
 * one small pilot, three laps through a canyon. Original code and art (everything drawn on canvas). */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const SEG = 200, ROAD = 2000, CAMH = 1000, DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180), DRAW = 150, LAPS = 3;
  const MAXV = SEG * 60, ACC = MAXV / 4.5, BRAKE = -MAXV, DECEL = -MAXV / 6, OFFDEC = -MAXV / 2.2, OFFMAX = MAXV / 3.5, CENT = 0.32;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIn = (a, b, p) => a + (b - a) * p * p, easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
  const TAU = Math.PI * 2;

  // ================================================================ sprites (drawn once, scaled at draw time)
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  const SPR = {};
  function spr(name) {
    if (SPR[name]) return SPR[name];
    let c;
    if (name === 'pillar' || name === 'pillar2') c = mk(120, 360, (x, w, h) => {
      const tall = name === 'pillar2';
      const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#7a3a14'); g.addColorStop(0.35, '#d0782e'); g.addColorStop(0.7, '#b05a20'); g.addColorStop(1, '#5a2a0c');
      x.fillStyle = g; x.beginPath(); x.moveTo(18, h); x.lineTo(10, h * (tall ? 0.05 : 0.3)); x.lineTo(40, h * (tall ? 0 : 0.26)); x.lineTo(90, h * (tall ? 0.02 : 0.28)); x.lineTo(112, h * (tall ? 0.08 : 0.34)); x.lineTo(104, h); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(90,30,0,.5)'; x.lineWidth = 3; for (let y = h * 0.4; y < h; y += 34) { x.beginPath(); x.moveTo(14, y); x.lineTo(108, y + 6); x.stroke(); }
      x.fillStyle = 'rgba(255,220,160,.35)'; x.fillRect(30, h * (tall ? 0.04 : 0.3), 12, h);
    });
    else if (name === 'rock') c = mk(120, 80, (x, w, h) => { x.fillStyle = '#8a4a1c'; x.beginPath(); x.ellipse(60, 52, 56, 28, 0, Math.PI, 0); x.lineTo(116, 80); x.lineTo(4, 80); x.fill(); x.fillStyle = '#c0703a'; x.beginPath(); x.ellipse(48, 40, 26, 14, -0.3, 0, TAU); x.fill(); x.fillStyle = '#5a2a0c'; x.fillRect(4, 74, 112, 6); });
    else if (name === 'mesa') c = mk(260, 120, (x, w, h) => { x.fillStyle = '#9a4e1e'; x.beginPath(); x.moveTo(0, h); x.lineTo(30, 20); x.lineTo(220, 14); x.lineTo(258, h); x.fill(); x.fillStyle = '#c86a2c'; x.fillRect(30, 14, 190, 10); x.fillStyle = 'rgba(80,20,0,.3)'; for (let i = 0; i < 6; i++) x.fillRect(40 + i * 32, 30, 8, 90); });
    else if (name === 'flagL' || name === 'flagR') c = mk(60, 200, (x) => { x.fillStyle = '#ddd'; x.fillRect(26, 20, 6, 180); for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) { x.fillStyle = (r + q) % 2 ? '#000' : '#fff'; x.fillRect(32 + q * 7, 20 + r * 7, 7, 7); } });
    else if (name === 'crowd') c = mk(300, 140, (x, w, h) => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 40, w, 100); x.fillStyle = '#4a2a10'; for (let i = 0; i < 4; i++) x.fillRect(0, 60 + i * 22, w, 4); const cols = ['#5aac2c', '#e10600', '#ffd400', '#2349b8', '#fff', '#ff8a00']; for (let r = 0; r < 4; r++) for (let i = 0; i < 28; i++) { x.fillStyle = cols[(i * 7 + r * 3) % cols.length]; x.beginPath(); x.arc(8 + i * 10.4 + (r % 2) * 5, 52 + r * 22, 5, 0, TAU); x.fill(); } x.fillStyle = '#e10600'; x.fillRect(0, 0, w, 30); x.fillStyle = '#fff'; x.font = 'bold 22px Impact, Arial Black, sans-serif'; x.textAlign = 'center'; x.fillText('DUSTY CANYON CLASSIC', w / 2, 24); });
    else if (name === 'arch') c = mk(600, 260, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c86a2c'); g.addColorStop(1, '#7a3a14'); x.fillStyle = g; x.beginPath(); x.moveTo(0, h); x.lineTo(0, 40); x.quadraticCurveTo(w / 2, -30, w, 40); x.lineTo(w, h); x.lineTo(w - 80, h); x.lineTo(w - 90, 110); x.quadraticCurveTo(w / 2, 50, 90, 110); x.lineTo(80, h); x.closePath(); x.fill(); x.fillStyle = 'rgba(255,230,180,.3)'; x.fillRect(10, 40, 20, h); });
    else if (name === 'squigs') c = mk(140, 60, (x) => { // a little crowd of cheering Blobbits
      for (const [cx, cy, r, col, lk] of [[30, 38, 16, '#ffd400', 1], [72, 32, 20, '#3ac8ff', -1], [112, 40, 15, '#ff6ab0', 1]]) {
        x.lineJoin = 'round'; x.lineWidth = 2; x.strokeStyle = '#000'; x.fillStyle = col;
        for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(cx + sx * r * 0.8, cy - r * 0.1); x.lineTo(cx + sx * r * 1.25, cy - r * 0.95); x.stroke(); x.beginPath(); x.arc(cx + sx * r * 1.25, cy - r * 0.95, r * 0.2, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(cx + sx * r * 0.5, cy - r * 0.85, r * 0.2, r * 0.3, sx * 0.5, 0, TAU); x.fill(); x.stroke(); }
        const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); g.addColorStop(0, '#fff'); g.addColorStop(0.3, col); g.addColorStop(1, col);
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.stroke();
        for (const sx of [-1, 1]) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + sx * r * 0.32, cy - r * 0.18, r * 0.22, r * 0.28, 0, 0, TAU); x.fill(); x.lineWidth = 1.2; x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.arc(cx + sx * r * 0.32 + lk * r * 0.06, cy - r * 0.12, r * 0.11, 0, TAU); x.fill(); }
        x.fillStyle = '#6a0a1a'; x.beginPath(); x.arc(cx, cy + r * 0.22, r * 0.36, 0.1, Math.PI - 0.1); x.closePath(); x.fill(); x.stroke();
      } });
    else if (name === 'wreck') c = mk(160, 70, (x) => { x.fillStyle = '#555'; x.save(); x.translate(60, 40); x.rotate(-0.4); x.fillRect(-50, -12, 90, 24); x.fillStyle = '#e10600'; x.fillRect(30, -12, 14, 24); x.restore(); x.fillStyle = '#777'; x.beginPath(); x.ellipse(120, 52, 30, 12, 0.2, 0, TAU); x.fill(); x.fillStyle = 'rgba(60,60,60,.4)'; x.beginPath(); x.arc(70, 20, 18, 0, TAU); x.arc(90, 8, 14, 0, TAU); x.fill(); });
    else if (name === 'sign') c = mk(160, 120, (x) => { x.fillStyle = '#ddd'; x.fillRect(74, 50, 10, 70); x.fillStyle = '#ffd400'; x.fillRect(4, 4, 152, 54); x.strokeStyle = '#000'; x.lineWidth = 4; x.strokeRect(4, 4, 152, 54); x.fillStyle = '#000'; x.font = 'bold 30px Arial Black, sans-serif'; x.textAlign = 'center'; x.fillText('<<<', 80, 42); });
    else if (name === 'signR') c = mk(160, 120, (x) => { x.fillStyle = '#ddd'; x.fillRect(74, 50, 10, 70); x.fillStyle = '#ffd400'; x.fillRect(4, 4, 152, 54); x.strokeStyle = '#000'; x.lineWidth = 4; x.strokeRect(4, 4, 152, 54); x.fillStyle = '#000'; x.font = 'bold 30px Arial Black, sans-serif'; x.textAlign = 'center'; x.fillText('>>>', 80, 42); });
    return (SPR[name] = c);
  }
  // sprite world widths (in road-width units * ROAD)
  const SW = { pillar: 900, pillar2: 1100, rock: 520, mesa: 3200, flagL: 260, flagR: 260, crowd: 2200, arch: 5200, squigs: 900, wreck: 800, sign: 520, signR: 520 };
  const HARD = { pillar: 1, pillar2: 1, rock: 1, arch: 0, crowd: 1, flagL: 1, flagR: 1, wreck: 1, sign: 1, signR: 1 };

  // ================================================================ tracks
  function buildTrack(which) {
    const segs = [];
    const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
    function add(curve, y) { const n = segs.length; segs.push({ index: n, curve, sprites: [], cars: [], p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} }, band: Math.floor(n / 3) % 2 }); }
    function road(enter, hold, leave, curve, y) { const sy = lastY(), ey = sy + (y || 0) * SEG, tot = enter + hold + leave; let i = 0; for (let n = 0; n < enter; n++, i++) add(easeIn(0, curve, n / enter), easeInOut(sy, ey, i / tot)); for (let n = 0; n < hold; n++, i++) add(curve, easeInOut(sy, ey, i / tot)); for (let n = 0; n < leave; n++, i++) add(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, i / tot)); }
    const put = (n, name, off) => { if (segs[n]) segs[n].sprites.push({ name, off, w: SW[name] }); };
    if (which === 'dunes') {
      road(20, 40, 20, 0, 0); road(30, 40, 30, 2, 20); road(25, 30, 25, -3, -30); road(40, 60, 40, 1.5, 40); road(20, 20, 20, -4, -20); road(30, 50, 30, 0, -10);
      road(30, 30, 30, 3, 30); road(25, 50, 25, -2, -30); road(40, 40, 40, 0, 0); road(20, 40, 20, 2.5, 0);
    } else {
      road(25, 50, 25, 0, 0); road(25, 40, 25, 2.5, 0); road(30, 30, 30, 0, 30); road(20, 25, 20, -4, 0); road(20, 25, 20, 4, -20);
      road(40, 70, 40, 0, -20); road(25, 40, 25, -2, 40); road(15, 20, 15, 6, 0); road(30, 40, 30, 0, -40); road(25, 30, 25, -5, 0);
      road(30, 60, 30, 1.5, 20); road(20, 30, 20, -3, 0); road(30, 40, 30, 0, 0);
    }
    const N = segs.length, rnd = JG.rng(which === 'dunes' ? 77 : 1999);
    // start/finish
    put(2, 'flagL', -1.2); put(2, 'flagR', 1.2); put(8, 'crowd', -2.2); put(8, 'crowd', 2.2); put(20, 'crowd', -2.4);
    for (let n = 30; n < N - 10; n++) {
      const canyon = which !== 'dunes' && ((n > N * 0.32 && n < N * 0.55) || (n > N * 0.75 && n < N * 0.9));
      if (canyon && n % 4 === 0) { put(n, rnd() < 0.5 ? 'pillar' : 'pillar2', -(1.25 + rnd() * 0.8)); put(n, rnd() < 0.5 ? 'pillar' : 'pillar2', 1.25 + rnd() * 0.8); }
      else if (n % 12 === 0) put(n, 'mesa', (rnd() < 0.5 ? -1 : 1) * (3 + rnd() * 3));
      if (!canyon && n % 9 === 0 && rnd() < 0.5) put(n, rnd() < 0.3 ? 'squigs' : 'rock', (rnd() < 0.5 ? -1 : 1) * (1.4 + rnd() * 1.5));
      if (Math.abs(segs[n].curve) > 3 && n % 6 === 0) put(n, segs[n].curve > 0 ? 'signR' : 'sign', segs[n].curve > 0 ? -1.35 : 1.35);
    }
    for (const f of [0.2, 0.5, 0.83]) put(Math.floor(N * f), 'arch', 0);
    // a few boulders and wrecks ON the track to dodge
    for (let k = 0; k < (which === 'dunes' ? 10 : 7); k++) { const n = 60 + Math.floor(rnd() * (N - 90)); put(n, rnd() < 0.5 ? 'rock' : 'wreck', (rnd() - 0.5) * 1.2); }
    return { segs, N, len: N * SEG, name: which === 'dunes' ? 'Dune Sea Dash' : 'Dusty Canyon Classic' };
  }

  // ================================================================ pods
  const RIVALS = [
    { name: 'Dave', col: '#2349b8', eng: '#9ab0ff', skill: 0.9 },
    { name: Cast.t('Cousin {cousin}'), col: '#c000c0', eng: '#ff9aff', skill: 0.96 },
    { name: 'Turbo Terry', col: '#e10600', eng: '#ffb090', skill: 0.99 },
    { name: 'Callum', col: '#5aac2c', eng: '#c0ffa0', skill: 0.93 },
    { name: 'Gubbinz', col: '#ffd400', eng: '#fff4a0', skill: 0.86 },
  ];
  function drawPod(c, x, y, s, col, eng, tilt, heat, flame) {
    // a racing pod seen from behind: two big engines, energy binder, a little cockpit on cables
    c.save(); c.translate(x, y); c.rotate(tilt * 0.18); c.scale(s, s);
    const glow = heat > 1 ? '#ffffff' : heat > 0.7 ? '#ffe080' : eng;
    for (const sx of [-1, 1]) {
      const ex = sx * 46;
      // engine body
      c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(ex, -62, 20, 22, 0, 0, TAU); c.fill();
      const g = c.createLinearGradient(ex - 18, 0, ex + 18, 0); g.addColorStop(0, '#606070'); g.addColorStop(0.4, '#d8d8e8'); g.addColorStop(1, '#505060');
      c.fillStyle = g; c.fillRect(ex - 18, -84, 36, 40);
      c.fillStyle = col; c.fillRect(ex - 18, -70, 36, 8);
      // exhaust ring + flame
      c.fillStyle = '#111'; c.beginPath(); c.ellipse(ex, -48, 16, 8, 0, 0, TAU); c.fill();
      c.fillStyle = glow; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(ex, -48, 11 + flame * 3, 5 + flame * 2, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
      if (heat > 1.1) { c.fillStyle = 'rgba(255,90,0,.8)'; c.beginPath(); c.moveTo(ex - 12, -84); c.quadraticCurveTo(ex, -110 - Math.random() * 20, ex + 12, -84); c.fill(); }
      // shadow
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(ex, 0, 26, 6, 0, 0, TAU); c.fill();
    }
    // energy binder between the engines
    c.strokeStyle = eng; c.lineWidth = 3; c.globalAlpha = 0.6 + Math.random() * 0.4; c.beginPath(); c.moveTo(-28, -66); for (let i = 1; i <= 8; i++) c.lineTo(-28 + i * 7, -66 + (Math.random() - 0.5) * 6); c.stroke(); c.globalAlpha = 1;
    // cables to the cockpit
    c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-34, -60); c.lineTo(-8, -30); c.moveTo(34, -60); c.lineTo(8, -30); c.stroke();
    // cockpit with a helmeted kid pilot (seen from behind): jacket, crash helmet with a stripe, goggle strap, scarf
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -24, 16, 10, 0, 0, TAU); c.fill();
    c.fillStyle = '#2349b8'; c.beginPath(); c.ellipse(0, -27, 9, 4.5, 0, Math.PI, 0); c.fill();
    const sw = Math.sin(performance.now() / 70) * 2; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(3, -29); c.quadraticCurveTo(12, -31 + sw, 20, -28 + sw); c.lineTo(19, -25 + sw); c.quadraticCurveTo(11, -28 + sw, 3, -27); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = 1;
    const hg = c.createRadialGradient(-2.5, -36, 0.5, 0, -33, 8); hg.addColorStop(0, '#fff'); hg.addColorStop(0.6, '#e8e8f0'); hg.addColorStop(1, '#9a9aaa');
    c.fillStyle = hg; c.beginPath(); c.arc(0, -33, 7, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#e10600'; c.fillRect(-1.6, -40, 3.2, 14);
    c.fillStyle = '#3a2a1a'; c.fillRect(-7, -34, 14, 2.4);
    c.fillStyle = '#c8a040'; c.fillRect(-1.2, -34.2, 2.4, 2.8);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, -2, 14, 4, 0, 0, TAU); c.fill();
    c.restore();
  }

  if (window.Sound && Sound.addTune) Sound.addTune('jg_pod', { step: 0.12, hats: true,
    lead: [67, 0, 67, 72, 74, -1, 72, 74, 76, -1, 79, -1, 77, 76, 74, -1, 72, 0, 72, 76, 79, -1, 77, 76, 74, -1, 71, -1, 72, -1, 0, 0,
      67, 0, 67, 72, 74, -1, 72, 74, 76, -1, 79, -1, 81, -1, 79, 77, 76, 77, 79, 76, 74, -1, 76, 74, 72, -1, 67, -1, 72, -1, -1, 0],
    bass: [48, 48, 55, 48, 52, 52, 55, 52, 53, 53, 57, 53, 55, 55, 50, 55, 48, 48, 55, 48, 52, 52, 55, 52, 53, 53, 50, 55, 48, 55, 48, 48] });

  JG.mod('podracer', G => {
    const host = G.host, w = G.w;
    G.fit();
    let opts = Object.assign({ track: 'canyon', music: true, auto: false }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const scores = {};
    const sc = t => scores[t] = scores[t] || JG.Scores('podracer-' + t, { title: 'Pod Jack Racer: ' + (t === 'dunes' ? 'Dune Sea Dash' : 'Dusty Canyon Classic') + ' Best Times', lower: true, max: 60000, label: 'Time', fmt: v => fmtT(v / 10), seed: t === 'dunes' ? [['JACK', 1640], [Cast.t('COUSIN {cousin.NAME}'), 1702]] : [['JACK', 1820], ['DAVE', 2050], ['PODKID', 1990]] });
    const fmtT = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };
    const C = G.canvas(host, () => { bgKey = ''; });
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;
    let T = null, S = null, bgKey = '', bgCv = null;

    // online races (mp.js): no computer pods, just the other people's pods, live, as ghosts (you can drive through them)
    let race = null, raceCall = false, raceTrack = '';
    function newRace() {
      if (race && race.active && !raceCall) { Desk.toast('Pod Jack Racer', "You're in an online race! Finish it first.", 2500); return; }
      T = buildTrack(raceCall && raceTrack ? raceTrack : opts.track);
      S = { pos: 0, x: 0, v: 0, lap: 1, t: 0, lapT: 0, laps: [], heat: 0, fire: 0, wreck: 0, state: 'count', count: 3.5, steer: 0, paused: false, finished: false, sky: 0, place: 1, boostShown: false, msg: '', msgT: 0, bump: 0 };
      S.cars = raceCall ? [] : RIVALS.map((r, i) => ({ ...r, z: CAMH * DEPTH + 1100 + Math.floor(i / 2) * SEG * 4 + (i % 2) * SEG * 1.5, x: i === 4 ? 0 : (i % 2 ? -0.55 : 0.55), lap: 1, v: 0, done: 0, wob: Math.random() * 10 }));
      G.music(opts.music ? 'jg_pod' : '');
      bgKey = '';
    }
    function say(t, d) { S.msg = t; S.msgT = d || 2; }

    // ---------------------------------------------------------------- input
    const K = { left: 0, right: 0, up: 0, down: 0, boost: 0 };
    let touchMode = false;
    G.keys = {
      down(ev) {
        const k = ev.key;
        if (k === 'F3' || k === 'p' || k === 'P') { pause(); return true; }
        if (S && S.paused) { pause(false); return true; }
        if (S && S.finished && (k === ' ' || k === 'Enter')) { newRace(); return true; }
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') K.left = 1;
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') K.right = 1;
        else if (k === 'ArrowUp' || k === 'w' || k === 'W') K.up = 1;
        else if (k === 'ArrowDown' || k === 's' || k === 'S') K.down = 1;
        else if (k === ' ' || k === 'Shift') K.boost = 1;
        else return false;
        touchMode = false; return true;
      },
      up(ev) {
        const k = ev.key;
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') K.left = 0;
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') K.right = 0;
        else if (k === 'ArrowUp' || k === 'w' || k === 'W') K.up = 0;
        else if (k === 'ArrowDown' || k === 's' || k === 'S') K.down = 0;
        else if (k === ' ' || k === 'Shift') K.boost = 0;
        else return false;
        return true;
      },
    };
    const ptrs = new Map();
    const zoneOf = ev => { const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY), fx = (point.x - r.left) / r.width; return fx < 0.36 ? 'left' : fx > 0.64 ? 'right' : 'boost'; };
    const syncPtr = () => { K.left = K.right = K.boost = 0; for (const z of ptrs.values()) K[z] = 1; };
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      if (!S) return;
      if (S.paused) { pause(false); return; }
      if (S.finished) { if (S.finT > 1.2) newRace(); return; }
      touchMode = true; ptrs.set(ev.pointerId, zoneOf(ev)); syncPtr();
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    G.on(cv, 'pointermove', ev => { if (ptrs.has(ev.pointerId)) { ptrs.set(ev.pointerId, zoneOf(ev)); syncPtr(); } });
    const pend = ev => { ptrs.delete(ev.pointerId); syncPtr(); };
    G.on(cv, 'pointerup', pend); G.on(cv, 'pointercancel', pend);
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    function pause(on) { if (!S || S.finished) return; S.paused = on == null ? !S.paused : on; for (const k in K) K[k] = 0; ptrs.clear(); if (S.paused) G.stopMusic(); else G.music(opts.music ? 'jg_pod' : ''); }
    G.onActive = a => { if (!a && S && !S.finished && !S.paused && !(race && race.active)) pause(true); };

    // ---------------------------------------------------------------- simulation
    const segAt = z => T.segs[Math.floor(z / SEG) % T.N];
    function wreck() {
      if (S.wreck > 0) return;
      S.wreck = 1.8; S.v = 0; S.heat = 0; G.sfx('thud'); setTimeout(() => G.sfx('dice'), 120); G.secret('games.pod.wreck'); say('KABOOM! Bits everywhere!', 2);
      S.debris = Array.from({ length: 14 }, () => ({ x: (Math.random() - 0.5) * 40, y: -40, vx: (Math.random() - 0.5) * 300, vy: -200 - Math.random() * 300, r: Math.random() * 6 }));
    }
    function step(dt) {
      if (S.msgT > 0) S.msgT -= dt;
      if (S.state === 'count') {
        const before = Math.ceil(S.count); S.count -= dt; const after = Math.ceil(S.count);
        if (after !== before && after > 0) G.note(440, 0.15, 'square');
        if (S.count <= 0) { S.state = 'race'; G.note(880, 0.4, 'square'); say('GO GO GO!', 1.2); }
      }
      const racing = S.state === 'race' && !S.finished;
      // rivals
      for (const c of S.cars) {
        if (S.state !== 'race' || c.ghost) continue;
        const seg = segAt(c.z), target = MAXV * c.skill * (1 - Math.min(0.25, Math.abs(seg.curve) * 0.03));
        // light rubber band so races stay close
        const lead = (c.lap * T.len + c.z) - (S.lap * T.len + S.pos + CAMH * DEPTH);
        const rb = clamp(1 - lead / (T.len * 0.6) * 0.15, 0.85, 1.1);
        c.v = lerp(c.v, target * rb, dt * 0.8);
        c.z += c.v * dt; if (c.z >= T.len) { c.z -= T.len; c.lap++; if (c.lap > LAPS && !c.done) c.done = S.t; }
        c.wob += dt; c.x = clamp(c.x + Math.sin(c.wob * 0.7) * dt * 0.2 - seg.curve * dt * 0.02, -0.8, 0.8);
      }
      if (S.wreck > 0) { S.wreck -= dt; for (const d of S.debris) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 600 * dt; } if (S.wreck <= 0) { S.x = 0; say('Pod rebuilt! (With sticky tape.)', 1.6); } }
      if (racing && S.wreck <= 0) {
        const seg = segAt(S.pos + CAMH * DEPTH), pct = S.v / MAXV, dx = dt * 2 * pct;
        const steer = (K.left ? -1 : 0) + (K.right ? 1 : 0);
        S.steer = lerp(S.steer, steer, dt * 8);
        S.x += steer * dx;
        S.x -= dx * pct * seg.curve * CENT;
        const accel = opts.auto || touchMode ? !K.down : K.up;
        const boosting = K.boost && S.fire <= 0;
        const top = MAXV * (boosting ? 1.3 : 1) * (S.fire > 0 ? 0.55 : 1);
        if (K.down) S.v += BRAKE * dt; else if (accel) S.v += ACC * (boosting ? 1.6 : 1) * dt; else S.v += DECEL * dt;
        if (S.v > top) S.v = lerp(S.v, top, dt * 2);
        if (boosting && S.v > MAXV * 0.5) S.heat += dt * 0.32; else S.heat = Math.max(0, S.heat - dt * 0.22);
        if (S.heat >= 1 && !S.boostShown) { S.boostShown = true; G.secret('games.pod.boost'); say('WHITE HOT! Let go before it blows!', 2); }
        if (S.heat < 0.6) S.boostShown = false;
        if (S.heat > 1.18) { S.fire = 3; S.heat = 0.8; G.sfx('uhoh'); say('ENGINE FIRE! Too much boost!', 2); }
        if (S.fire > 0) S.fire -= dt;
        if (Math.abs(S.x) > 1 && S.v > OFFMAX) S.v += OFFDEC * dt;
        S.x = clamp(S.x, -3, 3);
        S.v = clamp(S.v, 0, MAXV * 1.35);
        // hit sprites
        const pseg = segAt(S.pos + CAMH * DEPTH);
        for (const sp of pseg.sprites) {
          if (!HARD[sp.name]) continue;
          const half = sp.w / ROAD / 2 * 0.8;
          if (Math.abs(S.x - sp.off) < half + 0.12) { if (S.v > MAXV * 0.45) wreck(); else { S.v = MAXV * 0.1; S.x += S.x > sp.off ? 0.1 : -0.1; } break; }
        }
        // bump rivals
        for (const c of S.cars) {
          if (c.ghost) continue;
          let dz = c.z - (S.pos + CAMH * DEPTH); if (dz < -T.len / 2) dz += T.len;
          if (dz > -SEG * 0.6 && dz < SEG * 0.9 && Math.abs(c.x - S.x) < 0.45) { if (S.v > c.v) { S.v = c.v * 0.85; S.bump = 0.25; G.sfx('thud'); } c.x += c.x > S.x ? 0.08 : -0.08; }
        }
        S.pos += S.v * dt;
        S.sky -= pseg.curve * pct * dt * 0.1;
        if (S.pos >= T.len) {
          S.pos -= T.len; S.laps.push(S.lapT); S.lapT = 0;
          if (S.lap >= LAPS) finish(); else { S.lap++; say(S.lap === LAPS ? 'FINAL LAP!' : 'LAP ' + S.lap, 1.6); G.sfx('join'); }
        }
      }
      if (S.bump > 0) S.bump -= dt;
      if (S.state === 'race' && !S.finished) { S.t += dt; S.lapT += dt; }
      if (S.finished) S.finT += dt;
      // position in the race
      const me = S.finished ? 1e12 - S.t : S.lap * T.len + S.pos + CAMH * DEPTH;
      S.place = 1 + S.cars.filter(c => (c.done ? 1e12 - c.done : c.lap * T.len + c.z) > me).length;
    }
    function finish() {
      if (S.sim) { S.finished = true; S.state = 'done'; return; }
      S.finished = true; S.finT = 0; S.state = 'done'; G.stopMusic();
      if (race && race.active) { race.live({ z: S.pos + CAMH * DEPTH, x: S.x, lap: LAPS + 1, v: 0, t: S.t, f: 1 }); race.progress(1, fmtT(S.t)); race.done({ ok: true, score: Math.round(S.t * 10) }); }
      S.cars.forEach(c => { if (!c.done) { const left = (LAPS + 1 - c.lap) * T.len - c.z; c.done = S.t + Math.max(0.5, left / Math.max(1, c.v)); } });
      const place = 1 + S.cars.filter(c => c.done < S.t).length;
      S.result = place;
      if (place === 1) { G.secret('games.pod.win'); G.sfx('solve'); say('YOU WIN! Pod pilot of the year!', 4); } else { G.sfx('uhoh'); say(`You came ${ord(place)}. ${place === 6 ? 'Gubbinz beat you. GUBBINZ.' : 'So close!'}`, 4); }
      G.timeout(() => sc(opts.track).submit(Math.round(S.t * 10)), 2200);
    }
    const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

    // ---------------------------------------------------------------- rendering
    function project(p, cx, cy, cz, W, H) {
      p.camera.x = -cx; p.camera.y = (p.world.y || 0) - cy; p.camera.z = p.world.z - cz;
      const s = p.screen.scale = DEPTH / p.camera.z;
      p.screen.x = Math.round(W / 2 + s * p.camera.x * W / 2);
      p.screen.y = Math.round(VIEW.hz - s * p.camera.y * VIEW.vh / 2);
      p.screen.w = Math.round(s * ROAD * W / 2);
    }
    const SAND = ['#e2a65a', '#d89a4c'], ROADC = ['#c8884a', '#c08044'], RUMB = ['#ffffff', '#e10600'], LANE = '#f0c890', HAZE = [240, 200, 150];
    const fogCache = {};
    const fogMix = (hex, f) => { const q = Math.round(f * 24), key = hex + q; let v = fogCache[key]; if (v) return v; const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, ff = q / 24; return (fogCache[key] = `rgb(${lerp(r, HAZE[0], ff) | 0},${lerp(g, HAZE[1], ff) | 0},${lerp(b, HAZE[2], ff) | 0})`); };
    function quad(x1, y1, w1, x2, y2, w2, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1); ctx.closePath(); ctx.fill(); }
    function background(W, H) {
      const key = W + 'x' + H + opts.track;
      if (bgKey !== key) {
        bgKey = key; const VH = Math.min(H, W * 1.1); bgCv = mk(Math.round(W * 2 * C.dpr), Math.round(VH * 0.55 * C.dpr), (x, bw, bh) => {
          x.scale(C.dpr, C.dpr); const ww = W * 2, hh = VH * 0.55;
          const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, opts.track === 'dunes' ? '#3a7ad8' : '#4a8ae8'); g.addColorStop(0.7, '#f0c8a0'); g.addColorStop(1, '#f8d8a8'); x.fillStyle = g; x.fillRect(0, 0, ww, hh);
          // two suns
          for (const [sx, sy, r] of [[ww * 0.3, hh * 0.3, 22], [ww * 0.36, hh * 0.38, 14], [ww * 0.8, hh * 0.3, 22], [ww * 0.86, hh * 0.38, 14]]) { const sg = x.createRadialGradient(sx, sy, 2, sx, sy, r * 2.4); sg.addColorStop(0, '#fff'); sg.addColorStop(0.35, 'rgba(255,250,220,.95)'); sg.addColorStop(1, 'rgba(255,230,160,0)'); x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, r * 2.4, 0, TAU); x.fill(); }
          // far mesas
          const rnd = JG.rng(42); x.fillStyle = '#c8885a';
          for (let i = 0; i < 12; i++) { const mx = (i / 12) * ww, mw = ww / 12 * (0.6 + rnd() * 0.5), mh = hh * (0.15 + rnd() * 0.2); x.beginPath(); x.moveTo(mx, hh); x.lineTo(mx + mw * 0.12, hh - mh); x.lineTo(mx + mw * 0.85, hh - mh * 0.95); x.lineTo(mx + mw, hh); x.fill(); }
          x.fillStyle = '#e0a868'; for (let i = 0; i < 9; i++) { const mx = ((i + 0.5) / 9) * ww; x.beginPath(); x.ellipse(mx, hh, ww / 14, hh * 0.08, 0, Math.PI, 0); x.fill(); }
        });
      }
      const off = ((S.sky % 1) + 1) % 1 * W, bh = VIEW.vh * 0.55, top = VIEW.hz - bh + VIEW.vh * 0.05;
      if (top > 0) {
        const sg = ctx.createLinearGradient(0, 0, 0, top + 2); sg.addColorStop(0, '#1a3a90'); sg.addColorStop(1, opts.track === 'dunes' ? '#3a7ad8' : '#4a8ae8'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, top + 2);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (let i = 0; i < 5; i++) { const cx = ((i * 0.27 + 0.1 - off / W * 0.3) % 1 + 1) % 1 * (W + 160) - 80, cy = top * (0.25 + (i % 3) * 0.22); ctx.beginPath(); ctx.ellipse(cx, cy, 60, 12, 0, 0, TAU); ctx.ellipse(cx + 30, cy - 8, 34, 12, 0, 0, TAU); ctx.fill(); }
      }
      ctx.drawImage(bgCv, -off, top, W * 2, bh); ctx.drawImage(bgCv, W * 2 - off, top, W * 2, bh);
    }
    const VIEW = { hz: 0, vh: 0 };
    function draw() {
      const W = C.W, H = C.H;
      VIEW.vh = Math.min(H, W * 1.1); VIEW.hz = H - VIEW.vh / 2;
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      ctx.fillStyle = SAND[0]; ctx.fillRect(0, 0, W, H);
      if (!S) return;
      // the horizon tracks the hills a little
      background(W, H);
      const base = segAt(S.pos), basePct = (S.pos % SEG) / SEG, pz = CAMH * DEPTH;
      const pseg = segAt(S.pos + pz), ppct = ((S.pos + pz) % SEG) / SEG;
      const py = lerp(pseg.p1.world.y, pseg.p2.world.y, ppct);
      let x = 0, dx = -(base.curve * basePct);
      const list = [];
      for (let n = 0; n < DRAW; n++) {
        const seg = T.segs[(base.index + n) % T.N], looped = seg.index < base.index;
        const camZ = S.pos - (looped ? T.len : 0);
        project(seg.p1, S.x * ROAD - x, py + CAMH, camZ, W, H);
        project(seg.p2, S.x * ROAD - x - dx, py + CAMH, camZ, W, H);
        x += dx; dx += seg.curve;
        seg.fog = Math.min(1, Math.pow(n / DRAW, 2.2) * 1.1);
        seg.vis = !(seg.p1.camera.z <= DEPTH || seg.p2.screen.y >= seg.p1.screen.y);
        list.push(seg);
      }
      // painter's order: far to near
      for (let i = list.length - 1; i >= 0; i--) {
        const seg = list[i], p1 = seg.p1.screen, p2 = seg.p2.screen, f = seg.fog;
        if (seg.vis) {
          ctx.fillStyle = fogMix(SAND[seg.band], f); ctx.fillRect(0, p2.y, W, p1.y - p2.y + 1);
          const r1 = p1.w / 7, r2 = p2.w / 7;
          quad(p1.x, p1.y, p1.w + r1, p2.x, p2.y, p2.w + r2, fogMix(RUMB[seg.band], f));
          quad(p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, fogMix(ROADC[seg.band], f));
          if (seg.band) { const l1 = p1.w / 40, l2 = p2.w / 40; for (const o of [-0.33, 0.33]) quad(p1.x + p1.w * o, p1.y, l1, p2.x + p2.w * o, p2.y, l2, fogMix(LANE, f)); }
          if (seg.index < 2) { // chequered start line
            const cells = 12; for (let k = 0; k < cells; k++) { ctx.fillStyle = (k + seg.index) % 2 ? '#000' : '#fff'; const xa = lerp(p1.x - p1.w, p1.x + p1.w, k / cells), xb = lerp(p1.x - p1.w, p1.x + p1.w, (k + 1) / cells); ctx.fillRect(xa, p2.y, xb - xa, p1.y - p2.y + 1); }
          }
        }
        // sprites + rivals on this segment
        const s1 = seg.p1.screen;
        if (seg.p1.camera.z > DEPTH) {
          for (const sp of seg.sprites) {
            const img = spr(sp.name), sw = sp.w * s1.scale * W / 2, sh = sw * img.height / img.width;
            const sx = s1.x + s1.scale * sp.off * ROAD * W / 2 - sw / 2;
            if (sx > W || sx + sw < 0 || sw < 1) continue;
            ctx.globalAlpha = 1 - f * 0.8; ctx.drawImage(img, sx, s1.y - sh, sw, sh); ctx.globalAlpha = 1;
          }
          for (const c of S.cars) {
            if (segAt(c.z) !== seg) continue;
            const cp = (c.z % SEG) / SEG, sc2 = lerp(seg.p1.screen.scale, seg.p2.screen.scale, cp), sxx = lerp(seg.p1.screen.x, seg.p2.screen.x, cp) + sc2 * c.x * ROAD * W / 2, syy = lerp(seg.p1.screen.y, seg.p2.screen.y, cp);
            const size = sc2 * ROAD * W / 2 / 230;
            if (size > 0.02 && size < 6) drawPod(ctx, sxx, syy, size, c.col, c.eng, 0, 0, Math.random());
          }
        }
      }
      // the player
      const bounce = S.v > 0 ? Math.sin(performance.now() / 60) * 1.5 * (S.v / MAXV) : 0;
      const ps = Math.min(W / 520, H / 380) * 1.1;
      if (S.wreck > 0) {
        ctx.fillStyle = 'rgba(80,80,80,.6)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(W / 2 + Math.sin(i * 2 + S.wreck * 3) * 40 * ps, H - 90 * ps - i * 14 * ps - (1.8 - S.wreck) * 40, (18 + i * 4) * ps, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#444'; for (const d of S.debris) ctx.fillRect(W / 2 + d.x * ps, H - 30 * ps + d.y * ps, (4 + d.r) * ps, (3 + d.r / 2) * ps);
      } else drawPod(ctx, W / 2, H - 18 * ps + bounce + (S.bump > 0 ? Math.sin(S.bump * 60) * 3 : 0), ps, '#ff8a00', '#9ae0ff', S.steer, S.heat, Math.min(1, S.v / MAXV) + (K.boost ? 0.8 : 0));
      if (S.heat > 0.95 && S.wreck <= 0) { ctx.fillStyle = `rgba(255,255,255,${(S.heat - 0.95) * 0.6})`; ctx.fillRect(0, 0, W, H); }
      hud(W, H);
    }
    function hud(W, H) {
      const sm = W < 480;
      ctx.font = `bold ${sm ? 13 : 16}px Tahoma, sans-serif`; ctx.textBaseline = 'top';
      const shadow = (t, x2, y2, col, al) => { ctx.textAlign = al || 'left'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(t, x2 + 1.5, y2 + 1.5); ctx.fillStyle = col; ctx.fillText(t, x2, y2); };
      shadow(`LAP ${Math.min(S.lap, LAPS)}/${LAPS}`, 10, 8, '#fff');
      shadow(`${ord(S.place)} / ${S.cars.length + 1}`, 10, sm ? 26 : 30, S.place === 1 ? '#ffd400' : '#fff');
      shadow(fmtT(S.t), W - 10, 8, '#fff', 'right');
      if (S.laps.length) { ctx.font = `${sm ? 11 : 12}px Tahoma, sans-serif`; shadow('best lap ' + fmtT(Math.min(...S.laps)), W - 10, sm ? 26 : 30, '#ffe0a0', 'right'); }
      // speed + heat gauges
      const gx = 10, gy = H - (sm ? 46 : 54), gw = Math.min(160, W * 0.3);
      ctx.font = `bold ${sm ? 11 : 12}px Tahoma, sans-serif`; shadow(Math.round(S.v / MAXV * 520) + ' mph', gx, gy - 2, '#fff');
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(gx, gy + 16, gw, 10);
      const hc = S.heat > 1 ? '#fff' : S.heat > 0.7 ? '#ff8a00' : '#ffd400';
      ctx.fillStyle = hc; ctx.fillRect(gx + 1, gy + 17, (gw - 2) * clamp(S.heat / 1.18, 0, 1), 8);
      ctx.fillStyle = '#fff'; ctx.font = '10px Tahoma, sans-serif'; ctx.fillText(S.fire > 0 ? 'ENGINE FIRE!' : 'HEAT', gx + gw + 6, gy + 15);
      if ((touchMode || G.phone()) && S.state !== 'done') { ctx.font = '11px Tahoma, sans-serif'; shadow('\u25C0 steer        BOOST        steer \u25B6', W / 2, sm ? 50 : 56, 'rgba(255,255,255,.85)', 'center'); }
      ctx.textAlign = 'center';
      if (S.state === 'count') { const n = Math.ceil(S.count); ctx.font = `bold ${Math.round(H / 5)}px Impact, Arial Black, sans-serif`; shadow(n > 3 ? 'READY' : String(n), W / 2, H * 0.25, n > 3 ? '#fff' : '#ffd400', 'center'); }
      if (S.msgT > 0 && S.msg) { ctx.font = `bold ${sm ? 14 : 18}px Tahoma, sans-serif`; shadow(S.msg, W / 2, H * 0.18, '#fff', 'center'); }
      if (S.finished && S.finT > 1) results(W, H);
      if (S.paused) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.font = 'bold 24px Tahoma, sans-serif'; shadow('PAUSED', W / 2, H / 2 - 20, '#ffd400', 'center'); ctx.font = '12px Tahoma, sans-serif'; shadow(G.phone() ? 'Click to carry on' : 'Press any key or click to carry on', W / 2, H / 2 + 12, '#fff', 'center'); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    function results(W, H) {
      const rows = [{ name: 'You', t: S.t, me: 1 }, ...S.cars.map(c => ({ name: c.name, t: c.done }))].sort((a, b) => a.t - b.t);
      const bw = Math.min(300, W - 30), bh = 40 + rows.length * 20 + 26, bx = (W - bw) / 2, by = (H - bh) / 2;
      ctx.fillStyle = '#c0c0c0'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2); ctx.strokeStyle = '#000'; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#000080'; ctx.fillRect(bx + 3, by + 3, bw - 6, 20); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Race Results - ' + T.name, bx + 8, by + 13);
      ctx.font = '12px Tahoma, sans-serif';
      rows.forEach((r, i) => { const y = by + 38 + i * 20; if (r.me) { ctx.fillStyle = '#000080'; ctx.fillRect(bx + 6, y - 9, bw - 12, 18); } ctx.fillStyle = r.me ? '#fff' : '#000'; ctx.textAlign = 'left'; ctx.fillText(`${ord(i + 1)}  ${r.name}`, bx + 12, y); ctx.textAlign = 'right'; ctx.fillText(fmtT(r.t), bx + bw - 12, y); });
      ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(G.phone() ? 'Click to race again' : 'Press Space or F2 to race again', W / 2, by + bh - 14);
    }

    G.loop(dt => {
      if (!S) return;
      if (!S.paused) step(dt);
      if (race && race.active && S.state === 'race' && !S.finished) { race.live({ z: Math.round(S.pos + CAMH * DEPTH), x: Math.round(S.x * 100) / 100, lap: S.lap, v: Math.round(S.v), t: Math.round(S.t * 10) / 10 }); if ((S.progT = (S.progT || 0) + dt) > 0.6) { S.progT = 0; race.progress(Math.min(0.99, ((S.lap - 1) * T.len + S.pos) / (LAPS * T.len)), `Lap ${S.lap}/${LAPS}`); } }
      draw();
      G.status(S.finished ? 'Race over!' : S.paused ? 'Paused' : `${T.name} - ${opts.auto ? 'auto-accelerate' : 'Up to accelerate'}, Space to boost, F3 pause`);
    });

    // ---------------------------------------------------------------- menus
    G.newGame = () => { if (sv && !(race && race.active)) sv.clear(); newRace(); G.focus(); };
    G.dbgRace = () => S && { cars: S.cars.map(c => ({ n: c.name, z: Math.round(c.z), lap: c.lap, g: !!c.ghost })), lap: S.lap, pos: Math.round(S.pos), state: S.state, paused: S.paused };
    if (window.MP) {
      race = MP.hook('games.podracer', w, { start(seed, o, R, preview) {
        raceTrack = o && (o.track === 'dunes' || o.track === 'canyon') ? o.track : 'canyon';
        raceCall = true; try { newRace(); } finally { raceCall = false; }
        if (preview) S.paused = true; else { S.state = 'race'; S.count = 0; say('GO GO GO!', 1.2); G.focus(); }
      } });
      race.onLive((d, from, nick) => {
        if (!S || !d || typeof d !== 'object' || !race.active) return;
        let c = S.cars.find(x => x.ghost && x.id === from);
        if (!c) { const pal = RIVALS[S.cars.length % RIVALS.length]; c = { ghost: true, id: from, name: String(nick || 'Racer').slice(0, 16), col: pal.col, eng: pal.eng, skill: 0, z: 0, x: 0, lap: 1, v: 0, done: 0, wob: 0 }; S.cars.push(c); }
        const z = +d.z || 0; c.z = ((z % T.len) + T.len) % T.len; c.x = Math.max(-3, Math.min(3, +d.x || 0)); c.lap = Math.max(1, Math.min(LAPS + 1, d.lap | 0)); c.v = Math.max(0, +d.v || 0);
        if (d.f && !c.done) c.done = Math.max(0.1, +d.t || S.t);
      });
    }
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to Race', 'Three laps. Six pods. One winner.\n\nSteer with the Left and Right arrows, hold Up to go (or turn on auto-accelerate in Options), Down to brake.\n\nSpace (or Shift) is BOOST. Boost makes your engines hot. White hot is the fastest you can go... but hold it too long and they catch fire.'],
        ['Mouse Controls', 'Click and hold the left part of the screen to steer left, the right part to steer right, and the middle to boost. You go forward on your own.'],
        ['Hazards', 'Rock pillars, boulders, old wrecks and the crowd stands will turn your pod into a pile of bits. Bump the other pods and you lose speed. The orange sand at the side is slow.'],
        ['The Racers', Cast.t('Dave (blue), Cousin {cousin} (purple), Turbo Terry (red and very fast), Callum (green, says his keyboard is lagging) and Gubbinz (yellow, mostly lost).')],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Race', key: 'F2', act: G.newGame },
        ...(window.MP ? [MP.menuItem('race.podracer', { track: opts.track })] : []),
        { label: 'Pause', key: 'F3', chk: S && S.paused, dis: !S || S.finished, act: () => pause() }, '-',
        { label: 'Dusty Canyon Classic', rad: opts.track === 'canyon', act: () => { opts.track = 'canyon'; saveOpts(); G.newGame(); } },
        { label: 'Dune Sea Dash', rad: opts.track === 'dunes', act: () => { opts.track = 'dunes'; saveOpts(); G.newGame(); } }, '-',
        { label: 'Best Times...', act: () => sc(opts.track).show() }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Options', () => [
        { label: 'Auto-accelerate', chk: opts.auto, act: () => { opts.auto = !opts.auto; saveOpts(); } },
        { label: 'Music', chk: opts.music, act: () => { opts.music = !opts.music; saveOpts(); G.music(opts.music && S && !S.finished ? 'jg_pod' : ''); } },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Pod Jack Racer', act: () => G.about({ ver: 'Version 1.0 (made 17 July 1999)', blurb: 'Made the day after seeing the new space film at the pictures. Now THIS is racing. (Jack said that out loud in the cinema. Mom was not impressed.)', credits: [['Pod design', 'Jack (after the film)'], ['Programming', 'Jack (till 2am)'], ['Engine noises', 'Dave (mouth)'], ['Canyon', 'Jack + MS Paint'], ['Two suns', Cast.t('Cousin {cousin}\'s idea')], ['Lap timing', 'The kitchen clock'], ['Crash testing', 'Gubbinz'], ['Sandwiches', 'Mom']] }) },
      ]],
    ]);
    // automated test harness: always accelerating, random steering (including into the scenery) and boosting
    G.simRun = o => {
      o = Object.assign({ seconds: 600, seed: 1, track: 'canyon' }, o || {});
      const rnd = JG.rng(o.seed), saved = [Math.random, G.sfx, G.note, G.secret, G.music], savedTrack = opts.track;
      Math.random = rnd; G.sfx = G.note = G.secret = G.music = () => {}; opts.track = o.track;
      const rep = { seconds: o.seconds, races: 0, laps: 0, wrecks: 0, stalls: [], nan: 0, out: 0 };
      const fresh = () => { newRace(); S.sim = true; S.state = 'race'; S.count = 0; rep.races++; };
      fresh();
      let next = 0, aim = 0, prog = 0, stallT = 0, lap0 = 1;
      try {
        for (let t = 0, dt = 1 / 60; t < o.seconds; t += dt) {
          if ((next -= dt) <= 0) { next = 0.3 + rnd() * 1.5; aim = rnd() < 0.25 ? (rnd() - 0.5) * 5 : (rnd() - 0.5) * 1.2; K.boost = rnd() < 0.3 ? 1 : 0; }
          K.up = 1; K.left = S.x > aim + 0.1 ? 1 : 0; K.right = S.x < aim - 0.1 ? 1 : 0;
          const w0 = S.wreck > 0;
          step(dt);
          if (!w0 && S.wreck > 0) rep.wrecks++;
          if (!isFinite(S.pos) || !isFinite(S.x) || !isFinite(S.v)) { rep.nan++; fresh(); continue; }
          if (Math.abs(S.x) > 3.001) rep.out++;
          if (S.lap !== lap0) { rep.laps++; lap0 = S.lap; }
          const p2 = S.lap * T.len + S.pos;
          if (S.wreck > 0 || p2 - prog > SEG * 2) { prog = p2; stallT = 0; } else if ((stallT += dt) > 4) { rep.stalls.push([Math.floor(S.pos / SEG), +S.x.toFixed(2)]); stallT = 0; prog = p2; }
          if (S.finished) { fresh(); lap0 = 1; prog = 0; }
        }
      } finally { [Math.random, G.sfx, G.note, G.secret, G.music] = saved; opts.track = savedTrack; for (const k in K) K[k] = 0; }
      newRace();
      return rep;
    };
    G.dbg = () => ({ pos: S.pos | 0, x: +S.x.toFixed(2), v: S.v | 0, lap: S.lap, place: S.place, state: S.state, heat: +S.heat.toFixed(2), wreck: S.wreck > 0, finished: S.finished, t: +S.t.toFixed(1), N: T.N });
    G.cheat = (lap, pos) => { S.lap = lap; S.pos = pos; };
    // saved game (js/gamesave.js): a race in progress carries on exactly where it was (lap, position, every rival pod),
    // paused, after a refresh or a closed window. Online races are never saved.
    const sv = G.saver(() => {
      if (!S || S.sim) return undefined;
      if (race && race.active) S._mp = true;
      if (S._mp || !S.cars || !S.cars.length) return undefined;
      if (S.finished) return null;
      return { track: opts.track, S: Object.assign({}, S, { paused: true, debris: null }) };
    }, { v: 1, live: true, every: 5000 });
    const resume = d => {
      if (!d || !d.S || !Array.isArray(d.S.cars) || !isFinite(d.S.pos) || (d.track !== 'canyon' && d.track !== 'dunes')) return false;
      opts.track = d.track; T = buildTrack(d.track);
      S = Object.assign({}, d.S, { paused: true, steer: 0 }); if (!S.debris) delete S.debris; say(G.phone() ? 'Welcome back! Click the track to carry on.' : 'Welcome back! Press any key to carry on.', 3);
      return true;
    };
    if (!resume(sv && sv.load())) { if (sv) sv.clear(); newRace(); }
  });
})();

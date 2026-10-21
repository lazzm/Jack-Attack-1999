/* TOY SQUADRON (Dreamcast, in Jack's room): a Toy-Commander-style flying game. You are a toy plane (and later a toy
 * helicopter) buzzing round a giant 1999 family house at toy scale: the kitchen, the lounge, a bedroom and the bathroom.
 * Eight short missions (hoops, balloons, sugar cubes for the fort, racing the clockwork car, tailing the paper plane,
 * soaking the ducks, a battery run and the grand tour), a battery meter for a clock, bronze/silver/gold, a map of the house,
 * and a sleeping cat that is best left alone. Crashing just bonks you. Everything drawn in code; original art and music. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapA = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  const mt = s => { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };
  const mt1 = s => { s = Math.max(0, s); return (s / 60 | 0) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + String(Math.floor((s % 1) * 10)); };

  // ---------------------------------------------------------------- music (16th-note steps; 0 rest, -1 hold)
  const SONGS = {
    title: { bpm: 144, wave: 'square', vol: 0.05, bassWave: 'triangle', drums: 'o.x.o.x.o.x.oxx.',
      lead: [72, -1, 76, -1, 79, -1, -1, -1, 76, -1, 72, -1, 74, -1, -1, -1, 76, -1, 77, -1, 79, -1, -1, -1, 81, -1, 79, -1, 76, -1, -1, -1,
        79, -1, 81, -1, 83, -1, -1, -1, 84, -1, 83, -1, 81, -1, 79, -1, 77, -1, 76, -1, 74, -1, -1, -1, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 48, 0, 55, 0, 55, 0, 48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 48, 0, 48, 0, 53, 0, 53, 0, 48, 0, 48, 0,
        55, 0, 55, 0, 50, 0, 50, 0, 55, 0, 55, 0, 50, 0, 50, 0, 53, 0, 53, 0, 55, 0, 55, 0, 48, 0, 48, 0, 55, 0, 55, 0] },
    kit: { bpm: 160, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o.x.oox.o.x.o.xx',
      lead: [67, 0, 67, 0, 71, -1, 74, 0, 72, 0, 71, 0, 69, -1, -1, 0, 67, 0, 67, 0, 71, -1, 74, 0, 76, -1, 74, -1, 72, -1, -1, 0,
        74, 0, 74, 0, 76, -1, 79, 0, 78, 0, 76, 0, 74, -1, -1, 0, 72, 0, 71, 0, 69, -1, 67, 0, 69, -1, 71, -1, 67, -1, -1, 0],
      bass: [43, 0, 55, 0, 43, 0, 55, 0, 41, 0, 53, 0, 41, 0, 53, 0, 43, 0, 55, 0, 43, 0, 55, 0, 45, 0, 57, 0, 45, 0, 57, 0,
        38, 0, 50, 0, 38, 0, 50, 0, 43, 0, 55, 0, 43, 0, 55, 0, 41, 0, 53, 0, 45, 0, 57, 0, 43, 0, 55, 0, 43, 0, 55, 0] },
    lou: { bpm: 122, wave: 'triangle', vol: 0.06, bassWave: 'sine', drums: 'o...x...o...x.x.',
      lead: [69, -1, -1, 72, -1, -1, 76, -1, -1, -1, 74, -1, 72, -1, -1, -1, 71, -1, -1, 74, -1, -1, 77, -1, -1, -1, 76, -1, 74, -1, -1, -1,
        72, -1, -1, 76, -1, -1, 79, -1, -1, -1, 77, -1, 76, -1, -1, -1, 74, -1, -1, 72, -1, -1, 71, -1, -1, -1, 69, -1, -1, -1, 0, 0],
      bass: [45, 0, 0, 0, 52, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0,
        41, 0, 0, 0, 48, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0] },
    bed: { bpm: 112, wave: 'sine', vol: 0.075, bassWave: 'triangle', drums: '........x.......',
      lead: [76, -1, -1, -1, 79, -1, -1, -1, 83, -1, -1, -1, 81, -1, 79, -1, 76, -1, -1, -1, 74, -1, -1, -1, 72, -1, -1, -1, -1, -1, -1, -1,
        74, -1, -1, -1, 76, -1, -1, -1, 79, -1, -1, -1, 78, -1, 76, -1, 74, -1, -1, -1, 71, -1, -1, -1, 72, -1, -1, -1, -1, -1, -1, -1],
      bass: [48, 0, 0, 0, 0, 0, 0, 0, 52, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0,
        50, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0] },
    bath: { bpm: 150, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o.x.o.x.o.xxo.x.',
      lead: [74, 0, 78, 0, 81, -1, 78, 0, 74, 0, 78, 0, 81, -1, -1, 0, 76, 0, 79, 0, 83, -1, 79, 0, 76, 0, 79, 0, 83, -1, -1, 0,
        78, 0, 81, 0, 86, -1, 81, 0, 78, 0, 81, 0, 86, -1, -1, 0, 83, -1, 81, -1, 79, -1, 78, -1, 76, -1, -1, -1, 74, -1, -1, 0],
      bass: [50, 0, 50, 0, 57, 0, 50, 0, 50, 0, 50, 0, 57, 0, 50, 0, 52, 0, 52, 0, 59, 0, 52, 0, 52, 0, 52, 0, 59, 0, 52, 0,
        54, 0, 54, 0, 61, 0, 54, 0, 54, 0, 54, 0, 61, 0, 54, 0, 55, 0, 55, 0, 57, 0, 57, 0, 50, 0, 50, 0, 50, 0, 50, 0] },
    dusk: { bpm: 172, wave: 'sawtooth', vol: 0.03, bassWave: 'square', drums: 'o.x.oox.o.x.oxxx',
      lead: [69, 0, 69, 72, 0, 76, -1, 0, 74, 0, 72, 0, 69, -1, -1, 0, 67, 0, 67, 71, 0, 74, -1, 0, 72, 0, 71, 0, 67, -1, -1, 0,
        65, 0, 65, 69, 0, 72, -1, 0, 71, 0, 69, 0, 65, -1, -1, 0, 67, -1, 69, -1, 71, -1, 72, -1, 74, -1, 76, -1, -1, -1, 0, 0],
      bass: [45, 45, 57, 45, 45, 45, 57, 45, 45, 45, 57, 45, 45, 45, 57, 45, 43, 43, 55, 43, 43, 43, 55, 43, 43, 43, 55, 43, 43, 43, 55, 43,
        41, 41, 53, 41, 41, 41, 53, 41, 41, 41, 53, 41, 41, 41, 53, 41, 43, 43, 55, 43, 43, 43, 55, 43, 45, 45, 57, 45, 45, 45, 57, 45] },
  };
  const ROOM_SONG = { kit: 'kit', lou: 'lou', bed: 'bed', bath: 'bath' };

  // ---------------------------------------------------------------- the missions
  const MIS = [
    { id: 'school', n: 'FLIGHT SCHOOL', room: 'bed', craft: 'plane', type: 'hoops', bat: 80, gold: 35, silver: 50, goal: 'FLY THROUGH ALL 8 HOOPS',
      brief: ['Welcome to the squadron! Your first job: fly the course round the bedroom.', 'Fly through every hoop in order. The next one glows green.', 'Hold turbo to go faster. Careful near the bunk bed.'] },
    { id: 'party', n: 'BALLOON PARTY', room: 'lou', craft: 'plane', type: 'balloons', bat: 90, gold: 50, silver: 70, goal: 'POP ALL 12 BALLOONS',
      brief: ['Somebody left the party balloons up in the lounge.', 'Pop every balloon: fire peas at them or just fly straight through.', 'The cat is asleep on the rug. Do NOT wake the cat.'] },
    { id: 'sugar', n: 'SUGAR RUSH', room: 'kit', craft: 'plane', type: 'sugar', bat: 110, gold: 50, silver: 75, goal: 'DELIVER 4 SUGAR CUBES TO THE FORT',
      brief: ['The toy soldiers at the fort want their tea sweet.', 'Grab a sugar cube from the bowl on the table (fly through the ring), then drop it at the fort flag.', 'Four cubes. Mind the toaster: it pops.'] },
    { id: 'clock', n: 'CLOCKWORK CUP', room: 'lou', craft: 'plane', type: 'race', bat: 72, gold: 40, silver: 55, goal: 'FINISH THE HOOPS BEFORE THE CAR DOES ITS LAPS', ncar: 1,
      brief: ['Dave has wound up his clockwork car and reckons it is faster than your plane.', 'Fly the 10 hoops round the lounge before the car finishes two laps of the rug.', 'Your battery lasts as long as the car does. Fly fast!'] },
    { id: 'paper', n: 'PAPER CHASE', room: 'bed', craft: 'plane', type: 'chase', bat: 90, gold: 35, silver: 55, goal: 'TAIL THE PAPER PLANE FOR 12 SECONDS',
      brief: ['A paper plane is showing off round the bedroom.', 'Get right behind it and stay there: your LOCK meter fills up while you are close.', 'Use the air brake to match its speed. Fill the meter to win.'] },
    { id: 'splash', n: 'SPLASH DOWN', room: 'bath', craft: 'heli', type: 'ducks', bat: 100, gold: 45, silver: 70, goal: 'SOAK ALL 6 RUBBER DUCKS',
      brief: ['New toy! The helicopter can hover. Climb and descend with the buttons, steer with the stick.', 'Six rubber ducks are bobbing about in the bath. Drop water balloons on them.', 'Line up above a duck, let go, and watch the splash.'] },
    { id: 'volt', n: 'BATTERY RUN', room: 'kit', craft: 'heli', type: 'batteries', bat: 45, gold: 55, silver: 80, goal: 'COLLECT ALL 10 BATTERIES',
      brief: ['Your battery is nearly flat! Ten spare batteries are hidden round the kitchen.', 'Each one you pick up gives you more time. Look on the counters, the fridge and under the table.', 'The helicopter is slow but it can hover in tight spots.'] },
    { id: 'tour', n: 'GRAND TOUR', room: 'lou', craft: 'plane', type: 'hoops', hoops: 14, dusk: true, catAwake: true, bat: 80, gold: 45, silver: 60, goal: 'FLY ALL 14 HOOPS. THE CAT IS AWAKE',
      brief: ['Evening in the lounge. The lamp is on, the telly is on, and the cat is UP.', 'Fourteen hoops, all round the room. The cat swipes at anything that flies too low near it.', 'Finish this one and you are a fully fledged Toy Squadron pilot.'] },
  ];
  const ROOMN = { kit: 'THE KITCHEN', lou: 'THE LOUNGE', bed: "JACK'S BEDROOM", bath: 'THE BATHROOM' };
  const MATES = [['JACK', 26400], ['DAVE', 19800], ['LUKE', 15200], ['CAL', 11600], ['JK', 7300], ['MOM', 2100]];

  TV.game('dc.toy', {
    three: true, stick: true, buttons: ['a', 'b', 'x'],
    help: 'Steer: arrows (Up climbs). Turbo: Z. Pea shooter / drop: X. Air brake: C. Helicopter: Z up, C down. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 64, near: 0.2, far: 320, fogCol: 0xe8eef8, fogNear: 110, fogFar: 300 }), T = T3.T, H = K.hud, F = K.font, W = K.W, HH = K.H;
      const rnd = K.rnd(1999);
      const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
      const M4 = (x, y, z, ry, sx, sy, sz, rx, rz) => new T.Matrix4().compose(V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), V3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz));
      const UNIT = { box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(0.5, 0.5, 1, 14), cyl6: new T.CylinderGeometry(0.5, 0.5, 1, 6), sph: new T.SphereGeometry(0.5, 14, 10), cone: new T.ConeGeometry(0.5, 1, 12), half: new T.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2) };
      for (const k in UNIT) T3.keep(UNIT[k]);
      const col = new T.Color();
      // merge a list of coloured parts [{g, m, c}] into one vertex-coloured geometry
      function merge(parts) {
        const pos = [], nor = [], cl = [], uv = [];
        for (const p of parts) {
          const g = (p.g || UNIT.box).index ? (p.g || UNIT.box).toNonIndexed() : (p.g || UNIT.box).clone();
          if (p.m) g.applyMatrix4(p.m);
          const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv ? g.attributes.uv.array : null;
          col.set(p.c == null ? 0xffffff : p.c);
          for (let i = 0; i < P.length; i++) { pos.push(P[i]); nor.push(N[i]); }
          for (let i = 0; i < P.length / 3; i++) { cl.push(col.r, col.g, col.b); uv.push(U ? U[i * 2] : 0, U ? U[i * 2 + 1] : 0); }
          g.dispose();
        }
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(cl, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        return geo;
      }
      const VMAT = T3.mat({ vcol: true });
      const vmesh = parts => new T.Mesh(T3.keep(merge(parts)), VMAT);
      // part helpers (centre x/y/z, size, colour)
      const bx = (x, y, z, w, h, d, c, ry, rx, rz) => ({ g: UNIT.box, m: M4(x, y, z, ry, w, h, d, rx, rz), c });
      const cy = (x, y, z, r, h, c, rx, rz, r2) => ({ g: UNIT.cyl, m: M4(x, y, z, 0, r * 2, h, (r2 == null ? r : r2) * 2, rx, rz), c });
      const sp = (x, y, z, r, c, sy, sz) => ({ g: UNIT.sph, m: M4(x, y, z, 0, r * 2, (sy == null ? r : sy) * 2, (sz == null ? r : sz) * 2), c });
      const cn = (x, y, z, r, h, c, rx, rz) => ({ g: UNIT.cone, m: M4(x, y, z, 0, r * 2, h, r * 2, rx, rz), c });

      // ---------------------------------------------------------------- textures (all painted here)
      const TX = {};
      const tex = (name, w, h, paint) => TX[name] || (TX[name] = T3.tex(w, h, paint));
      const speckle = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { const v = rnd(); g.fillStyle = `rgba(${v < 0.5 ? '0,0,0' : '255,255,255'},${a})`; g.fillRect(rnd() * w | 0, rnd() * h | 0, 1 + rnd() * 2, 1 + rnd() * 2); } };
      const wood = (c1, c2, c3) => (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = y % 64 ? c2 : c1; g.fillRect(0, y, w, 30); g.fillStyle = c3; g.fillRect(0, y + 30, w, 2); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`; g.fillRect(rnd() * w, y + rnd() * 28, 30 + rnd() * 60, 1); } g.fillStyle = c3; g.fillRect((y * 3 + 40) % w, y, 2, 30); } };
      const texs = {
        oakFloor: () => tex('oak', 256, 256, wood('#c89a5a', '#bd8f50', '#8a6030')),
        pineFloor: () => tex('pine', 256, 256, wood('#e8c48a', '#dcb87c', '#a88050')),
        kitFloor: () => tex('kitf', 128, 128, (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#f4f0e8' : '#2a3038'; g.fillRect(x * 64, y * 64, 64, 64); } g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < w; i += 64) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } speckle(g, w, h, 60, 0.06); }),
        bathFloor: () => tex('bathf', 128, 128, (g, w, h) => { g.fillStyle = '#c8e8f0'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#dff2f8' : '#b8dce8'; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30); } }),
        bathWall: () => tex('bathw', 128, 128, (g, w, h) => { g.fillStyle = '#e8f4f8'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (y === 2) ? '#4aa8d8' : '#f4fbff'; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x * 32 + 3, y * 32 + 3, 26, 4); } }),
        carpet: () => tex('carpet', 128, 128, (g, w, h) => { g.fillStyle = '#9a6a4a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1400, 0.12); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,220,180,.15)'; g.fillRect(rnd() * w, rnd() * h, 6, 1); } }),
        kitWall: () => tex('kitw', 128, 256, (g, w, h) => { g.fillStyle = '#f6eed6'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(200,170,120,.25)'; g.fillRect(x, 0, 10, h); } g.fillStyle = '#5aa8c8'; g.fillRect(0, 160, w, 14); g.fillStyle = '#e8c850'; g.fillRect(0, 174, w, 4); }),
        louWall: () => tex('louw', 128, 256, (g, w, h) => { g.fillStyle = '#e6d8b8'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(140,100,70,.18)'; g.beginPath(); g.ellipse(x + 16, y + 16, 7, 10, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(120,80,60,.14)'; g.fillRect(x + 15, y + 2, 2, 8); } }),
        bedWall: () => tex('bedw', 128, 256, (g, w, h) => { g.fillStyle = '#9cc4ee'; g.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x - 3, y, 7, 1); g.fillRect(x, y - 3, 1, 7); } g.fillStyle = '#ffd43a'; g.fillRect(0, 60, w, 6); g.fillStyle = '#e8503a'; g.fillRect(0, 66, w, 10); g.fillStyle = '#ffd43a'; g.fillRect(0, 76, w, 6); }),
        ceil: () => tex('ceil', 64, 64, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); speckle(g, w, h, 100, 0.04); }),
        view: () => tex('view', 128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a86e8'); gr.addColorStop(0.6, '#a8d8ff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, r] of [[30, 30, 9], [42, 26, 12], [56, 32, 8], [90, 50, 10], [104, 46, 7]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.fillStyle = '#4a9a3a'; g.fillRect(0, 96, w, 32); g.fillStyle = '#3a7a2a'; g.beginPath(); g.arc(28, 92, 16, 0, 7); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(26, 96, 4, 12); g.fillStyle = '#e8c070'; g.fillRect(70, 100, 40, 6); }),
        night: () => tex('night', 128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1038'); gr.addColorStop(1, '#2a3a78'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, rnd() * 90, 1, 1); g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(96, 28, 10, 0, 7); g.fill(); g.fillStyle = '#1a2a4a'; g.fillRect(0, 96, w, 32); }),
        telly: () => tex('telly', 128, 128, (g, w, h) => { g.fillStyle = '#58b8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#48b848'; g.beginPath(); g.ellipse(64, 128, 90, 50, 0, 0, 7); g.fill(); g.fillStyle = '#ffe040'; g.beginPath(); g.arc(100, 30, 14, 0, 7); g.fill(); g.strokeStyle = '#ffe040'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.beginPath(); g.moveTo(100 + Math.cos(a) * 18, 30 + Math.sin(a) * 18); g.lineTo(100 + Math.cos(a) * 24, 30 + Math.sin(a) * 24); g.stroke(); } g.fillStyle = '#f04a3a'; g.fillRect(30, 70, 26, 22); g.fillStyle = '#fff'; g.fillRect(34, 74, 8, 8); g.fillStyle = '#222'; g.fillRect(36, 92, 5, 5); g.fillRect(47, 92, 5, 5); g.fillStyle = 'rgba(255,255,255,.15)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); }),
        cereal: () => tex('cereal', 128, 128, (g, w, h) => { g.fillStyle = '#f0b020'; g.fillRect(0, 0, w, h); g.fillStyle = '#d02a2a'; g.fillRect(0, 0, w, 36); g.fillStyle = '#fff'; g.font = 'bold 17px Arial'; g.textAlign = 'center'; g.fillText('CRUNCHY', 64, 16); g.fillText("O'S", 64, 32); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 84, 30, 0, 7); g.fill(); g.fillStyle = '#e89a30'; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; g.beginPath(); g.arc(64 + Math.cos(a) * 16, 84 + Math.sin(a) * 16, 6, 0, 7); g.fill(); } g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; g.beginPath(); g.arc(64 + Math.cos(a) * 16, 84 + Math.sin(a) * 16, 2, 0, 7); g.fill(); } g.fillStyle = '#2a2a2a'; g.font = 'bold 9px Arial'; g.fillText('WITH FREE TOY!', 64, 122); }),
        milk: () => tex('milk', 64, 128, (g, w, h) => { g.fillStyle = '#f8f8ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a68c8'; g.fillRect(0, 40, w, 30); g.fillStyle = '#fff'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.fillText('MILK', 32, 62); g.fillStyle = '#2a68c8'; g.font = 'bold 9px Arial'; g.fillText('FULL FAT', 32, 100); }),
        blob: () => tex('blob', 64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
        sun: () => tex('sun', 64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 6, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,.75)'); gr.addColorStop(0.7, 'rgba(255,230,180,.35)'); gr.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
        hoop: () => tex('hoop', 64, 16, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#fff' : '#f03a2a'; g.fillRect(x, 0, 16, h); } }),
        duvet: () => tex('duvet', 64, 64, (g, w, h) => { g.fillStyle = '#3a78d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd43a'; for (let y = 8; y < h; y += 24) for (let x = 8; x < w; x += 24) { g.beginPath(); g.moveTo(x, y - 6); for (let i = 1; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? 2.5 : 6; g.lineTo(x + Math.sin(a) * r, y - Math.cos(a) * r); } g.fill(); } }),
        book: () => tex('book', 64, 64, (g, w, h) => { let x = 0; while (x < w) { const bw = 5 + rnd() * 6 | 0; g.fillStyle = ['#d83a2a', '#2a68c8', '#3aa848', '#f0b020', '#8a3ad8', '#f0f0f0', '#2a2a2a'][rnd() * 7 | 0]; g.fillRect(x, 4 + rnd() * 8, bw - 1, h); x += bw; } g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < w; i += 3) g.fillRect(i, 24, 1, 1); }),
        poster: (name, a, b, t1, t2) => tex('po' + name, 64, 128, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; g.fillRect(4, 4, w - 8, 64); g.fillStyle = '#fff'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText(t1, 32, 88); g.font = 'bold 9px Arial'; g.fillStyle = '#ffe040'; g.fillText(t2, 32, 104); g.fillStyle = a === '#2a2a2a' ? '#f0e040' : '#fff'; g.beginPath(); g.arc(32, 36, 16, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.arc(28, 32, 3, 0, 7); g.arc(38, 32, 3, 0, 7); g.fill(); g.fillRect(24, 42, 16, 3); }),
        glow: () => tex('glow', 32, 32, (g, w, h) => { const gr = g.createRadialGradient(16, 16, 1, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
        water: () => tex('water', 64, 64, (g, w, h) => { g.fillStyle = '#5ab8e8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(rnd() * w, rnd() * h, 4 + rnd() * 8, 1); } }),
        fort: () => tex('fort', 64, 64, (g, w, h) => { g.fillStyle = '#c8b8a0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 16) { g.fillRect(0, y, w, 2); for (let x = (y / 16) % 2 ? 16 : 0; x < w; x += 32) g.fillRect(x, y, 2, 16); } }),
      };
      const SKIN = {}; // the materials
      const skin = (name, p) => SKIN[name] || (SKIN[name] = T3.mat(p()));

      // ---------------------------------------------------------------- particles
      const PN = 320;
      const PT = { pos: new Float32Array(PN * 3), col: new Float32Array(PN * 3), vel: new Float32Array(PN * 3), life: new Float32Array(PN), grav: new Float32Array(PN), n: 0 };
      for (let i = 0; i < PN; i++) PT.pos[i * 3 + 1] = -999;
      const pGeo = T3.keep(new T.BufferGeometry()); pGeo.setAttribute('position', new T.BufferAttribute(PT.pos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(PT.col, 3));
      const pMat = new T.PointsMaterial({ size: 0.42, vertexColors: true, map: texs.glow(), transparent: true, depthWrite: false, sizeAttenuation: true });
      const points = new T.Points(pGeo, pMat); points.frustumCulled = false; T3.add(points);
      function puff(x, y, z, vx, vy, vz, life, c, grav) {
        const i = PT.n; PT.n = (PT.n + 1) % PN; col.set(c);
        PT.pos[i * 3] = x; PT.pos[i * 3 + 1] = y; PT.pos[i * 3 + 2] = z; PT.vel[i * 3] = vx; PT.vel[i * 3 + 1] = vy; PT.vel[i * 3 + 2] = vz;
        PT.col[i * 3] = col.r; PT.col[i * 3 + 1] = col.g; PT.col[i * 3 + 2] = col.b; PT.life[i] = life; PT.grav[i] = grav == null ? 6 : grav;
      }
      function burst(x, y, z, n, c, sp, life, grav) { for (let i = 0; i < n; i++) { const a = rnd() * 6.283, b = rnd() * 3.14, s = sp * (0.4 + rnd() * 0.8); puff(x, y, z, Math.cos(a) * Math.sin(b) * s, Math.cos(b) * s, Math.sin(a) * Math.sin(b) * s, life * (0.6 + rnd() * 0.6), Array.isArray(c) ? c[rnd() * c.length | 0] : c, grav); } }
      function updParts(dt) {
        for (let i = 0; i < PN; i++) {
          if (PT.life[i] <= 0) continue; PT.life[i] -= dt;
          if (PT.life[i] <= 0) { PT.pos[i * 3 + 1] = -999; continue; }
          PT.vel[i * 3 + 1] -= PT.grav[i] * dt; PT.pos[i * 3] += PT.vel[i * 3] * dt; PT.pos[i * 3 + 1] += PT.vel[i * 3 + 1] * dt; PT.pos[i * 3 + 2] += PT.vel[i * 3 + 2] * dt;
        }
        pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
      }

      // ---------------------------------------------------------------- the craft: a toy plane and a toy helicopter
      function planeModel() {
        const RED = 0xe23a2a, CREAM = 0xf6ecd0, DARK = 0x2a2a30;
        const P = [
          cy(0, 0, 0.2, 0.42, 2.6, RED, Math.PI / 2),              // fuselage
          { g: UNIT.half, m: M4(0, 0, 1.5, 0, 0.84, 0.6, 0.84, Math.PI / 2), c: CREAM }, // nose cowl
          cy(0, 0, -1.2, 0.3, 0.6, RED, Math.PI / 2, 0, 0.25),     // tail cone
          bx(0, 0.05, 0.25, 4.4, 0.12, 1.0, CREAM),                // main wing
          bx(-1.9, 0.05, 0.25, 0.6, 0.14, 1.02, RED), bx(1.9, 0.05, 0.25, 0.6, 0.14, 1.02, RED), // wing tips
          bx(0, 0.3, -1.25, 1.7, 0.08, 0.6, CREAM),                // tail plane
          bx(0, 0.62, -1.3, 0.08, 0.7, 0.6, RED),                  // fin
          bx(0, 0.5, 0.2, 0.5, 0.36, 0.7, 0x3a7ad8),               // canopy
          sp(0, 0.62, 0.2, 0.17, 0x3aa848), sp(0, 0.62, 0.2, 0.18, 0x3aa848, 0.12, 0.18), // the toy soldier pilot (a green dome helmet)
          cy(-0.55, -0.5, 0.6, 0.18, 0.14, DARK, 0, Math.PI / 2), cy(0.55, -0.5, 0.6, 0.18, 0.14, DARK, 0, Math.PI / 2), // wheels
          bx(-0.5, -0.3, 0.6, 0.08, 0.3, 0.08, 0x888888), bx(0.5, -0.3, 0.6, 0.08, 0.3, 0.08, 0x888888),
          bx(0, 0.0, -0.4, 0.46, 0.46, 0.06, 0xf0c020),            // a yellow band
        ];
        const g = new T.Group(); g.add(vmesh(P));
        const prop = vmesh([bx(0, 0, 0, 0.12, 1.5, 0.05, DARK), bx(0, 0, 0, 1.5, 0.12, 0.05, DARK), sp(0, 0, 0, 0.14, 0xf0c020)]); prop.position.z = 1.84; g.add(prop);
        const disc = new T.Mesh(T3.keep(new T.CircleGeometry(0.78, 16)), T3.mat({ color: 0x333333, lit: false, transparent: true, opacity: 0.25, side: T.DoubleSide })); disc.position.z = 1.84; g.add(disc);
        return { g, prop, disc, len: 2.0 };
      }
      function heliModel() {
        const YEL = 0xf0b820, DARK = 0x2a2a30;
        const P = [
          sp(0, 0, 0.1, 0.55, YEL, 0.5, 0.9),                      // cabin
          sp(0, 0.08, 0.5, 0.42, 0x3a7ad8, 0.36, 0.5),             // windscreen bubble
          bx(0, 0.15, -1.1, 0.22, 0.22, 1.8, YEL),                 // tail boom
          bx(0, 0.5, -1.95, 0.06, 0.6, 0.4, 0xe23a2a),             // tail fin
          cy(0, 0.55, 0.05, 0.08, 0.5, DARK),                      // rotor mast
          bx(-0.45, -0.55, 0.1, 0.08, 0.06, 1.3, DARK), bx(0.45, -0.55, 0.1, 0.08, 0.06, 1.3, DARK), // skids
          bx(-0.3, -0.4, -0.2, 0.3, 0.3, 0.06, 0x888888, 0, 0, 0.6), bx(0.3, -0.4, -0.2, 0.3, 0.3, 0.06, 0x888888, 0, 0, -0.6),
          bx(-0.3, -0.4, 0.4, 0.3, 0.3, 0.06, 0x888888, 0, 0, 0.6), bx(0.3, -0.4, 0.4, 0.3, 0.3, 0.06, 0x888888, 0, 0, -0.6),
          sp(0, 0.1, 0.1, 0.16, 0x3aa848), // pilot helmet peeking out
        ];
        const g = new T.Group(); g.add(vmesh(P));
        const prop = vmesh([bx(0, 0, 0, 0.12, 0.04, 3.2, DARK), bx(0, 0, 0, 3.2, 0.04, 0.12, DARK), sp(0, 0, 0, 0.12, 0xe23a2a)]); prop.position.y = 0.82; g.add(prop);
        const disc = new T.Mesh(T3.keep(new T.CircleGeometry(1.62, 20)), T3.mat({ color: 0x333333, lit: false, transparent: true, opacity: 0.22, side: T.DoubleSide })); disc.rotation.x = Math.PI / 2; disc.position.y = 0.82; g.add(disc);
        const tail = vmesh([bx(0, 0, 0, 0.04, 0.7, 0.07, DARK), bx(0, 0, 0, 0.04, 0.07, 0.7, DARK)]); tail.position.set(0.14, 0.5, -1.95); g.add(tail);
        return { g, prop, disc, tail, len: 2.2 };
      }

      // ---------------------------------------------------------------- the rooms (each built fresh for a mission; disposed after)
      let RM = null; // { w, d, h, solids, meshes, geos, mats, anim: [], cat, lamp, ... }
      function dropRoom() {
        if (!RM) return;
        for (const m of RM.meshes) { T3.scene.remove(m); }
        for (const g of RM.geos) g.dispose(); for (const m of RM.mats) m.dispose();
        RM = null;
      }
      const addM = m => { T3.add(m); RM.meshes.push(m); return m; };
      const geo = g => { RM.geos.push(g); return g; };
      const RMAT = p => { const m = T3.mat(p); RM.mats.push(m); return m; };
      // a room shell: floor, ceiling, walls, skirting, a window with a view and a patch of sun
      function shell(w, d, h, floorTex, floorRep, wallTex, o) {
        RM.w = w; RM.d = d; RM.h = h;
        const fl = floorTex.clone(); fl.needsUpdate = true; fl.repeat.set(floorRep, floorRep * d / w); RM.texs.push(fl);
        const floor = new T.Mesh(geo(new T.PlaneGeometry(w, d)), RMAT({ map: fl })); floor.rotation.x = -Math.PI / 2; addM(floor);
        const ceil = new T.Mesh(geo(new T.PlaneGeometry(w, d)), RMAT({ map: texs.ceil(), color: o.dusk ? 0x707088 : 0xffffff })); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; addM(ceil);
        const wm = (len) => { const t = wallTex.clone(); t.needsUpdate = true; t.repeat.set(len / 8, h / 16); RM.texs.push(t); return RMAT({ map: t, color: o.dusk ? 0x8888a8 : 0xffffff }); };
        const walls = [[0, h / 2, -d / 2, 0, w], [0, h / 2, d / 2, Math.PI, w], [-w / 2, h / 2, 0, Math.PI / 2, d], [w / 2, h / 2, 0, -Math.PI / 2, d]];
        for (const [x, y, z, ry, len] of walls) { const m = new T.Mesh(geo(new T.PlaneGeometry(len, h)), wm(len)); m.position.set(x, y, z); m.rotation.y = ry; addM(m); }
        // skirting board, coving
        const P = [];
        for (const [x, z, len, ry] of [[0, -d / 2 + 0.15, w, 0], [0, d / 2 - 0.15, w, 0], [-w / 2 + 0.15, 0, d, Math.PI / 2], [w / 2 - 0.15, 0, d, Math.PI / 2]]) { P.push(bx(x, 0.5, z, len, 1, 0.3, 0xf4f0e8, ry)); P.push(bx(x, h - 0.4, z, len, 0.8, 0.3, 0xf4f0e8, ry)); }
        addM(vmesh(P));
        RM.solids.push({ x0: -w / 2, x1: w / 2, y0: -5, y1: 0, z0: -d / 2, z1: d / 2, floor: true });
        // the window on the back wall: frame, glass with a view, sun on the floor (or a lamp-lit night)
        const wx = o.wx == null ? w * 0.15 : o.wx, ww = 11, wh = 9, wy = h * 0.55;
        const night = !!o.dusk;
        const Fp = [bx(wx, wy + wh / 2 + 0.3, -d / 2 + 0.35, ww + 1.2, 0.6, 0.5, 0xffffff), bx(wx, wy - wh / 2 - 0.3, -d / 2 + 0.35, ww + 1.2, 0.6, 0.7, 0xffffff), bx(wx - ww / 2 - 0.3, wy, -d / 2 + 0.35, 0.6, wh, 0.5, 0xffffff), bx(wx + ww / 2 + 0.3, wy, -d / 2 + 0.35, 0.6, wh, 0.5, 0xffffff), bx(wx, wy, -d / 2 + 0.3, 0.3, wh, 0.3, 0xffffff), bx(wx, wy, -d / 2 + 0.3, ww, 0.3, 0.3, 0xffffff)];
        if (o.curtains) { Fp.push(bx(wx - ww / 2 - 1.8, wy - 1, -d / 2 + 0.9, 2.6, wh + 4, 0.8, o.curtCol || 0xd84a3a)); Fp.push(bx(wx + ww / 2 + 1.8, wy - 1, -d / 2 + 0.9, 2.6, wh + 4, 0.8, o.curtCol || 0xd84a3a)); Fp.push(cy(wx, wy + wh / 2 + 1.4, -d / 2 + 0.9, 0.2, ww + 7, 0x8a6a3a, 0, Math.PI / 2)); }
        addM(vmesh(Fp));
        const glass = new T.Mesh(geo(new T.PlaneGeometry(ww, wh)), RMAT({ map: night ? texs.night() : texs.view(), lit: false, fog: false })); glass.position.set(wx, wy, -d / 2 + 0.12); addM(glass);
        if (!night) {
          const sun = new T.Mesh(geo(new T.PlaneGeometry(ww * 1.9, wh * 1.6)), RMAT({ map: texs.sun(), lit: false, transparent: true, depthWrite: false })); sun.material.blending = T.AdditiveBlending; sun.rotation.x = -Math.PI / 2; sun.position.set(wx + 3, 0.05, -d / 2 + 9); addM(sun);
          const shaft = new T.Mesh(geo(new T.PlaneGeometry(ww, 18)), RMAT({ color: 0xfff0c0, lit: false, transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide })); shaft.material.blending = T.AdditiveBlending; shaft.position.set(wx + 1.5, wy - 4, -d / 2 + 5); shaft.rotation.x = -0.55; addM(shaft);
        }
        // an "exit" door on the front wall for looks
        addM(vmesh([bx(w * 0.3, 5.5, d / 2 - 0.3, 6.5, 11, 0.4, o.doorCol || 0xf4f0e8), bx(w * 0.3, 5.5, d / 2 - 0.42, 5.5, 10, 0.2, o.doorCol2 || 0xe8e0d0), sp(w * 0.3 - 2.4, 5.5, d / 2 - 0.65, 0.3, 0xd8b030)]));
      }
      // a solid lump of furniture: a visual box AND a collision box (bottom-anchored)
      function solid(x, y0, z, w, h, d, c, P) { if (P) P.push(bx(x, y0 + h / 2, z, w, h, d, c)); RM.solids.push({ x0: x - w / 2, x1: x + w / 2, y0, y1: y0 + h, z0: z - d / 2, z1: z + d / 2 }); }
      function blobShadow(x, z, w, d, y) { const m = new T.Mesh(geo(new T.PlaneGeometry(w, d)), skin('blob', () => ({ map: texs.blob(), lit: false, transparent: true, depthWrite: false }))); m.rotation.x = -Math.PI / 2; m.position.set(x, (y || 0) + 0.04, z); addM(m); return m; }
      function texBox(x, y, z, w, h, d, map, c) { const m = new T.Mesh(geo(new T.BoxGeometry(w, h, d)), RMAT({ map, color: c == null ? 0xffffff : c })); m.position.set(x, y, z); addM(m); return m; }
      function poster(x, y, z, ry, name, a, b, t1, t2) { const m = new T.Mesh(geo(new T.PlaneGeometry(4.5, 9)), RMAT({ map: texs.poster(name, a, b, t1, t2) })); m.position.set(x, y, z); m.rotation.y = ry; addM(m); }
      function table(x, z, w, d, hgt, top, legc, P) { solid(x, hgt - 0.5, z, w, 0.5, d, top, P); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { P.push(cy(x + sx * (w / 2 - 0.8), (hgt - 0.5) / 2, z + sz * (d / 2 - 0.8), 0.4, hgt - 0.5, legc)); RM.solids.push({ x0: x + sx * (w / 2 - 0.8) - 0.4, x1: x + sx * (w / 2 - 0.8) + 0.4, y0: 0, y1: hgt, z0: z + sz * (d / 2 - 0.8) - 0.4, z1: z + sz * (d / 2 - 0.8) + 0.4 }); } blobShadow(x, z, w * 1.3, d * 1.3); }
      function chair(x, z, ry, c, P) { const s = Math.sin(ry), co = Math.cos(ry); const p = (dx, dz) => [x + dx * co + dz * s, z - dx * s + dz * co]; let q = p(0, 0); solid(q[0], 4, q[1], 3.2, 0.4, 3.2, c, P); for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { q = p(dx, dz); P.push(cy(q[0], 2, q[1], 0.18, 4, c)); } q = p(0, -1.45); P.push(bx(q[0], 6.2, q[1], 3.2, 4, 0.3, c, ry)); RM.solids.push({ x0: q[0] - 1.7, x1: q[0] + 1.7, y0: 4, y1: 8.2, z0: q[1] - 1.7, z1: q[1] + 1.7 }); }
      // the sleeping (or not) cat: a grey tabby
      function makeCat(x, z, ry) {
        const GREY = 0x8a8a92, DK = 0x5a5a66, PINK = 0xe89aa0;
        const body = vmesh([sp(0, 0.9, 0, 1.9, GREY, 0.95, 1.4), bx(0, 1.3, 0.2, 0.5, 0.9, 1.6, DK), bx(0, 1.3, -0.9, 0.5, 0.7, 0.9, DK), sp(0, 0.6, 1.3, 0.9, GREY, 0.6, 1.1)]);
        const head = vmesh([sp(0, 0, 0, 1.0, GREY), cn(-0.6, 0.85, 0, 0.3, 0.7, GREY), cn(0.6, 0.85, 0, 0.3, 0.7, GREY), cn(-0.6, 0.85, 0.05, 0.16, 0.45, PINK), cn(0.6, 0.85, 0.05, 0.16, 0.45, PINK), sp(0, -0.25, 0.95, 0.14, PINK), bx(0, 0.2, 0.3, 0.3, 0.6, 1.4, DK)]);
        const eyes = vmesh([sp(-0.38, 0.1, 0.85, 0.17, 0x8ae040), sp(0.38, 0.1, 0.85, 0.17, 0x8ae040), sp(-0.38, 0.1, 0.98, 0.07, 0x111111), sp(0.38, 0.1, 0.98, 0.07, 0x111111)]);
        const lids = vmesh([bx(-0.38, 0.14, 0.9, 0.42, 0.14, 0.2, GREY), bx(0.38, 0.14, 0.9, 0.42, 0.14, 0.2, GREY)]);
        head.add(eyes); head.add(lids);
        const tail = new T.Group(); let px = 0, pz = -2.2; for (let i = 0; i < 6; i++) { const s = vmesh([sp(0, 0, 0, 0.32 - i * 0.02, i === 5 ? DK : GREY)]); s.position.set(px, 0.5 + i * 0.05, pz); tail.add(s); px -= 0.45; pz -= 0.3; }
        const g = new T.Group(); g.add(body); g.add(head); g.add(tail); g.position.set(x, 0, z); g.rotation.y = ry || 0; addM(g);
        blobShadow(x, z, 7, 6);
        const cat = { g, head, eyes, lids, tail, x, z, ry: ry || 0, awake: 0, swat: 0, meow: 0, hit: 0, walk: null, mode: 'sleep', r: 2.6, top: 2.6 };
        RM.cat = cat; catPose(cat, 0);
        return cat;
      }
      function catPose(cat, t) {
        const aw = cat.awake > 0 || cat.mode === 'prowl';
        cat.head.position.set(0, aw ? 2.4 : 1.4, aw ? 1.9 : 2.0); cat.head.rotation.x = aw ? 0 : 0.5; cat.head.rotation.z = aw ? Math.sin(t * 2) * 0.1 : 0.3;
        cat.lids.visible = !aw; cat.eyes.visible = aw;
        cat.tail.rotation.y = aw ? Math.sin(t * 5) * 0.5 : Math.sin(t * 0.7) * 0.08;
        cat.g.position.y = aw ? 0.4 : 0;
      }
      // ---- the rooms themselves
      const BUILD = {
        bed(o) {
          shell(44, 36, 24, texs.pineFloor(), 5, texs.bedWall(), Object.assign({ wx: 6, curtains: true, curtCol: 0x3a78d8 }, o));
          const P = [];
          // bunk bed along the left wall
          const bxp = -16, bz = -6;
          solid(bxp, 0, bz, 10, 3.2, 20, 0x8a5a2a, P); P.push(bx(bxp, 3.6, bz, 9.6, 1.0, 19.6, 0xf4f0e8)); solid(bxp, 3.9, bz, 9.4, 0.3, 19.4, 0x3a78d8, null);
          const duv = texBox(bxp - 0.2, 4.6, bz - 1, 9.4, 1.2, 15, texs.duvet()); P.push(bx(bxp, 4.7, bz + 8.5, 6, 1.4, 3, 0xffffff));
          solid(bxp, 9.5, bz, 10, 1.2, 20, 0x8a5a2a, P); P.push(bx(bxp, 10.4, bz, 9.6, 0.8, 19.6, 0xf4f0e8)); texBox(bxp + 0.2, 11.3, bz + 1, 9.2, 1.0, 15, texs.duvet(), 0xff9090); P.push(bx(bxp, 11.3, bz - 8.5, 6, 1.2, 3, 0xffffff));
          for (const [dx, dz] of [[-4.6, -9.6], [4.6, -9.6], [-4.6, 9.6], [4.6, 9.6]]) { P.push(bx(bxp + dx, 6.2, bz + dz, 0.7, 12.4, 0.7, 0x8a5a2a)); RM.solids.push({ x0: bxp + dx - 0.35, x1: bxp + dx + 0.35, y0: 0, y1: 12.4, z0: bz + dz - 0.35, z1: bz + dz + 0.35 }); }
          P.push(bx(bxp, 10.6, bz - 9.6, 9.6, 2.4, 0.4, 0x8a5a2a)); P.push(bx(bxp, 10.6, bz + 9.6, 9.6, 2.4, 0.4, 0x8a5a2a)); // rails
          for (let i = 0; i < 5; i++) P.push(bx(bxp + 5.3, 2 + i * 1.9, bz + 6, 0.5, 0.3, 2.2, 0xa87040)); P.push(bx(bxp + 5.3, 5.5, bz + 4.9, 0.4, 10, 0.4, 0xa87040)); P.push(bx(bxp + 5.3, 5.5, bz + 7.1, 0.4, 10, 0.4, 0xa87040)); // ladder
          // a desk with a beige computer under the window; a wardrobe; toy box; rug; blocks; football
          table(6, -14, 12, 5, 7, 0xd8b888, 0xc0a070, P);
          solid(4, 7, -14.5, 4.4, 1.4, 4, 0xe8e0d0, P); solid(4, 8.4, -14.5, 4.2, 3.6, 3.6, 0xe8e0d0, P); P.push(bx(4, 8.6, -12.65, 3.2, 2.4, 0.1, 0x2a58b8)); P.push(bx(9.5, 7.2, -13.5, 4, 0.4, 1.6, 0xe8e0d0));
          solid(17, 0, -10, 8, 18, 6, 0xa87040, P); P.push(bx(17, 9, -6.95, 7.4, 17, 0.2, 0xb88050)); P.push(bx(17, 9, -6.9, 0.15, 16, 0.3, 0x5a3a1a)); P.push(sp(16.2, 9, -6.8, 0.25, 0xd8b030)); P.push(sp(17.8, 9, -6.8, 0.25, 0xd8b030)); // wardrobe
          solid(12, 0, 9, 7, 4, 5, 0xd83a2a, P); P.push(bx(12, 4.6, 9 - 1.2, 7.2, 1.2, 2.6, 0xf0b020)); P.push(bx(12, 5.6, 7.6, 7.2, 0.4, 5.2, 0xf0b020, 0, -1.1)); // toy box, lid open
          P.push(sp(11, 4.6, 9.8, 0.8, 0x3aa848)); P.push(bx(13.2, 4.5, 9.5, 1.4, 1.0, 1.0, 0x2a68c8)); P.push(sp(12, 4.5, 10.4, 0.6, 0xf0f0f0));
          const rug = new T.Mesh(geo(new T.CircleGeometry(7, 24)), RMAT({ color: 0xf0b020 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.03, 4); addM(rug);
          const rug2 = new T.Mesh(geo(new T.CircleGeometry(4.5, 24)), RMAT({ color: 0xe23a2a })); rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.05, 4); addM(rug2);
          for (let i = 0; i < 4; i++) solid(-4, i * 2.2, 13, 2.2, 2.2, 2.2, [0xd83a2a, 0x2a68c8, 0xf0b020, 0x3aa848][i], P); P.push(bx(-4, 8.8, 13, 2.2, 0.2, 2.2, 0xffffff)); // blocks tower
          solid(6, 0, 15, 2.6, 2.6, 2.6, 0xffffff, null); P.push(sp(6, 1.3, 15, 1.3, 0xffffff)); P.push(bx(6, 1.3, 15, 2.65, 0.5, 0.5, 0x222222)); P.push(bx(6, 1.3, 15, 0.5, 0.5, 2.65, 0x222222)); // football
          poster(-6, 15, -17.85, 0, 'zip', '#2a2a2a', '#3a78d8', 'ZIP', 'ADVENTURE'); poster(-11, 14, -17.85, 0, 'kart', '#d83a2a', '#f0b020', 'KART KAOS', '64');
          poster(21.85, 14, 6, -Math.PI / 2, 'ja', '#f0b020', '#d83a2a', 'JACK', 'ATTACK!');
          addM(vmesh(P));
          blobShadow(bxp, bz, 14, 24); blobShadow(17, -10, 11, 9); blobShadow(12, 9, 10, 8);
          const lava = new T.Mesh(geo(new T.CylinderGeometry(0.5, 0.8, 3, 10)), RMAT({ color: 0xff6a3a, emissive: 0x802010 })); lava.position.set(10.5, 8.9, -15); addM(lava);
          if (o.cat) makeCat(0, 4, 2.2);
        },
        lou(o) {
          shell(56, 40, 26, texs.oakFloor(), 6, texs.louWall(), Object.assign({ wx: -8, curtains: true, curtCol: 0x8a3a3a, dusk: o.dusk }, o));
          const P = [];
          // a big rug in the middle
          const rug = new T.Mesh(geo(new T.PlaneGeometry(24, 16)), RMAT({ map: texs.carpet(), color: 0xc8a080 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.03, 2); addM(rug);
          const rugb = new T.Mesh(geo(new T.PlaneGeometry(26, 18)), RMAT({ color: 0x6a3a2a })); rugb.rotation.x = -Math.PI / 2; rugb.position.set(0, 0.02, 2); addM(rugb);
          // sofa (back to the right wall), armchair, coffee table, telly on its stand on the left
          solid(18, 0, 2, 7, 4.5, 20, 0x3a6a9a, P); P.push(bx(21.2, 5.5, 2, 1.4, 6.5, 20, 0x2a5a8a)); RM.solids.push({ x0: 20.5, x1: 22, y0: 0, y1: 8.8, z0: -8, z1: 12 });
          P.push(bx(18, 5.2, -8.5, 7, 1.4, 1.6, 0x2a5a8a)); P.push(bx(18, 5.2, 12.5, 7, 1.4, 1.6, 0x2a5a8a)); RM.solids.push({ x0: 14.5, x1: 21.5, y0: 4.5, y1: 5.9, z0: -9.3, z1: -7.7 }); RM.solids.push({ x0: 14.5, x1: 21.5, y0: 4.5, y1: 5.9, z0: 11.7, z1: 13.3 });
          P.push(bx(17.5, 5.3, -3, 3.5, 2.6, 3.5, 0xf0b020, 0.3)); P.push(bx(17.5, 5.3, 7, 3.5, 2.6, 3.5, 0xd83a2a, -0.2)); // cushions
          chair(-14, 14, 2.4, 0x7a4a3a, P); P.push(bx(-14, 4.8, 14, 3.4, 1.4, 3.4, 0x9a5a4a, 2.4));
          table(0, 2, 10, 5, 4.5, 0x8a5a2a, 0x6a4a2a, P); P.push(cy(-2.5, 4.9, 2, 1.0, 0.6, 0xf4f4f4)); P.push(cy(2.5, 4.9, 2.5, 0.5, 0.8, 0xd83a2a, 0, 0, 0.5)); // a mug and a remote
          // telly stand and telly against the back wall
          solid(-8, 0, -16, 10, 3.5, 5, 0x3a3a3a, P); solid(-8, 3.5, -16, 8, 6.5, 6, 0x5a5a60, P); P.push(bx(-8, 7.2, -13.5, 7, 5.4, 0.4, 0x202020)); P.push(bx(-5.4, 4.6, -13.4, 0.5, 0.5, 0.2, 0xd83a2a));
          const screen = new T.Mesh(geo(new T.PlaneGeometry(6.2, 4.6)), RMAT({ map: texs.telly(), lit: false, fog: false })); screen.position.set(-8, 7.3, -13.3); addM(screen); RM.screen = screen;
          P.push(bx(-5, 3.6, -14, 1.5, 0.3, 2.2, 0x2a2a30)); // a video player slot
          // bookshelf on the right back
          solid(16, 0, -16.5, 12, 14, 4, 0x8a5a2a, P); for (let i = 0; i < 3; i++) { const bk = texBox(16, 3 + i * 4, -15.2, 11, 3.2, 1.6, texs.book()); }
          // sideboard with the goldfish bowl (left wall)
          solid(-22, 0, 4, 6, 6, 14, 0xa87040, P); P.push(bx(-19.1, 3, 4, 0.1, 5.4, 13.4, 0xb88050)); P.push(sp(-19.0, 3, 1, 0.25, 0xd8b030)); P.push(sp(-19.0, 3, 7, 0.25, 0xd8b030));
          const bowl = new T.Mesh(geo(new T.SphereGeometry(2.2, 16, 12)), RMAT({ color: 0xa8e0ff, transparent: true, opacity: 0.35 })); bowl.position.set(-22, 8.2, 2); addM(bowl);
          const water = new T.Mesh(geo(new T.SphereGeometry(2.0, 14, 10)), RMAT({ color: 0x4ab0e8, transparent: true, opacity: 0.4 })); water.position.set(-22, 8.0, 2); addM(water);
          RM.solids.push({ x0: -24.2, x1: -19.8, y0: 6, y1: 10.4, z0: -0.2, z1: 4.2 });
          const fish = vmesh([sp(0, 0, 0, 0.45, 0xff8a1a, 0.3, 0.25), cn(0, 0, -0.55, 0.25, 0.5, 0xffb040, Math.PI / 2)]); fish.position.set(-22, 8, 2); addM(fish); RM.anim.push(t => { fish.position.set(-22 + Math.cos(t * 1.3) * 1.1, 8 + Math.sin(t * 2.1) * 0.4, 2 + Math.sin(t * 1.3) * 1.1); fish.rotation.y = -t * 1.3 + Math.PI / 2; });
          P.push(cy(-22, 6.4, 9, 1.4, 0.8, 0xd8c0a0)); P.push(sp(-22, 7.8, 9, 1.3, 0x3aa848, 1.6, 1.3)); // a plant
          // the standard lamp in the corner (lit at dusk)
          P.push(cy(-22, 7, -14, 0.25, 14, 0x8a6a3a)); P.push(cy(-22, 1, -14, 2.2, 0.6, 0x5a4a3a)); const shade = new T.Mesh(geo(new T.CylinderGeometry(2.2, 3, 3.5, 14, 1, true)), RMAT({ color: o.dusk ? 0xffe8a0 : 0xf4e8c0, emissive: o.dusk ? 0xffd070 : 0x000000, side: T.DoubleSide })); shade.position.set(-22, 15.5, -14); addM(shade);
          RM.solids.push({ x0: -24.5, x1: -19.5, y0: 0, y1: 17.5, z0: -16.5, z1: -11.5 });
          if (o.dusk) { const L = new T.PointLight(0xffd080, 1.1, 60, 1.5); L.position.set(-22, 15, -14); addM(L); const L2 = new T.PointLight(0x80b0ff, 0.6, 40, 1.5); L2.position.set(-8, 8, -11); addM(L2); }
          // a fireplace on the front wall with a mantelpiece and a clock
          solid(-6, 0, 18, 12, 10, 3, 0xc8b8a0, P); P.push(bx(-6, 4, 16.4, 7, 7, 0.4, 0x202020)); P.push(bx(-6, 10.3, 17.5, 13, 0.6, 4, 0x8a5a2a)); P.push(cy(-6, 12, 17.5, 1.4, 0.6, 0xf4f4f4, Math.PI / 2)); P.push(bx(-6, 12.5, 17.1, 0.15, 1.1, 0.1, 0x222222));
          P.push(cy(-10, 11.4, 17.5, 0.5, 1.6, 0x3a78d8)); P.push(sp(-2, 11.4, 17.5, 0.9, 0xd8b030, 0.9, 0.5)); // a vase and a trophy-ish thing
          addM(vmesh(P));
          blobShadow(18, 2, 11, 26); blobShadow(0, 2, 13, 8); blobShadow(-8, -16, 13, 8); blobShadow(16, -16.5, 15, 7); blobShadow(-22, 4, 9, 18); blobShadow(-14, 14, 7, 7);
          if (o.cat !== false) makeCat(-6, 5, 0.6);
        },
        kit(o) {
          shell(50, 36, 26, texs.kitFloor(), 8, texs.kitWall(), Object.assign({ wx: 0, doorCol: 0xd8d0c0 }, o));
          const P = [];
          // counters along the back wall (under the window) with a sink, a cooker to the right, the fridge to the left
          solid(-10, 0, -15.5, 20, 9, 5, 0xe8e0d0, P); P.push(bx(-10, 9.2, -15.5, 20.4, 0.5, 5.4, 0x6a6a72)); for (let i = 0; i < 4; i++) { P.push(bx(-17.5 + i * 5, 4.5, -12.9, 4.6, 8, 0.2, 0xf4ece0)); P.push(bx(-17.5 + i * 5, 7.5, -12.75, 2.5, 0.3, 0.3, 0x9a9aa0)); }
          P.push(bx(-10, 9.4, -15.5, 6, 0.4, 3.5, 0xc0c0c8)); P.push(bx(-10, 9.5, -15.5, 5, 0.6, 2.6, 0x8a8a92)); P.push(cy(-10, 11.5, -16.8, 0.2, 4, 0xd0d0d8)); P.push(cy(-10, 13.4, -15.6, 0.2, 2.6, 0xd0d0d8, Math.PI / 2)); // the sink and tap
          solid(8, 0, -15.5, 8, 9, 5, 0xf4f4f4, P); P.push(bx(8, 9.3, -15.5, 8.2, 0.4, 5.2, 0x2a2a30)); for (const [dx, dz] of [[-2, -1.2], [2, -1.2], [-2, 1.2], [2, 1.2]]) P.push(cy(8 + dx, 9.6, -15.5 + dz, 1.1, 0.2, 0x3a3a40)); P.push(bx(8, 4.5, -12.9, 7, 6, 0.2, 0x3a3a40)); P.push(bx(8, 8, -12.8, 6, 0.4, 0.3, 0xd0d0d8)); // cooker
          P.push(bx(8, 12.5, -17.5, 8, 7, 1, 0xe8e0d0)); RM.solids.push({ x0: 4, x1: 12, y0: 9, y1: 16, z0: -18, z1: -17 }); // splashback/hood
          solid(-21, 0, -14, 7, 19, 7, 0xf4f4f8, P); P.push(bx(-21, 7, -10.4, 6.4, 0.2, 0.2, 0x9a9aa0)); P.push(bx(-21, 13, -10.4, 6.4, 0.2, 0.2, 0x9a9aa0)); P.push(bx(-18.5, 15, -10.3, 0.4, 5, 0.4, 0xb0b0b8)); P.push(bx(-18.5, 4, -10.3, 0.4, 5, 0.4, 0xb0b0b8)); P.push(bx(-20, 10, -10.35, 1.2, 1.6, 0.1, 0xf0b020)); P.push(bx(-21.5, 15, -10.35, 1.6, 1.1, 0.1, 0x3aa848)); // fridge with magnets
          // the big table in the middle, four chairs
          table(2, 2, 18, 10, 7.5, 0xe8c48a, 0xc8a060, P);
          chair(-5, 9, 0, 0xc8a060, P); chair(9, 9, 0.3, 0xc8a060, P); chair(-3, -5, Math.PI, 0xc8a060, P); chair(9, -5, Math.PI - 0.3, 0xc8a060, P);
          // on the table: cereal box, milk, bowl, toaster, sugar bowl
          texBox(-3, 7.5 + 2.7, 1, 2.6, 5.4, 1.1, texs.cereal()); RM.solids.push({ x0: -4.3, x1: -1.7, y0: 7.5, y1: 12.9, z0: 0.45, z1: 1.55 });
          texBox(0.5, 7.5 + 1.8, 4.5, 1.4, 3.6, 1.4, texs.milk()); RM.solids.push({ x0: -0.2, x1: 1.2, y0: 7.5, y1: 11.1, z0: 3.8, z1: 5.2 });
          P.push(cy(3, 7.9, 3.5, 1.5, 0.9, 0xf4f4f4, 0, 0, 1.5)); P.push(cy(3, 8.3, 3.5, 1.2, 0.2, 0xd8b888)); RM.solids.push({ x0: 1.5, x1: 4.5, y0: 7.5, y1: 8.5, z0: 2, z1: 5 }); // bowl of cereal
          solid(7.5, 7.5, 0, 2.8, 1.9, 2, 0xc8c8d0, P); P.push(bx(7.5, 9.45, 0, 2.6, 0.1, 1.8, 0x2a2a30)); P.push(bx(9.1, 8.6, 0, 0.2, 0.6, 0.3, 0x2a2a30)); // the toaster
          RM.toast = [0, 1].map(i => { const m = vmesh([bx(0, 0, 0, 1.3, 1.4, 0.35, 0xd8a050), bx(0, 0.3, 0, 1.0, 0.8, 0.37, 0xf0d0a0)]); m.position.set(7.5 + (i - 0.5) * 0.9, 8.2, 0); addM(m); return m; }); RM.toastT = 0;
          P.push(cy(-5, 7.9, -2, 1.1, 0.8, 0xf4f4f4)); P.push(cy(-5, 8.4, -2, 0.9, 0.3, 0xffffff)); RM.sugar = { x: -5, y: 9.3, z: -2 }; RM.solids.push({ x0: -6.1, x1: -3.9, y0: 7.5, y1: 8.6, z0: -3.1, z1: -0.9 }); // the sugar bowl
          // the toy fort on the floor by the fridge, soldiers, a flag; a bin; cat bowl
          const fortX = -14, fortZ = 8;
          texBox(fortX, 1.5, fortZ, 8, 3, 8, texs.fort()); RM.solids.push({ x0: fortX - 4, x1: fortX + 4, y0: 0, y1: 3, z0: fortZ - 4, z1: fortZ + 4 });
          for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { texBox(fortX + dx * 4, 2.5, fortZ + dz * 4, 2.6, 5, 2.6, texs.fort()); RM.solids.push({ x0: fortX + dx * 4 - 1.3, x1: fortX + dx * 4 + 1.3, y0: 0, y1: 5, z0: fortZ + dz * 4 - 1.3, z1: fortZ + dz * 4 + 1.3 }); }
          for (let i = 0; i < 8; i++) P.push(bx(fortX - 4 + i * 1.15, 3.4, fortZ + 4 - (i % 2) * 0.1, 0.9, 0.8, 0.9, 0xc8b8a0));
          P.push(cy(fortX, 6, fortZ, 0.1, 6, 0x8a6a3a)); P.push(bx(fortX + 0.9, 8.3, fortZ, 1.8, 1.2, 0.05, 0xd83a2a)); RM.fort = { x: fortX, y: 8.5, z: fortZ };
          for (let i = 0; i < 4; i++) P.push(cy(fortX - 2 + i * 1.3, 3.5, fortZ - 1, 0.25, 1.1, 0x3aa848)); for (let i = 0; i < 4; i++) P.push(sp(fortX - 2 + i * 1.3, 4.2, fortZ - 1, 0.28, 0x3aa848));
          solid(20, 0, 12, 3.5, 6, 3.5, 0x5a6a7a, P); P.push(cy(20, 6.2, 12, 1.9, 0.5, 0x4a5a6a));
          P.push(cy(16, 0.3, -11, 1.3, 0.6, 0xd83a2a)); P.push(cy(16, 0.65, -11, 1.0, 0.2, 0x8a5a2a)); // the cat's bowl
          // a kitchen clock and a calendar on the right wall
          P.push(cy(24.6, 18, 2, 2.4, 0.4, 0xf4f4f4, 0, Math.PI / 2)); P.push(bx(24.3, 18, 2, 0.1, 1.6, 0.2, 0x222222)); P.push(bx(24.3, 18.6, 2.6, 0.1, 0.2, 1.2, 0x222222));
          P.push(bx(24.7, 14, -8, 0.2, 7, 5, 0xffffff)); P.push(bx(24.6, 16.2, -8, 0.1, 2.4, 4.6, 0x3a78d8));
          addM(vmesh(P));
          blobShadow(2, 2, 24, 14); blobShadow(-10, -15, 24, 8); blobShadow(-21, -14, 10, 10); blobShadow(fortX, fortZ, 14, 14); blobShadow(8, -15.5, 11, 8);
        },
        bath(o) {
          shell(36, 30, 24, texs.bathFloor(), 7, texs.bathWall(), Object.assign({ wx: 8, doorCol: 0xf4f4f4 }, o));
          const P = [];
          // the bath along the left wall: a hollow tub with water in it
          const BX = -11, BZ = 0, BW = 10, BL = 22, BH = 6;
          P.push(bx(BX, BH / 2, BZ, BW, BH, BL, 0xf8f8ff)); P.push(bx(BX, BH + 0.2, BZ, BW + 0.6, 0.4, BL + 0.6, 0xffffff));
          RM.solids.push({ x0: BX - BW / 2, x1: BX - BW / 2 + 1, y0: 0, y1: BH + 0.4, z0: BZ - BL / 2, z1: BZ + BL / 2 }); RM.solids.push({ x0: BX + BW / 2 - 1, x1: BX + BW / 2, y0: 0, y1: BH + 0.4, z0: BZ - BL / 2, z1: BZ + BL / 2 });
          RM.solids.push({ x0: BX - BW / 2, x1: BX + BW / 2, y0: 0, y1: BH + 0.4, z0: BZ - BL / 2, z1: BZ - BL / 2 + 1 }); RM.solids.push({ x0: BX - BW / 2, x1: BX + BW / 2, y0: 0, y1: BH + 0.4, z0: BZ + BL / 2 - 1, z1: BZ + BL / 2 });
          const wt = texs.water().clone(); wt.needsUpdate = true; wt.repeat.set(2, 4); RM.texs.push(wt);
          const water = new T.Mesh(geo(new T.PlaneGeometry(BW - 1.6, BL - 1.6)), RMAT({ map: wt, transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.set(BX, BH - 1.2, BZ); addM(water); RM.water = { x0: BX - BW / 2 + 0.8, x1: BX + BW / 2 - 0.8, z0: BZ - BL / 2 + 0.8, z1: BZ + BL / 2 - 0.8, y: BH - 1.2 };
          RM.anim.push(t => { wt.offset.set(Math.sin(t * 0.5) * 0.05, t * 0.03); });
          P.push(cy(BX, BH + 3, BZ - BL / 2 + 1.5, 0.35, 5, 0xd0d0d8)); P.push(cy(BX, BH + 5.4, BZ - BL / 2 + 2.6, 0.35, 2.6, 0xd0d0d8, Math.PI / 2)); P.push(cy(BX - 1.6, BH + 0.9, BZ - BL / 2 + 1.5, 0.5, 1, 0xd83a2a)); P.push(cy(BX + 1.6, BH + 0.9, BZ - BL / 2 + 1.5, 0.5, 1, 0x3a78d8)); // taps
          P.push(cy(BX, 22, BZ - BL / 2 - 0.5, 0.25, 2, 0xd0d0d8)); P.push(cy(BX, 23, BZ, 0.2, BL + 2, 0xd0d0d8, Math.PI / 2)); // shower rail
          P.push(bx(BX + BW / 2 + 0.3, 14.5, BZ - BL / 2 + 1.6, 0.8, 17, 3.2, 0xa8e0f0)); RM.solids.push({ x0: BX + BW / 2 - 0.2, x1: BX + BW / 2 + 0.8, y0: 6, y1: 23, z0: BZ - BL / 2, z1: BZ - BL / 2 + 3.2 }); // shower curtain, pulled back
          // toilet, sink with a mirror, towel rail, bath mat, a laundry basket
          solid(12, 0, -10, 5, 4.5, 6, 0xf8f8ff, P); P.push(bx(12, 4.7, -10, 5.2, 0.4, 6.4, 0xf8f8ff)); solid(12, 4.5, -13, 5, 7, 2.2, 0xf8f8ff, null); P.push(bx(12, 8, -13, 5, 7, 2.2, 0xf8f8ff)); P.push(bx(12, 11.6, -13, 1.2, 0.3, 0.8, 0xc0c0c8));
          solid(12, 0, 6, 6, 8, 5, 0xf8f8ff, P); P.push(bx(12, 8.2, 6, 6.4, 0.6, 5.4, 0xf8f8ff)); P.push(cy(12, 8.8, 6, 1.6, 0.6, 0xd8e8f0)); P.push(cy(12, 10, 7.8, 0.2, 2.6, 0xd0d0d8)); P.push(cy(12, 11.2, 7, 0.2, 1.8, 0xd0d0d8, Math.PI / 2));
          const mirror = new T.Mesh(geo(new T.PlaneGeometry(5, 6)), RMAT({ color: 0xe8f8ff, emissive: 0x506070 })); mirror.position.set(17.85, 14, 6); mirror.rotation.y = -Math.PI / 2; addM(mirror); P.push(bx(17.9, 14, 6, 0.2, 6.6, 5.6, 0xd0d0d8));
          P.push(cy(17.5, 9, -3, 0.2, 5, 0xd0d0d8, Math.PI / 2, Math.PI / 2)); P.push(bx(17.3, 6.5, -3, 0.5, 5, 4, 0xf0b020)); P.push(bx(17.3, 6.5, -3.5, 0.6, 4, 2, 0xd83a2a)); // towels
          const mat = new T.Mesh(geo(new T.PlaneGeometry(7, 5)), RMAT({ color: 0x3a9ad8 })); mat.rotation.x = -Math.PI / 2; mat.position.set(-2, 0.03, 0); addM(mat);
          solid(12, 0, 12.5, 4, 5, 4, 0xd8c8a0, P); P.push(bx(12, 5.2, 12.5, 4.2, 0.4, 4.2, 0xc8b890)); P.push(bx(12, 5.6, 12.5, 2.5, 0.8, 2.5, 0xf4f4f4));
          P.push(cy(-2, 1.8, -11, 1.3, 3.6, 0xf4f4f4)); P.push(cy(-2, 3.9, -11, 1.1, 0.6, 0xf0b020)); P.push(cy(-2, 1.6, -11.4, 0.6, 3.6, 0xf4f4f4)); RM.solids.push({ x0: -3.5, x1: -0.5, y0: 0, y1: 4.2, z0: -12.5, z1: -9.5 }); // toilet roll holder? a bin
          addM(vmesh(P));
          blobShadow(BX, BZ, 14, 26); blobShadow(12, -10, 8, 10); blobShadow(12, 6, 9, 8); blobShadow(12, 12.5, 6, 6);
        },
      };
      function buildRoom(id, o) {
        dropRoom(); RM = { id, solids: [], meshes: [], geos: [], mats: [], texs: [], anim: [], cat: null, screen: null };
        BUILD[id](o || {});
        for (const t of RM.texs) T3.keep({ dispose() { t.dispose(); } });
        if (o && o.dusk) { sunL.intensity = 0.25; hemiL.intensity = 0.4; T3.sky(0x1a1a30); } else { sunL.intensity = 0.8; hemiL.intensity = 0.75; T3.sky(0xe8eef8); }
      }
      const LITE = T3.lights({ amb: 0.75, sun: 0.8, dir: [-0.35, 1, 0.6], skyCol: 0xfff6e8, groundCol: 0x806858 }), sunL = LITE.sun, hemiL = LITE.hemi;

      // ---------------------------------------------------------------- the craft
      const C = { kind: 'plane', x: 0, y: 8, z: 0, yaw: 0, pitch: 0, roll: 0, spd: 12, vx: 0, vy: 0, vz: 0, dizzy: 0, mdl: null, fwd: V3(0, 0, 1), turbo: false, brake: false, fire: 0, land: 0, carry: null, bonks: 0 };
      let shadowM = null, carryM = null;
      function setCraft(kind) {
        if (C.mdl) { T3.scene.remove(C.mdl.g); }
        C.kind = kind; C.mdl = kind === 'heli' ? heliModel() : planeModel(); T3.add(C.mdl.g);
        if (!shadowM) { shadowM = new T.Mesh(T3.keep(new T.PlaneGeometry(3.2, 3.2)), skin('blob', () => ({ map: texs.blob(), lit: false, transparent: true, depthWrite: false }))); shadowM.rotation.x = -Math.PI / 2; T3.add(shadowM); }
        if (!carryM) { carryM = vmesh([bx(0, 0, 0, 0.7, 0.7, 0.7, 0xffffff)]); carryM.visible = false; T3.add(carryM); }
      }
      function placeCraft(x, y, z, yaw) { C.x = x; C.y = y; C.z = z; C.yaw = yaw; C.pitch = 0; C.roll = 0; C.spd = C.kind === 'heli' ? 0 : 12; C.vx = C.vy = C.vz = 0; C.dizzy = 0; C.land = 0; }
      const fwdOf = (yaw, pitch, out) => { const cp = Math.cos(pitch); out.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp); return out; };
      // the ground under a point: the floor, or the top of whatever furniture is below
      function groundAt(x, y, z) { let g = 0; for (const S of RM.solids) if (!S.floor && x > S.x0 && x < S.x1 && z > S.z0 && z < S.z1 && S.y1 <= y + 0.3 && S.y1 > g) g = S.y1; return g; }
      // sphere against the room and its furniture: returns a push-out normal or null
      const hitN = V3();
      function collide(r) {
        let hit = null;
        const w2 = RM.w / 2 - r, d2 = RM.d / 2 - r;
        if (C.x < -w2) { C.x = -w2; hitN.set(1, 0, 0); hit = 1; } else if (C.x > w2) { C.x = w2; hitN.set(-1, 0, 0); hit = 1; }
        if (C.z < -d2) { C.z = -d2; hitN.set(0, 0, 1); hit = 1; } else if (C.z > d2) { C.z = d2; hitN.set(0, 0, -1); hit = 1; }
        if (C.y < r) { C.y = r; hitN.set(0, 1, 0); hit = 1; } else if (C.y > RM.h - r) { C.y = RM.h - r; hitN.set(0, -1, 0); hit = 1; }
        for (const S of RM.solids) {
          if (S.floor) continue;
          const px = clamp(C.x, S.x0, S.x1), py = clamp(C.y, S.y0, S.y1), pz = clamp(C.z, S.z0, S.z1);
          const dx = C.x - px, dy = C.y - py, dz = C.z - pz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < r) {
            if (d > 1e-4) { hitN.set(dx / d, dy / d, dz / d); C.x = px + hitN.x * r; C.y = py + hitN.y * r; C.z = pz + hitN.z * r; }
            else { // inside: pop out of the nearest face
              const f = [[C.x - S.x0, -1, 0, 0], [S.x1 - C.x, 1, 0, 0], [S.y1 - C.y, 0, 1, 0], [C.z - S.z0, 0, 0, -1], [S.z1 - C.z, 0, 0, 1]].sort((a, b) => a[0] - b[0])[0];
              hitN.set(f[1], f[2], f[3]); C.x += f[1] * (f[0] + r); C.y += f[2] * (f[0] + r); C.z += f[3] * (f[0] + r);
            }
            hit = 1;
          }
        }
        return hit ? hitN : null;
      }
      function bonk(n, hard) {
        if (C.dizzy > 0) return;
        C.dizzy = hard ? 1.1 : 0.7; C.bonks++; if (DBG.log.length < 40) DBG.log.push([M.t.toFixed(1), C.x.toFixed(1), C.y.toFixed(1), C.z.toFixed(1), n.x, n.y, n.z]);
        // bounce: reflect the heading off the wall and slow right down
        const f = C.fwd, dot = f.x * n.x + f.y * n.y + f.z * n.z;
        const rx = f.x - 2 * dot * n.x, ry = f.y - 2 * dot * n.y, rz = f.z - 2 * dot * n.z;
        C.yaw = Math.atan2(rx, rz); C.pitch = clamp(Math.asin(clamp(ry, -1, 1)) * 0.5, -0.5, 0.5); C.roll = 0;
        C.spd = C.kind === 'heli' ? 0 : 8; C.vx = n.x * 6; C.vy = n.y * 6; C.vz = n.z * 6;
        if (M.on) { M.bat -= hard ? 3 : 2; M.bonks++; }
        burst(C.x, C.y, C.z, 14, [0xffe040, 0xffffff, 0xff8a3a], 5, 0.6, 4);
        shake = 0.5; say(['BONK!', 'OOF!', 'WHOOPS!', 'CRUNCH!'][rnd() * 4 | 0], '', 0.8, '#ffe040');
        K.sfx.noise(0.18, 0.2, 500); K.sfx.tone(160, 0.2, 'square', 0.1, 0, 70);
      }
      let padIn = { x: 0, y: 0, a: false, b: false, x2: false }, shake = 0, engT = 0;
      function readPad() {
        const s = K.stick(); padIn.x = s.x; padIn.y = s.y; padIn.a = K.held('a'); padIn.b = K.held('b'); padIn.x2 = K.held('x');
        if (DBG.auto && M.on) autopilot();
      }
      function flyPlane(dt) {
        const inp = padIn, dz = C.dizzy > 0;
        const tRoll = dz ? Math.sin(K.t * 30) * 0.4 : inp.x * 1.05, tPitch = dz ? -0.3 : -inp.y * 0.72;
        C.roll += (tRoll - C.roll) * Math.min(1, dt * 5.5);
        C.pitch += (tPitch - C.pitch) * Math.min(1, dt * 4.2);
        C.yaw -= C.roll * 2.0 * dt * clamp(C.spd / 13, 0.75, 1.1);
        C.turbo = inp.a && !dz; C.brake = inp.x2 && !dz;
        const want = dz ? 6 : C.turbo ? 24 : C.brake ? 6.5 : 13;
        C.spd += (want - C.spd) * Math.min(1, dt * (want > C.spd ? 2.2 : 3));
        fwdOf(C.yaw, C.pitch, C.fwd);
        // bounce velocity from a bonk dies away
        C.vx *= Math.exp(-dt * 4); C.vy *= Math.exp(-dt * 4); C.vz *= Math.exp(-dt * 4);
        C.x += (C.fwd.x * C.spd + C.vx) * dt; C.y += (C.fwd.y * C.spd + C.vy) * dt; C.z += (C.fwd.z * C.spd + C.vz) * dt;
        const n = collide(0.75); if (n) bonk(n, C.spd > 18);
        // the model
        const g = C.mdl.g; g.position.set(C.x, C.y, C.z); g.rotation.set(-C.pitch, C.yaw, C.roll, 'YXZ');
        C.mdl.prop.rotation.z += dt * (C.spd * 2.4 + 8); C.mdl.disc.visible = C.spd > 9; C.mdl.prop.visible = C.spd <= 16;
        if (C.turbo && K.frame % 2 === 0) puff(C.x - C.fwd.x * 1.6 + (rnd() - 0.5) * 0.4, C.y - C.fwd.y * 1.6 - 0.1, C.z - C.fwd.z * 1.6 + (rnd() - 0.5) * 0.4, -C.fwd.x * 3, 0.5, -C.fwd.z * 3, 0.35, 0xffb040, 0);
        engT -= dt; if (engT <= 0) { engT = 0.085; K.sfx.tone(60 + C.spd * 5, 0.11, 'sawtooth', C.turbo ? 0.03 : 0.02); }
        if (C.fire > 0) C.fire -= dt;
        if (inp.b && C.fire <= 0 && !dz && M.on) { C.fire = 0.16; shootPea(); }
      }
      function flyHeli(dt) {
        const inp = padIn, dz = C.dizzy > 0;
        C.yaw -= (dz ? 0 : inp.x) * 1.9 * dt;
        const tf = dz ? 0 : -inp.y * 11, tv = dz ? 1.5 : (inp.a ? 7.5 : 0) - (inp.x2 ? 7.5 : 0);
        C.spd += (tf - C.spd) * Math.min(1, dt * 2.2); C.vy += (tv - C.vy) * Math.min(1, dt * 2.8);
        const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
        C.vx *= Math.exp(-dt * 4); C.vz *= Math.exp(-dt * 4);
        C.x += (fx * C.spd + C.vx) * dt; C.z += (fz * C.spd + C.vz) * dt; C.y += C.vy * dt;
        C.fwd.set(fx, 0, fz);
        C.pitch += ((C.spd / 11) * 0.32 - C.pitch) * Math.min(1, dt * 3); C.roll += ((dz ? Math.sin(K.t * 20) * 0.3 : -inp.x * 0.22) - C.roll) * Math.min(1, dt * 3);
        const n = collide(0.8); if (n) bonk(n, false);
        const g = C.mdl.g; g.position.set(C.x, C.y, C.z); g.rotation.set(C.pitch, C.yaw, C.roll, 'YXZ');
        C.mdl.prop.rotation.y += dt * 26; C.mdl.tail.rotation.x += dt * 40; C.mdl.prop.visible = false; C.mdl.disc.visible = true;
        engT -= dt; if (engT <= 0) { engT = 0.1; K.sfx.noise(0.07, 0.05, 300 + Math.abs(C.vy) * 20, 0, 'lowpass'); }
        if (C.fire > 0) C.fire -= dt;
        if (inp.b && C.fire <= 0 && !dz && M.on) { C.fire = 0.5; dropBalloon(); }
      }
      function craftCommon(dt) {
        if (C.dizzy > 0) C.dizzy -= dt;
        // the shadow underneath (on the floor or whatever is below)
        const gy = groundAt(C.x, C.y, C.z), hgt = C.y - gy; shadowM.position.set(C.x, gy + 0.06, C.z); const k = clamp(1.3 - hgt / 24, 0.4, 1.3); shadowM.scale.set(k, k, 1); shadowM.material.opacity = clamp(1 - hgt / 26, 0.25, 0.9);
        if (carryM.visible) { carryM.position.set(C.x, C.y - 0.75, C.z); carryM.rotation.y = C.yaw; }
        if (C.dizzy > 0 && K.frame % 6 === 0) puff(C.x + (rnd() - 0.5) * 1.5, C.y + 0.8 + rnd() * 0.6, C.z + (rnd() - 0.5) * 1.5, 0, 1.5, 0, 0.5, 0xffe040, 0);
      }

      // ---------------------------------------------------------------- peas, water balloons
      const peas = []; for (let i = 0; i < 14; i++) { const m = new T.Mesh(UNIT.sph, skin('pea', () => ({ color: 0x5ad83a, emissive: 0x206010 }))); m.scale.setScalar(0.32); m.visible = false; T3.add(m); peas.push({ m, t: 0, vx: 0, vy: 0, vz: 0 }); }
      function shootPea() {
        const p = peas.find(p => p.t <= 0); if (!p) return;
        p.t = 1.1; const s = C.spd + 42; p.vx = C.fwd.x * s; p.vy = C.fwd.y * s; p.vz = C.fwd.z * s;
        p.m.position.set(C.x + C.fwd.x * 2.1, C.y + C.fwd.y * 2.1 - 0.1, C.z + C.fwd.z * 2.1); p.m.visible = true;
        K.sfx.tone(900, 0.06, 'square', 0.05, 0, 500);
      }
      const wbs = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(UNIT.sph, skin('wb', () => ({ color: 0x4ab0ff, emissive: 0x103060 }))); m.scale.set(0.7, 0.8, 0.7); m.visible = false; T3.add(m); wbs.push({ m, t: 0, vx: 0, vy: 0, vz: 0 }); }
      function dropBalloon() {
        const b = wbs.find(b => b.t <= 0); if (!b) return;
        b.t = 3; b.vx = C.fwd.x * C.spd * 0.7; b.vy = Math.min(0, C.vy); b.vz = C.fwd.z * C.spd * 0.7;
        b.m.position.set(C.x, C.y - 0.9, C.z); b.m.visible = true; K.sfx.tone(300, 0.08, 'sine', 0.08, 0, 200);
      }
      function updShots(dt) {
        for (const p of peas) if (p.t > 0) {
          p.t -= dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
          if (p.t <= 0 || Math.abs(p.m.position.x) > RM.w / 2 || Math.abs(p.m.position.z) > RM.d / 2 || p.m.position.y < 0 || p.m.position.y > RM.h) { p.t = 0; p.m.visible = false; continue; }
          if (OBJ.pea) OBJ.pea(p);
        }
        for (const b of wbs) if (b.t > 0) {
          b.t -= dt; b.vy -= 22 * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt;
          const P = b.m.position, g = RM.water && P.x > RM.water.x0 && P.x < RM.water.x1 && P.z > RM.water.z0 && P.z < RM.water.z1 ? RM.water.y : groundAt(P.x, P.y + 1, P.z);
          let done = b.t <= 0 || P.y <= g + 0.4;
          if (OBJ.splash && OBJ.splash(b)) done = true;
          if (done) { b.t = 0; b.m.visible = false; burst(P.x, Math.max(P.y, g + 0.3), P.z, 22, [0x4ab0ff, 0xa8e0ff, 0xffffff], 6, 0.7, 14); K.sfx.noise(0.3, 0.2, 1800, 0, 'bandpass'); }
        }
      }

      // ---------------------------------------------------------------- the missions' things
      const M = { on: false, def: null, idx: 0, bat: 0, t: 0, n: 0, total: 0, bonks: 0, picks: 0, msg: '', done: false, fail: false, count: 0 };
      let OBJ = {}; // the current objective's hooks: update(dt), target() -> [x,y,z] | null, pea(p), splash(b), label()
      const objMeshes = [];
      const objAdd = m => { T3.add(m); objMeshes.push(m); return m; };
      function clearObj() { for (const m of objMeshes) T3.scene.remove(m); objMeshes.length = 0; OBJ = {}; if (carryM) carryM.visible = false; C.carry = null; for (const p of peas) { p.t = 0; p.m.visible = false; } for (const b of wbs) { b.t = 0; b.m.visible = false; } }
      const HOOPG = T3.keep(new T.TorusGeometry(2.6, 0.32, 10, 28));
      const hoopMat = { next: T3.mat({ color: 0x4aff5a, emissive: 0x106018 }), later: T3.mat({ map: texs.hoop() }), done: T3.mat({ color: 0xaaaaaa, transparent: true, opacity: 0.35 }) };
      function hoopPath(list) { // list of [x, y, z]: each hoop faces along the line of flight through it
        const hoops = list.map(([x, y, z, yaw], i) => {
          if (yaw == null) { const a = list[i - 1] || [C.x, C.y, C.z], b = list[i + 1] || list[i]; yaw = Math.atan2(b[0] - a[0], b[2] - a[2]); } const m = objAdd(new T.Mesh(HOOPG, hoopMat.later)); m.position.set(x, y, z); m.rotation.y = yaw; const n = V3(Math.sin(yaw), 0, Math.cos(yaw)); const glow = objAdd(new T.Sprite(new T.SpriteMaterial({ map: texs.glow(), color: 0x4aff5a, transparent: true, opacity: 0.0, depthWrite: false }))); glow.scale.set(7, 7, 1); glow.position.set(x, y, z); return { m, x, y, z, n, glow, prev: 0 }; });
        let at = 0; hoops[0].m.material = hoopMat.next;
        const px = { x: 0, y: 0, z: 0 };
        OBJ.update = dt => {
          const h = hoops[at]; if (!h) return;
          for (let i = 0; i < hoops.length; i++) { const hp = hoops[i]; hp.glow.material.opacity = i === at ? 0.25 + Math.sin(K.t * 6) * 0.15 : 0; hp.m.rotation.z += dt * (i === at ? 1.5 : 0.3); }
          // crossing the hoop's plane inside its ring
          const d0 = (px.x - h.x) * h.n.x + (px.z - h.z) * h.n.z, d1 = (C.x - h.x) * h.n.x + (C.z - h.z) * h.n.z;
          if (d0 * d1 <= 0 && Math.abs(d1 - d0) > 1e-5) { const t = d0 / (d0 - d1), ix = lerp(px.x, C.x, t), iy = lerp(px.y, C.y, t), iz = lerp(px.z, C.z, t); if (Math.hypot(ix - h.x, iy - h.y, iz - h.z) < 2.6) {
            h.m.material = hoopMat.done; at++; M.count = at; M.picks++; burst(h.x, h.y, h.z, 24, [0x4aff5a, 0xffffff, 0xffe040], 7, 0.6, 2);
            K.sfx.seq([[72 + at, 0.25], [76 + at, 0.25], [79 + at, 0.5]], { bpm: 420, vol: 0.09 });
            if (at >= hoops.length) { finishMission(); } else { hoops[at].m.material = hoopMat.next; say(at === hoops.length - 1 ? 'LAST ONE!' : ['NICE!', 'GOOD!', 'SMOOTH!', 'ACE!'][at % 4], '', 0.7, '#4aff5a'); }
          } }
          px.x = C.x; px.y = C.y; px.z = C.z;
        };
        OBJ.target = () => { const h = hoops[at]; return h ? [h.x, h.y, h.z] : null; };
        OBJ.label = () => 'HOOPS ' + at + '/' + hoops.length;
        OBJ.approach = () => { const h = hoops[at]; if (!h) return null; const side = Math.sign((C.x - h.x) * h.n.x + (C.z - h.z) * h.n.z) || 1; const d = Math.hypot(C.x - h.x, C.z - h.z); return d > 9 ? [h.x + h.n.x * side * 6, h.y, h.z + h.n.z * side * 6] : [h.x, h.y, h.z]; };
        OBJ.total = hoops.length;
      }
      function balloons(list) {
        const cols = [0xf03a3a, 0x3a78f0, 0xf0d02a, 0x3ad050, 0xf05ad0, 0xff8a2a];
        const bs = list.map(([x, y, z], i) => { const g = new T.Group(); const b = new T.Mesh(UNIT.sph, T3.mat({ color: cols[i % cols.length], emissive: 0x101010 })); b.scale.set(1.9, 2.3, 1.9); g.add(b); const kn = new T.Mesh(UNIT.cone, T3.mat({ color: cols[i % cols.length] })); kn.scale.set(0.35, 0.4, 0.35); kn.position.y = -1.25; kn.rotation.x = Math.PI; g.add(kn); const st = new T.Mesh(UNIT.box, T3.mat({ color: 0xffffff })); st.scale.set(0.05, 4, 0.05); st.position.y = -3.3; g.add(st); g.position.set(x, y, z); objAdd(g); return { g, x, y, z, on: true, ph: rnd() * 6 }; });
        let left = bs.length;
        const pop = b => { b.on = false; b.g.visible = false; left--; M.count = bs.length - left; M.picks++; burst(b.x, b.y, b.z, 26, [b.g.children[0].material.color.getHex(), 0xffffff], 8, 0.7, 5); K.sfx.noise(0.12, 0.3, 3000, 0, 'highpass'); K.sfx.tone(600 + rnd() * 300, 0.1, 'square', 0.08, 0, 100); say(left ? ['POP!', 'BANG!', 'GOTCHA!'][left % 3] : 'ALL POPPED!', '', 0.6, '#f0d02a'); if (!left) finishMission(); };
        OBJ.update = dt => { for (const b of bs) if (b.on) { b.g.position.y = b.y + Math.sin(K.t * 1.3 + b.ph) * 0.5; b.g.rotation.z = Math.sin(K.t + b.ph) * 0.08; if (Math.hypot(C.x - b.x, C.y - b.g.position.y, C.z - b.z) < 2.3) pop(b); } };
        OBJ.pea = p => { for (const b of bs) if (b.on && Math.hypot(p.m.position.x - b.x, p.m.position.y - b.g.position.y, p.m.position.z - b.z) < 2.2) { pop(b); p.t = 0; p.m.visible = false; return; } };
        OBJ.target = () => { let best = null, bd = 1e9; for (const b of bs) if (b.on) { const d = Math.hypot(C.x - b.x, C.y - b.y, C.z - b.z); if (d < bd) { bd = d; best = [b.x, b.g.position.y, b.z]; } } return best; };
        OBJ.label = () => 'BALLOONS ' + (bs.length - left) + '/' + bs.length;
        OBJ.total = bs.length;
      }
      function sugarRun(n) {
        const S = RM.sugar, Fo = RM.fort;
        const ringA = objAdd(new T.Mesh(HOOPG, hoopMat.next)); ringA.position.set(S.x, S.y + 2.6, S.z); ringA.rotation.x = Math.PI / 2; ringA.scale.setScalar(0.9);
        const ringB = objAdd(new T.Mesh(HOOPG, hoopMat.later)); ringB.position.set(Fo.x, Fo.y + 2.4, Fo.z); ringB.rotation.x = Math.PI / 2; ringB.scale.setScalar(1.1);
        const cubes = []; for (let i = 0; i < n; i++) { const m = objAdd(vmesh([bx(0, 0, 0, 0.9, 0.9, 0.9, 0xffffff)])); m.position.set(S.x + Math.cos(i * 2.1) * 0.4, S.y - 0.2 + (i % 2) * 0.5, S.z + Math.sin(i * 2.1) * 0.4); cubes.push(m); }
        let got = 0, carrying = false;
        OBJ.update = dt => {
          ringA.rotation.z += dt; ringB.rotation.z -= dt;
          if (!carrying) { if (Math.hypot(C.x - S.x, C.z - S.z) < 2.6 && Math.abs(C.y - (S.y + 2.6)) < 1.8) { carrying = true; carryM.visible = true; cubes[got].visible = false; ringA.material = hoopMat.later; ringB.material = hoopMat.next; say('GOT A CUBE!', 'TAKE IT TO THE FORT FLAG', 1.4, '#ffffff'); K.sfx.seq([[76, 0.25], [83, 0.5]], { bpm: 400, vol: 0.09 }); } }
          else if (Math.hypot(C.x - Fo.x, C.z - Fo.z) < 3.2 && Math.abs(C.y - (Fo.y + 2.4)) < 2.2) { carrying = false; carryM.visible = false; got++; M.count = got; M.picks++; burst(Fo.x, Fo.y + 1, Fo.z, 20, [0xffffff, 0xffe040], 5, 0.8, 8); K.sfx.seq([[79, 0.25], [84, 0.25], [88, 0.5]], { bpm: 420, vol: 0.1 }); if (got >= n) finishMission(); else { ringA.material = hoopMat.next; ringB.material = hoopMat.later; say('DELIVERED!', (n - got) + ' MORE TO GO', 1.2, '#4aff5a'); } }
        };
        OBJ.target = () => carrying ? [Fo.x, Fo.y + 2.4, Fo.z] : [S.x, S.y + 2.6, S.z];
        OBJ.approach = () => { const t = OBJ.target(); const d = Math.hypot(C.x - t[0], C.z - t[2]); return d > 8 ? [t[0], t[1] + 2.5, t[2]] : [t[0], t[1] - 0.3, t[2]]; };
        OBJ.label = () => 'SUGAR ' + got + '/' + n + (carrying ? ' (CARRYING)' : '');
        OBJ.total = n;
      }
      function raceCar(hoops, laps, carT) { // the clockwork car does its laps of the rug while you fly the hoops
        hoopPath(hoops);
        const path = new T.CatmullRomCurve3([V3(-10, 0.6, -5), V3(9, 0.6, -5), V3(12, 0.6, 2), V3(9, 0.6, 9), V3(-10, 0.6, 9), V3(-13, 0.6, 2)], true);
        const car = objAdd(vmesh([bx(0, 0.5, 0, 1.6, 0.8, 2.6, 0x2a68c8), bx(0, 1.1, -0.2, 1.3, 0.6, 1.3, 0x8ad0ff), bx(0, 1.0, 0.9, 1.2, 0.3, 0.6, 0x2a68c8), cy(-0.85, 0.35, 0.9, 0.38, 0.3, 0x222222, 0, Math.PI / 2), cy(0.85, 0.35, 0.9, 0.38, 0.3, 0x222222, 0, Math.PI / 2), cy(-0.85, 0.35, -0.9, 0.38, 0.3, 0x222222, 0, Math.PI / 2), cy(0.85, 0.35, -0.9, 0.38, 0.3, 0x222222, 0, Math.PI / 2), bx(0, 1.7, -0.7, 0.9, 0.5, 0.1, 0xd8b030), cy(0, 1.5, -0.7, 0.08, 0.5, 0xd8b030)]));
        const key = car.children[0]; let u = 0; const pos = V3(), nxt = V3();
        const hoopUpd = OBJ.update, lab = OBJ.label;
        OBJ.update = dt => {
          hoopUpd(dt); u = Math.min(1, u + dt / carT);
          const uu = (u * laps) % 1; path.getPointAt(uu, pos); path.getPointAt((uu + 0.01) % 1, nxt); car.position.copy(pos); car.lookAt(nxt); car.rotation.y += 0; 
          if (K.frame % 3 === 0) puff(pos.x, 0.6, pos.z, (rnd() - 0.5) * 2, 1, (rnd() - 0.5) * 2, 0.4, 0x8ad0ff, 0);
          if (u >= 1 && M.on) { M.bat = 0; }
        };
        OBJ.carU = () => u; OBJ.label = () => lab() + '  CAR LAP ' + Math.min(laps, Math.floor(u * laps) + 1) + '/' + laps;
      }
      function paperChase(need) {
        const pts = [V3(-6, 9, -4), V3(4, 15, -11), V3(12, 11, -2), V3(18, 14, 8), V3(6, 9, 15), V3(-6, 12, 14), V3(-15, 15, 6), V3(-15, 15, -6)];
        const path = new T.CatmullRomCurve3(pts, true, 'centripetal');
        const pp = objAdd(vmesh([{ g: UNIT.box, m: M4(-0.45, 0, 0, 0, 0.9, 0.06, 2.2, 0, 0, 0.35), c: 0xffffff }, { g: UNIT.box, m: M4(0.45, 0, 0, 0, 0.9, 0.06, 2.2, 0, 0, -0.35), c: 0xffffff }, bx(0, -0.25, 0, 0.1, 0.5, 2.2, 0xeeeeee)]));
        let u = 0, lock = 0; const pos = V3(), nxt = V3(); const speed = 12.5, len = path.getLength();
        OBJ.update = dt => {
          u = (u + dt * speed / len) % 1; path.getPointAt(u, pos); path.getPointAt((u + 0.01) % 1, nxt); pp.position.copy(pos); pp.lookAt(nxt); pp.rotation.z = Math.sin(K.t * 2) * 0.3;
          const d = Math.hypot(C.x - pos.x, C.y - pos.y, C.z - pos.z);
          const behind = (pos.x - C.x) * C.fwd.x + (pos.y - C.y) * C.fwd.y + (pos.z - C.z) * C.fwd.z > 0;
          if (d < 8 && behind) { lock += dt; if (K.frame % 4 === 0) puff(pos.x, pos.y, pos.z, 0, 0, 0, 0.3, 0x4aff5a, 0); if (K.frame % 20 === 0) K.sfx.tone(700 + lock * 40, 0.05, 'square', 0.04); if (lock >= need) finishMission(); } else lock = Math.max(0, lock - dt * 0.5);
          M.count = Math.floor(lock);
        };
        OBJ.target = () => [pos.x, pos.y, pos.z];
        OBJ.approach = () => { const d = Math.hypot(C.x - pos.x, C.y - pos.y, C.z - pos.z); const fw = V3().subVectors(nxt, pos).normalize(), ld = clamp(d * 0.4, 1, 6); return [pos.x + fw.x * ld, pos.y + fw.y * ld, pos.z + fw.z * ld]; };
        OBJ.lock = () => lock / need; OBJ.label = () => 'LOCK ' + Math.floor(lock) + '/' + need + 'S';
        OBJ.total = need;
      }
      function ducks(n) {
        const Wt = RM.water, ds = [];
        for (let i = 0; i < n; i++) {
          const g = objAdd(vmesh([sp(0, 0, 0, 0.9, 0xf0d020, 0.6, 1.1), sp(0, 0.7, 0.6, 0.55, 0xf0d020), cn(0, 0.65, 1.2, 0.2, 0.5, 0xff7a2a, Math.PI / 2), sp(-0.2, 0.85, 0.95, 0.09, 0x111111), sp(0.2, 0.85, 0.95, 0.09, 0x111111), sp(0, 0.1, -0.7, 0.3, 0xf0d020)]));
          const d = { g, x: lerp(Wt.x0 + 1.2, Wt.x1 - 1.2, (i % 2) ? 0.75 : 0.25) + (rnd() - 0.5), z: lerp(Wt.z0 + 1.5, Wt.z1 - 1.5, i / (n - 1)), a: rnd() * 6, on: true, ph: rnd() * 6, sp: 0.6 + rnd() * 0.5 };
          g.position.set(d.x, Wt.y + 0.3, d.z); ds.push(d);
        }
        let left = n;
        OBJ.update = dt => { for (const d of ds) if (d.on) { d.a += (rnd() - 0.5) * dt * 3; d.x += Math.sin(d.a) * d.sp * dt; d.z += Math.cos(d.a) * d.sp * dt; if (d.x < Wt.x0 + 1 || d.x > Wt.x1 - 1) d.a = -d.a + Math.PI * (rnd() - 0.5) * 0.3; if (d.z < Wt.z0 + 1 || d.z > Wt.z1 - 1) d.a = Math.PI - d.a; d.x = clamp(d.x, Wt.x0 + 1, Wt.x1 - 1); d.z = clamp(d.z, Wt.z0 + 1, Wt.z1 - 1); d.g.position.set(d.x, Wt.y + 0.3 + Math.sin(K.t * 2 + d.ph) * 0.12, d.z); d.g.rotation.y = d.a; d.g.rotation.z = Math.sin(K.t * 3 + d.ph) * 0.1; } else { d.g.rotation.z += (Math.PI - d.g.rotation.z) * dt * 3; d.g.position.y += (Wt.y - 0.4 - d.g.position.y) * dt * 2; } };
        OBJ.splash = b => { for (const d of ds) if (d.on && Math.hypot(b.m.position.x - d.x, b.m.position.z - d.z) < 1.7 && b.m.position.y < Wt.y + 1.8) { d.on = false; left--; M.count = n - left; M.picks++; say(left ? ['SOAKED!', 'SPLOOSH!', 'QUACK!'][left % 3] : 'ALL SOAKED!', '', 0.8, '#4ab0ff'); K.sfx.tone(900, 0.15, 'square', 0.08, 0, 300); if (!left) finishMission(); return true; } return false; };
        OBJ.target = () => { let best = null, bd = 1e9; for (const d of ds) if (d.on) { const dd = Math.hypot(C.x - d.x, C.z - d.z); if (dd < bd) { bd = dd; best = [d.x, Wt.y + 0.6, d.z]; } } return best; };
        OBJ.approach = () => { const t = OBJ.target(); return t ? [t[0], t[1] + 7, t[2]] : null; };
        OBJ.label = () => 'DUCKS ' + (n - left) + '/' + n;
        OBJ.total = n;
      }
      function batteries(list, bonus) {
        const bs = list.map(([x, y, z]) => { const m = objAdd(vmesh([cy(0, 0, 0, 0.42, 1.3, 0x2a2a30), cy(0, 0.3, 0, 0.43, 0.6, 0xd8a030), cy(0, 0.72, 0, 0.14, 0.14, 0xc0c0c8), bx(0, -0.25, 0.44, 0.5, 0.3, 0.02, 0xffffff)])); m.position.set(x, y + 1.4, z); return { m, x, y: y + 1.4, z, on: true }; });
        let left = bs.length;
        OBJ.update = dt => { for (const b of bs) if (b.on) { b.m.rotation.y += dt * 2; b.m.position.y = b.y + Math.sin(K.t * 3 + b.x) * 0.15; if (Math.hypot(C.x - b.x, C.y - b.m.position.y, C.z - b.z) < 1.9) { b.on = false; b.m.visible = false; left--; M.count = bs.length - left; M.picks++; M.bat += bonus; burst(b.x, b.m.position.y, b.z, 16, [0xd8a030, 0xffffff, 0x4aff5a], 5, 0.6, 3); K.sfx.seq([[76, 0.2], [83, 0.2], [88, 0.4]], { bpm: 480, vol: 0.09 }); say(left ? '+' + bonus + ' SECONDS!' : 'FULLY CHARGED!', '', 0.8, '#4aff5a'); if (!left) finishMission(); } } };
        OBJ.target = () => { let best = null, bd = 1e9; for (const b of bs) if (b.on) { const d = Math.hypot(C.x - b.x, C.y - b.y, C.z - b.z); if (d < bd) { bd = d; best = [b.x, b.y, b.z]; } } return best; };
        OBJ.label = () => 'BATTERIES ' + (bs.length - left) + '/' + bs.length;
        OBJ.total = bs.length;
      }
      // ---- the cat
      function updCat(dt) {
        const cat = RM.cat; if (!cat) return;
        const d = Math.hypot(C.x - cat.x, C.z - cat.z), low = C.y < cat.top + 5;
        if (cat.hit > 0) cat.hit -= dt; if (cat.meow > 0) cat.meow -= dt;
        if (cat.mode === 'prowl') { // walks about the floor between spots; swipes if you buzz it low
          if (!cat.walk || Math.hypot(cat.walk[0] - cat.x, cat.walk[1] - cat.z) < 0.5) { cat.walk = [(rnd() - 0.5) * (RM.w - 16), (rnd() - 0.5) * (RM.d - 16)]; if (Math.abs(cat.walk[0]) > 12 && Math.abs(cat.walk[1]) > 10) cat.walk = [0, 2]; }
          const a = Math.atan2(cat.walk[0] - cat.x, cat.walk[1] - cat.z); cat.ry += wrapA(a - cat.ry) * Math.min(1, dt * 3); cat.x += Math.sin(cat.ry) * 2.6 * dt; cat.z += Math.cos(cat.ry) * 2.6 * dt;
          cat.g.position.x = cat.x; cat.g.position.z = cat.z; cat.g.rotation.y = cat.ry; cat.g.position.y = 0.4 + Math.abs(Math.sin(K.t * 6)) * 0.15;
          cat.awake = 1;
        } else {
          if (d < 6 && low && cat.awake <= 0) { cat.awake = 6; cat.meow = 1; K.sfx.tone(700, 0.35, 'sawtooth', 0.08, 0, 450); K.sfx.tone(1400, 0.3, 'triangle', 0.05, 0.05, 900); say('MEOW!', 'YOU WOKE THE CAT', 1.2, '#ff9ab0'); }
          if (cat.awake > 0) cat.awake -= dt;
        }
        catPose(cat, K.t);
        // landing on the cat: slow, low, right on its back
        const inBox = Math.abs(C.x - cat.x) < 2.2 && Math.abs(C.z - cat.z) < 3 && C.y > cat.top - 0.4 && C.y < cat.top + 1.6;
        if (inBox && C.kind === 'plane' && C.spd < 9.5 && C.dizzy <= 0 && cat.hit <= 0 && M.on) {
          cat.hit = 3; cat.awake = 6; cat.meow = 1.2; K.secret('lk.toy.cat'); C.landed = true;
          say('CAT NAP!', 'YOU LANDED ON THE CAT. IT IS NOT AMUSED.', 2.2, '#ff9ab0'); K.sfx.tone(500, 0.5, 'sawtooth', 0.1, 0, 900); K.sfx.tone(1000, 0.4, 'triangle', 0.06, 0.1, 1600);
          C.vy = 14; C.vx = Math.sin(cat.ry + 1.5) * 6; C.vz = Math.cos(cat.ry + 1.5) * 6; C.pitch = 0.6; C.dizzy = 0.8; burst(cat.x, cat.top + 1, cat.z, 20, [0x8a8a92, 0xffffff], 6, 0.7, 6);
        } else if ((cat.awake > 0 || cat.mode === 'prowl') && d < 3.4 && low && cat.hit <= 0 && C.dizzy <= 0 && M.on && !inBox) {
          cat.hit = 1.2; cat.swat = 0.4; hitN.set(C.x - cat.x, 0.5, C.z - cat.z).normalize(); bonk(hitN, false); say('SWIPE!', 'THE CAT GOT YOU', 1, '#ff9ab0'); K.sfx.tone(300, 0.2, 'sawtooth', 0.08, 0, 150);
        }
        if (cat.swat > 0) { cat.swat -= dt; cat.head.rotation.y = Math.sin(K.t * 40) * 0.4; }
      }
      function updRoom(dt) {
        for (const f of RM.anim) f(K.t);
        if (RM.toast) { // the toaster pops every so often: bread shoots up and drops back in
          RM.toastT += dt; const ph = RM.toastT % 7;
          let yy = 8.2; if (ph > 5 && ph < 6.2) { const u = (ph - 5) / 1.2; yy = 8.2 + Math.sin(u * Math.PI) * 5.5; if (ph < 5.03) { K.sfx.tone(900, 0.1, 'square', 0.07, 0, 1600); if (Math.hypot(C.x - 7.5, C.z) < 16) say('POP!', '', 0.5, '#f0d0a0'); } }
          for (const m of RM.toast) m.position.y = yy;
          RM.breadY = yy; if (yy > 9.2 && Math.abs(C.x - 7.5) < 1.8 && Math.abs(C.z) < 1 && Math.abs(C.y - yy) < 1.4 && C.dizzy <= 0) { hitN.set(0, 1, 0); bonk(hitN, false); say('TOAST!', 'THAT POPPED RIGHT UP', 1, '#f0d0a0'); }
        }
        updCat(dt);
      }

      // ---------------------------------------------------------------- mission flow
      const SV = Object.assign({ med: {}, best: {}, unl: 1, tbl: MATES.map(x => x.slice()) }, K.load() || {});
      if (!Array.isArray(SV.tbl) || !SV.tbl.length) SV.tbl = MATES.map(x => x.slice());
      const save = () => K.save(SV);
      let mode = 'title', menu = 0, titleA = 0, paused = false, sel = 0, briefT = 0, resT = 0, sess = 0, lastRep = { t: 0, sc: 0 }, pendingRep = false, ending = 0, initials = null, overDone = false, zoom = 0, cdT = 0;
      let msg = { a: '', b: '', t: 0, c: '#fff' };
      function say(a, b, t, c) { msg.a = a; msg.b = b || ''; msg.t = t || 1.5; msg.c = c || '#fff'; }
      const SETUP = {
        school() { placeCraft(0, 9, 13, Math.PI); hoopPath([[0, 10, 0], [8, 13, -13], [18, 11, 4], [12, 14, 13], [0, 8, 12], [-12, 12, 12], [-18, 16, 0], [-4, 12, -8]]); },
        party() { balloons([[-14, 12, 8], [-6, 16, -6], [6, 10, 10], [14, 17, 6], [20, 12, -10], [-20, 14, -6], [0, 20, 2], [-10, 8, 16], [10, 19, -12], [-22, 10, 12], [12, 8, -2], [4, 15, -16]]); placeCraft(0, 9, 14, Math.PI); },
        sugar() { sugarRun(4); placeCraft(14, 10, 12, -Math.PI / 2 - 0.6); },
        clock() { placeCraft(0, 9, 15, Math.PI); raceCar([[0, 10, 2], [10, 13, -12], [20, 12, -2], [16, 15, 14], [0, 9, 16], [-16, 12, 12], [-24, 16, 0], [-16, 10, -12], [0, 15, -16], [10, 9, -4]], 2, M.def.bat); },
        paper() { paperChase(12); placeCraft(-8, 9, 12, 0.3); },
        splash() { ducks(6); placeCraft(6, 11, 8, -Math.PI / 2 - 0.5); },
        volt() { batteries([[-14, 9.5, -14], [-8, 9.5, -15], [6, 9.7, -14.5], [-21, 19.2, -14], [2, 7.7, 5], [0, 0.3, 11], [15, 0.3, 2], [20, 6.5, 12], [-14, 5.2, 12], [16, 1, -11]], 8); placeCraft(10, 12, 12, -Math.PI / 2); },
        tour() { placeCraft(0, 9, 15, Math.PI); hoopPath([[0, 10, 2], [10, 13, -12], [20, 12, -2], [16, 15, 14], [0, 9, 16], [-16, 12, 12], [-24, 16, 0], [-16, 10, -12], [0, 15, -16], [12, 8, -4], [6, 12, 10], [-8, 14, 6], [-14, 8, -4], [-2, 11, -10]]); },
      };
      function startMission(i) {
        clearObj(); const def = MIS[i]; M.def = def; M.idx = i; M.on = false; M.bat = def.bat; M.t = 0; M.count = 0; M.bonks = 0; M.picks = 0; M.done = false; M.fail = false; C.landed = false;
        buildRoom(def.room, { dusk: !!def.dusk, cat: def.room === 'bed' ? i === 4 : undefined });
        if (RM.cat && def.catAwake) { RM.cat.mode = 'prowl'; }
        setCraft(def.craft); SETUP[def.id]();
        K.music(SONGS[def.dusk ? 'dusk' : ROOM_SONG[def.room]]);
        mode = 'play'; paused = false; cdT = 3.2; camSnap();
        say(def.n, def.goal, 3.4, '#ffe040');
      }
      function finishMission() {
        if (!M.on) return; M.on = false; M.done = true; resT = 0; mode = 'result'; K.music(null);
        const def = M.def, t = M.t, med = t <= def.gold ? 'g' : t <= def.silver ? 's' : 'b';
        const pts = (med === 'g' ? 3000 : med === 's' ? 2000 : 1200) + Math.min(1000, Math.round(M.bat * 12)) + M.picks * 50 - Math.min(400, M.bonks * 50);
        M.res = { med, t, pts: Math.max(300, pts), newBest: !SV.best[def.id] || t < SV.best[def.id] };
        if (M.res.newBest) SV.best[def.id] = Math.round(t * 10) / 10;
        const rank = { b: 1, s: 2, g: 3 }; if ((rank[SV.med[def.id]] || 0) < rank[med]) SV.med[def.id] = med;
        SV.unl = Math.max(SV.unl, Math.min(MIS.length, M.idx + 2)); save();
        sess += M.res.pts;
        if (MIS.every(m => SV.med[m.id] === 'g')) K.secret('lk.toy.ace');
        K.sfx.seq(med === 'g' ? [[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75], [83, 0.25], [84, 1.5]] : [[72, 0.25], [76, 0.25], [79, 0.5], [84, 1]], { bpm: 300, vol: 0.1 });
        report();
      }
      function failMission() { if (!M.on) return; M.on = false; M.fail = true; resT = 0; mode = 'result'; K.music(null); K.sfx.seq([[64, 0.5], [60, 0.5], [55, 1.5]], { bpm: 160, vol: 0.1 }); }
      // the server believes a score only at rate*(time+5): report the session total when there has been time enough
      function report(force) {
        if (sess <= lastRep.sc) { pendingRep = false; return; }
        const el = K.t - lastRep.t;
        if (!force && el < Math.max(42, sess / 200 + 8)) { pendingRep = true; return; }
        K.over(Math.min(sess, Math.floor(200 * (el + 3))), { keep: true }); lastRep = { t: K.t, sc: sess }; pendingRep = false;
      }
      function endSession(won) {
        if (overDone) return; overDone = true; mode = 'done'; K.music(null); clearObj();
        const el = K.t - lastRep.t, sc = Math.min(sess, Math.floor(200 * (el + 3)));
        const golds = MIS.filter(m => SV.med[m.id] === 'g').length, flown = MIS.filter(m => SV.med[m.id]).length;
        K.over(sc, { title: won ? 'TOY SQUADRON: ALL MISSIONS FLOWN!' : 'WINGS HUNG UP', text: `${flown}/${MIS.length} MISSIONS, ${golds} GOLD. ${initials ? initials.name + ' IS ON THE SQUADRON ROLL.' : 'SESSION TOTAL ' + sess + '.'}` });
      }
      // the table of session totals (Jack's mates have all had a go)
      function tableRank(sc) { let r = 0; while (r < SV.tbl.length && SV.tbl[r][1] >= sc) r++; return r; }
      function startInitials(after) { initials = { ch: ['Y', 'O', 'U'], at: 0, after, name: '' }; mode = 'initials'; K.music(SONGS.title); }
      // ---- the camera
      const cam = { x: 0, y: 10, z: -10, lx: 0, ly: 8, lz: 0 };
      function camSnap() { const b = C.kind === 'heli' ? 7 : 7.5; cam.x = C.x - C.fwd.x * b; cam.y = C.y + 2.6; cam.z = C.z - C.fwd.z * b; cam.lx = C.x; cam.ly = C.y; cam.lz = C.z; camera(1); }
      function camera(dt) {
        const Cm = T3.cam;
        if (mode === 'title' || mode === 'menu' || mode === 'map' || mode === 'brief' || mode === 'initials' || mode === 'done') {
          const a = titleA * 0.25; Cm.position.set(Math.sin(a) * 16, 11 + Math.sin(titleA * 0.4) * 2, Math.cos(a) * 16); Cm.lookAt(0, 8, 0); Cm.fov = 60; Cm.updateProjectionMatrix(); return;
        }
        const heli = C.kind === 'heli', back = heli ? 7.5 : 7.8 + (C.spd - 13) * 0.12, up = heli ? 3.2 : 2.4 - C.pitch * 1.5;
        const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
        const tx = C.x - fx * back, ty = C.y + up, tz = C.z - fz * back, k = 1 - Math.exp(-dt * (heli ? 5 : 6.5));
        cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
        // keep the camera inside the room
        cam.x = clamp(cam.x, -RM.w / 2 + 0.6, RM.w / 2 - 0.6); cam.z = clamp(cam.z, -RM.d / 2 + 0.6, RM.d / 2 - 0.6); cam.y = clamp(cam.y, 0.8, RM.h - 0.6);
        const kl = 1 - Math.exp(-dt * 9); cam.lx += (C.x + C.fwd.x * 4 - cam.lx) * kl; cam.ly += (C.y + C.fwd.y * 3 - cam.ly) * kl; cam.lz += (C.z + C.fwd.z * 4 - cam.lz) * kl;
        const sh = shake > 0 ? shake * 0.5 : 0; shake = Math.max(0, shake - dt * 2);
        Cm.position.set(cam.x + (rnd() - 0.5) * sh, cam.y + (rnd() - 0.5) * sh, cam.z + (rnd() - 0.5) * sh); Cm.lookAt(cam.lx, cam.ly, cam.lz); Cm.rotateZ(-C.roll * 0.22);
        const fov = 62 + (C.kind === 'plane' ? (C.spd - 13) * 0.9 : 0); if (Math.abs(Cm.fov - fov) > 0.1) { Cm.fov = fov; Cm.updateProjectionMatrix(); }
      }
      // ---- the autopilot (testing only: K.dbg.auto = true flies to the next target)
      const DBG = { auto: false, ff: 1, log: [] };
      function autopilot() {
        const t = (OBJ.approach || OBJ.target || (() => null))(); if (!t) return;
        const dx = t[0] - C.x, dy = t[1] - C.y, dz = t[2] - C.z, dh = Math.hypot(dx, dz);
        if (C.kind === 'heli') { const want = Math.atan2(dx, dz), e = wrapA(want - C.yaw), wy = dh > 3.5 ? Math.max(t[1] + 4, 14) : dh > 1.2 ? t[1] + 4 : t[1], ey = wy - C.y; padIn.x = clamp(-e * 2, -1, 1); padIn.y = Math.abs(e) < 0.5 && dh > 1.2 && Math.abs(ey) < 3 ? -clamp(dh / 6, 0.3, 1) : 0; padIn.a = ey > 0.6; padIn.x2 = ey < -0.6; padIn.b = M.def.type === 'ducks' && dh < 2.5 && dy < -4; return; }
        const want = Math.atan2(dx, dz), e = wrapA(want - C.yaw), pe = Math.atan2(dy, Math.max(dh, 1)) - C.pitch;
        padIn.x = clamp(-e * 2, -1, 1); padIn.y = -clamp(pe * 3, -1, 1); padIn.a = Math.abs(e) < 0.25 && dh > (M.def.type === 'chase' ? 9 : 14) && Math.abs(pe) < 0.3; const wallD = Math.min(C.fwd.x > 0 ? (RM.w / 2 - C.x) / C.fwd.x : (-RM.w / 2 - C.x) / C.fwd.x, C.fwd.z > 0 ? (RM.d / 2 - C.z) / C.fwd.z : (-RM.d / 2 - C.z) / C.fwd.z); padIn.x2 = Math.abs(e) > 0.7 || (wallD < 8 && Math.abs(e) > 0.3) || (M.def.type === 'chase' && dh < 2.5); padIn.b = M.def.type === 'balloons' && Math.abs(e) < 0.12 && Math.abs(pe) < 0.12;
      }
      // ---- the title / menu scenes live in the lounge with the plane doing loops
      let attract = null;
      function buildTitle() {
        clearObj(); buildRoom('lou', { cat: true }); setCraft('plane'); placeCraft(0, 10, 0, 0);
        attract = { a: 0 };
      }
      function updAttract(dt) {
        titleA += dt; attract.a += dt * 0.9;
        const a = attract.a, r = 13; C.x = Math.sin(a) * r; C.z = Math.cos(a) * r; C.y = 10 + Math.sin(a * 2) * 3; C.yaw = a + Math.PI / 2; C.pitch = Math.cos(a * 2) * 0.45; C.roll = 0.75;
        fwdOf(C.yaw, C.pitch, C.fwd); C.spd = 16; const g = C.mdl.g; g.position.set(C.x, C.y, C.z); g.rotation.set(-C.pitch, C.yaw, C.roll, 'YXZ'); C.mdl.prop.rotation.z += dt * 40; C.mdl.disc.visible = true; C.mdl.prop.visible = false;
        if (K.frame % 2 === 0) puff(C.x - C.fwd.x * 1.6, C.y - 0.1, C.z - C.fwd.z * 1.6, 0, 0.3, 0, 0.9, 0xffffff, 0);
        craftCommon(dt); updRoom(dt);
      }

      // ---------------------------------------------------------------- update: the modes
      const unlocked = i => i < SV.unl;
      function update(dt) {
        if (msg.t > 0) msg.t -= dt;
        if (pendingRep && mode !== 'play') report();
        if (mode === 'title') {
          updAttract(dt);
          if (K.pressed('start') || K.pressed('a')) { K.sfx.tone(1320, 0.08); mode = 'menu'; menu = Object.keys(SV.med).length ? 1 : 0; }
          return;
        }
        if (mode === 'menu') {
          updAttract(dt);
          const n = Object.keys(SV.med).length ? 2 : 1;
          if (K.pressed('up') || K.pressed('down')) { menu = (menu + 1) % n; K.sfx.tone(880, 0.04); }
          if (K.pressed('b')) { mode = 'title'; return; }
          if (K.pressed('start') || K.pressed('a')) {
            K.sfx.tone(1320, 0.08);
            if (menu === 0 && n === 2) { SV.med = {}; SV.best = {}; SV.unl = 1; save(); }
            sel = Math.min(SV.unl - 1, MIS.length - 1); mode = 'map';
          }
          return;
        }
        if (mode === 'map') {
          updAttract(dt);
          const N = MIS.length + 1; // the last slot: hang up your wings
          if (K.pressed('left') || K.pressed('up')) { sel = (sel + N - 1) % N; K.sfx.tone(880, 0.04); }
          if (K.pressed('right') || K.pressed('down')) { sel = (sel + 1) % N; K.sfx.tone(880, 0.04); }
          if (K.pressed('a') || K.pressed('start')) {
            if (sel === MIS.length) { K.sfx.tone(660, 0.1); if (sess > 0 && tableRank(sess) < 8) startInitials('quit'); else endSession(false); return; }
            if (unlocked(sel)) { K.sfx.tone(1320, 0.08); mode = 'brief'; briefT = 0; } else { K.sfx.tone(200, 0.15, 'square', 0.08); say('LOCKED', 'FINISH THE MISSION BEFORE IT', 1.2, '#ff8a8a'); }
          }
          return;
        }
        if (mode === 'brief') {
          updAttract(dt); briefT += dt;
          if (K.pressed('b')) { mode = 'map'; return; }
          if ((K.pressed('a') || K.pressed('start')) && briefT > 0.4) { K.sfx.tone(1320, 0.08); startMission(sel); }
          return;
        }
        if (mode === 'initials') {
          updAttract(dt); const I = initials;
          if (K.pressed('up')) { I.ch[I.at] = String.fromCharCode((I.ch[I.at].charCodeAt(0) - 65 + 25) % 26 + 65); K.sfx.tone(700, 0.04); }
          if (K.pressed('down')) { I.ch[I.at] = String.fromCharCode((I.ch[I.at].charCodeAt(0) - 65 + 1) % 26 + 65); K.sfx.tone(700, 0.04); }
          if (K.pressed('left')) { I.at = Math.max(0, I.at - 1); K.sfx.tone(500, 0.04); }
          if (K.pressed('right') || K.pressed('a')) { if (I.at < 2) { I.at++; K.sfx.tone(500, 0.04); } else { I.name = I.ch.join(''); SV.tbl.splice(tableRank(sess), 0, [I.name, sess]); SV.tbl = SV.tbl.slice(0, 8); save(); K.sfx.seq([[72, 0.25], [79, 0.25], [84, 0.5]], { bpm: 400, vol: 0.1 }); mode = 'table'; resT = 0; } }
          if (K.pressed('start')) { I.name = I.ch.join(''); SV.tbl.splice(tableRank(sess), 0, [I.name, sess]); SV.tbl = SV.tbl.slice(0, 8); save(); mode = 'table'; resT = 0; }
          return;
        }
        if (mode === 'table') { updAttract(dt); resT += dt; if (resT > 1 && (K.pressed('a') || K.pressed('start') || K.pressed('b'))) endSession(initials.after === 'won'); return; }
        if (mode === 'ending') {
          updAttract(dt); ending += dt;
          if (ending > 2 && (K.pressed('a') || K.pressed('start'))) { if (tableRank(sess) < 8) startInitials('won'); else endSession(true); }
          return;
        }
        if (mode === 'done') { updAttract(dt); return; }
        if (mode === 'result') {
          resT += dt; updRoom(dt); updParts(dt);
          if (M.done) { titleA += dt; const g = C.mdl.g; C.yaw += dt * 1.2; C.roll = 0.6; g.rotation.set(0, C.yaw, C.roll, 'YXZ'); C.mdl.prop.rotation.z += dt * 30; }
          if (resT > 1.2 && (K.pressed('a') || K.pressed('start'))) {
            K.sfx.tone(1320, 0.08);
            if (M.fail) { startMission(M.idx); return; }
            if (M.idx === MIS.length - 1 && M.done) { clearObj(); buildTitle(); mode = 'ending'; ending = 0; K.music(SONGS.title); return; }
            if (M.idx + 1 < MIS.length) { sel = M.idx + 1; startMission(sel); } else { clearObj(); buildTitle(); mode = 'map'; K.music(SONGS.title); }
            return;
          }
          if (resT > 1.2 && K.pressed('b')) { K.sfx.tone(660, 0.08); clearObj(); buildTitle(); sel = M.idx; mode = 'map'; K.music(SONGS.title); }
          return;
        }
        // ---- playing
        if (K.pressed('start')) { paused = !paused; K.sfx.tone(paused ? 440 : 880, 0.08); if (paused) K.music(null); else K.music(SONGS[M.def.dusk ? 'dusk' : ROOM_SONG[M.def.room]]); }
        if (paused) { if (K.pressed('b')) { paused = false; M.on = false; clearObj(); buildTitle(); mode = 'map'; K.music(SONGS.title); } return; }
        for (let s = 0; s < DBG.ff; s++) step(dt);
      }
      function step(dt) {
        if (cdT > 0) { // 3, 2, 1, GO! (the craft hangs in the air)
          const was = Math.ceil(cdT); cdT -= dt; if (cdT <= 0) { M.on = true; say('GO!', M.def.goal, 1.6, '#4aff5a'); K.sfx.tone(1320, 0.3, 'square', 0.1); } else if (Math.ceil(cdT) !== was) K.sfx.tone(660, 0.1, 'square', 0.08);
          readPad(); padIn.x = padIn.y = 0; padIn.a = padIn.b = padIn.x2 = false;
        } else readPad();
        if (C.kind === 'heli') flyHeli(dt); else flyPlane(dt);
        craftCommon(dt); updRoom(dt); updShots(dt); updParts(dt);
        if (M.on) {
          M.t += dt; M.bat -= dt; if (OBJ.update) OBJ.update(dt);
          if (M.bat <= 0 && M.on) { M.bat = 0; failMission(); }
          else if (M.bat < 10 && Math.ceil(M.bat) !== Math.ceil(M.bat + dt)) K.sfx.tone(1000, 0.05, 'square', 0.06);
        }
      }

      // ---------------------------------------------------------------- the HUD (2D on top)
      const panel = (x, y, w, h, a) => { H.fillStyle = `rgba(10,14,30,${a == null ? 0.6 : a})`; H.fillRect(x, y, w, h); H.fillStyle = 'rgba(255,255,255,.25)'; H.fillRect(x, y, w, 2); H.fillRect(x, y + h - 2, w, 2); };
      function logo(cx, y, k) { // TOY SQUADRON: fat extruded lettering with an outline, 1999 box-art style
        const big = 13 * k, small = 9 * k; H.save(); H.textAlign = 'center'; H.textBaseline = 'alphabetic'; H.lineJoin = 'round';
        const word = (txt, x, yy, px, top, bot, side) => {
          H.font = `900 ${px}px "Arial Black", Impact, "Arial Bold", sans-serif`;
          for (let i = Math.round(px / 9); i > 0; i--) { H.fillStyle = i === 1 ? side : (i % 2 ? side : '#1a1a22'); H.fillText(txt, x + i * 1.2, yy + i * 1.4); }
          H.lineWidth = px / 9; H.strokeStyle = '#1a1a22'; H.strokeText(txt, x, yy);
          const gr = H.createLinearGradient(0, yy - px * 0.75, 0, yy); gr.addColorStop(0, top); gr.addColorStop(0.55, top); gr.addColorStop(0.56, bot); gr.addColorStop(1, bot); H.fillStyle = gr; H.fillText(txt, x, yy);
          H.lineWidth = Math.max(1, px / 40); H.strokeStyle = 'rgba(255,255,255,.55)'; H.strokeText(txt, x - 1, yy - 1);
        };
        H.rotate(-0.04); word('TOY', cx - 70 * k / 6 + 6, y + big, big, '#ff6a4a', '#d82a1a', '#7a1408'); H.rotate(0.04);
        word('SQUADRON', cx + 10 * k / 6, y + big + small + 2, small, '#7ab0ff', '#2a62e0', '#0e2a7a');
        H.restore();
      }
      const medCol = { g: '#ffd23a', s: '#d8d8e8', b: '#c88a4a' }, medName = { g: 'GOLD', s: 'SILVER', b: 'BRONZE' };
      function medal(x, y, m, r) { r = r || 10; H.fillStyle = m ? medCol[m] : 'rgba(255,255,255,.15)'; H.beginPath(); H.arc(x, y, r, 0, 7); H.fill(); if (m) { H.fillStyle = 'rgba(0,0,0,.25)'; H.beginPath(); H.arc(x, y, r * 0.65, 0, 7); H.fill(); H.fillStyle = medCol[m]; H.beginPath(); H.arc(x - r * 0.1, y - r * 0.1, r * 0.5, 0, 7); H.fill(); } else { H.strokeStyle = 'rgba(255,255,255,.3)'; H.lineWidth = 2; H.beginPath(); H.arc(x, y, r, 0, 7); H.stroke(); } }
      function craftIcon(x, y, heli) { H.fillStyle = heli ? '#f0b820' : '#e23a2a'; if (heli) { H.fillRect(x - 8, y - 3, 16, 8); H.fillRect(x + 6, y - 1, 12, 3); H.fillStyle = '#222'; H.fillRect(x - 16, y - 7, 32, 2); H.fillRect(x - 1, y - 7, 2, 4); } else { H.fillRect(x - 12, y - 2, 26, 5); H.fillStyle = '#f6ecd0'; H.fillRect(x - 4, y - 10, 5, 20); H.fillRect(x - 13, y - 6, 4, 8); H.fillStyle = '#222'; H.fillRect(x + 14, y - 5, 2, 10); } }
      function battery(x, y, w, h, f) {
        H.fillStyle = '#fff'; H.fillRect(x, y, w, h); H.fillRect(x + w, y + h * 0.3, 5, h * 0.4); H.fillStyle = '#10141e'; H.fillRect(x + 3, y + 3, w - 6, h - 6);
        const c = f > 0.5 ? '#4aff5a' : f > 0.25 ? '#ffe040' : ((K.t * 6 | 0) % 2 ? '#ff3a3a' : '#ff9a9a'); H.fillStyle = c; const segs = 5; for (let i = 0; i < segs; i++) { if (f > i / segs) H.fillRect(x + 5 + i * ((w - 10) / segs), y + 5, (w - 10) / segs - 3, h - 10); }
      }
      function marker(t) { // where the next thing is: a diamond on it, or an arrow at the edge of the screen
        const v = V3(t[0], t[1], t[2]).project(T3.cam); const on = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
        const d = Math.hypot(t[0] - C.x, t[1] - C.y, t[2] - C.z);
        if (on) { const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * HH, s = 10 + Math.sin(K.t * 8) * 2; H.strokeStyle = '#4aff5a'; H.lineWidth = 3; H.beginPath(); H.moveTo(x, y - s); H.lineTo(x + s, y); H.lineTo(x, y + s); H.lineTo(x - s, y); H.closePath(); H.stroke(); F.center(H, Math.round(d) + 'M', x, y + s + 6, '#4aff5a', 1, '#000'); }
        else { let ax = v.z < 1 ? v.x : -v.x, ay = v.z < 1 ? v.y : -v.y; const m = Math.max(Math.abs(ax), Math.abs(ay), 0.001); ax /= m; ay /= m; const x = (ax + 1) / 2 * (W - 60) + 30, y = (1 - ay) / 2 * (HH - 110) + 70, ang = Math.atan2(-ay, ax); H.save(); H.translate(x, y); H.rotate(ang); H.fillStyle = '#4aff5a'; H.beginPath(); H.moveTo(16, 0); H.lineTo(-8, -11); H.lineTo(-3, 0); H.lineTo(-8, 11); H.closePath(); H.fill(); H.restore(); F.center(H, Math.round(d) + 'M', x, y + 18, '#4aff5a', 1, '#000'); }
      }
      function hud() {
        H.clearRect(0, 0, W, HH);
        const Tb = ((K.t * 2 | 0) % 2);
        if (mode === 'title' || mode === 'menu') {
          H.fillStyle = 'rgba(0,0,0,.25)'; H.fillRect(0, 0, W, HH);
          for (let x = -20; x < W + 20; x += 40) { H.fillStyle = (x / 40) % 2 ? '#ffd23a' : '#3a78f0'; H.beginPath(); H.moveTo(x, 262); H.lineTo(x + 40, 262); H.lineTo(x + 30, 278); H.lineTo(x - 10, 278); H.fill(); }
          logo(W / 2, 70, 7);
          F.center(H, 'SKY-HIGH ADVENTURE IN A VERY BIG HOUSE', W / 2, 286, '#fff', 2, '#000');
          if (mode === 'title') { if (Tb) F.center(H, 'PRESS START', W / 2, 330, '#fff', 3, '#000'); }
          else { const opts = Object.keys(SV.med).length ? ['NEW GAME', 'CONTINUE'] : ['NEW GAME']; panel(W / 2 - 120, 300, 240, 30 + opts.length * 30, 0.7); opts.forEach((s, i) => F.center(H, (i === menu ? '> ' : '  ') + s + (i === menu ? ' <' : '  '), W / 2, 316 + i * 30, i === menu ? '#ffe14a' : '#fff', 2)); if (opts.length === 2) F.center(H, Object.keys(SV.med).length + ' OF ' + MIS.length + ' MISSIONS FLOWN', W / 2, 316 + 2 * 30, '#9ad8ff', 1); }
          F.center(H, 'SQUADRON ROLL: ' + SV.tbl[0][0] + ' ' + SV.tbl[0][1].toLocaleString('en-GB') + '   HI-SCORE ' + K.best.toLocaleString('en-GB'), W / 2, 420, '#9ad8ff', 2, '#000');
          F.center(H, '(C) 1999 TOYBOX GAMES. ALL TOYS ARE THEIR OWN.', W / 2, 452, '#ddd', 1, '#000');
          return;
        }
        if (mode === 'map') { drawMap(); return; }
        if (mode === 'brief') { drawBrief(); return; }
        if (mode === 'initials' || mode === 'table') { drawTable(); return; }
        if (mode === 'ending') { drawEnding(); return; }
        if (mode === 'done') return;
        if (mode === 'result') { drawResult(); return; }
        // ---- flying
        battery(16, 14, 110, 34, clamp(M.bat / Math.max(M.def.bat, 1), 0, 1));
        F.draw(H, mt(Math.ceil(M.bat)), 140, 20, M.bat < 10 ? '#ff6a6a' : '#fff', 3, '#000');
        F.draw(H, 'BATTERY', 16, 52, '#9ad8ff', 1, '#000');
        const lab = OBJ.label ? OBJ.label() : ''; panel(W - 16 - F.width(lab, 2) - 24, 14, F.width(lab, 2) + 24, 32, 0.55); F.draw(H, lab, W - 16 - F.width(lab, 2) - 12, 22, '#ffe040', 2);
        F.draw(H, 'TIME ' + mt1(M.t), W - 16 - F.width('TIME 0:00.0', 2), 52, '#fff', 2, '#000');
        if (OBJ.lock) { const f = clamp(OBJ.lock(), 0, 1); panel(W / 2 - 110, HH - 50, 220, 36, 0.55); H.fillStyle = '#333'; H.fillRect(W / 2 - 100, HH - 30, 200, 10); H.fillStyle = f > 0.99 ? '#4aff5a' : '#4ab0ff'; H.fillRect(W / 2 - 100, HH - 30, 200 * f, 10); F.center(H, 'LOCK', W / 2, HH - 44, '#fff', 1); }
        if (OBJ.carU) { const f = clamp(OBJ.carU(), 0, 1); panel(W / 2 - 110, HH - 50, 220, 36, 0.55); H.fillStyle = '#333'; H.fillRect(W / 2 - 100, HH - 30, 200, 10); H.fillStyle = f > 0.8 ? '#ff6a6a' : '#8ad0ff'; H.fillRect(W / 2 - 100, HH - 30, 200 * f, 10); F.center(H, "DAVE'S CAR", W / 2, HH - 44, '#fff', 1); H.fillStyle = '#2a68c8'; H.fillRect(W / 2 - 104 + 200 * f, HH - 34, 10, 6); }
        // speed / mode strip, bottom left
        if (C.kind === 'plane') { F.draw(H, C.turbo ? 'TURBO!' : C.brake ? 'AIR BRAKE' : Math.round(C.spd * 3) + ' MPH', 16, HH - 30, C.turbo ? '#ff8a3a' : C.brake ? '#8ad0ff' : '#fff', 2, '#000'); if (C.landed) F.draw(H, 'LANDED ON THE CAT!', 16, HH - 50, '#ff9ab0', 1, '#000'); }
        else F.draw(H, (C.vy > 0.5 ? 'CLIMBING' : C.vy < -0.5 ? 'DESCENDING' : 'HOVER') + '  ALT ' + Math.round(C.y) + 'M', 16, HH - 30, '#fff', 2, '#000');
        if (M.on && OBJ.target) { const t = OBJ.target(); if (t) marker(t); }
        if (cdT > 0) { F.center(H, String(Math.ceil(cdT)), W / 2, HH / 2 - 40, '#ffe040', 9, '#000'); F.center(H, 'GET READY', W / 2, HH / 2 + 40, '#fff', 2, '#000'); if (M.t === 0) { const c = C.kind === 'heli' ? 'STICK: STEER  ' + K.label('a') + ': UP  ' + K.label('x') + ': DOWN  ' + K.label('b') + ': DROP' : 'STICK: STEER (UP CLIMBS)  ' + K.label('a') + ': TURBO  ' + K.label('x') + ': BRAKE  ' + K.label('b') + ': PEAS'; F.center(H, c, W / 2, HH - 70, '#9ad8ff', 1, '#000'); } }
        if (msg.t > 0) { const k = msg.t < 0.3 ? 1 : 1; F.center(H, msg.a, W / 2, cdT > 0 ? 60 : 110, msg.c, 4, '#000'); if (msg.b) F.center(H, msg.b, W / 2, cdT > 0 ? 100 : 150, '#fff', 2, '#000'); }
        if (paused) { H.fillStyle = 'rgba(0,0,0,.6)'; H.fillRect(0, 0, W, HH); F.center(H, 'PAUSED', W / 2, HH / 2 - 50, '#fff', 6, '#000'); F.center(H, 'PRESS START TO CARRY ON', W / 2, HH / 2 + 20, '#ffe040', 2); F.center(H, '(' + K.label('b') + ') GIVE UP AND GO BACK TO THE MAP', W / 2, HH / 2 + 48, '#9ad8ff', 2); }
      }
      function drawMap() {
        H.fillStyle = 'rgba(0,0,0,.45)'; H.fillRect(0, 0, W, HH);
        F.center(H, 'MISSION SELECT: THE HOUSE', W / 2, 14, '#ffe040', 3, '#000');
        // the house, cut away: roof, upstairs (bedroom, bathroom), downstairs (lounge, kitchen)
        const hx = 40, hy = 60, hw = 320, hh = 300;
        H.fillStyle = '#b03a2a'; H.beginPath(); H.moveTo(hx - 16, hy + 70); H.lineTo(hx + hw / 2, hy); H.lineTo(hx + hw + 16, hy + 70); H.fill(); H.fillStyle = '#8a2a1a'; for (let i = 0; i < 6; i++) H.fillRect(hx + 10 + i * 52, hy + 40 + i * 0, 0, 0);
        H.fillStyle = '#e8d8b8'; H.fillRect(hx, hy + 70, hw, hh - 70); H.fillStyle = '#6a4a2a'; H.fillRect(hx, hy + 70 + (hh - 70) / 2 - 4, hw, 8); H.fillRect(hx + hw / 2 - 4, hy + 70, 8, hh - 70);
        const rooms = { bed: [hx, hy + 70, hw / 2, (hh - 70) / 2, '#9cc4ee', "JACK'S ROOM"], bath: [hx + hw / 2, hy + 70, hw / 2, (hh - 70) / 2, '#c8e8f0', 'BATHROOM'], lou: [hx, hy + 70 + (hh - 70) / 2, hw / 2, (hh - 70) / 2, '#e6d8b8', 'LOUNGE'], kit: [hx + hw / 2, hy + 70 + (hh - 70) / 2, hw / 2, (hh - 70) / 2, '#f6eed6', 'KITCHEN'] };
        for (const id in rooms) { const [x, y, w, h, c, n] = rooms[id]; H.fillStyle = c; H.fillRect(x + 6, y + 6, w - 12, h - 12); H.fillStyle = id === 'lou' ? '#9a6a4a' : id === 'kit' ? '#2a3038' : '#c89a5a'; H.fillRect(x + 6, y + h - 16, w - 12, 10); F.draw(H, n, x + 12, y + 12, '#333', 1); }
        // furniture doodles
        H.fillStyle = '#8a5a2a'; H.fillRect(hx + 20, hy + 150, 50, 24); H.fillStyle = '#3a78d8'; H.fillRect(hx + 20, hy + 140, 50, 10); // bunk
        H.fillStyle = '#f8f8ff'; H.fillRect(hx + hw / 2 + 20, hy + 160, 70, 18); H.fillStyle = '#5ab8e8'; H.fillRect(hx + hw / 2 + 24, hy + 164, 62, 6); // bath
        H.fillStyle = '#3a6a9a'; H.fillRect(hx + 100, hy + 300, 50, 22); H.fillStyle = '#202020'; H.fillRect(hx + 20, hy + 290, 30, 24); H.fillStyle = '#58b8f0'; H.fillRect(hx + 23, hy + 293, 24, 16); // sofa, telly
        H.fillStyle = '#e8c48a'; H.fillRect(hx + hw / 2 + 40, hy + 300, 60, 6); H.fillRect(hx + hw / 2 + 44, hy + 306, 4, 16); H.fillRect(hx + hw / 2 + 92, hy + 306, 4, 16); H.fillStyle = '#f4f4f8'; H.fillRect(hx + hw / 2 + 12, hy + 280, 18, 42); // table, fridge
        // mission pins
        const PIN = { school: [hx + 110, hy + 120], paper: [hx + 60, hy + 100], party: [hx + 70, hy + 250], clock: [hx + 130, hy + 270], tour: [hx + 40, hy + 230], sugar: [hx + hw / 2 + 110, hy + 260], volt: [hx + hw / 2 + 50, hy + 240], splash: [hx + hw / 2 + 60, hy + 120] };
        MIS.forEach((m, i) => { const [x, y] = PIN[m.id], on = i === sel, ul = unlocked(i); H.fillStyle = on ? '#ffe040' : ul ? '#ff4a3a' : '#777'; H.beginPath(); H.arc(x, y, on ? 13 + Math.sin(K.t * 8) * 2 : 11, 0, 7); H.fill(); H.fillStyle = '#000'; H.beginPath(); H.arc(x, y, on ? 10 : 8, 0, 7); H.fill(); F.center(H, String(i + 1), x, y - 3, on ? '#ffe040' : '#fff', 1); if (SV.med[m.id]) medal(x + 11, y - 10, SV.med[m.id], 6); });
        // the info card
        const cx = 390, cy = 60, cw = 234;
        panel(cx, cy, cw, 300, 0.75);
        if (sel < MIS.length) {
          const m = MIS[sel], ul = unlocked(sel);
          F.draw(H, 'MISSION ' + (sel + 1), cx + 12, cy + 12, '#9ad8ff', 2); F.draw(H, m.n, cx + 12, cy + 34, ul ? '#ffe040' : '#888', 2);
          F.draw(H, ROOMN[m.room], cx + 12, cy + 58, '#fff', 1); craftIcon(cx + cw - 30, cy + 40, m.craft === 'heli'); F.draw(H, m.craft === 'heli' ? 'HELICOPTER' : 'PLANE', cx + cw - 12 - F.width(m.craft === 'heli' ? 'HELICOPTER' : 'PLANE', 1), cy + 58, '#9ad8ff', 1);
          if (!ul) { F.center(H, 'LOCKED', cx + cw / 2, cy + 120, '#ff8a8a', 3); F.center(H, 'FINISH MISSION ' + sel + ' FIRST', cx + cw / 2, cy + 150, '#fff', 1); }
          else {
            const lines = wrap(m.goal, 36); lines.forEach((l, i) => F.draw(H, l, cx + 12, cy + 84 + i * 12, '#fff', 1));
            medal(cx + 26, cy + 140, SV.med[m.id], 12); F.draw(H, SV.med[m.id] ? medName[SV.med[m.id]] : 'NOT FLOWN YET', cx + 46, cy + 134, SV.med[m.id] ? medCol[SV.med[m.id]] : '#aaa', 1);
            F.draw(H, SV.best[m.id] ? 'BEST TIME ' + mt1(SV.best[m.id]) : '', cx + 46, cy + 146, '#fff', 1);
            F.draw(H, 'GOLD UNDER ' + mt(m.gold) + '   SILVER UNDER ' + mt(m.silver), cx + 12, cy + 172, '#9ad8ff', 1);
            if (m.id === 'party' || m.id === 'tour' || m.id === 'clock') F.draw(H, 'THE CAT IS IN HERE. A SOFT LANDING?', cx + 12, cy + 190, '#ff9ab0', 1);
            if (Tb2()) F.center(H, 'PRESS ' + K.label('a') + ' TO FLY', cx + cw / 2, cy + 270, '#ffe040', 2);
          }
        } else {
          F.draw(H, 'HANG UP YOUR WINGS', cx + 12, cy + 12, '#ffe040', 2); wrap('Finish flying for today. Your session total goes on the Squadron Roll and to JackNet.', 36).forEach((l, i) => F.draw(H, l, cx + 12, cy + 44 + i * 12, '#fff', 1));
          F.draw(H, 'SESSION TOTAL', cx + 12, cy + 110, '#9ad8ff', 1); F.draw(H, sess.toLocaleString('en-GB'), cx + 12, cy + 124, '#fff', 3);
          if (Tb2()) F.center(H, 'PRESS ' + K.label('a') + ' TO FINISH', cx + cw / 2, cy + 270, '#ffe040', 2);
        }
        const golds = MIS.filter(m => SV.med[m.id] === 'g').length;
        F.draw(H, 'GOLDS ' + golds + '/' + MIS.length + (golds === MIS.length ? '  TOY BOX ACE!' : '  (ALL GOLD = TOY BOX ACE)'), hx, 378, '#ffd23a', 1, '#000');
        F.draw(H, 'SESSION ' + sess.toLocaleString('en-GB') + '   ROLL: ' + SV.tbl[0][0] + ' ' + SV.tbl[0][1].toLocaleString('en-GB'), hx, 392, '#fff', 1, '#000');
        panel(0, HH - 40, W, 40, 0.7);
        F.center(H, 'LEFT/RIGHT: PICK A MISSION   ' + K.label('a') + ': GO   (SELECT THE LAST SLOT TO FINISH)', W / 2, HH - 26, '#fff', 1);
        if (msg.t > 0) F.center(H, msg.a + (msg.b ? ' - ' + msg.b : ''), W / 2, 420, msg.c, 2, '#000');
      }
      const Tb2 = () => (K.t * 2 | 0) % 2 === 0;
      function wrap(s, n) { const out = []; let cur = ''; for (const w of String(s).split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) out.push(cur.trim()); return out; }
      function drawBrief() {
        const m = MIS[sel]; H.fillStyle = 'rgba(0,0,0,.55)'; H.fillRect(0, 0, W, HH);
        panel(60, 50, W - 120, 380, 0.8);
        H.fillStyle = m.craft === 'heli' ? '#f0b820' : '#e23a2a'; H.fillRect(60, 50, W - 120, 6);
        F.draw(H, 'MISSION ' + (sel + 1) + ' BRIEFING', 84, 70, '#9ad8ff', 2); F.draw(H, m.n, 84, 94, '#ffe040', 3); F.draw(H, ROOMN[m.room] + '   ' + (m.craft === 'heli' ? 'TOY HELICOPTER' : 'TOY PLANE'), 84, 124, '#fff', 1);
        craftIcon(W - 110, 92, m.craft === 'heli');
        let y = 150; for (const line of m.brief) { for (const l of wrap(line, 42)) { F.draw(H, l, 84, y, '#fff', 2); y += 20; } y += 8; }
        F.draw(H, 'GOAL: ' + m.goal, 84, 320, '#4aff5a', 1); F.draw(H, 'BATTERY ' + mt(m.bat) + '   GOLD UNDER ' + mt(m.gold) + '   SILVER UNDER ' + mt(m.silver), 84, 334, '#9ad8ff', 1);
        const ctl = m.craft === 'heli' ? ['STICK: TURN / FORWARD / BACK', K.label('a') + ': CLIMB   ' + K.label('x') + ': DESCEND   ' + K.label('b') + ': DROP A WATER BALLOON'] : ['STICK: BANK / CLIMB (UP) / DIVE (DOWN)', K.label('a') + ': TURBO   ' + K.label('x') + ': AIR BRAKE   ' + K.label('b') + ': PEA SHOOTER'];
        F.draw(H, ctl[0], 84, 356, '#ddd', 1); F.draw(H, ctl[1], 84, 368, '#ddd', 1); F.draw(H, 'START: PAUSE', 84, 380, '#ddd', 1);
        if (Tb2()) F.center(H, 'PRESS ' + K.label('a') + ' TO TAKE OFF   (' + K.label('b') + ' BACK)', W / 2, 406, '#ffe040', 2);
      }
      function drawResult() {
        const k = clamp(resT * 3, 0, 1);
        H.fillStyle = `rgba(0,0,0,${0.5 * k})`; H.fillRect(0, 0, W, HH);
        if (M.fail) {
          F.center(H, 'BATTERIES FLAT!', W / 2, 110, '#ff6a6a', 5, '#000'); F.center(H, M.def.type === 'race' ? "DAVE'S CAR FINISHED FIRST." : 'MISSION FAILED. HAVE ANOTHER GO!', W / 2, 170, '#fff', 2, '#000');
          F.center(H, (OBJ.label ? OBJ.label() : '') + '   TIME ' + mt1(M.t), W / 2, 210, '#9ad8ff', 2, '#000');
          if (resT > 1.2 && Tb2()) { F.center(H, K.label('a') + ': TRY AGAIN', W / 2, 300, '#ffe040', 3, '#000'); F.center(H, K.label('b') + ': BACK TO THE MAP', W / 2, 340, '#fff', 2, '#000'); }
          return;
        }
        const R = M.res; panel(90, 60, W - 180, 360, 0.75 * k);
        F.center(H, 'MISSION COMPLETE!', W / 2, 78, '#4aff5a', 4, '#000'); F.center(H, M.def.n, W / 2, 116, '#ffe040', 2);
        const rows = [['TIME', mt1(R.t) + (R.newBest ? '  NEW BEST!' : '')], ['BATTERY LEFT', mt(Math.ceil(M.bat)) + '  +' + Math.min(1000, Math.round(M.bat * 12))], ['BONUSES', M.picks + ' x 50'], ['BONKS', M.bonks + (M.bonks ? '  -' + Math.min(400, M.bonks * 50) : '  CLEAN!')]];
        rows.forEach(([a, b], i) => { if (resT > 0.6 + i * 0.35) { F.draw(H, a, 120, 150 + i * 26, '#9ad8ff', 2); F.draw(H, b, W - 120 - F.width(b, 2), 150 + i * 26, '#fff', 2); if (i === rows.length - 1 || resT < 0.6 + (i + 1) * 0.35) {} } });
        if (resT > 2.1) { medal(W / 2 - 90, 290, R.med, 22); F.draw(H, medName[R.med] + '!', W / 2 - 56, 272, medCol[R.med], 4); F.draw(H, R.med === 'g' ? 'ACE FLYING!' : 'GOLD UNDER ' + mt(M.def.gold), W / 2 - 56, 306, '#fff', 1); }
        if (resT > 2.6) { F.center(H, 'MISSION SCORE ' + R.pts.toLocaleString('en-GB') + '   SESSION ' + sess.toLocaleString('en-GB'), W / 2, 340, '#ffe040', 2); }
        if (resT > 1.2 && Tb2()) F.center(H, (M.idx + 1 < MIS.length ? K.label('a') + ': NEXT MISSION' : K.label('a') + ': CONTINUE') + '   ' + K.label('b') + ': MAP', W / 2, 390, '#fff', 2);
      }
      function drawTable() {
        H.fillStyle = 'rgba(0,0,0,.55)'; H.fillRect(0, 0, W, HH); panel(120, 40, W - 240, 400, 0.8);
        F.center(H, 'SQUADRON ROLL OF HONOUR', W / 2, 56, '#ffe040', 3);
        if (mode === 'initials') {
          F.center(H, 'YOU MADE THE ROLL! ENTER YOUR NAME', W / 2, 92, '#fff', 2); F.center(H, 'SESSION TOTAL ' + sess.toLocaleString('en-GB'), W / 2, 116, '#9ad8ff', 2);
          const I = initials; for (let i = 0; i < 3; i++) { const x = W / 2 - 60 + i * 60, on = i === I.at; panel(x - 24, 150, 48, 60, on ? 0.9 : 0.5); F.center(H, I.ch[i], x, 164, on && !Tb2() ? '#ffe040' : '#fff', 5); if (on) { F.center(H, '↑', x, 136, '#ffe040', 2); F.center(H, '↓', x, 214, '#ffe040', 2); } }
          F.center(H, 'UP/DOWN: LETTER   LEFT/RIGHT: MOVE   ' + K.label('a') + ': OK', W / 2, 240, '#9ad8ff', 1);
          const rank = tableRank(sess); SV.tbl.slice(0, 7).forEach((r, i) => { const y = 270 + (i >= rank ? i + 1 : i) * 18; F.draw(H, (i >= rank ? i + 2 : i + 1) + '. ' + r[0], 170, y, '#ccc', 1); F.draw(H, r[1].toLocaleString('en-GB'), W - 170 - F.width(r[1].toLocaleString('en-GB'), 1), y, '#ccc', 1); });
          const y = 270 + rank * 18; F.draw(H, (rank + 1) + '. ' + I.ch.join(''), 170, y, '#ffe040', 1); F.draw(H, sess.toLocaleString('en-GB'), W - 170 - F.width(sess.toLocaleString('en-GB'), 1), y, '#ffe040', 1);
        } else {
          SV.tbl.slice(0, 8).forEach((r, i) => { const me = initials && r[0] === initials.name && r[1] === sess, y = 110 + i * 30; F.draw(H, (i + 1) + '. ' + r[0], 170, y, me ? '#ffe040' : '#fff', 2); F.draw(H, r[1].toLocaleString('en-GB'), W - 170 - F.width(r[1].toLocaleString('en-GB'), 2), y, me ? '#ffe040' : '#fff', 2); });
          if (resT > 1 && Tb2()) F.center(H, 'PRESS ' + K.label('a'), W / 2, 400, '#ffe040', 2);
        }
      }
      function drawEnding() {
        H.fillStyle = 'rgba(0,0,0,.45)'; H.fillRect(0, 0, W, HH);
        logo(W / 2, 50, 5);
        F.center(H, 'ALL MISSIONS FLOWN!', W / 2, 190, '#4aff5a', 4, '#000');
        const golds = MIS.filter(m => SV.med[m.id] === 'g').length;
        wrap(golds === MIS.length ? 'Every mission gold. The squadron salutes you, Toy Box Ace! Even the cat looked impressed. (It did not.)' : 'You are a fully fledged Toy Squadron pilot! ' + golds + ' gold medals so far. Go back for the rest, ace, and mind the cat.', 46).forEach((l, i) => F.center(H, l, W / 2, 240 + i * 18, '#fff', 2, '#000'));
        MIS.forEach((m, i) => medal(W / 2 - 112 + i * 32, 330, SV.med[m.id], 11));
        F.center(H, 'SESSION TOTAL ' + sess.toLocaleString('en-GB'), W / 2, 360, '#ffe040', 2, '#000');
        if (ending > 2 && Tb2()) F.center(H, 'PRESS ' + K.label('a'), W / 2, 420, '#fff', 2, '#000');
      }

      // ---------------------------------------------------------------- go
      buildTitle(); K.music(SONGS.title);
      K.dbg = { DBG, M, C, SV, get mode() { return mode; }, set mode(v) { mode = v; }, warp(i) { sel = i; startMission(i); }, go() { cdT = 0.01; }, finish: finishMission, fail: failMission, obj: () => OBJ, sess: () => sess, cat: () => RM && RM.cat };
      return {
        update(dt) { update(dt); camera(dt); },
        draw() { T3.render(); hud(); },
        end() { K.music(null); dropRoom(); },
      };
    },
  });
})();

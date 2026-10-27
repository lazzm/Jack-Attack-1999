/* WOBBLE PARTY 64 — original Ultra 64 board party. Cartridge-owned boards,
 * minigames, practice house, solo expedition and deterministic continuation. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;

  // ================================================================ the cast (made-up game characters) and the mates
  const CHARS = [
    { id: 'bolt', n: 'BOLT', what: 'THE WIND-UP ROBOT', col: 0x4a8ae8, css: '#4a8ae8', line: 'LOVES SUMS. HATES RAIN.', face: 1.24 },
    { id: 'pip', n: 'PIP', what: 'THE CHEEKY FROG', col: 0x3ec04a, css: '#3ec04a', line: 'HOPS FIRST. THINKS LATER.', face: 0.92 },
    { id: 'wisp', n: 'WISP', what: 'THE SHY GHOST', col: 0xb48ae8, css: '#b48ae8', line: 'SAYS BOO. MEANS HELLO.', face: 1.02, float: true },
    { id: 'sprout', n: 'SIR SPROUT', what: 'THE BRAVE KNIGHT', col: 0xe04a3a, css: '#e04a3a', line: 'FEARLESS. EXCEPT OF GEESE.', face: 1.2 },
    { id: 'comet', n: 'COMET', what: 'THE SPACE CAT', col: 0xf0962a, css: '#f0962a', line: 'BEEN TO THE MOON. TWICE.', face: 1.18 },
    { id: 'chompy', n: 'CHOMPY', what: 'THE HUNGRY DINO', col: 0xe05ab8, css: '#e05ab8', line: 'WILL EAT YOUR CRISPS.', face: 1.12 },
  ];
  const castName = id => String(window.Cast ? (id === 'me' ? Cast.me().first : Cast.n(id)) : id === 'me' ? 'YOU' : 'MATE ' + id.slice(-1)).toUpperCase();
  const MATES = [
    { id: 'mate2', fav: 1, win: 'FROG POWER!', lose: 'NOT FAIR ON THE FROG!', star: 'THE FROG GETS A STAR!', red: 'AW, POOR FROG.' },
    { id: 'mate1', fav: 5, win: 'EASY. TOO EASY.', lose: 'THAT DICE HAS CORNERS!', star: 'MINE! ALL MINE!', red: 'OI! REFUND!' },
    { id: 'mate3', fav: 0, win: 'CALCULATED.', lose: 'MY PAD IS BROKEN.', star: 'ALL PART OF THE PLAN.', red: 'LAG!' },
    { id: 'mate4', fav: 4, win: 'WRITE THAT DOWN!', lose: 'BEST OF SEVEN?', star: 'HELLO, SPARKLY!', red: 'THAT ONE DOES NOT COUNT!' },
  ].map(m=>Object.defineProperty(m,'n',{enumerable:true,get:()=>castName(m.id)}));
  const HALL0 = () => MATES.concat(MATES).map((m, i) => [m.n, 15000 - i * 1700, m.fav]);
  const BOARDS = [
    { n: 'WOBBLE ISLAND', sub: 'THE JELLYBEAN JUBILEE', desc: 'WINDMILL TAX: EVENTS TURN THE SAILS. EVERY THIRD EVENT PAYS ALL PLAYERS 5 COINS.', col: '#53c353', cost: 20 },
    { n: 'CLOCKWORK CARNIVAL', sub: 'THE FAIR THAT NEVER CLOCKS OFF', desc: 'THE CLOCK REVERSES THE MIDDLE ROUTE EACH ROUND. EVENTS WIND UP A 9-COIN JACKPOT.', col: '#f5ae45', cost: 20 },
    { n: 'COUNT CRUMBLE KEEP', sub: 'PLEASE WIPE YOUR FEET', desc: 'THE COUNT CHARGES 10, 20 OR 30 COINS PER STAR. EVENTS LOWER THE PRICE. BEWARE HIS TAX!', col: '#b18be8', cost: 20 },
  ];
  const DIFF = ['EASY', 'NORMAL', 'HARD'], TURNS = [5, 8, 12, 20];
  const ORD = ['1ST', '2ND', '3RD', '4TH'];
  const ITEMS = {
    twin: { n: 'TWIN DICE', cost: 5, d: 'HIT TWO DICE BLOCKS THIS TURN.' },
    warp: { n: 'SWAP KAZOO', cost: 8, d: 'SWAP PLACES WITH A RANDOM RIVAL.' },
    magnet: { n: 'COIN MAGNET', cost: 6, d: 'PINCH 3 COINS FROM EVERY RIVAL.' },
  };
  const STAR_COST = 20;

  // ================================================================ tunes (all original)
  const SONGS = {
    title: { bpm: 126, wave: 'triangle', vol: 0.07, bassWave: 'triangle', drums: 'o...x.o.o...x...',
      lead: [72, -1, 76, -1, 79, -1, 76, 74, 72, -1, 74, 76, 74, -1, 67, -1, 69, -1, 72, -1, 76, -1, 74, 72, 71, -1, 72, 74, -1, -1, 0, 0,
        72, -1, 76, -1, 79, -1, 81, 79, 77, -1, 76, 74, 72, -1, 69, -1, 71, -1, 74, -1, 77, -1, 76, 74, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 60, 0, 57, 0, 50, 0, 57, 0, 53, 0, 57, 0, 55, 0, 59, 0, 62, 0, 59, 0] },
    board: { bpm: 112, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o..xo.x.o..xo.xx',
      lead: [67, 0, 72, 0, 74, 0, 76, -1, 74, 72, 0, 69, -1, 0, 67, 0, 65, 0, 69, 0, 72, 0, 74, -1, 72, 69, 0, 67, -1, -1, 0, 0,
        67, 0, 72, 0, 74, 0, 76, -1, 79, 77, 76, 74, -1, 72, -1, 0, 74, 0, 72, 0, 71, 0, 72, -1, -1, -1, 0, 0, 67, 0, 69, 71],
      bass: [48, 0, 48, 55, 52, 0, 48, 0, 53, 0, 53, 60, 57, 0, 53, 0, 50, 0, 50, 57, 53, 0, 50, 0, 43, 0, 43, 50, 47, 0, 43, 0] },
    last: { bpm: 132, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o.xxo.x.o.xxo.xx',
      lead: [69, 0, 72, 0, 76, -1, 74, 72, 74, 0, 77, 0, 76, -1, 72, 0, 69, 0, 72, 0, 76, -1, 79, 77, 76, -1, 74, -1, 72, -1, 0, 0],
      bass: [45, 0, 45, 52, 41, 0, 41, 48, 43, 0, 43, 50, 40, 0, 44, 0] },
    mgA: { bpm: 150, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o.x.o.x.o.xxo.x.',
      lead: [69, 0, 72, 76, 0, 74, 72, 0, 69, 0, 72, 76, 79, -1, 77, 76, 74, 0, 77, 81, 0, 79, 77, 0, 76, 0, 74, 72, 74, -1, -1, 0,
        69, 0, 72, 76, 0, 74, 72, 0, 81, 0, 79, 77, 76, -1, 74, 72, 71, 0, 72, 74, 76, 0, 74, 71, 69, -1, -1, -1, 0, 0, 0, 0],
      bass: [45, 0, 57, 0, 45, 0, 57, 0, 41, 0, 53, 0, 41, 0, 53, 0, 43, 0, 55, 0, 43, 0, 55, 0, 40, 0, 52, 0, 44, 0, 52, 0] },
    mgB: { bpm: 160, wave: 'sawtooth', vol: 0.03, bassWave: 'square', drums: 'o.xxo.x.o.xxoxxx',
      lead: [64, 0, 0, 64, 0, 0, 67, 0, 66, 0, 0, 66, 0, 0, 62, 0, 64, 0, 0, 64, 0, 0, 69, 0, 67, -1, 66, -1, 64, -1, 0, 0],
      bass: [40, 40, 0, 40, 40, 0, 40, 0, 38, 38, 0, 38, 38, 0, 38, 0] },
    mgC: { bpm: 120, wave: 'triangle', vol: 0.06, bassWave: 'triangle', drums: 'o...o.x.o...o.x.',
      lead: [79, 0, 76, 0, 72, 0, 76, 0, 77, 0, 74, 0, 71, 0, 74, 0, 76, 0, 72, 0, 69, 0, 72, 0, 74, -1, 71, -1, 67, -1, 0, 0],
      bass: [48, 0, 0, 0, 43, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0] },
    card: { bpm: 128, wave: 'triangle', vol: 0.06, bassWave: 'triangle', drums: 'o...x...o...x.x.',
      lead: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 76, 0, 79, 0, 84, 0, 79, 0, 74, -1, 76, -1, 79, -1, 0, 0],
      bass: [48, 0, 0, 0, 53, 0, 0, 0, 52, 0, 0, 0, 55, 0, 0, 0] },
    stage: { bpm: 100, wave: 'triangle', vol: 0.07, bassWave: 'triangle', drums: 'o.......o...x...',
      lead: [72, -1, -1, 76, -1, -1, 79, -1, 84, -1, -1, -1, 81, -1, 79, -1, 77, -1, -1, 81, -1, -1, 79, -1, 76, -1, -1, -1, -1, -1, 0, 0],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 57, 0, 0, 0, 48, 0, 0, 0, 55, 0, 0, 0] },
  };

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapA = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
  const shade = (n, k) => { const r = Math.min(255, ((n >> 16) & 255) * k) | 0, g = Math.min(255, ((n >> 8) & 255) * k) | 0, b = Math.min(255, (n & 255) * k) | 0; return (r << 16) | (g << 8) | b; };

  TV.game('n64.party', {
    three: true, stick: true, buttons: ['a', 'b'],
    help: 'Move / choose: arrows. A (OK, hit the dice, mash, jump): Z. B (back, hold to hurry the computer): X. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 50, near: 0.1, far: 420, fogCol: 0xa8d8ff, fogNear: 70, fogFar: 230 }), T = T3.T, H = K.hud, F = K.font, W = K.W, HH = K.H;
      const LT = T3.lights({ amb: 0.66, sun: 0.62, dir: [0.45, 1, 0.55], skyCol: 0xeef6ff, groundCol: 0x6a7a5a });
      let seed = 199964, clock = 0, frame = 0;
      const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      let AUTO = false, AUTOWAIT = 0.3; // testing: the computer plays for you too
      const ri = n => (rnd() * n) | 0;
      const pick = a => a[ri(a.length)];
      const V3 = (x, y, z) => new T.Vector3(x, y, z);
      const tv = new T.Vector3(), tv2 = new T.Vector3();

      const touchHeld={},touchPending={};let touchPanel=null;
      function clearTouch(){for(const b in touchHeld)delete touchHeld[b];for(const b in touchPending)delete touchPending[b];if(touchPanel)touchPanel.querySelectorAll('.pressed,.up-active,.down-active,.left-active,.right-active').forEach(el=>el.classList.remove('pressed','up-active','down-active','left-active','right-active'));}
      function touchSet(b,on){if(on&&!touchHeld[b])touchPending[b]=true;touchHeld[b]=on;}
      function installTouch(){
        const view=K.cv.closest('.rm-tvv');if(!view||!(navigator.maxTouchPoints||matchMedia('(pointer:coarse)').matches))return;
        if(!document.getElementById('party-control-style')){const css=document.createElement('link');css.id='party-control-style';css.rel='stylesheet';css.href='css/rm-g-party.css'+new URL(document.querySelector('script[src*="rm-g-party.js"]')?.src||location.href).search;document.head.appendChild(css);}
        touchPanel=document.createElement('div');touchPanel.className='party-controls';touchPanel.setAttribute('aria-label','Wobble Party controller');
        const pad=document.createElement('div');pad.className='party-pad';pad.setAttribute('role','application');pad.setAttribute('aria-label','Drag to move or choose');
        for(const [b,glyph]of [['up','↑'],['left','←'],['right','→'],['down','↓']]){const cap=document.createElement('span');cap.className=b;cap.textContent=glyph;pad.appendChild(cap);}
        const move=e=>{e.preventDefault();e.stopPropagation();if(window.House?.paused)return;const r=pad.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1;const dir={left:x<-.28,right:x>.28,up:y<-.28,down:y>.28};for(const b in dir){touchSet(b,dir[b]);pad.classList.toggle(b+'-active',dir[b]);}};
        pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);move(e);});pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))move(e);});
        const release=()=>{for(const b of ['up','down','left','right']){touchSet(b,false);pad.classList.remove(b+'-active');}};
        for(const name of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(name,release);
        const buttons=document.createElement('div');buttons.className='party-buttons';
        for(const [b,label]of [['b','B'],['a','A'],['start','START'],['lock','LOCK IN']]){const button=document.createElement('button');button.type='button';button.dataset.party=b;button.textContent=label;
          button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(window.House?.paused)return;button.setPointerCapture(e.pointerId);if(b==='lock'){RoomTV.lockIn(!RoomTV.lockIn());return;}touchSet(b,true);button.classList.add('pressed');});
          const up=()=>{touchSet(b,false);button.classList.remove('pressed');};for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,up);buttons.appendChild(button);
        }
        touchPanel.append(pad,buttons);view.appendChild(touchPanel);addEventListener('blur',clearTouch);document.addEventListener('visibilitychange',clearTouch);
        requestAnimationFrame(()=>{if(RoomTV.lockIn())RoomTV.lockIn(true);});
      }
      installTouch();
      const keyName=b=>touchPanel?K.label(b):K.keyLabel(b);

      // ---------------------------------------------------------------- geometry helpers (merged, vertex coloured, lit)
      const _e = new T.Euler(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3();
      function M(x, y, z, rx, ry, rz, sx, sy, sz, ord) { _e.set(rx || 0, ry || 0, rz || 0, ord || 'XYZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz); return new T.Matrix4().compose(_p, _q, _s); }
      const S = {
        box: (w, h, d) => new T.BoxGeometry(w, h, d),
        ball: (r, s) => new T.SphereGeometry(r, Math.min(s || 12, 12), Math.max(6, (Math.min(s || 12, 12) * 0.6) | 0)),
        cyl: (a, b, h, s) => new T.CylinderGeometry(a, b, h, s || 14),
        cone: (r, h, s) => new T.ConeGeometry(r, h, s || 10),
        tor: (r, t, a, b) => new T.TorusGeometry(r, t, a || 6, b || 14),
        ico: (r, d) => new T.IcosahedronGeometry(r, d || 0),
        dod: (r) => new T.DodecahedronGeometry(r, 0),
      };
      // a part: [geometry, colour, x, y, z, rx, ry, rz, sx, sy, sz]
      const pt = (geo, c, x, y, z, rx, ry, rz, sx, sy, sz, ord) => ({ geo, c, m: M(x || 0, y || 0, z || 0, rx, ry, rz, sx, sy, sz, ord) });
      function merge(parts, nokeep) {
        let n = 0;
        const gs = parts.map(p => { let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new T.Color();
        let o = 0;
        gs.forEach((g, i) => {
          const cnt = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
          c.set(parts[i].c); const sh = parts[i].sh;
          const P = g.attributes.position.array;
          for (let k = 0; k < cnt; k++) { const f = sh ? 1 - sh * (1 - clamp((P[k * 3 + 1] - sh.y0) / sh.h, 0, 1)) : 1; col[(o + k) * 3] = c.r * f; col[(o + k) * 3 + 1] = c.g * f; col[(o + k) * 3 + 2] = c.b * f; }
          o += cnt; g.dispose();
        });
        parts.forEach(p => { if (!p.keepGeo) p.geo.dispose(); });
        const out = new T.BufferGeometry();
        out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('color', new T.BufferAttribute(col, 3));
        out.computeBoundingSphere();
        return nokeep ? out : T3.keep(out);
      }
      const matV = T3.mat({ vcol: true });
      const matVB = T3.mat({ vcol: true, lit: false });
      const texCache = {};
      const ctex = (key, w, h, paint) => { if (texCache[key]) return texCache[key]; const before = seed; const t = T3.tex(w, h, paint); seed = before; return texCache[key] = t; };
      const matCache = {};
      const cmat = (key, p) => matCache[key] || (matCache[key] = T3.mat(p));
      // a blob shadow (soft round dark patch)
      const shadowTex = T3.tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
      const shadowMat = T3.mat({ map: shadowTex, transparent: true, lit: false }); shadowMat.depthWrite = false;
      const shadowGeo = T3.keep(new T.PlaneGeometry(1, 1)); shadowGeo.rotateX(-Math.PI / 2);
      function blob(size) { const m = new T.Mesh(shadowGeo, shadowMat); m.scale.set(size, 1, size); m.renderOrder = 1; return m; }

      // ---------------------------------------------------------------- the characters (low-poly, lit, vertex coloured)
      const BL = 0x16161e, WH = 0xffffff;
      function charParts(id) {
        const P = [];
        const eye = (x, y, z, r, pr) => { P.push(pt(S.ball(r, 10), WH, x, y, z, 0, 0, 0, 1, 1.15, 0.7)); P.push(pt(S.ball(pr, 8), BL, x * 1.04, y + 0.01, z + r * 0.55, 0, 0, 0, 1, 1.2, 0.6)); P.push(pt(S.ball(pr * 0.35, 6), WH, x * 1.04 + pr * 0.3, y + pr * 0.45, z + r * 0.55 + pr * 0.45)); };
        if (id === 'bolt') {
          const st = 0x7a8ec0, st2 = 0x9aaee0, dk = 0x2a3456, gold = 0xffc83a;
          P.push(pt(S.box(0.8, 0.62, 0.6), st, 0, 0.6, 0));
          P.push(pt(S.box(0.44, 0.28, 0.04), dk, 0, 0.64, 0.31));
          P.push(pt(S.ball(0.06, 8), gold, -0.1, 0.66, 0.34)); P.push(pt(S.ball(0.06, 8), 0xff4a4a, 0.08, 0.66, 0.34)); P.push(pt(S.ball(0.05, 8), 0x5af07a, 0.08, 0.58, 0.34));
          P.push(pt(S.box(0.76, 0.56, 0.62), st2, 0, 1.22, 0));
          P.push(pt(S.box(0.64, 0.24, 0.05), dk, 0, 1.24, 0.31));
          P.push(pt(S.ball(0.075, 8), 0x7af8ff, -0.15, 1.25, 0.34, 0, 0, 0, 1, 1, 0.5)); P.push(pt(S.ball(0.075, 8), 0x7af8ff, 0.15, 1.25, 0.34, 0, 0, 0, 1, 1, 0.5));
          P.push(pt(S.box(0.3, 0.04, 0.04), 0x5a6a9a, 0, 1.07, 0.32));
          P.push(pt(S.cyl(0.03, 0.03, 0.32, 6), 0x5a6a88, 0, 1.64, 0)); P.push(pt(S.ball(0.08, 8), 0xff3a3a, 0, 1.82, 0));
          for (const s of [-1, 1]) {
            P.push(pt(S.cyl(0.13, 0.13, 0.08, 10), gold, s * 0.41, 1.22, 0, 0, 0, Math.PI / 2));
            P.push(pt(S.cyl(0.08, 0.08, 0.46, 8), 0x5a6a90, s * 0.5, 0.62, 0, 0, 0, s * 0.18));
            P.push(pt(S.ball(0.12, 8), gold, s * 0.55, 0.36, 0));P.push(pt(S.cyl(.09,.1,.25,8),dk,s*.2,.24,.04));
          }
          P.push(pt(S.box(0.06, 0.24, 0.06), gold, 0, 0.7, -0.36)); P.push(pt(S.box(0.34, 0.12, 0.05), gold, 0, 0.84, -0.42));
          return { P, foot: [S.box(0.28, 0.16, 0.38), 0x3a4468, 0.2, 0.04] };
        }
        if (id === 'pip') {
          const g = 0x3ec04a, g2 = 0x2a9a36;
          P.push(pt(S.ball(0.56, 16), g, 0, 0.56, 0, 0, 0, 0, 1, 0.84, 0.95));
          P.push(pt(S.ball(0.42, 14), 0xf4f0a8, 0, 0.48, 0.26, 0, 0, 0, 1, 0.82, 0.62));
          for (const s of [-1, 1]) {
            P.push(pt(S.ball(0.21, 12), g, s * 0.23, 0.98, 0.1));
            eye(s * 0.23, 1.02, 0.2, 0.15, 0.075);
            P.push(pt(S.ball(0.075, 8), 0xff8aa8, s * 0.37, 0.74, 0.42, 0, 0, 0, 1, 0.7, 0.5));
            P.push(pt(S.ball(0.13, 10), g, s * 0.52, 0.38, 0.16, 0, 0, 0, 1, 0.8, 1.2));
          }
          P.push(pt(S.tor(0.2, 0.03, 4, 12, Math.PI), 0x8a1a2a, 0, 0.8, 0.46, 0, 0, Math.PI, 1, 0.55, 1));
          P.push(pt(S.cone(0.2, 0.26, 6), 0xe8302a, 0, 0.5, 0.52, Math.PI, 0, 0));
          return { P, foot: [S.box(0.34, 0.1, 0.42), g2, 0.24, 0.06] };
        }
        if (id === 'wisp') {
          const w = 0xf2eeff;
          P.push(pt(S.ball(0.56, 18), w, 0, 1.04, 0));
          P.push(pt(S.cyl(0.56, 0.64, 0.56, 18), w, 0, 0.74, 0));
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P.push(pt(S.ball(0.17, 8), w, Math.sin(a) * 0.52, 0.46, Math.cos(a) * 0.52)); }
          for (const s of [-1, 1]) {
            P.push(pt(S.ball(0.09, 10), 0x1a1a3a, s * 0.18, 1.08, 0.51, 0, 0, 0, 1, 1.45, 0.5));
            P.push(pt(S.ball(0.03, 6), WH, s * 0.18 + 0.03, 1.14, 0.55));
            P.push(pt(S.ball(0.08, 8), 0xffa8d8, s * 0.33, 0.93, 0.45, 0, 0, 0, 1, 0.7, 0.5));
            P.push(pt(S.ball(0.15, 10), w, s * 0.62, 0.8, 0.1, 0, 0, s * 0.4, 0.8, 1.3, 0.8));
          }
          P.push(pt(S.ball(0.07, 8), 0x5a2a5a, 0, 0.9, 0.55, 0, 0, 0, 1.2, 0.8, 0.5));
          P.push(pt(S.cone(0.12, 0.26, 6), 0xb48ae8, 0.12, 1.6, 0, 0, 0, -Math.PI / 2)); P.push(pt(S.cone(0.12, 0.26, 6), 0xb48ae8, 0.38, 1.6, 0, 0, 0, Math.PI / 2)); P.push(pt(S.ball(0.07, 8), 0x9a6ad8, 0.25, 1.6, 0));
          return { P, foot: null };
        }
        if (id === 'sprout') {
          const sv = 0xc8ccdc, sv2 = 0x9aa0b4;
          P.push(pt(S.cyl(0.4, 0.48, 0.62, 14), sv, 0, 0.58, 0));
          P.push(pt(S.box(0.48, 0.5, 0.06), 0xe04a3a, 0, 0.58, 0.42, -0.08, 0, 0));
          P.push(pt(S.ball(0.08, 8), 0x3ec04a, 0, 0.62, 0.46));
          P.push(pt(S.cyl(0.47, 0.47, 0.09, 14), 0x6a4a2a, 0, 0.32, 0)); P.push(pt(S.box(0.12, 0.1, 0.05), 0xffc83a, 0, 0.32, 0.47));
          P.push(pt(S.ball(0.43, 16), sv, 0, 1.2, 0));
          P.push(pt(S.box(0.5, 0.07, 0.08), 0x1a1a24, 0, 1.22, 0.38));
          P.push(pt(S.box(0.07, 0.07, 0.03), WH, -0.12, 1.22, 0.42)); P.push(pt(S.box(0.07, 0.07, 0.03), WH, 0.12, 1.22, 0.42));
          P.push(pt(S.box(0.06, 0.3, 0.06), sv2, 0, 1.08, 0.41));
          for(const side of [-1,1])P.push(pt(S.cyl(.095,.11,.24,8),sv2,side*.2,.22,.04));
          P.push(pt(S.ball(0.13, 8), 0xe8302a, 0, 1.66, -0.05)); P.push(pt(S.ball(0.11, 8), 0xe8302a, 0, 1.72, -0.2)); P.push(pt(S.ball(0.09, 8), 0xff5a3a, 0, 1.66, -0.34));
          P.push(pt(S.cyl(0.32, 0.32, 0.07, 14), 0x2a5ad0, -0.55, 0.62, 0.12, 0, 0, Math.PI / 2)); P.push(pt(S.ball(0.12, 8), 0xffc83a, -0.6, 0.62, 0.12, 0, 0, 0, 0.5, 1, 1));
          P.push(pt(S.box(0.07, 0.62, 0.11), 0xc8945a, 0.55, 0.78, 0.18)); P.push(pt(S.box(0.26, 0.06, 0.1), 0x6a4a2a, 0.55, 0.47, 0.18)); P.push(pt(S.ball(0.1, 8), sv, 0.52, 0.42, 0.1));
          return { P, foot: [S.box(0.26, 0.15, 0.36), sv2, 0.2, 0.04] };
        }
        if (id === 'comet') {
          const o = 0xf0962a;
          P.push(pt(S.ball(0.45, 16), 0xf4f4f8, 0, 0.56, 0, 0, 0, 0, 1, 1.05, 0.95));
          P.push(pt(S.cyl(0.465, 0.465, 0.07, 16), o, 0, 0.64, 0)); P.push(pt(S.box(0.16, 0.12, 0.05), 0x2a8ae0, 0, 0.5, 0.43));
          P.push(pt(S.box(0.5, 0.5, 0.26), 0xb0b8cc, 0, 0.66, -0.38)); P.push(pt(S.cyl(0.06, 0.06, 0.3, 8), 0x8a90a8, -0.16, 0.66, -0.52)); P.push(pt(S.cyl(0.06, 0.06, 0.3, 8), 0x8a90a8, 0.16, 0.66, -0.52));
          P.push(pt(S.ball(0.36, 16), o, 0, 1.18, 0));
          P.push(pt(S.ball(0.17, 10), 0xfff4e8, 0, 1.07, 0.26, 0, 0, 0, 1.35, 0.8, 0.8));
          P.push(pt(S.ball(0.045, 6), 0xff7aa0, 0, 1.13, 0.38));
          for (const s of [-1, 1]) {
            P.push(pt(S.ball(0.075, 8), BL, s * 0.13, 1.25, 0.29, 0, 0, 0, 1, 1.3, 0.6)); P.push(pt(S.ball(0.025, 6), WH, s * 0.13 + 0.02, 1.28, 0.33));
            P.push(pt(S.cone(0.12, 0.22, 4), o, s * 0.2, 1.48, 0, 0, 0, -s * 0.25)); P.push(pt(S.cone(0.06, 0.12, 4), 0xffc8b0, s * 0.2, 1.47, 0.04, 0, 0, -s * 0.25));
            P.push(pt(S.box(0.16, 0.015, 0.015), 0x6a4a3a, s * 0.24, 1.06, 0.32, 0, 0, s * 0.15));
            P.push(pt(S.ball(0.13, 8), 0xf4f4f8, s * 0.48, 0.55, 0.1));
          }
          P.push(pt(S.cyl(0.05, 0.07, 0.45, 6), o, 0, 0.36, -0.48, -1.0, 0, 0));
          return { P, foot: [S.box(0.28, 0.16, 0.36), 0xd0d4e4, 0.18, 0.04], glass: [0.53, 1.2] };
        }
        if(id==='count'){
          const biscuit=0xbf8a50,choc=0x563846,royal=0x684b83;
          P.push(pt(S.cyl(.4,.53,.6,12),royal,0,.42,0));
          P.push(pt(S.ball(.64,12),biscuit,0,1.04,0,0,0,0,1,.86,.62));
          for(const [x,y]of [[-.36,.83],[.36,.83],[-.4,1.2],[.35,1.3],[0,1.43],[-.12,.67]])P.push(pt(S.dod(.075),choc,x,y,.38));
          for(const side of [-1,1]){eye(side*.21,1.15,.32,.12,.056);P.push(pt(S.cyl(.08,.11,.5,8),biscuit,side*.53,.66,.02,0,0,side*.4));P.push(pt(S.ball(.12,8),royal,side*.63,.45,.05));P.push(pt(S.cyl(.075,.075,.18,8),choc,side*.2,.16,.04));}
          P.push(pt(S.tor(.16,.025,5,14),0xffd075,.21,1.16,.42));
          P.push(pt(S.box(.35,.065,.08),choc,-.19,1.34,.36,0,0,-.22));
          P.push(pt(S.ball(.08,8),choc,0,.96,.4,0,0,0,1.6,.45,.5));
          P.push(pt(S.cyl(.42,.4,.13,12),0xffc96a,0,1.56,0));
          for(const x of [-.3,0,.3])P.push(pt(S.cone(.12,.3,4),0xffce70,x,1.76,0));
          P.push(pt(S.cone(.16,.28,4),royal,-.13,.66,.4,0,0,Math.PI/2));P.push(pt(S.cone(.16,.28,4),royal,.13,.66,.4,0,0,-Math.PI/2));
          return{P,foot:[S.box(.25,.14,.38),choc,.2,.05]};
        }
        // chompy
        const p = 0xe05ab8, p2 = 0xb83a94, sp = 0xffa83a;
        P.push(pt(S.ball(0.5, 16), p, 0, 0.6, 0, 0, 0, 0, 1, 1, 1.08));
        P.push(pt(S.ball(0.36, 14), 0xffe4a8, 0, 0.56, 0.28, 0, 0, 0, 1, 1.1, 0.6));
        P.push(pt(S.ball(0.38, 16), p, 0, 1.12, 0.12));
        P.push(pt(S.ball(0.27, 14), 0xf07ac8, 0, 1.04, 0.42, 0, 0, 0, 1.1, 0.8, 1));
        for (const s of [-1, 1]) {
          P.push(pt(S.ball(0.03, 6), BL, s * 0.08, 1.1, 0.68));
          eye(s * 0.16, 1.3, 0.28, 0.1, 0.05);
          P.push(pt(S.box(0.06, 0.07, 0.04), WH, s * 0.09, 0.9, 0.63));
          P.push(pt(S.ball(0.1, 8), p, s * 0.44, 0.76, 0.3, 0, 0, 0, 1, 1, 1.4));
        }
        [[1.48, -0.02, 0.2], [1.26, -0.3, -0.5], [0.96, -0.5, -0.9], [0.66, -0.58, -1.3]].forEach(([y, z, r]) => P.push(pt(S.cone(0.1, 0.24, 4), sp, 0, y, z, r, 0, 0)));
        P.push(pt(S.cone(0.2, 0.62, 8), p, 0, 0.42, -0.7, -1.95, 0, 0));
        return { P, foot: [S.box(0.3, 0.16, 0.42), p2, 0.22, 0.06] };
      }
      function hostParts() {
        const P = [], j = 0x4ae07a;
        P.push(pt(S.cyl(0.52, 0.68, 0.84, 18), j, 0, 0.42, 0)); P.push(pt(S.ball(0.52, 18), j, 0, 0.84, 0, 0, 0, 0, 1, 0.55, 1));
        P.push(pt(S.cyl(0.69, 0.69, 0.06, 18), 0x2aa858, 0, 0.04, 0));
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; P.push(pt(S.ball(0.08, 8), 0xd8ffe0, Math.sin(a) * 0.55, 0.55 + (i % 2) * 0.12, Math.cos(a) * 0.55)); }
        for (const s of [-1, 1]) {
          P.push(pt(S.ball(0.12, 10), WH, s * 0.2, 0.86, 0.46, 0, 0, 0, 1, 1.2, 0.6)); P.push(pt(S.ball(0.06, 8), BL, s * 0.2, 0.86, 0.53, 0, 0, 0, 1, 1.2, 0.5));
          P.push(pt(S.cone(0.12, 0.2, 4), 0xe8302a, s * 0.13, 0.48, 0.66, 0, 0, s * Math.PI / 2));
          P.push(pt(S.ball(0.14, 8), j, s * 0.72, 0.5, 0.05, 0, 0, 0, 1, 0.8, 1));
        }
        P.push(pt(S.ball(0.06, 8), 0xff4a3a, 0, 0.48, 0.66));
        P.push(pt(S.tor(0.14, 0.025, 4, 12, Math.PI), 0x1a5a2a, 0, 0.72, 0.5, 0, 0, Math.PI, 1, 0.6, 1));
        P.push(pt(S.cyl(0.3, 0.3, 0.44, 14), 0x1a1a24, 0, 1.33, 0)); P.push(pt(S.cyl(0.46, 0.46, 0.05, 14), 0x1a1a24, 0, 1.12, 0)); P.push(pt(S.cyl(0.305, 0.305, 0.08, 14), 0xe8302a, 0, 1.16, 0));
        return { P, foot: null };
      }
      const geoCache = {};
      function charGeo(id) {
        if (geoCache[id]) return geoCache[id];
        const d = id === 'host' ? hostParts() : charParts(id);
        const out = { body: merge(d.P), foot: null, fx: 0, fz: 0, glass: d.glass };
        if (d.foot) { out.foot = T3.keep(d.foot[0]); out.footCol = d.foot[1]; out.fx = d.foot[2]; out.fz = d.foot[3]; }
        return (geoCache[id] = out);
      }
      const glassMat = T3.mat({ color: 0xcff0ff, transparent: true, opacity: 0.32, emissive: 0x204060 }); glassMat.depthWrite = false;
      const jellyMat = T3.mat({ vcol: true, emissive: 0x0a3a1a });
      const footMats = {};
      // a model: root (moves) > body (squashes); feet on the root; a blob shadow in the scene
      function model(id, parent) {
        const G = charGeo(id), root = new T.Group(), body = new T.Group(); root.add(body);
        body.add(new T.Mesh(G.body, id === 'host' ? jellyMat : matV));
        if (G.glass) { if(!G.glassGeo){G.glassGeo=T3.keep(new T.SphereGeometry(G.glass[0],16,12));G.glassGeo.userData.shared=true;}const gl=new T.Mesh(G.glassGeo,glassMat); gl.position.y = G.glass[1]; gl.renderOrder = 2; body.add(gl); }
        const feet = [];
        if (G.foot) { const fm = footMats[G.footCol] || (footMats[G.footCol] = T3.mat({ color: G.footCol })); for (const s of [-1, 1]) { const f = new T.Mesh(G.foot, fm); f.position.set(s * G.fx, 0.07, G.fz); root.add(f); feet.push(f); } }
        const sh = blob(1.25);
        (parent || T3.scene).add(root); (parent || T3.scene).add(sh);
        const ci = CHARS.findIndex(c => c.id === id);
        return { root, body, feet, sh, id, ci, fx: G.fx, fz: G.fz, float: ci >= 0 && !!CHARS[ci].float };
      }
      // an actor: a model with a place, a facing, a walk cycle and a squash spring
      function actor(id, parent) { return { m: model(id, parent), x: 0, y: 0, z: 0, gy: 0, ry: 0, vx: 0, vy: 0, vz: 0, walk: 0, mv: 0, sq: 0, sqv: 0, spin: 0, lean: 0, sad: 0, vis: true, sc: 1 }; }
      function pose(a, dt) {
        const m = a.m;
        // the squash spring
        a.sqv += (-a.sq * 260 - a.sqv * 16) * dt; a.sq += a.sqv * dt;
        const s = a.sq, k = a.sc;
        m.root.visible = a.vis; m.sh.visible = a.vis;
        const fl = m.float ? 0.16 + Math.sin(clock * 3 + m.ci) * 0.07 : 0;
        const bob = m.float ? 0 : Math.abs(Math.sin(a.walk)) * 0.07 * a.mv;
        m.root.position.set(a.x, a.y + fl + bob, a.z);
        m.root.rotation.set(0, a.ry + a.spin, 0);
        m.root.scale.set(k, k, k);
        m.body.scale.set(1 + s * 0.35, Math.max(0.3, 1 - s * 0.45 - a.sad * 0.12), 1 + s * 0.35);
        m.body.rotation.x = a.lean + a.sad * 0.35;
        for (let i = 0; i < m.feet.length; i++) {
          const f = m.feet[i], ph = a.walk + i * Math.PI;
          f.position.z = m.fz + Math.sin(ph) * 0.17 * a.mv; f.position.y = 0.07 + Math.max(0, Math.cos(ph)) * 0.1 * a.mv - bob;
        }
        const h = Math.max(0, a.y - a.gy);
        m.sh.position.set(a.x, a.gy + 0.03, a.z);
        const ss = clamp(1.25 - h * 0.12, 0.4, 1.25) * k; m.sh.scale.set(ss, 1, ss);
      }
      const squash = (a, v) => { a.sqv += v; };

      // ---------------------------------------------------------------- portraits (drawn by the 3D renderer, kept as 2D pictures)
      const PORT = {};
      (function portraits() {
        const ps = new T.Scene(), pc = new T.PerspectiveCamera(30, W / HH, 0.1, 20);
        ps.add(new T.HemisphereLight(0xffffff, 0x8888aa, 0.8)); const dl = new T.DirectionalLight(0xffffff, 0.75); dl.position.set(0.6, 1, 1); ps.add(dl);
        const ids = CHARS.map(c => c.id).concat(['host','count']);
        for (const id of ids) {
          const ci = CHARS.findIndex(c => c.id === id), col = ci >= 0 ? CHARS[ci].col : id==='count'?0xbf8a50:0x4ae07a, fy = ci >= 0 ? CHARS[ci].face : id==='count'?1.2:0.8;
          ps.background = new T.Color(shade(col, 0.55));
          const md = model(id, ps); md.sh.visible = false; md.root.rotation.y = -0.32;
          pc.position.set(0.5, fy + 0.1, 2.4); pc.lookAt(0, fy - 0.08, 0);
          T3.ren.render(ps, pc);
          const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d');
          g.save(); g.beginPath(); g.arc(24, 24, 23, 0, 7); g.clip();
          try { g.drawImage(K.cv, (W - HH) / 2, 0, HH, HH, 0, 0, 48, 48); } catch (e) { g.fillStyle = hex(col); g.fillRect(0, 0, 48, 48); }
          const gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 48, 24);
          g.restore();
          g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.beginPath(); g.arc(24, 24, 22.5, 0, 7); g.stroke();
          g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(24, 24, 23.6, 0, 7); g.stroke();
          PORT[id] = c;
          ps.remove(md.root); ps.remove(md.sh);
        }
      })();
      const portOf = p => PORT[CHARS[p.ci].id];

      // ---------------------------------------------------------------- particles and flying coins (pooled, no garbage)
      const pGeo = T3.keep(new T.BoxGeometry(0.16, 0.16, 0.16));
      const pMats = {};
      const pMat = c => pMats[c] || (pMats[c] = T3.mat({ color: c, lit: false }));
      const PARTS = [];
      const particleBatch=new T.InstancedMesh(pGeo,T3.mat({lit:false}),180);particleBatch.instanceMatrix.setUsage(T.DynamicDrawUsage);particleBatch.frustumCulled=false;T3.add(particleBatch);
      for (let i = 0; i < 180; i++) { const m = new T.Object3D();m.material=pMat(0xffffff);m.visible=false;PARTS.push({m,life:0}); }
      function syncParts(){let n=0;for(const p of PARTS)if(p.life>0&&p.m.visible){p.m.updateMatrix();particleBatch.setMatrixAt(n,p.m.matrix);particleBatch.setColorAt(n,p.m.material.color);n++;}particleBatch.count=n;particleBatch.visible=n>0;particleBatch.instanceMatrix.needsUpdate=true;if(particleBatch.instanceColor)particleBatch.instanceColor.needsUpdate=true;}
      let pNext = 0;
      function puff(x, y, z, col, n, o) {
        o = o || {};
        for (let i = 0; i < n; i++) {
          const p = PARTS[pNext]; pNext = (pNext + 1) % PARTS.length;
          const a = rnd() * Math.PI * 2, sp = (o.sp || 4) * (0.4 + rnd() * 0.8), up = (o.up == null ? 4 : o.up) * (0.5 + rnd());
          p.x = x + (o.r ? (rnd() - 0.5) * o.r : 0); p.y = y; p.z = z + (o.r ? (rnd() - 0.5) * o.r : 0);
          p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = up; p.g = o.g == null ? 12 : o.g; p.life = p.max = (o.life || 0.9) * (0.6 + rnd() * 0.6);
          p.s = (o.s || 1) * (0.6 + rnd() * 0.8); p.spin = (rnd() - 0.5) * 12; p.drag = o.drag || 0;
          const c = Array.isArray(col) ? pick(col) : col; p.m.material = pMat(c); p.m.visible = true;
        }
      }
      function partsTick(dt) {
        for (const p of PARTS) {
          if (p.life <= 0) continue;
          p.life -= dt; if (p.life <= 0) { p.m.visible = false; continue; }
          p.vy -= p.g * dt; if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vz *= d; p.vy *= p.g < 0 ? 1 : d; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          const s = p.s * Math.min(1, p.life / p.max * 2.5);
          p.m.position.set(p.x, p.y, p.z); p.m.scale.set(s, s, s); p.m.rotation.set(p.life * p.spin, p.life * p.spin * 0.7, 0);
        }
      }
      function partsClear() { for (const p of PARTS) { p.life = 0; p.m.visible = false; } }
      const coinTex = T3.tex(32, 32, (g) => { g.fillStyle = '#ffc81a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(16, 16, 12, 0, 7); g.fill(); g.fillStyle = '#e09a10'; g.fillRect(13, 7, 6, 18); g.fillStyle = '#fff4b0'; g.fillRect(14, 8, 2, 15); });
      const coinMat = T3.mat({ map: coinTex, emissive: 0x6a4a00 });
      const coinSideMat = T3.mat({ color: 0xe8a818, emissive: 0x4a3000 });
      const coinGeo = T3.keep(new T.CylinderGeometry(0.34, 0.34, 0.09, 16)); coinGeo.rotateX(Math.PI / 2);
      const mkCoin = (parent) => { const m = new T.Mesh(coinGeo, [coinSideMat, coinMat, coinMat]); (parent || T3.scene).add(m); return m; };
      const FLY = [];
      for (let i = 0; i < 24; i++) { const m = mkCoin(); m.visible = false; FLY.push({ m, life: 0 }); }
      // coins that pop out of (or into) someone on the board
      function coinBurst(x, y, z, n, into) {
        let k = 0;
        for (const c of FLY) {
          if (c.life > 0) continue; if (k >= n) break;
          const a = k / Math.max(1, n) * Math.PI * 2 + rnd();
          c.into = into; c.life = c.max = into ? 0.7 : 1.1; c.t = -k * 0.06;
          c.x = x + (into ? Math.cos(a) * 1.6 : 0); c.y = y + (into ? 2.6 : 1.3); c.z = z + (into ? Math.sin(a) * 1.6 : 0);
          c.tx = x; c.ty = y + 1; c.tz = z;
          c.vx = into ? 0 : Math.cos(a) * 2.2; c.vz = into ? 0 : Math.sin(a) * 2.2; c.vy = into ? 0 : 5.5;
          c.m.visible = false; k++;
        }
      }
      function flyTick(dt) {
        for (const c of FLY) {
          if (c.life <= 0) continue;
          c.t += dt; if (c.t < 0) continue;
          c.life -= dt; c.m.visible = c.life > 0;
          if (c.into) { const f = 1 - c.life / c.max; c.m.position.set(lerp(c.x, c.tx, f * f), lerp(c.y, c.ty, f) + Math.sin(f * Math.PI) * 0.8, lerp(c.z, c.tz, f * f)); }
          else { c.vy -= 14 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.m.position.set(c.x, c.y, c.z); }
          c.m.rotation.y += dt * 12;
        }
      }

      // ================================================================ Wobble Island (the board)
      const BG = T3.group();
      const SP = [];
      // the main loop: 28 spaces round the island, anticlockwise from the start on the east side
      (function layout() {
        const f = t => [25 * Math.cos(t) + 2.2 * Math.cos(3 * t), -(17 * Math.sin(t) + 1.4 * Math.sin(2 * t))];
        const D = [], cum = [0], N = 1600;
        for (let i = 0; i <= N; i++) D.push(f(i / N * Math.PI * 2));
        for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(D[i][0] - D[i - 1][0], D[i][1] - D[i - 1][1]));
        const L = cum[N];
        const MT = ['start', 'blue', 'blue', 'event', 'blue', 'red', 'blue', 'blue', 'chance', 'blue', 'red', 'blue', 'shop', 'blue', 'event', 'blue', 'red', 'blue', 'chance', 'blue', 'blue', 'blue', 'red', 'event', 'blue', 'blue', 'red', 'blue'];
        let j = 0;
        for (let i = 0; i < 28; i++) { const d = i / 28 * L; while (cum[j + 1] < d) j++; const k = (d - cum[j]) / (cum[j + 1] - cum[j]); SP.push({ id: i, x: lerp(D[j][0], D[j + 1][0], k), z: lerp(D[j][1], D[j + 1][1], k), type: MT[i], next: [(i + 1) % 28], path: 'main' }); }
        // the shortcut over the middle (north junction 7 to the south, rejoining at 21): risky
        const CT = ['event', 'blue', 'red', 'chance', 'red', 'blue', 'red'], a = SP[7], b = SP[21];
        for (let k = 1; k <= 7; k++) { const u = k / 8; SP.push({ id: SP.length, x: lerp(a.x, b.x, u) + 3 * Math.sin(u * Math.PI * 2), z: lerp(a.z, b.z, u), type: CT[k - 1], next: [SP.length + 1], path: 'mid' }); }
        SP[34].next = [21]; SP[7].next = [8, 28];
        // the pier (junction 24, out over the sea and back at 27): long, but lots of blue
        const PT = ['blue', 'blue', 'event', 'blue', 'blue'], c = SP[24], e = SP[27];
        const mx = (c.x + e.x) / 2, mz = (c.z + e.z) / 2, ol = Math.hypot(mx, mz), ox = mx / ol, oz = mz / ol;
        for (let k = 1; k <= 5; k++) { const u = k / 6, bul = Math.sin(u * Math.PI) * 9.5; SP.push({ id: SP.length, x: lerp(c.x, e.x, u) + ox * bul, z: lerp(c.z, e.z, u) + oz * bul, type: PT[k - 1], next: [SP.length + 1], path: 'pier' }); }
        SP[39].next = [27]; SP[24].next = [25, 35];
      })();
      const STAR_SPOTS = [2, 9, 15, 19, 25, 29, 38];
      const SPY = 0.52; // the top of a space (where everybody stands)
      // the distance from a point to the nearest bit of path
      const SEGS = []; for (const s of SP) for (const n of s.next) SEGS.push([s.x, s.z, SP[n].x, SP[n].z]);
      function pathDist(x, z) {
        let best = 1e9;
        for (const [ax, az, bx, bz] of SEGS) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < best) best = d; }
        return best;
      }
      const JX = -13, JZ = -1, PX = 13, PZ = -5.5, WMX = 12.5, WMZ = 8;
      const isl = (x, z) => Math.sqrt((x / 33) * (x / 33) + (z / 24.5) * (z / 24.5));
      const HILLS = [[-21, -13, 4.5, 2.2], [-23, 12, 4, 1.8], [7, -16.5, 3.5, 1.4], [19, 11, 3.5, 1.2], [-4, 15, 3, 1], [4, -4, 2.6, 0.7], [-17, 17, 3, 1.3]];
      function gh(x, z, pd) {
        const e = isl(x, z);
        let h = e < 0.86 ? 0.25 : e < 1 ? lerp(0.25, -0.2, (e - 0.86) / 0.14) : lerp(-0.2, -2.6, clamp((e - 1) / 0.16, 0, 1));
        if (e < 0.9) { let hh = 0; for (const [hx, hz, r, ht] of HILLS) { const d = Math.hypot(x - hx, z - hz); if (d < r * 1.6) hh += ht * Math.exp(-(d * d) / (r * r * 0.5)); } h += hh * clamp((pd - 2.2) / 3, 0, 1) * clamp((0.9 - e) / 0.08, 0, 1); }
        h += Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.06;
        return h;
      }
      let boardTerrain=null,grassColors=null;
      (function buildIsland() {
        // ground: grass, a sandy beach, the path worn into the grass
        const gw = 128, gd = 100, nx = 72, nz = 56;
        const g = new T.PlaneGeometry(gw, gd, nx, nz); g.rotateX(-Math.PI / 2);
        const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), c2 = new T.Color();
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i), pd = pathDist(x, z), h = gh(x, z, pd), e = isl(x, z); pos.setY(i, h);
          const n = Math.sin(x * 1.3 + z * 0.4) * Math.cos(z * 1.1 - x * 0.3);
          c.set(n > 0.2 ? 0x62c44c : n < -0.3 ? 0x4aa83e : 0x56b844);
          if (h > 0.9) c.lerp(c2.set(0x7ad05a), clamp((h - 0.9) / 1.2, 0, 1));
          if (pd < 1.6 && e < 0.95) c.lerp(c2.set(0xd8c48a), clamp((1.6 - pd) / 0.8, 0, 1) * 0.85);
          if (e > 0.8) c.lerp(c2.set(0xf2dea2), clamp((e - 0.8) / 0.06, 0, 1));
          if (h < -0.3) c.lerp(c2.set(0xc8b080), clamp((-0.3 - h) / 1, 0, 1));
          col.set([c.r, c.g, c.b], i * 3);
        }
        g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals(); T3.keep(g);boardTerrain=g;grassColors=col.slice();
        BG.add(new T.Mesh(g, matV));
        // the sea, a foam line round the island, the sky
        const wt = T3.tile(T3.tex(64, 64, (x) => { x.fillStyle = '#2a8ad8'; x.fillRect(0, 0, 64, 64); for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.22})`; x.fillRect(rnd() * 64, rnd() * 64, 3 + rnd() * 8, 1); } for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(10,60,140,.25)'; x.fillRect(rnd() * 64, rnd() * 64, 6, 2); } }), 70, 70);
        const sea = T3.plane(700, 700, T3.mat({ map: wt, transparent: true, opacity: 0.88 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.05; BG.add(sea); BG.userData.water = wt;
        const fg = T3.keep(new T.RingGeometry(0.985, 1.03, 64, 1)); fg.rotateX(-Math.PI / 2);
        const foam = new T.Mesh(fg, T3.mat({ color: 0xffffff, lit: false, transparent: true, opacity: 0.55 })); foam.scale.set(33, 1, 24.5); foam.position.y = -0.01; BG.add(foam); BG.userData.foam = foam;
      })();
      const skyTex = T3.tex(8, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#1e5ad0'); gr.addColorStop(0.32, '#4a9af0'); gr.addColorStop(0.5, '#a8d8ff'); gr.addColorStop(0.56, '#d8f0ff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); });
      let CLOUDS = null;
      const SKY = T3.ball(330, 18, T3.mat({ map: skyTex, lit: false, side: T.BackSide, fog: false })); T3.add(SKY);
      (function clouds() {
        const P = [];
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2 + rnd() * 0.3, r = 190 + rnd() * 60, y = 40 + rnd() * 40, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
          for (let k = 0; k < 4; k++) P.push(pt(S.ball(8 + rnd() * 7, 8), k < 2 ? 0xffffff : 0xf4f8ff, cx + (k - 2.5) * 7 * Math.cos(a + 1.57), y + rnd() * 5 - (k % 2) * 3, cz + (k - 2.5) * 7 * Math.sin(a + 1.57), 0, 0, 0, 1, 0.55, 1));
        }
        const m = new T.Mesh(merge(P), T3.mat({ vcol: true, lit: false, fog: false })); T3.add(m); CLOUDS = m;
        // far-off islands in the haze
        const Q = [];
        for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.4, r = 140 + rnd() * 40; Q.push(pt(S.cone(14 + rnd() * 14, 10 + rnd() * 16, 8), i % 2 ? 0x4a9a5a : 0x5aa864, Math.cos(a) * r, 2, Math.sin(a) * r)); }
        BG.add(new T.Mesh(merge(Q), matV));
      })();

      // ---- the scenery: trees, flowers, rocks, Jelly Mountain, the windmill, the pond, houses, the lighthouse, the pier
      const ANIM = { blades: null, jelly: null, ducks: null };
      (function scenery() {
        const P = [];
        const tree = (x, z, s, kind) => {
          const y = gh(x, z, pathDist(x, z));
          if (kind === 0) { P.push(pt(S.cyl(0.18 * s, 0.26 * s, 1.4 * s, 6), 0x8a5a32, x, y + 0.7 * s, z)); P.push(pt(S.ico(1.0 * s, 1), 0x3a9a3a, x, y + 1.9 * s, z)); P.push(pt(S.ico(0.7 * s, 1), 0x4ab04a, x + 0.4 * s, y + 2.5 * s, z + 0.2 * s)); }
          else if (kind === 1) { P.push(pt(S.cyl(0.15 * s, 0.22 * s, 1 * s, 6), 0x7a4a2a, x, y + 0.5 * s, z)); P.push(pt(S.cone(1.1 * s, 1.8 * s, 8), 0x2a8a4a, x, y + 1.7 * s, z)); P.push(pt(S.cone(0.8 * s, 1.4 * s, 8), 0x34a058, x, y + 2.6 * s, z)); }
          else { P.push(pt(S.cyl(0.12 * s, 0.2 * s, 3 * s, 6), 0xa8804a, x, y + 1.5 * s, z, 0, 0, 0.12)); for (let f = 0; f < 7; f++) { const a = f / 7 * 6.28; P.push(pt(S.cone(0.3 * s, 1.9 * s, 4), f % 2 ? 0x3ab048 : 0x2a9a3a, x + 0.18 * s + Math.sin(a) * 0.85 * s, y + 2.8 * s, z + Math.cos(a) * 0.85 * s, Math.PI / 2 + 0.5, a, 0, 1, 1, 0.35, 'YXZ')); } P.push(pt(S.ball(0.36 * s, 8), 0x2a9a3a, x + 0.18 * s, y + 3.05 * s, z)); P.push(pt(S.ball(0.16 * s, 6), 0x6a4a2a, x + 0.2 * s, y + 2.9 * s, z + 0.1 * s)); }
        };
        const free = (x, z, r) => Math.hypot(x - JX, z - JZ) > 8 + r && Math.hypot(x - PX, z - PZ) > 4.4 + r && Math.hypot(x - WMX, z - WMZ) > 3 + r && HOUSES.every(h => Math.hypot(x - h[0], z - h[1]) > 3 + r);
        const HOUSES = [[5.5, 10.5, 0.3, 0xe8402a], [-8.5, 10.5, -0.5, 0x3a6ad8], [9.5, 1.5, 1.2, 0xe8a02a]];
        let n = 0;
        for (let k = 0; k < 1400 && n < 80; k++) {
          const x = (rnd() - 0.5) * 66, z = (rnd() - 0.5) * 49, e = isl(x, z), pd = pathDist(x, z);
          if (e > 0.88 || pd < 2.6 || !free(x, z, 1) || pathDist(x, z - 3) < 2.2 || pathDist(x, z - 5.5) < 2.2) continue;
          tree(x, z, 0.75 + rnd() * 0.45, e > 0.78 ? 2 : rnd() < 0.55 ? 0 : 1); n++;
        }
        for (let k = 0; k < 900 && n < 150; k++) { // flowers by the path
          const x = (rnd() - 0.5) * 62, z = (rnd() - 0.5) * 46, pd = pathDist(x, z);
          if (isl(x, z) > 0.84 || pd < 1.7 || pd > 3.2 || !free(x, z, 0)) continue;
          const y = gh(x, z, pd), c = pick([0xff5a8a, 0xffe04a, 0xffffff, 0xff8a3a, 0xb07aff]);
          P.push(pt(S.cyl(0.02, 0.02, 0.3, 3), 0x3a8a2a, x, y + 0.15, z)); P.push(pt(S.ball(0.12, 6), c, x, y + 0.32, z)); n++;
        }
        for (let k = 0; k < 26; k++) { const a = rnd() * 6.28, x = Math.cos(a) * 33 * (0.97 + rnd() * 0.1), z = Math.sin(a) * 24.5 * (0.97 + rnd() * 0.1); if (pathDist(x, z) < 2.5) continue; P.push(pt(S.dod(0.5 + rnd() * 0.8), pick([0x9a948a, 0x8a8478, 0xaaa294]), x, -0.1, z, rnd(), rnd(), 0, 1, 0.7, 1)); }
        // houses
        for (const [x, z, r, rc] of HOUSES) {
          const y = gh(x, z, pathDist(x, z)), cs = Math.cos(r), sn = Math.sin(r), at = (dx, dz) => [x + dx * cs + dz * sn, z - dx * sn + dz * cs];
          P.push(pt(S.box(2.6, 1.8, 2.2), 0xf4ead0, x, y + 0.9, z, 0, r, 0));
          P.push(pt(S.cone(2.2, 1.5, 4), rc, x, y + 2.55, z, 0, r + Math.PI / 4, 0, 1, 1, 0.85));
          let [dx, dz] = at(0, 1.11); P.push(pt(S.box(0.55, 0.95, 0.06), 0x8a4a2a, dx, y + 0.48, dz, 0, r, 0));
          for (const s of [-0.85, 0.85]) { [dx, dz] = at(s, 1.11); P.push(pt(S.box(0.5, 0.45, 0.06), 0x8ad0ff, dx, y + 1.15, dz, 0, r, 0)); P.push(pt(S.box(0.6, 0.06, 0.08), 0xffffff, dx, y + 0.9, dz, 0, r, 0)); }
          [dx, dz] = at(0.7, -0.4); P.push(pt(S.box(0.35, 0.9, 0.35), 0xa04a3a, dx, y + 2.7, dz, 0, r, 0));
        }
        // the windmill
        { const y = gh(WMX, WMZ, pathDist(WMX, WMZ)); P.push(pt(S.cyl(1.3, 1.9, 4.6, 12), 0xf0e4c8, WMX, y + 2.3, WMZ)); P.push(pt(S.cone(1.7, 1.8, 12), 0xd8402a, WMX, y + 5.5, WMZ)); P.push(pt(S.box(0.7, 1.2, 0.1), 0x7a4a2a, WMX, y + 0.6, WMZ + 1.82)); P.push(pt(S.box(0.45, 0.45, 0.1), 0x8ad0ff, WMX, y + 3, WMZ + 1.5)); }
        // the pond (with lily pads)
        { const y = 0.27; P.push(pt(S.cyl(3.6, 3.7, 0.12, 24), 0xc8b080, PX, y - 0.05, PZ)); for (let k = 0; k < 5; k++) { const a = k * 1.3, r = 1 + (k % 3) * 0.7; P.push(pt(S.cyl(0.38, 0.38, 0.04, 8), 0x3aa83a, PX + Math.cos(a) * r, y + 0.1, PZ + Math.sin(a) * r)); } P.push(pt(S.ball(0.15, 6), 0xff7ab0, PX + 1, y + 0.18, PZ)); }
        // the stream from Jelly Mountain down to the pond, under a little bridge on the shortcut
        { const a = SP[31], b = SP[32], bx = (a.x + b.x) / 2, bz = (a.z + b.z) / 2, pts = [[JX + 6.5, JZ + 2.2], [bx * 0.5 + (JX + 6.5) * 0.5, bz + 0.4], [bx, bz], [bx * 0.5 + (PX - 3.4) * 0.5, (bz + PZ) / 2 - 0.3], [PX - 3.3, PZ - 0.3]];
          for (let k = 0; k < pts.length - 1; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], len = Math.hypot(x1 - x0, z1 - z0); P.push(pt(S.box(1.5, 0.06, len + 0.6), 0x3a9ae8, (x0 + x1) / 2, 0.27, (z0 + z1) / 2, 0, Math.atan2(x1 - x0, z1 - z0), 0)); }
          const ang = Math.atan2(b.x - a.x, b.z - a.z);
          for (let k = -2; k <= 2; k++) P.push(pt(S.box(1.9, 0.12, 0.34), k % 2 ? 0xb08050 : 0xc0905a, bx + Math.sin(ang) * k * 0.4, 0.42, bz + Math.cos(ang) * k * 0.4, 0, ang, 0));
          for (const s of [-1, 1]) { const ox = Math.cos(ang) * s * 1, oz = -Math.sin(ang) * s * 1; P.push(pt(S.box(0.1, 0.1, 2.1), 0x7a5030, bx + ox, 0.75, bz + oz, 0, ang, 0)); for (const k of [-1, 1]) P.push(pt(S.box(0.1, 0.45, 0.1), 0x7a5030, bx + ox + Math.sin(ang) * k * 0.9, 0.55, bz + oz + Math.cos(ang) * k * 0.9)); }
        }
        // the lighthouse on its rock
        { const x = 31.5, z = -16; P.push(pt(S.dod(3.2), 0x8a847a, x, -1, z, 0, 0, 0, 1, 0.6, 1)); for (let k = 0; k < 5; k++) P.push(pt(S.cyl(1.05 - k * 0.08, 1.12 - k * 0.08, 1.2, 12), k % 2 ? 0xffffff : 0xe8302a, x, 1.1 + k * 1.2, z)); P.push(pt(S.cyl(0.8, 0.8, 0.9, 10), 0xfff4a0, x, 7.1, z)); P.push(pt(S.cone(0.95, 0.9, 10), 0xe8302a, x, 8, z)); }
        // the pier: planks between the pier spaces, posts into the sea
        { const chain = [24, 35, 36, 37, 38, 39, 27];
          for (let k = 0; k < chain.length - 1; k++) { const a = SP[chain[k]], b = SP[chain[k + 1]], len = Math.hypot(b.x - a.x, b.z - a.z), ang = Math.atan2(b.x - a.x, b.z - a.z), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
            if (isl(mx, mz) < 0.9 && k !== 0 && k !== chain.length - 2) continue;
            for (let q = 0; q < len / 0.5; q++) { const u = (q + 0.5) * 0.5 / len, x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u); if (isl(x, z) < 0.92) continue; P.push(pt(S.box(2.2, 0.12, 0.44), q % 2 ? 0xb08050 : 0xa07040, x, 0.3, z, 0, ang, 0)); }
            for (const s of [-1, 1]) { const x = mx + Math.cos(ang) * s * 1.1, z = mz - Math.sin(ang) * s * 1.1; if (isl(x, z) > 0.95) P.push(pt(S.cyl(0.14, 0.14, 1.8, 6), 0x6a4a2a, x, -0.4, z)); }
          }
          for (const id of [35, 36, 37, 38, 39]) { const s = SP[id]; P.push(pt(S.cyl(1.3, 1.3, 0.14, 14), 0xa07040, s.x, 0.28, s.z)); }
        }
        // the start arch
        { const s = SP[0], n = SP[1], ang = Math.atan2(n.x - s.x, n.z - s.z), ox = Math.cos(ang) * 1.7, oz = -Math.sin(ang) * 1.7;
          for (const k of [-1, 1]) { P.push(pt(S.cyl(0.14, 0.16, 3.2, 8), 0xffffff, s.x + ox * k, 1.6, s.z + oz * k)); P.push(pt(S.ball(0.22, 8), 0xffd23a, s.x + ox * k, 3.25, s.z + oz * k)); } }
        BG.add(new T.Mesh(merge(P), matV));
        // the start banner
        { const s = SP[0], n = SP[1], ang = Math.atan2(n.x - s.x, n.z - s.z);
          const bt = T3.tex(128, 32, (g) => { const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, '#ff4a3a'); gr.addColorStop(1, '#c81a1a'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 128, 3); g.fillRect(0, 29, 128, 3); g.font = '900 20px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7a0a0a'; g.fillText('START', 65, 18); g.fillStyle = '#fff'; g.fillText('START', 64, 17); });
          const btm = T3.mat({ map: bt }), bts = T3.mat({ color: 0xc81a1a }); const bm = new T.Mesh(T3.keep(new T.BoxGeometry(3.6, 0.9, 0.08)), [bts, bts, bts, bts, btm, btm]); bm.position.set(s.x, 2.9, s.z); bm.rotation.y = ang; BG.add(bm); }
        // Jelly Mountain: a giant wobbly pudding (it wobbles)
        { const Q = [], r1 = 0xe8304a, r2 = 0xff5a6a;
          Q.push(pt(S.cyl(6.2, 6.9, 1.6, 28), r1, 0, 0.8, 0)); Q.push(pt(S.cyl(4.9, 5.9, 1.7, 28), r2, 0, 2.4, 0)); Q.push(pt(S.cyl(3.6, 4.6, 1.7, 28), r1, 0, 4.1, 0)); Q.push(pt(S.ball(3.6, 24), r2, 0, 4.9, 0, 0, 0, 0, 1, 0.45, 1));
          for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; Q.push(pt(S.ball(0.8, 10), 0xfff8f0, Math.cos(a) * 2.6, 6.2, Math.sin(a) * 2.6, 0, 0, 0, 1, 0.7, 1)); }
          Q.push(pt(S.ball(1.4, 16), 0xfff8f0, 0, 6.6, 0, 0, 0, 0, 1, 0.75, 1)); Q.push(pt(S.ball(0.85, 14), 0xd8102a, 0, 7.8, 0)); Q.push(pt(S.cyl(0.06, 0.08, 1.2, 5), 0x3a8a2a, 0.3, 8.8, 0, 0, 0, -0.4));
          const jm = new T.Mesh(merge(Q), T3.mat({ vcol: true, emissive: 0x3a0008 })); jm.position.set(JX, 0.2, JZ); BG.add(jm); ANIM.jelly = jm; }
        // windmill blades
        { const g = new T.Group(); g.position.set(WMX, gh(WMX, WMZ, pathDist(WMX, WMZ)) + 4.2, WMZ + 1.75); const Q = []; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; Q.push(pt(S.box(0.55, 3.4, 0.06), 0xf8f0e0, Math.sin(a) * 1.8, Math.cos(a) * 1.8, 0, 0, 0, -a)); Q.push(pt(S.box(0.08, 3.6, 0.1), 0x8a5a32, Math.sin(a) * 1.8, Math.cos(a) * 1.8, 0.05, 0, 0, -a)); } Q.push(pt(S.cyl(0.25, 0.25, 0.3, 8), 0x6a4a2a, 0, 0, 0, Math.PI / 2, 0, 0));
          g.add(new T.Mesh(merge(Q), matV)); BG.add(g); ANIM.blades = g; }
        // pond water and two ducks
        { const pw = T3.cyl(3.45, 3.45, 0.05, 28, T3.mat({ color: 0x4aa8f0, emissive: 0x0a2a5a })); pw.position.set(PX, 0.3, PZ); BG.add(pw);
          const dg = new T.Group(); dg.position.set(PX, 0.32, PZ); BG.add(dg);
          for (let k = 0; k < 2; k++) { const d = new T.Group(); d.position.set(k ? -1.6 : 1.8, 0, 0); const Q = [pt(S.ball(0.22, 8), 0xffe04a, 0, 0.14, 0, 0, 0, 0, 1, 0.8, 1.3), pt(S.ball(0.14, 8), 0xffe04a, 0, 0.36, 0.2), pt(S.cone(0.06, 0.14, 4), 0xff8a2a, 0, 0.34, 0.37, Math.PI / 2, 0, 0), pt(S.ball(0.03, 4), BL, 0.07, 0.4, 0.28), pt(S.ball(0.03, 4), BL, -0.07, 0.4, 0.28)]; d.add(new T.Mesh(merge(Q), matV)); dg.add(d); }
          ANIM.ducks = dg; }
      })();

      // ---- the shop booth (by space 12) and the party stage (out to sea in the north: the title, picking, and the prizes)
      (function shopBooth() {
        const s = SP[12], l = Math.hypot(s.x, s.z), ox = s.x / l, oz = s.z / l, x = s.x + ox * 2.9, z = s.z + oz * 2.9, ang = Math.atan2(-ox, -oz);
        const Q = [pt(S.box(2.6, 1, 1.2), 0xc8945a, 0, 0.5, 0), pt(S.box(2.8, 0.1, 1.4), 0x8a5a32, 0, 1.05, 0)];
        for (const k of [-1.25, 1.25]) Q.push(pt(S.cyl(0.08, 0.08, 2.4, 6), 0xffffff, k, 1.2, 0.55));
        for (let k = 0; k < 6; k++) Q.push(pt(S.box(0.48, 0.08, 1.7), k % 2 ? 0xffffff : 0xff6a2a, -1.2 + k * 0.48, 2.45, 0.1, -0.3, 0, 0));
        Q.push(pt(S.box(0.4, 0.4, 0.4), 0xe8c070, 1.6, 0.2, -0.2)); Q.push(pt(S.box(0.35, 0.35, 0.35), 0xd8b060, 1.5, 0.58, -0.2, 0, 0.4)); Q.push(pt(S.ball(0.2, 8), 0x8a4ad8, -0.6, 1.25, 0)); Q.push(pt(S.box(0.3, 0.3, 0.3), 0xffd23a, 0.4, 1.25, 0));
        const g = new T.Mesh(merge(Q), matV); g.position.set(x, 0.25, z); g.rotation.y = ang; BG.add(g);
        const st = T3.tex(64, 24, (c) => { c.fillStyle = '#ffd23a'; c.fillRect(0, 0, 64, 24); c.fillStyle = '#c81a1a'; c.fillRect(0, 0, 64, 2); c.fillRect(0, 22, 64, 2); c.font = '900 15px Arial Black,Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c81a1a'; c.fillText('SHOP', 32, 13); });
        const stm = T3.mat({ map: st }), sts = T3.mat({ color: 0xc81a1a }); const sg = new T.Mesh(T3.keep(new T.BoxGeometry(1.6, 0.6, 0.06)), [sts, sts, sts, sts, stm, stm]); sg.position.set(x - ox * 0.75, 2.95, z - oz * 0.75); sg.rotation.y = ang; BG.add(sg);
      })();
      const STAGE = { x: 0, z: -38 };
      (function stage() {
        const Q = [], x = STAGE.x, z = STAGE.z;
        Q.push(pt(S.cyl(8, 8.3, 1, 32), 0xb07a48, x, 0.5, z)); Q.push(pt(S.cyl(8.35, 8.35, 0.25, 32), 0xe8302a, x, 1.05, z));
        for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; Q.push(pt(S.cyl(0.25, 0.25, 3, 6), 0x6a4a2a, x + Math.cos(a) * 7.6, -1, z + Math.sin(a) * 7.6)); }
        for (let k = 0; k < 7; k++) { const a = Math.PI + 0.25 + k / 6 * (Math.PI - 0.5); Q.push(pt(S.cyl(0.12, 0.12, 4.2, 6), 0xffffff, x + Math.cos(a) * 7.2, 3.2, z - Math.sin(a) * 7.2)); Q.push(pt(S.ball(0.32, 8), k % 2 ? 0xffd23a : 0xff5a8a, x + Math.cos(a) * 7.2, 5.4, z - Math.sin(a) * 7.2)); }
        // the arch of bulbs behind
        for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI; Q.push(pt(S.ball(0.2, 6), k % 2 ? 0xfff4a0 : 0xff8ad0, x + Math.cos(a) * 7.2, 1.2 + Math.sin(a) * 5.8, z + 6.4)); }
        Q.push(pt(S.tor(7.2, 0.18, 6, 32), 0xe8302a, x, 1.2, z + 6.4, 0, 0, 0, 1, 0.8, 1));
        const m = new T.Mesh(merge(Q), matV); BG.add(m);
        const fl = T3.tex(64, 64, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#c88a52' : '#b87a46'; g.fillRect(i * 8, j * 8, 8, 8); } g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, 64, 2); });
        const top = T3.cyl(7.95, 7.95, 0.05, 32, T3.mat({ map: T3.tile(fl, 4, 4) })); top.position.set(x, 1.19, z); BG.add(top);
        const sg = T3.tex(256, 64, (g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#2a3ad8'); gr.addColorStop(1, '#5a1ab0'); g.fillStyle = gr; g.fillRect(0, 0, 256, 64); g.strokeStyle = '#ffd23a'; g.lineWidth = 4; g.strokeRect(3, 3, 250, 58); g.font = 'italic 900 34px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1a0a40'; g.fillText('PARTY STAGE', 130, 36); g.fillStyle = '#ffd23a'; g.fillText('PARTY STAGE', 128, 33); });
        const sgm = T3.mat({ map: sg, emissive: 0x222244 }), sgs = T3.mat({ color: 0x2a1a6a }); const sm = new T.Mesh(T3.keep(new T.BoxGeometry(7.5, 1.9, 0.12)), [sgs, sgs, sgs, sgs, sgm, sgm]); sm.position.set(x, 7.6, z + 6.5); BG.add(sm);
      })();

      // ---- the spaces themselves (a disc each, a picture on top)
      const SPC = {
        blue: { c: '#2a6ae8', d: 0x1a3a9a }, red: { c: '#e8302a', d: 0x8a1a1a }, event: { c: '#2ab04a', d: 0x1a6a2a }, chance: { c: '#9a3ae0', d: 0x5a1a8a },
        villain: { c: '#803e94', d: 0x3b164f }, shop: { c: '#ff8a1a', d: 0x9a4a0a }, start: { c: '#2a6ae8', d: 0x1a3a9a }, star: { c: '#ffc81a', d: 0x9a6a0a },
      };
      function starPath(g, cx, cy, r1, r2) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }
      const spaceMats = {};
      for (const k in SPC) {
        const s = SPC[k];
        const t = T3.tex(64, 64, (g) => {
          const gr = g.createRadialGradient(26, 24, 4, 32, 32, 34); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, s.c); gr.addColorStop(1, hex(s.d)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
          g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.stroke();
          g.translate(32, 32); g.rotate(-Math.PI / 2); g.translate(-32, -32);
          g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2;
          if (k === 'blue' || k === 'start') { g.fillRect(28, 18, 8, 28); g.fillRect(18, 28, 28, 8); }
          else if (k === 'red') g.fillRect(18, 28, 28, 8);
          else if (k === 'event' || k === 'chance') { g.font = '900 36px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText(k === 'event' ? '!' : '?', 32, 34); g.fillText(k === 'event' ? '!' : '?', 32, 34); }
          else if (k === 'villain') { g.font='900 38px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('C',32,34); }
          else if (k === 'shop') { g.fillRect(20, 26, 24, 20); g.fillStyle = s.c; g.fillRect(24, 30, 16, 3); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(32, 26, 7, Math.PI, 0); g.stroke(); }
          else if (k === 'star') { starPath(g, 32, 33, 20, 9); g.fillStyle = '#fff8c0'; g.fill(); g.strokeStyle = '#c87a0a'; g.stroke(); }
        });
        spaceMats[k] = [T3.mat({ color: s.d }), T3.mat({ map: t, emissive: k === 'star' ? 0x4a3000 : 0x101010 }), T3.mat({ color: s.d })];
      }
      const spGeo=T3.keep(new T.CylinderGeometry(1.05,1.12,.32,16,1,true));
      const capGeo=T3.keep(new T.CircleGeometry(1.05,20));capGeo.rotateX(-Math.PI/2);capGeo.translate(0,.16,0);
      const spaceBatches={};
      for(const key of Object.keys(SPC)){
        const side=new T.InstancedMesh(spGeo,spaceMats[key][0],40),top=new T.InstancedMesh(capGeo,spaceMats[key][1],40);
        side.instanceMatrix.setUsage(T.DynamicDrawUsage);top.instanceMatrix.setUsage(T.DynamicDrawUsage);
        side.frustumCulled=top.frustumCulled=false;BG.add(side,top);spaceBatches[key]={side,top,count:0};
      }
      for(const s of SP){s.mesh=new T.Object3D();s.mesh.material=spaceMats[s.type];s.mesh.position.set(s.x,.36,s.z);s.flash=0;}
      function syncSpaces(){
        for(const b of Object.values(spaceBatches))b.count=0;
        for(const s of SP){const key=s.mesh.material===spaceMats.star?'star':s.type,b=spaceBatches[key];s.mesh.updateMatrix();b.side.setMatrixAt(b.count,s.mesh.matrix);b.top.setMatrixAt(b.count,s.mesh.matrix);b.count++;}
        for(const b of Object.values(spaceBatches)){b.side.count=b.top.count=b.count;b.side.visible=b.top.visible=b.count>0;b.side.instanceMatrix.needsUpdate=b.top.instanceMatrix.needsUpdate=true;}
      }
      const BASE_TYPES = SP.map(p => p.type), BASE_NEXT = SP.map(p => p.next.slice());
      const THEMES = BOARDS.map(() => new T.Group()); THEMES.forEach(g => BG.add(g));
      const CLOCK_HANDS = new T.Group(); THEMES[1].add(CLOCK_HANDS);
      (function boardScenery() {
        const q = [];
        for (const side of [-1, 1]) {
          q.push(pt(S.cyl(2, 2.5, 8, 12), 0x8b79ad, side * 8, 4, -6));
          q.push(pt(S.cone(2.7, 3.4, 12), 0x534080, side * 8, 9.7, -6));
          q.push(pt(S.box(1.1, 1.5, .18), 0xffd573, side * 8, 6, -3.99));
        }
        q.push(pt(S.box(13, 5, 3), 0x71628f, 0, 2.5, -6));
        q.push(pt(S.box(3, 3.8, .25), 0x302748, 0, 1.9, -4.35));
        for (let x=-6;x<=6;x+=2)q.push(pt(S.box(1, .8, 3.4), 0xb8a7cc,x,5.4,-6));
        THEMES[2].add(new T.Mesh(merge(q),matV));const count=actor('count',THEMES[2]);Object.assign(count,{x:0,y:0,gy:0,z:-2.3,ry:0,sc:2.1});pose(count,0);
        const c=[];c.push(pt(S.cyl(3.7,4.2,.6,24),0x6a3b58,0,.3,-5));
        for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.push(pt(S.ball(.25,8),0xffd23a,Math.sin(a)*3, .72, -5+Math.cos(a)*3));}
        for(let i=0;i<8;i++){const x=-9+i*2.6;c.push(pt(S.cyl(.18,.25,3.8,8),0xe7ad55,x,1.9,-11));c.push(pt(S.cone(1.4,1.8,8),i%2?0xe25472:0x5b91db,x,4.7,-11));}
        THEMES[1].add(new T.Mesh(merge(c),matV));
        CLOCK_HANDS.add(new T.Mesh(merge([pt(S.box(.3,.2,2.5),0xffffff,0,.88,1),pt(S.box(1.9,.24,.25),0xffcf55,.7,.9,0)],true),matV));CLOCK_HANDS.position.z=-5;
      })();
      function applyBoard(id) {
        id = clamp(id || 0, 0, 2); THEMES.forEach((g,i)=>g.visible=i===id);
        SP.forEach((s,i)=>{s.type=BASE_TYPES[i];s.next=BASE_NEXT[i].slice();});
        if(id===1&&(!G||G.turn%2===0)){SP[28].next=[7];for(let i=29;i<=34;i++)SP[i].next=[i-1];SP[7].next=[8];SP[21].next=[22,34];}if(id===1)SP[18].type='villain';
        if(id===2){for(const i of [5,16,26,32])SP[i].type='villain';SP[8].type='shop';SP[12].type='chance';}
        SP.forEach(s=>s.mesh.material=spaceMats[s.type]);if(G&&G.starAt>=0)SP[G.starAt].mesh.material=spaceMats.star;
        THEMES[1].position.set(-11,.25,12);THEMES[2].position.set(-12,.25,-5);
        ANIM.jelly.visible=id===0;SKY.material.color.set(id===2?0xc4b6ed:0xffffff);
        const colors=boardTerrain.attributes.color;
        for(let i=0;i<colors.count;i++){const r=grassColors[i*3],g=grassColors[i*3+1],b=grassColors[i*3+2];if(g>r*1.1&&g>b*1.1){if(id===1)colors.setXYZ(i,r*.9+.17,g*.8+.05,b*.7);else if(id===2)colors.setXYZ(i,r*.8+.18,g*.55+.12,b*.7+.24);else colors.setXYZ(i,r,g,b);}else colors.setXYZ(i,r,g,b);}colors.needsUpdate=true;

      }
      // little stepping stones between spaces
      (function stones() {
        const Q = [];
        for (const s of SP) Q.push(pt(S.cyl(1.2, 1.24, 0.14, 20), 0xf4ead0, s.x, 0.28, s.z));
        for (const s of SP) for (const n of s.next) { const b = SP[n], d = Math.hypot(b.x - s.x, b.z - s.z), k = Math.max(1, Math.round(d / 1.3) - 1); for (let i = 1; i <= k; i++) { const u = i / (k + 1); if (Math.hypot(lerp(s.x, b.x, u) - s.x, lerp(s.z, b.z, u) - s.z) < 1.4 || Math.hypot(lerp(s.x, b.x, u) - b.x, lerp(s.z, b.z, u) - b.z) < 1.4) continue; Q.push(pt(S.cyl(0.3, 0.34, 0.12, 8), 0xe8dcb8, lerp(s.x, b.x, u), 0.3, lerp(s.z, b.z, u))); } }
        BG.add(new T.Mesh(merge(Q), matV));
      })();
      // the star (a big spinning gold star over its space) and the junction arrows
      const starShape = (r1, r2) => { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return sh; };
      const starGeo = T3.keep(new T.ExtrudeGeometry(starShape(0.9, 0.4), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 1 })); starGeo.center();
      const starMat = T3.mat({ color: 0xffd23a, emissive: 0x7a5000 });
      const STAR = new T.Mesh(starGeo, starMat); BG.add(STAR);
      const starEye = new T.Mesh(T3.keep(new T.SphereGeometry(0.09, 8, 6)), T3.mat({ color: BL })); for (const s of [-1, 1]) { const e = starEye.clone(); e.position.set(s * 0.2, 0.12, 0.27); e.scale.set(1, 1.5, 0.5); STAR.add(e); }
      const starRing = new T.Mesh(T3.keep(new T.TorusGeometry(1.3, 0.06, 4, 24)), T3.mat({ color: 0xfff4a0, lit: false, transparent: true, opacity: 0.7 })); starRing.rotation.x = Math.PI / 2; BG.add(starRing);
      const arrowShape = new T.Shape(); arrowShape.moveTo(0, 0.9); arrowShape.lineTo(0.7, 0.1); arrowShape.lineTo(0.3, 0.1); arrowShape.lineTo(0.3, -0.7); arrowShape.lineTo(-0.3, -0.7); arrowShape.lineTo(-0.3, 0.1); arrowShape.lineTo(-0.7, 0.1); arrowShape.closePath();
      const arrowGeo = T3.keep(new T.ExtrudeGeometry(arrowShape, { depth: 0.18, bevelEnabled: false })); arrowGeo.rotateX(-Math.PI / 2);
      const arrowMats = [T3.mat({ color: 0xffffff, emissive: 0x333333 }), T3.mat({ color: 0xffd23a, emissive: 0x7a5000 })];
      const ARROWS = [0, 1].map(() => { const m = new T.Mesh(arrowGeo, arrowMats[0]); m.visible = false; BG.add(m); return m; });
      // the dice blocks (a number on every face)
      const diceMats = [];
      for (let n = 0; n <= 10; n++) {
        const t = T3.tex(64, 64, (g) => { const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, '#fff07a'); gr.addColorStop(1, '#ff9a1a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(4, 4, 56, 56); g.strokeStyle = '#c86a0a'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
          g.font = '900 ' + (n === 10 ? 30 : 38) + 'px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#8a3a00'; g.fillText(n ? String(n) : '?', 34, 36); g.fillStyle = '#fff'; g.fillText(n ? String(n) : '?', 32, 34); });
        diceMats.push(T3.mat({ map: t, emissive: 0x3a2a00 }));
      }
      const diceGeo = T3.keep(new T.BoxGeometry(1.1, 1.1, 1.1));
      const DICE = [0, 1, 2, 3].map(() => { const m = new T.Mesh(diceGeo, diceMats[0]); m.visible = false; T3.add(m); return { m, n: 0, on: false, t: 0, pop: 0 }; });
      const spaceAt = id => SP[id];

      // ================================================================ state, saves
      let SAVE = K.load() || {};
      if (!Array.isArray(SAVE.hall)) SAVE.hall = HALL0().map(([n, s, c]) => ({ n, s, c }));
      SAVE.seen=SAVE.seen||{};SAVE.records=SAVE.records||{};SAVE.expedition=SAVE.expedition||{node:0,lives:4,cleared:[],complete:false};SAVE.unlocks=SAVE.unlocks||{};if(SAVE.expedition.complete)SAVE.unlocks.marble=true;
      if (!(SAVE.name >= 0)) SAVE.name = 0; if (!(SAVE.turns >= 0)) SAVE.turns = 1; if (!(SAVE.diff >= 0)) SAVE.diff = 1;
      const store = () => { if (rebuilding) return; try { K.save(SAVE); } catch (e) {} };
      let rebuilding = false, pendingAnchor = false, journal = null, saveClock = 0;
      let G = null, P = [];
      const me = () => P[0];
      const starCost = () => G && G.board === 2 ? Math.max(10,[10,20,30][(G.turn-1)%3]-(G.priceDiscount||0)*10) : STAR_COST;
      function snapshot(phase) {
        if (!G) return;
        G.phase = phase || G.phase;
        SAVE.game = { expedition:JSON.parse(JSON.stringify(SAVE.expedition)), entrySeed: seed, G: JSON.parse(JSON.stringify(G)), P: P.map(p => ({ name: p.name, ci: p.ci, cpu: p.cpu, mate: p.mate, coins: p.coins, stars: p.stars, at: p.at, items: p.items.slice(), st: Object.assign({}, p.st) })) };
        if (!rebuilding) { pendingAnchor = true; journal = null; }
      }

      // ================================================================ the HUD kit
      const UI = { box: '#1a2a7a', box2: '#3a1a8a', edge: '#ffffff', gold: '#ffd23a', dim: '#a8b8e8' };
      function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
      function panel(x, y, w, h, o) {
        o = o || {};
        const g = H;
        g.save();
        rr(g, x + 2, y + 3, w, h, 6); g.fillStyle = 'rgba(0,0,20,.45)'; g.fill();
        rr(g, x, y, w, h, 6);
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, o.c1 || '#3a5ae0'); gr.addColorStop(1, o.c2 || '#1a1a7a'); g.fillStyle = gr; g.globalAlpha = o.a == null ? 0.94 : o.a; g.fill(); g.globalAlpha = 1;
        g.lineWidth = 2; g.strokeStyle = o.edge || '#fff'; g.stroke();
        rr(g, x + 3, y + 3, w - 6, Math.min(10, h / 3), 4); g.fillStyle = 'rgba(255,255,255,.13)'; g.fill();
        g.restore();
      }
      const txt = (s, x, y, c, k) => F.draw(H, s, x, y, c || '#fff', k || 1, '#0a0a30');
      const ctr = (s, x, y, c, k) => F.center(H, s, x, y, c || '#fff', k || 1, '#0a0a30');
      // a big chunky title with a 3D drop (stacked shadows)
      function bigText(s, cx, y, k, c, deep, cdeep) {
        for (let d = deep || 3; d >= 1; d--) F.center(H, s, cx + d * 0.6, y + d, cdeep || '#3a0a5a', k);
        F.center(H, s, cx, y, c, k);
      }
      // the console's buttons, drawn like the pad (A blue, B green)
      function btn(b, x, y, label) {
        const col = b === 'a' ? '#2a5ad0' : b === 'b' ? '#1a9a3a' : b === 'start' ? '#c41a1a' : '#666';
        const g = H; g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(x + 1, y + 1.5, 7.5, 0, 7); g.fill();
        const gr = g.createRadialGradient(x - 2.5, y - 2.5, 0.5, x, y, 7.5); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, col); gr.addColorStop(1, shadeCss(col)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 7.5, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke();
        const l = label || K.label(b); F.center(g, l.length > 1 ? l[0] : l, x, y - 3, '#fff', 1);
      }
      function shadeCss(c) { return hex(shade(parseInt(c.slice(1), 16), 0.55)); }
      function stickIcon(x, y) { const g = H; g.fillStyle = '#555'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#aaa'; g.beginPath(); g.arc(x, y - 1, 4, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.beginPath(); g.arc(x - 1, y - 2, 2, 0, 7); g.fill(); }
      function dpadIcon(x, y) { const g = H; g.fillStyle = '#222'; g.fillRect(x - 7, y - 2.5, 14, 5); g.fillRect(x - 2.5, y - 7, 5, 14); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(x - 7, y - 2.5, 14, 5); g.strokeRect(x - 2.5, y - 7, 5, 14); g.fillStyle = '#222'; g.fillRect(x - 2, y - 2, 4, 4); }
      const ICON = {};
      ICON.coin = (() => { const c = document.createElement('canvas'); c.width = c.height = 12; const g = c.getContext('2d'); g.fillStyle = '#8a5a00'; g.beginPath(); g.ellipse(6.5, 6.5, 4.6, 5.4, 0, 0, 7); g.fill(); g.fillStyle = '#ffc81a'; g.beginPath(); g.ellipse(6, 6, 4.5, 5.3, 0, 0, 7); g.fill(); g.fillStyle = '#fff2a0'; g.fillRect(5, 2.5, 1.5, 7); g.fillStyle = '#e09a10'; g.fillRect(6.6, 3, 1.2, 6.5); return c; })();
      ICON.star = (() => { const c = document.createElement('canvas'); c.width = c.height = 14; const g = c.getContext('2d'); starPath(g, 7.6, 8.2, 6.4, 2.8); g.fillStyle = '#8a5a00'; g.fill(); starPath(g, 7, 7.5, 6.4, 2.8); const gr = g.createLinearGradient(0, 0, 0, 14); gr.addColorStop(0, '#fff6a0'); gr.addColorStop(1, '#ffb01a'); g.fillStyle = gr; g.fill(); g.fillStyle = '#3a2a00'; g.fillRect(5.2, 6, 1, 2); g.fillRect(8, 6, 1, 2); return c; })();
      // the four players' panels across the top (in turn order)
      function fitText(s, x, y, width, color) { H.save(); H.translate(x, y); H.scale(Math.min(1, width / Math.max(1, F.width(s))), 1); txt(s, 0, 0, color); H.restore(); }
      function rankOf(p) { let r = 0; for (const q of P) if (q.stars > p.stars || (q.stars === p.stars && q.coins > p.coins)) r++; return r; }
      function panels(cur, extra) {
        const order = G ? G.order : [0, 1, 2, 3];
        order.forEach((pi, k) => {
          const p = P[pi], x = 3 + k * 79, y = 3, on = cur === pi, bob = on ? Math.abs(Math.sin(clock * 5)) * -1.5 : 0;
          panel(x, y + bob, 75, 31, { c1: on ? hex(shade(CHARS[p.ci].col, 1.1)) : hex(shade(CHARS[p.ci].col, 0.75)), c2: hex(shade(CHARS[p.ci].col, on ? 0.45 : 0.32)), edge: on ? '#ffd23a' : '#fff' });
          H.drawImage(portOf(p), x + 2, y + 2 + bob, 27, 27);
          fitText(p.name, x + 30, y + 5 + bob, 42, '#fff');
          H.drawImage(ICON.star, x + 30, y + 15 + bob); fitText(String(p.stars), x + 44, y + 19 + bob, 12, '#ffe680');
          H.drawImage(ICON.coin, x + 53, y + 16 + bob); fitText(String(p.coins), x + 64, y + 19 + bob, 9, '#fff');
          const r = rankOf(p), bc = ['#ffc81a', '#c8ccdc', '#d88a4a', '#6a6a8a'][r];
          H.fillStyle = 'rgba(0,0,0,.5)'; H.beginPath(); H.arc(x + 6.5, y + 26.5 + bob, 6, 0, 7); H.fill(); H.fillStyle = bc; H.beginPath(); H.arc(x + 6, y + 26 + bob, 5.6, 0, 7); H.fill(); H.strokeStyle = '#fff'; H.lineWidth = 1; H.stroke();
          F.center(H, String(r + 1), x + 6.5, y + 22.5 + bob, r === 3 ? '#fff' : '#2a1a00', 1);
          if (p.items && p.items.length) for (let q = 0; q < p.items.length; q++) { H.fillStyle = '#ffd23a'; H.fillRect(x + 66 + q * 3, y + 4 + bob, 2, 5); }
          if (extra) extra(p, x, y + bob);
        });
      }
      // word wrap for the 5x7 font
      function wrap(s, n) { const out = []; for (const para of String(s).split('\n')) { let line = ''; for (const w of para.split(' ')) { if ((line + ' ' + w).trim().length > n) { if (line) out.push(line); line = w; } else line = (line + ' ' + w).trim(); } out.push(line); } return out; }
      // where a point in the world is on the screen
      function scr(x, y, z) { tv.set(x, y, z).project(T3.cam); return { x: (tv.x + 1) / 2 * W, y: (1 - tv.y) / 2 * HH, ok: tv.z < 1 }; }

      // ---- talk (a box at the bottom with a face), speech bubbles, banners, floating numbers
      let DLG = null; // { who (portrait), name, lines, n (chars shown), done, wait }
      const BUB = [], FT = [];
      let BAN = null, FLASH = 0, SHAKE = 0;
      function bubble(p, s, t) { for (let i = BUB.length - 1; i >= 0; i--) if (BUB[i].p === p) BUB.splice(i, 1); BUB.push({ p, s, t: t || 2 }); }
      function floatTxt(x, y, z, s, col) { FT.push({ x, y, z, s, col: col || '#fff', t: 1.4 }); }
      function banner(s, sub, col, dur) { BAN = { s, sub: sub || '', col: col || '#ffd23a', t: 0, dur: dur || 1.6 }; }
      function quip(p, kind) { if (!p || !p.cpu || p.mate < 0) return; const m = MATES[p.mate]; if (m && m[kind]) bubble(p, m[kind], 2.2); }
      function drawDlg() {
        if (!DLG) return;
        const x = 8, y = HH - 58, w = W - 16, h = 52;
        panel(x, y, w, h, { c1: '#2a4ad8', c2: '#160a5a' });
        const port = DLG.who ? (PORT[DLG.who] || DLG.who) : null;
        let tx = x + 8;
        if (port) { H.drawImage(port, x + 5, y + 5, 42, 42); tx = x + 52; }
        if (DLG.name) { panel(tx - 4, y - 9, F.width(DLG.name) + 10, 13, { c1: '#ffd23a', c2: '#e88a0a', edge: '#fff' }); F.draw(H, DLG.name, tx + 1, y - 6, '#3a1a00', 1); }
        let left = DLG.n | 0;
        DLG.lines.forEach((l, i) => { if (left <= 0) return; const s = l.slice(0, left); left -= l.length; txt(s, tx, y + 9 + i * 11, '#fff'); });
        if (DLG.done && DLG.wait && (clock * 3 | 0) % 2) { H.fillStyle = '#ffd23a'; H.beginPath(); H.moveTo(x + w - 14, y + h - 12); H.lineTo(x + w - 6, y + h - 12); H.lineTo(x + w - 10, y + h - 7); H.fill(); }
      }
      let RESBOX = false;
      function drawBubbles() {
        const used = [];
        for (const b of BUB) {
          const a = b.p.a; if (!a || !a.vis) continue;
          const q = scr(a.x, a.y + 2.4, a.z); if (!q.ok || q.x < -10 || q.x > W + 10 || q.y < 0 || q.y > HH + 20) continue;
          const lines = wrap(b.s, 16), w = Math.max(...lines.map(l => F.width(l))) + 10, h = lines.length * 9 + 6;
          const x = clamp(q.x - w / 2, 2, W - w - 2); let y = clamp(q.y - h - 8, RESBOX ? 74 : 38, HH - h - 2);
          for (let k = 0; k < 4; k++) { const hit = used.find(u => x < u[0] + u[2] + 2 && u[0] < x + w + 2 && y < u[1] + u[3] + 2 && u[1] < y + h + 2); if (!hit) break; y = hit[1] + hit[3] + 4; }
          used.push([x, y, w, h]);
          H.fillStyle = 'rgba(0,0,0,.35)'; rr(H, x + 2, y + 2, w, h, 4); H.fill();
          H.fillStyle = '#fff'; rr(H, x, y, w, h, 4); H.fill(); H.strokeStyle = '#222'; H.lineWidth = 1; H.stroke();
          H.beginPath(); H.moveTo(clamp(q.x, x + 6, x + w - 6) - 4, y + h - 0.5); H.lineTo(clamp(q.x, x + 6, x + w - 6), y + h + 6); H.lineTo(clamp(q.x, x + 6, x + w - 6) + 4, y + h - 0.5); H.fillStyle = '#fff'; H.fill();
          lines.forEach((l, i) => F.center(H, l, x + w / 2, y + 4 + i * 9, '#1a1a3a', 1));
        }
        for (const f of FT) { const q = scr(f.x, f.y + (1.4 - f.t) * 1.2, f.z); if (!q.ok) continue; H.globalAlpha = clamp(f.t * 2, 0, 1); for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 2], [2, 2]]) F.center(H, f.s, q.x + ox, q.y + oy, '#1a0a30', 2); F.center(H, f.s, q.x, q.y, f.col, 2); H.globalAlpha = 1; }
      }
      function drawBanner() {
        if (!BAN) return;
        const t = BAN.t, inn = ease(t / 0.25), out = ease((t - BAN.dur + 0.25) / 0.25), x = W / 2 + (1 - inn) * -W + out * W, y = 46, h = BAN.sub ? 46 : 34;
        H.save(); H.globalAlpha = 0.88; const gr = H.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, BAN.col); gr.addColorStop(1, '#1a0a4a'); H.fillStyle = gr; H.fillRect(x - W / 2, y, W, h); H.restore();
        H.fillStyle = '#fff'; H.fillRect(x - W / 2, y, W, 2); H.fillRect(x - W / 2, y + h - 2, W, 2);
        bigText(BAN.s, x, y + 7, 3, '#fff', 3, '#1a0a3a');
        if (BAN.sub) ctr(BAN.sub, x, y + 33, '#ffe680');
      }

      // ================================================================ the script runner (generators: yield seconds, or a function polled until it returns a value)
      let SCR = null, WAIT = null, RET;
      let hurry = false; // the computer's turn: hold B to speed it up
      const spd = () => (hurry && K.held('b') ? 3.2 : 1);
      function run(gen) { SCR = gen; WAIT = null; RET = undefined; adv(); }
      function adv() {
        for (let guard = 0; guard < 400 && SCR; guard++) {
          let r;
          r = SCR.next(RET); RET = undefined;
          if (r.done) { SCR = null; return; }
          const w = r.value;
          if (typeof w === 'number') { let t = w; WAIT = dt => ((t -= dt * spd()) <= 0 ? true : undefined); return; }
          if (typeof w === 'function') { WAIT = w; return; }
        }
      }
      function scriptTick(dt) {
        if (!SCR || !WAIT) return;
        const v = WAIT(dt);
        if (v !== undefined) { WAIT = null; RET = v; adv(); }
      }
      // talk: types out, then waits for A (or carries on by itself when nobody needs to read it)
      function* say(s, who, name, o) {
        o = o || {};
        const lines = wrap(s, who ? 40 : 48), total = lines.join('').length;
        DLG = { who, name, lines, n: 0, done: false, wait: !o.auto };
        let t = 0;
        yield dt => {
          DLG.n = Math.min(total, DLG.n + dt * 70 * spd()); if (DLG.n >= total) DLG.done = true;
          t += dt * spd();
          if (K.pressed('a') || K.pressed('b') && !o.auto) { if (!DLG.done) { DLG.n = total; DLG.done = true; return undefined; } if (t > 0.15) return true; }
          const au = o.auto || (AUTO ? AUTOWAIT : 0);
          if (au && DLG.done && t > (au === true ? 0.9 + total * 0.025 : au)) return true;
          return undefined;
        };
        if (!o.keep) DLG = null;
      }
      const host = (s, o) => say(s, 'host', 'MC WOBBLE', o);
      // a little menu box: returns the chosen index (B returns -1 when it may)
      let MENU = null;
      function* choose(items, o) {
        o = o || {};
        MENU = { items, sel: o.sel || 0, x: o.x, y: o.y, title: o.title, w: o.w, desc: o.desc };
        let at = 0;
        const r = yield (dt) => {
          const n = items.length;
          if (AUTO) { at += dt; return at > 0.3 ? (o.auto || 0) : undefined; }
          if (K.pressed('up')) { MENU.sel = (MENU.sel + n - 1) % n; K.sfx.tone(880, 0.04, 'square', 0.05); }
          if (K.pressed('down')) { MENU.sel = (MENU.sel + 1) % n; K.sfx.tone(880, 0.04, 'square', 0.05); }
          if (K.pressed('a')) { K.sfx.tone(1320, 0.07, 'square', 0.07); return MENU.sel; }
          if (o.back && K.pressed('b')) { K.sfx.tone(440, 0.06, 'square', 0.06); return -1; }
          return undefined;
        };
        MENU = null;
        return r;
      }
      function drawMenu() {
        if (!MENU) return;
        const its = MENU.items, w = MENU.w || Math.max(90, ...its.map(s => F.width(s) + 26)), h = its.length * 13 + 10 + (MENU.title ? 12 : 0);
        const x = MENU.x != null ? MENU.x : W - w - 10, y = MENU.y != null ? MENU.y : HH - 66 - h;
        panel(x, y, w, h, { c1: '#4a3ae8', c2: '#1a0a6a' });
        let yy = y + 6;
        if (MENU.title) { txt(MENU.title, x + 8, yy, '#ffd23a'); yy += 12; }
        its.forEach((s, i) => { const on = i === MENU.sel; if (on) { H.fillStyle = 'rgba(255,255,255,.18)'; H.fillRect(x + 4, yy - 2, w - 8, 12); H.fillStyle = '#ffd23a'; H.beginPath(); H.moveTo(x + 7, yy); H.lineTo(x + 12, yy + 3.5); H.lineTo(x + 7, yy + 7); H.fill(); } txt(s, x + 16, yy, on ? '#fff' : '#b8c0f0'); yy += 13; });
        if (MENU.desc && MENU.desc[MENU.sel]) { const l = wrap(MENU.desc[MENU.sel], 46), dy = DLG ? HH - 96 : HH - 30; panel(8, dy, W - 16, 24, { c1: '#2a6a4a', c2: '#0a2a1a' }); l.slice(0, 2).forEach((s, i) => txt(s, 14, dy + 4 + i * 10, '#e8ffe8')); }
      }
      const waitA = () => { let t = 0; return dt => (K.pressed('a') || (AUTO && (t += dt) > 0.3) ? true : undefined); };

      // ================================================================ the camera (it glides)
      const CAM = { lx: 0, ly: 0, lz: 0, px: 0, py: 30, pz: 40, wl: V3(0, 0, 0), wp: V3(0, 30, 40), k: 4, snap: true };
      function camTo(px, py, pz, lx, ly, lz, k, snap) { CAM.wp.set(px, py, pz); CAM.wl.set(lx, ly, lz); CAM.k = k || 4; if (snap) CAM.snap = true; }
      function camFollow(x, z, k, far) { const d = far || 1; camTo(x, SPY + 8.4 * d, z + 8.4 * d, x, SPY + 0.5, z - 0.3, k || 4); }
      function camTick(dt) {
        const C = T3.cam;
        if (CAM.snap) { CAM.px = CAM.wp.x; CAM.py = CAM.wp.y; CAM.pz = CAM.wp.z; CAM.lx = CAM.wl.x; CAM.ly = CAM.wl.y; CAM.lz = CAM.wl.z; CAM.snap = false; }
        const f = 1 - Math.exp(-dt * CAM.k);
        CAM.px += (CAM.wp.x - CAM.px) * f; CAM.py += (CAM.wp.y - CAM.py) * f; CAM.pz += (CAM.wp.z - CAM.pz) * f;
        CAM.lx += (CAM.wl.x - CAM.lx) * f; CAM.ly += (CAM.wl.y - CAM.ly) * f; CAM.lz += (CAM.wl.z - CAM.lz) * f;
        let sx = 0, sy = 0; if (SHAKE > 0) { sx = (rnd() - 0.5) * SHAKE; sy = (rnd() - 0.5) * SHAKE; }
        C.position.set(CAM.px + sx, CAM.py + sy, CAM.pz); C.lookAt(CAM.lx + sx * 0.5, CAM.ly, CAM.lz);
      }

      // ================================================================ the board game
      let FOCUS = null, MAPV = false, CH = null; // CH: the chance-time reels on screen
      function standPos(p) {
        const s = SP[p.at], grp = P.filter(q => q.at === p.at), n = grp.length, k = grp.indexOf(p);
        if (n <= 1) return [s.x, s.z];
        return [s.x + (k - (n - 1) / 2) * 0.72, s.z + (k % 2 ? -0.32 : 0.22)];
      }
      function setStar(id) {
        if (G.starAt >= 0 && SP[G.starAt]) SP[G.starAt].mesh.material = spaceMats[SP[G.starAt].type];
        G.starAt = id; if (id >= 0) SP[id].mesh.material = spaceMats.star;
      }
      function starDist(from, target) {
        target = target == null ? G.starAt : target; if (from === target) return 0;
        const seen = { [from]: 0 }, q = [from];
        while (q.length) { const c = q.shift(); for (const n of SP[c].next) { if (seen[n] != null) continue; seen[n] = seen[c] + 1; if (n === target) return seen[n]; q.push(n); } }
        return 99;
      }
      function boardTick(dt) {
        for (const p of P) {
          const a = p.a;
          if (!a.busy) {
            const [tx, tz] = standPos(p), dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
            if (d > 0.02) { const st = Math.min(d, dt * 3.5); a.x += dx / d * st; a.z += dz / d * st; a.mv = Math.min(1, a.mv + dt * 6); a.walk += dt * 11; a.ry += wrapA(Math.atan2(dx, dz) - a.ry) * Math.min(1, dt * 10); }
            else { a.mv = Math.max(0, a.mv - dt * 6); a.ry += wrapA(0 - a.ry) * Math.min(1, dt * 4); }
            a.y = SPY; a.gy = SPY;
          }
          pose(a, dt);
        }
        CLOCK_HANDS.rotation.y=clock*.25;
        for (const s of SP) { if (s.flash > 0) { s.flash = Math.max(0, s.flash - dt * 3); } s.mesh.scale.set(1 + s.flash * 0.12, 1 + s.flash * 0.6, 1 + s.flash * 0.12); }
        if (G && G.starAt >= 0) { const s = SP[G.starAt]; if (!STAR.userData.fly) { STAR.position.set(s.x, SPY + 2.3 + Math.sin(clock * 2.5) * 0.18, s.z); STAR.rotation.set(0, clock * 1.6, 0); STAR.scale.setScalar(1); } starRing.position.set(s.x, SPY + 0.08, s.z); starRing.scale.setScalar(1 + Math.sin(clock * 4) * 0.08); STAR.visible = starRing.visible = true;
          if ((frame % 14) === 0) puff(s.x + (rnd() - 0.5) * 1.6, SPY + 1.5 + rnd(), s.z + (rnd() - 0.5) * 1.6, [0xfff4a0, 0xffffff, 0xffd23a], 1, { sp: 0.4, up: 1.2, g: -1, life: 1, s: 0.6 }); }
        else { STAR.visible = starRing.visible = false; }
        for (const d of DICE) {
          if (!d.on) { d.m.visible = false; continue; }
          const a = d.owner.a; d.m.visible = true;
          if (!d.stop) { d.t += dt; if (d.t > 0.055) { d.t = 0; let n = 1 + ri(10); if (n === d.n) n = n % 10 + 1; d.n = n; d.m.material = diceMats[n]; } d.m.rotation.set(Math.sin(clock * 3) * 0.3, clock * 2.4, 0); }
          else { d.m.rotation.y += wrapA(0 - d.m.rotation.y) * Math.min(1, dt * 12); d.m.rotation.x *= 0.8; }
          let s = 1; if (d.pop > 0) { d.pop -= dt; s = 1 + Math.sin((1 - d.pop / 0.5) * Math.PI) * 0.35; if (d.pop <= 0) { d.on = false; puff(d.m.position.x, d.m.position.y, d.m.position.z, [0xffe04a, 0xff9a1a, 0xffffff], 14, { sp: 4, up: 3, life: 0.6 }); } }
          d.m.scale.setScalar(s);
          d.m.position.set(a.x + d.dx, a.gy + 2.9 + Math.sin(clock * 4 + d.dx) * 0.1 + d.jy, a.z);
          d.jy *= 0.85;
        }
        for (const id of ['blades', 'jelly', 'ducks']) if (ANIM[id]) {
          if (id === 'blades') ANIM.blades.rotation.z -= dt * 0.9;
          if (id === 'jelly') { const w = Math.sin(clock * 2.2) * 0.025; ANIM.jelly.scale.set(1 + w, 1 - w * 1.4, 1 + w); }
          if (id === 'ducks') ANIM.ducks.rotation.y += dt * 0.3;
        }
        if (BG.userData.water) { BG.userData.water.offset.x += dt * 0.01; BG.userData.water.offset.y += dt * 0.006; }
        if (BG.userData.foam) { const f = 1 + Math.sin(clock * 1.3) * 0.006; BG.userData.foam.scale.set(33 * f, 1, 24.5 * f); }
      }
      function focusOn(p, k) { FOCUS = p; if (p) camFollow(p.a.x, p.a.z, k || 3.5); }
      function boardCam() { if (FOCUS && !MAPV && !STAR.userData.fly) camFollow(FOCUS.a.x, FOCUS.a.z, CAM.k); }

      // ---- coins
      function gain(p, n, quiet) {
        if (n <= 0) return; p.coins += n; p.st.max = Math.max(p.st.max, p.coins);
        floatTxt(p.a.x, p.a.y + 2.2, p.a.z, '+' + n, '#ffe04a'); coinBurst(p.a.x, p.a.y, p.a.z, Math.min(8, n), true);
        if (!quiet) K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.5]], { bpm: 480, vol: 0.07 });
      }
      function lose(p, n) {
        const r = Math.min(n, p.coins); p.coins -= r;
        floatTxt(p.a.x, p.a.y + 2.2, p.a.z, '-' + n, '#ff6a5a');
        if (r > 0) coinBurst(p.a.x, p.a.y, p.a.z, Math.min(8, r), false);
        K.sfx.tone(600, 0.25, 'square', 0.07, 0, 200);
        return r;
      }
      // ---- a hop from space to space
      let hopN = 0;
      function* hop(p, to) {
        const a = p.a, s = SP[to], x0 = a.x, z0 = a.z, dur = 0.32; let t = 0;
        a.busy = true; a.ry = Math.atan2(s.x - x0, s.z - z0); squash(a, 5);
        yield dt => { t += dt * spd(); const u = Math.min(1, t / dur); a.x = lerp(x0, s.x, u); a.z = lerp(z0, s.z, u); a.y = SPY + Math.sin(u * Math.PI) * 1.05; a.gy = SPY; a.mv = 0.6; a.walk += dt * 8; return u >= 1 ? true : undefined; };
        p.at = to; a.y = SPY; squash(a, -8); s.flash = 1; a.mv = 0;
        K.sfx.tone(440 * Math.pow(2, (hopN++ % 8) / 12), 0.07, 'square', 0.05); K.sfx.tone(160, 0.05, 'sine', 0.08);
      }
      // a little jump on the spot (to hit a block, to celebrate)
      function* jump(p, h, dur, onPeak) {
        const a = p.a, y0 = a.y; let t = 0, hit = false; a.busy = true; squash(a, 6);
        yield dt => { t += dt * spd(); const u = Math.min(1, t / dur); a.y = y0 + Math.sin(u * Math.PI) * h; if (!hit && u > 0.5) { hit = true; if (onPeak) onPeak(); } return u >= 1 ? true : undefined; };
        a.y = y0; squash(a, -7); a.busy = false;
      }
      // ---- the dice block
      function* roll(p, nd) {
        const blocks = [];
        for (let k = 0; k < nd; k++) { const d = DICE[k]; d.on = true; d.stop = false; d.owner = p; d.dx = nd > 1 ? (k - 0.5) * 1.5 : 0; d.jy = 0; d.pop = 0; d.n = 0; d.t = 0; d.m.material = diceMats[0]; blocks.push(d); }
        K.sfx.seq([[72, 0.25], [79, 0.5]], { bpm: 400, vol: 0.06 });
        let total = 0;
        for (const d of blocks) {
          if (p.cpu) yield 0.5 + rnd() * 0.7;
          else { HINT = 'PRESS ' + keyName('a') + ' TO HIT THE BLOCK!'; yield waitA(); HINT = ''; }
          yield* jump(p, 1.2, 0.34, () => { d.stop = true; d.n = FORCE || d.n || 1 + ri(10); FORCE = 0; d.m.material = diceMats[d.n]; d.jy = 0.5; d.pop = 0.5; K.sfx.tone(880, 0.08, 'square', 0.08); K.sfx.tone(1320, 0.12, 'square', 0.06, 0.06); SHAKE = 0.15; });
          total += d.n;
          p.a.busy = true;
        }
        yield 0.55;
        p.left = total;
        return total;
      }
      let HINT = '', FORCE = 0;
      // ---- choosing a way at a fork
      function* junction(p, s) {
        const opts = s.next, a = p.a;
        ARROWS.forEach((m, k) => { const n = SP[opts[k]], dx = n.x - s.x, dz = n.z - s.z, l = Math.hypot(dx, dz); m.position.set(s.x + dx / l * 2.2, SPY + 0.4, s.z + dz / l * 2.2); m.userData.dx = dx / l; m.userData.dz = dz / l; m.rotation.y = Math.atan2(-dx, -dz); m.visible = true; m.userData.k = k; });
        const dist = opts.map(n => starDist(n) + 1);
        let sel = 0, r;
        JUNC = { opts, dist, sel: 0 };
        if (p.cpu) {
          const best = dist[0] <= dist[1] ? 0 : 1, sm = [0.5, 0.78, 0.97][G.diff];
          sel = rnd() < sm ? best : 1 - best; JUNC.sel = 1 - sel;
          yield 0.45; JUNC.sel = sel; K.sfx.tone(880, 0.04); yield 0.5; r = opts[sel];
        } else {
          HINT = 'CHOOSE A WAY: ARROWS, THEN ' + keyName('a');
          r = yield () => {
            if (K.pressed('left') || K.pressed('right') || K.pressed('up') || K.pressed('down')) {
              // pick the arrow that is most in the pressed direction (on screen)
              const st = K.pressed('left') ? [-1, 0] : K.pressed('right') ? [1, 0] : K.pressed('up') ? [0, -1] : [0, 1];
              let best = JUNC.sel, bv = -9;
              opts.forEach((n, k) => { const q = scr(SP[n].x, SPY, SP[n].z), q0 = scr(s.x, SPY, s.z), dx = q.x - q0.x, dy = q.y - q0.y, l = Math.hypot(dx, dy) || 1, v = (dx * st[0] + dy * st[1]) / l; if (v > bv) { bv = v; best = k; } });
              if (best !== JUNC.sel) { JUNC.sel = best; K.sfx.tone(880, 0.04, 'square', 0.05); }
            }
            if (K.pressed('a')) { K.sfx.tone(1320, 0.07); return opts[JUNC.sel]; }
            return undefined;
          };
          HINT = '';
        }
        ARROWS.forEach(m => { m.visible = false; }); JUNC = null;
        return r;
      }
      let JUNC = null;
      function* move(p, n) {
        p.left = n; hopN = 0;
        while (p.left > 0) {
          const s = SP[p.at];
          let to = s.next[0];
          if (s.next.length > 1) to = yield* junction(p, s);
          yield* hop(p, to);
          p.left--;
          if (p.left > 0) {
            if (to === G.starAt) yield* starStop(p);
            else if (SP[to].type === 'shop') yield* shopStop(p, true);
          }
        }
        p.left = 0;
        yield 0.2;
      }
      // ---- the star
      function* starStop(p) {
        focusOn(p);
        yield* host(p.cpu ? p.name + ' HAS FOUND THE STAR!' : 'YOU FOUND THE STAR! I\'LL SWAP IT FOR ' + starCost() + ' COINS.', { auto: p.cpu });
        if (p.coins < starCost()) { yield* host((p.cpu ? p.name + ' ONLY HAS ' : 'OH DEAR, YOU ONLY HAVE ') + p.coins + ' COINS. COME BACK RICHER!', { auto: p.cpu }); return; }
        let yes = true;
        if (!p.cpu) { DLG = { who: 'host', name: 'MC WOBBLE', lines: wrap('WILL YOU BUY THE STAR FOR ' + starCost() + ' COINS?', 40), n: 999, done: true }; const c = yield* choose(['YES PLEASE!', 'NO THANKS'], { y: HH - 98 }); DLG = null; yes = c === 0; }
        if (!yes) { yield* host('SUIT YOURSELF! IT\'LL STILL BE HERE... PROBABLY.', { auto: 1.4 }); return; }
        p.coins -= starCost(); coinBurst(p.a.x, p.a.y, p.a.z, 8, false);
        // the star swoops down into them
        const sx = STAR.position.x, sy = STAR.position.y, sz = STAR.position.z; let t = 0; STAR.userData.fly = true;
        yield dt => { t += dt; const u = Math.min(1, t / 0.9); STAR.position.set(lerp(sx, p.a.x, u), lerp(sy, p.a.y + 1, u) + Math.sin(u * Math.PI) * 2, lerp(sz, p.a.z, u)); STAR.rotation.y += dt * 14; STAR.scale.setScalar(1 - u * 0.7); return u >= 1 ? true : undefined; };
        STAR.userData.fly = false;
        p.stars++; puff(p.a.x, p.a.y + 1.2, p.a.z, [0xffd23a, 0xfff4a0, 0xffffff, 0xff8ad0], 40, { sp: 5, up: 6, life: 1.2 }); FLASH = 0.6;
        K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [83, 0.5], [84, 2]], { bpm: 300, vol: 0.09, wave: 'square' });
        quip(p, 'star'); if (!p.cpu) bubble(p, 'YESSS!', 1.6);
        yield* jump(p, 1.6, 0.5);
        yield* host((p.cpu ? p.name : 'YOU') + ' GOT A STAR! THAT\'S ' + p.stars + '!', { auto: 1.4 });
        yield* moveStar();
        focusOn(p);
      }
      function* moveStar() {
        const opts = STAR_SPOTS.filter(id => id !== G.starAt && !P.some(q => q.at === id));
        setStar(pick(opts.length ? opts : STAR_SPOTS.filter(id => id !== G.starAt)));
        const s = SP[G.starAt], keep = FOCUS; FOCUS = null;
        camTo(s.x, SPY + 13, s.z + 15, s.x, SPY + 1, s.z, 2.4);
        K.sfx.seq([[84, 0.25], [79, 0.25], [76, 0.25], [72, 0.25], [76, 0.25], [79, 0.25], [84, 1]], { bpm: 420, vol: 0.06, wave: 'triangle' });
        yield 1.1;
        yield* host('THE STAR HAS FLOWN OFF TO A NEW SPOT!', { auto: 1.1 });
        FOCUS = keep; if (keep) camFollow(keep.a.x, keep.a.z, 2.5);
        yield 0.6;
      }
      // ---- the shop
      function cpuShop(p) {
        const keys = Object.keys(ITEMS).filter(k => ITEMS[k].cost <= p.coins);
        if (p.items.length >= 3 || !keys.length) return null;
        const spare = p.coins - (p.coins >= starCost() + 5 ? starCost() : 0);
        if (spare < 6 && p.coins < 30) return null;
        if (rnd() < [0.35, 0.6, 0.8][G.diff]) { const ok = keys.filter(k => ITEMS[k].cost <= Math.max(spare, 5)); return pick(ok.length ? ok : keys); }
        return null;
      }
      function* shopStop(p, passing) {
        focusOn(p);
        if (p.cpu) {
          const k = cpuShop(p);
          if (!k) { if (!passing) yield* say('JUST LOOKING, TA.', PORT[CHARS[p.ci].id], p.name, { auto: 1 }); return; }
          p.coins -= ITEMS[k].cost; p.items.push(k); K.sfx.tone(1320, 0.1);
          yield* say(p.name + ' BUYS A ' + ITEMS[k].n + '.', 'host', 'SHOP', { auto: 1.3 }); return;
        }
        DLG = { who: 'host', name: 'SHOP', lines: wrap('WELCOME TO THE SHOP! FANCY A LOOK?', 40), n: 999, done: true };
        const c = yield* choose(['YES PLEASE', 'NO THANKS'], { y: HH - 98 }); DLG = null;
        if (c !== 0) return;
        if (p.items.length >= 3) { yield* host('YOUR POCKETS ARE FULL! (THREE ITEMS MAX.)'); return; }
        const keys = Object.keys(ITEMS);
        for (;;) {
          DLG = { who: 'host', name: 'SHOP', lines: wrap('WHAT\'LL IT BE? YOU HAVE ' + p.coins + ' COINS.', 40), n: 999, done: true };
          const i = yield* choose(keys.map(k => ITEMS[k].n + '  ' + ITEMS[k].cost).concat(['NOTHING, TA']), { y: 56, x: 10, w: 160, desc: keys.map(k => ITEMS[k].d).concat(['']), back: true });
          DLG = null;
          if (i < 0 || i >= keys.length) return;
          const it = ITEMS[keys[i]];
          if (it.cost > p.coins) { yield* host('YOU CAN\'T AFFORD THAT ONE, SORRY!'); continue; }
          p.coins -= it.cost; p.items.push(keys[i]); K.sfx.seq([[79, 0.25], [84, 0.5]], { bpm: 400, vol: 0.08 });
          yield* host('THANK YOU! ONE ' + it.n + '. COME AGAIN!', { auto: 1.4 }); return;
        }
      }
      // ---- items
      function cpuItem(p) {
        if (!p.items.length) return null;
        const d = starDist(p.at);
        if (p.items.includes('warp')) { const best = P.filter(q => q !== p).sort((a, b) => starDist(a.at) - starDist(b.at))[0]; if (best && starDist(best.at) + 6 < d && rnd() < 0.8) return 'warp'; }
        if (p.items.includes('twin') && d > 6 && d < 22) return 'twin';
        if (p.items.includes('magnet') && P.some(q => q !== p && q.coins >= 3)) return 'magnet';
        return null;
      }
      function* useItem(p, k) {
        p.items.splice(p.items.indexOf(k), 1);
        K.sfx.seq([[76, 0.25], [83, 0.25], [88, 0.5]], { bpm: 420, vol: 0.07 });
        if (k === 'twin') { yield* host((p.cpu ? p.name + ' USES' : 'YOU USE') + ' THE TWIN DICE! TWO BLOCKS!', { auto: p.cpu || 1.2 }); return 'twin'; }
        if (k === 'magnet') {
          yield* host('COIN MAGNET! 3 COINS FROM EVERYBODY!', { auto: p.cpu || 1.2 });
          let got = 0; for (const q of P) if (q !== p) { const r = Math.min(3, q.coins); q.coins -= r; got += r; if (r) floatTxt(q.a.x, q.a.y + 2.2, q.a.z, '-' + r, '#ff6a5a'); }
          gain(p, got); yield 1; return 'magnet';
        }
        // the swap kazoo: swap places with somebody (anybody)
        const q = pick(P.filter(o => o !== p));
        yield* host('SWAP KAZOO! ' + (p.cpu ? p.name : 'YOU') + ' SWAP' + (p.cpu ? 'S' : '') + ' PLACES WITH ' + q.name + '!', { auto: p.cpu || 1.2 });
        yield* warpAnim([p, q], () => { const t = p.at; p.at = q.at; q.at = t; for (const o of [p, q]) { const [x, z] = standPos(o); o.a.x = x; o.a.z = z; } });
        focusOn(p, 6); return 'warp';
      }
      // people spin up into the sky and come down somewhere else
      function* warpAnim(who, swap) {
        K.sfx.tone(300, 0.6, 'square', 0.06, 0, 1800);
        let t = 0; who.forEach(o => { o.a.busy = true; });
        yield dt => { t += dt * spd(); who.forEach(o => { o.a.spin += dt * 30; o.a.y = SPY + t * t * 30; }); return t > 0.5 ? true : undefined; };
        swap(); FOCUS && camFollow(FOCUS.a.x, FOCUS.a.z, 20);
        t = 0; K.sfx.tone(1800, 0.5, 'square', 0.05, 0, 300);
        yield dt => { t += dt * spd(); who.forEach(o => { o.a.spin += dt * 30 * (1 - t / 0.5); o.a.y = SPY + Math.max(0, (0.5 - t)) * (0.5 - t) * 30; }); return t > 0.5 ? true : undefined; };
        who.forEach(o => { o.a.spin = 0; o.a.y = SPY; o.a.busy = false; squash(o.a, -8); puff(o.a.x, SPY + 0.3, o.a.z, [0xffffff, 0xd8e8ff], 12, { sp: 3, up: 1.5, life: 0.6 }); });
      }
      // ---- landing
      function* land(p) {
        const s = SP[p.at], dbl = G.last3 ? 2 : 1;
        p.a.busy = false;
        yield 0.2;
        if (p.at === G.starAt) { yield* starStop(p); return; }
        if (s.type === 'blue' || s.type === 'start') { gain(p, 3 * dbl); p.st.blue++; yield 0.9; }
        else if (s.type === 'red') { lose(p, 3 * dbl); p.st.red++; p.a.sad = 1; quip(p, 'red'); if (!p.cpu) bubble(p, pick(['NOOO!', 'AW, MAN!', 'NOT AGAIN!']), 1.4); yield 1.1; p.a.sad = 0; }
        else if (s.type === 'event') { p.st.happen++; yield* happening(p); }
        else if (s.type === 'chance') yield* chanceTime(p);
        else if (s.type === 'shop') yield* shopStop(p, false);
        else if (s.type === 'villain') { banner('COUNT CRUMBLE!', 'THE CRUMB TAX IS DUE', '#cf8bf4'); yield* say('SEVEN COINS FOR CRUMBS ON MY CARPET! AND DO NOT ASK FOR A BISCUIT RECEIPT.', 'count','COUNT CRUMBLE',{auto:p.cpu}); lose(p,7); yield 1; }
        yield 0.3;
      }
      // ---- ! spaces: something happens
      function* happening(p) {
        const auto = p.cpu ? true : 1.6;
        G.events = (G.events || 0) + 1;
        if(G.board===1){const prize=G.jackpot||0;yield* host(prize?'DING DONG! THE CLOCKWORK JACKPOT: '+prize+' COINS!':'THE CLOCK IS STILL WINDING! IT ADDS 9 COINS EACH ROUND.',{auto});if(prize)gain(p,prize);G.jackpot=0;return;}
        if(G.board===2){G.priceDiscount=(G.priceDiscount||0)+1;yield* host('YOU FOUND THE COUNT\'S DISCOUNT LEVER! STARS NOW COST '+starCost()+' COINS.',{auto});return;}
        if(G.events%3===0){yield* host('THE WINDMILL PAYS ITS RENT! 5 COINS FOR EVERYBODY!',{auto});P.forEach(q=>gain(q,5));yield 1;return;}
        K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.25], [91, 0.75]], { bpm: 360, vol: 0.07 });
        banner('HAPPENING!', '', '#5af07a', 1.2); yield 1.1;
        const ev = pick(['geyser', 'goose', 'warp', 'shuffle', 'swap', 'picnic']), who = p.cpu ? p.name : 'YOU';
        if (ev === 'geyser') {
          yield* host('A COIN GEYSER! WHOOSH! 6 COINS FOR ' + who + '!', { auto });
          puff(p.a.x, SPY, p.a.z, [0x8ad0ff, 0xffffff, 0x4aa8f0], 30, { sp: 1.5, up: 10, life: 1 }); gain(p, 6); yield 1;
        } else if (ev === 'goose') {
          if (CHARS[p.ci].id === 'sprout') bubble(p, 'AAAH! A GOOSE!', 2);
          yield* host('HONK! A GOOSE WADDLES UP AND PINCHES 5 COINS!', { auto });
          puff(p.a.x, SPY + 1.4, p.a.z, [0xffffff, 0xf0f0f0, 0xffa83a], 18, { sp: 3, up: 3, life: 1, g: 3 }); K.sfx.tone(520, 0.12, 'sawtooth', 0.07, 0, 380); K.sfx.tone(520, 0.12, 'sawtooth', 0.07, 0.18, 380);
          lose(p, 5); p.a.sad = 1; yield 1; p.a.sad = 0;
        } else if (ev === 'warp') {
          yield* host('WOBBLE WARP! WHEEE! OFF ' + (p.cpu ? p.name + ' GOES' : 'YOU GO') + '!', { auto });
          const to = pick(SP.filter(s => s.id !== p.at && s.id !== G.starAt && s.type !== 'shop')).id;
          yield* warpAnim([p], () => { p.at = to; const [x, z] = standPos(p); p.a.x = x; p.a.z = z; });
          focusOn(p, 5); yield 0.6;
        } else if (ev === 'shuffle') {
          yield* host('STAR SHUFFLE! THE STAR GETS BORED AND HOPS AWAY!', { auto });
          yield* moveStar();
        } else if (ev === 'swap') {
          const q = pick(P.filter(o => o !== p));
          yield* host('SWAP SHOP! ' + who + ' SWAP' + (p.cpu ? 'S' : '') + ' COINS WITH ' + q.name + '!', { auto });
          const t = p.coins; p.coins = q.coins; q.coins = t; p.st.max = Math.max(p.st.max, p.coins); q.st.max = Math.max(q.st.max, q.coins);
          floatTxt(p.a.x, p.a.y + 2.2, p.a.z, String(p.coins), '#ffe04a'); floatTxt(q.a.x, q.a.y + 2.2, q.a.z, String(q.coins), '#ffe04a');
          K.sfx.seq([[72, 0.25], [84, 0.25], [72, 0.25], [84, 0.25]], { bpm: 480, vol: 0.07 }); yield 1.2;
        } else {
          yield* host('PICNIC TIME! EVERYBODY GETS 5 COINS. LOVELY!', { auto });
          for (const q of P) gain(q, 5, q !== p); yield 1.2;
        }
      }
      // ---- ? spaces: chance time (three reels: who gives, what, who gets)
      const CHANCE = [['GIVES 10 COINS TO', 35], ['GIVES 20 COINS TO', 18], ['SWAPS COINS WITH', 25], ['GIVES A STAR TO', 13], ['SWAPS STARS WITH', 9]];
      function* chanceTime(p) {
        K.music(SONGS.card);
        banner('CHANCE TIME!', '', '#d88aff', 1.3); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.5]], { bpm: 420, vol: 0.08 }); yield 1.2;
        yield* host(p.cpu ? p.name + ' STOPS THE REELS. ANYTHING CAN HAPPEN!' : 'STOP THE REELS WITH ' + keyName('a') + '! ANYTHING CAN HAPPEN!', { auto: p.cpu || 1.6 });
        CH = { v: [0, 0, 0], stop: [false, false, false], t: 0 };
        const g1 = ri(4); let g3 = ri(3); if (g3 >= g1) g3++;
        let tot = 0; const r = rnd() * 100; let act = 0; for (let i = 0; i < CHANCE.length; i++) { tot += CHANCE[i][1]; if (r < tot) { act = i; break; } }
        const want = [g1, act, g3];
        for (let k = 0; k < 3; k++) {
          if (p.cpu) yield 0.7 + rnd() * 0.5; else { HINT = 'PRESS ' + keyName('a') + ' TO STOP!'; yield waitA(); HINT = ''; }
          CH.stop[k] = true; CH.v[k] = want[k]; K.sfx.tone(660 + k * 200, 0.1, 'square', 0.08);
          yield 0.25;
        }
        yield 0.6;
        const A = P[g1], B = P[g3], what = CHANCE[act][0];
        yield* host(A.name + ' ' + what + ' ' + B.name + '!', { auto: 1.6 });
        CH = null;
        if (act === 0 || act === 1) { const n = act ? 20 : 10, r2 = Math.min(n, A.coins); A.coins -= r2; floatTxt(A.a.x, A.a.y + 2.2, A.a.z, '-' + r2, '#ff6a5a'); gain(B, r2); if (!r2) yield* host('...BUT ' + A.name + ' HAS NO COINS! PHEW.', { auto: 1.3 }); }
        else if (act === 2) { const t = A.coins; A.coins = B.coins; B.coins = t; A.st.max = Math.max(A.st.max, A.coins); B.st.max = Math.max(B.st.max, B.coins); K.sfx.seq([[72, 0.25], [84, 0.25], [72, 0.25], [84, 0.25]], { bpm: 480, vol: 0.07 }); }
        else if (act === 3) { if (A.stars > 0) { A.stars--; B.stars++; K.sfx.seq([[84, 0.5], [88, 0.5], [91, 1]], { bpm: 300, vol: 0.08 }); puff(B.a.x, B.a.y + 1, B.a.z, [0xffd23a, 0xffffff], 24, { sp: 4, up: 5 }); } else yield* host('...BUT ' + A.name + ' HAS NO STARS TO GIVE! PHEW.', { auto: 1.3 }); }
        else { const t = A.stars; A.stars = B.stars; B.stars = t; K.sfx.seq([[72, 0.25], [84, 0.25], [72, 0.25], [84, 0.25]], { bpm: 480, vol: 0.07 }); }
        if (act < 4) { quip(A, 'lose'); quip(B, 'win'); }
        yield 1.2;
        K.music(G.last3 ? SONGS.last : SONGS.board);
      }
      function drawChance() {
        if (!CH) return;
        CH.t += 1 / 60;
        const x = 20, y = 60, w = W - 40, h = 62;
        panel(x, y, w, h, { c1: '#b04ae8', c2: '#3a0a7a', edge: '#ffd23a' });
        ctr('CHANCE TIME', W / 2, y - 4, '#ffd23a', 1);
        const cells = [[x + 10, 52], [x + 70, w - 140], [x + w - 62, 52]];
        cells.forEach(([cx, cw], k) => {
          H.fillStyle = '#100a2a'; H.fillRect(cx, y + 6, cw, 50); H.strokeStyle = '#fff'; H.lineWidth = 1; H.strokeRect(cx + 0.5, y + 6.5, cw - 1, 49);
          const v = CH.stop[k] ? CH.v[k] : ((CH.t * 14 + k * 3) | 0) % (k === 1 ? CHANCE.length : 4);
          if (k === 1) { const l = wrap(CHANCE[v][0], 16); l.forEach((s, i) => ctr(s, cx + cw / 2, y + 22 + i * 11 - (l.length - 1) * 5, CH.stop[k] ? '#ffd23a' : '#fff')); }
          else { H.drawImage(portOf(P[v]), cx + 6, y + 9, 40, 40); }
          if (!CH.stop[k]) { H.fillStyle = 'rgba(255,255,255,.12)'; H.fillRect(cx, y + 6 + ((CH.t * 200) % 50), cw, 6); }
        });
      }
      // ---- the map
      function* mapView(p) {
        let mx=0,mz=0;MAPV=true;
        yield dt => { const s = K.stick(); mx = clamp(mx + s.x * dt * 18, -34, 36); mz = clamp(mz + s.y * dt * 18, -28, 28); camTo(mx,62,mz+38,mx,0,mz,5); if (K.pressed('b') || K.pressed('a')) return true; return undefined; };
        MAPV = false; camFollow(p.a.x, p.a.z, 4);
      }

      // ================================================================ minigames
      const MG = {}, MG_ORDER = ['balloon', 'hotfloor', 'coins', 'bumper', 'draw', 'says', 'paint', 'kart'];
      let A = null;
      for (const g of [coinGeo, shadowGeo, pGeo, diceGeo, spGeo,arrowGeo]) g.userData.shared = true;
      const SK = () => [0.55, 0.78, 0.95][G ? G.diff : 1];
      const isBot = i => P[i].cpu || AUTO;
      function inp(i) {
        if (!isBot(i)) { const s = K.stick(); return { x: s.x, z: s.y, a: K.pressed('a'), ah: K.held('a'), bh: K.held('b'), u: K.pressed('up'), d: K.pressed('down'), l: K.pressed('left'), r: K.pressed('right') }; }
        return null;
      }
      function walk(a, ix, iz, dt, sp, acc) {
        let m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; m = 1; }
        const f = 1 - Math.exp(-dt * (acc || 12));
        a.vx += (ix * sp - a.vx) * f; a.vz += (iz * sp - a.vz) * f;
        a.x += a.vx * dt; a.z += a.vz * dt;
        const v = Math.hypot(a.vx, a.vz);
        if (m > 0.15) a.ry += wrapA(Math.atan2(ix, iz) - a.ry) * Math.min(1, dt * 14);
        a.mv = clamp(v / sp, 0, 1); a.walk += v * dt * 3.4;
      }
      function toward(a, tx, tz, slow) { const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz); if (d < 0.12) return [0, 0]; const k = slow ? Math.min(1, d * 1.6) : 1; return [dx / d * k, dz / d * k]; }
      function separate(list, r) {
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j]; if (a.out || b.out || Math.abs(a.y - b.y) > 1) continue;
          const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
          if (d2 < r * r && d2 > 1e-6) { const d = Math.sqrt(d2), o = (r - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * o; a.z -= nz * o; b.x += nx * o; b.z += nz * o; }
        }
      }
      function gravity(a, dt, g) { a.vy -= (g || 24) * dt; a.y += a.vy * dt; if (a.y <= a.gy) { const was = a.vy; a.y = a.gy; a.vy = 0; if (was < -4) squash(a, -7); return true; } return false; }
      // a canvas-texture material cached by name
      const tmat = (key, w, h, paint, o) => cmat(key, Object.assign({ map: ctex(key, w, h, paint) }, o || {}));
      function mgMesh(parts) { const m = new T.Mesh(merge(parts, true), matV); A.g.add(m); return m; }
      function mgBegin(id) {
        const def = MG[id];
        partsClear(); for (const c of FLY) { c.life = 0; c.m.visible = false; }
        SKY.material.color.set(0xffffff);
        BG.visible = false; for (const d of DICE) { d.on = false; d.m.visible = false; }
        A = { practice:false, id, def, g: new T.Group(), t: 0, phase: 'card', ct: 0, ft: 0, rt: 0, tl: def.time || 0, done: false, win: [], sc: [0, 0, 0, 0], out: [false, false, false, false], outT: [0, 0, 0, 0], ready: [false, false, false, false], rdyT: P.map(() => 0.6 + rnd() * 1.4), ai: P.map(() => ({ t: 0 })), acts: P.map(p => p.a) };
        T3.scene.add(A.g);
        for (const a of A.acts) { Object.assign(a, { x: 0, y: 0, z: 0, gy: 0, vx: 0, vy: 0, vz: 0, ry: Math.PI, spin: 0, sad: 0, sq: 0, sqv: 0, lean: 0, mv: 0, sc: 1, vis: true, busy: true, out: false, stun: 0, cd: 0, dash: 0, fall: false }); }
        T3.scene.fog.color.set(def.fog || 0xa8d8ff); T3.scene.fog.near = def.fogN || 40; T3.scene.fog.far = def.fogF || 140;
        SKY.visible = CLOUDS.visible = def.sky !== false;
        if (def.bg != null) T3.scene.background = new T.Color(def.bg);
        def.init(A);
        if(['curling','bowling','golf'].includes(id))A.guides=P.map(()=>{const m=new T.Mesh(arrowGeo,arrowMats[1]);A.g.add(m);return m;});
        K.music(SONGS.card);
      }
      function mgEnd() {
        if (!A) return;
        if (A.def.end) A.def.end(A);
        A.g.traverse(o => { if (o.geometry && !o.geometry.userData.shared && !Object.values(geoCache).some(c => c.body === o.geometry)) o.geometry.dispose(); });
        T3.scene.remove(A.g); A = null;
        partsClear();
        BG.visible = true; SKY.visible = CLOUDS.visible = true;applyBoard(G?G.board:0);
        T3.scene.fog.color.set(0xa8d8ff); T3.scene.fog.near = 70; T3.scene.fog.far = 230; T3.scene.background = new T.Color(0xa8d8ff);
        for (const p of P) { Object.assign(p.a, { busy: false, out: false, vis: true, sc: 1, spin: 0, sad: 0, lean: 0, vy: 0 }); const [x, z] = standPos(p); p.a.x = x; p.a.z = z; p.a.y = SPY; p.a.gy = SPY; p.a.ry = 0; }
      }
      const COUNT = 2.6;
      function mgTick(dt) {
        const d = A.def;
        A.t += dt;
        if (A.phase === 'card') {
          if(K.pressed('b') && A.t>.4){const id=A.id;mgEnd();mgBegin(id);A.practice=true;A.phase='play';K.music(SONGS[A.def.song||'mgA']);return;}
          for (let i = 0; i < 4; i++) if (!A.ready[i]) { if (isBot(i)) { A.rdyT[i] -= dt; if (A.rdyT[i] <= 0 && (i === 0 || A.t > 0.4)) { A.ready[i] = true; K.sfx.tone(988, 0.05, 'square', 0.04); } } else if (K.pressed('a') && A.t > 0.4) { A.ready[i] = true; K.sfx.tone(1320, 0.08, 'square', 0.07); } }
          if (A.ready.every(x => x)) { A.ct += dt; if (A.ct > 0.5) { A.phase = 'count'; A.ct = 0; K.music(null); } }
          d.tick(A, dt, false);
        } else if (A.phase === 'count') {
          const c0 = Math.ceil(COUNT - A.ct - 0.6); A.ct += dt; const c1 = Math.ceil(COUNT - A.ct - 0.6);
          if (c1 !== c0 && c1 >= 1 && c1 <= 3) K.sfx.tone(523, 0.14, 'square', 0.09);
          d.tick(A, dt, false);
          if (A.ct >= COUNT) { A.phase = 'play'; K.sfx.tone(1047, 0.4, 'square', 0.1); if (d.song) K.music(SONGS[d.song]); }
        } else if (A.phase === 'play') {
          if(A.practice && K.pressed('b')){const id=A.id;mgEnd();mgBegin(id);return;}
          d.tick(A, dt, true);
          if (d.time && !A.done) { A.tl -= dt; if (A.tl <= 0) { A.tl = 0; d.timeup(A); A.done = true; } if (A.tl < 5.5 && Math.ceil(A.tl) !== Math.ceil(A.tl + dt)) K.sfx.tone(880, 0.06, 'square', 0.06); }
          if (A.done && A.practice) {const id=A.id;mgEnd();mgBegin(id);return;}
          if (A.done) { A.phase = 'fin'; A.ft = 0; K.music(null); K.sfx.seq([[84, 0.25], [79, 0.25], [84, 1]], { bpm: 300, vol: 0.09 }); }
        } else if (A.phase === 'fin') {
          d.tick(A, dt, false); A.ft += dt;
          if (A.ft > 1.6) {
            A.phase = 'res'; A.rt = 0;
            const iw = A.win.includes(0);
            if (iw) K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [79, 0.5], [84, 2]], { bpm: 260, vol: 0.09 });
            else K.sfx.seq([[67, 0.5], [66, 0.5], [65, 0.5], [64, 2]], { bpm: 200, vol: 0.08, wave: 'triangle' });
            A.win.forEach(i => quip(P[i], 'win')); P.forEach((p, i) => { if (!A.win.includes(i) && rnd() < 0.5) quip(p, 'lose'); });
            K.music(SONGS.stage);
          }
        } else if (A.phase === 'res') {
          A.rt += dt;
          A.acts.forEach((a, i) => { if (a.out && !a.vis) return; if (A.win.includes(i)) { const ph = (A.rt * 1.6 + i * 0.3) % 1; a.y = a.gy + Math.sin(ph * Math.PI) * 0.9; if (ph < 0.05) squash(a, 4); a.spin = 0; a.ry += wrapA(0 - a.ry) * Math.min(1, dt * 8); a.mv = 0; } else { a.sad = 1; a.mv = 0; } });
          if (d.resTick) d.resTick(A, dt);
          if ((A.rt > 1 && (K.pressed('a') || AUTO)) || A.rt > 5) A.phase = 'over';
        }
        for (const a of A.acts) pose(a, dt);
        if (d.cam) d.cam(A, dt);
      }
      function drawAimGuides(){
        if(!A.guides)return;
        A.guides.forEach((m,i)=>{
          let x,z,angle,power,show=true;
          if(A.id==='curling'){x=-4.5+i*3;z=4.2;angle=A.aim[i]+(isBot(i)?Math.atan2(-x,8):0);power=A.power[i];show=A.shots[i]<3;}
          else if(A.id==='bowling'){const b=A.bowl[i];x=b.x;z=3.7;angle=b.aim+(isBot(i)?(b.shots-1)*.055:0);power=b.power;show=b.shots<3&&!b.ball;}
          else{const b=A.golf[i];x=b.x;z=b.z;angle=isBot(i)?Math.atan2(b.home-b.x,b.z+4):b.angle;power=b.power;show=!b.done&&b.shots<5&&Math.hypot(b.vx,b.vz)<.15;}
          m.visible=show;m.position.set(x+Math.sin(angle)*1.1,.18,z-Math.cos(angle)*1.1);m.rotation.y=-angle;m.scale.set(.33,1,.5+power*.6);
        });
      }
      // the instruction card
      function drawCard() {
        const d=A.def;H.fillStyle='rgba(5,10,32,.5)';H.fillRect(0,0,W,HH);
        panel(8,8,304,224,{c1:'#293c99',c2:'#130a43'});
        rr(H,14,14,292,27,5);H.fillStyle=d.col;H.fill();H.strokeStyle='#fff';H.stroke();
        H.save();const scale=Math.min(2,280/F.width(d.n));H.translate(160,21);H.scale(scale,scale);ctr(d.n,0,0,'#fff',1);H.restore();
        wrap(d.desc,46).forEach((l,i)=>txt(l,20,49+i*10,'#edf0ff'));
        const yy=100;txt('CONTROLS',20,yy,'#ffdf87');
        d.ctl.forEach(([b,s],i)=>{let x=29;const y=yy+17+i*16;for(const c of b.split(',')){if(c==='stick')stickIcon(x,y+3);else if(c==='dpad')dpadIcon(x,y+3);else btn(c,x,y+3,keyName(c));x+=18;}fitText(s,x,y,276-x,'#fff');});
        fitText((d.team||'FREE FOR ALL')+' / '+d.goal,20,164,280,'#a4eaa8');
        for(let i=0;i<4;i++){const x=17+i*76,y=177;H.drawImage(portOf(P[i]),x,y,25,25);fitText(P[i].name,x+28,y+2,43,'#fff');txt(A.ready[i]?'READY':i?'CPU':'YOU',x+28,y+14,A.ready[i]?'#9aff9e':'#b8bfea');}
        if(d.team)fitText(d.team==='1 V 3'?'SOLO: '+P[0].name+' / CREW: THE OTHER THREE':'BLUE: '+P[0].name+' + '+P[1].name+' / PINK: '+P[2].name+' + '+P[3].name,17,207,286,'#e4c5fa');
        ctr(keyName('a')+': READY    '+keyName('b')+': PRACTICE',160,219,'#ffe68a');
      }
      function mgHud() {
        const d = A.def;
        if (A.phase === 'card') { drawCard(); return; }
        if(A.practice){panel(72,4,176,15,{c1:'#304b7b',c2:'#18244b'});ctr('PRACTICE - '+keyName('b')+': RULES',160,8,'#ffd23a');}
        // the scores along the bottom
        for (let i = 0; i < 4; i++) {
          const x = 4 + i * 79, y = HH - 26, p = P[i], out = A.out[i];
          panel(x, y, 75, 22, { c1: hex(shade(CHARS[p.ci].col, out ? 0.35 : 0.8)), c2: hex(shade(CHARS[p.ci].col, 0.3)), edge: A.win.includes(i) && A.phase === 'res' ? '#ffd23a' : '#fff' });
          H.globalAlpha = out ? 0.5 : 1; H.drawImage(portOf(p), x + 2, y + 2, 18, 18); H.globalAlpha = 1;
          fitText(p.name, x + 22, y + 3, 49, '#fff');
          txt(out ? 'OUT' : d.lab ? d.lab(A, i) : '', x + 22, y + 12, out ? '#ff8a7a' : '#ffe680');
        }
        if (d.time && (A.phase === 'play' || A.phase === 'count')) { const s = Math.ceil(A.tl); panel(W / 2 - 22, 4, 44, 22, { c1: '#2a2a6a', c2: '#0a0a2a' }); ctr(String(s), W / 2, 8, s <= 5 ? '#ff6a5a' : '#fff', 2); }
        if (d.hud) d.hud(A);
        if (A.phase === 'count') { const c = Math.ceil(COUNT - A.ct - 0.6); if (c >= 1) bigText(String(c), W / 2, 86, 6, '#ffd23a', 4, '#6a1a00'); else bigText('GO!', W / 2, 86, 6, '#5af07a', 4, '#0a4a1a'); }
        if (A.phase === 'play' && A.t < 0.5) {}
        if (A.phase === 'fin') bigText(d.finWord || 'FINISH!', W / 2, 90, 4, '#fff', 4, '#c81a1a');
        if (A.phase === 'res') {
          const names = A.win.map(i => P[i].name);
          const s = !names.length ? 'NOBODY WINS!' : names.length === 1 ? names[0] + ' WINS!' : names.length === 4 ? 'EVERYBODY WINS!' : names.join(' & ') + ' WIN!';
          RESBOX = true; panel(20, 30, W - 40, 40, { c1: '#ffb01a', c2: '#c8500a', edge: '#fff' });
          ctr(s, W / 2, 37, '#fff', s.length > 16 ? 1 : 2);
          ctr(G.kind ? (G.kind==='solo' ? (A.win.includes(0)?'STAGE CLEAR!':'TRY AGAIN!'):'FREE PLAY - NO BOARD COINS') : names.length ? '+10 COINS EACH' : 'NO COINS THIS TIME', W / 2, 57, '#3a1000');
          if (A.rt > 1 && (clock * 2 | 0) % 2) ctr('PRESS ' + keyName('a'), W / 2, HH - 40, '#fff');
        }
      }
      // a slow orbit (for the instruction card) or a fixed camera
      function arenaCam(A, px, py, pz, lx, ly, lz) {
        if (A.phase === 'card') { const a = Math.sin(A.t * 0.35) * 0.35, r = Math.hypot(px, pz); camTo(Math.sin(a + Math.atan2(px, pz)) * r, py + 2, Math.cos(a + Math.atan2(px, pz)) * r, lx, ly, lz, 2); }
        else camTo(px, py, pz, lx, ly, lz, 3);
      }
      // a scenery kit for the arenas
      const plankTex = () => ctex('plank', 64, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#c8945a' : '#b8844c'; g.fillRect(0, i * 8, 64, 8); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, i * 8 + 7, 64, 1); g.fillRect((i * 23) % 64, i * 8, 1, 8); } });
      const grassTex = () => ctex('grass', 64, 64, (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#5ec24c' : '#4fb240'; g.fillRect(i * 16, 0, 16, 64); } for (let k = 0; k < 160; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,60,0,.1)'; g.fillRect(rnd() * 64, rnd() * 64, 1, 2 + rnd() * 2); } });
      const waterTex = () => ctex('water', 64, 64, (g) => { g.fillStyle = '#2a8ad8'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + rnd() * 0.2})`; g.fillRect(rnd() * 64, rnd() * 64, 4 + rnd() * 7, 1); } });
      function trees(list, n, rmin, rmax, y) { for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd() * 0.3, r = rmin + rnd() * (rmax - rmin), x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.9 + rnd() * 0.6; list.push(pt(S.cyl(0.2 * s, 0.28 * s, 1.4 * s, 6), 0x8a5a32, x, (y || 0) + 0.7 * s, z)); list.push(pt(S.ico(1.05 * s, 1), rnd() < 0.5 ? 0x3a9a3a : 0x4aac40, x, (y || 0) + 1.95 * s, z)); } }
      function bunting(list, x0, x1, y, z, n) { for (let k = 0; k < n; k++) { const x = lerp(x0, x1, (k + 0.5) / n), sag = Math.sin((k + 0.5) / n * Math.PI) * 0.5; list.push(pt(S.cone(0.22, 0.45, 3), [0xff4a4a, 0xffd23a, 0x4a8ae8, 0x3ac04a, 0xff8ad0][k % 5], x, y - sag - 0.2, z, Math.PI, 0, 0, 1, 1, 0.3)); } }

      // ---------------------------------------------------------------- 1. BALLOON BURST (mash A)
      MG.balloon = {
        n: 'BALLOONY BIN', col: '#ff5a8a', song: 'mgA', time: 25,
        desc: 'PUMP UP YOUR BALLOON UNTIL IT GOES BANG! IT LEAKS, SO DON\'T STOP!',
        ctl: [['a', 'MASH TO PUMP']], goal: 'BE THE FIRST TO POP',
        icon(g, x, y) { g.fillStyle = '#ff4a6a'; g.beginPath(); g.ellipse(x, y - 3, 9, 11, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - 3, y - 7, 2.5, 4, -0.4, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(x, y + 8); g.quadraticCurveTo(x + 4, y + 12, x, y + 16); g.stroke(); },
        init(A) {
          const Q = [];
          const fl = T3.plane(20, 10, tmat('plankM', 64, 64, (g) => { const t = plankTex(); g.drawImage(t.image, 0, 0); }, {})); fl.material.map.repeat.set(5, 2.5); fl.rotation.x = -Math.PI / 2; A.g.add(fl);
          // a striped tent behind
          const st = tmat('tent', 64, 16, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e8304a'; g.fillRect(i * 8, 0, 8, 16); } });
          const tent = new T.Mesh(new T.CylinderGeometry(11, 11, 7, 32, 1, true, Math.PI * 0.62, Math.PI * 0.76), cmat('tentM', { map: st.map, side: T.DoubleSide })); st.map.repeat.set(10, 1); tent.position.set(0, 3.5, 5); A.g.add(tent);
          Q.push(pt(S.cone(12, 4, 32, 1), 0xe8304a, 0, 8.8, 5));
          bunting(Q, -8, 8, 6.2, -4.6, 22); bunting(Q, -8, 8, 5.4, -3.6, 22);
          A.bal = [];
          for (let i = 0; i < 4; i++) {
            const x = -4.5 + i * 3, c = CHARS[P[i].ci].col;
            Q.push(pt(S.box(1.1, 0.4, 0.9), 0xe8302a, x, 0.2, -0.6)); Q.push(pt(S.cyl(0.26, 0.3, 1.1, 12), 0xd8d8e0, x, 0.95, -0.6)); Q.push(pt(S.cyl(0.32, 0.32, 0.08, 12), 0xffd23a, x, 1.5, -0.6));
            Q.push(pt(S.cyl(0.06, 0.06, 1.8, 6), 0x2a2a2a, x, 0.45, -1.4, Math.PI / 2, 0, 0)); Q.push(pt(S.cyl(0.06, 0.06, 1.2, 6), 0x2a2a2a, x, 0.9, -2.3));
            Q.push(pt(S.box(1.2, 0.08, 0.5), c, x, 0.02, 0.9));
            const h = new T.Group(); h.position.set(x, 1.55, -0.6); const hm = new T.Mesh(merge([pt(S.cyl(0.05, 0.05, 0.8, 6), 0x8a8a90, 0, 0.4, 0), pt(S.cyl(0.08, 0.08, 0.9, 8), 0x1a1a1a, 0, 0.82, 0, 0, 0, Math.PI / 2)], true), matV); h.add(hm); A.g.add(h);
            const bm = new T.Mesh(new T.SphereGeometry(1, 20, 14), cmat('bal' + c, { color: c, emissive: shade(c, 0.18) }));
            const knot = new T.Mesh(new T.ConeGeometry(0.12, 0.2, 6), cmat('bal' + c, {})); knot.position.y = -1.02; knot.rotation.x = Math.PI; bm.add(knot);
            const shine = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), cmat('shine', { color: 0xffffff, lit: false, transparent: true, opacity: 0.55 })); shine.position.set(-0.38, 0.45, 0.72); bm.add(shine);
            bm.position.set(x, 2, -2.3); A.g.add(bm);
            const a = A.acts[i]; a.x = x; a.z = 0.75; a.ry = Math.PI;
            A.bal.push({ s: 0, m: bm, h, push: 0, cd: 0.5, pop: false, rate: [5.0, 6.4, 7.6][G.diff] * (0.92 + rnd() * 0.16) });
          }
          mgMesh(Q);
          camTo(0, 4.4, 9.6, 0, 2.3, -1.2, 3, true);
        },
        tick(A, dt, live) {
          A.bal.forEach((b, i) => {
            const a = A.acts[i];
            let press = false;
            if (live && !b.pop) {
              if (isBot(i)) { b.cd -= dt; if (b.cd <= 0) { press = true; b.cd = 1 / b.rate * (0.7 + rnd() * 0.6) + (rnd() < [0.07, 0.04, 0.015][G.diff] ? 0.4 : 0); } }
              else press = K.pressed('a');
            }
            if (press) { b.s += 1 / 44 * (0.9 + rnd() * 0.2); b.push = 1; squash(a, 3); if (i === 0) K.sfx.noise(0.07, 0.06, 900 + b.s * 1500, 0, 'bandpass'); }
            if (live && !b.pop) b.s = Math.max(0, b.s - dt * 0.035);
            b.push = Math.max(0, b.push - dt * 7);
            b.h.position.y = 1.55 - (1 - Math.abs(1 - b.push * 2)) * 0.32; a.lean = b.push * 0.25; a.y = 0;
            const sc = 0.32 + b.s * 1.2, wob = Math.sin(A.t * 9 + i) * 0.02 * (1 + b.s * 3);
            b.m.scale.set(sc * (1 + wob), sc * (1.08 - wob), sc * (1 + wob)); b.m.position.y = 1.55 + sc * 1.05;
            if (b.s >= 1 && !b.pop && live) {
              b.pop = true; b.m.visible = false; puff(b.m.position.x, b.m.position.y, b.m.position.z, [CHARS[P[i].ci].col, 0xffffff, 0xffd23a], 40, { sp: 7, up: 4, life: 1, g: 6 });
              K.sfx.noise(0.4, 0.22, 3000, 0, 'lowpass', 300); K.sfx.tone(120, 0.2, 'square', 0.1, 0, 40); SHAKE = 0.35; FLASH = 0.3;
              if (!A.done) { A.win = [i]; A.done = true; }
            }
          });
        },
        timeup(A) { let m = -1; A.bal.forEach(b => { m = Math.max(m, b.s); }); A.win = A.bal.map((b, i) => b.s >= m - 0.001 ? i : -1).filter(i => i >= 0); },
        lab: (A, i) => Math.min(100, Math.round(A.bal[i].s * 100)) + '%',
        hud(A) { if (A.phase === 'play' && !isBot(0) && (clock * 4 | 0) % 2) { const q = scr(A.acts[0].x, 3.6, A.acts[0].z); ctr('MASH ' + keyName('a') + '!', clamp(q.x, 50, W - 50), Math.min(q.y, 150), '#ffd23a', 2); } },
        cam(A) { arenaCam(A, 0, 4.4, 9.6, 0, 2.3, -1.2); },
      };

      // ---------------------------------------------------------------- 2. HOT FLOOR (the tiles fall into the lava)
      MG.hotfloor = {
        n: 'HOT FLOOR', col: '#ff6a1a', song: 'mgB', time: 40, fog: 0x3a1a10, fogN: 20, fogF: 70, sky: false, bg: 0x2a0a08,
        desc: 'TILES GET HOT WHEN YOU STAND ON THEM, THEN DROP INTO THE LAVA. KEEP MOVING AND HOP THE GAPS!',
        ctl: [['stick', 'RUN ABOUT'], ['a', 'HOP OVER A GAP']], goal: 'BE THE LAST ONE STANDING',
        icon(g, x, y) { g.fillStyle = '#ff6a1a'; g.fillRect(x - 12, y + 4, 24, 8); g.fillStyle = '#ffd23a'; g.fillRect(x - 8, y + 6, 6, 3); for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? '#6a6a7a' : '#9a9aaa'; g.fillRect(x - 12 + i * 8.5, y - 6 + (i === 1 ? 6 : 0), 7, 7); } },
        init(A) {
          const lt = ctex('lava', 64, 64, (g) => { g.fillStyle = '#d82a0a'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 40; i++) { const c = ['#ff6a1a', '#ffb01a', '#ff8a2a', '#a81a0a'][i % 4]; g.fillStyle = c; g.beginPath(); g.arc(rnd() * 64, rnd() * 64, 3 + rnd() * 7, 0, 7); g.fill(); } });
          lt.repeat.set(6, 6);
          const lava = new T.Mesh(new T.PlaneGeometry(60, 60), cmat('lavaM', { map: lt, lit: false })); lava.rotation.x = -Math.PI / 2; lava.position.y = -1.3; A.g.add(lava); A.lava = lt;
          const Q = [];
          for (let k = 0; k < 22; k++) { const a = k / 22 * 6.28, r = 10.5 + rnd() * 3; Q.push(pt(S.dod(1.8 + rnd() * 1.5), pick([0x3a2a2a, 0x4a3430, 0x2a1e1e]), Math.cos(a) * r, -0.5 + rnd() * 2, Math.sin(a) * r, rnd(), rnd(), 0, 1, 1.4 + rnd(), 1)); }
          for (let k = 0; k < 4; k++) { const a = k / 4 * 6.28 + 0.8; Q.push(pt(S.cone(3.5, 9, 7), 0x3a2622, Math.cos(a) * 15, 3, Math.sin(a) * 15)); Q.push(pt(S.cyl(0.8, 1.2, 0.5, 7), 0xff6a1a, Math.cos(a) * 15, 7.5, Math.sin(a) * 15)); }
          mgMesh(Q);
          const tt = tmat('tileT', 32, 32, (g) => { g.fillStyle = '#8a8a9a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#a8a8b8'; g.fillRect(2, 2, 28, 28); g.fillStyle = '#9a9aac'; g.fillRect(5, 5, 22, 22); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(9, 12, 8, 2); g.fillRect(18, 20, 6, 2); });
          const hot = cmat('tileHot', { color: 0xff8a5a, emissive: 0x8a2000 });
          const geo = new T.BoxGeometry(1.88, 0.7, 1.88);
          A.tiles = [];
          for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const k = j * 7 + i, mt = cmat('tileT' + k, { map: tt.map, emissive: 0x000000 }); mt.color.set(0xffffff); mt.emissive.set(0x000000); const m = new T.Mesh(geo, mt); const x = (i - 3) * 2, z = (j - 3) * 2; m.position.set(x, -0.35, z); A.g.add(m); A.tiles.push({ x, z, st: 0, t: 0, y: 0, vy: 0, m, heat: 0 }); }
          A.crumble = 2.6; A.cr = 2;
          const start = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
          A.acts.forEach((a, i) => { a.x = start[i][0]; a.z = start[i][1]; a.ry = Math.atan2(-a.x, -a.z); });
          LT.hemi.color.set(0xffc8a0);
          camTo(0, 10.5, 10, 0, 0, 0.9, 3, true);
        },
        end() { LT.hemi.color.set(0xeef6ff); },
        tick(A, dt, live) {
          A.lava.offset.x += dt * 0.05; A.lava.offset.y += dt * 0.03;
          if (rnd() < 0.15) puff((rnd() - 0.5) * 18, -1.2, (rnd() - 0.5) * 18, [0xffb01a, 0xff6a1a], 1, { sp: 0.3, up: 3, life: 0.8, g: 3 });
          const tileAt = (x, z) => { const i = Math.round(x / 2 + 3), j = Math.round(z / 2 + 3); if (i < 0 || j < 0 || i > 6 || j > 6) return null; return A.tiles[j * 7 + i]; };
          const HEAT = Math.max(0.55, 1.7 - A.t * 0.032), shakeT = 0.75;
          // tiles
          for (const t of A.tiles) {
            if (A.done) break;
            if (t.st === 0) { t.heat = Math.max(0, t.heat - dt * 0.15); if (t.heat >= HEAT) { t.st = 1; t.t = shakeT; } }
            if (t.st <= 1) { const h = t.st === 1 ? 1 : t.heat / HEAT; t.m.material.color.setRGB(1, 1 - h * 0.55, 1 - h * 0.75); t.m.material.emissive.setRGB(h * h * 0.55, h * h * 0.12, 0); }
            if (t.st === 1) { t.t -= dt; t.m.position.x = t.x + Math.sin(A.t * 60) * 0.06; if (t.t <= 0) { t.st = 2; t.vy = 0; puff(t.x, 0, t.z, [0x8a8a9a, 0x6a6a7a], 6, { sp: 2, up: 2, life: 0.5, r: 1.6 }); if (rnd() < 0.5) K.sfx.noise(0.15, 0.05, 600); } }
            else if (t.st === 2) { t.vy -= 18 * dt; t.y += t.vy * dt; t.m.position.y = -0.35 + t.y; t.m.rotation.x += dt * 0.6; if (t.y < -5) { t.st = 3; t.m.visible = false; puff(t.x, -1.2, t.z, [0xffb01a, 0xff6a1a, 0xffffff], 6, { sp: 2, up: 3, life: 0.5 }); } }
          }
          if (live) { A.cr -= dt; if (A.cr <= 0) { A.crumble = Math.max(0.3, A.crumble * 0.9); A.cr = A.crumble; const ok = A.tiles.filter(t => t.st === 0); if (ok.length) { const t = pick(ok); t.heat = Math.max(t.heat, HEAT * 0.7); } } }
          const alive = A.acts.filter(a => !a.out);
          A.acts.forEach((a, i) => {
            if (A.done && !a.out && !a.fall) { a.mv = 0; a.y = Math.max(0, a.y); return; }
            if (a.out) { a.vy -= 10 * dt; a.y += a.vy * dt; a.spin += dt * 10; if (a.y > 12) a.vis = false; if (rnd() < 0.5 && a.vis) puff(a.x, a.y, a.z, [0x555555, 0x888888], 1, { sp: 0.5, up: 0, g: -2, life: 0.6 }); return; }
            const t = tileAt(a.x, a.z), solid = t && t.st < 2;
            let ix = 0, iz = 0, jumpNow = false;
            const I = inp(i);
            if (live && !a.fall) {
              if (I) { ix = I.x; iz = I.z; jumpNow = I.a; }
              else {
                const ai = A.ai[i], sk = SK(), ground = a.y <= 0.01;
                ai.t -= dt;
                if (t && (t.st === 1 || t.heat > HEAT * [0.85, 0.65, 0.5][G.diff]) && ai.tg === t && ai.react == null) ai.react = [0.35, 0.18, 0.06][G.diff];
                if (ai.react != null) ai.react -= dt;
                const need = !ai.tg || ai.tg.st >= 2 || ai.t <= 0 || (ai.react != null && ai.react <= 0);
                if (need && ground) {
                  ai.t = [1.6, 1.2, 0.9][G.diff] * (0.7 + rnd() * 0.6); ai.react = null;
                  const ci = Math.round(a.x / 2 + 3), cj = Math.round(a.z / 2 + 3);
                  let best = null, bv = -1e9, bj = false;
                  for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
                    if (!di && !dj) continue; const ii = ci + di, jj = cj + dj; if (ii < 0 || jj < 0 || ii > 6 || jj > 6) continue;
                    const c = A.tiles[jj * 7 + ii]; if (c.st > (rnd() < (1 - sk) * 0.3 ? 1 : 0)) continue;
                    const far = Math.abs(di) === 2 || Math.abs(dj) === 2;
                    let jump = false;
                    if (far) { if (Math.abs(di) === 2 && Math.abs(dj) === 2) { const m = A.tiles[(cj + dj / 2) * 7 + ci + di / 2]; if (m.st >= 1) continue; } else { const mi = ci + Math.round(di / 2), mj = cj + Math.round(dj / 2), m = A.tiles[mj * 7 + mi]; if (m.st >= 2) { if (di && dj) continue; jump = true; } } }
                    else if (di && dj) { const s1 = A.tiles[cj * 7 + ci + di], s2 = A.tiles[(cj + dj) * 7 + ci]; if (s1.st >= 2 && s2.st >= 2) continue; }
                    let nb = 0; for (const o of A.tiles) if (o.st === 0 && o !== c && Math.abs(o.x - c.x) <= 2 && Math.abs(o.z - c.z) <= 2) nb++;
                    let v = nb * 0.5 - c.heat / HEAT * 2.5 * sk - (far ? 0.5 : 0) - (jump ? 1.6 - sk : 0) - Math.hypot(c.x, c.z) * 0.07 + rnd() * (1.2 - sk) * 2;
                    for (const o of A.acts) if (o !== a && !o.out && Math.hypot(o.x - c.x, o.z - c.z) < 1.6) v -= 1.2;
                    if (v > bv) { bv = v; best = c; bj = jump; }
                  }
                  if (best) { ai.tg = best; ai.jump = bj; }
                }
                if (ai.tg) { [ix, iz] = toward(a, ai.tg.x, ai.tg.z, true); if (Math.hypot(ai.tg.x - a.x, ai.tg.z - a.z) < 0.35) { ix = iz = 0; } }
                // a gap just ahead? hop it
                if (ground && (ix || iz)) { const m = Math.hypot(ix, iz) || 1, ah = tileAt(a.x + ix / m * 0.95, a.z + iz / m * 0.95); if ((!ah || ah.st >= 2) && ai.tg && ai.tg.st <= 1 && Math.hypot(ai.tg.x - a.x, ai.tg.z - a.z) < 3.6 && rnd() < [0.8, 0.94, 1][G.diff]) jumpNow = true; }
              }
            }
            walk(a, ix, iz, dt, a.fall ? 0 : 5.2, 12);
            a.x = clamp(a.x, -6.9, 6.9); a.z = clamp(a.z, -6.9, 6.9);
            const onGround = a.y <= 0.001 && a.vy <= 0;
            if (jumpNow && onGround && solid) { a.vy = 7.4; squash(a, 5); if (i === 0) K.sfx.tone(300, 0.12, 'square', 0.06, 0, 600); }
            if (!a.fall) {
              a.vy -= 24 * dt; a.y += a.vy * dt;
              if (a.y <= 0) { const tt = tileAt(a.x, a.z); if (tt && tt.st < 2) { if (a.vy < -4) squash(a, -6); a.y = 0; a.vy = 0; if (tt.st === 0 && live) tt.heat += dt; } else if (a.y < -0.15) { a.fall = true; } }
            } else {
              a.vy -= 24 * dt; a.y += a.vy * dt;
              if (a.y < -1.0) { a.out = true; A.out[i] = true; A.outT[i] = A.t; a.vy = 15; a.burn = 1; puff(a.x, -1, a.z, [0xffb01a, 0xff6a1a, 0xffffff, 0x555555], 30, { sp: 4, up: 6, life: 0.9 }); K.sfx.noise(0.5, 0.2, 2000, 0, 'lowpass', 200); K.sfx.tone(800, 0.4, 'square', 0.07, 0, 1600); bubble(P[i], pick(['HOT HOT HOT!', 'OUCH!', 'MY BOTTOM!']), 1.5); }
            }
            a.gy = solid ? 0 : -5;
          });
          separate(A.acts, 1.0);
          const left = A.acts.filter(a => !a.out);
          if (live && !A.done && left.length <= 1) {
            if (left.length === 1) A.win = [A.acts.indexOf(left[0])];
            else { const last = Math.max(...A.outT); A.win = [0, 1, 2, 3].filter(i => A.outT[i] >= last - 0.05); }
            A.done = true;
          }
          void alive;
        },
        timeup(A) { A.win = [0, 1, 2, 3].filter(i => !A.out[i]); },
        lab: (A, i) => 'STILL IN',
        cam(A) { arenaCam(A, 0, 10.5, 10, 0, 0, 0.9); },
      };

      // ---------------------------------------------------------------- 3. COIN SHOWER (grab coins, dodge the anvils)
      MG.coins = {
        n: 'SMALL CHANGE WEATHER', col: '#ffc81a', song: 'mgA', time: 30,
        desc: 'IT\'S RAINING COINS! GRAB AS MANY AS YOU CAN, BUT WATCH OUT FOR FALLING ANVILS.',
        ctl: [['stick', 'RUN ABOUT']], goal: 'GRAB THE MOST COINS',
        icon(g, x, y) { for (const [dx, dy] of [[-7, -4], [5, -8], [2, 6]]) { g.fillStyle = '#ffc81a'; g.beginPath(); g.ellipse(x + dx, y + dy, 5, 6, 0, 0, 7); g.fill(); g.fillStyle = '#e09a10'; g.fillRect(x + dx - 1, y + dy - 3, 2, 6); } g.fillStyle = '#3a3a44'; g.fillRect(x + 3, y - 1, 10, 4); },
        init(A) {
          const gt = grassTex(); gt.repeat.set(4, 4);
          const fl = new T.Mesh(new T.PlaneGeometry(14, 14), cmat('grassM', { map: gt })); fl.rotation.x = -Math.PI / 2; A.g.add(fl);
          const out = new T.Mesh(new T.PlaneGeometry(90, 90), cmat('meadow', { color: 0x4aa83c })); out.rotation.x = -Math.PI / 2; out.position.y = -0.02; A.g.add(out);
          const Q = [];
          for (let k = -7; k <= 7; k += 1) for (const [x, z, r] of [[k, -7.2, 0], [k, 7.2, 0], [-7.2, k, 1], [7.2, k, 1]]) { Q.push(pt(S.box(0.16, 0.8, 0.16), 0xf4ead0, x, 0.4, z)); }
          for (const [x, z, r] of [[0, -7.2, 0], [0, 7.2, 0], [-7.2, 0, 1], [7.2, 0, 1]]) { Q.push(pt(S.box(r ? 0.1 : 14.4, 0.1, r ? 14.4 : 0.1), 0xf4ead0, x, 0.62, z)); Q.push(pt(S.box(r ? 0.1 : 14.4, 0.1, r ? 14.4 : 0.1), 0xf4ead0, x, 0.32, z)); }
          trees(Q, 18, 11, 17);
          // a hedge round the meadow, stones and toadstools
          for (let k = 0; k < 36; k++) { const a = k / 36 * 6.28, r = 9.4 + Math.sin(k * 2.3) * 0.4; Q.push(pt(S.ico(1.0 + (k % 3) * 0.15, 1), k % 2 ? 0x3a9a3a : 0x2e8a34, Math.cos(a) * r, 0.5, Math.sin(a) * r, 0, k, 0, 1.3, 0.9, 1.3)); }
          for (let k = 0; k < 10; k++) { const a = rnd() * 6.28, r = 7.6 + rnd() * 1; Q.push(pt(S.cyl(0.07, 0.09, 0.3, 6), 0xfff4e0, Math.cos(a) * r, 0.15, Math.sin(a) * r)); Q.push(pt(S.ball(0.2, 8), 0xe8302a, Math.cos(a) * r, 0.32, Math.sin(a) * r, 0, 0, 0, 1, 0.55, 1)); }
          for (let k = 0; k < 8; k++) { const a = rnd() * 6.28, r = 8 + rnd(); Q.push(pt(S.dod(0.3 + rnd() * 0.3), 0x9a948a, Math.cos(a) * r, 0.1, Math.sin(a) * r, rnd(), rnd(), 0, 1, 0.6, 1)); }
          for (let k = 0; k < 40; k++) { const a = rnd() * 6.28, r = 8 + rnd() * 3; Q.push(pt(S.ball(0.14, 6), pick([0xff5a8a, 0xffe04a, 0xffffff]), Math.cos(a) * r, 0.15, Math.sin(a) * r)); }
          mgMesh(Q);
          A.cs = []; for (let k = 0; k < 44; k++) { const m = mkCoin(A.g); m.visible = false; const sh = blob(0.8); sh.visible = false; A.g.add(sh); A.cs.push({ m, sh, on: false }); }
          const anvGeo = merge([pt(S.box(1.2, 0.42, 0.7), 0x3a3a46, 0, 0.75, 0), pt(S.cone(0.3, 0.7, 6), 0x3a3a46, 0.85, 0.8, 0, 0, 0, Math.PI / 2), pt(S.box(0.5, 0.4, 0.45), 0x2a2a34, 0, 0.35, 0), pt(S.box(1, 0.22, 0.7), 0x2a2a34, 0, 0.11, 0), pt(S.box(1.2, 0.05, 0.05), 0x7a7a8a, 0, 0.97, 0.33)], true);
          const ringG = new T.RingGeometry(0.75, 1.0, 20); ringG.rotateX(-Math.PI / 2);
          A.anv = []; for (let k = 0; k < 4; k++) { const m = new T.Mesh(anvGeo, matV); m.visible = false; A.g.add(m); const ring = new T.Mesh(ringG, cmat('warn', { color: 0xff2a1a, lit: false, transparent: true, opacity: 0.8 })); ring.visible = false; A.g.add(ring); A.anv.push({ m, ring, st: 0 }); }
          A.ct = 0; A.at = 2;
          const start = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
          A.acts.forEach((a, i) => { a.x = start[i][0]; a.z = start[i][1]; a.ry = 0; });
          camTo(0, 10.5, 10.5, 0, 0, 1, 3, true);
        },
        tick(A, dt, live) {
          const drop = (x, z, y, vy, val) => { const c = A.cs.find(c => !c.on); if (!c) return; Object.assign(c, { on: true, x, z, y, vy, vx: 0, vz: 0, val, life: 4.5, st: 0 }); c.m.visible = true; c.sh.visible = true; c.m.scale.setScalar(val > 1 ? 1.6 : 1); };
          if (live) {
            A.ct -= dt; if (A.ct <= 0) { A.ct = 0.2 + rnd() * 0.12; const big = rnd() < 0.09; drop((rnd() - 0.5) * 12.4, (rnd() - 0.5) * 12.4, 11 + rnd() * 3, -4, big ? 5 : 1); }
            A.at -= dt; if (A.at <= 0) { A.at = Math.max(0.9, 1.9 - A.t * 0.03) * (0.7 + rnd() * 0.6); const an = A.anv.find(n => !n.st); if (an) { const tg = rnd() < 0.55 ? pick(A.acts) : null; Object.assign(an, { st: 1, t: 0.95, x: clamp(tg ? tg.x + (rnd() - 0.5) * 1.5 : (rnd() - 0.5) * 12, -6, 6), z: clamp(tg ? tg.z + (rnd() - 0.5) * 1.5 : (rnd() - 0.5) * 12, -6, 6), y: 14 }); an.ring.visible = true; an.ring.position.set(an.x, 0.03, an.z); K.sfx.tone(1200, 0.08, 'square', 0.03); } }
          }
          for (const c of A.cs) {
            if (!c.on) continue;
            if (c.st === 0) { c.vy -= 14 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.z += c.vz * dt; if (c.y <= 0.36) { c.y = 0.36; if (c.vy < -3) c.vy = -c.vy * 0.35; else { c.st = 1; c.vy = 0; c.vx = c.vz = 0; } } }
            else { c.life -= dt; if (c.life <= 0) { c.on = false; c.m.visible = c.sh.visible = false; continue; } }
            c.x = clamp(c.x, -6.8, 6.8); c.z = clamp(c.z, -6.8, 6.8);
            c.m.position.set(c.x, c.y + (c.st ? Math.sin(A.t * 4 + c.x) * 0.06 : 0), c.z); c.m.rotation.y += dt * 5; c.m.visible = c.life > 1 || (A.t * 10 | 0) % 2 === 0;
            c.sh.position.set(c.x, 0.02, c.z); const s = clamp(1 - c.y / 14, 0.3, 1) * (c.val > 1 ? 1.2 : 0.8); c.sh.scale.set(s, 1, s);
            for (let i = 0; i < 4 && c.on; i++) { const a = A.acts[i]; if (a.stun > 0) continue; if (c.y < 1.8 && Math.abs(a.x - c.x) < 0.8 && Math.abs(a.z - c.z) < 0.8) { c.on = false; c.m.visible = c.sh.visible = false; A.sc[i] += c.val; if (i === 0 || c.val > 1) K.sfx.tone(c.val > 1 ? 1568 : 1319, 0.08, 'square', 0.06); if (i === 0) K.sfx.tone(1976, 0.1, 'square', 0.05, 0.05); puff(c.x, c.y, c.z, [0xffe04a, 0xffffff], c.val > 1 ? 10 : 3, { sp: 2, up: 3, life: 0.4 }); if (c.val > 1) floatTxt(a.x, 2, a.z, '+5', '#ffe04a'); } }
          }
          for (const n of A.anv) {
            if (!n.st) continue;
            if (n.st === 1) { n.t -= dt; n.ring.scale.setScalar(1 + Math.sin(A.t * 20) * 0.08); if (n.t <= 0) { n.st = 2; n.m.visible = true; n.vy = -22; } }
            if (n.st === 2) { n.y += n.vy * dt; if (n.y <= 0) { n.y = 0; n.st = 3; n.t = 0.9; n.ring.visible = false; SHAKE = 0.3; K.sfx.noise(0.25, 0.18, 400); K.sfx.tone(90, 0.15, 'square', 0.1); puff(n.x, 0.1, n.z, [0xc8b080, 0xa89060], 12, { sp: 3, up: 2, life: 0.6 });
              A.acts.forEach((a, i) => { if (a.stun <= 0 && Math.hypot(a.x - n.x, a.z - n.z) < 1.05) { a.stun = 1.6; squash(a, -12); const l = Math.min(3, A.sc[i]); A.sc[i] -= l; for (let k = 0; k < l; k++) { const ang = rnd() * 6.28; drop(a.x, a.z, 1, 5, 1); const c = A.cs.filter(c => c.on).pop(); if (c) { c.vx = Math.cos(ang) * 3; c.vz = Math.sin(ang) * 3; } } if (i === 0) K.sfx.tone(200, 0.4, 'square', 0.08, 0, 80); bubble(P[i], 'BONK!', 1.2); } }); } }
            if (n.st === 3) { n.t -= dt; n.y = n.t < 0.3 ? -(0.3 - n.t) * 4 : 0; if (n.t <= 0) { n.st = 0; n.m.visible = false; } }
            n.m.position.set(n.x, n.y, n.z);
          }
          const sk = SK();
          A.acts.forEach((a, i) => {
            if (a.stun > 0) { a.stun -= dt; a.vx = a.vz = 0; a.mv = 0; a.spin = 0; if ((frame + i * 7) % 9 === 0) puff(a.x + Math.cos(A.t * 8) * 0.5, 1.9, a.z + Math.sin(A.t * 8) * 0.5, [0xffe04a], 1, { sp: 0.2, up: 0.3, g: 0, life: 0.4 }); pose(a, 0); return; }
            let ix = 0, iz = 0; const I = inp(i);
            if (live) {
              if (I) { ix = I.x; iz = I.z; }
              else {
                const ai = A.ai[i]; ai.t -= dt;
                if (ai.t <= 0 || !ai.c || !ai.c.on) { ai.t = [0.5, 0.32, 0.18][G.diff]; let best = null, bv = 1e9; for (const c of A.cs) { if (!c.on) continue; const d = Math.hypot(c.x - a.x, c.z - a.z) - (c.val > 1 ? 3 : 0) + c.y * 0.15 + rnd() * (1 - sk) * 4; let taken = 0; for (const o of A.acts) if (o !== a && Math.hypot(o.x - c.x, o.z - c.z) < d * 0.6) taken = 2; if (d + taken < bv) { bv = d + taken; best = c; } } ai.c = best; }
                if (ai.c) [ix, iz] = toward(a, ai.c.x, ai.c.z);
                for (const n of A.anv) if (n.st === 1 || n.st === 2) { const dx = a.x - n.x, dz = a.z - n.z, d = Math.hypot(dx, dz); if (d < 1.9 && rnd() < sk + 0.1) { ix = dx / (d || 1) * 1.5; iz = dz / (d || 1) * 1.5; } }
              }
            }
            walk(a, ix, iz, dt, 5.3 * (isBot(i) ? [0.86, 0.95, 1][G.diff] : 1), 12);
            a.x = clamp(a.x, -6.6, 6.6); a.z = clamp(a.z, -6.6, 6.6);
          });
          separate(A.acts, 0.95);
        },
        timeup(A) { const m = Math.max(...A.sc); A.win = m > 0 ? [0, 1, 2, 3].filter(i => A.sc[i] === m) : []; },
        lab: (A, i) => A.sc[i] + (A.sc[i] === 1 ? ' COIN' : ' COINS'),
        cam(A) { arenaCam(A, 0, 10.5, 10.5, 0, 0, 1); },
      };

      // ---------------------------------------------------------------- 4. BUMPER BASH (push everyone into the sea)
      MG.bumper = {
        n: 'BUMPER GRUMPS', col: '#3a9af0', song: 'mgB', time: 45,
        desc: 'BUMP EVERYBODY OFF THE DRUM INTO THE SEA. THE DRUM SHRINKS AS YOU GO!',
        ctl: [['stick', 'MOVE'], ['a', 'BARGE (A BIG SHOVE)']], goal: 'BE THE LAST ONE ON',
        icon(g, x, y) { g.fillStyle = '#2a8ad8'; g.fillRect(x - 14, y + 6, 28, 8); g.fillStyle = '#ff4a4a'; g.beginPath(); g.ellipse(x, y + 4, 12, 4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + 4, 7, 2.3, 0, 0, 7); g.fill(); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(x - 4, y - 3, 3, 0, 7); g.fill(); g.fillStyle = '#3ac04a'; g.beginPath(); g.arc(x + 6, y - 6, 3, 0, 7); g.fill(); },
        init(A) {
          const wt = waterTex(); wt.repeat.set(20, 20);
          const sea = new T.Mesh(new T.PlaneGeometry(200, 200), cmat('waterM', { map: wt, transparent: true, opacity: 0.9 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -1.6; A.g.add(sea); A.sea = wt;
          const top = ctex('drumTop', 128, 128, (g) => { const cols = ['#ff4a4a', '#ffffff', '#ff4a4a', '#ffffff', '#ffd23a', '#3a8ae8', '#ffd23a']; for (let k = 0; k < cols.length; k++) { g.fillStyle = cols[k]; g.beginPath(); g.arc(64, 64, 64 - k * 9, 0, 7); g.fill(); } g.fillStyle = '#fff'; starPath(g, 64, 66, 10, 4.5); g.fill(); });
          const side = ctex('drumSide', 64, 16, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffd23a' : '#2a5ad0'; g.fillRect(i * 8, 0, 8, 16); } g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 14, 64, 2); });
          side.repeat.set(6, 1);
          const plat = new T.Group(); A.g.add(plat); A.plat = plat;
          const cyl = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40), [cmat('drumS', { map: side }), cmat('drumT', { map: top }), cmat('drumS', {})]); cyl.position.y = -0.5; plat.add(cyl);
          const sk = new T.Mesh(new T.CylinderGeometry(0.85, 0.7, 3, 24), cmat('drumLeg', { color: 0x8a6a4a })); sk.position.y = -2.5; plat.add(sk);
          A.R0 = 6.6; A.R = A.R0; plat.scale.set(A.R, 1, A.R);
          const Q = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + 0.2, r = 13 + (k % 3) * 3; Q.push(pt(S.ball(0.6, 10), k % 2 ? 0xff4a4a : 0xffffff, Math.cos(a) * r, -1.4, Math.sin(a) * r)); Q.push(pt(S.cyl(0.08, 0.08, 1.2, 5), 0x888888, Math.cos(a) * r, -0.6, Math.sin(a) * r)); }
          for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; Q.push(pt(S.cone(9, 10, 8), 0x4a9a5a, Math.cos(a) * 60, 1, Math.sin(a) * 60)); }
          mgMesh(Q);
          A.acts.forEach((a, i) => { const ang = Math.PI / 4 + i * Math.PI / 2; a.x = Math.cos(ang) * 3.6; a.z = Math.sin(ang) * 3.6; a.ry = Math.atan2(-a.x, -a.z); });
          camTo(0, 10.5, 10.5, 0, -0.8, 0.8, 3, true);
        },
        tick(A, dt, live) {
          A.sea.offset.x += dt * 0.02;
          if (live) { if (A.t > 0 && A.tl < A.def.time - 15) A.R = Math.max(2.8, A.R - dt * 0.15); A.plat.scale.set(A.R, 1, A.R); }
          const sk = SK(), R = A.R;
          A.acts.forEach((a, i) => {
            if (a.out) return;
            if (A.done && !a.fall) { a.vx *= 0.85; a.vz *= 0.85; a.mv = 0; const r = Math.hypot(a.x, a.z); if (r > R - 0.4) { a.x *= (R - 0.4) / r; a.z *= (R - 0.4) / r; } return; }
            a.cd -= dt; a.dash -= dt;
            let ix = 0, iz = 0, dash = false;
            if (live && !a.fall) {
              const I = inp(i);
              if (I) { ix = I.x; iz = I.z; dash = I.a; }
              else {
                const ai = A.ai[i]; ai.t -= dt;
                if (ai.t <= 0 || !ai.tg || ai.tg.out) { ai.t = 0.6 + rnd() * 0.5; const others = A.acts.filter(o => o !== a && !o.out); ai.tg = others.sort((p, q) => (Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(p.x, p.z) * sk) - (Math.hypot(q.x - a.x, q.z - a.z) - Math.hypot(q.x, q.z) * sk))[0]; }
                const r = Math.hypot(a.x, a.z), margin = Math.min([1.0, 1.5, 1.9][G.diff], R * 0.28);
                if (r > R - margin) { ix = -a.x / r; iz = -a.z / r; if (rnd() < 0.02 * sk && a.cd <= 0) dash = true; }
                else if (ai.tg) {
                  const t = ai.tg, tr = Math.hypot(t.x, t.z) || 1, nx = t.x / tr, nz = t.z / tr;
                  const aimX = t.x - nx * 1.1 * sk, aimZ = t.z - nz * 1.1 * sk;
                  [ix, iz] = toward(a, aimX, aimZ);
                  const d = Math.hypot(t.x - a.x, t.z - a.z), face = Math.abs(wrapA(Math.atan2(t.x - a.x, t.z - a.z) - a.ry));
                  if (d < 2.8 && face < 0.5 && a.cd <= 0 && rnd() < 0.08 + sk * 0.12) dash = true;
                  if (rnd() < (1 - sk) * 0.3) { ix += (rnd() - 0.5) * 2; iz += (rnd() - 0.5) * 2; }
                }
              }
            }
            let m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; m = 1; }
            if (!a.fall) { a.vx += ix * 18 * dt; a.vz += iz * 18 * dt; }
            const dr = Math.exp(-3.2 * dt); a.vx *= dr; a.vz *= dr;
            if (dash && a.cd <= 0) { const fx = m > 0.2 ? ix : Math.sin(a.ry), fz = m > 0.2 ? iz : Math.cos(a.ry); a.vx += fx * 8; a.vz += fz * 8; a.cd = 1.1; a.dash = 0.32; squash(a, 5); a.lean = 0.5; if (i === 0) K.sfx.noise(0.18, 0.08, 1200, 0, 'bandpass', 400); }
            if (a.dash < 0) a.lean *= 0.9;
            a.x += a.vx * dt; a.z += a.vz * dt;
            const v = Math.hypot(a.vx, a.vz);
            if (m > 0.15) a.ry += wrapA(Math.atan2(ix, iz) - a.ry) * Math.min(1, dt * 12);
            a.mv = clamp(v / 5, 0, 1); a.walk += v * dt * 3;
            if (!a.fall && Math.hypot(a.x, a.z) > R + 0.15) { a.fall = true; if (i === 0) K.sfx.tone(600, 0.5, 'square', 0.06, 0, 150); bubble(P[i], pick(['WAAAH!', 'NOOOO!', 'SPLOSH!']), 1.4); }
            if (a.fall) { a.vy -= 22 * dt; a.y += a.vy * dt; a.gy = -1.6; if (a.y < -1.6) { a.out = true; A.out[i] = true; A.outT[i] = A.t; a.vis = false; puff(a.x, -1.5, a.z, [0xffffff, 0x8ad0ff, 0x4aa8f0], 30, { sp: 3, up: 7, life: 1 }); K.sfx.noise(0.5, 0.2, 1500, 0, 'lowpass', 300); } }
            else { a.y = 0; a.gy = 0; }
          });
          // bumps
          const L = A.acts;
          for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
            const a = L[i], b = L[j]; if (a.out || b.out || a.fall || b.fall) continue;
            const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
            if (d < 1.15 && d > 1e-4) {
              const nx = dx / d, nz = dz / d, o = (1.15 - d) / 2; a.x -= nx * o; a.z -= nz * o; b.x += nx * o; b.z += nz * o;
              const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
              if (rv < 0) {
                const jv = -1.45 * rv / 2; a.vx -= jv * nx; a.vz -= jv * nz; b.vx += jv * nx; b.vz += jv * nz;
                if (a.dash > 0) { b.vx += nx * 3.5; b.vz += nz * 3.5; } if (b.dash > 0) { a.vx -= nx * 3.5; a.vz -= nz * 3.5; }
                if (-rv > 2) { squash(a, 4); squash(b, 4); K.sfx.tone(220 + rnd() * 80, 0.1, 'square', 0.08, 0, 120); puff((a.x + b.x) / 2, 0.8, (a.z + b.z) / 2, [0xffffff, 0xffe04a], 5, { sp: 3, up: 2, life: 0.35 }); if (-rv > 6) SHAKE = 0.2; }
              }
            }
          }
          const left = L.filter(a => !a.out && !a.fall);
          if (live && !A.done && left.length <= 1) { if (left.length) A.win = [L.indexOf(left[0])]; else { const last = Math.max(...A.outT); A.win = [0, 1, 2, 3].filter(i => A.outT[i] >= last - 0.3); } A.done = true; }
        },
        timeup(A) { A.win = [0, 1, 2, 3].filter(i => !A.out[i] && !A.acts[i].fall); },
        lab: (A, i) => 'STILL ON',
        cam(A) { arenaCam(A, 0, 10.5, 10.5, 0, -0.8, 0.8); },
      };

      // ---------------------------------------------------------------- 5. QUICK DRAW (press A the moment the flag drops)
      MG.draw = {
        n: 'QUICK QUACK', col: '#e8502a', song: null, fog: 0xf0a868, fogN: 30, fogF: 110,
        desc: 'MC WOBBLE WILL DROP THE FLAG. HIT YOUR BUTTON THE MOMENT IT GOES DOWN. TOO EARLY IS A FOUL!',
        ctl: [['a', 'SLAM THE BUTTON']], goal: 'FIRST TO 3 POINTS', finWord: 'THAT\'S IT!',
        icon(g, x, y) { g.fillStyle = '#8a5a32'; g.fillRect(x - 1, y - 12, 2, 24); g.fillStyle = '#ff3a2a'; g.beginPath(); g.moveTo(x + 1, y - 12); g.lineTo(x + 13, y - 7); g.lineTo(x + 1, y - 2); g.fill(); g.fillStyle = '#ffd23a'; F.draw(g, '!', x - 10, y - 2, '#ffd23a', 2); },
        init(A) {
          const Q = [];
          const sand = new T.Mesh(new T.PlaneGeometry(120, 120), cmat('sand', { color: 0xe8b878 })); sand.rotation.x = -Math.PI / 2; A.g.add(sand);
          for (let k = 0; k < 7; k++) { const x = -40 + k * 13 + rnd() * 5, z = -38 - rnd() * 14, h = 6 + rnd() * 8, w = 6 + rnd() * 6; Q.push(pt(S.box(w, h, w * 0.7), 0xc86a3a, x, h / 2, z)); Q.push(pt(S.box(w + 0.6, 1, w * 0.7 + 0.6), 0xa8542a, x, h * 0.4, z)); Q.push(pt(S.box(w + 0.2, 0.6, w * 0.7 + 0.2), 0xe88a4a, x, h - 0.3, z)); }
          for (let k = 0; k < 9; k++) { const x = (rnd() - 0.5) * 34, z = -6 - rnd() * 18; if (Math.abs(x) < 6 && z > -10) continue; const s = 0.8 + rnd() * 0.6; Q.push(pt(S.cyl(0.3 * s, 0.35 * s, 2.4 * s, 8), 0x3a9a4a, x, 1.2 * s, z)); Q.push(pt(S.ball(0.3 * s, 8), 0x3a9a4a, x, 2.4 * s, z)); for (const sd of [-1, 1]) { Q.push(pt(S.cyl(0.18 * s, 0.18 * s, 0.6 * s, 6), 0x3a9a4a, x + sd * 0.5 * s, 1.2 * s, z, 0, 0, Math.PI / 2)); Q.push(pt(S.cyl(0.18 * s, 0.18 * s, 0.8 * s, 6), 0x3a9a4a, x + sd * 0.75 * s, 1.6 * s, z)); } }
          for (let k = 0; k < 14; k++) Q.push(pt(S.dod(0.3 + rnd() * 0.5), 0xb08a5a, (rnd() - 0.5) * 30, 0, -3 - rnd() * 16, rnd(), rnd(), 0, 1, 0.6, 1));
          A.btn = [];
          for (let i = 0; i < 4; i++) { const x = -3.9 + i * 2.6; Q.push(pt(S.cyl(0.55, 0.65, 0.8, 14), 0x4a4a5a, x, 0.4, -0.7)); Q.push(pt(S.cyl(0.62, 0.62, 0.08, 14), CHARS[P[i].ci].col, x, 0.82, -0.7));
            const dome = new T.Mesh(new T.SphereGeometry(0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), cmat('btnRed', { color: 0xff2a2a, emissive: 0x4a0000 })); dome.position.set(x, 0.85, -0.7); A.g.add(dome); A.btn.push(dome);
            const a = A.acts[i]; a.x = x; a.z = 0.5; a.ry = Math.PI; }
          mgMesh(Q);
          // MC WOBBLE with the flag
          A.host = actor('host', A.g); Object.assign(A.host, { x: 0, z: -4.2, y: 0, ry: 0, sc: 1.5 });
          const flag = new T.Group(); flag.position.set(1.15, 0.7, -3.9); A.g.add(flag);
          flag.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.6, 6), cmat('pole', { color: 0x8a5a32 }))); flag.children[0].position.y = 1.3;
          const cloth = new T.Mesh(new T.PlaneGeometry(1.2, 0.8, 4, 1), cmat('flagRed', { color: 0xff2a1a, side: T.DoubleSide, emissive: 0x3a0000 })); cloth.position.set(0.62, 2.2, 0); flag.add(cloth); A.flag = flag; A.cloth = cloth;
          A.qd = { round: 0, st: 'wait', t: 0, go: 0, fakes: [], press: [-1, -1, -1, -1], foul: [false, false, false, false], cpuR: [0, 0, 0, 0], last: -1, msg: '' };
          LT.hemi.color.set(0xffe0c0); LT.sun.color.set(0xffc890);
          camTo(0, 3.4, 8.2, 0, 1.6, -1.5, 3, true);
          this.newRound(A);
        },
        end() { LT.hemi.color.set(0xeef6ff); LT.sun.color.set(0xffffff); },
        newRound(A) {
          const q = A.qd; q.round++; q.st = 'wait'; q.t = 0; q.go = 1.6 + rnd() * 3; q.fakes = []; q.ft = -1;
          for (let k = 0; k < 2; k++) if (rnd() < 0.55) q.fakes.push(0.6 + rnd() * (q.go - 0.9));
          q.press = [-1, -1, -1, -1]; q.foul = [false, false, false, false];
          q.cpuR = [0, 1, 2, 3].map(() => Math.max(0.17, [0.4, 0.3, 0.235][G.diff] + (rnd() + rnd() + rnd() - 1.5) * 0.06));
          A.flag.rotation.z = 0; A.acts.forEach(a => { a.sad = 0; });
        },
        tick(A, dt, live) {
          const q = A.qd, h = A.host;
          pose(h, dt); h.y = 0;
          A.cloth.rotation.y = Math.sin(A.t * 5) * 0.2;
          A.btn.forEach((b, i) => { b.scale.y += (1 - b.scale.y) * Math.min(1, dt * 10); });
          if (!live) return;
          q.t += dt;
          const slam = i => { const a = A.acts[i]; a.vy = 5; squash(a, 5); A.btn[i].scale.y = 0.3; K.sfx.tone(180, 0.08, 'square', 0.08); };
          if (q.st === 'wait') {
            // a fake-out: a little twitch of the flag
            let twitch = 0; for (const f of q.fakes) if (q.t > f && q.t < f + 0.22) twitch = Math.sin((q.t - f) / 0.22 * Math.PI) * 0.35;
            A.flag.rotation.z = twitch; if (twitch > 0.3 && !q.tw) { q.tw = true; squash(h, 3); } if (twitch === 0) q.tw = false;
            for (let i = 0; i < 4; i++) {
              if (q.foul[i]) continue;
              const I = inp(i); let early = false;
              if (I) early = I.a;
              else { for (const f of q.fakes) if (Math.abs(q.t - f - 0.15) < dt / 2 && rnd() < [0.16, 0.07, 0.02][G.diff]) early = true; }
              if (early) { q.foul[i] = true; slam(i); A.acts[i].sad = 1; K.sfx.tone(140, 0.4, 'sawtooth', 0.08); bubble(P[i], 'OOPS! FOUL!', 1.3); }
            }
            if (q.t >= q.go) { q.st = 'go'; q.t = 0; K.sfx.noise(0.3, 0.25, 3000); K.sfx.tone(1047, 0.3, 'square', 0.1); }
          } else if (q.st === 'go') {
            A.flag.rotation.z = Math.min(1.5, A.flag.rotation.z + dt * 18);
            for (let i = 0; i < 4; i++) {
              if (q.foul[i] || q.press[i] >= 0) continue;
              const I = inp(i);
              if (I ? I.a : q.t >= q.cpuR[i]) { q.press[i] = q.t; slam(i); }
            }
            const live2 = [0, 1, 2, 3].filter(i => !q.foul[i]);
            if (live2.every(i => q.press[i] >= 0) || q.t > 1.3) {
              q.st = 'show'; q.t = 0;
              let w = -1, best = 9; for (const i of live2) if (q.press[i] >= 0 && q.press[i] < best) { best = q.press[i]; w = i; }
              q.last = w; if (w >= 0) { A.sc[w]++; puff(A.acts[w].x, 2, A.acts[w].z, [0xffd23a, 0xffffff], 16, { sp: 3, up: 4, life: 0.7 }); K.sfx.seq([[79, 0.25], [84, 0.5]], { bpm: 400, vol: 0.08 }); }
            }
          } else if (q.st === 'show') {
            const w = q.last; if (w >= 0) { const a = A.acts[w]; a.y = Math.abs(Math.sin(q.t * 6)) * 0.4; }
            if (q.t > 1.8) {
              const top = Math.max(...A.sc);
              if (top >= 3 || q.round >= 5) { A.win = top > 0 ? [0, 1, 2, 3].filter(i => A.sc[i] === top) : []; A.done = true; }
              else this.newRound(A);
            }
          }
          A.acts.forEach(a => { if (q.st !== 'show') { a.vy -= 24 * dt; a.y = Math.max(0, a.y + a.vy * dt); } });
        },
        lab: (A, i) => A.sc[i] + (A.sc[i] === 1 ? ' POINT' : ' POINTS'),
        hud(A) {
          const q = A.qd; if (A.phase !== 'play') return;
          ctr('ROUND ' + q.round, W / 2, 8, '#fff', 1);
          if (q.st === 'wait') ctr('WAIT FOR IT...', W / 2, 30, '#ffe6c0', 2);
          if (q.st === 'go' && (clock * 10 | 0) % 2) bigText('GO!!', W / 2, 30, 4, '#5af07a', 3, '#0a4a1a');
          for (let i = 0; i < 4; i++) {
            const a = A.acts[i], s = scr(a.x, 2.4, a.z);
            if (q.foul[i]) ctr('FOUL', s.x, s.y, '#ff5a4a', 1);
            else if (q.st === 'show' && q.press[i] >= 0) ctr(q.press[i].toFixed(3) + 'S', s.x, s.y, i === q.last ? '#ffd23a' : '#fff', 1);
            for (let k = 0; k < 3; k++) { H.fillStyle = k < A.sc[i] ? '#ffd23a' : 'rgba(0,0,0,.4)'; H.beginPath(); H.arc(s.x - 8 + k * 8, s.y + 12, 3, 0, 7); H.fill(); }
          }
        },
        cam(A) { arenaCam(A, 0, 3.4, 8.2, 0, 1.6, -1.5); },
      };

      // ---------------------------------------------------------------- 6. WOBBLE SAYS (copy the arrows)
      const DIRS = ['up', 'right', 'down', 'left'], DCOL = [0xff3a3a, 0x3a7aff, 0x3ad04a, 0xffd23a], DNOTE = [72, 76, 79, 67];
      MG.says = {
        n: 'WOBBLE SAYS', col: '#c84af0', song: null, fog: 0x1a0a3a, fogN: 25, fogF: 80, sky: false, bg: 0x140828,
        desc: 'WATCH THE ARROWS LIGHT UP, THEN COPY THEM IN THE SAME ORDER. ONE MISTAKE AND YOU\'RE OUT!',
        ctl: [['dpad', 'PRESS THE ARROWS IN ORDER']], goal: 'LAST ONE LEFT COPYING',
        icon(g, x, y) { const c = ['#ff3a3a', '#3a7aff', '#3ad04a', '#ffd23a']; [[0, -8], [8, 0], [0, 8], [-8, 0]].forEach(([dx, dy], i) => { g.fillStyle = c[i]; g.fillRect(x + dx - 4, y + dy - 4, 8, 8); }); },
        init(A) {
          const Q = [];
          const ft = ctex('disco', 64, 64, (g) => { const c = ['#ff4a8a', '#4a8aff', '#ffd23a', '#3ad04a', '#c84af0', '#ff8a2a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = c[(i * 3 + j * 2) % 6]; g.fillRect(i * 16, j * 16, 16, 16); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(i * 16, j * 16, 16, 2); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(i * 16, j * 16 + 14, 16, 2); } });
          ft.repeat.set(3, 2);
          const fl = new T.Mesh(new T.PlaneGeometry(16, 10), cmat('discoM', { map: ft, emissive: 0x1a1a2a })); fl.rotation.x = -Math.PI / 2; fl.position.z = 0; A.g.add(fl);
          Q.push(pt(S.box(16, 8, 0.4), 0x2a1a5a, 0, 4, -5.2));
          for (let k = 0; k < 12; k++) Q.push(pt(S.ball(0.12, 6), k % 2 ? 0xffd23a : 0xff8ad0, -7.5 + k * 1.36, 7.6, -5));
          for (let i = 0; i < 4; i++) { const x = -4.5 + i * 3; Q.push(pt(S.cyl(0.85, 0.95, 0.5, 16), 0x3a3a5a, x, 0.25, 2.2)); Q.push(pt(S.cyl(0.9, 0.9, 0.06, 16), CHARS[P[i].ci].col, x, 0.52, 2.2)); }
          // the mirror ball
          Q.push(pt(S.ico(0.7, 1), 0xd8e0f0, 4.8, 6.4, -2)); Q.push(pt(S.cyl(0.02, 0.02, 1.5, 4), 0x888888, 4.8, 7.6, -2));
          mgMesh(Q);
          const at = DIRS.map((d, k) => ctex('arr' + k, 32, 32, (g) => { g.fillStyle = '#fff'; g.translate(16, 16); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(0, -12); g.lineTo(11, 1); g.lineTo(4, 1); g.lineTo(4, 11); g.lineTo(-4, 11); g.lineTo(-4, 1); g.lineTo(-11, 1); g.closePath(); g.fill(); }));
          A.pads = DIRS.map((d, k) => {
            const pos = [[0, 5.6], [2, 3.7], [0, 1.8], [-2, 3.7]][k];
            const dim = cmat('padD' + k, { color: shade(DCOL[k], 0.35), map: at[k] }), lit = cmat('padL' + k, { color: DCOL[k], map: at[k], emissive: shade(DCOL[k], 0.8) });
            const m = new T.Mesh(new T.BoxGeometry(1.7, 1.7, 0.3), [dim, dim, dim, dim, dim, dim]); m.position.set(pos[0], pos[1], -4.9); A.g.add(m);
            return { m, dim, lit, on: 0 };
          });
          A.host = actor('host', A.g); Object.assign(A.host, { x: -4.4, z: -4, ry: 0.35, sc: 1.8 });
          A.acts.forEach((a, i) => { a.x = -4.5 + i * 3; a.z = 2.2; a.y = 0.55; a.gy = 0.55; a.ry = Math.PI; });
          A.ws = { len: 3, seq: [], st: 'show', k: 0, t: -0.6, prog: [0, 0, 0, 0], next: [0, 0, 0, 0], outR: [0, 0, 0, 0], round: 0, show: [-1, -1, -1, -1], showT: [0, 0, 0, 0] };
          for (let k = 0; k < 14; k++) A.ws.seq.push(ri(4));
          LT.hemi.intensity = 0.55;
          camTo(0, 4.4, 11.2, 0, 2.6, -1.6, 3, true);
        },
        end() { LT.hemi.intensity = 0.72; },
        tick(A, dt, live) {
          const w = A.ws, h = A.host;
          h.walk += dt * 6; h.mv = 0.4; pose(h, dt); h.y = Math.abs(Math.sin(A.t * 4)) * 0.2;
          A.pads.forEach(p => { p.on = Math.max(0, p.on - dt); const m = p.on > 0 ? p.lit : p.dim; if (p.m.material[4] !== m) p.m.material = [m, m, m, m, m, m]; p.m.scale.setScalar(1 + p.on * 0.15); });
          A.acts.forEach((a, i) => { if (!a.out) { a.y = 0.55; a.gy = 0.55; } w.showT[i] = Math.max(0, w.showT[i] - dt); });
          if (!live) return;
          const alive = [0, 1, 2, 3].filter(i => !A.out[i]);
          const fast = A.out[0] && !AUTO ? 1.8 : 1;
          w.t += dt * fast;
          const on = Math.max(0.26, 0.52 - w.len * 0.018), gap = 0.14;
          if (w.st === 'show') {
            const k = Math.floor(w.t / (on + gap));
            if (w.t >= 0 && k !== w.k && k < w.len) { w.k = k; const d = w.seq[k]; A.pads[d].on = on; K.sfx.tone(RoomNote(DNOTE[d]), on * 0.9, 'triangle', 0.1); squash(h, 3); }
            if (w.t > w.len * (on + gap) + 0.2) { w.st = 'input'; w.t = 0; w.prog = [0, 0, 0, 0]; w.next = [0, 1, 2, 3].map(() => [0.6, 0.48, 0.38][G.diff] * (0.7 + rnd() * 0.6)); K.sfx.tone(1047, 0.08, 'square', 0.05); }
          } else if (w.st === 'input') {
            const limit = 3 + w.len * 0.75;
            for (const i of alive) {
              if (w.prog[i] >= w.len) continue;
              let d = -1;
              const I = inp(i);
              if (I) d = I.u ? 0 : I.r ? 1 : I.d ? 2 : I.l ? 3 : -1;
              else { w.next[i] -= dt * fast; if (w.next[i] <= 0) { w.next[i] = [0.55, 0.42, 0.33][G.diff] * (0.7 + rnd() * 0.6); const pr = [0.93, 0.965, 0.985][G.diff] - 0.013 * (w.len - 3); d = rnd() < pr ? w.seq[w.prog[i]] : (w.seq[w.prog[i]] + 1 + ri(3)) % 4; } }
              if (d < 0) continue;
              w.show[i] = d; w.showT[i] = 0.35;
              if (d === w.seq[w.prog[i]]) { w.prog[i]++; squash(A.acts[i], 2.5); if (i === 0) K.sfx.tone(RoomNote(DNOTE[d]), 0.15, 'triangle', 0.09); if (w.prog[i] >= w.len && i === 0) K.sfx.seq([[84, 0.25], [88, 0.5]], { bpm: 400, vol: 0.07 }); }
              else { A.out[i] = true; A.acts[i].out = true; w.outR[i] = w.round + 1; A.outT[i] = A.t; A.acts[i].sad = 1; K.sfx.tone(110, 0.5, 'sawtooth', 0.09); bubble(P[i], pick(['OH NO!', 'WRONG ONE!', 'WHOOPS!']), 1.4); }
            }
            const still = [0, 1, 2, 3].filter(i => !A.out[i]);
            if (w.t > limit) for (const i of still) if (w.prog[i] < w.len) { A.out[i] = true; A.acts[i].out = true; w.outR[i] = w.round + 1; A.outT[i] = A.t; A.acts[i].sad = 1; K.sfx.tone(110, 0.5, 'sawtooth', 0.09); bubble(P[i], 'TOO SLOW!', 1.3); }
            if ([0, 1, 2, 3].every(i => A.out[i] || w.prog[i] >= w.len)) { w.st = 'judge'; w.t = 0; }
          } else if (w.st === 'judge') {
            if (w.t > 0.9) {
              w.round++;
              const left = [0, 1, 2, 3].filter(i => !A.out[i]);
              if (left.length <= 1 || w.len >= 14) { A.win = left.length ? left : [0, 1, 2, 3].filter(i => w.outR[i] === w.round); A.done = true; }
              else { w.len++; w.st = 'show'; w.t = -0.3; w.k = -1; }
            }
          }
        },
        lab: (A, i) => A.ws ? (A.ws.st === 'input' ? A.ws.prog[i] + '/' + A.ws.len : 'IN') : '',
        hud(A) {
          if (A.phase !== 'play') return; const w = A.ws;
          ctr(w.st === 'show' ? 'WATCH CAREFULLY...' : w.st === 'input' ? (A.out[0] ? 'YOU\'RE OUT! WATCH THE OTHERS' : 'NOW COPY IT!') : 'NEXT ROUND...', W / 2, 30, w.st === 'input' ? '#ffd23a' : '#fff', 1);
          ctr(w.len + ' ARROWS', W / 2, 42, '#c8b0ff', 1);
          for (let i = 0; i < 4; i++) {
            const a = A.acts[i], s = scr(a.x, 2.6, a.z);
            if (A.out[i]) { ctr('X', s.x, s.y - 8, '#ff4a4a', 2); continue; }
            if (w.st === 'input') for (let k = 0; k < w.len; k++) { H.fillStyle = k < w.prog[i] ? '#fff' : 'rgba(0,0,0,.45)'; H.fillRect(s.x - w.len * 2.5 + k * 5, s.y + 4, 4, 4); }
            if (w.showT[i] > 0 && w.show[i] >= 0) { const d = w.show[i]; H.save(); H.translate(s.x, s.y - 6); H.rotate(d * Math.PI / 2); H.fillStyle = hex(DCOL[d]); H.beginPath(); H.moveTo(0, -7); H.lineTo(7, 1); H.lineTo(2.5, 1); H.lineTo(2.5, 7); H.lineTo(-2.5, 7); H.lineTo(-2.5, 1); H.lineTo(-7, 1); H.closePath(); H.fill(); H.strokeStyle = '#fff'; H.stroke(); H.restore(); }
          }
        },
        cam(A) { arenaCam(A, 0, 4.4, 11.2, 0, 2.6, -1.6); },
      };
      const RoomNote = m => 440 * Math.pow(2, (m - 69) / 12);

      // ---------------------------------------------------------------- 7. PAINT PANIC (cover the floor in your colour)
      MG.paint = {
        n: 'PAINT PANIC', col: '#4ad0a8', song: 'mgC', time: 30,
        desc: 'RUN OVER THE FLOOR TO PAINT IT YOUR COLOUR. HOP FOR A BIG SPLAT! PAINT OVER THE OTHERS!',
        ctl: [['stick', 'RUN AND PAINT'], ['a', 'SPLAT HOP (BIG PATCH)']], goal: 'PAINT THE MOST FLOOR',
        icon(g, x, y) { const c = ['#ff4a4a', '#4a8aff', '#3ad04a', '#ffd23a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = c[(i * 7 + j * 3 + (i > 1 ? 1 : 0)) % 4]; g.fillRect(x - 12 + i * 6, y - 12 + j * 6, 6, 6); } },
        init(A) {
          const N = 12; A.N = N;
          const pos = new Float32Array(N * N * 18), nor = new Float32Array(N * N * 18), col = new Float32Array(N * N * 18);
          A.own = new Int8Array(N * N).fill(-1);
          let o = 0;
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const x0 = i - N / 2 + 0.03, x1 = i - N / 2 + 0.97, z0 = j - N / 2 + 0.03, z1 = j - N / 2 + 0.97;
            for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]) { pos[o] = x; pos[o + 1] = 0.02; pos[o + 2] = z; nor[o + 1] = 1; o += 3; }
          }
          const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
          A.fcol = g.attributes.color; A.floor = new T.Mesh(g, matV); A.g.add(A.floor);
          const c = new T.Color();
          A.paintTile = (k, who) => {
            A.own[k] = who; const i = k % N, j = (k / N) | 0, chk = (i + j) % 2 ? 0.9 : 1;
            c.set(who < 0 ? ((i + j) % 2 ? 0xd8d8e4 : 0xeaeaf2) : CHARS[P[who].ci].col); const f = who < 0 ? 1 : chk;
            for (let v = 0; v < 6; v++) A.fcol.setXYZ(k * 6 + v, c.r * f, c.g * f, c.b * f);
            A.fcol.needsUpdate = true;
          };
          for (let k = 0; k < N * N; k++) A.paintTile(k, -1);
          const base = new T.Mesh(new T.BoxGeometry(N + 0.4, 0.4, N + 0.4), cmat('paintBase', { color: 0x9a9ab0 })); base.position.y = -0.19; A.g.add(base);
          const Q = [];
          for (const [x, z, w, d] of [[0, -N / 2 - 0.4, N + 1.2, 0.4], [0, N / 2 + 0.4, N + 1.2, 0.4], [-N / 2 - 0.4, 0, 0.4, N + 1.2], [N / 2 + 0.4, 0, 0.4, N + 1.2]]) Q.push(pt(S.box(w, 0.7, d), 0xf4f4fa, x, 0.35, z));
          [[-7.6, -7.6, 0xff4a4a], [7.6, -7.6, 0x4a8aff], [-7.6, 7.6, 0x3ad04a], [7.6, 7.6, 0xffd23a]].forEach(([x, z, cc]) => { Q.push(pt(S.cyl(0.9, 0.8, 1.4, 14), 0xd8d8e0, x, 0.7, z)); Q.push(pt(S.cyl(0.82, 0.82, 0.06, 14), cc, x, 1.41, z)); for (let k = 0; k < 4; k++) Q.push(pt(S.box(0.18, 0.6, 0.06), cc, x + Math.cos(k * 1.6) * 0.86, 1.1, z + Math.sin(k * 1.6) * 0.86, 0, -k * 1.6, 0)); });
          const gt = grassTex(); gt.repeat.set(10, 10);
          const out = new T.Mesh(new T.PlaneGeometry(60, 60), cmat('grassM2', { map: gt })); out.rotation.x = -Math.PI / 2; out.position.y = -0.4; A.g.add(out);
          trees(Q, 16, 12, 18, -0.4);
          mgMesh(Q);
          A.cnt = [0, 0, 0, 0];
          const start = [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]];
          A.acts.forEach((a, i) => { a.x = start[i][0]; a.z = start[i][1]; a.ry = Math.atan2(-a.x, -a.z); });
          camTo(0, 10.6, 10, 0, 0, 0.9, 3, true);
        },
        tick(A, dt, live) {
          const N = A.N, tileK = (x, z) => { const i = Math.floor(x + N / 2), j = Math.floor(z + N / 2); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
          const paint = (k, i) => { if (k < 0 || A.own[k] === i) return 0; if (A.own[k] >= 0) A.cnt[A.own[k]]--; A.cnt[i]++; A.paintTile(k, i); return 1; };
          const sk = SK();
          A.acts.forEach((a, i) => {
            a.cd -= dt;
            let ix = 0, iz = 0, hopNow = false; const I = inp(i);
            if (live) {
              if (I) { ix = I.x; iz = I.z; hopNow = I.a; }
              else {
                const ai = A.ai[i]; ai.t -= dt;
                if (ai.t <= 0 || ai.tx == null || Math.hypot(ai.tx - a.x, ai.tz - a.z) < 0.6) {
                  ai.t = [0.75, 0.5, 0.32][G.diff];
                  let bv = -1e9;
                  for (let s = 0; s < 14; s++) { const k = ri(N * N), cx = k % N - N / 2 + 0.5, cz = ((k / N) | 0) - N / 2 + 0.5; let c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const kk = tileK(cx + di, cz + dj); if (kk >= 0 && A.own[kk] !== i) c += A.own[kk] >= 0 ? 1.3 * sk + 0.4 : 1; } const v = c - Math.hypot(cx - a.x, cz - a.z) * 0.55 + rnd() * (1.2 - sk) * 3; if (v > bv) { bv = v; ai.tx = cx; ai.tz = cz; } }
                }
                [ix, iz] = toward(a, ai.tx, ai.tz);
                if (a.cd <= 0) { let c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const kk = tileK(a.x + di, a.z + dj); if (kk >= 0 && A.own[kk] !== i) c++; } if (c >= [7, 5, 4][G.diff]) hopNow = true; }
              }
            }
            walk(a, ix, iz, dt, 5, 12);
            a.x = clamp(a.x, -N / 2 + 0.3, N / 2 - 0.3); a.z = clamp(a.z, -N / 2 + 0.3, N / 2 - 0.3);
            const ground = a.y <= 0.001;
            if (hopNow && ground && a.cd <= 0) { a.vy = 7.5; a.cd = 2.2; a.splat = true; squash(a, 5); if (i === 0) K.sfx.tone(320, 0.12, 'square', 0.06, 0, 640); }
            if (gravity(a, dt, 24) && a.splat) {
              a.splat = false; let n = 0;
              for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) n += paint(tileK(a.x + di, a.z + dj), i);
              puff(a.x, 0.2, a.z, [CHARS[P[i].ci].col, 0xffffff], 18, { sp: 4, up: 3, life: 0.5 });
              K.sfx.noise(0.18, i === 0 ? 0.12 : 0.05, 800, 0, 'lowpass', 200);
            }
            if (live && a.y < 0.3) paint(tileK(a.x, a.z), i);
          });
          separate(A.acts, 0.9);
        },
        timeup(A) { const m = Math.max(...A.cnt); A.win = [0, 1, 2, 3].filter(i => A.cnt[i] === m && m > 0); },
        lab: (A, i) => Math.round(A.cnt[i] / (A.N * A.N) * 100) + '%',
        hud(A) {
          if (A.phase !== 'play' && A.phase !== 'fin' && A.phase !== 'res') return;
          const tot = A.N * A.N; let x = 60; const w = W - 120;
          H.fillStyle = 'rgba(0,0,0,.5)'; H.fillRect(x - 1, 31, w + 2, 9);
          for (let i = 0; i < 4; i++) { const ww = A.cnt[i] / tot * w; H.fillStyle = CHARS[P[i].ci].css; H.fillRect(x, 32, ww, 7); x += ww; }
        },
        cam(A) { arenaCam(A, 0, 10.6, 10, 0, 0, 0.9); },
      };

      // ---------------------------------------------------------------- 8. KART DASH (two laps of the little oval)
      const KL = 36 + 12 * Math.PI, KS3 = 18 + 6 * Math.PI, KS4 = 36 + 6 * Math.PI;
      function kAt(s, out) {
        s = ((s % KL) + KL) % KL; out = out || {};
        if (s < 18) { out.x = -9 + s; out.z = 6; out.dx = 1; out.dz = 0; }
        else if (s < KS3) { const th = Math.PI / 2 - (s - 18) / 6; out.x = 9 + 6 * Math.cos(th); out.z = 6 * Math.sin(th); out.dx = Math.sin(th); out.dz = -Math.cos(th); }
        else if (s < KS4) { out.x = 9 - (s - KS3); out.z = -6; out.dx = -1; out.dz = 0; }
        else { const th = -Math.PI / 2 - (s - KS4) / 6; out.x = -9 + 6 * Math.cos(th); out.z = 6 * Math.sin(th); out.dx = Math.sin(th); out.dz = -Math.cos(th); }
        return out;
      }
      function kProj(x, z) {
        if (x >= -9 && x <= 9) return z > 0 ? { s: x + 9, lat: z - 6 } : { s: KS3 + (9 - x), lat: -6 - z };
        if (x > 9) { const th = Math.atan2(z, x - 9); return { s: 18 + (Math.PI / 2 - th) * 6, lat: Math.hypot(x - 9, z) - 6 }; }
        let th = Math.atan2(z, x + 9); if (th > 0) th -= Math.PI * 2; return { s: KS4 + (-Math.PI / 2 - th) * 6, lat: Math.hypot(x + 9, z) - 6 };
      }
      MG.kart = {
        n: 'DINKY DERBY', col: '#ff3a3a', song: 'mgA', time: 50, laps: 2,
        desc: 'TWO LAPS ROUND THE LITTLE OVAL. HOLD THE GAS, STEER, AND CUT THE CORNERS!',
        ctl: [['a', 'HOLD TO GO'], ['stick', 'STEER'], ['b', 'BRAKE']], goal: 'CROSS THE LINE FIRST',
        icon(g, x, y) { g.fillStyle = '#ff3a3a'; g.fillRect(x - 10, y - 3, 20, 7); g.fillStyle = '#ffd23a'; g.fillRect(x - 4, y - 8, 7, 5); g.fillStyle = '#222'; for (const dx of [-7, 7]) { g.beginPath(); g.arc(x + dx, y + 5, 3.5, 0, 7); g.fill(); } },
        init(A) {
          const gt = grassTex(); gt.repeat.set(16, 16);
          const gr = new T.Mesh(new T.PlaneGeometry(90, 90), cmat('grassM3', { map: gt })); gr.rotation.x = -Math.PI / 2; A.g.add(gr);
          // the road and kerbs as ribbons along the centre line
          const ribbon = (a, b, y, col, n) => { const pos = [], cols = [], c = new T.Color(), c2 = new T.Color(); const q = {}; for (let k = 0; k < n; k++) { const s0 = k / n * KL, s1 = (k + 1) / n * KL; const A0 = kAt(s0, {}), A1 = kAt(s1, {}); const P0a = [A0.x + A0.dz * a, A0.z - A0.dx * a], P0b = [A0.x + A0.dz * b, A0.z - A0.dx * b], P1a = [A1.x + A1.dz * a, A1.z - A1.dx * a], P1b = [A1.x + A1.dz * b, A1.z - A1.dx * b]; for (const p of [P0a, P1a, P1b, P0a, P1b, P0b]) pos.push(p[0], y, p[1]); c.set(typeof col === 'function' ? col(k) : col); for (let v = 0; v < 6; v++) cols.push(c.r, c.g, c.b); } void c2; void q; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); const m = new T.Mesh(g, cmat('ribbon', { vcol: true, side: T.DoubleSide })); A.g.add(m); return m; };
          ribbon(-2.7, 2.7, 0.02, k => (k % 2 ? 0x6a6a74 : 0x64646e), 96);
          ribbon(2.7, 3.3, 0.04, k => (k % 2 ? 0xffffff : 0xe8302a), 96);
          ribbon(-3.3, -2.7, 0.04, k => (k % 2 ? 0xffffff : 0xe8302a), 96);
          ribbon(-0.12, 0.12, 0.03, k => (k % 3 ? 0x64646e : 0xe8e8e8), 96);
          const chk = ctex('chk', 32, 8, (g) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 4, y * 4, 4, 4); } });
          const line = new T.Mesh(new T.PlaneGeometry(1, 5.4), cmat('chkM', { map: chk })); line.rotation.x = -Math.PI / 2; line.position.set(0, 0.05, 6); A.g.add(line);
          const Q = [];
          trees(Q, 5, 1.2, 2.2);
          for (let k = 0; k < 7; k++) { const x = -7.5 + k * 2.5; Q.push(pt(S.ico(0.9, 1), 0x3a9a3a, x, 0.7, 0, 0, 0, 0, 1, 0.8, 1)); }
          for (let k = 0; k < 26; k++) { const a = k / 26 * 6.28, r = 21 + rnd() * 6; Q.push(pt(S.cyl(0.22, 0.3, 1.4, 6), 0x8a5a32, Math.cos(a) * r, 0.7, Math.sin(a) * r * 0.75)); Q.push(pt(S.ico(1.2, 1), 0x3a9a3a, Math.cos(a) * r, 2, Math.sin(a) * r * 0.75)); }
          // grandstand and the start gantry
          Q.push(pt(S.box(16, 2.4, 3), 0x8a8aa0, 0, 1.2, 12)); Q.push(pt(S.box(16, 0.3, 3.6), 0xe8302a, 0, 4.4, 12)); for (const x of [-7.8, 7.8]) Q.push(pt(S.box(0.3, 4.4, 0.3), 0xdddddd, x, 2.2, 10.4));
          for (let k = 0; k < 28; k++) Q.push(pt(S.ball(0.3, 6), [0xff4a4a, 0x4a8aff, 0xffe14a, 0xffffff, 0x3ac04a][k % 5], -7 + k * 0.52, 2.8 + (k % 2) * 0.3, 11.6 + (k % 3) * 0.4));
          for (const z of [2.3, 9.7]) Q.push(pt(S.box(0.25, 3.8, 0.25), 0xffffff, 0, 1.9, z)); Q.push(pt(S.box(0.3, 0.6, 7.7), 0xe8302a, 0, 3.7, 6));
          mgMesh(Q);
          // the karts (each character sits in one)
          A.karts = A.acts.map((a, i) => {
            const c = CHARS[P[i].ci].col, g = new T.Group(); A.g.add(g);
            g.add(new T.Mesh(merge([pt(S.box(1.05,.24,1.6),shade(c,.7),0,.24,0),pt(S.ball(.5,12),c,0,.42,.38,0,0,0,1.12,.46,1.35),pt(S.box(.95,.2,.6),c,0,.44,-.57),pt(S.cyl(.08,.08,1.16,8),0x414455,0,.27,1.03,0,0,Math.PI/2),pt(S.cyl(.08,.08,1.12,8),0x414455,0,.25,-.93,0,0,Math.PI/2),pt(S.tor(.19,.035,5,12),0x363548,0,.83,.34,-.65),pt(S.cyl(.035,.035,.4,6),0xa4a7b8,0,.64,.46,-.65),pt(S.ball(.09,8),0xffedb4,-.35,.48,.94,0,0,0,1,.75,.6),pt(S.ball(.09,8),0xffedb4,.35,.48,.94,0,0,0,1,.75,.6),pt(S.box(.64,.12,.04),0xf18b66,0,.45,-.89), pt(S.box(0.9, 0.3, 0.2), 0x2a2a2a, 0, 0.55, -0.7), pt(S.box(1.3, 0.08, 0.3), shade(c, 0.6), 0, 0.72, -0.85), pt(S.cyl(0.08, 0.08, 0.3, 6), 0x888888, 0.3, 0.45, -0.95, Math.PI / 2, 0, 0)].concat([[-0.6, 0.6], [0.6, 0.6], [-0.62, -0.55], [0.62, -0.55]].flatMap(([x,z])=>[pt(S.cyl(.24,.24,.22,12),0x232332,x,.24,z,0,0,Math.PI/2),pt(S.cyl(.12,.12,.235,10),0xc4c9d7,x,.24,z,0,0,Math.PI/2),pt(S.cyl(.05,.05,.245,8),shade(c,.7),x,.24,z,0,0,Math.PI/2)])), true), matV));
            const s0 = 9 - 2.2 - (i >> 1) * 2.4, lat = (i % 2 ? 1.2 : -1.2), p = kAt(s0, {});
            a.x = p.x + p.dz * lat; a.z = p.z - p.dx * lat; a.ry = Math.atan2(p.dx, p.dz); a.sc = 0.78;
            return { g, v: 0, lap: 0, s: s0, prog: s0 - 9, done: false, ft: 0, lane: lat * 0.6 + (rnd() - 0.5), sv: 0 };
          });
          A.kq = {}; A.order = [];
          camTo(A.acts[0].x - 6 * Math.sin(A.acts[0].ry), 3.2, A.acts[0].z - 6 * Math.cos(A.acts[0].ry), A.acts[0].x, 0.8, A.acts[0].z, 3, true);
        },
        tick(A, dt, live) {
          const sk = SK(), q = A.kq;
          A.acts.forEach((a, i) => {
            const k = A.karts[i];
            let thr = 0, brk = 0, steer = 0;
            const I = inp(i);
            if (live && !k.done) {
              if (I) { thr = I.ah ? 1 : 0; brk = I.bh ? 1 : 0; steer = clamp(I.x, -1, 1); }
              else {
                const ahead = kAt(k.s + 4.5 + k.v * 0.15, q), tx = ahead.x + ahead.dz * k.lane, tz = ahead.z - ahead.dx * k.lane;
                const want = Math.atan2(tx - a.x, tz - a.z), df = wrapA(want - a.ry);
                steer = -clamp(df * 2.2, -1, 1);
                thr = k.v < 11.5 * [0.83, 0.91, 0.975][G.diff] ? 1 : 0;
                if (rnd() < 0.01) k.lane = clamp(k.lane + (rnd() - 0.5) * 1.5, -1.8, 1.8);
              }
            }
            if (k.done) thr = 0.4;
            k.v += thr ? (11.5 - k.v) * 0.9 * dt : -k.v * 0.8 * dt;
            if (brk) k.v = Math.max(0, k.v - 14 * dt);
            k.sv += (steer - k.sv) * Math.min(1, dt * 10);
            a.ry -= k.sv * 2.3 * clamp(k.v / 5, 0, 1) * dt;
            a.x += Math.sin(a.ry) * k.v * dt; a.z += Math.cos(a.ry) * k.v * dt;
            const pr = kProj(a.x, a.z);
            if (Math.abs(pr.lat) > 2.75) {
              // back to the edge of the road (the outside is (-dz, dx))
              const P2 = kAt(pr.s, {}), lat = Math.sign(pr.lat) * 2.75;
              a.x = P2.x - P2.dz * lat; a.z = P2.z + P2.dx * lat;
              if (k.v > 4) { k.v *= 0.94; if (i === 0 && rnd() < 0.3) K.sfx.noise(0.06, 0.06, 2000); puff(a.x, 0.3, a.z, [0xffd23a, 0xffffff], 1, { sp: 2, up: 2, life: 0.3 }); }
            }
            const ns = kProj(a.x, a.z).s; let d = ns - k.s; if (d < -KL / 2) d += KL; if (d > KL / 2) d -= KL; k.s = ns; k.prog += d;
            if (!k.done && k.prog >= KL * A.def.laps) { k.done = true; k.ft = A.t; A.order.push(i); if (A.order.length === 1 && live) { A.win = [i]; A.done = true; puff(a.x, 1.5, a.z, [0xffd23a, 0xffffff, 0xff4a4a], 30, { sp: 4, up: 5 }); } }
            const nl = Math.floor(k.prog / KL); if (nl > k.lap && nl < A.def.laps) { k.lap = nl; if (i === 0) { K.sfx.seq([[79, 0.5], [79, 0.5], [84, 1]], { bpm: 300, vol: 0.09 }); banner('FINAL LAP!', '', '#ffd23a', 1.2); } }
            k.g.position.set(a.x, 0, a.z); k.g.rotation.y = a.ry; a.y = 0.2; a.gy = 0; a.mv = 0;
          });
          // bumps
          const L = A.acts;
          for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a = L[i], b = L[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d < 1.3 && d > 1e-4) { const o = (1.3 - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * o; a.z -= nz * o; b.x += nx * o; b.z += nz * o; if ((i === 0 || j === 0) && rnd() < 0.2) K.sfx.noise(0.06, 0.08, 700); } }
          if (live && (frame % 6) === 0 && A.karts[0].v > 3) K.sfx.tone(70 + A.karts[0].v * 7, 0.11, 'sawtooth', 0.016);
        },
        timeup(A) { let b = -1e9, w = 0; A.karts.forEach((k, i) => { if (k.prog > b) { b = k.prog; w = i; } }); A.win = [w]; },
        lab(A, i) { const r = A.karts.map((k, j) => j).sort((x, y) => A.karts[y].prog - A.karts[x].prog).indexOf(i); return ORD[r]; },
        hud(A) {
          if (A.phase !== 'play') return;
          const k = A.karts[0]; panel(6, 4, 70, 22, { c1: '#2a2a6a', c2: '#0a0a2a' }); txt('LAP ' + Math.min(A.def.laps, k.lap + 1) + '/' + A.def.laps, 12, 11, '#fff');
          if (!isBot(0) && A.t < 6 && (clock * 3 | 0) % 2) ctr('HOLD ' + keyName('a') + ' TO GO!', W / 2, 40, '#ffd23a', 1);
        },
        cam(A, dt) {
          const a = A.acts[0];
          if (A.phase === 'card') { arenaCam(A, 0, 16, 22, 0, 0, 0); return; }
          camTo(a.x - Math.sin(a.ry) * 5.8, 3.1, a.z - Math.cos(a.ry) * 5.8, a.x + Math.sin(a.ry) * 3, 0.9, a.z + Math.cos(a.ry) * 3, A.phase === 'count' ? 3 : 6);
        },
      };

      // Shared construction kit for the new attractions. Floors have a solid skirt,
      // bevel-like cornices, feet, lamps and perimeter bunting; play rules remain local.
      function pavilion(A, theme, rails=true) {
        const palettes = {
          fair:[0x684776,0xf0c18a,0xef6e87,0xffcf67],sea:[0x225d85,0x8fcbd1,0x427da4,0xf2e7bc],
          keep:[0x3d315e,0x8d81a6,0x605273,0xe7b561],garden:[0x30694f,0x93bf68,0x5c8b53,0xe4d68d],ice:[0x427aab,0xc8e8ee,0x75b9d8,0xffffff]
        },c=palettes[theme]||palettes.fair,q=[];
        q.push(pt(S.box(17,1,13),c[0],0,-.55,0));q.push(pt(S.box(17.4,.2,13.4),c[3],0,-.14,0));q.push(pt(S.box(17,.14,13),c[1],0,-.04,0));
        for(let x=-8;x<8;x+=2)for(let z=-6;z<6;z+=2)q.push(pt(S.box(1.96,.025,1.96),(x+z)%4===0?c[1]:shade(c[1],.9),x+1,.045,z+1));
        for(const x of [-8,8])for(const z of [-6,6]){q.push(pt(S.cyl(.2,.28,3.4,8),c[0],x,1.7,z));q.push(pt(S.ball(.42,10),c[3],x,3.5,z));q.push(pt(S.cyl(.8,1,.35,12),c[0],x,-1.2,z));}
        if(rails){for(const x of [-8,8])q.push(pt(S.box(.17,.22,12),c[3],x,.8,0));q.push(pt(S.box(16,.22,.17),c[3],0,.8,-6));}
        q.push(pt(S.cyl(25,27,2,32),c[0],0,-2,-18));
        if(theme==='keep'){
          q.push(pt(S.box(24,4,2),0x706381,0,1,-18));
          for(const x of [-13,-5,5,13]){q.push(pt(S.cyl(1.6,1.9,7,12),0x80738f,x,2.5,-18));q.push(pt(S.cyl(1.9,1.9,.5,12),0xada0b6,x,6.1,-18));for(let k=0;k<6;k++){const a=k/6*Math.PI*2;q.push(pt(S.box(.55,.8,.55),0xada0b6,x+Math.sin(a)*1.55,6.7,-18+Math.cos(a)*1.55));}q.push(pt(S.box(.65,1.6,.1),0xffd782,x,3.4,-16.39));}
          for(let x=-11;x<12;x+=2)q.push(pt(S.box(1,.7,2.3),0xada0b6,x,3.3,-18));
        }else if(theme==='fair'){
          for(const x of [-12,-6,6,12]){q.push(pt(S.box(4,2.5,2.6),0xb67b61,x,.3,-16));q.push(pt(S.box(4.3,.3,3),0xf5d19c,x,1.7,-16));q.push(pt(S.cone(3.2,3,4),x<0?0xe57691:0x6c9ddc,x,3.3,-16,0,Math.PI/4));for(const side of [-1,1])q.push(pt(S.cyl(.09,.09,3,6),0xffd89a,x+side*1.7,2.2,-14.8));}
          q.push(pt(S.box(6,1.2,.5),0x6f5290,0,4.8,-17));for(const x of [-3.1,3.1])q.push(pt(S.cyl(.13,.13,6,6),0xe6c38b,x,2,-17));
        }else if(theme==='sea'){
          q.push(pt(S.cyl(2,2.8,1,16),0xd4bc8f,0,-.5,-17));q.push(pt(S.cyl(.9,1.5,7,16),0xf3e2b5,0,3,-17));q.push(pt(S.cyl(1.5,1.5,.35,16),0xc3565d,0,6.4,-17));q.push(pt(S.cyl(1.1,1.1,1.2,12),0x95cdda,0,7.1,-17));q.push(pt(S.cone(1.6,1.2,12),0xc3565d,0,8.3,-17));
          for(const x of [-15,-8,8,15])q.push(pt(S.ico(3,1),0x729caa,x,-.1,-18,0,.4,0,1,.65,1));
        }else if(theme==='ice'){
          for(let k=0;k<6;k++){const x=-16+k*6,h=4+(k%3);q.push(pt(S.ico(3,1),0x77b5d2,x,1,-19,0,k*.5,0,1,h/3,1));q.push(pt(S.ico(2.4,1),0xe5f4ef,x,2.3,-19,0,k*.5,0,1,h/4,1));}
        }else{
          for(let k=0;k<8;k++){const x=-18+k*5;q.push(pt(S.cyl(.25,.4,3.4,8),0x94664a,x,.5,-18));for(let j=-1;j<=1;j++)q.push(pt(S.ico(1.9,1),j?0x68a867:0x86bb6d,x+j*.8,2.6+(j===0?.5:0),-18,0,0,0,1,1.2,1));}
        }
        bunting(q,-8,8,4.8,-6,20);mgMesh(q);
        A.acts.forEach((a,i)=>{a.x=-4.5+i*3;a.z=3;a.y=a.gy=.08;a.ry=Math.PI;});
        camTo(0,13,17,0,.4,-.3,3,true);
      }
      function prop(A,parts,x=0,y=0,z=0){const m=new T.Mesh(merge(parts,true),matV);m.position.set(x,y,z);A.g.add(m);return m;}
      function arenaMove(A,i,dt,target,speed=4.6) {
        const a=A.acts[i],I=inp(i),v=I?[I.x,I.z]:toward(a,target[0],target[1],true);
        walk(a,v[0],v[1],dt,speed);a.x=clamp(a.x,-7,7);a.z=clamp(a.z,-5,5);return I;
      }
      function topScores(A){const max=Math.max(...A.sc);A.win=max>0?A.sc.map((s,i)=>s>=max-.001?i:-1).filter(i=>i>=0):[];}
      function teamWin(A,team){A.win=A.teams.map((t,i)=>t===team?i:-1).filter(i=>i>=0);}
      function attractionIcon(col,symbol){return(g,x,y)=>{g.fillStyle=col;rr(g,x-10,y-10,20,20,4);g.fill();g.strokeStyle='#fff';g.stroke();F.center(g,symbol,x,y-4,'#fff',1);};}
      function effect(a,col=0xffd23a){squash(a,4);puff(a.x,a.y+1,a.z,[col,0xffffff],12,{sp:2,up:3,life:.5});K.sfx.tone(660,.08,'triangle',.05);}
      const scoreLabel=(A,i)=>Math.floor(A.sc[i])+' PTS';

      MG.rope={n:'ROPE NOPE',col:'#e7a54b',song:'mgA',time:30,
        desc:'THE SKIPPING ROPE HAS HAD TOO MUCH FIZZY POP. JUMP AS IT REACHES YOUR FEET! THREE HITS AND YOU ARE OUT.',
        ctl:[['a','JUMP THE ROPE']],goal:'SURVIVE THE LONGEST',icon:attractionIcon('#dc8141','J'),
        init(A){pavilion(A,'garden',false);A.rope=prop(A,[pt(S.cyl(.1,.1,14,8),0xef6b45,0,0,0,0,0,Math.PI/2),pt(S.ball(.3,8),0xffcf67,-7,0,0),pt(S.ball(.3,8),0xffcf67,7,0,0)]);A.angle=-3;A.hits=[0,0,0,0];A.cool=[0,0,0,0];A.acts.forEach((a,i)=>{a.x=-4.5+i*3;a.z=0;});},
        tick(A,dt,live){if(!live)return;A.angle+=dt*(1.8+(30-A.tl)*.07);const y=2.1+Math.sin(A.angle)*2.1,z=Math.cos(A.angle)*2.1;A.rope.position.set(0,y,z);
          A.acts.forEach((a,i)=>{if(A.out[i])return;A.cool[i]-=dt;const I=inp(i);if((I?I.a:Math.sin(A.angle)<-.7&&Math.cos(A.angle)<.3&&Math.cos(A.angle)>-.8&&a.y<=.1&&rnd()<SK()*.14)&&a.y<=.1)a.vy=8;
            gravity(a,dt);if(y<.65&&Math.abs(z)<.6&&a.y<.7&&A.cool[i]<=0){A.hits[i]++;A.cool[i]=1;effect(a,0xff6a5a);a.sad=.4;if(A.hits[i]>=3){A.out[i]=true;A.outT[i]=30-A.tl;}}else a.sad*=.95;A.sc[i]=30-A.tl;
          });const left=A.out.map((o,i)=>o?-1:i).filter(i=>i>=0);if(left.length<=1){const last=Math.max(...A.outT);A.win=left.length?left:[0,1,2,3].filter(i=>A.outT[i]===last);A.done=true;}},
        timeup(A){A.win=A.hits.map((h,i)=>h===Math.min(...A.hits)?i:-1).filter(i=>i>=0);},lab:(A,i)=>(3-A.hits[i])+' HEARTS',cam:A=>arenaCam(A,0,7,13,0,1,0)};

      MG.redlight={n:'GOOSE ON GUARD',col:'#74b356',song:'mgC',time:35,
        desc:'REACH THE PICNIC WHILE THE GOOSE LOOKS AWAY. WHEN ITS EYES FLASH RED, LET GO OF THE STICK. HONK MEANS BACK!',
        ctl:[['stick','MOVE WHILE GREEN']],goal:'REACH THE PICNIC FIRST',icon:attractionIcon('#5d9c4c','!'),
        init(A){pavilion(A,'garden');A.signal=0;A.switch=2;A.go=true;A.acts.forEach((a,i)=>{a.x=-4.5+i*3;a.z=5;});A.goose=prop(A,[pt(S.ball(.8,12),0xffffff,0,1,0,0,0,0,1,.9,1.4),pt(S.cyl(.22,.3,1.2,10),0xffffff,0,1.9,-.5),pt(S.ball(.4,10),0xffffff,0,2.5,-.5),pt(S.cone(.25,.7,4),0xf8aa37,0,2.45,-1,Math.PI/2),pt(S.ball(.09,8),0x191d30,.3,2.6,-.65)],0,0,-5.2);},
        tick(A,dt,live){if(!live)return;A.switch-=dt;if(A.switch<=0){A.go=!A.go;A.signal=0;A.switch=A.go?1+rnd()*1.6:1+rnd();K.sfx.tone(A.go?880:190,.15,'square',.05);}A.signal+=dt;A.goose.rotation.y=A.go?Math.PI:0;
          A.acts.forEach((a,i)=>{const I=inp(i),move=I?I.z:A.go||A.signal<[.3,.2,.12][G.diff]?-1:0;
            if(A.go){a.z=clamp(a.z+move*dt*3.6,-4.4,5);a.walk+=Math.abs(move)*dt*10;a.mv=Math.abs(move);}else if(Math.abs(move)>.2&&A.signal>.22){a.z=Math.min(5,a.z+2.3);a.mv=0;effect(a,0xff7057);}else a.mv=0;A.sc[i]=5-a.z;if(a.z<=-4.3){A.win=[i];A.done=true;}});},
        timeup:topScores,lab:(A,i)=>Math.floor(A.sc[i]*10)+' CM',hud(A){if(A.phase==='play')bigText(A.go?'GO!':'FREEZE!',160,10,2,A.go?'#a6ff86':'#ff9b7d',2);},cam:A=>arenaCam(A,0,12,16,0,0,0)};

      MG.stack={n:'CRATE EXPECTATIONS',col:'#c99155',song:'mgC',time:30,
        desc:'A CRATE SWINGS ABOVE YOUR TOWER. PRESS TO DROP IT OVER THE LAST CRATE. OVERHANGS MAKE THE NEXT LANDING NARROWER.',
        ctl:[['a','DROP THE SWINGING CRATE']],goal:'BUILD THE TALLEST TOWER',icon:attractionIcon('#b27e48','[]'),
        init(A){pavilion(A,'fair');A.crates=[];A.width=[1.8,1.8,1.8,1.8];A.offset=[0,0,0,0];A.cd=[0,0,0,0];A.acts.forEach((a,i)=>{a.x=-5.4+i*3.6;a.z=2.9;const mesh=prop(A,[pt(S.box(1.8,.5,1.5),CHARS[P[i].ci].col,0,0,0)]);A.crates.push(mesh);});},
        tick(A,dt,live){A.crates.forEach((m,i)=>{const x=-5.4+i*3.6,phase=A.t*(1.6+A.sc[i]*.08)+i,off=Math.sin(phase)*1.35;m.position.set(x+off,1+A.sc[i]*.45,-1);m.scale.x=A.width[i]/1.8;if(!live||A.out[i])return;A.cd[i]-=dt;const I=inp(i),drop=I?I.a:Math.abs(off-A.offset[i])<[.2,.14,.08][G.diff]&&A.cd[i]<0;
            if(drop&&A.cd[i]<=0){const overlap=Math.max(0,A.width[i]-Math.abs(off-A.offset[i]));A.cd[i]=.4;if(overlap<.25){A.out[i]=true;A.acts[i].sad=1;return;}prop(A,[pt(S.box(overlap,.45,1.5),CHARS[P[i].ci].col,0,0,0),pt(S.box(overlap+.04,.06,1.55),0xf2d49c,0,.23,0)],x+(off+A.offset[i])/2,.3+A.sc[i]*.45,-1);A.width[i]=overlap;A.offset[i]=off;A.sc[i]++;effect(A.acts[i]);}});
          if(live&&A.out.every(Boolean)){topScores(A);A.done=true;}},timeup:topScores,lab:(A,i)=>A.sc[i]+' CRATES',cam:A=>{const top=Math.max(...A.sc);arenaCam(A,0,9+top*.22,16+top*.12,0,2+top*.17,-1);}};

      MG.curling={n:'CRUMB CURLING',col:'#78b8d8',song:'mgC',time:40,
        desc:'THREE BISCUITS. AIM LEFT OR RIGHT. HOLD TO CHARGE, THEN RELEASE. LAND CLOSE TO THE JAM DOT WITHOUT SLIDING PAST IT!',
        ctl:[['stick','AIM'],['a','HOLD AND RELEASE TO SLIDE']],goal:'CLOSEST BISCUIT WINS',icon:attractionIcon('#72a8cf','O'),
        init(A){pavilion(A,'ice');A.shots=[0,0,0,0];A.power=[0,0,0,0];A.was=[false,false,false,false];A.stones=[];A.aim=[0,0,0,0];A.best=[99,99,99,99];prop(A,[pt(S.cyl(1.4,1.4,.035,24),0xe6b6c7,0,.1,-3),pt(S.cyl(.65,.65,.04,20),0xb44b6b,0,.13,-3)]);},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{if(A.shots[i]>=3)return;const I=inp(i);A.aim[i]=clamp(A.aim[i]+(I?I.x:0)*dt*1.5,-1.4,1.4);const held=I?I.ah:A.power[i]<[.6,.68,.72][G.diff]+(i-2)*.015;A.power[i]=held?Math.min(1,A.power[i]+dt*.65):A.power[i];if(A.was[i]&&!held){const x=-4.5+i*3,power=A.power[i],angle=A.aim[i]+(isBot(i)?Math.atan2(-x,8):0),m=prop(A,[pt(S.cyl(.42,.48,.22,12),0xdca36d,0,0,0),pt(S.ball(.13,8),CHARS[P[i].ci].col,0,.15,0)],x,.2,4.2);A.stones.push({m,i,x,z:4.2,vx:Math.sin(angle)*(3+power*9),vz:-Math.cos(angle)*(3+power*9),settled:false});A.shots[i]++;A.power[i]=0;effect(a);}A.was[i]=held;});
          A.stones.forEach(s=>{if(s.settled)return;s.x+=s.vx*dt;s.z+=s.vz*dt;s.vx*=Math.exp(-dt*1.8);s.vz*=Math.exp(-dt*1.8);s.m.position.set(s.x,.2,s.z);s.m.rotation.y+=dt*Math.hypot(s.vx,s.vz);if(Math.hypot(s.vx,s.vz)<.12){s.settled=true;A.best[s.i]=Math.min(A.best[s.i],Math.hypot(s.x,s.z+3));A.sc[s.i]=Math.max(0,100-Math.floor(A.best[s.i]*10));}});
          if(A.shots.every(n=>n===3)&&A.stones.every(s=>s.settled)){topScores(A);A.done=true;}},timeup:topScores,lab:(A,i)=>A.shots[i]+'/3 '+Math.round(A.power[i]*100)+'%',cam:A=>arenaCam(A,0,15,13,0,0,0)};

      MG.lamp={n:'LIMELIGHT LOAFERS',col:'#dcb763',song:'mgC',time:30,
        desc:'STAY INSIDE THE MOVING POOL OF LIGHT. EVERY SECOND IN THE SPOTLIGHT SCORES. ELBOWS ARE STRICTLY ENCOURAGED.',
        ctl:[['stick','CHASE THE SPOTLIGHT'],['a','SHOVE']],goal:'MOST TIME IN THE LIGHT',icon:attractionIcon('#bba15b','*'),
        init(A){pavilion(A,'keep');A.light=prop(A,[pt(S.cyl(2.2,2.2,.035,32),0xfbe8a0,0,.1,0)]);A.cd=[0,0,0,0];},
        tick(A,dt,live){const x=Math.sin(A.t*.66)*4.4,z=Math.sin(A.t*.91)*3;A.light.position.set(x,0,z);if(!live)return;A.acts.forEach((a,i)=>{const I=arenaMove(A,i,dt,[x,z]);A.cd[i]-=dt;if(Math.hypot(a.x-x,a.z-z)<2.1)A.sc[i]+=dt;if((I?I.a:rnd()<.008*SK())&&A.cd[i]<=0){A.cd[i]=1;A.acts.forEach((b,j)=>{if(i===j)return;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;if(d<2){b.vx+=dx/d*8;b.vz+=dz/d*8;effect(b);}});}});separate(A.acts,1);},timeup:topScores,lab:(A,i)=>A.sc[i].toFixed(1)+' SEC',cam:A=>arenaCam(A,0,13,16,0,0,0)};

      MG.parcel={n:'PASS THE PARCEL',col:'#e98356',song:'mgB',time:55,
        desc:'THIS PRESENT TICKS. CARRY IT CLOSE TO A RIVAL AND PRESS TO PASS. WHEN IT POPS, THE HOLDER IS OUT. KEEP YOUR DISTANCE!',
        ctl:[['stick','MOVE'],['a','PASS TO A NEARBY RIVAL']],goal:'BE THE LAST ONE LEFT',icon:attractionIcon('#d87652','?'),
        init(A){pavilion(A,'fair');A.holder=0;A.fuse=5;A.passCD=0;A.box=prop(A,[pt(S.box(.7,.7,.7),0xd34f71,0,0,0),pt(S.box(.73,.14,.73),0xffdb66,0,.12,0),pt(S.box(.14,.73,.73),0xffdb66,0,0,0),pt(S.ball(.15,8),0xffa955,0,.5,0)]);},
        tick(A,dt,live){const holder=A.acts[A.holder];A.box.position.set(holder.x,holder.y+2,holder.z);A.box.rotation.y+=dt*4;if(!live)return;A.passCD-=dt;A.fuse-=dt;
          A.acts.forEach((a,i)=>{if(A.out[i])return;const others=A.acts.map((b,j)=>({b,j,d:Math.hypot(a.x-b.x,a.z-b.z)})).filter(o=>o.j!==i&&!A.out[o.j]).sort((p,q)=>p.d-q.d),nearest=others[0];if(!nearest)return;const carrying=A.holder===i,t=carrying?[nearest.b.x,nearest.b.z]:[clamp(a.x+(a.x-holder.x)*2,-6,6),clamp(a.z+(a.z-holder.z)*2,-4,4)];const I=arenaMove(A,i,dt,t,carrying?5.2:4.5);
            if(carrying&&nearest.d<2.2&&A.passCD<=0&&(I?I.a:rnd()<SK()*.12)){A.holder=nearest.j;A.passCD=.9;effect(a);}
          });separate(A.acts,1);
          if(A.fuse<=0){A.out[A.holder]=true;A.sc[A.holder]=55-A.tl;holder.sad=1;effect(holder,0xe06591);const left=[0,1,2,3].filter(i=>!A.out[i]);if(left.length<=1){A.win=left;A.done=true;}else{A.holder=pick(left);A.fuse=4+rnd()*2;A.passCD=1;}}},
        timeup(A){A.win=[0,1,2,3].filter(i=>!A.out[i]);},lab:(A,i)=>A.out[i]?'POPPED':A.holder===i?'PASS IT!':'KEEP AWAY',hud(A){if(A.phase==='play')ctr('FUSE '+Math.ceil(A.fuse),160,9,A.fuse<2?'#ff8d76':'#ffe6a1',2);},cam:A=>arenaCam(A,0,13,16,0,.5,0)};

      MG.delivery={n:'DIZZY DELIVERY',col:'#d69cba',song:'mgA',time:40,
        desc:'COLLECT A JELLY FROM THE BACK COUNTER AND CARRY IT TO YOUR COLOURED MAT. MOVING TOO FAST SPILLS IT! HOLD THE BUTTON TO STEADY IT.',
        ctl:[['stick','CARRY A JELLY HOME'],['a','HOLD TO STEADY / WALK SLOWLY']],goal:'DELIVER THREE JELLIES',icon:attractionIcon('#c984a4','3'),
        init(A){pavilion(A,'fair');A.load=[false,false,false,false];A.wobble=[0,0,0,0];A.jellies=[];for(let i=0;i<4;i++){const x=-5.4+i*3.6;prop(A,[pt(S.box(2,.12,1.4),CHARS[P[i].ci].col,x,.14,4.7),pt(S.box(2.2,1.4,1.2),0x8b5c69,x,.7,-4.7),pt(S.box(2.3,.13,1.3),0xf3d3b4,x,1.46,-4.7)]);A.jellies.push(prop(A,[pt(S.cyl(.26,.38,.5,12),0x83d47d,0,0,0),pt(S.ball(.28,10),0x83d47d,0,.23,0)]));}},
        tick(A,dt,live){A.acts.forEach((a,i)=>{const m=A.jellies[i];m.visible=A.load[i];m.position.set(a.x,a.y+1.8,a.z-.2);m.rotation.z=Math.sin(A.t*9)*A.wobble[i]*.4;if(!live)return;const x=-5.4+i*3.6,I=inp(i),steady=I?I.ah:A.load[i],target=[x,A.load[i]?4.5:-4.3],v=I?[I.x,I.z]:toward(a,...target);walk(a,v[0],v[1],dt,steady?2.8:5.8);a.x=clamp(a.x,-7,7);a.z=clamp(a.z,-4.3,4.7);
            if(!A.load[i]&&a.z<-3.8&&Math.abs(a.x-x)<1.1){A.load[i]=true;A.wobble[i]=0;effect(a);}
            if(A.load[i]){A.wobble[i]=Math.max(0,A.wobble[i]+dt*(steady?-.7:Math.hypot(a.vx,a.vz)>.5?1.2:-.8));if(A.wobble[i]>1){A.load[i]=false;effect(a,0x77bb70);}else if(a.z>3.9&&Math.abs(a.x-x)<1.1){A.sc[i]++;A.load[i]=false;effect(a);if(A.sc[i]>=3){A.win=[i];A.done=true;}}}});separate(A.acts,.9);},timeup:topScores,lab:(A,i)=>A.sc[i]+'/3 '+(A.load[i]?'JELLY':'EMPTY'),cam:A=>arenaCam(A,0,14,16,0,.5,0)};

      MG.bridge={n:'PLANK YOU VERY MUCH',col:'#e2b66b',song:'mgB',time:40,
        desc:'CROSS THE ZIGZAG PLANK WITHOUT FALLING IN THE CUSTARD. SLOW DOWN AT CORNERS. IF YOU FALL, YOU RETURN TO YOUR LAST FLAG.',
        ctl:[['stick','WALK THE PLANK']],goal:'REACH THE FAR FLAG',icon:attractionIcon('#b89155','/'),
        init(A){pavilion(A,'sea',false);prop(A,[pt(S.box(16.8,.12,12.8),0xe5c675,0,.12,0)]);A.progress=[0,0,0,0];A.fall=[0,0,0,0];A.route=[[0,5],[0,2.4],[3,2.4],[3,-.4],[-2,-.4],[-2,-4.7]];const q=[];for(let i=0;i<A.route.length-1;i++){const [x,z]=A.route[i],[xx,zz]=A.route[i+1];q.push(pt(S.box(Math.abs(xx-x)+1.4,.3,Math.abs(zz-z)+1.4),0xd4a672,(x+xx)/2,.3,(z+zz)/2));}mgMesh(q);A.acts.forEach((a,i)=>{a.x=(i-1.5)*.3;a.z=5;a.y=a.gy=.46;});},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{if(A.fall[i]>0){A.fall[i]-=dt;a.y=-Math.sin(A.fall[i]*Math.PI)*1.2;if(A.fall[i]<=0){const p=A.route[A.progress[i]];a.x=p[0];a.z=p[1];a.vx=a.vz=0;a.y=.46;}return;}const dest=A.route[Math.min(A.route.length-1,A.progress[i]+1)],I=inp(i),v=I?[I.x,I.z]:toward(a,...dest,true);walk(a,v[0],v[1],dt,I?3.6:2.4+SK());let best=99;for(let k=0;k<A.route.length-1;k++){const [x,z]=A.route[k],[xx,zz]=A.route[k+1],vx=xx-x,vz=zz-z,t=clamp(((a.x-x)*vx+(a.z-z)*vz)/(vx*vx+vz*vz),0,1);best=Math.min(best,Math.hypot(a.x-x-vx*t,a.z-z-vz*t));}if(best>.7){A.fall[i]=1;effect(a,0xf9db70);}else if(Math.hypot(a.x-dest[0],a.z-dest[1])<.5){A.progress[i]++;A.sc[i]=A.progress[i];effect(a);if(A.progress[i]>=A.route.length-1){A.win=[i];A.done=true;}}});},timeup:topScores,lab:(A,i)=>A.progress[i]+'/5 FLAGS',cam:A=>arenaCam(A,0,17,14,0,.5,0)};

      // Team attractions have actual shared objectives and asymmetric roles.
      MG.tide={n:'BARREL OF LAUGHS',team:'1 V 3',col:'#69b4d4',song:'mgB',time:30,
        desc:'ONE PLAYER STEERS A BARREL LAUNCHER. THE OTHER THREE DODGE ON THE DECK. HIT ALL THREE BEFORE THE BELL. THE CREW WINS IF ANYONE SURVIVES.',
        ctl:[['stick','SOLO: AIM / CREW: DODGE'],['a','SOLO: LAUNCH A BARREL']],goal:'SOLO HITS ALL / CREW SURVIVES',icon:attractionIcon('#498aaa','O'),
        init(A){pavilion(A,'sea');A.solo=0;A.shots=[];A.fire=0;A.acts[0].z=-4.5;A.acts.slice(1).forEach((a,i)=>{a.x=-4+i*4;a.z=3;});prop(A,[pt(S.box(16,.5,.5),0x856b4b,0,.25,-2.8)]);},
        tick(A,dt,live){if(!live)return;A.fire-=dt;const a=A.acts[0],I=inp(0);a.x=clamp(a.x+(I?I.x:Math.sin(A.t*1.8))*dt*5,-6,6);
          if(A.fire<=0&&(I?I.a:true)){A.fire=.7;const m=prop(A,[pt(S.cyl(.5,.5,.9,10),0xa57a49,0,0,0,Math.PI/2),pt(S.tor(.51,.06,4,10),0xdac89b,0,0,.35),pt(S.tor(.51,.06,4,10),0xdac89b,0,0,-.35)],a.x,.55,-2.1);A.shots.push({m,x:a.x,z:-2.1});}
          for(let i=1;i<4;i++){if(A.out[i])continue;const b=A.acts[i],near=A.shots.filter(s=>s.z<b.z&&s.z>b.z-4).sort((s,t)=>Math.abs(s.x-b.x)-Math.abs(t.x-b.x))[0],target=near?[clamp(b.x+(b.x<near.x?-3:3),-6,6),3]:[Math.sin(A.t+i)*5,3];arenaMove(A,i,dt,target,3.4);b.z=clamp(b.z,-1,4.8);}
          A.shots=A.shots.filter(s=>{s.z+=dt*6;s.m.position.z=s.z;s.m.rotation.x+=dt*7;for(let i=1;i<4;i++)if(!A.out[i]&&Math.hypot(s.x-A.acts[i].x,s.z-A.acts[i].z)<.9){A.out[i]=true;A.acts[i].sad=1;effect(A.acts[i],0x8ed4ed);s.z=10;}if(s.z>6){s.m.visible=false;return false;}return true;});if(A.out.slice(1).every(Boolean)){A.win=[0];A.done=true;}},timeup(A){A.win=A.out.slice(1).every(Boolean)?[0]:[1,2,3];},lab:(A,i)=>i===0?'LAUNCHER':A.out[i]?'SOAKED':'DODGE!',cam:A=>arenaCam(A,0,15,15,0,.5,0)};

      MG.net={n:'NET PROFIT',team:'2 V 2',col:'#5aabc6',song:'mgA',time:30,
        desc:'TWO PLAYERS CARRY EACH NET. STAY CLOSE ENOUGH TO KEEP IT OPEN. CATCH GOLDEN FISH AND AVOID THE OLD BOOTS. EACH PAIR SHARES A SCORE.',
        ctl:[['stick','MOVE YOUR END OF THE NET']],goal:'CATCH THE MOST FISH AS A PAIR',icon:attractionIcon('#478ba6','#'),
        init(A){pavilion(A,'sea');A.teams=[0,0,1,1];A.catch=[0,0];A.fish=[];A.spawn=0;A.nets=[0,1].map(t=>prop(A,[pt(S.box(3,.12,1.5),t?0xee93b7:0x74b6ec,0,0,0),pt(S.box(3.1,.12,.12),0xf4dab0,0,.1,.75),pt(S.box(3.1,.12,.12),0xf4dab0,0,.1,-.75)]));A.acts.forEach((a,i)=>{a.x=(i%2?1.5:-1.5)+(i<2?-3.5:3.5);a.z=2;});},
        tick(A,dt,live){if(!live)return;A.spawn-=dt;if(A.spawn<=0){A.spawn=.5;const bad=rnd()<.2,x=(rnd()-.5)*13,z=(rnd()-.5)*8,m=prop(A,[pt(bad?S.box(.6,.4,1):S.ball(.4,8),bad?0x63514c:0xffcb5c,0,0,0),pt(S.cone(.3,.4,4),bad?0x63514c:0xef9d4c,0,0,-.5,Math.PI/2)],x,7,z);A.fish.push({x,z,y:7,m,bad});}
          for(let t=0;t<2;t++){const list=A.fish.filter(f=>f.y>1&&(!f.bad||SK()<.65)).sort((a,b)=>Math.hypot(a.x-A.acts[t*2].x,a.z-A.acts[t*2].z)-Math.hypot(b.x-A.acts[t*2].x,b.z-A.acts[t*2].z)),f=list[0];for(let j=0;j<2;j++){const i=t*2+j;arenaMove(A,i,dt,f?[f.x+(j?1.25:-1.25),f.z]:[(t?3:-3)+(j?1.25:-1.25),1]);}
            const a=A.acts[t*2],b=A.acts[t*2+1],d=Math.hypot(a.x-b.x,a.z-b.z);A.nets[t].position.set((a.x+b.x)/2,.8,(a.z+b.z)/2);A.nets[t].scale.x=clamp(d/3,.3,1.7);A.nets[t].rotation.y=Math.atan2(-(b.z-a.z),b.x-a.x);A.nets[t].visible=d<5;}
          A.fish=A.fish.filter(f=>{f.y-=dt*3.5;f.m.position.y=f.y;f.m.rotation.y+=dt*2;if(f.y<1){for(let t=0;t<2;t++){const n=A.nets[t];if(n.visible&&Math.hypot(f.x-n.position.x,f.z-n.position.z)<1.6){A.catch[t]=Math.max(0,A.catch[t]+(f.bad?-2:1));effect(A.acts[t*2],f.bad?0xe47a6a:0xffd23a);f.y=-2;break;}}}if(f.y<.1){f.m.visible=false;return false;}return true;});A.sc=A.teams.map(t=>A.catch[t]);},timeup:topScores,lab:scoreLabel,cam:A=>arenaCam(A,0,16,17,0,.7,0)};

      MG.hockey={n:'SOCK IT TO THEM',team:'2 V 2',col:'#89cad8',song:'mgB',time:45,
        desc:'IT IS HOCKEY WITH DAD\'S ROLLED-UP SOCK. BLUE DEFENDS THE LEFT GOAL. PINK DEFENDS THE RIGHT. SHOVE THE SOCK INTO THE OTHER NET!',
        ctl:[['stick','MOVE'],['a','WALLOP THE SOCK']],goal:'FIRST PAIR TO THREE GOALS',icon:attractionIcon('#659eaf','O'),
        init(A){pavilion(A,'ice');A.teams=[0,0,1,1];A.goals=[0,0];A.puck={x:0,z:0,vx:0,vz:0};A.ball=prop(A,[pt(S.ball(.42,10),0xf4e4c9,0,.4,0,0,0,0,1,.7,1.3),pt(S.tor(.32,.07,4,10),0x5688b3,0,.4,.15)]);A.cd=[0,0,0,0];A.acts.forEach((a,i)=>{a.x=i<2?-4:4;a.z=i%2?-2:2;});for(const x of [-7.8,7.8])prop(A,[pt(S.box(.3,1.6,4),x<0?0x78b3ed:0xe98eb5,x,.8,0),pt(S.box(1.1,.2,4),0xf4f4e4,x,1.7,0)]);},
        tick(A,dt,live){if(!live)return;const b=A.puck;A.acts.forEach((a,i)=>{const t=A.teams[i],I=arenaMove(A,i,dt,[b.x+(t?1:-1),b.z]);A.cd[i]-=dt;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;
            if(d<1.1){b.vx+=dx/d*dt*22;b.vz+=dz/d*dt*22;}if(d<1.8&&A.cd[i]<=0&&(I?I.a:true)){const aimX=t?-8:8,ang=Math.atan2(aimX-b.x,-b.z);b.vx=Math.sin(ang)*10;b.vz=Math.cos(ang)*10;A.cd[i]=.65;effect(a);}});separate(A.acts,1);b.x+=b.vx*dt;b.z+=b.vz*dt;b.vx*=Math.exp(-dt*.7);b.vz*=Math.exp(-dt*.7);if(Math.abs(b.z)>5){b.z=clamp(b.z,-5,5);b.vz*=-.85;}
          if(Math.abs(b.x)>7){if(Math.abs(b.z)<1.9){const t=b.x>0?0:1;A.goals[t]++;banner('GOAL!',P[t*2].name+' & '+P[t*2+1].name,'#ffd23a');b.x=b.z=b.vx=b.vz=0;if(A.goals[t]>=3){teamWin(A,t);A.done=true;}}else{b.x=clamp(b.x,-7,7);b.vx*=-.85;}}A.ball.position.set(b.x,0,b.z);A.ball.rotation.y+=dt*Math.hypot(b.vx,b.vz);A.sc=A.teams.map(t=>A.goals[t]);},timeup:topScores,lab:(A,i)=>A.goals[A.teams[i]]+' GOALS',cam:A=>arenaCam(A,0,17,16,0,0,0)};

      MG.balance={n:'THE GREAT PLATE ESCAPE',team:'2 V 2',col:'#cc93ca',song:'mgC',time:35,
        desc:'YOUR PAIR CARRIES A PLANK WITH A PLATE ON IT. LEFT PLAYER LEANS LEFT AND RIGHT; RIGHT PLAYER LEANS FORWARD AND BACK. KEEP THE PLATE IN THE MIDDLE!',
        ctl:[['stick','BALANCE YOUR SIDE']],goal:'KEEP YOUR PLATE LONGEST',icon:attractionIcon('#a778ac','O'),
        init(A){pavilion(A,'keep');A.teams=[0,0,1,1];A.plates=[0,1].map(t=>({x:0,z:0,vx:0,vz:0,fall:0,m:prop(A,[pt(S.cyl(.55,.65,.08,16),0xfff0da,0,0,0),pt(S.cyl(.2,.2,.1,10),0xe2a855,0,.1,0)]),plank:prop(A,[pt(S.box(5,.22,3.5),t?0xbb6b98:0x598ac1,0,0,0)])}));A.acts.forEach((a,i)=>{a.x=(i<2?-4:4)+(i%2?2:-2);a.z=2.5;});},
        tick(A,dt,live){A.plates.forEach((b,t)=>{const cx=t?4:-4;if(!live)return;if(b.fall){b.fall+=dt;b.m.position.y=1.4-b.fall*4;return;}const I=inp(t*2),J=inp(t*2+1),tx=(I?I.x:clamp(-b.x*1.3-b.vx*1.8,-1,1)),tz=(J?J.z:clamp(-b.z*1.3-b.vz*1.8,-1,1)),gustX=Math.sin(A.t*1.7+t)*.6,gustZ=Math.sin(A.t*2.1+t)*.5;b.vx+=(tx*2.7+gustX)*dt;b.vz+=(tz*2.7+gustZ)*dt;b.vx*=Math.exp(-dt*.35);b.vz*=Math.exp(-dt*.35);b.x+=b.vx*dt;b.z+=b.vz*dt;b.plank.position.set(cx,1.1,0);b.plank.rotation.set(tz*.12,0,-tx*.12);b.m.position.set(cx+b.x,1.4,b.z);A.sc[t*2]=A.sc[t*2+1]=35-A.tl;if(Math.abs(b.x)>2.3||Math.abs(b.z)>1.5){b.fall=.01;A.out[t*2]=A.out[t*2+1]=true;teamWin(A,1-t);A.done=true;}});},timeup(A){A.win=[0,1,2,3].filter(i=>!A.out[i]);},lab:(A,i)=>A.out[i]?'SMASH!':'STEADY...',cam:A=>arenaCam(A,0,11,17,0,1,0)};

      MG.cannon={n:'SEED SIEGE',team:'1 V 3',col:'#e49d73',song:'mgB',time:35,
        desc:'ONE GARDENER GUARDS THE CAKE. THREE CRUMB RAIDERS TRY TO REACH IT. AIM THE PEA CANNON AND PRESS TO FIRE. RAIDERS USE THE STICK TO DODGE.',
        ctl:[['stick','SOLO: AIM / CREW: RUN'],['a','SOLO: FIRE A PEA']],goal:'SOLO TAGS ALL / CREW REACHES CAKE',icon:attractionIcon('#bf845e','*'),
        init(A){pavilion(A,'garden');A.peas=[];A.fire=0;A.angle=0;A.acts[0].x=0;A.acts[0].z=4.5;A.acts.slice(1).forEach((a,i)=>{a.x=-4+i*4;a.z=-4.5;});A.gun=prop(A,[pt(S.cyl(.4,.5,1.7,12),0x749768,0,0,0,Math.PI/2),pt(S.ball(.65,12),0x916548,0,-.3,0)],0,1.5,3.5);},
        tick(A,dt,live){if(!live)return;A.fire-=dt;const I=inp(0);A.angle=clamp(A.angle+(I?I.x:Math.sin(A.t*1.3))*dt*1.8,-1.2,1.2);A.gun.rotation.y=A.angle;
          if(A.fire<=0&&(I?I.a:true)){A.fire=.25;A.peas.push({x:0,z:3,y:1,m:prop(A,[pt(S.ball(.22,8),0x9ed96a,0,0,0)]),vx:Math.sin(A.angle)*9,vz:-Math.cos(A.angle)*9});K.sfx.tone(240,.06,'triangle',.04);}
          for(let i=1;i<4;i++){if(A.out[i])continue;const a=A.acts[i],near=A.peas.find(p=>Math.hypot(p.x-a.x,p.z-a.z)<2.5),t=near?[clamp(a.x+(a.x<near.x?-2:2),-6,6),a.z]:[Math.sin(A.t+i)*5,4];arenaMove(A,i,dt,t,1.8+SK());A.sc[i]=a.z+4.5;if(a.z>3){A.win=[1,2,3];A.done=true;}}
          A.peas=A.peas.filter(p=>{p.x+=p.vx*dt;p.z+=p.vz*dt;p.m.position.set(p.x,1,p.z);for(let i=1;i<4;i++)if(!A.out[i]&&Math.hypot(p.x-A.acts[i].x,p.z-A.acts[i].z)<.7){A.out[i]=true;A.acts[i].sad=1;effect(A.acts[i],0xa1d85c);p.z=-10;}if(p.z<-6||Math.abs(p.x)>8){p.m.visible=false;return false;}return true;});if(A.out.slice(1).every(Boolean)){A.win=[0];A.done=true;}},timeup(A){A.win=[0];},lab:(A,i)=>i?'RAIDER':'GARDENER',cam:A=>arenaCam(A,0,15,16,0,1,0)};

      MG.gears={n:'UNDER PRESSURE',team:'1 V 3',col:'#bc9e74',song:'mgA',time:30,
        desc:'ONE ROBOT MUST COPY THE FOUR-ARROW CODE TO CLOSE THE GATE. THREE ENGINEERS PUMP THEIR BUTTONS TO OPEN IT. WHEN THE GAUGE FILLS, THE CREW WINS!',
        ctl:[['dpad','SOLO: COPY THE CODE'],['a','CREW: PUMP']],goal:'SOLO HOLDS / CREW FILLS GAUGE',icon:attractionIcon('#a08362','+'),
        init(A){pavilion(A,'keep');A.code=Array.from({length:4},()=>ri(4));A.index=0;A.gauge=.35;A.bot=0;A.pumps=[0,0,0,0];A.gate=prop(A,[pt(S.box(8,4,.5),0x6a728b,0,0,0),pt(S.box(.2,4,.7),0xd5b261,-2,0,0),pt(S.box(.2,4,.7),0xd5b261,2,0,0)],0,2,-3);},
        tick(A,dt,live){if(!live)return;A.bot-=dt;const I=inp(0);let d=-1;if(I){if(I.u)d=0;if(I.r)d=1;if(I.d)d=2;if(I.l)d=3;}else if(A.bot<=0){A.bot=[.65,.45,.3][G.diff];d=rnd()<SK()?A.code[A.index]:ri(4);}if(d>=0){if(d===A.code[A.index]){A.index++;if(A.index>=4){A.gauge=Math.max(0,A.gauge-.25);A.code=Array.from({length:4},()=>ri(4));A.index=0;effect(A.acts[0]);}}else A.index=0;}
          for(let i=1;i<4;i++){A.pumps[i]-=dt;const J=inp(i);if(J?J.a:A.pumps[i]<=0){A.gauge+=.013;A.pumps[i]=1/(4+SK()*3);squash(A.acts[i],2);}}
          A.gauge=Math.max(0,A.gauge-dt*.02);A.gate.position.y=2+A.gauge*4;A.sc=[(1-A.gauge)*100,A.gauge*100,A.gauge*100,A.gauge*100];if(A.gauge>=1){A.win=[1,2,3];A.done=true;}},
        timeup(A){A.win=[0];},lab:scoreLabel,hud(A){if(A.phase==='play'){ctr('COPY: '+A.code.map((d,i)=>(i<A.index?'*':['UP','RT','DN','LT'][d])).join(' '),160,10,'#ffdf86');H.fillStyle='#322b45';H.fillRect(70,27,180,10);H.fillStyle='#e7aa62';H.fillRect(70,27,180*clamp(A.gauge,0,1),10);}},cam:A=>arenaCam(A,0,11,17,0,1,0)};

      MG.bracket={n:'BALLOON BRIGADE',team:'2 V 2',col:'#eb9bb9',song:'mgA',time:30,
        desc:'TAKE TURNS PUMPING THE SAME BALLOON. BLUE PUMPS FIRST, THEN THE NEXT PORTRAIT FLASHES. PRESSING OUT OF TURN LETS AIR OUT!',
        ctl:[['a','PUMP ONLY WHEN YOUR PORTRAIT FLASHES']],goal:'FIRST PAIR TO POP THE BALLOON',icon:attractionIcon('#c67b9a','B'),
        init(A){pavilion(A,'fair');A.teams=[0,0,1,1];A.turns=[0,2];A.air=[0,0];A.cool=[0,0,0,0];A.balloons=[0,1].map(t=>prop(A,[pt(S.ball(1.2,14),t?0xe97ba4:0x5aabe6,0,0,0),pt(S.cone(.15,.25,6),0xffd070,0,-1.2,0,Math.PI)],t?4:-4,2,0));A.acts.forEach((a,i)=>{a.x=(i<2?-4:4)+(i%2?1.5:-1.5);a.z=2;});},
        tick(A,dt,live){A.balloons.forEach((m,t)=>{const s=.4+A.air[t]*1.2;m.scale.setScalar(s);m.position.y=1+s;});if(!live)return;A.acts.forEach((a,i)=>{A.cool[i]-=dt;const t=A.teams[i],I=inp(i),press=I?I.a:A.turns[t]===i&&A.cool[i]<=0;if(press){A.cool[i]=[.45,.33,.24][G.diff]+rnd()*.1;if(A.turns[t]===i){A.air[t]+=.045;A.turns[t]=t*2+(i%2?0:1);effect(a);}else A.air[t]=Math.max(0,A.air[t]-.02);if(A.air[t]>=1){teamWin(A,t);A.done=true;}}});A.sc=A.teams.map(t=>A.air[t]*100);},timeup:topScores,lab:(A,i)=>A.turns[A.teams[i]]===i?'YOUR TURN!':'WAIT...',hud(A){if(A.phase==='play')for(const i of A.turns){const p=scr(A.acts[i].x,2.4,A.acts[i].z);if((clock*5|0)%2)ctr(keyName('a'),p.x,p.y,'#ffd23a',2);}},cam:A=>arenaCam(A,0,8,15,0,1,0)};
      MG_ORDER.push('rope','redlight','stack','curling','lamp','parcel','delivery','bridge','tide','net','hockey','balance','cannon','gears','bracket');

      // The remaining attractions use different decisions, not palette/count variants.
      MG.hedge={n:'HEDGE YOUR BETS',col:'#7cb56d',song:'mgA',time:40,
        desc:'THE GARDENER LEFT THREE FLAGS IN A HEDGE MAZE. FIND THEM IN ORDER, THEN REACH THE GOLDEN GATE. WALLS REALLY ARE WALLS!',
        ctl:[['stick','RUN THROUGH THE MAZE']],goal:'COLLECT THREE FLAGS FIRST',icon:attractionIcon('#548748','H'),
        init(A){pavilion(A,'garden');A.walls=[[-3,-1,1,7],[1,1,1,7],[4,-2,1,6],[-5,2,3,1]];A.flags=[[-6,-4],[-1,4],[6,-4]];A.progress=[0,0,0,0];const q=[];A.walls.forEach(([x,z,w,d])=>{q.push(pt(S.box(w,1.5,d),0x438650,x,.75,z));q.push(pt(S.box(w+.15,.2,d+.15),0x73b45b,x,1.55,z));});A.flags.forEach(([x,z],i)=>{q.push(pt(S.cyl(.06,.06,2.8,6),0xe3bc72,x,1.4,z));q.push(pt(S.box(.9,.6,.08),[0xf7bd57,0xef82ac,0x72baed][i],x+.45,2.4,z));});mgMesh(q);A.acts.forEach((a,i)=>{a.x=-6+i*.3;a.z=4;});A.path=[[-6,-4],[-6,-5],[-1,-5],[-1,4],[-1,5],[3,5],[6,5],[6,-4]];A.way=[0,0,0,0];},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{const ox=a.x,oz=a.z,target=isBot(i)?A.path[Math.min(A.way[i],A.path.length-1)]:A.flags[A.progress[i]],I=arenaMove(A,i,dt,target,3.5+SK());for(const [x,z,w,d]of A.walls){if(Math.abs(a.x-x)<w/2+.35&&Math.abs(a.z-z)<d/2+.35){if(Math.abs(ox-x)>=w/2+.34)a.x=ox;else a.z=oz;}}if(isBot(i)&&Math.hypot(a.x-target[0],a.z-target[1])<.4)A.way[i]++;const f=A.flags[Math.min(2,A.progress[i])];if(Math.hypot(a.x-f[0],a.z-f[1])<.7){A.progress[i]++;A.sc[i]=A.progress[i];effect(a);if(A.progress[i]>=3){A.win=[i];A.done=true;}}});},timeup:topScores,lab:(A,i)=>A.progress[i]+'/3 FLAGS',cam:A=>arenaCam(A,0,19,13,0,0,0)};

      MG.fishing={n:'HOOK LINE AND STINKER',col:'#6baec9',song:'mgC',time:35,
        desc:'WAIT FOR YOUR BOBBER TO DIVE, THEN HOLD TO REEL. RELEASE IF THE LINE TURNS RED. SNAPPED LINES LET THE FISH ESCAPE!',
        ctl:[['a','HOLD TO REEL / RELEASE TO COOL LINE']],goal:'LAND THE MOST FISH',icon:attractionIcon('#44839f','J'),
        init(A){pavilion(A,'sea');A.fishers=A.acts.map((a,i)=>({wait:1+i*.35,bite:0,tension:0,reel:0,hooked:false,bob:prop(A,[pt(S.ball(.18,8),CHARS[P[i].ci].col,0,0,0)],a.x,.2,-3)}));A.acts.forEach(a=>a.z=1);},
        tick(A,dt,live){A.fishers.forEach((f,i)=>{f.bob.position.y=.2+Math.sin(A.t*5+i)*.08-(f.hooked?.3:0);if(!live)return;const I=inp(i),held=I?I.ah:f.hooked&&f.tension<.65;f.wait-=dt;if(!f.hooked&&f.wait<=0){f.bite+=dt;f.bob.position.y=-.2;if(held&&f.bite<.7){f.hooked=true;f.reel=f.tension=0;effect(A.acts[i]);}else if(f.bite>.7){f.wait=1+rnd()*2;f.bite=0;}}else if(f.hooked){f.tension=clamp(f.tension+dt*(held?1.1:-1.5),0,1.1);f.reel+=dt*(held?.8:-.13);if(f.tension>1||f.reel>1){if(f.reel>1){A.sc[i]++;effect(A.acts[i]);}else K.sfx.tone(140,.12,'square',.04);f.hooked=false;f.bite=0;f.wait=1+rnd()*2;}}});},timeup:topScores,lab:(A,i)=>A.sc[i]+' FISH',hud(A){if(A.phase==='play')A.fishers.forEach((f,i)=>{const x=12+i*79;H.fillStyle='#253a62';H.fillRect(x,30,60,6);H.fillStyle=f.tension>.7?'#ff685c':'#a4e47c';H.fillRect(x,30,60*f.tension,6);if(f.hooked||f.bite)ctr(f.hooked?'REEL':'BITE!',x+30,16,'#ffd23a');});},cam:A=>arenaCam(A,0,9,16,0,.5,-1)};

      MG.bowling={n:'PIN PANIC',col:'#d6a36b',song:'mgC',time:45,
        desc:'AIM LEFT OR RIGHT. HOLD TO CHARGE, RELEASE TO BOWL. YOU HAVE THREE ROLLS TO KNOCK OVER YOUR TEN PINS. THE PINS STAY DOWN!',
        ctl:[['stick','AIM'],['a','CHARGE AND RELEASE']],goal:'KNOCK DOWN THE MOST PINS',icon:attractionIcon('#a77a4f','!'),
        init(A){pavilion(A,'fair');A.bowl=A.acts.map((a,i)=>{const x=-5.4+i*3.6;a.x=x;a.z=4.4;const pins=[];for(let row=0;row<4;row++)for(let k=0;k<=row;k++){const px=x+(k-row/2)*.45,pz=-2.8-row*.48;const m=prop(A,[pt(S.ball(.19,8),0xf6ecda,0,.25,0,0,0,0,1,1.4,1),pt(S.cyl(.07,.12,.35,8),0xf6ecda,0,.6,0),pt(S.ball(.11,8),0xe88b83,0,.8,0)],px,0,pz);pins.push({m,x:px,z:pz,down:false});}return{x,aim:0,power:0,was:false,shots:0,ball:null,pins};});},
        tick(A,dt,live){if(!live)return;A.bowl.forEach((b,i)=>{if(b.ball){const o=b.ball;o.x+=o.vx*dt;o.z+=o.vz*dt;o.m.position.set(o.x,.3,o.z);o.m.rotation.x-=dt*7;for(const pin of b.pins)if(!pin.down&&Math.hypot(pin.x-o.x,pin.z-o.z)<.53){pin.down=true;pin.m.rotation.x=-1.4;pin.m.position.y=.17;A.sc[i]++;effect(A.acts[i]);}if(o.z<-5.5||Math.abs(o.x-b.x)>1.7){o.m.visible=false;b.ball=null;}return;}if(b.shots>=3)return;const I=inp(i);b.aim=clamp(b.aim+(I?I.x:0)*dt*.6,-.3,.3);const hold=I?I.ah:b.power<.75;if(hold)b.power=Math.min(1,b.power+dt*.8);if(b.was&&!hold){const angle=b.aim+(isBot(i)?(b.shots-1)*.055:0);b.ball={x:b.x,z:3.7,vx:Math.sin(angle)*(5+b.power*7),vz:-Math.cos(angle)*(5+b.power*7),m:prop(A,[pt(S.ball(.3,10),CHARS[P[i].ci].col,0,0,0)])};b.shots++;b.power=0;}b.was=hold;});if(A.bowl.every(b=>b.shots>=3&&!b.ball)){topScores(A);A.done=true;}},timeup:topScores,lab:(A,i)=>A.sc[i]+'/10 PINS',cam:A=>arenaCam(A,0,16,14,0,.2,-.2)};

      MG.dig={n:'BURIED PLEASURE',col:'#d8b27b',song:'mgA',time:30,
        desc:'SOMEONE BURIED THE PICNIC MONEY. DIG ON A SAND PATCH TO FIND COINS. PALE PATCHES ARE SPENT. A CLOSER RUMBLE MEANS TREASURE IS NEAR.',
        ctl:[['stick','MOVE'],['a','DIG THE PATCH UNDER YOU']],goal:'FIND THE MOST COINS',icon:attractionIcon('#b59161','$'),
        init(A){pavilion(A,'garden');A.patches=[];A.cool=[0,0,0,0];for(let z=-4;z<=4;z+=2)for(let x=-6;x<=6;x+=2){const value=rnd()<.3?3+rnd()*4|0:0,m=prop(A,[pt(S.cyl(.6,.6,.035,10),0xd8b078,0,.12,0)],x,0,z);A.patches.push({x,z,value,m,dug:false});}},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{A.cool[i]-=dt;const pool=A.patches.filter(p=>!p.dug),target=pool.sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];if(!target)return;const I=arenaMove(A,i,dt,[target.x,target.z]);if(A.cool[i]<=0&&(I?I.a:Math.hypot(a.x-target.x,a.z-target.z)<.5)){const patch=A.patches.find(p=>!p.dug&&Math.hypot(p.x-a.x,p.z-a.z)<.8);A.cool[i]=.55;if(patch){patch.dug=true;patch.m.material=cmat('dugSand',{color:0xf0d9af});A.sc[i]+=patch.value;effect(a,patch.value?0xffd23a:0xd8b078);if(i===0)floatTxt(a.x,2,a.z,patch.value?'+'+patch.value:'EMPTY',patch.value?'#ffe38a':'#fff');}}});if(A.patches.every(p=>p.dug)){topScores(A);A.done=true;}},timeup:topScores,lab:(A,i)=>A.sc[i]+' COINS',cam:A=>arenaCam(A,0,17,14,0,0,0)};

      MG.snow={n:'SNOW ME MERCY',col:'#9bc9e8',song:'mgB',time:40,
        desc:'HOLD TO PACK A SNOWBALL, RELEASE TO THROW. BIGGER SNOWBALLS HIT HARDER. THREE HITS SEND YOU TO THE COCOA QUEUE. FACE YOUR TARGET!',
        ctl:[['stick','MOVE AND FACE'],['a','PACK / RELEASE TO THROW']],goal:'BE THE LAST SNOWPERSON',icon:attractionIcon('#6d9fc1','*'),
        init(A){pavilion(A,'ice');A.snow=[];A.pack=[0,0,0,0];A.was=[false,false,false,false];A.hits=[0,0,0,0];A.safe=[0,0,0,0];},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{if(A.out[i])return;A.safe[i]-=dt;const rival=A.acts.map((b,j)=>({b,j})).filter(o=>o.j!==i&&!A.out[o.j]).sort((p,q)=>Math.hypot(p.b.x-a.x,p.b.z-a.z)-Math.hypot(q.b.x-a.x,q.b.z-a.z))[0];if(!rival)return;const I=arenaMove(A,i,dt,[rival.b.x,rival.b.z],3.3);const held=I?I.ah:A.pack[i]<.55;if(held)A.pack[i]=Math.min(1,A.pack[i]+dt);if(A.was[i]&&!held){const size=.2+A.pack[i]*.24,angle=a.ry;A.snow.push({m:prop(A,[pt(S.ball(size,10),0xf7fcff,0,0,0)]),x:a.x,z:a.z,vx:Math.sin(angle)*10,vz:Math.cos(angle)*10,life:1.7,owner:i});A.pack[i]=0;}A.was[i]=held;});separate(A.acts,1);
          A.snow=A.snow.filter(b=>{b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.set(b.x,1,b.z);for(let i=0;i<4;i++)if(i!==b.owner&&!A.out[i]&&A.safe[i]<=0&&Math.hypot(b.x-A.acts[i].x,b.z-A.acts[i].z)<.7){A.hits[i]++;A.safe[i]=1;effect(A.acts[i],0xbfe9ff);b.life=0;if(A.hits[i]>=3){A.out[i]=true;A.acts[i].sad=1;}}if(b.life<=0){b.m.visible=false;return false;}return true;});const left=[0,1,2,3].filter(i=>!A.out[i]);if(left.length<=1){A.win=left;A.done=true;}A.sc=A.hits.map(h=>3-h);},timeup:topScores,lab:(A,i)=>(3-A.hits[i])+' HEARTS',cam:A=>arenaCam(A,0,14,17,0,.5,0)};

      MG.rhythm={n:'DISCO INFERNOODLE',col:'#d57ed2',song:'mgA',time:30,
        desc:'ARROWS SLIDE DOWN THE DANCE FLOOR. PRESS THE MATCHING DIRECTION WHEN THEY REACH THE GOLD LINE. KEEP THE COMBO FOR EXTRA POINTS!',
        ctl:[['dpad','MATCH EACH ARROW AT THE LINE']],goal:'HIGHEST RHYTHM SCORE',icon:attractionIcon('#a85eab','+'),
        init(A){pavilion(A,'keep');A.notes=[];A.spawn=.5;A.combo=[0,0,0,0];A.next=0;A.acts.forEach((a,i)=>{a.x=-4.5+i*3;a.z=2.5;});},
        tick(A,dt,live){if(!live)return;A.spawn-=dt;if(A.spawn<=0){A.spawn=.5;const d=ri(4),m=prop(A,[pt(S.box(.7,.08,.7),DCOL[d],0,0,0)],(d-1.5)*1.5,.2,-5);A.notes.push({m,d,t:0,hit:[false,false,false,false]});}for(const n of A.notes){n.t+=dt;n.m.position.z=-5+n.t*5;
            for(let i=0;i<4;i++){if(n.hit[i])continue;const I=inp(i),hit=I?[I.u,I.r,I.d,I.l][n.d]:Math.abs(n.t-1.6)<dt/2&&rnd()<SK();if(hit&&Math.abs(n.t-1.6)<.16){n.hit[i]=true;A.combo[i]++;A.sc[i]+=10+Math.min(20,A.combo[i]*2);effect(A.acts[i],DCOL[n.d]);}else if(n.t>1.8){n.hit[i]=true;A.combo[i]=0;}}}A.notes=A.notes.filter(n=>{if(n.t>2.2){n.m.visible=false;return false;}return true;});},timeup:topScores,lab:scoreLabel,hud(A){if(A.phase!=='play')return;H.strokeStyle='#ffe27d';H.lineWidth=3;H.beginPath();H.moveTo(98,149);H.lineTo(222,149);H.stroke();for(const n of A.notes){const q=scr(n.m.position.x,.3,n.m.position.z);ctr(['UP','RT','DN','LT'][n.d],q.x,q.y,'#fff');}},cam:A=>arenaCam(A,0,16,14,0,0,0)};

      MG.trace={n:'DOODLE BUGS',col:'#c7a1da',song:'mgC',time:30,
        desc:'FOLLOW THE GOLDEN LINE WITH YOUR PAINTBRUSH. STAY CLOSE TO IT AND REACH EVERY CORNER IN ORDER. HURRYING OFF THE LINE EARNS NOTHING!',
        ctl:[['stick','TRACE THE OUTLINE']],goal:'TRACE THE MOST OF THE SHAPE',icon:attractionIcon('#9e79b2','Z'),
        init(A){pavilion(A,'fair');A.path=[[-6,4],[-6,-3],[-2,-3],[-2,2],[2,2],[2,-3],[6,-3],[6,4],[-6,4]];A.step=[0,0,0,0];A.acts.forEach(a=>{a.x=-6;a.z=4;});const q=[];for(let k=0;k<A.path.length-1;k++){const [x,z]=A.path[k],[xx,zz]=A.path[k+1];q.push(pt(S.box(Math.abs(xx-x)+.12,.025,Math.abs(zz-z)+.12),0xffda78,(x+xx)/2,.13,(z+zz)/2));}mgMesh(q);},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{const dest=A.path[(A.step[i]+1)%A.path.length],I=arenaMove(A,i,dt,dest,3.8),last=A.path[A.step[i]%A.path.length],dx=dest[0]-last[0],dz=dest[1]-last[1],u=clamp(((a.x-last[0])*dx+(a.z-last[1])*dz)/(dx*dx+dz*dz||1),0,1),off=Math.hypot(a.x-last[0]-dx*u,a.z-last[1]-dz*u);if(off<.5){A.sc[i]=A.step[i]*100+u*100;if((frame%8)===0)puff(a.x,.2,a.z,[CHARS[P[i].ci].col],1,{sp:0,up:.2,g:0,life:.8});if(Math.hypot(a.x-dest[0],a.z-dest[1])<.4){A.step[i]++;effect(a);if(A.step[i]>=A.path.length-1){A.win=[i];A.done=true;}}}});},timeup:topScores,lab:(A,i)=>Math.min(100,Math.floor(A.sc[i]/8))+'%',cam:A=>arenaCam(A,0,19,12,0,0,0)};

      MG.hurdles={n:'JUMP TO CONCLUSIONS',col:'#e4a865',song:'mgB',time:30,
        desc:'YOU RUN AUTOMATICALLY. JUMP THE CRATES AND DUCK UNDER THE BUNTING WITH THE OTHER BUTTON. EACH CLEAN OBSTACLE SCORES. WATCH WHAT IS COMING!',
        ctl:[['a','JUMP CRATE'],['b','HOLD TO DUCK BUNTING']],goal:'CLEAR THE MOST OBSTACLES',icon:attractionIcon('#bb874f','^'),
        init(A){pavilion(A,'garden');A.barriers=[];A.spawn=.6;A.acts.forEach((a,i)=>{a.x=-5.4+i*3.6;a.z=3;});},
        tick(A,dt,live){if(!live)return;A.spawn-=dt;if(A.spawn<=0){A.spawn=1.5;const high=rnd()<.4;for(let i=0;i<4;i++){const x=-5.4+i*3.6,m=prop(A,[pt(S.box(2,high?.3:1,high?.2:.6),high?0xea8cab:0xc1945a,0,0,0)],x,high?1.3:.5,-6);A.barriers.push({m,z:-6,i,high,checked:false});}}A.acts.forEach((a,i)=>{const I=inp(i),near=A.barriers.find(b=>b.i===i&&!b.checked&&b.z>1.2&&b.z<3),jump=I?I.a:near&&!near.high&&a.y<.1,duck=I?I.bh:near&&near.high;if(jump&&a.y<.1)a.vy=8;gravity(a,dt);a.sc=duck?.65:1;a.walk+=dt*11;a.mv=1;});A.barriers=A.barriers.filter(b=>{b.z+=dt*6;b.m.position.z=b.z;if(!b.checked&&b.z>2.8){b.checked=true;const a=A.acts[b.i],ok=b.high?a.sc<.8:a.y>.7;if(ok)A.sc[b.i]++;else{effect(a,0xff7663);a.sad=.4;}}if(b.z>6){b.m.visible=false;return false;}return true;});},timeup:topScores,lab:(A,i)=>A.sc[i]+' CLEAR',cam:A=>arenaCam(A,0,10,17,0,1,0)};

      MG.meteor={n:'CRUMBLED FROM ABOVE',col:'#ba99c9',song:'mgB',time:35,
        desc:'THE COUNT HAS DROPPED HIS BISCUIT TIN. RED SHADOWS MARK FALLING CRUMBS. GET OUT OF THE WAY BEFORE THEY LAND. THREE HITS AND YOU ARE TOAST!',
        ctl:[['stick','AVOID THE RED SHADOWS']],goal:'SURVIVE THE CRUMB STORM',icon:attractionIcon('#9675aa','*'),
        init(A){pavilion(A,'keep');A.drops=[];A.spawn=0;A.hits=[0,0,0,0];A.safe=[0,0,0,0];},
        tick(A,dt,live){if(!live)return;A.spawn-=dt;if(A.spawn<=0){A.spawn=.45;const target=pick(A.acts),x=clamp(target.x+(rnd()-.5)*3,-7,7),z=clamp(target.z+(rnd()-.5)*3,-5,5),m=prop(A,[pt(S.dod(.7),0xc49b6d,0,0,0)]),shadow=prop(A,[pt(S.cyl(1.2,1.2,.025,20),0xc85b75,0,.13,0)],x,0,z);A.drops.push({x,z,t:0,m,shadow});}A.acts.forEach((a,i)=>{if(A.out[i])return;A.safe[i]-=dt;const bad=A.drops.find(b=>Math.hypot(b.x-a.x,b.z-a.z)<2),target=bad?[clamp(a.x+(a.x<bad.x?-3:3),-6,6),clamp(a.z+(a.z<bad.z?-3:3),-4,4)]:[a.x,a.z];arenaMove(A,i,dt,target);});A.drops=A.drops.filter(b=>{b.t+=dt;b.m.position.set(b.x,8*(1-clamp((b.t-.7)/.6,0,1)),b.z);b.m.rotation.x+=dt*3;if(b.t>1.3){A.acts.forEach((a,i)=>{if(!A.out[i]&&A.safe[i]<=0&&Math.hypot(a.x-b.x,a.z-b.z)<1.3){A.hits[i]++;A.safe[i]=1;effect(a,0xe4a873);if(A.hits[i]>=3){A.out[i]=true;a.sad=1;}}});b.m.visible=b.shadow.visible=false;return false;}return true;});A.sc=A.hits.map(h=>3-h);const left=[0,1,2,3].filter(i=>!A.out[i]);if(left.length<=1){A.win=left;A.done=true;}},timeup:topScores,lab:(A,i)=>(3-A.hits[i])+' HEARTS',cam:A=>arenaCam(A,0,16,16,0,0,0)};

      MG.tiles={n:'COLOUR ME CONFUSED',col:'#c98ccd',song:'mgA',time:35,
        desc:'MC WOBBLE CALLS A COLOUR. STAND ON THAT COLOUR BEFORE THE BELL. THE OTHER TILES VANISH! COLOURS CHANGE AFTER EACH ROUND.',
        ctl:[['stick','REACH THE CALLED COLOUR']],goal:'SURVIVE FIVE COLOUR CALLS',icon:attractionIcon('#a46cab','?'),
        init(A){pavilion(A,'keep',false);A.tiles=[];A.round=0;A.tileTimer=0;A.call=0;A.acts.forEach((a,i)=>{a.x=-4.5+i*3;a.z=3;});for(let z=0;z<3;z++)for(let x=0;x<4;x++){const c=(x+z)%4,m=prop(A,[pt(S.box(3.2,.4,3.2),DCOL[c],0,0,0)],-5.1+x*3.4,.3,-3.4+z*3.4);A.tiles.push({m,c,x:m.position.x,z:m.position.z});}A.call=ri(4);},
        tick(A,dt,live){if(!live)return;A.tileTimer+=dt;const resolve=A.tileTimer>3;A.acts.forEach((a,i)=>{if(A.out[i])return;const safe=A.tiles.filter(t=>t.c===A.call).sort((p,q)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(a.x-q.x,a.z-q.z))[0];arenaMove(A,i,dt,[safe.x,safe.z]);a.y=a.gy=.52;if(resolve){const tile=A.tiles.find(t=>Math.abs(a.x-t.x)<1.65&&Math.abs(a.z-t.z)<1.65);if(!tile||tile.c!==A.call){A.out[i]=true;a.sad=1;effect(a,0xb7b9e7);}else A.sc[i]++;}});if(resolve){A.tiles.forEach(t=>t.m.visible=t.c===A.call);if(A.tileTimer>4.2){A.round++;A.tileTimer=0;A.call=ri(4);A.tiles.forEach(t=>{t.c=ri(4);t.m.material=cmat('tile'+t.c,{color:DCOL[t.c]});t.m.visible=true;});if(!A.tiles.some(t=>t.c===A.call)){A.tiles[0].c=A.call;A.tiles[0].m.material=cmat('tile'+A.call,{color:DCOL[A.call]});}if(A.round>=5){A.win=[0,1,2,3].filter(i=>!A.out[i]);A.done=true;}}}if(A.out.filter(Boolean).length>=3){A.win=[0,1,2,3].filter(i=>!A.out[i]);A.done=true;}},timeup:topScores,lab:(A,i)=>A.sc[i]+' SAFE',hud(A){if(A.phase==='play')bigText(['RED','BLUE','GREEN','GOLD'][A.call]+'!',160,8,2,hex(DCOL[A.call]),2);},cam:A=>arenaCam(A,0,18,14,0,.5,0)};

      MG.golf={n:'PUTT A SOCK IN IT',col:'#8dbb73',song:'mgC',time:45,
        desc:'AIM YOUR BALL AT THE CUP. HOLD TO CHARGE, RELEASE TO PUTT. THE LOW WALLS BOUNCE YOUR BALL. FIVE STROKES; A HOLE IN ONE EARNS A CHEER!',
        ctl:[['stick','AIM LEFT / RIGHT'],['a','CHARGE AND RELEASE']],goal:'HOLE OUT / GET CLOSEST',icon:attractionIcon('#608b4b','O'),
        init(A){pavilion(A,'garden');for(const x of [-7.1,-3.5,.1,3.7,7.3])prop(A,[pt(S.box(.12,.26,10.6),0xd3bc83,x,.2,0)]);A.golf=A.acts.map((a,i)=>{a.x=-5.4+i*3.6;a.z=4.5;const m=prop(A,[pt(S.ball(.2,10),CHARS[P[i].ci].col,0,0,0)],a.x,.25,3.6);prop(A,[pt(S.cyl(.38,.38,.035,16),0x303844,a.x,.12,-4)]);return{x:a.x,z:3.6,home:a.x,vx:0,vz:0,angle:0,power:0,was:false,shots:0,m,done:false};});},
        tick(A,dt,live){if(!live)return;A.golf.forEach((b,i)=>{if(b.done)return;b.x+=b.vx*dt;b.z+=b.vz*dt;b.vx*=Math.exp(-dt*1.4);b.vz*=Math.exp(-dt*1.4);if(Math.abs(b.x-b.home)>1.5){b.x=clamp(b.x,b.home-1.5,b.home+1.5);b.vx*=-.7;}if(Math.abs(b.z)>5){b.z=clamp(b.z,-5,5);b.vz*=-.7;}b.m.position.set(b.x,.25,b.z);const dist=Math.hypot(b.x-b.home,b.z+4);A.sc[i]=Math.max(0,100-dist*10);if(dist<.4&&Math.hypot(b.vx,b.vz)<3){b.done=true;A.sc[i]=200-b.shots*10;A.win=[i];A.done=true;effect(A.acts[i]);return;}if(Math.hypot(b.vx,b.vz)>.15||b.shots>=5)return;const I=inp(i);b.angle=clamp(b.angle+(I?I.x:0)*dt*1.5,-Math.PI,Math.PI);const held=I?I.ah:b.power<clamp(dist*1.4/15,.1,.9);if(held)b.power=Math.min(1,b.power+dt*.7);if(b.was&&!held){const angle=isBot(i)?Math.atan2(b.home-b.x,-(-4-b.z)):b.angle;b.vx=Math.sin(angle)*b.power*15;b.vz=-Math.cos(angle)*b.power*15;b.power=0;b.shots++;}b.was=held;});},timeup:topScores,lab:(A,i)=>A.golf[i].shots+'/5 '+Math.round(A.golf[i].power*100)+'%',cam:A=>arenaCam(A,0,18,14,0,0,0)};

      MG.hide={n:'HIDE AND BEAK',team:'1 V 3',col:'#b7a069',song:'mgC',time:40,
        desc:'THREE PLAYERS HIDE BEHIND HAYSTACKS. THE SEEKER PICKS ONE STACK TO SEARCH EACH ROUND. SURVIVING FIVE SEARCHES WINS FOR THE HIDDEN CREW.',
        ctl:[['stick','LEFT / RIGHT: PICK A STACK'],['a','CONFIRM YOUR CHOICE']],goal:'SEEKER FINDS ALL / CREW HIDES',icon:attractionIcon('#938052','?'),
        init(A){pavilion(A,'garden');A.hide=[0,0,1,2];A.chosen=[false,false,false,false];A.round=0;A.timer=0;A.reveal=false;A.pick=1;for(let i=0;i<3;i++)prop(A,[pt(S.cyl(1.6,2,2.5,10),0xc7a968,0,0,0),pt(S.cone(1.6,1,10),0xe1c47d,0,1.7,0)],-5+i*5,1.25,-2);A.acts[0].x=0;A.acts[0].z=4;},
        tick(A,dt,live){if(!live)return;A.timer+=dt;for(let i=0;i<4;i++){if(A.out[i])continue;const I=inp(i);if(i===0){if(I?.l)A.pick=(A.pick+2)%3;if(I?.r)A.pick=(A.pick+1)%3;}else if(!A.reveal){if(I?.l)A.hide[i]=(A.hide[i]+2)%3;if(I?.r)A.hide[i]=(A.hide[i]+1)%3;if(!I&&!A.chosen[i]){A.hide[i]=ri(3);A.chosen[i]=true;}const a=A.acts[i];a.x=-5+A.hide[i]*5;a.z=-3;a.vis=!A.chosen[i];}if(I?.a)A.chosen[i]=true;}
          const I=inp(0);if(!A.reveal&&A.timer>2&&(I?I.a:A.timer>3)){A.reveal=true;A.timer=0;if(!I)A.pick=ri(3);for(let i=1;i<4;i++)if(!A.out[i]){A.acts[i].vis=true;if(A.hide[i]===A.pick){A.out[i]=true;A.acts[i].sad=1;effect(A.acts[i]);}else A.sc[i]++;}A.sc[0]=A.out.filter(Boolean).length;A.round++;}
          if(A.reveal&&A.timer>1.5){A.reveal=false;A.timer=0;A.chosen.fill(false);if(A.out.slice(1).every(Boolean)){A.win=[0];A.done=true;}else if(A.round>=5){A.win=[1,2,3];A.done=true;}}},timeup(A){A.win=A.out.slice(1).every(Boolean)?[0]:[1,2,3];},lab:(A,i)=>i?'HIDE!':'STACK '+(A.pick+1),hud(A){if(A.phase==='play')ctr('SEARCH '+(A.round+1)+'/5  '+(A.reveal?'FOUND YOU!':'PICK: '+(A.pick+1)),160,10,'#ffe2a1');},cam:A=>arenaCam(A,0,12,17,0,1,0)};

      MG.stomp={n:'BOOT CAMP',team:'1 V 3',col:'#b89cc9',song:'mgB',time:30,
        desc:'ONE PLAYER MOVES THE COUNT\'S GIANT BOOT SHADOW AND PRESSES TO STOMP. THE OTHER THREE DODGE IT. THE BOOT MUST TAG ALL THREE BEFORE TEATIME.',
        ctl:[['stick','SOLO: MOVE SHADOW / CREW: DODGE'],['a','SOLO: STOMP']],goal:'BOOT TAGS ALL / CREW SURVIVES',icon:attractionIcon('#927da2','B'),
        init(A){pavilion(A,'keep');A.boot={x:0,z:0,t:0,cd:0};A.shadow=prop(A,[pt(S.cyl(1.5,1.5,.025,24),0xd5759d,0,.14,0)]);A.big=prop(A,[pt(S.box(2,1.4,3),0x504161,0,0,.3),pt(S.cyl(.8,.9,2,12),0x645078,0,1.3,-.5),pt(S.box(2.1,.25,3.2),0xd0a965,0,-.8,.3)]);A.acts[0].x=-6;A.acts[0].z=-5;A.acts[0].vis=false;},
        tick(A,dt,live){if(!live)return;const b=A.boot,I=inp(0);b.cd-=dt;if(b.t>0){b.t+=dt;A.big.position.set(b.x,Math.max(1,8-Math.sin(clamp(b.t/.8,0,1)*Math.PI)*7),b.z);if(b.t>.8){for(let i=1;i<4;i++)if(!A.out[i]&&Math.hypot(A.acts[i].x-b.x,A.acts[i].z-b.z)<1.6){A.out[i]=true;A.acts[i].sad=1;effect(A.acts[i],0xe6aaca);}b.t=0;b.cd=.7;}}else{const target=A.acts.find((a,i)=>i>0&&!A.out[i]);b.x=clamp(b.x+(I?I.x:target?clamp(target.x-b.x,-1,1):0)*dt*6,-6,6);b.z=clamp(b.z+(I?I.z:target?clamp(target.z-b.z,-1,1):0)*dt*6,-4,4);A.big.position.set(b.x,8,b.z);if(b.cd<=0&&(I?I.a:true))b.t=.001;}A.shadow.position.set(b.x,0,b.z);for(let i=1;i<4;i++)if(!A.out[i]){const a=A.acts[i],target=Math.hypot(a.x-b.x,a.z-b.z)<2.4?[clamp(a.x+(a.x<b.x?-3:3),-6,6),clamp(a.z+(a.z<b.z?-3:3),-4,4)]:[a.x,a.z];arenaMove(A,i,dt,target,4.3);}if(A.out.slice(1).every(Boolean)){A.win=[0];A.done=true;}},timeup(A){A.win=[1,2,3];},lab:(A,i)=>i?A.out[i]?'TAGGED':'RUN!':'THE BOOT',cam:A=>arenaCam(A,0,17,17,0,1,0)};

      MG.rowing={n:'OAR YOU SERIOUS',team:'2 V 2',col:'#8cbfda',song:'mgA',time:35,
        desc:'ROW YOUR DINGHY THROUGH THE BUOYS. THE LEFT PLAYER PULLS THE LEFT OAR, THE RIGHT PLAYER PULLS THE RIGHT. BALANCED STROKES GO STRAIGHT!',
        ctl:[['a','PULL YOUR OAR']],goal:'FIRST DINGHY TO THE FAR BUOY',icon:attractionIcon('#5b96b7','/'),
        init(A){pavilion(A,'sea',false);A.teams=[0,0,1,1];A.boats=[0,1].map(t=>({x:t?4:-4,z:4,angle:0,v:0,m:prop(A,[pt(S.ball(1,12),t?0xd879a4:0x5c9ecf,0,.2,0,0,0,0,1.4,.4,2),pt(S.box(2,.15,.5),0xe4c19b,0,.45,0)])}));A.cd=[0,0,0,0];const q=[];for(const x of [-7,0,7])for(const z of [-4,0,4])q.push(pt(S.ball(.3,8),0xf1bb64,x,.2,z));mgMesh(q);},
        tick(A,dt,live){if(!live)return;A.boats.forEach((b,t)=>{for(let j=0;j<2;j++){const i=t*2+j;A.cd[i]-=dt;const I=inp(i);if(I?I.a:A.cd[i]<=0&&(j===0?b.angle<.1:b.angle>-.1)){A.cd[i]=[.6,.45,.35][G.diff];b.angle+=(j===0?1:-1)*.12;b.v=Math.min(3,b.v+.55);effect(A.acts[i]);}}b.angle=clamp(b.angle,-1,1);b.x+=Math.sin(b.angle)*b.v*dt;b.z-=Math.cos(b.angle)*b.v*dt;b.v*=Math.exp(-dt*.7);if(Math.abs(b.x-(t?4:-4))>2.5){b.x=clamp(b.x,(t?4:-4)-2.5,(t?4:-4)+2.5);b.v*=.8;}b.m.position.set(b.x,0,b.z);b.m.rotation.y=-b.angle;for(let j=0;j<2;j++){const a=A.acts[t*2+j];a.x=b.x+(j?.55:-.55);a.z=b.z;a.y=.45;a.sc=.65;A.sc[t*2+j]=4-b.z;}if(b.z<-4.4){teamWin(A,t);A.done=true;}});},timeup:topScores,lab:(A,i)=>Math.floor(A.sc[i]*10)+' M',cam:A=>arenaCam(A,0,16,15,0,0,0)};

      MG.kitchen={n:'SANDWICH SORCERY',team:'2 V 2',col:'#d7b380',song:'mgA',time:35,
        desc:'READ THE ORDER: BREAD, JELLY OR CHEESE. LEFT PLAYER PICKS THE INGREDIENT WITH THE STICK. RIGHT PLAYER PRESSES TO SERVE. WRONG ORDERS LOSE A POINT!',
        ctl:[['stick','LEFT PLAYER: SELECT INGREDIENT'],['a','RIGHT PLAYER: SERVE IT']],goal:'SERVE THE MOST CORRECT ORDERS',icon:attractionIcon('#a88b60','S'),
        init(A){pavilion(A,'fair');A.teams=[0,0,1,1];A.order=[ri(3),ri(3)];A.selected=[0,0];A.cool=[0,0];A.sandwich=[0,1].map(t=>prop(A,[pt(S.box(2,.2,1.4),0xe2bc83,0,0,0),pt(S.box(1.8,.2,1.3),0xd6a94c,0,.25,0),pt(S.box(2,.2,1.4),0xe2bc83,0,.5,0)],t?4:-4,1,-1));},
        tick(A,dt,live){if(!live)return;for(let t=0;t<2;t++){A.cool[t]-=dt;const I=inp(t*2),J=inp(t*2+1);if(I?.l)A.selected[t]=(A.selected[t]+2)%3;if(I?.r)A.selected[t]=(A.selected[t]+1)%3;if(!I&&rnd()<SK()*.05)A.selected[t]=A.order[t];if(A.cool[t]<=0&&(J?J.a:A.selected[t]===A.order[t])){const right=A.order[t]===A.selected[t];const score=Math.max(0,A.sc[t*2]+(right?1:-1));A.sc[t*2]=A.sc[t*2+1]=score;A.cool[t]=.6;A.order[t]=ri(3);effect(A.acts[t*2+1],right?0xffd23a:0xe77665);}A.sandwich[t].rotation.y=Math.sin(A.t)*.15;}},timeup:topScores,lab:scoreLabel,hud(A){if(A.phase==='play')for(let t=0;t<2;t++){const x=t?238:82;ctr('ORDER: '+['BREAD','JELLY','CHEESE'][A.order[t]],x,12,'#ffe4a1');ctr('PICK: '+['BREAD','JELLY','CHEESE'][A.selected[t]],x,27,'#fff');}},cam:A=>arenaCam(A,0,9,16,0,1,0)};

      MG.lift={n:'STEP ON IT',team:'2 V 2',col:'#a1bbdc',song:'mgB',time:40,
        desc:'ONE PARTNER STANDS ON THE GOLD SWITCH TO RAISE THE BRIDGE. THE OTHER RUNS ACROSS TO THE FLAG. THEN SWAP JOBS ON THE WAY BACK!',
        ctl:[['stick','MOVE ONTO SWITCH / CROSS BRIDGE']],goal:'CROSS AND RETURN TOGETHER',icon:attractionIcon('#7c93b8','='),
        init(A){pavilion(A,'keep',false);prop(A,[pt(S.box(16.8,.12,6),0x292d57,0,.12,0)]);A.teams=[0,0,1,1];A.phaseT=[0,0];A.crossed=[false,false,false,false];A.bridges=[0,1].map(t=>prop(A,[pt(S.box(3,.4,6),t?0xbf7da5:0x7299c9,0,0,0)],t?4:-4,-1,0));A.acts.forEach((a,i)=>{a.x=(i<2?-4:4)+(i%2?.7:-.7);a.z=4.8;});for(const x of [-4,4])prop(A,[pt(S.cyl(.6,.7,.15,16),0xffd373,x-1.4,.2,4),pt(S.cyl(.6,.7,.15,16),0xffd373,x+1.4,.2,-4)]);},
        tick(A,dt,live){if(!live)return;for(let t=0;t<2;t++){const phase=A.phaseT[t],base=t?4:-4,operator=t*2+(phase%2),runner=t*2+(1-phase%2),sw=[base+(phase%2===0?-1.4:1.4),[4,-4,-4,4][Math.min(3,phase)]],op=A.acts[operator],run=A.acts[runner];arenaMove(A,operator,dt,sw,3.7);const active=Math.hypot(op.x-sw[0],op.z-sw[1])<.8;A.bridges[t].position.y=active?.12:-1;
            const target=[base,phase<2?-4.6:4.6],oldZ=run.z;arenaMove(A,runner,dt,target,3.7);if(Math.abs(run.z)<3&&!active){run.z=oldZ;run.vz=0;}if(Math.abs(run.x-base)>1.4&&Math.abs(run.z)<3){run.x=base;run.z=phase<2?4:-4;effect(run,0xb5d1e9);}if(Math.hypot(run.x-target[0],run.z-target[1])<.5){A.phaseT[t]++;effect(run);if(A.phaseT[t]>=4){teamWin(A,t);A.done=true;}}A.sc[t*2]=A.sc[t*2+1]=phase*10+Math.max(0,phase<2?4.8-run.z:run.z+4.8);}},timeup:topScores,lab:(A,i)=>A.phaseT[A.teams[i]]+'/4 FLAGS',cam:A=>arenaCam(A,0,17,15,0,.5,0)};

      MG.wire={n:'CURRENT AFFAIRS',team:'1 V 3',col:'#a897d1',song:'mgB',time:35,
        desc:'THREE SPARKS ROLL TOWARD THE GATE. THE SOLO ELECTRICIAN CHOOSES A WIRE THEN PRESSES TO BLOCK IT BEFORE A SPARK ARRIVES. WATCH THE WIND-UP!',
        ctl:[['dpad','LEFT / RIGHT: CHOOSE A WIRE'],['a','SOLO: BLOCK / CREW: SEND']],goal:'SOLO STOPS 12 / CREW SENDS 12',icon:attractionIcon('#8272aa','Z'),
        init(A){pavilion(A,'keep');A.wires=[1,0,1,2];A.block=1;A.good=0;A.stopped=0;A.cool=[0,.5,1.3,2.1];A.pulses=[];const q=[];for(let k=0;k<3;k++){q.push(pt(S.box(.15,.08,8),[0xe67c8d,0x83d59c,0x83b6e5][k],-4+k*4,.17,0));q.push(pt(S.ball(.5,10),0xe9d58a,-4+k*4,.6,-4));}mgMesh(q);},
        tick(A,dt,live){if(!live)return;const next=A.pulses.slice().sort((a,b)=>a.left-b.left)[0];
          for(let i=0;i<4;i++){
            A.cool[i]-=dt;const I=inp(i);if(I?.l)A.wires[i]=(A.wires[i]+2)%3;if(I?.r)A.wires[i]=(A.wires[i]+1)%3;
            if(i===0){if(I?.a)A.block=A.wires[0];else if(!I&&next&&A.cool[0]<=0){A.block=A.wires[0]=next.wire;A.cool[0]=[.4,.25,.12][G.diff];}}
            else if(A.cool[i]<=0&&(I?I.a:true)){
              if(!I)A.wires[i]=ri(3);A.cool[i]=2.4;const wait=[1,.8,.65][G.diff];
              A.pulses.push({wire:A.wires[i],left:wait,total:wait,m:prop(A,[pt(S.ball(.25,10),0xffdd72,0,0,0),pt(S.tor(.32,.035,4,10),0xfff2b5,0,0,0)])});
            }
            const a=A.acts[i];a.x=-4+(i?A.wires[i]:A.block)*4+(i?(i-2)*.24:0);a.z=i?4.5:-4.8;
          }
          A.pulses=A.pulses.filter(p=>{p.left-=dt;p.m.position.set(-4+p.wire*4,.5,-4+8*p.left/p.total);p.m.rotation.y+=dt*5;
            if(p.left<=0){const stopped=p.wire===A.block;if(stopped)A.stopped++;else A.good++;effect(A.acts[0],stopped?0x93dfa7:0xef8a81);p.m.visible=false;return false;}return true;});
          A.sc=[A.stopped,A.good,A.good,A.good];if(A.good>=12||A.stopped>=12){A.win=A.good>=12?[1,2,3]:[0];A.done=true;}},
        timeup(A){A.win=A.stopped>=A.good?[0]:[1,2,3];},lab:(A,i)=>i?'WIRE '+(A.wires[i]+1):'BLOCK '+(A.block+1),
        hud(A){if(A.phase==='play'){ctr('STOPPED '+A.stopped+' / SENT '+A.good,160,10,'#ffdf96');const p=A.pulses.slice().sort((a,b)=>a.left-b.left)[0];if(p)ctr('INCOMING: WIRE '+(p.wire+1),160,25,'#fff');}},cam:A=>arenaCam(A,0,15,17,0,.5,0)};
      MG_ORDER.push('hedge','fishing','bowling','dig','snow','rhythm','trace','hurdles','meteor','tiles','golf','hide','stomp','rowing','kitchen','lift','wire');

      MG.marble={n:'MARBLE MISCHIEF',secret:true,col:'#b4d1a1',song:'mgC',time:45,
        desc:'THE COUNT\'S SECRET TABLETOP! TILT YOUR MARBLE THROUGH THE WOODEN MAZE. MOMENTUM MATTERS: LEAN BACK TO BRAKE BEFORE CORNERS. REACH THE BRASS CUP!',
        ctl:[['stick','TILT AND COUNTER-STEER']],goal:'ROLL INTO THE CUP FIRST',icon:attractionIcon('#89a17a','O'),
        init(A){pavilion(A,'fair');A.walls=[[-3,0,.5,8],[1,.5,.5,7],[4,-2,.5,6]];A.route=[[-6,-4.7],[-1,-4.7],[-1,4.8],[3,4.8],[6,4.8],[6,-4.5]];A.way=[0,0,0,0];A.balls=[];const q=[];for(const [x,z,w,d]of A.walls)q.push(pt(S.box(w,.7,d),0x98663f,x,.35,z));q.push(pt(S.cyl(.8,.8,.04,20),0xcba85b,6,.13,-4.5));mgMesh(q);A.acts.forEach((a,i)=>{a.x=-6+(i-1.5)*.25;a.z=4.3;a.vis=false;A.balls.push(prop(A,[pt(S.ball(.35,12),CHARS[P[i].ci].col,0,0,0),pt(S.tor(.35,.04,4,12),0xffedbd,0,0,0)]));});},
        tick(A,dt,live){if(!live)return;A.acts.forEach((a,i)=>{a.vis=false;const I=inp(i),target=A.route[Math.min(A.way[i],A.route.length-1)],v=I?[I.x,I.z]:[clamp((target[0]-a.x)*2-a.vx*2,-1,1),clamp((target[1]-a.z)*2-a.vz*2,-1,1)],ox=a.x,oz=a.z;a.vx=(a.vx+v[0]*dt*6)*Math.exp(-dt*.6);a.vz=(a.vz+v[1]*dt*6)*Math.exp(-dt*.6);a.x=clamp(a.x+a.vx*dt,-7.3,7.3);a.z=clamp(a.z+a.vz*dt,-5.2,5.2);for(const [x,z,w,d]of A.walls)if(Math.abs(a.x-x)<w/2+.35&&Math.abs(a.z-z)<d/2+.35){if(Math.abs(ox-x)>=w/2+.34){a.x=ox;a.vx*=-.35;}else{a.z=oz;a.vz*=-.35;}}const m=A.balls[i];m.position.set(a.x,.4,a.z);m.rotation.x+=a.vz*dt;m.rotation.z-=a.vx*dt;if(Math.hypot(a.x-target[0],a.z-target[1])<.45)A.way[i]++;A.sc[i]=A.way[i]*10;if(Math.hypot(a.x-6,a.z+4.5)<.65){A.win=[i];A.done=true;}});},timeup:topScores,lab:(A,i)=>A.way[i]+'/6 FLAGS',cam:A=>arenaCam(A,0,19,12,0,0,0)};
      MG_ORDER.push('marble');

      // ================================================================ the party stage crowd (title and picking), the podium
      const STY = 1.21;
      const LOB = CHARS.map((c, i) => { const a = actor(c.id); a.x = STAGE.x + 6.25 - i * 2.5; a.z = STAGE.z + 0.6 - Math.abs(i - 2.5) * 0.35; a.y = a.gy = STY; a.ry = Math.PI; a.hop = rnd() * 3; return a; });
      const HOSTA = actor('host'); Object.assign(HOSTA, { x: STAGE.x, z: STAGE.z + 3.2, y: STY, gy: STY, ry: Math.PI, sc: 1.25 });
      const POD = new T.Group(); BG.add(POD); POD.visible = false;
      const podBlocks = [[0, 1.7, 0xffc81a, '1'], [2.4, 1.15, 0xc8ccdc, '2'], [-2.4, 0.75, 0xd88a4a, '3']].map(([x, h, c, n]) => {
        const t = T3.tex(64, 64, (g) => { g.fillStyle = hex(c); g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, 64, 6); g.font = '900 40px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(n, 34, 37); g.fillStyle = '#fff'; g.fillText(n, 32, 34); });
        const side = T3.mat({ color: c }), front = T3.mat({ map: t });
        const m = new T.Mesh(T3.keep(new T.BoxGeometry(2.2, h, 2)), [side, side, T3.mat({ color: shade(c, 1.1) }), side, side, front]);
        m.position.set(STAGE.x + x, STY - h / 2, STAGE.z); POD.add(m); return { m, h, x };
      });
      function lobbyVis(on) { for (const a of LOB) { a.vis = on; a.m.root.visible = a.m.sh.visible = on; } HOSTA.vis = on; HOSTA.m.root.visible = HOSTA.m.sh.visible = on; }
      function lobbyTick(dt, sel) {
        LOB.forEach((a, i) => {
          a.hop -= dt; a.vy -= 24 * dt; a.y += a.vy * dt; if (a.y <= STY) { if (a.vy < -3) squash(a, -6); a.y = STY; a.vy = 0; }
          if (a.hop <= 0) { a.hop = 1.5 + rnd() * 3; if (sel == null) { a.vy = 5 + rnd() * 2; squash(a, 4); } }
          const want = sel === i ? Math.PI + Math.sin(clock * 1.4) * 0.6 : Math.PI;
          a.ry += wrapA(want - a.ry) * Math.min(1, dt * 4);
          if (sel === i && a.y <= STY && (frame % 50) === 0) { a.vy = 4.5; squash(a, 4); }
          a.z += ((STAGE.z + 0.6 - Math.abs(i - 2.5) * 0.35 - (sel === i ? 1.2 : 0)) - a.z) * Math.min(1, dt * 6);
          pose(a, dt);
        });
        HOSTA.walk += dt * 4; HOSTA.mv = 0.3; pose(HOSTA, dt);
      }

      // ================================================================ modes: title, menus, picking, the game
      let SOLO=false, houseI=0, boardI=SAVE.board||0, soloNotice='';
      let MODE = 'title', menuI = 0, SEL = SAVE.char >= 0 ? SAVE.char : 0, optI = 0, paused = false, pauseI = 0, OVER = false;
      let ROUL = null, RES = null, LEG = null, legHi = -1;
      const titleItems = () => (SAVE.game ? ['CONTINUE'] : []).concat(['NEW PARTY', 'MINIGAME HOUSE', 'SOLO EXPEDITION', 'HOW TO PLAY', 'PARTY LEGENDS']);
      function makePlayer(o) {
        const p = Object.assign({ coins: 10, stars: 0, at: 0, items: [], st: { mgw: 0, max: 10, happen: 0, blue: 0, red: 0 }, left: 0 }, o);
        p.items = (p.items || []).slice(); p.st = Object.assign({ mgw: 0, max: 10, happen: 0, blue: 0, red: 0 }, p.st);
        p.a = actor(CHARS[p.ci].id); p.a.y = p.a.gy = SPY;
        return p;
      }
      function clearPlayers() { for (const p of P) { T3.scene.remove(p.a.m.root); T3.scene.remove(p.a.m.sh); } P = []; }
      function newGame() {
        if(!SOLO)delete SAVE.party;
        clearPlayers();
        const taken = { [SEL]: 1 }, others = [1, 2, 3].sort(() => rnd() - 0.5).slice(0, 2), mates = [0].concat(others);
        const list = [{ name: castName('me'), ci: SEL, cpu: false, mate: -1 }];
        for (const mi of mates) { let ci = MATES[mi].fav; if (taken[ci]) { const free = CHARS.map((c, i) => i).filter(i => !taken[i]); ci = pick(free); } taken[ci] = 1; list.push({ name: MATES[mi].n, ci, cpu: true, mate: mi }); }
        P = list.map(makePlayer);
        G = { board: SAVE.board || 0, events: 0, jackpot:9, turns: TURNS[SAVE.turns], turn: 1, diff: SAVE.diff, order: [0, 1, 2, 3], cur: 0, phase: 'intro', starAt: -1, last3: false, mgPlayed: 0, mgHist: [], sulk: SEL === MATES[0].fav };
        for (const p of P) { const [x, z] = standPos(p); p.a.x = x; p.a.z = z; }
        applyBoard(G.board); SAVE.char = SEL; store();
        if(SOLO) { startSingle('solo',soloRoute()[SAVE.expedition.node % soloRoute().length]);return; }
        startParty(false);
      }
      function continueGame() {
        const s = SAVE.game; if (!s) return newGame(); if(s.tape!==undefined&&restoreJournal(s))return;
        clearPlayers();
        G = JSON.parse(JSON.stringify(s.G)); P = s.P.map((p,i)=>makePlayer(Object.assign({},p,{name:i===0?castName('me'):MATES[p.mate>=0?p.mate:i-1].n})));  applyBoard(G.board);
        const st = G.starAt; G.starAt = -1; setStar(st >= 0 ? st : STAR_SPOTS[0]);
        for (const p of P) { const [x, z] = standPos(p); p.a.x = x; p.a.z = z; }
        snapshot(G.phase);startParty(true);captureAnchor();
      }
      function startParty(resume) {
        MODE = 'game'; lobbyVis(false); POD.visible = false; paused = false; OVER = false; CONF = false;
        DLG = MENU = BAN = CH = ROUL = RES = LEG = null; BUB.length = 0; FT.length = 0; HINT = '';
        run(party(resume));
      }
      function toTitle() {
        if (A) mgEnd();
        SCR = null; WAIT = null; DLG = MENU = BAN = CH = ROUL = RES = LEG = null; BUB.length = 0; FT.length = 0; HINT = ''; JUNC = null; FOCUS = null; MAPV = false; hurry = false;
        for (const d of DICE) { d.on = false; d.m.visible = false; } ARROWS.forEach(m => { m.visible = false; });
        clearPlayers(); if (G && G.starAt >= 0) setStar(-1); G = null;
        STAR.userData.fly=false;STAR.scale.setScalar(1);STAR.visible=starRing.visible=false;POD.visible = false; CONF = false; lobbyVis(true);Object.assign(HOSTA,{x:STAGE.x,z:STAGE.z+3.2,y:STY,gy:STY,ry:Math.PI,sc:1.25}); LOB.forEach((a, i) => { a.x = STAGE.x + 6.25 - i * 2.5; a.y = STY; });
        MODE = 'title'; menuI = 0; paused = false;journal=null;pendingAnchor=false;if(SAVE.game)SAVE.game.active=false;store();K.music(SONGS.title);
        CAM.snap = true;
      }

      function soloRoute(){return MG_ORDER.filter(id=>!MG[id].secret);}
      function startSingle(kind,id) {
        if(SAVE.game && !SAVE.game.G.kind)SAVE.party=SAVE.game;
        if(A)mgEnd();clearPlayers();
        const chosen=SEL,used=new Set([chosen]);P=[makePlayer({name:castName('me'),ci:chosen,cpu:false,mate:-1})];
        for(let i=0;i<3;i++){let ci=MATES[i].fav;if(used.has(ci))ci=CHARS.findIndex((c,k)=>!used.has(k));used.add(ci);P.push(makePlayer({name:MATES[i].n,ci,cpu:true,mate:i}));}
        G={kind,mgId:id,board:SAVE.board||0,phase:'single',turn:1,turns:1,cur:0,diff:SAVE.diff,order:[0,1,2,3],starAt:-1,mgPlayed:0,mgHist:[]};
        MODE='game';lobbyVis(false);paused=false;OVER=CONF=false;POD.visible=false;FOCUS=null;MAPV=false;HINT='';JUNC=null;DLG=MENU=BAN=ROUL=RES=CH=LEG=null;BUB.length=FT.length=0;
        snapshot('single');run(singleFlow(kind,id,false));
      }
      function* singleFlow(kind,id,resume) {
        mgBegin(id);yield ()=>A&&A.phase==='over'?true:undefined;
        const won=A.win.includes(0),score=A.sc[0];if(!rebuilding)SAVE.seen[id]=true;
        const record=SAVE.records[id]||{plays:0,wins:0,best:0};if(!rebuilding){record.plays++;if(won)record.wins++;record.best=Math.max(record.best,score);SAVE.records[id]=record;}
        mgEnd();
        if(kind==='solo'){
          const e=SAVE.expedition;
          if(won){e.cleared.push(id);e.node++;soloNotice='STAGE CLEAR! THE NEXT GATE IS OPEN.';}
          else{e.lives=Math.max(0,e.lives-1);soloNotice=e.lives?'TRY AGAIN. COUNT CRUMBLE IS SMIRKING!':'OUT OF LIVES! RESTOCK TO TRY THIS STAGE AGAIN.';}
          if(e.node>=soloRoute().length){e.complete=true;yield* expeditionEnding();}
        }
        SAVE.game=SAVE.party||null;delete SAVE.party;journal=null;pendingAnchor=false;flush();
        toTitle();MODE=kind==='solo'?'expedition':'house';store();
      }
      function* expeditionEnding(){
        lobbyVis(true);camTo(0,7,STAGE.z-15,0,2,STAGE.z,2,true);CONF=true;
        const lines=[['THE CRUMBLE HAS CRUMBLED!','YOU SAVED THE JELLYBEAN JUBILEE.'],['A PARTY BY JELLYBEAN SOFT','ORIGINAL CODE, MODELS AND TUNES'],['SPECIAL THANKS','TO EVERY PAD THAT SURVIVED.'],['THE END','THE PARTY NEVER REALLY ENDS!']];
        for(const [a,b]of lines){banner(a,b,'#ffd23a',5);yield 5;}
        CONF=false;SAVE.expedition.complete=true;SAVE.unlocks.marble=true;yield* host('THE SECRET MARBLE MISCHIEF DOOR IS OPEN IN THE MINIGAME HOUSE!');
      }
      // ---------------------------------------------------------------- the party itself
      function* party(resume) {
        K.music(G.last3 ? SONGS.last : SONGS.board);
        if (G.phase === 'intro') { if(!resume) snapshot('intro'); yield* intro(); G.phase = 'turn'; }
        if (G.phase !== 'final') {
          while (G.turn <= G.turns) {
            if (G.phase === 'turn') {
              if (G.cur === 0 && !resume) {
                applyBoard(G.board);
                if (G.turn === G.turns - 2 && !G.last3) yield* lastThree();
                focusOn(P[G.order[0]]); banner('TURN ' + G.turn + ' OF ' + G.turns, G.turn === G.turns ? 'THE VERY LAST TURN!' : '', '#ffd23a', 1.7); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75]], { bpm: 360, vol: 0.07 }); yield 1.8;
              }
              while (G.cur < 4) { if (!resume) snapshot('turn'); yield* playerTurn(P[G.order[G.cur]]); resume=false; G.cur++; }
              G.phase = 'mg';
            }
            if(!resume) snapshot('mg');
            yield* minigameRound(); resume=false;
            G.turn++;if(G.board===1)G.jackpot=(G.jackpot||0)+9;if(G.board===2)G.priceDiscount=0;G.cur = 0;G.phase = 'turn';
          }
        }
        if(!resume) snapshot('final');
        yield* finale();
      }
      function* intro() {
        camTo(0, 48, 44, 0, 0, -2, 1, true); FOCUS = null;
        yield 0.8;
        yield* host('WELCOME TO WOBBLE ISLAND! I\'M MC WOBBLE, YOUR HOST WITH THE MOST. (PRESS ' + keyName('a') + ')');
        focusOn(P[0], 1.2);
        if (G.sulk) { bubble(P[1], 'OI! I ALWAYS HAVE THE FROG!', 2.6); yield* say(P[0].name + '! I ALWAYS HAVE THE FROG! FINE. I\'LL BE ' + CHARS[P[1].ci].n + '...', PORT[CHARS[P[1].ci].id], P[1].name); }
        yield* host('WHOEVER HAS THE MOST STARS AT THE END WINS. I\'LL SWAP YOU A STAR FOR ' + starCost() + ' COINS.');
        yield* host('BLUE SPACES GIVE YOU 3 COINS, RED ONES TAKE 3 AWAY. AFTER EVERY TURN THERE\'S A MINIGAME: WIN IT FOR 10 COINS!');
        yield* host('WIN EVERY SINGLE MINIGAME AND YOU\'RE A PROPER LEGEND. RIGHT, LET\'S SEE WHO GOES FIRST!');
        yield* orderRoll();
        setStar(pick(STAR_SPOTS.filter(id => id > 1)));
        const s = SP[G.starAt]; FOCUS = null; camTo(s.x, SPY + 12, s.z + 14, s.x, SPY + 1, s.z, 1.6);
        yield 1.4;
        yield* host('AND THE FIRST STAR IS... OVER THERE! GO AND GET IT!', { auto: 2.2 });
        focusOn(P[G.order[0]], 2);
        yield 0.8;
      }
      function* orderRoll() {
        focusOn(P[0]); camTo(SP[0].x, SPY + 6, SP[0].z + 8.5, SP[0].x, SPY + 1.4, SP[0].z, 2);
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => rnd() - 0.5).slice(0, 4);
        P.forEach((p, i) => { const d = DICE[i]; Object.assign(d, { on: true, stop: false, owner: p, dx: 0, jy: 0, pop: 0, n: 0, t: 0 }); d.m.material = diceMats[0]; p.a.jt = -1; p.a.ht = isBot(i) ? 0.6 + rnd() * 1.4 : 99; });
        HINT = 'PRESS ' + keyName('a') + ' TO HIT YOUR BLOCK!';
        yield dt => {
          let all = true;
          P.forEach((p, i) => {
            const a = p.a, d = DICE[i];
            if (a.jt < 0 && !d.stop) { a.ht -= dt; if ((isBot(i) && a.ht <= 0) || (!isBot(i) && K.pressed('a'))) { a.jt = 0; a.busy = true; squash(a, 6); } }
            if (a.jt >= 0) { a.jt += dt; const u = Math.min(1, a.jt / 0.34); a.y = SPY + Math.sin(u * Math.PI) * 1.2; if (u > 0.5 && !d.stop) { d.stop = true; d.n = nums[i]; d.m.material = diceMats[d.n]; d.jy = 0.5; K.sfx.tone(880, 0.08, 'square', 0.08); } if (u >= 1) { a.jt = -2; a.y = SPY; a.busy = false; squash(a, -7); } }
            if (!d.stop || a.jt >= 0) all = false;
          });
          return all ? true : undefined;
        };
        HINT = '';
        yield 1;
        for (const d of DICE) if (d.on) d.pop = 0.5;
        G.order = [0, 1, 2, 3].sort((a, b) => nums[b] - nums[a]);
        yield 0.6;
        yield* host(P[G.order[0]].name + ' GOES FIRST, THEN ' + P[G.order[1]].name + ', ' + P[G.order[2]].name + ' AND ' + P[G.order[3]].name + '. EVERYBODY STARTS WITH 10 COINS.', { auto: 2.6 });
      }
      function* lastThree() {
        K.music(null); FOCUS = null;
        camTo(0, 40, 38, 0, 0, -2, 1.5);
        banner('LAST THREE TURNS!', 'THINGS ARE HOTTING UP', '#ff6a5a', 2); K.sfx.seq([[67, 0.5], [72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 240, vol: 0.09 });
        yield 2;
        yield* host('ONLY THREE TURNS LEFT! FROM NOW ON, BLUE AND RED SPACES COUNT DOUBLE!', { auto: AUTO ? AUTOWAIT : false });
        const last = P.slice().sort((a, b) => rankOf(b) - rankOf(a))[0];
        focusOn(last, 2); yield 0.8;
        yield* host(last.name + ' IS IN LAST PLACE... HAVE 10 COINS TO CATCH UP!', { auto: 2 });
        gain(last, 10); yield 1;
        G.last3 = true; K.music(SONGS.last);
      }
      function* playerTurn(p) {
        hurry = p.cpu; focusOn(p, 3); if (p.cpu) CAM.k = 3;
        banner(p.name + '\'S TURN', CHARS[p.ci].n + (p.cpu ? '' : ' - THAT\'S YOU!'), CHARS[p.ci].css, 1.4);
        K.sfx.seq([[76, 0.25], [79, 0.25], [84, 0.5]], { bpm: 420, vol: 0.06 }); yield 1.25;
        let nd = 1;
        if (!p.cpu) {
          for (;;) {
            const c = yield* choose(['ROLL THE DICE', 'ITEMS' + (p.items.length ? ' (' + p.items.length + ')' : ' (NONE)'), 'LOOK AT THE MAP'], { y: 46 });
            if (c === 0) break;
            if (c === 1) {
              if (!p.items.length) { yield* host('YOU HAVEN\'T GOT ANY ITEMS. THE SHOP SELLS THEM!'); continue; }
              const i = yield* choose(p.items.map(k => ITEMS[k].n).concat(['BACK']), { y: 46, back: true, desc: p.items.map(k => ITEMS[k].d).concat(['']) });
              if (i < 0 || i >= p.items.length) continue;
              const r = yield* useItem(p, p.items[i]); if (r === 'twin') { nd = 2; break; } continue;
            }
            yield* mapView(p);
          }
        } else {
          yield 0.4;
          const u = cpuItem(p); if (u) { const r = yield* useItem(p, u); if (r === 'twin') nd = 2; }
        }
        const n = yield* roll(p, nd);
        yield* move(p, n);
        yield* land(p);
        p.a.busy = false;
        hurry = false;
      }
      // ---- minigame time: the roulette, the card, the game, the coins
      function* minigameRound() {
        hurry = false; FOCUS = null; K.music(SONGS.card);
        camTo(0, 44, 40, 0, 0, -2, 1.4);
        banner('MINIGAME TIME!', 'EVERYBODY PLAYS', '#ffd23a', 1.6); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [79, 0.25], [84, 0.75]], { bpm: 420, vol: 0.08 });
        yield 1.7;
        const recent = G.mgHist.slice(-3).map(h => h.id), pool = MG_ORDER.filter(id => !recent.includes(id)&&(!MG[id].secret||SAVE.unlocks.marble));
        const teamRoll=rnd();const format=teamRoll<.24?'1 V 3':teamRoll<.48?'2 V 2':null;const formatPool=pool.filter(id=>(MG[id].team||null)===format);const target = MG_ORDER.indexOf(pick(formatPool.length?formatPool:pool.length ? pool : MG_ORDER));
        ROUL = { sel: ri(MG_ORDER.length), t: 0, step: 0.06, stopping: false, done: false, blink: 0, target, auto: 4 + rnd() };
        HINT = 'PRESS ' + keyName('a') + ' TO STOP THE ROULETTE!';
        yield dt => {
          const R = ROUL;
          if (R.done) { R.blink += dt; return R.blink > 1.3 ? true : undefined; }
          R.auto -= dt;
          if (!R.stopping && (K.pressed('a') || R.auto <= 0 || AUTO)) { R.stopping = true; HINT = ''; }
          R.t += dt;
          if (R.t >= R.step) { R.t = 0; if (R.stopping && R.step > 0.28 && R.sel === R.target) { R.done = true; K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.75]], { bpm: 420, vol: 0.09 }); return undefined; } R.sel = (R.sel + 1) % MG_ORDER.length; K.sfx.tone(1200, 0.03, 'square', 0.04); if (R.stopping) R.step = Math.min(0.32, R.step * 1.16); }
          return undefined;
        };
        HINT = '';
        const id = MG_ORDER[ROUL.target]; ROUL = null;
        FLASH = 1; yield 0.12;
        mgBegin(id);
        yield () => (A && A.phase === 'over' ? true : undefined);
        const win = A.win.slice();
        mgEnd();
        G.mgPlayed++; G.mgHist.push({ id, win }); win.forEach(i => { P[i].st.mgw++; });
        K.music(G.last3 ? SONGS.last : SONGS.board);
        FLASH = 1;
        camTo(0, 40, 36, 0, 0, -2, 2, true);
        yield 0.5;
        if (win.length) { for (const i of win) { gain(P[i], 10, true); } K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.5]], { bpm: 480, vol: 0.07 }); const p = P[win[0]]; focusOn(p, 2.5); yield* host(win.map(i => P[i].name).join(' AND ') + (win.length > 1 ? ' EACH GET' : ' GETS') + ' 10 COINS!', { auto: 1.6 }); }
        else yield* host('NOBODY WON THAT ONE. NO COINS!', { auto: 1.4 });
      }
      function drawRoulette() {
        if(!ROUL)return;
        H.fillStyle='rgba(12,8,40,.5)';H.fillRect(0,0,W,HH);panel(12,20,296,202,{c1:'#4a3ab8',c2:'#170d4d'});
        bigText('MINIGAME ROULETTE',160,30,2,'#ffd23a',2);
        for(let row=-2;row<=2;row++){
          const id=MG_ORDER[(ROUL.sel+row+MG_ORDER.length)%MG_ORDER.length],d=MG[id],y=108+row*23,on=row===0;
          H.fillStyle=on?'#7251a6':'#28235d';rr(H,25,y-5,270,21,4);H.fill();
          if(on){H.strokeStyle='#ffd23a';H.stroke();}H.save();H.translate(43,y+4);H.scale(.7,.7);d.icon(H,0,0);H.restore();ctr(d.n,173,y,on?'#ffe69a':'#b2bee9');
        }
        const d=MG[MG_ORDER[ROUL.sel]];ctr(d.team||'FREE FOR ALL',160,179,'#a4edb9');
        ctr(ROUL.done?'THIS ONE!':ROUL.stopping?'SLOWING DOWN...':keyName('a')+': STOP THE WHEEL',160,201,'#fff');
      }
      // ---- the end: bonus stars, the podium, the scores
      function* drumroll(t) { let c = 0, n = 0; yield dt => { c += dt; while (n < c / 0.06) { K.sfx.noise(0.05, 0.05 + n * 0.002, 900); n++; } return c > t ? true : undefined; }; K.sfx.noise(0.3, 0.15, 3000); }
      function* finale() {
        hurry = false; K.music(null); FOCUS = null;
        banner('THAT\'S THE LAST TURN!', '', '#ffd23a', 1.8); K.sfx.seq([[72, 0.5], [72, 0.25], [72, 0.25], [79, 1]], { bpm: 200, vol: 0.08 }); yield 1.9;
        yield* host('WHAT A PARTY! EVERYBODY TO THE PARTY STAGE FOR THE BONUS STARS!', { auto: AUTO ? AUTOWAIT : false });
        FLASH = 1; yield 0.1;
        // everyone on the stage, in a row
        const row = i => STAGE.x - 3.75 + i * 2.5;
        P.forEach((p, i) => { Object.assign(p.a, { busy: true, x: row(i), z: STAGE.z + 0.5, y: STY, gy: STY, ry: Math.PI }); });
        const stageCam = (k) => camTo(STAGE.x, STY + 3.2, STAGE.z - 8.6, STAGE.x, STY + 1.5, STAGE.z + 0.4, k || 3);
        stageCam(); CAM.snap = true; K.music(SONGS.stage);
        lobbyVis(false); HOSTA.vis = true; HOSTA.m.root.visible = HOSTA.m.sh.visible = true; HOSTA.x = STAGE.x - 5.4; HOSTA.z = STAGE.z + 1.6; HOSTA.y = HOSTA.gy = STY; HOSTA.ry = Math.PI + 0.5;
        yield 0.6;
        const B = [['MINIGAME STAR', 'WON THE MOST MINIGAMES', 'mgw'], ['COIN STAR', 'HAD THE MOST COINS AT ONCE', 'max'], ['HAPPENING STAR', 'LANDED ON THE MOST ! SPACES', 'happen']];
        for (const [nm, why, key] of B) {
          const best = Math.max(...P.map(p => p.st[key]));
          yield* host('THE ' + nm + ' GOES TO WHOEVER ' + why + '...', { auto: AUTO ? AUTOWAIT : 1.8 });
          if (best <= 0) { yield* host('...NOBODY! NO ' + nm + ' THIS TIME.', { auto: 1.6 }); continue; }
          yield* drumroll(1.1);
          const ws = P.filter(p => p.st[key] === best);
          ws.forEach(p => { p.stars++; puff(p.a.x, p.a.y + 1.5, p.a.z, [0xffd23a, 0xfff4a0, 0xffffff], 30, { sp: 4, up: 6 }); p.a.vy = 0; });
          K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 300, vol: 0.09 });
          banner(nm + '!', ws.map(p => p.name).join(' & '), '#ffd23a', 1.8);
          let t = 0; yield dt => { t += dt; ws.forEach(p => { p.a.y = STY + Math.abs(Math.sin(t * 6)) * 0.8; }); return t > 1.9 ? true : undefined; };
          ws.forEach(p => { p.a.y = STY; });
        }
        // the ranking (ties share a place)
        const place = p => P.filter(q => q.stars > p.stars || (q.stars === p.stars && q.coins > p.coins)).length;
        const order = P.slice().sort((a, b) => place(a) - place(b));
        yield* host('AND NOW... THE WINNER OF THIS WOBBLE PARTY IS...', { auto: AUTO ? AUTOWAIT : 1.8 });
        POD.visible = true; podBlocks.forEach(b => { b.m.position.y = STY - b.h / 2 - 0.05; });
        const spots = [[0, 1.7], [2.4, 1.15], [-2.4, 0.75]];
        let t = 0;
        yield* drumroll(1.6);
        // up they go
        const tops = order.map((p, k) => { const pl = place(p); if (pl < 3) { const sp = spots[pl]; return [STAGE.x + sp[0] + (order.filter(q => place(q) === pl).indexOf(p) - (order.filter(q => place(q) === pl).length - 1) / 2) * 0.9, STY + sp[1]]; } return [STAGE.x + 4.9, STY]; });
        order.forEach((p, k) => { p.a.x = tops[k][0]; p.a.z = STAGE.z + (place(p) < 3 ? 0 : 1); });
        t = 0;
        yield dt => { t += dt; const u = ease(t / 1.2); podBlocks.forEach(b => { b.m.position.y = STY + b.h / 2 - (b.h + 0.05) * (1 - u); }); order.forEach((p, k) => { p.a.y = lerp(STY, tops[k][1], u); p.a.gy = p.a.y; }); return t > 1.3 ? true : undefined; };
        const champ = order[0], mePl = place(me());
        K.music(null); K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [79, 0.5], [84, 0.5], [88, 0.5], [91, 2]], { bpm: 240, vol: 0.1 });
        FLASH = 0.8;
        banner(champ.name + '!', CHARS[champ.ci].n + ' IS THE SUPERSTAR!', '#ffd23a', 2.6);
        order.forEach(p => { if (place(p) === 3) p.a.sad = 1; });
        quip(champ, 'win'); order.slice(1).forEach(p => { if (rnd() < 0.6) quip(p, 'lose'); });
        CONF = true;
        t = 0; yield dt => { t += dt; order.forEach((p, k) => { if (place(p) === 0) { p.a.y = tops[k][1] + Math.abs(Math.sin(t * 5)) * 0.7; } }); return t > 2.8 ? true : undefined; };
        K.music(SONGS.stage);
        // the score (for the high-score table and JackNet)
        const m = me(), base = [4000, 2000, 800, 0][mePl];
        let score = base + m.stars * 1000 + m.coins * 10 + m.st.mgw * 100;
        score = Math.max(0, Math.min(30000, score, Math.floor((clock + 4) * 58)));
        if (mePl === 0) {if(!rebuilding){SAVE.boardWins=SAVE.boardWins||{};SAVE.boardWins[G.board||0]=(SAVE.boardWins[G.board||0]||0)+1;K.secret('lk.party.star');}}
        const sweep = G.mgPlayed >= G.turns && m.st.mgw >= G.mgPlayed;
        if (sweep) !rebuilding && K.secret('lk.party.sweep');
        RES = { order, place, score, base, sweep, mePl };
        yield* host(mePl === 0 ? 'WELL DONE, ' + m.name + '! YOU\'RE THE WOBBLE SUPERSTAR!' : 'BAD LUCK, ' + m.name + '! ' + ORD[mePl] + ' PLACE THIS TIME.', { auto: AUTO ? AUTOWAIT : false });
        if (sweep) yield* host('AND YOU WON EVERY SINGLE MINIGAME! A CLEAN SWEEP! LEGENDARY!', { auto: AUTO ? AUTOWAIT : false });
        // the results table
        RES.show = true;
        { let tw = 0; yield dt => (K.pressed('a') || (AUTO && (tw += dt) > AUTOWAIT * 4) ? true : undefined); }
        RES.show = false;
        // the Party Legends table
        const entry = { n: m.name, s: score, c: m.ci, me: true };
        const hall = SAVE.hall.concat([entry]).sort((a, b) => b.s - a.s).slice(0, 8);
        legHi = hall.indexOf(entry);
        if(!rebuilding)SAVE.hall = hall.map(e => ({ n: e.n, s: e.s, c: e.c })); store();
        LEG = true;
        { let tw = 0; yield dt => (K.pressed('a') || (AUTO && (tw += dt) > AUTOWAIT * 4) ? true : undefined); }
        LEG = null;
        yield* partyCredits();
        OVER = true;SAVE.game=null;journal=null;store();
        if(!rebuilding) K.over(score, { title: mePl === 0 ? 'SUPERSTAR!' : ORD[mePl] + ' PLACE', text: m.stars + (m.stars === 1 ? ' STAR, ' : ' STARS, ') + m.coins + ' COINS, ' + m.st.mgw + (m.st.mgw === 1 ? ' MINIGAME WON (' : ' MINIGAMES WON (') + G.turns + ' TURNS, ' + DIFF[G.diff] + ')' + (sweep ? ' CLEAN SWEEP!' : '') });
      }
      function* partyCredits(){
        for(const [title,sub]of [['THANKS FOR WOBBLING!','A JELLYBEAN SOFT PRODUCTION'],['PARTY ENGINEERING','DICE INSPECTED FOR EXTRA CORNERS'],['CAST & CREW','YOUR MATES. THEIR TERRIBLE EXCUSES.'],['SEE YOU NEXT PARTY','(PLEASE RETURN ALL BORROWED PADS)']]){
          banner(title,sub,'#ffd23a',4);let t=0;yield dt=>{t+=dt;return t>3.5||(t>.5&&K.pressed('a'))?true:undefined;};
        }
      }
      let CONF = false;
      function drawResults() {
        if (!RES || !RES.show) return;
        const x = 18, y = 26, w = W - 36, h = 176;
        panel(x, y, w, h, { c1: '#3a4ae8', c2: '#120a4a' });
        ctr('FINAL RESULTS', W / 2, y + 7, '#ffd23a', 2);
        RES.order.forEach((p, k) => {
          const yy = y + 30 + k * 24, pl = RES.place(p);
          H.fillStyle = p === me() ? 'rgba(255,210,58,.22)' : 'rgba(0,0,0,.2)'; H.fillRect(x + 6, yy - 2, w - 12, 21);
          txt(ORD[pl], x + 10, yy + 5, pl === 0 ? '#ffd23a' : '#fff');
          H.drawImage(portOf(p), x + 36, yy - 1, 19, 19);
          fitText(p.name,x+60,yy+5,83,'#fff');
          H.drawImage(ICON.star, x + 150, yy + 2); txt(String(p.stars), x + 165, yy + 5, '#ffe680');
          H.drawImage(ICON.coin, x + 190, yy + 3); txt(String(p.coins), x + 204, yy + 5, '#fff');
          fitText(p.st.mgw+' WINS',x+230,yy+5,44,'#9af0a8');
        });
        const m = me(), yy = y + 130;
        fitText('PLACE '+RES.base+' + STARS '+m.stars*1000+' + COINS '+m.coins*10+' + WINS '+m.st.mgw*100,x+10,yy,w-20,'#c8d0ff');
        ctr('SCORE ' + RES.score, W / 2, yy + 14, '#fff', 2);
        if ((clock * 2 | 0) % 2) ctr('PRESS ' + keyName('a'), W / 2, y + h - 4, '#ffd23a');
      }
      function drawLegends(y0, hi) {
        const x = 30, w = W - 60, y = y0, h = 150;
        panel(x, y, w, h, { c1: '#e8502a', c2: '#5a0a3a' });
        ctr('PARTY LEGENDS', W / 2, y + 7, '#ffd23a', 2);
        SAVE.hall.slice(0, 8).forEach((e, i) => {
          const yy = y + 28 + i * 14, on = i === hi && (clock * 4 | 0) % 2;
          if (i === hi) { H.fillStyle = 'rgba(255,255,255,.2)'; H.fillRect(x + 6, yy - 3, w - 12, 13); }
          txt((i + 1) + '.', x + 12, yy, '#fff');
          const pc = PORT[CHARS[e.c] ? CHARS[e.c].id : 'host']; if (pc) H.drawImage(pc, x + 30, yy - 3, 12, 12);
          txt(e.n, x + 48, yy, on ? '#ffd23a' : '#fff');
          const s = String(e.s); txt(s, x + w - 12 - F.width(s), yy, '#ffe680');
        });
      }

      // ================================================================ the title screen
      function drawLogo(cy) {
        const g = H;
        // a starburst behind
        g.save(); g.translate(W / 2, cy + 18); g.rotate(clock * 0.15);
        for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,240,160,.16)' : 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 190, i / 16 * Math.PI * 2, (i + 1) / 16 * Math.PI * 2); g.fill(); }
        g.restore();
        // big chunky letters: a dark extrusion, a white rim, a shiny gradient face (each letter wobbles like jelly)
        const letter = (ch, x, y, size, c1, c2, ph) => {
          const wob = Math.sin(clock * 3 + ph), sy = 1 + wob * 0.06, rot = Math.sin(clock * 2.2 + ph * 1.3) * 0.05;
          g.save(); g.translate(x, y + wob * 2); g.rotate(rot); g.scale(1 - wob * 0.04, sy);
          g.font = '900 ' + size + 'px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
          for (let d = 6; d >= 1; d--) { g.fillStyle = d > 3 ? '#14042a' : '#3a0a5a'; g.fillText(ch, d * 0.5, d); }
          g.lineWidth = 7; g.strokeStyle = '#14042a'; g.strokeText(ch, 0, 0);
          g.lineWidth = 3.5; g.strokeStyle = '#ffffff'; g.strokeText(ch, 0, 0);
          const gr = g.createLinearGradient(0, -size * 0.45, 0, size * 0.4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, c1); gr.addColorStop(0.62, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillText(ch, 0, 0);
          g.restore();
        };
        const WC = [['#ff4a5a', '#a80a2a'], ['#ffaa2a', '#c8500a'], ['#ffe04a', '#d89a0a'], ['#4ad85a', '#1a8a2a'], ['#4aa8ff', '#1a4ac8'], ['#c45af0', '#6a1aa8']];
        const w1 = 'WOBBLE', sz1 = 40, step1 = 31;
        for (let i = 0; i < w1.length; i++) letter(w1[i], W / 2 - (w1.length - 1) * step1 / 2 + i * step1, cy + 16, sz1, WC[i][0], WC[i][1], i * 0.8);
        const w2 = 'PARTY', step2 = 25;
        for (let i = 0; i < w2.length; i++) letter(w2[i], W / 2 - 34 - (w2.length - 1) * step2 / 2 + i * step2, cy + 58, 32, '#ffe680', '#e88a0a', i * 0.8 + 2);
        const cc = [['#ff4a4a', '#a80a0a'], ['#4ad85a', '#0a7a1a'], ['#4a8aff', '#0a3aa8'], ['#ffd23a', '#c8820a']][(clock * 1.5 | 0) % 4];
        letter('6', W / 2 + 70, cy + 54, 44, cc[0], cc[1], 5); letter('4', W / 2 + 100, cy + 54, 44, cc[0], cc[1], 5.6);
      }
      function titleHud() {
        if(MODE==='boards'){
          const b=BOARDS[boardI];panel(12,12,296,216,{c1:'#324b9a',c2:'#130e40'});
          bigText('CHOOSE A BOARD',160,22,2,'#ffd23a',2);
          bigText('<',28,91,3,b.col,2);bigText('>',292,91,3,b.col,2);
          const pc=PORT[boardI===2?'sprout':boardI===1?'bolt':'host'];H.drawImage(pc,130,59,60,60);
          ctr(b.n,160,130,b.col,2);ctr(b.sub,160,152,'#fff');
          wrap(b.desc,44).forEach((l,i)=>ctr(l,160,170+i*11,'#d9e8ff'));
          ctr('BOARD WINS '+((SAVE.boardWins||{})[boardI]||0),160,201,'#b9e9b9');ctr(keyName('a')+': CHOOSE   '+keyName('b')+': BACK',160,215,'#ffd23a');return;
        }
        if(MODE==='house'){
          panel(8,8,304,224,{c1:'#384baf',c2:'#160c46'});bigText('MINIGAME HOUSE',160,18,2,'#ffd23a',2);
          const page=Math.floor(houseI/8),ids=MG_ORDER.slice(page*8,page*8+8);
          ids.forEach((id,i)=>{const d=MG[id],on=houseI===page*8+i,y=52+i*18;
            if(on){H.fillStyle='#6951a4';H.fillRect(17,y-3,286,17);}
            H.save();H.translate(32,y+3);H.scale(.55,.55);d.icon(H,0,0);H.restore();txt((on?'> ':'  ')+d.n,50,y,on?'#ffea84':'#fff');
            if(SAVE.seen[id])txt('*',290,y,'#ffd23a');
          });
          if(MG[MG_ORDER[houseI]].secret&&!SAVE.unlocks.marble)ctr('CLEAR THE EXPEDITION TO OPEN THIS DOOR',160,191,'#f0adbc');
          else ctr('PAGE '+(page+1)+'/'+Math.ceil(MG_ORDER.length/8)+'    '+(houseI+1)+'/'+MG_ORDER.length,160,191,'#9ed9ff');
          const rec=SAVE.records[MG_ORDER[houseI]]||{plays:0,wins:0,best:0};ctr('PLAYS '+rec.plays+'   WINS '+rec.wins+'   BEST '+Math.floor(rec.best),160,204,'#b9e9b9');
          ctr('ARROWS: CHOOSE   '+keyName('a')+': PLAY   '+keyName('b')+': BACK',160,220,'#fff');return;
        }
        if(MODE==='expedition'){
          const e=SAVE.expedition,route=soloRoute();panel(8,8,304,224,{c1:'#285e7e',c2:'#11263e'});
          bigText('CRUMBLE EXPEDITION',160,18,2,'#ffd23a',2);
          ctr('RESCUE THE JUBILEE FROM COUNT CRUMBLE!',160,41,'#fff');
          const page=Math.min(Math.floor(e.node/18),Math.ceil(route.length/18)-1);
          for(let i=page*18;i<Math.min(route.length,(page+1)*18);i++){
            const local=i-page*18,x=34+(local%6)*50,y=75+Math.floor(local/6)*34,done=i<e.node,on=i===e.node;
            H.strokeStyle='#b7a875';if(i%6<5&&i+1<route.length){H.beginPath();H.moveTo(x,y);H.lineTo(x+50,y);H.stroke();}
            H.fillStyle=done?'#ffd23a':on?'#fa8a6c':'#29445b';H.beginPath();H.arc(x,y,on?10:8,0,7);H.fill();
            ctr(done?'*':String(i+1),x,y-3,done?'#59411b':'#fff');
          }
          ctr(e.complete?'THE JUBILEE IS SAVED!':'STAGE '+(e.node+1)+': '+MG[route[e.node]].n,160,181,'#ffd23a');
          ctr('LIVES '+e.lives+'   STAMPS '+e.cleared.length+'/'+route.length+'   MAP '+(page+1)+'/3',160,197,'#bcebbd');
          ctr(soloNotice||keyName('a')+': '+(e.complete?'PLAY AGAIN':'SET OUT')+'   '+keyName('b')+': BACK',160,217,'#fff');return;
        }
        if (MODE === 'title') {
          drawLogo(28);
          if ((clock * 2 | 0) % 2) bigText('PRESS START', W / 2, 190, 2, '#fff', 2, '#2a0a4a');
          ctr('HI-SCORE ' + Math.max(K.best, SAVE.hall[0] ? SAVE.hall[0].s : 0), W / 2, 211, '#9ad8ff');
          ctr('(C) 1999 JELLYBEAN SOFT', W / 2, 222, '#e8ecff');
          return;
        }
        if (MODE === 'menu') {
          bigText('PARTY PAVILION', W / 2, 18, 2, '#ffd23a', 2, '#2a0a4a');
          const its = titleItems();
          panel(W / 2 - 86, 66, 172, its.length * 19 + 10, { c1: '#4a3ae8', c2: '#1a0a6a' });
          its.forEach((s, i) => { const on = i === menuI; if (on) { H.fillStyle = 'rgba(255,255,255,.18)'; H.fillRect(W / 2 - 80, 71 + i * 19, 160, 17); } ctr((on ? '> ' : '') + s + (on ? ' <' : ''), W / 2, 76 + i * 19, on ? '#ffd23a' : '#fff'); });
          if (SAVE.game && menuI === 0) { const g = SAVE.game.G; ctr('TURN ' + g.turn + ' OF ' + g.turns + ' - ' + SAVE.game.P[0].name + ' AS ' + CHARS[SAVE.game.P[0].ci].n, W / 2, 196, '#c8d0ff'); }
          ctr(keyName('a') + ': CHOOSE', W / 2, 222, '#e8ecff');
          return;
        }
        if (MODE === 'how') {
          panel(14, 14, W - 28, HH - 28, { c1: '#2a3ab8', c2: '#120a4a' });
          ctr('HOW TO PARTY', W / 2, 22, '#ffd23a', 2);
          ['YOU AND 3 COMPUTER MATES TAKE TURNS. HIT', 'THE DICE BLOCK WITH ' + keyName('a') + ' AND HOP ROUND THE BOARD.', '', 'BLUE: +3 COINS          RED: -3 COINS', '!: SOMETHING HAPPENS    ?: CHANCE TIME', 'SHOP: TWIN DICE, SWAP KAZOO, MAGNET', '', 'FIND THE STAR: READ THE PRICE, SAVE COINS.', 'IT MOVES AFTER A SALE. MOST STARS WINS!', '', 'EVERY TURN ENDS WITH A MINIGAME (+10 COINS).', 'HOLD ' + keyName('b') + ' TO HURRY THE COMPUTER UP.', 'START PAUSES. YOUR GAME IS SAVED.']
            .forEach((l, i) => txt(l, 26, 44 + i * 12, l.includes('BLUE') || l.includes('!') ? '#fff' : '#e0e6ff'));
          if ((clock * 2 | 0) % 2) ctr('PRESS ' + keyName('a'), W / 2, HH - 26, '#ffd23a');
          return;
        }
        if (MODE === 'legends') { drawLegends(30, -1); if ((clock * 2 | 0) % 2) ctr('PRESS ' + keyName('a'), W / 2, 196, '#ffd23a'); return; }
        if (MODE === 'select') {
          const c = CHARS[SEL];
          { const gr = H.createLinearGradient(0, 0, 0, 30); gr.addColorStop(0, 'rgba(40,20,120,.9)'); gr.addColorStop(1, 'rgba(40,20,120,0)'); H.fillStyle = gr; H.fillRect(0, 0, W, 34); }
          bigText('PICK YOUR PARTY PAL', W / 2, 8, 2, '#ffd23a', 2, '#2a0a4a');
          panel(W / 2 - 100, 168, 200, 52, { c1: c.css, c2: hex(shade(c.col, 0.35)) });
          bigText(c.n, W / 2, 174, 2, '#fff', 2, '#1a0a3a');
          ctr(c.what, W / 2, 194, '#ffe680'); ctr(c.line, W / 2, 205, '#fff');
          const ax = Math.sin(clock * 6) * 2;
          bigText('<', 26 - ax, 100, 3, '#ffd23a', 2, '#5a1a00'); bigText('>', W - 26 + ax, 100, 3, '#ffd23a', 2, '#5a1a00');
          if (SEL === MATES[0].fav) ctr(MATES[0].n + ' WANTED THE FROG. AWKWARD.', W / 2, 156, '#ffd0d0');
          ctr(keyName('a') + ': THIS ONE   ' + keyName('b') + ': BACK', W / 2, 226, '#e8ecff');
          return;
        }
        if (MODE === 'opts') {
          const c = CHARS[SEL];
          panel(30, 30, W - 60, 160, { c1: '#2a3ab8', c2: '#120a4a' });
          ctr('PARTY SETTINGS', W / 2, 38, '#ffd23a', 2);
          H.drawImage(PORT[c.id], 40, 60, 40, 40);
          const rows = [['PLAYER', castName('me')], ['TURNS', String(TURNS[SAVE.turns])], ['COMPUTER', DIFF[SAVE.diff]], ['', 'LET\'S PARTY!']];
          rows.forEach(([k, v], i) => {
            const y = 66 + i * 26, on = i === optI;
            if (on) { H.fillStyle = 'rgba(255,255,255,.15)'; H.fillRect(88, y - 5, W - 128, 18); }
            if (k) { txt(k, 94, y, '#c8d0ff'); ctr((on ? '< ' : '') + v + (on ? ' >' : ''), 236, y, on ? '#ffd23a' : '#fff'); }
            else bigText(v, 190, y - 2, 2, on ? '#ffd23a' : '#fff', 2, '#2a0a4a');
          });
          ctr('VS ' + MATES[0].n + ' AND TWO MORE MATES', W / 2, 180, '#9af0a8');
          ctr('UP/DOWN: PICK   LEFT/RIGHT: CHANGE   ' + keyName('a') + ': GO', W / 2, 206, '#e8ecff');
          return;
        }
      }
      function titleTick(dt) {
        // the camera looks at the stage from out at sea (the island behind)
        const sel = MODE === 'select' || MODE === 'opts' ? SEL : null;
        if (sel != null) { const a = LOB[sel]; camTo(a.x + (MODE === 'opts' ? 0 : 0.4), STY + 1.9, a.z - 5.2, a.x, STY + 1.2, a.z, 3); }
        else { const ang = Math.sin(clock * 0.12) * 0.5; camTo(STAGE.x + Math.sin(ang) * 15, STY + 5.5, STAGE.z - Math.cos(ang) * 15, STAGE.x, STY + 2.6, STAGE.z + 1, 2); }
        lobbyTick(dt, sel);
        boardTick(dt);
        if(MODE==='boards'){
          const d=K.pressed('left')?-1:K.pressed('right')?1:0;
          if(d){boardI=(boardI+BOARDS.length+d)%BOARDS.length;applyBoard(boardI);K.sfx.tone(880,.05);}
          if(K.pressed('a')||K.pressed('start')){SAVE.board=boardI;store();MODE='select';}
          if(K.pressed('b'))MODE='menu';return;
        }
        if(MODE==='house'){
          const d=K.pressed('up')?-1:K.pressed('down')?1:K.pressed('left')?-8:K.pressed('right')?8:0;
          if(d){houseI=(houseI+MG_ORDER.length+d)%MG_ORDER.length;K.sfx.tone(880,.04);}
          if(K.pressed('b'))MODE='menu';
          if(K.pressed('a')){const id=MG_ORDER[houseI];if(MG[id].secret&&!SAVE.unlocks.marble){K.sfx.tone(180,.1);return;}SOLO=false;startSingle('house',id);}return;
        }
        if(MODE==='expedition'){
          if(K.pressed('b')){MODE='menu';soloNotice='';}
          if(K.pressed('a')){const e=SAVE.expedition;if(e.complete){SAVE.expedition={node:0,lives:4,cleared:[],complete:false};}
            else if(e.lives<=0)e.lives=4;
            SOLO=true;MODE='select';soloNotice='';}return;
        }
        if (MODE === 'title') { if (K.pressed('start') || K.pressed('a')) { MODE = 'menu'; menuI = 0; K.sfx.tone(1320, 0.1); } return; }
        if (MODE === 'menu') {
          const its = titleItems();
          if (K.pressed('up')) { menuI = (menuI + its.length - 1) % its.length; K.sfx.tone(880, 0.04); }
          if (K.pressed('down')) { menuI = (menuI + 1) % its.length; K.sfx.tone(880, 0.04); }
          if (K.pressed('b')) { MODE = 'title'; K.sfx.tone(440, 0.06); }
          if (K.pressed('a') || K.pressed('start')) {
            K.sfx.tone(1320, 0.08); const it = its[menuI];
            if (it === 'CONTINUE') continueGame();
            else if (it === 'NEW PARTY') { SOLO=false; MODE = 'boards'; }
            else if(it === 'MINIGAME HOUSE') { SOLO=false; MODE='house'; houseI=0; }
            else if(it === 'SOLO EXPEDITION') { SOLO=true; MODE='expedition'; }
            else if (it === 'HOW TO PLAY') MODE = 'how';
            else MODE = 'legends';
          }
          return;
        }
        if (MODE === 'how' || MODE === 'legends') { if (K.pressed('a') || K.pressed('b') || K.pressed('start')) { MODE = 'menu'; K.sfx.tone(660, 0.05); } return; }
        if (MODE === 'select') {
          if (K.pressed('left')) { SEL = (SEL + 5) % 6; K.sfx.tone(880, 0.04); squash(LOB[SEL], 4); }
          if (K.pressed('right')) { SEL = (SEL + 1) % 6; K.sfx.tone(880, 0.04); squash(LOB[SEL], 4); }
          if (K.pressed('a') || K.pressed('start')) { MODE = 'opts'; optI = 3; K.sfx.seq([[79, 0.25], [84, 0.5]], { bpm: 400, vol: 0.08 }); LOB[SEL].vy = 6; }
          if (K.pressed('b')) { MODE = SOLO?'expedition':'boards'; K.sfx.tone(440, 0.06); }
          return;
        }
        if (MODE === 'opts') {
          if (K.pressed('up')) { optI = (optI + 3) % 4; K.sfx.tone(880, 0.04); }
          if (K.pressed('down')) { optI = (optI + 1) % 4; K.sfx.tone(880, 0.04); }
          const d = K.pressed('left') ? -1 : K.pressed('right') ? 1 : 0;
          if (d) { if (optI === 0) SAVE.name = 0; if (optI === 1) SAVE.turns = (SAVE.turns + TURNS.length + d) % TURNS.length; if (optI === 2) SAVE.diff = (SAVE.diff + 3 + d) % 3; if (optI < 3) K.sfx.tone(660, 0.05); store(); }
          if (K.pressed('a') || K.pressed('start')) { if (optI === 3) { K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75]], { bpm: 420, vol: 0.09 }); FLASH = 1; newGame(); } else { optI = 3; K.sfx.tone(880, 0.04); } }
          if (K.pressed('b')) { MODE = 'select'; K.sfx.tone(440, 0.06); }
        }
      }

      // ================================================================ the board's HUD
      function boardHud() {
        const cur = G && G.order ? P[G.order[Math.min(3, G.cur)]] : null;
        panels(G && G.phase === 'turn' && cur ? P.indexOf(cur) : -1);
        if (G && G.phase !== 'final') { panel(W - 70, 37, 66, 14, { c1: '#2a2a6a', c2: '#0a0a2a' }); txt('TURN ' + Math.min(G.turn, G.turns) + '/' + G.turns, W - 64, 40, G.last3 ? '#ff8a6a' : '#fff'); }
        fitText(BOARDS[G.board||0].n, 7, 41, 222, '#ffe680');
        if(G.board===2)txt('STAR '+starCost(),7,53,'#efbaff');
        // the count of hops left over the mover's head
        for (const p of P) if (p.left > 0) { const q = scr(p.a.x, p.a.y + 2.6, p.a.z); if (q.ok) { H.fillStyle = 'rgba(0,0,0,.35)'; H.beginPath(); H.arc(q.x, q.y + 9, 13, 0, 7); H.fill(); bigText(String(p.left), q.x, q.y, 3, '#fff', 2, '#2a3ab8'); } }
        // which way? (and how far to the star)
        if (JUNC) ARROWS.forEach((m, k) => { m.material = arrowMats[k === JUNC.sel ? 1 : 0]; m.scale.setScalar(k === JUNC.sel ? 1.15 + Math.sin(clock * 8) * 0.08 : 0.9); const q = scr(m.position.x + m.userData.dx * 1.1, m.position.y + 0.5, m.position.z + m.userData.dz * 1.1); if (q.ok) { H.fillStyle = 'rgba(0,0,40,.55)'; rr(H, q.x - 18, q.y - 8, 34, 14, 4); H.fill(); H.drawImage(ICON.star, q.x - 16, q.y - 7); txt(JUNC.dist[k] >= 99 ? '?' : String(JUNC.dist[k]), q.x - 1, q.y - 3, k === JUNC.sel ? '#ffd23a' : '#fff'); } });
        if (MAPV) {
          panel(6, HH - 24, W - 12, 18, { c1: '#2a2a6a', c2: '#0a0a2a' }); txt('MAP: ARROWS TO LOOK ROUND   ' + keyName('b') + ': BACK', 12, HH - 19, '#fff');
          if (G.starAt >= 0) { const s = SP[G.starAt], q = scr(s.x, SPY + 3.6, s.z); if (q.ok && q.x > 0 && q.x < W && q.y > 0 && q.y < HH) { H.drawImage(ICON.star, q.x - 7, q.y - 7 + Math.sin(clock * 6) * 2); } }
          for (const p of P) { const q = scr(p.a.x, p.a.y + 2.2, p.a.z); if (q.ok) H.drawImage(portOf(p), q.x - 7, q.y - 7, 14, 14); }
        }
        if (hurry && !DLG && (clock * 1.5 | 0) % 3 !== 0) { txt('HOLD ' + keyName('b') + ': HURRY UP', W - 108, HH - 12, '#c8d0ff'); }
      }

      function currentSong(){
        if(paused)return null;
        if(A){if(A.phase==='play')return SONGS[A.def.song||'mgA'];if(A.phase==='res')return SONGS.stage;return A.phase==='card'?SONGS.card:null;}
        return G?.phase==='final'?SONGS.stage:G?.last3?SONGS.last:SONGS.board;
      }
      // ================================================================ the loop
      function tick(dt) {
        if (MODE !== 'game') { titleTick(dt); }
        else {
          if (K.pressed('start') && !OVER) { paused = !paused; pauseI = 0; K.sfx.tone(paused ? 440 : 880, 0.06); K.music(currentSong()); }
          if (paused) {
            if (K.pressed('up') || K.pressed('down')) { pauseI = 1 - pauseI; K.sfx.tone(880, 0.04); }
            if (K.pressed('a')) { if (pauseI === 0) { paused = false; K.music(currentSong()); } else { paused = false; toTitle(); } }
            return;
          }
          scriptTick(dt);
          if (A) mgTick(dt); else boardTick(dt);
          if (!A) boardCam();
          if (CONF && (frame % 3) === 0) puff(STAGE.x + (rnd() - 0.5) * 12, STY + 8, STAGE.z + (rnd() - 0.5) * 4, [0xff4a4a, 0xffd23a, 0x4a8ae8, 0x3ac04a, 0xff8ad0, 0xffffff], 2, { sp: 1, up: 0, g: 2.5, life: 3, drag: 1.5 });
          if (OVER) { for (const p of P) pose(p.a, dt); }
          if (HOSTA.vis) { HOSTA.walk += dt * 4; HOSTA.mv = 0.3; pose(HOSTA, dt); }
        }
        partsTick(dt); flyTick(dt);
        if (BAN) { BAN.t += dt; if (BAN.t > BAN.dur) BAN = null; }
        FLASH = Math.max(0, FLASH - dt * 2.5); SHAKE = Math.max(0, SHAKE - dt * 1.5);
        for (let i = BUB.length - 1; i >= 0; i--) { BUB[i].t -= dt; if (BUB[i].t <= 0) BUB.splice(i, 1); }
        for (let i = FT.length - 1; i >= 0; i--) { FT[i].t -= dt; if (FT[i].t <= 0) FT.splice(i, 1); }
        camTick(dt);
      }
      // A short input journal replays only the current turn or minigame. Checkpoints
      // are taken at generator boundaries; no generator, THREE object or function is saved.
      const inputButtons = ['up','down','left','right','a','b','start'];
      const plainActor = a => Object.fromEntries(Object.entries(a).filter(([k,v]) => k !== 'm' && ['number','boolean','string'].includes(typeof v)));
      function captureAnchor() {
        if(!SAVE.game || rebuilding)return;
        const anchor = SAVE.game;
        anchor.warm=A?A.t:0;anchor.seed=seed;anchor.clock=clock;anchor.frame=frame;anchor.actors=P.map(p=>plainActor(p.a));
        anchor.cam={p:CAM.wp.toArray(),l:CAM.wl.toArray(),px:CAM.px,py:CAM.py,pz:CAM.pz,lx:CAM.lx,ly:CAM.ly,lz:CAM.lz,k:CAM.k};
        anchor.fx={FLASH,SHAKE};anchor.ban=BAN&&Object.assign({},BAN);anchor.kind=G.kind||'party';anchor.paused=paused;
        anchor.tape='';journal=[];pendingAnchor=false;
        store();
      }
      function flush() {
        if(rebuilding)return;
        SAVE.front={mode:MODE,menuI,SEL,optI,houseI,boardI,SOLO};
        if(pendingAnchor)captureAnchor();
        if(SAVE.game){SAVE.game.paused=paused;SAVE.game.active=MODE==='game';if(journal)SAVE.game.tape=packTape(journal);}
        store();saveClock=0;
      }
      // Compact controller journal: count, held/pressed flags and two signed axes.
      // Ordinary keyboard turns compress to a few dozen bytes and roam with the profile.
      function packTape(rows){const bytes=[];for(const row of rows){let n=row[0];do{const b=n&127;n=Math.floor(n/128);bytes.push(b|(n?128:0));}while(n);bytes.push(row[3]|(row[2]?128:0));if(row[2])bytes.push(row[2]);bytes.push(Math.round(row[4]*64/1000)+64,Math.round(row[5]*64/1000)+64);}let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary);}
      function unpackTape(tape){if(Array.isArray(tape))return JSON.parse(JSON.stringify(tape));const raw=atob(tape),rows=[];let i=0;while(i<raw.length){let count=0,shift=0,b;do{b=raw.charCodeAt(i++);count+=(b&127)*Math.pow(2,shift);shift+=7;}while(b&128);const h=raw.charCodeAt(i++),p=h&128?raw.charCodeAt(i++):0,x=raw.charCodeAt(i++),y=raw.charCodeAt(i++);rows.push([count,16667,p,h&127,(x-64)*1000/64,(y-64)*1000/64]);}return rows;}
      function withInput(row) {
        const old=[K.pressed,K.held,K.stick];
        K.pressed=b=>!!(row[2]&(1<<inputButtons.indexOf(b)));
        K.held=b=>!!(row[3]&(1<<inputButtons.indexOf(b)));
        K.stick=()=>({x:row[4]/1000,y:row[5]/1000});
        tick(1/60);
        [K.pressed,K.held,K.stick]=old;
      }
      let accumulator=0,pendingPress=0,stickMaskBefore=0,stickRepeat=0;
      function update(dt) {
        accumulator=Math.min(.15,accumulator+Math.max(0,dt));
        if(window.House?.paused||RoomTV._dbg?.()?.background)clearTouch();
        inputButtons.forEach((b,i)=>{if(K.pressed(b)||touchPending[b])pendingPress|=1<<i;});for(const b in touchPending)delete touchPending[b];
        const physical=K.stick(),st={x:clamp(physical.x+(touchHeld.right?1:0)-(touchHeld.left?1:0),-1,1),y:clamp(physical.y+(touchHeld.down?1:0)-(touchHeld.up?1:0),-1,1)};let held=0;inputButtons.forEach((b,i)=>{if(K.held(b)||touchHeld[b])held|=1<<i;});
        const stickMask=(st.y<-.5?1:0)|(st.y>.5?2:0)|(st.x<-.5?4:0)|(st.x>.5?8:0);
        pendingPress|=stickMask&~stickMaskBefore;
        if(stickMask!==stickMaskBefore)stickRepeat=.36;else if(stickMask&&(MODE!=='game'||MENU||JUNC||paused)){stickRepeat-=dt;if(stickRepeat<=0){pendingPress|=stickMask;stickRepeat=.16;}}
        stickMaskBefore=stickMask;held|=stickMask;
        while(accumulator>=1/60-1e-8){
          accumulator-=1/60;
          const row=[1,16667,pendingPress,held,Math.round(st.x*64)*1000/64,Math.round(st.y*64)*1000/64];pendingPress=0;
          if(row[2]&&K.restoring&&K.resume)K.resume();clock+=1/60;frame++;
          withInput(row);
          if(pendingAnchor)captureAnchor();
          else if(journal&&MODE==='game'){
            const last=journal[journal.length-1];if(last&&row.slice(1).every((n,i)=>n===last[i+1]))last[0]++;else journal.push(row);
          }
          saveClock+=1/60;
        }
        if(saveClock>.5)flush();
      }
      function restoreJournal(saved) {
        if(!saved || !Number.isFinite(saved.seed) || saved.tape==null)return false;
        rebuilding=true;const expedition=SAVE.expedition;SAVE.expedition=JSON.parse(JSON.stringify(saved.expedition||expedition));const sound=K.sfx,music=K.music;K.sfx={tone(){},seq(){},noise(){}};K.music=()=>{};
        try {
          const tape=unpackTape(saved.tape);
          clearPlayers();G=JSON.parse(JSON.stringify(saved.G));P=saved.P.map((p,i)=>makePlayer(Object.assign({},p,{name:i===0?castName('me'):MATES[p.mate>=0?p.mate:i-1].n})));applyBoard(G.board);
          const star=G.starAt;G.starAt=-1;setStar(star);MODE='game';lobbyVis(false);OVER=false;
          seed=saved.entrySeed===undefined?saved.seed:saved.entrySeed;
          if(G.kind==='house'||G.kind==='solo')run(singleFlow(G.kind,G.mgId,true));else startParty(true);
          clock=saved.clock;frame=saved.frame;if(A&&saved.warm)mgTick(saved.warm);
          saved.actors.forEach((a,i)=>Object.assign(P[i].a,a));seed=saved.seed;
          if(saved.cam){Object.assign(CAM,saved.cam);CAM.wp.fromArray(saved.cam.p);CAM.wl.fromArray(saved.cam.l);CAM.snap=false;}
          BAN=saved.ban;FLASH=saved.fx?.FLASH||0;SHAKE=saved.fx?.SHAKE||0;paused=false;
          for(const row of tape)for(let n=0;n<row[0];n++){clock+=1/60;frame++;withInput(row);}
          paused=!!saved.paused;SAVE.game=saved;journal=tape;pendingAnchor=false;
          if(A)A.acts.forEach(a=>pose(a,0));else P.forEach(p=>pose(p.a,0));
          CAM.snap=false;T3.cam.position.set(CAM.px,CAM.py,CAM.pz);T3.cam.lookAt(CAM.lx,CAM.ly,CAM.lz);return true;
        } finally {rebuilding=false;SAVE.expedition=expedition;K.sfx=sound;K.music=music;accumulator=0;pendingPress=0;K.music(currentSong());}
      }
      addEventListener('pagehide',flush);addEventListener('beforeunload',flush);
      const hidden=()=>{if(document.hidden)flush();};document.addEventListener('visibilitychange',hidden);
      function draw() {
        if(BG.visible)syncSpaces();syncParts();if(A)drawAimGuides();
        T3.render();
        H.clearRect(0, 0, W, HH); RESBOX = false;
        if (MODE !== 'game') titleHud();
        else {
          if (A) mgHud(); else if (!RES && !LEG && !ROUL && G) boardHud();
          drawBubbles(); drawChance(); drawRoulette(); drawResults();
          if (LEG) { drawLegends(36, legHi); if (legHi >= 0 && (clock * 2 | 0) % 2) ctr('NEW ENTRY!', W / 2, 192, '#ffd23a', 1); if ((clock * 2 | 0) % 2) ctr('PRESS ' + keyName('a'), W / 2, 206, '#fff'); }
          drawBanner(); drawDlg(); drawMenu();
          if (HINT && !DLG && !MENU) { const w = F.width(HINT) + 16; panel(W / 2 - w / 2, HH - 30, w, 18, { c1: '#ffb01a', c2: '#c8500a' }); ctr(HINT, W / 2, HH - 25, '#fff'); }
          if (paused) {
            H.fillStyle = 'rgba(0,0,30,.6)'; H.fillRect(0, 0, W, HH);
            panel(W / 2 - 110, 70, 220, 96, { c1: '#4a3ae8', c2: '#1a0a6a' });
            bigText('PAUSED', W / 2, 80, 2, '#ffd23a', 2, '#2a0a4a');
            ['CARRY ON', 'QUIT TO TITLE'].forEach((s, i) => ctr((i === pauseI ? '> ' : '') + s + (i === pauseI ? ' <' : ''), W / 2, 108 + i * 14, i === pauseI ? '#ffd23a' : '#fff'));
            ctr('YOUR EXACT GAME IS SAVED', W / 2, 146, '#c8d0ff');
            ctr('START: CARRY ON', W / 2, 156, '#c8d0ff');
          }
        }
        if (FLASH > 0) { H.fillStyle = `rgba(255,255,255,${Math.min(1, FLASH)})`; H.fillRect(0, 0, W, HH); }
      }
      // testing handle
      K.dbg = {
        get mode() { return MODE; }, get paused(){return paused;}, get seed(){return seed;},get dice(){return DICE.filter(d=>d.on).map(d=>({n:d.n,stop:!!d.stop}));},get camera(){return [CAM.px,CAM.py,CAM.pz,CAM.lx,CAM.ly,CAM.lz];}, get ui(){return {character:SEL,result:!!(RES&&RES.show),legends:!!LEG,menu:MENU&&{items:MENU.items,sel:MENU.sel},dialogue:DLG&&DLG.lines.join(' '),hint:HINT,selection:menuI,houseI,board:SAVE.board||0};}, get save(){return SAVE;}, get choices(){return titleItems();}, get order(){return MG_ORDER.slice();}, boards:BOARDS, board(id){if(G)G.board=id;applyBoard(id);}, single:startSingle, flush, title:toTitle, get G() { return G; }, get P() { return P; }, get A() { return A; }, SP, MG,
        autoWait(s) { AUTOWAIT = s; },
        info() { const i = T3.ren.info; return { tris: i.render.triangles, calls: i.render.calls, geos: i.memory.geometries, tex: i.memory.textures }; },
        auto(on) { AUTO = on !== false; if (P[0]) P[0].cpu = AUTO; },
        step(n) { for (let i = 0; i < (n || 60); i++) update(1 / 60); },
        mg(id) { if (!G) { SEL = 0; newGame(); } SCR = null; WAIT = null; DLG = MENU = BAN = null; run((function* () { yield* (function* () { mgBegin(id); yield () => (A && A.phase === 'over' ? true : undefined); mgEnd(); })(); })()); },
        roundMg() { run(minigameRound()); },
        setTurn(t) { if (G) G.turn = t; },
        finale() { if (!G) return; SCR = null; WAIT = null; if (A) mgEnd();snapshot('final'); run(finale()); },
        newGame() { SOLO=false;SEL = 1; newGame(); },
        turn(i) { SCR = null; WAIT = null; DLG = MENU = ROUL = null; run(playerTurn(P[i])); },
        force(n) { FORCE = n; },
        setStar(id) { setStar(id); },
        run(g) { SCR = null; WAIT = null;DLG=MENU=ROUL=null;HINT='';run(g); },
        get FN() { return { land, mapView, useItem, happening, chanceTime, shopStop, starStop, lastThree, finale, minigameRound, orderRoll }; },
      };
      applyBoard(SAVE.board || 0);
      K.music(SONGS.title);
      CAM.snap = true;
      if (SAVE.game && SAVE.game.active && SAVE.game.tape!==undefined) restoreJournal(SAVE.game);
      else if(SAVE.front&&SAVE.front.mode!=='game'){const f=SAVE.front;MODE=['title','menu','how','legends','select','opts','boards','house','expedition'].includes(f.mode)?f.mode:'title';menuI=clamp(f.menuI||0,0,titleItems().length-1);SEL=clamp(f.SEL||0,0,5);optI=clamp(f.optI||0,0,3);houseI=clamp(f.houseI||0,0,MG_ORDER.length-1);boardI=clamp(f.boardI||0,0,2);SOLO=!!f.SOLO;}
      return {
        update,
        draw,
        end() { flush();clearTouch();touchPanel?.remove();removeEventListener('blur',clearTouch);document.removeEventListener('visibilitychange',clearTouch); removeEventListener('pagehide',flush);removeEventListener('beforeunload',flush);document.removeEventListener('visibilitychange',hidden);K.music(null); },
      };
    },
  });
})();

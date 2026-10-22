/* era-apps-dodgy2: more of the dodgy 1999 shareware shelf (lazy loaded by era-apps.js). The Robot Dance and Dancing Baby
 * Robot screen savers (ids still say grot), Desktop Weather (with adverts), FREE Cursors 4000, JackShots Desktop (a photo a day) and
 * Jack's Power Tools 3 (shiny rocks, nobody knows what the buttons do). All drawn live; no images, no network. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const { h, esc, store, pick, sfx, note, rng } = E;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const d99 = () => { const t = E.today(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };
  const fine = () => matchMedia('(pointer:fine)').matches && !matchMedia('(hover:none)').matches;

  E.css('dodgy2', `
.d2-wx{position:fixed;z-index:3350;width:168px;background:#c0c0c0;border:1px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset -1px -1px #808080,inset 1px 1px #fff,2px 2px 0 rgba(0,0,0,.25);padding:2px;font:11px var(--ui);color:#000;touch-action:none;user-select:none;-webkit-user-select:none}
.d2-wx-tb{display:flex;align-items:center;gap:3px;height:16px;padding:0 1px 0 3px;background:linear-gradient(90deg,#0a4aa8,#3a9ae8);color:#fff;font:bold 10px var(--ui);cursor:move}
.d2-wx-tb span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.d2-wx-tb button{width:16px;height:14px;padding:0;background:var(--face);border:1px solid;border-color:#fff #000 #000 #fff;font:bold 9px/10px Arial;color:#000;cursor:pointer}
.d2-wx-now{display:flex;gap:6px;align-items:center;padding:5px 4px 3px;background:linear-gradient(#bfe0ff,#e8f4ff);border:1px solid #808080;margin-top:2px}
.d2-wx-now svg{width:44px;height:44px;flex:none}
.d2-wx-t{font:bold 22px/1 Arial,sans-serif}
.d2-wx-c{font:bold 10px var(--ui);color:#003a80}
.d2-wx-sub{font:10px var(--ui);color:#333}
.d2-wx-days{display:flex;justify-content:space-between;margin-top:3px;padding:2px;background:#fff;border:1px solid #808080}
.d2-wx-days div{display:flex;flex-direction:column;align-items:center;font:9px var(--ui);width:30px}
.d2-wx-days svg{width:22px;height:22px}
.d2-wx-ad{margin-top:3px;height:34px;display:flex;align-items:center;justify-content:center;text-align:center;font:bold 10px/1.15 Arial,sans-serif;border:1px solid #000;cursor:pointer;overflow:hidden;padding:2px;animation:d2adin .4s}
@keyframes d2adin{from{opacity:.2;transform:scaleY(.6)}}
.d2-wx-ad b{display:block;font-size:11px}
.d2-wx-foot{display:flex;justify-content:space-between;font:9px var(--ui);color:#444;margin-top:2px}
.d2-wx.mini .d2-wx-body{display:none}
.d2-wx.mini{width:130px}
.d2-blink{animation:d2blink .8s steps(1) infinite}@keyframes d2blink{50%{visibility:hidden}}
.d2-cur{display:flex;flex-direction:column;height:100%;min-height:0}
.d2-cur-ban{background:linear-gradient(90deg,#ff00a0,#ffd400,#00e0ff,#ff00a0);background-size:300% 100%;animation:d2ban 3s linear infinite;color:#000;font:bold 15px/1.1 "Comic Sans MS","Chalkboard SE",cursive;text-align:center;padding:5px 4px;border:2px solid #000;text-shadow:1px 1px #fff}
.d2-cur-ban small{display:block;font:bold 10px var(--ui)}
@keyframes d2ban{to{background-position:300% 0}}
.d2-cur-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px;padding:4px;margin-top:6px}
.d2-cur-it{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;background:#fff;border:1px solid #c0c0c0;cursor:pointer;font:11px var(--ui);color:#000;min-height:88px}
.d2-cur-it.sel{background:#000080;color:#fff;border-color:#000080}
.d2-cur-it .pv{width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/12px 12px;border:1px solid #808080}
.d2-cur-it .pv img{width:40px;height:40px;image-rendering:pixelated}
.d2-cur-it em{font:9px var(--ui);opacity:.8}
.d2-cur-bar{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center;margin-top:6px}
.d2-cur-bar .small{flex:1;min-width:120px}
.d2-survey{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:5}
.d2-survey>div{background:#ffffe1;border:2px solid #000;padding:10px;max-width:290px;font:12px var(--ui);box-shadow:4px 4px 0 #000}
.d2-survey .sw{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}
.d2-survey .sw button{width:30px;height:30px;border:2px solid #000;cursor:pointer}
.d2-trail{position:fixed;left:0;top:0;pointer-events:none;z-index:99998;width:10px;height:10px;margin:-5px 0 0 -5px;will-change:transform,opacity}
.d2-ph{display:flex;flex-direction:column;height:100%;min-height:0;gap:6px}
.d2-ph-top{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,#1a1a40,#3a3a90);color:#fff;padding:4px 8px;font:bold 13px Georgia,serif}
.d2-ph-top i{font:italic 11px Georgia,serif;color:#ffd400;margin-left:auto}
.d2-ph-main{flex:1;min-height:0;display:flex;gap:8px}
.d2-ph-pic{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#202020;border:2px solid;border-color:#808080 #fff #fff #808080;padding:6px}
.d2-ph-pic canvas{max-width:100%;max-height:100%;border:3px solid #fff;box-shadow:0 0 0 1px #000,3px 3px 6px #000;background:#000}
.d2-ph-side{width:150px;flex:none;display:flex;flex-direction:column;gap:6px;font:11px var(--ui)}
.d2-ph-cap{font:bold 12px Georgia,serif}
.d2-ph-stars button{background:none;border:0;font-size:20px;line-height:1;padding:0 1px;cursor:pointer;color:#808080;min-width:24px;min-height:26px}
.d2-ph-stars button.on{color:#e0a000;text-shadow:0 0 1px #000}
.d2-ph-strip{display:flex;gap:4px;overflow-x:auto;padding:4px;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;flex:none}
.d2-ph-strip canvas{width:64px;height:48px;flex:none;border:2px solid transparent;cursor:pointer}
.d2-ph-strip canvas.sel{border-color:#000080}
.d2-phbody{height:100%}
@media (max-width:560px){.d2-phbody,.d2-ph{height:auto}.d2-ph-main{flex:none}.d2-ph-pic{flex:none}.d2-ph-main{flex-direction:column}.d2-ph-side{width:auto;flex-direction:row;flex-wrap:wrap;align-items:center}.d2-ph-side .d2-ph-cap{width:100%}}
.d2-kpt{height:100%;min-height:0;display:flex;flex-direction:column;gap:6px;padding:8px;color:#d8e0ff;font:11px var(--ui);border-radius:10px;
  background:radial-gradient(ellipse at 20% 10%,rgba(255,255,255,.14),transparent 40%),radial-gradient(ellipse at 80% 90%,rgba(120,160,255,.12),transparent 45%),repeating-radial-gradient(circle at 30% 40%,#2a2a32 0 3px,#24242a 3px 7px),#26262c;box-shadow:inset 0 0 0 2px #000,inset 2px 2px 0 3px #555,inset -2px -2px 0 3px #111}
.era-w-kpt .appbody{padding:0;background:#111}
.d2-kpt-hint{height:20px;display:flex;align-items:center;justify-content:center;font:italic bold 13px Georgia,serif;color:#9fd0ff;text-shadow:0 0 6px #3a8aff;letter-spacing:1px}
.d2-kpt-mid{flex:1;min-height:0;display:flex;gap:8px;align-items:stretch}
.d2-kpt-orbs{display:flex;flex-direction:column;gap:8px;justify-content:center}
.d2-orb{width:40px;height:40px;border-radius:50%;border:2px solid #000;cursor:pointer;padding:0;background:radial-gradient(circle at 35% 30%,#fff 0 6%,var(--c) 30%,#000 100%);box-shadow:0 0 0 2px #555,0 0 10px var(--c);transition:transform .15s,box-shadow .15s}
.d2-orb:hover,.d2-orb.on{transform:scale(1.12);box-shadow:0 0 0 2px #aaa,0 0 18px var(--c)}
.d2-orb.on{outline:2px solid #ffd400;outline-offset:2px}
.d2-kpt-lens{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;border-radius:18px;padding:8px;background:radial-gradient(ellipse at 50% 0%,#555,#111 70%);box-shadow:inset 0 0 0 3px #000,inset 0 0 18px #000,0 0 0 2px #444}
.d2-kpt-lens canvas{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 0 0 2px #000,0 0 14px rgba(120,180,255,.5);cursor:crosshair;touch-action:manipulation}
.d2-kpt-sl{display:flex;flex-direction:column;gap:14px;justify-content:center;width:64px}
.d2-sl{position:relative;height:24px;border-radius:12px;background:linear-gradient(#0a0a10,#2a2a3a);box-shadow:inset 0 2px 3px #000,0 1px #555;cursor:pointer;touch-action:none}
.d2-sl i{position:absolute;top:2px;width:20px;height:20px;border-radius:50%;margin-left:-10px;background:radial-gradient(circle at 35% 30%,#fff,#7ac8ff 40%,#003a80);box-shadow:0 0 8px #3a8aff}
.d2-kpt-bot{display:flex;gap:10px;justify-content:center;align-items:center}
.d2-kpt-bot .d2-orb{width:30px;height:30px}
@media (max-width:560px){.d2-kpt-mid{flex-wrap:wrap}.d2-kpt-orbs{flex-direction:row;width:100%;justify-content:center}.d2-kpt-sl{flex-direction:row;width:100%}.d2-kpt-sl .d2-sl{flex:1}.d2-kpt-lens{flex-basis:100%;min-height:200px}}
`);

  // ================================================================ pixel sprites (rect-only drawing at 1px, then outlined + scaled crisply)
  function spriteCanvas(w, hgt, paint) {
    const a = document.createElement('canvas'); a.width = w; a.height = hgt;
    const g = a.getContext('2d'); const px = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    paint(px);
    // black outline: silhouette stamped at 4 offsets under the sprite
    const b = document.createElement('canvas'); b.width = w + 2; b.height = hgt + 2;
    const gb = b.getContext('2d'), sil = document.createElement('canvas'); sil.width = w; sil.height = hgt;
    const gs = sil.getContext('2d'); gs.drawImage(a, 0, 0); gs.globalCompositeOperation = 'source-in'; gs.fillStyle = '#000'; gs.fillRect(0, 0, w, hgt);
    [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([x, y]) => gb.drawImage(sil, x, y));
    gb.drawImage(a, 1, 1);
    return b;
  }
  const GR = '#5aac2c', GRD = '#3a7a1a', BR = '#8a5a2a', RED = '#e10600';
  const SIL = '#c8d0dc', SIH = '#ffffff', SID = '#7a8292', DK = '#10141c';
  // one dancing robot pose (was a grot). arms: 'up'|'mid'|'down'|'wave'|'cross', legs: 'in'|'out'|'kl'|'kr', dy: hop
  function grotPose(o) {
    return spriteCanvas(20, 24, px => {
      const y = o.dy || 0;
      // antenna + bulb
      px(9, 2 + y, 2, 1, '#3a4252'); px(9, 0 + y, 2, 2, o.blink ? '#ffd400' : '#ff3020');
      // head: lit from the top-left
      px(4, 3 + y, 12, 8, SIL); px(4, 3 + y, 12, 1, SIH); px(4, 3 + y, 1, 8, SIH); px(15, 4 + y, 1, 7, SID); px(5, 10 + y, 11, 1, SID);
      px(2, 5 + y, 2, 4, SID); px(16, 5 + y, 2, 4, SID); // ear bolts
      px(6, 5 + y, 8, 3, DK); px(7, 6 + y, 2, 1, o.blink ? '#3a4a5a' : '#40e0ff'); px(11, 6 + y, 2, 1, o.blink ? '#3a4a5a' : '#40e0ff');
      px(7, 9 + y, 6, 1, DK); px(8, 9 + y, 1, 1, SID); px(10, 9 + y, 1, 1, SID);
      if (o.hat) { px(4, 2 + y, 12, 2, o.hat); px(6, 0 + y, 8, 2, o.hat); px(9, -1 + y, 2, 1, '#ffd400'); }
      // body with a chest panel of blinking lights
      px(5, 11 + y, 10, 7, '#9aa2b2'); px(5, 11 + y, 10, 1, SIL); px(14, 12 + y, 1, 6, SID);
      px(7, 12 + y, 6, 4, '#2a5ad8'); px(8, 13 + y, 1, 1, '#ffd400'); px(10, 13 + y, 1, 1, '#ff3020'); px(11, 14 + y, 1, 1, '#3aff9a'); px(8, 14 + y, 2, 1, '#9fd0ff');
      // arms
      const A = { up: [[3, 5, 2, 7], [15, 5, 2, 7]], mid: [[2, 12, 4, 2], [14, 12, 4, 2]], down: [[3, 12, 2, 6], [15, 12, 2, 6]], wave: [[3, 12, 2, 6], [15, 5, 2, 7]], cross: [[3, 12, 4, 2], [13, 9, 2, 5]] }[o.arms || 'down'];
      A.forEach(([x, yy, w, hh]) => { px(x, yy + y, w, hh, SID); px(x, yy + y, 1, 1, SIL); });
      // legs + feet
      const L = { in: [[7, 18, 2, 5], [11, 18, 2, 5]], out: [[5, 18, 2, 5], [13, 18, 2, 5]], kl: [[2, 18, 5, 2], [11, 18, 2, 5]], kr: [[7, 18, 2, 5], [13, 18, 5, 2]] }[o.legs || 'in'];
      L.forEach(([x, yy, w, hh]) => px(x, yy + y, w, hh, '#5a6272'));
    });
  }
  // a bouncing Blobbit (was a squig): round blue critter with little ears, big eyes and a grin
  function squigPose(o) {
    return spriteCanvas(18, 16, px => {
      const s = o.sq || 0, y = o.dy || 0, B = '#3aa0f0', BD = '#1a68c8';
      px(3 - s, 1 + y + s, 3, 3, '#2a80d8'); px(12 + s, 1 + y + s, 3, 3, '#2a80d8'); px(4 - s, 2 + y + s, 1, 1, '#ffb0c8'); px(13 + s, 2 + y + s, 1, 1, '#ffb0c8');
      px(2 - s, 4 + y + s, 14 + s * 2, 9 - s, B); px(3 - s, 3 + y + s, 12 + s * 2, 1, B); px(3, 13 + y, 12, 1, BD); px(15 + s, 6 + y + s, 1, 6 - s, BD);
      px(4 - s, 4 + y + s, 2, 1, '#c8f0ff'); px(3 - s, 5 + y + s, 1, 2, '#c8f0ff');
      px(5, 5 + y + s, 3, 3, '#fff'); px(10, 5 + y + s, 3, 3, '#fff'); px(6, 6 + y + s, 2, 2, '#000'); px(11, 6 + y + s, 2, 2, '#000');
      px(3, 9 + y + s, 2, 1, '#ff5a8c'); px(13, 9 + y + s, 2, 1, '#ff5a8c');
      px(6, 9 + y + s, 6, 1, '#5a0a20'); px(7, 10 + y + s, 4, 1, '#5a0a20'); px(8, 10 + y + s, 2, 1, '#ff6a8a');
      px(3, 14, 4, 2, BD); px(11, 14, 4, 2, BD);
    });
  }
  let DANCERS = null;
  function dancers() {
    if (DANCERS) return DANCERS;
    DANCERS = [
      [grotPose({ arms: 'up', legs: 'in' }), grotPose({ arms: 'down', legs: 'out', dy: 1 })],
      [grotPose({ arms: 'mid', legs: 'kl' }), grotPose({ arms: 'mid', legs: 'in', dy: 1 }), grotPose({ arms: 'mid', legs: 'kr' }), grotPose({ arms: 'mid', legs: 'in', dy: 1 })],
      [grotPose({ arms: 'wave', legs: 'out', blink: true }), grotPose({ arms: 'up', legs: 'out' })],
      [grotPose({ arms: 'cross', legs: 'in', dy: 1 }), grotPose({ arms: 'up', legs: 'out', dy: -1 })],
      [squigPose({ dy: 1 }), squigPose({ sq: 1, dy: 2 }), squigPose({ dy: 0 }), squigPose({ dy: -1 })],
      [grotPose({ arms: 'up', legs: 'kl', hat: '#e10600' }), grotPose({ arms: 'up', legs: 'kr', hat: '#e10600' })],
    ];
    return DANCERS;
  }

  // ================================================================ GROT DANCE screen saver (the famous dancing-rodent home page, with grots)
  E.savers.dance = (g, W, H, o) => {
    const D = dancers(), small = H < 200;
    const cell = Math.max(small ? 22 : 54, Math.round(H / (small ? 4.2 : 6.5)));
    const scale = Math.max(1, Math.floor(cell / 24)), top = small ? 18 : Math.round(H * 0.13), bot = small ? 10 : Math.round(H * 0.09);
    const cols = Math.max(3, Math.floor(W / cell)), rows = Math.max(1, Math.floor((H - top - bot) / cell));
    const ox = (W - cols * cell) / 2, oy = top + (H - top - bot - rows * cell) / 2;
    const r = rng('grotdance'), grid = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.push({ x, y, k: Math.floor(r() * D.length), ph: Math.floor(r() * 4), sp: 0.16 + r() * 0.1 });
    let t = 0, mq = W;
    const MSG = 'WELCOME TO THE ROBOT DANCE!!!  BEEP BOOP BEEP! BEEP BOOP BEEP!  YOU ARE VISITOR NUMBER 0042999!!!  SIGN MY GUESTBOOK!!!  ';
    if (o.full && window.Sound && Sound.on) { try { Sound.music.play('grotdance'); } catch (e) {} }
    const rainbow = ['#ff0000', '#ff8000', '#e0c000', '#00a000', '#0060ff', '#8000ff', '#ff00c0'];
    return {
      frame(dt) {
        t += dt;
        g.fillStyle = '#fffff0'; g.fillRect(0, 0, W, H);
        // tiled tiny-dot background, like a 1998 home page
        g.fillStyle = '#ffe0f0'; for (let y = 0; y < H; y += 16) for (let x = (y / 16 % 2) * 8; x < W; x += 16) g.fillRect(x, y, 3, 3);
        // the dancers
        g.imageSmoothingEnabled = false;
        for (const d of grid) {
          const fr = D[d.k], f = fr[(Math.floor(t / d.sp) + d.ph) % fr.length];
          const sw = f.width * scale, sh = f.height * scale;
          g.drawImage(f, Math.round(ox + d.x * cell + (cell - sw) / 2), Math.round(oy + d.y * cell + (cell - sh) / 2), sw, sh);
        }
        // the title, in blinking rainbow Comic Sans
        const title = small ? 'ROBOT DANCE!!!' : 'WELCOME TO THE ROBOT DANCE!!!';
        let fs = small ? 11 : Math.max(14, Math.round(H * 0.065));
        g.font = `bold ${fs}px "Comic Sans MS","Chalkboard SE",cursive`; g.textBaseline = 'middle';
        const tw = g.measureText(title).width; if (tw > W * 0.94) { fs = Math.floor(fs * W * 0.94 / tw); g.font = `bold ${fs}px "Comic Sans MS","Chalkboard SE",cursive`; }
        let x = (W - g.measureText(title).width) / 2;
        for (let i = 0; i < title.length; i++) { const c = title[i]; g.fillStyle = rainbow[(i + Math.floor(t * 8)) % rainbow.length]; g.fillText(c, x, top / 2 + (small ? 1 : Math.sin(t * 6 + i * 0.5) * 3)); x += g.measureText(c).width; }
        // the marquee along the bottom
        if (!small) {
          const f2 = Math.max(12, Math.round(bot * 0.5));
          g.fillStyle = '#000080'; g.fillRect(0, H - bot, W, bot);
          g.font = `bold ${f2}px "Courier New",monospace`; g.fillStyle = '#ffff00';
          const mw = g.measureText(MSG).width; mq -= dt * 120; if (mq < -mw) mq += mw;
          g.fillText(MSG + MSG + MSG, mq, H - bot / 2);
        }
      },
      stop() { try { if (window.Sound && Sound.music.playing === 'grotdance') Sound.music.stop(); } catch (e) {} },
    };
  };

  // ================================================================ DANCING BABY GROT screen saver: a chunky "3D" baby grot doing the cha-cha
  E.savers.baby = (g, W, H, o) => {
    let t = 0;
    const S = Math.min(W, H) / 7.2, cx = W / 2, floorY = H * 0.86;
    const ball = (x, y, r, c1, c2) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.18, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); g.fill(); };
    // a pose for time t: returns joints in 3D (x right, y up, z towards viewer), unit = S
    function pose(t) {
      const b = t * Math.PI * 2 / 1.6, step = Math.sin(b), hip = Math.sin(b) * 0.25, bob = Math.abs(Math.cos(b)) * 0.12;
      const J = {};
      J.pelvis = [hip, 1.25 + bob, 0];
      J.chest = [hip * 0.4, 1.95 + bob, 0.05];
      J.head = [hip * 0.2 + Math.sin(b * 0.5) * 0.08, 2.75 + bob, 0.1];
      J.footL = [-0.35 + Math.max(0, step) * 0.35, 0.12 + Math.max(0, step) * 0.25, Math.max(0, step) * 0.35];
      J.footR = [0.35 - Math.max(0, -step) * 0.35, 0.12 + Math.max(0, -step) * 0.25, Math.max(0, -step) * 0.35];
      J.kneeL = [(J.pelvis[0] - 0.3 + J.footL[0]) / 2 - 0.08, (J.pelvis[1] - 0.4 + J.footL[1]) / 2 + 0.05, 0.05 + J.footL[2] * 0.6];
      J.kneeR = [(J.pelvis[0] + 0.3 + J.footR[0]) / 2 + 0.08, (J.pelvis[1] - 0.4 + J.footR[1]) / 2 + 0.05, 0.05 + J.footR[2] * 0.6];
      const sw = Math.sin(b + 1.2);
      J.handL = [-0.95 + sw * 0.2, 2.2 + Math.abs(sw) * 0.5, 0.3 + sw * 0.25];
      J.handR = [0.95 + sw * 0.2, 2.2 + Math.abs(sw) * 0.5, 0.3 - sw * 0.25];
      J.elbL = [(J.chest[0] - 0.4 + J.handL[0]) / 2, (J.chest[1] + J.handL[1]) / 2 - 0.25, 0.2];
      J.elbR = [(J.chest[0] + 0.4 + J.handR[0]) / 2, (J.chest[1] + J.handR[1]) / 2 - 0.25, 0.2];
      return J;
    }
    return {
      frame(dt) {
        t += dt;
        // background: dark purple with a spotlight and a shiny floor
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05000f'); bg.addColorStop(0.7, '#1a0a3a'); bg.addColorStop(1, '#2a1050');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        const sp = g.createRadialGradient(cx, floorY, 4, cx, floorY, S * 2.8); sp.addColorStop(0, 'rgba(255,255,220,.55)'); sp.addColorStop(1, 'rgba(255,255,220,0)');
        g.fillStyle = sp; g.save(); g.translate(cx, floorY); g.scale(1, 0.25); g.beginPath(); g.arc(0, 0, S * 2.8, 0, Math.PI * 2); g.restore(); g.fill();
        const cone = g.createLinearGradient(0, 0, 0, floorY); cone.addColorStop(0, 'rgba(255,255,230,0)'); cone.addColorStop(1, 'rgba(255,255,230,.13)');
        g.fillStyle = cone; g.beginPath(); g.moveTo(cx - S * 0.3, 0); g.lineTo(cx + S * 0.3, 0); g.lineTo(cx + S * 2.6, floorY); g.lineTo(cx - S * 2.6, floorY); g.fill();
        // the baby, turning slowly so you can see how 3D it is
        const J = pose(t), yaw = Math.sin(t * 0.45) * 0.9, cy = Math.cos(yaw), sy = Math.sin(yaw);
        const P = p => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, k = 6 / (6 - z); return [cx + x * S * k, floorY - p[1] * S * k, z, k]; };
        const parts = [];
        const add = (p, r, c1, c2, extra) => { const q = P(p); parts.push({ x: q[0], y: q[1], z: q[2], r: r * S * q[3], c1, c2, extra }); };
        // limbs are shaded tubes (a dark stroke, a lighter one nudged towards the light, and a shine)
        const limb = (a, b, r, c1, c2) => { const p = P(a), q = P(b); parts.push({ tube: true, x: p[0], y: p[1], x2: q[0], y2: q[1], z: (p[2] + q[2]) / 2, r: r * S * (p[3] + q[3]) / 2, c1, c2 }); };
        const SK = ['#e8eef8', '#5a6272']; // chrome limbs
        limb([J.pelvis[0] - 0.28, J.pelvis[1] - 0.4, -0.1], J.kneeL, 0.2, ...SK); limb(J.kneeL, J.footL, 0.17, ...SK);
        limb([J.pelvis[0] + 0.28, J.pelvis[1] - 0.4, -0.1], J.kneeR, 0.2, ...SK); limb(J.kneeR, J.footR, 0.17, ...SK);
        add(J.footL, 0.22, '#8a92a4', '#2a2e3a'); add(J.footR, 0.22, '#8a92a4', '#2a2e3a');
        add(J.chest, 0.55, '#d8e0ec', '#4a5262', 'chest');
        add([J.pelvis[0], J.pelvis[1] - 0.05, J.pelvis[2] + 0.12], 0.64, '#ffffff', '#a8b0c8', 'nappy');
        limb([J.chest[0] - 0.4, J.chest[1] + 0.2, 0], J.elbL, 0.15, ...SK); limb(J.elbL, J.handL, 0.13, ...SK); add(J.handL, 0.17, ...SK);
        limb([J.chest[0] + 0.4, J.chest[1] + 0.2, 0], J.elbR, 0.15, ...SK); limb(J.elbR, J.handR, 0.13, ...SK); add(J.handR, 0.17, ...SK);
        add(J.head, 0.72, '#e8eef8', '#4a5262', 'head');
        parts.sort((a, b) => (a.z + (a.extra === 'head' ? 0.4 : 0)) - (b.z + (b.extra === 'head' ? 0.4 : 0)));
        // shadow
        g.fillStyle = 'rgba(0,0,0,.45)'; g.save(); g.translate(cx, floorY); g.scale(1, 0.22); g.beginPath(); g.arc(0, 0, S * 0.9, 0, Math.PI * 2); g.restore(); g.fill();
        for (const p of parts) {
          if (p.tube) {
            g.lineCap = 'round';
            g.strokeStyle = p.c2; g.lineWidth = p.r * 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x2, p.y2); g.stroke();
            g.strokeStyle = p.c1; g.lineWidth = p.r * 1.35; g.beginPath(); g.moveTo(p.x - p.r * 0.22, p.y - p.r * 0.22); g.lineTo(p.x2 - p.r * 0.22, p.y2 - p.r * 0.22); g.stroke();
            g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = p.r * 0.35; g.beginPath(); g.moveTo(p.x - p.r * 0.45, p.y - p.r * 0.45); g.lineTo(p.x2 - p.r * 0.45, p.y2 - p.r * 0.45); g.stroke();
            continue;
          }
          if (p.extra === 'head') {
            // ear bolts behind the head
            [-1, 1].forEach(s => ball(p.x + s * p.r * 0.95 * cy, p.y, p.r * 0.24, '#b8c0d0', '#3a4252'));
          }
          ball(p.x, p.y, p.r, p.c1, p.c2);
          if (p.extra === 'nappy') { g.fillStyle = '#ffd400'; g.beginPath(); g.arc(p.x - p.r * 0.55, p.y - p.r * 0.35, p.r * 0.1, 0, 7); g.arc(p.x + p.r * 0.55, p.y - p.r * 0.35, p.r * 0.1, 0, 7); g.fill(); }
          if (p.extra === 'chest') { // a little chest panel of blinking lights
            const on = Math.floor(t * 4) % 3; ['#ff3020', '#ffd400', '#3aff9a'].forEach((c, n) => { g.fillStyle = n === on ? c : '#3a4252'; g.beginPath(); g.arc(p.x + (n - 1) * p.r * 0.32, p.y + p.r * 0.1, p.r * 0.12, 0, 7); g.fill(); });
          }
          if (p.extra === 'head') {
            const fx = p.x + sy * p.r * 0.35, r = p.r;
            // antenna with a blinking red bulb (instead of the one curly hair)
            g.strokeStyle = '#3a4252'; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.moveTo(p.x, p.y - r * 0.9); g.lineTo(p.x, p.y - r * 1.35); g.stroke();
            ball(p.x, p.y - r * 1.42, r * 0.15, Math.floor(t * 3) % 2 ? '#ff4030' : '#ffd400', '#7a0a00');
            // visor with two big round glowing eyes
            g.fillStyle = '#10141c'; g.beginPath(); g.ellipse(fx, p.y - r * 0.12, r * 0.62 * Math.abs(cy) + r * 0.1, r * 0.3, 0, 0, 7); g.fill();
            ball(fx - r * 0.3 * cy, p.y - r * 0.12, r * 0.18, '#c0ffff', '#0090c0'); ball(fx + r * 0.3 * cy, p.y - r * 0.12, r * 0.18, '#c0ffff', '#0090c0');
            // a little LED smile that opens to the beat
            g.fillStyle = '#10141c'; g.beginPath(); g.ellipse(fx, p.y + r * 0.42, r * 0.28 * Math.abs(cy) + r * 0.05, r * 0.08 + Math.abs(Math.sin(t * 8)) * r * 0.08, 0, 0, 7); g.fill();
            g.fillStyle = '#3aff9a'; for (let n = -2; n <= 2; n++) g.fillRect(fx + n * r * 0.1 * Math.abs(cy) - r * 0.03, p.y + r * 0.4, r * 0.06, r * 0.05);
          }
        }
        // CHA CHA CHA!
        if (H > 160) {
          const fs = Math.round(Math.min(H * 0.07, W * 0.075)), beat = Math.floor(t / 0.4) % 4;
          g.font = `bold italic ${fs}px "Arial Black",Impact,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          const words = ['CHA', 'CHA', 'CHA!', ''];
          for (let i = 0; i < 3; i++) { if (i > beat - 0 && beat !== 3) continue; const x = cx + (i - 1) * fs * 3.2, y = H * 0.12; g.fillStyle = '#000'; g.fillText(words[i], x + 3, y + 3); g.fillStyle = ['#ff2a6d', '#ffd400', '#00e5ff'][i]; g.fillText(words[i], x, y); }
          g.textAlign = 'left';
          g.font = `${Math.round(H * 0.022)}px "Courier New",monospace`; g.fillStyle = '#8a7aaa'; g.fillText(W < 600 ? 'Rendered in REAL 3D!' : 'Rendered in REAL 3D. 4,812 polygons. (Some of them are spheres.)', 10, H - 12);
        }
      },
    };
  };

  // ================================================================ DESKTOP WEATHER (with adverts)
  const WX_ICON = {
    sun: '<svg viewBox="0 0 44 44"><g stroke="#e0a000" stroke-width="2.5"><path d="M22 3v6M22 35v6M3 22h6M35 22h6M8 8l4 4M32 32l4 4M8 36l4-4M32 12l4-4"/></g><circle cx="22" cy="22" r="9" fill="#ffd400" stroke="#c08000"/></svg>',
    cloud: '<svg viewBox="0 0 44 44"><circle cx="15" cy="16" r="7" fill="#ffd400" stroke="#c08000"/><path d="M10 34h24a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-7 16z" fill="#f4f4f4" stroke="#808080" stroke-width="1.5"/></svg>',
    grey: '<svg viewBox="0 0 44 44"><path d="M8 30h26a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-9 16z" fill="#a8aab0" stroke="#606068" stroke-width="1.5"/></svg>',
    rain: '<svg viewBox="0 0 44 44"><path d="M8 26h26a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-9 16z" fill="#8a8c98" stroke="#505058" stroke-width="1.5"/><path d="M13 30l-3 7M21 30l-3 7M29 30l-3 7" stroke="#2a6ad8" stroke-width="2.4" stroke-linecap="round"/></svg>',
    drizzle: '<svg viewBox="0 0 44 44"><path d="M8 26h26a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-9 16z" fill="#b8bac0" stroke="#606068" stroke-width="1.5"/><path d="M14 31v2M22 32v2M30 31v2M18 36v2M26 36v2" stroke="#2a6ad8" stroke-width="2" stroke-linecap="round"/></svg>',
    storm: '<svg viewBox="0 0 44 44"><path d="M8 24h26a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-9 16z" fill="#5a5c68" stroke="#303038" stroke-width="1.5"/><path d="M22 24l-4 8h5l-3 9 9-12h-5l3-5z" fill="#ffd400" stroke="#806000"/></svg>',
    fog: '<svg viewBox="0 0 44 44"><path d="M6 14h28M10 20h28M6 26h30M10 32h24" stroke="#9a9ca8" stroke-width="3.5" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 44 44"><path d="M8 24h26a7 7 0 0 0 0-14 9 9 0 0 0-17-2 7 7 0 0 0-9 16z" fill="#e8eef8" stroke="#808898" stroke-width="1.5"/><g fill="#fff" stroke="#6a8ac8"><circle cx="14" cy="32" r="2"/><circle cx="22" cy="36" r="2"/><circle cx="30" cy="31" r="2"/></g></svg>',
  };
  const WX = [['rain', 'Rain. Obviously.'], ['drizzle', 'Drizzle (the annoying kind)'], ['grey', 'Grey. Just grey.'], ['cloud', 'Sunny spells (lies)'], ['rain', 'Raining sideways'], ['sun', 'SUN!!! (get outside)'], ['storm', 'Thunder (unplug the modem!)'], ['fog', 'Foggy. Can\'t see Dave\'s house'], ['drizzle', 'Spitting'], ['grey', 'Overcast, with a chance of more overcast']];
  const ADS = [
    ['#ffd400', '#e10600', 'Hamster Insurance', 'Has your hamster eaten the sofa? You could be covered!'],
    ['#003a80', '#fff', 'BALDY-B-GONE hair tonic', 'Now with 40% more hair. Results in 3 weeks*'],
    ['#e10600', '#ffff00', 'WIN A FREE PENTIUM III!', 'You have been selected! CLICK HERE!!!'],
    ['#000', '#0f0', 'Free MP3s!!!', 'Download 10,000 songs! (that\'s 3 weeks on a 56K)'],
    ['#ff7ac8', '#000', 'Hot Singles In Your Area', 'Mrs Jenkins (78) is single and likes bingo'],
    ['#2a8a2a', '#fff', 'Mad Rupee Loans', 'Need Rupees fast? Borrow 500 Rupees today! 4,000% APR'],
    ['#fff', '#000080', 'Pocket Money Calculator 99', 'Find out EXACTLY how unfair your pocket money is'],
    ['#5b16c9', '#ffd400', 'Desktop Weather PRO', 'Hide these adverts for only $19.95!'],
  ];
  let WXW = null;
  function weatherFor(dayOff) {
    const t = E.today(), r = rng('wx' + t.m + '-' + (t.d + dayOff)); const m = t.m;
    const base = [5, 5, 8, 11, 15, 18, 21, 20, 17, 13, 9, 6][m - 1];
    let [ic, txt] = WX[Math.floor(r() * WX.length)];
    if ((m === 12 || m === 1 || m === 2) && r() < 0.25) { ic = 'snow'; txt = 'Snow!!! (it will be slush by 10am)'; }
    return { ic, txt, temp: Math.round(base + (r() * 6 - 3) - (ic === 'rain' ? 1 : 0) + (ic === 'sun' ? 3 : 0)) };
  }
  E.mods.weather = () => {
    if (WXW && WXW.el.isConnected) { WXW.el.classList.remove('mini'); WXW.el.style.zIndex = 3350; flashEl(WXW.el); return; }
    const el = h('div', 'd2-wx'); el.setAttribute('role', 'complementary'); el.setAttribute('aria-label', 'Desktop Weather');
    const now = weatherFor(0), DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], dow = E.today().date.getDay();
    el.innerHTML = `<div class="d2-wx-tb"><span>&#9729; Desktop Weather</span><button type="button" data-x="menu" aria-label="Menu">&#9660;</button><button type="button" data-x="mini" aria-label="Roll up">_</button><button type="button" data-x="close" aria-label="Close">x</button></div>
      <div class="d2-wx-body"><div class="d2-wx-now">${WX_ICON[now.ic]}<div><div class="d2-wx-t">${now.temp}&deg;C</div><div class="d2-wx-c">${esc(now.txt)}</div><div class="d2-wx-sub">Your Town &middot; ${d99()}</div></div></div>
      <div class="d2-wx-days">${[1, 2, 3, 4, 5].map(i => { const f = weatherFor(i); return `<div title="${esc(f.txt)}">${DAYS[(dow + i) % 7]}${WX_ICON[f.ic]}${f.temp}&deg;</div>`; }).join('')}</div>
      <div class="d2-wx-ad" tabindex="0" role="button"></div><div class="d2-wx-foot"><span>Updated: <b class="d2-wx-up">just now</b></span><span>Ad 1 of ${ADS.length}</span></div></div>`;
    DesktopSurface.root().appendChild(el);
    WXW = { el };
    const phone = DesktopSurface.width() < 640;
    el.style.left = (phone ? 4 : Math.max(4, DesktopSurface.width() - 182)) + 'px';
    el.style.top = (phone ? DesktopSurface.height() - 60 : Math.min(DesktopSurface.height() - 280, 406)) + 'px';
    if (phone) el.classList.add('mini');
    // rolling down near an edge: keep the whole widget on screen
    WXW.fit = () => requestAnimationFrame(() => { const r = DesktopSurface.rect(el); el.style.left = clamp(r.left, 2, Math.max(2, DesktopSurface.width() - r.width - 2)) + 'px'; el.style.top = clamp(r.top, 2, Math.max(2, DesktopSurface.height() - r.height - 32)) + 'px'; });
    new MutationObserver(() => WXW && WXW.fit()).observe(el, { attributes: true, attributeFilter: ['class'] });
    // on a phone it rolls itself up again as soon as you tap anything else, so it never sits on top of a program
    const outside = ev => { if (!el.isConnected) return removeEventListener('pointerdown', outside, true); if (DesktopSurface.width() < 640 && !el.contains(ev.target) && !(ev.target.closest && ev.target.closest('.menu,.msgbox'))) el.classList.add('mini'); };
    addEventListener('pointerdown', outside, true);
    const ad = el.querySelector('.d2-wx-ad'), foot = el.querySelector('.d2-wx-foot span:last-child');
    let ai = Math.floor(Math.random() * ADS.length), hideAds = false, upd = 0;
    const showAd = () => { const a = ADS[ai % ADS.length]; ad.style.background = a[0]; ad.style.color = a[1]; ad.innerHTML = `<span><b class="${a[2].includes('WIN') ? 'd2-blink' : ''}">${esc(a[2])}</b>${esc(a[3])}</span>`; ad.style.animation = 'none'; void ad.offsetWidth; ad.style.animation = ''; foot.textContent = `Ad ${ai % ADS.length + 1} of ${ADS.length}`; };
    showAd();
    const tick = setInterval(() => {
      if (!el.isConnected) return clearInterval(tick);
      if (document.hidden) return;
      ai++; showAd();
      upd++; el.querySelector('.d2-wx-up').textContent = upd < 2 ? 'just now' : `${upd * 8} sec ago`;
    }, 8000);
    const clickAd = () => {
      const a = ADS[ai % ADS.length];
      E.secret('wx.ad');
      if (/PENTIUM/.test(a[2])) Desk.msgbox('CONGRATULATIONS!!!', 'You are the 1,000,000th visitor!!!\n\n...to this advert.\n\nTo claim your FREE Pentium III, please send $49.95 postage and packing to the address on the back of the box it doesn\'t come in.', 'info');
      else if (/PRO/.test(a[2])) upgrade();
      else if (/Hamster Insurance/.test(a[2])) Desk.msgbox('Hamster Insurance', 'Thank you for your interest in Hamster Insurance.\n\nUnfortunately your hamster is a pre-existing condition.', 'info');
      else if (/MP3/.test(a[2])) Desk.msgbox('Free MP3s!!!', 'Connecting to free-mp3z-4-u.netz...\n\nThe server is full. There are 4,000 people downloading the same song. Try again in 1999. Oh wait.', 'warn');
      else Desk.toast(a[2], 'Opening advert in JackNet Explorer... (just kidding, the advert is the whole thing)', 3500);
    };
    ad.addEventListener('click', clickAd); ad.addEventListener('keydown', ev => { if (ev.key === 'Enter') clickAd(); });
    function upgrade() { Desk.msgbox('Desktop Weather PRO', 'Upgrade to Desktop Weather PRO for only $19.95 and hide all adverts!\n\nFeatures of PRO:\n- No adverts\n- The same weather\n- It will still rain\n\nTo pay, ask a grown-up with a credit card. (Mom said no.)', 'q', [['Buy Now!', () => Desk.toast('Desktop Weather', 'Payment declined: Mom.', 3000)], ['Maybe Later']]); }
    const close = () => { clearInterval(tick); removeEventListener('pointerdown', outside, true); el.remove(); WXW = null; };
    const menu = (x, y) => IE.menu([
      { label: 'Refresh weather', act: () => { upd = 0; el.querySelector('.d2-wx-up').textContent = 'just now'; Desk.toast('Desktop Weather', 'Dialling the Weather Centre... Connected! The weather is: the same.', 3000); } },
      { label: el.classList.contains('mini') ? 'Show forecast' : 'Roll up', act: () => el.classList.toggle('mini') },
      { label: 'Hide adverts', act: () => { hideAds = true; upgrade(); } },
      { label: 'Units: \u00b0C (proper)', chk: true, act: () => Desk.toast('Desktop Weather', 'Fahrenheit is not available in this country. Or this century.', 3000) },
      '-', { label: 'About Desktop Weather...', act: () => E.about('Desktop Weather', E.I.weather, ['<b>Desktop Weather 2.1</b> (with adverts)', 'Live* weather for Your Town.', '*Weather may not be live. Weather may be made up. It\'s probably raining though, so it\'s probably right.']) },
      { label: 'Exit', act: close },
    ], x, y);
    el.querySelector('[data-x=close]').addEventListener('click', close);
    el.querySelector('[data-x=mini]').addEventListener('click', () => el.classList.toggle('mini'));
    el.querySelector('[data-x=menu]').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(); menu(r.left, r.bottom); });
    el.addEventListener('contextmenu', ev => { ev.preventDefault(); menu(ev.clientX, ev.clientY); });
    // drag by the title bar
    const tb = el.querySelector('.d2-wx-tb'); let drag = null;
    tb.addEventListener('pointerdown', ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); if (ev.target.closest('button')) return; drag = { dx: p.x - el.offsetLeft, dy: p.y - el.offsetTop }; tb.setPointerCapture(ev.pointerId); });
    tb.addEventListener('pointermove', ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); if (!drag) return; el.style.left = clamp(p.x - drag.dx, -100, DesktopSurface.width() - 60) + 'px'; el.style.top = clamp(p.y - drag.dy, 0, DesktopSurface.height() - 50) + 'px'; });
    tb.addEventListener('pointerup', () => { drag = null; }); tb.addEventListener('pointercancel', () => { drag = null; });
    tb.addEventListener('dblclick', ev => { if (!ev.target.closest('button')) el.classList.toggle('mini'); });
    void hideAds;
  };
  function flashEl(el) { el.animate && el.animate([{ outline: '3px solid #ffd400' }, { outline: '3px solid transparent' }], { duration: 600, iterations: 2 }); }

  // ================================================================ FREE CURSORS 4000 (animated cursors + comet trails, the CursorWorld way)
  const svgCur = (body, s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s || 32}" height="${s || 32}" viewBox="0 0 32 32">${body}</svg>`;
  const ARROW = (fill, stroke) => `<path d="M2 2v22l6-6 4 10 4-2-4-9h8z" fill="${fill}" stroke="${stroke || '#000'}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const rot = (deg, body) => `<g transform="rotate(${deg} 16 16)">${body}</g>`;
  const CURS = [
    { id: 'squig', n: 'Spinning Blobbit', hx: 16, hy: 16, frames: [0, 90, 180, 270].map(a => rot(a, '<circle cx="8.5" cy="7.5" r="3.6" fill="#2a80d8" stroke="#000" stroke-width="1.2"/><circle cx="23.5" cy="7.5" r="3.6" fill="#2a80d8" stroke="#000" stroke-width="1.2"/><circle cx="8.5" cy="7.5" r="1.6" fill="#ffb0c8"/><circle cx="23.5" cy="7.5" r="1.6" fill="#ffb0c8"/><circle cx="16" cy="17" r="11" fill="#3aa0f0" stroke="#000" stroke-width="1.5"/><ellipse cx="11" cy="11.5" rx="3" ry="1.5" fill="#d0f4ff" transform="rotate(-30 11 11.5)"/><ellipse cx="12.5" cy="15.5" rx="2.6" ry="3.2" fill="#fff" stroke="#000"/><ellipse cx="19.5" cy="15.5" rx="2.6" ry="3.2" fill="#fff" stroke="#000"/><circle cx="13.2" cy="16.2" r="1.3"/><circle cx="20.2" cy="16.2" r="1.3"/><path d="M12 21q4 5 8 0q-4 1.5-8 0z" fill="#5a0a20" stroke="#000" stroke-width=".8"/><circle cx="8.5" cy="20" r="1.6" fill="#ff5a8c" opacity=".7"/><circle cx="23.5" cy="20" r="1.6" fill="#ff5a8c" opacity=".7"/>')) },
    { id: 'star', n: 'Twinkle Star', hx: 16, hy: 16, trail: '#ffd400', frames: [1, 0.75, 0.5, 0.75].map(k => `<path d="M16 ${16 - 14 * k}l${3 * k} ${10 * k}l${11 * k} ${1 * k}l-${9 * k} ${6 * k}l${3 * k} ${10 * k}l-${8 * k} -${6 * k}l-${8 * k} ${6 * k}l${3 * k} -${10 * k}l-${9 * k} -${6 * k}l${11 * k} -${1 * k}z" fill="#ffd400" stroke="#a06000" stroke-width="1.2"/>`) },
    { id: 'rocket', n: 'Rocket Pointer', hx: 3, hy: 3, trail: '#ff6a00', frames: [0, 1, 2].map(i => `<g transform="rotate(-45 16 16)"><path d="M16 1q6 6 6 16v6H10v-6q0-10 6-16z" fill="#e8e8f0" stroke="#000" stroke-width="1.2"/><circle cx="16" cy="12" r="3" fill="#3a8aff" stroke="#000"/><path d="M10 18l-4 6h4zM22 18l4 6h-4z" fill="#e10600" stroke="#000"/><path d="M12 23l4 ${5 + i * 2} 4-${5 + i * 2}" fill="${['#ffd400', '#ff6a00', '#ff2000'][i]}"/></g>`) },
    { id: 'dave', n: 'Tiny Dave', hx: 4, hy: 2, frames: [0, 1].map(i => `<path d="M2 2l9 3-6 6z" fill="#fff" stroke="#000"/><circle cx="18" cy="11" r="5" fill="#f0c8a0" stroke="#000"/><path d="M13 9q5-6 10 0" fill="#7a4a1a"/><circle cx="16" cy="11" r=".9"/><circle cx="20" cy="11" r=".9"/><path d="M16 14q2 1 4 0" stroke="#000" fill="none"/><rect x="14" y="16" width="8" height="9" fill="#2a6ad8" stroke="#000"/><path d="M22 18l${i ? '5 -5' : '5 3'}M14 18l-4 4" stroke="#000" stroke-width="2"/><path d="M15 25v5M21 25v5" stroke="#000" stroke-width="2"/>`) },
    { id: 'choppa', n: 'Battle Axe', hx: 3, hy: 3, frames: [-20, 0, 20, 0].map(a => rot(a, '<path d="M3 3l24 24" stroke="#000" stroke-width="5" stroke-linecap="round"/><path d="M3 3l24 24" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M3.6 2.6l23 23" stroke="#c8925a" stroke-width="1"/><path d="M19 19l4 4M21 17l4 4" stroke="#3a2010" stroke-width="1.6"/><circle cx="27.5" cy="27.5" r="2.2" fill="#c8c8d0" stroke="#000"/><path d="M13 4q8-3 15 4l-5 2-4-1-1 4-2 5q-7-7-3-14z" fill="#d8dce8" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/><path d="M14.5 6q6-2 11 2.5" stroke="#fff" stroke-width="1.2" fill="none"/><path d="M12 13l-5 5 1.5 1.5 5-5z" fill="#9aa2b2" stroke="#000"/><path d="M14 11l3-3 2 2-3 3z" fill="#ffd400" stroke="#000" stroke-width=".8"/>')) },
    { id: 'hourglass', n: 'Hourglass of Gloom', hx: 16, hy: 16, frames: [0, 1, 2, 3].map(i => `<path d="M8 3h16v3l-6 10 6 10v3H8v-3l6-10-6-10z" fill="#fff8d8" stroke="#000" stroke-width="1.5"/><path d="M${10 + i} ${6 + i * 2}h${12 - i * 2}l-6 ${9 - i * 2}z" fill="#d8a020"/><path d="M16 ${17}v${i * 2 + 2}M${13 - i} 28h${6 + i * 2}" stroke="#d8a020" stroke-width="2.5"/><path d="M6 2h20M6 30h20" stroke="#5a3a10" stroke-width="2.5"/>`) },
    { id: 'rainbow', n: 'Rainbow Arrow', hx: 2, hy: 2, frames: ['#ff0000', '#ff8000', '#ffe000', '#00c000', '#0080ff', '#a000ff'].map(c => ARROW(c)) },
    { id: 'comet', n: 'Comet Tail', hx: 2, hy: 2, trail: '#9fd0ff', frames: [ARROW('#fff')] },
    { id: 'cube', n: 'Spinning Cube', hx: 16, hy: 16, frames: [0, 1, 2].map(i => { const C = [['#e10600', '#fff', '#1aa31a'], ['#0028c8', '#ffd400', '#ff7a00'], ['#fff', '#1aa31a', '#e10600']][i]; return `<path d="M16 3l12 6-12 6-12-6z" fill="${C[0]}" stroke="#000"/><path d="M4 9l12 6v14L4 23z" fill="${C[1]}" stroke="#000"/><path d="M28 9l-12 6v14l12-6z" fill="${C[2]}" stroke="#000"/><path d="M10 6l12 6M8 12v12M24 12v12" stroke="#000" stroke-width=".7"/>`; }) },
    { id: 'floppy', n: 'Floppy Flip', hx: 16, hy: 16, frames: [1, 0.6, 0.15, 0.6].map(k => `<g transform="translate(16 16) scale(${k} 1) translate(-16 -16)"><rect x="4" y="4" width="24" height="24" fill="#222" stroke="#000"/><rect x="9" y="4" width="13" height="9" fill="#c0c0c8"/><rect x="17" y="5" width="3" height="7" fill="#222"/><rect x="8" y="17" width="16" height="11" fill="#fff"/><path d="M10 20h12M10 23h9" stroke="#00f" stroke-width=".8"/></g>`) },
    { id: 'fire', n: 'Flaming Arrow', hx: 2, hy: 2, trail: '#ff4000', frames: [0, 1, 2].map(i => `<path d="M10 10q${8 + i * 3} ${4 - i} ${18 + i} ${18 - i}q-${10 - i} 0-${14 - i}-${8 + i}z" fill="${['#ff2000', '#ff6a00', '#ffb000'][i]}" opacity=".9"/>${ARROW('#ffd400', '#7a1a00')}`) },
    { id: 'gubbinz', n: 'Gubbinz Hand', hx: 8, hy: 2, frames: [0, 1].map(i => `<path d="M8 ${2 + i}h4v10h2V6h4v8h2v-5h3v10l-3 7H10l-6-9 3-2 3 3V${2 + i}z" fill="#5aac2c" stroke="#000" stroke-width="1.3"/><circle cx="16" cy="22" r="1" fill="#e10600"/>`) },
  ];
  const curUrl = (c, i, s) => 'data:image/svg+xml,' + encodeURIComponent(svgCur(c.frames[i % c.frames.length], s));
  let CUR = null; // { c, timer, style, i, trail }
  function applyCursor(id) {
    removeCursor();
    const c = CURS.find(x => x.id === id); if (!c) return;
    const st = document.createElement('style'); st.id = 'era-acur-style'; document.head.appendChild(st);
    document.documentElement.classList.add('era-acur');
    CUR = { c, st, i: 0, timer: 0, trail: null };
    const set = () => { st.textContent = `html.era-acur,html.era-acur *{cursor:url("${curUrl(c, CUR.i, 32)}") ${c.hx} ${c.hy},auto!important}`; };
    set();
    if (c.frames.length > 1) CUR.timer = setInterval(() => { if (document.hidden) return; CUR.i++; set(); }, 220);
    if (c.trail && fine()) startTrail(c.trail);
  }
  function removeCursor() {
    if (!CUR) return;
    clearInterval(CUR.timer); CUR.st.remove(); document.documentElement.classList.remove('era-acur');
    if (CUR.trail) CUR.trail();
    CUR = null;
  }
  function startTrail(col) {
    const N = 10, dots = [], pts = [];
    for (let i = 0; i < N; i++) { const d = document.createElement('div'); d.className = 'd2-trail'; d.style.background = `radial-gradient(circle,#fff 0 20%,${col} 45%,transparent 72%)`; d.style.opacity = 0; DesktopSurface.root().appendChild(d); dots.push(d); }
    let raf = 0, x = -99, y = -99, idle = 0;
    const mv = ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); x = p.x; y = p.y; idle = 0; };
    addEventListener('pointermove', mv, { passive: true });
    const loop = () => {
      raf = requestAnimationFrame(loop);
      pts.unshift([x, y]); pts.length = Math.min(pts.length, N * 2);
      idle++;
      dots.forEach((d, i) => { const p = pts[i * 2] || pts[pts.length - 1]; const k = 1 - i / N; d.style.transform = `translate(${p[0] + (i % 2 ? 3 : -3)}px,${p[1] + (i % 3) * 2}px) scale(${k * 1.4})`; d.style.opacity = idle > 20 ? 0 : (k * 0.85).toFixed(2); });
    };
    raf = requestAnimationFrame(loop);
    CUR.trail = () => { cancelAnimationFrame(raf); removeEventListener('pointermove', mv); dots.forEach(d => d.remove()); };
  }
  E.cursorBoot = () => { const v = store.get('jhp_era_cursor', null); if (v && v.id) applyCursor(v.id); };
  E.mods.cursors = K => {
    const b = h('div', 'd2-cur'); K.body.appendChild(b); K.body.style.position = 'relative';
    const curId = (store.get('jhp_era_cursor', null) || {}).id || '';
    let sel = curId || CURS[0].id;
    b.innerHTML = `<div class="d2-cur-ban">4,000 FREE CURSORS!!!<small>(12 included. The other 3,988 are in the next version.)</small></div>
      <div class="d2-cur-grid">${CURS.map(c => `<button type="button" class="d2-cur-it${c.id === sel ? ' sel' : ''}" data-c="${c.id}"><span class="pv"><img alt="" src="${curUrl(c, 0, 40)}"></span>${esc(c.n)}<em>${c.frames.length > 1 ? 'Animated!' : ''}${c.trail ? (c.frames.length > 1 ? ' + ' : '') + 'Trail!' : ''}</em></button>`).join('')}</div>
      <div class="d2-cur-bar"><span class="small">${fine() ? 'Pick a cursor and click Apply. It changes EVERYWHERE!' : 'Your computer has no mouse pointer. FREE Cursors 4000 is very sad. You can still pick one for when you get a mouse.'}</span><button class="btn" type="button" data-x="def">Restore JackOS Default</button><button class="btn" type="button" data-x="apply"><b>Apply</b></button></div>`;
    const imgs = [...b.querySelectorAll('.d2-cur-it')];
    let fr = 0; const anim = setInterval(() => { if (K.closed) return clearInterval(anim); fr++; imgs.forEach(it => { const c = CURS.find(x => x.id === it.dataset.c); if (c.frames.length > 1) it.querySelector('img').src = curUrl(c, fr, 40); }); }, 220);
    K.onClose(() => clearInterval(anim));
    imgs.forEach(it => it.addEventListener('click', () => { sel = it.dataset.c; imgs.forEach(x => x.classList.toggle('sel', x === it)); sfx('click'); }));
    imgs.forEach(it => it.addEventListener('dblclick', () => b.querySelector('[data-x=apply]').click()));
    b.querySelector('[data-x=apply]').addEventListener('click', () => {
      applyCursor(sel); store.set('jhp_era_cursor', { id: sel });
      const c = CURS.find(x => x.id === sel);
      K.status && K.status(`Cursor applied: ${c.n}`);
      Desk.toast('FREE Cursors 4000', `Your cursor is now: ${c.n}! Tell your friends about CursorWorld!`, 3500);
      E.secret('cur.apply');
    });
    b.querySelector('[data-x=def]').addEventListener('click', () => { removeCursor(); store.set('jhp_era_cursor', null); Desk.toast('FREE Cursors 4000', 'Boring old cursor restored. CursorWorld will miss you.', 3000); });
    // the adware survey: once, skippable, inside the window (not a pop-up)
    if (!store.get('jhp_era_cursurvey', false)) setTimeout(() => {
      if (K.closed) return;
      const sv = h('div', 'd2-survey');
      sv.innerHTML = `<div><b>CursorWorld wants to know you better!</b><p style="margin:6px 0 0">Quick survey! What is your favourite colour? (So we can send you colour-related offers.)</p><div class="sw">${['#e10600', '#ffd400', '#1aa31a', '#0028c8', '#5b16c9', '#ff7ac8', '#000', '#fff'].map(c => `<button type="button" style="background:${c}" aria-label="${c}" data-c="${c}"></button>`).join('')}</div><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-x="skip">Skip survey</button></div></div>`;
      K.body.appendChild(sv);
      const done = txt => { store.set('jhp_era_cursurvey', true); sv.remove(); if (txt) Desk.toast('CursorWorld', txt, 4000); };
      sv.querySelectorAll('[data-c]').forEach(x => x.addEventListener('click', () => { E.secret('cur.survey'); done('Thank you! You will now receive 400 e-mails a day about that colour. (No you won\'t.)'); }));
      sv.querySelector('[data-x=skip]').addEventListener('click', () => done(''));
    }, 1500);
  };

  // ================================================================ JACKSHOTS DESKTOP (a beautiful photo every day)
  const PW = 400, PH = 300;
  const PHOTOS = [
    { n: 'Sunset Over The Sea', by: 'R. Wiggins', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH * 0.62); s.addColorStop(0, '#2a1a5a'); s.addColorStop(0.5, '#e0503a'); s.addColorStop(1, '#ffc040'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); g.fillStyle = '#ffe080'; g.beginPath(); g.arc(PW * 0.6, PH * 0.6, 34, Math.PI, 0); g.fill(); const sea = g.createLinearGradient(0, PH * 0.6, 0, PH); sea.addColorStop(0, '#d0603a'); sea.addColorStop(1, '#1a1a4a'); g.fillStyle = sea; g.fillRect(0, PH * 0.6, PW, PH); g.fillStyle = 'rgba(255,220,120,.7)'; for (let i = 0; i < 26; i++) { const y = PH * 0.62 + i * 4.5, w = 70 - i * 2 + r() * 20; g.fillRect(PW * 0.6 - w / 2 + (r() - 0.5) * 10, y, w, 1.6); } g.fillStyle = '#100820'; g.beginPath(); g.moveTo(0, PH * 0.6); g.lineTo(60, PH * 0.52); g.lineTo(110, PH * 0.6); g.fill(); } },
    { n: 'Saturn, From Quite Close', by: 'The Jackecibo Observatory', paint: (g, r) => { g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${r()})`; g.fillRect(r() * PW, r() * PH, 1.2, 1.2); } g.save(); g.translate(200, 150); g.rotate(-0.35); g.strokeStyle = 'rgba(220,200,150,.85)'; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 0, 150, 34, 0, Math.PI, 0); g.stroke(); const p = g.createRadialGradient(-20, -25, 5, 0, 0, 70); p.addColorStop(0, '#fff0c8'); p.addColorStop(0.6, '#d8b070'); p.addColorStop(1, '#5a3a10'); g.fillStyle = p; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,110,60,.4)'; g.lineWidth = 5; [-30, -10, 15, 35].forEach(y => { g.beginPath(); g.ellipse(0, y, 66, 6, 0, 0, Math.PI); g.stroke(); }); g.strokeStyle = 'rgba(230,210,160,.9)'; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 0, 150, 34, 0, 0, Math.PI); g.stroke(); g.restore(); } },
    { n: 'Blobbit In A Field', by: 'Jack (age: secret)', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH); s.addColorStop(0, '#5ab8f0'); s.addColorStop(0.55, '#c8e8ff'); s.addColorStop(0.56, '#5aac2c'); s.addColorStop(1, '#2a7a1a'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); for (let i = 0; i < 300; i++) { g.strokeStyle = r() < 0.5 ? '#3a8a1a' : '#7ac84a'; g.beginPath(); const x = r() * PW, y = PH * 0.56 + r() * PH * 0.45; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 6); g.stroke(); } const daisy = (x, y, k) => { g.fillStyle = '#fff'; for (let a = 0; a < 8; a++) { g.beginPath(); g.ellipse(x + Math.cos(a * 0.785) * 3 * k, y + Math.sin(a * 0.785) * 1.8 * k, 2 * k, 1.1 * k, a * 0.785, 0, 7); g.fill(); } g.fillStyle = '#ffd400'; g.beginPath(); g.arc(x, y, 1.4 * k, 0, 7); g.fill(); }; for (let i = 0; i < 26; i++) { const yy = PH * 0.6 + r() * PH * 0.38; daisy(r() * PW, yy, 0.6 + (yy - PH * 0.6) / PH * 2.4); } { const bx = 210, by = 214, bg = g.createRadialGradient(bx - 12, by - 14, 3, bx, by, 36); bg.addColorStop(0, '#b0eaff'); bg.addColorStop(0.45, '#3aa0f0'); bg.addColorStop(1, '#1450a8'); g.strokeStyle = '#0a2a6a'; g.lineWidth = 2; g.fillStyle = '#2a80d8'; [[-20, -24], [20, -24]].forEach(([dx, dy]) => { g.beginPath(); g.arc(bx + dx, by + dy, 9, 0, 7); g.fill(); g.stroke(); }); g.fillStyle = '#ffb0c8'; [[-20, -24], [20, -24]].forEach(([dx, dy]) => { g.beginPath(); g.arc(bx + dx, by + dy, 4, 0, 7); g.fill(); }); g.fillStyle = bg; g.beginPath(); g.ellipse(bx, by, 34, 29, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(bx - 15, by - 16, 7, 3.5, -0.6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.5; [-10, 10].forEach(dx => { g.beginPath(); g.ellipse(bx + dx, by - 6, 7, 8.5, 0, 0, 7); g.fill(); g.stroke(); }); g.fillStyle = '#000'; [-8, 12].forEach(dx => { g.beginPath(); g.arc(bx + dx, by - 5, 3.6, 0, 7); g.fill(); }); g.fillStyle = '#fff'; [-9, 11].forEach(dx => g.fillRect(bx + dx, by - 8, 2, 2)); g.fillStyle = 'rgba(255,80,140,.6)'; [-24, 24].forEach(dx => { g.beginPath(); g.ellipse(bx + dx, by + 6, 5, 3, 0, 0, 7); g.fill(); }); g.fillStyle = '#5a0a20'; g.beginPath(); g.moveTo(bx - 9, by + 7); g.quadraticCurveTo(bx, by + 20, bx + 9, by + 7); g.closePath(); g.fill(); g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(bx, by + 13, 4, 2, 0, 0, 7); g.fill(); daisy(bx + 24, by - 30, 1.6); daisy(bx - 40, by + 26, 1.4); daisy(bx + 38, by + 24, 1.4); } g.fillStyle = '#fff'; [[60, 50], [300, 70], [180, 40]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 16, 0, 7); g.arc(x + 18, y - 6, 18, 0, 7); g.arc(x + 36, y, 14, 0, 7); g.fill(); }); } },
    { n: 'A Very Nice Rock', by: 'Dave\'s Dad', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH); s.addColorStop(0, '#9ab8d0'); s.addColorStop(0.6, '#d8d0c0'); s.addColorStop(1, '#a89a80'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); const rk = g.createRadialGradient(170, 150, 10, 200, 190, 120); rk.addColorStop(0, '#a8a8a0'); rk.addColorStop(0.7, '#6a6a64'); rk.addColorStop(1, '#3a3a34'); g.fillStyle = rk; g.beginPath(); g.moveTo(80, 260); g.quadraticCurveTo(90, 140, 190, 120); g.quadraticCurveTo(300, 110, 320, 260); g.closePath(); g.fill(); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},.15)`; g.beginPath(); g.arc(110 + r() * 190, 150 + r() * 100, 2 + r() * 6, 0, 7); g.fill(); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(60, 258, 290, 8); g.fillStyle = '#fff'; g.font = 'italic 12px Georgia'; g.fillText('"It\'s a really good one" - Dave\'s Dad', 10, 290); } },
    { n: 'Misty Mountains', by: 'P. Pottsworth', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH); s.addColorStop(0, '#f0d8c8'); s.addColorStop(1, '#a8b8d8'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); ['#8a98b8', '#6a7898', '#4a5878', '#2a3858'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, PH); let x = 0; g.lineTo(0, 120 + k * 40); while (x < PW) { x += 20 + r() * 40; g.lineTo(x, 90 + k * 45 + (r() - 0.5) * 70); } g.lineTo(PW, PH); g.fill(); if (k === 0) { g.fillStyle = '#fff'; } }); } },
    { n: 'Jack Island Beach', by: 'Zib (stranded)', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH * 0.55); s.addColorStop(0, '#3a90e0'); s.addColorStop(1, '#bfe6ff'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); g.fillStyle = '#1a6ac0'; g.fillRect(0, PH * 0.55, PW, PH); g.fillStyle = '#3ac8d8'; g.fillRect(0, PH * 0.7, PW, PH); g.fillStyle = '#f0d890'; g.beginPath(); g.ellipse(200, 290, 260, 70, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#7a4a1a'; g.lineWidth = 9; g.beginPath(); g.moveTo(130, 240); g.quadraticCurveTo(110, 150, 150, 80); g.stroke(); g.strokeStyle = '#2a8a2a'; g.lineWidth = 8; [[-60, 10], [60, 0], [-40, 40], [50, 45], [0, -40]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(150, 80); g.quadraticCurveTo(150 + dx * 0.6, 60 + dy * 0.2, 150 + dx, 80 + dy); g.stroke(); }); g.fillStyle = '#ffd400'; g.beginPath(); g.arc(330, 50, 22, 0, 7); g.fill(); g.strokeStyle = '#1d4a10'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(244, 230); g.lineTo(241, 223); g.moveTo(250, 230); g.lineTo(253, 223); g.stroke(); g.fillStyle = '#b8ff60'; [[241, 222], [253, 222]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }); g.fillStyle = '#5aac2c'; g.fillRect(242, 242, 10, 10); g.beginPath(); g.arc(247, 235, 7, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#000'; g.beginPath(); g.ellipse(244.5, 235, 1.6, 2.4, -0.3, 0, 7); g.ellipse(249.5, 235, 1.6, 2.4, 0.3, 0, 7); g.fill(); g.fillStyle = '#5aac2c'; g.fillRect(238, 243, 4, 2); g.fillRect(252, 238, 2, 6); g.fillStyle = '#fff'; g.font = 'bold 10px Arial'; g.fillText('HELP', 300, 255); } },
    { n: 'The Waterfall', by: 'S. Gemington', paint: (g, r) => { g.fillStyle = '#2a5a2a'; g.fillRect(0, 0, PW, PH); g.fillStyle = '#5a5a50'; g.fillRect(140, 0, 120, PH); const w = g.createLinearGradient(160, 0, 240, 0); w.addColorStop(0, '#9fd0ff'); w.addColorStop(0.5, '#fff'); w.addColorStop(1, '#9fd0ff'); g.fillStyle = w; g.fillRect(160, 20, 80, 230); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(150 + r() * 100, 245 + r() * 30, 4 + r() * 10, 0, 7); g.fill(); } g.fillStyle = '#1a6a9a'; g.fillRect(0, 270, PW, 30); for (let i = 0; i < 50; i++) { g.fillStyle = r() < 0.5 ? '#1a4a1a' : '#3a7a2a'; g.beginPath(); g.arc(r() < 0.5 ? r() * 140 : 260 + r() * 140, r() * PH, 10 + r() * 20, 0, 7); g.fill(); } } },
    { n: 'City Lights', by: 'N. Owl', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH); s.addColorStop(0, '#000010'); s.addColorStop(1, '#2a1a4a'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); g.fillStyle = '#f8f8e0'; g.beginPath(); g.arc(320, 50, 16, 0, 7); g.fill(); let x = 0; while (x < PW) { const w = 20 + r() * 34, hh = 60 + r() * 150; g.fillStyle = '#0a0a18'; g.fillRect(x, PH - hh, w, hh); for (let yy = PH - hh + 6; yy < PH - 6; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (r() < 0.45) { g.fillStyle = r() < 0.8 ? '#ffd860' : '#9fd0ff'; g.fillRect(xx, yy, 3, 4); } x += w + 2; } } },
    { n: 'Autumn Trees', by: 'L. Leafman', paint: (g, r) => { const s = g.createLinearGradient(0, 0, 0, PH); s.addColorStop(0, '#d8e8f0'); s.addColorStop(1, '#c8a878'); g.fillStyle = s; g.fillRect(0, 0, PW, PH); for (let i = 0; i < 7; i++) { const x = 30 + i * 58 + r() * 20; g.fillStyle = '#4a2a10'; g.fillRect(x - 4, 150, 8, 150); for (let k = 0; k < 40; k++) { g.fillStyle = ['#e06010', '#f0a020', '#c03010', '#e8c040', '#8a3a10'][Math.floor(r() * 5)]; g.beginPath(); g.arc(x + (r() - 0.5) * 70, 110 + (r() - 0.5) * 90, 6 + r() * 8, 0, 7); g.fill(); } } for (let k = 0; k < 120; k++) { g.fillStyle = ['#e06010', '#f0a020', '#c03010'][Math.floor(r() * 3)]; g.fillRect(r() * PW, 260 + r() * 40, 4, 3); } } },
    { n: 'RARE: Dave Smiling', by: 'Jack (it took 40 tries)', paint: (g, r) => { g.fillStyle = '#c8b090'; g.fillRect(0, 0, PW, PH); g.fillStyle = '#a89070'; for (let i = 0; i < 10; i++) g.fillRect(i * 44, 0, 2, PH); const f = g.createRadialGradient(190, 130, 10, 200, 150, 90); f.addColorStop(0, '#ffe0c0'); f.addColorStop(1, '#d8a078'); g.fillStyle = '#2a5ab0'; g.fillRect(110, 220, 180, 80); g.fillStyle = f; g.beginPath(); g.ellipse(200, 150, 70, 85, 0, 0, 7); g.fill(); g.fillStyle = '#6a3a10'; g.beginPath(); g.ellipse(200, 82, 74, 34, 0, Math.PI, 0); g.fill(); g.fillRect(126, 80, 148, 18); g.fillStyle = '#000'; [175, 225].forEach(x => { g.beginPath(); g.arc(x, 140, 6, 0, 7); g.fill(); }); g.strokeStyle = '#7a2a10'; g.lineWidth = 4; g.beginPath(); g.arc(200, 168, 30, 0.25, Math.PI - 0.25); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(320, 40, 30, 0, 7); g.fill(); g.fillStyle = '#e10600'; g.font = 'bold 14px Arial'; g.fillText('RED EYE', 286, 90); } },
  ];
  const photoCache = {};
  function photoCanvas(i) {
    if (photoCache[i]) return photoCache[i];
    const c = document.createElement('canvas'); c.width = PW; c.height = PH;
    const g = c.getContext('2d'); try { PHOTOS[i].paint(g, rng('grotshot' + i)); } catch (e) { console.error(e); }
    // a touch of film grain, for authenticity
    const r = rng('grain' + i); g.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 500; k++) g.fillRect(r() * PW, r() * PH, 1, 1);
    return (photoCache[i] = c);
  }
  // the desktop wallpaper, in the same format Display Properties uses (apps-programs.js: jhp_prog_wall = {img, col, mode})
  function setWallpaper(dataUrl, mode) {
    const w = { img: dataUrl, col: '#008080', mode: mode || 'Stretch' };
    const css = w.mode === 'Center' ? `url("${w.img}") center/auto no-repeat,${w.col}` : w.mode === 'Stretch' ? `url("${w.img}") center/100% 100% no-repeat,${w.col}` : `url("${w.img}") 0 0/auto repeat,${w.col}`;
    const d = document.getElementById('desktop'); if (d) d.style.background = css;
    try { localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); return true; } catch (e) { Desk.toast('JackShots', 'Your hard disk is full! The wallpaper will be forgotten when you restart.', 3500); return false; }
  }
  // save a picture where Paint keeps its pictures (apps-programs.js: jhp_prog_pics = [{name, data, date}], max 15), so Paint can open it
  function savePicture(name, dataUrl) {
    let list = store.get('jhp_prog_pics', []); if (!Array.isArray(list)) list = [];
    list = list.filter(p => p && p.name !== name); list.unshift({ name, data: dataUrl, date: d99() });
    while (list.length > 15) list.pop();
    let ok = false; while (!ok && list.length) { try { localStorage.setItem('jhp_prog_pics', JSON.stringify(list)); ok = true; } catch (e) { list.pop(); } }
    if (!ok) return false;
    const dir = Apps.fs.dir('C:/My Documents/My Pictures');
    dir.kids = dir.kids.filter(k => !(k.painted && k.name === name));
    dir.kids.push({ name, type: 'png', dataURL: dataUrl, date: d99(), size: Math.round(dataUrl.length * 0.75 / 1024) + ' KB', painted: true });
    return true;
  }
  E.mods.photo = K => {
    const t = E.today(), doy = Math.floor((t.date - new Date(1999, 0, 1)) / 86400000);
    const todayIdx = doy % PHOTOS.length; let cur = todayIdx;
    const ratings = store.get('jhp_era_shotrate', {});
    const b = h('div', 'd2-ph'); K.body.appendChild(b); K.body.classList.add('d2-phbody');
    b.innerHTML = `<div class="d2-ph-top">&#128247; JackShots <span style="font:11px var(--ui)">Photo of the Day</span><i>${d99()}</i></div>
      <div class="d2-ph-main"><div class="d2-ph-pic"></div><div class="d2-ph-side"><div class="d2-ph-cap"></div><div class="small d2-ph-by"></div><div class="d2-ph-stars" aria-label="Rate this photo">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-s="${i}" aria-label="${i} stars">&#9733;</button>`).join('')}</div><button class="btn" type="button" data-x="wall">Set as Wallpaper</button><button class="btn" type="button" data-x="save">Save to My Pictures</button><button class="btn" type="button" data-x="more">Download 1,000 more!</button></div></div>
      <div class="d2-ph-strip"></div>`;
    const pic = b.querySelector('.d2-ph-pic'), strip = b.querySelector('.d2-ph-strip');
    PHOTOS.forEach((p, i) => { const c = document.createElement('canvas'); c.width = 128; c.height = 96; c.getContext('2d').drawImage(photoCanvas(i), 0, 0, 128, 96); c.title = p.n; c.dataset.i = i; c.addEventListener('click', () => { cur = i; show(); }); strip.appendChild(c); });
    function show() {
      const c = document.createElement('canvas'); c.width = PW; c.height = PH; c.getContext('2d').drawImage(photoCanvas(cur), 0, 0);
      pic.innerHTML = ''; pic.appendChild(c);
      b.querySelector('.d2-ph-cap').textContent = PHOTOS[cur].n + (cur === todayIdx ? '  (today!)' : '');
      b.querySelector('.d2-ph-by').textContent = 'Photo: ' + PHOTOS[cur].by;
      b.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s <= (ratings[cur] || 0)));
      strip.querySelectorAll('canvas').forEach(x => x.classList.toggle('sel', +x.dataset.i === cur));
      K.status(`Photo ${cur + 1} of ${PHOTOS.length} in your album. Next new photo: tomorrow at 9:00.`);
      if (cur === 9) E.secret('shots.dave');
    }
    b.querySelectorAll('[data-s]').forEach(x => x.addEventListener('click', () => { ratings[cur] = +x.dataset.s; store.set('jhp_era_shotrate', ratings); show(); Desk.toast('JackShots', `You gave "${PHOTOS[cur].n}" ${x.dataset.s} star${x.dataset.s > 1 ? 's' : ''}. ${+x.dataset.s === 5 ? 'The photographer is delighted.' : +x.dataset.s === 1 ? 'The photographer is crying.' : 'Thank you for voting!'}`, 3000); }));
    const toWall = () => { const url = photoCanvas(cur).toDataURL('image/jpeg', 0.85); if (setWallpaper(url, 'Stretch')) { Desk.toast('JackShots', `"${PHOTOS[cur].n}" is now your desktop wallpaper!`, 3000); E.secret('shots.wall'); } };
    const toSave = () => { const nm = PHOTOS[cur].n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20) + '.jpg'; if (savePicture(nm, photoCanvas(cur).toDataURL('image/jpeg', 0.85))) Desk.toast('JackShots', `Saved C:\\My Documents\\My Pictures\\${nm}`, 3000); else Desk.msgbox('JackShots', 'There is not enough disk space. Try deleting some of Dave\'s shareware.', 'warn'); };
    const more = () => {
      const d = h('div'); d.innerHTML = `<p style="margin:0 0 8px">Downloading 1,000 photos from JackShots.netz...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="small d2-ph-eta" style="margin:8px 0">Estimated time left: 2 hours 14 minutes (at 4.8 KB/sec)</p><div class="row" style="justify-content:flex-end"><button class="btn" type="button">Cancel</button></div>`;
      const w = Apps.win('JackShots Download', d, { w: 340, icon: E.I.photo, noResize: true, noMax: true, noMin: true, escClose: true });
      const bar = d.querySelector('.prog span'), eta = d.querySelector('.d2-ph-eta'); let n = 0;
      const tm = setInterval(() => { if (w.closed) return clearInterval(tm); n++; if (n <= 2) bar.appendChild(document.createElement('i')); eta.textContent = n < 6 ? `Estimated time left: 2 hours ${14 + n} minutes (at ${(4.8 - n * 0.6).toFixed(1)} KB/sec)` : 'Your Mom has picked up the phone. Download stopped at photo 3 of 1,000.'; if (n >= 6) { clearInterval(tm); E.secret('shots.more'); } }, 1100);
      d.querySelector('.btn').addEventListener('click', w.close);
    };
    b.querySelector('[data-x=wall]').addEventListener('click', toWall);
    b.querySelector('[data-x=save]').addEventListener('click', toSave);
    b.querySelector('[data-x=more]').addEventListener('click', more);
    K.menus([
      ['File', [{ label: 'Set as Wallpaper', act: toWall }, { label: 'Save to My Pictures', act: toSave }, '-', { label: 'Exit', act: () => K.w.close() }]],
      ['View', () => [{ label: "Today's Photo", act: () => { cur = todayIdx; show(); } }, { label: 'Next Photo', act: () => { cur = (cur + 1) % PHOTOS.length; show(); } }, { label: 'Previous Photo', act: () => { cur = (cur + PHOTOS.length - 1) % PHOTOS.length; show(); } }, '-', { label: 'Download 1,000 more photos...', act: more }]],
      ['Help', [{ label: 'About JackShots...', act: () => E.about('JackShots Desktop', E.I.photo, ['<b>JackShots Desktop 3.0</b>', 'A brand new photo every day! Ten in the album. More coming soon (when the modem finishes).', 'All photos taken by real photographers. Most of them are Dave\'s Dad.']) }]],
    ]);
    show();
  };

  // ================================================================ GROT'S POWER TOOLS 3 (shiny rocks, glowing orbs, nobody knows what anything does)
  const KW = 320, KH = 240;
  function hsl(h, s, l) { h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100; const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; }
  E.mods.kpt = K => {
    const b = h('div', 'd2-kpt'); K.body.appendChild(b); K.body.style.height = '100%';
    const TOOLS = [['sphere', 'Spheroid Designer', '#3a8aff'], ['grad', 'Gradient Designer', '#ff3ad8'], ['fract', 'Fractal Explorer', '#3aff8a'], ['twirl', 'Twirl', '#ffb03a'], ['curl', 'Page Curl', '#ff3a3a']];
    const SL = { sphere: ['Glow', 'Hue', 'How Many'], grad: ['Hue Spin', 'Wiggles', 'Angle'], fract: ['Iterations', 'Colour Cycle', 'Psychedelia'], twirl: ['Twirliness', 'Radius', 'Wobble'], curl: ['Curl', 'Shadow', 'Shine'] };
    b.innerHTML = `<div class="d2-kpt-hint">Jack's Power Tools 3</div>
      <div class="d2-kpt-mid"><div class="d2-kpt-orbs">${TOOLS.map(([id, n, c]) => `<button type="button" class="d2-orb" data-t="${id}" data-n="${esc(n)}" style="--c:${c}" aria-label="${esc(n)}"></button>`).join('')}</div>
      <div class="d2-kpt-lens"><canvas width="${KW}" height="${KH}"></canvas></div>
      <div class="d2-kpt-sl">${[0, 1, 2].map(i => `<div class="d2-sl" data-i="${i}" role="slider" aria-valuemin="0" aria-valuemax="100" tabindex="0"><i></i></div>`).join('')}</div></div>
      <div class="d2-kpt-bot">${[['rand', 'Random! (Mutate)', '#ffd400'], ['save', 'Save to My Pictures', '#9fd0ff'], ['wall', 'Use as Wallpaper', '#b6ff00'], ['help', 'Help (good luck)', '#ffffff'], ['quit', 'Exit', '#ff6a3a']].map(([id, n, c]) => `<button type="button" class="d2-orb" data-b="${id}" data-n="${esc(n)}" style="--c:${c}" aria-label="${esc(n)}"></button>`).join('')}</div>`;
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'), hint = b.querySelector('.d2-kpt-hint');
    let tool = 'sphere', vals = { sphere: [0.6, 0.55, 0.5], grad: [0.2, 0.4, 0.3], fract: [0.5, 0.3, 0.5], twirl: [0.88, 0.75, 0.25], curl: [0.4, 0.6, 0.5] };
    let base = null, fv = { cx: -0.6, cy: 0, sc: 3 }, job = 0, seed = 1, hintT = 0;
    const say = (txt, ms) => { hint.textContent = txt; clearTimeout(hintT); if (ms) hintT = setTimeout(() => { hint.textContent = "Jack's Power Tools 3"; }, ms); };
    // names show on hover (desktop) AND briefly on tap (phones), like the real thing's mystery buttons
    b.querySelectorAll('[data-n]').forEach(o => { o.addEventListener('pointerenter', () => say(o.dataset.n)); o.addEventListener('pointerleave', () => say("Jack's Power Tools 3")); });
    const sliders = [...b.querySelectorAll('.d2-sl')];
    const syncSl = () => sliders.forEach((s, i) => { s.querySelector('i').style.left = `calc(10px + ${vals[tool][i]} * (100% - 20px))`; s.setAttribute('aria-valuenow', Math.round(vals[tool][i] * 100)); s.setAttribute('aria-label', SL[tool][i]); });
    sliders.forEach((s, i) => {
      let on = false;
      const set = ev => { const r = s.getBoundingClientRect(); vals[tool][i] = clamp((ev.clientX - r.left - 10) / Math.max(1, r.width - 20), 0, 1); syncSl(); say(`${SL[tool][i]}: ${Math.round(vals[tool][i] * 100)}`, 1500); render(); };
      s.addEventListener('pointerdown', ev => { on = true; s.setPointerCapture(ev.pointerId); set(ev); });
      s.addEventListener('pointermove', ev => { if (on) set(ev); });
      s.addEventListener('pointerup', () => { on = false; }); s.addEventListener('pointercancel', () => { on = false; });
      s.addEventListener('pointerenter', () => say(SL[tool][i]));
      s.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { vals[tool][i] = clamp(vals[tool][i] + (ev.key === 'ArrowRight' ? 0.05 : -0.05), 0, 1); syncSl(); render(); ev.preventDefault(); } });
    });
    function snapshot() { base = g.getImageData(0, 0, KW, KH); }
    function render() {
      const v = vals[tool]; job++;
      if (tool === 'sphere') {
        const r = rng('sph' + seed), n = 1 + Math.round(v[2] * 8);
        const bg = g.createRadialGradient(KW / 2, KH / 2, 10, KW / 2, KH / 2, KW * 0.7); bg.addColorStop(0, '#202040'); bg.addColorStop(1, '#000'); g.fillStyle = bg; g.fillRect(0, 0, KW, KH);
        for (let i = 0; i < n; i++) {
          const rad = n === 1 ? 90 : 20 + r() * 50, x = n === 1 ? KW / 2 : rad + r() * (KW - rad * 2), y = n === 1 ? KH / 2 : rad + r() * (KH - rad * 2);
          const [R, G, B] = hsl(v[1] * 360 + i * 37, 80, 50), [R2, G2, B2] = hsl(v[1] * 360 + i * 37 + 40, 90, 15);
          const gr = g.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.02, x, y, rad); gr.addColorStop(0, '#fff'); gr.addColorStop(0.08 + v[0] * 0.2, `rgb(${R},${G},${B})`); gr.addColorStop(1, `rgb(${R2},${G2},${B2})`);
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
          g.fillStyle = `rgba(255,255,255,${0.2 + v[0] * 0.5})`; g.beginPath(); g.ellipse(x + rad * 0.3, y + rad * 0.55, rad * 0.35, rad * 0.12, -0.4, 0, 7); g.fill();
        }
        snapshot();
      } else if (tool === 'grad') {
        const img = g.createImageData(KW, KH), d = img.data, ang = v[2] * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang), wig = 1 + v[1] * 8;
        for (let y = 0, p = 0; y < KH; y++) for (let x = 0; x < KW; x++, p += 4) {
          const u = (x * ca + y * sa) / KW, w = Math.sin(u * wig * Math.PI + Math.sin(y / KH * 6) * v[1] * 2);
          const [R, G, B] = hsl(v[0] * 360 + u * 300 + w * 40, 85, 45 + w * 15); d[p] = R; d[p + 1] = G; d[p + 2] = B; d[p + 3] = 255;
        }
        g.putImageData(img, 0, 0); snapshot();
      } else if (tool === 'fract') {
        // progressive: chunky first, then finer, a few rows per frame so the window stays responsive
        const my = job, iters = 24 + Math.round(v[0] * 200), cyc = 2 + v[1] * 30, psy = v[2];
        let step = 8, row = 0;
        const img = g.createImageData(KW, KH), d = img.data;
        const pass = () => {
          if (my !== job || K.closed) return;
          const until = performance.now() + 12;
          while (performance.now() < until && step >= 1) {
            for (let x = 0; x < KW; x += step) {
              const cr = fv.cx + (x / KW - 0.5) * fv.sc, ci = fv.cy + (row / KH - 0.5) * fv.sc * KH / KW;
              let zr = 0, zi = 0, i = 0; while (i < iters && zr * zr + zi * zi < 4) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; i++; }
              const [R, G, B] = i >= iters ? [0, 0, 0] : hsl(i * cyc + psy * 360, 90, 30 + 30 * Math.sin(i * 0.3 * (0.2 + psy)) ** 2);
              for (let yy = row; yy < Math.min(KH, row + step); yy++) for (let xx = x; xx < Math.min(KW, x + step); xx++) { const p = (yy * KW + xx) * 4; d[p] = R; d[p + 1] = G; d[p + 2] = B; d[p + 3] = 255; }
            }
            row += step; if (row >= KH) { row = 0; step = step === 8 ? 2 : step === 2 ? 1 : 0; g.putImageData(img, 0, 0); if (!step) { snapshot(); return; } }
          }
          g.putImageData(img, 0, 0);
          requestAnimationFrame(pass);
        };
        pass();
      } else if (tool === 'twirl' || tool === 'curl') {
        if (!base) { const t0 = tool; tool = 'sphere'; render(); tool = t0; }
        const src = base.data, img = g.createImageData(KW, KH), d = img.data;
        if (tool === 'twirl') {
          const R = 40 + v[1] * 200, amt = (v[0] - 0.5) * 12, wob = v[2] * 0.3;
          for (let y = 0, p = 0; y < KH; y++) for (let x = 0; x < KW; x++, p += 4) {
            const dx = x - KW / 2, dy = y - KH / 2, dist = Math.sqrt(dx * dx + dy * dy);
            let sx = x, sy = y;
            if (dist < R) { const k = (R - dist) / R, a = Math.atan2(dy, dx) + amt * k * k + Math.sin(dist * 0.15) * wob; sx = KW / 2 + Math.cos(a) * dist; sy = KH / 2 + Math.sin(a) * dist; }
            const q = ((clamp(sy | 0, 0, KH - 1)) * KW + clamp(sx | 0, 0, KW - 1)) * 4; d[p] = src[q]; d[p + 1] = src[q + 1]; d[p + 2] = src[q + 2]; d[p + 3] = 255;
          }
          g.putImageData(img, 0, 0);
        } else {
          g.putImageData(base, 0, 0);
          const c = 30 + v[0] * 150, x0 = KW - c, y0 = KH - c * 0.8;
          g.fillStyle = '#000'; g.beginPath(); g.moveTo(x0, KH); g.lineTo(KW, y0); g.lineTo(KW, KH); g.fill();
          g.fillStyle = `rgba(0,0,0,${0.2 + v[1] * 0.6})`; g.beginPath(); g.moveTo(x0 - 8, KH); g.quadraticCurveTo(x0 + c * 0.2, y0 + c * 0.2, KW, y0 - 8); g.lineTo(KW, KH); g.fill();
          const sh = g.createLinearGradient(x0, KH, KW, y0); sh.addColorStop(0, '#888'); sh.addColorStop(0.5 - v[2] * 0.3, '#fff'); sh.addColorStop(1, '#bbb');
          g.fillStyle = sh; g.beginPath(); g.moveTo(x0, KH); g.quadraticCurveTo(x0 + c * 0.15, y0 + c * 0.1, KW, y0); g.quadraticCurveTo(x0 + c * 0.45, y0 + c * 0.55, x0, KH); g.fill();
        }
      }
    }
    const pickTool = id => { tool = id; b.querySelectorAll('[data-t]').forEach(o => o.classList.toggle('on', o.dataset.t === id)); syncSl(); render(); };
    b.querySelectorAll('[data-t]').forEach(o => o.addEventListener('click', () => { say(o.dataset.n, 1800); sfx('zap'); pickTool(o.dataset.t); E.secret('kpt.use'); }));
    cv.addEventListener('click', ev => {
      if (tool !== 'fract') { seed++; render(); return; }
      const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      fv.cx += (x - 0.5) * fv.sc; fv.cy += (y - 0.5) * fv.sc * KH / KW; fv.sc *= 0.45; say(`Zoom: ${Math.round(3 / fv.sc)}x`, 1500); render();
    });
    cv.addEventListener('contextmenu', ev => { ev.preventDefault(); if (tool === 'fract') { fv = { cx: -0.6, cy: 0, sc: 3 }; render(); } });
    const doSave = () => { const nm = 'gpt_' + tool + '_' + seed + '.png'; if (savePicture(nm, cv.toDataURL('image/png'))) { say('Saved to My Pictures!', 2000); Desk.toast("Jack's Power Tools", `Saved C:\\My Documents\\My Pictures\\${nm}. It's art.`, 3000); } else Desk.msgbox("Jack's Power Tools", 'Not enough disk space for this much art.', 'warn'); };
    const doWall = () => { if (setWallpaper(cv.toDataURL('image/jpeg', 0.9), 'Stretch')) { say('Wallpaper set!', 2000); Desk.toast("Jack's Power Tools", 'Your desktop is now ART.', 3000); E.secret('kpt.wall'); } };
    b.querySelectorAll('[data-b]').forEach(o => o.addEventListener('click', () => {
      const a = o.dataset.b; say(o.dataset.n, 1800);
      if (a === 'rand') { Object.keys(vals).forEach(k => { vals[k] = vals[k].map(() => Math.random()); }); seed++; if (tool === 'fract') fv = { cx: pick([-0.745, -0.1, -1.25, 0.28]), cy: pick([0.11, 0.65, 0.02, 0.01]), sc: 0.3 + Math.random() * 0.5 }; syncSl(); render(); sfx('dice'); }
      if (a === 'save') doSave();
      if (a === 'wall') doWall();
      if (a === 'help') Desk.msgbox("Jack's Power Tools 3 Help", "WELCOME TO JACK'S POWER TOOLS 3!\n\nThe glowing orbs on the left are the tools. The shiny slidey things on the right do things. The orbs at the bottom do other things.\n\nWhat do they do? Point at them and find out. Or click them. Or don't.\n\nClick the picture to change it. In the Fractal Explorer, click to zoom in and right-click to zoom out.\n\nThis interface was designed by a man who had too much Sunny Delight. It won an award.", 'info');
      if (a === 'quit') K.w.close();
    }));
    K.status && K.status('');
    pickTool('sphere');
  };
})();

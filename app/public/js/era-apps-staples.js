/* era-apps-staples: Staples the staple, the JackOS Assistant (lazy loaded by era-apps.js). He pops up (gently) when a
 * writing program opens, offers to help with your letter, idles about doing little animations, and can be swapped for a
 * dog, a wizard, a robot or a bouncing Blobbit in the Gallery. Right-click him for Hide / Options. All drawn on canvas. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const { h, esc, store, pick, sfx, note } = E;
  const CW = 96, CH = 96; // character canvas size (CSS px)

  E.css('staples', `
.era-asst{position:fixed;z-index:3400;display:flex;flex-direction:column;align-items:flex-end;touch-action:none;transition:opacity .4s}
.era-asst.bye{opacity:0}
.era-asst-box{width:${CW + 8}px;background:#c0c0c0;border:1px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset -1px -1px #808080,inset 1px 1px #fff;padding:2px}
.era-asst-tb{height:12px;background:linear-gradient(90deg,var(--title1),var(--title2));display:flex;align-items:center;justify-content:space-between;padding:0 1px 0 3px;cursor:move;touch-action:none}
.era-asst-tb span{color:#fff;font:bold 9px var(--ui);white-space:nowrap;overflow:hidden}
.era-asst-tb button{width:11px;height:9px;padding:0;background:var(--face);border:1px solid;border-color:#fff #000 #000 #fff;font:bold 8px/6px Arial;color:#000;cursor:pointer}
.era-asst-cv{display:block;width:${CW}px;height:${CH}px;margin:2px;background:#ffffcc;border:1px solid;border-color:#808080 #fff #fff #808080;cursor:pointer}
.era-bal{position:relative;max-width:min(262px,calc(100vw - 24px));width:262px;background:#ffffe1;border:1px solid #000;border-radius:9px;padding:9px 10px 8px;margin-bottom:12px;font:11px/1.35 var(--ui);color:#000;box-shadow:2px 2px 0 rgba(0,0,0,.25);animation:erabal .25s ease-out}
.era-bal::after,.era-bal::before{content:"";position:absolute;right:38px;bottom:-9px;border-style:solid;border-color:#000 transparent transparent;border-width:9px 8px 0}
.era-bal::after{bottom:-7px;right:39px;border-color:#ffffe1 transparent transparent;border-width:8px 7px 0}
@keyframes erabal{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1}}
.era-bal h4{margin:0 0 6px;font:bold 11px var(--ui)}
.era-bal p{margin:0 0 6px}
.era-bal .opt{display:flex;gap:6px;align-items:flex-start;width:100%;text-align:left;background:none;border:0;padding:3px 2px;font:11px var(--ui);color:#000;cursor:pointer;min-height:22px}
.era-bal .opt:hover,.era-bal .opt:focus-visible{color:#00f;text-decoration:underline;outline:none}
.era-bal .opt i{flex:none;width:11px;height:11px;margin-top:1px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#9fd0ff,#0040c0 70%);border:1px solid #002080}
.era-bal .chk{display:flex;gap:4px;align-items:center;margin-top:6px}
.era-bal .bb{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}
.era-bal .bb .btn{min-width:62px;padding:2px 8px;min-height:22px;font-size:11px}
.era-bal input[type=text]{width:100%;margin:2px 0 4px}
.era-wiz{display:flex;gap:10px}
.era-wiz-side{width:110px;flex:none;background:#000080;color:#fff;padding:8px;font:bold 11px var(--ui)}
.era-wiz-side div{padding:3px 0;opacity:.55}.era-wiz-side div.on{opacity:1;color:#ffd400}
.era-wiz-main{flex:1;min-width:0}
.era-wiz-main label{display:block;margin:4px 0}
.era-sopt .tabpage{min-height:250px}
.era-gal{display:flex;flex-direction:column;align-items:center;gap:6px}
.era-gal canvas{background:#ffffcc;border:2px solid;border-color:#808080 #fff #fff #808080;width:120px;height:120px}
.era-gal-name{font:bold 14px var(--ui)}
.era-gal-d{min-height:44px;text-align:center;max-width:300px}
.era-sopt label{display:block;margin:2px 0}
@media (max-width:640px){.era-wiz-side{display:none}}
`);

  // ================================================================ the characters
  // each: draw(g, s, t) with s = { anim, at (seconds into anim), look: [x,y], blink, ... } on a CW x CH canvas
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  function eye(g, x, y, r, lx, ly, shut) {
    g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y, r, shut ? Math.max(0.6, r * 0.12) : r * 1.15, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (!shut) { g.fillStyle = '#000'; g.beginPath(); g.arc(x + lx * r * 0.45, y + ly * r * 0.5, r * 0.45, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillRect(x + lx * r * 0.45 - r * 0.2, y + ly * r * 0.5 - r * 0.25, 1.4, 1.4); }
  }
  function paper(g, y, curl) {
    g.save(); g.translate(48, y);
    g.fillStyle = '#fff3a0'; g.strokeStyle = '#a89a40'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-34, 0); g.lineTo(30, 0); g.quadraticCurveTo(38, -2 - curl, 34, -7 - curl); g.lineTo(28, -7); g.lineTo(-30, -6); g.quadraticCurveTo(-38, -3, -34, 0); g.fill(); g.stroke();
    g.strokeStyle = '#c8b850'; g.lineWidth = 0.6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-28 + i * 2, -2 - i * 1.6); g.lineTo(26, -2 - i * 1.6); g.stroke(); }
    g.restore();
  }
  // Staples: a chunky silver staple standing on a sheet of lined paper, with big eyes and very expressive eyebrows
  function drawClip(g, s, t) {
    const a = s.anim, k = s.at;
    let dy = Math.sin(t * 2.2) * 1.2, sx = 1, sy = 1, rot = 0, brow = 0, lx = s.look[0], ly = s.look[1], tap = 0, alpha = 1;
    if (a === 'greet') { const q = ease(k / 0.6); dy += (1 - q) * 70; if (k > 0.6 && k < 0.9) { sy = 1 - Math.sin((k - 0.6) / 0.3 * Math.PI) * 0.15; sx = 2 - sy; } brow = k > 0.7 ? 3 : 0; }
    if (a === 'bye') { const q = ease(k / 0.8); rot = q * 6.3; sx = sy = 1 - q; dy -= q * 30; alpha = 1 - q; }
    if (a === 'attention') { tap = Math.max(0, Math.sin(k * 14)) * (k < 1.4 ? 1 : 0); sx = sy = 1 + tap * 0.12; brow = 3; ly = 0.3; }
    if (a === 'think') { brow = Math.sin(k * 3) * 2 + 1; lx = -0.6; ly = -0.8; rot = -0.08; }
    if (a === 'look') { lx = Math.sin(k * 2.6) > 0 ? 1 : -1; ly = 0.2; }
    if (a === 'happy') { dy -= Math.abs(Math.sin(k * 9)) * 6; brow = 4; }
    if (a === 'write') { lx = -0.3; ly = 0.9; brow = 1; }
    if (a === 'scratch') { rot = Math.sin(k * 12) * 0.06; brow = -1; lx = 0.7; ly = -0.7; }
    paper(g, 88, a === 'write' ? 1 : 0);
    if (a === 'write') { // a little pencil scribbling on the paper
      const px = 30 + Math.sin(k * 7) * 12, py = 84 - (k * 4 % 3);
      g.save(); g.translate(px, py); g.rotate(-0.7);
      g.fillStyle = '#ffd400'; g.fillRect(0, -2, 14, 4); g.fillStyle = '#f0b0a0'; g.fillRect(14, -2, 3, 4); g.fillStyle = '#e8c890'; g.beginPath(); g.moveTo(0, -2); g.lineTo(-4, 0); g.lineTo(0, 2); g.fill();
      g.restore();
      g.strokeStyle = '#334'; g.lineWidth = 0.7; g.beginPath(); for (let i = 0; i < Math.min(30, k * 14); i++) { const x = 20 + i * 0.9, y = 84 + Math.sin(i * 1.7) * 1.2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
    g.save(); g.globalAlpha = alpha; g.translate(48, 82 + dy); g.rotate(rot); g.scale(sx, sy); g.translate(-48, -82);
    // the staple: a chunky silver upside-down U standing on its two chisel-pointed legs (lit from the top-left)
    const wire = () => { g.beginPath(); g.moveTo(35, 80); g.lineTo(35, 47); g.quadraticCurveTo(35, 38, 44, 38); g.lineTo(52, 38); g.quadraticCurveTo(61, 38, 61, 47); g.lineTo(61, 80); };
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(35, 87, 6, 1.6, 0, 0, 7); g.ellipse(61, 87, 6, 1.6, 0, 0, 7); g.fill();
    g.lineCap = 'butt'; g.lineJoin = 'round';
    g.strokeStyle = '#2a303c'; g.lineWidth = 12; wire(); g.stroke();
    const mg = g.createLinearGradient(28, 0, 68, 0); mg.addColorStop(0, '#f4f7fc'); mg.addColorStop(0.45, '#b4bccb'); mg.addColorStop(1, '#6a7484');
    g.strokeStyle = mg; g.lineWidth = 9; wire(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(32.6, 78); g.lineTo(32.6, 47); g.quadraticCurveTo(32.6, 35.6, 44, 35.6); g.lineTo(52, 35.6); g.stroke();
    // chisel points on the legs
    [[35, -1], [61, 1]].forEach(([x, d]) => { g.fillStyle = '#9aa4b4'; g.strokeStyle = '#2a303c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 6, 79); g.lineTo(x + 6, 79); g.lineTo(x + d * 2, 88); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e8ecf4'; g.beginPath(); g.moveTo(x - 4.5, 80); g.lineTo(x - 1, 80); g.lineTo(x + d * 2 - 0.5, 86); g.closePath(); g.fill(); });
    // big friendly eyes sitting on the crown, a little smile on the bar, very expressive eyebrows
    const shut = s.blink || a === 'bye';
    eye(g, 42, 37, 6.2, lx, ly, shut); eye(g, 54, 37, 6.2, lx, ly, shut);
    g.strokeStyle = '#2a303c'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(44, 46.5); g.quadraticCurveTo(48, 49.5, 52, 46.5); g.stroke();
    g.strokeStyle = '#000'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(35, 27 - brow); g.quadraticCurveTo(41, 23 - brow * 1.3, 46, 27 - brow * 0.6); g.stroke();
    g.beginPath(); g.moveTo(50, 27 - brow * 0.6); g.quadraticCurveTo(55, 23 - brow * 1.3, 61, 27 - brow); g.stroke();
    g.restore();
    if (a === 'attention' && tap > 0.8) { g.fillStyle = '#000'; g.font = 'bold 9px Arial'; g.fillText('knock', 62, 20); g.fillText('knock', 4, 26); }
    if (a === 'think') { g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1; [[72, 24, 3], [79, 15, 4.5], [86, 6, 5]].forEach(([x, y, r], i) => { if (k * 3 > i) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); } }); }
  }
  // Biscuit the dog: sits, wags, tongue out, ears flop, sometimes scratches or sniffs
  function drawDog(g, s, t) {
    const a = s.anim, k = s.at; let dy = 0, wag = Math.sin(t * (a === 'happy' ? 18 : 6)) * 0.5, alpha = 1, ear = Math.sin(t * 3) * 0.1, lx = s.look[0], ly = s.look[1], tongue = 1;
    if (a === 'greet') { dy = (1 - ease(k / 0.7)) * 80; }
    if (a === 'bye') { dy = 0; alpha = 1 - ease(k / 0.8); }
    if (a === 'happy') dy = -Math.abs(Math.sin(k * 8)) * 6;
    if (a === 'attention') { dy = -Math.abs(Math.sin(k * 10)) * 4; ear = 0.4; }
    if (a === 'scratch') ear = Math.sin(k * 30) * 0.3;
    if (a === 'think') { lx = -0.8; ly = -0.8; tongue = 0; }
    g.save(); g.globalAlpha = alpha; g.translate(a === 'bye' ? ease(k / 0.8) * 70 : 0, dy);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(48, 90, 28, 4, 0, 0, 7); g.fill();
    // tail
    g.save(); g.translate(68, 76); g.rotate(-0.6 + wag); g.fillStyle = '#c08040'; g.strokeStyle = '#5a3010'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(8, 0, 10, 3.5, 0, 0, 7); g.fill(); g.stroke(); g.restore();
    // body
    g.fillStyle = '#d89a50'; g.strokeStyle = '#5a3010'; g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(52, 72, 20, 17, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f6e0b8'; g.beginPath(); g.ellipse(44, 76, 9, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#d89a50'; g.beginPath(); g.ellipse(38, 87, 6, 3.5, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(54, 88, 6, 3.5, 0, 0, 7); g.fill(); g.stroke();
    // head
    g.beginPath(); g.ellipse(42, 42, 19, 17, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f6e0b8'; g.beginPath(); g.ellipse(36, 51, 11, 8, 0, 0, 7); g.fill(); g.stroke();
    // ears
    g.fillStyle = '#7a4a20';
    [[25, 32, 1], [58, 32, -1]].forEach(([x, y, d]) => { g.save(); g.translate(x, y); g.rotate(d * (0.35 + ear)); g.beginPath(); g.ellipse(0, 10, 6, 13, 0, 0, 7); g.fill(); g.stroke(); g.restore(); });
    eye(g, 36, 38, 4.5, lx, ly, s.blink); eye(g, 50, 38, 4.5, lx, ly, s.blink);
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(34, 47, 4, 3, 0, 0, 7); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(34, 50); g.lineTo(34, 53); g.moveTo(29, 54); g.quadraticCurveTo(34, 57, 39, 54); g.stroke();
    if (tongue) { g.fillStyle = '#e8506a'; g.beginPath(); g.ellipse(36, 58 + Math.sin(t * 8) * 0.8, 3, 4.5, 0, 0, 7); g.fill(); }
    g.restore();
    if (a === 'think') { g.fillStyle = '#000'; g.font = 'bold 14px Arial'; g.fillText('?', 70, 22); }
  }
  // Wizbit the wizard: a little bearded gnome in a starry hat, waving a wand that leaves sparkles
  function drawWizard(g, s, t) {
    const a = s.anim, k = s.at; let dy = Math.sin(t * 2) * 1.5, alpha = 1, wand = Math.sin(t * 1.5) * 0.2, lx = s.look[0], ly = s.look[1], sc = 1;
    if (a === 'greet') { sc = ease(k / 0.6); }
    if (a === 'bye') { sc = 1 - ease(k / 0.7); alpha = sc; }
    if (a === 'happy' || a === 'attention') wand = Math.sin(k * 12) * 0.8;
    if (a === 'think') { lx = 0.5; ly = -1; }
    const smoke = a === 'greet' ? 1 - k / 0.9 : a === 'bye' ? k / 0.8 : 0;
    g.save(); g.globalAlpha = alpha; g.translate(48, 88); g.scale(sc, sc); g.translate(-48, -88 + dy);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(48, 91, 22, 3, 0, 0, 7); g.fill();
    // robe (shaded: light from the top-left)
    const rg = g.createLinearGradient(30, 0, 68, 0); rg.addColorStop(0, '#4a5ad8'); rg.addColorStop(0.55, '#2a3ab0'); rg.addColorStop(1, '#16207a');
    g.fillStyle = rg; g.strokeStyle = '#0a1050'; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(29, 90); g.quadraticCurveTo(34, 70, 39, 56); g.lineTo(59, 56); g.quadraticCurveTo(64, 70, 69, 90); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd400'; [[42, 74], [57, 82], [53, 66], [37, 86], [62, 72]].forEach(([x, y]) => star(g, x, y, 2.2));
    // boots
    g.fillStyle = '#6a3a10'; g.strokeStyle = '#2a1000'; [[38, 90], [58, 90]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 6, 2.6, 0, 0, 7); g.fill(); g.stroke(); });
    // sleeve + hand holding the wand
    g.fillStyle = '#2a3ab0'; g.strokeStyle = '#0a1050'; g.beginPath(); g.moveTo(56, 60); g.quadraticCurveTo(64, 62, 66, 68); g.lineTo(61, 71); g.quadraticCurveTo(57, 66, 53, 66); g.closePath(); g.fill(); g.stroke();
    // head: pink skin, big nose, rosy cheeks
    g.fillStyle = '#f6c8a0'; g.strokeStyle = '#7a4020'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(49, 46, 11, 10, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(38, 47, 2.6, 3.6, 0.2, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(60, 47, 2.6, 3.6, -0.2, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(240,110,110,.55)'; g.beginPath(); g.arc(42, 50, 2.6, 0, 7); g.arc(56, 50, 2.6, 0, 7); g.fill();
    eye(g, 44.5, 44, 3.2, lx, ly, s.blink); eye(g, 53.5, 44, 3.2, lx, ly, s.blink);
    // bushy eyebrows
    g.fillStyle = '#f4f4f4'; g.strokeStyle = '#9a9a9a'; g.lineWidth = 0.8; [[44.5, 39.5], [53.5, 39.5]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 3.6, 1.6, 0, 0, 7); g.fill(); g.stroke(); });
    // big white beard + moustache
    const bg = g.createLinearGradient(40, 50, 58, 76); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#c8c8d0');
    g.fillStyle = bg; g.strokeStyle = '#8a8a96'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(37, 49); g.quadraticCurveTo(38, 62, 44, 70); g.quadraticCurveTo(49, 79, 54, 70); g.quadraticCurveTo(60, 62, 61, 49); g.quadraticCurveTo(55, 56, 49, 55); g.quadraticCurveTo(43, 56, 37, 49); g.fill(); g.stroke();
    g.strokeStyle = '#b0b0b8'; g.beginPath(); g.moveTo(44, 60); g.quadraticCurveTo(46, 66, 47, 70); g.moveTo(53, 60); g.quadraticCurveTo(52, 66, 51, 70); g.stroke();
    g.fillStyle = '#fff'; g.strokeStyle = '#8a8a96'; g.beginPath(); g.moveTo(49, 52); g.quadraticCurveTo(43, 51, 41, 55); g.quadraticCurveTo(45, 56, 49, 54.5); g.quadraticCurveTo(53, 56, 57, 55); g.quadraticCurveTo(55, 51, 49, 52); g.fill(); g.stroke();
    g.fillStyle = '#f0a888'; g.strokeStyle = '#7a4020'; g.beginPath(); g.ellipse(49, 49.5, 3.2, 2.8, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(47.5, 48, 1.3, 1.3);
    // hat with a floppy tip and a band
    const hg = g.createLinearGradient(36, 0, 64, 0); hg.addColorStop(0, '#4a5ad8'); hg.addColorStop(1, '#16207a');
    g.fillStyle = hg; g.strokeStyle = '#0a1050'; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(33, 40); g.quadraticCurveTo(49, 33, 65, 40); g.quadraticCurveTo(58, 26, 55, 13); g.quadraticCurveTo(59, 7, 66, 9); g.quadraticCurveTo(54, 3, 49, 12); g.quadraticCurveTo(42, 26, 33, 40); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd400'; g.strokeStyle = '#8a6a00'; g.beginPath(); g.moveTo(35, 39); g.quadraticCurveTo(49, 33, 63, 39); g.lineTo(62, 36); g.quadraticCurveTo(49, 30.5, 37, 36); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd400'; star(g, 50, 25, 3); star(g, 56, 16, 2); g.fillStyle = '#fff'; star(g, 45, 31, 1.4);
    g.fillStyle = '#ffd400'; g.beginPath(); g.arc(66, 9, 2.2, 0, 7); g.fill();
    // wand
    g.save(); g.translate(63, 68); g.rotate(0.45 + wand); g.strokeStyle = '#2a1000'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -20); g.stroke(); g.strokeStyle = '#a06a30'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -20); g.stroke(); g.fillStyle = '#fff'; g.strokeStyle = '#c8a000'; g.lineWidth = 0.8; star(g, 0, -23, 4); g.stroke(); g.restore();
    g.fillStyle = '#f6c8a0'; g.strokeStyle = '#7a4020'; g.lineWidth = 1; g.beginPath(); g.arc(63, 68, 3, 0, 7); g.fill(); g.stroke();
    g.restore();
    // sparkles
    for (let i = 0; i < 6; i++) { const p = (t * 0.7 + i / 6) % 1, x = 76 + Math.sin(i * 2.1 + t) * 10, y = 40 - p * 30; g.globalAlpha = 1 - p; g.fillStyle = ['#ffd400', '#fff', '#9fd0ff'][i % 3]; star(g, x, y, 1.6 + (i % 2)); }
    g.globalAlpha = 1;
    if (smoke > 0) { g.fillStyle = `rgba(200,200,220,${Math.min(0.9, smoke)})`; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(48 + Math.cos(i) * 18 * (1.2 - smoke), 60 + Math.sin(i * 1.7) * 16 * (1.2 - smoke), 12, 0, 7); g.fill(); } }
  }
  function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  // Bolt the robot: boxy, antenna light, a scanning visor and spring legs
  function drawRobot(g, s, t) {
    const a = s.anim, k = s.at; let dy = Math.sin(t * 4) * 1, alpha = 1, scan = Math.sin(t * 2), sq = 0;
    if (a === 'greet') { dy = -(1 - ease(k / 0.7)) * 90; if (k > 0.7 && k < 0.95) sq = Math.sin((k - 0.7) / 0.25 * Math.PI) * 5; }
    if (a === 'bye') { dy = -ease(k / 0.8) * 100; }
    if (a === 'happy') dy = -Math.abs(Math.sin(k * 10)) * 8;
    if (a === 'think') scan = Math.sin(k * 8);
    if (a === 'attention') sq = Math.abs(Math.sin(k * 12)) * 3;
    g.save(); g.globalAlpha = alpha;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(48, 91, 22, 3.5, 0, 0, 7); g.fill();
    // spring legs
    g.strokeStyle = '#555'; g.lineWidth = 1.5;
    [38, 58].forEach(x => { g.beginPath(); for (let i = 0; i <= 8; i++) { const y = 74 + dy + sq + i * (14 - (dy + sq)) / 8; g.lineTo(x + (i % 2 ? 3 : -3), Math.min(88, y)); } g.stroke(); g.fillStyle = '#333'; g.fillRect(x - 6, 87, 12, 4); });
    g.translate(0, dy + sq);
    g.fillStyle = '#b8bcc8'; g.strokeStyle = '#2a2e3a'; g.lineWidth = 1.4;
    g.beginPath(); g.rect(30, 46, 36, 28); g.fill(); g.stroke();
    g.fillStyle = '#444'; g.fillRect(36, 54, 24, 3); g.fillStyle = (t * 2 | 0) % 2 ? '#e10600' : '#3aac2c'; g.fillRect(36, 62, 5, 5); g.fillStyle = '#ffd400'; g.fillRect(44, 62, 5, 5);
    // arms
    g.strokeStyle = '#2a2e3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, 52); g.lineTo(22, 62 + (a === 'happy' ? -14 : 0)); g.moveTo(66, 52); g.lineTo(74, 62 + (a === 'attention' ? -14 * Math.abs(Math.sin(k * 12)) : 0)); g.stroke();
    // head
    g.fillStyle = '#d0d4e0'; g.strokeStyle = '#2a2e3a'; g.lineWidth = 1.4; g.beginPath(); g.rect(32, 20, 32, 24); g.fill(); g.stroke();
    g.fillStyle = '#101820'; g.fillRect(36, 26, 24, 9);
    g.fillStyle = '#ff3030'; g.fillRect(46 + scan * 9, 27, 5, 7); g.fillStyle = 'rgba(255,60,60,.35)'; g.fillRect(43 + scan * 9, 27, 11, 7);
    g.fillStyle = '#2a2e3a'; g.fillRect(40, 38, 16, 2);
    g.strokeStyle = '#2a2e3a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(48, 20); g.lineTo(48, 11); g.stroke();
    g.fillStyle = (t * 3 | 0) % 2 ? '#ff0' : '#fa0'; g.beginPath(); g.arc(48, 9, 3, 0, 7); g.fill();
    g.restore();
    if (a === 'think') { g.fillStyle = '#000'; g.font = 'bold 8px "Courier New"'; g.fillText('01101', 64, 14); }
  }
  // Bouncy the Blobbit: a round, bouncy critter (little round ears, big eyes, rosy cheeks) that squashes and grins
  function drawSquig(g, s, t) {
    const a = s.anim, k = s.at; let ph = (t * 1.6) % 1, h0 = 26, alpha = 1, lx = s.look[0], ly = s.look[1];
    if (a === 'happy' || a === 'attention') { ph = (k * 3) % 1; h0 = 34; }
    if (a === 'think' || a === 'write') h0 = 4;
    let y = 80 - Math.sin(ph * Math.PI) * h0, sx = 1, sy = 1;
    if (ph < 0.08 || ph > 0.92) { sx = 1.18; sy = 0.82; }
    if (a === 'greet') y = lerp(-30, y, ease(k / 0.6));
    if (a === 'bye') { y = lerp(y, -40, ease(k / 0.8)); alpha = 1 - ease(k / 0.8); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(48, 92, 18 * (1 - (80 - y) / 120), 3, 0, 0, 7); g.fill();
    g.save(); g.globalAlpha = alpha; g.translate(48, y + 10); g.scale(sx, sy); g.translate(-48, -(y + 10));
    const body = g.createRadialGradient(42, y - 14, 2, 48, y - 6, 19); body.addColorStop(0, '#9ae0ff'); body.addColorStop(0.45, '#3aa0f0'); body.addColorStop(1, '#1a58b8');
    g.strokeStyle = '#0a2a6a'; g.lineWidth = 1.5;
    // ears (behind)
    g.fillStyle = '#2a80d8'; [[36, y - 20], [60, y - 20]].forEach(([x, yy]) => { g.beginPath(); g.arc(x, yy, 5.5, 0, 7); g.fill(); g.stroke(); });
    g.fillStyle = '#ffb0c8'; [[36, y - 20], [60, y - 20]].forEach(([x, yy]) => { g.beginPath(); g.arc(x, yy, 2.6, 0, 7); g.fill(); });
    // feet
    g.fillStyle = '#1a68c8'; g.beginPath(); g.ellipse(39, y + 10, 5.5, 3, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(57, y + 10, 5.5, 3, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = body; g.beginPath(); g.arc(48, y - 6, 17, 0, 7); g.fill(); g.stroke();
    // tummy + shine
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(48, y + 1, 10, 7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(41, y - 16, 4, 2.4, -0.6, 0, 7); g.fill();
    eye(g, 42, y - 9, 4.5, lx, ly, s.blink); eye(g, 54, y - 9, 4.5, lx, ly, s.blink);
    g.fillStyle = 'rgba(255,90,140,.6)'; g.beginPath(); g.ellipse(36.5, y - 2, 3, 2, 0, 0, 7); g.ellipse(59.5, y - 2, 3, 2, 0, 0, 7); g.fill();
    // a happy open grin with a little tongue (no teeth)
    g.fillStyle = '#5a0a20'; g.strokeStyle = '#0a2a6a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(42, y - 1); g.quadraticCurveTo(48, y + 9, 54, y - 1); g.quadraticCurveTo(48, y + 1, 42, y - 1); g.fill(); g.stroke();
    g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(48, y + 3, 3, 1.8, 0, 0, 7); g.fill();
    g.restore();
  }
  const CHARS = {
    staples: { name: 'Staples', draw: drawClip, d: 'Staples is always there to help. Whether you want help or not. He is a staple. He holds everything together. Mostly.' },
    biscuit: { name: 'Biscuit', draw: drawDog, d: 'Biscuit is a good boy. He will fetch help topics for you. He will also fetch slippers, sticks and the post (chewed).' },
    grotlin: { name: 'Wizbit', draw: drawWizard, d: 'Wizbit the Wizard knows ancient and powerful magic. Mostly how to find the Save button. He learned it from a Fighting Fantasy book.' },
    bolt: { name: 'Bolt', draw: drawRobot, d: 'Bolt is a robot from the planet Kilobyte. Beep boop. He came all the way across the galaxy to help you with WordPad. That is his whole mission.' },
    bouncy: { name: 'Bouncy', draw: drawSquig, d: 'Bouncy is a Blobbit. He bounces. He does not know anything about computers. But he is very happy, and that counts for something.' },
  };
  E.assistants = CHARS;

  // ================================================================ the tips
  const T = {
    Notepad: ["Tip: Notes are better with more exclamation marks!!!", "Tip: To save your note, click File, then Save. To lose your note, close it without doing that. Easy!", "Tip: Notepad can open files up to 64 KB. After that it says it's too big. Like Dave's head.", "Tip: Press F5 in Notepad to put the time and date in. Then you know when you wrote it. Like a diary!"],
    WordPad: ["Tip: You can make words BOLD by clicking the B. You can make them italic with the I. U is for underline. There is no button for SHOUTING. Use caps lock.", "Tip: Comic Sans makes everything 50% more fun. That's science.", "Tip: To make a word go away, highlight it and press Delete. To make it come back, press Ctrl+Z very quickly.", "Tip: WordPad documents can be printed! If the printer has any cyan left."],
    JackCalc: ["Tip: To add up a column, type =SUM( then the cells, then ). Or count on your fingers. I can't. I'm a staple.", "Tip: Spreadsheets are for working out pocket money. 52 weeks times what you get. Then show your Mom how little that is.", "Tip: If a cell shows #####, the number is too big to fit. Like your pocket money demands."],
    Write: ["Tip: Write is very old. Be gentle with it.", "Tip: It looks like you're using a program from 1992. Would you like me to call a museum?"],
  };
  const OPEN = {
    Notepad: ["It looks like you're writing a note!", "Would you like help?", ['Get help with writing the note', 'Just type the note without help']],
    WordPad: ["It looks like you're writing a document!", "Would you like help?", ['Get help with writing the document', 'Just type the document without help']],
    JackCalc: ["It looks like you're doing your sums!", "Would you like me to do them for you? (I can't count past 4. I have no fingers.)", ['Get help with the sums', 'Just do the sums without help']],
    Write: ["It looks like you're writing something in a very old program!", "Would you like help?", ['Get help (please be patient, I am also old)', 'Just type without help']],
  };
  const SEARCH = ["Turning your computer off by clicking Start", "Why is the printer out of cyan?", "Making your computer go faster (paint it red)", "What to do when Mom needs the phone", "Finding the Any key", "Is it a Furby or a Tamagotchi? A guide", "None of the above, look for more help on the Web"];

  // ================================================================ the assistant on screen
  let cur = null; // { el, cv, g, raf, s, kind, char, idleT, win, mo }
  const cfg = () => E.staplesCfg(), save = v => E.staplesSave(v);
  function charOf() { const c = cfg(); return CHARS[c.who] ? c.who : 'staples'; }
  function setAnim(name, len) { if (!cur) return; cur.s.anim = name; cur.s.at = 0; cur.s.len = len || 2; }
  function ensure(ctx) {
    if (cur && cur.el.isConnected) { if (ctx && ctx.win) cur.win = ctx.win; return cur; }
    const who = charOf(), C = CHARS[who];
    const el = h('div', 'era-asst'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'JackOS Assistant: ' + C.name);
    el.innerHTML = `<div class="era-asst-box"><div class="era-asst-tb"><span>${esc(C.name)}</span><button type="button" aria-label="Close">x</button></div><canvas class="era-asst-cv" width="${CW * 2}" height="${CH * 2}" title="${esc(C.name)} (right-click for options)"></canvas></div>`;
    DesktopSurface.root().appendChild(el);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d');
    cur = { el, cv, g, who, s: { anim: 'greet', at: 0, len: 1.1, look: [0, 0], blink: false }, idleT: 0, lastT: 0, win: ctx && ctx.win, quiet: 0, born: Date.now() };
    place(cur.win);
    // drag by the title bar
    const tb = el.querySelector('.era-asst-tb'); let drag = null;
    tb.addEventListener('pointerdown', ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); if (ev.target.closest('button')) return; const r = boxRect(); drag = { dx: p.x - r.left, dy: p.y - r.top }; tb.setPointerCapture(ev.pointerId); });
    tb.addEventListener('pointermove', ev => { const p = DesktopSurface.point(ev.clientX, ev.clientY); if (!drag) return; const b = boxRect(); boxAt(Math.max(0, Math.min(DesktopSurface.width() - b.width, p.x - drag.dx)), Math.max(0, Math.min(DesktopSurface.height() - 60, p.y - drag.dy))); });
    tb.addEventListener('pointerup', () => { drag = null; });
    tb.querySelector('button').addEventListener('click', () => hide(true));
    cv.addEventListener('click', () => { if (!cur) return; cur.quiet = 0; if (cur.el.querySelector('.era-bal')) return; askBox(); });
    const ctxMenu = ev => {
      ev.preventDefault(); ev.stopPropagation();
      IE.menu([{ label: 'Hide', act: () => hide(true) }, { label: 'Options...', act: () => Apps.open('era.staples', 'options') }, { label: 'Choose Assistant...', act: () => Apps.open('era.staples', 'gallery') }, { label: 'Animate!', act: () => { setAnim(pick(['happy', 'attention', 'think', 'write', 'scratch', 'look']), 2.4); sfx('pet'); } }, '-', { label: 'What would you like to do?', act: askBox }], ev.clientX, ev.clientY);
    };
    cv.addEventListener('contextmenu', ctxMenu);
    // long-press = right-click on phones
    let lp = 0; cv.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse') lp = setTimeout(() => ctxMenu({ preventDefault() {}, stopPropagation() {}, clientX: ev.clientX, clientY: ev.clientY }), 550); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => clearTimeout(lp)));
    if (cfg().sound !== false) { note(660, 0.08, 'sine'); setTimeout(() => note(990, 0.12, 'sine'), 90); }
    const loop = t => {
      if (!cur || !cur.el.isConnected) return;
      cur.raf = requestAnimationFrame(loop);
      const ts = t / 1000, dt = cur.lastT ? Math.min(0.1, ts - cur.lastT) : 0.016; cur.lastT = ts;
      const s = cur.s; s.at += dt;
      if (s.anim !== 'bye' && s.at > s.len && s.anim !== 'idle') { s.anim = 'idle'; s.at = 0; s.len = 99; }
      s.blink = (ts % 3.7) < 0.12;
      if (s.anim === 'idle') { cur.idleT += dt; if (cur.idleT > 7 + Math.random() * 40) { cur.idleT = 0; setAnim(pick(['look', 'think', 'write', 'scratch', 'look', 'happy']), 2.5); } }
      // eyes follow nothing in particular; drift slowly
      s.look[0] += (Math.sin(ts * 0.7) * 0.6 - s.look[0]) * 0.05; s.look[1] += (Math.cos(ts * 0.5) * 0.3 - s.look[1]) * 0.05;
      const g2 = cur.g; g2.setTransform(2, 0, 0, 2, 0, 0); g2.clearRect(0, 0, CW, CH);
      try { CHARS[cur.who].draw(g2, s, ts); } catch (e) { console.error(e); }
      // gentle: leave on his own after a while with nothing happening, or when the program he came for closes
      if (!cur.el.querySelector('.era-bal')) cur.quiet += dt;
      if (s.anim !== 'bye' && ((cur.win && !cur.win.isConnected) || cur.quiet > 150)) hide(false);
    };
    cur.raf = requestAnimationFrame(loop);
    return cur;
  }
  // the assistant is anchored by its bottom-right corner so the balloon can grow up and to the left
  const boxRect = () => DesktopSurface.rect(cur.el.querySelector('.era-asst-box'));
  function boxAt(x, y) { if (!cur) return; const b = boxRect(); cur.el.style.left = cur.el.style.top = 'auto'; cur.el.style.right = Math.round(DesktopSurface.width() - x - b.width) + 'px'; cur.el.style.bottom = Math.round(DesktopSurface.height() - y - b.height) + 'px'; }
  function place(win) {
    if (!cur) return;
    const el = cur.el, W = CW + 8;
    let x = DesktopSurface.width() - W - 16, y = DesktopSurface.height() - CH - 30 - 40;
    if (win && win.isConnected) { const r = DesktopSurface.rect(win); x = Math.min(DesktopSurface.width() - W - 6, Math.max(4, r.right - W - 22)); y = Math.min(DesktopSurface.height() - CH - 60, Math.max(140, r.bottom - CH - 50)); }
    boxAt(x, y);
  }
  // the speech balloon (sits above him; grows upwards so he stays put)
  function balloon(html, wire) {
    const c = ensure(); c.quiet = 0;
    const old = c.el.querySelector('.era-bal'); if (old) old.remove();
    const b = h('div', 'era-bal'); b.innerHTML = html;
    c.el.insertBefore(b, c.el.firstChild);
    // keep the whole thing on screen: the balloon goes above, so move the assistant down/up as needed
    const r = DesktopSurface.rect(c.el), box = DesktopSurface.rect(c.el.querySelector('.era-asst-box'));
    if (r.top < 4 || r.left < 4 || box.bottom > DesktopSurface.height() - 30) boxAt(box.left + Math.max(0, 4 - r.left), Math.min(DesktopSurface.height() - 34 - box.height, box.top + Math.max(0, 4 - r.top)));
    if (wire) wire(b);
    const f = b.querySelector('.opt,input,button'); if (f && !E.phone()) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) {} }, 50);
    return b;
  }
  // "Move when in the way": hop beside a dialog he would cover, or duck out of sight if there's no room
  function outOfTheWay(win) {
    if (!cur || !win || !win.isConnected) return;
    const r = DesktopSurface.rect(win), a = DesktopSurface.rect(cur.el);
    if (a.right < r.left || a.left > r.right || a.bottom < r.top || a.top > r.bottom) return;
    const y = Math.max(4, Math.min(DesktopSurface.height() - a.height - 34, r.bottom - a.height));
    if (r.left - a.width - 8 >= 4) boxAt(r.left - a.width - 8, y);
    else if (r.right + a.width + 8 <= DesktopSurface.width() - 4) boxAt(r.right + 8, y);
    else cur.el.style.visibility = 'hidden';
  }
  const closeBal = () => { if (cur) { const b = cur.el.querySelector('.era-bal'); if (b) b.remove(); cur.quiet = 0; } };
  function hide(byUser) {
    if (!cur) return; const c = cur; if (c.s.anim === 'bye') return;
    closeBal(); setAnim('bye', 1);
    if (cfg().sound !== false) { note(880, 0.08, 'sine'); setTimeout(() => note(440, 0.14, 'sine'), 90); }
    setTimeout(() => { cancelAnimationFrame(c.raf); c.el.remove(); if (cur === c) cur = null; }, 900);
    if (byUser) {
      E.secret('staples.hide');
      const v = cfg(); v.nope = (v.nope || 0) + 1; save(v);
      if (v.nope === 3) setTimeout(() => Desk.msgbox('JackOS Assistant', "You've hidden me three times now.\n\nWould you like me to stop popping up when you write things? (I'll still be in Start > Programs > Accessories if you need me. Sniff.)", 'q', [['Yes, please', () => { const v2 = cfg(); v2.on = false; save(v2); Desk.toast('Staples', 'OK. I won\'t pop up any more. Turn me back on in Options if you miss me.', 4000); }], ['No, stay']]), 1100);
    }
  }
  function never(key) { const v = cfg(); v.seen[key] = 'never'; save(v); }
  function optsHtml(title, sub, opts, tipKey) {
    return `<h4>${esc(title)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}${opts.map((o, i) => `<button type="button" class="opt" data-o="${i}"><i></i><span>${esc(o)}</span></button>`).join('')}${tipKey ? '<label class="chk"><input type="checkbox" class="nv"> Don\'t show me this tip again</label>' : ''}<div class="bb"><button type="button" class="btn" data-x="cancel">Cancel</button></div>`;
  }
  function wireOpts(b, tipKey, acts) {
    b.querySelectorAll('[data-o]').forEach(o => o.addEventListener('click', () => { const nv = b.querySelector('.nv'); if (nv && nv.checked && tipKey) never(tipKey); acts[+o.dataset.o](); }));
    b.querySelector('[data-x=cancel]').addEventListener('click', () => { const nv = b.querySelector('.nv'); if (nv && nv.checked && tipKey) never(tipKey); hide(false); });
  }
  function tipBalloon(prog, i) {
    const list = T[prog] || T.Notepad; i = i == null ? Math.floor(Math.random() * list.length) : i % list.length;
    setAnim('write', 2.4);
    balloon(`<p>${esc(list[i])}</p><div class="bb"><button type="button" class="btn" data-x="more">Next tip</button><button type="button" class="btn" data-x="ok">Close</button></div>`, b => {
      b.querySelector('[data-x=more]').addEventListener('click', () => { tipBalloon(prog, i + 1); sfx('click'); });
      b.querySelector('[data-x=ok]').addEventListener('click', () => { closeBal(); setAnim('happy', 1.2); });
    });
  }
  function askBox() {
    setAnim('think', 2);
    balloon(`<h4>What would you like to do?</h4><input type="text" maxlength="60" placeholder="Type your question here, and then click Search."><div class="bb"><button type="button" class="btn" data-x="opt">Options</button><button type="button" class="btn" data-x="go">Search</button></div>`, b => {
      const inp = b.querySelector('input');
      const go = () => {
        const q = inp.value.trim(); setAnim('think', 2.5);
        if (/^dear\b|letter/i.test(q)) return letterOffer();
        if (/clippy|paperclip|staples/i.test(q)) { setAnim('happy', 2); return balloon(`<p>That's me! I'm a staple. Staples have been holding paper together for over a hundred years. Now I hold YOUR paper together. Digitally.</p><div class="bb"><button type="button" class="btn" data-x="ok">OK</button></div>`, b2 => b2.querySelector('[data-x=ok]').addEventListener('click', closeBal)); }
        const picks = SEARCH.slice().sort(() => Math.random() - 0.5).slice(0, 3).concat(SEARCH[SEARCH.length - 1]);
        balloon(`<h4>What would you like to do?</h4><p>I found these topics about "<b>${esc(q || 'nothing')}</b>":</p>${picks.map((p, i) => `<button type="button" class="opt" data-o="${i}"><i></i><span>${esc(p)}</span></button>`).join('')}<div class="bb"><button type="button" class="btn" data-x="cancel">Close</button></div>`, b2 => {
          b2.querySelectorAll('[data-o]').forEach(o => o.addEventListener('click', () => { setAnim('scratch', 2); balloon(`<p>${esc(o.textContent)}</p><p>Sorry, I couldn't find the Help file for that. It might be on CD 2. JackOS 98 came on one CD.</p><div class="bb"><button type="button" class="btn" data-x="ok">OK</button></div>`, b3 => b3.querySelector('[data-x=ok]').addEventListener('click', closeBal)); }));
          b2.querySelector('[data-x=cancel]').addEventListener('click', closeBal);
        });
      };
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } });
      b.querySelector('[data-x=go]').addEventListener('click', go);
      b.querySelector('[data-x=opt]').addEventListener('click', () => { closeBal(); Apps.open('era.staples', 'options'); });
    });
  }
  function letterOffer(ctx) {
    ensure(ctx); setAnim('attention', 1.6);
    balloon(optsHtml("It looks like you're writing a letter.", 'Would you like help?', ['Get help with writing the letter', 'Just type the letter without help'], 'letter'), b => wireOpts(b, 'letter', [() => { closeBal(); letterWizard(ctx); }, () => { setAnim('happy', 0.8); setTimeout(() => hide(false), 700); }]));
  }
  // the Letter Wizard: four steps, then it writes the rest of the letter for you (into the Notepad/WordPad it came from)
  function letterWizard(ctx) {
    E.secret('staples.letter');
    const STEPS = ['Letter Format', 'Recipient Info', 'Other Elements', 'Sender Info'];
    const KINDS = [['gran', 'Thank-you letter to Gran (for the jumper)'], ['santa', 'Letter to Santa'], ['pen', 'Letter to a pen pal'], ['dave', 'Letter of complaint to Dave'], ['mag', 'Letter to a games magazine']];
    let step = 0; const o = { kind: 'gran', to: 'Gran', style: 'Full Block', sign: 'Jack', ps: true };
    const b = h('div');
    const w = Apps.win('Letter Wizard - Step 1 of 4', b, { w: 470, icon: E.I.staples, noResize: true, noMax: true, noMin: true, escClose: true, onClose: () => { if (cur) cur.el.style.visibility = ''; } });
    setTimeout(() => outOfTheWay(w.el), 0);
    const render = () => {
      w.setTitle(`Letter Wizard - Step ${step + 1} of 4`);
      const pages = [
        `<p>What kind of letter are you writing?</p>${KINDS.map(([v, l]) => `<label><input type="radio" name="lk" value="${v}"${o.kind === v ? ' checked' : ''}> ${esc(l)}</label>`).join('')}<label style="margin-top:8px">Page design: <select class="lstyle"><option>Full Block</option><option>Modified Block</option><option>Wavy (Comic Sans)</option></select></label>`,
        `<p>Who is the letter to?</p><label>Recipient's name:<br><input type="text" class="lto" maxlength="30" value="${esc(o.to)}" style="width:100%"></label><label>Salutation: <select class="lsal"><option>Dear</option><option>To</option><option>Oi</option><option>Greetings Earthling</option></select></label>`,
        `<p>Include:</p><label><input type="checkbox" class="lps"${o.ps ? ' checked' : ''}> P.S. at the bottom</label><label><input type="checkbox" checked disabled> Date (it's 1999, obviously)</label><label><input type="checkbox" disabled> Subject line (letters don't need subject lines, this isn't e-mail)</label>`,
        `<p>Who is the letter from?</p><label>Your name:<br><input type="text" class="lsign" maxlength="30" value="${esc(o.sign)}" style="width:100%"></label><label>Closing: <select class="lclose"><option>Love from</option><option>Yours sincerely,</option><option>Cheers,</option><option>May the Force be with you,</option></select></label>`,
      ];
      b.innerHTML = `<div class="era-wiz"><div class="era-wiz-side">${STEPS.map((s, i) => `<div class="${i === step ? 'on' : ''}">${i + 1}. ${s}</div>`).join('')}</div><div class="era-wiz-main">${pages[step]}</div></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-x="c">Cancel</button><button class="btn" data-x="b"${step ? '' : ' disabled'}>&lt; Back</button><button class="btn" data-x="n">${step < 3 ? 'Next &gt;' : 'Finish'}</button></div>`;
      const q = s => b.querySelector(s);
      if (q('.lstyle')) q('.lstyle').value = o.style;
      const grab = () => {
        const k = b.querySelector('[name=lk]:checked'); if (k) { o.kind = k.value; if (o.kind === 'santa' && o.to === 'Gran') o.to = 'Santa'; if (o.kind === 'dave' && o.to === 'Gran') o.to = 'Dave'; if (o.kind === 'mag' && o.to === 'Gran') o.to = 'the Editor'; if (o.kind === 'pen' && o.to === 'Gran') o.to = 'Pen Pal'; }
        if (q('.lstyle')) o.style = q('.lstyle').value; if (q('.lto')) o.to = q('.lto').value.trim() || o.to; if (q('.lsal')) o.sal = q('.lsal').value;
        if (q('.lps')) o.ps = q('.lps').checked; if (q('.lsign')) o.sign = q('.lsign').value.trim() || 'Jack'; if (q('.lclose')) o.close = q('.lclose').value;
      };
      q('[data-x=c]').addEventListener('click', () => { w.close(); if (cur) { setAnim('scratch', 1.5); } });
      q('[data-x=b]').addEventListener('click', () => { grab(); step--; render(); });
      q('[data-x=n]').addEventListener('click', () => { grab(); if (step < 3) { step++; render(); } else { w.close(); finish(); } });
    };
    const BODY = {
      gran: "Thank you very much for the jumper. It is very warm and very orange. I have worn it twice. Once was for the photo.\n\nI am being good at school and I have nearly finished my Rubik's cube (one side).",
      santa: "This year I would like a new graphics card, a Dreamcast (it's out in October), and a Furby. I have been mostly good. Dave can confirm. Don't ask Dave.\n\nThere will be a mince pie by the fireplace. Do not let the dog have it.",
      pen: "My name is Jack and I like computer games, sci-fi, Tetris and painting miniatures. My best mate is called Dave. My computer is a Pentium II. What's yours?\n\nPlease write back soon. Or e-mail. E-mail is faster.",
      dave: "I am writing to complain about the state of the Game Boy you gave back to me. It has crisps in it. Inside. How.\n\nI expect a full refund (one Wham bar) by Friday.",
      mag: "I think your magazine is brilliant. Please print my letter. Here is my high score on Tetris: 112 lines. That's real, I didn't make it up.\n\nAlso can you do a feature on Robot Wars.",
    };
    function finish() {
      const sal = o.sal || 'Dear', close = o.close || 'Love from';
      const text = `\n\n${BODY[o.kind]}\n\n${close}\n${o.sign}${o.ps ? '\n\nP.S. ' + pick(['Staples the staple helped me write this.', 'Please write back.', 'This letter was written on a computer. The future is here.', 'Cowabunga!']) : ''}\n`;
      const ed = ctx && ctx.win && ctx.win.querySelector && ctx.win.querySelector('textarea,[contenteditable="true"],[contenteditable=""]');
      if (ed && ed.isConnected) {
        if (ed.value != null) { const first = ed.value.split('\n')[0]; ed.value = (/^\s*dear\b/i.test(first) ? first : `${sal} ${o.to},`) + text; ed.dispatchEvent(new Event('input', { bubbles: true })); }
        else { ed.textContent = `${sal} ${o.to},` + text; ed.dispatchEvent(new Event('input', { bubbles: true })); }
      } else Desk.notepad('Letter to ' + o.to + '.txt', `${sal} ${o.to},${text}`);
      if (cur) { setAnim('happy', 2); balloon(`<p>There! I've written your letter for you. ${o.kind === 'santa' ? 'I put in a word for you with Santa. He owes me a favour.' : 'You can change it if you like. But it\'s perfect.'}</p><div class="bb"><button type="button" class="btn" data-x="ok">Thanks, Staples</button></div>`, b2 => b2.querySelector('[data-x=ok]').addEventListener('click', () => { closeBal(); setTimeout(() => hide(false), 400); })); }
    }
    render();
  }

  // ================================================================ entry point (called by the watcher in era-apps.js)
  E.staplesShow = (kind, ctx) => {
    const v = cfg(); ctx = ctx || {};
    if (kind === 'letter') return letterOffer(ctx);
    ensure(ctx);
    if (kind === 'summon') { setAnim('greet', 1.1); setTimeout(askBox, 900); return; }
    if (kind === 'hello') {
      v.seen.hello = 1; save(v);
      setTimeout(() => balloon(`<h4>Hi! I'm ${esc(CHARS[charOf()].name)}, your JackOS Assistant.</h4><p>I can give you tips while you write in Notepad, WordPad and JackCalc. Right-click me any time to hide me.</p>${['Show me a tip', 'Start using ' + (ctx.prog || 'Notepad')].map((o, i) => `<button type="button" class="opt" data-o="${i}"><i></i><span>${esc(o)}</span></button>`).join('')}<div class="bb"><button type="button" class="btn" data-x="cancel">Close</button></div>`, b => wireOpts(b, null, [() => tipBalloon(ctx.prog || 'Notepad'), () => { setAnim('happy', 0.8); setTimeout(() => hide(false), 700); }])), 900);
      return;
    }
    const key = 'open:' + (ctx.prog || 'Notepad'), O = OPEN[ctx.prog] || OPEN.Notepad;
    setTimeout(() => { if (!cur) return; setAnim('attention', 1.6); balloon(optsHtml(O[0], O[1], O[2], key), b => wireOpts(b, key, [() => tipBalloon(ctx.prog), () => { setAnim('happy', 0.8); setTimeout(() => hide(false), 700); }])); }, 900);
  };

  // ================================================================ Options / Gallery window (Start > Programs > Accessories > Staples)
  E.mods.staplesopt = (K, arg) => {
    const b = K.body; b.classList.add('era-sopt');
    closeBal(); setTimeout(() => outOfTheWay(K.w.el), 0); K.onClose(() => { if (cur) cur.el.style.visibility = ''; });
    const v = cfg(); let who = charOf(), tab = arg === 'gallery' ? 0 : 1;
    const names = Object.keys(CHARS);
    b.innerHTML = `<div class="tabs"><span data-t="0">Gallery</span><span data-t="1">Options</span></div><div class="tabpage"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-x="ok" style="min-width:75px">OK</button><button class="btn" data-x="c" style="min-width:75px">Cancel</button></div>`;
    const page = b.querySelector('.tabpage');
    let raf = 0; K.onClose(() => cancelAnimationFrame(raf));
    const st = { on: v.on !== false, sound: v.sound !== false, f1: true, wiz: true, alerts: true, move: true, guess: true, tipsF: true, tipsM: true, tipsK: false, high: false, tod: false };
    const draw = () => {
      cancelAnimationFrame(raf);
      b.querySelectorAll('.tabs span').forEach(s => s.classList.toggle('on', +s.dataset.t === tab));
      if (tab === 0) {
        page.innerHTML = `<div class="era-gal"><canvas width="240" height="240"></canvas><div class="era-gal-name"></div><div class="era-gal-d small"></div><div class="row"><button class="btn" data-g="-1">&lt; Back</button><button class="btn" data-g="1">Next &gt;</button></div><p class="small" style="margin:4px 0 0;color:#555">Also in the gallery: <b>Gubbinz</b> (not available: he is somebody else's assistant and he doesn't share).</p></div>`;
        const cv = page.querySelector('canvas'), g = cv.getContext('2d'), s = { anim: 'greet', at: 0, len: 1.1, look: [0, 0], blink: false };
        const show = () => { page.querySelector('.era-gal-name').textContent = CHARS[who].name; page.querySelector('.era-gal-d').textContent = CHARS[who].d; s.anim = 'greet'; s.at = 0; s.len = 1.1; };
        show();
        page.querySelectorAll('[data-g]').forEach(x => x.addEventListener('click', () => { who = names[(names.indexOf(who) + +x.dataset.g + names.length) % names.length]; show(); sfx('click'); }));
        let last = 0, idle = 0;
        const loop = t => { if (K.closed || !cv.isConnected) return; raf = requestAnimationFrame(loop); const ts = t / 1000, dt = last ? Math.min(0.1, ts - last) : 0.016; last = ts; s.at += dt; if (s.anim !== 'idle' && s.at > s.len) { s.anim = 'idle'; s.at = 0; s.len = 99; } if (s.anim === 'idle' && (idle += dt) > 3) { idle = 0; s.anim = pick(['happy', 'think', 'look', 'write', 'attention', 'scratch']); s.at = 0; s.len = 2.4; } s.blink = (ts % 3.3) < 0.12; g.setTransform(2.5, 0, 0, 2.5, 0, 0); g.clearRect(0, 0, 96, 96); try { CHARS[who].draw(g, s, ts); } catch (e) {} };
        raf = requestAnimationFrame(loop);
      } else {
        const c = (k, l, dis) => `<label><input type="checkbox" data-k="${k}"${st[k] ? ' checked' : ''}${dis ? ' disabled' : ''}> ${l}</label>`;
        page.innerHTML = `<div class="group" style="margin-top:4px"><span class="lg">Assistant capabilities</span>${c('on', '<b>Use the JackOS Assistant</b> (pop up when I write things)')}${c('f1', 'Respond to F1 key', 1)}${c('wiz', 'Help with wizards')}${c('alerts', 'Display alerts')}${c('move', 'Move when in the way')}${c('guess', 'Guess help topics')}${c('sound', 'Make sounds')}</div>
          <div class="group"><span class="lg">Show tips about</span>${c('tipsF', 'Using features more effectively')}${c('tipsM', 'Using the mouse more effectively')}${c('tipsK', 'Keyboard shortcuts')}${c('high', 'Only show high priority tips')}${c('tod', 'Show the Tip of the Day at startup', 1)}<div class="row" style="justify-content:flex-end"><button class="btn" data-x="reset">Reset my tips</button></div></div>`;
        page.querySelectorAll('[data-k]').forEach(x => x.addEventListener('change', () => { st[x.dataset.k] = x.checked; }));
        page.querySelector('[data-x=reset]').addEventListener('click', () => { const v2 = cfg(); v2.seen = {}; v2.nope = 0; save(v2); Desk.toast('JackOS Assistant', 'All your tips have been reset. You will see them all again. Lucky you!', 3500); });
      }
    };
    b.querySelectorAll('.tabs span').forEach(s => s.addEventListener('click', () => { tab = +s.dataset.t; draw(); }));
    b.querySelector('[data-x=c]').addEventListener('click', K.w.close);
    b.querySelector('[data-x=ok]').addEventListener('click', () => {
      const v2 = cfg(), changed = v2.who !== who;
      v2.on = st.on; v2.sound = st.sound; v2.who = who; save(v2);
      K.w.close();
      if (changed) {
        E.secret('staples.gallery');
        if (cur) { cancelAnimationFrame(cur.raf); cur.el.remove(); cur = null; }
        ensure(); setTimeout(() => balloon(`<p>Hi! I'm ${esc(CHARS[who].name)}. ${who === 'staples' ? "I'm back! Did you miss me?" : `I'll be helping you from now on. Staples has gone for a lie down in the stationery drawer.`}</p><div class="bb"><button type="button" class="btn" data-x="ok">OK</button></div>`, bb => bb.querySelector('[data-x=ok]').addEventListener('click', closeBal)), 900);
      }
    });
    K.w.setTitle(tab === 0 ? 'Office Assistant... er, JackOS Assistant' : 'JackOS Assistant');
    draw();
  };
})();

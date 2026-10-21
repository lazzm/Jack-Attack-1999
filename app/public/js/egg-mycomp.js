/* egg-mycomp: drag My Computer onto the Recycle Bin and a grumpy grandad (all drawn here, no photos) thumps his PC. */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !A.win || !A.defineSecret) return;
  A.defineSecret('egg.mycomputer', 'Have You Tried Hitting It?', "Some things don't belong in the bin.");
  const LOOP = 2.4;
  const fr = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function star(g, x, y, s) { g.fillStyle = '#ffe94a'; g.strokeStyle = '#7a2a00'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? s * 0.5 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
  function draw(g, t) {
    const ph = t % LOOP, beat = ph / 0.6, k = Math.floor(beat), f = beat - k; // 4 thumps per loop
    const hit = f < 0.3 ? Math.sin(f / 0.3 * Math.PI) : 0; // 0..1 fist strike envelope
    const mon = k % 2 === 0; // even: smack the monitor, odd: thump the keyboard
    const shake = mon ? hit : 0, kb = mon ? 0 : hit;
    fr(g, '#d9822b', 0, 0, 320, 200); fr(g, '#c4701f', 0, 0, 320, 6);
    for (let y = 14; y < 140; y += 22) fr(g, '#cf7a25', 0, y, 320, 2); // wallpaper stripes
    fr(g, '#8a5a2b', 0, 150, 320, 50); fr(g, '#6e4520', 0, 150, 320, 4); // desk
    fr(g, '#f2e6c0', 232, 24, 44, 30); fr(g, '#4a8a3a', 236, 28, 36, 22); fr(g, '#e8d070', 244, 34, 10, 8); // framed picture
    // grandad
    const bob = Math.sin(ph * 14) * 1.5;
    fr(g, '#e8e4d0', 196, 104 + bob, 92, 60); fr(g, '#cfc9b0', 196, 104 + bob, 92, 4); fr(g, '#b8b29a', 240, 108 + bob, 3, 50); // pale shirt
    fr(g, '#e8b88c', 232, 92 + bob, 14, 14); // neck
    fr(g, '#f0c49a', 218, 56 + bob, 42, 40); fr(g, '#d89a70', 216, 70 + bob, 3, 10); fr(g, '#d89a70', 259, 70 + bob, 3, 10); // head+ears
    fr(g, '#e8e8ee', 216, 52 + bob, 46, 8); fr(g, '#e8e8ee', 214, 58 + bob, 6, 14); fr(g, '#e8e8ee', 258, 58 + bob, 6, 14); // hair
    fr(g, '#3a2a1a', 222, 66 + bob, 14, 3); fr(g, '#3a2a1a', 242, 66 + bob, 14, 3); fr(g, '#3a2a1a', 223, 63 + bob, 13, 2); // grumpy brows
    g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(222, 70 + bob, 15, 11); g.strokeRect(241, 70 + bob, 15, 11); fr(g, '#222', 237, 74 + bob, 4, 2);
    fr(g, '#fff', 226, 73 + bob, 6, 5); fr(g, '#fff', 245, 73 + bob, 6, 5); fr(g, '#222', 229, 74 + bob, 3, 3); fr(g, '#222', 246, 74 + bob, 3, 3);
    fr(g, '#d89a70', 236, 82 + bob, 6, 6); fr(g, '#8a2a1a', 228, 90 + bob, 22, 4 + hit * 3); fr(g, '#fff', 231, 90 + bob, 16, 1); // nose, shouting mouth
    // monitor + wobble
    const mx = Math.sin(ph * 60) * 3 * shake, mr = shake * 2;
    g.save(); g.translate(110 + mx, 148); g.rotate(Math.sin(ph * 50) * 0.04 * shake); g.translate(-110, -148);
    fr(g, '#cdbd96', 56, 40, 108, 90); fr(g, '#e6d8b2', 56, 40, 108, 4); fr(g, '#a89870', 56, 126, 108, 4); fr(g, '#a89870', 160, 44, 4, 82);
    fr(g, '#4a4a40', 66, 50, 88, 66);
    const flash = shake > 0.5 && (Math.floor(ph * 40) % 2 === 0), pop = shake > 0.2;
    fr(g, flash ? '#fff' : (pop ? '#5fd0ff' : '#1a6a9a'), 70, 54, 80, 58);
    if (!flash) { fr(g, '#fff', 74, 58, 16, 3); fr(g, 'rgba(255,255,255,.35)', 74, 64, 70, 2); if (pop) { g.fillStyle = '#ffe94a'; g.fillRect(100, 78, 20, 5); g.fillRect(96 + (ph * 100 % 30), 90, 6, 6); } }
    fr(g, '#00c040', 140, 120, 4, 3); fr(g, '#8a7a56', 70, 130, 80, 10); fr(g, '#a89870', 76, 140, 68, 8);
    g.restore();
    // keyboard
    fr(g, '#cdbd96', 60, 143 + kb * 3, 120, 14); fr(g, '#a89870', 60, 155 + kb * 3, 120, 3);
    for (let i = 0; i < 14; i++) fr(g, '#efe6c8', 64 + i * 8, 146 + kb * 3 - (kb > 0.4 && i % 3 === ((k >> 1) % 3) ? 4 : 0), 6, 4);
    // arms: the near fist smacks the monitor side / thumps the keyboard
    const sx = 212, sy = 114 + bob, tx = mon ? 176 - hit * 8 : 150, ty = mon ? 84 - (1 - hit) * 14 : 110 + hit * 28 - (1 - hit) * 26;
    g.lineCap = 'round'; g.strokeStyle = '#e8e4d0'; g.lineWidth = 12; g.beginPath(); g.moveTo(sx, sy); g.lineTo((sx + tx) / 2, Math.min(sy, ty) - 8); g.lineTo(tx, ty); g.stroke();
    fr(g, '#f0c49a', tx - 7, ty - 6, 14, 12); fr(g, '#d89a70', tx - 7, ty - 6, 14, 3);
    g.strokeStyle = '#e8e4d0'; g.lineWidth = 12; g.beginPath(); g.moveTo(284, sy); g.lineTo(290, 140); g.lineTo(262, 138 + (k % 2 ? hit * -6 : 0)); g.stroke(); fr(g, '#f0c49a', 256, 133, 12, 10);
    if (hit > 0.3) { const sxp = mon ? 172 : 150, syp = mon ? 70 : 138; star(g, sxp - 6, syp - 10, 9); star(g, sxp + 14, syp - 22, 6); g.font = 'bold 16px "Comic Sans MS",Arial,sans-serif'; g.fillStyle = '#7a1a00'; g.fillText('THUMP!', mon ? 150 : 100, mon ? 30 : 192); g.fillStyle = '#fff2a0'; g.fillText('THUMP!', mon ? 149 : 99, mon ? 29 : 191); }
    if (mon && shake > 0.5) { g.strokeStyle = '#fff2a0'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(44 - i * 6, 70 + i * 12); g.lineTo(36 - i * 6, 66 + i * 12); g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < 200; y += 4) g.fillRect(0, y, 320, 1); // old-photo scanlines
  }
  function popup() {
    A.secret('egg.mycomputer');
    const b = document.createElement('div'); b.style.cssText = 'padding:6px;background:#c0c0c0';
    b.innerHTML = '<canvas width="320" height="200" style="display:block;width:320px;height:200px;image-rendering:pixelated;border:2px inset #fff;max-width:100%"></canvas><div style="display:flex;gap:10px;align-items:center;margin:8px 4px 4px;font:12px Tahoma,Arial,sans-serif"><svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#c00" stroke="#000"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="4"/></svg><span style="flex:1">My Computer cannot be deleted.<br>(It has feelings.)</span><button class="btn" data-e="ok" style="min-width:64px">OK</button></div>';
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'), t0 = performance.now();
    A.win('Recycle Bin', b, { w: 350, icon: '<svg viewBox="0 0 32 32"><path d="M8 9h16l-2 20H10z" fill="#ddd" stroke="#000"/></svg>', noMin: true });
    b.querySelector('[data-e=ok]').addEventListener('click', () => { const w = b.closest('.appwin'); if (w) w.remove(); });
    (function tick() { if (!cv.isConnected) return; draw(g, (performance.now() - t0) / 1000); requestAnimationFrame(tick); })();
  }
  // our own drag for the My Computer icon: it never actually moves, it just drops a ghost and goes home
  document.addEventListener('pointerdown', ev => {
    const ic = ev.target.closest && ev.target.closest('#iconMyComp');
    if (!ic || ev.button !== 0) return;
    const sx = ev.clientX, sy = ev.clientY; let ghost = null;
    const bin = () => document.getElementById('iconBin');
    const over = (x, y) => { const bi = bin(); if (!bi) return false; const r = bi.getBoundingClientRect(); return r.width > 0 && x > r.left - 10 && x < r.right + 10 && y > r.top - 10 && y < r.bottom + 10; };
    const mv = e => {
      if (!ghost) { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return; ghost = ic.cloneNode(true); ghost.removeAttribute('id'); ghost.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;opacity:.7'; DesktopSurface.root().appendChild(ghost); }
      const p = DesktopSurface.point(e.clientX, e.clientY);
      ghost.style.left = (p.x - 30) + 'px'; ghost.style.top = (p.y - 30) + 'px';
      const bi = bin(); if (bi) bi.classList.toggle('sel', over(e.clientX, e.clientY));
    };
    const up = e => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      if (!ghost) return; ghost.remove(); const bi = bin(); if (bi) bi.classList.remove('sel');
      if (e.type === 'pointerup' && over(e.clientX, e.clientY)) popup();
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
})();

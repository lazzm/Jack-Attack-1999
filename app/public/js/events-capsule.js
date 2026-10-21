/* events-capsule: THE MILLENNIUM VAULT (www.millenniumvault.jnet). JackNet members bury one time capsule a year: a
 * message and (if they like) a little 32x24 drawing. Every capsule stays sealed (the server will not hand them out) until
 * the stroke of midnight on Y2K Night, then EVERYONE's open at once on one big wall, all through New Year's Day, and
 * after that they live in the archive as "Millennium Capsule No. 1, 2, 3..." (the PC goes round 1999 again, after all).
 * Server: mods/events.js (capGet / capBury / capWall / capReport). */
(function () {
  'use strict';
  const Ev = window.Ev, A = window.Apps; if (!Ev || !A || window.EvCap) return;
  const { esc, h, sfx } = Ev, $ = id => document.getElementById(id);
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };
  const PAL = ['#ffffff', '#000000', '#808080', '#c0c0c0', '#800000', '#ff0000', '#808000', '#ffff00', '#008000', '#00ff00', '#008080', '#00ffff', '#000080', '#0000ff', '#800080', '#ff00ff'];
  const PW = 32, PH = 24;
  const d99 = ts => { const t = Desk.today99(); const d = new Date(ts); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/99'; void t; };
  function pic(hex, px) {
    if (!hex || hex.length !== PW * PH) return '';
    const runs = {};
    for (let y = 0; y < PH; y++) { let x = 0; while (x < PW) { const c = hex[y * PW + x]; let w = 1; while (x + w < PW && hex[y * PW + x + w] === c) w++; if (c !== '0') (runs[c] = runs[c] || []).push(`M${x} ${y}h${w}v1H${x}z`); x += w; } }
    return `<svg viewBox="0 0 ${PW} ${PH}" width="${px || 128}" height="${Math.round((px || 128) * PH / PW)}" shape-rendering="crispEdges" role="img" aria-label="capsule drawing" style="background:#fff;border:1px solid #888"><rect width="${PW}" height="${PH}" fill="#fff"/>${Object.keys(runs).map(c => `<path fill="${PAL[parseInt(c, 16)]}" d="${runs[c].join('')}"/>`).join('')}</svg>`;
  }

  css('evCapCss', `
.mv{background:#2a2e36;color:#e8e8e8;font:13px/1.5 Georgia,"Times New Roman",serif;min-height:100%;padding:0 0 20px;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 2px,transparent 2px 40px)}
.mv-wrap{max-width:820px;margin:0 auto;padding:10px 12px}
.mv h1{margin:8px 0 0;text-align:center;font:bold 34px/1.05 Georgia,serif;color:#e8d080;letter-spacing:3px;text-shadow:2px 2px 0 #000}
.mv-tag{text-align:center;color:#b0b8c8;font-style:italic;margin:4px 0 12px}
.mv-door{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center;background:linear-gradient(#5a606a,#3a3e46);border:4px solid #1a1c20;border-radius:8px;padding:12px;box-shadow:inset 0 0 0 2px #7a808a,5px 5px 0 #000}
.mv-dial{width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,#e8d080 0 10px,#8a7030 11px 14px,#c0c4cc 15px 46px,#8a8e96 47px 52px,#c0c4cc 53px 62px,#4a4e56 63px);border:4px solid #1a1c20;position:relative;transition:transform 2s}
.mv-dial::before,.mv-dial::after{content:"";position:absolute;left:50%;top:6px;bottom:6px;width:8px;margin-left:-4px;background:#4a4e56;border-radius:4px}
.mv-dial::after{transform:rotate(90deg)}
.mv-dial.open{transform:rotate(540deg)}
.mv-st{font:bold 22px Georgia,serif;color:#ffd400}
.mv-st.open{color:#7fff7f}
.mv-cd{font:bold 26px "Courier New",monospace;color:#7fff7f;background:#000;padding:2px 10px;border:2px inset #555;display:inline-block;margin:4px 0}
.mv h2{font:bold 18px Georgia,serif;color:#e8d080;border-bottom:1px solid #6a6e76;margin:18px 0 6px}
.mv-form{background:#f4ecd4;color:#2a2010;border:2px solid #8a7030;padding:10px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;box-shadow:4px 4px 0 #000}
.mv-form textarea{width:100%;box-sizing:border-box;min-height:120px;font:14px Georgia,serif;resize:vertical}
.mv-draw{display:flex;flex-direction:column;gap:4px;align-items:center}
.mv-draw canvas{width:192px;height:144px;image-rendering:pixelated;border:2px inset #fff;background:#fff;touch-action:none;cursor:crosshair}
.mv-pal{display:grid;grid-template-columns:repeat(8,22px);gap:2px}
.mv-pal button{width:22px;height:22px;border:2px outset #fff;padding:0;cursor:pointer}
.mv-pal button.on{border:2px solid #000;box-shadow:0 0 0 2px #ffd400}
.mv-form .row{gap:6px}
.mv-form .btn.go{font-weight:bold;min-height:34px}
.mv-mine{background:#1a1c20;border:1px dashed #e8d080;padding:8px;margin-top:8px}
.mv-names{font-size:12px;color:#b0b8c8}
.mv-names b{color:#e8d080;font-weight:normal}
.mv-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.mv-card{background:#f4ecd4;color:#2a2010;border:1px solid #8a7030;padding:8px;box-shadow:3px 3px 0 #000;transform:rotate(var(--r,0deg));font:13px/1.4 Georgia,serif;word-wrap:break-word}
.mv-card .by{font:bold 12px Verdana,Arial;color:#6a2a00;display:flex;justify-content:space-between;gap:6px;margin-top:6px}
.mv-card .rep{font:10px Arial;color:#888;background:none;border:0;cursor:pointer;text-decoration:underline;padding:4px}
.mv-card .m{white-space:pre-wrap}
.mv-pages{display:flex;gap:6px;justify-content:center;margin:10px 0;flex-wrap:wrap}
.mv-pages .btn{min-width:34px;min-height:30px}
.mv-arch a{display:block;background:#1a1c20;border:1px solid #6a6e76;padding:8px;margin:4px 0;color:#e8d080}
.mv a{color:#e8d080}
@media (max-width:600px){.mv-door{grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center}.mv-form{grid-template-columns:minmax(0,1fr)}.mv h1{font-size:26px}}
`);

  let S = null; // last capState
  const screens = new Set();
  Ev.on('capState', m => { S = m; screens.forEach(f => f('state')); });
  Ev.on('capWall', m => screens.forEach(f => f('wall', m)));
  Ev.on('capOk', m => { if (m.rep) { Desk.toast('The Millennium Vault', 'Thanks. The vault keeper will have a look.', 4000); return; } Desk.toast('The Millennium Vault', m.re ? 'Your capsule has been re-sealed with your new message.' : 'SEALED! Your capsule is in the vault. It opens on Y2K Night with everyone else\'s.', 6000); sfx('thud'); A.secret('evt.bury'); Ev.send({ t: 'capGet' }); });
  Ev.on('capErr', m => { if (m.guest && window.Guest) Guest.need('Burying a time capsule'); else Desk.msgbox('The Millennium Vault', m.msg, 'warn'); });
  Ev.on('capN', () => screens.forEach(f => f('n')));
  Ev.on('capOpen', () => Ev.send({ t: 'capGet' }));

  // days until Y2K Night on the PC's calendar
  const daysLeft = () => { const t = Desk.today99(); return Math.max(0, Math.round((new Date(1999, 11, 31) - t.date) / 864e5)); };

  function drawPad(host) {
    const cv = host.querySelector('canvas'), g = cv.getContext('2d'); cv.width = PW; cv.height = PH;
    const px = new Array(PW * PH).fill(0); let col = 1, down = false;
    const paint = () => { for (let i = 0; i < px.length; i++) { g.fillStyle = PAL[px[i]]; g.fillRect(i % PW, Math.floor(i / PW), 1, 1); } };
    const at = ev => { const r = cv.getBoundingClientRect(); return [Math.floor((ev.clientX - r.left) / r.width * PW), Math.floor((ev.clientY - r.top) / r.height * PH)]; };
    const dot = ev => { const [x, y] = at(ev); if (x < 0 || y < 0 || x >= PW || y >= PH) return; px[y * PW + x] = col; g.fillStyle = PAL[col]; g.fillRect(x, y, 1, 1); };
    cv.addEventListener('pointerdown', ev => { ev.preventDefault(); down = true; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} dot(ev); A.secret('evt.draw'); });
    cv.addEventListener('pointermove', ev => { if (down) dot(ev); });
    cv.addEventListener('pointerup', () => { down = false; }); cv.addEventListener('pointercancel', () => { down = false; });
    const pal = host.querySelector('.mv-pal');
    pal.innerHTML = PAL.map((c, i) => `<button type="button" data-c="${i}" style="background:${c}" aria-label="Colour ${i}"${i === 1 ? ' class="on"' : ''}></button>`).join('');
    pal.addEventListener('click', ev => { const b = ev.target.closest('[data-c]'); if (!b) return; col = +b.dataset.c; pal.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); });
    host.querySelector('.mv-clr').addEventListener('click', () => { px.fill(0); paint(); });
    paint();
    return { get hex() { return px.some(v => v) ? px.map(v => v.toString(16)).join('') : ''; }, set(hex) { if (hex && hex.length === px.length) { for (let i = 0; i < px.length; i++) px[i] = parseInt(hex[i], 16) || 0; paint(); } } };
  }

  function wallHtml(m) {
    if (!m.list.length) return '<p><i>Nobody buried anything that year. Not even a sandwich.</i></p>';
    return `<div class="mv-wall">${m.list.map((e, i) => `<div class="mv-card" style="--r:${((i * 37) % 7) - 3}deg">${e.p ? `<div style="text-align:center;margin-bottom:6px">${pic(e.p, 160)}</div>` : ''}<div class="m">${esc(e.m)}</div><div class="by"><span>&mdash; ${esc(e.n)}, ${d99(e.at)}</span><button class="rep" type="button" data-rep="${esc(e.id)}">report</button></div></div>`).join('')}</div>
      ${m.pages > 1 ? `<div class="mv-pages">${Array.from({ length: m.pages }, (_, k) => `<button class="btn" type="button" data-pg="${k}"${k === m.pg ? ' disabled' : ''}>${k + 1}</button>`).join('')}</div>` : ''}`;
  }

  // ================================================================ www.millenniumvault.jnet
  function page(el) {
    el.className = 'mv';
    const arch = Ev.path() === '/archive.html';
    el.innerHTML = `<div class="mv-wrap"><h1>THE MILLENNIUM VAULT</h1><p class="mv-tag">Bury a message for the year 2000. Every capsule stays sealed until the stroke of midnight on Y2K Night. Then they ALL open at once.<br><small>(Unlike the one under ${Cast.n('kidY2k')}'s shed, this one actually opens.)</small></p>
      <div class="mv-body">Opening the vault door...</div>
      <p class="small" style="text-align:center;color:#888;margin-top:16px">${arch ? '<a href="http://www.millenniumvault.jnet/">Back to the vault</a>' : '<a href="http://www.millenniumvault.jnet/archive.html">Opened capsules from past Millenniums</a>'} &middot; <a href="http://www.whatson.jnet/">What's On?</a> &middot; The vault keeper reads everything. Keep it nice. No addresses or phone numbers, please.</p></div>`;
    const body = el.querySelector('.mv-body');
    let pad = null, wallY = 0, wallPg = 0;
    const draw = (what, m) => {
      if (!el.isConnected) return;
      if (what === 'wall') { const w = body.querySelector('.mv-wallbox'); if (w && m.y === wallY) { w.innerHTML = `<p class="mv-names">Millennium Capsule No. ${m.no}: ${m.n} capsule${m.n === 1 ? '' : 's'}.</p>` + wallHtml(m); wireWall(w); } return; }
      if (what === 'n') { Ev.send({ t: 'capGet' }); return; }
      if (!S) return;
      if (arch) {
        body.innerHTML = `<h2>Opened capsules</h2><div class="mv-arch">${S.arch.length ? S.arch.map(a => `<a href="#" data-y="${a[0]}">Millennium Capsule No. ${a[1]} &mdash; ${a[2]} capsule${a[2] === 1 ? '' : 's'}</a>`).join('') : '<p><i>No capsules have been opened yet. The first ones open on Y2K Night!</i></p>'}</div><div class="mv-wallbox"></div>`;
        body.querySelectorAll('[data-y]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); wallY = +a.dataset.y; wallPg = 0; Ev.send({ t: 'capWall', y: wallY, pg: 0 }); }));
        if (!wallY && S.arch.length) { wallY = S.arch[0][0]; Ev.send({ t: 'capWall', y: wallY, pg: 0 }); }
        return;
      }
      const oldTa = body.querySelector('.mv-form textarea'), keepTxt = oldTa ? oldTa.value : null, keepPic = pad && oldTa ? pad.hex : null; // never wipe a half-written capsule
      const open = S.st === 'open', closing = S.st === 'closing', dl = daysLeft(), canBury = !closing && !(open && S.wallY === S.y);
      body.innerHTML = `<div class="mv-door"><div class="mv-dial${open ? ' open' : ''}" aria-hidden="true"></div><div><div class="mv-st${open ? ' open' : ''}">${open ? 'THE VAULT IS OPEN!' : closing ? 'THE VAULT DOOR IS CLOSING...' : 'STATUS: SEALED'}</div>
        ${open ? `<div>Happy New Year! Millennium Capsule No. ${S.wallNo} has been dug up. Read everyone's messages below.</div>` : closing ? '<div>No more capsules tonight. At midnight the vault opens and every capsule is read out. Stay up!</div>' : `<div>Capsules in the vault: <b>${S.n}</b>. It opens at midnight on Y2K Night (31/12).</div><div class="mv-cd">${dl} DAY${dl === 1 ? '' : 'S'} TO GO</div>`}</div></div>
        ${open ? `<h2>The Wall: everybody's capsules</h2><div class="mv-wallbox">Digging them up...</div>` : ''}
        ${canBury ? `<h2>${S.mine ? 'Your capsule' : 'Bury your capsule'}</h2>
        <form class="mv-form"><div><label for="mvMsg"><b>Dear Millennium...</b> (one capsule each, up to 280 letters. You can re-write it until Y2K Night.)</label><textarea id="mvMsg" maxlength="280" placeholder="Dear year 2000, my favourite game is... my best mate is... I bet that in the future..."></textarea>
          <div class="row" style="margin-top:6px"><button class="btn go" type="submit">${S.mine ? 'RE-SEAL MY CAPSULE' : 'SEAL IT IN THE VAULT'}</button><span class="small mv-left">280 letters left</span></div>${Ev.member() ? '' : `<p class="small" style="margin:6px 0 0"><b>Burying a capsule is for JackNet members</b> (FREE to join). Everyone can read the wall when it opens!</p>`}</div>
          <div class="mv-draw"><b class="small">Draw something (optional)</b><canvas aria-label="Drawing pad"></canvas><div class="mv-pal"></div><button class="btn mv-clr" type="button">Clear</button></div></form>
        ${S.mine ? `<div class="mv-mine small">Sealed on ${d99(S.mine.at)}. Only you can see this until Y2K Night.</div>` : ''}` : ''}
        <h2>Who's in the vault</h2><p class="mv-names">${S.names.length ? 'Capsules from: ' + S.names.map(n => `<b>${esc(n)}</b>`).join(', ') + (S.n > S.names.length ? ` and ${S.n - S.names.length} more` : '') : '<i>Nobody yet! Be the first to bury something.</i>'}</p>`;
      const f = body.querySelector('.mv-form');
      if (f) {
        pad = drawPad(f.querySelector('.mv-draw'));
        const ta = f.querySelector('textarea'), left = f.querySelector('.mv-left');
        if (S.mine) { ta.value = S.mine.m; pad.set(S.mine.p); }
        if (keepTxt != null) { ta.value = keepTxt; if (keepPic) pad.set(keepPic); }
        const cnt = () => { left.textContent = (280 - ta.value.length) + ' letters left'; }; cnt();
        ta.addEventListener('input', cnt);
        f.addEventListener('submit', ev => { ev.preventDefault(); if (window.Guest && !Guest.need('Burying a time capsule')) return; Ev.send({ t: 'capBury', m: ta.value, p: pad.hex }); });
      }
      if (open) { wallY = S.wallY; A.secret('evt.wall'); Ev.send({ t: 'capWall', y: wallY, pg: wallPg }); }
    };
    function wireWall(w) {
      w.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => { wallPg = +b.dataset.pg; Ev.send({ t: 'capWall', y: wallY, pg: wallPg }); }));
      w.querySelectorAll('[data-rep]').forEach(b => b.addEventListener('click', () => { if (window.Guest && !Guest.need('Reporting a capsule')) return; Desk.msgbox('Report this capsule?', 'Tell the vault keeper this capsule is not nice? (Three reports and it gets hidden.)', 'q', [['Report', () => Ev.send({ t: 'capReport', y: wallY, id: b.dataset.rep })], ['Cancel']]); }));
    }
    screens.add(draw);
    Ev.send({ t: 'capGet' });
    draw('state');
    const t = setInterval(() => { if (!el.isConnected) { clearInterval(t); screens.delete(draw); } }, 3000);
  }

  window.EvCap = { page, pic };
})();

/* events-pet: BYTE, the JackNet's very own pet (one pet for everybody; the server, mods/events.js, keeps it).
 * Byte hatches, grows through seven stages as the whole JackNet looks after it, has moods, chats about 1999 and never
 * dies (if nobody comes round, Byte just gets sleepy or a bit grumpy). Pages: www.bytepet.jnet; window: e-Pet Tray 2000.
 *   EvPet.page(el)  EvPet.win()  EvPet.sprite(stage, mood, px) -> SVG */
(function () {
  'use strict';
  const Ev = window.Ev, C = window.EventsCat, A = window.Apps; if (!Ev || !C || !A || window.EvPet) return;
  const { esc, h, sfx } = Ev, $ = id => document.getElementById(id), PET = C.PET;
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };

  // ================================================================ the sprite (24x24 pixels, drawn from shapes, mood on top)
  const SHAPE = [null, { w: 6, h: 5, cy: 17 }, { w: 7.5, h: 6.5, cy: 16 }, { w: 8.5, h: 7.5, cy: 15 }, { w: 9, h: 8.5, cy: 14 }, { w: 10, h: 9, cy: 13.5 }, { w: 10.5, h: 9.5, cy: 13 }];
  const PAL = { k: '#000', b: '#30c0c0', d: '#1a8080', l: '#a0f4f4', w: '#fff', p: '#ff8ad0', y: '#ffd400', r: '#e10600', g: '#2a9a2a', n: '#8a5a2a', s: '#606070', c: '#c0c0c0', e: '#f8f0d0', o: '#ff8000' };
  function grid(stage, mood) {
    const G = Array.from({ length: 24 }, () => Array(24).fill(''));
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 24 && y >= 0 && y < 24) G[y][x] = c; };
    if (stage === 0) { // the egg
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const dx = (x + 0.5 - 12) / 7, dy = (y + 0.5 - 13) / (y < 13 ? 10 : 8.5); if (dx * dx + dy * dy <= 1) set(x, y, 'e'); }
      [[9, 8, 'b'], [10, 8, 'b'], [14, 11, 'p'], [15, 11, 'p'], [10, 15, 'y'], [11, 15, 'y'], [15, 17, 'b'], [13, 6, 'p']].forEach(([x, y, c]) => set(x, y, c));
      return outline(G);
    }
    const S = SHAPE[stage], cx = 12, cy = S.cy;
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const dx = (x + 0.5 - cx) / S.w, dy = (y + 0.5 - cy) / S.h; const r = dx * dx + dy * dy; if (r <= 1) set(x, y, dx + dy > 0.75 ? 'd' : dx + dy < -0.9 ? 'l' : 'b'); }
    const top = Math.round(cy - S.h), bot = Math.round(cy + S.h);
    // feet (from Nibble), arms (from Byte)
    if (stage >= 2) [[cx - 4, bot], [cx - 3, bot], [cx + 2, bot], [cx + 3, bot]].forEach(([x, y]) => set(x, y, 'd'));
    if (stage >= 3) { set(cx - S.w - 0.5, cy + 1, 'b'); set(cx - S.w - 1, cy + 2, 'b'); set(cx + S.w - 0.5, cy + 1, 'b'); set(cx + S.w, cy + 2, 'b'); }
    // antenna (Bit and Nibble), floppy disk hat (Kilobyte), headphones (Megabyte), crown (Gigabyte)
    if (stage <= 3) { set(cx, top - 1, 'k'); set(cx, top - 2, 'k'); set(cx, top - 3, 'y'); }
    if (stage === 4) { for (let x = cx - 4; x <= cx + 3; x++) for (let y = top - 4; y <= top - 1; y++) set(x, y, 's'); for (let x = cx - 2; x <= cx + 1; x++) set(x, top - 4, 'c'); set(cx + 1, top - 3, 'c'); set(cx - 3, top - 2, 'w'); set(cx - 2, top - 2, 'w'); }
    if (stage === 5) { for (let x = cx - 7; x <= cx + 6; x++) set(x, top - 1, 'k'); [[cx - 9, cy - 3], [cx - 9, cy - 2], [cx - 9, cy - 1], [cx + 8, cy - 3], [cx + 8, cy - 2], [cx + 8, cy - 1]].forEach(([x, y]) => set(x, y, 'r')); set(cx - 8, top, 'k'); set(cx + 7, top, 'k'); }
    if (stage === 6) { for (let x = cx - 4; x <= cx + 3; x++) set(x, top - 1, 'y'); [cx - 4, cx - 1, cx + 2].forEach(x => { set(x, top - 2, 'y'); set(x + 1, top - 2, 'y'); set(x, top - 3, 'y'); }); set(cx - 1, top - 1, 'r'); set(cx, top - 1, 'r'); }
    // the face
    const ey = Math.round(cy - S.h * 0.25), ex = Math.max(2, Math.round(S.w * 0.38)), my = Math.round(cy + S.h * 0.28);
    const eye = (x0) => {
      if (mood === 'sleepy') { set(x0 - 1, ey, 'k'); set(x0, ey, 'k'); }
      else if (mood === 'happy') { set(x0 - 1, ey, 'k'); set(x0, ey - 1, 'k'); set(x0 + 1, ey, 'k'); }
      else if (mood === 'grumpy') { set(x0 - 1, ey - 1, 'k'); set(x0, ey, 'k'); set(x0 + 1, ey, 'k'); set(x0, ey + 1, 'k'); }
      else { set(x0, ey, 'k'); set(x0 + 1, ey, 'k'); set(x0, ey + 1, 'k'); set(x0 + 1, ey + 1, 'k'); set(x0, ey, 'w'); }
    };
    eye(cx - ex - 1); eye(cx + ex - 1);
    if (mood === 'happy' || mood === 'ok') { set(cx - 2, my - 1, 'k'); for (let x = cx - 1; x <= cx; x++) set(x, my, 'k'); set(cx + 1, my - 1, 'k'); if (mood === 'happy') { set(cx - 1, my + 1, 'p'); set(cx, my + 1, 'p'); } }
    else if (mood === 'hungry') { set(cx - 1, my, 'k'); set(cx, my, 'k'); set(cx - 1, my + 1, 'k'); set(cx, my + 1, 'k'); set(cx, my + 1, 'p'); }
    else if (mood === 'sleepy') { set(cx, my, 'k'); }
    else { set(cx - 2, my + 1, 'k'); set(cx - 1, my, 'k'); set(cx, my, 'k'); set(cx + 1, my + 1, 'k'); }
    if (stage >= 1) { set(cx - ex - 2, ey + 2, 'p'); set(cx + ex + 1, ey + 2, 'p'); } // rosy cheeks
    if (mood === 'grubby') [[cx - 3, cy + 2], [cx + 3, cy - 1], [cx + 1, cy + 3], [cx - 5, cy - 2]].forEach(([x, y]) => { if (G[y] && G[y][x]) set(x, y, 'n'); });
    return outline(G);
  }
  function outline(G) {
    const out = G.map(r => r.slice());
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (!G[y][x]) { const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => G[y + b] && G[y + b][x + a] && G[y + b][x + a] !== 'k'); if (n) out[y][x] = 'k'; }
    return out;
  }
  function sprite(stage, mood, px) {
    const G = grid(stage, mood), runs = {};
    G.forEach((r, y) => { let x = 0; while (x < 24) { const c = r[x]; if (!c) { x++; continue; } let w = 1; while (x + w < 24 && r[x + w] === c) w++; (runs[c] = runs[c] || []).push(`M${x} ${y}h${w}v1H${x}z`); x += w; } });
    return `<svg viewBox="0 0 24 24" width="${px || 96}" height="${px || 96}" shape-rendering="crispEdges" role="img" aria-label="Byte the pet, ${esc(PET.STAGES[stage].n)}, ${esc(mood)}">${Object.keys(runs).map(c => `<path fill="${PAL[c]}" d="${runs[c].join('')}"/>`).join('')}</svg>`;
  }

  // ================================================================ what Byte says (about 1999, mostly)
  const SAY = {
    egg: ['*hum*', '*wobble*', '*tap tap tap* (from inside)', '...', '*the egg is 1.44 MB and rising*'],
    happy: ['This is the best day since the Phantom Menace came out!', 'I feel like a brand new 56K modem!', 'Did you know there are 151 Pokemon? I am number 152. (I am not.)', 'Wheee! I could bounce all the way to the year 2000!', 'You are my favourite. Do not tell the others. (Tell the others.)', 'I did a backflip! It was in my head, but it counts.', 'Everybody\'s talking about the Millennium Bug. I am a Byte. Totally different.'],
    ok: ['Hello! Have you played Snake on a mobile? It is VERY hard.', 'I heard there is an eclipse in August. Do not look at the sun!', 'What is your favourite game this year? Mine is anything with pixels.', 'My favourite noise is a modem connecting. Beeeee-dong-dong-krrrrsh.', 'Mom says too much screen time is bad for you. I AM the screen.', 'Is it nearly the weekend? I think it is nearly the weekend.', 'Somebody said "Y2K" and I jumped. I am fine. I am Y2K compliant. Probably.'],
    hungry: ['Ooh. Is that a crisp? I could murder a crisp.', 'My tummy is making a dial-up noise.', 'I would eat a whole pizza. Two pizzas. A floppy disk of pizza.', 'Snack time? Snack time? Is it snack time?'],
    bored: ['Bored bored bored. Shall we play something?', 'I have counted all my pixels. 576. Again?', 'Play with me! I know a great game called "Byte Chases Ball".', 'I tried to play Solitaire but I do not have hands for it.'],
    grubby: ['I rolled in some old cookies. Browser cookies. Very crumbly.', 'Bath? I suppose. If there are bubbles.', 'I am a bit sticky. It was a fizzy cola bottle. Worth it.'],
    sleepy: ['*yawn* Is it bedtime? It feels like bedtime.', 'Zzz... five more minutes... zzz', 'I was dreaming about screensavers. The flying toasters ones. Wait, no, the stars ones.', 'Night night, JackNet. Zzz.'],
    grumpy: ['Hmph. Not in the mood. ...A pat would be nice though.', 'I am doing a sulk. It is a very good sulk.', 'Grrr. (That was my fierce noise. Was it fierce?)', 'Everyone is out playing. I am NOT jealous. ...Is it my turn now?'],
  };
  const MOODN = { happy: 'Happy!', ok: 'Content', hungry: 'Peckish', bored: 'Bored', grubby: 'Grubby', sleepy: 'Sleepy', grumpy: 'Grumpy (sulking)', egg: 'An egg' };
  const ACTS = [['feed', 'Feed', '&#127829;'], ['play', 'Play', '&#9917;'], ['clean', 'Clean', '&#129532;'], ['pat', 'Pat', '&#9995;'], ['tuck', 'Tuck in', '&#128164;']];
  const ago = ts => Ev.ago(Ev.now() - ts) + ' ago';

  css('evPetCss', `
.bp{background:#d8f0ff;color:#102030;font:13px/1.45 "Comic Sans MS","Comic Neue","Chalkboard SE",cursive;min-height:100%;padding:0 0 20px;background-image:linear-gradient(90deg,rgba(255,255,255,.4) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.4) 2px,transparent 2px);background-size:24px 24px}
.bp-wrap{max-width:820px;margin:0 auto;padding:10px 12px}
.bp h1{margin:6px 0 0;text-align:center;font:bold 40px "Comic Sans MS","Comic Neue",cursive;color:#ff3c9a;text-shadow:3px 3px 0 #fff,5px 5px 0 #30c0c0;letter-spacing:2px}
.bp-tag{text-align:center;margin:0 0 10px;font-weight:bold;color:#1a6a8a}
.bp-main{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:12px}
.bp-room{position:relative;background:linear-gradient(#ffe8c8 0 68%,#c88a5a 68%);border:4px solid #8a5a2a;border-radius:6px;min-height:240px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:18px;overflow:hidden}
.bp-room::before{content:"";position:absolute;left:12px;top:12px;width:64px;height:48px;background:#7ec8ff;border:4px solid #fff;box-shadow:0 0 0 2px #8a5a2a}
.bp-room.night{background:linear-gradient(#20204a 0 68%,#5a3a2a 68%)}
.bp-room.night::before{background:#000030 radial-gradient(#fff 1px,transparent 1.5px) 0 0/10px 10px}
.bp-sp{position:relative;z-index:1}
.bp-sp.bpm-happy{animation:bphop 1s ease-in-out infinite}
.bp-sp.bpm-sleepy{animation:bpbreathe 3s ease-in-out infinite}
.bp-sp.bpm-grumpy{animation:bpshake 2.5s ease-in-out infinite}
.bp-sp.bpm-egg{animation:bpwob 2s ease-in-out infinite}
@keyframes bphop{50%{transform:translateY(-10px)}}
@keyframes bpbreathe{50%{transform:scale(1.04,.96)}}
@keyframes bpshake{0%,90%,100%{transform:none}93%{transform:translateX(-3px)}96%{transform:translateX(3px)}}
@keyframes bpwob{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
.bp-say{position:absolute;left:50%;top:14px;transform:translateX(-50%);max-width:86%;background:#fff;border:2px solid #000;border-radius:12px;padding:6px 10px;font-size:13px;z-index:2;text-align:center}
.bp-say::after{content:"";position:absolute;left:50%;bottom:-10px;border:8px solid transparent;border-top-color:#000;margin-left:-8px}
.bp-zz{position:absolute;right:22%;top:38%;font:bold 18px Arial;color:#fff;z-index:2}
.bp-panel{background:#fff;border:3px solid #30c0c0;border-radius:6px;padding:10px}
.bp-panel h3{margin:0 0 4px;font-size:17px;color:#1a6a8a}
.bp-stat{display:grid;grid-template-columns:58px minmax(0,1fr) 34px;gap:6px;align-items:center;font-size:12px;margin:3px 0}
.bp-stat .bar{height:14px;border:2px solid #000;background:#eee;overflow:hidden}
.bp-stat .bar i{display:block;height:100%;background:repeating-linear-gradient(90deg,var(--c) 0 6px,transparent 6px 8px)}
.bp-acts{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px;margin:10px 0 4px}
.bp-acts .btn{min-height:46px;font:bold 13px Verdana,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.bp-acts .btn small{font:10px Arial;color:#444}
.bp-msg{min-height:20px;font-weight:bold;color:#a0207a}
.bp-grow{font-size:12px}
.bp-grow .prog{margin:3px 0}
.bp h2{font:bold 18px "Comic Sans MS","Comic Neue",cursive;color:#ff3c9a;margin:14px 0 4px}
.bp-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.bp-box{background:#fff;border:2px dashed #30c0c0;padding:8px;font-size:12px;font-family:Verdana,Arial,sans-serif}
.bp-box div{padding:2px 0;border-bottom:1px dotted #cde}
.bp-stages{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.bp-stages div{background:#fff;border:2px solid #30c0c0;border-radius:6px;padding:4px;text-align:center;width:92px;font:11px Verdana,Arial}
.bp-stages div.no{opacity:.5;filter:grayscale(1) brightness(.2)}
.bp-stages div.on{border-color:#ff3c9a;box-shadow:0 0 0 2px #ff3c9a}
.bp-dl{display:block;max-width:360px;margin:12px auto;text-align:center;background:#ff3c9a;color:#fff !important;border:3px outset #ffb0e0;font:bold 14px Verdana,Arial;padding:8px;cursor:pointer;text-decoration:none}
@media (max-width:620px){.bp-main{grid-template-columns:minmax(0,1fr)}.bp h1{font-size:30px}}
@media (prefers-reduced-motion: reduce){.bp-sp{animation:none !important}}
.ep{margin:-6px;background:#ffd0ec;padding:8px;font:12px Tahoma,Arial;display:grid;gap:6px}
.ep .bp-room{min-height:178px;padding-bottom:8px}
.ep .bp-say{font-size:11px;top:6px}
.ep .bp-acts{margin:4px 0 0;grid-template-columns:repeat(5,1fr)}
.ep .bp-acts .btn{min-height:40px;font-size:11px;padding:0 2px}
`);

  // ================================================================ one shared view, many screens
  let V = null, lastSay = '', sayAt = 0;
  const screens = new Set();
  const redraw = () => screens.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  Ev.on('bpView', m => { V = m; redraw(); });
  Ev.on('bpSay', m => { lastSay = m.text; sayAt = Date.now(); if (m.ok) { sfx('pet'); A.secret('evt.byte'); } redraw(); });
  Ev.on('bpMile', m => Desk.toast('Byte says THANK YOU!', `You have given Byte ${m.pts} care points! Here is a present: ${window.Econ && Econ.rp ? Econ.rp(m.amt) : m.amt + ' Rupees'}.`, 7000));
  Ev.on('bpGrow', m => { Desk.toast('BYTE HAS GROWN UP!', `Byte is now a ${PET.STAGES[m.st].n}! Everyone who helped gets a little something.`, 8000); sfx('solve'); });
  let subN = 0;
  const sub = on => { subN = Math.max(0, subN + (on ? 1 : -1)); if (on) Ev.send({ t: 'bpSub', on: true }); else if (!subN && !document.querySelector('#tray .ev-ptray')) Ev.send({ t: 'bpSub', on: false }); };
  if (window.Net) Net.on('welcome', () => { if (subN) Ev.send({ t: 'bpSub', on: true }); });
  function act(a) {
    if (window.Guest && !Guest.need('Looking after Byte')) return;
    Ev.send({ t: 'bpAct', a });
  }
  const pickSay = mood => { const L = SAY[mood] || SAY.ok; return L[Math.floor(Date.now() / 9000) % L.length]; };
  function cdLeft(a) {
    if (!V || !V.me || !V.me.cd || !V.me.cd[a]) return 0;
    const left = V.me.cd[a] + PET.ACT[a].cd * 1000 - (Date.now() + (V.now ? 0 : 0));
    return Math.max(0, left - (Ev.test ? PET.ACT[a].cd * 1000 * 29 / 30 : 0));
  }
  // fill a box with the pet + the buttons (shared by the web page and the tray window)
  function core(box) {
    const p = V && V.pet, md = p ? p.mood : 'ok', st = p ? p.st : 0;
    const room = box.querySelector('.bp-room');
    room.classList.toggle('night', !!(p && p.night));
    const showSay = lastSay && Date.now() - sayAt < 7000 ? lastSay : pickSay(md);
    room.innerHTML = `<div class="bp-say">${esc(showSay)}</div>${md === 'sleepy' ? '<div class="bp-zz">z Z z</div>' : ''}<div class="bp-sp bpm-${md}">${sprite(st, md, room.closest('.ep') || room.clientWidth < 260 ? 96 : 132)}</div>`;
    const sb = box.querySelector('.bp-stats');
    if (sb) sb.innerHTML = p ? [['Food', p.f, '#ff8000'], ['Fun', p.p, '#2463e0'], ['Clean', p.c, '#30c0c0'], ['Sleep', p.e, '#9333d6']].map(([n, v, c]) => `<div class="bp-stat"><span>${n}</span><span class="bar" style="--c:${c}"><i style="width:${v}%"></i></span><span>${v}%</span></div>`).join('') : '<i>Asking Byte how it is...</i>';
    box.querySelectorAll('[data-a]').forEach(b => { const left = cdLeft(b.dataset.a); b.disabled = left > 0; b.querySelector('small').textContent = left > 0 ? `in ${left >= 60000 ? Math.ceil(left / 60000) + ' min' : Math.ceil(left / 1000) + 's'}` : st === 0 ? 'warm egg' : 'ready'; });
  }
  const actsHtml = () => `<div class="bp-acts">${ACTS.map(([a, n, e]) => `<button class="btn" type="button" data-a="${a}"><span>${e} ${n}</span><small>ready</small></button>`).join('')}</div>`;
  const wire = box => box.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { act(b.dataset.a); b.disabled = true; setTimeout(redraw, 600); }));

  // ================================================================ www.bytepet.jnet
  function page(el) {
    el.className = 'bp';
    el.innerHTML = `<div class="bp-wrap"><h1>BYTE</h1><p class="bp-tag">The JackNet's very own pet! One pet, shared by EVERYBODY. Byte grows up as we all look after it.</p>
      <div class="bp-main"><div class="bp-room"></div><div class="bp-panel"><h3 class="bp-h"></h3><div class="bp-md small"></div><div class="bp-stats"></div>${actsHtml()}<div class="bp-msg" aria-live="polite"></div><div class="bp-grow"></div></div></div>
      <div class="bp-two"><div><h2>Byte's diary</h2><div class="bp-box bp-log"></div></div><div><h2>Top carers</h2><div class="bp-box bp-top"></div><div class="bp-box bp-mine" style="margin-top:6px"></div></div></div>
      <h2>Growing up</h2><div class="bp-stages"></div>
      <h2>How to look after Byte</h2><div class="bp-box"><div>&#127829; <b>Feed</b> every 15 minutes, &#9917; <b>Play</b> every 8, &#129532; <b>Clean</b> every 20, &#9995; <b>Pat</b> every 2, &#128164; <b>Tuck in</b> when Byte is tired. (Each person has their own turns, so everybody gets a go.)</div><div>Every bit of care earns <b>care points</b>. When the whole JackNet has given enough, and Byte is old enough, Byte <b>grows up</b>. Everyone who helped gets a present.</div><div>Byte never dies. If nobody comes round, Byte just gets sleepy, or does a bit of a sulk. Byte sleeps at night (10pm to 7am, UK time) and gets hungry slower then.</div><div>Feeding, playing and cleaning are for JackNet members (it's FREE to join). Everyone can visit!</div></div>
      <a class="bp-dl" href="#" role="button">&#11015; GET e-PET TRAY 2000 (188 KB)<br><small style="font:10px Arial">Byte lives in your system tray! Freeware.</small></a>
      <p class="small" style="text-align:center;font-family:Verdana,Arial">Byte is looked after by the Byte Fan Club. No Bytes were harmed in the making of this web site. <a href="http://www.whatson.jnet/">What's On?</a></p></div>`;
    const room = el.querySelector('.bp-room'), panel = el.querySelector('.bp-panel');
    const box = { querySelector: s => (s === '.bp-room' ? room : panel.querySelector(s)), querySelectorAll: s => panel.querySelectorAll(s) };
    wire(panel);
    el.querySelector('.bp-dl').addEventListener('click', ev => { ev.preventDefault(); if (window.Setup && Setup.download) Setup.download('evt.pettray'); });
    const draw = () => {
      if (!el.isConnected) return;
      core(box);
      const p = V && V.pet; if (!p) return;
      const S = PET.STAGES, nx = S[p.st + 1], age = Math.floor((Ev.now() - p.born) / 864e5);
      el.querySelector('.bp-h').textContent = `Byte the ${S[p.st].n}`;
      el.querySelector('.bp-md').innerHTML = `Mood: <b>${esc(MOODN[p.mood] || p.mood)}</b> &middot; ${age} day${age === 1 ? '' : 's'} old &middot; ${p.carers | 0} carers`;
      el.querySelector('.bp-msg').textContent = lastSay && Date.now() - sayAt < 15000 ? lastSay : '';
      el.querySelector('.bp-grow').innerHTML = nx ? `Next stage: <b>${esc(nx.n)}</b> &middot; ${p.xp} of ${nx.xp} care points${nx.days ? ` &middot; and ${nx.days} day${nx.days === 1 ? '' : 's'} old` : ''}<div class="prog"><span style="display:flex;gap:2px">${'<i></i>'.repeat(Math.round(Math.min(1, p.xp / nx.xp) * 24))}</span></div>` : '<b>Byte is fully grown: a GIGABYTE! A legend of the JackNet.</b>';
      const ACTW = { feed: 'fed Byte', play: 'played with Byte', clean: 'gave Byte a bath', pat: 'patted Byte', tuck: 'tucked Byte in' };
      el.querySelector('.bp-log').innerHTML = V.log && V.log.length ? V.log.slice().reverse().map(l => `<div><b>${esc(l[1])}</b> ${ACTW[l[2]] || l[2]}${l[3] ? ': ' + esc(l[3]) : ''} <span style="color:#888">(${ago(l[0])})</span></div>`).join('') : '<div><i>Nobody has been round yet today.</i></div>';
      el.querySelector('.bp-top').innerHTML = V.top && V.top.length ? V.top.map((t, i) => `<div>${i + 1}. <b>${esc(t[0])}</b> ${t[1]} points</div>`).join('') : '<div><i>No carers yet. Be the first!</i></div>';
      const MS = PET.MILES, mine = V.me;
      el.querySelector('.bp-mine').innerHTML = mine ? `You have given <b>${mine.pts}</b> care points. ${mine.ms < MS.length ? `Next thank-you present at ${MS[mine.ms][0]} points.` : 'You have every thank-you present. Byte loves you.'}` : Ev.member() ? 'You haven\'t looked after Byte yet. Go on!' : 'Log on to JackNet to look after Byte (it\'s FREE).';
      el.querySelector('.bp-stages').innerHTML = S.map((s, i) => `<div class="${i > p.st ? 'no' : i === p.st ? 'on' : ''}">${sprite(i, i === 0 ? 'egg' : 'happy', 56)}<br><b>${i > p.st ? '???' : esc(s.n)}</b></div>`).join('');
    };
    screens.add(draw); sub(true); Ev.send({ t: 'bpGet' }); draw();
    const t = setInterval(() => { if (!el.isConnected) { clearInterval(t); screens.delete(draw); sub(false); return; } draw(); }, 4000);
  }

  // ================================================================ e-Pet Tray 2000 (the window)
  function win() {
    const b = h('div', 'ep');
    b.innerHTML = `<div class="bp-room"></div><div class="bp-stats"></div>${actsHtml()}<div class="row" style="justify-content:space-between"><span class="ep-st"></span><button class="btn ep-web" type="button">www.bytepet.jnet</button></div>`;
    const w = A.win('Byte - e-Pet Tray 2000', b, { w: 320, icon: Ev.ICO.pet, noResize: true, noMax: true, cls: 'ep-win', onClose: () => { screens.delete(draw); sub(false); clearInterval(t); } });
    wire(b);
    b.querySelector('.ep-web').addEventListener('click', () => Ev.go('http://www.bytepet.jnet/'));
    const draw = () => { if (w.closed) return; core(b); const p = V && V.pet; b.querySelector('.ep-st').innerHTML = p ? `<b>${esc(PET.STAGES[p.st].n)}</b> &middot; ${esc(MOODN[p.mood] || '')}` : ''; };
    screens.add(draw); sub(true); Ev.send({ t: 'bpGet' }); draw();
    const t = setInterval(draw, 4000);
    return w;
  }

  window.EvPet = { page, win, sprite, get view() { return V; } };
})();

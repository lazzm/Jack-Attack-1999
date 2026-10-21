/* grind-jobs: POCKET MONEY. Mom's Chore List (a note stuck to the fridge, on the desktop), The Odd Jobz Board
 * (www.oddjobz.jnet, jobs for the neighbours) and the mini-game runner the jobs play in. The games themselves are in
 * js/grind-games-a.js (washing up, tidy your room, car wash) and js/grind-games-b.js (paper round, mowing, dog walking).
 * The server pays (mods/grind.js): each job pays its first rounds each day at 100%, 60%, 40% and 25%, by how well you did.
 * A game is GrindJobs.game(id, api => ({ start, step(dt), draw(g), down(x,y), move(x,y), up(x,y), key(k, isDown),
 *   score(), over, hud })) on a 480x320 canvas. */
(function () {
  'use strict';
  if (window.GrindJobs || !window.Grind) return;
  const A = Apps, C = window.GrindCat, esc = A.esc, store = A.store;
  const RP = Grind.RP, J = C.JOBS, W = 480, H = 320;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const note = (f, d, t) => { try { if (Sound.on && Sound.note) Sound.note(f, d, t || 'square'); } catch (e) {} };

  // ================================================================ the look
  const css = `
.gj{position:relative;background:#000;user-select:none;-webkit-user-select:none}
.gj canvas{display:block;width:100%;height:auto;aspect-ratio:3/2;touch-action:none;image-rendering:auto;cursor:crosshair}
.gj-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:10px;background:rgba(0,0,40,.35)}
.gj-ov[hidden]{display:none}
.gj-card{max-width:400px;width:100%;max-height:100%;overflow:auto;background:#fffbe8;border:2px solid #000;box-shadow:4px 4px 0 rgba(0,0,0,.45);padding:10px 12px;font:12px Tahoma,Verdana,sans-serif;color:#000}
.gj-card h3{margin:0 0 4px;font:bold 18px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#b0002a}
.gj-card p{margin:0 0 6px;line-height:1.4}
.gj-card .gj-pay{background:#e8f4e0;border:1px solid #6a9a5a;padding:4px 6px;margin:6px 0;font-size:11px}
.gj-card .gj-keys{font-size:11px;color:#333;background:#fff;border:1px dashed #999;padding:4px 6px}
.gj-card .row{justify-content:center;gap:8px;margin-top:8px}
.gj-card .btn{min-width:92px;font-weight:bold}
.gj-big{font:bold 34px Impact,'Arial Black',sans-serif;color:#000080;text-align:center;margin:2px 0}
.gj-stars{text-align:center;font-size:26px;letter-spacing:4px;color:#d0a000;text-shadow:1px 1px 0 #6a4a00}
.gj-stars i{font-style:normal;color:#c8c0a8;text-shadow:none}
.gj-mom{position:relative;margin:8px 4px 4px;padding:8px 10px 10px;background:#ffff9a;border:1px solid #c8c060;box-shadow:2px 3px 0 rgba(0,0,0,.25);transform:rotate(-1.2deg);font:14px/1.35 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#203080}
.gj-mom::before{content:'';position:absolute;left:50%;top:-7px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff8a8a,#c00 60%,#600);box-shadow:1px 1px 1px rgba(0,0,0,.4)}
.gj-earn{text-align:center;font-weight:bold;margin:4px 0}
.gj-earn .ec-rp{font-size:14px}
.gj-guest{font-size:11px;background:#fff0f0;border:1px dashed #c00;padding:4px 6px;margin:6px 0}
/* Mom's Chore List */
.grc{position:relative;min-height:100%;padding:14px 12px 12px;background:linear-gradient(90deg,#e8ecee,#fbfcfc 18%,#eef1f2 60%,#dde2e4);box-shadow:inset 0 0 0 1px #b8c0c4}
.grc::after{content:'';position:absolute;right:12px;top:40%;width:10px;height:120px;border-radius:5px;background:linear-gradient(90deg,#9aa4a8,#e8eef0,#8a9498);box-shadow:1px 1px 2px rgba(0,0,0,.3)}
.grc-mag{position:absolute;width:30px;height:30px;border-radius:50%;box-shadow:1px 2px 2px rgba(0,0,0,.35);z-index:2}
.grc-note{position:relative;margin:0 26px 0 6px;padding:14px 14px 14px 40px;background:#fff linear-gradient(transparent 0 27px,#9cc8f0 27px 28px) 0 14px/100% 28px;border:1px solid #c8c8c8;box-shadow:3px 4px 0 rgba(0,0,0,.18);transform:rotate(-.6deg);font:15px/28px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#1a2a80}
.grc-note::before{content:'';position:absolute;left:28px;top:0;bottom:0;width:1px;background:#f0a0a0}
.grc-note h3{margin:0;font:bold 20px/28px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#c0002a;text-decoration:underline}
.grc-li{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:6px;align-items:start;min-height:56px}
.grc-li .grc-tick{margin-top:6px}.grc-li .btn{margin-top:3px}
.grc-li .grc-tick{width:16px;height:16px;border:2px solid #1a2a80;border-radius:2px;position:relative;background:rgba(255,255,255,.6)}
.grc-li.done .grc-tick::after{content:'';position:absolute;left:3px;top:-6px;width:7px;height:14px;border:solid #0a8a2a;border-width:0 3px 3px 0;transform:rotate(40deg)}
.grc-li .grc-sub{display:block;font:11px/28px Tahoma,Verdana,sans-serif;color:#556;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grc-li .btn{font:bold 11px Tahoma,sans-serif;min-width:64px}
.grc-ps{font-size:13px;line-height:28px;color:#a0002a}
.grc-foot{margin:12px 26px 0 6px;font:11px Tahoma,Verdana,sans-serif;color:#333;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.grc-sticky{margin:12px 30px 0 auto;max-width:260px;padding:8px 10px;background:#ffff9a;border:1px solid #d8d070;box-shadow:2px 3px 0 rgba(0,0,0,.2);transform:rotate(1.4deg);font:13px/1.35 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#203080}
/* The Odd Jobz Board */
.ojz{font:13px Verdana,Arial,sans-serif;color:#000;background:#2a6a2a;padding:10px;min-height:100%}
.ojz-in{max-width:780px;margin:0 auto}
.ojz-head{text-align:center;color:#fff;padding:6px 0 10px}
.ojz-head h1{margin:0;font:bold 36px/1 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#ffe680;text-shadow:3px 3px 0 #000;transform:rotate(-1.5deg)}
.ojz-head p{margin:6px 0 0;font-size:12px}
.ojz-cork{padding:16px 12px;background:radial-gradient(circle at 20% 30%,#a87840 0 1.5px,transparent 2.5px) 0 0/17px 19px,radial-gradient(circle at 70% 60%,#e0b070 0 1.5px,transparent 2.5px) 0 0/23px 13px,radial-gradient(circle at 40% 80%,#b88850 0 1px,transparent 2px) 0 0/11px 7px,#c8955a;border:12px solid #6a3a1a;box-shadow:inset 0 0 18px rgba(0,0,0,.45),0 3px 0 #000;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 14px}
.ojz-card{position:relative;background:#fff;padding:14px 10px 10px;box-shadow:2px 3px 3px rgba(0,0,0,.45);font-size:12px;line-height:1.35}
.ojz-card:nth-child(1){transform:rotate(-2deg);background:#fffbe0}.ojz-card:nth-child(2){transform:rotate(1.5deg);background:#e8f4ff}.ojz-card:nth-child(3){transform:rotate(-1deg);background:#fff0f4}
.ojz-card::before{content:'';position:absolute;left:50%;top:-6px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#8af,#03c 60%,#014);box-shadow:1px 2px 1px rgba(0,0,0,.5)}
.ojz-card h2{margin:0 0 4px;font:bold 17px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive;color:#a0002a}
.ojz-card .ojz-who{font-style:italic;color:#444;margin-bottom:6px}
.ojz-card .ojz-pic{height:64px;margin:4px 0;display:flex;justify-content:center}
.ojz-card .ojz-pic svg{height:64px;width:auto}
.ojz-card .ojz-pay{margin:6px 0;font-weight:bold;color:#0a5a1a}
.ojz-card .ojz-tear{display:flex;border-top:1px dashed #888;margin-top:8px;padding-top:6px;justify-content:space-between;align-items:center;gap:4px;flex-wrap:wrap}
.ojz-card .btn{font-weight:bold}
.ojz-side{margin-top:14px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
.ojz-box{background:#fffbe8;border:2px solid #000;padding:8px 10px;font-size:12px}
.ojz-box h3{margin:0 0 4px;font:bold 13px Verdana,sans-serif;color:#2a6a2a}
.ojz-box table{width:100%;border-collapse:collapse}.ojz-box td{padding:2px;border-bottom:1px dotted #bbb}.ojz-box td:last-child{text-align:right}
.ojz-foot{text-align:center;color:#d8f0d0;font-size:10px;margin-top:12px}
.ojz-foot a{color:#ffe680}
@media (max-width:600px){.ojz-cork{grid-template-columns:minmax(0,1fr)}.ojz-side{grid-template-columns:minmax(0,1fr)}.ojz-head h1{font-size:28px}.grc-note{margin-right:10px}.grc::after{display:none}}
`;
  const st = document.createElement('style'); st.id = 'grindJobsCss'; st.textContent = css; document.head.appendChild(st);

  // ================================================================ notes from Mom (and the neighbours), by how it went
  const NOTES = {
    washup: [['You broke more than you stacked. We are eating off paper plates tomorrow. Love Mom x', 'Did a plate jump off the rack by itself? Funny how that happens. Love Mom x'],
      ['Not bad! Only a few wobbles. Now do your homework. Love Mom x', 'Thank you love. You missed a bit of egg on one plate but I will let you off. Mom x'],
      ['Sparkling! Who are you and what have you done with my son? Love Mom x', 'Best washing up EVER. I am telling Nan. Love Mom xx']],
    tidy: [['I opened the door and a sock fell on me. TRY AGAIN. Love Mom x', 'The comics do NOT live under the bed. Love Mom x'],
      ['Better! I can see the carpet. It is blue, by the way. Love Mom x', 'Good boy. Now do your homework. Love Mom x'],
      ['I can see the FLOOR! I nearly cried. Love Mom xx', 'Your room is tidier than mine. Do not tell your Dad. Love Mom xx']],
    car: [['Your Dad says it looks "artistic". He does not mean it nicely. Mom x', 'There is still a whole field on the back door. Mom x'],
      ['Dad says thanks, and "who left the sponge on the roof?" Love Mom x', 'Lovely job. The pigeon has already been back. Mom x'],
      ['Dad says it is shinier than the day he bought it. He has gone out to "just drive round the block". Love Mom xx', 'Spotless! Dad wants to know if you do waxing. Mom xx']],
    paper: [['Mr Khan from the paper shop says number 12 got THREE papers and no.14 got a window. Hmm.', 'The paper shop says: "Practice your aim, young man." And mind the bins.'],
      ['The paper shop says: "Not bad for a beginner. Same time tomorrow?"', 'Only one paper in a hedge today. Mr Khan says that is a record.'],
      ['The paper shop says: "Best paper round on the whole estate!" You get a free bag of crisps.', 'Mrs Pemberton says her paper landed right on the mat. She wants you on her round FOREVER.']],
    mow: [['Mr Grimsdale says: "My tulips! MY TULIPS!" He has gone for a lie down.', 'Mr Grimsdale says Gerald the gnome is "not the same since". Oops.'],
      ['Mr Grimsdale says: "Very nice stripes, lad. Missed a corner."', 'Mr Grimsdale says thank you and gave you a Werther\'s Original. (He calls it "a sweet".)'],
      ['Mr Grimsdale says it is the best his lawn has looked since 1983, and Gerald the gnome agrees.', 'Mr Grimsdale says: "Stripes like Wimbledon!" He is going to sit in a deckchair on it all afternoon.']],
    dog: [['Mrs Pemberton says Biscuit came home "covered in puddle". And possibly a cat.', 'Mrs Pemberton says Biscuit is fine, but the lamppost outside No. 30 needs a lie down.'],
      ['Mrs Pemberton says: "Biscuit had a lovely time. He ate a leaf." Thank you dear!', 'Biscuit is very happy and very muddy. Mrs Pemberton says thanks, love.'],
      ['Mrs Pemberton says Biscuit has never been so well behaved. She thinks you might be a dog whisperer.', 'Biscuit wagged so hard he fell over. Best walk ever, says Mrs Pemberton. Have a biscuit (a real one).']],
  };
  const tierOf = (j, sc) => { const g = J[j].good; return sc >= g ? 2 : sc >= g * 0.55 ? 1 : 0; };
  const noteFor = (j, sc) => { const L = NOTES[j][tierOf(j, sc)]; return L[(Date.now() / 1000 | 0) % L.length]; };
  const readNotes = () => store.get('jhp_grind_notes', []);
  function sawNote(j, t) { const L = readNotes(), k = j + t; if (!L.includes(k)) { L.push(k); store.set('jhp_grind_notes', L); } if (L.length >= 18) A.secret('grind.nag'); }

  // ================================================================ little pictures for the lists
  const PIC = {
    washup: '<svg viewBox="0 0 64 64"><rect x="8" y="44" width="48" height="8" fill="#9aa4a8" stroke="#333"/><path d="M12 44V30M20 44V30M28 44V30M36 44V30M44 44V30M52 44V30" stroke="#666" stroke-width="2"/><ellipse cx="32" cy="40" rx="20" ry="3.5" fill="#fff" stroke="#4a6a9a" stroke-width="1.5"/><ellipse cx="32" cy="34" rx="16" ry="3" fill="#e8f0ff" stroke="#4a6a9a" stroke-width="1.5"/><path d="M22 28h20l-2 4H24z" fill="#ffd0a0" stroke="#8a5a2a" stroke-width="1.2"/><rect x="26" y="14" width="12" height="12" rx="2" fill="#e10600" stroke="#600" stroke-width="1.2"/><path d="M38 17c4 0 4 6 0 6" fill="none" stroke="#600" stroke-width="1.5"/><circle cx="48" cy="14" r="3" fill="#cfefff" stroke="#6ab"/><circle cx="54" cy="22" r="2" fill="#cfefff" stroke="#6ab"/></svg>',
    tidy: '<svg viewBox="0 0 64 64"><rect x="6" y="40" width="22" height="16" fill="#c8a060" stroke="#5a3a1a" stroke-width="1.5"/><path d="M6 46h22" stroke="#5a3a1a"/><rect x="36" y="22" width="22" height="34" fill="#a07040" stroke="#4a2a0a" stroke-width="1.5"/><path d="M36 34h22M36 46h22" stroke="#4a2a0a" stroke-width="1.5"/><rect x="39" y="25" width="4" height="9" fill="#e10600"/><rect x="44" y="26" width="3" height="8" fill="#0050c0"/><rect x="48" y="24" width="5" height="10" fill="#ffd400"/><path d="M12 36c2-6 8-6 10 0" fill="#5ab0ff" stroke="#035" stroke-width="1.2"/><path d="M10 30l4 3 2-5" fill="#fff" stroke="#888"/><rect x="14" y="10" width="10" height="6" fill="#e10600" stroke="#600"/><rect x="16" y="8" width="2" height="2" fill="#e10600"/><rect x="20" y="8" width="2" height="2" fill="#e10600"/></svg>',
    car: '<svg viewBox="0 0 64 64"><path d="M6 42v-8l8-2 8-10h20l10 10 6 2v8z" fill="#c8102e" stroke="#400" stroke-width="1.5"/><path d="M24 24h8v8H18zM34 24h7l7 8H34z" fill="#bfe4ff" stroke="#246"/><circle cx="18" cy="44" r="6" fill="#222" stroke="#000"/><circle cx="18" cy="44" r="2.5" fill="#aaa"/><circle cx="48" cy="44" r="6" fill="#222" stroke="#000"/><circle cx="48" cy="44" r="2.5" fill="#aaa"/><ellipse cx="40" cy="36" rx="7" ry="4" fill="#7a5a2a" opacity=".9"/><ellipse cx="14" cy="36" rx="5" ry="3" fill="#7a5a2a" opacity=".9"/><circle cx="54" cy="14" r="4" fill="#fff" stroke="#9cf"/><circle cx="46" cy="10" r="3" fill="#fff" stroke="#9cf"/></svg>',
    paper: '<svg viewBox="0 0 64 64"><circle cx="16" cy="48" r="9" fill="none" stroke="#222" stroke-width="3"/><circle cx="48" cy="48" r="9" fill="none" stroke="#222" stroke-width="3"/><path d="M16 48l10-16h14l8 16M26 32l-4-8h-4M40 32l2-6h6" fill="none" stroke="#e10600" stroke-width="3" stroke-linejoin="round"/><rect x="28" y="30" width="12" height="9" fill="#ffd400" stroke="#6a4a00"/><path d="M40 8l14 6-6 10-14-6z" fill="#f4f4ec" stroke="#555"/><path d="M38 12l12 5M37 15l11 5" stroke="#999"/></svg>',
    mow: '<svg viewBox="0 0 64 64"><rect x="2" y="44" width="60" height="16" fill="#3a9a2a"/><path d="M2 44h60" stroke="#2a7a1a" stroke-width="2"/><path d="M6 44l2-5 2 5M14 44l2-6 2 6M54 44l2-5 2 5" stroke="#5ac03a" stroke-width="2" fill="none"/><rect x="18" y="32" width="26" height="12" rx="3" fill="#e10600" stroke="#400" stroke-width="1.5"/><path d="M40 32l10-22" stroke="#333" stroke-width="3"/><path d="M46 10h8" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="46" r="4" fill="#222"/><circle cx="40" cy="46" r="4" fill="#222"/><path d="M8 30l4-10 4 10z" fill="#e10600"/><circle cx="12" cy="33" r="3" fill="#ffd0a0"/><rect x="9" y="36" width="6" height="8" fill="#0050c0"/></svg>',
    dog: '<svg viewBox="0 0 64 64"><ellipse cx="30" cy="40" rx="16" ry="9" fill="#c8883a" stroke="#4a2a0a" stroke-width="1.5"/><circle cx="46" cy="30" r="9" fill="#c8883a" stroke="#4a2a0a" stroke-width="1.5"/><path d="M40 24c-4-6-8-4-6 4" fill="#8a5a1a" stroke="#4a2a0a"/><circle cx="49" cy="28" r="1.6"/><ellipse cx="54" cy="32" rx="2.5" ry="2" fill="#000"/><path d="M18 46v10M24 48v8M36 48v8M42 46v10" stroke="#4a2a0a" stroke-width="4" stroke-linecap="round"/><path d="M14 38c-6-2-8-8-6-12" fill="none" stroke="#c8883a" stroke-width="4" stroke-linecap="round"/><path d="M40 37c4 4 12-20 18-26" fill="none" stroke="#e10600" stroke-width="2"/><rect x="38" y="35" width="8" height="3" fill="#e10600"/></svg>',
  };

  // ================================================================ the mini-game runner
  const GAMES = {}; // id -> factory
  const gameFile = j => (j === 'washup' || j === 'tidy' || j === 'car' ? 'games-a' : 'games-b');
  let tok = null; // { j, tok } from the server
  Grind.on('grJobGo', m => { tok = m; });
  const open = {}; // job id -> win
  function play(j) {
    if (!J[j]) return null;
    if (J[j].room || HOME.includes(j)) return window.Chores && Chores.pcNote ? Chores.pcNote() : null; // (Mom's jobs are done round the house now: js/ch.js)
    if (open[j] && !open[j].closed) { open[j].restore(); return open[j]; }
    const box = document.createElement('div'); box.className = 'gj';
    box.innerHTML = `<canvas width="${W}" height="${H}" tabindex="0" aria-label="${esc(J[j].n)}"></canvas><div class="gj-ov"><div class="gj-card"><p>Loading...</p></div></div>`;
    const w = A.win(J[j].n, box, { w: 520, icon: J[j].list === 'mom' ? Grind.ICO.chores : Grind.ICO.jobs, noResize: true, onClose: () => { stop(); } });
    open[j] = w;
    const cv = box.querySelector('canvas'), g = cv.getContext('2d'), ov = box.querySelector('.gj-ov'), card = box.querySelector('.gj-card');
    let game = null, raf = 0, last = 0, left = 0, state = 'title', cd = 0, paused = false, result = null;
    const api = { W, H, sfx, note, get left() { return left; }, get secs() { return J[j].secs; }, rnd: (a, b) => a + Math.random() * (b - a), pick: l => l[Math.floor(Math.random() * l.length)] };
    function stop() { cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', vis); }
    const vis = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', vis);
    const xy = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', ev => { if (state !== 'play' || !game) return; ev.preventDefault(); cv.focus(); try { cv.setPointerCapture(ev.pointerId); } catch (e) {} const [x, y] = xy(ev); game.down && game.down(x, y); });
    cv.addEventListener('pointermove', ev => { if (state !== 'play' || !game) return; const [x, y] = xy(ev); game.move && game.move(x, y, ev.buttons || ev.pointerType === 'touch'); });
    cv.addEventListener('pointerup', ev => { if (state !== 'play' || !game) return; const [x, y] = xy(ev); game.up && game.up(x, y); });
    cv.addEventListener('pointercancel', () => { if (game && game.up) game.up(-1, -1); });
    const keyH = isDown => ev => {
      if (state !== 'play' || !game || !game.key) return;
      const k = ev.key === ' ' ? 'Space' : ev.key;
      if (/^(Arrow(Up|Down|Left|Right)|Space|Enter|[wasdWASDxXzZ])$/.test(k)) { ev.preventDefault(); ev.stopPropagation(); if (!ev.repeat || !isDown) game.key(k.length === 1 ? k.toLowerCase() : k, isDown); }
    };
    w.el.addEventListener('keydown', keyH(true)); w.el.addEventListener('keyup', keyH(false));
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (paused || w.el.style.display === 'none') return;
      if (state === 'count') { cd -= dt; if (cd <= 0) { state = 'play'; note(1320, 0.18); } else if (Math.ceil(cd) !== Math.ceil(cd + dt)) note(660, 0.1); }
      if (state === 'play') { left -= dt; game.step(dt); if (left <= 0 || game.over) finish(); }
      try { game.draw(g); } catch (e) { console.error(e); }
      if (state === 'count' || state === 'play') hud();
    }
    function hud() {
      // a time bar along the top and the score bubble
      const k = Math.max(0, left / J[j].secs);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, 16);
      g.fillStyle = k > 0.25 ? '#3ad03a' : (Math.floor(left * 4) % 2 ? '#ff3030' : '#ffb000'); g.fillRect(2, 2, (W - 120) * k, 12);
      g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(1.5, 1.5, W - 119, 13);
      g.font = 'bold 12px Verdana,Arial,sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText((game.hud ? game.hud() : game.score() + ' ' + J[j].unit), W - 6, 9);
      g.textAlign = 'left';
      if (state === 'count') {
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 16, W, H - 16);
        g.font = 'bold 90px Impact,Arial Black,sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffd400'; g.strokeStyle = '#000'; g.lineWidth = 6;
        const t = String(Math.ceil(cd)); g.strokeText(t, W / 2, H / 2 + 6); g.fillText(t, W / 2, H / 2 + 6); g.textAlign = 'left';
      }
    }
    function title() {
      state = 'title'; ov.hidden = false;
      const me = Grind.me, n = me && me.jobs ? me.jobs[j] | 0 : 0, best = me && me.best ? me.best[j] | 0 : 0, mem = Grind.member;
      const next = n < C.RUNS.length ? Math.round(J[j].pay * C.RUNS[n]) : 0;
      const keys = game && game.keys ? game.keys : '';
      card.innerHTML = `<h3>${esc(J[j].n)}</h3><p>${esc(J[j].blurb)}</p>${keys ? `<div class="gj-keys">${keys}</div>` : ''}
        <div class="gj-pay">${mem ? (next ? `This go pays up to <b>${esc(RP(next))}</b> (go ${n + 1} of ${C.RUNS.length} today that pays). Do it well for full pay!` : `You've had all ${C.RUNS.length} paid goes today. This one's just for fun (and the Hall of Fame). New jobs tomorrow!`) : `Guests can play! Only JackNet members get paid in Rupees, though (joining is FREE).`}${best ? `<br>Your best: <b>${best}</b> ${esc(J[j].unit)}` : ''}</div>
        <div class="row"><button class="btn" data-go>Start!</button><button class="btn" data-x>Not now</button></div>`;
      card.querySelector('[data-go]').addEventListener('click', go);
      card.querySelector('[data-x]').addEventListener('click', () => w.close());
      setTimeout(() => { const b = card.querySelector('[data-go]'); if (b) b.focus(); }, 30);
    }
    function go() {
      sfx('click'); ov.hidden = true; tok = null; result = null;
      Grind.send({ t: 'grJobGo', j });
      game = GAMES[j](api); left = J[j].secs; cd = 3; state = 'count'; last = 0; GrindJobs.cur = game;
      if (game.start) game.start();
      cv.focus();
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function finish() {
      state = 'done';
      const sc = Math.max(0, Math.min(J[j].max, Math.floor(game.score())));
      if (game.end) game.end();
      ov.hidden = false;
      card.innerHTML = `<h3>Finished!</h3><div class="gj-big">${sc} <small style="font-size:14px">${esc(J[j].unit)}</small></div><p style="text-align:center">Asking ${J[j].list === 'mom' ? 'Mom' : 'the neighbours'} what they think...</p>`;
      const t = tok && tok.j === j ? tok.tok : null;
      if (t) Grind.send({ t: 'grJobDone', j, tok: t, sc }); else showResult({ j, sc, amt: 0, offline: 1 });
      const timer = setTimeout(() => showResult({ j, sc, amt: 0, offline: 1 }), 5000);
      const off = Grind.on('grJobDone', m => { if (m.j !== j || result) return; clearTimeout(timer); off(); showResult(Object.assign({}, m, { sc })); });
      A.secret(J[j].list === 'mom' ? 'grind.chores' : 'grind.oddjob');
      const done = store.get('jhp_grind_jobsdone', []); if (!done.includes(j)) { done.push(j); store.set('jhp_grind_jobsdone', done); } if (Object.keys(J).every(k => done.includes(k))) A.secret('grind.alljobs');
    }
    function showResult(m) {
      if (result) return; result = m;
      const sc = m.sc | 0, tier = tierOf(j, sc), stars = sc >= J[j].good ? 3 : tier === 1 ? 2 : sc > 0 ? 1 : 0;
      if (stars === 3) A.secret('grind.perfect');
      const txt = noteFor(j, sc); sawNote(j, txt.slice(0, 12));
      const mem = Grind.member;
      card.innerHTML = `<h3>${stars === 3 ? 'BRILLIANT!' : stars === 2 ? 'Not bad at all!' : 'Hmm...'}</h3>
        <div class="gj-big">${sc} <small style="font-size:14px">${esc(J[j].unit)}</small></div>
        <div class="gj-stars">${'&#9733;'.repeat(stars)}<i>${'&#9733;'.repeat(3 - stars)}</i></div>
        ${m.pb ? '<p style="text-align:center;color:#b0002a;font-weight:bold">NEW PERSONAL BEST!</p>' : ''}
        ${mem && !m.offline && !m.bad ? `<div class="gj-earn">${m.cashPence ? `You earned £${(m.cashPence/100).toFixed(2)} pocket money! Exchange it at JackNet Bank.` : (m.n > C.RUNS.length ? 'No pay this time (all of today\'s paid goes are used up), but it counts for the Hall of Fame.' : m.want > 0 ? 'That\'s all the job money the Bank of Mom pays out in one day. Come back tomorrow!' : 'No pocket money for that one. Try again!')}</div>` : ''}
        ${m.bad ? '<p class="gj-guest">Hmm, that round looked a bit odd to the JackNet server, so it didn\'t count.</p>' : ''}
        ${!mem ? `<div class="gj-guest">A JackNet member would have earned up to <b>${esc(RP(C.jobPay(j, sc, 0)))}</b> for that. Joining is FREE! <a href="#" data-jlogon>Join / Log on</a></div>` : ''}
        ${m.offline && mem ? '<p class="gj-guest">Couldn\'t reach JackNet, so no pay for that one. (Is the modem plugged in?)</p>' : ''}
        <div class="gj-mom">${esc(txt)}</div>
        <div class="row"><button class="btn" data-again>Again!</button><button class="btn" data-x>Done</button></div>`;
      card.querySelector('[data-again]').addEventListener('click', title);
      card.querySelector('[data-x]').addEventListener('click', () => w.close());
      if (m.amt && window.Econ && Econ.shower) { /* the gem shower comes with the ecEarn message */ }
      Grind.send({ t: 'grMe' });
      refreshLists();
    }
    card.innerHTML = '<p>Loading the job... (one moment)</p>';
    Grind.load(gameFile(j)).then(() => {
      if (!GAMES[j]) { card.innerHTML = '<p>This job has gone missing. Try again later.</p>'; return; }
      game = GAMES[j](api); try { game.draw(g); } catch (e) {} title();
    }).catch(() => { card.innerHTML = '<p>Could not load the job. Check your modem and try again.</p>'; });
    return w;
  }

  // ================================================================ Mom's Chore List (the fridge)
  let choresW = null;
  function choresHtml() {
    const me = Grind.me, jobs = (me && me.jobs) || {}, mem = Grind.member;
    const list = Object.keys(J).filter(k => J[k].list === 'mom');
    const last = store.get('jhp_grind_lastnote', '');
    return `<span class="grc-mag" style="left:22px;top:6px;background:radial-gradient(circle at 35% 35%,#ffb0b0,#e10600 55%,#700)"></span><span class="grc-mag" style="right:40px;top:10px;background:radial-gradient(circle at 35% 35%,#c0e0ff,#0050e0 55%,#002070);width:24px;height:24px"></span>
      <div class="grc-note"><h3>Jack's Jobs!!</h3>
        ${list.map(k => { const n = jobs[k] | 0, left = Math.max(0, C.RUNS.length - n); return `<div class="grc-li${n ? ' done' : ''}"><span class="grc-tick"></span><span>${esc(J[k].n)}<span class="grc-sub">${mem ? (left ? `Up to ${esc(RP(Math.round(J[k].pay * C.RUNS[n])))} &middot; ${left} paid go${left === 1 ? '' : 'es'} left` : 'All paid goes done today. Ta, love x') : `Pays up to ${esc(RP(J[k].pay))} (members)`}</span></span><button class="btn" data-job="${k}">Do it</button></div>`; }).join('')}
        <div class="grc-li"><span class="grc-tick"></span><span>Homework!!!<span class="grc-sub">Pays: nothing. Do it anyway.</span></span><button class="btn" data-hw>Do it</button></div>
        <div class="grc-ps">P.S. Mrs Pemberton and Mr Grimsdale need a hand too. Their jobs are on the Odd Jobz Board on the JackNet. Mom x</div>
      </div>
      <div class="grc-sticky">${esc(last || 'Pocket money is paid in Rupees, straight into your JackNet Bank. The better you do the job, the more you get. Love Mom x')}</div>
      <div class="grc-foot"><button class="btn" data-oj>The Odd Jobz Board...</button><button class="btn" data-rank>My JackNet Rank</button><span>Paid goes reset at midnight. No rush!</span></div>`;
  }
  const HOME = ['washup', 'tidy', 'car']; // Mom's jobs: not on the PC any more, they're done for real in the 3D house (js/ch-*.js)
  function chores() {
    if (window.Chores && Chores.pcNote) return Chores.pcNote();
    if (choresW && !choresW.closed) { choresW.restore(); return choresW; }
    const b = document.createElement('div'); b.className = 'grc';
    const w = choresW = A.win("Mom's Chore List", b, { w: 450, icon: Grind.ICO.chores, noMax: true });
    const draw = () => {
      b.innerHTML = choresHtml();
      b.querySelectorAll('[data-job]').forEach(x => x.addEventListener('click', () => play(x.dataset.job)));
      b.querySelector('[data-hw]').addEventListener('click', () => { sfx('uhoh'); Desk.msgbox('Homework', 'You open your school bag. It contains: one maths book, half a sandwich, and a note that says "DO YOUR HOMEWORK - Mom".\n\nYou close the bag again. Maybe after one more go on the computer.', 'info'); });
      b.querySelector('[data-oj]').addEventListener('click', () => Grind.go('http://www.oddjobz.jnet/'));
      b.querySelector('[data-rank]').addEventListener('click', () => A.open('grind.rank'));
    };
    draw(); w._draw = draw;
    const off = Grind.on('me', () => { if (w.closed) return off(); draw(); });
    Grind.send({ t: 'grMe' });
    return w;
  }
  function refreshLists() { if (choresW && !choresW.closed && choresW._draw) setTimeout(choresW._draw, 600); if (boardEl && boardEl.isConnected) setTimeout(() => board(boardEl), 600); }
  // remember Mom's latest note for the sticky
  Grind.on('grJobDone', m => { if (J[m.j] && J[m.j].list === 'mom') store.set('jhp_grind_lastnote', noteFor(m.j, m.sc | 0)); });

  // ================================================================ The Odd Jobz Board (www.oddjobz.jnet)
  let boardEl = null, hofData = null;
  Grind.on('grHof', m => { hofData = m; if (boardEl && boardEl.isConnected) board(boardEl, true); });
  function board(el, noFetch) {
    boardEl = el; el.className = 'gr-page ojz';
    const me = Grind.me, jobs = (me && me.jobs) || {}, mem = Grind.member;
    const list = Object.keys(J).filter(k => J[k].list === 'odd' || (J[k].list === 'mom' && !J[k].room && !HOME.includes(k)));
    const wk = hofData && hofData.wk ? hofData.wk.jb : null;
    el.innerHTML = `<div class="ojz-in">
  <div class="ojz-head"><h1>The Odd Jobz Board</h1><p>Neighbours need a hand! Pick a job, do it well, get paid in Rupees. &middot; Pinned up by Jack, Acacia Avenue</p></div>
  ${mem ? '' : (window.Guest ? Guest.webNote('Getting paid for odd jobs') : '')}
  <div class="ojz-cork">${list.map(k => { const n = jobs[k] | 0, left = Math.max(0, C.RUNS.length - n); return `<div class="ojz-card"><h2>${esc(J[k].n.toUpperCase())}</h2><div class="ojz-who">Wanted by: ${esc(J[k].who)}</div><div class="ojz-pic">${PIC[k]}</div>${esc(J[k].blurb)}<div class="ojz-pay">Pays up to ${esc(RP(J[k].pay))} a go</div><div class="ojz-tear"><small>${mem ? (left ? `${left} paid go${left === 1 ? '' : 'es'} left today` : 'Paid goes all done today!') : 'Members get paid'}</small><button class="btn" data-job="${k}">Take the job!</button></div></div>`; }).join('')}</div>
  <div class="ojz-side">
    <div class="ojz-box"><h3>Best workers this week</h3>${wk ? `<table>${list.map(k => `<tr><td>${esc(J[k].n)}</td><td>${wk[k] && wk[k][0] ? `<a href="#" class="plink" data-profile="${esc(wk[k][0].n)}">${esc(wk[k][0].n)}</a> (${wk[k][0].v})` : '<i>nobody yet!</i>'}</td></tr>`).join('')}</table>` : '<p>Asking around...</p>'}<p style="margin:6px 0 0"><a href="http://www.netizenhof.jnet/">See the Hall of Fame &raquo;</a></p></div>
    <div class="ojz-box"><h3>The small print</h3><ul style="margin:0;padding-left:16px;line-height:1.4"><li>Each job pays its first ${C.RUNS.length} goes every day: full pay, then 60%, 40% and 25%.</li><li>Do it badly and you get less. Do it brilliantly and Mrs Pemberton might give you a biscuit.</li><li>Mom's own jobs are on the fridge at home (stand up from the PC and go downstairs).</li><li>Payment straight into your JackNet Bank. No cheques.</li></ul></div>
  </div>
  <div class="ojz-foot">This board is made of real cork (pretend) &middot; <a href="http://www.rupeehunt.jnet/">The Great Rupee Hunt</a> &middot; <a href="http://www.jacknetbank.webcom/">JackNet Bank</a></div>
</div>`;
    el.querySelectorAll('[data-job]').forEach(x => x.addEventListener('click', ev => { ev.preventDefault(); play(x.dataset.job); }));
    if (!noFetch) { Grind.send({ t: 'grHof' }); Grind.send({ t: 'grMe' }); }
  }
  Grind.on('me', () => { if (boardEl && boardEl.isConnected) board(boardEl, true); });

  window.GrindJobs = { play, chores, board, game: (id, f) => { GAMES[id] = f; }, PIC, NOTES };
})();

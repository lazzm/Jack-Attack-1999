/* rm-bits: the close-ups in Jack's room (loaded by rm-room.js the first time one is needed): the posters, the cork
 * board, the desk drawer full of letters and floppies, the keyring pet, the real puzzle cube, the lava lamp, the window,
 * the games mags (with a cheats page for the console games), the CD rack and the treasure tin. Everything is original
 * art (SVG/CSS/canvas). Clues other packs add with Room.addClue('drawer', ...) turn up as extra letters in the drawer. */
(function () {
  'use strict';
  const R = window.Room; if (!R || window.RoomBits) return;
  const CAT = window.RoomCat, _ = R._, pb = _.pb, esc = _.esc;
  const $ = (el, s) => el.querySelector(s);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  (function css() { if (document.getElementById('rmBitsCss')) return; const l = document.createElement('link'); l.id = 'rmBitsCss'; l.rel = 'stylesheet'; l.href = 'css/rm-bits.css' + ((document.querySelector('link[href*="css/rm.css"]') || {}).href || '').replace(/^[^?]*/, ''); document.head.appendChild(l); })();
  const today = () => { try { return Desk.today99(); } catch (e) { const d = new Date(); return { m: d.getMonth() + 1, d: d.getDate(), md: (d.getMonth() + 1) * 100 + d.getDate() }; } };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ================================================================ a close-up: the thing big in the middle, Jack's words under it
  let cur = null;
  function view(cls, html, o) {
    close();
    o = o || {};
    const el = h(`<div class="rm-cstage">${html}</div><div class="rm-cfoot"><p class="rm-csay">${o.say || ''}</p><div class="rm-cbtns">${(o.btns || []).map((b, i) => `<button type="button" class="rm-b" data-i="${i}">${esc(b[0])}</button>`).join('')}<button type="button" class="rm-b rm-cclose">Put it back</button></div></div><button type="button" class="rm-x2" aria-label="Close">&times;</button>`, 'rm-view rm-close rm-c-' + cls);
    pb.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    const v = cur = { el, close, o, timers: [] };
    el.querySelectorAll('.rm-cbtns [data-i]').forEach(b => b.addEventListener('click', () => { _.sfx('click'); (o.btns[+b.dataset.i][1])(v); }));
    $(el, '.rm-cclose').addEventListener('click', close); $(el, '.rm-x2').addEventListener('click', close);
    el.addEventListener('click', ev => { if (ev.target === el) close(); });
    addEventListener('keydown', onKey, true);
    _.emit('open', cls);
    return v;
  }
  function close() {
    if (!cur) return; const v = cur; cur = null;
    v.timers.forEach(t => { clearInterval(t); clearTimeout(t); cancelAnimationFrame(t); });
    if (v.o.onClose) try { v.o.onClose(); } catch (e) {}
    v.el.classList.remove('on'); v.el.classList.add('bye'); setTimeout(() => v.el.remove(), 260);
    removeEventListener('keydown', onKey, true);
    _.emit('close');
  }
  function onKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); close(); } else if (cur && cur.o.keys) cur.o.keys(ev); }
  const say = (v, t) => { const p = $(v.el, '.rm-csay'); if (p) p.innerHTML = t; };
  const searchBtn = (id, label) => [label || 'Look behind it', v => { const hid = CAT.FINDS.filter(f => f.spot === id && _.isOut(f.from) && !_.S.f[f.id]); if (hid.length) { close(); _.foundIt(hid[0]); } else say(v, 'Nothing behind it. Just a bit of Blu-Tack.'); }];

  // ================================================================ the posters
  function shuttle() {
    const late = today().md >= 723; // STS-93 went up on 23 July 1999; before that it's the big mission coming up
    const P = late ? { m: 'STS-93', o: 'COLUMBIA', d: '23 JULY 1999', f: 'The first Space Shuttle mission with a woman in command: Eileen Collins! It carried the Chandra X-ray telescope up to look at black holes.' }
      : { m: 'STS-93', o: 'COLUMBIA', d: 'LAUNCHING JULY 1999!', f: 'Coming soon: Eileen Collins will be the first woman ever to COMMAND a Space Shuttle. It\'s taking the Chandra X-ray telescope up to look at black holes. I\'m counting the days.' };
    return { P, svg: `<svg viewBox="0 0 300 420" class="rm-poster-svg"><defs><linearGradient id="rmS1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030a"/><stop offset=".7" stop-color="#0c1638"/><stop offset="1" stop-color="#1a2a5a"/></linearGradient>
      <radialGradient id="rmS2" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffb23a"/><stop offset=".7" stop-color="#ff5a1a" stop-opacity=".6"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient></defs>
      <rect width="300" height="420" fill="url(#rmS1)"/>${Array.from({ length: 60 }, (_x, i) => `<circle cx="${(i * 97) % 300}" cy="${(i * 53) % 260}" r="${i % 7 ? 0.7 : 1.4}" fill="#fff" opacity="${0.4 + (i % 5) / 8}"/>`).join('')}
      <ellipse cx="150" cy="520" rx="330" ry="170" fill="#1a5ab0"/><ellipse cx="150" cy="520" rx="330" ry="170" fill="none" stroke="#8ad0ff" stroke-width="4" opacity=".7"/>
      <ellipse cx="150" cy="352" rx="70" ry="60" fill="url(#rmS2)"/><path d="M128 300 Q150 380 172 300 Z" fill="#fff6c0" opacity=".9"/>
      <rect x="142" y="120" width="16" height="170" rx="8" fill="#e8742a"/><rect x="126" y="140" width="10" height="160" rx="5" fill="#f4f4f4"/><rect x="164" y="140" width="10" height="160" rx="5" fill="#f4f4f4"/>
      <path d="M126 140 l5 -16 l5 16z M164 140 l5 -16 l5 16z" fill="#f4f4f4"/><path d="M150 96 q10 10 10 40 v120 h-20 v-120 q0 -30 10 -40z" fill="#fafafa"/><path d="M150 96 q8 8 9 22 h-18 q1 -14 9 -22z" fill="#222"/>
      <path d="M140 230 l-22 40 h22z M160 230 l22 40 h-22z" fill="#eaeaea"/><rect x="146" y="150" width="8" height="6" fill="#333"/>
      <text x="150" y="44" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="40" fill="#fff" letter-spacing="2">${P.m}</text>
      <text x="150" y="66" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="13" fill="#9ad0ff" letter-spacing="4">${P.o} &#183; ${P.d}</text>
      <text x="150" y="410" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="9" fill="#cde" letter-spacing="2">REACH FOR THE STARS</text></svg>` };
  }
  const BAND = `<svg viewBox="0 0 300 420" class="rm-poster-svg"><defs><linearGradient id="rmB1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2a8a"/><stop offset=".5" stop-color="#ffb000"/><stop offset="1" stop-color="#00c0d0"/></linearGradient></defs>
    <rect width="300" height="420" fill="url(#rmB1)"/><g fill="none" stroke="#fff" stroke-width="2" opacity=".35">${Array.from({ length: 9 }, (_x, i) => `<circle cx="150" cy="250" r="${30 + i * 26}"/>`).join('')}</g>
    ${[[70, '#1a1a6a'], [125, '#3a0a5a'], [180, '#1a1a6a'], [232, '#3a0a5a']].map(([x, c], i) => `<g transform="translate(${x} ${i % 2 ? 228 : 236})"><path d="M-22 120 q0 -60 22 -66 q22 6 22 66z" fill="${c}"/><circle cx="0" cy="40" r="20" fill="${c}"/><path d="M-20 30 l-6 -22 l12 10 l4 -20 l8 18 l8 -16 l2 20 l12 -8 l-6 22z" fill="${c}"/><rect x="-14" y="34" width="28" height="7" rx="2" fill="#111"/><rect x="-12" y="35" width="10" height="4" fill="#5af"/><rect x="2" y="35" width="10" height="4" fill="#5af"/></g>`).join('')}
    <text x="150" y="62" text-anchor="middle" font-family="Bangers,Impact,sans-serif" font-size="30" fill="#1a1a6a" letter-spacing="3">THE</text>
    <text x="150" y="122" text-anchor="middle" font-family="Bangers,Impact,sans-serif" font-size="68" fill="#fff" stroke="#1a1a6a" stroke-width="4" paint-order="stroke" letter-spacing="2">MODEM</text>
    <text x="150" y="180" text-anchor="middle" font-family="Bangers,Impact,sans-serif" font-size="68" fill="#fff" stroke="#1a1a6a" stroke-width="4" paint-order="stroke" letter-spacing="2">BOYS</text>
    <rect x="0" y="372" width="300" height="48" fill="#1a1a6a"/><text x="150" y="393" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="12" fill="#ffd200" letter-spacing="2">THE DIAL-UP TOUR 99</text>
    <text x="150" y="410" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="9" fill="#fff" letter-spacing="1">NEW SINGLE "BEEP BOP CONNECT" OUT NOW ON CD AND CASSETTE</text></svg>`;
  const FILM = `<svg viewBox="0 0 300 420" class="rm-poster-svg"><rect width="300" height="420" fill="#08040f"/>${Array.from({ length: 40 }, (_x, i) => `<circle cx="${(i * 71) % 300}" cy="${(i * 37) % 420}" r="${i % 5 ? 0.8 : 1.5}" fill="#fff"/>`).join('')}
    <circle cx="150" cy="150" r="96" fill="#ffb23a"/><circle cx="150" cy="150" r="96" fill="none" stroke="#c0601a" stroke-width="10"/>${[[120, 120], [180, 130], [140, 185], [190, 180], [105, 165]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#c01a1a"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#ff6a5a"/>`).join('')}
    <g transform="translate(232 238)"><rect x="-16" y="0" width="32" height="40" rx="6" fill="#bbb"/><circle cx="0" cy="-10" r="14" fill="#ddd"/><rect x="-9" y="-14" width="18" height="6" fill="#2af"/><path d="M16 10 l26 -30" stroke="#5f5" stroke-width="5" stroke-linecap="round"/><rect x="38" y="-38" width="16" height="10" rx="2" fill="#888" transform="rotate(-48 46 -33)"/></g>
    <g transform="translate(64 250)"><path d="M-14 50 v-34 q14 -18 28 0 v34z" fill="#3a2a1a"/><circle cx="0" cy="0" r="14" fill="#f0c8a0"/><path d="M-14 -4 q14 -22 28 0" fill="#7a4a1a"/><path d="M14 22 l40 -40" stroke="#f33" stroke-width="5" stroke-linecap="round"/></g>
    <text x="150" y="318" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="46" fill="#ffd84a" letter-spacing="4">STAR SCRAPS</text>
    <text x="150" y="342" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="13" fill="#ffd84a" letter-spacing="2">EPISODE 0: THE PHANTOM MENU</text>
    <text x="150" y="372" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="10" fill="#bbb">IN A GALAXY FAR, FAR AWAY... THE CHIPS ARE COLD.</text>
    <text x="150" y="404" text-anchor="middle" font-family="'Comic Sans MS',cursive" font-size="10" fill="#8ad">drawn by DAVE (age 11 and three quarters)</text></svg>`;

  // ================================================================ the cork board: a 1999 calendar (today circled), notes, a photo
  function corkHtml() {
    const t = today(), first = new Date(1999, t.m - 1, 1).getDay(), days = new Date(1999, t.m, 0).getDate(), mon = (first + 6) % 7;
    let cells = ''; for (let i = 0; i < mon; i++) cells += '<i></i>';
    for (let d = 1; d <= days; d++) cells += `<i class="${d === t.d ? 'td' : ''}">${d}</i>`;
    const ticket = today().md >= 716 && !_.S.f['tin.ticket'];
    return `<div class="rm-corkbig"><div class="rm-calbig"><b>${MONTHS[t.m - 1].toUpperCase()} 1999</b><div class="rm-calh"><i>M</i><i>T</i><i>W</i><i>T</i><i>F</i><i>S</i><i>S</i></div><div class="rm-cald">${cells}</div><small>Free from the newsagent's</small></div>
      <div class="rm-pin rm-n1">KART RACE @ JACKK'S<br>SATURDAY!!!<br><small>bring the 4th controller</small></div>
      <div class="rm-pin rm-n2">CHEATS<br>Start &gt; Run:<br><b>IDDQD</b> ??<br><small>(Callum says)</small></div>
      <div class="rm-pin rm-n3">TO DO:<br>&#9744; homework<br>&#9745; finish Zip act 2<br>&#9744; tidy room (Mom)<br>&#9744; find my lost games!!</div>
      <div class="rm-photobig"><i></i><small>Me + Dave at the baths</small></div>
      ${ticket ? '<div class="rm-ticket">ADMIT ONE<br><b>SCREEN 2</b></div>' : ''}</div>`;
  }

  // ================================================================ the drawer: letters and floppies (and clues from other packs)
  const LETTERS = [
    { k: 'mom', from: 'Mom', paper: 'note', text: 'JACK.\n\nYour room is a TIP. Hoover under that bed before Saturday or there will be no Daydream for Christmas.\n\nAlso have you seen my change? I keep losing it in your room. If you find it you can keep it (once).\n\nLove Mom x' },
    { k: 'jackk', from: 'JackK', paper: 'lined', text: 'Jack -\n\nMy cousin says if you go on JackNet Explorer and type KEEPOUTDAVE in the address bar there is a secret page about Dave. DON\'T TELL DAVE.\n\nKart race Saturday? I\'ve got four controllers now.\n\n- JackK' },
    { k: 'dave', from: 'Dave', paper: 'lined', text: 'JACK!!!\n\nType PLUGH in Start > Run on your PC. Something happens. I\'m not saying what.\n\nAlso you still have my rumble pak and I want it back. And my Kart Kaos best lap is 0\'38"21 and that is a WORLD RECORD probably.\n\nDAVE' },
    { k: 'callum', from: 'Callum', paper: 'grid', text: 'Callum\'s top tips:\n\n1. PC games are better than consoles. Fact.\n2. On your telly, if a cartridge won\'t work, BLOW ON IT. Works every time (mostly).\n3. Stroke ' + (window.Cast ? Cast.n('cat') : 'the cat') + ' loads. Just do it.\n4. My dad says the Millennium Bug will turn all the computers back to 1900. I am stocking up on batteries.' },
    { k: 'school', from: 'School', paper: 'typed', text: 'Dear Parent/Guardian,\n\nThis is a reminder that HANDHELD GAMES and VIRTUAL PETS are not permitted in lessons. Several virtual pets have "died" during assembly, causing upset.\n\nItems will be confiscated and returned at the end of term.\n\nMr Bramble\nHead of Year' },
    { k: 'chain', from: '???', paper: 'typed', text: 'THIS IS A CHAIN LETTER!!!\n\nCopy this out 10 times and give it to 10 friends by Friday or your Game Lad batteries will run out in the middle of a boss.\n\nA boy in Year 6 didn\'t send it and his Eggbert ran away.\n\n(Jack did not send it. Jack\'s batteries are fine. So far.)' },
  ];
  const FLOPPIES = [
    ['GAMES BACKUP 1/3', '#1a1a6a', 'Disk 1 of 3. Disks 2 and 3 are "somewhere". The backup is useless without them.'],
    ['HOMEWORK', '#c01a1a', 'There is one file on it: HOMEWORK.TXT. It just says "do it later".'],
    ['SECRET!!!', '#1a8a3a', 'In felt tip on the label: "the room is full of lost games. look EVERYWHERE. even the bin."'],
    ['DAVE\'S', '#e0b000', 'This is Dave\'s. It has his level for Blobbit Lob on it. It is just a wall.'],
  ];
  function drawerHtml() {
    const extra = (R._clues && R._clues('drawer')) || [];
    const L = LETTERS.concat(extra.map((c, i) => ({ k: 'x' + i, from: c.title || 'A note', paper: 'note', text: typeof c.text === 'function' ? c.text() : c.text, secret: c.secret })));
    return { L, html: `<div class="rm-drawerbig"><div class="rm-drawin">
      ${L.map((l, i) => `<button type="button" class="rm-letter rm-p-${l.paper}" data-l="${i}" style="--r:${((i * 37) % 13) - 6}deg;--x:${(i % 4) * 23 + 4}%;--y:${Math.floor(i / 4) * 34 + 6}%"><b>${esc(l.from)}</b></button>`).join('')}
      ${FLOPPIES.map((f, i) => `<button type="button" class="rm-floppy" data-f="${i}" style="--c:${f[1]};--x:${8 + i * 22}%;--r:${(i * 23) % 11 - 5}deg"><i>${esc(f[0])}</i></button>`).join('')}
      <i class="rm-pencil"></i><i class="rm-rubber"></i></div></div>` };
  }

  // ================================================================ the keyring pet (Eggbert): real-time hunger, happiness, poo
  const PET = 'jhp_rm_pet';
  function petLoad() { let p = null; try { p = JSON.parse(localStorage.getItem(PET) || 'null'); } catch (e) {} if (!p || !p.born) p = { born: Date.now(), at: Date.now(), food: 3, fun: 3, poo: 0, age: 0, care: 0, name: 'EGGBERT', dead: 0 }; return p; }
  function petSave(p) { try { localStorage.setItem(PET, JSON.stringify(p)); } catch (e) {} }
  function petTick(p) { // a heart goes every 3 hours or so, a poo every 5; it never dies (Mom says), it just sulks
    const now = Date.now(), hrs = (now - p.at) / 3.6e6; if (hrs < 0.05) return p;
    const steps = Math.floor(hrs / 0.5); if (!steps) return p;
    for (let i = 0; i < steps; i++) { if (i % 6 === 5) p.food = Math.max(0, p.food - 1); if (i % 5 === 4) p.fun = Math.max(0, p.fun - 1); if (i % 10 === 9) p.poo = Math.min(3, p.poo + 1); }
    p.at += steps * 0.5 * 3.6e6; p.age = Math.floor((now - p.born) / 864e5);
    return p;
  }

  // ================================================================ the puzzle cube (the real one, with CubeModel from the PC)
  function cubeView() {
    const M = window.CubeModel; if (!M) return view('cube', '<p style="color:#ddd">The cube is stuck.</p>');
    let cubies; const KEY = 'jhp_rm_cube';
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); cubies = s && Array.isArray(s) && s.length === 26 ? s : null; } catch (e) {}
    if (!cubies) { cubies = M.solved(); for (let i = 0; i < 25; i++) M.apply(cubies, { a: i % 3, l: [-1, 1][i * 7 % 2] , d: (i * 5) % 3 ? 1 : -1 }); }
    let rx = -28, ry = -36, moves = 0, scrambled = !M.isSolved(cubies), anim = false;
    const COL = { W: '#f8f8f8', Y: '#ffd800', R: '#d81c1c', O: '#ff7a00', G: '#1a9a3a', B: '#1a4ae0' };
    const v = view('cube', '<div class="rm-cubewrap"><div class="rm-cube3"></div></div><div class="rm-cubepad"></div>', {
      say: 'My actual cube! Drag it to turn it round. The buttons twist a side (U = up, F = front...). I can do one side. Two on a good day.',
      btns: [['Mix it up', () => { for (let i = 0; i < 30; i++) M.apply(cubies, { a: Math.random() * 3 | 0, l: [-1, 1][Math.random() * 2 | 0], d: Math.random() < 0.5 ? 1 : -1 }); scrambled = true; moves = 0; draw(); save(); }]],
      onClose: () => save(),
    });
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cubies)); } catch (e) {} };
    const box = $(v.el, '.rm-cube3'), wrap = $(v.el, '.rm-cubewrap');
    const NV = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], pz: [0, 0, 1], nz: [0, 0, -1] };
    const ROT = { px: 'rotateY(90deg)', nx: 'rotateY(-90deg)', py: 'rotateX(90deg)', ny: 'rotateX(-90deg)', pz: '', nz: 'rotateY(180deg)' };
    const S = 2.2; // em per cubie
    function stickerTf(c, k) { const [x, y, z] = c.p, n = NV[k]; return `translate3d(${(x + n[0] * 0.5) * S}em,${(-y - n[1] * 0.5) * S}em,${(z + n[2] * 0.5) * S}em) ${ROT[k]}`; }
    function draw(turn) {
      box.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      let html = '';
      for (const c of cubies) {
        // the black plastic under the stickers (all six sides of the cubie: cheap enough, 26 x 6)
        for (const k in NV) { const st = c.s[k]; html += `<i class="${st ? 'st' : 'bk'}" style="${st ? `background:${COL[st]};` : ''}transform:${turn && c.p[turn.a] === turn.l ? turn.pre : ''}${stickerTf(c, k)}"></i>`; }
      }
      box.innerHTML = html;
    }
    function twist(a, l, d) {
      if (anim) return; anim = true;
      const axis = ['X', 'Y', 'Z'][a], sgn = a === 1 ? -1 : 1; // (screen y points down)
      const deg = (a === 0 ? -1 : a === 1 ? 1 : -1) * d * 90 * (a === 1 ? -1 : 1) * sgn;
      draw({ a, l, pre: `rotate${axis}(0deg) ` });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        box.querySelectorAll('i').forEach((e, i) => { const c = cubies[Math.floor(i / 6)]; if (c.p[a] === l) { e.style.transition = 'transform .18s ease-out'; e.style.transform = e.style.transform.replace(`rotate${axis}(0deg)`, `rotate${axis}(${deg}deg)`); } });
        setTimeout(() => {
          M.apply(cubies, { a, l, d }); moves++; anim = false; draw(); _.sfx('turn');
          if (scrambled && M.isSolved(cubies)) { scrambled = false; say(v, `<b>SOLVED!</b> In ${moves} twists. I am basically a genius. (Do not mix it up again. Do not.)`); _.secret('rm.cube'); _.sfx('solve'); }
          save();
        }, 200);
      }));
    }
    // buttons: the six sides, each way round
    const pad = $(v.el, '.rm-cubepad');
    const FACES = [['U', 1, 1], ['D', 1, -1], ['L', 0, -1], ['R', 0, 1], ['F', 2, 1], ['B', 2, -1]];
    pad.innerHTML = FACES.map(([n]) => `<button type="button" class="rm-cb2" data-f="${n}" data-d="1">${n}</button><button type="button" class="rm-cb2 p" data-f="${n}" data-d="-1">${n}'</button>`).join('');
    pad.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const F = FACES.find(f => f[0] === b.dataset.f); const d = +b.dataset.d * (F[2] > 0 ? -1 : 1); twist(F[1], F[2], d); }));
    // drag to turn the whole cube
    let drag = null;
    wrap.addEventListener('pointerdown', ev => { drag = { x: ev.clientX, y: ev.clientY, rx, ry }; try { wrap.setPointerCapture(ev.pointerId); } catch (e) {} });
    wrap.addEventListener('pointermove', ev => { if (!drag) return; ry = drag.ry + (ev.clientX - drag.x) * 0.5; rx = Math.max(-80, Math.min(80, drag.rx - (ev.clientY - drag.y) * 0.5)); box.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; });
    wrap.addEventListener('pointerup', () => { drag = null; });
    draw();
    return v;
  }

  // ================================================================ the window: the real sky right now
  function windowView() {
    const hr = new Date().getHours(), night = pb.classList.contains('rm-night'), dusk = pb.classList.contains('rm-dusk') || pb.classList.contains('rm-dawn');
    const v = view('window', '<canvas class="rm-wincv" width="480" height="360"></canvas><i class="rm-winframe"></i>', {
      say: night ? 'It\'s dark out. You can see the stars from here, and the Plough. If you wait you might see a satellite go over (it\'s probably the Space Station!).'
        : dusk ? 'The sun\'s going down. All the jackos over the road are going orange.' : 'Roofs, chimneys and the big tree. Some birds. A cloud shaped like a Daydream (not really).',
      btns: [searchBtn('window', 'Check the windowsill')],
    });
    if (night) _.secret('rm.night');
    const cv = $(v.el, '.rm-wincv'), g = cv.getContext('2d'), W = 480, H = 360;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stars = Array.from({ length: 110 }, () => [rnd() * W, rnd() * H * 0.7, rnd()]);
    const clouds = Array.from({ length: 5 }, () => [rnd() * W, 30 + rnd() * 120, 40 + rnd() * 60]);
    const roofs = []; let x = -20; while (x < W + 40) { const w = 60 + rnd() * 70; roofs.push([x, w, 230 + rnd() * 50, rnd() < 0.5, rnd()]); x += w - 6; }
    let t0 = performance.now(), sat = -1;
    (function frame(n) {
      if (!cur || cur !== v) return;
      const t = (n - t0) / 1000;
      const gr = g.createLinearGradient(0, 0, 0, H);
      if (night) { gr.addColorStop(0, '#02040e'); gr.addColorStop(0.7, '#0c1638'); gr.addColorStop(1, '#1a2448'); }
      else if (dusk) { gr.addColorStop(0, '#2a2a6a'); gr.addColorStop(0.5, '#a04a6a'); gr.addColorStop(0.85, '#ff9a4a'); }
      else { gr.addColorStop(0, '#3a7ae0'); gr.addColorStop(0.7, '#8ab8f0'); gr.addColorStop(1, '#cfe4ff'); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (night) {
        for (const [sx, sy, k] of stars) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + k) + k * 9)); g.fillStyle = '#fff'; g.fillRect(sx, sy, k > 0.85 ? 2 : 1, k > 0.85 ? 2 : 1); }
        g.globalAlpha = 1; g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(380, 70, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = night ? '#060a1c' : '#000'; g.beginPath(); g.arc(370, 64, 20, 0, Math.PI * 2); g.fill();
        if (sat < 0 && t > 6) sat = t;
        if (sat > 0) { const k = (t - sat) / 14; if (k < 1) { g.fillStyle = '#fff'; g.fillRect(-10 + k * (W + 20), 160 - k * 120, 2, 2); } }
      } else {
        g.fillStyle = dusk ? '#ffd27a' : '#fffbe0'; g.beginPath(); g.arc(dusk ? 120 : 380, dusk ? 230 : 70, 26, 0, Math.PI * 2); g.fill();
        for (const c of clouds) { const cx = (c[0] + t * 6) % (W + 120) - 60; g.fillStyle = dusk ? 'rgba(255,190,170,.8)' : 'rgba(255,255,255,.9)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + i * c[2] * 0.3, c[1] - (i % 2) * 10, c[2] * 0.3, 0, Math.PI * 2); g.fill(); } }
        if (!dusk) for (let i = 0; i < 3; i++) { const bx = (t * 30 + i * 60) % (W + 80) - 40, by = 120 + i * 14 + Math.sin(t * 2 + i) * 6; g.strokeStyle = '#223'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx - 5, by - 3); g.lineTo(bx, by); g.lineTo(bx + 5, by - 3); g.stroke(); }
      }
      // the roofs over the road (lights on at night)
      for (const [rx, rw, ry, chim, k] of roofs) {
        g.fillStyle = night ? '#070a12' : dusk ? '#2a1c26' : '#5a4a52'; g.beginPath(); g.moveTo(rx, H); g.lineTo(rx, ry); g.lineTo(rx + rw / 2, ry - 34); g.lineTo(rx + rw, ry); g.lineTo(rx + rw, H); g.fill();
        if (chim) { g.fillRect(rx + rw * 0.7, ry - 40, 10, 24); }
        g.fillStyle = night ? (k > 0.4 ? '#ffd27a' : '#141824') : dusk ? '#ffb05a' : '#9ab8d8';
        g.fillRect(rx + rw * 0.25, ry + 26, 14, 18); g.fillRect(rx + rw * 0.6, ry + 26, 14, 18);
      }
      // the big tree
      g.fillStyle = night ? '#040608' : dusk ? '#1a1218' : '#2a4a22';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(60 + Math.sin(i) * 30, 180 + i * 14 + Math.sin(t + i) * 1.5, 50 - i * 3, 0, Math.PI * 2); g.fill(); }
      v.timers.push(requestAnimationFrame(frame));
    })(t0);
    return v;
  }

  // ================================================================ the lava lamp (watch it for a minute...)
  function lavaView() {
    const v = view('lava', '<div class="rm-lavabig"><i class="rm-lcap"></i><div class="rm-lglass"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i></div><i class="rm-lbase"></i></div><b class="rm-lavat">0:00</b>', {
      say: 'My lava lamp. The blobs go up, the blobs come down. It is very relaxing. Mom says it is hypnotising me.',
    });
    const t0 = Date.now(), lbl = $(v.el, '.rm-lavat');
    v.timers.push(setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000); lbl.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      if (s >= 60 && !v.done) { v.done = true; _.secret('rm.lava'); say(v, 'A whole minute. I feel very groovy now. Far out.'); }
    }, 250));
    return v;
  }

  // ================================================================ the games mags (the cheats corner!)
  function magsView() {
    return view('mags', `<div class="rm-magbig"><div class="rm-magcover"><b>JACK ATTACK!</b><small>THE MAG FOR GAMERS WHO CAN'T SIT STILL</small><i class="rm-mcart"></i><em>EXCLUSIVE!<br>50 CHEATS<br>INSIDE!</em></div>
      <div class="rm-magpage"><h4>CHEATS CORNER</h4>
      <p><b>BLOCKOLOGY</b> (Game Lad): on the title screen hold <b>SELECT</b> and press <b>START</b> to play the secret <b>B-TYPE</b>: 25 lines on a messy well.</p>
      <p><b>GOLDENBALLS</b>: on the dossier screen press <b>L, L, R, R, L, R</b> (U and E on a keyboard) for <b>PAINTBALL MODE</b>. Splat!</p>
      <p><b>ANY CARTRIDGE</b>: not working? Take it out and BLOW on it. This is science.</p>
      <p><b>KART KAOS 64</b>: there's a short cut on Biscuit Circuit! Look for a gap in the hedge. (Dave says he found it first. Dave says a lot of things.)</p>
      <p><b>POCKET CRITTERS</b>: talk to everybody. Twice. Mom always knows something useful.</p>
      <p class="rm-magmore">Send your cheats to the usual address! Best cheat wins a JACK ATTACK! mug.</p></div></div>`, {
      say: 'My games mags. The free demo discs are coasters now. The cheats pages have fallen out from being read so much.',
      btns: [searchBtn('mags', 'Flick through the pile')],
    });
  }

  // ================================================================ the CD rack: CDs you can play on the little stereo
  const CDS = [
    ['THE MODEM BOYS', 'Dial-Up Dreams', '#ff2a8a', { bpm: 128, lead: [72, 0, 76, 0, 79, -1, 76, 0, 74, 0, 72, 0, 71, -1, 67, 0, 72, 0, 76, 0, 79, -1, 81, 0, 79, -1, 76, -1, 72, -1, -1, 0], bass: [48, 0, 48, 0, 53, 0, 53, 0, 55, 0, 55, 0, 48, 0, 48, 0] }],
    ['THE PEPPER POTS', 'Spice Rack', '#ffb000', { bpm: 112, lead: [76, -1, 74, 72, 74, -1, 76, 0, 79, -1, 76, -1, 74, -1, -1, 0, 72, -1, 74, 76, 74, -1, 72, 0, 69, -1, 72, -1, 74, -1, -1, 0], bass: [45, 0, 45, 0, 41, 0, 41, 0, 43, 0, 43, 0, 48, 0, 48, 0] }],
    ['DJ FLOPPY DISK', 'Bleep Machine', '#00c0d0', { bpm: 140, lead: [60, 72, 60, 72, 63, 75, 63, 75, 65, 77, 65, 77, 63, 75, 63, 75], bass: [36, 0, 36, 36, 0, 36, 39, 0, 41, 0, 41, 41, 0, 39, 0, 36], drums: 'o.x.o.x.o.x.o.xx' }],
    ['FREE CD-ROM', 'Internet in 10 Minutes!', '#9a9ab8', null],
    ['FREE CD-ROM', 'Encyclopedia Demo (no sound)', '#c0c0d0', null],
  ];
  function rackView() {
    let playing = -1;
    const v = view('rack', `<div class="rm-rackbig">${CDS.map((c, i) => `<button type="button" class="rm-cdcase" data-c="${i}" style="--c:${c[2]}"><b>${esc(c[0])}</b><small>${esc(c[1])}</small></button>`).join('')}</div><div class="rm-stereo"><i class="rm-spk"></i><b class="rm-slcd">-- NO DISC --</b><i class="rm-spk"></i></div>`, {
      say: 'My CD rack. Click a CD to put it on the stereo. The free CD-ROMs off the front of magazines don\'t really play music. Obviously.',
      onClose: () => { try { if (window.RoomTV) RoomTV.music(null); } catch (e) {} clearInterval(beat); },
    });
    let beat = 0;
    v.el.querySelectorAll('.rm-cdcase').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.c, c = CDS[i]; v.el.querySelectorAll('.rm-cdcase').forEach(x => x.classList.toggle('on', x === b));
      const lcd = $(v.el, '.rm-slcd'); clearInterval(beat);
      if (!c[3]) { lcd.textContent = 'ERROR: DATA DISC'; say(v, 'That one is a CD-ROM. The stereo just goes "tk tk tk".'); try { RoomTV && RoomTV.music(null); } catch (e) {} return; }
      lcd.textContent = '♪ ' + c[1].toUpperCase();
      const go = () => { if (window.RoomTV) RoomTV.music(Object.assign({ wave: 'square', vol: 0.05 }, c[3])); };
      if (!window.Sound || !Sound.on) say(v, 'It\'s playing! (Turn the sound on to hear it: the speaker button on the telly, or SFX in the PC.)'); else say(v, '"' + esc(c[1]) + '" by ' + esc(c[0]) + '. Turn it UP.');
      if (window.RoomTV) go(); else (window.Apps ? Apps.load('js/rm-tv.js') : Promise.reject()).then(go, () => {});
      playing = i; let k = 0; beat = setInterval(() => { v.el.querySelectorAll('.rm-spk').forEach(s => s.classList.toggle('thump', (k++ % 2) === 0)); }, 60000 / (c[3].bpm || 120));
    }));
    return v;
  }

  // ================================================================ the treasure tin: everything found in the room
  const ICON = { cart: '<i class="rm-ti-cart"></i>', disc: '<i class="rm-ti-disc"></i>', marble: '<i class="rm-ti-marble"></i>', tazo: '<i class="rm-ti-tazo"></i>', badge: '<i class="rm-ti-badge"></i>', holo: '<i class="rm-ti-holo"></i>',
    key: '<i class="rm-ti-key"></i>', cheat: '<i class="rm-ti-cheat"></i>', ticket: '<i class="rm-ti-ticket"></i>', conker: '<i class="rm-ti-conker"></i>' };
  const WHERE = { drawer: 'near the desk', wardrobe: 'by the telly', bed: 'by the window', bin: 'down low', beanbag: 'by the telly', tvback: 'by the telly', dcbox: 'by the telly', post: 'it hasn\'t come yet', rug: 'down low', shelf: 'up high', posterfilm: 'on a wall', cat: 'by the window', mags: 'on the floor', cork: 'on a wall', window: 'by the window' };
  function tinView() {
    const F = CAT.FINDS.filter(f => _.isOut(f.from)), got = F.filter(f => _.S.f[f.id]);
    const icon = f => f.id.startsWith('cart.') ? (CAT.CONSOLES[f.id.split('.')[1]].media === 'disc' ? ICON.disc : ICON.cart) : (ICON[f.id.split('.')[1]] || ICON.badge);
    const coin = _.coin;
    const v = view('tin', `<div class="rm-tinbig"><div class="rm-tinlid"><b>JACK'S TREASURE TIN</b><small>KEEP OUT. THIS MEANS YOU, DAVE.</small></div>
      <div class="rm-tingrid">${F.map(f => _.S.f[f.id] ? `<div class="rm-ti got">${icon(f)}<b>${esc(f.n)}</b><small>${esc(f.d)}</small></div>` : `<div class="rm-ti">${'<i class="rm-ti-q">?</i>'}<b>Still lost</b><small>Somewhere ${esc(WHERE[f.spot] || 'in my room')}...</small></div>`).join('')}</div>
      <div class="rm-tinfoot"><b>${got.length} of ${F.length}</b> found. ${coin.member ? (coin.got ? 'You found Mom\'s lost change today. Back tomorrow!' : `Mom has lost some change in here today. Clue: <b>${esc(coin.clue || 'somewhere')}</b>`) : 'Log on to JackNet (on the PC) to hunt for Mom\'s lost change every day and earn Rupees for what you find.'}</div></div>`, { say: '' });
    $(v.el, '.rm-cfoot').hidden = true;
    v.el.addEventListener('click', ev => { if (ev.target.closest('.rm-tinbig')) return; close(); });
    return v;
  }

  // ================================================================ the keyring pet
  function petView() {
    let p = petTick(petLoad()); petSave(p);
    const v = view('vpet', `<div class="rm-eggbig"><i class="rm-eggchain"></i><div class="rm-egg"><canvas class="rm-eggcv" width="32" height="24"></canvas><b class="rm-eggname">EGGBERT</b><span class="rm-eggbtns"><button type="button" data-a="feed">A</button><button type="button" data-a="play">B</button><button type="button" data-a="clean">C</button></span></div></div>`, {
      say: 'Eggbert, my keyring pet. A = feed, B = play, C = clean up after him. He gets hungry every few hours. He is ' + p.age + ' days old.',
    });
    const cv = $(v.el, '.rm-eggcv'), g = cv.getContext('2d');
    let act = '', actT = 0;
    v.el.querySelectorAll('.rm-eggbtns button').forEach(b => b.addEventListener('click', () => {
      p = petTick(p); const a = b.dataset.a; act = a; actT = 1.2; _.sfx('click');
      if (a === 'feed') { if (p.food >= 4) say(v, 'He doesn\'t want any more. He is FULL.'); else { p.food++; p.care++; say(v, 'Nom nom. ' + '♥'.repeat(p.food) + '♡'.repeat(4 - p.food)); } }
      if (a === 'play') { if (p.fun >= 4) say(v, 'He\'s had enough fun. He wants a nap.'); else { p.fun++; p.care++; say(v, 'He won rock-paper-scissors! Happy: ' + '♥'.repeat(p.fun) + '♡'.repeat(4 - p.fun)); } }
      if (a === 'clean') { if (!p.poo) say(v, 'Nothing to clean up. Phew.'); else { p.poo = 0; p.care++; say(v, 'All clean! (Do not ask.)'); } }
      if (p.food >= 4 && p.fun >= 4 && !p.poo) _.secret('rm.pet');
      petSave(p);
    }));
    let t = 0;
    v.timers.push(setInterval(() => {
      t++; if (actT > 0) actT -= 0.25;
      g.fillStyle = '#a8b890'; g.fillRect(0, 0, 32, 24); g.fillStyle = '#2a3020';
      const bob = t % 2, sad = p.food < 2 || p.fun < 2, x = 10 + (t % 8 < 4 ? t % 4 : 4 - t % 4);
      // Eggbert: an egg with feet
      const px = (a, b) => g.fillRect(a, b, 1, 1);
      for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 8; xx++) { const dx = xx - 3.5, dy = (yy - 5) / 1.25; if (dx * dx + dy * dy < 16 && dx * dx + dy * dy > 9) px(x + xx, 5 + yy + bob); }
      px(x + 2, 9 + bob); px(x + 5, 9 + bob); // eyes
      if (sad) { px(x + 3, 13 + bob); px(x + 4, 13 + bob); px(x + 2, 14 + bob); px(x + 5, 14 + bob); } else { px(x + 2, 12 + bob); px(x + 5, 12 + bob); px(x + 3, 13 + bob); px(x + 4, 13 + bob); }
      px(x + 2, 15); px(x + 5, 15);
      for (let i = 0; i < p.poo; i++) { px(26 + i % 2, 18 - i * 3); px(25, 19 - i * 3); px(27, 19 - i * 3); px(26, 19 - i * 3); }
      if (actT > 0 && act === 'feed') { g.fillRect(x - 5, 10, 3, 3); }
      if (actT > 0 && act === 'play') { g.fillRect(x + 10, 4 + (t % 2) * 2, 2, 2); }
      if (actT > 0 && act === 'clean') { for (let i = 0; i < 24; i += 3) px(22 + (t % 3), i); }
      // hearts along the top
      for (let i = 0; i < 4; i++) { if (i < p.food) { px(1 + i * 4, 1); px(3 + i * 4, 1); px(1 + i * 4, 2); px(2 + i * 4, 2); px(3 + i * 4, 2); px(2 + i * 4, 3); } }
    }, 250));
    return v;
  }

  // ================================================================ which close-up is which
  const OPEN = {
    cork() { return view('cork', corkHtml(), { say: 'My cork board. Today is circled. The cheat note is from Callum, who is never wrong (he says).', btns: [searchBtn('cork', 'Check behind the pins')] }); },
    drawer() {
      const D = drawerHtml();
      const v = view('drawer', D.html, { say: 'My desk drawer. Letters, floppy disks, a pencil and a rubber shaped like a car. Click something to look at it.', btns: [searchBtn('drawer', 'Dig right to the back')] });
      v.el.querySelectorAll('.rm-letter').forEach(b => b.addEventListener('click', () => {
        const l = D.L[+b.dataset.l]; _.sfx('click');
        const pop = h(`<div class="rm-readl rm-p-${l.paper}"><pre>${esc(l.text)}</pre><button type="button" class="rm-b">Fold it back up</button></div>`, 'rm-readwrap');
        v.el.appendChild(pop); pop.querySelector('button').addEventListener('click', () => pop.remove()); pop.addEventListener('click', ev => { if (ev.target === pop) pop.remove(); });
        if (l.secret) _.secret(l.secret);
      }));
      v.el.querySelectorAll('.rm-floppy').forEach(b => b.addEventListener('click', () => { const f = FLOPPIES[+b.dataset.f]; say(v, `<b>${esc(f[0])}</b>: ${esc(f[2])}`); _.sfx('click'); }));
      return v;
    },
    vpet: petView, cube: cubeView, window: windowView, lava: lavaView, mags: magsView, rack: rackView, tin: tinView,
  };
  window.RoomBits = {
    open(id) {
      if (id.startsWith('poster')) { close(); return window.House?.SPOTS[id]?.act?.(); }
      const f = OPEN[id]; if (f) return f();
    },
    close, has: id => id.startsWith('poster') ? !!window.House?.SPOTS[id]?.act : !!OPEN[id],
    get open_() { return !!cur; }
  };
})();

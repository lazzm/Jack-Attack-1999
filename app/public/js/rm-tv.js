/* rm-tv: THE CONSOLES in Jack's room (loaded by rm-room.js the first time a console is clicked). Click a console and the
 * camera "zooms" into the telly (or the Game Boy): pick a cartridge or disc off the shelf, it goes in, the console boots
 * with its own start-up screen and jingle (all original: no real logos or sounds), and you play. Every game is a lazy
 * file (js/rm-g-*.js) that registers itself with RoomTV.game(). Scores go to the server (mods/rm.js: a token per go,
 * checked for time and rate), which pays capped Rupees and keeps a top-ten table per game.
 *
 * WRITING A GAME (js/rm-g-<name>.js):
 *   RoomTV.game('n64.kart', {
 *     res: [320, 240],         optional: the canvas size (default: the console's own: gb 160x144, md 320x224, n64/ps 320x240, dc 640x480)
 *     three: true,             a 3D game: the main canvas is WebGL, K.three() gives the three.js kit (js/rm-3d.js)
 *     stick: true,             the touch pad shows an analog stick instead of a D-pad
 *     buttons: ['a', 'b'],     the buttons it uses (the touch pad shows only these, plus START)
 *     help: 'Steer: arrows. Accelerate: Z. Item: X. Pause: Enter.',   the controls line under the telly (keyboard words)
 *     make(K) { ...; return { update(dt) {}, draw() {}, end() {} } },  a fresh go: called again for "Play again"
 *   });
 *   K: id, con, def, W, H, cv (main canvas), g (its 2D context; null for 3D), hud (a 2D context layered on top: clear it yourself)
 *      three() -> the 3D kit (see rm-3d.js), t (seconds since make), frame
 *      held(b) pressed(b) (this step only) any() stick() -> {x, y} (-1..1; arrows count too), label(b) ('✕' on a PlayStation)
 *        buttons: up down left right a b c x y l r start select. Keys: arrows/WASD, Z/Space=a, X=b, C=c and x, V=y, Q=l, E=r,
 *        Enter=start, Shift=select. Gamepads work too.
 *      over(score, { title, text, keep }) the go is over (the runtime shows the score card, sends the score, pays Rupees);
 *        keep: true sends the score but carries on playing (for long games: call it at milestones)
 *      best (your best so far on this game), save(state) load() clear() (js/gamesave.js key rm.<id>), secret('rm.x.y')
 *      sfx.tone(freq, dur, type, vol, when, slideTo) sfx.noise(dur, vol, filterHz, when, type, toHz) sfx.seq([[midi, beats]...], {bpm, wave, vol})
 *      music({ bpm, wave, lead:[midi|0 rest|-1 hold, ...], bass:[...] , vol }) / music(null)   (16th-note steps)
 *      font.draw(g, s, x, y, col, k, shadow) font.center(g, s, cx, y, col, k, shadow) font.width(s, k)   (a 5x7 pixel font)
 *      pal (Game Boy: 4 shades lightest first, picked at the boot screen), rnd(seed) -> () => 0..1
 *   update(dt) runs at a steady 60 a second; draw() once a frame. Sound only plays when the visitor has SFX on (there's a
 *   speaker button on the telly). Never use real names, logos or music: parodies only. */
(function () {
  'use strict';
  const R = window.Room; if (!R || window.RoomTV) return;
  const CAT = window.RoomCat, _ = R._, pb = _.pb, esc = _.esc;
  const $ = (el, s) => el.querySelector(s);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const touchy = () => !!(window.matchMedia && (matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches));
  const load = src => (window.Apps && Apps.load) ? Apps.load(src) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  (function css() { if (document.getElementById('rmTvCss')) return; const l = document.createElement('link'); l.id = 'rmTvCss'; l.rel = 'stylesheet'; l.href = 'css/rm-tv.css' + ((document.querySelector('link[href*="css/rm.css"]') || {}).href || '').replace(/^[^?]*/, ''); document.head.appendChild(l); })();

  // ================================================================ the consoles
  const LOOK = {
    n64: { res: [320, 240], smooth: true, keys: { a: 'A', b: 'B', c: 'Z', l: 'L', r: 'R', start: 'START' }, cols: { a: '#2a5ad0', b: '#1a9a3a', c: '#888', start: '#c41a1a' } },
    ps: { res: [320, 240], smooth: false, keys: { a: '✕', b: '○', x: '□', y: '△', l: 'L1', r: 'R1', start: 'START', select: 'SELECT' }, cols: { a: '#7a9af0', b: '#f07a7a', x: '#f08ad8', y: '#4ad0a8' } },
    gb: { res: [160, 144], smooth: false, keys: { a: 'A', b: 'B', start: 'START', select: 'SELECT' }, cols: { a: '#b01a5a', b: '#b01a5a' } },
    md: { res: [320, 224], smooth: false, keys: { a: 'A', b: 'B', c: 'C', start: 'START' }, cols: { a: '#333', b: '#333', c: '#333' } },
    dc: { res: [640, 480], smooth: true, keys: { a: 'A', b: 'B', x: 'X', y: 'Y', l: 'L', r: 'R', start: 'START' }, cols: { a: '#e03a3a', b: '#3a6ae0', x: '#f0c020', y: '#2aa04a' } },
    sn: { res: [256, 224], smooth: false, keys: { a: 'A', b: 'B', x: 'X', y: 'Y', l: 'L', r: 'R', start: 'START', select: 'SELECT' }, cols: { a: '#d42a2a', b: '#e8c21a', x: '#2a52d0', y: '#2a9a4a' } },
  };
  // Game Boy Color palettes (hold a direction at the boot screen to pick one, like the real thing)
  const GBPAL = { none: ['#e8f8d0', '#88c070', '#346856', '#081820'], up: ['#fff0f0', '#f0a090', '#904850', '#300818'], down: ['#f8f8a8', '#e0a050', '#a05030', '#401808'],
    left: ['#f0f8ff', '#80b8f8', '#3058a8', '#081028'], right: ['#f8f8f8', '#a8a8a8', '#585858', '#000000'] };

  // ================================================================ the 5x7 pixel font (the same one as pcgames-engine.js)
  const B32 = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  const FONT = {
    A: 'EHHVHHH', B: 'UHHUHHU', C: 'EHGGGHE', D: 'UHHHHHU', E: 'VGGUGGV', F: 'VGGUGGG', G: 'EHGNHHF', H: 'HHHVHHH', I: 'E44444E', J: '72222IC', K: 'HIKOKIH', L: 'GGGGGGV', M: 'HRLLHHH',
    N: 'HHPLJHH', O: 'EHHHHHE', P: 'UHHUGGG', Q: 'EHHHLID', R: 'UHHUKIH', S: 'FGGE11U', T: 'V444444', U: 'HHHHHHE', V: 'HHHHHA4', W: 'HHHLLLA', X: 'HHA4AHH', Y: 'HHA4444', Z: 'V12348V',
    0: 'EHJLPHE', 1: '4C4444E', 2: 'EH1248V', 3: 'V2421HE', 4: '26AIV22', 5: 'VGU11HE', 6: '68GUHHE', 7: 'V124888', 8: 'EHHEHHE', 9: 'EHHF12C',
    ' ': '0000000', '!': '4444404', '?': 'EH12404', '.': '00000CC', ',': '0000C48', ':': '0CC0CC0', ';': '0CC0C48', '-': '000E000', '+': '044V440', '_': '000000V',
    "'": '4480000', '"': 'AA00000', '/': '11248GG', '\\': 'GG84211', '(': '2488842', ')': '8422248', '[': 'E88888E', ']': 'E22222E', '=': '00V0V00',
    '*': '04LEL40', '#': 'AAVAVAA', '%': 'OP248J3', '&': 'CIK8LID', '<': '248G842', '>': '8421248', '@': 'EH1DLLE', '$': '4FKE5U4', '£': '698S88V', '~': '008L200', '^': '4AH0000', '|': '4444444',
    '✕': '0HA4AH0', '○': '0EHHHE0', '□': '0VHHHV0', '△': '04AAHV0', '♥': '0ALVVE4', '→': '042V240', '←': '048V840', '↑': '4EL4444', '↓': '4444LE4',
  };
  const GLYPH = {}; for (const k of Object.keys(FONT)) GLYPH[k] = [...FONT[k]].slice(0, 7).map(ch => B32.indexOf(ch));
  const atlases = {};
  function atlas(color) {
    if (atlases[color]) return atlases[color];
    const keys = Object.keys(GLYPH), cv = document.createElement('canvas'); cv.width = keys.length * 6; cv.height = 8;
    const x = cv.getContext('2d'); x.fillStyle = color; const idx = {};
    keys.forEach((k, n) => { idx[k] = n; GLYPH[k].forEach((row, y) => { for (let b = 0; b < 5; b++) if (row & (16 >> b)) x.fillRect(n * 6 + b, y, 1, 1); }); });
    return atlases[color] = { cv, idx };
  }
  const font = {
    w: 6, h: 8,
    width: (s, k) => String(s).length * 6 * (k || 1),
    draw(g, s, x, y, color, k, shadow) {
      k = k || 1; s = String(s).toUpperCase(); x = Math.round(x); y = Math.round(y);
      if (shadow) font.draw(g, s, x + k, y + k, typeof shadow === 'string' ? shadow : '#000', k);
      const A = atlas(color || '#fff');
      for (let i = 0; i < s.length; i++) { const n = A.idx[s[i]]; if (n == null || s[i] === ' ') continue; g.drawImage(A.cv, n * 6, 0, 6, 8, x + i * 6 * k, y, 6 * k, 8 * k); }
    },
    center(g, s, cx, y, color, k, shadow) { font.draw(g, s, cx - font.width(s, k) / 2 + (k || 1) / 2, y, color, k, shadow); },
  };

  // ================================================================ sound (only when the visitor has SFX on: there's a speaker button)
  let AC = null, OUT = null, NB = null;
  function ac() {
    if (!window.Sound || !Sound.on) return null;
    if (!AC) { try { AC = Sound.unlock && Sound.unlock(); } catch (e) { AC = null; } if (!AC) return null; OUT = AC.createGain(); OUT.gain.value = 0.5; OUT.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const sfx = {
    tone(f, d, type, vol, when, to) {
      const c = ac(); if (!c || !(f > 0)) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + d);
      g.gain.setValueAtTime(vol == null ? 0.12 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g); g.connect(OUT); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d, vol, f, when, type, to) {
      const c = ac(); if (!c) return; const t = c.currentTime + (when || 0);
      if (!NB) { NB = c.createBuffer(1, c.sampleRate, c.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
      const s = c.createBufferSource(); s.buffer = NB; const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f || 2000, t); if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
      const g = c.createGain(); g.gain.setValueAtTime(vol == null ? 0.15 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      s.connect(fl); fl.connect(g); g.connect(OUT); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03);
    },
    seq(notes, o) { o = o || {}; const b = 60 / (o.bpm || 140); let w = o.when || 0; for (const [m, beats] of notes) { if (m > 0) sfx.tone(mtof(m), b * beats * 0.95, o.wave || 'square', o.vol == null ? 0.1 : o.vol, w); w += b * beats; } },
  };
  // a looping tune: 16th-note steps, lead and bass in MIDI numbers (0 = rest, -1 = hold)
  const mus = { song: null, step: 0, next: 0, timer: 0 };
  function music(song) {
    clearInterval(mus.timer); mus.song = song || null; if (!song) return;
    mus.step = 0; mus.next = 0;
    mus.timer = setInterval(() => {
      const c = ac(); if (!c || !mus.song) return;
      const S = mus.song, st = 60 / (S.bpm || 120) / 4, n = Math.max((S.lead || []).length, (S.bass || []).length) || 16;
      if (mus.next < c.currentTime) mus.next = c.currentTime + 0.05;
      while (mus.next < c.currentTime + 0.2) {
        const i = mus.step % n;
        const play = (arr, wave, vol, oct) => {
          if (!arr || !arr.length) return; const m = arr[i % arr.length]; if (!(m > 0)) return;
          let len = 1; while (arr[(i + len) % arr.length] === -1 && len < arr.length) len++;
          sfx.tone(mtof(m + (oct || 0)), st * len * 0.92, wave, vol, mus.next - c.currentTime);
        };
        play(S.lead, S.wave || 'square', S.vol == null ? 0.06 : S.vol);
        play(S.bass, S.bassWave || 'triangle', (S.vol == null ? 0.06 : S.vol) * 1.4);
        if (S.drums) { const d = S.drums[i % S.drums.length]; if (d === 'x') sfx.noise(0.06, 0.05, 6000, mus.next - c.currentTime, 'highpass'); if (d === 'o') sfx.tone(120, 0.12, 'sine', 0.15, mus.next - c.currentTime, 40); }
        mus.step++; mus.next += st;
      }
    }, 50);
  }

  // ================================================================ input: keyboard, the touch pad, gamepads
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    z: 'a', Z: 'a', ' ': 'a', j: 'a', J: 'a', x: 'b', X: 'b', k: 'b', K: 'b', c: 'c', C: 'c', l: 'c', L: 'c', v: 'y', V: 'y', i: 'y', I: 'y', q: 'l', Q: 'l', e: 'r', E: 'r', Enter: 'start', Shift: 'select' };
  const held = {}, padHeld = {}, gpHeld = {}; let pend = {}, now = {}; const stickT = { x: 0, y: 0, on: false };
  function press(b, down) {
    if (down) { if (!isHeld(b)) pend[b] = true; } // (an edge: only when it wasn't already held)
  }
  const isHeld = b => !!(held[b] || padHeld[b] || gpHeld[b]);
  // 'c' doubles as 'x' (the PlayStation's square, the Dreamcast's X)
  const alias = b => b === 'x' ? ['x', 'c'] : b === 'c' ? ['c', 'x'] : [b];
  function stick() {
    if (stickT.on) return { x: stickT.x, y: stickT.y };
    const gp = gpad(); if (gp && (Math.abs(gp.axes[0] || 0) > 0.15 || Math.abs(gp.axes[1] || 0) > 0.15)) return { x: clamp(gp.axes[0] || 0, -1, 1), y: clamp(gp.axes[1] || 0, -1, 1) };
    return { x: (isHeld('right') ? 1 : 0) - (isHeld('left') ? 1 : 0), y: (isHeld('down') ? 1 : 0) - (isHeld('up') ? 1 : 0) };
  }
  function gpad() { try { const l = navigator.getGamepads ? navigator.getGamepads() : []; for (const g of l) if (g && g.connected) return g; } catch (e) {} return null; }
  const GPB = { 0: 'a', 1: 'b', 2: 'c', 3: 'y', 4: 'l', 5: 'r', 8: 'select', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  function pollGamepad() {
    const g = gpad(); if (!g) return;
    for (const i in GPB) { const b = GPB[i], on = !!(g.buttons[i] && g.buttons[i].pressed); if (on && !gpHeld[b]) pend[b] = true; gpHeld[b] = on; }
  }

  // ================================================================ the room telly (the Game Boy still gets a close-up)
  let V = null; // the open view
  const conOut = c => _.isOut(CAT.CONSOLES[c].from);
  function screenLines(g, text, x, y, width, color, scale) {
    const words = String(text || '').split(/\s+/), lines = []; let line = '';
    for (const word of words) { if (line && font.width(line + ' ' + word, scale) > width) { lines.push(line); line = word; } else line += (line ? ' ' : '') + word; }
    if (line) lines.push(line);
    lines.forEach((s, i) => font.center(g, s, x, y + i * 10 * scale, color, scale));
    return lines.length * 10 * scale;
  }
  function resultFrame(g, w, h) {
    if (!V.result) return;
    const r = V.result, s = Math.max(1, Math.floor(w / 320)), cx = w / 2;
    g.fillStyle = 'rgba(4,8,22,.94)'; g.fillRect(w * .04, h * .04, w * .92, h * .92);
    g.strokeStyle = '#d8d5bf'; g.lineWidth = s; g.strokeRect(w * .04, h * .04, w * .92, h * .92);
    let y = h * .09;
    y += screenLines(g, r.title, cx, y, w * .84, '#ffd85e', s) + 6 * s;
    y += screenLines(g, r.text, cx, y, w * .84, '#f0eee3', s) + 5 * s;
    font.center(g, 'SCORE ' + r.sc, cx, y, '#8bf3b8', s); y += 15 * s;
    font.center(g, 'BEST ' + Math.max(localBest(V.gid), srv.best[V.gid] | 0), cx, y, '#ffd85e', s); y += 18 * s;
    const leaders = (srv.hi[V.gid] || []).concat(mates(V.gid)).sort((a, b) => b.s - a.s).slice(0, 3);
    for (const [i, row] of leaders.entries()) { font.draw(g, (i + 1) + '. ' + row.n.slice(0, 18), w * .12, y, '#ddd', s); font.draw(g, row.s, w * .7, y, '#ddd', s); y += 12 * s; }
    const status = $(V.el, '.rm-srv');
    if (status && y < h - 50 * s) screenLines(g, status.textContent, cx, y + 4 * s, w * .8, '#b8c4d4', s);
    font.center(g, 'A / START: PLAY AGAIN', cx, h - 32 * s, '#fff', s);
    font.center(g, 'B: CHANGE GAME   ESC: LEAN BACK', cx, h - 18 * s, '#e0d090', s);
  }
  function liveFrame() {
    if (!V || !V.live) return;
    if (V.result) { const g = V.cv1.getContext('2d'); g.clearRect(0, 0, V.cv1.width, V.cv1.height); resultFrame(g, V.cv1.width, V.cv1.height); }
    // Upload both canvases directly. Compositing in the room's material avoids
    // reading a WebGL game back through a 2D canvas every animation frame.
    V.liveTx = _.tvLive && _.tvLive(V.cv0, V.cv1, V.con);
    if (V.liveTx && R.House && R.House.ren.initTexture) { R.House.ren.initTexture(V.liveTx); R.House.ren.initTexture(V.liveTx.userData.hud); }
    if (R.House) R.House.dirty();
  }
  function owned(gid) { if (R.owned(gid)) return true; try { return !!(window.PM && PM.owns && PM.owns('cart.' + gid)); } catch (e) { return false; } } // (or bought from the mail-order catalogue: js/pm-*.js)
  function open(con, from, options) {
    if (V && V.background) {
      if (V.con === con) {
        V.background = false; (V.live ? document.documentElement : pb).appendChild(V.el); V.el.classList.add('on');
        pb.classList.add('rm-console-focus'); clearInput();
        addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
        loop.last = performance.now(); loop.acc = 0; loop.start(); _.emit('open', con); return;
      }
      close(true);
    }
    if (V) return;
    if (con === 'dc' && !conOut('dc')) return;
    if (!CAT.CONSOLES[con]) return;
    const hand = con === 'gb', live = !CAT.CONSOLES[con].away;
    const el = h(`
      <div class="rm-tvwrap"><div class="rm-tvbez ${hand ? 'rm-gbc' : 'rm-crt'}">
        <div class="rm-glass"><canvas class="rm-c0"></canvas><canvas class="rm-c1"></canvas><div class="rm-res"></div><i class="rm-scan"></i><i class="rm-glare"></i></div>
        ${hand ? `<i class="rm-gblogo">GAME LAD <b>C</b><b>O</b><b>L</b><b>O</b><b>U</b><b>R</b></i><i class="rm-gbpow"></i><span class="rm-gbpad"></span>`
        : `<i class="rm-tvname">FERGUSSON</i><i class="rm-tvknob a"></i><i class="rm-tvknob b"></i><i class="rm-tvled2"></i>`}
      </div></div>
      <div class="rm-side">
        <div class="rm-conbar"></div>
        <div class="rm-shelf"></div>
        <div class="rm-help"></div>
        <div class="rm-btns"><button type="button" class="rm-b rm-back">&larr; Back to my room</button><button type="button" class="rm-b rm-eject" hidden>Eject</button><button type="button" class="rm-b rm-blowb" hidden>Blow on it</button><button type="button" class="rm-b rm-snd"></button></div>
      </div>
      <div class="rm-pad" hidden></div>`, 'rm-view rm-tvv' + (hand && !live ? ' rm-hand' : '') + (live ? ' rm-live3d' : ''));
    el.dataset.con = con;
    (live ? document.documentElement : pb).appendChild(el);
    V = { el, con, hand, live, restoring: !!(options && options.restoring), game: null, gid: '', st: 'shelf', cv0: $(el, '.rm-c0'), cv1: $(el, '.rm-c1') };
    if (live) {
      const bar = h('', 'rm-livebar'); bar.appendChild($(el, '.rm-help')); bar.appendChild($(el, '.rm-btns')); el.appendChild(bar);
      $(el, '.rm-back').textContent = 'Lean back (Esc)'; $(el, '.rm-eject').textContent = 'Change game';
      pb.classList.remove('rm-tvon'); pb.classList.add('rm-console-focus');
    }
    // (no pointer events reach the room behind; Esc closes)
    $(el, '.rm-back').addEventListener('click', close);
    $(el, '.rm-eject').addEventListener('click', () => { _.sfx('click'); eject(); });
    $(el, '.rm-blowb').addEventListener('click', blow);
    $(el, '.rm-snd').addEventListener('click', () => { try { Sound.on = !Sound.on; if (Sound.on) ac(); } catch (e) {} sndBtn(); if (!Sound.on) music(null); else if (V && V.song) music(V.song); });
    sndBtn();
    if (hand && !live) gbButtons($(el, '.rm-gbpad'));
    if (!live) { conBar(); shelf(); } idle();
    // zoom: from where the telly (or the Game Boy) is in the room to the middle of the window
    const wrap = $(el, '.rm-tvwrap');
    requestAnimationFrame(() => {
      el.classList.add('on');
      const src = !live && from && from.getBoundingClientRect ? from.getBoundingClientRect() : (!live && from && from.width != null ? from : null), dst = wrap.getBoundingClientRect(); // (an element, or a screen rect {left, top, width, height})
      if (src && src.width > 4 && dst.width > 4) {
        const k = Math.max(src.width / dst.width, 0.05), dx = src.left + src.width / 2 - (dst.left + dst.width / 2), dy = src.top + src.height / 2 - (dst.top + dst.height / 2);
        wrap.style.transition = 'none'; wrap.style.transform = `translate(${dx}px,${dy}px) scale(${k})`; void wrap.offsetWidth;
        wrap.style.transition = ''; wrap.style.transform = '';
      }
    });
    _.emit('open', con);
    addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    loop.start();
  }
  function close(powerOff) {
    if (!V) return;
    if (V.live && powerOff !== true) {
      if (V.background) return;
      V.background = true; V.el.remove();
      try {localStorage.setItem('jhp_console_focus', JSON.stringify({con: V.con, gid: V.gid, background: true}));} catch (e) {}
      pb.classList.remove('rm-tvon', 'rm-console-focus');
      removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true);
      clearInput(); _.emit('close'); return;
    }
    // This path is a real stop/eject, not a lean-out. Release both GPU textures.
    stopGame(); music(null);
    if (V.live && _.tvOff) _.tvOff(V.con);
    try {localStorage.removeItem('jhp_console_focus');} catch (e) {}
    const el = V.el, wasBackground = V.background; V = null;
    pb.classList.remove('rm-tvon', 'rm-console-focus');
    el.classList.remove('on'); el.classList.add('bye');
    setTimeout(() => el.remove(), 320);
    removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true);
    clearInput();
    loop.stop();
    if (!wasBackground) _.emit('close');
  }
  function sndBtn() { if (!V) return; const on = !!(window.Sound && Sound.on); const b = $(V.el, '.rm-snd'); b.innerHTML = on ? '&#128266; Sound on' : '&#128263; Sound off'; b.classList.toggle('off', !on); }
  // which console (the real telly's input is selected by the cartridge on the shelf)
  function conBar() {
    const bar = $(V.el, '.rm-conbar');
    if (V.hand) { bar.innerHTML = `<b>${esc(CAT.CONSOLES.gb.full.replace(/^the /, ''))}</b> <span>Pick a cartridge</span>`; return; }
    if (CAT.CONSOLES[V.con].away) { bar.innerHTML = `<b>${esc(CAT.CONSOLES[V.con].n)}</b> <span>Pick a cartridge</span>`; return; }
    bar.innerHTML = `<b>${esc(CAT.CONSOLES[V.con].n)}</b> <span>Pick a game off the real shelf.</span>`;
  }
  // the cartridges / discs for this console: the ones you have, and gaps for the ones still lost
  function shelf() {
    const sh = $(V.el, '.rm-shelf'), con = V.con, C = CAT.CONSOLES[con];
    const games = CAT.GAMES.filter(g => g.con === con);
    sh.innerHTML = games.map(g => owned(g.id)
      ? `<button type="button" class="rm-pick rm-m-${C.media}" data-g="${g.id}" style="--c:${g.col}" title="${esc(g.blurb)}${g.owner ? ` (${esc(g.owner)}'s: borrowed!)` : ''}"><i class="rm-lbl"><b>${esc(g.title)}</b></i>${g.owner ? `<i class="rm-stk">${esc(g.owner.toUpperCase())}'S</i>` : ''}</button>`
      : `<span class="rm-pick rm-lost rm-m-${C.media}" title="${g.shop ? 'Not got it yet. It\'s in the mail-order catalogue...' : 'Lost somewhere in the house...'}"><i class="rm-lbl"><b>?</b></i></span>`).join('')
      + `<p class="rm-shelfnote">${games.every(g => owned(g.id)) ? `All my ${esc(C.n)} games!` : games.some(g => !owned(g.id) && !g.shop) ? `Some of my ${esc(C.n)} ${C.media}s are lost somewhere in the house...` : `I want more ${esc(C.n)} games. The mail-order catalogue has loads...`}</p>`;
    sh.querySelectorAll('button.rm-pick').forEach(b => b.addEventListener('click', () => insert(b.dataset.g, b)));
    sh.hidden = false;
  }

  // ================================================================ the screen: canvases, and what's on when nothing's playing
  function size(w, hh, smooth, gl) {
    const c0 = V.cv0, c1 = V.cv1;
    if (gl) { const n = c0.cloneNode(); c0.replaceWith(n); V.cv0 = n; } // (a canvas that has had a 2D context can't become WebGL)
    else if (V.cv0.dataset.gl) { const n = V.cv0.cloneNode(); delete n.dataset.gl; V.cv0.replaceWith(n); V.cv0 = n; }
    if (gl) V.cv0.dataset.gl = '1';
    V.cv0.width = c1.width = w; V.cv0.height = c1.height = hh;
    if (gl && V.live) {
      // The room renderer consumes this frame on its own animation callback.
      // Preserve it until then instead of allowing the browser to clear it.
      const o = { alpha: false, antialias: V.con === 'dc', preserveDrawingBuffer: true };
      V.cv0.getContext('webgl2', o) || V.cv0.getContext('webgl', o);
    }
    V.el.classList.toggle('rm-smooth', !!smooth);
  }
  function blank(text) { // the telly with nothing on: blue AV screen (or the Game Boy switched off)
    size(...(V.hand ? LOOK.gb.res : [320, 240]), false, false);
    const g = V.cv0.getContext('2d'), W = V.cv0.width, H = V.cv0.height;
    if (V.hand) { g.fillStyle = '#5a6a4a'; g.fillRect(0, 0, W, H); }
    else { g.fillStyle = '#1838b8'; g.fillRect(0, 0, W, H); font.draw(g, 'AV-1', 16, 14, '#fff', 2); if (text) screenLines(g, text, W / 2, H / 2 - 12, W - 40, '#fff', 1); }
    V.cv1.getContext('2d').clearRect(0, 0, W, H);
    liveFrame();
  }
  function idle() {
    V.st = 'shelf'; blank(V.hand ? '' : `${CAT.CONSOLES[V.con].n.toUpperCase()} - PUT A ${CAT.CONSOLES[V.con].media.toUpperCase()} IN`);
    $(V.el, '.rm-eject').hidden = true; $(V.el, '.rm-blowb').hidden = true;
    $(V.el, '.rm-help').textContent = V.live ? 'Lean back, pick a game from the shelf, then insert it into its console.' : 'Pick a cartridge to play.';
    V.el.classList.remove('rm-playing'); $(V.el, '.rm-res').classList.remove('on');
    pad(null);
  }

  // ================================================================ putting a game in, booting, playing
  let bootT = 0, bootFn = null, bootBad = false;
  function insert(gid, btn) {
    if (!V) return;
    stopGame();
    const G = CAT.GAME[gid]; V.gid = gid;
    _.sfx('click'); sfx.noise(0.12, 0.25, 900);
    $(V.el, '.rm-shelf').querySelectorAll('.rm-pick').forEach(b => b.classList.toggle('in', b === btn));
    $(V.el, '.rm-eject').hidden = false;
    V.el.classList.add('rm-playing');
    $(V.el, '.rm-help').textContent = 'Loading...';
    // cartridges don't always go in right first time
    const cart = CAT.CONSOLES[V.con].media === 'cartridge';
    let n = 0; try { n = +sessionStorage.getItem('jhp_rm_ins') || 0; sessionStorage.setItem('jhp_rm_ins', String(n + 1)); } catch (e) {}
    bootBad = !V.live && cart && n > 0 && Math.random() < 0.2;
    const ready = (window.RoomTV.defs[gid] ? Promise.resolve() : Promise.all((G.deps || []).map(d => load('js/' + d + '.js'))).then(() => load('js/' + G.file + '.js')))
      .then(() => { const d = window.RoomTV.defs[gid]; if (!d) throw new Error('no game'); return d.three ? load('js/rm-3d.js') : null; });
    boot(ready);
  }
  function boot(ready) {
    const con = V.con, L = LOOK[con];
    size(...L.res, L.smooth, false);
    bootT = 0; bootFn = BOOTS[con]; V.st = 'boot';
    V.ready = ready.then(() => true, e => { console.error(e); return false; });
    $(V.el, '.rm-help').textContent = '';
    if (con === 'gb') V.pal = GBPAL[(CAT.GAME[V.gid] || {}).pal] || GBPAL.none; // (a cartridge can have its own colours, like the Game Boy Color did)
  }
  function blow() {
    if (!V) return; _.sfx('click');
    sfx.noise(0.5, 0.35, 1800, 0, 'bandpass', 600);
    $(V.el, '.rm-blowb').hidden = true;
    _.secret('rm.blow');
    bootBad = false; const G = CAT.GAME[V.gid];
    V.el.classList.add('rm-blowing'); setTimeout(() => V && V.el.classList.remove('rm-blowing'), 600);
    setTimeout(() => { if (V && V.gid === G.id) boot(V.ready || Promise.resolve()); }, 650);
  }
  function eject() { if (!V) return; if (V.live) { const con = V.con; close(); if (_.ejectMedia) _.ejectMedia(con); return; } stopGame(); $(V.el, '.rm-shelf').querySelectorAll('.rm-pick').forEach(b => b.classList.remove('in')); idle(); }

  // the start-up screens (t: seconds; draw on g, a 2D context the console's size). Return true when done.
  const BOOTS = {
    n64(g, W, H, t) { // a chunky spinning "64" made of four coloured blocks, a rising chime
      if (t === 0) { sfx.seq([[67, 0.5], [72, 0.5], [76, 0.5], [84, 1.5]], { bpm: 200, wave: 'triangle', vol: 0.16, when: 0.5 }); sfx.noise(1.6, 0.04, 4000, 0.4, 'highpass'); }
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const k = clamp((t - 0.3) / 1.2, 0, 1), sp = (1 - k) * 6 + Math.sin(t * 2) * 0.12, cw = Math.cos(sp);
      const cols = ['#e8261c', '#2a9a2a', '#2a5ae0', '#f0c000'];
      for (let d = 10; d >= 0; d--) { // extrude: draw back to front
        const off = d * 1.2 * Math.sin(sp + 0.6);
        g.save(); g.translate(W / 2 + off, H / 2 - 18 + d * 0.6); g.scale(cw * (0.6 + k * 0.4), 0.6 + k * 0.4);
        g.font = '900 72px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const grad = g.createLinearGradient(-60, -30, 60, 30); cols.forEach((c, i) => grad.addColorStop(i / 3, d ? shadeHex(c, 0.4) : c));
        g.fillStyle = grad; g.fillText('64', 0, 0); g.restore();
      }
      if (t > 1.6) { font.center(g, 'ULTRA SIXTY-FOUR', W / 2, H / 2 + 38, '#ddd', 1); font.center(g, 'LICENSED BY ULTRA ENTERTAINMENT', W / 2, H - 22, '#888', 1); }
      return t > 3;
    },
    ps(g, W, H, t) { // white, a four-colour pyramid appears with a deep swell, then fades to black
      if (t === 0) { sfx.tone(55, 2.6, 'sawtooth', 0.06, 0.2, 110); sfx.tone(110.5, 2.6, 'sine', 0.1, 0.2); sfx.seq([[0, 2], [88, 0.5], [95, 3]], { bpm: 160, wave: 'sine', vol: 0.08, when: 0.4 }); }
      const fade = t < 2.6 ? 1 : clamp(1 - (t - 2.6) / 0.6, 0, 1);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      g.globalAlpha = fade; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const k = clamp((t - 0.3) / 1.4, 0, 1), s = 40 * (0.3 + 0.7 * easeOut(k)), cx = W / 2, cy = H / 2 - 20;
      const tri = (a, b, c, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fill(); };
      g.globalAlpha = fade * k;
      tri([cx, cy - s], [cx - s, cy + s * 0.6], [cx, cy + s * 0.2], '#e8261c'); tri([cx, cy - s], [cx + s, cy + s * 0.6], [cx, cy + s * 0.2], '#f0c000');
      tri([cx - s, cy + s * 0.6], [cx, cy + s * 0.2], [cx, cy + s], '#2a9a6a'); tri([cx + s, cy + s * 0.6], [cx, cy + s * 0.2], [cx, cy + s], '#2a5ae0');
      g.globalAlpha = fade * clamp((t - 1.2) / 0.6, 0, 1);
      g.font = 'italic 900 26px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.fillStyle = '#222'; g.fillText('PLAYSPACE', cx, cy + s + 34);
      font.center(g, 'COMPUTER FUN ENTERTAINMENT', cx, cy + s + 46, '#555', 1);
      g.globalAlpha = 1;
      return t > 3.3;
    },
    gb(g, W, H, t) { // the logo slides down the screen, then "ba-DING". Hold a direction to pick colours.
      const P = V.pal || GBPAL.none;
      for (const d of ['up', 'down', 'left', 'right']) if (isHeld(d)) V.pal = GBPAL[d];
      g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
      const y = Math.min(62, -12 + t * 52);
      g.fillStyle = P[3]; g.font = 'italic 900 15px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('GAME LAD', W / 2, y);
      if (y >= 62 && !V.dinged) { V.dinged = true; sfx.tone(1047, 0.08, 'square', 0.1); sfx.tone(2093, 0.5, 'square', 0.1, 0.09); }
      if (t > 2) font.center(g, 'COLOUR', W / 2, 74, P[2], 1);
      if (t < 0.05) V.dinged = false;
      return t > 2.6;
    },
    md(g, W, H, t) { // a chrome blue SEGUE sweeps in with a shine, and a two-note shout
      if (t === 0) { const c = ac(); if (c) { sfx.tone(392, 0.22, 'sawtooth', 0.09, 0.5, 440); sfx.tone(523, 0.45, 'sawtooth', 0.09, 0.74, 494); sfx.noise(0.2, 0.05, 2500, 0.5, 'bandpass'); } }
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const k = easeOut(clamp((t - 0.2) / 0.5, 0, 1)), x = W / 2 + (1 - k) * W;
      g.save(); g.font = 'italic 900 44px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const gr = g.createLinearGradient(0, H / 2 - 22, 0, H / 2 + 22); gr.addColorStop(0, '#9ad0ff'); gr.addColorStop(0.45, '#1a5ae0'); gr.addColorStop(0.5, '#0a2a90'); gr.addColorStop(1, '#5aa0ff');
      g.fillStyle = gr; g.fillText('SEGUE', x, H / 2);
      g.lineWidth = 2; g.strokeStyle = '#e8f4ff'; g.strokeText('SEGUE', x, H / 2);
      const sx = (t - 0.9) * 500; if (sx > 0 && sx < W + 80) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(sx - 40, 0, 18, H); g.globalCompositeOperation = 'source-over'; }
      g.restore();
      return t > 2.4;
    },
    sn(g, W, H, t) { // the four coloured buttons drop in one by one, then the name slides under them with a bright chord
      if (t === 0) { sfx.seq([[0, 0.6], [79, 0.25], [83, 0.25], [86, 0.25], [91, 1.6]], { bpm: 190, wave: 'square', vol: 0.07 }); sfx.seq([[0, 1.35], [67, 1.6]], { bpm: 190, wave: 'triangle', vol: 0.12 }); }
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a2a3a'); gr.addColorStop(1, '#0a0a14'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 - 24, B = [['#2a9a4a', -22, 0, 'Y'], ['#2a52d0', 0, -18, 'X'], ['#e8c21a', 0, 18, 'B'], ['#d42a2a', 22, 0, 'A']];
      B.forEach(([col, dx, dy, l], i) => {
        const k = clamp((t - 0.25 - i * 0.16) / 0.35, 0, 1); if (!k) return;
        const bounce = k < 1 ? Math.sin(k * Math.PI) * -10 * (1 - k) : 0, y = cy + dy - (1 - easeOut(k)) * 70 + bounce;
        g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(cx + dx + 2, cy + dy + 11, 10, 3, 0, 0, 7); g.fill();
        g.fillStyle = shadeHex(col, 0.55); g.beginPath(); g.arc(cx + dx, y + 2, 10, 0, 7); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(cx + dx, y, 10, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(cx + dx - 3, y - 4, 4, 0, 7); g.fill();
        font.center(g, l, cx + dx, y - 3, '#fff', 1);
      });
      const k = easeOut(clamp((t - 1.15) / 0.45, 0, 1));
      if (k > 0) {
        g.save(); g.globalAlpha = k; g.font = 'italic 900 23px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const tg = g.createLinearGradient(0, cy + 38, 0, cy + 58); tg.addColorStop(0, '#fff'); tg.addColorStop(0.5, '#c8c8d8'); tg.addColorStop(1, '#8a8aa8');
        g.fillStyle = '#000'; g.fillText('SUPER ULTRA', cx + 2, cy + 50 + (1 - k) * 12); g.fillStyle = tg; g.fillText('SUPER ULTRA', cx, cy + 48 + (1 - k) * 12);
        g.restore();
        font.center(g, 'ENTERTAINMENT SYSTEM', cx, cy + 66, `rgba(200,200,220,${k})`, 1);
      }
      if (t > 1.9) font.center(g, 'LICENSED BY ULTRA ENTERTAINMENT', W / 2, H - 18, '#6a6a80', 1);
      return t > 3;
    },
    dc(g, W, H, t) { // white, an orange spiral draws itself, a soft bell
      if (t === 0) sfx.seq([[76, 0.5], [83, 0.5], [88, 0.5], [91, 2]], { bpm: 150, wave: 'sine', vol: 0.12, when: 0.3 });
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const k = clamp((t - 0.2) / 1.4, 0, 1), cx = W / 2, cy = H / 2 - 30;
      g.strokeStyle = '#f06a00'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath();
      const n = Math.floor(160 * k);
      for (let i = 0; i <= n; i++) { const a = i / 160 * Math.PI * 4.2, r = 4 + i / 160 * 70; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.95; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      g.globalAlpha = clamp((t - 1.3) / 0.6, 0, 1);
      g.font = '300 42px Arial,sans-serif'; g.textAlign = 'center'; g.fillStyle = '#555'; g.fillText('DAYDREAM', cx, cy + 118);
      g.font = '12px Arial,sans-serif'; g.fillStyle = '#999'; g.fillText('PRODUCED UNDER LICENCE FROM DAYDREAM ENTERPRISES', cx, H - 30);
      g.globalAlpha = 1;
      return t > 3.2;
    },
  };
  // a cartridge that won't go in properly: a garbled screen
  function garbled(g, W, H, t) {
    if (t === 0) sfx.noise(1.2, 0.08, 3000);
    const P = V.con === 'gb' ? (V.pal || GBPAL.none) : null;
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 8) { const r = Math.random(); g.fillStyle = P ? P[r * 4 | 0] : `hsl(${(r * 360) | 0},${60 + r * 40}%,${20 + r * 50}%)`; g.fillRect(x, y, 8, 4); }
    if (t > 0.6) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(0, H / 2 - 10, W, 20); font.center(g, P ? '' : 'NOTHING HAPPENS...', W / 2, H / 2 - 3, '#fff', 1); }
    return false;
  }
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function shadeHex(c, k) { const n = parseInt(c.slice(1), 16); return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; }

  // ================================================================ the game runtime
  const defs = {};
  let K = null, game = null;
  function startGame() {
    const gid = V.gid, def = defs[gid], L = LOOK[V.con];
    const res = def.res || L.res;
    size(res[0], res[1], def.smooth != null ? def.smooth : L.smooth, !!def.three);
    V.st = 'game'; V.el.classList.add('rm-playing');
    $(V.el, '.rm-help').innerHTML = touchy() ? 'Use the controller below.' : esc(def.help || '') + ' <small>(Esc: back to the room)</small>';
    pad(def);
    K = makeK(gid, def);
    try { game = def.make(K) || {}; } catch (e) { console.error(e); game = null; return crash(); }
    liveFrame();
    _.emit('play', gid);
    if (!V.restoring) playedOne(gid);
  }
  function crash() { const g = V.cv1.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, V.cv1.width, V.cv1.height); font.center(g, 'THIS GAME HAS CRASHED. EJECT IT AND TRY AGAIN.', V.cv1.width / 2, V.cv1.height / 2, '#fff', 1); }
  function stopGame() {
    if (game && game.end) { try { game.end(); } catch (e) {} }
    if (K && K._three && K._three.dispose) { try { K._three.dispose(); } catch (e) {} }
    game = null; K = null; music(null); if (V) V.song = null;
    if (V) V.result = null;
    bootFn = null;
    if (V) $(V.el, '.rm-res').classList.remove('on');
  }
  function makeK(gid, def) {
    const G = CAT.GAME[gid], cv = V.cv0, W = cv.width, H = cv.height;
    const k = {
      id: gid, con: V.con, restoring: V.restoring, def, W, H, cv, g: def.three ? null : cv.getContext('2d'), hud: V.cv1.getContext('2d'), t: 0, frame: 0,
      font, sfx, pal: V.pal || GBPAL.none,
      held: b => alias(b).some(isHeld), pressed: b => alias(b).some(x => !!now[x]), any: () => Object.keys(now).some(x => now[x] && ['a', 'b', 'c', 'x', 'y', 'start'].includes(x)),
      stick, label: b => (LOOK[V ? V.con : 'n64'].keys || {})[b] || String(b).toUpperCase(),
      music(song) { if (V) V.song = song || null; music(song); },
      get best() { return Math.max(localBest(gid), (srv.best[gid] | 0)); },
      save(st) { try { return Apps.saveGame('rm.' + gid, st, { v: def.v || 1 }); } catch (e) { return false; } },
      load() { try { return Apps.loadGame('rm.' + gid, def.v || 1); } catch (e) { return null; } },
      clear() { try { Apps.clearGame('rm.' + gid); } catch (e) {} },
      secret: id => { if (!k.restoring) _.secret(id); },
      rnd(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
      three(o) { if (!k._three) k._three = window.RoomTV.make3d(k, Object.assign({ look: V.con === 'ps' ? 'ps1' : V.con }, o || {})); return k._three; },
      over(score, o) { finish(k, gid, Math.max(0, Math.floor(score || 0)), o || {}); },
      tok: '',
    };
    // ask the server for a token for this go (members get on the table and earn; guests just play)
    try { if (window.Net && !k.restoring) Net.send({ t: 'rmGo', g: gid }); } catch (e) {}
    return k;
  }
  // a go is over: the score card on the screen, and the server's say
  function finish(k, gid, sc, o) {
    if (!V || !K || K !== k || k.done) return;
    setLocalBest(gid, sc);
    const tok = k.tok;
    if (tok) { try { Net.send({ t: 'rmDone', g: gid, tok, sc }); } catch (e) {} k.tok = ''; }
    if (o.keep) { // carry on playing (and get a new token for the next stretch)
      try { if (window.Net && !k.restoring) Net.send({ t: 'rmGo', g: gid }); } catch (e) {}
      return;
    }
    const res = $(V.el, '.rm-res');
    res.innerHTML = `<h3>${esc(o.title || 'GAME OVER')}</h3>${o.text ? `<p>${esc(o.text)}</p>` : ''}<div class="rm-sc">SCORE <b>${sc.toLocaleString('en-GB')}</b></div>
      <div class="rm-best">YOUR BEST <b>${Math.max(localBest(gid), srv.best[gid] | 0).toLocaleString('en-GB')}</b></div><div class="rm-srv">${tok ? 'Sending your score to JackNet...' : (window.Net && Net.me && Net.me.member ? '' : 'Log on to JackNet to get on the high-score table and earn Rupees!')}</div>
      <ol class="rm-hi"></ol><div class="rm-rb"><button type="button" class="rm-b rm-again">Play again</button><button type="button" class="rm-b rm-shelfb">Change game</button></div>`;
    res.classList.add('on');
    V.result = { title: o.title || 'GAME OVER', text: String(o.text || '').replace(/<[^>]+>/g, ''), sc };
    V.waitRes = gid;
    $(res, '.rm-again').addEventListener('click', again); $(res, '.rm-shelfb').addEventListener('click', () => eject());
    if (srv.hi[gid]) hiList(srv.hi[gid]);
    try { Net.send({ t: 'rmHi', g: gid }); } catch (e) {}
    k.done = true;
  }
  function again() { if (!V || !V.gid) return; const gid = V.gid; stopGame(); V.gid = gid; V.restoring = false; startGame(); }
  function mates(gid) { // Jack's mates have all had a go on his consoles: their scores are saved on the cartridge
    const G = CAT.GAME[gid]; if (!G) return [];
    let h = 0; for (const ch of gid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const r = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
    const top = Math.min(G.max * 0.6, G.pay * 4);
    return [['Dave', 1], ['Luke', 0.72], ['Callum', 0.5], ['JackK', 0.33]].map(([n, k]) => ({ n, s: Math.round(top * k * (0.85 + r() * 0.3) / 10) * 10, mate: 1 }));
  }
  function hiList(list) {
    if (!V) return; const ol = $(V.el, '.rm-hi'); if (!ol) return;
    const me = window.Net && Net.me && Net.me.nick, gid = V.waitRes || V.gid;
    const all = (list || []).map(x => Object.assign({}, x)).concat(mates(gid)).sort((a, b) => b.s - a.s);
    ol.innerHTML = all.slice(0, 5).map((x, i) => `<li class="${x.n === me && !x.mate ? 'me' : ''}${x.mate ? ' mate' : ''}"><span>${i + 1}. ${esc(x.n)}${x.mate ? ' <small>(mate)</small>' : ''}</span><b>${(x.s | 0).toLocaleString('en-GB')}</b></li>`).join('');
  }
  const LB = 'jhp_rm_best';
  function localBest(gid) { try { return (JSON.parse(localStorage.getItem(LB) || '{}')[gid]) | 0; } catch (e) { return 0; } }
  function setLocalBest(gid, sc) { try { const o = JSON.parse(localStorage.getItem(LB) || '{}'); if (sc > (o[gid] | 0)) { o[gid] = sc; localStorage.setItem(LB, JSON.stringify(o)); } } catch (e) {} }
  // the server
  const srv = { best: {}, hi: {} };
  if (window.Net) {
    Net.on('rmGo', m => { if (K && K.id === m.g && !K.done) K.tok = m.tok; });
    Net.on('rmDone', m => {
      if (m.best) srv.best[m.g] = m.best;
      if (m.list) srv.hi[m.g] = m.list;
      if (!V || V.waitRes !== m.g) { if (m.amt > 0) _.coinToast && _.coinToast(m.amt); return; }
      const s = $(V.el, '.rm-srv'); if (!s) return;
      if (m.bad) s.textContent = 'JackNet did not believe that score. Hmm.';
      else if (m.guest) s.textContent = 'Log on to JackNet to get on the high-score table and earn Rupees!';
      else s.innerHTML = (m.amt > 0 ? `<b class="rm-rup">+${m.amt} Rupees!</b> ` : (m.real === false ? '<small>(Get a bit further to earn Rupees.)</small> ' : '<small>(No more Rupees from games today.)</small> ')) + (m.rank ? `You're <b>#${m.rank}</b> on the table!` : '') + (m.pb ? ' <b>New best!</b>' : '');
      if (m.list) hiList(m.list);
    });
    Net.on('rmHi', m => { srv.hi[m.g] = m.list; if (V && V.waitRes === m.g) hiList(m.list); });
    Net.on('rmMe', m => { if (m.best) Object.assign(srv.best, m.best); });
  }

  // ================================================================ the loop
  const loop = {
    raf: 0, last: 0, acc: 0, viewAt: 0, viewOn: false,
    start() { if (this.raf) return; this.last = performance.now(); this.acc = 0; const f = n => { this.raf = requestAnimationFrame(f); this.tick(n); }; this.raf = requestAnimationFrame(f); },
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; },
    tick(n) {
      if (!V) return;
      // Keep the simulation alive, but avoid rendering/uploading a second game
      // at the monitor's full refresh rate while Jack is walking elsewhere.
      if (V.background && n - this.viewAt > 250) {this.viewAt = n; this.viewOn = !!(_.tvVisible && _.tvVisible(V.con));}
      if (V.background && n - this.last < (this.viewOn ? 1000 / 30 : 1000 / 10)) return;
      let dt = (n - this.last) / 1000; this.last = n; if (dt > 0.25) dt = 0.25;
      if (!V.background) pollGamepad();
      if (OUT && AC) OUT.gain.setTargetAtTime(V.background ? (R.House.here === 'bedroom' ? .12 : 0) : .5, AC.currentTime, .15);
      if (V.st === 'boot' && bootFn) {
        const g = V.cv0.getContext ? V.cv0.getContext('2d') : null;
        if (g) {
          const f = bootBad ? garbled : bootFn, done = f(g, V.cv0.width, V.cv0.height, bootT);
          if (bootBad && bootT > 0.7) $(V.el, '.rm-blowb').hidden = false;
          bootT += dt;
          liveFrame();
          if (done) { bootFn = null; const myV = V, gid = V.gid; V.ready.then(ok => { if (!V || V !== myV || V.st !== 'wait' || V.gid !== gid) return; if (ok) startGame(); else { V.st = 'shelf'; blank('THAT DID NOT LOAD. TRY AGAIN.'); } }); V.st = 'wait'; }
        }
        now = pend; pend = {};
        return;
      }
      if (V.st !== 'game' || !game) { liveFrame(); pend = {}; return; }
      if (K.done && $(V.el, '.rm-res').classList.contains('on')) { // the score card: A plays again, B changes game
        now = pend; pend = {};
        if (now.a || now.start) again(); else if (now.b) eject();
        liveFrame();
        return;
      }
      this.acc += dt; let steps = 0;
      while (this.acc >= 1 / 60 && steps < 9) {
        now = pend; pend = {};
        try { if (game.update) game.update(1 / 60); } catch (e) { console.error(e); game = null; crash(); return; }
        K.t += 1 / 60; K.frame++; this.acc -= 1 / 60; steps++;
        if (!game) return;
      }
      if (steps >= 9) this.acc = 0;
      try { if (game && game.draw) game.draw(); liveFrame(); } catch (e) { console.error(e); game = null; crash(); }
    },
  };
  document.addEventListener('visibilitychange', () => { if (!V) return; if (document.hidden) { loop.stop(); music(null); } else { loop.start(); if (V.song) music(V.song); } });

  // ---- keys: while the telly is up, every key is ours (Esc goes back to the room, never skips the boot)
  function onKey(ev) {
    if (!V || V.background) return;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); close(); return; }
    const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const b = KEYMAP[ev.key];
    if (b) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) press(b, true); held[b] = true; }
    else if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.key.length === 1) ev.stopImmediatePropagation();
  }
  function onKeyUp(ev) { if (!V) return; const b = KEYMAP[ev.key]; if (b) { held[b] = false; ev.stopImmediatePropagation(); } }
  function clearInput() { for (const map of [held, padHeld, gpHeld]) for (const k in map) map[k] = false; pend = {}; now = {}; stickT.on = false; stickT.x = stickT.y = 0; }
  addEventListener('blur', clearInput);
  addEventListener('pagehide', () => { if (K) K.tok = ''; stopGame(); });

  // ---- the touch pad (phones and tablets), styled like the console's own controller
  function pad(def) {
    if (!V || (V.hand && !V.live)) return;
    const P = $(V.el, '.rm-pad'), con = V.con, L = LOOK[con];
    if (!def || !touchy()) { P.hidden = true; P.innerHTML = ''; V.el.classList.remove('rm-padon'); return; }
    const bs = (def.buttons || ['a', 'b']).filter(b => L.keys[b] || b === 'c' || b === 'x');
    P.innerHTML = `<div class="rm-pl">${def.stick ? '<div class="rm-stick"><i></i></div>' : '<div class="rm-dpad"><b data-b="up"></b><b data-b="left"></b><b data-b="right"></b><b data-b="down"></b><i></i></div>'}</div>
      <div class="rm-pm">${bs.includes('l') ? '<b class="rm-sh" data-b="l">' + esc(L.keys.l || 'L') + '</b>' : ''}<b class="rm-st" data-b="start">START</b>${bs.includes('r') ? '<b class="rm-sh" data-b="r">' + esc(L.keys.r || 'R') + '</b>' : ''}</div>
      <div class="rm-pr ${con === 'sn' || con === 'ps' ? 'rm-dia' : 'rm-pad-n' + bs.filter(b => !['l', 'r'].includes(b)).length}">${bs.filter(b => !['l', 'r'].includes(b)).map(b => `<b class="rm-fb" data-b="${b}" style="--bc:${(L.cols || {})[b] || '#555'}">${esc(L.keys[b] || (b === 'x' ? L.keys.c : '') || b.toUpperCase())}</b>`).join('')}</div>`;
    P.hidden = false; V.el.classList.add('rm-padon');
    padTouch(P, def);
  }
  function padTouch(P, def) {
    const act = new Map(); // pointerId -> button
    const set = (b, on) => { if (on && !padHeld[b]) pend[b] = true; padHeld[b] = on; P.querySelectorAll(`[data-b="${b}"]`).forEach(e => e.classList.toggle('on', on)); };
    const dpad = P.querySelector('.rm-dpad');
    const dpadAt = (ev) => { // the D-pad works by where your finger is on it (diagonals too)
      const r = dpad.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      const on = { up: y < -0.17, down: y > 0.17, left: x < -0.17, right: x > 0.17 };
      for (const d in on) set(d, on[d]);
    };
    const sEl = P.querySelector('.rm-stick');
    const stickAt = ev => { const r = sEl.getBoundingClientRect(); let x = (ev.clientX - r.left) / r.width * 2 - 1, y = (ev.clientY - r.top) / r.height * 2 - 1; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } stickT.x = x; stickT.y = y; stickT.on = true; sEl.firstElementChild.style.transform = `translate(${x * 34}px,${y * 34}px)`; set('left', x < -0.5); set('right', x > 0.5); set('up', y < -0.5); set('down', y > 0.5); };
    P.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      const b = ev.target.closest('[data-b]'), d = ev.target.closest('.rm-dpad'), s = ev.target.closest('.rm-stick');
      try { P.setPointerCapture(ev.pointerId); } catch (e) {}
      if (s) { act.set(ev.pointerId, 'stick'); stickAt(ev); } else if (d) { act.set(ev.pointerId, 'dpad'); dpadAt(ev); } else if (b) { act.set(ev.pointerId, b.dataset.b); set(b.dataset.b, true); }
    });
    P.addEventListener('pointermove', ev => { const a = act.get(ev.pointerId); if (a === 'dpad') dpadAt(ev); else if (a === 'stick') stickAt(ev); });
    const up = ev => {
      const a = act.get(ev.pointerId); act.delete(ev.pointerId); if (!a) return;
      if (a === 'dpad' || a === 'stick') { for (const d of ['up', 'down', 'left', 'right']) set(d, false); if (a === 'stick') { stickT.on = false; stickT.x = stickT.y = 0; sEl.firstElementChild.style.transform = ''; } }
      else set(a, false);
    };
    P.addEventListener('pointerup', up); P.addEventListener('pointercancel', up);
    P.addEventListener('contextmenu', ev => ev.preventDefault());
  }
  // the Game Boy's own buttons (its body is the controller, mouse or finger)
  function gbButtons(el) {
    el.innerHTML = '<span class="rm-gbd"><b data-b="up"></b><b data-b="left"></b><b data-b="right"></b><b data-b="down"></b><i></i></span><b class="rm-gbb" data-b="b">B</b><b class="rm-gba" data-b="a">A</b><b class="rm-gbs" data-b="select">SELECT</b><b class="rm-gbs st" data-b="start">START</b>';
    const act = new Map();
    const set = (b, on) => { if (on && !padHeld[b]) pend[b] = true; padHeld[b] = on; el.querySelectorAll(`[data-b="${b}"]`).forEach(e => e.classList.toggle('on', on)); };
    el.addEventListener('pointerdown', ev => { const b = ev.target.closest('[data-b]'); if (!b) return; ev.preventDefault(); try { el.setPointerCapture(ev.pointerId); } catch (e) {} act.set(ev.pointerId, b.dataset.b); set(b.dataset.b, true); });
    const up = ev => { const b = act.get(ev.pointerId); act.delete(ev.pointerId); if (b) set(b, false); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  // ================================================================ "you have won!" (the post: after playing lots of different games)
  function playedOne(gid) {
    const S = _.S; S.pl = S.pl || {}; S.pl[gid] = 1; _.save();
    if (Object.keys(S.pl).length >= 5 && !S.post) { S.post = Date.now(); _.save(); }
  }

  // ================================================================ hooking up the room
  // (testing: RoomTV.test('sn.zero') opens the right console and boots the game, found or not; RoomTV.dbg() is the running game's K)
  function test(gid) { const G = CAT.GAME[gid]; if (!G) return false; if (V && V.con !== G.con) close(true); if (!V || V.background) open(G.con, null); if (!V) return false; if (V.con !== G.con) { V.con = G.con; V.el.dataset.con = G.con; conBar(); shelf(); } bootBad = false; try { sessionStorage.setItem('jhp_rm_ins', '0'); } catch (e) {} insert(gid, null); bootBad = false; return true; }
  function playPhysical(gid) { const G = CAT.GAME[gid]; if (!G || !V || V.con !== G.con) return false; if (V.gid === gid && ['game', 'boot', 'wait'].includes(V.st)) return true; insert(gid, null); bootBad = false; return true; }
  window.RoomTV = { game(id, def) { defs[id] = def; }, defs, test, playPhysical, stopPhysical(con) {if (V && V.con === con) close(true);}, dbg: () => K, _dbg: () => V && { st: V.st, gid: V.gid, con: V.con, background: !!V.background }, open, close, font, sfx, music, LOOK, get open_() { return !!V && !V.background; } };
})();

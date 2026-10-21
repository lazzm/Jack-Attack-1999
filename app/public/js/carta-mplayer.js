/* JackOS Media Player (carta pack): plays "videos" that are really little canvas films with chiptune sound.
 * Lazy-loaded by apps-carta.js; exports Carta.mods.mplayer(w, arg). Every video is drawn from its time t,
 * so seeking is free. Internal resolution 160x120, scaled up with crisp pixels like a 1999 codec would. */
(function () {
  const C = window.Carta, A = window.Apps; if (!C || !A) return;
  const { h, esc } = C;
  const W = 160, H = 120;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const midi = t => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(t); if (!m) return 0; return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  // mel(start, step, 'C5 E5 . G5 - -', type, vol): one token per step; '.' rest, '-' hold previous
  function mel(start, step, str, type, vol) {
    const out = []; let cur = null;
    str.split(/[\s|]+/).filter(Boolean).forEach((tok, i) => {
      const at = start + i * step;
      if (tok === '-') { if (cur) cur.d += step; return; }
      if (cur) out.push(cur); cur = null;
      if (tok === '.') return;
      cur = { t: at, f: hz(midi(tok)), d: step, type: type || 'square', v: vol };
    });
    if (cur) out.push(cur);
    return out.map(e => { e.d *= 0.9; return e; });
  }
  const sfx = (t, name) => ({ t, sfx: name });
  const beep = (t, f, d, type) => ({ t, f, d: d || 0.1, type: type || 'square' });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1); // 0..1 progress of t through [a, b]
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const rng = seed => { let s = seed | 0 || 1; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };

  // ================================================================ shared sprites
  const GROT = [ // Gubbinz-style grot, 12x16, pal keys: g green, G dark green, k black, w white, r red, n brown, y yellow
    '...GGGGG....', '..GgggggG...', 'GGgggggggGG.', 'GggwwgwwggGG', 'GggwkgwkgggG', '.GggggggggG.', '.GgggkkkggG.', '..GggggggG..',
    '...GkkkkG...', '..GnnnnnnG..', '..GnnnnnnG..', '...nnnnnn...', '...kk..kk...', '...kk..kk...', '..kkk..kkk..', '............'];
  const GROT_LEGS2 = GROT.map((r, i) => i >= 12 ? ['..kk....kk..', '.kk......kk.', 'kkk......kkk', '............'][i - 12] : r);
  const SQUIG = ['.Rr...rR.', '..RRRRR..', '.RrrrrrR.', 'RrwwrwwrR', 'RrwkrwkrR', 'RprrrrrpR', 'RrkrrrkrR', '.RrkkkrR.', '..RRRRR..', '..y...y..']; // a round bouncy Blobbit (big eyes, grin, little ears)
  const SQUIG2 = SQUIG.map((r, i) => i === 9 ? '.y.....y.' : r);
  const ROBO = [ // a little wind-up tin robot, 10x14 (key on its back), pal keys: e light, a mid, A dark, y eyes, r light, Y key
    '....rr....', '....kk....', '..kkkkkk..', '..keeeak..', '..kyeyak..', '..keeeak..', '..kAAAak..', '...kkkk...', '.kkkkkkkk.', 'Ykeerraak.', 'YkeeeaaakY', '.kkkkkkkk.', '..kA..kA..', '.kkk..kkk.'];
  const ROBO2 = ROBO.map((r, i) => i >= 12 ? ['.kA....Ak.', 'kkk....kkk'][i - 12] : r);
  const ROCKET = ['....ww....', '...wwww...', '..wwwwww..', '..wwcwww..', '..wwccww..', '..wwwwww..', '.rwwwwwwr.', 'rrwwwwwwrr', 'rrwwwwwwrr', 'rrrwwwwrrr', '..rrrrrr..', '..r....r..'];
  const MODEM = ['aaaaaaaaaaaaaaaa', 'aAAAAAAAAAAAAAAa', 'aAeeeeeeeeeeeeAa', 'aAeeeeeeeeeeeeAa', 'aAAAAAAAAAAAAAAa', 'aaaaaaaaaaaaaaaa'];

  function grot(p, x, y, s, frame, pal) { p.spr(x, y, frame ? GROT_LEGS2 : GROT, pal, s); }
  function squig(p, x, y, s, frame) { p.spr(x, y, frame ? SQUIG2 : SQUIG, null, s); }
  function robo(p, x, y, s, frame, pal) { p.spr(x, y - 4 * s, frame ? ROBO2 : ROBO, pal, s); } // feet line up with squig()
  function caption(p, y, str, c, s, bg) { // centred text with a shadow box behind it
    s = s || 2; const tw = p.textW(str, s);
    if (bg) p.rect((W - tw) / 2 - 3, y - 2, tw + 6, 5 * s + 4, bg);
    p.text((W - tw) / 2 + 1, y + 1, str, 'k', s); p.text((W - tw) / 2, y, str, c, s);
  }
  function blocky(p, t, amount) { // "JackOS Video 1" codec: a few random macroblocks go wrong for a frame
    const R = rng(Math.floor(t * 8) + 3); if (R() > amount) return;
    for (let i = 0; i < 3; i++) p.rect((R() * W) | 0 & ~7, (R() * H) | 0 & ~7, 8, 8, ['#808', '#088', '#444', '#ccc'][(R() * 4) | 0]);
  }
  function fade(p, k, c) { // k 0..1 darken using dither bands (no alpha in 1999!)
    if (k <= 0) return; if (k >= 1) { p.fill(c || 'k'); return; }
    const R = rng(99); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x * 7 + y * 13) % 17) / 17 < k) p.px(x, y, c || 'k');
  }

  // ================================================================ the videos
  const V = {};
  // ---------------------------------------------------------------- welcome.avi: the JackOS 98 tour
  V.welcome = { title: 'Welcome to JackOS 98', file: 'welcome.avi', dur: 34, codec: 'JackOS Video 1', fps: 15,
    sound: [...mel(0.2, 0.22, 'C5 E5 G5 C6 - - G5 - A5 - - - G5 - - -', 'triangle'), ...mel(4, 0.22, 'F5 A5 C6 F6 - - C6 - D6 - - - C6 - - -', 'triangle'),
      ...mel(9, 0.18, 'G4 B4 D5 G5 . G5 . B5 . D6 - - .', 'square', 0.1), ...mel(16, 0.18, 'C5 . E5 . G5 . C6 . E6 - - - .', 'square', 0.1), ...mel(23, 0.18, 'E5 G5 B5 E6 . B5 . G5 . E5 - - .', 'square', 0.1),
      ...mel(29, 0.25, 'C5 E5 G5 C6 E6 G6 C7 - - - - -', 'triangle'), sfx(27.5, 'solve')],
    draw(p, t) {
      p.fill('t');
      const k = seg(t, 0, 2);
      // the desktop: teal with a few icons and a taskbar
      p.rect(0, H - 10, W, 10, 'e').rect(0, H - 10, W, 1, 'w').rect(2, H - 8, 22, 7, 'e').rect(2, H - 8, 22, 1, 'w').rect(2, H - 2, 22, 1, 'A');
      p.text(4, H - 7, 'START', 'k');
      p.rect(W - 28, H - 8, 26, 7, 'e').rect(W - 28, H - 8, 1, 7, 'A').rect(W - 28, H - 8, 26, 1, 'A'); p.text(W - 25, H - 7, '12:00', 'k');
      [[6, 6, 'c'], [6, 24, 'y'], [6, 42, 'e'], [6, 60, 'w']].forEach(([x, y, c], i) => { if (t > 0.3 * i + 2) { p.box(x, y, 10, 9, c, 'k'); p.rect(x - 2, y + 11, 14, 3, 'T'); } });
      if (t < 2) { fade(p, 1 - k, 'k'); caption(p, 50, 'JACKOS 98', 'w', 3); return; }
      if (t >= 2 && t < 9) { caption(p, 8, 'WELCOME TO JACKOS 98', 'w', 2, 'i'); caption(p, 100, 'YOUR NEW DESKTOP', 'y', 1); }
      if (t >= 9 && t < 16) { // the Start menu slides up
        const s = ease(seg(t, 9, 10)); const mh = Math.round(60 * s);
        p.rect(2, H - 10 - mh, 50, mh, 'e').rect(2, H - 10 - mh, 50, 1, 'w').rect(51, H - 10 - mh, 1, mh, 'A');
        p.rect(2, H - 10 - mh, 7, mh, 'i');
        if (s > 0.95) ['PROGRAMS', 'DOCUMENTS', 'SETTINGS', 'FIND', 'HELP', 'RUN...', 'SHUT DOWN'].forEach((l, i) => p.text(12, H - 66 + i * 8, l, i === Math.floor(t * 2) % 7 ? 'w' : 'k'));
        if (s > 0.95) p.rect(10, H - 67 + (Math.floor(t * 2) % 7) * 8, 41, 7, 'B'), ['PROGRAMS', 'DOCUMENTS', 'SETTINGS', 'FIND', 'HELP', 'RUN...', 'SHUT DOWN'].forEach((l, i) => p.text(12, H - 66 + i * 8, l, i === Math.floor(t * 2) % 7 ? 'w' : 'k'));
        caption(p, 8, 'CLICK START TO BEGIN', 'w', 2, 'i'); caption(p, 100, '(EVEN TO STOP)', 'y', 1);
      }
      if (t >= 16 && t < 23) { // a browser window pops open
        const s = ease(seg(t, 16, 16.6)); const ww = Math.round(120 * s), hh = Math.round(80 * s);
        const x = 20 + (120 - ww) / 2, y = 14 + (80 - hh) / 2;
        p.box(x, y, ww, hh, 'e', 'k'); if (s > 0.9) { p.rect(x + 2, y + 2, ww - 4, 7, 'B'); p.text(x + 4, y + 3, 'JACKNET EXPLORER', 'w'); p.rect(x + 2, y + 10, ww - 4, 6, 'w'); p.text(x + 4, y + 11, 'HTTP://WWW.JACKLM.COM', 'k'); p.rect(x + 2, y + 17, ww - 4, hh - 19, 'w'); p.text(x + 8, y + 22, 'JACK ATTACK!', 'r', 2); p.text(x + 8, y + 36, 'ONLINE', 'B', 2); p.rect(x + 8, y + 50, 100, 2, 'y'); p.text(x + 8, y + 56, 'LOADING... 56K', 'A'); p.rect(x + 8, y + 64, Math.round(90 * seg(t, 17, 22)), 4, 'g'); }
        caption(p, 2, 'THE INTERNET IS BUILT IN', 'w', 2, 'i'); caption(p, 104, 'WORLD WIDE WEB INCLUDED', 'y', 1);
      }
      if (t >= 23 && t < 29) { // secrets: stars popping up everywhere
        const R = rng(5); for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * (H - 14), at = 23 + R() * 4; if (t > at) { const s = Math.min(3, Math.floor((t - at) * 6)); p.text(x, y, '*', 'y', s); } }
        caption(p, 8, 'HUNDREDS OF SECRETS', 'w', 2, 'i'); caption(p, 100, 'NOBODY HAS FOUND THEM ALL', 'y', 1);
      }
      if (t >= 29) { fade(p, seg(t, 29, 31) * 0.8, 'k'); caption(p, 40, 'JACKOS 98', 'w', 3); caption(p, 72, 'WHERE DO YOU WANT', 'c', 1); caption(p, 80, 'TO GO TOMORROW?', 'c', 1); if (t > 32.5) caption(p, 100, '(TOMORROW IS ALSO 1999)', 'y', 1); }
      blocky(p, t, 0.08);
    } };

  // ---------------------------------------------------------------- spinning logo.avi: a proper 3D extruded J
  V.logo3d = { title: 'JackOS 3D Logo', file: 'spinning logo.avi', dur: 20, codec: 'JackOS Video 1', fps: 25,
    sound: [...mel(0, 0.2, 'C4 - G4 - C5 - E5 - G5 - - - E5 - C5 - A4 - - - G4 - - - F4 - A4 - C5 - F5 - - - E5 - C5 - G4 - - - - - - -', 'sawtooth', 0.06),
      ...mel(10, 0.2, 'C4 - G4 - C5 - E5 - G5 - - - E5 - C5 - A4 - - - G4 - - - F4 - A4 - C5 - F5 - - - E5 - C5 - C6 - - - - - - - - -', 'sawtooth', 0.06)],
    draw(p, t, g) {
      p.vgrad(0, H, '#000020', '#203060'); p.stars(60, 3);
      // extruded "J" made of unit cubes, rotated about Y (and a slow X wobble), painter's order by depth
      const cells = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 5], [0, 4]];
      const ay = t * 1.3, ax = Math.sin(t * 0.7) * 0.35, cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      const faces = [];
      const rot = (x, y, z) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx; return [x1, y1, z2]; };
      const proj = ([x, y, z]) => { const d = 9 / (9 + z); return [W / 2 + x * 11 * d, H / 2 + 2 + y * 11 * d]; };
      const set = new Set(cells.map(c => c.join(','))), has = (x, y) => set.has(x + ',' + y);
      const DIRS = [[0, 0, -1, [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], 1.0], [0, 0, 1, [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 0.55], [-1, 0, 0, [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], 0.7], [1, 0, 0, [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], 0.7], [0, -1, 0, [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], 0.85], [0, 1, 0, [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], 0.4]];
      for (const [gx, gy] of cells) for (const [dx, dy, dz, quad, shade] of DIRS) {
        if (dz === 0 && has(gx + dx, gy + dy)) continue; // inner face
        const pts3 = quad.map(([qx, qy, qz]) => rot(gx + qx - 2.5, gy + qy - 3, qz - 0.5));
        const zc = pts3.reduce((s2, v) => s2 + v[2], 0) / 4;
        const n = rot(dx, dy, dz); if (n[2] > 0.02) continue; // back-facing
        faces.push({ z: zc, pts: pts3.map(proj), c: `rgb(${Math.round(42 * shade + 30)},${Math.round(154 * shade)},${Math.round(42 * shade + 10)})` });
      }
      faces.sort((a, b) => b.z - a.z).forEach(f => p.poly(f.pts, f.c));
      // floor reflection stripe + title
      p.rect(0, 104, W, 1, '#405080');
      const s = seg(t, 1, 2.5); if (s > 0) caption(p, 106, 'JACKOS 98', 'w', 2);
      if (t > 4) caption(p, 4, ['NOW IN 3D', 'NOW IN 3D', 'POLYGONS: 66', 'FRAMES PER SEC: 25', 'RENDERED OVERNIGHT'][Math.floor(t / 3) % 5], 'c', 1);
      if (t > 18.5) fade(p, seg(t, 18.5, 20), 'k');
    } };

  // ---------------------------------------------------------------- clock.avi: the famous one (ours)
  V.clock = { title: 'clock.avi', file: 'clock.avi', dur: 24, codec: 'Blobbit RLE', fps: 10,
    sound: [...Array.from({ length: 20 }, (_, i) => beep(i + 0.5, i % 2 ? 1800 : 1500, 0.03, 'square')), ...[20.5, 20.8, 21.1, 21.4, 21.7, 22.0, 22.3, 22.6].flatMap(t0 => [beep(t0, 2200, 0.08, 'square'), beep(t0 + 0.15, 2600, 0.08, 'square')])],
    draw(p, t) {
      p.fill('#c8c0a8'); p.dither(0, 0, W, H, '#b8b098');
      const ring = t >= 20.5, shake = ring ? Math.round(Math.sin(t * 60) * 2) : 0;
      const cx = 80 + shake, cy = 66;
      // bells and legs
      p.disc(cx - 30, cy - 36, 9, 'Y').disc(cx - 30, cy - 36, 7, 'y').disc(cx + 30, cy - 36, 9, 'Y').disc(cx + 30, cy - 36, 7, 'y');
      p.rect(cx - 3, cy - 48, 6, 6, 'A'); p.rect(cx - 10, cy - 43, 20, 3, 'A');
      p.line(cx - 22, cy + 36, cx - 30, cy + 50, 'A').line(cx - 21, cy + 36, cx - 29, cy + 50, 'A').line(cx + 22, cy + 36, cx + 30, cy + 50, 'A').line(cx + 21, cy + 36, cx + 29, cy + 50, 'A');
      // body
      p.disc(cx, cy, 42, 'R').disc(cx, cy, 39, 'r').disc(cx, cy, 34, 'u').disc(cx, cy, 32, 'w');
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const r0 = i % 3 ? 28 : 26; p.line(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0, cx + Math.sin(a) * 30, cy - Math.cos(a) * 30, 'k'); }
      ['12', '3', '6', '9'].forEach((n, i) => { const a = i / 4 * Math.PI * 2; p.text(cx + Math.sin(a) * 22 - (n.length * 2), cy - Math.cos(a) * 22 - 2, n, 'k'); });
      const sec = Math.floor(t), sa = (sec / 60) * Math.PI * 2, ma = (11.5 / 12 + sec / 3600) * Math.PI * 2 + Math.PI * 2 * (0.9 / 12), ha = (11 / 12) * Math.PI * 2 + 0.05;
      p.line(cx, cy, cx + Math.sin(ha) * 14, cy - Math.cos(ha) * 14, 'k').line(cx + 1, cy, cx + 1 + Math.sin(ha) * 14, cy - Math.cos(ha) * 14, 'k');
      p.line(cx, cy, cx + Math.sin(ma) * 22, cy - Math.cos(ma) * 22, 'k');
      p.line(cx, cy, cx + Math.sin(sa) * 26, cy - Math.cos(sa) * 26, 'r');
      p.disc(cx, cy, 2, 'k');
      if (ring) { // zig-zag ring lines and a little "RING!"
        const R = rng(Math.floor(t * 10)); for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2; p.line(cx + Math.sin(a) * 46, cy - Math.cos(a) * 46, cx + Math.sin(a) * 56, cy - Math.cos(a) * 56, 'k'); }
        caption(p, 6, Math.floor(t * 4) % 2 ? 'RING! RING!' : 'RING!!!', 'r', 2);
      } else if (t < 3) caption(p, 6, 'CLOCK.AVI', 'k', 2); else if (t > 17) caption(p, 6, 'ALMOST...', 'A', 1);
      caption(p, 108, ring ? 'TIME TO GET UP' : 'TICK ... TOCK', 'k', 1);
    } };

  // ---------------------------------------------------------------- static: unknown file
  V.static = { title: 'Unknown video', file: '???', dur: 12, codec: 'Unknown', fps: 10,
    sound: [...Array.from({ length: 24 }, (_, i) => ({ t: i * 0.5, f: 90 + (i % 3) * 20, d: 0.4, type: 'sawtooth', v: 0.03 }))],
    draw(p, t) {
      const R = rng(Math.floor(t * 12) * 7 + 1);
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = (R() * 255) | 0; p.rect(x, y, 2, 2, `rgb(${v},${v},${v})`); }
      const band = (t * 40) % (H + 20) - 10; p.rect(0, band, W, 6, '#222');
      caption(p, 52, 'NO SIGNAL', 'w', 2, 'k'); if (t > 3) caption(p, 72, 'CODEC NOT FOUND', 'c', 1, 'k');
    } };

  // ---------------------------------------------------------------- rocket launch.mpg
  V.rocket = { title: 'Rocket Launch', file: 'rocket launch.mpg', dur: 26, codec: 'MPEG-1 (Jack edition)', fps: 15,
    sound: [...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n, i) => beep(i + 0.5, 880, 0.12)), beep(10.5, 1320, 0.5, 'square'), ...Array.from({ length: 50 }, (_, i) => ({ t: 10.6 + i * 0.25, f: 50 + (i % 4) * 6, d: 0.3, type: 'sawtooth', v: 0.05 })),
      ...mel(13, 0.16, 'C5 E5 G5 C6 . G5 C6 E6 . C6 E6 G6 - - . . D5 F5 A5 D6 . A5 D6 F6 . D6 F6 A6 - - . . E5 G5 B5 E6 . B5 E6 G6 . E6 G6 B6 - - . . C6 - G5 - E5 - C5 - - - - -', 'triangle')],
    draw(p, t) {
      const lift = t > 10.5 ? Math.pow(t - 10.5, 1.8) * 4 : 0;
      p.vgrad(0, H, lift > 60 ? '#000010' : '#1030a0', lift > 60 ? '#102040' : '#60b0ff');
      if (lift > 40) p.stars(40, 4);
      const groundY = H - 16 + Math.min(lift, 200);
      if (groundY < H + 10) { p.rect(0, groundY, W, H - groundY + 10, 'g'); p.rect(0, groundY, W, 2, 'l'); p.rect(100, groundY - 40, 6, 40, 'a').rect(96, groundY - 40, 14, 3, 'A'); p.box(10, groundY - 14, 30, 14, 'e', 'k').text(14, groundY - 10, 'LAUNCH', 'k'); }
      const rx = 70 + (lift > 0 ? Math.round(Math.sin(t * 30) * (lift < 30 ? 1 : 0)) : 0), ry = groundY - 48 - Math.min(lift, 200) + (lift > 200 ? 0 : 0);
      const rocketY = clamp(groundY - 48, 20, 999) - (lift > 0 ? Math.min(lift, groundY - 68) : 0);
      p.spr(rx, rocketY, ROCKET, null, 4);
      if (lift > 0) { const R = rng(Math.floor(t * 20)); for (let i = 0; i < 14; i++) { const fx = rx + 10 + R() * 20, fy = rocketY + 48 + R() * (14 + Math.min(lift, 40)); p.disc(fx, fy, 2 + R() * 3, R() > 0.5 ? 'o' : 'y'); } for (let i = 0; i < 10; i++) p.disc(rx + 4 + R() * 32, rocketY + 60 + R() * 30, 4 + R() * 5, R() > 0.5 ? 'e' : 'w'); }
      if (t < 10.5) { caption(p, 6, 'T MINUS ' + (10 - Math.floor(t)), 'w', 2, 'i'); if (t > 2) caption(p, 104, ['ALL SYSTEMS GO', 'HAMSTER SECURED', 'MOM HAS BEEN TOLD', 'FUEL: FIZZY POP'][Math.floor(t / 2.5) % 4], 'y', 1); }
      else if (t < 13) caption(p, 6, 'LIFT OFF!', 'y', 3, 'i');
      else if (t < 20) caption(p, 6, 'WE HAVE LIFT OFF', 'w', 2, 'i');
      else { caption(p, 6, 'NEXT STOP: THE MOON', 'w', 2, 'i'); caption(p, 104, '(384,000 KM. PACK A LUNCH)', 'y', 1); }
      if (t > 24.5) fade(p, seg(t, 24.5, 26), 'k');
    } };

  C._vid = { V, mel, sfx, beep, grot, squig, robo, caption, blocky, fade, rng, seg, ease, lerp, clamp, W, H, GROT, SQUIG, MODEM };
})();
/* ---- videos, part 2: the films */
(function () {
  const C = window.Carta; if (!C || !C._vid) return;
  const { V, mel, sfx, beep, grot, squig, robo, caption, blocky, fade, rng, seg, ease, lerp, clamp, W, H, MODEM } = C._vid;

  // a reusable "title card" scene: black with big words that punch in
  function card(p, t, t0, lines, col, size, t1) {
    if (t < t0 || (t1 && t >= t1)) return false;
    const k = ease(seg(t, t0, t0 + 0.3)); const s = size || 2;
    lines.forEach((l, i) => { const y = Math.round(H / 2 - (lines.length * (5 * s + 4)) / 2 + i * (5 * s + 4)); const tw = p.textW(l, s); p.text(Math.round((W - tw) / 2 + (1 - k) * 60 * (i % 2 ? 1 : -1)), y, l, col || 'w', s); });
    return true;
  }
  function room(p) { // a 1999 bedroom: wall, desk, beige PC, CRT
    p.vgrad(0, 70, '#6a7fb0', '#8ea3d0'); p.rect(0, 70, W, 50, '#7a5a3a'); p.dither(0, 70, W, 50, '#6a4a2a');
    p.rect(20, 56, 120, 6, 'N').rect(24, 62, 4, 40, 'N').rect(132, 62, 4, 40, 'N');
    p.rect(60, 24, 44, 32, 'd').rect(64, 28, 36, 24, 'k').rect(70, 48, 24, 6, 'd').rect(60, 54, 44, 2, 'D');
    p.rect(108, 36, 16, 20, 'd').rect(110, 40, 12, 2, 'A').rect(110, 44, 12, 2, 'A');
    p.rect(36, 50, 20, 5, 'e').rect(26, 44, 10, 6, 'd');
  }
  // ---------------------------------------------------------------- TRAILER - DIAL TONE.mpg
  V.trailer = { title: 'DIAL TONE (trailer)', file: 'TRAILER - DIAL TONE.mpg', dur: 44, codec: 'MPEG-1 (Jack edition)', fps: 15,
    sound: [beep(0.5, 55, 1.5, 'sine'), beep(3, 55, 1.5, 'sine'), beep(6, 65, 1.5, 'sine'),
      sfx(9.5, 'modem'),
      ...mel(18, 0.14, 'E4 . E4 . G4 . A4 . E4 . E4 . C5 . B4 . E4 . E4 . G4 . A4 . D5 - C5 B4 A4 G4 E4 .', 'sawtooth', 0.08),
      ...mel(23, 0.14, 'E4 . E4 . G4 . A4 . E4 . E4 . C5 . B4 . E5 - - - D5 - - - C5 - B4 - A4 - - -', 'sawtooth', 0.08),
      beep(29.5, 110, 2, 'sine'), beep(31, 1000, 0.1), beep(31.3, 1000, 0.1), beep(31.6, 1000, 0.1),
      ...mel(33, 0.18, 'E5 B4 G4 E4 - - - - E5 B4 G4 E4 - - - -', 'triangle'),
      beep(42, 440, 0.12), beep(42.3, 440, 0.12), beep(42.6, 440, 0.12), beep(42.9, 440, 0.12)],
    draw(p, t) {
      p.fill('k');
      if (t < 9) { card(p, t, 0.5, ['IN A WORLD...'], 'w', 2, 3); card(p, t, 3, ['WHERE ONE PHONE LINE'], 'w', 2, 6); card(p, t, 6, ['MUST BE SHARED'], 'c', 2); return; }
      if (t < 18) { // the boy, the modem, the download bar
        room(p); const k = seg(t, 9.5, 17.5);
        p.spr(60, 64, MODEM, null, 1); for (let i = 0; i < 4; i++) p.px(63 + i * 3, 66, (Math.floor(t * 8 + i) % 3) ? 'g' : 'G');
        p.rect(66, 30, 32, 20, 'w'); p.rect(68, 32, 28, 4, 'B'); p.text(69, 33, 'DOWNLOAD', 'w'); p.rect(68, 40, 28, 5, 'e'); p.rect(69, 41, Math.round(26 * k * 0.4), 3, 'B'); p.text(68, 46, Math.round(k * 40) + '% 2.1KB/S', 'k');
        grot(p, 112, 72, 2, Math.floor(t * 2) % 2, { g: '#f2c79a', G: '#c8956a', n: '#2a7ad8', k: '#000', w: '#fff' });
        caption(p, 4, 'ONE BOY. ONE JPEG.', 'w', 2, 'k'); if (t > 13) caption(p, 108, '640 X 480. 90 KILOBYTES.', 'y', 1, 'k');
        return;
      }
      if (t < 29) { // peril: Mom picks up the phone
        room(p); const ph = seg(t, 18, 20);
        p.rect(66, 30, 32, 20, 'w'); p.rect(68, 32, 28, 4, 'B'); p.text(69, 33, 'DOWNLOAD', 'w'); p.rect(68, 40, 28, 5, 'e'); p.rect(69, 41, 24, 3, 'B'); p.text(68, 46, '97%  0.0KB/S', 'r');
        grot(p, 112, 72, 2, Math.floor(t * 4) % 2, { g: '#f2c79a', G: '#c8956a', n: '#2a7ad8', k: '#000', w: '#fff' });
        // a hand with a phone slides in from the left
        const hx = Math.round(lerp(-30, 6, ease(ph))); p.rect(hx, 40, 22, 8, 's').rect(hx + 18, 30, 6, 20, 'A').rect(hx + 16, 28, 10, 4, 'A').rect(hx + 16, 48, 10, 4, 'A');
        if (t > 20.5 && Math.floor(t * 3) % 2) caption(p, 60, 'HELLO? HELLO?', 'w', 1, 'k');
        caption(p, 4, t < 24 ? 'SOMEBODY PICKED UP' : 'THIS SUMMER', 'r', 2, 'k'); if (t > 24) caption(p, 108, 'THE LINE... IS ENGAGED', 'y', 1, 'k');
        if (t > 26) { fade(p, seg(t, 26, 28), 'k'); }
        if (t > 28) card(p, t, 28, ['DIAL TONE'], 'w', 3);
        return;
      }
      if (t < 36) { card(p, t, 29, ['DIAL TONE'], 'w', 3); if (t > 31) caption(p, 90, 'RATED U. CONTAINS MODEMS.', 'c', 1); if (t > 33) caption(p, 104, 'COMING TO A SCREEN NEAR YOU', 'y', 1); return; }
      if (t < 41.5) { // credits
        const y0 = Math.round(H - (t - 36) * 34);
        ['A JACKATTACK PICTURE', '', 'STARRING', 'JACK  AS  THE BOY', 'MOM  AS  MOM', 'GUBBINZ  AS  HIMSELF', '', 'MODEM BY  JACKNET 56K', 'NO JPEGS WERE HARMED', '', 'THE END'].forEach((l, i) => { const y = y0 + i * 10; if (y > -6 && y < H) caption(p, y, l, i === 10 ? 'y' : 'e', 1); });
        return;
      }
      // the stinger
      p.fill('k'); if (t > 41.8) { p.rect(66, 50, 32, 20, 'w'); p.rect(68, 52, 28, 4, 'B'); p.text(69, 53, 'DOWNLOAD', 'w'); p.rect(68, 60, 28, 5, 'e'); p.rect(69, 61, 26, 3, 'g'); p.text(68, 66, '100%  DONE!', 'k'); }
      if (t > 42.6) caption(p, 90, 'IT WAS A PICTURE OF A CAT', 'y', 1);
      if (t > 43.5) caption(p, 102, 'DIAL TONE 2: BUSY SIGNAL', 'c', 1);
    } };

  // ---------------------------------------------------------------- space opera parody trailer (all original)
  V.spaceopera = { title: 'STAR SCRAPS: EPISODE 0 (trailer)', file: 'TRAILER - STAR SCRAPS.mpg', dur: 42, codec: 'MPEG-1 (Jack edition)', fps: 15,
    sound: [...mel(0.5, 0.2, 'G3 - - - G3 - - - G3 - - - D4 - - - - - - -', 'sawtooth', 0.07),
      ...mel(5, 0.16, 'C4 - - C4 G4 - - - C4 - - C4 G4 - - - E4 - - E4 B4 - - - E4 - - E4 B4 - - -', 'sawtooth', 0.07),
      beep(14, 220, 0.5, 'sawtooth'), beep(14.6, 230, 0.5, 'sawtooth'), ...Array.from({ length: 16 }, (_, i) => ({ t: 15 + i * 0.35, f: 160 + (i % 2) * 60, d: 0.25, type: 'sawtooth', v: 0.05 })),
      ...[21, 21.4, 22.1, 22.5, 23.3, 23.7].map(t0 => beep(t0, 90 + Math.random() * 0, 0.2, 'sawtooth')),
      ...mel(27, 0.14, 'G4 - D5 - G5 - - - F#5 - D5 - B4 - - - E5 - - - D5 - C5 - B4 - A4 - G4 - - -', 'square', 0.1),
      ...mel(33, 0.14, 'G4 - D5 - G5 - - - A5 - B5 - G5 - - - D6 - - - - - - - - - - - . . . .', 'square', 0.1),
      beep(40, 110, 1.5, 'sawtooth')],
    draw(p, t) {
      p.fill('k');
      if (t < 5) { p.stars(80, 11); card(p, t, 0.5, ['NOT SO LONG AGO'], 'c', 2, 2.5); card(p, t, 2.5, ['(LAST TUESDAY)'], 'y', 2); return; }
      if (t < 14) { // a huge wedge spaceship flies over, then a tiny round one
        p.stars(80, 11); const k = seg(t, 5, 12);
        const sx = Math.round(lerp(-120, 200, k)), sy = 20; p.poly([[sx, sy], [sx + 110, sy + 22], [sx, sy + 44]], 'a'); p.poly([[sx + 10, sy + 8], [sx + 90, sy + 22], [sx + 10, sy + 36]], 'e'); p.rect(sx + 20, sy + 18, 40, 8, 'A'); for (let i = 0; i < 6; i++) p.px(sx + 30 + i * 8, sy + 21, 'y');
        if (t > 9) { const bx = Math.round(lerp(180, -20, seg(t, 9, 13.5))); p.disc(bx, 80, 7, 'r'); p.disc(bx, 80, 5, 'h'); p.rect(bx - 2, 76, 4, 2, 'c'); p.rect(bx + 7, 78, 6, 4, 'o'); }
        caption(p, 96, t < 9 ? 'THE GEM EMPIRE HAS RISEN' : 'ONE TINY SHIP STANDS IN ITS WAY', 'w', 1, 'k');
        return;
      }
      if (t < 20) { // a planet of squigs
        p.vgrad(0, H, '#300030', '#801060'); p.stars(30, 12); p.disc(80, 150, 90, 'R'); p.disc(80, 150, 86, 'r');
        const R = rng(8); for (let i = 0; i < 9; i++) { const x = R() * 150, y = 60 + R() * 30, f = Math.floor(t * 5 + i) % 2; squig(p, x, y - (f ? 3 : 0), 2, f); }
        caption(p, 6, 'A PLANET ENTIRELY OF BLOBBITS', 'w', 1, 'k'); caption(p, 104, '(THEY ARE NOT PLEASED)', 'y', 1, 'k');
        return;
      }
      if (t < 27) { // the laser-sword duel: two little robots, green vs red blades
        p.vgrad(0, H, '#101030', '#202050'); p.rect(0, 92, W, 28, 'A'); p.dither(0, 92, W, 28, '#444');
        const k = t - 20, swing = Math.sin(k * 7), lx = 40 + Math.round(Math.sin(k * 1.5) * 10), rx = 110 - Math.round(Math.sin(k * 1.5) * 10);
        robo(p, lx - 10, 72, 2, Math.floor(k * 6) % 2, { e: '#eef2f8', a: '#a8b0bc', A: '#5a6270', y: '#7ff4ff', r: '#3aff6a' }); robo(p, rx - 10, 72, 2, Math.floor(k * 6 + 1) % 2, { e: '#4a4a56', a: '#2a2a32', A: '#111', y: '#ff3030', r: '#ff3030', Y: '#8a1010' });
        const la = -0.6 + swing * 0.5, ra = Math.PI + 0.6 - swing * 0.5;
        p.line(lx + 10, 74, lx + 10 + Math.cos(la) * 34, 74 + Math.sin(la) * 34, 'l'); p.line(lx + 10, 75, lx + 10 + Math.cos(la) * 34, 75 + Math.sin(la) * 34, 'w');
        p.line(rx - 10, 74, rx - 10 + Math.cos(ra) * 34, 74 + Math.sin(ra) * 34, 'h'); p.line(rx - 10, 75, rx - 10 + Math.cos(ra) * 34, 75 + Math.sin(ra) * 34, 'w');
        if (Math.abs(swing) > 0.9) { const R = rng(Math.floor(t * 10)); for (let i = 0; i < 8; i++) p.px(75 + R() * 10, 50 + R() * 12, R() > 0.5 ? 'y' : 'w'); }
        caption(p, 6, 'GLOW-SWORDS WILL CLASH', 'w', 1, 'k'); if (t > 23.5) caption(p, 104, 'A ROBOT WILL CHOOSE A SIDE', 'y', 1, 'k');
        return;
      }
      if (t < 40) { // title
        p.stars(60, 13); const k = ease(seg(t, 27, 28.5)); const s = 2 + Math.round((1 - k) * 4);
        caption(p, 30, 'STAR', 'y', Math.min(s, 3)); caption(p, 52, 'SCRAPS', 'y', Math.min(s, 3));
        if (t > 30) caption(p, 80, 'EPISODE 0: THE BLOBBIT MENACE', 'w', 1);
        if (t > 33) caption(p, 96, 'ONLY IN BEDROOMS. SUMMER 1999.', 'c', 1);
        if (t > 36) caption(p, 108, 'TOYS SOLD SEPARATELY. OBVIOUSLY.', 'e', 1);
        return;
      }
      if (t > 40) { p.fill('k'); caption(p, 56, 'MAY THE SCRAPS BE WITH YOU', 'g', 1); }
    } };

  // ---------------------------------------------------------------- Gubbinz cartoon: Squig Trouble
  V.cartoon = { title: 'Gubbinz in: Robot Trouble', file: 'Gubbinz Cartoon - Squig Trouble.avi', dur: 36, codec: 'JackOS Video 1', fps: 12,
    sound: [...mel(0.3, 0.12, 'C5 E5 G5 C6 G5 E5 C5 . G5 . E5 . C5 - - .', 'square', 0.1),
      ...Array.from({ length: 14 }, (_, i) => beep(4 + i * 0.45, 300 + (i % 2) * 150, 0.05, 'triangle')),
      ...Array.from({ length: 20 }, (_, i) => beep(11 + i * 0.3, 500 + (i % 3) * 120, 0.05, 'square')),
      sfx(17.5, 'boing'), sfx(18.2, 'boing'), sfx(19.4, 'thud'), sfx(23.5, 'uhoh'),
      ...mel(27, 0.12, 'G5 . G5 . A5 . G5 . E5 - - - C5 . E5 . G5 - - - C6 - - -', 'square', 0.1),
      sfx(31, 'pet'), ...mel(33, 0.14, 'C5 E5 G5 C6 - - - -', 'triangle')],
    draw(p, t) {
      // outdoors: sky, hills, ground
      p.vgrad(0, 70, '#60b0ff', '#b0e0ff'); p.disc(30, 110, 60, 'l'); p.disc(130, 120, 70, 'l'); p.rect(0, 88, W, 32, 'g'); p.rect(0, 88, W, 2, 'l');
      p.disc(140, 16, 9, 'y'); for (let i = 0; i < 3; i++) p.disc(20 + i * 50, 22 + (i % 2) * 8, 8, 'w').disc(30 + i * 50, 20 + (i % 2) * 8, 6, 'w');
      const f = Math.floor(t * 8) % 2;
      if (t < 4) { // title
        p.rect(14, 30, 132, 40, 'y').rect(16, 32, 128, 36, 'r'); caption(p, 36, 'GUBBINZ IN:', 'w', 1); caption(p, 48, 'ROBOT TROUBLE', 'w', 2);
        return;
      }
      if (t < 11) { // Gubbinz sneaks up on a sleeping squig
        const gx = Math.round(lerp(-30, 60, seg(t, 4, 10)));
        robo(p, 110, 68, 2, 0); if (Math.floor(t * 2) % 2) p.text(130, 56, 'Z', 'k'); else p.text(134, 50, 'Z', 'k', 2);
        grot(p, gx, 56, 2, f); caption(p, 6, 'SHHH...', 'k', 1);
        return;
      }
      if (t < 17) { // the chase (squig leads, Gubbinz behind), scrolling scenery
        const sc = Math.round((t - 11) * 30) % 40; for (let i = -1; i < 5; i++) p.rect(i * 40 - sc, 84, 6, 4, 'G');
        const bob = Math.abs(Math.sin(t * 12)) * 6;
        robo(p, 100 + Math.round(Math.sin(t * 2) * 8), 68 - bob, 2, f); grot(p, 50 + Math.round(Math.sin(t * 2 + 1) * 6), 56, 2, f);
        caption(p, 6, 'WAIT! COME BACK!', 'k', 1); if (Math.floor(t * 3) % 2) p.text(132, 60, '!', 'r', 2);
        return;
      }
      if (t < 24) { // squig bounces over a fence; Gubbinz runs into it
        p.rect(100, 70, 4, 20, 'n').rect(112, 70, 4, 20, 'n').rect(96, 74, 24, 3, 'n').rect(96, 82, 24, 3, 'n');
        const sk = seg(t, 17, 19.5); const sx = lerp(70, 140, sk), sy = 74 - Math.sin(sk * Math.PI) * 40; robo(p, sx, sy, 2, f);
        const gk = seg(t, 18, 19.4); const gx = lerp(30, 84, gk);
        if (t < 19.4) grot(p, gx, 56, 2, f); else { grot(p, 80, 72, 2, 0); p.rect(76, 92, 32, 4, 'A'); const R = rng(Math.floor(t * 6)); for (let i = 0; i < 5; i++) p.text(70 + R() * 40, 50 + R() * 16, '*', 'y'); }
        if (t > 19.4) caption(p, 6, 'OOF.', 'k', 2);
        return;
      }
      if (t < 32) { // the squig comes back and sits on his head
        grot(p, 74, 56, 2, 0); const k = ease(seg(t, 24, 27)); robo(p, lerp(150, 76, k), lerp(68, 40, k) - Math.sin(k * Math.PI * 3) * 10, 2, f);
        if (t > 27.5) caption(p, 6, 'OH. HELLO.', 'k', 1); if (t > 30) caption(p, 104, 'THE END', 'w', 2, 'r');
        return;
      }
      p.fill('k'); caption(p, 40, 'THE END', 'w', 3); caption(p, 70, 'NO ROBOTS WERE HARMED', 'e', 1); caption(p, 80, 'ONE GUBBINZ WAS, A BIT', 'e', 1);
    } };

  // ---------------------------------------------------------------- dancing grot.avi (loops nicely)
  V.grotdance = { title: 'Dancing Gubbinz', file: 'dancing grot.avi', dur: 24, codec: 'Blobbit RLE', fps: 12, loop: true,
    sound: [...[0, 6, 12, 18].flatMap(o => mel(o, 0.125, 'E5 . E5 . G5 . E5 . A5 . G5 . E5 . D5 . E5 . E5 . G5 . B5 . A5 - - - G5 . E5 . C5 . C5 . E5 . G5 . A5 . G5 . E5 . D5 - B4 . D5 . E5 - - - - - - .', 'square', 0.1)),
      ...Array.from({ length: 48 }, (_, i) => ({ t: i * 0.5 + 0.02, f: 60, d: 0.1, type: 'sine', v: 0.3 }))],
    draw(p, t) {
      const beat = Math.floor(t * 4), hue = (beat * 47) % 360;
      p.fill(`hsl(${hue},60%,12%)`);
      // disco lights: coloured spots sweeping
      for (let i = 0; i < 5; i++) { const a = t * 1.5 + i * 1.26; p.disc(80 + Math.cos(a) * 60, 50 + Math.sin(a * 1.3) * 30, 12, `hsl(${(hue + i * 70) % 360},80%,45%)`); }
      // dance floor tiles
      for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) p.rect(x * 20, 92 + y * 10, 19, 9, ((x + y + beat) % 2) ? `hsl(${(hue + 180) % 360},70%,55%)` : `hsl(${hue},70%,40%)`);
      // the grot: bobs, waves arms (drawn as extra lines), slides left-right
      const f = beat % 2, gx = 68 + Math.round(Math.sin(t * 2) * 20), gy = 52 - (f ? 6 : 0);
      grot(p, gx, gy, 3, f);
      const ay = f ? -10 : 6; p.line(gx + 4, gy + 30, gx - 10, gy + 30 + ay, 'g').line(gx + 4, gy + 31, gx - 10, gy + 31 + ay, 'g'); p.line(gx + 32, gy + 30, gx + 46, gy + 30 - ay, 'g').line(gx + 32, gy + 31, gx + 46, gy + 31 - ay, 'g');
      // a glitter ball
      p.disc(80, 8, 7, 'e'); p.dither(73, 1, 14, 14, 'w', beat); p.rect(80, 0, 1, 2, 'a');
      caption(p, 108, ['DANCE DANCE DANCE', 'EVERYBODY BOOGIE', 'DO THE ROBOT', 'MOVE YOUR FEET'][Math.floor(t / 6) % 4], 'w', 1);
    } };

  // ---------------------------------------------------------------- bloopers (hidden)
  V.blooper = { title: 'DO NOT WATCH (bloopers)', file: 'DO NOT WATCH (bloopers).avi', dur: 30, codec: 'JackOS Video 1', fps: 12, hidden: true,
    sound: [beep(1, 440, 0.3, 'triangle'), sfx(6, 'thud'), sfx(9, 'uhoh'), sfx(14.5, 'boing'), sfx(17, 'boing'), sfx(19, 'thud'), sfx(24, 'waaagh'), ...mel(27, 0.14, 'C5 E5 G5 C6 - - - -', 'triangle')],
    draw(p, t) {
      p.fill('k');
      const slate = (t0, n) => { if (t >= t0 && t < t0 + 2) { p.box(40, 30, 80, 50, 'w', 'k'); p.rect(40, 30, 80, 10, 'k'); for (let i = 0; i < 8; i++) if (i % 2) p.rect(40 + i * 10, 30, 10, 10, 'w'); p.text(46, 46, 'TAKE ' + n, 'k', 2); p.text(46, 64, 'SCENE 4', 'k'); return true; } return false; };
      if (slate(0, 1)) return;
      if (t < 9) { p.vgrad(0, 70, '#60b0ff', '#b0e0ff'); p.rect(0, 88, W, 32, 'g'); grot(p, 60, 56, 2, Math.floor(t * 6) % 2); if (t > 5.5) { p.rect(0, 40, W, 50, 'g'); caption(p, 50, '(THE SET FELL OVER)', 'w', 1, 'k'); } caption(p, 6, 'ACTION!', 'w', 1); return; }
      if (slate(9, 2)) return;
      if (t < 20) { p.vgrad(0, 70, '#60b0ff', '#b0e0ff'); p.rect(0, 88, W, 32, 'g'); const f = Math.floor(t * 8) % 2; robo(p, 40 + Math.round((t - 11) * 14) % 140, 68 - Math.abs(Math.sin(t * 10)) * 10, 2, f); grot(p, 20, 56, 2, 0); caption(p, 6, 'THE ROBOT WILL NOT SIT STILL', 'w', 1, 'k'); if (t > 18.5) caption(p, 104, 'CUT! CUT!', 'r', 2, 'k'); return; }
      if (slate(20, 3)) return;
      if (t < 27) { p.vgrad(0, 70, '#60b0ff', '#b0e0ff'); p.rect(0, 88, W, 32, 'g'); grot(p, 60, 56, 3, Math.floor(t * 4) % 2); if (t > 23.5) { const R = rng(Math.floor(t * 8)); for (let i = 0; i < 6; i++) p.text(30 + R() * 100, 20 + R() * 30, 'WAAAGH', 'r', 1); } caption(p, 6, 'GUBBINZ FORGOT HIS LINE', 'w', 1, 'k'); if (t > 23.5) caption(p, 104, '(HE ONLY HAS ONE)', 'y', 1, 'k'); return; }
      caption(p, 50, 'BLOOPERS: THE END', 'w', 2); caption(p, 70, 'PLEASE DO NOT TELL MOM', 'e', 1);
    } };

  // ---------------------------------------------------------------- D:\VIDEOS\INTRO.AVI (needs the JKAT codec)
  V.jaintro = { title: 'JACK ATTACK! Cover Disc Intro', file: 'INTRO.AVI', dur: 20, codec: 'JKAT Video (installed)', fps: 15, disc: true,
    sound: [sfx(0.2, 'crt'), ...mel(1, 0.11, 'C5 C5 G5 G5 A5 A5 G5 - F5 F5 E5 E5 D5 D5 C5 - G5 G5 F5 F5 E5 E5 D5 - G5 G5 F5 F5 E5 E5 D5 - C5 C5 G5 G5 A5 A5 G5 - F5 F5 E5 E5 D5 D5 C5 -', 'square', 0.1), sfx(9, 'waaagh'), ...mel(12, 0.11, 'C6 . G5 . E5 . C5 . E5 . G5 . C6 - - - D6 . A5 . F5 . D5 . F5 . A5 . D6 - - -', 'square', 0.1), sfx(18, 'solve')],
    draw(p, t) {
      if (t < 1) { p.fill('k'); const k = seg(t, 0, 1); p.rect(0, H / 2 - k * 60, W, k * 120, 'w'); return; }
      const R = rng(Math.floor(t * 6)); p.fill('v'); for (let i = 0; i < 30; i++) p.px(R() * W, R() * H, 'm');
      // spinning CD
      const cx = 40, cy = 60, a = t * 3; p.disc(cx, cy, 26, 'e'); for (let i = 0; i < 12; i++) { const an = a + i * 0.52; p.line(cx + Math.cos(an) * 8, cy + Math.sin(an) * 8, cx + Math.cos(an) * 25, cy + Math.sin(an) * 25, ['p', 'c', 'u', 'w'][i % 4]); } p.disc(cx, cy, 7, 'A'); p.disc(cx, cy, 3, 'k');
      const k = ease(seg(t, 1.2, 2.2)); const tx = Math.round(lerp(200, 74, k));
      p.text(tx, 30, 'JACK', 'y', 4); p.text(tx, 54, 'ATTACK!', 'r', 3);
      if (t > 3) caption(p, 84, 'COVER DISC #7', 'w', 2);
      if (t > 9 && t < 12) { grot(p, 120, 70, 3, Math.floor(t * 8) % 2); p.text(110, 60, 'WAAAGH!', 'w', 1); }
      if (t > 12) caption(p, 104, ['DEMOS * EXTRAS * VIDEOS', 'BURNED AT RYANS HOUSE', 'BLOW ON IT IF IT STICKS'][Math.floor((t - 12) / 2.5) % 3], 'c', 1, 'k');
      if (t > 18.5) fade(p, seg(t, 18.5, 20), 'k');
      blocky(p, t, 0.15);
    } };

  // ---------------------------------------------------------------- D:\VIDEOS\MAKING OF.AVI
  V.makingof = { title: 'The Making Of JACK ATTACK!', file: 'MAKING OF.AVI', dur: 40, codec: 'JKAT Video (installed)', fps: 12, disc: true,
    sound: [...mel(0.5, 0.2, 'G4 B4 D5 G5 - - D5 - E5 - - - D5 - - -', 'triangle'), ...Array.from({ length: 40 }, (_, i) => beep(6 + i * 0.22, 1200 + ((i * 7) % 5) * 100, 0.02, 'square')), sfx(17, 'uhoh'), ...Array.from({ length: 12 }, (_, i) => beep(22 + i * 0.3, 800, 0.03, 'square')), sfx(30, 'solve'), ...mel(34, 0.16, 'C5 E5 G5 C6 E6 - - - D6 - C6 - - - - -', 'triangle')],
    draw(p, t) {
      if (t < 5) { p.fill('i'); caption(p, 30, 'THE MAKING OF', 'w', 2); caption(p, 50, 'JACK ATTACK! ONLINE', 'y', 2); caption(p, 90, 'A DOCUMENTARY (4 MINUTES, CUT TO 40 SECONDS)', 'e', 1); return; }
      room(p);
      const typing = Math.floor(t * 9) % 2;
      // Jack at the keyboard: a kid-coloured grot sprite with brown hair, typing
      grot(p, 100, 60, 2, typing, { g: '#f2c79a', G: '#c8956a', n: '#2a7ad8', k: '#000', w: '#fff' }); p.rect(102, 58, 20, 6, 'n');
      // the screen shows HTML being typed
      p.rect(64, 28, 36, 24, 'k'); const lines = ['<HTML>', '<BODY>', '<H1>JACK', 'ATTACK!', '</H1>', '<BLINK>'];
      lines.slice(0, Math.min(6, Math.floor((t - 5) / 1.5))).forEach((l, i) => p.text(66, 30 + i * 4, l, 'l', 1 / 1));
      if (t > 6 && t < 17) caption(p, 4, 'STEP 1: TYPE THE WHOLE INTERNET', 'w', 1, 'k');
      if (t >= 17 && t < 22) { p.rect(64, 28, 36, 24, 'B'); p.text(66, 32, 'A FATAL', 'w'); p.text(66, 38, 'EXCEPTION', 'w'); p.text(66, 44, 'HAS', 'w'); caption(p, 4, 'STEP 2: LOSE IT ALL', 'r', 1, 'k'); }
      if (t >= 22 && t < 30) { caption(p, 4, 'STEP 3: TYPE IT ALL AGAIN', 'w', 1, 'k'); }
      if (t >= 30 && t < 34) { p.rect(64, 28, 36, 24, 'w'); p.text(66, 32, 'JACK', 'r', 2); p.text(66, 42, 'ATTACK', 'B'); caption(p, 4, 'STEP 4: IT WORKS!', 'y', 2, 'k'); }
      if (t >= 34) { caption(p, 4, 'STEP 5: TELL EVERYBODY', 'w', 1, 'k'); caption(p, 104, 'THANKS FOR WATCHING', 'y', 1, 'k'); }
      if (t > 38.5) fade(p, seg(t, 38.5, 40), 'k');
      blocky(p, t, 0.12);
    } };
})();
/* ---- the player itself */
(function () {
  const C = window.Carta, A = window.Apps; if (!C || !C._vid) return;
  const { h, esc } = C;
  const { V, W, H } = C._vid;
  const ORDER = ['welcome', 'logo3d', 'clock', 'trailer', 'spaceopera', 'cartoon', 'grotdance', 'rocket', 'jaintro', 'makingof', 'blooper'];
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const SYM = { prev: '<svg viewBox="0 0 12 10"><path d="M1 1h2v8H1zM11 1L4 5l7 4z"/></svg>', rew: '<svg viewBox="0 0 12 10"><path d="M6 1L1 5l5 4zM11 1L6 5l5 4z"/></svg>', play: '<svg viewBox="0 0 12 10"><path d="M2 1l8 4-8 4z"/></svg>', pause: '<svg viewBox="0 0 12 10"><path d="M2 1h3v8H2zM7 1h3v8H7z"/></svg>', stop: '<svg viewBox="0 0 12 10"><path d="M2 1h8v8H2z"/></svg>', ff: '<svg viewBox="0 0 12 10"><path d="M1 1l5 4-5 4zM6 1l5 4-5 4z"/></svg>', next: '<svg viewBox="0 0 12 10"><path d="M9 1h2v8H9zM1 1l7 4-7 4z"/></svg>', list: '<svg viewBox="0 0 12 10"><path d="M1 2h10v1H1zM1 5h10v1H1zM1 8h10v1H1z"/></svg>', full: '<svg viewBox="0 0 12 10"><path d="M1 1h4v1H2v3H1zM7 1h4v4h-1V2H7zM1 5h1v3h3v1H1zM10 5h1v4H7V8h3z"/></svg>', mute: '<svg viewBox="0 0 12 10"><path d="M1 3h2l3-2v8L3 7H1z"/><path d="M8 3l3 4M11 3L8 7" stroke="#000" fill="none"/></svg>', spk: '<svg viewBox="0 0 12 10"><path d="M1 3h2l3-2v8L3 7H1z"/><path d="M8 3q2 2 0 4M9.5 1.5q3 3.5 0 7" stroke="#000" fill="none"/></svg>' };

  function fileNodes() { // every .avi/.mpg on the C: drive (hidden ones only once found)
    const out = []; (function walk(n, path) { (n.kids || []).forEach(k => { const p = path + '\\' + k.name; if ((k.type === 'avi' || k.type === 'mpg') && (!k.hidden || A.found['carta.blooper'])) out.push([k, p]); if (k.type === 'dir') walk(k, p); }); })(A.fs.root, 'C:'); return out;
  }

  C.mods.mplayer = function (w, arg) {
    const b = h('div', 'ct-m');
    b.innerHTML = `<div class="ct-m-main"><div class="ct-m-screen"><canvas class="ct-m-cv ct-px" width="${W}" height="${H}"></canvas><div class="ct-m-osd"></div></div>
        <div class="ct-m-seek"><div class="ct-m-track"><div class="ct-m-fill"></div><div class="ct-m-thumb"></div></div></div>
        <div class="ct-m-ctl">${['prev', 'rew', 'play', 'stop', 'ff', 'next'].map(k => `<button class="btn ct-m-b" data-a="${k}" aria-label="${k}">${SYM[k]}</button>`).join('')}<span class="ct-m-time mono">0:00 / 0:00</span><button class="btn ct-m-b ct-m-mute" data-a="mute" aria-label="Mute">${SYM.spk}</button><input type="range" class="ct-m-vol" min="0" max="100" value="${C.store.get('mvol', 80)}" aria-label="Volume"><button class="btn ct-m-b" data-a="list" aria-label="Playlist">${SYM.list}</button><button class="btn ct-m-b" data-a="full" aria-label="Full screen">${SYM.full}</button></div></div>
      <div class="ct-m-pl"><div class="ct-m-plh">Playlist</div><div class="field ct-m-pll"></div></div>`;
    w.body.appendChild(b);
    const q = s => b.querySelector(s), cv = q('.ct-m-cv'), g = cv.getContext('2d'), osd = q('.ct-m-osd'), screen = q('.ct-m-screen'), pl = q('.ct-m-pl'), pll = q('.ct-m-pll');
    const P = C.art.Painter(g, W, H);
    const st = { id: null, node: null, t: 0, playing: false, prevT: 0, raf: 0, last: 0, repeat: false, muted: false, vol: C.store.get('mvol', 80), hinted: false, plOpen: C.store.get('mpl', !C.mobile()), ended: false, favs: C.store.get('mfav', []) };
    const seen = new Set(C.store.get('mseen', []));
    let fsSecretTimer = 0;

    // ---- rendering
    function draw() {
      const v = V[st.id]; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (v) { try { v.draw(P, Math.min(st.t, v.dur), g); } catch (e) { P.fill('k'); P.ctext(50, 'DECODE ERROR', 'r', 2); } }
      q('.ct-m-fill').style.width = v ? (st.t / v.dur * 100) + '%' : '0'; q('.ct-m-thumb').style.left = v ? (st.t / v.dur * 100) + '%' : '0';
      q('.ct-m-time').textContent = fmt(st.t) + ' / ' + fmt(v ? v.dur : 0);
    }
    function fire(t0, t1) { const v = V[st.id]; if (!v || !Sound.on || st.muted) return; for (const e of v.sound) if (e.t > t0 && e.t <= t1) { if (e.sfx) Sound.play(e.sfx); else Sound.note(e.f, e.d, e.type); } }
    function frame(now) {
      if (w.closed) return;
      const v = V[st.id]; if (!v || !st.playing) { st.raf = 0; return; }
      const dt = Math.min(0.25, (now - st.last) / 1000); st.last = now;
      const t0 = st.t; st.t += dt; fire(t0, st.t);
      if (st.id === 'clock' && t0 < 20.5 && st.t >= 20.5) C.secret('alarm');
      if (st.t >= v.dur) {
        if (st.id === 'trailer') C.secret('stinger');
        if (v.loop || st.repeat) { st.t = 0; if (!v.loop && !st.repeat) {} if (!v.loop && st.repeat) return next(1, true); }
        else { st.t = v.dur; st.playing = false; st.ended = true; status('Finished'); setPlayIcon(); draw(); const lst = ORDER.filter(okId); if (lst.indexOf(st.id) < lst.length - 1 && C.store.get('mauto', true)) setTimeout(() => { if (!w.closed && st.ended) next(1, true); }, 1500); return; }
      }
      draw(); st.raf = requestAnimationFrame(frame);
    }
    const okId = id => V[id] && (!V[id].hidden || A.found['carta.blooper']) && (!V[id].disc || seen.has(id));
    const status = t => { w.status.textContent = t; };
    const setPlayIcon = () => { q('[data-a=play]').innerHTML = st.playing ? SYM.pause : SYM.play; };
    function fit() { // keep 4:3 inside the black screen area
      const r = screen.getBoundingClientRect(); if (!r.width) return;
      const s = Math.min(r.width / W, r.height / H); cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
    }

    // ---- loading / transport
    function load(x, autoplay) {
      let id = typeof x === 'string' ? x : (x && x.video) || 'static';
      if (!V[id]) id = 'static';
      const node = typeof x === 'object' && x ? x : null;
      const v = V[id];
      if (v.disc && !C.store.get('codec', false)) return installCodec(() => { C.store.set('codec', true); C.secret('codec'); load(x, autoplay); });
      if (v.disc && !seen.has(id)) { seen.add(id); C.store.set('mseen', [...seen]); }
      st.id = id; st.node = node; st.t = 0; st.prevT = 0; st.ended = false;
      w.setTitle((node ? node.name : v.file) + ' - JackOS Media Player');
      osd.textContent = ''; renderList(); draw();
      status('Ready: ' + v.title + ' (' + fmt(v.dur) + ')');
      if (autoplay !== false) play();
    }
    function play() {
      if (!st.id) { const first = ORDER.find(okId); return load(first, true); }
      if (st.ended) { st.t = 0; st.ended = false; }
      if (!Sound.on && !st.hinted) { st.hinted = true; C.sfxHint('Media Player'); }
      st.playing = true; st.last = performance.now(); setPlayIcon(); status('Playing ' + V[st.id].title);
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    }
    function pause() { st.playing = false; setPlayIcon(); status('Paused'); }
    function stop() { st.playing = false; st.t = 0; st.ended = false; setPlayIcon(); status('Stopped'); draw(); }
    function seek(t) { const v = V[st.id]; if (!v) return; st.t = Math.max(0, Math.min(v.dur, t)); st.ended = false; draw(); }
    function next(d, auto) { const lst = ORDER.filter(okId); let i = lst.indexOf(st.id); i = (i + d + lst.length) % lst.length; load(lst[i], auto || st.playing); }
    function installCodec(done) {
      const bb = h('div', '', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><span style="width:32px;height:32px;flex:none">${C.ICON.mplayer}</span><span>This video needs the <b>JKAT Video Codec</b>, which is not installed.<br><br>Install it from the cover disc? (Disc, not Internet. The Internet version is 40 MB.)</span></div><div class="prog ct-m-prog" style="margin-top:10px"><span style="display:flex;gap:2px"></span></div><div class="ct-m-cod small" style="margin-top:4px;height:14px"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-c="ok" style="min-width:72px">Install</button><button class="btn" data-c="no" style="min-width:72px">Cancel</button></div>`);
      const d = A.win('Install Codec', bb, { w: 360, noResize: true, noMax: true, noMin: true, icon: C.ICON.mplayer });
      const bar = bb.querySelector('.prog span'), msg = bb.querySelector('.ct-m-cod');
      bb.querySelector('[data-c=no]').addEventListener('click', d.close);
      bb.querySelector('[data-c=ok]').addEventListener('click', () => {
        bb.querySelectorAll('.btn').forEach(x => x.disabled = true); let n = 0;
        const lines = ['Reading D:\\CODECS\\JKAT.DLL...', 'Copying 3 files...', 'Registering codec...', 'Asking Gubbinz to leave the CD alone...', 'Done.'];
        const iv = setInterval(() => { if (d.closed) return clearInterval(iv); n++; bar.innerHTML = '<i></i>'.repeat(Math.min(26, n * 3)); msg.textContent = lines[Math.min(lines.length - 1, Math.floor(n / 2))]; if (n >= 9) { clearInterval(iv); d.close(); Desk.toast('JKAT Video Codec', 'Installed! Videos from the cover disc now work. It only took a year.'); done(); } }, 330);
      });
    }

    // ---- playlist pane
    function renderList() {
      pll.innerHTML = ORDER.filter(okId).map(id => `<div class="xi ct-m-pli${id === st.id ? ' sel' : ''}" data-id="${id}"><span>${esc(V[id].title)}</span><small>${fmt(V[id].dur)}</small></div>`).join('');
      pll.querySelectorAll('.ct-m-pli').forEach(e => { const go = () => load(e.dataset.id, true); e.addEventListener('dblclick', go); e.addEventListener('click', () => { if (matchMedia('(hover:none)').matches) go(); else { pll.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); e.classList.add('sel'); } }); });
      pl.style.display = st.plOpen ? '' : 'none'; q('[data-a=list]').classList.toggle('on', st.plOpen);
      setTimeout(fit, 0);
    }
    function togglePl(v) { st.plOpen = v == null ? !st.plOpen : v; C.store.set('mpl', st.plOpen); renderList(); }

    // ---- full screen
    function fullscreen() {
      const done = () => { if (st.id === 'grotdance') { clearTimeout(fsSecretTimer); fsSecretTimer = setTimeout(() => { if (isFull()) C.secret('fullgrot'); }, 2500); } };
      if (screen.requestFullscreen) screen.requestFullscreen().then(done).catch(() => { w.el.classList.add('maxwin'); screen.classList.add('ct-m-fake'); fit(); done(); });
      else { w.el.classList.add('maxwin'); screen.classList.add('ct-m-fake'); fit(); done(); }
    }
    const isFull = () => document.fullscreenElement === screen || screen.classList.contains('ct-m-fake');
    const onFs = () => { fit(); if (!document.fullscreenElement) screen.classList.remove('ct-m-fake'); };
    document.addEventListener('fullscreenchange', onFs);
    screen.addEventListener('keydown', ev => { if (ev.key === 'Escape') screen.classList.remove('ct-m-fake'); });
    screen.addEventListener('dblclick', () => isFull() ? (document.exitFullscreen ? document.exitFullscreen() : 0, screen.classList.remove('ct-m-fake')) : fullscreen());
    screen.addEventListener('click', ev => { if (isFull() && screen.classList.contains('ct-m-fake')) { screen.classList.remove('ct-m-fake'); fit(); } });

    // ---- controls
    b.querySelectorAll('[data-a]').forEach(btn => btn.addEventListener('click', () => {
      const a = btn.dataset.a; Sound.play('click');
      if (a === 'play') st.playing ? pause() : play(); else if (a === 'stop') stop(); else if (a === 'prev') (st.t > 3 ? seek(0) : next(-1)); else if (a === 'next') next(1);
      else if (a === 'rew') seek(st.t - 5); else if (a === 'ff') seek(st.t + 5); else if (a === 'list') togglePl(); else if (a === 'full') fullscreen();
      else if (a === 'mute') { st.muted = !st.muted; btn.innerHTML = st.muted ? SYM.mute : SYM.spk; btn.classList.toggle('on', st.muted); }
    }));
    const vol = q('.ct-m-vol'); const applyVol = () => { st.vol = +vol.value; C.store.set('mvol', st.vol); Sound.setVolume(st.vol / 100); };
    vol.addEventListener('input', applyVol); applyVol();
    const track = q('.ct-m-track'); let drag = false;
    const seekAt = ev => { const r = track.getBoundingClientRect(); const v = V[st.id]; if (v) seek((ev.clientX - r.left) / r.width * v.dur); };
    track.addEventListener('pointerdown', ev => { drag = true; track.setPointerCapture(ev.pointerId); seekAt(ev); });
    track.addEventListener('pointermove', ev => { if (drag) seekAt(ev); });
    track.addEventListener('pointerup', () => { drag = false; }); track.addEventListener('pointercancel', () => { drag = false; });
    w.el.addEventListener('keydown', ev => { if (ev.target.tagName === 'INPUT') return; if (ev.key === ' ') { ev.preventDefault(); st.playing ? pause() : play(); } else if (ev.key === 'ArrowLeft') seek(st.t - 5); else if (ev.key === 'ArrowRight') seek(st.t + 5); });

    // ---- menus
    function openDlg() {
      const files = fileNodes();
      const bb = h('div', '', `<div class="row" style="flex-wrap:nowrap"><label>Look in:</label><select class="ct-m-look"><option>My Computer (all videos)</option></select></div><div class="field ct-m-open">${files.map(([n, p], i) => `<div class="xi" data-i="${i}"><span style="width:16px;height:16px;display:inline-block;vertical-align:middle">${n.type === 'mpg' ? C.ICON.mpg : C.ICON.avi}</span> ${esc(n.name)} <small style="color:#666">${esc(p.replace(/\\[^\\]*$/, ''))}</small></div>`).join('') || '<div class="small" style="padding:6px">No video files found. (Try the cover disc in D:.)</div>'}</div><div class="row" style="margin-top:8px;flex-wrap:nowrap"><label>Files of type:</label><select style="flex:1;min-width:0"><option>Video files (*.avi;*.mpg)</option><option>All files (*.*)</option></select></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-c="ok" style="min-width:72px">Open</button><button class="btn" data-c="no" style="min-width:72px">Cancel</button></div>`);
      const d = A.win('Open', bb, { w: 400, noResize: true, noMax: true, noMin: true, escClose: true, icon: C.ICON.mplayer });
      let sel = -1; const rows = bb.querySelectorAll('.xi');
      rows.forEach(r => { r.addEventListener('click', () => { rows.forEach(x => x.classList.remove('sel')); r.classList.add('sel'); sel = +r.dataset.i; if (matchMedia('(hover:none)').matches) ok(); }); r.addEventListener('dblclick', () => { sel = +r.dataset.i; ok(); }); });
      const ok = () => { if (sel < 0) return; d.close(); C.openVideo(files[sel][0]); };
      bb.querySelector('[data-c=ok]').addEventListener('click', ok); bb.querySelector('[data-c=no]').addEventListener('click', d.close);
    }
    function props() {
      const v = V[st.id]; if (!v) return Desk.msgbox('Properties', 'No file is open.', 'info');
      const n = st.node || {};
      Desk.msgbox((n.name || v.file) + ' Properties', `File: ${n.name || v.file}\nSize: ${n.size || Math.round(v.dur * 0.19 * 10) / 10 + ' MB'}\nLength: ${fmt(v.dur)}\nVideo: ${v.codec}, ${W}x${H}, ${v.fps} frames/sec, 256 colours\nAudio: JackOS Beeper, 1 channel, 8-bit, 11 kHz\nCopyright: 1999 Jack. All rights reserved. All lefts too.`, 'info');
    }
    function about() { Desk.msgbox('About JackOS Media Player', 'JackOS Media Player 6.4\n\nPlays AVI and MPG files, badly but on purpose.\n\nCodecs installed: JackOS Video 1, Blobbit RLE, MPEG-1 (Jack edition)' + (C.store.get('codec') ? ', JKAT Video' : '') + '.\n\nThis product is licensed to: Jack, and anybody who is in Jack\'s room.', 'info'); }
    A.menubar(w, [
      ['File', () => [{ label: 'Open...', key: 'Ctrl+O', act: openDlg }, { label: 'Close', act: () => { stop(); st.id = null; w.setTitle('JackOS Media Player'); draw(); renderList(); status('Ready'); } }, '-', { label: 'Properties', act: props }, '-', { label: 'Exit', act: w.close }]],
      ['View', () => [{ label: 'Standard', rad: true, act: () => {} }, { label: 'Full Screen', key: 'Alt+Enter', act: fullscreen }, '-', { label: 'Playlist', chk: st.plOpen, act: () => togglePl() }, { label: 'Status Bar', chk: true, act: () => Desk.toast('Media Player', 'The status bar stays. It has feelings.') }, '-', { label: 'Options...', act: () => Desk.msgbox('Options', 'Playback: 1x (the only speed)\nColours: 256 (the best colours)\nAuto-play next: ' + (C.store.get('mauto', true) ? 'ON' : 'OFF') + '\n\nOptions can be changed by wishing hard enough.', 'info', [['Toggle auto-play', () => C.store.set('mauto', !C.store.get('mauto', true))], ['OK']]) }]],
      ['Play', () => [{ label: st.playing ? 'Pause' : 'Play', key: 'Space', act: () => st.playing ? pause() : play() }, { label: 'Stop', act: stop }, '-', { label: 'Rewind', key: 'Left', act: () => seek(st.t - 5) }, { label: 'Fast Forward', key: 'Right', act: () => seek(st.t + 5) }, '-', { label: 'Previous', act: () => next(-1) }, { label: 'Next', act: () => next(1) }, '-', { label: 'Repeat', chk: st.repeat, act: () => { st.repeat = !st.repeat; } }]],
      ['Favorites', () => [{ label: 'Add to Favorites', dis: !st.id, act: () => { if (st.id && !st.favs.includes(st.id)) { st.favs.push(st.id); C.store.set('mfav', st.favs); } Desk.toast('Favorites', 'Added. It was already your favourite, let\'s be honest.'); } }, '-', ...(st.favs.length ? st.favs.filter(id => V[id]).map(id => ({ label: V[id].title, icon: C.ICON.avi, act: () => load(id, true) })) : [{ label: '(empty)', dis: true }])]],
      ['Help', () => [{ label: 'Help Topics', act: () => Desk.msgbox('Media Player Help', 'Space: play/pause.  Left/Right: seek 5 seconds.\nDouble-click the picture for full screen. Esc to come back.\n\nIf the picture is blocky: that is the codec.\nIf the sound is beepy: that is the sound card.\nIf it is both: that is 1999.', 'info') }, '-', { label: 'About JackOS Media Player', act: about }]],
    ]);

    // ---- lifecycle
    const ro = () => fit(); window.addEventListener('resize', ro);
    w.cleanup.push(() => { st.playing = false; cancelAnimationFrame(st.raf); window.removeEventListener('resize', ro); document.removeEventListener('fullscreenchange', onFs); Sound.setVolume(1); if (document.fullscreenElement === screen && document.exitFullscreen) document.exitFullscreen(); C.api.mplayer = null; });
    C.api.mplayer = { alive: () => !w.closed, take(x) { load(x, true); w.restore(); }, seek, play, pause, state: st, V };
    renderList(); draw(); fit(); status('Ready');
    if (arg) load(arg, true); else { st.id = null; w.setTitle('JackOS Media Player'); }
  };
})();

/* JackOS 98 "system" pack: Desktop Themes (Plus!-style). Wallpaper (SVG/CSS), window colours, cursors, icons, sounds. */
(function () {
  'use strict';
  const X = window.SysPack; if (!X || window.SysThemes) return;
  const A = window.Apps;
  const { I, get, put, qs, qsa, on, h, esc, S, toast, msg, mini, pick, rnd } = X;
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + s + '</svg>')}")`;
  const cur = (svg, hx, hy) => `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + svg + '</svg>')}") ${hx} ${hy}, auto`;

  // ---- original sound schemes (WebAudio, drawn by hand)
  const tone = (f, d, type, v, when, slide) => { if (!Sound.on) return; const c = Sound.unlock(); if (!c) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(v == null ? 0.15 : v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02); };
  const noise = (d, v, when, f) => { if (!Sound.on) return; const c = Sound.unlock(); if (!c) return; const t = c.currentTime + (when || 0), n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), dd = buf.getChannelData(0); for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = buf; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f || 1000; const g = c.createGain(); g.gain.setValueAtTime(v || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t); };
  const SCHEMES = {
    std: { open: () => Sound.play('button'), close: () => Sound.play('click'), err: () => Sound.play('uhoh') },
    orks: { open: () => { tone(110, 0.25, 'sawtooth', 0.12, 0, 70); noise(0.15, 0.15, 0, 500); }, close: () => { tone(90, 0.18, 'square', 0.12, 0, 50); }, err: () => Sound.play('waaagh') },
    space: { open: () => { tone(880, 0.08, 'sine', 0.1); tone(1320, 0.1, 'sine', 0.08, 0.09); }, close: () => tone(1320, 0.12, 'sine', 0.08, 0, 660), err: () => { tone(220, 0.3, 'triangle', 0.1); tone(233, 0.3, 'triangle', 0.1); } },
    tetris: { open: () => [659, 784, 880].forEach((f, i) => tone(f, 0.07, 'square', 0.1, i * 0.07)), close: () => tone(392, 0.1, 'square', 0.1, 0, 196), err: () => [440, 415, 392, 370].forEach((f, i) => tone(f, 0.1, 'square', 0.1, i * 0.1)) },
    cube: { open: () => { noise(0.04, 0.2, 0, 3000); tone(1800, 0.03, 'square', 0.05); }, close: () => { noise(0.04, 0.2, 0, 2200); }, err: () => { noise(0.2, 0.2, 0, 800); } },
    haunted: { open: () => { tone(140, 0.6, 'sawtooth', 0.05, 0, 110); noise(0.4, 0.05, 0, 300); }, close: () => tone(300, 0.9, 'sine', 0.08, 0, 180), err: () => { tone(200, 1.2, 'sine', 0.1, 0, 120); tone(203, 1.2, 'sine', 0.1, 0, 122); } },
    dinos: { open: () => { tone(70, 0.6, 'sawtooth', 0.15, 0, 45); noise(0.5, 0.2, 0, 250); }, close: () => { tone(50, 0.2, 'sine', 0.3, 0, 30); noise(0.08, 0.2, 0, 150); }, err: () => { for (let i = 0; i < 3; i++) { tone(60, 0.25, 'sawtooth', 0.15, i * 0.3, 40); noise(0.2, 0.25, i * 0.3, 200); } } },
    galaxy: { open: () => { noise(0.08, 0.12, 0, 2500); tone(1400, 0.2, 'sawtooth', 0.05, 0, 300); }, close: () => { tone(60, 0.5, 'sine', 0.2); noise(0.5, 0.12, 0, 120); tone(55, 0.6, 'sawtooth', 0.04, 0.1); }, err: () => { for (let i = 0; i < 4; i++) { tone(1800, 0.12, 'sawtooth', 0.06, i * 0.09, 400); noise(0.05, 0.1, i * 0.09, 3000); } }, hum: () => { tone(82, 1.5, 'sawtooth', 0.04); tone(83, 1.5, 'sine', 0.06); } },
    sea: { open: () => { tone(300, 0.15, 'sine', 0.1, 0, 900); tone(400, 0.15, 'sine', 0.08, 0.12, 1100); }, close: () => tone(900, 0.2, 'sine', 0.08, 0, 300), err: () => tone(150, 0.5, 'sine', 0.1, 0, 80) },
    millennium: { open: () => { noise(0.05, 0.3, 0, 1500); tone(1500, 0.3, 'sine', 0.05, 0.05, 3000); }, close: () => noise(0.12, 0.25, 0, 600), err: () => { noise(0.3, 0.3, 0, 400); noise(0.3, 0.2, 0.15, 300); } },
    matrix: { open: () => { tone(350, 0.15, 'sine', 0.08); tone(440, 0.15, 'sine', 0.08); }, close: () => { for (let i = 0; i < 3; i++) tone(480, 0.06, 'sine', 0.08, i * 0.1); }, err: () => tone(620, 0.4, 'square', 0.05, 0, 310) },
    hotdog: { open: () => tone(600, 0.1, 'square', 0.15), close: () => tone(300, 0.1, 'square', 0.15), err: () => tone(150, 0.3, 'square', 0.2) },
  };

  // ---- wallpapers (all drawn here)
  const stars = (n, seed, col) => { let out = ''; let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let i = 0; i < n; i++) out += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 400).toFixed(1)}" r="${(0.4 + r() * 1.3).toFixed(1)}" fill="${col || '#fff'}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; return out; };
  const WALL = {
    orks: () => svgUrl(`width="160" height="160"><rect width="160" height="160" fill="#3d5a22"/><path d="M10 25c25-20 55 5 40 28s-50 12-40-28zM95 10c35 0 42 35 14 42s-45-42-14-42zM25 105c20-15 50 0 40 28s-55 5-40-28zM105 95c28-8 48 20 34 40s-50 0-34-40z" fill="#243a14"/><path d="M60 65c14-7 28 7 18 17s-28-7-18-17zM130 55c10-5 20 5 14 14s-20-4-14-14zM20 70c8-4 16 4 10 10s-16-3-10-10z" fill="#6b7f3a"/><g fill="#1a2a0e" opacity=".9"><path d="M70 120l6-14 6 14-6-4z"/><circle cx="76" cy="110" r="2"/><path d="M140 20l6-10 6 10-6-3z"/></g><g stroke="#8a1010" stroke-width="3" fill="none" opacity=".85"><path d="M40 20l10 10M50 20l-10 10"/><path d="M120 130l10 10M130 130l-10 10"/></g>`) + ' 0 0/160px 160px',
    space: () => svgUrl(`width="400" height="400"><rect width="400" height="400" fill="#05081c"/>${stars(140, 7)}<circle cx="310" cy="110" r="46" fill="#5a3a9a"/><circle cx="296" cy="96" r="30" fill="#7a56c0" opacity=".6"/><ellipse cx="310" cy="112" rx="78" ry="12" fill="none" stroke="#c9b8ff" stroke-width="3" opacity=".7"/><circle cx="80" cy="300" r="14" fill="#c8402a"/><circle cx="75" cy="296" r="6" fill="#ff8a60" opacity=".7"/>`) + ' 0 0/400px 400px #05081c',
    tetris: () => svgUrl(`width="240" height="240"><rect width="240" height="240" fill="#101020"/><g stroke="#000" stroke-width="2">${[[0, 0, '#00e5ff', [[0, 0], [1, 0], [2, 0], [3, 0]]], [120, 20, '#ffd400', [[0, 0], [1, 0], [0, 1], [1, 1]]], [40, 80, '#a040e0', [[0, 0], [1, 0], [2, 0], [1, 1]]], [160, 100, '#30d030', [[1, 0], [2, 0], [0, 1], [1, 1]]], [0, 160, '#e03030', [[0, 0], [1, 0], [1, 1], [2, 1]]], [100, 170, '#3060ff', [[0, 0], [0, 1], [1, 1], [2, 1]]], [190, 190, '#ff8c00', [[2, 0], [0, 1], [1, 1], [2, 1]]]].map(([x, y, c, cells]) => cells.map(([cx, cy]) => `<rect x="${x + cx * 20}" y="${y + cy * 20}" width="20" height="20" fill="${c}"/><rect x="${x + cx * 20 + 3}" y="${y + cy * 20 + 3}" width="6" height="6" fill="#fff" opacity=".5"/>`).join('')).join('')}</g>`) + ' 0 0/240px 240px',
    cube: () => svgUrl(`width="90" height="90"><rect width="90" height="90" fill="#111"/><g stroke="#000" stroke-width="3">${[['#e10600', 0, 0], ['#fff', 30, 0], ['#0028c8', 60, 0], ['#ffd400', 0, 30], ['#0a0', 30, 30], ['#ff8c00', 60, 30], ['#fff', 0, 60], ['#e10600', 30, 60], ['#0a0', 60, 60]].map(([c, x, y]) => `<rect x="${x + 2}" y="${y + 2}" width="26" height="26" rx="4" fill="${c}"/>`).join('')}</g>`) + ' 0 0/90px 90px',
    haunted: () => svgUrl(`width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0a30"/><stop offset="1" stop-color="#3a1a5a"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="320" cy="60" r="34" fill="#f0e6a0"/><circle cx="306" cy="50" r="8" fill="#e0d690"/><ellipse cx="200" cy="300" rx="260" ry="90" fill="#120620"/><path d="M160 220v-70l20-25 20 25v-20l15-15 15 15v90z" fill="#0a0410"/><rect x="172" y="170" width="10" height="12" fill="#ffb000"/><rect x="205" y="185" width="10" height="12" fill="#ffb000"/><path d="M80 110c6-8 14-8 20 0-4-2-8-2-10 4-2-6-6-6-10-4zM300 150c6-8 14-8 20 0-4-2-8-2-10 4-2-6-6-6-10-4zM240 70c6-8 14-8 20 0-4-2-8-2-10 4-2-6-6-6-10-4z" fill="#000"/><path d="M40 260c-10-20 0-50 20-60 10 20 0 40-20 60z" fill="#0a0410"/>`) + ' center/cover #1a0a30',
    dinos: () => svgUrl(`width="300" height="300"><rect width="300" height="300" fill="#2f5a1e"/><g fill="#1e3d12"><path d="M20 20c20-25 50-10 40 15s-50 10-40-15zM180 40c30-20 60 10 40 30s-60-10-40-30zM60 200c25-20 55 5 35 30s-55 0-35-30zM210 210c25-15 55 10 35 30s-55-5-35-30z"/></g><g fill="#5a7a3a"><path d="M120 110c10-10 25-5 20 8s-25 5-20-8zM250 140c10-8 22-2 16 8s-22 2-16-8z"/></g><g fill="#1a2a10"><path d="M90 70l-6-14h5l3 8 3-8h5l-6 14zM100 76l-4-9h4l2 5 2-5h4l-4 9z"/><path d="M230 260l-6-14h5l3 8 3-8h5l-6 14zM240 266l-4-9h4l2 5 2-5h4l-4 9z"/></g><g transform="translate(262 285) scale(.7)"><path d="M0 0c8-14 20-16 28-10 4-6 10-6 12 0l-6 2c4 2 2 8-2 8l-2 6-6-2-4 6h-6l2-6-8 2z" fill="#3d7a2a" stroke="#1a2a10"/><circle cx="26" cy="-6" r="1.3" fill="#000"/></g>`) + ' 0 0/300px 300px',
    galaxy: () => svgUrl(`width="500" height="500"><rect width="500" height="500" fill="#000006"/>${stars(260, 99)}${stars(30, 123, '#9fc8ff')}${stars(12, 321, '#ffd9a0')}<ellipse cx="400" cy="420" rx="90" ry="22" fill="#1a1a40" opacity=".5" transform="rotate(-25 400 420)"/><circle cx="90" cy="90" r="22" fill="#9a9a9a"/><circle cx="82" cy="84" r="8" fill="#6a6a6a"/><circle cx="98" cy="96" r="4" fill="#7a7a7a"/><path d="M430 60l1 6 6 1-6 1-1 6-1-6-6-1 6-1z" fill="#fff"/>`) + ' 0 0/500px 500px #000006',
    sea: () => svgUrl(`width="300" height="300"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a4a8a"/><stop offset="1" stop-color="#042a52"/></linearGradient></defs><rect width="300" height="300" fill="url(#s)"/><g fill="none" stroke="#7ec8ff" opacity=".5"><circle cx="40" cy="220" r="5"/><circle cx="52" cy="190" r="3"/><circle cx="46" cy="160" r="4"/><circle cx="230" cy="260" r="6"/><circle cx="240" cy="230" r="3"/></g><path d="M160 120c15-10 35-10 50 0-15 10-35 10-50 0zM210 120l12-8v16z" fill="#ffd400"/><circle cx="172" cy="118" r="2" fill="#000"/><path d="M20 300c5-30 0-50 10-70 5 20 0 40 10 70zM270 300c5-25 0-40 8-60 5 15 0 35 8 60z" fill="#1a8a4a"/>`) + ' 0 0/300px 300px',
    millennium: () => svgUrl(`width="400" height="400"><rect width="400" height="400" fill="#06062a"/>${stars(40, 55)}${[[100, 110, '#ffd400'], [290, 80, '#ff2a6d'], [210, 230, '#00e5ff'], [330, 300, '#b6ff00']].map(([x, y, c]) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * 40).toFixed(1)}" y2="${(y + Math.sin(a) * 40).toFixed(1)}" stroke="${c}" stroke-width="2" opacity=".8"/><circle cx="${(x + Math.cos(a) * 46).toFixed(1)}" cy="${(y + Math.sin(a) * 46).toFixed(1)}" r="2" fill="${c}"/>`; }).join('')).join('')}<text x="200" y="380" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="34" fill="#ffd400" opacity=".5">2000</text>`) + ' 0 0/400px 400px',
    matrix: () => svgUrl(`width="120" height="200"><rect width="120" height="200" fill="#000"/><g font-family="Courier New,monospace" font-size="12" fill="#0f0">${Array.from({ length: 48 }, (_, i) => `<text x="${(i % 8) * 15 + 2}" y="${Math.floor(i / 8) * 32 + ((i * 7) % 20) + 12}" opacity="${((i * 13) % 7) / 8 + 0.2}">${'JK01ORKZ7G'[(i * 3) % 10]}</text>`).join('')}</g>`) + ' 0 0/120px 200px',
    hotdog: () => 'repeating-linear-gradient(0deg,#ff0000 0 20px,#ffff00 20px 40px)',
  };
  // ---- cursors (SVG, hand-drawn)
  const CUR = {
    orks: cur('width="24" height="24"><path d="M3 3l4 0 8 10 3-1 2 4-5 3-1-3-9-9z" fill="#8a5a2a" stroke="#000"/><path d="M12 2l9 4-3 7-6-3z" fill="#aaa" stroke="#000"/>', 3, 3),
    space: cur('width="24" height="24"><path d="M3 3l0 14 4-4 3 7 3-1-3-7h6z" fill="#fff" stroke="#000"/><path d="M15 2l5 3-2 7-4-1z" fill="#e10600" stroke="#000"/><path d="M16 11l-2 5 4 0z" fill="#ffd400"/>', 3, 3),
    tetris: cur('width="24" height="24"><g stroke="#000"><rect x="2" y="2" width="7" height="7" fill="#ff8c00"/><rect x="2" y="9" width="7" height="7" fill="#ff8c00"/><rect x="2" y="16" width="7" height="7" fill="#ff8c00"/><rect x="9" y="16" width="7" height="7" fill="#ff8c00"/></g>', 3, 3),
    cube: cur('width="24" height="24"><path d="M3 3l0 14 4-4 3 7 3-1-3-7h6z" fill="#fff" stroke="#000"/><g stroke="#000" stroke-width=".8"><rect x="13" y="13" width="4" height="4" fill="#e10600"/><rect x="17" y="13" width="4" height="4" fill="#fff"/><rect x="13" y="17" width="4" height="4" fill="#0028c8"/><rect x="17" y="17" width="4" height="4" fill="#ffd400"/></g>', 3, 3),
    haunted: cur('width="24" height="24"><path d="M9 2l3 1v9l2-4 3 1-1 5 3-1 1 3-3 2v4H9l-4-6 2-2 2 2z" fill="#f0f0e0" stroke="#000"/><path d="M10 4v8M12 16h4" stroke="#999"/>', 10, 2),
    dinos: cur('width="24" height="24"><path d="M3 3l6 1 4 6 5-2-2 6 5 3-6 2-2 5-4-5-6 2 2-6-4-4 5-1z" fill="#5a7a3a" stroke="#1a2a10"/><circle cx="8" cy="7" r="1.5" fill="#000"/>', 3, 3),
    galaxy: cur('width="24" height="30"><rect x="9" y="19" width="6" height="10" rx="1" fill="#777" stroke="#000"/><rect x="10" y="21" width="4" height="2" fill="#333"/><rect x="10.5" y="1" width="3" height="18" rx="1.5" fill="#4ab0ff"/><rect x="11.5" y="2" width="1" height="16" fill="#fff"/><rect x="8.5" y="0" width="7" height="20" rx="3" fill="#4ab0ff" opacity=".3"/>', 12, 1),
    galaxyRed: cur('width="24" height="30"><rect x="9" y="19" width="6" height="10" rx="1" fill="#333" stroke="#000"/><rect x="10.5" y="1" width="3" height="18" rx="1.5" fill="#ff3030"/><rect x="11.5" y="2" width="1" height="16" fill="#fff"/><rect x="8.5" y="0" width="7" height="20" rx="3" fill="#ff3030" opacity=".3"/>', 12, 1),
    sea: cur('width="24" height="24"><path d="M3 12c4-7 12-7 16 0-4 7-12 7-16 0z" fill="#ff8c00" stroke="#000"/><path d="M19 12l4-4v8z" fill="#ff8c00" stroke="#000"/><circle cx="8" cy="11" r="1.5" fill="#000"/>', 3, 12),
    millennium: cur('width="24" height="24"><path d="M3 21l10-10" stroke="#8a5a2a" stroke-width="3"/><path d="M15 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1zM19 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#ffd400"/>', 16, 6),
    matrix: cur('width="24" height="24"><ellipse cx="12" cy="16" rx="7" ry="6" fill="#fff" stroke="#000"/><ellipse cx="8" cy="7" rx="2" ry="6" fill="#fff" stroke="#000"/><ellipse cx="15" cy="7" rx="2" ry="6" fill="#fff" stroke="#000"/><circle cx="10" cy="14" r="1" fill="#f00"/><circle cx="14" cy="14" r="1" fill="#f00"/>', 12, 12),
    hotdog: cur('width="24" height="24"><path d="M3 3l0 14 4-4 3 7 3-1-3-7h6z" fill="#ff0" stroke="#f00" stroke-width="1.5"/>', 3, 3),
  };
  // ---- icon overrides for the Recycle Bin / My Computer (where feasible)
  const ICO = {
    orks: { iconBin: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="18" rx="12" ry="10" fill="#e10600" stroke="#000"/><circle cx="11" cy="15" r="3" fill="#ff0"/><circle cx="21" cy="15" r="3" fill="#ff0"/><circle cx="11" cy="15" r="1"/><circle cx="21" cy="15" r="1"/><path d="M8 22h16" stroke="#fff" stroke-width="2"/><path d="M10 22l1 3M14 22l1 3M18 22l1 3M22 22l-1 3" stroke="#fff"/></svg>' },
    galaxy: { iconBin: '<svg viewBox="0 0 32 32"><path d="M8 28l4-20h8l4 20z" fill="#888" stroke="#000"/><rect x="6" y="6" width="20" height="4" fill="#aaa" stroke="#000"/><circle cx="16" cy="18" r="4" fill="#4ab0ff"/><path d="M14 2h4v4h-4z" fill="#333"/></svg>', iconMyComp: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#9a9a9a" stroke="#000"/><circle cx="12" cy="12" r="4" fill="#6a6a6a"/><circle cx="20" cy="20" r="2" fill="#7a7a7a"/><circle cx="21" cy="11" r="1.5" fill="#7a7a7a"/><rect x="14" y="26" width="4" height="4" fill="#4ab0ff"/></svg>' },
    haunted: { iconBin: '<svg viewBox="0 0 32 32"><path d="M8 30V14a8 8 0 0 1 16 0v16z" fill="#808080" stroke="#000"/><text x="16" y="24" text-anchor="middle" font-family="Times New Roman,serif" font-weight="bold" font-size="9">R.I.P</text></svg>' },
    dinos: { iconBin: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="18" rx="11" ry="12" fill="#e8e0c0" stroke="#7a6a3a"/><path d="M8 18c3-4 13-4 16 0" stroke="#7a6a3a" fill="none"/><circle cx="13" cy="14" r="1" fill="#7a6a3a"/><circle cx="20" cy="22" r="1.5" fill="#7a6a3a"/></svg>' },
    sea: { iconBin: '<svg viewBox="0 0 32 32"><path d="M6 10c10-4 20-4 20 6s-10 14-20 10z" fill="#f2c79a" stroke="#000"/><path d="M8 12c6 2 10 6 12 12" stroke="#c08060" fill="none"/></svg>' },
    tetris: { iconBin: '<svg viewBox="0 0 32 32"><g stroke="#000"><rect x="4" y="18" width="8" height="8" fill="#00e5ff"/><rect x="12" y="18" width="8" height="8" fill="#00e5ff"/><rect x="20" y="18" width="8" height="8" fill="#00e5ff"/><rect x="12" y="10" width="8" height="8" fill="#a040e0"/><rect x="4" y="10" width="8" height="8" fill="#a040e0"/><rect x="20" y="10" width="8" height="8" fill="#a040e0"/></g></svg>' },
  };
  const THEMES = [
    { name: 'JackOS Standard', key: 'std', wall: '', scheme: ['#000080', '#1084d0', '#c0c0c0', '#000'], desc: 'The classic teal. Beige. Navy. Home.' },
    { name: 'Gorks!', key: 'orks', wall: WALL.orks, scheme: ['#2a4a10', '#7aa030', '#b8c090', '#000'], desc: 'Green and red, camo wallpaper, a choppa for a pointer, grunts for sounds. Red ones go faster.' },
    { name: 'Outer Space', key: 'space', wall: WALL.space, scheme: ['#1a1050', '#5a3a9a', '#c8c4d8', '#000'], desc: 'A quiet starfield with a ringed planet. Navy and purple jackos. Bleeps. Dad\'s favourite.' },
    { name: 'Blockology', key: 'tetris', wall: WALL.tetris, scheme: ['#8030c0', '#00a0c0', '#d0d0e0', '#000'], desc: 'All seven pieces, the proper colours. An L for a pointer. Lines never clear.' },
    { name: 'Cube Mania', key: 'cube', wall: WALL.cube, scheme: ['#c00000', '#0028c8', '#d8d8d8', '#000'], desc: 'Stickers in six colours. Clicky turns for sounds. R U R\' U\'.' },
    { name: 'Haunted House', key: 'haunted', wall: WALL.haunted, scheme: ['#2a1040', '#6a3a9a', '#8a8898', '#000'], desc: 'Purple fog, a house on a hill, bats. Creaks and a "wooo". A skeleton hand pointer. Scary. A bit.' },
    { name: 'Dinosaurs', key: 'dinos', wall: WALL.dinos, scheme: ['#3a5a1a', '#8a7a3a', '#c8c0a0', '#000'], desc: 'Jungle green, footprints and roars (Jack did them in Sound Recorder). A claw for a pointer. One tiny dinosaur hides on the wallpaper.' },
    { name: 'Galaxy Far Away', key: 'galaxy', wall: WALL.galaxy, scheme: ['#101018', '#c8a040', '#d0d0d0', '#000'], desc: 'The space-opera one. A drifting starfield, black and gold jackos, a glowing-blade pointer (right-click goes red), hums and blasters. An original tribute; no film bits.' },
    { name: 'Under the Sea', key: 'sea', wall: WALL.sea, scheme: ['#0a4a8a', '#30a0c0', '#b0d8e8', '#000'], desc: 'Deep blue, bubbles, a fish. Blub. Gubbinz is scared of it.' },
    { name: 'Millennium', key: 'millennium', wall: WALL.millennium, scheme: ['#2a1a6a', '#d4a020', '#e8e0c8', '#000'], desc: 'Fireworks on midnight blue, gold jackos, a sparkler pointer, party poppers. For a night that never comes.' },
    { name: 'The Modemtrix', key: 'matrix', wall: WALL.matrix, scheme: ['#000000', '#00a000', '#b8c8b8', '#000'], desc: 'Green letters, black jackos, a white rabbit. Jack saw it in June. It changed his wallpaper forever (until Gorks!).' },
    { name: 'Hot Dog Stand', key: 'hotdog', wall: WALL.hotdog, scheme: ['#ff0000', '#ff0000', '#ffff00', '#000'], desc: 'No.' },
  ];
  let active = null, styleEl = null, prevIcons = {}, drift = 0, lastEv = 0;
  const ensureStyle = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'sysThemeCss'; document.head.appendChild(styleEl); } return styleEl; };
  function apply(theme, parts, quiet) {
    parts = Object.assign({ wall: true, colours: true, cursor: true, sounds: true, icons: true }, parts || {});
    restoreIcons();
    const r = document.documentElement.style, desk = document.getElementById('desktop');
    document.body.classList.remove(...THEMES.map(t => 'sys-theme-' + t.key));
    if (theme.key === 'std') {
      if (parts.wall && desk) desk.style.background = ''; if (parts.colours) ['--title1', '--title2', '--face'].forEach(k => r.removeProperty(k));
      ensureStyle().textContent = ''; active = null; put('theme', null); document.body.classList.remove('sys-themed');
      try { localStorage.removeItem('jhp_prog_wall'); localStorage.setItem('jhp_prog_scheme', JSON.stringify('JackOS Standard')); } catch (e) {}
      return;
    }
    document.body.classList.add('sys-themed', 'sys-theme-' + theme.key);
    if (parts.wall && desk) desk.style.background = typeof theme.wall === 'function' ? theme.wall() : theme.wall;
    if (parts.colours) { r.setProperty('--title1', theme.scheme[0]); r.setProperty('--title2', theme.scheme[1]); r.setProperty('--face', theme.scheme[2]); }
    else ['--title1', '--title2', '--face'].forEach(k => r.removeProperty(k));
    let css = '';
    if (parts.cursor && CUR[theme.key]) css += `body.sys-themed, body.sys-themed .win, body.sys-themed button, body.sys-themed .dicon, body.sys-themed a { cursor: ${CUR[theme.key]}; }`;
    if (parts.cursor && theme.key === 'galaxy') css += `body.sys-rightdown, body.sys-rightdown * { cursor: ${CUR.galaxyRed} !important; }`;
    if (theme.key === 'orks' && parts.colours) css += 'body.sys-themed .tb{text-shadow:1px 1px #000}';
    if (theme.key === 'galaxy' && parts.colours) css += 'body.sys-themed .tb{color:#f0d890;text-shadow:0 0 4px #c8a040} body.sys-themed #desktop{animation:sysDrift 120s linear infinite}';
    if (theme.key === 'hotdog') css += 'body.sys-themed .win{background:#ffff00} body.sys-themed .tb{color:#ffff00}';
    ensureStyle().textContent = css;
    if (parts.icons && ICO[theme.key]) Object.entries(ICO[theme.key]).forEach(([id, svg]) => { const el = document.getElementById(id); const s = el && el.querySelector('svg'); if (s) { prevIcons[id] = s.outerHTML; s.outerHTML = svg; } });
    active = Object.assign({ parts }, theme);
    if (!quiet) { put('theme', { name: theme.name, parts }); try { localStorage.removeItem('jhp_prog_wall'); } catch (e) {} }
    if (!quiet && parts.sounds && SCHEMES[theme.key]) SCHEMES[theme.key].open();
    if (!quiet && theme.key === 'hotdog') A.secret('hotdog');
  }
  function restoreIcons() { Object.entries(prevIcons).forEach(([id, svg]) => { const el = document.getElementById(id); const s = el && el.querySelector('svg'); if (s) s.outerHTML = svg; }); prevIcons = {}; }
  // theme sounds hook: windows opening/closing and errors
  const obs = new MutationObserver(ms => {
    if (!active || !active.parts.sounds || !SCHEMES[active.key]) return;
    const now = Date.now(); if (now - lastEv < 250) return;
    for (const m of ms) {
      for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('appwin')) { lastEv = now; SCHEMES[active.key].open(); return; }
      for (const n of m.removedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('appwin')) { lastEv = now; SCHEMES[active.key].close(); return; }
      for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('msgbox')) { lastEv = now; SCHEMES[active.key].err(); return; }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  on(document, 'pointerdown', ev => { if (active && active.key === 'galaxy' && ev.button === 2) { document.body.classList.add('sys-rightdown'); setTimeout(() => document.body.classList.remove('sys-rightdown'), 900); } }, true);
  on(document, 'contextmenu', () => { if (active && active.key === 'galaxy' && active.parts.sounds) SCHEMES.galaxy.hum(); }, true);

  // ---- the Desktop Themes window
  X.P['system.themes'] = () => {
    const tried = get('themesTried', []);
    const b = h(`<div class="sys-th"><div class="sys-th-top"><label class="sys-lbl">Theme:<select class="sys-th-sel">${THEMES.map(t => `<option value="${t.key}">${esc(t.name)}</option>`).join('')}</select></label><div class="row"><button type="button" class="btn" data-t="save">Save As...</button><button type="button" class="btn" data-t="del">Delete</button></div></div>
      <div class="sys-th-mid"><div class="sys-th-prev"><div class="sys-th-pdesk"><div class="sys-th-pico"><i></i><span>My Computer</span></div><div class="sys-th-pico"><i class="bin"></i><span>Recycle Bin</span></div><div class="sys-th-pwin"><div class="sys-th-ptb">Active Window<span class="sys-th-pctl"><i>_</i><i>\u25a1</i><i>x</i></span></div><div class="sys-th-pmenu">File&nbsp;&nbsp;Edit&nbsp;&nbsp;View&nbsp;&nbsp;Help</div><div class="sys-th-pbody">Window Text<div class="sys-th-pbtn">OK</div></div></div><div class="sys-th-pcur"></div></div></div>
      <div class="sys-th-side"><div class="group"><span class="lg">Previews</span><button type="button" class="btn" data-t="ss">Screen Saver</button><button type="button" class="btn" data-t="snd">Pointers, Sounds, etc...</button></div><div class="group"><span class="lg">Settings</span>${[['wall', 'Desktop wallpaper'], ['colours', 'Colors'], ['cursor', 'Mouse pointers'], ['sounds', 'Sound events'], ['icons', 'Icons'], ['font', 'Font names and styles'], ['size', 'Font and window sizes']].map(([k, l]) => `<label class="sys-ck"><input type="checkbox" data-p="${k}" checked ${/font|size/.test(k) ? 'disabled' : ''}> ${l}</label>`).join('')}</div></div></div>
      <div class="sys-th-desc"></div><div class="row sys-btns"><button type="button" class="btn sys-def" data-t="ok">OK</button><button type="button" class="btn" data-t="cancel">Cancel</button><button type="button" class="btn" data-t="apply">Apply</button></div></div>`, 'sys-thwin');
    const w = A.win('Desktop Themes', b, { w: 560, icon: I.themes, noResize: true, noMax: true, escClose: true });
    const sel = qs(b, '.sys-th-sel'), prev = qs(b, '.sys-th-pdesk'), pwin = qs(b, '.sys-th-pwin'), pcur = qs(b, '.sys-th-pcur'), desc = qs(b, '.sys-th-desc');
    const start = active ? active.key : 'std'; sel.value = start;
    const parts = () => { const p = {}; qsa(b, '[data-p]').forEach(i => { p[i.dataset.p] = i.checked; }); return p; };
    function preview() {
      const t = THEMES.find(x => x.key === sel.value);
      prev.style.background = t.wall ? (typeof t.wall === 'function' ? t.wall() : t.wall) : '';
      prev.style.backgroundSize = t.key === 'haunted' ? 'cover' : '50%';
      pwin.style.setProperty('--t1', t.scheme[0]); pwin.style.setProperty('--t2', t.scheme[1]); pwin.style.setProperty('--f', t.scheme[2]);
      pcur.style.backgroundImage = CUR[t.key] ? CUR[t.key].split(' ')[0].replace(/^url\(/, 'url(') : '';
      pcur.style.background = CUR[t.key] ? CUR[t.key].replace(/\)\s+\d+\s+\d+,\s*auto$/, ')') + ' no-repeat' : 'none';
      const ic = ICO[t.key] && ICO[t.key].iconBin; qs(prev, '.bin').innerHTML = ic ? mini(ic, 24) : mini(A.ICON.drive, 24); qs(prev, '.sys-th-pico i:not(.bin)').innerHTML = mini(ICO[t.key] && ICO[t.key].iconMyComp || A.ICON.drive, 24);
      desc.textContent = t.desc;
    }
    on(sel, 'change', preview); preview();
    const doApply = () => { const t = THEMES.find(x => x.key === sel.value); apply(t, parts()); if (t.key !== 'std') { S('theme'); if (!tried.includes(t.key)) { tried.push(t.key); put('themesTried', tried); } if (t.key === 'galaxy') S('galaxy'); if (tried.filter(k => THEMES.some(x => x.key === k && k !== 'std')).length >= THEMES.length - 1) S('allthemes'); } toast('Desktop Themes', t.key === 'std' ? 'Back to the classic look.' : `Theme "${t.name}" applied.`, 2500); };
    on(qs(b, '[data-t=apply]'), 'click', doApply);
    on(qs(b, '[data-t=ok]'), 'click', () => { doApply(); w.close(); });
    on(qs(b, '[data-t=cancel]'), 'click', w.close);
    on(qs(b, '[data-t=save]'), 'click', () => Desk.ask('Save Theme', 'Save the current settings as a theme called:', 'My Theme', 24, v => toast('Desktop Themes', `"${v || 'My Theme'}" saved to C:\\Program Files\\Plus! for JackOS\\Themes. (It's the same as "${sel.options[sel.selectedIndex].text}" but with your name on it.)`, 5000)));
    on(qs(b, '[data-t=del]'), 'click', () => msg('Desktop Themes', `Delete the "${sel.options[sel.selectedIndex].text}" theme?\n\nIt came on the Plus! CD. You can't delete things that came on a CD. That's how CDs work.`, 'warn'));
    on(qs(b, '[data-t=ss]'), 'click', () => { const k = sel.value; const map = { space: 'Starfield Simulation', galaxy: 'Starfield Simulation', orks: 'Digital Rain', tetris: '3D Pipes', cube: 'Mystify Your Mind', haunted: 'Flying Saucers', dinos: 'Flying Saucers', sea: 'Curves and Colors', millennium: 'Marquee', matrix: 'Digital Rain' }; if (window.Savers) Savers.start(map[k] || 'Flying Saucers'); else toast('Desktop Themes', 'Screen savers are not installed.'); });
    on(qs(b, '[data-t=snd]'), 'click', () => { const k = sel.value; const d = X.dlg('Preview', `<p>Theme: <b>${esc(sel.options[sel.selectedIndex].text)}</b></p><div class="row"><button type="button" class="btn" data-s="open">\u25b6 Open program</button><button type="button" class="btn" data-s="close">\u25b6 Close program</button><button type="button" class="btn" data-s="err">\u25b6 Error</button></div><p class="small">Pointer: ${CUR[k] ? 'custom' : 'standard'}. Icons: ${ICO[k] ? Object.keys(ICO[k]).length + ' changed' : 'standard'}.${Sound.on ? '' : ' (Sound is muted; click the speaker in the tray to hear these.)'}</p>`, [['Close']], { w: 360, icon: I.themes }); qsa(d.b, '[data-s]').forEach(bt => on(bt, 'click', () => (SCHEMES[k] || SCHEMES.std)[bt.dataset.s]())); });
    return w;
  };
  window.SysThemes = { apply, list: () => THEMES.map(t => t.name), restore(saved) { const t = THEMES.find(x => x.name === saved.name); if (t) apply(t, saved.parts, true); }, get active() { return active; } };
})();

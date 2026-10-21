/* era-apps-media: RealJack Player G2 (streaming video at 0.3 Kbps, buffering forever, the Plus nag) and
 * Jackster (share MIDI tunes with everyone on JackNet RIGHT NOW). Lazy loaded by era-apps.js. All original. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const { h, esc, store, ri, pick, css, sfx } = E;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tunes = () => { try { return Sound.tunes(); } catch (e) { return []; } };
  const hasTune = n => tunes().includes(n);
  const fmtB = n => Math.round(n).toLocaleString('en-GB');
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const me = () => (window.Net && Net.me) || { id: 0, nick: 'you' };
  let ourTune = ''; // the tune this module started, so we only ever stop our own music
  const playTune = n => { if (!n || !hasTune(n)) return false; try { Sound.music.play(n); ourTune = n; return true; } catch (e) { return false; } };
  const stopTune = () => { try { if (ourTune && Sound.music.playing === ourTune) Sound.music.stop(); } catch (e) {} ourTune = ''; };

  css('media', `
.era-w-squigster .era-host,.era-w-realsquig .era-host{height:100%}
.rsq{display:flex;flex-direction:column;height:100%;background:linear-gradient(#5a6680,#3a4458);color:#e8ecf4;margin:-6px;padding:6px;gap:6px;font:11px var(--ui)}
.rsq-top{display:flex;gap:6px;flex:1;min-height:150px}
.rsq-vid{flex:1;min-width:170px;background:#000;border:2px solid;border-color:#262c3a #8a96b0 #8a96b0 #262c3a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.rsq-vid canvas{width:160px;height:120px;image-rendering:pixelated;image-rendering:crisp-edges;display:block}
.rsq.dbl .rsq-vid canvas{width:320px;height:240px;max-width:100%;object-fit:contain}
.rsq-chan{width:118px;flex:none;display:flex;flex-direction:column;gap:3px;overflow:auto}
.rsq-chan .rsq-h,.rsq-info .rsq-h{font:bold 10px var(--ui);letter-spacing:.06em;color:#ffd86a;text-transform:uppercase}
.rsq-cb{display:flex;align-items:center;gap:5px;text-align:left;font:bold 11px var(--ui);color:#fff;background:linear-gradient(#7d8aa8,#4a5570);border:1px solid;border-color:#a8b4d0 #1a2030 #1a2030 #a8b4d0;padding:3px 5px;min-height:24px;cursor:pointer;border-radius:3px}
.rsq-cb i{width:14px;height:14px;border-radius:3px;flex:none;border:1px solid #000}
.rsq-cb.on{background:linear-gradient(#2a3448,#4a5878);border-color:#1a2030 #a8b4d0 #a8b4d0 #1a2030;color:#ffd86a}
.rsq-ctl{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.rsq-b{width:30px;height:26px;border-radius:13px;background:linear-gradient(#9aa6c0,#4a5570);border:1px solid #1a2030;box-shadow:inset 1px 1px #c8d0e4;color:#fff;font:bold 12px var(--ui);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.rsq-b:active{background:linear-gradient(#4a5570,#9aa6c0)}
.rsq-seek{flex:1;min-width:80px;height:8px;background:#1a2030;border:1px solid;border-color:#262c3a #8a96b0 #8a96b0 #262c3a;position:relative}
.rsq-seek b{position:absolute;top:-4px;width:10px;height:14px;background:linear-gradient(#d0d8e8,#7d8aa8);border:1px solid #000;left:0;border-radius:2px}
.rsq-logo{width:46px;height:46px;border-radius:50%;flex:none;border:2px solid #1a2030;background:radial-gradient(circle at 35% 30%,#9fd0ff,#1a3a8a 60%,#0a1a4a);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 0 0 2px #8a96b0}
.rsq-logo svg{width:38px;height:38px}
.rsq-logo.busy svg{animation:rsqspin 1.6s linear infinite}
@keyframes rsqspin{to{transform:rotate(360deg)}}
.rsq-vol{width:70px}
.rsq-lcd{display:flex;justify-content:space-between;gap:8px;background:#0a1020;color:#7cf0a0;font:11px "Courier New",monospace;padding:3px 6px;border:2px solid;border-color:#262c3a #8a96b0 #8a96b0 #262c3a;white-space:nowrap;overflow:hidden}
.rsq-lcd span:first-child{overflow:hidden;text-overflow:ellipsis}
.rsq-info{background:#26304a;border:2px solid;border-color:#262c3a #8a96b0 #8a96b0 #262c3a;padding:3px 6px;overflow:hidden;white-space:nowrap}
.rsq-info .rsq-mq{display:inline-block;padding-left:100%;animation:rsqmq 18s linear infinite;color:#dfe6f6}
@keyframes rsqmq{to{transform:translateX(-100%)}}
.rsq.noinfo .rsq-info,.rsq.nochan .rsq-chan{display:none}
@media (max-width:520px){.rsq-top{flex-direction:column}.rsq-chan{width:auto;flex-direction:row;flex-wrap:wrap}.rsq-cb{flex:1 1 45%}}
.rsq-nag{margin:-6px;background:#fff}
.rsq-nag .rsq-nbn{background:linear-gradient(135deg,#0a1a5a,#2a5ad8 60%,#e8b830);color:#fff;padding:12px;display:flex;gap:10px;align-items:center}
.rsq-nag .rsq-nbn b{font:bold 20px Arial,sans-serif;display:block;text-shadow:2px 2px #000}
.rsq-nag ul{margin:8px 0;padding-left:22px;font:12px var(--ui)}
.rsq-nag li{margin:3px 0}
.rsq-nag .rsq-nbody{padding:10px 12px}
.rsq-nag .rsq-go{font:bold 16px Arial,sans-serif;background:linear-gradient(#ffe070,#e8a010);border:2px solid #7a4a00;border-radius:6px;padding:8px 18px;cursor:pointer;color:#000}
.rsq-nag .rsq-later{background:none;border:0;color:#0000ee;text-decoration:underline;font:9px var(--ui);cursor:pointer;padding:2px}
.rsq-nag .small{font-size:10px;color:#555}
/* ---- Jackster */
.sqs{display:flex;flex-direction:column;height:100%;margin:-6px;background:#c0c0c0}
.sqs-bar{display:flex;align-items:stretch;background:linear-gradient(#1a2a5a,#000814);border-bottom:2px solid #000;flex:none;overflow-x:auto}
.sqs-logo{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;color:#fff;font:bold 20px Arial,sans-serif;letter-spacing:-.04em;flex:none}
.sqs-logo svg{width:34px;height:34px}
.sqs-logo em{font-style:normal;color:#ff3a2a}
.sqs-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:58px;padding:4px 6px;background:none;border:1px solid transparent;color:#c8d4f0;font:11px var(--ui);cursor:pointer;flex:none}
.sqs-tab svg{width:22px;height:22px}
.sqs-tab:hover{color:#fff;border-color:#3a5aa8}
.sqs-tab.on{color:#fff;background:linear-gradient(#2a4a9a,#0a1a4a);border-color:#6a8ad8 #000 #000 #6a8ad8;font-weight:bold}
.sqs-pg{flex:1;min-height:0;display:none;flex-direction:column;padding:6px;gap:6px;overflow:auto}
.sqs-pg.on{display:flex}
.sqs-hd{background:linear-gradient(90deg,#0a1a4a,#2a4a9a);color:#fff;font:bold 12px var(--ui);padding:3px 6px;flex:none}
.sqs-form{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sqs-form label{display:flex;align-items:center;gap:4px}
.sqs-form input{width:150px}
.sqs-tw{flex:1;min-height:90px;overflow:auto;background:#fff}
.sqs-t{border-collapse:collapse;width:100%;min-width:640px;font:11px var(--ui)}
.sqs-t th{position:sticky;top:0;background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;text-align:left;padding:2px 4px;font-weight:normal;cursor:pointer;white-space:nowrap;z-index:1}
.sqs-t td{padding:1px 4px;white-space:nowrap;border-bottom:1px solid #eee;cursor:default}
.sqs-t tr.sel td{background:#000080;color:#fff}
.sqs-t td.fn{max-width:260px;overflow:hidden;text-overflow:ellipsis}
.sqs-dot{display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid #000;margin-right:4px;vertical-align:-1px}
.sqs-empty{padding:16px;text-align:center;color:#444;white-space:normal}
.sqs-btns{display:flex;flex-wrap:wrap;gap:6px;flex:none}
.sqs-pr{display:inline-block;width:110px;height:11px;border:1px solid #808080;background:#fff;vertical-align:-2px;position:relative}
.sqs-pr i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,#000080 0 6px,#fff 6px 7px)}
.sqs-st-ok{color:#060;font-weight:bold}.sqs-st-bad{color:#a00;font-weight:bold}
.sqs-help{background:#fff;padding:8px 10px;font:12px var(--ui);line-height:1.45}
.sqs-help h4{margin:8px 0 2px;font:bold 12px var(--ui);color:#0a1a5a}
.sqs-help p{margin:0 0 4px}
.sqs-chat{background:#000814;color:#c8d4f0;padding:10px;font:12px var(--ui)}
.sqs-chat b{color:#ff6a5a}
`);

  // ================================================================ REALJACK PLAYER G2
  // the 160x120 "live" channels. Each draw(g, t) paints a whole frame; the player then crushes it into blocks.
  const DARK = '#000';
  function px(g, x, y, w, hh, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); }
  // a dancing Blobbit (round bouncy critter: little round ears, big eyes, grin), chunky pixels for the 160x120 stream
  function squigSprite(g, x, y, s, t, c) {
    const b = Math.sin(t * 9) * 3 * s, yy = y + b * 0.4, B = c || '#3aa0f0', D = '#1a58b8';
    px(g, x - 9 * s, y + 11 * s, 6 * s, 5 * s + Math.max(0, b), D); px(g, x + 3 * s, y + 11 * s, 6 * s, 5 * s + Math.max(0, -b), D);
    g.fillStyle = D; g.beginPath(); g.arc(x - 10 * s, yy - 11 * s, 5 * s, 0, 7); g.arc(x + 10 * s, yy - 11 * s, 5 * s, 0, 7); g.fill();
    g.fillStyle = '#ffb0c8'; g.beginPath(); g.arc(x - 10 * s, yy - 11 * s, 2.2 * s, 0, 7); g.arc(x + 10 * s, yy - 11 * s, 2.2 * s, 0, 7); g.fill();
    g.fillStyle = B; g.beginPath(); g.arc(x, yy, 14 * s, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - 6 * s, yy - 8 * s, 4 * s, 2 * s, -0.6, 0, 7); g.fill();
    px(g, x - 8 * s, yy - 5 * s, 6 * s, 7 * s, '#fff'); px(g, x + 2 * s, yy - 5 * s, 6 * s, 7 * s, '#fff');
    px(g, x - 5 * s, yy - 2 * s, 3 * s, 3 * s, '#000'); px(g, x + 5 * s, yy - 2 * s, 3 * s, 3 * s, '#000');
    px(g, x - 12 * s, yy + 3 * s, 3 * s, 2 * s, '#ff5a8c'); px(g, x + 9 * s, yy + 3 * s, 3 * s, 2 * s, '#ff5a8c');
    px(g, x - 5 * s, yy + 5 * s, 10 * s, 2 * s, '#5a0a20'); px(g, x - 3 * s, yy + 7 * s, 6 * s, 2 * s, '#5a0a20'); px(g, x - 1 * s, yy + 7 * s, 3 * s, 1 * s, '#ff6a8a');
  }
  // a robot head (JNN's news anchor and Sunny the Weather Robot): antenna, visor eyes, a speaker-grille mouth that flaps
  function robotHead(g, x, y, s, t, mouth) {
    px(g, x - 1 * s, y - 16 * s, 2 * s, 6 * s, '#3a4252'); px(g, x - 2 * s, y - 18 * s, 4 * s, 3 * s, Math.floor(t * 3) % 2 ? '#ff3020' : '#ffd400');
    px(g, x - 13 * s, y - 4 * s, 3 * s, 8 * s, '#7a8292'); px(g, x + 10 * s, y - 4 * s, 3 * s, 8 * s, '#7a8292');
    px(g, x - 10 * s, y - 10 * s, 20 * s, 20 * s, '#c8d0dc'); px(g, x - 10 * s, y - 10 * s, 20 * s, 2 * s, '#fff'); px(g, x - 10 * s, y - 10 * s, 2 * s, 20 * s, '#eef'); px(g, x + 8 * s, y - 8 * s, 2 * s, 18 * s, '#7a8292'); px(g, x - 8 * s, y + 8 * s, 18 * s, 2 * s, '#7a8292');
    px(g, x - 7 * s, y - 6 * s, 14 * s, 6 * s, '#10141c'); px(g, x - 5 * s, y - 4 * s, 4 * s, 2 * s, '#40e0ff'); px(g, x + 1 * s, y - 4 * s, 4 * s, 2 * s, '#40e0ff');
    const mh = mouth ? 2 + (Math.sin(t * 14) > 0 ? 2 : 0) : 2;
    px(g, x - 5 * s, y + 3 * s, 10 * s, mh * s, '#10141c'); for (let i = 0; i < 3; i++) px(g, x - 3 * s + i * 3 * s, y + 3 * s, 1 * s, mh * s, '#9aa2b2');
  }
  function grotHead(g, x, y, s, t, mouth) {
    g.fillStyle = '#4a9a2a'; g.beginPath(); g.moveTo(x - 10 * s, y - 2 * s); g.lineTo(x - 22 * s, y - 8 * s); g.lineTo(x - 9 * s, y + 4 * s); g.fill();
    g.beginPath(); g.moveTo(x + 10 * s, y - 2 * s); g.lineTo(x + 22 * s, y - 8 * s); g.lineTo(x + 9 * s, y + 4 * s); g.fill();
    px(g, x - 10 * s, y - 10 * s, 20 * s, 20 * s, '#5aac2c');
    px(g, x - 7 * s, y - 5 * s, 4 * s, 3 * s, '#e10600'); px(g, x + 3 * s, y - 5 * s, 4 * s, 3 * s, '#e10600');
    px(g, x - 2 * s, y - 2 * s, 4 * s, 6 * s, '#3a8a1a');
    px(g, x - 6 * s, y + 5 * s, 12 * s, (mouth ? 1 + (Math.sin(t * 14) > 0 ? 3 : 0) : 1) * s, '#1a3a0a');
  }
  const CHANNELS = [
    { id: 'squigtv', name: 'Telly-o-Rama', col: '#e8381b', url: 'pnm://live.jacktv.realjack.netz/jacktv/live.rm', tune: 'squigdance', kb: 20,
      info: 'Title: TELLY-O-RAMA LIVE - Non-stop Blobbit dancing, 24 hours a day   Author: Telly-o-Rama Networks   Copyright: (c) 1999 Telly-o-Rama. Like Saturday morning telly, but slower.',
      draw(g, t) {
        const k = Math.floor(t * 2) % 4, bg = ['#2a0a5a', '#5a0a4a', '#0a2a5a', '#3a3a0a'][k];
        px(g, 0, 0, 160, 120, bg);
        for (let i = 0; i < 8; i++) px(g, i * 20, 92, 20, 28, (i + k) % 2 ? '#ff0' : '#f0f');
        squigSprite(g, 80 + Math.sin(t * 3) * 30, 62, 1.6, t);
        g.fillStyle = '#fff'; g.font = 'bold 10px Arial'; g.fillText('JACKTV', 4, 12);
      } },
    { id: 'grotfm', name: 'Jack FM 87.9', col: '#ffb000', url: 'pnm://audio.jackfm.realjack.netz/jackfm/live.ra', tune: 'social.r3', audio: true, kb: 8,
      info: 'Title: JACK FM 87.9 - The loudest station on JackNet   Now playing: The Go-Karts   Author: Jack FM   Audio only. There is nothing to watch. Stop looking.',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#000');
        for (let i = 0; i < 16; i++) { const v = (Math.sin(t * 5 + i * 1.7) + Math.sin(t * 9.3 + i) + 2) / 4; px(g, 8 + i * 9, 100 - v * 60, 7, v * 60, i % 3 ? '#20c060' : '#ffd400'); }
        g.fillStyle = '#ffb000'; g.font = 'bold 11px Arial'; g.fillText('JACK FM 87.9', 40, 22); g.font = '8px Arial'; g.fillStyle = '#888'; g.fillText('(audio only)', 56, 112);
      } },
    { id: 'news', name: 'JackNet News', col: '#2a5ad8', url: 'pnm://news.jacknet.realjack.netz/jnn/headlines.rm', tune: '', kb: 20,
      info: 'Title: JNN - JackNet News Network   Headlines every hour (if the server is up)   Copyright: (c) 1999 JNN. Reporting live from Jack\'s bedroom.',
      ticker: '+++ BREAKING: Y2K bug found in Dave\'s calculator +++ Frisbee spotted on school roof, nobody will go up for it +++ Freddo prices up 2p +++ Weather: rain +++ Mom says tea is ready +++ ',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#1a3a8a'); px(g, 100, 10, 50, 36, '#0a1a4a'); g.fillStyle = '#fff'; g.font = 'bold 13px Arial'; g.fillText('JNN', 110, 33);
        robotHead(g, 56, 52, 1.6, t, true);
        px(g, 42, 70, 28, 26, '#222'); px(g, 49, 70, 14, 3, '#fff'); px(g, 54, 70, 4, 18, '#e10600');
        px(g, 0, 82, 160, 18, '#7a4a1a'); px(g, 0, 82, 160, 2, '#a06a2a');
        px(g, 0, 102, 160, 18, '#e10600'); g.fillStyle = '#ffd400'; g.font = 'bold 9px Arial';
        const tw = this.ticker.length * 5.2, off = (t * 40) % tw; g.fillText(this.ticker + this.ticker, 160 - off - 160, 114);
      } },
    { id: 'weather', name: 'Weather', col: '#20a0c0', url: 'pnm://weather.realjack.netz/forecast/today.rm', tune: '', kb: 20,
      info: 'Title: Today\'s Weather for the British Isles   Forecast: rain. Later: more rain. Tomorrow: rain with a chance of rain.   Presenter: Sunny the Weather Robot',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#2a6ad8');
        g.fillStyle = '#3aac2c';
        [[30, 40, 26, 20], [62, 70, 20, 14], [40, 86, 14, 10], [80, 34, 12, 9]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0.4, 0, 7); g.fill(); });
        for (let i = 0; i < 4; i++) {
          const cx = ((t * 12 + i * 47) % 200) - 20, cy = 24 + i * 18;
          g.fillStyle = '#d0d0d8'; g.beginPath(); g.ellipse(cx, cy, 16, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + 8, cy - 4, 9, 6, 0, 0, 7); g.fill();
          g.strokeStyle = '#9fd0ff'; for (let j = 0; j < 4; j++) { const ry = (t * 60 + j * 7) % 14; g.beginPath(); g.moveTo(cx - 9 + j * 6, cy + 6 + ry); g.lineTo(cx - 11 + j * 6, cy + 10 + ry); g.stroke(); }
        }
        px(g, 6, 98, 30, 16, '#fff'); g.fillStyle = '#000'; g.font = 'bold 10px Arial'; g.fillText('12\u00b0', 10, 110);
        robotHead(g, 136, 64, 1.1, t, true); px(g, 127, 76, 18, 30, '#9aa2b2'); px(g, 131, 80, 10, 6, '#2a5ad8'); px(g, 112, 80, 15, 3, '#7a8292'); px(g, 108, 78, 5, 5, '#ffd400');
      } },
    { id: 'spacebar', name: 'Space Bar Live', col: '#9a3ad8', url: 'pnm://live.spacebar.realjack.netz/stage/band.rm', tune: 'site_spacebar', kb: 20,
      info: 'Title: LIVE from the Space Bar - tonight: The Floppy Disks   Recorded on: a camcorder taped to the ceiling   Copyright: (c) 1999 The Space Bar',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#14062a');
        for (let i = 0; i < 20; i++) px(g, (i * 37) % 160, (i * 53) % 60, 1, 1, '#fff');
        ['#f0f', '#0ff', '#ff0'].forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.25; g.beginPath(); const a = Math.sin(t * 2 + i * 2) * 30; g.moveTo(30 + i * 50, 0); g.lineTo(10 + i * 50 + a, 100); g.lineTo(50 + i * 50 + a, 100); g.fill(); g.globalAlpha = 1; });
        px(g, 0, 96, 160, 24, '#3a2a1a');
        for (let i = 0; i < 3; i++) {
          const x = 36 + i * 44, y = 72 + (Math.sin(t * 8 + i) > 0 ? -2 : 0);
          px(g, x - 7, y, 14, 22, ['#3aac2c', '#20a0c0', '#c03a9a'][i]); px(g, x - 9, y + 4, 2, 10, '#7ad84a'); px(g, x + 7, y + 4, 2, 10, '#7ad84a');
          // a little green alien: round head, two antennae with glowing bobbles, big black eyes
          px(g, x - 5, y - 18, 1, 6, '#5aac2c'); px(g, x + 4, y - 18, 1, 6, '#5aac2c'); px(g, x - 7, y - 21, 3, 3, '#ff0'); px(g, x + 4, y - 21, 3, 3, '#ff0');
          g.fillStyle = '#7ad84a'; g.beginPath(); g.arc(x, y - 6, 7, 0, 7); g.fill(); px(g, x - 4, y - 10, 2, 1, '#c8ff90');
          px(g, x - 5, y - 8, 3, 4, '#000'); px(g, x + 2, y - 8, 3, 4, '#000'); px(g, x - 4, y - 8, 1, 1, '#fff'); px(g, x + 3, y - 8, 1, 1, '#fff'); px(g, x - 2, y - 2, 4, 1, '#1a4a0a');
        }
        px(g, 38, 84, 20, 4, '#a06a2a');
      } },
    { id: 'orkcam', name: 'Coffee Pot Cam', col: '#3a7a1a', url: 'pnm://cam.coffeepot.realjack.netz/coffeecam/live.rm', tune: '', kb: 6,
      info: 'Title: COFFEE POT CAM - live from a university computer lab   Updated: whenever   Note: if the pot is empty, that\'s normal. If you see a scientist move CLOSER with a mug, close the window.',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#14100a');
        for (let i = 0; i < 160; i++) px(g, Math.random() * 160, Math.random() * 120, 2, 2, Math.random() < 0.5 ? '#2a2418' : '#0a0806');
        // the coffee machine and its glass pot on the hotplate; the coffee slowly runs out, then a hand comes for a refill
        px(g, 62, 18, 52, 14, '#3a3428'); px(g, 62, 18, 52, 2, '#5a5040'); px(g, 104, 32, 10, 56, '#3a3428'); px(g, 62, 86, 52, 8, '#2a2418'); px(g, 64, 87, 6, 3, Math.floor(t) % 2 ? '#c01000' : '#601000');
        const lvl = 1 - ((t / 40) % 1); // coffee level
        g.fillStyle = 'rgba(200,210,220,.25)'; g.beginPath(); g.moveTo(68, 44); g.lineTo(98, 44); g.lineTo(102, 84); g.lineTo(64, 84); g.closePath(); g.fill();
        const top = 84 - lvl * 34; g.fillStyle = '#2a1608'; g.beginPath(); g.moveTo(66 - (84 - top) * 0.06, top); g.lineTo(100 + (84 - top) * 0.06 - 2, top); g.lineTo(102, 84); g.lineTo(64, 84); g.closePath(); g.fill();
        px(g, 66, top, 34, 1, '#5a3418'); px(g, 70, 46, 2, 30, 'rgba(255,255,255,.35)');
        px(g, 66, 38, 34, 6, '#1a1a1a'); px(g, 98, 46, 8, 3, '#1a1a1a'); px(g, 104, 46, 3, 22, '#1a1a1a'); px(g, 98, 66, 8, 3, '#1a1a1a');
        const ph = (t / 9) % 1;
        if (ph < 0.3) { const k = Math.sin(ph / 0.3 * Math.PI), hx = -40 + k * 90; px(g, hx - 40, 58, 40, 12, '#3a5a8a'); px(g, hx, 56, 14, 14, '#d8a878'); px(g, hx + 8, 52, 12, 16, '#e8e8e8'); px(g, hx + 19, 56, 3, 7, '#e8e8e8'); }
        const d = new Date(); g.fillStyle = '#ccc'; g.font = '8px "Courier New",monospace'; g.fillText('POT CAM  ' + d.toTimeString().slice(0, 8), 4, 114);
        if (Math.floor(t * 2) % 2) { g.fillStyle = '#e10600'; g.beginPath(); g.arc(150, 9, 3, 0, 7); g.fill(); }
      } },
    { id: 'gubbcam', name: 'Gubbinz Cam', col: '#7ad84a', url: 'pnm://cam.gubbinz.realjack.netz/basket/live.rm', tune: '', kb: 6,
      info: 'Title: GUBBINZ CAM - watch Gubbinz sleep   Exciting moments so far: 0   He is not dead. He is resting.',
      draw(g, t) {
        px(g, 0, 0, 160, 120, '#5a4a6a'); px(g, 0, 80, 160, 40, '#7a5a3a');
        px(g, 40, 70, 80, 30, '#a07a3a'); px(g, 40, 70, 80, 4, '#c09a5a');
        grotHead(g, 80, 66 + Math.sin(t * 1.2), 1.2, t, false);
        px(g, 69, 59, 7, 2, '#3a8a1a'); px(g, 84, 59, 7, 2, '#3a8a1a');
        g.fillStyle = '#fff'; g.font = 'bold 9px Arial';
        for (let i = 0; i < 3; i++) { const p = (t * 0.4 + i / 3) % 1; g.globalAlpha = 1 - p; g.fillText('z', 100 + p * 30 + i * 3, 50 - p * 40); }
        g.globalAlpha = 1;
      } },
  ];
  const NAG_SEEN = 'jhp_era_rsq';

  E.mods.realsquig = (K, arg) => {
    const { w, body } = K;
    const cfg = store.get(NAG_SEEN, { tries: 0, toast: 0, mute: false });
    const b = h('div', 'rsq');
    b.innerHTML = `<div class="rsq-top"><div class="rsq-vid"><canvas width="160" height="120" aria-label="Video"></canvas></div>
      <div class="rsq-chan"><div class="rsq-h">Channels</div>${CHANNELS.map((c, i) => `<button type="button" class="rsq-cb" data-c="${i}"><i style="background:${c.col}"></i>${esc(c.name)}</button>`).join('')}</div></div>
      <div class="rsq-ctl"><button class="rsq-b" data-a="play" aria-label="Play" title="Play">&#9654;</button><button class="rsq-b" data-a="pause" aria-label="Pause" title="Pause">&#10074;&#10074;</button><button class="rsq-b" data-a="stop" aria-label="Stop" title="Stop">&#9632;</button>
        <div class="rsq-seek" aria-hidden="true"><b></b></div><input type="range" class="rsq-vol" min="0" max="100" value="80" aria-label="Volume" title="Volume"><button class="rsq-logo" type="button" aria-label="RealJack" title="RealJack.netz">${E.I.realsquig}</button></div>
      <div class="rsq-lcd"><span class="rsq-l1">Ready</span><span class="rsq-l2">0.0 Kbps</span></div>
      <div class="rsq-info"><span class="rsq-mq">Welcome to RealJack Player G2! Pick a channel to start watching LIVE video on the Internet!</span></div>`;
    body.appendChild(b);
    const $ = s => b.querySelector(s);
    const cv = $('canvas'), g = cv.getContext('2d');
    const sc = document.createElement('canvas'); sc.width = 160; sc.height = 120; const sg = sc.getContext('2d');
    const lo = document.createElement('canvas'); const lg = lo.getContext('2d');
    let ch = null, state = 'idle', pct = 0, playLeft = 0, full = false, tt = 0, connT = 0, attempt = 0, custom = '', kbps = 0, lastDraw = 0, playT = 0, nagged = false;
    const l1 = $('.rsq-l1'), l2 = $('.rsq-l2'), knob = $('.rsq-seek b'), logo = $('.rsq-logo');
    const say = t => { K.status(t); l1.textContent = t; };
    const info = t => { const m = $('.rsq-mq'); m.textContent = t; m.style.animation = 'none'; void m.offsetWidth; m.style.animation = ''; };
    function idleFrame(text) {
      px(g, 0, 0, 160, 120, DARK);
      g.strokeStyle = '#2a5ad8'; g.lineWidth = 2; g.beginPath(); g.arc(80, 52, 18, tt * 3, tt * 3 + 4.4); g.stroke();
      g.fillStyle = '#e10600'; g.beginPath(); g.arc(80, 52, 9, 0, 7); g.fill();
      g.fillStyle = '#9aa6c0'; g.font = '9px Arial'; g.textAlign = 'center'; g.fillText(text || 'RealJack', 80, 92); g.textAlign = 'left';
    }
    idleFrame('Pick a channel');
    function start(c, url) {
      stopTune(); ch = c; custom = url || ''; attempt++; cfg.tries++; store.set(NAG_SEEN, cfg);
      full = !custom && (cfg.tries >= 5 && Math.random() < 0.5 || Math.random() < 1 / 6);
      state = 'connect'; connT = rnd(1.4, 2.6); pct = 0; kbps = 0; playT = 0;
      b.querySelectorAll('.rsq-cb').forEach(x => x.classList.toggle('on', ch && x.dataset.c == CHANNELS.indexOf(ch)));
      say(`Connecting to server ${custom || c.url}...`);
      info(custom ? 'Title: (unknown)   Author: (unknown)   Server: not answering' : c.info);
      w.setTitle((custom ? 'Untitled' : c.name) + ' - RealJack Player');
      logo.classList.add('busy');
    }
    function stop(user) {
      stopTune(); state = 'idle'; logo.classList.remove('busy'); say('Stopped'); kbps = 0; l2.textContent = '0.0 Kbps'; idleFrame('Stopped');
      if (user && !nagged && Math.random() < 0.4) { nagged = true; setTimeout(() => { if (!K.closed) nag(); }, 500); }
    }
    function compress(q) {
      // the scene, squashed down to q-pixel blocks, with a few blocks left over from the last frame (that smeary look)
      lo.width = Math.ceil(160 / q); lo.height = Math.ceil(120 / q);
      lg.imageSmoothingEnabled = true; lg.drawImage(sc, 0, 0, lo.width, lo.height);
      const keep = g.getImageData(0, 0, 160, 120);
      g.imageSmoothingEnabled = false; g.drawImage(lo, 0, 0, 160, 120);
      const n = ri(2, 9);
      for (let i = 0; i < n; i++) { const bx = ri(0, 9) * 16, by = ri(0, 7) * 16; g.putImageData(keep, 0, 0, bx, by, 16, 16); }
      if (Math.random() < 0.15) { g.fillStyle = pick(['#0f0', '#f0f', '#888']); g.globalAlpha = 0.5; g.fillRect(ri(0, 9) * 16, ri(0, 7) * 16, 16, 8); g.globalAlpha = 1; }
    }
    const tick = 0.1;
    const iv = setInterval(() => {
      if (K.closed) return;
      tt += tick;
      if (state === 'connect') {
        connT -= tick;
        if (Math.floor(tt * 10) % 6 === 0) idleFrame('Connecting...');
        if (connT <= 0) { state = 'contact'; connT = rnd(1, 2.2); say(`Contacting host... (try ${ri(1, 3)} of 5)`); }
      } else if (state === 'contact') {
        connT -= tick;
        if (connT <= 0) { state = 'buffer'; say('Buffering... 0%'); }
      } else if (state === 'buffer') {
        // crawls, stalls, sometimes goes backwards
        kbps = Math.max(0.1, Math.min((ch && ch.kb) || 20, kbps + rnd(-1.5, 1.6)));
        if (custom) { pct = Math.min(3, pct + (Math.random() < 0.05 ? 1 : 0)); if (tt % 12 < tick * 1.5) say("Server not responding (it's Dave's PC, he switched it off)"); else if (Math.random() < 0.02) say(`Buffering... ${pct}%`); idleFrame('Buffering...'); l2.textContent = '0.0 Kbps'; return; }
        const stall = Math.random() < 0.35;
        if (!stall) pct += full ? rnd(0.8, 2.2) : rnd(0.3, 1.6);
        if (Math.random() < 0.012 && pct > 10 && !full) { pct = Math.max(0, pct - ri(5, 15)); say('Network congestion. Rebuffering...'); }
        else say(`Buffering... ${Math.min(100, Math.floor(pct))}%`);
        l2.textContent = kbps.toFixed(1) + ' Kbps';
        if (Math.floor(tt * 10) % 5 === 0) idleFrame('Buffering ' + Math.min(100, Math.floor(pct)) + '%');
        const goAt = full ? 100 : 18 + (attempt * 7) % 30;
        if (pct >= goAt) {
          state = 'play'; playLeft = full ? 26 : rnd(3, 6.5); logo.classList.remove('busy');
          say(full ? 'Buffering complete! Playing...' : 'Playing (network congestion)'); if (!cfg.mute && window.Sound && Sound.on) playTune(ch.tune);
        }
      } else if (state === 'play') {
        playLeft -= tick; playT += tick; kbps = Math.max(0.1, Math.min(ch.kb, kbps + rnd(-2, 2)));
        l2.textContent = kbps.toFixed(1) + ' Kbps';
        l1.textContent = `\u25b6 ${ch.name}  ${mmss(playT)} / ${full ? '0:26' : 'Live'}`;
        knob.style.left = full ? `calc(${Math.min(100, playT / 26 * 100)}% - 5px)` : `calc(${(playT * 3) % 100}% - 5px)`;
        // low frame rate: only paint a new frame every 2-4 ticks
        if (tt - lastDraw >= (full ? 0.15 : rnd(0.2, 0.45))) { lastDraw = tt; ch.draw(sg, tt); compress(full ? 2 : pick([2, 4, 4, 8])); }
        if (playLeft <= 0) {
          stopTune();
          if (full) { state = 'idle'; say('Clip finished. Thank you for watching ' + ch.name + '!'); idleFrame('The End'); E.secret('real.full'); cfg.tries = 0; store.set(NAG_SEEN, cfg); }
          else { state = 'buffer'; pct = ri(0, 12); logo.classList.add('busy'); say('Network congestion. Rebuffering...'); }
        }
      }
    }, 100);
    K.onClose(() => { clearInterval(iv); stopTune(); });
    b.querySelectorAll('.rsq-cb').forEach(x => x.addEventListener('click', () => { sfx('click'); start(CHANNELS[+x.dataset.c]); }));
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return; sfx('click');
      if (a.dataset.a === 'play') { if (state === 'pause') { state = 'play'; say('Playing'); if (!cfg.mute && window.Sound && Sound.on) playTune(ch.tune); } else if (state === 'idle') start(ch || CHANNELS[0], custom); }
      else if (a.dataset.a === 'pause') { if (state === 'play') { state = 'pause'; stopTune(); say('Paused'); } }
      else stop(true);
    });
    logo.addEventListener('click', () => { sfx('click'); Desk.toast('RealJack.netz', 'Visit www.realjack.netz for the latest news, music and RealJack Plus! (It\'s buffering.)', 4000); });
    $('.rsq-vol').addEventListener('input', e => { try { Sound.setVolume(e.target.value / 100); } catch (x) {} });
    function openLoc() {
      Desk.ask('Open Location', 'Enter the location (URL) of a RealJack clip you want to play:', 'pnm://', 120, v => { v = String(v || '').trim(); if (!v || v === 'pnm://') return; start(CHANNELS[0], v); });
    }
    K.menus([
      ['File', [{ label: 'Open Location...', act: openLoc }, { label: 'Open File...', act: () => Desk.msgbox('Open File', 'No RealJack clips (.rm) found on this computer.\n\nYou could download some from JackNet. Each one is 2 MB. That\'s about ten minutes. Mom says no.', 'info') }, '-', { label: 'Clip Properties', act: () => Desk.msgbox('Clip Properties', ch ? ch.info.replace(/ {3}/g, '\n') + '\n\nBandwidth: ' + ch.kb + ' Kbps (you are getting ' + kbps.toFixed(1) + ')' : 'No clip loaded.', 'info') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['View', () => [{ label: 'Normal (160 x 120)', rad: !b.classList.contains('dbl'), act: () => b.classList.remove('dbl') }, { label: 'Double Size', rad: b.classList.contains('dbl'), act: () => b.classList.add('dbl') }, { label: 'Full Screen', act: () => Desk.msgbox('Full Screen', 'Full Screen mode makes the video bigger.\n\nIt is still 160 x 120. It is just bigger. And blurrier. Trust us, you don\'t want it.', 'info') }, '-', { label: 'Clip Info', chk: !b.classList.contains('noinfo'), act: () => b.classList.toggle('noinfo') }, { label: 'Channels', chk: !b.classList.contains('nochan'), act: () => b.classList.toggle('nochan') }]],
      ['Sound', () => [{ label: 'Mute', chk: cfg.mute, act: () => { cfg.mute = !cfg.mute; store.set(NAG_SEEN, cfg); if (cfg.mute) stopTune(); else if (state === 'play' && window.Sound && Sound.on) playTune(ch.tune); } }, { label: 'Turn Sound Effects On...', act: () => Desk.msgbox('Sound', 'RealJack plays the channels\' music when JackOS sound is switched on (the speaker in the system tray).', 'info') }]],
      ['Favorites', () => [...CHANNELS.map(c => ({ label: c.name, act: () => start(c) })), '-', { label: 'Add to Favorites...', act: () => Desk.toast('RealJack', 'Added to Favorites! (It was already there.)', 3000) }]],
      ['Help', [{ label: 'Upgrade to RealJack Plus!', act: () => nag(true) }, { label: 'Message Center...', act: messages }, '-', { label: 'About RealJack Player...', act: () => E.about('RealJack Player', E.I.realsquig, ['<b>RealJack Player G2</b><br>Version 6.0.3.99 (Basic)', 'Streaming postage-stamp video since 1998.<br>Buffering technology licensed from the Post Office.', 'Copyright \u00a9 1995-1999 RealJack Networks.']) }]],
    ]);
    function messages() { Desk.msgbox('RealJack Message Center', 'You have 3 new messages:\n\n1. Upgrade to RealJack Plus!\n2. Have you thought about upgrading to RealJack Plus?\n3. RealJack Plus is very good. Upgrade?', 'info'); }
    // the famous nag, straight away (or the full pitch if we were opened from "Upgrade to RealJack Plus!")
    function nag(pitch) {
      const nb = h('div', 'rsq-nag');
      nb.innerHTML = `<div class="rsq-nbn">${E.I.realsquig}<div><b>RealJack Plus G2</b>The BEST way to watch telly on the Internet!</div></div><div class="rsq-nbody">
        <p style="margin:0">You are using RealJack Player <b>Basic</b>. Upgrade today and get:</p>
        <ul><li>Station-Scan&trade;: finds 5,000 live stations (4,998 are Jack FM)</li><li>10-band graphic equaliser with extra bass</li><li>Video controls: brightness UP <i>and</i> DOWN</li><li>Buffering that is 3% faster*</li><li>No more of these messages**</li></ul>
        <p class="small">* not true &nbsp; ** also not true</p>
        <div class="row" style="justify-content:space-between;align-items:flex-end;margin-top:8px"><button type="button" class="rsq-later">Later</button><button type="button" class="rsq-go">Upgrade Now!</button></div></div>`;
      const nw = Apps.win(pitch ? 'Upgrade to RealJack Plus!' : 'RealJack Plus', nb, { w: 380, icon: E.I.realsquig, noResize: true, noMax: true, noMin: true, escClose: true });
      nb.querySelector('.rsq-later').addEventListener('click', () => nw.close());
      nb.querySelector('.rsq-go').addEventListener('click', () => { sfx('button'); order(nb, nw); });
      return nw;
    }
    function order(nb, nw) {
      nb.querySelector('.rsq-nbody').innerHTML = `<p style="margin:0"><b>Order RealJack Plus G2</b></p><table style="margin:8px 0;font:12px var(--ui)"><tr><td>Price:</td><td><b>$29.99</b> (that's about \u00a318.50!)</td></tr><tr><td>Download:</td><td>9.8 MB (about 48 minutes at 28.8K)</td></tr><tr><td>Delivery:</td><td>Instant*</td></tr></table><p class="small">* after the 48 minutes</p>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn" data-p="pm">Pay with pocket money</button><button type="button" class="btn" data-p="cc"><b>Pay by credit card</b></button></div>`;
      nb.querySelector('[data-p=pm]').addEventListener('click', () => Desk.msgbox('RealJack Store', 'Sorry, we do not accept pocket money.\n\n(Or 50p coins taped to the monitor. Nice try.)', 'warn'));
      nb.querySelector('[data-p=cc]').addEventListener('click', () => Desk.msgbox('RealJack Store', 'Please ask a grown-up for a credit card.', 'info', [['OK', () => setTimeout(() => {
        Desk.msgbox('RealJack Store', 'Mom said no.\n\n(She also said get off the Internet, she needs the phone.)', 'warn', [['OK', () => { nw.close(); E.secret('real.plus'); }]]);
      }, 200)]]));
    }
    if (arg === 'plus') nag(true);
    else setTimeout(() => { if (!K.closed) nag(); }, 700);
    if (!cfg.toast) { cfg.toast = 1; store.set(NAG_SEEN, cfg); setTimeout(() => { if (!K.closed) Desk.toast('RealJack Message Center', 'You have 3 new messages! (They are all about RealJack Plus.)', 5000); }, 4500); }
  };

  // ================================================================ JACKSTER
  // the catalogue: Jack's JackAmp songs (everyone has those), JackNet Radio's bands, and some new ones of our own
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const seq = s => s.split(/[\s|]+/).filter(Boolean).map(t => { if (t === '.') return 0; if (t === '-') return -1; const m = /^([A-G])([#b]?)(-?\d)$/.exec(t); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); });
  const MINE_T = [
    ['gs.teacup', 'Gubbinz & The Blobbits', 'Blobbit in a Teacup', 0.14, true, 'C5 E5 G5 E5 C6 . G5 . | A5 G5 E5 C5 D5 - . . | F5 A5 C6 A5 F5 . D5 . | G5 F5 E5 D5 C5 - . .', 'C3 G2 C3 G2 | F2 C3 G2 G2 | F2 C3 F2 C3 | G2 D3 C3 C3'],
    ['gs.green', 'Gubbinz & The Blobbits', 'Green Is The Colour', 0.16, true, 'E5 - G5 - A5 - G5 E5 | D5 - E5 - C5 - . . | E5 - G5 - A5 - C6 A5 | G5 - E5 D5 C5 - - .', 'A2 E3 A2 E3 | G2 D3 C3 G2 | A2 E3 F2 C3 | G2 D3 C3 C3'],
    ['gs.nibble', 'Gubbinz & The Blobbits', 'Nibble Nibble Bite', 0.11, true, 'G5 G5 . G5 A5 . G5 . | E5 E5 . E5 G5 . E5 . | C5 D5 E5 G5 A5 G5 E5 D5 | C5 . C6 . C5 . . .', 'C3 C3 G2 G2 | A2 A2 E2 E2 | F2 F2 G2 G2 | C3 G2 C3 C3'],
    ['db.one', "Dave's Band (no name yet)", 'Song One (working title)', 0.15, true, 'E4 E4 E4 . G4 G4 G4 . | A4 A4 A4 . G4 . . . | E4 E4 E4 . G4 G4 G4 . | D4 D4 C4 . . . . .', 'E2 E2 E2 E2 | A2 A2 G2 G2 | E2 E2 E2 E2 | D2 D2 C2 C2'],
    ['db.garage', "Dave's Band (no name yet)", 'Garage Practice Tape', 0.13, true, 'A4 . C5 . D5 . D#5 E5 | . . G5 . E5 . D5 . | A4 . C5 . D5 . D#5 E5 | . . C5 . A4 - - .', 'A2 A2 C3 D3 | E3 E3 G2 G2 | A2 A2 C3 D3 | E2 E2 A2 A2'],
    ['fd.format', 'The Floppy Disks', 'Format C: (Love Song)', 0.2, false, 'C5 - E5 - G5 - - . | A5 - G5 - E5 - - . | F5 - A5 - C6 - B5 A5 | G5 - - - - - . .', 'C3 G2 E3 G2 | A2 E3 C3 E3 | F2 C3 F2 A2 | G2 D3 G2 G2'],
    ['fd.disk2', 'The Floppy Disks', 'Please Insert Disk 2', 0.14, true, 'D5 F5 A5 F5 D5 F5 A5 D6 | C6 A5 F5 A5 C6 - . . | Bb5 G5 D5 G5 Bb5 - A5 G5 | A5 - F5 - D5 - . .', 'D3 A2 D3 A2 | F2 C3 F2 C3 | G2 D3 G2 D3 | D3 A2 D2 D2'],
    ['tf.fasta', 'The Teef', 'Make It Go Faster', 0.1, true, 'E5 E5 G5 E5 A5 E5 B5 A5 | G5 G5 E5 G5 D5 - . . | E5 E5 G5 E5 A5 E5 C6 B5 | A5 G5 E5 D5 E5 - . .', 'E2 E3 E2 E3 | C2 C3 D2 D3 | E2 E3 E2 E3 | C2 D2 E2 E2'],
    ['tf.march', 'The Teef', 'Robot March No. 4', 0.18, false, 'C5 . C5 . G4 . C5 . | E5 - D5 C5 G4 - . . | C5 . C5 . E5 . G5 . | F5 - E5 D5 C5 - . .', 'C2 G2 C2 G2 | C2 G2 G1 G1 | C2 G2 C2 G2 | F2 G2 C2 C2'],
    ['dj.bounce', 'DJ Pixel', 'Blobbit Bounce (Mega Mix)', 0.09, true, 'A5 . A5 C6 . A5 E5 . | G5 . G5 B5 . G5 D5 . | F5 . F5 A5 . F5 C5 . | E5 . G#5 B5 E6 . . .', 'A2 A2 A2 A2 | G2 G2 G2 G2 | F2 F2 F2 F2 | E2 E2 E2 E2'],
    ['dj.modem', 'DJ Pixel', 'Modem Rave 56K', 0.08, true, 'C6 G5 E5 G5 C6 G5 E5 G5 | D6 A5 F5 A5 D6 A5 F5 A5 | E6 B5 G5 B5 E6 B5 G5 B5 | F6 C6 A5 C6 G6 - . .', 'C3 C3 C3 C3 | D3 D3 D3 D3 | E3 E3 E3 E3 | F3 F3 G3 G3'],
    ['mb.dates', 'The Millennium Bugs', 'Two Digit Dates', 0.15, true, 'A4 C5 E5 A5 G5 E5 C5 E5 | F5 - E5 - D5 - C5 - | A4 C5 E5 A5 B5 C6 B5 A5 | G#5 - - - E5 - . .', 'A2 E3 A2 E3 | D3 A2 G2 C3 | A2 E3 A2 E3 | E2 B2 E2 E2'],
    ['mom.tidy', 'Mom', 'Tidy Your Room (Acoustic)', 0.22, false, 'G5 - E5 - C5 - E5 - | G5 - - - C6 - - . | A5 - F5 - D5 - F5 - | G5 - - - - - . .', 'C3 G2 C3 G2 | E2 C3 C3 G2 | F2 C3 D3 A2 | G2 D3 G2 G2'],
  ];
  const JACK = [['squig_pie_shuffle', 'Pot Noodle Shuffle'], ['dial_up_dreams', 'Dial-Up Dreams'], ['waaagh_anthem', 'Boss Level Anthem'], ['rubik_rag', 'Rubik Rag'], ['millennium_countdown', 'Millennium Countdown'], ['floppy_disk_funk', 'Floppy Disk Funk'], ['gubbinz_lullaby', 'Gubbinz Lullaby'], ['pocket_money_polka', 'Pocket Money Polka'], ['y2k_bug_boogie', 'Y2K Bug Boogie'], ['bluescreen_blues', 'Bluescreen Blues']];
  const RADIO = [['1', 'The Floppy Disks', 'Dial-Up Dreams'], ['2', 'The Floppy Disks', '56K of Love'], ['3', 'The Go-Karts', 'Red Ones Go Faster'], ['4', 'DJ Pixel', 'Pot Noodle (Remix)'], ['5', 'Mom', 'Turn That Down (live)'], ['6', 'The Millennium Bugs', 'Fatal Exception 0E'], ['7', 'The Floppy Disks', 'Podrace Pulse'], ['8', 'The Millennium Bugs', 'Y2K Bunker Boogie']];
  const CAT = [];
  const addCat = (id, band, title, tune, def, track) => { const r = E.rng('sqs' + id); CAT.push({ id, band, title, tune, def: !!def, track, bytes: Math.round(18000 + r() * 90000), len: Math.round(150 + r() * 150) }); };
  JACK.forEach(([id, t]) => addCat('j.' + id.slice(0, 22), 'Jack', t, 'jamp_' + id, true, id));
  RADIO.forEach(([n, band, t]) => addCat('r.' + n, band, t, 'social.r' + n));
  MINE_T.forEach(([id, band, t, step, hats, lead, bass]) => { const tn = 'era_sq_' + id.replace('.', '_'); try { Sound.addTune(tn, { lead: seq(lead), bass: seq(bass), step, hats }); } catch (e) {} addCat(id, band, t, tn); });
  const CATI = Object.fromEntries(CAT.map(c => [c.id, c]));
  const avail = c => hasTune(c.tune);
  const fileName = c => `${c.band} - ${c.title}.mid`.replace(/[\\/:*?"<>|]/g, '');
  const LINES = [['14.4K', 1.4], ['28.8K', 2.8], ['33.6K', 3.3], ['56K', 4.6], ['56K', 4.4], ['ISDN', 7.5], ['Cable', 38], ['DSL', 28], ['T1', 120], ['T3', 2.1]];
  function userInfo(u) {
    const r = E.rng(String(u.id) + (u.nick || '')), line = LINES[Math.floor(r() * LINES.length)], base = Math.round(line[1] > 30 ? 30 + r() * 90 : 150 + r() * 700);
    const files = new Set();
    CAT.forEach(c => { if (c.def ? r() < 0.5 : r() < 0.35) files.add(c.id); });
    (E.sqs.lists[u.id] || []).forEach(id => { if (CATI[id]) files.add(id); });
    return { id: u.id, nick: u.nick || 'Guest', col: u.col, line: line[0], speed: line[1], ping: base, files: [...files].filter(id => avail(CATI[id])) };
  }
  const others = () => (E.online || []).filter(u => u && u.id && u.id !== me().id);
  // My Music: your Jackster downloads come back every visit
  const MM = 'C:/My Documents/My Music';
  function addFile(c) {
    const node = { name: fileName(c), type: 'mid', size: Math.ceil(c.bytes / 1024) + ' KB', date: E.pad(E.today().d) + '/' + E.pad(E.today().m) + '/99', eraTune: c.tune, eraSq: c.id };
    if (c.track) node.track = c.track;
    try { Apps.fs.add(MM, node); } catch (e) {}
  }
  const downloads = () => store.get('jhp_era_sqsdl', []).filter(id => CATI[id]);
  downloads().forEach(id => { const d = Apps.fs.get(MM); if (!d || !(d.kids || []).some(k => k.eraSq === id)) addFile(CATI[id]); });
  // .mid files that came from Jackster and aren't JackAmp's own songs play in Jackster's Library
  if (Apps.OPENERS.mid && !Apps.OPENERS.mid._era) {
    const o = Apps.OPENERS.mid;
    Apps.OPENERS.mid = node => (node && node.eraTune && !node.track) ? (E.sqs.playNow ? E.sqs.playNow(node.eraSq) : Apps.open('era.squigster', { play: node.eraSq })) : o(node);
    Apps.OPENERS.mid._era = 1;
  }
  const TR = { list: [], seq: 0 }; // transfers live as long as the page does
  let lastLs = 0;
  const askLists = () => { const now = Date.now(); if (now - lastLs < 10000 || !window.Net || !Net.relay) return; lastLs = now; Net.relay(0, 'era.sqs', { q: 'ls' }); };
  const TICON = {
    chat: '<svg viewBox="0 0 24 24"><path d="M2 4h16v10H8l-4 4v-4H2z" fill="#9fd0ff" stroke="#000"/><path d="M10 16h8l3 3v-3h1V8h-3" fill="#fff" stroke="#000"/></svg>',
    lib: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="4" height="18" fill="#e8b830" stroke="#000"/><rect x="8" y="5" width="4" height="16" fill="#2a5ad8" stroke="#000"/><rect x="13" y="3" width="4" height="18" fill="#e10600" stroke="#000"/><path d="M18 6l3 1-3 14-2-1z" fill="#3aac2c" stroke="#000"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" fill="#9fd0ff" stroke="#000" stroke-width="2"/><path d="M14.5 14.5l6 6" stroke="#000" stroke-width="3"/></svg>',
    hot: '<svg viewBox="0 0 24 24"><path d="M12 2c2 5 7 6 7 12a7 7 0 0 1-14 0c0-3 2-5 3-6 0 3 1 4 2 4 0-4 0-7 2-10z" fill="#ff6a00" stroke="#000"/><path d="M12 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffd400"/></svg>',
    xfer: '<svg viewBox="0 0 24 24"><path d="M7 2v14H3l6 6 6-6h-4V2z" fill="#3aac2c" stroke="#000"/><path d="M17 22V8h4l-6-6" fill="none" stroke="#000"/><path d="M17 22V9h4l-4-5-4 5h4" fill="#e10600" stroke="#000"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffd400" stroke="#000"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2.5" fill="none" stroke="#000" stroke-width="2"/><circle cx="12" cy="18" r="1.3"/></svg>',
  };

  E.mods.squigster = (K, arg) => {
    const { w, body } = K;
    const b = h('div', 'sqs');
    const tabs = [['chat', 'Chat'], ['lib', 'Library'], ['search', 'Search'], ['hot', 'Hot List'], ['xfer', 'Transfer'], ['help', 'Help']];
    b.innerHTML = `<div class="sqs-bar"><div class="sqs-logo">${E.I.squigster}<span>j<em>a</em>ckster</span></div>${tabs.map(([k, l]) => `<button type="button" class="sqs-tab" data-t="${k}">${TICON[k]}<span>${l}</span></button>`).join('')}</div>
      <div class="sqs-pg" data-p="chat"><div class="sqs-hd">Chat</div><div class="sqs-chat"></div></div>
      <div class="sqs-pg" data-p="lib"><div class="sqs-hd">Library: songs you are sharing</div><div class="field sqs-tw sqs-libw"></div><div class="sqs-btns"><button type="button" class="btn" data-b="lplay">&#9654; Play</button><button type="button" class="btn" data-b="lstop">&#9632; Stop</button><button type="button" class="btn" data-b="ljamp">Open in JackAmp</button></div></div>
      <div class="sqs-pg" data-p="search"><div class="sqs-hd">Search for songs</div><form class="sqs-form"><label>Artist: <input type="text" class="sqs-a" maxlength="40"></label><label>Song title: <input type="text" class="sqs-s" maxlength="40"></label><button class="btn" type="submit"><b>Find It!</b></button><button class="btn" type="button" data-b="clear">Clear Fields</button></form><div class="field sqs-tw sqs-resw"></div><div class="sqs-btns"><button type="button" class="btn" data-b="get"><b>Get Selected Song(s)</b></button><button type="button" class="btn" data-b="addhot">Add User to Hot List</button><span class="small sqs-count" style="align-self:center"></span></div></div>
      <div class="sqs-pg" data-p="hot"><div class="sqs-hd">Hot List: your friends on JackNet</div><div class="field sqs-tw sqs-hotw"></div><div class="sqs-btns"><button type="button" class="btn" data-b="browse">Browse User's Files</button><button type="button" class="btn" data-b="hotadd">Add User...</button><button type="button" class="btn" data-b="hotrem">Remove</button></div></div>
      <div class="sqs-pg" data-p="xfer"><div class="sqs-hd">Downloads</div><div class="field sqs-tw sqs-dlw" style="min-height:80px"></div><div class="sqs-btns"><button type="button" class="btn" data-b="xplay">&#9654; Play</button><button type="button" class="btn" data-b="xcancel">Cancel</button><button type="button" class="btn" data-b="xclear">Clear Finished</button></div><div class="sqs-hd">Uploads</div><div class="field sqs-tw sqs-upw" style="min-height:60px;flex:0 1 auto"></div></div>
      <div class="sqs-pg" data-p="help"><div class="sqs-hd">Help</div><div class="sqs-help">
        <h4>What is Jackster?</h4><p>Jackster lets you share songs with everybody who is on JackNet at the same time as you. Your songs come from your My Music folder. Their songs come from theirs!</p>
        <h4>How do I get a song?</h4><p>Click <b>Search</b>, type a band or a song, click <b>Find It!</b>, pick a song and click <b>Get Selected Song(s)</b>. Watch it in <b>Transfer</b>. When it's done it goes in My Music.</p>
        <h4>Why is it so slow?</h4><p>Because the other person is on a 14.4K modem. Or you are. The coloured dot shows the ping: <span class="sqs-dot" style="background:#0c0"></span>fast <span class="sqs-dot" style="background:#ff0"></span>OK <span class="sqs-dot" style="background:#e00"></span>slow.</p>
        <h4>My download stopped at 99%!</h4><p>Someone picked up the phone. Jackster can't resume, sorry. Ask them to put it down and try again.</p>
        <h4>Can I get MP3s?</h4><p>No. An MP3 is about 3 MB, which is ten minutes on a 56K modem if nobody picks up the phone. Jackster only shares MIDI files made by bands on JackNet. Sharing music you didn't make isn't fair on the band.</p>
        <h4>Someone says they're on a T3.</h4><p>They're not.</p></div></div>`;
    body.appendChild(b);
    const q = s => b.querySelector(s), qa = s => [...b.querySelectorAll(s)];
    let tab = '', results = [], sel = new Set(), hotSel = '', libSel = '', xSel = 0, sortK = 'user', sortD = 1, userFilter = null;
    const hot = () => store.get('jhp_era_sqshot', []).filter(x => typeof x === 'string').slice(0, 40);
    function show(t) {
      tab = t; qa('.sqs-tab').forEach(x => x.classList.toggle('on', x.dataset.t === t)); qa('.sqs-pg').forEach(x => x.classList.toggle('on', x.dataset.p === t));
      if (t === 'lib') renderLib(); if (t === 'hot') renderHot(); if (t === 'xfer') renderX(); if (t === 'chat') renderChat();
    }
    qa('.sqs-tab').forEach(x => x.addEventListener('click', () => { sfx('click'); show(x.dataset.t); }));
    function stat() {
      const us = others(), n = us.reduce((a, u) => a + userInfo(u).files.length, 0);
      const mine = shared().length;
      K.status(!window.Net || !Net.connected ? 'Not connected. Jackster needs JackNet. (Is the modem plugged in?)' : `Online (${me().nick || 'you'}) sharing ${mine} songs. Currently ${n} songs (${us.length} users) available.`);
    }
    const shared = () => { const d = Apps.fs.get(MM); return ((d && d.kids) || []).filter(k => k.type === 'mid'); };
    // ---- Search
    function search() {
      askLists();
      const a = q('.sqs-a').value.trim().toLowerCase(), s = q('.sqs-s').value.trim().toLowerCase();
      const words = s.split(/\s+/).filter(Boolean);
      results = [];
      for (const u of others()) {
        if (userFilter && u.nick !== userFilter) continue;
        const ui = userInfo(u);
        for (const id of ui.files) {
          const c = CATI[id];
          if (a && !c.band.toLowerCase().includes(a)) continue;
          if (words.length && !words.every(x => (c.title + ' ' + c.band).toLowerCase().includes(x))) continue;
          results.push({ c, u: ui, ping: Math.max(10, ui.ping + ri(-30, 60)) });
        }
      }
      results = results.slice(0, 200); sel.clear();
      renderRes();
      if (!results.length) sfx('uhoh');
    }
    const COLS = [['fn', 'Filename'], ['size', 'Filesize'], ['br', 'Bitrate'], ['fr', 'Freq'], ['len', 'Length'], ['user', 'User'], ['line', 'Connection'], ['ping', 'Ping']];
    const sortV = (r, k) => k === 'fn' ? fileName(r.c) : k === 'size' ? r.c.bytes : k === 'len' ? r.c.len : k === 'user' ? r.u.nick.toLowerCase() : k === 'line' ? r.u.speed : k === 'ping' ? r.ping : 0;
    const pingCol = p => p < 200 ? '#0c0' : p < 500 ? '#ff0' : '#e00';
    function renderRes() {
      const box = q('.sqs-resw');
      const us = others();
      q('.sqs-count').textContent = results.length ? `${results.length} result(s)${userFilter ? ' from ' + userFilter : ''}` : '';
      if (!results.length) {
        box.innerHTML = `<div class="sqs-empty">${!window.Net || !Net.connected ? 'You are not connected to JackNet. Jackster can only find songs on the computers of people who are online.' : !us.length ? '<b>Nobody else is on JackNet right now...</b><br>Jackster finds songs on the computers of people who are on the site at the same time as you. Try again later! (Or tell Dave to switch his computer on.)' : userFilter && !us.some(u => u.nick === userFilter) ? esc(userFilter) + ' is not online right now.' : 'Type a band or a song title (or leave them blank to see everything) and click <b>Find It!</b>'}</div>`;
        return;
      }
      results.sort((x, y) => { const a = sortV(x, sortK), c = sortV(y, sortK); return (a > c ? 1 : a < c ? -1 : 0) * sortD; });
      box.innerHTML = `<table class="sqs-t"><thead><tr>${COLS.map(([k, l]) => `<th data-k="${k}">${l}${sortK === k ? (sortD > 0 ? ' \u25b2' : ' \u25bc') : ''}</th>`).join('')}</tr></thead><tbody>${results.map((r, i) => `<tr data-i="${i}" class="${sel.has(i) ? 'sel' : ''}"><td class="fn">${esc(fileName(r.c))}</td><td>${fmtB(r.c.bytes)}</td><td>MIDI</td><td>22050</td><td>${mmss(r.c.len)}</td><td>${esc(r.u.nick)}</td><td>${r.u.line}</td><td><span class="sqs-dot" style="background:${pingCol(r.ping)}"></span>${r.ping}</td></tr>`).join('')}</tbody></table>`;
      box.querySelectorAll('th').forEach(th => th.addEventListener('click', () => { if (sortK === th.dataset.k) sortD = -sortD; else { sortK = th.dataset.k; sortD = 1; } renderRes(); }));
      box.querySelectorAll('tbody tr').forEach(tr => {
        const i = +tr.dataset.i;
        tr.addEventListener('click', ev => { if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) sel.clear(); sel.has(i) && (ev.ctrlKey || ev.metaKey) ? sel.delete(i) : sel.add(i); box.querySelectorAll('tbody tr').forEach(x => x.classList.toggle('sel', sel.has(+x.dataset.i))); });
        tr.addEventListener('dblclick', () => { sel.clear(); sel.add(i); get(); });
        tr.addEventListener('contextmenu', ev => { ev.preventDefault(); sel.clear(); sel.add(i); tr.classList.add('sel'); IE.menu([{ label: 'Get Selected Song(s)', act: get }, { label: `Add ${results[i].u.nick} to Hot List`, act: () => addHot(results[i].u.nick) }, { label: `Browse ${results[i].u.nick}'s files`, act: () => browse(results[i].u.nick) }, '-', { label: 'Send Instant Message...', act: () => Desk.msgbox('Jackster', 'Instant messages are coming in Jackster 2.0. For now, try Uh-Oh! Messenger or WinPopup.', 'info') }], ev.clientX, ev.clientY); });
      });
    }
    q('.sqs-form').addEventListener('submit', ev => { ev.preventDefault(); userFilter = null; sfx('click'); search(); });
    function browse(nick) { userFilter = nick; q('.sqs-a').value = ''; q('.sqs-s').value = ''; show('search'); search(); }
    // ---- Transfers
    function get() {
      if (!sel.size) return Desk.msgbox('Jackster', 'Pick a song first! (Click on it in the list.)', 'info');
      let n = 0;
      for (const i of sel) {
        const r = results[i]; if (!r) continue;
        if (TR.list.some(t => t.c.id === r.c.id && t.uid === r.u.id && /^(Negotiating|Remotely queued|Transferring|Timed out)/.test(t.state))) continue;
        if (TR.list.filter(t => /^(Negotiating|Remotely queued|Transferring|Timed out)/.test(t.state)).length >= 4) { Desk.toast('Jackster', 'You can only download 4 songs at once. Your modem would melt.', 3500); break; }
        const slow = r.u.speed < 2;
        TR.list.unshift({ n: ++TR.seq, c: r.c, uid: r.u.id, nick: r.u.nick, line: r.u.line, speed: Math.max(1.2, r.u.speed), got: 0, state: slow && Math.random() < 0.6 ? 'Remotely queued' : 'Negotiating', wait: rnd(1, slow ? 6 : 2.5), mom: Math.random() < 1 / 12, told: false });
        n++;
      }
      if (n) { sfx('join'); show('xfer'); }
    }
    function tickX() {
      const on = new Set(others().map(u => u.id));
      for (const t of TR.list) {
        if (/^(Complete|Error|Cancelled|Aborted)/.test(t.state)) continue;
        // a wobbly connection: wait (like a real queue) for up to a minute before giving up on them
        if (!on.has(t.uid)) { t.miss = (t.miss || 0) + 0.25; if (t.miss > 60) t.state = 'Error: user logged off'; else if (!/^Waiting/.test(t.state)) { t.was = t.state; t.state = 'Waiting for user (connection lost)'; } continue; }
        if (t.miss) { t.miss = 0; if (/^Waiting for user/.test(t.state)) t.state = t.was || 'Transferring'; }
        if (t.state === 'Negotiating' || t.state === 'Remotely queued' || t.state.startsWith('Timed out')) {
          t.wait -= 0.25;
          if (t.wait <= 0) {
            t.state = 'Transferring';
            if (!t.told && window.Net && Net.relay) { t.told = true; Net.relay(t.uid, 'era.sqs', { q: 'up', id: t.c.id }); }
          }
          continue;
        }
        // KB/s wobbles about; the whole thing takes between 4 and 35 seconds
        const target = t.c.bytes / Math.min(35, Math.max(4, t.c.bytes / (t.speed * 1024)));
        const sp = target * rnd(0.4, 1.5);
        t.rate = sp / 1024;
        t.got = Math.min(t.c.bytes, t.got + sp * 0.25);
        if (t.speed < 2 && Math.random() < 0.01) { t.state = 'Timed out, retrying...'; t.wait = rnd(2, 4); }
        if (t.mom && t.got / t.c.bytes > 0.99) { t.got = Math.floor(t.c.bytes * 0.99); t.state = 'Error: connection lost (Mom picked up the phone)'; sfx('uhoh'); continue; }
        if (t.got >= t.c.bytes) {
          t.state = 'Complete';
          const dl = store.get('jhp_era_sqsdl', []).filter(x => x !== t.c.id); dl.unshift(t.c.id); store.set('jhp_era_sqsdl', dl.slice(0, 60));
          if (!(Apps.fs.get(MM).kids || []).some(k => k.eraSq === t.c.id)) addFile(t.c);
          sfx('solve'); E.secret('sqs.dl');
          Desk.toast('Jackster', `Download complete: ${fileName(t.c)}. It's in My Music!`, 3500);
        }
      }
    }
    function renderX() {
      const box = q('.sqs-dlw');
      box.innerHTML = TR.list.length ? `<table class="sqs-t" style="min-width:560px"><thead><tr><th>Filename</th><th>User</th><th>Status</th><th>Progress</th><th>Rate</th></tr></thead><tbody>${TR.list.map(t => {
        const p = t.got / t.c.bytes;
        return `<tr data-n="${t.n}" class="${xSel === t.n ? 'sel' : ''}"><td class="fn">${esc(fileName(t.c))}</td><td>${esc(t.nick)} (${t.line})</td><td class="${t.state === 'Complete' ? 'sqs-st-ok' : t.state.startsWith('Error') ? 'sqs-st-bad' : ''}">${esc(t.state)}</td><td><span class="sqs-pr"><i style="width:${(p * 100).toFixed(1)}%"></i></span> ${fmtB(t.got)} of ${fmtB(t.c.bytes)}</td><td>${t.state === 'Transferring' ? (t.rate || 0).toFixed(2) + ' K/s' : ''}</td></tr>`;
      }).join('')}</tbody></table>` : '<div class="sqs-empty">No downloads yet. Go and <b>Search</b> for something!</div>';
      box.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => { xSel = +tr.dataset.n; box.querySelectorAll('tbody tr').forEach(x => x.classList.toggle('sel', x === tr)); }));
      box.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('dblclick', () => { const t = TR.list.find(x => x.n === +tr.dataset.n); if (t && t.state === 'Complete') playC(t.c); }));
      const up = q('.sqs-upw'), now = Date.now();
      up.innerHTML = E.sqs.uploads.length ? `<table class="sqs-t" style="min-width:480px"><thead><tr><th>Filename</th><th>User</th><th>Status</th><th>Progress</th></tr></thead><tbody>${E.sqs.uploads.filter(u => CATI[u.id]).map(u => { const p = Math.min(1, (now - u.t) / 20000); return `<tr><td class="fn">${esc(fileName(CATI[u.id]))}</td><td>${esc(u.nick)}</td><td class="${p >= 1 ? 'sqs-st-ok' : ''}">${p >= 1 ? 'Complete' : 'Uploading'}</td><td><span class="sqs-pr"><i style="width:${(p * 100).toFixed(0)}%"></i></span></td></tr>`; }).join('')}</tbody></table>` : '<div class="sqs-empty">Nobody is downloading from you right now. (When they do, it shows here!)</div>';
    }
    // ---- Library + playing
    let nowPlaying = '';
    function playC(c) { if (!c) return; if (!(window.Sound && Sound.on)) Desk.toast('Jackster', 'Sound is switched off. Click the speaker in the system tray to hear it!', 3500); stopTune(); if (playTune(c.tune)) { nowPlaying = c.id; K.status('Now playing: ' + fileName(c)); } }
    function libItems() {
      return shared().map(k => ({ k, c: k.eraSq ? CATI[k.eraSq] : CAT.find(c => c.track && c.track === k.track) || (k.track === 'jack_attack_theme' ? { id: 'theme', band: 'Jack', title: 'JACK ATTACK! Theme', tune: 'theme', bytes: 23000, len: 180 } : null) })).filter(x => x.c);
    }
    function renderLib() {
      const items = libItems(), box = q('.sqs-libw');
      box.innerHTML = items.length ? `<table class="sqs-t" style="min-width:420px"><thead><tr><th>Filename</th><th>Filesize</th><th>Length</th><th>From</th></tr></thead><tbody>${items.map(x => `<tr data-f="${esc(x.k.name)}" class="${libSel === x.k.name ? 'sel' : ''}"><td class="fn">${nowPlaying === x.c.id ? '\u266b ' : ''}${esc(x.k.name)}</td><td>${fmtB(x.c.bytes)}</td><td>${mmss(x.c.len)}</td><td>${x.k.eraSq ? 'Jackster' : 'JackAmp'}</td></tr>`).join('')}</tbody></table>` : '<div class="sqs-empty">Your My Music folder is empty.</div>';
      box.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => { libSel = tr.dataset.f; box.querySelectorAll('tbody tr').forEach(x => x.classList.toggle('sel', x === tr)); });
        tr.addEventListener('dblclick', () => { libSel = tr.dataset.f; const x = items.find(i => i.k.name === libSel); if (x) { playC(x.c); renderLib(); } });
      });
    }
    // ---- Hot List
    function addHot(nick) { if (!nick) return; const l = hot().filter(x => x !== nick); l.unshift(nick); store.set('jhp_era_sqshot', l.slice(0, 40)); Desk.toast('Jackster', nick + ' is on your Hot List. You will see when they are online.', 3000); if (tab === 'hot') renderHot(); }
    function renderHot() {
      const box = q('.sqs-hotw'), l = hot(), on = others();
      box.innerHTML = l.length ? `<table class="sqs-t" style="min-width:300px"><thead><tr><th>User</th><th>Status</th><th>Where</th></tr></thead><tbody>${l.map(n => { const u = on.find(x => x.nick === n); return `<tr data-n="${esc(n)}" class="${hotSel === n ? 'sel' : ''}"><td>${esc(n)}</td><td class="${u ? 'sqs-st-ok' : ''}">${u ? 'Online (' + userInfo(u).files.length + ' songs)' : 'Offline'}</td><td>${u ? esc(u.where || '') : ''}</td></tr>`; }).join('')}</tbody></table>` : '<div class="sqs-empty">Your Hot List is empty. Right-click someone in your search results and pick "Add to Hot List", or click <b>Add User...</b></div>';
      box.querySelectorAll('tbody tr').forEach(tr => { tr.addEventListener('click', () => { hotSel = tr.dataset.n; box.querySelectorAll('tbody tr').forEach(x => x.classList.toggle('sel', x === tr)); }); tr.addEventListener('dblclick', () => browse(tr.dataset.n)); });
    }
    function renderChat() {
      const n = others().length;
      q('.sqs-chat').innerHTML = `<p><b>Jackster Chat</b> is in the <b>#jackster</b> channel on JackIRC.</p><p>There ${n === 1 ? 'is' : 'are'} <b>${n}</b> other ${n === 1 ? 'person' : 'people'} on JackNet right now.</p><p>Rules: be nice. No asking for MP3s. No typing in CAPITALS (except LOL).</p><button type="button" class="btn" data-b="irc">Open JackIRC</button>`;
    }
    b.addEventListener('click', ev => {
      const x = ev.target.closest('[data-b]'); if (!x) return; const k = x.dataset.b;
      if (k === 'clear') { q('.sqs-a').value = ''; q('.sqs-s').value = ''; userFilter = null; results = []; renderRes(); }
      else if (k === 'get') get();
      else if (k === 'addhot') { const r = results[[...sel][0]]; if (r) addHot(r.u.nick); else Desk.msgbox('Jackster', 'Pick one of the songs first, then their user goes on your Hot List.', 'info'); }
      else if (k === 'browse') { if (hotSel) browse(hotSel); }
      else if (k === 'hotadd') Desk.ask('Add User', 'Type the name of the user to add to your Hot List:', '', 24, v => { v = String(v || '').trim(); if (v) addHot(v); });
      else if (k === 'hotrem') { if (hotSel) { store.set('jhp_era_sqshot', hot().filter(n => n !== hotSel)); hotSel = ''; renderHot(); } }
      else if (k === 'lplay') { const it = libItems().find(i => i.k.name === libSel) || libItems()[0]; if (it) { libSel = it.k.name; playC(it.c); renderLib(); } }
      else if (k === 'lstop' || k === 'xstop') { stopTune(); nowPlaying = ''; renderLib(); stat(); }
      else if (k === 'ljamp') Apps.open('jackamp');
      else if (k === 'xplay') { const t = TR.list.find(i => i.n === xSel) || TR.list.find(i => i.state === 'Complete'); if (t && t.state === 'Complete') playC(t.c); else Desk.msgbox('Jackster', 'Pick a finished download to play it.', 'info'); }
      else if (k === 'xcancel') { const t = TR.list.find(i => i.n === xSel); if (t && !/^(Complete|Error|Cancelled)/.test(t.state)) { t.state = 'Cancelled'; renderX(); } }
      else if (k === 'xclear') { TR.list = TR.list.filter(t => !/^(Complete|Error|Cancelled|Aborted)/.test(t.state)); renderX(); }
      else if (k === 'irc') { if (Apps.apps['social.irc']) Apps.open('social.irc'); else Desk.msgbox('Jackster', 'JackIRC is not installed.', 'warn'); }
    });
    // ---- live updates
    E.sqs.onList = () => { if (tab === 'search' && results.length) search(); stat(); };
    E.sqs.playNow = id => { if (!CATI[id]) return; w.restore(); show('lib'); playC(CATI[id]); libSel = fileName(CATI[id]); renderLib(); };
    E.sqs.onUp = () => { E.secret('sqs.self'); sfx('pet'); K.status('Someone is downloading a song from you!'); if (tab === 'xfer') renderX(); };
    const iv = setInterval(() => { if (K.closed) return; tickX(); if (tab === 'xfer') renderX(); }, 250);
    const iv2 = setInterval(() => { if (K.closed) return; stat(); if (tab === 'hot') renderHot(); }, 4000);
    K.onClose(() => {
      clearInterval(iv); clearInterval(iv2); E.sqs.onList = null; E.sqs.onUp = null; E.sqs.playNow = null; stopTune();
      TR.list.forEach(t => { if (/^(Negotiating|Remotely queued|Transferring|Timed out)/.test(t.state)) t.state = 'Aborted (Jackster was closed)'; });
    });
    K.menus([
      ['File', [{ label: 'Find It!', act: () => { show('search'); search(); } }, { label: 'Open My Music', act: () => Apps.open('explorer', 'C:/My Documents/My Music') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Actions', [{ label: 'Get Selected Song(s)', act: get }, { label: 'Stop Playing', act: () => { stopTune(); nowPlaying = ''; } }, { label: 'Clear Finished Transfers', act: () => { TR.list = TR.list.filter(t => !/^(Complete|Error|Cancelled|Aborted)/.test(t.state)); renderX(); } }]],
      ['Help', [{ label: 'Jackster Help', act: () => show('help') }, '-', { label: 'About Jackster...', act: () => E.about('Jackster', E.I.squigster, ['<b>Jackster v1.0 beta</b>', 'Music sharing for the whole of JackNet.<br>Written in a weekend by a lad in his bedroom.', 'MIDI only. No MP3s. No exceptions. No, Dave.']) }]],
    ]);
    askLists(); stat();
    if (arg && arg.play && CATI[arg.play]) { show('lib'); playC(CATI[arg.play]); libSel = fileName(CATI[arg.play]); renderLib(); }
    else { show('search'); renderRes(); }
  };
  E.mods.squigster.play = id => { if (CATI[id]) Apps.open('era.squigster', { play: id }); };
})();

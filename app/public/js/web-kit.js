/* web-kit: the 1999 web-design toolkit for the hidden web (lazy-loaded before any page file).
 * Pixel sprites + "scanned photos", spinning GIFs, banner ads (and the Splat the Squig ad game), frames-style site
 * navigation, plugin and Java applet boxes, broken images, dead links, image maps, status-bar scrollers, pop-up
 * windows (real desktop windows via Apps.win, never drawn inside a page), page templates and the adopted pixel pet. */
(function () {
  const W = window.WebPack, A = window.Apps, esc = W.esc, M = W.M;
  const store = A.store;

  // ================================================================ styles
  const css = document.createElement('style'); css.id = 'wkit-css';
  css.textContent = `
.wpg a.wvis{color:#551a8b}
.wpg .wgb-sv{font-size:12px;font-weight:normal}.wpg .wgb-sv a{color:#ff0}
/* frames */
.wfr{display:flex;border:2px inset #fff;background:inherit;height:640px;margin:-4px 0 0}
.wfr-nav{width:170px;flex:none;overflow:auto;border-right:7px ridge #c0c0c0;padding:10px 8px;background:rgba(0,0,0,.08);font-size:13px}
.wfr-nav .wfr-logo{font-weight:bold;font-size:15px;margin-bottom:8px;line-height:1.15}
.wfr-nav .wfr-i{margin:5px 0}.wfr-nav .wfr-i b{font-weight:bold}
.wfr-main{flex:1;overflow:auto;padding:14px 16px;min-width:0}
.wfr-nof{display:none;font-size:11px;font-style:italic;text-align:center;margin:4px 0}
.wtf{border-bottom:7px ridge #c0c0c0;margin:-18px -18px 14px;padding:8px 14px;background:rgba(0,0,0,.12);display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap}
.wtf .wtf-t{font-weight:bold;font-size:17px;margin-right:auto}
.wtn{text-align:center;margin:10px 0;font-size:13px}
.wbn{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:0 0 14px}
.wbn a,.wbn b{display:inline-block;padding:4px 12px;font:bold 12px Arial,sans-serif;text-decoration:none;color:#fff!important;background:linear-gradient(#6a8ad8,#1a3a9a);border:3px outset #9ab4ff;text-shadow:1px 1px 0 #000;border-radius:2px}
.wbn b{background:linear-gradient(#d86a6a,#9a1a1a);border-style:inset;border-color:#ff9a9a}
@media (max-width:600px){.wfr{flex-direction:column;height:auto}.wfr-nav{width:auto;border-right:0;border-bottom:7px ridge #c0c0c0;display:flex;flex-wrap:wrap;gap:2px 12px;align-items:center}.wfr-nav .wfr-logo{width:100%;margin:0}.wfr-nav .wfr-i{margin:0}.wfr-main{overflow:visible;padding:10px 4px}.wfr-nof{display:block}.wtf{margin:-12px -10px 12px}}
/* "GIFs" */
.wgif{display:inline-block;vertical-align:middle}
.wgif-globe{width:32px;height:32px}
.wgif-globe .gl{animation:wglobe 2s linear infinite}
@keyframes wglobe{to{transform:translateX(-20px)}}
.wgif-spin{animation:wspin 1.6s linear infinite}
@keyframes wspin{0%{transform:scaleX(1)}25%{transform:scaleX(.05)}50%{transform:scaleX(-1)}75%{transform:scaleX(.05)}100%{transform:scaleX(1)}}
.wgif-mail .flap{transform-origin:16px 9px;animation:wflap 1s steps(2) infinite}
@keyframes wflap{50%{transform:scaleY(-1)}}
.wgif-mail .lt{animation:wletter 1s steps(4) infinite}
@keyframes wletter{0%{transform:translateY(4px)}100%{transform:translateY(-6px)}}
.wnew{display:inline-block;font:bold 11px Arial,sans-serif;padding:1px 5px;color:#fff;background:#e10600;border:1px solid #ff0;transform:rotate(-8deg);animation:wnew .5s steps(2) infinite;vertical-align:middle}
@keyframes wnew{50%{background:#ff0;color:#e10600}}
.wnew.hot{background:#ff6a00;animation-duration:.35s}
.whr{height:6px;border:0;margin:14px auto;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet,red);background-size:200% 100%;animation:whr 2s linear infinite;max-width:90%}
@keyframes whr{to{background-position:200% 0}}
.wfire{height:18px;background:repeating-linear-gradient(90deg,#f00 0 6px,#f80 6px 10px,#ff0 10px 13px);-webkit-mask:radial-gradient(circle at 50% 100%,#000 60%,transparent 62%) 0 0/12px 18px;mask:radial-gradient(circle at 50% 100%,#000 60%,transparent 62%) 0 0/12px 18px;animation:wfire .3s steps(2) infinite;margin:6px 0}
@keyframes wfire{50%{transform:scaleY(.8) translateY(2px)}}
/* pictures */
.wspr{image-rendering:pixelated;image-rendering:crisp-edges;vertical-align:middle}
.wphoto{display:inline-block;vertical-align:top;background:#fff;color:#000;padding:5px 5px 3px;border:1px solid #888;margin:6px;text-align:center;font:11px Arial,sans-serif;max-width:220px;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.wphoto canvas{display:block;width:192px;height:144px;max-width:100%;cursor:pointer;background:#000}
.wphoto span{display:block;margin-top:3px}
.wbroken{display:inline-flex;align-items:flex-start;gap:4px;padding:3px;border:1px solid #808080;border-right-color:#fff;border-bottom-color:#fff;background:transparent;font:11px Arial,sans-serif;color:inherit;vertical-align:top;margin:4px;cursor:pointer;overflow:hidden;box-sizing:border-box}
.wbroken i{flex:none;width:14px;height:14px;background:#fff;border:1px solid #888;color:#e10600;font:bold 12px/13px Arial,sans-serif;text-align:center;font-style:normal}
.wbroken canvas{width:100%;height:100%}
/* ads */
.wad{position:relative;display:block;width:468px;max-width:100%;height:60px;margin:10px auto;border:2px solid #000;overflow:hidden;cursor:pointer;text-decoration:none!important;box-sizing:border-box;font:bold 17px/1.1 Impact,"Arial Black",sans-serif;text-align:center;user-select:none}
.wad .wad-f{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 60px 0 8px;letter-spacing:.5px}
.wad .wad-tag{position:absolute;right:3px;bottom:2px;font:9px Arial,sans-serif;opacity:.8}
.wad .wad-cta{position:absolute;right:6px;top:50%;transform:translateY(-50%);font:bold 11px Arial,sans-serif;background:#ff0;color:#000;padding:3px 6px;border:2px outset #ffa;animation:wnew .6s steps(2) infinite}
.wad-cap{text-align:center;font:9px Arial,sans-serif;color:#888;margin:-8px 0 8px}
.wsplat .wsq{position:absolute;top:8px;left:0;width:42px;height:42px;animation:wsplat 2.2s ease-in-out infinite alternate;cursor:crosshair}
.wsplat .wsq canvas{width:42px;height:42px}
@keyframes wsplat{0%{left:2%}100%{left:calc(98% - 42px)}}
.wsplat.done .wsq{animation-play-state:paused}
/* plugin + applets */
.wplug{display:flex;align-items:center;justify-content:center;gap:8px;background:#c8c8c8;border:1px solid #808080;color:#000;font:12px Arial,sans-serif;text-align:center;margin:8px auto;padding:10px;max-width:100%;box-sizing:border-box}
.wplug .pz{flex:none;width:30px;height:30px}
.wapplet{position:relative;background:#c8c8c8;border:1px solid #808080;color:#000;font:12px Arial,sans-serif;margin:8px auto;max-width:100%;overflow:hidden}
.wapplet .wap-l{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px}
.wapplet canvas{display:block;width:100%;height:100%;image-rendering:pixelated}
.wflash{background:#000;color:#fff;margin:8px auto;max-width:100%;overflow:hidden;position:relative;font:bold 20px Arial,sans-serif}
/* misc */
.wp-u-kim .nw{white-space:nowrap}
.wtick{background:#000;color:#ff0;font:bold 13px "Courier New",monospace;padding:3px 0;border:2px inset #888;margin:8px 0}
.wtick b{color:#0f0}
.wmap{display:block;margin:8px auto;width:520px;max-width:100%;height:auto}
.wmap .hot{cursor:pointer}
.wmap .hot:hover,.wmap .hot:focus{opacity:.75}
.wsplash{min-height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px}
.wenter{font:bold 34px "Times New Roman",serif;letter-spacing:8px;animation:wnew 1s steps(2) infinite;padding:6px 20px;border:3px double currentColor;text-decoration:none!important}
.wlast{font:italic 11px "Times New Roman",serif;text-align:center;margin:8px 0}
.wgring{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin:12px auto;max-width:560px;padding:8px 10px;background:#000 radial-gradient(circle,#fff 0 1px,transparent 1.5px) 0 0/23px 17px;border:3px ridge #ffe81f;font:12px Arial,sans-serif;color:#ffe81f;text-align:center}
.wgring a{color:#fff!important;font-weight:bold}
.wtpl table.wt{border-collapse:separate;border-spacing:4px;width:100%}
.wtpl table.wt td,.wtpl table.wt th{border:1px solid currentColor;padding:4px 6px;vertical-align:top;text-align:left}
.waward{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:150px;height:96px;margin:6px;padding:6px;box-sizing:border-box;text-align:center;font:bold 12px Georgia,serif;color:#000;background:radial-gradient(circle at 50% 30%,#fff9c0,var(--ac,#ffd400));border:4px double #7a5a00;border-radius:50% / 40%;box-shadow:2px 2px 0 rgba(0,0,0,.3);vertical-align:top}
.waward small{font:10px Arial,sans-serif;font-weight:normal}
/* pop-up window contents (inside a real desktop window) */
.wpopw{display:flex;flex-direction:column;min-height:160px;max-height:70vh;margin:-8px}
.wpopw .wpop-a{font:11px var(--ui);padding:2px 4px;background:#c0c0c0;border-bottom:1px solid #808080;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wpopw .wpop-a span{background:#fff;border:1px inset #fff;padding:0 4px}
.wpopw .wpop-p{flex:1;overflow:auto;background:#fff;color:#000;font:14px/1.4 "Times New Roman",serif;padding:10px;text-align:center}
.wpopw .wpop-p a{color:#00e;cursor:pointer;text-decoration:underline}
/* the pet */
.wpet{text-align:center;font:12px var(--ui)}
.wpet canvas{width:144px;height:144px;image-rendering:pixelated;background:#cfe6f6;border:2px inset #fff;display:block;margin:0 auto 6px}
.wpet .bar{height:10px;background:#fff;border:1px inset #fff;margin:2px 0 6px;position:relative}
.wpet .bar i{position:absolute;left:0;top:0;bottom:0;background:#0a0}
`;
  document.head.appendChild(css);

  // ================================================================ pixel sprites (12x12, original)
  const PAL = { k: '#000', w: '#fff', r: '#e10600', o: '#ff8c00', y: '#ffd400', g: '#3c3', G: '#1a7a1a', b: '#2a7ad8', B: '#003080', c: '#6cf', p: '#f9c', P: '#a040c0', n: '#8a5a2a', N: '#5a3a1a', s: '#f2c79a', e: '#999', E: '#555', l: '#ccc', t: '#d9a441', m: '#e8381b' };
  const SPR = {
    cat: ['............', '..o......o..', '..oo....oo..', '..oooooooo..', '..okooooko..', '..ooowwooo..', '...oopppo...', '...oooooo...', '..oooooooo.o', '..oooooooo.o', '..oooooooooo', '..oo....oo..'],
    dog: ['............', '........tt..', '.......tttt.', '.......tkttk', '......Ntttt.', 't.ttttttttt.', '.tttttttttt.', '..ttttttttt.', '..ttttttttt.', '..t.t...t.t.', '..t.t...t.t.', '............'],
    hamster: ['............', '............', '...t....t...', '..ttttttttt.', '.tttttkttkt.', '.ttttwwwttpt', '.twwwwwwwttt', '.twwwwwwwwtt', '..tttttttttt', '...nn...nn..', '............', '............'],
    rock: ['............', '............', '............', '............', '....eeee....', '..eeeeeeee..', '.eeleeeeeee.', '.eewkeewkee.', '.eeeeeeeeee.', '..eeeeEEee..', '...EEEEEE...', '............'],
    fish: ['............', '............', '............', '......oo....', '....ooooo..o', '..ookooooooo', '.oooooooooo.', '..oooooooo.o', '....ooooo...', '......oo....', '............', '............'],
    ork: ['............', '...GGGGGG...', '..GgggggggG.', '.GgrrggrrggG', '.GggggggggGG', '.GgkkkkkkkgG', '.GgwkwkwkwgG', '..GggggggggG', '...GGGGGG...', '.EEEEEEEEEE.', 'EEeeeeeeeeEE', 'EEeeeeeeeeEE'],
    squig: ['............', '..m......m..', '..mm....mm..', '...mmmmmm...', '..mmmmmmmm..', '.mmwwmmwwmm.', '.mmwkmmwkmm.', '.mpmmmmmmpm.', '.mmmkkkkmmm.', '..mmmkkmmm..', '...mmmmmm...', '..NNN..NNN..'],
    house: ['.....rr.....', '....rrrr....', '...rrrrrr...', '..rrrrrrrr..', '.rrrrrrrrrr.', 'rrrrrrrrrrrr', '.wwwwwwwwww.', '.wccwwwwccw.', '.wccwnnwccw.', '.wwwwnnwwww.', '.wwwwnnwwww.', 'GGGGGGGGGGGG'],
    computer: ['............', '.eeeeeeeeee.', '.eBBBBBBBBe.', '.eBbbbbbbBe.', '.eBbbbbbbBe.', '.eBbbbbbbBe.', '.eBBBBBBBBe.', '.eeeeeeeeee.', '....eeee....', '..llllllll..', '.llllllllll.', '............'],
    floppy: ['............', '.BBBBBBBBBB.', '.BBBeeeeBBB.', '.BBBeEeeBBB.', '.BBBeeeeBBB.', '.BBBBBBBBBB.', '.BwwwwwwwwB.', '.BwkkkkkkwB.', '.BwwwwwwwwB.', '.BwkkkkwwwB.', '.BBBBBBBBBB.', '............'],
    cube: ['............', '.kkkkkkkkkk.', '.krrkwwkbbk.', '.krrkwwkbbk.', '.kkkkkkkkkk.', '.kyykggkook.', '.kyykggkook.', '.kkkkkkkkkk.', '.kbbkrrkwwk.', '.kbbkrrkwwk.', '.kkkkkkkkkk.', '............'],
    rocket: ['.....rr.....', '....rrrr....', '...ewwwwe...', '...ewccwe...', '...ewccwe...', '...ewwwwe...', '...ewrrwe...', '..rewwwwer..', '.rrewwwwerr.', '.rr.eEEe.rr.', '.....oo.....', '.....yy.....'],
    planet: ['............', '............', '............', '...ooooo....', '..ooooooo...', 'yyoooooooyyy', '.yyyyyyyyyy.', '..ooooooo...', '...ooooo....', '............', '............', '............'],
    ufo: ['............', '............', '............', '.....cc.....', '....cccc....', '..eeeeeeee..', '.eyeyeyeyee.', '..eeeeeeee..', '...y.y.y....', '..y.y.y.y...', '............', '............'],
    trophy: ['............', '..yyyyyyyy..', 'yyyyyyyyyyyy', 'y.yyyyyyyy.y', 'y.yyyyyyyy.y', '.yyyyyyyyyy.', '..yyyyyyyy..', '....yyyy....', '.....yy.....', '....nnnn....', '...nnnnnn...', '............'],
    guitar: ['..........nn', '.........nn.', '........nn..', '.......nn...', '...rrrnn....', '..rrrrrr....', '.rrrrkrrr...', '.rrrkkkrr...', '.rrrrkrrr...', '..rrrrrr....', '...rrrr.....', '............'],
    star: ['............', '.....yy.....', '.....yy.....', '....yyyy....', 'yyyyyyyyyyyy', '.yyyyyyyyyy.', '..yyyyyyyy..', '..yyyyyyyy..', '.yyyy..yyyy.', '.yy......yy.', '............', '............'],
    cake: ['............', '.....y......', '.....r......', '.....w......', '..pppppppp..', '.pwpwpwpwpw.', '.nnnnnnnnnn.', '.wwwwwwwwww.', '.nnnnnnnnnn.', '.pppppppppp.', 'eeeeeeeeeeee', '............'],
    flower: ['............', '....pp......', '...pyyp.....', '....pp......', '.....g......', '..g..g......', '...g.g......', '.....g..pp..', '.....g.pyyp.', '.....g..pp..', '....nnnn.g..', 'GGGGGGGGGGGG'],
    ball: ['............', '............', '....kkkk....', '..kwwkkwwk..', '.kwwwkkwwwk.', '.kkwwwwwwkk.', '.kwwwkkwwwk.', '.kwwkkkkwwk.', '..kwwkkwwk..', '....kkkk....', '............', '............'],
    yoyo: ['.....k......', '.....k......', '.....k......', '.....k......', '...rrrrr....', '..rrrrrrr...', '..rrwwwrr...', '..rrrrrrr...', '...rrrrr....', '............', '............', '............'],
    kid: ['..........g.', '.........g..', '...nnn..g...', '..nsssn.e...', '...sss.s....', '..bbbbbb....', '.sbbbbb.....', '..bbbbb.....', '..BBBBB.....', '..BB.BB.....', '..BB.BB.....', '..kk.kk.....'],
    pod: ['............', '.eeeoe......', 'Eeeeoey.....', '.eeeoe.k....', '..c.c...k...', '..c.c....bbb', '..c.c...kbcc', '..c.c....bbb', '.eeeoe..k...', 'Eeeeoeyk....', '.eeeoe......', '............'],
    teapot: ['............', '............', '.....bb.....', '...bbbbbb...', 'b.bbbbbbbb.b', 'bbbbbwbbbbbb', '.bbbbbbbbbb.', '..bbbbbbbb..', '...bbbbbb...', '............', '............', '............'],
    skull: ['............', '...wwwwww...', '..wwwwwwww..', '.wwwwwwwwww.', '.wkkwwwwkkw.', '.wkkwwwwkkw.', '.wwwwkkwwww.', '..wwwwwwww..', '...wkwkwk...', '...wwwwww...', '............', '............'],
    tree: ['.....GG.....', '....GGGG....', '...GGgGGG...', '..GGGGGgGG..', '.GGgGGGGGGG.', '..GGGGGGGG..', '.GGGGgGGGGG.', 'GGGGGGGGGGGG', '.....nn.....', '.....nn.....', '.....nn.....', '............'],
    car: ['............', '............', '............', '............', '...rrrrr....', '..rccrccr...', '.rrrrrrrrrr.', 'rrrrrrrrrrrr', 'rrkkrrrrkkrr', '..kk....kk..', '............', '............'],
    robot: ['............', '.....r......', '...eeeee....', '...ecece....', '...eeeee....', '....eee.....', '.eeeeeeeee..', 'e.eeeeeee.e.', 'e.eeeeeee.e.', '..ee...ee...', '..ee...ee...', '.eee...eee..'],
    tortoise: ['............', '............', '............', '............', '....GGGG....', '...GgGGgG...', '..GGGgGGGG..', '..GGGGGGGGss', '..s..s..s...', '............', '............', '............'],
    mushroom: ['............', '............', '...rrrrrr...', '..rrwrrrwr..', '.rrrrrrwrrr.', '.rwrrrrrrrr.', '....wwww....', '....wwww....', '....wwww....', 'GGGGGGGGGGGG', '............', '............'],
    candle: ['.....y......', '....yoy.....', '....yoy.....', '.....k......', '...ewwwle...', '...ewwwle...', '...ewwwle...', '...ewwwle...', '...ewwwle...', '..eeeeeeee..', '...EEEEEE...', '............'],
    joystick: ['............', '............', '.....r......', '....rrr.....', '.....k......', '.....k......', '.....k......', '..kkkkkkk...', '.kEEEEEEEk..', '.kEEEEEEEk..', '.kkkkkkkkk..', '............'],
    blob: ['............', '............', '............', '............', '....gggg....', '..gggggggg..', '.ggwkggwkgg.', '.gggggggggg.', '.ggkggggkgg.', '.gggkkkkggg.', 'gggggggggggg', '............'],
    bat: ['............', '............', '............', 'P..........P', 'PP..PPPP..PP', 'PPPPwkPwkPPP', '.PPPPPPPPPP.', '..PP.PP.PP..', '............', '............', '............', '............'],
    dragon: ['............', '........rr..', '.......rrrr.', '.......rkrrr', 'r.....rrrrr.', 'rr...rrrrr..', '.rrrrrrrr...', '..ryryrrr...', '..rrrrrrr...', '...r.r.r....', '............', '............'],
  };
  W.SPR = SPR;
  // the weather (seeded by the 1999 date), used by the start pages
  const WX = [['\u2614', 'Rain', 9, 14], ['\u2614', 'Heavy rain', 7, 12], ['\u26C5', 'Sunny spells', 12, 18], ['\u2601', 'Cloudy', 10, 15], ['\u2600', 'Sunny (!)', 15, 23], ['\u2614', 'Drizzle', 8, 13], ['\u2601', 'Grey', 9, 14], ['\u26A1', 'Thunder', 13, 19], ['\u2744', 'Frost', -1, 4], ['\u2614', 'Rain again', 8, 13]];
  W.weather = W.weather || (t => { const out = []; for (let i = 0; i < 5; i++) { const d = new Date(1999, t.m - 1, t.d + i), s2 = (d.getDate() * 7 + d.getMonth() * 13 + i * 3) % WX.length, w = WX[s2], cold = d.getMonth() < 2 || d.getMonth() > 9; out.push({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], icon: w[0], desc: cold && w[1] !== 'Frost' ? w[1] + ' (cold)' : w[1], hi: w[3] - (cold ? 8 : 0), lo: w[2] - (cold ? 8 : 0) }); } return out; });
  function drawSprite(g, name, x, y, o) {
    const s = SPR[name]; if (!s) return; o = o || {};
    const sw = o.swap || {};
    for (let r = 0; r < 12; r++) for (let q = 0; q < 12; q++) {
      const ch = s[r][o.flip ? 11 - q : q]; if (ch === '.' || !ch) continue;
      g.fillStyle = PAL[sw[ch] || ch] || '#f0f'; g.fillRect(x + q, y + r, 1, 1);
    }
  }
  W.drawSprite = drawSprite;
  // a "scanned photo": 'sky ground; sprite x y [flip] [swap=gr] [bare] [solved] ; ...' in 48x36 units.
  // Drawn at whatever size the canvas is (normally 192x144): each sprite name has a proper drawing below
  // (outlined and shaded like a photo of a toy/pet/thing), then it gets the 1999 scanner treatment.
  const hex = c => { c = String(c).replace('#', ''); if (c.length === 3) c = c.split('').map(v => v + v).join(''); const n = parseInt(c, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const tone = (c, k) => { const [r, g2, b] = hex(c); const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(r)},${f(g2)},${f(b)})`; };
  const lum = c => { const [r, g2, b] = hex(c); return (r * 0.3 + g2 * 0.59 + b * 0.11) / 255; };
  const INK = 'rgba(28,18,10,.88)';
  // little drawing kit for the photo drawings (all in a 48x48 box per sprite)
  function kit(g) {
    const K = {
      path(fn) { g.beginPath(); fn(); return K; },
      fill(col, x0, y0, x1, y1, lw) { // fill with a soft light-to-dark shade, then an ink outline
        if (x1 != null && (x0 !== x1 || y0 !== y1)) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, tone(col, 0.32)); gr.addColorStop(0.55, col); gr.addColorStop(1, tone(col, -0.3)); g.fillStyle = gr; } else g.fillStyle = col;
        g.fill(); if (lw !== 0) { g.lineWidth = lw || 1.6; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); } return K;
      },
      ell(cx, cy, rx, ry, rot) { g.moveTo(cx + rx * Math.cos(rot || 0), cy + rx * Math.sin(rot || 0)); g.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); return K; },
      rr(x, y, w, h, r) { if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); return K; },
      poly(pts) { pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); return K; },
      line(pts, col, lw) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = lw || 1.5; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.lineCap = 'butt'; return K; },
      dot(x, y, r, col) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); return K; },
      shine(x, y, rx, ry, a) { g.beginPath(); g.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); g.fillStyle = `rgba(255,255,255,${a || 0.45})`; g.fill(); return K; },
      shadow(cx, cy, rx, ry) { g.beginPath(); g.ellipse(cx, cy, rx, ry || rx * 0.22, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill(); return K; },
      eye(x, y, r, look) { K.dot(x, y, r, '#fff'); g.lineWidth = 0.8; g.strokeStyle = INK; g.stroke(); K.dot(x + (look || 0.5) * r * 0.4, y, r * 0.55, '#111'); K.dot(x + r * 0.1, y - r * 0.3, r * 0.2, '#fff'); return K; },
    };
    return K;
  }
  // each drawing: (g, K, C, o). C(letter, default) gives the sprite colour (honouring swap=).
  const PH = {
    cat(g, K, C) { const O = C('o', '#f08a24'), D = tone(O, -0.28);
      K.shadow(24, 46, 15);
      K.line([[33, 43], [42, 41], [45, 33], [41, 26]], INK, 5.2).line([[33, 43], [42, 41], [45, 33], [41, 26]], O, 3.4);
      K.path(() => K.poly([[12, 46], [14, 30], [20, 24], [30, 24], [35, 32], [36, 46]])).fill(O, 14, 24, 34, 46);
      K.path(() => K.ell(24, 40, 6, 6)).fill('#fff4e0', 0, 0, 0, 0, 0);
      [[14, 30], [16, 36], [33, 31], [32, 37]].forEach(([x, y]) => K.line([[x, y], [x + (x < 24 ? 4 : -4), y + 1]], D, 1.6));
      K.path(() => { K.ell(18, 45, 4, 2.4); K.ell(29, 45, 4, 2.4); }).fill('#fff4e0', 0, 0, 0, 0, 1.2);
      K.path(() => K.poly([[12, 10], [13, -1], [21, 6]])).fill(O).path(() => K.poly([[36, 10], [35, -1], [27, 6]])).fill(O);
      K.path(() => K.poly([[14, 7], [14, 2], [18, 6]])).fill('#ffb0a0', 0, 0, 0, 0, 0).path(() => K.poly([[34, 7], [34, 2], [30, 6]])).fill('#ffb0a0', 0, 0, 0, 0, 0);
      K.path(() => K.ell(24, 14, 12.5, 10.5)).fill(O, 14, 4, 34, 26);
      K.line([[20, 5], [21, 9]], D, 1.4).line([[24, 4], [24, 8]], D, 1.4).line([[28, 5], [27, 9]], D, 1.4);
      K.path(() => K.ell(24, 19, 6, 4)).fill('#fff4e0', 0, 0, 0, 0, 0);
      for (const x of [19, 29]) { K.path(() => K.ell(x, 13, 2.8, 3)).fill('#9be04a', 0, 0, 0, 0, 0.8); K.path(() => K.ell(x, 13, 0.9, 2.6)).fill('#111', 0, 0, 0, 0, 0); K.dot(x - 0.8, 12, 0.6, '#fff'); }
      K.path(() => K.poly([[22.5, 17], [25.5, 17], [24, 19]])).fill('#ff7a8a', 0, 0, 0, 0, 0.8);
      K.line([[24, 19], [24, 21], [22, 22]], INK, 0.9).line([[24, 21], [26, 22]], INK, 0.9);
      K.line([[18, 19], [9, 18]], 'rgba(255,255,255,.9)', 0.7).line([[18, 20.5], [9, 22]], 'rgba(255,255,255,.9)', 0.7).line([[30, 19], [39, 18]], 'rgba(255,255,255,.9)', 0.7).line([[30, 20.5], [39, 22]], 'rgba(255,255,255,.9)', 0.7);
    },
    dog(g, K, C) { const T = C('t', '#d9a441'), D = tone(T, -0.35);
      K.shadow(24, 46, 18);
      K.line([[8, 26], [3, 16]], INK, 5).line([[8, 26], [3, 16]], T, 3.2);
      for (const [x, b] of [[11, 1], [16, 0], [30, 1], [35, 0]]) K.path(() => K.rr(x - 2.5, 30, 5, 15, 2)).fill(b ? D : T, x - 3, 0, x + 3, 0);
      K.path(() => K.ell(23, 28, 15, 8.5)).fill(T, 10, 20, 36, 36);
      K.path(() => K.ell(22, 32, 8, 3)).fill(tone(T, 0.35), 0, 0, 0, 0, 0);
      K.path(() => K.poly([[30, 26], [33, 16], [40, 18], [38, 30]])).fill(T, 30, 16, 40, 30, 0);
      K.path(() => K.ell(37, 15, 7.5, 7)).fill(T, 30, 8, 44, 22);
      K.path(() => K.rr(40, 13, 8, 7, 3)).fill(tone(T, 0.2), 40, 13, 48, 20);
      K.dot(46.5, 14.5, 1.6, '#111').shine(46, 14, 0.6, 0.4, 0.8);
      K.line([[42, 18.5], [46, 18.5]], INK, 0.9);
      K.path(() => { g.moveTo(32, 10); g.quadraticCurveTo(28, 14, 31, 22); g.quadraticCurveTo(35, 20, 35, 11); }).fill(C('N', '#7a4a1a'), 30, 10, 36, 22, 1.2);
      K.eye(38.5, 13, 1.7, 1);
      K.path(() => K.rr(31, 20, 8, 2.6, 1)).fill('#d01818', 0, 0, 0, 0, 0.8); K.dot(35, 23.6, 1.3, '#ffd400');
    },
    hamster(g, K, C) { const T = C('t', '#e0a64e'), Wc = C('w', '#fff6e8');
      K.shadow(24, 45, 18);
      for (const x of [12, 33]) K.path(() => K.ell(x, 43, 3, 1.8)).fill('#ffb6b0', 0, 0, 0, 0, 1);
      K.path(() => { g.moveTo(5, 38); g.bezierCurveTo(4, 18, 22, 14, 33, 18); g.bezierCurveTo(44, 21, 46, 34, 42, 40); g.bezierCurveTo(36, 46, 10, 47, 5, 38); }).fill(T, 8, 16, 40, 46);
      K.path(() => { g.moveTo(9, 40); g.bezierCurveTo(14, 33, 28, 31, 40, 34); g.bezierCurveTo(41, 41, 34, 45, 22, 45); g.bezierCurveTo(14, 45, 10, 43, 9, 40); }).fill(Wc, 0, 0, 0, 0, 0);
      K.path(() => K.ell(37, 31, 6.5, 5)).fill(Wc, 0, 0, 0, 0, 0);
      K.path(() => K.ell(29, 16, 4.2, 4.4)).fill(T).path(() => K.ell(29, 16.4, 2.3, 2.5)).fill('#ffb6b0', 0, 0, 0, 0, 0);
      K.dot(36, 24, 2.2, '#111').dot(35.3, 23.2, 0.7, '#fff');
      K.path(() => K.ell(44, 29, 1.6, 1.3)).fill('#ff8a9a', 0, 0, 0, 0, 0.6);
      K.line([[43, 31], [48, 30]], 'rgba(60,40,20,.7)', 0.5).line([[43, 32], [48, 33]], 'rgba(60,40,20,.7)', 0.5);
      K.path(() => K.ell(41, 41, 2, 1.6)).fill('#ffb6b0', 0, 0, 0, 0, 0.8);
      K.shine(16, 24, 6, 3, 0.25);
    },
    rock(g, K, C) { const E = C('e', '#9a958c');
      K.shadow(24, 44, 20, 3);
      K.path(() => K.poly([[4, 42], [3, 32], [8, 22], [17, 17], [29, 16], [39, 20], [45, 29], [45, 40], [38, 44], [12, 45]])).fill(E, 6, 16, 42, 45, 1.8);
      K.line([[11, 38], [16, 35], [18, 39]], tone(E, -0.35), 0.9).line([[34, 37], [38, 33]], tone(E, -0.35), 0.9);
      for (let i = 0; i < 14; i++) K.dot(8 + (i * 13) % 34, 22 + (i * 7) % 20, 0.6, tone(E, i % 2 ? -0.3 : 0.4));
      K.shine(16, 23, 6, 2.5, 0.3);
      K.eye(18, 29, 4.2, 0.6).eye(30, 29, 4.2, -0.4);
      K.line([[21, 37], [24, 38.5], [27, 37]], INK, 1);
    },
    fish(g, K, C) { const O = C('o', '#ff8a1a');
      K.path(() => { g.moveTo(34, 24); g.lineTo(46, 13); g.quadraticCurveTo(42, 24, 46, 35); g.closePath(); }).fill(O, 34, 14, 46, 34);
      K.line([[37, 22], [44, 16]], tone(O, -0.3), 0.7).line([[37, 26], [44, 32]], tone(O, -0.3), 0.7);
      K.path(() => { g.moveTo(16, 15); g.quadraticCurveTo(24, 6, 30, 15); }).fill(O, 16, 8, 30, 15, 1.2);
      K.path(() => { g.moveTo(4, 24); g.bezierCurveTo(8, 12, 30, 10, 37, 24); g.bezierCurveTo(30, 37, 8, 36, 4, 24); }).fill(O, 6, 14, 30, 36);
      K.path(() => { g.moveTo(18, 30); g.quadraticCurveTo(22, 38, 26, 31); }).fill(O, 0, 0, 0, 0, 1);
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) K.line([[15 + q * 5, 19 + r * 4], [17 + q * 5, 21 + r * 4], [15 + q * 5, 23 + r * 4]], tone(O, -0.22), 0.7);
      K.eye(10, 21, 3.2, -0.8);
      K.line([[4.5, 25], [7, 26]], INK, 0.9);
      K.shine(18, 16, 6, 1.6, 0.4);
    },
    ork(g, K, C) { const G = C('g', '#4caa3a'), D = C('G', '#2a6a1a'), E = C('E', '#6a6a72');
      K.path(() => K.poly([[2, 48], [4, 38], [14, 34], [34, 34], [44, 38], [46, 48]])).fill(E, 4, 34, 44, 48);
      K.line([[8, 40], [8, 47]], tone(E, 0.4), 1).line([[40, 40], [40, 47]], tone(E, 0.4), 1); K.dot(12, 41, 1, '#ccc').dot(36, 41, 1, '#ccc');
      K.path(() => K.poly([[3, 14], [10, 16], [9, 22]])).fill(G).path(() => K.poly([[45, 14], [38, 16], [39, 22]])).fill(G);
      K.path(() => { g.moveTo(10, 14); g.quadraticCurveTo(24, 2, 38, 14); g.lineTo(40, 26); g.quadraticCurveTo(40, 38, 24, 38); g.quadraticCurveTo(8, 38, 8, 26); g.closePath(); }).fill(G, 10, 6, 38, 38);
      K.path(() => K.poly([[12, 15], [24, 18], [36, 15], [36, 18], [24, 21], [12, 18]])).fill(D, 0, 0, 0, 0, 1);
      K.dot(17.5, 21, 2.2, '#ff2a10').dot(30.5, 21, 2.2, '#ff2a10').dot(17, 20.4, 0.7, '#ffe0a0').dot(30, 20.4, 0.7, '#ffe0a0');
      K.path(() => K.poly([[22, 22], [26, 22], [27, 26], [21, 26]])).fill(tone(G, -0.15), 0, 0, 0, 0, 0.8);
      K.path(() => { g.moveTo(12, 29); g.quadraticCurveTo(24, 26, 36, 29); g.lineTo(34, 35); g.quadraticCurveTo(24, 37, 14, 35); g.closePath(); }).fill('#3a1010', 0, 0, 0, 0, 1);
      for (const x of [15, 19.5, 24, 28.5, 33]) K.path(() => K.poly([[x - 1.6, 30], [x + 1.6, 30], [x, 32.5]])).fill('#fff8d8', 0, 0, 0, 0, 0.5);
      K.path(() => K.poly([[13, 35], [15, 27], [17, 35]])).fill('#fff8d8', 0, 0, 0, 0, 0.8).path(() => K.poly([[31, 35], [33, 27], [35, 35]])).fill('#fff8d8', 0, 0, 0, 0, 0.8);
      K.shine(18, 11, 6, 2, 0.3);
    },
    squig(g, K, C) { const M = C('m', '#e8381b'); // a Blobbit: round, bouncy, big eyes, friendly grin
      K.shadow(24, 46, 16);
      for (const x of [16, 32]) K.path(() => K.ell(x, 43, 5.5, 3)).fill(tone(M, -0.3), x - 5, 40, x + 5, 46, 1.2);
      for (const s of [-1, 1]) K.path(() => K.ell(24 + s * 11, 10, 3.6, 5.5, s * 0.5)).fill(M, 20 + s * 11, 4, 28 + s * 11, 16, 1.2);
      K.path(() => K.ell(24, 26, 18, 17)).fill(M, 6, 9, 42, 43);
      K.eye(17.5, 22, 4.8, 0.5).eye(30.5, 22, 4.8, 0.5);
      K.path(() => { g.moveTo(15, 30); g.quadraticCurveTo(24, 42, 33, 30); g.quadraticCurveTo(24, 33, 15, 30); }).fill('#5a0010', 0, 0, 0, 0, 1.2);
      K.path(() => K.ell(24, 35.5, 3.6, 1.6)).fill('#ff7aa0', 0, 0, 0, 0, 0);
      K.dot(10.5, 29, 2.2, 'rgba(255,150,180,.75)').dot(37.5, 29, 2.2, 'rgba(255,150,180,.75)');
      K.shine(16, 14, 5, 2.5, 0.4);
    },
    house(g, K, C) { const R = C('r', '#c8402a'), Wl = C('w', '#f4ecd8');
      K.path(() => K.rr(6, 22, 36, 24, 0)).fill(Wl, 6, 22, 42, 46);
      K.path(() => K.rr(32, 4, 5, 12, 0)).fill('#a0503a', 32, 4, 37, 12);
      K.path(() => K.poly([[2, 24], [24, 3], [46, 24]])).fill(R, 10, 4, 38, 24);
      for (let y = 9; y < 24; y += 4) K.line([[24 - (y - 3) * 1.05, y], [24 + (y - 3) * 1.05, y]], tone(R, -0.25), 0.6);
      for (const x of [10, 30]) { K.path(() => K.rr(x, 27, 8, 8, 0)).fill(C('c', '#9fd6ff'), x, 27, x + 8, 35, 1.2); K.line([[x + 4, 27], [x + 4, 35]], '#fff', 1).line([[x, 31], [x + 8, 31]], '#fff', 1); }
      K.path(() => K.rr(20, 32, 8, 14, 1)).fill(C('n', '#7a3a1a'), 20, 32, 28, 46); K.dot(26, 39.5, 0.8, '#ffd400');
      K.path(() => K.rr(0, 45, 48, 3, 0)).fill(C('G', '#3a8a2a'), 0, 0, 0, 0, 0);
    },
    computer(g, K, C) { const F = C('e', '#d9d2bd'), S = C('b', '#2a7ad8');
      K.shadow(24, 46, 22, 2.5);
      K.path(() => K.rr(5, 41, 38, 6, 1.5)).fill(C('l', '#e4dfcc'), 5, 41, 43, 47);
      for (let r = 0; r < 2; r++) for (let q = 0; q < 9; q++) K.path(() => K.rr(7.5 + q * 3.7, 42.2 + r * 2.1, 3, 1.5, 0.3)).fill(tone(C('l', '#e4dfcc'), -0.12), 0, 0, 0, 0, 0);
      K.path(() => K.poly([[18, 34], [30, 34], [33, 40], [15, 40]])).fill(F, 15, 34, 33, 40, 1.2);
      K.path(() => K.rr(4, 2, 40, 33, 3)).fill(F, 4, 2, 44, 35, 1.8);
      K.path(() => K.rr(8, 5, 32, 24, 2)).fill(C('B', '#202838'), 0, 0, 0, 0, 1);
      K.path(() => K.rr(9.5, 6.5, 29, 21, 2)).fill(S, 9, 6, 38, 28, 0);
      K.shine(16, 10, 6, 2, 0.3);
      K.line([[12, 25], [36, 25]], 'rgba(255,255,255,.35)', 1.6);
      K.dot(38, 32, 0.9, '#3c3'); K.line([[10, 32], [16, 32]], tone(F, -0.3), 0.8);
    },
    floppy(g, K, C) { const B = C('B', '#203a8a');
      K.path(() => K.poly([[5, 3], [40, 3], [44, 7], [44, 45], [5, 45]])).fill(B, 5, 3, 44, 45, 1.8);
      K.path(() => K.rr(14, 3, 20, 13, 0)).fill('#c8ccd4', 14, 3, 34, 16, 1.2); K.path(() => K.rr(26, 5, 4, 8, 0)).fill('#40444c', 0, 0, 0, 0, 0);
      K.path(() => K.rr(9, 22, 31, 23, 1)).fill('#fbfbf4', 0, 0, 0, 0, 1.2);
      for (let y = 28; y < 44; y += 4) K.line([[12, y], [37, y]], '#88a', 0.6);
      K.line([[12, 27], [30, 27]], '#c00', 1.2); K.path(() => K.rr(7, 40, 3, 3, 0)).fill('#111', 0, 0, 0, 0, 0);
    },
    cube(g, K, C, o) { // a proper 3x3 cube in 3D: three faces, black plastic, nine stickers each
      const P = { r: '#d81818', w: '#f8f8f0', b: '#1a5ad8', y: '#ffd400', g: '#18a038', o: '#ff7a10' };
      const col = ch => P[(o.swap || {})[ch] || ch] || P[ch];
      const faces = o.solved ? ['wwwwwwwww', 'ggggggggg', 'rrrrrrrrr'] : ['wbwrwgyww', 'rwbygobrw', 'boyrbgwrr'];
      const top = [24, 3], u = [[-17, 8.5], [17, 8.5]], down = 18;
      const quad = (o0, a, b) => K.poly([o0, [o0[0] + a[0], o0[1] + a[1]], [o0[0] + a[0] + b[0], o0[1] + a[1] + b[1]], [o0[0] + b[0], o0[1] + b[1]]]);
      K.shadow(24, 46, 18, 2.5);
      const pts = [[24, 3], [41, 11.5], [41, 29.5], [24, 38], [7, 29.5], [7, 11.5]];
      K.path(() => K.poly(pts)).fill('#111', 0, 0, 0, 0, 1.8);
      const sticker = (face, i, o0, a, b) => { const q = i % 3, r = Math.floor(i / 3), A = [a[0] / 3, a[1] / 3], B2 = [b[0] / 3, b[1] / 3]; const s0 = [o0[0] + A[0] * q + B2[0] * r, o0[1] + A[1] * q + B2[1] * r];
        const ins = 0.12, c0 = [s0[0] + A[0] * ins + B2[0] * ins, s0[1] + A[1] * ins + B2[1] * ins], A2 = [A[0] * (1 - 2 * ins), A[1] * (1 - 2 * ins)], B3 = [B2[0] * (1 - 2 * ins), B2[1] * (1 - 2 * ins)];
        g.beginPath(); quad(c0, A2, B3); g.fillStyle = face === 0 ? tone(col(faces[face][i]), 0.08) : face === 1 ? col(faces[face][i]) : tone(col(faces[face][i]), -0.22); g.fill(); };
      for (let i = 0; i < 9; i++) sticker(0, i, top, [17, 8.5], [-17, 8.5]);
      for (let i = 0; i < 9; i++) sticker(1, i, [7, 11.5], [17, 8.5], [0, down]);
      for (let i = 0; i < 9; i++) sticker(2, i, [24, 20], [17, -8.5], [0, down]);
      K.line([[9, 12], [22, 5]], 'rgba(255,255,255,.35)', 1);
    },
    rocket(g, K, C) { const Wh = C('w', '#f4f4f4'), R = C('r', '#d81818');
      K.path(() => { g.moveTo(24, 33); g.quadraticCurveTo(29, 41, 24, 48); g.quadraticCurveTo(19, 41, 24, 33); }).fill(C('o', '#ff8a00'), 0, 0, 0, 0, 0);
      K.path(() => { g.moveTo(24, 34); g.quadraticCurveTo(26.5, 39, 24, 44); g.quadraticCurveTo(21.5, 39, 24, 34); }).fill(C('y', '#ffe640'), 0, 0, 0, 0, 0);
      K.path(() => K.poly([[17, 24], [10, 34], [11, 37], [18, 33]])).fill(R).path(() => K.poly([[31, 24], [38, 34], [37, 37], [30, 33]])).fill(R);
      K.path(() => { g.moveTo(24, 1); g.bezierCurveTo(32, 8, 32, 22, 30, 34); g.lineTo(18, 34); g.bezierCurveTo(16, 22, 16, 8, 24, 1); }).fill(Wh, 16, 0, 32, 0);
      K.path(() => { g.moveTo(24, 1); g.bezierCurveTo(28, 4, 29.5, 7, 30.2, 10); g.lineTo(17.8, 10); g.bezierCurveTo(18.5, 7, 20, 4, 24, 1); }).fill(R, 17, 0, 31, 0, 1.2);
      K.path(() => K.ell(24, 17, 3.6, 3.6)).fill(C('b', '#5ab0ff'), 21, 14, 27, 20, 1.4); K.dot(23, 16, 1, 'rgba(255,255,255,.8)');
      K.path(() => K.poly([[23, 26], [25, 26], [25.5, 35], [22.5, 35]])).fill(R, 0, 0, 0, 0, 1);
      K.path(() => K.rr(19, 33, 10, 3, 1)).fill('#777', 0, 0, 0, 0, 1);
    },
    planet(g, K, C) { const O = C('o', '#e8902a'), Y = C('y', '#f0d080');
      const ring = front => { g.save(); g.beginPath(); if (front) g.rect(0, 24, 48, 24); else g.rect(0, 0, 48, 24); g.clip(); K.path(() => { K.ell(24, 24, 23, 6, -0.25); K.ell(24, 24, 17, 3.8, -0.25); }); g.fillStyle = Y; g.fill('evenodd'); g.lineWidth = 1; g.strokeStyle = INK; g.stroke(); g.restore(); };
      ring(0);
      K.path(() => K.ell(24, 24, 13, 13)).fill(O, 14, 12, 34, 36);
      g.save(); g.beginPath(); K.ell(24, 24, 12.5, 12.5); g.clip(); for (const [y, c] of [[18, 0.25], [23, -0.15], [28, 0.2], [32, -0.2]]) { g.fillStyle = tone(O, c); g.fillRect(0, y, 48, 2.5); } g.restore();
      K.shine(19, 18, 4, 2, 0.4);
      ring(1);
    },
    ufo(g, K, C) {
      g.save(); const bm = g.createLinearGradient(0, 28, 0, 48); bm.addColorStop(0, 'rgba(255,240,140,.55)'); bm.addColorStop(1, 'rgba(255,240,140,0)'); g.fillStyle = bm; g.beginPath(); K.poly([[18, 28], [30, 28], [40, 48], [8, 48]]); g.fill(); g.restore();
      K.path(() => K.ell(24, 15, 9, 9)).fill(C('c', '#8fe8ff'), 18, 7, 30, 20, 1.4); K.shine(21, 11, 3, 1.5, 0.7);
      K.path(() => K.ell(24, 22, 22, 6.5)).fill(C('e', '#a8acb4'), 4, 16, 44, 28, 1.6);
      K.path(() => K.ell(24, 20.5, 14, 2.6)).fill(tone(C('e', '#a8acb4'), 0.3), 0, 0, 0, 0, 0.8);
      for (let i = 0; i < 6; i++) K.dot(8 + i * 6.4, 23.5 + Math.sin(i / 5 * Math.PI) * 1.6, 1.5, [C('y', '#ffd400'), '#ff4040', '#40ff80'][i % 3]);
    },
    trophy(g, K, C) { const Y = C('y', '#f0c020');
      K.shadow(24, 46, 14, 2);
      K.path(() => K.rr(12, 38, 24, 8, 1.5)).fill(C('n', '#7a4a1a'), 12, 38, 36, 46, 1.6);
      K.path(() => K.rr(17, 40.5, 14, 3, 0.5)).fill('#e8d090', 0, 0, 0, 0, 0.6);
      K.path(() => K.poly([[20, 30], [28, 30], [30, 38], [18, 38]])).fill(Y, 18, 30, 30, 38, 1.4);
      K.path(() => K.rr(21.5, 24, 5, 7, 0)).fill(Y, 21, 24, 27, 31, 1.2);
      for (const s of [-1, 1]) K.path(() => { g.moveTo(24 + s * 11, 7); g.bezierCurveTo(24 + s * 23, 6, 24 + s * 22, 22, 24 + s * 8, 21); g.lineTo(24 + s * 9, 18); g.bezierCurveTo(24 + s * 18, 18, 24 + s * 18, 10, 24 + s * 11, 10); g.closePath(); }).fill(Y, 0, 0, 0, 0, 1.2);
      K.path(() => { g.moveTo(11, 4); g.lineTo(37, 4); g.bezierCurveTo(37, 20, 32, 25, 24, 25); g.bezierCurveTo(16, 25, 11, 20, 11, 4); }).fill(Y, 11, 4, 37, 25, 1.6);
      K.path(() => K.ell(24, 4, 13, 2)).fill(tone(Y, -0.25), 0, 0, 0, 0, 1.2);
      K.line([[15, 8], [16, 17]], 'rgba(255,255,255,.7)', 2); K.dot(24, 13, 3, tone(Y, 0.2)); K.path(() => K.poly([[24, 10], [25, 12.5], [27.5, 12.6], [25.5, 14.2], [26.2, 16.6], [24, 15.2], [21.8, 16.6], [22.5, 14.2], [20.5, 12.6], [23, 12.5]])).fill(tone(Y, -0.25), 0, 0, 0, 0, 0);
    },
    guitar(g, K, C) { const R = C('r', '#d02020'), N = C('n', '#8a5a2a');
      g.save(); g.translate(22, 29); g.rotate(-0.72); g.scale(0.86, 0.86);
      K.path(() => K.rr(8, -2.6, 30, 5.2, 1)).fill(N, 0, -3, 0, 3, 1.2);
      for (let i = 1; i < 8; i++) K.line([[10 + i * 3.6, -2.6], [10 + i * 3.6, 2.6]], '#ddd', 0.5);
      K.path(() => K.poly([[37, -3.5], [46, -4.5], [47, 4.5], [37, 3.5]])).fill('#2a1a10', 0, 0, 0, 0, 1);
      for (const x of [40, 43, 46]) { K.dot(x, -5, 1, '#ddd'); K.dot(x, 5, 1, '#ddd'); }
      K.path(() => { g.moveTo(8, -6); g.bezierCurveTo(4, -13, -6, -12, -8, -8); g.bezierCurveTo(-11, -12, -20, -11, -20, -2); g.bezierCurveTo(-20, 9, -11, 12, -8, 9); g.bezierCurveTo(-5, 13, 6, 13, 9, 6); g.bezierCurveTo(6, 3, 6, -3, 8, -6); }).fill(R, -18, -10, 6, 10);
      K.path(() => K.rr(-11, -1, 9, 6, 1)).fill('#fff', 0, 0, 0, 0, 0.6);
      for (const x of [-6, 1]) K.path(() => K.rr(x, -4, 3, 8, 0.5)).fill('#222', 0, 0, 0, 0, 0.6);
      K.path(() => K.rr(-14, -3.5, 2, 7, 0)).fill('#ccc', 0, 0, 0, 0, 0.6);
      for (let s = -1.8; s <= 1.8; s += 0.9) K.line([[-13, s], [38, s * 0.8]], 'rgba(240,240,240,.85)', 0.3);
      for (const [x, y] of [[-3, 8], [0, 8.5], [3, 7.5]]) K.dot(x, y, 0.9, '#e8e8e8');
      K.shine(-12, -6, 4, 1.5, 0.35);
      g.restore();
    },
    star(g, K, C) { const Y = C('y', '#ffd400');
      const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 21; pts.push([24 + Math.cos(a) * r, 25 + Math.sin(a) * r]); }
      K.path(() => K.poly(pts)).fill(Y, 6, 6, 40, 44, 1.8);
      for (let k = 0; k < 10; k += 2) K.line([[24, 25], pts[k]], tone(Y, -0.18), 0.8);
      K.shine(19, 18, 4, 2, 0.6);
    },
    cake(g, K, C) { const Pk = C('p', '#ff9ac8'), N = C('n', '#8a4a2a');
      K.path(() => K.ell(24, 44, 22, 3.6)).fill(C('e', '#e8e8f0'), 0, 0, 0, 0, 1.4);
      K.path(() => K.rr(6, 22, 36, 21, 3)).fill(N, 6, 22, 42, 43, 1.6);
      K.path(() => K.rr(6, 30, 36, 3, 0)).fill('#fff4e0', 0, 0, 0, 0, 0); K.path(() => K.rr(6, 33, 36, 2, 0)).fill('#e02040', 0, 0, 0, 0, 0);
      K.path(() => { g.moveTo(5, 25); g.quadraticCurveTo(5, 18, 24, 18); g.quadraticCurveTo(43, 18, 43, 25); for (let x = 43; x >= 5; x -= 6) g.quadraticCurveTo(x - 1.5, 31, x - 3, 26.5), g.quadraticCurveTo(x - 4.5, 24, x - 6, 26); g.closePath(); }).fill(Pk, 5, 18, 43, 30, 1.4);
      for (let i = 0; i < 9; i++) K.path(() => K.rr(8 + (i * 7) % 31, 20 + (i * 3) % 4, 2.2, 1, 0.4)).fill(['#ffd400', '#3c3', '#4af', '#fff'][i % 4], 0, 0, 0, 0, 0);
      K.path(() => K.rr(22.5, 7, 3, 12, 0.5)).fill('#fff', 0, 0, 0, 0, 1); for (let y = 8; y < 19; y += 3) K.line([[22.5, y + 2], [25.5, y]], '#4af', 0.8);
      K.path(() => { g.moveTo(24, 0.5); g.quadraticCurveTo(27.5, 5, 24, 7); g.quadraticCurveTo(20.5, 5, 24, 0.5); }).fill(C('y', '#ffd400'), 0, 0, 0, 0, 0.6); K.dot(24, 5, 1, '#ff8a00');
    },
    flower(g, K, C) { const Pk = C('p', '#ff7ac0');
      const bloom = (x, y, r) => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.path(() => K.ell(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.5, a)).fill(Pk, x - r, y - r, x + r, y + r, 0.8); } K.dot(x, y, r * 0.55, C('y', '#ffd400')); g.lineWidth = 0.6; g.strokeStyle = INK; g.stroke(); };
      const stem = (x0, y0, x1, y1) => K.line([[x0, y0], [x1, y1]], '#2a8a2a', 1.8);
      stem(16, 44, 14, 12); stem(30, 44, 33, 22);
      K.path(() => K.ell(10, 32, 5, 2, -0.6)).fill('#3ab03a', 0, 0, 0, 0, 0.8).path(() => K.ell(37, 34, 5, 2, 0.6)).fill('#3ab03a', 0, 0, 0, 0, 0.8);
      bloom(14, 11, 4.6); bloom(33, 21, 4);
      K.path(() => K.poly([[8, 40], [40, 40], [37, 48], [11, 48]])).fill(C('n', '#b0583a'), 8, 40, 40, 48, 1.4);
      K.path(() => K.rr(7, 39, 34, 3.4, 1)).fill(tone(C('n', '#b0583a'), 0.15), 0, 0, 0, 0, 1.2);
    },
    ball(g, K) {
      K.shadow(24, 46, 14, 2.4);
      K.path(() => K.ell(24, 26, 18, 18)).fill('#ffffff', 10, 10, 40, 44, 1.6);
      g.save(); g.beginPath(); K.ell(24, 26, 17.2, 17.2); g.clip();
      const pent = (cx, cy, r, rot) => { const p = []; for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } K.path(() => K.poly(p)).fill('#1a1a1a', 0, 0, 0, 0, 0); return p; };
      const c0 = pent(24, 26, 6, -Math.PI / 2);
      c0.forEach((p, i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; pent(24 + Math.cos(a) * 17, 26 + Math.sin(a) * 17, 5.5, a + Math.PI / 5); K.line([p, [24 + Math.cos(a) * 12, 26 + Math.sin(a) * 12]], '#333', 0.8); });
      g.restore();
      const sh = g.createRadialGradient(18, 18, 2, 24, 26, 19); sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = sh; g.beginPath(); K.ell(24, 26, 17.2, 17.2); g.fill();
    },
    yoyo(g, K, C) { const R = C('r', '#e01818');
      K.line([[24, 0], [24, 18]], C('k', '#222'), 1);
      K.path(() => K.ell(24, 28, 13, 13)).fill(R, 12, 16, 36, 40, 1.8);
      K.path(() => K.ell(24, 28, 8.5, 8.5)).fill(tone(R, -0.2), 0, 0, 0, 0, 1);
      K.path(() => K.ell(24, 28, 3, 3)).fill(C('w', '#f4f4f4'), 0, 0, 0, 0, 1);
      K.shine(18, 21, 4, 2, 0.5);
      K.line([[11.5, 28], [36.5, 28]], 'rgba(0,0,0,.35)', 0.6);
    },
    kid(g, K, C, o) { // a kid, standing, holding a stick (or a lightsaber, or nothing if 'bare')
      const S = C('s', '#f2c79a'), Sh = C('b', '#2a7ad8'), Tr = C('B', '#203a80'), Hr = C('n', '#7a4a1a'), Ft = C('k', '#222');
      K.shadow(23, 47, 11, 1.8);
      K.path(() => K.rr(15.5, 33, 6, 12, 1)).fill(Tr, 15, 33, 22, 45, 1.2).path(() => K.rr(23.5, 33, 6, 12, 1)).fill(Tr, 23, 33, 30, 45, 1.2);
      K.path(() => K.rr(13.5, 43.5, 8.5, 4, 2)).fill(Ft, 0, 0, 0, 0, 1.2).path(() => K.rr(23, 43.5, 8.5, 4, 2)).fill(Ft, 0, 0, 0, 0, 1.2);
      K.line([[15.5, 22], [11.5, 31]], INK, 5).line([[15.5, 22], [11.5, 31]], Sh, 3.4); K.dot(11.3, 32, 2, S);
      K.path(() => K.rr(14, 20, 17, 15, 4)).fill(Sh, 14, 20, 31, 35, 1.4);
      K.path(() => K.rr(14, 32, 17, 3, 0)).fill(tone(Tr, -0.1), 0, 0, 0, 0, 0);
      K.path(() => K.rr(19.5, 17, 6, 4, 1)).fill(S, 0, 0, 0, 0, 1);
      K.path(() => K.ell(22.5, 11, 8, 8.5)).fill(S, 15, 3, 30, 19, 1.4);
      K.path(() => { g.moveTo(14.4, 11); g.quadraticCurveTo(13, 1, 23, 1.6); g.quadraticCurveTo(32, 2, 31, 10); g.quadraticCurveTo(27, 6, 22, 7.4); g.quadraticCurveTo(18, 8, 16.5, 13); g.closePath(); }).fill(Hr, 15, 2, 31, 12, 1.2);
      K.dot(21, 11.5, 1.1, '#111').dot(27, 11.5, 1.1, '#111');
      K.line([[21.5, 15], [24, 16.4], [26.5, 15]], INK, 0.9);
      K.dot(18.5, 14, 1.3, 'rgba(255,120,120,.35)').dot(29, 14, 1.3, 'rgba(255,120,120,.35)');
      if (!o.bare) { const it = C('g', '#3c3'), dark = lum(it) < 0.25;
        if (dark) K.line([[33, 26], [44, 9]], it, 1.8);
        else { K.line([[33, 26], [46, 3]], it, 4.2); K.line([[33, 26], [46, 3]], 'rgba(255,255,255,.9)', 1.6); K.path(() => K.rr(31.5, 25, 3.5, 6, 1)).fill('#bbb', 0, 0, 0, 0, 0.8); } }
      K.line([[29.5, 22], [33, 28]], INK, 5).line([[29.5, 22], [33, 28]], Sh, 3.4); K.dot(33.4, 28.5, 2, S);
      if (o.yoyo) { K.line([[33.6, 28.5], [38, 43]], '#222', 0.7); K.path(() => K.ell(38, 43.5, 3.6, 3.6)).fill(C('r', '#e01818'), 35, 40, 41, 47, 1); K.dot(38, 43.5, 1, '#fff'); }
    },
    belt(g, K) { // a championship belt made out of a cereal box, gold felt-tip and a lot of Sellotape
      K.shadow(24, 40, 22, 2);
      K.path(() => K.rr(0, 17, 48, 13, 3)).fill('#2a2018', 0, 17, 0, 30, 1.6);
      K.line([[1, 19.5], [47, 19.5]], 'rgba(255,220,120,.5)', 0.5).line([[1, 27.5], [47, 27.5]], 'rgba(255,220,120,.5)', 0.5);
      for (const x of [5, 43]) { K.path(() => K.rr(x - 4, 18.5, 8, 10, 2)).fill('#e8b830', x - 4, 18, x + 4, 29, 1); K.dot(x, 23.5, 1.6, x < 24 ? '#d81818' : '#2a5ad8'); }
      K.path(() => K.ell(24, 23.5, 14, 11)).fill('#f0c030', 12, 13, 36, 34, 1.8);
      K.path(() => K.ell(24, 23.5, 10.5, 8)).fill('#d8a020', 0, 0, 0, 0, 0.8);
      g.font = 'bold 8px Arial, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#b01010'; g.fillText('BCW', 24, 25.5); g.font = 'bold 2.6px Arial, sans-serif'; g.fillStyle = '#5a3a00'; g.fillText('CHAMPION', 24, 29.2); g.textAlign = 'start';
      K.path(() => K.poly([[14, 13], [21, 15], [20, 18], [13, 16]])).fill('rgba(240,240,220,.55)', 0, 0, 0, 0, 0);
      K.path(() => K.poly([[30, 31], [37, 29], [38, 32], [31, 34]])).fill('rgba(240,240,220,.55)', 0, 0, 0, 0, 0);
      K.shine(18, 17, 4, 1.5, 0.5);
    },
    bottlerocket(g, K) { // a fizzy-pop bottle rocket: upside-down bottle, cardboard fins, water everywhere
      for (let i = 0; i < 14; i++) { const y = 33 + i * 1.1, x = 24 + Math.sin(i * 2.3) * (1 + i * 0.45); K.dot(x, y, 0.9 + (i % 3) * 0.3, 'rgba(170,220,255,.85)'); }
      K.path(() => K.poly([[24, 33], [28, 48], [20, 48]])).fill('rgba(200,235,255,.45)', 0, 0, 0, 0, 0);
      K.path(() => K.poly([[17, 22], [9, 33], [17, 31]])).fill('#d82020', 9, 22, 17, 33, 1.2).path(() => K.poly([[31, 22], [39, 33], [31, 31]])).fill('#d82020', 31, 22, 39, 33, 1.2);
      K.path(() => { g.moveTo(17, 6); g.quadraticCurveTo(17, 1, 24, 1); g.quadraticCurveTo(31, 1, 31, 6); g.lineTo(31, 23); g.quadraticCurveTo(31, 27, 26.5, 29); g.lineTo(26.5, 31); g.lineTo(21.5, 31); g.lineTo(21.5, 29); g.quadraticCurveTo(17, 27, 17, 23); g.closePath(); }).fill('#bfe8d8', 17, 1, 31, 31, 1.4);
      K.path(() => K.rr(17.5, 10, 13, 7, 0)).fill('#ffd400', 0, 0, 0, 0, 0.8); g.font = 'bold 4px Arial, sans-serif'; g.fillStyle = '#c01010'; g.fillText('FIZZ', 19.5, 15.2);
      K.path(() => K.rr(21, 30.5, 6, 3, 0.8)).fill('#2a6ad8', 0, 0, 0, 0, 1);
      K.line([[19.5, 4], [19.5, 24]], 'rgba(255,255,255,.75)', 1.4);
      K.path(() => { g.moveTo(17.3, 18); g.lineTo(30.7, 18); g.lineTo(30.7, 23); g.quadraticCurveTo(30.7, 27, 26.5, 29); g.lineTo(21.5, 29); g.quadraticCurveTo(17.3, 27, 17.3, 23); g.closePath(); }).fill('rgba(90,170,255,.45)', 0, 0, 0, 0, 0);
    },
    stick(g, K, C, o) { // a stick (chewed), or a slat off the fence (also chewed)
      K.shadow(24, 42, 22, 2);
      if (o.fence) {
        g.save(); g.translate(24, 34); g.rotate(-0.22);
        K.path(() => K.poly([[-21, -4], [16, -4], [22, 0], [16, 4], [-21, 4]])).fill('#f4f0e4', -21, -4, -21, 4, 1.4);
        K.line([[-21, 0], [12, 0]], 'rgba(160,140,110,.45)', 0.6); K.dot(-14, 0, 0.9, '#666').dot(8, 0, 0.9, '#666');
        for (const [x, y] of [[-20, -3], [-18.5, 2.6], [-17, -2]]) K.dot(x, y, 1.3, '#c8b890');
        g.restore(); return;
      }
      const N = C('n', '#8a5a2a');
      K.line([[29, 31], [35, 22], [37, 17]], INK, 3.4).line([[29, 31], [35, 22], [37, 17]], N, 2);
      K.path(() => K.ell(38, 15.5, 3.2, 1.6, -0.9)).fill('#4caa3a', 0, 0, 0, 0, 0.8);
      K.line([[3, 41], [24, 34], [45, 27]], INK, 6.4).line([[3, 41], [24, 34], [45, 27]], N, 4.6);
      K.line([[6, 39], [22, 33.6]], tone(N, 0.35), 0.8).line([[26, 32.4], [42, 27]], tone(N, -0.3), 0.8);
      for (const [x, y] of [[7, 39.6], [11, 38], [40, 28.6]]) K.dot(x, y, 1.2, '#e8d0a0');
    },
    splash(g, K) { // water, flying everywhere
      for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.95 + i / 15 * Math.PI * 0.9, r = 10 + (i * 7) % 12, x = 24 + Math.cos(a) * r, y = 26 + Math.sin(a) * r * 0.9;
        K.path(() => { g.moveTo(x, y - 2.4); g.quadraticCurveTo(x + 1.6, y, x, y + 1.4); g.quadraticCurveTo(x - 1.6, y, x, y - 2.4); }).fill('#8ad0ff', 0, 0, 0, 0, 0.5); }
      for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.85 + i / 4 * Math.PI * 0.7; K.line([[24 + Math.cos(a) * 7, 26 + Math.sin(a) * 7], [24 + Math.cos(a) * 11, 26 + Math.sin(a) * 11]], 'rgba(120,190,255,.9)', 1); }
    },
    pod(g, K, C) { const E = C('e', '#a8acb4'), Or = C('o', '#ff8a00');
      K.shadow(24, 44, 22, 2);
      const eng = y => { K.path(() => K.rr(1, y, 22, 7, 3.5)).fill(E, 0, y, 0, y + 7, 1.4); K.path(() => K.rr(6, y, 4, 7, 0)).fill(Or, 0, 0, 0, 0, 0); K.path(() => K.ell(1.5, y + 3.5, 1.4, 3)).fill('#333', 0, 0, 0, 0, 0.8); K.path(() => K.rr(20, y + 1.5, 4, 4, 1)).fill('#ff5a1a', 0, 0, 0, 0, 0.8); };
      eng(9); eng(25);
      K.line([[8, 16], [8, 25]], 'rgba(120,200,255,.9)', 2.2).line([[14, 16], [14, 25]], 'rgba(120,200,255,.9)', 2.2);
      K.line([[23, 13], [34, 23]], INK, 0.8).line([[23, 28], [34, 25]], INK, 0.8);
      K.path(() => { g.moveTo(32, 20); g.lineTo(44, 21); g.quadraticCurveTo(48, 24, 44, 27); g.lineTo(32, 28); g.closePath(); }).fill(C('b', '#5a7ab0'), 32, 20, 46, 28, 1.4);
      K.path(() => K.ell(39, 22.5, 3, 2.2)).fill(C('c', '#8fe0ff'), 0, 0, 0, 0, 0.8);
    },
    teapot(g, K, C) { const B = C('b', '#2a6ad8');
      K.shadow(24, 44, 17, 2);
      K.path(() => { g.moveTo(37, 30); g.quadraticCurveTo(44, 28, 46, 18); g.lineTo(48, 18); g.quadraticCurveTo(46, 32, 38, 37); g.closePath(); }).fill(B, 0, 0, 0, 0, 1.2);
      K.line([[11, 24], [3, 26], [3, 33], [10, 36]], INK, 4).line([[11, 24], [3, 26], [3, 33], [10, 36]], B, 2.4);
      K.path(() => { g.moveTo(9, 26); g.bezierCurveTo(9, 14, 39, 14, 39, 26); g.bezierCurveTo(40, 38, 34, 43, 24, 43); g.bezierCurveTo(14, 43, 8, 38, 9, 26); }).fill(B, 9, 16, 39, 43);
      K.path(() => K.ell(24, 18, 9, 2.6)).fill(tone(B, -0.2), 0, 0, 0, 0, 1).path(() => K.ell(24, 13.5, 2.4, 2)).fill(B, 0, 0, 0, 0, 1);
      K.line([[11, 31], [37, 31]], 'rgba(255,255,255,.7)', 1.2); K.shine(17, 23, 4, 2, 0.5);
    },
    skull(g, K) {
      K.path(() => { g.moveTo(8, 22); g.bezierCurveTo(6, 2, 42, 2, 40, 22); g.bezierCurveTo(40, 30, 36, 32, 34, 33); g.lineTo(34, 41); g.lineTo(14, 41); g.lineTo(14, 33); g.bezierCurveTo(12, 32, 8, 30, 8, 22); }).fill('#f4f0e4', 10, 4, 38, 41);
      K.path(() => K.ell(17, 22, 5, 5.5)).fill('#1a1a1a', 0, 0, 0, 0, 0).path(() => K.ell(31, 22, 5, 5.5)).fill('#1a1a1a', 0, 0, 0, 0, 0);
      K.path(() => K.poly([[24, 27], [26.5, 32], [21.5, 32]])).fill('#1a1a1a', 0, 0, 0, 0, 0);
      for (const x of [18, 22, 26, 30]) K.line([[x, 35], [x, 41]], INK, 0.9);
      K.shine(15, 11, 5, 2, 0.6);
    },
    tree(g, K, C) { const G = C('G', '#2a8a2a'), N = C('n', '#7a4a2a');
      K.shadow(24, 46, 14, 2);
      K.path(() => K.poly([[20, 46], [21, 30], [27, 30], [28, 46]])).fill(N, 20, 30, 28, 46, 1.4);
      K.line([[22, 34], [17, 28]], INK, 3.6).line([[22, 34], [17, 28]], N, 2);
      for (const [x, y, r, k] of [[14, 22, 10, -0.08], [33, 21, 10, -0.1], [24, 13, 12, 0.05], [18, 9, 8, 0.12], [31, 9, 8, 0.08], [24, 27, 9, -0.15]]) K.path(() => K.ell(x, y, r, r * 0.9)).fill(tone(G, k), x - r, y - r, x + r, y + r, 1.4);
      for (let i = 0; i < 12; i++) K.dot(10 + (i * 11) % 28, 6 + (i * 7) % 22, 1.2, tone(G, 0.3));
    },
    car(g, K, C) { const R = C('r', '#d82020');
      K.shadow(24, 44, 22, 2);
      K.path(() => { g.moveTo(2, 38); g.lineTo(2, 30); g.quadraticCurveTo(3, 26, 9, 25); g.lineTo(14, 16); g.quadraticCurveTo(15, 14, 18, 14); g.lineTo(33, 14); g.quadraticCurveTo(36, 14, 38, 17); g.lineTo(42, 25); g.quadraticCurveTo(47, 26, 46, 32); g.lineTo(46, 38); g.closePath(); }).fill(R, 2, 14, 46, 38);
      K.path(() => K.poly([[16, 17], [23, 17], [23, 25], [12, 25]])).fill(C('c', '#a8e0ff'), 12, 17, 23, 25, 1).path(() => K.poly([[26, 17], [34, 17], [38, 25], [26, 25]])).fill(C('c', '#a8e0ff'), 26, 17, 38, 25, 1);
      K.line([[24.5, 25], [24.5, 37]], tone(R, -0.35), 0.8); K.path(() => K.rr(43, 28, 3, 3, 1)).fill('#ffe880', 0, 0, 0, 0, 0.6); K.path(() => K.rr(2, 28, 2.5, 3, 1)).fill('#f44', 0, 0, 0, 0, 0.6);
      for (const x of [12, 36]) { K.path(() => K.ell(x, 38, 5.5, 5.5)).fill('#1a1a1a', 0, 0, 0, 0, 1.2); K.path(() => K.ell(x, 38, 2.4, 2.4)).fill('#c8c8c8', 0, 0, 0, 0, 0); }
      K.line([[6, 30], [42, 30]], 'rgba(255,255,255,.4)', 1);
    },
    robot(g, K, C) { const E = C('e', '#a0a8b4');
      K.shadow(24, 47, 13, 2);
      K.line([[24, 7], [24, 2]], INK, 1.2); K.dot(24, 2, 2, C('r', '#e10600'));
      for (const x of [17, 31]) { K.path(() => K.rr(x - 3, 34, 6, 11, 1)).fill(E, x - 3, 34, x + 3, 45, 1.2); K.path(() => K.rr(x - 5, 43, 10, 4, 1)).fill(tone(E, -0.3), 0, 0, 0, 0, 1.2); }
      K.line([[12, 22], [7, 33]], INK, 4.4).line([[12, 22], [7, 33]], E, 2.8).line([[36, 22], [41, 33]], INK, 4.4).line([[36, 22], [41, 33]], E, 2.8);
      K.path(() => K.rr(11, 19, 26, 17, 2)).fill(E, 11, 19, 37, 36, 1.6);
      K.path(() => K.rr(16, 23, 16, 8, 1)).fill('#2a2a3a', 0, 0, 0, 0, 1); for (let i = 0; i < 4; i++) K.dot(19 + i * 3.4, 27, 1, ['#3c3', '#ffd400', '#e10600', '#4af'][i]);
      K.path(() => K.rr(21, 16, 6, 4, 0)).fill(tone(E, -0.2), 0, 0, 0, 0, 1);
      K.path(() => K.rr(14, 6, 20, 11, 2)).fill(E, 14, 6, 34, 17, 1.6);
      K.path(() => K.rr(17, 9, 14, 5, 2)).fill('#111', 0, 0, 0, 0, 0.8); K.dot(20.5, 11.5, 1.6, C('c', '#4ef')).dot(27.5, 11.5, 1.6, C('c', '#4ef'));
      K.shine(18, 8, 3, 1, 0.5);
    },
    tortoise(g, K, C) { const Sh = C('G', '#8a6a2a'), Sk = C('s', '#a8a070');
      K.shadow(24, 44, 20, 2.2);
      for (const x of [12, 33]) K.path(() => K.rr(x - 3, 34, 7, 9, 2.5)).fill(Sk, x - 3, 34, x + 4, 43, 1.2);
      K.path(() => { g.moveTo(37, 33); g.quadraticCurveTo(40, 25, 44, 26); g.quadraticCurveTo(49, 27, 47, 32); g.quadraticCurveTo(45, 35, 37, 36); g.closePath(); }).fill(Sk, 38, 25, 48, 36, 1.4);
      K.eye(43.5, 28.6, 1.2, 1); K.line([[45, 32.4], [47.3, 31.6]], INK, 0.8);
      K.path(() => K.poly([[3, 34], [5, 37], [8, 34]])).fill(Sk, 0, 0, 0, 0, 1);
      K.path(() => { g.moveTo(4, 35); g.bezierCurveTo(4, 14, 40, 12, 41, 35); g.closePath(); }).fill(Sh, 4, 14, 41, 36, 1.6);
      const D = tone(Sh, -0.35), L = tone(Sh, 0.25);
      for (const [x, y, w] of [[22, 23, 5], [12.5, 29, 4], [31.5, 29, 4]]) K.path(() => K.poly([[x - w, y], [x - w / 2, y - w * 0.8], [x + w / 2, y - w * 0.8], [x + w, y], [x + w / 2, y + w * 0.8], [x - w / 2, y + w * 0.8]])).fill(L, 0, 0, 0, 0, 0.9);
      K.line([[6, 32], [39, 32]], D, 0.8); K.path(() => K.rr(4, 34, 37, 2.6, 1)).fill(D, 0, 0, 0, 0, 1);
    },
    mushroom(g, K, C) { const R = C('r', '#d81818');
      K.path(() => K.rr(0, 43, 48, 5, 0)).fill(C('G', '#3a8a2a'), 0, 0, 0, 0, 0);
      K.path(() => { g.moveTo(18, 44); g.quadraticCurveTo(17, 30, 20, 24); g.lineTo(28, 24); g.quadraticCurveTo(31, 30, 30, 44); g.closePath(); }).fill('#f8f4e8', 18, 24, 30, 44, 1.4);
      K.path(() => { g.moveTo(4, 26); g.bezierCurveTo(4, 2, 44, 2, 44, 26); g.quadraticCurveTo(24, 31, 4, 26); }).fill(R, 4, 6, 44, 28, 1.6);
      for (const [x, y, r] of [[14, 15, 3], [26, 10, 3.6], [36, 18, 2.6], [20, 22, 2], [32, 25, 1.6], [9, 22, 1.6]]) K.path(() => K.ell(x, y, r, r * 0.8)).fill('#fff', 0, 0, 0, 0, 0.6);
    },
    candle(g, K, C) {
      g.save(); const gl = g.createRadialGradient(24, 8, 1, 24, 8, 14); gl.addColorStop(0, 'rgba(255,230,120,.7)'); gl.addColorStop(1, 'rgba(255,230,120,0)'); g.fillStyle = gl; g.fillRect(8, 0, 32, 24); g.restore();
      K.path(() => K.ell(24, 42, 15, 4)).fill(C('e', '#c8c8d0'), 9, 38, 39, 46, 1.4);
      K.path(() => K.rr(19, 15, 10, 26, 1)).fill(C('w', '#fbf6ea'), 19, 15, 29, 41, 1.4);
      K.line([[24, 15], [24, 12]], '#222', 1);
      K.path(() => { g.moveTo(24, 2); g.quadraticCurveTo(28.5, 8, 24, 12); g.quadraticCurveTo(19.5, 8, 24, 2); }).fill(C('y', '#ffd400'), 0, 0, 0, 0, 0.6); K.dot(24, 9.3, 1.4, '#ff8a00');
    },
    joystick(g, K, C) {
      K.shadow(24, 46, 18, 2);
      K.path(() => K.rr(6, 33, 36, 12, 3)).fill(C('E', '#3a3a3a'), 6, 33, 42, 45, 1.6);
      K.line([[24, 35], [24, 14]], '#111', 3.4);
      K.path(() => K.ell(24, 11, 6, 6)).fill(C('r', '#e10600'), 18, 5, 30, 17, 1.4);
      K.path(() => K.ell(36, 35, 3.2, 1.6)).fill('#e10600', 0, 0, 0, 0, 1);
      K.shine(22, 8.5, 2, 1, 0.7);
    },
    blob(g, K, C) { const G = C('g', '#4ad04a');
      K.shadow(24, 46, 20, 2);
      K.path(() => { g.moveTo(3, 45); g.bezierCurveTo(2, 30, 10, 12, 24, 12); g.bezierCurveTo(38, 12, 46, 30, 45, 45); g.quadraticCurveTo(38, 42, 34, 45); g.quadraticCurveTo(28, 42, 22, 45); g.quadraticCurveTo(14, 42, 10, 45); g.closePath(); }).fill(G, 6, 12, 42, 45);
      K.eye(18, 24, 3.6, 0.4).eye(31, 24, 3.6, 0.4);
      K.path(() => { g.moveTo(15, 32); g.quadraticCurveTo(24, 40, 34, 32); g.closePath(); }).fill('#1a3a1a', 0, 0, 0, 0, 1);
      K.shine(14, 18, 4, 2, 0.5);
    },
    bat(g, K, C) { const P = C('P', '#7a3ac0');
      for (const s of [-1, 1]) K.path(() => { g.moveTo(24 + s * 5, 20); g.quadraticCurveTo(24 + s * 14, 8, 24 + s * 23, 12); g.quadraticCurveTo(24 + s * 20, 18, 24 + s * 21, 25); g.quadraticCurveTo(24 + s * 17, 21, 24 + s * 14, 27); g.quadraticCurveTo(24 + s * 11, 23, 24 + s * 6, 28); g.closePath(); }).fill(P, 24 + s * 5, 10, 24 + s * 23, 28, 1.4);
      K.path(() => K.ell(24, 24, 6.5, 8)).fill(tone(P, -0.15), 18, 16, 30, 32, 1.4);
      K.path(() => K.poly([[19, 18], [19.5, 11], [23, 16]])).fill(tone(P, -0.15), 0, 0, 0, 0, 1).path(() => K.poly([[29, 18], [28.5, 11], [25, 16]])).fill(tone(P, -0.15), 0, 0, 0, 0, 1);
      K.dot(21.5, 21, 1.4, '#ffd400').dot(26.5, 21, 1.4, '#ffd400');
      K.path(() => K.poly([[22, 26], [23, 28.5], [24, 26]])).fill('#fff', 0, 0, 0, 0, 0).path(() => K.poly([[24, 26], [25, 28.5], [26, 26]])).fill('#fff', 0, 0, 0, 0, 0);
    },
    dragon(g, K, C) { const R = C('r', '#d82020'), Y = C('y', '#ffd060');
      K.path(() => { g.moveTo(12, 30); g.quadraticCurveTo(2, 30, 3, 20); g.quadraticCurveTo(0, 26, 1, 31); g.quadraticCurveTo(4, 37, 14, 36); g.closePath(); }).fill(R, 0, 20, 14, 36, 1.2);
      K.path(() => K.poly([[1, 18], [5, 22], [0, 23]])).fill(R, 0, 0, 0, 0, 1);
      K.path(() => { g.moveTo(22, 22); g.lineTo(14, 4); g.lineTo(20, 9); g.lineTo(24, 3); g.lineTo(27, 10); g.lineTo(32, 6); g.lineTo(30, 22); g.closePath(); }).fill(tone(R, -0.15), 14, 3, 32, 22, 1.2);
      for (const x of [16, 28]) K.path(() => K.rr(x - 2.5, 34, 5, 10, 2)).fill(R, 0, 0, 0, 0, 1.2);
      K.path(() => K.ell(22, 31, 12, 8)).fill(R, 10, 23, 34, 39);
      K.path(() => K.ell(23, 34, 8, 4)).fill(Y, 0, 0, 0, 0, 0); for (let x = 17; x < 30; x += 3) K.line([[x, 31], [x, 37]], tone(Y, -0.25), 0.6);
      K.path(() => { g.moveTo(30, 28); g.quadraticCurveTo(33, 18, 36, 14); g.lineTo(41, 17); g.quadraticCurveTo(37, 24, 35, 31); g.closePath(); }).fill(R, 30, 14, 41, 31, 1.2);
      K.path(() => { g.moveTo(34, 10); g.quadraticCurveTo(38, 6, 44, 9); g.lineTo(47, 12); g.quadraticCurveTo(47, 15, 43, 16); g.lineTo(36, 17); g.quadraticCurveTo(33, 15, 34, 10); }).fill(R, 34, 6, 47, 17, 1.4);
      K.path(() => K.poly([[36, 9], [35, 4], [39, 8]])).fill(Y, 0, 0, 0, 0, 0.8);
      K.eye(39.5, 10.5, 1.4, 1); K.dot(45.5, 12, 0.6, '#111');
      for (const [x, y] of [[29, 22], [26, 23.5], [23, 23.5]]) K.path(() => K.poly([[x - 1.5, y + 1], [x, y - 2], [x + 1.5, y + 1]])).fill(Y, 0, 0, 0, 0, 0.6);
    },
  };
  W.PHOTO = PH;
  // the backdrop: a sky (or wall) with a bit of light and depth, and the ground (or floor) with texture
  function backdrop(g, bg, w, h, k, seed) {
    const sky = bg[0] || '#9cf', gr = bg[1] && bg[1] !== '-' ? bg[1] : null, gy = Math.round(h * 0.68), dark = lum(sky) < 0.2;
    let lg = g.createLinearGradient(0, 0, 0, gr ? gy : h); lg.addColorStop(0, tone(sky, dark ? 0.06 : -0.12)); lg.addColorStop(1, tone(sky, dark ? -0.2 : 0.18)); g.fillStyle = lg; g.fillRect(0, 0, w, h);
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(seed || 7);
    if (dark && (!gr || hex(sky)[2] > hex(sky)[0])) { for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,${200 + Math.round(r() * 55)},${0.35 + r() * 0.6})`; const s = r() < 0.15 ? k * 0.6 : k * 0.3; g.fillRect(r() * w, r() * (gr ? gy : h), s, s); } }
    else if (gr && hex(sky)[2] > hex(sky)[0] + 20 && lum(sky) > 0.45) { // a blue-ish outdoor sky: a couple of soft clouds
      for (let i = 0; i < 2; i++) { const cx = (0.2 + 0.55 * i + r() * 0.15) * w, cy = (0.12 + r() * 0.12) * h; g.fillStyle = 'rgba(255,255,255,.75)'; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(cx + (j - 1.5) * 3.2 * k, cy + (j % 2 ? -k : k * 0.3), 3.2 * k, 2 * k, 0, 0, 7); g.fill(); } }
    }
    if (!gr) { // indoors / plain: a soft vignette so it isn't a flat colour
      const v = g.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h / 2, w * 0.75); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, dark ? 'rgba(0,0,0,.3)' : 'rgba(80,60,40,.18)'); g.fillStyle = v; g.fillRect(0, 0, w, h); return;
    }
    lg = g.createLinearGradient(0, gy, 0, h); lg.addColorStop(0, tone(gr, -0.18)); lg.addColorStop(1, tone(gr, 0.12)); g.fillStyle = lg; g.fillRect(0, gy, w, h - gy);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, gy, w, Math.max(1, k * 0.35));
    const [cr, cg, cb] = hex(gr), grass = cg > cr + 20 && cg > cb + 20;
    for (let i = 0; i < 160; i++) { const x = r() * w, y = gy + r() * (h - gy), sh2 = r() < 0.5 ? 0.22 : -0.2; g.fillStyle = tone(gr, sh2); if (grass) g.fillRect(x, y, Math.max(1, k * 0.25), k * (0.5 + r() * 0.6)); else g.fillRect(x, y, k * 0.4, k * 0.3); }
  }
  function drawPhoto(g, spec, W2, H2) {
    W2 = W2 || g.canvas.width || 48; H2 = H2 || g.canvas.height || 36;
    const k = W2 / 48; let seed = 7; for (const ch of String(spec)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483646 + 1;
    const parts = String(spec).split(';').map(x => x.trim()).filter(Boolean), bg = (parts.shift() || '#9cf #3a3').split(/\s+/);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true;
    backdrop(g, bg, W2, H2, k, seed);
    const K = kit(g);
    for (const p of parts) {
      const [name, x, y, ...rest] = p.split(/\s+/), o = {};
      rest.forEach(r => { if (r === 'flip') o.flip = 1; else if (r.startsWith('swap=')) { o.swap = {}; r.slice(5).split(',').forEach(pr => { o.swap[pr[0]] = pr[1]; }); } else o[r] = 1; });
      if (name === 'text') { // hand-written-ish label, dark on light backgrounds and light on dark ones, squeezed to fit
        const t = rest.join(' ').replace(/_/g, ' '), light = lum(bg[0] || '#9cf') > 0.55 && +y < 24 || (!bg[1] || bg[1] === '-') && lum(bg[0] || '#9cf') > 0.55;
        g.font = `bold ${Math.round(6 * k)}px "Comic Sans MS", "Trebuchet MS", Arial, sans-serif`; g.textBaseline = 'alphabetic';
        const mw = W2 - (+x) * k - 2 * k; g.lineWidth = k * 0.9; g.lineJoin = 'round';
        g.strokeStyle = light ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.8)'; g.strokeText(t, (+x) * k, (+y) * k, mw);
        g.fillStyle = light ? '#1a1a2a' : '#fff'; g.fillText(t, (+x) * k, (+y) * k, mw); continue;
      }
      const fn = PH[name];
      g.save(); g.translate((+x || 0) * k, (+y || 0) * k); g.scale(k / 4, k / 4); if (o.flip) { g.translate(48, 0); g.scale(-1, 1); }
      if (o.small) { g.translate(24, 48); g.scale(0.5, 0.5); g.translate(-24, -48); }
      if (fn) fn(g, K, (ch, def) => (o.swap && o.swap[ch] ? PAL[o.swap[ch]] : def || PAL[ch]), o);
      else { g.imageSmoothingEnabled = false; const t = document.createElement('canvas'); t.width = t.height = 12; drawSprite(t.getContext('2d'), name, 0, 0, o); g.drawImage(t, 0, 0, 48, 48); }
      g.restore();
    }
    g.restore();
    // the 1999 scanner: a little soft, a colour cast, grain and the odd stripe from the lid not being shut
    if (k > 1 && 'filter' in g) { const t = document.createElement('canvas'); t.width = W2; t.height = H2; const tg = t.getContext('2d'); tg.filter = `blur(${(k * 0.12).toFixed(2)}px)`; tg.drawImage(g.canvas, 0, 0); g.drawImage(t, 0, 0); }
    const id = g.getImageData(0, 0, W2, H2), d = id.data, stripe = seed % 3 === 0 ? Math.floor((seed % 97) / 97 * H2) : -1;
    for (let i = 0, px = 0; i < d.length; i += 4, px++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff; const n = (seed % 15) - 7, row = Math.floor(px / W2), st = stripe >= 0 && Math.abs(row - stripe) < k * 0.4 ? 6 : 0;
      d[i] = Math.max(0, Math.min(255, d[i] * 0.94 + 14 + n + st)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * 0.94 + 9 + n + st)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * 0.9 + 4 + n + st));
    }
    g.putImageData(id, 0, 0);
  }
  W.drawPhoto = drawPhoto;

  // ================================================================ banner ads (all original, all lead to other fake sites)
  const ADS = [
    ['winbig', ['YOU ARE THE 1,000,000th VISITOR!!!', 'CLICK HERE TO CLAIM YOUR PRIZE', 'NO REALLY. CLICK HERE.'], '#ff0', '#e10600'],
    ['~mike', ['IS YOUR COMPUTER SLOW???', 'GET MORE MHz FOR FREE!', 'ONE BOY. ONE SCREWDRIVER.'], '#000080', '#fff'],
    ['adopt', ['LONELY?', 'ADOPT A PIXEL PET TODAY!', 'IT LIVES ON YOUR DESKTOP!'], '#5ac85a', '#000'],
    ['ecardz', ['SEND AN E-CARD TO A MATE!', 'ANIMATED! FREE! INSTANT!', 'eCardz.kidz'], '#f6a', '#000'],
    ['freetoolz', ['FREE HIT COUNTERS!!!', 'FREE GUESTBOOKS!!!', 'FREE MARQUEES!!!'], '#000', '#0f0'],
    ['teef', ['GEM EXCHANGE', 'DA ONLY SHOP DAT TAKES RUPEES', 'SALE NOW ON (not really)'], '#006400', '#ffd400'],
    ['getrich', ['MAKE MONEY FAST!!!', 'FROM YOUR OWN BEDROOM!!!', '(ask a grown-up first)'], '#0a0', '#ff0'],
    ['custard', ['THE TRUTH IS IN HERE', 'WHAT IS IN THE CUSTARD?', 'THE CUSTARD FILES'], '#111', '#3f3'],
    ['ezine', ['BYTESIZE ISSUE 7', 'OUT NOW!!!', 'INTERVIEW WITH GUBBINZ!'], '#c0f', '#fff'],
    ['hoods', ['FREE WEB SPACE!!!', '1 MB! YOUR OWN ADDRESS!', 'MOVE INTO SPACECITY TODAY'], '#ff6a00', '#fff'],
    ['csotd', ['COOL SITE OF THE DAY', 'IS IT YOURS?', 'CLICK TO FIND OUT'], '#036', '#ff0'],
    ['megaflash', ['EXPERIENCE MEGAFLASH 2000', 'THE BEST INTRO ON THE WEB', 'SKIP INTRO? NEVER!'], '#000', '#0ff'],
    ['hamstercam', [(window.Cast ? Cast.t('{hamster.NAME}') : 'NIBBLES') + ' IS LIVE!!!', 'WATCH A HAMSTER. RIGHT NOW.', 'HAMSTER CAM'], '#7a4a14', '#ffb347'],
    ['chatterbox', ['TALK TO REAL PEOPLE!!!', 'LIVE CHAT ROOMS', 'ChatterBox.netz'], '#09c', '#fff'],
    ['lookhere', ['YOUR HOROSCOPE IS READY', 'LookHere! the start page', 'Make it your home page!'], '#fff', '#c00'],
  ];
  let adN = 0;
  function adHtml(i, c) {
    const a = ADS[(i == null ? (Math.floor(Math.random() * ADS.length) + adN++) : i) % ADS.length];
    return `<a href="#" class="wad" data-wp="${a[0]}" style="background:${a[2]};color:${a[3]}" data-frames="${esc(a[1].join('|'))}"><span class="wad-f">${esc(a[1][0])}</span><span class="wad-cta">CLICK!</span><span class="wad-tag">Advertisement</span></a>`;
  }
  const splatHtml = () => `<div class="wad wsplat" style="background:linear-gradient(90deg,#ff0,#f80);color:#000" role="button" tabindex="0" aria-label="Splat the Blob advert game"><span class="wad-f" style="pointer-events:none">SPLAT THE BLOB! WIN A FREE JACKNET T-SHIRT!</span><span class="wsq"><canvas width="12" height="12" data-spr="squig"></canvas></span><span class="wad-tag">Advertisement</span></div>`;

  // ================================================================ things every page can use: c.rainbow, c.gif, c.ad, c.photo...
  const RB = ['#ff0000', '#ff8000', '#e0c000', '#00a000', '#0080ff', '#0000ff', '#8000ff', '#ff00c0'];
  W.kitCtx = c => {
    c.rainbow = (t, start) => [...String(t)].map((ch, i) => ch === ' ' ? ' ' : `<font color="${RB[(i + (start || 0)) % RB.length]}">${esc(ch)}</font>`).join('');
    c.spr = (name, scale, o) => `<canvas class="wspr" width="12" height="12" data-spr="${esc(name)}"${o && o.flip ? ' data-flip="1"' : ''}${o && o.swap ? ` data-swap="${esc(o.swap)}"` : ''} style="width:${12 * (scale || 3)}px;height:${12 * (scale || 3)}px"></canvas>`;
    c.photo = (spec, cap, file) => `<span class="wphoto"><canvas width="192" height="144" data-photo="${esc(spec)}" data-file="${esc(file || (cap || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 14) + '.jpg')}" title="Click to enlarge" aria-label="${esc(cap || 'A photo')}"></canvas><span>${cap ? esc(cap) : ''}</span></span>`;
    c.broken = (file, w, h, spec) => `<span class="wbroken" style="width:${w || 120}px;height:${h || 90}px" data-wbroke="${esc(file)}"${spec ? ` data-spec="${esc(spec)}"` : ''} title="${esc(file)}" role="button" tabindex="0"><i>x</i><span>${esc(file)}</span></span>`;
    c.gif = (name, size) => {
      const z = size || 32;
      if (name === 'globe') return `<svg class="wgif wgif-globe" viewBox="0 0 32 32" style="width:${z}px;height:${z}px" aria-hidden="true"><defs><clipPath id="gc${z}"><circle cx="16" cy="16" r="13"/></clipPath></defs><circle cx="16" cy="16" r="13" fill="#2a7ad8"/><g clip-path="url(#gc${z})"><g class="gl" fill="#3c3"><path d="M2 10q4-3 8 0t6 6-4 8M22 6q4 2 6 8t-4 10M42 10q4-3 8 0t6 6-4 8"/><rect x="8" y="12" width="7" height="6" rx="3"/><rect x="28" y="12" width="7" height="6" rx="3"/><rect x="21" y="20" width="5" height="5" rx="2"/><rect x="41" y="20" width="5" height="5" rx="2"/></g></g><circle cx="16" cy="16" r="13" fill="none" stroke="#003" stroke-width="1.5"/><ellipse cx="11" cy="10" rx="4" ry="2" fill="#fff" opacity=".5"/></svg>`;
      if (name === 'mail') return `<svg class="wgif wgif-mail" viewBox="0 0 32 24" style="width:${z}px;height:${z * 0.75}px" aria-hidden="true"><rect class="lt" x="7" y="3" width="18" height="12" fill="#fff" stroke="#888"/><rect x="3" y="9" width="26" height="14" fill="#ffe9a0" stroke="#7a5a00"/><path d="M3 23l13-8 13 8" fill="none" stroke="#7a5a00"/><path class="flap" d="M3 9l13 9 13-9z" fill="#ffd060" stroke="#7a5a00"/></svg>`;
      if (['skull', 'cube', 'star', 'squig', 'trophy', 'ufo', 'joystick', 'rocket', 'planet'].includes(name)) return `<span class="wgif wgif-spin" style="display:inline-block">${c.spr(name, Math.max(1, Math.round(z / 12)))}</span>`;
      if (name === 'new') return '<span class="wnew">NEW!</span>';
      if (name === 'hot') return '<span class="wnew hot">HOT!</span>';
      if (name === 'fire') return '<div class="wfire" aria-hidden="true"></div>';
      return '';
    };
    c.newb = () => '<span class="wnew">NEW!</span>';
    c.hot = () => '<span class="wnew hot">HOT!</span>';
    c.hr = () => '<hr class="whr">';
    c.ad = i => adHtml(i, c) + '<div class="wad-cap">Advertisement - support our sponsors!</div>';
    c.splat = () => splatHtml() + '<div class="wad-cap">Advertisement</div>';
    c.envelope = (user, text) => `${c.gif('mail', 28)} ${c.mail(user, text || 'E-mail me!')}`;
    c.ticker = items => `<marquee class="wtick" scrollamount="5">${items.map(x => '<b>&#9658;</b> ' + x).join(' &nbsp; ')}</marquee>`;
    c.plugin = (what, h) => `<div class="wplug" data-wplug="${esc(what || 'movie')}" style="min-height:${h || 90}px"><svg class="pz" viewBox="0 0 30 30" aria-hidden="true"><path d="M4 8h7a4 4 0 1 1 8 0h7v7a4 4 0 1 1 0 8v5H4v-7a4 4 0 1 0 0-8z" fill="#4a8ad8" stroke="#003"/></svg><span>This page uses <b>JackFlash Player 4</b> to show its ${esc(what || 'movie')}.<br><a href="#" data-wp="megaflash/plugin.html">Click here to get the plug-in</a></span></div>`;
    c.applet = (kind, w, h, o) => `<div class="wapplet" data-applet="${esc(kind)}" data-o="${esc(JSON.stringify(o || {}))}" style="width:${w || 300}px;height:${h || 100}px"><div class="wap-l">${c.gif('cube', 16)} Loading Java...</div></div>`;
    c.status = t => `<span class="wstatus" data-text="${esc(t)}" hidden></span>`;
    c.dead = (url, text) => `<a href="http://${esc(url)}" class="wdead">${text || esc(url)}</a>`;
    c.pop = (name, text) => `<a href="#" data-wpop="${esc(name)}">${text}</a>`;
    c.popauto = name => `<span data-wpopauto="${esc(name)}" hidden></span>`;
    c.updated = n => `<div class="wlast">Last updated: ${c.daysAgo(n == null ? 3 : n)}</div>`;
    c.spacer = (w, h) => `<span style="display:inline-block;width:${w || 1}px;height:${h || 1}px"></span>`;
    c.galaxy = () => W.galaxyBar(c);
    c.map = (vb, inner, areas) => `<svg class="wmap" viewBox="${vb}" role="img">${inner}${areas.map(a => `<g class="hot" tabindex="0" ${a[1] === '!secret' ? 'data-wmapsecret="1"' : a[1].startsWith('dead:') ? `data-wdeadmap="${esc(a[1].slice(5))}"` : `data-wp="${esc(a[1])}"`}><title>${esc(a[2] || '')}</title>${a[0]}</g>`).join('')}</svg>`;
    c.enter = (to, text) => `<a href="#" class="wenter" data-wp="${esc(to)}">${text || 'ENTER'}</a>`;
    c.counterLine = (pre, st) => `<p class="c">${pre || 'You are visitor number'} ${c.counter(st || 'odo')}</p>`;
  };

  // ================================================================ frames, button bars and text links (site navigation)
  function navList(site) {
    const m = M[site], dir = m.host ? m.path.replace(/[^/]*$/, '') : null, out = [site];
    for (const id of Object.keys(M)) if (M[id].parent === site) out.push(id);
    if (m.host) for (const id of Object.keys(M)) { const x = M[id]; if (id !== site && !x.parent && x.host === m.host && x.cat !== 'hidden' && x.path.replace(/[^/]*$/, '') === dir && x.path !== m.path && !W.SUBS[id]) out.push(id); }
    return out;
  }
  const short = t => t.replace(/ [-:(].*$/, '').replace(/^\*~\* | \*~\*$/g, '');
  W.shell = (c, body, mode) => {
    const list = navList(c.site), lab = id => W.LABEL[id] || (id === c.site ? 'Home' : short(M[id].t));
    const link = id => id === c.w ? `<b>${esc(lab(id))}</b>` : c.a(id, esc(lab(id)));
    const title = esc(short(M[c.site].t));
    if (list.length < 2 && mode !== 'left') return body;
    if (mode === 'left') return `<div class="wfr"><div class="wfr-nav"><div class="wfr-logo">${title}</div>${list.map(id => `<div class="wfr-i">${id === c.w ? '&#9658;' : '&#183;'} ${link(id)}</div>`).join('')}<div class="wfr-i" style="margin-top:12px">${c.gif('globe', 24)}</div></div><div class="wfr-main">${body}</div></div><div class="wfr-nof">[This site uses FRAMES. Your screen is too small for frames, so they have been stacked. Get a 17 inch monitor!]</div>`;
    if (mode === 'top') return `<div class="wtf"><span class="wtf-t">${title}</span>${list.map(link).join(' <span>|</span> ')}</div>${body}`;
    if (mode === 'buttons') return `<div class="wbn">${list.map(id => id === c.w ? `<b>${esc(lab(id))}</b>` : `<a href="#" data-wp="${esc(id)}">${esc(lab(id))}</a>`).join('')}</div>${body}`;
    const txt = `<div class="wtn">[ ${list.map(link).join(' | ')} ]</div>`;
    return txt + body + txt;
  };
  W.galaxyBar = c => {
    const R = W.GRING, i = R.indexOf(c.w), prev = R[(i + R.length - 1) % R.length], next = R[(i + 1) % R.length];
    return `<div class="wgring">${c.gif('star', 24)}<div>This site is part of <b>THE GALAXY RING</b>${i < 0 ? '' : ` (${i + 1} of ${R.length})`}<br>[ <a href="#" data-wp="${prev}" data-ring="gprev">&laquo; Prev</a> | <a href="#" data-wp="galaxyring" data-ring="ghub">Hub</a> | <a href="#" data-wp="${W.pick(R)}" data-ring="grandom">Random</a> | <a href="#" data-wp="${next}" data-ring="gnext">Next &raquo;</a> ]</div>${c.gif('ufo', 24)}</div>`;
  };

  // ================================================================ pop-ups: a real (small) JackNet Explorer window on the desktop
  W.POPS = W.POPS || {};
  let popWin = null, popClosed = 0;
  const POPICO = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#2a7ad8" stroke="#003"/><ellipse cx="8" cy="8" rx="9" ry="3" fill="none" stroke="#ffd400" stroke-width="1.5" transform="rotate(-20 8 8)"/></svg>';
  W.popup = (p, c) => {
    if (typeof p === 'string') p = W.POPS[p]; if (!p) return;
    if (popWin && !popWin.closed) popWin.close();
    const b = document.createElement('div'); b.className = 'wpopw';
    b.innerHTML = `<div class="wpop-a">Address <span>${esc(p.url || 'http://ads.popupz.w3b/')}</span></div><div class="wpop-p"></div>`;
    const pg = b.querySelector('.wpop-p'); pg.innerHTML = typeof p.html === 'function' ? p.html(c || W.stubCtx('search')) : p.html;
    pg.style.cssText += p.style || '';
    popWin = A.win(p.title + ' - JackNet Explorer', b, { w: p.w || 300, icon: POPICO, noMax: true, escClose: true, x: Math.max(4, innerWidth / 2 - 100 + Math.random() * 120), y: 60 + Math.random() * 80, onClose: () => { if (++popClosed >= 3) A.secret('web.popup'); } });
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-wp],[data-close]'); if (!a) return; ev.preventDefault();
      const w = a.dataset.wp; popWin.close(); if (w) W.open(w);
    });
    if (p.setup) p.setup(pg, popWin);
    Sound.play('pet');
    return popWin;
  };

  // ================================================================ wiring: draw sprites, run ads/applets/plugins/status scrollers
  let deadN = store.get('jhp_web_dead', 0);
  const popAutoDone = {};
  W.kitWire = (el, c, api) => {
    el.querySelectorAll('canvas[data-spr]').forEach(cv => { const g = cv.getContext('2d'), o = {}; if (cv.dataset.flip) o.flip = 1; if (cv.dataset.swap) { o.swap = {}; cv.dataset.swap.split(',').forEach(p => { o.swap[p[0]] = p[1]; }); } g.clearRect(0, 0, 12, 12); drawSprite(g, cv.dataset.spr, 0, 0, o); });
    el.querySelectorAll('canvas[data-photo]').forEach(cv => {
      drawPhoto(cv.getContext('2d'), cv.dataset.photo);
      cv.addEventListener('click', () => W.popup({ title: cv.dataset.file, url: 'http://' + (M[c.w].host || 'www.jackattack.jnet') + '/photos/' + cv.dataset.file, w: 330, h: 330, html: `<canvas width="192" height="144" style="width:288px;max-width:100%;border:1px solid #000"></canvas><p style="font:11px Arial,sans-serif">${esc(cv.dataset.file)} - ${12 + cv.dataset.photo.length % 40} KB<br><a href="#" data-close="1">Close this window</a></p>`, setup: pg => drawPhoto(pg.querySelector('canvas').getContext('2d'), cv.dataset.photo) }, c));
    });
    // broken images: click to try loading again (sometimes it works, line by line, like 56K)
    el.querySelectorAll('[data-wbroke]').forEach(b => {
      const tryIt = () => {
        if (b.dataset.busy) return;
        if (!b.dataset.spec) { b.title = 'Still broken. The file has gone forever. (It was on a floppy disk. The floppy disk is in the bin.)'; Sound.play('uhoh'); const $s = document.getElementById('brStatus'); if ($s) $s.textContent = 'Could not load image: ' + b.dataset.wbroke; return; }
        b.dataset.busy = 1; const cv = document.createElement('canvas'); cv.width = 192; cv.height = 144; b.innerHTML = ''; b.appendChild(cv);
        const full = document.createElement('canvas'); full.width = 192; full.height = 144; drawPhoto(full.getContext('2d'), b.dataset.spec);
        const g = cv.getContext('2d'); let row = 0;
        const t = setInterval(() => { if (!b.isConnected) return clearInterval(t); g.drawImage(full, 0, row, 192, 12, 0, row, 192, 12); row += 12; if (row >= 144) { clearInterval(t); A.secret('web.broken'); } }, 120);
      };
      b.addEventListener('click', tryIt); b.addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(); });
    });
    // animated banner ads: cycle their frames like a 3-frame GIF
    const ads = [...el.querySelectorAll('.wad[data-frames]')];
    if (ads.length) { let f = 0; api.every(() => { f++; ads.forEach(a => { const fr = a.dataset.frames.split('|'); a.querySelector('.wad-f').textContent = fr[f % fr.length]; }); }, 1600); }
    // Splat the Squig (the "punch the monkey" of 1999)
    el.querySelectorAll('.wsplat').forEach(ad => {
      const sq = ad.querySelector('.wsq'), lab = ad.querySelector('.wad-f'); let tries = 0;
      ad.addEventListener('click', ev => {
        if (ad.classList.contains('done')) return;
        if (ev.target.closest('.wsq')) { ad.classList.add('done'); lab.textContent = 'SPLAT!!! YOU WIN!!! CLAIM YOUR T-SHIRT...'; Sound.play('thud'); A.secret('web.splat'); setTimeout(() => W.open('winbig'), 1200); }
        else { tries++; lab.textContent = tries > 3 ? 'SO CLOSE!!! KEEP TRYING!!!' : 'MISSED! TRY AGAIN!'; Sound.play('zap'); setTimeout(() => { if (!ad.classList.contains('done')) lab.textContent = 'SPLAT THE BLOB! WIN A FREE JACKNET T-SHIRT!'; }, 900); }
      });
    });
    // plug-in boxes: once JackFlash is "installed", they show their little movie instead
    if (store.get('jhp_web_flash', 0)) el.querySelectorAll('[data-wplug]').forEach(p => { p.outerHTML = `<div class="wflash" style="height:${p.style.minHeight || '90px'}"><div class="wfl-t" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:wspin 2s linear infinite">${esc(p.dataset.wplug).toUpperCase()}!!!</div></div>`; });
    // Java applets: grey box, "Loading Java...", then they start
    el.querySelectorAll('[data-applet]').forEach(box => api.later(() => startApplet(box, c, api), 1800 + Math.random() * 1500));
    // status bar scrolling text (the window.status trick)
    const st = el.querySelector('.wstatus');
    if (st) { const txt = st.dataset.text + '          '; let i = 0; api.later(() => api.every(() => { const s = document.getElementById('brStatus'); if (s && el.closest('.sec.on')) { s.textContent = (txt.slice(i) + txt.slice(0, i)).slice(0, 90); i = (i + 1) % txt.length; } }, 140), 1600); }
    // pop-up links and (rare) pop-ups on arrival
    el.querySelectorAll('[data-wpop]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); W.popup(a.dataset.wpop, c); }));
    const auto = el.querySelector('[data-wpopauto]');
    if (auto && !popAutoDone[auto.dataset.wpopauto]) { popAutoDone[auto.dataset.wpopauto] = 1; api.later(() => W.popup(auto.dataset.wpopauto, c), 2500); }
    // dead links (they go to sites that don't exist any more) and image maps
    el.querySelectorAll('a.wdead,[data-wdeadmap]').forEach(a => a.addEventListener('click', () => { deadN++; store.set('jhp_web_dead', deadN); if (deadN >= 5) A.secret('web.deadlink'); if (a.dataset.wdeadmap) IE.navigate('http://' + a.dataset.wdeadmap); }));
    el.querySelectorAll('[data-wmapsecret]').forEach(a => a.addEventListener('click', () => { A.secret('web.imagemap'); Desk.toast('You found it!', 'A secret hotspot! Webmasters used to hide these in image maps. Tell nobody.', 4000); Sound.play('solve'); }));
  };

  // ================================================================ Java applets (drawn on a canvas once "loaded")
  function startApplet(box, c, api) {
    if (!box.isConnected) return;
    const kind = box.dataset.applet, o = JSON.parse(box.dataset.o || '{}'), w = parseInt(box.style.width, 10) || 300, h = parseInt(box.style.height, 10) || 100;
    const $s = document.getElementById('brStatus'); if ($s && box.closest('.sec.on')) $s.textContent = 'Applet ' + kind + ' started';
    if (kind === 'fail') { box.innerHTML = `<div class="wap-l" style="color:#a00">Applet ${esc(o.name || 'Cool.class')} failed to initialise: class not found.<br>(It was 30 KB. It never arrived.)</div>`; return; }
    const cv = document.createElement('canvas'), sc = kind === 'lake' ? 4 : 1; cv.width = Math.round(w / sc); cv.height = Math.round(h / sc); box.innerHTML = ''; box.appendChild(cv);
    const g = cv.getContext('2d'), CW = cv.width, CH = cv.height;
    if (kind === 'clock') return api.every(() => { const d = new Date(); g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); g.fillStyle = '#0f0'; g.font = `bold ${Math.round(CH * 0.45)}px monospace`; g.textAlign = 'center'; g.fillText(d.toTimeString().slice(0, 8), CW / 2, CH * 0.62); g.font = '10px monospace'; g.fillText(c.today + ' (Y2K READY)', CW / 2, CH - 6); }, 500);
    if (kind === 'ticker') { const t = (o.text || 'WELCOME TO MY PAGE!!!') + '     '; let x = CW; return api.every(() => { g.fillStyle = '#000080'; g.fillRect(0, 0, CW, CH); g.fillStyle = '#ff0'; g.font = `bold ${Math.round(CH * 0.5)}px Arial`; g.fillText(t, x, CH * 0.68); x -= 3; if (x < -g.measureText(t).width) x = CW; }, 40); }
    if (kind === 'lake') { // the classic "lake" applet: a picture with its rippling reflection
      const top = document.createElement('canvas'); top.width = 192; top.height = 144; drawPhoto(top.getContext('2d'), o.spec || '#9cf #3a3; house 18 13; tree 4 13; tree 32 13');
      const half = Math.round(CH / 2); let t = 0; A.secret('web.lake');
      return api.every(() => { t += 0.25; g.drawImage(top, 0, 0, 192, 144, 0, 0, CW, half); for (let y = 0; y < CH - half; y++) { const off = Math.round(Math.sin(t + y * 0.8) * (1 + y / 10)); g.drawImage(cv, 0, half - 1 - y, CW, 1, off, half + y, CW, 1); } g.fillStyle = 'rgba(0,40,120,.35)'; g.fillRect(0, half, CW, CH - half); }, 80);
    }
    if (kind === 'fireworks') { const P = []; return api.every(() => { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, CW, CH); if (Math.random() < 0.08) { const x = Math.random() * CW, y = Math.random() * CH * 0.6, col = W.pick(['#f00', '#ff0', '#0f0', '#0ff', '#f0f', '#fff']); for (let i = 0; i < 24; i++) P.push({ x, y, vx: Math.cos(i / 24 * 6.28) * (1 + Math.random()), vy: Math.sin(i / 24 * 6.28) * (1 + Math.random()), l: 30, col }); } for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.03; if (--p.l <= 0) { P.splice(i, 1); continue; } g.fillStyle = p.col; g.fillRect(p.x, p.y, 2, 2); } }, 40); }
    if (kind === 'stars') { const S = Array.from({ length: 60 }, () => ({ x: Math.random() * CW - CW / 2, y: Math.random() * CH - CH / 2, z: Math.random() * CW })); return api.every(() => { g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); g.fillStyle = '#fff'; S.forEach(s => { s.z -= 4; if (s.z < 1) { s.z = CW; s.x = Math.random() * CW - CW / 2; s.y = Math.random() * CH - CH / 2; } const k = 120 / s.z; g.fillRect(CW / 2 + s.x * k, CH / 2 + s.y * k, k > 1.5 ? 2 : 1, k > 1.5 ? 2 : 1); }); }, 40); }
  }

  // ================================================================ page templates (so every site can have links, photos, awards and guestbook pages)
  W.T = {
    links: (intro, list) => ({ html: c => `<h2>${intro && intro.h || 'My Links'}</h2>${intro && intro.p ? `<p>${intro.p}</p>` : ''}<table class="wt" border="1" cellspacing="4"><tr><th>Site</th><th>What it is</th></tr>${list.map(([to, name, d]) => to.startsWith('dead:') ? `<tr><td>${c.dead(to.slice(5), esc(name))}</td><td>${esc(d || '')} <i>(link might be broken)</i></td></tr>` : to.startsWith('sec:') ? `<tr><td>${c.go(to.slice(4), esc(name))}</td><td>${esc(d || '')}</td></tr>` : `<tr><td>${c.a(to, name ? esc(name) : null)}${Math.random() < 0.15 ? ' ' + c.newb() : ''}</td><td>${esc(d || (M[to] && M[to].d) || '')}</td></tr>`).join('')}</table><p class="c small">Want to swap links? ${c.envelope(c.sk.replace(/^u-/, ''), 'E-mail me!')}</p>${c.updated(5)}`, cls: 'wtpl' }),
    photos: (intro, list) => ({ html: c => `<h2>${intro && intro.h || 'My Photos'}</h2>${intro && intro.p ? `<p>${intro.p}</p>` : ''}<p class="small">Click a photo to see it bigger (opens a new window). Scanned at the library.</p><div class="c">${list.map(([spec, cap]) => spec === 'broken' ? c.broken(cap.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 14) + '.jpg', 192, 160) : spec.startsWith('broken:') ? c.broken(cap.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 14) + '.jpg', 192, 144, spec.slice(7)) : c.photo(spec, cap)).join('')}</div>${c.updated(8)}`, cls: 'wtpl' }),
    awards: (intro, list) => ({ html: c => `<h2>${intro && intro.h || 'Awards I Have Won!!!'}</h2><p>${intro && intro.p || 'Thank you to everyone who gave my site an award. I am very honoured. (Some of these I gave myself.)'}</p><div class="c">${list.map(([n, from, col]) => `<span class="waward" style="--ac:${col || '#ffd400'}">${c.spr('trophy', 2)}${esc(n)}<small>from ${esc(from)}</small></span>`).join('')}</div><p class="c small">Want to give me an award? Use the guestbook! Want an award for YOUR site? Try ${c.a('awards', 'the JackNet Cool Site Awards')} or ${c.a('csotd', 'Cool Site of the Day')}.</p>`, cls: 'wtpl' }),
    gbView: (title, seed) => ({ html: c => `<h2 class="c">${title || 'My Guestbook'}</h2>${c.gb(seed || [], { mode: 'view', k: 'web.gb.' + c.sk, title: 'Guestbook entries', signLink: c.s('sign.html', 'Sign the guestbook') })}<p class="c">${c.gif('mail', 24)} ${c.s('sign.html', '<b>Click here to SIGN my guestbook!</b>')}</p>` }),
    gbSign: (title, ph) => ({ html: c => `<h2 class="c">${title || 'Sign My Guestbook'}</h2><p class="c">Thank you for visiting! Please leave a message. Be nice!</p>${c.gb([], { mode: 'sign', k: 'web.gb.' + c.sk, title: 'Sign here', ph, viewLink: c.s('guestbook.html', 'View the guestbook') })}<p class="c">${c.s('guestbook.html', 'View my guestbook')}</p>` }),
  };

  // ================================================================ the adopted pixel pet (lives on the desktop)
  let petW = null;
  W.petWindow = () => {
    const pet = store.get('jhp_web_pet', null); if (!pet) return W.open('adopt');
    if (petW && !petW.closed) { petW.restore(); return; }
    const b = document.createElement('div'); b.className = 'wpet';
    b.innerHTML = `<canvas width="12" height="12"></canvas><div class="pmsg"></div><div style="text-align:left">Hunger<div class="bar"><i class="hb"></i></div>Happiness<div class="bar"><i class="hp"></i></div></div><div class="row" style="justify-content:center"><button class="btn" data-a="feed">Feed</button><button class="btn" data-a="play">Play</button><button class="btn" data-a="pat">Pat</button></div><p class="small" style="margin:6px 0 0">Adopted from www.adoptapixel.kidz on ${esc(pet.born || '??/??/99')}</p>`;
    petW = A.win(pet.name + ' - Pixel Pet', b, { w: 230, icon: W.petIcon(pet.kind), noMax: true, noResize: true });
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'), msg = b.querySelector('.pmsg');
    const now = Date.now(), stat = () => { const p = store.get('jhp_web_pet', pet); const h = Math.max(0, 100 - (Date.now() - (p.fed || now)) / 60000 * 2), j = Math.max(0, 100 - (Date.now() - (p.played || now)) / 60000 * 1.5); return [h, j, p]; };
    let bounce = 0, mood = '';
    const draw = () => { const [h, j] = stat(); b.querySelector('.hb').style.width = h + '%'; b.querySelector('.hp').style.width = j + '%'; b.querySelector('.hb').style.background = h < 30 ? '#c00' : '#0a0'; g.clearRect(0, 0, 12, 12); g.save(); g.translate(0, bounce > 0 ? -1 : 0); drawSprite(g, pet.kind === 'fish' ? 'fish' : pet.kind, 0, 0, { flip: Math.floor(Date.now() / 1200) % 2 }); g.restore(); msg.textContent = mood || (h < 30 ? pet.name + ' is STARVING!' : j < 30 ? pet.name + ' is bored.' : pet.name + ' is happy.'); };
    const t = setInterval(() => { if (petW.closed) return clearInterval(t); if (bounce > 0) bounce--; draw(); }, 400);
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return; const [h, , p] = stat();
      if (a.dataset.a === 'feed') { if (h < 30) A.secret('web.petfed'); p.fed = Date.now(); mood = 'Nom nom nom.'; Sound.play('pet'); }
      if (a.dataset.a === 'play') { p.played = Date.now(); mood = 'Wheee!'; bounce = 4; Sound.play('boing'); }
      if (a.dataset.a === 'pat') { mood = W.pick(['*purr*', '*happy pixel noises*', ':)']); Sound.play('click'); }
      store.set('jhp_web_pet', p); draw(); setTimeout(() => { mood = ''; }, 1500);
    });
    draw();
  };
})();

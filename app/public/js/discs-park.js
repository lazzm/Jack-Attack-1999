/* RollerJack Tycoon (Games Cupboard disc, lazy loaded by discs.js). An isometric theme park: lay paths and queue lines,
 * plonk down rides and stalls, build a rollercoaster piece by piece, hire Handymen and Mechanics, and keep the guests
 * happy (and not too queasy). Original code and art: everything is drawn on a canvas. */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;

  const N = 24, NN = N * N, ENTX = 11, ENTY = N - 1, ENT = ENTY * N + ENTX;
  const LV = 8; // pixels per height level
  const SPD = 3; // real seconds per game day at 1x
  const MONTHS = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // money: the park's books are kept in "units" (old saves too); one unit shows as 10 Rupees
  const RUP = 10;
  const rup = n => Math.round(n * RUP);
  const money = n => { const v = rup(n); return (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('en-GB') + (Math.abs(v) === 1 ? ' Rupee' : ' Rupees'); };
  const money2 = money;
  // compact HTML: a little gem and the number
  const gemH = (n, px) => { const v = rup(n); let g = ''; try { g = window.Econ && Econ.gem ? Econ.gem(Math.max(1, Math.abs(v)), px || 11) : ''; } catch (e) { g = ''; } return `<span class="dg-park-rp">${g || '<i class="dg-park-gem"></i>'}${v < 0 ? '-' : ''}${Math.abs(v).toLocaleString('en-GB')}</span>`; };
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================================================================ catalogue
  const RIDES = {
    carousel: { n: 'Jack-Go-Round', w: 2, cost: 1200, e: 1.8, i: 0.4, nn: 0.3, cap: 12, dur: 14, price: 1.0, up: 15, d: 'A gentle merry-go-round. The horses go up and down. Nobody knows why.' },
    wheel: { n: 'Big Wheel', w: 3, cost: 2000, e: 2.4, i: 0.6, nn: 0.2, cap: 16, dur: 20, price: 1.5, up: 20, d: 'A slow wheel with a view of the whole park. Dave is scared of it.' },
    teacups: { n: 'Spinning Teacups', w: 3, cost: 1600, e: 2.9, i: 2.7, nn: 3.6, cap: 12, dur: 14, price: 1.2, up: 17, d: 'Spinning cups. Spins you round. Don\'t eat a burger first.' },
    haunted: { n: 'Haunted Hut', w: 2, cost: 1400, e: 3.1, i: 1.4, nn: 0.5, cap: 8, dur: 16, price: 1.5, up: 15, d: 'A dark ride full of ghosts (bedsheets on string). Genuinely a bit scary.' },
    bumper: { n: 'Bumper Cars', w: 3, cost: 1800, e: 3.4, i: 2.3, nn: 0.8, cap: 10, dur: 16, price: 1.5, up: 20, d: 'Little cars that crash into each other. On purpose. Sparks!' },
    drop: { n: 'Jack Drop', w: 2, cost: 2600, e: 5.6, i: 7.4, nn: 2.2, cap: 8, dur: 12, price: 2.5, up: 27, d: 'A very tall tower. It goes up slowly. It does NOT come down slowly.' },
    ship: { n: 'Pirate Ship', w: 3, cost: 2200, e: 4.3, i: 4.8, nn: 3.1, cap: 16, dur: 16, price: 2.0, up: 21, d: 'A big wooden boat that swings higher and higher. Arrr. Do NOT sit at the end after a burger.' },
    chairs: { n: 'Chair-O-Swings', w: 2, cost: 1500, e: 3.0, i: 2.6, nn: 1.5, cap: 12, dur: 14, price: 1.2, up: 14, d: 'Little chairs on chains that spin round and fly out sideways. Wheee.' },
  };
  Object.values(RIDES).forEach(r => { r.st = { e: r.e, i: r.i, n: r.nn }; });
  RIDES.haunted.cov = RIDES.bumper.cov = 1; // under a roof: rain doesn't put anybody off
  const STALLS = {
    burger: { n: 'Jack Burger', cost: 400, price: 1.6, need: 'hunger', item: 'wrapper', up: 12, d: '100% beef. Probably.' },
    chips: { n: 'Chip Shop', cost: 380, price: 1.3, need: 'hunger', item: 'wrapper', up: 11, d: 'Chips with salt and LOTS of vinegar. In a cone.' },
    lolly: { n: 'Ice Lollies', cost: 300, price: 0.7, need: 'hunger', item: 'stick', up: 8, d: 'Rocket lollies. Small but cheap. Everybody wants one when it\'s hot.' },
    floss: { n: 'Candyfloss', cost: 320, price: 0.8, need: 'hunger', item: 'stick', up: 8, d: 'A pink cloud of sugar on a stick. Your teeth will thank you. (They won\'t.)' },
    pop: { n: 'Fizzy Pop', cost: 350, price: 0.9, need: 'thirst', item: 'cup', up: 10, d: 'Orange, cola or "blue".' },
    toilet: { n: 'Toilets', cost: 300, price: 0.2, need: 'toilet', up: 10, d: 'Everyone needs to go eventually.' },
    info: { n: 'Info Kiosk', cost: 450, price: 1.0, need: 'balloon', up: 10, d: 'Sells balloons and park maps. And umbrellas, when it rains.' },
    hats: { n: 'Hat Stall', cost: 420, price: 1.2, need: 'hat', up: 10, d: 'Silly hats in every colour. Guests look ridiculous and love it.' },
    cash: { n: 'Cash Machine', cost: 500, price: 0, need: 'cash', up: 14, d: 'A hole in the wall. Guests who run out of money can get more out and spend it on your rides.' },
  };
  const SCEN = {
    pine: { n: 'Pine Tree', cost: 15 }, oak: { n: 'Oak Tree', cost: 20 }, palm: { n: 'Palm Tree', cost: 25 }, flowers: { n: 'Flower Bed', cost: 10 }, hedge: { n: 'Hedge', cost: 12 },
    bunny: { n: 'Hedge Bunny', cost: 60 }, gnome: { n: 'Garden Gnome', cost: 35 }, fountain: { n: 'Fountain', cost: 150 }, statue: { n: 'Robot Statue', cost: 220 }, clock: { n: 'Flower Clock', cost: 300 },
    bench: { n: 'Bench (on path)', cost: 30, path: 1 }, bin: { n: 'Litter Bin (on path)', cost: 25, path: 1 }, lamp: { n: 'Lamp Post (on path)', cost: 20, path: 1 },
  };
  const FURN = { bench: 1, bin: 2, lamp: 3 };
  const STAFF = { handy: { n: 'Handyman', wage: 30, d: 'Sweeps litter. Mostly.' }, mek: { n: 'Mechanic', wage: 45, d: 'Fixes broken rides with a big spanner.' } };
  // objectives (checked at the end of October in the year given, default Year 1):
  //   guests + rating | guests + coaster (best excitement) | profit (one month's profit)
  const SCENARIOS = [
    { n: 'Jack\'s Meadow', d: 'A flat, friendly meadow full of rabbits. Mom says it\'s a good place to start.', money: 10000, loan: 10000, lake: [18, 6, 2.6], trees: 34, seed: 11, obj: { guests: 60, rating: 600 }, lvl: 'Easy' },
    { n: 'Puddle Gulch', d: 'A muddy gulch with a big lake and not much money. Dave says his nan lives near here.', money: 6000, loan: 6000, lake: [15, 9, 3.6], trees: 55, seed: 23, obj: { guests: 90, rating: 600 }, lvl: 'Medium' },
    { n: 'Callum\'s Challenge', d: 'Callum bet you a packet of crisps you can\'t build a better coaster than his. Prove him wrong.', money: 15000, loan: 5000, lake: [5, 5, 2.2], trees: 26, seed: 37, obj: { guests: 40, coaster: 6 }, lvl: 'Medium' },
    { n: 'Drizzly Downs', d: 'It rains here. A LOT. Build plenty under a roof, sell umbrellas and keep the guests cheerful.', money: 8000, loan: 8000, lake: [6, 16, 2.4], trees: 40, seed: 51, obj: { guests: 75, rating: 650 }, wet: 1, lvl: 'Hard' },
    { n: 'Golden Sands', d: 'A sunny seaside spot. The bank manager only cares about one thing: a month with a big profit.', money: 12000, loan: 12000, lake: [20, 12, 3.2], trees: 18, seed: 63, obj: { profit: 250 }, sunny: 1, palms: 1, lvl: 'Medium' },
    { n: 'Loop Valley', d: 'The council finally said yes to loops. Build a monster coaster and pack the place out.', money: 20000, loan: 10000, lake: [3, 18, 2.0], trees: 30, seed: 77, obj: { guests: 120, coaster: 7.5 }, lvl: 'Hard' },
  ];
  // the weather: sun, cloud, rain or a heatwave, for a few days at a time
  const WX = { sun: { n: 'Sunny' }, cloud: { n: 'Cloudy' }, rain: { n: 'Raining' }, hot: { n: 'Heatwave' } };
  const COASTER_NAMES = ['The Jackhammer', 'Big Dipper', 'The Mega Drop', 'Jack Rocket', 'The Corkscrew Kid', 'Mom\'s Nightmare'];
  const SHIRTS = ['#e02020', '#2050e0', '#20a020', '#e0c020', '#e07020', '#a020c0', '#20c0c0', '#ffffff', '#e060a0', '#606060'];
  const SKINS = ['#f0c8a0', '#e0b088', '#c08860', '#8a5a3a', '#f8d8b8'];
  const MATES = [
    { n: 'Callum', shirt: '#202020', q: ['I built a better coaster than this at home', 'This would run faster on my 3D card', 'Is this the full version or the demo?'] },
    { n: 'Dave', shirt: '#e0c020', q: ['This is good but I\'d rather be playing Kart Kaos 64', 'Can I have another burger?', 'Have you got an ULTRA 64 in here?'] },
    { n: 'Luke', shirt: '#2050e0', q: ['Does the info kiosk sell ULTRA 64 games?', 'This ride is nearly as good as Wave Pace 64', 'I want to go on something more thrilling'] },
    { n: 'JackK', shirt: '#20a020', q: ['Two Jacks in one park? Confusing', 'Wow, this park is great!', 'Who designed this coaster? It\'s mad'] },
    { n: 'Gubbinz', shirt: '#3a8a2a', q: ['Jack says I\'m not allowed on the computer. This is the computer', 'Where do the Jack Burgers come from? ...don\'t tell me', 'I\'m not going on the Big Wheel'] },
    { n: 'Jack\'s Mom', shirt: '#c06090', q: ['Is this what you do on that computer all day?', 'It\'s very nice, love. Bedtime in ten minutes', 'Who\'s going to tidy up all this litter?'] },
  ];

  // ================================================================ CSS
  const CSS = `
.dg-park-root{position:absolute;inset:0;display:flex;flex-direction:column;background:#c0c0c0;color:#000;font:11px/1.3 Tahoma,"MS Sans Serif",sans-serif;user-select:none;-webkit-user-select:none}
.dg-park-tb{flex:none;display:flex;flex-wrap:wrap;gap:1px;padding:2px 3px;border-bottom:1px solid #808080;box-shadow:0 1px #fff;align-items:center}
.dg-park-b{width:30px;height:28px;padding:0;margin:0;display:inline-flex;align-items:center;justify-content:center;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf;cursor:pointer;font:bold 10px Tahoma,sans-serif;color:#000;position:relative}
.dg-park-b svg{width:22px;height:22px;display:block;pointer-events:none}
.dg-park-b.on,.dg-park-b:active{border-color:#404040 #fff #fff #404040;box-shadow:inset 1px 1px #808080;background:repeating-conic-gradient(#c0c0c0 0 25%,#e0e0e0 0 50%) 0 0/2px 2px}
.dg-park-b.on svg{transform:translate(1px,1px)}
.dg-park-b.txt{width:auto;padding:0 6px}
.dg-park-sep{width:5px;height:24px;border-left:1px solid #808080;border-right:1px solid #fff;margin:0 3px}
.dg-park-view{flex:1;position:relative;overflow:hidden;background:#000;min-height:0;touch-action:none}
.dg-park-cv{position:absolute;left:0;top:0;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
.dg-park-hint{position:absolute;left:4px;top:4px;background:rgba(0,0,0,.6);color:#ff0;font:bold 11px Tahoma,sans-serif;padding:2px 6px;pointer-events:none;max-width:calc(100% - 8px)}
.dg-park-bar{flex:none;display:flex;gap:3px;padding:2px 3px;flex-wrap:wrap;border-top:1px solid #fff}
.dg-park-f{border:1px solid;border-color:#808080 #fff #fff #808080;padding:1px 6px;white-space:nowrap;font-weight:bold}
.dg-park-f.neg{color:#c00000}
.dg-park-news{flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#ffffd8;border:1px solid;border-color:#808080 #fff #fff #808080;padding:1px 6px;cursor:pointer}
.dg-park-news b{color:#000080}
.dg-park-wins{position:absolute;inset:0;pointer-events:none}
.dg-park-win{position:absolute;pointer-events:auto;background:#c0c0c0;border:1px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset -1px -1px #808080,inset 1px 1px #fff,3px 3px 0 rgba(0,0,0,.35);width:250px;max-width:calc(100% - 8px);max-height:calc(100% - 8px);display:flex;flex-direction:column}
.dg-park-wt{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:bold;padding:2px 3px 2px 5px;display:flex;align-items:center;gap:4px;flex:none;margin:2px 2px 0}
.dg-park-wt span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dg-park-wt button{width:16px;height:14px;padding:0;font:bold 9px Tahoma;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;line-height:10px;cursor:pointer}
.dg-park-wb{padding:6px;overflow:auto;min-height:0}
.dg-park-wb p{margin:0 0 5px}
.dg-park-wb .row2{display:flex;justify-content:space-between;gap:6px;margin:2px 0}
.dg-park-wb .btn{font:11px Tahoma,sans-serif;padding:3px 8px;min-width:0}
.dg-park-wb .bb{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.dg-park-bar2{height:9px;border:1px solid;border-color:#808080 #fff #fff #808080;background:#fff;flex:1;position:relative;max-width:120px}
.dg-park-bar2 i{position:absolute;left:0;top:0;bottom:0;background:#000080}
.dg-park-bar2.r i{background:#c00000}.dg-park-bar2.g i{background:#008000}
.dg-park-list{background:#fff;border:2px inset #fff;max-height:150px;overflow:auto;padding:2px}
.dg-park-list div{padding:1px 3px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dg-park-list div:hover{background:#000080;color:#fff}
.dg-park-dd{position:absolute;z-index:4;background:#c0c0c0;border:1px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset -1px -1px #808080,inset 1px 1px #fff,3px 3px 0 rgba(0,0,0,.35);padding:3px;min-width:200px;max-width:calc(100% - 8px)}
.dg-park-dd button{display:flex;width:100%;align-items:center;gap:6px;background:none;border:0;padding:4px 6px;font:11px Tahoma,sans-serif;cursor:pointer;text-align:left}
.dg-park-dd button:hover,.dg-park-dd button:focus{background:#000080;color:#fff}
.dg-park-dd button span{flex:1}
.dg-park-dd button small{opacity:.8}
.dg-park-dd svg{width:20px;height:20px;flex:none}
.dg-park-bld{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.dg-park-bld .btn{padding:4px 2px;font:bold 11px Tahoma,sans-serif;min-height:30px}
.dg-park-title{position:absolute;inset:0;z-index:20;background:#000;overflow:hidden}
.dg-park-title canvas{position:absolute;left:0;top:0;width:100%;height:100%;image-rendering:pixelated}
.dg-park-logo{position:absolute;left:0;right:0;top:6%;text-align:center;pointer-events:none}
.dg-park-logo .a{font:italic 900 clamp(34px,8.5vw,64px)/1 Impact,"Arial Black",sans-serif;color:#ffd400;-webkit-text-stroke:2px #7a0000;text-shadow:4px 4px 0 #000,0 0 18px rgba(255,120,0,.6);letter-spacing:2px}
.dg-park-logo .b{font:900 clamp(18px,4.6vw,34px)/1.1 "Arial Black",Impact,sans-serif;color:#fff;-webkit-text-stroke:1px #a00;text-shadow:3px 3px 0 #000;letter-spacing:clamp(4px,1.6vw,12px);margin-top:2px}
.dg-park-logo .c{font:bold 11px Arial,sans-serif;color:#cfe;text-shadow:1px 1px 0 #000;margin-bottom:4px;letter-spacing:2px}
.dg-park-tmenu{position:absolute;left:0;right:0;bottom:7%;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:0 8px}
.dg-park-tbtn{width:92px;height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:inset -2px -2px #808080,3px 3px 0 rgba(0,0,0,.5);font:bold 11px Tahoma,sans-serif;color:#000;cursor:pointer;padding:2px}
.dg-park-tbtn:active{border-color:#404040 #fff #fff #404040;box-shadow:inset 2px 2px #808080}
.dg-park-tbtn svg{width:40px;height:40px}
.dg-park-tfoot{position:absolute;right:6px;bottom:4px;font:10px Arial,sans-serif;color:#9ab}
.dg-park-scen{display:flex;gap:6px}
.dg-park-scen .dg-park-list{flex:1;max-height:none}
.dg-park-scen .dg-park-list div.sel{background:#000080;color:#fff}
.dg-park-scen .dg-park-list div.off{color:#808080}
.dg-park-root.ph .dg-park-b{width:35px;height:34px}
.dg-park-root.ph .dg-park-b svg{width:24px;height:24px}
.dg-park-root.ph .dg-park-sep{display:none}
.dg-park-root.ph .dg-park-win{left:4px!important;right:4px!important;width:auto!important;bottom:4px!important;top:auto!important;max-height:52%}
.dg-park-root.ph .dg-park-win.pnl{left:4px!important;right:4px!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;width:auto!important;max-height:90%}
.dg-park-root.ph .dg-park-bld .btn{min-height:38px}
.dg-park-root.ph .dg-park-dd button{padding:8px 6px}
.dg-park-rp{display:inline-flex;align-items:center;gap:2px;white-space:nowrap}
.dg-park-rp svg{flex:none}
.dg-park-gem{display:inline-block;width:7px;height:9px;background:#20b040;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.dg-park-f.goal{cursor:pointer;font-weight:normal;background:#e8f0ff}
.dg-park-f.goal b{color:#000080}
.dg-park-f.wx{display:inline-flex;align-items:center;gap:3px}
.dg-park-f.wx svg{width:14px;height:14px}
.dg-park-pulse{animation:dgpkpulse .9s steps(2) infinite}
@keyframes dgpkpulse{50%{outline:2px solid #ff0;outline-offset:-1px;background:#ffffa0}}
.dg-park-harry{position:absolute;left:6px;bottom:6px;width:268px;max-width:calc(100% - 12px);z-index:3;background:#ffffd8;border:1px solid #000;box-shadow:3px 3px 0 rgba(0,0,0,.4);font:11px/1.35 Tahoma,sans-serif;color:#000;pointer-events:auto}
.dg-park-harry .dph-t{display:flex;align-items:center;gap:4px;background:linear-gradient(90deg,#806000,#c0a020);color:#fff;font-weight:bold;padding:2px 3px 2px 5px}
.dg-park-harry .dph-t span{flex:1}
.dg-park-harry .dph-t button{width:16px;height:14px;padding:0;font:bold 9px Tahoma;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;line-height:10px;cursor:pointer}
.dg-park-harry .dph-b{display:flex;gap:6px;padding:5px 6px 4px}
.dg-park-harry .dph-b svg{flex:none;width:40px;height:44px}
.dg-park-harry .dph-x{flex:1;min-width:0}
.dg-park-harry .dph-x p{margin:0 0 3px}
.dg-park-harry .dph-f{display:flex;gap:4px;justify-content:flex-end;align-items:center;padding:0 6px 5px}
.dg-park-harry .dph-f small{flex:1;color:#806000}
.dg-park-harry .btn{font:11px Tahoma,sans-serif;padding:2px 8px;min-width:0}
.dg-park-harry.ok{animation:dgpkok .5s}
@keyframes dgpkok{0%{background:#a0ffa0}100%{background:#ffffd8}}
.dg-park-harrymin{position:absolute;left:6px;bottom:6px;z-index:3;pointer-events:auto;font:bold 11px Tahoma,sans-serif;padding:3px 8px;background:#ffffd8;border:1px solid #000;box-shadow:2px 2px 0 rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;gap:4px}
.dg-park-harrymin svg{width:16px;height:18px}
.dg-park-root.ph .dg-park-harry{left:4px;right:4px;width:auto;top:4px;bottom:auto}
.dg-park-root.ph .dg-park-harry .dph-b svg{display:none}
.dg-park-root.ph .dg-park-harry .dph-b{padding:3px 5px 2px}
.dg-park-root.ph .dg-park-harry .dph-f{padding:0 5px 3px}
.dg-park-root.ph .dg-park-harrymin{top:4px;bottom:auto;left:auto;right:4px}
.dg-park-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.dg-park-pc button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:2px 1px 1px;min-height:44px;font:10px Tahoma,sans-serif;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;box-shadow:inset -1px -1px #808080;cursor:pointer;color:#000}
.dg-park-pc button:active:not(:disabled){border-color:#404040 #fff #fff #404040;box-shadow:inset 1px 1px #808080}
.dg-park-pc button:disabled{color:#808080;opacity:.75;cursor:default}
.dg-park-pc button:disabled svg{opacity:.4}
.dg-park-pc button svg{width:26px;height:20px;display:block}
.dg-park-pc button small{font-size:9px;color:#404040}
.dg-park-pc button.big{grid-column:span 2;flex-direction:row;justify-content:center;gap:5px;font-weight:bold;min-height:30px}
.dg-park-rt{display:grid;grid-template-columns:auto 1fr auto;gap:2px 5px;align-items:center;margin:4px 0}
.dg-park-rt .dg-park-bar2{max-width:none}
.dg-park-rt i.y{background:#c0a000}.dg-park-rt i.o{background:#e06000}
.dg-park-graph{display:block;width:100%;height:64px;background:#000;border:1px solid;border-color:#808080 #fff #fff #808080;margin:4px 0}
.dg-park-note{font-size:10px;color:#404040;margin:3px 0}
.dg-park-visit{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:3px 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font:11px Tahoma,sans-serif;pointer-events:auto}
.dg-park-visit b{font-size:12px}
.dg-park-visit .dsc-rate{background:#c0c0c0;color:#000;padding:0 4px;border:1px solid;border-color:#808080 #fff #fff #808080}
.dg-park-visit .dsc-sb{min-height:22px;font-size:16px}
.dg-park-visit .btn{font:bold 11px Tahoma,sans-serif;padding:3px 10px;min-width:0;margin-left:auto}
.dg-park-end{position:absolute;inset:0;z-index:25;background:rgba(0,0,40,.6);display:flex;align-items:center;justify-content:center;padding:8px}
.dg-park-end .dg-park-win{position:relative;width:360px}
.dg-park-end .big{display:flex;gap:10px;align-items:center}
.dg-park-end .big svg{flex:none;width:64px;height:64px}
.dg-park-end h3{margin:0 0 4px;font:bold 15px Arial,sans-serif;color:#000080}
.dg-park-tbtn.net{background:#c0d0ff}
.dg-park-scen .dg-park-list div .tr{color:#c08000;font-weight:bold}
.dg-park-tag{display:inline-block;padding:0 4px;border:1px solid #808080;font-size:10px;margin-left:4px;background:#fff}
`;

  // ================================================================ toolbar icons (20x20 SVG)
  const SV = s => `<svg viewBox="0 0 20 20">${s}</svg>`;
  const IC = {
    look: SV('<path d="M5 2l10 9-5 .5 3 6-2 1-3-6-3 3z" fill="#fff" stroke="#000"/>'),
    path: SV('<path d="M10 3l8 4-8 4-8-4z" fill="#b8a888" stroke="#5a4a2a"/><path d="M10 9l8 4-8 4-8-4z" fill="#a89878" stroke="#5a4a2a"/>'),
    queue: SV('<path d="M10 5l8 4-8 4-8-4z" fill="#7088c0" stroke="#203060"/><path d="M3 9v-4M7 11v-4M13 11v-4M17 9v-4" stroke="#000" stroke-width="1.4"/><path d="M3 5l4 2M13 7l4-2" stroke="#e02020"/>'),
    ride: SV('<path d="M10 2l7 6H3z" fill="#e02020" stroke="#600"/><path d="M5 8l2-4M15 8l-2-4" stroke="#ff0"/><rect x="4" y="8" width="12" height="2" fill="#ffd400" stroke="#000" stroke-width=".6"/><path d="M6 10v6M10 10v6M14 10v6" stroke="#666"/><ellipse cx="10" cy="17" rx="8" ry="2.4" fill="#b08040" stroke="#000" stroke-width=".7"/><circle cx="6" cy="13" r="1.6" fill="#e02020"/><circle cx="14" cy="12" r="1.6" fill="#e02020"/>'),
    stall: SV('<path d="M3 7h14v10H3z" fill="#f0e0c0" stroke="#000"/><path d="M2 7l2-4h12l2 4z" fill="#e02020" stroke="#000"/><path d="M5 3l-1 4M9 3v4M13 3l1 4" stroke="#fff"/><rect x="5" y="9" width="10" height="4" fill="#402010"/><ellipse cx="10" cy="11" rx="3" ry="1.6" fill="#c08030"/>'),
    scen: SV('<rect x="9" y="13" width="2" height="5" fill="#6a3a10"/><path d="M10 1l6 8h-3l4 5H3l4-5H4z" fill="#1a7a2a" stroke="#0a3a10"/>'),
    coaster: SV('<path d="M1 16c3 0 3-12 7-12s3 10 6 10 3-6 5-6" fill="none" stroke="#e02020" stroke-width="2"/><path d="M4 16v-6M8 16V4M12 16v-3M16 16v-7" stroke="#808080"/><rect x="6" y="2" width="4" height="3" fill="#2050e0" stroke="#000" stroke-width=".6"/>'),
    staff: SV('<circle cx="10" cy="6" r="3.6" fill="#e0b088" stroke="#000"/><path d="M6 4h8l-1-2H7z" fill="#2050e0" stroke="#000" stroke-width=".6"/><rect x="6" y="10" width="8" height="7" fill="#2050e0" stroke="#000"/><path d="M15 4l3 14" stroke="#8a5a2a" stroke-width="1.6"/><path d="M16 17h4" stroke="#d0b060" stroke-width="2"/>'),
    bull: SV('<rect x="2" y="9" width="12" height="6" fill="#ffd400" stroke="#000"/><rect x="5" y="5" width="6" height="4" fill="#9ad" stroke="#000"/><path d="M14 10l4-2v8l-4-1z" fill="#808080" stroke="#000"/><circle cx="5" cy="16" r="2" fill="#333"/><circle cx="11" cy="16" r="2" fill="#333"/>'),
    park: SV('<rect x="2" y="6" width="3" height="12" fill="#c0c0c0" stroke="#000"/><rect x="15" y="6" width="3" height="12" fill="#c0c0c0" stroke="#000"/><rect x="1" y="3" width="18" height="5" fill="#e02020" stroke="#000"/><path d="M4 5.5h12" stroke="#ff0" stroke-dasharray="2 1"/><path d="M5 18h10" stroke="#a89878" stroke-width="3"/>'),
    fin: SV('<rect x="2" y="4" width="16" height="12" fill="#f8f8e8" stroke="#000"/><path d="M10 5.5l3.5 2.2v4.6L10 14.5l-3.5-2.2V7.7z" fill="#20b040" stroke="#004010" stroke-width=".8"/><path d="M10 5.5v9M6.5 7.7l7 4.6" stroke="#80f0a0" stroke-width=".6"/>'),
    guests: SV('<circle cx="7" cy="5" r="2.4" fill="#f0c8a0" stroke="#000" stroke-width=".7"/><rect x="5" y="8" width="4" height="6" fill="#e02020" stroke="#000" stroke-width=".7"/><path d="M6 14v4M8 14v4" stroke="#204" stroke-width="1.4"/><circle cx="14" cy="6" r="2.4" fill="#c08860" stroke="#000" stroke-width=".7"/><rect x="12" y="9" width="4" height="6" fill="#2050e0" stroke="#000" stroke-width=".7"/><path d="M13 15v3M15 15v3" stroke="#204" stroke-width="1.4"/><path d="M17 2v6" stroke="#000" stroke-width=".5"/><circle cx="17" cy="2" r="2" fill="#ffd400"/>'),
    msgs: SV('<rect x="2" y="3" width="16" height="11" rx="2" fill="#ffffd8" stroke="#000"/><path d="M6 14l-2 4 6-4" fill="#ffffd8" stroke="#000"/><path d="M5 7h10M5 10h7" stroke="#000080"/>'),
    pause: SV('<rect x="5" y="4" width="3.5" height="12" fill="#000"/><rect x="11.5" y="4" width="3.5" height="12" fill="#000"/>'),
    zoom: SV('<circle cx="8" cy="8" r="5" fill="#cfe8ff" stroke="#000" stroke-width="1.4"/><path d="M12 12l6 6" stroke="#000" stroke-width="2.4"/><path d="M5.5 8h5M8 5.5v5" stroke="#000"/>'),
    sf: n => SV(`<path d="M3 4l${n === 1 ? 10 : 6} 6-${n === 1 ? 10 : 6} 6z" fill="#000"/>${n > 1 ? '<path d="M9 4l6 6-6 6z" fill="#000"/>' : ''}${n > 2 ? '<path d="M14 4l5 6-5 6z" fill="#000" transform="translate(-1 0)"/>' : ''}`),
    new: SV('<path d="M2 16l16-8" stroke="#808080"/><path d="M1 15c3 0 4-11 8-11s3 8 6 8 3-4 4-4" fill="none" stroke="#e02020" stroke-width="2"/><circle cx="15" cy="5" r="3" fill="#ffd400" stroke="#000"/>'),
    load: SV('<rect x="3" y="3" width="14" height="14" fill="#202060" stroke="#000"/><rect x="6" y="3" width="8" height="5" fill="#c0c0c0" stroke="#000"/><rect x="5" y="11" width="10" height="6" fill="#fff" stroke="#000"/><path d="M7 13h6M7 15h4" stroke="#000"/>'),
    help: SV('<circle cx="10" cy="10" r="8" fill="#ffd400" stroke="#000"/><text x="10" y="15" text-anchor="middle" font-family="Times New Roman,serif" font-size="13" font-weight="bold">?</text>'),
    quit: SV('<rect x="4" y="2" width="9" height="16" fill="#8a5a2a" stroke="#000"/><path d="M13 2l4 2v14l-4 -0z" fill="#5a3a1a" stroke="#000"/><circle cx="11" cy="10" r="1" fill="#ffd400"/>'),
    undo: SV('<path d="M5 8h8a4 4 0 0 1 0 8H8" fill="none" stroke="#000" stroke-width="2.2"/><path d="M1 8l5-5v10z" fill="#000"/>'),
    net: SV('<circle cx="10" cy="10" r="8" fill="#2a70e0" stroke="#000"/><path d="M4 6c3 1 2 4 5 4s2 3 0 5M12 3c-1 2 1 3 3 3s2 3 1 5" fill="none" stroke="#40c040" stroke-width="2"/><path d="M2 10h16M10 2c-4 4-4 12 0 16M10 2c4 4 4 12 0 16" fill="none" stroke="#fff" stroke-width=".6"/>'),
  };
  // Handyman Harry (flat cap, moustache, broom)
  const HARRY = '<svg viewBox="0 0 40 44"><rect x="0" y="0" width="40" height="44" fill="#9ad0ff"/><rect x="0" y="34" width="40" height="10" fill="#4a9c2c"/><path d="M33 6l-4 34" stroke="#8a5a2a" stroke-width="2"/><path d="M26 38l7 4 3-6z" fill="#d0b060" stroke="#806020" stroke-width=".6"/><rect x="11" y="27" width="18" height="17" fill="#2050e0" stroke="#000"/><rect x="15" y="27" width="10" height="5" fill="#fff"/><circle cx="20" cy="18" r="9" fill="#f0c8a0" stroke="#000"/><path d="M10 13c2-6 18-6 20 0l3 1H8z" fill="#5a4a3a" stroke="#000"/><rect x="15" y="16" width="2" height="2" fill="#000"/><rect x="23" y="16" width="2" height="2" fill="#000"/><path d="M14 22c2-2 4-1 6-1s4-1 6 1c-2 1-4 0-6 0s-4 1-6 0z" fill="#806040" stroke="#402010" stroke-width=".5"/><path d="M17 25h6" stroke="#802020"/><rect x="28" y="30" width="4" height="4" fill="#f0c8a0" stroke="#000" stroke-width=".6"/></svg>';
  // weather icons (14x14)
  const WXI = {
    sun: '<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r="3.2" fill="#ffd400" stroke="#a07000" stroke-width=".7"/><path d="M7 0v2.2M7 11.8V14M0 7h2.2M11.8 7H14M2 2l1.5 1.5M10.5 10.5L12 12M2 12l1.5-1.5M10.5 3.5L12 2" stroke="#e0a000"/></svg>',
    cloud: '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M3 11h8a2.6 2.6 0 0 0 0-5.2A3.6 3.6 0 0 0 4 5.4 2.8 2.8 0 0 0 3 11z" fill="#e0e0e8" stroke="#606070" stroke-width=".8"/></svg>',
    rain: '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M3 8h8a2.4 2.4 0 0 0 0-4.8A3.4 3.4 0 0 0 4 3 2.5 2.5 0 0 0 3 8z" fill="#a0a8b8" stroke="#404050" stroke-width=".8"/><path d="M4 10l-1 3M7 10l-1 3M10 10l-1 3" stroke="#2050e0" stroke-width="1.2"/></svg>',
    hot: '<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r="4" fill="#ff6000" stroke="#a02000" stroke-width=".7"/><path d="M7 0v2M7 12v2M0 7h2M12 7h2M2 2l1.4 1.4M10.6 10.6L12 12M2 12l1.4-1.4M10.6 3.4L12 2" stroke="#ff2000" stroke-width="1.2"/></svg>',
  };
  // coaster piece pictures for the construction window (26x20)
  const PV = s => `<svg viewBox="0 0 26 20">${s}</svg>`;
  const PIC = {
    l: PV('<path d="M13 19v-6a6 6 0 0 0-6-6H2" fill="none" stroke="#e02020" stroke-width="3"/><path d="M5 3L1 7l4 4" fill="none" stroke="#000" stroke-width="1.4"/>'),
    s: PV('<path d="M13 19V2" stroke="#e02020" stroke-width="3"/><path d="M9 6l4-4 4 4" fill="none" stroke="#000" stroke-width="1.4"/>'),
    r: PV('<path d="M13 19v-6a6 6 0 0 1 6-6h5" fill="none" stroke="#e02020" stroke-width="3"/><path d="M21 3l4 4-4 4" fill="none" stroke="#000" stroke-width="1.4"/>'),
    u: PV('<path d="M2 17h6l10-12h6" fill="none" stroke="#e02020" stroke-width="3"/><path d="M8 17v2M18 5v14" stroke="#909098"/>'),
    dn: PV('<path d="M2 5h6l10 12h6" fill="none" stroke="#e02020" stroke-width="3"/><path d="M8 5v14M18 17v2" stroke="#909098"/>'),
    dd: PV('<path d="M2 2h7l6 16h9" fill="none" stroke="#e02020" stroke-width="3"/><path d="M9 2v17" stroke="#909098"/><path d="M19 9l-4 4M22 11l-3 3" stroke="#2050e0"/>'),
    ch: PV('<path d="M2 17h6l10-12h6" fill="none" stroke="#e02020" stroke-width="3"/><path d="M9 15l2-2.4M12 11.5l2-2.4M15 8l2-2.4" stroke="#202020" stroke-width="2"/><path d="M8 17v2M18 5v14" stroke="#909098"/>'),
    lp: PV('<path d="M1 18h9c6 0 8-4 8-8a5 5 0 0 0-10 0c0 4 2 8 8 8h9" fill="none" stroke="#e02020" stroke-width="2.6"/>'),
    undo: PV('<path d="M8 8h9a4.5 4.5 0 0 1 0 9h-6" fill="none" stroke="#000" stroke-width="2.4"/><path d="M3 8l6-5v10z" fill="#000"/>'),
    fin: PV('<path d="M3 16c0-8 4-12 10-12s10 4 10 12" fill="none" stroke="#e02020" stroke-width="2.6" stroke-dasharray="3 2"/><rect x="1" y="14" width="7" height="4" fill="#c0c0c0" stroke="#000"/><path d="M18 3l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#ffd400" stroke="#000" stroke-width=".6"/>'),
    test: PV('<path d="M1 16c4 0 5-12 9-12s4 10 8 10 4-6 7-6" fill="none" stroke="#e02020" stroke-width="2"/><rect x="7" y="2" width="6" height="4" fill="#2050e0" stroke="#000" stroke-width=".7"/><path d="M15 2h3M16 5h4" stroke="#000"/>'),
  };

  D.mod('park', (G, arg) => {
    G.css('dg-css-park', CSS);
    const host = G.host;
    const root = document.createElement('div'); root.className = 'dg-park-root' + (G.phone ? ' ph' : '');
    host.appendChild(root);
    const opts = Object.assign({ music: false, bubbles: true }, G.load('opts', {}));
    const saveOpts = () => G.save('opts', opts);
    if (window.Sound && Sound.addTune) Sound.addTune('rsquig', { step: 0.14, hats: true,
      lead: [72, 0, 76, 79, -1, 76, 74, 0, 77, 81, -1, 77, 76, 0, 79, 84, -1, 79, 77, 76, 74, 72, -1, 0,
        69, 0, 72, 76, -1, 72, 71, 0, 74, 77, -1, 74, 72, 74, 76, 77, 79, 81, 79, -1, 0, 72, -1, 0],
      bass: [48, 55, 52, 50, 53, 57, 52, 55, 48, 55, 53, 50, 45, 52, 48, 47, 50, 55, 48, 52, 55, 50, 48, 48] });

    let S = null; // the park
    let ui = null; // the game UI (built in startGame)
    let title = null;
    let V = null; // visiting somebody's park off JackNet: { name, title, entry }
    let home = null; // your own park, put to one side while you visit
    const undoL = []; let ugrp = 1; // build undo: [{ g, t: 'path'|'furn'|'obj', ... }]
    const FX = []; // floating numbers: { x, y, z, txt, col, t }
    const fx = (x, y, txt, col, z) => { FX.push({ x, y, z: z || 0, txt, col: col || '#ffd400', t: 0 }); if (FX.length > 40) FX.shift(); };

    // ================================================================ state
    function blankFin() { return { entry: 0, rides: 0, food: 0, shop: 0, build: 0, wages: 0, upkeep: 0, interest: 0, ads: 0 }; }
    function newState(si, seedPlus) {
      const sc = SCENARIOS[si];
      const R = rng(sc.seed * 1000 + (seedPlus == null ? Math.floor(Math.random() * 1000) : seedPlus));
      const S0 = { v: 1, si, ground: new Array(NN).fill(0), path: new Array(NN).fill(0), litter: new Array(NN).fill(0), furn: new Array(NN).fill(0), obj: new Array(NN).fill(0),
        objs: {}, nid: 1, guests: [], staff: [], gnum: 100 + Math.floor(R() * 80), gid: 1, money: sc.money, loan: sc.loan, fee: 4, open: false, day: 0, rating: 550,
        fin: blankFin(), hist: [], news: [], named: {}, best: 0, result: '', speed: 1, cnames: 0, time: 0, built: 0, _rev: 1, _gdirty: true,
        pname: sc.n + (/Park|Land|Sands|Valley/.test(sc.n) ? '' : ' Park'), wx: { k: sc.wet ? 'rain' : 'sun', d: 3 }, ads: null, debtM: 0, bestProfit: 0, loops: 0 };
      // a lake
      const [lx, ly, lr] = sc.lake;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const d = Math.hypot(x - lx, (y - ly) * 1.15) + (hash(x, y + sc.seed) - 0.5) * 1.6;
        if (d < lr) S0.ground[y * N + x] = 1;
      }
      // the path in from the gate
      for (let y = 17; y < N; y++) S0.path[y * N + ENTX] = 1;
      for (let x = 7; x <= 15; x++) S0.path[17 * N + x] = 1;
      for (let i = 0; i < NN; i++) if (S0.path[i]) S0.ground[i] = 0;
      // trees
      let tries = 0, made = 0;
      while (made < sc.trees && tries++ < 2000) {
        const x = Math.floor(R() * N), y = Math.floor(R() * N), i = y * N + x;
        if (S0.ground[i] || S0.path[i] || S0.obj[i]) continue;
        if (Math.abs(x - ENTX) < 5 && y > 14) continue;
        const id = S0.nid++; S0.objs[id] = { id, k: 'scen', type: sc.palms && R() < 0.7 ? 'palm' : R() < 0.6 ? 'pine' : 'oak', x, y, w: 1 }; S0.obj[i] = id; made++;
      }
      return S0;
    }

    // older saves (before the weather, Harry and Rupees): fill in anything that's missing
    function fixup(st) {
      const sc = SCENARIOS[st.si] || SCENARIOS[0];
      if (!st.pname) st.pname = sc.n + (/Park|Land|Sands|Valley/.test(sc.n) ? '' : ' Park');
      if (!st.wx || !WX[st.wx.k]) st.wx = { k: 'sun', d: 3 };
      if (st.debtM == null) st.debtM = 0;
      if (st.bestProfit == null) st.bestProfit = 0;
      if (st.loops == null) st.loops = 0;
      if (!st.fin) st.fin = blankFin();
      ['entry', 'rides', 'food', 'shop', 'build', 'wages', 'upkeep', 'interest', 'ads'].forEach(k => { if (st.fin[k] == null) st.fin[k] = 0; });
      st.v = 2;
      return st;
    }

    // ================================================================ game screen
    // the objective, in words
    const DEADLINE = 'the end of October, Year 1';
    function objText(sc, cap) {
      const o = sc.obj; let t;
      if (o.profit) t = `make a profit of at least ${money(o.profit)} in a single month`;
      else if (o.coaster) t = `build a rollercoaster with an excitement rating of at least ${o.coaster.toFixed(2)}, and have ${o.guests} guests in your park`;
      else t = `have at least ${o.guests} guests in your park, with a park rating of at least ${o.rating}`;
      t += ` by ${DEADLINE}`;
      return cap ? t[0].toUpperCase() + t.slice(1) + '.' : t;
    }
    // how the objective is going: [{ n, have, want, ok }]
    function objProgress() {
      const o = SCENARIOS[S.si].obj, out = [];
      if (o.guests) out.push({ n: 'guests', have: S.guests.length, want: o.guests });
      if (o.rating) out.push({ n: 'rating', have: S.rating, want: o.rating });
      if (o.coaster) out.push({ n: 'best coaster', have: +S.best.toFixed(2), want: o.coaster });
      if (o.profit) out.push({ n: 'best month', have: rup(S.bestProfit), want: rup(o.profit), rp: 1 });
      out.forEach(p => { p.ok = p.have >= p.want; });
      return out;
    }
    const monthsLeft = () => Math.max(0, 8 - Math.floor(S.day / 30));

    function startGame(state) {
      if (title) { title.close(); title = null; }
      S = fixup(state); S._rev = 1; S._gdirty = true; linkRev = -1; rebuildGM(); crowdDone = S.guests.length >= 50; undoL.length = 0; FX.length = 0;
      S.guests.forEach(g => { g.hidden = g.st === 'ride'; });
      if (ui) ui.destroy();
      ui = buildUI();
      if (opts.music) G.music('rsquig'); else G.stopMusic();
      buildMenu();
      if (V) G.status(`Visiting ${V.title} by ${V.name}. Look around, click guests to read their minds, then rate it!`);
      else G.status(`${SCENARIOS[S.si].n}: ` + objText(SCENARIOS[S.si]) + (G.demo ? ' (DEMO: one month only)' : ''));
      if (!V) harry.start();
    }

    // ---------------------------------------------------------------- helpers on the park
    const inB = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
    const free = i => !S.ground[i] && !S.path[i] && !S.obj[i];
    // free, or only a tree/flower bed in the way (building there clears it)
    const clearable = i => !S.ground[i] && !S.path[i] && (!S.obj[i] || (S.objs[S.obj[i]] && S.objs[S.obj[i]].k === 'scen'));
    function clearScen(i) { const o = S.objs[S.obj[i]]; if (o && o.k === 'scen') { delete S.objs[o.id]; S.obj[i] = 0; S._rev++; } }
    function fin(k, v) { S.fin[k] = (S.fin[k] || 0) + v; S.money += (k === 'build' || k === 'wages' || k === 'upkeep' || k === 'interest' || k === 'ads') ? -v : v; }
    function news(t, loc, quiet) {
      S.news.unshift({ t, d: dateStr(), loc: loc == null ? -1 : loc });
      if (S.news.length > 30) S.news.length = 30;
      if (ui) ui.showNews();
      if (!quiet) G.sfx('join');
    }
    const dayStr = d => `${ord(Math.floor(d % 30) + 1)} of ${MONTHS[Math.floor(d / 30) % 8]}`;
    const ADS = { leaf: { n: 'leaf', label: 'Leaflets', cost: 250, days: 30, boost: 1.4, d: 'Hand out leaflets at the bus stop: 40% more guests for a month' }, mag: { n: 'mag', label: 'JACK ATTACK! magazine advert', cost: 900, days: 60, boost: 2, d: 'A full-page advert in JACK ATTACK!: twice as many guests for two months' } };
    function dateStr() { const m = Math.floor(S.day / 30), y = Math.floor(m / 8) + 1; return `${ord(Math.floor(S.day % 30) + 1)} ${MONTHS[m % 8]}, Year ${y}`; }
    const rideName = t => { const base = RIDES[t].n; let k = 1; while (Object.values(S.objs).some(o => o.name === base + ' ' + k)) k++; return base + ' ' + k; };

    // links between rides/stalls and the paths next to them (cached until something is built)
    let linkRev = -1;
    const qOwner = new Int32Array(NN);
    function footprint(o) {
      if (o.k === 'coaster') return o.pieces.filter(p => p.t === 'st').map(p => p.y * N + p.x);
      const out = []; for (let y = 0; y < o.w; y++) for (let x = 0; x < o.w; x++) out.push((o.y + y) * N + o.x + x); return out;
    }
    function links() {
      if (linkRev === S._rev) return;
      linkRev = S._rev; qOwner.fill(0);
      for (const o of Object.values(S.objs)) {
        if (o.k === 'scen') continue;
        const fp = new Set(footprint(o)), adj = new Set();
        fp.forEach(i => { const x = i % N, y = (i / N) | 0; for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (inB(nx, ny) && !fp.has(ny * N + nx)) adj.add(ny * N + nx); } });
        const aq = [...adj].filter(i => S.path[i] === 2), ap = [...adj].filter(i => S.path[i] === 1);
        const line = []; const seen = new Set(aq);
        if (o.k !== 'stall') {
          const q = aq.slice();
          while (q.length) { const i = q.shift(); if (qOwner[i] && qOwner[i] !== o.id) continue; qOwner[i] = o.id; line.push(i); const x = i % N, y = (i / N) | 0; for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d], j = ny * N + nx; if (inB(nx, ny) && S.path[j] === 2 && !seen.has(j)) { seen.add(j); q.push(j); } } }
        }
        o._ent = o.k === 'stall' ? ap : (aq.length ? aq : ap);
        o._exit = ap.length ? ap : aq;
        o._line = line.length ? line : o._ent.slice(0, 1);
        o._q = new Set(line);
      }
    }

    // BFS over the path network: the first step from `from` towards the nearest tile where goal(i) is true
    const prev = new Int32Array(NN), bq = new Int32Array(NN);
    function bfs(from, goal, pass) {
      if (goal(from)) return -2;
      prev.fill(-1); prev[from] = from; let h = 0, t = 0; bq[t++] = from;
      while (h < t) {
        const i = bq[h++], x = i % N, y = (i / N) | 0;
        for (let d = 0; d < 4; d++) {
          const nx = x + DX[d], ny = y + DY[d]; if (!inB(nx, ny)) continue;
          const j = ny * N + nx; if (prev[j] !== -1 || !pass(j)) continue;
          prev[j] = i;
          if (goal(j)) { let k = j; while (prev[k] !== from) k = prev[k]; return k; }
          bq[t++] = j;
        }
      }
      return -1;
    }

    // ---------------------------------------------------------------- building
    function canAfford(c) { if (S.money >= c) return true; ui.hint('Not enough cash - requires ' + money(c), 1); G.sfx('beep'); return false; }
    function build(tool, x, y, quiet) {
      if (!inB(x, y) || V) return false;
      const i = y * N + x;
      const [kind, type] = tool.split(':');
      if (kind === 'path' || kind === 'queue') {
        const v = kind === 'path' ? 1 : 2;
        if (S.ground[i] || (S.obj[i] && !clearable(i)) || S.path[i] === v || i === ENT) return false;
        const c = v === 1 ? 10 : 12; if (!canAfford(c)) return false;
        clearScen(i);
        if (quiet !== true) undoL.push({ g: ugrp, t: 'path', i, prev: S.path[i], furn: S.furn[i], v, c });
        S.path[i] = v; if (v === 2) S.furn[i] = 0; fin('build', c); S._rev++; S._gdirty = true; if (quiet !== true) fx(x + 0.5, y + 0.5, '-' + rup(c), '#ff8080'); if (!quiet) G.sfx('click'); return true;
      }
      if (kind === 'ride' || kind === 'stall') {
        const def = kind === 'ride' ? RIDES[type] : STALLS[type], w = def.w || 1;
        for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) if (!inB(x + xx, y + yy) || !clearable((y + yy) * N + x + xx)) { if (!quiet) { ui.hint('Can\'t build this here! It needs clear grass (trees get chopped down for you).', 1); G.sfx('beep'); } return false; }
        if (!canAfford(def.cost)) return false;
        for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) clearScen((y + yy) * N + x + xx);
        const id = S.nid++;
        const o = kind === 'ride' ? { id, k: 'ride', type, x, y, w, name: rideName(type), price: def.price, open: false, st: 'wait', t: 0, waiting: [], riders: [], total: 0, income: 0, cycles: 0, rot: 0 }
          : { id, k: 'stall', type, x, y, w: 1, name: def.n, price: def.price, sold: 0, income: 0 };
        S.objs[id] = o;
        for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) S.obj[(y + yy) * N + x + xx] = id;
        fin('build', def.cost); S._rev++; S.built++;
        if (quiet !== true) { undoL.push({ g: ugrp, t: 'obj', id, c: def.cost }); fx(x + w / 2, y + w / 2, '-' + rup(def.cost).toLocaleString('en-GB'), '#ff8080', 1); }
        if (!quiet) { G.sfx('thud'); ui.puff(x, y, w); if (!G.phone) ui.openObj(o); else ui.sel = o.id; if (kind === 'ride') ui.hint('Built! Now lay a queue line from a path up to it, then click it and press Open ride.', 0); }
        return true;
      }
      if (kind === 'scen') {
        const def = SCEN[type];
        if (def.path) {
          if (S.path[i] !== 1 || i === ENT || S.furn[i] === FURN[type]) return false;
          if (!canAfford(def.cost)) return false;
          if (quiet !== true) { undoL.push({ g: ugrp, t: 'furn', i, prev: S.furn[i], v: FURN[type], c: def.cost }); fx(x + 0.5, y + 0.5, '-' + rup(def.cost), '#ff8080'); }
          S.furn[i] = FURN[type]; fin('build', def.cost); if (!quiet) G.sfx('click'); return true;
        }
        if (!free(i)) { if (!quiet) { ui.hint('Can\'t put that here: it needs a clear patch of grass.', 1); G.sfx('beep'); } return false; }
        if (!canAfford(def.cost)) return false;
        const id = S.nid++; S.objs[id] = { id, k: 'scen', type, x, y, w: 1 }; S.obj[i] = id; fin('build', def.cost);
        if (quiet !== true) { undoL.push({ g: ugrp, t: 'obj', id, c: def.cost }); fx(x + 0.5, y + 0.5, '-' + rup(def.cost), '#ff8080'); }
        if (!quiet) G.sfx('click'); return true;
      }
      if (kind === 'bull') return demolish(i, quiet);
      return false;
    }
    // undo the last thing you built (a whole drag of path counts as one), with a full refund
    function undoBuild() {
      if (!undoL.length) { ui.hint('Nothing to undo.', 1); G.sfx('beep'); return false; }
      const g = undoL[undoL.length - 1].g; let back = 0, n = 0;
      while (undoL.length && undoL[undoL.length - 1].g === g) {
        const u = undoL.pop();
        if (u.t === 'path') { if (S.path[u.i] !== u.v || S.obj[u.i]) continue; S.path[u.i] = u.prev; S.furn[u.i] = u.prev ? u.furn : 0; if (!u.prev) S.litter[u.i] = 0; S._rev++; S._gdirty = true; }
        else if (u.t === 'furn') { if (S.furn[u.i] !== u.v) continue; S.furn[u.i] = u.prev; }
        else { const o = S.objs[u.id]; if (!o || (o.riders && o.riders.length)) continue; removeObj(o); }
        fin('build', -u.c); back += u.c; n++;
      }
      if (!n) { ui.hint('Can\'t undo that any more (something has changed).', 1); G.sfx('beep'); return false; }
      ui.hint(`Undone! ${money(back)} back in the bank.`, 0); G.sfx('turn');
      return true;
    }
    function demolish(i, quiet) {
      if (i === ENT || V) return false;
      if (S.furn[i]) { S.furn[i] = 0; if (!quiet) G.sfx('thud'); return true; }
      const id = S.obj[i];
      if (id) {
        const o = S.objs[id];
        if (o.k === 'coaster' || o.k === 'ride' || o.k === 'stall') {
          if (quiet === 'drag') return false; // big things need a tap
          const ref = o.k === 'coaster' ? Math.round(o.pieces.length * 25) : Math.round((o.k === 'ride' ? RIDES[o.type].cost : STALLS[o.type].cost) * 0.5);
          G.msg('Demolish', `Demolish ${o.name}?\n\nYou'll get ${money(ref)} back.`, 'q', [['Yes', () => { removeObj(o); S.money += ref; G.sfx('thud'); }], ['No']]);
          return false;
        }
        removeObj(o); if (!quiet || quiet === 'drag') G.sfx('thud'); return true;
      }
      if (S.path[i]) { S.path[i] = 0; S.litter[i] = 0; S.furn[i] = 0; S._rev++; S._gdirty = true; if (!quiet || quiet === 'drag') G.sfx('thud'); return true; }
      return false;
    }
    function removeObj(o) {
      if (o.waiting) [...o.waiting, ...o.riders].forEach(gid => { const g = gById(gid); if (g) { g.st = 'walk'; g.goal = null; g.hidden = false; g.ti = ENT; g.x = g.tx = ENTX + 0.5; g.y = g.ty = ENTY + 0.5; } });
      footprint(o).forEach(() => {});
      for (let i = 0; i < NN; i++) if (S.obj[i] === o.id) S.obj[i] = 0;
      delete S.objs[o.id]; S._rev++;
      if (S.build === o.id) S.build = 0;
      if (ui) ui.closeWin('o' + o.id);
    }

    // ---------------------------------------------------------------- the coaster
    // a loop: forwards, up and over (backwards at the top), down and out, with a little sideways shuffle so it clears itself
    const LOOPR = 0.42, LOOPH = 1.55;
    let LOOPLEN = 0;
    function pieceLen(p) {
      if (p.t === 'l' || p.t === 'r') return Math.PI / 4;
      if (p.t === 'lp') return LOOPLEN;
      return p.h !== p.h2 ? Math.hypot(1, 0.5 * (p.h2 - p.h)) : 1;
    }
    function piecePoint(p, f, out) {
      const cx = p.x + 0.5, cy = p.y + 0.5;
      if (p.t === 'l' || p.t === 'r') {
        const a = f * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
        const ox = cx - 0.5 * DX[p.d] + 0.5 * DX[p.nd], oy = cy - 0.5 * DY[p.d] + 0.5 * DY[p.nd];
        out.x = ox + 0.5 * (-c * DX[p.nd] + s * DX[p.d]); out.y = oy + 0.5 * (-c * DY[p.nd] + s * DY[p.d]);
        out.tx = c * DX[p.d] + s * DX[p.nd]; out.ty = c * DY[p.d] + s * DY[p.nd];
        out.z = p.h + (p.h2 - p.h) * f;
      } else if (p.t === 'lp') {
        const a = f * TAU, al = 0.9 * (f - 0.5) + LOOPR * Math.sin(a), sd = 0.16 * Math.sin(Math.PI * f), da = 0.9 + LOOPR * TAU * Math.cos(a);
        out.x = cx + al * DX[p.d] - sd * DY[p.d]; out.y = cy + al * DY[p.d] + sd * DX[p.d];
        out.tx = DX[p.d] * Math.sign(da || 1); out.ty = DY[p.d] * Math.sign(da || 1);
        out.z = p.h + LOOPH * (1 - Math.cos(a)); out.inv = Math.cos(a) < 0;
        return out;
      } else {
        out.x = cx + (f - 0.5) * DX[p.d]; out.y = cy + (f - 0.5) * DY[p.d]; out.tx = DX[p.d]; out.ty = DY[p.d];
        out.z = p.h + (p.h2 - p.h) * f;
      }
      out.inv = false;
      return out;
    }
    { const q = { x: 0, y: 0, z: 0 }, p = { x: 0, y: 0, d: 0, h: 0, h2: 0, t: 'lp' }; let lx = 0, ly = 0, lz = 0; for (let k = 0; k <= 64; k++) { piecePoint(p, k / 64, q); if (k) LOOPLEN += Math.hypot(q.x - lx, q.y - ly, 0.5 * (q.z - lz)); lx = q.x; ly = q.y; lz = q.z; } }
    function trackPrep(co) {
      if (co._len && co._rev === co.pieces.length) return;
      co._rev = co.pieces.length; let s = 0;
      co._starts = co.pieces.map(p => { const a = s; s += pieceLen(p); return a; });
      co._len = s;
    }
    const tmpP = { x: 0, y: 0, z: 0, tx: 0, ty: 0 };
    function trackAt(co, s, out) {
      trackPrep(co); const L = co._len; s = ((s % L) + L) % L;
      let lo = 0, hi = co.pieces.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (co._starts[m] <= s) lo = m; else hi = m - 1; }
      const p = co.pieces[lo]; piecePoint(p, (s - co._starts[lo]) / pieceLen(p), out); out.pi = lo; return out;
    }
    function nextSpot(co) {
      const p = co.pieces[co.pieces.length - 1];
      return { x: p.x + DX[p.nd], y: p.y + DY[p.nd], d: p.nd, h: p.h2 };
    }
    function isClosed(co) { const n = nextSpot(co), s = co.pieces[0]; return n.x === s.x && n.y === s.y && n.d === s.d && n.h === 0; }
    function startCoaster(x, y, d) {
      const cost = 3 * 80;
      for (let k = 0; k < 3; k++) { const xx = x + DX[d] * k, yy = y + DY[d] * k; if (!inB(xx, yy) || !clearable(yy * N + xx)) { ui.hint('Not enough room for the station here (it needs 3 tiles of grass in a row).', 1); G.sfx('beep'); return null; } }
      if (!canAfford(cost)) return null;
      for (let k = 0; k < 3; k++) clearScen((y + DY[d] * k) * N + x + DX[d] * k);
      const id = S.nid++;
      const co = { id, k: 'coaster', name: COASTER_NAMES[S.cnames++ % COASTER_NAMES.length], pieces: [], price: 2.0, open: false, st: 'build', t: 0, waiting: [], riders: [], total: 0, income: 0, cycles: 0, rate: null, prof: null, byPlayer: true, rt: 0 };
      for (let k = 0; k < 3; k++) { const xx = x + DX[d] * k, yy = y + DY[d] * k; co.pieces.push({ x: xx, y: yy, d, nd: d, h: 0, h2: 0, t: 'st' }); S.obj[yy * N + xx] = id; }
      S.objs[id] = co; S.build = id; fin('build', cost); S._rev++; G.sfx('thud');
      return co;
    }
    const PCOST = { s: 40, l: 45, r: 45, u: 55, dn: 50, ch: 70, dd: 65, lp: 160 };
    const PNAME = { s: 'Straight', l: 'Left curve', r: 'Right curve', u: 'Slope up', dn: 'Slope down', ch: 'Chain lift', dd: 'Steep drop', lp: 'Loop' };
    const pieceH2 = (t, h) => (t === 'u' || t === 'ch') ? h + 1 : t === 'dn' ? h - 1 : t === 'dd' ? h - 2 : h;
    function addPiece(co, t, quiet) {
      if (co.complete) return false;
      const n = nextSpot(co);
      const nd = t === 'l' ? (n.d + 3) % 4 : t === 'r' ? (n.d + 1) % 4 : n.d;
      const h2 = pieceH2(t, n.h);
      const fail = m => { if (!quiet) { ui.hint(m, 1); G.sfx('beep'); } return false; };
      if (h2 < 0) return fail(t === 'dd' ? 'Not high enough for a steep drop: it needs 2 levels of height.' : 'Can\'t go any lower: the track is on the ground!');
      if (h2 > 7) return fail('Too high! The council won\'t allow it. (Height limit 7)');
      if (!inB(n.x, n.y)) return fail('Can\'t build off the edge of the park!');
      if (!clearable(n.y * N + n.x)) return fail('Something is in the way!');
      if (!canAfford(PCOST[t])) return false;
      clearScen(n.y * N + n.x);
      co.pieces.push({ x: n.x, y: n.y, d: n.d, nd, h: n.h, h2, t });
      S.obj[n.y * N + n.x] = co.id; fin('build', PCOST[t]); co._len = 0; co.fail = -1;
      if (!quiet) { G.sfx(t === 'ch' ? 'turn' : 'click'); G.note(300 + h2 * 60 + (t === 'lp' ? 200 : 0), 0.05, 'square'); fx(n.x + 0.5, n.y + 0.5, '-' + rup(PCOST[t]), '#ff8080', h2); const n2 = nextSpot(co); ui.focusSpot(n2.x + 0.5, n2.y + 0.5, n2.h); }
      if (isClosed(co)) { co.complete = true; co.st = 'built'; if (!quiet) { G.sfx('solve'); ui.hint('Circuit complete! Test it to see the ratings.', 0); } }
      return true;
    }
    function undoPiece(co) {
      if (co.pieces.length <= 3 || co.st === 'test') return;
      const p = co.pieces.pop(); S.obj[p.y * N + p.x] = 0; S.money += Math.round(PCOST[p.t] * 0.75); co._len = 0;
      co.complete = false; co.tested = false; co.open = false; co.st = 'build'; co.rate = null; co.fail = -1; G.sfx('thud'); S._rev++;
    }
    // "Finish it for me": the shortest run of pieces from the end of the track back into the station (at ground level)
    function planFinish(co) {
      if (co.complete) return null;
      const st = co.pieces[0], n0 = nextSpot(co), KEY = (x, y, d, h) => ((h * 4 + d) * N + y) * N + x;
      const goal = KEY(st.x, st.y, st.d, 0), blocked = new Set();
      for (let tries = 0; tries < 6; tries++) {
        const from = new Map(); const q = [[n0.x, n0.y, n0.d, n0.h]]; from.set(KEY(n0.x, n0.y, n0.d, n0.h), null);
        let found = from.has(goal) ? goal : -1;
        for (let h = 0; h < q.length && found < 0 && q.length < 40000; h++) {
          const [x, y, d, z] = q[h], k0 = KEY(x, y, d, z);
          if (!inB(x, y) || !clearable(y * N + x) || blocked.has(y * N + x)) continue;
          for (const t of ['s', 'l', 'r', 'dn', 'ch']) {
            const nd = t === 'l' ? (d + 3) % 4 : t === 'r' ? (d + 1) % 4 : d, z2 = pieceH2(t, z);
            if (z2 < 0 || z2 > 7) continue;
            const nx = x + DX[nd], ny = y + DY[nd], k = KEY(nx, ny, nd, z2);
            if (from.has(k)) continue;
            from.set(k, [k0, t]);
            if (k === goal) { found = k; break; }
            q.push([nx, ny, nd, z2]);
          }
        }
        if (found < 0) return null;
        const ts = []; for (let k = found; from.get(k); k = from.get(k)[0]) ts.unshift(from.get(k)[1]);
        // check it doesn't cross itself
        let x = n0.x, y = n0.y, d = n0.d, seen = new Set(), bad = -1;
        for (const t of ts) { const i = y * N + x; if (seen.has(i)) { bad = i; break; } seen.add(i); d = t === 'l' ? (d + 3) % 4 : t === 'r' ? (d + 1) % 4 : d; x += DX[d]; y += DY[d]; }
        if (bad < 0) return { ts, cost: ts.reduce((a, t) => a + PCOST[t], 0) };
        blocked.add(bad);
      }
      return null;
    }
    // test run: a simple physics simulation along the track
    function simulate(co) {
      trackPrep(co); const L = co._len, GR = 7, dt = 0.02, START = 2.4;
      let s = START, v = 0, t = 0, maxV = 0, maxLat = 0, turnsFast = 0, lastPi = -1, prof = [s], acc = 0;
      const pt = { x: 0, y: 0, z: 0, tx: 0, ty: 0 }, pt2 = { x: 0, y: 0, z: 0, tx: 0, ty: 0 };
      while (t < 180) {
        trackAt(co, s, pt); const p = co.pieces[pt.pi];
        trackAt(co, s + 0.05, pt2); const slope = (pt2.z - pt.z) * 0.5 / 0.05;
        let a = -GR * slope - (0.1 + 0.012 * v * v);
        if (p.t === 'ch' && v < 1.4) { v = 1.4; a = 0; }
        if (p.t === 'st') { if (s < L) { if (v < 1.6) a = 2.5; } else a = v > 0.8 ? -4 : 0; }
        v += a * dt;
        if (p.t === 'lp' && pt.inv && v < 1.3) return { ok: false, s, pi: pt.pi, why: 'The train didn\'t have enough speed to get round the loop! It rolled back down (everybody screamed). Put a big drop, at least 4 high, right before the loop.' };
        if (v < 0.15 && p.t !== 'st' && p.t !== 'ch') return { ok: false, s, pi: pt.pi, why: slope > 0 ? 'The train couldn\'t get up the hill! Try a chain lift, or a bigger drop before it.' : 'The train ran out of speed and stopped! Add a drop or a chain lift.' };
        if (v < 0.4 && p.t === 'st' && s >= L) v = 0.4;
        s += v * dt; t += dt; acc += dt;
        if (acc >= 0.05) { acc -= 0.05; prof.push(+s.toFixed(3)); }
        if (v > maxV) maxV = v;
        if (p.t === 'l' || p.t === 'r') { maxLat = Math.max(maxLat, v * v / 0.5); if (pt.pi !== lastPi && v > 2) turnsFast++; }
        lastPi = pt.pi;
        if (s >= L + START) { prof.push(L + START); break; }
      }
      if (t >= 180) return { ok: false, s, pi: 0, why: 'The train is taking for ever. Something is wrong with the track!' };
      const drops = co.pieces.filter(p => p.t === 'dn').length + co.pieces.filter(p => p.t === 'dd').length * 1.6, turns = co.pieces.filter(p => p.t === 'l' || p.t === 'r').length, loops = co.pieces.filter(p => p.t === 'lp').length;
      const e = clamp(1 + drops * 0.45 + maxV * 0.55 + turnsFast * 0.12 + L * 0.025 + (co.pieces.some(p => p.h >= 5) ? 0.5 : 0) + Math.min(loops, 3) * 0.9, 0, 12);
      const i = clamp(0.6 + maxV * 0.72 + maxLat * 0.025 + drops * 0.1 + loops * 0.9, 0, 14);
      const n = clamp(0.4 + turns * 0.13 + maxLat * 0.015 + loops * 0.8, 0, 10);
      return { ok: true, prof, time: t, maxV, maxLat, e: +e.toFixed(2), i: +i.toFixed(2), n: +n.toFixed(2), len: L, loops, drops: Math.round(drops), maxH: Math.max(...co.pieces.map(p => Math.max(p.h, p.h2))) };
    }
    function testCoaster(co) {
      if (!co.complete) return;
      const r = simulate(co);
      co.test = { r, t: 0 }; co.st = 'test'; co.fail = -1;
      ui.hint('Test run in progress... (the camera follows the train)', 0, true); ui.follow = co.id;
      G.sfx('turn');
    }
    const rateWord = v => v < 2 ? 'Low' : v < 4 ? 'Medium' : v < 6 ? 'High' : v < 8 ? 'Very High' : v < 10 ? 'Extreme' : 'Ultra-Extreme';

    // ---------------------------------------------------------------- guests
    const gById = id => S._gm ? S._gm.get(id) : null;
    function rebuildGM() { S._gm = new Map(); S.guests.forEach(g => S._gm.set(g.id, g)); }
    function spawnGuest(atTile) {
      let name = 'Guest ' + (S.gnum++), shirt = SHIRTS[(Math.random() * SHIRTS.length) | 0], mate = -1;
      if (Math.random() < 0.06) { const free2 = MATES.map((m, k) => k).filter(k => !S.named[k]); if (free2.length) { mate = free2[(Math.random() * free2.length) | 0]; S.named[mate] = 1; name = MATES[mate].n; shirt = MATES[mate].shirt; } }
      const ti = atTile == null ? ENT : atTile;
      const g = { id: S.gid++, name, mate, shirt, skin: SKINS[(Math.random() * SKINS.length) | 0], leg: ['#203060', '#303030', '#604020', '#2a2a6a'][(Math.random() * 4) | 0],
        ti, x: ti % N + 0.5, y: ((ti / N) | 0) + 0.5, tx: ti % N + 0.5, ty: ((ti / N) | 0) + 0.5, ni: ti, last: -1, st: 'walk', goal: null,
        money: 15 + Math.floor(Math.random() * 40), happy: 62 + Math.random() * 20, hunger: Math.random() * 40, thirst: Math.random() * 40, toilet: Math.random() * 30, energy: 80 + Math.random() * 20, nausea: 0,
        tol: 2 + Math.random() * 7.5, thrill: Math.random() * 3.2, ox: (Math.random() - 0.5) * 0.4, oy: (Math.random() - 0.5) * 0.4, ph: 0, th: [], tt: 0, life: 150 + Math.random() * 140, age: 0,
        carry: '', carryT: 0, item: '', bcol: SHIRTS[(Math.random() * 6) | 0], rides: 0, wait: 0, bub: 0, bubc: '', spent: 0, timer: 0, hat: '', umb: 0 };
      S.guests.push(g); if (S._gm) S._gm.set(g.id, g);
      return g;
    }
    const THOUGHTS = {
      hungry: ['I\'m hungry', -1], thirsty: ['I\'m thirsty', -1], toilet: ['I need to go to the toilet', -1], tired: ['I\'m tired', -1], sick: ['I feel sick', -1],
      intense: ['{r} looks too intense for me', -1], thrill: ['I want to go on something more thrilling', -1], disgust: ['The path is disgusting', -1], broke: ['I\'ve spent all my money', -1],
      great: ['Wow, this park is great!', 1], scenery: ['The scenery here is lovely', 1], dear: ['I\'m not paying that much to go on {r}', -1], queue: ['I\'ve been queueing for ages for {r}', -1],
      rgood: ['{r} was great!', 1], lost: ['I\'m lost!', -1], nofood: ['I can\'t find anywhere to eat', -1], clean: ['This park is really clean and tidy', 1], balloon: ['I love my new balloon', 1],
      home: ['I want to go home', -1], broken: ['{r} has broken down. Typical', -1], closed: ['{r} is closed', -1], afford: ['I can\'t afford {r}', -1], tooexp: ['The entry fee was a bit much', -1],
      rain: ['It\'s raining and I haven\'t got an umbrella', -1], umb: ['Good job I bought this umbrella', 1], wetride: ['It\'s too wet to go on {r}', -1], hot: ['It\'s boiling! I want an ice lolly', -1],
      hat: ['I look brilliant in this hat', 1], cash: ['Phew, a cash machine', 1], cheap: ['{r} is really good value', 1], bargain: ['The entry fee is a bargain', 1], noride: ['There\'s nothing to go on here', -1],
      mate: ['', 0],
    };
    function think(g, k, r, txt) {
      const now = S.time;
      if (g.th.length && g.th[0].k === k && now - g.th[0].at < 20) return;
      const t = txt || THOUGHTS[k][0].replace('{r}', r || 'that ride');
      g.th.unshift({ k, t, at: now }); if (g.th.length > 6) g.th.length = 6;
      g.bub = 2.2; g.bubc = (THOUGHTS[k] || [0, 0])[1] > 0 ? '#20c020' : (THOUGHTS[k] || [0, 0])[1] < 0 ? '#e02020' : '#ffd400';
    }
    const walkable = (g, i) => S.path[i] === 1 || (S.path[i] === 2 && (g.onq || (g.goal && g.goal.r && qOwner[i] === g.goal.r)));
    function setNext(g, i) { g.last = g.ti; g.ni = i; g.tx = i % N + 0.5 + g.ox; g.ty = ((i / N) | 0) + 0.5 + g.oy; }
    function wander(g) {
      const x = g.ti % N, y = (g.ti / N) | 0, opts2 = [];
      for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (!inB(nx, ny)) continue; const j = ny * N + nx; if (S.path[j] === 1 || (S.path[j] === 2 && g.onq)) opts2.push(j); }
      if (!opts2.length) { if (!S.path[g.ti]) relocate(g); return; }
      const fwd = opts2.filter(j => j !== g.last);
      setNext(g, (fwd.length ? fwd : opts2)[(Math.random() * (fwd.length ? fwd.length : opts2.length)) | 0]);
    }
    function relocate(g) { g.ti = g.ni = ENT; g.x = g.tx = ENTX + 0.5; g.y = g.ty = ENTY + 0.5; g.goal = null; think(g, 'lost'); }
    function rideList() { return Object.values(S.objs).filter(o => (o.k === 'ride' || (o.k === 'coaster' && o.tested)) && o.open); }
    const stats = o => o.k === 'coaster' ? o.rate : RIDES[o.type].st;
    const value = o => { const r = stats(o); return o.k === 'coaster' ? r.e * 0.7 + 0.5 : r.e * 0.55 + 0.45; };
    function chooseGoal(g) {
      links();
      if (g.age > g.life || g.happy < 18 || g.energy < 8 || (g.money < 0.5 && Math.random() < 0.4)) { if (g.money < 0.5) think(g, 'broke'); else think(g, 'home'); g.goal = { exit: 1 }; return; }
      const wx = S.wx ? S.wx.k : 'sun';
      const stall = (need, pref) => { let l = Object.values(S.objs).filter(o => o.k === 'stall' && (STALLS[o.type].need === need) && o._ent && o._ent.length && g.money >= o.price); if (pref) { const l2 = l.filter(o => o.type === pref); if (l2.length) l = l2; } return l.length ? l[(Math.random() * l.length) | 0] : null; };
      const needFor = (need, th, k, pref) => { const o = stall(need, pref); if (o) { g.goal = { s: o.id }; return true; } think(g, k); return false; };
      if (g.money < 3 && g.happy > 35 && !g.cashed) { const o = stall('cash'); if (o) { g.goal = { s: o.id }; return; } }
      if (g.toilet > 75 && needFor('toilet', 0, 'toilet')) return;
      if (g.hunger > 68) { if (needFor('hunger', 0, 'hungry', wx === 'hot' ? 'lolly' : '')) return; if (!Object.values(S.objs).some(o => o.k === 'stall' && STALLS[o.type].need === 'hunger')) think(g, 'nofood'); }
      if (g.thirst > 70 && needFor('thirst', 0, 'thirsty')) return;
      if (wx === 'hot' && g.hunger > 35 && Math.random() < 0.25) { const o = stall('hunger', 'lolly'); if (o && o.type === 'lolly') { g.goal = { s: o.id }; return; } think(g, 'hot'); }
      if (wx === 'rain' && !g.umb && g.money > 3 && Math.random() < 0.5) { const o = stall('balloon'); if (o) { g.goal = { s: o.id, umb: 1 }; return; } }
      if (!g.item && g.money > 4 && Math.random() < 0.05) { const o = stall('balloon'); if (o) { g.goal = { s: o.id }; return; } }
      if (!g.hat && g.money > 5 && Math.random() < 0.04) { const o = stall('hat'); if (o) { g.goal = { s: o.id }; return; } }
      if (g.energy < 30) { think(g, 'tired'); }
      if (g.nausea > 55) { think(g, 'sick'); return; }
      if (Math.random() < 0.55) {
        const rides = rideList(); if (!rides.length) { if (g.age > 25 && Math.random() < 0.2) { think(g, 'noride'); g.happy -= 2; } return; }
        const r = rides[(Math.random() * rides.length) | 0], st = stats(r);
        if (wx === 'rain' && !(r.k === 'ride' && RIDES[r.type].cov) && Math.random() < 0.6) { think(g, 'wetride', r.name); return; }
        if (st.i > g.tol) { think(g, 'intense', r.name); return; }
        if (st.e < g.thrill && !rides.some(o => stats(o).e >= g.thrill)) { think(g, 'thrill'); return; }
        if (r.price > value(r) * 1.8) { think(g, 'dear', r.name); return; }
        if (r.price > g.money) { think(g, 'afford', r.name); return; }
        if (r.st === 'broken') { think(g, 'broken', r.name); return; }
        if (r.waiting.length > Math.max(8, r._line.length * 3 + 4)) return;
        if (!r._ent.length) return;
        g.goal = { r: r.id };
      }
    }
    function arrive(g) {
      links();
      g.ti = g.ni; g.onq = S.path[g.ti] === 2;
      if (!S.path[g.ti]) { relocate(g); return; }
      // the litter they are carrying
      if (g.carry && g.carryT <= 0) {
        const x = g.ti % N, y = (g.ti / N) | 0; let bin = S.furn[g.ti] === 2;
        for (let d = 0; d < 4 && !bin; d++) { const nx = x + DX[d], ny = y + DY[d]; if (inB(nx, ny) && S.furn[ny * N + nx] === 2) bin = true; }
        if (!bin && Math.random() < 0.75) { S.litter[g.ti] = Math.min(9, S.litter[g.ti] + 1); }
        g.carry = '';
      }
      // what's around them
      if (Math.random() < 0.3) {
        const x = g.ti % N, y = (g.ti / N) | 0; let lit = 0, sc = 0;
        for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) { if (!inB(x + xx, y + yy)) continue; const j = (y + yy) * N + x + xx; if (Math.abs(xx) <= 1 && Math.abs(yy) <= 1) lit += S.litter[j]; const o = S.objs[S.obj[j]]; if (o && o.k === 'scen') sc += o.type === 'fountain' || o.type === 'statue' ? 2 : 1; if (S.furn[j] === 3) sc += 0.5; }
        if (lit >= 4) { g.happy -= 3; think(g, 'disgust'); }
        else if (sc >= 4) { g.happy = Math.min(100, g.happy + 2); if (Math.random() < 0.3) think(g, 'scenery'); }
        else if (lit === 0 && S.guests.length > 25 && Math.random() < 0.03) think(g, 'clean');
        if (g.happy > 85 && Math.random() < 0.05) think(g, 'great');
        if (g.mate >= 0 && Math.random() < 0.12) think(g, 'mate', '', MATES[g.mate].q[(Math.random() * 3) | 0]);
      }
      // a bench for tired legs
      if (g.energy < 35 && S.furn[g.ti] === 1 && Math.random() < 0.7) { g.st = 'sit'; g.timer = 6; return; }
      if (g.goal && g.goal.exit) {
        if (g.ti === ENT) { g.st = 'gone'; return; }
        const n = bfs(g.ti, j => j === ENT, j => walkable(g, j));
        if (n >= 0) setNext(g, n); else wander(g);
        return;
      }
      if (!g.goal) chooseGoal(g);
      if (g.goal && g.goal.s) {
        const o = S.objs[g.goal.s]; if (!o) { g.goal = null; return wander(g); }
        const n = bfs(g.ti, j => o._ent.includes(j), j => walkable(g, j));
        if (n === -2) { g.st = 'buy'; g.timer = 1.2; return; }
        if (n >= 0) return setNext(g, n);
        g.goal = null;
      }
      if (g.goal && g.goal.r) {
        const o = S.objs[g.goal.r]; if (!o || !o.open) { g.goal = null; return wander(g); }
        links();
        const n = bfs(g.ti, j => o._ent.includes(j), j => walkable(g, j));
        if (n === -2) { joinQueue(g, o); return; }
        if (n >= 0) return setNext(g, n);
        g.goal = null;
      }
      wander(g);
    }
    function joinQueue(g, o) {
      if (o.st === 'broken') { think(g, 'broken', o.name); g.goal = null; return wander(g); }
      g.st = 'queue'; g.wait = 0; g.rid = o.id; o.waiting.push(g.id);
    }
    function buy(g) {
      const o = S.objs[g.goal && g.goal.s], umb = g.goal && g.goal.umb; g.goal = null; g.st = 'walk';
      if (!o) return;
      const def = STALLS[o.type];
      if (def.need === 'cash') { g.money += 15 + Math.floor(Math.random() * 25); g.cashed = 1; o.sold++; think(g, 'cash'); return; }
      if (g.money < o.price) { think(g, 'broke'); return; }
      g.money -= o.price; g.spent += o.price; o.sold++; o.income += o.price; fin(o.type === 'info' ? 'shop' : 'food', o.price);
      if (def.need === 'hunger') { g.hunger = Math.max(0, g.hunger - (o.type === 'lolly' ? 35 : 70)); g.carry = def.item; g.carryT = 6 + Math.random() * 8; g.happy = Math.min(100, g.happy + 4); g.thirst += 8; }
      else if (def.need === 'thirst') { g.thirst = 0; g.toilet += 25; g.carry = def.item; g.carryT = 6 + Math.random() * 8; g.happy = Math.min(100, g.happy + 3); }
      else if (def.need === 'toilet') { g.toilet = 0; g.happy = Math.min(100, g.happy + 5); }
      else if (def.need === 'balloon') {
        if (umb || (S.wx && S.wx.k === 'rain' && !g.umb)) { g.umb = 1; g.happy = Math.min(100, g.happy + 6); think(g, 'umb'); if (S.wx && S.wx.k === 'rain' && !V) G.secret('park.brolly'); }
        else { g.item = Math.random() < 0.7 ? 'balloon' : 'map'; g.happy = Math.min(100, g.happy + 8); if (g.item === 'balloon') think(g, 'balloon'); }
      }
      else if (def.need === 'hat') { g.hat = SHIRTS[(Math.random() * SHIRTS.length) | 0]; g.happy = Math.min(100, g.happy + 7); think(g, 'hat'); }
    }
    function updateGuest(g, dt) {
      g.age += dt; g.tt -= dt; if (g.bub > 0) g.bub -= dt; if (g.carryT > 0) g.carryT -= dt;
      const wx = S.wx ? S.wx.k : 'sun';
      g.hunger += 0.5 * dt; g.thirst += (wx === 'hot' ? 1.05 : 0.62) * dt; g.toilet += 0.35 * dt; g.energy -= 0.22 * dt; g.nausea = Math.max(0, g.nausea - 0.9 * dt);
      if (wx === 'rain' && !g.umb && g.st !== 'ride' && !(g.st === 'queue' && S.objs[g.rid] && S.objs[g.rid].k === 'ride' && RIDES[S.objs[g.rid].type].cov)) { g.happy -= 0.45 * dt; if (Math.random() < dt * 0.04) think(g, 'rain'); }
      if (g.hunger > 90 || g.thirst > 90 || g.toilet > 92) g.happy -= 0.5 * dt;
      if (g.nausea > 70) g.happy -= 0.3 * dt;
      g.happy = clamp(g.happy, 0, 100); g.hunger = clamp(g.hunger, 0, 100); g.thirst = clamp(g.thirst, 0, 100); g.toilet = clamp(g.toilet, 0, 100); g.energy = clamp(g.energy, 0, 100);
      if (g.st === 'ride') return;
      if (g.st === 'queue') {
        g.wait += dt;
        const o = S.objs[g.rid];
        if (!o) { g.st = 'walk'; g.goal = null; return; }
        if (g.wait > 50 || (o.st === 'broken' && g.wait > 12)) { o.waiting = o.waiting.filter(x => x !== g.id); think(g, o.st === 'broken' ? 'broken' : 'queue', o.name); g.happy -= 8; g.st = 'walk'; g.goal = null; g.ni = g.ti; return; }
        // shuffle along the queue line
        const k = o.waiting.indexOf(g.id), line = o._line || [];
        if (line.length) { const ti = line[Math.min(line.length - 1, Math.floor(k / 3))], f = (k % 3) / 3 - 0.33; const tx = ti % N + 0.5 + f * 0.6, ty = ((ti / N) | 0) + 0.5 - f * 0.3; g.x += (tx - g.x) * Math.min(1, dt * 3); g.y += (ty - g.y) * Math.min(1, dt * 3); g.ph += dt * 4 * Math.min(1, Math.abs(tx - g.x) + Math.abs(ty - g.y)); }
        return;
      }
      if (g.st === 'buy') { g.timer -= dt; if (g.timer <= 0) { buy(g); arrive(g); } return; }
      if (g.st === 'sit') { g.timer -= dt; g.energy = Math.min(100, g.energy + 6 * dt); if (g.timer <= 0) { g.st = 'walk'; wander(g); } return; }
      // walking
      const sp = (g.nausea > 50 ? 0.65 : 1) * (g.energy < 20 ? 0.75 : 1) * 1.05;
      const dx = g.tx - g.x, dy = g.ty - g.y, dist = Math.hypot(dx, dy);
      if (g.ni === g.ti) { g.idle = (g.idle || 0) - dt; if (g.idle > 0) return; g.idle = 0.6; arrive(g); return; }
      if (dist < 0.02) { arrive(g); return; }
      const step = Math.min(dist, sp * dt); g.x += dx / dist * step; g.y += dy / dist * step; g.ph += dt * 8;
      if (step >= dist) arrive(g);
    }

    // ---------------------------------------------------------------- rides running
    function updateRide(o, dt) {
      const isCo = o.k === 'coaster';
      if (isCo && o.st === 'test') {
        const T = o.test; T.t += dt * 2; // test runs play at double speed
        const r = T.r, idx = Math.floor(T.t / 0.05);
        if (!r.ok) {
          // run it until it gets stuck
          o.ts = Math.min(r.s, 2.4 + T.t * 1.6);
          if (o.ts >= r.s || T.t > 25) { o.st = 'built'; o.test = null; o.fail = r.pi; G.sfx('uhoh'); if (ui) ui.follow = 0; G.msg('Test Run', r.why + '\n\n(The red flashing piece is where it went wrong.)', 'warn'); if (ui) ui.refresh(); }
          return;
        }
        if (idx >= r.prof.length - 1) {
          o.st = 'wait'; o.t = 0; o.tested = true; o.rate = { e: r.e, i: r.i, n: r.n, maxV: r.maxV, time: r.time, len: r.len, loops: r.loops, drops: r.drops, maxH: r.maxH }; o.prof = r.prof; o.test = null; o.ts = 2.4;
          if (!V) { S.best = Math.max(S.best, r.e); if (r.loops && o.byPlayer) G.secret('park.loop'); if (r.e >= 7 && o.byPlayer) G.secret('park.thriller'); }
          G.sfx('solve'); [523, 659, 784, 1046].forEach((f, k) => G.timer(() => G.note(f, 0.12, 'square'), k * 110));
          if (ui) { ui.follow = 0; ui.hint(`Test complete! Excitement ${r.e.toFixed(2)} (${rateWord(r.e)}). Now open it!`, 0); if (ui.wins.co) ui.refreshWin(ui.wins.co, true); else ui.openObj(o); }
          return;
        }
        o.ts = r.prof[idx] + (r.prof[idx + 1] - r.prof[idx]) * ((T.t / 0.05) - idx);
        return;
      }
      if (isCo && !o.tested) return;
      if (!o.open) {
        if (o.waiting.length) { o.waiting.forEach(id => { const g = gById(id); if (g) { g.st = 'walk'; g.goal = null; g.ni = g.ti; think(g, 'closed', o.name); } }); o.waiting = []; }
        if (o.st === 'run') { o.t += dt; if (o.t >= duration(o)) finishRide(o); }
        return;
      }
      if (o.st === 'broken') { o.t += dt; return; }
      const cap = isCo ? 12 : RIDES[o.type].cap;
      o.t += dt;
      if (o.st === 'wait') {
        if (o.waiting.length && (o.t > 4 || o.waiting.length >= cap)) {
          o.riders = [];
          while (o.riders.length < cap && o.waiting.length) {
            const g = gById(o.waiting.shift()); if (!g) continue;
            if (g.money < o.price) { think(g, 'afford', o.name); g.st = 'walk'; g.goal = null; g.ni = g.ti; continue; }
            g.money -= o.price; g.spent += o.price; o.income += o.price; fin('rides', o.price);
            g.st = 'ride'; g.hidden = true; o.riders.push(g.id);
          }
          if (o.riders.length) { o.st = 'run'; o.t = 0; }
        }
      } else if (o.st === 'run') {
        if (isCo) { const i = Math.floor(o.t / 0.05); const p = o.prof; o.ts = i >= p.length - 1 ? p[p.length - 1] : p[i] + (p[i + 1] - p[i]) * (o.t / 0.05 - i); }
        if (o.t >= duration(o)) finishRide(o);
      }
    }
    const duration = o => o.k === 'coaster' ? (o.prof ? o.prof.length * 0.05 : 10) : RIDES[o.type].dur;
    function finishRide(o) {
      links();
      const st = stats(o), ex = o._exit && o._exit.length ? o._exit : [ENT];
      o.riders.forEach((id, k) => {
        const g = gById(id); if (!g) return;
        g.hidden = false; g.st = 'walk'; g.goal = null; g.rides++;
        const t = ex[k % ex.length]; g.ti = g.ni = t; g.x = g.tx = t % N + 0.5 + g.ox; g.y = g.ty = ((t / N) | 0) + 0.5 + g.oy; g.onq = S.path[t] === 2;
        g.happy = clamp(g.happy + 5 + st.e * 2.4 - Math.max(0, st.i - g.tol) * 6, 0, 100);
        g.nausea = Math.min(100, g.nausea + st.n * 9); g.energy -= 3;
        if (g.nausea > 72) { think(g, 'sick'); if (Math.random() < 0.3) S.litter[t] = Math.min(9, S.litter[t] + 2); }
        else if (st.e >= 4.5 || Math.random() < 0.15) think(g, 'rgood', o.name);
      });
      o.total += o.riders.length; o.riders = []; o.cycles++;
      o.st = 'wait'; o.t = 0; if (o.k === 'coaster') o.ts = 2.4;
      if (Math.random() < (o.k === 'coaster' ? 0.035 : 0.025)) {
        o.st = 'broken'; o.fixer = 0; G.sfx('uhoh');
        news(`${o.name} has broken down${S.staff.some(s => s.k === 'mek') ? '' : ' - hire a Mechanic to fix it!'}`, o.k === 'coaster' ? o.pieces[0].y * N + o.pieces[0].x : o.y * N + o.x, true);
      }
    }

    // ---------------------------------------------------------------- staff
    function hire(k) {
      const s = { id: S.gid++, k, ti: ENT, ni: ENT, x: ENTX + 0.5, y: ENTY + 0.5, tx: ENTX + 0.5, ty: ENTY + 0.5, last: -1, st: 'walk', timer: 0, ph: 0, ox: (Math.random() - 0.5) * 0.3, oy: (Math.random() - 0.5) * 0.3, swept: 0, fixed: 0, job: 0 };
      s.name = (k === 'handy' ? 'Handyman ' : 'Mechanic ') + (S.staff.filter(x => x.k === k).length + 1);
      S.staff.push(s); G.sfx('pet');
      news(`${s.name} has been hired. Wages: ${money(STAFF[k].wage)} a month`, ENT, true);
    }
    function updateStaff(s, dt) {
      if (s.st === 'work') {
        s.timer -= dt; s.ph += dt * 3;
        if (s.timer <= 0) {
          if (s.k === 'handy') { if (S.litter[s.ti] > 0) { S.litter[s.ti]--; s.swept++; s.timer = 0.8; return; } }
          else { const o = S.objs[s.job]; if (o && o.st === 'broken') { o.st = 'wait'; o.t = 0; s.fixed++; G.sfx('click'); news(`${o.name} has been fixed by ${s.name}`, null, true); } s.job = 0; }
          s.st = 'walk'; s.ni = s.ti;
        }
        return;
      }
      const dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy);
      if (dist > 0.02 && s.ni !== s.ti) { const st = Math.min(dist, 1.25 * dt); s.x += dx / dist * st; s.y += dy / dist * st; s.ph += dt * 8; if (st < dist) return; }
      s.ti = s.ni;
      if (!S.path[s.ti]) { s.ti = s.ni = ENT; s.x = s.tx = ENTX + 0.5; s.y = s.ty = ENTY + 0.5; }
      const pass = j => S.path[j] > 0;
      let n = -1;
      if (s.k === 'handy') {
        if (S.litter[s.ti] > 0) { s.st = 'work'; s.timer = 0.8; return; }
        n = bfs(s.ti, j => S.litter[j] > 0, pass);
      } else {
        links();
        let o = S.objs[s.job];
        if (!o || o.st !== 'broken') { s.job = 0; o = Object.values(S.objs).find(r => r.st === 'broken' && (!r.fixer || !S.staff.some(x => x.id === r.fixer && x.job === r.id))); if (o) { s.job = o.id; o.fixer = s.id; } }
        if (o) {
          const ent = new Set([...(o._exit || []), ...(o._ent || [])]);
          n = bfs(s.ti, j => ent.has(j), pass);
          if (n === -2) { s.st = 'work'; s.timer = 4; return; }
          if (n === -1) { s.job = 0; }
        }
      }
      if (n >= 0) { s.last = s.ti; s.ni = n; s.tx = n % N + 0.5 + s.ox; s.ty = ((n / N) | 0) + 0.5 + s.oy; return; }
      // wander
      const x = s.ti % N, y = (s.ti / N) | 0, o2 = [];
      for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (inB(nx, ny) && S.path[ny * N + nx]) o2.push(ny * N + nx); }
      if (!o2.length) return;
      const f = o2.filter(j => j !== s.last); const j = (f.length ? f : o2)[(Math.random() * (f.length || o2.length)) | 0];
      s.last = s.ti; s.ni = j; s.tx = j % N + 0.5 + s.ox; s.ty = ((j / N) | 0) + 0.5 + s.oy;
    }

    // ---------------------------------------------------------------- the clock, money and the rating
    let spawnT = 2, rateT = 0, crowdDone = false;
    // the weather: changes every few days. Spring and October are wet, July and August are hot
    function newWeather() {
      const sc = SCENARIOS[S.si] || {}, m = Math.floor(S.day / 30) % 8, r = Math.random();
      const pRain = sc.wet ? 0.45 : sc.sunny ? 0.08 : [0.3, 0.3, 0.2, 0.15, 0.1, 0.1, 0.2, 0.3][m], pHot = sc.wet ? 0.03 : (m >= 3 && m <= 5 ? 0.22 : 0.05) + (sc.sunny ? 0.15 : 0);
      const k = r < pRain ? 'rain' : r < pRain + pHot ? 'hot' : r < pRain + pHot + 0.25 ? 'cloud' : 'sun';
      const was = S.wx.k; S.wx = { k, d: 2 + Math.floor(Math.random() * 4) };
      if (k !== was && !V) {
        if (k === 'rain') news('It\'s started raining. Guests without umbrellas are getting soggy. (Info Kiosks sell umbrellas.)', null, true);
        else if (k === 'hot') news('Heatwave! Guests are getting thirsty and want ice lollies.', null, true);
        else if (was === 'rain') news('The rain has stopped. Hooray!', null, true);
      }
    }
    function sim(dt) {
      S.time += dt;
      const m0 = Math.floor(S.day / 30), d0 = Math.floor(S.day);
      S.day += dt / SPD;
      const m1 = Math.floor(S.day / 30);
      if (Math.floor(S.day) !== d0 && --S.wx.d <= 0) newWeather();
      if (m1 !== m0) monthEnd(m0);
      if (!S) return;
      if (S.ads && S.day >= S.ads.until) { if (!V) news(`Your ${S.ads.n} campaign has finished.`, null, true); S.ads = null; }
      // guests arrive
      const open = rideList().length, stalls = Object.values(S.objs).filter(o => o.k === 'stall').length;
      if (S.open) {
        spawnT -= dt;
        const maxFee = 3 + open * 1.6;
        const cap = Math.min(170, 18 + open * 16 + stalls * 4);
        if (spawnT <= 0) {
          let iv = clamp(7 - Math.min(open, 9) * 0.6 - (S.rating - 500) / 300, 1.3, 9);
          if (S.fee > maxFee) iv *= 2.5 + (S.fee - maxFee) * 0.4;
          if (S.wx.k === 'rain') iv *= 1.7; else if (S.wx.k === 'hot') iv *= 0.9;
          if (S.ads) iv /= S.ads.boost;
          spawnT = iv * (0.6 + Math.random() * 0.8);
          if (S.guests.length < cap * (S.ads ? 1.15 : 1)) {
            const g = spawnGuest(); g.money = Math.max(4, g.money);
            if (!V) { S.money += S.fee; S.fin.entry += S.fee; if (S.fee > 0) fx(ENTX + 0.5, ENTY + 0.2, '+' + rup(S.fee), '#80ff80', 2); }
            if (S.fee > maxFee && Math.random() < 0.3) think(g, 'tooexp');
            else if (S.fee > 0 && S.fee <= maxFee * 0.5 && Math.random() < 0.15) think(g, 'bargain');
            if (S.fee > maxFee && Math.random() < 0.05) news('Guests think your park entry fee is too expensive', ENT, true);
          }
        }
      }
      for (const g of S.guests) updateGuest(g, dt);
      if (S.guests.some(g => g.st === 'gone')) {
        S.guests = S.guests.filter(g => { if (g.st !== 'gone') return true; if (g.mate >= 0) delete S.named[g.mate]; S._gm.delete(g.id); return false; });
      }
      for (const o of Object.values(S.objs)) { if (o.k === 'ride' || o.k === 'coaster') { updateRide(o, dt); if (o.st === 'run' || o.st === 'test' || (o.k === 'ride' && o.open)) o.rot = (o.rot || 0) + dt * (o.st === 'run' ? 1.6 : 0); } }
      for (const s of S.staff) updateStaff(s, dt);
      rateT -= dt;
      if (rateT <= 0) { rateT = 1.5; rating(); }
      if (!crowdDone && S.guests.length >= 50 && !V) { crowdDone = true; G.secret('park.crowd'); news('50 guests in the park! It\'s getting busy.', ENT); }
    }
    function rating() {
      let h = 0, unhappy = 0; S.guests.forEach(g => { h += g.happy; if (g.happy < 30) unhappy++; });
      const avg = S.guests.length ? h / S.guests.length : 60;
      let lit = 0; for (let i = 0; i < NN; i++) lit += S.litter[i];
      const all = Object.values(S.objs), open = all.filter(o => (o.k === 'ride' || o.k === 'coaster') && o.open).length, broken = all.filter(o => o.st === 'broken').length;
      const rb = [['Happy guests', Math.round(avg * 5)], ['Rides open', Math.min(open, 12) * 22], ['Lots of guests', Math.round(Math.min(S.guests.length, 200) * 0.6)], ['Litter', -Math.round(lit * 3.5)], ['Broken rides', -broken * 50], ['Unhappy guests', -Math.round(unhappy * 1.5)]];
      S._rb = rb;
      const target = clamp(Math.round(240 + avg * 5 + Math.min(open, 12) * 22 + Math.min(S.guests.length, 200) * 0.6 - lit * 3.5 - broken * 50 - unhappy * 1.5), 0, 999);
      S.rating = Math.round(S.rating + (target - S.rating) * 0.25);
      if (lit > 25 && Math.random() < 0.08 && !V) news('Guests are complaining about the litter in your park', null, true);
    }
    function monthEnd(m) {
      if (V) { S.fin = blankFin(); return; }
      // bills
      let up = 0; Object.values(S.objs).forEach(o => { if (o.k === 'ride') up += RIDES[o.type].up; else if (o.k === 'stall') up += STALLS[o.type].up; else if (o.k === 'coaster') up += 15 + o.pieces.length; });
      const wages = S.staff.reduce((t, s) => t + STAFF[s.k].wage, 0), interest = Math.round(S.loan * 0.1 / 12);
      fin('upkeep', up); fin('wages', wages); fin('interest', interest);
      const f = S.fin, inc = f.entry + f.rides + f.food + f.shop, out = f.build + f.wages + f.upkeep + f.interest + (f.ads || 0);
      // the profit objective counts what the park earns, not what you spend building it
      const prof = inc - f.wages - f.upkeep - f.interest - (f.ads || 0);
      if (prof > S.bestProfit) S.bestProfit = prof;
      S.hist.unshift({ m: MONTHS[m % 8] + ' Y' + (Math.floor(m / 8) + 1), inc, out, prof, guests: S.guests.length, rating: S.rating }); if (S.hist.length > 12) S.hist.length = 12;
      S.lastFin = f; S.fin = blankFin();
      news(`${MONTHS[m % 8]} report: income ${money(inc)}, spending ${money(out)}. ${S.guests.length} guests, rating ${S.rating}.`, null);
      // awards and silly news
      let lit = 0; for (let i = 0; i < NN; i++) lit += S.litter[i];
      if (S.guests.length > 25 && lit < 4) news('Your park has received an award for being the Tidiest Park in the County!', null, true);
      const silly = ['Callum says his park has a loop-the-loop. (It doesn\'t. He made it up.)', 'Dave visited your park and asked if you\'ve got Kart Kaos 64 anywhere', 'Mom says the park has to close at nine on school nights', 'Luke says the Big Wheel needs a Rumble Pouch', 'Dave has been banned from the Jack Burger stall. Again.', 'JackK says your coaster "isn\'t bad, for a Jack"', 'Gubbinz has been spotted riding the Pirate Ship forty times in a row', 'The Jacktown Gazette says your park is "the best thing since sliced bread, probably"'];
      if (Math.random() < 0.6) news(silly[(Math.random() * silly.length) | 0], null, true);
      // a coach party now and then
      if (S.open && S.rating > 520 && rideList().length >= 2 && Math.random() < 0.3) {
        const n = 8 + Math.floor(Math.random() * 6);
        for (let k = 0; k < n; k++) { const g = spawnGuest(); g.money = Math.max(10, g.money); S.money += S.fee; S.fin.entry += S.fee; }
        news(`A coach party of ${n} from Callum's school has just arrived! (They were promised a "educational visit".)`, ENT);
      }
      // money trouble: three months in the red with the loan maxed out and the bank takes the park
      if (S.money < 0) {
        S.debtM++;
        if (S.debtM === 1) news('You\'re overdrawn! Sell something, raise prices or borrow more (Finances), or the bank will get cross.', null);
        else if (S.debtM >= 2 && S.loan >= 25000) news('The bank manager has written you a VERY stern letter. Your loan is maxed out: one more month in the red and he takes the park!', null);
        else if (S.debtM >= 2) news('Still overdrawn! Borrow some more from the bank (Finances) before it gets serious.', null);
      } else S.debtM = 0;
      autosave();
      // the demo stops after the first month
      if (G.demo && m >= 0) { S.speed = 0; S._demoOver = true; ui.refresh(); AS.clear(); G.demoEnd('The demo is only one month long. The full version has the whole season, six scenarios, the Jack Drop, loops, more scenery and Callum\'s park on the disc.'); return; }
      if (S.debtM >= 3 && S.loan >= 25000 && !S.result) { S.result = 'bust'; S.speed = 0; ui.refresh(); G.sfx('uhoh'); ui.endPanel('bust'); return; }
      // the objective (end of October, year 1)
      if (m === 7 && !S.result) {
        const ok = objProgress().every(p => p.ok);
        S.result = ok ? 'won' : 'failed'; S.speed = 0; ui.refresh();
        if (ok) { G.sfx('solve'); const won = G.load('won', {}); won[S.si] = 1; G.save('won', won); if (Object.keys(won).length >= SCENARIOS.length) G.secret('park.tycoon'); }
        else G.sfx('uhoh');
        ui.endPanel(S.result);
      }
    }

    // ================================================================ drawing (isometric, logical pixels)
    let cv = null, ctx = null, gcv = null, gctx = null, zoom = G.phone ? 1 : 2, camx = 0, camy = 0, VW = 300, VH = 200;
    const GM = 7, GOX = (N + 2 * GM) * 16 + 8, GOY = 2 * GM * 8 + 30, GW = GOX * 2, GH = GOY + (2 * N + 2 * GM) * 8 + 40;
    const sxw = (x, y) => (x - y) * 16, syw = (x, y, z) => (x + y) * 8 - z * LV;
    const PX = (x, y) => (x - y) * 16 - camx, PY = (x, y, z) => (x + y) * 8 - (z || 0) * LV - camy;
    function poly(c, pts, fill, stroke) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } }
    function box(x0, y0, w, h, z0, zh, top, left, right, line) {
      const z1 = z0 + zh;
      if (zh > 0) {
        poly(ctx, [PX(x0, y0 + h), PY(x0, y0 + h, z0), PX(x0 + w, y0 + h), PY(x0 + w, y0 + h, z0), PX(x0 + w, y0 + h), PY(x0 + w, y0 + h, z1), PX(x0, y0 + h), PY(x0, y0 + h, z1)], left, line);
        poly(ctx, [PX(x0 + w, y0), PY(x0 + w, y0, z0), PX(x0 + w, y0 + h), PY(x0 + w, y0 + h, z0), PX(x0 + w, y0 + h), PY(x0 + w, y0 + h, z1), PX(x0 + w, y0), PY(x0 + w, y0, z1)], right, line);
      }
      if (top) poly(ctx, [PX(x0, y0), PY(x0, y0, z1), PX(x0 + w, y0), PY(x0 + w, y0, z1), PX(x0 + w, y0 + h), PY(x0 + w, y0 + h, z1), PX(x0, y0 + h), PY(x0, y0 + h, z1)], top, line);
    }
    function cyl(cx, cy, r, z0, z1, top, side) {
      const X = PX(cx, cy), Y0 = PY(cx, cy, z0), Y1 = PY(cx, cy, z1), rx = r * 22.6, ry = r * 11.3;
      ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(X, Y0, rx, ry, 0, 0, Math.PI); ctx.lineTo(X - rx, Y1); ctx.ellipse(X, Y1, rx, ry, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      if (top) { ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(X, Y1, rx, ry, 0, 0, TAU); ctx.fill(); }
    }
    function line(x1, y1, x2, y2, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
    function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

    // the ground layer (grass, water, paths) is drawn once into an offscreen canvas
    function drawGround() {
      if (!gcv) { gcv = document.createElement('canvas'); gcv.width = GW; gcv.height = GH; gctx = gcv.getContext('2d'); }
      const c = gctx; c.clearRect(0, 0, GW, GH);
      const T = (x, y) => [GOX + sxw(x, y), GOY + syw(x, y, 0)];
      const dia = (x, y, fill, w2) => { const a = T(x, y), b = T(x + (w2 || 1), y), d = T(x + (w2 || 1), y + 1), e = T(x, y + 1); poly(c, [a[0], a[1], b[0], b[1], d[0], d[1], e[0], e[1]], fill); };
      const seg = (p1, p2, col, w) => { c.strokeStyle = col; c.lineWidth = w || 1; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); c.lineWidth = 1; };
      // the countryside outside the park (darker grass and woods), and the road past the gate
      const trees = [];
      for (let y = -GM; y < N + GM; y++) for (let x = -GM; x < N + GM; x++) {
        if (x >= 0 && y >= 0 && x < N && y < N) continue;
        if (y === N) { dia(x, y, (x & 1) ? '#5a5a5a' : '#555555'); if (x % 2 === 0) { const a = T(x + 0.3, N + 0.5), b = T(x + 0.7, N + 0.5); seg(a, b, '#e0e0a0'); } continue; }
        const v = hash(x + 99, y + 99);
        dia(x, y, (x + y) & 1 ? '#357220' : (v < 0.5 ? '#316c1e' : '#387622'));
        if (y === N + 1) continue;
        if ((x < 0 || y < 0 || x > N) && v > 0.62) trees.push([x, y, v]);
      }
      // the woods behind the park, drawn back to front
      trees.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([x, y, v]) => {
        const p = T(x + 0.5, y + 0.5), X = p[0] | 0, Y = p[1] | 0;
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(X + 2, Y, 8, 4, 0, 0, TAU); c.fill();
        c.fillStyle = '#4a2a10'; c.fillRect(X - 1, Y - 6, 3, 6);
        if (v > 0.8) { poly(c, [X, Y - 26, X - 8, Y - 10, X + 9, Y - 10], '#1a5a24'); poly(c, [X, Y - 20, X - 10, Y - 5, X + 11, Y - 5], '#1c6428'); poly(c, [X, Y - 26, X + 9, Y - 10, X + 2, Y - 10], '#123f18'); }
        else { [[0, -15, 8, '#24702a'], [-5, -11, 6, '#22682a'], [5, -11, 6, '#1e6024'], [1, -18, 5, '#2c802e']].forEach(([dx, dy, r, cc]) => { c.fillStyle = cc; c.beginPath(); c.arc(X + dx, Y + dy, r, 0, TAU); c.fill(); }); }
      });
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x;
        if (S.ground[i] === 1) {
          dia(x, y, (x + y) & 1 ? '#2a5ad0' : '#2a56c8');
          // sandy banks where the water meets the grass
          for (let dd = 0; dd < 4; dd++) { const nx = x + DX[dd], ny = y + DY[dd]; if (inB(nx, ny) && !S.ground[ny * N + nx]) { const p1 = dd === 0 ? T(x + 1, y) : dd === 1 ? T(x, y + 1) : T(x, y), p2 = dd === 0 ? T(x + 1, y + 1) : dd === 1 ? T(x + 1, y + 1) : dd === 2 ? T(x, y + 1) : T(x + 1, y); seg(p1, p2, '#d8c890', 2); } }
          continue;
        }
        const v = hash(x, y);
        dia(x, y, (x + y) & 1 ? '#4a9c2c' : (v < 0.5 ? '#46962a' : '#4c9e30'));
        if (v > 0.6) { const a = T(x + 0.3 + v * 0.3, y + 0.5); c.fillStyle = '#3a8a22'; c.fillRect(a[0] | 0, a[1] | 0, 1, 1); c.fillRect((a[0] | 0) + 4, (a[1] | 0) + 2, 1, 1); }
        if (v < 0.08) { const a = T(x + 0.5, y + 0.5); c.fillStyle = v < 0.04 ? '#fff' : '#ffd400'; c.fillRect(a[0] | 0, a[1] | 0, 1, 1); }
        if (S.path[i]) {
          const q = S.path[i] === 2;
          const a = T(x + 0.04, y + 0.04), b = T(x + 0.96, y + 0.04), d = T(x + 0.96, y + 0.96), e = T(x + 0.04, y + 0.96);
          poly(c, [a[0], a[1], b[0], b[1], d[0], d[1], e[0], e[1]], q ? '#7a90c0' : ((x + y) & 1 ? '#b0a080' : '#a89878'));
          if (!q && hash(x + 7, y) > 0.5) { const p = T(x + 0.3 + hash(x, y + 3) * 0.4, y + 0.5); c.fillStyle = '#988868'; c.fillRect(p[0] | 0, p[1] | 0, 2, 1); }
          if (q) { const m1 = T(x + 0.5, y + 0.25), m2 = T(x + 0.5, y + 0.75); c.fillStyle = '#9ab0e0'; c.fillRect(m1[0] | 0, m1[1] | 0, 2, 1); c.fillRect(m2[0] | 0, m2[1] | 0, 2, 1); }
          // kerbs where the path stops
          for (let dd = 0; dd < 4; dd++) {
            const nx = x + DX[dd], ny = y + DY[dd]; const j = ny * N + nx;
            if ((inB(nx, ny) && S.path[j]) || (i === ENT && dd === 1)) continue;
            const p1 = dd === 0 ? T(x + 1, y) : dd === 1 ? T(x, y + 1) : dd === 2 ? T(x, y) : T(x, y), p2 = dd === 0 ? T(x + 1, y + 1) : dd === 1 ? T(x + 1, y + 1) : dd === 2 ? T(x, y + 1) : T(x + 1, y);
            seg(p1, p2, q ? '#202040' : '#6a5a3a');
            if (q) { c.fillStyle = '#e8e8e8'; c.fillRect(p1[0] | 0, (p1[1] | 0) - 4, 1, 4); c.fillRect(p2[0] | 0, (p2[1] | 0) - 4, 1, 4); seg([p1[0], p1[1] - 3.5], [p2[0], p2[1] - 3.5], '#e02020'); }
          }
        }
      }
      // the park fence (with a gap for the gate)
      const fence = (p1, p2) => { seg([p1[0], p1[1] - 2], [p2[0], p2[1] - 2], '#5a3a1a'); seg([p1[0], p1[1] - 5], [p2[0], p2[1] - 5], '#8a5a2a'); c.fillStyle = '#6a4220'; c.fillRect((p1[0] | 0) - 1, (p1[1] | 0) - 7, 2, 7); };
      for (let k = 0; k < N; k++) {
        fence(T(0, k), T(0, k + 1)); fence(T(k, 0), T(k + 1, 0));
        fence(T(N, k), T(N, k + 1));
        if (k !== ENTX) fence(T(k, N), T(k + 1, N));
      }
      S._gdirty = false;
    }

    // ride, stall and scenery drawings. t = animation time
    function drawRide(o, t) {
      const w = o.w, cx = o.x + w / 2, cy = o.y + w / 2, run = o.st === 'run', rot = o.rot || 0, broken = o.st === 'broken';
      if (o.type === 'carousel') {
        cyl(cx, cy, 0.9, 0, 0.35, '#e0b060', '#8a6030');
        const sq = [];
        for (let k = 0; k < 8; k++) { const a = rot * 1.5 + k * TAU / 8; sq.push([Math.cos(a), Math.sin(a), k]); }
        sq.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
        const drawSq = ([c, s, k]) => { const x = cx + c * 0.62, y = cy + s * 0.62, bob = run ? Math.sin(t * 5 + k) * 0.25 : 0, X = PX(x, y); line(X, PY(x, y, 0.35), X, PY(x, y, 2.7), '#d8c040'); const Y = PY(x, y, 1.1 + bob), col = ['#ffffff', '#c08040', '#f0d8a0', '#606070'][k % 4], f = (k % 2) ? 1 : -1; rect(X - 4, Y - 2, 8, 4, col); rect(X + f * 3 - (f < 0 ? 1 : 0), Y - 5, 2, 4, col); rect(X + f * 4 - (f < 0 ? 1 : 0), Y - 5, 2, 2, col); rect(X - 3, Y + 2, 1, 2, col); rect(X + 2, Y + 2, 1, 2, col); rect(X - f * 4 - (f > 0 ? 0 : 1), Y - 2, 1, 3, '#402010'); rect(X - 1, Y - 3, 3, 1, k % 2 ? '#e02020' : '#2050e0'); };
        sq.filter(p => p[0] + p[1] < 0).forEach(drawSq);
        cyl(cx, cy, 0.16, 0.35, 2.8, '#ffe070', '#c09020');
        sq.filter(p => p[0] + p[1] >= 0).forEach(drawSq);
        cyl(cx, cy, 0.98, 2.6, 2.95, null, '#c01818');
        // striped cone roof
        const X = PX(cx, cy), Yb = PY(cx, cy, 2.95), Ya = PY(cx, cy, 4.5), rx = 0.98 * 22.6, ry = 0.98 * 11.3;
        for (let k = 0; k < 12; k++) { const a1 = k * TAU / 12 + rot * 0.2, a2 = a1 + TAU / 12; poly(ctx, [X, Ya, X + Math.cos(a1) * rx, Yb + Math.sin(a1) * ry, X + Math.cos(a2) * rx, Yb + Math.sin(a2) * ry], k % 2 ? '#ffd400' : '#e02020'); }
        line(X, Ya, X, Ya - 6, '#000'); poly(ctx, [X, Ya - 6, X + 5, Ya - 4.5, X, Ya - 3], '#2050e0');
      } else if (o.type === 'wheel') {
        box(o.x + 0.3, o.y + 0.3, 2.4, 2.4, 0, 0.15, '#909098', '#707078', '#606068');
        const X = PX(cx, cy), H = PY(cx, cy, 5.4), R = 31, a0 = rot * 0.6;
        const lX = PX(cx - 0.9, cy + 0.9), rX = PX(cx + 0.9, cy - 0.9), bY = PY(cx, cy, 0.15);
        line(lX - 3, bY, X, H, '#808090', 2); line(rX + 3, bY, X, H, '#808090', 2);
        ctx.strokeStyle = '#d0d0e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, H, R, 0, TAU); ctx.stroke(); ctx.lineWidth = 1;
        ctx.strokeStyle = '#b0b0c0'; ctx.beginPath(); ctx.arc(X, H, R - 7, 0, TAU); ctx.stroke();
        for (let k = 0; k < 8; k++) { const a = a0 + k * TAU / 8; line(X, H, X + Math.cos(a) * R, H + Math.sin(a) * R, '#a0a0b0'); }
        for (let k = 0; k < 8; k++) { const a = a0 + k * TAU / 8, gx = X + Math.cos(a) * R, gy = H + Math.sin(a) * R; line(gx, gy, gx, gy + 4, '#666'); rect(gx - 3, gy + 4, 7, 5, ['#e02020', '#2050e0', '#ffd400', '#20a020'][k % 4]); rect(gx - 2, gy + 5, 5, 1, '#fff'); if (run && (k + Math.floor(t * 4)) % 2) rect(gx, gy - 1, 1, 1, '#ff0'); }
        cyl(cx, cy, 0.12, 5.2, 5.6, '#ffd400', '#a08000');
        line(lX + 3, bY, X, H, '#9090a0', 2); line(rX - 3, bY, X, H, '#9090a0', 2);
      } else if (o.type === 'teacups') {
        cyl(cx, cy, 1.35, 0, 0.25, '#f0a0d0', '#a04080');
        for (let k = 0; k < 16; k++) { const a = k * TAU / 16; rect(PX(cx + Math.cos(a) * 1.15, cy + Math.sin(a) * 1.15), PY(cx + Math.cos(a) * 1.15, cy + Math.sin(a) * 1.15, 0.25), 1, 1, '#fff'); }
        const cups = [0, 1, 2, 3].map(k => { const a = rot * 1.2 + k * TAU / 4; return [Math.cos(a) * 0.72, Math.sin(a) * 0.72, k]; }).sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
        const col = ['#2070e0', '#ffd400', '#20b040', '#e04040'];
        const drawCup = ([dx, dy, k]) => { const x = cx + dx, y = cy + dy; cyl(x, y, 0.3, 0.25, 0.85, '#fff', col[k]); const sp = rot * 4 + k; const X = PX(x, y), Y = PY(x, y, 0.55); rect(X + Math.cos(sp) * 5 - 1, Y, 2, 4, '#fff'); ctx.fillStyle = '#5a2a10'; ctx.beginPath(); ctx.ellipse(X, PY(x, y, 0.85), 5, 2.5, 0, 0, TAU); ctx.fill(); };
        cups.filter(c => c[0] + c[1] < 0).forEach(drawCup);
        cyl(cx, cy, 0.3, 0.25, 1.1, '#fff0f8', '#e0c0d0'); rect(PX(cx, cy) - 1, PY(cx, cy, 1.5), 3, 3, '#e0c0d0');
        cups.filter(c => c[0] + c[1] >= 0).forEach(drawCup);
      } else if (o.type === 'haunted') {
        const x0 = o.x + 0.15, y0 = o.y + 0.15, s = 1.7;
        box(x0, y0, s, s, 0, 2.1, '#3a2048', '#4a3060', '#2e1a40', 'rgba(0,0,0,.4)');
        // pointy roof
        const ax = PX(cx, cy), ay = PY(cx, cy, 4.2);
        poly(ctx, [PX(x0 - 0.1, y0 + s + 0.1), PY(x0 - 0.1, y0 + s + 0.1, 2.1), PX(x0 + s + 0.1, y0 + s + 0.1), PY(x0 + s + 0.1, y0 + s + 0.1, 2.1), ax, ay], '#3a3a44');
        poly(ctx, [PX(x0 + s + 0.1, y0 - 0.1), PY(x0 + s + 0.1, y0 - 0.1, 2.1), PX(x0 + s + 0.1, y0 + s + 0.1), PY(x0 + s + 0.1, y0 + s + 0.1, 2.1), ax, ay], '#26262e');
        // windows and door on the front-left face
        const fl = (u, z) => [PX(x0 + u * s, y0 + s), PY(x0 + u * s, y0 + s, z)];
        const glow = 0.5 + 0.5 * Math.sin(t * (run ? 9 : 2) + o.id);
        [[0.2, 1.2], [0.7, 1.2]].forEach(([u, z]) => { const p = fl(u, z); rect(p[0], p[1] - 4, 4, 4, `rgba(255,${200 + glow * 55 | 0},40,${0.5 + glow * 0.5})`); });
        const dp = fl(0.45, 0.9); rect(dp[0], dp[1], 5, 7, '#100818');
        const fr = [PX(x0 + s, y0 + 0.5 * s), PY(x0 + s, y0 + 0.5 * s, 1.3)]; rect(fr[0] - 2, fr[1] - 3, 4, 4, `rgba(120,255,120,${0.3 + glow * 0.5})`);
        if (run || Math.sin(t * 0.7 + o.id) > 0.7) { const gx = ax + Math.sin(t * 2) * 8, gy = ay - 6 + Math.sin(t * 3) * 2; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(gx, gy, 4, Math.PI, 0); ctx.lineTo(gx + 4, gy + 5); ctx.lineTo(gx + 2, gy + 3); ctx.lineTo(gx, gy + 5); ctx.lineTo(gx - 2, gy + 3); ctx.lineTo(gx - 4, gy + 5); ctx.fill(); rect(gx - 2, gy - 1, 1, 2, '#000'); rect(gx + 1, gy - 1, 1, 2, '#000'); }
        line(PX(x0 + s * 0.85, y0 + s), PY(x0 + s * 0.85, y0 + s, 2.0), PX(x0 + s * 0.85, y0 + s), PY(x0 + s * 0.85, y0 + s, 0.4), '#606060');
      } else if (o.type === 'bumper') {
        box(o.x + 0.12, o.y + 0.12, 2.76, 2.76, 0, 0.2, '#4a4a58', '#3a3a44', '#2a2a34');
        const posts = [[0.12, 0.12], [2.88, 0.12], [0.12, 2.88], [2.88, 2.88]];
        posts.slice(0, 2).forEach(([u, v]) => line(PX(o.x + u, o.y + v), PY(o.x + u, o.y + v, 0.2), PX(o.x + u, o.y + v), PY(o.x + u, o.y + v, 2.8), '#c0c0c0', 2));
        const trukks = [];
        for (let k = 0; k < 5; k++) { const ph = k * 1.7 + o.id, sp = run ? 1 : 0.15; const u = 1.5 + Math.sin(t * 0.9 * sp + ph) * 1.0, v = 1.5 + Math.cos(t * 1.3 * sp + ph * 1.3) * 1.0; trukks.push([o.x + u, o.y + v, k]); }
        trukks.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
        trukks.forEach(([x, y, k]) => { box(x - 0.18, y - 0.18, 0.36, 0.36, 0.2, 0.3, ['#ff4040', '#40a0ff', '#ffd400', '#40d040', '#ff80ff'][k], '#333', '#222'); const X = PX(x, y), Y = PY(x, y, 0.5); line(X, Y, X, PY(x, y, 2.8), '#888'); rect(X - 1, Y - 3, 3, 2, '#f0c8a0'); if (run && Math.sin(t * 13 + k * 3) > 0.6) rect(X - 1, PY(x, y, 2.8) - 1, 3, 3, '#fff8a0'); });
        // the electric ceiling
        ctx.strokeStyle = 'rgba(200,200,220,.55)';
        for (let k = 0; k <= 4; k++) { const u = 0.12 + k * 0.69; ctx.beginPath(); ctx.moveTo(PX(o.x + u, o.y + 0.12), PY(o.x + u, o.y + 0.12, 2.8)); ctx.lineTo(PX(o.x + u, o.y + 2.88), PY(o.x + u, o.y + 2.88, 2.8)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(PX(o.x + 0.12, o.y + u), PY(o.x + 0.12, o.y + u, 2.8)); ctx.lineTo(PX(o.x + 2.88, o.y + u), PY(o.x + 2.88, o.y + u, 2.8)); ctx.stroke(); }
        posts.slice(2).forEach(([u, v]) => line(PX(o.x + u, o.y + v), PY(o.x + u, o.y + v, 0.2), PX(o.x + u, o.y + v), PY(o.x + u, o.y + v, 2.8), '#c0c0c0', 2));
        box(o.x + 0.05, o.y + 0.05, 2.9, 0.12, 2.8, 0.3, '#e02020', '#ffd400', '#c01010'); box(o.x + 0.05, o.y + 2.83, 2.9, 0.12, 2.8, 0.3, '#e02020', '#ffd400', '#c01010');
      } else if (o.type === 'drop') {
        box(o.x + 0.2, o.y + 0.2, 1.6, 1.6, 0, 0.25, '#a0a0a8', '#80808a', '#70707a');
        cyl(cx, cy, 0.2, 0.25, 11, '#d0d0d8', '#9a9aa8');
        for (let z = 1; z < 11; z += 1) rect(PX(cx, cy) - 4, PY(cx, cy, z), 9, 1, '#7a7a88');
        let hz = 0.6;
        if (run) { const f = o.t / RIDES.drop.dur; hz = f < 0.55 ? 0.6 + f / 0.55 * 9 : f < 0.68 ? 9.6 : f < 0.74 ? 9.6 - (f - 0.68) / 0.06 * 9 : 0.6; }
        cyl(cx, cy, 0.45, hz, hz + 0.55, '#ffd400', '#e02020');
        const X = PX(cx, cy), Y = PY(cx, cy, hz + 0.3); for (let k = -3; k <= 3; k++) rect(X + k * 3 - 1, Y - 2, 2, 2, o.riders.length > k + 3 ? '#f0c8a0' : '#802020');
        cyl(cx, cy, 0.3, 11, 11.6, '#ff4040', '#c01010'); if (Math.sin(t * 4) > 0) rect(X - 1, PY(cx, cy, 11.6) - 3, 3, 3, '#ff0');
      }
      else if (o.type === 'ship') {
        box(o.x + 0.1, o.y + 0.1, 2.8, 2.8, 0, 0.15, '#a08060', '#806040', '#705030');
        const amp = run ? Math.min(1.05, o.t / 5) * (o.t > RIDES.ship.dur - 3 ? Math.max(0, (RIDES.ship.dur - o.t) / 3) : 1) : 0.04;
        const th = amp * Math.sin(t * 1.9 + o.id);
        const frame = yy => { const by = cy + yy; line(PX(cx - 1.2, by), PY(cx - 1.2, by, 0.15), PX(cx, by), PY(cx, by, 4.3), '#5a3a1a', 2); line(PX(cx + 1.2, by), PY(cx + 1.2, by, 0.15), PX(cx, by), PY(cx, by, 4.3), '#5a3a1a', 2); line(PX(cx - 0.6, by), PY(cx - 0.6, by, 2.2), PX(cx + 0.6, by), PY(cx + 0.6, by, 2.2), '#6a4a2a'); };
        frame(-0.75);
        line(PX(cx, cy - 0.75), PY(cx, cy - 0.75, 4.3), PX(cx, cy + 0.75), PY(cx, cy + 0.75, 4.3), '#404040', 2);
        // the arms and the boat, swung by th (in the x/height plane; tiles: 1 tile of height = 2 levels)
        const W = (a, b) => { const u = Math.sin(th) * 1.7 + a * Math.cos(th) - b * Math.sin(th), hh = 2.15 - Math.cos(th) * 1.7 + a * Math.sin(th) + b * Math.cos(th); return [PX(cx + u, cy), PY(cx + u, cy, hh * 2)]; };
        const piv = [PX(cx, cy), PY(cx, cy, 4.3)], c0 = W(0, 0.25);
        line(piv[0], piv[1], c0[0], c0[1], '#909090', 2);
        const hull = [W(-1.0, 0.3), W(1.0, 0.3), W(0.6, -0.28), W(-0.6, -0.28)].flat();
        poly(ctx, hull, '#8a4a1a', '#3a1a00');
        const st = [W(-0.95, 0.22), W(0.95, 0.22), W(0.9, 0.12), W(-0.9, 0.12)].flat(); poly(ctx, st, '#ffd400');
        const m0 = W(0, 0.3), m1 = W(0, 1.15); line(m0[0], m0[1], m1[0], m1[1], '#3a1a00', 2);
        const f1 = W(0.05, 1.12), f2 = W(0.45, 1.0), f3 = W(0.05, 0.86); poly(ctx, [f1[0], f1[1], f2[0], f2[1], f3[0], f3[1]], '#101010'); rect((f1[0] + f2[0] + f3[0]) / 3 - 1, (f1[1] + f2[1] + f3[1]) / 3 - 1, 2, 2, '#fff');
        if (run) for (let k = 0; k < 6; k++) { const p = W(-0.75 + k * 0.3, 0.42); rect(p[0] - 1, p[1] - 1, 2, 2, ['#f0c8a0', '#e0b088', '#c08860'][k % 3]); if (Math.abs(th) > 0.8 && k % 2) rect(p[0] - 1, p[1] - 4, 1, 2, '#f0c8a0'); }
        frame(0.75);
      } else if (o.type === 'chairs') {
        cyl(cx, cy, 0.85, 0, 0.2, '#c0d0e0', '#8090a0');
        const spin = run ? Math.min(1, o.t / 3, Math.max(0, (RIDES.chairs.dur - o.t) / 3)) : 0;
        const ch = [];
        for (let k = 0; k < 10; k++) { const a = rot * 2.2 + k * TAU / 10; ch.push([Math.cos(a), Math.sin(a), k]); }
        ch.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
        const r0 = 0.55, r1 = 0.55 + 0.45 * spin, z1 = 1.3 + 0.7 * spin;
        const drawCh = ([c2, s2, k]) => { const ax = cx + c2 * r0, ay = cy + s2 * r0, bx = cx + c2 * r1, by = cy + s2 * r1; line(PX(ax, ay), PY(ax, ay, 3.6), PX(bx, by), PY(bx, by, z1), '#808080'); const X = PX(bx, by), Y = PY(bx, by, z1); rect(X - 2, Y, 4, 2, ['#e02020', '#2050e0', '#ffd400', '#20a020', '#e060a0'][k % 5]); if (run && o.riders.length > k) rect(X - 1, Y - 2, 2, 2, '#f0c8a0'); };
        ch.filter(p => p[0] + p[1] < 0).forEach(drawCh);
        cyl(cx, cy, 0.14, 0.2, 3.7, '#e0e0e0', '#a0a0b0');
        ch.filter(p => p[0] + p[1] >= 0).forEach(drawCh);
        const X = PX(cx, cy), Yb = PY(cx, cy, 3.6), Ya = PY(cx, cy, 4.9), rx = 0.62 * 22.6, ry = 0.62 * 11.3;
        for (let k = 0; k < 10; k++) { const a1 = k * TAU / 10 + rot * 2.2, a2 = a1 + TAU / 10; poly(ctx, [X, Ya, X + Math.cos(a1) * rx, Yb + Math.sin(a1) * ry, X + Math.cos(a2) * rx, Yb + Math.sin(a2) * ry], k % 2 ? '#40c0ff' : '#ffffff'); }
        rect(X - 1, Ya - 4, 2, 4, '#e02020');
      }
      if (!o.open || broken) {
        const X = PX(cx, cy), Y = PY(cx, cy, 0) - 6;
        if (broken) { const b = Math.sin(t * 8) > 0; rect(X - 9, Y - 10, 19, 9, b ? '#ffd400' : '#e02020'); ctx.fillStyle = '#000'; ctx.font = 'bold 7px Arial'; ctx.fillText('BUST', X - 8, Y - 3); }
        else if (o.k !== 'coaster' || o.tested) { rect(X - 13, Y - 9, 27, 9, '#e02020'); ctx.fillStyle = '#fff'; ctx.font = 'bold 7px Arial'; ctx.fillText('CLOSED', X - 12, Y - 2); }
      }
    }
    const STALL_ROOF = { burger: '#c06020', pop: '#2060d0', lolly: '#ff60a0', toilet: '#40a0a0', info: '#ffd400', chips: '#e0c020', floss: '#ff90d0', hats: '#8040c0', cash: '#208040' };
    function drawStall(o, t) {
      const x0 = o.x + 0.16, y0 = o.y + 0.16;
      box(x0, y0, 0.68, 0.68, 0, 1.1, '#e8dcc0', '#f0e4c8', '#c8b898');
      const p = [PX(x0 + 0.34, y0 + 0.68), PY(x0 + 0.34, y0 + 0.68, 0.75)];
      rect(p[0] - 4, p[1] - 3, 8, 4, '#3a2010');
      box(o.x + 0.08, o.y + 0.08, 0.84, 0.84, 1.1, 0.2, STALL_ROOF[o.type], '#000', '#202020');
      for (let k = 0; k < 4; k++) { const u = o.x + 0.08 + k * 0.21; poly(ctx, [PX(u, o.y + 0.92), PY(u, o.y + 0.92, 1.1), PX(u + 0.105, o.y + 0.92), PY(u + 0.105, o.y + 0.92, 1.1), PX(u + 0.105, o.y + 0.92), PY(u + 0.105, o.y + 0.92, 1.3), PX(u, o.y + 0.92), PY(u, o.y + 0.92, 1.3)], '#fff'); }
      const X = PX(o.x + 0.5, o.y + 0.5), Y = PY(o.x + 0.5, o.y + 0.5, 1.3) - 4;
      if (o.type === 'burger') { rect(X - 5, Y - 4, 10, 2, '#d08030'); rect(X - 5, Y - 2, 10, 1, '#30a020'); rect(X - 5, Y - 1, 10, 2, '#6a2a10'); rect(X - 5, Y + 1, 10, 2, '#d08030'); }
      else if (o.type === 'pop') { poly(ctx, [X - 4, Y - 5, X + 4, Y - 5, X + 3, Y + 4, X - 3, Y + 4], '#e02020'); rect(X - 4, Y - 2, 8, 2, '#fff'); line(X + 1, Y - 5, X + 3, Y - 9, '#fff'); }
      else if (o.type === 'lolly') { poly(ctx, [X - 3, Y - 6, X + 3, Y - 6, X + 2, Y + 2, X - 2, Y + 2], '#ff8020'); rect(X - 2, Y - 6, 4, 3, '#ff3030'); rect(X - 2, Y - 1, 4, 3, '#ffd400'); rect(X, Y + 2, 1, 3, '#d0a060'); }
      else if (o.type === 'toilet') { rect(X - 7, Y - 5, 14, 9, '#fff'); ctx.fillStyle = '#2050c0'; ctx.font = 'bold 8px Arial'; ctx.fillText('WC', X - 6, Y + 3); }
      else if (o.type === 'chips') { poly(ctx, [X - 4, Y - 2, X + 4, Y - 2, X, Y + 5], '#f0f0f0', '#808080'); for (let k = 0; k < 5; k++) rect(X - 4 + k * 2, Y - 6 + (k % 2), 1, 4, '#ffd040'); }
      else if (o.type === 'floss') { ctx.fillStyle = '#ffa0e0'; ctx.beginPath(); ctx.arc(X - 2, Y - 3, 3.5, 0, TAU); ctx.arc(X + 2, Y - 4, 3.5, 0, TAU); ctx.arc(X, Y - 6, 3, 0, TAU); ctx.fill(); rect(X, Y, 1, 5, '#f0e0c0'); }
      else if (o.type === 'hats') { rect(X - 5, Y + 1, 11, 2, '#202020'); rect(X - 3, Y - 6, 7, 7, '#202020'); rect(X - 3, Y - 1, 7, 1, '#e02020'); }
      else if (o.type === 'cash') { rect(X - 5, Y - 5, 10, 9, '#d0d0d0'); rect(X - 4, Y - 4, 8, 4, '#103040'); rect(X - 3, Y - 3, 3, 2, '#40ff80'); rect(X - 3, Y + 2, 6, 1, '#000'); poly(ctx, [X + 2, Y - 4, X + 4, Y - 2.5, X + 2, Y - 1, X + 0, Y - 2.5], '#20c040'); }
      else if (o.type === 'info') { rect(X - 4, Y - 4, 8, 8, '#2050e0'); rect(X - 1, Y - 3, 2, 1, '#fff'); rect(X - 1, Y - 1, 2, 4, '#fff'); [['#e02020', -5, -12], ['#20c020', 2, -14], ['#ffd400', 6, -10]].forEach(([c2, dx, dy]) => { line(X, Y - 4, X + dx, Y + dy + 3, '#444'); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(X + dx, Y + dy + Math.sin(t * 2 + dx) * 0.8, 2.5, 0, TAU); ctx.fill(); }); }
    }
    function drawScen(o, t) {
      const X = PX(o.x + 0.5, o.y + 0.5), Y = PY(o.x + 0.5, o.y + 0.5, 0);
      if (o.type === 'pine') { rect(X - 1, Y - 5, 3, 5, '#5a3a1a'); poly(ctx, [X, Y - 26, X - 7, Y - 12, X + 8, Y - 12], '#1a6a2a'); poly(ctx, [X, Y - 20, X - 9, Y - 6, X + 10, Y - 6], '#1e7a30'); poly(ctx, [X, Y - 26, X + 8, Y - 12, X + 2, Y - 12], '#14501e'); poly(ctx, [X, Y - 20, X + 10, Y - 6, X + 3, Y - 6], '#165a22'); }
      else if (o.type === 'oak') { rect(X - 1, Y - 8, 3, 8, '#6a4220'); [[0, -16, 8, '#2a8a2a'], [-5, -12, 6, '#2a8a2a'], [5, -12, 6, '#227a22'], [1, -19, 5, '#3a9a3a'], [-2, -15, 4, '#48aa40']].forEach(([dx, dy, r, c2]) => { ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(X + dx, Y + dy, r, 0, TAU); ctx.fill(); }); }
      else if (o.type === 'flowers') { for (let k = 0; k < 14; k++) { const u = hash(o.x * 3 + k, o.y), v = hash(o.y * 5 + k, o.x); const fx = PX(o.x + 0.15 + u * 0.7, o.y + 0.15 + v * 0.7), fy = PY(o.x + 0.15 + u * 0.7, o.y + 0.15 + v * 0.7, 0); rect(fx, fy - 2, 1, 2, '#1a6a1a'); rect(fx - 1, fy - 3, 2, 2, ['#ff3030', '#ffd400', '#ff80ff', '#ffffff', '#ff8020'][k % 5]); } }
      else if (o.type === 'hedge') box(o.x + 0.06, o.y + 0.06, 0.88, 0.88, 0, 0.9, '#3a9a3a', '#2a7a2a', '#1a5a1a');
      else if (o.type === 'fountain') { cyl(o.x + 0.5, o.y + 0.5, 0.42, 0, 0.3, '#3a70e0', '#a0a0b0'); for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + t, r = 3 + ((t * 20 + k * 7) % 5); rect(X + Math.cos(a) * r, Y - 3 - 6 + Math.sin(t * 6 + k) * 2, 1, 1, '#d0e8ff'); } line(X, Y - 3, X, Y - 12 - Math.sin(t * 5) * 2, '#d0e8ff', 2); rect(X - 1, Y - 14 - Math.sin(t * 5) * 2, 3, 2, '#fff'); }
      else if (o.type === 'palm') { const sw = Math.sin(t * 1.5 + o.x) * 0.8; line(X, Y, X + 3, Y - 10, '#8a6030', 2); line(X + 3, Y - 10, X + 2 + sw, Y - 20, '#8a6030', 2); [[-9, -16], [9, -17], [-6, -23], [7, -24], [0, -26]].forEach(([dx, dy]) => { ctx.strokeStyle = '#2a9a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 2 + sw, Y - 20); ctx.quadraticCurveTo(X + 2 + sw + dx * 0.5, Y - 24, X + 2 + sw + dx, Y + dy + 4); ctx.stroke(); }); ctx.lineWidth = 1; rect(X + 1 + sw, Y - 20, 2, 2, '#6a4010'); rect(X + 3 + sw, Y - 19, 2, 2, '#6a4010'); }
      else if (o.type === 'gnome') { rect(X - 2, Y - 4, 5, 4, '#2050e0'); rect(X - 2, Y - 7, 5, 3, '#f0c8a0'); rect(X - 2, Y - 5, 5, 2, '#fff'); poly(ctx, [X - 3, Y - 7, X + 4, Y - 7, X + 0.5, Y - 14], '#e02020'); rect(X + 3, Y - 6, 1, 6, '#8a5a2a'); }
      else if (o.type === 'bunny') { box(o.x + 0.2, o.y + 0.2, 0.6, 0.6, 0, 0.4, '#3a9a3a', '#2a7a2a', '#1a5a1a'); ctx.fillStyle = '#3aa03a'; ctx.beginPath(); ctx.arc(X, Y - 10, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(X + 3, Y - 16, 3.5, 0, TAU); ctx.fill(); rect(X + 1, Y - 25, 2, 7, '#2a8a2a'); rect(X + 4, Y - 24, 2, 6, '#2a8a2a'); rect(X - 5, Y - 10, 2, 2, '#4ab04a'); }
      else if (o.type === 'clock') { cyl(o.x + 0.5, o.y + 0.5, 0.45, 0, 0.12, '#3a9a3a', '#2a6a2a'); for (let k = 0; k < 12; k++) { const a = k * TAU / 12; rect(X + Math.cos(a) * 8, Y - 1 + Math.sin(a) * 4, 1, 1, ['#ff3030', '#ffd400', '#fff'][k % 3]); } const hm = (S.day % 1) * TAU, hh = hm / 12; line(X, Y - 1, X + Math.cos(hm - 1.57) * 7, Y - 1 + Math.sin(hm - 1.57) * 3.5, '#000'); line(X, Y - 1, X + Math.cos(hh - 1.57) * 4, Y - 1 + Math.sin(hh - 1.57) * 2, '#000', 2); }
      else if (o.type === 'statue') { box(o.x + 0.25, o.y + 0.25, 0.5, 0.5, 0, 0.7, '#c0c0c0', '#a0a0a0', '#808080'); const sy = PY(o.x + 0.5, o.y + 0.5, 0.7) - 6; ctx.fillStyle = '#d02020'; ctx.beginPath(); ctx.arc(X, sy, 6.5, 0, TAU); ctx.fill(); rect(X - 4, sy + 1, 9, 2, '#fff'); for (let k = 0; k < 4; k++) rect(X - 4 + k * 2, sy + 3, 1, 1, '#fff'); rect(X - 3, sy - 4, 2, 2, '#ffd400'); rect(X + 2, sy - 4, 2, 2, '#ffd400'); }
    }
    function drawGate(t) {
      const x = ENTX, y = ENTY;
      box(x - 0.1, y + 0.35, 0.22, 0.3, 0, 3.2, '#e0e0e0', '#c8c8c8', '#a0a0a0');
      box(x + 0.88, y + 0.35, 0.22, 0.3, 0, 3.2, '#e0e0e0', '#c8c8c8', '#a0a0a0');
      box(x - 0.35, y + 0.42, 1.7, 0.16, 2.3, 1.1, '#c01010', '#e02020', '#a01010');
      ctx.save(); ctx.font = 'bold 7px Arial'; const tw = ctx.measureText('ROLLERJACK').width, sc = 25 / tw;
      ctx.setTransform(sc, 0.5 * sc, 0, 1, PX(x - 0.28, y + 0.58), PY(x - 0.28, y + 0.58, 2.5)); ctx.fillStyle = Math.sin(t * 3) > -0.6 ? '#ffd400' : '#fff'; ctx.fillText('ROLLERJACK', 0, 0); ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!S.open) { const X = PX(x + 0.5, y + 0.5), Y = PY(x + 0.5, y + 0.5, 0); rect(X - 12, Y - 8, 25, 7, '#e02020'); ctx.fillStyle = '#fff'; ctx.font = 'bold 6px Arial'; ctx.fillText('CLOSED', X - 11, Y - 2); }
    }
    function drawPiece(co, p, k) {
      const sel = ui && ui.sel === co.id;
      const NS = p.t === 'lp' ? 28 : 4;
      const pts = []; for (let f = 0; f <= NS; f++) pts.push(piecePoint(p, f / NS, { x: 0, y: 0, z: 0, tx: 0, ty: 0 }));
      // supports
      const mid = p.t === 'lp' ? { x: p.x + 0.5, y: p.y + 0.5, z: p.h } : pts[2];
      if (p.t === 'lp') { const X = PX(p.x + 0.5, p.y + 0.5); for (const dz of [0, 1]) line(X - 4 + dz * 8, PY(p.x + 0.5, p.y + 0.5, p.h), X, PY(p.x + 0.5, p.y + 0.5, p.h + LOOPH * 2), '#9898a8'); }
      if (mid.z > 0) { const X = PX(mid.x, mid.y); line(X, PY(mid.x, mid.y, 0), X, PY(mid.x, mid.y, mid.z), '#9898a8', 2); if (mid.z > 2) line(X - 3, PY(mid.x, mid.y, mid.z * 0.5), X + 3, PY(mid.x, mid.y, mid.z * 0.5), '#9898a8'); rect(X - 2, PY(mid.x, mid.y, 0) - 1, 5, 2, '#707080'); }
      if (p.t === 'st') {
        box(p.x + 0.04, p.y + 0.04, 0.92, 0.92, 0, 0.3, '#b0b0b0', '#909090', '#787878');
        const sx2 = p.x + 0.5 - DY[p.d] * 0.42, sy2 = p.y + 0.5 + DX[p.d] * 0.42;
        line(PX(sx2, sy2), PY(sx2, sy2, 0.3), PX(sx2, sy2), PY(sx2, sy2, 2.4), '#606060', 2);
        if (DX[p.d]) box(p.x, sy2 - 0.12, 1, 0.24, 2.4, 0.18, k % 2 ? '#2050e0' : '#f0f0f0', '#1838a0', '#102870'); else box(sx2 - 0.12, p.y, 0.24, 1, 2.4, 0.18, k % 2 ? '#2050e0' : '#f0f0f0', '#1838a0', '#102870');
      }
      const z0 = p.t === 'st' ? 0.3 : 0;
      for (let f = 0; f <= NS; f++) { const q = pts[f]; const nx = -q.ty * 0.13, ny = q.tx * 0.13; line(PX(q.x + nx, q.y + ny), PY(q.x + nx, q.y + ny, q.z + z0), PX(q.x - nx, q.y - ny), PY(q.x - nx, q.y - ny, q.z + z0), '#7a5a3a'); }
      const bad = co.fail === k && Math.sin(S.time * 10) > 0;
      const col = bad ? '#ffffff' : sel ? '#ffff40' : (co.col || '#e02828');
      for (const sgn of [1, -1]) { ctx.strokeStyle = col; ctx.lineWidth = bad ? 2 : 1; ctx.beginPath(); pts.forEach((q, f) => { const nx = -q.ty * 0.12 * sgn, ny = q.tx * 0.12 * sgn, X = PX(q.x + nx, q.y + ny), Y = PY(q.x + nx, q.y + ny, q.z + z0) - 1; if (f) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); }
      ctx.lineWidth = 1;
      if (p.t === 'ch') pts.forEach((q, f) => { if (f % 1 === 0) rect(PX(q.x, q.y), PY(q.x, q.y, q.z) - 2, 1, 1, (Math.floor(S.time * 6) + f) % 2 ? '#202020' : '#808080'); });
    }
    function drawCar(co, s, k) {
      const q = trackAt(co, s, { x: 0, y: 0, z: 0, tx: 0, ty: 0 });
      const p = co.pieces[q.pi], z = q.z + (p.t === 'st' ? 0.3 : 0) + 0.15;
      const tx = q.tx * 0.2, ty = q.ty * 0.2, nx = -q.ty * 0.13, ny = q.tx * 0.13;
      const c = [[tx + nx, ty + ny], [tx - nx, ty - ny], [-tx - nx, -ty - ny], [-tx + nx, -ty + ny]];
      const inv = q.inv ? -1 : 1, zt = z + 0.35 * inv;
      poly(ctx, c.flatMap(([a, b]) => [PX(q.x + a, q.y + b), PY(q.x + a, q.y + b, z)]), '#1840c0');
      poly(ctx, c.flatMap(([a, b]) => [PX(q.x + a, q.y + b), PY(q.x + a, q.y + b, zt)]), k === 0 ? '#ffd400' : '#2a60e0');
      const X = PX(q.x, q.y), Y = PY(q.x, q.y, zt);
      if ((co.st === 'run' && co.riders.length > k * 4) || (V && co.st === 'run')) { const hy = inv < 0 ? Y + 1 : Y - 3; rect(X - 2, hy, 2, 2, '#f0c8a0'); rect(X + 1, hy, 2, 2, '#e0b088'); if (co.ts && co._fast && inv > 0) { rect(X - 3, Y - 5, 1, 2, '#f0c8a0'); rect(X + 3, Y - 5, 1, 2, '#e0b088'); } }
    }
    function drawPerson(x, y, shirt, skin, leg, ph, extra, hz) {
      const X = Math.round(PX(x, y)), Y = Math.round(PY(x, y, hz || 0));
      const st = Math.sin(ph) > 0;
      rect(X - 1, Y - 3, 1, 3, leg); rect(X + 1, Y - 3, 1, 3, leg); if (st) rect(X - 1, Y - 1, 1, 1, '#000'); else rect(X + 1, Y - 1, 1, 1, '#000');
      rect(X - 1, Y - 6, 3, 3, shirt); rect(X - 1, Y - 8, 3, 2, skin);
      if (extra) extra(X, Y);
      return [X, Y];
    }
    function drawGuest(g) {
      const sick = g.nausea > 60;
      const rain = S.wx && S.wx.k === 'rain';
      const [X, Y] = drawPerson(g.x, g.y, g.shirt, sick ? '#8ad070' : g.skin, g.leg, g.ph, (X2, Y2) => {
        if (g.hat) { rect(X2 - 2, Y2 - 9, 5, 1, g.hat); rect(X2 - 1, Y2 - 11, 3, 2, g.hat); }
        if (g.umb && rain) { line(X2 + 2, Y2 - 5, X2 + 2, Y2 - 12, '#333'); poly(ctx, [X2 - 3, Y2 - 12, X2 + 7, Y2 - 12, X2 + 2, Y2 - 16], g.bcol); }
        else if (g.item === 'balloon') { line(X2 + 2, Y2 - 6, X2 + 3, Y2 - 13, '#555'); ctx.fillStyle = g.bcol; ctx.beginPath(); ctx.arc(X2 + 3, Y2 - 15, 2.5, 0, TAU); ctx.fill(); }
      });
      if (g.st === 'sit') rect(X - 1, Y - 3, 3, 1, '#7a5a3a');
      if (ui.selG === g.id) { poly(ctx, [X - 3, Y - 16, X + 3, Y - 16, X, Y - 12], '#ffff00', '#000'); }
      else if (opts.bubbles && g.bub > 0) { rect(X - 4, Y - 17, 9, 7, '#fff'); rect(X - 4, Y - 17, 9, 1, '#000'); rect(X - 4, Y - 11, 9, 1, '#000'); rect(X - 4, Y - 17, 1, 7, '#000'); rect(X + 4, Y - 17, 1, 7, '#000'); rect(X - 1, Y - 10, 2, 1, '#000'); rect(X - 1, Y - 15, 3, 3, g.bubc); }
    }
    function drawStaff(s) {
      const handy = s.k === 'handy';
      drawPerson(s.x, s.y, handy ? '#2050e0' : '#ff8020', handy ? '#e0b088' : '#f0c8a0', handy ? '#203060' : '#303030', s.ph, (X, Y) => {
        if (handy) { rect(X - 1, Y - 9, 3, 1, '#2050e0'); const sw = s.st === 'work' ? Math.sin(s.ph * 3) * 2 : 0; line(X + 2, Y - 5, X + 4 + sw, Y, '#8a5a2a'); rect(X + 3 + sw, Y - 1, 3, 1, '#d0b060'); }
        else { rect(X - 1, Y - 9, 3, 1, '#ffd400'); const sw = s.st === 'work' ? Math.sin(s.ph * 4) * 2 : 0; line(X + 2, Y - 5, X + 5, Y - 7 + sw, '#a0a0a0'); }
      });
    }
    function drawLitter(i) {
      const n = S.litter[i]; if (!n) return;
      const x = i % N, y = (i / N) | 0;
      for (let k = 0; k < n; k++) { const u = hash(x * 7 + k, y * 3), v = hash(y * 5 + k, x * 11); rect(PX(x + 0.2 + u * 0.6, y + 0.2 + v * 0.6), PY(x + 0.2 + u * 0.6, y + 0.2 + v * 0.6, 0), 2, 1, ['#fff', '#e02020', '#ffd400', '#8ad070'][k % 4]); }
    }
    function drawFurn(i, t) {
      const f = S.furn[i], x = i % N, y = (i / N) | 0;
      if (f === 1) { box(x + 0.62, y + 0.15, 0.22, 0.6, 0, 0.25, '#a07040', '#7a5030', '#5a3a20'); }
      else if (f === 2) { cyl(x + 0.82, y + 0.2, 0.09, 0, 0.45, '#103010', '#20702a'); }
      else if (f === 3) { const X = PX(x + 0.85, y + 0.85), Y = PY(x + 0.85, y + 0.85, 0); line(X, Y, X, Y - 16, '#202020'); rect(X - 1, Y - 19, 3, 3, '#fff8a0'); }
    }

    // ================================================================ the UI
    function buildUI() {
      root.innerHTML = '';
      const tb = document.createElement('div'); tb.className = 'dg-park-tb';
      const view = document.createElement('div'); view.className = 'dg-park-view';
      const bar = document.createElement('div'); bar.className = 'dg-park-bar';
      root.append(tb, view, bar);
      cv = document.createElement('canvas'); cv.className = 'dg-park-cv'; view.appendChild(cv); ctx = cv.getContext('2d');
      const wins = document.createElement('div'); wins.className = 'dg-park-wins'; view.appendChild(wins);
      const hintEl = document.createElement('div'); hintEl.className = 'dg-park-hint'; hintEl.hidden = true; view.appendChild(hintEl);
      const U = { tool: 'look', sel: 0, selG: 0, hover: -1, stDir: 0, wins: {}, dd: null, follow: 0, tb, view };
      const B = (key, icon, tip, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'dg-park-b' + (cls ? ' ' + cls : ''); b.innerHTML = icon; b.title = tip; b.dataset.k = key; b.setAttribute('aria-label', tip); b.addEventListener('click', ev => { ev.stopPropagation(); G.sfx('click'); fn(b); }); tb.appendChild(b); return b; };
      const sep = () => { const s = document.createElement('span'); s.className = 'dg-park-sep'; tb.appendChild(s); };
      const setTool = t => {
        if (V) t = 'look';
        U.tool = t; closeDD();
        tb.querySelectorAll('.dg-park-b[data-k]').forEach(b => { const k = b.dataset.k; if (/^s\d$/.test(k)) return; b.classList.toggle('on', k === t.split(':')[0]); });
        const H = { look: '', path: `Click or drag on the grass to lay path (${money(10)} a slab). Join it to the paths you've already got!`, queue: `Lay a queue line from a path right up to the side of a ride (${money(12)} a slab)`, bull: 'Click something to demolish it. Drag to clear paths and scenery.', coaster: '' };
        const [k, ty] = t.split(':');
        if (k === 'ride') hint(`Click the grass where the ${RIDES[ty].n} should go (${RIDES[ty].w}x${RIDES[ty].w} tiles, ${money(RIDES[ty].cost)}). Green = OK.`, 0, true);
        else if (k === 'stall') hint(`Click a grass tile next to a path for the ${STALLS[ty].n} (${money(STALLS[ty].cost)})`, 0, true);
        else if (k === 'scen') hint(`Click to place: ${SCEN[ty].n} (${money(SCEN[ty].cost)})${SCEN[ty].path ? ' on a path' : ''}`, 0, true);
        else if (k === 'coaster') { coasterWin(); }
        else hint(H[k] || '', 0, true);
      };
      U.setTool = setTool;
      const dropdown = (btn, items) => {
        closeDD(); const dd = document.createElement('div'); dd.className = 'dg-park-dd';
        items.forEach(it => { const b = document.createElement('button'); b.type = 'button'; if (it.tip) b.title = it.tip; b.innerHTML = `${it.icon || ''}<span>${esc(it.n)}${it.tag ? `<span class="dg-park-tag">${esc(it.tag)}</span>` : ''}</span><small>${it.c || ''}</small>`; b.addEventListener('click', ev => { ev.stopPropagation(); G.sfx('click'); closeDD(); it.act(); }); dd.appendChild(b); });
        dd.addEventListener('pointerdown', ev => ev.stopPropagation());
        view.appendChild(dd);
        const r = btn.getBoundingClientRect(), vr = view.getBoundingClientRect();
        dd.style.left = Math.max(2, Math.min(vr.width - dd.offsetWidth - 2, r.left - vr.left)) + 'px'; dd.style.top = '2px';
        dd.style.maxHeight = (vr.height - 6) + 'px'; dd.style.overflow = 'auto';
        U.dd = dd;
        const f = dd.querySelector('button'); if (f && !G.touch) try { f.focus({ preventScroll: true }); } catch (e) {}
      };
      function closeDD() { if (U.dd) { U.dd.remove(); U.dd = null; } }
      const thrill = r => r.i >= 6 ? 'Thrill' : r.i >= 3 ? 'Lively' : 'Gentle';
      if (!V) {
        B('look', IC.look, 'Look: click things to see them (Esc)', () => setTool('look'));
        B('path', IC.path, 'Paths (P)', () => setTool('path'));
        B('queue', IC.queue, 'Queue lines (J)', () => setTool('queue'));
        B('ride', IC.ride, 'Rides (R)', b => dropdown(b, Object.keys(RIDES).map(k => ({ n: RIDES[k].n, tag: thrill(RIDES[k]) + (RIDES[k].cov ? ', roof' : ''), c: gemH(RIDES[k].cost), icon: IC.ride, tip: RIDES[k].d, act: () => setTool('ride:' + k) }))));
        B('stall', IC.stall, 'Shops and stalls (K)', b => dropdown(b, Object.keys(STALLS).map(k => ({ n: STALLS[k].n, c: gemH(STALLS[k].cost), icon: IC.stall, tip: STALLS[k].d, act: () => setTool('stall:' + k) }))));
        B('scen', IC.scen, 'Scenery and path extras (S)', b => dropdown(b, Object.keys(SCEN).map(k => ({ n: SCEN[k].n, c: gemH(SCEN[k].cost), icon: IC.scen, act: () => setTool('scen:' + k) }))));
        B('coaster', IC.coaster, 'Build a rollercoaster (C)', () => setTool('coaster'));
        B('staff', IC.staff, 'Staff: hire handymen and mechanics (H)', () => staffWin());
        B('bull', IC.bull, 'Demolish (B)', () => setTool('bull'));
        B('undo', IC.undo, 'Undo the last thing you built, with a full refund (Ctrl+Z)', () => undoBuild());
        sep();
      } else B('look', IC.look, 'Look: click guests and rides', () => setTool('look'));
      B('park', IC.park, V ? 'About this park (O)' : 'Park entrance, entry fee, rating and objective (O)', () => parkWin());
      if (!V) B('fin', IC.fin, 'Finances (F)', () => finWin());
      B('guests', IC.guests, 'Guests and what they think (G)', () => guestsWin());
      B('msgs', IC.msgs, 'Recent messages (M)', () => msgsWin());
      sep();
      const sb = [B('s0', IC.pause, 'Pause (Space)', () => setSpeed(0)), B('s1', IC.sf(1), 'Normal speed (1)', () => setSpeed(1)), B('s2', IC.sf(2), 'Fast (2)', () => setSpeed(2)), B('s4', IC.sf(3), 'Very fast (3)', () => setSpeed(4))];
      B('zoom', IC.zoom, 'Zoom (+ and -)', () => { zoom = zoom >= 2 ? 1 : 2; resize(); });
      function setSpeed(v) { S.speed = v; refreshSpeed(); }
      function refreshSpeed() { sb.forEach((b, k) => b.classList.toggle('on', [0, 1, 2, 4][k] === S.speed)); }
      U.refreshSpeed = refreshSpeed;
      // the status bar
      bar.innerHTML = (V ? '' : '<span class="dg-park-f" data-f="m" title="Cash in the bank"></span>') + '<span class="dg-park-f" data-f="g" title="Guests in the park"></span><span class="dg-park-f" data-f="r" title="Park rating (out of 999)"></span><span class="dg-park-f wx" data-f="d" title="Date and weather"></span>' + (V ? '' : '<span class="dg-park-f goal" data-f="o" title="Your objective: click for details"></span>') + '<span class="dg-park-news" data-f="n" title="Latest message: click for all of them"></span>';
      const F = k => bar.querySelector(`[data-f="${k}"]`);
      F('n').addEventListener('click', () => { const n = S.news[0]; if (n && n.loc >= 0) centreOn(n.loc % N + 0.5, ((n.loc / N) | 0) + 0.5); msgsWin(); });
      if (F('o')) F('o').addEventListener('click', () => parkWin());
      const setH = (el, h) => { if (el && el._h !== h) { el._h = h; el.innerHTML = h; } };
      function refreshBar() {
        if (F('m')) { setH(F('m'), gemH(S.money, 12)); F('m').classList.toggle('neg', S.money < 0); }
        setH(F('g'), S.guests.length + ' guests'); setH(F('r'), 'Rating ' + S.rating);
        setH(F('d'), (WXI[S.wx.k] || '') + esc(dateStr()));
        F('d').title = `${WX[S.wx.k].n}. ${dateStr()}`;
        if (F('o')) {
          const pr = objProgress();
          setH(F('o'), S.result === 'won' ? '<b>Objective achieved!</b>' : S.result ? '<b>Objective failed</b>' : '<b>Goal:</b> ' + pr.map(p => `${p.ok ? '&#10004;' : ''}${p.rp ? p.have.toLocaleString('en-GB') : p.have}/${p.rp ? p.want.toLocaleString('en-GB') : p.want} ${p.n}`).join(', ') + ` (${monthsLeft()} month${monthsLeft() === 1 ? '' : 's'} left)`);
        }
      }
      function showNews() { const n = S.news[0]; F('n').innerHTML = n ? `<b>${esc(n.d)}:</b> ${esc(n.t)}` : (V ? '<b>Welcome!</b> You\'re visiting. Click guests to see what they think.' : '<b>Welcome!</b> Open your park from the Park window (the gate button).'); }
      let hintT = 0;
      function hint(t, bad, sticky) { hintEl.hidden = !t; hintEl.textContent = t; hintEl.style.color = bad ? '#ff8080' : '#ff0'; clearTimeout(hintT); if (t && !sticky) hintT = setTimeout(() => { hintEl.hidden = true; }, 3500); }
      G.onClose(() => clearTimeout(hintT));

      // ---- windows
      function win(key, titleTxt, render, o) {
        o = o || {};
        let W = U.wins[key];
        if (!W) {
          // keep the clutter down: one ride/shop window at a time, and at most three windows
          Object.keys(U.wins).forEach(k2 => { if (k2[0] === 'o' && key[0] === 'o') closeWin(k2); });
          const ks = Object.keys(U.wins); if (G.phone) ks.forEach(closeWin); else if (ks.length >= 3) closeWin(ks[0]);
          const el = document.createElement('div'); el.className = 'dg-park-win'; el.dataset.w = key;
          el.innerHTML = `<div class="dg-park-wt"><span></span><button type="button" aria-label="Close" title="Close">x</button></div><div class="dg-park-wb"></div>`;
          wins.appendChild(el);
          const used = new Set(Object.values(U.wins).map(x => x.slot)); let n = 0; while (used.has(n)) n++;
          el.style.width = (o.w || 250) + 'px';
          el.style.right = (6 + n * 18) + 'px'; el.style.top = ((V ? 32 : 6) + n * 26) + 'px';
          W = U.wins[key] = { el, body: el.querySelector('.dg-park-wb'), render, last: '', key, slot: n };
          el.querySelector('.dg-park-wt button').addEventListener('click', () => { G.sfx('click'); closeWin(key); });
          el.addEventListener('pointerdown', ev => { ev.stopPropagation(); if (el.nextSibling) wins.appendChild(el); });
          W.body.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; ev.stopPropagation(); G.sfx('click'); if (W.acts && W.acts[b.dataset.a]) W.acts[b.dataset.a](b.dataset.v); refreshWin(W, true); refreshBar(); });
          // drag by the title (desktop)
          const wt = el.querySelector('.dg-park-wt'); let dr = null;
          wt.addEventListener('pointerdown', ev => { if (ev.target.closest('button') || G.phone) return; dr = { x: ev.clientX, y: ev.clientY, l: el.offsetLeft, t: el.offsetTop }; wt.setPointerCapture(ev.pointerId); });
          wt.addEventListener('pointermove', ev => { if (!dr) return; el.style.right = 'auto'; el.style.left = clamp(dr.l + ev.clientX - dr.x, 0, view.clientWidth - 60) + 'px'; el.style.top = clamp(dr.t + ev.clientY - dr.y, 0, view.clientHeight - 20) + 'px'; });
          wt.addEventListener('pointerup', () => { dr = null; });
        }
        if (W.el.nextSibling) wins.appendChild(W.el); // bring it to the front
        W.render = render; W.title = titleTxt; W.el.querySelector('.dg-park-wt span').textContent = typeof titleTxt === 'function' ? titleTxt() : titleTxt;
        refreshWin(W, true);
        return W;
      }
      function refreshWin(W, force) {
        if (!W || !W.el.isConnected) return;
        const r = W.render(); if (!r) { closeWin(W.key); return; }
        W.acts = r.acts || {};
        if (typeof W.title === 'function') W.el.querySelector('.dg-park-wt span').textContent = W.title();
        if (force || r.html !== W.last) { const sc = W.body.scrollTop; W.last = r.html; W.body.innerHTML = r.html; W.body.scrollTop = sc; }
      }
      function closeWin(key) { const W = U.wins[key]; if (!W) return; W.el.remove(); delete U.wins[key]; if (key[0] === 'o' && U.sel === +key.slice(1)) U.sel = 0; if (key[0] === 'g') U.selG = 0; if (key === 'co' && U.tool === 'coaster') setTool('look'); }
      const bar2 = (v, cls) => `<span class="dg-park-bar2 ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></span>`;
      const row = (a, b) => `<div class="row2"><span>${a}</span><b>${b}</b></div>`;
      const btn = (a, label, v, dis, tip) => `<button type="button" class="btn" data-a="${a}"${v != null ? ` data-v="${esc(v)}"` : ''}${dis ? ' disabled' : ''}${tip ? ` title="${esc(tip)}"` : ''}>${label}</button>`;
      // excitement / intensity / nausea, with what they mean
      function ratings(st, isCo) {
        const dare = Math.round(clamp((9.5 - st.i) / 7.5, 0, 1) * 100);
        const R = (n, v, c, tip) => `<span title="${esc(tip)}">${n}</span>${bar2(v * 10, c)}<b>${v.toFixed(2)} ${rateWord(v)}</b>`;
        return `<div class="dg-park-rt">${R('Excitement', st.e, 'g', 'How much fun it is. More excitement = more guests want a go, and they\'ll pay more.')}${R('Intensity', st.i, st.i > 7 ? 'r' : st.i > 4 ? 'o' : 'y', 'How scary it is. Too intense and guests won\'t dare.')}${R('Nausea', st.n, st.n > 4 ? 'r' : 'y', 'How sick it makes them. Too much and they throw up on your paths.')}</div><p class="dg-park-note">About <b>${dare}%</b> of guests dare to ride it.${st.n > 4 ? ' Lots will feel sick afterwards: put a bin or two nearby!' : ''}${isCo && st.e < 4 ? ' Tip: bigger drops, a loop or more speed make it more exciting.' : ''}</p>`;
      }
      function openObj(o) {
        U.sel = o.id;
        if (o.k === 'scen') return;
        const key = 'o' + o.id;
        win(key, () => (S.objs[o.id] || o).name, () => {
          const r = S.objs[o.id]; if (!r) return null; links();
          if (r.k === 'stall') {
            const def = STALLS[r.type], cash = def.need === 'cash';
            return { html: `<p><i>${esc(def.d)}</i></p>${cash ? '' : row('Price', money2(r.price)) + (V ? '' : `<div class="bb">${btn('pm', '- 1 Rupee')}${btn('pp', '+ 1 Rupee')}</div>`)}${row(cash ? 'Withdrawals' : r.type === 'info' ? 'Balloons, maps and umbrellas sold' : 'Sold', r.sold)}${cash ? '' : row('Income', money(r.income))}${r._ent.length ? '' : '<p style="color:#c00000">Not next to a path! Nobody can reach it.</p>'}${V ? '' : `<div class="bb">${btn('demo', 'Demolish')}</div>`}`,
              acts: V ? {} : { pm: () => { r.price = Math.max(0, +(r.price - 0.1).toFixed(2)); }, pp: () => { r.price = Math.min(10, +(r.price + 0.1).toFixed(2)); }, demo: () => demolish(r.y * N + r.x) } };
          }
          const isCo = r.k === 'coaster', st = stats(r);
          const status = r.st === 'broken' ? '<span style="color:#c00000">BROKEN DOWN</span>' : isCo && !r.complete ? 'Under construction' : isCo && !r.tested ? (r.st === 'test' ? 'Testing...' : 'Not tested') : r.open ? (r.st === 'run' ? 'Running' : 'Open - waiting for riders') : 'Closed';
          let h = `<p>${isCo ? (r.byPlayer === false ? '<i>Built by Callum. Allegedly.</i>' : '<i>A rollercoaster, designed by hand!</i>') : `<i>${esc(RIDES[r.type].d)}</i>`}</p>${row('Status', status)}`;
          if (st) h += ratings(st, isCo);
          if (isCo && r.rate) h += row('Top speed', Math.round(r.rate.maxV * 9) + ' mph') + row('Ride time', Math.round(r.rate.time) + ' secs') + row('Track length', Math.round(r.rate.len * 9) + ' m') + (r.rate.loops ? row('Loops', r.rate.loops) : '');
          h += row('Price', money2(r.price));
          if (!V) h += `<div class="bb">${btn('pm', '- 1 Rupee')}${btn('pp', '+ 1 Rupee')}</div>`;
          if (st) h += `<p class="dg-park-note">Guests will pay up to about <b>${money(value(r) * 1.8)}</b> for it.${r.price > value(r) * 1.8 ? ' <span style="color:#c00000">It\'s too dear right now!</span>' : ''}</p>`;
          h += row('Queue', r.waiting.length + ' guests') + row('Total riders', r.total) + row('Income', money(r.income));
          if (!r._ent.length && (!isCo || r.complete)) h += '<p style="color:#c00000;margin-top:4px">No entrance! Lay a queue line (or a path) right up to the side of it' + (isCo ? ' next to the station.' : '.') + '</p>';
          if (!V) {
            h += '<div class="bb">';
            if (isCo && !r.complete) h += btn('cont', 'Carry on building');
            if (isCo && r.complete && !r.tested && r.st !== 'test') h += btn('test', 'Test run');
            if (!isCo || r.tested) h += btn('open', r.open ? 'Close ride' : '<b>Open ride</b>');
            h += btn('ren', 'Rename') + btn('demo', 'Demolish') + '</div>';
          }
          return { html: h, acts: V ? {} : {
            pm: () => { r.price = Math.max(0, +(r.price - 0.1).toFixed(2)); }, pp: () => { r.price = Math.min(20, +(r.price + 0.1).toFixed(2)); },
            open: () => openRide(r),
            test: () => testCoaster(r), cont: () => { S.build = r.id; setTool('coaster'); },
            ren: () => Desk.ask('Rename', 'Name this ride:', r.name, 30, v => { if (v && v.trim()) { r.name = v.trim().slice(0, 30); refreshWin(U.wins[key], true); } }),
            demo: () => demolish(isCo ? r.pieces[0].y * N + r.pieces[0].x : r.y * N + r.x),
          } };
        });
      }
      function openRide(r) {
        r.open = !r.open;
        if (r.open) {
          G.sfx('join'); news(`${r.name} has opened!`, null, true); if (r.k === 'coaster' && r.byPlayer) G.secret('park.coaster');
          links(); if (!r._ent.length) hint('It\'s open, but nobody can get in: lay a queue line up to it!', 1);
          else if (!S.open) hint('Don\'t forget to open the park itself! (The gate button.)', 0);
        }
      }
      function guestWin(g) {
        U.selG = g.id;
        win('g', () => { const gg = gById(U.selG); return gg ? gg.name : 'Guest'; }, () => {
          const gg = gById(U.selG); if (!gg) return null;
          const where = gg.st === 'ride' ? 'On ' + ((S.objs[gg.rid] || {}).name || 'a ride') : gg.st === 'queue' ? 'Queueing for ' + ((S.objs[gg.rid] || {}).name || 'a ride') : gg.st === 'buy' ? 'Buying something' : gg.st === 'sit' ? 'Sitting on a bench' : gg.goal && gg.goal.exit ? 'Leaving the park' : gg.goal && gg.goal.r ? 'Heading for ' + ((S.objs[gg.goal.r] || {}).name || 'a ride') : 'Walking';
          const L = (n, v, c) => `<div class="row2"><span>${n}</span>${bar2(v, c)}</div>`;
          const things = [gg.item === 'balloon' ? 'a balloon' : gg.item === 'map' ? 'a park map' : '', gg.umb ? 'an umbrella' : '', gg.hat ? 'a silly hat' : ''].filter(Boolean).join(', ');
          return { html: `${row('Doing', esc(where))}${L('Happiness', gg.happy, 'g')}${L('Energy', gg.energy)}${L('Hunger', gg.hunger, 'r')}${L('Thirst', gg.thirst, 'r')}${L('Toilet', gg.toilet, 'r')}${L('Nausea', gg.nausea, 'r')}${row('Cash', money2(gg.money))}${row('Spent', money2(gg.spent))}${row('Rides', gg.rides)}${row('Likes rides up to', 'Intensity ' + gg.tol.toFixed(1))}${things ? row('Carrying', things) : ''}<p style="margin-top:5px"><b>Thoughts:</b></p><div class="dg-park-list" style="max-height:90px">${gg.th.length ? gg.th.map(t => `<div style="cursor:default;white-space:normal">&ldquo;${esc(t.t)}&rdquo;</div>`).join('') : '<div style="cursor:default"><i>(nothing much)</i></div>'}</div>` };
        }, { w: 240 });
      }
      const maxFee = () => 3 + rideList().length * 1.6;
      function parkWin() {
        win('park', V ? 'About this park' : 'Park', () => {
          const sc = SCENARIOS[S.si];
          let h = `<p><b>${esc(S.pname)}</b>${V ? ` <span class="dsc-dim">by ${esc(V.name)}</span>` : ''}</p>`;
          if (!V) h += `<div class="bb">${btn('open', S.open ? 'Close the park' : '<b>OPEN THE PARK</b>', null, false, S.open ? 'Close the gates (guests already inside stay)' : 'Let the guests in!')}${btn('ren', 'Rename park')}</div>`;
          if (!V) h += row('Entry fee', money2(S.fee)) + `<div class="bb">${btn('fm', '- 5 Rupees')}${btn('fp', '+ 5 Rupees')}</div><p class="dg-park-note">With ${rideList().length} ride${rideList().length === 1 ? '' : 's'} open, guests think up to <b>${money(maxFee())}</b> is fair.${S.fee > maxFee() ? ' <span style="color:#c00000">Too dear: fewer people will come!</span>' : ''}</p>`;
          h += row('Guests in park', S.guests.length) + row('Park rating', S.rating + ' / 999') + `<div class="row2">${bar2(S.rating / 10, S.rating < 400 ? 'r' : 'g')}</div>`;
          if (S._rb) h += `<p class="dg-park-note" style="margin-top:4px"><b>What makes the rating:</b></p><div class="dg-park-list" style="max-height:none">${S._rb.map(([n, v]) => `<div style="cursor:default;display:flex;justify-content:space-between"><span>${n}</span><b style="color:${v > 0 ? '#008000' : v < 0 ? '#c00000' : '#808080'}">${v > 0 ? '+' : ''}${v}</b></div>`).join('')}</div>`;
          h += `<p style="margin-top:5px;display:flex;align-items:center;gap:4px">${WXI[S.wx.k]} <b>${WX[S.wx.k].n}</b> <span class="dsc-dim">(about ${S.wx.d} more day${S.wx.d === 1 ? '' : 's'})</span></p>`;
          if (!V) {
            h += '<p style="margin-top:5px"><b>Advertising</b></p>';
            if (S.ads) h += `<p>${esc(S.ads.label)}: running until the ${esc(dayStr(S.ads.until))}.</p>`;
            else h += `<div class="bb">${btn('ad', `Leaflets: ${gemH(ADS.leaf.cost)}`, 'leaf', S.money < ADS.leaf.cost, ADS.leaf.d)}${btn('ad', `Advert: ${gemH(ADS.mag.cost)}`, 'mag', S.money < ADS.mag.cost, ADS.mag.d)}</div><p class="dg-park-note">Leaflets bring 40% more guests for a month. An advert in JACK ATTACK! magazine doubles them for two months.</p>`;
            const pr = objProgress();
            h += `<p style="margin-top:6px"><b>Objective:</b> ${esc(objText(sc, true))}${S.result ? ` <b>${S.result === 'won' ? 'ACHIEVED!' : 'Failed.'}</b>` : ''}</p>${pr.map(p => row((p.ok ? '&#10004; ' : '') + p.n[0].toUpperCase() + p.n.slice(1), `${p.rp ? p.have.toLocaleString('en-GB') : p.have} / ${p.rp ? p.want.toLocaleString('en-GB') : p.want}`)).join('')}${S.result ? '' : row('Time left', monthsLeft() + ' month' + (monthsLeft() === 1 ? '' : 's'))}`;
          }
          return { html: h,
            acts: V ? {} : { open: () => { S.open = !S.open; G.sfx(S.open ? 'solve' : 'thud'); news(S.open ? 'Your park is now open!' : 'Your park is now closed', ENT, true); if (S.open) fx(ENTX + 0.5, ENTY + 0.5, 'OPEN!', '#ffff40', 3); }, fm: () => { S.fee = Math.max(0, S.fee - 0.5); }, fp: () => { S.fee = Math.min(30, S.fee + 0.5); },
              ren: () => Desk.ask('Rename', 'What\'s your park called?', S.pname, 30, v => { if (v && v.trim()) { S.pname = v.trim().slice(0, 30); refreshWin(U.wins.park, true); } }),
              ad: k => { const a = ADS[k]; if (S.ads || S.money < a.cost) return; fin('ads', a.cost); S.ads = { n: a.n, label: a.label, boost: a.boost, until: S.day + a.days }; G.sfx('modem'); news(`${a.label} campaign started. Watch the guests roll in!`, null, true); } } };
        }, { w: 270 });
      }
      function finWin() {
        win('fin', 'Finances', () => {
          const f = S.fin, L = S.lastFin;
          const lines = [['Park entrance', 'entry'], ['Ride tickets', 'rides'], ['Food and drink', 'food'], ['Shop sales', 'shop'], ['Construction', 'build', 1], ['Staff wages', 'wages', 1], ['Ride upkeep', 'upkeep', 1], ['Loan interest', 'interest', 1], ['Advertising', 'ads', 1]];
          return { html: `<p><b>This month</b>${L ? ' (last month in brackets)' : ''}</p>${lines.map(([n, k, neg]) => row(n, (neg ? '-' : '') + money(f[k] || 0) + (L ? ` (${(neg ? '-' : '') + money(L[k] || 0)})` : ''))).join('')}${row('Cash', money(S.money))}${row('Loan', money(S.loan))}<div class="bb">${btn('borrow', 'Borrow ' + money(1000), null, S.loan >= 25000)}${btn('repay', 'Repay ' + money(1000), null, S.loan <= 0 || S.money < 1000)}</div><p class="dg-park-note">The bank charges 10% a year interest on the loan. Most you can borrow: ${money(25000)}.</p>${S.hist.length ? `<p style="margin-top:6px"><b>History</b></p><div class="dg-park-list" style="max-height:80px">${S.hist.map(x => `<div style="cursor:default">${esc(x.m)}: ${money(x.prof != null ? x.prof : x.inc - x.out)} profit, ${x.guests} guests</div>`).join('')}</div>` : ''}`,
            acts: { borrow: () => { if (S.loan < 25000) { S.loan += 1000; S.money += 1000; G.sfx('dice'); } }, repay: () => { if (S.loan > 0 && S.money >= 1000) { S.loan -= 1000; S.money -= 1000; } } } };
        }, { w: 280 });
      }
      function guestsWin() {
        win('guests', 'Guests', () => {
          const cnt = {}, sign = {}; S.guests.forEach(g => { const t = g.th[0]; if (t && S.time - t.at < 60) { cnt[t.t] = (cnt[t.t] || 0) + 1; sign[t.t] = (THOUGHTS[t.k] || [0, 0])[1]; } });
          const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8);
          const list = S.guests.slice().sort((a, b) => (b.mate >= 0) - (a.mate >= 0)).slice(0, 40);
          return { html: `${row('Guests in park', S.guests.length)}${row('Average happiness', S.guests.length ? Math.round(S.guests.reduce((t, g) => t + g.happy, 0) / S.guests.length) + '%' : '-')}<p style="margin-top:5px"><b>What guests are thinking:</b></p><div class="dg-park-list" style="max-height:110px">${top.length ? top.map(([t, n]) => `<div style="cursor:default;white-space:normal;color:${sign[t] > 0 ? '#006000' : sign[t] < 0 ? '#800000' : '#000080'}">${n} &times; &ldquo;${esc(t)}&rdquo;</div>`).join('') : '<div><i>Nothing yet</i></div>'}</div><p style="margin-top:5px"><b>Guests</b> (click one):</p><div class="dg-park-list">${list.map(g => `<div data-a="pick" data-v="${g.id}">${g.mate >= 0 ? '<b>' + esc(g.name) + '</b>' : esc(g.name)} - ${Math.round(g.happy)}% happy</div>`).join('') || '<div><i>Nobody here yet</i></div>'}</div>`,
            acts: { pick: v => { const g = gById(+v); if (g) { centreOn(g.x, g.y); guestWin(g); } } } };
        }, { w: 280 });
      }
      function staffWin() {
        win('staff', 'Staff', () => ({ html: `<p>Hired staff start at the park gate.</p>${Object.keys(STAFF).map(k => `${row(STAFF[k].n + 's', S.staff.filter(s => s.k === k).length)}<p style="margin:0 0 3px"><i>${esc(STAFF[k].d)}</i> Wages ${money(STAFF[k].wage)} a month.</p><div class="bb">${btn('hire', 'Hire a ' + STAFF[k].n, k)}${btn('fire', 'Sack one', k, !S.staff.some(s => s.k === k))}</div>`).join('<hr>')}${S.staff.length ? `<div class="dg-park-list" style="margin-top:6px;max-height:70px">${S.staff.map(s => `<div style="cursor:default">${esc(s.name)}: ${s.k === 'handy' ? s.swept + ' bits of litter swept' : s.fixed + ' rides fixed'}</div>`).join('')}</div>` : ''}`,
          acts: { hire: k => hire(k), fire: k => { const i = S.staff.map(s => s.k).lastIndexOf(k); if (i >= 0) { S.staff.splice(i, 1); G.sfx('thud'); } } } }), { w: 260 });
      }
      function msgsWin() {
        win('msgs', 'Recent Messages', () => ({ html: `<div class="dg-park-list" style="max-height:220px">${S.news.length ? S.news.map((n, i) => `<div data-a="go" data-v="${i}" style="white-space:normal"><b>${esc(n.d)}</b><br>${esc(n.t)}</div>`).join('') : '<div><i>No messages</i></div>'}</div>`,
          acts: { go: v => { const n = S.news[+v]; if (n && n.loc >= 0) centreOn(n.loc % N + 0.5, ((n.loc / N) | 0) + 0.5); } } }), { w: 290 });
      }
      // a little graph of the test run: height (green) and speed (yellow)
      function graph(co) {
        if (!co.prof || co.prof.length < 3) return '';
        if (co._graph && co._graphP === co.prof) return co._graph;
        const P = co.prof, n = Math.min(120, P.length - 1), q = { x: 0, y: 0, z: 0, tx: 0, ty: 0 }; let hs = '', vs = '', vmax = 0.1;
        const pts = [];
        for (let k = 0; k <= n; k++) { const i = Math.round(k * (P.length - 2) / n); trackAt(co, P[i], q); const v = (P[i + 1] - P[i]) / 0.05; vmax = Math.max(vmax, v); pts.push([q.z, v]); }
        pts.forEach(([z, v], k) => { const x = (k * 240 / n).toFixed(1); hs += `${x},${(62 - z / 10 * 56).toFixed(1)} `; vs += `${x},${(62 - v / vmax * 54).toFixed(1)} `; });
        co._graphP = co.prof;
        co._graph = `<svg class="dg-park-graph" viewBox="0 0 240 64" preserveAspectRatio="none"><path d="M0 16H240M0 32H240M0 48H240" stroke="#204020" stroke-width=".5"/><polygon points="0,64 ${hs}240,64" fill="#1a7a2a" opacity=".8"/><polyline points="${vs}" fill="none" stroke="#ffd400" stroke-width="1.4"/></svg><p class="dg-park-note"><span style="color:#1a7a2a">&#9632;</span> Height &nbsp; <span style="color:#c0a000">&#9632;</span> Speed (top speed ${Math.round(vmax * 9)} mph)</p>`;
        return co._graph;
      }
      function coasterWin() {
        let co = S.objs[S.build];
        if (co && co.k !== 'coaster') co = null;
        win('co', () => co ? 'Construct: ' + co.name : 'Rollercoaster Construction', () => {
          co = S.objs[S.build]; if (co && co.k !== 'coaster') co = null;
          if (!co) {
            return { html: `<p>First place the <b>station</b> (3 tiles of grass in a row). Turn it to point the way you want the train to go, then click on the grass where it should start.</p><div class="row2"><span>Station points</span><b>${['South-east', 'South-west', 'North-west', 'North-east'][U.stDir]}</b></div><div class="bb">${btn('rot', 'Turn the station')}${btn('done', 'Cancel')}</div><p class="dg-park-note">The station costs ${money(240)}. Track pieces cost ${money(40)} to ${money(160)} each. The track has to come back round into the start of the station, at ground level.</p>`,
              acts: { rot: () => { U.stDir = (U.stDir + 1) % 4; G.sfx('turn'); }, done: () => { closeWin('co'); setTool('look'); } } };
          }
          const n = nextSpot(co);
          const can = t => { if (co.complete) return false; const h2 = pieceH2(t, n.h); return inB(n.x, n.y) && clearable(n.y * N + n.x) && h2 >= 0 && h2 <= 7 && S.money >= PCOST[t]; };
          const KEYS = { l: 'Left arrow', s: 'Up arrow', r: 'Right arrow', lp: 'O', u: 'U', dn: 'N', dd: 'X', ch: 'C' };
          const SH = { l: 'Left', s: 'Straight', r: 'Right', lp: 'Loop', u: 'Up', dn: 'Down', dd: 'Big drop', ch: 'Chain' };
          const pb = t => `<button type="button" data-a="add" data-v="${t}"${can(t) ? '' : ' disabled'} title="${PNAME[t]} (${KEYS[t]}): ${money(PCOST[t])}">${PIC[t]}<span>${SH[t]}</span><small>${rup(PCOST[t])}</small></button>`;
          let h;
          if (co.complete) {
            h = co.tested ? `<p><b style="color:#008000">Tested!</b> Here's how it rates:</p>${ratings(co.rate, true)}${graph(co)}` : co.st === 'test' ? '<p><b>Test run in progress...</b> Hold on to your hats!</p>' : `<p><b style="color:#008000">Circuit complete!</b> Now press <b>Test run</b> to see how exciting it is.</p>`;
            if (co.fail >= 0 && !co.tested) h += '<p style="color:#c00000">The last test went wrong at the flashing piece. Undo back past it and try a different shape.</p>';
          } else {
            const pl = co.pieces.length - 3, cost = co.pieces.reduce((a, p) => a + (PCOST[p.t] || 80), 0);
            h = `<p>Next piece goes on the flashing square. <b>Height ${n.h}</b>${n.h ? ` (needs a drop of ${n.h} to get home)` : ''}. ${pl} piece${pl === 1 ? '' : 's'} so far, ${money(cost)}.</p>`;
            if (co.fail >= 0) h += '<p style="color:#c00000">The last test went wrong at the flashing piece.</p>';
          }
          if (!co.complete) h += `<div class="dg-park-pc">${['l', 's', 'r', 'lp', 'u', 'dn', 'dd', 'ch'].map(pb).join('')}</div>`;
          h += `<div class="dg-park-pc" style="margin-top:3px"><button type="button" data-a="undo"${co.pieces.length <= 3 || co.st === 'test' ? ' disabled' : ''} title="Take the last piece away (Backspace). You get most of the money back.">${PIC.undo}<span>Undo</span></button>${co.complete ? '' : `<button type="button" data-a="fin" title="Harry works out the shortest way back to the station (F)">${PIC.fin}<span>Finish it</span></button>`}<button type="button" class="big" data-a="test"${!co.complete || co.st === 'test' || co.tested ? ' disabled' : ''} title="Send an empty train round to test it (K)">${PIC.test}<span>${co.tested ? 'Tested' : 'Test run'}</span></button></div>`;
          h += `<div class="bb">${co.tested ? btn('open', co.open ? 'Close ride' : '<b>OPEN RIDE</b>') : ''}${btn('info', 'Ride window')}${btn('done', 'Done')}</div>`;
          if (co.tested && !co.open) h += '<p class="dg-park-note">Lay a queue line up to the side of the station, then open it!</p>';
          return { html: h,
            acts: { add: t => addPiece(co, t), undo: () => undoPiece(co), test: () => testCoaster(co), fin: () => finishFor(co), open: () => openRide(co), info: () => openObj(co), done: () => { closeWin('co'); setTool('look'); } } };
        }, { w: 290 });
        hint(co ? '' : 'Click the grass to place the coaster station', 0, true);
      }
      function finishFor(co) {
        const pl = planFinish(co);
        if (!pl) { hint('Harry can\'t find a way back to the station from here. Undo a few pieces, or turn towards the station.', 1); G.sfx('beep'); return; }
        if (S.money < pl.cost) { hint(`Finishing it needs ${pl.ts.length} pieces (${money(pl.cost)}), and you haven't got enough cash.`, 1); G.sfx('beep'); return; }
        G.msg('Finish it for me', `Harry reckons ${pl.ts.length} more piece${pl.ts.length === 1 ? '' : 's'} will get the train back into the station.\n\nCost: ${money(pl.cost)}. Go for it?`, 'q', [['Yes please', () => {
          for (const t of pl.ts) if (!addPiece(co, t, true)) break;
          S._rev++;
          if (co.complete) { G.sfx('solve'); hint('Circuit complete! Now press Test run.', 0); } else { G.sfx('beep'); hint('Hmm, that didn\'t quite work. Try building a bit more by hand.', 1); }
          if (U.wins.co) refreshWin(U.wins.co, true);
        }], ['No thanks']]);
      }
      // the end of the scenario (won, failed, or the bank took it)
      function endPanel(res) {
        const old = root.querySelector('.dg-park-end'); if (old) old.remove();
        const sc = SCENARIOS[S.si], d = document.createElement('div'); d.className = 'dg-park-end';
        const cup = '<svg viewBox="0 0 64 64"><path d="M18 8h28v14c0 10-6 17-14 17S18 32 18 22z" fill="#ffd400" stroke="#806000" stroke-width="2"/><path d="M18 12H8c0 10 5 14 11 14M46 12h10c0 10-5 14-11 14" fill="none" stroke="#806000" stroke-width="3"/><rect x="28" y="38" width="8" height="10" fill="#e0b000" stroke="#806000"/><rect x="18" y="48" width="28" height="8" fill="#8a5a2a" stroke="#000"/><path d="M24 14l2 6M30 12l1 8" stroke="#fff8c0" stroke-width="2"/><text x="32" y="55" text-anchor="middle" font-size="6" font-family="Arial" fill="#ffd400">1999</text></svg>';
        const sad = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#f0c8a0" stroke="#000" stroke-width="2"/><path d="M14 22c4-14 32-14 36 0l4 2H10z" fill="#5a4a3a" stroke="#000"/><rect x="22" y="28" width="4" height="4"/><rect x="38" y="28" width="4" height="4"/><path d="M22 48c6-6 14-6 20 0" fill="none" stroke="#000" stroke-width="2"/><path d="M24 33v6" stroke="#40a0ff" stroke-width="2"/></svg>';
        const pr = objProgress().map(p => `${p.ok ? '&#10004;' : '&#10008;'} ${p.n}: ${p.rp ? p.have.toLocaleString('en-GB') : p.have} (needed ${p.rp ? p.want.toLocaleString('en-GB') : p.want})`).join('<br>');
        const T = res === 'won' ? ['Objective Achieved!', `Brilliant! <b>${esc(S.pname)}</b> did it.<br>${pr}<br><br>${S.si === 2 ? 'Callum owes you a packet of crisps.' : 'Mom says she\'s very proud. (She also says bedtime.)'} You can keep playing as long as you like.`, cup]
          : res === 'bust' ? ['The Bank Has Taken Your Park!', `Three months in the red with a maxed-out loan, and the bank manager has changed the locks on <b>${esc(S.pname)}</b>.<br><br>Tip: keep an eye on the Finances window, don't overbuild, and charge a bit more.`, sad]
            : ['Objective Failed', `Oh dear. ${esc(sc.n)} didn't quite work out.<br>${pr}<br><br>You can keep playing anyway (Mom won't know).`, sad];
        d.innerHTML = `<div class="dg-park-win"><div class="dg-park-wt"><span>${esc(T[0])}</span></div><div class="dg-park-wb"><div class="big">${T[2]}<div><h3>${esc(T[0])}</h3><p>${T[1]}</p></div></div><div class="bb" style="justify-content:flex-end"></div></div></div>`;
        const bb = d.querySelector('.bb');
        const add = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = label; b.addEventListener('click', () => { G.sfx('click'); d.remove(); fn(); }); bb.appendChild(b); };
        if (res !== 'bust') add('Keep playing', () => { S.speed = 1; refreshSpeed(); });
        if (res === 'won') add('Show it off on JackNet', () => netParks());
        if (res !== 'won') add('Try again', () => { const st = newState(S.si); spawnT = 2; startGame(st); });
        add(res === 'won' ? '<b>Next scenario...</b>' : 'Pick another...', () => { autosave(); titleScreen(); scenarioPick(res === 'won' ? Math.min(SCENARIOS.length - 1, S ? S.si + 1 : 0) : null); });
        root.appendChild(d);
        if (res === 'bust') AS.clear();
      }
      // visiting somebody's park: a banner with the stars and the way out
      if (V) {
        const vb = document.createElement('div'); vb.className = 'dg-park-visit';
        vb.innerHTML = `<span>Visiting <b>${esc(V.title)}</b> by ${esc(V.name)}</span>`;
        try { vb.appendChild(D.rateBox('park', V.entry)); } catch (e) {}
        // a guided tour: hop from ride to ride
        let tour = -1;
        const tb2 = document.createElement('button'); tb2.type = 'button'; tb2.className = 'btn'; tb2.textContent = 'Next ride'; tb2.title = 'Jump to the next ride and see how it rates'; tb2.style.marginLeft = 'auto';
        tb2.addEventListener('click', () => {
          const rides = Object.values(S.objs).filter(o => o.k === 'ride' || (o.k === 'coaster' && o.complete)); if (!rides.length) { hint('No rides here yet!', 1); return; }
          tour = (tour + 1) % rides.length; const o = rides[tour], p0 = o.k === 'coaster' ? o.pieces[1] : o, w = o.k === 'coaster' ? 1 : o.w;
          G.sfx('click'); openObj(o); focusSpot(p0.x + w / 2, p0.y + w / 2, 0, true);
        });
        vb.appendChild(tb2);
        const lb = document.createElement('button'); lb.type = 'button'; lb.className = 'btn'; lb.textContent = 'Leave park'; lb.title = 'Go back to your own park'; lb.style.marginLeft = '0';
        lb.addEventListener('click', () => { G.sfx('click'); leaveVisit(); });
        vb.appendChild(lb); vb.addEventListener('pointerdown', ev => ev.stopPropagation());
        view.appendChild(vb);
        hintEl.style.top = (G.phone ? 56 : 32) + 'px';
      }
      Object.assign(U, { hint, showNews, refreshBar, openObj, guestWin, closeWin, win, refreshWin, coasterWin, parkWin, endPanel,
        puff(x, y, w) { PUFF.push({ x: x + w / 2, y: y + w / 2, w: Math.max(1, w * 0.7), t: 0 }); },
        refresh() { refreshSpeed(); refreshBar(); Object.values(U.wins).forEach(W => refreshWin(W)); harry.tick(); },
        destroy() { ro.disconnect(); harry.hide(true); root.innerHTML = ''; } });

      // ---- view sizing and camera
      function resize() {
        const r = view.getBoundingClientRect(); if (!r.width) return;
        VW = Math.max(40, Math.ceil(r.width / zoom)); VH = Math.max(40, Math.ceil(r.height / zoom));
        cv.width = VW; cv.height = VH; cv.style.width = VW * zoom + 'px'; cv.style.height = VH * zoom + 'px';
        ctx.imageSmoothingEnabled = false; clampCam();
      }
      function clampCam() { camx = clamp(camx, Math.min(-N * 16 - 120, -N * 16 - VW / 2 + 40), Math.max(N * 16 + 120 - VW, N * 16 - VW / 2 - 40)); camy = clamp(camy, Math.min(-100, -VH / 2 + 30), Math.max(N * 16 + 110 - VH, N * 16 - VH / 2)); if (VW > N * 32 + 240) camx = -VW / 2; if (VH > N * 16 + 210) camy = (N * 16 + 30) / 2 - VH / 2; }
      function centreOn(x, y) { camx = sxw(x, y) - VW / 2; camy = syw(x, y, 0) - VH / 2; clampCam(); }
      // keep a spot in view above any window that's covering the bottom of the view (phones)
      function focusSpot(x, y, z, force) {
        const sx = sxw(x, y) - camx, sy = syw(x, y, z || 0) - camy, top = G.phone ? VH * 0.35 : VH * 0.75;
        if (force || sx < 30 || sx > VW - 30 || sy < 30 || sy > top) { camx = sxw(x, y) - VW / 2; camy = syw(x, y, z || 0) - (G.phone ? VH * 0.22 : VH / 2); clampCam(); }
      }
      U.centreOn = centreOn; U.clampCam = clampCam; U.resize = resize; U.focusSpot = focusSpot;
      const ro = new ResizeObserver(resize); ro.observe(view);
      resize(); centreOn(ENTX + 0.5, ENTY - 5);

      // ---- pointer: drag pans (or paints with a mouse), click builds/selects
      const toTile = (ev) => { const r = cv.getBoundingClientRect(); const lx = (ev.clientX - r.left) / zoom + camx, ly = (ev.clientY - r.top) / zoom + camy; const a = lx / 16, b = ly / 8; return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2), lx, ly }; };
      let pd = null;
      const paintTool = () => /^(path|queue|bull|scen)/.test(U.tool);
      cv.addEventListener('pointerdown', ev => {
        closeDD(); ev.preventDefault(); try { host.focus({ preventScroll: true }); } catch (e) {}
        ugrp++;
        pd = { x: ev.clientX, y: ev.clientY, cx: camx, cy: camy, moved: false, paint: ev.pointerType === 'mouse' && ev.button === 0 && paintTool(), pan: ev.button === 2 || ev.button === 1, last: -1 };
        cv.setPointerCapture(ev.pointerId);
        if (pd.paint) paintAt(ev);
      });
      cv.addEventListener('pointermove', ev => {
        const t = toTile(ev); U.hover = inB(t.x, t.y) ? t.y * N + t.x : -1;
        if (!pd) return;
        const dx = ev.clientX - pd.x, dy = ev.clientY - pd.y;
        if (!pd.moved && Math.hypot(dx, dy) > 6) pd.moved = true;
        if (!pd.moved) return;
        if (pd.paint && !pd.pan) paintAt(ev);
        else { camx = pd.cx - dx / zoom; camy = pd.cy - dy / zoom; clampCam(); }
      });
      cv.addEventListener('pointerup', ev => { if (!pd) return; const p = pd; pd = null; if (!p.moved && !p.paint) tap(ev); });
      cv.addEventListener('pointercancel', () => { pd = null; });
      cv.addEventListener('pointerleave', () => { U.hover = -1; });
      cv.addEventListener('contextmenu', ev => ev.preventDefault());
      cv.addEventListener('wheel', ev => { ev.preventDefault(); const z0 = zoom; zoom = ev.deltaY < 0 ? Math.min(3, zoom + 1) : Math.max(1, zoom - 1); if (z0 !== zoom) { const cxw = camx + VW / 2, cyw = camy + VH / 2; resize(); camx = cxw - VW / 2; camy = cyw - VH / 2; clampCam(); } }, { passive: false });
      function paintAt(ev) {
        const t = toTile(ev); const i = t.y * N + t.x; if (!inB(t.x, t.y) || i === pd.last) return; pd.last = i;
        if (U.tool === 'bull') demolish(i, 'drag'); else build(U.tool, t.x, t.y, pd.moved ? 'drag' : false);
      }
      function tap(ev) {
        const t = toTile(ev);
        const tool = U.tool;
        if (tool === 'coaster' && !V) {
          let co = S.objs[S.build]; if (co && co.k !== 'coaster') co = null;
          if (!co) { if (inB(t.x, t.y)) { co = startCoaster(t.x, t.y, U.stDir); if (co) { U.puff(t.x + DX[U.stDir], t.y + DY[U.stDir], 1); hint('Station built! Now add track pieces with the buttons.', 0); refreshWin(U.wins.co, true); } } }
          return;
        }
        if (tool !== 'look' && !V) { if (inB(t.x, t.y)) build(tool, t.x, t.y); return; }
        // look: guests first (near the click), then objects
        let best = null, bd = 7;
        for (const g of S.guests) { if (g.hidden) continue; const d = Math.hypot(sxw(g.x, g.y) - t.lx, syw(g.x, g.y, 0) - 5 - t.ly); if (d < bd) { bd = d; best = g; } }
        if (best) { G.sfx('pet'); guestWin(best); return; }
        if (!inB(t.x, t.y)) return;
        const o = S.objs[S.obj[t.y * N + t.x]];
        if (o) { G.sfx('click'); if (o.k === 'coaster' && !o.complete && !V) { S.build = o.id; setTool('coaster'); } else openObj(o); return; }
        if (t.y * N + t.x === ENT) { parkWin(); return; }
      }
      U.key = ev => {
        const k = ev.key, P = 24 / zoom * 2, lk = k.length === 1 ? k.toLowerCase() : k;
        if (ev.altKey || (ev.metaKey && lk !== 'z')) return;
        if ((ev.ctrlKey || ev.metaKey) && lk === 'z') { if (!V) undoBuild(); ev.preventDefault(); return; }
        if (ev.ctrlKey) return;
        // building a coaster: the arrows and letters lay track
        const co = S.objs[S.build];
        if (!V && U.tool === 'coaster' && co && co.k === 'coaster') {
          const m = { ArrowLeft: 'l', ArrowUp: 's', ArrowRight: 'r', o: 'lp', u: 'u', PageUp: 'u', n: 'dn', PageDown: 'dn', x: 'dd', c: 'ch' }[lk];
          if (m && !co.complete) { addPiece(co, m); refreshWin(U.wins.co, true); ev.preventDefault(); return; }
          if (lk === 'Backspace') { undoPiece(co); refreshWin(U.wins.co, true); ev.preventDefault(); return; }
          if (lk === 'k' && co.complete && !co.tested && co.st !== 'test') { testCoaster(co); refreshWin(U.wins.co, true); ev.preventDefault(); return; }
          if (lk === 'f' && !co.complete) { finishFor(co); ev.preventDefault(); return; }
        }
        const tbk = key => { const b = tb.querySelector(`[data-k="${key}"]`); if (b) b.click(); };
        if (k === 'ArrowLeft') camx -= P; else if (k === 'ArrowRight') camx += P; else if (k === 'ArrowUp') camy -= P; else if (k === 'ArrowDown') camy += P;
        else if (k === ' ') { setSpeed(S.speed ? 0 : 1); } else if (k === '1' || k === '2' || k === '3') setSpeed([1, 2, 4][+k - 1]);
        else if (k === 'Escape') { setTool('look'); closeDD(); } else if (k === '+' || k === '=') { zoom = Math.min(3, zoom + 1); resize(); } else if (k === '-') { zoom = Math.max(1, zoom - 1); resize(); }
        else if (lk === 'g') guestsWin(); else if (lk === 'o') parkWin(); else if (lk === 'm') msgsWin();
        else if (lk === 'f1' || k === '?' || k === 'F1') keysHelp();
        else if (!V && lk === 'p') setTool('path'); else if (!V && lk === 'j') setTool('queue'); else if (!V && lk === 'b') setTool('bull'); else if (!V && lk === 'c') setTool('coaster');
        else if (!V && lk === 'r') tbk('ride'); else if (!V && lk === 'k') tbk('stall'); else if (!V && lk === 's') tbk('scen'); else if (!V && lk === 'h') staffWin(); else if (!V && lk === 'f') finWin();
        else return;
        ev.preventDefault(); clampCam();
      };
      view.addEventListener('pointerdown', () => closeDD());
      refreshSpeed(); refreshBar(); showNews();
      if (!S.open && !V) hint('Drag to look around' + (G.touch ? '' : ', or use the arrow keys') + '. Open the park from the gate button!', 0);
      return U;
    }

    // ================================================================ the main loop
    let uiT = 0, scream = 0;
    function frame(dt, tms) {
      if (!S || !ui || !cv) return;
      if (S.speed && !title) {
        let left = dt * S.speed;
        while (left > 0) { const st = Math.min(0.05, left); sim(st); left -= st; if (!S || !ui) return; }
      } else if (!title) Object.values(S.objs).forEach(o => { if (o.k === 'coaster' && o.st === 'test') updateRide(o, dt); }); // a test run carries on while paused
      // coaster screams
      if (G.sound) Object.values(S.objs).forEach(o => { if (o.k === 'coaster' && o.st === 'run' && o.prof) { const i = Math.floor(o.t / 0.05); const v = (o.prof[Math.min(o.prof.length - 1, i + 1)] - o.prof[i]) / 0.05; o._fast = v > 3; if (v > 3.2 && S.time - scream > 4) { scream = S.time; G.note(900, 0.25, 'sawtooth'); G.timer(() => G.note(700, 0.35, 'sawtooth'), 120); } } });
      draw(tms / 1000);
      uiT -= dt; if (uiT <= 0) { uiT = 0.5; ui.refresh(); }
    }
    function draw(t) {
      if (S._gdirty) drawGround();
      links();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // the camera follows the train on a test run
      if (ui.follow) { const co = S.objs[ui.follow]; if (co && co.st === 'test' && co.complete) { const q = trackAt(co, co.ts || 2.4, tmpP); camx += (sxw(q.x, q.y) - VW / 2 - camx) * 0.12; camy += (syw(q.x, q.y, q.z) - VH / 2 - camy) * 0.12; ui.clampCam(); } else ui.follow = 0; }
      ctx.fillStyle = '#316c1e'; ctx.fillRect(0, 0, VW, VH);
      ctx.drawImage(gcv, -GOX - camx, -GOY - camy);
      // water twinkle
      for (let i = 0; i < NN; i++) if (S.ground[i] === 1 && hash(i, Math.floor(t * 2)) > 0.7) { const x = i % N, y = (i / N) | 0; rect(PX(x + 0.3 + hash(i, 1) * 0.4, y + 0.5), PY(x + 0.5, y + 0.3 + hash(i, 2) * 0.4, 0), 2, 1, '#a0c8ff'); }
      for (let i = 0; i < NN; i++) if (S.litter[i]) drawLitter(i);
      // hover ghost
      const tool = ui.tool;
      if (ui.hover >= 0 && tool !== 'look') {
        const hx = ui.hover % N, hy = (ui.hover / N) | 0; let w = 1, ok = true;
        const [k, ty] = tool.split(':');
        if (k === 'ride') w = RIDES[ty].w;
        if (k === 'coaster' && !S.objs[S.build]) w = 1;
        const tiles = [];
        if (k === 'coaster' && !S.objs[S.build]) for (let q = 0; q < 3; q++) tiles.push([hx + DX[ui.stDir] * q, hy + DY[ui.stDir] * q]);
        else for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) tiles.push([hx + xx, hy + yy]);
        if (k === 'scen' && !SCEN[ty].path) ok = tiles.every(([x, y]) => inB(x, y) && free(y * N + x));
        else if (k === 'ride' || k === 'stall' || k === 'coaster') ok = tiles.every(([x, y]) => inB(x, y) && clearable(y * N + x));
        if (!(k === 'coaster' && S.objs[S.build])) tiles.forEach(([x, y]) => { if (inB(x, y)) poly(ctx, [PX(x, y), PY(x, y, 0), PX(x + 1, y), PY(x + 1, y, 0), PX(x + 1, y + 1), PY(x + 1, y + 1, 0), PX(x, y + 1), PY(x, y + 1, 0)], ok ? 'rgba(80,255,80,.35)' : 'rgba(255,60,60,.4)', '#fff'); });
      }
      // things, sorted back to front
      const L = [];
      for (const o of Object.values(S.objs)) {
        if (o.k === 'coaster') { o.pieces.forEach((p, k) => L.push([p.x + p.y + 1 + (p.h > 0 ? 0.3 : 0), 1, o, p, k])); continue; }
        L.push([o.x + o.y + o.w + (o.k === 'scen' ? -0.1 : 0.05), 0, o]);
      }
      for (let i = 0; i < NN; i++) if (S.furn[i]) L.push([(i % N) + ((i / N) | 0) + 1.2, 5, i]);
      for (const g of S.guests) if (!g.hidden) L.push([g.x + g.y, 2, g]);
      for (const s of S.staff) L.push([s.x + s.y, 3, s]);
      for (const o of Object.values(S.objs)) if (o.k === 'coaster' && o.complete && o.pieces.length) {
        const s0 = o.st === 'run' || o.st === 'test' ? (o.ts || 2.4) : 2.4;
        for (let k = 0; k < 3; k++) { const q = trackAt(o, s0 - k * 0.45, tmpP); L.push([q.x + q.y + 0.15, 4, o, s0 - k * 0.45, k]); }
      }
      L.push([ENTX + ENTY + 1.4, 6]);
      L.sort((a, b) => a[0] - b[0]);
      for (const it of L) {
        const ty = it[1];
        if (ty === 0) { const o = it[2]; if (o.k === 'ride') drawRide(o, t); else if (o.k === 'stall') drawStall(o, t); else drawScen(o, t); if (ui.sel === o.id && o.k !== 'scen') { const X = PX(o.x + o.w / 2, o.y + o.w / 2), Y = PY(o.x + o.w / 2, o.y + o.w / 2, 0); poly(ctx, [X - 4, Y + 4, X + 4, Y + 4, X, Y + 9], '#ffff00', '#000'); } }
        else if (ty === 1) drawPiece(it[2], it[3], it[4]);
        else if (ty === 2) drawGuest(it[2]);
        else if (ty === 3) drawStaff(it[2]);
        else if (ty === 4) drawCar(it[2], it[3], it[4]);
        else if (ty === 5) drawFurn(it[2], t);
        else if (ty === 6) drawGate(t);
      }
      // rides nobody can get into
      if (Math.sin(t * 4) > -0.3) for (const o of Object.values(S.objs)) {
        if ((o.k !== 'ride' && o.k !== 'stall' && !(o.k === 'coaster' && o.complete)) || (o._ent && o._ent.length)) continue;
        const p0 = o.k === 'coaster' ? o.pieces[1] : o, w = o.k === 'coaster' ? 1 : o.w, X = PX(p0.x + w / 2, p0.y + w / 2), Y = PY(p0.x + w / 2, p0.y + w / 2, 0) - (o.k === 'stall' ? 22 : 30);
        poly(ctx, [X, Y - 7, X + 7, Y + 5, X - 7, Y + 5], '#ffd400', '#000'); rect(X - 0.5, Y - 3, 1, 4, '#000'); rect(X - 0.5, Y + 2, 1, 1, '#000');
      }
      // the coaster builder's cursor
      const co = S.objs[S.build];
      if (co && co.k === 'coaster' && !co.complete && tool === 'coaster') {
        const n = nextSpot(co), ok = inB(n.x, n.y) && clearable(n.y * N + n.x);
        const blink = Math.sin(t * 8) > 0;
        poly(ctx, [PX(n.x, n.y), PY(n.x, n.y, n.h), PX(n.x + 1, n.y), PY(n.x + 1, n.y, n.h), PX(n.x + 1, n.y + 1), PY(n.x + 1, n.y + 1, n.h), PX(n.x, n.y + 1), PY(n.x, n.y + 1, n.h)], ok ? (blink ? 'rgba(255,255,0,.5)' : 'rgba(255,255,0,.25)') : 'rgba(255,0,0,.4)', '#fff');
        const cx = n.x + 0.5, cy = n.y + 0.5;
        line(PX(cx - DX[n.d] * 0.3, cy - DY[n.d] * 0.3), PY(cx - DX[n.d] * 0.3, cy - DY[n.d] * 0.3, n.h), PX(cx + DX[n.d] * 0.35, cy + DY[n.d] * 0.35), PY(cx + DX[n.d] * 0.35, cy + DY[n.d] * 0.35, n.h), '#000', 2);
        if (n.h > 0) line(PX(cx, cy), PY(cx, cy, 0), PX(cx, cy), PY(cx, cy, n.h), 'rgba(255,255,0,.6)');
        // the way home: a dotted line back to the station
        const st = co.pieces[0]; if (Math.hypot(st.x - n.x, st.y - n.y) > 1.5) { ctx.setLineDash([2, 3]); line(PX(cx, cy), PY(cx, cy, n.h), PX(st.x + 0.5 - DX[st.d], st.y + 0.5 - DY[st.d]), PY(st.x + 0.5 - DX[st.d], st.y + 0.5 - DY[st.d], 0), 'rgba(255,255,255,.5)'); ctx.setLineDash([]); }
      }
      // the weather
      const wx = S.wx ? S.wx.k : 'sun';
      if (wx === 'rain') {
        ctx.fillStyle = 'rgba(20,30,60,.22)'; ctx.fillRect(0, 0, VW, VH);
        ctx.strokeStyle = 'rgba(190,210,255,.55)'; ctx.beginPath();
        const n2 = Math.min(260, (VW * VH / 900) | 0);
        for (let k = 0; k < n2; k++) { const x = (hash(k, 7) * VW + t * 40) % VW, y = (hash(k, 3) * VH + t * (260 + hash(k, 1) * 80)) % VH; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6); }
        ctx.stroke();
      } else if (wx === 'cloud') { ctx.fillStyle = 'rgba(40,40,60,.12)'; ctx.fillRect(0, 0, VW, VH); }
      else if (wx === 'hot') { ctx.fillStyle = 'rgba(255,160,40,.10)'; ctx.fillRect(0, 0, VW, VH); }
      // floating numbers
      ctx.font = 'bold 8px Arial';
      for (let k = FX.length - 1; k >= 0; k--) {
        const f = FX[k]; f.t += 1 / 60; if (f.t > 1.4) { FX.splice(k, 1); continue; }
        const X = PX(f.x, f.y), Y = PY(f.x, f.y, f.z) - 8 - f.t * 14;
        ctx.globalAlpha = Math.min(1, (1.4 - f.t) * 2); ctx.fillStyle = '#000'; ctx.fillText(f.txt, X - 5, Y + 1); ctx.fillStyle = f.col; ctx.fillText(f.txt, X - 6, Y); ctx.globalAlpha = 1;
      }
      // puffs of dust where something was built
      for (let k = PUFF.length - 1; k >= 0; k--) {
        const p = PUFF[k]; p.t += 1 / 60; if (p.t > 0.7) { PUFF.splice(k, 1); continue; }
        for (let q = 0; q < 8; q++) { const a = q * TAU / 8, r = 6 + p.t * 30; ctx.fillStyle = `rgba(230,220,190,${0.8 - p.t})`; ctx.beginPath(); ctx.arc(PX(p.x, p.y) + Math.cos(a) * r * p.w, PY(p.x, p.y, 0) + Math.sin(a) * r * 0.5 * p.w - p.t * 6, 3 + p.t * 6, 0, TAU); ctx.fill(); }
      }
    }
    const PUFF = [];

    // ================================================================ saving
    const SLOTS = ['1', '2', '3'];
    function pack(st) { return JSON.parse(JSON.stringify(st || S, (k, v) => (k[0] === '_' ? undefined : v))); }
    function saveSlot(k, st) { st = st || S; if (!st) return; const S0 = S; S = st; const when = dateStr(); S = S0; G.save('slot' + k, { when, park: st.pname || SCENARIOS[st.si].n, guests: st.guests.length, money: st.money, s: pack(st) }); }
    // the autosave slot always holds YOUR park (never one you're visiting)
    function autosave() { if (V) { if (home) saveSlot('A', home); } else saveSlot('A'); }
    function slotInfo(k) { const v = G.load('slot' + k, null); return v ? `${v.park} - ${v.when} (${v.guests} guests, ${money(v.money)})` : '(empty)'; }
    function loadSlot(k) {
      if (k === 'C') { V = null; home = null; startGame(callumPark()); news('Callum: "This is MY park. Don\'t knock down my coaster." - C', null); return; }
      const v = G.load('slot' + k, null); if (!v || !v.s) { G.msg('Load Game', 'That slot is empty.', 'info'); return; }
      const st = v.s; if (!Array.isArray(st.ground) || st.ground.length !== NN || !SCENARIOS[st.si]) { G.msg('Load Game', 'This saved game is corrupted. (Did Dave save over it?)', 'warn'); return; }
      V = null; home = null; rebuildFrom(st); startGame(st); G.sfx('solve');
    }
    function rebuildFrom(st) { S = st; rebuildGM(); crowdDone = st.guests.length >= 50; }
    function saveDlg() {
      if (!S || V) return;
      ui.win('save', 'Save Game', () => ({ html: `<p>Pick a slot to save in:</p><div class="dg-park-list">${SLOTS.map(k => `<div data-a="s" data-v="${k}">Slot ${k}: ${esc(slotInfo(k))}</div>`).join('')}</div>`, acts: { s: k => { saveSlot(k); G.sfx('solve'); ui.hint('Game saved in slot ' + k, 0); ui.closeWin('save'); } } }), { w: 300 });
    }
    function loadList() {
      return [['A', 'Autosave: ' + slotInfo('A')], ...SLOTS.map(k => [k, 'Slot ' + k + ': ' + slotInfo(k)]), ['C', 'CALLUM.SV4 (Callum\'s park, off his floppy disk)']];
    }

    // ================================================================ JackNet Parks: upload yours, visit (and rate) everybody else's
    // the upload is small: the tiles as digit strings and the things on them (no guests: visitors' guests are made fresh)
    function packNet(st) {
      const o = Object.values(st.objs).map(b => b.k === 'ride' ? ['r', b.type, b.x, b.y, b.name, b.price] : b.k === 'stall' ? ['s', b.type, b.x, b.y, b.price] : b.k === 'scen' ? ['e', b.type, b.x, b.y]
        : ['c', b.name, b.price, b.pieces.map(p => [p.x, p.y, p.d, p.nd, p.h, p.h2, p.t]), b.complete ? 1 : 0, b.tested ? 1 : 0]);
      return { v: 1, si: st.si, pname: String(st.pname || '').slice(0, 30), fee: st.fee, rating: st.rating, best: st.best, day: Math.floor(st.day), wx: st.wx ? st.wx.k : 'sun',
        g: st.ground.join(''), p: st.path.join(''), f: st.furn.join(''), o, h: st.staff.filter(x => x.k === 'handy').length, m: st.staff.filter(x => x.k === 'mek').length, n: st.guests.length };
    }
    function netStats(st) {
      const rides = Object.values(st.objs).filter(o => o.k === 'ride' || (o.k === 'coaster' && o.tested)).length;
      return { guests: st.guests.length, rating: st.rating, rides, coaster: +(st.best || 0).toFixed(2), scen: SCENARIOS[st.si] ? SCENARIOS[st.si].n : '' };
    }
    function unpackNet(d) {
      if (!d || typeof d !== 'object') return null;
      const digits = (str, max) => typeof str === 'string' && str.length === NN && /^[0-9]+$/.test(str) ? [...str].map(c => Math.min(max, +c)) : null;
      const gr = digits(d.g, 1), pa = digits(d.p, 2), fu = digits(d.f, 3); if (!gr || !pa || !fu) return null;
      const si = SCENARIOS[d.si | 0] ? d.si | 0 : 0, st = newState(si, 0);
      Object.assign(st, { ground: gr, path: pa, furn: fu, litter: new Array(NN).fill(0), obj: new Array(NN).fill(0), objs: {}, nid: 1, guests: [], staff: [], open: true, money: 0, loan: 0,
        fee: clamp(+d.fee || 0, 0, 30), rating: clamp(d.rating | 0, 0, 999), best: clamp(+d.best || 0, 0, 12), day: clamp(d.day | 0, 0, 239), pname: String(d.pname || 'A park').slice(0, 30), wx: { k: WX[d.wx] ? d.wx : 'sun', d: 3 }, news: [], speed: 1 });
      for (let i = 0; i < NN; i++) { if (st.path[i]) st.ground[i] = 0; if (st.path[i] !== 1) st.furn[i] = 0; }
      const okXY = (x, y, w) => { for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) { if (!inB(x + xx, y + yy)) return false; const i = (y + yy) * N + x + xx; if (st.ground[i] || st.path[i] || st.obj[i]) return false; } return true; };
      const put = (o, w) => { const id = st.nid++; o.id = id; st.objs[id] = o; for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) st.obj[(o.y + yy) * N + o.x + xx] = id; return o; };
      const txt = (v, n) => String(v == null ? '' : v).slice(0, n);
      const coasters = [];
      for (const a of Array.isArray(d.o) ? d.o.slice(0, 900) : []) {
        if (!Array.isArray(a)) continue;
        const x = a[2] | 0, y = a[3] | 0;
        if (a[0] === 'r' && RIDES[a[1]] && okXY(x, y, RIDES[a[1]].w)) put({ k: 'ride', type: a[1], x, y, w: RIDES[a[1]].w, name: txt(a[4], 30) || RIDES[a[1]].n, price: clamp(+a[5] || 0, 0, 20), open: true, st: 'wait', t: Math.random() * 4, waiting: [], riders: [], total: 0, income: 0, cycles: 0, rot: 0 }, RIDES[a[1]].w);
        else if (a[0] === 's' && STALLS[a[1]] && okXY(x, y, 1)) put({ k: 'stall', type: a[1], x, y, w: 1, name: STALLS[a[1]].n, price: clamp(+a[4] || 0, 0, 10), sold: 0, income: 0 }, 1);
        else if (a[0] === 'e' && SCEN[a[1]] && !SCEN[a[1]].path && okXY(x, y, 1)) put({ k: 'scen', type: a[1], x, y, w: 1 }, 1);
        else if (a[0] === 'c' && Array.isArray(a[3]) && a[3].length >= 3 && a[3].length <= 400) coasters.push(a);
      }
      for (const a of coasters) {
        const ps = a[3].map(p => Array.isArray(p) ? { x: p[0] | 0, y: p[1] | 0, d: (p[2] | 0) & 3, nd: (p[3] | 0) & 3, h: clamp(p[4] | 0, 0, 7), h2: clamp(p[5] | 0, 0, 7), t: String(p[6]) } : null);
        if (ps.some(p => !p || !(p.t === 'st' || PCOST[p.t]) || !inB(p.x, p.y) || st.ground[p.y * N + p.x] || st.path[p.y * N + p.x] || st.obj[p.y * N + p.x])) continue;
        if (ps.slice(0, 3).some(p => p.t !== 'st')) continue;
        const co = { k: 'coaster', name: txt(a[1], 30) || 'Coaster', pieces: ps, price: clamp(+a[2] || 0, 0, 20), open: false, st: 'built', t: 0, waiting: [], riders: [], total: 0, income: 0, cycles: 0, rate: null, prof: null, byPlayer: true, rt: 0, complete: isClosed({ pieces: ps }) };
        const id = st.nid++; co.id = id; st.objs[id] = co; ps.forEach(p => { st.obj[p.y * N + p.x] = id; });
        if (co.complete && a[5]) { const r = simulate(co); if (r.ok) Object.assign(co, { tested: true, rate: { e: r.e, i: r.i, n: r.n, maxV: r.maxV, time: r.time, len: r.len, loops: r.loops, drops: r.drops, maxH: r.maxH }, prof: r.prof, st: 'wait', open: true, ts: 2.4 }); }
      }
      const mk = k => ({ id: st.gid++, k, ti: ENT, ni: ENT, x: ENTX + 0.5, y: ENTY + 0.5, tx: ENTX + 0.5, ty: ENTY + 0.5, last: -1, st: 'walk', timer: 0, ph: 0, ox: (Math.random() - 0.5) * 0.3, oy: (Math.random() - 0.5) * 0.3, swept: 0, fixed: 0, job: 0, name: (k === 'handy' ? 'Handyman ' : 'Mechanic ') });
      for (let k = 0; k < clamp(d.h | 0, 0, 12); k++) { const s2 = mk('handy'); s2.name += k + 1; st.staff.push(s2); }
      for (let k = 0; k < clamp(d.m | 0, 0, 12); k++) { const s2 = mk('mek'); s2.name += k + 1; st.staff.push(s2); }
      st._n = clamp(d.n | 0, 10, 90);
      return st;
    }
    function netParks() {
      D.showcase('park', { title: 'JackNet Parks', sub: 'Theme parks built by JackNet members. Visit them, read the guests\' minds, and give them stars.', what: 'a park', icon: (D.GAMES.park && D.GAMES.park.icon) || '', c1: '#1a6a2a',
        stats: e => { const t = e.stats || {}; return `${esc(t.guests | 0)} guests, rating ${esc(t.rating | 0)}, ${esc(t.rides | 0)} rides${+t.coaster ? `, best coaster ${esc((+t.coaster).toFixed(2))}` : ''}${t.scen ? ` <span class="dsc-dim">(${esc(t.scen)})</span>` : ''}`; },
        visit: e => visitPark(e),
        mine: () => { let st = V ? home : S; if (!st) { const a = AS.load(); if (a && Array.isArray(a.ground) && a.ground.length === NN && SCENARIOS[a.si]) st = fixup(a); } if (!st) return null; return { title: st.pname || SCENARIOS[st.si].n, data: packNet(st), stats: netStats(st) }; },
        noMine: 'Build a park first (Start New Game), then come back here and upload it for everybody to visit!', upLabel: 'Upload my park' });
    }
    function visitPark(e) {
      const st = unpackNet(e.data);
      if (!st) { G.msg('JackNet Parks', 'That park got scrambled on the way down the phone line. Try another one!', 'warn'); return; }
      if (S && !V) { home = S; autosave(); }
      V = { name: String(e.name || '?'), title: String(e.title || st.pname), entry: e };
      const n = st._n; S = st; rebuildGM(); spawnT = 2;
      startGame(st);
      links();
      const paths = []; for (let i = 0; i < NN; i++) if (S.path[i] === 1) paths.push(i);
      if (paths.length) for (let k = 0; k < n; k++) { const g = spawnGuest(paths[(Math.random() * paths.length) | 0]); g.age = Math.random() * 120; g.hunger = Math.random() * 70; g.thirst = Math.random() * 70; }
      S.speed = 1; ui.refresh(); centreOn0();
      try { G.w.restore(); G.w.focus(); } catch (er) {}
      G.sfx('join');
    }
    function centreOn0() { if (ui) ui.centreOn(ENTX + 0.5, ENTY - 6); }
    function leaveVisit() {
      V = null; const h = home; home = null;
      if (h) { startGame(h); S.speed = 0; ui.refresh(); ui.hint('Welcome back to your own park! It\'s paused: press Space or a speed button.', 0); }
      else titleScreen();
    }

    // ================================================================ Handyman Harry's tips (skippable, remembered)
    const harry = (() => {
      let hs = Object.assign({ step: 0, off: false, min: false, done: false }, G.load('harry', {}));
      let el = null, p0 = -1, okT = 0;
      const save = () => G.save('harry', hs);
      const all = () => Object.values(S.objs);
      const has = f => { links(); return all().some(f); };
      const paths = () => { let n = 0; for (let i = 0; i < NN; i++) if (S.path[i] === 1) n++; return n; };
      const STEPS = [
        { t: 'Alright! I\'m Harry, the handyman round here. The boss asked me to show you the ropes. It\'s dead easy. Ready?', next: 'Let\'s go!' },
        { t: 'First, PATHS. Click the path button (the brown slabs) and drag across the grass, starting next to the main path. Guests only ever walk on paths!', k: 'path', ok: () => paths() >= p0 + 4 },
        { t: 'Now a RIDE. Click the Rides button, pick the Jack-Go-Round and put it on the grass right next to your path.', k: 'ride', ok: () => has(o => o.k === 'ride') },
        { t: 'Guests need a QUEUE LINE to get on. Click the queue button (the blue one) and lay a queue from your path right up to the side of the ride.', k: 'queue', ok: () => has(o => o.k === 'ride' && o._ent && o._ent.length) },
        { t: 'New rides are CLOSED. Click your ride (with the arrow) and press Open ride.', k: 'look', ok: () => has(o => o.k === 'ride' && o.open) },
        { t: 'Guests get hungry and thirsty. Put a food stall AND a Fizzy Pop next to a path (the Shops button).', k: 'stall', ok: () => has(o => o.k === 'stall' && STALLS[o.type].need === 'hunger') && has(o => o.k === 'stall' && STALLS[o.type].need === 'thirst') },
        { t: 'Right, we\'re ready! Click the gate button and press OPEN THE PARK.', k: 'park', ok: () => S.open },
        { t: 'Guests pay an ENTRY FEE at the gate, plus a ticket for every ride. Too dear and they stay at home, too cheap and you go bust. The Park window shows what they think is fair.', next: 'Got it' },
        { t: 'Where there\'s guests, there\'s litter. Hire a Handyman from the Staff button (the man with the broom). A Mechanic too: rides WILL break down.', k: 'staff', ok: () => S.staff.some(x => x.k === 'handy') },
        { t: 'Now the fun bit: your own ROLLERCOASTER! Click the coaster button, turn the station the way you want, and click on some clear grass.', k: 'coaster', ok: () => has(o => o.k === 'coaster') },
        { t: 'Add pieces with the buttons. A Chain lift drags the train up; drops make it fast. Get back into the station at ground level. Stuck? Press "Finish it" and I\'ll plot the way home.', k: 'coaster', ok: () => has(o => o.k === 'coaster' && o.complete) },
        { t: 'Press TEST RUN. An empty train goes round, and we find out how exciting, scary and sickly it is.', k: 'coaster', ok: () => has(o => o.k === 'coaster' && o.tested) },
        { t: 'Lay a queue line to the side of the station and press OPEN RIDE. Then listen to them scream!', k: 'queue', ok: () => has(o => o.k === 'coaster' && o.open) },
        { t: 'That\'s all I know! Watch your Park rating, your cash, and what the guests are thinking (the Guests button). The goal is at the bottom of the screen. Good luck, boss!', next: 'Cheers, Harry!' },
      ];
      function hide(gone) { if (el) el.remove(); el = null; if (ui && ui.tb) ui.tb.querySelectorAll('.dg-park-pulse').forEach(b => b.classList.remove('dg-park-pulse')); if (gone) el = null; }
      function render(flash) {
        if (!ui || V || !S || hs.off || hs.done) { hide(); return; }
        if (el) el.remove();
        const stp = STEPS[hs.step];
        if (hs.step === 1 && p0 < 0) p0 = paths();
        el = document.createElement('div');
        if (hs.min) { el.className = 'dg-park-harrymin'; el.innerHTML = `${HARRY}<span>Harry's tip</span>`; el.title = 'Show Handyman Harry\'s tip'; el.addEventListener('click', () => { hs.min = false; save(); G.sfx('click'); render(); }); }
        else {
          el.className = 'dg-park-harry' + (flash ? ' ok' : '');
          el.innerHTML = `<div class="dph-t"><span>Handyman Harry's Tips</span><button type="button" data-h="min" title="Tuck Harry away" aria-label="Minimise">_</button><button type="button" data-h="off" title="No more tips" aria-label="Close">x</button></div><div class="dph-b">${HARRY}<div class="dph-x">${flash ? '<p><b style="color:#008000">Nice one!</b></p>' : ''}<p>${esc(stp.t)}</p></div></div><div class="dph-f"><small>Tip ${hs.step + 1} of ${STEPS.length}</small>${stp.next ? `<button type="button" class="btn" data-h="next"><b>${esc(stp.next)}</b></button>` : ''}<button type="button" class="btn" data-h="off">Skip tips</button></div>`;
          el.addEventListener('click', ev => { const b = ev.target.closest('[data-h]'); if (!b) return; G.sfx('click'); const a = b.dataset.h; if (a === 'min') { hs.min = true; save(); render(); } else if (a === 'next') advance(); else if (a === 'off') harry.off(); });
        }
        el.addEventListener('pointerdown', ev => ev.stopPropagation());
        ui.view.appendChild(el);
        ui.tb.querySelectorAll('.dg-park-b').forEach(b => b.classList.toggle('dg-park-pulse', !hs.min && !!stp.k && stp.k !== 'look' && b.dataset.k === stp.k && ui.tool.split(':')[0] !== stp.k));
        if (G.phone) { const hn = ui.view.querySelector('.dg-park-hint'); if (hn) hn.style.top = hs.min ? '' : (el.offsetHeight + 8) + 'px'; }
      }
      function advance() {
        hs.step++; p0 = -1;
        if (hs.step >= STEPS.length) { hs.done = true; save(); hide(); G.secret('park.harry'); G.sfx('solve'); return; }
        save(); render();
      }
      return {
        start() { p0 = -1; render(); },
        hide,
        tick() {
          if (!el || V || !S || hs.off || hs.done) return;
          const stp = STEPS[hs.step];
          if (stp.ok && stp.ok()) { if (performance.now() - okT < 900) return; okT = performance.now(); hs.step++; p0 = -1; if (hs.step >= STEPS.length) { hs.done = true; save(); hide(); G.secret('park.harry'); return; } save(); G.sfx('solve'); render(true); return; }
          // keep the flashing button in step with the tool
          ui.tb.querySelectorAll('.dg-park-b').forEach(b => b.classList.toggle('dg-park-pulse', !hs.min && !!stp.k && stp.k !== 'look' && b.dataset.k === stp.k && ui.tool.split(':')[0] !== stp.k));
        },
        off() { hs.off = true; save(); hide(); G.toast('RollerJack Tycoon', 'Harry has gone for a cup of tea. (Help > Handyman Harry\'s Tips brings him back.)', 3500); },
        reset() { hs = { step: 0, off: false, min: false, done: false }; save(); if (S && ui && !V) render(); else G.toast('RollerJack Tycoon', 'Harry will be back with his tips when you start a park.', 3000); },
        get on() { return !hs.off && !hs.done; },
      };
    })();
    function keysHelp() {
      G.msg('RollerJack Tycoon: Keys', 'LOOKING ROUND\nArrow keys: scroll   + and -: zoom   Drag: scroll\nSpace: pause   1, 2, 3: speed\n\nBUILDING\nP: paths   J: queue lines   R: rides   K: shops   S: scenery\nC: coaster   B: demolish   H: staff   Esc: stop building\nCtrl+Z: undo the last thing you built (full refund)\n\nWINDOWS\nO: park   F: finances   G: guests   M: messages\n\nBUILDING A COASTER\nLeft/Right arrow: curves   Up arrow: straight\nU: up   N: down   X: big drop   C: chain lift   O: loop\nBackspace: undo a piece   F: finish it for me   K: test run', 'info');
    }

    // Callum's save: a busy park with his coaster (built with the same tools as yours)
    function callumPark() {
      const st = newState(0, 4);
      S = st; rebuildGM();
      const clear = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * N + x; st.ground[i] = 0; const o = st.objs[st.obj[i]]; if (o && o.k === 'scen') { delete st.objs[o.id]; st.obj[i] = 0; } } };
      clear(2, 11, 21, 23); clear(2, 2, 13, 11);
      st.money = 99999; st.loan = 10000;
      const P = (x0, y0, x1, y1, q) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) build(q ? 'queue' : 'path', x, y, true); };
      P(ENTX, 12, ENTX, 23); P(5, 12, 18, 12); P(12, 3, 12, 11); P(9, 3, 11, 3); P(4, 3, 8, 3, true); P(18, 13, 18, 17);
      build('ride:carousel', 12, 19, true); build('ride:wheel', 8, 13, true); build('ride:teacups', 13, 13, true); build('ride:bumper', 19, 13, true); build('ride:haunted', 9, 18, true);
      build('stall:burger', 10, 20, true); build('stall:pop', 10, 21, true); build('stall:toilet', 12, 21, true); build('stall:info', 12, 22, true); build('stall:lolly', 17, 16, true);
      P(12, 18, 13, 18, true);
      for (const [x, y, ty] of [[16, 10, 'fountain'], [9, 10, 'statue'], [14, 10, 'flowers'], [15, 10, 'flowers'], [7, 10, 'oak'], [6, 10, 'pine'], [17, 10, 'oak'], [10, 15, 'flowers']]) build('scen:' + ty, x, y, true);
      [[ENTX, 20, 'bin'], [ENTX, 15, 'bench'], [8, 12, 'bin'], [15, 12, 'bench'], [ENTX, 13, 'lamp'], [16, 12, 'lamp']].forEach(([x, y, t]) => build('scen:' + t, x, y, true));
      const co = startCoaster(4, 4, 0);
      'ch ch ch s r s dn dn dn r s s s s s s s r s s s s r'.split(' ').forEach(t => addPiece(co, t, true));
      co.name = 'Callum\'s Corkscrew (no corkscrew)'; co.byPlayer = false;
      const r = simulate(co); if (r.ok) { co.tested = true; co.rate = { e: r.e, i: r.i, n: r.n, maxV: r.maxV, time: r.time, len: r.len }; co.prof = r.prof; co.st = 'wait'; co.open = true; co.ts = 2.4; st.best = r.e; }
      Object.values(st.objs).forEach(o => { if (o.k === 'ride') o.open = true; });
      st.money = 7340; st.fin = blankFin(); st.day = 30 * 3 + 13; st.open = true; st.fee = 4; st.rating = 640; st.si = 0;
      hireQuiet('handy'); hireQuiet('handy'); hireQuiet('mek');
      st._rev = 99; links();
      const paths = []; for (let i = 0; i < NN; i++) if (st.path[i] === 1) paths.push(i);
      for (let k = 0; k < 34; k++) { const g = spawnGuest(paths[(Math.random() * paths.length) | 0]); g.age = Math.random() * 100; }
      for (let k = 0; k < 6; k++) st.litter[paths[(Math.random() * paths.length) | 0]] = 1 + (k % 3);
      st.news = [];
      return st;
    }
    function hireQuiet(k) { const s = { id: S.gid++, k, ti: ENT, ni: ENT, x: ENTX + 0.5, y: ENTY + 0.5, tx: ENTX + 0.5, ty: ENTY + 0.5, last: -1, st: 'walk', timer: 0, ph: 0, ox: 0, oy: 0, swept: 0, fixed: 0, job: 0 }; s.name = (k === 'handy' ? 'Handyman ' : 'Mechanic ') + (S.staff.filter(x => x.k === k).length + 1); S.staff.push(s); }

    // ================================================================ title screen
    function titleScreen() {
      if (ui) { ui.destroy(); ui = null; }
      if (title) { title.close(); title = null; }
      S = null; cv = null; V = null; home = null;
      const el = document.createElement('div'); el.className = 'dg-park-title';
      el.innerHTML = `<canvas></canvas><div class="dg-park-logo"><div class="c">JACKLOOP SOFTWARE PRESENTS</div><div class="a">ROLLERJACK</div><div class="b">TYCOON</div></div><div class="dg-park-tmenu"></div><div class="dg-park-tfoot">v1.1${G.demo ? ' DEMO' : ''} &copy; 1999 JackLoop Software</div>`;
      root.appendChild(el);
      const tc = el.querySelector('canvas'), tx = tc.getContext('2d');
      const menu = el.querySelector('.dg-park-tmenu');
      [['new', IC.new, 'Start New Game', () => scenarioPick()], ['load', IC.load, 'Load Saved Game', () => loadPick()], ['net', IC.net, 'JackNet Parks', () => netParks(), 'Visit and rate parks built by other JackNet members, or upload yours'], ['help', IC.help, 'How to Play', () => howTo()], ['quit', IC.quit, 'Exit', () => G.quit()]].forEach(([k, ic, n, fn, tip]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dg-park-tbtn' + (k === 'net' ? ' net' : ''); b.innerHTML = ic + `<span>${n}</span>`; b.dataset.k = k; if (tip) b.title = tip;
        b.addEventListener('click', () => { G.sfx('button'); fn(); }); menu.appendChild(b);
      });
      let stop = false;
      const T0 = performance.now();
      const pts = [];
      function anim() {
        if (stop || G.closed || !live()) return;
        requestAnimationFrame(anim);
        if (!G.visible()) return;
        const r = el.getBoundingClientRect(); const W = Math.max(80, Math.round(r.width / 2)), H = Math.max(60, Math.round(r.height / 2));
        if (tc.width !== W || tc.height !== H) { tc.width = W; tc.height = H; pts.length = 0; for (let k = 0; k <= 200; k++) { const u = k / 200; pts.push([u * W * 1.4 - W * 0.2, H * (0.62 - 0.32 * Math.max(0, Math.sin(u * 7.5 + 1)) * (0.5 + 0.5 * Math.sin(u * 3))) + Math.sin(u * 25) * 2]); } }
        const t = (performance.now() - T0) / 1000;
        const sky = tx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1050c0'); sky.addColorStop(0.6, '#70b0ff'); sky.addColorStop(1, '#c8e8ff'); tx.fillStyle = sky; tx.fillRect(0, 0, W, H);
        tx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { const cx2 = ((k * 97 + t * 6) % (W + 60)) - 30, cy2 = 20 + k * 13; tx.beginPath(); tx.arc(cx2, cy2, 8, 0, TAU); tx.arc(cx2 + 9, cy2 - 3, 9, 0, TAU); tx.arc(cx2 + 18, cy2, 7, 0, TAU); tx.fill(); }
        tx.fillStyle = '#3a8a2a'; tx.beginPath(); tx.moveTo(0, H); for (let x = 0; x <= W; x += 8) tx.lineTo(x, H * 0.78 + Math.sin(x * 0.02) * 8); tx.lineTo(W, H); tx.fill();
        tx.fillStyle = '#2a7020'; tx.beginPath(); tx.moveTo(0, H); for (let x = 0; x <= W; x += 8) tx.lineTo(x, H * 0.86 + Math.sin(x * 0.03 + 2) * 6); tx.lineTo(W, H); tx.fill();
        // coaster supports and track
        tx.strokeStyle = '#c0c0d0'; tx.lineWidth = 1; for (let k = 0; k < pts.length; k += 6) { tx.beginPath(); tx.moveTo(pts[k][0], pts[k][1]); tx.lineTo(pts[k][0], H * 0.82); tx.stroke(); }
        tx.strokeStyle = '#e02020'; tx.lineWidth = 2; tx.beginPath(); pts.forEach((p, k) => k ? tx.lineTo(p[0], p[1]) : tx.moveTo(p[0], p[1])); tx.stroke();
        // the train
        const pos = (t * 22) % 200;
        for (let c = 0; c < 4; c++) { const i = Math.floor((pos - c * 4 + 200) % 200); const p = pts[i], q = pts[Math.min(200, i + 1)]; const a = Math.atan2(q[1] - p[1], q[0] - p[0]); tx.save(); tx.translate(p[0], p[1] - 3); tx.rotate(a); tx.fillStyle = c ? '#2050e0' : '#ffd400'; tx.fillRect(-4, -3, 8, 4); tx.fillStyle = '#f0c8a0'; tx.fillRect(-2, -6, 2, 2); tx.fillRect(1, -6, 2, 2); tx.restore(); }
        // a big wheel and the carousel
        const wx = W * 0.82, wy = H * 0.55, R = Math.min(W, H) * 0.16;
        tx.strokeStyle = '#e8e8f0'; tx.lineWidth = 1; tx.beginPath(); tx.arc(wx, wy, R, 0, TAU); tx.stroke();
        for (let k = 0; k < 8; k++) { const a = t * 0.4 + k * TAU / 8; tx.beginPath(); tx.moveTo(wx, wy); tx.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); tx.stroke(); tx.fillStyle = ['#e02020', '#ffd400', '#2050e0', '#20a020'][k % 4]; tx.fillRect(wx + Math.cos(a) * R - 2, wy + Math.sin(a) * R, 5, 4); }
        tx.beginPath(); tx.moveTo(wx - R * 0.6, H * 0.8); tx.lineTo(wx, wy); tx.lineTo(wx + R * 0.6, H * 0.8); tx.stroke();
        // beach balls bouncing in the foreground
        for (let k = 0; k < 5; k++) { const x = (k * 71 + t * 14) % (W + 20) - 10, y = H * 0.9 - Math.abs(Math.sin(t * 3 + k)) * 10; for (let q = 0; q < 4; q++) { tx.fillStyle = ['#e02020', '#ffffff', '#2050e0', '#ffd400'][q]; tx.beginPath(); tx.moveTo(x, y); tx.arc(x, y, 4, q * Math.PI / 2 + t, (q + 1) * Math.PI / 2 + t); tx.fill(); } }
      }
      requestAnimationFrame(anim);
      title = { el, close() { stop = true; el.remove(); } };
      G.onClose(() => { stop = true; });
      if (opts.music) G.music('rsquig');
      G.status(G.demo ? 'DEMO VERSION: one month of park building. Full version in the shops ' + D.longDate(G.def.rel) + '!' : 'Welcome to RollerJack Tycoon!');
      buildMenu();
    }
    function panel(titleTxt, html, w) {
      const box2 = document.createElement('div'); box2.className = 'dg-park-win pnl'; box2.style.cssText = `left:50%;top:50%;transform:translate(-50%,-50%);width:${w || 360}px;z-index:30`;
      box2.innerHTML = `<div class="dg-park-wt"><span>${esc(titleTxt)}</span><button type="button" aria-label="Close">x</button></div><div class="dg-park-wb">${html}</div>`;
      (title ? title.el : root).appendChild(box2);
      box2.querySelector('.dg-park-wt button').addEventListener('click', () => box2.remove());
      return box2;
    }
    function scenarioPick(pre) {
      const won = G.load('won', {});
      const p = panel('Select Scenario', `<div class="dg-park-scen"><div class="dg-park-list" style="flex:0 0 140px">${SCENARIOS.map((sc, i) => `<div data-i="${i}" class="${G.demo && i ? ' off' : ''}" title="${esc(sc.lvl)}">${won[i] ? '<span class="tr" title="Beaten!">&#9733;</span> ' : ''}${esc(sc.n)}</div>`).join('')}</div><div class="dg-park-sd" style="flex:1;min-width:0"></div></div><div class="bb" style="justify-content:flex-end;display:flex;gap:6px;margin-top:8px"><button type="button" class="btn" data-go><b>Start!</b></button><button type="button" class="btn" data-x>Cancel</button></div>`, 440);
      let cur = pre != null && SCENARIOS[pre] ? pre : 0;
      const sd = p.querySelector('.dg-park-sd');
      const show = () => { const sc = SCENARIOS[cur]; sd.innerHTML = `<p><b>${esc(sc.n)}</b> <span class="dg-park-tag">${esc(sc.lvl)}</span>${won[cur] ? ' <span class="dg-park-tag" style="color:#c08000">&#9733; Beaten</span>' : ''}</p><p>${esc(sc.d)}</p><p><b>Objective:</b> ${esc(objText(sc, true))}</p><p>Starting cash: ${money(sc.money)} (loan ${money(sc.loan)})</p>${sc.wet ? '<p>Weather: very rainy!</p>' : sc.sunny ? '<p>Weather: lots of sunshine.</p>' : ''}${G.demo && cur ? '<p style="color:#c00000"><b>Not available in the demo.</b></p>' : ''}`; p.querySelectorAll('[data-i]').forEach(e => e.classList.toggle('sel', +e.dataset.i === cur)); p.querySelector('[data-go]').disabled = G.demo && cur > 0; };
      p.querySelectorAll('[data-i]').forEach(e => e.addEventListener('click', () => { cur = +e.dataset.i; G.sfx('click'); show(); }));
      p.querySelector('[data-x]').addEventListener('click', () => p.remove());
      p.querySelector('[data-go]').addEventListener('click', () => { p.remove(); G.sfx('solve'); V = null; home = null; const st = newState(cur); S = st; rebuildGM(); crowdDone = false; spawnT = 2; startGame(st); });
      show();
    }
    function loadPick() {
      const p = panel('Load Saved Game', `<p>Choose a saved game:</p><div class="dg-park-list">${loadList().map(([k, n]) => `<div data-k="${k}">${esc(n)}</div>`).join('')}</div><div style="display:flex;justify-content:flex-end;margin-top:8px"><button type="button" class="btn" data-x>Cancel</button></div>`, 380);
      p.querySelectorAll('[data-k]').forEach(e => e.addEventListener('click', () => { const k = e.dataset.k; if (k !== 'C' && !G.load('slot' + k, null)) { G.sfx('beep'); return; } p.remove(); loadSlot(k); }));
      p.querySelector('[data-x]').addEventListener('click', () => p.remove());
    }
    const HOWTO = `HOW TO PLAY ROLLERJACK TYCOON

1. OPEN THE PARK. Click the gate button on the toolbar and press OPEN THE PARK. Guests pay to get in.
2. BUILD RIDES. Pick one from the Rides button and click a grassy spot next to a path.
3. QUEUE LINES. Lay a queue line (the blue path) from a path right up to the side of the ride. Then open the ride in its window. A flashing yellow ! means nobody can get in.
4. FEED THEM. Guests get hungry, thirsty and need the toilet. Put stalls next to paths. A Cash Machine lets them get more money out.
5. KEEP IT CLEAN. Hire Handymen to sweep up, and put bins on the paths. Benches help tired legs.
6. MECHANICS fix rides when they break down. They WILL break down.
7. BUILD A COASTER. Place the 3-tile station, then add pieces: curves, straights, slopes, big drops, chain lifts and LOOPS. Bring the track back round into the start of the station at ground level ("Finish it" does that for you). Test it, then open it! Chain lifts drag the train up hills; drops make it fast; loops need LOTS of speed.
8. THE WEATHER. When it rains, guests want umbrellas (from the Info Kiosk) and rides with a roof. In a heatwave they want ice lollies.
9. MONEY. Everything costs Rupees. Watch the Finances window. Three months in the red with the loan maxed out and the bank takes your park!
10. JACKNET PARKS. Upload your park for other members to visit, and visit theirs (Game menu).

Drag to look around (or use the arrow keys). Help > Keys lists every key. Made a mess? Ctrl+Z (or the undo button) takes back the last thing you built.

Guests have opinions. Lots of opinions. Click one to see what they think.
Mom says: one more month and then BED.`;
    function howTo() { const p = panel('Tutorial', `<pre style="white-space:pre-wrap;font:11px/1.35 Tahoma,sans-serif;margin:0;max-height:300px;overflow:auto">${esc(HOWTO)}</pre>`, 420); void p; }

    function buildMenu() {
      const inGame = !!(S && ui);
      G.menu([
        ['Game', () => [
          { label: 'New Game...', act: () => { if (inGame) autosave(); titleScreen(); scenarioPick(); } },
          { label: 'Load Game...', act: () => { if (inGame) { autosave(); titleScreen(); } loadPick(); } },
          { label: 'Save Game...', dis: !inGame || !!V, act: saveDlg },
          '-',
          { label: 'JackNet Parks...', act: netParks },
          ...(V ? [{ label: 'Leave this park', act: leaveVisit }] : []),
          '-',
          { label: 'Title Screen', dis: !inGame, act: () => { autosave(); titleScreen(); } },
          { label: 'Exit', act: () => G.quit() },
        ]],
        ['Options', () => [
          { label: 'Music', chk: opts.music, act: () => { opts.music = !opts.music; saveOpts(); if (opts.music) { G.music('rsquig'); if (!G.sound) G.toast('RollerJack Tycoon', 'Turn the sound on (the speaker by the clock) to hear the music!', 4000); } else G.stopMusic(); } },
          { label: 'Thought bubbles', chk: opts.bubbles, act: () => { opts.bubbles = !opts.bubbles; saveOpts(); } },
          { label: 'Handyman Harry\'s tips', chk: harry.on, act: () => { if (harry.on) harry.off(); else harry.reset(); } },
          '-',
          { label: 'Zoom in', dis: !inGame, act: () => { zoom = Math.min(3, zoom + 1); if (ui) ui.resize(); } },
          { label: 'Zoom out', dis: !inGame, act: () => { zoom = Math.max(1, zoom - 1); if (ui) ui.resize(); } },
        ]],
        ['Help', () => [{ label: 'How to Play', act: howTo }, { label: 'Keys', act: keysHelp }, { label: 'Handyman Harry\'s Tips (start again)', act: () => harry.reset() }, '-', { label: 'About RollerJack Tycoon', act: () => G.about() }]],
      ]);
    }

    // G._restart (demo nag) re-runs this module without clearing old listeners: only the newest copy acts
    const gen = G._parkGen = (G._parkGen || 0) + 1;
    const live = () => G._parkGen === gen;
    G.on(document, 'keydown', ev => {
      if (!live() || !G.focused() || !ui || title) return;
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      ui.key(ev);
    });
    G.onClose(() => { if (live() && S && ui) autosave(); });
    // the carry-on save (a refresh, a closed window or a Shut Down): the park as it is, back paused
    const AS = G.autosave(() => (!live() ? undefined : V ? (home ? pack(home) : undefined) : S && ui ? (S._demoOver || S.result === 'bust' ? null : pack()) : undefined));
    let errs = 0;
    G.loop((dt, t) => { if (!live()) return; try { frame(dt, t); } catch (e) { if (errs++ < 3) console.error(e); } });
    // a little hook for testing (client coordinates of a tile centre)
    root.__park = { st: () => S, centre: (x, y) => ui && ui.centreOn(x, y), at: (x, y, z) => { if (!cv) return null; const r = cv.getBoundingClientRect(); return { x: r.left + (sxw(x, y) - camx) * zoom, y: r.top + (syw(x, y, z || 0) - camy) * zoom }; },
      // fast-forward the simulation (game seconds), as if the clock ran
      ff: secs => { for (let k = 0; k < secs * 20 && S && !S.result; k++) sim(0.05); if (ui) ui.refresh(); return S && { guests: S.guests.length, rating: S.rating, money: S.money, day: S.day }; },
      build: (t, x, y) => build(t, x, y, true),
      coaster: (x, y, d, ts, fin) => { const co = startCoaster(x, y, d); if (!co) return 'station'; for (const t of ts) if (!addPiece(co, t, true)) return 'piece ' + t; if (fin) { const pl = planFinish(co); if (!pl) return 'noplan'; pl.ts.forEach(t => addPiece(co, t, true)); } return co.complete ? co.id : 'open'; },
      test: id => { const co = S.objs[id]; const r = simulate(co); return r.ok ? { e: r.e, i: r.i, n: r.n } : r.why; },
      plan: () => { const co = S.objs[S.build]; return co ? planFinish(co) : null; },
      visiting: () => !!V, home: () => !!home, harry: () => G.load('harry', {}), pack: () => S && packNet(S), unpack: d => !!unpackNet(d), zoom: () => zoom, cam: () => [camx, camy] };
    titleScreen();
    if (arg === 'callum') loadSlot('C');
    else {
      const st = AS.load();
      if (st && Array.isArray(st.ground) && st.ground.length === NN && SCENARIOS[st.si]) {
        try { rebuildFrom(st); startGame(st); S.speed = 0; if (ui) ui.refresh(); G.toast('RollerJack Tycoon', 'Welcome back! Your park is just as you left it. It\'s paused: press Space or a speed button to carry on.', 4500); }
        catch (e) { console.error(e); AS.clear(); titleScreen(); }
      }
    }
  });
})();

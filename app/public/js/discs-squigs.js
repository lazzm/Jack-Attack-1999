/* Jacks: Armageddon (Team Jack, 1999) for the Games Cupboard. Turn-based jack warfare on islands you can blow to
 * bits: bazookas, bouncy grenades, the BANANAAAGH! Bomb and the Holy Hand Jack. Hot-seat for 2-4 teams, or against
 * the computer. Original code and art: everything is drawn on a canvas. Loaded by discs.js (Discs.mod). */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ================================================================ the world
  const W = 1280, H = 600, WATER0 = 556, GRAV = 300, WINDK = 70, TICK = 1 / 120, PAR = 0.35;
  const THEMES = {
    jungle: { n: 'Jungle Island', water: ['#1a6ad0', '#3a8ae8', '#8ac8ff'], dirt: '#6a4222' },
    scrap: { n: 'Scrapyard', water: ['#3a5a1a', '#5a7a2a', '#a0c050'], dirt: '#7a4a2a' },
    kitchen: { n: 'Mom\'s Kitchen', water: ['#7a4a1a', '#9a6a3a', '#d0a070'], dirt: '#e0b070' },
    pc: { n: 'Inside Jack\'s PC', water: ['#06306a', '#1a6ab8', '#7af0ff'], dirt: '#2a8a3a' },
  };
  // the jacks' faces (picked by name, so a jack always looks the same) and the computer's skill levels
  const SKIN = ['#f6c9a0', '#e8b088', '#c98a5e', '#8d5a3b', '#f2d2b6', '#dca27a'];
  const AIL = {
    easy: { n: 'Rookie', err: 0.11, perr: 0.09, think: 1.7, sp: 0.12, walk: 1 },
    normal: { n: 'Regular', err: 0.04, perr: 0.035, think: 1.1, sp: 0.35, walk: 2 },
    hard: { n: 'Veteran', err: 0.01, perr: 0.01, think: 0.7, sp: 0.6, walk: 2 },
  };
  const BODY = ['#e0482a', '#3a7ae0', '#2ea84a', '#e0b020'];
  const LABEL = ['#ff7a5a', '#7ab0ff', '#6ae07a', '#ffe060'];
  const PRESETS = [
    { name: 'Jack\'s Lot', squigs: ['Jack', 'Big Jack', 'Lil\' Jack', 'Jack Jr'] },
    { name: 'Callum\'s Crew', squigs: ['Callum', 'Frag Master', 'Turbo', 'Lag'] },
    { name: 'N64 Massive', squigs: ['Luke', 'Dave', 'Rumble Pak', 'Blowy'] },
    { name: 'JackK\'s Army', squigs: ['JackK', 'Jumping Jack', 'Jack-in-a-Box', 'Gubbinz'] },
  ];
  const WPN = {
    bazooka: { n: 'Bazooka', type: 'charge', speed: 560, wind: 1, impact: 1, r: 26, dmg: 48, ammo: -1, demo: 1, d: 'Aim, hold fire to power up, let go. The wind blows it about.' },
    grenade: { n: 'Grenade', type: 'charge', speed: 430, fuse: 1, bounce: 0.5, r: 26, dmg: 48, ammo: -1, demo: 1, d: 'Bouncy. Set the fuse with keys 1-5 (or the FUSE button).' },
    cluster: { n: 'Cluster Bomb', type: 'charge', speed: 430, fuse: 1, bounce: 0.5, r: 20, dmg: 26, cl: 5, ammo: 3, d: 'Goes bang, then five little bangs.' },
    banana: { n: 'BANANAAAGH! Bomb', type: 'charge', speed: 430, fuse: 1, bounce: 0.55, r: 32, dmg: 55, cl: 5, ammo: 1, d: 'One banana becomes six bananas. Bouncy, fruity, VERY bad news.' },
    holy: { n: 'Holy Hand Jack', type: 'charge', speed: 380, bounce: 0.35, fixfuse: 3, r: 64, dmg: 85, ammo: 1, d: 'Lob it. Count to three. Hear the choir. Duck.' },
    homing: { n: 'Homing Missile', type: 'charge', home: 1, speed: 470, impact: 1, r: 28, dmg: 50, ammo: 1, d: 'Click the map to pick a target first, then fire it roughly that way. It finds its own way there.' },
    pet: { n: 'Cyber Pet', type: 'instant', r: 36, dmg: 62, ammo: 1, d: 'A little egg-shaped pocket pet with legs. It waddles off, beeping. Press fire again to make it go bang (or wait 6 seconds).' },
    shotgun: { n: 'Shotgun', type: 'instant', shots: 2, r: 10, dmg: 25, ammo: -1, demo: 1, d: 'Two shots. Straight line. Very rude.' },
    punch: { n: 'Jack Punch', type: 'instant', dmg: 30, ammo: 3, d: 'Jump and punch the jack next to you right into the sea.' },
    dynamite: { n: 'Dynamite', type: 'instant', fuse: 5, r: 46, dmg: 75, ammo: 1, demo: 1, d: 'Drop it, then RUN. Five seconds.' },
    airstrike: { n: 'Air Strike', type: 'target', r: 22, dmg: 30, ammo: 1, d: 'Pick a spot. Five missiles from the sky. Faces the way you face.' },
    girder: { n: 'Girder', type: 'target', ammo: 2, d: 'Build a steel bridge (aim tilts it). Ends your go.' },
    teleport: { n: 'Teleport', type: 'target', ammo: 2, d: 'Pick a spot and you\'re there. Ends your go.' },
    skip: { n: 'Skip Go', type: 'instant', ammo: -1, demo: 1, d: 'Do nothing. Have a biscuit.' },
  };
  const ORDER = ['bazooka', 'grenade', 'cluster', 'banana', 'holy', 'homing', 'shotgun', 'punch', 'dynamite', 'pet', 'airstrike', 'girder', 'teleport', 'skip'];
  const FUSED = { grenade: 1, cluster: 1, banana: 1 };
  const SAY = {
    hurt: ['Oi!', 'Ow!', 'Mom!', 'Not fair!', 'Me teeth!', 'Ooyah!', 'Rude!', 'I\'m telling!'],
    start: ['Right then!', 'Let\'s \'ave it!', 'Wot?', 'Come on then!', 'I\'m on it!', 'Charge!', 'Is it my go?'],
    n64: ['Should\'ve brought the N64!', 'Is this on Nintendo?', 'Blow on it!'],
    pc: ['Lag!', 'My mouse is rubbish!', '3D card or nothing!'],
    fire: ['Take that!', 'Incoming!', 'Eat this!', 'Fire!'],
    run: ['Run awaaay!', 'Fire in the \'ole!', 'Leg it!'],
  };
  const ICONS = {
    bazooka: '<rect x="2" y="9" width="17" height="6" fill="#7a8a6a" stroke="#000"/><path d="M19 8l4 4-4 4z" fill="#e02020" stroke="#000"/><rect x="7" y="15" width="3" height="5" fill="#553" stroke="#000"/>',
    grenade: '<circle cx="12" cy="14" r="7" fill="#3a8a2a" stroke="#000"/><rect x="10" y="4" width="5" height="4" fill="#888" stroke="#000"/><path d="M15 5c4-2 6 1 5 3" fill="none" stroke="#000"/>',
    cluster: '<circle cx="12" cy="13" r="8" fill="#d02020" stroke="#000"/><circle cx="9" cy="11" r="1.6" fill="#fff"/><circle cx="14" cy="15" r="1.6" fill="#fff"/><circle cx="15" cy="9" r="1.6" fill="#fff"/>',
    banana: '<path d="M4 6c2 10 10 15 17 12-6-1-11-5-13-12z" fill="#ffe030" stroke="#000"/><path d="M4 6l-1-2" stroke="#5a3a00" stroke-width="2"/>',
    holy: '<circle cx="12" cy="14" r="7" fill="#ffd040" stroke="#7a5000"/><ellipse cx="12" cy="4.5" rx="6" ry="2" fill="none" stroke="#fff6a0" stroke-width="1.6"/><path d="M12 9v10M8 13h8" stroke="#7a5000" stroke-width="1.6"/>',
    shotgun: '<path d="M2 14l5-3h15v3H9l-3 5H2z" fill="#7a4a1a" stroke="#000"/><rect x="9" y="9" width="13" height="2" fill="#555" stroke="#000"/>',
    punch: '<rect x="5" y="7" width="14" height="11" rx="3" fill="#f09040" stroke="#000"/><path d="M9 7v5M13 7v5M17 8v4" stroke="#000"/><rect x="7" y="17" width="8" height="5" fill="#2a6ad0" stroke="#000"/>',
    dynamite: '<rect x="4" y="8" width="5" height="13" fill="#d02020" stroke="#000"/><rect x="9" y="8" width="5" height="13" fill="#e03030" stroke="#000"/><rect x="14" y="8" width="5" height="13" fill="#d02020" stroke="#000"/><path d="M11 8c0-4 4-5 6-6" fill="none" stroke="#000"/><circle cx="18" cy="2.5" r="2" fill="#ffd000"/>',
    airstrike: '<path d="M2 12l8-2 3-7h2l-1 7 8 2-8 2 1 7h-2l-3-7z" fill="#9aa" stroke="#000"/>',
    girder: '<rect x="2" y="9" width="20" height="7" fill="#c06030" stroke="#000"/><circle cx="7" cy="12.5" r="1.8" fill="#000"/><circle cx="12" cy="12.5" r="1.8" fill="#000"/><circle cx="17" cy="12.5" r="1.8" fill="#000"/>',
    teleport: '<path d="M12 3a9 9 0 1 0 9 9 6 6 0 1 0-6 6 3 3 0 1 0-3-3" fill="none" stroke="#c060ff" stroke-width="2.4"/>',
    skip: '<text x="3" y="17" font-family="Arial Black,Arial" font-weight="bold" font-size="11" fill="#9cf">zZz</text>',
    homing: '<path d="M3 15l12-6 4 1-1 4-12 6z" fill="#ddd" stroke="#000"/><path d="M15 9l4 1-1 4z" fill="#e02020"/><path d="M3 15l-1 4 4-1z" fill="#ffa000" stroke="#000"/><circle cx="20" cy="5" r="3" fill="none" stroke="#e02020" stroke-width="1.4"/><path d="M20 1v8M16 5h8" stroke="#e02020"/>',
    pet: '<ellipse cx="12" cy="11" rx="7" ry="8" fill="#ff7ac0" stroke="#000"/><rect x="8" y="7" width="8" height="6" fill="#bfe0a0" stroke="#000"/><rect x="10" y="9" width="2" height="2" fill="#000"/><rect x="13" y="9" width="2" height="2" fill="#000"/><circle cx="9" cy="16" r="1" fill="#fff" stroke="#000" stroke-width=".5"/><circle cx="12" cy="17" r="1" fill="#fff" stroke="#000" stroke-width=".5"/><circle cx="15" cy="16" r="1" fill="#fff" stroke="#000" stroke-width=".5"/><path d="M8 19l-1 3M16 19l1 3" stroke="#000" stroke-width="1.6"/>',
  };
  const icon = (k, s) => `<svg viewBox="0 0 24 24" width="${s || 24}" height="${s || 24}">${ICONS[k]}</svg>`;
  let tuneAdded = false;

  const CSS = `
.dg-squigs-root{position:absolute;inset:0;display:flex;flex-direction:column;background:#000;font:12px/1.3 Tahoma,Arial,sans-serif;color:#fff}
.dg-squigs-view{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
.dg-squigs-bar{flex:none;background:linear-gradient(#5a5a68,#262632);border-top:2px solid #9a9aaa;display:flex;gap:4px;padding:4px;align-items:center}
.dg-squigs-bar.ph{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:44px;gap:4px}
.dg-squigs-b{font:bold 12px "Arial Black",Arial,sans-serif;color:#ffe000;background:linear-gradient(#70707e,#34343f);border:2px outset #a0a0b0;min-height:28px;padding:1px 8px;cursor:pointer;touch-action:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;overflow:hidden;text-shadow:1px 1px 0 #000}
.dg-squigs-b:active,.dg-squigs-b.on{border-style:inset;background:linear-gradient(#2a2a34,#5a5a68)}
.dg-squigs-b:disabled{color:#8a8a8a;text-shadow:none}
.dg-squigs-bar.ph .dg-squigs-b{font-size:15px;padding:0 2px}
.dg-squigs-bar.ph .fire{grid-column:span 2;background:linear-gradient(#e03a2a,#7a0a0a);color:#fff;border-color:#ff8a7a;font-size:17px}
.dg-squigs-bar.ph .wp{grid-column:span 2;font-size:11px}
.dg-squigs-bar .hint{color:#c8c8d8;font-size:11px;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dg-squigs-bar.off .dg-squigs-b:not(.always){opacity:.45;pointer-events:none}
.dg-squigs-ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;padding:10px;overflow:auto;gap:10px}
.dg-squigs-ov.dim{background:rgba(0,0,20,.72)}
.dg-squigs-logo{text-align:center;line-height:.9;transform:rotate(-3deg);filter:drop-shadow(4px 4px 0 rgba(0,0,0,.6))}
.dg-squigs-logo .a{display:block;font:normal 74px Impact,"Arial Black",sans-serif;letter-spacing:3px;color:#ff6a1a;-webkit-text-stroke:3px #000;background:linear-gradient(#ffe24a,#ff7a1a 55%,#c01a00);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.dg-squigs-logo .b{display:inline-block;font:normal 30px Impact,"Arial Black",sans-serif;letter-spacing:6px;color:#fff;background:#c00;border:3px solid #000;padding:0 10px;margin-top:2px;transform:rotate(2deg)}
.dg-squigs-logo .c{display:block;font:bold 12px Arial,sans-serif;color:#ffe000;margin-top:8px;letter-spacing:2px;text-shadow:2px 2px 0 #000}
.dg-squigs-menu{display:flex;flex-direction:column;gap:6px;min-width:220px}
.dg-squigs-menu .dg-squigs-b{font-size:16px;min-height:36px;box-shadow:3px 3px 0 rgba(0,0,0,.5)}
.dg-squigs-foot{font:11px Arial,sans-serif;color:#ddd;text-shadow:1px 1px 0 #000;text-align:center}
.dg-squigs-panel{background:linear-gradient(#3e3e4e,#1c1c26);border:3px outset #8a8a9a;color:#fff;padding:12px;max-width:540px;width:100%;box-shadow:6px 6px 0 rgba(0,0,0,.5)}
.dg-squigs-panel h3{margin:0 0 8px;font:normal 24px Impact,"Arial Black",sans-serif;color:#ffe000;letter-spacing:1px;text-shadow:2px 2px 0 #000}
.dg-squigs-panel p{margin:0 0 6px}
.dg-squigs-panel .txt{max-height:300px;overflow:auto;font:12px/1.4 Arial,sans-serif;color:#e8e8f0;white-space:pre-wrap}
.dg-squigs-row{display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap}
.dg-squigs-row input[type=text]{flex:1;min-width:90px;font:bold 12px Arial,sans-serif;background:#000;color:#fff;border:2px inset #888;padding:3px}
.dg-squigs-row select{font:12px Arial,sans-serif}
.dg-squigs-sw{width:16px;height:16px;border:2px solid #000;flex:none}
.dg-squigs-btns{display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap}
.dg-squigs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.dg-squigs-wi{display:flex;flex-direction:column;align-items:center;gap:1px;background:linear-gradient(#55556a,#2a2a38);border:2px outset #8a8a9a;color:#fff;font:bold 10px Arial,sans-serif;padding:4px 2px;cursor:pointer;min-height:58px;text-align:center}
.dg-squigs-wi.sel{border-style:inset;background:linear-gradient(#2a3a6a,#14204a)}
.dg-squigs-wi:disabled{opacity:.35;cursor:default}
.dg-squigs-wi small{color:#ffe000;font-size:10px}
.dg-squigs-win{font:normal 44px Impact,"Arial Black",sans-serif;color:#ffe000;-webkit-text-stroke:2px #000;text-align:center;line-height:1;text-shadow:4px 4px 0 #000}
.dg-squigs-tab{width:100%;border-collapse:collapse;font:12px Arial,sans-serif}
.dg-squigs-tab td,.dg-squigs-tab th{padding:2px 6px;border-bottom:1px solid #444;text-align:left}
.dg-squigs-slot{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left}
.dg-squigs-tmenu{display:flex;flex-direction:column;gap:7px;align-items:center;width:100%;max-width:470px}
.dg-squigs-big{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.dg-squigs-b.big{font-size:19px;min-height:44px;box-shadow:3px 3px 0 rgba(0,0,0,.5)}
.dg-squigs-b.online{background:linear-gradient(#3ac04a,#0a6a1a);border-color:#8aff9a;color:#fff;animation:dgsqPulse 1.6s ease-in-out infinite}
.dg-squigs-b.online:active{background:linear-gradient(#0a6a1a,#3ac04a)}
@keyframes dgsqPulse{50%{box-shadow:0 0 0 3px rgba(120,255,140,.4),3px 3px 0 rgba(0,0,0,.5)}}
.dg-squigs-live{font:bold 11px Arial,sans-serif;color:#bfffc8;text-shadow:1px 1px 0 #000;text-align:center;min-height:14px}
.dg-squigs-small{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%}
.dg-squigs-small .dg-squigs-b{font-size:13px;min-height:32px;position:relative;overflow:visible;box-shadow:2px 2px 0 rgba(0,0,0,.5)}
.dg-squigs-b.new{border-color:#ffe060;color:#fff;background:linear-gradient(#b08018,#5a3a00)}
.dg-squigs-stk{position:absolute;top:-10px;right:-6px;background:#ffe000;color:#c00;font:bold 9px Arial,sans-serif;padding:1px 4px;border:1px solid #000;transform:rotate(6deg);font-style:normal;text-shadow:none;pointer-events:none}
.dg-squigs-b.go{background:linear-gradient(#e03a2a,#7a0a0a);color:#fff;border-color:#ff8a7a}
.dg-squigs-sarge{position:absolute;left:6px;right:6px;top:6px;z-index:2;display:flex;gap:8px;align-items:flex-start;background:linear-gradient(#34422a,#1a2412);border:3px outset #8a9a6a;padding:6px;box-shadow:4px 4px 0 rgba(0,0,0,.5);pointer-events:none;max-width:580px;margin:0 auto}
.dg-squigs-sarge .pic{flex:none;border:2px inset #8a9a6a;line-height:0}
.dg-squigs-sarge .bd{flex:1;min-width:0}
.dg-squigs-sarge .hd{display:flex;justify-content:space-between;align-items:center;gap:6px;font:bold 11px Arial,sans-serif;color:#ffe000;letter-spacing:1px}
.dg-squigs-sarge .pips{display:flex;gap:3px}
.dg-squigs-sarge .pips i{width:8px;height:8px;border:1px solid #000;background:#3a3a3a}
.dg-squigs-sarge .pips i.ok{background:#3ac04a}.dg-squigs-sarge .pips i.now{background:#ffe000}
.dg-squigs-sarge .tx{font:bold 12px/1.35 "Courier New",monospace;color:#fff;min-height:49px;margin:3px 0}
.dg-squigs-sarge .bt{display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto}
.dg-squigs-sarge .bt .dg-squigs-b{min-height:28px;font-size:12px}
.dg-squigs-sgt{display:flex;gap:10px;align-items:flex-start}
.dg-squigs-sgt svg{flex:none;border:2px inset #8a9a6a}
.dg-squigs-aw{display:grid;gap:2px;margin-top:8px;font:12px Arial,sans-serif}
.dg-squigs-aw div{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px dotted #555;padding:1px 0}
.dg-squigs-aw span{color:#ccc}.dg-squigs-aw b{color:#ffe000;text-align:right}
.dg-squigs-panel .txt.mono{font:12px/1.35 "Courier New",monospace}
.dg-squigs-bar.mk{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.dg-squigs-bar.mk .dg-squigs-b{font-size:12px;min-height:32px;padding:0 3px}
.dg-squigs-visit{flex:none;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:linear-gradient(90deg,#7a0a0a,#3a0a0a);color:#fff;padding:3px 6px;font:12px Tahoma,Arial,sans-serif}
.dg-squigs-visit .dsc-sb{color:#888}.dg-squigs-visit .dsc-sb.on{color:#ffb000}
.dg-squigs-visit .dg-squigs-b{min-height:24px;margin-left:auto}
.dg-squigs-lob{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;padding:4px;border:1px dashed #6a6a7a}
.dg-squigs-lob .dg-squigs-b{min-height:24px;font-size:11px}
.dg-squigs-drop{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);z-index:2;background:rgba(0,0,0,.85);border:3px outset #ffb000;color:#fff;padding:10px 14px;text-align:center;font:bold 13px Arial,sans-serif;pointer-events:none;min-width:240px;max-width:90%}
.dg-squigs-drop b{display:block;font:normal 20px Impact,"Arial Black",sans-serif;color:#ffb000;letter-spacing:1px}
.dg-squigs-drop .n{font:normal 34px Impact,"Arial Black",sans-serif;color:#ffe000;line-height:1.1}
.dg-squigs-drop small{display:block;color:#ccc;font:11px Arial,sans-serif;margin-top:2px}
@media (max-width:560px){.dg-squigs-logo .a{font-size:54px}.dg-squigs-logo .b{font-size:22px}.dg-squigs-win{font-size:32px}.dg-squigs-small{grid-template-columns:1fr 1fr 1fr}.dg-squigs-b.big{font-size:16px}.dg-squigs-sarge .tx{font-size:11px}.dg-squigs-bar.mk{grid-template-columns:repeat(5,1fr)}.dg-squigs-bar.mk .dg-squigs-b{font-size:11px}}
`;

  D.mod('squigs', (G) => {
    // G._restart (the demo nag's "play again") re-runs this function; kill the previous run first
    if (G._sqKill) G._sqKill();
    const offs = [];
    let alive = true;
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
    G._sqKill = () => { alive = false; offs.splice(0).forEach(f => { try { f(); } catch (e) {} }); };
    G.onClose(() => G._sqKill && G._sqKill());
    G.css('dg-css-squigs', CSS);
    const host = G.host;
    host.innerHTML = '';
    const el = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const root = el('', 'dg-squigs-root'); host.appendChild(root);
    const viewEl = el('', 'dg-squigs-view'); root.appendChild(viewEl);
    const bar = el('', 'dg-squigs-bar' + (G.phone ? ' ph' : '')); root.appendChild(bar);
    // phones get a tall view that fills the window (the bar underneath is two rows of big buttons)
    const VW = G.phone ? 320 : 640, VH = G.phone ? (() => { const r = host.getBoundingClientRect(), h = r.height - 108; return r.width > 100 && h > 100 ? clamp(Math.round(VW * h / r.width), 400, 640) : 480; })() : 400;
    const C = G.canvas(VW, VH, { parent: viewEl, fractional: G.phone });
    const ctx = C.ctx;
    const ovl = el('', 'dg-squigs-ov'); viewEl.appendChild(ovl); ovl.style.display = 'none';

    // online (mp.js): NET is the session state while a war is on over JackNet (see "online" below). R is the dice for
    // anything that changes the war itself: online it's seeded by the host every go, so every screen rolls the same.
    let NET = null, R = Math.random;
    const myId = () => (window.Net && Net.me ? Net.me.id : 0);
    const later = (ms, fn) => { if (NET && M && !M.attract) (M.later = M.later || []).push({ n: Math.max(1, Math.round(ms / 1000 * 60)), fn }); else G.timer(fn, ms); };
    // options and sound
    const OPT = Object.assign({ turn: 45, bubbles: true }, G.load('opt', {}));
    let mute = false;
    const sfx = n => { if (!mute) G.sfx(n); };
    const note = (f, d, t) => { if (!mute) G.note(f, d, t); };
    if (!tuneAdded && window.Sound && Sound.addTune) {
      tuneAdded = true;
      Sound.addTune('squigs', { step: 0.13, hats: true,
        lead: [67, 0, 67, 70, 72, 0, 70, 67, 65, 0, 65, 67, 63, -1, 60, 0, 67, 0, 67, 70, 72, 0, 75, 72, 74, -1, 72, 70, 72, -1, 0, 0,
          79, 0, 79, 77, 75, 0, 74, 72, 70, 0, 72, 74, 75, -1, 72, 0, 67, 0, 70, 72, 74, 72, 70, 67, 65, 67, 63, 62, 60, -1, 0, 0],
        bass: [36, 36, 43, 43, 41, 41, 43, 43, 36, 36, 43, 43, 44, 43, 41, 43, 39, 39, 46, 46, 41, 41, 43, 43, 36, 43, 44, 41, 43, 43, 36, 36] });
    }

    // ================================================================ terrain
    let TC = null, tctx = null, MASK = null, BG = null, theme = 'jungle', seedNow = 1;
    const solid = (x, y) => { x |= 0; y |= 0; if (x < 0 || x >= W || y < 0 || y >= H) return 0; return MASK[y * W + x]; };
    function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
    function texel(th, x, y, depth, s) {
      const n = hash(x, y, s) & 31, n2 = n - 16;
      if (th === 'jungle') {
        if (depth <= 3) return (hash(x >> 1, 0, s) & 1) ? [70 + n2, 176, 44] : [48, 142 + n2, 30];
        if (depth <= 6) return [58, 104 + (n2 >> 1), 30];
        const ch = hash(x >> 3, y >> 3, s + 7);
        if ((ch & 15) === 0) { const cx = (x & 7) - 3.5, cy = (y & 7) - 3.5; if (cx * cx + cy * cy < 11) return [128 + n2, 122 + n2, 112 + n2]; }
        if (((y + Math.round(Math.sin(x * 0.05 + s) * 6)) % 37 + 37) % 37 < 2) return [66, 40, 20];
        return [98 + n2, 62 + (n2 >> 1), 34];
      }
      if (th === 'scrap') {
        if (depth <= 4) return ((x + y) >> 3) & 1 ? [236, 190, 30] : [34, 30, 30];
        if (depth <= 6) return [60, 40, 30];
        const px = x >> 5, yy = y + px * 11, py = yy >> 4;
        if ((x & 31) === 0 || (yy & 15) === 0) return [52, 32, 22];
        if ((x & 31) === 3 && (yy & 15) === 3) return [210, 180, 130];
        const tone = [[124, 72, 40], [104, 62, 42], [136, 92, 60], [92, 92, 98], [150, 80, 36]][hash(px, py, s) % 5];
        return [tone[0] + (n2 >> 1), tone[1] + (n2 >> 1), tone[2] + (n2 >> 1)];
      }
      if (th === 'pc') { // a motherboard: green board, gold tracks, black chips with silver legs
        if (depth <= 2) return [96 + (n2 >> 1), 236, 104];
        if (depth <= 5) return [14, 64, 30];
        const cx = x >> 5, cy = y >> 4, h = hash(cx, cy, s), lx = x & 31, ly = y & 15;
        if ((h & 7) === 0 && lx > 3 && lx < 28 && ly > 2 && ly < 14) {
          if (ly === 3 || ly === 13) return (x & 1) ? [200, 200, 210] : [30, 90, 44];
          return lx === 6 && ly === 6 ? [120, 120, 130] : [22 + (n2 >> 3), 22, 28];
        }
        if ((ly === 8 && (h & 2)) || (lx === 16 && (h & 4))) return [216, 178, 72];
        if ((x & 7) === 3 && (y & 7) === 3 && (hash(x >> 3, y >> 3, s) & 3) === 0) return [236, 206, 96];
        return [24 + (n2 >> 2), 108 + (n2 >> 1), 50];
      }
      // kitchen: cake!
      if (depth <= 4) { if (hash(x, y, s + 3) % 29 === 0) return [[255, 60, 80], [60, 160, 255], [255, 220, 40], [80, 220, 80]][hash(x, y, 9) & 3]; return depth <= 1 ? [255, 255, 255] : [255, 236, 244]; }
      const L = ((y + 7) % 46 + 46) % 46;
      if (L < 6) return [178 + (n2 >> 1), 28, 50];
      if (L < 10) return [250, 240, 222];
      if ((hash(x >> 1, y >> 1, s) & 15) === 0) return [204, 158, 94];
      return [232 + (n2 >> 2), 190 + (n2 >> 1), 120 + (n2 >> 1)];
    }
    function stamp(c, th, x, y, r) {
      c.save(); c.translate(x, y);
      if (th === 'scrap') {
        if (r() < 0.5) { // oil drum
          c.fillStyle = '#2a5aa0'; c.fillRect(-9, -24, 18, 26); c.fillStyle = '#1a3a70'; c.fillRect(-9, -17, 18, 3); c.fillRect(-9, -8, 18, 3); c.fillStyle = '#4a8ad0'; c.fillRect(-6, -24, 3, 26);
        } else { // tyre
          c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(0, -10, 13, 0, TAU); c.fill(); c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(0, -10, 9, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, -10, 5, 0, TAU); c.fill();
        }
      } else if (th === 'kitchen') {
        if (r() < 0.5) { // sugar cube
          c.fillStyle = '#fff'; c.fillRect(-9, -17, 18, 18); c.fillStyle = '#e8e8f0'; c.fillRect(-9, -17, 18, 4); c.fillStyle = '#d8d8e0'; c.fillRect(5, -13, 4, 14);
        } else { // teacup
          c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-14, -20); c.lineTo(14, -20); c.lineTo(10, 1); c.lineTo(-10, 1); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(15, -11, 6, -1.4, 1.4); c.stroke();
          c.fillStyle = '#2a6ad0'; c.fillRect(-12, -14, 24, 3); c.fillStyle = '#7a4a1a'; c.fillRect(-13, -20, 26, 3);
        }
      } else if (th === 'pc') {
        if (r() < 0.55) { // a capacitor
          c.fillStyle = '#1a2a6a'; c.fillRect(-7, -22, 14, 23); c.fillStyle = '#3a5ac0'; c.fillRect(-5, -22, 3, 23); c.fillStyle = '#c0c0d0'; c.fillRect(-7, -24, 14, 3); c.fillStyle = '#e8e8f0'; c.fillRect(-7, -16, 14, 2);
        } else { // a chip on legs
          c.fillStyle = '#c0c0c8'; for (let i = -10; i <= 8; i += 4) c.fillRect(i, -4, 2, 5); c.fillStyle = '#1a1a20'; c.fillRect(-12, -12, 24, 9); c.fillStyle = '#e0e0e0'; c.fillRect(-9, -10, 2, 2); c.font = 'bold 5px Arial'; c.fillText('J486', -4, -6);
        }
      } else { // jungle rock / mushroom
        if (r() < 0.6) { c.fillStyle = '#8a8a80'; c.beginPath(); c.ellipse(0, -6, 15, 11, 0, 0, TAU); c.fill(); c.fillStyle = '#a8a89e'; c.beginPath(); c.ellipse(-4, -10, 7, 4, 0, 0, TAU); c.fill(); }
        else { c.fillStyle = '#e8dcc0'; c.fillRect(-3, -14, 6, 15); c.fillStyle = '#d0281a'; c.beginPath(); c.ellipse(0, -14, 13, 8, 0, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.fillRect(-6, -19, 3, 3); c.fillRect(3, -18, 3, 3); }
      }
      c.restore();
    }
    // lay: undefined (a random island from the seed), 'training' (Sergeant Bellows' assault course) or 'flat' (just sea)
    function genTerrain(seed, th, lay) {
      const r = rng(seed);
      TC = document.createElement('canvas'); TC.width = W; TC.height = H;
      tctx = TC.getContext('2d', { willReadFrequently: true });
      const S = new Uint8Array(W * H);
      if (lay === 'training') {
        const fill = (x0, x1, top) => { for (let x = x0; x < x1; x++) { const ty = Math.round(top(x)); if (ty < WATER0 - 6) for (let y = ty; y < H; y++) S[y * W + x] = 1; } };
        fill(40, 1240, x => 440 + (x < 110 ? (110 - x) * (110 - x) / 40 : 0) + (x > 1170 ? (x - 1170) * (x - 1170) / 40 : 0) + 3 * Math.sin(x * 0.03));
        fill(360, 470, () => 410); fill(760, 780, () => 356);
      } else if (lay !== 'flat') genIslands(S, r);
      texturise(S, th, seed, r, lay !== 'training');
      buildBG(th, seed);
    }
    function genIslands(S, r) {
      const nIs = 1 + (r() < 0.65 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
      const margin = 34, gap = 70 + r() * 50, each = (W - margin * 2 - gap * (nIs - 1)) / nIs;
      const p1 = r() * 9, p2 = r() * 9, p3 = r() * 9, base = 300 + r() * 50;
      const top = x => base + 62 * Math.sin(x * 0.0055 + p1) + 34 * Math.sin(x * 0.017 + p2) + 14 * Math.sin(x * 0.047 + p3);
      for (let i = 0; i < nIs; i++) {
        const a = Math.round(margin + i * (each + gap) + (r() - 0.5) * 20), b = Math.round(a + each + (r() - 0.5) * 30);
        for (let x = Math.max(0, a); x < Math.min(W, b); x++) {
          const t = Math.min(x - a, b - x), edge = t < 70 ? (70 - t) * (70 - t) / 34 : 0, ty = Math.round(top(x) + edge);
          if (ty < WATER0 - 6) for (let y = ty; y < H; y++) S[y * W + x] = 1;
        }
      }
      const ell = (cx, cy, rx, ry, v) => { for (let y = Math.max(0, cy - ry | 0); y <= Math.min(H - 1, cy + ry); y++) { const dy = (y - cy) / ry, w2 = rx * Math.sqrt(Math.max(0, 1 - dy * dy)); for (let x = Math.max(0, cx - w2 | 0); x <= Math.min(W - 1, cx + w2); x++) S[y * W + x] = v; } };
      const nf = 1 + (r() * 2 | 0);
      for (let i = 0; i < nf; i++) ell(120 + r() * (W - 240), 150 + r() * 80, 40 + r() * 40, 9 + r() * 8, 1);
      const nc = 4 + (r() * 4 | 0);
      for (let i = 0; i < nc; i++) { const cx = 60 + r() * (W - 120); const ty = top(cx); ell(cx, ty + 40 + r() * 120, 18 + r() * 30, 10 + r() * 14, 0); }
    }
    function texturise(S, th, seed, r, stamps) {
      // texture pass
      const img = tctx.createImageData(W, H), d = img.data;
      for (let x = 0; x < W; x++) {
        let depth = 0;
        for (let y = 0; y < H; y++) {
          const i = y * W + x;
          if (!S[i]) { depth = 0; continue; }
          depth++;
          const c = texel(th, x, y, depth, seed & 255), j = i * 4;
          d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
        }
      }
      tctx.putImageData(img, 0, 0);
      // stamps sitting on the surface
      for (let k = 0; k < (stamps ? 9 : 0); k++) {
        const x = 40 + r() * (W - 80) | 0; let y = 0; while (y < H && !S[y * W + x]) y++;
        if (y < WATER0 - 30 && y > 60) stamp(tctx, th, x, y + 3, r);
      }
      const all = tctx.getImageData(0, 0, W, H).data;
      MASK = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) MASK[i] = all[i * 4 + 3] > 120 ? 1 : 0;
      // decoration (not solid): grass tufts, sprinkles of rust
      for (let k = 0; k < 160; k++) {
        const x = r() * W | 0; let y = 0; while (y < H && !MASK[y * W + x]) y++;
        if (y >= WATER0 - 4) continue;
        if (th === 'jungle') { tctx.fillStyle = r() < 0.5 ? '#4ab82a' : '#2a8a1a'; tctx.fillRect(x, y - 3, 1, 3); tctx.fillRect(x + 2, y - 2, 1, 2); }
        else if (th === 'scrap') { tctx.fillStyle = '#5a5a60'; tctx.fillRect(x, y - 2, 3, 2); }
        else if (th === 'pc') { tctx.fillStyle = k % 4 ? '#c8c8d0' : ['#ff3030', '#30ff60', '#ffd030'][k % 3]; tctx.fillRect(x, y - 2, 2, 2); }
        else { tctx.fillStyle = ['#ff4060', '#40a0ff', '#ffe040'][k % 3]; tctx.fillRect(x, y - 1, 2, 1); }
      }
    }
    // paint new land (the Island Maker's brush): solid, then re-texture the columns it touched
    function addLand(x, y, rad) {
      x = Math.round(x); y = Math.round(y); rad = clamp(Math.round(rad), 2, 60);
      const x0 = Math.max(0, x - rad - 1), x1 = Math.min(W - 1, x + rad + 1), y0 = Math.max(0, y - rad - 1), y1 = Math.min(H - 1, y + rad + 8);
      for (let yy = Math.max(0, y - rad); yy <= Math.min(H - 1, y + rad); yy++) { const dy = yy - y, w2 = Math.sqrt(Math.max(0, rad * rad - dy * dy)); for (let xx = Math.max(0, Math.ceil(x - w2)); xx <= Math.min(W - 1, Math.floor(x + w2)); xx++) MASK[yy * W + xx] = 1; }
      const img = tctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1), d = img.data, iw = x1 - x0 + 1;
      for (let xx = x0; xx <= x1; xx++) {
        let depth = 0;
        for (let yy = 0; yy <= y1; yy++) {
          if (!MASK[yy * W + xx]) { depth = 0; continue; }
          depth++;
          if (yy < y0) continue;
          const j = ((yy - y0) * iw + (xx - x0)) * 4;
          if (d[j + 3] > 120 && yy < y - rad - 1) continue;
          const c = texel(theme, xx, yy, depth, seedNow & 255); d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
        }
      }
      tctx.putImageData(img, x0, y0);
    }
    function carve(x, y, r, scorch) {
      tctx.save(); tctx.globalCompositeOperation = 'destination-out'; tctx.beginPath(); tctx.arc(x, y, r, 0, TAU); tctx.fill();
      if (scorch) { tctx.globalCompositeOperation = 'source-atop'; tctx.strokeStyle = 'rgba(28,14,4,.6)'; tctx.lineWidth = 5; tctx.beginPath(); tctx.arc(x, y, r + 2, 0, TAU); tctx.stroke(); }
      tctx.restore();
      for (let yy = Math.max(0, Math.floor(y - r)); yy <= Math.min(H - 1, Math.ceil(y + r)); yy++) {
        const dy = yy - y, w2 = Math.sqrt(Math.max(0, r * r - dy * dy));
        for (let xx = Math.max(0, Math.floor(x - w2)); xx <= Math.min(W - 1, Math.ceil(x + w2)); xx++) MASK[yy * W + xx] = 0;
      }
    }
    function addGirder(x, y, a) {
      const L = 60, T = 7;
      tctx.save(); tctx.translate(x, y); tctx.rotate(a);
      tctx.fillStyle = '#b85a2a'; tctx.fillRect(-L / 2, -T / 2, L, T); tctx.fillStyle = '#e08040'; tctx.fillRect(-L / 2, -T / 2, L, 2);
      tctx.fillStyle = '#3a1a0a'; for (let i = -L / 2 + 6; i < L / 2; i += 10) { tctx.beginPath(); tctx.arc(i, 0.5, 1.6, 0, TAU); tctx.fill(); }
      tctx.restore();
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let yy = Math.floor(y - 34); yy <= y + 34; yy++) for (let xx = Math.floor(x - 34); xx <= x + 34; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        const dx = xx - x, dy = yy - y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
        if (Math.abs(u) <= L / 2 && Math.abs(v) <= T / 2) MASK[yy * W + xx] = 1;
      }
    }
    // a home-made island (the Island Maker): ops [x, y, size, kind] kind 2 = land, 1 = girder (size = angle x 1000), 0 = dig
    function applyIsland(isl) {
      for (const o of Array.isArray(isl.ops) ? isl.ops : []) {
        if (!Array.isArray(o) || o.length < 4) continue;
        const x = +o[0] || 0, y = +o[1] || 0, v = +o[2] || 0, k = o[3] | 0;
        if (k === 2) addLand(x, y, v); else if (k === 1) addGirder(x, y, clamp(v / 1000, -0.8, 0.8)); else carve(x, y, clamp(v, 1, 60), false);
      }
    }
    // the background (parallax): drawn once per match
    function buildBG(th, seed) {
      const r = rng(seed + 99), bw = VW + Math.ceil((W - VW) * PAR) + 4;
      BG = document.createElement('canvas'); BG.width = bw; BG.height = VH;
      const c = BG.getContext('2d');
      if (th === 'jungle') {
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#3a9ae8'); g.addColorStop(0.7, '#a8e0ff'); g.addColorStop(1, '#e8fbff'); c.fillStyle = g; c.fillRect(0, 0, bw, VH);
        c.fillStyle = '#fff8c0'; c.beginPath(); c.arc(bw * 0.7, VH * 0.18, 26, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 7; i++) { const x = r() * bw, y = 20 + r() * VH * 0.3; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x + j * 14, y + (j & 1) * 4, 18, 9, 0, 0, TAU); c.fill(); } }
        for (const [col, base, amp] of [['#7aa8c8', VH * 0.62, 50], ['#4a8a7a', VH * 0.74, 34]]) {
          c.fillStyle = col; c.beginPath(); c.moveTo(0, VH); for (let x = 0; x <= bw; x += 16) c.lineTo(x, base - amp * Math.abs(Math.sin(x * 0.011 + r() * 0.3 + base))); c.lineTo(bw, VH); c.fill();
        }
        c.strokeStyle = '#1a4a2a'; c.fillStyle = '#1a5a2a';
        for (let i = 0; i < 9; i++) { const x = r() * bw, y = VH * 0.8 + r() * 20, h = 50 + r() * 40; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - h / 2, x + 4, y - h); c.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.beginPath(); c.ellipse(x + 4 + Math.cos(a) * 12, y - h + Math.sin(a) * 5, 14, 4, a, 0, TAU); c.fill(); } }
      } else if (th === 'scrap') {
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#2a1440'); g.addColorStop(0.55, '#c0402a'); g.addColorStop(1, '#ffb040'); c.fillStyle = g; c.fillRect(0, 0, bw, VH);
        c.fillStyle = '#ffd060'; c.beginPath(); c.arc(bw * 0.45, VH * 0.72, 46, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 30; i++) c.fillRect(r() * bw, r() * VH * 0.35, 1, 1);
        c.fillStyle = '#3a1a2a';
        for (let i = 0; i < 12; i++) { const x = r() * bw, w = 60 + r() * 90, h = 30 + r() * 60, y = VH * 0.86; c.beginPath(); c.moveTo(x - w / 2, y); for (let k = 0; k <= 8; k++) c.lineTo(x - w / 2 + k * w / 8, y - h * Math.sin(k / 8 * Math.PI) - (r() * 12)); c.lineTo(x + w / 2, y); c.fill(); }
        c.strokeStyle = '#2a1020'; c.lineWidth = 3; const cx = bw * 0.2; c.beginPath(); c.moveTo(cx, VH * 0.86); c.lineTo(cx, VH * 0.3); c.lineTo(cx + 110, VH * 0.34); c.moveTo(cx, VH * 0.36); c.lineTo(cx + 90, VH * 0.4); c.moveTo(cx + 100, VH * 0.34); c.lineTo(cx + 100, VH * 0.5); c.stroke();
        c.fillStyle = '#2a1020'; c.fillRect(cx + 92, VH * 0.5, 16, 10);
        const tx = bw * 0.78; c.beginPath(); c.moveTo(tx - 30, VH * 0.86); c.lineTo(tx - 14, VH * 0.25); c.lineTo(tx + 14, VH * 0.25); c.lineTo(tx + 30, VH * 0.86); c.fill(); c.fillRect(tx - 2, VH * 0.12, 4, 40); c.fillStyle = '#ff3a1a'; c.fillRect(tx - 3, VH * 0.11, 6, 5);
        c.fillStyle = 'rgba(80,60,70,.5)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(tx + 10 + i * 12, VH * 0.1 - i * 8, 6 + i * 2, 0, TAU); c.fill(); }
      } else if (th === 'pc') {
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#05060c'); g.addColorStop(0.6, '#0c1a24'); g.addColorStop(1, '#14302a'); c.fillStyle = g; c.fillRect(0, 0, bw, VH);
        // the case fan, ribbon cables, RAM sticks and the odd LED
        const fx = bw * 0.68, fy = VH * 0.3; c.fillStyle = '#1a1e26'; c.fillRect(fx - 56, fy - 56, 112, 112); c.fillStyle = '#0a0c10'; c.beginPath(); c.arc(fx, fy, 50, 0, TAU); c.fill();
        c.fillStyle = '#2a303c'; for (let i = 0; i < 7; i++) { c.save(); c.translate(fx, fy); c.rotate(i / 7 * TAU); c.beginPath(); c.ellipse(26, 0, 22, 8, 0.5, 0, TAU); c.fill(); c.restore(); } c.fillStyle = '#3a4250'; c.beginPath(); c.arc(fx, fy, 12, 0, TAU); c.fill();
        for (let i = 0; i < 4; i++) { c.fillStyle = '#5a5a5a'; c.beginPath(); c.arc(fx - 46 + (i & 1) * 92, fy - 46 + (i >> 1) * 92, 4, 0, TAU); c.fill(); }
        const rx = bw * 0.1; for (let i = 0; i < 4; i++) { c.fillStyle = '#0e4a2a'; c.fillRect(rx + i * 16, VH * 0.18, 10, VH * 0.5); c.fillStyle = '#1a1a1a'; for (let k = 0; k < 6; k++) c.fillRect(rx + i * 16 + 1, VH * 0.21 + k * 22, 8, 14); c.fillStyle = '#c8a040'; c.fillRect(rx + i * 16, VH * 0.68 - 4, 10, 4); }
        c.fillStyle = '#9a9aa0'; for (let i = 0; i < 18; i++) c.fillRect(bw * 0.3 + i * 4, 0, 3, VH * 0.42 + Math.sin(i * 0.4) * 10); c.fillStyle = '#c03030'; c.fillRect(bw * 0.3, 0, 3, VH * 0.42);
        for (let i = 0; i < 26; i++) { c.fillStyle = ['#ff3a3a', '#3aff6a', '#ffcc3a', '#3ac8ff'][i & 3]; c.globalAlpha = 0.35 + r() * 0.5; c.fillRect(r() * bw, r() * VH * 0.8, 2, 2); } c.globalAlpha = 1;
        c.fillStyle = '#0a1a14'; c.fillRect(0, VH * 0.82, bw, VH * 0.18); c.fillStyle = '#1a3a2a'; for (let x = 0; x < bw; x += 22) c.fillRect(x, VH * 0.82, 12, 3);
      } else {
        c.fillStyle = '#d4e8f4'; c.fillRect(0, 0, bw, VH);
        c.strokeStyle = '#a8c4d8'; c.lineWidth = 1; for (let x = 0; x < bw; x += 22) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, VH); c.stroke(); } for (let y = 0; y < VH; y += 22) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(bw, y + 0.5); c.stroke(); }
        const wx = bw * 0.3; c.fillStyle = '#fff'; c.fillRect(wx - 6, 30, 132, 112); c.fillStyle = '#7ac8ff'; c.fillRect(wx, 36, 120, 100); c.fillStyle = '#fff'; c.fillRect(wx + 58, 36, 4, 100); c.fillRect(wx, 84, 120, 4);
        c.fillStyle = '#4ab84a'; c.fillRect(wx, 116, 120, 20); c.fillStyle = '#e05080'; c.fillRect(wx - 16, 26, 22, 120); c.fillRect(wx + 114, 26, 22, 120);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(bw * 0.62, 60, 22, 0, TAU); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(bw * 0.62, 60); c.lineTo(bw * 0.62, 46); c.moveTo(bw * 0.62, 60); c.lineTo(bw * 0.62 + 10, 60); c.stroke();
        c.fillStyle = '#9a7a5a'; c.fillRect(0, VH * 0.78, bw, VH * 0.22); c.fillStyle = '#7a5a3a'; c.fillRect(0, VH * 0.78, bw, 5);
        const kx = bw * 0.82; c.fillStyle = '#8aa0b0'; c.beginPath(); c.moveTo(kx - 40, VH * 0.78); c.lineTo(kx - 34, VH * 0.5); c.quadraticCurveTo(kx, VH * 0.42, kx + 34, VH * 0.5); c.lineTo(kx + 40, VH * 0.78); c.fill();
        c.fillRect(kx - 8, VH * 0.42, 16, 6); c.strokeStyle = '#6a8090'; c.lineWidth = 6; c.beginPath(); c.arc(kx + 44, VH * 0.6, 14, -1.6, 1.6); c.stroke(); c.beginPath(); c.moveTo(kx - 36, VH * 0.6); c.lineTo(kx - 60, VH * 0.52); c.stroke();
        c.fillStyle = '#c03a2a'; c.fillRect(bw * 0.1, VH * 0.62, 40, 48); c.fillStyle = '#fff'; c.font = 'bold 10px Arial'; c.fillText('TEA', bw * 0.1 + 9, VH * 0.62 + 28);
      }
    }

    // ================================================================ the match
    let M = null, scene = 'title';
    const cam = { x: 0, y: 0, manual: 0, shake: 0 };
    let FX = [], POPS = [], EX = [];
    const WP = []; // wind-blown bits (just for looking at)
    const turnTeam = () => M.teams[M.cur];
    const liveSquigs = t => t.squigs.filter(s => !s.dead && s.hp > 0);

    function newMatch(cfg) {
      FX = []; POPS = []; EX = [];
      const seed = cfg.seed || (Math.random() * 1e9 | 0);
      const isl = cfg.island && typeof cfg.island === 'object' ? cfg.island : null;
      theme = isl && THEMES[isl.theme] ? isl.theme : cfg.training ? 'jungle' : cfg.theme === 'random' || !cfg.theme ? pick(Object.keys(THEMES)) : cfg.theme;
      seedNow = isl ? isl.seed >>> 0 : seed;
      genTerrain(seedNow, theme, cfg.training ? 'training' : isl && isl.base === 'flat' ? 'flat' : undefined);
      if (isl) applyIsland(isl);
      M = { cfg, seed: seedNow, theme, attract: !!cfg.attract, demo: !!cfg.demo, training: !!cfg.training, island: isl, turn: 0, cur: -1, wind: 0, waterY: WATER0, sudden: false,
        carves: [], girders: [], crates: [], graves: [], P: [], phase: 'start', timer: 0, retreat: 0, power: 0, charging: false, best: { hit: 0, who: '', team: -1 },
        weapon: 'bazooka', fuse: 3, shots: 0, target: null, banner: null, sq: null, hurtSelf: false, endWait: 0, ai: null, over: false, turnTime: cfg.turnTime || OPT.turn };
      M.teams = cfg.teams.map((t, ti) => ({ name: t.name, cpu: !!t.cpu, lvl: AIL[t.lvl] ? t.lvl : AIL[cfg.lvl] ? cfg.lvl : 'normal', dummy: !!t.dummy, col: t.col != null ? t.col : ti, next: 0, last: 'bazooka',
        ammo: Object.fromEntries(ORDER.map(k => [k, M.demo && !WPN[k].demo ? 0 : WPN[k].ammo])), stats: { dmg: 0, kills: 0, self: 0, drown: 0 },
        squigs: t.squigs.slice(0, t.dummy ? 4 : cfg.per || 4).map(n => ({ name: n, team: ti, x: 0, y: 0, vx: 0, vy: 0, hp: 100, dead: false, air: true, face: 1, aim: 0.35, walk: 0, bubble: null, step: 0, blink: 0, last: -1, dummy: !!t.dummy })) }));
      // drop the squigs on the land, spread out
      const placed = [];
      if (!M.training) M.teams.forEach(t => t.squigs.forEach(s => {
        for (let k = 0; k < 400; k++) {
          const x = 24 + Math.random() * (W - 48) | 0; let y = 0; while (y < H && !MASK[y * W + x]) y++;
          if (y >= WATER0 - 16 || y < 40) continue;
          if (placed.some(p => Math.abs(p.x - x) < (k < 300 ? 40 : 14))) continue;
          if (bodyHit(x, y - 1)) continue;
          s.x = x; s.y = y - 1; s.face = x < W / 2 ? 1 : -1; placed.push(s); s.air = false; break;
        }
      }));
      M.totalHp = M.teams.map(t => t.squigs.length * 100);
      cam.x = clamp(W / 2 - VW / 2, 0, W - VW); cam.y = clamp(300 - VH / 2, -120, H - VH);
      M.phase = 'end'; M.endWait = 0.6; M.crateDone = true;
      if (!M.attract) G.status(`${THEMES[theme].n} · ${M.teams.length} teams · turn time ${M.turnTime}s`);
      return M;
    }

    // ---- squig physics
    function bodyHit(x, y) { return solid(x, y) || solid(x - 3, y - 2) || solid(x + 3, y - 2) || solid(x - 4, y - 7) || solid(x + 4, y - 7) || solid(x, y - 12) || solid(x - 2, y - 11) || solid(x + 2, y - 11); }
    const supported = s => solid(s.x, s.y + 1) || solid(s.x - 2, s.y + 1) || solid(s.x + 2, s.y + 1);
    function walkStep(s, dir) {
      s.face = dir;
      const nx = s.x + dir;
      if (nx < 2 || nx > W - 3) return false;
      let ny = null;
      for (let up = 0; up <= 5; up++) if (!bodyHit(nx, s.y - up)) { ny = s.y - up; break; }
      if (ny == null) return false;
      for (let k = 0; k < 4 && !solid(nx, ny + 1) && !solid(nx - 2, ny + 1) && !solid(nx + 2, ny + 1); k++) ny++;
      s.x = nx; s.y = ny; s.step++; s.lastStep = performance.now();
      if (!supported(s)) { s.air = true; s.vx = dir * 20; s.vy = 0; }
      return true;
    }
    function squigTick(s, dt) {
      if (s.dead) return;
      if (!s.air) { if (!supported(s)) { s.air = true; s.vx = 0; s.vy = 0; s.wedge = (s.wedge || 0) + 1; } else s.wedge = 0; return; } // wedge: stuck on an overhang by its elbows
      s.vy += GRAV * dt;
      const dx = s.vx * dt, dy = s.vy * dt, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
      for (let i = 0; i < n; i++) {
        const nx = s.x + dx / n;
        if (bodyHit(Math.round(nx), Math.round(s.y))) { s.vx *= -0.35; break; } else s.x = nx;
      }
      for (let i = 0; i < n; i++) {
        const ny = s.y + dy / n;
        if (bodyHit(Math.round(s.x), Math.round(ny))) {
          if (s.vy > 0) { land(s); return; }
          s.vy = 0; break;
        } else s.y = ny;
      }
      if (s.x < -20 || s.x > W + 20) { s.y = M.waterY + 10; }
      if (s.y > M.waterY + 6) drown(s);
    }
    function land(s) {
      const v = s.vy;
      s.x = Math.round(s.x); s.y = Math.round(s.y);
      for (let k = 0; k < 10 && bodyHit(s.x, s.y); k++) s.y--;
      s.air = false; s.vx = 0; s.vy = 0;
      if (v > 330) { const d = Math.round((v - 330) / 6); hurt(s, d, -1); if (s === M.sq && M.phase === 'aim') M.hurtSelf = true; }
    }
    function drown(s) {
      if (s.dead) return;
      s.dead = true; s.hp = 0; s.drowned = true;
      say(s, 'Glub!');
      splash(s.x, M.waterY, 1);
      FX.push({ sink: 1, x: s.x, y: M.waterY - 4, vx: 0, vy: 14, life: 2.2, max: 2.2, sq: s });
      if (s.last >= 0 && s.last !== s.team) { M.teams[s.last].stats.kills++; M.teams[s.last].stats.drown++; if (s.last === M.cur) M.goKOs = (M.goKOs || 0) + 1; }
      sfx('uhoh');
      if (s === M.sq) M.hurtSelf = true;
    }
    function hurt(s, d, by) {
      if (s.dead || d <= 0) return;
      POPS.push({ x: s.x + (Math.random() - 0.5) * 6, y: s.y - 34, text: '-' + d, col: LABEL[M.teams[s.team].col], t: 0, dmg: 1 });
      s.ouch = 0.5;
      if (s.dummy) { M.dummyHit = { d, w: M.lastFired || '' }; say(s, pick(['Oof!', 'Hay!', 'Ow, my straw!', 'Ten points!'])); return; }
      s.hp = Math.max(M.training ? 1 : 0, s.hp - d);
      if (by >= 0) { s.last = by; if (by !== s.team) M.teams[by].stats.dmg += d; else M.teams[by].stats.self += d; if (d > M.best.hit && M.sq) M.best = { hit: d, who: M.sq.name, team: M.sq.team }; }
      if (Math.random() < 0.6) say(s, pick(SAY.hurt));
    }
    function say(s, text) { if (OPT.bubbles && !M.attract) s.bubble = { text, t: 1.8 }; }

    // ---- projectiles
    function normalAt(x, y) {
      let nx = 0, ny = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (solid(x + dx, y + dy)) { nx -= dx; ny -= dy; }
      const l = Math.hypot(nx, ny); return l ? [nx / l, ny / l] : [0, -1];
    }
    // one physics tick. Returns null, 'hit', 'fuse', 'water' or 'gone'. Used by the real game and by the computer's aiming.
    function projTick(p, dt, sim) {
      p.t += dt;
      if (p.rest) { if (!solid(p.x, p.y + 2)) p.rest = false; else { if (p.fuse != null && p.t >= p.fuse) return 'fuse'; return null; } }
      if (p.home && p.t > 0.3 && p.t < 4) { // a homing missile: steer for the target, no gravity, no wind
        const want = Math.atan2(p.ty - p.y, p.tx - p.x), cur = Math.atan2(p.vy, p.vx);
        let da = want - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        const a = cur + clamp(da, -4.5 * dt, 4.5 * dt), sp = Math.max(280, Math.hypot(p.vx, p.vy));
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      } else {
        if (p.wind) p.vx += M.wind * WINDK * dt;
        p.vy += GRAV * dt;
      }
      const dx = p.vx * dt, dy = p.vy * dt, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 1.5));
      for (let i = 0; i < n; i++) {
        const nx = p.x + dx / n, ny = p.y + dy / n;
        if (ny > M.waterY) { p.x = nx; p.y = ny; return 'water'; }
        if (nx < -150 || nx > W + 150 || ny < -800) return 'gone';
        if (solid(nx, ny)) {
          if (p.impact) { p.x = nx; p.y = ny; return 'hit'; }
          const [mx, my] = normalAt(nx | 0, ny | 0), dot = p.vx * mx + p.vy * my;
          if (dot < 0) { p.vx = (p.vx - 2 * dot * mx) * p.bounce; p.vy = (p.vy - 2 * dot * my) * p.bounce; }
          p.bounces++;
          if (!sim && Math.hypot(p.vx, p.vy) > 60) note(180 + Math.random() * 60, 0.04, 'square');
          if (p.burst && p.bounces >= p.burst) return 'hit';
          if (Math.hypot(p.vx, p.vy) < 26) { p.vx = 0; p.vy = 0; p.rest = true; }
          break;
        }
        if (p.impact && p.t > 0.06) {
          for (const t of M.teams) for (const s of t.squigs) {
            if (s.dead || (s === p.owner && p.t < 0.35)) continue;
            const ddx = nx - s.x, ddy = ny - (s.y - 6);
            if (ddx * ddx + ddy * ddy < 64) { p.x = nx; p.y = ny; return 'hit'; }
          }
        }
        p.x = nx; p.y = ny;
      }
      if (p.fuse != null && p.t >= p.fuse) return 'fuse';
      return null;
    }
    // the Cyber Pet: waddles along the ground, hops over walls, turns round when it's really stuck
    const petHit = (x, y) => solid(x, y) || solid(x - 3, y - 3) || solid(x + 3, y - 3) || solid(x, y - 8);
    function petTick(p, dt) {
      p.t += dt;
      if (p.det || p.t >= p.fuse) return 'fuse';
      if (p.air) {
        p.vy += GRAV * dt;
        const dx = p.vx * dt, dy = p.vy * dt, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
        for (let i = 0; i < n; i++) { const nx = p.x + dx / n; if (petHit(Math.round(nx), Math.round(p.y))) { p.vx = 0; break; } p.x = nx; }
        for (let i = 0; i < n; i++) {
          const ny = p.y + dy / n;
          if (petHit(Math.round(p.x), Math.round(ny))) { if (p.vy > 0) { p.air = false; p.vx = 0; p.vy = 0; p.x = Math.round(p.x); p.y = Math.round(p.y); for (let k = 0; k < 10 && petHit(p.x, p.y); k++) p.y--; } else p.vy = 0; break; }
          p.y = ny;
        }
      } else {
        p.wa += dt * 46;
        while (p.wa >= 1 && !p.air) {
          p.wa--;
          const nx = p.x + p.dir; let ny = null;
          for (let up = 0; up <= 6; up++) if (!petHit(nx, p.y - up)) { ny = p.y - up; break; }
          if (ny == null) { p.hops++; if (p.hops > 3) { p.dir = -p.dir; p.hops = 0; } else { p.air = true; p.vy = -190; p.vx = p.dir * 55; } break; }
          for (let k = 0; k < 4 && !solid(nx, ny + 1); k++) ny++;
          p.x = nx; p.y = ny; p.step++;
          if (!solid(p.x, p.y + 1) && !solid(p.x - 2, p.y + 1) && !solid(p.x + 2, p.y + 1)) { p.air = true; p.vx = p.dir * 46; p.vy = 0; }
        }
      }
      if (p.x < -40 || p.x > W + 40 || p.y > M.waterY) return 'water';
      return null;
    }
    function mkProj(kind, x, y, vx, vy, o) {
      return Object.assign({ kind, x, y, vx, vy, t: 0, bounces: 0, bounce: 0.5, rest: false, impact: false, wind: false, fuse: null, owner: null, r: 24, dmg: 40, acc: 0 }, o || {});
    }
    function updateProjectiles(dt) {
      for (let i = M.P.length - 1; i >= 0; i--) {
        const p = M.P[i];
        if (p.holyT != null) { p.holyT -= dt; if (p.holyT <= 0) { M.P.splice(i, 1); boom(p.x, p.y, p.r, p.dmg, p.ownerTeam); } continue; }
        p.acc += dt; let res = null;
        while (p.acc >= TICK && !res) { p.acc -= TICK; res = p.kind === 'pet' ? petTick(p, TICK) : projTick(p, TICK, false); }
        if (p.kind === 'pet' && !res && !M.attract && (p.t * 3 | 0) !== p.beep) { p.beep = p.t * 3 | 0; note(p.t > 4.5 ? 1400 : 980, 0.05, 'square'); }
        if (p.kind === 'bazooka' || p.kind === 'missile' || p.kind === 'homing') { if (Math.random() < 0.7) FX.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 10, vy: -8, life: 0.6, max: 0.6, col: '#ccc', size: 2 + Math.random() * 2, smoke: true }); }
        if (p.kind === 'dynamite' && Math.random() < 0.6) FX.push({ x: p.x + 3, y: p.y - 6, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 40, life: 0.25, max: 0.25, col: '#ffd000', size: 1.5 });
        if (!res) continue;
        if (res === 'gone') { M.P.splice(i, 1); continue; }
        if (res === 'water') { M.P.splice(i, 1); splash(p.x, M.waterY); continue; }
        if (res === 'fuse' && p.kind === 'holy') { p.holyT = 1.3; p.vx = p.vy = 0; p.rest = true; choir(); continue; }
        M.P.splice(i, 1);
        boom(p.x, p.y, p.r, p.dmg, p.ownerTeam);
        if (p.kind === 'pet' && M.phase === 'retreat') M.retreat = Math.min(M.retreat, 2);
        if (p.cl) for (let k = 0; k < p.cl; k++) {
          const a = -Math.PI / 2 + (k - (p.cl - 1) / 2) * 0.42 + (R() - 0.5) * 0.2, sp = 150 + R() * 90;
          const kid = p.kind === 'banana'
            ? mkProj('bananalet', p.x, p.y - 4, Math.cos(a) * sp, Math.sin(a) * sp, { r: 28, dmg: 45, bounce: 0.55, burst: 2, fuse: 4, ownerTeam: p.ownerTeam })
            : mkProj('clusterlet', p.x, p.y - 4, Math.cos(a) * sp * 0.8, Math.sin(a) * sp * 0.8, { r: 13, dmg: 18, impact: true, ownerTeam: p.ownerTeam });
          M.P.push(kid);
        }
      }
    }
    function choir() { if (mute) return; [262, 330, 392, 523, 659].forEach((f, i) => G.timer(() => { if (alive) G.note(f, 1.1, 'triangle'); }, i * 40)); }
    function splash(x, y, big) {
      const wc = THEMES[theme].water;
      for (let k = 0; k < (big ? 26 : 14); k++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = 80 + Math.random() * (big ? 220 : 150); FX.push({ x: x + (Math.random() - 0.5) * 8, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, max: 0.9, col: k & 1 ? wc[2] : '#fff', size: 2 + (k % 3), grav: 1 }); }
      FX.push({ ring: 1, x, y, r: 4, life: 0.5, max: 0.5, col: wc[2], flat: 1 });
      if (!M || !M.attract) note(140, 0.18, 'triangle');
    }

    // ---- explosions
    const WORDS = ['POW!', 'BIFF!', 'KABOOM!', 'WHAM!', 'BLAM!', 'KER-SPLAT!', 'BOOM!', 'KAPOW!'];
    function boom(x, y, r, dmg, byTeam) {
      x = Math.round(x); y = Math.round(y);
      // what was it made of? (the debris is the same colour as the ground that got blown up)
      let dirt = THEMES[theme].dirt;
      try { if (x >= 0 && x < W && y >= 0 && y < H && solid(x, y + 3)) { const p = tctx.getImageData(x, Math.min(H - 1, y + 3), 1, 1).data; if (p[3] > 100) dirt = `rgb(${p[0]},${p[1]},${p[2]})`; } } catch (e) {}
      carve(x, y, r, true); M.carves.push([x, y, r]); (M.tops = M.tops || []).push([x, y, r]);
      M.terra = (M.terra || 0) + Math.round(r * r / 40);
      for (const t of M.teams) for (const s of t.squigs) {
        if (s.dead) continue;
        const dx = s.x - x, dy = (s.y - 6) - y, d = Math.hypot(dx, dy), R = r * 1.45;
        if (d >= R) continue;
        const f = 1 - d / R, loss = Math.max(1, Math.round(dmg * f));
        hurt(s, loss, byTeam == null ? -1 : byTeam);
        if (s.dummy) continue; // dummies are on a pole
        const k = (120 + dmg * 4) * f, nx = d ? dx / d : 0, ny = d ? dy / d : -1;
        s.air = true; s.wedge = 0; s.vx = nx * k; s.vy = Math.min(-60, ny * k - 120 * f);
        if (s === M.sq && (M.phase === 'aim' || M.phase === 'retreat')) M.hurtSelf = true;
      }
      for (const c of M.crates) if (!c.gone && Math.hypot(c.x - x, c.y - y) < r + 8) { c.gone = true; const mm = M; later(120, () => { if (alive && M === mm) boom(c.x, c.y - 6, 18, 15, null); }); }
      for (const p of M.P) if (Math.hypot(p.x - x, p.y - y) < r * 1.4 && (p.kind === 'dynamite' || p.kind === 'pet')) { p.rest = false; p.vy -= 160; p.vx += (p.x - x) * 3; }
      for (const g of M.graves) if (Math.hypot(g.x - x, g.y - y) < r * 1.5) { g.vy = -120; g.vx = (g.x - x) * 4; }
      EX.push({ x, y, r, t: 0 });
      // the show: a fireball, a shockwave, sparks, lumps of ground and a lot of smoke
      FX.push({ ball: 1, x, y, r, life: 0.55, max: 0.55 });
      FX.push({ ring: 1, x, y, r: r * 0.6, grow: r * 3.2, life: 0.32, max: 0.32, col: '#fff8d0' });
      for (let k = 0; k < 10 + r / 2; k++) { const a = Math.random() * TAU, sp = 90 + Math.random() * 260; FX.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.35 + Math.random() * 0.3, max: 0.65, col: k % 3 ? '#ffd040' : '#fff', size: 1.5, spark: 1 }); }
      for (let k = 0; k < 10 + r / 3; k++) { const a = Math.random() * TAU, sp = 60 + Math.random() * 220; FX.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 1.1, max: 1.1, col: k % 3 ? dirt : '#2a1a0a', size: 2 + (k % 3), grav: 1, chunk: 1 }); }
      for (let k = 0; k < 6 + r / 4; k++) { const a = Math.random() * TAU, sp = 10 + Math.random() * 40; FX.push({ x: x + Math.cos(a) * r * 0.5, y: y + Math.sin(a) * r * 0.5, vx: Math.cos(a) * sp, vy: -24 - Math.random() * 24, life: 1.6, max: 1.6, col: k & 1 ? '#7a7a7a' : '#a0a0a0', size: 5 + Math.random() * 6, smoke: true }); }
      if (r >= 28 && !M.attract) POPS.push({ x, y: y - r - 6, text: pick(WORDS), col: r >= 50 ? '#ff6a2a' : '#ffe000', t: 0, big: 1 });
      cam.shake = Math.max(cam.shake, Math.min(12, r / 4));
      if (r >= 40 && !M.attract) cam.flash = Math.min(0.55, r / 110);
      sfx('thud'); if (r >= 40) note(55, 0.5, 'sawtooth'); else note(90 + Math.random() * 30, 0.18, 'sawtooth');
    }

    // ---- turns
    function nextSquig(t) {
      const n = t.squigs.length;
      for (let k = 0; k < n; k++) { const s = t.squigs[(t.next + k) % n]; if (!s.dead && s.hp > 0) { t.next = (t.next + k + 1) % n; return s; } }
      return null;
    }
    function startTurn() {
      if (M.goKOs >= 3 && M.cur >= 0 && !NET && !M.attract && !M.teams[M.cur].cpu) G.secret('squigs.hattrick');
      M.goKOs = 0;
      let ni = M.cur;
      for (let k = 0; k < M.teams.length; k++) { ni = (ni + 1) % M.teams.length; const tm = M.teams[ni]; if (liveSquigs(tm).length && !tm.dummy && !(NET && tm.out && !tm.cpu)) break; }
      M.cur = ni; M.turn++;
      const t = turnTeam(), s = nextSquig(t);
      M.sq = s; M.phase = 'aim'; M.timer = M.training ? 1e9 : M.turnTime; M.retreat = 0; M.power = 0; M.charging = false; M.target = null; M.hurtSelf = false; M.lastFired = '';
      M.weapon = t.ammo[t.last] !== 0 ? t.last : 'bazooka'; M.shots = WPN[M.weapon].shots || 1;
      M.wind = M.training ? TR.wind : Math.round((Math.random() * 2 - 1) * 10) / 10;
      M.banner = M.training ? null : { text: `${t.name}: ${s.name}`, col: LABEL[t.col], t: 2.2 };
      M.arrow = 2.2; M.lastBeep = 99; cam.manual = 0;
      inp.left = inp.right = inp.up = inp.down = false; walkAcc = 0;
      if (Math.random() < 0.35 && !M.training) say(s, pick(/N64/.test(t.name) && Math.random() < 0.5 ? SAY.n64 : /Callum/.test(t.name) && Math.random() < 0.4 ? SAY.pc : SAY.start));
      sfx('join');
      M.ai = t.cpu && (!NET || NET.s.host) ? { state: 'think', t: M.attract ? 0.4 : AIL[t.lvl || 'normal'].think, walked: 0, lvl: t.lvl || 'normal' } : null;
      if (!M.attract && !M.training) {
        G.status(`Turn ${M.turn}${M.sudden ? ' · SUDDEN DEATH' : ''} · Wind ${M.wind < 0 ? '←' : M.wind > 0 ? '→' : ''} ${Math.round(Math.abs(M.wind) * 100)} · ${t.name} (${s.name})${t.cpu ? ' · computer' : ''}`);
        if (!t.cpu && !NET) G.save('auto', serial());
        if (!NET && !M.cfg.visit) { asSnap = serial(); AS.now(); } // the carry-on save: the start of this go
      }
      syncBar();
    }
    function endTurnNow() { if (M.phase === 'aim' || M.phase === 'retreat') { M.phase = 'settle'; M.charging = false; syncBar(); } }
    function settled() {
      if (M.P.length || EX.length || (M.later && M.later.length)) return false;
      for (const t of M.teams) for (const s of t.squigs) if (!s.dead && s.air && !(s.wedge > 12)) return false;
      for (const c of M.crates) if (!c.gone && !c.landed) return false;
      return true;
    }
    function endSequence(dt) {
      if (!settled()) return;
      if (M.endWait > 0) { M.endWait -= dt; return; }
      const d = M.teams.flatMap(t => t.squigs).find(s => !s.dead && s.hp <= 0);
      if (d) {
        if (!d.dying) { d.dying = true; d.dieT = 0; say(d, pick(['Bye-bye!', 'Tell Mom...', 'Game over, man!', 'Insert coin!', 'I\'ll be back!', 'Noooo!'])); M.focus = d; M.endWait = 1.1; }
        else {
          d.dead = true; M.focus = null;
          if (d.last >= 0 && d.last !== d.team) { M.teams[d.last].stats.kills++; if (d.last === M.cur) M.goKOs = (M.goKOs || 0) + 1; }
          M.graves.push({ x: d.x, y: d.y, vx: 0, vy: 0, team: d.team, name: d.name });
          boom(d.x, d.y - 6, 16, 10, d.last);
          FX.push({ ghost: 1, x: d.x, y: d.y - 10, vx: 0, vy: -26, life: 2.2, max: 2.2, col: LABEL[M.teams[d.team].col] });
          if (!M.attract) POPS.push({ x: d.x, y: d.y - 44, text: 'K.O.!', col: '#ff5a5a', t: 0, big: 1 });
          M.endWait = 0.5;
        }
        return;
      }
      M.focus = null;
      if (M.training) { TR.boundary(); if (M.training) startTurn(); return; }
      if (NET && !M.attract) { NET.atB = true; return; } // online: the host decides what happens next (netBoundary)
      const left = M.teams.filter(t => liveSquigs(t).length);
      if (left.length <= 1) return gameOver(left[0] || null);
      if (M.demo && M.turn >= 14) return gameOver(null, 'time');
      if (!M.crateDone) {
        M.crateDone = true;
        if (!M.sudden && M.turn >= M.teams.length * 7) { M.sudden = true; M.banner = { text: 'SUDDEN DEATH! The water is rising!', col: '#ff5a3a', t: 2.6 }; sfx('uhoh'); }
        if (M.sudden) { M.waterY = Math.max(260, M.waterY - 14); for (const t of M.teams) for (const s of t.squigs) if (!s.dead && s.y > M.waterY) drown(s); }
        if (Math.random() < 0.4) dropCrate();
        M.endWait = 0.3; return;
      }
      startTurn();
    }
    function dropCrate() {
      for (let k = 0; k < 40; k++) {
        const x = 30 + Math.random() * (W - 60) | 0; let y = 0; while (y < H && !MASK[y * W + x]) y++;
        if (y >= M.waterY - 10) continue;
        const kinds = ORDER.filter(w => WPN[w].ammo > 0 && !(M.demo && !WPN[w].demo));
        const health = Math.random() < 0.4 || !kinds.length;
        M.crates.push({ x, y: -20, vy: 0, landed: false, health, wpn: health ? null : pick(kinds), gone: false });
        M.banner = { text: health ? 'Health crate incoming!' : 'Weapon crate incoming!', col: '#fff', t: 1.6 };
        return;
      }
    }
    function updateCrates(dt) {
      for (const c of M.crates) {
        if (c.gone) continue;
        if (!c.landed) {
          c.vy = Math.min(c.vy + GRAV * dt, c.y < 0 || !c.para0 ? 55 : 300);
          c.y += c.vy * dt;
          if (solid(c.x, c.y + 1) || solid(c.x - 6, c.y + 1) || solid(c.x + 6, c.y + 1)) { c.landed = true; c.para0 = true; while (solid(c.x, c.y)) c.y--; }
          if (c.y > M.waterY) { c.gone = true; splash(c.x, M.waterY); }
        } else if (!solid(c.x, c.y + 1) && !solid(c.x - 6, c.y + 1) && !solid(c.x + 6, c.y + 1)) { c.landed = false; c.vy = 60; c.para0 = true; }
        for (const t of M.teams) for (const s of t.squigs) {
          if (s.dead || c.gone || s.dummy) continue;
          if (Math.abs(s.x - c.x) < 11 && Math.abs((s.y - 6) - (c.y - 7)) < 14) {
            c.gone = true; sfx('pet');
            if (c.health) { s.hp += 25; POPS.push({ x: s.x, y: s.y - 34, text: '+25', col: '#7aff7a', t: 0, dmg: 1 }); }
            else { const tm = M.teams[s.team]; if (tm.ammo[c.wpn] >= 0) tm.ammo[c.wpn]++; POPS.push({ x: s.x, y: s.y - 38, text: '+1 ' + WPN[c.wpn].n, col: '#ffe000', t: 0 }); }
            M.crateGot = (M.crateGot || 0) + 1;
            for (let k = 0; k < 12; k++) FX.push({ x: c.x, y: c.y - 7, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 90, life: 0.7, max: 0.7, col: c.health ? '#ff7aa0' : '#ffe000', size: 2, spark: 1, grav: 1 });
          }
        }
      }
      M.crates = M.crates.filter(c => !c.gone);
    }
    function gameOver(winner, why) {
      M.phase = 'over'; M.over = true; M.winner = winner; syncBar();
      if (M.attract) { G.timer(() => { if (alive && scene === 'title' && M && M.attract && M.over) attract(); }, 2500); return; }
      if (NET) { netOver(winner, why); } else {
        if (winner) {
          sfx('solve'); liveSquigs(winner).forEach(s => say(s, pick(['Yesss!', 'Flawless!', 'GG!', 'Get in!', 'Top score!'])));
          if (!winner.cpu) { G.secret('squigs.win'); if (M.teams.some(t => t.cpu && t.lvl === 'hard')) G.secret('squigs.veteran'); }
          const hof = G.load('hof', {}); hof[winner.name] = (hof[winner.name] || 0) + 1; G.save('hof', hof); }
        G.save('auto', null);
        asSnap = null; AS.clear();
      }
      const mm = M; G.timer(() => { if (alive && M === mm && scene === 'game') endScreen(winner, why); }, 1800);
    }

    // ---- firing
    const aimDir = s => [Math.cos(s.aim) * s.face, -Math.sin(s.aim)];
    function fire() {
      const s = M.sq, t = turnTeam(), k = M.weapon, w = WPN[k];
      if (!s || s.dead || t.ammo[k] === 0) return;
      const [dx, dy] = aimDir(s), x0 = s.x + dx * 9, y0 = s.y - 7 + dy * 9;
      M.charging = false;
      if (k === 'skip') { M.phase = 'settle'; say(s, 'Pass!'); syncBar(); return; }
      if ((w.type === 'target' || w.home) && !M.target) { M.banner = { text: 'Click the map to pick a spot first', col: '#fff', t: 1.6 }; return; }
      if (t.ammo[k] > 0) t.ammo[k]--;
      t.last = k; M.lastFired = k;
      let retreat = 3;
      if (w.type === 'charge') {
        const sp = w.speed * Math.max(0.1, M.power);
        const fuse = w.fixfuse || (FUSED[k] ? M.fuse : null);
        M.P.push(mkProj(k, x0, y0, dx * sp, dy * sp, { impact: !!w.impact, wind: !!w.wind, bounce: w.bounce || 0.5, fuse, r: w.r, dmg: w.dmg, cl: w.cl || 0, owner: s, ownerTeam: s.team, home: w.home ? 1 : 0, tx: M.target ? M.target.x : 0, ty: M.target ? M.target.y : 0 }));
        sfx(k === 'bazooka' || k === 'homing' ? 'zap' : 'boing');
        for (let i = 0; i < 6; i++) FX.push({ x: x0 + dx * 4, y: y0 + dy * 4, vx: dx * (40 + Math.random() * 60) + (Math.random() - 0.5) * 30, vy: dy * (40 + Math.random() * 60) + (Math.random() - 0.5) * 30, life: 0.5, max: 0.5, col: '#d8d8d8', size: 3 + Math.random() * 3, smoke: true });
        if (k === 'banana' && !M.attract && !t.cpu && (!NET || NET.ctrl === myId())) G.secret('squigs.banana');
        if (Math.random() < 0.3) say(s, pick(SAY.fire));
      } else if (k === 'shotgun') {
        let hx = x0, hy = y0, hit = false;
        for (let d = 0; d < 420 && !hit; d += 2) {
          hx = x0 + dx * d; hy = y0 + dy * d;
          if (solid(hx, hy) || hy > M.waterY) hit = true;
          for (const tm of M.teams) for (const q of tm.squigs) if (!q.dead && q !== s && Math.hypot(hx - q.x, hy - (q.y - 6)) < 7) hit = true;
        }
        FX.push({ x: x0, y: y0, x2: hx, y2: hy, life: 0.12, max: 0.12, line: 1 });
        note(90, 0.12, 'sawtooth'); sfx('turn');
        if (hit) boom(hx, hy, w.r, w.dmg, s.team);
        M.shots--;
        if (M.shots > 0) { M.power = 0; syncBar(); return; }
      } else if (k === 'punch') {
        sfx('boing'); note(110, 0.2, 'square'); s.air = true; s.vy = -150; s.vx = s.face * 20;
        for (const tm of M.teams) for (const q of tm.squigs) {
          if (q.dead || q === s) continue;
          const ddx = (q.x - s.x) * s.face;
          if (ddx > -2 && ddx < 22 && Math.abs(q.y - s.y) < 18) { hurt(q, w.dmg, s.team); if (!q.dummy) { q.air = true; q.vx = s.face * 170; q.vy = -300; } cam.shake = 6; }
        }
        POPS.push({ x: s.x + s.face * 12, y: s.y - 20, text: 'JACK PUNCH!', col: '#ff8a3a', t: 0, big: 1 });
      } else if (k === 'dynamite') {
        M.P.push(mkProj('dynamite', s.x + s.face * 4, s.y - 4, s.face * 25, -40, { bounce: 0.2, fuse: w.fuse, r: w.r, dmg: w.dmg, owner: s, ownerTeam: s.team }));
        say(s, pick(SAY.run)); retreat = 5; sfx('click');
      } else if (k === 'pet') {
        M.P.push(mkProj('pet', s.x + s.face * 6, s.y - 1, 0, 0, { dir: s.face, air: true, wa: 0, hops: 0, step: 0, fuse: 6, r: w.r, dmg: w.dmg, owner: s, ownerTeam: s.team, beep: -1 }));
        say(s, pick(['Go on, little fella!', 'Feed it? NO.', 'Off you pop!'])); retreat = 7; sfx('click');
        if (!M.attract && !t.cpu && (!NET || NET.ctrl === myId())) G.secret('squigs.pet');
      } else if (k === 'airstrike') {
        const tx = M.target.x;
        for (let i = 0; i < 5; i++) M.P.push(mkProj('missile', tx + (i - 2) * 18 - s.face * 70, -60 - i * 6, s.face * 110, 160, { impact: true, wind: true, r: w.r, dmg: w.dmg, ownerTeam: s.team }));
        M.banner = { text: 'AIR STRIKE!', col: '#ff5a3a', t: 1.4 }; sfx('zap'); retreat = 3;
      } else if (k === 'girder') {
        const a = clamp(-s.aim * s.face, -0.8, 0.8);
        if (Math.hypot(M.target.x - s.x, M.target.y - s.y) > 170) { t.ammo[k]++; M.target = null; M.banner = { text: 'Too far away! (170 pixels max)', col: '#fff', t: 1.5 }; return; }
        addGirder(M.target.x, M.target.y, a); M.girders.push([M.target.x, M.target.y, a]); (M.tops = M.tops || []).push([M.target.x, M.target.y, Math.round(a * 1000), 1]); sfx('thud'); retreat = 0;
      } else if (k === 'teleport') {
        const tx = Math.round(M.target.x), ty = Math.round(M.target.y);
        if (bodyHit(tx, ty) || ty > M.waterY - 4 || ty < 14) { t.ammo[k]++; M.target = null; M.banner = { text: 'Can\'t teleport into solid stuff!', col: '#fff', t: 1.5 }; return; }
        for (let i = 0; i < 16; i++) FX.push({ x: s.x, y: s.y - 6, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, life: 0.6, max: 0.6, col: '#d080ff', size: 2 });
        s.x = tx; s.y = ty; s.air = true; s.vx = 0; s.vy = 0; sfx('zap'); retreat = 0;
      }
      M.target = null;
      M.phase = retreat ? 'retreat' : 'settle'; M.retreat = retreat;
      syncBar();
    }

    // ---- the computer player
    function simShot(s, face, aim, power, k, wind) {
      const w = WPN[k], dx = Math.cos(aim) * face, dy = -Math.sin(aim), sp = w.speed * power;
      const p = mkProj(k, s.x + dx * 9, s.y - 7 + dy * 9, dx * sp, dy * sp, { impact: !!w.impact, wind: !!w.wind, bounce: w.bounce || 0.5, fuse: w.fixfuse || (FUSED[k] ? 3 : null), owner: s });
      const ow = M.wind; M.wind = wind;
      let res = null;
      for (let i = 0; i < 1800 && !res; i++) res = projTick(p, TICK, true); // the same steps as the real thing (bounces are fussy)
      M.wind = ow;
      if (res === 'hit' || res === 'fuse' || (!res && p.rest)) return { x: p.x, y: p.y };
      return null;
    }
    function scoreAt(pt, r, dmg, me) {
      let sc = 0;
      for (const t of M.teams) for (const q of t.squigs) {
        if (q.dead || q.hp <= 0) continue;
        const d = Math.hypot(q.x - pt.x, q.y - 6 - pt.y), R = r * 1.45;
        if (d >= R) continue;
        const v = Math.min(q.hp, dmg * (1 - d / R)) + (q.hp <= dmg * (1 - d / R) ? 30 : 0);
        sc += q.team === me.team ? -v * (q === me ? 2 : 1.5) : v;
      }
      return sc;
    }
    function* planShot(L) {
      const s = M.sq, t = turnTeam(), enemies = M.teams.filter((x, i) => i !== M.cur && !x.dummy).flatMap(liveSquigs);
      if (!enemies.length) return { k: 'skip' };
      let best = { sc: 0 };
      const edge = q => q.x < 90 || q.x > W - 90 || q.y > M.waterY - 60;
      for (const q of enemies) {
        const dx = q.x - s.x, dy = q.y - s.y, dist = Math.hypot(dx, dy);
        if (dist < 20 && Math.abs(dy) < 16 && t.ammo.punch !== 0) { const sc = 40 + (edge(q) ? 40 : 0); if (sc > best.sc) best = { sc, k: 'punch', face: dx >= 0 ? 1 : -1, aim: 0 }; }
        if (dist < 18 && t.ammo.dynamite > 0 && L !== AIL.easy) { const sc = 46 + (q.hp <= 75 ? 30 : 0); if (sc > best.sc) best = { sc, k: 'dynamite', face: dx >= 0 ? 1 : -1, aim: s.aim }; }
        // shotgun: a clear line?
        if (dist < 300) {
          const face = dx >= 0 ? 1 : -1, aim = Math.atan2(-(dy), Math.abs(dx));
          if (aim > -1.5 && aim < 1.5) {
            let clear = true; const ux = dx / dist, uy = dy / dist;
            for (let d = 10; d < dist - 6; d += 3) if (solid(s.x + ux * d, s.y - 7 + uy * d)) { clear = false; break; }
            if (clear) { const sc = 24 + (q.hp <= 50 ? 20 : 0); if (sc > best.sc) best = { sc, k: 'shotgun', face, aim }; }
          }
        }
      }
      let n = 0;
      for (const k of ['bazooka', 'grenade']) {
        const w = WPN[k];
        for (const face of [1, -1]) for (let aim = -1.2; aim <= 1.45; aim += 0.09) for (let pw = 0.35; pw <= 1.001; pw += 0.075) {
          if (++n % 12 === 0) yield null;
          const pt = simShot(s, face, aim, pw, k, M.wind); if (!pt) continue;
          const sc = scoreAt(pt, w.r, w.dmg, s) - (k === 'grenade' ? 2 : 0);
          if (sc > best.sc) best = { sc, k, face, aim, pw };
        }
      }
      // the good stuff, sometimes (a Veteran saves it for when it counts)
      if (best.k === 'grenade' || best.k === 'bazooka') for (const sp of ['holy', 'banana', 'cluster']) {
        if (!(t.ammo[sp] > 0) || Math.random() > L.sp) continue;
        if (best.k === 'grenade' || (sp !== 'holy' && scoreAt(simShot(s, best.face, best.aim, best.pw, 'grenade', M.wind) || { x: -999, y: -999 }, WPN[sp].r, WPN[sp].dmg, s) > best.sc)) { best.k = sp; break; }
      }
      if (best.sc < 6 && t.ammo.airstrike > 0 && Math.random() < 0.5) { const q = pick(enemies); best = { sc: 10, k: 'airstrike', face: q.x > s.x ? 1 : -1, aim: s.aim, target: { x: Math.round(q.x), y: Math.round(q.y) } }; }
      if (best.sc < 4) { const q = enemies.reduce((a, b) => Math.abs(a.x - s.x) < Math.abs(b.x - s.x) ? a : b); best = { sc: 0, k: 'bazooka', face: q.x > s.x ? 1 : -1, aim: 0.6, pw: 0.7, walk: q.x > s.x ? 1 : -1 }; }
      const err = M.attract ? 0.04 : L.err;
      if (best.aim != null) best.aim = clamp(best.aim + (Math.random() - 0.5) * err * 2, -1.5, 1.5);
      if (best.pw != null) best.pw = clamp(best.pw + (Math.random() - 0.5) * (M.attract ? 0.04 : L.perr) * 2, 0.15, 1);
      return best;
    }
    // it "presses the buttons" like a person (so an online war can replay a computer's go on every screen too)
    function aiDo(code, v) { if (NET && !M.attract) { if (NET.ctrl === myId()) NET.queued.push([0, code, v]); } else applyEv(code, v); }
    function aiHold(a, k) { if (a.hold === k) return; if (a.hold) aiDo('k', [a.hold, 0]); if (k) aiDo('k', [k, 1]); a.hold = k; }
    function aiUpdate(dt) {
      const a = M.ai, s = M.sq; if (!a || !s || s.dead) return;
      const L = AIL[a.lvl] || AIL.normal, p = a.plan;
      if (M.phase === 'retreat') { // walk away from the dynamite (or the pet)
        const dyn = M.P.find(q => q.kind === 'dynamite' || q.kind === 'pet');
        aiHold(a, dyn && Math.abs(dyn.x - s.x) < 80 ? (s.x >= dyn.x ? 'right' : 'left') : '');
        return;
      }
      if (M.phase !== 'aim') { aiHold(a, ''); return; }
      if (s.air && a.state !== 'walk') return;
      if (a.state === 'think') {
        a.t -= dt; if (a.t > 0) return;
        if (!a.gen) a.gen = planShot(L);
        const t0 = performance.now(); let r = null;
        while (performance.now() - t0 < 7) { r = a.gen.next(); if (r.done) break; }
        if (!r || !r.done) return;
        a.gen = null; a.plan = r.value;
        if (a.plan.walk && a.walked < L.walk) { a.state = 'walk'; a.t = 1.1 + Math.random() * 0.6; a.walked++; a.lastX = -1; a.stuck = 0; aiHold(a, a.plan.walk > 0 ? 'right' : 'left'); }
        else { a.state = 'turn'; a.wait = 0.3; aiDo('w', a.plan.k); if (a.plan.face && a.plan.face !== s.face) aiDo('a', [r3(s.aim), a.plan.face]); }
        return;
      }
      if (a.state === 'walk') {
        a.t -= dt;
        if (!s.air) { if (Math.abs(s.x - a.lastX) < 0.5) a.stuck += dt; else a.stuck = 0; a.lastX = s.x; }
        if (a.t <= 0 || a.stuck > 0.35) { aiHold(a, ''); if (a.stuck > 0.35) aiDo('p', 'jump'); a.state = 'think'; a.t = 0.5; }
        return;
      }
      if (a.state === 'turn') {
        a.wait -= dt; if (a.wait > 0) return;
        const goal = p.aim != null ? p.aim : s.aim, da = goal - s.aim;
        if (Math.abs(da) > 0.05) { aiHold(a, da > 0 ? 'up' : 'down'); return; }
        aiHold(a, '');
        aiDo('a', [r3(goal), p.face || s.face]);
        if (p.target) aiDo('tg', [p.target.x, p.target.y]);
        a.state = 'fire'; a.wait = 0.3; return;
      }
      if (a.state === 'fire') { a.wait -= dt; if (a.wait > 0) return; aiDo('p', 'fireDown'); if (WPN[p.k].type === 'charge') a.state = 'charge'; else { a.state = 'after'; a.wait = 0.8; } return; }
      if (a.state === 'charge') { if (M.charging && M.power >= (p.pw || 0.7) - 0.02) { aiDo('p', 'fireUp'); a.state = 'after'; a.wait = 9; } return; }
      if (a.state === 'after' && p.k === 'shotgun' && M.shots > 0) { a.wait -= dt; if (a.wait <= 0) { aiDo('p', 'fireDown'); a.wait = 9; } }
    }

    // ================================================================ input
    const inp = { left: false, right: false, up: false, down: false };
    let walkAcc = 0;
    // a go is on and somebody (a person, or the computer pressing the same buttons) can move the jack
    const live = () => (scene === 'game' || (M && M.attract)) && M && !M.over && M.sq && !M.sq.dead && (M.phase === 'aim' || M.phase === 'retreat');
    const humanTurn = () => live() && !turnTeam().cpu;
    // online, only the player whose go it is can do anything (and what they do is sent to everybody: see act())
    const canAct = () => humanTurn() && (!NET || (NET.ctrl === myId() && !NET.waitT && !NET.done && !NET.skipped));
    function press(what) {
      if (!live()) return;
      const s = M.sq;
      const free = !s.air || s.wedge > 4;
      if (what === 'jump' && free) { s.air = true; s.wedge = 0; s.vx = s.face * 85; s.vy = -175; sfx('boing'); M.jumped = (M.jumped || 0) + 1; }
      if (what === 'flip' && free) { s.air = true; s.wedge = 0; s.vx = -s.face * 40; s.vy = -250; sfx('boing'); M.jumped = (M.jumped || 0) + 1; }
      if (what === 'fireDown' && M.phase === 'retreat') { const pet = M.P.find(p => p.kind === 'pet' && !p.det); if (pet) pet.det = 1; return; }
      if (M.phase !== 'aim') return;
      if (what === 'fireDown') {
        const w = WPN[M.weapon];
        if (turnTeam().ammo[M.weapon] === 0) { M.banner = { text: 'Out of ammo!', col: '#fff', t: 1 }; return; }
        if (w.home && !M.target) { M.banner = { text: 'Click the map to pick a target first', col: '#fff', t: 1.6 }; return; }
        if (w.type === 'charge') { M.charging = true; M.power = 0; } else fire();
      }
      if (what === 'fireUp' && M.charging) fire();
      if (what === 'fuse') { M.fuse = M.fuse % 5 + 1; sfx('click'); syncBar(); }
      if (/^f[1-5]$/.test(what)) { M.fuse = +what[1]; sfx('click'); syncBar(); }
    }
    const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', A: 'left', D: 'right' };
    on(document, 'keydown', ev => {
      if (!G.focused() || ev.target.closest('input,select,textarea')) return;
      const k = ev.key;
      if (k === 'F1') { ev.preventDefault(); helpScreen('keys'); return; }
      if (scene === 'maker') { makerKey(ev); return; }
      if (scene !== 'game') { if (k === 'Escape' && scene !== 'title' && !NET) { ev.preventDefault(); titleScreen(); } return; }
      if (k === 'Escape' || k === 'p' || k === 'P') { ev.preventDefault(); if (ovl.style.display === 'none') pauseMenu(); else closeOverlay(); return; }
      if (ovl.style.display !== 'none') return;
      if (KEYMAP[k]) { setKey(KEYMAP[k], true); ev.preventDefault(); return; }
      if (k === ' ') { ev.preventDefault(); if (!ev.repeat) act('p', 'fireDown'); return; }
      if (k === 'Enter') { ev.preventDefault(); act('p', 'jump'); return; }
      if (k === 'Backspace') { ev.preventDefault(); act('p', 'flip'); return; }
      if (/^[1-5]$/.test(k)) { act('p', 'f' + k); return; }
      if (k === 'c' || k === 'C' || k === 'Home') { cam.manual = 0; return; }
      if (k === 'w' || k === 'W' || k === 'Tab') { ev.preventDefault(); if (canAct() && M.phase === 'aim') weaponMenu(); }
    });
    on(document, 'keyup', ev => {
      if (KEYMAP[ev.key]) setKey(KEYMAP[ev.key], false);
      if (ev.key === ' ' && scene === 'game') act('p', 'fireUp');
    });
    // the canvas: drag from your jack to aim, drag anywhere else to look around, click to pick a target, right-click for weapons
    let drag = null;
    const aimable = () => canAct() && M.phase === 'aim' && !M.sq.air && WPN[M.weapon].type !== 'target' && !['skip', 'punch', 'dynamite', 'pet'].includes(M.weapon);
    function aimTo(p, final) {
      const s = M.sq, dx = p.x + cam.x - s.x, dy = p.y + cam.y - (s.y - 7);
      if (Math.hypot(dx, dy) < 5 || !aimable()) return;
      const face = Math.abs(dx) > 3 ? (dx > 0 ? 1 : -1) : s.face, aim = clamp(Math.atan2(-dy, Math.abs(dx)), -1.5, 1.5);
      drag.want = [r3(aim), face];
      const t = performance.now();
      if (!final && NET && t - (drag.sent || 0) < 70) return;
      if (drag.last && Math.abs(drag.last[0] - drag.want[0]) < 0.004 && drag.last[1] === face) return;
      drag.sent = t; drag.last = drag.want; act('a', drag.want);
    }
    on(C.cv, 'pointerdown', ev => {
      if (scene === 'maker') { makerPointer('down', ev); return; }
      if (scene !== 'game') return;
      const p = C.local(ev);
      drag = { x: p.x, y: p.y, cx: cam.x, cy: cam.y, moved: false, id: ev.pointerId };
      try { C.cv.setPointerCapture(ev.pointerId); } catch (e) {}
      if (ev.button === 0 && M && M.sq && aimable()) {
        const s = M.sq, sx = s.x - cam.x, sy = s.y - 7 - cam.y, [ax, ay] = aimDir(s);
        if (Math.hypot(p.x - sx, p.y - sy) < (G.touch ? 34 : 24) || Math.hypot(p.x - (sx + ax * 36), p.y - (sy + ay * 36)) < (G.touch ? 20 : 14)) { drag.aim = true; M.aimHint = 0; aimTo(p); }
      }
    });
    on(C.cv, 'pointermove', ev => {
      if (scene === 'maker') { makerPointer('move', ev); return; }
      if (!drag) return;
      const p = C.local(ev);
      if (drag.aim) { aimTo(p); return; }
      if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 6) drag.moved = true;
      if (drag.moved) { cam.x = clamp(drag.cx - (p.x - drag.x), 0, W - VW); cam.y = clamp(drag.cy - (p.y - drag.y), -140, H - VH); cam.manual = performance.now() + 2600; }
    });
    on(C.cv, 'pointerup', ev => {
      if (scene === 'maker') { makerPointer('up', ev); return; }
      if (!drag) return; const d = drag;
      if (d.aim) { aimTo(C.local(ev), true); drag = null; return; }
      drag = null;
      if (d.moved || ev.button === 2) return;
      const p = C.local(ev), wx = p.x + cam.x, wy = p.y + cam.y;
      if (canAct() && M.phase === 'aim' && (WPN[M.weapon].type === 'target' || WPN[M.weapon].home)) {
        act('tg', [Math.round(wx), Math.round(wy)]); sfx('click');
        if (WPN[M.weapon].home) M.banner = { text: 'Target locked! Now aim roughly that way and fire', col: '#fff', t: 1.8 };
        else if (!G.touch) act('p', 'fireDown'); else M.banner = { text: 'Press FIRE to confirm', col: '#fff', t: 1.4 };
      }
    });
    on(C.cv, 'pointercancel', () => { drag = null; if (scene === 'maker') makerPointer('cancel'); });
    on(C.cv, 'contextmenu', ev => { ev.preventDefault(); if (scene === 'game' && canAct() && M.phase === 'aim') weaponMenu(); });

    // ---- the control bar
    function buildBar() {
      bar.innerHTML = ''; bar.className = 'dg-squigs-bar';
      const B = (html, cls, down, up, title) => { const b = el(html, 'dg-squigs-b' + (cls ? ' ' + cls : ''), 'button'); b.type = 'button'; if (title) b.title = title; on(b, 'pointerdown', ev => { ev.preventDefault(); b.classList.add('on'); down && down(); }); const rel = () => { if (b.classList.contains('on')) { b.classList.remove('on'); up && up(); } }; on(b, 'pointerup', rel); on(b, 'pointerleave', rel); on(b, 'pointercancel', rel); on(b, 'click', ev => { if (ev.detail === 0) { down && down(); up && up(); } }); bar.appendChild(b); return b; };
      const wpn = () => { if (canAct() && M.phase === 'aim') weaponMenu(); };
      if (G.phone || G.touch) {
        bar.classList.add('ph');
        B('◀', '', () => setKey('left', true), () => setKey('left', false), 'Walk left');
        B('▶', '', () => setKey('right', true), () => setKey('right', false), 'Walk right');
        B('▲', '', () => setKey('up', true), () => setKey('up', false), 'Aim up');
        B('▼', '', () => setKey('down', true), () => setKey('down', false), 'Aim down');
        B('JUMP', '', () => act('p', 'jump'), null, 'Jump forwards');
        B('FLIP', '', () => act('p', 'flip'), null, 'Backflip (higher, backwards)');
        bar._wp = B('', 'wp', wpn, null, 'Pick a weapon');
        bar._fuse = B('3s', '', () => act('p', 'fuse'), null, 'Grenade fuse (1-5 seconds)');
        B('&#9776;', 'always', () => { if (scene === 'game') pauseMenu(); }, null, NET ? 'Menu' : 'Pause');
        bar._fire = B('FIRE', 'fire', () => act('p', 'fireDown'), () => act('p', 'fireUp'), 'Hold to power up, let go to fire');
      } else {
        bar._wp = B('', 'wp', wpn, null, 'Pick a weapon (W, Tab or right-click)');
        bar._fuse = B('Fuse: 3s', '', () => act('p', 'fuse'), null, 'Grenade fuse (keys 1-5)');
        B('Skip Go', '', () => { if (canAct() && M.phase === 'aim') act('sk', 1); }, null, 'Do nothing this go');
        B(NET ? 'Menu' : 'Pause', 'always', () => { if (scene === 'game') pauseMenu(); }, null, 'Esc or P');
        B('?', 'always', () => { if (scene === 'game') helpScreen('keys'); }, null, 'Keys (F1)');
        const hint = el('←→ walk &middot; ↑↓ aim (or drag your jack) &middot; hold SPACE to fire &middot; Enter jump &middot; Bksp flip &middot; W weapons', 'hint', 'span'); bar.appendChild(hint);
      }
      syncBar();
    }
    function syncBar() {
      if (!bar._wp) { if (scene !== 'maker') bar.style.display = 'none'; return; }
      const show = scene === 'game' && M && !M.over;
      bar.style.display = show ? '' : 'none';
      if (!show) return;
      bar.classList.toggle('off', !canAct());
      const t = turnTeam(); if (!t) return;
      const am = t.ammo[M.weapon];
      bar._wp.innerHTML = `${icon(M.weapon, 20)}<span>${esc(WPN[M.weapon].n)}${am > 0 ? ' (' + am + ')' : ''}</span>`;
      bar._fuse.textContent = (G.phone || G.touch ? '' : 'Fuse: ') + M.fuse + 's';
      bar._fuse.disabled = !FUSED[M.weapon];
      if (bar._fire) bar._fire.textContent = M.phase === 'retreat' && M.P.some(p => p.kind === 'pet') ? 'BANG!' : 'FIRE';
    }

    // ================================================================ overlays: title, setup, weapons, pause, load/save, end
    function overlay(html, dim) { ovl.innerHTML = html; ovl.style.display = ''; ovl.classList.toggle('dim', !!dim); return ovl; }
    function closeOverlay() { ovl.style.display = 'none'; ovl.innerHTML = ''; }
    const btn = (label, fn, cls, title) => { const b = el(esc(label), 'dg-squigs-b' + (cls ? ' ' + cls : ''), 'button'); b.type = 'button'; if (title) b.title = title; on(b, 'click', () => { sfx('button'); fn(); }); return b; };
    const trained = () => !!G.load('trained', 0);
    function attract() {
      const a = pick(PRESETS), b = pick(PRESETS.filter(x => x !== a));
      mute = true;
      newMatch({ attract: true, teams: [{ name: a.name, cpu: 1, col: PRESETS.indexOf(a), squigs: a.squigs }, { name: b.name, cpu: 1, col: PRESETS.indexOf(b), squigs: b.squigs }], per: 3, theme: 'random', turnTime: 15 });
    }
    // who's after a war on JackNet right now (for the title screen)
    function liveLine() {
      if (!window.MP || !MP.now) return '';
      const me = myId(), seeks = (MP.now.seeks || []).filter(s => s.g === 'squigs.online' && s.id !== me && !s.lost), n = MP.count ? MP.count('squigs.online') : 0;
      if (seeks.length) return `<b>${esc(seeks[0].nick)}</b> ${seeks.length > 1 ? `and ${seeks.length - 1} more are` : 'is'} looking for a war right now!`;
      if (MP.seeking && MP.seeking('squigs.online')) return 'Your name is up in the JackNet lobby. Waiting for a challenger...';
      return n > 1 ? `${n} people are playing online right now` : 'Fight real people over JackNet (2-4 players)';
    }
    function titleScreen() {
      scene = 'title'; syncBar(); mute = true; TR.hide(); MK = null; dropPanel('');
      { const vs = root.querySelector('.dg-squigs-visit'); if (vs) vs.remove(); VISIT = null; }
      if (!M || !M.attract) attract();
      const online = window.MP && !G.demo;
      const o = overlay(`<div class="dg-squigs-logo"><span class="a">JACKS</span><span class="b">ARMAGEDDON</span><span class="c">THE JACKIEST WAR OF 1999${G.demo ? ' &middot; PLAYABLE DEMO' : ''}</span></div>
        <div class="dg-squigs-tmenu"><div class="dg-squigs-big"></div>${online ? '<div class="dg-squigs-live"></div>' : ''}<div class="dg-squigs-small"></div></div>
        <div class="dg-squigs-foot">&copy; 1999 Team Jack. No jacks were harmed. Well, some were. They're fine.</div>`);
      const big = o.querySelector('.dg-squigs-big'), small = o.querySelector('.dg-squigs-small');
      big.append(btn('New Game', () => G.demo ? startDemo() : newGameAsk(), 'big', 'Hot-seat for 2-4 teams, or against the computer (F2)'));
      if (online) big.append(btn('Play Online', playOnline, 'big online', 'Answer somebody who wants a war, or put your name up in the JackNet lobby'));
      const bt = btn('Basic Training', () => TR.start(), trained() ? '' : 'new', 'Sergeant Bellows teaches you everything in two minutes');
      if (!trained()) bt.insertAdjacentHTML('beforeend', '<i class="dg-squigs-stk">START HERE!</i>');
      small.append(bt);
      if (!G.demo) small.append(btn('Island Maker', () => makerOpen(), '', 'Draw your own island, then fight on it (or put it on JackNet)'));
      small.append(btn('Load Game', loadScreen), btn('Options', optionsScreen), btn('How to Play', () => helpScreen('play')), btn('Hall of Fame', hofScreen), btn('Quit', () => G.quit()));
      const lv = o.querySelector('.dg-squigs-live');
      if (lv) { const upd = () => { if (lv.isConnected) lv.innerHTML = liveLine(); }; upd(); titleLive = upd; }
      G.status(G.demo ? `DEMO VERSION - the full game is out ${D.longDate(G.demoUntil)}` : 'Jacks: Armageddon - main menu');
      mute = true; try { if (G.sound) G.music('squigs'); } catch (e) {}
    }
    let titleLive = null;
    if (window.MP && MP.onNow) { const off = MP.onNow(() => { if (scene === 'title' && titleLive) titleLive(); }); G.onClose(() => { try { off(); } catch (e) {} }); }
    function playOnline() {
      if (window.Discs && Discs.playOnline) Discs.playOnline('squigs.online'); else if (window.MP) MP.pick('squigs.online');
      G.timer(() => { if (scene === 'title' && titleLive) titleLive(); }, 1500);
    }
    function startDemo() {
      const a = PRESETS[0], b = PRESETS[1];
      begin({ demo: true, teams: [{ name: a.name, cpu: 0, col: 0, squigs: a.squigs }, { name: b.name, cpu: 1, col: 1, squigs: b.squigs }], per: 3, theme: 'jungle', turnTime: OPT.turn });
    }
    function begin(cfg) {
      closeOverlay(); G.stopMusic(); mute = false; scene = 'game'; asSnap = null; AS.clear(); TR.hide();
      if (!cfg.visit) { const vs = root.querySelector('.dg-squigs-visit'); if (vs) vs.remove(); VISIT = null; }
      newMatch(cfg);
      buildBar();
    }
    // first time on New Game: Sergeant Bellows offers to show you the ropes (once; skipping is remembered too)
    function newGameAsk() {
      if (trained()) return setupScreen();
      const o = overlay(`<div class="dg-squigs-panel" style="max-width:420px"><div class="dg-squigs-sgt">${SARGE}<p><b>SERGEANT BELLOWS:</b> Never fired a bazooka in your LIFE, have you, private? Two minutes of Basic Training and you'll know the lot: walking, jumping, aiming, wind, weapons, crates.</p></div><div class="dg-squigs-btns"></div></div>`, true);
      o.querySelector('.dg-squigs-btns').append(btn('Yes, Sarge!', () => TR.start()), btn('No thanks, start the war', () => { G.save('trained', 'skip'); setupScreen(); }));
    }
    const CPUOPT = [['0', 'Human'], ['easy', 'Computer: Rookie'], ['normal', 'Computer: Regular'], ['hard', 'Computer: Veteran']];
    function setupScreen() {
      scene = 'setup'; syncBar(); TR.hide(); dropPanel('');
      const prev = G.load('setup', null), mine = myIslands();
      const rows = PRESETS.map((p, i) => { const s = prev && prev.teams && prev.teams[i]; const cpu = s ? (s.cpu ? (AIL[s.lvl] ? s.lvl : 'normal') : '0') : (i === 1 || i === 3 ? 'normal' : '0'); return { on: s ? s.on : i < 2, name: s ? s.name : p.name, cpu, col: i, squigs: p.squigs }; });
      const isl = [['random', 'Random island']].concat(Object.keys(THEMES).map(k => [k, THEMES[k].n]), mine.map((m, i) => ['my' + i, 'My island: ' + m.title]));
      const o = overlay(`<div class="dg-squigs-panel"><h3>NEW GAME</h3>${rows.map((r, i) => `<div class="dg-squigs-row" data-i="${i}"><input type="checkbox" class="on" ${r.on ? 'checked' : ''} aria-label="Team ${i + 1} playing"><span class="dg-squigs-sw" style="background:${BODY[i]}"></span><input type="text" class="nm" maxlength="18" value="${esc(r.name)}" aria-label="Team ${i + 1} name"><select class="cpu" aria-label="Who plays team ${i + 1}">${CPUOPT.map(([v, n]) => `<option value="${v}"${r.cpu === v ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')}
        <div class="dg-squigs-row">Jacks per team: <select class="per"><option>3</option><option ${(prev && prev.per) === 4 ? 'selected' : ''}>4</option></select> Island: <select class="th">${isl.map(([v, n]) => `<option value="${esc(v)}" ${(prev && prev.theme) === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <p style="font-size:11px;color:#ccc">Tick 2 to 4 teams. Hot-seat: pass the mouse to your mate when it's their go. Rookie computers miss a lot, Veterans hardly ever. (Dave: NO peeking at Callum's aiming.)</p><div class="dg-squigs-btns"></div></div>`, true);
      const bt = o.querySelector('.dg-squigs-btns');
      bt.append(btn('START!', () => {
        const teams = [...o.querySelectorAll('[data-i]')].map((r, i) => { const c = r.querySelector('.cpu').value; return { on: r.querySelector('.on').checked, name: r.querySelector('.nm').value.trim() || PRESETS[i].name, cpu: c !== '0', lvl: c !== '0' ? c : '', col: i, squigs: PRESETS[i].squigs }; });
        const playing = teams.filter(t => t.on);
        if (playing.length < 2) { G.msg('Jacks: Armageddon', 'You need at least two teams. Jacks won\'t fight themselves. (Mostly.)', 'warn'); return; }
        const per = +o.querySelector('.per').value, th = o.querySelector('.th').value;
        G.save('setup', { teams, per, theme: th });
        const my = /^my\d+$/.test(th) ? mine[+th.slice(2)] : null;
        begin({ teams: playing, per, theme: my ? my.theme : th, island: my || null, turnTime: OPT.turn });
      }, 'big'), btn('Back', titleScreen));
    }
    function weaponMenu() {
      const t = turnTeam();
      const o = overlay(`<div class="dg-squigs-panel"><h3>WEAPONS</h3><div class="dg-squigs-grid">${ORDER.map(k => { const a = t.ammo[k]; return `<button type="button" class="dg-squigs-wi${k === M.weapon ? ' sel' : ''}" data-k="${k}" ${a === 0 ? 'disabled' : ''} title="${esc(WPN[k].d)}">${icon(k, 26)}<span>${esc(WPN[k].n)}</span><small>${a < 0 ? '&infin;' : a === 0 ? 'none' : 'x' + a}</small></button>`; }).join('')}</div><p class="wd" style="margin-top:8px;font-size:11px;color:#ddd;min-height:28px">${esc(WPN[M.weapon].d)}</p><div class="dg-squigs-btns"></div></div>`, true);
      const wd = o.querySelector('.wd');
      o.querySelectorAll('[data-k]').forEach(b => { on(b, 'click', () => { const k = b.dataset.k; act('w', k); sfx('click'); closeOverlay(); syncBar(); }); on(b, 'pointerenter', () => { wd.textContent = WPN[b.dataset.k].d; }); on(b, 'focus', () => { wd.textContent = WPN[b.dataset.k].d; }); });
      o.querySelector('.dg-squigs-btns').append(btn('Close', closeOverlay));
    }
    function pauseMenu() {
      if (NET) { // an online war doesn't stop for anybody's Mom
        const o = overlay(`<div class="dg-squigs-panel" style="max-width:320px;text-align:center"><h3>MENU</h3><p>It's an online war: it keeps going while this is open!</p><div class="dg-squigs-menu" style="margin:0 auto"></div></div>`, true);
        o.querySelector('.dg-squigs-menu').append(btn('Back to the war', closeOverlay), btn('Invite someone to watch', () => { if (window.MP) MP.pick('squigs.online'); }), btn('Keys', () => helpScreen('keys')), btn('How to Play', () => helpScreen('play')), btn('Leave the war', () => G.msg('Jacks: Armageddon', 'Leave this online war? The computer will play your jacks for you.', 'q', [['Leave', () => netLeave()], ['Stay']])));
        return;
      }
      if (M && M.training) {
        const o = overlay(`<div class="dg-squigs-panel" style="max-width:320px;text-align:center"><h3>PAUSED</h3><p>Sergeant Bellows is tapping his watch.</p><div class="dg-squigs-menu" style="margin:0 auto"></div></div>`, true);
        o.querySelector('.dg-squigs-menu').append(btn('Carry on, Sarge', closeOverlay), btn('Keys', () => helpScreen('keys')), btn('Skip the training', () => TR.skip()), btn('Quit to Title', titleScreen));
        return;
      }
      const o = overlay(`<div class="dg-squigs-panel" style="max-width:320px;text-align:center"><h3>PAUSED</h3><p>Mom's calling? Go and see what she wants.</p><div class="dg-squigs-menu" style="margin:0 auto"></div></div>`, true);
      o.querySelector('.dg-squigs-menu').append(btn('Resume', closeOverlay), btn('Save Game', saveScreen), btn('Keys', () => helpScreen('keys')), btn('Quit to Title', titleScreen));
    }
    function serial() {
      return { v: 2, when: (() => { const d = Desk.today99(); return d.d + '/' + d.m + '/99'; })(), seed: M.seed, theme: M.theme, demo: M.demo, turn: M.turn, cur: M.cur, waterY: M.waterY, sudden: M.sudden, turnTime: M.turnTime, island: M.island || null, terra: M.terra || 0, best: M.best,
        carves: M.carves, girders: M.girders, graves: M.graves.map(g => [Math.round(g.x), Math.round(g.y), g.team]), crates: M.crates.filter(c => c.landed).map(c => [c.x, Math.round(c.y), c.health ? 1 : 0, c.wpn]),
        teams: M.teams.map((t, ti) => ({ name: t.name, cpu: t.cpu, lvl: t.lvl, col: t.col, next: ti === M.cur ? (t.next + t.squigs.length - 1) % t.squigs.length : t.next, last: t.last, ammo: t.ammo, stats: t.stats, squigs: t.squigs.map(s => [s.name, Math.round(s.x), Math.round(s.y), s.hp, s.dead ? 1 : 0, s.face]) })) };
    }
    function restore(d) {
      closeOverlay(); G.stopMusic(); mute = false; scene = 'game'; TR.hide();
      FX = []; POPS = []; EX = [];
      const isl = d.island && typeof d.island === 'object' ? d.island : null;
      theme = THEMES[d.theme] ? d.theme : 'jungle'; seedNow = d.seed; genTerrain(d.seed, theme, isl && isl.base === 'flat' ? 'flat' : undefined); if (isl) applyIsland(isl);
      d.carves.forEach(([x, y, r]) => carve(x, y, r, true)); d.girders.forEach(([x, y, a]) => addGirder(x, y, a));
      M = { cfg: { teams: d.teams, theme: d.theme, island: isl }, seed: d.seed, theme, attract: false, demo: !!d.demo, island: isl, turn: d.turn - 1, cur: (d.cur - 1 + d.teams.length) % d.teams.length, wind: 0, waterY: d.waterY, sudden: d.sudden, terra: d.terra || 0, best: d.best && typeof d.best === 'object' ? d.best : { hit: 0, who: '', team: -1 },
        carves: d.carves.slice(), girders: d.girders.slice(), crates: d.crates.map(([x, y, h, w]) => ({ x, y, vy: 0, landed: true, para0: true, health: !!h, wpn: w, gone: false })), graves: d.graves.map(([x, y, team]) => ({ x, y, vx: 0, vy: 0, team })), P: [], phase: 'aim', timer: 0, retreat: 0, power: 0, charging: false,
        weapon: 'bazooka', fuse: 3, shots: 1, target: null, banner: null, sq: null, hurtSelf: false, endWait: 0, ai: null, over: false, turnTime: d.turnTime || OPT.turn };
      M.teams = d.teams.map(t => ({ name: t.name, cpu: t.cpu, lvl: AIL[t.lvl] ? t.lvl : 'normal', col: t.col, next: t.next, last: WPN[t.last] ? t.last : 'bazooka', ammo: Object.assign(Object.fromEntries(ORDER.map(k => [k, WPN[k].ammo])), t.ammo), stats: Object.assign({ dmg: 0, kills: 0, self: 0, drown: 0 }, t.stats), squigs: t.squigs.map(([name, x, y, hp, dead, face]) => ({ name, team: d.teams.indexOf(t), x, y, vx: 0, vy: 0, hp, dead: !!dead, air: true, face: face || 1, aim: 0.35, bubble: null, step: 0, blink: 0, last: -1 })) }));
      M.teams.forEach((t, ti) => t.squigs.forEach(s => { s.team = ti; }));
      M.cfg.teams = M.teams.map(t => ({ name: t.name, cpu: t.cpu, lvl: t.lvl, col: t.col, squigs: t.squigs.map(s => s.name) }));
      M.totalHp = M.teams.map(t => t.squigs.length * 100);
      buildBar(); startTurn();
    }
    function slotInfo(d) { return d ? `${esc(d.teams.map(t => t.name).join(' v '))} &middot; turn ${d.turn} &middot; ${esc(d.island && d.island.title ? d.island.title : THEMES[d.theme] ? THEMES[d.theme].n : '')} &middot; saved ${esc(d.when)}` : '<i>empty</i>'; }
    function loadScreen() {
      if (G.demo) { G.msg('Jacks: Armageddon (Demo)', 'Loading and saving games is only in the full version.\n\nIn the shops from ' + D.longDate(G.demoUntil) + '!', 'info'); return; }
      const slots = [['auto', 'Autosave'], ['s1', 'Slot 1'], ['s2', 'Slot 2'], ['s3', 'Slot 3']].map(([k, n]) => [k, n, G.load(k, null)]);
      const back = scene === 'game' ? closeOverlay : titleScreen;
      const o = overlay(`<div class="dg-squigs-panel"><h3>LOAD GAME</h3><div class="dg-squigs-menu" style="min-width:0"></div><div class="dg-squigs-btns"></div></div>`, true);
      const m = o.querySelector('.dg-squigs-menu');
      slots.forEach(([k, n, d]) => { const b = btn('', () => { if (d) restore(d); }); b.innerHTML = `<span class="dg-squigs-slot"><b>${n}</b><span style="font:11px Arial;color:#ddd">${slotInfo(d)}</span></span>`; b.disabled = !d; m.appendChild(b); });
      o.querySelector('.dg-squigs-btns').append(btn('Back', back));
    }
    function saveScreen() {
      if (G.demo || M.demo) { G.msg('Jacks: Armageddon (Demo)', 'Saving is only in the full version. Sorry!', 'info'); return; }
      if (M.phase !== 'aim' || M.P.length) { G.msg('Save Game', 'Wait for the dust to settle! You can save at the start of a go.', 'info'); return; }
      const o = overlay(`<div class="dg-squigs-panel"><h3>SAVE GAME</h3><div class="dg-squigs-menu" style="min-width:0"></div><div class="dg-squigs-btns"></div></div>`, true);
      const m = o.querySelector('.dg-squigs-menu');
      ['s1', 's2', 's3'].forEach((k, i) => { const d = G.load(k, null); const b = btn('', () => { G.save(k, serial()); G.toast('Jacks: Armageddon', 'Game saved to slot ' + (i + 1) + '.', 2500); closeOverlay(); }); b.innerHTML = `<span class="dg-squigs-slot"><b>Slot ${i + 1}</b><span style="font:11px Arial;color:#ddd">${slotInfo(d)}</span></span>`; m.appendChild(b); });
      o.querySelector('.dg-squigs-btns').append(btn('Cancel', closeOverlay));
    }
    function optionsScreen() {
      const o = overlay(`<div class="dg-squigs-panel" style="max-width:380px"><h3>OPTIONS</h3><div class="dg-squigs-row">Turn time: <select class="tt">${[30, 45, 60, 90].map(v => `<option ${OPT.turn === v ? 'selected' : ''}>${v}</option>`).join('')}</select> seconds</div><div class="dg-squigs-row"><label><input type="checkbox" class="bb" ${OPT.bubbles ? 'checked' : ''}> Jack speech bubbles</label></div><div class="dg-squigs-row"><label><input type="checkbox" class="sn" ${G.sound ? 'checked' : ''}> Sound effects &amp; music</label></div><div class="dg-squigs-row"><label><input type="checkbox" class="tr" ${trained() ? '' : 'checked'}> Offer Basic Training on New Game</label></div><p style="font-size:11px;color:#ccc">Detail level: MAXIMUM (it's 1999, your PC can take it).</p><div class="dg-squigs-btns"></div></div>`, true);
      o.querySelector('.dg-squigs-btns').append(btn('OK', () => { OPT.turn = +o.querySelector('.tt').value; OPT.bubbles = o.querySelector('.bb').checked; G.save('opt', OPT); G.save('trained', o.querySelector('.tr').checked ? 0 : (G.load('trained', 0) || 'skip')); try { Sound.on = o.querySelector('.sn').checked; } catch (e) {} if (scene === 'game') closeOverlay(); else titleScreen(); }));
    }
    const HELP = {
      play: `HOW TO PLAY\n\nEach team takes it in turns. On your go, you control ONE jack. Walk, jump, pick a weapon, aim and fire before the clock runs out. Then you get a few seconds to RUN.\n\nThe last team with any jacks left wins. Jacks that fall in the water are OUT.\n\nThe box at the bottom left is your clock. The top of the screen says whose go it is. The WIND box (bottom right) shows which way the wind blows and how hard.\n\nTIPS\n- Wind blows the bazooka (and air strikes). Grenades don't care. Bounce them round corners.\n- Health crates: +25. Weapon crates: a surprise.\n- The Homing Missile needs a target first: click the map, then fire it roughly that way.\n- The Cyber Pet waddles off on its own. Press fire again to make it go bang.\n- After 7 rounds it's SUDDEN DEATH: the water rises every go.\n- Never played? Sergeant Bellows' Basic Training (title screen) shows you everything.\n- Callum says the Holy Hand Jack is "well overpowered". Callum is right.`,
      keys: `KEYS\n\n  Left / Right (or A / D) .. walk\n  Up / Down ................ aim\n  SPACE .................... hold to power up, let go to fire\n                             (and to set off a Cyber Pet early)\n  Enter .................... jump forwards\n  Backspace ................ backflip (higher, but backwards)\n  W or Tab ................. weapons (or right-click the map)\n  1 - 5 .................... grenade fuse in seconds\n  C or Home ................ camera back to your jack\n  Esc or P ................. pause\n  F1 ....................... this list\n  F2 ....................... new game\n\nMOUSE\n  Drag your jack (or the red crosshair) to aim.\n  Drag anywhere else to look around the island.\n  Click the map to pick a spot for Air Strike, Girder, Teleport\n  and the Homing Missile.\n  The buttons along the bottom do everything too: hold FIRE to\n  power up, let go to fire.`,
      weapons: ORDER.map(k => `${WPN[k].n.toUpperCase()}${WPN[k].ammo > 0 ? `  (${WPN[k].ammo} each)` : ''}\n  ${WPN[k].d}`).join('\n\n'),
    };
    function helpScreen(k) {
      const back = scene === 'game' ? closeOverlay : scene === 'lobby' ? () => netLobby() : scene === 'maker' ? closeOverlay : titleScreen;
      const T = { play: 'HOW TO PLAY', keys: 'KEYS', weapons: 'WEAPONS GUIDE' };
      const o = overlay(`<div class="dg-squigs-panel"><h3>${T[k]}</h3><div class="txt${k === 'keys' ? ' mono' : ''}">${esc(HELP[k])}</div><div class="dg-squigs-btns"></div></div>`, true);
      const bt = o.querySelector('.dg-squigs-btns');
      Object.keys(T).filter(x => x !== k).forEach(x => bt.append(btn(T[x].replace('HOW TO PLAY', 'How to Play').replace('KEYS', 'Keys').replace('WEAPONS GUIDE', 'Weapons'), () => helpScreen(x))));
      bt.append(btn('OK', back));
    }
    function hofScreen() {
      const hof = G.load('hof', {}), rows = Object.entries(hof).sort((a, b) => b[1] - a[1]).slice(0, 10), rec = G.load('rec', {});
      const o = overlay(`<div class="dg-squigs-panel" style="max-width:400px"><h3>HALL OF FAME</h3><table class="dg-squigs-tab"><tr><th>Team</th><th>Wins</th></tr>${rows.length ? rows.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${v}</td></tr>`).join('') : '<tr><td colspan="2"><i>Nobody yet. Callum claims he won 400 times "at his house".</i></td></tr>'}</table>
        ${rec.hit ? `<p style="margin-top:8px">Biggest single hit: <b>${rec.hit}</b> by ${esc(rec.who || '?')} (${esc(rec.team || '')})</p>` : ''}${rec.vet ? `<p>Wins against Veteran computers: <b>${rec.vet}</b></p>` : ''}<div class="dg-squigs-btns"></div></div>`, true);
      o.querySelector('.dg-squigs-btns').append(btn('Back', titleScreen));
    }
    const rupees = n => (window.Econ && Econ.rupees ? Econ.rupees(n, true) : `${n.toLocaleString('en-GB')} Rupees`);
    function endScreen(winner, why) {
      scene = 'end'; syncBar();
      const real = M.teams.filter(t => !t.dummy);
      const rows = real.map(t => `<tr><td style="color:${LABEL[t.col]}">${esc(t.name)}${t.cpu ? ' <small>(computer)</small>' : ''}</td><td>${t.stats.dmg}</td><td>${t.stats.kills}</td><td>${liveSquigs(t).length}</td></tr>`).join('');
      const title = why === 'time' ? 'TIME UP!' : winner ? `${esc(winner.name).toUpperCase()} ${NET ? 'WINS' : 'WIN'}!` : 'IT\'S A DRAW!';
      const top = (f, min) => { const b = real.slice().sort((a, b2) => f(b2) - f(a))[0]; return b && f(b) >= (min || 1) ? b : null; };
      const aw = [];
      const md = top(t => t.stats.dmg); if (md) aw.push(['Most damage', `${esc(md.name)} (${md.stats.dmg})`]);
      if (M.best && M.best.hit) aw.push(['Biggest hit', `${M.best.hit} by ${esc(M.best.who)}`]);
      const dr = top(t => t.stats.drown); if (dr) aw.push(['Splashdowns', `${esc(dr.name)} (${dr.stats.drown} in the drink)`]);
      const og = top(t => t.stats.self, 10); if (og) aw.push(['Own goal award', `${esc(og.name)} (${og.stats.self} on themselves)`]);
      aw.push(['Mom\'s repair bill', rupees(Math.max(5, Math.round((M.terra || 0) / 5) * 5))]);
      const o = overlay(`<div class="dg-squigs-win">${title}</div><div class="dg-squigs-panel" style="max-width:440px"><table class="dg-squigs-tab"><tr><th>Team</th><th>Damage</th><th>K.O.s</th><th>Left</th></tr>${rows}</table><div class="dg-squigs-aw">${aw.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div><div class="dg-squigs-btns"></div></div>`, true);
      const bt = o.querySelector('.dg-squigs-btns');
      if (NET) netEndButtons(bt);
      else if (M.demo) bt.append(btn('Continue', () => { closeOverlay(); G.demoEnd('The full version has hot-seat for up to 4 teams, four islands (including Mom\'s kitchen and the inside of a PC!), 14 weapons including the legendary BANANAAAGH! Bomb and the Holy Hand Jack, Basic Training, the Island Maker and saving.'); }));
      else bt.append(btn('Rematch', () => begin(Object.assign({}, M.cfg, { seed: 0 })), 'big'), btn('Main Menu', titleScreen));
      // records
      if (!NET && M.best && M.best.hit) { const rec = G.load('rec', {}); if (M.best.hit > (rec.hit || 0)) { rec.hit = M.best.hit; rec.who = M.best.who; rec.team = M.teams[M.best.team] ? M.teams[M.best.team].name : ''; G.save('rec', rec); } }
      if (!NET && winner && !winner.cpu && M.teams.some(t => t.cpu && t.lvl === 'hard')) { const rec = G.load('rec', {}); rec.vet = (rec.vet || 0) + 1; G.save('rec', rec); }
    }

    // ================================================================ Basic Training with Sergeant Bellows
    // A little assault course: one jack, two straw dummies, a flag, a ledge and a wall. No clock. Each lesson waits for
    // you to do the thing, the Sarge shouts, you do the next thing. Skippable any time; passing (or skipping) is remembered.
    const SARGE = '<svg class="dg-squigs-sargepic" viewBox="0 0 32 32" width="52" height="52" shape-rendering="crispEdges" aria-hidden="true"><rect width="32" height="32" fill="#5a7a9a"/><rect y="24" width="32" height="8" fill="#3a5a7a"/><rect x="5" y="22" width="22" height="10" fill="#4a5a2a"/><rect x="13" y="21" width="6" height="3" fill="#d8a078"/><rect x="9" y="9" width="14" height="13" fill="#e8b088"/><rect x="8" y="12" width="1" height="4" fill="#d8a078"/><rect x="23" y="12" width="1" height="4" fill="#d8a078"/><rect x="8" y="4" width="16" height="6" fill="#3a5a2a"/><rect x="7" y="9" width="18" height="2" fill="#2a4218"/><rect x="11" y="5" width="3" height="2" fill="#5a7a3a"/><rect x="10" y="12" width="4" height="1" fill="#3a2010"/><rect x="18" y="12" width="4" height="1" fill="#3a2010"/><rect x="13" y="11" width="1" height="1" fill="#3a2010"/><rect x="18" y="11" width="1" height="1" fill="#3a2010"/><rect x="11" y="14" width="2" height="2" fill="#000"/><rect x="19" y="14" width="2" height="2" fill="#000"/><rect x="15" y="14" width="2" height="4" fill="#c98a5e"/><rect x="10" y="18" width="12" height="2" fill="#6a4020"/><rect x="9" y="19" width="2" height="2" fill="#6a4020"/><rect x="21" y="19" width="2" height="2" fill="#6a4020"/><rect x="13" y="20" width="6" height="2" fill="#7a0000"/><rect x="14" y="20" width="4" height="1" fill="#fff"/><rect x="7" y="25" width="4" height="1" fill="#ffd040"/><rect x="8" y="26" width="2" height="1" fill="#ffd040"/><rect x="7" y="27" width="4" height="1" fill="#ffd040"/><rect x="8" y="28" width="2" height="1" fill="#ffd040"/><rect x="21" y="25" width="4" height="3" fill="#c0c0c0"/></svg>';
    const tk = (keys, btns) => (G.phone || G.touch ? btns : keys);
    const TR = { on: false, step: -1, wind: 0, flag: null, el: null };
    const PRAISE = ['GOOD!', 'NOT BAD!', 'OUTSTANDING!', 'TEXTBOOK!', 'SPOT ON!', 'LOVELY!'];
    const MISS = ['MISSED! My nan shoots better than that, and she\'s 94. AGAIN!', 'Were you aiming at the SEA, private? Again!', 'That dummy is laughing at you. I can HEAR it. Again!', 'Close, but close only counts in horseshoes. AGAIN!', 'Think about the power, private! Hold it longer, or shorter. Again!'];
    const meJ = () => M && M.teams[0] && M.teams[0].squigs[0];
    const groundAt = x => { x = clamp(Math.round(x), 0, W - 1); let y = 0; while (y < H && !MASK[y * W + x]) y++; return y - 1; };
    const TSTEPS = [
      { say: () => 'TEN-HUT! Welcome to Basic Training, private! I\'m Sergeant Bellows, and I\'ve been blowing up islands since 1987. One jack, eight lessons, no crying. Click NEXT when you\'re ready.', next: 1 },
      { say: () => `LESSON 1: WALKING. March to the red flag! ${tk('Use the ← and → keys (or A and D).', 'Hold the ◀ and ▶ buttons.')} Left, right, left, right!`, done: s => Math.abs(s.x - TR.flag.x) < 10 && !s.air },
      { say: () => `LESSON 2: JUMPING. Jacks can't climb walls, but they CAN jump. Get up on that ledge! ${tk('ENTER jumps forwards. BACKSPACE does a backflip: higher, but backwards.', 'JUMP jumps forwards. FLIP does a backflip: higher, but backwards.')}`, done: s => !s.air && s.x >= 362 && s.x <= 468 && s.y <= 411 },
      { say: () => `LESSON 3: AIMING. ${tk('↑ and ↓ move the red crosshair (or drag your jack with the mouse).', 'Hold ▲ and ▼ to move the red crosshair (or drag your jack).')} Point it at the sky. HIGHER, private! HIGHER!`, done: s => s.aim > 1.0 },
      { say: () => `LESSON 4: FIRING. Bazooka time! Aim at a dummy, then ${tk('HOLD SPACE', 'HOLD the FIRE button')} to power up and LET GO to fire. The longer you hold, the further it goes. Hit a dummy!`, done: () => !!M.dummyHit, shoot: 1, weapon: 'bazooka' },
      { say: () => 'LESSON 5: WIND. The wind\'s got up! See the WIND box, bottom right? Bazookas get blown about, so allow for it. Grenades don\'t care about wind. Hit a dummy again!', wind: -0.7, done: () => !!M.dummyHit, shoot: 1 },
      { say: () => `LESSON 6: WEAPONS. Open your weapons box: ${tk('press W or TAB (or right-click the map, or click the weapon button at the bottom)', 'click the weapon button at the bottom')}. Pick the GRENADE.`, done: () => M.weapon === 'grenade' },
      { say: () => `LESSON 7: GRENADES. They bounce, and go bang when the fuse runs out. ${tk('Keys 1 to 5 set the fuse.', 'The 3s button sets the fuse.')} Lob one over the wall onto the dummy hiding behind it!`, done: () => !!(M.dummyHit && (FUSED[M.dummyHit.w] || M.dummyHit.w === 'holy')), shoot: 1 },
      { say: () => 'LESSON 8: CRATES. Supplies drop in from the sky! Health crates give +25, weapon crates give you something nasty. Walk into that crate to grab it!', start: () => { const s = meJ(); let x = clamp(s.x + s.face * 70, 120, 1150); if (x > 740 && x < 800) x = 720; M.crates.push({ x, y: Math.max(20, groundAt(x) - 170), vy: 0, landed: false, health: false, wpn: 'banana', gone: false }); }, done: () => !!M.crateGot },
      { say: () => 'Well I NEVER. You are NOT completely useless. You have PASSED Basic Training, private! You even got a banana. Now get out there and make your Mom proud. DISMISSED!', end: 1 },
    ];
    TR.start = () => {
      begin({ training: true, teams: [{ name: 'Recruits', col: 0, squigs: ['Private Jack'] }, { name: 'Dummies', dummy: true, col: 3, squigs: ['Dummy A', 'Dummy B'] }], per: 1, turnTime: 999 });
      TR.on = true; TR.step = -1; TR.wind = 0; TR.misses = 0;
      const me = meJ(), [a, b] = M.teams[1].squigs;
      me.x = 150; me.y = groundAt(150); me.face = 1;
      a.x = 1050; a.y = groundAt(1050); b.x = 830; b.y = groundAt(830); a.face = b.face = -1;
      [me, a, b].forEach(s => { s.air = false; });
      TR.home = [[a.x, a.y], [b.x, b.y]];
      TR.flag = { x: 290, y: groundAt(290) + 1 };
      M.endWait = 0.2;
      cam.x = 0; cam.y = clamp(300 - VH / 2, -120, H - VH);
      G.status('Basic Training with Sergeant Bellows');
      TR.panel(); TR.go(0);
    };
    TR.panel = () => {
      TR.hide(true);
      TR.el = el(`<div class="pic">${SARGE}</div><div class="bd"><div class="hd"><b>SGT. BELLOWS</b><span class="pips"></span></div><div class="tx"></div><div class="bt"></div></div>`, 'dg-squigs-sarge');
      viewEl.appendChild(TR.el);
    };
    TR.hide = keepOn => { if (TR.el) { TR.el.remove(); TR.el = null; } if (!keepOn) TR.on = false; };
    TR.say = text => { TR.txt = text; TR.shown = 0; TR.blip = 0; if (TR.el) TR.el.querySelector('.tx').textContent = ''; };
    TR.go = i => {
      const st = TSTEPS[i]; if (!st || !M || !M.training) return;
      TR.step = i; TR.ok = false; TR.t = 0; M.dummyHit = null; M.crateGot = 0; M.lastFired = '';
      if (st.wind != null) TR.wind = st.wind; else if (i === 0) TR.wind = 0;
      M.wind = TR.wind;
      if (st.weapon && M.weapon !== st.weapon && turnTeam()) { M.weapon = st.weapon; syncBar(); }
      if (st.start) st.start();
      TR.say(st.say());
      if (!TR.el) TR.panel();
      TR.el.querySelector('.pips').innerHTML = TSTEPS.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'now' : ''}"></i>`).join('');
      const bt = TR.el.querySelector('.bt'); bt.innerHTML = '';
      if (st.end) {
        G.save('trained', 1); G.secret('squigs.training'); sfx('solve');
        [262, 330, 392, 523].forEach((f, k) => G.timer(() => note(f, 0.25, 'square'), k * 140));
        bt.append(btn('Start a war!', () => { TR.hide(); setupScreen(); }, 'go'), btn('Title screen', titleScreen));
      } else {
        if (st.next != null) bt.append(btn('NEXT ▶', () => TR.go(st.next), 'go'));
        TR.skipBit = btn('Skip this bit', () => TR.go(i + 1)); TR.skipBit.style.display = 'none';
        bt.append(TR.skipBit, btn('Skip training', () => TR.skip()));
      }
    };
    TR.skip = () => { G.save('trained', G.load('trained', 0) || 'skip'); TR.hide(); titleScreen(); G.toast('Basic Training', 'Training skipped. It\'s on the title screen whenever you want it.', 3000); };
    TR.tick = dt => {
      if (!TR.on || !M || !M.training) return;
      const st = TSTEPS[TR.step]; if (!st) return;
      // the Sarge talks (one letter at a time, like every 1999 game)
      if (TR.el && TR.shown < TR.txt.length) {
        TR.shown = Math.min(TR.txt.length, TR.shown + dt * 70);
        TR.el.querySelector('.tx').textContent = TR.txt.slice(0, Math.ceil(TR.shown));
        TR.blip += dt; if (TR.blip > 0.07) { TR.blip = 0; note(160 + Math.random() * 60, 0.03, 'square'); }
      }
      TR.t += dt;
      if (TR.skipBit && TR.t > 30 && st.done) TR.skipBit.style.display = '';
      const me = meJ();
      if (st.done && !TR.ok && me && !me.dead && st.done(me)) {
        TR.ok = true;
        POPS.push({ x: me.x, y: me.y - 48, text: pick(PRAISE), col: '#7aff7a', t: 0, big: 1 });
        [523, 659, 784].forEach((f, k) => G.timer(() => note(f, 0.12, 'square'), k * 90));
        const at = TR.step; G.timer(() => { if (M && M.training && TR.step === at) TR.go(at + 1); }, 1300);
      }
    };
    // the end of every go in training: back on your feet, dummies back on their poles, and a telling-off if you missed
    TR.boundary = () => {
      const me = meJ(), st = TSTEPS[TR.step] || {};
      if (me.dead) {
        Object.assign(me, { dead: false, drowned: false, dying: false, hp: 100, air: false, vx: 0, vy: 0, x: TR.step >= 3 ? 420 : 150 });
        me.y = groundAt(me.x); M.graves = M.graves.filter(g => g.team !== 0); say(me, 'Back on your feet, private!');
      }
      me.hp = 100;
      M.teams[1].squigs.forEach((d, i) => { if (d.dead || Math.abs(d.x - TR.home[i][0]) > 4) { Object.assign(d, { dead: false, drowned: false, dying: false, hp: 100, air: false, vx: 0, vy: 0, x: TR.home[i][0] }); d.y = groundAt(d.x); } d.hp = 100; });
      if (st.shoot && !TR.ok && M.lastFired) { TR.misses++; TR.say(pick(MISS)); }
    };

    // ================================================================ the Island Maker (+ sharing islands on the JackNet Showcase)
    const MAXOPS = 2500, SIZES = [8, 16, 28];
    let MK = null;
    const myIslands = () => { const l = G.load('islands', []); return Array.isArray(l) ? l.filter(x => x && Array.isArray(x.ops) && THEMES[x.theme]) : []; };
    const islandData = () => ({ v: 1, title: MK.title || 'My Island', seed: MK.seed >>> 0, theme: MK.theme, base: MK.base, ops: MK.ops.map(o => o.map(n => Math.round(n))) });
    function makerOpen(start) {
      TR.hide(); scene = 'maker'; G.stopMusic(); mute = false;
      if (start) MK = Object.assign({ undo: [], tool: 'land', size: 2, dirty: false, idx: -1, title: '' }, start, { ops: (start.ops || []).map(o => o.slice()) });
      if (!MK) { makerMenu(); return; }
      mkRebuild(); closeOverlay(); buildMakerBar();
      G.status(`Island Maker · ${MK.title || 'untitled island'} · ${THEMES[MK.theme].n}`);
    }
    function makerMenu() {
      scene = 'maker'; M = null; buildMakerBar();
      if (!MK) { MK = { seed: (Math.random() * 1e9) >>> 0, theme: 'jungle', base: 'gen', ops: [], undo: [], tool: 'land', size: 2, dirty: false, idx: -1, title: '' }; mkRebuild(); }
      const mine = myIslands();
      const o = overlay(`<div class="dg-squigs-panel" style="max-width:420px"><h3>ISLAND MAKER</h3><p>Draw your own island with the land brush, dig caves, bolt on girders, then fight on it. Save up to 5. Members can put one on JackNet for everybody to visit and rate.</p><div class="dg-squigs-menu" style="min-width:0"></div>${mine.length ? '<p style="margin-top:8px"><b>My islands</b></p><div class="dg-squigs-menu mine" style="min-width:0"></div>' : ''}<div class="dg-squigs-btns"></div></div>`, true);
      const m = o.querySelector('.dg-squigs-menu');
      m.append(btn('Start from a random island', () => makerOpen({ seed: (Math.random() * 1e9) >>> 0, theme: pick(Object.keys(THEMES)), base: 'gen', ops: [] })), btn('Start from a flat sea', () => makerOpen({ seed: (Math.random() * 1e9) >>> 0, theme: MK.theme || 'jungle', base: 'flat', ops: [] })));
      if (MK.ops.length || MK.dirty) m.append(btn('Carry on with this one', () => makerOpen()));
      const mm = o.querySelector('.mine');
      if (mm) mine.forEach((isl, i) => { const b = btn('', () => makerOpen(Object.assign({}, isl, { idx: i }))); b.innerHTML = `<span class="dg-squigs-slot"><b>${esc(isl.title)}</b><span style="font:11px Arial;color:#ddd">${esc(THEMES[isl.theme].n)} &middot; ${isl.ops.length} strokes</span></span>`; mm.appendChild(b); });
      o.querySelector('.dg-squigs-btns').append(btn('Islands on JackNet', showIslands), btn('Back', () => { MK = null; titleScreen(); }));
      G.status('Island Maker');
    }
    function mkRebuild() { theme = MK.theme; seedNow = MK.seed >>> 0; genTerrain(seedNow, MK.theme, MK.base === 'flat' ? 'flat' : undefined); applyIsland(MK); }
    function buildMakerBar() {
      bar.innerHTML = ''; bar._wp = null; bar.style.display = scene === 'maker' && MK ? '' : 'none'; bar.className = 'dg-squigs-bar mk';
      if (!MK) return;
      const B = (label, fn, cls, title) => { const b = btn(label, fn, cls, title); bar.appendChild(b); return b; };
      const tool = (k, label, title) => { const b = B(label, () => { MK.tool = k; buildMakerBar(); }, MK.tool === k ? 'on' : '', title); return b; };
      tool('land', 'Land', 'Paint new land (key 1)'); tool('dig', 'Dig', 'Dig holes and caves (key 2)'); tool('girder', 'Girder', 'Drag to bolt on a steel girder (key 3)');
      B(`Brush: ${'SML'[MK.size]}`, () => { MK.size = (MK.size + 1) % 3; buildMakerBar(); }, '', 'Brush size ([ and ])');
      B('Undo', mkUndo, '', 'Undo the last stroke (Ctrl+Z)');
      B(THEMES[MK.theme].n.replace('Inside Jack\'s PC', 'PC').replace('Mom\'s Kitchen', 'Kitchen').replace('Jungle Island', 'Jungle'), () => { const ks = Object.keys(THEMES); MK.theme = ks[(ks.indexOf(MK.theme) + 1) % ks.length]; mkRebuild(); MK.dirty = true; buildMakerBar(); }, '', 'Change the look');
      B('Save', mkSave, '', 'Save it in My Islands');
      B('Fight on it!', mkPlay, 'go', 'You against the computer on this island');
      B('JackNet', showIslands, '', 'Islands on JackNet: visit, rate, upload yours');
      B('Menu', () => { if (MK.dirty && MK.ops.length) G.msg('Island Maker', 'Leave without saving this island?', 'q', [['Save it', () => mkSave(makerMenu)], ['Don\'t save', () => { MK.dirty = false; makerMenu(); }], ['Cancel']]); else makerMenu(); }, '', 'New, open, or back to the title');
    }
    function mkUndo() { if (!MK || !MK.undo.length) return; MK.ops.length = MK.undo.pop(); mkRebuild(); MK.dirty = true; sfx('click'); }
    function mkLand() { // is there enough dry land to stand on?
      let n = 0; for (let x = 0; x < W; x += 4) { let y = 0; while (y < H && !MASK[y * W + x]) y++; if (y > 40 && y < WATER0 - 16) n++; }
      return n >= 40;
    }
    function mkSave(then) {
      if (!MK) return;
      if (!mkLand()) { G.msg('Island Maker', 'There isn\'t enough dry land to stand on! Paint some more land first.', 'info'); return; }
      Desk.ask('Island Maker', 'What\'s this island called?', MK.title || 'Jack Island', 24, name => {
        if (name == null) return;
        MK.title = nclean(name, 24) || 'My Island';
        const l = myIslands(), d = islandData();
        if (MK.idx >= 0 && MK.idx < l.length) l[MK.idx] = d; else { if (l.length >= 5) l.shift(); l.push(d); MK.idx = l.length - 1; }
        G.save('islands', l); MK.dirty = false; sfx('solve');
        G.toast('Island Maker', `"${MK.title}" saved. Pick it on the New Game screen!`, 3000);
        G.status(`Island Maker · ${MK.title} · ${THEMES[MK.theme].n}`);
        if (typeof then === 'function') then();
      });
    }
    function mkPlay() {
      if (!mkLand()) { G.msg('Island Maker', 'There isn\'t enough dry land to stand on! Paint some more land first.', 'info'); return; }
      const isl = islandData(); isl.title = MK.title || 'Your island';
      begin({ teams: [{ name: PRESETS[0].name, cpu: 0, col: 0, squigs: PRESETS[0].squigs }, { name: PRESETS[1].name, cpu: 1, lvl: 'normal', col: 1, squigs: PRESETS[1].squigs }], per: 3, theme: isl.theme, island: isl, turnTime: OPT.turn, fromMaker: 1 });
    }
    // drawing on the map: the whole island, shrunk to fit
    const mkScale = () => Math.min(VW / W, (VH - 20) / H), mkOff = () => [Math.round((VW - W * mkScale()) / 2), Math.round((VH - H * mkScale()) / 2)];
    const mkWorld = ev => { const p = C.local(ev), s = mkScale(), [ox, oy] = mkOff(); return { x: (p.x - ox) / s, y: (p.y - oy) / s }; };
    let mkDrag = null, mkHover = null;
    function makerPointer(kind, ev) {
      if (!MK || ovl.style.display !== 'none') return;
      if (kind === 'cancel') { mkDrag = null; return; }
      const p = mkWorld(ev); mkHover = p;
      const r = SIZES[MK.size];
      if (kind === 'down') {
        if (ev.button === 2) return;
        try { C.cv.setPointerCapture(ev.pointerId); } catch (e) {}
        mkDrag = { x: p.x, y: p.y, n: MK.ops.length };
        if (MK.tool !== 'girder') mkDab(p, r, true);
        return;
      }
      if (!mkDrag) return;
      if (kind === 'move') { // a dab every little way along the line, so a fast drag still makes a solid stroke
        if (MK.tool === 'girder') return;
        const d = Math.hypot(p.x - mkDrag.x, p.y - mkDrag.y), step = Math.max(2, r * 0.45);
        if (d >= step) { const n = Math.ceil(d / step); for (let i = 1; i <= n; i++) mkDab({ x: mkDrag.x + (p.x - mkDrag.x) * i / n, y: mkDrag.y + (p.y - mkDrag.y) * i / n }, r); mkDrag.x = p.x; mkDrag.y = p.y; }
        return;
      }
      if (kind === 'up') {
        if (MK.tool === 'girder') { const dx = p.x - mkDrag.x, dy = p.y - mkDrag.y, a = Math.hypot(dx, dy) > 8 ? clamp(dx >= 0 ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx), -0.8, 0.8) : 0; if (MK.ops.length < MAXOPS) { const o = [Math.round((mkDrag.x + p.x) / 2), Math.round((mkDrag.y + p.y) / 2), Math.round(a * 1000), 1]; MK.ops.push(o); addGirder(o[0], o[1], o[2] / 1000); sfx('thud'); } }
        if (MK.ops.length > mkDrag.n) { MK.undo.push(mkDrag.n); if (MK.undo.length > 60) MK.undo.shift(); MK.dirty = true; }
        mkDrag = null;
      }
    }
    function mkDab(p, r, first) {
      if (MK.ops.length >= MAXOPS) { if (first) G.msg('Island Maker', 'That island is full up! (2,500 brush strokes.) Save it, or undo a bit.', 'info'); return; }
      const x = clamp(Math.round(p.x), 0, W - 1), y = clamp(Math.round(p.y), 0, H - 1);
      if (MK.tool === 'land') { MK.ops.push([x, y, r, 2]); addLand(x, y, r); } else { MK.ops.push([x, y, r, 0]); carve(x, y, r, false); }
    }
    function makerKey(ev) {
      const k = ev.key;
      if (k === 'Escape') { ev.preventDefault(); if (ovl.style.display !== 'none') { if (MK && (MK.ops.length || MK.dirty)) closeOverlay(); } else makerMenu(); return; }
      if (ovl.style.display !== 'none') return;
      if ((ev.ctrlKey || ev.metaKey) && (k === 'z' || k === 'Z')) { ev.preventDefault(); mkUndo(); return; }
      if (k === '1' || k === '2' || k === '3') { MK.tool = ['land', 'dig', 'girder'][+k - 1]; buildMakerBar(); return; }
      if (k === '[') { MK.size = Math.max(0, MK.size - 1); buildMakerBar(); return; }
      if (k === ']') { MK.size = Math.min(2, MK.size + 1); buildMakerBar(); }
    }
    function drawMaker() {
      const s = mkScale(), [ox, oy] = mkOff();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
      if (BG) ctx.drawImage(BG, 0, 0, BG.width, VH, ox, oy, W * s, H * s);
      if (TC) ctx.drawImage(TC, 0, 0, W, H, ox, oy, W * s, H * s);
      const wc = THEMES[MK ? MK.theme : theme].water, wy = oy + WATER0 * s;
      ctx.globalAlpha = 0.8; ctx.fillStyle = wc[1]; ctx.fillRect(ox, wy, W * s, H * s - WATER0 * s); ctx.globalAlpha = 1; ctx.fillStyle = wc[2]; ctx.fillRect(ox, wy, W * s, 1);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, oy + 0.5, W * s - 1, H * s - 1);
      if (MK && mkHover && ovl.style.display === 'none') {
        const r = MK.tool === 'girder' ? 4 : SIZES[MK.size], hx = ox + mkHover.x * s, hy = oy + mkHover.y * s;
        ctx.strokeStyle = MK.tool === 'dig' ? '#ff5a5a' : MK.tool === 'land' ? '#7aff7a' : '#ffb03a'; ctx.beginPath(); ctx.arc(hx, hy, Math.max(2, r * s), 0, TAU); ctx.stroke();
        if (MK.tool === 'girder' && mkDrag) { ctx.beginPath(); ctx.moveTo(ox + mkDrag.x * s, oy + mkDrag.y * s); ctx.lineTo(hx, hy); ctx.stroke(); }
      }
      ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#ffe000';
      if (MK) ctx.fillText(`ISLAND MAKER  ·  ${MK.title || 'untitled'}  ·  ${{ land: 'Land brush', dig: 'Dig', girder: 'Girder: drag to tilt' }[MK.tool]}  ·  ${MK.ops.length}/${MAXOPS}`, 6, 12);
    }
    // ---- JackNet Showcase: everybody's islands
    function showIslands() {
      if (!D.showcase) { G.msg('Island Maker', 'JackNet isn\'t answering. Try again later!', 'info'); return; }
      D.showcase('squigs', { title: 'Jacks: Armageddon islands', sub: 'Islands drawn by JackNet members in the Island Maker. Visit one to fight on it, then rate it!', what: 'an island', icon: D.GAMES.squigs && D.GAMES.squigs.icon, c1: '#7a0a0a',
        stats: e => `${esc(THEMES[e.stats && e.stats.th] ? THEMES[e.stats.th].n : 'An island')} &middot; ${(e.stats && +e.stats.ops) | 0} brush strokes`,
        visit: entry => visitIsland(entry),
        mine: () => { const l = myIslands(), d = MK && MK.idx >= 0 ? l[MK.idx] : l[l.length - 1]; return d ? { title: d.title, data: d, stats: { th: d.theme, ops: d.ops.length } } : null; },
        noMine: 'Make an island in the Island Maker and save it first. Then upload it from here!' });
    }
    function okIsland(d) { return d && typeof d === 'object' && THEMES[d.theme] && Array.isArray(d.ops) && d.ops.length <= 4000 && d.ops.every(o => Array.isArray(o) && o.length >= 4 && o.slice(0, 4).every(Number.isFinite)) && (d.base === 'flat' || d.base === 'gen'); }
    let VISIT = null;
    function visitIsland(entry) {
      const d = entry && entry.data;
      if (!okIsland(d)) { G.msg('Jacks: Armageddon', 'That island seems to have sunk. (The file is broken.)', 'warn'); return; }
      if (NET) { G.msg('Jacks: Armageddon', 'Finish your online war first!', 'info'); return; }
      try { G.w.restore(); G.w.focus(); } catch (e) {}
      const isl = { v: 1, title: `${nclean(entry.title, 24) || 'An island'} by ${nclean(entry.name, 24)}`, seed: d.seed >>> 0, theme: d.theme, base: d.base, ops: d.ops };
      VISIT = entry;
      begin({ teams: [{ name: PRESETS[0].name, cpu: 0, col: 0, squigs: PRESETS[0].squigs }, { name: PRESETS[1].name, cpu: 1, lvl: 'normal', col: 1, squigs: PRESETS[1].squigs }], per: 3, theme: d.theme, island: isl, turnTime: OPT.turn, visit: 1 });
      visitStrip();
    }
    function visitStrip() {
      const old = root.querySelector('.dg-squigs-visit'); if (old) old.remove();
      if (!VISIT || !M || !M.cfg.visit) { VISIT = null; return; }
      const v = el(`<span>Visiting <b>${esc(VISIT.title)}</b> by ${esc(VISIT.name)}</span>`, 'dg-squigs-visit');
      if (D.rateBox) v.appendChild(D.rateBox('squigs', VISIT));
      v.appendChild(btn('Leave', () => { VISIT = null; v.remove(); titleScreen(); }));
      root.insertBefore(v, viewEl);
    }

    // ================================================================ the loop
    function update(dt) {
      if (scene === 'maker') { drawMaker(); return; }
      if (!M) return;
      if (NET && scene === 'game' && !M.attract) { netFrame(dt); return; } // online: fixed steps, the same on every screen
      if (M.training && ovl.style.display === 'none') TR.tick(dt);
      if (ovl.style.display !== 'none' && scene === 'game') { draw(); return; } // paused by an overlay
      for (let i = 1; i < (G._sqSpeed | 0); i++) { logic(dt); fx(dt); } // (testing: fast-forward)
      logic(dt);
      fx(dt);
      draw();
    }
    // the game itself (online this runs in fixed 1/60 s steps so every screen gets exactly the same war)
    function logic(dt) {
      const ctl = live(), I = NET && !M.attract ? NET.inp : inp;
      if (M.later && M.later.length) for (const l of M.later.slice()) if (--l.n <= 0) { M.later.splice(M.later.indexOf(l), 1); l.fn(); }
      if (M.sq && !M.sq.dead && (!M.sq.air || M.sq.wedge > 4) && (M.phase === 'aim' || M.phase === 'retreat')) {
        const s = M.sq;
        if (ctl) {
          const dir = I.left && !I.right ? -1 : I.right && !I.left ? 1 : 0;
          if (dir && !M.charging) { walkAcc += dt * 40; while (walkAcc >= 1) { walkAcc--; walkStep(s, dir); } } else walkAcc = 0;
          if (M.phase === 'aim') { if (I.up) s.aim = Math.min(1.5, s.aim + dt * 1.4); if (I.down) s.aim = Math.max(-1.5, s.aim - dt * 1.4); }
        }
      }
      if (M.charging) { M.power = Math.min(1, M.power + dt / 1.1); if (M.power >= 1 && ctl) fire(); }
      if (M.ai) aiUpdate(dt);
      // physics
      M.sacc = (M.sacc || 0) + dt;
      while (M.sacc >= TICK) { M.sacc -= TICK; for (const t of M.teams) for (const s of t.squigs) squigTick(s, TICK); }
      updateProjectiles(dt);
      updateCrates(dt);
      for (const g of M.graves) { if (g.vy || !solid(g.x, g.y + 1)) { g.vy += GRAV * dt; const ny = g.y + g.vy * dt; g.x += (g.vx || 0) * dt; if (solid(g.x, ny) && g.vy > 0) { g.vy = 0; g.vx = 0; while (solid(g.x, g.y)) g.y--; } else g.y = ny; if (g.y > M.waterY + 20) g.gone = true; } }
      M.graves = M.graves.filter(g => !g.gone);
      // phases
      if (M.phase === 'aim') {
        M.timer -= dt;
        const sec = Math.ceil(M.timer); if (sec <= 5 && sec >= 1 && sec < M.lastBeep) { M.lastBeep = sec; sfx('beep'); }
        if (M.timer <= 0 || M.hurtSelf || (M.sq && M.sq.dead)) { M.timer = 0; endTurnNow(); }
      } else if (M.phase === 'retreat') {
        M.retreat -= dt;
        if (M.retreat <= 0 || M.hurtSelf || (M.sq && M.sq.dead)) { M.phase = 'settle'; syncBar(); }
      } else if (M.phase === 'settle') {
        if (settled()) { M.phase = 'end'; M.endWait = 0.5; M.crateDone = false; syncBar(); }
      } else if (M.phase === 'end') endSequence(dt);
      for (const e of EX) e.t += dt; // (explosions hold up the end of a go, so they count as game time)
      EX = EX.filter(e => e.t < 0.35);
    }
    // what's only for looking at: sparks, smoke, numbers, bubbles, the camera
    function fx(dt) {
      for (const f of FX) { f.life -= dt; if (f.line || f.ring || f.ball) continue; if (f.grav) f.vy += GRAV * dt; if (f.ghost) f.x += Math.sin(f.life * 4) * 0.4; f.x += f.vx * dt; f.y += f.vy * dt; }
      FX = FX.filter(f => f.life > 0);
      if (FX.length > 700) FX.splice(0, FX.length - 700);
      for (const p of POPS) { p.t += dt; p.y -= dt * (p.big ? 14 : p.dmg ? 26 : 22); }
      POPS = POPS.filter(p => p.t < (p.big ? 1.1 : 1.5));
      for (const t of M.teams) for (const s of t.squigs) {
        if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
        s.blink -= dt; if (s.blink < -3 - Math.random() * 3) s.blink = 0.12;
        if (s.ouch > 0) s.ouch -= dt;
        if (s.dhp == null) s.dhp = s.hp; else if (s.dhp !== s.hp) { const d = s.hp - s.dhp, st = Math.max(Math.abs(d) * dt * 3, dt * 40); s.dhp = Math.abs(d) <= st ? s.hp : s.dhp + Math.sign(d) * st; }
        if (s.air && !s.dead && Math.hypot(s.vx, s.vy) > 140) s.spin = (s.spin || 0) + dt * 11 * (s.vx >= 0 ? 1 : -1); else s.spin = 0;
        if (s.dying && !s.dead) s.dieT = (s.dieT || 0) + dt;
      }
      if (M.banner) { M.banner.t -= dt; if (M.banner.t <= 0) M.banner = null; }
      if (M.arrow > 0) M.arrow -= dt;
      cam.shake = Math.max(0, cam.shake - dt * 18);
      if (cam.flash) cam.flash = Math.max(0, cam.flash - dt * 2.2);
      // wind-blown bits in the air (leaves, ash, flour, dust)
      if (!WP.length) for (let i = 0; i < 28; i++) WP.push({ x: Math.random() * VW, y: Math.random() * VH * 0.85, s: 0.5 + Math.random(), ph: Math.random() * TAU });
      for (const w of WP) { w.ph += dt * 2; w.x += (M.wind * 110 * w.s + Math.sin(w.ph) * 6 + 3) * dt; w.y += (Math.cos(w.ph * 0.7) * 6 + 4 * w.s) * dt; if (w.x > VW + 4) w.x -= VW + 8; if (w.x < -4) w.x += VW + 8; if (w.y > VH * 0.9) { w.y = -2; w.x = Math.random() * VW; } }
      // camera: follow the action (a shot, a bang, a falling jack or crate, then whoever's go it is)
      if (performance.now() > cam.manual) {
        let fx = null, fy = null, fast = false;
        const p = M.P[M.P.length - 1], e = EX[EX.length - 1];
        if (p) { fx = p.x + clamp(p.vx || 0, -300, 300) * 0.25; fy = p.y + clamp(p.vy || 0, -300, 300) * 0.15; fast = true; }
        else if (e) { fx = e.x; fy = e.y; }
        else if (M.focus) { fx = M.focus.x; fy = M.focus.y; }
        else {
          const fly = M.teams.flatMap(t => t.squigs).find(s => !s.dead && s.air && Math.abs(s.vy) + Math.abs(s.vx) > 60), cr = M.crates.find(c => !c.landed && c.y > -10);
          const s = fly || (cr ? null : M.sq); if (s) { fx = s.x; fy = s.y; } else if (cr) { fx = cr.x; fy = cr.y; }
        }
        if (fx != null) {
          const tx = clamp(fx - VW / 2, 0, W - VW), ty = clamp(fy - VH * 0.55, -140, H - VH), k = Math.min(1, dt * (fast ? 5 : 3.5));
          cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
        }
      }
    }

    // ================================================================ drawing
    const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
    const DARK = BODY.map(c => shade(c, -0.4)), LITE = BODY.map(c => shade(c, 0.35));
    function skinOf(s) { if (!s.skin) { let h = 7; for (const ch of String(s.name)) h = (h * 31 + ch.charCodeAt(0)) | 0; s.skin = SKIN[Math.abs(h) % SKIN.length]; } return s.skin; }
    const disc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    const walkingNow = s => !s.air && s.step && M.sq === s && (M.phase === 'aim' || M.phase === 'retreat') && (s.lastStep || 0) > performance.now() - 120;
    // a jack: a little 1999 kid in a team-colour cap and T-shirt (about 18 pixels tall, facing right before the flip)
    function drawSquig(s, sx, sy, t) {
      if (s.dummy) { drawDummy(s, sx, sy, t); return; }
      const team = M.teams[s.team], col = team.col, body = BODY[col], dark = DARK[col], skin = skinOf(s);
      const won = M.over && M.winner === team && !s.air;
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy) - (won ? Math.round(Math.abs(Math.sin(t / 180 + s.x)) * 6) : 0));
      if (s.dying && !s.dead) ctx.translate(Math.round(Math.sin(t / 22) * Math.min(2, (s.dieT || 0) * 3)), 0);
      if (s.spin) { ctx.translate(0, -8); ctx.rotate(s.spin); ctx.translate(0, 8); }
      ctx.scale(s.face, 1);
      const walking = walkingNow(s), st = walking ? ((s.step >> 2) & 1) : 0, yb = -st;
      // boots
      ctx.fillStyle = '#1e140c';
      if (s.air) { ctx.fillRect(-4, -3, 3, 3); ctx.fillRect(1, -2, 3, 2); } else { ctx.fillRect(-4 + st, -2, 3, 2); ctx.fillRect(1 - st, -2, 4, 2); }
      // T-shirt
      ctx.fillStyle = '#000'; ctx.fillRect(-5, -9 + yb, 10, 8);
      ctx.fillStyle = body; ctx.fillRect(-4, -8 + yb, 8, 6);
      ctx.fillStyle = LITE[col]; ctx.fillRect(-4, -8 + yb, 2, 5);
      ctx.fillStyle = dark; ctx.fillRect(-4, -3 + yb, 8, 1);
      // head
      const hy = -13 + yb, hurtNow = s.ouch > 0 || (s.dying && !s.dead);
      ctx.fillStyle = '#000'; disc(0.5, hy, 5.6);
      ctx.fillStyle = hurtNow && (t / 80 | 0) & 1 ? '#ff8a8a' : skin; disc(0.5, hy, 4.7);
      // cap with the peak at the front, and a little badge
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0.5, hy - 0.6, 5.1, Math.PI, 0); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-4.5, hy - 1.2, 10, 1.4); ctx.fillRect(4.6, hy - 1.6, 3.6, 1.8);
      ctx.fillStyle = '#fff'; ctx.fillRect(-0.5, hy - 4.6, 2, 2);
      // face
      if (s.dying && !s.dead) { ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(1, hy - 0.5); ctx.lineTo(3, hy + 1.5); ctx.moveTo(3, hy - 0.5); ctx.lineTo(1, hy + 1.5); ctx.moveTo(4, hy - 0.5); ctx.lineTo(6, hy + 1.5); ctx.moveTo(6, hy - 0.5); ctx.lineTo(4, hy + 1.5); ctx.stroke(); }
      else if (s.blink > 0) { ctx.fillStyle = '#000'; ctx.fillRect(1, hy + 0.5, 2, 1); ctx.fillRect(4, hy + 0.5, 2, 1); }
      else { ctx.fillStyle = '#fff'; ctx.fillRect(1, hy - 0.5, 2, 2.5); ctx.fillRect(4, hy - 0.5, 2, 2.5); ctx.fillStyle = '#000'; ctx.fillRect(2, hy, 1, 2); ctx.fillRect(5, hy, 1, 2); }
      ctx.fillStyle = '#5a1a10';
      if (hurtNow) ctx.fillRect(2.5, hy + 2.6, 2, 2); else { ctx.fillRect(2, hy + 3, 3, 1); ctx.fillRect(5, hy + 2, 1, 1); }
      // the weapon, if it's this jack's go
      if (s === M.sq && M.phase === 'aim' && !s.air && !M.over) {
        const a = s.aim, k = M.weapon;
        ctx.save(); ctx.translate(1, -7 + yb); ctx.rotate(-a);
        if (k === 'bazooka' || k === 'homing') { ctx.fillStyle = '#000'; ctx.fillRect(-5, -3, 18, 6); ctx.fillStyle = k === 'homing' ? '#8a8aa0' : '#5a6a4a'; ctx.fillRect(-4, -2, 16, 4); ctx.fillStyle = '#e02020'; ctx.fillRect(12, -2, 2, 4); }
        else if (k === 'shotgun') { ctx.fillStyle = '#6a3a1a'; ctx.fillRect(-4, -1, 7, 3); ctx.fillStyle = '#333'; ctx.fillRect(3, -1, 11, 2); }
        else if (FUSED[k] || k === 'holy') { ctx.fillStyle = '#000'; disc(8, 0, 3.6); ctx.fillStyle = k === 'holy' ? '#ffd040' : k === 'banana' ? '#ffe030' : k === 'cluster' ? '#d02020' : '#3a8a2a'; disc(8, 0, 2.8); }
        else if (k === 'pet') { ctx.fillStyle = '#000'; ctx.fillRect(4, -4, 7, 8); ctx.fillStyle = '#ff7ac0'; ctx.fillRect(5, -3, 5, 6); }
        else if (k === 'airstrike' || k === 'girder' || k === 'teleport') { ctx.fillStyle = '#222'; ctx.fillRect(4, -2, 5, 4); ctx.fillStyle = '#3aff3a'; ctx.fillRect(5, -1, 3, 1); }
        ctx.fillStyle = skin; ctx.fillRect(3, 0, 3, 3);
        ctx.restore();
      }
      ctx.restore();
    }
    // Sergeant Bellows' practice dummies: a sack of straw on a pole with a target for a face
    function drawDummy(s, sx, sy, t) {
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
      if (s.ouch > 0) ctx.rotate(Math.sin(t / 40) * s.ouch * 0.5);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -8, 3, 8);
      ctx.fillStyle = '#000'; ctx.fillRect(-6, -20, 13, 13); ctx.fillStyle = '#d8b860'; ctx.fillRect(-5, -19, 11, 11); ctx.fillStyle = '#b8963a'; ctx.fillRect(-5, -14, 11, 1); ctx.fillRect(-9, -17, 18, 2);
      ctx.fillStyle = '#000'; disc(0.5, -25, 6); ctx.fillStyle = '#fff'; disc(0.5, -25, 5); ctx.fillStyle = '#e02020'; disc(0.5, -25, 3.6); ctx.fillStyle = '#fff'; disc(0.5, -25, 2.2); ctx.fillStyle = '#e02020'; disc(0.5, -25, 1);
      ctx.fillStyle = '#e8c870'; ctx.fillRect(-9, -18, 1, 3); ctx.fillRect(9, -18, 1, 3); ctx.fillRect(-3, -8, 1, 2);
      ctx.restore();
    }
    function label(text, x, y, col, box) {
      ctx.font = 'bold 9px Arial'; const w = Math.ceil(ctx.measureText(text).width);
      if (box) { ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 2, y - 8, w + 4, 10); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 1.5, y - 7.5, w + 3, 9); ctx.fillStyle = '#fff'; ctx.fillText(text, x - w / 2, y); return; }
      ctx.fillStyle = '#000'; ctx.fillText(text, x - w / 2 + 1, y + 1); ctx.fillStyle = col; ctx.fillText(text, x - w / 2, y);
    }
    function outlined(text, x, y, font, col, lw) { ctx.font = font; const w = ctx.measureText(text).width; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = lw || 3; ctx.strokeText(text, x - w / 2, y); ctx.fillStyle = col; ctx.fillText(text, x - w / 2, y); return w; }
    function bubble(text, x, y) {
      ctx.font = 'bold 10px Arial'; const w = Math.ceil(ctx.measureText(text).width) + 10, bx = Math.round(clamp(x - w / 2, 2, VW - w - 2)), by = Math.round(y - 18);
      ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, w + 2, 16); ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, w, 14);
      ctx.beginPath(); ctx.moveTo(x - 3, by + 14); ctx.lineTo(x + 3, by + 14); ctx.lineTo(x, by + 19); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillText(text, bx + 5, by + 11);
    }
    function drawProj(p, x, y, t) {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y));
      const k = p.kind;
      if (k === 'bazooka' || k === 'missile' || k === 'homing') { ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = '#000'; ctx.fillRect(-6, -3, 12, 6); ctx.fillStyle = k === 'homing' ? '#b0b0c8' : '#ddd'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = '#e02020'; ctx.fillRect(4, -2, 2, 4); ctx.fillStyle = (t / 50 | 0) & 1 ? '#ffd000' : '#ff6a00'; ctx.fillRect(-9, -1.5, 4, 3); if (k === 'homing') { ctx.fillStyle = '#e02020'; ctx.fillRect(-2, -3, 3, 1); ctx.fillRect(-2, 2, 3, 1); } }
      else if (k === 'grenade') { ctx.fillStyle = '#000'; disc(0, 0, 4.2); ctx.fillStyle = '#3a8a2a'; disc(0, 0, 3.4); ctx.fillStyle = '#7ad05a'; ctx.fillRect(-2, -2, 2, 2); ctx.fillStyle = '#888'; ctx.fillRect(-1, -6, 3, 2); }
      else if (k === 'cluster') { ctx.fillStyle = '#000'; disc(0, 0, 4.2); ctx.fillStyle = '#d02020'; disc(0, 0, 3.4); ctx.fillStyle = '#fff'; ctx.fillRect(-1, -2, 1, 1); ctx.fillRect(1, 1, 1, 1); ctx.fillRect(-2, 1, 1, 1); }
      else if (k === 'clusterlet') { ctx.fillStyle = '#000'; ctx.fillRect(-2, -2, 4, 4); ctx.fillStyle = '#d02020'; ctx.fillRect(-1, -1, 2, 2); }
      else if (k === 'banana' || k === 'bananalet') { const s = k === 'banana' ? 1.3 : 0.9; ctx.rotate(p.t * 8); ctx.scale(s, s); ctx.fillStyle = '#5a3a00'; ctx.beginPath(); ctx.arc(0, 0, 5, 0.2, 2.9); ctx.arc(0, -2, 4, 2.7, 0.4, true); ctx.fill(); ctx.fillStyle = '#ffe030'; ctx.beginPath(); ctx.arc(0, 0, 4, 0.3, 2.8); ctx.arc(0, -2, 3.5, 2.6, 0.5, true); ctx.fill(); }
      else if (k === 'holy') { ctx.fillStyle = '#7a5000'; disc(0, 0, 4.5); ctx.fillStyle = '#ffd040'; disc(0, 0, 3.5); ctx.fillStyle = '#7a5000'; ctx.fillRect(-0.5, -3, 1, 6); ctx.fillRect(-2, -1, 4, 1); ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -7, 5, 1.6, 0, 0, TAU); ctx.stroke(); if (p.holyT != null) { ctx.fillStyle = `rgba(255,255,200,${0.3 + 0.3 * Math.sin(t / 60)})`; disc(0, 0, 16 + (1.3 - p.holyT) * 20); } }
      else if (k === 'dynamite') { ctx.fillStyle = '#000'; ctx.fillRect(-3, -10, 6, 11); ctx.fillStyle = '#c01818'; ctx.fillRect(-2, -9, 4, 9); ctx.fillStyle = '#ff4a3a'; ctx.fillRect(-2, -9, 1, 9); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(2, -13); ctx.stroke(); }
      else if (k === 'pet') {
        const st = p.air ? 0 : (p.step >> 2) & 1; ctx.scale(p.dir, 1);
        ctx.fillStyle = '#000'; ctx.fillRect(-3 + st, -2, 2, 2); ctx.fillRect(1 - st, -2, 2, 2);
        ctx.beginPath(); ctx.ellipse(0, -7, 5.4, 6.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7ac0'; ctx.beginPath(); ctx.ellipse(0, -7, 4.4, 5.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#bfe0a0'; ctx.fillRect(-2.5, -10, 5, 4); ctx.fillStyle = '#000'; ctx.fillRect(-1.5, -9, 1, 1); ctx.fillRect(0.5, -9, 1, 1); ctx.fillRect(-1, -7, 2, 0.8);
        ctx.fillStyle = (t / 160 | 0) & 1 ? '#ff2020' : '#ffd0e8'; ctx.fillRect(-0.5, -4, 1, 1);
      }
      ctx.restore();
      if (p.fuse != null && k !== 'bananalet' && p.holyT == null) { const left = Math.max(0, Math.ceil(p.fuse - p.t)); label(String(left), Math.round(x), Math.round(y) - (k === 'pet' ? 18 : 10), left <= 1 ? '#ff5a5a' : '#fff'); }
    }
    function drawFX(f, cx, cy) {
      const k = 1 - Math.max(0, f.life / f.max), x = f.x - cx, y = f.y - cy;
      if (f.line) { ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(f.x2 - cx, f.y2 - cy); ctx.stroke(); return; }
      if (f.ball) {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = '#c02000'; disc(x, y, f.r * (0.7 + k * 0.6));
        ctx.fillStyle = '#ff8a00'; disc(x, y, f.r * (0.55 + k * 0.3)); ctx.fillStyle = '#ffe040'; disc(x, y, f.r * 0.45 * (1 - k));
        if (k < 0.25) { ctx.fillStyle = '#fff'; disc(x, y, f.r * 0.35); }
        ctx.globalAlpha = 1; return;
      }
      if (f.ring) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 1 + 3 * (1 - k); ctx.beginPath(); if (f.flat) ctx.ellipse(x, y, 4 + k * 30, 2 + k * 6, 0, 0, TAU); else ctx.arc(x, y, f.r + (f.grow || 20) * k, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; return; }
      if (f.ghost) {
        ctx.globalAlpha = Math.min(1, f.life / f.max * 1.5) * 0.85; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y - 4, 5, Math.PI, 0); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x + 3, y + 2); ctx.lineTo(x + 1, y + 4); ctx.lineTo(x - 1, y + 2); ctx.lineTo(x - 3, y + 4); ctx.lineTo(x - 5, y + 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 5, 2, 2); ctx.fillRect(x + 1, y - 5, 2, 2);
        ctx.strokeStyle = '#ffe060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - 11, 4, 1.4, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; return;
      }
      if (f.sink) {
        const s = f.sq; if (!s || !M.teams[s.team]) return; ctx.globalAlpha = 0.8 * Math.min(1, f.life / f.max * 2);
        ctx.fillStyle = skinOf(s); disc(x, y - 8, 4.5); ctx.fillStyle = BODY[M.teams[s.team].col]; ctx.beginPath(); ctx.arc(x, y - 8.5, 4.8, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 4, y - 4, 8, 6);
        ctx.fillStyle = '#cfefff'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 2 + i * 2 + Math.sin(f.life * 9 + i) * 2, y - 14 - ((f.max - f.life) * 30 + i * 9) % 30, 2, 2);
        ctx.globalAlpha = 1; return;
      }
      ctx.globalAlpha = Math.max(0, 1 - k) * (f.smoke ? 0.55 : 1); ctx.fillStyle = f.col;
      if (f.smoke) { const z = f.size * (0.8 + k * 1.2); disc(x, y, z / 2 + 1); }
      else if (f.spark) { ctx.fillRect(Math.round(x), Math.round(y), 2, 2); ctx.globalAlpha *= 0.5; ctx.fillRect(Math.round(x - f.vx * 0.02), Math.round(y - f.vy * 0.02), 1, 1); }
      else { const z = f.size; ctx.fillRect(Math.round(x - z / 2), Math.round(y - z / 2), Math.ceil(z), Math.ceil(z)); }
      ctx.globalAlpha = 1;
    }
    const WPCOL = { jungle: ['#3aa02a', '#7ad04a', '#c8a040'], scrap: ['#9a9aa0', '#5a5a60', '#ff8a3a'], kitchen: ['#ffffff', '#ff6a8a', '#ffe040'], pc: ['#7af0ff', '#c8c8d0', '#3aff6a'] };
    function draw() {
      const t = performance.now();
      const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
      const cx = Math.round(cam.x + sx), cy = Math.round(cam.y + sy);
      // background
      if (BG) ctx.drawImage(BG, Math.round(cam.x * PAR), 0, VW, VH, 0, 0, VW, VH);
      if (!M) return;
      const wc0 = WPCOL[theme] || WPCOL.jungle;
      // wind-blown bits behind the island
      for (let i = 0; i < WP.length; i += 2) { const w = WP[i]; ctx.fillStyle = wc0[i % 3]; ctx.globalAlpha = 0.5; ctx.fillRect(Math.round(w.x), Math.round(w.y), 1, 1); }
      ctx.globalAlpha = 1;
      // terrain
      if (TC) {
        const srcY = Math.max(0, cy), dstY = srcY - cy, hh = Math.min(VH - dstY, H - srcY);
        if (hh > 0) ctx.drawImage(TC, cx, srcY, VW, hh, 0, dstY, VW, hh);
      }
      // the training flag
      if (M.training && TR.flag) { const x = TR.flag.x - cx, y = TR.flag.y - cy; ctx.fillStyle = '#ddd'; ctx.fillRect(x, y - 30, 2, 30); ctx.fillStyle = '#ff3a1a'; ctx.beginPath(); ctx.moveTo(x + 2, y - 30); ctx.lineTo(x + 16 + Math.sin(t / 150) * 2, y - 25); ctx.lineTo(x + 2, y - 20); ctx.fill(); }
      // graves
      for (const g of M.graves) {
        const x = Math.round(g.x - cx), y = Math.round(g.y - cy), gc = M.teams[g.team] ? BODY[M.teams[g.team].col] : '#888';
        ctx.fillStyle = '#000'; ctx.fillRect(x - 6, y - 13, 12, 13); ctx.beginPath(); ctx.arc(x, y - 13, 6, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#9a9aa4'; ctx.fillRect(x - 5, y - 13, 10, 12); ctx.beginPath(); ctx.arc(x, y - 13, 5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 4, y - 14, 2, 10);
        ctx.fillStyle = gc; ctx.fillRect(x - 5, y - 4, 10, 3);
        ctx.fillStyle = '#3a3a44'; ctx.font = 'bold 6px Arial'; ctx.fillText('RIP', x - 5, y - 7);
      }
      // crates
      for (const c of M.crates) {
        const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
        if (!c.landed && c.vy <= 60) { ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 6, y - 12); ctx.lineTo(x - 12, y - 26); ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 12, y - 26); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.fillStyle = i & 1 ? '#fff' : '#e02020'; ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.arc(x, y - 26, 14, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); ctx.fill(); } }
        const glow = c.landed ? 0.5 + 0.5 * Math.sin(t / 200 + c.x) : 0;
        if (c.health) { ctx.fillStyle = '#000'; ctx.fillRect(x - 7, y - 13, 14, 13); ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x - 6, y - 12, 12, 11); ctx.fillStyle = `rgb(232,${72 + glow * 40 | 0},122)`; ctx.beginPath(); ctx.arc(x - 2, y - 8, 2.2, 0, TAU); ctx.arc(x + 2, y - 8, 2.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 4.2, y - 7.4); ctx.lineTo(x, y - 3); ctx.lineTo(x + 4.2, y - 7.4); ctx.fill(); }
        else { ctx.fillStyle = '#000'; ctx.fillRect(x - 7, y - 13, 14, 13); ctx.fillStyle = '#a86a2a'; ctx.fillRect(x - 6, y - 12, 12, 11); ctx.fillStyle = '#7a4a1a'; ctx.fillRect(x - 6, y - 7, 12, 1); ctx.fillRect(x - 1, y - 12, 1, 11); ctx.fillStyle = glow > 0.5 ? '#fff6a0' : '#ffe000'; ctx.font = 'bold 9px Arial'; ctx.fillText('?', x - 2, y - 3); }
      }
      // jacks
      for (const tm of M.teams) for (const s of tm.squigs) if (!s.dead) drawSquig(s, s.x - cx, s.y - cy, t);
      // projectiles
      for (const p of M.P) drawProj(p, p.x - cx, p.y - cy, t);
      // explosions + particles
      for (const f of FX) drawFX(f, cx, cy);
      // water
      const wy = Math.round(M.waterY - cy), wc = THEMES[theme].water;
      if (wy < VH + 10) {
        for (let L = 0; L < 3; L++) {
          ctx.fillStyle = wc[L === 2 ? 0 : L]; ctx.globalAlpha = L === 2 ? 0.95 : 0.72;
          ctx.beginPath(); ctx.moveTo(0, VH);
          for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, wy + L * 7 + Math.sin((x + cx) * (0.045 - L * 0.008) + t / (420 + L * 160) + L * 2) * (2.8 - L * 0.5));
          ctx.lineTo(VW, VH); ctx.fill();
        }
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.fillRect(0, wy + 24, VW, Math.max(0, VH - wy - 24)); ctx.globalAlpha = 1;
        ctx.fillStyle = wc[2]; for (let x = ((-cx) % 40 + 40) % 40; x < VW; x += 40) ctx.fillRect(x + Math.round(Math.sin(t / 300 + x) * 3), wy + 1 + Math.round(Math.sin(t / 500 + x * 0.1)), 7, 1);
        ctx.globalAlpha = 0.5; for (let x = ((-cx * 1.3) % 64 + 64) % 64; x < VW; x += 64) ctx.fillRect(x + Math.round(Math.sin(t / 700 + x) * 6), wy + 12, 12, 1); ctx.globalAlpha = 1;
      }
      // labels
      for (const tm of M.teams) for (const s of tm.squigs) {
        if (s.dead) continue;
        const x = Math.round(s.x - cx), y = Math.round(s.y - cy), col = LABEL[tm.col];
        if (s.dummy) { label('DUMMY', x, y - 34, '#e8c870'); continue; }
        label(s.name, x, y - 31, col); label(String(Math.round(s.dhp == null ? s.hp : s.dhp)), x, y - 21, col, true);
        if (s.bubble) bubble(s.bubble.text, x, y - 37);
      }
      // the current jack: marker, crosshair, power
      const cs = M.sq;
      if (cs && !cs.dead && !M.over) {
        const x = cs.x - cx, y = cs.y - cy;
        if (M.arrow > 0) { const b = Math.sin(t / 120) * 3; ctx.fillStyle = LABEL[M.teams[cs.team].col]; ctx.beginPath(); ctx.moveTo(x - 7, y - 58 + b); ctx.lineTo(x + 7, y - 58 + b); ctx.lineTo(x, y - 46 + b); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); }
        if (M.phase === 'aim' && !cs.air && WPN[M.weapon].type !== 'target' && !['skip', 'punch', 'dynamite', 'pet'].includes(M.weapon)) {
          const [dx, dy] = aimDir(cs), hx = x + dx * 36, hy = y - 7 + dy * 36;
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, TAU); ctx.stroke();
          ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, TAU); ctx.moveTo(hx - 8, hy); ctx.lineTo(hx - 3, hy); ctx.moveTo(hx + 3, hy); ctx.lineTo(hx + 8, hy); ctx.moveTo(hx, hy - 8); ctx.lineTo(hx, hy - 3); ctx.moveTo(hx, hy + 3); ctx.lineTo(hx, hy + 8); ctx.stroke();
          if (M.charging) for (let i = 0; i < Math.floor(M.power * 16); i++) { const d = 10 + i * 3.2, r = 1 + i * 0.22; ctx.fillStyle = `rgb(255,${Math.round(235 - i * 14)},0)`; disc(x + dx * d, y - 7 + dy * d, r); }
        }
        if (M.target && M.phase === 'aim') { const tx = M.target.x - cx, ty = M.target.y - cy, r = 6 + Math.sin(t / 100) * 2; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(tx, ty, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx - r - 4, ty); ctx.lineTo(tx + r + 4, ty); ctx.moveTo(tx, ty - r - 4); ctx.lineTo(tx, ty + r + 4); ctx.stroke(); }
      }
      // wind-blown bits in front
      for (let i = 1; i < WP.length; i += 2) { const w = WP[i]; ctx.fillStyle = wc0[i % 3]; ctx.fillRect(Math.round(w.x), Math.round(w.y), theme === 'jungle' ? 2 : 1, 1); }
      // pops (damage numbers, KABOOM!s)
      for (const p of POPS) {
        const x = Math.round(p.x - cx), y = Math.round(p.y - cy), a = Math.min(1, 2 - p.t * 1.5);
        ctx.globalAlpha = Math.max(0, a);
        if (p.big) { const sc = p.t < 0.12 ? 1.6 - p.t * 5 : 1; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); outlined(p.text, 0, 0, 'bold 18px Impact, "Arial Black", Arial', p.col, 4); ctx.restore(); }
        else if (p.dmg) { const sc = p.t < 0.1 ? 1.8 - p.t * 8 : 1; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); outlined(p.text, 0, 0, 'bold 13px "Arial Black", Arial', p.col, 3); ctx.restore(); }
        else label(p.text, x, y, p.col);
        ctx.globalAlpha = 1;
      }
      if (cam.flash) { ctx.globalAlpha = cam.flash; ctx.fillStyle = '#fff8e0'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
      if (!M.attract) hud(t);
    }
    function hud(t) {
      const tm = M.sq ? M.teams[M.sq.team] : null, tc = tm ? LABEL[tm.col] : '#fff';
      // the go clock (or RUN! while you run away)
      if (!M.training && !M.over) {
        const ret = M.phase === 'retreat', val = ret ? Math.max(0, Math.ceil(M.retreat)) : Math.max(0, Math.ceil(M.timer));
        const bw = 42, bh = 30, bx = 6, by = VH - bh - 6;
        ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = tc; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.font = 'bold 7px Arial'; ctx.fillStyle = '#aaa'; const lab = ret ? 'RUN!' : M.phase === 'aim' ? 'TIME' : 'WAIT', lw = ctx.measureText(lab).width; ctx.fillText(lab, bx + bw / 2 - lw / 2, by + 9);
        ctx.font = 'bold 15px Arial'; const vs = M.phase === 'aim' || ret ? String(val) : '--', vw = ctx.measureText(vs).width;
        ctx.fillStyle = ret ? '#ff4040' : val <= 5 && (t / 250 | 0) & 1 ? '#ff4040' : '#ffe000'; ctx.fillText(vs, bx + bw / 2 - vw / 2, by + 25);
      }
      // whose go it is (always on screen)
      if (tm && !M.over && !M.training) {
        const who = `${tm.name}: ${M.sq.name}${tm.cpu ? ' (computer)' : ''}`;
        ctx.font = 'bold 10px Arial'; const w = ctx.measureText(who).width + 18, x = Math.round(VW / 2 - w / 2), y = NET ? 17 : 4;
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x, y, w, 15); ctx.fillStyle = BODY[tm.col]; ctx.fillRect(x, y, 4, 15);
        ctx.fillStyle = tc; ctx.fillText(who, x + 10, y + 11);
      }
      // wind: arrows and a number
      {
        const ww = G.phone ? 70 : 100, wx = VW - ww - 6, wyy = VH - 18;
        ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(wx, wyy - 11, ww, 23); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(wx + 0.5, wyy + 0.5, ww - 1, 11);
        const half = ww / 2 - 2, len = Math.round(Math.abs(M.wind) * half), dir = Math.sign(M.wind);
        for (let i = 0; i < len; i += 3) { const xx = dir > 0 ? wx + ww / 2 + i : wx + ww / 2 - i - 3; const ph = ((t / 70 | 0) + (dir > 0 ? -i / 3 : i / 3)) % 6; ctx.fillStyle = dir > 0 ? (ph < 2 ? '#ffb0b0' : '#e02a2a') : (ph < 2 ? '#b0d0ff' : '#2a5ae0'); ctx.beginPath(); if (dir > 0) { ctx.moveTo(xx, wyy + 2); ctx.lineTo(xx + 3, wyy + 6); ctx.lineTo(xx, wyy + 10); } else { ctx.moveTo(xx + 3, wyy + 2); ctx.lineTo(xx, wyy + 6); ctx.lineTo(xx + 3, wyy + 10); } ctx.fill(); }
        ctx.fillStyle = '#888'; ctx.fillRect(wx + ww / 2, wyy + 1, 1, 10);
        ctx.font = 'bold 8px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('WIND', wx + 3, wyy - 3);
        const wn = Math.round(Math.abs(M.wind) * 100), ws = wn ? `${M.wind < 0 ? '◀ ' : ''}${wn}${M.wind > 0 ? ' ▶' : ''}` : 'CALM', wsw = ctx.measureText(ws).width;
        ctx.fillStyle = dir > 0 ? '#ff8a8a' : dir < 0 ? '#8ab0ff' : '#ccc'; ctx.fillText(ws, wx + ww - wsw - 3, wyy - 3);
      }
      // team health bars
      const teams = M.teams.filter(x => !x.dummy && x.squigs.some(s => !s.dead));
      const maxW = G.phone ? 110 : 160, rowH = 10, top = VH - 8 - teams.length * rowH;
      teams.forEach((tt, i) => {
        const hp = tt.squigs.reduce((a, s) => a + (s.dead ? 0 : Math.round(s.dhp == null ? s.hp : s.dhp)), 0), w = Math.max(2, Math.round(Math.min(1.3, hp / M.totalHp[M.teams.indexOf(tt)]) * maxW * 0.75));
        const y = top + i * rowH, x0 = Math.round(VW / 2 - maxW / 2 + 14);
        ctx.font = 'bold 8px Arial'; const nm = G.phone ? tt.name.slice(0, 10) : tt.name; const nw = ctx.measureText(nm).width;
        ctx.fillStyle = '#000'; ctx.fillRect(x0 - nw - 6, y, nw + 4, rowH - 1); ctx.fillStyle = LABEL[tt.col]; ctx.fillText(nm, x0 - nw - 4, y + 7);
        ctx.fillStyle = '#000'; ctx.fillRect(x0, y, w + 2, rowH - 1); ctx.fillStyle = BODY[tt.col]; ctx.fillRect(x0 + 1, y + 1, w, rowH - 3); ctx.fillStyle = LITE[tt.col]; ctx.fillRect(x0 + 1, y + 1, w, 2);
        if (M.teams.indexOf(tt) === M.cur && (t / 300 | 0) & 1) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x0 + 1, y + 1, w, rowH - 3); }
        ctx.fillStyle = '#ddd'; ctx.font = 'bold 7px Arial'; ctx.fillText(String(hp), x0 + w + 5, y + 7);
      });
      // weapon and banner
      if (M.sq && humanTurn() && M.phase === 'aim') {
        ctx.font = 'bold 10px Arial'; const am = turnTeam().ammo[M.weapon], s = WPN[M.weapon].n + (am > 0 ? ` x${am}` : '') + (FUSED[M.weapon] ? `  (${M.fuse} sec fuse)` : '') + (M.weapon === 'shotgun' ? `  (${M.shots} shot${M.shots === 1 ? '' : 's'} left)` : '');
        const w = ctx.measureText(s).width, y = VH - 47; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(VW - w - 10, y, w + 8, 14); ctx.fillStyle = '#ffe000'; ctx.fillText(s, VW - w - 6, y + 10);
      }
      if (M.banner) { ctx.font = 'bold 12px Arial'; const w = ctx.measureText(M.banner.text).width; const x = Math.round(VW / 2 - w / 2), y = M.training ? Math.round(VH * 0.42) : NET ? 36 : 24; ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.fillRect(x - 8, y, w + 16, 20); ctx.strokeStyle = M.banner.col; ctx.lineWidth = 1; ctx.strokeRect(x - 7.5, y + 0.5, w + 15, 19); ctx.fillStyle = M.banner.col; ctx.fillText(M.banner.text, x, y + 14); }
      if (NET && !M.attract) netHud(t);
      if (M.sudden) { ctx.font = 'bold 9px Arial'; ctx.fillStyle = (t / 400 | 0) & 1 ? '#ff5a3a' : '#ffb03a'; ctx.fillText('SUDDEN DEATH', 6, VH - 42); }
      if (M.demo) { ctx.font = 'bold 9px Arial'; ctx.fillStyle = '#fff'; ctx.fillText(`DEMO - turn ${M.turn} of 14`, 6, VH - (M.sudden ? 54 : 42)); }
      if (M.island && M.island.title) { ctx.font = 'bold 8px Arial'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(String(M.island.title), 6, 12); }
    }

    // ================================================================ online (mp.js "Play with someone..."): 2-4 players over JackNet
    // The host's screen is the referee. Every go:
    //  1. the host sends a snapshot of the whole war (T: jacks, crates, holes, ammo, wind and the dice seed for the go),
    //  2. whoever's go it is plays it on their own screen in fixed 1/60 s steps, and sends what they pressed and on which
    //     step (numbered batches 'i' with an epoch, so a reload mid-go starts everybody's replay of that go again),
    //  3. everybody else replays those presses on the same snapshot a moment behind, so they all see exactly the same go,
    //  4. when the dust settles the host sends the next snapshot, which also mops up any tiny difference.
    // A missing batch is asked for again ('ir'). A dropped player's go waits SKIP_MS for them, then the host skips it
    // ('sk'); they're straight back in on their next go. People who arrive after the start watch. Snapshots travel in
    // chunks ('c': the relay takes 1.5 KB at a time). Nothing from the network is used without checking it first.
    const STEP = 1 / 60, SKIP_MS = 20000, STALE_MS = 50000;
    const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
    const nrid = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');
    const nclean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, n || 18).trim();
    const KEYS = ['left', 'right', 'up', 'down'], PRESS = new Set(['jump', 'flip', 'fireDown', 'fireUp', 'fuse', 'f1', 'f2', 'f3', 'f4', 'f5']);
    const zOn = id => !window.Zone || !Zone.isOnline || Zone.isOnline(id);
    const nickOf = id => (NET && NET.s ? NET.s.nick(id) : 'Somebody');
    const teamOf = id => (M && M.teams && !M.attract ? M.teams.find(t => t.o === id) : null) || null;
    const people = () => (NET ? NET.s.humans().filter(p => !NET.s.left.has(p.id) && !NET.s.gone.has(p.id)) : []);
    // ---- input: the same path offline (straight in) and online (stamped with the step, sent, replayed everywhere)
    function setKey(k, v) {
      if (!NET) { if (v && M && !M.attract && !humanTurn()) return; inp[k] = v; return; }
      if (!!NET.lk[k] === !!v) return;
      NET.lk[k] = !!v; act('k', [k, v ? 1 : 0]);
    }
    function act(code, v) {
      if (!NET || (M && M.attract)) { if (M && !M.attract && !humanTurn()) return; applyEv(code, v); return; }
      if (!canAct()) return;
      NET.queued.push([0, code, v]);
    }
    function applyEv(code, v) {
      if (!M) return;
      if (code === 'k') { const I = NET && !M.attract ? NET.inp : inp; if (Array.isArray(v) && KEYS.includes(v[0])) I[v[0]] = !!v[1]; return; }
      if (code === 'p') { if (PRESS.has(v)) press(v); return; }
      if (!live() || M.phase !== 'aim') return;
      if (code === 'a') { if (Array.isArray(v) && Number.isFinite(+v[0]) && !M.charging) { M.sq.aim = clamp(+v[0], -1.5, 1.5); M.sq.face = v[1] < 0 ? -1 : 1; } return; }
      if (code === 'w') { if (WPN[v] && turnTeam().ammo[v] !== 0) { M.weapon = v; M.shots = WPN[v].shots || 1; M.target = null; syncBar(); } return; }
      if (code === 'tg') { if (Array.isArray(v) && (WPN[M.weapon].type === 'target' || WPN[M.weapon].home)) M.target = { x: clamp(Math.round(+v[0] || 0), -200, W + 200), y: clamp(Math.round(+v[1] || 0), -400, H) }; return; }
      if (code === 'sk') { M.weapon = 'skip'; fire(); }
    }
    // ---- snapshots
    function snap() {
      return { v: 1, mid: NET.mid, rd: NET.s.round, t: M.turn, cur: M.cur, sqi: M.sq ? Math.max(0, M.teams[M.cur].squigs.indexOf(M.sq)) : 0, seed: M.seed, theme: M.theme, wind: M.wind, wy: M.waterY, sd: M.sudden ? 1 : 0, tt: M.turnTime, fu: M.fuse, wp: M.weapon, rs: NET.rs >>> 0, over: NET.over, why: NET.why || '', th: M.totalHp, bh: [M.best.hit | 0, String(M.best.who || '').slice(0, 14), M.best.team | 0], tr: M.terra | 0,
        tm: M.teams.map(t => ({ n: t.name, c: t.col, o: t.o, out: t.out ? 1 : 0, cp: t.cpu ? 1 : 0, lv: t.lvl || 'normal', nx: t.next, l: t.last, am: ORDER.map(k => t.ammo[k]), st: [t.stats.dmg, t.stats.kills, t.stats.self | 0, t.stats.drown | 0], sq: t.squigs.map(q => [q.name, r2(q.x), r2(q.y), Math.round(q.hp), q.dead ? 1 : 0, q.face, r3(q.aim), q.last]) })),
        cr: M.crates.filter(c => !c.gone).map(c => [r2(c.x), r2(c.y), r2(c.vy), c.landed ? 1 : 0, c.para0 ? 1 : 0, c.health ? 1 : 0, c.wpn || '']),
        gr: M.graves.map(g => [Math.round(g.x), Math.round(g.y), g.team]), ops: (M.tops || []).map(o => o.map(v => Math.round(v))) };
    }
    function okSnap(sn) {
      try {
        if (!sn || typeof sn !== 'object' || typeof sn.mid !== 'string' || !THEMES[sn.theme] || !Array.isArray(sn.tm) || sn.tm.length < 2 || sn.tm.length > 4) return false;
        if (!Array.isArray(sn.ops) || sn.ops.length > 5000 || !Array.isArray(sn.cr) || sn.cr.length > 60 || !Array.isArray(sn.gr) || sn.gr.length > 40) return false;
        if (!Number.isInteger(sn.cur) || sn.cur < 0 || sn.cur >= sn.tm.length || !WPN[sn.wp] || !Number.isInteger(sn.t) || !Number.isFinite(sn.wy) || !Number.isFinite(sn.wind) || !Number.isFinite(sn.tt)) return false;
        for (const t of sn.tm) { if (!t || !Array.isArray(t.sq) || t.sq.length < 1 || t.sq.length > 4 || !Array.isArray(t.am) || t.am.length !== ORDER.length || !Array.isArray(t.st)) return false; for (const q of t.sq) if (!Array.isArray(q) || q.length < 8 || !Number.isFinite(q[1]) || !Number.isFinite(q[2]) || !Number.isFinite(q[6])) return false; }
        for (const o of sn.ops) if (!Array.isArray(o) || o.length < 3 || !o.slice(0, 3).every(Number.isFinite)) return false;
        for (const c of sn.cr) if (!Array.isArray(c) || !c.slice(0, 3).every(Number.isFinite)) return false;
        return true;
      } catch (e) { return false; }
    }
    const applyOp = o => { if (o[3] === 1) addGirder(o[0], o[1], o[2] / 1000); else carve(o[0], o[1], clamp(o[2], 1, 90), true); };
    function applySnap(sn) {
      const fresh = !M || M.attract || M.mid !== sn.mid || !TC;
      if (fresh || JSON.stringify(M.tops || []) !== JSON.stringify(sn.ops)) { theme = sn.theme; seedNow = sn.seed; genTerrain(sn.seed >>> 0, sn.theme); for (const o of sn.ops) applyOp(o); }
      if (fresh) { FX = []; POPS = []; EX = []; cam.x = clamp(W / 2 - VW / 2, 0, W - VW); }
      closeOverlay(); G.stopMusic(); mute = false; scene = 'game'; theme = sn.theme;
      const tt = clamp(sn.tt, 10, 120);
      M = { cfg: { online: 1 }, mid: sn.mid, seed: sn.seed >>> 0, theme: sn.theme, attract: false, demo: false, turn: sn.t, cur: sn.cur, wind: clamp(sn.wind, -1, 1), waterY: clamp(sn.wy, 200, WATER0), sudden: !!sn.sd,
        carves: [], girders: [], tops: sn.ops.map(o => o.slice()), later: [], sacc: 0,
        crates: sn.cr.map(([x, y, vy, l, p0, h, w]) => ({ x, y, vy, landed: !!l, para0: !!p0, health: !!h, wpn: WPN[w] ? w : null, gone: false })).map(c => (c.health || c.wpn ? c : Object.assign(c, { health: true }))),
        graves: sn.gr.filter(g => Array.isArray(g)).map(([x, y, team]) => ({ x: +x || 0, y: +y || 0, vx: 0, vy: 0, team: clamp(team | 0, 0, 3) })), P: [], phase: 'aim', timer: tt, retreat: 0, power: 0, charging: false,
        weapon: sn.wp, fuse: clamp(sn.fu | 0, 1, 5), shots: WPN[sn.wp].shots || 1, target: null, banner: null, sq: null, hurtSelf: false, endWait: 0, ai: null, over: false, turnTime: tt, arrow: 2.2, lastBeep: 99, crateDone: true,
        best: Array.isArray(sn.bh) ? { hit: Math.max(0, sn.bh[0] | 0), who: nclean(sn.bh[1], 14), team: clamp(sn.bh[2] | 0, -1, 3) } : { hit: 0, who: '', team: -1 }, terra: Math.max(0, sn.tr | 0) };
      M.teams = sn.tm.map((t, ti) => ({ name: nclean(t.n, 18) || 'Team ' + (ti + 1), cpu: !!t.cp, lvl: AIL[t.lv] ? t.lv : 'normal', col: clamp(t.c | 0, 0, 3), o: t.o | 0, out: !!t.out, next: clamp(t.nx | 0, 0, 3), last: WPN[t.l] ? t.l : 'bazooka',
        ammo: Object.fromEntries(ORDER.map((k, i) => [k, Math.max(-1, Math.min(9, t.am[i] | 0))])), stats: { dmg: t.st[0] | 0, kills: t.st[1] | 0, self: t.st[2] | 0, drown: t.st[3] | 0 },
        squigs: t.sq.map(([name, x, y, hp, dead, face, aim, last]) => ({ name: nclean(name, 14) || 'Jack', team: ti, x: +x, y: +y, vx: 0, vy: 0, hp: Math.max(0, hp | 0), dead: !!dead, air: false, face: face < 0 ? -1 : 1, aim: clamp(+aim, -1.5, 1.5), walk: 0, bubble: null, step: 0, blink: 0, last: Number.isInteger(last) ? last : -1 })) }));
      M.totalHp = Array.isArray(sn.th) && sn.th.length === M.teams.length ? sn.th.map(v => Math.max(1, +v || 100)) : M.teams.map(t => t.squigs.length * 100);
      const t = M.teams[M.cur]; M.sq = t.squigs[sn.sqi] && !t.squigs[sn.sqi].dead ? t.squigs[sn.sqi] : liveSquigs(t)[0] || null;
      if (!M.sq) M.phase = 'settle';
    }
    // big messages go in chunks: { k:'c', id, i, n, p }
    function sendT(sn, to) {
      const str = JSON.stringify(sn), id = nrid(), parts = [];
      for (let i = 0, size = 1100; i < str.length;) { let p = str.slice(i, i + size); while (JSON.stringify(p).length > 1300 && p.length > 200) p = p.slice(0, p.length - 100); parts.push(p); i += p.length; }
      parts.forEach((p, i) => NET.s.send({ k: 'c', id, i, n: parts.length, p }, to || undefined));
    }
    function chunkIn(d, from) {
      if (from !== NET.s.hostId || typeof d.id !== 'string' || !Number.isInteger(d.i) || !Number.isInteger(d.n) || d.n < 1 || d.n > 40 || d.i < 0 || d.i >= d.n || typeof d.p !== 'string') return;
      let c = NET.chunks.get(d.id);
      if (!c) { c = { n: d.n, got: new Array(d.n), cnt: 0, ts: Date.now() }; NET.chunks.set(d.id, c); if (NET.chunks.size > 12) NET.chunks.delete(NET.chunks.keys().next().value); }
      if (c.got[d.i] != null || c.n !== d.n) return;
      c.got[d.i] = d.p; c.cnt++;
      if (c.cnt < c.n) return;
      NET.chunks.delete(d.id);
      let sn = null; try { sn = JSON.parse(c.got.join('')); } catch (e) { return; }
      if (okSnap(sn)) onT(sn);
    }
    const tkey = (t, over) => t * 2 + (over ? 1 : 0);
    function onT(sn) {
      if (!NET) return;
      if (!M || M.attract || M.mid !== sn.mid || scene === 'lobby' || scene === 'title') return startT(sn);
      const theirs = tkey(sn.t, sn.over > -2), mine = tkey(M.turn, M.over);
      if (theirs <= mine) return; // that go (or an older one): we're on it already
      // a newer go while we're still watching this one: finish it (quickly) first, so nobody misses a bang
      if (!NET.waitT && !M.over && NET.ctrl !== myId() && theirs === mine + 2 - (sn.over > -2 ? 1 : 0)) { NET.pendT = sn; NET.pendAt = Date.now(); return; }
      startT(sn);
    }
    function startT(sn) {
      if (M && !M.attract && M.mid === sn.mid && M.teams && M.teams.length === sn.tm.length) { // how far our replay was off (testing: it should be 0)
        let d = 0; sn.tm.forEach((t, i) => t.sq.forEach((q, j) => { const m = M.teams[i].squigs[j]; if (m) d = Math.max(d, Math.abs(m.x - q[1]), Math.abs(m.y - q[2]), Math.abs(m.hp - q[3])); }));
        NET.diff = d; NET.opsSame = JSON.stringify(M.tops || []) === JSON.stringify(sn.ops);
      }
      NET.lastT = sn; NET.mid = sn.mid; NET.ph = sn.over > -2 ? 'end' : 'game';
      if (!NET.s.host) NET.s.round = sn.rd | 0;
      applySnap(sn);
      Object.assign(NET, { inp: { left: false, right: false, up: false, down: false }, lk: {}, queued: [], ev: [], evi: 0, step: 0, acc: 0, up: 0, done: false, ep: null, q: 0, log: [], myq: 0, myEp: nrid(), sentEv: 0, sentDone: false, lastSend: 0,
        lastRx: Date.now(), turnAt: Date.now(), pendT: null, waitT: false, skipAt: null, skipped: false, atB: false, lastPoll: 0, lastNeed: Date.now() });
      NET.pend.clear();
      inp.left = inp.right = inp.up = inp.down = false; walkAcc = 0;
      R = rng(sn.rs >>> 0);
      NET.ctrl = M.teams[M.cur].cpu ? NET.s.hostId : M.teams[M.cur].o; // the host's screen plays the computer's goes
      if (M.teams[M.cur].cpu && NET.s.host && M.sq && sn.over <= -2) M.ai = { state: 'think', t: AIL[M.teams[M.cur].lvl].think, walked: 0, lvl: M.teams[M.cur].lvl };
      if (NET.s.host) NET.s.save({ T: sn, lob: NET.lob }); else NET.s.save(); // (so a reload rejoins the war)
      buildBar();
      if (sn.over > -2) { gameOver(sn.over >= 0 && M.teams[sn.over] ? M.teams[sn.over] : null, sn.why === 'left' ? 'left' : ''); return; }
      const t = turnTeam(), s = M.sq, mine = NET.ctrl === myId() && !t.cpu, watching = !teamOf(myId());
      if (s) M.banner = { text: mine ? `YOUR GO! (${s.name})` : `${t.name}: ${s.name}${t.cpu ? ' (computer)' : ''}`, col: LABEL[t.col], t: 2.2 };
      sfx(mine ? 'join' : 'click');
      if (watching) secret('mp.squigwatch');
      G.status(`Online war · turn ${M.turn}${M.sudden ? ' · SUDDEN DEATH' : ''} · wind ${M.wind < 0 ? '←' : M.wind > 0 ? '→' : ''} ${Math.round(Math.abs(M.wind) * 100)} · ${mine ? 'YOUR GO!' : t.name + '\'s go'}${watching ? ' · you are watching' : ''}`);
      // batches for this go that turned up before its snapshot did
      const fut = NET.future.filter(b => b.t === M.turn); NET.future = NET.future.filter(b => b.t > M.turn);
      fut.forEach(b => batchIn(b, b._from));
      syncBar();
    }
    const secret = id => { try { Apps.secret(id); } catch (e) {} };
    // ---- the host: lobby, starting a war, what happens between goes, skipping a go
    function hostStart() {
      if (!NET || !NET.s.host) return;
      const ppl = people().slice(0, 4);
      if (ppl.length < 2) { G.msg('Jacks: Armageddon', 'You need at least two players for a war. Invite somebody!', 'info'); return; }
      const L = NET.lob;
      if (NET.mid) NET.s.round++;
      NET.mid = nrid(); NET.over = -2; NET.why = '';
      NET.s.announce();
      closeOverlay(); G.stopMusic(); mute = false;
      const nc = Math.min(L.cpu || 0, 4 - ppl.length), teams = ppl.map((p, i) => ({ name: nclean(p.nick, 18) || 'Player ' + (i + 1), cpu: false, col: i, squigs: PRESETS[i].squigs }));
      for (let i = 0; i < nc; i++) { const k = ppl.length + i; teams.push({ name: PRESETS[k].name + ' (CPU)', cpu: true, lvl: L.lv, col: k, squigs: PRESETS[k].squigs }); }
      newMatch({ teams, per: L.per, theme: L.th, turnTime: L.tt });
      M.mid = NET.mid; M.tops = []; M.cfg.online = 1;
      M.teams.forEach((t, i) => { t.o = i < ppl.length ? ppl[i].id : 0; t.out = false; });
      scene = 'game';
      netTurn();
    }
    function netTurn() {
      NET.rs = (Math.random() * 4294967295) >>> 0;
      startTurn();
      const sn = JSON.parse(JSON.stringify(snap()));
      sendT(sn); startT(sn);
    }
    function netBoundary() {
      if (!NET.s.host) { NET.waitT = true; NET.waitAt = Date.now(); syncBar(); return; }
      const result = () => {
        const live = M.teams.filter(t => liveSquigs(t).length), still = live.filter(t => !t.out);
        if (live.length <= 1) return [live.length ? M.teams.indexOf(live[0]) : -1, ''];
        if (still.length <= 1) return [still.length ? M.teams.indexOf(still[0]) : -1, 'left'];
        return [-2, ''];
      };
      let [over, why] = result();
      if (over === -2) {
        if (!M.sudden && M.turn >= M.teams.length * 7) { M.sudden = true; }
        if (M.sudden) { M.waterY = Math.max(260, M.waterY - 14); for (const t of M.teams) for (const q of t.squigs) if (!q.dead && q.y > M.waterY) drown(q); [over, why] = result(); }
        if (over === -2 && Math.random() < 0.4) dropCrate(); // it falls during the next go, the same on every screen
      }
      NET.over = over; NET.why = why;
      if (over > -2) { const sn = JSON.parse(JSON.stringify(snap())); sendT(sn); startT(sn); return; }
      netTurn();
    }
    function hostSkip(why) {
      if (!NET || !NET.s.host || NET.done || NET.skipAt != null || !M || M.over || NET.ctrl === myId()) return;
      const at = Math.max(NET.step, NET.up === Infinity ? NET.step : NET.up);
      NET.skipAt = at; if (NET.up !== Infinity) NET.up = Math.max(NET.up, at);
      NET.s.send({ k: 'sk', t: M.turn, at });
      M.banner = { text: `${nickOf(NET.ctrl)}'s go was skipped (${why === 'left' ? 'they left' : 'no connection'})`, col: '#fff', t: 2.6 };
    }
    function skipIn(d) {
      if (!M || d.t !== M.turn || !Number.isInteger(d.at) || NET.skipAt != null || NET.done && NET.ctrl !== myId()) return;
      if (NET.ctrl === myId()) { NET.skipped = true; NET.evi = NET.ev.length; NET.up = Math.max(NET.step, d.at); M.banner = { text: 'Your connection dropped, so your go was skipped. Sorry!', col: '#fff', t: 3 }; syncBar(); }
      NET.skipAt = d.at; if (NET.up !== Infinity) NET.up = Math.max(NET.up, d.at);
    }
    function netOut(id) { // a player left (or never came back)
      if (NET.ph === 'lobby') { netPushLobby(); if (scene === 'lobby') netLobby(); return; }
      const t = teamOf(id); if (!t || t.out) return;
      t.out = true; t.cpu = true; t.lvl = 'normal';
      if (M && !M.over) M.banner = { text: `${t.name} has left: the computer is playing their jacks`, col: '#fff', t: 3 };
      if (NET.ctrl === id && !NET.done) hostSkip('left');
    }
    function netPushLobby() { if (NET && NET.s.host) NET.s.send({ k: 'lob', lob: NET.lob }); }
    const okLob = l => ({ per: l && l.per === 4 ? 4 : 3, th: l && (THEMES[l.th] || l.th === 'random') ? l.th : 'random', tt: l && [30, 45, 60, 90].includes(l.tt) ? l.tt : 45, cpu: l && [0, 1, 2].includes(l.cpu) ? l.cpu : 0, lv: l && AIL[l.lv] ? l.lv : 'normal' });
    function netCatchUp(id) { if (NET && NET.lastT && NET.ph !== 'lobby') sendT(NET.lastT, id); }
    // ---- whoever's go it is: send what was pressed
    function ctlFlush() {
      if (!Net.connected || NET.sentDone || !NET.s.others().length) return;
      const now = Date.now(), iv = 250 + 100 * NET.s.others().length, pending = NET.ev.length - NET.sentEv, needDone = NET.done;
      if (!needDone && now - NET.lastSend < iv && pending < 30) return;
      NET.lastSend = now;
      let ev = NET.ev.slice(NET.sentEv); NET.sentEv = NET.ev.length;
      const push = x => { const b = Object.assign({ k: 'i', t: M.turn, ep: NET.myEp, q: NET.myq++, qn: 1 }, x); NET.log.push(b); NET.s.send(b); };
      while (ev.length > 60) { const part = ev.slice(0, 60); ev = ev.slice(60); push({ e: part, up: ev[0][0], d: 0 }); }
      push({ e: ev, up: NET.step, d: needDone ? 1 : 0 }); if (needDone) NET.sentDone = true;
    }
    function resendTo(d, from) { // somebody missed some: send them again (several batches squashed together where they fit)
      if (!M || NET.ctrl !== myId() || d.t !== M.turn || !NET.log.length) return;
      const t = Date.now(); NET.rsT = NET.rsT || {}; if (t - (NET.rsT[from] || 0) < 700) return; NET.rsT[from] = t;
      let q = d.ep === NET.myEp ? Math.max(0, d.q | 0) : 0, sent = 0;
      while (q < NET.log.length && sent < 10) {
        let e = [], up = 0, dn = 0, n = 0;
        while (q + n < NET.log.length && e.length + NET.log[q + n].e.length <= 60 && n < 30) { const b = NET.log[q + n]; e = e.concat(b.e); up = b.up; dn = b.d; n++; }
        if (!n) { const b = NET.log[q]; e = b.e; up = b.up; dn = b.d; n = 1; }
        NET.s.send({ k: 'i', t: M.turn, ep: NET.myEp, q, qn: n, e, up, d: dn }, from);
        q += n; sent++;
      }
    }
    // ---- everybody else: take the presses in, in order
    function batchIn(b, from) {
      if (!M || M.attract || !Number.isInteger(b.t) || !Number.isInteger(b.q) || b.q < 0 || !Array.isArray(b.e) || b.e.length > 60 || typeof b.ep !== 'string') return;
      if (b.t > M.turn) { b._from = from; if (NET.future.length < 60) NET.future.push(b); return; }
      if (b.t < M.turn || from !== NET.ctrl || from === myId() || M.over || NET.ph !== 'game') return;
      if (NET.ep !== b.ep) {
        if (NET.ep === null) NET.ep = b.ep;
        else { restartGo(b.ep); } // they started their go again (a reload): so do we
      }
      NET.lastRx = Date.now();
      if (b.q < NET.q) return;
      NET.pend.set(b.q, b);
      while (NET.pend.has(NET.q)) {
        const x = NET.pend.get(NET.q); NET.pend.delete(NET.q); NET.q += Math.max(1, Math.min(30, x.qn | 0));
        for (const e of x.e) if (Array.isArray(e) && Number.isInteger(e[0]) && e[0] >= NET.step && typeof e[1] === 'string') NET.ev.push(e);
        if (x.d) NET.up = Infinity; else if (Number.isInteger(x.up) && NET.up !== Infinity) NET.up = Math.max(NET.up, x.up);
      }
      if (NET.pend.size) askResend();
    }
    function askResend() {
      const t = Date.now(); if (t - (NET.askT || 0) < 1200 || !NET.ctrl || NET.ctrl === myId()) return; NET.askT = t;
      NET.s.send({ k: 'ir', t: M.turn, ep: NET.ep || '', q: NET.q }, NET.ctrl);
    }
    function restartGo(ep) { const sn = NET.lastT; if (!sn) return; startT(sn); NET.ep = ep; }
    // ---- the loop, online
    function netFrame(dt) {
      NET.lastFrame = performance.now();
      const meCtl = NET.ctrl === myId() && !NET.skipped;
      if (NET.pendT && (NET.waitT || M.over || Date.now() - NET.pendAt > 3000 || (!meCtl && NET.up !== Infinity && NET.step >= NET.up))) { const sn = NET.pendT; NET.pendT = null; startT(sn); }
      // our own go, and our line has dropped: everybody else is stuck waiting for us anyway, so the clock stops too
      const frozen = meCtl && !Net.connected && !NET.done;
      if (!M.over && !NET.waitT && NET.ph === 'game' && !frozen) {
        const behind = NET.up === Infinity ? 0 : NET.up - NET.step;
        const speed = meCtl ? 1 : NET.pendT ? 4 : behind > 90 ? 3 : behind > 30 ? 1.6 : 1;
        NET.acc = Math.min(NET.acc + dt * speed, 1);
        let n = 0;
        while (NET.acc >= STEP && n < 60) {
          if (NET.skipAt != null && NET.step >= NET.skipAt) { NET.skipAt = null; NET.up = Infinity; NET.done = true; endTurnNow(); }
          if (!meCtl && NET.step >= NET.up) { NET.acc = 0; break; }
          NET.acc -= STEP; n++;
          if (meCtl && !NET.done) { for (const e of NET.queued) { e[0] = NET.step; NET.ev.push(e); applyEv(e[1], e[2]); } NET.queued.length = 0; }
          else while (NET.evi < NET.ev.length && NET.ev[NET.evi][0] <= NET.step) { const e = NET.ev[NET.evi++]; applyEv(e[1], e[2]); }
          logic(STEP);
          NET.step++;
          if (meCtl && !NET.done && M.phase !== 'aim' && M.phase !== 'retreat') { NET.done = true; syncBar(); }
          if (NET.atB) break;
        }
        if (NET.atB) { NET.atB = false; netBoundary(); }
        if (meCtl && NET.ph === 'game') ctlFlush();
      }
      netWatch();
      fx(dt); draw();
    }
    function netWatch() {
      if (!NET || !M) return;
      const now = Date.now(), s = NET.s, meCtl = NET.ctrl === myId() && !NET.skipped;
      // stuck waiting for presses: ask again
      if (NET.ph === 'game' && !meCtl && !NET.waitT && !M.over && NET.up !== Infinity && NET.step >= NET.up && now - NET.lastRx > 2000) askResend();
      // stuck between goes: ask the host for the next snapshot
      if (!s.host && (NET.waitT || NET.ph !== 'lobby' && !NET.lastT) && now - NET.lastNeed > 4000 && Net.connected) { NET.lastNeed = now; s.need(); }
      // the host: a player who has dropped off (or gone quiet) on their go gets skipped
      if (s.host && NET.ph === 'game' && !meCtl && !NET.done && NET.skipAt == null && !M.over && Net.connected && now - (NET.backAt || 0) > 8000) {
        const c = NET.ctrl, idle = now - Math.max(NET.lastRx, NET.turnAt);
        if (s.gone.has(c) || s.left.has(c)) hostSkip('left');
        else if (((s.lost.has(c) || !zOn(c)) && idle > SKIP_MS) || idle > STALE_MS) hostSkip('lost');
      }
    }
    function netHud(t) {
      const tm = M.teams[M.cur], meCtl = NET.ctrl === myId() && !NET.skipped, mine = meCtl && tm && !tm.cpu, watching = !teamOf(myId()), now = Date.now();
      ctx.font = 'bold 9px Arial';
      const top = M.over ? '' : mine ? 'YOUR GO!' : `${watching ? 'WATCHING: ' : ''}${tm ? tm.name : ''}'s go`;
      if (top) { const w = ctx.measureText(top).width; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(4, 3, w + 6, 12); ctx.fillStyle = mine ? '#ffe000' : tm ? LABEL[tm.col] : '#fff'; ctx.fillText(top, 7, 12); }
      // connection trouble: a big box in the middle with a countdown
      let html = '';
      if (!Net.connected) html = meCtl && !NET.done && !M.over ? '<b>CONNECTION LOST</b>Your go is paused while we redial...<small>Everybody else is waiting for you. Hang on!</small>' : '<b>CONNECTION LOST</b>Redialling JackNet...<small>The war carries on when you\'re back.</small>';
      else if (NET.waitT && now - NET.waitAt > 2500) html = `<b>PLEASE WAIT</b>Waiting for ${esc(nickOf(NET.s.hostId))} (the host)...`;
      else if (!M.over && !meCtl && !NET.waitT && NET.up !== Infinity && NET.step >= NET.up && now - NET.lastRx > 1500) {
        const idle = now - Math.max(NET.lastRx, NET.turnAt), lost = NET.s.lost.has(NET.ctrl) || !zOn(NET.ctrl), left = Math.max(0, Math.ceil((SKIP_MS - idle) / 1000));
        if (lost) html = `<b>${esc(nickOf(NET.ctrl)).toUpperCase()}'S CONNECTION DROPPED</b><div class="n">${left}</div>Waiting for them to come back...<small>${left ? 'If they don\'t, their go gets skipped.' : 'Skipping their go...'}</small>`;
        else if (now - NET.lastRx > 4000) html = `<b>PLEASE WAIT</b>Waiting for ${esc(nickOf(NET.ctrl))}...`;
      }
      dropPanel(html);
    }
    function dropPanel(html) {
      let d = viewEl.querySelector('.dg-squigs-drop');
      if (!html) { if (d) d.remove(); return; }
      if (!d) { d = el('', 'dg-squigs-drop'); d.setAttribute('role', 'status'); viewEl.appendChild(d); }
      if (d._h !== html) { d._h = html; d.innerHTML = html; }
    }
    // ---- the lobby (inside the game window) and the end
    function netLobby() {
      if (!NET) return;
      scene = 'lobby'; syncBar(); TR.hide(); dropPanel('');
      if (!M || !M.attract) attract();
      mute = true;
      const s = NET.s, ppl = people(), L = NET.lob, host = s.host, nc = Math.min(L.cpu || 0, Math.max(0, 4 - ppl.length));
      const rows = ppl.map((p, i) => `<div class="dg-squigs-row"><span class="dg-squigs-sw" style="background:${i < 4 ? BODY[i] : '#555'}"></span><b>${esc(p.nick)}</b>${p.id === s.hostId ? ' <small>(host)</small>' : ''}${p.id === myId() ? ' <small>(you)</small>' : ''}${i >= 4 ? ' <small>(watching: four teams max)</small>' : ''}${s.lost.has(p.id) ? ' <small style="color:#ffb000">reconnecting...</small>' : ''}</div>`).join('')
        + Array.from({ length: nc }, (x, i) => `<div class="dg-squigs-row"><span class="dg-squigs-sw" style="background:${BODY[ppl.length + i]}"></span><b>${esc(PRESETS[ppl.length + i].name)}</b> <small>(computer, ${AIL[L.lv].n})</small></div>`).join('');
      const sel = (cls, opts, cur) => `<select class="${cls}">${opts.map(([v, n]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
      const isl = L.th === 'random' ? 'A random island' : THEMES[L.th].n;
      const o = overlay(`<div class="dg-squigs-panel"><h3>ONLINE WAR</h3><p>Everybody gets a team of jacks, and the goes go round over JackNet. Anybody who turns up after the start gets to watch.</p>${rows}
        ${host ? `<div class="dg-squigs-row">Island: ${sel('th', [['random', 'Random']].concat(Object.keys(THEMES).map(k => [k, THEMES[k].n])), L.th)} Jacks: ${sel('per', [[3, '3'], [4, '4']], L.per)} Goes: ${sel('tt', [[30, '30s'], [45, '45s'], [60, '60s'], [90, '90s']], L.tt)}</div>
          <div class="dg-squigs-row">Computer teams: ${sel('cpu', [[0, 'None'], [1, 'One'], [2, 'Two']], L.cpu)} ${sel('lv', Object.keys(AIL).map(k => [k, AIL[k].n]), L.lv)}</div>
          <p style="font-size:11px;color:#ccc">${ppl.length < 2 ? 'Waiting for somebody to join... (Invite someone!)' : 'Ready when you are, general.'}</p><div class="dg-squigs-lob" style="display:none"></div>`
          : `<p style="color:#ffe000">${esc(isl)} &middot; ${L.per} jacks each &middot; ${L.tt} second goes${nc ? ` &middot; ${nc} computer team${nc > 1 ? 's' : ''}` : ''}<br>Waiting for ${esc(s.nick(s.hostId))} to start the war...</p>`}
        <div class="dg-squigs-btns"></div></div>`, true);
      const bt = o.querySelector('.dg-squigs-btns');
      if (host) {
        o.querySelectorAll('select').forEach(x => on(x, 'change', () => { NET.lob = okLob({ th: o.querySelector('.th').value, per: +o.querySelector('.per').value, tt: +o.querySelector('.tt').value, cpu: +o.querySelector('.cpu').value, lv: o.querySelector('.lv').value }); netPushLobby(); netLobby(); }));
        const go = btn('START THE WAR!', hostStart, 'big go'); if (ppl.length < 2) go.disabled = true;
        bt.append(go, btn('Invite someone', () => { if (window.MP) MP.pick('squigs.online'); }), btn('Leave', netLeave));
        lobbySeekers(o.querySelector('.dg-squigs-lob'));
      } else bt.append(btn('Leave', netLeave));
      G.status(host ? `Online war lobby · ${ppl.length} player${ppl.length === 1 ? '' : 's'}` : `Online war lobby · ${s.nick(s.hostId)} is the host`);
    }
    // the host's lobby: people elsewhere on JackNet who've put their name up for a war get an Invite button
    function lobbySeekers(box) {
      if (!box || !window.MP || !MP.now || !NET) return;
      const inRoster = new Set(NET.s.roster.map(p => p.id)), seeks = (MP.now.seeks || []).filter(x => x.g === 'squigs.online' && !inRoster.has(x.id) && x.id !== myId());
      if (!seeks.length) { box.style.display = 'none'; return; }
      box.style.display = ''; box.innerHTML = '<span>Looking for a war:</span>';
      seeks.slice(0, 4).forEach(x => box.appendChild(btn(`Invite ${x.nick}`, () => MP.invite({ id: x.id, nick: x.nick }, 'squigs.online', {}))));
    }
    if (window.MP && MP.onNow) { const off = MP.onNow(() => { if (scene === 'lobby' && NET && NET.s.host) lobbySeekers(ovl.querySelector('.dg-squigs-lob')); }); G.onClose(() => { try { off(); } catch (e) {} }); }
    function netOver(winner, why) {
      NET.ph = 'end';
      const mine = !!winner && winner.o === myId();
      G.status(winner ? `Online war over: ${winner.name} win${why === 'left' ? 's (everybody else left)' : 's'}!` : 'Online war over: a draw!');
      if (winner) { liveSquigs(winner).forEach(q => say(q, 'Yesss!')); sfx(mine ? 'solve' : 'uhoh'); }
      if (mine) { secret('mp.squigs'); G.secret('squigs.win'); }
      if (teamOf(myId())) Net.send({ t: 'mpResult', sid: NET.s.rsid(), w: winner ? winner.o : 0 });
    }
    function netEndButtons(bt) {
      const s = NET.s;
      if (s.host) bt.append(btn('Rematch', () => { if (people().length < 2) G.msg('Jacks: Armageddon', 'Everybody else has gone home!', 'info'); else hostStart(); }), btn('Back to the lobby', () => { NET.ph = 'lobby'; netPushLobby(); netLobby(); }), btn('Leave', netLeave));
      else { const p = el(`Waiting for ${esc(s.nick(s.hostId))} to start a rematch...`, '', 'p'); p.style.cssText = 'width:100%;text-align:center;color:#ffe000;margin:0'; bt.append(p, btn('Leave', netLeave)); }
    }
    function netLeave() { if (NET && NET.s && !NET.s.ended) NET.s.leave(); else netClosed(''); }
    function netClosed(why) {
      NET = null; R = Math.random; dropPanel('');
      inp.left = inp.right = inp.up = inp.down = false;
      if (!alive) return;
      titleScreen();
      if (why && why !== 'You left the game.') G.toast('Jacks: Armageddon', why, 4000);
    }
    function netSession(s) {
      if (NET && NET.s !== s && !NET.s.ended) NET.s.leave(true);
      NET = { s, ph: 'lobby', lob: okLob(null), mid: '', inp: { left: false, right: false, up: false, down: false }, lk: {}, queued: [], ev: [], evi: 0, step: 0, acc: 0, up: 0, done: false, ctrl: 0, ep: null, q: 0, pend: new Map(), log: [], myq: 0, myEp: nrid(),
        sentEv: 0, sentDone: false, lastSend: 0, lastRx: 0, turnAt: 0, lastT: null, pendT: null, waitT: false, waitAt: 0, skipAt: null, skipped: false, atB: false, chunks: new Map(), future: [], rs: 1, over: -2, why: '', lastNeed: 0, backAt: 0 };
      const mineS = () => NET && NET.s === s;
      s.on('m', (d, from) => {
        if (!mineS() || !d || typeof d !== 'object') return;
        if (d.k === 'c') chunkIn(d, from);
        else if (d.k === 'i') batchIn(d, from);
        else if (d.k === 'ir') resendTo(d, from);
        else if (d.k === 'sk') { if (from === s.hostId) skipIn(d); }
        else if (d.k === 'lob') { if (from === s.hostId && !s.host) { NET.lob = okLob(d.lob); if (scene === 'lobby' || NET.ph === 'lobby') { NET.ph = 'lobby'; netLobby(); } } }
      });
      s.on('state', st => { // the host answering "where are we?" (the snapshot itself follows in chunks)
        if (!mineS() || !st || typeof st !== 'object') return;
        NET.lob = okLob(st.lob);
        if (st.ph === 'lobby') { NET.ph = 'lobby'; netLobby(); }
        else if (!M || M.attract) { const o = overlay(`<div class="dg-squigs-panel" style="max-width:320px;text-align:center"><h3>JOINING THE WAR</h3><p>Downloading the island at 3.6 KB/sec...</p></div>`, true); void o; }
      });
      s.on('roster', () => { if (!mineS()) return; if (s.host && NET.ph === 'lobby') netPushLobby(); if (scene === 'lobby') netLobby(); });
      s.on('lost', () => { if (mineS() && scene === 'lobby') netLobby(); });
      s.on('back', () => { if (mineS() && scene === 'lobby') netLobby(); });
      s.on('online', () => { if (mineS()) NET.backAt = Date.now(); });
      const out = id => { if (!mineS()) return; if (id === s.hostId) { s.end(`${s.nick(id)} (the host) has gone, so the war is over.`); return; } if (s.host) netOut(id); else if (scene === 'lobby') netLobby(); };
      s.on('gone', out); s.on('left', out);
      s.on('end', why => { if (mineS()) netClosed(why); });
      if (s.host) {
        s.state(id => { setTimeout(() => { if (mineS()) netCatchUp(id); }, 0); return { ph: NET.ph, lob: NET.lob }; });
        if (s.resumed && s.saved && s.saved.T && okSnap(s.saved.T)) { NET.lob = okLob(s.saved.lob); NET.mid = s.saved.T.mid; NET.over = s.saved.T.over; startT(s.saved.T); }
        else netLobby();
      } else { netLobby(); s.save(); setTimeout(() => { if (mineS()) s.need(); }, 200); }
    }
    if (window.MP) MP.hook('mp.squigs', G.w, { session: s => netSession(s) });
    // a hidden tab (or a minimised window) gets no animation frames: keep the war going anyway, so nobody waits for us
    G.every(() => { if (!NET || !M || M.attract || scene !== 'game') return; const t = performance.now(); if (t - (NET.lastFrame || 0) > 450) netFrame(Math.min(1, (t - (NET.lastFrame || t)) / 1000)); }, 250);

    // ================================================================ menus + go
    G.menu([
      ['Game', () => NET ? [
        { label: 'Online war menu...', act: pauseMenu, dis: scene !== 'game' },
        { label: 'Invite someone...', act: () => MP.pick('squigs.online') },
        { label: 'Leave the online war', act: netLeave },
        '-',
        { label: 'Exit', act: () => G.quit() },
      ] : [
        { label: 'New Game', key: 'F2', act: () => G.demo ? startDemo() : newGameAsk() },
        ...(window.MP && !G.demo ? [{ label: 'Play Online', act: playOnline }, { label: 'Invite someone... (online)', act: () => MP.pick('squigs.online') }] : []),
        { label: 'Basic Training', act: () => TR.start() },
        { label: 'Island Maker', act: () => makerOpen(), dis: !!G.demo },
        '-',
        { label: 'Load Game...', act: loadScreen, dis: !!G.demo },
        { label: 'Save Game...', act: saveScreen, dis: scene !== 'game' || !!G.demo || !M || M.training || !!M.attract },
        { label: 'Quit to Title', act: titleScreen, dis: scene === 'title' },
        '-',
        { label: 'Exit', act: () => G.quit() },
      ]],
      ['Options', () => [
        ...[30, 45, 60, 90].map(v => ({ label: `Turn time: ${v} seconds`, rad: OPT.turn === v, act: () => { OPT.turn = v; G.save('opt', OPT); } })),
        '-',
        { label: 'Speech bubbles', chk: OPT.bubbles, act: () => { OPT.bubbles = !OPT.bubbles; G.save('opt', OPT); } },
        { label: 'Sound', chk: G.sound, act: () => { try { Sound.on = !Sound.on; } catch (e) {} } },
        { label: 'More options...', act: optionsScreen, dis: !!NET || scene === 'game' || scene === 'maker' },
      ]],
      ['Help', [
        { label: 'How to Play', act: () => helpScreen('play') },
        { label: 'Keys', key: 'F1', act: () => helpScreen('keys') },
        { label: 'Weapons Guide', act: () => helpScreen('weapons') },
        { label: 'Basic Training', act: () => { if (!NET) TR.start(); }, dis: !!NET },
        '-',
        { label: 'Islands on JackNet...', act: showIslands, dis: !!G.demo },
        { label: 'About Jacks: Armageddon', act: () => G.about() },
      ]],
    ]);
    on(document, 'keydown', ev => { if (ev.key === 'F2' && G.focused() && !NET) { ev.preventDefault(); G.demo ? startDemo() : newGameAsk(); } });
    G.onClose(() => { NET = null; });
    // the carry-on save (a refresh, a closed window or a Shut Down): the start of the current go, back on the pause menu
    let asSnap;
    const AS = G.autosave(() => asSnap, { live: false, every: 0 });
    G._sq = { get M() { return M; }, get NET() { return NET; }, get MK() { return MK; }, TR, begin, fire, press, act, setKey, weaponMenu, hostStart, startTurn, titleScreen, setupScreen, makerOpen, makerMenu, mkPlay, showIslands, visitIsland, newGameAsk, pauseMenu, get scene() { return scene; }, get cam() { return cam; }, VW, VH, sim: (face, aim, pw, k) => simShot(M.sq, face, aim, pw, k || M.weapon, M.wind) }; // for testing
    buildBar();
    titleScreen();
    { const d = AS.load();
      if (d && d.teams && d.carves && !NET) {
        try { restore(d); pauseMenu(); G.toast('Jacks: Armageddon', 'Welcome back! The war is just as you left it, at the start of that go.', 4000); }
        catch (e) { console.error(e); AS.clear(); titleScreen(); }
      } }
    const stop = G.loop(dt => { if (alive) update(dt); });
    offs.push(stop);
  });
})();

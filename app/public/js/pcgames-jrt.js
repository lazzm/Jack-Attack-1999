/* pcgames-jrt: JACKREAL TOURNAMENT (JRT.EXE), an arena shooter in the late-1999 style, and the same arena client wearing
 * JAQUAKE's rusty clothes for JAQUAKE deathmatch and co-op. Practice Sessions against bots with names, skills and taunts;
 * DeathMatch, Capture the Flag and (JAQUAKE) co-op monster waves; the announcer (written on screen, synthesised beeps, no
 * voices); Tab scoreboard; the end-of-match map vote; online games between real visitors through mods/arena.js: the
 * [JackNet] 24/7 public servers, PLAY ONLINE NOW (quick match), a JackSpy-style server browser, LAN games, spectating,
 * weekly and all-time frag rankings. The JRT demo (before 22 November 1999) has two maps and a nag.
 * Written from scratch for jacklm.com: a parody, not anybody's real game. */
(function () {
  'use strict';
  const E = PCG.engine, T = E.T, AR = window.PCGArena, sfx = E.sfx, clamp = E.clamp, esc = Apps.esc, font = E.font;
  const VERSION = '4.05', JQV = '1.06';
  const SKILLS = ['Novice', 'Average', 'Skilled', 'Masterful', 'Godlike'];
  const TEAMC = ['#ff3a2a', '#3a7aff'], TEAMH = [0xd83020, 0x2a5ae8];
  const DMCOL = [0x2a9a3a, 0xd8a020, 0x9a3ad8, 0x2ab8c8, 0xd85a20, 0x808890, 0xe86aa0, 0x6a8a2a, 0xc0c0d0];
  const JQCOL = [0x7a5a3a, 0x5a6a3a, 0x8a3a2a, 0x3a4a6a, 0x6a6a6a, 0x8a6a2a, 0x5a3a5a, 0x2a5a4a, 0x9a8a6a];
  const BOTS = [['Callum', 4, ['Too easy.', 'That\'s what a 504 MHz PC does for you.', 'Get a Hoodoo3, mate.', 'GG. Well, G for me.', 'I wasn\'t even trying.', 'Overclocked AND overskilled.']],
    ['JackK', 3, ['Two Jacks, one winner. The one with the K.', 'Oi! That was MY health pack!', 'K is for KAPOW.', 'Nice try, Jack-without-a-K.']],
    ['Luke', 2, ['This would be better on the ULTRA 64.', 'Where\'s the Rumble Pouch?', 'I\'m only using one hand. Other one\'s on my crisps.', 'Can we play Kart Kaos after?']],
    ['Dave', 1, ['Which button is jump?', 'Is this Goldenballs?', 'LAG! That was LAG!', 'I want to be on Callum\'s team.', 'The ULTRA 64 controller is better than a mouse.']],
    ['Jumping Jack', 2, ['Boing!', 'Can\'t catch me!', 'Jump pads are my best friends.', 'Can I have a biscuit now?']],
    ['Spudgun', 2, ['Spuds away!', 'You got mashed.', 'Chips!']],
    ['Jack Frost', 3, ['Chilly, isn\'t it?', 'Ice to meet you.', 'Cool.']],
    ['Dial-Up Dan', 1, ['Sorry, Mom picked up the phone.', 'brb modem', 'Is it me or is it slow?']],
    ['Nan\'s Cat', 2, ['Mrrrow.', 'Purrrr.', '*knocks your PC off the desk*']],
    ['Jack-in-the-Box', 3, ['Surprise!', 'Pop goes the weasel!', 'Boing.']],
    ['Lagmonster', 1, ['I was on 400 ping!', 'teleporting... sorry']],
    ['Y2K Bug', 3, ['01/01/00 ... 01/01/00 ...', 'Your clock is wrong.', 'Have you patched your BIOS?']]];
  // Callum's mate Jack plays as JackK (servers that still list him under his old bot name get the new one on screen)
  const botNick = n => n === 'Other' + ' Jack' ? 'JackK' : n;
  const KILLV = {
    jrt: [['was jackhammered by', ''], ['was plinked by', '\'s Jack Pistol'], ['got shocked by', ''], ['was rattled by', ''], ['was shredded by', '\'s Flak Jack'], ['rode', '\'s rocket']],
    jq: [['was jackhammered by', ''], ['ate', '\'s boomstick'], ['was riveted by', ''], ['rode', '\'s rocket'], ['was chomped by', ''], ['was zapped by', ''], ['was blown up by', '']],
  };
  const KILLA = [['got shoved over by', '\'s Jackhammer'], ['was peppered by', '\'s Jack Pistol'], ['got COMBO\'d by', ''], ['was rattled flat by', ''], ['caught', '\'s flak shell'], ['tripped over', '\'s grenade']]; // alt fire
  const TIPS = {
    jrt: ['Press a direction key twice, quickly, to DODGE. Callum does it all the time. It is very annoying.', 'Jump pads fire you at the high ground. Steer in the air to land where you want.', 'The Shock Jack is best from far away. Rattler up close. Flak Jack when they\'re in your face.',
      'Hold TAB to see the scores. Press Y to talk (be nice).', 'Jack Juice doubles your damage for 30 seconds. Everybody will be after you.', 'The Shield Belt soaks up most of a hit. Pick it up before Callum does.',
      'Rocket Jack splash hurts you too. Don\'t shoot the wall you are hugging.', 'In Capture the Flag, your flag has to be at home before you can score.', 'Tabbed out? Your place on a server is kept for two minutes.',
      'A grey name on the scoreboard is away from the keyboard. Shots on them don\'t count. Be a sport.', 'The [JackNet] servers are on 24/7. If nobody\'s there, the bots will keep you company.', 'At the end of each match you vote for the next map. Press 1, 2 or 3.',
      'RIGHT click is ALT FIRE. Every gun has one. Try the Shock Jack\'s slow ball, then shoot the ball with the beam. KA-BOOM.', 'The Tournament Ladder starts with Dave. It ends with Callum. Good luck.',
      'Hit the floor with the Impact Jackhammer and it throws you up in the air: a HAMMER JUMP.', 'Flak bits bounce off walls. So do grenades. So does Dave, when he falls off the space station.',
      'Press ` for the console. Type HELP. Do not type GLDQD. That\'s a different game.', 'Options lets you pick your HUD colour and your crosshair. Callum uses purple. Of course he does.'],
    jq: ['Rocket jump: look down, jump and fire Rocket Jack at the same time. You fly. It hurts a bit.', 'The Boomstick fires seven pellets. Get close.', 'Rivets fly. Lead your target a little.',
      'Lava hurts. Slime hurts a bit. Water is fine. Mom says stay out of all three.', 'QUAD JACK hits four times as hard. Everyone will be after you.', 'Yellow Scrap Armour soaks up more than Green Tin Armour.',
      'The Mega Pie takes you over 100 health. It wears off slowly.', 'Co-op: stick together. The robots can\'t count, but they can aim.', 'Tabbed out? Your place on a server is kept for two minutes.',
      'Press ` for the console in single player. In deathmatch it just makes you look clever.', 'At the end of each match you vote for the next map. Press 1, 2 or 3.'],
  };
  // JRT's own sound effects (synthesised, original): punchier guns for the quicker fire rates, the shock combo, grenades
  const tone = E.tone, noise = E.noise, jlast = {};
  const JSFX = {
    spanner(k) { noise(0.1, 0.35 * k, 900, 0, 'bandpass', 300); tone(110, 0.12, 'square', 0.14 * k, 0, 60); tone(1800, 0.03, 'square', 0.05 * k, 0.02); },
    spanner2(k) { noise(0.25, 0.4 * k, 600, 0, 'lowpass', 120); tone(70, 0.25, 'sine', 0.3 * k, 0, 40); },
    enforza(k) { noise(0.07, 0.4 * k, 4200, 0, 'highpass'); tone(980, 0.05, 'square', 0.1 * k, 0, 220); noise(0.12, 0.25 * k, 900, 0.01, 'lowpass', 200); },
    enforza2(k) { noise(0.05, 0.32 * k, 3800, 0, 'highpass'); tone(820, 0.04, 'square', 0.08 * k, 0, 260); },
    shokka(k) { tone(1500, 0.32, 'sawtooth', 0.11 * k, 0, 160); tone(760, 0.28, 'square', 0.06 * k, 0.01, 90); noise(0.18, 0.2 * k, 5000, 0, 'highpass'); },
    shokka2(k) { tone(260, 0.35, 'sine', 0.2 * k, 0, 820); tone(520, 0.3, 'triangle', 0.08 * k, 0.02, 1200); noise(0.2, 0.08 * k, 2400, 0, 'bandpass'); },
    dakka(k) { noise(0.045, 0.32 * k, 2600, 0, 'lowpass'); tone(150, 0.03, 'square', 0.07 * k, 0, 90); },
    dakka2(k) { noise(0.035, 0.3 * k, 3200, 0, 'lowpass'); tone(190, 0.025, 'square', 0.06 * k, 0, 110); },
    flak(k) { noise(0.32, 0.55 * k, 1600, 0, 'lowpass', 180); tone(95, 0.18, 'square', 0.18 * k, 0, 45); noise(0.05, 0.2 * k, 5000, 0, 'highpass'); },
    flak2(k) { tone(210, 0.16, 'square', 0.16 * k, 0, 70); noise(0.2, 0.3 * k, 700, 0, 'lowpass', 150); },
    rokkit(k) { noise(0.55, 0.32 * k, 380, 0, 'bandpass', 2200); tone(85, 0.25, 'sawtooth', 0.12 * k, 0, 50); },
    rokkit2(k) { tone(420, 0.1, 'triangle', 0.16 * k, 0, 230); noise(0.12, 0.2 * k, 900, 0, 'lowpass'); },
    bounce(k) { tone(640, 0.04, 'triangle', 0.1 * k, 0, 420); },
    zap(k) { tone(1200, 0.25, 'sawtooth', 0.12 * k, 0, 120); noise(0.3, 0.25 * k, 3000, 0, 'bandpass', 400); },
    combo(k) { noise(1.1, 0.75 * k, 1400, 0, 'lowpass', 60); tone(60, 0.9, 'sine', 0.45 * k, 0, 28); tone(300, 0.6, 'sawtooth', 0.12 * k, 0, 2400); },
    respawn2(k) { [523, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.12 * k, i * 0.05)); noise(0.4, 0.12 * k, 6000, 0, 'highpass', 1500); },
    item(k) { tone(1320, 0.06, 'triangle', 0.1 * k); tone(1760, 0.09, 'triangle', 0.08 * k, 0.05); },
  };
  function jsfx(name, gap, k) {
    if (!JSFX[name]) return sfx(name, gap);
    if (!window.Sound || !Sound.on) return;
    const now = performance.now(); if (jlast[name] && now - jlast[name] < (gap || 30)) return; jlast[name] = now;
    try { JSFX[name](k == null ? 1 : k); } catch (e) {}
  }
  const MAPLOOK = { pie: 'health', mega: 'mega', armour1: 'armour1', armour2: 'armour2', quad: 'waaagh', shells: 'shells', rivets: 'teef', rockets: 'rokkits', rivetgun: 'teefgun', launcher: 'launcher' };
  E.css('jrt', `
.jrt-ui{position:absolute;inset:0;z-index:5;font:12px Tahoma,Verdana,sans-serif;color:#e8e0c0;overflow:hidden}
.jrt-ui *{box-sizing:border-box}
.jrt-bar{position:absolute;left:0;right:0;top:0;height:22px;background:linear-gradient(#3a3a48,#14141c);border-bottom:1px solid #8a7a3a;display:flex;gap:2px;padding:2px 6px;z-index:3}
.jrt-bar button{background:none;border:0;color:#e8d080;font:bold 11px Tahoma,sans-serif;padding:2px 9px;cursor:pointer}
.jrt-bar button:hover,.jrt-bar button.on{background:#5a4a1a;color:#fff}
.jrt-bar .jv{margin-left:auto;color:#8a8a9a;font-size:10px;align-self:center;white-space:nowrap}
.jrt-dd{position:absolute;top:22px;background:#1a1a24;border:1px solid #8a7a3a;box-shadow:3px 3px 0 rgba(0,0,0,.5);z-index:4;min-width:190px;padding:2px}
.jrt-dd button{display:block;width:100%;text-align:left;background:none;border:0;color:#e8e0c0;font:11px Tahoma,sans-serif;padding:6px 12px;cursor:pointer}
.jrt-dd button:hover{background:#5a4a1a;color:#fff}.jrt-dd button:disabled{color:#666;background:none}
.jrt-logo{position:absolute;left:0;right:0;top:clamp(26px,5vh,40px);text-align:center;pointer-events:none;perspective:400px}
.jrt-logo .spin{display:inline-block;width:clamp(34px,7vh,56px);height:clamp(34px,7vh,56px);animation:jrtSpin 4s linear infinite;transform-style:preserve-3d;margin-bottom:2px}
.jrt-logo .spin svg{width:100%;height:100%;display:block;filter:drop-shadow(2px 2px 0 #000)}
@keyframes jrtSpin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
.jrt-logo b{display:block;font:900 clamp(26px,8vw,64px)/1 Impact,'Arial Black',sans-serif;letter-spacing:2px;background:linear-gradient(#fff6c0,#e8b020 45%,#8a5a10 52%,#ffd860);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px #3a2400;filter:drop-shadow(3px 3px 0 #000)}
.jrt-logo i{display:block;font:bold clamp(11px,2.6vw,20px) Arial,sans-serif;letter-spacing:clamp(4px,1.6vw,14px);color:#c8c8d8;text-shadow:2px 2px 0 #000;font-style:normal;margin-top:2px}
.jrt-logo s{display:inline-block;margin-top:6px;text-decoration:none;font:900 16px Impact,sans-serif;color:#fff;background:#c81010;padding:1px 12px;transform:rotate(-4deg);border:2px solid #fff;letter-spacing:3px}
.jrt-main{position:absolute;left:50%;bottom:clamp(12px,4vh,40px);transform:translateX(-50%);display:flex;flex-direction:column;gap:5px;width:min(290px,86%)}
.jrt-btn{background:linear-gradient(#5a5a6a,#2a2a34 50%,#1a1a22);border:1px solid #9a8a4a;color:#ffe890;font:bold 12px Tahoma,sans-serif;padding:7px 10px;cursor:pointer;text-shadow:1px 1px #000;border-radius:2px;min-height:30px}
.jrt-btn:hover,.jrt-btn:focus-visible{background:linear-gradient(#7a6a3a,#3a3020 50%,#2a2010);color:#fff;outline:none}
.jrt-btn:disabled{color:#777;border-color:#555;cursor:default}
.jrt-btn.buy{background:linear-gradient(#e83020,#901008);border-color:#ffd860;color:#fff}
.jrt-btn.go{background:linear-gradient(#3ac83a,#1a7a1a 50%,#0a4a0a);border:2px solid #b0ff90;color:#fff;font-size:15px;letter-spacing:1px;min-height:40px;text-shadow:2px 2px 0 #052a05;animation:jrtGo 1.6s ease-in-out infinite}
.jrt-btn small{display:block;font:normal 10px Tahoma,sans-serif;color:#c8c0a0;letter-spacing:0;margin-top:1px}
.jrt-btn.lad{background:linear-gradient(#3a4a8a,#1a2450 50%,#0e1430);border-color:#8aa0ff;color:#fff}.jrt-btn.lad:hover,.jrt-btn.lad:focus-visible{background:linear-gradient(#5a6ab0,#2a3470 50%,#141c48)}
.jrt-lad{display:flex;flex-direction:column;gap:4px}.jrt-lad .rg{display:flex;gap:8px;align-items:center;background:rgba(40,50,90,.35);border:1px solid #4a5a9a;padding:5px 7px}
.jrt-lad .rg.lk{opacity:.5}.jrt-lad .rn{font:900 22px Impact,'Arial Black',sans-serif;color:#ffd860;width:22px;text-align:center;text-shadow:2px 2px 0 #000}
.jrt-lad .rt{flex:1;min-width:0;font:12px Tahoma,sans-serif;color:#e8e0c0}.jrt-lad .rt small{display:block;color:#a8a8c0;font-size:11px;margin-top:2px;line-height:1.35}
.jrt-lad .rs{display:flex;flex-direction:column;gap:3px;align-items:flex-end;font:bold 10px Tahoma}.jrt-lad .rs b{color:#8a8aa0}.jrt-lad .rs b.ok{color:#7cf07c}.jrt-lad .rs b.nx{color:#ffd860}.jrt-lad .rs .jrt-btn{min-height:28px;padding:4px 14px}
.jrt-btn.go small{display:block;font:normal 10px Tahoma,sans-serif;letter-spacing:0;color:#d8ffc8}
@keyframes jrtGo{50%{box-shadow:0 0 12px 2px rgba(150,255,120,.55)}}
.jrt-win{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(14,16,28,.96);border:2px solid #8a7a3a;box-shadow:4px 4px 0 rgba(0,0,0,.6);width:min(600px,96%);max-height:94%;display:flex;flex-direction:column;z-index:5}
.jrt-win > h3{margin:0;padding:4px 8px;font:bold 12px Tahoma,sans-serif;color:#1a1000;background:linear-gradient(90deg,#e8c050,#8a6a20);display:flex;align-items:center;gap:6px}
.jrt-win > h3 button{margin-left:auto;background:#2a2010;color:#ffd860;border:1px solid #1a1000;font:bold 10px Tahoma;width:20px;height:18px;padding:0;cursor:pointer}
.jrt-win .bd{padding:10px;overflow:auto;flex:1;min-height:0}
.jrt-win .row{display:flex;gap:8px;align-items:center;margin:5px 0;flex-wrap:wrap}
.jrt-win label{min-width:110px;color:#c8c0a0}
.jrt-win select,.jrt-win input[type=text]{background:#05060c;color:#ffe890;border:1px solid #6a5a2a;font:12px Tahoma;padding:3px;min-height:26px;flex:1;min-width:120px}
.jrt-win .chk{display:flex;gap:4px;align-items:center;min-width:0;cursor:pointer}
.jrt-ui .jrt-win select:not([multiple]):not([size]){-webkit-appearance:none;appearance:none;background:linear-gradient(45deg,transparent 50%,#ffd860 50%) no-repeat right 11px center/5px 5px,linear-gradient(135deg,#ffd860 50%,transparent 50%) no-repeat right 6px center/5px 5px,#05060c;color:#ffe890;border:1px solid #6a5a2a;box-shadow:none;padding:3px 22px 3px 5px;min-height:26px;font:12px Tahoma,sans-serif;cursor:pointer}
.jrt-ui .jrt-win select option{background:#05060c;color:#ffe890}
.jrt-ui.jq .jrt-win select:not([multiple]):not([size]){background:linear-gradient(45deg,transparent 50%,#e8b84c 50%) no-repeat right 11px center/5px 5px,linear-gradient(135deg,#e8b84c 50%,transparent 50%) no-repeat right 6px center/5px 5px,#1a1008;color:#ffd890;border:2px inset #806040;font-family:'Courier New',monospace}
.jrt-ui.jq .jrt-win select option{background:#1a1008;color:#ffd890}
.jrt-win .ft{display:flex;gap:6px;justify-content:flex-end;padding:8px;border-top:1px solid #3a3420;flex-wrap:wrap}
.jrt-win .note{margin:6px 0 0;color:#9a9ab0;font-size:11px;line-height:1.4}
.jrt-tabs{display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap}.jrt-tabs button{background:#1a1a24;border:1px solid #5a4a2a;color:#c8c0a0;padding:5px 12px;cursor:pointer;font:bold 11px Tahoma}.jrt-tabs button.on{background:#5a4a1a;color:#fff}
.jrt-list{border:1px solid #5a4a2a;background:#05060c;height:min(210px,34vh);overflow:auto;font:11px Tahoma}
.jrt-list table{width:100%;border-collapse:collapse}.jrt-list th{position:sticky;top:0;background:#2a2410;color:#ffd860;text-align:left;padding:3px 5px;font-weight:bold;white-space:nowrap}
.jrt-list td{padding:4px 5px;border-bottom:1px solid #14141c;white-space:nowrap}.jrt-list tr.sel td{background:#5a4a1a;color:#fff}.jrt-list tr.dead td{color:#666}
.jrt-list tr{cursor:pointer}.jrt-list td.nm{white-space:normal;min-width:120px}.jrt-list .pub{color:#7cf07c;font-weight:bold}.jrt-list .live{display:inline-block;background:#c81010;color:#fff;font-size:9px;padding:0 3px;margin-left:3px;border-radius:2px}
.jrt-st{font:11px Tahoma;color:#9a9ab0;margin-top:5px;min-height:14px}
.jrt-pl{font:11px Tahoma;color:#c8c0a0;margin-top:5px;min-height:28px;line-height:1.5}.jrt-pl b{color:#ffd860}
.jrt-filt{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:5px;font-size:11px}
.jrt-con{position:absolute;left:0;right:0;top:0;height:min(46%,260px);z-index:7;background:linear-gradient(rgba(6,10,26,.94),rgba(10,16,40,.9));border-bottom:2px solid #5a7ad8;display:flex;flex-direction:column;animation:jrtCon .15s ease-out;margin:0}
@keyframes jrtCon{from{transform:translateY(-100%)}to{transform:none}}
.jrt-con .cl{flex:1;margin:0;padding:6px 8px;overflow:auto;font:12px/1.35 'Courier New',monospace;color:#b8d0ff;white-space:pre-wrap}
.jrt-con .ci{display:flex;gap:6px;align-items:center;padding:4px 8px;border-top:1px solid #2a3a7a;color:#ffe890;font:bold 13px 'Courier New',monospace}
.jrt-con input{flex:1;background:transparent;border:0;color:#fff;font:13px 'Courier New',monospace;outline:none}
.jrt-chat{position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:4px;z-index:6}.jrt-chat input{flex:1;background:rgba(0,0,0,.7);color:#ffe890;border:1px solid #8a7a3a;font:13px Tahoma;padding:4px}
.jrt-nag{position:absolute;inset:0;background:#000 linear-gradient(#1a0a2a,#000);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;z-index:8}
.jrt-nag h2{margin:0;font:900 clamp(22px,6vw,40px) Impact,sans-serif;color:#ffd860;text-shadow:3px 3px #000}
.jrt-vote{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;z-index:6;pointer-events:auto;width:min(600px,96%);background:rgba(8,10,24,.88);border:2px solid #8a7a3a;padding:8px;box-shadow:4px 4px 0 rgba(0,0,0,.5)}
.jrt-vote .vbar{width:100%;height:4px;background:#2a2a34}.jrt-vote .vbar i{display:block;height:100%;background:#ffd860;transition:width 1s linear}
.jq .jrt-vote{background:rgba(32,20,8,.94);border:3px outset #806040}.jq .jrt-vote .vbar i{background:#d88848}
.jrt-vote .vh{font:bold 13px Tahoma;color:#ffd860;text-shadow:1px 1px #000}
.jrt-vote .vo{display:flex;gap:6px;width:100%}
.jrt-vote button{flex:1;min-width:0;background:linear-gradient(#3a3a4a,#1a1a24);border:1px solid #9a8a4a;color:#ffe890;font:bold 12px Tahoma;padding:8px 4px;cursor:pointer;text-align:center;line-height:1.3}
.jrt-vote button small{display:block;font:11px Tahoma;color:#c8c8d8}
.jrt-vote button.me{background:linear-gradient(#7a6a2a,#3a3010);color:#fff;border-color:#ffd860}
.jrt-conn{position:absolute;inset:0;z-index:9;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#ffe890;font:bold 13px Tahoma;text-align:center;padding:16px}
.jrt-conn .mdm{font:11px 'Courier New',monospace;color:#9a9ab0;min-height:14px}
.jrt-rk table{width:100%;border-collapse:collapse;font:11px Tahoma}.jrt-rk th{text-align:left;color:#ffd860;background:#2a2410;padding:3px 5px}.jrt-rk td{padding:3px 5px;border-bottom:1px solid #1a1a24}.jrt-rk tr.me td{color:#fff;background:#3a3010}
.jrt-rk .n1 td:first-child{color:#ffd860;font-weight:bold}
.jrt-keys{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px 10px}.jrt-keys button{background:#05060c;border:1px solid #6a5a2a;color:#ffe890;font:11px Tahoma;padding:4px;cursor:pointer;text-align:left;min-height:26px}
.jrt-keys button.wait{background:#5a4a1a;color:#fff;animation:jrtGo .8s infinite}
.jrt-keys span{color:#c8c0a0;align-self:center}
/* the same client in JAQUAKE's rusty clothes */
.jrt-ui.jq{font-family:'Courier New',monospace;color:#e8c890}
.jq .jrt-bar{background:linear-gradient(#5a3a1a,#2a1a0a);border-bottom:2px solid #a8582a}
.jq .jrt-bar button,.jq .jrt-dd button{font-family:'Courier New',monospace;font-weight:bold;color:#e8b84c}
.jq .jrt-bar button:hover,.jq .jrt-bar button.on,.jq .jrt-dd button:hover{background:#8a4a1a;color:#fff}
.jq .jrt-dd{background:#2a1a0a;border:2px outset #806040}
.jq .jrt-btn{background:linear-gradient(#6a4a2a,#3a2410);border:2px outset #a87a4a;color:#ffd890;font:bold 13px 'Courier New',monospace;border-radius:0;letter-spacing:1px}
.jq .jrt-btn:hover,.jq .jrt-btn:focus-visible{background:linear-gradient(#8a5a2a,#5a3410);color:#fff}
.jq .jrt-btn.go{background:linear-gradient(#c86a1a,#7a3008);border:2px outset #ffb060;color:#fff;font-size:15px}
.jq .jrt-btn.go small{color:#ffe0b0;font-family:'Courier New',monospace}
.jq .jrt-win{background:rgba(32,20,8,.97);border:3px outset #806040;box-shadow:4px 4px 0 rgba(0,0,0,.7)}
.jq .jrt-win > h3{background:linear-gradient(90deg,#a8582a,#5a2a0a);color:#ffe8c0;font:bold 13px 'Courier New',monospace}
.jq .jrt-win > h3 button{background:#3a1a0a;color:#ffd890;border-color:#000}
.jq .jrt-win label,.jq .jrt-keys span{color:#d8b890}.jq .jrt-win .note{color:#b09878;font-family:'Courier New',monospace}
.jq .jrt-win select,.jq .jrt-win input[type=text],.jq .jrt-keys button{background:#1a1008;color:#ffd890;border:2px inset #806040;font-family:'Courier New',monospace}
.jq .jrt-list,.jq .jrt-rk table{background:#140c04;border-color:#806040;font-family:'Courier New',monospace}.jq .jrt-list th,.jq .jrt-rk th{background:#5a3a1a;color:#ffd890}.jq .jrt-list tr.sel td{background:#8a4a1a}
.jq .jrt-tabs button{background:#2a1a0a;border-color:#806040;color:#d8b890;font-family:'Courier New',monospace}.jq .jrt-tabs button.on{background:#8a4a1a;color:#fff}
.jq .jrt-vote button{background:linear-gradient(#5a3a1a,#2a1a0a);border:2px outset #806040;color:#ffd890;font-family:'Courier New',monospace}.jq .jrt-vote button.me{background:linear-gradient(#a8582a,#5a2a0a)}
.jq .jrt-vote .vh,.jq .jrt-conn{font-family:'Courier New',monospace;color:#ffd890}
.jq-logo{position:absolute;left:0;right:0;top:clamp(24px,4vh,36px);text-align:center;pointer-events:none;perspective:400px}
.jq-logo .spin{display:inline-block;width:clamp(36px,8vh,60px);height:clamp(36px,8vh,60px);animation:jrtSpin 3.2s linear infinite}
.jq-logo .spin svg{width:100%;height:100%;display:block;filter:drop-shadow(2px 2px 0 #000)}
.jq-logo b{display:block;font:bold clamp(30px,9vw,62px)/1 'Courier New',monospace;letter-spacing:4px;color:#d88848;text-shadow:3px 3px 0 #200a00,-1px -1px 0 #ffb070}
.jq-logo i{display:block;font:bold clamp(10px,2.4vw,15px) 'Courier New',monospace;color:#e8b84c;font-style:normal;letter-spacing:2px;margin-top:4px;text-shadow:2px 2px 0 #000}
`);
  const LOGO = {
    jrt: '<svg viewBox="0 0 32 32"><path d="M16 1l13 5v9q0 10-13 16Q3 25 3 15V6z" fill="#e8b020" stroke="#3a2400"/><path d="M16 4l10 4v7q0 7-10 12Q6 22 6 15V8z" fill="#2a3a8a"/><text x="16" y="19.5" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-weight="bold" font-size="9" fill="#ffd400" stroke="#000" stroke-width=".4">JRT</text></svg>',
    jq: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14.5" fill="#3a2414" stroke="#100500" stroke-width="1.5"/><circle cx="16" cy="16" r="11" fill="none" stroke="#a8582a" stroke-width="2" stroke-dasharray="3 2"/><path d="M18 6h6v13q0 7-7 7h-4q-5 0-6-5l4-1q1 2 2 2h4q1 0 1-2z" fill="#d88848" stroke="#200a00"/><path d="M9 21l2 5-4-1z" fill="#fffff0"/></svg>',
  };

  // ================================================================ models
  function soldier(ctx, col, o) {
    o = o || {};
    const c = col, dark = o.jq ? 0x3a2a1a : 0x2a2a30, skin = o.jq ? 0xd8a070 : o.bot ? 0x5aac2c : 0xe8b890, trim = o.jq ? 0x9a8a6a : 0xd8d8e0, vis = o.jq ? 0x2a2a2a : 0x60e0ff;
    const m = E.model(ctx, [
      ['hip', 0.5, 0.22, 0.3, 0, 0.92, 0, dark],
      ['ll', 0.2, 0.86, 0.22, -0.13, 0.86, 0, dark, null, [0, -0.42, 0]], ['rl', 0.2, 0.86, 0.22, 0.13, 0.86, 0, dark, null, [0, -0.42, 0]],
      ['lb', 0.22, 0.2, 0.32, 0, -0.78, -0.04, c, 'll'], ['rb', 0.22, 0.2, 0.32, 0, -0.78, -0.04, c, 'rl'],
      ['body', 0.6, 0.62, 0.36, 0, 1.33, 0, c], ['chest', 0.44, 0.3, 0.06, 0, 1.4, -0.2, trim],
      ['la', 0.17, 0.6, 0.18, -0.4, 1.6, 0, c, null, [0, -0.26, 0]], ['ra', 0.17, 0.6, 0.18, 0.4, 1.6, 0, c, null, [0, -0.26, 0]],
      ['gun', 0.12, 0.14, 0.62, 0, -0.26, -0.24, 0x404048, 'ra'],
      ['head', 0.34, 0.34, 0.34, 0, 1.82, 0, skin], ['helm', 0.38, 0.14, 0.4, 0, 1.97, 0.02, c], ['visor', 0.36, 0.1, 0.06, 0, 1.84, -0.18, vis],
    ].concat(o.bot && !o.jq ? [['ear1', 0.2, 0.06, 0.05, -0.24, 1.86, 0, skin], ['ear2', 0.2, 0.06, 0.05, 0.24, 1.86, 0, skin]] : [])
      .concat(o.jq ? [] : [ // tournament armour: shoulder pads, a belt, boots, a backpack, knee pads, a chest light
        ['shl', 0.26, 0.14, 0.3, 0, 0.04, 0, trim, 'la'], ['shr', 0.26, 0.14, 0.3, 0, 0.04, 0, trim, 'ra'], ['belt', 0.64, 0.09, 0.4, 0, 1.03, 0, 0x2a2420], ['buck', 0.14, 0.08, 0.04, 0, 1.03, -0.21, 0xd8b030],
        ['bootl', 0.24, 0.16, 0.36, 0, -0.76, -0.05, 0x1a1a20, 'll'], ['bootr', 0.24, 0.16, 0.36, 0, -0.76, -0.05, 0x1a1a20, 'rl'], ['kl', 0.23, 0.12, 0.08, 0, -0.38, -0.12, trim, 'll'], ['kr', 0.23, 0.12, 0.08, 0, -0.38, -0.12, trim, 'rl'],
        ['pack', 0.42, 0.42, 0.16, 0, 1.38, 0.25, 0x3a3e4a], ['lamp', 0.1, 0.06, 0.03, 0.12, 1.48, -0.2, 0x60e0ff], ['gl', 0.19, 0.14, 0.2, 0, -0.56, 0, 0x2a2420, 'la']]), { lin: !o.jq });
    return m;
  }
  // the JRT guns (pointing down -z, the hand round the grip). Parts named '*...' glow (drawn full bright); 'tip' marks the
  // muzzle (the flash goes there); hand/thumb/sleeve only show in your own hands. The base colours are dark-ish on purpose.
  const GLOVE = 0x2a2018, SLEEVE = 0x34406a, GUNS = [
    // 0 Impact Jackhammer: a piston on a handle, hazard stripes, a hot glowing face
    [['h', 0.08, 0.08, 0.34, 0, -0.03, 0.1, 0x2a2a30], ['grip', 0.07, 0.16, 0.08, 0, -0.11, 0.13, 0x1a1a1e], ['body', 0.17, 0.17, 0.26, 0, 0.02, -0.12, 0x7a6418], ['band1', 0.175, 0.045, 0.05, 0, 0.02, -0.04, 0x141414], ['band2', 0.175, 0.045, 0.05, 0, 0.02, -0.15, 0x141414],
      ['cap', 0.14, 0.14, 0.04, 0, 0.02, -0.27, 0x4a4a54], ['piston', 0.07, 0.07, 0.14, 0, 0.02, -0.34, 0xa0a0b0], ['head', 0.19, 0.19, 0.06, 0, 0.02, -0.43, 0x5a5a64], ['*glow', 0.12, 0.12, 0.012, 0, 0.02, -0.462, 0xff9a30],
      ['pipe', 0.03, 0.03, 0.24, 0.095, 0.07, -0.12, 0x8a8a90], ['bolt', 0.035, 0.035, 0.035, 0.09, 0.07, -0.2, 0xd8c040], ['tip', 0.01, 0.01, 0.01, 0, 0.02, -0.47, 0x000000],
      ['hand', 0.11, 0.1, 0.13, 0, -0.09, 0.13, GLOVE], ['sleeve', 0.13, 0.13, 0.22, 0, -0.11, 0.3, SLEEVE]],
    // 1 Jack Pistol: a chunky auto-pistol, gunmetal with a gold line and wooden grips
    [['grip', 0.075, 0.19, 0.1, 0, -0.12, 0.07, 0x26262c], ['gripw', 0.082, 0.13, 0.075, 0, -0.13, 0.075, 0x5a2a16], ['mag', 0.06, 0.035, 0.08, 0, -0.225, 0.075, 0x8a8a92], ['frame', 0.08, 0.06, 0.3, 0, -0.035, -0.05, 0x2a2c34],
      ['slide', 0.088, 0.078, 0.36, 0, 0.032, -0.07, 0x40444f], ['gold', 0.09, 0.014, 0.3, 0, 0.002, -0.07, 0xb08a20], ['g1', 0.09, 0.012, 0.012, 0, 0.045, 0.06, 0x24262c], ['g2', 0.09, 0.012, 0.012, 0, 0.045, 0.035, 0x24262c], ['g3', 0.09, 0.012, 0.012, 0, 0.045, 0.01, 0x24262c],
      ['nose', 0.07, 0.065, 0.05, 0, 0.03, -0.26, 0x44464e], ['tip', 0.04, 0.04, 0.02, 0, 0.03, -0.29, 0x08080a], ['rs', 0.07, 0.025, 0.02, 0, 0.082, 0.09, 0x1a1a1a], ['fs', 0.015, 0.03, 0.02, 0, 0.085, -0.22, 0x1a1a1a],
      ['guard', 0.02, 0.05, 0.08, 0, -0.08, -0.03, 0x1a1a1e], ['*led', 0.022, 0.022, 0.022, 0.046, 0.045, 0.06, 0xff3020],
      ['hand', 0.1, 0.12, 0.13, 0, -0.14, 0.09, GLOVE], ['thumb', 0.04, 0.04, 0.1, -0.056, -0.06, 0.03, GLOVE], ['sleeve', 0.12, 0.12, 0.22, 0, -0.16, 0.25, SLEEVE]],
    // 2 Shock Jack: a long coil rifle with a glowing glass tube on top
    [['body', 0.11, 0.13, 0.46, 0, 0, -0.06, 0x34344e], ['top', 0.075, 0.03, 0.42, 0, 0.075, -0.06, 0x50507a], ['stock', 0.08, 0.15, 0.2, 0, -0.03, 0.25, 0x24242e], ['butt', 0.09, 0.19, 0.04, 0, -0.03, 0.36, 0x1a1a22],
      ['*c1', 0.13, 0.035, 0.035, 0, 0.0, 0.0, 0x8a5aff], ['*c2', 0.13, 0.035, 0.035, 0, 0.0, -0.09, 0x8a5aff], ['*c3', 0.13, 0.035, 0.035, 0, 0.0, -0.18, 0x8a5aff], ['*glass', 0.03, 0.022, 0.24, 0, 0.098, -0.08, 0x4a78b8],
      ['tube', 0.075, 0.075, 0.22, 0, 0.01, -0.39, 0x4a4a64], ['ring', 0.12, 0.12, 0.03, 0, 0.01, -0.5, 0x7a62c0], ['*ringg', 0.065, 0.065, 0.012, 0, 0.01, -0.518, 0xd0b0ff], ['tip', 0.01, 0.01, 0.01, 0, 0.01, -0.53, 0x000000],
      ['grip', 0.06, 0.15, 0.08, 0, -0.13, 0.08, 0x1a1a22], ['hand', 0.1, 0.1, 0.12, 0, -0.15, 0.1, GLOVE], ['sleeve', 0.12, 0.12, 0.22, 0, -0.17, 0.26, SLEEVE]],
    // 3 Rattler: six barrels that spin, an ammo drum on the side
    [['body', 0.17, 0.16, 0.3, 0, 0, 0.02, 0x4a4a36], ['top', 0.08, 0.05, 0.26, 0, 0.1, 0.02, 0x2a2a22], ['drum', 0.09, 0.15, 0.15, 0.12, -0.03, 0.04, 0xa07818], ['belt', 0.06, 0.02, 0.12, 0.07, -0.1, 0.0, 0xc89a28],
      ['rot', 0.02, 0.02, 0.02, 0, 0.01, -0.14, 0x202020, null, [0, 0, 0]]].concat([0, 1, 2, 3, 4, 5].map(i => ['b' + i, 0.034, 0.034, 0.38, Math.cos(i * Math.PI / 3) * 0.045, Math.sin(i * Math.PI / 3) * 0.045, -0.06, 0x26262a, 'rot']))
      .concat([['clamp', 0.14, 0.14, 0.03, 0, 0, -0.16, 0x5a5a40, 'rot'], ['clamp2', 0.13, 0.13, 0.025, 0, 0, -0.04, 0x5a5a40, 'rot'], ['tip', 0.01, 0.01, 0.01, 0, 0.01, -0.4, 0x000000], ['grip', 0.06, 0.14, 0.08, 0, -0.13, 0.08, 0x1a1a1e],
        ['hand', 0.1, 0.1, 0.12, 0, -0.16, 0.1, GLOVE], ['sleeve', 0.12, 0.12, 0.22, 0, -0.18, 0.26, SLEEVE]]),
    // 4 Flak Jack: a chunky shell thrower with hot vents
    [['body', 0.19, 0.2, 0.42, 0, 0, -0.02, 0x5a2a12], ['top', 0.09, 0.06, 0.32, 0, 0.13, 0, 0xb05010], ['muz', 0.23, 0.23, 0.08, 0, 0, -0.27, 0x202020], ['hole', 0.13, 0.13, 0.02, 0, 0, -0.315, 0x050505],
      ['*v1', 0.195, 0.025, 0.04, 0, 0.05, -0.12, 0xff7a20], ['*v2', 0.195, 0.025, 0.04, 0, 0.05, -0.04, 0xff7a20], ['shell', 0.06, 0.06, 0.1, 0.12, 0.02, 0.06, 0xd8b030], ['lever', 0.03, 0.03, 0.18, -0.11, 0.03, 0.0, 0x6a6a6a],
      ['tip', 0.01, 0.01, 0.01, 0, 0, -0.33, 0x000000], ['grip', 0.07, 0.15, 0.09, 0, -0.16, 0.08, 0x1a1a1e], ['hand', 0.1, 0.1, 0.12, 0, -0.19, 0.1, GLOVE], ['sleeve', 0.12, 0.12, 0.22, 0, -0.21, 0.26, SLEEVE]],
    // 5 Rocket Jack: three tubes in a bundle round a turning chamber, a sight, rockets peeking out
    [['body', 0.2, 0.18, 0.3, 0, -0.01, 0.06, 0x2a4a22], ['band', 0.21, 0.19, 0.04, 0, -0.01, -0.08, 0xb09020], ['t1', 0.09, 0.09, 0.5, 0, 0.045, -0.15, 0x325a2a], ['t2', 0.09, 0.09, 0.5, -0.05, -0.04, -0.15, 0x325a2a], ['t3', 0.09, 0.09, 0.5, 0.05, -0.04, -0.15, 0x325a2a],
      ['muz', 0.2, 0.19, 0.05, 0, 0, -0.39, 0x1a1a1a], ['r1', 0.05, 0.05, 0.05, 0, 0.045, -0.41, 0xd02810], ['r2', 0.05, 0.05, 0.05, -0.05, -0.04, -0.41, 0xd02810], ['r3', 0.05, 0.05, 0.05, 0.05, -0.04, -0.41, 0xd02810],
      ['sight', 0.03, 0.06, 0.12, 0.08, 0.12, -0.04, 0x1a1a1a], ['*lens', 0.025, 0.025, 0.012, 0.08, 0.14, -0.105, 0x40c0ff], ['tip', 0.01, 0.01, 0.01, 0, 0, -0.42, 0x000000],
      ['grip', 0.07, 0.14, 0.08, 0, -0.15, 0.08, 0x1a1a1e], ['hand', 0.1, 0.1, 0.12, 0, -0.18, 0.1, GLOVE], ['sleeve', 0.12, 0.12, 0.22, 0, -0.2, 0.26, SLEEVE]],
  ];
  const VMO = [[0.15, -0.135, -0.35, 0.1], [0.145, -0.13, -0.36, 0.09], [0.14, -0.135, -0.35, 0.07], [0.145, -0.135, -0.35, 0.08], [0.145, -0.14, -0.35, 0.07], [0.145, -0.14, -0.35, 0.07]]; // where each gun sits in your hands [x, y, z, turn-in]
  function gunModel(ctx, w, scale, view, sleeve) {
    const k = scale || 1, P = (GUNS[w] || [['b', 0.1, 0.1, 0.3, 0, 0, 0, 0x808080]]).filter(p => view || !/^(hand|thumb|sleeve)$/.test(p[0]));
    const sc = p => [p[0].replace('*', ''), p[1] * k, p[2] * k, p[3] * k, p[4] * k, p[5] * k, p[6] * k, p[0] === 'sleeve' && sleeve != null ? sleeve : p[7], p[8], p[9] ? p[9].map(v => v * k) : undefined];
    const m = E.model(ctx, P.filter(p => p[0][0] !== '*').map(sc), { lin: true }), glow = P.filter(p => p[0][0] === '*');
    if (glow.length) { const gm = E.model(ctx, glow.map(sc), { lin: true, full: 1.25 }); m.add(gm); m.glow = gm; }
    return m;
  }
  function itemModel(ctx, it, jq) {
    if (jq) { const m = PCG.jqArt.jqItemModel(ctx, MAPLOOK[it] || 'health'); return m; }
    if (AR.ITEMS[it] && AR.ITEMS[it].w != null) { const m = gunModel(ctx, AR.ITEMS[it].w, 1.4); m.position.y = 0.6; const g = new T.Group(); g.add(m); g.mat = m.mat; return g; }
    const P = {
      health: [['b', 0.5, 0.36, 0.5, 0, 0.5, 0, 0xe8e8f0], ['c1', 0.34, 0.1, 0.52, 0, 0.5, 0, 0x20c040], ['c2', 0.1, 0.34, 0.52, 0, 0.5, 0, 0x20c040]],
      vial: [['b', 0.16, 0.34, 0.16, 0, 0.45, 0, 0x40d0ff], ['c', 0.1, 0.08, 0.1, 0, 0.66, 0, 0xe0e0e0]],
      shield: [['a', 0.9, 0.12, 0.12, 0, 0.6, -0.4, 0xffd040], ['b', 0.9, 0.12, 0.12, 0, 0.6, 0.4, 0xffd040], ['c', 0.12, 0.12, 0.9, -0.4, 0.6, 0, 0xffd040], ['d', 0.12, 0.12, 0.9, 0.4, 0.6, 0, 0xffd040], ['g', 0.24, 0.24, 0.24, 0, 0.6, 0, 0xfff0a0]],
      udamage: [['b', 0.34, 0.5, 0.34, 0, 0.55, 0, 0xa040ff], ['n', 0.14, 0.2, 0.14, 0, 0.9, 0, 0xd8b0ff], ['l', 0.36, 0.14, 0.36, 0, 0.5, 0, 0xffffff]],
    }[it] || [['b', 0.4, 0.4, 0.4, 0, 0.5, 0, 0xffffff]];
    return E.model(ctx, P, { lin: true, full: it === 'udamage' || it === 'shield' || it === 'vial' ? 0.9 : 0.5 });
  }
  function flagModel(ctx, team) {
    return E.model(ctx, [['pole', 0.06, 2.2, 0.06, 0, 1.1, 0, 0xd8d8d8], ['cloth', 0.04, 0.6, 0.9, 0, 1.85, 0.46, TEAMH[team]], ['knob', 0.12, 0.12, 0.12, 0, 2.24, 0, 0xffd040]], { lin: true, full: 0.7 });
  }
  // ================================================================ JRT's own textures (128 x 128, smooth 3D-card look): deck
  // plating, tech walls with glowing strips, hazard concrete, steel crates, castle stone. Drawn here, registered in the engine.
  const TX = (() => {
    const C = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`, sh = (c, k) => c.map(v => clamp(v * k, 0, 255));
    function noiseFn(r, n) { const g = []; for (let i = 0; i < n * n; i++) g.push(r()); const at = (i, j) => g[((j % n + n) % n) * n + ((i % n + n) % n)]; return (x, y) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v; }; }
    function grime(x, S, r, amt, freq, tintC) { const a = noiseFn(r, freq), b = noiseFn(r, freq * 4), img = x.getImageData(0, 0, S, S), d = img.data; for (let y = 0; y < S; y++) for (let X = 0; X < S; X++) { const n = a(X / S * freq, y / S * freq) * 0.7 + b(X / S * freq * 4, y / S * freq * 4) * 0.3, k = 1 - amt + n * amt * 1.4 + (r() - 0.5) * 0.05, i = (y * S + X) * 4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; if (tintC && n > 0.62) { const t = (n - 0.62) * 1.6; d[i] += (tintC[0] - d[i]) * t; d[i + 1] += (tintC[1] - d[i + 1]) * t; d[i + 2] += (tintC[2] - d[i + 2]) * t; } } x.putImageData(img, 0, 0); }
    function bev(x, X, Y, w, h, c, t) { t = t || 2; x.fillStyle = C(c); x.fillRect(X, Y, w, h); x.fillStyle = C(sh(c, 1.45)); x.fillRect(X, Y, w, t); x.fillRect(X, Y, t, h); x.fillStyle = C(sh(c, 0.5)); x.fillRect(X, Y + h - t, w, t); x.fillRect(X + w - t, Y, t, h); }
    function inset(x, X, Y, w, h, c, t) { t = t || 2; x.fillStyle = C(c); x.fillRect(X, Y, w, h); x.fillStyle = C(sh(c, 0.45)); x.fillRect(X, Y, w, t); x.fillRect(X, Y, t, h); x.fillStyle = C(sh(c, 1.4)); x.fillRect(X, Y + h - t, w, t); x.fillRect(X + w - t, Y, t, h); }
    function bolt(x, X, Y, c) { x.fillStyle = C(sh(c, 0.4)); x.fillRect(X, Y, 5, 5); x.fillStyle = C(sh(c, 1.3)); x.fillRect(X, Y, 4, 4); x.fillStyle = C(c); x.fillRect(X + 1, Y + 1, 3, 3); x.fillStyle = C(sh(c, 1.8)); x.fillRect(X + 1, Y + 1, 1, 1); }
    function hazard(x, X, Y, w, h) { x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); x.fillStyle = C([230, 176, 30]); x.fillRect(X, Y, w, h); x.fillStyle = C([26, 24, 22]); for (let k = -h; k < w + h; k += 16) { x.beginPath(); x.moveTo(X + k, Y + h); x.lineTo(X + k + 8, Y + h); x.lineTo(X + k + 8 + h, Y); x.lineTo(X + k + h, Y); x.fill(); } x.restore(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X, Y + h - 1, w, 1); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(X, Y, w, 1); }
    function tread(x, X, Y, w, h, c) { for (let j = 4; j < h - 4; j += 8) for (let i = 4 + ((j / 8) % 2) * 4; i < w - 4; i += 8) { const up = ((i + j) / 4) % 2 < 1; x.fillStyle = C(sh(c, 1.5)); if (up) { x.fillRect(X + i, Y + j + 2, 1, 1); x.fillRect(X + i + 1, Y + j + 1, 1, 1); x.fillRect(X + i + 2, Y + j, 1, 1); } else { x.fillRect(X + i, Y + j, 1, 1); x.fillRect(X + i + 1, Y + j + 1, 1, 1); x.fillRect(X + i + 2, Y + j + 2, 1, 1); } x.fillStyle = C(sh(c, 0.55)); if (up) { x.fillRect(X + i + 1, Y + j + 3, 1, 1); x.fillRect(X + i + 3, Y + j + 1, 1, 1); } else { x.fillRect(X + i + 3, Y + j + 3, 1, 1); x.fillRect(X + i, Y + j + 2, 1, 1); } } }
    function glowStrip(x, X, Y, w, h, c) { const g = x.createLinearGradient(0, Y - 4, 0, Y + h + 4); g.addColorStop(0, C(c, 0)); g.addColorStop(0.3, C(c, 0.9)); g.addColorStop(0.5, C([235, 250, 255])); g.addColorStop(0.7, C(c, 0.9)); g.addColorStop(1, C(c, 0)); x.fillStyle = C([16, 20, 28]); x.fillRect(X, Y - 1, w, h + 2); x.fillStyle = g; x.fillRect(X + 1, Y - 4, w - 2, h + 8); }
    function bricks(x, S, r, c, mortar, bw, bh) { x.fillStyle = C(mortar); x.fillRect(0, 0, S, S); for (let j = 0; j < S / bh; j++) for (let i = -1; i < S / bw + 1; i++) { const X = i * bw + (j % 2 ? bw / 2 : 0), k = 0.82 + r() * 0.32; bev(x, X + 1, j * bh + 1, bw - 2, bh - 2, sh(c, k), 2); } }
    const T_ = {
      utfloor(x, S, r) { const c = [92, 98, 112]; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const cc = sh(c, 0.92 + r() * 0.14); bev(x, i * 64, j * 64, 64, 64, cc, 3); tread(x, i * 64 + 4, j * 64 + 4, 56, 56, cc); bolt(x, i * 64 + 5, j * 64 + 5, [140, 144, 156]); bolt(x, i * 64 + 54, j * 64 + 5, [140, 144, 156]); bolt(x, i * 64 + 5, j * 64 + 54, [140, 144, 156]); bolt(x, i * 64 + 54, j * 64 + 54, [140, 144, 156]); } grime(x, S, r, 0.35, 3, [70, 60, 46]); },
      utwall(x, S, r) { const c = [60, 66, 84]; bev(x, 0, 0, S, S, c, 3); inset(x, 10, 10, S - 20, 46, sh(c, 0.78), 3); bev(x, 18, 18, S - 36, 30, sh(c, 0.95), 2); for (let k = 0; k < 5; k++) { x.fillStyle = C(sh(c, 0.5)); x.fillRect(26 + k * 16, 24, 8, 18); x.fillStyle = C(sh(c, 1.25)); x.fillRect(26 + k * 16, 41, 8, 1); }
        glowStrip(x, 6, 66, S - 12, 5, [70, 190, 255]); inset(x, 10, 80, S - 20, 40, sh(c, 0.82), 3); for (let k = 0; k < 7; k++) { x.fillStyle = C(sh(c, 0.42)); x.fillRect(18, 86 + k * 5, S - 60, 2); } x.fillStyle = C([210, 170, 40]); x.fillRect(S - 36, 88, 18, 10); x.fillStyle = C([20, 20, 20]); x.fillRect(S - 33, 91, 12, 1); x.fillRect(S - 33, 94, 8, 1);
        bolt(x, 3, 3, [130, 138, 160]); bolt(x, S - 8, 3, [130, 138, 160]); bolt(x, 3, S - 8, [130, 138, 160]); bolt(x, S - 8, S - 8, [130, 138, 160]); grime(x, S, r, 0.28, 3); },
      utslab(x, S, r) { const n = noiseFn(r, 6); x.fillStyle = C([110, 104, 96]); x.fillRect(0, 0, S, S); const img = x.getImageData(0, 0, S, S), d = img.data; for (let y = 0; y < S; y++) for (let X = 0; X < S; X++) { const k = 0.75 + n(X / S * 6, y / S * 6) * 0.4 + (r() - 0.5) * 0.1, i = (y * S + X) * 4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } x.putImageData(img, 0, 0);
        x.fillStyle = 'rgba(20,18,16,.6)'; x.fillRect(0, 63, S, 2); x.fillRect(63, 14, 2, 100); hazard(x, 0, 0, S, 12); hazard(x, 0, S - 12, S, 12); },
      utgrate(x, S, r) { const c = [70, 74, 84]; bev(x, 0, 0, S, S, c, 3); for (let j = 18; j < S - 8; j += 10) { x.fillStyle = C([12, 12, 16]); x.fillRect(8, j, S - 16, 5); x.fillStyle = C(sh(c, 1.35)); x.fillRect(8, j + 5, S - 16, 1); } hazard(x, 0, 0, S, 10); grime(x, S, r, 0.25, 3); },
      utred(x, S, r) { T_.utfloor(x, S, r); x.fillStyle = 'rgba(200,30,20,.38)'; x.fillRect(0, 0, S, S); x.fillStyle = 'rgba(255,90,60,.85)'; x.beginPath(); x.moveTo(64, 30); x.lineTo(98, 64); x.lineTo(64, 98); x.lineTo(30, 64); x.closePath(); x.fill(); x.fillStyle = 'rgba(80,0,0,.8)'; x.beginPath(); x.moveTo(64, 46); x.lineTo(82, 64); x.lineTo(64, 82); x.lineTo(46, 64); x.closePath(); x.fill(); },
      utblue(x, S, r) { T_.utfloor(x, S, r); x.fillStyle = 'rgba(30,70,230,.38)'; x.fillRect(0, 0, S, S); x.fillStyle = 'rgba(100,160,255,.85)'; x.beginPath(); x.moveTo(64, 30); x.lineTo(98, 64); x.lineTo(64, 98); x.lineTo(30, 64); x.closePath(); x.fill(); x.fillStyle = 'rgba(0,10,80,.8)'; x.beginPath(); x.moveTo(64, 46); x.lineTo(82, 64); x.lineTo(64, 82); x.lineTo(46, 64); x.closePath(); x.fill(); },
      utpad(x, S, r) { x.fillStyle = C([26, 28, 38]); x.fillRect(0, 0, S, S); for (let k = 60; k > 4; k -= 8) { x.fillStyle = (k / 8) % 2 ? C([90, 210, 255]) : C([16, 50, 110]); x.beginPath(); x.arc(64, 64, k, 0, 7); x.fill(); } x.fillStyle = C([230, 250, 255]); x.beginPath(); x.arc(64, 64, 6, 0, 7); x.fill(); hazard(x, 0, 0, S, 6); hazard(x, 0, S - 6, S, 6); },
      utcrate(x, S, r) { const c = [104, 110, 92]; bev(x, 0, 0, S, S, sh(c, 0.75), 4); inset(x, 12, 12, S - 24, S - 24, c, 3); x.strokeStyle = C(sh(c, 0.7)); x.lineWidth = 9; x.beginPath(); x.moveTo(16, 16); x.lineTo(S - 16, S - 16); x.moveTo(S - 16, 16); x.lineTo(16, S - 16); x.stroke(); x.strokeStyle = C(sh(c, 1.2)); x.lineWidth = 2; x.beginPath(); x.moveTo(18, 14); x.lineTo(S - 14, S - 18); x.stroke();
        x.fillStyle = C([30, 30, 26]); x.font = 'bold 20px Impact, Arial Black, sans-serif'; x.textAlign = 'center'; x.fillText('JRT', 64, 72); x.fillStyle = C([220, 180, 40]); x.fillText('JRT', 63, 71); for (const [X, Y] of [[5, 5], [S - 10, 5], [5, S - 10], [S - 10, S - 10]]) bolt(x, X, Y, [150, 150, 140]); grime(x, S, r, 0.3, 3, [80, 64, 40]); },
      utlight(x, S, r) { x.fillStyle = C([40, 44, 56]); x.fillRect(0, 0, S, S); const g = x.createRadialGradient(64, 64, 4, 64, 64, 60); g.addColorStop(0, C([255, 255, 240])); g.addColorStop(0.6, C([200, 230, 255])); g.addColorStop(1, C([90, 120, 160])); x.fillStyle = g; x.fillRect(12, 12, S - 24, S - 24); x.strokeStyle = C([20, 22, 30]); x.lineWidth = 3; x.strokeRect(12, 12, S - 24, S - 24); x.beginPath(); x.moveTo(64, 12); x.lineTo(64, S - 12); x.moveTo(12, 64); x.lineTo(S - 12, 64); x.stroke(); },
      utstone(x, S, r) { bricks(x, S, r, [124, 118, 106], [48, 46, 42], 64, 32); grime(x, S, r, 0.35, 3, [70, 96, 46]); },
      utcobble(x, S, r) { x.fillStyle = C([46, 44, 38]); x.fillRect(0, 0, S, S); for (let k = 0; k < 90; k++) { const cx = r() * S, cy = r() * S, rr = 6 + r() * 7, c = sh([128, 120, 104], 0.7 + r() * 0.45); for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) { const g = x.createRadialGradient(cx + ox - rr * 0.3, cy + oy - rr * 0.3, 1, cx + ox, cy + oy, rr); g.addColorStop(0, C(sh(c, 1.3))); g.addColorStop(1, C(sh(c, 0.7))); x.fillStyle = g; x.beginPath(); x.arc(cx + ox, cy + oy, rr, 0, 7); x.fill(); } } grime(x, S, r, 0.3, 4, [70, 100, 50]); },
      utplanks(x, S, r) { for (let j = 0; j < S; j += 16) { const k = 0.72 + r() * 0.4, c = sh([146, 98, 54], k); x.fillStyle = C(c); x.fillRect(0, j, S, 16); for (let g = 0; g < 6; g++) { x.fillStyle = C(sh(c, 0.82)); x.fillRect(0, j + 2 + (r() * 12 | 0), S, 1); } x.fillStyle = C(sh(c, 0.45)); x.fillRect(0, j + 15, S, 1); const cut = (r() * S) | 0; x.fillRect(cut, j, 2, 15); bolt(x, cut + 4, j + 5, [130, 130, 130]); } grime(x, S, r, 0.25, 3); },
      utpillar(x, S, r) { for (let i = 0; i < S; i++) { const k = 0.55 + 0.5 * (0.5 + 0.5 * Math.cos(i / S * Math.PI * 2 * 4)); x.fillStyle = C(sh([158, 150, 134], k)); x.fillRect(i, 0, 1, S); } bev(x, 0, 0, S, 10, [120, 112, 100], 2); bev(x, 0, S - 10, S, 10, [120, 112, 100], 2); grime(x, S, r, 0.25, 3); },
      utwood(x, S, r) { for (let i = 0; i < S; i += 32) { const k = 0.78 + r() * 0.35, c = sh([116, 72, 36], k); x.fillStyle = C(c); x.fillRect(i, 0, 32, S); for (let g = 0; g < 9; g++) { x.fillStyle = C(sh(c, 0.75 + r() * 0.15)); x.fillRect(i + 2 + (r() * 28 | 0), 0, 1, S); } x.fillStyle = C(sh(c, 0.45)); x.fillRect(i + 31, 0, 1, S); } grime(x, S, r, 0.2, 3); },
      utbanner(x, S, r) { x.fillStyle = C([120, 22, 22]); x.fillRect(0, 0, S, S); x.fillStyle = C([210, 168, 44]); x.fillRect(0, 6, S, 5); x.fillRect(0, S - 11, S, 5); x.fillStyle = C([150, 36, 30]); for (let k = 18; k < S - 18; k += 14) x.fillRect(0, k, S, 6); x.fillStyle = C([220, 180, 50]); x.beginPath(); x.moveTo(64, 34); x.lineTo(88, 50); x.lineTo(84, 82); x.lineTo(64, 96); x.lineTo(44, 82); x.lineTo(40, 50); x.closePath(); x.fill(); x.fillStyle = C([120, 22, 22]); x.font = 'bold 22px Impact, sans-serif'; x.textAlign = 'center'; x.fillText('J', 64, 76); grime(x, S, r, 0.2, 3); },
    };
    for (const k of Object.keys(T_)) { T_[k].size = 128; E.TEX[k] = T_[k]; }
    // the older 64-pixel names the maps use -> these
    return { jfloor: 'utfloor', jpanel: 'utwall', jslab: 'utslab', jred: 'utred', jblue: 'utblue', jpad: 'utpad', crate: 'utcrate', cstone: 'utstone', cobble: 'utcobble', planks: 'utplanks', pillar: 'utpillar', wood: 'utwood', flag: 'utbanner' };
  })();
  function utLook(M, o) { // JRT maps wear the new textures (map cells are shared and parsed once, so this is safe to repeat)
    const R = n => TX[n] || n;
    for (const c of M.cells) { if (c.st === 'jslab') c.st = 'utgrate'; for (const k of ['ft', 'wt', 'st', 'ct']) if (c[k] && TX[c[k]]) c[k] = TX[c[k]]; if (c.x) { if (c.x.tt && TX[c.x.tt]) c.x.tt = TX[c.x.tt]; if (c.x.bt && TX[c.x.bt]) c.x.bt = TX[c.x.bt]; } }
    if (o.st === 'jslab') o.st = 'utgrate'; for (const k of ['ft', 'wt', 'st', 'ct', 'rt']) if (o[k]) o[k] = R(o[k]);
    return o;
  }
  function monModel(ctx, kind) {
    const A = PCG.jqArt;
    if (kind === 'blob') return A.squigModel(ctx, false, true);
    if (kind === 'imp') return A.grotModel(ctx, false);
    if (kind === 'bigrobot') return A.robotModel(ctx, true);
    return A.robotModel(ctx, false);
  }

  // ================================================================ one shared listener for the network (the game instance changes)
  let CUR = null;
  if (window.Net && !PCG._jrtNet) {
    PCG._jrtNet = true;
    ['arList', 'arPong', 'arJoined', 'arErr', 'arG', 'arS', 'arLeft', 'arTop'].forEach(t => Net.on(t, m => { if (CUR && CUR.onNet) CUR.onNet(m); }));
    // a connection blip mid-match: the server holds our place for two minutes, so ask straight back in when we reconnect
    Net.on('_close', () => { if (CUR && CUR.onNet) CUR.onNet({ t: '_lost' }); });
    Net.on('welcome', () => setTimeout(() => { if (CUR && CUR.onNet) CUR.onNet({ t: '_rejoin' }); }, 600));
  }

  // ================================================================ the client
  PCG.arenaClient = function (w, host, arg, env, flavor) {
    const JQ = flavor === 'jq', GAME = JQ ? 'jq' : 'jrt', RU = AR.rules(GAME), W = RU.W, NW = W.filter(x => !x.mon).length, IT = RU.ITEMS;
    const full = JQ ? true : !!(env && env.full);
    const store = Apps.store, KEY = JQ ? 'jhp_fps' : 'jhp_jrt';
    const touch = E.isTouch();
    const DEF = JQ ? { sens: 1, invert: false, fov: 90, res: 200, name: '', mp: { map: 'jqdm1', mode: 'dm', bots: 4, skill: 1, frags: 15 }, autofire: touch, bob: true, fps: false }
      : { sens: 1, invert: false, fov: 95, res: touch ? 300 : 400, name: '', map: 'spacegrot', mode: 'dm', bots: 4, skill: 1, frags: 10, autofire: touch, bob: true, fps: false, hudc: 'blue', xhair: 0, xhc: 'green', voice: true };
    const cfg = Object.assign({}, DEF, store.get(KEY, {}));
    if (JQ) cfg.mp = Object.assign({}, DEF.mp, cfg.mp || {});
    const save = () => { cfg.keys = binds.save(); store.set(KEY, Object.assign({}, store.get(KEY, {}), cfg)); };
    const pset = JQ ? cfg.mp : cfg; // practice settings
    // settings saved before the bots were toned down (Oct 1999 patch) used "the usual suspects" (Callum GODLIKE) as the default
    if ((cfg.cv | 0) < 2) { if (pset.skill === -1) pset.skill = 1; cfg.cv = 2; try { store.set(KEY, Object.assign({}, store.get(KEY, {}), { cv: 2 }, JQ ? { mp: pset } : { skill: pset.skill })); } catch (e) {} }
    if (!full && AR.MAPS[pset.map] && !AR.MAPS[pset.map].demo) pset.map = 'spacegrot';
    if (!AR.MAPS[pset.map] || AR.gameOf(pset.map) !== GAME) pset.map = JQ ? 'jqdm1' : 'spacegrot';
    const binds = E.bindings(cfg.keys, JQ ? null : [['alt', 'Alt fire', ['Mouse2', 'KeyF']]]);
    const ctx = E.makeCtx(host, JQ ? { base: cfg.res, band: 16, px: true, fov: cfg.fov, far: 140, fogC: [0.07, 0.05, 0.03], fogD: 0.016 } : { base: cfg.res, band: 0, px: false, fov: cfg.fov, far: 700, fogC: [0.02, 0.02, 0.05], fogD: 0.0 });
    if (!ctx) { host.innerHTML = `<div class="pcg-ov">${JQ ? 'JAQUAKE needs a 3D card (WebGL). Your PC said no.' : 'JACKREAL TOURNAMENT needs a 3D accelerator (WebGL). Your Hoodoo said no.'}</div>`; return { close() {} }; }
    if (!JQ) ctx.hud.classList.remove('px');
    // dynamic lights: muzzle flashes, rockets, shock balls and explosions light up the walls round them (three at a time)
    if (!JQ) { ctx.uDlp = { value: [0, 0, 0].map(() => new T.Vector4(0, 0, 0, 0)) }; ctx.uDlc = { value: [0, 0, 0].map(() => new T.Vector3(0, 0, 0)) }; }
    const myName = () => (window.Net && Net.me && Net.me.nick) || cfg.name || 'Player';
    const G = { ctx, t: 0, mode: 'menu', closed: false, msgs: [], feed: [], ann: [], scoreHeld: false, flavor };
    let M = null, world = null, FX = null, A = null, views = new Map(), items = [], flags = [], projs = [], beams = [], bots = [], mons = new Map(), me = null, P = null, VM = [], flowCache = {}, ui = null, chatBox = null, muz = null, lightC = {};
    CUR = G;
    const KV = KILLV[GAME];

    // ---------------------------------------------------------------- the arena adapters (local referee, or the server)
    function localArena(o) {
      G.practiceO = { map: o.map, mode: o.mode, bots: o.bots, skill: o.skill, frags: o.frags, list: o.list, rung: o.rung }; G.ladder = o.rung != null ? o.rung : null;
      const R = new AR.Referee({ map: o.map, mode: o.mode, frags: o.frags, caps: 3, time: o.mode === 'coop' ? 15 : 0, waves: 6 });
      const meId = 1;
      R.add(meId, { name: myName() });
      const roster = []; const used = new Set([myName()]);
      const pool = BOTS.slice(); if (o.bots >= 1 && !JQ) { const ci = pool.findIndex(b => b[0] === 'Callum'); pool.unshift(pool.splice(ci, 1)[0]); }
      const list = Array.isArray(o.list) ? o.list : null; // (the Tournament Ladder names its opponents)
      for (let k = 0; k < (list ? list.length : o.bots); k++) { const b = list ? (BOTS.find(x => x[0] === list[k][0]) || [list[k][0], 1]) : pool[k % pool.length]; if (used.has(b[0])) continue; used.add(b[0]); const id = 100 + k; const sk = list ? clamp(list[k][1] | 0, 0, 4) : o.skill >= 0 ? (b[0] === 'Callum' ? Math.min(4, o.skill + (o.skill >= 2 ? 1 : 0)) : o.skill) : b[1]; R.add(id, { name: b[0], bot: true, skill: sk }); roster.push([id, b[0], sk]); }
      const A2 = {
        local: true, R, me: meId, host: true, map: R.o.map, mode: R.o.mode, roster, frags: o.frags, caps: 3, g: { match: 1, name: 'Practice', humans: [[meId, myName(), 0]] },
        ent: id => { const e = R.E.get(id); return e ? { id, name: e.name, team: e.team, p: e.p, yaw: e.yaw, pitch: e.pitch, w: e.w, hp: e.hp, ar: e.ar, alive: e.alive, ud: e.ud > Date.now(), carry: e.carry, bot: e.bot, mon: e.mon, away: false } : null; },
        ids: () => [...R.E.keys()],
        move(id, s) { R.update(id, s); }, fire(id, w2, o2, d) { return R.fire(id, w2, o2, d); }, hit(id, v, w2, dmg) { R.hit(id, v, w2, dmg); },
        respawn(id) { R.respawn(id); }, suicide(id) { R.suicide(id, 'decided to give up'); }, chat(id, text) { R.ev.push(['c', id, text]); },
        poll() { R.tick(); return R.drain(); }, mine: () => R.mine(meId), world: () => R.world(), scores: () => R.scores().map(r => r.concat([0])), state: () => R.state,
        leave() {}, rtt: () => 0,
      };
      return A2;
    }
    function netArena(g) {
      const ents = new Map(), hist = new Map(), out = { ev: [] }, inbox = [];
      let wld = { st: 'play', ts: [0, 0], it: [], fl: [], left: -1 }, mineV = null, sc = [], lastSend = 0, pingT = 0, rtt = 80;
      const names = gg => { (gg.bots || []).forEach(r => { r[1] = botNick(r[1]); }); (gg.bots || []).concat(gg.humans || []).forEach(r => { const e = ents.get(r[0]); if (e) e.name = r[1]; else ents.set(r[0], { id: r[0], name: r[1], p: [0, -99, 0], alive: false, team: -1, hp: 0, ar: 0 }); }); };
      const A2 = {
        local: false, g, me: g.you, host: false, map: g.map, mode: g.mode, roster: g.bots, frags: g.frags, caps: g.caps, spec: g.spec,
        ent: id => ents.get(id) || null, ids: () => [...ents.keys()],
        move(id, s) { if (id === A2.me) out.s = [r2(s.p[0]), r2(s.p[1]), r2(s.p[2]), r2(s.yaw), r2(s.pitch), s.w]; else (out.b = out.b || {})[id] = [id, r2(s.p[0]), r2(s.p[1]), r2(s.p[2]), r2(s.yaw), r2(s.pitch), s.w]; },
        fire(id, w2, o2, d) { out.ev.push(['f', id, w2, o2.map(r2), d.map(r2)]); return true; },
        hit(id, v, w2, dmg) { out.ev.push(['h', id, v, w2, Math.round(dmg * 10) / 10]); },
        respawn(id) { out.ev.push(['r', id]); }, suicide(id) { out.ev.push(['s', id]); }, chat(id, text) { out.ev.push(['c', id, text]); },
        poll(keep) {
          const now = performance.now();
          if (A2.spec && now - lastSend > 2000) { lastSend = now; Net.send({ t: 'arU', pg: Math.round(rtt) }); } // spectators just say they're still watching
          if (now - lastSend > (out.ev.length > 30 ? 70 : 100) && !A2.spec) { lastSend = now; const m = { t: 'arU', pg: Math.round(rtt) }; if (out.s) m.s = out.s; if (out.b) m.b = Object.values(out.b); if (out.ev.length) m.ev = out.ev.splice(0, 30); Net.send(m); out.s = null; out.b = null; }
          if (now - pingT > 3000) { pingT = now; Net.send({ t: 'arPing', k: now }); }
          return keep ? [] : inbox.splice(0);
        },
        keepalive() { Net.send({ t: 'arU', pg: Math.round(rtt) }); },
        mine: () => mineV, world: () => wld, scores: () => sc, state: () => wld.st,
        leave() { Net.send({ t: 'arLeave' }); },
        recv(m) {
          if (m.t === 'arPong') { if (m.k > 0) rtt = rtt * 0.6 + (performance.now() - m.k) * 0.4; return; }
          if (m.t === 'arG') { A2.g = m.g; A2.roster = m.g.bots; A2.host = m.g.host === m.g.you; A2.me = m.g.you; A2.frags = m.g.frags; A2.caps = m.g.caps; names(m.g); return; }
          if (m.t !== 'arS') return;
          const now = performance.now(), seen = new Set();
          for (const r of m.e) {
            const [id, x, y, z, yaw, pitch, w2, hp, ar, bits] = r; seen.add(id);
            let e = ents.get(id); if (!e) { e = { id, name: '?', p: [x, y, z] }; ents.set(id, e); }
            Object.assign(e, { p: [x, y, z], yaw, pitch, w: w2, hp, ar, alive: !!(bits & 1), ud: !!(bits & 2), carry: bits & 4 ? 1 : -1, team: bits & 8 ? 1 : bits & 32 ? 0 : -1, bot: !!(bits & 16), away: !!(bits & 64), mon: bits & 128 ? AR.MONK[(r[10] || 1) - 1] : '', srv: [x, y, z] });
            if (e.mon) { e.team = 1; if (e.name === '?') e.name = AR.MONS[e.mon].n.replace(/^an? /, ''); }
            const h = hist.get(id) || []; h.push([now, x, y, z, yaw, pitch]); if (h.length > 6) h.shift(); hist.set(id, h);
          }
          for (const id of [...ents.keys()]) if (!seen.has(id)) { ents.delete(id); hist.delete(id); }
          if (m.sc) { sc = m.sc; for (const r of sc) { if (r[6]) r[1] = botNick(r[1]); const e = ents.get(r[0]); if (e) e.name = r[1]; } }
          if (m.vt && A2.g) A2.g.vote = Object.assign({}, m.vt, { mine: A2.g.vote ? A2.g.vote.mine : -1 });
          wld = m.w || wld; mineV = m.me; inbox.push(...(m.ev || []));
          if (inbox.length > 600) inbox.splice(0, inbox.length - 600);
        },
        // where to draw someone: ~120 ms in the past, smoothly between two snapshots
        interp(id, now) {
          const h = hist.get(id); if (!h || !h.length) return null;
          const t = now - 120; let a = h[0], b = h[h.length - 1];
          for (let k = 0; k < h.length - 1; k++) if (h[k][0] <= t && h[k + 1][0] >= t) { a = h[k]; b = h[k + 1]; break; }
          if (t >= b[0]) return b.slice(1);
          const f = clamp((t - a[0]) / Math.max(1, b[0] - a[0]), 0, 1), dy = ((b[4] - a[4] + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f, a[4] + dy * f, a[5] + (b[5] - a[5]) * f];
        },
        rtt: () => rtt,
      };
      names(g);
      return A2;
    }
    const r2 = v => Math.round(v * 100) / 100;
    // a hidden tab doesn't run the game loop: keep our place on the server warm anyway
    const keepIv = setInterval(() => { if (A && !A.local && A.keepalive && document.hidden && G.mode === 'game') A.keepalive(); }, 4000);

    // ---------------------------------------------------------------- building a match
    function startMatch(a) {
      E.music(JQ ? 'jaquake' : 'jrt', false);
      A = a; G.mode = 'loading'; G.over = null; G.feed = []; G.ann = []; G.msgs = []; G.vote = null; G.voteEl = null;
      ui.innerHTML = ''; ui.style.pointerEvents = 'none'; input.unlock();
      const meta = AR.MAPS[a.map] || AR.MAPS.spacegrot, tips = TIPS[GAME];
      const ld = E.loading(host, { style: GAME, head: a.local ? 'PRACTICE' : `CONNECTING TO ${String(a.g && a.g.name || 'SERVER').toUpperCase()}`, title: meta.title, by: meta.by, blurb: meta.blurb, tip: tips[Math.floor(Math.random() * tips.length)] });
      setTimeout(() => {
        if (G.closed || A !== a) { ld.done(); return; }
        try { build(a); } catch (e) { console.error(e); }
        ld.done(); G.mode = 'game';
        if (a.spec) say('You are SPECTATING. Click to watch the next player, SPACE for a free camera.', 6);
        else say(a.mode === 'ctf' ? 'Capture the Flag: grab their flag and bring it home!' : a.mode === 'coop' ? 'Co-op: waves of monsters are coming. Stick together!' : `DeathMatch: first to ${a.frags} frags wins!`, 5);
        if (!a.local && a.g && a.g.pub && !a.spec) say(`Welcome to ${a.g.name}! Bots fill the empty slots. Press ${binds.label('talk')} to talk.`, 6);
        grab();
      }, 60);
    }
    function build(a) {
      ctx.clearMap(); G.dl = []; views = new Map(); items = []; flags = []; projs = []; beams = []; bots = []; mons = new Map(); flowCache = {}; lightC = {}; projMats = {};
      M = AR.map(a.map); a.map = M.id;
      const meta = M.meta, L = meta.look || {}, half = M.w * M.S / 2;
      const lights = [];
      if (M.id === 'spacegrot') {
        M.cells.forEach(c => { if (!c.s && !c.v && c.f === 1) c.ft = (c.i + 0.5) * M.S < half ? 'jred' : 'jblue'; if (!c.s && !c.v && c.f >= 3) c.ft = 'jslab'; });
        M.pads.forEach(p => { M.cell(p.i, p.j).ft = 'jpad'; lights.push({ x: p.x, y: p.y + 1, z: p.z, c: [0.3, 0.8, 1], i: 1, rad: 7 }); });
        M.flags.forEach(f => lights.push({ x: f.x, y: f.y + 2.5, z: f.z, c: f.team ? [0.3, 0.45, 1] : [1, 0.3, 0.25], i: 1.4, rad: 12 }));
        lights.push({ x: half, y: 4, z: M.h * M.S / 2, c: [1, 0.9, 0.7], i: 1, rad: 14 });
        for (let k = 0; k < 6; k++) lights.push({ x: 8 + k * 9, y: 6, z: 4 + (k % 2) * 36, c: [0.7, 0.75, 1], i: 0.8, rad: 12 });
      } else if (M.id === 'castle') {
        M.flags.forEach(f => lights.push({ x: f.x, y: 3, z: f.z, c: f.team ? [0.4, 0.5, 1] : [1, 0.45, 0.3], i: 1.2, rad: 9, flick: true }));
        M.cells.forEach(c => { if (c.ch === 'k' && (c.i + c.j) % 4 === 0) lights.push({ x: (c.i + 0.5) * M.S, y: 3.3, z: (c.j + 0.5) * M.S, c: [1, 0.65, 0.35], i: 0.9, rad: 6, flick: true }); });
        lights.push({ x: half, y: 10, z: M.h * M.S / 2, c: [1, 0.8, 0.6], i: 0.7, rad: 30 });
      } else {
        M.lights.forEach(l => lights.push({ x: l.x, y: l.y + l.h, z: l.z, c: l.c, i: l.i, rad: l.rad, flick: !!L.quake }));
        M.flags.forEach(f => lights.push({ x: f.x, y: f.y + 2.5, z: f.z, c: f.team ? [0.35, 0.5, 1] : [1, 0.35, 0.28], i: 1.3, rad: 10 }));
        M.pads.forEach(p => { M.cell(p.i, p.j).ft = 'jpad'; lights.push({ x: p.x, y: p.y + 1, z: p.z, c: [0.3, 0.8, 1], i: 1, rad: 7 }); });
        M.torches.forEach(t => { const off = wallSide(t); t.fl = off; lights.push({ x: off[0], y: t.y + 2.3, z: off[2], c: [1.0, 0.62, 0.28], i: 1.5, rad: 9.5, flick: true }); });
        M.lamps.forEach(t => { const c = M.at(t.x, t.z); lights.push({ x: t.x, y: (c.sky ? t.y + 4 : c.c) - 0.4, z: t.z, c: [0.95, 0.9, 0.75], i: 1.3, rad: 12 }); });
        if (L.quake) { const seen = {}; M.cells.forEach(c => { const key = (k, d) => Math.floor(c.i / d) + ',' + Math.floor(c.j / d) + k; if (c.liq === 'lava' && !seen[key('l', 3)]) { seen[key('l', 3)] = 1; lights.push({ x: (c.i + 1) * M.S, y: c.lv + 0.6, z: (c.j + 1) * M.S, c: [1, 0.45, 0.12], i: 1.2, rad: 8 }); } if (c.liq === 'slime' && !seen[key('s', 3)]) { seen[key('s', 3)] = 1; lights.push({ x: (c.i + 1) * M.S, y: c.lv + 0.5, z: (c.j + 1) * M.S, c: [0.4, 0.9, 0.3], i: 0.7, rad: 6 }); } if (c.sky && !c.liq && !c.s && !seen[key('k', 4)]) { seen[key('k', 4)] = 1; lights.push({ x: (c.i + 1.5) * M.S, y: c.c - 1, z: (c.j + 1.5) * M.S, c: [0.7, 0.62, 0.8], i: 0.65, rad: 10 }); } }); }
        else lights.push({ x: half, y: 10, z: M.h * M.S / 2, c: [1, 0.85, 0.7], i: 0.6, rad: 30 });
      }
      if (!L.quake && (M.id === 'spacegrot' || M.id === 'foundry')) { // the glowing strips on the tech walls throw a little cool light on the floor
        let n = 0; M.cells.forEach(c => { if (c.s || c.v || (c.i * 3 + c.j) % 5) return; for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const w = M.cell(c.i + a, c.j + b); if (w.s && n < 60) { n++; lights.push({ x: (c.i + 0.5 + a * 0.45) * M.S, y: c.f + 1.5, z: (c.j + 0.5 + b * 0.45) * M.S, c: [0.35, 0.65, 1], i: 0.5, rad: 4.5 }); break; } } });
      }
      if (L.quake) {
        const fog = L.fog || [0.07, 0.05, 0.03]; ctx.fogC.set(fog[0], fog[1], fog[2]); ctx.fogD = 0.016;
        world = E.buildWorld(ctx, M, { lights, amb: L.amb || [0.3, 0.26, 0.22], full: ['light'], shadows: !touch, sub: touch ? 2 : 1 });
        M.torches.forEach(t => PCG.jqArt.jqFlame(ctx, t.fl[0], t.y + 2.15, t.fl[2]));
        M.lamps.forEach(t => { const c = M.at(t.x, t.z), top = c.sky ? t.y + 4 : c.c; E.boxMesh(ctx, M, lightAt, 'light', t.x - 0.35, top - 0.12, t.z - 0.35, t.x + 0.35, top, t.z + 0.35, { mat: E.worldMat(ctx, E.tex(ctx, 'light'), { full: 1.3 }) }); });
        ctx.camera.far = 140;
      } else {
        const amb = M.id === 'spacegrot' ? [0.5, 0.52, 0.62] : M.id === 'castle' ? [0.62, 0.52, 0.46] : (L.amb || [0.6, 0.52, 0.48]);
        const ft = L.ft || (M.id === 'spacegrot' ? 'jfloor' : 'cobble'), wt = L.wt || (M.id === 'spacegrot' ? 'jpanel' : 'cstone'), st = L.st || (M.id === 'spacegrot' ? 'jslab' : 'cstone');
        world = E.buildWorld(ctx, M, utLook(M, { lights, amb, sky: 'dome', lin: true, sub: touch ? 2 : 1, roof: 7, ft, wt, st, ct: L.ct || 'wood', rt: L.rt || 'cstone', shadows: !touch }));
        ctx.scene.add(E.dome(ctx, meta.sky));
        ctx.camera.far = 700;
      }
      if (M.id === 'spacegrot') { // a big ringed planet and a moon hanging in space
        const pl = E.model(ctx, [['p', 60, 60, 60, 0, 0, 0, 0xb0603a], ['r', 120, 2, 120, 0, 0, 0, 0xd8c8a0], ['m', 12, 12, 12, -90, 40, 50, 0xa0a0b0]], { lin: true, full: 0.9 });
        pl.position.set(-150, -90, -260); pl.rotation.set(0.35, 0.6, 0.2); pl.traverse(x => { x.frustumCulled = false; }); ctx.scene.add(pl); G.planet = pl;
      } else G.planet = null;
      ctx.camera.updateProjectionMatrix();
      ctx.uFlick.value = 1; if (!L.quake) ctx.fogD = 0;
      FX = E.fx(ctx, touch ? 500 : 1200);
      M.items.forEach((it, i) => {
        const m = itemModel(ctx, it.it, JQ); m.position.set(it.x, it.y, it.z); ctx.scene.add(m); E.setLight(m, lightAt(it.x, it.y + 1, it.z), JQ ? 1.5 : 1.2);
        let halo = null;
        if (!JQ) { // a pickup pad under every item, and a soft glow round it
          const I = IT[it.it] || {}, col = I.hp ? [0.3, 1, 0.45] : I.ar ? [1, 0.8, 0.25] : I.ud ? [0.75, 0.35, 1] : I.w != null ? [1, 0.6, 0.25] : [0.5, 0.8, 1], hx = new T.Color(col[0] * 0.55, col[1] * 0.55, col[2] * 0.55).getHex();
          const base = E.model(ctx, [['b', 1.0, 0.08, 1.0, 0, 0.04, 0, 0x3a3e4a], ['e', 1.06, 0.04, 1.06, 0, 0.02, 0, 0x22242c], ['r', 0.74, 0.03, 0.74, 0, 0.09, 0, hx]], { lin: true, full: 0.7 }); base.position.set(it.x, it.y, it.z); ctx.scene.add(base); E.setLight(base, lightAt(it.x, it.y + 1, it.z), 1.1);
          halo = new T.Sprite(glowMat(col)); halo.scale.setScalar(I.big ? 2.2 : 1.5); halo.position.set(it.x, it.y + 0.65, it.z); halo.material = halo.material; ctx.scene.add(halo);
        }
        items.push({ i, it: it.it, m, halo, p: [it.x, it.y, it.z], ph: i, big: !!(IT[it.it] && IT[it.it].big) });
      });
      M.pads.forEach(p => { const g = E.model(ctx, [['a', 1.6, 0.08, 1.6, 0, 0.05, 0, 0x60d0ff]], { lin: true, full: 1 }); g.position.set(p.x, p.y, p.z); ctx.scene.add(g); p.glow = g; });
      if (a.mode === 'ctf') M.flags.forEach(f => { const m = flagModel(ctx, f.team), base = E.model(ctx, [['b', 1.4, 0.12, 1.4, 0, 0.06, 0, TEAMH[f.team]]], { lin: true, full: 0.8 }); base.position.set(f.x, f.y, f.z); ctx.scene.add(base); ctx.scene.add(m); flags.push({ team: f.team, m }); });
      // the player
      P = { p: [0, 0, 0], v: [0, 0, 0], r: 0.4, h: 1.8, yaw: 0, pitch: 0, ground: false, w: 1, cool: 0, am: W.map(x => x.start), has: RU.start, lastFire: 0, dead: true, sy: 0, bob: 0, kick: 0, roll: 0, dodgeT: {}, spec: !!a.spec, follow: 0, stepT: 0 };
      me = a.me;
      buildVM();
      syncBots();
      G.started = G.t; G.firstBlood = false;
      M.jumpUp = Math.min(2.2, Math.pow(JQ ? 7.3 : 7.6, 2) / (2 * M.meta.grav) * 0.82);
    }
    function lightAt(x, y, z) { const k = Math.floor(x) + ',' + Math.floor(y) + ',' + Math.floor(z); return lightC[k] || (lightC[k] = world.lightAt(x, y, z, null, null, null, true)); }
    function wallSide(e) { for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (M.cell(e.i + a, e.j + b).s) return [e.x + a * 0.85, 0, e.z + b * 0.85]; return [e.x, 0, e.z]; }
    function buildVM() {
      VM.forEach(m => { ctx.wscene.remove(m); m.traverse(x => { if (x.geometry) x.geometry.dispose(); }); }); VM = [];
      if (JQ) { VM = PCG.jqArt.jqVM(ctx); return; }
      const me0 = A && A.mode === 'ctf' ? A.ent(A.me) : null, slv = me0 && me0.team >= 0 ? (me0.team ? 0x2a4ab0 : 0xa02a20) : undefined; // your sleeves are in your team's colour
      for (let k = 0; k < NW; k++) { const m = gunModel(ctx, k, 0.34, true, slv); m.visible = false; ctx.wscene.add(m); VM.push(m); }
    }
    // bots that this browser drives: all of them in practice, the server's list when we're the online host
    function syncBots() {
      if (!A) return;
      const want = A.host ? (A.roster || []) : [];
      bots = bots.filter(b => want.some(r => r[0] === b.id));
      for (const [id, name, skill] of want) if (!bots.some(b => b.id === id)) {
        const e = A.ent(id), def = BOTS.find(b => b[0] === name);
        bots.push({ id, name, skill: skill || 0, p: e ? e.p.slice() : [0, 0, 0], v: [0, 0, 0], r: 0.4, h: 1.8, yaw: e ? e.yaw || 0 : 0, pitch: 0, ground: false, w: e && e.w != null && e.w < NW ? e.w : 1, cool: 1, am: W.map(x => x.start), has: RU.start, think: 0, goalT: 0, strafe: 1, strafeT: 0, taunts: def ? def[2] : ['Gg.'], react: 0, aimErr: [0, 0], dead: !(e && e.alive), deadT: G.t, role: Math.random() < 0.5 ? 'attack' : 'defend', stuck: 0, lastP: null });
      }
      if (!A.host) mons = new Map();
    }

    // ---------------------------------------------------------------- events from the referee / server
    const nameOfId = id => { const e = A.ent(id); return e ? e.name : (id === me ? myName() : 'Someone'); };
    function say(s, secs) { G.msgs.push({ s, t: G.t + (secs || 4) }); if (G.msgs.length > 5) G.msgs.shift(); }
    function announce(s, big) { G.ann.push({ s, t: G.t + 2.6, big }); if (G.ann.length > 3) G.ann.shift(); sfx(big ? 'big' : 'announce', 100); speak(s); }
    // the announcer's voice (JRT): a deep, slow reading of the big moments, through the PC's own speech (if it has any)
    function speak(s) {
      if (JQ || cfg.voice === false || !window.Sound || !Sound.on || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      const me_ = myName(), mine = s.indexOf(me_) === 0, t = String(s);
      let say_ = null;
      if (/FIRST POOF/.test(t)) say_ = 'First poof!';
      else if (/^(Double|Multi|Ultra) Poof|MONSTER POOF/.test(t)) say_ = t.replace(/M-M-M-/, 'M M M ').replace(/!+/g, '!');
      else if (/THE MATCH HAS BEGUN/.test(t)) say_ = 'Play!';
      else if (/COMBO/.test(t)) say_ = 'Combo!';
      else if (/TEAM SCORES/.test(t)) say_ = /RED TEAM/.test(t) ? 'Red team scores!' : 'Blue team scores!';
      else if (mine && /SPREE|RAMPAGE|DOMINATING|UNSTOPPABLE|GODLIKE/.test(t)) say_ = (t.match(/POOFING SPREE|RAMPAGE|DOMINATING|UNSTOPPABLE|GODLIKE/) || ['Spree'])[0].toLowerCase() + '!';
      else if (/WINS? THE MATCH/.test(t)) { const e = A && A.ent(me), w = t.indexOf(me_) === 0 || (e && A.mode === 'ctf' && t.indexOf(AR.TEAM[e.team] + ' team') === 0) || (A && A.mode === 'coop' && /^The players/.test(t)); say_ = w ? 'You have won the match!' : 'You have lost the match.'; }
      if (!say_) return;
      try {
        const u = new SpeechSynthesisUtterance(say_), vs = speechSynthesis.getVoices() || [];
        u.voice = vs.find(v => /en-GB/i.test(v.lang) && /male|daniel|george|uk/i.test(v.name)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
        u.pitch = 0.45; u.rate = 0.9; u.volume = 0.9; speechSynthesis.cancel(); Sound.speak(u);
      } catch (e) {}
    }
    function handle(ev) {
      for (const e of ev) {
        const k = e[0];
        if (k === 'sp') {
          const [, id, x, y, z, yaw] = e;
          if (id === me && !P.spec) { P.p = [x, y, z]; P.v = [0, 0, 0]; P.yaw = yaw; P.pitch = 0; P.dead = false; P.am = W.map(q => q.start); P.has = RU.start; P.w = 1; P.swap = SWAP; JQ ? sfx('respawn') : jsfx('respawn2'); G.spawnFx = 0.5; G.hurt = 0; G.hurtDirs = []; }
          else if (FX) { FX.spray(x, y + 1, z, 12, [0.6, 0.8, 1], 3, 0.5, 0); if (!JQ) { ringFx(x, y + 0.1, z, 2, [0.55, 0.8, 1]); for (let q = 0; q < 10; q++) FX.emit(x + (Math.random() - 0.5) * 0.9, y + Math.random() * 1.8, z + (Math.random() - 0.5) * 0.9, 0, 1.5, 0, [0.7, 0.9, 1], 0.6, 0); } }
          const b = bots.find(q => q.id === id); if (b) { b.p = [x, y, z]; b.v = [0, 0, 0]; b.yaw = yaw; b.dead = false; b.am = W.map(q => q.start); b.has = RU.start; b.w = 1; b.goalT = 0; b.target = null; b.react = G.t + 0.4; b.yawV = 0; b.burstT = 0; b.cool = 0.3; }
          const mb = mons.get(id); if (mb) { mb.p = [x, y, z]; mb.v = [0, 0, 0]; }
        } else if (k === 'fix') { const [, id, x, y, z] = e; if (id === me) { P.p = [x, y, z]; P.v = [0, 0, 0]; } const b = bots.find(q => q.id === id) || mons.get(id); if (b) { b.p = [x, y, z]; b.v = [0, 0, 0]; } }
        else if (k === 'f') { const [, id, w2, ox, oy, oz, dx, dy, dz] = e; if (id !== me && !bots.some(b => b.id === id) && !mons.has(id)) shotFx(id, w2, [ox, oy, oz], [dx, dy, dz], false); }
        else if (k === 'h') {
          const [, vid, dmg, by] = e;
          if (vid === me) {
            G.hurt = Math.min(1, (G.hurt || 0) + dmg / 60); P.ouch = G.t + 0.4; sfx('hurt', 120);
            const s = by ? A.ent(by) : null;
            if (s && by !== me) { const sp = drawPos(by) || s.p, dx = P.p[0] - sp[0], dz = P.p[2] - sp[2], l = Math.hypot(dx, dz) || 1; P.v[0] += dx / l * dmg * 0.06; P.v[2] += dz / l * dmg * 0.06; G.hurtDirs = (G.hurtDirs || []).filter(h => h.t > G.t).concat([{ a: Math.atan2(-(sp[0] - P.p[0]), -(sp[2] - P.p[2])), t: G.t + 1.2, k: Math.min(1, dmg / 30 + 0.3) }]).slice(-4); }
          }
          if (by === me && vid !== me) { G.hitT = G.t + 0.18; G.hitK = Math.min(1.6, 0.6 + dmg / 40); sfx('hit', 50); }
          const v = A.ent(vid); if (v && v.mon) { const mv = views.get(vid); if (mv) mv.flash = 1; }
          const b = bots.find(q => q.id === vid); if (b && by && by !== vid) { b.hurtBy = by; b.hurtT = G.t; b.dodgeT = G.t; if (b.target !== by && Math.random() < 0.7) { b.target = by; b.tl = null; b.burstT = 0; b.react = G.t + (b.reactV || 0.8) * (0.6 + Math.random() * 0.4); } }
          const mb = mons.get(vid); if (mb && by && by !== vid) { mb.target = by; mb.awake = true; }
        }
        else if (k === 'k') {
          const [, kid, vid, w2, why] = e, v = A.ent(vid), at = vid === me ? P.p : (drawPos(vid) || (v ? v.p : null));
          const big = v && v.mon === 'bigrobot';
          if (at) { if (vid === me && !P.spec) FX.spray(at[0], at[1] + 0.9, at[2], 30, [1, 0.95, 0.6], 5, 0.6, 2); else FX.poof(at[0], at[1] + 0.9, at[2], big); sfx('poof', 50); }
          const kn = nameOfId(kid), vn = nameOfId(vid);
          const kv = w2 >= ALT ? (KILLA[w2 - ALT] || KV[w2 - ALT]) : KV[w2], line = kid === vid || w2 < 0 ? `${vn} ${why || 'had an accident'}` : `${vn} ${kv ? kv[0] : 'was poofed by'} ${kn}${kv ? kv[1] : ''}`;
          if (!(v && v.mon) || kid === me) { G.feed.push({ s: line, t: G.t + 5, mine: kid === me || vid === me }); if (G.feed.length > 5) G.feed.shift(); if (!JQ) conPrint(line); }
          if (vid === me) { P.dead = true; P.deadT = G.t; P.killer = kid; P.killW = w2; sfx('die'); }
          const b = bots.find(q => q.id === vid); if (b) { b.dead = true; b.deadT = G.t; }
          if (mons.has(vid)) mons.delete(vid);
          const kb = bots.find(q => q.id === kid); if (kb && kid !== vid && !(v && v.mon) && Math.random() < 0.3) setTimeout(() => { if (A && !G.closed && kb) A.chat(kb.id, kb.taunts[Math.floor(Math.random() * kb.taunts.length)]); }, 600 + Math.random() * 900);
          if (kid === me && vid !== me) { sfx('frag'); G.fragT = G.t + 1.2; G.fragN = vn; }
        }
        else if (k === 'a') { const [, to, text, big] = e; if (to === 0 || to === me) { announce(text, big); if (to === me && /MONSTER/.test(text)) Apps.secret('fps.monster'); if (/FIRST (BLOOD|POOF)/.test(text) && text.indexOf(myName()) === 0 && !A.local) Apps.secret('fps.firstblood'); } }
        else if (k === 'pk') {
          const [, id, i] = e, it = M.items[i]; if (!it) continue;
          const I = IT[it.it]; if (!I) continue;
          if (id === me) { say('You got ' + (/^(the |\d|QUAD|MEGA)/.test(I.n) ? I.n : 'the ' + I.n), 2.5); sfx(I.w != null ? 'weapon' : I.ud ? 'quad' : I.hp ? 'health' : 'pickup'); if (I.w != null) { const had = P.has & (1 << I.w); P.has |= 1 << I.w; P.am[I.w] = Math.min(W[I.w].max, Math.max(0, P.am[I.w]) + W[I.w].pick); if (!had && I.w > P.w) { P.w = I.w; P.swap = SWAP; } } if (I.am != null) P.am[I.am] = Math.min(W[I.am].max, Math.max(0, P.am[I.am]) + I.amN); G.flash = 0.2; if (I.ud) Apps.secret('fps.quad'); }
          const b = bots.find(q => q.id === id && !q.auto); if (b) { if (I.w != null) { b.has |= 1 << I.w; b.am[I.w] = Math.min(W[I.w].max, Math.max(0, b.am[I.w]) + W[I.w].pick); } if (I.am != null) b.am[I.am] = Math.min(W[I.am].max, Math.max(0, b.am[I.am]) + I.amN); b.goalT = 0; }
          const iv = items[i]; if (iv && FX) FX.spray(iv.p[0], iv.p[1] + 0.5, iv.p[2], 8, [1, 1, 0.7], 2, 0.4, 0);
        }
        else if (k === 'up') { const iv = items[e[1]]; if (iv && FX) { FX.spray(iv.p[0], iv.p[1] + 0.4, iv.p[2], JQ ? 10 : 22, [0.7, 0.9, 1], 2.5, 0.6, -1); if (!JQ) { ringFx(iv.p[0], iv.p[1] + 0.15, iv.p[2], 1.6, [0.6, 0.85, 1]); for (let q = 0; q < 8; q++) FX.emit(iv.p[0] + (Math.random() - 0.5) * 0.8, iv.p[1] + Math.random() * 0.3, iv.p[2] + (Math.random() - 0.5) * 0.8, 0, 2 + Math.random() * 1.5, 0, [0.85, 0.95, 1], 0.7, 0); } if (Math.hypot(iv.p[0] - P.p[0], iv.p[2] - P.p[2]) < 12) JQ ? sfx('pickup', 400) : jsfx('item', 400); } }
        else if (k === 'fl') { const [, team, what, id] = e; sfx('flagx', 200); if (what === 'cap' && id === me) Apps.secret('fps.flag'); }
        else if (k === 'c') { const [, id, text] = e; G.feed.push({ s: `${nameOfId(id)}: ${text}`, t: G.t + 7, chat: true }); if (G.feed.length > 6) G.feed.shift(); sfx('talk', 100); }
        else if (k === 'end') {
          const [, who] = e; G.over = { who, t: G.t }; announce(`${who} ${/^(The players|Red team|Blue team)$/.test(who) ? 'WIN' : 'WINS'} THE MATCH!`, true);
          const meE = A.ent(me), won = who === myName() || (meE && ((A.mode === 'ctf' && who === `${AR.TEAM[meE.team]} team`) || (A.mode === 'coop' && who === 'The players')));
          setTimeout(() => sfx(won ? 'win' : 'lose'), 400);
          if (who === myName() && A.local && A.roster.some(r => r[1] === 'Callum')) Apps.secret('fps.callum');
          if (won && !A.local) Apps.secret(JQ ? 'fps.jqwin' : 'fps.netwin');
          if (A.mode === 'coop' && who === 'The players') Apps.secret('fps.coop');
          if (A.local && G.ladder != null && !JQ) { if (won) { cfg.ladder = Math.max(cfg.ladder | 0, G.ladder + 1); save(); if (G.ladder >= LADDER.length - 1) Apps.secret('fps.ladder'); } const lw = !!won; setTimeout(() => ladderEnd(lw), 3200); }
          input.unlock(); G.scoreHeld = false;
        }
        else if (k === 'start') { G.over = null; announce('THE MATCH HAS BEGUN!', true); G.firstBlood = false; closeVote(); grab(); }
        else if (k === 'x') { const v = views.get(e[1]); if (v) { ctx.scene.remove(v.m); views.delete(e[1]); } mons.delete(e[1]); }
      }
    }

    // ---------------------------------------------------------------- shooting (the shooter's browser decides hits; the referee checks them)
    // a gun's variant: primary, or its alt fire (weapon number + AR.ALT on the wire)
    const ALT = AR.ALT || 8;
    const wvar = wf => { const alt = wf >= ALT, w2 = alt ? wf - ALT : wf, gun = W[w2]; return gun ? { w2, alt, gun, wp: alt ? gun.alt : gun } : null; };
    const wcd = wp => wp.cd || wp.rate;
    function shoot(sh, isMe, alt) {
      const w2 = sh.w, gun = W[w2]; if (!gun) return false;
      const wp = alt && gun.alt ? gun.alt : gun; alt = wp !== gun;
      if (sh.cool > 0) return false;
      if (gun.max >= 0 && sh.am[w2] <= 0) { if (isMe) { sfx('empty', 200); const nx = bestWeapon(sh, 20); if (nx !== w2) { sh.w = nx; P.swap = SWAP; say('Out of ammo!', 1.5); } } return false; }
      sh.cool = wcd(wp); if (gun.max >= 0) sh.am[w2]--;
      const eye = [sh.p[0], sh.p[1] + (sh.mon ? AR.MONS[sh.mon].h * 0.75 : 1.55), sh.p[2]], d = E.fwd(sh.yaw, sh.pitch);
      if (isMe) { P.kick = alt ? 1.15 : 1; P.kickW = w2; P.lastFire = G.t; P.lastAlt = alt; muzzleFlash(alt); G.recoil = Math.min(0.05, (G.recoil || 0) + (RECOIL[w2] || 0) * (alt ? 1.3 : 1)); }
      const wf = w2 + (alt ? ALT : 0);
      A.fire(sh.id, wf, eye, d);
      shotFx(sh.id, wf, eye, d, true);
      // UT's hammer jump: hit the floor with the Impact Jackhammer and it throws you up in the air (and stings a bit)
      if (isMe && !JQ && w2 === 0 && !alt && P.pitch < -0.85 && P.ground) { P.v[1] = 10.5; P.ground = false; A.hit(me, me, 0, 12); say('HAMMER JUMP!', 1.2); }
      return true;
    }
    const RECOIL = [0, 0.006, 0.012, 0.0025, 0.016, 0.014]; // how far each shot kicks your aim up (it settles back)
    function muzzleFlash(alt) {
      const wp = W[P.w]; if (!muz || wp.range < 3) return;
      const big = /rokkit|rjack|flak|boom/.test(wp.id), col = wp.id === 'shokka' ? [0.75, 0.55, 1] : [1, 0.95, 0.75];
      if (JQ) { const mz = PCG.jqArt.MUZ[P.w] || [0.1, -0.11, -0.5]; muz.fire(mz[0], mz[1], mz[2], big ? 0.16 : 0.1, col); } else { const vm = VM[P.w], v = new T.Vector3(); if (vm) { vm.updateMatrixWorld(true); (vm.parts.tip || vm).getWorldPosition(v); } muz.fire(v.x, v.y, v.z - 0.02, (big ? 0.2 : 0.13) * (alt ? 1.2 : 1) * (0.85 + Math.random() * 0.3), col); }
      G.mflash = 0.06;
    }
    function targetsFor(id) {
      const out = [], tm = teamOf(id), teams = A.mode === 'ctf' || A.mode === 'coop';
      for (const eid of A.ids()) { if (eid === id) continue; const e = A.ent(eid); if (!e || !e.alive) continue; if (teams && e.team >= 0 && e.team === tm) continue; const S = e.mon ? AR.MONS[e.mon] : null; out.push({ id: eid, p: drawPos(eid) || e.p, r: S ? S.r + 0.1 : 0.45, h: S ? S.h : 1.85, away: e.away }); }
      return out;
    }
    function teamOf(id) { const e = A.ent(id); return e ? e.team : -1; }
    function shotFx(id, wf, o, d, owner) {
      const V = wvar(wf); if (!V) return; const { w2, alt, gun, wp } = V;
      const sh = id === me ? P : bots.find(b => b.id === id) || mons.get(id);
      if (JQ) sfx(gun.sfx || gun.id, w2 === 3 && !JQ ? 70 : 30); else jsfx(gun.id + (alt ? '2' : ''), w2 === 3 ? 45 : 25, id === me ? 1 : 0.7);
      const muzzle = [o[0] + d[0] * 0.7, o[1] + d[1] * 0.7 - 0.15, o[2] + d[2] * 0.7];
      if (id !== me && FX && wp.range > 4) { FX.flash(muzzle[0], muzzle[1], muzzle[2], wp.proj ? 0.6 : 0.45, w2 === 2 && !JQ ? [0.7, 0.5, 1] : null); if (Math.random() < 0.5 || w2 !== 3) dlight(muzzle, w2 === 2 ? [0.6, 0.4, 1] : [1, 0.85, 0.5], 4, 0.08); }
      if (wp.range <= 4) { // melee (the alt "shove" reaches a bit further and pushes)
        if (owner) { const h = E.rayEnts(o, d, wp.range, targetsFor(id)); if (h) { A.hit(id, h.e.id, wf, wp.dmg); FX.spray(o[0] + d[0] * h.t, o[1] + d[1] * h.t, o[2] + d[2] * h.t, 8, [1, 1, 0.8], 3, 0.3); if (id === me) sfx('clang', 80); } }
        if (!JQ && FX) FX.spray(o[0] + d[0] * 1.4, o[1] + d[1] * 1.4 - 0.2, o[2] + d[2] * 1.4, alt ? 10 : 5, alt ? [0.6, 0.85, 1] : [1, 0.9, 0.6], alt ? 5 : 3, 0.25, 0);
        void sh; return;
      }
      if (!wp.proj) { // hitscan (the Boomstick fires seven pellets; the Rattler and the pistol's rapid fire spray a bit)
        const n = wp.pellets || 1, tg = owner ? targetsFor(id) : null, spread = wp.spread || (n > 1 ? 0.085 : 0);
        for (let k = 0; k < n; k++) {
          let dd = d; if (spread) { dd = [d[0] + (Math.random() - 0.5) * spread, d[1] + (Math.random() - 0.5) * spread * 0.7, d[2] + (Math.random() - 0.5) * spread]; const l = Math.hypot(dd[0], dd[1], dd[2]); dd = dd.map(v => v / l); }
          const range = wp.range, wall = M.ray(o[0], o[1], o[2], dd[0], dd[1], dd[2], range) || range;
          let end = wall, hitE = null;
          if (tg) { const h = E.rayEnts(o, dd, wall, tg); if (h) { end = h.t; hitE = h.e; } }
          // the SHOCK COMBO: a Shock Jack beam through your own shock ball sets it off
          if (!JQ && w2 === 2 && !alt) { const ball = projs.find(pr => !pr.dead && pr.ball && pr.id === id && (() => { const rx = pr.p[0] - o[0], ry = pr.p[1] - o[1], rz = pr.p[2] - o[2], t = rx * dd[0] + ry * dd[1] + rz * dd[2]; return t > 0 && t < end + 0.6 && Math.hypot(rx - dd[0] * t, ry - dd[1] * t, rz - dd[2] * t) < 0.75; })()); if (ball) { end = Math.hypot(ball.p[0] - o[0], ball.p[1] - o[1], ball.p[2] - o[2]); hitE = null; ball.combo = true; ball.life = 0; } }
          const hp = [o[0] + dd[0] * end, o[1] + dd[1] * end, o[2] + dd[2] * end];
          if (hitE) { A.hit(id, hitE.id, wf, wp.dmg); FX.spray(hp[0], hp[1], hp[2], n > 1 ? 2 : 6, [1, 0.9, 0.6], 3, 0.3); }
          else FX.spray(hp[0] - dd[0] * 0.05, hp[1] - dd[1] * 0.05, hp[2] - dd[2] * 0.05, w2 === 2 && !JQ ? 14 : n > 1 ? 1 : 3, w2 === 2 && !JQ ? [0.7, 0.5, 1] : wp.id === 'zap' ? [0.5, 0.8, 1] : [0.9, 0.85, 0.7], 3, 0.35);
          if (!JQ) beam(id === me ? [o[0] + d[0] * 1.4 + Math.cos(P.yaw) * 0.25, o[1] - 0.3, o[2] + d[2] * 1.4 - Math.sin(P.yaw) * 0.25] : muzzle, hp, w2 === 2 ? 0x9060ff : w2 === 3 ? 0xffd040 : 0xfff0c0, w2 === 2 ? 0.07 : 0.025, w2 === 2 ? 0.4 : 0.06, w2 === 2 ? 1 : 1.4);
          else if (wp.id === 'zap') beam(muzzle, hp, 0x60b0ff, 0.05, 0.15);
          else if (k === 0 && n === 1) beam(muzzle, hp, 0xfff0c0, 0.02, 0.05);
          if (!JQ && w2 === 2 && FX) ringFx(hp[0] - dd[0] * 0.1, hp[1] - dd[1] * 0.1, hp[2] - dd[2] * 0.1, 0.5, [0.75, 0.55, 1]);
        }
        return;
      }
      // projectiles: [speed, count, spread, life, gravity, bounces]
      const kind = alt ? { shokka: 'sball', flak: 'flakb', rokkit: 'gren' }[gun.id] || gun.id : gun.id;
      const PR = { flak: [55, 9, 0.14, 1.4, 6, 1], rokkit: [30, 1, 0, 6, 0, 0], sball: [20, 1, 0, 4, 0, 0], flakb: [24, 1, 0, 3, 14, 0], gren: [16, 1, 0, 1.8, 16, 9], rivet: [42, 1, 0, 3, 0, 0], rjack: [19, 1, 0, 6, 0, 0], bigrock: [14, 1, 0, 6, 0, 0] }[kind] || [20, 1, 0, 5, 0, 0];
      const [speed, count, spr, life, grav, bounce] = PR;
      for (let c = 0; c < count; c++) {
        let dd = d; if (spr) { const s = [d[0] + (Math.random() - 0.5) * spr, d[1] + (Math.random() - 0.5) * spr * 0.7, d[2] + (Math.random() - 0.5) * spr], l = Math.hypot(...s); dd = s.map(v => v / l); }
        if (grav && kind !== 'flak') { dd = [dd[0], dd[1] + 0.22, dd[2]]; const l = Math.hypot(...dd); dd = dd.map(v => v / l); } // lobbed
        const m = projModel(kind);
        m.position.set(muzzle[0], muzzle[1], muzzle[2]); m.lookAt(muzzle[0] - dd[0], muzzle[1] - dd[1], muzzle[2] - dd[2]); ctx.scene.add(m);
        projs.push({ id, w: w2, wf, wp, kind, p: muzzle.slice(), v: dd.map(v => v * speed), m, life, owner, grav, bounce, smoke: kind === 'rokkit' || kind === 'rjack' || kind === 'bigrock' || kind === 'gren', ball: kind === 'sball', spin: kind === 'gren' || kind === 'flakb' });
      }
    }
    // projectile models: shared materials per kind (lots of these fly about now the guns are quicker)
    let projMats = {};
    function projModel(kind) {
      const parts = kind === 'flak' ? [['s', 0.1, 0.1, 0.18, 0, 0, 0, 0xffa040]] : kind === 'rivet' ? [['a', 0.06, 0.06, 0.3, 0, 0, 0, 0xfffff0]]
        : kind === 'rjack' || kind === 'bigrock' || kind === 'rokkit' ? [['a', 0.2, 0.2, 0.42, 0, 0, 0, 0xe8381b], ['n', 0.14, 0.14, 0.12, 0, 0, -0.26, 0xd8d8e0], ['f', 0.36, 0.04, 0.12, 0, 0, 0.16, 0x5a6a3a], ['g', 0.04, 0.36, 0.12, 0, 0, 0.16, 0x5a6a3a], ['e', 0.1, 0.1, 0.03, 0, 0, 0.22, 0xffe080]]
        : kind === 'sball' ? [['c', 0.3, 0.3, 0.3, 0, 0, 0, 0xd8b0ff]]
        : kind === 'flakb' ? [['b', 0.22, 0.22, 0.3, 0, 0, 0, 0xc86018], ['t', 0.24, 0.06, 0.24, 0, 0, -0.08, 0xffd040]]
        : kind === 'gren' ? [['b', 0.2, 0.2, 0.26, 0, 0, 0, 0x3a5a2a], ['r', 0.22, 0.06, 0.22, 0, 0, 0, 0xd02810], ['p', 0.06, 0.06, 0.08, 0, 0, -0.16, 0x909090]]
        : [['r', 0.18, 0.18, 0.5, 0, 0, 0, 0x8a9a7a], ['t', 0.12, 0.12, 0.12, 0, 0, -0.3, 0xe8381b]];
      const mat = projMats[kind] || (projMats[kind] = E.entMat(ctx, { lin: !JQ, full: 1 }));
      const m = E.model(ctx, parts, { mat });
      if (kind === 'sball' || kind === 'rokkit' || kind === 'flak') { const s = new T.Sprite(glowMat(kind === 'sball' ? [0.65, 0.4, 1] : kind === 'flak' ? [1, 0.6, 0.2] : [1, 0.75, 0.35])); s.scale.setScalar(kind === 'sball' ? 1.3 : kind === 'flak' ? 0.4 : 0.8); if (kind === 'rokkit') s.position.z = 0.28; m.add(s); }
      return m;
    }
    // an additive glow sprite (shock balls, rocket exhausts, pickups' halos)
    let glowTex = null; const glowMats = {};
    function glowMat(c) {
      const key = c.join(','); if (glowMats[key]) return glowMats[key];
      if (!glowTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.75)'); g.addColorStop(0.6, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowTex = new T.CanvasTexture(cv); ctx.bag.push(glowTex); }
      const m = new T.SpriteMaterial({ map: glowTex, color: new T.Color(c[0], c[1], c[2]), transparent: true, depthWrite: false, blending: T.AdditiveBlending }); ctx.bag.push(m);
      return glowMats[key] = m;
    }
    function beam(a, b, col, thick, life, bright) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (len < 0.1) return;
      const m = E.model(ctx, [['b', thick, thick, len, 0, 0, -len / 2, col]], { lin: true, full: bright || 1.4, alpha: 0.85 });
      m.position.set(a[0], a[1], a[2]); m.lookAt(b[0], b[1], b[2]); m.rotateY(Math.PI); ctx.scene.add(m);
      beams.push({ m, t: life, life });
    }
    function updProjs(dt) {
      for (const pr of projs) {
        if (pr.dead) continue;
        pr.life -= dt; pr.v[1] -= pr.grav * dt;
        const st = Math.max(1, Math.ceil(Math.hypot(...pr.v) * dt / 0.3)); let hit = null;
        const tg = pr.owner ? targetsFor(pr.id) : null;
        for (let k = 0; k < st && !hit && pr.life > 0; k++) {
          const n = [pr.p[0] + pr.v[0] * dt / st, pr.p[1] + pr.v[1] * dt / st, pr.p[2] + pr.v[2] * dt / st];
          if (tg) for (const t of tg) { if (Math.abs(t.p[0] - n[0]) < t.r + 0.1 && Math.abs(t.p[2] - n[2]) < t.r + 0.1 && n[1] > t.p[1] - 0.1 && n[1] < t.p[1] + t.h + 0.05) { hit = t; break; } }
          if (!hit && !E.Grid.open(M, n[0], n[1], n[2])) {
            if (pr.bounce > 0) { // grenades (and flak chunks, once) bounce: flip whichever way is blocked, lose some speed
              pr.bounce--; const bx = !E.Grid.open(M, n[0], pr.p[1], pr.p[2]), by = !E.Grid.open(M, pr.p[0], n[1], pr.p[2]), bz = !E.Grid.open(M, pr.p[0], pr.p[1], n[2]);
              if (bx) pr.v[0] *= -0.55; if (by) { pr.v[1] *= -0.45; pr.v[0] *= 0.8; pr.v[2] *= 0.8; } if (bz) pr.v[2] *= -0.55; if (!bx && !by && !bz) pr.v = pr.v.map(v => -v * 0.5);
              if (pr.kind === 'gren' && Math.hypot(...pr.v) > 2) jsfx('bounce', 60, 0.6); if (pr.kind === 'flak') pr.life = Math.min(pr.life, 0.35);
              break;
            }
            hit = 'wall';
          }
          if (!hit) pr.p = n;
        }
        if (hit || pr.life <= 0) {
          pr.dead = true; ctx.scene.remove(pr.m); pr.m.traverse(x => { if (x.geometry) x.geometry.dispose(); });
          const wp = pr.wp || W[pr.w], R0 = pr.combo ? wp.splash : pr.ball ? 2.4 : wp.splash;
          if (R0) {
            if (pr.combo) { FX.boom(pr.p[0], pr.p[1], pr.p[2]); ringFx(pr.p[0], pr.p[1], pr.p[2], 9, [0.75, 0.5, 1]); FX.spray(pr.p[0], pr.p[1], pr.p[2], 50, [0.8, 0.6, 1], 12, 0.6, 0); jsfx('combo', 60); camShake(pr.p, 0.9); dlight(pr.p, [0.7, 0.4, 1], 12, 0.6); if (pr.id === me) { announce('COMBO!', false); Apps.secret('fps.combo'); } }
            else if (pr.ball) { ringFx(pr.p[0], pr.p[1], pr.p[2], 2.6, [0.75, 0.5, 1]); FX.spray(pr.p[0], pr.p[1], pr.p[2], 18, [0.8, 0.6, 1], 5, 0.4, 0); jsfx('zap', 40, 0.7); }
            else { FX.boom(pr.p[0], pr.p[1], pr.p[2]); sfx('boom', 40); camShake(pr.p, 0.5); dlight(pr.p, [1, 0.6, 0.25], 8, 0.4); }
            if (pr.owner) { // splash: every target (and yourself) within reach
              const dmax = pr.combo ? wp.dmg : pr.ball ? 55 : wp.dmg, all = tg.concat(selfTarget(pr.id));
              for (const t of all) { const d = Math.hypot(t.p[0] - pr.p[0], t.p[1] + 0.9 - pr.p[1], t.p[2] - pr.p[2]); const direct = t === hit; if (direct || d < R0) A.hit(pr.id, t.id, pr.wf != null ? pr.wf : pr.w, direct ? dmax : dmax * (1 - d / R0) * 0.85); }
            }
            const dm = Math.hypot(P.p[0] - pr.p[0], P.p[1] + 0.9 - pr.p[1], P.p[2] - pr.p[2]), R = R0;
            if (dm < R && !P.dead && !P.spec) { const k = (1 - dm / R) * (pr.id === me ? 13 : 7) * (pr.ball && !pr.combo ? 0.4 : 1); P.v[0] += (P.p[0] - pr.p[0]) / (dm || 1) * k; P.v[1] += Math.max(0.4, (P.p[1] + 0.9 - pr.p[1]) / (dm || 1)) * k; P.v[2] += (P.p[2] - pr.p[2]) / (dm || 1) * k; P.ground = false; if (pr.id === me) P.rj = { y: P.p[1], t: G.t }; }
          } else if (hit && hit !== 'wall') { if (pr.owner) A.hit(pr.id, hit.id, pr.wf != null ? pr.wf : pr.w, wp.dmg); FX.spray(pr.p[0], pr.p[1], pr.p[2], 4, [1, 0.7, 0.3], 3, 0.3); }
          else FX.spray(pr.p[0], pr.p[1], pr.p[2], 3, [1, 0.6, 0.2], 3, 0.3);
          continue;
        }
        pr.m.position.set(pr.p[0], pr.p[1], pr.p[2]);
        if (pr.spin) { pr.m.rotation.x += dt * 9; pr.m.rotation.y += dt * 4; } else if (pr.grav) pr.m.lookAt(pr.p[0] - pr.v[0], pr.p[1] - pr.v[1], pr.p[2] - pr.v[2]);
        if (pr.ball && Math.random() < 0.35 && Math.hypot(pr.p[0] - P.p[0], pr.p[2] - P.p[2]) > 2.5) FX.emit(pr.p[0], pr.p[1], pr.p[2], (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, [0.75, 0.55, 1], 0.35, 0);
        if (pr.smoke && Math.random() < 0.8) FX.emit(pr.p[0], pr.p[1], pr.p[2], (Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6, pr.kind === 'gren' ? [0.6, 0.6, 0.62] : [0.75, 0.75, 0.8], 0.7, -1);
      }
      projs = projs.filter(p => !p.dead);
      for (const b of beams) { b.t -= dt; if (b.t <= 0) { ctx.scene.remove(b.m); b.m.traverse(x => { if (x.geometry) x.geometry.dispose(); }); b.dead = true; } else b.m.mat.uniforms.alpha.value = 0.85 * b.t / b.life; }
      beams = beams.filter(b => !b.dead);
    }
    // a growing ring of light (shock beam hits, the shock ball and the COMBO)
    let ringTex = null;
    function ringFx(x, y, z, size, c) {
      if (!FX) return;
      if (!ringTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 5; g.shadowColor = '#fff'; g.shadowBlur = 6; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.stroke(); ringTex = new T.CanvasTexture(cv); ctx.bag.push(ringTex); }
      FX.puff(x, y, z, size * 0.35, c, { tex: ringTex, life: 0.35, grow: 2.2, vy: 0, spin: 0 });
    }
    function dlight(p, c, rad, life) { if (!JQ && G.dl) { G.dl.push({ p: p.slice(), c, rad, t: life, life }); if (G.dl.length > 12) G.dl.shift(); } }
    function updDL(dt) {
      if (JQ || !ctx.uDlp) return;
      const L = [], cam = ctx.camera.position; G.dl = (G.dl || []).filter(l => (l.t -= dt) > 0);
      for (const l of G.dl) L.push([l.p, l.c, l.rad, l.t / l.life]);
      for (const pr of projs) if (!pr.dead && (pr.kind === 'rokkit' || pr.kind === 'sball' || pr.kind === 'flakb')) L.push([pr.p, pr.kind === 'sball' ? [0.6, 0.35, 1] : [1, 0.6, 0.25], pr.kind === 'sball' ? 4.5 : 3.5, 0.8]);
      if (G.mflash > 0 && P && !P.dead && !P.spec) L.push([[P.p[0], P.p[1] + 1.5, P.p[2]], W[P.w].id === 'shokka' ? [0.6, 0.4, 1] : [1, 0.85, 0.5], 5.5, 1]);
      const e = A && A.ent(me); if (e && e.ud && !P.dead) L.push([[P.p[0], P.p[1] + 1.2, P.p[2]], [0.5, 0.2, 1], 4, 0.5]);
      const score = l => l[3] * l[2] / (1 + Math.hypot(l[0][0] - cam.x, l[0][1] - cam.y, l[0][2] - cam.z));
      L.sort((a, b) => score(b) - score(a));
      for (let i = 0; i < 3; i++) { const l = L[i]; if (l) { ctx.uDlp.value[i].set(l[0][0], l[0][1], l[0][2], l[2]); ctx.uDlc.value[i].set(l[1][0] * l[3] * 1.3, l[1][1] * l[3] * 1.3, l[1][2] * l[3] * 1.3); } else ctx.uDlp.value[i].w = 0; }
    }
    function camShake(at, k) { if (!P || P.spec) return; const d = Math.hypot(P.p[0] - at[0], P.p[1] - at[1], P.p[2] - at[2]); if (d < 10) G.shake = Math.max(G.shake || 0, k * (1 - d / 10)); }
    function selfTarget(id) { const e = A.ent(id); return e && e.alive ? [{ id, p: id === me ? P.p : (bots.find(b => b.id === id) || mons.get(id) || e).p, r: 0.45, h: 1.85 }] : []; }
    function bestWeapon(sh, dist) {
      const has = k => (sh.has & (1 << k)) && (W[k].max < 0 || sh.am[k] > 0);
      const pref = JQ ? (dist < 4 ? [1, 2, 0] : dist < 22 ? [3, 2, 1, 0] : [2, 1, 3, 0])
        : dist < 3 ? [4, 3, 5, 2, 1, 0] : dist < 14 ? [4, 5, 3, 2, 1, 0] : dist < 30 ? [2, 3, 5, 1, 4, 0] : [2, 3, 1, 5, 4, 0];
      return pref.find(has) ?? 0;
    }

    // ---------------------------------------------------------------- movement shared by the player and the bots
    const SWAP = 0.16; // weapon switch: down and up again (you can shoot once it's nearly up)
    const MOVE = JQ ? { speed: 7.6, accel: 10, air: 0.9, fric: 6, jump: 7.3 } : { speed: 9.2, accel: 11, air: 1.2, fric: 7, jump: 7.6 };
    function physics(b, wish, jump, dt) {
      const g = M.meta.grav;
      E.move(M, b, wish, jump, dt, { speed: MOVE.speed * (b.spd || 1), accel: MOVE.accel, air: MOVE.air, fric: MOVE.fric, grav: g, jump: MOVE.jump, autoHop: false });
      // jump pads
      if (b.ground) { const c = M.at(b.p[0], b.p[2]); const pad = M.pads.find(p => p.i === c.i && p.j === c.j); if (pad) { const v = AR.padVel(M, pad); b.v[0] = v[0]; b.v[1] = v[1]; b.v[2] = v[2]; b.ground = false; b.padT = G.t; if (b === P) sfx('pad'); else if (Math.hypot(b.p[0] - P.p[0], b.p[2] - P.p[2]) < 15) sfx('pad', 200); } }
    }

    // ---------------------------------------------------------------- bots (driven here in practice, or by the online host)
    // route planner: walk, step up, JUMP up ledges a jump can reach, and take the jump pads; never into lava or the void
    function flowTo(i, j) {
      const key = i + ',' + j, c = flowCache[key];
      if (c && G.t - c.t < 4) return c.f;
      const padMap = {}; M.pads.forEach(p => { const tc = M.at(p.tx, p.tz); (padMap[tc.j * M.w + tc.i] = padMap[tc.j * M.w + tc.i] || []).push(p.j * M.w + p.i); });
      const up = M.jumpUp || 1;
      const f = E.flow(M, i, j, { ok: (n, c2) => !c2.s && !c2.v && !n.v && !n.s && !(c2.liq === 'lava' || c2.liq === 'slime') && (c2.f - n.f) <= (n.liq ? 0.6 : up) && (c2.sky || c2.c - c2.f >= 1.8), extra: (k, add) => (padMap[k] || []).forEach(add) });
      flowCache[key] = { f, t: G.t };
      return f;
    }
    // ---- bot skill: UT's ladder squeezed into five steps. Each row is Novice, Average, Skilled, Masterful, Godlike; skills in
    // between (the public servers soften theirs a bit) are blended. Tuned so a newcomer wins at the default (Average).
    const SKT = {
      think: [0.6, 0.45, 0.34, 0.26, 0.18],         // seconds between looks round
      react: [1.3, 0.9, 0.62, 0.44, 0.28],          // spotting somebody -> first shot
      fov: [0.85, 1.0, 1.15, 1.3, 1.5],             // half-angle (radians) they notice things in; behind them they have to hear you
      aim: [0.24, 0.16, 0.1, 0.06, 0.034],       // aim wobble (radians)...
      aimD: [0.002, 0.0015, 0.001, 0.0006, 0.00035], // ...plus this much for every metre away...
      aimS: [0.024, 0.017, 0.011, 0.007, 0.004],    // ...plus this much for every m/s you move sideways
      lag: [0.3, 0.22, 0.15, 0.09, 0.05],           // their aim trails your movement by this long (seconds)
      turn: [2.3, 3.2, 4.4, 6, 8.5],                // fastest turn (rad/s)
      turnA: [6, 9, 13, 19, 28],                    // how quickly they get up to it (no instant 180s)
      cone: [0.09, 0.075, 0.06, 0.045, 0.035],      // pull the trigger once the gun is this close to where they want it
      burst: [0.5, 0.8, 1.2, 1.7, 2.6],             // seconds of shooting...
      rest: [1.0, 0.7, 0.5, 0.32, 0.18],            // ...then a breather
      strafe: [0.15, 0.4, 0.6, 0.85, 1], dodge: [0, 0.1, 0.3, 0.55, 0.85], lead: [0, 0.3, 0.55, 0.8, 1],
      greed: [0.55, 0.4, 0.25, 0.12, 0.05],         // chance they stop fighting to grab a pickup they're near
      hp: [45, 40, 32, 25, 18],                     // below this much health they go and find some
    };
    const skv = (k, s) => { const t = SKT[k], i = Math.max(0, Math.min(3, Math.floor(s))), f = clamp(s - i, 0, 1); return t[i] + (t[i + 1] - t[i]) * f; };
    const angD = (a, b) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.75; // roughly -2..2, mostly small
    const PSPD = { flak: 55, rokkit: 30, rjack: 19, rivet: 42, bigrock: 14, sball: 20, gren: 16, flakb: 24 }; // projectile speeds (the bots lead with these)
    const botK = b => { if (b.tuneO) return k => b.tuneO[k]; const s = clamp(+b.skill || 0, 0, 4) * (!A.local && A.g && A.g.pub ? 0.8 : 1); return k => skv(k, s); };
    function botThink(b, dt) {
      const e = A.ent(b.id); if (!e) return;
      if (!e.alive || b.dead) { b.dead = true; if (G.t - (b.deadT || 0) > 1.6 + Math.random() && G.t - (b.rsT || 0) > 1) { b.rsT = G.t; A.respawn(b.id); } return; }
      if (G.over) { A.move(b.id, { p: b.p, yaw: b.yaw, pitch: b.pitch, w: b.w }); return; }
      const K = botK(b), myTeam = e.team, teams = A.mode === 'ctf' || A.mode === 'coop';
      b.cool -= dt; b.think -= dt; b.reactV = K('react');
      // who can I see?
      if (b.think <= 0) {
        b.think = K('think') * (0.8 + Math.random() * 0.4);
        const busy = {}; for (const o of bots) if (o !== b && !o.dead && o.target != null) busy[o.target] = (busy[o.target] || 0) + 1;
        const fov = K('fov'); let best = null, bd = 1e9;
        for (const id of A.ids()) {
          if (id === b.id) continue; const o = A.ent(id); if (!o || !o.alive || o.away) continue; if (teams && o.team === myTeam) continue;
          const op = id === me ? P.p : drawPos(id) || o.p, dx = op[0] - b.p[0], dz = op[2] - b.p[2], d = Math.hypot(dx, op[1] - b.p[1], dz);
          if (d > 60) continue;
          // in front of me, close enough to hear, the one I'm already fighting, or the one who just shot me
          const heard = d < 7 || id === b.target || (b.hurtBy === id && G.t - (b.hurtT || 0) < 2.5) || o.carry >= 0;
          if (!heard && Math.abs(angD(Math.atan2(-dx, -dz), b.yaw)) > fov) continue;
          const oh = o.mon ? AR.MONS[o.mon].h * 0.6 : 1.2;
          if (!M.los(b.p[0], b.p[1] + 1.5, b.p[2], op[0], op[1] + oh, op[2], 0.4)) continue;
          // everybody ganging up on one person (you) is no fun: someone already being shot at is less interesting
          const score = d - (o.carry >= 0 ? 30 : 0) - (id === b.target ? 8 : 0) - (o.hp < 40 ? 4 : 0) + (busy[id] || 0) * 14 + (o.bot || o.mon ? 0 : 5);
          if (score < bd) { bd = score; best = id; }
        }
        if (best !== b.target) { b.react = G.t + K('react') * (0.75 + Math.random() * 0.5); b.tl = null; b.burstT = 0; }
        b.target = best;
        b.errT = [gauss(), gauss() * 0.6];
        b.greedy = best != null && b.goalIt && Math.random() < K('greed');
      }
      // where am I going?
      if (b.goalT <= G.t || !b.goal) pickGoal(b, e);
      const tgt = b.target != null ? A.ent(b.target) : null, tp = tgt && tgt.alive ? (b.target === me ? P.p : drawPos(b.target) || tgt.p) : null;
      let wish = [0, 0], jump = false;
      const here = M.at(b.p[0], b.p[2]);
      if (b.goal) {
        const gi = Math.floor(b.goal[0] / M.S), gj = Math.floor(b.goal[2] / M.S), f = flowTo(gi, gj);
        const n = f.next(here.i, here.j);
        if (n) { const tx = (n[0] + 0.5) * M.S - b.p[0], tz = (n[1] + 0.5) * M.S - b.p[2], l = Math.hypot(tx, tz) || 1; wish = [tx / l, tz / l]; const nc = M.cell(n[0], n[1]); if (nc.f - b.p[1] > 0.5 && b.ground && l < 2.2) jump = true; }
        else if (here.i === gi && here.j === gj) { const tx = b.goal[0] - b.p[0], tz = b.goal[2] - b.p[2], l = Math.hypot(tx, tz); if (l > 0.3) wish = [tx / l, tz / l]; else b.goalT = 0; }
        else b.goalT = Math.min(b.goalT, G.t + 0.5);
      }
      const fight = tp && !b.greedy;
      if (fight) { // fight: strafe and circle, change direction now and then (better bots do it more, and dodge when hit)
        const dx = tp[0] - b.p[0], dz = tp[2] - b.p[2], d = Math.hypot(dx, dz) || 1;
        if (G.t > b.strafeT) { b.strafe = Math.random() < 0.5 ? 1 : -1; b.strafeT = G.t + 0.5 + Math.random() * 1.6; }
        const sw = K('strafe'), sx = -dz / d * b.strafe * sw, sz = dx / d * b.strafe * sw;
        const keep = b.carry || e.hp < K('hp') ? 0 : 1, near = W[b.w].range < 3 || (W[b.w].pellets && d > 8) || (b.w === 4 && d > 10) ? 1 : d < 5 && /rokkit|rjack/.test(W[b.w].id) ? -1 : 0;
        wish = [wish[0] * (0.55 + 0.45 * (1 - keep)) + sx + dx / d * near * 0.7, wish[1] * (0.55 + 0.45 * (1 - keep)) + sz + dz / d * near * 0.7];
        if (b.ground && (Math.random() < K('dodge') * 0.5 * dt || (b.dodgeT && G.t - b.dodgeT < 0.1 && Math.random() < K('dodge') * 0.3))) jump = true;
      }
      // never step into the void or the lava
      const ahead = M.at(b.p[0] + wish[0] * 1.2, b.p[2] + wish[1] * 1.2);
      if (ahead.v || ahead.f < here.f - 3 || (ahead.liq === 'lava' && here.liq !== 'lava')) { if (!(b.goal && flowFollowsPad(here))) wish = wish.map(v => -v * 0.3); }
      // stuck? hop and pick somewhere else
      if (b.lastP && G.t - (b.stuckT || 0) > 0.6) { const mv = Math.hypot(b.p[0] - b.lastP[0], b.p[2] - b.lastP[2]); b.stuck = mv < 0.2 && Math.hypot(wish[0], wish[1]) > 0.3 ? b.stuck + 1 : 0; b.lastP = b.p.slice(); b.stuckT = G.t; if (b.stuck >= 3) { b.goalT = 0; b.stuck = 0; jump = true; } } else if (!b.lastP) b.lastP = b.p.slice();
      if (b.bumped && b.ground && Math.random() < 0.3) jump = true;
      // don't hop (or strafe) off the edge of the world: look where the jump would land
      if (jump || tp) { const l = Math.hypot(wish[0], wish[1]) || 1, far = jump ? 3.2 : 1.6, land = M.at(b.p[0] + wish[0] / l * far, b.p[2] + wish[1] / l * far); if (land.v || (land.liq === 'lava' && here.liq !== 'lava')) { jump = false; wish = wish.map(v => -v * 0.4); } }
      physics(b, wish, jump, dt);
      // aim: at where you WERE a moment ago (plus a lead for slow rockets), wobbling more far away and when you strafe;
      // the head turns with a top speed and has to speed up and slow down
      let wy = null, wpch = 0;
      if (fight && G.t > b.react) {
        const wp = W[b.w], spd = PSPD[wp.id] || 0;
        if (b.tl && b.tl.id === b.target) { const k = Math.max(dt, 1e-3); let vx = (tp[0] - b.tl.p[0]) / k, vz = (tp[2] - b.tl.p[2]) / k; const vl = Math.hypot(vx, vz); if (vl > 16) { vx *= 16 / vl; vz *= 16 / vl; } const f = Math.min(1, dt * 8); b.tv = [b.tv[0] + (vx - b.tv[0]) * f, 0, b.tv[2] + (vz - b.tv[2]) * f]; } else b.tv = [0, 0, 0];
        b.tl = { id: b.target, p: tp.slice() };
        const tv = b.tv, d0 = Math.hypot(tp[0] - b.p[0], tp[2] - b.p[2]) || 1, lead = (spd ? d0 / spd * K('lead') : 0) - K('lag');
        const tgtE = A.ent(b.target), aimH = tgtE && tgtE.mon ? AR.MONS[tgtE.mon].h * 0.55 : wp.splash ? 0.3 : 1.1;
        const ax = tp[0] + tv[0] * lead - b.p[0], ay = tp[1] + aimH - (b.p[1] + 1.55), az = tp[2] + tv[2] * lead - b.p[2], dist = Math.hypot(ax, az) || 1;
        const lat = Math.abs(tv[0] * az - tv[2] * ax) / dist, mag = K('aim') + K('aimD') * dist + K('aimS') * lat;
        const f = Math.min(1, dt * 2.5); b.err = b.err || [0, 0]; b.err[0] += ((b.errT || [0, 0])[0] - b.err[0]) * f; b.err[1] += ((b.errT || [0, 0])[1] - b.err[1]) * f;
        wy = Math.atan2(-ax, -az) + b.err[0] * mag; wpch = Math.atan2(ay, dist) + b.err[1] * mag;
        const nw = bestWeapon(b, dist); if (nw !== b.w && b.cool <= 0.1) { b.w = nw; b.cool = Math.max(b.cool, 0.2); b.burstT = 0; }
        b.aimDy = angD(wy, b.yaw); b.aimDist = dist;
      } else if (Math.hypot(wish[0], wish[1]) > 0.1) { wy = Math.atan2(-wish[0], -wish[1]); wpch = 0; b.aimDy = 9; }
      if (wy != null) {
        const turn = K('turn'), dy = angD(wy, b.yaw), want = clamp(dy * 7, -turn, turn), acc = K('turnA') * dt;
        b.yawV = (b.yawV || 0) + clamp(want - (b.yawV || 0), -acc, acc); b.yaw += b.yawV * dt;
        b.pitch += clamp((wpch - b.pitch) * Math.min(1, dt * 7), -turn * dt, turn * dt);
      } else { b.yawV = (b.yawV || 0) * Math.max(0, 1 - dt * 6); b.pitch *= 0.9; }
      // pull the trigger: in bursts, with a breather in between (worse bots stop for longer)
      if (fight && G.t > b.react && wy != null && b.cool <= 0) {
        const wp = W[b.w], dy = Math.abs(angD(wy, b.yaw));
        if (!b.burstT) { b.burstT = G.t; const d = b.aimDist || 20; b.altF = !JQ && !!W[b.w].alt && ((b.w === 3 && d < 12 && Math.random() < 0.5) || (b.w === 4 && d > 10 && Math.random() < 0.4) || (b.w === 5 && d > 6 && Math.random() < 0.2) || (b.w === 1 && d < 8 && Math.random() < 0.35)); }
        if (G.t - b.burstT > K('burst') * (0.7 + Math.random() * 0.6)) { b.burstT = 0; b.cool = K('rest') * (0.6 + Math.random() * 0.8); }
        else if (dy < Math.max(K('cone'), 0.5 / Math.max(1, b.aimDist || 1)) && !(wp.splash && (b.aimDist || 9) < 3.5)) shoot(b, false, b.altF);
      }
      b.carry = e.carry >= 0;
      A.move(b.id, { p: b.p, yaw: b.yaw, pitch: b.pitch, w: b.w });
    }
    const flowFollowsPad = c => M.pads.some(p => p.i === c.i && p.j === c.j);
    function pickGoal(b, e) {
      b.goalT = G.t + 2 + Math.random() * 2;
      const wd = A.world(), pick = l => l[Math.floor(Math.random() * l.length)];
      if (A.mode === 'ctf' && M.flags.length === 2 && e.team >= 0) {
        const mine = M.flags[e.team], theirs = M.flags[1 - e.team], fl = wd.fl || [];
        if (e.carry >= 0) { b.goal = [mine.x, mine.y, mine.z]; b.goalT = G.t + 6; return; }
        const myF = fl[e.team], enF = fl[1 - e.team];
        if (myF && myF[0] !== 'home' && (b.role === 'defend' || Math.random() < 0.5)) { b.goal = [myF[1], myF[2], myF[3]]; return; }
        if (enF && enF[0] === 'carried') { const c = A.ent(enF[4]); if (c && c.team === e.team && Math.random() < 0.6) { const cp = drawPos(enF[4]) || c.p; b.goal = [cp[0], cp[1], cp[2]]; return; } } // escort the carrier
        if (b.role === 'attack') { b.goal = enF ? [enF[1], enF[2], enF[3]] : [theirs.x, theirs.y, theirs.z]; return; }
        b.goal = [mine.x + (Math.random() - 0.5) * 8, mine.y, mine.z + (Math.random() - 0.5) * 8]; return;
      }
      const up = wd.it || [];
      const want = M.items.map((it, i) => ({ it, i })).filter(({ it, i }) => { const I = IT[it.it]; if (!I || up[i] === 0) return false; return (I.hp && e.hp < (I.hpMax > 100 ? 120 : 70)) || (I.w != null && !(b.has & (1 << I.w))) || I.ud || (I.ar && e.ar < 50) || (I.am != null && (b.has & (1 << I.am)) && b.am[I.am] < W[I.am].pick); });
      const low = e.hp < botK(b)('hp'); b.goalIt = false;
      if (want.length && (low || Math.random() < 0.75)) { want.sort((a, c) => Math.hypot(a.it.x - b.p[0], a.it.z - b.p[2]) - Math.hypot(c.it.x - b.p[0], c.it.z - b.p[2])); const hp = low ? want.find(x => IT[x.it.it].hp) : null; const t = (hp || want[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * want.length)]).it; b.goal = [t.x, t.y, t.z]; b.goalIt = Math.hypot(t.x - b.p[0], t.z - b.p[2]) < 9; return; }
      if (A.mode === 'coop') { const ms = A.ids().map(id => A.ent(id)).filter(x => x && x.mon && x.alive); if (ms.length) { const t = ms[Math.floor(Math.random() * ms.length)]; b.goal = t.p.slice(); return; } }
      const s = pick(M.spawns.concat(M.items)); b.goal = [s.x, s.y, s.z];
    }
    // co-op monsters (the host drives them too): chase the nearest player, bite or shoot
    function monThink(id, e, dt) {
      let m = mons.get(id);
      const S = AR.MONS[e.mon];
      if (!m) { m = { id, mon: e.mon, p: e.p.slice(), v: [0, 0, 0], r: S.r, h: S.h, yaw: e.yaw || 0, pitch: 0, ground: false, cool: 1 + Math.random(), think: 0, w: S.w, am: W.map(() => -1), has: 1 << S.w, spd: S.speed / MOVE.speed, strafe: Math.random() < 0.5 ? 1 : -1 }; mons.set(id, m); }
      m.cool -= dt; m.think -= dt;
      if (m.think <= 0) {
        m.think = 0.3 + Math.random() * 0.2;
        let best = null, bd = 1e9;
        for (const pid of A.ids()) { const o = A.ent(pid); if (!o || !o.alive || o.mon || o.away) continue; const op = pid === me ? P.p : drawPos(pid) || o.p, d = Math.hypot(op[0] - m.p[0], op[2] - m.p[2]); if (d < bd) { bd = d; best = pid; } }
        if (best != null && (m.target == null || !A.ent(m.target) || !A.ent(m.target).alive || Math.random() < 0.3)) m.target = best;
        const t = m.target != null ? A.ent(m.target) : null, tp = t ? (m.target === me ? P.p : drawPos(m.target) || t.p) : null;
        m.see = !!(tp && M.los(m.p[0], m.p[1] + S.h * 0.8, m.p[2], tp[0], tp[1] + 1.2, tp[2], 0.3));
        m.tp = tp;
      }
      const tp = m.tp; let wish = [0, 0];
      if (tp) {
        const dx = tp[0] - m.p[0], dz = tp[2] - m.p[2], d = Math.hypot(dx, dz) || 1;
        if (m.see && d < S.keep) { if (S.keep > 2) { if (Math.random() < 0.01) m.strafe *= -1; wish = [-dz / d * m.strafe * 0.6, dx / d * m.strafe * 0.6]; } }
        else if (m.see) wish = [dx / d, dz / d];
        else { const c = M.at(m.p[0], m.p[2]), f = flowTo(Math.floor(tp[0] / M.S), Math.floor(tp[2] / M.S)), n = f.next(c.i, c.j); if (n) { const tx = (n[0] + 0.5) * M.S - m.p[0], tz = (n[1] + 0.5) * M.S - m.p[2], l = Math.hypot(tx, tz) || 1; wish = [tx / l, tz / l]; } }
        m.yaw = Math.atan2(-dx, -dz);
        m.pitch = Math.atan2(tp[1] + 1.1 - (m.p[1] + S.h * 0.75), d);
        if (m.see && m.cool <= 0 && d < W[S.w].range + 0.5) {
          const wp = W[S.w];
          if (!wp.proj && wp.range > 3) { const miss = 0.25 + d / 50; m.pitch += (Math.random() - 0.5) * miss * 0.3; m.yaw += (Math.random() - 0.5) * miss * 0.3; } // the zapper misses a lot from far away
          if (shoot(m, false)) { m.cool = wp.rate * (0.8 + Math.random() * 0.7); m.biteT = 0.25; }
        }
      }
      const jump = e.mon === 'blob' && m.ground && Math.random() < 0.02;
      physics(m, wish, jump, dt);
      A.move(id, { p: m.p, yaw: m.yaw, pitch: m.pitch, w: S.w });
    }

    // ---------------------------------------------------------------- input
    const input = E.input(host, {
      typing: () => !!G.keyWait,
      binds,
      onKey(ev) {
        if (G.keyWait) { if (ev.code !== 'Escape') { binds.set(G.keyWait.act, ev.code); save(); } G.keyWait.done(); G.keyWait = null; return false; }
        if (chatBox) return true;
        if (G.mode !== 'game') return true;
        if (ev.code === 'Backquote' && !JQ) { toggleConsole(); return false; }
        if (G.over && /^Digit[123]$/.test(ev.code) && A && A.g && A.g.vote) { castVote(+ev.code.slice(5) - 1); return false; }
        if (binds.codes('scores').includes(ev.code)) { G.scoreHeld = true; return false; }
        if (binds.codes('talk').includes(ev.code)) { openChat(); return false; }
        if (ev.key === 'Escape') { gameMenu(); return false; }
        // UT dodge: tap a direction twice quickly (JRT only; JAQUAKE players are too heavy)
        if (!JQ) for (const d of ['fwd', 'back', 'left', 'right']) if (binds.codes(d).includes(ev.code) && !ev.repeat) { const t = performance.now(), last = P.dodgeT[d] || 0; P.dodgeT[d] = t; if (t - last < 260) G.dodge = d; }
        return true;
      },
      onLock(on) { if (!on && G.mode === 'game' && !chatBox && !G.con && !G.paused && !touch && !G.closed && !G.over) gameMenu(); },
      canLock: () => G.mode === 'game' && !G.paused && !chatBox && !G.con && !touch && !G.over,
    });
    host.addEventListener('keyup', ev => { if (binds.codes('scores').includes(ev.code)) G.scoreHeld = false; });
    function grab() { if (touch || G.over) return; G.ignoreFire = G.t + 0.3; try { const p = host.requestPointerLock && host.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} host.focus(); }
    const tb = touch ? [
      { label: 'FIRE', hold: 'fire', style: { right: '24px', bottom: '150px' } },
      { label: 'JUMP', hold: 'jump', style: { right: '100px', bottom: '140px' }, sm: true },
    ].concat(JQ ? [] : [{ label: 'ALT', hold: 'alt', style: { right: '162px', bottom: '178px' }, sm: true }]).concat([
      { label: 'GUN', tap: () => cycleW(1), style: { left: '24px', bottom: '150px' }, sm: true },
      { label: 'SCORE', tap: () => { G.scoreHeld = !G.scoreHeld; }, style: { left: '8px', top: '8px' }, sm: true },
      { label: 'TALK', tap: () => openChat(), style: { left: '62px', top: '8px' }, sm: true },
      { label: 'MENU', tap: () => gameMenu(), style: { right: '8px', top: '8px' }, sm: true },
    ]) : null;
    if (touch) input.touchUI(tb);
    function cycleW(d) { if (!P) return; for (let k = 1; k <= NW; k++) { const n = (P.w + d * k + NW * 2) % NW; if ((P.has & (1 << n)) && (W[n].max < 0 || P.am[n] > 0)) { P.w = n; P.swap = SWAP; sfx('swap'); return; } } }
    // ---- the console (JRT): press ` to drop it down. Settings, a few practice-only toys, and one or two jokes
    const conLog = G.conLog = ['JACKREAL TOURNAMENT v' + VERSION + ' console. Type HELP for a list of commands.'];
    function conPrint(t) { conLog.push(String(t)); if (conLog.length > 80) conLog.shift(); if (G.con) paintCon(); }
    function paintCon() { const o = G.con && G.con.querySelector('.cl'); if (o) { o.textContent = conLog.slice(-40).join('\n'); o.scrollTop = 1e6; } }
    function toggleConsole() {
      if (G.con) { G.con.remove(); G.con = null; if (G.mode === 'game' && !chatBox && !ui.querySelector('.jrt-win')) { ui.style.pointerEvents = G.over ? 'auto' : 'none'; grab(); } return; }
      input.unlock(); jsfx('item', 50, 0.5);
      const c = G.con = h('form', 'jrt-con', '<pre class="cl"></pre><div class="ci"><span>&gt;</span><input type="text" maxlength="80" spellcheck="false" autocomplete="off" aria-label="Console command"></div>');
      ui.appendChild(c); ui.style.pointerEvents = 'auto'; paintCon();
      const inp = c.querySelector('input'); setTimeout(() => inp.focus(), 20);
      inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.code === 'Backquote' || ev.key === 'Escape') { ev.preventDefault(); toggleConsole(); } else if (ev.key === 'ArrowUp' && G.conH) { inp.value = G.conH; } });
      c.addEventListener('submit', ev => { ev.preventDefault(); const t = inp.value.trim(); inp.value = ''; if (t) { G.conH = t; conPrint('> ' + t); conCmd(t); } });
    }
    function conCmd(line) {
      const [cmd0, ...rest] = line.split(/\s+/), cmd = cmd0.toLowerCase(), arg = rest.join(' '), n = parseFloat(arg), prac = A && A.local && A.R;
      const meE = prac ? A.R.E.get(me) : null;
      const C = {
        help: () => ['HELP, SAY <words>, NAME <name>, FOV <75-120>, SENS <0.3-4>, CROSSHAIR <0-4>, HUDCOLOR <blue/gold/green/red/purple/white>, STAT FPS, TIMEDEMO,', 'ADDBOT, KILLBOTS, BEHINDVIEW (no), SUICIDE, QUIT. Practice only: ALLAMMO, FLY (no), SLOMO (also no).'].forEach(conPrint),
        say: () => { if (arg && A && !P.spec) A.chat(me, arg.slice(0, 80)); },
        name: () => { if (!arg) return conPrint('Your name is ' + myName() + '.'); if (A && !A.local) return conPrint('Online you play as your JackNet name. Change it on JackNet.'); cfg.name = arg.replace(/[^\w \-!.?']/g, '').slice(0, 16); save(); conPrint('Practice name set to ' + cfg.name + '. (From the next match.)'); },
        fov: () => { if (!(n >= 75 && n <= 120)) return conPrint('FOV is ' + cfg.fov + '. Try FOV 100.'); cfg.fov = Math.round(n); ctx.fovH = cfg.fov; ctx.resize(); save(); conPrint('Field of view: ' + cfg.fov); },
        sens: () => { if (!(n >= 0.3 && n <= 4)) return conPrint('Mouse speed is ' + cfg.sens + '.'); cfg.sens = n; save(); conPrint('Mouse speed: ' + n); },
        crosshair: () => { cfg.xhair = clamp(n | 0, 0, 4); save(); conPrint('Crosshair ' + cfg.xhair + '.'); },
        hudcolor: () => { if (!HUDC[arg.toLowerCase()]) return conPrint('Colours: ' + Object.keys(HUDC).join(', ')); cfg.hudc = arg.toLowerCase(); save(); conPrint('HUD colour: ' + cfg.hudc); },
        stat: () => { cfg.fps = !cfg.fps; save(); conPrint('Frame counter ' + (cfg.fps ? 'on' : 'off') + '.'); },
        timedemo: () => { cfg.fps = true; save(); conPrint('TIMEDEMO: your PC is doing about ' + Math.round(G.fpsNow || 30) + ' frames a second. Callum\'s does 112. He will tell you.'); },
        suicide: () => { if (A && !P.dead && !P.spec) A.suicide(me); },
        quit: () => quit(), exit: () => toggleConsole(),
        behindview: () => conPrint('BEHINDVIEW: Mom says you have to look where you are going.'),
        fly: () => conPrint('FLY: you are not a bird. (Try a jump pad.)'), ghost: () => conPrint('GHOST: Wooooo. No.'), slomo: () => conPrint('SLOMO: everything is already slow on Dave\'s PC.'),
        god: () => conPrint('GOD: there is only one god mode, and Callum\'s Mom took it off him.'),
        iddqd: () => { conPrint('Wrong game, mate.'); Apps.secret('fps.iddqd'); },
        allammo: () => { if (!prac || !meE || !meE.alive) return conPrint('ALLAMMO only works in a Practice Session. Nice try.'); meE.has = (1 << NW) - 1; meE.ammo = W.map(w => w.max); P.has = meE.has; P.am = meE.ammo.slice(); P.lastFire = G.t - 1; conPrint('All weapons, all ammo. The bots saw you do that.'); say('CHEATER! (says Callum)', 3); Apps.secret('fps.jrtcheat'); },
        addbot: () => { if (!prac) return conPrint('ADDBOT only works in a Practice Session (online, the server sorts the bots).'); const used = new Set(A.R.scores().map(r => r[1])), b = BOTS.find(x => !used.has(x[0])); if (!b) return conPrint('No more bots. They have all gone home for tea.'); const id = 100 + A.R.E.size + Math.floor(Math.random() * 1000), sk = n >= 0 && n <= 4 ? n | 0 : (G.practiceO && G.practiceO.skill >= 0 ? G.practiceO.skill : b[1]); A.R.add(id, { name: b[0], bot: true, skill: sk }); A.roster.push([id, b[0], sk]); syncBots(); conPrint(`${b[0]} (${SKILLS[sk]}) joined the game.`); },
        killbots: () => { if (!prac) return conPrint('KILLBOTS only works in a Practice Session.'); A.roster.splice(0).forEach(r => A.R.remove(r[0])); syncBots(); conPrint('The bots have been sent home.'); },
      };
      const f = C[cmd] || (cmd === 'sensitivity' ? C.sens : null);
      if (f) f(); else conPrint(`Unknown command "${cmd0}". Type HELP.`);
    }
    function openChat() {
      if (chatBox || !A || (P && P.spec && !A.local)) return; input.unlock();
      chatBox = document.createElement('form'); chatBox.className = 'jrt-chat';
      chatBox.innerHTML = '<input type="text" maxlength="80" placeholder="Say something nice..."><button class="jrt-btn" type="submit">Say</button><button class="jrt-btn" type="button" data-x>Cancel</button>';
      ui.appendChild(chatBox); ui.style.pointerEvents = 'auto';
      const inp = chatBox.querySelector('input'); setTimeout(() => inp.focus(), 20);
      const done = () => { if (!chatBox) return; chatBox.remove(); chatBox = null; ui.style.pointerEvents = G.over ? 'auto' : 'none'; grab(); };
      chatBox.addEventListener('submit', ev => { ev.preventDefault(); const t = inp.value.trim(); if (t && A && !P.spec) A.chat(me, t.slice(0, 80)); done(); });
      chatBox.querySelector('[data-x]').addEventListener('click', done);
      inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') done(); });
    }

    // ---------------------------------------------------------------- the frame
    function drawPos(id) {
      if (id === me && P) return P.p;
      const b = bots.find(q => q.id === id) || mons.get(id); if (b) return b.p;
      if (A && !A.local && A.interp) { const ip = A.interp(id, performance.now()); if (ip) return [ip[0], ip[1], ip[2]]; }
      const e = A && A.ent(id); return e ? e.p : null;
    }
    function step(dt) {
      G.t += dt; ctx.uTime.value = G.t;
      if (JQ) ctx.uFlick.value = 0.82 + 0.1 * Math.sin(G.t * 13.1) + 0.08 * Math.sin(G.t * 31.7 + 1.3);
      if (input.touch) { input.showTouch(G.mode === 'game' && !G.paused && !G.over); if (JQ) input.touchBottom(Math.round(44 * ctx.scale)); }
      if (G.mode === 'menu' || G.mode === 'nag') { menuFrame(dt); return; }
      if (G.mode === 'loading') { if (A && !A.local) A.poll(true); ctx.hctx.clearRect(0, 0, ctx.rw, ctx.rh); return; }
      if (!A || !M) return;
      if (G.paused && A.local) { FX.update(0); camera(0); ctx.render(); hud(0); return; }
      handle(A.poll());
      if (G.mode !== 'game' || !A) return; // (an event can end the match or drop us)
      if (!P.spec) playerFrame(dt);
      else specFrame(dt);
      if (A.host || A.local) {
        for (const b of bots) botThink(b, dt);

        if (A.mode === 'coop') for (const id of A.ids()) { const e = A.ent(id); if (e && e.mon && e.alive && !G.over) monThink(id, e, dt); }
      }
      if (G.auto) { const q = G.auto, mn = A.mine(); if (mn && q.cool < -0.6) { q.am = mn.am.slice(); q.has = mn.has; } if (!A.host && !A.local) botThink(q, dt); P.p = q.p; P.v = q.v; P.yaw = q.yaw; P.pitch = q.pitch; P.dead = q.dead; P.w = q.w; P.am = q.am; P.has = q.has; if (q.dead && !P.deadT) P.deadT = G.t; } // (the test autopilot)
      updProjs(dt); updDL(dt);
      // other players' (and monsters') models
      const now = performance.now(), seen = new Set();
      for (const id of A.ids()) {
        if (id === me && !P.spec) continue;
        const e = A.ent(id); if (!e) continue; seen.add(id);
        let v = views.get(id);
        if (!v) {
          if (e.mon) v = { m: monModel(ctx, e.mon), lp: null, anim: Math.random() * 6, mon: e.mon, flash: 0 };
          else { const col = A.mode === 'ctf' ? TEAMH[Math.max(0, e.team)] : JQ ? JQCOL[Math.abs(id) % JQCOL.length] : DMCOL[Math.abs(id) % DMCOL.length]; v = { m: soldier(ctx, col, { jq: JQ, bot: e.bot }), lp: null, anim: 0, team: e.team, flash: 0 }; }
          ctx.scene.add(v.m); views.set(id, v);
        }
        const b = bots.find(q => q.id === id) || mons.get(id);
        let pos = b ? b.p : null, yaw = b ? b.yaw : e.yaw, pitch = b ? b.pitch : e.pitch;
        if (!pos) { const ip = A.local ? null : A.interp(id, now); if (ip) { pos = [ip[0], ip[1], ip[2]]; yaw = ip[3]; pitch = ip[4]; } else pos = e.p; }
        v.m.visible = e.alive;
        v.m.position.set(pos[0], pos[1], pos[2]); v.m.rotation.y = yaw;
        const sp = v.lp ? Math.hypot(pos[0] - v.lp[0], pos[2] - v.lp[2]) / Math.max(dt, 0.001) : 0; v.lp = pos.slice();
        v.anim += dt * Math.min(sp, 12) * 0.9; const s = Math.sin(v.anim) * Math.min(1, sp / 6) * 0.8;
        const pr = v.m.parts;
        if (pr.ll) { pr.ll.rotation.x = s; pr.rl.rotation.x = -s; if (pr.la) pr.la.rotation.x = -s * 0.5; if (pr.ra) pr.ra.rotation.x = v.mon ? -1.2 : -1.3 - pitch * 0.8; }
        else if (pr.body) { const hop = Math.abs(Math.sin(v.anim * 1.4 + G.t * 2)) * 0.3; pr.body.position.y = 0.5 + hop; if (pr.mouth) pr.mouth.scale.y = (b && b.biteT > 0) ? 2.2 : 1; if (b && b.biteT > 0) b.biteT -= dt; }
        v.flash = Math.max(0, (v.flash || 0) - dt * 4);
        const l = lightAt(pos[0], pos[1] + 1, pos[2]), k = (e.ud ? 2.2 : JQ ? 1.5 : 1.25) * (1 + v.flash * 1.5);
        E.setLight(v.m, l, k);
        if (e.away && v.m.mat) v.m.mat.uniforms.lmul.value.multiplyScalar(0.45);
        v.carry = e.carry >= 0;
      }
      for (const [id, v] of views) if (!seen.has(id)) { ctx.scene.remove(v.m); views.delete(id); }
      // items, flags, pads
      const wd = A.world();
      items.forEach(it => { it.m.visible = !wd.it || wd.it[it.i] !== 0; if (it.halo) { it.halo.visible = it.m.visible; const k = (it.big ? 2.2 : 1.5) * (0.92 + 0.08 * Math.sin(G.t * 3 + it.ph)); it.halo.scale.set(k, k, 1); } it.m.rotation.y = G.t * (it.big ? 2.4 : 1.6) + it.ph; it.m.position.y = it.p[1] + (JQ ? 0.1 : 0.15) + Math.sin(G.t * 2 + it.ph) * 0.1; if (it.big && it.m.visible && Math.random() < dt * 6) FX.emit(it.p[0] + (Math.random() - 0.5) * 0.6, it.p[1] + 0.3, it.p[2] + (Math.random() - 0.5) * 0.6, 0, 1.2, 0, JQ ? [0.8, 0.5, 1] : [0.8, 0.5, 1], 0.6, 0); });
      flags.forEach(f => {
        const st = wd.fl && wd.fl[f.team]; if (!st) return;
        let x = st[1], y = st[2], z = st[3];
        if (st[0] === 'carried') { const pp = drawPos(st[4]); if (pp) { x = pp[0]; y = pp[1] + 0.8; z = pp[2] + 0.2; } if (st[4] === me && !P.spec) { f.m.visible = false; return; } }
        f.m.visible = true; f.m.position.set(x, y, z); f.m.rotation.y = G.t * (st[0] === 'home' ? 0.6 : 2);
      });
      M.pads.forEach(p => { if (p.glow) p.glow.position.y = p.y + 0.05 + Math.abs(Math.sin(G.t * 3)) * 0.06; });
      if (G.planet) G.planet.rotation.y += dt * 0.01;
      if (G.over && A.g && A.g.vote) showVote();
      FX.update(dt); if (muz) muz.update(dt);
      camera(dt);
      ctx.render();
      hud(dt);
    }
    function playerFrame(dt) {
      if (G.auto) { input.consume(); input.pressed.length = 0; return; } // (the test autopilot is driving)
      const e = A.ent(me);
      if (e && !e.alive && !P.dead) { P.dead = true; P.deadT = G.t; }
      const [mx, my] = input.consume(), sens = 0.0022 * cfg.sens; G.look = [mx, my];
      if (!G.paused && !chatBox && !G.over) { P.yaw -= mx * sens; P.pitch -= my * sens * (cfg.invert ? -1 : 1); if (input.touch) { P.yaw -= input.lk[0] * 2.8 * dt; P.pitch -= input.lk[1] * 1.9 * dt * (cfg.invert ? -1 : 1); } }
      const live = !G.paused && !chatBox && !G.over;
      const act = n => live && input.act(n);
      if (act('turnl')) P.yaw += 2.6 * dt; if (act('turnr')) P.yaw -= 2.6 * dt;
      P.pitch = clamp(P.pitch, -1.45, 1.45);
      if (P.dead) {
        input.pressed.length = 0;
        if (G.over) return;
        if ((act('fire') || act('jump')) && !(G.ignoreFire > G.t) && G.t - P.deadT > 1.5 && G.t - (P.rsT || 0) > 1) { P.rsT = G.t; A.respawn(me); }
        return;
      }
      let f = (act('fwd') ? 1 : 0) - (act('back') ? 1 : 0), s = (act('right') ? 1 : 0) - (act('left') ? 1 : 0);
      if (input.touch && live) { f -= input.mv[1]; s += input.mv[0]; }
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      const wish = [-sy * f + cy * s, -cy * f - sy * s];
      const b = P; b.stepUp = 0; const wasG = P.ground;
      if (G.dodge && P.ground && live) { const d = { fwd: [0, 1], back: [0, -1], left: [-1, 0], right: [1, 0] }[G.dodge]; P.v[0] += (-sy * d[1] + cy * d[0]) * 11; P.v[2] += (-cy * d[1] - sy * d[0]) * 11; P.v[1] = 5.5; P.ground = false; sfx('jump'); }
      G.dodge = null;
      physics(P, wish, !!act('jump'), dt);
      if (P.stepUp) P.sy += P.stepUp;
      if (P.landed && P.landed > 6) { sfx('land', 120); P.land = Math.min(0.25, P.landed / 60); } P.landed = 0;
      if (P.jumped || (wasG && !P.ground && P.v[1] > 3)) sfx('jump', 250);
      const hs = Math.hypot(P.v[0], P.v[2]);
      if (P.ground) { P.bob += hs * dt * 1.4; if (hs > 3) { P.stepT -= hs * dt; if (P.stepT <= 0) { P.stepT = 2.6; sfx('step', 150); } } }
      P.roll += ((clamp(s, -1, 1) * -0.018) - P.roll) * Math.min(1, dt * 8);
      if (P.rj && G.t - P.rj.t < 2) { if (P.p[1] - P.rj.y > 2.4) { P.rj = null; Apps.secret('fps.squigjump'); say('ROCKET JUMP! Wheee!', 2); } } else P.rj = null;
      // weapons
      P.cool -= dt;
      for (let k = 0; k < NW; k++) if (input.take('Digit' + (k + 1))) { if ((P.has & (1 << k)) && (W[k].max < 0 || P.am[k] > 0)) { if (P.w !== k) { P.w = k; P.swap = SWAP; sfx('swap'); } } else if (P.has & (1 << k)) { say('Not enough ammo.', 1.5); sfx('empty'); } }
      if (input.hit('next')) cycleW(1); if (input.hit('prev')) cycleW(-1);
      if (input.wheel) { cycleW(Math.sign(input.wheel)); input.wheel = 0; }
      input.pressed.length = 0;
      // the referee's ammo count wins when we haven't fired for a moment
      const mine = A.mine(); if (mine && G.t - P.lastFire > 0.6) { P.am = mine.am.slice(); P.has = mine.has; P.abs = mine.abs; }
      if (!(P.has & (1 << P.w))) P.w = 1;
      let firing = act('fire') && !(G.ignoreFire > G.t);
      const altF = !JQ && !firing && (act('alt') || (input.touch && input.alt)) && !(G.ignoreFire > G.t);
      if (!firing && !altF && live && input.touch && cfg.autofire) firing = autoAim(dt);
      if ((firing || altF) && !G.over && P.swap <= 0.04) shoot(Object.assign(P, { id: me }), true, altF);
      A.move(me, { p: P.p, yaw: P.yaw, pitch: P.pitch, w: P.w });
    }
    // auto-fire for touch screens: shoot when someone is right in the crosshair, with a gentle nudge onto them
    function autoAim(dt) {
      const d = E.fwd(P.yaw, P.pitch), o = [P.p[0], P.p[1] + 1.55, P.p[2]];
      let best = null, ba = 0.16;
      for (const t of targetsFor(me)) { if (t.away) continue; const tx = t.p[0] - o[0], ty = t.p[1] + t.h * 0.55 - o[1], tz = t.p[2] - o[2], l = Math.hypot(tx, ty, tz); if (l > (W[P.w].range < 3 ? 2.6 : 45)) continue; const a = Math.acos(clamp((tx * d[0] + ty * d[1] + tz * d[2]) / l, -1, 1)); if (a < ba && M.los(o[0], o[1], o[2], t.p[0], t.p[1] + t.h * 0.55, t.p[2], 0.3)) { ba = a; best = { t, tx, ty, tz, l }; } }
      if (!best) return false;
      const wy = Math.atan2(-best.tx, -best.tz), wp = Math.atan2(best.ty, Math.hypot(best.tx, best.tz)); let dy = ((wy - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      P.yaw += clamp(dy, -1.2 * dt, 1.2 * dt); P.pitch += clamp(wp - P.pitch, -0.8 * dt, 0.8 * dt);
      return ba < 0.09;
    }
    function specFrame(dt) {
      const [mx, my] = input.consume();
      const ids = A.ids().filter(id => { const e = A.ent(id); return e && e.alive && !e.mon; });
      const click = input.act('fire') && !(G.ignoreFire > G.t);
      if (click && !G.specClick) { G.specClick = true; P.follow = ids.length ? ids[(ids.indexOf(P.follow) + 1) % ids.length] : 0; P.free = false; }
      if (!click) G.specClick = false;
      if (input.take('Space')) P.free = !P.free;
      input.pressed.length = 0;
      if (P.free || !P.follow || !ids.includes(P.follow)) {
        P.yaw -= mx * 0.0022 * cfg.sens; P.pitch = clamp(P.pitch - my * 0.0022 * cfg.sens, -1.4, 1.4);
        const f = (input.act('fwd') ? 1 : 0) - (input.act('back') ? 1 : 0) - (input.touch ? input.mv[1] : 0), s = (input.act('right') ? 1 : 0) - (input.act('left') ? 1 : 0) + (input.touch ? input.mv[0] : 0);
        if (input.touch) { P.yaw -= input.lk[0] * 2.6 * dt; P.pitch -= input.lk[1] * 1.8 * dt; }
        const d = E.fwd(P.yaw, P.pitch), cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
        P.p[0] += (d[0] * f + cy * s) * 12 * dt; P.p[1] += d[1] * f * 12 * dt; P.p[2] += (d[2] * f - sy * s) * 12 * dt;
        if (!P.follow && ids.length && !P.free) P.follow = ids[0];
      } else {
        const pp = drawPos(P.follow), e = A.ent(P.follow);
        if (pp && e) { const yaw = (bots.find(b => b.id === P.follow) || e).yaw; P.yaw += ((((yaw - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI)) * Math.min(1, dt * 5); P.pitch = -0.25; const d = E.fwd(P.yaw, 0); P.p = [pp[0] - d[0] * 4, pp[1] + 1.2, pp[2] - d[2] * 4]; }
      }
    }
    function camera(dt) {
      P.sy = (P.sy || 0) * Math.pow(0.0001, dt);
      const cam = ctx.camera;
      if (P.spec) { cam.position.set(P.p[0], P.p[1] + 1.5, P.p[2]); cam.rotation.set(P.pitch, P.yaw, 0); VM.forEach(m => { m.visible = false; }); return; }
      const hs = Math.hypot(P.v[0], P.v[2]), bobK = cfg.bob === false ? 0.25 : 1;
      const bob = P.ground && !P.dead ? Math.sin(P.bob) * Math.min(1, hs / 9) * 0.05 * bobK : 0;
      P.land = Math.max(0, (P.land || 0) - dt * 0.9);
      G.shake = Math.max(0, (G.shake || 0) - dt * 2.5); const sh = G.shake ? (Math.random() - 0.5) * G.shake * 0.12 : 0;
      if (G.over && !JQ && A) { // the end of a match: the camera circles the winner (if it isn't you)
        const wid = A.ids().find(i => i !== me && A.ent(i) && A.ent(i).name === G.over.who), wpos = wid != null ? drawPos(wid) : null;
        if (wpos) { const a = (G.t - G.over.t) * 0.35; let r = 4.2; while (r > 1.2) { const c = M.at(wpos[0] + Math.sin(a) * r, wpos[2] + Math.cos(a) * r); if (!c.s && (c.sky || c.c > wpos[1] + 2.6)) break; r -= 0.4; }
          cam.position.set(wpos[0] + Math.sin(a) * r, wpos[1] + 2, wpos[2] + Math.cos(a) * r); cam.lookAt(wpos[0], wpos[1] + 1.1, wpos[2]); VM.forEach(m => { m.visible = false; }); return; }
      }
      if (P.dead) { // third person: look back at yourself going poof
        const k = Math.min(1, (G.t - P.deadT) * 1.5);
        cam.position.set(P.p[0] + Math.sin(P.yaw) * 3 * k, P.p[1] + 1.6 + 1.5 * k, P.p[2] + Math.cos(P.yaw) * 3 * k); cam.rotation.set(-0.35 * k, P.yaw, 0);
      } else { cam.position.set(P.p[0], P.p[1] + (JQ ? 1.5 : 1.58) + bob - P.sy - Math.sin(Math.min(1, P.land / 0.25) * Math.PI) * P.land * 0.6 + sh, P.p[2]); cam.rotation.set(P.pitch + sh * 0.3 + (G.recoil || 0), P.yaw, P.roll * bobK); }
      P.kick = Math.max(0, (P.kick || 0) - dt * (JQ ? 6 : 9)); P.swap = Math.max(0, (P.swap || 0) - dt); G.recoil = (G.recoil || 0) * Math.exp(-dt * 10);
      VM.forEach((m, k) => { m.visible = k === P.w && !P.dead && !G.over; });
      const vm = VM[P.w];
      if (vm) {
        const s = Math.sin(P.bob * 0.5) * (JQ ? 0.02 : 0.015) * Math.min(1, hs / 9) * bobK, ll = lightAt(P.p[0], P.p[1] + 1.4, P.p[2]), lift = P.land * 0.25;
        if (JQ) { const vo = PCG.jqArt.VMOFF[P.w] || [0, 0, 0]; vm.position.set(0.1 + s + vo[0], -0.115 + vo[1] + Math.abs(s) * 0.5 - P.swap * 0.8 - lift, -0.24 + vo[2] + P.kick * 0.04); vm.rotation.set(P.kick * (P.w === 0 ? -0.9 : 0.15), 0, P.roll * 2); const fl = ctx.uFlick.value; vm.mat.uniforms.lmul.value.set(Math.max(0.75, (ll[0] + ll[3] * fl) * 1.4), Math.max(0.7, (ll[1] + ll[4] * fl) * 1.4), Math.max(0.65, (ll[2] + ll[5] * fl) * 1.4)); }
        else { // sway behind the mouse, bob, breathe, kick back when it fires, dip out of sight while switching
          const o = VMO[P.w] || VMO[1], lk = G.look || [0, 0], sw = G.sway = G.sway || [0, 0], kz = [-0.09, 0.035, 0.05, 0.01, 0.06, 0.055][P.w], kr = [0.12, 0.2, 0.12, 0.02, 0.22, 0.16][P.w];
          sw[0] += (clamp(-lk[0] * 0.00045, -0.035, 0.035) - sw[0]) * Math.min(1, dt * 9); sw[1] += (clamp(lk[1] * 0.00045, -0.03, 0.03) - sw[1]) * Math.min(1, dt * 9);
          const br = Math.sin(G.t * 1.7) * 0.0025, shake = P.w === 3 && G.t - P.lastFire < 0.1 ? (Math.random() - 0.5) * 0.006 : 0, sd = Math.sin(Math.min(1, P.swap / SWAP) * Math.PI / 2);
          vm.position.set(o[0] + s + sw[0] + shake, o[1] + Math.abs(s) + br + sw[1] - sd * 0.16 - lift + shake, o[2] + P.kick * kz);
          vm.rotation.set(P.kick * kr - sd * 0.5, o[3] + sw[0] * 2.5, P.roll * 2 - sd * 0.25);
          E.setLight(vm, ll, 1.0); const lm = vm.mat.uniforms.lmul.value; lm.set(clamp(lm.x * 0.8, 0.42, 0.85), clamp(lm.y * 0.8, 0.42, 0.85), clamp(lm.z * 0.8, 0.46, 0.9));
          if (P.w === 3 && vm.parts.rot) { G.spin = G.t - P.lastFire < 0.3 ? (P.lastAlt ? 40 : 28) : Math.max(0, (G.spin || 0) - dt * 30); vm.parts.rot.rotation.z += (G.spin || 0) * dt; }
          if (vm.glow) { const gl = vm.glow.mat.uniforms.lmul.value, pulse = 1 + (G.t - P.lastFire < 0.15 ? 0.6 : 0) + 0.12 * Math.sin(G.t * 6); gl.set(pulse, pulse, pulse); } }
        const e = A.ent(me); if (e && e.ud) vm.mat.uniforms.lmul.value.multiplyScalar(1.6);
        if (G.mflash > 0) { G.mflash -= dt; vm.mat.uniforms.lmul.value.multiplyScalar(1.5); }
      }
    }

    // ---------------------------------------------------------------- the HUD
    function txt(g, s, x, y, size, col, align, outline) {
      g.font = `bold ${size}px Tahoma, Verdana, sans-serif`; g.textAlign = align || 'left'; g.textBaseline = 'top';
      g.lineWidth = Math.max(2, size / 7); g.strokeStyle = outline || 'rgba(0,0,0,.85)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
    }
    function panel(g, x, y, w2, h, col) { g.fillStyle = 'rgba(10,20,50,.55)'; g.fillRect(x, y, w2, h); g.strokeStyle = col || 'rgba(120,180,255,.7)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w2 - 1, h - 1); }
    // damage arcs: a red wedge on the side the hit came from
    function hurtArcs(g, cx, cy, R, lw) {
      const hs = (G.hurtDirs || []).filter(h => h.t > G.t); G.hurtDirs = hs;
      for (const h of hs) { const rel = h.a - P.yaw, a = -Math.PI / 2 - rel, k = Math.min(1, (h.t - G.t) / 0.6) * h.k; g.strokeStyle = `rgba(255,40,20,${0.75 * k})`; g.lineWidth = lw; g.beginPath(); g.arc(cx, cy, R, a - 0.35, a + 0.35); g.stroke(); }
    }
    function hitMarker(g, cx, cy, u) {
      if (!(G.hitT > G.t)) return; const k = (G.hitT - G.t) / 0.18, s = (5 + 3 * (G.hitK || 1)) * u, i = 3 * u;
      g.strokeStyle = `rgba(255,255,255,${k})`; g.lineWidth = Math.max(1, 1.5 * u); g.beginPath();
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.moveTo(cx + a * i, cy + b * i); g.lineTo(cx + a * s, cy + b * s); } g.stroke();
    }
    // ---- the JRT HUD, in the style of the big 1999 tournament games: translucent panels in your HUD colour (your team's in
    // CTF), chunky segment digits, a status doll, the weapon bar of gun silhouettes along the bottom, frags + rank top right
    const HUDC = { blue: [90, 150, 255], gold: [255, 196, 60], green: [80, 230, 110], red: [255, 84, 64], purple: [190, 120, 255], white: [225, 230, 240] };
    const hudRGB = () => { if (A && A.mode === 'ctf') { const e = A.ent(me); if (e && e.team >= 0) return e.team ? [80, 140, 255] : [255, 84, 64]; } return HUDC[cfg.hudc] || HUDC.blue; };
    const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    const tint = (c, k) => c.map(v => Math.round(Math.min(255, k > 1 ? v + (255 - v) * (k - 1) : v * k)));
    function upanel(g, x, y, w2, h, c, a, on) { // a bevelled, see-through panel with one corner cut off
      const k = Math.min(7, h * 0.28); g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + w2, y); g.lineTo(x + w2, y + h - k); g.lineTo(x + w2 - k, y + h); g.lineTo(x, y + h); g.lineTo(x, y + k); g.closePath();
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgba(tint(c, 0.5), a)); gr.addColorStop(1, rgba(tint(c, 0.16), a * 0.85)); g.fillStyle = gr; g.fill();
      g.strokeStyle = on ? 'rgba(255,232,150,.95)' : rgba(tint(c, 1.25), 0.8); g.lineWidth = on ? 1.5 : 1; g.stroke();
      g.fillStyle = rgba(tint(c, 1.6), 0.25); g.fillRect(x + k, y + 1, w2 - k - 1, 1);
    }
    const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', '+': 'g' };
    function bigNum(g, n, x, y, h, c, align) { // chunky segment digits; returns the width
      const s = String(n), w = h * 0.56, gap = h * 0.14, t = Math.max(2, h * 0.18), tw = s.length * (w + gap) - gap;
      let X = align === 'right' ? x - tw : align === 'center' ? x - tw / 2 : x;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgba(tint(c, 1.55), 1)); gr.addColorStop(0.48, rgba(c, 1)); gr.addColorStop(0.52, rgba(tint(c, 0.75), 1)); gr.addColorStop(1, rgba(tint(c, 1.1), 1));
      for (const ch of s) {
        const sg = SEG[ch] || '', hh = h / 2, R = { a: [X + t * 0.6, y, w - t * 1.2, t], b: [X + w - t, y + t * 0.6, t, hh - t * 0.6], c: [X + w - t, y + hh + t * 0.1, t, hh - t * 0.7], d: [X + t * 0.6, y + h - t, w - t * 1.2, t], e: [X, y + hh + t * 0.1, t, hh - t * 0.7], f: [X, y + t * 0.6, t, hh - t * 0.6], g: [X + t * 0.6, y + hh - t / 2, w - t * 1.2, t] };
        if (ch === '+') R.v = [X + w / 2 - t / 2, y + hh - w / 2 + t / 2, t, w - t];
        g.fillStyle = rgba(tint(c, 0.3), 0.3); for (const k of 'abcdefg') if (!sg.includes(k) && ch !== '+' && ch !== '-') { const r = R[k]; g.fillRect(r[0], r[1], r[2], r[3]); } // the unlit segments, faintly
        const on = sg.split('').concat(R.v ? ['v'] : []);
        g.fillStyle = 'rgba(0,0,0,.75)'; for (const k of on) { const r = R[k]; g.fillRect(r[0] + 1.5, r[1] + 1.5, r[2], r[3]); }
        g.fillStyle = gr; for (const k of on) { const r = R[k]; g.fillRect(r[0], r[1], r[2], r[3]); }
        X += w + gap;
      }
      return tw;
    }
    function doll(g, x, y, h, hp, ar, t) { // the little body: green when healthy, amber, then flashing red; the Shield Belt glows gold
      const k = h / 40, col = hp > 66 ? [80, 230, 110] : hp > 33 ? [255, 200, 60] : [255, 70, 50], a = hp > 33 || Math.floor(t * 4) % 2 ? 0.88 : 0.45;
      const parts = [[15, 0, 10, 9], [11, 10, 18, 14], [5, 10, 5, 14], [30, 10, 5, 14], [12, 25, 7, 15], [21, 25, 7, 15]];
      for (const [px, py, pw, ph] of parts) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + (px + 1) * k, y + (py + 1) * k, pw * k, ph * k); g.fillStyle = rgba(col, a); g.fillRect(x + px * k, y + py * k, pw * k, ph * k); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + px * k, y + py * k, pw * k, Math.max(1, k)); }
      if (ar > 0) { const p = 0.55 + 0.3 * Math.sin(t * 5); g.strokeStyle = `rgba(255,214,70,${p})`; g.lineWidth = Math.max(1, 1.6 * k); g.strokeRect(x + 9.5 * k, y + 8.5 * k, 21 * k, 17 * k); g.fillStyle = 'rgba(255,214,70,.55)'; g.fillRect(x + 11 * k, y + 20 * k, 18 * k, 3 * k); }
    }
    const icons = {};
    function wIcon(w, has) { // a side-on silhouette of each gun, drawn from its own 3D model
      const key = w + (has ? 'y' : 'n'); if (icons[key]) return icons[key];
      const P_ = GUNS[w] || [], abs = {}, rects = [];
      for (const p of P_) { const par = p[8] ? abs[p[8]] || [0, 0, 0] : [0, 0, 0], pv = p[9] || [0, 0, 0]; abs[p[0]] = [par[0] + p[4] + pv[0], par[1] + p[5] + pv[1], par[2] + p[6] + pv[2]]; if (/^(hand|thumb|rot|sleeve|tip)$/.test(p[0])) continue; const a = abs[p[0]]; rects.push([-a[2] - p[3] / 2, a[1] - p[2] / 2, p[3], p[2], p[7], a[0]]); }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const r of rects) { x0 = Math.min(x0, r[0]); x1 = Math.max(x1, r[0] + r[2]); y0 = Math.min(y0, r[1]); y1 = Math.max(y1, r[1] + r[3]); }
      const cv = document.createElement('canvas'); cv.width = 72; cv.height = 30; const x = cv.getContext('2d'), sc = Math.min(66 / (x1 - x0 || 1), 26 / (y1 - y0 || 1));
      rects.sort((a, b) => a[5] - b[5]); // far side first
      for (const [rx, ry, rw, rh, col] of rects) {
        const c = new T.Color(col), base = has ? [c.r * 255 * 2.2, c.g * 255 * 2.2, c.b * 255 * 2.2] : [120, 126, 140].map(v => v * (0.6 + (c.r + c.g + c.b) * 0.5));
        const X = 3 + (rx - x0) * sc, Y = 28 - (ry - y0) * sc - rh * sc;
        x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(X + 1, Y + 1, Math.max(1, rw * sc), Math.max(1, rh * sc));
        x.fillStyle = rgba(base.map(v => Math.min(255, v)), has ? 1 : 0.55); x.fillRect(X, Y, Math.max(1, rw * sc), Math.max(1, rh * sc));
        x.fillStyle = has ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'; x.fillRect(X, Y, Math.max(1, rw * sc), 1);
      }
      return icons[key] = cv;
    }
    function crosshair(g, cx, cy, u, c) {
      const st = cfg.xhair | 0, s = u, col = G.hitT > G.t ? '#ff4030' : c;
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(1, 1.3 * s);
      const sh = (fn) => { g.save(); g.fillStyle = 'rgba(0,0,0,.6)'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.translate(1, 1); fn(); g.restore(); fn(); };
      if (st === 1) sh(() => g.fillRect(cx - 1.5 * s, cy - 1.5 * s, 3 * s, 3 * s));
      else if (st === 2) sh(() => { g.beginPath(); g.arc(cx, cy, 7 * s, 0, 7); g.stroke(); g.fillRect(cx - s, cy - s, 2 * s, 2 * s); });
      else if (st === 3) sh(() => { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.moveTo(cx + a * 9 * s, cy + b * 4 * s); g.lineTo(cx + a * 9 * s, cy + b * 9 * s); g.lineTo(cx + a * 4 * s, cy + b * 9 * s); g.stroke(); } });
      else if (st === 4) sh(() => { g.fillRect(cx - 12 * s, cy - 0.75 * s, 24 * s, 1.5 * s); g.fillRect(cx - 0.75 * s, cy - 12 * s, 1.5 * s, 24 * s); });
      else sh(() => { const sp = 3 + Math.min(4, (G.recoil || 0) * 160); g.fillRect(cx - (sp + 5) * s, cy - 0.75 * s, 5 * s, 1.5 * s); g.fillRect(cx + sp * s, cy - 0.75 * s, 5 * s, 1.5 * s); g.fillRect(cx - 0.75 * s, cy - (sp + 5) * s, 1.5 * s, 5 * s); g.fillRect(cx - 0.75 * s, cy + sp * s, 1.5 * s, 5 * s); });
    }
    function hud(dt) {
      if (JQ) return hudJQ(dt);
      const g = ctx.hctx, Wd = ctx.rw, H0 = ctx.rh, u = Math.max(0.55, Math.min(H0, Wd / 1.5) / 400), tb2 = input.touch ? 228 / ctx.scale : 0, tt = input.touch ? 64 / ctx.scale : 0, H = H0 - tb2;
      g.clearRect(0, 0, Wd, H0); g.imageSmoothingEnabled = true;
      if (G.mode !== 'game' || !A) return;
      const e = P.spec ? null : A.ent(me), wd = A.world(), hc = hudRGB();
      if (G.hurt > 0) { const gr = g.createRadialGradient(Wd / 2, H0 / 2, Math.min(Wd, H0) * 0.25, Wd / 2, H0 / 2, Math.max(Wd, H0) * 0.7); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,0,0,${Math.min(0.6, G.hurt * 0.7)})`); g.fillStyle = gr; g.fillRect(0, 0, Wd, H0); G.hurt = Math.max(0, G.hurt - dt * 1.8); }
      if (G.flash > 0) { g.fillStyle = `rgba(255,240,160,${G.flash})`; g.fillRect(0, 0, Wd, H0); G.flash -= dt; }
      if (G.spawnFx > 0) { g.fillStyle = `rgba(150,200,255,${G.spawnFx * 0.9})`; g.fillRect(0, 0, Wd, H0); G.spawnFx -= dt; }
      if (e && e.ud) { g.fillStyle = `rgba(160,60,255,${0.1 + 0.04 * Math.sin(G.t * 6)})`; g.fillRect(0, 0, Wd, H0); }
      if (G.over) { g.fillStyle = 'rgba(0,0,10,.4)'; g.fillRect(0, 0, Wd, H0); }
      if (e && !G.over) {
        // the status doll, health and shield (bottom left)
        const ph = 44 * u, py = H - ph - 6 * u, hp = Math.ceil(Math.max(0, e.hp)), ar = Math.round(e.ar || 0);
        upanel(g, 6 * u, py, 128 * u, ph, hc, 0.5);
        doll(g, 10 * u, py + 3 * u, 38 * u, hp, ar, G.t);
        bigNum(g, hp, 126 * u, py + 6 * u, 30 * u, hp > 33 ? [255, 255, 255] : Math.floor(G.t * 4) % 2 ? [255, 70, 50] : [255, 180, 160], 'right');
        if (ar > 0) { upanel(g, 6 * u, py - 20 * u, 84 * u, 17 * u, [255, 196, 60], 0.45); txt(g, 'SHIELD', 11 * u, py - 17 * u, 9 * u, '#ffe890'); bigNum(g, ar, 85 * u, py - 17 * u, 11 * u, [255, 214, 80], 'right'); }
        // the weapon bar (bottom middle): your guns, the one in your hands lit up, ammo underneath
        const narrow = Wd < 290 * u + NW * 40 * u, n = NW, sw = narrow ? Math.min(56 * u, (Wd - 16 * u) / n) : Math.min(56 * u, (Wd - 250 * u) / n), bh = 32 * u, sx = Wd / 2 - sw * n / 2, sy = narrow ? py - bh - (ar > 0 ? 28 : 8) * u : H - bh - 6 * u; // (phones: the weapon bar sits above health and ammo)
        for (let k = 0; k < n; k++) {
          const has = P.has & (1 << k), on = P.w === k, x = sx + k * sw + 1, ic = wIcon(k, !!has);
          upanel(g, x, sy - (on ? 4 * u : 0), sw - 2, bh + (on ? 4 * u : 0), on ? [255, 200, 70] : hc, on ? 0.62 : 0.4, on);
          g.globalAlpha = has ? 1 : 0.5; const iw = sw - 8, ih = iw * 30 / 72; g.drawImage(ic, x + 3, sy + (on ? -2 * u : 2 * u) + (bh - 8 * u - ih) / 2, iw, ih); g.globalAlpha = 1;
          txt(g, String(k + 1), x + 3 * u, sy + (on ? -3 * u : 1 * u), 8 * u, has ? '#fff' : '#889');
          if (has && W[k].max >= 0) { const f = clamp(P.am[k] / W[k].max, 0, 1), bw = sw - 10 * u; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + 4 * u, sy + bh - 6 * u, bw, 3 * u); g.fillStyle = f < 0.15 ? '#ff5030' : on ? '#ffe070' : rgba(tint(hc, 1.3), 1); g.fillRect(x + 4 * u, sy + bh - 6 * u, bw * f, 3 * u); }
        }
        if (P.swap > 0 || G.t - (G.wShown || 0) < 1.6) { const k = Math.min(1, 1.6 - (G.t - (G.wShown || 0))); g.globalAlpha = clamp(k * 2, 0, 1); txt(g, W[P.w].n + (W[P.w].alt ? `  (alt: ${W[P.w].alt.n})` : ''), Wd / 2, sy - 18 * u, 11 * u, '#ffe890', 'center'); g.globalAlpha = 1; }
        if (P.w !== G.lastW) { G.lastW = P.w; G.wShown = G.t; }
        // ammo (bottom right)
        if (W[P.w].max >= 0) { const am = Math.max(0, Math.round(P.am[P.w])); upanel(g, Wd - 96 * u, py, 90 * u, ph, hc, 0.5); txt(g, 'AMMO', Wd - 91 * u, py + 3 * u, 8 * u, rgba(tint(hc, 1.5), 1)); bigNum(g, am, Wd - 12 * u, py + 6 * u, 30 * u, am > W[P.w].max * 0.15 ? [255, 236, 150] : [255, 80, 50], 'right'); }
        // crosshair, hit marker, damage arcs
        const cx = Wd / 2, cy = H0 / 2;
        if (!P.dead && !input.touch) crosshair(g, cx, cy, u, cfg.xhc === 'hud' ? rgba(tint(hc, 1.3), 0.95) : '#a0ff80');
        if (!P.dead && input.touch) { g.strokeStyle = 'rgba(160,255,128,.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 5 * u, 0, 7); g.stroke(); }
        hitMarker(g, cx, cy, u); hurtArcs(g, cx, cy, 60 * u, 6 * u);
        // who am I looking at?
        if (!P.dead) { const t = lookAt(); if (t) txt(g, t.name + (t.bot ? '' : t.away ? ' (away)' : ' (human)') + (t.hp != null && (t.team === (e.team) && A.mode === 'ctf') ? `  ${t.hp}%` : ''), Wd / 2, H0 / 2 + 16 * u, 11 * u, A.mode === 'ctf' ? TEAMC[Math.max(0, t.team)] : '#ffffff', 'center'); }
        if (G.fragT > G.t) { const k = Math.min(1, (G.fragT - G.t) * 2); g.globalAlpha = k; txt(g, `You poofed ${G.fragN}!`, Wd / 2, H0 * 0.6, 13 * u, '#ffe890', 'center'); g.globalAlpha = 1; }
      }
      // frags + rank (top right)
      const sc = (A.scores() || []).slice().sort((a, b) => b[2] - a[2]);
      const myRow = sc.find(r => r[0] === me), rank = myRow ? sc.indexOf(myRow) + 1 : 0, lead = sc.find(r => r[0] !== me);
      if (myRow) {
        const y0 = 6 * u + tt; upanel(g, Wd - 104 * u, y0, 98 * u, 52 * u, hc, 0.4);
        txt(g, 'FRAGS', Wd - 99 * u, y0 + 3 * u, 8 * u, rgba(tint(hc, 1.5), 1)); bigNum(g, myRow[2] < 0 ? '-' + -myRow[2] : myRow[2], Wd - 12 * u, y0 + 4 * u, 22 * u, [255, 255, 255], 'right');
        txt(g, `RANK ${rank}/${sc.length}`, Wd - 99 * u, y0 + 29 * u, 9 * u, '#e0e0f0');
        if (lead && A.mode === 'dm') { const spr = myRow[2] - (rank === 1 ? (sc[1] ? sc[1][2] : 0) : sc[0][2]); txt(g, `SPREAD ${spr > 0 ? '+' : ''}${spr}`, Wd - 99 * u, y0 + 40 * u, 9 * u, spr >= 0 ? '#80ff80' : '#ff8060'); }
      }
      if (A.mode === 'ctf' && wd.ts) {
        const fl = wd.fl || []; [0, 1].forEach(t => { const st = fl[t] ? fl[t][0] : 'home', y = 64 * u + tt + t * 26 * u; upanel(g, Wd - 110 * u, y, 104 * u, 22 * u, t ? [80, 140, 255] : [255, 84, 64], 0.55); g.fillStyle = TEAMC[t]; g.fillRect(Wd - 104 * u, y + 4 * u, 12 * u, 9 * u); g.fillStyle = '#ddd'; g.fillRect(Wd - 104 * u, y + 4 * u, 2 * u, 15 * u); bigNum(g, wd.ts[t], Wd - 74 * u, y + 4 * u, 14 * u, [255, 255, 255], 'right'); txt(g, st === 'home' ? 'safe' : st === 'carried' ? 'TAKEN!' : 'dropped', Wd - 68 * u, y + 6 * u, 10 * u, st === 'home' ? '#fff' : Math.floor(G.t * 3) % 2 ? '#ffd040' : '#fff'); });
        if (e && e.carry >= 0) txt(g, 'YOU HAVE THE FLAG! TAKE IT HOME!', Wd / 2, 60 * u, 13 * u, Math.floor(G.t * 3) % 2 ? '#ffd040' : '#fff', 'center');
      }
      if (wd.left >= 0) { const urg = wd.left <= 30 && wd.st === 'play'; txt(g, `${Math.floor(wd.left / 60)}:${String(wd.left % 60).padStart(2, '0')}`, Wd / 2, 6 * u + (input.touch ? tt : 0), (urg ? 17 : 14) * u, urg ? '#ff6040' : '#d8d8e8', 'center'); }
      if (!A.local && !G.over && !P.spec) txt(g, `${A.g.lan ? 'LAN' : 'Internet'}: ${A.g.name}  ping ${Math.round(A.rtt())}${A.host ? '  (you run the bots)' : ''}`, 8 * u, H - (e ? 74 : 20) * u, 9 * u, '#8a8aa8');
      // kill feed + chat (top left), messages
      G.feed = G.feed.filter(f => f.t > G.t);
      if (!G.over) G.feed.forEach((f, i) => { g.globalAlpha = Math.min(1, (f.t - G.t) * 2); txt(g, f.s, 8 * u, 8 * u + tt + i * 14 * u, 11 * u, f.chat ? '#a0ff80' : f.mine ? '#ffd860' : '#e0e0f0'); g.globalAlpha = 1; });
      G.msgs = G.msgs.filter(m => m.t > G.t);
      if (!G.over) G.msgs.forEach((m, i) => txt(g, m.s, Wd / 2, H * 0.68 + i * 15 * u, 11 * u, '#e0f0ff', 'center'));
      // the announcer: big gold letters that punch in and fade
      G.ann = G.ann.filter(a => a.t > G.t);
      if (!G.over) G.ann.forEach((a, i) => { const age = 2.6 - (a.t - G.t), k = Math.min(1, (a.t - G.t) * 2), pop = age < 0.15 ? 1.6 - age / 0.15 * 0.6 : 1, sz = (a.big ? 24 : 15) * u * pop; g.globalAlpha = k; txt(g, a.s, Wd / 2, H * 0.27 + i * 30 * u - (sz - (a.big ? 24 : 15) * u) / 2, sz, a.big ? '#ffd040' : '#ffffff', 'center', a.big ? '#801000' : '#000'); g.globalAlpha = 1; });
      if (P.dead && !P.spec && !G.over) { txt(g, P.killer && P.killer !== me ? `Poofed by ${nameOfId(P.killer)}!` : 'You went POOF!', Wd / 2, H * 0.45, 18 * u, '#ff6040', 'center'); if (G.t - P.deadT > 1.5) txt(g, input.touch ? 'Press FIRE to respawn' : 'Click or press SPACE to respawn', Wd / 2, H * 0.45 + 24 * u, 12 * u, '#fff', 'center'); }
      if (P.spec) txt(g, `SPECTATING ${P.free || !P.follow ? '(free camera)' : nameOfId(P.follow)}  -  click: next player, SPACE: free camera`, Wd / 2, H - 22 * u, 11 * u, '#ffe890', 'center');
      G.fpsNow = (G.fpsNow || 30) * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;
      if (cfg.fps) txt(g, `${Math.round(G.fpsNow)} fps`, Wd - 10 * u, H0 - 16 * u, 9 * u, '#80ff80', 'right');
      if (G.scoreHeld || G.over) scoreboard(g, Wd, H, u, sc, wd);
    }
    function lookAt() {
      const d = E.fwd(P.yaw, P.pitch), o = [P.p[0], P.p[1] + 1.55, P.p[2]], wall = M.ray(o[0], o[1], o[2], d[0], d[1], d[2], 60) || 60;
      const h = E.rayEnts(o, d, wall, A.ids().filter(id => id !== me).map(id => { const x = A.ent(id); return x && x.alive ? { id, p: drawPos(id) || x.p, r: 0.45, h: 1.85 } : null; }).filter(Boolean));
      return h ? A.ent(h.e.id) : null;
    }
    const isHuman = r => !r[6];
    const memberOf = name => A && A.g && (A.g.humans || []).some(h => h[1] === name && h[2]);
    function scoreboard(g, Wd, H, u, sc, wd) {
      const hc = hudRGB(), w2 = Math.min(Wd - 12, 540 * u), x = (Wd - w2) / 2, y = 40 * u, rows = sc.length, rh = 17 * u, hh = (70 + rows * 17) * u + 14;
      g.fillStyle = 'rgba(4,6,16,.88)'; g.fillRect(x, y, w2, hh);
      const hg = g.createLinearGradient(0, y, 0, y + 40 * u); hg.addColorStop(0, rgba(tint(hc, 0.75), 0.95)); hg.addColorStop(1, rgba(tint(hc, 0.25), 0.95)); g.fillStyle = hg; g.fillRect(x, y, w2, 40 * u);
      g.strokeStyle = rgba(tint(hc, 1.3), 0.9); g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w2 - 1, hh - 1); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 1, y + 1, w2 - 2, 1);
      txt(g, G.over ? `${G.over.who} ${/^(The players|Red team|Blue team)$/.test(G.over.who) ? 'win' : 'wins'} the match!` : `${M.meta.title.toUpperCase()}`, Wd / 2, y + 5 * u, 16 * u, '#ffd040', 'center', '#2a1400');
      txt(g, (A.mode === 'ctf' ? `Capture the Flag   RED ${wd.ts ? wd.ts[0] : 0} : ${wd.ts ? wd.ts[1] : 0} BLUE   (caps to win: ${A.caps || 3})` : A.mode === 'coop' ? 'Co-op' : `DeathMatch   Frag limit: ${A.frags}`) + (A.g && A.g.time ? `   Time limit: ${A.g.time} min` : ''), Wd / 2, y + 25 * u, 10 * u, '#e8e8f8', 'center');
      const cols = [['PLAYER', 0.05], ['FRAGS', 0.56], ['DEATHS', 0.68], [A.mode === 'ctf' ? 'CAPS' : '', 0.8], ['PING', 0.9]];
      cols.forEach(([n, f]) => txt(g, n, x + w2 * f, y + 46 * u, 9 * u, rgba(tint(hc, 1.5), 1)));
      sc.forEach((r, i) => {
        const yy = y + (61 + i * 17) * u, ent = A.ent(r[0]), away = ent && ent.away, col = away ? '#7a7a8a' : A.mode === 'ctf' ? TEAMC[Math.max(0, r[5])] : (r[0] === me ? '#ffe890' : '#e0e0f0');
        if (i % 2) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x + 4, yy - 2, w2 - 8, rh - 1); }
        if (r[0] === me) { g.fillStyle = 'rgba(255,220,100,.16)'; g.fillRect(x + 4, yy - 2, w2 - 8, rh - 1); }
        let nx = x + w2 * 0.05; const lv = isHuman(r) && window.Grind && memberOf(r[1]) ? Grind.rankOf(r[1]) : 0;
        if (i === 0 && r[2] > 0 && A.mode !== 'ctf') { star(g, x + w2 * 0.025, yy + 6 * u, 5 * u); }
        if (lv >= 2) { g.fillStyle = lv >= 40 ? '#ffd040' : lv >= 20 ? '#c0c0d0' : '#c88040'; g.fillRect(nx, yy, 16 * u, 12 * u); txt(g, String(lv), nx + 8 * u, yy + 1 * u, 9 * u, '#000', 'center', 'rgba(255,255,255,.3)'); nx += 20 * u; }
        txt(g, r[1] + (r[6] ? '' : ' *') + (away ? ' (away)' : ''), nx, yy, 11 * u, col); txt(g, String(r[2]), x + w2 * 0.56, yy, 11 * u, col); txt(g, String(r[3]), x + w2 * 0.68, yy, 11 * u, col); if (A.mode === 'ctf') txt(g, String(r[4]), x + w2 * 0.8, yy, 11 * u, col); txt(g, r[6] ? 'BOT' : String(r[7] || (A.local ? 0 : '?')), x + w2 * 0.9, yy, 11 * u, col);
      });
      txt(g, '* = a real person' + (window.Grind ? '   (the number is their JackNet Rank)' : ''), x + w2 * 0.05, y + hh - 16 * u, 9 * u, '#8a8aa8');
      if (G.over && !P.spec) { const pl = sc.findIndex(r => r[0] === me) + 1, th = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'); if (pl && A.mode === 'dm') txt(g, pl === 1 ? (sc.some(r => r[1] === 'Callum') ? 'You WON! Callum will want a rematch.' : 'You WON!') : `You came ${th(pl)} out of ${sc.length}.`, Wd / 2, y - 22 * u, 13 * u, pl === 1 ? '#80ff80' : '#e0e0f0', 'center'); }
      if (G.over && A.local && G.ladder == null) txt(g, 'Next match in a few seconds...', Wd / 2, y + hh + 4 * u, 10 * u, '#9a9ab0', 'center');
    }
    function star(g, x, y, r) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fillStyle = '#ffd040'; g.fill(); g.strokeStyle = '#5a3a00'; g.lineWidth = 1; g.stroke(); }
    // ---- JAQUAKE's status bar, face and pixel font
    function hudJQ(dt) {
      const g = ctx.hctx, Wd = ctx.rw, H = ctx.rh;
      g.clearRect(0, 0, Wd, H);
      if (G.mode !== 'game' || !A) return;
      const e = P.spec ? null : A.ent(me), wd = A.world(), by = H - 44, bx = Math.round((Wd - 320) / 2), mid = by / 2;
      ctx.setBottom(44);
      ctx.uHurt.value = Math.max(0, G.hurt || 0) * 0.8; G.hurt = Math.max(0, (G.hurt || 0) - dt * 1.5);
      const bar = PCG.jqArt.jqBar();
      if (Wd > 320) { g.fillStyle = '#1a1008'; g.fillRect(0, by, Wd, 44); for (let x = bx - 320; x > -320; x -= 320) g.drawImage(bar, x, by); for (let x = bx + 320; x < Wd; x += 320) g.drawImage(bar, x, by); }
      g.drawImage(bar, bx, by);
      const FS = { hp: e ? e.hp : 0, dead: P.dead, god: false, ouch: P.ouch || 0, quad: e && e.ud ? G.t + 1 : 0, look: 0, at: (P.abs || 0) >= 0.6 ? 2 : (P.abs || 0) > 0 ? 1 : 0 };
      G.face = Object.assign(G.face || {}, FS);
      for (let k = 0; k < NW; k++) {
        const has = P.has & (1 << k), x = bx + 4 + k * 26, on = P.w === k;
        E.box2d(g, x, by + 2, 24, 12, on ? '#8a6a3a' : '#3a2a1a', on ? '#e8c890' : '#5a4a3a', '#100800');
        font.draw(g, String(k + 1), x + 2, by + 4, has ? (on ? '#fff' : '#e8b84c') : '#5a4a3a');
        if (has) font.draw(g, ['JH', 'BS', 'RG', 'RJ'][k], x + 10, by + 4, on ? '#fff' : '#c8a060');
      }
      [1, 2, 3].forEach((k, i) => font.draw(g, String(Math.max(0, P.am[k] | 0)).padStart(3, ' '), bx + 112 + i * 28, by + 4, P.am[k] <= 0 ? '#7a5a3a' : '#e8b84c'));
      if (e && e.ud) font.draw(g, 'QUAD', bx + 236, by + 4, Math.floor(G.t * 4) % 2 ? '#d8a0ff' : '#fff');
      const A_ = PCG.jqArt;
      A_.jqIcon(g, 'armour', bx + 6, by + 19, G.face); A_.jqBig(g, e ? e.ar : 0, bx + 32, by + 20, '#e8b84c');
      A_.jqFace(g, bx + 110, by + 19, G.face, G.t);
      A_.jqBig(g, e ? e.hp : 0, bx + 136, by + 20, e && e.hp <= 25 ? '#ff4030' : '#e8b84c');
      const amk = ['', 'shells', 'teef', 'rokkits'][P.w];
      if (amk) { A_.jqIcon(g, amk, bx + 214, by + 19, G.face); A_.jqBig(g, P.am[P.w], bx + 240, by + 20, P.am[P.w] <= 5 ? '#ff4030' : '#e8b84c'); } else A_.jqIcon(g, 'choppa', bx + 214, by + 19, G.face);
      if (e && e.ud) { g.fillStyle = 'rgba(120,40,200,.16)'; g.fillRect(0, 0, Wd, by); }
      if (G.flash > 0) { g.fillStyle = 'rgba(255,220,120,.18)'; g.fillRect(0, 0, Wd, by); G.flash -= dt; }
      if (G.spawnFx > 0) { g.fillStyle = `rgba(200,140,255,${G.spawnFx * 0.8})`; g.fillRect(0, 0, Wd, by); G.spawnFx -= dt; }
      // crosshair, hit marker, damage arcs
      const cx = Wd >> 1, cy = mid >> 0;
      if (!P.dead && !P.spec && !input.touch) { g.fillStyle = G.hitT > G.t ? '#ff6040' : '#ffffffa0'; g.fillRect(cx - 3, cy, 2, 1); g.fillRect(cx + 2, cy, 2, 1); g.fillRect(cx, cy - 3, 1, 2); g.fillRect(cx, cy + 2, 1, 2); }
      if (!P.dead && input.touch) { g.strokeStyle = 'rgba(255,220,160,.7)'; g.lineWidth = 1; g.strokeRect(cx - 3.5, cy - 3.5, 7, 7); }
      if (G.hitT > G.t) { g.fillStyle = '#fff'; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillRect(cx + a * 4 - (a < 0 ? 1 : 0), cy + b * 4 - (b < 0 ? 1 : 0), 1, 1); g.fillRect(cx + a * 5 - (a < 0 ? 1 : 0), cy + b * 5 - (b < 0 ? 1 : 0), 1, 1); } }
      hurtArcs(g, cx, cy, Math.min(40, by * 0.3), 3);
      // frags (top right), the clock, waves, CTF
      const sc = (A.scores() || []).slice().sort((a, b) => b[2] - a[2]), myRow = sc.find(r => r[0] === me);
      const tt = input.touch ? Math.ceil(64 / ctx.scale) : 0;
      // the top-right block: frags, place (or the co-op wave), the clock
      const rl = [];
      if (myRow) { rl.push([`FRAGS ${myRow[2]}`, '#e8b84c']); if (A.mode !== 'coop') rl.push([`PLACE ${sc.indexOf(myRow) + 1}/${sc.length}`, '#c8a878']); }
      if (wd.wv) rl.push([wd.wv[0] ? `WAVE ${wd.wv[0]}/${wd.wv[1]} - ${wd.wv[2]} LEFT` : 'GET READY...', '#ffd040']);
      if (wd.left >= 0) rl.push([`${Math.floor(wd.left / 60)}:${String(wd.left % 60).padStart(2, '0')}`, wd.left <= 30 && wd.st === 'play' ? '#ff6040' : '#c8a878']);
      rl.forEach(([s, c], i) => font.draw(g, s, Wd - 4 - font.width(s), 3 + tt + i * 9, c, 1, '#000'));
      const rw = Math.max(...rl.map(([s]) => font.width(s)), 0) + 10;
      // messages: kill feed + chat (top left, like the console notify lines), centre prints
      G.feed = G.feed.filter(f => f.t > G.t);
      if (!G.over) G.feed.slice(-4).forEach((f, i) => font.draw(g, f.s.slice(0, Math.max(10, Math.floor((Wd - (i < rl.length ? rw : 0) - 6) / 6))), 2, 2 + tt + i * 9, f.chat ? '#a0ff80' : f.mine ? '#ffd860' : '#fff', 1, '#000'));
      G.msgs = G.msgs.filter(m => m.t > G.t);
      const ml = []; G.msgs.slice(-3).forEach(m => wrap(m.s.toUpperCase(), Math.floor(Wd / 6) - 2).forEach(l => ml.push(l)));
      ml.slice(-5).forEach((l, i, a) => font.center(g, l, Wd / 2, by - 12 - (a.length - 1 - i) * 9, '#ffe8a0', 1, '#000'));
      G.ann = G.ann.filter(a => a.t > G.t);
      if (!G.over) G.ann.forEach((a, i) => { const s0 = a.s.toUpperCase(), k = a.big && font.width(s0, 2) <= Wd - 8 ? 2 : 1, s = s0.slice(0, Math.floor(Wd / (6 * k)) - 1); font.center(g, s, Wd / 2, mid - 34 + i * (a.big ? 18 : 10), a.big ? '#ffd040' : '#ffe8c0', k, '#300a00'); });
      if (G.fragT > G.t) font.center(g, `YOU POOFED ${String(G.fragN).toUpperCase()}`, Wd / 2, mid + 14, '#e8b84c', 1, '#000');
      if (!P.dead && !P.spec) { const t = lookAt(); if (t && !t.mon) font.center(g, String(t.name).toUpperCase() + (t.away ? ' (AWAY)' : ''), Wd / 2, cy + 8, '#c8c8c8', 1, '#000'); }
      if (P.dead && !P.spec && !G.over) { font.center(g, P.killer && P.killer !== me ? `POOFED BY ${String(nameOfId(P.killer)).toUpperCase()}!` : 'YOU WENT POOF!', Wd / 2, mid - 6, '#ff6040', 1, '#000'); if (G.t - P.deadT > 1.5) font.center(g, input.touch ? 'PRESS FIRE TO RESPAWN' : 'CLICK OR PRESS SPACE TO RESPAWN', Wd / 2, mid + 6, '#fff', 1, '#000'); }
      if (P.spec) font.center(g, `SPECTATING ${P.free || !P.follow ? '(FREE)' : String(nameOfId(P.follow)).toUpperCase()}`, Wd / 2, by - 10, '#e8b84c', 1, '#000');
      if (!A.local) font.draw(g, `${Math.round(A.rtt())}MS${A.host ? ' HOST' : ''}`, 2, by - 9, '#8a6a4a');
      if (cfg.fps) font.draw(g, `${Math.round(1 / Math.max(dt, 0.001))} FPS`, Wd - 50, by - 9, '#8f8');
      if (G.over) { g.fillStyle = 'rgba(20,10,0,.5)'; g.fillRect(0, 0, Wd, by); }
      if (G.scoreHeld || G.over) scoreJQ(g, Wd, by, sc, wd);
    }
    function wrap(s, n) { const out = []; let line = ''; for (const w2 of String(s).split(' ')) { if ((line + ' ' + w2).trim().length > n && line) { out.push(line); line = w2; } else line = (line + ' ' + w2).trim(); } if (line) out.push(line); return out.map(l => l.slice(0, n)); }
    function scoreJQ(g, Wd, by, sc, wd) {
      const w2 = Math.min(Wd - 8, 260), x = Math.round((Wd - w2) / 2), y = 18, rows = Math.min(sc.length, Math.floor((by - 60) / 10));
      g.fillStyle = 'rgba(30,18,8,.88)'; g.fillRect(x, y, w2, 34 + rows * 10); g.strokeStyle = '#a8582a'; g.strokeRect(x + 0.5, y + 0.5, w2 - 1, 33 + rows * 10);
      font.center(g, G.over ? `${String(G.over.who).toUpperCase()} ${/^(The players|Red team|Blue team)$/.test(G.over.who) ? 'WIN' : 'WINS'}!` : M.meta.title.toUpperCase(), Wd / 2, y + 4, '#e8b84c', 1, '#000');
      font.center(g, A.mode === 'coop' ? 'CO-OP' : `FRAG LIMIT ${A.frags}`, Wd / 2, y + 13, '#a88858');
      sc.slice(0, rows).forEach((r, i) => {
        const yy = y + 24 + i * 10, ent = A.ent(r[0]), col = JQCOL[Math.abs(r[0]) % JQCOL.length], cs = '#' + col.toString(16).padStart(6, '0');
        g.fillStyle = cs; g.fillRect(x + 6, yy - 1, 24, 9); g.fillStyle = r[0] === me ? '#fff' : '#000'; g.fillRect(x + 6, yy - 1, 24, 1);
        font.draw(g, String(r[2]).padStart(3, ' '), x + 8, yy, '#fff');
        const nm = (r[1] + (r[6] ? '' : '*')).toUpperCase().slice(0, Math.floor((w2 - 90) / 6));
        font.draw(g, nm, x + 36, yy, ent && ent.away ? '#7a6a5a' : r[0] === me ? '#ffd860' : '#e8c890');
        font.draw(g, r[6] ? 'BOT' : String(r[7] || (A.local ? 0 : '?')), x + w2 - 26, yy, '#a88858');
      });
    }

    // ---------------------------------------------------------------- the end-of-match vote
    function showVote() {
      const v = A.g.vote; if (!v) return;
      if (!G.voteEl || !G.voteEl.isConnected) { G.voteEl = h('div', 'jrt-vote'); ui.appendChild(G.voteEl); ui.style.pointerEvents = 'auto'; G.voteSig = ''; input.unlock(); }
      const sig = JSON.stringify([v.opts, v.tally, v.left, v.mine]); if (sig === G.voteSig) return; G.voteSig = sig;
      G.voteEl.innerHTML = `<div class="vh">${P.spec ? 'THE PLAYERS ARE VOTING FOR THE NEXT MAP' : v.mine >= 0 ? 'THANKS FOR VOTING! CHANGE YOUR MIND ANY TIME' : 'VOTE FOR THE NEXT MAP: CLICK ONE, OR PRESS 1, 2 OR 3'}${v.left ? ` (${v.left})` : ''}</div><div class="vo">${v.opts.map((id, i) => { const mp = AR.MAPS[id] || {}; return `<button type="button" data-v="${i}" class="${v.mine === i ? 'me' : ''}">${i + 1}. ${esc(mp.title || id)}<small>by ${esc(mp.by || '?')}${id === M.id ? ' &middot; again!' : i === 0 ? ' &middot; next up' : ''}</small><small><b>${v.tally[i] || 0}</b> vote${v.tally[i] === 1 ? '' : 's'}</small></button>`; }).join('')}</div><div class="vbar"><i style="width:${Math.max(0, Math.min(100, (v.left || 0) / 15 * 100))}%"></i></div>`;
      G.voteEl.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => castVote(+b.dataset.v)));
      if (v.left && v.left <= 3 && v.left !== G.lastBeep) { G.lastBeep = v.left; sfx('count'); }
    }
    function castVote(i) { if (!A || A.local || !A.g.vote || P.spec) return; Net.send({ t: 'arVote', i }); A.g.vote.mine = i; G.voteSig = ''; sfx('vote'); }
    function closeVote() { if (G.voteEl) { G.voteEl.remove(); G.voteEl = null; } if (G.mode === 'game' && !chatBox && !ui.querySelector('.jrt-win') && !G.connEl) ui.style.pointerEvents = 'none'; }

    // ---------------------------------------------------------------- menus (DOM, "metal and gold" for JRT, rust for JAQUAKE)
    ui = document.createElement('div'); ui.className = 'jrt-ui' + (JQ ? ' jq' : ''); host.appendChild(ui);
    const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    let menuCam = 0;
    function mainMenu() {
      G.mode = 'menu'; G.paused = false; G.over = null; input.unlock(); ui.style.pointerEvents = 'auto'; ui.innerHTML = ''; closeVote();
      E.music(JQ ? 'jaquake' : 'jrt', cfg.music !== false);
      if (!A || !M) { menuBackdrop(); }
      const bar = h('div', 'jrt-bar');
      const menus = [['Game', () => [['PLAY ONLINE NOW', quick]].concat(JQ ? [] : [['Tournament Ladder', ladderDlg]]).concat([['Practice Session', practiceDlg]]).concat(JQ ? [['Back to single player', toSP]] : []).concat([['Quit', quit]])],
        ['Multiplayer', () => [['PLAY ONLINE NOW (quick match)', quick], ['Find Internet Game', () => browser('net')], ['Find LAN Game', () => browser('lan')], ['Start LAN Game', () => hostDlg(true)], ['Host Internet Game', () => hostDlg(false)], ['Rankings', rankings], ['JackSpy 3D (all games)', () => Apps.open('pcgames.spy')]]],
        ['Options', () => [['Preferences...', () => optionsDlg('game')], ['Controls...', () => optionsDlg('keys')]]],
        ['Help', () => [['Read Me', () => { const n = Apps.fs.get(JQ ? 'C:/Games/Jaquake/README.TXT' : 'C:/Games/JRT/README.TXT'); if (n) Apps.openFile(n); }], [JQ ? 'About JAQUAKE deathmatch' : 'About JRT', aboutDlg]]]];
      menus.forEach(([label, items]) => {
        const b = h('button', '', label); b.type = 'button';
        b.addEventListener('click', () => { const open = ui.querySelector('.jrt-dd'); ui.querySelectorAll('.jrt-dd').forEach(x => x.remove()); if (open && open.dataset.m === label) return; const dd = h('div', 'jrt-dd'); dd.dataset.m = label; dd.style.left = b.offsetLeft + 'px'; items().forEach(([l, fn]) => { const it = h('button', '', esc(l)); it.type = 'button'; it.addEventListener('click', () => { dd.remove(); sfx('menu'); fn(); }); dd.appendChild(it); }); ui.appendChild(dd); });
        bar.appendChild(b);
      });
      bar.appendChild(h('span', 'jv', JQ ? `JAQUAKE v${JQV} - JackNet deathmatch` : `v${VERSION}${full ? '' : ' DEMO'}`));
      ui.appendChild(bar);
      if (JQ) ui.appendChild(h('div', 'jq-logo', `<span class="spin">${LOGO.jq}</span><b>JAQUAKE</b><i>MULTIPLAYER - DEATHMATCH AND CO-OP ON JACKNET</i>`));
      else ui.appendChild(h('div', 'jrt-logo', `<span class="spin">${LOGO.jrt}</span><b>JACKREAL</b><i>TOURNAMENT</i>${full ? '' : '<s>DEMO</s>'}`));
      const mm = h('div', 'jrt-main');
      const btns = [[`PLAY ONLINE NOW<small>${JQ ? 'Jump into a JAQUAKE deathmatch on JackNet' : 'Jump into the best game on JackNet'}</small>`, quick, 'go'], ['Practice Session', practiceDlg], ['Find Internet Game', () => browser('net')]]
        .concat(JQ ? [['Co-op vs the monsters', () => quickMode('coop')], ['Rankings', rankings], ['Options', () => optionsDlg('game')], ['Back to single player', toSP]] : [['Rankings', rankings], ['Options', () => optionsDlg('game')], ['Quit', quit]]);
      if (!JQ) btns.splice(1, 0, [`Tournament Ladder<small>${(cfg.ladder | 0) >= LADDER.length ? 'Champion! Play any rung again' : `Rung ${(cfg.ladder | 0) + 1} of ${LADDER.length}: ${LADDER[Math.min(cfg.ladder | 0, LADDER.length - 1)].t}`}</small>`, ladderDlg, 'lad']);
      btns.forEach(([l, fn, cls]) => { const b = h('button', 'jrt-btn' + (cls ? ' ' + cls : ''), l); b.type = 'button'; b.addEventListener('click', () => { sfx('menu'); fn(); }); mm.appendChild(b); });
      if (!full) { const b = h('button', 'jrt-btn buy', 'BUY THE FULL GAME!'); b.type = 'button'; b.addEventListener('click', buyNag); mm.appendChild(b); }
      ui.appendChild(mm);
      ui.onclick = ev => { if (!ev.target.closest('.jrt-dd,.jrt-bar')) ui.querySelectorAll('.jrt-dd').forEach(x => x.remove()); };
      setTimeout(() => { const b = mm.querySelector('.jrt-btn'); if (b && !touch) b.focus(); }, 30);
    }
    function menuBackdrop() { // the arena slowly fly-by behind the menu
      if (G.backMap) return;
      G.backMap = true; A = null; G.mcam = null;
      ctx.clearMap(); lightC = {}; if (ctx.uDlp) ctx.uDlp.value.forEach(v => { v.w = 0; });
      const pool = JQ ? ['jqdm1', 'jqdm2'] : full ? ['castle', 'spacegrot', 'foundry', 'canyon'] : ['spacegrot', 'foundry'];
      M = AR.map(pool[Math.floor(Math.random() * pool.length)]);
      const L = M.meta.look || {};
      if (L.quake) {
        const lights = M.torches.map(t => { const off = wallSide(t); t.fl = off; return { x: off[0], y: t.y + 2.3, z: off[2], c: [1, 0.62, 0.28], i: 1.5, rad: 9.5, flick: true }; }).concat(M.lamps.map(t => ({ x: t.x, y: M.at(t.x, t.z).c - 0.4, z: t.z, c: [0.95, 0.9, 0.75], i: 1.3, rad: 12 })));
        M.cells.forEach(c => { if (c.liq === 'lava' && (c.i + c.j) % 4 === 0) lights.push({ x: (c.i + 0.5) * M.S, y: c.lv + 0.6, z: (c.j + 0.5) * M.S, c: [1, 0.45, 0.12], i: 1.1, rad: 7 }); });
        world = E.buildWorld(ctx, M, { lights, amb: L.amb, full: ['light'], shadows: false, sub: 2 });
        M.torches.forEach(t => PCG.jqArt.jqFlame(ctx, t.fl[0], t.y + 2.15, t.fl[2]));
      } else {
        world = E.buildWorld(ctx, M, utLook(M, { lights: M.flags.map(f => ({ x: f.x, y: f.y + 2.5, z: f.z, c: f.team ? [0.3, 0.45, 1] : [1, 0.3, 0.25], i: 1.4, rad: 12 })).concat(M.lights.map(l => ({ x: l.x, y: l.y + l.h, z: l.z, c: l.c, i: l.i, rad: l.rad }))), amb: L.amb || [0.55, 0.52, 0.55], sky: 'dome', lin: true, sub: 2, roof: 7, ft: L.ft || (M.id === 'spacegrot' ? 'jfloor' : 'cobble'), wt: L.wt || (M.id === 'spacegrot' ? 'jpanel' : 'cstone'), st: L.st || (M.id === 'spacegrot' ? 'jslab' : 'cstone'), ct: L.ct || 'wood', rt: L.rt || 'cstone', shadows: false }));
        ctx.scene.add(E.dome(ctx, M.meta.sky));
      }
      FX = E.fx(ctx, 50);
    }
    function menuFrame(dt) {
      if (!M) return;
      menuCam += dt * 0.06;
      const cx = M.w * M.S / 2, cz = M.h * M.S / 2, quake = M.meta.look && M.meta.look.quake;
      if (quake) { const r = Math.min(cx, cz) * 0.55; ctx.camera.position.set(cx + Math.cos(menuCam) * r, 3.2, cz + Math.sin(menuCam) * r); ctx.camera.lookAt(cx, 1.2, cz); }
      else { // a slow fly-past through the arena (not through the walls), looking across it
        let r = Math.min(cx, cz) * 0.78, x = cx, z = cz; const a = menuCam * 0.75;
        const clear = (x, z) => { for (const [ox, oz] of [[0, 0], [2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) { const c = M.at(x + ox, z + oz); if (c.s || (!c.sky && c.c - c.f < 4)) return false; } return !M.at(x, z).v; };
        for (; r > 1; r -= 0.5) { x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r * 0.8; if (clear(x, z)) break; }
        const fl = M.at(x, z), y = Math.max(fl.v ? 3 : fl.f, 0) + 2.6 + Math.sin(menuCam * 0.9) * 0.8;
        G.mcam = G.mcam || [x, y, z]; for (let k = 0; k < 3; k++) G.mcam[k] += ([x, y, z][k] - G.mcam[k]) * Math.min(1, dt * 1.5);
        ctx.camera.position.set(G.mcam[0], G.mcam[1], G.mcam[2]); ctx.camera.lookAt(cx + Math.cos(a + 2.2) * r * 0.5, 2.2, cz + Math.sin(a + 2.2) * r * 0.5); }
      VM.forEach(m => { m.visible = false; });
      ctx.setBottom(0);
      ctx.render(); ctx.hctx.clearRect(0, 0, ctx.rw, ctx.rh);
    }
    function win(title, body, buttons) {
      ui.querySelectorAll('.jrt-win').forEach(x => x.remove());
      const wd = h('div', 'jrt-win'); const t = h('h3', '', esc(title)); const x = h('button', '', 'x'); x.type = 'button'; x.title = 'Close'; x.addEventListener('click', () => { wd.remove(); if (wd.onClose) wd.onClose(); }); t.appendChild(x); wd.appendChild(t);
      const bd = h('div', 'bd'); if (typeof body === 'string') bd.innerHTML = body; else bd.appendChild(body); wd.appendChild(bd);
      const ft = h('div', 'ft'); (buttons || []).forEach(([l, fn, cls]) => { const b = h('button', 'jrt-btn' + (cls ? ' ' + cls : ''), esc(l)); b.type = 'button'; b.addEventListener('click', () => { sfx('menu'); fn(wd, b); }); ft.appendChild(b); }); wd.appendChild(ft);
      wd.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !G.keyWait) { ev.stopPropagation(); wd.remove(); if (wd.onClose) wd.onClose(); } });
      ui.appendChild(wd); ui.style.pointerEvents = 'auto'; return wd;
    }
    const modeName = m => m === 'ctf' ? 'Capture the Flag' : m === 'coop' ? 'Co-op (monster waves)' : 'DeathMatch';
    const mapOpts = sel => Object.values(AR.MAPS).filter(m => m.game === GAME).map(m => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''} ${!full && !m.demo ? 'disabled' : ''}>${esc(m.title)}${!full && !m.demo ? ' (full version only)' : ''}</option>`).join('');
    const modeOpts = (mapId, sel) => ((AR.MAPS[mapId] || {}).modes || ['dm']).map(m => `<option value="${m}" ${m === sel ? 'selected' : ''}>${modeName(m)}</option>`).join('');
    const setupForm = (o, isHost) => `
      ${isHost ? `<div class="row"><label>Server name</label><input type="text" name="name" maxlength="32" value="${esc(o.sname)}"></div>` : ''}
      <div class="row"><label>Map</label><select name="map">${mapOpts(o.map)}</select></div>
      <div class="row"><label>Game type</label><select name="mode">${modeOpts(o.map, o.mode)}</select></div>
      <div class="row"><label>Bots</label><select name="bots">${[0, 1, 2, 3, 4, 5, 6, 7].map(n => `<option ${n === o.bots ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="row"><label>Bot skill</label><select name="skill"><option value="-1" ${o.skill < 0 ? 'selected' : ''}>The usual suspects (mixed - Callum is GODLIKE)</option>${SKILLS.map((s, i) => `<option value="${i}" ${o.skill === i ? 'selected' : ''}>${s}${['  (gentle)', '  (recommended)', '', '', '  (Callum\'s level)'][i]}</option>`).join('')}</select></div>
      <div class="row"><label>Frag limit</label><select name="frags">${[5, 10, 15, 20, 25, 30].map(n => `<option ${n === o.frags ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <p class="note">${JQ ? 'Deathmatch maps: DM1 The Rusty Pit and DM2 Jackstone Cloisters. Co-op: you and the bots against six waves of monsters.' : full ? 'Callum is always in the bot list. From Skilled up he plays one level above everybody else. He says that\'s "only fair". New to this? Novice or Average bots are a good start.' : 'DEMO: Space Station Jack and Coax Foundry. Castle Jackstone and Coax Canyon are in the full game (out 22 November 1999).'}</p>`;
    const readForm = el => { const f = n => el.querySelector(`[name=${n}]`); return { map: f('map').value, mode: f('mode').value, bots: +f('bots').value, skill: +f('skill').value, frags: +f('frags').value, name: f('name') ? f('name').value : '' }; };
    const wireForm = el => { const ms = el.querySelector('[name=map]'), md = el.querySelector('[name=mode]'); if (ms && md) ms.addEventListener('change', () => { md.innerHTML = modeOpts(ms.value, md.value); }); };
    // ---- the Tournament Ladder (JRT): climb from Dave to Callum, one match at a time. Your rung is saved.
    const LADDER = [
      { map: 'spacegrot', mode: 'dm', frags: 8, list: [['Dave', 0], ['Dial-Up Dan', 0]], t: 'Warm-up', b: 'Dave and Dial-Up Dan. Both Novices. Dave still thinks this is Goldenballs.' },
      { map: 'foundry', mode: 'dm', frags: 10, list: [['Luke', 1], ['Lagmonster', 0], ['Spudgun', 1]], t: 'The Foundry', b: 'Three of them now. Luke has one hand on the mouse and one in the crisps.' },
      { map: 'spacegrot', mode: 'ctf', frags: 15, list: [['Jumping Jack', 1], ['Dave', 1], ['Nan\'s Cat', 1], ['Spudgun', 1], ['Luke', 1]], t: 'Capture the Flag', b: 'You and two bots against three. First team to three captures wins. Stick with your flag carrier!' },
      { map: 'castle', mode: 'dm', frags: 12, list: [['Jack Frost', 2], ['Jack-in-the-Box', 1], ['Y2K Bug', 2], ['Nan\'s Cat', 1]], t: 'Castle Jackstone', b: 'Four bots in a crumbly castle. The Y2K Bug says your clock is wrong.' },
      { map: 'canyon', mode: 'ctf', frags: 15, list: [['JackK', 2], ['Jack Frost', 2], ['Luke', 2], ['Y2K Bug', 2], ['Jumping Jack', 2]], t: 'Coax Canyon CTF', b: 'Skilled bots, a very long drop and one wobbly bridge.' },
      { map: 'foundry', mode: 'dm', frags: 10, list: [['Callum', 3]], t: 'FINAL: Callum', b: 'One on one with Callum. He is set to Masterful, not Godlike. (Do NOT tell him.)' },
    ];
    const rungOk = r => full || (AR.MAPS[r.map] || {}).demo;
    function ladderDlg() {
      const done = cfg.ladder | 0;
      const body = h('div', '', `<p class="note" style="margin:0 0 6px">Beat each match to unlock the next. ${done >= LADDER.length ? '<b style="color:#ffd860">You beat Callum! You are the JRT champion of 1999.</b>' : `You are on rung ${Math.min(done + 1, LADDER.length)} of ${LADDER.length}.`}</p><div class="jrt-lad">${LADDER.map((r, i) => {
        const mp = AR.MAPS[r.map] || {}, ok = rungOk(r), open = i <= done && ok, st = i < done ? '<b class="ok">BEATEN</b>' : i === done ? (ok ? '<b class="nx">NEXT</b>' : '<b>FULL GAME</b>') : '<b>LOCKED</b>';
        return `<div class="rg ${open ? '' : 'lk'}"><div class="rn">${i + 1}</div><div class="rt"><b>${esc(r.t)}</b> - ${esc(mp.title || r.map)}, ${r.mode === 'ctf' ? 'Capture the Flag' : `DeathMatch to ${r.frags}`}<small>${esc(r.b)}<br>vs ${r.list.map(([n, k]) => `${esc(n)} (${SKILLS[k]})`).join(', ')}</small></div><div class="rs">${st}${open ? `<button type="button" class="jrt-btn" data-r="${i}">Play</button>` : ''}</div></div>`; }).join('')}</div>${full ? '' : '<p class="note">The DEMO has the Space Station and Foundry rungs. Castle Jackstone and Coax Canyon come with the full game on 22 November 1999.</p>'}`);
      const wd = win('Tournament Ladder', body, [['Close', w2 => w2.remove()]]);
      body.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { sfx('menu'); playRung(+b.dataset.r); }));
      return wd;
    }
    function playRung(i) { const r = LADDER[i]; if (!r || !rungOk(r)) return; go(localArena({ map: r.map, mode: r.mode, frags: r.frags, bots: r.list.length, skill: -1, list: r.list, rung: i })); }
    function ladderEnd(won) {
      if (G.closed || G.ladder == null || !A || !A.local) return;
      const i = G.ladder, last = i >= LADDER.length - 1, next = LADDER[i + 1];
      win(won ? (last ? 'CHAMPION!' : 'Rung beaten!') : 'Not this time', `<p>${won ? (last ? '<b>You beat Callum!</b> He says the mouse was broken. You are the Jackreal Tournament champion of 1999.' : `<b>${esc(LADDER[i].t)}</b>: done! Next up: <b>${esc(next.t)}</b>.${rungOk(next) ? '' : ' (That one is in the full game, out 22 November 1999.)'}`) : 'Have another go. Tip: grab a better gun than the pistol, and keep moving.'}</p>`,
        [].concat(won && next && rungOk(next) ? [['Next match', w2 => { w2.remove(); playRung(i + 1); }, 'go']] : [['Try again', w2 => { w2.remove(); playRung(i); }, won ? '' : 'go']]).concat([['The Ladder', w2 => { w2.remove(); leaveMatch(); setTimeout(ladderDlg, 50); }], ['Main menu', w2 => { w2.remove(); leaveMatch(); }]]));
      input.unlock();
    }
    function practiceDlg() {
      const wd = win(JQ ? 'Practice Deathmatch' : 'Practice Session', setupForm(pset, false), [['Start', wd2 => { const o = readForm(wd2); Object.assign(pset, o); save(); if (!full && !(AR.MAPS[o.map] || {}).demo) o.map = 'spacegrot'; go(localArena(o)); }], ['Cancel', wd2 => wd2.remove()]]);
      wireForm(wd);
      return wd;
    }
    function go(a) { G.backMap = false; ui.innerHTML = ''; G.paused = false; startMatch(a); }
    function hostDlg(lan) {
      if (!window.Net || !Net.connected) return win('Network', '<p>You are not connected to JackNet. Check your modem cable (and that your Mom isn\'t on the phone).</p>', [['OK', w2 => w2.remove()]]);
      const o = Object.assign({}, pset, { sname: lan ? `${myName()}'s LAN party` : `${myName()}'s Frag Shack` });
      const wd = win(lan ? 'Start LAN Game' : 'Host Internet Game', setupForm(o, true) + `<p class="note">${lan ? 'LAN games only show up for computers on your network (your house). Callum says to use coax, not "the wireless".' : 'Your game will be listed on the master server for everyone on JackNet to find.'}</p>`, [['Start', wd2 => { const f = readForm(wd2); Object.assign(pset, { map: f.map, mode: f.mode, bots: f.bots, skill: f.skill, frags: f.frags }); save(); if (!full && !(AR.MAPS[f.map] || {}).demo) f.map = 'spacegrot'; connecting('Starting your server...'); Net.send({ t: 'arHost', map: f.map, mode: f.mode, name: f.name, lan, bots: f.bots, skill: f.skill, frags: f.frags, full }); }], ['Cancel', wd2 => wd2.remove()]]);
      wireForm(wd);
    }
    // quick match: the server picks the busiest game with room for you (or a [JackNet] 24/7 server, which starts with bots)
    function quick() { quickMode(null); }
    function quickMode(mode) {
      if (!window.Net || !Net.connected) return win('Network', '<p>You are not connected to JackNet. Check your modem cable (and that your Mom isn\'t on the phone).</p>', [['OK', w2 => w2.remove()]]);
      connecting(mode === 'coop' ? 'Looking for a co-op game...' : 'Finding the best server for you...');
      Net.send({ t: 'arQuick', game: GAME, full, mode: mode || undefined });
    }
    const MODEM = ['ATDT 0845 JACKNET', 'CONNECT 56000', 'Handshaking with the master server...', 'Pinging servers...', 'Joining...'];
    function connecting(text) {
      closeConn();
      const c = h('div', 'jrt-conn', `<div>${esc(text)}</div><div class="prog" style="width:200px"><span style="display:flex;gap:2px"></span></div><div class="mdm"></div><button type="button" class="jrt-btn">Cancel</button>`);
      ui.appendChild(c); ui.style.pointerEvents = 'auto'; G.connEl = c;
      const bar = c.querySelector('.prog span'), md = c.querySelector('.mdm'); let k = 0;
      G.connIv = setInterval(() => { if (k < 18) bar.appendChild(document.createElement('i')); md.textContent = MODEM[Math.min(MODEM.length - 1, Math.floor(k / 4))]; k++; if (k > 60) { closeConn(); status('The server did not answer. Try again!'); } }, 120);
      c.querySelector('button').addEventListener('click', () => { closeConn(); G.joinCancel = performance.now(); });
      sfx('menu');
    }
    function closeConn() { clearInterval(G.connIv); if (G.connEl) { G.connEl.remove(); G.connEl = null; } }
    function status(s) { const st = ui.querySelector('.jrt-st'); if (st) st.textContent = s; else if (G.mode === 'menu') { const w2 = ui.querySelector('.jrt-win .bd'); if (w2) { const p = h('div', 'jrt-st', esc(s)); w2.appendChild(p); } else win('JackNet', `<p>${esc(s)}</p>`, [['OK', x => x.remove()]]); } }
    // the server browser (JackSpy 3D Lite)
    const DEAD = JQ ? [['=JAQUAKE= Clan Rusty Pit 24/7', 'DM1: The Rusty Pit', 'dm', '16/16', 380, 'Server is full. It is always full. The clan never sleeps.'], ['Dial-Up Dan\'s JQ Box', 'DM2: Jackstone Cloisters', 'dm', '0/4', 999, 'Connection timed out. (His Mom needed the phone.)'], ['JAQUAKE 1.05 test - do not join', 'DM1: The Rusty Pit', 'dm', '1/8', 140, 'Version mismatch: server needs 1.05, you have 1.06.']]
      : [['[UK] Callum\'s Old Server', 'Castle Jackstone', 'ctf', '0/8', 999, 'His Mom switched it off at 10pm.'], ['=FrAgZ= 24/7 Space Station', 'Space Station Jack', 'dm', '8/8', 412, 'Server is full. It has been full since August.'], ['Dial-Up Dan\'s Basement', 'Space Station Jack', 'dm', '1/4', 999, 'Connection timed out. (Somebody picked up the phone.)'], ['JRT 4.04 test server - DO NOT JOIN', 'Castle Jackstone', 'dm', '2/16', 187, 'Version mismatch: server needs 4.04, you have 4.05.']];
    let brTab = 'net', brSel = null, brList = [], brF = Object.assign({ empty: false, fullS: false, mode: '' }, store.get('jhp_pcg_brf', {}));
    function browser(tab) {
      brTab = tab || brTab; brSel = null;
      const body = h('div', '', `<div class="jrt-tabs"><button type="button" data-t="net">Internet</button><button type="button" data-t="lan">LAN</button></div>
        <div class="jrt-filt"><label class="chk"><input type="checkbox" data-f="empty" ${brF.empty ? 'checked' : ''}>Hide empty</label><label class="chk"><input type="checkbox" data-f="fullS" ${brF.fullS ? 'checked' : ''}>Hide full</label><label class="chk">Type <select data-f="mode" style="min-height:22px;flex:none;min-width:0"><option value="">All</option><option value="dm" ${brF.mode === 'dm' ? 'selected' : ''}>DeathMatch</option>${JQ ? `<option value="coop" ${brF.mode === 'coop' ? 'selected' : ''}>Co-op</option>` : `<option value="ctf" ${brF.mode === 'ctf' ? 'selected' : ''}>CTF</option>`}</select></label></div>
        <div class="jrt-list"><table><thead><tr><th>Server</th><th>Map</th><th>Players</th><th>Ping</th><th>Mode</th></tr></thead><tbody></tbody></table></div><div class="jrt-pl"></div><div class="jrt-st"></div>`);
      const wd = win(`JackSpy 3D Lite - Find ${brTab === 'lan' ? 'LAN' : 'Internet'} Game`, body, [['Refresh', () => refresh()], ['Join', () => joinSel(false), 'go'], ['Spectate', () => joinSel(true)], ['Quick Match', quick], ['Close', w2 => w2.remove()]]);
      const jb = [...wd.querySelectorAll('.ft .jrt-btn')].find(b => b.textContent === 'Join'); if (jb) { jb.style.animation = 'none'; jb.style.fontSize = '12px'; jb.style.minHeight = '30px'; }
      const tbd = body.querySelector('tbody'), rowId = tr => tr && tr.dataset.id ? (/^d/.test(tr.dataset.id) ? tr.dataset.id : +tr.dataset.id) : null;
      tbd.addEventListener('click', ev => { const id = rowId(ev.target.closest('tr')); if (id != null) { brSel = id; tbd.querySelectorAll('tr').forEach(tr => tr.classList.toggle('sel', rowId(tr) === id)); brInfo(); } });
      tbd.addEventListener('dblclick', ev => { const id = rowId(ev.target.closest('tr')); if (id != null) { brSel = id; joinSel(false); } });
      body.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', b.dataset.t === brTab); b.addEventListener('click', () => { brTab = b.dataset.t; body.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); draw(); refresh(); }); });
      body.querySelectorAll('[data-f]').forEach(el => el.addEventListener('change', () => { brF[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; store.set('jhp_pcg_brf', brF); draw(); }));
      refresh();
      return wd;
    }
    function refresh() {
      if (!window.Net || !Net.connected) { status('Not connected to JackNet. Is the modem plugged in?'); return; }
      status(brTab === 'lan' ? 'Looking for LAN games (broadcasting on the coax)...' : 'Querying the master server... (this is the bit where you make a cup of tea)');
      G.listT = performance.now(); Net.send({ t: 'arList' });
    }
    function draw() {
      const tb2 = ui.querySelector('.jrt-list tbody'); if (!tb2) return;
      const rows = brList.filter(g => g.game === GAME && (brTab === 'lan' ? g.lan : !g.lan) && !(brF.empty && !g.n) && !(brF.fullS && g.n >= g.max) && !(brF.mode && g.mode !== brF.mode));
      const rtt = G.listRtt || 80;
      tb2.innerHTML = '';
      rows.forEach(g => {
        const fullOnly = !full && AR.MAPS[g.map] && !AR.MAPS[g.map].demo;
        const pl = g.st === 'idle' ? `0/${g.max} <span style="color:#7a9a7a">(bots ready)</span>` : `${g.n}/${g.max}${g.b ? ` +${g.b} bots` : ''}${g.sp ? ` [${g.sp} watching]` : ''}`;
        const tr = h('tr', brSel === g.id ? 'sel' : '', `<td class="nm">${g.pub ? `<span class="pub">${esc(g.name)}</span>` : esc(g.name)}${g.n ? '<span class="live">LIVE</span>' : ''}${fullOnly ? ' <span style="color:#c86">(full game)</span>' : ''}</td><td>${esc(AR.MAPS[g.map] ? AR.MAPS[g.map].title : g.map)}</td><td>${pl}</td><td>${Math.round(g.pub ? rtt + 6 : rtt / 2 + g.ping / 2 + 18)}</td><td>${g.mode === 'ctf' ? 'CTF' : g.mode === 'coop' ? 'Co-op' : 'DM'}</td>`);
        tr.dataset.id = g.id; tb2.appendChild(tr);
      });
      if (brTab === 'net' && !brF.empty && !brF.mode) DEAD.forEach((d, i) => { const tr = h('tr', 'dead' + (brSel === 'd' + i ? ' sel' : ''), `<td class="nm">${esc(d[0])}</td><td>${esc(d[1])}</td><td>${d[3]}</td><td>${d[4]}</td><td>${d[2].toUpperCase()}</td>`); tr.dataset.id = 'd' + i; tb2.appendChild(tr); });
      if (!rows.length) { const tr = h('tr', 'dead', `<td colspan="5">${brTab === 'lan' ? 'No LAN games found. Is the hub plugged in? Is the BNC terminatater on? Start one!' : 'Nothing matches your filters. Untick a box, or press Quick Match!'}</td>`); tb2.insertBefore(tr, tb2.firstChild); }
      brInfo();
    }
    function brInfo() {
      const pl = ui.querySelector('.jrt-pl'), sel = brList.find(x => x.id === brSel);
      if (pl) pl.innerHTML = sel ? `<b>${esc(sel.name)}</b>: ${sel.st === 'idle' ? 'nobody on yet. Join and the bots will start a match with you straight away.' : esc((sel.players || []).join(', ') || 'warming up...')}${sel.left > 0 ? ` &middot; ${Math.floor(sel.left / 60)}:${String(sel.left % 60).padStart(2, '0')} left` : ''}${sel.st === 'vote' ? ' &middot; voting for the next map' : ''}` : 'Pick a server to see who\'s on it. Double-click to join.';
    }
    function joinSel(spec) {
      if (brSel == null) { status('Pick a server first.'); return; }
      if (typeof brSel === 'string') { const d = DEAD[+brSel.slice(1)]; status('Connection failed: ' + d[5]); sfx('talk'); return; }
      const g = brList.find(x => x.id === brSel); if (!g) return;
      if (!full && AR.MAPS[g.map] && !AR.MAPS[g.map].demo && !g.pub) { status('That server is running a map from the FULL game. The demo only has Space Station Jack and Coax Foundry.'); return; }
      connecting('Connecting to ' + g.name + '...'); G.joinSpec = !!spec; Net.send({ t: 'arJoin', id: g.id, spec: !!spec });
    }
    function rankings() {
      const body = h('div', 'jrt-rk', `<div class="jrt-tabs"><button type="button" data-r="wk" class="on">This week</button><button type="button" data-r="all">All time</button><button type="button" data-r="prev">Last week</button></div><div class="rkb">Asking the JackNet master server...</div><p class="note">Frags against anybody (bots too) on JackNet. Members only: <b>join JackNet for FREE</b> to get on the board. The weekly table starts again every Monday.</p>`);
      let tab = 'wk';
      const wd = win(JQ ? 'JAQUAKE Rankings' : 'JRT Rankings', body, [['Refresh', () => Net.send({ t: 'arTop' })], ['Close', w2 => w2.remove()]]);
      const paint = () => {
        const d = G.top, el = body.querySelector('.rkb'); if (!el) return;
        if (!d) { el.textContent = window.Net && Net.connected ? 'Asking the JackNet master server...' : 'Not connected to JackNet.'; return; }
        const rows = tab === 'prev' ? (d.prev ? d.prev[GAME] || [] : []) : (d[tab] || {})[GAME] || [];
        const meN = d.member && Net.me ? Net.me.nick : '';
        el.innerHTML = rows.length ? `<table><tr><th>#</th><th>Name</th><th>Frags</th><th>Deaths</th><th>Wins</th><th>Matches</th><th>Best spree</th></tr>${rows.map((r, i) => `<tr class="${r[0] === meN ? 'me' : ''} ${i === 0 ? 'n1' : ''}"><td>${i + 1}</td><td>${window.Grind && Grind.badge ? Grind.badge(Grind.rankOf(r[0])) + ' ' : ''}${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</table>`
          : `<p>${tab === 'prev' ? 'No table for last week yet.' : 'Nobody on the board yet. Get fragging!'}</p>`;
        const mine = d.me && (tab === 'all' ? d.me[GAME] : d.me['w' + GAME]);
        if (mine && tab !== 'prev') el.innerHTML += `<p class="note">You: ${mine.f | 0} frags, ${mine.d | 0} deaths, ${mine.w | 0} wins, best spree ${mine.s | 0}.</p>`;
      };
      body.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.r; body.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); paint(); }));
      G.paintTop = paint; paint();
      if (window.Net && Net.connected) Net.send({ t: 'arTop' });
      return wd;
    }
    G.onNet = m => {
      if (G.closed) return;
      if (m.t === 'arList') { G.listRtt = performance.now() - (G.listT || performance.now()); brList = m.games || []; draw(); const n = brList.filter(g => g.game === GAME && (brTab === 'lan' ? g.lan : !g.lan)).length; status(`${n} server${n === 1 ? '' : 's'} found. ${brTab === 'net' ? DEAD.length + ' not responding.' : ''}`); return; }
      if (m.t === 'arTop') { G.top = m; if (G.paintTop) G.paintTop(); return; }
      if (m.t === 'arErr') { closeConn(); status(m.msg); if (G.mode === 'game') say(m.msg, 4); return; }
      if (m.t === '_lost') { if (A && !A.local && G.mode === 'game') say('Connection to the server lost! Redialling...', 4); return; }
      if (m.t === '_rejoin') { if (A && !A.local && (G.mode === 'game' || G.mode === 'loading') && A.g) { Net.send({ t: 'arJoin', id: A.g.id, spec: !!A.spec }); say('Reconnected. Back in the game!', 3); } return; }
      if (m.t === 'arLeft') { if (m.why && A && !A.local) { A = null; leaveMatch(true); win('Disconnected', `<p>${esc(m.why)}</p>`, [['OK', w2 => w2.remove()]]); } return; }
      if (m.t === 'arJoined' && A && !A.local && (G.mode === 'game' || G.mode === 'loading') && A.g && A.g.id === m.g.id && !!m.g.spec === !!A.spec) { netG(m.g); return; }
      if (m.t === 'arJoined') {
        if (G.joinCancel && performance.now() - G.joinCancel < 8000) { G.joinCancel = 0; Net.send({ t: 'arLeave' }); return; }
        closeConn(); if (A && A.local && G.mode === 'game') A.leave();
        const a = netArena(m.g); a.host = m.g.host === m.g.you; a.spec = !!m.g.spec; go(a); sfx('join'); Apps.secret('fps.online'); return;
      }
      if (!A || A.local) return;
      if (m.t === 'arG') { netG(m.g); return; }
      if (m.t === 'arS' || m.t === 'arPong') A.recv(m);
    };
    // new game info: maybe a new host, maybe a new match (and maybe a new map)
    function netG(g) {
      const old = A.g || {};
      A.recv({ t: 'arG', g });
      if (g.match !== old.match && G.mode === 'game') {
        closeVote();
        if (g.map !== M.id) { A.map = g.map; A.mode = g.mode; startMatch(A); return; }
        G.over = null; P.dead = true; P.deadT = G.t - 2; projs.forEach(p => { p.dead = true; ctx.scene.remove(p.m); }); projs = []; grab();
      }
      if (g.vote && G.over) { G.voteSig = ''; showVote(); } else if (!g.vote) closeVote();
      syncBots();
    }
    function optionsDlg(tab) {
      tab = tab || 'game';
      const body = h('div', '', `<div class="jrt-tabs"><button type="button" data-o="game">Game</button><button type="button" data-o="video">Video</button><button type="button" data-o="keys">Controls</button></div><div class="ob"></div>`);
      const st = Object.assign({}, cfg);
      const paint = () => {
        body.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('on', b.dataset.o === tab));
        const ob = body.querySelector('.ob');
        if (tab === 'game') ob.innerHTML = `
          <div class="row"><label>Mouse speed</label><select name="sens">${[0.3, 0.4, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3, 4].map(v => `<option ${v === st.sens ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="row"><label>Invert mouse</label><select name="inv"><option value="0">No</option><option value="1" ${st.invert ? 'selected' : ''}>Yes (flight sim style)</option></select></div>
          <div class="row"><label>Weapon bob</label><select name="bob"><option value="1">On</option><option value="0" ${st.bob === false ? 'selected' : ''}>Off (less wobbly)</option></select></div>
          <div class="row"><label>Menu music</label><select name="mus"><option value="1">On (needs JackOS sound on)</option><option value="0" ${st.music === false ? 'selected' : ''}>Off</option></select></div>
          ${JQ ? '' : `<div class="row"><label>HUD colour</label><select name="hudc">${Object.keys(HUDC).map(k => `<option value="${k}" ${k === (st.hudc || 'blue') ? 'selected' : ''}>${k[0].toUpperCase() + k.slice(1)}</option>`).join('')}</select></div>
          <div class="row"><label>Crosshair</label><select name="xhair">${['Cross', 'Dot', 'Ring and dot', 'Corners', 'Big cross'].map((n, i) => `<option value="${i}" ${i === (st.xhair | 0) ? 'selected' : ''}>${n}</option>`).join('')}</select><select name="xhc" style="flex:0 1 120px"><option value="green">Green</option><option value="hud" ${st.xhc === 'hud' ? 'selected' : ''}>HUD colour</option></select></div>
          <div class="row"><label>Announcer voice</label><select name="voice"><option value="1">On (uses your PC's speech, if it has any)</option><option value="0" ${st.voice === false ? 'selected' : ''}>Off (just the writing)</option></select></div>`}
          <div class="row"><label>Auto-fire</label><select name="auto"><option value="1">On: fire when someone is in your sights</option><option value="0" ${!st.autofire ? 'selected' : ''}>Off</option></select></div>
          <div class="row"><label>Practice name</label><input type="text" name="nm" maxlength="16" value="${esc(st.name || myName())}"></div>
          <p class="note">Online you play as your JackNet name (${esc(myName())}). Auto-fire is for the on-screen sticks. Sound effects follow the JackOS SFX setting.</p>`;
        else if (tab === 'video') ob.innerHTML = `
          <div class="row"><label>Field of view</label><select name="fov">${[75, 80, 90, 95, 100, 110, 120].map(v => `<option ${v === st.fov ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="row"><label>Detail</label><select name="res">${(JQ ? [[150, 'Chunky (486)'], [200, 'Normal (Pent-Yum)'], [240, 'High'], [300, 'Ultra (Callum\'s PC)']] : [[240, 'Low (Dave\'s PC)'], [300, 'Medium'], [400, 'High'], [600, 'Ultra (Callum\'s PC)']]).map(([v, l]) => `<option value="${v}" ${v === st.res ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="row"><label>Show frame rate</label><select name="fps"><option value="0">No</option><option value="1" ${st.fps ? 'selected' : ''}>Yes</option></select></div>
          <p class="note">Lower detail runs faster on slower PCs (and phones). Callum runs Ultra. Of course he does.</p>`;
        else { ob.innerHTML = `<div class="jrt-keys">${binds.ACT.map(([k, n]) => `<span>${esc(n)}</span><button type="button" data-k="${k}">${esc(binds.label(k))}</button>`).join('')}</div><p class="note">Click a box, then press the new key (or click a mouse button). Weapons are always 1 to ${NW}, and the mouse wheel.</p><button type="button" class="jrt-btn" data-reset>Reset to defaults</button>`;
          ob.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); if (G.keyWait) G.keyWait.done(); b.classList.add('wait'); b.textContent = 'Press a key...'; host.focus();
            const mdn = e2 => { if (e2.target === b) return; e2.preventDefault(); binds.set(b.dataset.k, 'Mouse' + e2.button); save(); finish(); };
            const finish = () => { window.removeEventListener('mousedown', mdn, true); G.keyWait = null; paint(); };
            setTimeout(() => window.addEventListener('mousedown', mdn, true), 50);
            G.keyWait = { act: b.dataset.k, done: finish }; }));
          ob.querySelector('[data-reset]').addEventListener('click', () => { binds.reset(); save(); paint(); }); }
      };
      const read = () => { const f = n => { const e = body.querySelector(`[name=${n}]`); return e ? e.value : null; };
        if (f('sens') != null) { st.sens = +f('sens'); st.invert = f('inv') === '1'; st.bob = f('bob') === '1'; st.autofire = f('auto') === '1'; st.music = f('mus') === '1'; st.name = (f('nm') || '').replace(/[^\w \-!.?']/g, '').slice(0, 16); if (f('hudc') != null) { st.hudc = f('hudc'); st.xhair = +f('xhair'); st.xhc = f('xhc'); st.voice = f('voice') === '1'; } }
        if (f('fov') != null) { st.fov = +f('fov'); st.res = +f('res'); st.fps = f('fps') === '1'; } };
      body.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { read(); tab = b.dataset.o; paint(); }));
      paint();
      const wd = win('Options', body, [['OK', w2 => { read(); Object.assign(cfg, { sens: st.sens, invert: st.invert, bob: st.bob, autofire: st.autofire, music: st.music, name: st.name, fov: st.fov, res: st.res, fps: st.fps, hudc: st.hudc, xhair: st.xhair, xhc: st.xhc, voice: st.voice }); save(); if (G.mode === 'menu') E.music(JQ ? 'jaquake' : 'jrt', cfg.music !== false); ctx.res = cfg.res; ctx.fovH = cfg.fov; ctx.resize(); w2.remove(); }], ['Cancel', w2 => w2.remove()]]);
      return wd;
    }
    function aboutDlg() {
      if (JQ) return win('About JAQUAKE deathmatch', `<p><b>JAQUAKE</b> v${JQV} (shareware) - JackNet deathmatch and co-op.<br>Jackware Software, 1999.</p><p>Deathmatch in DM1: The Rusty Pit and DM2: Jackstone Cloisters, plus co-op against six waves of tin robots, imps and slime blobs. Nothing bleeds. Everything goes POOF. Mom checked.</p><p>Netcode by Jack, tested over Callum's 56K modem while his Mom was on the phone.</p>`, [['OK', w2 => w2.remove()]]);
      win('About Jackreal Tournament', `<p><b>JACKREAL TOURNAMENT</b> v${VERSION}${full ? '' : ' (demo)'}<br>Wiggly Megagames, 1999.</p><p>Engine: JackEngine 2 (it's Jaquake's engine with the brightness turned up).<br>Bots: Callum, JackK, Luke, Dave and some made-up ones.<br>Tested at Callum's LAN party. Dave cried. Luke asked if it was on the ULTRA 64. It is not on the ULTRA 64.</p>`, [['OK', w2 => w2.remove()]]);
    }
    function gameMenu() {
      if (G.mode !== 'game' || G.over) return;
      G.paused = true; input.unlock(); ui.style.pointerEvents = 'auto';
      const wd = win(A.local ? (JQ ? 'Practice (paused)' : 'Practice Session (paused)') : 'Game Menu', `<p style="margin:0">${A.local ? 'The bots have stopped to wait for you. They are polite like that.' : 'The game keeps going while you\'re in here! Hurry up!'}</p>`, [
        ['Resume', w2 => { w2.remove(); resume(); }],
        ['Scores', () => { G.scoreHeld = !G.scoreHeld; }],
        ['Options', () => optionsDlg('game')],
        [A.local ? 'End Practice' : 'Disconnect', () => { leaveMatch(); }],
        ['Quit', () => quit()],
      ]);
      wd.onClose = resume;
      return wd;
    }
    function resume() { G.paused = false; ui.style.pointerEvents = 'none'; ui.querySelectorAll('.jrt-win').forEach(x => x.remove()); grab(); }
    function leaveMatch(silent) { if (A && !silent) A.leave(); A = null; bots = []; mons = new Map(); views = new Map(); G.backMap = false; VM.forEach(m => { m.visible = false; }); mainMenu(); }
    function buyNag() {
      Apps.secret('fps.nag');
      win('Buy the full game!', `<p><b>JACKREAL TOURNAMENT</b> comes out on <b>22 November 1999</b>! In all good software shops, and some bad ones.</p><p>The full game has Castle Jackstone, Coax Canyon, Capture the Flag on every map, and Callum's favourite map (he won't say which).</p><p>Price: £34.99. That's about 18 weeks of pocket money. Or ask for it for Christmas.</p>`, [['Pester Mom', w2 => { w2.remove(); Desk.msgbox('Mom', 'Mom says: "We\'ll see." (That means probably, if your room is tidy.)', 'info'); }], ['OK', w2 => w2.remove()]]);
    }
    function toSP() { if (env && env.toSP) { G.close(); env.toSP(); } }
    function quit() {
      if (G.quitting) return;
      if (!full && G.mode !== 'nag' && !JQ) {
        G.mode = 'nag'; input.unlock(); if (A) { A.leave(); A = null; }
        ui.innerHTML = ''; ui.style.pointerEvents = 'auto';
        const n = h('div', 'jrt-nag', `<h2>THANKS FOR PLAYING THE DEMO!</h2><p>Jackreal Tournament is out on <b>22 November 1999</b>.<br>Four maps. Capture the Flag. Callum. What more could you want?</p>`);
        const b1 = h('button', 'jrt-btn buy', 'Buy it! (ask Mom)'), b2 = h('button', 'jrt-btn', 'Quit'); b1.type = b2.type = 'button';
        b1.addEventListener('click', () => { buyNag(); }); b2.addEventListener('click', () => { G.quitting = true; w.close(); });
        n.appendChild(b1); n.appendChild(b2); ui.appendChild(n);
        setTimeout(() => { if (!G.closed && G.mode === 'nag' && !ui.querySelector('.jrt-win')) { G.quitting = true; w.close(); } }, 9000);
        return;
      }
      G.quitting = true; w.close();
    }

    // ---------------------------------------------------------------- start up and clean up
    host.addEventListener('pointerdown', () => { if (G.mode === 'game' && !G.paused) G.ignoreFire = Math.max(G.ignoreFire || 0, G.t + (document.pointerLockElement === host ? 0 : 0.25)); }, true);
    buildVM();
    muz = E.muzzle(ctx);
    ctx.mbag = [];
    const loopH = E.loop(w, step);
    const onResize = () => ctx.resize();
    window.addEventListener('resize', onResize);
    const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null; if (ro) ro.observe(host);
    mainMenu();
    // saved game (js/gamesave.js): a Practice Session in progress (the settings and everybody's frags, deaths and flag
    // caps) carries on, paused at the game menu, after a refresh or a closed window. Online games are live: never saved.
    const jsv = !JQ && Apps.gameSaver ? Apps.gameSaver('pcgames.jrt', () => {
      if (A && !A.local) return undefined;
      if (!A || !A.R || A.R.state !== 'play' || G.mode !== 'game' || !G.practiceO) return null;
      return { o: G.practiceO, ents: [...A.R.E.entries()].filter(([, e]) => !e.mon).map(([id, e]) => [id, e.frags | 0, e.deaths | 0, e.caps | 0]), ts: A.R.ts.slice() };
    }, { v: 1, live: true, every: 10000 }).watch(w) : null;
    const jsd = arg !== 'practice' && jsv && !(arg && typeof arg === 'object') ? jsv.load() : null;
    if (arg === 'practice') go(localArena(Object.assign({}, pset, full ? {} : { map: (AR.MAPS[pset.map] || {}).demo ? pset.map : 'spacegrot' })));
    else if (arg && typeof arg === 'object' && arg.go) setTimeout(() => G.runArg(arg), 400); // from JackSpy 3D, or JAQUAKE's menu
    else if (jsd && jsd.o && AR.MAPS[jsd.o.map] && Array.isArray(jsd.ents)) {
      try {
        go(localArena(Object.assign({}, pset, jsd.o, full ? {} : { map: (AR.MAPS[jsd.o.map] || {}).demo ? jsd.o.map : 'spacegrot' })));
        jsd.ents.forEach(([id, f, d, c]) => { const e = A.R.E.get(id); if (e) { e.frags = f | 0; e.deaths = d | 0; e.caps = c | 0; } });
        if (Array.isArray(jsd.ts) && jsd.ts.length === 2) A.R.ts = jsd.ts.map(n => n | 0);
        say('Carried on from your saved Practice Session.', 4);
        const wait = n => { if (G.closed) return; if (G.mode === 'game') gameMenu(); else if (n < 80) setTimeout(() => wait(n + 1), 60); }; wait(0);
      } catch (e) { console.error(e); jsv.clear(); }
    }
    // an instruction from outside (JackSpy 3D, the fan site, JAQUAKE's menu): join a server, quick match...
    G.runArg = a => {
      if (G.closed || !a || typeof a !== 'object') return;
      if (G.paused) resume();
      if (a.go === 'join' && a.id) { if (A && !A.local && A.g && A.g.id === a.id && G.mode === 'game') return; if (!window.Net || !Net.connected) return status('Not connected to JackNet.'); connecting('Connecting to ' + (a.name || 'the server') + '...'); Net.send({ t: 'arJoin', id: a.id, spec: !!a.spec }); }
      else if (a.go === 'quick') quick(); else if (a.go === 'coop') quickMode('coop');
      else if (a.go === 'browser') browser('net'); else if (a.go === 'practice') practiceDlg(); else if (a.go === 'top') rankings();
    };
    G.close = () => { if (G.closed) return; G.closed = true; E.music(JQ ? 'jaquake' : 'jrt', false); if (A) A.leave(); if (CUR === G) CUR = null; clearInterval(keepIv); closeConn(); loopH.stop(); input.dispose(); window.removeEventListener('resize', onResize); if (ro) ro.disconnect(); ctx.dispose(); };
    G.dbg = { A: () => A, P: () => P, bots: () => bots, mons: () => mons, go: o => go(localArena(Object.assign({}, pset, o))), browser, quick, quickMode, rankings, hostNet: o => Net.send(Object.assign({ t: 'arHost', full }, o)), join: (id, spec) => Net.send({ t: 'arJoin', id, spec }), list: () => brList, vote: castVote, M: () => M, input: () => input,
      // test harness: a bot brain drives the player (skill sk), to check a newcomer-level player can win. null switches it off
      autopilot(sk) { bots = bots.filter(b => b !== G.auto); G.auto = null; if (sk == null || !A || !P) return; G.auto = { id: me, name: myName(), skill: sk, p: P.p, v: P.v, r: 0.4, h: 1.8, yaw: P.yaw, pitch: 0, ground: false, w: P.w, cool: 0.5, am: P.am, has: P.has, think: 0, goalT: 0, strafe: 1, strafeT: 0, taunts: ['Good game!'], react: 0, aimErr: [0, 0], dead: P.dead, deadT: G.t, role: 'attack', stuck: 0, lastP: null, auto: true, tv: [0, 0, 0],
        // a fixed 'newcomer': the old Average bot's aim (+-0.065 rad, half a second to react, 5 rad/s turns), whatever the bots are set to
        tuneO: sk === 'new' ? { think: 0.38, react: 0.5, fov: 3.2, aim: 0.056, aimD: 0, aimS: 0, lag: 0, turn: 5, turnA: 1000, cone: 0.25, burst: 0.01, rest: 0.3, strafe: 0.5, dodge: 0, lead: 0.3, greed: 0, hp: 40 } : null }; bots.push(G.auto); } };
    PCG.live = PCG.live || {}; PCG.live[JQ ? 'jqnet' : 'jrt'] = G;
    return G;
  };
  PCG.jrt = (w, host, arg, env) => PCG.arenaClient(w, host, arg, env, 'jrt');
  PCG.jqNet = (w, host, arg, env) => PCG.arenaClient(w, host, arg, env, 'jq');
})();

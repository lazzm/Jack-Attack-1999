/* era-sites-fan: three 1999 web favourites.
 *  www.aintitkoolnews.infobahn  AIN'T IT KOOL NEWS: film rumours and spy reports, dated to the 1999 calendar
 *  www.newjacks.wubwub          NEWJACKS: the cartoon portal (CSS/SVG "flash" cartoons with a preloader and skip intro)
 *  www.webtoyz.kidz             WEB TOYZ: the Grot Dance, the Talking Squig (also a desktop toy), bubble wrap, Dress-a-Squig */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc, store = ES.store;
  // pixel sprites for these pages (added to the shared kit set if not already there): tin robots (two dance frames),
  // Blobbits (round bouncy critters, two frames), a little green alien and Hairy the bearded film fan
  ES.SPR.robot = ES.SPR.robot || ['......rr......', '......kk......', '...kkkkkkkk...', '...kwssssSk...', '...kscsscSk...', '...kssssSSk...', '...kSkSkSSk...', '...kkkkkkkk...', '..kkkkkkkkkk..', '.kskuuuuuuksk.', '.kskucyrcuksk.', '.kskuuuuuuksk.', '.kk.kkkkkk.kk.', '....kS..kS....', '...kkk..kkk...'];
  ES.SPR.robot2 = ES.SPR.robot2 || ['.kk...rr...kk.', '.ks...kk...Sk.', '.kskkkkkkkkSk.', '.kskwssssSkSk.', '.kskscsscSkSk.', '.ksksssSSSkSk.', '.kskSkSkSSkSk.', '.kskkkkkkkkSk.', '.kkkkkkkkkkkk.', '...kuuuuuuk...', '...kucyrcuk...', '...kuuuuuuk...', '...kkkkkkkk...', '..kS......kS..', '.kkk......kkk.'];
  ES.SPR.blobbit = ES.SPR.blobbit || ['..kkk....kkk..', '.kupuk..kupuk.', '.kuuukkkkuuuk.', 'kucuuuuuuuuuuk', 'kccuwwuuwwuuuk', 'kcuuwkuuwkuuuk', 'kuuuwkuuwkuuuk', 'kpuuuuuuuuuupk', 'kuuuukkkkuuuuk', '.kuuukrrkuuuk.', '..kuuuuuuuuk..', '...kkkkkkkk...', '..kuuk..kuuk..', '..kkkk..kkkk..'];
  ES.SPR.blobbit2 = ES.SPR.blobbit2 || ['..............', '..kkk....kkk..', '.kupukkkkupuk.', 'kccuuuuuuuuuuk', 'kcuuwwuuwwuuuk', 'kuuuwkuuwkuuuk', 'kpuuuuuuuuuupk', 'kuuukkkkkkuuuk', 'kuuukrrrrkuuuk', '.kuuukkkkuuuk.', '..kkkkkkkkkk..', '.kuuk....kuuk.', '.kkkk....kkkk.', '..............'];
  ES.SPR.alien = ES.SPR.alien || ['..l........l..', '...k......k...', '....k....k....', '....gggggg....', '...gllgggggg..', '..gkkggggkkg..', '..gkwkggkwkg..', '..gkkggggkkg..', '...ggkkkkgg...', '....gggggg....', '..g.bbbbbb.g..', '.g.bbbbbbbb.g.', '...bbbbbbbb...', '....g....g....', '...gg....gg...'];
  ES.SPR.hairy = ES.SPR.hairy || ['....uuuuuu....', '...uuuuuuuuuu.', '...uuuuuuuuuuu', '...hnnnnnnh...', '...hnknnknh...', '...hnnNNnnh...', '...hhhhhhhh...', '...hhkkkkhh...', '....hhhhhh....', '.....hhhh.....', '..bbbbbbbbbb..', '.nbbbbbbbbbbn.', '.nbbbbbbbbbbn.', '...zzzzzzzz...', '...zzz..zzz...'];

  // ================================================================ AIN'T IT KOOL NEWS
  const N = 'www.aintitkoolnews.infobahn', NU = p => 'http://' + N + p;
  ES.css('aign', `
.ag{background:#000 radial-gradient(circle at 20% 10%,#1a1a3a,#000 60%);color:#e8e8e8;font:13px/1.5 Verdana,Arial,sans-serif;padding-bottom:6px}
.ag a{color:#ffcc33}
.ag-top{text-align:center;padding:14px 10px;border-bottom:3px double #ffcc33}
.ag-top b{display:block;font:bold 34px/1 Impact,"Arial Black",sans-serif;color:#ffcc33;letter-spacing:2px;text-shadow:3px 3px 0 #a00}
.ag-top i{font-size:12px;color:#aaa}
.ag-in{display:flex;gap:14px;padding:12px;align-items:flex-start}
.ag-main{flex:1;min-width:0}
.ag-side{width:180px;flex:none;font-size:11px;border:1px solid #444;padding:8px;background:#111}
.ag-st{border-bottom:1px dashed #555;padding:8px 0 12px}
.ag-st h3{margin:0;font:bold 17px Verdana,sans-serif;color:#ff6633}
.ag-st .by{font-size:11px;color:#999}
.ag-st .tb{font-size:11px}
.ag-hairy{float:right;margin:0 0 6px 10px}
@media (max-width:640px){.ag-in{flex-direction:column}.ag-side{width:auto}.ag-top b{font-size:26px}}
`);
  const SCOOPS = [
    ['01-08', 'TEST SCREENING REPORT: TOY ROBOTS 2!!!', 'Squint', "I snuck into a test screening of TOY ROBOTS 2 in a cinema I'm not allowed to name (it was the Odeon) (I'm not allowed to say that). The robots come alive when nobody is looking, just like in real life. There's a bit with a wind-up dinosaur and a vacuum cleaner that made a grown man cry laughing. 9 Rupees out of 10."],
    ['02-20', 'RUMOUR: Big new sci-fi film has a man dodging bullets in SLOW MOTION', 'The Sneaky Spy', "My cousin's mate saw the trailer for <i>The Modemtrix</i> and says there's a bit where the camera spins ALL the way round a man while time stands still. Our spy says this will never catch on. (Our spy is often wrong.) It's out in America on 31 March."],
    ['03-12', 'PEOPLE PAYING FOR A FILM JUST TO SEE A TRAILER', 'Hairy Knowalls', "Reports from America: fans are buying tickets to <i>Wing Commander</i> just to watch the new <i>Phantom Menace</i> trailer before it, and then LEAVING. We at Ain't It Kool News would never do this. (We did this.)"],
    ['04-01', 'EXCLUSIVE: EPISODE II TO BE CALLED "JAR JAR JAMS\'S BIG DAY OUT"', 'The Sneaky Spy', "A spy who definitely works at a film studio (he works at a garden centre) says the next Intergalactic Battles film after this one will be a musical. It is the first of April. Make of that what you will."],
    ['04-30', 'INTERGALACTIC BATTLES FANS GATHER IN THEIR THOUSANDS', 'Squint', 'The first big Intergalactic Battles Celebration convention starts today in Denver, America. Costumes, queues and a lot of homemade lightsabers. Our spy went as a Jawa in his Mom\'s brown dressing gown. Nobody noticed. That is the best kind of costume.'],
    ['05-20', 'SPY REVIEW: THE PHANTOM NUISANCE (NO SPOILERS!!!)', 'Hairy Knowalls', "It's out in America! Our spy over there says: the podrace is AMAZING, the lightspatula duel at the end is the best ever, and the music is enormous. One particular floppy-eared character is going to be argued about until the year 3000. UK readers: 16 July. Hold on."],
    ['06-11', 'THE MODEMTRIX IS OUT HERE TODAY', 'Squint', "The bullet-dodging film is finally out in the UK! Everyone who's seen it is leaning backwards in the playground. Nobody has got hurt yet. (Dave has got hurt.) Remember: there is no spoon. There IS popcorn."],
    ['07-16', 'IT\'S HERE. EPISODE I IS OUT IN THE UK.', 'Hairy Knowalls', 'Queues round the block! People dressed as Space Cadet! A Wookiee in the front row! Our review: the double-bladed lightspatula made the whole cinema go "OOOOH". Your review? Post it in Talk Back below.'],
    ['08-06', 'GIANT ROBOT FILM LANDS IN AMERICA', 'Squint', "<i>The Iron Giant</i> is out in America today: a boy finds a giant robot that eats metal. Our spy says it's brilliant and also made him cry, which he denies. Not out here yet. Everything good comes out in America first."],
    ['09-01', 'BEDROOM SCOOP: "ATTACK OF THE 50-FOOT HAMSTER" IN PRODUCTION', 'The Sneaky Spy', "Dave's film studio Biro Pictures is making a film about a hamster that eats a whole town. Budget: 14 Rupees. Special effects: a hamster and a BLOCKO model of a town. The BLOCKO town did not survive. Production has stopped."],
    ['10-11', 'THE LORD OF THE RINGS STARTS FILMING', 'Squint', 'Filming has started in New Zealand on The Lord of the Rings, three films shot at the same time. Rumour: the hobbits have big hairy feet. Rumour CONFIRMED (it is in the book). Readers who have not read the book: read the book.'],
    ['10-29', 'SPY REPORT: "ROBOZILLA" TEST SCREENING GOES WRONG', 'The Sneaky Spy', "Halfway through the test screening of ROBOZILLA, the real Robozilla walked in, ate the popcorn machine and walked out. The audience gave it 10/10. The cinema gave it a bill."],
    ['11-24', 'TOY STOREY 2 OUT IN AMERICA', 'Hairy Knowalls', 'The toys are back in America today! Our American spy says it is just as good as the first one, which nobody thought was possible. UK readers: it is not out here until next year. We KNOW. We are sad too.'],
    ['12-25', 'MERRY CHRISTMAS: SPACE ACTORS FILM OUT IN AMERICA', 'Squint', "<i>Galaxy Quest</i> is out in America today: the actors from an old space telly show get mistaken for real heroes by real aliens. Our spy says it's a love letter to every sci-fi fan. Merry Christmas from all of us at AIGN!"],
  ];
  ES.def(N, '/', c => {
    const now = c.md, list = SCOOPS.filter(s => ES.mdOf(s[0]) <= now).reverse();
    const show = list.length ? list : SCOOPS.slice(0, 1);
    return `<div class="ag"><div class="ag-top"><b>AIN'T IT KOOL NEWS</b><i>Film rumours, spy reports and scoops. 100% maybe true. Updated whenever Hairy remembers.</i></div><div class="ag-in"><div class="ag-main">
      ${show.map((s, i) => `<div class="ag-st">${i === 0 ? `<span class="ag-hairy">${ES.spr('hairy', 4)}</span>` : ''}<h3>${esc(s[1])}</h3><div class="by">${ES.longDate(ES.dateOf(s[0]))}, by Hairy Knowalls. Spy: <b>${esc(s[2])}</b></div><p>${s[3]}</p><div class="tb">[ <a href="${NU('/archive.html')}">Archive</a> | <a href="#agtb">Talk Back (${12 + ES.hash(s[1]) % 300})</a> ]</div></div>`).join('')}
      <h3 id="agtb" style="color:#ffcc33">TALK BACK</h3>${c.gb([['MovieBuff99', '17/07/99', 'SAW IT TWICE. Dark Mole is the best thing that ever happened.'], ['Pedant', '12/06/99', 'Technically you CAN dodge bullets if a stormtrooper is shooting at you, because stormtroopers never hit anything.']], { k: 'eras.gb.aign', title: 'Talk Back to Hairy', btn: 'Post', ph: 'Your opinion (be nice, no spoilers!)' })}
      </div><div class="ag-side"><b>SPIES WANTED!</b><br>Seen a test screening? Know someone who works in a cinema? <a href="${NU('/scoopers.html')}">Send us a scoop!</a><br><br><b>LINKS</b><br><a href="http://www.scifizone.cyb/">${Cast.n('club1')}'s Sci-Fi Zone</a><br><a href="http://rumourmill.infobahn/">The Rumour Mill: Episode I</a><br><a href="http://www.episode1countdown.jnet/">${Cast.n('kidEp1')}'s Episode I Countdown</a><br><a href="http://www.newjacks.wubwub/">NewJacks cartoons</a><br><a href="http://www.year3000.cyb/">The Year 3000 page</a><br><br><b>HAIRY SAYS:</b><br>"No spoilers in Talk Back or Gubbinz eats your post."</div></div>${c.foot({ ctrText: 'Spies on the site:', ctrAfter: '', ctr: 'lcd', best: 'Best viewed in a dark room with popcorn' })}</div>`;
  });
  ES.def(N, '/archive.html', c => `<div class="ag"><div class="ag-top"><b>AIGN ARCHIVE</b><i>Every scoop, ever (this year)</i></div><div class="ag-in"><div class="ag-main"><ul>${SCOOPS.filter(s => ES.mdOf(s[0]) <= c.md).map(s => `<li>${ES.dmy(ES.dateOf(s[0]))}: <b>${esc(s[1])}</b> <small>(${esc(s[2])})</small></li>`).join('') || '<li>Nothing yet!</li>'}</ul><p><a href="${NU('/')}">&lt;&lt; Back</a></p></div></div>${c.foot({ ctr: 'lcd' })}</div>`);
  ES.def(N, '/scoopers.html', c => `<div class="ag"><div class="ag-top"><b>SEND A SCOOP</b><i>All spies remain anonymous (we call you "Squint")</i></div><div class="ag-in"><div class="ag-main"><p>Know something? Saw something? Made something up? Send it in. Hairy reads every single one (eventually).</p>${c.gb([['Squint', '02/10/99', 'I have seen a pigeon in a cinema. That is the scoop.']], { k: 'eras.gb.aignscoop', title: 'The Scoop Box', btn: 'Send Scoop', ph: 'Your scoop...' })}</div></div>${c.foot({ ctr: 'lcd' })}</div>`);

  // ================================================================ NEWJACKS: the cartoon portal
  const NG = 'www.newjacks.wubwub', GU = p => 'http://' + NG + p;
  ES.css('ng', `
.ng{background:#1a1a1a;color:#ddd;font:12px/1.4 Verdana,Arial,sans-serif}
.ng a{color:#ff9900}
.ng-top{background:linear-gradient(#3a3a3a,#111);padding:10px 12px;border-bottom:3px solid #ff6600;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ng-top b{font:bold 30px Impact,"Arial Black",sans-serif;color:#ff6600;letter-spacing:1px;text-shadow:2px 2px 0 #000}
.ng-top i{color:#999}
.ng-in{padding:12px;max-width:820px;margin:0 auto}
.ng-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.ng-card{background:#2a2a2a;border:1px solid #444;padding:8px;display:flex;gap:8px;align-items:center}
.ng-card .th{width:60px;height:45px;flex:none;background:#fff;border:2px solid #ff6600;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ng-card b{color:#fff}
.ng-stage{position:relative;width:480px;max-width:100%;aspect-ratio:4/3;margin:0 auto;background:#fff;border:3px solid #ff6600;overflow:hidden;color:#000;font:bold 16px Arial,sans-serif}
.ng-stage svg{position:absolute;inset:0;width:100%;height:100%}
.ng-load{position:absolute;inset:0;background:#000;color:#ff9900;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:bold 14px Verdana,sans-serif;z-index:3}
.ng-load .bar{width:60%;height:12px;border:2px solid #ff9900}
.ng-load .bar i{display:block;height:100%;width:0;background:#ff9900}
.ng-skip{position:absolute;right:8px;bottom:6px;z-index:4;font:11px Verdana;color:#999!important}
.ng-cap{position:absolute;left:0;right:0;bottom:6%;text-align:center;font:bold 18px "Comic Sans MS",cursive;z-index:2;padding:0 6%}
.ng-bub{position:absolute;background:#fff;border:2px solid #000;border-radius:14px;padding:4px 10px;font:bold 14px "Comic Sans MS",cursive;z-index:2;white-space:nowrap}
.ng-ctrl{text-align:center;margin:8px 0;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;align-items:center}
.ng-rate button{font-size:16px;background:none;border:0;color:#ff9900;cursor:pointer;min-width:30px;min-height:30px}
.ng-a1{animation:ngbounce .5s ease-in-out infinite alternate}@keyframes ngbounce{to{transform:translateY(-12%)}}
.ng-a2{animation:ngwob .3s steps(2) infinite}@keyframes ngwob{50%{transform:rotate(8deg)}}
.ng-a3{animation:ngslide 2s ease-in forwards}@keyframes ngslide{from{transform:translateX(-60%)}to{transform:translateX(0)}}
.ng-a4{animation:ngboom .6s ease-out forwards}@keyframes ngboom{from{transform:scale(.1);opacity:1}to{transform:scale(2.2);opacity:0}}
.ng-a5{animation:ngshake .1s linear infinite}@keyframes ngshake{50%{transform:translate(2px,-2px)}}
.ng-a6{animation:ngspin 1s linear infinite;transform-origin:center;transform-box:fill-box}@keyframes ngspin{to{transform:rotate(360deg)}}
`);
  const g = (x, y, s, name, cls, pal) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls || ''}" style="transform-box:fill-box;transform-origin:center">${ES.SPR[name].map((r, yy) => [...r].map((ch, xx) => ch !== '.' && (pal || {})[ch] !== '' && ((pal && pal[ch]) || ES.PAL[ch]) ? `<rect x="${xx}" y="${yy}" width="1.02" height="1.02" fill="${(pal && pal[ch]) || ES.PAL[ch]}"/>` : '').join('')).join('')}</g></g>`;
  const sky = (c1, c2) => `<defs><linearGradient id="ngsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="320" height="240" fill="url(#ngsky)"/>`;
  const svg = b => `<svg viewBox="0 0 320 240" aria-hidden="true">${b}</svg>`;
  const pc = (x, y) => `<g transform="translate(${x} ${y})"><rect width="90" height="70" fill="#e8e0c8" stroke="#000" stroke-width="2"/><rect x="8" y="8" width="74" height="50" fill="#000080"/><rect x="25" y="70" width="40" height="10" fill="#c8c0a8" stroke="#000"/><rect x="-10" y="80" width="110" height="14" fill="#e8e0c8" stroke="#000"/></g>`;
  const TOONS = [
    ['toaster', 'Blobbit vs Toaster', 'BlobbitFan99', 'A Blobbit. A toaster. Only one of them will survive. (Toast.)', [
      [2200, svg(sky('#ffe8a0', '#ffc860') + '<rect y="190" width="320" height="50" fill="#a0602a"/><rect x="200" y="140" width="70" height="50" rx="8" fill="#c8c8d8" stroke="#000" stroke-width="2"/><rect x="215" y="134" width="14" height="8" fill="#000"/><rect x="241" y="134" width="14" height="8" fill="#000"/>' + g(30, 150, 3, 'blobbit', 'ng-a1')), 'Meanwhile, in a kitchen...'],
      [2000, svg(sky('#ffe8a0', '#ffc860') + '<rect y="190" width="320" height="50" fill="#a0602a"/><rect x="200" y="140" width="70" height="50" rx="8" fill="#c8c8d8" stroke="#000" stroke-width="2" class="ng-a5"/><rect x="214" y="100" width="16" height="30" fill="#e8b060" stroke="#000" class="ng-a1"/>' + g(120, 150, 3, 'blobbit', 'ng-a1')), '*POP*'],
      [2000, svg(sky('#ffe8a0', '#ffc860') + '<rect y="190" width="320" height="50" fill="#a0602a"/><rect x="200" y="140" width="70" height="50" rx="8" fill="#c8c8d8" stroke="#000" stroke-width="2" class="ng-a5"/>' + g(170, 140, 3.4, 'blobbit2', 'ng-a2')), 'CHOMP.'],
      [1800, svg(sky('#ffe8a0', '#ffc860') + '<rect y="190" width="320" height="50" fill="#a0602a"/><circle cx="235" cy="160" r="40" fill="#ff8a00" class="ng-a4"/>' + g(40, 140, 3, 'blobbit', 'ng-a1')), 'The toaster wanted its toast back.'],
      [2600, svg(sky('#000', '#202040') + '<text x="160" y="120" text-anchor="middle" fill="#fff" font-family="Impact,Arial" font-size="40">THE END</text><text x="160" y="150" text-anchor="middle" fill="#ff9900" font-family="Arial" font-size="12">(no toasters were harmed) (one was)</text>'), '']]],
    ['online', 'Gubbinz Goes Online', 'JackToonz', 'Gubbinz tries to download a picture of a Daydream. On a 14.4K modem.', [
      [2000, svg(sky('#d8e8ff', '#fff') + pc(115, 70) + g(40, 150, 4, 'grot', '')), 'Gubbinz wants to go on the Internet.'],
      [2400, svg(sky('#d8e8ff', '#fff') + pc(115, 70) + g(40, 150, 4, 'grot', 'ng-a5') + '<text x="160" y="40" text-anchor="middle" font-family="Courier New" font-size="18" class="ng-a5">EEEEE-KRRRRR-BONG</text>'), 'Connecting at 14,400 bits per second...'],
      [2600, svg(sky('#d8e8ff', '#fff') + pc(115, 70) + '<rect x="133" y="88" width="54" height="12" fill="#fff"/><rect x="133" y="88" width="50" height="12" fill="#00c000"/>' + g(40, 150, 4, 'grot2', 'ng-a1')), 'Downloading DREAMCST.JPG... 98%... 99%...'],
      [2200, svg(sky('#d8e8ff', '#fff') + pc(115, 70) + g(40, 150, 4, 'grot', 'ng-a5') + '<text x="250" y="60" font-family="Comic Sans MS" font-size="22" fill="#c00">"MOM!!!"</text>'), 'Somebody picked up the phone.'],
      [2600, svg(sky('#000', '#000') + '<text x="160" y="120" text-anchor="middle" fill="#fff" font-family="Courier New" font-size="18">NO CARRIER</text>'), '']]],
    ['dance', 'The Dancing Alien', 'AlienLuvr', 'It dances. That is the whole cartoon. Watch it 400 times.', [
      [9000, svg(sky('#ff6ad8', '#6a3aff') + g(110, 80, 7, 'alien', 'ng-a2', { b: '#ffd400' }) + '<circle cx="40" cy="40" r="12" fill="#fff" class="ng-a1"/><circle cx="280" cy="50" r="10" fill="#0ff" class="ng-a1"/><path d="M30 200l20-30 20 30M250 200l20-30 20 30" fill="#ffd400" class="ng-a2"/>'), 'oogachaka oogachaka (it is a different song, honest)']]],
    ['y2k', 'Y2K: The Movie', 'MillenniumGaz', 'At midnight on 31/12/99, all the computers in the world... ok, just watch it.', [
      [2200, svg(sky('#000020', '#000') + '<rect x="70" y="80" width="180" height="70" fill="#111" stroke="#0f0" stroke-width="3"/><text x="160" y="128" text-anchor="middle" fill="#0f0" font-family="Courier New" font-size="34">23:59:58</text>'), '31 December 1999...'],
      [1400, svg(sky('#000020', '#000') + '<rect x="70" y="80" width="180" height="70" fill="#111" stroke="#0f0" stroke-width="3"/><text x="160" y="128" text-anchor="middle" fill="#0f0" font-family="Courier New" font-size="34" class="ng-a5">23:59:59</text>'), '...'],
      [2400, svg(sky('#000020', '#000') + '<rect x="70" y="80" width="180" height="70" fill="#111" stroke="#f00" stroke-width="3" class="ng-a5"/><text x="160" y="128" text-anchor="middle" fill="#f00" font-family="Courier New" font-size="34">00:00:00</text>' + g(20, 160, 3, 'grot', 'ng-a5')), 'THE MILLENNIUM BUG STRIKES!!!'],
      [2600, svg(sky('#ffe8a0', '#fff') + '<rect x="120" y="120" width="80" height="60" rx="8" fill="#c8c8d8" stroke="#000" stroke-width="2"/><text x="160" y="100" text-anchor="middle" font-family="Comic Sans MS" font-size="16">"IT IS 1900"</text>'), 'The toaster thinks it is 1900. Toast is now Victorian.'],
      [2600, svg(sky('#000', '#202040') + '<text x="160" y="120" text-anchor="middle" fill="#fff" font-family="Impact,Arial" font-size="36">EVERYTHING ELSE: FINE</text>'), 'Happy New Year!']]],
    ['band', 'The Robot Rock Band', 'MoshPitMatt', 'Three robots. One guitar. Zero talent. Maximum volume.', [
      [3000, svg(sky('#300', '#000') + '<rect y="190" width="320" height="50" fill="#333"/>' + g(30, 110, 4.5, 'robot2', 'ng-a2', { u: '#d1007a' }) + g(130, 100, 5, 'robot', 'ng-a1') + g(230, 110, 4.5, 'robot2', 'ng-a2', { u: '#3a9a2a' }) + '<text x="40" y="60" font-size="30" fill="#ffd400" class="ng-a1">&#9835;</text><text x="250" y="70" font-size="30" fill="#0ff" class="ng-a1">&#9834;</text>'), '"THIS ONE\'S CALLED... BEEP BOOP"'],
      [3000, svg(sky('#300', '#000') + '<rect y="190" width="320" height="50" fill="#333"/>' + g(30, 110, 4.5, 'robot2', 'ng-a5', { u: '#d1007a' }) + g(130, 100, 5, 'robot', 'ng-a5') + g(230, 110, 4.5, 'robot2', 'ng-a5', { u: '#3a9a2a' }) + '<circle cx="160" cy="120" r="60" fill="#ff8a00" opacity=".5" class="ng-a4"/>'), 'BZZZZZRRRRRANNNNGGG!!!'],
      [2600, svg(sky('#000', '#000') + '<text x="160" y="110" text-anchor="middle" fill="#fff" font-family="Impact,Arial" font-size="28">THANK YOU JACKTOWN</text><text x="160" y="140" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">(the speakers are on fire)</text>'), '']]],
    ['ufo', 'Abducted!', 'CustardFiles', 'Gubbinz. A field. A very bright light. A cow that has seen too much.', [
      [2200, svg(sky('#000030', '#203050') + '<rect y="190" width="320" height="50" fill="#1a4a1a"/>' + g(140, 150, 3, 'grot', '')), 'A quiet night in a field...'],
      [2400, svg(sky('#000030', '#203050') + '<rect y="190" width="320" height="50" fill="#1a4a1a"/><path d="M130 50l-40 150h140l-40-150z" fill="#ffff80" opacity=".5"/><ellipse cx="160" cy="45" rx="60" ry="15" fill="#888" stroke="#000"/><ellipse cx="160" cy="36" rx="25" ry="12" fill="#aef"/>' + g(140, 150, 3, 'grot', 'ng-a1')), 'BEEEEOOOOWWWW'],
      [2400, svg(sky('#000030', '#203050') + '<rect y="190" width="320" height="50" fill="#1a4a1a"/><path d="M130 50l-40 150h140l-40-150z" fill="#ffff80" opacity=".5"/><ellipse cx="160" cy="45" rx="60" ry="15" fill="#888" stroke="#000" class="ng-a5"/>' + g(140, 80, 3, 'grot', 'ng-a6')), 'Wheeeeee!'],
      [2600, svg(sky('#000030', '#203050') + '<rect y="190" width="320" height="50" fill="#1a4a1a"/>' + g(140, 150, 3, 'grot', '') + '<text x="160" y="110" text-anchor="middle" font-family="Comic Sans MS" font-size="15" fill="#fff">"They just wanted directions."</text>'), 'THE END']]],
  ];
  const TBY = {}; TOONS.forEach(t => { TBY[t[0]] = t; });
  const thumb = t => `<div class="th">${t[4][0][1].replace('<svg ', '<svg style="width:100%;height:100%" ')}</div>`;
  const ngPage = (c, body) => `<div class="ng"><div class="ng-top"><b>NEWJACKS</b><i>Everything, by everyone. (Mostly Dave.) Cartoons for your 56K modem.</i></div><div class="ng-in">${body}</div>${c.foot({ ctrText: 'Cartoons watched:', ctrAfter: '', ctr: 'red', best: 'Requires <b>JackFlash 4</b> (built in, we cheated)' })}</div>`;
  ES.def(NG, '/', c => ngPage(c, `<p><b>Welcome to NEWJACKS!</b> The best cartoons on JackNet, made by visitors with nothing but a mouse and a dream. Click one to watch. Rate it! Then <a href="${GU('/upload.html')}">send us yours</a>.</p><div class="ng-list">${TOONS.map(t => `<div class="ng-card">${thumb(t)}<div><a href="${GU('/toon/' + t[0] + '.html')}"><b>${esc(t[1])}</b></a><br><small>by ${esc(t[2])}</small><br><small>${esc(t[3])}</small></div></div>`).join('')}</div><p style="text-align:center;margin-top:14px">Also see: <a href="http://www.megaflash.cyb/">MEGAFLASH 2000</a> &middot; <a href="http://www.webtoyz.kidz/">Web Toyz</a> &middot; <a href="http://www.aintitkoolnews.infobahn/">Ain't It Kool News</a></p>`));
  ES.def(NG, /^\/toon\//, c => {
    const t = TBY[c.path.replace(/^\/toon\/|\.html$/g, '')];
    if (!t) return ngPage(c, '<p>Toon not found. It may have been eaten.</p>');
    c.after.push(() => playToon(c, t));
    return ngPage(c, `<h2 style="color:#ff9900;margin:0 0 4px">${esc(t[1])}</h2><p style="margin:0 0 8px">by <b>${esc(t[2])}</b> &middot; ${esc(t[3])}</p><div class="ng-stage"><div class="ng-scene"></div><div class="ng-cap"></div><div class="ng-load"><div>LOADING... <span class="pc">0</span>%</div><div class="bar"><i></i></div><small>Please wait. Cartoon is ${40 + ES.hash(t[0]) % 300} KB.</small></div><a href="#" class="ng-skip">[ skip intro ]</a></div>
      <div class="ng-ctrl"><button class="es-btn ng-replay" type="button">Replay</button><span class="ng-rate">Rate it: ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-r="${n}" aria-label="${n} stars">&#9733;</button>`).join('')}</span><span class="ng-score"></span></div><p style="text-align:center"><a href="${GU('/')}">&lt;&lt; More cartoons</a></p>`);
  });
  function playToon(c, t) {
    const st = c.q('.ng-stage'), scene = c.q('.ng-scene'), cap = c.q('.ng-cap'), ld = c.q('.ng-load'); let tmo = null, pc = 0;
    const run = i => { clearTimeout(tmo); if (!st.isConnected) return; const f = t[4][i % t[4].length]; scene.innerHTML = f[1]; cap.textContent = f[2]; if (window.Sound && Sound.on) Sound.note(300 + i * 60, 0.08, 'square'); if (i + 1 < t[4].length) tmo = setTimeout(() => run(i + 1), f[0]); };
    c.off(() => clearTimeout(tmo));
    const start = () => { ld.remove(); const sk = c.q('.ng-skip'); if (sk) sk.remove(); run(0); };
    const iv = c.every(() => { pc = Math.min(100, pc + 3 + Math.floor(Math.random() * 9)); c.q('.pc').textContent = pc; c.q('.ng-load .bar i').style.width = pc + '%'; if (pc >= 100) { clearInterval(iv); start(); } }, 220);
    c.on('.ng-skip', 'click', ev => { ev.preventDefault(); ev.stopPropagation(); clearInterval(iv); c.secret('eras.toon'); start(); });
    c.on('.ng-replay', 'click', () => { if (!ld.isConnected) run(0); });
    const keys = [1, 2, 3, 4, 5].map(n => `eras.ng.${t[0]}.${n}`), show = v => { const n = keys.map(k => +v[k] || 0), tot = n.reduce((a, b) => a + b, 0); c.q('.ng-score').textContent = tot ? `Score: ${(n.reduce((a, b, i) => a + b * (i + 1), 0) / tot).toFixed(2)} / 5 (${tot} votes)` : 'No votes yet!'; };
    let cur = {}; c.get(keys).then(v => { cur = v; show(v); });
    keys.forEach(k => c.watch(k, ev => { if (ev.type === 'set') { cur[k] = ev.v; show(cur); } }));
    const voted = store.get('jhp_eras_ngv', {});
    c.qa('.ng-rate button').forEach(b => b.addEventListener('click', () => { if (voted[t[0]]) { c.q('.ng-score').textContent = 'You already voted! ' + c.q('.ng-score').textContent; return; } if (c.inc(keys[b.dataset.r - 1])) { voted[t[0]] = 1; store.set('jhp_eras_ngv', voted); c.sfx('pet'); } }));
  }
  ES.def(NG, '/upload.html', c => ngPage(c, `<h2 style="color:#ff9900">Submit a Toon</h2><p>Made a cartoon? Describe it below and the NewJacks crew might animate it (with crayons). Kid-friendly only, or Gubbinz deletes it.</p>` + c.gb([['MoshPitMatt', '30/09/99', 'Idea: The Robot Rock Band 2: The Encore. It is louder.']], { k: 'eras.gb.ngideas', title: 'Cartoon Ideas (live)', btn: 'Submit!', ph: 'My cartoon is about...' })));

  // ================================================================ WEB TOYZ
  const WT = 'www.webtoyz.kidz', TU = p => 'http://' + WT + p;
  ES.css('wt', `
.wt{background:#ffffc0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ctext x='4' y='26' font-size='20' fill='%23ffd860'%3E%E2%98%85%3C/text%3E%3C/svg%3E");color:#000;font:14px/1.4 "Comic Sans MS","Comic Sans",cursive;text-align:center;padding:10px}
.wt a{color:#c00080}
.wt h1{font:bold 34px "Comic Sans MS",cursive;color:#ff00a0;text-shadow:2px 2px 0 #0080ff;margin:6px 0}
.wt-menu{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0}
.wt-menu a{display:block;width:150px;background:#fff;border:3px ridge #ff80c0;padding:8px;text-decoration:none;color:#000}
.wt-menu a b{display:block;color:#c00080}
.wt-dance{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:4px;max-width:640px;margin:10px auto}
.wt-dg{position:relative;height:64px}
.wt-dg svg{position:absolute;left:50%;top:0;transform:translateX(-50%)}
.wt-dg svg{animation:wtf .44s linear infinite}
.wt-dg svg:nth-child(2){animation-delay:-.22s}
@keyframes wtf{0%,49.9%{opacity:1}50%,100%{opacity:0}}
.wt-dg:nth-child(3n) svg{animation-duration:.34s}.wt-dg:nth-child(3n) svg:nth-child(2){animation-delay:-.17s}
.wt-sq{width:220px;height:200px;margin:0 auto;position:relative}
.wt-mouth{transition:transform .08s}
.wt-bub{display:inline-block;background:#fff;border:3px solid #000;border-radius:20px;padding:8px 16px;min-height:1.5em;max-width:90%;font-size:16px}
.wt-wrap{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;max-width:520px;margin:10px auto;background:#cfe8ff;padding:8px;border:2px solid #8ab}
.wt-b{aspect-ratio:1;border-radius:50%;border:1px solid #9ac;background:radial-gradient(circle at 35% 30%,#fff,#d8ecff 40%,#a8c8e8);cursor:pointer;padding:0;min-width:0}
.wt-b.p{background:radial-gradient(circle,#b8d0e8,#cfe8ff);border-style:dashed;transform:scale(.85);cursor:default}
.wt-dress{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px}
.wt-dress button{font:13px "Comic Sans MS",cursive;min-height:30px}
.wt-dress button.on{border-style:inset;background:#ffd0e8}
`);
  const wtPage = (c, body) => `<div class="wt">${body}<p><a href="${TU('/')}">Web Toyz Home</a> &middot; <a href="${TU('/dance.html')}">Robot Dance</a> &middot; <a href="${TU('/talk.html')}">Talking Robot</a> &middot; <a href="${TU('/bubble.html')}">Bubble Wrap</a> &middot; <a href="${TU('/dress.html')}">Dress-a-Blobbit</a></p>${c.foot({ ctrText: 'You are toy-er number', ctrAfter: '!!!', best: 'Best viewed with a mouse that clicks' })}</div>`;
  const dg = (pal, s) => `<div class="wt-dg">${ES.spr('robot', s || 4, pal)}${ES.spr('robot2', s || 4, pal)}</div>`;
  ES.def(WT, '/', c => wtPage(c, `<h1>~*~ WEB TOYZ ~*~</h1><p>Fun stuff for your browser!!! No downloads!!! (Except one.)</p>${dg()}<div class="wt-menu"><a href="${TU('/dance.html')}"><b>THE ROBOT DANCE</b>Lots of robots. Dancing. Forever.</a><a href="${TU('/talk.html')}"><b>THE TALKING ROBOT</b>It talks! It jokes! It never stops!</a><a href="${TU('/bubble.html')}"><b>BUBBLE WRAP</b>Pop pop pop pop pop.</a><a href="${TU('/dress.html')}"><b>DRESS-A-BLOBBIT</b>Hats! Glasses! A moustache!</a></div><p>Other toys on JackNet: <a href="http://www.hamstercam.webcom/">Hamster Cam</a> &middot; <a href="http://mysticgubbinz.grot/">Mystic Gubbinz</a> &middot; <a href="http://www.babeljack.grot/">Babel Jack</a> &middot; <a href="http://www.newjacks.wubwub/">NewJacks</a></p>`));
  if (window.Sound && Sound.addTune) Sound.addTune('eras_grotdance', { step: 0.13, hats: true,
    lead: [72, 72, 79, 72, 77, 72, 76, 74, 72, 72, 79, 72, 81, 79, 77, 76, 74, 74, 77, 74, 76, 74, 72, 71, 72, 0, 76, 0, 79, 0, 84, -1],
    bass: [48, 48, 53, 53, 48, 48, 55, 55, 50, 50, 53, 53, 48, 55, 48, 48] });
  ES.def(WT, '/dance.html', c => {
    const pals = [null, { u: '#d1007a' }, { u: '#3a9a2a' }, { u: '#ff8a00' }, { u: '#ffd400' }, { u: '#7a3ac8' }];
    c.after.push(() => {
      c.on('.wt-play', 'click', () => { if (!Sound.on) { Sound.on = true; document.dispatchEvent(new Event('sfxchange')); } Sound.music.play('eras_grotdance'); });
      c.on('.wt-stop', 'click', () => Sound.music.stop());
      c.off(() => { if (Sound.music.playing === 'eras_grotdance') Sound.music.stop(); });
    });
    return wtPage(c, `<h1>THE ROBOT DANCE</h1><p>Turn your speakers up!!! Press play!!! Tell your mates!!!</p><p><button class="es-btn wt-play" type="button">&#9654; Play the tune</button> <button class="es-btn wt-stop" type="button">&#9632; Stop</button></p><div class="wt-dance">${Array.from({ length: 40 }, (_, i) => dg(pals[i % pals.length], 4)).join('')}</div><p><small>This page has been passed around by e-mail 4,000 times. Your Mom has probably seen it.</small></p>`);
  });
  const SAYS = ["Why did the robot cross the road? Somebody programmed it to.", 'I am a robot. I live in your computer now.', 'Knock knock. Who\'s there? Interrupting robot. Interrupting ro- BEEP BOOP.', 'Have you saved your work? SAVE YOUR WORK.', 'Your modem is making a noise. That is normal. Probably.', "What do you call a robot with no teef? A gummy robot.", 'I ate the floppy disk. It tasted like 1.44 megabytes.', 'Is it the year 2000 yet? Asking for a toaster.', 'DANGER! DANGER! Sorry. Wrong robot.', 'What is a robot\'s favourite music? Heavy metal.', 'Did you know: I am 90% batteries and 10% more batteries.', 'Mom says it is tea time. Mom is always right.', 'I am Y2K compliant. I do not know what a year is.', 'Click me again. Go on. I dare you.'];
  // the Talking Robot head (the .wt-mouth group is the speaker grille that flaps when it talks)
  const squigHead = `<svg viewBox="0 0 220 200" class="wt-sqsvg" aria-hidden="true"><defs><linearGradient id="wtRbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#c8d0dc"/><stop offset="1" stop-color="#6a7282"/></linearGradient><radialGradient id="wtRbE" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#e0ffff"/><stop offset=".5" stop-color="#30d8ff"/><stop offset="1" stop-color="#0068a0"/></radialGradient></defs><path d="M110 30V12" stroke="#1a1e2a" stroke-width="6"/><circle cx="110" cy="11" r="10" fill="#ff3020" stroke="#1a1e2a" stroke-width="4"/><circle cx="106" cy="7" r="3" fill="#ffc0b0"/><rect x="6" y="80" width="26" height="56" rx="6" fill="#8a92a4" stroke="#1a1e2a" stroke-width="4"/><rect x="188" y="80" width="26" height="56" rx="6" fill="#8a92a4" stroke="#1a1e2a" stroke-width="4"/><rect x="28" y="28" width="164" height="164" rx="26" fill="url(#wtRbG)" stroke="#1a1e2a" stroke-width="5"/><rect x="42" y="38" width="60" height="9" rx="4" fill="#fff" opacity=".8"/><circle cx="44" cy="44" r="4" fill="#5a6272"/><circle cx="176" cy="44" r="4" fill="#5a6272"/><circle cx="44" cy="176" r="4" fill="#5a6272"/><circle cx="176" cy="176" r="4" fill="#5a6272"/><rect x="46" y="58" width="128" height="50" rx="14" fill="#10141c" stroke="#1a1e2a" stroke-width="3"/><circle cx="80" cy="83" r="17" fill="url(#wtRbE)"/><circle cx="140" cy="83" r="17" fill="url(#wtRbE)"/><circle class="wt-eye" cx="83" cy="86" r="7" fill="#003a5a"/><circle class="wt-eye" cx="143" cy="86" r="7" fill="#003a5a"/><circle cx="74" cy="76" r="4" fill="#fff"/><circle cx="134" cy="76" r="4" fill="#fff"/><circle cx="48" cy="140" r="8" fill="#ff6a8a" opacity=".55"/><circle cx="172" cy="140" r="8" fill="#ff6a8a" opacity=".55"/><g class="wt-mouth" style="transform-origin:110px 140px"><rect x="62" y="122" width="96" height="36" rx="8" fill="#10141c" stroke="#1a1e2a" stroke-width="3"/><path d="M74 126v28M86 126v28M98 126v28M110 126v28M122 126v28M134 126v28M146 126v28" stroke="#9aa2b2" stroke-width="5"/></g></svg>`;
  // a round blue Blobbit (Dress-a-Blobbit): the hats, shades, moustache and bow tie sit on it at the same coordinates as before
  const blobHead = `<svg viewBox="0 0 220 200" class="wt-sqsvg" aria-hidden="true"><defs><radialGradient id="wtBbG" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#b0eaff"/><stop offset=".45" stop-color="#3aa0f0"/><stop offset="1" stop-color="#1450a8"/></radialGradient></defs><circle cx="42" cy="46" r="26" fill="#2a80d8" stroke="#0a2a6a" stroke-width="4"/><circle cx="178" cy="46" r="26" fill="#2a80d8" stroke="#0a2a6a" stroke-width="4"/><circle cx="42" cy="46" r="12" fill="#ffb0c8"/><circle cx="178" cy="46" r="12" fill="#ffb0c8"/><ellipse cx="110" cy="112" rx="100" ry="84" fill="url(#wtBbG)" stroke="#0a2a6a" stroke-width="4"/><ellipse cx="64" cy="56" rx="20" ry="10" fill="#fff" opacity=".7" transform="rotate(-30 64 56)"/><ellipse cx="74" cy="82" rx="22" ry="26" fill="#fff" stroke="#000" stroke-width="3"/><ellipse cx="146" cy="82" rx="22" ry="26" fill="#fff" stroke="#000" stroke-width="3"/><circle class="wt-eye" cx="80" cy="88" r="11"/><circle class="wt-eye" cx="140" cy="88" r="11"/><circle cx="76" cy="83" r="4" fill="#fff"/><circle cx="136" cy="83" r="4" fill="#fff"/><ellipse cx="40" cy="124" rx="14" ry="9" fill="#ff5a8c" opacity=".6"/><ellipse cx="180" cy="124" rx="14" ry="9" fill="#ff5a8c" opacity=".6"/><g class="wt-mouth" style="transform-origin:110px 140px"><path d="M78 128q32 40 64 0q-32 10-64 0z" fill="#5a0a20" stroke="#0a2a6a" stroke-width="3"/><ellipse cx="110" cy="146" rx="13" ry="6" fill="#ff6a8a"/></g></svg>`;
  function talker(root, onSay) {
    let n = 0, mt = null;
    const bub = root.querySelector('.wt-bub'), mouth = root.querySelector('.wt-mouth'), voice = root.querySelector('.wt-voice');
    const say = () => {
      const s = SAYS[Math.floor(Math.random() * SAYS.length)]; bub.textContent = ''; let i = 0; clearInterval(mt);
      mt = setInterval(() => { if (!root.isConnected) return clearInterval(mt); i++; bub.textContent = s.slice(0, i); mouth.style.transform = `scaleY(${i % 2 ? 1.4 : 0.7})`; if (i % 3 === 0 && window.Sound && Sound.on) Sound.note(180 + Math.random() * 120, 0.05, 'sawtooth'); if (i >= s.length) { clearInterval(mt); mouth.style.transform = ''; } }, 45);
      try { if (voice && voice.checked && window.speechSynthesis && window.SpeechSynthesisUtterance) { const u = new SpeechSynthesisUtterance(s); u.pitch = 1.8; u.rate = 1.1; speechSynthesis.cancel(); Sound.speak(u); } } catch (e) {}
      n++; if (onSay) onSay(n);
    };
    return { say, stop: () => { clearInterval(mt); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} } };
  }
  ES.def(WT, '/talk.html', c => {
    c.after.push(() => {
      const T = talker(c.q('.wt-talk'), n => { if (n >= 10) c.secret('eras.moose'); });
      c.on('.wt-sq', 'click', T.say); c.on('.wt-say', 'click', T.say); c.off(T.stop);
      c.on('.wt-dl', 'click', () => { c.sfx('click'); if (window.Setup && Setup.has && Setup.download && !Setup.has('squigtalk')) Setup.download('squigtalk'); else A.open('eras.squigtalk'); });
      c.later(T.say, 800);
    });
    return wtPage(c, `<h1>THE TALKING ROBOT</h1><div class="wt-talk"><p class="wt-bub" aria-live="polite">...</p><div class="wt-sq" role="button" tabindex="0" aria-label="Click the robot">${squigHead}</div><p><button class="es-btn wt-say" type="button">Make it talk!</button> <label><input type="checkbox" class="wt-voice"> Real voice (speakers)</label></p></div>
      <p><b>NEW!!!</b> Get the Talking Robot on your DESKTOP! It pops up and tells jokes while you work! <button class="es-btn wt-dl" type="button">Download RoboTalk (112 KB)</button></p>`);
  });
  ES.def(WT, '/bubble.html', c => {
    c.after.push(() => {
      const wrap = c.q('.wt-wrap'), cnt = c.q('.wt-n');
      const fill = () => { wrap.innerHTML = Array.from({ length: 60 }, () => '<button class="wt-b" type="button" aria-label="Bubble"></button>').join(''); cnt.textContent = '0'; };
      fill();
      wrap.addEventListener('click', ev => { const b = ev.target.closest('.wt-b'); if (!b || b.classList.contains('p')) return; b.classList.add('p'); b.setAttribute('aria-label', 'Popped'); const n = c.qa('.wt-b.p').length; cnt.textContent = n; if (window.Sound && Sound.on) Sound.note(900 + Math.random() * 600, 0.03, 'square'); if (n === 60) { c.secret('eras.bubble'); c.sfx('solve'); c.q('.wt-done').textContent = 'YOU POPPED THE WHOLE SHEET!!! Here is another one.'; c.later(fill, 1500); } });
      c.on('.wt-new', 'click', fill);
    });
    return wtPage(c, `<h1>VIRTUAL BUBBLE WRAP</h1><p>Pop them all! It's very relaxing. Your Mom will not hear it (turn the sound on for the full experience).</p><p>Popped: <b class="wt-n">0</b> / 60 <button class="es-btn wt-new" type="button">New sheet</button></p><div class="wt-wrap"></div><p class="wt-done"></p>`);
  });
  const OUTFITS = { hat: ['Top hat', '<rect x="70" y="0" width="80" height="40" fill="#111"/><rect x="50" y="36" width="120" height="10" fill="#111"/><rect x="70" y="28" width="80" height="6" fill="#c00"/>'], party: ['Party hat', '<path d="M110 -20l26 56h-52z" fill="#ff2a6d" stroke="#000" stroke-width="2"/><circle cx="110" cy="-20" r="7" fill="#ffd400"/>'], crown: ['Crown', '<path d="M64 40V8l20 16 26-24 26 24 20-16v32z" fill="#ffd400" stroke="#8a6000" stroke-width="3"/>'], specs: ['Cool shades', '<rect x="44" y="64" width="56" height="30" rx="8" fill="#111"/><rect x="120" y="64" width="56" height="30" rx="8" fill="#111"/><rect x="98" y="72" width="24" height="6" fill="#111"/>'], tash: ['Moustache', '<path d="M110 118c-20-14-50-10-64 4 16 2 24 12 40 10 12-2 18-8 24-12 6 4 12 10 24 12 16 2 24-8 40-10-14-14-44-18-64-4z" fill="#3a2410" stroke="#000"/>'], bow: ['Bow tie', '<path d="M110 186l-30-14v28zM110 186l30-14v28z" fill="#00a0ff" stroke="#000" stroke-width="2"/><circle cx="110" cy="186" r="6" fill="#0060c0"/>'], santa: ['Santa hat', '<path d="M40 38c20-40 90-50 120-10l20 30" fill="#e10600" stroke="#000" stroke-width="2"/><rect x="40" y="30" width="140" height="16" rx="8" fill="#fff" stroke="#000"/><circle cx="182" cy="60" r="10" fill="#fff" stroke="#000"/>'] };
  ES.def(WT, '/dress.html', c => {
    c.after.push(() => {
      const on = store.get('jhp_eras_dress', {}), lay = c.q('.wt-lay');
      const draw = () => { lay.innerHTML = Object.keys(OUTFITS).filter(k => on[k]).map(k => OUTFITS[k][1]).join(''); c.qa('.wt-dress button').forEach(b => b.classList.toggle('on', !!on[b.dataset.k])); store.set('jhp_eras_dress', on); };
      c.qa('.wt-dress button').forEach(b => b.addEventListener('click', () => { on[b.dataset.k] = !on[b.dataset.k]; c.sfx('click'); draw(); }));
      draw();
    });
    return wtPage(c, `<h1>DRESS-A-BLOBBIT</h1><p>Click the clothes to put them on (or take them off). Your Blobbit is saved on this computer!</p><div class="wt-sq" style="height:240px"><svg viewBox="0 -30 220 240" style="width:220px;height:240px" aria-label="Your dressed-up Blobbit">${blobHead.replace(/<svg[^>]*>|<\/svg>/g, '')}<g class="wt-lay"></g></svg></div><div class="wt-dress">${Object.keys(OUTFITS).map(k => `<button class="es-btn" type="button" data-k="${k}">${OUTFITS[k][0]}</button>`).join('')}</div>`);
  });

  // ---------------------------------------------------------------- SQUIGTALK.EXE: the talking squig on your desktop
  window.EraTalk = function () {
    const body = document.createElement('div');
    body.style.cssText = 'background:#ffffc0;text-align:center;padding:6px;font:13px "Comic Sans MS",cursive;height:100%;box-sizing:border-box;overflow:auto';
    body.innerHTML = `<p class="wt-bub" style="display:inline-block;background:#fff;border:2px solid #000;border-radius:14px;padding:4px 10px;min-height:1.5em;margin:4px">Hello! I'm the Talking Robot!</p><div style="width:140px;margin:0 auto;cursor:pointer" class="wt-sqc" role="button" tabindex="0" aria-label="Click the robot">${squigHead.replace('<svg ', '<svg style="width:140px;height:128px" ')}</div><label style="font-size:11px"><input type="checkbox" class="wt-voice"> Real voice</label> <label style="font-size:11px"><input type="checkbox" class="wt-auto" checked> Talk every minute</label>`;
    const w = A.win('RoboTalk', body, { w: 260, h: 290, noMax: true, icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="0" width="2" height="2" fill="#ff3020"/><rect x="7" y="2" width="2" height="1" fill="#1a1e2a"/><rect x="0" y="7" width="2" height="4" fill="#1a1e2a"/><rect x="14" y="7" width="2" height="4" fill="#1a1e2a"/><rect x="2" y="3" width="12" height="12" fill="#1a1e2a"/><rect x="3" y="4" width="10" height="10" fill="#c8d0dc"/><rect x="3" y="4" width="10" height="1" fill="#fff"/><rect x="3" y="4" width="1" height="10" fill="#fff"/><rect x="3" y="13" width="10" height="1" fill="#6a7282"/><rect x="12" y="5" width="1" height="9" fill="#6a7282"/><rect x="4" y="6" width="8" height="3" fill="#10141c"/><rect x="5" y="7" width="2" height="1" fill="#30d8ff"/><rect x="9" y="7" width="2" height="1" fill="#30d8ff"/><rect x="5" y="10" width="6" height="2" fill="#10141c"/><rect x="6" y="10" width="1" height="2" fill="#9aa2b2"/><rect x="8" y="10" width="1" height="2" fill="#9aa2b2"/></svg>' });
    let said = 0; const T = talker(body, () => { said++; if (said >= 10) A.secret('eras.moose'); });
    body.querySelector('.wt-sqc').addEventListener('click', T.say);
    const iv = setInterval(() => { if (w.closed || !body.isConnected) { clearInterval(iv); T.stop(); return; } if (body.querySelector('.wt-auto').checked) T.say(); }, 60000);
    return w;
  };
})();

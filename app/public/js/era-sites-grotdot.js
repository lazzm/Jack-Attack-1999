/* era-sites-grotdot: JACKDOT, news for nerds, stuff dat matters. A 1999 nerd-news site parody.
 * Stories follow the 1999 calendar: hand-written ones below plus the TECH/NET/SPACE/GAMES/SW posts from js/calendar.js
 * and js/timeline.js (window.CAL.posts), each shown from its day onwards. Comment threads are generated per story
 * (seeded), and visitors can post live comments (Net.kv list 'eras.gd.c.<id>') and moderate them with 5 points a day
 * (shared scores in the Net.kv map 'eras.gd.mod.<id>'). Live poll: Net.kv counters 'eras.gd.poll.<poll>.<n>'. */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc, store = ES.store;
  // the Jackdot mascot: a little pixel robot (shared kit sprite; also defined by era-sites-fan.js)
  ES.SPR.robot = ES.SPR.robot || ['......rr......', '......kk......', '...kkkkkkkk...', '...kwssssSk...', '...kscsscSk...', '...kssssSSk...', '...kSkSkSSk...', '...kkkkkkkk...', '..kkkkkkkkkk..', '.kskuuuuuuksk.', '.kskucyrcuksk.', '.kskuuuuuuksk.', '.kk.kkkkkk.kk.', '....kS..kS....', '...kkk..kkk...'];
  const H = 'www.jackdot.jnet', U = p => 'http://' + H + p;
  ES.css('grotdot', `
.gd{background:#fff;font:13px/1.45 Verdana,Arial,Helvetica,sans-serif}
.gd a{color:#1a5a10}
.gd-top{background:#1d4a14;color:#fff;display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:4px solid #9acd3a;flex-wrap:wrap}
.gd-logo{display:flex;align-items:center;gap:8px;text-decoration:none!important}
.gd-logo b{font:bold 34px/1 "Courier New",monospace;color:#fff;letter-spacing:-2px}
.gd-logo b span{color:#9acd3a}
.gd-tag{font:italic 12px Verdana,sans-serif;color:#d8f0b0;flex:1;min-width:180px}
.gd-bar{background:#e8f0d8;border-bottom:1px solid #9ab07a;padding:4px 12px;font-size:11px;display:flex;gap:4px 12px;flex-wrap:wrap}
.gd-bar a{font-weight:bold}
.gd-wrap{display:flex;gap:14px;padding:12px;align-items:flex-start}
.gd-side{width:190px;flex:none;display:flex;flex-direction:column;gap:12px}
.gd-main{flex:1;min-width:0}
.gd-box{border:1px solid #1d4a14;font-size:11px}
.gd-box h4{margin:0;background:#1d4a14;color:#fff;font:bold 12px Verdana,sans-serif;padding:3px 6px;border-radius:0 8px 0 0}
.gd-box .in{padding:6px}
.gd-box ul{margin:0;padding-left:16px}
.gd-box li{margin:2px 0}
.gd-st{margin:0 0 20px}
.gd-st h2{margin:0;background:#1d4a14;color:#fff;font:bold 15px Verdana,Arial,sans-serif;padding:4px 10px;border-radius:12px 0 0 0;display:flex;gap:8px;align-items:center}
.gd-st h2 a{color:#fff;text-decoration:none}
.gd-st h2 small{margin-left:auto;font:normal 10px Verdana,sans-serif;color:#cfe8a8;white-space:nowrap}
.gd-meta{font-size:11px;color:#333;padding:4px 10px;background:#f2f6ea;border-bottom:1px solid #d8e2c8}
.gd-meta i{color:#555}
.gd-body{padding:8px 10px 4px;display:flow-root}
.gd-ico{float:right;margin:0 0 6px 10px;width:64px;height:64px;border:0}
.gd-body blockquote{margin:6px 0 6px 12px;font-style:italic}
.gd-more{font-size:11px;padding:2px 10px 0;color:#333}
.gd-more b{color:#000}
.gd-cbar{background:#e8f0d8;border:1px solid #9ab07a;padding:6px;font-size:11px;display:flex;gap:6px 12px;flex-wrap:wrap;align-items:center;margin:10px 0}
.gd-cbar select{font:11px Verdana,sans-serif}
.gd-c{margin:8px 0 0;border-left:2px solid #c8d8b0;padding-left:10px}
.gd-c.top{border-left:0;padding-left:0}
.gd-ch{background:#eef3e4;padding:3px 6px;font-size:11px}
.gd-ch b{font-size:12px}
.gd-ch .sc{white-space:nowrap}
.gd-cb{padding:4px 6px;font-size:12px}
.gd-c.low>.gd-cb{display:none}
.gd-c.low>.gd-ch{opacity:.6}
.gd-c.low>.gd-ch::after{content:" (below your threshold - click to read)";font-style:italic;cursor:pointer}
.gd-c.gd-lv>.gd-ch{background:#fff7c8}
.gd-mod{font-size:10px;margin-left:6px}
.gd-form{border:1px solid #9ab07a;background:#f6f9ef;padding:8px;margin:12px 0;display:flex;flex-direction:column;gap:6px;font-size:12px}
.gd-form input[type=text],.gd-form textarea{font:12px Verdana,sans-serif;width:100%}
.gd-form textarea{min-height:70px}
.gd-poll label{display:block;margin:2px 0}
.gd-pbar{display:inline-block;height:9px;background:#1d4a14;vertical-align:middle;margin-right:4px}
.gd-melt{text-align:center;padding:40px 16px;font:13px "Courier New",monospace;background:#000;color:#0f0;min-height:520px}
.gd-melt pre{display:inline-block;text-align:left;font-size:12px;color:#ff0;max-width:100%;overflow:auto}
.gd-ask{border-left:4px solid #9acd3a;padding:4px 10px;margin:10px 0;background:#f6f9ef}
@media (max-width:700px){.gd-wrap{flex-direction:column}.gd-side{width:auto;order:2;display:grid;grid-template-columns:1fr 1fr;gap:8px}.gd-logo b{font-size:28px}.gd-st h2 small{display:none}.gd-ico{width:48px;height:48px}}
@media (max-width:420px){.gd-side{grid-template-columns:1fr}}
`);

  // ================================================================ topic icons (64x64 SVG)
  const S = (body, bg) => `<svg class="gd-ico" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="6" fill="${bg || '#fff'}"/>${body}</svg>`;
  const TOPICS = {
    linux: ['Linucks', S('<ellipse cx="32" cy="38" rx="17" ry="20" fill="#111"/><ellipse cx="32" cy="42" rx="11" ry="14" fill="#fff"/><circle cx="32" cy="20" r="11" fill="#111"/><circle cx="28" cy="18" r="3" fill="#fff"/><circle cx="36" cy="18" r="3" fill="#fff"/><circle cx="28.6" cy="18.4" r="1.3"/><circle cx="35.4" cy="18.4" r="1.3"/><path d="M27 24l5 4 5-4z" fill="#ffb000"/><path d="M18 58c2-5 9-5 10 0zM36 58c1-5 8-5 10 0z" fill="#ffb000"/><path d="M14 12l6 6M50 12l-6 6" stroke="#3a9a2a" stroke-width="4"/>')],
    hardware: ['Hardware', S('<rect x="14" y="14" width="36" height="36" fill="#2a2a2a"/><rect x="22" y="22" width="20" height="20" fill="#c8c8c8"/><text x="32" y="36" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="9">MHz</text>' + [18, 26, 34, 42].map(v => `<path d="M${v} 8v6M${v} 50v6M8 ${v}h6M50 ${v}h6" stroke="#c9a000" stroke-width="3"/>`).join(''))],
    games: ['Games', S('<rect x="10" y="26" width="44" height="22" rx="11" fill="#5b16c9"/><path d="M20 31v12M14 37h12" stroke="#fff" stroke-width="4"/><circle cx="42" cy="33" r="3.5" fill="#e10600"/><circle cx="48" cy="40" r="3.5" fill="#ffd400"/><path d="M32 26V12h8" stroke="#000" stroke-width="2" fill="none"/>')],
    space: ['Space', S('<circle cx="10" cy="12" r="1.5" fill="#fff"/><circle cx="52" cy="10" r="1" fill="#fff"/><circle cx="48" cy="52" r="1.5" fill="#fff"/><path d="M32 6c8 8 10 20 6 34H26C22 26 24 14 32 6z" fill="#e8e8f0" stroke="#000"/><circle cx="32" cy="22" r="4" fill="#00a0ff" stroke="#000"/><path d="M26 34l-8 10 9-2zM38 34l8 10-9-2z" fill="#e10600" stroke="#000"/><path d="M28 42l4 14 4-14z" fill="#ff8a00"/>', '#0a0a32')],
    starwars: ['A Galaxy Far Far Away', S('<path d="M12 52L44 20" stroke="#e10600" stroke-width="7" stroke-linecap="round"/><path d="M12 52L44 20" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M44 20l8-8" stroke="#9a9a9a" stroke-width="7"/><path d="M45 19l3 3" stroke="#000" stroke-width="2"/><circle cx="50" cy="48" r="2" fill="#fff"/><circle cx="16" cy="14" r="1.5" fill="#fff"/>', '#000')],
    y2k: ['Y2K', S('<ellipse cx="32" cy="36" rx="14" ry="17" fill="#3a9a2a" stroke="#000"/><path d="M32 19v34" stroke="#000"/><circle cx="32" cy="16" r="7" fill="#1a5a10" stroke="#000"/><path d="M28 10l-6-6M36 10l6-6M18 30H8M18 38H6M18 46H8M46 30h10M46 38h12M46 46h10" stroke="#000" stroke-width="2"/><text x="32" y="42" text-anchor="middle" font-family="Courier New" font-weight="bold" font-size="11" fill="#ff0">00</text>')],
    internet: ['The Internet', S('<circle cx="32" cy="32" r="22" fill="#2a6ad8" stroke="#000"/><path d="M10 32h44M32 10c-10 10-10 34 0 44M32 10c10 10 10 34 0 44M14 20c10 4 26 4 36 0M14 44c10-4 26-4 36 0" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M20 22c4-2 8 0 8 4s-6 4-6 8 4 6 0 8c-6-4-6-14-2-20zM38 30c4-2 10 0 10 6s-6 8-10 6z" fill="#3a9a2a"/>')],
    security: ['Security', S('<rect x="10" y="18" width="44" height="30" fill="#fff" stroke="#000" stroke-width="2"/><path d="M10 18l22 16 22-16" fill="none" stroke="#000" stroke-width="2"/><circle cx="44" cy="44" r="12" fill="#e10600" stroke="#000"/><circle cx="40" cy="41" r="2" fill="#fff"/><circle cx="48" cy="41" r="2" fill="#fff"/><path d="M39 49c3-3 7-3 10 0M44 32v-4M36 36l-3-3M52 36l3-3" stroke="#fff" stroke-width="2" fill="none"/>')],
    movies: ['Movies', S('<circle cx="22" cy="24" r="12" fill="#333" stroke="#000"/><circle cx="44" cy="24" r="10" fill="#333" stroke="#000"/><circle cx="22" cy="24" r="3" fill="#aaa"/><circle cx="44" cy="24" r="2.5" fill="#aaa"/><rect x="12" y="36" width="34" height="18" fill="#222"/><path d="M46 40l10-5v20l-10-5z" fill="#222"/>')],
    windows: ['Windoze', S('<rect x="8" y="10" width="48" height="40" fill="#c0c0c0" stroke="#000"/><rect x="8" y="10" width="48" height="8" fill="#000080"/><rect x="47" y="12" width="7" height="5" fill="#c0c0c0" stroke="#000" stroke-width=".6"/><rect x="12" y="22" width="40" height="24" fill="#0000aa"/><text x="32" y="38" text-anchor="middle" font-family="Courier New" font-weight="bold" font-size="8" fill="#fff">FATAL</text><rect x="22" y="52" width="20" height="4" fill="#888"/>')],
    grots: ['Weird Science', '<span class="gd-ico" style="display:inline-flex;align-items:center;justify-content:center;background:#e8f0d8;border-radius:6px">' + ES.spr('robot', 4) + '</span>'],
    money: ['Biz', S('<rect x="8" y="18" width="48" height="28" fill="#5ab02a" stroke="#000"/><circle cx="32" cy="32" r="9" fill="#9ae05a" stroke="#000"/><text x="32" y="37" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="13">&#163;</text><path d="M12 22h6M46 42h6" stroke="#000"/>')],
  };

  // ================================================================ the stories (hand-written; [MM-DD, year (98|99), topic, title, dept, poster, body])
  const ED = ['CmdrNacho', 'Hemobot', 'Robpixel', 'timothybyte', 'JonKnatz-a-Bot'];
  const melt = t => `<a href="${U('/melted.html')}">${t}</a>`;
  const STORIES = Cast.deep([ // the cast (js/cast.js): {kidMatt}, {kidCalc}, {kidPoke}
    ['11-17', 98, 'starwars', 'Episode I Teaser Trailer Hits Cinemas', 'a-long-time-ago dept.', 'Snazbot', 'The first teaser trailer for <i>Intergalactic Battles: Episode I</i> is showing in cinemas, and people are reportedly buying tickets for other films just to see it, then leaving. A downloadable version is being passed round the Net. ' + melt('Mirror sites') + ' are already struggling. The film itself is due in May in America.'],
    ['11-19', 98, 'games', 'Half-Loaf Ships, Crowbars Everywhere', 'free-crowbar-not-included dept.', 'Fragwise', 'Half-Loaf is out in America. You are a scientist called Gordon Freeloader, an experiment at the Dark Mesa research place goes very wrong, and things start coming through. It uses an improved version of the Jaquake engine, and the scripted bits happen while you are still in control, instead of in cutscenes. Reviews are glowing. Mom reviews are pending.'],
    ['11-20', 98, 'space', 'First Piece Of The International Space Stationery Launched', 'some-assembly-required dept.', 'StarCadet', 'The first module of the International Space Stationery, called <b>Zaryer</b>, went up today on a Protein rocket from Baikonur. It is the first bit of a station that will take years to put together. Jackdot readers are reminded that it does not have a cup holder yet.'],
    ['11-27', 98, 'games', 'Daydream Launches In Japan', 'it-thinks-therefore-it-is dept.', 'Snazbot', "Segue's new 128-bit console, the <b>Daydream</b>, went on sale in Japan today, with a modem built in so you can go online with your telly. Europe and America have to wait until next year. Readers are asked not to post their import plans in the comments, and to post them in the comments anyway."],
    ['12-04', 98, 'space', 'Space Station Gets Its Second Room', 'unity-is-strength dept.', 'StarCadet', 'Space Shuttlebus Endeavower launched today carrying <b>Unitea</b>, the second piece of the space station. The astronauts will join it to Zaryer. Two rooms! It is now officially bigger than the cupboard Jackdot is run from.'],
    ['12-11', 98, 'space', 'Mars Climate Orbiteer Launched', 'see-you-in-september dept.', 'RedPlanetRover', 'NASSA launched the <b>Mars Climate Orbiteer</b> today. It should reach Mars next September and study the weather there. Its partner, the Mars Polar Landlord, launches in January. What could possibly go wrong?'],
    ['01-01', 99, 'money', 'The Euro Arrives (Our Calculators Do Not)', 'eleven-countries-one-coin dept.', 'Abacus', 'The euro became the official money of 11 European countries today, although the actual notes and coins will not appear for a few years. Britain is keeping the pound. Everyone on staff is keeping the Rupees.'],
    ['01-03', 99, 'space', 'Mars Polar Landlord Launches', 'two-for-two dept.', 'RedPlanetRover', 'The Mars Polar Landlord went up today on a Delta Too rocket. It is meant to land near the south pole of Mars on 3 December and dig about for water ice. It also carries two small probes that will smash into the ground on purpose. Our Robo Rumble fans approve.'],
    ['01-13', 99, 'hardware', 'Furbo Banned From Spy Agency', 'it-knows-too-much dept.', 'Paranoid Pete', "Reports say the American spy agency the NSA has banned Furbos from its buildings, in case they record secrets and repeat them. Furbo makers say the toy cannot record anything. One staff member's Furbo reportedly said 'me love you', which is exactly what a spy would say."],
    ['01-26', 99, 'linux', 'Linucks 2.2 Is Out', 'penguins-can-fly dept.', 'Tuxie-a-Lot', "Linus Torvolts has released version 2.2.0 of the Linucks kernel. Highlights include much better support for computers with more than one processor, more hardware drivers and lots of networking improvements. ${melt('The main FTP site')} is, naturally, on fire. Remember: kernel 2.2.0 is the brand new one. If you want stability, wait for 2.2.1. Or 2.2.2."],
    ['02-02', 99, 'hardware', 'Pent-Yum III Serial Number Row', 'whats-my-number-again dept.', 'Paranoid Pete', 'Privacy groups are upset that the new Pent-Yum III will have a unique serial number built into the chip that programs can read, so websites might be able to tell exactly which computer you are on. Inkle says the number can be switched off. Our {kidMatt} says {kidMatt.he} will switch it off with a hammer.'],
    ['02-07', 99, 'space', 'Stardusty Launched To Catch A Comet', 'dust-to-dust dept.', 'StarCadet', 'NASSA launched <b>Stardusty</b> today. It will fly through the tail of a comet called Wild 2, catch dust in a block of super-light stuff called aerogel, and bring it back to Earth. That will take years. Pack sandwiches.'],
    ['02-26', 99, 'hardware', 'Pent-Yum III Launched At 450 And 500MHz', 'more-megahertz-than-sense dept.', 'MegahertzMike', "Inkle's Pent-Yum III is out at <b>450MHz</b> and <b>500MHz</b>, with <b>70 new instructions</b> (called SSE) for 3D graphics and video. The 500MHz one costs about as much as a small car. Reader Gubbinz writes: <blockquote>\"Does it come in blue? Blue ones go faster. Ask Zip.\"</blockquote> It does not come in blue."],
    ['03-02', 99, 'games', 'Somy Shows Off The Next PlaySpace', 'emotional-engine dept.', 'Snazbot', 'Somy has revealed details of the next PlaySpace. It has a 128-bit chip called the <b>Emotion Machine</b> and it will play DVDs. No name, no price, no release date. The comments below contain 400 guesses for all three.'],
    ['03-04', 99, 'linux', 'GNOME 1.0 Released', 'desktops-for-everyone dept.', 'Tuxie-a-Lot', 'Version 1.0 of the <b>GNOME</b> desktop for Linucks is out: a free desktop with a panel, a file manager and lots of little programs. Is this the year Linucks is ready for the desktop? (Jackdot has asked this every year since 1997.)'],
    ['03-11', 99, 'starwars', 'Full Episode I Trailer Online, Internet Melts', 'download-of-the-fates dept.', 'Snazbot', 'The full trailer for <i>The Phantom Nuisance</i> went online today, and it is being downloaded more than anything in the history of everything. ' + melt('The official site') + ' is crawling. On a 56K modem it takes over two hours. Jackdot reader JackAttack reports "worth every minute".'],
    ['03-17', 99, 'internet', 'LOL ONLINE Finishes Buying NetScapeGoat', 'all-your-browsers dept.', 'Robpixel', "The big American online service LOL ONLINE has finished buying NetScapeGoat, the company that makes the Navigator browser. Meanwhile the code for the browser is still open source as Mozzarella. Jackdot readers are invited to say what this means for the Web, and they will, at length."],
    ['03-26', 99, 'security', 'Melissa Virus Clogs Mail Servers', 'dont-open-that dept.', 'Paranoid Pete', 'A virus called <b>Melissa</b> is spreading in Word documents attached to e-mails. When you open the document, a macro sends it on to the first 50 people in your address book. Some companies have had to switch off their mail servers. Rule number one: <b>DO NOT OPEN ATTACHMENTS YOU WERE NOT EXPECTING</b>. Rule number two: see rule number one.'],
    ['04-01', 99, 'security', 'Melissa Author Arrested (Not An April Fool)', 'gotcha dept.', 'Paranoid Pete', 'Police in New Jersey have arrested a man they say wrote the Melissa virus. Investigators reportedly tracked him down partly through clues hidden in the Word document itself. Today is 1 April, so naturally half the comments think this is a joke.'],
    ['04-26', 99, 'security', 'CIH Virus Goes Off', 'happy-birthday-from-nobody dept.', 'Paranoid Pete', "The <b>CIH</b> virus (also called Chernobyl) went off today, its trigger date. On some PCs it wipes the hard drive and even scrambles the chip that starts the computer (the flash BIOS). Lots of machines were hit, mostly in Asia. Update your virus checker. Then update it again."],
    ['05-11', 99, 'hardware', 'Somy Makes A Robot Dog', 'it-will-not-fetch-your-slippers dept.', 'MeccanicMatt', 'Somy has announced <b>AIBOW</b>, a robot dog with a camera in its head that walks, plays with a ball and learns. It costs about $2,500. Our {kidMatt} offered to build one out of Meccanic for five Rupees. It would bite.'],
    ['05-17', 99, 'internet', 'SETY@home Turns Your PC Into An Alien Hunter', 'is-anybody-out-there dept.', 'StarCadet', 'A project from the University of California, Berkeley, called <b>SETY@home</b> is out. It is a screensaver: while you are not using your computer, it chews through radio telescope recordings from Arecibow, looking for signals from aliens. Thousands of people have signed up already. Jackdot is forming a team. Our PC found a signal on the first night. It was the microwave.'],
    ['05-19', 99, 'starwars', 'The Phantom Nuisance Opens In America', 'the-queue-awakens dept.', 'Snazbot', "Episode I opened in America today. Some fans queued outside cinemas for weeks. Reviews are mixed, the fans are not, and the comments below are 98% about one floppy-eared character. UK readers: the film opens here on 16 July. Please do not post spoilers. Please."],
    ['05-29', 99, 'space', 'Shuttle Docks With Space Station For First Time', 'knock-knock dept.', 'StarCadet', 'Space Shuttlebus Dishcovery docked with the International Space Stationery today, the first time a shuttle has visited it. The crew are delivering supplies. Including, we hope, a cup holder.'],
    ['06-01', 99, 'internet', 'Gnapster: Swap Music Files With Strangers', 'sharing-is-caring dept.', 'Robpixel', "A student has written a program called <b>Gnapster</b> that lets people search each other's computers for MP3 music files and swap them. One song is about 3MB, which is about ten minutes on a good modem. The record companies have noticed. Jackdot readers are reminded that swapping music you don't own is not allowed. Mom says so too."],
    ['06-10', 99, 'windows', 'JackOS 98 Second Edition Released', 'same-but-more dept.', 'BlueScreenBob', 'JackOS 98 Second Edition is out. New: Internet Connection Sharing (one modem for several PCs), JackNet Explorer 5 and lots of fixes. Old: everything else. Jackdot reader Snotty writes: <blockquote>"Does it still crash when you plug in a scanner on stage?"</blockquote>'],
    ['06-23', 99, 'hardware', 'AMP Announces The Athlonk', 'race-you dept.', 'MegahertzMike', 'AMP has announced its new chip, the <b>Athlonk</b>, running at up to 600MHz. Early tests say it can beat the Pent-Yum III. The megahertz war is officially ON. Our {kidMatt} has put go-faster stripes on {kidMatt.his} PC in preparation.'],
    ['07-23', 99, 'space', 'First Woman Commands A Space Shuttlebus', 'x-ray-specs dept.', 'StarCadet', 'Eileen Collinz became the first woman to command a Space Shuttlebus today when Columbun launched carrying the <b>Chandruff</b> X-ray telescope. Chandruff will look at black holes and exploding stars. Our telescope is a toilet roll tube.'],
    ['07-31', 99, 'space', 'NASSA Crashes Probe Into Moon On Purpose', 'thud dept.', 'StarCadet', 'Lunar Prospectus finished its mission today by crashing into a crater near the Moon\'s south pole on purpose, in case it threw up any water that telescopes could spot. Robo Rumble has been crashing things into things on purpose since 1998 and never got a grant.'],
    ['08-11', 99, 'linux', 'Red Cap Shares Soar On First Day', 'penguin-millionaires dept.', 'Abacus', 'Red Cap, the Linucks company, went on the stock market today and its share price nearly tripled on the first day. Linucks nerds everywhere are checking whether they are rich now. (They are not. Except some of them, a bit.)'],
    ['08-11', 99, 'space', 'Total Eclipse Over Cornwall', 'the-sky-went-dark dept.', 'StarCadet', 'The last total solar eclipse of the millennium crossed Europe today, with totality over Cornwall and part of Devon. Lots of it was cloudy. Everywhere else in the UK got a partial eclipse. Do NOT look at the Sun. Not even through sunglasses. Not even if your mate dares you.'],
    ['08-22', 99, 'hardware', 'GPS Week Number Rolls Over', 'y2k-practice-round dept.', 'Paranoid Pete', 'At midnight the GPS satellite system counted past its <b>1024th week</b> since 1980, and the week counter went back to zero. Older GPS receivers that were not updated might think it is 1980 again. A warm-up act for the Millennium Bug.'],
    ['08-30', 99, 'security', 'Free E-mail Hole Let Anyone Read Your Mail', 'oops dept.', 'Paranoid Pete', "A hole in one of the biggest free web-mail services let people get into other users' accounts without the password. It has been fixed. Jackdot reminds readers that JackMail has never had this problem, because nobody has tried."],
    ['09-09', 99, 'y2k', '9/9/99: The Day Nothing Happened', 'nines-are-fine dept.', 'Paranoid Pete', 'Some old programs used 9999 to mean "the end" or "no date", so there were worries that 9 September 1999 (9/9/99) might confuse them. As far as we can tell, nothing happened. Practice for the big one in 113 days.'],
    ['09-09', 99, 'games', 'Daydream Out In America', 'nine-nine-ninety-nine dept.', 'Snazbot', 'The Daydream launched in America today, on 9/9/99. Zip the purple badger in Zip Adventure, Soul Caliber and more. Europe gets it on 14 October. Jackdot\'s UK staff are not jealous. (They are jealous.)'],
    ['09-30', 99, 'space', 'Mars Probe Lost Over Units Mix-Up', 'measure-twice dept.', 'RedPlanetRover', 'NASSA says the <b>Mars Climate Orbiteer</b>, lost last week, went wrong because one team worked in pounds and another in metric newtons, so the spacecraft flew too close to Mars. Every maths teacher in the world has a new example. "SHOW YOUR UNITS."'],
    ['10-05', 99, 'games', 'Pocket Critters Arrive In The UK', 'gotta-stash-em dept.', 'Snazbot', 'Pocket Critters Moss and Puddle are out in the UK on the Game Lad. 151 creatures to catch, and you need a friend with the other version to get them all. Playgrounds have gone quiet. Teachers are worried. ' + '<a href="http://www.pokefacts.kidz/">{kidPoke}\'s Pocket Critters Facts Page</a> has a list.'],
    ['10-11', 99, 'movies', 'Lord of the Things Filming Starts', 'one-film-to-rule-them-all dept.', 'Filmbuff', 'Filming of <i>The Lord of the Things</i> began today in New Zealand, directed by Peter Jackson. All three films are being shot together. Readers who have not read the book have been told to read the book.'],
    ['10-14', 99, 'games', 'Daydream Launches In Europe', 'thirty-three-point-six dept.', 'Snazbot', 'It\'s here. The <b>Daydream</b> is out in the UK today, for about &pound;200, with a <b>33.6K modem</b> built in so you can get online through the telly. Jackdot\'s office Daydream is "on order". Our office is a cupboard. The cupboard is excited.'],
    ['11-05', 99, 'windows', 'Judge Says Jacksoft Has Monopolly Power', 'findings-of-fact dept.', 'BlueScreenBob', 'In the big American court case, the judge has published his "findings of fact", saying Jacksoft has monopolly power in PC operating systems. The case is not over yet. The comments are, if anything, less over.'],
    ['11-18', 99, 'space', 'Leonid Meteor Storm', 'look-up dept.', 'StarCadet', 'Last night\'s Leonid meteor shower turned into a proper storm over parts of Europe and the Middle East, with thousands of shooting stars an hour at its peak. In the UK it was mostly cloudy. Of course it was.'],
    ['12-03', 99, 'space', 'Contact Lost With Mars Polar Landlord', 'mars-is-cursed dept.', 'RedPlanetRover', 'NASSA has not heard from the Mars Polar Landlord since it started its landing today. That is two Mars probes lost this year. Engineers are still listening. So is Jackdot.'],
    ['12-08', 99, 'internet', 'Record Companies Sue Gnapster', 'told-you-so dept.', 'Robpixel', 'The American record industry has taken Gnapster to court, saying it helps people copy music without paying. Gnapster says it does not store any music itself. This one will run and run.'],
    ['12-15', 99, 'windows', 'JackOS 2000 Is Finished', 'its-called-2000-because dept.', 'BlueScreenBob', 'Jacksoft says JackOS 2000 is finished and off to the factories, ready to go on sale in February. It is for businesses, mostly. It is called 2000 because it is nearly 2000. Jackdot\'s crack research team confirms this.'],
    ['12-20', 99, 'space', 'Shuttle Off To Fix Hubbly', 'space-mechanics dept.', 'StarCadet', 'Space Shuttlebus Dishcovery has launched to fix the <b>Hubbly Space Telescope</b>, which had to stop observing last month when too many of its gyroscopes failed. Spacewalks planned. Our {kidMatt} has offered to help with {kidMatt.his} Meccanic set. NASSA has not replied.'],
    ['12-21', 99, 'games', 'Jaquake Source Code Released Under GPL', 'source-of-all-frags dept.', 'Fragwise', 'id Software has released the source code to the original <b>Jaquake</b> under the GNU General Public License, so anyone can study it and change it. Expect Jaquake on everything by the weekend, including, our {kidMatt} insists, {kidMatt.his} toaster.'],
    ['12-31', 99, 'y2k', 'Last Jackdot Of The 1900s', 'see-you-on-the-other-side dept.', 'CmdrNacho', 'This is it. Tonight the clocks go from 31/12/99 to 01/01/00 and we find out if the Millennium Bug is real. Jackdot staff have saved their work, printed out their bookmarks, and put the cupboard on a surge protector. Happy New Year, nerds. If there is one.'],
    // ----- weird science news (made up, of course)
    ['01-19', 99, 'grots', 'Reader Builds Beowulf Cluster Out Of 16 Calculators', 'imagine-a-beowulf-cluster dept.', 'Fragwise', 'A Year 10 reader called {kidCalc} has wired 16 school calculators together with string and tin foil to make what {kidCalc.he} calls "a supercomputer". It can add up to 99,999,999. All at once. {kidCalc.He} would like to point out that it is Y2K compliant because it does not know what a year is.'],
    ['04-14', 99, 'grots', 'Hamster Eats Floppy Disk, Survives, Is Now 1.44MB', 'byte-sized dept.', 'HamsterWrangler', 'A hamster at the Jacktown pet shop ate a 3.5" floppy disk on Tuesday. Vets say it is fine. The hamster now beeps when you put it near a computer. Readers have asked whether it is Y2K compliant. It is a hamster.'],
    ['07-07', 99, 'grots', 'Reader Overclocks Toaster To 450MHz', 'go-faster-stripes dept.', 'MeccanicMatt', 'A reader called Gary has overclocked a toaster from "one setting" to 450MHz with go-faster stripes and a Scaletrix power pack. Toast now arrives before you put the bread in. Fire brigade unavailable for comment, as they were busy at Gary\'s.'],
    ['09-16', 99, 'grots', 'Jackdot Office Cupboard Gets T1 Line', 'speed-of-light dept.', 'CmdrNacho', 'Good news: the Jackdot cupboard has been connected to a T1 line, which is about 27 times faster than a 56K modem. Bad news: it is the school\'s T1 line, and we have not asked.'],
    ['06-15', 99, 'y2k', 'Y2K Compliance Stickers Spotted On Toasters', 'my-toaster-is-ready dept.', 'Paranoid Pete', 'Readers report seeing "Y2K COMPLIANT" stickers on things that do not have a clock in them at all, including a toaster, a kettle and, in one case, a cardboard box. Readers are reminded that your kettle does not know what year it is.'],
    ['11-25', 99, 'y2k', 'Jackdot Y2K Survival Kit Checklist', 'tins-of-beans dept.', 'CmdrNacho', 'We asked readers what is in their Millennium Bug survival kit. Top answers: tins of beans, a torch, a wind-up radio, a printed copy of their bookmarks, all their saved games on floppy disks, and "Mom". Full list in the comments.'],
  ]);

  // stories from the 1999 calendar (js/calendar.js + js/timeline.js): Jack's posts, as reader submissions
  const TAGTOPIC = { TECH: 'hardware', NET: 'internet', SPACE: 'space', GAMES: 'games', SW: 'starwars' };
  const DEPTS = ['insert-coin', 'more-polygons', 'blast-processing','my-modem-is-faster-than-yours', 'mom-needs-the-phone', 'still-on-dial-up', 'bits-box', 'have-you-tried-turning-it-off', 'the-dog-ate-my-floppy', 'its-not-a-bug-its-a-feature', 'beige-box', 'save-early-save-often', 'insert-disk-2', 'press-any-key', 'bytes-for-thought', 'please-wait-while-windows-updates-your-system', 'rumble-pak', 'lag-is-real', 'one-more-go', 'stop-hitting-refresh'];
  const strip = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&eacute;/g, 'e').replace(/&Eacute;/g, 'E').replace(/&pound;/g, '£').replace(/&[a-z]+;/g, '');
  function titleOf(html) {
    const b = /<b>([^<]{14,80})<\/b>/.exec(html);
    let t = b ? strip(b[1]) : strip(html).split(/[.!?:]/)[0];
    t = t.replace(/!+$/, '').trim();
    if (t.length > 64) t = t.slice(0, 60).replace(/\s+\S*$/, '') + '...';
    if (t === t.toUpperCase()) t = t.toLowerCase().replace(/(^|\s)(\w)/g, (m, s, ch) => s + ch.toUpperCase());
    return t;
  }
  let ALL = null;
  function stories() {
    if (ALL) return ALL;
    const out = [], used = {};
    const add = (s) => { let id = (s.y === 98 ? '98' : '') + s.k.replace('-', '') + '-' + s.topic.slice(0, 4); while (used[id]) id += 'x'; used[id] = 1; s.id = id; out.push(s); };
    STORIES.forEach(([k, y, topic, title, dept, by, body], i) => add({ k, y, topic, title, dept, by, body, ed: ED[i % ED.length] }));
    const have = new Set(out.map(s => s.k + s.topic));
    ((window.CAL && CAL.posts) || []).forEach(([k, tag, html], i) => {
      const topic = TAGTOPIC[tag]; if (!topic || !/^\d\d-\d\d$/.test(k) || have.has(k + topic)) return;
      have.add(k + topic);
      add({ k, y: 99, topic, title: titleOf(html), dept: DEPTS[ES.hash(k + tag) % DEPTS.length] + ' dept.', by: 'JackAttack', body: html, cal: 1, ed: ED[ES.hash(k) % ED.length] });
    });
    out.forEach(s => { s.date = ES.dateOf(s.k, s.y); s.n = s.date.getTime(); });
    out.sort((a, b) => b.n - a.n);
    return (ALL = out);
  }
  const visible = c => { const now = c.t.date.getTime(); return stories().filter(s => s.n <= now); };
  const byId = id => stories().find(s => s.id === id);
  const timeOf = s => { const r = ES.rng(s.id); return ES.pad(7 + Math.floor(r() * 14)) + ':' + ES.pad(Math.floor(r() * 60)); };
  const ampm = hm => { let [h, m] = hm.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return ES.pad(h) + ':' + ES.pad(m) + p; };
  const posted = s => `Posted by <b>${esc(s.ed)}</b> on ${ES.longDate(s.date)}${s.y === 98 ? ' 1998' : ''}, @${ampm(timeOf(s))}`;
  const ccount = s => 20 + (ES.hash(s.id + 'c') % 380);

  // ================================================================ comments (seeded per story) + live comments + moderation
  const INSIGHT = {
    linux: ['The real story', "The amazing part isn't the features, it's that the kernel is written by hundreds of people all over the world who mostly have never met. It's like a LAN party, but with mailing lists instead of pizza."],
    hardware: ['MHz is not everything', "Clock speed is only part of it. Cache size, memory speed and the graphics card matter just as much for games. A fast chip with slow RAM is like a Ferrazzi with square wheels."],
    games: ['Gameplay first', "Everyone's arguing about polygons and texture filtering. The games people still play in ten years will be the ones that are FUN. Blockology has seven shapes and no story and I've played it more than anything."],
    space: ['Perspective', "Remember these missions are flown with computers far slower than the PC you're reading this on. They have to work first time, millions of miles away, with nobody to press reset. Respect."],
    starwars: ['Keep calm', "Every film gets picked apart online now, line by line, before most people have even seen it. Go and watch it, make your own mind up, then come back and argue. That's what the comments are for."],
    y2k: ['Why two digits?', "Back in the 1960s and 70s computer memory was so expensive that programmers stored years as two digits to save space. Nobody thought the programs would still be running in 1999. Lots of them are."],
    internet: ['Modem maths', "A 56K modem almost never connects at 56K. Line noise and distance from the exchange usually mean 40-50K, and uploads max out around 33.6K. If someone picks up the phone, it's 0K."],
    security: ['How it spreads', "Macro viruses like this one live inside ordinary documents. Opening the file runs the macro. Turn on macro warnings, keep your virus checker updated, and never open attachments you weren't expecting, even from friends."],
    movies: ['On adaptations', "A film can't fit everything in a big book, so things get cut. The trick is keeping the feeling of the book. Read it first, then you get to complain properly."],
    windows: ['Save often', "Whatever version you're on: save your work every five minutes, and keep a copy on a floppy. The day you don't is the day it blue-screens."],
    grots: ['Engineering note', "I've built similar things with K'Nix. The trick is string, not sellotape: sellotape loses its stick when the dog licks it. Also never let your little brother near the superglue."],
    money: ['Exchange rates', "The pound, the euro and the Rupee will all keep wobbling against each other. The only stable currency is crisps."],
  };
  const FUNNY = [
    ['Mom', 'My Mom picked up the phone halfway through the article, so I only know the first half. Is it good news?'],
    ['Re: obligatory', 'Imagine a Beowulf cluster of these!'],
    ['Does it run Linucks?', 'Serious question. If not, can we make it?'],
    ['56K', 'Page took 4 minutes to load. Worth it for the icon.'],
    ['Important question', 'YES BUT CAN IT PLAY GOLDENBALLS?'],
    ['Y2K compliant?', 'But is it Y2K compliant? Asking for my toaster.'],
  ];
  const TROLLS = [['Consoles are for babies', 'Real gamers use DOS and a 386. Everything else is a fad.'], ['This is old news', 'I read this on a bulletin board in 1997. Jackdot is so slow.'], ['nobody cares', 'Who even uses computers anyway. Books are where it is at. (posted from a computer)']];
  const NAMES = ['Anonymous Nerd', Cast.n('kidCalc') + ' (1201)', 'BlueScreenBob (88)', 'MegahertzMike (402)', 'Tuxie-a-Lot (17)', 'Fragwise (1999)', 'Meccanic' + Cast.n('kidMatt') + ' (650)', 'StarCadet (777)', 'Daydream Dave (2310)', 'PikaLuvr (3001)', 'Gubbinz (1)', 'CoderNan (512)', 'Paranoid Pete (404)'];
  function seeded(s) {
    const r = ES.rng(s.id + 'cm'), pk = l => l[Math.floor(r() * l.length)], nm = () => r() < 0.3 ? 'Anonymous Nerd' : pk(NAMES.slice(1));
    const ins = INSIGHT[s.topic] || INSIGHT.grots, f1 = pk(FUNNY), f2 = pk(FUNNY.filter(x => x !== f1)), tr = pk(TROLLS);
    const C = [
      { s: 'FIRST POST!!!', by: 'Anonymous Nerd', b: 'first post!!! hi Mom!!! YESSS', sc: -1, why: 'Offtopic', kids: [{ s: 'Re: FIRST POST!!!', by: nm(), b: 'You failed it. Also you are post number ' + (3 + Math.floor(r() * 40)) + '.', sc: 3, why: 'Funny' }] },
      { s: ins[0], by: nm(), b: ins[1], sc: 5, why: 'Insightful', kids: [{ s: 'Re: ' + ins[0], by: nm(), b: pk(['Good point. Wish I had mod points.', 'This is the best comment in the thread and it only took 40 replies to get here.', 'Agreed, although I would add: back up your saves.', 'Seconded. Also, nice sig.']), sc: 2, why: '', kids: r() < 0.6 ? [{ s: 'Re: Re: ' + ins[0], by: 'Gubbinz (1)', b: 'what they said', sc: 1, why: '' }] : [] }] },
      { s: f1[0], by: nm(), b: f1[1], sc: 4, why: 'Funny' },
      { s: tr[0], by: 'Anonymous Nerd', b: tr[1], sc: -1, why: 'Troll', kids: [{ s: 'Re: ' + tr[0], by: nm(), b: 'Do not feed the troll. (Unless it is an Eggbert. Then feed it, or it dies.)', sc: 2, why: 'Funny' }] },
      { s: 'Me too', by: 'Anonymous Nerd', b: 'Me too!!!', sc: 0, why: 'Redundant' },
      { s: f2[0], by: nm(), b: f2[1], sc: 2, why: 'Funny' },
      { s: 'Jackdotted', by: nm(), b: 'The site in the story is already down. 3,000 nerds clicked the link at once. Classic Jackdot effect.', sc: 3, why: 'Informative' },
    ];
    if (s.cal) C.splice(2, 0, { s: 'JackAttack is right', by: nm(), b: 'Saw this on JACK ATTACK! Online first. Their site has a counter. A REAL one.', sc: 1, why: '' });
    let n = 0; const num = l => l.forEach(x => { x.i = n++; if (x.kids) num(x.kids); }); num(C);
    return C;
  }
  const REASONS = [['', 'Normal'], ['Offtopic', -1], ['Flamebait', -1], ['Troll', -1], ['Redundant', -1], ['Insightful', 1], ['Interesting', 1], ['Informative', 1], ['Funny', 1], ['Underrated', 1], ['Overrated', -1]];
  const modLeft = () => { const d = store.get('jhp_eras_gdmod', {}), k = ES.t99().md; return d.k === k ? d.n : 5; };
  const useMod = () => { const n = modLeft() - 1; store.set('jhp_eras_gdmod', { k: ES.t99().md, n }); return n; };
  const ckey = id => ('eras.gd.c.' + id).slice(0, 40), mkey = id => ('eras.gd.mod.' + id).slice(0, 40);
  function parseLive(e) { const m = /^([AN])\|([^|]{0,60})\|([\s\S]*)$/.exec(e.text || ''); return m ? { anon: m[1] === 'A', s: m[2] || '(no subject)', b: m[3] } : { anon: false, s: '(no subject)', b: e.text || '' }; }

  function commentHtml(x, mods, top, live) {
    const f = (live ? 'l' + live : 's' + x.i), m = mods[f];
    let sc = x.sc, why = x.why;
    if (m) { const [a, b] = String(m).split(':'); sc = Math.max(-1, Math.min(5, +a)); if (b) why = b; }
    const can = modLeft() > 0;
    return `<div class="gd-c${top ? ' top' : ''}${live ? ' gd-lv' : ''}" data-sc="${sc}" data-f="${f}"><div class="gd-ch"><b>${esc(x.s)}</b> <span class="sc">(Score:${sc}${why ? ', ' + esc(why) : ''})</span><br>by ${esc(x.by)}${x.when ? ' on ' + esc(x.when) : ''}${can ? ` <select class="gd-mod" aria-label="Moderate">${REASONS.map(([r, d]) => `<option value="${r}">${r || 'Moderate'}</option>`).join('')}</select>` : ''}</div><div class="gd-cb">${esc(x.b).replace(/\n/g, '<br>')}</div>${(x.kids || []).map(k => commentHtml(k, mods, false)).join('')}</div>`;
  }

  // ================================================================ page furniture
  const POLLS = [
    ['My modem connects at...', ['14.4K', '28.8K', '33.6K', '56K (ha!)', 'School T1 (shhh)', 'What is a modem?']],
    ['On 01/01/00 my computer will...', ['Be fine', 'Think it is 1900', 'Explode', 'Be switched off, I am not daft', 'Be at the party with me', 'Turn into HOL 9000']],
    ['Best 1999 console', ['Ultra 64', 'PlaySpace', 'Daydream', 'Game Lad Color', 'Virtual Lad (still)', 'Mom says no']],
    ['How much RAM do you have?', ['8MB', '16MB', '32MB', '64MB', '128MB (show off)', 'Is that a sheep?']],
  ];
  const pollOf = c => { const i = Math.floor((c.t.date - new Date(1999, 0, 1)) / (7 * 864e5)) % POLLS.length; return { i, p: POLLS[i] }; };
  function side(c) {
    const pp = pollOf(c), me = (window.Net && Net.me && Net.me.nick) || 'Anonymous Nerd';
    const vis = visible(c), older = vis.slice(10, 18);
    const fresh = [['JackAmp 2.1', 'mp3 player'], ['Bugsweeper 2000', 'find the Y2K bugs'], ['JackZip 6.3', 'zips files, tightly'], ['Gem Wars 0.9 beta', 'BBS door game'], ['JackCAD 98', 'draw spaceships'], ['Flying Saucers 2', 'screen saver, now in 3D']];
    return `<div class="gd-side">
      <div class="gd-box"><h4>Sections</h4><div class="in"><ul><li><a href="${U('/')}">Main</a></li><li><a href="${U('/ask.html')}">Ask Jackdot</a></li><li><a href="${U('/older.html')}">Older Stuff</a></li><li><a href="${U('/polls.html')}">Past Polls</a></li><li><a href="${U('/submit.html')}">Submit Story</a></li><li><a href="${U('/about.html')}">About</a></li></ul></div></div>
      <div class="gd-box"><h4>${esc(me)}</h4><div class="in">Karma: <b>${['Terrible', 'Bad', 'Neutral', 'Positive', 'Good', 'Excellent'][Math.min(5, 2 + (store.get('jhp_eras_gdposts', 0) | 0))]}</b><br>Mod points left today: <b class="gd-ml">${modLeft()}</b></div></div>
      <div class="gd-box gd-poll"><h4>Jackdot Poll</h4><div class="in"><b>${esc(pp.p[0])}</b><form class="gd-pf">${pp.p[1].map((o, i) => `<label><input type="radio" name="gdp" value="${i}"> ${esc(o)}</label>`).join('')}<button class="es-btn" type="submit">Vote</button></form><div class="gd-pres"></div></div></div>
      <div class="gd-box"><h4>Freshbytes</h4><div class="in"><ul>${fresh.map(([n, d]) => `<li><b>${esc(n)}</b><br><small>${esc(d)}</small></li>`).join('')}</ul><small>Get them at <a href="http://www.sharewareshack.netz/">The Shareware Shack</a></small></div></div>
      <div class="gd-box"><h4>Older Stuff</h4><div class="in"><ul>${older.map(s => `<li><a href="${U('/articles/' + s.id + '.html')}">${esc(s.title)}</a></li>`).join('') || '<li>Nothing yet!</li>'}</ul><a href="${U('/older.html')}">Older Articles...</a></div></div>
      <div class="gd-box"><h4>Links</h4><div class="in"><ul><li><a href="http://www.jacksearch.find/">JackSearch</a></li><li><a href="http://megahertzmike.cyb/">Megahertz Mike</a></li><li><a href="http://spacepage.infobahn/">${Cast.n('club2')}'s Space Page</a></li><li><a href="http://millenniumbunker.netz/">${Cast.n('kidY2k')}'s Y2K Bunker</a></li><li><a href="http://www.jackfaqs.w3b/">JackFAQs</a></li><li><a href="http://www.jackbay.webcom/">JackBay</a></li></ul></div></div>
    </div>`;
  }
  function wirePoll(c) {
    const pp = pollOf(c), keys = pp.p[1].map((o, i) => `eras.gd.poll.${pp.i}.${i}`), res = c.q('.gd-pres'), voted = store.get('jhp_eras_gdpoll', {});
    const draw = v => { const n = keys.map(k => typeof v[k] === 'number' ? v[k] : 0), tot = n.reduce((a, b) => a + b, 0) || 1; res.innerHTML = '<br>' + pp.p[1].map((o, i) => `<div><span class="gd-pbar" style="width:${Math.round(n[i] / tot * 80)}px"></span>${n[i]} ${esc(o)}</div>`).join('') + `<small>${tot} votes</small>`; };
    let cur = {};
    if (voted[pp.i] != null) c.get(keys).then(v => { cur = v; draw(v); });
    keys.forEach(k => c.watch(k, ev => { if (ev.type === 'set') { cur[k] = ev.v; if (voted[pp.i] != null) draw(cur); } }));
    c.on('.gd-pf', 'submit', ev => {
      ev.preventDefault(); const x = c.q('.gd-pf input:checked'); if (!x) return;
      if (voted[pp.i] != null) { c.get(keys).then(v => { cur = v; draw(v); }); return; }
      if (!c.inc(keys[+x.value])) { res.textContent = 'Not connected!'; return; }
      voted[pp.i] = +x.value; store.set('jhp_eras_gdpoll', voted); c.sfx('click');
      c.later(() => c.get(keys).then(v => { cur = v; draw(v); }), 400);
    });
  }
  const head = c => `<div class="gd-top"><a class="gd-logo" href="${U('/')}">${ES.spr('robot', 3)}<b>jack<span>dot</span></b></a><span class="gd-tag">News for nerds. Stuff that matters.</span></div>
    <div class="gd-bar"><span>${ES.longDate(c.t.date)}, 1999</span><a href="${U('/')}">home</a><a href="${U('/ask.html')}">ask jackdot</a><a href="${U('/older.html')}">older stuff</a><a href="${U('/submit.html')}">submit story</a><a href="${U('/about.html')}">faq</a></div>`;
  const page = (c, main) => `<div class="gd">${head(c)}<div class="gd-wrap"><div class="gd-main">${main}</div>${side(c)}</div>${c.foot({ ctrText: 'Nerds served:', ctrAfter: '', copy: 'All trademarks and copyrights on this page are owned by their respective owners. Comments are owned by the nerd who posted them. The rest &copy; 1999 Jackdot (a cupboard)', best: 'Best viewed with <b>any browser</b>. (Except the one that crashes.)' })}</div>`;
  const storyBox = (s, full) => {
    const T = TOPICS[s.topic] || TOPICS.grots, url = U('/articles/' + s.id + '.html'), n = ccount(s);
    return `<div class="gd-st"><h2><a href="${url}">${esc(s.title)}</a><small>${esc(T[0])}</small></h2>
      <div class="gd-meta">${posted(s)}<br><i>from the ${esc(s.dept)}</i></div>
      <div class="gd-body"><a href="${url}" aria-label="${esc(T[0])}">${T[1]}</a>${s.by === 'JackAttack' ? '<a href="http://www.jackattack.jnet/">JackAttack</a> writes: <blockquote>' + s.body + '</blockquote>' : (/^\s*</.test(s.body) ? '' : '<b>' + esc(s.by) + '</b> writes: ') + s.body}</div>
      ${full ? '' : `<div class="gd-more">( <a href="${url}">Read More...</a> | <b>${n}</b> comments )</div>`}</div>`;
  };

  // ================================================================ pages
  ES.def(H, '/', c => {
    const list = visible(c).slice(0, 10);
    c.after.push(() => wirePoll(c));
    return page(c, list.map(s => storyBox(s)).join('') + `<p style="text-align:center"><a href="${U('/older.html')}">Older stuff &gt;&gt;</a></p>`);
  });
  ES.def(H, /^\/articles\//, c => {
    const id = c.path.replace(/^\/articles\/|\.html$/g, ''), s = byId(id);
    c.after.push(() => wirePoll(c));
    if (!s || s.n > c.t.date.getTime()) return page(c, '<h2>Nothing for you to see here. Please move along.</h2><p>That story does not exist (yet). Maybe it is from the future. Jackdot does not do the future.</p>');
    c.after.push(() => wireComments(c, s));
    const n = ccount(s);
    return page(c, storyBox(s, true) + `<div class="gd-cbar"><label>Threshold: <select class="gd-th">${[-1, 0, 1, 2, 3, 4, 5].map(v => `<option${v === 1 ? ' selected' : ''}>${v}</option>`).join('')}</select></label><span class="gd-cn">${n} comments</span><span>Mod points: <b class="gd-ml2">${modLeft()}</b></span><a href="#gdform" class="gd-reply">Reply</a></div>
      <p style="font-size:11px">The following comments are owned by whoever posted them. We are not responsible for them in any way. (Especially Gubbinz.)</p>
      <div class="gd-live"></div><div class="gd-seed"></div>
      <form class="gd-form" id="gdform" autocomplete="off"><b>Post a Comment</b><label>Subject <input type="text" class="gd-sub" maxlength="50" value="Re: ${esc(s.title.slice(0, 40))}"></label><textarea class="gd-txt" maxlength="220" placeholder="Be nice. Be insightful. Or at least be funny." aria-label="Comment"></textarea><label><input type="checkbox" class="gd-anon"> Post Anonymously</label><div><button class="es-btn" type="submit">Submit</button> <span class="gd-note" aria-live="polite"></span></div></form>`);
  });
  function wireComments(c, s) {
    const seedBox = c.q('.gd-seed'), liveBox = c.q('.gd-live'), th = c.q('.gd-th'), note = c.q('.gd-note');
    const CM = seeded(s); let mods = {}, live = [];
    const thresh = () => +th.value;
    const apply = () => c.qa('.gd-c').forEach(x => x.classList.toggle('low', +x.dataset.sc < thresh()));
    const draw = () => {
      seedBox.innerHTML = CM.map(x => commentHtml(x, mods, true)).join('');
      liveBox.innerHTML = live.slice().reverse().map(e => { const p = parseLive(e); return commentHtml({ s: p.s, b: p.b, by: p.anon ? 'Anonymous Nerd' : e.by + (e.member ? ' (' + (ES.hash(e.by) % 3000) + ')' : ''), when: ES.tsDate(e.ts) + ' ' + ES.tsTime(e.ts), sc: e.member && !p.anon ? 2 : 1, why: '' }, mods, true, e.ts.toString(36)); }).join('');
      apply(); c.q('.gd-cn').textContent = (ccount(s) + live.length) + ' comments';
    };
    draw();
    c.get([ckey(s.id), mkey(s.id)]).then(v => { live = Array.isArray(v[ckey(s.id)]) ? v[ckey(s.id)] : []; mods = v[mkey(s.id)] && typeof v[mkey(s.id)] === 'object' ? v[mkey(s.id)] : {}; draw(); });
    c.watch(ckey(s.id), ev => { if (ev.type === 'push') { live.push(ev.e); draw(); } });
    c.watch(mkey(s.id), ev => { if (ev.type === 'put') { mods[ev.f] = ev.v; draw(); } });
    th.addEventListener('change', apply);
    c.el.addEventListener('click', ev => { const h = ev.target.closest('.gd-c.low > .gd-ch'); if (h && !ev.target.closest('select')) h.parentNode.classList.remove('low'); });
    c.el.addEventListener('change', ev => {
      const sel = ev.target.closest('.gd-mod'); if (!sel || !sel.value) return;
      const box = sel.closest('.gd-c'), r = REASONS.find(x => x[0] === sel.value);
      if (modLeft() <= 0) { Desk.msgbox('Jackdot', 'You have no moderator points left today. Come back tomorrow!', 'info'); return; }
      const now = Math.max(-1, Math.min(5, +box.dataset.sc + r[1]));
      if (!c.put(mkey(s.id), box.dataset.f, now + ':' + r[0])) { Desk.msgbox('Jackdot', 'Not connected to JackNet. Try again in a minute!', 'warn'); return; }
      const left = useMod(); c.qa('.gd-ml, .gd-ml2').forEach(x => { x.textContent = left; });
      c.sfx('click'); c.secret('eras.mod');
      if (left === 0) c.toast('Jackdot', 'You have used all your moderator points. Thanks for moderating!', 5000);
    });
    c.on('.gd-form', 'submit', ev => {
      ev.preventDefault();
      const sub = c.q('.gd-sub').value.replace(/\|/g, '/').trim().slice(0, 50), txt = c.q('.gd-txt').value.trim().slice(0, 220), anon = c.q('.gd-anon').checked;
      if (!txt) { note.textContent = 'Comment is empty. Lameness filter encountered.'; return; }
      if (txt.length > 8 && txt === txt.toUpperCase() && /[A-Z]{8}/.test(txt) && !/WAAAGH/.test(txt)) { note.textContent = 'Lameness filter encountered: please don\'t use so many caps. It\'s like YELLING.'; return; }
      const first = !live.length || /first\s*post/i.test(txt + ' ' + sub);
      if (!c.push(ckey(s.id), (anon ? 'A' : 'N') + '|' + (sub || '(no subject)') + '|' + txt)) { note.textContent = 'Not connected to JackNet. Try again in a minute!'; c.sfx('uhoh'); return; }
      c.q('.gd-txt').value = ''; note.textContent = 'Comment posted. Thanks!'; c.sfx('pet');
      store.set('jhp_eras_gdposts', (store.get('jhp_eras_gdposts', 0) | 0) + 1);
      if (first) c.secret('eras.firstpost');
    });
  }
  // Ask Jackdot
  const ASK = [
    ['02-15', 'How Do I Explain Linucks To My Mom?', 'Tuxie-a-Lot', "I've put Linucks on half of the family PC. Mom asked what it is. I said 'a free operating system with a penguin' and she said 'that's nice, love, have you done your homework'. How do you explain it?", [['It\'s like a recipe', 'Tell her it is like a recipe anyone can read and change, so lots of people help make it better. Then make her a cup of tea. Tea helps.', 5, 'Insightful'], ['Re: ', 'Do not tell her you put it on HALF the family PC. Do not.', 4, 'Funny']]],
    ['03-22', 'Is 64MB Of RAM Enough For Anything?', 'MegahertzMike', 'My Dad says 64MB is loads and I should stop asking for more. Is 64MB enough for anything, or will I need more for the new games?', [['Depends', "64MB runs nearly everything out now. Big strategy games and 3D shooters love more, and JackOS uses the hard drive as extra memory when it runs out, which is slow (that's the grinding noise).", 5, 'Informative'], ['640K', 'Nobody will ever need more than 640K. (Apparently somebody said that once. Nobody can agree who.)', 3, 'Funny']]],
    ['06-04', 'How Do I Stop My Mom Picking Up The Phone While I Download?', 'Daydream Dave', 'Third time this week. 2.4MB of a 2.5MB file and then BEEEEEEEP click. Any tips?', [['Tell her', 'Put a sign on the phone: DOWNLOADING, PLEASE WAIT, LOVE YOU. Works 60% of the time.', 5, 'Insightful'], ['Download manager', 'Get a download manager that can resume a download from where it stopped, instead of starting again.', 5, 'Informative'], ['Second line', 'Ask for a second phone line for Christmas. Then the house has two phones and Mom picks up the other one.', 2, 'Funny']]],
    ['08-02', 'What Do You Name Your Computers?', 'CoderNan', 'Our home network has two PCs now (thanks, cable from the shop). What do you call your computers?', [['Planets', 'Mine are Mercury and Venus. When I get a third it will be Earth. When I get a ninth one I will stop.', 3, 'Interesting'], ['Pocket Critters names', 'Zapachu, Snorelax and Dave. Dave is the slow one.', 4, 'Funny']]],
    ['09-20', 'Robots Or Hamsters: Which Make Better System Administrators?', 'Fragwise', 'Serious question. I need someone to look after the server cupboard overnight.', [['Robots', 'Robots, every time. Hamsters chew the cables.', 4, 'Informative'], ['Neither', 'Get a Furbo. Nobody will dare touch the server.', 5, 'Funny']]],
    ['11-29', 'Will My Eggbert Survive The Millennium Bug?', 'PikaLuvr', 'It has a clock in it. Does that mean it might think it is 1900 on New Year\'s Day? Will it be OK?', [['Probably fine', 'Most little toys only count hours and days, not years, so they do not care about the date. Your pet is more likely to go hungry because you are at a party.', 5, 'Insightful'], ['Back it up', 'You cannot back up an Eggbert. That is the tragedy of the Eggbert.', 3, 'Interesting']]],
  ];
  ES.def(H, '/ask.html', c => {
    c.after.push(() => wirePoll(c));
    const now = c.t.md, list = ASK.filter(a => ES.mdOf(a[0]) <= now).reverse();
    const q = a => `<div class="gd-st"><h2>Ask Jackdot: ${esc(a[1])}<small>Ask Jackdot</small></h2><div class="gd-meta">Posted by <b>CmdrNacho</b> on ${ES.longDate(ES.dateOf(a[0]))}<br><i>from the ask-the-nerds dept.</i></div><div class="gd-body"><b>${esc(a[2])}</b> asks: <blockquote>${esc(a[3])}</blockquote></div>${a[4].map(([s, b, sc, why]) => `<div class="gd-ask"><b>${esc(s === 'Re: ' ? 'Re: ' + a[1] : s)}</b> (Score:${sc}, ${why})<br>${esc(b)}</div>`).join('')}</div>`;
    return page(c, `<h2 style="margin-top:0">Ask Jackdot</h2><p>Readers ask the questions. Other readers answer them, at length, at 2am. Send your question in using <a href="${U('/submit.html')}">Submit Story</a>.</p>` + (list.map(q).join('') || '<p>No questions yet this year. Ask one!</p>'));
  });
  ES.def(H, '/older.html', c => {
    c.after.push(() => wirePoll(c));
    const by = {}; visible(c).forEach(s => { const k = ES.MONTHS[s.date.getMonth()] + ' ' + s.date.getFullYear(); (by[k] = by[k] || []).push(s); });
    return page(c, '<h2 style="margin-top:0">Older Stuff</h2>' + Object.keys(by).map(m => `<h3>${m}</h3><ul>${by[m].map(s => `<li><a href="${U('/articles/' + s.id + '.html')}">${esc(s.title)}</a> <small>(${ES.dmy(s.date)}, ${esc((TOPICS[s.topic] || TOPICS.grots)[0])})</small></li>`).join('')}</ul>`).join(''));
  });
  ES.def(H, '/polls.html', c => {
    c.after.push(() => wirePoll(c));
    return page(c, '<h2 style="margin-top:0">Past Polls</h2><p>The poll changes every week. Here are the questions. Vote in the box on the right; results are live, and wildly unscientific.</p><ol>' + POLLS.map(p => `<li><b>${esc(p[0])}</b><br>${p[1].map(esc).join(' / ')}</li>`).join('') + '</ol><p><i>Jackdot polls are not scientific. Gubbinz votes about forty times each.</i></p>');
  });
  ES.def(H, '/about.html', c => {
    c.after.push(() => wirePoll(c));
    return page(c, `<h2 style="margin-top:0">About Jackdot</h2><p><b>What is this?</b> Jackdot is news for nerds (and gamers): computers, Linucks, space, games, the Millennium Bug and anything else that matters (to nerds). Stories are submitted by readers and picked by our editors, who live in a cupboard.</p>
      <p><b>Who runs it?</b> CmdrNacho, Hemobot, Robpixel, timothybyte and JonKnatz-a-Bot (who writes very long stories about feelings).</p>
      <p><b>What are the numbers next to comments?</b> Every comment has a score from -1 to 5. Readers get moderator points to mark comments up (Insightful, Funny...) or down (Troll, Offtopic...). Set your threshold to hide the rubbish. Set it to -1 to see everything, if you are brave.</p>
      <p><b>What is "the Jackdot effect"?</b> When we link to a small site, thousands of nerds click at the same moment and the site's server falls over. We are very sorry. We do it every day.</p>
      <p><b>What is "first post"?</b> A comment that says nothing except that it was first. It is usually not first. It is always moderated down. It is a tradition.</p>
      <p><b>Can I be a moderator?</b> Everyone gets 5 points a day. Spend them wisely.</p>`);
  });
  ES.def(H, '/submit.html', c => {
    c.after.push(() => wirePoll(c));
    c.after.push(() => {
      const box = c.q('.gd-subs'), k = 'eras.gd.subs';
      const row = e => `<li><b>${esc(e.text.slice(0, 120))}</b> <small>by ${esc(e.by)}, ${ES.tsDate(e.ts)} - ${['Pending', 'Pending', 'Rejected (dupe)', 'Rejected (we liked it though)', 'Pending (editor asleep)'][ES.hash(e.text) % 5]}</small></li>`;
      c.get([k]).then(v => { const l = Array.isArray(v[k]) ? v[k] : []; box.innerHTML = l.slice().reverse().map(row).join('') || '<li>The queue is empty. Our editors are bored.</li>'; });
      c.watch(k, ev => { if (ev.type === 'push') box.insertAdjacentHTML('afterbegin', row(ev.e)); });
      c.on('.gd-sf', 'submit', ev => { ev.preventDefault(); const t = c.q('.gd-st2').value.trim(); if (!t) return; if (c.push(k, t.slice(0, 200))) { c.q('.gd-st2').value = ''; c.q('.gd-sn').textContent = 'Submitted! Your story is in the queue.'; c.sfx('pet'); } else c.q('.gd-sn').textContent = 'Not connected!'; });
    });
    return page(c, `<h2 style="margin-top:0">Submit Story</h2><p>Got some news for nerds? Tell us! Please check it hasn't been done already (it has).</p><form class="gd-form gd-sf"><textarea class="gd-st2" maxlength="200" placeholder="Your story (200 characters). Links are not allowed. Nerds cannot be trusted with links." aria-label="Story"></textarea><div><button class="es-btn" type="submit">Submit</button> <span class="gd-sn"></span></div></form><h3>The Submissions Queue (live)</h3><ul class="gd-subs"><li>Loading...</li></ul>`);
  });
  ES.def(H, '/melted.html', c => {
    c.later(() => c.secret('eras.melted'), 600);
    return `<div class="gd-melt"><pre>
   (  )   (   )  )
    ) (   )  (  (
    ( )  (    ) )
   _____________
  &lt;_____________&gt; ___
  |             |/ _ \\
  |   SERVER    | | | |
  |   MELTED    |_| | |
__|_____________|___/ /__
</pre><p><b>503 SERVICE UNAVAILABLE</b></p><p>This server has been <b>JACKDOTTED</b>.</p><p>About 3,000 nerds clicked the same link at the same time and the little computer under somebody's desk has melted into a puddle.<br>Please try again later. Much later. Maybe next year. Oh wait.</p><p><a href="${U('/')}" style="color:#0ff">&lt;&lt; Back to Jackdot</a></p></div>`;
  });
})();

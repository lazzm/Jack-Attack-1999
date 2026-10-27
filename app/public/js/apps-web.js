/* apps-web: "The 1999 Web". A huge hidden web of personal homepages inside JackNet Explorer, all at jacklm.com/<word>
 * or jacklm.com/~name. This always-loaded part only registers the page words, the search index stubs, the shared
 * widgets (live hit counters, live guestbooks, the Biscuit Ring webring, MIDI boxes), secrets, Favorites and files.
 * The page bodies live in js/web-p1..p4.js and js/web-search.js and load the first time you visit one of them. */
(function () {
  const A = window.Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = l => l[Math.floor(Math.random() * l.length)];

  // ================================================================ the manifest: word -> { title, file, category, description, ring, host, path }
  // Jack's own hidden pages live at jacklm.com/<word>. Everyone else's site lives on its own made-up 1999 domain
  // (fake TLDs that only exist inside JackNet Explorer): typing the address, clicking a link, the webring, search
  // results and Favorites all go there. "~name" typed on jacklm.com shows a "this page has moved" redirect.
  // The people are the visitor's own cast (js/cast.js): titles, descriptions, hosts and paths are Cast templates, so Cousin
  // Kim's page might be Cousin Vicky's at www.vickyspopzone.kidz. The site WORD ('~kim') never changes: it keys the shared
  // counters and guestbooks, and it plus the old address (www.kimspopzone.kidz, /~tom/) keep working as aliases.
  const M = {}, CT = s => window.Cast ? Cast.t(s) : s;
  const OLDN = {}; if (window.Cast) for (const k of Object.keys(Cast.OLD)) if (!OLDN[Cast.OLD[k]]) OLDN[Cast.OLD[k]] = k; // id -> the name it used to be
  const oldT = s => String(s).replace(/\{([a-zA-Z0-9]+)\.slug\}/g, (m, id) => OLDN[id] || m);
  const P = (w, t, f, cat, d, ring, host, path) => { const p = host ? (path || '/') : '/' + w; M[w] = { w, t: CT(t), f, cat, d: CT(d), ring: !!ring, host: CT(host || ''), path: CT(p) }; if (oldT(host || '') !== (host || '') || oldT(p) !== p) M[w].old = { host: oldT(host || ''), path: oldT(p) }; };
  const HP = 'members.homepagez.webcom'; // the free homepage host everyone's on
  // file 1: mates and family
  P('~dave', "DAVE'S KOOL PAGE 2: TOTAL CARNAGE", 1, 'mates', 'Bedroom Championship Wrestling! Starring Dave, his cat Mr Tiddles and a beanbag.', 1, 'www.davesplace.jnet');
  P('~kim', "*~* {cousin}'s PoP PaRaDiSe *~*", 1, 'mates', "Cousin {cousin}'s pop music page. Glitter, charts, band posters and a slambook.", 1, 'www.{cousin.slug}spopzone.kidz');
  P('knitting', 'Tuesday Knit & Natter Club', 1, 'mates', "Jack's Mom's knitting club. Patterns, natter and how to switch the computer on.", 1, 'knitandnatter.homepagez');
  P('poetree', "GUBBINZ PO-ETREE KORNER", 1, 'mates', 'Poems by Gubbinz, the little green helper. Very moving. Some of them moved off the page.', 1, HP, '/~gubbinz/');
  P('computerclub', 'Computer Club - Room 14', 1, 'hobby', 'The school computer club. Thursdays after school. Turtle drawing, rules and the club printer.', 1, 'room14.cyb');
  P('~stu', 'THE MOULDY TANGERINES - Official Site', 1, 'mates', "{kidBand}'s band: the worst band in the world (official). Gigs, the line-up, the setlist and the demo tape.", 1, 'www.mouldytangerines.wubwub');
  P('~nan', "Nan's Recipe Corner", 1, 'mates', "Nan's recipes, typed in by Nan, in CAPITALS, with one finger.", 1, 'nansrecipes.homepagez');
  P('~biscuit', "WOOF! Biscuit's Homepage", 1, 'mates', "Dave's dog has a homepage now. It's about sticks.", 1, HP, '/~biscuit/');
  P('~kevin', "Kevin's Pet Rock Page (NEW ADDRESS!!)", 1, 'fun', 'The pet rock page has moved! Meet Rocky. Rocky does not do much.', 1, 'www.petrock.netz');
  P('~tom', "{kidSoon}'s Page", 1, 'weird', 'Coming soon!!! (since 1997)', 1, HP, '/~{kidSoon.slug}/');
  P('~lee', "{club3}'s Yo-Yo Trick Zone", 1, 'hobby', 'Yo-yo tricks with diagrams: the sleeper, walk the dog, around the world and more.', 1, 'www.yoyozone.kidz');
  P('rovers', 'Rovers Juniors FC', 1, 'hobby', 'Our Sunday league football team. Results, the squad and the oranges rota.', 1, 'roversjuniors.jnet');
  // file 2: fan pages and hobbies
  P('~ellie', "{kidPoke}'s Pocket Critters Facts Page", 2, 'fans', 'All 151! Facts about Pocket Critters Moss and Puddle, gym badges, types and trading.', 1, 'www.pokefacts.kidz');
  P('~blockhead', 'THE OTHER BLOCK SHRINE', 2, 'fans', 'A Blockology shrine. Better than the other one (it says). Facts, history and the 7 pieces.', 1, 'blockshrine.w3b');
  P('cubetimes', 'The Cube Speed Records Page', 2, 'hobby', 'Rubrick\'s Cube facts and records, plus a live stopwatch league for visitors.', 1, 'www.cuberecords.infobahn');
  P('~zed', "{club1.NAME}'S SCI-FI FILM ZONE", 2, 'fans', 'Original reviews of the sci-fi films of 1999. Stars out of five. Spoilers kept to a minimum.', 1, 'www.scifizone.cyb');
  P('~gaz', "{kidY2k.NAME}'S MILLENNIUM COUNTDOWN BUNKER", 2, 'weird', 'The Millennium Bug is coming. {kidY2k} is ready. Are you? Live countdown inside.', 1, 'millenniumbunker.netz');
  P('top100cheats', 'TOP 100 CHEATS!!! (well, 40)', 2, 'games', 'Cheats for PC and console games, plus cheats for real life (they do not work).', 1, 'www.cheatz.w3b');
  P('~mike', "Megahertz Mike's Upgrade Diary", 2, 'sci', 'From 300 MHz to 450 MHz: one boy, one screwdriver, one very worried Dad.', 1, 'megahertzmike.cyb');
  P('~mek', "Snaz's Miniature Painting Tips", 2, 'hobby', 'How to paint minis: Space Mariners, Elder, Gorks, AirMix pilots, plus the bits box and dry-brushing.', 1, 'www.orkpaint.grot');
  P('~ash', "{club2}'s Space Page", 2, 'sci', 'Planets, the 1999 eclipse, the space station, meteor showers and a constellation maker.', 1, 'spacepage.infobahn');
  P('fanfic', 'The Fan-Fiction Archive', 2, 'fun', 'Short stories by JackNet readers. Pocket Critters, robots, floppy disks and the Millennium Bug.', 1, 'www.fanficarchive.w3b');
  P('ascii', 'ASCII ART GALLERY', 2, 'fun', 'Art made of letters. Cats, rockets, Z-wings and a banner maker.', 1, 'asciigallery.netz');
  P('midi', 'MIDI HEAVEN', 2, 'fun', 'Nothing but MIDI. Press play. Turn the speakers up. Sorry, Mom.', 1, 'www.midiheaven.wubwub');
  // file 3: a galaxy far, far away
  P('~sam', "{kidEp1.NAME}'S EPISODE I COUNTDOWN", 3, 'sw', 'The Phantom Nuisance countdown page! Trailer download stories, the queue and what next.', 1, 'www.episode1countdown.jnet');
  P('jarjar', 'IS JAR JAR JAMS RUINING IT? The Great Debate', 3, 'sw', 'Has one floppy-eared alien ruined the whole film? Vote and argue (nicely).', 1, 'jarjardebate.kidz');
  P('podracing', 'PEAPODRACING HQ', 3, 'sw', 'The Boomta Eve race, the pods, the drivers and why Sebulbar is a cheat.', 1, 'www.podracinghq.jnet');
  P('swrumours', 'THE RUMOUR MILL: Episode I', 3, 'sw', 'Every playground rumour from 1998 and 1999, checked against the actual film.', 1, 'rumourmill.infobahn');
  P('brickwars', 'My Space Brick Wishlist 1999', 3, 'sw', 'The first Intergalactic Battles BLOCKO sets came out this year. Here is my wishlist (all of them).', 1, 'www.brickwishlist.kidz');
  P('saberduel', 'LIGHTSPATULA DUEL: Me vs Dave (photos)', 3, 'sw', 'Photos of the greatest duel ever fought in a back garden. Wrapping paper tubes were harmed.', 1, 'www.davesplace.jnet', '/duel.html');
  // file 4: portal, services and shared toys (Jack's own, on jacklm.com, unless they have a host)
  P('news', 'JackNet News', 4, 'news', 'Headlines, weather, the poll, the search box and today in 1999.');
  P('weather', 'JackNet Weather', 4, 'news', 'The forecast for round here. Rain, mostly.');
  P('teef', 'GEM EXCHANGE - Online Shop', 4, 'news', 'The only shop on the Internet that takes Rupees. Order form, basket and reviews.', 0, 'www.gemexchange.grot');
  P('hamstercam', 'HAMSTER CAM - LIVE!!!', 4, 'fun', '{hamster} the hamster, live on the Internet, 24 hours a day. Feed {hamster.him}!', 1, 'www.hamstercam.webcom');
  P('jokes', 'Joke of the Day', 4, 'fun', 'A new joke every day. Rate them. Groan at them.', 1, 'jokeoftheday.wubwub');
  P('jackmail', 'JackMail - FREE E-mail!', 4, 'comm', 'Get your own FREE e-mail address! 2 MB of space!!!', 0, 'www.jackmail.webcom');
  P('chatroom', 'JackNet Chat: The Back Room', 4, 'comm', 'A live chat room. Be nice, no shouting, no asking where people live.');
  P('counters', 'The Web Counter Collection', 4, 'fun', 'Every kind of hit counter. Plus the live chart of the most visited pages.', 1, 'www.countermania.netz');
  P('lost', '404 Not Found', 4, 'weird', 'The page cannot be found. Or can it?');
  P('downloads', 'FREE DOWNLOADS!!!', 4, 'fun', 'Free screensavers, cursors and programs. At 56K. Mom, do NOT pick up the phone.', 0, 'www.freestuff4u.w3b');
  P('crystalball', "Mystic Gubbinz's Crystal Ball", 4, 'weird', 'Ask the crystal ball a question. Gubbinz will answer it. Probably wrongly.', 0, 'mysticgubbinz.grot');
  P('orktranslate', 'Babel Jack: The Silly Translator', 4, 'fun', 'Translate English into Pirate, Robot, Posh Butler or Gork. Type it in, get it out.', 0, 'www.babeljack.grot');
  P('awards', 'The JackNet Cool Site Awards', 4, 'comm', 'Vote for Cool Site of the Week. The winner gets a badge.', 1);
  P('timecapsule', 'The Millennium Time Capsule', 4, 'comm', 'Leave a message for the year 2000. Sealed until 01/01/2000.');
  P('petition', 'SIGN THE PETITION!!!', 4, 'comm', 'Make every day a Saturday. We need 1,000 signatures.');
  P('poll', 'JackNet Poll Booth', 4, 'comm', 'Five big questions. Live results. One vote each (you can change it).');
  P('parcel', 'The Great JackNet Pass the Parcel', 4, 'comm', 'A parcel with a million layers and a chain letter. Unwrap one. Pass it on.');
  P('biscuitring', 'The Biscuit Ring', 4, 'comm', 'The webring for homepages that are best enjoyed with a cup of tea. Join!', 0, 'www.biscuitring.webcom');
  P('homepagez', 'Homepagez - FREE web space for everyone!', 4, 'comm', 'Free homepages! 1 MB of space! Our members: Gubbinz, Biscuit, {kidSoon} and you?', 0, HP);
  P('backstage', "{kidSoon}'s Backstage Area", 4, 'hidden', 'Nobody is supposed to be here.', 0, HP, '/~{kidSoon.slug}/backstage.html');
  P('clubhouse', 'The Secret Clubhouse', 4, 'hidden', 'MEMBERS ONLY. KNOCK FIRST.');
  P('riddle', 'The Riddle Trail', 4, 'weird', 'Answer the riddle. The answer is the address of the next page.');
  ['keyboard', 'wheel', 'breakfast', 'floppy', 'squig'].forEach((w, i) => P(w, 'The Riddle Trail: Clue ' + (i + 2), 4, 'hidden', 'Shhh.'));
  // search engine + directory
  P('search', 'JackSearch - Search the Web!', 5, 'help', 'Search the whole World Wide Web (well, this bit of it). Plus the I\'m Feeling Jammy button.', 0, 'www.jacksearch.find');
  P('directory', 'JackSearch Directory', 5, 'help', 'Every site, sorted into categories. Like a library, but with more blinking.', 0, 'www.jacksearch.find', '/dir/');
  // file 6: more 1999 sites (portal, free homepage neighbourhoods, e-cards, tools, e-zine, conspiracy, intros...)
  const HZ = 'www.homepagez.webcom';
  P('lookhere', 'LookHere! - Your Start Page', 6, 'news', 'The start page with everything: news, weather, horoscopes, telly and a search box.', 0, 'www.lookhere.infobahn');
  P('hoods', 'Homepagez Neighbourhoods', 6, 'comm', 'Free homepages, sorted into neighbourhoods: SpaceCity, Arcadia, Grotville, Tunesville and PetPark.', 0, HZ);
  P('hz-rory', "Rocket Rory's Launch Pad", 6, 'sci', 'Water rockets made out of pop bottles (with my Dad). Countdowns, records and splashes.', 1, HZ, '/SpaceCity/Launchpad/4021/');
  P('hz-hiscore', 'The High Score Hall of Fame', 6, 'games', 'Every high score from the arcade at the seaside and the one at the bowling alley.', 1, HZ, '/Arcadia/Joystick/2210/');
  P('hz-priya', "Pixel {club4}'s Art Corner", 6, 'fun', 'Pixel art in 16 colours, a drawing grid and tips for the Paint program.', 1, HZ, '/Arcadia/Pixel/3112/');
  P('hz-snotlin', "LITTLE GREEN KEVIN'S HOME", 6, 'mates', "Gubbinz's alien mate has a page. It's mostly about his broken saucer.", 1, HZ, '/Grotville/Mudpit/1234/');
  P('hz-fungus', 'THE MUSHROOM PAGE', 6, 'sci', 'Mushrooms and toadstools: real facts (and do NOT eat the wild ones).', 1, HZ, '/Grotville/Fungus/4040/');
  P('hz-fluffy', 'DJ Fluffy Fan Club (Official-ish)', 6, 'fans', "{cousin}'s favourite DJ has a fan club. {cousin} runs it. {cousin} is the only member.", 1, HZ, '/Tunesville/Bassline/8080/');
  P('hz-recorder', 'Recorder Club', 6, 'hobby', 'Recorder fingering charts, practice tips and an apology to everyone who lives near us.', 1, HZ, '/Tunesville/Recorder/1212/');
  P('hz-goldie', 'In Memory of Goldie (1997-1999)', 6, 'mates', 'This site is dedicated to Goldie, the best goldfish who ever lived. Light a candle.', 1, HZ, '/PetPark/Goldfish/0101/');
  P('hz-sheldon', "Sheldon the Tortoise's Page", 6, 'fun', 'News from Sheldon. Updated about once a year. He is a tortoise.', 1, HZ, '/PetPark/Tortoise/7070/');
  P('csotd', 'Cool Site of the Day', 6, 'comm', 'One cool site, every single day, picked by hand. Plus the archive of every past pick.', 1, 'www.coolsiteoftheday.wubwub');
  P('ezine', 'BYTESIZE - the e-zine for kids with modems', 6, 'news', 'Issue 7! News, an interview with Gubbinz (yes, him), reviews, letters and back issues.', 1, 'www.bytesize.zyne');
  P('ecardz', 'eCardz! - Send an e-card to a mate', 6, 'comm', 'Send a free animated e-card to anyone on JackNet right now. They get it instantly!', 0, 'www.ecardz.kidz');
  P('freetoolz', 'FreeToolz - Free Stuff for Your Homepage', 6, 'help', 'Free hit counters, guestbooks, rainbow text and marquees for your homepage.', 0, 'www.freetoolz.w3b');
  P('chatterbox', 'ChatterBox - Live Chat Rooms', 6, 'comm', 'Four live chat rooms: the Lobby, Games, Pets and Homework Help (nobody helps).', 0, 'www.chatterbox.netz');
  P('getrich', 'MAKE MONEY FAST!!! (from home)', 6, 'weird', 'The secret to getting rich that THEY do not want you to know. (It is a paper round.)', 0, 'www.getrichquick.w3b');
  P('custard', 'THE CUSTARD FILES', 6, 'weird', 'The truth is in here. School dinners, missing socks and a teacher who never eats.', 1, 'www.custardfiles.cyb');
  P('adopt', 'Adopt-a-Pixel! Virtual Pet Rescue', 6, 'fun', 'Adopt a pixel pet. It lives on your desktop. Feed it. Love it. It is made of pixels.', 1, 'www.adoptapixel.kidz');
  P('megaflash', 'MEGAFLASH 2000 (enter if you dare)', 6, 'weird', 'The most amazing intro on the Internet. Requires JackFlash Player 4. Skip intro?', 1, 'www.megaflash.cyb');
  P('winbig', 'CONGRATULATIONS!!! YOU HAVE WON!!!', 6, 'hidden', 'You are the 1,000,000th visitor!', 0, 'www.winbig.w3b');
  P('galaxyring', 'The Galaxy Ring', 6, 'sw', 'The webring for space, sci-fi and a galaxy far, far away. Hop between the stars.', 0, 'www.galaxyring.jnet');
  // sub-pages: site word -> 'file Nav label|...'. Content lives in file 7/8 (old sites) or 6 (the new sites).
  const SUBS = {
    '~dave': 'about.html About Dave|cat.html Mr Tiddles|photos.html Photos|links.html Kool Links|awards.html Awards|guestbook.html Guestbook|sign.html Sign It',
    '~kim': 'about.html All About Me|bands.html Band Profiles|photos.html My Room|quiz.html Pop Quiz|links.html Linkz|guestbook.html Slambook|sign.html Sign It',
    knitting: 'patterns.html Patterns|gallery.html Members\' Gallery|news.html Club News|links.html Links|guestbook.html Visitors\' Book',
    poetree: 'more.html More Poems|about.html About Me|awards.html Me Awards|links.html Me Links',
    computerclub: 'projects.html Projects|gallery.html Paint Gallery|links.html Links|frames.html Frames Version',
    '~stu': 'band.html The Band|songs.html Songs|photos.html Gig Photos|merch.html Merch|guestbook.html Fan Mail|sign.html Sign It',
    '~nan': 'more.html More Recipes|grandson.html My Grandson|links.html Nan\'s Links|guestbook.html Visitors Book',
    '~biscuit': 'sticks.html Stick Gallery|photos.html Photos|links.html Sniff These',
    '~kevin': 'diary.html Full Diary|photos.html Photos|faq.html FAQ|links.html Links',
    '~tom': 'about.html About Me|game.html My Game|links.html Links',
    '~lee': 'tricks.html Trick Index|collection.html Collection|photos.html Photos|links.html Links',
    rovers: 'fixtures.html Fixtures|photos.html Team Photos|reports.html Match Reports|links.html Links|guestbook.html Supporters',
    '~ellie': 'dex.html Mini Dex|tips.html Tips|trade.html Trading Board|links.html Links',
    '~blockhead': 'history.html History|scores.html Score Wall|links.html Links',
    cubetimes: 'methods.html Methods|photos.html Cube Photos|links.html Links',
    '~zed': 'top10.html All-Time Top 10|soon.html Coming Soon|links.html Links|guestbook.html Guestbook',
    '~gaz': 'faq.html Y2K FAQ|checklist.html Checklist|links.html Links',
    top100cheats: 'submit.html Send a Cheat|links.html Links',
    '~mike': 'specs.html Spec Sheet|photos.html Inside My PC|links.html Links',
    '~mek': 'gallery.html My Minis|bitsbox.html Bits Box|links.html Links',
    '~ash': 'eclipse.html Eclipse Diary|planets.html Planet Facts|links.html Links',
    fanfic: 'squig.html The Blobbit Who Ate the Internet|floppy.html Floppy|y2k.html Year Zero Zero|done.html The Robot Who Could Only Say Done|tiddles.html Mr Tiddles Defends|submit.html Submit',
    ascii: 'more.html More Art|links.html Links',
    midi: 'howto.html How MIDI Works|links.html Links',
    '~sam': 'trailer.html Trailer Diary|queue.html The Queue|links.html Links',
    jarjar: 'arguments.html Best Arguments|links.html Links',
    podracing: 'pods.html Pod Gallery|links.html Links',
    swrumours: 'submit.html Send a Rumour|links.html Links',
    brickwars: 'customs.html My Customs|links.html Links',
    teef: 'catalogue.html Catalogue|about.html About Us|faq.html FAQ',
    hamstercam: 'archive.html Snapshot Archive|othercams.html Other Cams|faq.html FAQ',
    jokes: 'archive.html Joke Archive',
    jackmail: 'tos.html Terms of Service',
    counters: 'howto.html Get a Counter',
    biscuitring: 'join.html Join|rules.html Rules',
    search: 'about.html About JackSearch|ads.html Advertise',
    lookhere: 'horoscopes.html Horoscopes|tv.html Telly|news.html News',
    hoods: 'SpaceCity/ SpaceCity|Arcadia/ Arcadia|Grotville/ Grotville|Tunesville/ Tunesville|PetPark/ PetPark',
    'hz-rory': 'launches.html Launch Log',
    'hz-goldie': 'photos.html Photos|candle.html Light a Candle',
    'hz-priya': 'draw.html Drawing Grid',
    csotd: 'archive.html Archive|submit.html Submit a Site',
    ezine: 'news.html News|interview.html Interview|reviews.html Reviews|letters.html Letters|back.html Back Issues',
    ecardz: 'send.html Send a Card|pickup.html Pick Up',
    freetoolz: 'counters.html Hit Counters|guestbooks.html Guestbooks|rainbow.html Rainbow Text|marquee.html Marquee Maker',
    chatterbox: 'lobby.html The Lobby|games.html Games Room|pets.html Pets Corner|homework.html Homework Help',
    getrich: 'testimonials.html Testimonials|secret.html THE SECRET',
    custard: 'main.html Main Menu|case1.html Case 1|case2.html Case 2|case3.html Case 3|evidence.html Evidence',
    adopt: 'adopt.html Adopt|care.html Pet Care',
    megaflash: 'main.html Main Site|plugin.html Get JackFlash',
    winbig: 'claim.html Claim Prize',
  };
  const LABEL = {};
  for (const w of Object.keys(SUBS)) {
    const m = M[w]; LABEL[w] = 'Home';
    for (const part of SUBS[w].split('|')) {
      const i = part.indexOf(' '), file = part.slice(0, i), label = part.slice(i + 1), id = w + '/' + file;
      const dir = p => (p.endsWith('/') ? p : p.replace(/[^/]*$/, '')) + file;
      M[id] = { w: id, t: m.t.replace(/ [-:(].*$/, '').replace(/!+$/, '') + ' - ' + label, f: m.f >= 6 ? 6 : (m.f <= 1 ? 7 : 8), cat: 'sub', d: label + ' (' + m.t + ')', ring: false, host: m.host, path: dir(m.path), parent: w };
      if (m.old) M[id].old = { host: m.old.host, path: dir(m.old.path) };
      LABEL[id] = label;
    }
  }
  LABEL.saberduel = 'lightspatula Duel';
  // how each site shows its navigation (frames, buttons, text links...). Drawn by web-kit.js
  const NAV = { '~dave': 'buttons', '~kim': 'left', knitting: 'text', poetree: 'text', computerclub: 'none', '~stu': 'top', '~nan': 'text', '~biscuit': 'buttons', '~kevin': 'left', '~tom': 'text', '~lee': 'top', rovers: 'left', '~ellie': 'top', '~blockhead': 'left', cubetimes: 'text', '~zed': 'left', '~gaz': 'top', top100cheats: 'text', '~mike': 'left', '~mek': 'buttons', '~ash': 'left', fanfic: 'left', ascii: 'text', midi: 'text', '~sam': 'top', jarjar: 'text', podracing: 'buttons', swrumours: 'text', brickwars: 'text', teef: 'top', hamstercam: 'text', jokes: 'text', jackmail: 'text', counters: 'text', biscuitring: 'text', search: 'text', lookhere: 'none', hoods: 'top', 'hz-rory': 'text', 'hz-goldie': 'text', 'hz-priya': 'text', csotd: 'text', ezine: 'left', ecardz: 'top', freetoolz: 'left', chatterbox: 'left', getrich: 'text', custard: 'left', adopt: 'top', megaflash: 'none', winbig: 'none' };
  // extra 1999 furniture for the older pages: banner ads, status-bar scrollers, "last updated" lines
  const EXTRA = { '~dave': { ad: 11, status: 'BCW!!! BEDROOM CHAMPIONSHIP WRESTLING!!! TONIGHT: THE DUVET vs MR TIDDLES!!! SIGN MY GUESTBOOK!!!', upd: 1 }, '~kim': { status: '*~* welcome 2 my page *~* sign my slambook *~* GLITTERBOMB 4 EVER *~*', upd: 2 }, '~stu': { ad: 12, upd: 4 }, '~gaz': { status: 'THE BUG IS COMING... THE BUG IS COMING... HAVE YOU GOT A TORCH?', upd: 0 }, top100cheats: { splat: 1, upd: 6 }, downloads: { splat: 1 }, '~kevin': { ad: 2, upd: 9 }, '~tom': { upd: 900 }, search: { ad: true }, directory: { ad: 9 }, '~ellie': { ad: 3, upd: 3 }, '~blockhead': { ad: 1, upd: 7 }, '~mike': { status: 'UPGRADE YOUR PC!!! 300 TO 450 MHz!!! FOR THE PRICE OF RAM AND A HEDGEHOG!!!', upd: 2 }, hamstercam: { ad: 6, status: CT('{hamster.NAME} IS LIVE *** FEED {hamster.NAME} *** {hamster.NAME} IS A HAMSTER ***') }, jokes: { ad: 0 }, '~nan': { upd: 12 }, '~biscuit': { ad: 2, upd: 5 }, fanfic: { upd: 4 }, ascii: { ad: 4 }, midi: { status: 'MIDI HEAVEN *** EVERY TUNE ON JACKNET *** TURN IT UP *** (SORRY MOM) ***' }, '~zed': { ad: 11, upd: 3 }, podracing: { splat: 1 }, '~sam': { status: 'THE PHANTOM NUISANCE *** OUT NOW *** SEEN IT YET??? *** SIGN THE SPACE CADET ARCHIVES ***', upd: 1 }, swrumours: { ad: 7 }, teef: { status: 'DA GEM EXCHANGE *** WE TAKE RUPEES *** NO REFUNDS *** WAAAGH ***' }, rovers: { ad: 6, upd: 2 }, poetree: { upd: 11 }, '~lee': { ad: 8, upd: 6 }, cubetimes: { ad: 5, upd: 4 }, '~ash': { upd: 8 }, '~mek': { ad: 5 } };
  const GRING = ['~sam', 'jarjar', 'podracing', 'swrumours', 'brickwars', 'saberduel', '~zed', '~ash', 'hz-rory', 'galaxyring'];
  const ALIAS = { '~mom': 'knitting', '~gubbinz': 'poetree', jacknetnews: 'news', teefexchange: 'teef', gemexchange: 'teef', freemail: 'jackmail', jacksearch: 'search', grotsearch: 'search', jackseek: 'search', '~mouldytangerines': '~stu', '~jack': 'biscuitring', ring: 'biscuitring', hamster: 'hamstercam', '404': 'lost', episode1: '~sam', petitions: 'petition', polls: 'poll', webdirectory: 'directory' };
  // the visitor's names as ~words: jacklm.com/~vicky is Cousin Vicky's page (only where the word isn't taken already)
  const CASTSITE = { '~kim': 'cousin', '~sam': 'kidEp1', '~stu': 'kidBand', '~ellie': 'kidPoke', '~tom': 'kidSoon', '~gaz': 'kidY2k', '~zed': 'club1', '~ash': 'club2', '~lee': 'club3', 'hz-priya': 'club4' };
  if (window.Cast) for (const w of Object.keys(CASTSITE)) { const a = '~' + Cast.slug(CASTSITE[w]); if (a !== w && !M[a] && !ALIAS[a]) ALIAS[a] = w; }
  const urlOfWord = w => { const m = M[ALIAS[w] || w] || {}; return m.host ? 'http://' + m.host + m.path : 'http://' + 'www.jackattack.jnet' + '/' + (ALIAS[w] || w); };
  const URLW = {}; // "host/path" -> word
  const FILES = { 1: 'js/web-p1.js', 2: 'js/web-p2.js', 3: 'js/web-p3.js', 4: 'js/web-p4.js', 5: 'js/web-search.js', 6: 'js/web-p5.js', 7: 'js/web-p6.js', 8: 'js/web-p7.js' };
  const RING = Object.keys(M).filter(w => M[w].ring);
  const key = w => String(w).toLowerCase().replace(/^~/, 'u-').replace(/\//g, '.').replace(/[^a-z0-9_.-]/g, '').slice(0, 31);
  const CATS = { mates: 'Mates & Family', games: 'Games & Cheats', fans: 'Fan Shrines', sw: 'A Galaxy Far, Far Away', sci: 'Science, Space & Computers', hobby: 'Clubs & Hobbies', news: 'News, Weather & Shopping', fun: 'Fun & Silly', comm: 'Talk & Community', weird: 'Weird & Lost', help: 'Searching & Help' };

  // ================================================================ dates (it is always 1999)
  const t99 = () => Desk.today99();
  const dmy = (d, m) => String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/99';
  const today = () => { const t = t99(); return dmy(t.d, t.m); };
  const daysAgo = n => { const t = t99(), d = new Date(1999, t.m - 1, t.d - n); return d.getFullYear() < 1999 ? (n > 365 ? '14/02/97' : '31/12/98') : dmy(d.getDate(), d.getMonth() + 1); };
  const tsDate = ts => { const d = new Date(ts || Date.now()); let dd = d.getDate(); if (d.getMonth() === 1 && dd === 29) dd = 28; return dmy(dd, d.getMonth() + 1); };
  const tsTime = ts => { const d = new Date(ts || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  // ================================================================ voter id: a one-way hash of this visitor's id (never the id itself)
  let vhCache = '';
  function vh() {
    if (vhCache) return vhCache;
    let h1 = 0x811c9dc5, h2 = 0x2545f491; const s = 'web99:' + (Net.cid || 'x');
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822519) ^ (h2 >>> 13); }
    return (vhCache = ('v' + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).slice(0, 16));
  }

  // ================================================================ tiled backgrounds drawn as SVG
  const tile = (svg, w, h) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w || 32}" height="${h || w || 32}">${svg}</svg>`)}")`;

  // ================================================================ hit counter styles
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function inWords(n) {
    if (n < 20) return WORDS[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
    if (n < 1000) return WORDS[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
    if (n < 1e6) return inWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + inWords(n % 1000) : '');
    return n.toLocaleString('en-GB');
  }
  function roman(n) { if (n <= 0) return 'N'; if (n >= 4000) return 'MMMM+'; let s = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; }
  function fmtCounter(st, n, len) {
    if (n == null) return st === 'words' ? 'lots of' : (st === 'roman' ? '?' : '-'.repeat(len || 6));
    const digits = String(n).padStart(len || 6, '0');
    switch (st) {
      case 'plain': return n.toLocaleString('en-GB');
      case 'words': return inWords(n);
      case 'roman': return roman(n);
      case 'bin': return n.toString(2);
      case 'hex': return '0x' + n.toString(16).toUpperCase().padStart(4, '0');
      case 'tally': { const f = Math.min(Math.floor(n / 5), 40), r = n % 5; return '<s>||||</s> '.repeat(f) + '|'.repeat(n > 204 ? 0 : r) + (n > 204 ? ` <small>(and loads more: ${n})</small>` : ''); }
      default: return digits.split('').map(c => `<i>${c}</i>`).join('');
    }
  }

  // ================================================================ page definitions arrive from the data files
  const DEFS = {};
  const W = window.WebPack = { M, RING, CATS, ALIAS, key, tile, urlOfWord, esc, today, daysAgo, tsDate, tsTime, ri, pick, vh, fmtCounter, inWords,
    def(word, o) { DEFS[word] = o; }, get defs() { return DEFS; }, sub(word, pages) { for (const f of Object.keys(pages)) DEFS[word + '/' + f] = typeof pages[f] === 'function' ? { html: pages[f] } : pages[f]; },
    SUBS, LABEL, NAV, GRING, vis: () => vis, markVis: id => { if (!vis[id]) { vis[id] = 1; store.set('jhp_web_vis', vis); } }, go: openWeb, load: loadFile, files: FILES, secret: s => A.secret(s), EXTRA: null };

  // the link-making helpers every page gets (c = context)
  function makeCtx(w, live) {
    const site = (M[w] && M[w].parent) || w;
    const c = { w, k: key(w), live, gbs: [], today: today(), daysAgo, t99: t99(), site, sk: key(site), file: M[w] && M[w].parent ? w.slice(site.length + 1) : '' };
    c.a = (to, text, cls) => { const t = ALIAS[to] || to; return `<a href="#" data-wp="${esc(to)}"${cls || vis[t] ? ` class="${(cls || '') + (vis[t] ? ' wvis' : '')}"` : ''}>${text == null ? esc((M[t] || { t: to }).t) : text}</a>`; };
    c.s = (file, text) => c.a(site + '/' + file, text);
    c.go = (sec, text) => `<a href="#" data-wgo="${esc(sec)}">${text}</a>`;
    c.counter = (st, o) => { o = o || {}; return `<span class="wctr wctr-${st || 'odo'}${o.cls ? ' ' + o.cls : ''}" data-k="${esc(o.k || 'web.hits.' + c.k)}" data-st="${st || 'odo'}" data-len="${o.len || 6}" aria-label="hit counter">${fmtCounter(st || 'odo', null, o.len)}</span>`; };
    c.gb = (seed, o) => { c.gbs.push({ seed: seed || [], o: o || {} }); return `<div class="wgb${(o && o.cls) ? ' ' + o.cls : ''}" data-i="${c.gbs.length - 1}"></div>`; };
    c.ring = cls => ringBar(w, cls);
    c.midi = (tune, file, o) => `<div class="wmidi${o && o.cls ? ' ' + o.cls : ''}" data-tune="${esc(tune)}"${o && o.auto ? ' data-auto="1"' : ''}><button type="button" class="wm-play" aria-label="Play">&#9654;</button><button type="button" class="wm-stop" aria-label="Stop">&#9632;</button><span class="wm-lcd"><span class="wm-name">${esc(file)}</span><span class="wm-time">0:00</span></span><span class="wm-vol" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`;
    c.uc = text => `<div class="wuc"><span class="wuc-man" aria-hidden="true"></span><span class="wuc-t">${text || 'UNDER CONSTRUCTION'}</span></div>`;
    c.best = (txt) => `<div class="wbest"><span class="wbest-ico" aria-hidden="true"></span><span>${txt || 'Best viewed in <b>800x600</b> with <b>JackNet Explorer 5</b>'}</span></div>`;
    c.badge = (top, bottom, col) => `<span class="wbadge" style="--bc:${col || '#000080'}"><b>${top}</b><span>${bottom}</span></span>`;
    c.mail = (user, text) => `<a href="#" data-wmail="${esc(user)}">${text || esc(user) + '@jackmail.webcom'}</a>`;
    c.host = 'www.jackattack.jnet';
    c.url = to => esc(urlOfWord(to).replace(/^http:\/\//, ''));
    c.href = to => esc(urlOfWord(to));
    if (W.kitCtx) W.kitCtx(c);
    return c;
  }
  // a stub used by the search engine when it reads every page's text
  W.stubCtx = w => { const c = makeCtx(w, false); c.counter = () => ''; c.gb = () => ''; c.ring = () => ''; c.midi = (t, f) => ' ' + f + ' '; return c; };

  // ================================================================ the Biscuit Ring
  function ringBar(w, cls) {
    const i = RING.indexOf(w), prev = RING[(i + RING.length - 1) % RING.length], next = RING[(i + 1) % RING.length];
    return `<div class="wring ${cls || ''}"><div class="wring-logo" aria-hidden="true"><span class="wring-bis"></span><span class="wring-bis b2"></span></div><div class="wring-txt"><div>This site is a member of <b>The Biscuit Ring</b>${i < 0 ? '' : ` <small>(site ${i + 1} of ${RING.length})</small>`}</div>
      <div class="wring-nav">[ <a href="#" data-wp="${prev}" data-ring="prev">&laquo; Prev</a> | <a href="#" data-wp="biscuitring" data-ring="hub">Hub</a> | <a href="#" data-wp="?" data-ring="random">Random</a> | <a href="#" data-wp="biscuitring" data-ring="list">List</a> | <a href="#" data-wp="${next}" data-ring="next">Next &raquo;</a> ]</div></div></div>`;
  }

  // ================================================================ showing a page: register every word with JackNet Explorer
  let active = null; // { w, el, offs: [] }
  const seen = store.get('jhp_web_seen', {}), vis = store.get('jhp_web_vis', {});
  function makePage(word) {
    const w = ALIAS[word] || word, el = document.createElement('div');
    el.className = 'wpg wpg-loading'; el.dataset.w = w;
    if (DEFS[w] && W.kitCtx && (!M[w].parent || DEFS[M[w].parent])) { setTimeout(() => { if (el.isConnected) render(el, w); }, 0); el.innerHTML = loadingHtml(w, 1); return el; }
    el.innerHTML = loadingHtml(w, 0);
    const t0 = Date.now();
    const par = M[w].parent;
    (par ? Promise.all([loadFile(M[par].f), loadFile(M[w].f)]) : loadFile(M[w].f)).then(() => setTimeout(() => { if (el.isConnected) render(el, w); }, Math.max(0, 260 - (Date.now() - t0))))
      .catch(() => { el.className = 'wpg wpg-err'; el.innerHTML = `<h2>The page cannot be displayed</h2><p>The server at <b>${esc(urlOfWord(w).replace(/^http:\/\//, '').split('/')[0])}</b> took too long to answer. Click <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p>`; });
    return el;
  }
  function loadingHtml(w, fast) {
    const kb = 4 + (w.length * 7) % 23, h = urlOfWord(w).replace(/^http:\/\//, '').split('/')[0];
    return `<div class="wload"><p>${fast ? 'Loading from cache...' : `Contacting host: <b>${esc(h)}</b>...<br>Host contacted. Waiting for reply...<br>Transferring data: ${kb} KB at 4.8 KB/sec`}</p><p class="wload-dots">.</p></div>`;
  }
  function loadFile(f) { return A.load('js/web-kit.js').then(() => A.load(FILES[f])); }
  const loadAll = () => Promise.all(Object.keys(FILES).map(f => loadFile(f)));
  W.loadAll = loadAll;

  function render(el, w) {
    const def = DEFS[w]; if (!def) return;
    const c = makeCtx(w, true), sdef = DEFS[c.site] || def;
    el.className = 'wpg wp-' + key(c.site) + (sdef.cls ? ' ' + sdef.cls : '') + (c.file ? ' wsub' : '');
    let html;
    try {
      const css = c.file ? [sdef.css, def.css] : [def.css];
      let body = def.html(c);
      if (GRING.includes(w) && W.galaxyBar) body += W.galaxyBar(c);
      const ex = !c.file && EXTRA[w];
      if (ex && c.ad) body = (ex.status ? c.status(ex.status) : '') + (ex.splat ? c.splat() : ex.ad ? c.ad(ex.ad === true ? undefined : ex.ad) : '') + body + (ex.upd != null ? c.updated(ex.upd) : '');
      if (W.shell && NAV[c.site] && NAV[c.site] !== 'none') body = W.shell(c, body, NAV[c.site]);
      html = css.filter(Boolean).map(x => `<style>${typeof x === 'function' ? x(c) : x}</style>`).join('') + body;
    }
    catch (e) { console.error(e); html = '<p>This page has a bug in it. (Not the Millennium one. A normal one.)</p>'; }
    el.innerHTML = html;
    const rec = { w, el, offs: [], c };
    if (active && active.el !== el) teardown(active);
    active = rec;
    if (!el.querySelector('.wctr')) el.insertAdjacentHTML('beforeend', `<div class="wfootctr">Visitors: ${c.counter('odo')}</div>`);
    wire(el, c, rec);
    if (W.kitWire) { try { W.kitWire(el, c, rec.api); } catch (e) { console.error(e); } }
    if (def.setup) { try { const off = def.setup(el, Object.assign(c, rec.api)); if (typeof off === 'function') rec.offs.push(off); } catch (e) { console.error(e); } }
    visited(w);
  }
  function teardown(rec) {
    rec.offs.splice(0).forEach(f => { try { f(); } catch (e) {} });
    if (musicOwner === rec.el) { Sound.music.stop(); musicOwner = null; }
  }

  // ================================================================ live widgets: counters, guestbooks, MIDI boxes
  let musicOwner = null;
  function wire(el, c, rec) {
    const offs = rec.offs;
    const api = rec.api = {
      watch(k, fn) { offs.push(Net.kv.watch(k, fn)); },
      every(fn, ms) { const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); fn(); }, ms); offs.push(() => clearInterval(t)); return t; },
      later(fn, ms) { const t = setTimeout(() => { if (el.isConnected) fn(); }, ms); offs.push(() => clearTimeout(t)); return t; },
      anim(fn) { // requestAnimationFrame loop that only runs while the page is showing
        let on = true, last = 0;
        const tick = t => { if (!on || !el.isConnected) return; requestAnimationFrame(tick); const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t; fn(dt, t / 1000); };
        requestAnimationFrame(tick); offs.push(() => { on = false; });
      },
      music(tune) { if (!Sound.on) { Sound.on = true; document.dispatchEvent(new Event('sfxchange')); } Sound.music.play(tune); musicOwner = el; },
      stopMusic() { if (musicOwner === el) { Sound.music.stop(); musicOwner = null; } },
      secret: id => A.secret(id), toast: (t, m, ms) => Desk.toast(t, m, ms), get: keys => Net.kv.get(keys),
      online: () => Net.connected,
    };
    // counters: bump this page's counter and the grand total, then fetch every counter shown on the page
    const ctrs = [...el.querySelectorAll('.wctr')];
    const keys = [...new Set(ctrs.map(x => x.dataset.k))];
    const show = (k, v) => { if (typeof v !== 'number') return; ctrs.filter(x => x.dataset.k === k).forEach(x => { x.innerHTML = fmtCounter(x.dataset.st, v, +x.dataset.len); x.setAttribute('aria-label', v + ' visitors'); x.classList.add('got'); }); el.dispatchEvent(new CustomEvent('wctr', { detail: { k, v } })); };
    keys.forEach(k => api.watch(k, ev => { if (ev.type === 'set') show(k, ev.v); }));
    const bump = () => { const ok = Net.kv.inc('web.hits.' + c.k); if (ok) Net.kv.inc('web.hits.total'); return ok; };
    let bumped = bump();
    const fetchAll = () => Net.kv.get(keys.slice(0, 30)).then(vals => keys.forEach(k => show(k, vals[k])));
    if (keys.length) fetchAll();
    const reopen = () => { if (!el.isConnected) return; if (!bumped) bumped = bump(); fetchAll(); gbs.forEach(g => g.load()); };
    rec.reopen = reopen;
    // guestbooks
    const gbs = [...el.querySelectorAll('.wgb')].map(box => guestbook(box, c.gbs[+box.dataset.i] || { seed: [], o: {} }, c, api));
    // MIDI boxes
    el.querySelectorAll('.wmidi').forEach(box => {
      const tm = box.querySelector('.wm-time'); let t0 = 0, iv = null;
      const stop = () => { clearInterval(iv); iv = null; box.classList.remove('on'); tm.textContent = '0:00'; };
      box.querySelector('.wm-play').addEventListener('click', () => {
        el.querySelectorAll('.wmidi.on').forEach(b => b !== box && b._stop && b._stop());
        api.music(box.dataset.tune); box.classList.add('on'); t0 = Date.now(); clearInterval(iv);
        iv = setInterval(() => { if (!el.isConnected || Sound.music.playing !== box.dataset.tune) return stop(); const s = Math.floor((Date.now() - t0) / 1000); tm.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500);
        el.dispatchEvent(new CustomEvent('wmidi', { detail: box.dataset.tune }));
      });
      box.querySelector('.wm-stop').addEventListener('click', () => { api.stopMusic(); stop(); });
      box._stop = stop; offs.push(stop);
      if (box.dataset.auto && Sound.on && !Sound.music.playing) api.later(() => { if (!Sound.music.playing) box.querySelector('.wm-play').click(); }, 1200);
    });
  }
  Net.on('_open', () => { if (active && active.reopen) active.reopen(); });

  // a live guestbook: shared with every visitor through Net.kv.push, plus some "old" 1999 entries underneath
  let lastPost = 0, gbSigned = store.get('jhp_web_gb', {});
  function guestbook(box, g, c, api) {
    const o = g.o, k = o.k || 'web.gb.' + c.k;
    box.innerHTML = `<div class="wgb-head">${o.title || 'Sign my Guestbook!'}</div>
      <form class="wgb-form" autocomplete="off"><div class="wgb-who">Signing as <b class="wgb-nick"></b>${o.rate === false ? '' : ` &middot; <label>Rating: <select class="wgb-rate" aria-label="Rating"><option value="5">*****</option><option value="4">****</option><option value="3">***</option><option value="2">**</option><option value="1">*</option></select></label>`}</div>
      <textarea class="wgb-msg" maxlength="240" rows="2" placeholder="${esc(o.ph || 'Write something nice...')}" aria-label="Your message"></textarea><div class="wgb-row"><button class="btn wgb-btn" type="submit">${o.btn || 'Sign it!'}</button><span class="wgb-note"></span></div></form>
      <div class="wgb-list" aria-live="polite"><div class="wgb-wait">Fetching entries from the CGI-BIN...</div></div>`;
    const list = box.querySelector('.wgb-list'), nick = box.querySelector('.wgb-nick'), note = box.querySelector('.wgb-note');
    if (o.mode === 'view') { box.querySelector('form').remove(); if (o.signLink) box.querySelector('.wgb-head').insertAdjacentHTML('beforeend', ` <span class="wgb-sv">[ ${o.signLink} ]</span>`); }
    if (o.mode === 'sign') { list.style.display = 'none'; }
    nick.textContent = Net.me.nick || 'Guest';
    const ent = (by, date, text, rate, extra) => `<div class="wgbe${extra || ''}"><div class="wgbe-h"><b>${esc(by)}</b> <span class="wgbe-d">${esc(date)}</span>${rate ? ` <span class="wgbe-r" aria-label="${rate} stars">${'*'.repeat(rate)}</span>` : ''}</div><div class="wgbe-t">${esc(text)}</div></div>`;
    const parse = e => { const m = /^([1-5])\|([\s\S]*)$/.exec(e.text || ''); return m ? [+m[1], m[2]] : [0, e.text || '']; };
    const live = e => { const [r, t] = parse(e); return ent(e.by + (e.member ? ' *' : ''), tsDate(e.ts) + ' ' + tsTime(e.ts), t, r); };
    const seedHtml = g.seed.map(s => ent(s[0], s[1], s[2], s[3])).join('');
    const draw = arr => { list.innerHTML = (arr && arr.length ? arr.slice().reverse().map(live).join('') : '') + seedHtml || '<div class="wgb-wait">Nobody has signed yet. Be the first!</div>'; };
    const load = () => Net.kv.get([k]).then(v => { if (box.isConnected) draw(Array.isArray(v[k]) ? v[k] : []); });
    load();
    api.watch(k, ev => {
      if (ev.type !== 'push') return;
      const d = document.createElement('div'); d.innerHTML = live(ev.e); const n = d.firstChild; n.classList.add('wgbe-new');
      list.querySelector('.wgb-wait') && list.querySelector('.wgb-wait').remove();
      list.prepend(n);
      if (ev.e.by !== Net.me.nick) Sound.play('pet');
    });
    const form = box.querySelector('form');
    if (form) form.addEventListener('submit', ev => {
      ev.preventDefault();
      const ta = box.querySelector('.wgb-msg'), msg = ta.value.trim();
      if (!msg) { note.textContent = 'Write something first!'; return; }
      if (Date.now() - lastPost < 6000) { note.textContent = 'Slow down! The CGI-BIN can only take one post every few seconds.'; return; }
      const rate = box.querySelector('.wgb-rate');
      if (!Net.kv.push(k, (rate ? rate.value + '|' : '') + msg)) { note.textContent = 'Not connected to JackNet. Try again in a minute!'; Sound.play('uhoh'); return; }
      lastPost = Date.now(); ta.value = ''; note.innerHTML = 'Thanks for signing!!! ' + (o.viewLink || ''); Sound.play('pet');
      gbSigned[k] = 1; store.set('jhp_web_gb', gbSigned);
      A.secret('web.gbsign');
      if (Object.keys(gbSigned).length >= 5) A.secret('web.gb5');
      box.dispatchEvent(new CustomEvent('wsigned', { bubbles: true, detail: msg }));
    });
    return { load };
  }

  // ================================================================ clicks inside the 1999 web
  let clicked = false, ringRun = null, curWord = null, lastWeb = null, lastDetail = '';
  function openWeb(word, how) {
    let w = String(word || ''); if (!M[w] && !ALIAS[w]) { const lw = w.toLowerCase(); w = Object.keys(M).find(k => k.toLowerCase() === lw) || lw; }
    $('browser').classList.remove('min'); const tb = $('taskBrowser'); if (tb) { tb.hidden = false; tb.classList.add('on'); }
    clicked = true;
    const m = M[ALIAS[w] || w];
    if (m && m.host) { IE.navigate(urlOfWord(w)); return; }
    if (m || KNOWN.includes(w)) { try { IE.showPage(ALIAS[w] || w); return; } catch (e) {} }
    IE.navigate(w);
  }
  W.open = openWeb;
  // mailto: links open a new message in Outlook Express, already addressed (like a real 1999 mailto: link)
  function mailto(to, subj) {
    if (window.JackFiles && JackFiles.compose) return JackFiles.compose({ to, subj: subj || '' });
    A.open('outlook');
  }
  W.mailto = mailto;
  document.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('#s-secret [data-wp], #s-secret [data-wgo], #s-secret [data-wmail]'); if (!t) return;
    ev.preventDefault();
    if (t.dataset.wgo) { clicked = true; IE.go(t.dataset.wgo, 'click'); return; }
    if (t.dataset.wmail) { mailto(t.dataset.wmail + '@jackmail.webcom', 'Your web page'); return; }
    let w = t.dataset.wp; const r = t.dataset.ring;
    if (w === '?') w = pick(RING.filter(x => x !== curWord));
    if (r === 'next') {
      if (!ringRun || ringRun.cur !== curWord) ringRun = { start: curWord, n: 0 };
      ringRun.n++; ringRun.cur = w;
      if (w === ringRun.start && ringRun.n >= RING.length) { ringRun = null; setTimeout(() => A.secret('web.ringloop'), 900); }
    } else if (r) ringRun = null;
    if (r) A.secret('web.ring');
    Sound.play('click');
    openWeb(w);
  });
  // status bar shows where a link goes, like a real browser
  document.addEventListener('mouseover', ev => {
    const t = ev.target.closest && ev.target.closest('#s-secret [data-wp]'); if (!t || !$('brStatus')) return;
    const w = t.dataset.wp;
    $('brStatus').textContent = w === '?' ? 'http://www.biscuitring.webcom/cgi-bin/random.cgi' : (M[ALIAS[w] || w] ? urlOfWord(w) : 'http://www.jackattack.jnet/' + w);
  });

  // ================================================================ Back and Forward between hidden pages
  // JackNet Explorer only remembers the last normal page, so we keep our own trail while you surf the hidden web.
  let webBack = [], webFwd = [], internal = false, typedAt = 0;
  $('addrBar').addEventListener('keydown', ev => { if (ev.key === 'Enter') typedAt = Date.now(); }, true);
  $('addrGo').addEventListener('click', () => { typedAt = Date.now(); }, true);
  function step(back) {
    const st = back ? webBack : webFwd; if (IE.current !== 'secret' || !st.length || !curWord) return false;
    (back ? webFwd : webBack).push(curWord); internal = true; clicked = true;
    reshow(st.pop()); return true;
  }
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('#navBack, #navFwd'); if (!b) return;
    if (step(b.id === 'navBack')) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  window.addEventListener('keydown', ev => {
    if (!ev.altKey || (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight')) return;
    if (step(ev.key === 'ArrowLeft')) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  const wordOf = d => { if (d.startsWith('secret:')) return d.slice(7); if (d.startsWith('site:')) { const u = d.slice(5).replace(/^www\./, '').toLowerCase(); return URLW[u] || u; } return null; };
  const reshow = w => { const m = M[ALIAS[w] || w]; if (m && m.host) IE.navigate(urlOfWord(w)); else if (/\.[a-z0-9]+\//i.test(w)) IE.navigate('http://' + w); else { try { IE.showPage(w); } catch (e) { IE.navigate(w); } } };
  document.addEventListener('section', e => {
    const d = String(e.detail || '');
    if (d.startsWith('secret:') || d.startsWith('site:')) {
      const w = wordOf(d);
      if (internal) internal = false;
      else if (/^(secret|site):/.test(lastDetail) && curWord && curWord !== w) { webBack.push(curWord); if (webBack.length > 60) webBack.shift(); webFwd = []; }
      else if (!/^(secret|site)/.test(lastDetail)) { webBack = []; webFwd = []; }
      curWord = lastWeb = w;
      if (webFwd.length) { $('navFwd').disabled = false; $('navFwdDrop').disabled = false; }
      if (webBack.length) { $('navBack').disabled = false; $('navBackDrop').disabled = false; }
      const canon = ALIAS[w] || w;
      if (M[canon] && Date.now() - typedAt < 2500 && (w.startsWith('~') || /\/~/.test(d))) A.secret('web.tilde');
      clicked = false;
    } else if (d === 'secret') {
      // Explorer went "back" to the hidden page: draw it fresh
      const mine = document.querySelector('#s-secret > .wpg');
      if (mine && lastWeb && M[ALIAS[lastWeb] || lastWeb]) { const w = lastWeb; internal = true; setTimeout(() => reshow(w), 0); }
    } else { curWord = null; clicked = false; }
    lastDetail = d;
    if (active && (!active.el.isConnected || !active.el.closest('.sec.on'))) { teardown(active); active = null; }
  });

  // ================================================================ visiting pages: secrets for surfing a lot
  function visited(w) {
    if (!seen[w]) { seen[w] = Date.now(); store.set('jhp_web_seen', seen); }
    W.markVis(w);
    const top = x => M[x] && M[x].cat !== 'hidden' && !M[x].parent;
    const n = Object.keys(seen).filter(top).length, all = Object.keys(M).filter(top).length;
    const hoods = ['SpaceCity/', 'Arcadia/', 'Grotville/', 'Tunesville/', 'PetPark/'];
    if (hoods.every(h => seen['hoods/' + h])) A.secret('web.hoods');
    if (n >= 10) A.secret('web.surf10');
    if (n >= 25) A.secret('web.surf25');
    if (n >= all) A.secret('web.surfall');
    if (RING.every(x => seen[x])) A.secret('web.ringall');
  }
  W.seen = seen;

  const SITES = {}; // host -> { title, pages }
  for (const w of Object.keys(M)) {
    const m = M[w];
    if (!m.host) { IE.addPage(w, m.t, () => makePage(w)); continue; }
    const site = SITES[m.host] = SITES[m.host] || { title: m.t, pages: {} };
    site.pages[m.path.toLowerCase()] = { title: m.t, path: m.path, html: () => makePage(w) };
    URLW[(m.host.replace(/^www\./, '') + m.path).toLowerCase()] = w;
    if (m.old) { // the address before the cast went random: same site, old host (aliased below) or old path on a shared host
      URLW[(m.old.host.replace(/^www\./, '') + m.old.path).toLowerCase()] = w;
      if (m.old.host === m.host && m.old.path !== m.path) site.pages[m.old.path.toLowerCase()] = { title: m.t, path: m.path, html: () => makePage(w) };
      else if (m.old.host !== m.host && IE.aliasSite) IE.aliasSite(m.old.host, m.host);
    }
    if (w.startsWith('~')) IE.addPage(w, 'This page has moved', () => moved(w)); // jacklm.com/~name -> their new address
  }
  for (const h of Object.keys(SITES)) IE.addSite(h, SITES[h]);
  if (IE.aliasSite) IE.aliasSite('teefexchange.grot', 'gemexchange.grot'); // the shop's old name; old links and Favorites redirect
  for (const a of Object.keys(ALIAS)) IE.addPage(a, M[ALIAS[a]].t, () => M[ALIAS[a]].host ? moved(ALIAS[a]) : makePage(a));
  function moved(w) {
    const el = document.createElement('div'); el.className = 'wpg wpg-moved'; const u = urlOfWord(w);
    el.innerHTML = `<h2>This page has moved!</h2><p>${esc(M[w].t)} is now at <a href="${esc(u)}">${esc(u)}</a></p><p>You will be taken there in <b class="wmv-n">3</b> seconds. Please update your bookmarks!</p><p class="small">(Everyone has moved off Jack's computer. His Mom needed the phone line.)</p>`;
    let n = 3; const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); el.querySelector('.wmv-n').textContent = --n; if (n <= 0) { clearInterval(t); clicked = true; internal = true; IE.navigate(u); } }, 1000);
    return el;
  }

  // pages made by the rest of JackOS, so the search engine can find them too (they're opened by typing their word)
  const KNOWN = ['webring', 'area51', 'y2kbunker', 'cubeclub', 'tetris', 'grotdance', 'hamsterdance', 'gubbinzhome', 'dave', 'matrix', 'konami', 'netscape', 'bsod', 'credits', 'underconstruction', 'oldsite', 'secret', 'admin', 'jackamp', 'keepoutdave', 'hklm'];
  W.KNOWN = KNOWN;

  // ================================================================ original MIDI tunes (lead: eighth notes, 0 rest, -1 hold; bass every 2 steps)
  const T = (n, o) => Sound.addTune(n, o);
  T('web-dave', { step: 0.13, hats: true, lead: [52, 52, 0, 55, 0, 52, 57, 0, 52, 52, 0, 55, 0, 58, 57, 55, 52, 52, 0, 55, 0, 52, 60, 59, 57, 0, 55, 0, 52, -1, -1, 0], bass: [40, 40, 40, 43, 40, 40, 45, 43, 40, 40, 40, 43, 45, 43, 40, 40] });
  T('web-kim', { step: 0.14, hats: true, lead: [72, 74, 76, 76, 0, 74, 72, 74, 76, 79, 76, 74, 72, -1, 0, 0, 69, 72, 74, 74, 0, 72, 69, 72, 74, 76, 74, 72, 71, -1, 0, 0, 72, 74, 76, 79, 81, 79, 76, 74, 76, -1, 72, 0, 74, -1, 0, 0, 77, 76, 74, 72, 74, 76, 72, 69, 72, -1, -1, 0, 0, 0, 0, 0], bass: [48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 41, 48, 43, 50, 43, 50, 48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 43, 50, 48, 48, 48, 48] });
  T('web-knit', { step: 0.2, hats: false, lead: [67, -1, 72, -1, 76, -1, 74, -1, 72, -1, 71, -1, 72, -1, -1, -1, 0, 0, 64, -1, 67, -1, 72, -1, 71, -1, 69, -1, 67, -1, 67, -1, -1, -1, 0, 0], bass: [48, 52, 55, 50, 53, 55, 48, 52, 55, 45, 48, 52, 43, 47, 50, 48, 48, 48] });
  T('web-band', { step: 0.12, hats: true, lead: [64, 64, 67, 64, 69, 0, 66, 64, 62, 63, 64, 62, 60, 0, 0, 0, 64, 64, 67, 65, 69, 0, 71, 73, 71, 69, 67, 64, 62, -1, 61, 0], bass: [40, 40, 41, 40, 38, 38, 36, 37, 40, 40, 40, 41, 45, 43, 40, 39] });
  T('web-gaz', { step: 0.16, hats: true, lead: [69, 0, 69, 0, 69, 0, 72, -1, 71, 0, 71, 0, 71, 0, 67, -1, 69, 0, 69, 0, 69, 0, 76, -1, 74, -1, 72, -1, 71, -1, 69, -1], bass: [45, 45, 45, 45, 43, 43, 43, 43, 45, 45, 45, 45, 41, 41, 40, 40] });
  T('web-space', { step: 0.15, hats: false, lead: [60, 67, 72, 76, 79, 76, 72, 67, 58, 65, 70, 74, 77, 74, 70, 65, 57, 64, 69, 72, 76, 72, 69, 64, 55, 62, 67, 71, 74, 71, 67, 62], bass: [36, 36, 36, 36, 34, 34, 34, 34, 33, 33, 33, 33, 31, 31, 31, 31] });
  T('web-hamster', { step: 0.1, hats: true, lead: [79, 0, 76, 0, 79, 0, 76, 0, 81, 79, 77, 76, 74, 0, 0, 0, 77, 0, 74, 0, 77, 0, 74, 0, 79, 77, 76, 74, 72, 0, 0, 0], bass: [48, 55, 48, 55, 50, 55, 43, 55, 53, 60, 53, 60, 48, 55, 48, 55] });
  T('web-parcel', { step: 0.13, hats: true, lead: [72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 74, 79, 83, -1, 0, 0, 81, 77, 72, 77, 81, 77, 72, 77, 79, 76, 72, 76, 79, -1, 0, 0], bass: [48, 48, 55, 55, 43, 43, 50, 50, 41, 41, 48, 48, 43, 43, 48, 48] });
  T('web-saga', { step: 0.15, hats: false, lead: [62, -1, 65, 69, -1, 67, 65, 64, 65, -1, 62, -1, 57, -1, 0, 0, 62, -1, 65, 69, -1, 72, 70, 69, 67, -1, -1, -1, 0, 0, 0, 0], bass: [38, 38, 38, 45, 46, 46, 41, 45, 38, 38, 43, 46, 45, 45, 45, 45] });
  T('web-pod', { step: 0.09, hats: true, lead: [64, 64, 71, 64, 72, 64, 71, 64, 62, 62, 69, 62, 71, 62, 69, 62, 60, 60, 67, 60, 69, 60, 67, 60, 62, 62, 69, 62, 71, -1, 74, -1], bass: [40, 40, 40, 40, 38, 38, 38, 38, 36, 36, 36, 36, 38, 38, 43, 43] });
  T('web-lift', { step: 0.22, hats: false, lead: [76, -1, 74, 72, 74, -1, 79, -1, 77, -1, 76, 74, 76, -1, -1, 0, 72, -1, 74, 76, 77, -1, 76, 74, 72, -1, -1, -1, 0, 0, 0, 0], bass: [48, 52, 53, 57, 52, 55, 48, 48, 45, 48, 50, 53, 48, 43, 48, 48] });
  T('web-sad', { step: 0.3, hats: false, lead: [69, -1, 72, -1, 71, -1, 67, -1, 69, -1, -1, -1, 0, 0, 0, 0, 65, -1, 69, -1, 67, -1, 64, -1, 65, -1, 64, -1, 62, -1, -1, -1], bass: [45, 45, 43, 43, 41, 41, 40, 40] });
  T('web-nan', { step: 0.17, hats: false, lead: [67, 0, 72, 0, 72, 74, 76, 0, 74, 0, 71, 0, 67, -1, 0, 0, 69, 0, 72, 0, 72, 74, 76, 0, 77, 76, 74, 71, 72, -1, 0, 0], bass: [48, 55, 48, 55, 43, 50, 43, 50, 45, 53, 48, 55, 43, 50, 48, 48] });
  T('web-rave', { step: 0.08, hats: true, lead: [69, 76, 81, 76, 69, 76, 81, 84, 67, 74, 79, 74, 67, 74, 79, 83, 65, 72, 77, 72, 65, 72, 77, 81, 64, 71, 76, 71, 64, 71, 76, 80], bass: [45, 45, 45, 45, 43, 43, 43, 43, 41, 41, 41, 41, 40, 40, 40, 40] });
  T('web-cube', { step: 0.12, hats: true, lead: [72, 0, 72, 79, 0, 79, 77, 76, 74, 0, 74, 77, 0, 77, 76, 74, 72, 0, 72, 79, 0, 79, 81, 79, 77, 76, 74, 71, 72, -1, 0, 0], bass: [48, 48, 43, 43, 50, 50, 43, 43, 48, 48, 45, 45, 41, 43, 48, 48] });
  T('web-block', { step: 0.11, hats: true, lead: [71, 74, 79, 74, 71, 74, 79, 74, 72, 76, 79, 76, 72, 76, 79, 76, 74, 78, 81, 78, 74, 78, 81, 78, 79, -1, 78, -1, 76, -1, 74, -1], bass: [43, 43, 43, 43, 48, 48, 48, 48, 50, 50, 50, 50, 43, 43, 50, 50] });
  W.TUNES = [['web-dave', 'dave_entrance.mid'], ['web-kim', 'popparadise.mid'], ['web-knit', 'knit_and_natter_waltz.mid'], ['web-band', 'mouldy_demo_tape.mid'], ['web-gaz', 'bunker_alarm.mid'], ['web-space', 'orbit.mid'], ['web-hamster', 'nibbles_theme.mid'], ['web-parcel', 'pass_the_parcel.mid'], ['web-saga', 'galaxy_saga.mid'], ['web-pod', 'podrace_fever.mid'], ['web-lift', 'lift_music.mid'], ['web-sad', 'coming_soon_forever.mid'], ['web-nan', 'nans_kitchen.mid'], ['web-rave', 'bedroom_rave_99.mid'], ['web-cube', 'twist_and_turn.mid'], ['web-block', 'falling_blocks_remix.mid']];

  // ================================================================ secrets
  const S = (id, name, hint) => A.defineSecret('web.' + id, name, hint);
  S('surf10', 'Surfer', 'Surf ten hidden homepages on the 1999 Web');
  S('surf25', 'Web addict', 'Visit twenty-five hidden homepages. Mom says get off the Internet');
  S('surfall', 'Seen the whole Web', 'Visit every page on the 1999 Web. Every. Single. One.');
  S('ring', 'Ring a ring o\' biscuits', 'Use a webring to hop between homepages');
  S('ringloop', 'Round and round', 'Follow a webring Next, Next, Next... all the way back to where you started');
  S('ringall', 'Lord of the Biscuits', 'Visit every member of the Biscuit Ring');
  S('tilde', 'Tilde town', 'Members\' homepages live at www.jackattack.jnet/~name. Type one in yourself');
  S('gbsign', 'Dear guestbook', 'Sign a guestbook on someone\'s homepage');
  S('gb5', 'Serial signer', 'Sign five different guestbooks around the Web');
  S('feelinggrotty', "Feeling jammy", "A search engine has a button for when you're feeling lucky. Or jammy");
  S('searchjack', 'Ego search', 'Search the Web for the person who made this computer');
  S('directory', 'Card catalogue', 'Browse every category of the web directory');
  S('whitetext', 'Invisible ink', 'Some homepages hide words in the same colour as the background. Select All!');
  S('clubhouse', 'Members only', 'Get into the secret clubhouse. The password is in a band\'s setlist');
  S('source', 'View Source, Luke', 'Webmasters leave notes in the page source. View > Source on an abandoned page');
  S('riddles', 'Riddle me this', 'Solve the whole Riddle Trail. Every answer is the next address');
  S('lost', 'Not lost any more', 'Find the way out of the 404 page');
  S('petition', 'Signed, sealed', 'Sign the petition to make every day a Saturday');
  S('poll', 'Democracy!', 'Vote in every poll in the Poll Booth');
  S('parcel', 'Pass it on', 'Unwrap a layer of the Great JackNet Pass the Parcel');
  S('goldensquig', 'The Golden Cartridge', 'Win the special prize in Pass the Parcel (it\'s in every 25th layer)');
  S('capsule', 'Dear Year 2000', 'Bury a message in the Millennium Time Capsule');
  S('hamster', 'Hamster wheel overdrive', 'Poke the hamster on the hamster cam a lot');
  S('order', 'Valued customer', 'Place an order at the Gem Exchange');
  S('jackmail', 'You\'ve got JackMail', 'Sign up for a free e-mail address');
  S('download', 'Mom picked up the phone', 'Try to download a big file at 56K');
  S('logo', 'Turtle power', 'Draw a square with the turtle at computer club');
  S('cubetime', 'Speedcuber', 'Time a solve on the cube records page and post it to the league');
  S('pin', 'One, two, THREE!', 'Win a match in Bedroom Championship Wrestling');
  S('setlist', 'Encore!', 'Shout for an encore on the worst band\'s website');
  S('jarjar', 'Mesa voted', 'Have your say in the Great Jar Jar Jams Debate');
  S('podrace', 'Now THIS is peapodracing', 'Win a peapod race on the peapodracing fan page');
  S('saber', 'Duel of the fates (and Dave)', 'Watch the whole lightspatula duel photo album');
  S('countdown', 'It\'s finally out', 'Visit the Episode I countdown page and press the big button');
  S('midi', 'MIDI maniac', 'Play every tune in MIDI Heaven');
  S('crystal', 'The future is green', 'Ask the crystal ball a question about the year 2000');
  S('award', 'And the winner is...', 'Vote for Cool Site of the Week');
  S('chat', 'a/s/l? (no thanks)', 'Say something in the Back Room chat');
  S('joke', 'Tough crowd', 'Rate five jokes on the Joke of the Day page');
  S('bunker', 'Battle stations', 'Press the big red button in a Y2K bunker. Not that one. The other one');

  // ================================================================ e-cards from other visitors (sent from www.ecardz.kidz with Net.relay)
  W.online = []; Net.on('online', m => { if (m && Array.isArray(m.online)) W.online = m.online; });
  const CARDS = ['birthday', 'squig', 'space', 'getwell', 'thanks', 'y2k', 'saber', 'flowers'];
  W.CARDS = CARDS;
  Net.onRelay('web.ecard', (d, msg) => {
    if (!d || typeof d !== 'object' || !CARDS.includes(d.card)) return;
    const text = String(d.text || '').replace(/[\u0000-\u001f]/g, ' ').slice(0, 200), from = String((msg && msg.from) || 'Someone').slice(0, 24);
    const box = store.get('jhp_web_cards', []); box.unshift({ card: d.card, text, from, ts: Date.now() }); store.set('jhp_web_cards', box.slice(0, 12));
    A.secret('web.ecardget'); Sound.play('join');
    Desk.msgbox('eCardz!', `You've got an e-card from ${from}!\n\nPick it up now at www.ecardz.kidz?`, 'info', [['Pick it up', () => openWeb('ecardz/pickup.html')], ['Later']]);
  });
  // ================================================================ adopted pixel pets live on the desktop (www.adoptapixel.kidz)
  const PETICO = { blob: '#5ac85a', bat: '#8a5ac8', fish: '#ff8c00', dragon: '#e10600', robot: '#9a9a9a', squig: '#e8381b' };
  W.petIcon = kind => `<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="26" rx="4" fill="#fff" stroke="#000"/><circle cx="16" cy="18" r="9" fill="${PETICO[kind] || '#5ac85a'}" stroke="#000"/><rect x="11" y="14" width="3" height="3" fill="#000"/><rect x="18" y="14" width="3" height="3" fill="#000"/><path d="M12 22h8" stroke="#000"/><path d="M7 6l4 3M25 6l-4 3" stroke="#e10600" stroke-width="2"/></svg>`;
  W.petDesk = () => {
    const pet = store.get('jhp_web_pet', null); if (!pet || !PETICO[pet.kind]) return;
    const old = document.getElementById('iconWebPet'); if (old) old.remove();
    A.desktopIcon(String(pet.name || 'My Pet').slice(0, 16), W.petIcon(pet.kind), () => A.load('js/web-kit.js').then(() => W.petWindow && W.petWindow()), 'iconWebPet');
  };
  W.petDesk();
  A.cmd(['mypet', 'pixelpet', 'my pet'], () => A.load('js/web-kit.js').then(() => W.petWindow ? W.petWindow() : openWeb('adopt')));
  S('ecardsend', 'You\'ve got mail (sort of)', 'Send an e-card to someone else who is online');
  S('ecardget', 'Someone likes you', 'Receive an e-card from another visitor');
  S('adopt', 'Proud parent', 'Adopt a pixel pet. It will move onto your desktop');
  S('petfed', 'Responsible owner', 'Feed your pixel pet when it is really hungry');
  S('skipintro', 'Skip intro', 'Every 1999 Flash intro has a button. Press it');
  S('fullintro', 'Sat through the whole thing', 'Watch an entire Flash intro without skipping. All of it');
  S('plugin', 'Plug and pray', 'Download the plugin a page says you need');
  S('splat', 'SPLAT!', 'Some banner ads are games. Splat the blob');
  S('prize', 'Winner (?)', 'You are the 1,000,000th visitor! Claim your prize');
  S('redacted', '[REDACTED]', 'Uncover every blacked-out line in the Custard Files');
  S('framefail', 'Frames within frames', 'Some sites put their frames inside their frames. Find the one that goes wrong');
  S('hoods', 'Neighbourhood watch', 'Visit every neighbourhood on the free homepage host');
  S('horoscope', 'Written in the stars', 'Read your horoscope on a start page');
  S('csotd', 'Archivist', 'Read the Cool Site of the Day archive');
  S('ezine', 'Cover to cover', 'Read every article in the e-zine issue');
  S('money', 'The secret of wealth', 'Find out the real secret on the get-rich-quick page');
  S('candle', 'Never forgotten', 'Light a candle for a much-loved goldfish');
  S('rooms', 'Room hopper', 'Say something in three different chat rooms');
  S('deadlink', 'Link rot', 'Click five dead links on people\'s Links pages');
  S('imagemap', 'Hidden hotspot', 'Image maps have clickable bits. One of them is not where you think');
  S('popup', 'Pop-up survivor', 'Close three pop-up jackos');
  S('lake', 'Still waters', 'Find a Java applet that makes a picture ripple like a lake');
  S('broken', 'Broken image detective', 'Click a broken picture. Then find out what it should have been');

  // ================================================================ ways in: Favorites, Cool Sites folder, Temporary Internet Files, Start menu, Run
  // An .url shortcut to a hidden page is a 'lnk' node with a `web` field instead of `go`.
  const prevLnk = A.OPENERS.lnk;
  const lnkOpener = node => { if (node.web) return openWeb(node.web); if (prevLnk) return prevLnk(node); $('browser').classList.remove('min'); IE.go(node.go || 'home', 'click'); };
  A.OPENERS.lnk = lnkOpener;
  window.addEventListener('load', () => { if (A.OPENERS.lnk !== lnkOpener) { const other = A.OPENERS.lnk; A.OPENERS.lnk = n => n.web ? openWeb(n.web) : other(n); } });
  const url = (path, name, w, date, extra) => A.fs.add(path, Object.assign({ name, type: 'lnk', web: w, date: date || '12/01/99', size: '1 KB' }, extra || {}));
  url('C:/JACKOS/Favorites', 'JackSearch.url', 'search', '03/03/99');
  url('C:/JACKOS/Favorites', 'JackNet News.url', 'news', '04/03/99');
  url('C:/JACKOS/Favorites', 'The Biscuit Ring.url', 'biscuitring', '06/06/99');
  url('C:/JACKOS/Favorites', 'Hamster Cam.url', 'hamstercam', '19/08/99');
  url('C:/JACKOS/Favorites', 'LookHere! Start Page.url', 'lookhere', '02/02/99');
  url('C:/JACKOS/Favorites', 'eCardz.url', 'ecardz', '14/02/99');
  [['Homepagez Neighbourhoods.url', 'hoods', '20/05/99'], ['BYTESIZE e-zine.url', 'ezine', '01/10/99'], ['Cool Site of the Day.url', 'csotd', '07/07/99'], ['FreeToolz.url', 'freetoolz', '12/03/99'], ['ChatterBox.url', 'chatterbox', '18/08/99'], ['Adopt-a-Pixel.url', 'adopt', '25/09/99'], ['Goldie (RIP).url', 'hz-goldie', '03/06/99']].forEach(([n, w, d]) => url('C:/My Documents/Cool Sites', n, w, d));
  [['custard[1].htm', 'custard', '13/09/99'], ['megaflash[2].htm', 'megaflash', '22/10/99'], ['getrich[1].htm', 'getrich', '30/08/99'], ['winbig[4].htm', 'winbig', '11/11/99']].forEach(([n, w, d]) => url('C:/JACKOS/Temporary Internet Files', n, w, d, { size: '6 KB' }));
  const COOL = 'C:/My Documents/Cool Sites';
  A.fs.dir(COOL).date = '14/03/99';
  [["Dave's NEW page.url", '~dave', '02/05/99'], [CT("Cousin {cousin}'s page.url"), '~kim', '22/04/99'], ["Mom's knitting club.url", 'knitting', '09/03/99'], ['Gubbinz poems.url', 'poetree', '01/04/99'],
    ['Computer Club.url', 'computerclub', '16/09/99'], [CT('Mouldy Tangerines ({kidBand}).url'), '~stu', '30/07/99'], ['Episode I countdown.url', '~sam', '18/11/98'], ['Peapodracing HQ.url', 'podracing', '20/07/99'],
    [CT('Pocket Critters facts ({kidPoke}).url'), '~ellie', '08/10/99'], ['Cube records.url', 'cubetimes', '11/02/99'], ['Upgrade diary (Mike).url', '~mike', '27/06/99'], ['Gork painting tips.url', '~mek', '23/01/99'],
    ['Top 100 cheats.url', 'top100cheats', '05/05/99'], ['MIDI Heaven.url', 'midi', '13/04/99'], ['Joke of the day.url', 'jokes', '01/06/99'], ['JackSearch Directory.url', 'directory', '03/03/99']]
    .forEach(([n, w, d]) => url(COOL, n, w, d));
  A.fs.add(COOL, { name: 'READ ME - cool sites.txt', type: 'txt', date: '14/03/99', size: '1 KB', text: `COOL SITES (by Jack)\n====================\n\nThese are my favourite pages on the World Wide Web.\nDouble-click one to go there. Or type the address into JackNet Explorer.\n\nAll my mates have homepages now. They live at\n   www.jackattack.jnet/~theirname\nThe little squiggle is called a "tilde". It's next to the Enter key and nobody knows why.\n\nIf you get lost, use JackSearch:  www.jacksearch.find\nIt finds everything. Except my PE kit.\n\nTo do:\n- ask Dave why his page is about wrestling now\n- tell ${CT('{cousin}')} the glitter background makes my eyes go funny\n- find out what ${CT('{kidSoon}')}'s page was going to be\n- solve the riddle trail (starts at /riddle)\n` });
  const TMP = 'C:/JACKOS/Temporary Internet Files';
  A.fs.dir(TMP).date = '01/01/99';
  [[CT('~{kidSoon.slug}[1].htm'), '~tom', '14/02/99'], ['lost[1].htm', 'lost', '21/09/99'], ['riddle[1].htm', 'riddle', '30/10/99'], ['parcel[1].htm', 'parcel', '17/12/99'], ['counters[2].htm', 'counters', '02/08/99'],
    ['crystalball[1].htm', 'crystalball', '31/10/99'], [CT('~{kidY2k.slug}[3].htm'), '~gaz', '12/11/99'], ['gemexchange[1].htm', 'teef', '04/07/99'], ['downloads[1].htm', 'downloads', '09/08/99'], ['timecapsule[1].htm', 'timecapsule', '01/09/99'],
    ['~kevin[1].htm', '~kevin', '28/05/99'], ['awards[1].htm', 'awards', '15/06/99']].forEach(([n, w, d]) => url(TMP, n, w, d, { size: (2 + n.length % 9) + ' KB' }));
  A.fs.add(TMP, { name: 'desktop.ini', type: 'txt', hidden: true, date: '01/01/99', size: '1 KB', text: '[.ShellClassInfo]\nCLSID={7BD29E00-76C1-11CF-9DD0-00A0C9034933}\n; this folder fills up FAST. Mom says empty it. Mom does not know what it is.\n; psst: there is a page called /backstage. ' + CT('{kidSoon}') + ' never finished it.\n' });
  const net = a => () => openWeb(a);
  const globe = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#2a7ad8" stroke="#000"/><path d="M1.5 8h13M8 1.5c-3 3-3 10 0 13M8 1.5c3 3 3 10 0 13" stroke="#9fd0ff" fill="none"/><path d="M3 5c2 1 4 0 5-1 1 2 3 2 4 1M4 11c2-1 3 1 5 0" stroke="#3c3" fill="none" stroke-width="1.4"/></svg>';
  A.addProgram(['Internet', 'JackSearch'], net('search'), globe);
  A.addProgram(['Internet', 'JackSearch Directory'], net('directory'), globe);
  A.addProgram(['Internet', 'JackNet News'], net('news'), globe);
  A.addProgram(['Internet', 'The Biscuit Ring'], net('biscuitring'), globe);
  A.addProgram(['Internet', 'Hamster Cam'], net('hamstercam'), globe);
  A.addProgram(['Internet', 'LookHere! Start Page'], net('lookhere'), globe);
  A.addProgram(['Internet', 'eCardz'], net('ecardz'), globe);
  A.addProgram(['Internet', 'Adopt-a-Pixel'], net('adopt'), globe);
  A.addProgram(['Internet', 'JackMail (free e-mail)'], net('jackmail'), globe);
  A.cmd(['jackseek', 'jackseek.exe', 'search engine', 'websearch'], net('search'));
  A.cmd(['biscuitring', 'biscuit ring'], net('biscuitring'));
  A.cmd(['hamstercam', 'hamster cam'], net('hamstercam'));
  A.cmd(['jacknet news', 'jacknetnews'], net('news'));
  A.cmd(['cool sites', 'coolsites'], () => A.open('explorer', 'C:\\My Documents\\Cool Sites'));
  A.desktopIcon('Cool Sites', '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/><circle cx="20" cy="20" r="7" fill="#2a7ad8" stroke="#003"/><path d="M13 20h14M20 13c-3 3-3 11 0 14M20 13c3 3 3 11 0 14" stroke="#9fd0ff" fill="none"/><path d="M15.5 17c2 1 3 0 4.5-1 1 2 3 2 4 1" stroke="#3c3" fill="none" stroke-width="1.3"/></svg>', () => A.open('explorer', 'C:\\My Documents\\Cool Sites'), 'iconCoolSites');
})();

/* econ-cat: the Rupee economy's price list (internally the money is still called "teef": ids and keys never change). Shared by the server mod (mods/econ.js requires it) and the web pages
 * (lazily loaded), so a price is only ever written down once. Changing a price here changes it everywhere. */
(function (root) {
  'use strict';
  // ---------------------------------------------------------------- The Rupee Emporium catalogue
  // [id, name, price, category, description, extra]   extra: { req: 'plot'|'farm5'|'rich', max: n (consumables), use: true }
  const RAW = [
    // wallpapers (Set as Wallpaper puts them on the desktop)
    ['wp.teefpile', "Pile o' Rupees", 60, 'wall', 'A tiled heap of shiny Rupees in every colour. Looks rich. Is rich.'],
    ['wp.squigs', 'Blob Monster Stampede', 80, 'wall', 'Hundreds of bouncing blob monsters, like level 1 of every platform game. Mom says it gives her a headache.'],
    ['wp.mushrooms', 'Glowing Mushrooms', 90, 'wall', 'Spooky glowing mushrooms on a dark forest floor. Like the secret level, but on your desktop.'],
    ['wp.skyline', 'Jacktown Skyline', 100, 'wall', 'The Jacktown skyline at sunset: houses, a cinema and the Big Power Station.'],
    ['wp.ticker', 'Ticker Tape', 120, 'wall', 'Green stock prices on black. For serious traders (and Dad).'],
    ['wp.gold', 'Gold Rupees on Velvet', 500, 'wall', 'Gold Rupees on red velvet. The most expensive wallpaper on the Internet. Probably.'],
    // mouse pointers
    ['cur.toof', 'Rupee Pointer', 50, 'cur', 'Your pointer becomes a single sparkly green Rupee.'],
    ['cur.spanner', 'Robo Rumble Spanner', 50, 'cur', 'A big spanner. Click things like you are fixing a fighting robot in the pits.'],
    ['cur.squig', 'Chomper Pointer', 70, 'cur', 'A tiny round red chomping monster points at things with its teeth.'],
    ['cur.gold', 'Golden Hand', 300, 'cur', 'A golden pointing hand. Everything you click feels expensive.'],
    // sound schemes
    ['snd.jingle', 'Jingly Rupee Sounds', 80, 'snd', 'JackOS open with a jingle of Rupees and close with a clink.'],
    ['snd.squeak', 'Virtual Pet Beeps', 80, 'snd', 'Every window beeps like a virtual pet on a keyring that wants feeding. RIGHT NOW.'],
    ['snd.floor', 'Trading Floor', 100, 'snd', 'Opening bell! Closing bell! BUY BUY BUY!'],
    // window colours
    ['col.gold', 'Gold Rush Colours', 150, 'col', 'Gold title bars and a creamy face. Very posh.'],
    ['col.squig', 'Laser Sword Red Colours', 100, 'col', 'Red and pink, like the baddie\'s laser sword in a dark cinema.'],
    ['col.mint', 'Mint Choc Chip Colours', 100, 'col', 'Minty green, like the best ice cream in the van.'],
    // Gubbinz (shared pet) supplies: feed the Gubbinz everybody looks after
    ['gub.chow', 'Gubbinz Chow (tin)', 15, 'gub', "Fills up Gubbinz's food bar a LOT. Everyone on the site sees you feed him.", { use: true, max: 99 }],
    ['gub.cake', 'Mushroom Cake', 25, 'gub', 'Food AND fun. Gubbinz does a little dance.', { use: true, max: 99 }],
    ['gub.soap', 'Bubble Soap', 10, 'gub', 'Makes Gubbinz clean. He hates it. It works.', { use: true, max: 99 }],
    // hats: for your Hangout avatar AND for Gubbinz when he walks about the desktop
    ['hat.party', 'Party Hat', 40, 'hat', 'A pointy paper party hat. For the Millennium (any day now).'],
    ['hat.bobble', 'Bobble Hat', 45, 'hat', 'Knitted by Mom\'s knitting club. Itchy.'],
    ['hat.top', 'Top Hat', 90, 'hat', 'Very posh. Wear it to the Jack Exchange.'],
    ['hat.cap', 'Baseball Cap', 55, 'hat', 'Worn backwards, obviously.'],
    ['hat.crown', 'Rupee Crown', 400, 'hat', 'A gold crown set with a Rupee of every colour. For the richest people in Jacktown.'],
    ['hat.mek', 'Robot Helmet', 120, 'hat', 'A dented tin robot helmet with a lightbulb on top. The bulb works (mostly).'],
    ['hat.wizard', 'Wizard Hat', 150, 'hat', 'A tall pointy hat with stars on, for a level 20 wizard. Crackles a bit.'],
    // face things for your Hangout avatar
    ['face.shades', 'Cool Shades', 60, 'face', 'Black shades. Instantly 40% cooler.'],
    ['face.3d', '3D Specs', 45, 'face', 'Red and blue. Everything looks 3D. Or blurry.'],
    ['face.monocle', 'Monocle', 80, 'face', 'For inspecting your share prices very carefully.'],
    ['face.tash', 'Big Moustache', 50, 'face', 'A huge stick-on moustache. Nobody will recognise you.'],
    // badges (shown on the Rich List, your bank statement, the Gazette and Jacktown)
    ['badge.early', "Early Adopter '99", 50, 'badge', 'You were here in 1999. (Everybody is. It is always 1999.)'],
    ['badge.waaagh', 'Player 1 Club', 100, 'badge', 'A green badge for people who always bagsy Player 1. It shouts. Quietly.'],
    ['badge.cube', 'Cube Club', 120, 'badge', 'Six colours. Nine squares each. One badge.'],
    ['badge.squig', 'Pet Farmer', 150, 'badge', 'Only for Pixel Pet farmers with 5 or more pens.', { req: 'farm5' }],
    ['badge.landlord', 'Jacktown Landlord', 200, 'badge', 'Only for members who own a plot in Jacktown.', { req: 'plot' }],
    ['badge.tycoon', 'Rupee Tycoon', 1000, 'badge', 'A gold badge for the seriously minted.'],
    ['badge.gold', 'Gold Member', 2500, 'badge', 'The rarest badge on JackNet. Comes with nothing else at all.'],
    // desktop pets (they live on your taskbar)
    ['pet.rock', 'Pet Rock', 75, 'pet', "Rocky's cousin. Sits on your taskbar. Occasionally rolls.", {}],
    ['pet.snot', 'Little Gremlin', 200, 'pet', 'A tiny green gremlin who runs about your taskbar and picks his nose. Do not get him wet.'],
    ['pet.squig', 'Bouncy Squig', 250, 'pet', 'A red squig (the round, bitey War Hamster kind) that bounces along the taskbar and chomps your Start button.'],
    ['pet.cube', 'Walking Cube', 300, 'pet', "A Rubrick's cube with little legs. It scrambles itself when it's bored."],
    // daft stuff
    ['misc.ram', 'Download More RAM', 40, 'misc', 'Adds 1 MB of RAM to your computer. Over the Internet! (Results not guaranteed.)'],
    ['misc.y2k', 'Y2K Insurance', 99, 'misc', 'Covers you against the Millennium Bug. Certificate saved to My Documents.'],
    ['misc.ticker', 'Jack Ticker 98', 150, 'misc', 'A desktop program that shows live Jack Exchange prices in a little window.'],
    ['misc.goldtoof', 'Solid Gold Rupee', 1000, 'misc', 'A Rupee the size of your fist. It does nothing. It just sits in your stash being gold. Shows a star on the Rich List.'],
    // Rupee Wallets: purely for show (they change the wallet in your tray and on your profile). There is NO limit on Rupees.
    ['wal.kid', "Kid's Wallet", 50, 'wal', 'A bright velcro wallet. RRRRIP! Everyone in the room knows you are paying.'],
    ['wal.big', 'Big Wallet', 250, 'wal', 'A proper brown leather wallet, like your Dad\'s. Room for Rupees AND a bus pass.'],
    ['wal.giant', 'Giant Wallet', 1000, 'wal', 'A purple wallet so big it has its own gold clasp. Gems peek out of the top.'],
    ['wal.bag', 'Bottomless Bag', 3000, 'wal', 'A starry drawstring bag that goes on forever. Rupees go in. Nobody knows where they end up. (Your balance. They end up in your balance.)'],
  ];
  const ITEMS = RAW.map(([id, name, price, cat, desc, x]) => Object.assign({ id, name, price, cat, desc }, x || {}));
  const ITEM = {}; for (const it of ITEMS) ITEM[it.id] = it;
  const CATS = [['wall', 'Wallpapers'], ['cur', 'Mouse Pointers'], ['snd', 'Sound Schemes'], ['col', 'Window Colours'], ['hat', 'Hats'], ['face', 'Face Things'], ['badge', 'Badges'], ['pet', 'Desktop Pets'], ['wal', 'Rupee Wallets'], ['gub', 'Gubbinz Supplies'], ['misc', 'Odds & Sods']];
  // what each category can be worn/used as (wear slots)
  const SLOTS = { wall: 'wall', cur: 'cur', snd: 'snd', col: 'col', hat: 'hat', face: 'face', badge: 'badge', pet: 'pet', wal: 'wal' };

  // ---------------------------------------------------------------- Jacktown buildings
  // code: [name, cost, {pop, jobs, hap, crime, poll, pow, sq, mush, rent}, description, maxPerPlot]
  const B = (n, cost, s, d, max) => Object.assign({ n, cost, d, max: max || 16, pop: 0, jobs: 0, hap: 0, crime: 0, poll: 0, pow: 0, sq: 0, mush: 0, rent: 0 }, s);
  const BUILD = {
    '.': B('Grass', 0, {}, 'Bulldoze back to grass. (Refunds a third of the cost.)'),
    r: B('Path', 2, { hap: 0.2 }, 'A cobbled path. People like walking on paths. Sometimes.'),
    t: B('Tree', 3, { poll: -1, hap: 0.4 }, 'A tree. Soaks up pollution. Home to at least one squirrel.'),
    f: B('Flower Bed', 4, { hap: 1 }, 'Pretty flowers. The dog next door tramples them. Plant them anyway.'),
    p: B('Pond', 15, { hap: 1.5, poll: -1 }, 'A duck pond. No ducks yet. One frog.'),
    F: B('Fountain', 60, { hap: 3 }, 'A fountain with a statue of a robot spitting water. Classy.', 2),
    h: B('House', 40, { pop: 4, pow: -1, rent: 0.02 }, 'A little house for four people. Rent: small but steady.'),
    a: B('Block of Flats', 110, { pop: 12, pow: -2, poll: 1, hap: -0.5, rent: 0.06 }, 'Twelve people, one lift (broken).'),
    o: B('Garden Shed Flat', 25, { pop: 3, crime: 1, hap: 0.5, rent: 0.015 }, 'A shed with three bunk beds in it. Cheap, cheerful and a bit leaky.'),
    s: B('Corner Shop', 60, { jobs: 4, pow: -1, hap: 1, rent: 0.035 }, 'Sells crisps, comics and penny sweets.'),
    T: B('Greasy Spoon Cafe', 70, { jobs: 3, hap: 2, rent: 0.04 }, 'Tea, toast and egg-and-chips. The fruit machine eats 10p pieces.'),
    m: B('Mushroom Farm', 45, { jobs: 2, mush: 3, rent: 0.02 }, 'Grows mushrooms for Gubbinz Pet Food. Smells earthy.'),
    q: B('Pet Shop', 70, { jobs: 2, sq: 4, poll: 1, rent: 0.035 }, 'Hamsters, goldfish and Pixel Pets! Feeds the Pixel Pets plc share price. Very squeaky.'),
    w: B('Robot Workshop', 90, { jobs: 6, poll: 3, pow: -2, rent: 0.05 }, 'Builds fighting robots for the telly. Sparks everywhere. Noisy.'),
    g: B('Neighbourhood Watch Hut', 80, { jobs: 1, crime: -6, pow: -1 }, 'A man with binoculars and a whistle keeps an eye on things. Less crime.', 2),
    e: B('Big Power Station', 150, { jobs: 2, pow: 12, poll: 4 }, 'Makes electricity out of coal and noise. Powers 12 buildings.', 2),
    n: B('Windmill', 120, { pow: 6, hap: 1 }, 'Clean power from the wind. Very modern. Very 1999.', 3),
    x: B('Amusement Arcade', 140, { jobs: 2, hap: 4, pow: -2, crime: 1, rent: 0.06 }, 'Ten pence a go. Has a JACKTRIS cabinet.', 1),
    b: B('Rupee Bank Branch', 200, { jobs: 4, crime: 1, pow: -1, rent: 0.07 }, 'A little bank. The cashier behind the glass counts Rupees very slowly.', 1),
    R: B("Rubrick's Cube Statue", 160, { hap: 5, rent: 0.04 }, 'A giant cube statue. Tourists come to try and solve it.', 1),
    c: B('Cinema (Episode I)', 220, { jobs: 3, hap: 6, pow: -3, rent: 0.08 }, 'One screen. Showing Episode I. Forever. Queue starts Tuesday.', 1),
  };
  const BUILD_ORDER = ['r', 't', 'f', 'p', 'F', 'h', 'a', 'o', 's', 'T', 'm', 'q', 'w', 'g', 'e', 'n', 'x', 'b', 'R', 'c', '.'];
  const TOWN = { W: 40, H: 40, BLOCK: 5, PLOT: 4, OFF: 3, N: 7, RESERVED: [24, 17, 31] }; // 7x7 plots; plot i -> (i % 7, i / 7 | 0)
  const ROADS = ['Mushroom Lane', 'Sprite Street', 'Rupee Terrace', 'Joystick Way', 'Dragon Drive', 'Spanner Road', 'Cartridge Close'];
  const AVES = ['Red Avenue', 'Boing Boulevard', 'Floppy Crescent', 'Modem Mews', 'Pixel Parade', 'Cube Court', 'Space Cadet Gardens'];

  // ---------------------------------------------------------------- Jack Stock Exchange companies
  // [sym, name, start price, volatility per minute, drift per minute, dividend yield per day, blurb]
  // sym is the INTERNAL key (server state, everyone's shares); ds is the symbol people see on the screen.
  const COS = [
    ['TEEF', 'GEMS', 'Rupee Mining Co.', 120, 0.006, 0.00002, 0.004, 'Digs up Rupees from the Great Gem Seam under Jacktown. Mostly green ones. The rainbow ones are "a rumour".'],
    ['SQIG', 'PETS', 'Pixel Pets plc', 45, 0.01, 0.00001, 0.006, 'Breeds Pixel Pets for keyrings, farms and racing. Hit hard by the Pixel Pox.'],
    ['GROT', 'POST', 'Jiffy Couriers Ltd', 18, 0.012, 0.0, 0.003, 'Carries things. Drops things. Carries them again. Cheapest deliveries in Jacktown.'],
    ['DAKA', 'BANG', 'Bang Bros Fireworks', 75, 0.009, 0.00001, 0.004, 'Party poppers, rockets and VERY loud whistles. Sales go mental before the Millennium.'],
    ['GUBZ', 'GUBZ', 'Gubbinz Pet Food', 30, 0.008, 0.00001, 0.005, 'Gubbinz Chow, Mushroom Cake and Bubble Soap. The official supplier to Gubbinz.'],
    ['MEKK', 'KART', 'Turbo Karts', 200, 0.007, 0.00002, 0.003, 'Go-karts and remote-control cars. Red ones go faster. Recalls are "a thing of the past".'],
    ['JNET', 'JNET', 'JackNet Online', 60, 0.016, 0.00006, 0.0, 'Dial-up Internet for everyone! A dot-com. Nobody knows what it is worth. Least of all JackNet.'],
    ['CUBE', 'CUBE', 'Kube Toys', 90, 0.006, 0.00001, 0.004, "Puzzle cubes, yo-yos and tazos. The playground's favourite toy maker."],
  ].map(([sym, ds, name, p0, vol, drift, yld, d]) => ({ sym, ds, name, p0, vol, drift, yld, d }));
  const DS = {}; for (const c of COS) DS[c.sym] = c.ds;
  const dsym = s => DS[s] || s; // internal symbol -> the one on screen

  // ---------------------------------------------------------------- Jackdown Park karts (the 10-minute races; the list is still called GROTS inside)
  const GROTS = ['Turbo Tim', 'Nitro Nell', 'Pixel Pete', 'Blue Thunder', 'Zoom Zoom', 'Rubrick Rocket', 'Megabyte', 'Floppy Flo', 'Captain Joystick', 'Dial-Up Dave', 'Sir Spinalot', 'Tetromino', 'Lightspeed Lou', 'Sprocket', 'Boingo', 'Cosmic Kev', 'Bleep Bloop', 'Gigahertz', 'Mudlark', 'Spudnik', 'Snikkit the Squig', 'Wonky Wilf', 'Red Rocket', 'Lumpy'];

  // ---------------------------------------------------------------- earning rules (per JackNet member, per UK day)
  // THE BALANCE TABLE. Every Rupee anybody earns goes through ONE path: earn() in mods/econ.js. The server decides every
  // amount; a browser can only say "this happened" for the few things marked (client), and those are rate-limited,
  // de-duplicated and capped so hard that cheating is pointless.
  //   amt   Rupees per time                       cap   times per UK day that pay (the rest still count for missions)
  //   half  after this many in a day, pay half (diminishing returns)     gap   seconds that must pass between two
  //   drop  chance that an item drops from it (JackLoot, mods/loot.js; at most 10 random drops a day)
  //   src            amt  cap half  gap   drop  how it's checked                         most a day
  //   daily           25   1    -    -     -    server: first logon of the UK day        25 (+5/day of streak, max +30)
  //   score            5  12    6   20   .06    server: high-score table accepts it      48
  //   record          20   3    -    -   .25    server: it's the new no.1                60
  //   post            10   6    3   10   .05    server: forum post saved                 45
  //   topic           15   3    -    -   .08    server: new forum topic                  45
  //   gb              15   1    -    -   .10    server: letter to Jack                   15
  //   chat             1  20    -   30   .01    server: chat line (30s apart)            20
  //   secret           5  10    5    -   .12    (client) secret id, once each ever       40
  //   cube            25   2    -    -   .30    server: the shared Rubik's cube solved   50
  //   waaagh          15   2    -    -   .25    server: you called the WAAAGH!           30
  //   petcare          2   5    -   60   .04    server: fed/played/cleaned Gubbinz       10
  //   frag             2  15    8    3   .03    server: JRT referee saw the frag         23
  //   fragwin         15   2    -    -   .25    server: won a JRT match (2+ players)     30
  //   quiz             5   6    3    -   .08    server: Quiz Night right answer          24
  //   hpvisit          3  10    5    -   .03    server: someone visited your homepage    25
  //   site             3  10    5    5   .06    (client) a new fake web site, once each   25
  //   prog             2  10    5    5   .04    (client) a program opened for 1st time   15
  //   play             3  12    6  280   .05    (client) 5 minutes of actually playing   30
  //   cards            5   4    -   60   .10    (client) won Solitaire                   20
  //   cupboard         5   3    -  300   .10    (client) played a Games Cupboard game    15
  //   pb               5   4    -   60   .08    server: beat your own arcade best        20
  //   install          3   5    -   10   .08    (client) installed new software, once each 15
  //   mission    15/20/25  4    -    -   (yes)  server: Daily Missions (+15 for all 3)    75
  //   set/ach   one-off rewards for finishing collection sets and achievements (server)
  // A keen player earns about 150-300 Rupees a day; doing absolutely everything tops out near 820. Shop prices fit that:
  // a Common thing is 40, a hat 40-150, a Lootlings Rare 350, the big status items 1000-2500.
  const EARN = {
    cashExchange: {amt:1,cap:400,label:'Pocket money exchange (up to £20 daily)'},
    daily: { amt: 25, cap: 1, label: 'Daily log-on bonus' },
    score: { amt: 5, cap: 12, half: 6, gap: 20, drop: 0.06, label: 'High score submitted' },
    record: { amt: 20, cap: 3, drop: 0.25, label: 'New high-score RECORD' },
    post: { amt: 10, cap: 6, half: 3, gap: 10, drop: 0.05, label: 'Forum post' },
    topic: { amt: 15, cap: 3, drop: 0.08, label: 'New forum topic' },
    gb: { amt: 15, cap: 1, drop: 0.1, label: 'Letter to Jack (guestbook)' },
    chat: { amt: 1, cap: 20, gap: 30, drop: 0.01, label: 'Chatting in the Chat Room' },
    secret: { amt: 5, cap: 10, half: 5, drop: 0.12, label: 'Secret found' },
    cube: { amt: 25, cap: 2, drop: 0.3, label: "Solved the shared Rubrick's cube" },
    waaagh: { amt: 15, cap: 2, drop: 0.25, label: 'Called the WAAAGH!' },
    petcare: { amt: 2, cap: 5, gap: 60, drop: 0.04, label: 'Looked after Gubbinz' },
    frag: { amt: 2, cap: 15, half: 8, gap: 3, drop: 0.03, label: 'JackReal Tournament frag' },
    fragwin: { amt: 15, cap: 2, drop: 0.25, label: 'Won a JackReal Tournament match' },
    quiz: { amt: 5, cap: 6, half: 3, drop: 0.08, label: 'Quiz Night answer' },
    hpvisit: { amt: 3, cap: 10, half: 5, drop: 0.03, label: 'Visitor to your homepage' },
    site: { amt: 3, cap: 10, half: 5, gap: 5, drop: 0.06, label: 'Visited a new web site' },
    prog: { amt: 2, cap: 10, half: 5, gap: 5, drop: 0.04, label: 'Tried a new program' },
    play: { amt: 3, cap: 12, half: 6, gap: 280, drop: 0.05, label: 'Playing on the PC' },
    cards: { amt: 5, cap: 4, gap: 60, drop: 0.1, label: 'Won a game of Solitaire' },
    cupboard: { amt: 5, cap: 3, gap: 300, drop: 0.1, label: 'Played a Games Cupboard game' },
    pb: { amt: 5, cap: 4, gap: 60, drop: 0.08, label: 'Beat your own best score' },
    install: { amt: 3, cap: 5, gap: 10, drop: 0.08, label: 'Installed some new software' },
    mission: { amt: 15, cap: 4, label: 'Lootlings Daily Mission' },
    set: { amt: 100, cap: 20, label: 'Lootlings collection set complete' },
    ach: { amt: 10, cap: 30, label: 'Lootlings achievement' },
  };
  const FARM = { penCost: n => Math.round(50 * Math.pow(1.45, n)), feedCost: n => Math.round(40 * Math.pow(1.5, n)), maxPens: 20, maxFeed: 20, perPen: 20, breedMin: 30 };
  const LOTTO = { price: 10, maxTickets: 10, prizes: { 3: 25, 4: 250, 5: 2500 }, seed: 1000 };

  const C = { ITEMS, ITEM, CATS, SLOTS, BUILD, BUILD_ORDER, TOWN, ROADS, AVES, COS, DS, dsym, GROTS, EARN, FARM, LOTTO, MAX: 1e12 };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.EconCat = C;
})(this);

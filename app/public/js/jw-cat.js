/* jw-cat: the JACKWORLD catalogue (shared by the server, mods/jw.js, and the browser, js/jw*.js), so a piece of furni,
 * a room, a rare or a quiz question is only ever written down once.
 *   FURNI      every piece of furniture: catalogue page, price, size, kind (f floor, r rug: walk on it, w wall), what it does
 *   RARES      the weekly limited rares (one a week of 1999, on sale that week only, numbered "#3 of 30")
 *   MODELS     room shapes a member can own (the Shoebox is free)          FLOORS / WALLS: room styles (some cost Rupees)
 *   PUB        the public rooms (tile maps, their own furni, doors between them, the regulars who hang about in them)
 *   QUIZ       the Quiz Booth's questions (each one only once its 1999 date has happened)
 *   AV         the avatar builder's options                               path(): the walking route (server + browser)
 * Furni is JackLoot (type 'furni'): it sits in your Treasure Chest, trades on the Trading Post and sells on JackBay.
 * augment(LootCat) adds it to the loot catalogue. Prices: Common 25+, Uncommon 75+, Rare 250+ (never cheap enough to
 * game the Combinator; furni can't go in it anyway). Everything on sale is a Rupee sink: the Rupees vanish. */
(function (root) {
  'use strict';
  const STEP = 420; // ms per tile when walking (diagonals too)

  // ================================================================ catalogue pages
  const PAGES = [
    ['new', 'Front Page', 'What is new in the JackWorld Catalogue this week, plus this week\'s RARE.'],
    ['basics', 'Bits & Bobs', 'Cheap and cheerful. Every room starts somewhere (usually with a crate).'],
    ['bedroom', 'Bedroom', 'Beds, desks, posters: everything a teenager\'s bedroom needs except a tidy floor.'],
    ['gamer', "Gamer's Den", 'Tellies, arcade machines and the comfiest chairs in JackWorld.'],
    ['lounge', 'Front Room', 'Sofas, lamps and fish tanks. Somewhere for your mates to sit.'],
    ['space', 'Space Age', 'Chrome, plasma and inflatable everything. The future is now (well, 1999).'],
    ['outdoor', 'Garden & Beach', 'Bring the outside in. Deckchairs, palms and one very judgemental gnome.'],
    ['fun', 'Fun & Games', 'Dice, jukeboxes, trampolines and Tele-Booths. Things that DO things.'],
    ['wall', 'On The Walls', 'Posters, clocks, jackos and neon. Click a wall to hang them.'],
    ['season', 'Seasonal', 'Only on sale at the right time of year. Get them while they\'re hot (or cold).'],
    ['rares', 'RARES', 'One new rare every week of 1999. Limited numbers, numbered certificates, gone by Monday.'],
    ['styles', 'Floors & Walls', 'Wallpaper and floors for your room. Buy once, use for ever.'],
    ['rooms', 'Room Sizes', 'Need more space? Move up from the Shoebox.'],
  ];

  // ================================================================ furni
  // [id, name, rarity, price, w, d, kind, art, desc, extra]   kind: f floor (blocks), r rug (walk on it), w wall
  // extra: sit (sit on it), use (lamp|tv|dice|juke|vend|tele|tramp|disco|fire|pc|clock|ball|bell), anim (animates),
  //        sea [fromMMDD, toMMDD] (seasonal), pub (public rooms only: not sold), h (picture height, for clicks)
  const F = [], FURNI = {};
  const add = (pg, rows) => rows.forEach(([id, n, r, p, w, d, k, art, ds, x]) => F.push(Object.assign({ id: 'furni.' + id, n, r, p, w, d, k, art, ds, pg }, x || {})));
  const COLS = {
    red: ['Red', '#d8342c'], blue: ['Blue', '#3266d6'], green: ['Green', '#3fa34a'], yellow: ['Yellow', '#f2c22e'], purple: ['Purple', '#8a4ad0'],
    pink: ['Pink', '#ef6fb0'], orange: ['Orange', '#f08a24'], black: ['Black', '#3a3a44'], white: ['White', '#eeeae0'], teal: ['Teal', '#22a7a0'], brown: ['Brown', '#8a5a32'], silver: ['Silver', '#b8c0cc'],
  };
  const each = (ks, fn) => ks.map(k => fn(k, COLS[k][0], COLS[k][1]));

  add('basics', [
    ['crate', 'Wooden Crate', 0, 25, 1, 1, 'f', ['crate', '#b07a40'], 'It said BANANAS on the side once. Now it is a table. And a seat. And a shelf.'],
    ['crate2', 'Stack of Crates', 0, 30, 1, 1, 'f', ['crate2', '#a0703a'], 'Two crates. Twice as interior designed.'],
    ...each(['red', 'blue', 'green', 'yellow'], (k, cn, c) => ['cushion_' + k, `Floor Cushion (${cn})`, 0, 25, 1, 1, 'f', ['cushion', c], 'For sitting on the floor in a way that says "I meant to do that".', { sit: 1 }]),
    ...each(['red', 'blue', 'purple', 'green'], (k, cn, c) => ['beanbag_' + k, `Bean Bag (${cn})`, 0, 35, 1, 1, 'f', ['beanbag', c], 'Sit down and you\'ll never get up again. Mom has tried.', { sit: 1 }]),
    ['stool', 'Bar Stool', 0, 25, 1, 1, 'f', ['stool', '#d8342c'], 'Spins round if you push off the counter. Wheee.', { sit: 1 }],
    ['plant', 'Rubber Plant', 0, 30, 1, 1, 'f', ['plant', '#3a9a3a'], 'Water it once a week. Or never. It is quite plastic.'],
    ['cactus', 'Spiky Cactus', 0, 25, 1, 1, 'f', ['cactus', '#4aa04a'], 'The only plant that has ever survived in a teenager\'s room.'],
    ['bin', 'Swing Bin', 0, 25, 1, 1, 'f', ['bin', '#9aa4b0'], 'Full of crisp packets and old maths homework.'],
    ...each(['red', 'blue', 'green'], (k, cn, c) => ['rug_' + k, `Rag Rug (${cn})`, 0, 30, 2, 2, 'r', ['rug', c], 'Hides the stain where the Ribena went.']),
    ['lamp', 'Standard Lamp', 0, 40, 1, 1, 'f', ['lamp', '#f2e2a0'], 'Click it to switch it on. Mood lighting for revising (not revising).', { use: 'lamp' }],
    ['comics', 'Pile of Comics', 0, 25, 1, 1, 'f', ['comics', '#d8342c'], '2000 AD, The Beano and a Viz you\'ll be hiding from Mom.'],
    ['boxes', 'Moving Boxes', 0, 25, 1, 1, 'f', ['boxes', '#c8a070'], 'Still not unpacked from when you moved in. In 1994.'],
  ]);
  add('bedroom', [
    ...each(['blue', 'red', 'green'], (k, cn, c) => ['bed_' + k, `Single Bed (${cn})`, 0, 60, 1, 2, 'f', ['bed', c], 'Never made. Duvet with a pattern you\'re slightly too old for.', { sit: 1 }]),
    ['bunk', 'Bunk Beds', 1, 120, 1, 2, 'f', ['bunk', '#3266d6'], 'Top bunk: the only place to be. Bottom bunk: for your little cousin.', { sit: 1 }],
    ['wardrobe', 'Wardrobe', 0, 60, 1, 1, 'f', ['wardrobe', '#a0703a'], 'There is no magical land in the back. You checked.', { h: 54 }],
    ['desk', 'Homework Desk', 0, 50, 2, 1, 'f', ['desk', '#a0703a'], 'Covered in revision notes you have colour-coded and not read.'],
    ['pcdesk', 'Computer Desk', 1, 150, 2, 1, 'f', ['pcdesk', '#d8d0c0'], 'A beige tower, a 15-inch monitor and a 56K modem. Click to switch on.', { use: 'pc', anim: 1 }],
    ['drawers', 'Chest of Drawers', 0, 45, 1, 1, 'f', ['drawers', '#b07a40'], 'Top drawer: socks. Bottom drawer: TOP SECRET.'],
    ['bedside', 'Bedside Table', 0, 30, 1, 1, 'f', ['bedside', '#b07a40'], 'With an alarm clock that you snooze four times every morning.'],
    ['chair', 'Desk Chair', 0, 30, 1, 1, 'f', ['chair', '#3266d6'], 'It spins. It goes up and down. It squeaks.', { sit: 1 }],
    ['ironing', 'Laundry Pile', 0, 25, 1, 1, 'f', ['laundry', '#7aa0e0'], 'Mom said put it away. It is "away" now.'],
    ['goldfish', 'Goldfish Bowl', 0, 40, 1, 1, 'f', ['goldfish', '#f08a24'], 'His name is Gary. He has been Gary III since the summer.', { anim: 1 }],
    ['tellybed', 'Portable Telly', 1, 80, 1, 1, 'f', ['telly', '#3a3a44'], 'A 14-inch portable with a coat-hanger aerial. Click to change the channel.', { use: 'tv', anim: 1 }],
  ]);
  add('gamer', [
    ['crt', 'Big Telly', 1, 90, 1, 1, 'f', ['crt', '#2a2a30'], 'A 28-inch widescreen beast on a stand. Weighs as much as your dad. Click it!', { use: 'tv', anim: 1, h: 46 }],
    ...each(['red', 'blue', 'purple'], (k, cn, c) => ['arcade_' + k, `Arcade Cabinet (${cn})`, 1, 150, 1, 1, 'f', ['arcade', c], 'Insert coin. Well, insert 20p. It has been on attract mode since 1987.', { anim: 1, h: 56 }]),
    ['pinball', 'Pinball Table', 1, 180, 2, 1, 'f', ['pinball', '#d8342c'], 'TILT! You only nudged it a little bit.', { anim: 1 }],
    ['gamechair', 'Gaming Chair', 0, 50, 1, 1, 'f', ['gamechair', '#3a3a44'], 'A rocker chair with speakers in the headrest. Sit down, press START.', { sit: 1 }],
    ['cdtower', 'CD Tower', 0, 30, 1, 1, 'f', ['cdtower', '#3a3a44'], 'Every CD you own, plus the free ones off magazine covers.'],
    ['speakers', 'Big Speakers', 0, 40, 1, 1, 'f', ['speakers', '#2a2a30'], 'The neighbours have opinions about these.'],
    ['gamepile', 'Pile of Game Boxes', 0, 25, 1, 1, 'f', ['gamepile', '#3266d6'], 'Big cardboard PC game boxes. The manuals are better than some films.'],
    ['footy', 'Table Football', 1, 120, 2, 1, 'f', ['footy', '#3fa34a'], 'No spinning! (Everyone spins.)'],
    ['padrug', 'Joypad Rug', 1, 80, 2, 2, 'r', ['padrug', '#b0b4c0'], 'A rug shaped like a joypad. Up, up, down, down...'],
    ['consoletv', 'Console Corner', 1, 160, 2, 1, 'f', ['consoletv', '#2a2a30'], 'A telly, a console and four controllers with tangled leads. Click for player two.', { use: 'tv', anim: 1 }],
  ]);
  add('lounge', [
    ...each(['red', 'blue', 'green', 'brown'], (k, cn, c) => ['sofa_' + k, `Comfy Sofa (${cn})`, 0, 70, 2, 1, 'f', ['sofa', c], 'Two seats, four cushions, about £1.37 down the back.', { sit: 1 }]),
    ...each(['red', 'blue', 'green', 'brown'], (k, cn, c) => ['armchair_' + k, `Armchair (${cn})`, 0, 45, 1, 1, 'f', ['armchair', c], 'Dad\'s chair. Nobody else sits in Dad\'s chair.', { sit: 1 }]),
    ['coffee', 'Coffee Table', 0, 35, 1, 1, 'f', ['table', '#a0703a'], 'Covered in rings from mugs with no coasters.'],
    ['coffee2', 'Long Coffee Table', 0, 45, 2, 1, 'f', ['table2', '#a0703a'], 'Big enough for a Monopoly board and a family argument.'],
    ['dining', 'Dining Table', 0, 60, 2, 2, 'f', ['dining', '#b07a40'], 'Sunday dinners and jigsaw puzzles with one bit missing.'],
    ['dchair', 'Dining Chair', 0, 25, 1, 1, 'f', ['dchair', '#b07a40'], 'The one with the wobbly leg.', { sit: 1 }],
    ...each(['red', 'purple', 'green'], (k, cn, c) => ['lava_' + k, `Lava Lamp (${cn})`, 1, 75, 1, 1, 'f', ['lava', c], 'Blobs go up. Blobs go down. Hours of fun. Click it.', { use: 'lamp', anim: 1 }]),
    ['fishtank', 'Fish Tank', 1, 110, 2, 1, 'f', ['fishtank', '#3a9ad8'], 'Three tetras, a plastic diver and a treasure chest that bubbles.', { anim: 1 }],
    ['bookcase', 'Bookcase', 0, 45, 1, 1, 'f', ['bookcase', '#8a5a32'], 'Encyclopaedias from 1983 and every Goosebumps book.', { h: 54 }],
    ['fireplace', 'Gas Fire', 1, 150, 2, 1, 'f', ['fireplace', '#c8b8a0'], 'Fake coals, real warmth. Click it on for the winter.', { use: 'fire', anim: 1 }],
    ['gclock', 'Grandfather Clock', 0, 60, 1, 1, 'f', ['gclock', '#6a4020'], 'Tick. Tock. Bong. (It is always five minutes slow.)', { h: 62 }],
    ...each(['red', 'blue', 'purple'], (k, cn, c) => ['bigrug_' + k, `Big Round Rug (${cn})`, 1, 80, 3, 3, 'r', ['roundrug', c], 'The centrepiece of any front room. Shake it outside, not in.']),
    ['radiator', 'Radiator', 0, 25, 1, 1, 'f', ['radiator', '#eeeae0'], 'Socks drying on it. Always.'],
  ]);
  add('space', [
    ...each(['blue', 'pink', 'orange'], (k, cn, c) => ['blow_' + k, `Inflatable Chair (${cn})`, 1, 80, 1, 1, 'f', ['blowchair', c], 'Squeaks when you sit down. Sticks to your legs in summer.', { sit: 1 }]),
    ['chrome', 'Chrome Table', 1, 75, 1, 1, 'f', ['chrome', '#b8c0cc'], 'So shiny you can see your spots in it.'],
    ['plasma', 'Plasma Ball', 1, 90, 1, 1, 'f', ['plasma', '#8a4ad0'], 'Put your hand on it and the lightning follows you. Click it.', { use: 'lamp', anim: 1 }],
    ['rocketlamp', 'Rocket Lamp', 1, 85, 1, 1, 'f', ['rocketlamp', '#d8342c'], '3, 2, 1... bedtime. Click to light the engines.', { use: 'lamp', anim: 1, h: 50 }],
    ['globe', 'Globe', 0, 40, 1, 1, 'f', ['globe', '#3266d6'], 'Spin it and point. That\'s where you\'ll live when you\'re grown up.'],
    ['telescope', 'Telescope', 1, 100, 1, 1, 'f', ['telescope', '#eeeae0'], 'For looking at Saturn, the Moon and next door\'s satellite dish.'],
    ['silverrug', 'Silver Rug', 0, 40, 2, 2, 'r', ['rug', '#b8c0cc'], 'Like walking on tin foil, but warmer.'],
    ['robot', 'Robot Butler', 2, 300, 1, 1, 'f', ['robot', '#9aa4b0'], 'Does absolutely nothing except beep. Just like the real ones on Tomorrow\'s World.', { anim: 1, h: 48 }],
    ['spacepod', 'Egg Chair', 1, 120, 1, 1, 'f', ['eggchair', '#eeeae0'], 'A big white egg to sit in. Very 2001: A Space Odyssey.', { sit: 1 }],
  ]);
  add('outdoor', [
    ...each(['red', 'blue', 'green'], (k, cn, c) => ['deck_' + k, `Deckchair (${cn})`, 0, 35, 1, 1, 'f', ['deckchair', c], 'Takes eleven tries to put up. Folds up with you in it.', { sit: 1 }]),
    ['parasol', 'Parasol', 0, 40, 1, 1, 'f', ['parasol', '#f2c22e'], 'Keeps the sun off. In Britain, mostly keeps the rain off.', { h: 56 }],
    ['palm', 'Potted Palm', 0, 50, 1, 1, 'f', ['palm', '#3fa34a'], 'A little bit of Majorca for your bedroom.', { h: 58 }],
    ['gnome', 'Garden Gnome', 0, 30, 1, 1, 'f', ['gnome', '#d8342c'], 'He\'s watching you. He\'s always watching you.'],
    ['bbq', 'Barbecue', 1, 80, 1, 1, 'f', ['bbq', '#3a3a44'], 'Burnt on the outside, raw in the middle. Perfect. Click to light.', { use: 'fire', anim: 1 }],
    ['pool', 'Paddling Pool', 1, 90, 2, 2, 'r', ['ppool', '#3a9ad8'], 'Walk in! It\'s only up to your ankles. Freezing, though.', { anim: 1 }],
    ['sandcastle', 'Sandcastle', 0, 25, 1, 1, 'f', ['sandcastle', '#e8c878'], 'Made with a bucket and spade and a LOT of patience.'],
    ['bench', 'Park Bench', 0, 50, 2, 1, 'f', ['bench', '#8a5a32'], 'In loving memory of somebody who liked sitting down.', { sit: 1 }],
    ['hedge', 'Little Hedge', 0, 30, 1, 1, 'f', ['hedge', '#2f8a3a'], 'Trimmed into a cube. Your dad is very proud.'],
    ['tree', 'Apple Tree', 1, 100, 1, 1, 'f', ['tree', '#3fa34a'], 'Apples in the autumn, a rope swing in the summer.', { h: 72 }],
    ['flowers', 'Flower Bed', 0, 30, 1, 1, 'f', ['flowers', '#ef6fb0'], 'Daffodils, tulips and a lot of slugs.'],
  ]);
  add('fun', [
    ['tramp', 'Trampoline', 1, 120, 2, 2, 'r', ['tramp', '#3266d6'], 'Walk on it and BOING. No double-bouncing your little cousin.', { use: 'tramp' }],
    ['dice', 'Lucky Dice', 1, 75, 1, 1, 'f', ['dice', '#eeeae0'], 'A giant dice on a stand. Click to roll it: everyone sees the number.', { use: 'dice' }],
    ['juke', 'Jukebox', 2, 400, 1, 1, 'f', ['juke', '#d8342c'], 'Click it to play a tune for the whole room (if their speakers are on).', { use: 'juke', anim: 1, h: 52 }],
    ...each(['pink', 'blue', 'green'], (k, cn, c) => ['disco_' + k, `Disco Floor (${cn})`, 1, 60, 1, 1, 'r', ['disco', c], 'Light-up floor tile. Click it on and DANCE (type /dance).', { use: 'disco', anim: 1 }]),
    ['ballpit', 'Ball Pit', 1, 150, 2, 2, 'r', ['ballpit', '#f2c22e'], 'Walk in. Disappear up to your knees. Find a sock.'],
    ['tele', 'Tele-Booth', 2, 350, 1, 1, 'f', ['tele', '#3266d6'], 'Put two in your room. Walk into one, come out of the other. Science!', { use: 'tele', sit: 1, h: 58 }],
    ['vend', 'Fizzy Pop Machine', 1, 140, 1, 1, 'f', ['vend', '#d8342c'], 'Click for a can of pop. Free! (Rattles alarmingly.)', { use: 'vend', anim: 1, h: 56 }],
    ['pooltable', 'Pool Table', 2, 300, 2, 2, 'f', ['pooltable', '#2f8a3a'], 'Bar billiards for grown-ups. Nobody can find the chalk.'],
    ['ball', 'Beach Ball', 0, 30, 1, 1, 'r', ['beachball', '#d8342c'], 'Walk into it to kick it about!', { use: 'ball' }],
    ['bell', 'Shop Bell', 0, 30, 1, 1, 'f', ['shopbell', '#f2c22e'], 'DING! Click for service. There is no service.', { use: 'bell' }],
    ['karaoke', 'Karaoke Machine', 1, 160, 1, 1, 'f', ['karaoke', '#8a4ad0'], 'Two microphones, a tiny screen and every song your mom knows.', { use: 'juke', anim: 1 }],
  ]);
  add('wall', [
    ['p_rocket', 'Poster: Space Shuttle', 0, 25, 1, 1, 'w', ['poster', 'rocket'], 'Lift-off! Signed by nobody, but it looks official.'],
    ['p_band', 'Poster: The Static Pixies', 0, 25, 1, 1, 'w', ['poster', 'band'], 'Number 14 in the charts with "Dial Me Up". You have the cassingle.'],
    ['p_film', 'Poster: STAR RAIDERS II', 0, 25, 1, 1, 'w', ['poster', 'film'], 'In a galaxy a quite long way away... Coming soon to the Odeum.'],
    ['p_ork', 'Poster: WAAAGH!', 0, 25, 1, 1, 'w', ['poster', 'ork'], 'A big green one with a big green shout. You painted it yourself.'],
    ['p_play', 'Poster: Play More Games', 0, 25, 1, 1, 'w', ['poster', 'play'], 'From the middle of a games magazine. The staples left holes.'],
    ['p_cube', "Poster: Cube Master", 0, 25, 1, 1, 'w', ['poster', 'cube'], 'How to solve it in seven easy steps. Step one: give up.'],
    ['p_robot', 'Poster: Robo-Rumble', 0, 25, 1, 1, 'w', ['poster', 'robot'], 'Robots that fight! On BBC Two on Friday nights.'],
    ['window', 'Window', 0, 40, 1, 1, 'w', ['window', '#eeeae0'], 'Shows the real sky outside: day, dusk or night.'],
    ['wclock', 'Wall Clock', 0, 35, 1, 1, 'w', ['wclock', '#d8342c'], 'Tells the real time. Tick tock, homework o\'clock.', { anim: 1 }],
    ['shelf', 'Trophy Shelf', 0, 40, 1, 1, 'w', ['shelf', '#a0703a'], 'Swimming badge, Cycling Proficiency, and a plastic cup for "Taking Part".'],
    ['dartboard', 'Dartboard', 0, 35, 1, 1, 'w', ['dartboard', '#2a2a30'], 'Lots of little holes in the wall all round it.'],
    ...each(['pink', 'blue', 'green'], (k, cn, c) => ['neon_' + k, `Neon Sign (${cn})`, 1, 75, 1, 1, 'w', ['neon', c], 'Buzzes gently. Glows brilliantly. Click to switch on.', { use: 'lamp', anim: 1 }]),
    ['mirror', 'Mirror', 0, 30, 1, 1, 'w', ['mirror', '#cfe8ff'], 'Hair: checked. Spot: checked. Ready to go to the disco.'],
    ['painting', 'Landscape Painting', 0, 35, 1, 1, 'w', ['painting', '#3fa34a'], 'Mountains. Lake. A deer. Your nan has the same one.'],
    ['corkboard', 'Corkboard', 0, 30, 1, 1, 'w', ['corkboard', '#c8a070'], 'Cinema tickets, school timetable and a photo from the school trip.'],
    ['flag', 'Bedroom Flag', 0, 30, 1, 1, 'w', ['flag', '#3266d6'], 'Stripes in your favourite colours. Makes it a proper den.'],
  ]);
  add('season', [
    ['pumpkin', 'Jack-o\'-Lantern', 1, 75, 1, 1, 'f', ['pumpkin', '#f08a24'], 'Carved with a bread knife. Smells of candle. Click to light.', { sea: [1015, 1102], use: 'lamp', anim: 1 }],
    ['fireworks', 'Box of Fireworks', 1, 75, 1, 1, 'f', ['fireworks', '#d8342c'], 'Remember, remember. (Look, don\'t light. Your dad does the lighting.)', { sea: [1025, 1110] }],
    ['xmastree', 'Christmas Tree', 1, 100, 1, 1, 'f', ['xmastree', '#2f8a3a'], 'Tinsel, baubles and lights that only half work. Click them on.', { sea: [1201, 1231], use: 'lamp', anim: 1, h: 66 }],
    ['snowman', 'Snowman', 0, 40, 1, 1, 'f', ['snowman', '#eeeae0'], 'Carrot nose, coal eyes, your dad\'s old scarf.', { sea: [1201, 228] }],
    ['egg', 'Giant Easter Egg', 0, 40, 1, 1, 'f', ['easteregg', '#f2c22e'], 'Hollow chocolate. You have already eaten the back of it.', { sea: [320, 415] }],
    ['heart', 'Valentine Heart', 0, 30, 1, 1, 'f', ['heart', '#d8342c'], 'From a secret admirer. (It was your nan.)', { sea: [201, 216] }],
    ['eclipse', 'Eclipse Viewer', 1, 75, 1, 1, 'f', ['eclipse', '#3a3a44'], 'A pinhole box for watching the Sun go out. NEVER look at it directly!', { sea: [801, 818] }],
    ['icecart', 'Ice Cream Cart', 1, 90, 1, 1, 'f', ['icecart', '#ef6fb0'], 'Ninety-nines with a flake. Summer only!', { sea: [601, 831], h: 50 }],
    ['conkers', 'Bag of Conkers', 0, 25, 1, 1, 'f', ['conkers', '#8a5a32'], 'Your best one is a fiver. Soaked in vinegar. Totally allowed.', { sea: [915, 1031] }],
  ]);

  // ---------------------------------------------------------------- the weekly RARES (week 1 = Mon 28 Dec 1998 .. Sun 3 Jan 1999; week 53 = 27-31 Dec 1999)
  // [design, name, rarity, price, w, d, art colour, desc, extra]  lim: how many will ever exist
  const RARE_ROWS = [
    ['pillar', 'Marble Pillar', 3, 300, '#eeeae0', 'A proper Greek column. Holds up absolutely nothing. Very classy.'],
    ['lavaxl', 'Giant Lava Lamp (Gold)', 3, 350, '#f2c22e', 'As tall as you. The blobs move at the speed of a Sunday afternoon.', { use: 'lamp', anim: 1, h: 64 }],
    ['wyrm', 'Wyrm Lamp (Fire)', 3, 400, '#d8342c', 'A dragon that breathes fire when you click it. Do not leave it with the curtains.', { use: 'lamp', anim: 1, h: 56 }],
    ['throne', 'Golden Joypad Throne', 4, 600, '#f2c22e', 'Fit for the High Score King of your street.', { sit: 1, h: 58 }],
    ['icecream', 'Ice Cream Machine (Strawberry)', 3, 300, '#ef6fb0', 'Pull the handle: whipped ice cream for days.', { use: 'vend', h: 52 }],
    ['pillar', 'Gold Pillar', 3, 350, '#f2c22e', 'Like the marble one, but it cost more and you want everyone to know.'],
    ['egg', 'Pocket Pet Egg (Blue)', 3, 300, '#3266d6', 'A giant keyring pet egg. Feed it, play with it, never let it die.', { anim: 1 }],
    ['crystal', 'Crystal Ball', 3, 350, '#8a4ad0', 'Says your GCSE results will be "hazy". Click to look into the future.', { use: 'lamp', anim: 1 }],
    ['gramophone', 'Gramophone', 3, 300, '#c89a30', 'Your great-grandad\'s. Plays one record: very scratchily.', { use: 'juke' }],
    ['lavaxl', 'Giant Lava Lamp (Ice)', 3, 350, '#7ad0f0', 'Blue blobs in a giant lamp. Like the Arctic in a bottle.', { use: 'lamp', anim: 1, h: 64 }],
    ['armour', 'Suit of Armour', 3, 400, '#b8c0cc', 'From a castle. Possibly with somebody still inside. Clank.', { h: 60 }],
    ['snowglobe', 'Giant Snow Globe', 3, 300, '#cfe8ff', 'Shake it (click it) and watch it snow on the tiny town.', { use: 'lamp', anim: 1 }],
    ['wyrm', 'Wyrm Lamp (Ice)', 3, 400, '#7ad0f0', 'An ice dragon that breathes snowflakes. Keeps your pop cold.', { use: 'lamp', anim: 1, h: 56 }],
    ['saturn', 'Saturn Lamp', 3, 350, '#f08a24', 'A ringed planet on a stand. Glows like a sunset. Click it.', { use: 'lamp', anim: 1 }],
    ['rocking', 'Rocking Horse', 3, 300, '#eeeae0', 'Dapple grey, real horsehair tail, creaks at night.', { sit: 1 }],
    ['alienjar', 'Alien in a Jar (Green)', 3, 350, '#3fa34a', 'Found in a field in Wiltshire... no, wait, it came in a cereal box.', { anim: 1 }],
    ['pillar', 'Jade Pillar', 3, 350, '#3fa34a', 'Carved from (plastic) jade. From the far east (of the high street).'],
    ['treasure', 'Treasure Chest', 3, 400, '#a0703a', 'Pirate gold! (Chocolate coins. Click to open.)', { use: 'lamp' }],
    ['robodog', 'Robo-Dog', 3, 400, '#b8c0cc', 'Wags its tail on its own. Doesn\'t need walks. Does need batteries.', { anim: 1 }],
    ['egg', 'Pocket Pet Egg (Pink)', 3, 300, '#ef6fb0', 'Your pocket pet, giant-sized. Pink edition.', { anim: 1 }],
    ['ship', 'Ship in a Bottle', 3, 350, '#3266d6', 'How did they get it in there? Nobody knows. NOBODY.'],
    ['icecream', 'Ice Cream Machine (Mint)', 3, 300, '#7ae0b0', 'Mint choc chip, on tap.', { use: 'vend', h: 52 }],
    ['holo', 'Hologram Projector', 3, 450, '#22a7a0', 'Projects a tiny spinning cube of light. Cutting-edge 1999 tech!', { use: 'lamp', anim: 1 }],
    ['cubestatue', 'Golden Cube Statue', 4, 550, '#f2c22e', 'A puzzle cube, solved, in gold, on a plinth. Respect.'],
    ['moonrock', 'Moon Rock', 3, 400, '#9aa4b0', 'An actual (not actual) piece of the Moon on a velvet plinth.'],
    ['wyrm', 'Wyrm Lamp (Jade)', 3, 400, '#3fa34a', 'A green dragon lamp. Breathes green fire. The Gorks would approve.', { use: 'lamp', anim: 1, h: 56 }],
    ['throne', 'Ork Warboss Throne', 4, 600, '#3fa34a', 'Built from scrap, painted in green. Very WAAAGH. Very comfy.', { sit: 1, h: 58 }],
    ['crystal', 'Crystal Ball (Rose)', 3, 350, '#ef6fb0', 'Pink mist. Says "ask again later".', { use: 'lamp', anim: 1 }],
    ['discoball', 'Disco Ball Stand', 3, 450, '#cfe8ff', 'Sparkles all over the room when it\'s on. Friday night sorted.', { use: 'lamp', anim: 1, h: 62 }],
    ['speakerstack', 'Mega Speaker Stack', 3, 400, '#2a2a30', 'Four speakers, one amp, zero neighbours who still talk to you.', { use: 'juke', anim: 1, h: 56 }],
    ['snowglobe', 'Snow Globe (Night)', 3, 300, '#3a3a6a', 'A tiny snowy town at night. Click for snow.', { use: 'lamp', anim: 1 }],
    ['saturn', 'Saturn Lamp (Blue)', 3, 350, '#3266d6', 'A cool blue ringed planet. Click it on.', { use: 'lamp', anim: 1 }],
    ['teddy', 'Giant Teddy', 3, 300, '#a0703a', 'Won at the fair on the hook-a-duck. Bigger than the car.', { sit: 1 }],
    ['alienjar', 'Alien in a Jar (Purple)', 3, 350, '#8a4ad0', 'It blinked. It definitely blinked.', { anim: 1 }],
    ['pillar', 'Obsidian Pillar', 3, 400, '#3a3a44', 'Black, glossy and slightly spooky.'],
    ['icecream', 'Ice Cream Machine (Choc)', 3, 300, '#8a5a32', 'Chocolate ice cream. With a flake. Every time.', { use: 'vend', h: 52 }],
    ['holo', 'Hologram Projector (Red)', 3, 450, '#d8342c', 'A spinning red cube of light. Click to beam it up.', { use: 'lamp', anim: 1 }],
    ['egg', 'Pocket Pet Egg (Gold)', 4, 500, '#f2c22e', 'The golden one. Only twenty exist. Don\'t drop it.', { anim: 1, lim: 20 }],
    ['wyrm', 'Wyrm Lamp (Gold)', 4, 550, '#f2c22e', 'The king of the dragon lamps. Gold scales, gold fire.', { use: 'lamp', anim: 1, h: 56, lim: 20 }],
    ['lavaxl', 'Giant Lava Lamp (Toxic)', 3, 350, '#7ae04a', 'Glowing green goo. Definitely not radioactive. Probably.', { use: 'lamp', anim: 1, h: 64 }],
    ['teddy', 'Giant Teddy (Panda)', 3, 300, '#eeeae0', 'Black and white and cuddly all over.', { sit: 1 }],
    ['gfloppy', 'Golden Floppy Statue', 4, 500, '#f2c22e', 'A 1.44 MB floppy disk, cast in gold, the size of a door. For services to saving.', { lim: 25 }],
    ['ship', 'Ship in a Bottle (Pirate)', 3, 350, '#2a2a30', 'Black sails, tiny skull and crossbones.'],
    ['discoball', 'Disco Ball Stand (Gold)', 3, 450, '#f2c22e', 'A golden glitterball. Saturday Night Fever, Friday night edition.', { use: 'lamp', anim: 1, h: 62 }],
    ['armour', 'Suit of Gold Armour', 4, 550, '#f2c22e', 'For the knight who has everything. Including a gold helmet.', { h: 60, lim: 20 }],
    ['chopper', 'Chopper Bike', 3, 400, '#d8342c', 'Your dad\'s old bike. Big back wheel, gear stick in the middle. Legendary.'],
    ['moonrock', 'Moon Rock (Glowing)', 3, 450, '#7ad0f0', 'Glows in the dark. That is normal for moon rocks. Isn\'t it?', { anim: 1 }],
    ['rocking', 'Rocking Unicorn', 3, 350, '#ef6fb0', 'Like a rocking horse, but with a horn and more glitter.', { sit: 1 }],
    ['crystal', 'Crystal Ball (Ice)', 3, 350, '#7ad0f0', 'Shows snow. Every time. Even in summer.', { use: 'lamp', anim: 1 }],
    ['shuttle', 'Space Shuttle Model', 4, 650, '#eeeae0', 'A metre-long model shuttle on a launch stand. Click for lift-off!', { use: 'lamp', anim: 1, h: 66, lim: 20 }],
    ['snowglobe', 'Snow Globe (Christmas)', 3, 350, '#d8342c', 'A tiny Santa in a tiny sleigh. Click for snow.', { use: 'lamp', anim: 1 }],
    ['throne', 'Silver Millennium Throne', 4, 650, '#b8c0cc', 'Ready for the year 2000. Sit in it at midnight.', { sit: 1, h: 58, lim: 20 }],
    ['y2k', 'Millennium Countdown Clock', 4, 700, '#2a2a30', 'Counts down to 00:00:00 on 01/01/2000. Will your computer survive?', { anim: 1, h: 58, lim: 25 }],
  ];
  const RARES = RARE_ROWS.map(([dz, n, r, p, col, ds, x], i) => Object.assign({ id: `furni.rare${String(i + 1).padStart(2, '0')}`, n, r, p, w: 1, d: 1, k: 'f', art: [dz, col], ds, pg: 'rares', wk: i + 1, lim: r >= 4 ? 25 : 40 }, x || {}));
  F.push(...RARES);
  // prizes (never sold): the Room of the Week cup
  F.push({ id: 'furni.rotw', n: 'Room of the Week Cup', r: 4, p: 0, w: 1, d: 1, k: 'f', art: ['cup', '#f2c22e'], ds: 'Awarded by the JackWorld Crew to the Room of the Week. Put it somewhere everybody can see.', pg: '', prize: 1 });

  // ---------------------------------------------------------------- public-room-only bits (not sold, not loot)
  const PUBF = [
    ['recep', 'Reception Desk', 3, 1, 'f', ['recep', '#a0703a']], ['fountain', 'Fountain', 2, 2, 'f', ['fountain', '#cfd4dc'], { anim: 1 }],
    ['statue', 'Statue of the Mayor', 2, 2, 'f', ['statue', '#9aa4b0'], { h: 80 }], ['townclock', 'Town Clock', 1, 1, 'f', ['townclock', '#3a3a44'], { h: 90, anim: 1 }],
    ['stall', 'Market Stall', 2, 1, 'f', ['stall', '#d8342c'], { h: 54 }], ['phonebox', 'Phone Box', 1, 1, 'f', ['phonebox', '#d8342c'], { h: 64, use: 'phone' }],
    ['lamppost', 'Lamp Post', 1, 1, 'f', ['lamppost', '#2a2a30'], { h: 70, anim: 1 }], ['bandstand', 'Bandstand', 3, 3, 'f', ['bandstand', '#eeeae0'], { h: 70 }],
    ['oak', 'Big Oak Tree', 1, 1, 'f', ['tree', '#2f8a3a'], { h: 80 }], ['duck', 'Duck', 1, 1, 'r', ['duck', '#eeeae0'], { anim: 1 }],
    ['hut', 'Ice Cream Hut', 2, 2, 'f', ['hut', '#ef6fb0'], { h: 66 }], ['lifeguard', 'Lifeguard Chair', 1, 1, 'f', ['lifeguard', '#eeeae0'], { h: 66 }],
    ['bottle', 'Message in a Bottle', 1, 1, 'r', ['msgbottle', '#7ad0a0'], { use: 'note' }], ['console', 'Control Console', 2, 1, 'f', ['console', '#9aa4b0'], { anim: 1 }],
    ['bigrocket', 'Rocket', 2, 2, 'f', ['bigrocket', '#eeeae0'], { h: 120 }], ['crater', 'Crater', 2, 2, 'r', ['crater', '#9a9aa0']],
    ['moonflag', 'Flag', 1, 1, 'f', ['moonflag', '#eeeae0'], { h: 60 }], ['snowwall', 'Snow Fort Wall', 2, 1, 'f', ['snowwall', '#eef4ff']],
    ['snowpile', 'Snow Pile', 1, 1, 'f', ['snowpile', '#eef4ff']], ['pad_a', 'Answer Pad A', 2, 2, 'r', ['pad', '#d8342c', 'A']],
    ['pad_b', 'Answer Pad B', 2, 2, 'r', ['pad', '#3266d6', 'B']], ['pad_c', 'Answer Pad C', 2, 2, 'r', ['pad', '#3fa34a', 'C']], ['pad_d', 'Answer Pad D', 2, 2, 'r', ['pad', '#f2c22e', 'D']],
    ['quizdesk', 'Quiz Host Desk', 2, 1, 'f', ['quizdesk', '#8a4ad0'], { anim: 1 }], ['djbooth', 'DJ Booth', 2, 1, 'f', ['djbooth', '#2a2a30'], { anim: 1 }],
    ['notice', 'Notice Board', 2, 1, 'f', ['noticeboard', '#8a5a32'], { use: 'notice', h: 56 }], ['airlock', 'Airlock', 1, 1, 'r', ['airlock', '#9aa4b0']],
    ['skilift', 'Ski Lift', 1, 1, 'f', ['skilift', '#d8342c'], { h: 70 }], ['sign', 'Signpost', 1, 1, 'f', ['signpost', '#8a5a32'], { h: 60 }],
    ['earthwin', 'Big Window', 1, 1, 'w', ['bigwindow', 'earth']], ['starwin', 'Star Window', 1, 1, 'w', ['bigwindow', 'stars']],
    ['banner', 'Welcome Banner', 3, 1, 'w', ['banner', '#d8342c', 'WELCOME TO', 'JACKWORLD!']], ['quiet', 'Silence Please', 3, 1, 'w', ['banner', '#2a5a2a', 'SILENCE', 'PLEASE!']], ['seats', 'Waiting Seats', 2, 1, 'f', ['seats', '#3266d6'], { sit: 1 }],
    ['xmchair', 'Musical Chair', 1, 1, 'f', ['mchair', '#f2c22e'], { sit: 1 }], ['icerink', 'Ice', 2, 2, 'r', ['ice', '#cfe8ff']],
    ['pine', 'Snowy Pine', 1, 1, 'f', ['pine', '#2f6a4a'], { h: 76 }], ['parkgate', 'Park Gate', 1, 1, 'f', ['gate', '#2a2a30'], { h: 56 }],
    ['palmbig', 'Palm Tree', 1, 1, 'f', ['palm', '#3fa34a', 1], { h: 92 }], ['rockpool', 'Rock', 1, 1, 'f', ['rock', '#8a8a90']],
    ['lift', 'Lift Doors', 1, 1, 'w', ['liftdoor', '#b8c0cc']], ['door', 'Door', 1, 1, 'w', ['door', '#8a5a32']], ['arcmachine', 'Arcade Machine', 1, 1, 'f', ['arcade', '#d8342c'], { anim: 1, h: 56, use: 'arcade' }],
    ['scoreboard', 'Scoreboard', 2, 1, 'w', ['scoreboard', '#2a2a30'], { anim: 1 }], ['skyline', 'Rooftop Rail', 1, 1, 'f', ['rail', '#9aa4b0']],
    ['grotgub', 'Gubbinz', 1, 1, 'f', ['gubbinz', '#3fa34a'], { use: 'grot', anim: 1 }],
  ];
  for (const [id, n, w, d, k, art, x] of PUBF) F.push(Object.assign({ id: 'furni.pub_' + id, n, r: 0, p: 0, w, d, k, art, ds: '', pg: '', pub: 1 }, x || {}));
  for (const f of F) FURNI[f.id] = f;

  // ================================================================ room styles
  // FLOORS / WALLS: [id, name, price, art]   (price 0 = everybody has it)
  const FLOORS = [
    ['wood', 'Floorboards', 0, ['boards', '#b98a52']], ['carpet', 'Blue Carpet', 0, ['carpet', '#5a72b8']], ['lino', 'Kitchen Lino', 0, ['check', '#e8e0c8', '#c8b898']],
    ['red', 'Red Carpet', 40, ['carpet', '#a8343a']], ['green', 'Astroturf', 40, ['grass', '#4aa04a']], ['checker', 'Chessboard', 60, ['check', '#eeeae0', '#3a3a44']],
    ['tiles', 'Bathroom Tiles', 50, ['tiles', '#cfe8f8']], ['shag', 'Purple Shag Pile', 80, ['carpet', '#7a4ab0']], ['metal', 'Space Plate', 100, ['plate', '#9aa4b0']],
    ['sand', 'Beach Sand', 80, ['sand', '#e8cf8a']], ['stars', 'Starfield', 150, ['starfloor', '#1a1a3a']], ['disco', 'Disco Squares', 200, ['discofloor', '#2a2a3a']],
    ['marble', 'Marble', 150, ['marble', '#e8e4dc']], ['lava', 'Hot Lava (it is fine)', 250, ['lavafloor', '#c83a1a']],
  ];
  const WALLS = [
    ['magnolia', 'Magnolia', 0, ['plain', '#efe4c8']], ['sky', 'Sky Blue', 0, ['plain', '#9cc8ec']], ['mint', 'Mint', 0, ['plain', '#b8e0c0']],
    ['stripes', 'Regency Stripes', 40, ['stripes', '#c8384a', '#e8d8b8']], ['dots', 'Polka Dots', 40, ['dots', '#f2c22e', '#3266d6']], ['brick', 'Bare Brick', 60, ['brick', '#a8543a']],
    ['wood', 'Wood Panelling', 60, ['panel', '#8a5a32']], ['stars', 'Glow Stars', 80, ['starwall', '#1a1a4a']], ['camo', 'Green Camo', 80, ['camo', '#4a6a2a']],
    ['hearts', 'Hearts', 60, ['hearts', '#ef8fc0']], ['code', 'Green Screen', 120, ['code', '#0a1a0a']], ['space', 'Deep Space', 150, ['space', '#0a0a2a']],
    ['flames', 'Go-Faster Flames', 150, ['flames', '#2a2a30']], ['gold', 'Gold Leaf', 300, ['plain', '#d8b040', 1]],
  ];
  // MODELS: [id, name, price, max furni, tile map (rows = y from the back), door [x, y] (on the left wall, x = 0)]
  const MODELS = [
    ['box', 'The Shoebox', 0, 30, ['......', '......', '......', '......', '......', '......'], [0, 3]],
    ['den', 'The Den', 250, 50, ['........', '........', '........', '........', '........', '........', '........', '........'], [0, 4]],
    ['loft', 'The L-Shaped Loft', 600, 75, ['..........', '..........', '..........', '..........', '..........', '..........', '......xxxx', '......xxxx', '......xxxx', '......xxxx'], [0, 4]],
    ['hall', 'The Big Hall', 1500, 100, ['............', '............', '............', '............', '............', '............', '............', '............', '............', '............'], [0, 5]],
    ['pent', 'The Penthouse', 4000, 150, ['..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............'], [0, 6]],
  ];
  const ROOM_CATS = [['chill', 'Chill-Out'], ['games', 'Gaming'], ['party', 'Party'], ['art', 'Art & Design'], ['trade', 'Trading'], ['club', 'Clubs & Fans'], ['quiet', 'Quiet / Revision']];

  // ================================================================ public rooms
  // map chars: . floor, x nothing, w water, g grass, s sand, c cobbles, n snow, m metal, d moon dust, p path, i ice, k disco floor
  // fix: [furniId (without furni.), x, y, rot(0|1)]  (wall things: [id, 'L'|'R', pos, height])
  // exits: [x, y, roomId, label]  spawn: [x, y]   in: walls? (indoor rooms have walls; outdoor ones have a backdrop)
  // npcs: [name, x, y, look, lines[]]: the regulars who hang about there
  const PUB = {
    lobby: {
      n: 'JackWorld Lobby', ds: 'Where everyone arrives. Check the notice board, meet people, then go exploring!', ico: 'lobby', in: 1, floor: ['check', '#d8c8a8', '#b89870'], wall: ['panel', '#7a5a8a'], cat: 'chill',
      map: ['..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............'],
      spawn: [0, 7],
      fix: [['pub_recep', 6, 1, 0], ['pub_fountain', 6, 6, 0], ['pub_seats', 1, 10, 0], ['pub_seats', 4, 10, 0], ['plant', 4, 0, 0], ['plant', 13, 11, 0], ['plant', 0, 2, 0], ['sofa_red', 11, 5, 1], ['sofa_red', 11, 8, 1], ['coffee', 10, 7, 0], ['pub_notice', 9, 0, 0], ['lava_purple', 13, 4, 0], ['bigrug_red', 5, 5, 0],
        ['pub_banner', 'R', 5, 0], ['p_play', 'R', 12, 0], ['wclock', 'R', 8, 0], ['window', 'L', 2, 0], ['window', 'L', 9, 0], ['pub_door', 'L', 4, 0], ['pub_lift', 'R', 2, 0], ['pub_lift', 'L', 0, 0], ['pub_lift', 'R', 13, 0], ['pub_door', 'L', 7, 0]],
      exits: [[2, 0, 'arcade', 'Up the stairs to the Pixel Arcade'], [0, 0, 'roof', 'Lift to the Rooftop'], [0, 7, 'square', 'Out to Jacktown Square'], [13, 0, 'space', 'The Space Lift'], [0, 4, 'library', 'The Revision Library (shh!)']],
      npcs: [['Robo', 7, 0, 'robot', ['Welcome to JackWorld! Click the floor to walk about.', 'Type in the box at the bottom to chat. Everyone in the room can see it.', 'Press the Rooms button to go anywhere. Or just walk through a door!', 'Members get their own room. Press My Room. It is FREE!', 'Furni comes from the Catalogue. You pay in Rupees.', 'New RARE in the Catalogue every Monday. Be quick!', 'Be nice, never tell anyone where you live, and press Report if someone is horrible.', 'The lift goes up to the Rooftop. The stairs go to the Arcade.']],
        ['Sophie', 1, 10, 'sophie', ['just got in from school. SO tired', 'double maths AND double science today. why', 'anyone got the french homework? asking for a friend', 'my mom says i can only go on for an hour because of the phone bill', 'mocks in 3 weeks. definitely going to start revising tomorrow'], 'school'],
        ['Gaz', 4, 10, 'gaz', ['wot u lot up 2', 'got detention for chewing gum. it was a POLO', 'bus driver didnt stop again. had to walk', 'anyone watching robo rumble on friday'], 'school'],
        ['Kirsty', 11, 6, 'kirsty', ['brb tea\'s ready', 'has anyone done the geography coursework yet?? :(', 'friday disco on the roof tonight!!', 'my brother keeps picking up the phone and knocking me off the internet', 'a/s/l? lol jk dont answer that, never answer that', 'got my mock results tomorrow... dont wanna talk about it']]],
    },
    arcade: {
      n: 'Pixel Arcade', ds: 'Neon, noise and the Quiz Booth. Stand on A, B, C or D to answer!', ico: 'arcade', in: 1, floor: ['carpet', '#2a1a4a', 1], wall: ['starwall', '#1a0a2a'], cat: 'games', game: 'quiz',
      map: ['............', '............', '............', '............', '............', '............', '............', '............', '............', '............', '............', '............'],
      spawn: [0, 10],
      fix: [['pub_arcmachine', 0, 1, 0], ['pub_arcmachine', 0, 2, 0], ['pub_arcmachine', 0, 3, 0], ['arcade_blue', 0, 4, 0], ['arcade_purple', 0, 5, 0], ['pinball', 3, 0, 0], ['pinball', 6, 0, 0], ['footy', 9, 0, 0],
        ['pub_quizdesk', 6, 4, 0], ['pub_pad_a', 4, 6, 0], ['pub_pad_b', 6, 6, 0], ['pub_pad_c', 8, 6, 0], ['pub_pad_d', 10, 6, 0], ['gamechair', 11, 11, 0], ['vend', 11, 3, 0], ['speakers', 11, 2, 0],
        ['pub_scoreboard', 'R', 5, 0], ['neon_pink', 'R', 1, 0], ['neon_blue', 'L', 7, 0], ['p_play', 'L', 8, 0], ['pub_door', 'L', 10, 0]],
      exits: [[0, 10, 'lobby', 'Down the stairs to the Lobby']],
      npcs: [['Quizmaster Quentin', 7, 3, 'quentin', ['Step right up! Press START on the Quiz Booth to begin.', 'Stand on the coloured pad of your answer before the time runs out!', 'Eight questions a round. Top score wins Rupees!']],
        ['Dave', 10, 9, 'dave', ['Goldenballs tonight at mine? no Oddjob, Jack', 'Luke owes me 50p from the last time', 'i got 3 stars on every Marlo 64 level. well, most of them', 'Rainbow Road is the BEST track and nobody can tell me otherwise', 'my mom says the ULTRA 64 has to go off at 9. NINE'], ''],
        ['Darren', 1, 9, 'darren', ['im SO close to the high score on that pinball', 'whos got a 20p', 'skipping revision for this. worth it', 'my mate says theres a secret room in the space station. he lies a lot tho']]],
    },
    roof: {
      n: 'Rooftop Disco', ds: 'The disco on the roof. Friday nights it is HEAVING. Musical Chairs any time!', ico: 'roof', in: 0, floor: ['plate', '#5a5a6a'], sky: 'city', cat: 'party', game: 'chairs',
      map: ['xx........xx', 'x..........x', '............', '............', '...kkkkkk...', '...kkkkkk...', '...kkkkkk...', '...kkkkkk...', '............', '............', 'x..........x', 'xx........xx'],
      spawn: [2, 2],
      fix: [['pub_djbooth', 5, 1, 0], ['speakers', 4, 1, 0], ['speakers', 7, 1, 0], ['plant', 0, 3, 0], ['plant', 11, 3, 0], ['lava_purple', 0, 8, 0], ['lava_green', 11, 8, 0], ['palm', 2, 1, 0], ['palm', 9, 1, 0], ['stool', 1, 9, 0], ['stool', 10, 9, 0], ['bench', 4, 11, 0]],
      exits: [[2, 2, 'lobby', 'Lift down to the Lobby']],
      npcs: [['DJ Spinz', 6, 0, 'dj', ['This one goes out to everyone revising. Stop revising! :)', 'Requests? I have got Dial Me Up on 12-inch.', 'Musical Chairs! Press PLAY on the panel. When the music stops, RUN for a chair!', 'FRIDAY NIGHT DISCO from 7pm. Bring your best /dance.']],
        ['JackK', 2, 9, 'jackk', ['WAAAGH! (sorry, wrong chat)', 'did the cube in 2 mins 10 today. new record', 'this song is well good', 'Jack said hes coming online after tea'], ''],
        ['Stacey', 5, 5, 'stacey', ['FRIDAY!!!!!!', 'its the weekend!!! no homework till sunday night', 'DJ play the pixel party one!!', 'love this tune'], 'fri'],
        ['Ryan', 7, 6, 'ryan', ['look at my moves', 'dont tell my mom im still up', 'this is better than the school disco. no teachers'], 'fri'],
        ['Becky', 9, 9, 'becky', ['love this song!!!!', 'my mom says im not allowed out on school nights. so im here instead :)', 'anyone going to the school disco next week?', 'brb mom wants the phone']]],
    },
    square: {
      n: 'Jacktown Square', ds: 'The middle of everything. Paths to the Park, the Beach and the Snowy Peak.', ico: 'square', in: 0, floor: ['cobble', '#a8a090'], sky: 'town', cat: 'chill',
      map: ['xxxxxccccccxxxxx', 'xxxxccccccccxxxx', 'xxxccccccccccxxx', 'xxccccccccccccxx', 'xcccccccccccccccc'.slice(0, 16), 'pccccccccccccccp', 'pccccccccccccccp', 'cccccccccccccccc', 'xcccccccccccccxx', 'xxccccccccccccxx', 'xxxccccccccccxxx', 'xxxxcccccpccxxxx', 'xxxxxxxxpxxxxxxx'],
      spawn: [7, 1],
      fix: [['pub_statue', 7, 5, 0], ['pub_townclock', 6, 0, 0], ['pub_stall', 2, 8, 0], ['pub_stall', 11, 8, 0], ['pub_phonebox', 13, 3, 0], ['pub_lamppost', 4, 3, 0], ['pub_lamppost', 11, 3, 0], ['pub_lamppost', 4, 10, 0],
        ['bench', 3, 5, 1], ['bench', 12, 5, 1], ['bin', 10, 10, 0], ['flowers', 2, 4, 0], ['flowers', 13, 7, 0], ['pub_grotgub', 9, 9, 0], ['pub_sign', 1, 4, 0]],
      exits: [[7, 0, 'lobby', 'Into JackWorld HQ (the Lobby)'], [0, 5, 'park', 'The path to Sunnyside Park'], [15, 5, 'beach', 'The path to Paradise Beach'], [8, 12, 'peak', 'The ski lift up the Snowy Peak']],
      npcs: [['The Mayor', 9, 3, 'mayor', ['Welcome to Jacktown! Mind the pigeons.', 'My statue is MUCH bigger than me. That is how statues work.', 'Room of the Week is on the notice board in the Lobby. Very prestigious!', 'Have you tried clicking my statue? Do not click my statue.']],
        ['Lee', 5, 7, 'lee', ['anyone wanna go halves on a pizza', 'just got off the bus. school was SO long today', 'GCSEs next summer and i still dont know what a quadratic is', 'tea\'s at 6. got ages yet']]],
    },
    park: {
      n: 'Sunnyside Park', ds: 'Grass, trees, ducks and a bandstand. Feed the ducks (you can\'t, they\'re pixels).', ico: 'park', in: 0, floor: ['grass', '#5ab04a'], sky: 'park', cat: 'chill',
      map: ['xxggggggggggggxx', 'xgggggggggggggggg'.slice(0, 16), 'gggggggggggggggg', 'ggggpppppppppggg', 'gggpgggggggggpgg', 'gggpggwwwwgggpgg', 'pppgggwwwwwggpgg', 'gggpggwwwwwggpgg', 'gggpgggwwwgggpgg', 'gggppppppppppggg', 'gggggggggggggggg', 'xggggggggggggggx', 'xxggggggggggggxx'],
      spawn: [0, 6],
      fix: [['pub_bandstand', 11, 10, 0], ['pub_oak', 1, 1, 0], ['pub_oak', 14, 2, 0], ['pub_oak', 2, 11, 0], ['tree', 9, 1, 0], ['tree', 4, 1, 0], ['bench', 5, 2, 0], ['bench', 9, 2, 0], ['bench', 1, 8, 1], ['pub_duck', 7, 6, 0], ['pub_duck', 9, 7, 0],
        ['flowers', 6, 10, 0], ['flowers', 7, 10, 0], ['pub_lamppost', 13, 9, 0], ['pub_lamppost', 4, 4, 0], ['bin', 13, 4, 0], ['pub_parkgate', 0, 5, 0], ['hedge', 15, 6, 0], ['hedge', 15, 7, 0]],
      exits: [[0, 6, 'square', 'Back to Jacktown Square']],
      npcs: [['Luke', 10, 2, 'luke', ['anyone want to swap Game Lad games', 'Zelda on the Game Lad Color is SO good', 'my little brother sat on my Game Lad. it still works', 'meet at the bandstand?'], ''],
        ['Sam', 8, 4, 'sam', ['the ducks here are well rude', 'revising in the park. well. sitting in the park with a revision book', 'saw a squirrel nick a whole sandwich', 'acorn quest season!!! mine is a twelver']]],
    },
    beach: {
      n: 'Paradise Beach', ds: 'Sand, sea and an ice cream hut. The sea is FREEZING. It is always freezing.', ico: 'beach', in: 0, floor: ['sand', '#e8cf8a'], sky: 'sea', cat: 'chill',
      map: ['xxsssssssssswwww', 'xssssssssssswwww', 'ssssssssssswwwww', 'ssssssssssswwwww', 'psssssssssswwwww', 'pssssssssswwwwww', 'ssssssssswwwwwww', 'sssssssswwwwwwww', 'xsssssswwwwwwwww', 'xxsssswwwwwwwwww', 'xxxsswwwwwwwwwww', 'xxxxwwwwwwwwwwww'],
      spawn: [0, 4],
      fix: [['pub_hut', 2, 0, 0], ['pub_lifeguard', 9, 3, 0], ['pub_palmbig', 1, 7, 0], ['pub_palmbig', 6, 0, 0], ['deck_red', 4, 4, 0], ['deck_blue', 5, 4, 0], ['deck_green', 7, 6, 0], ['parasol', 6, 5, 0], ['sandcastle', 3, 7, 0], ['pub_bottle', 7, 7, 0], ['ball', 5, 2, 0], ['pub_rockpool', 10, 1, 0]],
      exits: [[0, 4, 'square', 'Back to Jacktown Square']],
      npcs: [['Lifeguard Lorraine', 9, 4, 'lifeguard', ['No running! No bombing! No fun! (I am joking. Have fun.)', 'The water is 12 degrees. That is cold. Trust me.', 'Somebody keeps leaving bottles on the beach. With NOTES in.']],
        ['Gemma', 3, 3, 'gemma', ['wish it was the summer holidays again', 'getting an ice cream, anyone want one', 'my sunburn from august is STILL peeling', 'brb tea\'s ready']]],
    },
    space: {
      n: 'Space Station JW-1', ds: 'Two hundred miles up. Mind the airlock (no, really, mind it).', ico: 'space', in: 1, floor: ['plate', '#8a94a4'], wall: ['space', '#14142a'], cat: 'chill',
      map: ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........'],
      spawn: [0, 5],
      fix: [['pub_console', 2, 0, 0], ['pub_console', 5, 0, 0], ['pub_bigrocket', 7, 1, 0], ['chrome', 3, 4, 0], ['blow_blue', 2, 4, 0], ['blow_pink', 4, 4, 0], ['plasma', 9, 9, 0], ['telescope', 1, 9, 0], ['silverrug', 4, 6, 0], ['robot', 8, 6, 0], ['pub_airlock', 9, 4, 0],
        ['pub_earthwin', 'R', 1, 0], ['pub_starwin', 'R', 4, 0], ['pub_starwin', 'L', 2, 0], ['pub_earthwin', 'L', 7, 0], ['pub_lift', 'L', 5, 0]],
      exits: [[0, 5, 'lobby', 'The Space Lift down to the Lobby'], [9, 4, 'moon', 'The airlock (where does it go?)']],
      npcs: [['Callum', 2, 8, 'callum', ['Half-Loaf is the best game ever made. fact.', 'my new 3D card makes everything look AMAZING', 'should be revising. am not revising', 'brb, dad needs the phone line'], ''],
        ['Commander Nova', 6, 4, 'nova', ['Welcome aboard JW-1! Do not press the big red button.', 'Nine planets in our solar system, and I have been to none of them.', 'The airlock is for authorised personnel only. And curious people.', 'From up here you can see your house. Do not tell anyone where it is though!']]],
    },
    moon: {
      n: 'Moon Base Zero', ds: 'A secret base on the Moon. You are walking on the Moon! Low gravity, high bounce.', ico: 'moon', in: 0, floor: ['moondust', '#a8a8ac'], sky: 'moon', cat: 'chill', hidden: 1,
      map: ['xxxddddxxx', 'xxddddddxx', 'xddddddddx', 'dddddddddd', 'dddddddddd', 'dddddddddd', 'dddddddddd', 'xddddddddx', 'xxddddddxx', 'xxxddddxxx'],
      spawn: [3, 3],
      fix: [['pub_crater', 5, 5, 0], ['pub_crater', 2, 6, 0], ['pub_moonflag', 6, 2, 0], ['pub_airlock', 3, 3, 0], ['rare25', 7, 4, 0]],
      exits: [[3, 3, 'space', 'Back through the airlock']],
      npcs: [],
    },
    library: {
      n: 'The Revision Library', ds: 'A quiet room for revising. (Nobody revises.) Shh!', ico: 'library', in: 1, floor: ['boards', '#9a6a3a'], wall: ['panel', '#3a5a3a'], cat: 'quiet',
      map: ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........'],
      spawn: [0, 8],
      fix: [['bookcase', 1, 0, 0], ['bookcase', 2, 0, 0], ['bookcase', 3, 0, 0], ['bookcase', 5, 0, 0], ['bookcase', 6, 0, 0], ['bookcase', 7, 0, 0], ['bookcase', 0, 2, 1], ['bookcase', 0, 3, 1], ['bookcase', 0, 5, 1],
        ['desk', 2, 3, 0], ['dchair', 2, 4, 0], ['dchair', 3, 4, 0], ['desk', 5, 3, 0], ['dchair', 5, 4, 0], ['dchair', 6, 4, 0], ['desk', 2, 6, 0], ['dchair', 2, 7, 0], ['dchair', 3, 7, 0], ['desk', 5, 6, 0], ['dchair', 5, 7, 0], ['dchair', 6, 7, 0],
        ['pcdesk', 8, 2, 1], ['chair', 8, 4, 0], ['globe', 9, 9, 0], ['plant', 9, 0, 0], ['lamp', 8, 8, 0], ['beanbag_green', 8, 6, 0],
        ['pub_quiet', 'R', 3, 0], ['wclock', 'R', 8, 0], ['p_cube', 'L', 7, 0], ['pub_door', 'L', 8, 0]],
      exits: [[0, 8, 'lobby', 'Back to the Lobby']],
      npcs: [['Mrs Hush', 9, 3, 'hush', ['Shhhh!', 'This is a REVISION room. Not a chatting room.', 'Books go back on the shelf the way you found them, please.', 'No food, no drink, no Eggberts.', 'If I hear one more beep from that pocket pet...'], ''],
        ['Priya', 3, 4, 'priya', ['ok if i revise for 10 more minutes i can go to the disco', 'what is the difference between a simile and a metaphor. asking for my english mock', 'i have made a revision timetable. it took 3 hours. i have not started revising', 'brb, tea\'s ready'], 'school'],
        ['Owen', 5, 7, 'owen', ['the periodic table is just pocket critters for science', 'i have read the same page 4 times', 'mrs hush took my game lad off me AGAIN'], '']],
    },
    peak: {
      n: 'The Snowy Peak', ds: 'Snow all year round! Make snowballs and throw them at your mates.', ico: 'peak', in: 0, floor: ['snow', '#eef4ff'], sky: 'peak', cat: 'games', game: 'snow',
      map: ['xxxnnnnnnnnxxx', 'xxnnnnnnnnnnxx', 'xnnnnnnnnnnnnx', 'nnnnnnnnnnnnnn', 'nnnniinnnnnnnn', 'nnnniinnnnnnnn', 'nnnnnnnnnniinn', 'nnnnnnnnnniinn', 'nnnnnnnnnnnnnn', 'xnnnnnnnnnnnnx', 'xxnnnnnnnnnnxx', 'xxxnnnnnnnnxxx'],
      spawn: [6, 0],
      fix: [['pub_skilift', 6, 0, 0], ['pub_snowwall', 2, 3, 0], ['pub_snowwall', 9, 3, 0], ['pub_snowwall', 3, 8, 0], ['pub_snowwall', 9, 8, 0], ['pub_snowpile', 6, 5, 0], ['pub_snowpile', 7, 6, 0], ['pub_pine', 1, 2, 0], ['pub_pine', 12, 2, 0], ['pub_pine', 1, 9, 0], ['pub_pine', 12, 9, 0], ['snowman', 3, 1, 0]],
      exits: [[6, 1, 'square', 'The ski lift down to Jacktown Square']],
      npcs: [['Ski Instructor Sven', 8, 1, 'sven', ['Press MAKE SNOWBALL, then click on somebody to throw!', 'Hit someone and they go dizzy for a bit. Ha!', 'Snowball fights start when two or more people are here.']]],
    },
  };
  const PUB_ORDER = ['lobby', 'square', 'arcade', 'roof', 'park', 'beach', 'space', 'peak', 'library', 'moon'];
  // the regulars' looks (avatar arrays, see AV below)
  const NPC_AV = {
    robot: [5, 0, 0, 0, 5, 11, 0, 11, 1], kirsty: [0, 1, 4, 3, 1, 6, 2, 1, 0], quentin: [0, 0, 1, 7, 3, 4, 0, 0, 0], darren: [0, 2, 2, 1, 2, 1, 0, 1, 3], dj: [0, 3, 3, 0, 4, 7, 0, 7, 0],
    becky: [0, 0, 5, 2, 0, 9, 3, 8, 2], mayor: [0, 0, 1, 7, 3, 7, 0, 7, 0], lee: [0, 1, 0, 0, 6, 2, 0, 1, 1], sam: [0, 4, 6, 1, 2, 3, 1, 6, 2], lifeguard: [0, 2, 4, 2, 0, 0, 1, 0, 2],
    gemma: [0, 1, 7, 3, 1, 10, 1, 2, 2], sophie: [0, 0, 9, 1, 9, 5, 3, 7, 0], gaz: [0, 2, 6, 0, 2, 7, 4, 7, 1], stacey: [0, 1, 5, 3, 8, 5, 3, 0, 1], ryan: [0, 3, 11, 0, 7, 8, 0, 12, 1],
    hush: [0, 1, 9, 4, 9, 4, 3, 7, 2], priya: [0, 3, 7, 0, 2, 5, 0, 0, 0], owen: [0, 0, 10, 2, 3, 2, 0, 7, 0],
    dave: [0, 1, 1, 1, 6, 0, 0, 1, 1], luke: [0, 0, 3, 2, 0, 1, 1, 7, 0], jackk: [0, 2, 11, 0, 2, 4, 4, 7, 1], callum: [0, 0, 2, 6, 8, 9, 0, 12, 0], nova: [0, 3, 2, 0, 5, 5, 0, 5, 1], sven: [0, 0, 6, 2, 4, 0, 0, 7, 0],
  };

  // ================================================================ the avatar builder
  // av = [head (0 a person, 1..16 a JackNet face), skin, hair style, hair colour, top, top colour, legs, legs colour, shoes]
  const AV = {
    SKIN: ['#f6d2b0', '#ecb890', '#d29a6a', '#a8704a', '#7a4a2a', '#5a3420', '#9fe08a'],
    HAIR: ['Short', 'Spiky', 'Curtains', 'Floppy', 'Long', 'Bunches', 'Shaved', 'Ponytail', 'Afro', 'Bob', 'Bowl cut', 'Gelled'],
    HAIRC: ['#2a1a10', '#5a3418', '#a8682a', '#e8c060', '#e8e0d0', '#c83a1a', '#1a1a1a', '#3266d6', '#d84aa0', '#3fa34a'],
    TOP: ['T-shirt', 'Stripy top', 'Hoodie', 'Shirt & tie', 'Puffa jacket', 'Space suit', 'Footy shirt', 'Denim jacket', 'Smiley tee', 'Jumper'],
    COL: ['#d8342c', '#3266d6', '#3fa34a', '#f2c22e', '#8a4ad0', '#ef6fb0', '#f08a24', '#3a3a44', '#eeeae0', '#22a7a0', '#8a5a32', '#b8c0cc', '#1a2a6a', '#6a1a2a'],
    LEGS: ['Jeans', 'Combats', 'Shorts', 'Skirt', 'Tracksuit bottoms', 'Flares'],
    SHOES: ['#1a1a1a', '#eeeae0', '#8a5a32', '#d8342c', '#3266d6', '#f2c22e'],
    MAX: [16, 6, 11, 9, 9, 13, 5, 13, 5],
  };
  const avOk = a => Array.isArray(a) && a.length === 9 && a.every((v, i) => Number.isInteger(v) && v >= 0 && v <= AV.MAX[i]);
  const h32 = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return h >>> 0; };
  const avOf = seed => AV.MAX.map((mx, i) => (i === 0 ? 0 : i === 1 ? h32(seed + '|1') % 6 : h32(seed + '|' + i) % (mx + 1)));

  // ================================================================ the Quiz Booth: [question, [A, B, C, D], correct index, from MMDD (0 = any day)]
  const QUIZ = [
    ['How many squares are on one face of a normal Rubrick\'s cube?', ['4', '6', '9', '12'], 2],
    ['Which country did Blockology come from?', ['Japan', 'The Soviet Union', 'America', 'Germany'], 1],
    ['What is the name of Marlo\'s brother?', ['Wario', 'Louie G', 'Toad', 'Yosher'], 1],
    ['How many planets are there in our solar system?', ['7', '8', '9', '10'], 2],
    ['Which is the biggest planet?', ['Saturn', 'Jupiter', 'Neptune', 'Earth'], 1],
    ['Who was the first person to walk on the Moon?', ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'John Glenn'], 2],
    ['In what year did people first walk on the Moon?', ['1959', '1969', '1979', '1989'], 1],
    ['How many bytes are in a kilobyte?', ['100', '1000', '1024', '2048'], 2],
    ['What does "CD" stand for?', ['Compact Disc', 'Computer Data', 'Copy Disk', 'Colour Display'], 0],
    ['How much does a normal 3.5 inch floppy disk hold?', ['144 KB', '1.44 MB', '14.4 MB', '650 MB'], 1],
    ['What is the name of the computer in 2001: A Space Odyssey?', ['HAL 9000', 'Holly', 'KITT', 'Deep Thought'], 0],
    ['What colour is Zapachu?', ['Red', 'Blue', 'Yellow', 'Green'], 2],
    ['Which of these is NOT a Pocket Critters you can start with in Pocket Critters Red?', ['Bulbabeast', 'Charbroiler', 'Squirturtle', 'Zapachu'], 3, 1005],
    ['What is the name of the ship\'s computer in Red Dork?', ['Holly', 'Kryten', 'Talkie Toaster', 'Rimmer'], 0],
    ['What is the Doctor\'s time machine called in Doctor Whoops?', ['The DeLorean', 'The TARDIS', 'The Falcon', 'The Enterprise'], 1],
    ['What colour is Zip the Badger?', ['Red', 'Green', 'Purple', 'Yellow'], 2],
    ['Which company makes the Game Lad?', ['Segue', 'Somy', 'Ultra Entertainment', 'Atari'], 2],
    ['What is the name of Luke Skywobbler\'s home planet?', ['Hoth', 'Tattyween', 'Endor', 'Naboo'], 1],
    ['Which red planet is named after the Roman god of war?', ['Mars', 'Venus', 'Mercury', 'Jupiter'], 0],
    ['BLOCKO comes from which country?', ['Sweden', 'Germany', 'Denmark', 'Norway'], 2],
    ['What does "www" stand for?', ['World Wide Web', 'Wide Web World', 'World Web Wire', 'Wired World Web'], 0],
    ['Which sea creature has three hearts?', ['Shark', 'Octopus', 'Jellyfish', 'Crab'], 1],
    ['How many sides does a hexagon have?', ['5', '6', '7', '8'], 1],
    ['What is frozen water called?', ['Steam', 'Ice', 'Fog', 'Slush'], 1],
    ['How many players are on the pitch for one football team?', ['9', '10', '11', '12'], 2],
    ['What is the capital of France?', ['Lyon', 'Paris', 'Nice', 'Marseille'], 1],
    ['Which gas do plants take in to make food?', ['Oxygen', 'Helium', 'Carbon dioxide', 'Nitrogen'], 2],
    ['What is the fastest land animal?', ['Lion', 'Cheetah', 'Horse', 'Greyhound'], 1],
    ['What does a 56K modem\'s "K" mean?', ['Kilobits per second', 'Kilometres', 'Kettles', 'Keyboards'], 0],
    ['How many minutes are in a day?', ['1,440', '1,200', '2,400', '960'], 0],
    ['The robot "Sir Killalot" is one of the House Robots on which telly show?', ['Robo Rumble', 'Gladiators', 'Blue Peter', 'Tomorrow\'s World'], 0],
    ['What is the chemical symbol for gold?', ['Go', 'Gd', 'Au', 'Ag'], 2],
    ['In Pac-Man, what do you eat to turn the ghosts blue?', ['A cherry', 'A power pill', 'A key', 'A ghost'], 1],
    ['What is the longest river in the world?', ['The Thames', 'The Amazon', 'The Nile', 'The Danube'], 2],
    ['How many legs does a spider have?', ['6', '8', '10', '12'], 1],
    ['Which planet has the most famous rings?', ['Mars', 'Saturn', 'Venus', 'Mercury'], 1],
    ['New money called the euro started on 1 January 1999. How many countries started using it?', ['3', '7', '11', '15'], 2, 101],
    ['Who won football\'s Champions League final in Barcelona in May 1999?', ['Bayern Munich', 'Manchester United', 'Juventus', 'Real Madrid'], 1, 527],
    ['Which country won the Cricket World Cup final at Lord\'s in June 1999?', ['England', 'Pakistan', 'Australia', 'South Africa'], 2, 621],
    ['Intergalactic Battles Episode I came out in British cinemas in July 1999. What is its subtitle?', ['The Phantom Nuisance', 'An Old Hope', 'The Clone Menace', 'Return of the Sulk'], 0, 716],
    ['On 11 August 1999 a total eclipse of the Sun could be seen from which part of England?', ['Yorkshire', 'Cornwall', 'Kent', 'Cumbria'], 1, 812],
    ['Which Segue console came out in Europe in October 1999?', ['Mega Glide', 'Saturn', 'Daydream', 'Game Gear'], 2, 1015],
    ['Pocket Critters Red and Blue came out in the UK in October 1999. What does the game call the device that records every Pocket Critters?', ['Pokedex', 'Pokeball', 'Pokepad', 'Pokebook'], 0, 1010],
    ['Which film released in June 1999 in the UK has a hero called Neo?', ['The Modemtrix', 'The Mummy', 'Galaxy Walk', 'Toy Storey'], 0, 612],
    ['Who won the men\'s singles at Wimbledon in July 1999?', ['Andre Agassi', 'Pete Sampras', 'Tim Henman', 'Pat Rafter'], 1, 705],
    ['The third Harry Potter book came out in July 1999. Who is the prisoner in its title?', ['Of Azkaban', 'Of Hogwarts', 'Of Gringotts', 'Of Diagon Alley'], 0, 709],
    ['In March 1999 a balloon flew non-stop all the way round the world for the first time. What was it called?', ['Breitling Orbiter 3', 'Virgin Global', 'Sky Ranger', 'Spirit of Kent'], 0, 322],
    ['Who won the Rugby World Cup final in Cardiff in November 1999?', ['England', 'France', 'New Zealand', 'Australia'], 3, 1107],
    ['What is the "Millennium Bug" also called?', ['Y2K', 'Z99', 'The Big Crash', 'Bug 2000'], 0],
    ['How many weeks are there in a year?', ['48', '50', '52', '54'], 2],
    ['What do you call a baby kangaroo?', ['A cub', 'A joey', 'A kid', 'A kit'], 1],
    ['What does a seismologist study?', ['Stars', 'Earthquakes', 'Volcanoes only', 'Weather'], 1],
    ['Which instrument has 88 keys?', ['Guitar', 'Violin', 'Piano', 'Trumpet'], 2],
    ['How many hours are in a week?', ['148', '168', '186', '200'], 1],
    ['What is the capital of Scotland?', ['Glasgow', 'Aberdeen', 'Edinburgh', 'Dundee'], 2],
    ['What is the capital of Wales?', ['Swansea', 'Cardiff', 'Newport', 'Bangor'], 1],
    ['How many sides does a 50p coin have?', ['5', '6', '7', '8'], 2],
    ['Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Mars', 'Pluto'], 1],
    ['How many continents are there?', ['5', '6', '7', '8'], 2],
    ['Which is the biggest ocean?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
    ['What do caterpillars turn into?', ['Beetles', 'Butterflies', 'Spiders', 'Slugs'], 1],
    ['How many strings does a normal guitar have?', ['4', '5', '6', '8'], 2],
    ['What is H2O better known as?', ['Salt', 'Water', 'Air', 'Sugar'], 1],
    ['How many days are there in a leap year?', ['364', '365', '366', '367'], 2],
    ['Which is the most expensive property on a UK Monopoly board?', ['Park Lane', 'Mayfair', 'Bond Street', 'Oxford Street'], 1],
    ['What is the tallest animal in the world?', ['Elephant', 'Giraffe', 'Ostrich', 'Camel'], 1],
    ['What does a thermometer measure?', ['Wind', 'Rain', 'Temperature', 'Time'], 2],
    ['Which language do most people in Brazil speak?', ['Spanish', 'Portuguese', 'French', 'Brazilian'], 1],
    ['In what year was the Great Fire of London?', ['1066', '1666', '1766', '1966'], 1],
    ['What is the hardest natural material?', ['Gold', 'Iron', 'Diamond', 'Granite'], 2],
    ['What is a group of crows called?', ['A murder', 'A gang', 'A flock of gloom', 'A band'], 0],
    ['Which of these is a prime number?', ['9', '15', '17', '21'], 2],
    ['What colour do you get if you mix blue and yellow?', ['Purple', 'Green', 'Orange', 'Brown'], 1],
    ['How many players are in a netball team on court?', ['5', '6', '7', '9'], 2],
  ];
  const quizNow = md => QUIZ.filter(q => !q[3] || q[3] <= md);

  // ================================================================ weeks of 1999 (Monday to Sunday). Week 1 = Mon 28 Dec 1998 - Sun 3 Jan 1999.
  const W0 = Date.UTC(1998, 11, 28);
  function week(day) { // day: 'yyyy-mm-dd' (UK). Uses the same day and month in 1999.
    let m = +day.slice(5, 7), d = +day.slice(8, 10); if (m === 2 && d === 29) d = 28;
    const t = Date.UTC(1999, m - 1, d), no = Math.floor((t - W0) / (7 * 864e5)) + 1, mon = W0 + (no - 1) * 7 * 864e5;
    return { no, mon, sun: mon + 6 * 864e5 };
  }
  const rareOfWeek = no => RARES[Math.max(1, Math.min(RARES.length, no)) - 1];
  const md = day => +day.slice(5, 7) * 100 + +day.slice(8, 10);
  const inSea = (f, mdv) => !f.sea || (f.sea[0] <= f.sea[1] ? mdv >= f.sea[0] && mdv <= f.sea[1] : mdv >= f.sea[0] || mdv <= f.sea[1]);

  // ================================================================ walking: an 8-way route on a grid (no cutting corners)
  // grid: rows of 0 (free) / 1 (blocked). Returns [[x,y], ...] from (sx,sy) to the nearest reachable tile to (tx,ty), or null.
  function path(grid, W, H, sx, sy, tx, ty, ok) {
    const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !grid[y * W + x];
    if (!free(tx, ty) && !(ok && ok(tx, ty))) { // aim for the closest free tile next to it
      let best = null, bd = 1e9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = tx + dx, y = ty + dy; if (free(x, y)) { const d = Math.abs(x - sx) + Math.abs(y - sy); if (d < bd) { bd = d; best = [x, y]; } } }
      if (!best) return null; tx = best[0]; ty = best[1];
    }
    if (sx === tx && sy === ty) return [[sx, sy]];
    const prev = new Int32Array(W * H).fill(-1), q = [sy * W + sx]; prev[sy * W + sx] = sy * W + sx;
    const D = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    const goal = ty * W + tx;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % W, cy = (c / W) | 0;
      if (c === goal) break;
      for (const [dx, dy] of D) {
        const x = cx + dx, y = cy + dy, n = y * W + x;
        if (!(free(x, y) || (n === goal && ok && ok(x, y))) || prev[n] !== -1) continue;
        if (dx && dy && (!free(cx + dx, cy) || !free(cx, cy + dy))) continue; // no squeezing between two corners
        prev[n] = c; q.push(n);
      }
    }
    if (prev[goal] === -1) return null;
    const out = []; for (let c = goal; ; c = prev[c]) { out.push([c % W, (c / W) | 0]); if (c === prev[c]) break; }
    return out.reverse().slice(0, 80);
  }

  // ================================================================ JackLoot: furni lives in the Treasure Chest
  function augment(L) {
    if (!L || !L.ITEM || L._jw) return;
    L._jw = 1;
    if (L.TYPES && !L.TYPES.furni) L.TYPES.furni = ['JackWorld Furni', '', 'Furniture for your room in JackWorld. Put it out with the JackWorld 99 program (www.jackworld.jnet).'];
    if (L.TYPE_ORDER && !L.TYPE_ORDER.includes('furni')) L.TYPE_ORDER.splice(Math.max(0, L.TYPE_ORDER.indexOf('trinket')), 0, 'furni');
    for (const f of F) {
      if (f.pub || L.ITEM[f.id]) continue;
      const it = Object.assign({ id: f.id, name: f.n, r: f.r, type: 'furni', art: ['jw'], d: f.ds, ex: 1, nocomb: 1 }, f.lim ? { lim: f.lim } : {});
      L.ITEMS.push(it); L.ITEM[f.id] = it;
    }
  }

  const C = { STEP, PAGES, FURNI, F, RARES, FLOORS, WALLS, MODELS, ROOM_CATS, PUB, PUB_ORDER, NPC_AV, AV, avOk, avOf, QUIZ, quizNow, week, rareOfWeek, md, inSea, path, augment, COLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.JWCat = C;
})(this);

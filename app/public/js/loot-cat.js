/* loot-cat: the JackLoot catalogue. Shared by the server mod (mods/loot.js requires it) and the browser (loot.js loads it
 * at start-up), so an item, a rarity or a set is only ever written down once.
 *
 * RARITY (fixed per item, like a trading card): 0 Common (grey) 1 Uncommon (green) 2 Rare (blue) 3 Epic (purple)
 * 4 Legendary (gold) 5 Jackpot (Mythic: animated rainbow). Each tier shines more (css/loot.css).
 * ITEMS: [id, name, rarity, type, art, flavour, extra]
 *   type: a wear slot (hat face badge pet cur wall col amp flower name btn card) or 'trinket' (just for collecting)
 *   art: drawing parameters for js/loot-art.js (the server ignores them)
 *   extra: { lim: copies that will ever exist (serial numbers "#3 of 50"), sea: [fromMMDD, toMMDD] (only drops in that
 *          part of the 1999 calendar), ex: 1 (exclusive: never drops at random, only from sets/achievements),
 *          shop: shopkeeper id (also sold, for a fixed price), price }
 * NO random boxes are ever sold for Rupees. Random drops only come from playing; Rupees buy specific items. */
(function (root) {
  'use strict';
  const RAR = [
    { k: 'c', n: 'Common', col: '#8a8a8a', pts: 1, rec: 3, w: 600, wp: 450 },
    { k: 'u', n: 'Uncommon', col: '#1e9e3a', pts: 3, rec: 8, w: 260, wp: 330 },
    { k: 'r', n: 'Rare', col: '#2463e0', pts: 10, rec: 20, w: 100, wp: 160 },
    { k: 'e', n: 'Epic', col: '#9333d6', pts: 30, rec: 60, w: 32, wp: 50 },
    { k: 'l', n: 'Legendary', col: '#f08c00', pts: 100, rec: 200, w: 7, wp: 9 },
    { k: 'm', n: 'Jackpot', col: '#e0007a', pts: 500, rec: 750, w: 1, wp: 1 },
  ]; // w: weight (per 1000) for a random drop from play, wp: for the Daily Parcel (a bit kinder)
  const TYPES = {
    hat: ['Hats', 'hat', 'Wear it in the Hangout, or put it on Gubbinz when he walks about your desktop.'],
    face: ['Face Stuff', 'face', 'Shades, specs and masks for your Hangout avatar.'],
    badge: ['Badges', 'badge', 'Shows next to your name: Rich List, Jacktown, the Hangout, your profile.'],
    pet: ['Desktop Pets', 'pet', 'A Lootling that runs about on your taskbar.'],
    cur: ['Mouse Pointers', 'cur', 'Your whole PC gets a new pointer.'],
    wall: ['Wallpapers', 'wall', 'Goes on your desktop.'],
    col: ['Window Themes', 'col', 'New colours for every title bar on your PC.'],
    amp: ['JackAmp Skins', 'amp', 'Re-skins JackAmp (Start > Programs > Accessories > Entertainment).'],
    flower: ['Uh-Oh! Flowers', 'flower', 'Recolours the Uh-Oh! flower on your desktop.'],
    name: ['Chat Name Colours', 'name', 'Your name shines in #jackattack and the Chat Room.'],
    btn: ['88x31 Buttons', 'btn', 'A little button for the bottom of your Homepagez page and your profile.'],
    card: ['JackCards', 'card', 'Trading cards of 1999. Pick a favourite to show on your profile.'],
    trinket: ['Trinkets', '', 'Shiny things that do nothing at all except be yours.'],
  };
  const TYPE_ORDER = ['hat', 'face', 'badge', 'pet', 'cur', 'wall', 'col', 'amp', 'flower', 'name', 'btn', 'card', 'trinket'];
  // shopkeepers on www.lootlings.jnet (each sells a few specific Common-Rare things a day, never a random box)
  const SHOPS = {
    pibble: { n: "Pibble's Paint Pots", who: 'Pibble', types: ['col', 'name', 'flower', 'wall'], hello: "Ooh, hello! Everything's freshly painted. Mind the wet bits!" },
    grumplet: { n: "Grumplet's Junk Shed", who: 'Grumplet', types: ['hat', 'face', 'cur', 'trinket'], hello: "What? Oh. A customer. Don't touch anything unless you're buying it. And don't blow on the game cartridges, it doesn't help." },
    fizzwick: { n: "Fizzwick's Gadget Hut", who: 'Fizzwick', types: ['amp', 'btn', 'badge', 'pet'], hello: 'BZZT! Welcome welcome WELCOME! All gadgets tested at least once! (On a 486. With the turbo button ON.)' },
    snorb: { n: "Old Snorb's Card Shack", who: 'Old Snorb', types: ['card'], hello: 'Single cards only, young one. No packets. Packets are for crisps. And no swapping shinies in my queue.' },
  };
  const PRICE = [40, 120, 350]; // Common, Uncommon, Rare in the shops (Epic and up are never sold)

  // season windows in the 1999 calendar (MMDD, inclusive)
  const SEA = {
    phantom: [716, 731], eclipse: [804, 818], conker: [915, 1031], pokemon: [1005, 1019], dreamcast: [1014, 1028],
    halloween: [1024, 1102], bonfire: [1101, 1107], opening: [1115, 1130], xmas: [1201, 1231], nye: [1227, 1231],
    valentine: [207, 216], pancake: [214, 218], easter: [329, 411], spring: [301, 531], summer: [601, 831],
  };
  const I = [];
  const add = (type, rows) => rows.forEach(([id, name, r, art, d, x]) => I.push([type + '.' + id, name, r, type, art, d, x]));

  add('hat', [
    ['chef', "Chef's Hat", 0, 'chef', 'Tall, white and floppy. Makes you want to cook beans on toast.', { shop: 'grumplet' }],
    ['fez', 'Little Red Fez', 0, 'fez', 'Fezzes are cool. Somebody on telly said so.', { shop: 'grumplet' }],
    ['mortar', 'Mortarboard', 0, 'mortar', 'For passing your Cycling Proficiency with honours.', { shop: 'grumplet' }],
    ['viking', 'Viking Helmet', 1, 'viking', 'Two horns. One dent. Smells faintly of fish.', { shop: 'grumplet' }],
    ['propeller', 'Propeller Beanie', 1, 'propeller', 'The propeller spins when you run. You will run everywhere.', { shop: 'grumplet' }],
    ['cowboy', 'Cowboy Hat', 1, 'cowboy', 'Yee-haw. (Please do not say yee-haw in the library.)'],
    ['jester', "Jester's Cap", 1, 'jester', 'Three floppy points and three bells. Jingles when you nod.'],
    ['pirate', 'Pirate Tricorn', 2, 'pirate', 'Arrr. Comes with a skull and absolutely no parrot.', { shop: 'grumplet' }],
    ['bubble', 'Space Helmet', 3, 'bubble', 'A glass bubble helmet. Fogs up when you laugh.'],
    ['halo', 'Golden Halo', 3, 'halo', 'Floats just above your head. Nobody knows how. Not even Jack.'],
    ['grandwiz', "Grand Wizard's Hat", 4, 'grandwiz', 'Covered in real moving stars. Probably magic. Definitely shiny.', { lim: 50 }],
    ['jackpot', 'The Jackpot Crown', 5, 'jackpotcrown', 'Six gems, one for every colour of the rainbow, and a seventh nobody can name.', { lim: 10 }],
    ['witch', "Witch's Hat", 2, 'witch', 'Pointy, purple and slightly cursed. Found under a pumpkin on Halloween week.', { sea: SEA.halloween, lim: 200 }],
    ['pumpkin', 'Pumpkin Head', 3, 'pumpkin', 'A whole carved pumpkin. You can see out of the eyes. Mostly.', { sea: SEA.halloween, lim: 100 }],
    ['bonfire', 'Bonfire Night Bobble', 1, 'bonfire', 'Knitted for standing near a bonfire in a field going "ooh" and "aah".', { sea: SEA.bonfire }],
    ['santa', 'Santa Hat', 2, 'santa', 'Red, fluffy and full of festive spirit. Only turns up in December.', { sea: SEA.xmas, lim: 300 }],
    ['antlers', 'Reindeer Antlers', 1, 'antlers', 'Comes with a free red nose. (The nose is not included.)', { sea: SEA.xmas }],
    ['partymill', 'Millennium Party Hat', 3, 'partymill', 'Gold, sparkly and marked 2000. For the biggest party of the century.', { sea: SEA.nye, lim: 100 }],
  ]);
  add('face', [
    ['nerd', 'Nerd Specs', 0, 'nerd', 'Thick black frames and a plaster in the middle. Very clever.', { shop: 'grumplet' }],
    ['star', 'Star Shades', 1, 'star', 'Star-shaped sunglasses. Pop star not included.', { shop: 'grumplet' }],
    ['visor', 'Laser Visor', 3, 'visor', 'A glowing red visor, like a robot off a sci-fi film. Beeps when you look at a computer.'],
    ['goldmono', 'Gold Monocle (with chain)', 4, 'goldmono', 'For looking at your Rich List position very, very closely.', { lim: 50 }],
    ['eclipse', 'Eclipse Viewers', 2, 'eclipse', 'Cardboard eclipse glasses from August 1999. NEVER look straight at the Sun.', { sea: SEA.eclipse, lim: 300 }],
    ['mask', 'Masquerade Mask', 2, 'mask', 'Purple feathers and sequins. Spooky but posh.', { sea: SEA.halloween }],
    ['beard', 'Father Christmas Beard', 1, 'beard', 'White, fluffy and very itchy. Ho ho ho.', { sea: SEA.xmas }],
  ]);
  add('badge', [
    ['star', 'Gold Star Badge', 0, ['#ffd400', '#8a6000', 'star'], 'Like the ones on the chart at school, but for the Internet.', { shop: 'fizzwick' }],
    ['heart', 'Heart Badge', 0, ['#ff4a8a', '#8a0030', 'heart'], 'A shiny pink heart. Aww.', { shop: 'fizzwick' }],
    ['smile', 'Smiley Badge', 1, ['#ffe600', '#000', 'smile'], 'A big yellow smiley face. Have a nice day!', { shop: 'fizzwick' }],
    ['bolt', 'Lightning Badge', 1, ['#2a2a8a', '#ffd400', 'bolt'], 'Zap! For people who are fast at things.', { shop: 'fizzwick' }],
    ['modem', '56K Badge', 2, ['#004a8a', '#9fe0ff', '56K'], 'For surviving the dial-up noise every single day.', { shop: 'fizzwick' }],
    ['eclipse', 'Eclipse 99 Badge', 2, ['#000', '#ff9a00', 'eclipse'], 'Total eclipse of the Sun, 11 August 1999. Cornwall saw it!', { sea: SEA.eclipse }],
    ['pumpkin', 'Pumpkin Badge', 1, ['#ff7a00', '#3a1a00', 'pumpkin'], 'Spooky! Only drops around Halloween.', { sea: SEA.halloween }],
    ['firework', 'Firework Badge', 1, ['#1a0a4a', '#ff3ad0', 'firework'], 'Remember, remember the fifth of November!', { sea: SEA.bonfire }],
    ['snow', 'Snowflake Badge', 1, ['#9fd8ff', '#fff', 'snow'], 'No two are the same. (These two are the same.)', { sea: SEA.xmas }],
    ['y2k', 'Y2K Survivor Badge', 3, ['#c00', '#fff', 'Y2K'], 'For being ready for the Millennium Bug. Are you? ARE YOU?', { sea: SEA.nye, lim: 200 }],
    ['beta', 'Lootlings Beta Tester', 2, ['#008080', '#fff', 'BETA'], 'You were on Lootlings before the Grand Opening on 15 November 1999.', { ex: 1 }],
    ['opening', 'Grand Opening Badge', 3, ['#e10600', '#ffd400', 'open'], 'You were there for the Lootlings Grand Opening week.', { ex: 1 }],
    ['collector', "Collector's Rosette", 3, ['#9333d6', '#fff', 'rosette'], 'For completing a Lootlings collection set.', { ex: 1 }],
    ['trader', 'Trading Post Badge', 2, ['#6a3a1a', '#ffd400', 'swap'], 'For your first fair swap at the Trading Post.', { ex: 1 }],
    ['lootlord', 'Loot Lord', 4, ['#f08c00', '#fff', 'crown'], 'For owning 100 different things from the catalogue. Wow.', { ex: 1 }],
    ['rainbow', 'Rainbow Collector', 3, ['#fff', '#e10600', 'rainbow'], 'You own something of every rarity, from Common to Jackpot.', { ex: 1 }],
    ['jackpot', 'Jackpot Badge', 5, ['#000', '#fff', 'jackpot'], 'The rarest badge on JackNet. It shimmers in every colour.', { lim: 10 }],
  ]);
  // Lootlings: the little critters who dig up loot. [body, belly, ears, eyes, extra]
  add('pet', [
    ['snorb', 'Snorb', 0, ['#3a8aff', '#bfe0ff', 'round', '#000', ''], 'A round blue blob who sniffs out treasure. Snorbs are always hungry.', { shop: 'fizzwick' }],
    ['crumbit', 'Crumbit', 0, ['#c8883a', '#f4d8a0', 'nub', '#000', 'crumbs'], 'Made of biscuit, mostly. Do not dunk.', { shop: 'fizzwick' }],
    ['pibble', 'Pibble', 1, ['#ff7ac0', '#ffd0ea', 'long', '#000', ''], 'A pink, floppy-eared painter. Leaves little pawprints of paint.', { shop: 'fizzwick' }],
    ['grumplet', 'Grumplet', 1, ['#4aa82a', '#a8e080', 'pointy', '#e10600', 'frown'], 'Green, grumpy and secretly lovely. Says "hmph" a lot.', { shop: 'fizzwick' }],
    ['fizzwick', 'Fizzwick', 2, ['#ffd400', '#fff6a0', 'antenna', '#000', 'spark'], 'A yellow crackly inventor. Accidentally invents things.'],
    ['moggle', 'Moggle', 2, ['#8a4ad8', '#d8b8ff', 'cat', '#ffe600', ''], 'Half cat, half cloud, all purple. Purrs in 56K.'],
    ['ghost', 'Ghost Snorb', 3, ['#e8f0ff', '#ffffff', 'round', '#3a3a8a', 'ghost'], 'Wooooo. (He is not scary. He is just a bit see-through.)', { sea: SEA.halloween, lim: 150 }],
    ['snowpib', 'Snow Pibble', 3, ['#ffffff', '#d8f0ff', 'long', '#000', 'scarf'], 'Wears a red scarf. Builds tiny snow-Pibbles.', { sea: SEA.xmas, lim: 150 }],
    ['robo', 'Robo-Snorb 2000', 3, ['#9aa0a8', '#d8dde4', 'antenna', '#e10600', 'bolts'], 'Y2K COMPLIANT. Probably. Beeps at midnight just in case.'],
    ['gold', 'Golden Snorb', 4, ['#ffcc00', '#fff2a0', 'round', '#000', 'shine'], 'Solid gold and very proud of it. Jingles when it walks.', { lim: 50 }],
    ['rainbow', 'Rainbow Moggle', 5, ['#ff3a6a', '#ffffff', 'cat', '#000', 'rainbow'], 'Every colour at once. Leaves a little rainbow wherever it goes.', { lim: 10 }],
  ]);
  // mouse pointers: [shape, fill, stroke]
  add('cur', [
    ['red', 'Red Arrow', 0, ['arrow', '#e10600', '#000'], 'A normal pointer, but red. Red ones go faster.', { shop: 'grumplet' }],
    ['green', 'Lime Arrow', 0, ['arrow', '#5ae02a', '#000'], 'Bright green. Like a highlighter pen.', { shop: 'grumplet' }],
    ['wand', 'Star Wand', 1, ['wand', '#ffd400', '#6a4a00'], 'Every click is a little bit magic.', { shop: 'grumplet' }],
    ['sword', 'Laser Sword', 2, ['sword', '#3aff6a', '#003a10'], 'Like the ones in Episode I, but for clicking. Hums when you wave it about. (It does not hum.)'],
    ['candy', 'Candy Cane', 1, ['candy', '#fff', '#e10600'], 'Minty! Only turns up in December.', { sea: SEA.xmas }],
    ['ghost', 'Ghost Pointer', 2, ['ghost', '#fff', '#3a3a8a'], 'Boo! A spooky little pointer for Halloween.', { sea: SEA.halloween }],
    ['rocket', 'Rocket Pointer', 3, ['rocket', '#e0e0e0', '#c00'], '3... 2... 1... CLICK!'],
    ['goldtoof', 'Diamond Pointer', 4, ['toof', '#bff4ff', '#2a6a8a'], 'A pointer cut from one enormous diamond. Clicks are worth more now. (They are not.)', { lim: 50 }],
    ['rainbow', 'Rainbow Pointer', 5, ['arrow', 'rainbow', '#000'], 'Leaves a sparkly trail of every colour. Maximum 1999.', { lim: 10 }],
  ]);
  // wallpapers: [pattern, background, colour 1, colour 2]
  add('wall', [
    ['dots', 'Polka Dots', 0, ['dots', '#ffe8f4', '#ff7ac0', '#ffb8e0'], 'Pink dots. Mom approves.', { shop: 'pibble' }],
    ['checks', 'Chessboard', 0, ['checks', '#202020', '#3a3a3a', ''], 'Black and grey squares. Very serious. Very chess.', { shop: 'pibble' }],
    ['stripes', 'Deckchair Stripes', 0, ['stripes', '#fff', '#2a8aff', ''], 'Like a deckchair in Weston-super-Mare. Probably.', { shop: 'pibble' }],
    ['bubbles', 'Bubble Bath', 1, ['bubbles', '#2a6ad8', '#9fd8ff', '#ffffff'], 'Blue bubbles. Smells of Mom\'s bath stuff (it does not smell).', { shop: 'pibble' }],
    ['zigzag', 'Zig Zag', 1, ['zigzag', '#1a1a3a', '#ffd400', '#ff3a6a'], 'A loud zig-zag pattern for a loud computer.', { shop: 'pibble' }],
    ['stars', 'Starry Night', 1, ['stars', '#000820', '#ffffff', '#9fd8ff'], 'Hundreds of tiny stars. Count them. Go on.'],
    ['lootlings', 'Lootlings Party', 2, ['lootlings', '#fff6d8', '', ''], 'Snorbs, Pibbles and Grumplets having a lovely time.', { shop: 'pibble' }],
    ['matrixy', 'Green Code Rain', 2, ['code', '#000', '#00e03a', '#003a10'], 'Falling green numbers. Makes your computer look like it knows kung fu.'],
    ['circuit', 'Circuit Board', 3, ['circuit', '#0a3a1a', '#3ad06a', '#ffd400'], 'The inside of a 486, blown up big. Smells of hot dust.'],
    ['goldvault', 'The Gold Vault', 4, ['vault', '#5a3a00', '#ffd400', '#fff6a0'], 'Gold bars stacked to the ceiling. You could swim in it. Do not swim in it.', { lim: 50 }],
    ['holo', 'Holographic Foil', 5, ['holo', '#ffffff', '', ''], 'Shimmers every colour, like the best page in a sticker album.', { lim: 10 }],
    ['bats', 'Bats and Moons', 2, ['bats', '#1a0a2a', '#ffd84a', '#000'], 'Flappy bats under a yellow moon. Halloween only!', { sea: SEA.halloween }],
    ['fireworks', 'Fireworks Night', 2, ['fireworks', '#0a0a2a', '#ff3ad0', '#ffd400'], 'Bang! Whizz! Ooh! Aah! For Bonfire Night.', { sea: SEA.bonfire }],
    ['snow', 'Let It Snow', 1, ['snow', '#2a4a8a', '#ffffff', '#bfe0ff'], 'Fat snowflakes falling forever. It never snows like this in real life.', { sea: SEA.xmas }],
    ['eclipse', 'Total Eclipse', 3, ['eclipse', '#000010', '#ffffff', '#ff9a00'], 'The Moon in front of the Sun, 11 August 1999, with the corona all round.', { sea: SEA.eclipse, lim: 200 }],
    ['conkers', 'Acorn Quest Season', 1, ['conkers', '#f4e8c8', '#8a4a1a', '#3a8a2a'], 'Shiny conkers on strings. Mine is a sixer.', { sea: SEA.conker }],
  ]);
  // window themes: [title 1, title 2, window face]
  add('col', [
    ['ocean', 'Ocean Blue', 0, ['#004a8a', '#3ab0e0', '#c8dce8'], 'Calm blue title bars, like the sea at Weston. (It is brown at Weston.)', { shop: 'pibble' }],
    ['forest', 'Forest Green', 0, ['#1a5a1a', '#5aa83a', '#c8d8c0'], 'Very green. Very outdoorsy. Without the going outdoors.', { shop: 'pibble' }],
    ['slate', 'Rainy Slate', 0, ['#3a3a4a', '#8a8a9a', '#c8c8cc'], 'Grey on grey. Perfect for a rainy Tuesday.', { shop: 'pibble' }],
    ['grape', 'Grape Juice', 1, ['#4a0a6a', '#b04ad8', '#dccce4'], 'Purple. Very purple. Purple as a grape.', { shop: 'pibble' }],
    ['bubblegum', 'Bubblegum', 1, ['#c0006a', '#ff8ac8', '#f0d4e2'], 'Pink and sticky-looking.', { shop: 'pibble' }],
    ['sunset', 'Sunset Strip', 2, ['#a02a00', '#ffb000', '#ecd8c0'], 'Orange to yellow, like the sky over the bypass.', { shop: 'pibble' }],
    ['lava', 'Lava Lamp', 2, ['#6a0000', '#ff3a00', '#e8ccc0'], 'Red and gloopy. Do not touch the jackos, they are HOT.'],
    ['midnight', 'Midnight Neon', 3, ['#000000', '#00e0ff', '#b8c4cc'], 'Black title bars with a neon glow. Very late-night hacker.'],
    ['goldleaf', 'Gold Leaf', 4, ['#6a4a00', '#ffd400', '#efe4c0'], 'Real gold leaf (it is yellow). Every window looks expensive.', { lim: 50 }],
    ['rainbow', 'Rainbow Riot', 5, ['#e10600', '#0028c8', '#e8e0f0'], 'The title bars cycle through every colour there is. Not for the faint-hearted.', { lim: 10, anim: 1 }],
    ['pumpkin', 'Pumpkin Patch', 2, ['#3a1a00', '#ff7a00', '#ecd8c0'], 'Halloween orange and black.', { sea: SEA.halloween }],
    ['holly', 'Holly and Ivy', 2, ['#8a0000', '#1a7a1a', '#e8e0d0'], 'Christmas red and green. Very festive.', { sea: SEA.xmas }],
    ['corona', 'Corona', 3, ['#000000', '#ffb000', '#d8d0c4'], 'Black like the Moon, with a fiery edge like the Sun. August 1999.', { sea: SEA.eclipse, lim: 200 }],
  ]);
  // JackAmp skins: [body, display, display text, button]
  add('amp', [
    ['ocean', 'Deep Blue Amp', 0, ['#1a3a6a', '#000a1a', '#3ad0ff', '#4a6a9a'], 'JackAmp, but blue. Music sounds wetter.', { shop: 'fizzwick' }],
    ['lime', 'Lime Fizz Amp', 1, ['#4a8a1a', '#0a1a00', '#c0ff3a', '#6aaa3a'], 'Sharp green. Makes every song sound like a fizzy drink.', { shop: 'fizzwick' }],
    ['lava', 'Lava Amp', 1, ['#6a1a00', '#1a0000', '#ff8a3a', '#9a3a1a'], 'Hot red. Turn it up to 11.', { shop: 'fizzwick' }],
    ['wood', "Dad's Hi-Fi Woodgrain", 2, ['#6a4020', '#1a1000', '#ffb04a', '#8a6040'], 'Real (fake) wood panelling, like the stereo in the front room.', { shop: 'fizzwick' }],
    ['chrome', 'Chrome Deluxe', 3, ['#a8b0b8', '#101820', '#e0f4ff', '#d0d8e0'], 'Shiny silver. Very 2000. Well, very nearly.'],
    ['eclipse', 'Eclipse Amp', 2, ['#101010', '#000', '#ffb000', '#3a3a3a'], 'Dark as the eclipse, with a golden glow.', { sea: SEA.eclipse }],
    ['gold', 'Golden Amp', 4, ['#a07000', '#1a1000', '#fff0a0', '#ffd400'], 'Every song sounds like it went platinum.', { lim: 50 }],
    ['holo', 'Hologram Amp', 5, ['#c8b0ff', '#000', '#fff', '#9fe0ff'], 'Shimmers like a hologram sticker. The equaliser dances in rainbows.', { lim: 10, anim: 1 }],
  ]);
  // Uh-Oh! flower colours: [hue rotate (degrees), saturate]
  add('flower', [
    ['blue', 'Bluebell Flower', 0, [110, 1], 'Your Uh-Oh! flower goes blue.', { shop: 'pibble' }],
    ['pink', 'Rose Flower', 0, [-110, 1.2], 'A pink Uh-Oh! flower. Smells lovely (it does not smell).', { shop: 'pibble' }],
    ['purple', 'Violet Flower', 1, [160, 1.2], 'Purple petals on your Uh-Oh! flower.', { shop: 'pibble' }],
    ['ice', 'Ice Flower', 2, [80, 0.4], 'Pale and frosty, like the windscreen in the morning.'],
    ['gold', 'Gold Flower', 3, [-60, 1.8], 'A golden Uh-Oh! flower. Uh-oh... it is gorgeous.'],
    ['rainbow', 'Rainbow Flower', 5, [0, 1.5], 'Cycles through every colour. Uh-Oh! has never looked so happy.', { lim: 10, anim: 1 }],
  ]);
  // chat name colours: [colour or gradient stops]
  add('name', [
    ['tomato', 'Tomato Red Name', 0, ['#e10600'], 'Your name in #jackattack goes bright red.', { shop: 'pibble' }],
    ['ocean', 'Ocean Blue Name', 0, ['#0060d0'], 'Your name goes a lovely sea blue.', { shop: 'pibble' }],
    ['grass', 'Grass Green Name', 0, ['#109010'], 'Your name goes green. Like grass. Or a Grumplet.', { shop: 'pibble' }],
    ['purple', 'Purple Name', 1, ['#8a1ad8'], 'Your name goes purple. Very royal.', { shop: 'pibble' }],
    ['sunset', 'Sunset Name', 2, ['#ff3a00', '#ffb000'], 'Your name fades from red to gold.', { shop: 'pibble' }],
    ['ice', 'Ice Name', 2, ['#0080c0', '#80e0ff'], 'Your name fades from blue to frosty.'],
    ['neon', 'Neon Glow Name', 3, ['#00d0ff', '#ff00d0'], 'Your name glows like a sign outside the arcade.'],
    ['gold', 'Gold Glow Name', 4, ['#a06000', '#ffd400'], 'Your name shines gold. Everybody will know.', { lim: 50 }],
    ['rainbow', 'Rainbow Name', 5, ['#e10600', '#ff8a00', '#ffd400', '#2a9a2a', '#0060d0', '#8a1ad8'], 'Your name in every colour, moving. The rarest name on JackNet.', { lim: 10, anim: 1 }],
    ['pumpkin', 'Pumpkin Name', 2, ['#ff7a00', '#3a1a00'], 'Orange and black for Halloween.', { sea: SEA.halloween }],
    ['tinsel', 'Tinsel Name', 2, ['#c00000', '#109010'], 'Red and green for Christmas.', { sea: SEA.xmas }],
  ]);
  // 88x31 buttons: [line 1, line 2, background, text colour, style]
  add('btn', [
    ['love99', 'I LOVE 1999', 0, ['I LOVE', '1999', '#ffffff', '#e10600', 'plain'], 'The classic. For people who love 1999 (everybody).', { shop: 'fizzwick' }],
    ['56k', '56K POWER', 0, ['56K', 'POWER!', '#000080', '#ffff00', 'plain'], 'Dial-up and proud.', { shop: 'fizzwick' }],
    ['800', 'BEST VIEWED 800x600', 0, ['BEST VIEWED', '800x600', '#c0c0c0', '#000', 'bevel'], 'Tells everyone exactly how to look at your page.', { shop: 'fizzwick' }],
    ['y2k', 'Y2K READY', 1, ['Y2K', 'READY!', '#000', '#00ff00', 'lcd'], 'Your homepage will definitely survive the Millennium Bug. Definitely.', { shop: 'fizzwick' }],
    ['486', 'MADE ON A 486', 1, ['MADE ON', 'A 486', '#2a2a2a', '#ff8a00', 'plain'], 'Hand-crafted on a 486 DX2/66. Took ages.', { shop: 'fizzwick' }],
    ['gubz', 'GUBBINZ APPROVED', 1, ['GUBBINZ', 'APPROVED', '#3a9a2a', '#fff', 'stamp'], 'Gubbinz has looked at this page and did not eat it.'],
    ['teef', 'RUPEES ACCEPTED', 2, ['RUPEES', 'ACCEPTED', '#ffd400', '#5a3a00', 'shine'], 'Like the card stickers on a shop door, but for JackNet money.'],
    ['loot', 'LOOTLINGS!', 2, ['LOOTLINGS', 'COLLECT!', '#ff7ac0', '#fff', 'shine'], 'An official Lootlings button. Pibble drew it.', { shop: 'fizzwick' }],
    ['cardshark', 'CARD SHARK', 3, ['CARD', 'SHARK', '#004a4a', '#5affd0', 'shine'], 'For completing JackCards Series One. Respect.', { ex: 1 }],
    ['webring', 'WEB RING KING', 3, ['WEB RING', 'KING', '#4a0a6a', '#ffd400', 'shine'], 'Rules the web ring with an iron mouse.'],
    ['gold', 'GOLD MEMBER 88x31', 4, ['GOLD', 'MEMBER', '#7a5000', '#ffe680', 'shine'], 'A solid gold button. Your homepage just got posh.', { lim: 50 }],
    ['jackpot', 'JACKPOT!', 5, ['JACK', 'POT!!!', '#000', '#fff', 'rainbow'], 'Flashes every colour. The most 1999 thing ever made.', { lim: 10, anim: 1 }],
    ['eclipse', 'I SAW THE ECLIPSE', 2, ['I SAW THE', 'ECLIPSE', '#000', '#ffb000', 'plain'], 'Proof you looked (through the proper glasses!) on 11 August 1999.', { sea: SEA.eclipse }],
    ['spooky', 'SPOOKY PAGE', 1, ['SPOOKY', 'PAGE!', '#1a0a2a', '#ff7a00', 'plain'], 'Warning: this homepage may contain bats.', { sea: SEA.halloween }],
  ]);
  // JackCards Series One: [card number, picture, colour]
  add('card', [
    ['floppy', 'Floppy Disk', 0, [1, 'floppy', '#2a2a8a'], '1.44 MB of pure storage. Holds about four of your best drawings.', { shop: 'snorb' }],
    ['modem', 'Dial-Up Modem', 0, [2, 'modem', '#6a6a6a'], 'BEEE-DOO-DEE-KSSSHHH. The sound of the future.', { shop: 'snorb' }],
    ['cdrom', 'Free CD-ROM', 0, [3, 'cd', '#9a9ab8'], 'Came free on a comic. Used as a coaster. Still works.', { shop: 'snorb' }],
    ['cube', "Rubrick's Cube", 0, [4, 'cube', '#e10600'], 'Six colours, 43 quintillion ways to get it wrong.', { shop: 'snorb' }],
    ['tetris', 'Falling Blocks', 0, [5, 'blocks', '#2a9a2a'], 'The long thin one never comes when you need it.', { shop: 'snorb' }],
    ['yoyo', 'Yo-Yo', 0, [6, 'yoyo', '#ff3a6a'], 'Walk the dog! Round the world! Hit Dave on the head!', { shop: 'snorb' }],
    ['pager', 'Pager', 1, [7, 'pager', '#3a6a3a'], 'Beep beep. "CALL HOME" - Mom.', { shop: 'snorb' }],
    ['mobile', 'Mobile Phone', 1, [8, 'mobile', '#1a3a6a'], 'Has a game with a snake in it. Battery lasts a week.', { shop: 'snorb' }],
    ['vhs', 'VHS Tape', 1, [9, 'vhs', '#1a1a1a'], 'Be kind, rewind.', { shop: 'snorb' }],
    ['walkman', 'Personal Stereo', 1, [10, 'walkman', '#c0c0c0'], 'Takes two AA batteries and eats them in an afternoon.', { shop: 'snorb' }],
    ['vpet', 'Virtual Pet Keyring', 1, [11, 'vpet', '#ff8ac8'], 'It is hungry. It is always hungry. It needs a clean. Again.', { shop: 'snorb' }],
    ['486', '486 PC', 1, [12, 'pc', '#c8c0a8'], 'Turbo button! It makes it go faster (it does nothing).', { shop: 'snorb' }],
    ['euro', 'The Euro', 2, [13, 'euro', '#003399'], 'Launched 1 January 1999 for banks. Coins and notes come later.', { shop: 'snorb' }],
    ['y2k', 'The Millennium Bug', 2, [14, 'bug', '#e10600'], 'Will the computers think it is 1900? Jack has stocked up on beans.', { shop: 'snorb' }],
    ['gubbinz', 'Gubbinz the Grot', 2, [15, 'grot', '#3a9a2a'], 'The most famous grot on the Internet. Probably eating something.'],
    ['squig', 'Battle Robot', 2, [16, 'squig', '#e10600'], 'Flippers, axes and a pit, on the telly. Dave built one from a remote-control car and a fork. It lost to a door.'],
    ['dave', 'Dave', 2, [17, 'dave', '#ff8a00'], "Jack's best mate. Has a cousin who knows a cheat for everything."],
    ['mom', "Mom's Knitting Club", 3, [18, 'knit', '#c04a8a'], 'They meet on Thursdays. They know everything that happens in town.'],
    ['dome', 'The Millennium Dome', 3, [19, 'dome', '#d0d0d0'], 'A giant tent in London for the year 2000. Opens on New Year\'s Eve.'],
    ['seti', 'Screensaver Searching Space', 3, [20, 'dish', '#1a1a5a'], 'Since May 1999 your PC can help listen for aliens while you are at school.'],
    ['jackpc', "Jack's PC", 4, [21, 'jackpc', '#000080'], 'The very computer you are using right now. Spooky.', { lim: 100 }],
    ['jackpot', 'The Jackpot Card', 5, [22, 'jackpot', '#000'], 'A holographic card so rare that only ten were ever printed.', { lim: 10 }],
    ['phantom', 'Episode I Queue', 2, [23, 'queue', '#1a1a3a'], 'Out in the UK on 16 July 1999. Dave queued for six hours.', { sea: SEA.phantom, lim: 300 }],
    ['eclipse', 'Total Eclipse 1999', 3, [24, 'eclipsecard', '#000'], '11 August 1999. Day turned to night in Cornwall for two minutes.', { sea: SEA.eclipse, lim: 200 }],
    ['pocket', 'Pocket Critters Fever', 2, [25, 'pokeball', '#e10600'], 'Pocket Critters Red and Blue came out here on 5 October 1999. Link cables at lunch, swaps at break!', { sea: SEA.pokemon, lim: 300 }],
    ['dreamcast', 'Console With a Modem', 2, [26, 'console', '#ff8a00'], '14 October 1999: a games console with a MODEM built in.', { sea: SEA.dreamcast, lim: 300 }],
    ['bonfire', 'Bonfire Night', 1, [27, 'bonfire', '#ff3a00'], 'Remember, remember the fifth of November. Hold your sparkler at arm\'s length.', { sea: SEA.bonfire }],
    ['pumpkin', 'Jack-o\'-Lantern', 1, [28, 'pumpkin', '#ff7a00'], 'A carved pumpkin with a candle in. Smells of burnt pumpkin.', { sea: SEA.halloween }],
    ['xmas', 'Christmas Telly', 2, [29, 'tree', '#1a7a1a'], 'The Radio Times double issue. Circle EVERYTHING.', { sea: SEA.xmas }],
    ['nye', 'Millennium Eve', 4, [30, 'firework', '#000'], '31 December 1999. The biggest New Year\'s Eve of all time.', { sea: SEA.nye, lim: 100 }],
  ]);
  add('trinket', [
    ['marble', 'Shooter Marble', 0, ['marble', '#3a8aff'], 'The big one. You do not play with this one. Too precious.', { shop: 'grumplet' }],
    ['tazo', 'Shiny Tazo', 0, ['tazo', '#c0c0c0'], 'Came in a crisp packet. Worth more than the crisps.', { shop: 'grumplet' }],
    ['toof', 'Lucky Dice', 0, ['toof', '#fffbe8'], 'From the bottom of a proper dice bag. Blow on it for luck. (It has never once rolled a six.)', { shop: 'grumplet' }],
    ['glowyoyo', 'Glow-in-the-Dark Yo-Yo', 1, ['yoyo', '#a0ff6a'], 'Glows green under the duvet. Perfect for midnight yo-yoing.', { shop: 'grumplet' }],
    ['bitsbox', 'Bits Box Treasure', 1, ['gear', '#9a9a9a'], 'A mystery bit from the model-painting bits box. Nobody knows what it is from. Smells of glue.'],
    ['snowglobe', 'Jacktown Snow Globe', 2, ['globe', '#9fd8ff'], 'Shake it and it snows on a tiny Jacktown.', { sea: SEA.xmas }],
    ['conker', 'Champion Acorn Quest', 1, ['conker', '#8a4a1a'], 'A 12-er! Baked in the oven for extra hardness (cheating).', { sea: SEA.conker }],
    ['sparkler', 'Sparkler (unlit)', 1, ['sparkler', '#ffd400'], 'For writing your name in the air on Bonfire Night.', { sea: SEA.bonfire }],
    ['goldfloppy', 'Golden Floppy Disk', 2, ['floppy', '#ffd400'], 'Holds 1.44 MB of pure gold.'],
    ['shard', 'Eclipse Sun-Shard', 3, ['shard', '#ffb000'], 'A sliver of sunshine left over from the eclipse. Warm to touch.', { sea: SEA.eclipse, lim: 150 }],
    ['egg', 'Golden Egg', 3, ['egg', '#ffd400'], 'An Easter egg made of gold. Do not eat.', { sea: SEA.easter, lim: 150 }],
    ['heart', 'Valentine Heart Box', 2, ['heart', '#ff3a6a'], 'Full of chocolates. Well, it was.', { sea: SEA.valentine, lim: 200 }],
    ['pan', 'Golden Frying Pan', 2, ['pan', '#ffd400'], 'For the perfect Pancake Day flip.', { sea: SEA.pancake, lim: 200 }],
    ['goldcube', 'Solid Gold Cube', 4, ['cube', '#ffd400'], 'A solid gold puzzle cube. Too heavy to twist. Very solved.', { lim: 25 }],
    ['clock', 'Millennium Countdown Clock', 4, ['clock', '#c00'], 'Counts down to midnight on 31 December 1999. Beeps a lot.', { sea: SEA.nye, lim: 50 }],
    ['jackpot', 'The Jackpot Dice', 5, ['toof', 'rainbow'], 'One of only five ever found. Every side is a six. It hums. It glows. It is yours.', { lim: 5 }],
  ]);

  const ITEMS = I.map(([id, name, r, type, art, d, x]) => Object.assign({ id, name, r, type, art, d }, x || {}));
  const ITEM = {}; for (const it of ITEMS) ITEM[it.id] = it;

  // ---------------------------------------------------------------- sets: own one of each -> a one-off reward (keep the reward even if you trade later)
  const SETS = [
    { id: 'lootlings', n: 'The Lootlings Gang', d: 'One of each of the six Lootlings: Snorb, Crumbit, Pibble, Grumplet, Fizzwick and Moggle.', items: ['pet.snorb', 'pet.crumbit', 'pet.pibble', 'pet.grumplet', 'pet.fizzwick', 'pet.moggle'], teef: 150, give: 'badge.collector' },
    { id: 'cards1', n: 'JackCards Series One (1-12)', d: 'The first twelve JackCards, from Floppy Disk to 486 PC.', items: ITEMS.filter(i => i.type === 'card' && i.art[0] <= 12).map(i => i.id), teef: 200, give: 'btn.cardshark' },
    { id: 'cards2', n: 'JackCards Series One (13-20)', d: 'The rarer cards: the Euro, the Millennium Bug, Gubbinz, a Battle Robot, Dave, the Knitting Club, the Dome and the space screensaver.', items: ITEMS.filter(i => i.type === 'card' && i.art[0] >= 13 && i.art[0] <= 20).map(i => i.id), teef: 400 },
    { id: 'hatrack', n: 'The Hat Rack', d: 'Eight everyday hats: Chef, Fez, Mortarboard, Viking, Propeller, Cowboy, Jester and Pirate.', items: ['hat.chef', 'hat.fez', 'hat.mortar', 'hat.viking', 'hat.propeller', 'hat.cowboy', 'hat.jester', 'hat.pirate'], teef: 200 },
    { id: 'themes', n: 'Paint Box', d: 'Six window themes: Ocean, Forest, Slate, Grape, Bubblegum and Sunset.', items: ['col.ocean', 'col.forest', 'col.slate', 'col.grape', 'col.bubblegum', 'col.sunset'], teef: 150 },
    { id: 'spooky', n: 'Spooky Season', d: 'The Halloween collection (only drops from 24 October to 2 November).', items: ['hat.witch', 'face.mask', 'badge.pumpkin', 'wall.bats', 'card.pumpkin'], teef: 250 },
    { id: 'bonfire', n: 'Remember Remember', d: 'Bonfire Night things (1 to 7 November).', items: ['hat.bonfire', 'badge.firework', 'wall.fireworks', 'card.bonfire', 'trinket.sparkler'], teef: 200 },
    { id: 'xmas', n: 'Christmas Stocking', d: 'Festive things (December only).', items: ['hat.santa', 'hat.antlers', 'face.beard', 'badge.snow', 'wall.snow', 'cur.candy', 'card.xmas'], teef: 300 },
    { id: 'eclipse', n: 'Eclipse Chaser', d: 'From the total eclipse of 11 August 1999 (drops 4 to 18 August).', items: ['face.eclipse', 'badge.eclipse', 'wall.eclipse', 'card.eclipse', 'col.corona'], teef: 300 },
    { id: 'gadgets', n: 'Gadget Freak', d: 'Every everyday gadget card: Pager, Mobile, VHS, Personal Stereo, Virtual Pet and the 486.', items: ['card.pager', 'card.mobile', 'card.vhs', 'card.walkman', 'card.vpet', 'card.486'], teef: 150 },
    { id: 'rainbow', n: 'Rainbow Road', d: 'Own something of every rarity, from Common all the way to Jackpot.', rar: true, teef: 500, give: 'badge.rainbow' },
  ];
  const SET = {}; for (const s of SETS) SET[s.id] = s;

  // ---------------------------------------------------------------- achievements (one-off, server checks them)
  const ACH = [
    ['firstdrop', 'Finders Keepers', 'Find your first item', 10],
    ['parcel', 'Postman Pat-a-Pibble', 'Open a Daily Parcel', 10],
    ['items10', 'Magpie', 'Own 10 different items', 25],
    ['items50', 'Hoarder', 'Own 50 different items', 75],
    ['items100', 'Loot Lord', 'Own 100 different items', 200, 'badge.lootlord'],
    ['rare', 'Ooh, Shiny', 'Find a Rare item', 15],
    ['epic', 'Purple Patch', 'Find an Epic item', 40],
    ['legend', 'The Stuff of Legend', 'Find a Legendary item', 100],
    ['jackpot', 'JACKPOT!!!', 'Find a Jackpot item', 250],
    ['set', 'Set Complete!', 'Complete a collection set', 25],
    ['sets5', 'Completionist', 'Complete five collection sets', 150],
    ['trade', 'Fair Swap', 'Finish a trade at the Trading Post', 20, 'badge.trader'],
    ['sell', 'Shopkeeper', 'Sell something on the Bazaar', 15],
    ['buy', 'Bargain Hunter', 'Buy something on the Bazaar', 10],
    ['pay', 'Generous', 'Send Rupees to another member', 10],
    ['recycle', 'Green Fingers', 'Recycle 10 items', 15],
    ['combine', 'Mad Scientist', 'Combine five items into a better one', 25],
    ['shop', 'Window Shopper', 'Buy something from a Lootlings shopkeeper', 10],
    ['sites25', 'Surfer', 'Visit 25 different web sites', 30],
    ['sites100', 'Information Superhighwayman', 'Visit 100 different web sites', 100],
    ['progs25', 'Power User', 'Open 25 different programs', 30],
    ['installs5', 'Download Demon', 'Install 5 programs from the Software Centre or the Shareware Shack', 20],
    ['installs20', 'Hard Disk Hero', 'Install 20 different programs', 60],
    ['missions', 'Busy Bee', 'Finish all three Daily Missions in a day', 20],
    ['missions10', 'Mission Control', 'Finish 10 Daily Missions', 50],
    ['days7', 'Regular', 'Log on to JackNet on 7 different days', 30],
    ['serial1', 'Number One', 'Own a limited item with serial number #1', 50],
    ['beta', 'Beta Tester', 'Play Lootlings before the Grand Opening (15 November 1999)', 10, 'badge.beta'],
    ['opening', 'Grand Opener', 'Log on during the Grand Opening week (15-21 November 1999)', 25, 'badge.opening'],
  ].map(([id, n, d, teef, give]) => ({ id, n, d, teef, give }));
  const ACHI = {}; for (const a of ACH) ACHI[a.id] = a;

  // ---------------------------------------------------------------- daily missions: three a day, picked by the server
  // ev: the earn sources (CAT.EARN in econ-cat.js) or loot events that count; need: how many
  const MISSIONS = [
    ['site3', 'Visit 3 web sites you have never been to before', ['site'], 3],
    ['prog2', 'Open 2 programs you have never opened before', ['prog'], 2],
    ['score1', 'Get on a High Score table in the Arcade', ['score'], 1],
    ['pb1', 'Beat one of your own Arcade high scores', ['pb'], 1],
    ['secret1', 'Find a secret hidden on the PC', ['secret'], 1],
    ['post1', 'Post on the JackNet forums', ['post', 'topic'], 1],
    ['chat3', 'Say something in #jackattack 3 times (a little while apart)', ['chat'], 3],
    ['play2', 'Play on the PC for 10 minutes', ['play'], 2],
    ['pet1', 'Look after Gubbinz (feed, play or clean)', ['petcare'], 1],
    ['frag3', 'Score 3 frags in JackReal Tournament', ['frag'], 3],
    ['quiz1', 'Get a Quiz Night question right (JackIRC #quiznight, on the hour)', ['quiz'], 1],
    ['cards1', 'Win a game of Solitaire', ['cards'], 1],
    ['parcel', 'Open your Daily Parcel', ['parcel'], 1],
    ['recycle1', 'Recycle something you do not need', ['recycle'], 1],
    ['bazaar', 'Have a look round the Bazaar', ['bazaar'], 1],
    ['cupboard1', 'Play a game from the Games Cupboard', ['cupboard'], 1],
    ['gb1', 'Write a letter to Jack', ['gb'], 1],
    ['install1', 'Install a program you have not had before (Run: software)', ['install'], 1],
  ].map(([id, n, ev, need]) => ({ id, n, ev, need }));
  const MISS = {}; for (const m of MISSIONS) MISS[m.id] = m;
  const MISSION_TEEF = [15, 20, 25], MISSION_BONUS = 15;

  // ---------------------------------------------------------------- rules (the numbers the server uses)
  const RULES = {
    dropsPerDay: 10,          // random drops from play per member per UK day (the parcel and missions are extra)
    invMax: 600,              // items you can hold; past that a drop is recycled for its Rupees straight away
    parcelsMax: 7,            // unopened Daily Parcels kept (one a day; they never vanish)
    combineN: 5,              // N of one rarity -> 1 of the next (you choose which)
    payDayMax: 500,           // Rupees you can send other members per UK day
    payRecvMax: 1000,         // Rupees a member can receive per UK day
    payMinEarned: 100,        // you must have earned this many Rupees yourself before you can send or trade Rupees
    tradeMax: 3,              // open trades per member
    tradeItems: 8,            // items per side of a trade
    listMax: 12,              // Bazaar listings per member
    feePct: 5,                // the Bazaar keeps 5% (at least 1 Rupee) of every sale: it vanishes, keeping Rupees valuable
    priceMax: 1000000,
    openDay: 1115,            // Lootlings Grand Opening (15 November 1999)
  };

  // ---------------------------------------------------------------- helpers
  const inSeason = (it, md) => !it.sea || (it.sea[0] <= it.sea[1] ? md >= it.sea[0] && md <= it.sea[1] : md >= it.sea[0] || md <= it.sea[1]);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const seasonName = it => { if (!it.sea) return ''; for (const k in SEA) if (SEA[k] === it.sea) return k; return ''; };
  const md2txt = md => { const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return `${md % 100} ${M[Math.floor(md / 100) - 1]}`; };

  const C = { RAR, TYPES, TYPE_ORDER, SHOPS, PRICE, SEA, ITEMS, ITEM, SETS, SET, ACH, ACHI, MISSIONS, MISS, MISSION_TEEF, MISSION_BONUS, RULES, inSeason, hash, seasonName, md2txt };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.LootCat = C;
})(this);

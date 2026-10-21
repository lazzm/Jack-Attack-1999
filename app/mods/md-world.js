/* md-world: the JackMUD world (server only; read by mods/md.js, not a mod itself). Classes, items, monsters, help pages,
 * the banner and the room parser. Rooms: mods/md-rooms.js. People and quests: mods/md-people.js. */
'use strict';

// ---------------------------------------------------------------- areas (level guide shown by AREAS)
const AREAS = {
  school: { n: "Adventurers' Academy", lv: '1', d: 'Where every new hero starts. Learn the ropes!' },
  town: { n: 'Baudby', lv: '1-20', d: 'The town. Shops, bank, inn, temple, guilds. Safe as houses.' },
  fields: { n: 'Floppy Fields', lv: '1-5', d: 'Farms, geese, bunnies and the Rocket Range. East of town.' },
  woods: { n: 'Whispering Woods', lv: '2-6', d: 'Granny Byte, a troll bridge and a sleepy bear. West of town.' },
  sewers: { n: 'The Sewers of Baudby', lv: '3-7', d: 'Sock gremlins! Down the ladder in the Back Alley.' },
  sea: { n: 'The Isle of Spam', lv: '5-9', d: 'Pirates, parrots and buried treasure. Sail from the docks.' },
  hills: { n: 'The Grumbly Hills', lv: '6-9', d: 'North of Floppy Fields. Goats. Wind. More goats.' },
  caves: { n: 'The Caves of Lag', lv: '7-11', d: 'Where everything goes... a... bit... slow. Up in the hills.' },
  mount: { n: 'Mount Megabyte', lv: '9-14', d: "Snow, a yeti and Floppitha the dragon's keep." },
  space: { n: 'Orbital Station 99', lv: '10-15', d: 'You need a Launch Pass from the Rocket Range!' },
  moon: { n: 'The Moon', lv: '12-16', d: 'It IS made of cheese. And something is eating it.' },
  y2k: { n: 'The Old Server Room', lv: '14-20', d: 'Under the Clock Tower. The Millennium Bug lives here.' },
  den: { n: "The Implementor's Den", lv: '?', d: 'You should not be here. (Hi!)', hide: 1 },
};

// ---------------------------------------------------------------- classes
const CLASSES = {
  knight: { n: 'Knight', abbr: 'Kni', col: 'C', hp0: 32, hpL: 10, mp0: 6, mpL: 2, atk: 2, ac: 1,
    short: 'Big, brave and very hard to knock over. Bashes things with a shield.',
    d: 'Knights have the most HP and wear the heaviest armour. Your skills: BASH (a shield wallop that can knock monsters silly) and later GUARD (block the next two hits). Perfect if you like being at the front.',
    look: 'They clank slightly when they walk.', kit: ['fizz', 'fizz'], wear: ['practsword', 'jumper'],
    art: ['    _____  ', '   |  |  | ', '   |--+--| ', '   |__|__| ', '  /|=====|\\', ' / |  |  | \\', '   | / \\ | ', '  _|/   \\|_'],
    skills: [
      { id: 'bash', lv: 1, mp: 3, cd: 3, target: 'mob', d: 'Wallop a monster with your shield. Big damage, might knock it silly.', fn(o) { const d = o.playerHit(o.P, o.m, 1.8, false, 'shield BASH'); if (d && o.api.chance(0.45)) { o.api.stun(o.m, 1, 'seeing stars'); o.out(o.P, `{C}${o.api.cap1(o.m.t.short)} is seeing stars!{x}`); } } },
      { id: 'guard', lv: 5, mp: 6, cd: 6, d: 'Raise your shield: the next two hits bounce off.', fn(o) { o.P.fx.block = 2; o.out(o.P, '{C}You raise your shield and set your feet. Come on then!{x}'); o.toRoom(o.P.room, `${o.P.name} raises their shield.`, o.P); } },
    ] },
  wizard: { n: 'Wizard', abbr: 'Wiz', col: 'M', hp0: 22, hpL: 6, mp0: 24, mpL: 6, atk: 0, ac: 0,
    short: 'Clever and sparkly. Zaps things from a safe distance.',
    d: "Wizards are a bit wobbly in a punch-up, but their ZAP never misses and hurts a LOT. Later you learn FROST, which freezes monsters solid for a couple of goes. Keep an eye on your MP and REST when it's low.",
    look: 'Their fingertips fizz with little blue sparks.', kit: ['fizz', 'fizz', 'tea'], wear: ['bentwand', 'pointyhat'],
    art: ['      /\\    ', '     /**\\   ', '    /____\\  ', '    ( o.o)  ', '   __|  |__ ', '  /  |  |  \\*', '    /____\\  ', '    |_||_|  '],
    skills: [
      { id: 'zap', lv: 1, mp: 4, cd: 1, target: 'mob', d: 'A crackling bolt of magic. Never misses.', fn(o) { const d = o.api.rint(4, 8) + Math.round(o.ch.lv * 1.6); o.m.hp -= d; o.out(o.P, `{M}ZAAAP!{x} A crackling bolt of purple magic hits ${o.m.t.short}! {D}(${d}){x}`); o.toRoom(o.P.room, `{M}${o.P.name} zaps ${o.m.t.short} with a bolt of purple magic!{x}`, o.P); } },
      { id: 'frost', lv: 5, mp: 8, cd: 5, target: 'mob', d: 'Freeze a monster solid for two rounds.', fn(o) { const d = o.api.rint(2, 5) + o.ch.lv; o.m.hp -= d; o.api.stun(o.m, 2, 'frozen solid'); o.out(o.P, `{C}FWOOSH!{x} ${o.api.cap1(o.m.t.short)} is frozen solid like a fish finger! {D}(${d}){x}`); o.toRoom(o.P.room, `{C}${o.P.name} freezes ${o.m.t.short} solid!{x}`, o.P); } },
    ] },
  ranger: { n: 'Ranger', abbr: 'Ran', col: 'G', hp0: 27, hpL: 8, mp0: 12, mpL: 3, atk: 1, ac: 1,
    short: 'Quick, sharp-eyed and handy with a bow. Good at everything.',
    d: 'Rangers are the all-rounders. SHOOT fires an arrow (start a fight from a distance, or finish one), and later VOLLEY fires three. Rangers also spot hidden things more easily. Lovely green hoods.',
    look: 'Their hood has a little leaf stuck in it.', kit: ['fizz', 'fizz', 'apple'], wear: ['toybow', 'hood'],
    art: ['     ___    ', '    /   \\   ', '   | o o |  ', '    \\ - /  )', '   /|   |\\/ ', '  / |   | ) ', '    |___|/  ', '    /   \\   '],
    skills: [
      { id: 'shoot', lv: 1, mp: 3, cd: 2, target: 'mob', d: 'Fire an arrow. Extra damage, rarely misses.', fn(o) { o.playerHit(o.P, o.m, 1.5, o.api.chance(0.85), 'arrow'); } },
      { id: 'volley', lv: 5, mp: 8, cd: 5, target: 'mob', d: 'Fire three arrows, one after the other. Thwip thwip thwip!', fn(o) { for (let i = 0; i < 3 && o.m.hp > 0; i++) o.playerHit(o.P, o.m, 0.8, false, 'arrow'); } },
    ] },
  bard: { n: 'Bard', abbr: 'Bar', col: 'Y', hp0: 25, hpL: 7, mp0: 18, mpL: 5, atk: 1, ac: 0,
    short: "Plays catchy tunes that heal friends and send monsters to sleep.",
    d: "Bards are everybody's favourite party member. SING heals you and everyone in your party who's in the room. Later, LULLABY sends a monster to sleep. You fight with a tambourine. It's a very tough tambourine.",
    look: 'They are humming something catchy.', kit: ['fizz', 'fizz', 'tea'], wear: ['tambourine', 'jacket'],
    art: ['     ___    ', '    (o o)  ♪', '     \\-/  ♫ ', '   __| |__  ', '  /  |=|  ( )', '     |=|  /  ', '    /   \\    ', '   /     \\   '],
    skills: [
      { id: 'sing', lv: 1, mp: 5, cd: 3, d: 'A healing song for you and your party (in the same room).', fn(o) { const n = 6 + o.ch.lv * 2; o.toRoom(o.P.room, `{Y}${o.P.name} sings a catchy little song. ♪ ♫{x}`, o.P); for (const Q of o.party) { o.api.heal(Q, n); o.out(Q, `{G}${Q === o.P ? 'You sing a catchy little song. ♪ ♫ You feel' : o.P.name + "'s song makes you feel"} better! (+${n} HP){x}`); } } },
      { id: 'lullaby', lv: 5, mp: 7, cd: 6, target: 'mob', d: 'Sing a monster to sleep for a few rounds.', fn(o) { o.api.stun(o.m, 3, 'fast asleep and snoring'); o.out(o.P, `{Y}You sing a gentle lullaby... ${o.api.cap1(o.m.t.short)} yawns, curls up and starts snoring!{x}`); o.toRoom(o.P.room, `{Y}${o.P.name} sings ${o.m.t.short} to sleep!{x}`, o.P); } },
    ] },
};

// ---------------------------------------------------------------- items
// I(id, short, keywords, type, fields)
const ITEMS = {};
function I(id, short, kw, type, f) { ITEMS[id] = Object.assign({ id, short, kw: kw.split(' '), type, value: 0, desc: 'It looks like ' + short + '.' }, f || {}); }
I('fists', 'your bare fists', 'fists', 'weapon', { dmg: [1, 3], verb: 'punch' });
// weapons
I('practsword', 'a wooden practice sword', 'sword wooden practice', 'weapon', { dmg: [2, 4], value: 6, verb: 'swing', desc: 'A wooden sword from the Academy. Somebody has carved "DAVE WOZ ERE" into the handle.' });
I('bentwand', 'a slightly bent wand', 'wand bent', 'weapon', { dmg: [1, 3], mp: 3, value: 6, verb: 'poke', desc: 'A wand with a kink in it, like a bendy straw. Still works. Mostly.' });
I('toybow', 'a little hunting bow', 'bow little hunting', 'weapon', { dmg: [2, 4], value: 6, verb: 'shot', desc: 'A small bow made of springy yew. Comes with a quiver of arrows that never runs out (nobody knows why).' });
I('tambourine', 'a tough tambourine', 'tambourine', 'weapon', { dmg: [2, 3], mp: 2, value: 6, verb: 'jingle-bonk', desc: 'Jingly. Surprisingly heavy. Has a sticker on it that says "BAND PRACTICE THURSDAYS".' });
I('stick', 'a pointy stick', 'stick pointy', 'weapon', { dmg: [1, 4], value: 1, desc: 'The oldest weapon there is. Every kid knows the perfect stick when they see one.' });
I('dagger', 'a sharp dagger', 'dagger', 'weapon', { dmg: [2, 5], value: 20, desc: 'Small, shiny and pointy. Brunhilda says it is "for cutting cheese, mostly".' });
I('cricketbat', 'a cricket bat', 'bat cricket', 'weapon', { dmg: [2, 6], value: 40, lv: 2, verb: 'swing', desc: 'Signed by the whole Baudby Under-14s. HOWZAT!' });
I('shortsword', 'a short sword', 'sword short', 'weapon', { dmg: [3, 7], value: 90, lv: 4, desc: 'A proper sword! Not too long, not too heavy. Like Goldilocks, but stabby.' });
I('staff', 'an oak staff', 'staff oak', 'weapon', { dmg: [2, 6], mp: 8, value: 85, lv: 4, cls: ['wizard', 'bard'], desc: 'A tall oak staff with a crystal on top that glows when there are monsters about (or when the batteries are fresh).' });
I('longbow', 'a longbow', 'longbow bow long', 'weapon', { dmg: [3, 8], value: 120, lv: 6, cls: ['ranger'], desc: 'Taller than you are. Twang!' });
I('longsword', 'a longsword', 'sword longsword long', 'weapon', { dmg: [4, 9], value: 200, lv: 7, desc: 'Long, gleaming and VERY serious. Mind the furniture.' });
I('mace', 'a mighty mace', 'mace mighty', 'weapon', { dmg: [5, 11], value: 420, lv: 10, desc: 'A great spiky metal ball on a stick. Spiky but friendly. Somehow.' });
I('crystalstaff', 'a crystal staff', 'staff crystal', 'weapon', { dmg: [4, 9], mp: 18, value: 400, lv: 10, cls: ['wizard', 'bard'], desc: 'Hums like a CRT telly when you switch it on.' });
I('lute', 'an electric lute', 'lute electric', 'weapon', { dmg: [4, 9], mp: 12, value: 380, lv: 9, cls: ['bard'], desc: 'A lute with a little amp built in. Goes up to eleven.' });
I('megablade', 'the Megabyte Blade', 'blade megabyte sword', 'weapon', { dmg: [7, 14], value: 900, lv: 13, unique: 1, desc: 'A sword forged from a thousand melted-down floppy disks. It hums. It glows. It holds exactly 1,048,576 bytes of awesome.' });
I('cosmicbow', 'the Cosmic Bow', 'bow cosmic', 'weapon', { dmg: [6, 13], value: 850, lv: 13, unique: 1, desc: 'A bow strung with a moonbeam. Arrows leave a little trail of stars.' });
I('wonderwand', "the Wizard's Wonder Wand", 'wand wonder', 'weapon', { dmg: [5, 11], mp: 30, value: 850, lv: 12, unique: 1, desc: 'Made from the Hourglass of Patience. Very fast. No lag at all.' });
// armour
I('jumper', 'a woolly jumper', 'jumper woolly', 'armour', { slot: 'body', ac: 1, value: 5, desc: 'Hand-knitted. It has a reindeer on it even though it is not Christmas.' });
I('pointyhat', 'a pointy wizard hat', 'hat pointy wizard', 'armour', { slot: 'head', ac: 0, mp: 3, value: 5, desc: 'Blue with silver stars. Slightly too big. Falls over your eyes when you sneeze.' });
I('hood', 'a green hood', 'hood green', 'armour', { slot: 'head', ac: 1, value: 5, desc: 'Very Robin Hood. Very good for looking mysterious in.' });
I('jacket', "a jester's jacket", 'jacket jester', 'armour', { slot: 'body', ac: 1, value: 5, desc: 'Red and yellow diamonds with little bells on. Jingle jingle.' });
I('scarf', 'an Academy scarf', 'scarf academy', 'armour', { slot: 'neck', ac: 0, hp: 3, value: 2, desc: 'A stripy scarf in Academy colours (purple and green, yuck). Everyone has to have one.' });
I('saucepan', 'a saucepan helmet', 'saucepan helmet pan', 'armour', { slot: 'head', ac: 1, value: 8, desc: "It's a saucepan. On your head. You look ridiculous and brilliant." });
I('bikehelmet', 'a bike helmet', 'helmet bike', 'armour', { slot: 'head', ac: 2, value: 25, lv: 2, desc: 'Bright orange with go-faster stripes. Safety first!' });
I('jerkin', 'a leather jerkin', 'jerkin leather', 'armour', { slot: 'body', ac: 2, value: 35, lv: 2, desc: 'A sleeveless leather jacket. Smells like a new football.' });
I('trainers', 'a pair of light-up trainers', 'trainers shoes', 'armour', { slot: 'feet', ac: 1, value: 20, desc: 'They flash red when you stamp. Absolutely the best thing ever.' });
I('gloves', 'some gardening gloves', 'gloves gardening', 'armour', { slot: 'hands', ac: 1, value: 12, desc: 'Flowery. Good for grabbing stinging nettles and grumpy geese.' });
I('binlid', 'a dustbin lid', 'lid dustbin shield', 'armour', { slot: 'shield', ac: 2, value: 15, desc: 'A metal dustbin lid with a handle. The finest shield in Baudby, if you ask the binmen.' });
I('chainmail', 'a chainmail vest', 'chainmail vest mail', 'armour', { slot: 'body', ac: 4, value: 140, lv: 6, desc: 'Thousands of little metal rings. Takes ages to put on. Very jingly.' });
I('knighthelm', "a knight's helm", 'helm knight helmet', 'armour', { slot: 'head', ac: 3, value: 110, lv: 6, desc: 'A proper helmet with a visor. Everything sounds echoey in it.' });
I('roundshield', 'a round wooden shield', 'shield round wooden', 'armour', { slot: 'shield', ac: 3, value: 90, lv: 5, desc: 'A sturdy shield painted with a dragon that looks a bit like a dog.' });
I('robe', 'a starry robe', 'robe starry', 'armour', { slot: 'body', ac: 2, mp: 10, value: 150, lv: 6, cls: ['wizard', 'bard'], desc: 'Midnight blue with stars that actually twinkle.' });
I('platemail', 'a suit of plate armour', 'plate armour platemail suit', 'armour', { slot: 'body', ac: 6, value: 380, lv: 10, desc: 'Shiny, heavy and very clanky. You could hide in a corner of a castle and nobody would notice.' });
I('boots', 'a pair of hiking boots', 'boots hiking', 'armour', { slot: 'feet', ac: 2, value: 60, lv: 5, desc: 'Big chunky boots for climbing mountains. Laces like spaghetti.' });
I('furcoat', 'a yeti-fluff coat', 'coat fluff yeti', 'armour', { slot: 'body', ac: 5, hp: 15, value: 300, lv: 9, desc: 'Made from fluff the yeti brushed out of his fur. Warm as a hug.' });
// quest rewards (wearable)
I('wellies', 'a pair of green wellies', 'wellies boots green', 'armour', { slot: 'feet', ac: 2, hp: 5, value: 30, unique: 1, desc: "Farmer Giles' spare wellies. Geese can't get you in these." });
I('wizhat', 'a slightly singed wizard hat', 'hat singed wizard', 'armour', { slot: 'head', ac: 1, mp: 8, value: 40, unique: 1, desc: 'Dave set fire to it. Twice. Still works brilliantly.' });
I('medal', 'the Mayoral Medal', 'medal mayoral', 'armour', { slot: 'neck', ac: 1, hp: 12, value: 60, unique: 1, desc: 'A big gold medal on a ribbon: "FOR SERVICES TO SOCKS".' });
I('pebble', "Trevor's lucky pebble", 'pebble lucky', 'armour', { slot: 'neck', hp: 6, mp: 4, value: 15, unique: 1, desc: 'A smooth grey pebble on a string. Trevor has painted a smiley face on it.' });
I('knightshield', "Sir Clanksalot's spare shield", 'shield spare clanksalot', 'armour', { slot: 'shield', ac: 4, value: 70, unique: 1, desc: 'It has a picture of a knight falling off a horse on it. "Family crest," says Sir Clanksalot.' });
I('piratehat', 'a pirate hat', 'hat pirate tricorn', 'armour', { slot: 'head', ac: 2, hp: 8, value: 55, unique: 1, desc: 'A black three-cornered hat with a skull and crossbones. Arrr.' });
I('amulet', 'a barnacle amulet', 'amulet barnacle', 'armour', { slot: 'neck', ac: 2, hp: 20, mp: 10, value: 120, unique: 1, desc: 'A shell on a chain, covered in tiny barnacles. You can hear the sea in it.' });
I('dragonshield', 'a dragon-scale shield', 'shield dragon scale', 'armour', { slot: 'shield', ac: 6, hp: 15, value: 300, unique: 1, desc: 'One of Floppitha\'s old scales, polished up like a mirror. Shimmers purple and green.' });
I('spacehelmet', 'a space helmet', 'helmet space', 'armour', { slot: 'head', ac: 3, value: 80, unique: 1, desc: 'A round glass bubble with a tiny fan inside. Lets you breathe in space!' });
I('cheesecrown', 'a crown of moon cheese', 'crown cheese moon', 'armour', { slot: 'head', ac: 4, hp: 25, mp: 15, value: 400, unique: 1, desc: 'Smells a bit. Glows a bit. A gift from the Queen of the Moon Mice.' });
I('millmedal', 'the Millennium Medal', 'medal millennium', 'armour', { slot: 'neck', ac: 4, hp: 40, mp: 25, value: 999, unique: 1, desc: 'A silver medal shaped like a clock showing one minute to midnight. "Y2K? NOT ON MY WATCH."' });
I('wizring', 'a ring of quick thinking', 'ring quick', 'armour', { slot: 'hands', ac: 1, mp: 20, value: 250, unique: 1, desc: 'A silver ring. When you wear it, maths homework feels easier. (It does not do it for you.)' });
// food and drink
I('fizz', 'a bottle of Fizz Pop', 'fizz pop bottle', 'drink', { heal: 15, value: 5, desc: 'Fizzy orange pop. Heals 15 HP. Makes you burp.', eatMsg: 'You glug the Fizz Pop. BUUURP. Excuse you!' });
I('dfizz', 'a bottle of Double Fizz', 'double fizz', 'drink', { heal: 40, value: 18, desc: 'TWICE the fizz! Heals 40 HP.', eatMsg: 'You glug the Double Fizz. Your eyes water. BUUUUUURP!' });
I('mfizz', 'a can of MEGA FIZZ', 'mega fizz can', 'drink', { heal: 100, value: 50, desc: 'The fizziest drink known to science. Heals 100 HP. Not sold to under-tens.', eatMsg: 'You crack open the MEGA FIZZ. It fizzes up your nose. You feel AMAZING.' });
I('tea', 'a cup of tea', 'tea cup', 'drink', { mana: 15, value: 4, desc: 'A proper cup of tea. Restores 15 MP. Mom says it fixes everything.', eatMsg: 'You sip the tea. Ahhh. Your brain feels fresh.' });
I('slush', 'a blue slush', 'slush blue', 'drink', { mana: 35, heal: 5, value: 14, desc: 'Blue raspberry flavour (no raspberry has ever been blue). Restores 35 MP. Brain freeze included.', eatMsg: 'You slurp the slush. BRAIN FREEZE! ...but your magic tingles back.' });
I('milkshake', 'a strawberry milkshake', 'milkshake shake strawberry', 'drink', { heal: 30, mana: 30, value: 30, desc: 'Pink, thick and delicious. Heals 30 HP and 30 MP.' });
I('apple', 'a shiny apple', 'apple', 'food', { heal: 6, value: 1, desc: 'Red and crunchy. An apple a day keeps Sister Ping away.' });
I('sandwich', 'a jam sandwich', 'sandwich jam', 'food', { heal: 12, value: 3, desc: 'Strawberry jam. Cut into triangles, obviously. Heals 12 HP.' });
I('chips', 'a bag of chips', 'chips bag', 'food', { heal: 20, value: 6, desc: 'Hot chips with salt and vinegar, wrapped in paper. Heals 20 HP.' });
I('cookie', "one of Granny Byte's cookies", 'cookie biscuit', 'food', { heal: 30, value: 4, desc: 'Chocolate chip, still warm. Heals 30 HP. Grannies make the best cookies, this is a known fact.' });
I('mooncheese', 'a chunk of moon cheese', 'cheese chunk moon', 'food', { heal: 50, mana: 20, value: 25, desc: 'Pale green and slightly glowing. Tastes like cheddar and space.' });
I('spacetomato', 'a space tomato', 'tomato space', 'food', { heal: 25, value: 8, desc: 'Grown in zero gravity, so it is perfectly round. Heals 25 HP.' });
I('crisps', 'a packet of crisps', 'crisps packet', 'food', { heal: 8, value: 2, desc: 'Cheese and onion. There might be a Tazo inside. (There isn\'t.)' });
// junk and treasure (sell them!)
I('sock', 'an odd sock', 'sock odd', 'junk', { value: 2, desc: 'A single sock. Where is the other one? Nobody knows. The eternal mystery.' });
I('feather', 'a goose feather', 'feather goose', 'junk', { value: 2, desc: 'Big, white and fluffy. Good for tickling.' });
I('acorn', 'a shiny acorn', 'acorn', 'junk', { value: 3, desc: 'A squirrel was saving this. Oops.' });
I('ratshat', "a rat's tiny hat", 'hat tiny rat', 'junk', { value: 6, desc: 'A teeny tiny bowler hat. Very dapper.' });
I('slime', 'a jar of green slime', 'jar slime green', 'junk', { value: 8, desc: 'Wobbly, green and it smells of feet. Kids at school would pay good money for this.' });
I('shell', 'a pretty seashell', 'seashell shell', 'junk', { value: 5, desc: 'Pink and swirly. Hold it to your ear for free sea noises.' });
I('crystal', 'a glowing crystal', 'crystal glowing', 'treasure', { value: 25, desc: 'It glows a gentle blue, like a telly left on standby.' });
I('doubloon', 'a gold doubloon', 'doubloon coin', 'treasure', { value: 30, desc: 'A pirate coin! Pieces of eight! (Actually it is a piece of one.)' });
I('gear', 'a little brass cog', 'cog gear brass', 'treasure', { value: 20, desc: 'From inside something clever. Ticks quietly on its own.' });
I('chip', 'a silicon chip', 'chip silicon microchip', 'treasure', { value: 40, desc: 'A little black computer chip with lots of legs, like a robot centipede. Says "486" on it.' });
I('ruby', 'a red ruby', 'ruby red gem', 'treasure', { value: 80, desc: 'Deep red and sparkly. Floppitha would love this.' });
I('stardust', 'a pinch of stardust', 'stardust dust', 'treasure', { value: 60, desc: 'Twinkly silver powder in a twist of paper. Do not sneeze.' });
I('marble', 'a glass marble', 'marble', 'junk', { value: 4, desc: 'A green cat\'s-eye marble. A good shooter.' });
I('tazo', 'a shiny tazo', 'tazo', 'junk', { value: 3, desc: 'A round plastic disc from a crisp packet. Everyone collects these.' });
I('floppy', 'a floppy disk', 'floppy disk', 'junk', { value: 2, desc: 'A 3.5" floppy disk labelled "HOMEWORK (NOT GAMES)". It is games.' });
I('bone', 'a big bone', 'bone big', 'junk', { value: 3, desc: 'A great big bone. Some dog somewhere is very sad.' });
// quest things
I('diploma', 'an Academy diploma', 'diploma certificate', 'quest', { quest: 1, unique: 1, desc: 'A rolled-up certificate with a gold seal.', text: '  THE ADVENTURERS\' ACADEMY OF BAUDBY\n  This is to certify that the bearer has passed\n  Moving About, Picking Things Up, Talking to People\n  and Hitting a Dummy (with distinction).\n        signed, H. Hexadecimal (Headmistress)' });
I('pixel', 'Pixel the kitten', 'pixel kitten cat', 'quest', { quest: 1, unique: 1, desc: 'A tiny black-and-white kitten with one ear inside out. She is purring like a 28.8k modem.' });
I('parcel', 'a brown paper parcel', 'parcel package', 'quest', { quest: 1, unique: 1, desc: 'Addressed to "PROF. HOOT, THE OWL TREE, DEEP WOODS". It hoots when you shake it.' });
I('letter', 'a letter for Pat', 'letter', 'quest', { quest: 1, unique: 1, desc: 'A letter in loopy owl handwriting.', text: 'Dear Pat,\nThank you for the new spectacles. I can see EVERYTHING now.\nEven that squirrel. Especially that squirrel.\nYours, Prof. H. Hoot (Owl)' });
I('page1', 'a spellbook page (one)', 'page one spellbook', 'quest', { quest: 1, unique: 1, desc: 'Page 1 of Dave\'s spellbook: "HOW TO MAKE A LIGHT (NOT A FIRE, DAVE)".' });
I('page2', 'a spellbook page (two)', 'page two spellbook', 'quest', { quest: 1, unique: 1, desc: 'Page 2 of Dave\'s spellbook: "LEVITATION FOR BEGINNERS (DO NOT TRY ON THE CAT)". It is slightly damp.' });
I('page3', 'a spellbook page (three)', 'page three spellbook', 'quest', { quest: 1, unique: 1, desc: 'Page 3 of Dave\'s spellbook: "TURNING HOMEWORK INVISIBLE". This page has been very well read.' });
I('honey', 'a jar of honey', 'honey jar', 'quest', { quest: 1, value: 0, desc: 'Golden, sticky and smells of summer. Bears go mad for this stuff.' });
I('helmet', "Sir Clanksalot's helmet", 'helmet clanksalot', 'quest', { quest: 1, unique: 1, desc: 'A dented helmet with a feather on top. It has a sticker inside: "IF FOUND RETURN TO SIR CLANKSALOT".' });
I('cracker', 'a cream cracker', 'cracker', 'quest', { quest: 1, value: 1, desc: 'Polly wants one. Polly ALWAYS wants one.' });
I('parrot', 'Polly-Gon the parrot', 'parrot polly gon', 'quest', { quest: 1, unique: 1, desc: 'A green parrot sitting on your shoulder. Every so often she says "PIECES OF EIGHT! ...AND A BIT."' });
I('map', 'a treasure map', 'map treasure', 'quest', { quest: 1, unique: 1, desc: 'A crinkly old map of the Isle of Spam.', text: '     ~~ THE ISLE OF SPAM ~~\n   lighthouse      ^ crab rocks\n        |          |\n   palms -- BEACH -- \n     |               camp\n     X  <-- the lonely dune: DIG here!\n  (Pegleg Pete, his mark)' });
I('chest', 'a little treasure chest', 'chest treasure', 'quest', { quest: 1, unique: 1, desc: 'A small wooden chest with brass corners. It rattles when you shake it!' });
I('bagsocks', 'the Big Bag of Socks', 'bag socks big', 'quest', { quest: 1, unique: 1, desc: "Hundreds of socks. Every sock Baudby has lost since 1987. They are all odd. Every single one." });
I('hourglass', 'the Hourglass of Patience', 'hourglass patience', 'quest', { quest: 1, unique: 1, desc: 'The sand falls VERY slowly. Watching it makes you want to press refresh.' });
I('goldfloppy', 'the Golden Floppy Disk', 'floppy golden disk', 'quest', { quest: 1, unique: 1, desc: 'A floppy disk made of solid gold. The label says "FLOPPITHA\'S SAVE GAME. DO NOT FORMAT."' });
I('pass', 'a Launch Pass', 'pass launch', 'quest', { quest: 1, unique: 1, desc: 'A laminated card: "STARHOPPER 99 - CREW. THIS ASTRONAUT KNOWS THEIR STUFF." Your photo is a bit blurry.' });
I('spanner', 'a space spanner', 'spanner wrench space', 'quest', { quest: 1, unique: 1, desc: 'A spanner with little rocket fins on it. Fits every bolt in the universe.' });
I('ironkey', 'the Big Iron Key', 'key iron big', 'quest', { quest: 1, unique: 1, desc: 'A huge iron key with a clock face on the handle. It ticks.' });
I('carrot', 'a golden carrot', 'carrot golden', 'quest', { quest: 1, unique: 1, desc: "The Bunny King's royal carrot. Very shiny. Very crunchy-looking. Do NOT eat it." });
I('ticket', 'a Pixel Palace prize ticket', 'ticket prize', 'quest', { quest: 1, unique: 1, desc: 'A long strip of orange tickets that says WINNER WINNER WINNER.' });
I('crumbs', 'a bag of breadcrumbs', 'crumbs breadcrumbs bag', 'food', { heal: 1, value: 1, desc: 'For feeding ducks. Or very hungry adventurers.' });
I('guidebook', 'a JackMUD newbie guide', 'guide guidebook book', 'junk', { value: 0, desc: 'A photocopied booklet, stapled in the corner.', text: "THE JACKMUD NEWBIE GUIDE (photocopied, page 1 of 1)\n  * LOOK at everything. EXAMINE things in the descriptions.\n  * N, S, E, W, U, D to walk. MAP shows where you've been.\n  * TALK to people. They give QUESTS. QUESTS shows your list.\n  * KILL monsters for gold and XP. CONSIDER them first!\n  * Low on HP? REST, or drink Fizz Pop (DRINK FIZZ).\n  * Fainted? You wake up at the temple. No biggie.\n  * WHO shows who's on. SAY talks to the room. SHOUT talks to everyone.\n  * Mom needs the phone? Type QUIT. Your character is saved (if you're a member).\n  Written by Jack. Photocopied at the library (5p a sheet!!)" });

// ---------------------------------------------------------------- monsters
// M(id, short, kw, lv, hp, dmg, xp, gold, fields)
const MOBS = {};
function M(id, short, kw, lv, hp, dmg, xp, gold, f) { MOBS[id] = Object.assign({ id, short, kw: kw.split(' '), lv, hp, dmg, xp, gold, here: (short.charAt(0).toUpperCase() + short.slice(1)) + ' is here.', desc: 'It looks like ' + short + '.', ac: Math.floor(lv / 2) }, f || {}); }
// school + town
M('dummy', 'Dennis the training dummy', 'dennis dummy training', 1, 14, [1, 2], 20, [0, 0], { here: 'Dennis the training dummy wobbles on his post, looking smug.', desc: 'A sack of straw with a bucket for a head and a face drawn on in marker pen. Someone has given him a moustache.', hit: ['wobbles into you', 'boings back and bonks you', 'flops onto your foot'], miss: ['wobbles menacingly', 'just sort of sways there'], die: 'flops over with a sad "fwump". Sergeant Stuffing props him back up straight away.', re: 5, ac: 0 });
M('pigeon', 'a scruffy pigeon', 'pigeon scruffy', 1, 6, [1, 1], 5, [0, 1], { here: 'A scruffy pigeon is pecking at a dropped chip.', desc: 'Grey, scruffy and completely unbothered by you.', peace: "You can't bring yourself to bonk a pigeon. It's only after a chip. Leave it be.", wander: 1 });
M('duck', 'a fat duck', 'duck fat', 1, 6, [1, 1], 5, [0, 0], { here: 'A fat duck paddles about, quacking hopefully.', desc: 'A big brown duck with a green head. It is looking at your pockets for bread.', peace: 'The duck looks at you with big sad duck eyes. You cannot bonk a duck. (Try GIVE CRUMBS DUCK.)' });
M('seagull', 'a cheeky seagull', 'seagull gull cheeky', 1, 10, [1, 2], 12, [1, 4], { here: 'A cheeky seagull is eyeing up your chips.', desc: 'A big white seagull with a mean yellow eye. It has stolen a LOT of chips in its time.', hit: ['pecks your ear', 'flaps in your face', 'nicks your hat and drops it'], die: 'squawks rudely and flaps off out to sea!', drops: [['chips', 0.3], ['feather', 0.3]], re: 40 });
// fields
M('goose', 'a honking goose', 'goose honking', 2, 16, [1, 3], 22, [1, 4], { here: 'A honking goose stretches its neck out at you and HONKS.', desc: 'Geese are the scariest animals in the world and everybody knows it. This one has a crazy look in its eye.', hit: ['HONKS and nips your elbow', 'flaps its massive wings at you', 'pecks your bottom'], miss: ['honks very loudly', 'hisses like a punctured tyre'], die: 'gives one last honk and waddles off in a huff!', drops: [['feather', 0.6]], re: 30 });
M('crow', 'a mischievous crow', 'crow mischievous', 2, 14, [1, 3], 20, [1, 5], { here: 'A mischievous crow is hopping about, looking for shiny things.', desc: 'Black and glossy with a beady eye. It has a bottle top in its beak.', hit: ['pecks your knuckles', 'caws right in your ear', 'flaps at your face'], die: 'caws crossly and flies off to sulk on the windmill!', drops: [['tazo', 0.3], ['marble', 0.2]], re: 30, wander: 1 });
M('turnip', 'an enormous turnip', 'turnip enormous', 3, 26, [2, 4], 32, [2, 6], { here: 'An ENORMOUS turnip has pulled itself out of the ground and is stomping about.', desc: 'It is the size of a beanbag and it has little root legs. It looks cross about being a turnip.', hit: ['rolls onto your toes', 'slaps you with a leaf', 'headbutts you with its turnip head'], die: 'falls over and goes back to being a normal (enormous) turnip.', re: 45 });
M('mower', 'a runaway lawnmower', 'lawnmower mower runaway', 4, 34, [2, 5], 45, [3, 9], { here: 'A runaway lawnmower is chugging about all by itself!', desc: "Bright red, belching smoke, and going VRRRRM. Nobody is pushing it. That's the scary part.", hit: ['runs over your foot', 'sprays you with grass clippings', 'rams you in the shins'], miss: ['chugs past you', 'stalls, coughs and restarts'], die: 'splutters, coughs out a puff of smoke and runs out of petrol.', drops: [['gear', 0.4]], re: 60, wander: 1 });
M('bee', 'a grumpy bumblebee', 'bee bumblebee grumpy', 3, 12, [2, 4], 24, [0, 2], { here: 'A big grumpy bumblebee is buzzing round your head.', desc: 'Fat, fuzzy and absolutely furious about something.', hit: ['stings you (ow!)', 'bumbles into your nose'], die: 'buzzes off back to the hive.', re: 30, aggro: 1, aggroMsg: 'zooms at your head, buzzing furiously!' });
// woods
M('squirrel', 'a stroppy squirrel', 'squirrel stroppy', 2, 14, [1, 3], 20, [1, 3], { here: 'A stroppy squirrel chatters at you from a branch.', desc: 'It has its little fists up. It wants a fight. It has had too many nuts.', hit: ['bites your finger', 'throws an acorn at your head', 'runs up your leg'], die: 'scampers up a tree, chattering rude words in squirrel.', drops: [['acorn', 0.5]], re: 30, wander: 1 });
M('hedgehog', 'a prickly hedgehog', 'hedgehog prickly', 3, 22, [2, 4], 28, [1, 4], { here: 'A prickly hedgehog is snuffling through the leaves.', desc: 'A little brown ball of spikes with a pointy wet nose.', hit: ['rolls into a ball and you prick your hand', 'snuffles crossly and spikes you'], die: 'curls up into a ball and rolls away into the bushes.', re: 40 });
M('bramble', 'a bramble beast', 'bramble beast', 4, 32, [2, 5], 42, [2, 8], { here: 'A bramble beast rustles out of the hedge, all thorns and blackberries.', desc: 'A walking bush of brambles with two blackberry eyes. It leaves purple footprints.', hit: ['scratches you with thorns', 'trips you with a creeper', 'squishes a blackberry on your head'], die: 'falls apart into a pile of twigs (and some very nice blackberries).', drops: [['apple', 0.3]], re: 50 });
M('badger', 'a grumpy badger', 'badger grumpy', 5, 40, [3, 6], 55, [3, 9], { here: 'A grumpy badger is digging and muttering to itself.', desc: 'Stripy face, little black eyes and a VERY bad attitude in the mornings.', hit: ['nips your ankle', 'digs dirt all over you', 'grumbles and shoves you'], die: 'snorts and stomps off back down its sett.', drops: [['bone', 0.3]], re: 50 });
M('wisp', "a will-o'-the-wisp", 'wisp will', 6, 44, [3, 7], 70, [4, 11], { here: "A will-o'-the-wisp bobs about, glowing a spooky blue.", desc: 'A floating blob of blue light that giggles. It wants you to follow it into the bog.', hit: ['zaps you with a static spark', 'dazzles you', 'tickles you with light'], die: 'fizzles out with a little "pop!" and a giggle.', drops: [['crystal', 0.25]], re: 60, wander: 1 });
// sewers
M('gremlin', 'a sock gremlin', 'gremlin sock', 3, 20, [1, 4], 28, [2, 6], { here: 'A sock gremlin is rummaging through a pile of socks, sniffing them.', desc: 'A small hairy creature wearing six odd socks: one on each hand and foot, and two on its ears. It is where all your socks went.', hit: ['flicks you with a wet sock', 'bites your ankle', 'stuffs a sock in your ear'], die: 'squeaks and dives into a drain, leaving a sock behind!', drops: [['sock', 0.8], ['tazo', 0.1]], re: 30, wander: 1 });
M('rat', 'a sewer rat in a tiny hat', 'rat sewer', 3, 18, [2, 4], 26, [2, 7], { here: 'A sewer rat in a tiny bowler hat tips its hat at you, then bares its teeth.', desc: 'Dapper. Smelly. Bitey. Its whiskers have been waxed into a curl.', hit: ['nibbles your shoelace', 'bites your finger', 'swats you with its tail'], die: 'squeaks "Good DAY to you!" and runs off down a pipe, dropping its hat.', drops: [['ratshat', 0.5]], re: 35 });
M('wobbler', 'a jelly wobbler', 'jelly wobbler', 4, 34, [2, 5], 40, [2, 8], { here: 'A jelly wobbler wibbles and wobbles in the corner.', desc: 'A green jelly the size of a beanbag. It has a sweet wrapper stuck inside it.', hit: ['wobbles all over you', 'squelches on your boots', 'splats you'], miss: ['wibbles', 'wobbles'], die: 'wobbles one last time and melts into a puddle of green slime.', drops: [['slime', 0.6]], re: 40 });
M('slimeblob', 'a big slime blob', 'blob slime big', 5, 46, [3, 6], 55, [3, 10], { here: 'A big slime blob blocks most of the tunnel, glooping.', desc: 'Grey-green and bubbling. You can see a lost Game Boy cartridge floating inside it.', hit: ['gloops on you', 'slimes your face', 'sucks your boot off'], die: 'goes SPLUT and spreads out into a big puddle.', drops: [['slime', 0.5], ['floppy', 0.3]], re: 50 });
M('ratbag', 'King Ratbag', 'ratbag king', 7, 145, [5, 10], 240, [30, 60], { here: 'King Ratbag sits on a throne made of shopping trolleys, wearing a crown made from a jelly mould.', desc: 'The biggest rat you have ever seen, in a velvet cape (an old curtain). He is the boss of every sock gremlin in Baudby.', hit: ['whacks you with his sceptre (a toilet brush, ew)', 'bites your arm', 'flicks his long tail at you'], miss: ['shouts "GUARDS!" but nobody comes'], die: 'squeaks "This isn\'t over! I\'ll be back! Probably on Tuesday!" and scuttles down a drain, dropping a huge bag!', drops: [['bagsocks', 1]], boss: 1, re: 300, secret: 'md.ratbag', aggro: 1, aggroMsg: 'leaps off his throne! "INTRUDER! Get them, er, me!"' });
// sea
M('crab', 'a sideways crab', 'crab sideways', 5, 30, [2, 6], 45, [2, 8], { here: 'A sideways crab scuttles about on the sand. Sideways.', desc: 'Orange, snappy and only able to walk sideways, which it seems embarrassed about.', hit: ['pinches your toe', 'snaps at your nose', 'nips your bottom'], die: 'scuttles off sideways into the sea.', drops: [['shell', 0.5]], re: 35, wander: 1 });
M('pinchalot', 'Sir Pinchalot the giant crab', 'pinchalot giant crab sir', 7, 70, [4, 8], 110, [10, 25], { here: 'Sir Pinchalot, a crab the size of a car, guards the rocks with his huge claws raised.', desc: 'A massive crab with one claw MUCH bigger than the other. He thinks he is a knight. He has a little flag stuck on his shell.', hit: ['PINCHES you with his big claw', 'swats you with his little claw', 'blows bubbles in your face'], die: 'clacks his claws in salute and retreats into the sea. "A worthy foe!"', drops: [['ruby', 0.2], ['shell', 0.7]], re: 120 });
M('deckhand', 'a pirate deckhand', 'pirate deckhand', 6, 42, [3, 7], 60, [6, 14], { here: 'A pirate deckhand is practising sword-fighting against a palm tree (and losing).', desc: 'Stripy shirt, eye patch (on the wrong eye, he keeps swapping it over), a cardboard cutlass.', hit: ['thwacks you with his cardboard cutlass', 'shouts "ARRR!" right in your face', 'kicks sand at you'], die: 'shouts "I surrender! I surrender! Don\'t tell the Captain!" and runs off up the beach.', drops: [['doubloon', 0.3]], re: 40 });
M('coconutcrab', 'a coconut crab', 'crab coconut', 7, 54, [3, 8], 80, [4, 12], { here: 'A coconut crab is trying to crack a coconut on its head.', desc: 'A big blue crab carrying a coconut like a handbag.', hit: ['drops a coconut on your head', 'pinches you hard'], die: 'grabs its coconut and runs for it.', drops: [['shell', 0.4]], re: 40 });
M('squidgy', 'Squidgy, the Kraken\'s little cousin', 'squidgy kraken octopus', 9, 210, [6, 12], 420, [40, 80], { here: "Squidgy, the Kraken's little cousin, waves eight wobbly tentacles at you from the rock pool!", desc: 'An octopus the size of a bouncy castle, bright pink, with a seriously cheeky grin. Each tentacle is holding something it stole from a ship.', hit: ['slaps you with a tentacle', 'squirts ink at you', 'tickles you with all eight arms', 'wraps you up like a burrito'], die: 'squirts a cloud of ink, giggles, and squelches off into the deep sea!', drops: [['doubloon', 1], ['ruby', 0.3]], boss: 1, re: 300, secret: 'md.squidgy', special: { p: 0.2, fn(api, m, L) { api.hitAll(m, L, 4, '{M}Squidgy squirts a HUGE cloud of ink over everybody! Bleurgh!{x} {D}(4){x}'); } } });
// hills + caves
M('goat', 'a mountain goat', 'goat mountain', 6, 40, [3, 6], 55, [2, 7], { here: 'A mountain goat is chewing something (it might be a boot).', desc: 'A shaggy goat with curly horns and a beard. It is eating a crisp packet.', hit: ['headbutts you', 'chews your sleeve', 'butts you in the bottom'], die: 'bleats and bounces off up the rocks.', re: 35, wander: 1 });
M('bat', 'a buffering bat', 'bat buffering', 7, 40, [3, 7], 70, [3, 9], { here: 'A buffering bat hangs from the ceiling, spinning slowly round and round.', desc: 'A little brown bat that spins in circles like a loading icon. It is very hard to tell when it is going to move.', hit: ['flaps into you', 'squeaks really loudly', 'nibbles your ear'], miss: ['buffers...', 'spins in a circle', 'pauses for no reason'], die: 'spins faster and faster and then flies off. Buffering complete!', drops: [['crystal', 0.15]], re: 40 });
M('goblin', 'a lag goblin', 'goblin lag', 8, 56, [3, 8], 90, [5, 14], { here: 'A lag goblin is standing completely still, frozen halfway through a sneeze.', desc: 'A green goblin with a big nose who moves in little jerks, like a video on a slow modem. Every so often he skips ahead.', hit: ['suddenly teleports next to you and bonks you', 'pokes you (two seconds late)', 'swings his club in slow motion... THEN FAST'], miss: ['freezes mid-swing', '...is... still... loading...', 'stutters'], die: 'freezes, jerks about, and then vanishes completely. Connection lost!', drops: [['gear', 0.3], ['chip', 0.1]], re: 45, aggro: 1, aggroMsg: '...unfreezes all at once and charges at you!' });
M('crystalcrab', 'a crystal crab', 'crab crystal', 8, 60, [3, 8], 95, [4, 12], { here: 'A crystal crab clinks across the floor, its shell glittering.', desc: 'A crab made of clear glowing crystal. It is beautiful and also trying to pinch you.', hit: ['pinches you with a glassy claw', 'flashes in your eyes'], die: 'shatters into sparkly pieces (it grows back later, it does that).', drops: [['crystal', 0.6]], re: 45 });
M('golem', 'a rock golem', 'golem rock', 9, 80, [4, 9], 120, [5, 15], { here: 'A rock golem grinds along, gravel trickling off its shoulders.', desc: 'A big lump of rock with moss for hair. It is very slow and very strong.', hit: ['punches you with a rocky fist', 'sits on you (ow)', 'throws a pebble at you'], die: 'crumbles into a heap of rocks. It looks quite peaceful, actually.', re: 60 });
M('buffer', 'the Great Buffer Beast', 'buffer beast great', 11, 290, [7, 14], 650, [60, 120], { here: 'THE GREAT BUFFER BEAST fills the cave, a huge spinning hourglass-shaped monster with a loading bar for a mouth!', desc: 'It is enormous, it spins, and everything near it goes... very... slow. It is why all the magic in the realm takes ages to load.', hit: ['spins into you', 'chomps you with its loading-bar mouth', 'drops a pile of sand on you'], miss: ['buffers', 'pauses dramatically'], die: 'reaches 100%! It gives a mighty BEEP and collapses into a pile of sand, leaving something shiny behind!', drops: [['hourglass', 1]], boss: 1, re: 300, secret: 'md.buffer', aggro: 1, aggroMsg: 'stops spinning... and turns to face you. LOADING YOU...',
  special: { p: 0.25, fn(api, m, L) { api.hitAll(m, L, 6, '{C}The Buffer Beast BUFFERS at everyone! Everything goes... s l o w... and a pile of sand lands on your head!{x} {D}(6){x}'); } } });
// mountain
M('sprite', 'a snow sprite', 'sprite snow', 10, 70, [4, 9], 130, [5, 14], { here: 'A snow sprite whirls about in a flurry of snowflakes.', desc: 'A little frosty fairy with icicle wings. Throws snowballs. Very accurate.', hit: ['throws a snowball right in your face', 'puts snow down your neck', 'freezes your nose'], die: 'giggles and melts into a puff of snowflakes.', re: 40, wander: 1 });
M('wolf', 'a frost wolf', 'wolf frost', 11, 84, [5, 10], 150, [6, 16], { here: 'A frost wolf with silver-blue fur is watching you.', desc: "Big, fluffy and with an icy blue stare. Its breath makes little clouds. It's more of a big dog, really.", hit: ['nips you', 'knocks you into a snowdrift', 'howls so loud your ears ring'], die: 'yelps and bounds off over the snow.', re: 45, wander: 1 });
M('armour', 'an empty suit of armour', 'armour suit empty', 12, 96, [5, 11], 170, [8, 20], { here: 'An empty suit of armour clanks about, guarding nothing in particular.', desc: 'There is nobody inside it. You checked. It still walks around. Spooky (but polite).', hit: ['clonks you with a gauntlet', 'swings a rusty sword at you', 'stamps on your foot with an iron boot'], die: 'falls apart into a clattering heap. The helmet rolls away going "clonk, clonk, clonk".', drops: [['gear', 0.3]], re: 50 });
M('gargoyle', 'a stone gargoyle', 'gargoyle stone', 13, 110, [6, 12], 200, [10, 24], { here: 'A stone gargoyle on the wall turns its head to look at you. Creepy.', desc: 'A stone monster with bat wings and a tongue sticking out. It was carved to keep birds off the roof. It has taken the job far too seriously.', hit: ['swoops down and scratches you', 'sticks its tongue out (that\'s it, but it hurts your feelings)', 'flaps stone wings at you'], die: 'freezes back into a statue. It will wake up again later.', re: 55 });
// space + moon
M('tomato', 'an angry space tomato', 'tomato angry space', 10, 64, [4, 9], 125, [4, 12], { here: 'An angry space tomato is floating about, red in the face.', desc: 'Grown too big in zero gravity, and VERY cross about it. It has little leafy arms.', hit: ['splats into your face', 'squirts tomato juice in your eye', 'bounces off your head'], die: 'goes SPLAT! and leaves a perfectly good normal tomato behind.', drops: [['spacetomato', 0.6]], re: 35, wander: 1 });
M('meteorite', 'a meteorite gremlin', 'gremlin meteorite', 12, 90, [5, 11], 170, [8, 18], { here: 'A meteorite gremlin is clinging to the station, trying to unscrew bits off it!', desc: 'A rocky little creature with a big grin and a tiny screwdriver. It has already pinched three bolts.', hit: ['bonks you with a space rock', 'unscrews your helmet a bit (EEK)', 'throws a bolt at you'], die: 'loses its grip and floats off into space, waving.', drops: [['gear', 0.5], ['chip', 0.2]], re: 45 });
M('mite', 'a cheese mite', 'mite cheese', 12, 80, [5, 10], 160, [6, 16], { here: 'A cheese mite the size of a dog is munching through the moon.', desc: 'A round, hairy bug with jaws like a hole punch. It is eating the moon. Somebody should stop it.', hit: ['nibbles you', 'burps cheese at you', 'rolls over your feet'], die: 'pops like a balloon and floats away into space.', drops: [['mooncheese', 0.5]], re: 40, wander: 1 });
M('zorb', 'a zorb', 'zorb alien fuzzy', 13, 104, [5, 12], 200, [10, 22], { here: 'A zorb (a purple fuzzy alien with one big eye) is bouncing about on the moon dust.', desc: 'It looks like a giant purple pom-pom with one enormous eye. It says "ZORB!" a lot. It might be friendly. It is not.', hit: ['bounces on your head', 'shouts "ZORB!" right in your face', 'zaps you with its antennae'], die: 'says "zorb..." in a small voice and bounces off towards the stars.', drops: [['stardust', 0.3]], re: 45 });
M('muncher', 'the Asteroid Muncher', 'muncher asteroid', 16, 390, [9, 17], 1200, [100, 180], { here: 'THE ASTEROID MUNCHER sits in the pit, a huge rocky worm with a mouth like a cement mixer, chewing on the moon!', desc: 'Long, grey, lumpy and always hungry. It has eaten three asteroids, a satellite and most of a crater. It burps moon dust.', hit: ['chomps you', 'whips you with its tail', 'burps a cloud of moon dust at you'], miss: ['chews thoughtfully', 'gets distracted by some cheese'], die: 'lets out an ENORMOUS burp, rolls over, and wriggles off into the deep dark of space, never to return! (Probably.)', drops: [['stardust', 1]], boss: 1, re: 400, secret: 'md.muncher', aggro: 1, aggroMsg: 'smells you, and wriggles round with its mouth WIDE open!',
  special: { p: 0.2, fn(api, m, L) { api.hitAll(m, L, 8, '{R}The Asteroid Muncher spits a shower of moon rocks at everyone!{x} {D}(8){x}'); } } });
// the old server room
M('bitbug', 'a bit bug', 'bug bit', 14, 110, [6, 12], 230, [10, 24], { here: 'A bit bug flickers between a 1 and a 0, buzzing.', desc: 'A beetle made of glowing green numbers. It eats data. Your homework is not safe.', hit: ['bites you (BYTES you, it would say)', 'flips you upside down for a second', 'zaps you with static'], die: 'flickers to 0 and disappears.', drops: [['chip', 0.3]], re: 40, wander: 1 });
M('spreadsheet', 'a runaway spreadsheet', 'spreadsheet runaway', 14, 120, [6, 13], 240, [10, 26], { here: 'A runaway spreadsheet is stomping about, its cells flashing #VALUE!', desc: 'A huge grid of numbers on two stumpy legs. It is doing sums AT you.', hit: ['hits you with a pie chart', 'divides you by zero (ow!)', 'pokes you with a bar chart'], die: 'crashes with an error message and shuts down.', drops: [['chip', 0.3]], re: 40 });
M('glitch', 'a glitch sprite', 'glitch sprite', 15, 130, [7, 14], 270, [12, 28], { here: 'A glitch sprite judders about, made of the wrong colours.', desc: 'It looks like a crashed video game character: half its body is in the wrong place and it is the colour of a bruise.', hit: ['glitches into you', 'scrambles your hair', 'teleports behind you and bonks you'], die: 'freezes, goes all stripy, and blinks out of existence.', drops: [['chip', 0.4], ['stardust', 0.1]], re: 45 });
M('cursor', 'a corrupted cursor', 'cursor corrupted', 16, 140, [7, 15], 300, [12, 30], { here: 'A giant corrupted cursor floats in the air, leaving a trail of copies of itself.', desc: 'A huge arrow pointer, the kind on every computer screen, but it has gone wrong. It is clicking on things that should not be clicked.', hit: ['clicks on you', 'double-clicks on you (twice as rude)', 'drags you across the floor'], die: 'stops leaving trails and fades to a little dot.', re: 45 });
M('y2kbug', 'THE MILLENNIUM BUG', 'bug millennium y2k', 18, 620, [10, 20], 2600, [200, 300], { here: 'THE MILLENNIUM BUG crouches over the Mainframe, a gigantic beetle covered in flashing clock digits all showing 00:00!', desc: 'It is enormous, metallic and it ticks. It wants to make every clock in the world think it is 1900. Its six legs end in little calendar pages.', hit: ['sets your watch to 1900 (you feel ancient)', 'bites you with its digital jaws', 'kicks you with a calendar leg', 'rewinds you a few seconds (ow, twice)'], miss: ['gets confused about what year it is', 'counts down from ten and forgets what comes next'], die: 'counts down... 3... 2... 1... and EXPLODES into a shower of harmless confetti and party poppers! Every clock in Baudby ticks forward happily. The year 2000 is SAVED!', boss: 1, re: 600, secret: 'md.y2k', aggro: 1, aggroMsg: 'turns its clock-face eyes on you. "YOU ARE NOT COMPLIANT," it buzzes.',
  special: { p: 0.25, fn(api, m, L) { for (const Q of L) { api.out(Q, '{R}The Millennium Bug buzzes "19... 19... 1900!" Your brain goes fuzzy and you lose track of what year it is!{x} {D}(10){x}'); api.hurt(Q, 10); } } } });
M('tickbot', 'a tick-tock robot', 'robot tick tock tickbot', 13, 100, [6, 12], 210, [8, 20], { here: 'A tick-tock robot marches up and down, ticking loudly.', desc: 'A wind-up robot with a big key in its back and a clock for a face.', hit: ['clonks you with a metal arm', 'ticks REALLY loudly in your ear', 'stamps on your toe'], die: 'runs down with a sad "tick... tock... tick..." and stops.', drops: [['gear', 0.5]], re: 40 });

// ---------------------------------------------------------------- socials: [verb, alone, aloneRoom, target, targetRoom, toVictim]
const SOCIALS = [
  ['smile', 'You smile happily.', '$n smiles happily.', 'You smile at $N.', '$n smiles at $N.', '$n smiles at you.'],
  ['grin', 'You grin like a Cheshire cat.', '$n grins from ear to ear.', 'You grin at $N.', '$n grins at $N.', '$n grins at you.'],
  ['wave', 'You wave.', '$n waves.', 'You wave at $N.', '$n waves at $N.', '$n waves at you.'],
  ['bow', 'You bow deeply.', '$n bows deeply.', 'You bow to $N.', '$n bows to $N.', '$n bows to you.'],
  ['dance', 'You do the robot. You are very good at the robot.', '$n does the robot. They are very good at it.', 'You grab $N and dance about.', '$n dances about with $N.', '$n grabs you and dances about!'],
  ['hug', 'You hug yourself. Aww.', '$n hugs themselves.', 'You give $N a big hug.', '$n gives $N a big hug.', '$n gives you a big hug!'],
  ['laugh', 'You laugh out loud. LOL!', '$n laughs out loud.', 'You laugh at $N.', '$n laughs at $N.', '$n laughs at you.'],
  ['lol', 'You LOL. Out loud. Like a real person.', '$n laughs out loud.', 'You laugh at $N.', '$n laughs at $N.', '$n laughs at you.'],
  ['cheer', 'You cheer! WOOO!', '$n cheers! WOOO!', 'You cheer for $N!', '$n cheers for $N!', '$n cheers for you!'],
  ['clap', 'You clap your hands.', '$n claps.', 'You clap for $N.', '$n claps for $N.', '$n claps for you.'],
  ['cry', 'Waaaah! You burst into tears.', '$n bursts into tears.', 'You cry on $N\'s shoulder.', '$n cries on $N\'s shoulder.', '$n cries on your shoulder.'],
  ['shrug', 'You shrug.', '$n shrugs.', 'You shrug at $N.', '$n shrugs at $N.', '$n shrugs at you.'],
  ['wink', 'You wink.', '$n winks.', 'You wink at $N.', '$n winks at $N.', '$n winks at you.'],
  ['nod', 'You nod.', '$n nods.', 'You nod at $N.', '$n nods at $N.', '$n nods at you.'],
  ['poke', 'You poke the air. Poke.', '$n pokes the air.', 'You poke $N. Poke!', '$n pokes $N.', '$n pokes you. Poke!'],
  ['giggle', 'You giggle.', '$n giggles.', 'You giggle at $N.', '$n giggles at $N.', '$n giggles at you.'],
  ['highfive', 'You high-five the air. Lonely.', '$n high-fives nobody.', 'You high-five $N! SLAP!', '$n high-fives $N!', '$n high-fives you! SLAP!'],
  ['thumbsup', 'You give a big thumbs up.', '$n gives a big thumbs up.', 'You give $N a thumbs up.', '$n gives $N a thumbs up.', '$n gives you a thumbs up.'],
  ['facepalm', 'You facepalm. Doh!', '$n facepalms.', 'You facepalm at $N.', '$n facepalms at $N.', '$n facepalms at you.'],
  ['yawn', 'You yawn. Is it bedtime?', '$n yawns.', 'You yawn at $N.', '$n yawns at $N.', '$n yawns at you. Rude.'],
  ['sneeze', 'AH-CHOO!', '$n sneezes. AH-CHOO!', 'You sneeze on $N. Gross!', '$n sneezes all over $N!', '$n sneezes all over you! Gross!'],
  ['bounce', 'You bounce around like a Tigger.', '$n bounces around.', 'You bounce around $N.', '$n bounces around $N.', '$n bounces around you.'],
  ['flex', 'You flex your muscles. Impressive!', '$n flexes their muscles.', 'You flex at $N.', '$n flexes at $N.', '$n flexes at you.'],
  ['brb', 'You say you\'ll be right back (Mom needs the phone).', '$n will be right back.', 'You tell $N you\'ll be right back.', '$n tells $N they\'ll be right back.', '$n says they\'ll be right back.'],
  ['afk', 'You go AFK (away from keyboard).', '$n is AFK.', 'You tell $N you\'re going AFK.', '$n tells $N they\'re AFK.', '$n is going AFK.'],
  ['thank', 'You say thanks!', '$n says thanks!', 'You thank $N.', '$n thanks $N.', '$n thanks you.'],
  ['roflmao', 'You roll on the floor laughing.', '$n rolls on the floor laughing.', 'You roll on the floor laughing at $N.', '$n rolls on the floor laughing at $N.', '$n rolls on the floor laughing at you.'],
  ['tickle', 'You tickle yourself. It doesn\'t work.', '$n tries to tickle themselves.', 'You tickle $N!', '$n tickles $N!', '$n tickles you! Hee hee!'],
  ['salute', 'You salute.', '$n salutes.', 'You salute $N.', '$n salutes $N.', '$n salutes you.'],
  ['ponder', 'You ponder the meaning of life. 42?', '$n ponders.', 'You ponder $N.', '$n ponders $N.', '$n ponders you.'],
  ['waaagh', 'You yell WAAAGH! like a little green warrior.', '$n yells WAAAGH!', 'You yell WAAAGH! at $N.', '$n yells WAAAGH! at $N.', '$n yells WAAAGH! at you.'],
];
// verbs that only do something in certain rooms (the room's ACT says what)
const VERBS = ['climb', 'dig', 'pull', 'push', 'press', 'open', 'knock', 'ring', 'swim', 'jump', 'play', 'guess', 'board', 'launch', 'pray', 'wish', 'enter', 'pay', 'sail', 'feed', 'pet', 'stroke', 'listen', 'smell', 'sit', 'drink', 'type', 'shuttle', 'fish', 'answer', 'post', 'sign', 'write', 'wake', 'unlock'];
const VERBMISS = { climb: 'There is nothing here to climb.', dig: 'You dig a little hole with your hands. Nothing. You fill it back in.', swim: 'There is nowhere to swim here.', jump: 'You jump up and down. Wheee.', pray: 'You say a little prayer. You feel slightly better about your maths test.', wish: 'You make a wish. Nothing happens. (Yet.)', listen: 'You listen carefully. Somewhere, a modem is dialling.', smell: 'It smells normal. Mostly.', play: 'There is nothing to play here.', pet: 'There is nothing here to pet.', stroke: 'There is nothing here to stroke.', type: 'There is no keyboard here.', knock: 'Knock knock. Nobody answers.', ring: 'There is nothing here to ring.', open: 'There is nothing here to open.', push: 'You push. Nothing moves.', pull: 'You pull. Nothing moves.', press: 'There are no buttons here.' };

// ---------------------------------------------------------------- help
const HELP = {
  index: [
    '{C}GETTING ABOUT{x}  {W}N S E W U D{x} to walk, {W}LOOK{x}, {W}EXITS{x}, {W}MAP{x}, {W}RECALL{x}, {W}AREAS{x}',
    '{C}YOUR STUFF{x}     {W}INV{x}, {W}EQ{x}, {W}GET{x}, {W}DROP{x}, {W}WEAR{x}, {W}WIELD{x}, {W}EAT{x}, {W}DRINK{x}',
    '{C}FIGHTING{x}       {W}KILL{x} thing, {W}CONSIDER{x}, {W}FLEE{x}, {W}SKILLS{x}, {W}REST{x}',
    '{C}PEOPLE{x}         {W}TALK{x} person, {W}ASK{x} person {D}ABOUT{x} thing, {W}QUESTS{x}',
    '{C}SHOPS & BANK{x}   {W}LIST{x}, {W}BUY{x}, {W}SELL{x}, {W}DEPOSIT{x}, {W}WITHDRAW{x}, {W}EXCHANGE{x}',
    '{C}CHAT{x}           {W}SAY{x}, {W}SHOUT{x}, {W}TELL{x} name, {W}EMOTE{x}, {W}SOCIALS{x}, {W}WHO{x}',
    '{C}FRIENDS{x}        {W}PARTY INVITE{x} name, {W}PARTY JOIN{x}, {W}PS{x} message, {W}FOLLOW{x}',
    '{C}YOU{x}            {W}SCORE{x}, {W}TITLE{x}, {W}TIME{x}, {W}COLOUR{x}, {W}BRIEF{x}, {W}TIPS{x}, {W}QUIT{x}',
    '',
    '{D}More: {W}HELP NEWBIE{D}  {W}HELP CLASSES{D}  {W}HELP RUPEES{D}  {W}HELP RULES{x}',
  ],
  indexFoot: '{D}Short words work too: {W}L{D} = look, {W}I{D} = inventory, {W}K{D} = kill, {W}Q{D} = quests, {W}\'{D} = say, {W}!{D} = do that again.{x}',
  'newbie,start,new,begin,beginner,stuck,lost': `{Y}NEW TO JACKMUD? READ THIS!{x}
  JackMUD is a game made of words. You read what's around you and type what you want to do.
  {W}1.{x} Type {W}LOOK{x} (or just {W}L{x}) to see where you are.
  {W}2.{x} Walk with {W}N{x}, {W}S{x}, {W}E{x}, {W}W{x} (north, south, east, west) and {W}U{x}/{W}D{x} (up, down).
     The {G}Exits:{x} line tells you which ways you can go.
  {W}3.{x} {Y}Yellow{x} things are people. {W}TALK{x} to them: they give you {W}QUESTS{x}.
  {W}4.{x} {R}Red{x} things are monsters. {W}CONSIDER{x} them, then {W}KILL{x} them for gold and XP.
  {W}5.{x} Low on HP (the green number in your prompt)? {W}REST{x}, or {W}DRINK FIZZ{x}.
  {W}6.{x} Lost? {W}MAP{x} shows where you've been. {W}RECALL{x} zaps you back to Market Square.
  The Adventurers' Academy (where you start) teaches you everything. Follow the quest!`,
  'moving,move,walk,directions,go,exits,north,south': `{Y}MOVING ABOUT{x}
  {W}NORTH SOUTH EAST WEST UP DOWN{x}, or just {W}N S E W U D{x}.
  {W}EXITS{x} lists the ways out and where they go.
  {W}MAP{x} draws a little map of the area ({Y}@{x} is you).
  {W}RECALL{x} takes you home to Market Square (not in a fight!).
  {W}FOLLOW{x} name makes you follow a friend around.
  Some ways are hidden! Try {W}SEARCH{x} in places that look interesting.`,
  'looking,look,examine,read': `{Y}LOOKING{x}
  {W}LOOK{x} shows the room. {W}LOOK{x} thing (or {W}EXAMINE{x}) looks closely at something.
  Lots of rooms have hidden details: if a description mentions a fountain, try {W}LOOK FOUNTAIN{x}.
  {W}READ{x} sign / letter / book reads things.  {W}BRIEF{x} turns long descriptions off and on.`,
  'fighting,fight,combat,kill,attack,flee,monsters': `{Y}FIGHTING{x}
  {W}CONSIDER{x} monster tells you if it's a good idea. {W}KILL{x} monster starts a fight.
  Fights happen by themselves, a round every couple of seconds. Your prompt shows the
  monster's health in {R}red{x}. Use your class {W}SKILLS{x} to win faster.
  {W}FLEE{x} runs away if it's going badly. Drink {W}FIZZ{x} pop to heal mid-fight.
  Beaten monsters give experience ({M}XP{x}) and {Y}gold{x}, and sometimes drop things ({W}GET{x} them).
  Nobody dies in JackMUD: if your HP runs out you {W}faint{x} (HELP FAINTING).
  You can't fight other players. We're all friends here.`,
  'fainting,faint,death,die,dead': `{Y}FAINTING{x}
  If your HP hits zero you faint! A friendly owl carries you to the Temple of Saint Reboot,
  where you wake up with half your HP. You drop about a tenth of the gold in your pockets
  on the way (gold in the BANK is safe!). That's all. No biggie. Dust yourself off.`,
  'items,inventory,inv,get,drop,wear,wield,equipment,eq,stuff': `{Y}YOUR STUFF{x}
  {W}INV{x} (or {W}I{x}) lists what you're carrying. {W}EQ{x} shows what you're wearing.
  {W}GET{x} thing / {W}GET ALL{x}  {W}DROP{x} thing  {W}GIVE{x} thing person  {W}GIVE 10 GOLD{x} person
  {W}WIELD{x} sword  {W}WEAR{x} helmet  {W}WEAR ALL{x}  {W}REMOVE{x} helmet
  {W}EAT{x} / {W}DRINK{x} things to heal. You can carry 24 things.`,
  'shops,shop,buy,sell,list,money,gold': `{Y}SHOPS AND MONEY{x}
  Baudby's shops are round Market Square. In a shop: {W}LIST{x} shows what's for sale,
  {W}BUY{x} thing (or {W}BUY 3 FIZZ{x}), {W}SELL{x} thing, {W}SELL ALL{x} (sells junk and treasure), {W}VALUE{x} thing.
  You earn {Y}gold{x} from monsters, quests and selling junk.
  Keep it in the {W}BANK{x} (east of the square): {W}DEPOSIT 100{x}, {W}WITHDRAW 100{x}, {W}BALANCE{x}.`,
  'rupees,rupee,exchange,jacknet': `{Y}RUPEES{x}
  Rupees are JackNet's money: the same Rupees as everywhere else on the PC.
  JackNet members get a few Rupees for finishing {W}quests{x} (3 quests a day pay out)
  and for beating a big {W}boss{x} (once a day). At the Baudby Bank you can {W}EXCHANGE{x}
  gold for Rupees (5 a day) or Rupees for gold. Guests can play but don't get Rupees.`,
  'quests,quest,journal,q': `{Y}QUESTS{x}
  People all over JackMUD need help. {W}TALK{x} to them and they'll give you a quest.
  {W}QUESTS{x} (or {W}Q{x}) shows your journal: what you're doing and what to do next.
  Quests give lots of XP, gold, great items and titles. There are lots to find!`,
  'talk,ask,people,npc,npcs': `{Y}TALKING TO PEOPLE{x}
  {W}TALK{x} person: say hello (and maybe get a quest).
  {W}ASK{x} person {W}ABOUT{x} thing: ask about something. They tell you what they know about.
  Example: {W}TALK PING{x}, then {W}ASK PING ABOUT TEMPLE{x}.`,
  'chat,say,shout,tell,emote,socials,talking': `{Y}CHATTING WITH OTHER PLAYERS{x}
  {W}SAY{x} hello  (or {W}'hello{x}) - everyone in the room hears.
  {W}SHOUT{x} hello - everyone playing hears.
  {W}TELL{x} name hello - just them. {W}REPLY{x} answers the last tell.
  {W}EMOTE{x} does a cartwheel - shows "YourName does a cartwheel".
  {W}SOCIALS{x} lists ready-made ones: {W}WAVE{x}, {W}DANCE{x}, {W}HUG DAVE{x}, {W}HIGHFIVE{x}...
  {W}WHO{x} lists everyone playing. Be nice! (HELP RULES)`,
  'party,group,team,friends': `{Y}PARTIES{x}
  Adventure with friends! {W}PARTY INVITE{x} name, then they type {W}PARTY JOIN{x}.
  In a party you share experience and gold from fights in the same room, and Bards' songs
  heal everyone. {W}PS{x} message talks to your party wherever they are.
  {W}PARTY{x} shows everyone's health. {W}PARTY LEAVE{x} leaves. Up to 6 in a party.
  {W}FOLLOW{x} name to follow the leader around.`,
  'classes,class,knight,wizard,ranger,bard,skills': `{Y}THE FOUR CLASSES{x}
  {C}Knight{x}  - lots of HP and armour. {W}BASH{x} (lv1), {W}GUARD{x} (lv5).
  {M}Wizard{x}  - fragile but powerful. {W}ZAP{x} never misses (lv1), {W}FROST{x} freezes (lv5).
  {G}Ranger{x}  - all-rounder. {W}SHOOT{x} (lv1), {W}VOLLEY{x} three arrows (lv5).
  {Y}Bard{x}    - support. {W}SING{x} heals your party (lv1), {W}LULLABY{x} sends monsters to sleep (lv5).
  Type {W}SKILLS{x} to see yours. Skills use MP: {W}REST{x} or drink tea to get it back.`,
  'map': `{Y}THE MAP{x}
  {W}MAP{x} draws the area you're in, but only the rooms you've been to.
  {Y}[@]{x} is you, {Y}!{x} means someone to talk to, {G}^ v %{x} mean stairs up, down, or both.`,
  'rules,rule,nice,swearing': `{Y}THE RULES (by Jack){x}
  1. Be nice. Help newbies. We were all newbies once.
  2. No swearing. The word filter will catch you anyway, and my Mom reads the logs.
  3. Never tell anyone your real address, phone number or school. Not even a little bit.
  4. Don't spam SHOUT. People are trying to have a quiet adventure.
  5. If somebody is being horrible, tell a grown-up and stop playing with them.
  6. No running in the corridors. (That one's from school but it seemed sensible.)`,
  'telnet,connect,quit,logout,disconnect,phone,modem': `{Y}CONNECTING AND QUITTING{x}
  You can play JackMUD three ways: the {W}Telnet{x} program (Start > Programs > Accessories >
  Communications), {W}MS-DOS{x} (type {W}telnet mud.jacknet.jnet 4000{x}), or the web client at
  {W}www.jackmud.jnet{x}. Type {W}QUIT{x} to leave: members are saved automatically.
  (If Mom needs the phone, QUIT nicely. If the line drops, your character waits a couple of minutes for you.)`,
  'settings,colour,color,brief,tips,prompt': `{Y}SETTINGS{x}
  {W}COLOUR{x} on/off  -  {W}BRIEF{x} on/off (short room descriptions)  -  {W}TIPS{x} on/off
  Your prompt shows {G}HP{x}, {C}MP{x} and how far you are to the next level ({M}%xp{x}).`,
  'credits,jack,about,who made': `{Y}CREDITS{x}
  JackMUD was built by {W}Jack{x} (the Implementor), on a very tired 486, in loads of evenings
  that should have been homework. Area ideas from {W}Dave{x} (the sewers were his idea, of course),
  {W}Callum{x} (the server room), {W}Luke{x} (the arcade) and {W}JackK{x} (the whole Isle of Spam).
  Inspired by every MUD we've ever played at 2p a minute. Thanks for playing! :)`,
};

// ---------------------------------------------------------------- the banner (and a skinny one for 40-column screens)
const BANNER = `
{Y}     ██╗ █████╗  ██████╗██╗  ██╗{R}███╗   ███╗██╗   ██╗██████╗ {x}
{Y}     ██║██╔══██╗██╔════╝██║ ██╔╝{R}████╗ ████║██║   ██║██╔══██╗{x}
{y}     ██║███████║██║     █████╔╝ {r}██╔████╔██║██║   ██║██║  ██║{x}
{y}██   ██║██╔══██║██║     ██╔═██╗ {r}██║╚██╔╝██║██║   ██║██║  ██║{x}
{y}╚█████╔╝██║  ██║╚██████╗██║  ██╗{r}██║ ╚═╝ ██║╚██████╔╝██████╔╝{x}
{D} ╚════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═════╝ {x}
{C}        ~*~  Swords, Sorcery and Slow Modems  ~*~{x}
{D}   ─────────────────────────────────────────────────────────{x}
{W}     Over 130 rooms   *   20 quests   *   4 classes   *   1 Bug{x}
{D}   ─────────────────────────────────────────────────────────{x}`;
const BANNER_SMALL = `
{Y} ╦╔═╗╔═╗╦╔═{R}╔╦╗╦ ╦╔╦╗{x}
{y} ║╠═╣║  ╠╩╗{r}║║║║ ║ ║║{x}
{y}╚╝╩ ╩╚═╝╩ ╩{r}╩ ╩╚═╝═╩╝{x}
{C} Swords, Sorcery and{x}
{C}     Slow Modems{x}`;
const NEWS = `{C}═══ JACKMUD NEWS ═══{x}
{W}12/12/98{x} The Old Server Room under the Clock Tower is OPEN. Old Tom has the key. Good luck.
         Callum designed it, so it is very hard. Sorry.
{W}28/11/98{x} Space! Orbital Station 99 and The Moon are in. Go and see Dr Countdown at the
         Rocket Range. Swot up on your space facts first.
{W}14/11/98{x} The Isle of Spam (JackK's area) is finished! Ships leave the docks whenever you want.
{W}01/11/98{x} Fixed the bug where geese could follow you into the bank. (Sorry, Mr Penny.)
{W}24/10/98{x} Bards added! SING heals your party. LULLABY is hilarious.
{W}10/10/98{x} JACKMUD IS OPEN! Telnet to mud.jacknet.jnet port 4000. Tell your mates!
{D}Ideas and bug reports to Jack. Please don't ring the house, Mom gets cross.{x}`;
const TIPS = [
  'Type {W}MAP{x} to see a map of where you have been.',
  'Lost? Type {W}RECALL{x} to zap back to Market Square.',
  'Type {W}QUESTS{x} to see what you are meant to be doing next.',
  'Yellow writing is a person. {W}TALK{x} to them!',
  '{W}CONSIDER{x} a monster before you fight it, to see if it is too tough.',
  'Low on HP? {W}REST{x} makes you heal three times faster.',
  'Sell your junk at any shop: {W}SELL ALL{x} sells junk and treasure in one go.',
  'Put your gold in the bank. If you faint, you drop some of what is in your pockets!',
  "Every class has special {W}SKILLS{x}. Type SKILLS to see yours.",
  'Playing with a friend? {W}PARTY INVITE{x} them and share the XP.',
  "Type {W}AREAS{x} to see which places are right for your level.",
  'Rooms have hidden details. If a description mentions something, try {W}LOOK{x} at it.',
  'Press the {W}Up arrow{x} to repeat what you typed before. Or type {W}!{x}',
];
const SKY = {
  dawn: ['The sky is going pink. Somewhere a cockerel is being very loud about it.', 'Early morning mist hangs about, waiting for the sun.'],
  day: ['The sun is out.', 'Fluffy white clouds drift overhead.', 'It is a nice day, for once.', 'A light drizzle falls. Typical.'],
  dusk: ['The sky is going orange and purple.', 'The lamplighter is out, lighting the street lamps.'],
  night: ['Stars twinkle overhead.', 'The moon is up. It looks a bit cheesy.', 'It is dark. Somewhere an owl hoots.'],
};

// ---------------------------------------------------------------- rooms: a little text format (see md-rooms.js)
function parseRooms(src, ROOMS) {
  let area = 'town';
  const blocks = src.replace(/\r/g, '').split(/\n(?=#)|\n(?=!area )/);
  for (const raw of blocks) {
    const lines = raw.split('\n');
    const am = /^!area (\S+)/.exec(lines[0]);
    if (am) { area = am[1]; lines.shift(); if (!lines.some(l => l.startsWith('#'))) continue; while (lines.length && !lines[0].startsWith('#')) lines.shift(); }
    const head = /^#(\S+)\s+(.+)$/.exec(lines[0] || ''); if (!head) continue;
    const R = { id: head[1], n: head[2].trim(), area, ex: {}, hid: {}, lock: {}, npcs: [], mobs: [], items: [], x: {}, d: '' };
    const desc = [];
    for (const l of lines.slice(1)) {
      const m = /^(area|flags|exits|hid|hidmsg|lock|npcs|mobs|items|x|tip|amb|night|secret|norecall|hidsecret):\s?(.*)$/.exec(l);
      if (!m) { if (l.trim()) desc.push(l.trim()); continue; }
      const [, k, v] = m;
      if (k === 'area') R.area = v.trim();
      else if (k === 'flags') for (const f of v.split(/\s+/).filter(Boolean)) R[f] = 1;
      else if (k === 'exits' || k === 'hid') for (const p of v.split(/\s+/).filter(Boolean)) { const [d, to] = p.split('='); R[k === 'exits' ? 'ex' : 'hid'][d] = to; }
      else if (k === 'hidmsg') { const i = v.indexOf(' '); R.hidMsg = R.hidMsg || {}; R.hidMsg[v.slice(0, i)] = v.slice(i + 1); }
      else if (k === 'lock') { const [dir, rest] = [v.slice(0, v.indexOf(' ')), v.slice(v.indexOf(' ') + 1)]; const [i, msg] = rest.split('|'); R.lock[dir] = { i: i.trim(), msg: (msg || '').trim() }; }
      else if (k === 'npcs' || k === 'mobs' || k === 'items') R[k].push(...v.split(/\s+/).filter(Boolean));
      else if (k === 'x') { const i = v.indexOf(':'); R.x[v.slice(0, i).trim()] = v.slice(i + 1).trim(); }
      else if (k === 'amb') R.amb = v.split('|').map(s => s.trim());
      else if (k === 'tip' || k === 'night' || k === 'secret' || k === 'norecall' || k === 'hidsecret') R[k === 'hidsecret' ? 'hidSecret' : k] = v.trim();
    }
    R.d = desc.join(' ').replace(/\\n/g, '\n');
    for (const k in R.x) R.x[k] = R.x[k].replace(/\\n/g, '\n');
    ROOMS[R.id] = R;
  }
  return ROOMS;
}

const ROOMS = parseRooms(require('./md-rooms.js').SRC, {});
const PEOPLE = require('./md-people.js');
// check the world joins up (a broken exit is a bug: say so at start-up, but don't crash the server)
for (const id in ROOMS) {
  const R = ROOMS[id];
  for (const k of ['ex', 'hid']) for (const d in R[k]) if (!ROOMS[R[k][d]]) { console.error('md-world: room', id, 'exit', d, 'goes nowhere:', R[k][d]); delete R[k][d]; }
  for (const d in R.lock) if (!ITEMS[R.lock[d].i]) console.error('md-world: lock item missing', id, R.lock[d].i);
  R.npcs = R.npcs.filter(n => PEOPLE.NPCS[n] || (console.error('md-world: npc missing', id, n), false));
  R.mobs = R.mobs.filter(n => MOBS[n] || (console.error('md-world: mob missing', id, n), false));
  R.items = R.items.filter(n => ITEMS[n] || (console.error('md-world: item missing', id, n), false));
}
for (const q of PEOPLE.QUESTS) for (const s of q.steps) { if (s.i && !ITEMS[s.i]) console.error('md-world: quest item missing', q.id, s.i); if (s.m && !MOBS[s.m]) console.error('md-world: quest mob missing', q.id, s.m); if (s.r && !ROOMS[s.r] && !/:/.test(s.r)) console.error('md-world: quest room missing', q.id, s.r); }

module.exports = {
  AREAS, CLASSES, ITEMS, MOBS, ROOMS, NPCS: PEOPLE.NPCS, QUESTS: PEOPLE.QUESTS, ACT: PEOPLE.ACT, ART: PEOPLE.ART, ARTX: PEOPLE.ARTX, SOCIALS, VERBS, VERBMISS, HELP, BANNER, BANNER_SMALL, NEWS, TIPS, SKY,
  START: 'school.hall', TEMPLE: 'town.temple', TOWN: 'town.square',
};

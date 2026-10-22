/* md-rooms: every room in JackMUD, in a little text format that mods/md-world.js reads.
 *   #id Room Name          starts a room          !area name   sets the area for the rooms after it
 *   flags: safe out inn temple nomob nomap      exits: n=room.id s=...    hid: w=room.id (found with SEARCH)
 *   hidmsg: w What SEARCH says     lock: d item.id|message     npcs: / mobs: / items: ids
 *   x: word,word2: what LOOK WORD shows     tip: shown once     amb: ambient line | another     night: description after dark
 * Any other line is the room description. Exits must be written both ways. */
'use strict';
exports.SRC = String.raw`
!area school
#school.hall The Entrance Hall
flags: safe
You are standing in the echoing Entrance Hall of the Adventurers' Academy, where every hero in Baudby learns the ropes. The floor is black and white tiles, like a giant chessboard, and it smells of floor polish and school dinners. A big painted sign hangs over the doors. Doorways lead west and east, a library is through an arch to the north, and the Training Yard is outside to the south.
exits: n=school.library e=school.things w=school.moving s=school.yard
x: sign,painted: The sign says, in big gold letters: {Y}WELCOME, NEW ADVENTURER!{x}\n  WEST: The Room of Moving (start here!)\n  EAST: The Hall of Things\n  NORTH: The Library (and the Headmistress, upstairs)\n  SOUTH: The Training Yard\n  {D}Somebody has added in biro: "school dinners r rank"{x}
x: floor,tiles,chessboard: The tiles are black and white. You hop on just the white ones. Everybody does.
x: doors: The big front doors are open. Sunlight and the sound of the Training Yard come in.
tip: Type {W}LOOK SIGN{x} to read the sign. You can LOOK at anything in a room's description!
amb: A bell rings somewhere, and nobody moves. | You hear a squeak of trainers on the polished floor. | Somebody in a classroom drops a pencil case. Everything goes everywhere.

#school.moving The Room of Moving
flags: safe
This classroom has no desks at all: just arrows painted on the floor pointing every which way, and a big poster of a compass with N, S, E and W on it. A chalkboard on the wall has been rubbed out so many times it is grey. Professor Pixel paces up and down, tapping a pointer on his hand. The way back is east, and a small cloakroom is through a door to the west.
exits: e=school.hall w=school.cloak
npcs: pixel
x: poster,compass: A compass rose with {W}N{x} (north), {W}E{x} (east), {W}S{x} (south) and {W}W{x} (west), plus {W}U{x} (up) and {W}D{x} (down) in little boxes underneath. "Never Eat Shredded Wheat," says the caption.
x: arrows,floor: Painted arrows, all different colours. One of them goes in a circle. That's the one Dave follows.
x: chalkboard,board: Faintly you can still read: "TYPE THE DIRECTION TO WALK. N = NORTH. EXITS SHOWS THE WAY OUT. MAP SHOWS A MAP." Underneath, in small writing: "homework: walk somewhere".

#school.cloak The Cloakroom
flags: safe
Rows of pegs, every one buried under coats, PE bags and the odd lonely trainer. It smells of wet anoraks and lost packed lunches. The Lost Property box is overflowing in the corner. The only way out is back east.
exits: e=school.moving
items: scarf stick
x: pegs,coats: Duffel coats, parkas, one shell suit (purple, green and pink: very loud). A name tag on one says "IF FOUND RETURN TO DAVE (DONT OPEN THE POCKETS)".
x: box,lost,property: A cardboard box full of single gloves, broken rulers, a Eggbert with flat batteries and seventeen odd socks. The socks look like they're trying to escape.
tip: See the things lying here? Type {W}GET SCARF{x} to pick something up, or {W}GET ALL{x}.

#school.things The Hall of Things
flags: safe
A long room lined with glass cabinets full of swords, shields, hats and boots, all with little cardboard labels. Madame Inventoria, a tall lady with about forty pens in her hair bun, sits at a desk with a ledger. A cheerful tuck shop is through a hatch to the east, and the Entrance Hall is back west.
exits: w=school.hall e=school.tuck
npcs: inventoria
x: cabinets,cabinet,glass: "SWORD (WIELD IT)." "HELMET (WEAR IT)." "MYSTERY BOX (DO NOT OPEN)." Someone has opened it. It was empty.
x: ledger: Columns and columns of who borrowed what. The last entry says "DAVE - one practice sword - NOT RETURNED - AGAIN".

#school.tuck The Tuck Shop
flags: safe
A tiny shop squeezed under the stairs, with jars of sweets right up to the ceiling. Mrs Crumb leans on the counter, ready to sell you things. A handwritten sign says "TYPE LIST TO SEE WHAT WE'VE GOT". The Hall of Things is back west.
exits: w=school.things
npcs: crumb
x: jars,sweets: Cola cubes, flying saucers, sherbet lemons, fizzy laces, white mice... Fizz Pop bottles are lined up by the till like soldiers.
x: sign: "TYPE {W}LIST{x} TO SEE WHAT WE'VE GOT. TYPE {W}BUY{x} AND THE NAME TO BUY. NO TICK. NO SWAPPING TAZOS FOR SWEETS. (THIS MEANS YOU, DAVE.)"
tip: In shops, {W}LIST{x} shows the prices, {W}BUY FIZZ{x} buys a Fizz Pop, and {W}SELL{x} sells your junk.

#school.library The Library
flags: safe
Tall shelves of books lean together like gossiping grown-ups. There's a beige computer on a desk with a "PLEASE DO NOT PLAY GAMES" sign stuck on the monitor (it is playing a game). Librarian Bookworm, who is an actual worm in actual spectacles, peers at you from a pile of books. Stairs lead up to the Headmistress's study, and the Entrance Hall is back south.
exits: s=school.hall u=school.study
npcs: bookworm
x: shelves,books: "Monsters and How to Bonk Them, Volume 1." "Gold: A Beginner's Guide." "Advanced Pointing at Things." "Teach Yourself Gnomish (In 24 Hours)."
x: computer,monitor,beige: It's running a game of falling blocks. Somebody is on level 9 and the librarian is pretending not to notice.
amb: Bookworm turns a page with his whole body. | Somewhere a book falls off a shelf by itself. | The library computer goes BLEEP.

#school.study The Headmistress's Study
flags: safe
A cosy study full of tick-tocking clocks, potted plants and certificates in frames. A great oak desk takes up most of the room, with a tray marked IN and a much taller tray marked OUT. Headmistress Hexadecimal sits behind it, writing very neatly. Stairs go back down to the Library.
exits: d=school.library
npcs: headmistress
x: certificates,frames: "BEST KEPT ACADEMY 1997." "BEST KEPT ACADEMY 1998." "MOST DUMMIES BONKED IN ONE AFTERNOON: DAVE (REGRETTABLY)."
x: clocks: There are eleven clocks and they all show slightly different times. One of them is going backwards.

#school.yard The Training Yard
flags: out
A gravelly yard with white lines painted on the ground for some game nobody remembers the rules of. A training dummy called Dennis stands on a post in the middle, looking smug. Sergeant Stuffing, a huge man with a moustache like a broom, stands by with his arms folded. The Academy doors are north, and the front gates are south.
exits: n=school.hall s=school.gate
npcs: stuffing
mobs: dummy
x: lines,ground: Faded lines for hopscotch, netball and something called "British Bulldog" that Sergeant Stuffing has banned.
tip: This is where you practise fighting! Type {W}CONSIDER DUMMY{x} to size him up, then {W}KILL DUMMY{x}.

#school.gate The Academy Gates
flags: out safe
Tall wrought-iron gates with the Academy crest on top: a sword, a book and a bottle of Fizz Pop crossed together. A path leads south down Academy Lane into the town of Baudby, and the Training Yard is back north. A noticeboard is screwed to the gatepost.
exits: n=school.yard s=town.acad
x: crest: A sword (for bravery), a book (for brains) and a bottle of Fizz Pop (for emergencies).
x: noticeboard,board,notice: {W}ACADEMY NOTICES{x}\n  * Graduates! Show your diploma to the Mayor for a warm welcome.\n  * Lost: one practice sword. Ask Dave. It is always Dave.\n  * Baudby is SOUTH. Shops are round Market Square. Bank is EAST of the square.\n  * Too scared to go out? Type {W}AREAS{x} to see where's safe for your level.

!area town
#town.acad Academy Lane
flags: out safe
A cobbled lane lined with lamp posts, running from the Academy gates in the north down to North Street. The tall Clock Tower looms to the west, its great face glowing, and the red-brick Post Office is east, with a post box outside that has been painted so many times it's gone a bit lumpy.
exits: n=school.gate s=town.nst w=town.tower e=town.post
x: post box,box: Bright red. There's a little note stuck on it: "LAST POST 5:30. NO WORMS PLEASE."
x: lamp,posts: Old gas lamps. The lamplighter does them every evening with a long pole, whistling.

#town.tower The Clock Tower
flags: safe
You are at the foot of Baudby's famous Clock Tower, a tall stone tower with a clock face on every side. Its gears tick and clunk somewhere high above you. Old Tom Tick, the clockkeeper, fusses about with an oil can. A heavy iron trapdoor is set in the floor, covered in warning signs. Academy Lane is back east.
exits: e=town.acad d=y2k.stairs
lock: d ironkey|The iron trapdoor is locked tight with a massive padlock shaped like a clock. Old Tom Tick has the only key.
npcs: tom
x: trapdoor,signs,warning: "DANGER! THE OLD SERVER ROOM." "NO ENTRY WITHOUT A KEY AND A GOOD REASON." "BEWARE OF THE BUG." "SERIOUSLY. THE BUG."
x: clock,face,gears: The clock face has a little extra dial underneath the hands. It says {Y}DAYS TO THE MILLENNIUM{x}, and it is counting down.
amb: TICK. TOCK. TICK. TOCK. | The tower's bell gives a single, gloomy BONG. | Old Tom mutters, "Nineteen hundred... not on my watch."

#town.post The Post Office
flags: safe
A busy little Post Office with a polished wooden counter, a scale for weighing parcels and a rack of postcards saying "GREETINGS FROM BAUDBY!". Postmistress Pat bustles about behind the counter, stamping things with great enthusiasm. A queue of exactly nobody waits patiently. The door is west.
exits: w=town.acad
npcs: pat
x: postcards,rack: "GREETINGS FROM BAUDBY!" (a picture of the fountain). "WISH YOU WERE HERE!" (a picture of a goose). "I WENT TO THE CAVES OF LAG AND IT TOOK AGES" (a picture of a loading bar).
x: scale: You put your hand on the scale. 1lb 3oz. Pat stamps your hand. FIRST CLASS.

#town.nst North Street
flags: out safe
A busy street of tall wonky houses with window boxes. To the west, the swinging sign of the Dial-Up Inn creaks in the breeze, and the grand Town Hall stands east with its flag flying. Academy Lane goes north, and Market Square is just south.
exits: n=town.acad s=town.square w=town.inn e=town.hall
x: houses,window,boxes: Geraniums, mostly. One window box is growing what looks like a small Christmas tree in October.
x: sign,inn: A painted sign of a tankard next to a telephone. THE DIAL-UP INN. "Rooms by the hour. Lines may be busy."
amb: Somebody's modem screeches from an upstairs window: PSSHHHKKKKRRRR KAKINGKAKING. | A paperboy wobbles past on a bike, flinging newspapers. | Two old ladies are arguing about whether the year 2000 starts in 2000 or 2001.

#town.inn The Dial-Up Inn
flags: safe inn
A warm, low-ceilinged tavern full of mismatched chairs and the smell of chips. A crackling fire burns in the fireplace, and a big noticeboard covered in drawing pins is propped by the bar. Barnaby Brew, the round-faced innkeeper, polishes a glass and hums. Stairs lead up to the bedrooms, and the door to North Street is east. {D}(This is a great place to REST: you get better twice as fast here.){x}
exits: e=town.nst u=town.innup
npcs: barnaby
x: fire,fireplace: The fire crackles. Someone has hung their soggy socks to dry on the grate. You hope they're not anyone's dinner.
x: noticeboard,board,pins: {W}NOTICES{x}\n  * LOST: Polly-Gon the parrot. Green. Rude. Ask Captain Pete at the Isle of Spam (boats from the docks).\n  * WANTED: Brave souls to sort out the SOCK GREMLINS. See the Mayor.\n  * FOR SWAP: 1x Game Lad (works if you hit it), for 1x bike.\n  * BAND WANTED: we are called "The Lag Goblins". no talent required. meet at the Bards' Bandstand.\n  * BUY Fizz Pop at the bar! (Type LIST.)
tip: The Dial-Up Inn is the best place to {W}REST{x}. You can also {W}LIST{x} and {W}BUY{x} food and drink here.
amb: Barnaby hums along to the jukebox. | The fire pops and a log rolls over. | Someone at a corner table says "my mom's picking me up at six" for the third time.

#town.innup The Inn's Landing
flags: safe inn
A creaky landing with rooms off it. Each door has a number painted on it and a little brass knocker. One door is ajar, and you can see a bed with a patchwork quilt and a lumpy pillow. It is lovely and quiet up here: a perfect place for a rest. The stairs go back down.
exits: d=town.inn
x: door,doors,room: Room 4 is ajar. There's a bed, a chair and a little telly on top of a chest of drawers, showing the test card.
x: knocker: The brass knocker on Room 7 is shaped like a goose. Even the knockers in this town are scary.

#town.hall The Town Hall
flags: safe
A grand room with marble pillars, a sweeping staircase that goes nowhere (it's being fixed) and portraits of all the old mayors, who all look exactly the same. A big Quest Board stands near the door. Mayor Wobblebottom, in a chain and a VERY tall hat, paces about looking worried. North Street is back west, and East Street is through a side door to the south.
exits: w=town.nst s=town.est
npcs: mayor
x: board,quest: {W}THE BAUDBY QUEST BOARD{x}\n  * SOCKS! The town's socks are vanishing. Brave adventurers see the Mayor.\n  * Granny Byte (Whispering Woods, west) has lost her kitten.\n  * Farmer Giles (Floppy Fields, east) needs help with his geese.\n  * Postmistress Pat (Academy Lane) has a parcel that needs delivering.\n  * Old Tom Tick (Clock Tower) wants to talk to experienced heroes. VERY experienced.\n  {D}TIP: Type QUESTS to see the ones you are on.{x}
x: portraits,mayors: Mayor Wobblebottom I, Mayor Wobblebottom II, Mayor Wobblebottom III... there are eleven of them. It runs in the family. So does the hat.
x: staircase,stairs: A sign on the staircase says "CLOSED FOR REPAIRS SINCE 1994".

#town.square Market Square
flags: out safe
You are standing in the bustling heart of Baudby. Stalls with stripy awnings sell everything from turnips to floppy disks, pigeons strut about like they own the place, and in the middle a great stone fountain sprays water into the air. Streets run off in every direction: North Street, East Street (for the bank), South Street (for the shops) and West Street (for the temple). The Town Crier rings his bell on a soapbox.
exits: n=town.nst e=town.est s=town.sst w=town.wst
npcs: crier
mobs: pigeon
x: fountain,water: A stone fountain with a statue of a hero holding a sword in one hand and a floppy disk in the other. People throw coins in for luck. If you {W}WISH{x}, who knows?
x: stalls,awnings,stall: "TURNIPS - 2 FOR 1." "PRE-OWNED FLOPPY DISKS (MOSTLY WORKING)." "LUCKY PEBBLES." "GOOSE INSURANCE."
x: statue: The hero on the fountain has a slightly worried face, like he's just remembered he left the gas on.
tip: Market Square is the middle of town. If you're ever lost, type {W}RECALL{x} to come straight back here.
amb: A stallholder shouts "TURNIPS! LOVELY TURNIPS!" | A pigeon lands on the statue's head and looks very pleased with itself. | Someone drops a coin in the fountain and makes a wish out loud. It's about a Ultra 64. | A kid runs past shouting "ANYONE GOT A SPARE TAZO?"
night: Market Square is quiet now. The stalls are covered up with tarpaulins, the fountain tinkles away to itself under the gas lamps, and the pigeons are huddled on the statue. Streets lead off north, east, south and west. The Town Crier is still here, ringing his bell very softly.

#town.est East Street
flags: out safe
A wide street with posh shops: a hat shop, a clockmaker and a shop that only sells umbrellas. The grand front door of the Baudby Bank is south of here, the Town Hall's side door is north, and the town's East Gate is further east. Market Square is back west.
exits: w=town.square e=town.egate s=town.bank n=town.hall
x: hat,shop,umbrellas,clockmaker: The hat shop window has a hat with a whole stuffed goose on top. It costs 300 gold. Nobody has bought it.

#town.bank The Baudby Bank & Rupee Exchange
flags: safe
A hushed, marble bank with brass rails and little jackos. Everything echoes, so everyone whispers. Behind the main counter, Mr Abacus Penny peers at you over his half-moon spectacles. A shiny brass sign says "RUPEE EXCHANGE" next to an enormous beige computer that whirrs. East Street is north, and South Street is through the side door west.
exits: n=town.est w=town.sst e=town.row
npcs: penny
x: sign,brass,exchange: {Y}THE RUPEE EXCHANGE{x}: swap your gold for JackNet Rupees, or your Rupees for gold. Type {W}EXCHANGE{x} to see how. (Members only. Daily limits apply. Mr Penny is very strict about limits.)
x: computer,beige: A huge beige computer with a turbo button and a sticker that says "Y2K READY (PROBABLY)". The screen shows a spreadsheet and, in a little window, a game of Solitaire.
tip: Put your gold in the bank with {W}DEPOSIT 50{x} (or {W}DEPOSIT ALL{x}). If you faint, gold in the bank is safe!

#town.row Guild Row
flags: out safe
A short street of very different buildings, each with its own flag. This is where the four guilds of Baudby live. The Wizards' Tower spirals up to the south, and the street carries on east to the other guildhalls. The bank's back door is west, and the East Gate is just north.
exits: w=town.bank n=town.egate s=town.wizt e=town.row2
x: flags,flag: A purple flag with a star (Wizards), a silver flag with a shield (Knights), a green one with an arrow (Rangers) and a yellow one with a musical note (Bards).

#town.row2 Guild Row (east end)
flags: out safe
The east end of Guild Row, where the paving stones have been worn smooth by a thousand heroes' boots. The Knights' Hall is north, behind a pair of shiny shields. The Rangers' Lodge, built of logs, is south. Music drifts from the Bards' Bandstand to the east. The Wizards' end of the street is west.
exits: w=town.row n=town.knights s=town.rangers e=town.bards

#town.wizt The Wizards' Tower
flags: safe
The inside of the tower is much bigger than the outside, which wizards think is very funny. Spiral stairs wind up past shelves of bubbling bottles, star charts and a stuffed owl that blinks. Archmage Floppington, an old wizard with a beard tucked into his belt, mutters over a crystal ball. In the corner, an apprentice called Dave is trying to un-set a curtain on fire. Guild Row is back north.
exits: n=town.row
npcs: archmage dave
x: bottles,shelves: "EYE OF NEWT (ACTUALLY RAISINS)." "ESSENCE OF LAG." "DO NOT DRINK (DAVE)."
x: ball,crystal: In the crystal ball you can see a tiny spinning hourglass, like a computer that's thinking. "The Caves of Lag," mutters the Archmage. "It's getting worse."
x: curtain: It's mostly out now. Mostly.
amb: Something on a shelf goes POP and turns into a pigeon. | Dave says "I meant to do that." | The stuffed owl blinks. You're sure it blinked.

#town.knights The Knights' Hall
flags: safe
A tall stone hall hung with banners and lined with suits of armour (all empty, you hope). A long table is covered in shields being polished. Sir Reginald Clank, the guildmaster, stands to attention in very shiny armour, even though nobody asked him to. Guild Row is back south.
exits: s=town.row2
npcs: reginald
x: banners: "COURAGE." "HONOUR." "WIPE YOUR FEET."
x: armour,suits: One of them has a sticky note on its helmet: "NOT A REAL KNIGHT. DO NOT SALUTE."

#town.rangers The Rangers' Lodge
flags: safe
A cosy log cabin that smells of pine needles and campfire smoke. Bows hang on the walls, maps are pinned everywhere, and a big pot of something bubbles on the stove. Ranger Rowan sits by the fire, whittling. At a corner table, a young ranger called JackK is drawing a very detailed map of a pirate island. Guild Row is back north.
exits: n=town.row2
npcs: rowan jackk
x: maps: Maps of the Whispering Woods, the Grumbly Hills, and a sketchy one of the Isle of Spam with "HERE BE CRABS" on it.
x: pot,stove: Rowan says it's "forest stew". It is beans.

#town.bards The Bards' Bandstand
flags: out safe
A round wooden bandstand painted red and gold, with bunting all around it. Somebody has left a drum kit, a keyboard with built-in demo songs, and a cardboard sign saying "THE LAG GOBLINS - REHEARSAL". Melody Strum, the guildmistress of bards, tunes a lute and sings to herself. Guild Row is back west.
exits: w=town.row2
npcs: melody
x: keyboard: You press the DEMO button. It plays a bossa nova version of "Greensleeves" with a drum machine. It is incredible.
x: drums,drum: There's a sticker on the bass drum: "THE LAG GOBLINS: OUR NEXT GIG IS... LOADING".

#town.egate The East Gate
flags: out safe
The town's East Gate is a big stone arch with an iron portcullis pulled up out of the way. A sleepy guard leans on his spear. Beyond the arch, a dusty road runs out across Floppy Fields. East Street is back west, Guild Row is south, and the jangling sound of the Pixel Palace arcade comes from a doorway to the north.
exits: w=town.est e=fields.road s=town.row n=town.arcade
x: guard: He's asleep, standing up. A real skill.
x: portcullis: Big spikes. There's a sticker on it: "MIND YOUR HEAD".

#town.arcade The Pixel Palace
flags: safe
A dark, noisy arcade full of flashing cabinets, all bleeping and booping at once. The carpet has a pattern of planets on it and is sticky in places you don't want to think about. A big old cabinet with a glowing sign says GUESS-O-TRON. A kid called Luke is leaning on a racing game, watching the demo loop. The East Gate is back south.
exits: s=town.egate
npcs: luke
x: guess-o-tron,cabinet,machine,guessotron: A huge cabinet with a cartoon robot on the side and a slot for coins. It says: {Y}GUESS-O-TRON! I THINK OF A NUMBER, YOU GUESS IT! WIN TICKETS!{x} Type {W}PLAY{x} to start (it's free on Tuesdays and every other day too).
x: cabinets,games: A space shooter, a fighting game where everyone is a vegetable, a racing game with a real wheel, and a claw machine full of fluffy goose toys.
x: carpet: Planets. Saturn has chewing gum on it.
amb: A cabinet goes "INSERT COIN... INSERT COIN..." | Someone on the fighting game shouts "COMBO!" | The claw machine drops a fluffy goose. Nobody is surprised.

#town.sst South Street
flags: out safe
A narrow, busy street where the shops start: you can smell chips, hot metal and fresh bread all at once. The Temple of Saint Reboot is through a white door to the west, the Bank's side door is east, Market Square is north, and Harbour Road runs down towards the sea to the south.
exits: n=town.square s=town.harb w=town.temple e=town.bank
amb: A delivery cart rattles past, piled high with Fizz Pop crates. | A seagull eyes your pockets from a chimney.

#town.temple The Temple of Saint Reboot
flags: safe temple
A peaceful white temple with tall jackos that throw rainbows across the floor. Rows of comfy beds line one wall for adventurers who've had a funny turn. At the altar, a big glowing button says RESET. Sister Ping, in white robes and fluffy slippers, hums and plumps pillows. South Street is east, and West Street is through the north door.
exits: e=town.sst n=town.wst
npcs: ping
x: button,reset,altar: A big round button, softly glowing. A little plaque reads: "SAINT REBOOT, PATRON OF FRESH STARTS. WHEN ALL ELSE FAILS, TURN IT OFF AND ON AGAIN."
x: beds,pillows: Soft and cosy, with patchwork quilts. Each has a little bedside table with a glass of water and a jelly baby.
x: jackos: Stained glass pictures: a knight bonking a goose, a wizard reading a very thick manual, and a computer with a smiley face.
tip: If you ever {W}faint{x}, you'll wake up here. Sister Ping will {W}HEAL{x} you (free up to level 5).
amb: Sister Ping hums a little hymn. | A bell tinkles softly. | Somewhere a computer chimes as it starts up. Everyone looks peaceful.

#town.wst West Street
flags: out safe
A quiet street of crooked cottages with smoking chimneys. The Byte Café is north, its window steamed up and full of glowing screens. The temple's north door is south of here, and the town's West Gate leads out towards the Whispering Woods. Market Square is east.
exits: e=town.square w=town.wgate s=town.temple n=town.cafe

#town.cafe The Byte Café
flags: safe
Baudby's very first cyber café! Six chunky beige computers sit on long tables, each with a sticker saying "£2 AN HOUR". The air smells of coffee and hot dust. A kid called Callum is hunched over one of the computers, typing furiously. The menu is chalked on a board, and a poster on the back wall says ACCESS ALL AREAS. West Street is back south.
exits: s=town.wst
hid: n=den.office
hidmsg: n You notice that the poster on the back wall is slightly crooked... You lift it up, and behind it there's a little door with a sign: {Y}IMPLEMENTORS ONLY{x}. You can go north!
hidsecret: md.den
npcs: callum
x: computers,beige,screens: The screens show chat rooms, a game with tanks, and a web page about the Millennium Bug with a countdown clock. One computer just shows a blue screen and a sad message. The sign on it says "BROKEN AGAIN".
x: poster: ACCESS ALL AREAS, it says, with a picture of a key. It's hanging a bit crooked. Funny.
x: menu,board: TEA 30p. COFFEE 40p. CHIPS 80p. "A GO ON THE INTERNET" £2/HOUR. "PRINTING" 10p/PAGE. "FIXING YOUR DAD'S COMPUTER" PRICES ON REQUEST.
amb: A modem screeches as someone dials up. | Callum mutters "come ON, 3% ..." | A computer in the corner plays the start-up chime. Everyone looks round.

#town.wgate The West Gate
flags: out safe
A crumbly old gateway in the town wall, covered in ivy and the names of people who were here (DAVE WOZ ERE 98). The Whispering Woods start just to the west: you can hear them whispering. West Street is back east, a grotty Back Alley runs off to the south.
exits: e=town.wst w=woods.edge s=town.alley
x: ivy,names,wall: Carved names: "DAVE WOZ ERE 98." "LUKE 4 ULTRA 64." "CALLUM WAS HERE (ON A 56K)." "JACKK RULES THE ISLE OF SPAM."

#town.alley The Back Alley
flags: out
A narrow, smelly alley behind the shops, full of bins, crates and a cat who looks like it knows things. In the middle of the cobbles there's a round iron grate with a ladder going down into the dark. A sign says "SEWERS - KEEP OUT - (SOCKS INSIDE)". The West Gate is north, and Duck Pond Park is south.
exits: n=town.wgate s=town.park d=sewers.ladder
x: grate,ladder: A rusty ladder goes down into the sewers. Something down there smells of feet. Hundreds of feet.
x: cat: The cat stares at you. You stare at the cat. The cat wins.
x: bins: You lift a lid. Inside is an odd sock, and... another odd sock. This town has a sock problem.

#town.park Duck Pond Park
flags: out safe
A green little park with a duck pond, a bandstand-shaped bin and benches with little plaques on them. The ducks are VERY interested in you. A path leads east to the blacksmith's yard, and the Back Alley is north. A man on a bench is feeding the ducks from a big paper bag.
exits: n=town.alley e=town.smith
mobs: duck duck
items: crumbs
x: pond,water: Green and full of ducks. There's a shopping trolley in the middle. There is ALWAYS a shopping trolley.
x: benches,plaques,plaque: "IN MEMORY OF BARRY THE GOOSE, WHO BIT EVERYONE." "FOR GRANDAD, WHO LOVED THIS PARK AND HATED GEESE."
x: man,bench,bag: He says, "Bread's bad for ducks, you know. These are special duck pellets." He throws a handful and is engulfed in ducks.

#town.harb Harbour Road
flags: out safe
A steep cobbled road running down to the sea, with a strong whiff of salt and chips. Gulls wheel overhead. Sticks 'n' Swords, the blacksmith's, is west, clanging away, and Ye Olde Corner Shoppe is east, with a bell over the door. South Street is north, and the Docks are south.
exits: n=town.sst s=town.docks w=town.smith e=town.shop
amb: CLANG! CLANG! comes from the blacksmith's. | A gull steals a chip from someone's hand and they shout at the sky.

#town.smith Sticks 'n' Swords
flags: safe
A hot, clanging blacksmith's shop with swords, shields and helmets hung everywhere. A huge furnace roars at the back. Brunhilda the blacksmith, with arms like hams and a smile like sunshine, bashes a glowing sword on her anvil. A sign says "WE ALSO DO ARMOUR. AND KEYS. AND BIKES." Harbour Road is east, and Duck Pond Park is through the yard door west.
exits: e=town.harb w=town.park
npcs: brunhilda
x: sign: "STICKS 'N' SWORDS. WEAPONS, ARMOUR, KEYS CUT, BIKE CHAINS FIXED. NO GOOSE-RELATED REFUNDS."
x: furnace,anvil: So hot your eyebrows feel crispy. Brunhilda doesn't even notice.
tip: Type {W}LIST{x} to see Brunhilda's weapons and armour. Better kit makes fights MUCH easier.

#town.shop Ye Olde Corner Shoppe
flags: safe
A tiny, crammed corner shop selling absolutely everything: Fizz Pop, sweets, string, batteries, comics, honey, crackers, torches and those little plastic toys from cereal boxes. The bell over the door dings every time anybody even breathes near it. Mrs Bundle, very small and very cheerful, stands on a box behind the counter. Harbour Road is west.
exits: w=town.harb
npcs: bundle
x: comics: Comics about a dog in space, a girl who's a robot, and something called "THE BEANO" that's been read so much it's soft.
x: bell: Ding! You breathed near it.

#town.docks The Docks
flags: out safe
Wooden docks stretching out into the grey-green sea, stacked with crates and coils of rope. Gulls stand on every post. A tubby little ship called the Soggy Biscuit is tied up at the end of the pier, her gangplank down, ready to sail to the Isle of Spam (south). Harbour Road climbs back up the hill north.
exits: n=town.harb s=sea.ship
mobs: seagull
x: ship,soggy,biscuit: A round, cheerful little ship with a patched sail and a figurehead of a biscuit. A sign on the gangplank says "ISLE OF SPAM. FREE. WALK ON." Just go south to get on.
x: crates: "FIZZ POP." "MORE FIZZ POP." "BISCUITS (SOGGY)."
amb: The water slaps against the posts. | A gull lands on your head, thinks about it, and leaves. | The ship's bell clangs.

!area den
#den.office The Implementor's Den
flags: safe nomap
norecall: You can't recall from the Implementor's Den! Use the door south.
A tiny cluttered room behind the Byte Café's poster. A desk is buried under printouts, empty Fizz Pop bottles, a half-built model rocket and a beige keyboard with the letters worn off W, A, S and D. Taped to the wall is a hand-drawn map of the whole of JackMUD, covered in arrows and crossings-out. There's a note on the desk, and a mug that says WORLD'S OKAYEST CODER. The door is south.
exits: s=town.cafe
secret: md.den
x: note: {W}A note in Jack's handwriting:{x}\n  "If you're reading this, you found my secret room! Well done!! Not even Dave has found it.\n   JackMUD took me AGES to build. Most evenings after homework (and some evenings instead of homework,\n   don't tell Mom). Thanks for playing. Seriously. You're brilliant.\n   PS: The Millennium Bug can be beaten. Bring friends. And a bard.\n   PPS: Ideas for new areas go in the box. - Jack (Implementor)"
x: map,wall: The map shows every area. In the corner there's an unfinished bit labelled "ATLANTIS?? (next year!!)" and a doodle of a goose with a crown.
x: rocket,model: A half-finished model rocket. The instructions say "Step 14: Allow glue to dry overnight." The glue has been drying since August.
x: box,ideas: A shoebox labelled IDEAS. Inside: "a level made of jelly", "more geese", "LESS geese", "a quest where you do your homework (NO - Jack)".
x: printouts,desk: Pages and pages of code with notes like "WHY DOES THIS WORK" and "DO NOT TOUCH. IT WORKS. I DON'T KNOW WHY."

!area fields
#fields.road The Dusty Road
flags: out
A dusty road runs east from Baudby's East Gate between hedgerows full of blackberries and birdsong. Rolling green fields stretch away as far as you can see, dotted with sheep that look like scattered popcorn. A wooden signpost leans at the side of the road.
exits: w=town.egate e=fields.cross
x: signpost,sign: WEST: Baudby. EAST: Crossroads (for Giles' Farm, the Rocket Range and the Bunny Burrow). Someone has added: "GEESE: AVOID".
x: hedgerows,blackberries: Ripe blackberries. You eat one. Delicious. You eat another. Purple fingers.

#fields.cross The Crossroads
flags: out
Four dusty roads meet here around a battered old milestone. North, a meadow of buttercups slopes up towards the Grumbly Hills. East is Farmer Giles' farmyard, all mud and clucking. South, you can hear a babbling stream. The road back to town goes west.
exits: w=fields.road n=fields.meadow e=fields.farm s=fields.stream
x: milestone,stone: "BAUDBY 1 MILE". It has been "1 MILE" for 300 years. Nobody has checked.
amb: A tractor chugs somewhere in the distance. | Somewhere far off, a goose honks. Everyone flinches.

#fields.meadow Buttercup Meadow
flags: out
A meadow so full of buttercups it looks like someone spilled the sun. Bees bumble about, and the grass comes up to your knees. To the north the ground rises to Windy Hill. West, a scarecrow stands guard over a cabbage patch, and east there are haystacks. The Crossroads are south.
exits: s=fields.cross n=fields.hill w=fields.scarecrow e=fields.hay
mobs: crow
x: buttercups: You hold one under your chin. It glows yellow. You must like butter. (Everyone likes butter.)

#fields.scarecrow Scarecrow Corner
flags: out
A cabbage patch with a scarecrow in the middle, wearing a tweed jacket, a flat cap and a carrot nose (which crows keep stealing). The scarecrow is called Strawbert and he can talk, which surprises everyone the first time. The meadow is east.
exits: e=fields.meadow
npcs: strawbert
mobs: crow
x: cabbages: Big round cabbages. One has a bite out of it, in the shape of a very small rabbit.

#fields.hay The Haystacks
flags: out
Golden haystacks stand about like giant shredded wheat. It is very tempting to jump into one. To the south is Farmer Giles' farmyard, and the meadow is west.
exits: w=fields.meadow s=fields.farm
items: apple
x: haystacks,hay,haystack: Huge, golden and prickly. You could {W}JUMP{x} into one. Go on.

#fields.farm Giles' Farmyard
flags: out
A muddy farmyard surrounded by a red barn, a chicken coop and a tractor with a flat tyre. Hens peck about your feet. Farmer Giles, in a flat cap and the muddiest wellies in the world, leans on a gate looking fed up. To the east is the Goose Field (he keeps looking at it nervously). The haystacks are north, and the Crossroads are west.
exits: w=fields.cross n=fields.hay e=fields.goose
npcs: giles
x: barn,coop,hens: The hens are fine. Normal birds. Nice birds. Not like the geese.
x: tractor: A red tractor with a flat tyre and a sticker on the back: "MY OTHER TRACTOR IS ALSO A TRACTOR".

#fields.goose The Goose Field
flags: out
A field of short grass, churned to mud by hundreds of angry webbed feet. This is where the geese live. They are watching you. They are always watching. The farmyard is west, and an old windmill creaks away to the east.
exits: w=fields.farm e=fields.windmill
mobs: goose goose goose
x: mud,feet: Goose footprints everywhere. Some of them look like they were going somewhere in a hurry. Towards you.
amb: HONK. | HONK HONK. | A goose stares at you without blinking. HONK.

#fields.windmill The Old Windmill
flags: out
A tall white windmill with great creaking sails that turn slowly in the breeze. The door is open, and a narrow ladder leads up inside to where the millstones grind. The Goose Field is west (unfortunately).
exits: w=fields.goose u=fields.millup
mobs: mower
x: sails: Round and round. Whoosh... whoosh... You feel a bit sleepy watching them.

#fields.millup Inside the Windmill
flags: out
A dusty wooden room at the top of the windmill, white with flour. Great wooden cogs turn the millstones with a deep rumble. Through a little round window you can see the whole of Floppy Fields, Baudby's rooftops, and away to the east, a tall white rocket standing on a launch pad. The ladder goes back down.
exits: d=fields.windmill
items: sandwich
x: window: From up here you can see the Rocket Range! A white rocket with "STARHOPPER 99" painted on the side. It is east, past the orchard, across the stepping stones.
x: cogs,millstones: Big and slow and rumbly. Keep your fingers away. Keep your scarf away too.

#fields.hill Windy Hill
flags: out
A grassy hill where the wind never stops blowing. Kites have got stuck in the one bent tree at the top. From here you can see the Grumbly Hills rising up to the north, rocky and goaty. Buttercup Meadow is back south.
exits: s=fields.meadow n=hills.path
x: tree,kites: Three kites, a frisbee and somebody's homework, all stuck in the tree. The homework is about volcanoes. It got a B.

#fields.stream The Babbling Stream
flags: out
A clear little stream babbling over pebbles, under willow trees that trail their branches in the water. Little fish dart about. A row of stepping stones crosses to the east. A rabbit hole is in the bank to the south, and the Crossroads are north.
exits: n=fields.cross e=fields.stones s=fields.burrow
mobs: squirrel
x: water,stream,fish: Tiny silver fish. One of them looks at you, then pretends it didn't.
x: willow,willows: The willows dip their branches in the water like they're testing the temperature.

#fields.stones The Stepping Stones
flags: out
You wobble from stone to stone across the stream. One of them is a bit loose. The far bank is east, with apple trees beyond, and the Babbling Stream is back west.
exits: w=fields.stream e=fields.orchard
x: stone,stones,loose: The loose stone wobbles. Underneath is a crayfish who looks very annoyed.

#fields.orchard The Apple Orchard
flags: out
Rows of apple trees heavy with red and green apples, the grass between them scattered with windfalls and buzzing wasps. A line of white beehives stands to the south. To the east, past the last trees, a tall fence surrounds the Baudby Rocket Range. The stepping stones are back west.
exits: w=fields.stones s=fields.hives e=fields.range
mobs: turnip
items: apple apple
x: apples,trees: You could pick an apple. They're lying about everywhere: type {W}GET APPLE{x}.

#fields.hives The Beehives
flags: out
Five white wooden beehives hum away in a sunny corner of the orchard. The air is thick with bees and smells of honey. A little wooden sign has been nailed to a post. The orchard is back north.
exits: n=fields.orchard
mobs: bee
x: hives,beehives,hive: Buzzing like a computer with a big fan. You could probably {W}GET HONEY{x} if you're brave and the bees are busy.
x: sign: "HONEY: PLEASE TAKE ONE JAR. LEAVE THE BEES ALONE. THEY'RE HAVING A HARD WEEK. - Farmer Giles"

#fields.burrow The Bunny Burrow
flags: out
A grassy bank riddled with rabbit holes, with one hole bigger than all the others, and a tiny carved sign above it saying THE ROYAL WARREN. Fluffy tails disappear down holes the moment you look at them. The stream is north, and the big hole leads down.
exits: n=fields.stream d=fields.warren
x: sign: THE ROYAL WARREN. BY APPOINTMENT TO HIS MAJESTY KING BARTHOLOMEW THE FLUFFY. MIND YOUR HEAD.

#fields.warren The Royal Warren
flags: safe
A surprisingly large underground hall dug out of the earth, lit by glow-worms. The walls are lined with tiny portraits of rabbits in crowns. On a throne made from a hollowed-out turnip sits King Bartholomew the Fluffy, a large grey rabbit with a very small crown. Rabbit courtiers bow to you. The way out is up.
exits: u=fields.burrow
npcs: bunnyking
x: portraits: King Bartholomew I, II, III... all the way to King Bartholomew XXVII. Rabbits have a lot of kings.
x: throne,turnip: A turnip throne. It's been carved very nicely. You can see the teeth marks.

#fields.range The Baudby Rocket Range
flags: out
A flat, fenced-off field with a concrete launch pad in the middle. On the pad stands the Starhopper 99, a tall white rocket with red fins, steaming gently. A little hut with a satellite dish on the roof is Mission Control, where Dr Countdown, in a white coat and enormous glasses, checks a clipboard. The orchard is back west.
exits: w=fields.orchard
npcs: countdown
x: rocket,starhopper: STARHOPPER 99. It goes to Orbital Station 99, and from there you can get to the Moon! To get on, you'll need a {W}Launch Pass{x}. Then type {W}BOARD{x}.
x: hut,dish,mission,control: A wooden hut with a satellite dish made from a dustbin lid. Inside you can see a beige computer with a big red button stuck on top.
tip: To go to space, you need a Launch Pass from Dr Countdown. {W}TALK COUNTDOWN{x}.

!area woods
#woods.edge The Edge of the Woods
flags: out
The road from Baudby's West Gate fades into a path at the edge of the Whispering Woods. The trees are tall and old, and their leaves really do whisper: you're sure you heard one say "psst". Sunlight comes through in dusty stripes. The path goes deeper west, and the town gate is east.
exits: e=town.wgate w=woods.path1
x: trees,leaves: You listen closely. "Psst," says a leaf. "Psst. Over here. Granny Byte's cottage is south of the path." Helpful leaves.

#woods.path1 A Woodland Path
flags: out
A winding path through the woods, carpeted with crunchy leaves. To the south, a thin trail of chimney smoke rises from a cottage. To the north there's a ring of toadstools in a glade. The path continues west into the deeper woods, and the woods' edge is east.
exits: e=woods.edge w=woods.path2 s=woods.cottage n=woods.ring
mobs: squirrel
amb: A twig snaps somewhere. | The leaves whisper: "Did you hear about the troll?" | A woodpecker goes rat-a-tat-tat like a dot matrix printer.

#woods.cottage Granny Byte's Cottage
flags: safe
A tiny cottage with a thatched roof, roses round the door and a garden full of gnomes. Inside, everything is knitted: the tea cosy, the cushions, the toilet roll cover, even the cat basket (which is empty). It smells of baking. Granny Byte, a little old lady in a shawl and big glasses, rocks in her chair. The path is north.
exits: n=woods.path1
npcs: granny
x: basket,cat: An empty knitted cat basket, with a little name embroidered on it: PIXEL.
x: gnomes,garden: Gnomes fishing, gnomes reading, a gnome on a skateboard. One gnome is holding a sign that says "SHE MAKES GREAT COOKIES".
x: computer: In the corner there's a computer with a knitted cover. Granny Byte is in three chat rooms at once. She types faster than you.

#woods.ring The Fairy Ring
flags: out
A ring of red-and-white toadstools in a sunny glade, so perfect it must be magic. Tiny glowing lights drift about over the grass, and you can hear very small giggling. In the middle of the ring, a fairy no bigger than your thumb is sitting on a toadstool, reading. The path is south.
exits: s=woods.path1
npcs: flicker
x: toadstools,ring: Red with white spots, just like in books. Fairy rule number one: don't eat them. Fairy rule number two: really, don't.
x: lights: Fireflies. Or fairies. Or fairy fireflies. It's hard to tell.

#woods.path2 The Deeper Woods
flags: out
The trees grow closer together here and the path gets narrower. A huge oak tree towers to the west, its branches spreading over everything. North is a tangle of brambles, and south you can hear running water. The path back towards town is east.
exits: e=woods.path1 w=woods.oak n=woods.brambles s=woods.brook
mobs: hedgehog

#woods.oak The Giant Oak
flags: out
The biggest tree you have ever seen: an oak so wide that ten people holding hands couldn't get round it. Wooden planks have been nailed up the trunk like a ladder, leading up to a treehouse in the branches. A rope swing dangles nearby. The path is back east.
exits: e=woods.path2 u=woods.treehouse
x: planks,ladder,trunk: Planks nailed up the trunk. It says "RANGERS ONLY" on the first one, but someone has added "AND FRIENDS".
x: swing,rope: You have a go on the swing. WHEEEE. Brilliant.

#woods.treehouse The Treehouse
flags: out
A wonky treehouse built from old planks, a door and a car bonnet for a roof. Inside there's a beanbag, a stack of comics and a walkie-talkie. Through the window you can see right over the woods. A big branch carries on further up into the tree, and the ladder goes back down.
exits: d=woods.oak u=woods.branch
items: crisps
x: comics: A comic about a space hamster. Issue 1 of 3. Issues 2 and 3 are missing. That's comics for you.
x: walkie-talkie,walkie: You press the button. "Hello?" A crackly voice says "This is Rowan. Who's in my treehouse?" You put it down quickly.

#woods.branch The Top Branch
flags: out
You've climbed right to the top of the giant oak. The branch sways in the wind and the leaves whisper all around you. From up here you can see everything: the woods, Baudby's rooftops, the Grumbly Hills and even the sea. The way back is down.
exits: d=woods.treehouse
x: view: You can see a troll bridge over a brook to the southwest, and an owl tree past it. Far north, snow on top of Mount Megabyte.

#woods.brambles The Bramble Patch
flags: out
A thick, scratchy tangle of brambles. Every step snags your clothes. There are blackberries everywhere, and some of the brambles look like they're moving on their own. A narrow way leads north to a sunny clearing, and the path is south.
exits: s=woods.path2 n=woods.clearing
mobs: bramble
x: brambles,blackberries: Big juicy blackberries. And... is that something shiny caught in the brambles? You'd need to {W}SEARCH{x} to find it.

#woods.clearing The Sunny Clearing
flags: out
A clearing full of sunshine and dandelion clocks. In the middle, a knight in battered armour is walking round and round in circles, bumping into trees, because he has lost his helmet and his fringe has fallen over his eyes. The brambles are back south.
exits: s=woods.brambles
npcs: clanksalot
x: dandelions,clocks: You blow a dandelion clock. One o'clock, two o'clock, three o'clock... the fluff goes everywhere. It's three o'clock. Probably.

#woods.brook The Whispering Brook
flags: out
A cold, fast brook tumbles over rocks under the trees. A rickety wooden bridge crosses it to the west, and you can see a large figure sitting on the bridge with a tin for coins. The deeper woods are north.
exits: n=woods.path2 w=woods.bridge
mobs: squirrel
x: brook,water: Very cold. Your fingers go numb in two seconds.

#woods.bridge The Troll Bridge
flags: out
A creaky wooden bridge over the brook. Sitting in the middle of it, blocking the way, is a large, mossy troll in a knitted tank top, with a sign that says TOLL BRIDGE (ANSWER A RIDDLE). He looks friendly, but very firm. The deep woods are west (across the bridge), and the brook is east.
exits: e=woods.brook w=woods.deep
npcs: trevor
x: sign,tin: TOLL BRIDGE. NO GOLD. JUST ANSWER A RIDDLE. (TALK TO TREVOR.) Below, in smaller writing: "I am VERY good at riddles."

#woods.deep The Deep Woods
flags: out
Here the woods are dark and old and very quiet. Moss covers everything like a green carpet, and blue lights bob between the trunks. A cave mouth yawns in a rocky bank to the north (you can hear snoring). An enormous hollow tree stands to the west. The troll bridge is back east.
exits: e=woods.bridge n=woods.cave w=woods.owl
mobs: wisp badger
amb: Something snores in the cave. ZZZZZ... | A blue light giggles and bobs away. | An owl hoots. Wise, but a bit smug.

#woods.owl The Owl Tree
flags: safe
An enormous hollow tree, its trunk full of little round doors and jackos. Inside the biggest hollow, on a perch, sits Professor Hoot, an owl in a tweed waistcoat and a pair of brand-new spectacles, surrounded by books. The Deep Woods are back east.
exits: e=woods.deep
npcs: hoot
x: books: "Mice and How to Think About Them." "Advanced Hooting." "Night Shifts: A Memoir."
x: doors,jackos: Each little door has a name: SQUIRREL (KEEP OUT), WOODPECKER (KNOCK FIRST), MOTHS (WE LIKE YOUR LAMP).

#woods.cave The Bear's Cave
flags: out
A big, warm cave that smells of fur and honey. Most of it is filled with Big Ted, a huge brown bear, fast asleep and snoring so loudly the walls shake. Behind him you can see a gap leading further in, with daylight beyond, but he's completely in the way. The Deep Woods are south.
exits: s=woods.deep w=woods.grove
npcs: ted
x: gap,daylight: Past Big Ted's enormous furry tummy there's a gap, and through it, a glimpse of a beautiful green grove with a waterfall. You can't squeeze past.

#woods.grove The Hidden Grove
flags: out safe
A secret, perfect little grove behind the bear's cave. A waterfall pours into a clear pool, butterflies dance about, and the grass is soft as a carpet. Nobody comes here. It feels like the woods are holding their breath. The cave is back east.
exits: e=woods.cave
hid: w=woods.falls
hidmsg: w You look closely at the waterfall... there's a dry ledge behind it! You can go west, behind the waterfall!
x: waterfall,water,pool: The waterfall roars. Behind it you think you can see... something? A gap? It might be worth a {W}SEARCH{x}.
x: butterflies: Blue, orange and one that's tartan. That can't be right.

#woods.falls Behind the Waterfall
flags: out
A cool, damp cave behind the curtain of the waterfall, lit green by the light through the water. Somebody has been here before: there's a little wooden chest, a candle stub and a message scratched into the rock. The grove is east, through the water.
exits: e=woods.grove
items: ruby
secret: md.falls
x: message,rock: Scratched into the rock: "D + L + C + JK + J WERE HERE. SECRET DEN. SWORN TO SECRECY. 1998." Someone has added, much later: "DAVE TOLD EVERYONE".
x: chest: A little wooden chest, already open. Somebody left a ruby in it for the next person. That's nice.

!area sewers
#sewers.ladder The Bottom of the Ladder
flags: nomob
The ladder from the Back Alley ends in a dripping brick tunnel. It is dark, damp and smells of a PE changing room. A stream of murky water runs down a channel in the middle. The tunnel leads east into the gloom, and the ladder goes back up to daylight.
exits: u=town.alley e=sewers.tunnel1
x: water,channel: Murky. You see an odd sock float past, and then another. They're not matching.
tip: The sewers have monsters in! Keep an eye on your HP (the green number in your prompt). If it gets low, {W}FLEE{x} and {W}RECALL{x}.

#sewers.tunnel1 A Damp Tunnel
A long, curved brick tunnel. Your footsteps echo: plip, plop, plip. Little piles of socks are heaped against the walls. The tunnel carries on east to a junction, and the ladder is west.
exits: w=sewers.ladder e=sewers.junction
mobs: gremlin
amb: Something squeaks in the dark. | Drip... drip... drip... | You hear tiny feet running away, and the swish of a sock.

#sewers.junction The Junction
Four tunnels meet here in a round chamber with a domed brick ceiling. Old signs are painted on the walls with arrows. Water gushes from a pipe overhead into a deep drain. Tunnels lead off in all four directions.
exits: w=sewers.tunnel1 n=sewers.sock s=sewers.drip e=sewers.tunnel2
mobs: rat
x: signs,arrows: NORTH: SOCK STORAGE. SOUTH: LOST PROPERTY. EAST: HIS MAJESTY'S THRONE ROOM (KNOCK). WEST: OUT (BORING).

#sewers.sock Sock Mountain
A huge chamber, and in the middle of it a MOUNTAIN of socks. Odd socks of every colour, every size, every pattern: football socks, school socks, Christmas socks, a sock with a picture of a Ninja Turtle. Sock gremlins scurry up and down it like ants. The junction is south.
exits: s=sewers.junction
mobs: gremlin gremlin
x: mountain,socks,sock: You will never, ever see a matching pair in here. The gremlins make sure of it.

#sewers.drip The Drippy Chamber
A low chamber where water drips from every brick. A big puddle covers most of the floor. Something wobbly is in the corner. A pipe leads east, and the junction is north.
exits: n=sewers.junction e=sewers.lost
mobs: wobbler
x: puddle: Your reflection looks back at you. It looks worried. Sensible reflection.

#sewers.lost The Lost Property Pipe
A wide old pipe where everything that's ever been lost down a drain ends up: marbles, rings, keys, a remote control, half a skateboard and one wellington boot. It is like a treasure trove, if treasure was soggy. The Drippy Chamber is west.
exits: w=sewers.drip
mobs: slimeblob
items: marble floppy
x: stuff,things,treasure,remote: A TV remote (no batteries), seven marbles, a bike bell, and a soggy piece of paper that might be important. You'd have to {W}SEARCH{x} to look through it all.

#sewers.tunnel2 The Royal Tunnel
This tunnel has been decorated! Somebody has hung socks along the walls like bunting, and there's a little red carpet (an old bath mat) running down the middle. Two sock gremlins stand guard holding toothbrushes like spears. The tunnel goes east towards a big grate, and the junction is west.
exits: w=sewers.junction e=sewers.grate
mobs: gremlin rat
x: bunting,socks: Sock bunting. Very festive. Very smelly.

#sewers.grate The Big Grate
A massive iron grate blocks most of the tunnel, but it has been bent open just wide enough to squeeze through. Through it, to the east, you can see the flicker of candles and hear squeaky music. A sign hangs on the grate. The Royal Tunnel is back west.
exits: w=sewers.tunnel2 e=sewers.throne
x: sign: "THE THRONE ROOM OF HIS ROYAL SQUEAKINESS, KING RATBAG THE FIRST. NO SOCKS RETURNED. NO REFUNDS. NO CATS."
tip: King Ratbag is level 7 and tough. Bring Fizz Pop, wear your best armour, and maybe bring a friend in a {W}PARTY{x}!

#sewers.throne King Ratbag's Throne Room
A grand(ish) chamber lit by candles stuck in jam jars. Socks hang from the ceiling like banners. At the far end, on a throne made from shopping trolleys, sits King Ratbag. Behind his throne is the biggest bag of socks you have ever seen. The grate is west.
exits: w=sewers.grate
mobs: ratbag
x: throne,trolleys: Four shopping trolleys welded together, with a cushion. One of the wheels squeaks. Of course it does.

!area sea
#sea.ship Aboard the Soggy Biscuit
flags: out safe
The deck of the tubby little ship rocks under your feet. The sail flaps, the ropes creak, and a cheerful sailor at the wheel waves at you. The Soggy Biscuit goes back and forth between Baudby and the Isle of Spam all day long: north is back to the Docks, and south is the island's sandy beach.
exits: n=town.docks s=sea.beach
amb: The ship creaks. | Spray splashes over the side. | The sailor sings a sea shanty about biscuits. | A seagull lands on the mast.
x: sailor,wheel: "All aboard! Isle of Spam to the south, Baudby to the north! No fare, no fuss, no seasickness. Well, a bit of seasickness."

#sea.beach The Sandy Beach
flags: out
A long golden beach under bright blue sky, with gentle waves lapping at your feet. Palm trees grow to the west. Rocks stick out of the sea to the east, and a column of smoke rises from a camp to the south. The Soggy Biscuit is moored at a little jetty to the north.
exits: n=sea.ship e=sea.rocks w=sea.palms s=sea.camp
mobs: crab
items: shell
x: sand: Soft, warm and gets EVERYWHERE. You'll be finding it in your socks for weeks.
x: waves,sea: The sea is blue-green and sparkly. You can see a little lighthouse up on the rocks to the northeast.

#sea.rocks Crab Rocks
flags: out
Big black rocks covered in seaweed and rock pools, with waves crashing over them. Crabs scuttle everywhere. A narrow path leads north up to the lighthouse. The beach is west.
exits: w=sea.beach n=sea.lighthouse
mobs: crab pinchalot
x: pools,rock: Little rock pools full of anemones, shrimps and a starfish that waves.

#sea.lighthouse The Lighthouse
flags: out
A stripy red-and-white lighthouse stands on the highest rock, with a spiral staircase inside going up and up. The door is open and banging in the wind. Crab Rocks are south.
exits: s=sea.rocks u=sea.lamp

#sea.lamp The Lamp Room
flags: out
At the very top of the lighthouse, a huge glass lamp turns slowly in the middle of the room. The jackos look out over the sparkling sea in every direction. Sitting on top of the lamp, looking very pleased with herself, is a green parrot. The stairs go back down.
exits: d=sea.lighthouse
npcs: polly
x: lamp: A great big glass lamp. It goes round and round. At night it sweeps across the sea.
x: jackos,view,sea: Far to the north, you can see Baudby's rooftops and the clock tower.

#sea.palms The Palm Grove
flags: out
Tall palm trees with coconuts hanging high up, and hammocks strung between them. It is shady and peaceful, apart from the coconut crab. A trail leads south across the dunes. The beach is east.
exits: e=sea.beach s=sea.dune
mobs: coconutcrab
x: hammocks,hammock: You lie in a hammock. Aaaah. You nearly fall asleep. Then a coconut lands next to your head.
x: coconuts: High up. Very high up. Too high up.

#sea.dune The Lonely Dune
flags: out
A tall, lonely sand dune with a single bent palm tree on top and nothing else for miles. The sand here looks... oddly disturbed, as if something was buried once, long ago. The palm grove is north.
exits: n=sea.palms
x: sand,disturbed: Funny bumpy sand. If you had a map telling you where to dig, this would be the kind of place.
x: palm,tree: A single bent palm tree. Someone has carved an arrow into the trunk pointing straight down.

#sea.camp The Pirate Camp
flags: out safe
A ramshackle camp of tents made of old sails, around a crackling campfire. A barrel of cream crackers stands by a tent. Captain Pegleg Pete, a pirate with a wooden leg, a huge feathered hat and an empty shoulder, sits by the fire looking very sad. A cove is to the east, and the beach is north.
exits: n=sea.beach e=sea.cove
npcs: pete
mobs: deckhand
x: barrel,crackers: A barrel of cream crackers. "FOR POLLY," it says. Polly is not here.
x: fire,campfire: They're toasting marshmallows. Pirates do that. Who knew?
x: tents: Old sails sewn together. One says "SOGGY BISCUIT" upside down.

#sea.cove Smuggler's Cove
flags: out
A hidden cove, walled in by cliffs, where a little rowing boat is pulled up on the shingle. A dark cave opens in the cliff, with rough steps going down into it. The pirate camp is west.
exits: w=sea.camp d=sea.grotto
mobs: deckhand
x: boat: A rowing boat called "THE SOGGY BISCUIT JUNIOR". It has a hole in it.

#sea.grotto The Kraken's Grotto
flags: out
A huge sea cave, its walls glittering with shells. Deep blue water fills most of it, and the waves boom like thunder. On a ledge sits an old sailor with a white beard and a pipe full of bubbles. The steps go back up.
exits: u=sea.cove
npcs: bill
mobs: squidgy
x: shells,walls: Thousands of shells, all pressed into the walls like a mosaic. They show a picture of a giant octopus waving.
x: water: Very deep and very blue. Something big moves under the surface. Something pink.

!area hills
#hills.path The Rocky Path
flags: out
A stony path zig-zags up into the Grumbly Hills, between gorse bushes and heaps of rocks. The wind grumbles. That's why they're called the Grumbly Hills. Goats bleat somewhere above. The path goes north up to a ledge, and east along a ridge. Windy Hill is south.
exits: s=fields.hill n=hills.ledge e=hills.ridge
mobs: goat
x: gorse: Yellow flowers that smell of coconut. Prickly though.

#hills.ridge Goat Ridge
flags: out
A narrow ridge where the goats have worn a path. It's high up and windy and you can see for miles. Goats stand on rocks that should not be possible to stand on. The Rocky Path is west.
exits: w=hills.path
mobs: goat goat
items: boots
x: goats: A goat is standing on a rock the size of a teacup. On one leg. Showing off.

#hills.ledge The Windy Ledge
flags: out
A wide rocky ledge high in the hills. To the north, a dark cave mouth is set into the hillside, with a hand-painted warning sign. East, the ledge turns into a path climbing towards the snowy slopes of Mount Megabyte. The Rocky Path drops back south.
exits: s=hills.path n=caves.mouth e=mount.foot
x: sign,warning: "THE CAVES OF LAG. WARNING: EVERYTHING INSIDE IS... A... BIT... SLOW. BEST FOR LEVEL 7 AND UP."
x: mountain: Mount Megabyte, white and enormous. It has a castle at the top!

!area caves
#caves.mouth The Cave Mouth
The entrance of the Caves of Lag. As you step in, everything suddenly feels... slower. A drip falls from the ceiling and takes about three seconds to land. A spinning hourglass has been carved above the entrance. A passage leads north into the dark, and the ledge is south.
exits: s=hills.ledge n=caves.echo
x: hourglass,carving: It's carved into the rock and spinning, even though it's rock. That's the Caves of Lag for you.
tip: The Caves of Lag are for level 7 and up. If something says "looks VERY tough", leave it alone!

#caves.echo The Echo Chamber
A huge round cavern where every sound comes back three times, slowly. Hello... hello... hello... Passages lead off in all directions: east glitters, west flutters, north smells of water, and south goes back to the entrance.
exits: s=caves.mouth e=caves.crystal w=caves.bats n=caves.lake
mobs: goblin
x: echo: You shout "HELLO!" ...HELLO! ...hello. ...ok whatever.

#caves.crystal The Crystal Grotto
A sparkling cavern full of giant crystals, glowing blue, pink and green like a disco. The light bounces about everywhere. Crystal crabs clink across the floor. The Echo Chamber is west.
exits: w=caves.echo
mobs: crystalcrab crystalcrab
x: crystals: Huge and glowing. You can see your reflection in a hundred of them. You look ace. There might be things hidden among them: try {W}SEARCH{x}.

#caves.bats The Bat Roost
A tall, narrow cave with a ceiling covered in bats, all hanging upside down and spinning slowly, like loading icons. The floor is... let's not talk about the floor. The Echo Chamber is east.
exits: e=caves.echo
mobs: bat bat
x: floor: You said you wouldn't.
x: bats,ceiling: Hundreds of them, all spinning. Some of them are buffering.

#caves.lake The Underground Lake
A vast black lake fills this cavern, still as glass. A wooden jetty sticks out over the water, and a small rowing boat is tied to it. A gloomy figure in a long coat sits in the boat, fishing. Across the lake, far off, you can see a little island with a glow on it. The Echo Chamber is south.
exits: s=caves.echo n=caves.isle
npcs: gus
x: lake,water: Black and still. Something goes "blup" in the middle.
x: island,glow: A small island with a glowing tunnel going down into it. You'll need the boat to get there.

#caves.isle The Little Island
A tiny rocky island in the middle of the lake. A tunnel goes down into the rock here, glowing with a weird flickering light, like a computer monitor in a dark room. Gus's boat is waiting at the shore to take you back south across the lake.
exits: s=caves.lake d=caves.tunnel
x: tunnel,light: The light flickers... loading... loading... It's coming from deep down.

#caves.tunnel The Loading Tunnel
A long tunnel lit by a flickering green bar painted along the wall that slowly fills up as you walk... 12%... 13%... It never quite gets to 100%. Goblins have been here: there are footprints and crisp packets. The tunnel goes north to a great cavern, west into an old mine, and east to a camp. Up goes back to the island.
exits: u=caves.isle n=caves.lair w=caves.mine e=caves.camp
mobs: goblin
x: bar,green: 47%... 47%... 47%... 48%! It's slow but it's trying.

#caves.camp The Lag Goblin Camp
A grubby camp of goblin tents around a fire that flickers in slow motion. Goblins stand frozen mid-action: one halfway through eating a sandwich, one halfway through a yawn. Then they all jerk forward a second. The tunnel is west.
exits: w=caves.tunnel
mobs: goblin goblin
items: chips
x: goblins,frozen: Like someone pressed pause. Then play. Then pause again.

#caves.mine The Abandoned Mine
An old mine with rotting wooden beams and a rusty little railway track. A mine cart sits on the rails, full of rocks. Some of the rocks are moving. The tunnel is east.
exits: e=caves.tunnel
mobs: golem
items: crystal
x: cart,rails: A rusty mine cart. If you {W}PUSH{x} it, it might go somewhere... or nowhere.

#caves.lair The Great Buffering Cavern
An enormous cavern so tall the roof is lost in darkness. Everything here moves in slow motion: dust hangs in the air, drips float down like feathers. In the middle, filling half the cave, the Great Buffer Beast spins and spins, its loading-bar mouth glowing. The tunnel is south.
exits: s=caves.tunnel
mobs: buffer
x: dust: It hangs in the air. You blow on it. It moves... eventually.
tip: This is a {R}BOSS{x}: level 11. Bring friends, Fizz Pop and patience!

!area mount
#mount.foot The Foot of Mount Megabyte
flags: out
The path from the hills reaches the bottom of Mount Megabyte, an enormous mountain with snow on top like icing on a cake. A path cut into the rock zig-zags upwards. An old signpost is half-buried in a snowdrift. The Windy Ledge is west.
exits: w=hills.ledge u=mount.slope
x: signpost,sign: "UP: The Snowy Slope, the Yeti, and FLOPPITHA'S KEEP. Dragon is friendly. Mostly. Do not mention scales."

#mount.slope The Snowy Slope
flags: out
Crunchy snow up to your knees and a wind that makes your nose go numb. Snow sprites whirl about, laughing. A cave is cut into the rock to the north, with smoke coming out (and humming). The path goes east along a cliff, and up towards the summit. The foot of the mountain is down.
exits: d=mount.foot n=mount.yeti e=mount.cliff u=mount.peak
mobs: sprite
x: snow: Perfect snowball snow. You make one. You've got nobody to throw it at. You throw it at a tree. The tree is fine.

#mount.yeti The Yeti's Cave
flags: safe
A cosy cave with a fire, a rug, a bookshelf and, in a big armchair, a huge white furry yeti in a woolly hat, slurping a bowl of spaghetti. He's called Spaghetti. (That's not a coincidence.) The slope is south.
exits: s=mount.slope
npcs: spaghetti
x: bookshelf,books: "Knitting for Big Hands." "Snow: A History." "1001 Pasta Recipes."

#mount.peak The Summit of Mount Megabyte
flags: out
You've made it to the very top! The wind howls, the snow sparkles and the whole world is laid out below you: Baudby, the fields, the woods, the sea and the Isle of Spam. A little flag on a pole says "YOU MADE IT!" and there's a visitors' book in a tin. The slope is down.
exits: d=mount.slope
secret: md.peak
mobs: wolf
x: book,visitors,tin: "Reached the top! - Sir R. Clank." "Cold. Very cold. - Dave." "Saw my house from here!! - Luke." "Took me 3 goes - Callum." "Easy - JackK."
x: view,world: Way, way below, you can see the Clock Tower. It is very small. Far to the east, a rocket on a launch pad.

#mount.cliff The Cliff Path
flags: out
A narrow path cut into the side of a cliff, with a sheer drop on one side. Don't look down. (You look down. It's a long way.) A frost wolf prowls along the path. North, a great stone castle looms out of the snow. The slope is west.
exits: w=mount.slope n=mount.gate
mobs: wolf
x: drop,down: You looked down. Why did you look down.

#mount.gate The Gate of Floppitha's Keep
flags: out
A huge castle gate, twenty feet high, with a doorbell beside it the size of a dustbin lid. The castle is built of grey stone and covered in snow, with purple flags flying from the towers. Stone gargoyles watch from the walls. The gate stands open. The cliff path is south.
exits: s=mount.cliff n=mount.hall
mobs: gargoyle
x: doorbell,bell: A huge brass bell button. You could {W}RING{x} it.

#mount.hall The Great Hall
flags: nomob
A vast hall with a vaulted ceiling, banners and a fireplace you could park a bus in. Empty suits of armour clank about doing the dusting. Doors lead west to a library, east to the hoard (you can hear snoring and the clink of gold), and stairs go up to the tower. The gate is south.
exits: s=mount.gate w=mount.library e=mount.hoard u=mount.tower
mobs: armour
x: fireplace: You could roast a whole turkey in it. Floppitha has done. At Christmas.
x: banners: Purple and green banners with a picture of a dragon holding a floppy disk.

#mount.library The Dragon's Library
A tall library, but instead of books the shelves are full of FLOPPY DISKS. Thousands and thousands of them, in neat rows, each one labelled in tiny careful writing: "GAMES 1983", "RECIPES (SHEEP)", "POEMS - VOL 12". There's a big empty space on one shelf with a label: "MY SAVE GAME - DO NOT TOUCH". The Great Hall is east.
exits: e=mount.hall
mobs: armour
x: disks,floppies,shelves: "DRAGON POETRY VOL 1-40." "MY HOLIDAY SNAPS (CAVES)." "GAMES I HAVE COMPLETED (ALL OF THEM)."
x: space,label: An empty space where the save game disk should be. Floppitha must be heartbroken.

#mount.hoard The Dragon's Hoard
flags: safe
A huge chamber piled high with gold coins, crowns, cups and goblets, and right on top of the pile, curled up like a cat, a magnificent purple and green dragon with spectacles on the end of her nose. This is Floppitha. She is reading a computer magazine. The Great Hall is west.
exits: w=mount.hall
npcs: floppitha
x: gold,hoard,coins: Mountains of gold. Floppitha has counted it. Twice. If you took even one coin she'd know.

#mount.tower The Tower Top
flags: out
The top of the castle's tallest tower, open to the sky, with snow swirling round. A huge telescope points out to the east, at the sky. The stairs go back down.
exits: d=mount.hall
mobs: gargoyle
x: telescope: You look through. You see... a space station! A round, spinning space station high above the world. And past it, the Moon, with something wriggling on it.

!area space
#space.rocket The Starhopper 99
flags: safe nomap
norecall: You're strapped in! Get out of the rocket first.
A cramped cabin inside the rocket, with two padded seats, a lot of blinking buttons, and a small round window. A big red button says LAUNCH. A smaller one says "DO NOT PRESS (THIS MEANS YOU, DAVE)". The hatch to get out is... well, out.
exits: out=fields.range
x: button,buttons,launch: A big red LAUNCH button. Type {W}LAUNCH{x}. You know you want to.
x: window: Through the little window you can see the Rocket Range and Dr Countdown waving his clipboard.

#space.dock The Docking Bay
flags: safe
You float into the Docking Bay of Orbital Station 99! Everything is white and shiny, with handrails everywhere because nobody can stand up properly. The Starhopper 99 is docked behind you, and a smaller shuttle with "MOON" painted on it is clamped to the other side. A corridor leads north into the station.
exits: n=space.ring
x: shuttle,moon: A little round shuttle with legs. Type {W}SHUTTLE{x} to fly down to the Moon (you'll want to be level 12 or so).
x: starhopper,rocket: Type {W}BOARD{x} to get back in the rocket and go home to Baudby.
tip: You're in SPACE! Type {W}BOARD{x} to fly home, or {W}SHUTTLE{x} for the Moon.
amb: The station hums. | A loose pencil floats past your nose. | An announcement: "WOULD THE OWNER OF A FLOATING SANDWICH PLEASE COLLECT IT FROM THE CONTROL ROOM."

#space.ring The Central Ring
A round corridor that curves away out of sight in both directions, because the whole station is a big wheel. JackOS show the Earth turning slowly below: blue and white and beautiful. Control is east, the Hydroponics garden is west, the Observation Deck is north, and the Docking Bay is south.
exits: s=space.dock e=space.control w=space.hydro n=space.deck
mobs: tomato
x: earth,jackos,window: The whole Earth, blue and white and swirly. You can see clouds over the sea. Somewhere down there, Baudby. Somewhere down there, your Mom, wondering why the phone line has been busy for three hours.

#space.control The Control Room
flags: safe
A room crammed with screens, dials and blinking lights. A big map of the Earth is on the wall with a little dot showing where the station is. Commander Nova, in a silver spacesuit, floats upside down in front of the main screen, frowning at a warning light. A little robot called B0B whirrs around making cups of tea. The Ring is west.
exits: w=space.ring
npcs: nova bob
x: screens,light,warning: A big red warning light flashes: {R}ANTENNA FAULT - NO SIGNAL{x}. "That's why we can't phone home," mutters Commander Nova.
x: map: A dot goes round the world every 90 minutes. You watch it for a bit. It's quite relaxing.

#space.hydro The Hydroponics Garden
A long room full of plants growing in tubes of water under purple lights. Tomatoes, lettuces and strawberries float about on their stalks. Some of the tomatoes are much too big, and look cross. The Ring is east.
exits: e=space.ring
mobs: tomato tomato
items: spacetomato
x: plants,tubes: Lettuces in tubes, strawberries upside down, and a cactus that someone has knitted a hat for.

#space.deck The Observation Deck
A big round room with a glass dome, looking straight out at the stars. There are comfy beanbags, a telescope and a sign saying "NO SUNBATHING". The Moon hangs huge and grey outside, and you can see something long and wriggly moving on it. Stairs go up to the airlock, a door leads north to the crew quarters, and the Ring is south.
exits: s=space.ring u=space.airlock n=space.quarters
x: moon: Through the telescope you can see the Moon up close. It IS made of cheese! And something huge is chewing great bites out of it.
x: beanbags,beanbag: You sit in a beanbag. In zero gravity, the beanbag floats away with you in it. Wheee.
x: stars: More stars than you've ever seen. No street lamps up here.

#space.quarters The Crew Quarters
flags: safe inn
A small cosy room with sleeping bags strapped to the walls (you sleep standing up in space), a little kitchen, and posters of rockets and planets. Someone's Game Lad is velcroed to the wall. The Observation Deck is south. {D}(A good place to REST.){x}
exits: s=space.deck
items: milkshake
x: posters: A poster of the Moon landing. A poster of a rocket. A poster of a cat in a spacesuit: "HANG IN THERE".
x: game,boy: A Game Lad, velcroed to the wall. It's playing a falling-blocks game. Somebody's high score: 99,999. "Commander Nova" says the name.

#space.airlock The Airlock
flags: nomob
A small round room with two heavy doors: one back down into the station, one leading OUT into space. A row of hooks for spacesuits is empty. A sign says "HELMETS MUST BE WORN BEYOND THIS POINT. NO HELMET, NO SPACEWALK."
exits: d=space.deck out=space.walk
x: sign: "HELMETS MUST BE WORN BEYOND THIS POINT." Below: "Yes, even you, Dave."

#space.walk Outside the Station
flags: out nomap
You're floating outside the station on a safety line, with nothing but stars all round you and the whole Earth spinning slowly underneath. It is SILENT. Completely silent. The big dish antenna sticks out from the station here, its bolts loose and its dish bent. A meteorite gremlin is clinging to it! The airlock is back in.
exits: in=space.airlock
mobs: meteorite
x: antenna,dish: The antenna's dish is bent and three bolts are loose. If you had a spanner you could {W}USE SPANNER{x} to fix it.
x: earth,stars: Breathtaking. You will remember this forever.

!area moon
#moon.landing The Lunar Landing Site
flags: out safe
The little shuttle bumps down onto the grey-green surface of the Moon. Every step is a giant bouncy leap. The ground is soft and smells... cheesy. A crater lies to the north, a village of tiny domes is east, and an old flag stands to the west. The shuttle is waiting to take you back up to the station.
exits: n=moon.crater e=moon.village w=moon.flag
x: ground,surface,cheese: It IS cheese! Hard and crumbly like old cheddar, with holes. You'll never look at the Moon the same way again.
x: shuttle: Type {W}SHUTTLE{x} to fly back up to the station.
tip: Bounce bounce! You're on the Moon! The Moon Mice live east. Talk to their Queen.

#moon.flag The Old Flag
flags: out
An old flag on a pole, planted in the cheese long ago, next to some big boot prints and a little plaque. It's very still and quiet here. The landing site is east.
exits: e=moon.landing
secret: md.moonflag
x: plaque: "HERE MEN FROM THE PLANET EARTH FIRST SET FOOT UPON THE MOON, JULY 1969. WE CAME IN PEACE FOR ALL MANKIND." You feel a bit wobbly. In a good way.
x: footprints,boot,prints: Big boot prints, still sharp after thirty years. Nobody has touched them. You don't either.

#moon.village Moon Mouse Village
flags: out safe
A village of little round domes made of cheese rind, with tiny round doors. Moon Mice in tiny spacesuits bounce about everywhere, squeaking. In the biggest dome, on a throne of Edam, sits Queen Squeakbert, wearing a crown made of a bottle top. The landing site is west.
exits: w=moon.landing
npcs: squeakbert
x: domes,doors: Each dome has a little welcome mat. One says "NO CATS". Another says "NO CATS". They all say "NO CATS".
x: mice: They bounce in their tiny spacesuits, squeaking with excitement. One of them waves at you. You wave back. Best day ever.

#moon.crater The Big Crater
flags: out
A huge bowl-shaped crater with steep cheesy sides. At the bottom, a dark hole leads down into the Moon. Cheese mites are munching the walls. The landing site is south.
exits: s=moon.landing d=moon.mines
mobs: mite zorb
x: hole: The way into the Cheese Mines. You can hear chewing down there. Loud, giant chewing.

#moon.mines The Cheese Mines
The Moon Mice dug these tunnels to mine the best cheese, but now they're full of mites and zorbs. The walls are yellow and holey, glowing faintly. The tunnel goes east towards an awful crunching, munching noise. Up leads back to the crater.
exits: u=moon.crater e=moon.pit
mobs: mite zorb
items: mooncheese
x: walls,cheese: Pale green, crumbly and glowing. Tastes like cheddar and space.

#moon.pit The Muncher's Pit
A massive pit gnawed out of the middle of the Moon, with chewed walls and crumbs everywhere. Lying in the middle, curled round and round itself, is THE ASTEROID MUNCHER, chewing. The mines are west.
exits: w=moon.mines
mobs: muncher
tip: The Asteroid Muncher is level 16! Bring your best friends and LOTS of Fizz.

!area y2k
#y2k.stairs The Iron Stairs
flags: nomob
Iron stairs spiral down from the Clock Tower trapdoor into the dark. The walls hum. The air is warm and smells of hot dust and electricity, like the back of a telly. A sign at the bottom says "THE OLD SERVER ROOM. KEEP COOL. KEEP CALM. KEEP BACKUPS." A corridor leads north, and the stairs go back up.
exits: u=town.tower n=y2k.hum
x: sign: Underneath, someone has written in marker: "IT IS IN HERE. IT KNOWS WHAT YEAR IT IS. IT IS WRONG."
tip: The Old Server Room is for level 14 and up. The Millennium Bug at the end is level 18! Go in a party.

#y2k.hum The Humming Corridor
A long corridor with a floor of metal tiles and cables running along the ceiling. Everything hums, and little lights blink red and green in the walls. Server racks are north, a tangle of cables is east, and the stairs are south.
exits: s=y2k.stairs n=y2k.racks e=y2k.cables
mobs: bitbug
amb: The humming changes pitch, like a computer thinking hard. | A light blinks red. Then green. Then red. | Something beeps three times, far away.

#y2k.cables Cable Spaghetti
A room completely full of tangled cables: grey, beige, red, blue, all knotted together like a giant bowl of spaghetti. You have to climb through them. Somewhere in here there's a cable for everything, and none of them are labelled. The corridor is west.
exits: w=y2k.hum
mobs: spreadsheet
items: chip
x: cables: You follow one cable. It goes into another cable. That goes into a plug. That plug is plugged into itself. Callum designed this room.

#y2k.racks The Server Racks
Tall black cabinets in rows, stuffed with blinking computers that roar like a hundred hairdryers. Tick-tock robots march up and down between them. A freezing blast of air comes from the west, and the corridor goes on north towards a pulsing light. The Humming Corridor is south.
exits: s=y2k.hum w=y2k.cooling n=y2k.core
mobs: tickbot glitch
x: computers,racks,cabinets: Every screen shows the date. Some say 1999. Some say 1900. Some say 19100. The Bug is getting to them.

#y2k.cooling The Cooling Room
A freezing room full of big humming air-conditioning units, blowing icy air through the server room. Icicles hang from the pipes. You can see your breath. The racks are east.
exits: e=y2k.racks
mobs: cursor
items: dfizz
x: icicles,pipes: An icicle as long as a sword. You leave it where it is. Probably for the best.

#y2k.core The Mainframe Core
A huge round room in the middle of the server room, with an enormous old computer in the centre that fills the room from floor to ceiling, covered in dials, switches and spinning tape reels. The air crackles. A massive door to the north is marked with a skull made of zeroes and ones. The racks are south.
exits: s=y2k.racks n=y2k.nest
mobs: glitch cursor
x: computer,mainframe,tape: The Mainframe. It runs every clock in Baudby. A screen on it says: {R}DATE ROLLOVER IN PROGRESS... 1999 -> 1900... ERROR... ERROR...{x}
x: door,skull: 01011001 00110010 01001011. Callum would know what that means.

#y2k.nest The Millennium Bug's Nest
A cavernous chamber lit by thousands of flashing digital clocks, all showing 00:00, all blinking. Cables hang from the ceiling like vines. In the middle, clutching the main clock cable in its jaws, crouches THE MILLENNIUM BUG. The core is south.
exits: s=y2k.core
mobs: y2kbug
norecall: The Bug's clocks scramble your recall magic! You'll have to walk out.
x: clocks: 00:00. 00:00. 00:00. They're all stuck. Waiting.
`;

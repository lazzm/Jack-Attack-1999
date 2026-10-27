/* dos-quest: JACK QUEST, a text adventure by Jack (1999). 45 rooms: the house, the street, school, and the Toy
 * Kingdom under the bed (it used to be an Ork camp; room ids, flags and old nouns are kept). A Zork-style parser, 350 points, SAVE/RESTORE to localStorage. Loaded lazily by the shell. */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps, P = DOS.progs;
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  const SAVEKEY = 'jhp_dos_gq';

  // ================================================================ the world
  // rooms: { name, d (description), x: { dir: roomId | [roomId, flag, blockedMsg] }, dark, items: [...] }
  const R = {
    bedroom: { name: 'Your Bedroom', d: 'Your bedroom. Posters, a bunk bed with no top bunk (Dad took it down after The Incident), a desk with the PC on it, and a floor you can\'t see because of the clothes. The PC\'s screen is still on. Gubbinz isn\'t on it. There are tiny green footprints on the mouse mat, leading UNDER the bed. The landing is WEST.', x: { w: 'landing', down: 'underbed', under: 'underbed' } },
    underbed: { name: 'Under the Bed', d: 'You are under your bed, on your belly, in the dust. It\'s bigger under here than it has any right to be. Ahead of you is a WALL OF SOCKS, every sock you have ever lost, packed solid. The tiny footprints go straight into it.', x: { up: 'bedroom', out: 'bedroom', e: ['hole', 'socks', 'The wall of socks is in the way. You could try MOVING it. (Hold your nose.)'] } },
    landing: { name: 'The Landing', d: 'The landing. Beige carpet, a radiator that clanks, a photo of you aged four with no front teeth that you have asked Mom to take down eleven times. Your room is EAST, the bathroom NORTH, Mom and Dad\'s room SOUTH, the airing cupboard WEST, and the stairs go DOWN.', x: { e: 'bedroom', n: 'bathroom', s: 'parents', w: 'cupboard', down: 'hall' } },
    bathroom: { name: 'Bathroom', d: 'The bathroom. Avocado-coloured everything, which Mom says was fashionable once. There\'s a mirror. The toilet roll has one sheet left, which is a trap. The landing is SOUTH.', x: { s: 'landing' } },
    parents: { name: 'Mom and Dad\'s Room', d: 'Mom and Dad\'s room. You are not allowed in here. You know it, the room knows it, the big wardrobe knows it. There is a fiver on the dresser. You are not going to take Mom\'s money, because you are not a monster. The landing is NORTH.', x: { n: 'landing' } },
    cupboard: { name: 'Airing Cupboard', d: 'The airing cupboard, which is warm and smells of towels. Behind the towels is where Mom hides Christmas stuff. The landing is EAST.', x: { e: 'landing' } },
    hall: { name: 'Hall', d: 'The hall. Coats, shoes, the phone on its little table (not in use, so the Internet is available, so you should probably be on it). The stairs go UP. The living room is NORTH, the kitchen EAST, and the front door SOUTH.', x: { up: 'landing', n: 'living', e: 'kitchen', s: 'front' } },
    living: { name: 'Living Room', d: 'The living room. Dad is asleep on the sofa with the telly on. He is snoring in a way that sounds like a modem. The ULTRA 64 is under the telly. The remote control is on the arm of the sofa, balanced exactly where it will fall. The hall is SOUTH.', x: { s: 'hall' } },
    kitchen: { name: 'Kitchen', d: 'The kitchen. Mom is here, doing something with a pan and looking at you like you owe her something. (You owe her the bins.) There\'s a full bin bag tied up by the back door. The back garden is EAST, the hall WEST.', x: { w: 'hall', e: 'garden' } },
    garden: { name: 'Back Garden', d: 'The back garden. A wonky fence, a washing line, a lawn Dad "will do at the weekend" (it is the weekend). The wheelie bin lurks by the gate. The shed is NORTH. The kitchen is WEST.', x: { w: 'kitchen', n: 'shed' } },
    shed: { name: 'The Shed', d: 'Dad\'s shed. Spiders, paint tins with the lids rusted on, a lawnmower from before you were born, and a workbench with one rusty spanner on it. A sign says "DAD\'S SHED. KEEP OUT. THIS MEANS JACK." The garden is SOUTH.', x: { s: 'garden' } },
    front: { name: 'Front Garden', d: 'The front garden. A path, a hedge that\'s mostly a holly bush, and Dad\'s car on the drive with a sunshade in the window that says "KEEP COOL". The hall is NORTH, the garage EAST, the street SOUTH.', x: { n: 'hall', e: 'garage', s: 'street' } },
    garage: { name: 'Garage', d: 'The garage. Not for the car, obviously. For boxes. Boxes of magazines, boxes of cables, and in the corner, under a sheet, Dad\'s OLD PC: a 486 with a turbo button. It still works. It only plays GLOOM. That\'s all Dad wants it for. The front garden is WEST.', x: { w: 'front' } },
    street: { name: 'The Street', d: 'Your street. Terraced houses, a lamp post with a lost-cat poster (found, three weeks ago, the poster is just there now). Your house is NORTH, Dave\'s is EAST, the corner shop is WEST and the bus stop is SOUTH.', x: { n: 'front', e: 'davedoor', w: 'shop', s: 'busstop' } },
    davedoor: { name: 'Dave\'s Front Door', d: 'Dave\'s front door, which has a doorbell that plays a tune. Dave\'s mom answers before you press it. "He\'s upstairs, love. Tell him dinner\'s at six." You can go IN, or back WEST to the street.', x: { in: 'daveroom', w: 'street', n: 'daveroom' } },
    daveroom: { name: 'Dave\'s Room', d: 'Dave\'s room, which is like yours but with more football and a smell of crisps. Dave is lying on the floor with a library book, looking at it upside down. He has his own home-made lightspatula (kitchen roll tube, blue). "Alright," says Dave. The door is OUT.', x: { out: 'davedoor', s: 'davedoor' } },
    shop: { name: 'Corner Shop', d: 'The corner shop. It sells everything and all of it is slightly out of date. The shopkeeper is reading the paper. On the rack: ALIEN-FLAVOUR crisps (they are green, they are new, nobody knows what an alien tastes like, including the crisp people). The street is EAST.', x: { e: 'street' } },
    busstop: { name: 'Bus Stop', d: 'The bus stop. A timetable says the 47 comes every 20 minutes, which is a joke the whole town is in on. The park is SOUTH. Town is EAST. The street is NORTH.', x: { n: 'street', s: 'park', e: 'queue' } },
    park: { name: 'The Park', d: 'The park. Swings (one works), a slide that is too hot in summer and too wet the rest of the year, and a dog that is nobody\'s. The pond is WEST, the school gates are EAST, the bus stop NORTH.', x: { n: 'busstop', w: 'pond', e: 'gates' } },
    pond: { name: 'The Pond', d: 'The pond. Ducks. A sign: "NO FISHING. NO SWIMMING. NO SPACESHIPS." Someone has added the last one in felt tip. You have a feeling it was you. The park is EAST.', x: { e: 'park' } },
    queue: { name: 'The Toy Shop Queue', d: 'The queue outside the toy shop. It goes round the corner. Everyone in it is a kid, or a dad pretending to be here for a kid. The new film\'s toys came in this morning and the whole town knows. The front of the queue is somewhere ahead. The bus stop is WEST. The cinema is EAST.', x: { w: 'busstop', e: 'cinema', in: ['toyshop', 'queued', 'You\'re not at the front of the queue. You could WAIT. That\'s what a queue is for.'] } },
    toyshop: { name: 'Toy Shop', d: 'Inside the toy shop. The shelves are mostly bare: cardboard shapes where toys were. One shelf has a few small PILOT FIGURES left (the one with the helmet, the one everybody wants). The till lady looks like she has been here since 1977. The door is OUT.', x: { out: 'queue', w: 'queue' } },
    cinema: { name: 'Cinema Foyer', d: 'The cinema foyer. It smells of popcorn and hot carpet. A huge poster for the new space film: a boy, a ship, a man with a red face and horns. You have seen it three times. Mom has said "no more". The queue is WEST.', x: { w: 'queue' } },
    gates: { name: 'School Gates', d: Cast.t('The school gates. It\'s Saturday, so the gates being open is deeply wrong, but {teacher} runs computer club on Saturday mornings and leaves them open "for the keen ones". The playground is NORTH. The park is WEST.'), x: { w: 'park', n: 'playground' } },
    playground: { name: 'Playground', d: 'The playground, empty, which makes it enormous. The hopscotch grid is still chalked from Friday. A door into the school is propped open with a fire extinguisher, NORTH. The gates are SOUTH.', x: { s: 'gates', n: 'corridor' } },
    corridor: { name: 'School Corridor', d: 'A school corridor on a Saturday, which is the quietest place on Earth. It smells of floor polish and dinners. Mr Bell\'s classroom is WEST, the computer room EAST, the library NORTH, the playground SOUTH.', x: { s: 'playground', w: 'classroom', e: 'club', n: 'library' } },
    classroom: { name: 'Mr Bell\'s Classroom', d: 'Mr Bell\'s classroom. Maths. The board still says "x is NOT whatever you want it to be, Jack". On his desk is a pot of felt tips, including a RED one, the good kind. The corridor is EAST.', x: { e: 'corridor' } },
    club: { name: 'Computer Club', d: Cast.t('The computer room. Twelve beige PCs, eleven switched off. {teacher} is at the twelfth, typing BASIC, humming. "Jack! Saturday! Keen!" {teacher.he} says, without looking up. "Have you tried SUBs yet? Use SUBs." The corridor is WEST.'), x: { w: 'corridor' } },
    library: { name: 'School Library', d: 'The school library, four shelves and a beanbag. The librarian is here on a Saturday, which proves she lives here. The COMPUTING shelf has three books. The PUZZLES shelf has a gap where a book should be, and a card that says ON LOAN. The corridor is SOUTH.', x: { s: 'corridor' } },
    hole: { name: 'The Sock Cave', dark: true, d: 'A cave, where there definitely wasn\'t a cave before. The walls are warm and the floor is soft, like the inside of a sock. (It is the inside of a sock. Don\'t think about it.) The air smells of mushrooms and new plastic, like Christmas morning. The sock wall is WEST. The cave opens out EAST.', x: { w: 'underbed', e: 'forest' } },
    forest: { name: 'Mushroom Forest', d: 'A forest of mushrooms as tall as houses, red with white spots, like a level you have definitely played on the ULTRA 64. Something small giggles and bounces off. Paths go EAST, deeper in, and NORTH towards a smell of crisps. The cave is WEST.', x: { w: 'hole', e: 'deeper', n: 'bridge' } },
    deeper: { name: 'Deeper in the Mushrooms', d: 'Deeper in. The mushrooms close over your head like a roof. A baby Blobbit (a round bouncy thing the size of a hamster) is sitting on a toadstool, eating the toadstool. It offers you some. You decline. Every direction looks the same but WEST goes back.', x: { w: 'forest', e: 'deeper', n: 'deeper', s: 'deeper' } },
    bridge: { name: 'The Ruler Bridge', d: 'A bridge made of school rulers over a gorge full of, you suspect, every marble ever lost. On the far side, toy music (a drumming monkey, a xylophone, a car horn). The forest is SOUTH, the far side EAST.', x: { s: 'forest', e: ['gate', 'squigfed', 'The Big Blobbit is sitting in the middle of the bridge. It is the size of a sofa and it is all mouth. It looks at you the way Gubbinz looks at a biscuit. You are not crossing.'] } },
    gate: { name: 'The Toy Fort Gate', d: 'A gate built of building bricks, dominoes and a doll\'s bath, painted red. A tin soldier in a helmet three sizes too big peers out of a hole in the bath. "HALT! PASSWORD." The bridge is WEST. The fort is EAST, behind the gate.', x: { w: 'bridge', e: ['camp', 'password', 'The tin soldier holds up a hand. "PASSWORD, I SAID." You could SAY one. (If you knew it.)'] } },
    camp: { name: 'Toy Town Square', d: 'The middle of the Toy Kingdom. Toys everywhere: robots welding, spacemen arm-wrestling, knights painting things red, a jack-in-the-box going off every ten seconds. A BIG TRUCK (a wind-up toy lorry the size of a real one) is parked in the middle, held together by sticky tape and belief. The Robot Workshop is NORTH, the Blobbit Pen SOUTH, the King\'s castle EAST, the Arena NORTHEAST, the Rupee Bank SOUTHEAST. A hole in the ground goes DOWN into the Toy Tunnels. The gate is WEST.', x: { w: 'gate', n: 'mek', s: 'pen', e: ['hut', 'hutopen', 'The King\'s castle is a cardboard box with a drawbridge made of a cereal-box lid, and it is shut. A sign says "THE KING. GO AWAY. UNLESS YOU ARE IMPORTANT." You are not important yet.'], ne: 'arena', se: 'bank', down: 'tunnelA' } },
    mek: { name: 'The Robot Workshop', d: 'The Robot Workshop. Sparks, smoke, a robot mechanic with six spanners and four arms (two of them bolted on). On a shelf: tins of paint. All red. A sign says "RED PAINT: 5 RUPEES. RED ONES GO FASTER. EVERYONE KNOWS." The square is SOUTH.', x: { s: 'camp' } },
    pen: { name: 'The Blobbit Pen', d: 'The Blobbit pen. Blobbits bounce around like footballs with faces. A tin soldier with a bucket is feeding them, and losing. The square is NORTH.', x: { n: 'camp' } },
    arena: { name: 'The Arena', d: 'The arena: a ring of toy tyres, a crowd of toys, and in the middle, BIG ZOG, the champion: a plastic knight as big as a wardrobe. He is swinging a lightspatula. Well, a length of drainpipe. He has painted it green. "WHO WANTS SOME?" he says. The square is SOUTHWEST.', x: { sw: 'camp' } },
    bank: { name: 'The Rupee Bank', d: 'The Rupee Bank: a giant piggy bank with a clockwork robot in it and a sign that says "RUPEES IN. RUPEES OUT. NO LOANS. NO BITING." The robot counts your Rupees every time you come in, out loud, slowly. The square is NORTHWEST.', x: { nw: 'camp' } },
    tunnelA: { name: 'Toy Tunnels', dark: true, d: 'A tunnel, toy-sized, so you\'re on your hands and knees. Tiny footprints in the dirt, and the tracks of a lot of Micro Mechanics. The tunnel goes EAST. The square is UP.', x: { up: 'camp', e: 'tunnelB' } },
    tunnelB: { name: 'Toy Tunnels, a Junction', dark: true, d: 'A junction in the tunnels. Scratched on the wall: "GUBBINZ WOZ ERE" and an arrow, pointing NORTH. Also "DAVE IS A GIT", which seems unlikely down here. SOUTH is a dead end full of lost Pocket Critters cards (all commons). WEST goes back.', x: { w: 'tunnelA', n: 'tunnelC', s: 'tunnelB' } },
    tunnelC: { name: 'Toy Tunnels, Narrow Bit', dark: true, d: 'The narrowest bit of tunnel. Your shoulders scrape. At the end, EAST, is a light, and a smell you know: Wotsitz and biscuit crumbs. The junction is SOUTH.', x: { s: 'tunnelB', e: 'hidey' } },
    hidey: { name: 'Gubbinz\'s Hidey Hole', d: 'A snug little hole lined with things that have gone missing from your room: the other sock, a Blocko head, three pencils, the ULTRA 64 memory card (!). The tunnel is WEST.', x: { w: 'tunnelC' } },
    hut: { name: 'The King\'s Castle', d: 'Inside the cardboard castle. A throne made of a car seat on a pile of tyres, and on it, KING GORZAG, the biggest teddy bear you have ever seen, with a cardboard crown and one button eye. He is holding something small and colourful in his big soft paws and glaring at it. The toys around him are very quiet. The square is WEST.', x: { w: 'camp' } },
    tower: { name: 'Top of the Block Tower', d: 'The top of the Block Tower, the tallest thing in the Toy Kingdom: building blocks, a crow\'s nest, and a view of everything. Below, every toy in the kingdom is looking up. The truck is parked at the bottom, ticking as it unwinds. The only way is DOWN, and that is a long way.', x: { down: 'camp' } },
  };
  // items: { name, syn: [...], d: description, loc: roomId | 'inv' | null, take: bool, fixed msg }
  const I = {
    torch: { name: 'torch', syn: ['torch', 'flashlight', 'light'], loc: null, take: true, d: () => F.batteries ? 'Your torch, now with batteries in it and therefore a torch, rather than a tube with a bulb on.' : 'Your torch. It has no batteries in it. It is, technically, a tube with a bulb on.' },
    batteries: { name: 'batteries', syn: ['batteries', 'battery', 'aa', 'aas'], loc: null, take: true, d: 'Two AA batteries, slightly warm, from the telly remote. The remote is now a brick. Dad will notice when he wakes up. Dad will not wake up.' },
    cube: { name: 'Rubrick\'s cube', syn: ['cube', 'rubik', 'rubiks', 'rubrick\'s'], loc: 'bedroom', take: true, d: 'Your own Rubrick\'s cube, solved, because you solve it and then you look at it. Best time: 58.32 seconds. Under a minute. You want that on the record.' },
    tube: { name: 'wrapping paper tube', syn: ['tube', 'roll', 'wrapping', 'paper', 'cardboard'], loc: 'cupboard', take: true, d: () => F.saber ? 'The tube, now a LIGHTSPATULA: red felt tip all the way round, a handle drawn on in biro. It hums. (You are doing the humming.)' : 'A cardboard tube from the Christmas wrapping paper. Long, sturdy, and crying out to be a lightspatula. It just needs colour.' },
    felt: { name: 'red felt tip', syn: ['felt', 'pen', 'tip', 'felt-tip', 'marker', 'red'], loc: 'classroom', take: true, d: 'A red felt tip. The good kind, the thick kind, the kind that goes through paper and onto the desk. Mr Bell counts these.' },
    saber: { name: 'lightsaber', syn: ['lightsaber', 'saber', 'sabre', 'lightsabre', 'sword'], loc: null, take: true, d: 'Your lightspatula. A wrapping-paper tube coloured red with a felt tip. It is the best thing you have ever made. VVVSHHHMMM.' },
    crisps: { name: 'alien-flavour crisps', syn: ['crisps', 'crisp', 'packet', 'snacks', 'squig-flavour', 'alien-flavour', 'alien flavour', 'alien crisps', 'alien', 'bag'], loc: null, take: true, d: 'A packet of ALIEN-FLAVOUR crisps. Bright green bag, a cartoon alien on the front giving a thumbs up (it has three thumbs). Smells of beef and outer space.' },
    binbag: { name: 'bin bag', syn: ['bin bag', 'binbag', 'bag', 'rubbish', 'bins', 'bin'], loc: 'kitchen', take: true, d: 'A full bin bag, tied in Mom\'s special knot. It is heavier than it looks and it smells like Tuesday.' },
    money: { name: 'money', syn: ['money', 'fiver', 'five pounds', 'cash', 'note', 'pounds', 'quid'], loc: null, take: true, d: () => `£${(F.money || 0).toFixed(2)}. ${F.money >= 5 ? 'A whole fiver. Mom said "don\'t spend it all on rubbish". You have plans.' : 'What\'s left after the shops.'}` },
    figure: { name: 'pilot figure', syn: ['figure', 'toy', 'pilot', 'action figure', 'helmet'], loc: null, take: true, d: 'A small plastic pilot in an orange suit with a helmet, from the new film. Three pounds ninety-nine. The last one on the shelf. Dave would sell his own bike for this.' },
    book: { name: 'cube book', syn: ['book', 'library book', 'solution', 'cube book'], loc: null, take: true, d: 'A library book: "THE CUBE: A COMPLETE SOLUTION", 1981, with diagrams. Dave had it upside down. The loan card says DAVE in Dave\'s handwriting, which is the main reason it is overdue.' },
    spanner: { name: 'rusty spanner', syn: ['spanner', 'wrench', 'tool'], loc: 'shed', take: true, d: 'A rusty spanner. It\'s adjustable. It doesn\'t adjust. It is the most Dad object in the world.' },
    teef: { name: 'Rupees', syn: ['rupees', 'rupee', 'gems', 'gem', 'roopeez', 'teef', 'teeth', 'tooth', 'tusks'], loc: null, take: true, d: () => `${F.teef || 0} Rupees. Toy Kingdom money: little shiny gems, all colours, cut with lots of flat sides. They clink. You try not to think about where the toys got them.` },
    paint: { name: 'tin of red paint', syn: ['paint', 'tin', 'red paint', 'can'], loc: null, take: true, d: 'A tin of toy-shop red. The label says "RED. GOES FASTER." and under that, smaller, "DO NOT DRINK (AGAIN)".' },
    remote: { name: 'remote control', syn: ['remote', 'control', 'remote control', 'controller', 'zapper'], loc: 'living', take: false, fixed: 'The remote is balanced on the arm of the sofa, next to Dad\'s hand. Taking the whole remote would wake him. Taking the BATTERIES out of it, however...', d: () => F.batteries ? 'The telly remote, back of it hanging open, no batteries. Dad will have to get up to change channel. Dad will not get up.' : 'The telly remote. It has a hatch on the back with two AA BATTERIES in it. The hatch is held on with tape, because the clip broke in 1996.' },
    socks: { name: 'wall of socks', syn: ['socks', 'sock', 'wall', 'wall of socks'], loc: 'underbed', take: false, fixed: 'You cannot take a wall. You could MOVE it.', d: 'Every sock you have ever lost. Football socks, school socks, one Christmas sock with a reindeer on. Packed solid like a dam. There is a gap at the bottom where the footprints go in.' },
    drawer: { name: 'desk drawer', syn: ['drawer', 'desk', 'drawers'], loc: 'bedroom', take: false, fixed: 'It\'s attached to the desk, which is attached to the floor by the weight of the PC on it.', d: () => F.drawer ? 'The desk drawer, open. Pens, a broken Strollman, cheat codes written on a napkin, and dust.' : 'The desk drawer. Shut. It sticks. You have to OPEN it with a wiggle.' },
    pc: { name: 'PC', syn: ['pc', 'computer', 'screen', 'monitor', 'jackos'], loc: 'bedroom', take: false, fixed: 'It weighs more than you do.', d: 'Your PC. JackOS 98, the website half-done, and the screen where Gubbinz usually sits, eating. The screen is empty. There are tiny green footprints on the mouse mat.' },
    dad: { name: 'Dad', syn: ['dad', 'father'], loc: 'living', take: false, fixed: 'He is heavier than the PC.', d: 'Dad, asleep on the sofa, with the look of a man who has got up early on a Saturday to do nothing specific. He is snoring at 56K.' },
    mom: { name: 'Mom', syn: ['mom', 'mum', 'mother', 'mam'], loc: 'kitchen', take: false, fixed: 'Nobody takes Mom anywhere. Mom takes herself.', d: () => F.bins ? 'Mom, pleased with you, which is a nice look on her. She keeps checking the bin bag is really gone.' : 'Mom. She has The Look. The Look says: bins. She has not said the word "bins". She does not need to.' },
    dave: { name: 'Dave', syn: ['dave', 'mate', 'friend'], loc: 'daveroom', take: false, fixed: 'Dave is not an item. Dave is barely a person.', d: () => F.book ? 'Dave, holding the pilot figure up to the light like it\'s a diamond. He is making the engine noise. He is going to be doing this all day.' : 'Dave. Your best mate, when he isn\'t being a git. He has a library book he\'s reading upside down and a blue lightspatula made from a kitchen roll tube. He keeps looking at the toy shop out of the window.' },
    shopkeeper: { name: 'shopkeeper', syn: ['shopkeeper', 'man', 'keeper', 'owner'], loc: 'shop', take: false, fixed: 'He\'s behind the counter and he\'s staying there.', d: 'The shopkeeper. He has seen everything, and he has priced it.' },
    tilllady: { name: 'till lady', syn: ['lady', 'woman', 'till', 'till lady', 'assistant'], loc: 'toyshop', take: false, fixed: 'No.', d: 'The till lady. She has sold four hundred pilot figures since nine o\'clock and has opinions about it.' },
    librarian: { name: 'librarian', syn: ['librarian', 'miss', 'lady'], loc: 'library', take: false, fixed: 'She has a stamp and she will use it.', d: 'The librarian. She looks at you over her glasses like you are already overdue.' },
    mrali: { name: Cast.n('teacher'), syn: ['ali', 'mr ali', 'teacher', 'sir', 'miss', Cast.slug('teacher'), Cast.n('teacher').toLowerCase()], loc: 'club', take: false, fixed: Cast.t('{teacher.He}\'s mid-program.'), d: Cast.t('{teacher}, computer club, Saturday hero. {teacher.He} is wearing a jumper with a diamond pattern and typing with two fingers faster than you can with ten.') }, // the Computer Club teacher (js/cast.js)
    mrbell: { name: 'Mr Bell', syn: ['bell', 'mr bell'], loc: null, take: false, d: 'Not here. It\'s Saturday. Even Mr Bell has a life. Probably.' },
    poster: { name: 'poster', syn: ['poster', 'film', 'movie'], loc: 'cinema', take: false, fixed: 'It\'s behind glass. Anyway, you\'ve got the small one on your wall.', d: 'The poster for the new space film. Big ships, a desert, a little boy who turns out to be important. You queued three hours on the 16th of July to see it. Worth it. Mostly.' },
    squig: { name: 'Big Blobbit', syn: ['squig', 'big squig', 'blobbit', 'big blobbit', 'blob', 'monster', 'beast'], loc: 'bridge', take: false, fixed: 'It is the size of a sofa and it is all mouth. You are not taking it anywhere.', d: 'The Big Blobbit. A round bouncy thing the size of a sofa, sitting on the bridge like it owns it (it does). It sniffs the air. It can smell... crisps? It looks hopeful.' },
    guard: { name: 'tin soldier', syn: ['guard', 'grot', 'grot guard', 'soldier', 'tin soldier', 'gatekeeper'], loc: 'gate', take: false, fixed: 'He is very stiff about it.', d: () => F.password ? 'The tin soldier, saluting you every time you walk past, with a little squeak.' : 'A tin soldier in a helmet with "GUARD" painted on it, in case he forgets. He is very proud of the password. He keeps looking at the gate, where it is scratched in.' },
    gatething: { name: 'gate', syn: ['gate', 'bath', 'door', 'car doors', 'bricks', 'dominoes'], loc: 'gate', take: false, fixed: 'It\'s a gate.', d: 'The gate: building bricks, dominoes, and a doll\'s bath. Scratched into the bath, in wobbly toy writing: "THE PASSWORD IS COWABUNGA. DONT TELL NOBODY. ESPESHULLY NOT GROWN-UPS." Helpful.' },
    trukk: { name: 'Big Truck', syn: ['trukk', 'truck', 'lorry', 'wagon', 'vehicle', 'big trukk', 'big truck', 'toy lorry'], loc: 'camp', take: false, fixed: 'It\'s a lorry.', d: () => F.painted ? 'The Big Truck, now RED, now FASTER. The toys keep patting it and nodding. The engine is running, because nobody knows how to turn it off.' : 'The Big Truck: a wind-up toy lorry the size of a real one, half a tractor, half a garden shed (toys don\'t do fractions). It is grey and sulky. The robot mechanic shakes his head at it. "Needs paint. Red paint. Then it goes."' },
    mekk: { name: 'robot mechanic', syn: ['mek', 'mekboy', 'mechanic', 'grimgob', 'robot', 'robot mechanic', 'sprocket'], loc: 'mek', take: false, fixed: 'Four arms. He would win.', d: 'Sprocket the robot mechanic. Four arms, two of them bolted on, all of them busy. He sells paint. Only red. "Other colours are a scam," he says, in a voice like a Speak & Smell.' },
    zog: { name: 'Big Zog', syn: ['zog', 'big zog', 'champion', 'ork', 'knight'], loc: 'arena', take: false, fixed: 'Big Zog takes YOU.', d: () => F.duel ? 'Big Zog, sitting on a tyre, looking at his drainpipe. "Fair play," he keeps saying. "Fair play."' : 'Big Zog, champion of the arena, a plastic knight as big as a wardrobe, holding a green drainpipe like a lightspatula and swinging it at the air. "WHO WANTS SOME," he says, to nobody. He wants somebody.' },
    bankgrot: { name: 'bank robot', syn: ['bank grot', 'teller', 'cashier', 'grot', 'bank robot', 'robot', 'clockwork robot'], loc: 'bank', take: false, fixed: 'He\'s in a piggy bank. That\'s the point of a bank.', d: 'The bank robot, a clockwork one, with a key in his back, a ledger and an abacus with half the beads missing. He counts your Rupees out loud. He is not good at counting. He needs winding up halfway.' },
    gubbinz: { name: 'Gubbinz', syn: ['gubbinz', 'gubbins', 'grot', 'pet'], loc: 'hidey', take: false, fixed: 'He\'s not a thing you take. He follows. (Mostly.)', d: () => F.gubbinz ? 'Gubbinz, your little green desktop pal, trotting along behind you with a biscuit, looking very pleased about everything.' : 'GUBBINZ! Your desktop pal! Sitting in his hidey hole, surrounded by stolen stuff, eating a biscuit. "Oh, hi!" he says. "What took you?"' },
    warboss: { name: 'King Gorzag', syn: ['warboss', 'gorzag', 'boss', 'big boss', 'king', 'king gorzag', 'teddy', 'bear', 'teddy bear'], loc: 'hut', take: false, fixed: 'He is three times your size and all of it is stuffing.', d: () => F.solved ? 'King Gorzag, holding the solved cube up to the light, speechless. For a talking teddy, speechless is a medical event.' : 'King Gorzag, the Teddy King. Three times your size, one button eye, and a tiny Rubrick\'s cube in his enormous soft paws, scrambled. "THE BIG SHINY THING," he says. "I HAVE BEEN TRYING FOR A YEAR. I HAVE PAWS." He looks like he might cry, or hug someone too hard.' },
    bigshiny: { name: 'Big Shiny Thing', syn: ['shiny', 'big shiny', 'shiny thing', 'big shiny thing', 'fing', 'thing', 'his cube', 'warlord cube', 'warlord\'s cube', 'king cube', 'king\'s cube'], loc: 'hut', take: false, fixed: 'The King closes his paw. "NO."', d: 'The Big Shiny Thing: a Rubrick\'s cube, a real one, the kind you can get in the corner shop for £4.99. Scrambled badly. One sticker is on upside down. The toys think it\'s a holy relic. It is, in a way.' },
    snotling: { name: 'baby Blobbit', syn: ['snotling', 'snot', 'baby blobbit', 'baby', 'blobbit', 'baby blob'], loc: 'deeper', take: false, fixed: 'It bites. Lovingly.', d: 'A baby Blobbit: a round bouncy critter about the size of a hamster, sitting on a toadstool it is slowly eating. It looks at you with enormous eyes. It offers you toadstool.' },
    oldpc: { name: 'old PC', syn: ['old pc', '486', 'computer', 'pc'], loc: 'garage', take: false, fixed: 'It weighs as much as a fridge. Dad carried it in. Dad was younger.', d: 'Dad\'s 486. A TURBO button on the front (it does nothing). GLOOM on 4 floppies in a sandwich bag taped to the side. Dad\'s best: E1M1 in 47 seconds. He brings this up at Christmas.' },
    mirror: { name: 'mirror', syn: ['mirror', 'reflection'], loc: 'bathroom', take: false, fixed: 'Seven years bad luck. You have had enough luck trouble.', d: 'You, in the mirror. You look like someone on a quest. You also look like someone who hasn\'t brushed their hair. Both are true.' },
    shelf: { name: 'computing shelf', syn: ['shelf', 'shelves', 'computing', 'books'], loc: 'library', take: false, fixed: 'It\'s screwed to the wall.', d: 'The COMPUTING shelf: "BASIC for Beginners" (you\'ve read it), "The Internet Explained" (out of date already), and "Programming Games in BASIC" (you\'ve read it twice). The PUZZLES shelf next to it has a gap. The card in the gap says: "THE CUBE: A COMPLETE SOLUTION. ON LOAN TO: DAVE."' },
    timetable: { name: 'timetable', syn: ['timetable', 'sign', 'bus'], loc: 'busstop', take: false, fixed: 'It\'s bolted on. Vandal-proof. Also truth-proof.', d: 'The timetable. 47: every 20 minutes. Someone has written "HA" next to it. Someone has written "HA" next to that.' },
    ducks: { name: 'ducks', syn: ['ducks', 'duck'], loc: 'pond', take: false, fixed: 'The ducks decline.', d: 'Four ducks, in a row, judging you.' },
    dog: { name: 'dog', syn: ['dog', 'mutt'], loc: 'park', take: false, fixed: 'The dog belongs to nobody. It\'s a principle.', d: 'The park dog. Nobody\'s. It has a stick and it is not sharing.' },
  };
  // ================================================================ state
  let F = {}, inv = [], room = 'bedroom', score = 0, moves = 0, loc = {};
  const reset = () => { F = { money: 0, teef: 0, queue: 0 }; inv = []; room = 'bedroom'; score = 0; moves = 0; loc = {}; for (const k in I) loc[k] = I[k].loc; };
  const AWARDS = { torch: 10, batteries: 10, portal: 15, bins: 10, crisps: 5, squig: 20, password: 10, tube: 5, felt: 5, saber: 15, duel: 30, paint: 10, trukk: 20, toy: 20, book: 25, gubbinz: 30, hut: 20, solved: 40, win: 50 };
  const MAX = Object.values(AWARDS).reduce((a, b) => a + b, 0); // 350
  let out = null;
  const say = s => out.push(s);
  const award = (k, msg) => { if (F['pts_' + k]) return; F['pts_' + k] = true; score += AWARDS[k]; if (msg) say(msg); say(`[Your score just went up by ${AWARDS[k]} points.]`); if (score >= 175 && !F.halfSecret) { F.halfSecret = true; S('quest.half'); } };
  const here = id => loc[id] === room, have = id => loc[id] === 'inv';
  const lit = () => !R[room].dark || (have('torch') && F.batteries);
  const itemsIn = r => Object.keys(I).filter(k => loc[k] === r && (!I[k].hideWhen || !I[k].hideWhen()));
  function look(full) {
    const r = R[room];
    say(`${r.name}`);
    if (!lit()) { say('It is pitch black. You can hear something small breathing. And giggling. Mostly giggling.'); return; }
    say(typeof r.d === 'function' ? r.d() : r.d);
    const vis = itemsIn(room).filter(k => I[k].take);
    if (vis.length) say('You can see: ' + vis.map(k => I[k].name).join(', ') + '.');
    if (room === 'bedroom' && F.gubbinz && !F.won) say('Gubbinz is poking the PC. "This one\'s only got Solitaire on. Where\'s the ULTRA 64?"');
    void full;
  }
  const NAMES = {}; for (const k in I) for (const s of I[k].syn) NAMES[s] = NAMES[s] || []; for (const k in I) for (const s of I[k].syn) NAMES[s].push(k);
  function find(words, wantHere) { // match an item by words (longest alias first)
    const txt = words.join(' ');
    let best = null, bestLen = 0;
    for (const s in NAMES) { if (txt === s || txt.endsWith(' ' + s) || txt.startsWith(s + ' ') || txt.includes(' ' + s + ' ')) { if (s.length > bestLen) { const cands = NAMES[s]; const pick = cands.find(k => have(k)) || cands.find(k => here(k)) || cands[0]; if (wantHere && !have(pick) && !here(pick)) { const alt = cands.find(k => here(k) || have(k)); if (alt) { best = alt; bestLen = s.length; } else if (!best) { best = pick; bestLen = s.length; } } else { best = pick; bestLen = s.length; } } } }
    return best;
  }
  const DIRS = { n: 'n', north: 'n', s: 's', south: 's', e: 'e', east: 'e', w: 'w', west: 'w', u: 'up', up: 'up', d: 'down', down: 'down', in: 'in', inside: 'in', enter: 'in', out: 'out', outside: 'out', exit: 'out', ne: 'ne', northeast: 'ne', nw: 'nw', northwest: 'nw', se: 'se', southeast: 'se', sw: 'sw', southwest: 'sw', under: 'under', underneath: 'under' };
  function go(dir) {
    const r = R[room]; let x = r.x[dir];
    if (dir === 'in' && !x && r.x.n && room === 'davedoor') x = r.x.n;
    if (!x) { say(['You can\'t go that way.', 'There\'s a wall there. Classic.', 'Not that way. Try the way the description said.', 'You walk into something. It was the direction "no".'][moves % 4]); return; }
    if (Array.isArray(x)) { const [to, flag, msg] = x; if (!F[flag]) { say(msg); return; } x = to; }
    if (room === 'queue' && dir === 'e' && F.queue > 0 && F.queue < 3) { say('If you leave the queue you lose your place. You stay in the queue. That\'s the rule. That\'s the whole rule.'); return; }
    if (x === 'hole' && !(have('torch') && F.batteries)) { say('You push through the gap in the socks. It is dark in there. Properly dark, cave dark. You can\'t see your own hand, and your hand is right there. You back out. You need a TORCH that works.'); return; }
    if (x === 'tunnelA' && !(have('torch') && F.batteries)) { say('The hole goes down into black. You can hear giggling. You are not going down there without a light.'); return; }
    if (x === 'parents') { say('You open the door, see the room, remember the rules, and shut the door again. Even on a quest.'); return; }
    room = x; moves++;
    if (room === 'hole') { if (!F.pts_portal) { S('quest.portal'); award('portal', 'You push through the socks, torch first... and you are not under your bed any more.'); } }
    if (room === 'hidey' && !F.gubbinz) { F.gubbinz = true; S('quest.gubbinz'); award('gubbinz', 'GUBBINZ! He\'s here! He looks up from his biscuit. "There you are! Took you long enough, boss. I was getting bored." He hops up and follows you. He is holding your ULTRA 64 memory card. You decide to discuss it later.'); }
    look();
  }
  // ================================================================ verbs
  function take(id, words) {
    if (!id) { say(`You can't see any ${words.join(' ') || 'such thing'} here.`); return; }
    if (have(id)) { say('You\'ve already got it.'); return; }
    if (!here(id)) { say(`You can't see any ${I[id].name} here.`); return; }
    if (!I[id].take) { say(I[id].fixed || 'You can\'t take that.'); return; }
    if (id === 'binbag' && F.bins) { say('The bin bag is in the bin. Where it lives now. Leave it.'); return; }
    loc[id] = 'inv'; say('Taken.');
    if (id === 'tube') award('tube', 'A wrapping-paper tube. Every kid knows what this is really for.');
    if (id === 'felt') award('felt', 'You take the red felt tip. Mr Bell will count them on Monday. You will deal with Monday on Monday.');
    if (id === 'torch') award('torch');
    if (id === 'cube') say('You put your cube in your pocket, where it goes.');
  }
  function drop(id) {
    if (!id || !have(id)) { say('You haven\'t got that.'); return; }
    if (id === 'money' || id === 'teef') { say('You are not dropping money. Mom raised you better.'); return; }
    loc[id] = room; say('Dropped.');
    if (id === 'crisps' && room === 'bridge') feedSquig();
    if (id === 'binbag' && room === 'garden') binsDone();
  }
  function feedSquig() { if (F.squigfed) return; F.squigfed = true; loc.crisps = null; loc.squig = 'pen'; award('squig', 'The Big Blobbit\'s nose twitches. Its eyes go wide. It leaves the bridge like a sofa falling down stairs, inhales the whole packet, bag and all, and bounces off towards the town going "BLOOP". The bridge is clear.'); }
  function binsDone() { if (F.bins) return; F.bins = true; loc.binbag = null; F.money = 5; loc.money = 'inv'; award('bins', 'You heave the bag into the wheelie bin. It makes the noise. Mom appears at the back door like she was summoned. "Didn\'t have to ask twice. Here." A FIVER. "Don\'t spend it all on rubbish." You will spend it all on rubbish.'); }
  function examine(id, words) {
    if (!words.length) { look(true); return; }
    if (!id) { const w = words.join(' '); if (/footprint/.test(w)) { say('Tiny green footprints. Four toes each. Gubbinz-sized. They go under the bed and they do not come back.'); return; } if (/photo/.test(w) && room === 'landing') { say('You, aged four, no front teeth, holding a plastic sword. Mom calls it "the warrior photo". You call it evidence.'); return; } if (/telly|tv|television/.test(w) && room === 'living') { say('The telly is showing a programme about people buying houses. Dad is asleep in front of it as a protest.'); return; } if (/n64|nintendo|console/.test(w) && room === 'living') { say('The ULTRA 64. The memory card slot is empty. Odd. You had a memory card. It had all your Goldenballs times on it. Where did it...?'); return; } if (/card|loan/.test(w) && room === 'library') { say('The loan card: "THE CUBE: A COMPLETE SOLUTION. ON LOAN TO: DAVE." In Dave\'s handwriting. The date is March.'); return; } say(`You can't see any ${w} here. Try looking around.`); return; }
    if (!have(id) && !here(id)) { say(`You can't see any ${I[id].name} here.`); return; }
    const d = I[id].d; say(typeof d === 'function' ? d() : d);
    if (id === 'drawer' && !F.drawer) return;
    if (id === 'drawer' && F.drawer && loc.torch === null && !have('torch')) { loc.torch = 'bedroom'; say('Under the napkin: your TORCH.'); }
    if (id === 'remote' && !F.batteries) say('You could TAKE THE BATTERIES. Carefully.');
    if (id === 'gatething') F.sawPassword = true;
  }
  function open(id, words) {
    if (!id) { if (/door|gate/.test(words.join(' '))) say('It\'s open, or it isn\'t yours, or it\'s a skip lid. Try GOing somewhere.'); else say('You can\'t open that.'); return; }
    if (id === 'drawer') { if (F.drawer) say('It\'s already open.'); else { F.drawer = true; say('You wiggle the drawer. It sticks, then gives all at once. Inside: pens, a broken Strollman, a napkin with cheat codes on, and your TORCH.'); loc.torch = 'bedroom'; } return; }
    if (id === 'remote') { takeBatteries(); return; }
    if (id === 'crisps') { if (have('crisps')) say('You open the crisps a tiny bit and smell them. Beef, and something else. Danger, maybe. You close them again. These are not for you.'); else say('You haven\'t got any crisps.'); return; }
    say('That doesn\'t open.');
  }
  function takeBatteries() { if (F.batteries) { say('The remote is already empty. Dad is already doomed.'); return; } if (room !== 'living') { say('The batteries are in the remote, in the living room, next to Dad.'); return; } F.batteries = true; loc.batteries = 'inv'; loc.torch === 'inv' || say('(You will need somewhere to put them. A torch, say.)'); award('batteries', 'You peel the tape off the back of the remote one millimetre at a time. Dad snores. You slide the batteries out. Dad snores louder, which is somehow worse. You have the BATTERIES.'); if (have('torch')) { say('You put them straight in the torch. Click. It works. Dad snores in approval.'); } }
  function use(a, b, words) {
    const w = words.join(' ');
    if (a === 'batteries' && (!b || b === 'torch')) { if (!have('torch')) { say('You need the torch first.'); return; } if (!have('batteries')) { say('You haven\'t got any batteries.'); return; } say('The batteries are in the torch. It works. Lovely.'); return; }
    if (a === 'torch') { if (!F.batteries) say('Click. Nothing. No batteries. It is a tube with a bulb on.'); else say('Click. A circle of light. ' + (R[room].dark ? 'Very useful down here.' : 'Not needed up here, but it looks cool.')); return; }
    if ((a === 'felt' && (b === 'tube' || !b)) || (a === 'tube' && (b === 'felt' || !b))) { makeSaber(); return; }
    if (a === 'crisps') { if (room === 'bridge' && !F.squigfed) { feedSquig(); return; } if (b === 'squig') { say('The Big Blobbit isn\'t here. It\'s on the bridge, being a sofa.'); return; } say('You could EAT them. You are not going to eat them. They are strategic crisps.'); return; }
    if (a === 'binbag') { if (room === 'garden') { binsDone(); return; } say('Take it to the wheelie bin in the back garden. You know the drill. You have known the drill since you were six.'); return; }
    if (a === 'paint') { if (b === 'trukk' || (!b && room === 'camp')) { paintTrukk(); return; } say('You could paint lots of things red. Only one of them needs it.'); return; }
    if (a === 'spanner') { if (room === 'camp') say('You hit the truck with the spanner. A toy robot nods approvingly. Nothing else happens. The robot keeps nodding. Its head is on a spring.'); else say('You wave the spanner about. It does not adjust.'); return; }
    if (a === 'saber') { if (room === 'arena' && !F.duel) { duel(); return; } say('VVVSHHHMMM. You swing it about. ' + (room === 'daveroom' ? 'Dave swings his back. You clash. His is blue. Yours is better.' : 'Nobody here needs duelling, but you look amazing.')); return; }
    if (a === 'cube' || a === 'bigshiny' || a === 'book') { solve(); return; }
    if (a === 'money') { say('You could BUY something with it. If there was a shop. Is there a shop?'); return; }
    if (a === 'teef') { say('Rupees are for buying. The robot mechanic sells paint. The bank robot sells nothing and is proud of it.'); return; }
    if (a === 'trukk') { driveTrukk(); return; }
    if (a === 'figure') { if (room === 'daveroom') { giveTo('figure', 'dave'); return; } say('You make it fly about and do the noise. Worth every penny.'); return; }
    if (a === 'remote') { takeBatteries(); return; }
    if (a === 'drawer') { open('drawer', []); return; }
    if (a === 'socks') { moveSocks(); return; }
    if (a === 'pc' || a === 'oldpc') { say(a === 'pc' ? 'You wiggle the mouse. The screen is still empty. No Gubbinz. The footprints go under the bed.' : 'You press the TURBO button. It does nothing. It has always done nothing. Dad says it "feels faster".'); return; }
    if (!a) { say(`Use what? ${w ? 'You can\'t see any ' + w + ' here.' : ''}`.trim()); return; }
    say(`You can't think how to use the ${I[a].name}${b ? ' on the ' + I[b].name : ''} here.`);
  }
  function makeSaber() { if (F.saber) { say('It\'s already a lightspatula. It doesn\'t get MORE lightspatula.'); return; } if (!have('tube')) { say('You need something long and tube-shaped. A wrapping-paper tube would be ideal, if one existed, in a cupboard, somewhere.'); return; } if (!have('felt')) { say('You hold up the tube. It\'s a tube. It needs colour. Red. Thick red. The kind of red felt tip a maths teacher would keep in a pot.'); return; } F.saber = true; loc.tube = null; loc.felt = null; loc.saber = 'inv'; S('quest.saber'); award('saber', 'You colour the tube red, all the way round, twice, until the felt tip squeaks and dies. You draw a handle on with biro. You hold it up. VVVSHHHMMM. It is a LIGHTSPATULA and it is the best thing you have ever made.'); }
  function moveSocks() { if (room !== 'underbed') { say('The socks are under the bed. Everything is under the bed.'); return; } if (F.socks) { say('The socks have been moved. There\'s a gap. There is also, now, a smell.'); return; } F.socks = true; say('You dig into the wall of socks. It takes a while. It\'s warm in there, and there is a smell you will remember on your deathbed. Behind the socks, where the wall of your bedroom should be... isn\'t. There is a GAP, and beyond it, darkness, and giggling. It goes EAST.'); }
  function duel() {
    if (room !== 'arena') { say('There\'s no one to duel here. Well, there is, but Mom would find out.'); return; }
    if (F.duel) { say('Big Zog shakes his head. "Nah. Once. Fair play." He means it.'); return; }
    if (!have('saber')) { say('Big Zog looks at your empty hands and laughs so hard his visor falls off. "WITH WHAT?" You need a lightspatula. A proper one. Made of cardboard.'); return; }
    F.duel = true; F.teef = (F.teef || 0) + 10; loc.teef = 'inv';
    award('duel', 'You step into the ring. Big Zog swings his drainpipe. You duck. You swing your tube. VVVSHHM. He swings. CLACK. The crowd roars. You jump, you spin (you fall over, you get up, you pretend the fall was the spin), and you bop him on the head. "OW," says Big Zog. "...FAIR PLAY." He sits down. The crowd throws Rupees at you. You collect TEN RUPEES. You are the champion of a ring of tyres.');
  }
  function buy(id, words) {
    const w = words.join(' ');
    if (room === 'shop') { if (!/crisp|squig|alien|snack|packet/.test(w) && id !== 'crisps') { say('"We\'ve got crisps," says the shopkeeper, not looking up. "Alien flavour. New." He makes it sound like a threat.'); return; } if (have('crisps')) { say('You\'ve got crisps. One packet is enough. One packet is PLENTY.'); return; } if (F.money < 0.5) { say('"Fifty pee," says the shopkeeper. You have ' + (F.money ? '£' + F.money.toFixed(2) : 'no money. Mom has money. Mom has bins.') + '.'); return; } F.money -= 0.5; loc.crisps = 'inv'; award('crisps', 'Fifty pee. The shopkeeper hands them over like they\'re evidence. "Don\'t eat them in here." You have the ALIEN-FLAVOUR CRISPS.'); return; }
    if (room === 'toyshop') { if (have('figure')) { say('"One per customer," says the till lady, "and I\'ve got a photographic memory."'); return; } if (F.money < 3.99) { say('"Three ninety-nine," says the till lady. You have £' + F.money.toFixed(2) + '. She looks at you like a sum.'); return; } F.money -= 3.99; loc.figure = 'inv'; award('toy', 'Three ninety-nine. The till lady puts it in a tiny bag. "Last one. You\'re lucky." You are. You have the PILOT FIGURE. Somewhere, Dave\'s heart beats faster and he doesn\'t know why.'); return; }
    if (room === 'mek') { if (!/paint|red/.test(w) && id !== 'paint') { say('"PAINT," says the robot. "RED. THAT IS WHAT I SELL. BEEP." He has four arms and uses all of them to point at the paint.'); return; } if (have('paint') || F.painted) { say('"One tin is enough for anything," says the robot. "Unless it is a Dread Scone."'); return; } if ((F.teef || 0) < 5) { say(`"FIVE ROOPEEZ," says the robot. You have ${F.teef || 0}. "Go win some. Arena\'s that way." He points with two arms.`); return; } F.teef -= 5; if (!F.teef) loc.teef = null; loc.paint = 'inv'; award('paint', 'Five Rupees, counted twice by the robot (he gets a different number each time, settles on five). He hands you a TIN OF RED PAINT with the lid already half off. "Don\'t drink it."'); return; }
    if (room === 'bank') { say('"NO LOANS," says the bank robot, before you\'ve said anything.'); return; }
    say('There\'s nothing to buy here. There\'s barely anything to look at.');
  }
  function giveTo(id, who) {
    if (!id || !have(id)) { say('You haven\'t got that.'); return; }
    if (who === 'dave' && room === 'daveroom') {
      if (id === 'figure') { if (F.book) { say('Dave already has the figure. He\'s still making the noise.'); return; } F.book = true; loc.figure = null; loc.book = 'inv'; award('book', 'Dave\'s eyes go like the pilot\'s helmet: big and round. "No WAY." He grabs it. He makes the engine noise. He pushes the library book at you without looking. "Have it. Have anything. HAVE MY BIKE." You take the BOOK. Just the book.'); return; }
      if (id === 'crisps') { say('Dave opens his mouth. You close the crisps. "Those are strategic," you say. Dave does not understand, but respects it.'); return; }
      say('Dave looks at it. "What do I want that for?" Good question.'); return;
    }
    if (who === 'squig' && room === 'bridge') { if (id === 'crisps') { feedSquig(); return; } say('The Big Blobbit sniffs it, decides it isn\'t crisps, and ignores you with its whole body.'); return; }
    if (who === 'mom') { if (id === 'binbag') { say('"Not to ME," says Mom. "To the BIN. Outside. Where bins go." You\'ve had this conversation before.'); return; } say('"That\'s nice, love," says Mom. "Bins."'); return; }
    if (who === 'gubbinz' && F.gubbinz) { say('Gubbinz takes it, sniffs it, and gives it back. "Not a biscuit. Not a Wotsitz. What\'s it FOR?" Fair.'); return; }
    if (who === 'warboss' && room === 'hut') { if (id === 'cube') { say('You offer your own cube. The King looks at it, solved, then at his, scrambled, and makes a noise like a squeaky toy. "THAT ONE IS DONE. I WANT MINE DONE." Fair enough.'); return; } if (id === 'book') { say('The King holds the book upside down, like Dave did. "WHAT IS THIS? PICTURES OF THE SHINY THING?" He hands it back. He wants it SOLVED. By you. Now.'); return; } }
    if (who === 'mekk' && room === 'mek' && id === 'teef') { buy('paint', ['paint']); return; }
    if (who === 'zog' && room === 'arena') { say('Big Zog is not interested in things. Big Zog is interested in a FIGHT.'); return; }
    say(who ? 'They don\'t want it.' : 'Give it to whom?');
  }
  function talk(who, words) {
    const w = words.join(' ');
    if (!who) { if (/myself|me/.test(w)) say('You talk to yourself. You say "right". It helps.'); else say('There\'s nobody here who\'s listening. The mushrooms might be.'); return; }
    if (!here(who) && !(who === 'gubbinz' && F.gubbinz)) { say(`${I[who].name} isn't here.`); return; }
    const T = {
      mom: () => F.bins ? '"You\'ve done the bins. I\'ve noticed. Don\'t let it go to your head. Tea\'s at six."' : '"Jack." A pause. "Bins." That is the whole conversation. It has been the whole conversation for years.',
      dad: () => 'You say "Dad". Dad says "mmf". You say "Dad, Gubbinz has gone under the bed." Dad says "that\'s nice". He is asleep. He has been asleep since you said Dad.',
      dave: () => F.book ? 'Dave is doing the engine noise. He can\'t talk and do the noise. He chooses the noise.' : '"Alright," says Dave. "Have you been to the toy shop? Queue\'s massive. I\'m not queueing. I\'m not QUEUEING, Jack." He looks out of the window at the queue again. He would give anything for one of those figures. He says so, every four minutes.',
      shopkeeper: () => '"Crisps are fifty pee," says the shopkeeper. "Alien flavour. Don\'t ask me what an alien tastes of. Ask NASSA."',
      tilllady: () => '"One per customer. Three ninety-nine. No, we haven\'t got the big ship. No, I don\'t know when."',
      librarian: () => '"If you\'re after the cube book, it\'s out. To DAVE." She says Dave\'s name the way you say "homework". "Since MARCH."',
      mrali: () => '"Jack! Have you looked at SUBs? Put the spaceship-drawing in a SUB. Then you can draw a spaceship anywhere. Imagine that. A spaceship ANYWHERE." ' + Cast.He('teacher') + ' has never been happier. "Oh, and if you\'re stuck on a puzzle, the library has books. Books are just programs that run in your head."',
      snotling: () => 'The baby Blobbit says "bloop". It is the most intelligent thing anyone has said to you today.',
      squig: () => 'You say "nice Blobbit". The Blobbit says "BLOOP". You both understand each other and you both know you aren\'t crossing.',
      guard: () => F.password ? '"COWABUNGA," says the tin soldier, saluting with a squeak. "PASS, FRIEND." He is thrilled.' : '"PASSWORD." That\'s all he says. He\'s very committed. You could SAY one, if you knew it. (Someone has scratched something on the gate.)',
      mekk: () => '"RED PAINT. FIVE ROOPEEZ. RED ONES GO FASTER. IT IS SCIENCE." He hits something with a spanner to prove it.',
      zog: () => F.duel ? '"FAIR PLAY," says Big Zog. He will be saying this for weeks.' : '"WHO WANTS SOME?" Big Zog swings his drainpipe. You, apparently. If you had a lightspatula. (A FIGHT would need one.)',
      bankgrot: () => `"You got ${F.teef || 0} Rupees," says the bank robot, after counting your pockets with his eyes. "No loans." You hadn't asked.`,
      gubbinz: () => F.gubbinz ? '"Right, boss," says Gubbinz. "Where are we going? Is there Wotsitz? Is there BISCUITS?" He is holding your memory card. You will discuss it later.' : '"Hi!"',
      warboss: () => F.solved ? '"...DO IT AGAIN," says the King, very quietly. "ON THE TOWER. WHERE THEY CAN ALL SEE." He points up. Everyone points up. The truck is outside.' : '"THE BIG SHINY THING," says the King, holding it up. "THE KING BEFORE ME COULDN\'T DO IT. THE KING BEFORE HIM NEITHER. I HAVE TRIED FOR A YEAR." He stares at you. "YOU\'RE A HUMAN. HUMANS HAVE FINGERS. SOLVE IT." It is not a request.',
    };
    say(T[who] ? T[who]() : `You talk to the ${I[who].name}. It's not much of a conversation.`);
  }
  function sayWord(words) {
    const w = words.join(' ').toUpperCase().replace(/[^A-Z]/g, '');
    const pw = w === 'COWABUNGA' || w === 'WAAAGH' || w === 'WAAGH' || w === 'WAAAAGH'; // WAAAGH was the old password (old walkthroughs still work)
    if (room === 'gate' && !F.password) { if (pw) { F.password = true; const said = w === 'COWABUNGA' ? 'COWABUNGA' : 'WAAAGH'; award('password', `"${said}!" you say. "${said}!" says the tin soldier, delighted, and the whole town behind the gate shouts it back, and a mushroom falls over. The gate (the bath) swings open. You\'re in.`); return; } say(`"${words.join(' ')}?" says the tin soldier. "THAT\'S NOT IT." He looks at the gate, where it\'s scratched in, then back at you, worried you've noticed.`); return; }
    if (pw) { say(`"${w === 'COWABUNGA' ? 'COWABUNGA' : 'WAAAGH'}!" ` + (room.startsWith('tunnel') || /camp|mek|pen|arena|bank|hut|gate|bridge|forest|hole|deeper|tower|hidey/.test(room) ? 'Every toy within earshot shouts it back. It is like being in a football crowd made of plastic.' : 'Nobody shouts it back. Dave would have. Dave is at home.')); return; }
    if (w === 'XYZZY' || w === 'PLUGH') { say('A hollow voice says "fool". Then, quieter: "...but a nice try."'); return; }
    say(`You say "${words.join(' ')}". ${room === 'living' ? 'Dad snores in reply.' : 'Nobody answers. It\'s that kind of day.'}`);
  }
  function paintTrukk() { if (room !== 'camp') { say('The truck is in the town square, being grey.'); return; } if (F.painted) { say('It is already red. Redder would just be red again.'); return; } if (!have('paint')) { say('You need RED PAINT. The robot mechanic sells it. Only red. He is clear on this.'); return; } F.painted = true; loc.paint = null; award('trukk', 'You paint the truck red. All of it, badly, with your hands, because there is no brush. The toys gather round. A teddy cries. The engine winds itself up BY ITSELF. It is FASTER now. Everyone can tell. Red ones go faster. "DRIVE IT," says the robot mechanic. "DRIVE IT TO THE TOWER."'); }
  function driveTrukk() { if (room !== 'camp') { say('The truck is in the town square. You can\'t drive it from here. You\'ve tried that with Dad\'s car.'); return; } if (!F.painted) { say('You climb into the truck and turn the big wind-up key. It coughs, sulks, and goes nowhere. The robot mechanic shakes his head. "GREY. NEEDS PAINT. RED. THEN IT GOES."'); return; } if (!F.solved) { say('You rev the truck. It roars. Where to? The Block Tower is for kings, and you are not one yet: the King in the cardboard castle has a Big Shiny Thing he wants sorting first.'); return; } say('You drive the truck. It is faster. It is MUCH faster. Toy soldiers run alongside cheering, then can\'t keep up, then are specks. The Block Tower rushes at you. You go up the ramp, round and round, and out onto the top.'); room = 'tower'; moves++; look(); }
  function solve() {
    if (room !== 'hut' && room !== 'tower') { if (have('cube')) say('You solve your own cube. 58 seconds. Still under a minute. Still want it on the record.'); else say('There\'s nothing to solve here, except why you are under your bed on a Saturday.'); return; }
    if (room === 'hut') {
      if (F.solved) { say('It\'s solved. The King wants you to do it AGAIN, on the TOWER, where everyone can see. Take the truck.'); return; }
      if (!have('book')) { say('The King hands you the Big Shiny Thing. You turn it. You turn it again. You get one side done and lose it again. The toys groan. You can solve YOUR cube because you know YOUR cube; this one is scrambled like Dave did it. You need the method written down. A BOOK, say.'); return; }
      F.solved = true; award('solved', 'You open the book on your knee, the King breathing on your neck (he smells of the bottom of a toy box). Page one: the cross. Page two: the corners. The toys go quiet. Page nine: the last layer, the bit with the algorithm you always forget. You do it. You do it twice. Click. Click. Click. SOLVED. Every face one colour. The King makes a noise like a squeaky toy being sat on. "...THE BIG SHINY THING. IS DONE." He holds it up. "AGAIN. ON THE TOWER. WHERE THEY CAN ALL SEE."');
      return;
    }
    if (room === 'tower') { if (F.won) { say('You did it. You can stop now. You\'re the Toy King. Kings rest.'); return; } F.won = true; award('win', 'On top of the Block Tower, with every toy in the kingdom looking up, you take the Big Shiny Thing, scrambled again by the King on the way up (he couldn\'t help himself). The cross. The corners. The last layer. Click. Click. Click. You hold it up. One colour a side. The cheer starts at the bottom of the tower and comes up like weather. "HOORAAAAAAY!" Gubbinz, on your shoulder, shouts loudest. King Gorzag takes off his crown (a cardboard one, with felt-tip jewels) and puts it on your head. It covers your whole face. "KING," he says. Everyone says it. You are the TOY KING.'); S('quest.win'); say(`\n*** You have won, with ${score} out of ${MAX} points. ***\n\nYou go home for tea. Gubbinz comes too. The ULTRA 64 memory card is "found" under the sofa. Mom asks why you smell of mushrooms. You say "quest". She says "bins". It is still Saturday.\n\n(Type QUIT to leave, or keep wandering about. Kings can do what they like.)`); return; }
  }
  function wait() {
    if (room === 'queue' && !F.queued) { F.queue = (F.queue || 0) + 1; const m = ['You wait. The queue moves four feet. A dad in front of you says "typical". Everyone agrees. You are now near the corner.', 'You wait. A kid behind you explains the whole film to his little sister. He gets it wrong. You don\'t correct him. You\'re a bigger person now. The queue shuffles. You can see the door!', 'You wait. The door is right there. The till lady comes out and says "ONE EACH" to the whole queue like a judge. The dad in front goes in. Then it\'s YOU. You\'re at the front. You can go IN.'][Math.min(2, F.queue - 1)]; if (F.queue >= 3) { F.queued = true; S('quest.queue'); } say(m); return; }
    say(['Time passes.', 'You wait. Nothing happens, which is sometimes the point.', 'You wait. Somewhere, a modem connects.', 'You wait. It\'s very 1999 of you.'][moves % 4]);
  }
  function inventory() { const list = Object.keys(I).filter(k => loc[k] === 'inv'); if (!list.length) { say('You are carrying nothing. Not even a sense of direction.'); return; } say('You are carrying:'); list.forEach(k => say('  ' + (k === 'money' ? `£${F.money.toFixed(2)}` : k === 'teef' ? `${F.teef} Rupees` : I[k].name) + (k === 'torch' ? (F.batteries ? ' (working)' : ' (no batteries)') : ''))); if (F.gubbinz) say('Gubbinz is with you, holding a biscuit and your memory card.'); }
  function hint() {
    score = Math.max(0, score - 5);
    const h = !F.drawer ? 'The torch is in the desk drawer in your bedroom. Drawers OPEN.' : !have('torch') ? 'Take the torch.' : !F.batteries ? 'Torches need batteries. The telly remote has some. Dad is asleep. Be sneaky: TAKE BATTERIES in the living room.' : !F.socks ? 'Go under the bed and MOVE the SOCKS.' : !F.bins ? 'Mom wants the bins done. Take the bin bag from the kitchen to the back garden and DROP it (or PUT it in the BIN). There is money in it for you.' : !have('crisps') && !F.squigfed ? 'The corner shop sells alien-flavour crisps. Blobbits will eat anything crisp-shaped. BUY them.' : !F.squigfed ? 'The Big Blobbit on the ruler bridge is hungry. GIVE it the crisps.' : !F.password ? 'EXAMINE the gate of the Toy Fort. Then SAY the password.' : !F.saber ? (have('tube') ? 'The tube needs colouring. Red. There is a red felt tip in Mr Bell\'s classroom at school. Then USE FELT ON TUBE.' : 'There is a wrapping-paper tube in the airing cupboard on the landing. It is a lightspatula waiting to happen.') : !F.duel ? 'Big Zog in the Arena wants a FIGHT. You have a lightspatula. FIGHT ZOG.' : !F.painted ? (have('paint') ? 'PAINT the TRUCK in the town square.' : 'The robot mechanic sells red paint for 5 Rupees. BUY PAINT.') : !F.gubbinz ? 'Gubbinz is in the Toy Tunnels, DOWN from the town square. Follow the arrows and the smell of biscuits.' : !F.hutopen ? 'The King\'s castle door is shut. Gubbinz can get through tiny gaps. ASK GUBBINZ to OPEN the DOOR, or just try to go EAST with him.' : !have('book') ? (F.queued ? 'Dave wants a pilot figure from the toy shop. BUY one and GIVE it to DAVE for the book.' : 'The cube book is on loan to Dave. Dave wants a pilot figure. The toy shop has a queue. Join it and WAIT.') : !F.solved ? 'SOLVE the CUBE in the King\'s castle, with the book.' : !F.won ? 'DRIVE the TRUCK to the tower, then SOLVE the CUBE up there.' : 'You have won. Go and have your tea.';
    say('HINT (that cost you 5 points): ' + h);
  }
  const RUDE = /\b(crap|bloody|damn|hell|bugger|bollocks|arse|fart|poo|wee|bum|git|sod|shit|fuck|bastard|dick|willy|knob|wank|piss|twat|prat|bugger)\w*/i;
  // ================================================================ parser
  const VERBS = {
    look: ['look', 'l', 'la', 'see'], examine: ['examine', 'x', 'inspect', 'read', 'check', 'study', 'search', 'investigate', 'describe'], take: ['take', 'get', 'grab', 'pick', 'steal', 'pinch', 'nick', 'collect', 'carry'], drop: ['drop', 'discard', 'leave', 'dump'], inventory: ['inventory', 'i', 'inv', 'pockets'], open: ['open', 'unlock', 'wiggle'], close: ['close', 'shut'], use: ['use', 'apply', 'combine', 'put', 'insert', 'place', 'colour', 'color', 'draw', 'make', 'build', 'light', 'switch', 'turn'], give: ['give', 'offer', 'hand', 'feed', 'trade', 'swap', 'sell', 'pay'], talk: ['talk', 'speak', 'ask', 'say', 'tell', 'shout', 'yell', 'call', 'chat'], wait: ['wait', 'z', 'queue', 'stand'], score: ['score', 'points'], save: ['save'], restore: ['restore', 'load'], help: ['help', '?', 'commands', 'verbs'], hint: ['hint', 'clue', 'stuck'], quit: ['quit', 'q', 'exit', 'bye'], buy: ['buy', 'purchase', 'shop'], eat: ['eat', 'drink', 'taste', 'lick', 'chew'], move: ['move', 'push', 'pull', 'dig', 'shift', 'lift', 'climb', 'crawl', 'squeeze', 'remove'], throw: ['throw', 'lob', 'chuck', 'toss', 'fling'], fight: ['fight', 'duel', 'attack', 'hit', 'kill', 'swing', 'battle', 'challenge', 'bop', 'whack', 'strike', 'punch', 'kick'], paint: ['paint'], drive: ['drive', 'start', 'ride'], solve: ['solve', 'do', 'finish', 'complete', 'fix'], go: ['go', 'walk', 'run', 'head', 'travel', 'move to'], listen: ['listen', 'hear'], smell: ['smell', 'sniff'], sleep: ['sleep', 'nap', 'rest', 'lie'], sing: ['sing', 'dance', 'hum', 'whistle'], jump: ['jump', 'hop', 'bounce'], pet: ['pet', 'stroke', 'hug', 'cuddle', 'kiss', 'tickle', 'pat'], wear: ['wear', 'put on'], again: ['again', 'g'], xyzzy: ['xyzzy', 'plugh', 'plover'], waaagh: ['waaagh', 'waagh', 'waaaagh', 'cowabunga'], pray: ['pray', 'wish', 'hope'], swim: ['swim', 'dive'], turbo: ['turbo'], dir: ['dir', 'ls', 'cls'],
  };
  const V = {}; for (const v in VERBS) for (const w of VERBS[v]) V[w] = v;
  let lastCmd = '';
  function parse(line) {
    let s = line.trim().toLowerCase().replace(/[^a-z0-9' £.?-]/g, ' ').replace(/\s+/g, ' ');
    if (!s) return;
    if (RUDE.test(s)) { say('The game stops. The game looks at you. The game says: "Does your Mom know you type like that?" The game continues, but it remembers. (Dave got this message 14 times.)'); S('quest.rude'); return; }
    if (s === 'again' || s === 'g') { if (!lastCmd) { say('Again what?'); return; } s = lastCmd; } else lastCmd = s;
    let words = s.split(' ').filter(w => !['a', 'an', 'the', 'to', 'at', 'with', 'on', 'in', 'into', 'onto', 'up', 'of', 'some', 'my', 'please', 'then', 'and', 'from', 'off', 'out'].includes(w) || ['up', 'in', 'out', 'off'].includes(w));
    // "go north" / "north" / "n"
    if (DIRS[words[0]] && words.length === 1) { go(DIRS[words[0]]); return; }
    if ((words[0] === 'go' || words[0] === 'walk' || words[0] === 'run' || words[0] === 'head' || words[0] === 'climb' || words[0] === 'crawl') && DIRS[words[1]]) { go(DIRS[words[1]]); return; }
    if (words[0] === 'go' && words[1] === 'under') { go('under'); return; }
    if (words[0] === 'go' || words[0] === 'walk') { if (words[1] === 'bed' || words[1] === 'under') { go('under'); return; } say('Go where? Try a direction: N, S, E, W, UP, DOWN, IN, OUT.'); return; }
    let verb = V[words[0]]; let rest = words.slice(1);
    if (words[0] === 'pick' && rest[0] === 'up') rest = rest.slice(1);
    if (words[0] === 'put' && rest[rest.length - 1] === 'on' && rest.length === 2) { verb = 'wear'; rest = rest.slice(0, 1); }
    if (words[0] === 'turn' && rest[0] === 'on') { verb = 'use'; rest = rest.slice(1); }
    if (words[0] === 'switch' && (rest[0] === 'on' || rest[0] === 'off')) { verb = 'use'; rest = rest.slice(1); }
    if (words[0] === 'climb' && rest[0] === 'under') { go('under'); return; }
    if (words[0] === 'look' && (rest[0] === 'under' || rest[0] === 'at' || rest[0] === 'in')) { verb = 'examine'; rest = rest.slice(1); if (!rest.length) { go('under'); return; } }
    if (words[0] === 'look' && rest.length) { verb = 'examine'; }
    if (!verb) {
      if (find(words)) { say(`What do you want to do with the ${I[find(words)].name}?`); return; }
      say(['I don\'t know the word "' + words[0] + '".', 'I don\'t understand that. (Neither would Dave.)', 'That\'s not a verb I know. Try HELP.'][moves % 3]); return;
    }
    const A1 = find(rest, true);
    switch (verb) {
      case 'look': look(true); break;
      case 'examine': examine(A1, rest); break;
      case 'take': { if (/batter/.test(rest.join(' ')) && !F.batteries) { takeBatteries(); break; } if (!rest.length) { say('Take what?'); break; } if (rest[0] === 'all' || rest[0] === 'everything') { const vis = itemsIn(room).filter(k => I[k].take); if (!vis.length) { say('There\'s nothing here to take.'); break; } vis.forEach(k => { say(I[k].name + ': '); take(k, [k]); }); break; } take(A1, rest); break; }
      case 'drop': drop(A1); break;
      case 'inventory': inventory(); break;
      case 'open': open(A1, rest); break;
      case 'close': say(A1 === 'drawer' ? 'You shut the drawer. It springs open again. It\'s that kind of drawer.' : 'There\'s nothing to close.'); break;
      case 'use': { const r2 = rest.join(' '); const parts = r2.split(/ (?:on|with|in|into|onto|to) /); const a = find(parts[0].split(' '), true), b = parts[1] ? find(parts[1].split(' '), true) : null; if (words[0] === 'put' && (b === 'binbag' || /bin/.test(parts[1] || '')) && a === 'binbag') { if (room === 'garden') binsDone(); else say('The wheelie bin is in the back garden.'); break; } if ((words[0] === 'put' || words[0] === 'insert') && a === 'batteries' && (b === 'torch' || !b)) { use('batteries', 'torch', rest); break; } if (words[0] === 'make' && /saber|sabre|sword/.test(r2)) { makeSaber(); break; } if (words[0] === 'draw' || words[0] === 'colour' || words[0] === 'color') { if (a === 'tube' || b === 'tube' || /tube/.test(r2)) { makeSaber(); break; } } if (words[0] === 'light' && !a) { use('torch', null, rest); break; } use(a, b, rest); break; }
      case 'give': { const r2 = rest.join(' '); const m = /^(.*?) (?:to )?(dave|mom|mum|squig|big blobbit|blobbit|gubbinz|warboss|gorzag|king|teddy|mek|robot|zog|knight|guard|soldier|grot|shopkeeper|lady|librarian|ali|snotling|dad)$/.exec(r2); if (m) { const whoId = find(m[2].split(' ')); giveTo(find(m[1].split(' '), true), whoId); } else if (words[0] === 'feed') { if (/squig|blobbit|blob/.test(r2) || room === 'bridge') giveTo('crisps', 'squig'); else say('Feed what to whom?'); } else if (words[0] === 'pay') { buy(A1, rest); } else { const b = find(rest, true); if (b === 'squig') giveTo('crisps', 'squig'); else giveTo(b, room === 'daveroom' ? 'dave' : room === 'bridge' ? 'squig' : room === 'kitchen' ? 'mom' : null); } break; }
      case 'talk': { const r2 = rest.join(' '); if (words[0] === 'say' || words[0] === 'shout' || words[0] === 'yell') { sayWord(rest); break; } if (words[0] === 'ask' && /about/.test(r2)) { const [whoW, what] = r2.split(' about '); const who = find(whoW.split(' ')); if (who === 'gubbinz' && /door|hut|gap|castle|drawbridge/.test(what)) { openHut(); break; } if (who === 'mrali' && /cube|puzzle|book/.test(what)) { say('"The library," says ' + Cast.n('teacher') + ', "has a book on it. Had. It\'s out. To Dave, I\'d bet."'); break; } if (who === 'dave' && /book|cube/.test(what)) { say('"This?" Dave waves the book. "It\'s upside down. Can\'t make head nor tail. What\'ll you give me for it?" He looks out of the window at the toy shop queue again.'); break; } if (who === 'librarian' && /dave|book|cube/.test(what)) { say('"DAVE," says the librarian. "Since MARCH."'); break; } if (who === 'guard' && /password/.test(what)) { say('"NOT TELLIN\'," says the guard, glancing at the bath. "IT\'S SECRET. IT\'S SCRATCHED ON THE... IT\'S SECRET."'); break; } talk(who, rest); break; } if (/password/.test(r2) && room === 'gate') { say('You could just SAY it. If you knew it. The gate might know it.'); break; } const who = find(rest, true) || (F.gubbinz && /gubbinz/.test(r2) ? 'gubbinz' : null); talk(who, rest); break; }
      case 'wait': wait(); break;
      case 'score': say(`Your score is ${score} out of ${MAX}, in ${moves} moves. ${score >= MAX ? 'TOY KING.' : score >= 250 ? 'Nearly King.' : score >= 150 ? 'Knight.' : score >= 60 ? 'Squire.' : 'Tin Soldier.'}`); break;
      case 'save': { try { localStorage.setItem(SAVEKEY, JSON.stringify({ F, inv, room, score, moves, loc })); say('Saved. (To the hard disk. The real one. It\'ll be there next time.)'); } catch (e) { say('Save failed. The disk is full of Dad\'s GLOOM.'); } break; }
      case 'restore': { const d = A.store.get(SAVEKEY, null); if (!d || !d.loc) { say('There\'s no saved game. Start again, like everyone does.'); break; } F = d.F || {}; room = R[d.room] ? d.room : 'bedroom'; score = +d.score || 0; moves = +d.moves || 0; loc = {}; for (const k in I) loc[k] = d.loc[k] === undefined ? I[k].loc : d.loc[k]; say('Restored.'); look(); break; }
      case 'help': say('JACK QUEST understands short sentences: LOOK, EXAMINE thing (X), TAKE thing, DROP thing, OPEN thing, USE thing ON thing, GIVE thing TO person, TALK TO person, ASK person ABOUT thing, SAY word, BUY thing, FIGHT person, WAIT (Z), INVENTORY (I), SCORE, SAVE, RESTORE, HINT (costs 5 points), QUIT.\nDirections: N S E W NE NW SE SW UP DOWN IN OUT (or GO NORTH, and so on).\nExamine EVERYTHING. Twice. Snacks are important. Mom is not a puzzle.'); break;
      case 'hint': hint(); break;
      case 'quit': return 'quit';
      case 'buy': buy(A1, rest); break;
      case 'eat': { if (A1 === 'crisps' && have('crisps')) { say('You eat one crisp. It tastes of beef, green, and a slight electric shock. You put the bag away. These are not for you. They are for something with more mouth.'); break; } if (/toadstool|mushroom/.test(rest.join(' '))) { say('You do not eat the toadstool. The baby Blobbit looks disappointed, then eats your bit.'); break; } say('You\'re not eating that.'); break; }
      case 'move': { if (A1 === 'socks' || /sock/.test(rest.join(' ')) || (!rest.length && room === 'underbed')) { moveSocks(); break; } if (/bed/.test(rest.join(' ')) && room === 'bedroom') { go('under'); break; } if (!rest.length) { say('Move what?'); break; } say(A1 ? `You push the ${I[A1].name} about a bit. It's roughly where it was.` : 'You can\'t move that.'); break; }
      case 'throw': { if (A1 === 'crisps' && room === 'bridge') { feedSquig(); break; } if (A1 && have(A1)) { if (A1 === 'cube') { say('You do not throw your cube. You are not an animal.'); break; } loc[A1] = room; say(`You throw the ${I[A1].name}. It lands nearby. It looks at you, reproachfully, from the floor.`); break; } say('Throw what?'); break; }
      case 'fight': { if (room === 'arena') { duel(); break; } if (A1 === 'dave') { say('You and Dave have a lightspatula fight, or you would if you had one. Dave wins by default. He gloats. This is why you need a lightspatula.'); break; } if (A1 === 'squig') { say('You consider fighting the Big Blobbit. The Big Blobbit considers sitting on you. You both decide against it. Crisps would be better.'); break; } if (A1 === 'warboss') { say('You think about it. Then you look at the size of his paws. Then you think about something else.'); break; } if (A1 === 'guard') { say('The tin soldier hides in the bath. "NO FIGHTING. PASSWORD."'); break; } if (A1 === 'trukk' && have('spanner')) { use('spanner', null, rest); break; } say(A1 ? `You hit the ${I[A1].name}. It achieves nothing, which is what hitting things usually achieves.` : 'Fight what? With what? You are a child.'); break; }
      case 'paint': paintTrukk(); break;
      case 'drive': driveTrukk(); break;
      case 'solve': { if (/bins?|rubbish/.test(rest.join(' '))) { use('binbag', null, rest); break; } solve(); break; }
      case 'listen': say(room === 'living' ? 'Dad snores. It sounds like a 56K modem trying to connect to a fax machine.' : room.startsWith('tunnel') ? 'Giggling. Scratching. Something eating a biscuit, very near.' : /camp|arena|mek|pen|gate|bank|hut/.test(room) ? 'Wind-up keys clicking, robots welding, something being hit with a plastic hammer, and under it all, a toy drum.' : room === 'queue' ? 'Four hundred kids explaining the film to each other at once.' : 'You hear the ordinary sounds of a Saturday: a lawnmower, a dog, Dave\'s mom shouting "DAVE".'); break;
      case 'smell': say(room === 'underbed' || room === 'hole' ? 'Socks. Lost socks. The smell has layers, like a cake nobody wanted.' : /forest|deeper/.test(room) ? 'Mushrooms and new plastic. The Toy Kingdom\'s signature scent.' : room === 'shop' ? 'Newspaper, firelighters, and a hint of outer space.' : room === 'cinema' ? 'Popcorn. Hot carpet. The 16th of July.' : 'Nothing much. Saturday.'); break;
      case 'sleep': say(room === 'bedroom' ? 'You lie on the bed. Something under it giggles. You get up again.' : 'Not here. You\'re on a quest. Quests don\'t have naps. (Dad\'s having one for you.)'); break;
      case 'sing': say(/camp|arena|mek|pen|gate|hut|tower/.test(room) ? 'You sing. The toys join in: a music box, a xylophone, a robot beatboxing. It is not the same song. It is not any song. It is wonderful.' : 'You sing a bit. The ducks, if present, leave.'); break;
      case 'jump': say(room === 'pen' ? 'You bounce with the Blobbits. They are better at it. They have had practice. They are made of bounce.' : 'You jump. You come down. Gravity: still on.'); break;
      case 'pet': { if (A1 === 'gubbinz' && (F.gubbinz || here('gubbinz'))) { say('You pet Gubbinz. He purrs, which desktop helpers don\'t do, which he does anyway. "Hey! Get off. ...bit more."'); break; } if (A1 === 'squig') { say('You pat the Big Blobbit. The Big Blobbit thinks about it, then decides you are a friend, which means it tries to sit on you. You escape. It is still on the bridge.'); break; } if (A1 === 'snotling') { say('The baby Blobbit nibbles your finger, gently, with love. "Bloop."'); break; } if (A1 === 'dog') { say('The dog allows it. The dog does not give up the stick.'); break; } if (A1 === 'dad') { say('You pat Dad. He says "mmf, cheers". He is dreaming about GLOOM.'); break; } say('It would not appreciate that.'); break; }
      case 'wear': say(A1 === 'saber' ? 'You tuck the lightspatula in your belt. You don\'t have a belt. It goes down your trouser leg. You walk like a Space Cadet with a limp.' : 'You can\'t wear that.'); break;
      case 'xyzzy': say('A hollow voice says "fool". Then, quieter, "...but a nice try."'); break;
      case 'waaagh': sayWord([words[0]]); break;
      case 'pray': say('You wish for a lightspatula, a solved cube, and a Saturday with no bins. One out of three is possible.'); break;
      case 'swim': say(room === 'pond' ? 'The sign says NO SWIMMING. The ducks say it with their eyes.' : 'There\'s nothing to swim in. It\'s not that kind of quest.'); break;
      case 'turbo': say(room === 'garage' ? 'You press TURBO. The 486 does exactly the same thing, but Dad would say it feels faster.' : 'Turbo what?'); break;
      case 'dir': say('This isn\'t DOS. Well, it is, but not in here. Type QUIT to get back to DOS.'); break;
      case 'go': say('Go where?'); break;
      default: say('You can\'t do that here.');
    }
    if (room === 'camp' && F.gubbinz && !F.hutopen && /hut|door|castle|east|e$/.test(s)) openHut();
    return null;
  }
  function openHut() { if (F.hutopen) { say('The castle is open. Gubbinz is still proud of it.'); return; } if (!F.gubbinz) { say('There\'s nobody small enough to help with that. Not yet.'); return; } if (room !== 'camp') { say('The castle\'s in the town square.'); return; } F.hutopen = true; award('hut', 'Gubbinz looks at the cereal-box drawbridge, looks at the gap under it, hands you his biscuit, and is gone. A pause. Scrabbling. A yelp. The drawbridge comes down from the inside. Gubbinz, behind it, bows. "There you go, boss. Royal door, that. Biscuit back, ta."'); }

  // ================================================================ the program
  P.grotquest = async (sh, args) => {
    const host = sh.host, t = sh.term;
    const cols = () => host.screen.cols;
    const emit = () => { for (const line of out) { for (const w of K.wrap(line, cols() - 1)) sh.println(w); } out = []; };
    reset(); out = [];
    S('quest.start');
    t.attr = 7;
    sh.println(''); sh.println(''.padEnd(Math.min(cols() - 1, 60), '═'));
    sh.println('  J A C K   Q U E S T'); sh.println('  A text adventure by Jack, 1999. 350 points. No rude words.');
    sh.println(''.padEnd(Math.min(cols() - 1, 60), '═')); sh.println('');
    say('It is a Saturday morning in 1999. The best kind of morning. You were going to spend it on the PC, with Gubbinz, the little green helper who lives in it and eats biscuits on it and is, apart from Dave, your best mate.');
    say('Except Gubbinz isn\'t on the screen. There are tiny green footprints on the mouse mat. They go under the bed.');
    say('(Type HELP for the commands, HINT if you\'re stuck, SAVE to save. RESTORE loads a saved game.)');
    say('');
    // the autosave (js/gamesave.js): every move is kept, so a refresh or a closed window carries straight on
    const AUTO = 'dos.quest', autosave = () => { try { if (!A.saveGame) return; if (F.won) A.clearGame(AUTO); else A.saveGame(AUTO, { F, room, score, moves, loc }, { v: 1 }); } catch (e) {} };
    const auto = A.loadGame ? A.loadGame(AUTO, 1) : null;
    if (auto && auto.loc && !(auto.F && auto.F.won)) { F = auto.F || {}; room = R[auto.room] ? auto.room : 'bedroom'; score = +auto.score || 0; moves = +auto.moves || 0; loc = {}; for (const k in I) loc[k] = auto.loc[k] === undefined ? I[k].loc : auto.loc[k]; say(`[Carrying on where you left off: ${score} points in ${moves} moves. Type RESTART to begin again.]`); say(''); }
    look();
    emit();
    const hist = [];
    for (;;) {
      if (host.dead) return;
      sh.println(''); sh.print('> ');
      const line = await K.readLine(host, { hist, complete: s => { const w = s.toLowerCase(); const cands = ['look', 'examine', 'take', 'drop', 'inventory', 'open', 'use', 'give', 'talk to', 'ask', 'say', 'wait', 'score', 'save', 'restore', 'hint', 'help', 'quit', 'north', 'south', 'east', 'west', 'buy', 'fight', 'paint', 'drive', 'solve']; return cands.filter(c => c.startsWith(w) && w); } });
      if (line == null) { sh.println('(Ctrl+C: QUIT leaves properly. SAVE first!)'); continue; }
      if (/^\s*restart\s*$/i.test(line)) { reset(); if (A.clearGame) A.clearGame(AUTO); say('You blink. It is Saturday morning again. The footprints are still there.'); say(''); look(); emit(); continue; }
      let r = null;
      try { r = parse(line); } catch (e) { console.error(e); say('The game has performed an illegal operation. It feels terrible. Carry on.'); }
      emit(); autosave();
      if (r === 'quit') { sh.println(`\nYou leave JACK QUEST with ${score} out of ${MAX} points, in ${moves} moves. The toys wave. Bye!`); return; }
    }
  };
  DOS.quest = { MAX, R, I };
})();

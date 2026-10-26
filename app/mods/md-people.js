/* md-people: everybody in JackMUD (NPCs), the quests, and the things you can do in particular rooms (ACT).
 * Server only, read by mods/md-world.js. NPC fields: short, kw, here (line in the room, or fn), desc, greet, again,
 * topics {'word,alias': text|fn}, chat [idle lines], shop {n, sells:[ids], thanks}, bank, healer, on {talk, give, hear, social}.
 * Quest steps: { k: 'talk'|'have'|'give'|'kill'|'visit'|'say'|'flag'|'look', ...target, hint, done?, say? (the NPC's line),
 * give? (an item handed over when the step is done) }. */
'use strict';
const NPCS = {};
function N(id, short, kw, o) { NPCS[id] = Object.assign({ id, short, kw: kw.split(' '), here: short.charAt(0).toUpperCase() + short.slice(1) + ' is here.', desc: 'You see ' + short + '.', greet: 'Hello there!' }, o); }

// ================================================================ the Academy
N('pixel', 'Professor Pixel', 'pixel professor prof', {
  here: 'Professor Pixel paces up and down, tapping a pointer on his hand.',
  desc: 'A tall, thin man in a tweed jacket with leather elbow patches and square glasses. His tie has a pattern of tiny arrows on it. He walks everywhere very fast, as if he is late for a lesson he is teaching.',
  greet: "Ah! A new student! Splendid. Now: moving about. You type the way you want to go. N for north, S for south, E for east, W for west. U and D for up and down. The Exits line in every room tells you which ways you CAN go. Try it! There is a cloakroom just WEST of here with your scarf in it. Type W.",
  again: 'Remember: N, S, E, W, U, D. And MAP shows you where you have been. Very useful when Dave gets you lost.',
  topics: { 'map': 'Type MAP. It draws the rooms you have been to. The @ is you. Marvellous invention.', 'exits': 'EXITS lists every way out of a room, and where it goes, if you have been there before.', 'lost,recall,getting lost': 'RECALL whisks you back to Market Square in Baudby. For when you are hopelessly lost. Which happens to the best of us.', 'dave': 'Dave? Dave once walked north for forty minutes. Into a wall. Lovely boy.' },
  chat: ['Professor Pixel says, "North! South! East! West! Up! Down! The six directions of destiny!"', 'Professor Pixel taps the compass poster with his pointer.', 'Professor Pixel mutters, "Never Eat Shredded Wheat... never... eat..."'],
});
N('inventoria', 'Madame Inventoria', 'inventoria madame', {
  here: 'Madame Inventoria sits at her desk, writing in a ledger with one of her many pens.',
  desc: 'A tall, elegant lady with about forty pens stuck in her hair bun. She has a pair of glasses on a chain, and another pair on her head, and she is looking for her glasses.',
  greet: 'Welcome to the Hall of Things, dear. Everything you carry is your INVENTORY: type INV, or just I. What you wear and hold is your EQUIPMENT: type EQ. To pick things up, GET them. To use a sword, WIELD it. To put on a hat, WEAR it. WEAR ALL puts on everything you can. Easy as pie.',
  again: 'GET, DROP, WEAR, WIELD, REMOVE, INV, EQ. That is all there is to it, dear. Oh, and EAT and DRINK, for when you are peckish.',
  topics: { 'inventory,inv': 'Type INV to see what you are carrying. You can carry 24 things. Then you have to sell something. Or drop it. Not on my floor, please.', 'equipment,eq,armour': 'Armour makes monsters hit you less. Look for helmets, jumpers, shields and boots. Brunhilda at Sticks n Swords in town sells all sorts.', 'pens,glasses': '...Have you seen my glasses?' },
  chat: ['Madame Inventoria pulls a pen out of her hair, uses it, and puts it back.', 'Madame Inventoria says, "Has anybody seen my glasses?" (They are on her head.)'],
});
N('crumb', 'Mrs Crumb', 'crumb mrs', {
  here: 'Mrs Crumb leans on the tuck shop counter, chewing a toffee.',
  desc: 'A round, smiley lady in a flowery apron, with flour on her nose and a pencil behind her ear. She has worked at the tuck shop since before the Academy was built, somehow.',
  greet: 'Hello, my love! What can I get you? Type LIST to see what I have, and BUY and the name to buy it. Fizz Pop is the most important thing an adventurer can carry. Heals you right up. Makes you burp, mind.',
  shop: { n: "Mrs Crumb's Tuck Shop", sells: ['fizz', 'crisps', 'sandwich', 'tea', 'apple'], thanks: ['There you go, my love!', 'Ta very much!', "Don't eat it all at once!", 'Mind your teeth!'] },
  topics: { 'fizz,pop,fizz pop': 'Fizz Pop heals 15 HP. Drink it in a fight if you are getting bashed: DRINK FIZZ. My Double Fizz is at the Corner Shoppe in town. Stronger stuff.', 'dave': 'That boy owes me for four packets of crisps and a toffee.' },
  chat: ['Mrs Crumb rearranges the Fizz Pop bottles into a pyramid.', 'Mrs Crumb says, "No tick! Cash only!"', 'Mrs Crumb hums along to the radio.'],
});
N('bookworm', 'Librarian Bookworm', 'bookworm librarian worm', {
  here: 'Librarian Bookworm, a large worm in small spectacles, peers at you from a pile of books.',
  desc: 'An actual worm, about as long as your arm, wearing tiny half-moon spectacles and a knitted cardigan with leather buttons. He reads by eating his way through books, which is why the library has holes in it.',
  greet: "Ahem. Welcome to the library. Shhh. Two things every hero should know. One: type HELP whenever you are stuck. HELP NEWBIE is a good start. Two: type QUESTS to see your quest journal, so you always know what to do next. Questions? ASK me ABOUT something. Quietly.",
  again: 'Shhh. HELP and QUESTS, dear student. HELP and QUESTS.',
  topics: { 'help': 'HELP shows all the commands. HELP and a word explains it: HELP FIGHTING, HELP SHOPS, HELP PARTY. The best book in this library, frankly.', 'quests,quest': 'People need help all over Baudby. TALK to them. A yellow ! on your MAP means someone is there to talk to.', 'books': 'I have read every one. Well. Eaten. Same thing.', 'computer': 'It is for RESEARCH. Somebody is on level nine of the falling blocks game. I am pretending I have not noticed.', 'page,pages,spellbook': (api, P) => api.qOn(P, 'pages') && !api.has(P, 'page1') ? 'A page from a spellbook? Something like that fell out of a book on the top shelf... have a SEARCH round here.' : 'Spellbooks are kept at the Wizards\' Tower, on Guild Row.' },
  chat: ['Librarian Bookworm says "Shhhh!" to nobody in particular.', 'Librarian Bookworm wriggles through a book. Munch munch munch.', 'Librarian Bookworm adjusts his tiny spectacles.'],
});
N('headmistress', 'Headmistress Hexadecimal', 'headmistress hexadecimal head', {
  here: 'Headmistress Hexadecimal sits behind her great oak desk, writing very neatly.',
  desc: 'A small, sharp-eyed woman with silver hair in a bun, a grey cardigan and a gold pen. She can count to sixteen on one hand. Nobody knows how.',
  greet: 'Ah. A new student. Welcome to the Adventurers\' Academy. Do your lessons, and come back to me when you are done. Your QUESTS journal tells you what is left.',
  again: 'Off you go, then. The world won\'t save itself.',
  topics: { 'academy,school': 'The Academy has trained heroes since 1066. Well, 1986. One of those.', 'diploma': 'Every graduate gets a diploma. Show it to anyone who doubts you.', 'baudby,town': 'Baudby is south, through the gates. Market Square is the middle. Mind the geese.' },
  chat: ['Headmistress Hexadecimal stamps a form. Very neatly.', 'Headmistress Hexadecimal winds one of her eleven clocks.'],
});
N('stuffing', 'Sergeant Stuffing', 'stuffing sergeant sarge', {
  here: 'Sergeant Stuffing stands by with his arms folded and a moustache like a broom.',
  desc: 'An enormous man in a khaki uniform with medals pinned all over it. One of them is a Blue Pedro badge. His moustache is so big birds have tried to nest in it.',
  greet: "RIGHT THEN, RECRUIT! This is DENNIS. Dennis is a TRAINING DUMMY. First, CONSIDER DUMMY to see how tough he is. Then KILL DUMMY! The fight goes on by itself, a round every couple of seconds. Watch your HP in your prompt! Use your class SKILLS too! If it goes badly, FLEE! NOW GO!",
  again: 'Still here, recruit? KILL DUMMY! And type SKILLS to see your special moves!',
  topics: { 'skills': 'Every class has SKILLS. Knights BASH. Wizards ZAP. Rangers SHOOT. Bards SING. Type SKILLS to see yours. Use them in a fight!', 'running away,flee': 'Fight going badly? FLEE! There is no shame in running away. Well, a little bit. But not much.', 'dennis,dummy': 'Dennis has been bonked eleven thousand times. He has never once complained.', 'medals,badge': 'That one is for bravery. That one is for long service. That one is for sending a drawing in to the telly.' },
  chat: ['Sergeant Stuffing bellows, "ONE-TWO! ONE-TWO!"', 'Sergeant Stuffing straightens Dennis the dummy\'s bucket.', 'Sergeant Stuffing twirls his moustache.'],
});

// ================================================================ Baudby
N('crier', 'the Town Crier', 'crier town barry', {
  here: 'The Town Crier, in a red coat and tricorn hat, rings a handbell on his soapbox.',
  desc: "Barry the Town Crier: a big man with a big voice and an even bigger bell. He knows everything that happens in Baudby, mostly because he shouts it.",
  greet: "OYEZ! OYEZ! Welcome to Baudby, hero! The BANK is EAST, the SHOPS are SOUTH, the TEMPLE is WEST, and the INN and TOWN HALL are NORTH! Type MAP to see where you are! Type AREAS to see where to adventure! OYEZ!",
  topics: { 'the news,news': () => "OYEZ! Sock gremlins in the sewers! Geese in the fields! A troll on the bridge in the woods (he's very nice)! And they say there is a BUG under the Clock Tower! OYEZ!", 'bank': 'EAST of here! Mr Penny looks after your gold, and swaps it for JackNet Rupees!', 'shops': 'SOUTH of here, down Harbour Road! Weapons and armour at Sticks n Swords, everything else at the Corner Shoppe!', 'temple,healing': 'WEST! Sister Ping heals you, free for little heroes!', 'bell': 'This bell has been rung every day for 200 years! It is VERY tired!' },
  chat: ['The Town Crier rings his bell: "OYEZ! OYEZ! The time is... about now!"', 'The Town Crier shouts, "OYEZ! Lost: one goose! Do NOT return it!"', 'The Town Crier shouts, "OYEZ! The Millennium is coming! Back up your floppies!"', 'The Town Crier shouts, "OYEZ! New heroes: say hello at the Dial-Up Inn!"'],
});
N('ping', 'Sister Ping', 'ping sister', {
  here: 'Sister Ping, in white robes and fluffy slippers, hums and plumps the pillows.',
  desc: 'A kind, round-faced lady with rosy cheeks and fluffy pink slippers poking out from under her white robes. She smells of lavender and peppermints.',
  greet: "Hello, pet. Are you feeling poorly? Type HEAL and I'll make you all better (no charge for little ones up to level 5). If you ever faint out there, the owls bring you here and I look after you. Nobody stays fainted for long in Baudby.",
  healer: 1,
  topics: { 'temple,saint,reboot': 'Saint Reboot is the patron of fresh starts. When everything goes wrong, turn it off and on again. Works for computers AND people.', 'fainting,faint': "If your HP gets to zero you faint. The owls bring you here. You'll drop a few coins on the way, so keep your gold in the bank, pet.", 'owls': 'Lovely birds. They work nights. They like a jelly baby as a thank you.', 'slippers': 'Fluffy slippers are very important in a temple. Marble floors are cold, pet.' },
  chat: ['Sister Ping hums a little hymn.', 'Sister Ping tucks a quilt in very neatly.', 'Sister Ping says, "Have a jelly baby, pet."'],
});
N('penny', 'Mr Abacus Penny', 'penny mr abacus banker', {
  here: 'Mr Abacus Penny peers at you over his half-moon spectacles from behind the counter.',
  desc: 'A very neat, very thin man in a pinstripe suit and a bow tie, with a pen behind each ear and a calculator watch. He counts everything. He has counted you.',
  greet: "Good day. Welcome to the Baudby Bank. Gold in the bank is SAFE: if you faint, you only drop gold from your pockets. DEPOSIT, WITHDRAW, BALANCE. And at the Rupee Exchange you can swap gold for JackNet Rupees, or Rupees for gold. Type EXCHANGE to see the rates.",
  bank: 1,
  topics: { 'rupees,exchange,rupee': `JackNet Rupees are the money of the whole JackNet: they live in your JackNet Bank account, outside this world. I'll give you 1 Rupee for 50 gold, up to 5 times a day. Or 40 gold for 1 Rupee. Members only, I'm afraid. Type EXCHANGE.`, 'computer,beige': 'It is Y2K compliant. Probably. I have done a backup. Twice. On floppy.', 'interest': 'Interest? Oh, it is very interesting. But we don\'t pay any.' },
  chat: ['Mr Penny counts a pile of coins. Then counts it again.', 'Mr Penny taps at his big beige computer. It goes BEEP.', 'Mr Penny says, "Neither a borrower nor a lender be. Unless it is with us."'],
});
N('barnaby', 'Barnaby Brew', 'barnaby brew innkeeper', {
  here: 'Barnaby Brew, the round-faced innkeeper, polishes a glass and hums.',
  desc: 'A jolly, red-faced man with an apron, a bald head and a moustache that curls at the ends. He laughs at everybody\'s jokes, even the bad ones. Especially the bad ones.',
  greet: "Welcome to the Dial-Up Inn! Best chips in Baudby! Sit by the fire and REST, you'll mend twice as fast in here. Hungry? Type LIST. And have a look at the noticeboard: LOOK BOARD.",
  shop: { n: 'The Dial-Up Inn Bar', sells: ['fizz', 'dfizz', 'chips', 'tea', 'slush', 'milkshake'], thanks: ['Enjoy!', 'Mind, the chips are hot!', 'On the house! No, wait, I just charged you. Never mind!'] },
  topics: { 'inn,name,dial-up': "Called it the Dial-Up Inn because people come in for five minutes and stay three hours. Ha! Get it? Like the internet! Ha!", 'rumours,rumour,gossip': "They say there's a secret room somewhere in town, behind a poster. And there's a dragon up Mount Megabyte who's lost her save game. Poor lamb.", 'chips': 'Triple-cooked. Well, I cook them once and then forget about them twice.' },
  chat: ['Barnaby laughs at a joke nobody told.', 'Barnaby says, "Who wants chips? Everyone wants chips!"', 'Barnaby polishes the same glass for the fifth time.', 'Barnaby says, "Phone line\'s busy again. Someone\'s on the internet."'],
});
N('mayor', 'Mayor Wobblebottom', 'mayor wobblebottom', {
  here: 'Mayor Wobblebottom paces about in a gold chain and a VERY tall hat, looking worried.',
  desc: 'A short, round man with an enormous hat (taller than he is), a gold chain of office and a worried face. His hat is so tall he has to duck under doorways. He does not always remember.',
  greet: 'A hero! At last! Oh, thank goodness.',
  again: "Ah, hello again, hero! Baudby is ever so grateful.",
  topics: { 'socks,sock': "The SOCKS, hero! Every sock in town vanishes one at a time! Never a pair! Just one! It's driving everyone mad!", 'hat': 'It has been in the family for eleven generations. It has its own room.', 'baudby,town': 'Baudby, jewel of the coast! Home of the fountain, the clock tower and some VERY angry geese.', 'bug,millennium,y2k': "Don't talk about the Bug. Old Tom deals with the Bug. I deal with socks." },
  chat: ['Mayor Wobblebottom bumps his hat on the door frame. "Ow."', 'Mayor Wobblebottom says, "Has anyone seen my other sock?"', 'Mayor Wobblebottom polishes his chain of office.'],
});
N('pat', 'Postmistress Pat', 'pat postmistress', {
  here: 'Postmistress Pat bustles about behind the counter, stamping things with great enthusiasm.',
  desc: 'A busy little woman in a blue uniform with a cap, a bag of letters over her shoulder and a rubber stamp in each hand. She has delivered every letter in Baudby for twenty years and has only been bitten by a goose eleven times.',
  greet: "Ooh, hello! You look like someone with strong legs! I've got a parcel that needs taking somewhere I can't get to with my bad knee.",
  again: 'Hello again, pet! Lovely to see you!',
  topics: { 'post,letters,stamps': 'First class is 26p! Unless you are a goose. Geese are banned from the Post Office.', 'hoot,owl': 'Professor Hoot lives in the Owl Tree, in the Deep Woods. Past the troll bridge. Trevor will want a riddle answered, mind.', 'email,internet': 'Electronic mail! Pah. You can\'t lick an e-mail. You can\'t smell it. Mind you, you can\'t lose it down the back of the sofa either.' },
  chat: ['Postmistress Pat stamps something. THUNK. "First class!"', 'Postmistress Pat sorts letters into pigeonholes at lightning speed.', 'Postmistress Pat licks a stamp and makes a face.'],
});
N('tom', 'Old Tom Tick', 'tom old tick clockkeeper', {
  here: 'Old Tom Tick, the clockkeeper, fusses about the tower with an oil can.',
  desc: 'A bent old man with a white beard, a waistcoat full of pocket watches (you count seven) and an oil can in his hand. He winds the Clock Tower every morning, and every clock in Baudby keeps time by it.',
  greet: "Eh? Who's that? A hero, is it? Hmm. You look a bit young. Come back when you've a few more adventures under your belt, and we'll talk about what's under this tower.",
  again: 'Tick tock, tick tock. Not long now. Not long.',
  topics: { 'tower,clock': 'This clock has never been wrong. Not once. Every clock in Baudby follows it. Which is the trouble, see.', 'bug,millennium,y2k,trapdoor': "Down below is the Old Server Room. And in the Old Server Room is the Millennium Bug. It wants every clock in the world to think it's 1900 when the year 2000 comes. I can't let that happen. I'm too old to fight it. That's where heroes come in. Strong ones. Level 14, at least.", 'watches,watch': 'Seven watches! One for each day. Today\'s is the one that works.', 'countdown,days': (api) => `There are ${api.today99().left} days left till the year 2000. I count every one.` },
  chat: ['Old Tom oils a gear. Squeak. Squeak.', 'Old Tom checks seven pocket watches, one after another.', 'Old Tom mutters, "Nineteen hundred... not on MY watch."'],
});
N('archmage', 'Archmage Floppington', 'archmage floppington mage', {
  here: 'Archmage Floppington mutters over a crystal ball, his beard tucked into his belt.',
  desc: 'An ancient wizard with a beard so long he tucks it into his belt, a purple robe covered in stars, and a pointy hat with a little bell on the end. His crystal ball keeps freezing, and he keeps tapping it.',
  greet: 'Hmm? Oh. Hello. Forgive me, my crystal ball is... buffering.',
  again: 'Welcome, welcome. Mind the bottles. And mind Dave.',
  shop: { n: "The Wizards' Supply Cupboard", sells: ['staff', 'crystalstaff', 'robe', 'slush', 'tea'], thanks: ['Use it wisely.', 'Mind the pointy end.', 'Sparkly!'] },
  topics: { 'lag,caves,buffer': 'The Caves of Lag, up in the Grumbly Hills. There is a creature in there, the Great Buffer Beast, and it is slowing down ALL the magic in the realm. Spells take ages to load! It needs dealing with by someone level 8 or so.', 'dave': 'My apprentice. He is... enthusiastic. He has set fire to the curtains four times. This week.', 'magic,spells,wizard': 'Magic is just like computers. It works brilliantly until it doesn\'t, and nobody knows why.' },
  chat: ['Archmage Floppington taps his crystal ball. "Come ON..."', 'Archmage Floppington says, "In my day, spells loaded INSTANTLY."', 'Archmage Floppington\'s hat bell tinkles.'],
});
N('dave', 'Dave the apprentice', 'dave apprentice', {
  here: 'Dave, the apprentice wizard, is flapping at a smoking curtain with his hat.',
  desc: "Jack's mate Dave, in a wizard's robe that's too long for him, with a singed hat and a burn mark on his eyebrow. He's the sort of person who reads the instructions after it goes wrong. He's got an Ultra 64 controller sticking out of his pocket.",
  greet: "Oh! Hiya! Don't tell the Archmage about the curtain. Listen, I'm in BIG trouble. I've lost three pages of my spellbook and he's going to test me on them on Friday. Can you help?",
  again: "Alright? The curtain's fine now. Mostly.",
  topics: { 'curtain,fire': "It's NOT a fire. It's a very warm light spell.", 'n64,nintendo,games': 'Goldenballs. Four player. Facility. No Oddbob. Those are the rules.', 'jack': "Jack built this whole MUD. On his own. In his bedroom. I helped! I did the sewers. And the socks. You're welcome.", 'sewers': "I made the sewers! Ace, aren't they? The smell was my idea.", 'pages,spellbook': "Page one's at the Academy library, I think. Page two went down a drain (don't ask). Page three... the fairy in the woods took it. She said it was 'rubbish spelling'. Cheek." },
  chat: ['Dave waves his wand and a pigeon appears. He looks as surprised as you.', 'Dave says, "Does anyone know a spell for un-burning things?"', 'Dave says, "My mom\'s picking me up at six. What time is it now?"', 'Dave tries to look busy whenever the Archmage looks over.'],
});
N('reginald', 'Sir Reginald Clank', 'reginald sir clank', {
  here: 'Sir Reginald Clank stands to attention in very shiny armour.',
  desc: 'A tall knight with a grey moustache, in armour so shiny you can see yourself in it. He salutes everything, including doors.',
  greet: 'Hail, brave adventurer! The Knights\' Hall welcomes ALL heroes, not just knights. Courage! Honour! Wipe your feet! My armoury has fine kit for those who have earned it: type LIST.',
  shop: { n: 'The Knights\' Armoury', sells: ['knighthelm', 'roundshield', 'chainmail', 'platemail', 'longsword', 'mace'], thanks: ['Wear it with honour!', 'Courage!', 'Splendid! Splendid!'] },
  topics: { 'knights,knight': "A knight never gives up! A knight helps the weak! A knight always polishes his boots! Sir Clanksalot is a knight too. He's... less shiny.", 'clanksalot': "Sir Clanksalot? Lost in the Whispering Woods again, I expect. He loses his helmet a lot.", 'honour': 'Honour is doing the right thing when nobody is watching. Like putting the lid back on the felt tips.' },
  chat: ['Sir Reginald salutes the door.', 'Sir Reginald polishes his breastplate with his sleeve.', 'Sir Reginald booms, "COURAGE!" to nobody.'],
});
N('rowan', 'Ranger Rowan', 'rowan ranger', {
  here: 'Ranger Rowan sits by the fire, whittling a little wooden goose.',
  desc: 'A quiet woman in a green cloak with a bow over her shoulder and a feather in her hair. She notices everything, and says very little.',
  greet: "Welcome, traveller. The woods are west of town, the hills north of the fields. I've got spare bows and boots if you need them. LIST.",
  shop: { n: "The Rangers' Store", sells: ['longbow', 'boots', 'hood', 'gloves', 'apple'], thanks: ['Good hunting.', 'Watch your step.', 'Travel well.'] },
  topics: { 'woods,woods': 'The Whispering Woods. Granny Byte lives near the edge. Further in, a troll bridge, a sleepy bear and an owl who knows everything.', 'hills,caves': 'The Grumbly Hills are north of Windy Hill, past Floppy Fields. The Caves of Lag are up there. Do not go in until you are level 7.', 'treehouse': 'My treehouse is in the Giant Oak. Help yourself to the crisps. Leave the walkie-talkie alone.', 'jackk': 'He\'s good. Draws better maps than I do. Don\'t tell him.' },
  chat: ['Ranger Rowan whittles quietly.', 'Ranger Rowan glances out of the window, listening.', 'Ranger Rowan stirs the pot of "forest stew". It is beans.'],
});
N('jackk', 'JackK', 'jackk jack k', {
  here: 'JackK is hunched over a corner table, drawing a very detailed map.',
  desc: "Jack's mate JackK (not to be confused with Jack: there are two Jacks, so everyone just says JackK). He's got a ranger hood on over his school jumper, a pencil behind each ear, and a sketchbook full of maps. He designed the whole Isle of Spam.",
  greet: "Alright! You been to the Isle of Spam yet? I made it! Go down to the docks and get on the Soggy Biscuit. Captain Pete's lost his parrot. And there's TREASURE.",
  topics: { 'isle,spam,island': "The Isle of Spam! Beach, palm trees, crab rocks, a lighthouse, a pirate camp. Squidgy lives in the grotto under the cove. He's level 9, so don't go in on your own.", 'name,jack': "Yeah, there's two of us. I'm JackK. He's Jack. It's fine. It's been fine since Year 7.", 'drawing maps,map,maps': 'I draw maps of everything. My bedroom. The school. Callum says it\'s weird. It\'s not weird, it\'s CARTOGRAPHY.', 'treasure': "Pete's got a treasure map, but he won't give it to anyone till he gets his parrot back. Polly's always flying off to the lighthouse." },
  chat: ['JackK rubs something out on his map and draws it again, better.', 'JackK says, "Has anyone got a sharpener?"', 'JackK labels something on his map: HERE BE CRABS.'],
});
N('melody', 'Melody Strum', 'melody strum', {
  here: 'Melody Strum tunes a lute and sings softly to herself.',
  desc: 'A cheerful young woman in a patchwork waistcoat, with a lute on her back, a tambourine on her belt and ribbons in her hair. She can play anything. She once played "Happy Birthday" on a goose.',
  greet: 'Hiya! Fancy a tune? Bards heal with songs, you know: SING to heal your party, and LULLABY to send monsters off to sleep. Need kit? LIST.',
  shop: { n: "Melody's Music Stall", sells: ['lute', 'robe', 'tea', 'slush'], thanks: ['Rock on!', 'Play it loud!', 'Encore!'] },
  topics: { 'lag goblins,band,goblins': "The Lag Goblins? That's the boys' band. They're always about to start playing. They've been about to start since March.", 'songs,song,music': "Every good party needs a bard. We heal everyone at once. And we're great at parties. ACTUAL parties.", 'goose': 'It was a VERY musical goose.' },
  chat: ['Melody plays a jaunty little tune.', 'Melody hums the theme tune from Robo Rumble, then does the drum bits with her hands.', 'Melody taps out a rhythm on the bandstand rail.'],
});
N('luke', 'Luke', 'luke', {
  here: 'Luke is leaning on a racing game, watching the demo.',
  desc: "Jack's mate Luke: a total Ultra Entertainment fan, in a jumper with a little red cap logo he drew on himself in fabric pen. He has the highest score on every machine in the Pixel Palace except one: the Guess-O-Tron.",
  greet: "Oh, hey! Want a challenge? Nobody's ever beaten the Guess-O-Tron in this town. It thinks of a number between 1 and 100 and you get seven guesses. Beat it and bring me the prize ticket!",
  again: 'Hey! Wanna go on the racer? I bet I win. I always win.',
  topics: { 'guess-o-tron,guessotron,game,machine': 'Type PLAY to start. Then GUESS a number. It says HIGHER or LOWER. Seven goes. Top tip: start in the middle.', 'nintendo,n64': "ULTRA 64 is the best console ever made. FACT. Marlo 64, Zeldo, Goldenballs, Kart Kaos. What else do you need?", 'jack': "Jack's made a MUD! I made this arcade bit. And the Guess-O-Tron. And the sticky carpet (not on purpose).", 'callum': "Callum's always in the café. PC this, PC that. He says his computer does 3D now. Big deal. Mine plugs into the telly." },
  chat: ['Luke says, "Who wants a go on the racer? Winner stays on!"', 'Luke drums on the cabinet while the demo plays.', 'Luke says, "Ultra 64, man. Sixty. Four. BITS."'],
});
N('callum', 'Callum', 'callum', {
  here: 'Callum is hunched over a computer, typing furiously.',
  desc: "Jack's mate Callum: a PC gamer, with headphones round his neck, a mug of tea going cold, and a printout of computer cheats in his back pocket. He knows how everything works, and how to make it work wrong.",
  greet: "Shh, I'm downloading something. 3%. It's going to take two hours. My mom needs the phone in ten minutes. This is going to be close.",
  again: "Still downloading. 4%. Hey: you know every MUD has secrets? Admins hide stuff everywhere. This café, for a start.",
  topics: { 'secret,secrets,den,poster': "Look at the poster on the back wall. Look at it properly. I'm not saying anything else. (SEARCH, maybe.)", 'server,y2k,bug': "I designed the Old Server Room. It's well hard. The Millennium Bug is level 18. You'll want a whole party. And a bard. Seriously, bring a bard.", 'pc,computer,download': "PC is better than consoles. I've got a 3D card. Everything looks AMAZING. Well, it does when it works.", 'phone,mom': 'If she picks up the phone while I\'m connected, I lose everything. EVERYTHING.' },
  chat: ['Callum says, "COME ON. 5%..."', 'Callum sips his cold tea and pulls a face.', 'Callum says, "Who knows a cheat for infinite lives? Asking for a friend."', 'Callum\'s computer goes PSSHHHKKKKRRRRR as it dials up.'],
});
N('brunhilda', 'Brunhilda the blacksmith', 'brunhilda blacksmith smith', {
  here: 'Brunhilda the blacksmith bashes a glowing sword on her anvil.',
  desc: 'A huge, cheerful woman with arms like hams, a leather apron and plaits tucked under a bandana. She sings while she works, mostly songs from adverts.',
  greet: "HELLO THERE! Need something to bonk with? Or something to stop you getting bonked? Have a look: LIST! Bigger swords are for bigger heroes, mind.",
  shop: { n: "Sticks 'n' Swords", sells: ['dagger', 'cricketbat', 'shortsword', 'longsword', 'saucepan', 'bikehelmet', 'jerkin', 'binlid', 'gloves', 'trainers', 'boots', 'chainmail'], thanks: ['GOOD CHOICE!', 'Mind the edge!', "Bring it back if it bends! (It won't bend.)", 'Wield it with PRIDE!'] },
  topics: { 'weapons,weapon,swords': 'A better weapon means bigger whacks! Look at the damage numbers in my LIST. A dagger does 2 to 5. A longsword does 4 to 9!', 'armour,armor': 'Armour stops monsters hitting you so hard! Wear something on every bit: head, body, feet, hands, a shield. It all adds up.', 'keys,bikes': 'I cut keys and fix bike chains too. And once, a pram.' },
  chat: ['CLANG! CLANG! Brunhilda hammers away, singing an advert jingle.', 'Brunhilda dunks a red-hot sword in water. SSSSSSS!', 'Brunhilda says, "Every hero needs a good dustbin lid!"'],
});
N('bundle', 'Mrs Bundle', 'bundle mrs shopkeeper', {
  here: 'Mrs Bundle, very small and very cheerful, stands on a box behind the counter.',
  desc: 'A tiny old lady with a cardigan, a big smile and a stepladder she carries everywhere to reach the top shelves. She knows the price of everything in the shop without looking.',
  greet: "Hello, duck! What can I get you? I've got everything! Well, nearly everything. Type LIST. My MEGA FIZZ is very popular with heroes. Not for little ones, mind.",
  shop: { n: 'Ye Olde Corner Shoppe', sells: ['fizz', 'dfizz', 'mfizz', 'tea', 'slush', 'crisps', 'sandwich', 'apple', 'honey', 'cracker', 'crumbs'], thanks: ['There you go, duck!', 'Ta!', 'Anything else, duck?', 'Mind how you go!'] },
  topics: { 'honey': 'Lovely local honey, from the hives at the orchard. Bears go mad for it, you know.', 'crackers,cracker': 'Cream crackers. Pirates buy them by the barrel. For their parrots, they say.', 'mega fizz,mfizz': 'MEGA FIZZ heals 100! It also makes your ears fizz. Not my fault.' },
  chat: ['Mrs Bundle climbs her stepladder to reach a jar.', 'Mrs Bundle says, "That\'ll be 3p, duck. No, wait. 4p."', 'The bell over the door goes ding! Nobody has come in.'],
});

// ================================================================ Floppy Fields
N('strawbert', 'Strawbert the scarecrow', 'strawbert scarecrow', {
  here: 'Strawbert the scarecrow stands guard over the cabbages, in a flat cap and tweed jacket.',
  desc: "A scarecrow made of straw and an old suit, with a turnip head and a face drawn on in boot polish. His carrot nose keeps getting pinched. He can talk, and he has opinions about crows.",
  greet: "Oh, 'ello there. You're not a crow, are you? Good. Can't stand crows. Pinch everything, they do. Even my nose.",
  topics: { 'crows,crow': "Crows! They pinch EVERYTHING shiny. Buttons, bottle tops, my nose, the Bunny King's golden carrot...", 'nose,carrot': 'It\'s my third carrot this month. I\'m thinking of getting a parsnip. More dignified.', 'job': "My job is scaring birds. I'm rubbish at it. They sit on my hat." },
  chat: ['A crow lands on Strawbert\'s hat. He sighs.', 'Strawbert says, "Shoo. Shoo. Please shoo."', 'Strawbert creaks in the breeze.'],
});
N('giles', 'Farmer Giles', 'giles farmer', {
  here: 'Farmer Giles leans on the gate, looking fed up.',
  desc: 'A big farmer in a flat cap, a checked shirt and the muddiest wellies in the world. He has a piece of straw in his mouth and a bandage on his hand. The bandage is goose-shaped.',
  greet: "Ooh-arr. You look handy.",
  again: "Ooh-arr. Nice day for it.",
  topics: { 'geese,goose': 'Four of \'em. Evil, they are. They chase the post lady. They chase the cows. They chased the TRACTOR.', 'farm': 'Been farming here forty year. Sheep, hens, turnips. Some of the turnips have got a bit big lately. Walk about on their own, they do.', 'honey,bees': 'Them hives at the orchard are mine. Take a jar of honey if you need one. Bees won\'t mind. Well, they will. But you can outrun a bee.', 'rocket': "That rocket lot at the Range. Woke the cows up at four in the morning doing a countdown. TEN. NINE. Ooh-arr." },
  chat: ['Farmer Giles says, "Ooh-arr."', 'Farmer Giles looks nervously towards the Goose Field.', 'A hen pecks Farmer Giles\' welly. He doesn\'t notice.'],
});
N('bunnyking', 'King Bartholomew the Fluffy', 'king bartholomew bunny rabbit', {
  here: 'King Bartholomew the Fluffy sits on his turnip throne, nose twitching.',
  desc: 'A large, grey, very fluffy rabbit with a tiny gold crown and a velvet cloak. His nose never stops twitching. His ears are so long the crown keeps sliding down one of them.',
  greet: 'A visitor! To our royal warren! We are most honoured. We are also most UPSET.',
  again: 'Welcome back, our most loyal friend! Have a lettuce.',
  topics: { 'carrot,golden': 'The Royal Golden Carrot! Our ancestors have guarded it for 300 years! It was pinched by a CROW!', 'crown': 'It slides down our ear. We are used to it.', 'crows': 'Wicked, shiny-stealing birds. They hang about in the meadow.' },
  chat: ['The Bunny King\'s crown slides down his ear. He pushes it back up.', 'A rabbit courtier brings the King a lettuce on a cushion.', 'King Bartholomew twitches his nose regally.'],
});
N('countdown', 'Dr Countdown', 'countdown doctor dr', {
  here: 'Dr Countdown, in a white coat and enormous glasses, checks a clipboard.',
  desc: 'A small, excitable scientist with wild white hair, a pocket full of pens, a clipboard and glasses as thick as jam jars. He counts down to everything, including lunch.',
  greet: "TEN! NINE! Oh, hello. Want to go to SPACE? Of course you do! Everyone does! But only proper astronauts can fly the Starhopper 99. You'll need to pass my Astronaut Exam. Three questions about space. Ready?",
  again: 'Hello again, astronaut! The Starhopper is fuelled and ready. Just BOARD her!',
  topics: { 'space,station': 'Orbital Station 99! Commander Nova runs it. Lovely woman. Bit stressed. Something about an antenna.', 'moon': 'You can get a shuttle from the station to the Moon! Which, I can confirm scientifically, is made of cheese.', 'rocket,starhopper': 'Starhopper 99! Runs on Fizz Pop. Well, rocket fuel. But mostly Fizz Pop.', 'the exam,exam,questions,hint': 'You can find the answers in any good space book. Or ask a grown-up. Or the owl. He knows everything.' },
  chat: ['Dr Countdown counts, "Ten, nine, eight..." then forgets why.', 'Dr Countdown taps his clipboard. "Fuel... check. Snacks... CHECK."', 'Dr Countdown says, "One small step for a hero!"'],
});

// ================================================================ Whispering Woods
N('granny', 'Granny Byte', 'granny byte', {
  here: 'Granny Byte rocks in her chair, knitting something very long.',
  desc: 'A little old lady in a shawl, with enormous glasses and white hair in a bun. Her knitting needles go so fast they click like a keyboard. She has a computer with a knitted cover and she types at 90 words per minute.',
  greet: "Oh, hello, dear. Come in, come in. Have a cookie. I'm sorry, I'm in a bit of a state. My little kitten, Pixel, has gone and got herself lost.",
  again: "Hello, dear! Cookie? Of course you do.",
  topics: { 'pixel,kitten,cat': 'Pixel loves climbing. She went off chasing a squirrel and I heard her mewing from somewhere up high. Up very high.', 'cookies,cookie': 'Chocolate chip. My secret recipe. The secret is more chocolate.', 'computer,internet,chat': "I'm in three chat rooms! A knitting one, a crossword one, and one about the Millennium Bug. Very lively, that one. LOL, as the young people say.", 'knitting': "It's a scarf for my grandson. It's twelve feet long. He's a growing lad." },
  chat: ['Granny Byte\'s knitting needles click like a keyboard.', 'Granny Byte types something on her computer and chuckles. "LOL."', 'Granny Byte sighs and looks at the empty cat basket.'],
});
N('flicker', 'Flicker the fairy', 'flicker fairy', {
  here: 'Flicker the fairy sits on a toadstool, reading a book bigger than she is.',
  desc: 'A fairy no bigger than your thumb, with glittery wings, a dress made of a petal, and very strong opinions about spelling.',
  greet: "Oh. Hello, big person. I'm reading. Are you going to be loud? Big people are always loud.",
  topics: { 'page,spellbook,dave': (api, P) => { if (api.qOn(P, 'pages') && !api.has(P, 'page3')) { api.give(P, 'page3', true); return "That page? Ugh. The SPELLING. 'Invisable'. 'Homwork'. I took it to correct it. Fine, you can have it back. I've corrected it in red pen. (She hands you page three!)"; } return "That boy cannot spell. I'm not even sorry."; }, 'fairies,fairy,ring': 'Fairy rings are where fairies dance at midnight. Don\'t step in it. Well, you can step in it. It just tickles.', 'book': "It's about a boy wizard. No, not Dave. A different boy. It's quite good actually." },
  chat: ['Flicker turns a page with both arms.', 'Flicker says, "Shush, I\'m at a good bit."', 'Flicker flutters up, glittering, and sits back down.'],
});
N('hoot', 'Professor Hoot', 'hoot professor owl', {
  here: 'Professor Hoot, an owl in a tweed waistcoat, peers at you through brand-new spectacles.',
  desc: 'A large, wise brown owl in a tweed waistcoat with a pocket watch. He knows everything, and he knows that he knows everything, which is less nice.',
  greet: "Hoo. Hoo are you? Ah. A visitor. I am Professor Hoot and I know EVERYTHING. Ask me ABOUT anything. Go on. Anything.",
  topics: { 'everything': "Hoo-hoo. Nice try.", 'space,moon,armstrong,exam,rocket': "The first person to walk on the Moon was Neil Armweak, in July 1969, on the Apollo 11 mission. The first person in space EVER was Yuri Garglin, in 1961. Hoo. I told you I knew everything.", 'troll,riddle,trevor': "Trevor's riddle? I couldn't possibly tell you. Hoo. But think about what's in front of you right now, on the desk, with all the letters on it.", 'squirrel': 'I can see that squirrel. I can ALWAYS see that squirrel now.', 'spectacles,glasses': 'New spectacles! From the Post Office. Pat posted them. I can see EVERYTHING. It is wonderful and terrible.', 'bear,ted': 'Big Ted, in the cave. Sleeps all day, sleeps all night. Only one thing wakes that bear: honey.', 'dragon,floppitha': 'Floppitha, up Mount Megabyte. Clever dragon. Collects floppy disks. Lost her favourite one in the Caves of Lag, I hear. Hoo.' },
  chat: ['Professor Hoot turns his head all the way round. Show-off.', 'Professor Hoot says, "Hoo. Hoo knew?"', 'Professor Hoot polishes his new spectacles.'],
});
N('clanksalot', 'Sir Clanksalot', 'clanksalot sir knight', {
  here: 'Sir Clanksalot walks round in circles, bumping into trees, his fringe over his eyes.',
  desc: 'A knight in dented armour with a long floppy fringe that falls over his eyes now that he has lost his helmet. He has walked into the same tree nine times.',
  greet: "Who goes there? Friend or foe? Sorry, I can't see a THING. I've lost my helmet, you see, and without it my fringe goes everywhere.",
  again: "Ah! My friend! I'd know that voice anywhere. Well, I'd have to. I still can't see much.",
  topics: { 'helmet': "Lost it in the brambles, I think. I was fighting a bramble beast. Well, it was fighting me. It won.", 'reginald,knights': "Sir Reginald? My cousin. Very shiny. Bit much.", 'fringe,hair': "I should get it cut. But it's my best feature. When you can see it." },
  chat: ['Sir Clanksalot walks into a tree. CLONK. "Sorry."', 'Sir Clanksalot blows his fringe out of his eyes. It falls back.', 'Sir Clanksalot says, "Is that you? No. That\'s a tree."'],
});
N('trevor', 'Trevor the Toll Troll', 'trevor troll', {
  here: 'Trevor the Toll Troll sits in the middle of the bridge, in a knitted tank top.',
  desc: 'A big, mossy troll with a kind face, a knitted tank top (his mom made it), and a little tin for tolls that only ever has buttons in it. He loves riddles more than anything.',
  greet: "Ello! Toll bridge, this is. No gold needed. Just answer my riddle, and over you go! Ready? Here it is...\n\n  {W}\"I have keys, but I open no locks.\n   I have space, but there's no room.\n   You can enter, but you can't come inside.\n   What am I?\"{Y}\n\nJust SAY the answer!",
  again: 'Ello again! You know the way. Off you go! Mind the wobbly plank.',
  topics: { 'riddle,hint': "Ooh, you want a clue? It's something you're using RIGHT NOW. Probably. Unless you're using a pen.", 'tank top,mom': 'My mom knitted it. She knits me one every birthday. I have three hundred.', 'toll,tin': "Just buttons. Nobody ever pays in gold. It's fine. I like buttons." },
  on: { talk(api, P) { if (api.flag(P, 'troll')) { api.out(P, '{Y}Trevor the Toll Troll says, "Ello again! You know the way. Off you go! Mind the wobbly plank."{x}'); return true; } return false; },
    hear(api, P, t) {
      if (api.flag(P, 'troll')) return;
      if (/\b(a\s+)?(computer\s+)?keyboard\b/i.test(t)) {
        if (!api.qOn(P, 'riddle') && !api.qDone(P, 'riddle')) api.qStart(P, 'riddle');
        api.out(P, '{Y}Trevor the Toll Troll leaps up and claps his big hands. "A KEYBOARD! YES! Oh, you\'re good. You\'re VERY good. Over you go, friend!"{x}');
        api.flag(P, 'troll', 1); api.qEvent(P, 'say', 'keyboard'); api.secret(P, 'md.riddle');
      } else if (t.length > 1 && !/^(hi|hello|hiya|alright)\b/i.test(t)) api.out(P, `{Y}Trevor the Toll Troll shakes his head kindly. "Ooh, no, not ${api.vis(t.slice(0, 30))}. Have another go! (ASK TREVOR ABOUT HINT if you're stuck.)"{x}`);
    } },
  chat: ['Trevor hums to himself and counts his buttons.', 'Trevor says, "Riddle me this! No, wait, that\'s my line."', 'Trevor waves at a passing duck.'],
});
N('ted', 'Big Ted', 'ted big bear', {
  here: (api, P) => api.flag(P, 'ted') ? 'Big Ted the bear is sitting up, happily licking honey off his paws.' : 'Big Ted the bear is fast asleep, snoring like a broken vacuum. He blocks the way west.',
  desc: 'A huge, fluffy brown bear with a round tummy and a little blue bow tie. He looks like the biggest teddy bear in the world, because that is what he is.',
  greet: "ZZZZZZZZZZ... *snort*... mmm... honey... ZZZZZZZZZZ",
  again: 'Big Ted gives you a big sticky bear hug. "Fanks for the honey!"',
  on: { talk(api, P) { if (api.flag(P, 'ted')) { api.out(P, '{Y}Big Ted says, "Ello, honey friend! Go frough to the grove! It\'s lovely in there. Watch out for the waterfall, there\'s somefink behind it..."{x}'); return true; } return false; },
    social(api, P, verb) { if (/^(poke|tickle)$/.test(verb) && !api.flag(P, 'ted')) api.out(P, '{Y}Big Ted mumbles, "mmm... five more minutes... honey..." and rolls over. He is still in the way.{x}'); } },
  chat: ['Big Ted snores: ZZZZZZZZ-SNORT-zzzzzz.', 'Big Ted mumbles in his sleep, "honey... honey..."', 'Big Ted scratches his tummy without waking up.'],
});

// ================================================================ the Isle of Spam
N('polly', 'Polly-Gon the parrot', 'polly gon parrot', {
  here: (api, P) => api.has(P, 'parrot') || api.qDone(P, 'parrot') ? 'An empty perch sits on top of the lamp.' : 'Polly-Gon the parrot sits on top of the lamp, looking very pleased with herself.',
  desc: 'A bright green parrot with a red head and a yellow beak, and an expression that says she knows something you don\'t.',
  greet: "SQUAWK! PIECES OF EIGHT! PIECES OF EIGHT! ...AND A BIT. SQUAWK! POLLY WANTS A CRACKER!",
  topics: { 'cracker': 'SQUAWK! CRACKER! CREAM CRACKER! GIVE CRACKER POLLY! SQUAWK!', 'pete,captain': 'SQUAWK! SILLY OLD PETE! SILLY OLD PETE FORGOT POLLY\'S CRACKER! SQUAWK!' },
  chat: ['Polly-Gon squawks, "WHO\'S A PRETTY BIRD? ME!"', 'Polly-Gon bobs her head up and down.', 'Polly-Gon squawks, "POLLY WANTS A CRACKER!"'],
});
N('pete', 'Captain Pegleg Pete', 'pete captain pegleg pirate', {
  here: 'Captain Pegleg Pete sits by the fire, looking sadly at his empty shoulder.',
  desc: 'A big pirate with a wooden leg, a curly black beard with ribbons in it, an enormous feathered hat and a gold tooth. He looks fierce until you notice he is wearing slippers.',
  greet: "Arrr. Ahoy there, matey.",
  again: 'Arrr! There be my favourite landlubber! Sit down, have a marshmallow!',
  topics: { 'polly,parrot': "My Polly! Flew off when I forgot her cracker. I bet she's up the lighthouse, sulking. She sulks up there.", 'treasure,map': "Arrr. There be treasure on this island, buried long ago by me grandad. I've got the map. But a pirate don't go treasure hunting without his parrot, see.", 'leg,pegleg': 'Lost me leg to a shark. No, I tell a lie. It was a skateboard.', 'squidgy,octopus,kraken': "Squidgy! The Kraken's little cousin! Lives in the grotto under the cove. Pinches our dinner every night. Old Barnacle Bill down there's had enough of him." },
  chat: ['Captain Pete toasts a marshmallow on his cutlass.', 'Captain Pete says, "Arrr." Then, quietly, "Polly..."', 'Captain Pete taps his wooden leg on a rock. Tok tok tok.'],
});
N('bill', 'Old Barnacle Bill', 'bill barnacle old sailor', {
  here: 'Old Barnacle Bill sits on a ledge, puffing on a pipe that blows bubbles.',
  desc: 'A very old sailor with a white beard down to his tummy, a stripy jumper and a pipe that blows soap bubbles instead of smoke (healthier). He has a barnacle on his nose. He says it is lucky.',
  greet: "Ahoy, young'un. Sit yerself down. You've come at a bad time. Or a good time. Depends if you can fight an octopus.",
  again: 'Ahoy! Bubbles?',
  topics: { 'squidgy,octopus': "Pink. Huge. Cheeky. Pinches me dinner every single night! Level nine, that one. Take a friend.", 'barnacle,nose': "Lucky barnacle. Been there since 1952. We're very close.", 'pipe,bubbles': 'Bubble pipe! Took up bubbles when I gave up the other stuff. Much nicer. Smells of strawberries.' },
  chat: ['Old Barnacle Bill blows a stream of bubbles.', 'Old Barnacle Bill says, "When I were a lad, the sea were wetter."', 'Something pink waves a tentacle out of the water, and Bill shakes his fist at it.'],
});

// ================================================================ the Caves of Lag
N('gus', 'Gloomy Gus the ferryman', 'gus gloomy ferryman', {
  here: 'Gloomy Gus the ferryman sits in his boat at the jetty, fishing, looking glum.',
  desc: 'A tall, thin man in a long black coat with a droopy hat, a droopy moustache and droopy eyes. He has been fishing here for nine years and has never caught anything. He is fine about it. Mostly.',
  greet: "Oh. Hello. I suppose you want to go across. Everyone wants to go across. Nobody wants to stay and chat. Five gold a trip. Type PAY and I'll row you. Not that it matters.",
  topics: { 'fishing,fish': "Nine years. Not a nibble. I think there aren't any fish. I think there never were.", 'lake': 'Very deep. Very dark. Very still. Like my soul. Ha. Ha. (That was a joke.)', 'island,beast,buffer': 'The tunnel on the island goes down to where the goblins live. And the Beast. Big spinning thing. Makes everything slow. Makes my rowing slow. Makes my fishing... the same, really.' },
  chat: ['Gloomy Gus sighs.', 'Gloomy Gus casts his line. Nothing happens. He sighs again.', 'Gloomy Gus says, "Lovely day for it. Not that you can tell, in a cave."'],
});

// ================================================================ Mount Megabyte
N('spaghetti', 'Spaghetti the yeti', 'spaghetti yeti', {
  here: 'Spaghetti the yeti sits in a big armchair in a woolly hat, slurping a bowl of spaghetti.',
  desc: 'An enormous white furry yeti, three times taller than you, with a woolly bobble hat and slippers. He has spaghetti sauce on his chin. He is the friendliest creature on the mountain.',
  greet: "OH! A VISITOR! Come in, come in, out of the snow! Want some spaghetti? Everyone wants spaghetti. I've got spare coats if you're cold, too. LIST, LIST!",
  shop: { n: "Spaghetti's Spare Coats", sells: ['furcoat', 'boots', 'mfizz', 'milkshake'], thanks: ['WARM AS TOAST!', 'Lovely and cosy!', 'Mind the drafts!'] },
  topics: { 'spaghetti,name': "My mom called me Spaghetti because I was long and wobbly as a baby. Now I just LOVE spaghetti. It all worked out.", 'dragon,floppitha,castle': "Floppitha's lovely! We play chess on Tuesdays. She's been ever so sad. Lost her save game disk. Two hundred years of progress!", 'yeti,snow': "People think yetis are scary. We're not. We're mostly just cold and hungry." },
  chat: ['Spaghetti slurps a long noodle. SHHHLLLUUURP.', 'Spaghetti says, "Have I got sauce on my chin? I\'ve always got sauce on my chin."', 'Spaghetti stokes the fire with a big furry hand.'],
});
N('floppitha', 'Floppitha the dragon', 'floppitha dragon', {
  here: 'Floppitha the dragon lies curled on her hoard, reading a computer magazine through her spectacles.',
  desc: 'A magnificent dragon, purple and green, with golden eyes, spectacles on the end of her snout and a shawl round her shoulders. She has collected floppy disks for two hundred years. She has read every computer magazine ever printed.',
  greet: "Oh! A little hero! Don't be frightened, dear, I haven't eaten anyone since 1742.",
  again: 'Ah, my dear friend! Do sit down. Mind the gold, it\'s slippery.',
  topics: { 'disk,floppy,save,game': "My save game. Two hundred years in the same adventure game, and I'd nearly finished it! I took it to the Caves of Lag to show the crystal crabs (they love a floppy disk) and I dropped it in the Crystal Grotto. Somewhere among the crystals.", 'gold,hoard': 'Oh, the gold is just for sitting on. It\'s comfy. The floppies are the real treasure.', 'magazine,magazines': 'This month\'s has a cover disk! I love a cover disk.', 'fire': 'I only breathe fire on toast these days. And birthday candles.' },
  chat: ['Floppitha turns a page of her magazine with one claw.', 'Floppitha sighs a little puff of smoke.', 'Floppitha says, "Oh, these new games. Back in my day you had to TYPE everything."'],
});

// ================================================================ space
N('nova', 'Commander Nova', 'nova commander', {
  here: 'Commander Nova floats upside down in front of the main screen, frowning at a warning light.',
  desc: 'A tall woman in a silver spacesuit with her hair floating about in zero gravity like seaweed. She has been in space for two years and has forgotten what rain feels like.',
  greet: "Welcome aboard Orbital Station 99, rookie! Please hold a handrail. We have a problem.",
  again: 'Rookie! Good to see you. Station\'s running sweet as a nut.',
  topics: { 'antenna,problem,signal': "Our antenna's broken. Something keeps unscrewing the bolts: those meteorite gremlins. Without the antenna, we can't talk to Earth. I can't even ring my mom.", 'moon': "Take the shuttle from the Docking Bay. The Moon Mice need help, I hear. Something huge is eating the Moon.", 'space': 'Best job in the universe. Apart from the toilets. Don\'t ask about the toilets.', 'bob,robot': "B0B makes the tea. And fixes things. Mostly the tea." },
  chat: ['Commander Nova taps the warning light. It keeps flashing.', 'Commander Nova does a slow somersault.', 'Commander Nova says, "Houston, we have a... oh, never mind."'],
});
N('bob', 'B0B the helper robot', 'bob b0b robot', {
  here: 'B0B the helper robot whirrs about making cups of tea.',
  desc: 'A little round robot on wheels (which don\'t work in space, so it uses tiny rockets) with a tea tray for a head and two flappy arms. It beeps a lot.',
  greet: 'BEEP BOOP. GREETINGS, HUMAN. WOULD YOU LIKE A CUP OF TEA? I ALSO HAVE SNACKS. TYPE LIST. BEEP.',
  shop: { n: "B0B's Space Snacks", sells: ['tea', 'milkshake', 'mfizz', 'spacetomato'], thanks: ['BEEP. ENJOY.', 'THANK YOU, HUMAN.', 'BOOP.'] },
  topics: { 'spanner,tools,toolbox': (api, P) => { if (api.qOn(P, 'antenna') && !api.has(P, 'spanner')) { api.give(P, 'spanner', true); return 'BEEP. SPANNER REQUESTED. DISPENSING SPANNER. (A drawer pops open in B0B\'s tummy and out floats a space spanner. You take it.) PLEASE RETURN IT. NOBODY RETURNS IT. BEEP.'; } if (api.qOn(P, 'antenna')) return 'BEEP. YOU ALREADY HAVE THE SPANNER. IT IS IN YOUR BAG. BEEP BOOP.'; return 'BEEP. MY TOOLBOX CONTAINS: 1 SPANNER (IF RETURNED), 4 BISCUITS, 1 PICTURE OF MY MOM (A TOASTER).'; }, 'cups of tea,tea': 'TEA IS THE FUEL OF ALL HUMANS. BEEP.', 'name': 'I AM B0B. THAT IS A ZERO, NOT AN O. COMMON MISTAKE. BEEP.' },
  chat: ['B0B beeps happily.', 'B0B pours a cup of tea in zero gravity. The tea floats away in a ball.', 'B0B says, "BEEP BOOP. ALL SYSTEMS NORMAL. EXCEPT ANTENNA. AND THE TOILET."'],
});
N('squeakbert', 'Queen Squeakbert', 'squeakbert queen mouse', {
  here: 'Queen Squeakbert of the Moon Mice sits on her throne of Edam, in a bottle-top crown.',
  desc: 'A small white mouse in a tiny silver spacesuit, with a bottle-top crown and a cape made from a crisp packet. She is very brave and very small.',
  greet: 'Squeak! A hero from Earth! We have waited so long!',
  again: 'Squeak! Our hero! The whole Moon thanks you!',
  shop: { n: 'The Royal Cheese Shop', sells: ['mooncheese'], thanks: ['Squeak! Enjoy!', 'The finest cheese on the Moon! (The only cheese on the Moon. Well. The Moon IS cheese.)'] },
  topics: { 'muncher,asteroid': 'A giant space worm! It has eaten three craters and a satellite! If it keeps munching, there won\'t BE a Moon! It lives in a pit beyond the Cheese Mines.', 'cheese': 'The Moon is the finest cheese in the solar system. Tangy, crumbly, slightly radioactive. Lovely.', 'mice,moon mice': 'We came up on an old rocket a long time ago. We liked it. We stayed.' },
  chat: ['Queen Squeakbert squeaks orders to her mice.', 'A Moon Mouse brings the Queen a crumb of cheese on a tray.', 'Queen Squeakbert bounces gently in the low gravity.'],
});

// ================================================================ quests
const QUESTS = [
  { id: 'grad', n: 'Graduation Day', giver: 'headmistress', rup: 3,
    intro: "Welcome to the Adventurers' Academy! Before you go off adventuring, you need to pass your lessons. Each teacher shows you one thing. Do them all, then go and see the Headmistress (UP from the Library) for your diploma.",
    nag: 'Have you done all your lessons? Your QUESTS journal says what is left.',
    steps: [
      { k: 'talk', to: 'pixel', hint: 'Go {W}WEST{x} into the Room of Moving and {W}TALK PIXEL{x}.', done: 'Professor Pixel has taught you how to walk about.' },
      { k: 'have', i: 'scarf', hint: 'Fetch your Academy scarf from the Cloakroom ({W}WEST{x} of the Room of Moving): {W}GET SCARF{x}, then {W}WEAR SCARF{x}.', done: 'You have your scarf! Stylish.' },
      { k: 'talk', to: 'inventoria', hint: 'Go back {W}EAST{x} twice to the Hall of Things and {W}TALK INVENTORIA{x}.', done: 'Madame Inventoria has shown you how to look after your things.' },
      { k: 'kill', m: 'dummy', n: 1, hint: 'Go to the Training Yard ({W}SOUTH{x} of the Entrance Hall) and beat Dennis: {W}KILL DUMMY{x}.', done: 'Dennis is defeated! Sergeant Stuffing nods approvingly.' },
      { k: 'talk', to: 'bookworm', hint: 'Visit Librarian Bookworm in the Library ({W}NORTH{x} of the Entrance Hall): {W}TALK BOOKWORM{x}.', done: 'Librarian Bookworm has told you about HELP and QUESTS.' },
      { k: 'talk', to: 'headmistress', hint: 'Go {W}UP{x} from the Library and {W}TALK HEADMISTRESS{x} to graduate!', say: 'Well, well. All your lessons, done. I am VERY proud of you. Here is your diploma. Baudby is south of the gates. Go and be marvellous.' },
    ],
    reward: { xp: 80, gold: 30, items: ['diploma', 'guidebook'], title: 'the Graduate', secret: 'md.grad' }, art: 'diploma',
    end: 'You are now a proper adventurer! Leave through the gates SOUTH of the Training Yard to reach Baudby. Talk to everyone. Help everyone. Have fun!' },
  { id: 'kitty', n: 'The Lost Kitten', giver: 'granny', lv: 1, rup: 4,
    intro: "Granny Byte's kitten, Pixel, has climbed somewhere high and can't get down. Granny heard her mewing from up high in the woods. Is there a very tall tree nearby?",
    nag: "Have you found my little Pixel, dear? She loves climbing up high.",
    steps: [
      { k: 'have', i: 'pixel', hint: 'Find Pixel the kitten. She is somewhere very high up in the woods. (Climb the Giant Oak, west along the path, as far UP as you can go.)', done: 'Pixel purrs in your arms like a 28.8k modem!' },
      { k: 'give', i: 'pixel', to: 'granny', hint: 'Take Pixel back to Granny Byte\'s cottage: {W}GIVE PIXEL GRANNY{x}.', say: 'PIXEL! Oh, my little Pixel! Oh, thank you, thank you! You must have a cookie. No, three cookies!' },
    ],
    reward: { xp: 90, gold: 25, items: ['cookie', 'cookie', 'cookie'] } },
  { id: 'post', n: 'Special Delivery', giver: 'pat', lv: 1, rup: 4, give: ['parcel'],
    intro: "Pat has a parcel for Professor Hoot, the owl who lives in the Owl Tree, deep in the Whispering Woods (past the troll bridge). She has given it to you. Take it to him, and bring back his reply!",
    nag: "Still got that parcel, pet? Professor Hoot is in the Deep Woods, past Trevor's bridge.",
    steps: [
      { k: 'give', i: 'parcel', to: 'hoot', hint: 'Take the parcel to Professor Hoot, in the Owl Tree in the Deep Woods (west of the troll bridge): {W}GIVE PARCEL HOOT{x}.', say: "A parcel! For me? Hoo! My new spectacles! Oh, I can see EVERYTHING! Here, take this letter back to Pat, would you? Hoo-hoo.", give: 'letter' },
      { k: 'give', i: 'letter', to: 'pat', hint: 'Take Professor Hoot\'s letter back to Postmistress Pat at the Post Office (Academy Lane, Baudby): {W}GIVE LETTER PAT{x}.', say: 'Ooh, a letter! From the Professor! Lovely loopy handwriting. Thank you, pet, here\'s something for your trouble. And a pair of my spare trainers. Lights in the heels!' },
    ],
    reward: { xp: 120, gold: 35, items: ['trainers'] } },
  { id: 'riddle', n: "The Troll's Riddle", giver: 'trevor', lv: 1, rup: 3,
    intro: 'Trevor the Toll Troll will only let you over his bridge if you answer his riddle. SAY your answer out loud!',
    nag: "Well? What's the answer? Just SAY it!",
    steps: [{ k: 'say', r: 'woods.bridge', w: ['keyboard'], done: 'Trevor leaps up and claps his big hands. "A KEYBOARD! YES! Oh, you\'re good. You\'re VERY good. Over you go, friend!"', hint: 'Answer Trevor\'s riddle by SAYing the answer at the troll bridge. ("I have keys but open no locks...") {D}ASK TREVOR ABOUT HINT if you\'re stuck.{x}' }],
    reward: { xp: 60, items: ['pebble'], flag: 'troll', secret: 'md.riddle' },
    end: 'Trevor gives you his lucky pebble on a string. "You\'re a proper clever clogs, you are!"' },
  { id: 'arcade', n: 'Beat the Guess-O-Tron', giver: 'luke', lv: 1, rup: 3,
    intro: 'Luke has bet you can\'t beat the Guess-O-Tron in the Pixel Palace. It thinks of a number from 1 to 100, and you get seven guesses. Win, and bring Luke the prize ticket!',
    nag: "Go on, have a go! PLAY at the Guess-O-Tron. Start in the middle!",
    steps: [
      { k: 'have', i: 'ticket', hint: 'Beat the Guess-O-Tron in the Pixel Palace: type {W}PLAY{x}, then {W}GUESS 50{x} and so on. Win the prize ticket!', done: 'You beat the Guess-O-Tron! WINNER WINNER WINNER!' },
      { k: 'talk', to: 'luke', hint: 'Show Luke your prize ticket: {W}TALK LUKE{x}.', say: "NO WAY! You actually beat it! Nobody's beaten it since I programmed it! That's well good. Here, have this, I won it off the claw machine." },
    ],
    reward: { xp: 70, gold: 40, title: 'the Arcade Ace', take: ['ticket'] } },
  { id: 'geese', n: 'Goose Trouble', giver: 'giles', lv: 2, rup: 5,
    intro: 'Farmer Giles\' geese have gone completely bonkers. They chase the cows, the post lady and the tractor. Shoo four of them away from the Goose Field (east of his farmyard)!',
    nag: 'Ooh-arr. Them geese still honkin\'?',
    steps: [
      { k: 'kill', m: 'goose', n: 4, hint: 'Beat 4 honking geese in the Goose Field, east of Giles\' Farmyard.', done: "The Goose Field goes quiet. Well, quieter. One goose still honks, from far away, out of spite." },
      { k: 'talk', to: 'giles', hint: 'Go back and tell Farmer Giles: {W}TALK GILES{x}.', say: "Ooh-arr! Peace and quiet at last! You're a proper hero, you are. Here, take my spare wellies. Geese can't peck through these." },
    ],
    reward: { xp: 140, gold: 40, items: ['wellies'] } },
  { id: 'crows', n: 'The Royal Carrot', giver: 'bunnyking', lv: 2, rup: 4,
    intro: "A mischievous crow has stolen the Bunny King's Royal Golden Carrot! Crows hang about Buttercup Meadow and Scarecrow Corner. Teach them a lesson, then find out where the carrot went.",
    nag: 'Our carrot, hero! Have you found our carrot?',
    steps: [
      { k: 'kill', m: 'crow', n: 3, hint: 'Shoo 3 mischievous crows in Buttercup Meadow or Scarecrow Corner (north of the Crossroads).', done: 'That should teach them! But which one had the carrot? Maybe someone who watches the crows all day saw something...' },
      { k: 'talk', to: 'strawbert', hint: 'Ask Strawbert the scarecrow if he saw where the carrot went: {W}TALK STRAWBERT{x}.', say: "A golden carrot? Funny you should say that... a crow dropped one right on my hat when you were chasing them about! Here you go. Don't let it near my face, I'll get ideas.", give: 'carrot' },
      { k: 'give', i: 'carrot', to: 'bunnyking', hint: 'Take the golden carrot back to the Royal Warren (down the big hole at the Bunny Burrow): {W}GIVE CARROT KING{x}.', say: 'OUR CARROT! Oh, joy! Oh, rapture! Let it be known throughout the warren: this hero is a FRIEND OF THE RABBITS!' },
    ],
    reward: { xp: 130, gold: 35, items: ['gloves'], title: 'Friend of the Rabbits' } },
  { id: 'pages', n: "Dave's Lost Pages", giver: 'dave', lv: 2, rup: 5,
    intro: "Dave has lost three pages of his spellbook and the Archmage is testing him on Friday. Page one is somewhere in the Academy library. Page two went down a drain (into the sewers). Page three was taken by the fairy in the woods.",
    nag: "Any luck with my pages? I'm DOOMED if I don't get them back.",
    steps: [
      { k: 'have', i: 'page1', hint: 'Find page one in the Academy Library. (Try {W}SEARCH{x}.)', done: 'Page one! One down, two to go.' },
      { k: 'have', i: 'page2', hint: "Find page two in the sewers. Everything lost down a drain ends up in the Lost Property Pipe. (Try {W}SEARCH{x}.)", done: 'Page two! A bit damp, but readable.' },
      { k: 'have', i: 'page3', hint: 'Get page three from Flicker the fairy at the Fairy Ring in the woods: {W}ASK FLICKER ABOUT PAGE{x}.', done: 'Page three! Corrected in red pen.' },
      { k: 'talk', to: 'dave', hint: 'Take all three pages back to Dave in the Wizards\' Tower (Guild Row): {W}TALK DAVE{x}.', say: "MY PAGES! You absolute legend! I'm saved! Here, have my old hat. It's only been on fire twice. Don't tell the Archmage." },
    ],
    reward: { xp: 200, gold: 30, items: ['wizhat'], take: ['page1', 'page2', 'page3'] } },
  { id: 'helmet', n: "A Knight Without a Helmet", giver: 'clanksalot', lv: 3, rup: 4,
    intro: 'Sir Clanksalot lost his helmet fighting a bramble beast, and now his fringe keeps falling in his eyes. He thinks it is somewhere in the Bramble Patch (south of the clearing).',
    nag: 'Any sign of my helmet? I just walked into another tree.',
    steps: [
      { k: 'have', i: 'helmet', hint: "Find Sir Clanksalot's helmet in the Bramble Patch (south of the Sunny Clearing). {W}SEARCH{x} the brambles!", done: "There it is! A bit dented. Smells of blackberries." },
      { k: 'give', i: 'helmet', to: 'clanksalot', hint: 'Give the helmet back to Sir Clanksalot in the Sunny Clearing: {W}GIVE HELMET CLANKSALOT{x}.', say: "My HELMET! I can SEE! Oh, look at that, there's a tree right there. I've been walking into that. Thank you, friend! Please, take my spare shield." },
    ],
    reward: { xp: 160, gold: 20, items: ['knightshield'] } },
  { id: 'honey', n: 'A Bear Necessity', giver: 'ted', lv: 3, rup: 4,
    intro: "Big Ted the bear is fast asleep, and he's blocking the way west into a hidden grove. In his sleep, he keeps mumbling about honey...",
    nag: 'ZZZZzzzz... honey... honey... ZZZZzzz...',
    steps: [
      { k: 'have', i: 'honey', hint: "Get a jar of honey. Farmer Giles' beehives are south of the Apple Orchard in Floppy Fields, or Mrs Bundle sells it at the Corner Shoppe.", done: 'Mmm. Sticky. Big Ted is going to love this.' },
      { k: 'give', i: 'honey', to: 'ted', hint: 'Give the honey to Big Ted in the Bear\'s Cave (Deep Woods): {W}GIVE HONEY TED{x}.', say: "*sniff sniff*... HONEY! Big Ted sits up, wide awake, and scoffs the whole jar in one go. \"Mmmmm! Fank you! Oh, am I in the way? Sorry!\" He shuffles aside. The way west is open!" },
    ],
    reward: { xp: 150, gold: 15, flag: 'ted' } },
  { id: 'socks', n: 'The Great Sock Mystery', giver: 'mayor', lv: 4, rup: 8,
    intro: "Baudby's socks are vanishing! Always one at a time, never a pair! The Mayor is sure it's the sock gremlins in the sewers (down the ladder in the Back Alley), and that their leader, King Ratbag, has a big bag of them somewhere.",
    nag: 'Any news, hero? I am down to my last pair. Well, my last two odd ones.',
    steps: [
      { k: 'kill', m: 'gremlin', n: 5, hint: 'Beat 5 sock gremlins in the sewers (down the ladder in the Back Alley).', done: "The gremlins are running scared! Now for their leader: King Ratbag, in his throne room at the east end of the sewers." },
      { k: 'have', i: 'bagsocks', hint: "Defeat King Ratbag in his throne room (east end of the sewers, past the Big Grate) and get the Big Bag of Socks. He's level 7!", done: 'The Big Bag of Socks! Every sock Baudby has lost since 1987!' },
      { k: 'give', i: 'bagsocks', to: 'mayor', hint: 'Take the Big Bag of Socks to Mayor Wobblebottom in the Town Hall: {W}GIVE BAG MAYOR{x}.', say: 'THE SOCKS! You found them! All of them! Baudby is saved! Let it be known that this hero is the SOCK SAVIOUR OF BAUDBY! Take this medal. You deserve it.' },
    ],
    reward: { xp: 380, gold: 120, items: ['medal'], title: 'the Sock Saviour' } },
  { id: 'parrot', n: "Polly Wants a Cracker", giver: 'pete', lv: 5, rup: 5,
    intro: "Captain Pegleg Pete's parrot, Polly-Gon, flew off in a huff because he forgot her cracker. She's probably sulking at the top of the lighthouse. Take her a cracker and bring her home.",
    nag: 'Arrr. Me shoulder\'s cold without Polly.',
    steps: [
      { k: 'have', i: 'cracker', hint: 'Get a cream cracker. There\'s a barrel of them in the Pirate Camp ({W}GET CRACKER{x}), or Mrs Bundle sells them.', done: 'One cream cracker, ready for a parrot.' },
      { k: 'give', i: 'cracker', to: 'polly', hint: 'Climb the lighthouse (north of Crab Rocks) and give Polly-Gon the cracker: {W}GIVE CRACKER POLLY{x}.', say: 'SQUAWK! CRACKER! CRACKER! *crunch crunch* ...GOOD HUMAN! Polly-Gon hops onto your shoulder and nibbles your ear.', give: 'parrot' },
      { k: 'give', i: 'parrot', to: 'pete', hint: 'Take Polly-Gon back to Captain Pete at the Pirate Camp: {W}GIVE PARROT PETE{x}.', say: "POLLY! Me beautiful bird! Arrr, I'll never forget your cracker again, I promise! You, matey, have done me a great service. Here: me grandad's treasure map. A pirate always pays his debts!" },
    ],
    reward: { xp: 230, gold: 30, items: ['map'] } },
  { id: 'treasure', n: 'X Marks the Spot', giver: 'pete', lv: 5, need: ['parrot'], rup: 6,
    intro: "Pete's treasure map shows an X on the Lonely Dune, south of the Palm Grove. Go and DIG there!",
    nag: "Found me grandad's treasure yet? The X be on the Lonely Dune, south of the palms. DIG, matey!",
    steps: [
      { k: 'have', i: 'chest', hint: 'Go to the Lonely Dune (south of the Palm Grove) and {W}DIG{x}! (READ MAP to check.)', done: 'Clunk! A treasure chest!' },
      { k: 'give', i: 'chest', to: 'pete', hint: 'Bring the chest back to Captain Pete: {W}GIVE CHEST PETE{x}.', say: "ARRR! Grandad's chest! Let's see... gold! Doubloons! And... his old hat! You keep the hat, matey. And a share of the gold. Fair's fair!" },
    ],
    reward: { xp: 260, gold: 250, items: ['piratehat'], title: 'the Treasure Hunter' } },
  { id: 'squidgy', n: "Squidgy's Last Dinner", giver: 'bill', lv: 8, rup: 7,
    intro: "Squidgy, the Kraken's little cousin, pinches Old Barnacle Bill's dinner every single night. Give that octopus a fright he won't forget! He lives right here in the grotto: he'll come up if you wait.",
    nag: 'Is that octopus still about? I can hear him giggling.',
    steps: [
      { k: 'kill', m: 'squidgy', n: 1, hint: 'Defeat Squidgy (level 9) in the Kraken\'s Grotto, under the Smuggler\'s Cove.', done: 'Squidgy squelches off into the deep sea, giggling. He won\'t be back for a while!' },
      { k: 'talk', to: 'bill', hint: 'Tell Old Barnacle Bill: {W}TALK BILL{x}.', say: "Ha-HA! Did you see him go! That'll learn him! You've earned this, young'un. My lucky barnacle amulet. Well, my SECOND luckiest barnacle." },
    ],
    reward: { xp: 600, gold: 80, items: ['amulet'] } },
  { id: 'lag', n: 'Buffering...', giver: 'archmage', lv: 8, rup: 8,
    intro: "The Great Buffer Beast in the Caves of Lag is slowing down all the magic in the realm. Spells take AGES to load! Defeat it and bring back the Hourglass of Patience, the thing that powers it. The caves are up in the Grumbly Hills, north of Floppy Fields. Gloomy Gus will row you across the lake.",
    nag: 'Hmm? Oh. The Beast. Yes. Still buffering, I take it?',
    steps: [
      { k: 'have', i: 'hourglass', hint: 'Defeat the Great Buffer Beast (level 11) in the Caves of Lag (across the lake, down the tunnel, north) and take the Hourglass of Patience.', done: 'The Hourglass of Patience! The sand is already falling faster.' },
      { k: 'give', i: 'hourglass', to: 'archmage', hint: 'Give the Hourglass to Archmage Floppington in the Wizards\' Tower: {W}GIVE HOURGLASS ARCHMAGE{x}.', say: "The Hourglass! My crystal ball... it's... it's LOADED! Instantly! Oh, wonderful, wonderful! I shall make you something special from it. There. A Wonder Wand. Absolutely no lag at all." },
    ],
    reward: { xp: 900, gold: 150, items: ['wonderwand', 'wizring'], title: 'the Lag Slayer' } },
  { id: 'floppy', n: "The Dragon's Save Game", giver: 'floppitha', lv: 9, rup: 8,
    intro: "Floppitha the dragon dropped her precious Golden Floppy Disk (her save game, two hundred years of progress!) somewhere among the crystals in the Crystal Grotto, in the Caves of Lag. Find it!",
    nag: 'Any sign of my disk, dear? Two hundred years...',
    steps: [
      { k: 'have', i: 'goldfloppy', hint: 'Search the Crystal Grotto in the Caves of Lag for the Golden Floppy Disk: {W}SEARCH{x}.', done: 'The Golden Floppy Disk! Not a scratch on it.' },
      { k: 'give', i: 'goldfloppy', to: 'floppitha', hint: 'Take the disk back to Floppitha in her hoard (Mount Megabyte, east from the Great Hall): {W}GIVE FLOPPY FLOPPITHA{x}.', say: "MY SAVE GAME! Oh, you wonderful, wonderful little hero! I can finally finish my adventure! Here: one of my old scales, made into a shield. And you shall be known as a Friend of Dragons, forever." },
    ],
    reward: { xp: 1000, gold: 200, items: ['dragonshield', 'ruby'], title: 'the Dragon Friend', secret: 'md.dragon' } },
  { id: 'launch', n: 'The Astronaut Exam', giver: 'countdown', lv: 10, rup: 6,
    intro: "Dr Countdown will only let proper astronauts fly the Starhopper 99. Answer his three space questions by SAYing the answers here at the Rocket Range. (Stuck? The owl in the woods knows everything.)",
    nag: 'Ready for the next question, astronaut?',
    steps: [
      { k: 'say', r: 'fields.range', w: ['armweak', 'armstrong'], hint: '{W}Question 1:{x} "Who was the first person to walk on the Moon?" (SAY the answer at the Rocket Range.)', done: 'Dr Countdown says, "CORRECT! Neil Armweak, July 1969! Next question!"' },
      { k: 'say', r: 'fields.range', w: ['garglin', 'gagarin'], hint: '{W}Question 2:{x} "Who was the very first person to go into space, in 1961?" (SAY the answer.)', done: 'Dr Countdown says, "CORRECT! Yuri Garglin, 1961! One more!"' },
      { k: 'say', r: 'fields.range', w: ['apollo'], hint: '{W}Question 3:{x} "What was the name of the NASSA programme that took people to the Moon?" (SAY the answer.)', done: 'Dr Countdown says, "CORRECT! The Apollo programme! TEN! NINE! You PASS!"' },
    ],
    reward: { xp: 500, items: ['pass'], title: 'the Astronaut', secret: 'md.astronaut' },
    end: 'Dr Countdown laminates a Launch Pass for you right there with a little machine. "Get in the rocket and type BOARD! Then LAUNCH! Off you go!"' },
  { id: 'antenna', n: 'Phone Home', giver: 'nova', lv: 10, rup: 7, give: ['spacehelmet'],
    intro: "Orbital Station 99's antenna is broken, and meteorite gremlins keep unscrewing the bolts. Commander Nova has given you a space helmet. Get a spanner from B0B, go out through the airlock (UP from the Observation Deck), deal with the gremlin and fix the antenna!",
    nag: 'How is that antenna coming along, rookie?',
    steps: [
      { k: 'have', i: 'spanner', hint: 'Ask B0B the robot (in the Control Room) for a spanner: {W}ASK BOB ABOUT SPANNER{x}.', done: 'One space spanner. It has little fins.' },
      { k: 'flag', f: 'antenna', hint: 'WEAR your space helmet, go UP from the Observation Deck to the airlock, then OUT. Beat the meteorite gremlin and {W}USE SPANNER{x} on the antenna.', done: 'The antenna is fixed! You hear a faint beeping in your helmet: SIGNAL ACQUIRED.' },
      { k: 'talk', to: 'nova', hint: 'Report back to Commander Nova in the Control Room: {W}TALK NOVA{x}.', say: "We've got signal! I can ring my mom! You, rookie, are a STAR. A real one. Keep the helmet. And take this: the Cosmic Bow. A moonbeam for a string. Pretty fancy, eh?" },
    ],
    reward: { xp: 1100, gold: 150, items: ['cosmicbow'], title: 'the Space Cadet', take: ['spanner'] } },
  { id: 'muncher', n: 'Save the Moon!', giver: 'squeakbert', lv: 13, rup: 9,
    intro: "The Asteroid Muncher, a giant space worm, is eating the Moon! It lives in a pit past the Cheese Mines (down from the Big Crater, then east). Stop it before there's no Moon left!",
    nag: 'Squeak! It is still munching! We can hear it!',
    steps: [
      { k: 'kill', m: 'muncher', n: 1, hint: 'Defeat the Asteroid Muncher (level 16) in the Muncher\'s Pit, past the Cheese Mines.', done: 'The Asteroid Muncher wriggles off into deep space! The Moon is SAVED!' },
      { k: 'talk', to: 'squeakbert', hint: 'Tell Queen Squeakbert the good news: {W}TALK SQUEAKBERT{x}.', say: 'Squeak! SQUEAK! You did it! The Moon is safe! Mice, bring the Royal Crown of Cheese! No, the BIG one! Hero, wear it with pride!' },
    ],
    reward: { xp: 2200, gold: 300, items: ['cheesecrown'], title: 'the Moon Hero', secret: 'md.moonhero' } },
  { id: 'millennium', n: 'The Millennium Bug', giver: 'tom', lv: 14, need: ['socks', 'lag'], rup: 10, give: ['ironkey'],
    intro: "Deep under the Clock Tower, in the Old Server Room, the Millennium Bug is gnawing at the cable that runs every clock in Baudby. When the year 2000 arrives, it wants every clock to think it's 1900! Old Tom Tick has given you the Big Iron Key to the trapdoor. Go down, find the Bug's nest, and stop it. Take friends. Take a bard.",
    nag: "The Bug, hero. It's still down there. I can feel it in my watches.",
    steps: [
      { k: 'kill', m: 'y2kbug', n: 1, hint: 'Defeat THE MILLENNIUM BUG (level 18) in its nest at the far end of the Old Server Room (DOWN through the trapdoor in the Clock Tower).', done: 'The Millennium Bug is beaten! Somewhere above, the Clock Tower chimes happily.' },
      { k: 'talk', to: 'tom', hint: 'Tell Old Tom Tick: {W}TALK TOM{x}.', say: "You did it. You actually did it! Listen... tick, tock, tick, tock. That's the sound of every clock in Baudby, ready for the year 2000. You're a true hero. The truest. Take these. You've earned them." },
    ],
    reward: { xp: 4000, gold: 500, items: ['millmedal', 'megablade'], title: 'the Millennium Hero' }, art: 'fireworks' },
];

// ================================================================ room actions
const ACT = {};
const say = (api, P, who, text) => api.out(P, `{Y}${who} says, "${text}"{x}`);
ACT['school.library'] = {
  search(api, P) { if (api.qOn(P, 'pages') && !api.has(P, 'page1')) { api.out(P, '{G}You climb the library ladder and search the top shelf... a loose page flutters out of a book called "Spells For Dummies"! It\'s page one of Dave\'s spellbook!{x}'); api.give(P, 'page1', true); return true; } return false; },
  type(api, P) { api.out(P, 'You type on the library computer. The falling blocks speed up. You get a line! Librarian Bookworm coughs pointedly.'); return true; },
};
ACT['school.yard'] = {};
ACT['town.square'] = {
  wish(api, P) {
    if (api.gold(P) < 1) { api.out(P, "You haven't got a coin to throw in. Wishes cost at least a penny."); return true; }
    api.gold(P, -1);
    const W = ['An Ultra 64 with four controllers.', 'No homework. Ever.', 'That the Millennium Bug turns out to be nothing.', 'That Mom lets you stay up late on Friday.', 'Unlimited Fizz Pop.', 'That the phone line is free when you want it.', 'A pet dragon.'];
    api.out(P, `You throw a gold coin into the fountain and make a wish: {W}${api.pick(W)}{x}\nThe statue's worried face looks a tiny bit less worried.`);
    api.toRoom(P.room, `${P.name} throws a coin in the fountain and makes a wish.`, P);
    api.secret(P, 'md.wish');
    if (api.chance(0.08)) { api.out(P, '{Y}The fountain burbles, and a coin pops back out with a bit extra! (+10 gold){x}'); api.gold(P, 10); }
    return true;
  },
};
ACT['town.temple'] = {
  press(api, P, a) { return ACT['town.temple'].push(api, P, a); },
  push(api, P) {
    api.out(P, '{C}You press the big glowing RESET button. There is a soft chime, like a computer starting up. Bing-bong-bing. You feel fresh and new, as if you just woke up from a really good nap.{x}');
    api.heal(P, 10); api.toRoom(P.room, `${P.name} presses the RESET button. Bing-bong-bing!`, P); api.secret(P, 'md.reboot');
    return true;
  },
  pray(api, P) { api.out(P, 'You kneel and say a little prayer to Saint Reboot. You feel calmer. Like when the computer comes back on and nothing was lost.'); return true; },
};
ACT['town.park'] = {
  feed(api, P) { if (!api.has(P, 'crumbs')) { api.out(P, "You haven't got anything to feed them. (There's a bag of crumbs on the ground: GET CRUMBS.)"); return true; } api.take(P, 'crumbs', 1); api.out(P, 'You throw the crumbs. Instantly you are surrounded by every duck in Baudby, all quacking. It is the best and loudest moment of your life.'); api.toRoom(P.room, `${P.name} feeds the ducks and disappears under a pile of quacking.`, P); api.secret(P, 'md.ducks'); return true; },
};
ACT['town.arcade'] = {
  play(api, P) {
    const n = api.rint(1, 100); api.mark(P, 'gt', n); api.mark(P, 'gtn', 7);
    api.out(P, `{Y}╔═════════════════════════════╗\n║   G U E S S - O - T R O N   ║\n╚═════════════════════════════╝{x}\n{G}BEEP BOOP! I HAVE THOUGHT OF A NUMBER FROM 1 TO 100.\nYOU HAVE 7 GUESSES. TYPE {W}GUESS{G} AND A NUMBER, LIKE {W}GUESS 50{G}.{x}`);
    api.toRoom(P.room, `${P.name} starts a game on the Guess-O-Tron. BEEP BOOP!`, P);
    return true;
  },
  guess(api, P, a) {
    const n = api.mark(P, 'gt'); if (!n) { api.out(P, 'Type PLAY first, to start a game.'); return true; }
    const g = Math.floor(+String(a).replace(/[^\d]/g, '')); if (!(g >= 1 && g <= 100)) { api.out(P, '{G}THE GUESS-O-TRON SAYS: "A NUMBER FROM 1 TO 100, PLEASE. LIKE: GUESS 50."{x}'); return true; }
    const left = api.mark(P, 'gtn', api.mark(P, 'gtn') - 1);
    if (g === n) {
      api.mark(P, 'gt', 0);
      api.out(P, `{Y}*** ${g}! CORRECT! ***{x}\n{G}THE GUESS-O-TRON FLASHES ALL ITS LIGHTS AND PLAYS A LITTLE TUNE. WINNER! WINNER! WINNER!{x}`);
      api.toRoom(P.room, `{Y}The Guess-O-Tron goes WINNER WINNER WINNER for ${P.name}!{x}`, P);
      if (!api.has(P, 'ticket') && !api.qDone(P, 'arcade')) { api.give(P, 'ticket', true); api.out(P, '{W}A long strip of prize tickets spools out of the machine. You take it!{x}'); }
      else { api.gold(P, 5); api.out(P, '{D}(A little shower of 5 gold coins drops out of the slot.){x}'); }
      api.secret(P, 'md.guess');
      return true;
    }
    if (left <= 0) { api.mark(P, 'gt', 0); api.out(P, `{R}${g}? WRONG! OUT OF GUESSES! IT WAS ${n}. HA HA HA. INSERT COIN... (type PLAY to try again){x}`); return true; }
    api.out(P, `{G}${g}? ${g < n ? 'HIGHER!' : 'LOWER!'}  ({W}${left}{G} guess${left === 1 ? '' : 'es'} left){x}`);
    return true;
  },
};
ACT['town.cafe'] = {
  type(api, P) { api.out(P, `You sit at a free computer and type. {D}[You are in #baudby. 4 users.]{x}\n  {c}<Gubbinz>{x} hi\n  {c}<sk8rgrrl99>{x} hey!! a/s/l? jk lol\n  {c}<Gubbinz>{x} who wants 2 hear a joke\n  {c}<n64kid>{x} no\n  {D}The computer runs out of time. "£2 FOR ANOTHER HOUR," it says. You get up.{x}`); return true; },
};
ACT['town.tower'] = { ring(api, P) { api.out(P, 'You pull the bell rope. BONNNNNG. Old Tom jumps out of his skin. "OI!"'); api.toRoom(P.room, `${P.name} rings the tower bell! BONNNNNG!`, P); return true; } };
ACT['town.inn'] = { sit(api, P) { return false; } };
ACT['fields.hay'] = {
  jump(api, P) { api.out(P, 'You take a run-up and leap into the biggest haystack. FLUMPH! Hay everywhere. In your hair, in your ears, down your jumper. Brilliant.\n{W}...and you find a needle in the haystack. An actual needle! Well, now you know.{x}'); api.toRoom(P.room, `${P.name} leaps into a haystack. FLUMPH!`, P); api.secret(P, 'md.needle'); return true; },
};
ACT['fields.hives'] = {
  get(api, P, a) {
    if (!/^(honey|jar)/i.test(a)) return false;
    if (api.mobsIn(P.room).some(m => m.id === 'bee')) { api.out(P, '{R}The grumpy bumblebee buzzes right in your face! You\'ll have to deal with it before you can get near the hives.{x}'); return true; }
    if (api.has(P, 'honey')) { api.out(P, 'You already have a jar of honey. The sign says ONE JAR, and you are an honest hero.'); return true; }
    api.give(P, 'honey', true); api.out(P, 'You carefully lift the lid of a hive and take a jar of honey from the little shelf inside. The bees hum politely. Thank you, bees!'); return true;
  },
};
ACT['fields.range'] = {
  board(api, P) {
    if (!api.has(P, 'pass')) { say(api, P, 'Dr Countdown', "Woah woah WOAH! No Launch Pass, no rocket! Pass my Astronaut Exam first. TALK COUNTDOWN!"); return true; }
    api.teleport(P, 'space.rocket', `${P.name} climbs up the ladder into the Starhopper 99.`, null); return true;
  },
  enter(api, P) { return ACT['fields.range'].board(api, P); },
};
ACT['space.rocket'] = {
  launch(api, P) {
    api.out(P, module.exports.ARTX.rocket); api.out(P, `{Y}You press the big red LAUNCH button.{x}\n{W}  10... 9... 8... 7... 6... 5... 4... 3... 2... 1...{x}\n{R}  ▲▲▲  LIFT OFF!!!  ▲▲▲{x}\n{C}The rocket shakes, rattles and roars. You're squashed into your seat. Out of the window, Baudby gets smaller and smaller... the sky goes dark blue... then black... and full of stars. You're in SPACE!{x}\n{D}...a little while later, the Starhopper docks gently with Orbital Station 99. Clunk.{x}\n`);
    api.toRoom('fields.range', '{R}With a mighty ROAR, the Starhopper 99 blasts off into the sky!{x}', P);
    api.teleport(P, 'space.dock', null, `${P.name} floats out of the Starhopper 99, looking a bit green.`); api.secret(P, 'md.space'); return true;
  },
  press(api, P, a) { if (/do not|small|dave/i.test(a)) { api.out(P, 'You press the DO NOT PRESS button. A little flag pops out that says "DAVE!!!" and a recording of Dr Countdown says "I SAID DON\'T PRESS IT." You feel slightly guilty.'); api.secret(P, 'md.donotpress'); return true; } return ACT['space.rocket'].launch(api, P); },
  push(api, P, a) { return ACT['space.rocket'].press(api, P, a); },
};
ACT['space.dock'] = {
  board(api, P) { api.out(P, '{C}You climb back into the Starhopper 99 and press the HOME button. Whoosh... re-entry... rumble... parachutes... BUMP. You land back at the Rocket Range!{x}\n'); api.teleport(P, 'fields.range', `${P.name} climbs into the Starhopper 99, which zooms off home.`, `{C}The Starhopper 99 lands with a BUMP and ${P.name} wobbles out.{x}`); return true; },
  shuttle(api, P) { if (api.lv(P) < 11) api.out(P, '{D}(The Moon is for heroes about level 12 and up. You go anyway. Brave!){x}'); api.out(P, '{C}You squeeze into the Moon shuttle, press GO, and drift down through space to the Moon. Bump... bounce... bounce...{x}\n'); api.teleport(P, 'moon.landing', `${P.name} takes the shuttle to the Moon.`, `The shuttle bounces down and ${P.name} hops out.`); api.secret(P, 'md.moon'); return true; },
};
ACT['moon.landing'] = { shuttle(api, P) { api.out(P, '{C}You hop back in the shuttle and float up to Orbital Station 99.{x}\n'); api.teleport(P, 'space.dock', `${P.name} takes the shuttle back up to the station.`, `The Moon shuttle docks and ${P.name} floats out.`); return true; }, board(api, P) { return ACT['moon.landing'].shuttle(api, P); } };
ACT['space.airlock'] = { gate(api, P, dir) { if (dir === 'out' && P.ch.eq.head !== 'spacehelmet') return api.has(P, 'spacehelmet') ? "You need to WEAR your space helmet first! (Type WEAR SPACE HELMET.) No helmet, no spacewalk." : 'A red light flashes: NO HELMET, NO SPACEWALK. You need a space helmet. Commander Nova has them.'; return null; } };
ACT['space.walk'] = {
  use(api, P, id, a) {
    if (!/spanner|wrench/i.test(a)) return false;
    if (!api.has(P, 'spanner')) { api.out(P, "You haven't got a spanner."); return true; }
    if (api.mobsIn(P.room).some(m => m.id === 'meteorite')) { api.out(P, '{R}The meteorite gremlin is hanging off the antenna, unscrewing it as fast as you can screw it! Deal with it first!{x}'); return true; }
    if (api.flag(P, 'antenna')) { api.out(P, 'The antenna is already fixed. You give a bolt a little extra twist anyway. Very professional.'); return true; }
    api.out(P, '{C}You float over to the antenna and get to work with the space spanner. Twist, twist, twist... You bend the dish back into shape with your hands. Somewhere inside your helmet, a little light goes green. BEEP BEEP BEEP!{x}');
    api.flag(P, 'antenna', 1); return true;
  },
};
ACT['woods.oak'] = { climb(api, P) { api.out(P, 'You climb the plank ladder.'); return false; } };
ACT['woods.branch'] = {
  extra(api, P) { return api.qOn(P, 'kitty') && !api.has(P, 'pixel') ? '{Y}A tiny black-and-white kitten is clinging to the very end of the branch, mewing pitifully. It must be Pixel! (Try GET PIXEL.){x}' : ''; },
  get(api, P, a) {
    if (!/^(pixel|kitten|cat)/i.test(a)) return false;
    if (!api.qOn(P, 'kitty') || api.has(P, 'pixel')) { api.out(P, 'There is no kitten here. Just a lot of leaves.'); return true; }
    api.out(P, 'You inch out along the branch... it wobbles... you reach out... and scoop up the tiny kitten! She purrs like a 28.8k modem and licks your nose.'); api.give(P, 'pixel', true); api.qEvent(P, 'have', 'pixel'); return true;
  },
};
ACT['woods.brambles'] = { search(api, P) { if (api.qOn(P, 'helmet') && !api.has(P, 'helmet')) { api.out(P, '{G}You push into the brambles (ow, ow, OW) and there, tangled in the thorns, is a dented knight\'s helmet with a feather on top!{x}'); api.give(P, 'helmet', true); api.qEvent(P, 'have', 'helmet'); return true; } return false; } };
ACT['woods.ring'] = {};
ACT['woods.bridge'] = { gate(api, P, dir) { return dir === 'w' && !api.flag(P, 'troll') ? 'Trevor the Toll Troll holds up a big mossy hand. "Ah-ah-ah! Riddle first! TALK TREVOR!"' : null; } };
ACT['woods.cave'] = { gate(api, P, dir) { return dir === 'w' && !api.flag(P, 'ted') ? "Big Ted is completely in the way, snoring. You try to squeeze past his tummy but it's like pushing a giant duvet. Maybe something sweet would wake him up? (TALK TED)" : null; }, wake(api, P) { if (!api.flag(P, 'ted')) api.out(P, 'You shake Big Ted. "mmm... five more minutes... honey..." He does not wake up.'); else api.out(P, 'He\'s already awake.'); return true; } };
ACT['sewers.lost'] = { search(api, P) { if (api.qOn(P, 'pages') && !api.has(P, 'page2')) { api.out(P, "{G}You rummage through the soggy lost property... a remote, a sock, a sock, a sock... and a soggy page with a star drawn on it! Page two of Dave's spellbook!{x}"); api.give(P, 'page2', true); api.qEvent(P, 'have', 'page2'); return true; } api.out(P, 'You rummage through the lost property. Marbles, a bike bell, a remote control, a single roller skate. Nothing you need right now.'); return true; } };
ACT['sea.camp'] = { get(api, P, a) { if (!/^cracker/i.test(a)) return false; if (api.has(P, 'cracker')) { api.out(P, 'You already have a cracker. Polly only needs one. (She says she needs twelve.)'); return true; } api.give(P, 'cracker', true); api.out(P, 'You take a cream cracker from the barrel.'); return true; } };
ACT['sea.dune'] = {
  dig(api, P) {
    if (!api.has(P, 'map')) { api.out(P, 'You dig a big hole in the sand. You find a crab. The crab is not happy. You fill the hole back in. (If only you had a map...)'); return true; }
    if (api.has(P, 'chest') || api.qDone(P, 'treasure')) { api.out(P, 'You dig, but the treasure has already been found. By you. Well done, you.'); return true; }
    if (!api.qOn(P, 'treasure')) api.qStart(P, 'treasure');
    api.out(P, '{Y}You dig where the arrow on the palm tree points... deeper... deeper... CLUNK! Your hands hit wood! You pull up a little treasure chest with brass corners!{x}'); api.out(P, module.exports.ARTX.chest);
    api.give(P, 'chest', true); api.qEvent(P, 'have', 'chest'); api.secret(P, 'md.treasure'); return true;
  },
};
ACT['caves.lake'] = {
  gate(api, P, dir) { return dir === 'n' ? "You can't swim across the lake: it's freezing and probably full of something. Gloomy Gus will row you over for 5 gold. Type PAY." : null; },
  pay(api, P) {
    if (api.gold(P) < 5) { say(api, P, 'Gloomy Gus', "Five gold. You haven't got five gold. That's sad. Everything's sad."); return true; }
    api.gold(P, -5); api.out(P, '{C}You pay Gus 5 gold. He sighs, unties the boat and rows you slowly across the black lake. Splish... splash... splish... "Lovely evening for it," he says, gloomily. You bump onto the island.{x}');
    api.teleport(P, 'caves.isle', `${P.name} pays Gloomy Gus and is rowed off across the lake.`, `Gloomy Gus's boat bumps the shore and ${P.name} climbs out.`); return true;
  },
};
ACT['caves.isle'] = { gate(api, P, dir) { if (dir === 's') api.out(P, '{C}Gloomy Gus rows you back across the lake for free. "Return trips are free. It\'s the least I can do. Literally the least."{x}'); return null; } };
ACT['caves.crystal'] = {
  search(api, P) {
    if (api.qOn(P, 'floppy') && !api.has(P, 'goldfloppy')) { api.out(P, "{G}You search among the glowing crystals... something gold glints in a crack between two big pink ones. You reach in and pull out... the Golden Floppy Disk! \"FLOPPITHA'S SAVE GAME. DO NOT FORMAT.\"{x}"); api.give(P, 'goldfloppy', true); api.qEvent(P, 'have', 'goldfloppy'); return true; }
    if (api.qOn(P, 'floppy') || api.qDone(P, 'floppy')) return false;
    api.out(P, 'You search among the crystals. Your reflection looks back at you a hundred times. You notice a gold glint deep in a crack, but you can\'t reach it. Maybe if you knew what you were looking for...'); return true;
  },
};
ACT['caves.mine'] = { push(api, P) { api.out(P, 'You push the mine cart. It rolls about two feet and stops with a clunk. Some rocks fall out. One of them looks at you. That one is a golem.'); return true; } };
ACT['mount.gate'] = { ring(api, P) { api.out(P, 'You press the giant doorbell. Somewhere deep in the castle, a tune plays: "Bing bong, BONG bong." A voice from very far away calls, "Come in, dear! It\'s open!"'); api.toRoom(P.room, `${P.name} rings the castle doorbell. Bing bong, BONG bong!`, P); return true; }, press(api, P) { return ACT['mount.gate'].ring(api, P); } };
ACT['mount.hoard'] = { get(api, P, a) { if (/gold|coin/i.test(a)) { say(api, P, 'Floppitha the dragon', "Ah-ah-ah! I've counted those, dear. Every single one."); return true; } return false; } };
ACT['town.docks'] = { board(api, P) { api.out(P, 'Just walk SOUTH to get on the Soggy Biscuit!'); return true; }, sail(api, P) { return ACT['town.docks'].board(api, P); } };
ACT['town.alley'] = { pet(api, P) { api.out(P, 'You reach out to stroke the cat. It allows this exactly once, then walks off with its tail in the air.'); return true; }, stroke(api, P) { return ACT['town.alley'].pet(api, P); } };
ACT['town.post'] = { post(api, P) { api.out(P, 'You post a letter to yourself. Pat stamps it. THUNK. "FIRST CLASS!" It arrives immediately, because you are standing in the Post Office.'); return true; } };
ACT['woods.grove'] = { swim(api, P) { api.out(P, 'You paddle in the pool under the waterfall. Freezing! But lovely. The waterfall roars. Behind it... is that a ledge?'); return true; } };
ACT['woods.owl'] = { knock(api, P) { api.out(P, 'You knock on the little door marked WOODPECKER. A woodpecker opens it, knocks back on your head, and closes it. Fair.'); return true; } };
ACT['moon.flag'] = { salute(api, P) { return false; } };
ACT['school.cloak'] = {};
ACT['den.office'] = { type(api, P) { api.out(P, '{G}C:\\JACKMUD> _{x}  You type on Jack\'s keyboard. The screen says: {W}"NICE TRY. - Jack"{x}'); return true; }, sit(api, P) { api.out(P, "You sit in Jack's chair. It is very squeaky and slightly too low. You spin round in it three times. Wheee."); return true; } };

module.exports = { NPCS, QUESTS, ACT };

// ================================================================ a little ANSI art, shown the first time you arrive somewhere (kept 40 columns wide for small screens)
const ART = {
  'town.acad': String.raw`{y}     ________________________________
    |{Y}   WELCOME TO BAUDBY            {y}|
    |{W}   Twinned with Lag-upon-Sea    {y}|
    |{D}   Please drive slowly          {y}|
    |{R}   (GEESE CROSSING)             {y}|
    |________________________________|
            {D}||                ||{x}
     {g}^^^^^^^{D}||{g}^^^^^^^^^^^^^^^^{D}||{g}^^^^^^{x}`,
  'sea.beach': String.raw`{Y}        \ | /{x}            {g}__ _.-""-._{x}
{Y}      -- (O) --{x}         {g}/  ' .-""-.{x}
{Y}        / | \{x}              {y}| |{x}
{C}   ~~~~~~~~~~~~~~~~~~{x}         {y}| |{x}
{B} ~~~~~~~~~~~~~~~~~~~~~~{y} __,,..|_|.._{x}
{B}~~~~~~~~~~~~~~~~~~~~~~~~{y}(____________){x}
{W}      THE ISLE OF SPAM{x}`,
  'space.dock': String.raw`{W}            .        *        .{x}
{D}   *{x}     {C}___________{x}       {D}.{x}
{B}    ====={C}|  O  O  O  |{B}====={x}
{C}         |___________|{x}    {D}*{x}
{D}  .{x}        {C}/   |   \{x}
{W}   ORBITAL STATION 99   {D}.{x}`,
  'moon.landing': String.raw`{Y}         _.-'''''-._{x}
{Y}       .'  o    {y}O{Y}  '.{x}
{Y}      /  {y}O{Y}     o     \{x}
{Y}     |    o   {y}O{Y}    o  |{x}
{Y}      \  o   {y}O{Y}    o  /{x}
{Y}       '._  {y}o{Y}    _.'{x}
{Y}          '-.....-'{x}
{W}   THE MOON (it IS cheese){x}`,
  'mount.hoard': String.raw`{M}          __    __{x}
{M}         /  \__/  \_____{x}
{M}        / {C}o{M}  {C}o{M}     ____)  {D}~ ~{x}
{M}       (   {R}vvvv{M}   (  {Y}$ $ $ $ {x}
{M}        \__________) {Y}$ $ $ $ $ {x}
{W}     FLOPPITHA'S HOARD{x}`,
  'y2k.nest': String.raw`{R}   +-----------------------------+
   |  {W}0 0 : 0 0{R}   {W}0 0 : 0 0{R}  |
   |      \  {Y}THE BUG{R}  /         |
   |   {W}1 9 0 0 ? ? ?   1 9 0 0{R}  |
   +-----------------------------+{x}`,
  'den.office': String.raw`{G}  C:\JACKMUD> dir /w
  [AREAS]  [MOBS]  [QUESTS]  SECRET.TXT
  C:\JACKMUD> _{x}`,
};
const ARTX = {
  diploma: String.raw`{y}   .----------------------------.
  ( {Y}~ ~  D I P L O M A  ~ ~{y}      (
   )  {W}Passed with flying colours{y}  )
  (   {D}H. Hexadecimal, Headmistress{y}(
   '----------------------------'{x}`,
  rocket: String.raw`{W}          /\{x}
{W}         /  \{x}
{W}        | {R}JM{W} |{x}
{W}        |    |{x}
{W}       /|    |\{x}
{W}      /_|____|_\{x}
{Y}         ){R}vv{Y}({x}
{Y}        ({R}vvvv{Y}){x}`,
  fireworks: String.raw`{Y}     *{x}   {M}\ | /{x}    {C}.{x}   {G}\ | /{x}   {Y}*{x}
{C}  .{x}    {M}-- * --{x}  {Y}*{x}   {G}-- * --{x}
{Y}     *{x}   {M}/ | \{x}    {R}.{x}   {G}/ | \{x}    {C}.{x}
{W}   THE YEAR 2000 IS SAFE! HOORAY!{x}`,
  chest: String.raw`{y}      ______________
     /\  {Y}$  $  $ {y}   /\
    /__\__________/__\
    |   {Y}( $ $ $ $ ){y}  |
    |________________|{x}`,
};
module.exports.ART = ART;
module.exports.ARTX = ARTX;

/* era-sites-faq: JACKFAQS, plain-text video game FAQs and walkthroughs (the way 1999 fan FAQs looked: 79 columns,
 * block-letter headers, version history, a stern legal notice). FAQs for the games on this PC (checked against the
 * games' own code) and affectionate fan FAQs for real 1999 games (facts only, written from scratch). */
(function () {
  'use strict';
  const ES = window.EraSites, esc = ES.esc;
  const H = 'www.jackfaqs.w3b', U = p => 'http://' + H + p;
  ES.css('faq', `
.gf{background:#fff;font:13px/1.4 Arial,Helvetica,sans-serif;color:#000}
.gf-top{background:#003366;color:#fff;padding:8px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.gf-top b{font:bold 28px "Arial Black",Arial,sans-serif;letter-spacing:-1px}
.gf-top b span{color:#ffcc00}
.gf-top i{font-size:12px;color:#c8d8f0}
.gf-nav{background:#c8d8f0;padding:4px 12px;font-size:12px;display:flex;gap:4px 14px;flex-wrap:wrap}
.gf-in{padding:10px 12px;max-width:820px}
.gf-in h2{font:bold 16px Arial;background:#e0e8f8;border-left:6px solid #003366;padding:3px 8px;margin:16px 0 6px}
.gf-tab{border-collapse:collapse;width:100%;font-size:12px}
.gf-tab td,.gf-tab th{border:1px solid #c8d0e0;padding:4px 6px;text-align:left}
.gf-tab th{background:#003366;color:#fff}
.gf pre{font:12px/1.25 "Courier New",Courier,monospace;white-space:pre;overflow-x:auto;background:#fff;color:#000;margin:0;padding:10px 12px;max-width:100%}
.gf-txt{border-top:3px solid #003366}
@media (max-width:600px){.gf pre{font-size:9px}}
`);

  // ---------------------------------------------------------------- block letters (5 rows)
  const FONT = {}; ('A ### ,#   #,#####,#   #,#   #|B#### ,#   #,#### ,#   #,#### |C ####,#    ,#    ,#    , ####|D#### ,#   #,#   #,#   #,#### |E#####,#    ,#### ,#    ,#####|F#####,#    ,#### ,#    ,#    |G ####,#    ,#  ##,#   #, ####|H#   #,#   #,#####,#   #,#   #|I###, # , # , # ,###|J  ###,   # ,   # ,#  # , ##  |K#   #,#  # ,###  ,#  # ,#   #|L#    ,#    ,#    ,#    ,#####|M#   #,## ##,# # #,#   #,#   #|N#   #,##  #,# # #,#  ##,#   #|O ### ,#   #,#   #,#   #, ### |P#### ,#   #,#### ,#    ,#    |Q ### ,#   #,# # #,#  # , ## #|R#### ,#   #,#### ,#  # ,#   #|S ####,#    , ### ,    #,#### |T#####,  #  ,  #  ,  #  ,  #  |U#   #,#   #,#   #,#   #, ### |V#   #,#   #,#   #, # # ,  #  |W#   #,#   #,# # #,## ##,#   #|X#   #, # # ,  #  , # # ,#   #|Y#   #, # # ,  #  ,  #  ,  #  |Z#####,   # ,  #  , #   ,#####|0 ### ,#  ##,# # #,##  #, ### |1 ## ,  # ,  # ,  # , ###|2 ### ,#   #,  ## , #   ,#####|3#### ,    #, ### ,    #,#### |4#  # ,#  # ,#####,   # ,   # |5#####,#    ,#### ,    #,#### |6 ### ,#    ,#### ,#   #, ### |7#####,   # ,  #  , #   , #   |8 ### ,#   #, ### ,#   #, ### |9 ### ,#   #, ####,    #, ### |&  ##  , #  #  ,  ##   , #  # #,  ## # |:  , # ,   , # ,   |! # , # , # ,   , # |- ,   ,###,   ,   ').split('|').forEach(s => { FONT[s[0]] = s.slice(1).split(','); });
  FONT[' '] = ['   ', '   ', '   ', '   ', '   '];
  const banner = t => [0, 1, 2, 3, 4].map(r => [...t.toUpperCase()].map(ch => (FONT[ch] || FONT[' '])[r] + '  ').join('').replace(/\s+$/, '')).join('\n');
  const wrap = (s, w, ind) => { w = w || 76; ind = ind || ''; const out = []; s.split('\n').forEach(par => { let line = ind; par.split(/\s+/).filter(Boolean).forEach(word => { if ((line + word).length > w && line.trim()) { out.push(line.replace(/\s+$/, '')); line = ind; } line += word + ' '; }); out.push(line.replace(/\s+$/, '')); }); return out.join('\n'); };
  const RULE = '='.repeat(78), rule = '-'.repeat(78);
  const sec = (code, title) => `\n${RULE}\n${title.toUpperCase().padEnd(72 - code.length)}[${code}]\n${RULE}\n`;
  const LEGAL = (who, yr) => wrap(`This FAQ is Copyright 1999 ${who}. It may NOT be reproduced, sold, put in a magazine, printed on a cereal box or used in any way that makes money. You may print it out for your own personal use (and to read on the bus). The ONLY sites allowed to host this FAQ are JackFAQs (www.jackfaqs.w3b) and my own homepage. If you see it anywhere else, e-mail me and I will tell my Mom. All trademarks and copyrights in this document are owned by their respective owners. ${yr || ''}`);

  // FAQ list: id, system, game, title, author, version history [[date, text]], body fn
  const FAQS = [];
  const add = (id, sys, game, kind, by, ver, body) => FAQS.push({ id, sys, game, kind, by, ver, body });

  add('grotquest', 'PC (DOS)', 'Jack Quest', 'Walkthrough', 'QuestMasterKev', [['03/04/99', '0.5 - Got as far as the ruler bridge. Stuck.'], ['17/04/99', '0.9 - Got past the Big Blobbit! (Crisps.) Added the map.'], ['02/05/99', '1.0 - COMPLETE! All 350 points. Added secrets.'], ['21/08/99', '1.1 - Fixed typos. Added "things to try". Removed a rude word Dave added.']], () => `
CONTENTS
  1. Introduction ................................. [GQ01]
  2. Controls and commands ........................ [GQ02]
  3. Map .......................................... [GQ03]
  4. Full walkthrough (350 points) ................ [GQ04]
  5. Points list .................................. [GQ05]
  6. Funny things to try .......................... [GQ06]
  7. Legal stuff .................................. [GQ07]
  (Tip: use Find in your browser and type the code, e.g. GQ04, to jump there.)
${sec('GQ01', 'Introduction')}${wrap("JACK QUEST is a text adventure that lives in C:\\GAMES on Jack's PC (Start > Programs > Games > Jack Quest, or type JACKQUEST at the DOS prompt). Your little green desktop pal, Gubbinz, has gone missing off your computer screen. There are tiny green footprints leading under your bed. Your job: get him back, and become the Toy King while you are at it. There are 45-ish places to visit, from your house and your street to your school and the Toy Kingdom under the bed (robots, spacemen, knights and a very big Blobbit), and 350 points to score.")}
${sec('GQ02', 'Controls and commands')}${wrap('Type short sentences. The game understands:')}
  LOOK (L)  EXAMINE thing (X)  TAKE thing  DROP thing  OPEN thing
  USE thing ON thing  GIVE thing TO person  TALK TO person  SAY word
  BUY thing  FIGHT person  WAIT (Z)  INVENTORY (I)  SCORE
  SAVE  RESTORE  HINT (costs 5 points!)  QUIT
  Directions: N S E W NE NW SE SW UP DOWN IN OUT (or GO NORTH etc.)
${wrap('Top tip from the game itself: EXAMINE EVERYTHING. Twice. Snacks are important. Mom is not a puzzle.')}
${sec('GQ03', 'Map')}
                        [Bathroom]
                            |
   [Airing cupboard]--[ Landing ]--[Your Bedroom]--(down)--[Under the Bed]
                            |                                    | (E, after
                         (down)                                  |  moving socks)
     [Living Room]          |                                [Sock Cave]
           |                |                                    |
        [ Hall ]------------+--[Kitchen]--[Garden]           [Mushroom Forest]--E-->[Deeper (maze!)]
           |                              |                      |
     [Front Garden]--[Garage]          [Shed]               [Ruler Bridge]
           |                                                     | E (Blobbit!)
   [Shop]--[Street]--[Dave's door]--IN--[Dave's room]       [Fort Gate]
           |                                                     | E (password)
       [Bus Stop]--E--[Toy shop queue]--E--[Cinema]          [TOY SQUARE]--NE--[Arena]
           |              | IN (after waiting)                N |  S  E  SE  DOWN
        [Park]--E--[School gates]                          [Robots] [Pen] [Castle] [Bank] [Tunnels]
           |               | N
        [Pond]        [Playground]--N--[Corridor]--W--[Mr Bell's room]
                                            |--E--[Computer club]
                                            |--N--[Library]
${sec('GQ04', 'Full walkthrough (350 points)')}${wrap("This is the quickest way I know. You can do the house, town and school bits in a different order if you like, but you need everything before you go under the bed for good.")}

--- PART 1: THE HOUSE ---
${wrap('You start in your bedroom. OPEN DRAWER (it sticks, the game wiggles it for you). TAKE TORCH (+10). The torch has no batteries.')}
${wrap('W to the landing, W into the airing cupboard. TAKE TUBE (+5). It is a wrapping paper tube. You know what it is for.')}
${wrap('E, DOWN to the hall, N to the living room. Dad is asleep. TAKE BATTERIES (+10) from the telly remote. Dad does not wake up. Dad never wakes up.')}
${wrap("S, E to the kitchen. Mom gives you The Look. TAKE BAG (the bin bag). E to the back garden. DROP BAG (+10). Mom gives you a FIVER. (5 pounds. Do not spend it all on rubbish. You will spend it all on rubbish.)")}

--- PART 2: TOWN ---
${wrap('W, W to the hall, S to the front garden, S to the street, W into the corner shop. BUY CRISPS (+5). They are alien flavour. They cost 50p. They are STRATEGIC CRISPS. Do not eat them.')}
${wrap('E to the street, S to the bus stop, S to the park, E to the school gates, N to the playground, N to the corridor, W to Mr Bell\'s classroom. TAKE FELT (+5) (the red felt tip, the good kind).')}
${wrap('Now USE FELT ON TUBE (+15). You have a LIGHTSPATULA. Do the noise. VVVSHHHMMM.')}
${wrap(Cast.t('Optional: E, E into computer club and TALK TO {teacher.FIRST}. {teacher.He} will tell you about SUBs. {teacher.He} is very happy.'))}
${wrap("Go back out: E, S, S, W to the park, N to the bus stop, E to the toy shop queue. WAIT. WAIT. WAIT. (Three waits. That is what a queue is for. You cannot leave the queue once you have started, that is the rule.) Then go IN. BUY FIGURE (+20). 3.99. Last one on the shelf.")}
${wrap("OUT, W to the bus stop, N to the street, E to Dave's front door, IN. GIVE FIGURE TO DAVE (+25). Dave gives you the overdue library book: THE CUBE: A COMPLETE SOLUTION. You will need it later. Dave is doing the engine noise. Leave him to it.")}

--- PART 3: UNDER THE BED ---
${wrap('OUT, W, N, N to the hall, UP to the landing, E to your bedroom. DOWN (you go under the bed). MOVE SOCKS. A gap! E into the Sock Cave (+15). It is dark, but you have a working torch.')}
${wrap("E to the Mushroom Forest. (Do NOT go east again unless you like walking in circles. Deeper in the mushrooms is a maze that only goes back WEST. There is a baby Blobbit there. It offers you some toadstool.) Go N to the Ruler Bridge. GIVE CRISPS TO BLOBBIT (+20). The Big Blobbit leaves like a sofa falling down the stairs.")}
${wrap('E to the fort gate. The tin soldier wants a password. EXAMINE GATE (it is scratched on the bath). SAY COWABUNGA (+10). Everybody shouts it back. You are in.')}

--- PART 4: THE TOY KINGDOM ---
${wrap('E into the Toy Town Square. NE to the Arena. FIGHT ZOG (+30). Big Zog is a plastic knight with a drainpipe. You win with your cardboard lightspatula and the crowd throws 10 RUPEES at you.')}
${wrap('SW to the square, N to the Robot Workshop. BUY PAINT (+10) (5 Rupees, only red, red is science). S to the square. PAINT TRUCK (+20). It goes faster now. Do not drive it yet.')}
${wrap("DOWN into the Toy Tunnels, E, N (follow the GUBBINZ WOZ ERE arrow), E into the hidey hole. GUBBINZ!!! (+30) He has your ULTRA 64 memory card. Discuss it later.")}
${wrap("W, S, W, UP back to the square. Try to go E to the King's castle. The drawbridge (a cereal-box lid) is shut, so ASK GUBBINZ ABOUT DRAWBRIDGE: he squeezes under it and opens it from the inside (+20). Go E into the castle.")}
${wrap('King Gorzag (a giant teddy bear) has a scrambled Rubrick\'s cube he calls the Big Shiny Thing. SOLVE CUBE (+40). You need the library book from Dave for this, which is why we did Dave first.')}
${wrap('W to the square. DRIVE TRUCK. You go up to the top of the Block Tower. SOLVE CUBE one more time, in front of every toy in the kingdom (+50). YOU ARE THE TOY KING. 350 out of 350. Go and have your tea.')}
${sec('GQ05', 'Points list')}
  Torch ......................... 10    Batteries ..................... 10
  Through the socks ............. 15    Doing the bins ................ 10
  Alien crisps ..................  5    Feeding the Blobbit ........... 20
  Password ...................... 10    Wrapping paper tube ...........  5
  Red felt tip ..................  5    Making the lightspatula ......... 15
  Beating Big Zog ............... 30    Red paint ..................... 10
  Painting the truck ............ 20    Pilot figure .................. 20
  The cube book ................. 25    Finding Gubbinz ............... 30
  Opening the castle ............ 20    Solving the King's cube ....... 40
  Winning on the tower .......... 50                          TOTAL: 350
${sec('GQ06', 'Funny things to try')}
  - SAY XYZZY (an old adventure game joke. Try it.)
  - Go into Mom and Dad's room. You won't.
  - TALK TO DAD. Lots of times.
  - Press TURBO on Dad's old 486 in the garage.
  - Look in the bathroom mirror.
  - Type something rude. The game will ask if your Mom knows you type like
    that. (Dave got this message 14 times.)
  - HINT always works, but it costs you 5 points each time.
${sec('GQ07', 'Legal stuff')}${LEGAL('QuestMasterKev')}

Thanks to: Jack (for making the game), Dave (for being stuck on the
queue for a week so I knew to put it in), and my Mom (for the bins).
`);

  add('pinball', 'PC (JackOS)', 'Space Jack Pinball', 'FAQ / Strategy Guide', 'TiltMaster', [['20/06/99', '1.0 - First version. Table is AMAZING.'], ['30/06/99', '1.1 - Found the cheat codes! (Thanks Dave.)'], ['15/09/99', '1.2 - Added rank list and multiball tips.']], () => `
CONTENTS:  Controls [SP01]  Missions [SP02]  Lanes & Multiball [SP03]
           Ranks [SP04]  Cheats [SP05]  Tips [SP06]  Legal [SP07]
${sec('SP01', 'Controls')}
  Left flipper ...... Z  (or Left Shift / Left arrow)
  Right flipper ..... /  (or Right Shift / Right arrow)
  Plunger ........... hold SPACE, let go to launch
  Nudge ............. X (left), . (right), Up arrow (up)
  F2 new game    F3 pause    F4 full screen
  With the mouse: click the left/right half of the table for the flippers,
  and click and hold the right half to pull the plunger.
${sec('SP02', 'Missions')}${wrap('There are five missions. Finish one and the WARP hole flashes: shoot it to rank up and start the next mission.')}
  ALIEN HUNT ...... knock down the three alien drop targets
  POD RACE ........ shoot the pod ramp 3 times in 45 seconds
  ASTEROID FIELD .. hit the pop bumpers 20 times (lights EXTRA BALL)
  SPACE BATTLE .... hit all four saucer fighter targets
  HYPERSPACE ...... shoot BOTH orbits (left and right)
${wrap('Completing Hyperspace gives a HYPERSPACE JUMP worth a million points.')}
${sec('SP03', 'Lanes & Multiball')}${wrap('Roll through the four J-A-C-K lanes at the top to light them. Pressing the flippers moves the lit lanes along (lane change), so you can line up the dark ones. Light all four to raise the bonus multiplier. Do it twice for JACK ROCKET MULTIBALL. A lane that flashes while your ball sits in the plunger is the SKILL SHOT: time your launch!')}
${sec('SP04', 'Ranks')}
  SPACE CADET > DECK HAND > GUNNER > PILOT > ACE > SQUADRON LEADER >
  SPACE ADMIRAL
${wrap('The game says nobody has ever made Space Admiral, except Jack, once, when Dave was not watching.')}
${sec('SP05', 'Cheats')}${wrap('Type these on the keyboard WHILE A GAME IS RUNNING (no Enter needed):')}
  gubbinz ..... turns the ball into Gubbinz (type again to turn it back)
  dakka ....... MORE BALLS! (multiball)
  rupees ...... a million points ("SHINY RUPEES!")
  waaagh ...... an extra ball (yes, really)
  Up Up Down Down Left Right Left Right B A ..... 3 extra balls
${wrap('Using cheats does not stop your score going on the high score table, but everybody will KNOW.')}
${sec('SP06', 'Tips')}
  - Don't flap the flippers. Hold one up to catch the ball, then aim.
  - Nudge to save a ball heading down the side, but watch for DANGER:
    nudge too much and it TILTS (dead flippers, no bonus).
  - Pod Race is the hardest mission. Start it with a full ball, not a
    scrappy one.
  - There are three table themes in Options: Deep Space, Red Planet and
    Pod Race Desert. They play the same. Red Planet LOOKS faster.
${sec('SP07', 'Legal')}${LEGAL('TiltMaster')}
`);

  add('skigrot', 'PC (JackOS)', 'SkiJack', 'FAQ', 'PowderPete', [['05/02/99', '1.0 - First version, written with cold fingers.'], ['14/03/99', '1.1 - The 2000m thing. Oh no.']], () => `
${sec('SK01', 'How to play')}${wrap('Ski down the mountain as far as you can. Trees, rocks and stumps knock you flat. Moguls bounce you. Ramps send you flying. There are two modes: FREESTYLE (score = style points + metres skied) and SLALOM (go between each pair of flags; every missed gate adds 5 seconds).')}
${sec('SK02', 'Controls')}
  Left / Right ..... turn (keep pressing to stop sideways)
  Down ............. point straight downhill
  Space ............ jump
  F ................ TURBO on/off
  F3 ............... pause
  Mouse: click and hold to steer towards the pointer; click your skier to jump.
${sec('SK03', 'Tricks (only in the air!)')}
  Left ..... Helicopter         Right .... Ear Flap
  Up ....... Backflip           Down ..... Gem Grab 
${wrap('Finish your trick before you land or you land on your head. More tricks in one jump = WAY more points. Four or more in one jump is BIG AIR.')}
${sec('SK04', 'The 2000m thing')}${wrap('There is a yellow sign at 2000 metres. Read it. Then keep skiing. Something big, orange and VERY toothy (a snow monster) is waiting past the sign, and it is faster than you. My advice: press F for TURBO and do not look back. If you outrun it for a whole kilometre you are a LEGEND. (I am not a legend. I have been eaten 41 times.)')}
${sec('SK05', 'Legal')}${LEGAL('PowderPete')}
`);

  add('grotlings', 'PC (JackOS)', 'Jacklings', 'Beginner\'s Guide', 'BlockerBob', [['01/11/99', '1.0 - The Jacklings are not clever. This guide is.']], () => `
${sec('GL01', 'The jobs')}
  1 BLOCKER ... stands still with arms out; others turn round when they
                reach it. (A blocker is stuck for good. Choose wisely.)
  2 BUILDER ... lays twelve bricks in a staircase going up
  3 BASHER .... punches sideways through earth
  4 DIGGER .... digs straight down
  5 BROLLY .... opens an umbrella when falling, so long drops don't hurt
  NOTHING gets through steel (the grey stuff with rivets).
${sec('GL02', 'Keys')}
  1-5 pick a job    + / - release rate    F fast forward
  P or F3 pause     F2 restart the level  N twice: NUKE (oh no!)
${sec('GL03', 'The levels')}
  1. DIG IN ............ 10 Jacklings, save 7.  3 diggers.
  2. MIND THE GAP ...... 12 Jacklings, save 8.  3 builders, 1 blocker.
  3. BASHER BROTHERS ... 12 Jacklings, save 9.  4 bashers, 1 blocker.
  4. STEEL YOURSELF .... 15 Jacklings, save 10. 2 diggers, 3 builders,
                         1 blocker, 1 brolly.
  5. RUPEE MOUNTAIN .... 20 Jacklings, save 14. 6 brollies, 2 bashers,
                         2 blockers, 2 builders, 1 digger.
${wrap('General tips: put a BLOCKER down early so the others walk back and forth while you work out a plan. Slow the release rate right down with the minus key. On level 4, look for where the steel stops before you dig. On level 5, give out the brollies BEFORE they jump off the mountain, not during.')}
${sec('GL04', 'Legal')}${LEGAL('BlockerBob')}
`);

  add('pokemon-rb', 'Game Lad', 'Pocket Critters Red / Blue', 'FAQ / Walkthrough', 'TrainerTez', [['20/09/99', '0.8 - Written from the American version with my cousin.'], ['06/10/99', '1.0 - UK VERSION IS OUT (5 Oct)! Checked everything again.'], ['25/10/99', '1.1 - Added version exclusives and the Elite Four.']], () => `
CONTENTS:  Basics [PK01]  Starters [PK02]  Gym Leaders [PK03]  Elite Four [PK04]
           Red/Blue Exclusives [PK05]  Tips [PK06]  Glitches [PK07]  Legal [PK08]
${sec('PK01', 'Basics')}${wrap('There are 151 Pocket Critters to catch. You cannot get them all in one game: some are only in Red, some only in Blue, so you have to TRADE with a mate using a Game Link Cable. Your goal: beat all eight Gym Leaders, then the Elite Four, and fill your Pokedex. Your rival is Professor Oak\'s grandson. He is very annoying. Smell ya later!')}
${sec('PK02', 'Starters')}
  BULBABEAST (Grass/Poison)  - easy mode for the first two gyms
  CHARBROILER (Fire)         - hard start (Brock and Misty!), but becomes
                              CHARIZARD, so worth it
  SQUIRTURTLE (Water)          - good all-rounder. Beats Brock easily.
${wrap('Your rival always picks the starter that beats yours. Typical.')}
${sec('PK03', 'Gym Leaders (in order)')}
  1. BROCK ....... Pewter City ...... Rock ....... Boulder Badge
  2. MISTY ....... Cerulean City .... Water ...... Cascade Badge
  3. LT. SURGE ... Vermilion City ... Electric ... Thunder Badge
  4. ERIKA ....... Celadon City ..... Grass ...... Rainbow Badge
  5. KOGA ........ Fuchsia City ..... Poison ..... Soul Badge
  6. SABRINA ..... Saffron City ..... Psychic .... Marsh Badge
  7. BLAINE ...... Cinnabar Island .. Fire ....... Volcano Badge
  8. GIOVANNI .... Viridian City .... Ground ..... Earth Badge
${wrap('Yes, Giovanni is the boss of Team Rocket AND a Gym Leader. Nobody in Viridian City noticed.')}
${sec('PK04', 'The Elite Four')}
  LORELEI (Ice) > BRUNO (Fighting) > AGATHA (Ghost) > LANCE (Dragon)
  ...and then one last battle against the Champion. Guess who.
${wrap('You fight all four in a row with no Pocket Critters Centre in between, so bring LOTS of potions and revives.')}
${sec('PK05', 'Red / Blue exclusives')}
  Only in RED:  Ekans, Arbok, Oddish, Gloom, Vileplume, Mankey, Primeape,
                Growlithe, Arcanine, Scyther, Electabuzz
  Only in BLUE: Sandshrew, Sandslash, Vulpix, Ninetales, Meowth, Persian,
                Bellsprout, Weepinbell, Victreebel, Magmar, Pinsir
${sec('PK06', 'Tips')}
  - Some Pocket Critters only evolve when traded: Kadabra, Machoke, Graveler and
    Haunter. Trade them to a mate and ask for them back. (A good mate.)
  - Save before you throw a ball at anything rare.
  - Snorlax blocks the road twice. You need the Poke Flute to wake it up.
  - HM moves (Cut, Fly, Surf, Strength, Flash) can't be deleted easily,
    so don't waste a good Pocket Critters's slots on them.
${sec('PK07', 'Glitches and playground rumours')}${wrap('You will hear LOTS of rumours at school. Here is what I know. There IS a famous glitch Pocket Critters (talk to the old man in Viridian City, then surf up and down the east coast of Cinnabar Island) but it can mess up your save file and your Hall of Fame, so I am NOT putting the steps here. Do it at your own risk and do not blame me. As for Mew: I have never seen ANY real way to catch Mew in a normal game. Ignore anyone who says it is under the truck. I pushed the truck. Well, I tried.')}
${sec('PK08', 'Legal')}${LEGAL('TrainerTez', 'Pocket Critters is a trademark of its owners. This guide is not official in any way.')}
`);

  add('zelda-oot', 'Ultra 64', 'The Legend of Zeldoo: Kazoo of Time', 'FAQ / Dungeon Guide', 'HeroOfDave', [['20/12/98', '0.5 - Got it for Christmas early!'], ['26/01/99', '1.0 - BEAT THE WATER TEMPLE. You will too. Read on.'], ['04/05/99', '1.2 - Added warp songs and the Iron Boots tip.']], () => `
CONTENTS:  Dungeons [ZO01]  Songs [ZO02]  Water Temple [ZO03]  Tips [ZO04]
${sec('ZO01', 'Dungeons (in order)')}
  -- AS YOUNG LINK --
  1. Inside the Deku Tree
  2. Dodongo's Cavern
  3. Inside Jabu-Jabu's Belly
  -- SEVEN YEARS LATER (ADULT LINK) --
  4. Forest Temple        5. Fire Temple        6. Water Temple
  7. Shadow Temple        8. Spirit Temple (as both young AND adult Link)
  9. Ganon's Castle
${sec('ZO02', 'Songs')}
  Learnt songs: Zelda's Lullaby, Epona's Song, Saria's Song, Sun's Song,
                Song of Time, Song of Storms
  Warp songs:   Minuet of Forest, Bolero of Fire, Serenade of Water,
                Nocturne of Shadow, Requiem of Spirit, Prelude of Light
${wrap('The warp songs take you straight to a warp point, so you can stop running across Hyrule Field at night dodging skeletons.')}
${sec('ZO03', 'The Water Temple (everybody is stuck)')}${wrap('Everybody gets stuck in the Water Temple. You are not stupid. It is the temple. The trick is the water level: there are three places where you can play Zelda\'s Lullaby to change it (high, middle and low), and lots of rooms only open at one level. Wear the Iron Boots to walk on the bottom, and keep switching them on and off from the menu. (Yes, from the menu. Every time. I know.) If you have gone through every door and you are still missing a key, you have missed a room at a different water level. Also: there is a room with a tiny island and a mirror image of you. Bring the Megaton Hammer? No, wait, that is another temple. Bring patience.')}
${sec('ZO04', 'Tips')}
  - Z-targeting is your friend. Lock on, then sidestep and attack.
  - The fishing pond in Lake Hylia is the best mini-game EVER MADE.
  - Get Epona as young Link at Lon Lon Ranch by learning her song.
  - Talk to everyone. Then talk to them again as an adult.
${sec('ZO05', 'Legal')}${LEGAL('HeroOfDave')}
`);

  add('tetris-gb', 'Game Lad', 'Blockology', 'Strategy FAQ', 'LongBarLarry', [['12/03/99', '1.0 - The only game I need.']], () => `
${sec('TE01', 'Modes')}${wrap('A-TYPE: the endless one. Clear lines, get faster, go for the high score. B-TYPE: you pick a height of rubbish to start with; clear 25 lines to win. Three music types to pick from, plus music OFF (for school).')}
${sec('TE02', 'Scoring (per line clear)')}
  Single ..... 40 x (level + 1)        Double ..... 100 x (level + 1)
  Triple .... 300 x (level + 1)        BLOCKOLOGY .... 1200 x (level + 1)
${wrap('A Blockology (four lines at once with the long bar) is worth WAY more than four singles. So leave a gap down one side and wait for the long piece. It will come. It always comes. (Eventually.)')}
${sec('TE03', 'Tips')}
  - Keep the stack flat. Bumps make holes. Holes make tears.
  - Look at the NEXT piece box, not just the piece that is falling.
  - Don't panic when it gets fast. Panic AFTERWARDS.
  - Two-player needs two Game Boys, two cartridges and a link cable.
  - If you do very well, keep watching after the game ends...
${sec('TE04', 'Legal')}${LEGAL('LongBarLarry')}
`);

  const opt = o => Object.assign(FAQS[FAQS.length - 1], o);

  add('goldeneye', 'Ultra 64', 'Goldenballs 007', 'FAQ / Multiplayer Guide', 'DoubleOhDave', [['02/01/99', '1.0 - First version. Christmas was spent on Facility.'], ['14/03/99', '1.1 - Added multiplayer house rules.'], ['30/07/99', '1.2 - Added the bonus levels.']], () => `
CONTENTS:  Levels [GE01]  Difficulty [GE02]  Cheats [GE03]  Multiplayer [GE04]
           Tips [GE05]  Legal [GE06]
${sec('GE01', 'The levels')}
   1. Dam          2. Facility     3. Runway       4. Surface
   5. Bunker       6. Silo         7. Frigate      8. Surface 2
   9. Bunker 2    10. Statue      11. Archives    12. Streets
  13. Depot       14. Train       15. Jungle      16. Control
  17. Caverns     18. Cradle
  BONUS: two secret levels. Finish the whole game on SECRET AGENT for the
  first one, then do everything on 00 AGENT for the second. (Good luck.)
${sec('GE02', 'Difficulty')}${wrap('AGENT, SECRET AGENT and 00 AGENT. The harder ones give you MORE objectives on the same level, not just tougher guards, so read the mission briefing in the folder first. Your watch is the pause screen. Yes, really. It is a very good watch.')}
${sec('GE03', 'Cheats')}${wrap('There are no button codes printed here (Mom says no). The PROPER way: beat each level under its target time on the right difficulty and a cheat unlocks in the Cheat Options screen. The famous ones are Paintball Mode (bullets leave splats of paint) and DK Mode (huge heads, long arms). Some of the early target times on Agent are quite kind, so start there. The later ones are NOT kind.')}
${sec('GE04', 'Multiplayer house rules')}
  - Up to 4 players, split screen. Somebody always gets the tiny corner.
  - NO SCREEN WATCHING. We all know you looked at the top-left.
  - Nobody picks Oddjob. He is too short. It is not fair.
  - Proximity mines in the Facility toilets: legal, but you are a monster.
  - "License To Kill" = one hit and you are out. Best mode. Argue below.
  - Slappers only (hands, no guns) is surprisingly brilliant.
${sec('GE05', 'Tips')}
  - Aim with R held down. You stop moving but you hit what you aim at.
  - Body armour gives you a second health bar. Always grab it.
  - On Dam, find the bungee jump at the end. It is the best bit.
  - Guards hear gunshots. The silenced pistol is your friend.
${sec('GE06', 'Legal')}${LEGAL('DoubleOhDave')}
`); opt({ short: 'GOLDENBALLS' });

  add('mk64', 'Ultra 64', 'Kart Kaos 64', 'Cup Guide & Shortcuts', 'BananaBlocker', [['22/02/99', '1.0 - Every cup, every track.'], ['09/06/99', '1.1 - Added the Wario Stadium jump. Luke showed me.']], () => `
${sec('MK01', 'Drivers')}
  LIGHT:   Toad, Peach, Yosher     - fast off the line, easy to bump about
  MEDIUM:  Marlo, Louie G           - good at everything
  HEAVY:   Bouncer, Wario, D.K.    - slow to start, top speed is huge
${sec('MK02', 'The cups')}
  MUSHROOM: Louie G Raceway, Moo Moo Farm, Koopa Troopa Beach, Kalimari Desert
  FLOWER:   Toad's Turnpike, Frappe Snowland, Choco Mountain, Marlo Raceway
  STAR:     Wario Stadium, Sherbet Land, Royal Raceway, Bouncer's Castle
  SPECIAL:  D.K.'s Jungle Parkway, Yosher Valley, Banshee Boardwalk,
            Rainbow Road
${wrap('Win gold in every cup on 150cc and you unlock the Extra mode, where every track is back to front. It does your head in. It is brilliant.')}
${sec('MK03', 'Driving')}
  - Hop and power-slide round corners (R). Waggle the stick during the
    slide until the smoke changes colour, then let go for a mini-turbo.
  - Hold a banana or shell BEHIND you (hold Z) to block things fired at
    your back.
  - The Lightning shrinks everybody except you. Use it just before a jump
    so they all fall off.
  - The Blue Shell goes for whoever is first. If that is you: sorry.
${sec('MK04', 'Shortcuts')}${wrap('Wario Stadium: on the first big straight there is a place where you can jump over the wall and land much further along. Takes practice (and Luke). Koopa Troopa Beach: a ramp on the right lets you jump through a little cave in the rocks. Rainbow Road is very long, and there is a way to skip a huge chunk if you are brave enough to drop off the edge at the start. We do not talk about the times it went wrong.')}
${sec('MK05', 'Battle mode')}${wrap('Three balloons each. Lose them all and you are out (or you turn into a little bomb and drive about getting revenge, if there are more than two of you). Block Fort is the best arena. Double Deck is the worst. Fight me.')}
${sec('MK06', 'Legal')}${LEGAL('BananaBlocker')}
`); opt({ short: 'KART KAOS' });

  add('banjo', 'Ultra 64', 'Backpack Buddies', 'Walkthrough (Worlds & Moves)', 'JiggyJen', [['15/11/98', '0.9 - Got to Gobi\'s Valley.'], ['10/01/99', '1.0 - 100 Jiggies! Beat Grunty!'], ['18/05/99', '1.1 - Added note totals per world.']], () => `
${sec('BK01', 'The story')}${wrap('The witch Gruntilda has kidnapped Banjo\'s little sister Tooty, because she wants to be the prettiest in the land. Banjo the bear and Kazooie the bird (who lives in his backpack and is very rude) go up Grunty\'s lair to get her back. Bottles the mole teaches you moves along the way.')}
${sec('BK02', 'The worlds (in order)')}
   1. Mumbo's Mountain        2. Treasure Trove Cove
   3. Clanker's Cavern        4. Bubblegloop Swamp
   5. Freezeezy Peak          6. Gobi's Valley
   7. Mad Monster Mansion     8. Rusty Bucket Bay
   9. Click Clock Wood
  Every world has 10 Jiggies, 100 notes and 5 Jinjos (find all 5 Jinjos
  and they give you a Jiggy). Notes open the note doors in the lair.
${sec('BK03', 'Collectables')}
  JIGGIES ........ jigsaw pieces. Fill a picture to open a world.
  NOTES .......... open the note doors. Lose a life and the world's notes
                   reset, so do not die halfway through a world!
  MUMBO TOKENS ... pay Mumbo the shaman to turn you into things
                   (a termite, a crocodile, a walrus, a pumpkin, a bee).
  HONEYCOMBS ..... six empty pieces give you an extra bit of health.
${sec('BK04', 'Tips')}
  - Click Clock Wood has the same level in all four seasons. Visit them
    in order: spring, summer, autumn, winter.
  - The end is a quiz show about the WHOLE game. Pay attention to
    everything, including what Grunty says about herself.
  - Kazooie's Talon Trot gets you up the steep slopes.
${sec('BK05', 'Legal')}${LEGAL('JiggyJen')}
`); opt({ short: 'BANJO' });

  add('mgs', 'PlaySpace', 'Metal Gear Wobbly', 'FAQ / Boss Guide', 'CardboardBox', [['14/12/98', '0.5 - Written from my cousin\'s American copy.'], ['27/02/99', '1.0 - UK VERSION IS OUT! Both discs done.'], ['20/04/99', '1.1 - Added the two endings.']], () => `
CONTENTS:  Basics [MG01]  Bosses [MG02]  Stuck? [MG03]  Endings [MG04]
           Legal [MG05]
${sec('MG01', 'Basics')}${wrap('You are Solid Snake, sneaking into a base on Shadow Moses Island. It is a SNEAKING game: if you are fighting all the time you are playing it wrong. Watch the radar in the corner, stay out of the guards\' view cones, knock on walls to make them come and look, and crawl under things. The cardboard box is the best item in the history of video games. Guards walk straight past a box. Nobody questions the box.')}
${sec('MG02', 'Bosses (no big spoilers)')}
  Revolver Ocelot ....... circle round the explosives, shoot when he stops
  The Tank .............. chaff grenades, then grenades into the top
  The Ninja ............. fists only. Punch-punch-kick when he gets close
  Psycho Mantis ......... see MG03. Seriously, read it.
  Sniper Wolf ........... a sniper duel. Take Diazepam to steady your aim
  Vulcan Raven .......... in the warehouse. Use the Stinger and the crates
  Metal Gear REX ........ two discs of story to get here. Stinger. Lots.
${sec('MG03', 'Stuck? Read this')}
  - Meryl's codec frequency is printed on the back of the CD case.
    The GAME tells you this. It is not a joke. Look at the box.
  - Psycho Mantis reads your mind (your memory card) and dodges every
    attack. To stop him reading your mind, plug your controller into
    PORT 2. I am not making this up.
  - It is a long game over TWO discs. Disc 2 starts at a good point to
    save, so save.
${sec('MG04', 'Endings')}${wrap('There are two endings, decided by what you do in the torture bit (keep pressing the button, or give up). Each ending gives you a different bonus item for a second play through. I am not saying which is which. Play it twice. It is worth it.')}
${sec('MG05', 'Legal')}${LEGAL('CardboardBox')}
`); opt({ short: 'MGS' });

  add('halflife', 'PC (JackOS)', 'Half-Loaf', 'Walkthrough Notes & Cheats', 'CrowbarCallum', [['05/01/99', '0.8 - Up to Blast Pit. That tentacle thing.'], ['20/02/99', '1.0 - Finished! Xen is weird.'], ['11/07/99', '1.1 - Added console cheats (for after you have finished it).']], () => `
${sec('HL01', 'The chapters')}
  Black Mesa Inbound        Anomalous Materials     Unforeseen Consequences
  Office Complex            "We've Got Hostiles"    Blast Pit
  Power Up                  On A Rail               Apprehension
  Residue Processing        Questionable Ethics     Surface Tension
  "Forget About Freeman!"   Lambda Core             Xen
  Gonarch's Lair            Interloper              Nihilanth
  Endgame
${sec('HL02', 'Tips')}
  - Do the Hazard Course first. It teaches you the long jump (hold crouch
    and press jump while running). Once you find the long jump module
    later on, you WILL need it.
  - Make friends with the security guards (press USE on them). They
    follow you and shoot things. Do not make them stand in doorways.
  - Blast Pit: the big tentacle thing hears you, it does not see you.
    Walk quietly, throw grenades to distract it, and turn on the fuel,
    the oxygen and the power. Then you know what to do.
  - Save often. Quicksave is F6. Quickload is F7. Learn them.
  - The crowbar never runs out of ammo.
${sec('HL03', 'Console cheats (ONLY after you finish it!)')}${wrap('Start Half-Loaf with -console on the end of the shortcut (or -dev) and press the key next to 1 to open the console. Type sv_cheats 1 first, then start a new game or load a map. Then:')}
  god ............... you can't be hurt
  noclip ............ fly through walls
  impulse 101 ....... all the weapons and lots of ammo
${wrap('Using cheats the first time through spoils it. You have been warned. Callum has been warned TWICE.')}
${sec('HL04', 'Legal')}${LEGAL('CrowbarCallum')}
`); opt({ short: 'HALF-LOAF' });

  add('starcraft', 'PC (JackOS)', 'StarGraft', 'Beginner\'s Strategy Guide', 'ZergRushZed', [['12/12/98', '1.0 - First version.'], ['06/04/99', '1.1 - Added Brood War notes.']], () => `
${sec('SC01', 'The three races')}
  TERRAN .... humans. Buildings can lift off and fly. Bunkers, tanks,
              Marines. Good for beginners.
  ZERG ...... bugs. Everything hatches from larvae. Cheap, fast, LOTS.
              The famous "Zerg rush" is just sending loads of Zerglings
              at you before you are ready.
  PROTOSS ... psychic aliens. Expensive, very strong units with shields
              that come back. Lose a Zealot and you feel it.
${sec('SC02', 'Beginner tips')}
  - Keep building workers. Then build some more workers.
  - Minerals AND gas: build your gas building early.
  - Build supply (Supply Depots / Overlords / Pylons) BEFORE you run out.
  - Scout! Send one worker to find the enemy base at the start.
  - Number your groups: select units and press Ctrl+1, then press 1.
  - Want to play your mates? Battle.net on the modem, or a LAN party at
    Callum's (bring your own PC, and a sandwich).
${sec('SC03', 'Cheats (single player only)')}${wrap('Press Enter, type the code, press Enter again:')}
  show me the money ......... lots of minerals and gas
  power overwhelming ........ your units can't be hurt
  black sheep wall .......... see the whole map
  operation cwal ............ build really fast
  there is no cow level ..... win the mission straight away
${wrap('Cheats do not work on Battle.net. Obviously. Stop asking.')}
${sec('SC04', 'Legal')}${LEGAL('ZergRushZed')}
`); opt({ short: 'STARGRAFT' });

  add('sonicadv', 'Daydream', 'Zip Adventure', 'FAQ / Chao Guide', 'BlueBlurBen', [['15/01/99', '0.5 - Written from my Japanese import. I cannot read the menus.'], ['16/10/99', '1.0 - UK DAYDREAM IS HERE (14 Oct)! Redone in English.'], ['10/11/99', '1.1 - Added the Chao Garden.']], () => `
${sec('SA01', 'The six stories')}
  ZIP ......... the main story. Very fast. Go.
  TAILS ......... race Zip to the end of each level. He flies.
  KNUCKLES ...... find the pieces of the Master Emerald. Use the radar.
  AMY ........... run away from a big robot. Hammer jump!
  BIG THE CAT ... fishing. Yes, fishing. For his frog, Froggy.
  E-102 GAMMA ... a robot with a laser. Shoot everything, beat the clock.
${wrap('Finish all six and a final story unlocks. You need all of them, even the fishing. ESPECIALLY the fishing.')}
${sec('SA02', 'The hub')}${wrap('Between levels you run round Station Square (the city), the Mystic Ruins (jungle and the train) and the Egg Carrier (Robotnik\'s giant airship). Look for upgrades in all three: they give your characters new moves and you need some of them to get into later levels.')}
${sec('SA03', 'Chao Garden')}
  - Chao are little pets. Find their eggs and hatch them in a garden.
  - Give them the little animals you free from robots in the levels.
    A Chao changes to look like what you give it.
  - Plug in a VMU (the memory card with a screen) and you can take a Chao
    out with you in Chao Adventure. A virtual pet in your pocket. It
    beeps in class. Mr Bell was not impressed.
${sec('SA04', 'Legal')}${LEGAL('BlueBlurBen')}
`); opt({ short: 'ZIP ADV' });

  const byId = id => FAQS.find(f => f.id === id);
  const head = `<div class="gf-top"><b>Jack<span>FAQs</span></b><i>Video game FAQs, walkthroughs and cheats. Text only. No pictures. No mercy.</i></div><div class="gf-nav"><a href="${U('/')}">Home</a><a href="${U('/board.html')}">Message Board</a><a href="${U('/submit.html')}">Submit a FAQ</a><a href="http://www.cheatz.w3b/">More Cheats</a><a href="http://www.jackdot.jnet/">Jackdot</a></div>`;
  const page = (c, body) => `<div class="gf">${head}<div class="gf-in">${body}</div>${c.foot({ ctrText: 'FAQs read:', ctrAfter: '', best: 'Best viewed in <b>any</b> browser (it is just text)', copy: 'All FAQs are copyright their authors. JackFAQs &copy; 1999 (one kid and a lot of text files)' })}</div>`;

  ES.def(H, '/', c => {
    const sys = [...new Set(FAQS.map(f => f.sys))];
    return page(c, `<p><b>Welcome to JackFAQs!</b> The biggest collection of plain text game guides on JackNet (${FAQS.length} so far!). All FAQs are written by fans, for fans. Read them online or Save As to a floppy for later.</p>
      ${sys.map(s => `<h2>${esc(s)}</h2><table class="gf-tab"><tr><th>Game</th><th>FAQ</th><th>Author</th><th>Size</th></tr>${FAQS.filter(f => f.sys === s).map(f => `<tr><td><b>${esc(f.game)}</b></td><td><a href="${U('/faq/' + f.id + '.txt')}">${esc(f.kind)}</a></td><td>${esc(f.by)}</td><td>${Math.round(f.body().length / 1024 * 10) / 10 || 1} KB</td></tr>`).join('')}</table>`).join('')}
      <h2>FAQ of the Week</h2><p><a href="${U('/faq/grotquest.txt')}">Jack Quest: Full Walkthrough (350 points)</a> by QuestMasterKev. "The bins are the key to everything."</p>
      <h2>Wanted!</h2><p>We still need FAQs for: <i>Blobbit Lob, Pipe Jack, Jack Jong, Jacktris, Solitaire (yes really)</i>. <a href="${U('/submit.html')}">Write one!</a></p>`);
  });
  ES.def(H, /^\/faq\//, c => {
    const f = byId(c.path.replace(/^\/faq\/|\.txt$/g, ''));
    if (!f) return page(c, '<p>FAQ not found. It may have been removed at the author\'s request (their Mom found out).</p>');
    const vers = f.ver.filter(v => { const [d, m] = v[0].split('/').map(Number), y = +v[0].split('/')[2]; return y === 98 || m * 100 + d <= c.md; });
    const ver = (vers[vers.length - 1] || f.ver[0])[1].split(' ')[0];
    const txt = `${banner(f.short || f.game.replace(/^The Legend of Zelda: /, 'Zelda ').replace(/Pokemon Red \/ Blue/, 'Pocket Critters').slice(0, 13))}\n\n${f.game} - ${f.kind}\n${f.sys}\nVersion ${ver}\nBy ${f.by} (${f.by.toLowerCase()}@jackmail.webcom)\n\n${sec('VH', 'Version history')}${(vers.length ? vers : f.ver.slice(0, 1)).map(v => `  ${v[0]}  ${v[1]}`).join('\n')}\n${f.body()}\n${RULE}\n                         END OF FILE. GO PLAY OUTSIDE.\n${RULE}\n`;
    c.after.push(() => {
      const end = c.q('.gf-end'); if (!end || !window.IntersectionObserver) return;
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { c.secret('eras.faq'); io.disconnect(); } }); io.observe(end); c.off(() => io.disconnect());
    });
    return `<div class="gf">${head}<div class="gf-txt"><pre>${esc(txt)}</pre><span class="gf-end"></span></div>${c.foot({ ring: false, ctrText: 'This FAQ has been read', ctrAfter: 'times', best: 'Plain text: best viewed in Notepad' })}</div>`;
  });
  ES.def(H, '/board.html', c => page(c, `<h2>Message Board</h2><p>Stuck? Ask here. Please search the FAQs first. Please. PLEASE.</p>` + c.gb([['WaterTempleVictim', '27/01/99', 'HOW DO YOU GET PAST THE WATER TEMPLE. I HAVE BEEN IN HERE FOR 9 DAYS.'], ['TrainerTez', '06/10/99', 'Mew is NOT under the truck. Stop asking.'], ['QuestMasterKev', '03/05/99', 'Jack Quest: if you are stuck on the queue, just WAIT. That is all a queue is.']], { title: 'Post a Question', btn: 'Post', ph: 'e.g. how do i get past the blobbit on the bridge?' })));
  ES.def(H, '/submit.html', c => page(c, `<h2>Submit a FAQ</h2><p>Rules: plain text only. 79 characters a line. No copying other people's FAQs (we WILL find out). Put a version history at the top and a legal bit at the bottom. Spell-check it (or ask your Mom).</p><p>Send your FAQ as a .txt attachment to <b>faqs@jackfaqs.w3b</b>. Or just tell us which game you want to write about:</p>` + c.gb([['BlockerBob', '30/10/99', 'Doing a Jacklings FAQ. Level 5 is HARD.']], { title: 'FAQ Wishlist', btn: 'Add', ph: 'I want to write a FAQ for...' })));
})();

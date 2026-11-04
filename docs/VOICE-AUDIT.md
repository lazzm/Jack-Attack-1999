# Voice audit

Re-run `node tools/audio/voice-audit.mjs --write`. Offline source inventory; no API calls.

Counts include the existing script catalogue and runtime speech. A catalogue-only row is marked explicitly; it is not proof of a wired gameplay trigger. Diary pages, notes, objectives, player thoughts, chat and text messages are excluded. Game NPCs are kept separate from the approved family cast.

1199 lines; 309 manifest recordings; 214 missing approved-cast lines, of which 214 are generation-ready and 0 still contain dynamic words. 19 requests at 13 lines maximum, grouped by character/effect, before retries.

## Totals by speaker

| Speaker | Lines | Recorded | Missing |
|---|---:|---:|---:|
| 1471 | 2 | 0 | 2 |
| Adventure bankgrot | 2 | 0 | 2 |
| Adventure dad | 4 | 0 | 4 |
| Adventure dave | 2 | 0 | 2 |
| Adventure guard | 3 | 0 | 3 |
| Adventure gubbinz | 3 | 0 | 3 |
| Adventure librarian | 3 | 0 | 3 |
| Adventure mekk | 1 | 0 | 1 |
| Adventure mom | 3 | 0 | 3 |
| Adventure mrali | 2 | 0 | 2 |
| Adventure shopkeeper | 2 | 0 | 2 |
| Adventure snotling | 1 | 0 | 1 |
| Adventure squig | 2 | 0 | 2 |
| Adventure tilllady | 1 | 0 | 1 |
| Adventure warboss | 5 | 0 | 5 |
| Adventure zog | 2 | 0 | 2 |
| Dave (shouting in the background) | 1 | 0 | 1 |
| Dave's Mom | 2 | 0 | 2 |
| Directory Enquiries | 2 | 0 | 2 |
| Game discs-rts unit | 29 | 0 | 29 |
| Game discs-squigs unit | 48 | 0 | 48 |
| Halloween trick-or-treaters | 9 | 0 | 9 |
| Hearts Dave | 25 | 0 | 25 |
| Hearts Gubbinz | 20 | 0 | 20 |
| Hearts cousin | 22 | 0 | 22 |
| Hint line | 2 | 0 | 2 |
| JackBuddy | 18 | 0 | 18 |
| JackMUD Archmage Floppington | 11 | 0 | 11 |
| JackMUD B0B the helper robot | 8 | 0 | 8 |
| JackMUD Barnaby Brew | 9 | 0 | 9 |
| JackMUD Big Ted | 4 | 0 | 4 |
| JackMUD Brunhilda the blacksmith | 9 | 0 | 9 |
| JackMUD Callum | 8 | 0 | 8 |
| JackMUD Captain Pegleg Pete | 10 | 0 | 10 |
| JackMUD Commander Nova | 8 | 0 | 8 |
| JackMUD Dave the apprentice | 10 | 0 | 10 |
| JackMUD Dr Countdown | 9 | 0 | 9 |
| JackMUD Farmer Giles | 8 | 0 | 8 |
| JackMUD Flicker the fairy | 5 | 0 | 5 |
| JackMUD Floppitha the dragon | 8 | 0 | 8 |
| JackMUD Gloomy Gus the ferryman | 5 | 0 | 5 |
| JackMUD Granny Byte | 8 | 0 | 8 |
| JackMUD Headmistress Hexadecimal | 6 | 0 | 6 |
| JackMUD JackK | 6 | 0 | 6 |
| JackMUD King Bartholomew the Fluffy | 6 | 0 | 6 |
| JackMUD Librarian Bookworm | 9 | 0 | 9 |
| JackMUD Luke | 9 | 0 | 9 |
| JackMUD Madame Inventoria | 6 | 0 | 6 |
| JackMUD Mayor Wobblebottom | 9 | 0 | 9 |
| JackMUD Melody Strum | 7 | 0 | 7 |
| JackMUD Mr Abacus Penny | 5 | 0 | 5 |
| JackMUD Mrs Bundle | 9 | 0 | 9 |
| JackMUD Mrs Crumb | 8 | 0 | 8 |
| JackMUD Old Barnacle Bill | 7 | 0 | 7 |
| JackMUD Old Tom Tick | 8 | 0 | 8 |
| JackMUD Polly-Gon the parrot | 6 | 0 | 6 |
| JackMUD Postmistress Pat | 7 | 0 | 7 |
| JackMUD Professor Hoot | 10 | 0 | 10 |
| JackMUD Professor Pixel | 8 | 0 | 8 |
| JackMUD Queen Squeakbert | 8 | 0 | 8 |
| JackMUD Ranger Rowan | 9 | 0 | 9 |
| JackMUD Sergeant Stuffing | 7 | 0 | 7 |
| JackMUD Sir Clanksalot | 8 | 0 | 8 |
| JackMUD Sir Reginald Clank | 8 | 0 | 8 |
| JackMUD Sister Ping | 6 | 0 | 6 |
| JackMUD Spaghetti the yeti | 8 | 0 | 8 |
| JackMUD Strawbert the scarecrow | 6 | 0 | 6 |
| JackMUD Trevor the Toll Troll | 6 | 0 | 6 |
| JackMUD the Town Crier | 10 | 0 | 10 |
| JackOS secret character | 2 | 0 | 2 |
| MegaSearch | 8 | 0 | 8 |
| Nan | 6 | 0 | 6 |
| Operator | 2 | 0 | 2 |
| Pocket Critters clockmaker | 3 | 0 | 3 |
| Pocket Critters momTalk | 3 | 0 | 3 |
| Pocket Critters nurseTalk | 3 | 0 | 3 |
| Pocket Critters profTalk | 7 | 0 | 7 |
| Pocket Critters rivalTalk | 2 | 0 | 2 |
| Pocket Critters shopTalk | 4 | 0 | 4 |
| Receptionist | 1 | 0 | 1 |
| Recorded voice | 3 | 0 | 3 |
| The Golden Dragon | 1 | 0 | 1 |
| The Odyssey Pictures | 1 | 0 | 1 |
| The doctors | 1 | 0 | 1 |
| The speaking clock | 1 | 0 | 1 |
| Tony | 2 | 0 | 2 |
| Witch | 15 | 0 | 15 |
| Wobble Party COUNT CRUMBLE | 1 | 0 | 1 |
| Wobble Party SHOP | 1 | 0 | 1 |
| a man selling double glazing | 4 | 0 | 4 |
| a recorded voice | 1 | 0 | 1 |
| a wrong number | 3 | 0 | 3 |
| announcer | 91 | 13 | 78 |
| dad | 142 | 102 | 40 |
| game baysign | 1 | 0 | 1 |
| game blowkid | 1 | 0 | 1 |
| game cavekid | 2 | 0 | 2 |
| game centre2kid | 1 | 0 | 1 |
| game centrekid | 2 | 0 | 2 |
| game fuseCollector | 2 | 0 | 2 |
| game fuseGuide | 2 | 0 | 2 |
| game kilnGuide | 2 | 0 | 2 |
| game nan | 2 | 0 | 2 |
| game oldman | 1 | 0 | 1 |
| game pondgirl | 1 | 0 | 1 |
| game radioRepair | 2 | 0 | 2 |
| game rockgirl | 1 | 0 | 1 |
| game sailorkid | 1 | 0 | 1 |
| game shop2girl | 1 | 0 | 1 |
| game shopgirl | 1 | 0 | 1 |
| game tipgirl | 1 | 0 | 1 |
| gran | 18 | 12 | 6 |
| mate1 | 10 | 0 | 10 |
| mate2 | 6 | 0 | 6 |
| mate3 | 4 | 0 | 4 |
| mate4 | 4 | 0 | 4 |
| mom | 211 | 135 | 76 |
| sister | 61 | 47 | 14 |
| {mate1} | 5 | 0 | 5 |
| {mate2} | 1 | 0 | 1 |
| {mate3} | 4 | 0 | 4 |
| {mate4} | 5 | 0 | 5 |

## Totals by chapter

| Chapter | Lines |
|---|---:|
| 1 | 46 |
| 2 | 31 |
| 3 | 33 |
| 4 | 150 |
| ambient | 939 |

## Characters awaiting Jack’s casting decision

- 1471: 2 lines; no voice assigned.
- Adventure bankgrot: 2 lines; no voice assigned.
- Adventure dad: 4 lines; no voice assigned.
- Adventure dave: 2 lines; no voice assigned.
- Adventure guard: 3 lines; no voice assigned.
- Adventure gubbinz: 3 lines; no voice assigned.
- Adventure librarian: 3 lines; no voice assigned.
- Adventure mekk: 1 lines; no voice assigned.
- Adventure mom: 3 lines; no voice assigned.
- Adventure mrali: 2 lines; no voice assigned.
- Adventure shopkeeper: 2 lines; no voice assigned.
- Adventure snotling: 1 lines; no voice assigned.
- Adventure squig: 2 lines; no voice assigned.
- Adventure tilllady: 1 lines; no voice assigned.
- Adventure warboss: 5 lines; no voice assigned.
- Adventure zog: 2 lines; no voice assigned.
- Dave (shouting in the background): 1 lines; no voice assigned.
- Dave's Mom: 2 lines; no voice assigned.
- Directory Enquiries: 2 lines; no voice assigned.
- Game discs-rts unit: 29 lines; no voice assigned.
- Game discs-squigs unit: 48 lines; no voice assigned.
- Halloween trick-or-treaters: 9 lines; no voice assigned.
- Hearts Dave: 25 lines; no voice assigned.
- Hearts Gubbinz: 20 lines; no voice assigned.
- Hearts cousin: 22 lines; no voice assigned.
- Hint line: 2 lines; no voice assigned.
- JackBuddy: 18 lines; no voice assigned.
- JackMUD Archmage Floppington: 11 lines; no voice assigned.
- JackMUD B0B the helper robot: 8 lines; no voice assigned.
- JackMUD Barnaby Brew: 9 lines; no voice assigned.
- JackMUD Big Ted: 4 lines; no voice assigned.
- JackMUD Brunhilda the blacksmith: 9 lines; no voice assigned.
- JackMUD Callum: 8 lines; no voice assigned.
- JackMUD Captain Pegleg Pete: 10 lines; no voice assigned.
- JackMUD Commander Nova: 8 lines; no voice assigned.
- JackMUD Dave the apprentice: 10 lines; no voice assigned.
- JackMUD Dr Countdown: 9 lines; no voice assigned.
- JackMUD Farmer Giles: 8 lines; no voice assigned.
- JackMUD Flicker the fairy: 5 lines; no voice assigned.
- JackMUD Floppitha the dragon: 8 lines; no voice assigned.
- JackMUD Gloomy Gus the ferryman: 5 lines; no voice assigned.
- JackMUD Granny Byte: 8 lines; no voice assigned.
- JackMUD Headmistress Hexadecimal: 6 lines; no voice assigned.
- JackMUD JackK: 6 lines; no voice assigned.
- JackMUD King Bartholomew the Fluffy: 6 lines; no voice assigned.
- JackMUD Librarian Bookworm: 9 lines; no voice assigned.
- JackMUD Luke: 9 lines; no voice assigned.
- JackMUD Madame Inventoria: 6 lines; no voice assigned.
- JackMUD Mayor Wobblebottom: 9 lines; no voice assigned.
- JackMUD Melody Strum: 7 lines; no voice assigned.
- JackMUD Mr Abacus Penny: 5 lines; no voice assigned.
- JackMUD Mrs Bundle: 9 lines; no voice assigned.
- JackMUD Mrs Crumb: 8 lines; no voice assigned.
- JackMUD Old Barnacle Bill: 7 lines; no voice assigned.
- JackMUD Old Tom Tick: 8 lines; no voice assigned.
- JackMUD Polly-Gon the parrot: 6 lines; no voice assigned.
- JackMUD Postmistress Pat: 7 lines; no voice assigned.
- JackMUD Professor Hoot: 10 lines; no voice assigned.
- JackMUD Professor Pixel: 8 lines; no voice assigned.
- JackMUD Queen Squeakbert: 8 lines; no voice assigned.
- JackMUD Ranger Rowan: 9 lines; no voice assigned.
- JackMUD Sergeant Stuffing: 7 lines; no voice assigned.
- JackMUD Sir Clanksalot: 8 lines; no voice assigned.
- JackMUD Sir Reginald Clank: 8 lines; no voice assigned.
- JackMUD Sister Ping: 6 lines; no voice assigned.
- JackMUD Spaghetti the yeti: 8 lines; no voice assigned.
- JackMUD Strawbert the scarecrow: 6 lines; no voice assigned.
- JackMUD Trevor the Toll Troll: 6 lines; no voice assigned.
- JackMUD the Town Crier: 10 lines; no voice assigned.
- JackOS secret character: 2 lines; no voice assigned.
- MegaSearch: 8 lines; no voice assigned.
- Nan: 6 lines; no voice assigned.
- Operator: 2 lines; no voice assigned.
- Pocket Critters clockmaker: 3 lines; no voice assigned.
- Pocket Critters momTalk: 3 lines; no voice assigned.
- Pocket Critters nurseTalk: 3 lines; no voice assigned.
- Pocket Critters profTalk: 7 lines; no voice assigned.
- Pocket Critters rivalTalk: 2 lines; no voice assigned.
- Pocket Critters shopTalk: 4 lines; no voice assigned.
- Receptionist: 1 lines; no voice assigned.
- Recorded voice: 3 lines; no voice assigned.
- The Golden Dragon: 1 lines; no voice assigned.
- The Odyssey Pictures: 1 lines; no voice assigned.
- The doctors: 1 lines; no voice assigned.
- The speaking clock: 1 lines; no voice assigned.
- Tony: 2 lines; no voice assigned.
- Witch: 15 lines; no voice assigned.
- Wobble Party COUNT CRUMBLE: 1 lines; no voice assigned.
- Wobble Party SHOP: 1 lines; no voice assigned.
- a man selling double glazing: 4 lines; no voice assigned.
- a recorded voice: 1 lines; no voice assigned.
- a wrong number: 3 lines; no voice assigned.
- game baysign: 1 lines; no voice assigned.
- game blowkid: 1 lines; no voice assigned.
- game cavekid: 2 lines; no voice assigned.
- game centre2kid: 1 lines; no voice assigned.
- game centrekid: 2 lines; no voice assigned.
- game fuseCollector: 2 lines; no voice assigned.
- game fuseGuide: 2 lines; no voice assigned.
- game kilnGuide: 2 lines; no voice assigned.
- game nan: 2 lines; no voice assigned.
- game oldman: 1 lines; no voice assigned.
- game pondgirl: 1 lines; no voice assigned.
- game radioRepair: 2 lines; no voice assigned.
- game rockgirl: 1 lines; no voice assigned.
- game sailorkid: 1 lines; no voice assigned.
- game shop2girl: 1 lines; no voice assigned.
- game shopgirl: 1 lines; no voice assigned.
- game tipgirl: 1 lines; no voice assigned.
- mate1: 10 lines; no voice assigned.
- mate2: 6 lines; no voice assigned.
- mate3: 4 lines; no voice assigned.
- mate4: 4 lines; no voice assigned.
- {mate1}: 5 lines; no voice assigned.
- {mate2}: 1 lines; no voice assigned.
- {mate3}: 4 lines; no voice assigned.
- {mate4}: 5 lines; no voice assigned.

## Words which differ from an existing recording / catalogue entry

None detected by exact catalogue comparison.

## Spoken line inventory

| ID | Speaker | Where it plays / context | Text | Manifest |
|---|---|---|---|---|
| `phone.in.1.jzp365` | {mate1} | app/public/js/hs-life.js:90 — Incoming landline call | {mate2}'s got a new football. And I've got a whole tube of Crunchtubes. Well, half a tube. | uncast |
| `phone.in.1.reply.0.1k93j8z` | {mate1} | app/public/js/hs-life.js:90 — Caller responds to player choice | Gutted. Come round tomorrow then, I've got the new ULTRA 64 mag with the cheats in. | uncast |
| `phone.in.1.reply.1.143lnfv` | {mate1} | app/public/js/hs-life.js:90 — Caller responds to player choice | Sorted. If you're not there in ten we're playing three-and-in without you. Later! | uncast |
| `phone.in.1.uxpg1u` | {mate1} | app/public/js/hs-life.js:90 — Incoming landline call | Alright {me}! It's {mate1}. You coming out? We're going down the rec. | uncast |
| `phone.out.01632960117.mepo56` | {mate1} | app/public/js/hs-life.js:176 — Outgoing landline call | "{mate1}'s house." It's {mate1}'s Mom. "{mate1.He}'s out on {mate1.his} bike, love. I'll tell {mate1.him} you rang." | uncast |
| `phone.out.01632960342.1gt9dtm` | {mate2} | app/public/js/hs-life.js:177 — Outgoing landline call | {mate2}: "{me}! Have you got the Acorn Quest guide still? I need it back. I KNOW you have it." | uncast |
| `phone.in.5.1x43jpn` | {mate3} | app/public/js/hs-life.js:94 — Incoming landline call | It's {mate3}. Quick question: what's the cheat for all the weapons? I'm on the third level and I've got nothing. | uncast |
| `phone.in.5.reply.0.qbp19a` | {mate3} | app/public/js/hs-life.js:94 — Caller responds to player choice | Legend. Owe you one. Actually I'll owe you nothing, everyone knows that one. | uncast |
| `phone.in.5.reply.1.1ual3rf` | {mate3} | app/public/js/hs-life.js:94 — Caller responds to player choice | I can't! My sister's on the phone. Well, she was. Now I am. (click) | uncast |
| `phone.out.01632960776.1e03inc` | {mate3} | app/public/js/hs-life.js:178 — Outgoing landline call | Engaged. {mate3} is on the Internet. Of course {mate3.he} is. | uncast |
| `phone.in.4.1uogbxe` | {mate4} | app/public/js/hs-life.js:93 — Incoming landline call | Also, have you finished Acorn Quest yet? Don't tell me the ending. | uncast |
| `phone.in.4.reply.0.3r32on` | {mate4} | app/public/js/hs-life.js:93 — Caller responds to player choice | Oh yeah. Ha. Well, check your mail later then. Laters! | uncast |
| `phone.in.4.reply.1.18o2z9e` | {mate4} | app/public/js/hs-life.js:93 — Caller responds to player choice | NO WAY. Don't tell me. DON'T TELL ME. ({mate4.he} hangs up) | uncast |
| `phone.in.4.yjyadt` | {mate4} | app/public/js/hs-life.js:93 — Incoming landline call | {me}, it's {mate4}. Is your Internet on? I sent you an e-mail. | uncast |
| `phone.out.01632960908.1fbmxbh` | {mate4} | app/public/js/hs-life.js:179 — Outgoing landline call | {mate4}'s answering machine: "You've reached {mate4}. Leave a message after the beep. Unless you're selling something." BEEEP. | uncast |
| `phone.out.1471.1erhgdf` | 1471 | app/public/js/hs-life.js:173 — Outgoing landline call | You were called today. The caller withheld their number. | uncast |
| `phone.out.1471.ynsdhr` | 1471 | app/public/js/hs-life.js:173 — Outgoing landline call | Telephone number 0 1 6 3 2, 9 6 0, 1 1 7 called today at {dynamic} 0 4 hours. To return the call, press 3. | uncast |
| `phone.in.3.177pltf` | a man selling double glazing | app/public/js/hs-life.js:92 — Incoming landline call | Have you ever thought about a conservatory? | uncast |
| `phone.in.3.1suv89v` | a man selling double glazing | app/public/js/hs-life.js:92 — Incoming landline call | Good evening {me.sir}, I'm calling about your jackos. Are you the homeowner? | uncast |
| `phone.in.3.reply.0.1h4zf2c` | a man selling double glazing | app/public/js/hs-life.js:92 — Caller responds to player choice | Ah. Could you put your father on? ...No? Right. Thank you for your time. | uncast |
| `phone.in.3.reply.1.1cncp1c` | a man selling double glazing | app/public/js/hs-life.js:92 — Caller responds to player choice | Ah. Have you considered TRIPLE gla- (you put the phone down) | uncast |
| `phone.in.7.gdibdd` | a recorded voice | app/public/js/hs-life.js:96 — Incoming landline call | CONGRATULATIONS! You have been selected to receive a FREE holiday! To claim, call this premium-rate number. Calls cost a pound a minute. | uncast |
| `phone.in.2.1flh1tu` | a wrong number | app/public/js/hs-life.js:91 — Incoming landline call | Hello? Is that the Golden Dragon? I want to order a number 27 and a 42 with egg fried rice. | uncast |
| `phone.in.2.reply.0.13m46ik` | a wrong number | app/public/js/hs-life.js:91 — Caller responds to player choice | Oh! Sorry love. Bye. | uncast |
| `phone.in.2.reply.1.h31tu2` | a wrong number | app/public/js/hs-life.js:91 — Caller responds to player choice | ...What? Who IS this? (click) | uncast |
| `game.adventure.bankgrot.414kyd` | Adventure bankgrot | app/public/js/dos-quest.js:259 — Text adventure character spoken words; written stage directions excluded; cast approval needed | No loans. | uncast |
| `game.adventure.bankgrot.v3uh3w` | Adventure bankgrot | app/public/js/dos-quest.js:259 — Text adventure character spoken words; written stage directions excluded; cast approval needed | You got 0 Rupees, | uncast |
| `game.adventure.dad.1m5n9zf` | Adventure dad | app/public/js/dos-quest.js:248 — Text adventure character spoken words; written stage directions excluded; cast approval needed | mmf | uncast |
| `game.adventure.dad.1swn1l7` | Adventure dad | app/public/js/dos-quest.js:248 — Text adventure character spoken words; written stage directions excluded; cast approval needed | that's nice | uncast |
| `game.adventure.dad.i6t5dc` | Adventure dad | app/public/js/dos-quest.js:248 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Dad, Gubbinz has gone under the bed. | uncast |
| `game.adventure.dad.l6fck6` | Adventure dad | app/public/js/dos-quest.js:248 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Dad | uncast |
| `game.adventure.dave.1ny4gju` | Adventure dave | app/public/js/dos-quest.js:249 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Alright, | uncast |
| `game.adventure.dave.crnxox` | Adventure dave | app/public/js/dos-quest.js:249 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Have you been to the toy shop? Queue's massive. I'm not queueing. I'm not QUEUEING, Jack. | uncast |
| `game.adventure.guard.1tkhol8` | Adventure guard | app/public/js/dos-quest.js:256 — Text adventure character spoken words; written stage directions excluded; cast approval needed | COWABUNGA, | uncast |
| `game.adventure.guard.1w86fa` | Adventure guard | app/public/js/dos-quest.js:256 — Text adventure character spoken words; written stage directions excluded; cast approval needed | PASS, FRIEND. | uncast |
| `game.adventure.guard.ifjbwi` | Adventure guard | app/public/js/dos-quest.js:256 — Text adventure character spoken words; written stage directions excluded; cast approval needed | PASSWORD. | uncast |
| `game.adventure.gubbinz.ahirgt` | Adventure gubbinz | app/public/js/dos-quest.js:260 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Where are we going? Is there Wotsitz? Is there BISCUITS? | uncast |
| `game.adventure.gubbinz.dz2by9` | Adventure gubbinz | app/public/js/dos-quest.js:260 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Hi! | uncast |
| `game.adventure.gubbinz.t4ywmc` | Adventure gubbinz | app/public/js/dos-quest.js:260 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Right, boss, | uncast |
| `game.adventure.librarian.11qirt8` | Adventure librarian | app/public/js/dos-quest.js:252 — Text adventure character spoken words; written stage directions excluded; cast approval needed | If you're after the cube book, it's out. To DAVE. | uncast |
| `game.adventure.librarian.1v5ff88` | Adventure librarian | app/public/js/dos-quest.js:252 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Since MARCH. | uncast |
| `game.adventure.librarian.ub18vn` | Adventure librarian | app/public/js/dos-quest.js:252 — Text adventure character spoken words; written stage directions excluded; cast approval needed | homework | uncast |
| `game.adventure.mekk.1fg379g` | Adventure mekk | app/public/js/dos-quest.js:257 — Text adventure character spoken words; written stage directions excluded; cast approval needed | RED PAINT. FIVE ROOPEEZ. RED ONES GO FASTER. IT IS SCIENCE. | uncast |
| `game.adventure.mom.9nm6m3` | Adventure mom | app/public/js/dos-quest.js:247 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Bins. | uncast |
| `game.adventure.mom.w5o1do` | Adventure mom | app/public/js/dos-quest.js:247 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Jack. | uncast |
| `game.adventure.mom.xpbczx` | Adventure mom | app/public/js/dos-quest.js:247 — Text adventure character spoken words; written stage directions excluded; cast approval needed | You've done the bins. I've noticed. Don't let it go to your head. Tea's at six. | uncast |
| `game.adventure.mrali.1guhb78` | Adventure mrali | app/public/js/dos-quest.js:253 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Oh, and if you're stuck on a puzzle, the library has books. Books are just programs that run in your head. | uncast |
| `game.adventure.mrali.xv3eah` | Adventure mrali | app/public/js/dos-quest.js:253 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Jack! Have you looked at SUBs? Put the spaceship-drawing in a SUB. Then you can draw a spaceship anywhere. Imagine that. A spaceship ANYWHERE. | uncast |
| `game.adventure.shopkeeper.1dxw0q1` | Adventure shopkeeper | app/public/js/dos-quest.js:250 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Crisps are fifty pee, | uncast |
| `game.adventure.shopkeeper.k87mhy` | Adventure shopkeeper | app/public/js/dos-quest.js:250 — Text adventure character spoken words; written stage directions excluded; cast approval needed | Alien flavour. Don't ask me what an alien tastes of. Ask NASSA. | uncast |
| `game.adventure.snotling.1oguz63` | Adventure snotling | app/public/js/dos-quest.js:254 — Text adventure character spoken words; written stage directions excluded; cast approval needed | bloop | uncast |
| `game.adventure.squig.1b4lyy3` | Adventure squig | app/public/js/dos-quest.js:255 — Text adventure character spoken words; written stage directions excluded; cast approval needed | BLOOP | uncast |
| `game.adventure.squig.ctpiyq` | Adventure squig | app/public/js/dos-quest.js:255 — Text adventure character spoken words; written stage directions excluded; cast approval needed | nice Blobbit | uncast |
| `game.adventure.tilllady.1dqbfmq` | Adventure tilllady | app/public/js/dos-quest.js:251 — Text adventure character spoken words; written stage directions excluded; cast approval needed | One per customer. Three ninety-nine. No, we haven't got the big ship. No, I don't know when. | uncast |
| `game.adventure.warboss.13tvxk3` | Adventure warboss | app/public/js/dos-quest.js:261 — Text adventure character spoken words; written stage directions excluded; cast approval needed | ...DO IT AGAIN, | uncast |
| `game.adventure.warboss.1b05znn` | Adventure warboss | app/public/js/dos-quest.js:261 — Text adventure character spoken words; written stage directions excluded; cast approval needed | THE BIG SHINY THING, | uncast |
| `game.adventure.warboss.1jhpmgu` | Adventure warboss | app/public/js/dos-quest.js:261 — Text adventure character spoken words; written stage directions excluded; cast approval needed | YOU'RE A HUMAN. HUMANS HAVE FINGERS. SOLVE IT. | uncast |
| `game.adventure.warboss.1rkusux` | Adventure warboss | app/public/js/dos-quest.js:261 — Text adventure character spoken words; written stage directions excluded; cast approval needed | ON THE TOWER. WHERE THEY CAN ALL SEE. | uncast |
| `game.adventure.warboss.yv8qi2` | Adventure warboss | app/public/js/dos-quest.js:261 — Text adventure character spoken words; written stage directions excluded; cast approval needed | THE KING BEFORE ME COULDN'T DO IT. THE KING BEFORE HIM NEITHER. I HAVE TRIED FOR A YEAR. | uncast |
| `game.adventure.zog.164alrd` | Adventure zog | app/public/js/dos-quest.js:258 — Text adventure character spoken words; written stage directions excluded; cast approval needed | FAIR PLAY, | uncast |
| `game.adventure.zog.1wn3xdd` | Adventure zog | app/public/js/dos-quest.js:258 — Text adventure character spoken words; written stage directions excluded; cast approval needed | WHO WANTS SOME? | uncast |
| `ann.continue` | announcer | Catalogue only; trigger not found — Continue screen | Continue? | yes |
| `ann.go` | announcer | Catalogue only; trigger not found — Race and fighting start | Go! | yes |
| `ann.lucky` | announcer | Catalogue only; trigger not found — Bonus round | Bonus round. Good luck! | yes |
| `ann.new` | announcer | Catalogue only; trigger not found — New high score | New high score! | yes |
| `ann.over` | announcer | app/public/js/rm-tv.js:670 — Game over | Game over. | yes |
| `ann.press` | announcer | Catalogue only; trigger not found — Title screens | Press start. | yes |
| `ann.start` | announcer | app/public/js/rm-tv.js:620 — Any console game start | Player one. Get ready. | yes |
| `ann.win` | announcer | Catalogue only; trigger not found — Win screen | You win! | yes |
| `arena.announcer.14a4q40` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | You have lost the match. | missing |
| `arena.announcer.1cztk1n` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | rampage! | missing |
| `arena.announcer.1f8e5lv` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Red team scores! | missing |
| `arena.announcer.1rkro3l` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Multi Poof! | missing |
| `arena.announcer.1y252m8` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Combo! | missing |
| `arena.announcer.2fn0rj` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | You have won the match! | missing |
| `arena.announcer.3lg1q9` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | unstoppable! | missing |
| `arena.announcer.3vxdme` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | dominating! | missing |
| `arena.announcer.7r5nkd` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | godlike! | missing |
| `arena.announcer.d7miq8` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Blue team scores! | missing |
| `arena.announcer.e6muxl` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | poofing spree! | missing |
| `arena.announcer.gc44jq` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Play! | missing |
| `arena.announcer.jrwjvq` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | First poof! | missing |
| `arena.announcer.lcj2l7` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Double Poof! | missing |
| `arena.announcer.mktc0m` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | MONSTER POOF! | missing |
| `arena.announcer.yjtj8i` | announcer | app/public/js/pcgames-jrt.js:534 — Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | Ultra Poof! | missing |
| `c2.play.announcer` | announcer | Catalogue only; trigger not found — The console boot screen, first power on, with the crunchy console filter | Welcome to the next level. Press start. | yes |
| `c4.dd.boot` | announcer | Catalogue only; trigger not found — The Daydream first boot, crunchy console filter | Daydream. It's thinking. | yes |
| `c4.dd.boot2` | announcer | Catalogue only; trigger not found — After the boot logo | Welcome to the future. Press start. | yes |
| `c4.dd.zip` | announcer | Catalogue only; trigger not found — Zip Adventure title card | Zip Adventure! Get ready to run! | yes |
| `c4.mill.tv` | announcer | Catalogue only; trigger not found — The telly special, evening | Tonight is the night. Ten minutes to go. The whole country is counting. | yes |
| `fight.announcer.17hxufs` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | FIGHT! | missing |
| `fight.announcer.1b3s3ij` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | FINAL ROUND | missing |
| `fight.announcer.1bpvjq6` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | RING OUT! | missing |
| `fight.announcer.1gqag2d` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | K.O. | missing |
| `fight.announcer.1i0ze0n` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | TRAINING | missing |
| `fight.announcer.1s3wltc` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 1 | missing |
| `fight.announcer.1snvt7a` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 3 | missing |
| `fight.announcer.1sxvew9` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 2 | missing |
| `fight.announcer.1t7v0l8` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 5 | missing |
| `fight.announcer.1thuma7` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 4 | missing |
| `fight.announcer.1tru7z6` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 7 | missing |
| `fight.announcer.1u1tto5` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 6 | missing |
| `fight.announcer.1ubtfd4` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 9 | missing |
| `fight.announcer.1ult123` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | ROUND 8 | missing |
| `fight.announcer.1vahgr4` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | DOUBLE K.O. | missing |
| `fight.announcer.mnmu8j` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | DRAW | missing |
| `fight.announcer.mwpmc1` | announcer | app/public/js/rm-g-fightkit.js:943 — Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | TIME UP | missing |
| `game.wobble.host.110fa57` | announcer | app/public/js/rm-g-party.js:2678 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2666 | NOBODY WON THAT ONE. NO COINS! | missing |
| `game.wobble.host.143a1lf` | announcer | app/public/js/rm-g-party.js:2543 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2531 | THE SECRET MARBLE MISCHIEF DOOR IS OPEN IN THE MINIGAME HOUSE! | missing |
| `game.wobble.host.146dks4` | announcer | app/public/js/rm-g-party.js:867, app/public/js/rm-g-party.js:1183, app/public/js/rm-g-party.js:1239, app/public/js/rm-g-party.js:1265 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:867, app/public/js/rm-g-party.js:1183, app/public/js/rm-g-party.js:1239 | LET'S SEE WHAT THE REELS HAVE DECIDED! | missing |
| `game.wobble.host.14iizcv` | announcer | app/public/js/rm-g-party.js:879, app/public/js/rm-g-party.js:1267 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1255 | NO COINS TO GIVE! PHEW. | missing |
| `game.wobble.host.15r76nk` | announcer | app/public/js/rm-g-party.js:1244 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1232 | PICNIC TIME! EVERYBODY GETS 5 COINS. LOVELY! | missing |
| `game.wobble.host.1bhurkg` | announcer | app/public/js/rm-g-party.js:2576 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2564 | WIN EVERY SINGLE MINIGAME AND YOU'RE A PROPER LEGEND. RIGHT, LET'S SEE WHO GOES FIRST! | missing |
| `game.wobble.host.1czxqcu` | announcer | app/public/js/rm-g-party.js:1126 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1114 | THE STAR HAS FLOWN OFF TO A NEW SPOT! | missing |
| `game.wobble.host.1d2y5jj` | announcer | app/public/js/rm-g-party.js:2581 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2569 | AND THE FIRST STAR IS... OVER THERE! GO AND GET IT! | missing |
| `game.wobble.host.1f6ot00` | announcer | app/public/js/rm-g-party.js:2629 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2617 | YOU HAVEN'T GOT ANY ITEMS. THE SHOP SELLS THEM! | missing |
| `game.wobble.host.1fya5t0` | announcer | app/public/js/rm-g-party.js:2722 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2710 | AND NOW... THE WINNER OF THIS WOBBLE PARTY IS... | missing |
| `game.wobble.host.1ja2uxa` | announcer | app/public/js/rm-g-party.js:1105 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1093 | SUIT YOURSELF! IT'LL STILL BE HERE... PROBABLY. | missing |
| `game.wobble.host.1n2x0pa` | announcer | app/public/js/rm-g-party.js:861, app/public/js/rm-g-party.js:1222 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:861, app/public/js/rm-g-party.js:1222 | A COIN GEYSER! WHOOSH! | missing |
| `game.wobble.host.1rkqxmi` | announcer | app/public/js/rm-g-party.js:1226 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1214 | HONK! A GOOSE WADDLES UP AND PINCHES 5 COINS! | missing |
| `game.wobble.host.1syds4j` | announcer | app/public/js/rm-g-party.js:868, app/public/js/rm-g-party.js:2571 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2559 | WELCOME TO WOBBLE ISLAND! I'M MC WOBBLE, YOUR HOST WITH THE MOST! | missing |
| `game.wobble.host.1v12lh` | announcer | app/public/js/rm-g-party.js:2750 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2738 | AND YOU WON EVERY SINGLE MINIGAME! A CLEAN SWEEP! LEGENDARY! | missing |
| `game.wobble.host.1w75573` | announcer | app/public/js/rm-g-party.js:857, app/public/js/rm-g-party.js:872, app/public/js/rm-g-party.js:1102 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1090 | OH DEAR. COME BACK WITH MORE COINS! | missing |
| `game.wobble.host.1wafoa1` | announcer | app/public/js/rm-g-party.js:856, app/public/js/rm-g-party.js:1101 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:856, app/public/js/rm-g-party.js:1101 | THE STAR HAS BEEN FOUND! | missing |
| `game.wobble.host.1wf6wxm` | announcer | app/public/js/rm-g-party.js:859, app/public/js/rm-g-party.js:1175 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:859, app/public/js/rm-g-party.js:1175 | TWIN DICE! TWO BLOCKS! | missing |
| `game.wobble.host.1yrfw5o` | announcer | app/public/js/rm-g-party.js:869, app/public/js/rm-g-party.js:2574 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2562 | WHOEVER HAS THE MOST STARS AT THE END WINS. I'LL SWAP YOU A STAR FOR COINS. | missing |
| `game.wobble.host.1ysq7rd` | announcer | app/public/js/rm-g-party.js:2697 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2685 | WHAT A PARTY! EVERYBODY TO THE PARTY STAGE FOR THE BONUS STARS! | missing |
| `game.wobble.host.1yus1o0` | announcer | app/public/js/rm-g-party.js:866, app/public/js/rm-g-party.js:2677 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:866, app/public/js/rm-g-party.js:2677 | THE WINNERS GET TEN COINS! | missing |
| `game.wobble.host.2asyz9` | announcer | app/public/js/rm-g-party.js:2575 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2563 | BLUE SPACES GIVE YOU 3 COINS, RED ONES TAKE 3 AWAY. AFTER EVERY TURN THERE'S A MINIGAME: WIN IT FOR 10 COINS! | missing |
| `game.wobble.host.2n6itx` | announcer | app/public/js/rm-g-party.js:875, app/public/js/rm-g-party.js:1183 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1171 | SWAP KAZOO! TIME TO SWAP PLACES! | missing |
| `game.wobble.host.5steas` | announcer | app/public/js/rm-g-party.js:873, app/public/js/rm-g-party.js:1160 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1148 | THANK YOU! COME AGAIN! | missing |
| `game.wobble.host.66rpmg` | announcer | app/public/js/rm-g-party.js:2612 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2600 | ONLY THREE TURNS LEFT! FROM NOW ON, BLUE AND RED SPACES COUNT DOUBLE! | missing |
| `game.wobble.host.6pkgli` | announcer | app/public/js/rm-g-party.js:878, app/public/js/rm-g-party.js:1269 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1257 | NO STARS TO GIVE! PHEW. | missing |
| `game.wobble.host.6qi9t6` | announcer | app/public/js/rm-g-party.js:1158 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1146 | YOU CAN'T AFFORD THAT ONE, SORRY! | missing |
| `game.wobble.host.8oxsmd` | announcer | app/public/js/rm-g-party.js:864, app/public/js/rm-g-party.js:2605 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:864, app/public/js/rm-g-party.js:2605 | LET'S SEE WHO GOES FIRST! EVERYBODY STARTS WITH TEN COINS. | missing |
| `game.wobble.host.ar7z9n` | announcer | app/public/js/rm-g-party.js:877, app/public/js/rm-g-party.js:1216 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1204 | THE COUNT'S DISCOUNT LEVER! BARGAIN STARS! | missing |
| `game.wobble.host.e7lqoo` | announcer | app/public/js/rm-g-party.js:883, app/public/js/rm-g-party.js:2749 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2737 | BAD LUCK! BETTER LUCK NEXT TIME! | missing |
| `game.wobble.host.g6mio8` | announcer | app/public/js/rm-g-party.js:880, app/public/js/rm-g-party.js:2709 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2697 | TIME FOR A BONUS STAR! | missing |
| `game.wobble.host.gt3to3` | announcer | app/public/js/rm-g-party.js:858, app/public/js/rm-g-party.js:871, app/public/js/rm-g-party.js:1115 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1103 | YOU GOT A STAR! SPARKLY! | missing |
| `game.wobble.host.h6mg4g` | announcer | app/public/js/rm-g-party.js:1177 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1165 | COIN MAGNET! 3 COINS FROM EVERYBODY! | missing |
| `game.wobble.host.h7wc9x` | announcer | app/public/js/rm-g-party.js:863, app/public/js/rm-g-party.js:874, app/public/js/rm-g-party.js:1253 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1241 | STOP THE REELS! ANYTHING CAN HAPPEN! | missing |
| `game.wobble.host.it4hyq` | announcer | app/public/js/rm-g-party.js:870, app/public/js/rm-g-party.js:1101 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1089 | YOU FOUND THE STAR! FANCY A SWAP? | missing |
| `game.wobble.host.kj0owm` | announcer | app/public/js/rm-g-party.js:881, app/public/js/rm-g-party.js:2710 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2698 | NOBODY! NO BONUS STAR THIS TIME. | missing |
| `game.wobble.host.mju42` | announcer | app/public/js/rm-g-party.js:1215 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1203 | THE CLOCK IS STILL WINDING! IT ADDS 9 COINS EACH ROUND. | missing |
| `game.wobble.host.nzkznm` | announcer | app/public/js/rm-g-party.js:1150 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1138 | YOUR POCKETS ARE FULL! (THREE ITEMS MAX.) | missing |
| `game.wobble.host.ogoqhi` | announcer | app/public/js/rm-g-party.js:862, app/public/js/rm-g-party.js:1230 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:862, app/public/js/rm-g-party.js:1230 | WOBBLE WARP! WHEEE! OFF WE GO! | missing |
| `game.wobble.host.q55w08` | announcer | app/public/js/rm-g-party.js:860, app/public/js/rm-g-party.js:1215 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:860, app/public/js/rm-g-party.js:1215 | DING DONG! THE CLOCKWORK JACKPOT PAYS OUT! | missing |
| `game.wobble.host.qm0di3` | announcer | app/public/js/rm-g-party.js:876, app/public/js/rm-g-party.js:1239 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1227 | SWAP SHOP! TIME TO SWAP COINS! | missing |
| `game.wobble.host.t96fyl` | announcer | app/public/js/rm-g-party.js:882, app/public/js/rm-g-party.js:2749 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2737 | WELL DONE! YOU'RE THE WOBBLE SUPERSTAR! | missing |
| `game.wobble.host.vvc01w` | announcer | app/public/js/rm-g-party.js:865, app/public/js/rm-g-party.js:2615 — Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:865, app/public/js/rm-g-party.js:2615 | LAST PLACE? HAVE TEN COINS TO CATCH UP! | missing |
| `game.wobble.host.vy6gev` | announcer | app/public/js/rm-g-party.js:1235 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1223 | STAR SHUFFLE! THE STAR GETS BORED AND HOPS AWAY! | missing |
| `game.wobble.host.ydyoml` | announcer | app/public/js/rm-g-party.js:1217 — Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1205 | THE WINDMILL PAYS ITS RENT! 5 COINS FOR EVERYBODY! | missing |
| `bark.dad.bed1` | dad | app/public/js/np-life.js:583 — 21:30 | Is it bedtime yet? I'm shattered. Night night. | yes |
| `bark.dad.bed2` | dad | app/public/js/np-life.js:584 — 22:00, the player still on the PC | I can hear that keyboard clicking. Lights out. I mean it. | yes |
| `bark.dad.cut1` | dad | Catalogue only; trigger not found — Everything goes dark | Fuse has gone. Don't panic. Stay where you are. I'll find the torch. | yes |
| `bark.dad.cut2` | dad | Catalogue only; trigger not found — Cupboard under the stairs | Where's the torch? I put it exactly here. I put it exactly here. | yes |
| `bark.dad.line1` | dad | Catalogue only; trigger not found — Hall, the player is on the phone | Oi, don't hog the phone. I might be getting a call. | yes |
| `bark.dad.line2` | dad | Catalogue only; trigger not found — Hall, player online on the PC | Is that the internet again? It sounds like a kettle with a cold. | yes |
| `bark.dad.line3` | dad | app/public/js/np-life.js:581 — Hall | The bill. The bill. I dread the bill. | yes |
| `bark.dad.mess1` | dad | app/public/js/np-life.js:581 — Hall | I've lost my keys. Has anyone seen my keys? They were here a minute ago. | yes |
| `bark.dad.mess2` | dad | app/public/js/np-life.js:581 — Lounge | Who's been using my chair? It's still warm. | yes |
| `bark.dad.react.garden` | dad | app/public/js/np-life.js:582 — Garden | A fine lawn. I should enter it in a competition. | yes |
| `bark.dad.react.gnome` | dad | app/public/js/np-life.js:582 — Gnome | I've named the gnome Kevin. He's very quiet. | yes |
| `bark.dad.react.joke` | dad | app/public/js/np-life.js:553, app/public/js/np-life.js:585 — Random | Why did the computer go to the doctor? It had a virus. Thank you, I'm here all week. | yes |
| `bark.dad.react.pc` | dad | Catalogue only; trigger not found — Bedroom doorway | Are you doing homework on that? I can hear a lot of explosions. | yes |
| `bark.dad.school1` | dad | app/public/js/np-life.js:578 — Hall | Morning, morning! I'm late! Where's my tie? Never mind! | yes |
| `bark.dad.tea1` | dad | app/public/js/np-life.js:577 — Lounge to kitchen | Smells good. What's for tea? No, don't tell me. Let me guess. Chips? | yes |
| `bark.dad.tea2` | dad | app/public/js/np-life.js:577 — At the table | The ketchup is in the middle, I see. Good. The system works. | yes |
| `bark.dad.tea3` | dad | app/public/js/np-life.js:577 — At the table | Pass the salt. No, not that. The other salt. | yes |
| `bark.dad.tv1` | dad | app/public/js/np-life.js:580 — Lounge | Hang on, I'm watching that. Dad's choice. It's the football. | yes |
| `bark.dad.tv2` | dad | app/public/js/np-life.js:580 — Lounge | It's all adverts these days. Four minutes of programme, ten of adverts. | yes |
| `bark.dad.tv3` | dad | app/public/js/np-life.js:580 — Lounge, Teletext | Page one-oh-one, for the news. Page three-two-six, for the scores. Wonderful stuff. | yes |
| `bark.dad.wknd1` | dad | app/public/js/np-life.js:579 — Saturday | Right. The car won't wash itself. Or will it? Let's find out. | yes |
| `bark.dad.wknd2` | dad | app/public/js/np-life.js:579 — Sunday, in the chair | Sunday. A day of rest. Do not disturb the rest. | yes |
| `bark.dad.wknd3` | dad | app/public/js/np-life.js:579 — Saturday | It's Saturday. Pocket money day. Don't spend it all at once. | yes |
| `bf.code.wait.7q2fba` | dad | app/public/js/season-bonfire.js:244 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:244 | Closed tin, water, pets indoors, watching line. Check all four first. Then we can talk about the taper. | missing |
| `bf.cooled.15r44gg` | dad | app/public/js/season-bonfire.js:269 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:269 | Hot end down. Lovely. You remembered the important bit. Leave the wires in the water. | missing |
| `bf.dad.talk.1dguuhl` | dad | app/public/js/season-bonfire.js:740 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:740 | Tin shut, bucket full, pets indoors, everyone behind the rope, long taper. Five checks. No cutting corners. | missing |
| `bf.dad.talk.1wfrt7z` | dad | app/public/js/season-bonfire.js:740 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:740 | Safety checks all done. Dry wood only on the stack. Friday evening: torch at the rope, then supper. I do the lighting. | missing |
| `bf.display.away.15tnmi0` | dad | app/public/js/season-bonfire.js:538 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:538 | The display will carry on. Come back behind the rope when you are ready; you can still finish watching. | missing |
| `bf.display.checks.1fqatvb` | dad | app/public/js/season-bonfire.js:480 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:480 | Finish the dry stack and all five Firework Code checks first. | missing |
| `bf.display.resume.1lc7fy1` | dad | app/public/js/season-bonfire.js:483 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:483 | You are back! All finished safely. Stay at the rope while I check everything. | missing |
| `bf.display.resume.z6a2bk` | dad | app/public/js/season-bonfire.js:483 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:483 | The display carried on. Come back behind the rope and look up. | missing |
| `bf.display.start.14xltvy` | dad | app/public/js/season-bonfire.js:482 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:482 | Missed Friday? I saved a few. No jobs tonight: just stay behind the rope and watch. I do all the lighting. The show carries on if you leave; come back here to finish. | missing |
| `bf.display.start.f55ktr` | dad | app/public/js/season-bonfire.js:482 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:482 | I have checked for animals. Torch this way, everyone behind the rope. I light one, then come back. The display carries on if you leave; come back to the rope to finish. | missing |
| `bf.display.time.1dhhkkv` | dad | app/public/js/season-bonfire.js:479 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:479 | Half past six until ten in the evening. Warm things on, and watch from the rope. | missing |
| `bf.end.aqcnqs` | dad | app/public/js/season-bonfire.js:753 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:753 | All finished. I am making everything safe. Stay here while I check. Thank you for watching from the rope! | missing |
| `bf.history.18sdxer` | dad | app/public/js/season-bonfire.js:314 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:314 | Bonfire Night remembers a plot in 1605 to blow up Parliament. Our Guy is old clothes and newspaper. Dad nearly donated his good trousers. | missing |
| `bf.lead.2w6y11` | dad | app/public/js/season-bonfire.js:685 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:685 | Bonfire Night on Friday. Help me stack the dry garden wood, and you two can make a Guy. Closed firework tin stays with me. | missing |
| `bf.line.2cmfdz` | dad | app/public/js/season-bonfire.js:238 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:238 | Everyone stays behind the rope. Always follow the distance on the box. Never throw fireworks and NEVER go back to one, even if it has gone quiet. Leave it to me. | missing |
| `bf.rocket.1a6z6bq` | dad | app/public/js/season-bonfire.js:502 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | Here comes the rocket. Stay back. Never go back to a firework, even if it seems to have stopped. | missing |
| `bf.sparkler.done.110908g` | dad | app/public/js/season-bonfire.js:263 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:263 | Hot wire into the bucket now, please. | missing |
| `bf.sparkler.done.72262s` | dad | app/public/js/season-bonfire.js:263 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:263 | That was lovely. All the hot wires are in the water. Supper time. | missing |
| `bf.sparkler.wait.1o96ayr` | dad | app/public/js/season-bonfire.js:261 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:261 | Display first, sparklers afterwards. I have not forgotten. | missing |
| `bf.tail.talk.times.8y9bbq` | dad | app/public/js/season-bonfire.js:739 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:739 | Cold sticks in the bin. Leave the ash alone. If you missed Friday, I saved leftovers for the evening, half past six until ten. | missing |
| `bf.tail.tw78cy` | dad | app/public/js/season-bonfire.js:687 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:687 | I have damped the fire right down and checked the cold rubbish. Sticks and wrappers into the bin, please. Leave the ash alone; I will check it again. | missing |
| `bf.taper.te7i05` | dad | app/public/js/season-bonfire.js:245 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:245 | A long taper, at arm length. One adult in charge: me. Check! We light the bonfire after checking it for animals. No petrol or paraffin. All ready for Friday evening. | missing |
| `bf.tin.1dmucg3` | dad | app/public/js/season-bonfire.js:228 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:228 | Shop-bought, in their closed tin, up out of reach. No fireworks in pockets. I read the instructions and light one at a time. You watch from behind the rope. | missing |
| `bf.water.1vy2tmp` | dad | app/public/js/season-bonfire.js:231 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:231 | Bucket filled and parked behind the rope. Used sparklers go in hot end first. The wire stays hot, even when it looks cold. | missing |
| `bf.wood.ncj5f5` | dad | app/public/js/season-bonfire.js:122 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:122 | Dry wood and cardboard only. Paper, then kindling. No aerosols, glass, paint, plastic or fireworks on the fire. We check for hedgehogs before lighting. | missing |
| `c1.dad.boot` | dad | app/public/js/np-life.js:547 — Dad steps back from the boot | Pop the boot, go on. Everything's in there. | yes |
| `c1.dad.brief` | dad | app/public/js/np-life.js:547, app/public/js/np-life.js:548, app/public/js/np-life.js:703 — Boot open, Dad points at the house | Tower first, then the monitor, then the little box with the keyboard and mouse, and the speakers last. Take your time, mind the stairs. | yes |
| `c1.dad.hello` | dad | app/public/js/np-life.js:702 — At the car, Dad waves you over | There you are! Come here. You are not going to believe what I've got in the boot. | yes |
| `c1.dad.mom` | dad | Catalogue only; trigger not found — Mom appears at the door, scowling at the mess | Your mother says mind the wallpaper. And so do I. | yes |
| `c1.dad.offer` | dad | app/public/js/np-life.js:547 — Dad opens the conversation to the offer | So. Do you want one? Your very own computer? It's no beast but it works. Mostly. | yes |
| `c1.dad.story` | dad | app/public/js/np-life.js:547 — Dad leans on the car | The office is chucking out all the old computers. New ones on Monday, all grey and flat and very fancy. Nobody wanted the old ones. Except me. | yes |
| `c1.dad.yes` | dad | app/public/js/np-life.js:547 — If the player says yes (any answer leads here) | Ha ha! I thought you might. Right. It's heavy, so listen. | yes |
| `c1.floppy.dad` | dad | app/public/js/np-life.js:707 — JackOS Setup asks for the first disk | Setup wants the floppies. They're in that box. Number one first. They have to go in order. | yes |
| `c1.floppy.stick` | dad | Catalogue only; trigger not found — The third disk fails the first time (scripted fun) | Disk three. It always sticks. Give it a gentle poke. | yes |
| `c1.install.done` | dad | app/public/js/np-life.js:697 — Installation finished | That's it. You're a computer owner. Look at you. | yes |
| `c1.keys.pick` | dad | app/public/js/np-life.js:731 — Player picks up the keyboard box | Easy one. Careful with the mouse, it's got a wire on it like a tail. | yes |
| `c1.lead.dad` | dad | app/public/js/np-life.js:549, app/public/js/np-life.js:635 — Desk filled, Dad appears behind the player | Now the leads. They only go one way in. If it doesn't fit, don't force it. | yes |
| `c1.lead.dad.power` | dad | app/public/js/np-life.js:549, app/public/js/np-life.js:704 — After the power lead is plugged in | Power. Do not plug the monitor lead into the power socket. I've seen it done. | yes |
| `c1.logon.dad` | dad | app/public/js/np-life.js:697 — Dad, leaving the room | One more thing. It's the phone line downstairs. If I need it, you're off. Not a word. Deal? | yes |
| `c1.mon.done` | dad | Catalogue only; trigger not found — Monitor placed on the desk | Phew. Right. That's the worst of it over. | yes |
| `c1.mon.drop` | dad | Catalogue only; trigger not found — If the player drops the monitor (it bounces, no damage) | Oh, my heart! Don't drop it! Pick it up, slowly. | yes |
| `c1.mon.pick` | dad | app/public/js/np-life.js:731 — Player picks up the monitor, walk speed drops | Gently, gently! That's the heavy one. It weighs about as much as a small elephant. | yes |
| `c1.mon.stairs` | dad | Catalogue only; trigger not found — Halfway up the stairs with the monitor | Mind the banister! And mind the wall! Your mother will have us both! | yes |
| `c1.power.boot` | dad | app/public/js/np-life.js:706 — PC beeps and the screen flickers | It's alive! It's alive! | yes |
| `c1.power.dad` | dad | app/public/js/np-life.js:550, app/public/js/np-life.js:705 — All leads connected, Dad rubs his hands | Moment of truth. Hit the button. Fingers crossed. | yes |
| `c1.speak.pick` | dad | app/public/js/np-life.js:731 — Speakers picked up | Last trip! Put one each side of the screen, like bookends. | yes |
| `c1.tower.done` | dad | app/public/js/np-life.js:695 — Tower placed on the desk | Perfect. First one up. Off you go, next one. | yes |
| `c1.tower.pick` | dad | app/public/js/np-life.js:731 — Player picks up the tower | That's it, bend your knees. It's heavier than it looks. | yes |
| `c2.bigjob.done` | dad | Catalogue only; trigger not found — Big job complete | Now that is a car. I can see my face in it. Which is a bit upsetting, actually. | yes |
| `c2.bigjob.give` | dad | app/public/js/np-life.js:552 — Dad on the drive with a bucket, Saturday | Big job day. Car's a disgrace, look at it. I'll pay you properly. | yes |
| `c2.bigjob.shed` | dad | Catalogue only; trigger not found — Alternative big job, shed | The shed. Everything out, everything swept, everything back in the right order. Don't ask me how the lawnmower got behind the paint. | yes |
| `c2.connect.dad` | dad | app/public/js/np-life.js:712 — Console reaches the room | Telly's there. Console goes next to it. The cable's the yellow one. Don't worry about the red and white ones just yet. | yes |
| `c2.connect.done` | dad | app/public/js/np-life.js:713 — Console connected | Brilliant. Does it do anything? Go on, switch it on. | yes |
| `c2.order.dad` | dad | app/public/js/np-life.js:709 — Dad when the order is placed | Ordering a console, are we? I hope it comes with an instruction manual. Nobody reads them, but I like to know they exist. | yes |
| `c2.phone.dad` | dad | Catalogue only; trigger not found — Dad when the player picks up the hall phone while he is waiting for a call | Oi! I'm expecting a call! Don't tie up the line! | yes |
| `c2.pocket.dad` | dad | app/public/js/np-life.js:551 — Dad in the lounge in his chair, objective pocket | Saving up, eh? Right. Here's how it works. Your mother's jobs on the list pay cash. Do all four and there's a bonus. | yes |
| `c2.pocket.dad2` | dad | app/public/js/np-life.js:551 — Same conversation | And on a Saturday I'll sling you a bit extra if I'm in a good mood. Tell me nicely. | yes |
| `c2.pocket.dad3` | dad | app/public/js/np-life.js:551 — Same conversation | There's the big job as well. Wash the car, clear out the shed. Pays proper money. Rubbish money, obviously, but proper rubbish money. | yes |
| `c2.pocket.dad4` | dad | app/public/js/np-life.js:551 — Closing line; REQUIRED RETAKE: exact words, no extra opening noises; standard neutral British, no regional accent. | And keep on the right side of your mother. Her good books are worth more than any pound coin. | missing |
| `c2.post.dad` | dad | Catalogue only; trigger not found — Dad from the lounge | That'll be the postie. Go on, don't leave it on the mat. | yes |
| `c2.unbox.dad` | dad | app/public/js/np-life.js:711 — Dad leaning in the doorway as the parcel opens; REQUIRED RETAKE: exact words, no extra opening noises; standard neutral British, no regional accent. | Look at the size of that. Right. Mind your back on those stairs. | missing |
| `c3.ask.dad` | dad | Catalogue only; trigger not found — F on Dad | Phone bill! That thing costs by the minute. I remember what it was like last time. Four hours on a Sunday. Four. | yes |
| `c3.ask.dad.deal` | dad | Catalogue only; trigger not found — Player agrees | Good. And you pay for the cable. No arguments. | yes |
| `c3.ask.dad2` | dad | Catalogue only; trigger not found — After Mom said yes | Hmm. Fine. But if I'm expecting a call, off you come. Deal? | yes |
| `c3.bill.dad` | dad | Catalogue only; trigger not found — Later the same day, Dad at the bottom of the stairs, optional | The phone bill came. I won't say how much. I'll just say it's enough to buy a console. | yes |
| `c3.cable.found` | dad | Catalogue only; trigger not found — Player finds the cable in the shed | That's the one. Ten metres of telephone lead. I bought it for the 1995 Christmas lights. Don't ask. | yes |
| `c3.cable.shed` | dad | Catalogue only; trigger not found — Dad on the drive, shed job done | There's an old extension cable in here somewhere. Under the paint. Behind the lawnmower. In the box marked "Misc." | yes |
| `c3.dial.dad` | dad | Catalogue only; trigger not found — Dad at the PC as the player presses Connect | Ready? Here goes... | yes |
| `c3.dial.ok` | dad | Catalogue only; trigger not found — Connected | We're online! In the bedroom! Good heavens. | yes |
| `c3.end.dad` | dad | Catalogue only; trigger not found — Chapter complete | Not bad. Proper little engineer. | yes |
| `c3.hangup.dad` | dad | Catalogue only; trigger not found — The player has been online for 5 minutes, Dad downstairs, muffled | Oi! I need the phone! Get off the internet! | yes |
| `c3.hangup.dad2` | dad | Catalogue only; trigger not found — If the player doesn't hang up within 20 seconds | I'm expecting an important call! Off! Off! Off! | yes |
| `c3.hangup.late` | dad | Catalogue only; trigger not found — Player was late (comic penalty: Dad stomps up) | You were on there for twenty minutes! Do you know what that costs? Do you? It's like feeding pound coins into a shredder. | yes |
| `c3.hangup.ok` | dad | Catalogue only; trigger not found — Player hangs up in time | Thank you. See? We can all get along. | yes |
| `c3.isp.dad` | dad | Catalogue only; trigger not found — Dad as the ISP installer runs | It says it's free. It's never free. Read the small print. | yes |
| `c3.run.clip` | dad | Catalogue only; trigger not found — After a few clips | Good. That's it. Nice and tight. Don't staple through it, whatever you do. | yes |
| `c3.run.dad` | dad | Catalogue only; trigger not found — Dad in the hall, objective socket | Right. The socket's by the front door. Plug it in there and run it up the stairs, along the skirting. Neat. Nice and flat. | yes |
| `c3.run.done` | dad | Catalogue only; trigger not found — Cable at the desk | Right. Plug that into the back of your PC. The port with the little phone on it. | yes |
| `c3.run.trip.dad` | dad | Catalogue only; trigger not found — Same moment | Right. That's why we clip it to the wall. | yes |
| `c4.bon.dad` | dad | app/public/js/season-bonfire.js:265 — Dad in the garden with a box of sparklers | Right. Sparklers. Gloves on, everyone. Hold it by the bottom, point it away, stay back. | yes |
| `c4.bon.dad2` | dad | Catalogue only; trigger not found — Rockets over the road | Oooh. That's a good one. Better than ours, bless them. | yes |
| `c4.bon.end` | dad | Catalogue only; trigger not found — Sparklers burn out | That's your lot. Good night, everybody. Bed in half an hour. | yes |
| `c4.dd.dad` | dad | Catalogue only; trigger not found — Dad at breakfast | A hundred and ninety-nine pounds? For a games machine? I'd want a holiday thrown in for that. | yes |
| `c4.dd.dad2` | dad | Catalogue only; trigger not found — After the player makes the case | It does the internet too? Does it do my tax return? No? Pity. | yes |
| `c4.dd.setup.dad` | dad | Catalogue only; trigger not found — Dad as the Daydream is set up | The phone lead goes in the back. That's the modem. Don't ring a premium number. | yes |
| `c4.dd.unbox.dad` | dad | Catalogue only; trigger not found — Dad at the doorway | That's one big box. It's like a fridge. | yes |
| `c4.game2.dad` | dad | Catalogue only; trigger not found — Dad at the door | A collector. Your mother had a thing for teaspoons. Look where that got us. | yes |
| `c4.hal.dad` | dad | app/public/js/season-halloween.js:609 — Dad with a pumpkin on the drive | Right, pumpkin. How hard can it be? Mind your fingers, now. | yes |
| `c4.hal.dad.carve` | dad | app/public/js/season-halloween.js:679 — Carving | Is it supposed to look like that? Maybe it's meant to be scary. Because it is. | yes |
| `c4.hal.night` | dad | app/public/js/season-halloween.js:1090 — Evening, Dad switching the lights off | Everyone ready? Spooky telly, lights off. Who's brave enough? | yes |
| `c4.hal.treat.dad` | dad | app/public/js/season-halloween.js:535 — Dad sneaks a sweet from the bowl | What? I'm checking quality. | yes |
| `c4.mag.dad` | dad | Catalogue only; trigger not found — Dad peeking at the magazine | Cheat codes, hints, tips. In my day we just got stuck. | yes |
| `c4.mill.count` | dad | Catalogue only; trigger not found — Countdown, final ten seconds | Ten! Nine! Eight! Seven! Six! Five! Four! Three! Two! One! | yes |
| `c4.mill.dad` | dad | Catalogue only; trigger not found — Dad with a torch at the cupboard | Right. Torch, candles, tin opener, water in the bath. The millennium bug won't catch us out. | yes |
| `c4.mill.dad.cheer` | dad | Catalogue only; trigger not found — Same moment | HAPPY NEW YEAR! And the lights are still on! | yes |
| `c4.mill.dad2` | dad | Catalogue only; trigger not found — Dad, ironic | Everyone's been very nervous. I've told the PC it's been a very good PC. Just in case. | yes |
| `c4.start.dad` | dad | Catalogue only; trigger not found — Chapter 4 title card ends | Don't expect me to be your bank. Anything else you want, you save up for. | yes |
| `c4.tourney.dad` | dad | Catalogue only; trigger not found — Dad passes the door during the tourney | Who's winning? No, don't tell me. I'll be disappointed either way. | yes |
| `c4.trade.dad` | dad | Catalogue only; trigger not found — Swap done | Look at that. Wheeler-dealer. Careful, or you'll end up on the telly. | yes |
| `c4.xmas.carol.dad` | dad | Catalogue only; trigger not found — Dad, same moment | They're not bad. A bit flat in the second verse. | yes |
| `c4.xmas.dad` | dad | Catalogue only; trigger not found — Dad with a tangle of fairy lights | Every year the lights are tangled. Every single year. I put them away neatly. They break into a knot overnight. | yes |
| `c4.xmas.eve.dad` | dad | Catalogue only; trigger not found — Dad on the landing | Is he asleep yet? Good. Shh. I'm eating the mince pie. | yes |
| `c4.xmas.eve.dad.neutral` | dad | Catalogue only; trigger not found — Christmas Eve, Dad whispers while eating Father Christmas’s mince pie; replaces the gendered player reference in the legacy recording. | Is everyone asleep yet? Good. Shh. I am eating the mince pie. | missing |
| `c4.xmas.list.dad` | dad | Catalogue only; trigger not found — Dad sees the list | Ask Father Christmas. He's got a lot of paperwork. | yes |
| `c4.xmas.morn.dad` | dad | Catalogue only; trigger not found — Dad at the tree | Merry Christmas, everyone! Let's see what he's brought. | yes |
| `chore.saturday` | dad | Catalogue only; trigger not found — Saturday, Dad hands over weekly money | Here you go. Saturday money. Don't say I never give you anything. | yes |
| `chore.weekly.give` | dad | app/public/js/np-life.js:552 — Dad assigns this week's big job | Big job this week. Pays properly. Interested? | yes |
| `house.moment.1djssky` | dad | app/public/js/hs-life.js:69 — Time-of-day house shout; app/public/js/hs-life.js:69 | Bed! Now! | missing |
| `house.moment.hwj5im` | dad | app/public/js/hs-life.js:71 — Time-of-day house shout; app/public/js/hs-life.js:71 | Is that the Internet on? Do you know how much those phone calls cost? | missing |
| `house.moment.wd8c5e` | dad | app/public/js/hs-life.js:68 — Time-of-day house shout; app/public/js/hs-life.js:68 | Have you been using the phone? The bill came. | missing |
| `house.voice.h701ve` | dad | app/public/js/hs-telly.js:411 — House welcome, shout or event; app/public/js/hs-telly.js:411 | TURN THAT DOWN! IT'S THE MIDDLE OF THE NIGHT! | missing |
| `hw.dad.match.hliuf7` | dad | app/public/js/season-halloween.js:678 — Halloween, physical preparation / door; app/public/js/season-halloween.js:678 | Hang on, matches are my job. Long match, arm's length... there we go. | missing |
| `hw.dad.safe.l28lnk` | dad | app/public/js/season-halloween.js:1017 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1015 | Only knock on doors with the lights on, and never go in anyone's house. Mom's rules. And mine. | missing |
| `st.carry.4c83tp` | dad | app/public/js/st-opening.js:50 — Dad explains computer carrying; app/public/js/st-opening.js:50 | E carries it. Take it to the marked place on your desk. Q puts it back safely. | missing |
| `st.carry.wzg82y` | dad | app/public/js/st-opening.js:50 — Dad explains computer carrying; app/public/js/st-opening.js:50 | Plug in the marked leads, then press the power button. | missing |
| `st.opening.dad.165n9l8` | dad | app/public/js/st-engine.js:141 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:141 | The office is chucking out the old computers. Mine is in the boot if you want it. Mind the monitor: it weighs a ton! | missing |
| `st.opening.lead.power.1h9zqa3` | dad | app/public/js/st-engine.js:143 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:143 | Everything on the desk? Plug the leads into the matching sockets, then try the big button. | missing |
| `st.opening.part.monitor.inylew` | dad | app/public/js/st-engine.js:142 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:142 | Both hands on that monitor. No running on the stairs. | missing |
| `st.opening.pc.oltv5s` | dad | app/public/js/st-engine.js:144 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:144 | There you go. Your own computer. Try not to fill it with games. | missing |
| `dialer.01632960123.1svbd1a` | Dave (shouting in the background) | app/public/js/apps-programs.js:2130 — JackOS Phone Dialer call | TELL HIM I'VE GOT THE GOOD CONTROLLER! | uncast |
| `dialer.01632960123.bk1o0m` | Dave's Mom | app/public/js/apps-programs.js:2130 — JackOS Phone Dialer call | Hello? Oh, hello love. He's having his tea. Shall I get him to ring you back? | uncast |
| `dialer.01632960123.wzy7h4` | Dave's Mom | app/public/js/apps-programs.js:2130 — JackOS Phone Dialer call | He says he's got the good controller. Bye now! | uncast |
| `dialer.192.1ad7xyg` | Directory Enquiries | app/public/js/apps-programs.js:2136 — JackOS Phone Dialer call | ...I have no listing for Gubbinz. Is that a business? | uncast |
| `dialer.192.c5ghzc` | Directory Enquiries | app/public/js/apps-programs.js:2136 — JackOS Phone Dialer call | Which name, please? | uncast |
| `game.rm-g-mon.baysign.ijs7yr` | game baysign | app/public/js/rm-g-mon.js:576 — In-game character conversation (cast approval needed) | The tide comes in, the tide goes out. I just sit here. Lovely. | uncast |
| `game.rm-g-mon.blowkid.dcqh1a` | game blowkid | app/public/js/rm-g-mon.js:515 — In-game character conversation (cast approval needed) | My big brother says if your game won't work, you blow on the cartridge. Works every time! | uncast |
| `game.rm-g-mon.cavekid.13fzvvj` | game cavekid | app/public/js/rm-g-mon.js:555 — In-game character conversation (cast approval needed) | That hole up there is GRUMBLY CAVE. It grumbles. Critters that like the dark live in it. | uncast |
| `game.rm-g-mon.cavekid.eexipt` | game cavekid | app/public/js/rm-g-mon.js:555 — In-game character conversation (cast approval needed) | PEBBLE BAY is out the other side. My Nan lives there. She makes the best rock cakes. | uncast |
| `game.rm-g-mon.centre2kid.zdce29` | game centre2kid | app/public/js/rm-g-mon.js:578 — In-game character conversation (cast approval needed) | CAPTAIN {captain}'s critters are all PUDDLE types. MOSS critters soak them right up! | uncast |
| `game.rm-g-mon.centrekid.4po651` | game centrekid | app/public/js/rm-g-mon.js:524 — In-game character conversation (cast approval needed) | The lady by the wall runs the CABLE CLUB. Get a LINK CABLE and you can trade with your mates on JackNet! | uncast |
| `game.rm-g-mon.centrekid.5l3v50` | game centrekid | app/public/js/rm-g-mon.js:524 — In-game character conversation (cast approval needed) | That PC in the corner talks to PROFESSOR {professor}'s PC. If your party is full, new critters get sent there. | uncast |
| `game.discs-rts.13g6tsd` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Yes, boss. Sorry, boss. | uncast |
| `game.discs-rts.1bh94pc` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Charge! | uncast |
| `game.discs-rts.1estap0` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Not again... | uncast |
| `game.discs-rts.1jeqbto` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Building! | uncast |
| `game.discs-rts.1lbc4zt` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Orders? | uncast |
| `game.discs-rts.1ma8kqa` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Hmm? | uncast |
| `game.discs-rts.1ms9un9` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | At your command! | uncast |
| `game.discs-rts.1n5co4r` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Shiny! | uncast |
| `game.discs-rts.1t6l6me` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | For Jack! | uncast |
| `game.discs-rts.1wnksyr` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Where's my hammer? | uncast |
| `game.discs-rts.2hsnaf` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Off we go! | uncast |
| `game.discs-rts.62pu3j` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Hammer time! | uncast |
| `game.discs-rts.6j0r3r` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Get 'em! | uncast |
| `game.discs-rts.6jb6zu` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Yes, my lord? | uncast |
| `game.discs-rts.9z7v9p` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Yum, berries! | uncast |
| `game.discs-rts.b4nun4` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | What now? | uncast |
| `game.discs-rts.bhhqaa` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Have at you! | uncast |
| `game.discs-rts.gvs70l` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Fine, FINE. | uncast |
| `game.discs-rts.iy9pf3` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Ready! | uncast |
| `game.discs-rts.khh47m` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Moving! | uncast |
| `game.discs-rts.oro0ae` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | I was on my break! | uncast |
| `game.discs-rts.r7n8i4` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Huzzah? | uncast |
| `game.discs-rts.rik4fp` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Do I have to? | uncast |
| `game.discs-rts.sv0ww2` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Chop chop! | uncast |
| `game.discs-rts.vditow` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | It'll be wonky. | uncast |
| `game.discs-rts.vvowt8` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | On my way! | uncast |
| `game.discs-rts.wgf5bj` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Digging! | uncast |
| `game.discs-rts.xbehri` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Huzzah! | uncast |
| `game.discs-rts.y5ni4c` | Game discs-rts unit | app/public/js/discs-rts.js:84 — In-game unit speech bubble; no cast voice assigned | Right-o! | uncast |
| `game.discs-squigs.102zm00` | Game discs-squigs unit | app/public/js/discs-squigs.js:528 — In-game unit speech bubble; no cast voice assigned | Hay! | uncast |
| `game.discs-squigs.111bqdd` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | I'm on it! | uncast |
| `game.discs-squigs.12vtsze` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:816 — In-game unit speech bubble; no cast voice assigned | Eat this! | uncast |
| `game.discs-squigs.133y5fg` | Game discs-squigs unit | app/public/js/discs-squigs.js:842 — In-game unit speech bubble; no cast voice assigned | Feed it? NO. | uncast |
| `game.discs-squigs.180esw8` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | I'm telling! | uncast |
| `game.discs-squigs.19okshn` | Game discs-squigs unit | app/public/js/discs-squigs.js:842 — In-game unit speech bubble; no cast voice assigned | Go on, little fella! | uncast |
| `game.discs-squigs.19rd8i6` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | My mouse is rubbish! | uncast |
| `game.discs-squigs.1adv9ko` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:816 — In-game unit speech bubble; no cast voice assigned | Incoming! | uncast |
| `game.discs-squigs.1bh94pc` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Charge! | uncast |
| `game.discs-squigs.1bjnir` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Should've brought the ULTRA 64! | uncast |
| `game.discs-squigs.1f7kgvi` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:816 — In-game unit speech bubble; no cast voice assigned | Take that! | uncast |
| `game.discs-squigs.1fsfqdl` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | Tell Mom... | uncast |
| `game.discs-squigs.1fvd1r1` | Game discs-squigs unit | app/public/js/discs-squigs.js:528 — In-game unit speech bubble; no cast voice assigned | Ow, my straw! | uncast |
| `game.discs-squigs.1gibda5` | Game discs-squigs unit | app/public/js/discs-squigs.js:788 — In-game unit speech bubble; no cast voice assigned | Get in! | uncast |
| `game.discs-squigs.1hz27ld` | Game discs-squigs unit | app/public/js/discs-squigs.js:788 — In-game unit speech bubble; no cast voice assigned | Flawless! | uncast |
| `game.discs-squigs.1mlbebx` | Game discs-squigs unit | app/public/js/discs-squigs.js:788, app/public/js/discs-squigs.js:2242 — In-game unit speech bubble; no cast voice assigned | Yesss! | uncast |
| `game.discs-squigs.1nm5m8w` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | Me teeth! | uncast |
| `game.discs-squigs.1qso553` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | Not fair! | uncast |
| `game.discs-squigs.1shyosa` | Game discs-squigs unit | app/public/js/discs-squigs.js:528 — In-game unit speech bubble; no cast voice assigned | Oof! | uncast |
| `game.discs-squigs.1tpsdks` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | Insert coin! | uncast |
| `game.discs-squigs.1ur7v5o` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | Game over, man! | uncast |
| `game.discs-squigs.1x1oidb` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:839 — In-game unit speech bubble; no cast voice assigned | Fire in the 'ole! | uncast |
| `game.discs-squigs.1x6ucv4` | Game discs-squigs unit | app/public/js/discs-squigs.js:1381 — In-game unit speech bubble; no cast voice assigned | Back on your feet, private! | uncast |
| `game.discs-squigs.21j6sn` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Right then! | uncast |
| `game.discs-squigs.4q7b6s` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | I'll be back! | uncast |
| `game.discs-squigs.6nqoah` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | Bye-bye! | uncast |
| `game.discs-squigs.7lf1uz` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | Mom! | uncast |
| `game.discs-squigs.7m9ej8` | Game discs-squigs unit | app/public/js/discs-squigs.js:723 — In-game unit speech bubble; no cast voice assigned | Noooo! | uncast |
| `game.discs-squigs.8b7x4u` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | Rude! | uncast |
| `game.discs-squigs.b2r5jv` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Is it my go? | uncast |
| `game.discs-squigs.d9rnly` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Wot? | uncast |
| `game.discs-squigs.eb5cqp` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Let's 'ave it! | uncast |
| `game.discs-squigs.ekgns2` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Blow on it! | uncast |
| `game.discs-squigs.eq1sso` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:816 — In-game unit speech bubble; no cast voice assigned | Fire! | uncast |
| `game.discs-squigs.hj1bpq` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Lag! | uncast |
| `game.discs-squigs.ir2dko` | Game discs-squigs unit | app/public/js/discs-squigs.js:517 — In-game unit speech bubble; no cast voice assigned | Glub! | uncast |
| `game.discs-squigs.khl65v` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:839 — In-game unit speech bubble; no cast voice assigned | Leg it! | uncast |
| `game.discs-squigs.l9evi6` | Game discs-squigs unit | app/public/js/discs-squigs.js:54 — In-game unit speech bubble; no cast voice assigned | Ow! | uncast |
| `game.discs-squigs.qfrfsa` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:531 — In-game unit speech bubble; no cast voice assigned | Ooyah! | uncast |
| `game.discs-squigs.qujhks` | Game discs-squigs unit | app/public/js/discs-squigs.js:54 — In-game unit speech bubble; no cast voice assigned | Oi! | uncast |
| `game.discs-squigs.sb1t1o` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Come on then! | uncast |
| `game.discs-squigs.sg8ho9` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:839 — In-game unit speech bubble; no cast voice assigned | Run awaaay! | uncast |
| `game.discs-squigs.t06obh` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | Is this on Ultra Entertainment? | uncast |
| `game.discs-squigs.tfo2cf` | Game discs-squigs unit | app/public/js/discs-squigs.js:54, app/public/js/discs-squigs.js:701 — In-game unit speech bubble; no cast voice assigned | 3D card or nothing! | uncast |
| `game.discs-squigs.uu5sbp` | Game discs-squigs unit | app/public/js/discs-squigs.js:842 — In-game unit speech bubble; no cast voice assigned | Off you pop! | uncast |
| `game.discs-squigs.uuy0rf` | Game discs-squigs unit | app/public/js/discs-squigs.js:804 — In-game unit speech bubble; no cast voice assigned | Pass! | uncast |
| `game.discs-squigs.xrr9o6` | Game discs-squigs unit | app/public/js/discs-squigs.js:528 — In-game unit speech bubble; no cast voice assigned | Ten points! | uncast |
| `game.discs-squigs.z548i5` | Game discs-squigs unit | app/public/js/discs-squigs.js:788 — In-game unit speech bubble; no cast voice assigned | Top score! | uncast |
| `game.rm-g-mon.fuseCollector.1yasms4` | game fuseCollector | app/public/js/rm-g-mon.js:610 — In-game character conversation (cast approval needed) | Starters change again at level 32! Even my magazine did not know that. | uncast |
| `game.rm-g-mon.fuseCollector.kwi9v1` | game fuseCollector | app/public/js/rm-g-mon.js:610 — In-game character conversation (cast approval needed) | My CASSETTICK evolved into BOOMBOXER. Now it demands six enormous batteries. | uncast |
| `game.rm-g-mon.fuseGuide.1wt8jc7` | game fuseGuide | app/public/js/rm-g-mon.js:609 — In-game character conversation (cast approval needed) | TEAM POCKET offered me a monthly pocket subscription. My trousers already have four. | uncast |
| `game.rm-g-mon.fuseGuide.790m9s` | game fuseGuide | app/public/js/rm-g-mon.js:609 — In-game character conversation (cast approval needed) | The central cable in our gym is safe. Win the SPARK BADGE and INSULATE makes outdoor cables safe too. | uncast |
| `game.rm-g-mon.kilnGuide.13hdzs4` | game kilnGuide | app/public/js/rm-g-mon.js:623 — In-game character conversation (cast approval needed) | They offered to sell it back in twelve easy payments. The cheek! | uncast |
| `game.rm-g-mon.kilnGuide.kifpan` | game kilnGuide | app/public/js/rm-g-mon.js:623 — In-game character conversation (cast approval needed) | The gym cannot open without its heating regulator. TEAM POCKET took it to the parcel depot in the southeast. | uncast |
| `game.rm-g-mon.nan.d3v5m3` | game nan | app/public/js/rm-g-mon.js:580 — In-game character conversation (cast approval needed) | NAN: Ooh, a visitor! Have a rock cake, dear. Mind your teeth, they're a bit... rocky. | uncast |
| `game.rm-g-mon.nan.h3euc5` | game nan | app/public/js/rm-g-mon.js:580 — In-game character conversation (cast approval needed) | NAN: When I was a girl, we didn't have critters. We had a GOBSTOPPA and we made it last a year. | uncast |
| `game.rm-g-mon.oldman.d9tmo0` | game oldman | app/public/js/rm-g-mon.js:514 — In-game character conversation (cast approval needed) | In my day we didn't have critters. We had a stick. And we were GRATEFUL for the stick. | uncast |
| `game.rm-g-mon.pondgirl.1ofttzq` | game pondgirl | app/public/js/rm-g-mon.js:516 — In-game character conversation (cast approval needed) | Muddy critters live by the pond in the WHISPERING WOODS. They hide in the reeds. | uncast |
| `game.rm-g-mon.radioRepair.dzoyiw` | game radioRepair | app/public/js/rm-g-mon.js:638 — In-game character conversation (cast approval needed) | RADIO REPAIR: Six new families live along PEG PATH. More live on SOCK MOOR and in LOST SOCK TUNNEL. | uncast |
| `game.rm-g-mon.radioRepair.xmw32d` | game radioRepair | app/public/js/rm-g-mon.js:638 — In-game character conversation (cast approval needed) | A quiet clock is hiding north of the big boulders at the tunnel exit. The clockmaker knows its secret. | uncast |
| `game.rm-g-mon.rockgirl.1mp93of` | game rockgirl | app/public/js/rm-g-mon.js:575 — In-game character conversation (cast approval needed) | A stick of rock with PEBBLE BAY written all the way through it! How do they DO that? | uncast |
| `game.rm-g-mon.sailorkid.1z0nzvw` | game sailorkid | app/public/js/rm-g-mon.js:574 — In-game character conversation (cast approval needed) | Ahoy! The sea round PEBBLE BAY is full of WELLYBOBS. They wash up after a storm. | uncast |
| `game.rm-g-mon.shop2girl.stlitk` | game shop2girl | app/public/js/rm-g-mon.js:579 — In-game character conversation (cast approval needed) | I came in for a stick of rock and left with six BERRY CAKES. Again. | uncast |
| `game.rm-g-mon.shopgirl.1y254me` | game shopgirl | app/public/js/rm-g-mon.js:526 — In-game character conversation (cast approval needed) | I'm saving up for a BIG CAKE. My critter is very greedy. | uncast |
| `game.rm-g-mon.tipgirl.9agew5` | game tipgirl | app/public/js/rm-g-mon.js:513 — In-game character conversation (cast approval needed) | Critters get tired after a scrap. When their HP bar goes red, throw a CRITTER CUBE! | uncast |
| `bark.gran.bye` | gran | Catalogue only; trigger not found — Gran leaving | Right, I'll be off. Be good for your mother. Ta ta! | yes |
| `bark.gran.coin` | gran | Catalogue only; trigger not found — Gran slips the player a coin | Here's a little something. Don't tell your mother. Spend it on something sensible. | yes |
| `bark.gran.hello` | gran | Catalogue only; trigger not found — Doorbell, Gran at the door | Hello, my darlings! It's only me! Don't get up! | yes |
| `bark.gran.hug` | gran | Catalogue only; trigger not found — Hallway | Give your Gran a cuddle! Let me look at you. Aren't you tall? | yes |
| `bark.gran.pc` | gran | Catalogue only; trigger not found — Bedroom, Gran sees the PC | Is that a typewriter with a television? Whatever next? | yes |
| `bark.gran.plant` | gran | Catalogue only; trigger not found — Gran sees the spider plant | Ah, my spider plant! You've kept it going. Good. It likes a chat. | yes |
| `bark.gran.tea` | gran | Catalogue only; trigger not found — Kitchen, Gran | I'll have a cup of tea. And a biscuit. Or three. | yes |
| `c4.mill.gran` | gran | Catalogue only; trigger not found — Gran on the phone, if the line is free | Happy New Year, my darlings! I've seen the fireworks on the television. Aren't they lovely? | yes |
| `c4.xmas.gran` | gran | Catalogue only; trigger not found — Gran arrives (20 to 24/12) | Hello, my darlings! Merry Christmas! Look at you all. You've grown a foot! | yes |
| `c4.xmas.gran2` | gran | Catalogue only; trigger not found — Gran, second line | I've brought mince pies and a bit of everything. And a little something for the stocking. | yes |
| `c4.xmas.gran3` | gran | Catalogue only; trigger not found — Gran about the PC | What's that? The internet? Does it do crosswords? | yes |
| `c4.xmas.gran4` | gran | Catalogue only; trigger not found — Gran about the console | A games machine? In my day we had a ball and a bit of string. And we were grateful. | yes |
| `phone.in.0.17arros` | gran | app/public/js/hs-life.js:89 — Incoming landline call; app/public/js/hs-life.js:89 | Hello love! It's Gran. Is your Mom there? ...No? Never mind. | missing |
| `phone.in.0.1fq2uuq` | gran | app/public/js/hs-life.js:89 — Incoming landline call; app/public/js/hs-life.js:89 | Are you still playing on that computer? Your Grandad says it'll make your eyes go square. | missing |
| `phone.in.0.1qgwsdv` | gran | app/public/js/hs-life.js:89 — Incoming landline call; app/public/js/hs-life.js:89 | Are you eating properly? You're still growing. I've knitted you a jumper. It's got a reindeer on it. | missing |
| `phone.in.0.reply.0.tcd887` | gran | app/public/js/hs-life.js:89 — Caller responds to player choice; app/public/js/hs-life.js:89 | Lovely. I'll send it in the post. Bye love! Bye! Bye bye! Bye! | missing |
| `phone.in.0.reply.1.isje3h` | gran | app/public/js/hs-life.js:89 — Caller responds to player choice; app/public/js/hs-life.js:89 | Ooh. Well, as long as you're happy. Love to your Mom. Bye love! Bye bye! | missing |
| `phone.out.01632960213.1c5kgqp` | gran | app/public/js/hs-life.js:174 — Outgoing landline call; app/public/js/hs-life.js:174 | Hello? Ooh, you never ring! Eating properly? Grandad says hello. HE SAYS HELLO. Bye, love! Bye! Bye bye! | missing |
| `hw.kids.18ptnro` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1101 — Halloween doorstep chorus / request; children have no assigned cast voices | Aww! ...TRICK, then! | uncast |
| `hw.kids.19qpo50` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1014 — Halloween doorstep request, including named/gendered child variants; casting pending | Can {dynamic} have two? It's {hwkid{dynamic}.his} first time! | uncast |
| `hw.kids.1v8bg0p` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1015 — Halloween doorstep request, including named/gendered child variants; casting pending | One each, please. {dynamic} can't have chocolate, it melts in {hwkid{dynamic}.his} gloves. | uncast |
| `hw.kids.cb3s61` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1016 — Halloween doorstep chorus / request; children have no assigned cast voices | One each, please! | uncast |
| `hw.kids.e1g1wa` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1016 — Halloween doorstep chorus / request; children have no assigned cast voices | TRICK... OR... TREAT! | uncast |
| `hw.kids.h2z53r` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1016 — Halloween doorstep chorus / request; children have no assigned cast voices | Treat or trick! ...TRICK OR TREAT! | uncast |
| `hw.kids.it8y74` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1015 — Halloween doorstep request, including named/gendered child variants; casting pending | One each, please. {dynamic} can't have nuts. | uncast |
| `hw.kids.lnjcc8` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1016 — Halloween doorstep chorus / request; children have no assigned cast voices | Trick or treat! Smell my feet! | uncast |
| `hw.kids.oanhzg` | Halloween trick-or-treaters | app/public/js/season-halloween.js:1016 — Halloween doorstep chorus / request; children have no assigned cast voices | TRICK OR TREAT! | uncast |
| `game.hearts.2.1032732` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Shuffle up, Jack. | uncast |
| `game.hearts.2.16o8qz6` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Well played, you lot. | uncast |
| `game.hearts.2.17sp6fc` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Ugh, hearts. | uncast |
| `game.hearts.2.19jw0xv` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Not ideal. | uncast |
| `game.hearts.2.1azjmdj` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Nice! | uncast |
| `game.hearts.2.1kfrp2r` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | I'll survive. | uncast |
| `game.hearts.2.1rgy724` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Oh, lovely. Thanks a LOT. | uncast |
| `game.hearts.2.1rqs7pn` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Cousin {cousin} wins again. Write it on the fridge. | uncast |
| `game.hearts.2.1soxlfx` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Hearts are broken, careful now. | uncast |
| `game.hearts.2.1tiapqj` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Cousin Kim wins again. Write it on the fridge. | uncast |
| `game.hearts.2.1uyc5aa` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Fine. I wanted thirteen points anyway. | uncast |
| `game.hearts.2.1xhsm8f` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | I've seen the new space film twice. Peapod Race is the best bit, no question. | uncast |
| `game.hearts.2.2q2nid` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Next time I'm not going easy on you. | uncast |
| `game.hearts.2.4ai378` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Ha, that was neat. | uncast |
| `game.hearts.2.5rb9wp` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Let's make this quick, I'm going to Tasha's at four. | uncast |
| `game.hearts.2.9iztcn` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Is this taking forever or is it just me? | uncast |
| `game.hearts.2.pkbcu1` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Ready when you are. | uncast |
| `game.hearts.2.uc9sc4` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Too easy. Rematch? | uncast |
| `game.hearts.2.vzx6jz` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | May the cards be with you. There, I said it. | uncast |
| `game.hearts.2.xehrvg` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Nice one. Remind me to get you back. | uncast |
| `game.hearts.2.y2rn47` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz keeps looking at my hand. | uncast |
| `game.hearts.2.zm0f2p` | Hearts cousin | app/public/js/games-cards.js:370 — Hearts opponent speech bubble; no cast voice assigned | Ouch. Sorry. Not sorry. | uncast |
| `game.hearts.1.100e0s9` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Called it. | uncast |
| `game.hearts.1.104j01b` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Hearts are broken! Everyone panic! | uncast |
| `game.hearts.1.11yuquy` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | My uncle taught me this. He works at the card factory. | uncast |
| `game.hearts.1.126slbd` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | That doesn't count, I wasn't trying. | uncast |
| `game.hearts.1.13zjc3m` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | I WON! I told you I was a pro. | uncast |
| `game.hearts.1.14zj2kf` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | I had a lightspatula that lit up. Mom took the batteries out. | uncast |
| `game.hearts.1.177lq45` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | NOOOO! Not the lady! | uncast |
| `game.hearts.1.182y0z5` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | That was me doing a Space Cadet mind trick on you. | uncast |
| `game.hearts.1.1ew2jkf` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Ha! Get in! | uncast |
| `game.hearts.1.1h0fdbt` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Thirteen points?! My mom will hear about this. | uncast |
| `game.hearts.1.1l4izng` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Whoa, red cards incoming. | uncast |
| `game.hearts.1.1ot1dfc` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Did you see the peapod race bit? I could totally drive one of those. | uncast |
| `game.hearts.1.1vxob1` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Undefeated champion of the world. Well, of Mom's kitchen. | uncast |
| `game.hearts.1.1w4hkm4` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Hearts? Pfft. I meant to do that. | uncast |
| `game.hearts.1.1xz388r` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Unlucky, mate. | uncast |
| `game.hearts.1.3pgmqq` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Hurry up, I want to watch the telly. | uncast |
| `game.hearts.1.45u5ng` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Oi! I was just holding those. | uncast |
| `game.hearts.1.5o4ee9` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | That's well unfair. I'm telling. | uncast |
| `game.hearts.1.8m5mv7` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Have you got the new space film sticker album? I need the peapod racer shiny. | uncast |
| `game.hearts.1.dbed4g` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | That one was a tactic. | uncast |
| `game.hearts.1.mhz2d7` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | This is worse than when the pod engine blew up. | uncast |
| `game.hearts.1.nvv6zw` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | The cards were rigged. | uncast |
| `game.hearts.1.td7yj` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Dave says he can do the voice. *ahem* "Win this hand, I will." | uncast |
| `game.hearts.1.tx9zag` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | I'm basically a pro at Hearts. | uncast |
| `game.hearts.1.v2iiyx` | Hearts Dave | app/public/js/games-cards.js:360 — Hearts opponent speech bubble; no cast voice assigned | Right. Watch and learn. | uncast |
| `game.hearts.3.10rjmtt` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz wants a laser sword. A double one, like the baddie in the film. | uncast |
| `game.hearts.3.131knj1` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz was letting you win. | uncast |
| `game.hearts.3.16586hg` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Good. Gubbinz likes that. | uncast |
| `game.hearts.3.16k6ztb` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | WAAAGH! Gubbinz wins! Where is Gubbinz's prize Twax? | uncast |
| `game.hearts.3.1e4wzls` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Ooh, red ones! | uncast |
| `game.hearts.3.1edjzl1` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | These cards smell of Wotsitz. | uncast |
| `game.hearts.3.1gvqlia` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz is gonna build a peapod racer out of the toaster. | uncast |
| `game.hearts.3.1if688s` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | All the red ones... into MY pile. Hmph. | uncast |
| `game.hearts.3.1s8n092` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | The pointy lady! Gubbinz is NOT happy. | uncast |
| `game.hearts.3.1vkkn56` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz collects hearts. Is that good? It is NOT good. | uncast |
| `game.hearts.3.8apwe2` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz saw a little green fella in the film. Not as green as Gubbinz. | uncast |
| `game.hearts.3.du89pw` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Is it Gubbinz's go? Is it now? Is it now? | uncast |
| `game.hearts.3.fok4b6` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Ha! Have a Blue Conch, that's what that was. | uncast |
| `game.hearts.3.irmy2z` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz can do a peapod race. Gubbinz just needs two engines and NO brakes. | uncast |
| `game.hearts.3.kp6spn` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | GUBBINZ IS THE BOSS! | uncast |
| `game.hearts.3.plnrgd` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Hehehe! | uncast |
| `game.hearts.3.q8yhek` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Can Gubbinz eat this card? No? Hmph. | uncast |
| `game.hearts.3.qedki3` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Error 404: fair play not found! | uncast |
| `game.hearts.3.rtl5c1` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | It looks like you're playing Hearts! Would you like help losing? | uncast |
| `game.hearts.3.zavgp` | Hearts Gubbinz | app/public/js/games-cards.js:380 — Hearts opponent speech bubble; no cast voice assigned | Gubbinz is gonna eat the score sheet. | uncast |
| `computer.sx-hunt.rrgp7f` | Hint line | app/public/js/sx-hunt.js:610 — Existing computer / fake-web spoken character; voice choice awaits Jack | Beep. Boop. You have reached the byte line. | uncast |
| `computer.sx-hunt.vh30h7` | Hint line | app/public/js/sx-hunt.js:603 — Existing computer / fake-web spoken character; voice choice awaits Jack | Echo. November. Golf. Alpha. Golf. Echo. Delta. | uncast |
| `computer.toolbars-bars.167zauw` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Why did the racing car paint itself red? Because red ones go faster! | uncast |
| `computer.toolbars-bars.1dm21um` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Why did the modem go to bed early? It was all worn out from the screeching. | uncast |
| `computer.toolbars-bars.1faiw7d` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. What do you call an Eggbert with no batteries? A keyring. | uncast |
| `computer.toolbars-bars.1fkxykp` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? A CD-ROM holds about 650 megabytes. That is 451 floppy disks! | uncast |
| `computer.toolbars-bars.1nozubc` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Why was the floppy disk sad? Nobody wanted to be its 1.44 MB-FF. | uncast |
| `computer.toolbars-bars.1on0jt6` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | Ooh, {dynamic}! Tell me more! | uncast |
| `computer.toolbars-bars.1owdgao` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Why did the Game Lad go to bed? Its batteries were flat. | uncast |
| `computer.toolbars-bars.1pr8njb` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Why did the computer go to the doctor? It had a virus! | uncast |
| `computer.toolbars-bars.1suy4zy` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? Blockology was invented in Moscow in 1984. | uncast |
| `computer.toolbars-bars.49fbqd` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | I don't know what that means but I LOVE it. | uncast |
| `computer.toolbars-bars.74ikkf` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? A floppy disk holds 1.44 megabytes. | uncast |
| `computer.toolbars-bars.ao5urw` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? There are 151 Pocket Critters. | uncast |
| `computer.toolbars-bars.gvh5gh` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. How many programmers does it take to change a light bulb? None, that is a hardware problem. | uncast |
| `computer.toolbars-bars.kegsd7` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? The Ultra 64 has 4 megabytes of memory. 8 with the Expansion Pouch! | uncast |
| `computer.toolbars-bars.si8rwm` | JackBuddy | app/public/js/toolbars-bars.js:317 — Existing computer / fake-web spoken character; voice choice awaits Jack | Did you know? Red ones go faster. Science. | uncast |
| `computer.toolbars-bars.v4sqgk` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | Pardon? My speakers are on mute. | uncast |
| `computer.toolbars-bars.vivlf4` | JackBuddy | app/public/js/toolbars-bars.js:316 — Existing computer / fake-web spoken character; voice choice awaits Jack | La la la, I live in your PC, it is warm in here, tee hee, la la la. | uncast |
| `computer.toolbars-bars.zbdexw` | JackBuddy | app/public/js/toolbars-bars.js:319 — Existing computer / fake-web spoken character; voice choice awaits Jack | That reminds me of a joke. Knock knock. Who is there? The Millennium Bug. The Millennium Bug who? Exactly, nobody knows. | uncast |
| `mud.archmage.10m8lya` | JackMUD Archmage Floppington | app/mods/md-people.js:119 — JackMUD NPC conversation; no cast voice assigned | Hmm? Oh. Hello. Forgive me, my crystal ball is... buffering. | uncast |
| `mud.archmage.169tnqv` | JackMUD Archmage Floppington | app/mods/md-people.js:122 — JackMUD NPC conversation; no cast voice assigned | Magic is just like computers. It works brilliantly until it doesn't, and nobody knows why. | uncast |
| `mud.archmage.19aqa9c` | JackMUD Archmage Floppington | app/mods/md-people.js:121 — JackMUD shopkeeper thanks; no cast voice assigned | Sparkly! | uncast |
| `mud.archmage.1o2gh04` | JackMUD Archmage Floppington | app/mods/md-people.js:121 — JackMUD shopkeeper thanks; no cast voice assigned | Mind the pointy end. | uncast |
| `mud.archmage.1qccfdw` | JackMUD Archmage Floppington | app/mods/md-people.js:120 — JackMUD NPC conversation; no cast voice assigned | Welcome, welcome. Mind the bottles. And mind Dave. | uncast |
| `mud.archmage.1rt9abd` | JackMUD Archmage Floppington | app/mods/md-people.js:122 — JackMUD NPC conversation; no cast voice assigned | My apprentice. He is... enthusiastic. He has set fire to the curtains four times. This week. | uncast |
| `mud.archmage.1vlbkb2` | JackMUD Archmage Floppington | app/mods/md-people.js:123 — JackMUD idle spoken words; silent actions excluded | In my day, spells loaded INSTANTLY. | uncast |
| `mud.archmage.1xqiw9i` | JackMUD Archmage Floppington | app/mods/md-people.js:121 — JackMUD shopkeeper thanks; no cast voice assigned | Use it wisely. | uncast |
| `mud.archmage.1yfryr0` | JackMUD Archmage Floppington | app/mods/md-people.js:123 — JackMUD idle spoken words; silent actions excluded | Come ON... | uncast |
| `mud.archmage.1ylqzjq` | JackMUD Archmage Floppington | app/mods/md-people.js:494 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | The Hourglass! My crystal ball... it's... it's LOADED! Instantly! Oh, wonderful, wonderful! I shall make you something special from it. There. A Wonder Wand. Absolutely no lag at all. | uncast |
| `mud.archmage.x6cii1` | JackMUD Archmage Floppington | app/mods/md-people.js:122 — JackMUD NPC conversation; no cast voice assigned | The Caves of Lag, up in the Grumbly Hills. There is a creature in there, the Great Buffer Beast, and it is slowing down ALL the magic in the realm. Spells take ages to load! It needs dealing with by someone level 8 or so. | uncast |
| `mud.bob.19qrrad` | JackMUD B0B the helper robot | app/mods/md-people.js:353 — JackMUD shopkeeper thanks; no cast voice assigned | BOOP. | uncast |
| `mud.bob.1a4geed` | JackMUD B0B the helper robot | app/mods/md-people.js:352 — JackMUD NPC conversation; no cast voice assigned | BEEP BOOP. GREETINGS, HUMAN. WOULD YOU LIKE A CUP OF TEA? I ALSO HAVE SNACKS. TYPE LIST. BEEP. | uncast |
| `mud.bob.1lw5mnw` | JackMUD B0B the helper robot | app/mods/md-people.js:353 — JackMUD shopkeeper thanks; no cast voice assigned | BEEP. ENJOY. | uncast |
| `mud.bob.586pxd` | JackMUD B0B the helper robot | app/mods/md-people.js:354 — JackMUD NPC conversation; no cast voice assigned | BEEP. MY TOOLBOX CONTAINS: 1 SPANNER (IF RETURNED), 4 BISCUITS, 1 PICTURE OF MY MOM (A TOASTER). | uncast |
| `mud.bob.5ap5yq` | JackMUD B0B the helper robot | app/mods/md-people.js:355 — JackMUD idle spoken words; silent actions excluded | BEEP BOOP. ALL SYSTEMS NORMAL. EXCEPT ANTENNA. AND THE TOILET. | uncast |
| `mud.bob.c1rzag` | JackMUD B0B the helper robot | app/mods/md-people.js:354 — JackMUD NPC conversation; no cast voice assigned | TEA IS THE FUEL OF ALL HUMANS. BEEP. | uncast |
| `mud.bob.cqv6hs` | JackMUD B0B the helper robot | app/mods/md-people.js:354 — JackMUD NPC conversation; no cast voice assigned | I AM B0B. THAT IS A ZERO, NOT AN O. COMMON MISTAKE. BEEP. | uncast |
| `mud.bob.uygzd5` | JackMUD B0B the helper robot | app/mods/md-people.js:353 — JackMUD shopkeeper thanks; no cast voice assigned | THANK YOU, HUMAN. | uncast |
| `mud.barnaby.1a7owye` | JackMUD Barnaby Brew | app/mods/md-people.js:89 — JackMUD NPC conversation; no cast voice assigned | Called it the Dial-Up Inn because people come in for five minutes and stay three hours. Ha! Get it? Like the internet! Ha! | uncast |
| `mud.barnaby.1bvrqz1` | JackMUD Barnaby Brew | app/mods/md-people.js:90 — JackMUD idle spoken words; silent actions excluded | Phone line's busy again. Someone's on the internet. | uncast |
| `mud.barnaby.1f6s0ev` | JackMUD Barnaby Brew | app/mods/md-people.js:88 — JackMUD shopkeeper thanks; no cast voice assigned | Enjoy! | uncast |
| `mud.barnaby.4767wj` | JackMUD Barnaby Brew | app/mods/md-people.js:87 — JackMUD NPC conversation; no cast voice assigned | Welcome to the Dial-Up Inn! Best chips in Baudby! Sit by the fire and REST, you'll mend twice as fast in here. Hungry? Type LIST. And have a look at the noticeboard: LOOK BOARD. | uncast |
| `mud.barnaby.i1vkfh` | JackMUD Barnaby Brew | app/mods/md-people.js:88 — JackMUD shopkeeper thanks; no cast voice assigned | Mind, the chips are hot! | uncast |
| `mud.barnaby.u3jlur` | JackMUD Barnaby Brew | app/mods/md-people.js:88 — JackMUD shopkeeper thanks; no cast voice assigned | On the house! No, wait, I just charged you. Never mind! | uncast |
| `mud.barnaby.wan5jo` | JackMUD Barnaby Brew | app/mods/md-people.js:90 — JackMUD idle spoken words; silent actions excluded | Who wants chips? Everyone wants chips! | uncast |
| `mud.barnaby.xqdll` | JackMUD Barnaby Brew | app/mods/md-people.js:89 — JackMUD NPC conversation; no cast voice assigned | They say there's a secret room somewhere in town, behind a poster. And there's a dragon up Mount Megabyte who's lost her save game. Poor lamb. | uncast |
| `mud.barnaby.yfnl4l` | JackMUD Barnaby Brew | app/mods/md-people.js:89 — JackMUD NPC conversation; no cast voice assigned | Triple-cooked. Well, I cook them once and then forget about them twice. | uncast |
| `mud.ted.1qs3kxr` | JackMUD Big Ted | app/mods/md-people.js:281 — JackMUD NPC conversation; no cast voice assigned | ZZZZZZZZZZ... *snort*... mmm... honey... ZZZZZZZZZZ | uncast |
| `mud.ted.1vkwjql` | JackMUD Big Ted | app/mods/md-people.js:285 — JackMUD idle spoken words; silent actions excluded | honey... honey... | uncast |
| `mud.ted.ogt85i` | JackMUD Big Ted | app/mods/md-people.js:452 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | *sniff sniff*... HONEY! Big Ted sits up, wide awake, and scoffs the whole jar in one go. "Mmmmm! Fank you! Oh, am I in the way? Sorry!" He shuffles aside. The way west is open! | uncast |
| `mud.ted.r7vo5c` | JackMUD Big Ted | app/mods/md-people.js:282 — JackMUD NPC conversation; no cast voice assigned | Big Ted gives you a big sticky bear hug. "Fanks for the honey!" | uncast |
| `mud.brunhilda.189xj2e` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:185 — JackMUD NPC conversation; no cast voice assigned | I cut keys and fix bike chains too. And once, a pram. | uncast |
| `mud.brunhilda.1cnkq8m` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:186 — JackMUD idle spoken words; silent actions excluded | Every hero needs a good dustbin lid! | uncast |
| `mud.brunhilda.1envmom` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:184 — JackMUD shopkeeper thanks; no cast voice assigned | GOOD CHOICE! | uncast |
| `mud.brunhilda.1o1zl1v` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:185 — JackMUD NPC conversation; no cast voice assigned | A better weapon means bigger whacks! Look at the damage numbers in my LIST. A dagger does 2 to 5. A longsword does 4 to 9! | uncast |
| `mud.brunhilda.1tskjlu` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:185 — JackMUD NPC conversation; no cast voice assigned | Armour stops monsters hitting you so hard! Wear something on every bit: head, body, feet, hands, a shield. It all adds up. | uncast |
| `mud.brunhilda.1v1d5ae` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:184 — JackMUD shopkeeper thanks; no cast voice assigned | Mind the edge! | uncast |
| `mud.brunhilda.2uesf6` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:184 — JackMUD shopkeeper thanks; no cast voice assigned | Bring it back if it bends! (It won't bend.) | uncast |
| `mud.brunhilda.cfq1z8` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:184 — JackMUD shopkeeper thanks; no cast voice assigned | Wield it with PRIDE! | uncast |
| `mud.brunhilda.tfw2hl` | JackMUD Brunhilda the blacksmith | app/mods/md-people.js:183 — JackMUD NPC conversation; no cast voice assigned | HELLO THERE! Need something to bonk with? Or something to stop you getting bonked? Have a look: LIST! Bigger swords are for bigger heroes, mind. | uncast |
| `mud.callum.110fmnh` | JackMUD Callum | app/mods/md-people.js:177 — JackMUD NPC conversation; no cast voice assigned | Look at the poster on the back wall. Look at it properly. I'm not saying anything else. (SEARCH, maybe.) | uncast |
| `mud.callum.13wxvkn` | JackMUD Callum | app/mods/md-people.js:177 — JackMUD NPC conversation; no cast voice assigned | PC is better than consoles. I've got a 3D card. Everything looks AMAZING. Well, it does when it works. | uncast |
| `mud.callum.1hpp2qk` | JackMUD Callum | app/mods/md-people.js:178 — JackMUD idle spoken words; silent actions excluded | COME ON. 5%... | uncast |
| `mud.callum.1ogns1j` | JackMUD Callum | app/mods/md-people.js:177 — JackMUD NPC conversation; no cast voice assigned | I designed the Old Server Room. It's well hard. The Millennium Bug is level 18. You'll want a whole party. And a bard. Seriously, bring a bard. | uncast |
| `mud.callum.1va95sx` | JackMUD Callum | app/mods/md-people.js:178 — JackMUD idle spoken words; silent actions excluded | Who knows a cheat for infinite lives? Asking for a friend. | uncast |
| `mud.callum.24zg5` | JackMUD Callum | app/mods/md-people.js:177 — JackMUD NPC conversation; no cast voice assigned | If she picks up the phone while I'm connected, I lose everything. EVERYTHING. | uncast |
| `mud.callum.ilnwl0` | JackMUD Callum | app/mods/md-people.js:176 — JackMUD NPC conversation; no cast voice assigned | Still downloading. 4%. Hey: you know every MUD has secrets? Admins hide stuff everywhere. This café, for a start. | uncast |
| `mud.callum.qbavkt` | JackMUD Callum | app/mods/md-people.js:175 — JackMUD NPC conversation; no cast voice assigned | Shh, I'm downloading something. 3%. It's going to take two hours. My mom needs the phone in ten minutes. This is going to be close. | uncast |
| `mud.pete.17csct4` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:301 — JackMUD NPC conversation; no cast voice assigned | Squidgy! The Kraken's little cousin! Lives in the grotto under the cove. Pinches our dinner every night. Old Barnacle Bill down there's had enough of him. | uncast |
| `mud.pete.1fyzbmn` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:302 — JackMUD idle spoken words; silent actions excluded | Polly... | uncast |
| `mud.pete.1gnkf1z` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:478 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | ARRR! Grandad's chest! Let's see... gold! Doubloons! And... his old hat! You keep the hat, matey. And a share of the gold. Fair's fair! | uncast |
| `mud.pete.1hsbmmh` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:470 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | POLLY! Me beautiful bird! Arrr, I'll never forget your cracker again, I promise! You, matey, have done me a great service. Here: me grandad's treasure map. A pirate always pays his debts! | uncast |
| `mud.pete.1me01l1` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:299 — JackMUD NPC conversation; no cast voice assigned | Arrr. Ahoy there, matey. | uncast |
| `mud.pete.2wpfmi` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:301 — JackMUD NPC conversation; no cast voice assigned | Arrr. There be treasure on this island, buried long ago by me grandad. I've got the map. But a pirate don't go treasure hunting without his parrot, see. | uncast |
| `mud.pete.j4qj4o` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:300 — JackMUD NPC conversation; no cast voice assigned | Arrr! There be my favourite landlubber! Sit down, have a marshmallow! | uncast |
| `mud.pete.k09qml` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:301 — JackMUD NPC conversation; no cast voice assigned | Lost me leg to a shark. No, I tell a lie. It was a skateboard. | uncast |
| `mud.pete.sr79tc` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:302 — JackMUD idle spoken words; silent actions excluded | Arrr. | uncast |
| `mud.pete.y5qxvz` | JackMUD Captain Pegleg Pete | app/mods/md-people.js:301 — JackMUD NPC conversation; no cast voice assigned | My Polly! Flew off when I forgot her cracker. I bet she's up the lighthouse, sulking. She sulks up there. | uncast |
| `mud.nova.12sqwn8` | JackMUD Commander Nova | app/mods/md-people.js:346 — JackMUD NPC conversation; no cast voice assigned | Our antenna's broken. Something keeps unscrewing the bolts: those meteorite gremlins. Without the antenna, we can't talk to Earth. I can't even ring my mom. | uncast |
| `mud.nova.1fp1n65` | JackMUD Commander Nova | app/mods/md-people.js:347 — JackMUD idle spoken words; silent actions excluded | Houston, we have a... oh, never mind. | uncast |
| `mud.nova.1j4kwv3` | JackMUD Commander Nova | app/mods/md-people.js:346 — JackMUD NPC conversation; no cast voice assigned | B0B makes the tea. And fixes things. Mostly the tea. | uncast |
| `mud.nova.1xsdm3b` | JackMUD Commander Nova | app/mods/md-people.js:346 — JackMUD NPC conversation; no cast voice assigned | Best job in the universe. Apart from the toilets. Don't ask about the toilets. | uncast |
| `mud.nova.a63b4` | JackMUD Commander Nova | app/mods/md-people.js:345 — JackMUD NPC conversation; no cast voice assigned | Rookie! Good to see you. Station's running sweet as a nut. | uncast |
| `mud.nova.iklmy5` | JackMUD Commander Nova | app/mods/md-people.js:346 — JackMUD NPC conversation; no cast voice assigned | Take the shuttle from the Docking Bay. The Moon Mice need help, I hear. Something huge is eating the Moon. | uncast |
| `mud.nova.l7trme` | JackMUD Commander Nova | app/mods/md-people.js:521 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | We've got signal! I can ring my mom! You, rookie, are a STAR. A real one. Keep the helmet. And take this: the Cosmic Bow. A moonbeam for a string. Pretty fancy, eh? | uncast |
| `mud.nova.p5mhtw` | JackMUD Commander Nova | app/mods/md-people.js:344 — JackMUD NPC conversation; no cast voice assigned | Welcome aboard Orbital Station 99, rookie! Please hold a handrail. We have a problem. | uncast |
| `mud.dave.17xkgmb` | JackMUD Dave the apprentice | app/mods/md-people.js:130 — JackMUD NPC conversation; no cast voice assigned | Page one's at the Academy library, I think. Page two went down a drain (don't ask). Page three... the fairy in the woods took it. She said it was 'rubbish spelling'. Cheek. | uncast |
| `mud.dave.1erwp4q` | JackMUD Dave the apprentice | app/mods/md-people.js:131 — JackMUD idle spoken words; silent actions excluded | Does anyone know a spell for un-burning things? | uncast |
| `mud.dave.1un3015` | JackMUD Dave the apprentice | app/mods/md-people.js:130 — JackMUD NPC conversation; no cast voice assigned | Jack built this whole MUD. On his own. In his bedroom. I helped! I did the sewers. And the socks. You're welcome. | uncast |
| `mud.dave.6ovruh` | JackMUD Dave the apprentice | app/mods/md-people.js:436 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | MY PAGES! You absolute legend! I'm saved! Here, have my old hat. It's only been on fire twice. Don't tell the Archmage. | uncast |
| `mud.dave.79nhwg` | JackMUD Dave the apprentice | app/mods/md-people.js:129 — JackMUD NPC conversation; no cast voice assigned | Alright? The curtain's fine now. Mostly. | uncast |
| `mud.dave.7k1or` | JackMUD Dave the apprentice | app/mods/md-people.js:130 — JackMUD NPC conversation; no cast voice assigned | I made the sewers! Ace, aren't they? The smell was my idea. | uncast |
| `mud.dave.seuh6p` | JackMUD Dave the apprentice | app/mods/md-people.js:128 — JackMUD NPC conversation; no cast voice assigned | Oh! Hiya! Don't tell the Archmage about the curtain. Listen, I'm in BIG trouble. I've lost three pages of my spellbook and he's going to test me on them on Friday. Can you help? | uncast |
| `mud.dave.taosed` | JackMUD Dave the apprentice | app/mods/md-people.js:130 — JackMUD NPC conversation; no cast voice assigned | It's NOT a fire. It's a very warm light spell. | uncast |
| `mud.dave.y1hing` | JackMUD Dave the apprentice | app/mods/md-people.js:130 — JackMUD NPC conversation; no cast voice assigned | Goldenballs. Four player. Facility. No Oddbob. Those are the rules. | uncast |
| `mud.dave.ze5jm6` | JackMUD Dave the apprentice | app/mods/md-people.js:131 — JackMUD idle spoken words; silent actions excluded | My mom's picking me up at six. What time is it now? | uncast |
| `mud.countdown.170opnx` | JackMUD Dr Countdown | app/mods/md-people.js:224 — JackMUD NPC conversation; no cast voice assigned | TEN! NINE! Oh, hello. Want to go to SPACE? Of course you do! Everyone does! But only proper astronauts can fly the Starhopper 99. You'll need to pass my Astronaut Exam. Three questions about space. Ready? | uncast |
| `mud.countdown.17jrlib` | JackMUD Dr Countdown | app/mods/md-people.js:227 — JackMUD idle spoken words; silent actions excluded | Ten, nine, eight... | uncast |
| `mud.countdown.1e3z3l0` | JackMUD Dr Countdown | app/mods/md-people.js:226 — JackMUD NPC conversation; no cast voice assigned | You can find the answers in any good space book. Or ask a grown-up. Or the owl. He knows everything. | uncast |
| `mud.countdown.1iuiyr` | JackMUD Dr Countdown | app/mods/md-people.js:225 — JackMUD NPC conversation; no cast voice assigned | Hello again, astronaut! The Starhopper is fuelled and ready. Just BOARD her! | uncast |
| `mud.countdown.1lk6s94` | JackMUD Dr Countdown | app/mods/md-people.js:227 — JackMUD idle spoken words; silent actions excluded | Fuel... check. Snacks... CHECK. | uncast |
| `mud.countdown.1ozwzas` | JackMUD Dr Countdown | app/mods/md-people.js:226 — JackMUD NPC conversation; no cast voice assigned | Orbital Station 99! Commander Nova runs it. Lovely woman. Bit stressed. Something about an antenna. | uncast |
| `mud.countdown.bv8lul` | JackMUD Dr Countdown | app/mods/md-people.js:226 — JackMUD NPC conversation; no cast voice assigned | You can get a shuttle from the station to the Moon! Which, I can confirm scientifically, is made of cheese. | uncast |
| `mud.countdown.ghgngx` | JackMUD Dr Countdown | app/mods/md-people.js:227 — JackMUD idle spoken words; silent actions excluded | One small step for a hero! | uncast |
| `mud.countdown.zg6hn2` | JackMUD Dr Countdown | app/mods/md-people.js:226 — JackMUD NPC conversation; no cast voice assigned | Starhopper 99! Runs on Fizz Pop. Well, rocket fuel. But mostly Fizz Pop. | uncast |
| `mud.giles.13ori79` | JackMUD Farmer Giles | app/mods/md-people.js:210 — JackMUD NPC conversation; no cast voice assigned | Four of 'em. Evil, they are. They chase the post lady. They chase the cows. They chased the TRACTOR. | uncast |
| `mud.giles.1fxkwqb` | JackMUD Farmer Giles | app/mods/md-people.js:211 — JackMUD idle spoken words; silent actions excluded | Ooh-arr. | uncast |
| `mud.giles.1kl276l` | JackMUD Farmer Giles | app/mods/md-people.js:210 — JackMUD NPC conversation; no cast voice assigned | That rocket lot at the Range. Woke the cows up at four in the morning doing a countdown. TEN. NINE. Ooh-arr. | uncast |
| `mud.giles.1qyj4es` | JackMUD Farmer Giles | app/mods/md-people.js:209 — JackMUD NPC conversation; no cast voice assigned | Ooh-arr. Nice day for it. | uncast |
| `mud.giles.3i25bn` | JackMUD Farmer Giles | app/mods/md-people.js:210 — JackMUD NPC conversation; no cast voice assigned | Them hives at the orchard are mine. Take a jar of honey if you need one. Bees won't mind. Well, they will. But you can outrun a bee. | uncast |
| `mud.giles.chfuxu` | JackMUD Farmer Giles | app/mods/md-people.js:210 — JackMUD NPC conversation; no cast voice assigned | Been farming here forty year. Sheep, hens, turnips. Some of the turnips have got a bit big lately. Walk about on their own, they do. | uncast |
| `mud.giles.f0p2wy` | JackMUD Farmer Giles | app/mods/md-people.js:417 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | Ooh-arr! Peace and quiet at last! You're a proper hero, you are. Here, take my spare wellies. Geese can't peck through these. | uncast |
| `mud.giles.g2l603` | JackMUD Farmer Giles | app/mods/md-people.js:208 — JackMUD NPC conversation; no cast voice assigned | Ooh-arr. You look handy. | uncast |
| `mud.flicker.1nccd42` | JackMUD Flicker the fairy | app/mods/md-people.js:243 — JackMUD NPC conversation; no cast voice assigned | Fairy rings are where fairies dance at midnight. Don't step in it. Well, you can step in it. It just tickles. | uncast |
| `mud.flicker.6gbhps` | JackMUD Flicker the fairy | app/mods/md-people.js:243 — JackMUD NPC conversation; no cast voice assigned | That boy cannot spell. I'm not even sorry. | uncast |
| `mud.flicker.iyj210` | JackMUD Flicker the fairy | app/mods/md-people.js:242 — JackMUD NPC conversation; no cast voice assigned | Oh. Hello, big person. I'm reading. Are you going to be loud? Big people are always loud. | uncast |
| `mud.flicker.o119jm` | JackMUD Flicker the fairy | app/mods/md-people.js:243 — JackMUD NPC conversation; no cast voice assigned | It's about a boy wizard. No, not Dave. A different boy. It's quite good actually. | uncast |
| `mud.flicker.wd85n1` | JackMUD Flicker the fairy | app/mods/md-people.js:244 — JackMUD idle spoken words; silent actions excluded | Shush, I'm at a good bit. | uncast |
| `mud.floppitha.1ct2daz` | JackMUD Floppitha the dragon | app/mods/md-people.js:336 — JackMUD NPC conversation; no cast voice assigned | This month's has a cover disk! I love a cover disk. | uncast |
| `mud.floppitha.1k5e141` | JackMUD Floppitha the dragon | app/mods/md-people.js:336 — JackMUD NPC conversation; no cast voice assigned | Oh, the gold is just for sitting on. It's comfy. The floppies are the real treasure. | uncast |
| `mud.floppitha.1p8agab` | JackMUD Floppitha the dragon | app/mods/md-people.js:336 — JackMUD NPC conversation; no cast voice assigned | I only breathe fire on toast these days. And birthday candles. | uncast |
| `mud.floppitha.iu7ihk` | JackMUD Floppitha the dragon | app/mods/md-people.js:337 — JackMUD idle spoken words; silent actions excluded | Oh, these new games. Back in my day you had to TYPE everything. | uncast |
| `mud.floppitha.jjt4qe` | JackMUD Floppitha the dragon | app/mods/md-people.js:335 — JackMUD NPC conversation; no cast voice assigned | Ah, my dear friend! Do sit down. Mind the gold, it's slippery. | uncast |
| `mud.floppitha.p67kw1` | JackMUD Floppitha the dragon | app/mods/md-people.js:334 — JackMUD NPC conversation; no cast voice assigned | Oh! A little hero! Don't be frightened, dear, I haven't eaten anyone since 1742. | uncast |
| `mud.floppitha.vnpwtt` | JackMUD Floppitha the dragon | app/mods/md-people.js:502 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | MY SAVE GAME! Oh, you wonderful, wonderful little hero! I can finally finish my adventure! Here: one of my old scales, made into a shield. And you shall be known as a Friend of Dragons, forever. | uncast |
| `mud.floppitha.yx39a6` | JackMUD Floppitha the dragon | app/mods/md-people.js:336 — JackMUD NPC conversation; no cast voice assigned | My save game. Two hundred years in the same adventure game, and I'd nearly finished it! I took it to the Caves of Lag to show the crystal crabs (they love a floppy disk) and I dropped it in the Crystal Grotto. Somewhere among the crystals. | uncast |
| `mud.gus.1jaseq3` | JackMUD Gloomy Gus the ferryman | app/mods/md-people.js:318 — JackMUD NPC conversation; no cast voice assigned | Nine years. Not a nibble. I think there aren't any fish. I think there never were. | uncast |
| `mud.gus.41rrzx` | JackMUD Gloomy Gus the ferryman | app/mods/md-people.js:319 — JackMUD idle spoken words; silent actions excluded | Lovely day for it. Not that you can tell, in a cave. | uncast |
| `mud.gus.fjba99` | JackMUD Gloomy Gus the ferryman | app/mods/md-people.js:317 — JackMUD NPC conversation; no cast voice assigned | Oh. Hello. I suppose you want to go across. Everyone wants to go across. Nobody wants to stay and chat. Five gold a trip. Type PAY and I'll row you. Not that it matters. | uncast |
| `mud.gus.j05mmv` | JackMUD Gloomy Gus the ferryman | app/mods/md-people.js:318 — JackMUD NPC conversation; no cast voice assigned | The tunnel on the island goes down to where the goblins live. And the Beast. Big spinning thing. Makes everything slow. Makes my rowing slow. Makes my fishing... the same, really. | uncast |
| `mud.gus.yz8x20` | JackMUD Gloomy Gus the ferryman | app/mods/md-people.js:318 — JackMUD NPC conversation; no cast voice assigned | Very deep. Very dark. Very still. Like my soul. Ha. Ha. (That was a joke.) | uncast |
| `mud.granny.12tuuho` | JackMUD Granny Byte | app/mods/md-people.js:236 — JackMUD NPC conversation; no cast voice assigned | Pixel loves climbing. She went off chasing a squirrel and I heard her mewing from somewhere up high. Up very high. | uncast |
| `mud.granny.13xvb7o` | JackMUD Granny Byte | app/mods/md-people.js:234 — JackMUD NPC conversation; no cast voice assigned | Oh, hello, dear. Come in, come in. Have a cookie. I'm sorry, I'm in a bit of a state. My little kitten, Pixel, has gone and got herself lost. | uncast |
| `mud.granny.1g89vbu` | JackMUD Granny Byte | app/mods/md-people.js:387 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | PIXEL! Oh, my little Pixel! Oh, thank you, thank you! You must have a cookie. No, three cookies! | uncast |
| `mud.granny.1jj6qkh` | JackMUD Granny Byte | app/mods/md-people.js:235 — JackMUD NPC conversation; no cast voice assigned | Hello, dear! Cookie? Of course you do. | uncast |
| `mud.granny.1oden6d` | JackMUD Granny Byte | app/mods/md-people.js:236 — JackMUD NPC conversation; no cast voice assigned | I'm in three chat rooms! A knitting one, a crossword one, and one about the Millennium Bug. Very lively, that one. LOL, as the young people say. | uncast |
| `mud.granny.b20h8q` | JackMUD Granny Byte | app/mods/md-people.js:237 — JackMUD idle spoken words; silent actions excluded | LOL. | uncast |
| `mud.granny.d72fcr` | JackMUD Granny Byte | app/mods/md-people.js:236 — JackMUD NPC conversation; no cast voice assigned | Chocolate chip. My secret recipe. The secret is more chocolate. | uncast |
| `mud.granny.d9eri5` | JackMUD Granny Byte | app/mods/md-people.js:236 — JackMUD NPC conversation; no cast voice assigned | It's a scarf for my grandson. It's twelve feet long. He's a growing lad. | uncast |
| `mud.headmistress.129sere` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:47 — JackMUD NPC conversation; no cast voice assigned | Off you go, then. The world won't save itself. | uncast |
| `mud.headmistress.1cnny9a` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:48 — JackMUD NPC conversation; no cast voice assigned | Baudby is south, through the gates. Market Square is the middle. Mind the geese. | uncast |
| `mud.headmistress.63qmfg` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:378 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | Well, well. All your lessons, done. I am VERY proud of you. Here is your diploma. Baudby is south of the gates. Go and be marvellous. | uncast |
| `mud.headmistress.9o786o` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:48 — JackMUD NPC conversation; no cast voice assigned | The Academy has trained heroes since 1066. Well, 1986. One of those. | uncast |
| `mud.headmistress.o8pst2` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:48 — JackMUD NPC conversation; no cast voice assigned | Every graduate gets a diploma. Show it to anyone who doubts you. | uncast |
| `mud.headmistress.zcfwom` | JackMUD Headmistress Hexadecimal | app/mods/md-people.js:46 — JackMUD NPC conversation; no cast voice assigned | Ah. A new student. Welcome to the Adventurers' Academy. Do your lessons, and come back to me when you are done. Your QUESTS journal tells you what is left. | uncast |
| `mud.jackk.1d8t1a6` | JackMUD JackK | app/mods/md-people.js:153 — JackMUD NPC conversation; no cast voice assigned | I draw maps of everything. My bedroom. The school. Callum says it's weird. It's not weird, it's CARTOGRAPHY. | uncast |
| `mud.jackk.1jzzb3n` | JackMUD JackK | app/mods/md-people.js:153 — JackMUD NPC conversation; no cast voice assigned | The Isle of Spam! Beach, palm trees, crab rocks, a lighthouse, a pirate camp. Squidgy lives in the grotto under the cove. He's level 9, so don't go in on your own. | uncast |
| `mud.jackk.1l35m6` | JackMUD JackK | app/mods/md-people.js:153 — JackMUD NPC conversation; no cast voice assigned | Pete's got a treasure map, but he won't give it to anyone till he gets his parrot back. Polly's always flying off to the lighthouse. | uncast |
| `mud.jackk.e09v5m` | JackMUD JackK | app/mods/md-people.js:153 — JackMUD NPC conversation; no cast voice assigned | Yeah, there's two of us. I'm JackK. He's Jack. It's fine. It's been fine since Year 7. | uncast |
| `mud.jackk.q0431z` | JackMUD JackK | app/mods/md-people.js:154 — JackMUD idle spoken words; silent actions excluded | Has anyone got a sharpener? | uncast |
| `mud.jackk.z9flwd` | JackMUD JackK | app/mods/md-people.js:152 — JackMUD NPC conversation; no cast voice assigned | Alright! You been to the Isle of Spam yet? I made it! Go down to the docks and get on the Soggy Biscuit. Captain Pete's lost his parrot. And there's TREASURE. | uncast |
| `mud.bunnyking.1fkdh8b` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:218 — JackMUD NPC conversation; no cast voice assigned | The Royal Golden Carrot! Our ancestors have guarded it for 300 years! It was pinched by a CROW! | uncast |
| `mud.bunnyking.1rhor5i` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:426 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | OUR CARROT! Oh, joy! Oh, rapture! Let it be known throughout the warren: this hero is a FRIEND OF THE RABBITS! | uncast |
| `mud.bunnyking.1sce2fy` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:217 — JackMUD NPC conversation; no cast voice assigned | Welcome back, our most loyal friend! Have a lettuce. | uncast |
| `mud.bunnyking.1st20b` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:218 — JackMUD NPC conversation; no cast voice assigned | It slides down our ear. We are used to it. | uncast |
| `mud.bunnyking.meap27` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:218 — JackMUD NPC conversation; no cast voice assigned | Wicked, shiny-stealing birds. They hang about in the meadow. | uncast |
| `mud.bunnyking.y6nzct` | JackMUD King Bartholomew the Fluffy | app/mods/md-people.js:216 — JackMUD NPC conversation; no cast voice assigned | A visitor! To our royal warren! We are most honoured. We are also most UPSET. | uncast |
| `mud.bookworm.1fwnfss` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | I have read every one. Well. Eaten. Same thing. | uncast |
| `mud.bookworm.1qt4x9q` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | A page from a spellbook? Something like that fell out of a book on the top shelf... have a SEARCH round here. | uncast |
| `mud.bookworm.1sc8mnt` | JackMUD Librarian Bookworm | app/mods/md-people.js:41 — JackMUD idle spoken words; silent actions excluded | Shhhh! | uncast |
| `mud.bookworm.1u465fd` | JackMUD Librarian Bookworm | app/mods/md-people.js:38 — JackMUD NPC conversation; no cast voice assigned | Ahem. Welcome to the library. Shhh. Two things every hero should know. One: type HELP whenever you are stuck. HELP NEWBIE is a good start. Two: type QUESTS to see your quest journal, so you always know what to do next. Questions? ASK me ABOUT something. Quietly. | uncast |
| `mud.bookworm.az4sfu` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | People need help all over Baudby. TALK to them. A yellow ! on your MAP means someone is there to talk to. | uncast |
| `mud.bookworm.e5f4qh` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | Spellbooks are kept at the Wizards' Tower, on Guild Row. | uncast |
| `mud.bookworm.htgns9` | JackMUD Librarian Bookworm | app/mods/md-people.js:39 — JackMUD NPC conversation; no cast voice assigned | Shhh. HELP and QUESTS, dear student. HELP and QUESTS. | uncast |
| `mud.bookworm.lqszu1` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | HELP shows all the commands. HELP and a word explains it: HELP FIGHTING, HELP SHOPS, HELP PARTY. The best book in this library, frankly. | uncast |
| `mud.bookworm.pznc1z` | JackMUD Librarian Bookworm | app/mods/md-people.js:40 — JackMUD NPC conversation; no cast voice assigned | It is for RESEARCH. Somebody is on level nine of the falling blocks game. I am pretending I have not noticed. | uncast |
| `mud.luke.18ucz9a` | JackMUD Luke | app/mods/md-people.js:169 — JackMUD NPC conversation; no cast voice assigned | Jack's made a MUD! I made this arcade bit. And the Guess-O-Tron. And the sticky carpet (not on purpose). | uncast |
| `mud.luke.1dk2vto` | JackMUD Luke | app/mods/md-people.js:168 — JackMUD NPC conversation; no cast voice assigned | Hey! Wanna go on the racer? I bet I win. I always win. | uncast |
| `mud.luke.1eh0blv` | JackMUD Luke | app/mods/md-people.js:167 — JackMUD NPC conversation; no cast voice assigned | Oh, hey! Want a challenge? Nobody's ever beaten the Guess-O-Tron in this town. It thinks of a number between 1 and 100 and you get seven guesses. Beat it and bring me the prize ticket! | uncast |
| `mud.luke.1ksh59o` | JackMUD Luke | app/mods/md-people.js:409 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | NO WAY! You actually beat it! Nobody's beaten it since I programmed it! That's well good. Here, have this, I won it off the claw machine. | uncast |
| `mud.luke.4azfcv` | JackMUD Luke | app/mods/md-people.js:169 — JackMUD NPC conversation; no cast voice assigned | Callum's always in the café. PC this, PC that. He says his computer does 3D now. Big deal. Mine plugs into the telly. | uncast |
| `mud.luke.542974` | JackMUD Luke | app/mods/md-people.js:170 — JackMUD idle spoken words; silent actions excluded | Who wants a go on the racer? Winner stays on! | uncast |
| `mud.luke.6o0z8a` | JackMUD Luke | app/mods/md-people.js:169 — JackMUD NPC conversation; no cast voice assigned | ULTRA 64 is the best console ever made. FACT. Marlo 64, Zeldo, Goldenballs, Kart Kaos. What else do you need? | uncast |
| `mud.luke.cfkx70` | JackMUD Luke | app/mods/md-people.js:169 — JackMUD NPC conversation; no cast voice assigned | Type PLAY to start. Then GUESS a number. It says HIGHER or LOWER. Seven goes. Top tip: start in the middle. | uncast |
| `mud.luke.w1ozv2` | JackMUD Luke | app/mods/md-people.js:170 — JackMUD idle spoken words; silent actions excluded | Ultra 64, man. Sixty. Four. BITS. | uncast |
| `mud.inventoria.10snskv` | JackMUD Madame Inventoria | app/mods/md-people.js:24 — JackMUD NPC conversation; no cast voice assigned | Type INV to see what you are carrying. You can carry 24 things. Then you have to sell something. Or drop it. Not on my floor, please. | uncast |
| `mud.inventoria.11ouf3t` | JackMUD Madame Inventoria | app/mods/md-people.js:24 — JackMUD NPC conversation; no cast voice assigned | Armour makes monsters hit you less. Look for helmets, jumpers, shields and boots. Brunhilda at Sticks n Swords in town sells all sorts. | uncast |
| `mud.inventoria.1w78kdr` | JackMUD Madame Inventoria | app/mods/md-people.js:25 — JackMUD idle spoken words; silent actions excluded | Has anybody seen my glasses? | uncast |
| `mud.inventoria.3u2iwl` | JackMUD Madame Inventoria | app/mods/md-people.js:23 — JackMUD NPC conversation; no cast voice assigned | GET, DROP, WEAR, WIELD, REMOVE, INV, EQ. That is all there is to it, dear. Oh, and EAT and DRINK, for when you are peckish. | uncast |
| `mud.inventoria.t24446` | JackMUD Madame Inventoria | app/mods/md-people.js:22 — JackMUD NPC conversation; no cast voice assigned | Welcome to the Hall of Things, dear. Everything you carry is your INVENTORY: type INV, or just I. What you wear and hold is your EQUIPMENT: type EQ. To pick things up, GET them. To use a sword, WIELD it. To put on a hat, WEAR it. WEAR ALL puts on everything you can. Easy as pie. | uncast |
| `mud.inventoria.wxxb0` | JackMUD Madame Inventoria | app/mods/md-people.js:24 — JackMUD NPC conversation; no cast voice assigned | ...Have you seen my glasses? | uncast |
| `mud.mayor.1d64ge8` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:97 — JackMUD NPC conversation; no cast voice assigned | Don't talk about the Bug. Old Tom deals with the Bug. I deal with socks. | uncast |
| `mud.mayor.1hnjwfq` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:95 — JackMUD NPC conversation; no cast voice assigned | A hero! At last! Oh, thank goodness. | uncast |
| `mud.mayor.1oq8nry` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:96 — JackMUD NPC conversation; no cast voice assigned | Ah, hello again, hero! Baudby is ever so grateful. | uncast |
| `mud.mayor.1s94vfe` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:97 — JackMUD NPC conversation; no cast voice assigned | The SOCKS, hero! Every sock in town vanishes one at a time! Never a pair! Just one! It's driving everyone mad! | uncast |
| `mud.mayor.1yazre0` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:461 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | THE SOCKS! You found them! All of them! Baudby is saved! Let it be known that this hero is the SOCK SAVIOUR OF BAUDBY! Take this medal. You deserve it. | uncast |
| `mud.mayor.4ijkar` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:97 — JackMUD NPC conversation; no cast voice assigned | It has been in the family for eleven generations. It has its own room. | uncast |
| `mud.mayor.4kly9z` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:98 — JackMUD idle spoken words; silent actions excluded | Has anyone seen my other sock? | uncast |
| `mud.mayor.jvgv1b` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:98 — JackMUD idle spoken words; silent actions excluded | Ow. | uncast |
| `mud.mayor.m7kna` | JackMUD Mayor Wobblebottom | app/mods/md-people.js:97 — JackMUD NPC conversation; no cast voice assigned | Baudby, jewel of the coast! Home of the fountain, the clock tower and some VERY angry geese. | uncast |
| `mud.melody.12qop07` | JackMUD Melody Strum | app/mods/md-people.js:160 — JackMUD shopkeeper thanks; no cast voice assigned | Play it loud! | uncast |
| `mud.melody.1afrfb7` | JackMUD Melody Strum | app/mods/md-people.js:161 — JackMUD NPC conversation; no cast voice assigned | It was a VERY musical goose. | uncast |
| `mud.melody.1hh9097` | JackMUD Melody Strum | app/mods/md-people.js:159 — JackMUD NPC conversation; no cast voice assigned | Hiya! Fancy a tune? Bards heal with songs, you know: SING to heal your party, and LULLABY to send monsters off to sleep. Need kit? LIST. | uncast |
| `mud.melody.1xpkg98` | JackMUD Melody Strum | app/mods/md-people.js:161 — JackMUD NPC conversation; no cast voice assigned | The Lag Goblins? That's the boys' band. They're always about to start playing. They've been about to start since March. | uncast |
| `mud.melody.ef09tw` | JackMUD Melody Strum | app/mods/md-people.js:161 — JackMUD NPC conversation; no cast voice assigned | Every good party needs a bard. We heal everyone at once. And we're great at parties. ACTUAL parties. | uncast |
| `mud.melody.mq77hg` | JackMUD Melody Strum | app/mods/md-people.js:160 — JackMUD shopkeeper thanks; no cast voice assigned | Encore! | uncast |
| `mud.melody.rie898` | JackMUD Melody Strum | app/mods/md-people.js:160 — JackMUD shopkeeper thanks; no cast voice assigned | Rock on! | uncast |
| `mud.penny.11h3dpp` | JackMUD Mr Abacus Penny | app/mods/md-people.js:79 — JackMUD NPC conversation; no cast voice assigned | Good day. Welcome to the Baudby Bank. Gold in the bank is SAFE: if you faint, you only drop gold from your pockets. DEPOSIT, WITHDRAW, BALANCE. And at the Rupee Exchange you can swap gold for JackNet Rupees, or Rupees for gold. Type EXCHANGE to see the rates. | uncast |
| `mud.penny.1gqxz8l` | JackMUD Mr Abacus Penny | app/mods/md-people.js:81 — JackMUD NPC conversation; no cast voice assigned | Interest? Oh, it is very interesting. But we don't pay any. | uncast |
| `mud.penny.1yqhwnb` | JackMUD Mr Abacus Penny | app/mods/md-people.js:81 — JackMUD NPC conversation; no cast voice assigned | It is Y2K compliant. Probably. I have done a backup. Twice. On floppy. | uncast |
| `mud.penny.evzdmb` | JackMUD Mr Abacus Penny | app/mods/md-people.js:82 — JackMUD idle spoken words; silent actions excluded | Neither a borrower nor a lender be. Unless it is with us. | uncast |
| `mud.penny.zcswkr` | JackMUD Mr Abacus Penny | app/mods/md-people.js:81 — JackMUD NPC conversation; no cast voice assigned | JackNet Rupees are the money of the whole JackNet: they live in your JackNet Bank account, outside this world. I'll give you 1 Rupee for 50 gold, up to 5 times a day. Or 40 gold for 1 Rupee. Members only, I'm afraid. Type EXCHANGE. | uncast |
| `mud.bundle.13hcae9` | JackMUD Mrs Bundle | app/mods/md-people.js:192 — JackMUD shopkeeper thanks; no cast voice assigned | Mind how you go! | uncast |
| `mud.bundle.1ccb1io` | JackMUD Mrs Bundle | app/mods/md-people.js:193 — JackMUD NPC conversation; no cast voice assigned | MEGA FIZZ heals 100! It also makes your ears fizz. Not my fault. | uncast |
| `mud.bundle.1guytph` | JackMUD Mrs Bundle | app/mods/md-people.js:192 — JackMUD shopkeeper thanks; no cast voice assigned | Ta! | uncast |
| `mud.bundle.1kkhqe4` | JackMUD Mrs Bundle | app/mods/md-people.js:193 — JackMUD NPC conversation; no cast voice assigned | Cream crackers. Pirates buy them by the barrel. For their parrots, they say. | uncast |
| `mud.bundle.1tvi73y` | JackMUD Mrs Bundle | app/mods/md-people.js:192 — JackMUD shopkeeper thanks; no cast voice assigned | Anything else, duck? | uncast |
| `mud.bundle.1x7dm7i` | JackMUD Mrs Bundle | app/mods/md-people.js:191 — JackMUD NPC conversation; no cast voice assigned | Hello, duck! What can I get you? I've got everything! Well, nearly everything. Type LIST. My MEGA FIZZ is very popular with heroes. Not for little ones, mind. | uncast |
| `mud.bundle.b8x99w` | JackMUD Mrs Bundle | app/mods/md-people.js:192 — JackMUD shopkeeper thanks; no cast voice assigned | There you go, duck! | uncast |
| `mud.bundle.wh0ll8` | JackMUD Mrs Bundle | app/mods/md-people.js:194 — JackMUD idle spoken words; silent actions excluded | That'll be 3p, duck. No, wait. 4p. | uncast |
| `mud.bundle.wr5088` | JackMUD Mrs Bundle | app/mods/md-people.js:193 — JackMUD NPC conversation; no cast voice assigned | Lovely local honey, from the hives at the orchard. Bears go mad for it, you know. | uncast |
| `mud.crumb.1506e19` | JackMUD Mrs Crumb | app/mods/md-people.js:31 — JackMUD shopkeeper thanks; no cast voice assigned | Mind your teeth! | uncast |
| `mud.crumb.1bwqvta` | JackMUD Mrs Crumb | app/mods/md-people.js:31 — JackMUD shopkeeper thanks; no cast voice assigned | Ta very much! | uncast |
| `mud.crumb.1ieyba8` | JackMUD Mrs Crumb | app/mods/md-people.js:31 — JackMUD shopkeeper thanks; no cast voice assigned | Don't eat it all at once! | uncast |
| `mud.crumb.1w4p8vu` | JackMUD Mrs Crumb | app/mods/md-people.js:30 — JackMUD NPC conversation; no cast voice assigned | Hello, my love! What can I get you? Type LIST to see what I have, and BUY and the name to buy it. Fizz Pop is the most important thing an adventurer can carry. Heals you right up. Makes you burp, mind. | uncast |
| `mud.crumb.1xkm6k8` | JackMUD Mrs Crumb | app/mods/md-people.js:32 — JackMUD NPC conversation; no cast voice assigned | Fizz Pop heals 15 HP. Drink it in a fight if you are getting bashed: DRINK FIZZ. My Double Fizz is at the Corner Shoppe in town. Stronger stuff. | uncast |
| `mud.crumb.5s45ew` | JackMUD Mrs Crumb | app/mods/md-people.js:33 — JackMUD idle spoken words; silent actions excluded | No tick! Cash only! | uncast |
| `mud.crumb.7pgemp` | JackMUD Mrs Crumb | app/mods/md-people.js:31 — JackMUD shopkeeper thanks; no cast voice assigned | There you go, my love! | uncast |
| `mud.crumb.bjg92c` | JackMUD Mrs Crumb | app/mods/md-people.js:32 — JackMUD NPC conversation; no cast voice assigned | That boy owes me for four packets of crisps and a toffee. | uncast |
| `mud.bill.11vz3m0` | JackMUD Old Barnacle Bill | app/mods/md-people.js:309 — JackMUD NPC conversation; no cast voice assigned | Lucky barnacle. Been there since 1952. We're very close. | uncast |
| `mud.bill.12ulttf` | JackMUD Old Barnacle Bill | app/mods/md-people.js:310 — JackMUD idle spoken words; silent actions excluded | When I were a lad, the sea were wetter. | uncast |
| `mud.bill.1cnf0f9` | JackMUD Old Barnacle Bill | app/mods/md-people.js:308 — JackMUD NPC conversation; no cast voice assigned | Ahoy! Bubbles? | uncast |
| `mud.bill.1nx0cgw` | JackMUD Old Barnacle Bill | app/mods/md-people.js:307 — JackMUD NPC conversation; no cast voice assigned | Ahoy, young'un. Sit yerself down. You've come at a bad time. Or a good time. Depends if you can fight an octopus. | uncast |
| `mud.bill.apm5qi` | JackMUD Old Barnacle Bill | app/mods/md-people.js:486 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | Ha-HA! Did you see him go! That'll learn him! You've earned this, young'un. My lucky barnacle amulet. Well, my SECOND luckiest barnacle. | uncast |
| `mud.bill.qx0wdd` | JackMUD Old Barnacle Bill | app/mods/md-people.js:309 — JackMUD NPC conversation; no cast voice assigned | Bubble pipe! Took up bubbles when I gave up the other stuff. Much nicer. Smells of strawberries. | uncast |
| `mud.bill.rlexyy` | JackMUD Old Barnacle Bill | app/mods/md-people.js:309 — JackMUD NPC conversation; no cast voice assigned | Pink. Huge. Cheeky. Pinches me dinner every single night! Level nine, that one. Take a friend. | uncast |
| `mud.tom.1b1ywps` | JackMUD Old Tom Tick | app/mods/md-people.js:114 — JackMUD idle spoken words; silent actions excluded | Nineteen hundred... not on MY watch. | uncast |
| `mud.tom.1c465lt` | JackMUD Old Tom Tick | app/mods/md-people.js:113 — JackMUD NPC conversation; no cast voice assigned | Seven watches! One for each day. Today's is the one that works. | uncast |
| `mud.tom.966npd` | JackMUD Old Tom Tick | app/mods/md-people.js:112 — JackMUD NPC conversation; no cast voice assigned | Tick tock, tick tock. Not long now. Not long. | uncast |
| `mud.tom.cci5a3` | JackMUD Old Tom Tick | app/mods/md-people.js:537 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | You did it. You actually did it! Listen... tick, tock, tick, tock. That's the sound of every clock in Baudby, ready for the year 2000. You're a true hero. The truest. Take these. You've earned them. | uncast |
| `mud.tom.cj1cdy` | JackMUD Old Tom Tick | app/mods/md-people.js:113 — JackMUD NPC conversation; no cast voice assigned | There are {dynamic} days left till the year 2000. I count every one. | uncast |
| `mud.tom.jd5pt8` | JackMUD Old Tom Tick | app/mods/md-people.js:113 — JackMUD NPC conversation; no cast voice assigned | This clock has never been wrong. Not once. Every clock in Baudby follows it. Which is the trouble, see. | uncast |
| `mud.tom.vxvfa7` | JackMUD Old Tom Tick | app/mods/md-people.js:113 — JackMUD NPC conversation; no cast voice assigned | Down below is the Old Server Room. And in the Old Server Room is the Millennium Bug. It wants every clock in the world to think it's 1900 when the year 2000 comes. I can't let that happen. I'm too old to fight it. That's where heroes come in. Strong ones. Level 14, at least. | uncast |
| `mud.tom.zb2eez` | JackMUD Old Tom Tick | app/mods/md-people.js:111 — JackMUD NPC conversation; no cast voice assigned | Eh? Who's that? A hero, is it? Hmm. You look a bit young. Come back when you've a few more adventures under your belt, and we'll talk about what's under this tower. | uncast |
| `mud.polly.170ocvm` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:469 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | SQUAWK! CRACKER! CRACKER! *crunch crunch* ...GOOD HUMAN! Polly-Gon hops onto your shoulder and nibbles your ear. | uncast |
| `mud.polly.1oo74ph` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:294 — JackMUD idle spoken words; silent actions excluded | POLLY WANTS A CRACKER! | uncast |
| `mud.polly.1xy392j` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:294 — JackMUD idle spoken words; silent actions excluded | WHO'S A PRETTY BIRD? ME! | uncast |
| `mud.polly.1yh2eld` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:293 — JackMUD NPC conversation; no cast voice assigned | SQUAWK! SILLY OLD PETE! SILLY OLD PETE FORGOT POLLY'S CRACKER! SQUAWK! | uncast |
| `mud.polly.a0a50i` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:293 — JackMUD NPC conversation; no cast voice assigned | SQUAWK! CRACKER! CREAM CRACKER! GIVE CRACKER POLLY! SQUAWK! | uncast |
| `mud.polly.cbwug8` | JackMUD Polly-Gon the parrot | app/mods/md-people.js:292 — JackMUD NPC conversation; no cast voice assigned | SQUAWK! PIECES OF EIGHT! PIECES OF EIGHT! ...AND A BIT. SQUAWK! POLLY WANTS A CRACKER! | uncast |
| `mud.pat.15gfs9e` | JackMUD Postmistress Pat | app/mods/md-people.js:104 — JackMUD NPC conversation; no cast voice assigned | Hello again, pet! Lovely to see you! | uncast |
| `mud.pat.1rgmux7` | JackMUD Postmistress Pat | app/mods/md-people.js:103 — JackMUD NPC conversation; no cast voice assigned | Ooh, hello! You look like someone with strong legs! I've got a parcel that needs taking somewhere I can't get to with my bad knee. | uncast |
| `mud.pat.1rwrjhf` | JackMUD Postmistress Pat | app/mods/md-people.js:395 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | Ooh, a letter! From the Professor! Lovely loopy handwriting. Thank you, pet, here's something for your trouble. And a pair of my spare trainers. Lights in the heels! | uncast |
| `mud.pat.7ocdpp` | JackMUD Postmistress Pat | app/mods/md-people.js:105 — JackMUD NPC conversation; no cast voice assigned | First class is 26p! Unless you are a goose. Geese are banned from the Post Office. | uncast |
| `mud.pat.f9m0bw` | JackMUD Postmistress Pat | app/mods/md-people.js:106 — JackMUD idle spoken words; silent actions excluded | First class! | uncast |
| `mud.pat.oy1ubm` | JackMUD Postmistress Pat | app/mods/md-people.js:105 — JackMUD NPC conversation; no cast voice assigned | Professor Hoot lives in the Owl Tree, in the Deep Woods. Past the troll bridge. Trevor will want a riddle answered, mind. | uncast |
| `mud.pat.to3wnm` | JackMUD Postmistress Pat | app/mods/md-people.js:105 — JackMUD NPC conversation; no cast voice assigned | Electronic mail! Pah. You can't lick an e-mail. You can't smell it. Mind you, you can't lose it down the back of the sofa either. | uncast |
| `mud.hoot.12h3gax` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | Floppitha, up Mount Megabyte. Clever dragon. Collects floppy disks. Lost her favourite one in the Caves of Lag, I hear. Hoo. | uncast |
| `mud.hoot.135dyp4` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | Trevor's riddle? I couldn't possibly tell you. Hoo. But think about what's in front of you right now, on the desk, with all the letters on it. | uncast |
| `mud.hoot.1dlo4po` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | I can see that squirrel. I can ALWAYS see that squirrel now. | uncast |
| `mud.hoot.1i2zdpd` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | The first person to walk on the Moon was Neil Armweak, in July 1969, on the Apolly 11 mission. The first person in space EVER was Yuri Garglin, in 1961. Hoo. I told you I knew everything. | uncast |
| `mud.hoot.1r5r1pi` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | Hoo-hoo. Nice try. | uncast |
| `mud.hoot.1wmmru` | JackMUD Professor Hoot | app/mods/md-people.js:394 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | A parcel! For me? Hoo! My new spectacles! Oh, I can see EVERYTHING! Here, take this letter back to Pat, would you? Hoo-hoo. | uncast |
| `mud.hoot.1ymtdgq` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | Big Ted, in the cave. Sleeps all day, sleeps all night. Only one thing wakes that bear: honey. | uncast |
| `mud.hoot.6algem` | JackMUD Professor Hoot | app/mods/md-people.js:250 — JackMUD NPC conversation; no cast voice assigned | New spectacles! From the Post Office. Pat posted them. I can see EVERYTHING. It is wonderful and terrible. | uncast |
| `mud.hoot.7cdti6` | JackMUD Professor Hoot | app/mods/md-people.js:249 — JackMUD NPC conversation; no cast voice assigned | Hoo. Hoo are you? Ah. A visitor. I am Professor Hoot and I know EVERYTHING. Ask me ABOUT anything. Go on. Anything. | uncast |
| `mud.hoot.zrn8o9` | JackMUD Professor Hoot | app/mods/md-people.js:251 — JackMUD idle spoken words; silent actions excluded | Hoo. Hoo knew? | uncast |
| `mud.pixel.12tthya` | JackMUD Professor Pixel | app/mods/md-people.js:15 — JackMUD NPC conversation; no cast voice assigned | Remember: N, S, E, W, U, D. And MAP shows you where you have been. Very useful when Dave gets you lost. | uncast |
| `mud.pixel.15052io` | JackMUD Professor Pixel | app/mods/md-people.js:16 — JackMUD NPC conversation; no cast voice assigned | Type MAP. It draws the rooms you have been to. The @ is you. Marvellous invention. | uncast |
| `mud.pixel.19cu4y1` | JackMUD Professor Pixel | app/mods/md-people.js:17 — JackMUD idle spoken words; silent actions excluded | Never Eat Shredded Wheat... never... eat... | uncast |
| `mud.pixel.es645p` | JackMUD Professor Pixel | app/mods/md-people.js:17 — JackMUD idle spoken words; silent actions excluded | North! South! East! West! Up! Down! The six directions of destiny! | uncast |
| `mud.pixel.eyixdc` | JackMUD Professor Pixel | app/mods/md-people.js:16 — JackMUD NPC conversation; no cast voice assigned | EXITS lists every way out of a room, and where it goes, if you have been there before. | uncast |
| `mud.pixel.h3yy9p` | JackMUD Professor Pixel | app/mods/md-people.js:14 — JackMUD NPC conversation; no cast voice assigned | Ah! A new student! Splendid. Now: moving about. You type the way you want to go. N for north, S for south, E for east, W for west. U and D for up and down. The Exits line in every room tells you which ways you CAN go. Try it! There is a cloakroom just WEST of here with your scarf in it. Type W. | uncast |
| `mud.pixel.ktl34c` | JackMUD Professor Pixel | app/mods/md-people.js:16 — JackMUD NPC conversation; no cast voice assigned | RECALL whisks you back to Market Square in Baudby. For when you are hopelessly lost. Which happens to the best of us. | uncast |
| `mud.pixel.s5myaw` | JackMUD Professor Pixel | app/mods/md-people.js:16 — JackMUD NPC conversation; no cast voice assigned | Dave? Dave once walked north for forty minutes. Into a wall. Lovely boy. | uncast |
| `mud.squeakbert.10wer3h` | JackMUD Queen Squeakbert | app/mods/md-people.js:363 — JackMUD NPC conversation; no cast voice assigned | The Moon is the finest cheese in the solar system. Tangy, crumbly, slightly radioactive. Lovely. | uncast |
| `mud.squeakbert.1bc0h7h` | JackMUD Queen Squeakbert | app/mods/md-people.js:361 — JackMUD NPC conversation; no cast voice assigned | Squeak! Our hero! The whole Moon thanks you! | uncast |
| `mud.squeakbert.1ulu4uc` | JackMUD Queen Squeakbert | app/mods/md-people.js:362 — JackMUD shopkeeper thanks; no cast voice assigned | Squeak! Enjoy! | uncast |
| `mud.squeakbert.1vni5vg` | JackMUD Queen Squeakbert | app/mods/md-people.js:363 — JackMUD NPC conversation; no cast voice assigned | We came up on an old rocket a long time ago. We liked it. We stayed. | uncast |
| `mud.squeakbert.1w0yngp` | JackMUD Queen Squeakbert | app/mods/md-people.js:362 — JackMUD shopkeeper thanks; no cast voice assigned | The finest cheese on the Moon! (The only cheese on the Moon. Well. The Moon IS cheese.) | uncast |
| `mud.squeakbert.diygot` | JackMUD Queen Squeakbert | app/mods/md-people.js:360 — JackMUD NPC conversation; no cast voice assigned | Squeak! A hero from Earth! We have waited so long! | uncast |
| `mud.squeakbert.ocv3ol` | JackMUD Queen Squeakbert | app/mods/md-people.js:363 — JackMUD NPC conversation; no cast voice assigned | A giant space worm! It has eaten three craters and a satellite! If it keeps munching, there won't BE a Moon! It lives in a pit beyond the Cheese Mines. | uncast |
| `mud.squeakbert.t06onh` | JackMUD Queen Squeakbert | app/mods/md-people.js:529 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | Squeak! SQUEAK! You did it! The Moon is safe! Mice, bring the Royal Crown of Cheese! No, the BIG one! Hero, wear it with pride! | uncast |
| `mud.rowan.125m1yf` | JackMUD Ranger Rowan | app/mods/md-people.js:145 — JackMUD shopkeeper thanks; no cast voice assigned | Watch your step. | uncast |
| `mud.rowan.1supzp8` | JackMUD Ranger Rowan | app/mods/md-people.js:146 — JackMUD NPC conversation; no cast voice assigned | The Whispering Woods. Granny Byte lives near the edge. Further in, a troll bridge, a sleepy bear and an owl who knows everything. | uncast |
| `mud.rowan.1v49vev` | JackMUD Ranger Rowan | app/mods/md-people.js:146 — JackMUD NPC conversation; no cast voice assigned | The Grumbly Hills are north of Windy Hill, past Floppy Fields. The Caves of Lag are up there. Do not go in until you are level 7. | uncast |
| `mud.rowan.1w2hzkh` | JackMUD Ranger Rowan | app/mods/md-people.js:144 — JackMUD NPC conversation; no cast voice assigned | Welcome, traveller. The woods are west of town, the hills north of the fields. I've got spare bows and boots if you need them. LIST. | uncast |
| `mud.rowan.d7wa03` | JackMUD Ranger Rowan | app/mods/md-people.js:147 — JackMUD idle spoken words; silent actions excluded | forest stew | uncast |
| `mud.rowan.j29ps7` | JackMUD Ranger Rowan | app/mods/md-people.js:145 — JackMUD shopkeeper thanks; no cast voice assigned | Travel well. | uncast |
| `mud.rowan.l1psmf` | JackMUD Ranger Rowan | app/mods/md-people.js:146 — JackMUD NPC conversation; no cast voice assigned | He's good. Draws better maps than I do. Don't tell him. | uncast |
| `mud.rowan.l7va7m` | JackMUD Ranger Rowan | app/mods/md-people.js:146 — JackMUD NPC conversation; no cast voice assigned | My treehouse is in the Giant Oak. Help yourself to the crisps. Leave the walkie-talkie alone. | uncast |
| `mud.rowan.s0n7db` | JackMUD Ranger Rowan | app/mods/md-people.js:145 — JackMUD shopkeeper thanks; no cast voice assigned | Good hunting. | uncast |
| `mud.stuffing.12jhvs9` | JackMUD Sergeant Stuffing | app/mods/md-people.js:56 — JackMUD NPC conversation; no cast voice assigned | That one is for bravery. That one is for long service. That one is for sending a drawing in to the telly. | uncast |
| `mud.stuffing.1hom5v1` | JackMUD Sergeant Stuffing | app/mods/md-people.js:55 — JackMUD NPC conversation; no cast voice assigned | Still here, recruit? KILL DUMMY! And type SKILLS to see your special moves! | uncast |
| `mud.stuffing.1i17xrb` | JackMUD Sergeant Stuffing | app/mods/md-people.js:56 — JackMUD NPC conversation; no cast voice assigned | Every class has SKILLS. Knights BASH. Wizards ZAP. Rangers SHOOT. Bards SING. Type SKILLS to see yours. Use them in a fight! | uncast |
| `mud.stuffing.1ozx06f` | JackMUD Sergeant Stuffing | app/mods/md-people.js:57 — JackMUD idle spoken words; silent actions excluded | ONE-TWO! ONE-TWO! | uncast |
| `mud.stuffing.1pdg6nl` | JackMUD Sergeant Stuffing | app/mods/md-people.js:56 — JackMUD NPC conversation; no cast voice assigned | Fight going badly? FLEE! There is no shame in running away. Well, a little bit. But not much. | uncast |
| `mud.stuffing.g1kqmr` | JackMUD Sergeant Stuffing | app/mods/md-people.js:54 — JackMUD NPC conversation; no cast voice assigned | RIGHT THEN, RECRUIT! This is DENNIS. Dennis is a TRAINING DUMMY. First, CONSIDER DUMMY to see how tough he is. Then KILL DUMMY! The fight goes on by itself, a round every couple of seconds. Watch your HP in your prompt! Use your class SKILLS too! If it goes badly, FLEE! NOW GO! | uncast |
| `mud.stuffing.pw9qea` | JackMUD Sergeant Stuffing | app/mods/md-people.js:56 — JackMUD NPC conversation; no cast voice assigned | Dennis has been bonked eleven thousand times. He has never once complained. | uncast |
| `mud.clanksalot.18b2x7j` | JackMUD Sir Clanksalot | app/mods/md-people.js:258 — JackMUD NPC conversation; no cast voice assigned | Lost it in the brambles, I think. I was fighting a bramble beast. Well, it was fighting me. It won. | uncast |
| `mud.clanksalot.1hkzjmw` | JackMUD Sir Clanksalot | app/mods/md-people.js:257 — JackMUD NPC conversation; no cast voice assigned | Ah! My friend! I'd know that voice anywhere. Well, I'd have to. I still can't see much. | uncast |
| `mud.clanksalot.1l4bdny` | JackMUD Sir Clanksalot | app/mods/md-people.js:258 — JackMUD NPC conversation; no cast voice assigned | Sir Reginald? My cousin. Very shiny. Bit much. | uncast |
| `mud.clanksalot.1qh2u9u` | JackMUD Sir Clanksalot | app/mods/md-people.js:256 — JackMUD NPC conversation; no cast voice assigned | Who goes there? Friend or foe? Sorry, I can't see a THING. I've lost my helmet, you see, and without it my fringe goes everywhere. | uncast |
| `mud.clanksalot.pcb5fw` | JackMUD Sir Clanksalot | app/mods/md-people.js:259 — JackMUD idle spoken words; silent actions excluded | Sorry. | uncast |
| `mud.clanksalot.x5uyql` | JackMUD Sir Clanksalot | app/mods/md-people.js:444 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | My HELMET! I can SEE! Oh, look at that, there's a tree right there. I've been walking into that. Thank you, friend! Please, take my spare shield. | uncast |
| `mud.clanksalot.yk4639` | JackMUD Sir Clanksalot | app/mods/md-people.js:259 — JackMUD idle spoken words; silent actions excluded | Is that you? No. That's a tree. | uncast |
| `mud.clanksalot.ztssq3` | JackMUD Sir Clanksalot | app/mods/md-people.js:258 — JackMUD NPC conversation; no cast voice assigned | I should get it cut. But it's my best feature. When you can see it. | uncast |
| `mud.reginald.16v9s8m` | JackMUD Sir Reginald Clank | app/mods/md-people.js:138 — JackMUD NPC conversation; no cast voice assigned | A knight never gives up! A knight helps the weak! A knight always polishes his boots! Sir Clanksalot is a knight too. He's... less shiny. | uncast |
| `mud.reginald.1daa542` | JackMUD Sir Reginald Clank | app/mods/md-people.js:138 — JackMUD NPC conversation; no cast voice assigned | Honour is doing the right thing when nobody is watching. Like putting the lid back on the felt tips. | uncast |
| `mud.reginald.1f2xu3u` | JackMUD Sir Reginald Clank | app/mods/md-people.js:137 — JackMUD shopkeeper thanks; no cast voice assigned | Courage! | uncast |
| `mud.reginald.1hnv16p` | JackMUD Sir Reginald Clank | app/mods/md-people.js:137 — JackMUD shopkeeper thanks; no cast voice assigned | Wear it with honour! | uncast |
| `mud.reginald.1koxljw` | JackMUD Sir Reginald Clank | app/mods/md-people.js:138 — JackMUD NPC conversation; no cast voice assigned | Sir Clanksalot? Lost in the Whispering Woods again, I expect. He loses his helmet a lot. | uncast |
| `mud.reginald.1xm8gm3` | JackMUD Sir Reginald Clank | app/mods/md-people.js:136 — JackMUD NPC conversation; no cast voice assigned | Hail, brave adventurer! The Knights' Hall welcomes ALL heroes, not just knights. Courage! Honour! Wipe your feet! My armoury has fine kit for those who have earned it: type LIST. | uncast |
| `mud.reginald.9usxyi` | JackMUD Sir Reginald Clank | app/mods/md-people.js:139 — JackMUD idle spoken words; silent actions excluded | COURAGE! | uncast |
| `mud.reginald.wpgt7n` | JackMUD Sir Reginald Clank | app/mods/md-people.js:137 — JackMUD shopkeeper thanks; no cast voice assigned | Splendid! Splendid! | uncast |
| `mud.ping.1g0zb02` | JackMUD Sister Ping | app/mods/md-people.js:73 — JackMUD NPC conversation; no cast voice assigned | Saint Reboot is the patron of fresh starts. When everything goes wrong, turn it off and on again. Works for computers AND people. | uncast |
| `mud.ping.1mfgl65` | JackMUD Sister Ping | app/mods/md-people.js:74 — JackMUD idle spoken words; silent actions excluded | Have a jelly baby, pet. | uncast |
| `mud.ping.1o9iin8` | JackMUD Sister Ping | app/mods/md-people.js:73 — JackMUD NPC conversation; no cast voice assigned | Lovely birds. They work nights. They like a jelly baby as a thank you. | uncast |
| `mud.ping.91ouub` | JackMUD Sister Ping | app/mods/md-people.js:71 — JackMUD NPC conversation; no cast voice assigned | Hello, pet. Are you feeling poorly? Type HEAL and I'll make you all better (no charge for little ones up to level 5). If you ever faint out there, the owls bring you here and I look after you. Nobody stays fainted for long in Baudby. | uncast |
| `mud.ping.g2w9lx` | JackMUD Sister Ping | app/mods/md-people.js:73 — JackMUD NPC conversation; no cast voice assigned | Fluffy slippers are very important in a temple. Marble floors are cold, pet. | uncast |
| `mud.ping.h17xm1` | JackMUD Sister Ping | app/mods/md-people.js:73 — JackMUD NPC conversation; no cast voice assigned | If your HP gets to zero you faint. The owls bring you here. You'll drop a few coins on the way, so keep your gold in the bank, pet. | uncast |
| `mud.spaghetti.115brwi` | JackMUD Spaghetti the yeti | app/mods/md-people.js:327 — JackMUD shopkeeper thanks; no cast voice assigned | WARM AS TOAST! | uncast |
| `mud.spaghetti.1pktswh` | JackMUD Spaghetti the yeti | app/mods/md-people.js:328 — JackMUD NPC conversation; no cast voice assigned | Floppitha's lovely! We play chess on Tuesdays. She's been ever so sad. Lost her save game disk. Two hundred years of progress! | uncast |
| `mud.spaghetti.1rk3n3h` | JackMUD Spaghetti the yeti | app/mods/md-people.js:329 — JackMUD idle spoken words; silent actions excluded | Have I got sauce on my chin? I've always got sauce on my chin. | uncast |
| `mud.spaghetti.1u6rpbh` | JackMUD Spaghetti the yeti | app/mods/md-people.js:327 — JackMUD shopkeeper thanks; no cast voice assigned | Mind the drafts! | uncast |
| `mud.spaghetti.1yopu8p` | JackMUD Spaghetti the yeti | app/mods/md-people.js:328 — JackMUD NPC conversation; no cast voice assigned | My mom called me Spaghetti because I was long and wobbly as a baby. Now I just LOVE spaghetti. It all worked out. | uncast |
| `mud.spaghetti.4f5i7e` | JackMUD Spaghetti the yeti | app/mods/md-people.js:327 — JackMUD shopkeeper thanks; no cast voice assigned | Lovely and cosy! | uncast |
| `mud.spaghetti.s2ab8n` | JackMUD Spaghetti the yeti | app/mods/md-people.js:326 — JackMUD NPC conversation; no cast voice assigned | OH! A VISITOR! Come in, come in, out of the snow! Want some spaghetti? Everyone wants spaghetti. I've got spare coats if you're cold, too. LIST, LIST! | uncast |
| `mud.spaghetti.ter4yn` | JackMUD Spaghetti the yeti | app/mods/md-people.js:328 — JackMUD NPC conversation; no cast voice assigned | People think yetis are scary. We're not. We're mostly just cold and hungry. | uncast |
| `mud.strawbert.15zifsy` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:425 — JackMUD quest completion dialogue; cast approval and spoken-only review pending | A golden carrot? Funny you should say that... a crow dropped one right on my hat when you were chasing them about! Here you go. Don't let it near my face, I'll get ideas. | uncast |
| `mud.strawbert.1dmkz9q` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:203 — JackMUD idle spoken words; silent actions excluded | Shoo. Shoo. Please shoo. | uncast |
| `mud.strawbert.1neb7kp` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:202 — JackMUD NPC conversation; no cast voice assigned | My job is scaring birds. I'm rubbish at it. They sit on my hat. | uncast |
| `mud.strawbert.3mmgj8` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:201 — JackMUD NPC conversation; no cast voice assigned | Oh, 'ello there. You're not a crow, are you? Good. Can't stand crows. Pinch everything, they do. Even my nose. | uncast |
| `mud.strawbert.eyobdu` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:202 — JackMUD NPC conversation; no cast voice assigned | Crows! They pinch EVERYTHING shiny. Buttons, bottle tops, my nose, the Bunny King's golden carrot... | uncast |
| `mud.strawbert.t6gzki` | JackMUD Strawbert the scarecrow | app/mods/md-people.js:202 — JackMUD NPC conversation; no cast voice assigned | It's my third carrot this month. I'm thinking of getting a parsnip. More dignified. | uncast |
| `mud.crier.1ae2y4f` | JackMUD the Town Crier | app/mods/md-people.js:64 — JackMUD NPC conversation; no cast voice assigned | OYEZ! OYEZ! Welcome to Baudby, hero! The BANK is EAST, the SHOPS are SOUTH, the TEMPLE is WEST, and the INN and TOWN HALL are NORTH! Type MAP to see where you are! Type AREAS to see where to adventure! OYEZ! | uncast |
| `mud.crier.1inl082` | JackMUD the Town Crier | app/mods/md-people.js:65 — JackMUD NPC conversation; no cast voice assigned | OYEZ! Sock gremlins in the sewers! Geese in the fields! A troll on the bridge in the woods (he's very nice)! And they say there is a BUG under the Clock Tower! OYEZ! | uncast |
| `mud.crier.1momoqj` | JackMUD the Town Crier | app/mods/md-people.js:65 — JackMUD NPC conversation; no cast voice assigned | WEST! Sister Ping heals you, free for little heroes! | uncast |
| `mud.crier.1sxmeuf` | JackMUD the Town Crier | app/mods/md-people.js:66 — JackMUD idle spoken words; silent actions excluded | OYEZ! Lost: one goose! Do NOT return it! | uncast |
| `mud.crier.1ydu9vy` | JackMUD the Town Crier | app/mods/md-people.js:65 — JackMUD NPC conversation; no cast voice assigned | SOUTH of here, down Harbour Road! Weapons and armour at Sticks n Swords, everything else at the Corner Shoppe! | uncast |
| `mud.crier.1ye2xxt` | JackMUD the Town Crier | app/mods/md-people.js:65 — JackMUD NPC conversation; no cast voice assigned | This bell has been rung every day for 200 years! It is VERY tired! | uncast |
| `mud.crier.6xuyi` | JackMUD the Town Crier | app/mods/md-people.js:65 — JackMUD NPC conversation; no cast voice assigned | EAST of here! Mr Penny looks after your gold, and swaps it for JackNet Rupees! | uncast |
| `mud.crier.b9dl0t` | JackMUD the Town Crier | app/mods/md-people.js:66 — JackMUD idle spoken words; silent actions excluded | OYEZ! OYEZ! The time is... about now! | uncast |
| `mud.crier.z071kq` | JackMUD the Town Crier | app/mods/md-people.js:66 — JackMUD idle spoken words; silent actions excluded | OYEZ! New heroes: say hello at the Dial-Up Inn! | uncast |
| `mud.crier.zp0hns` | JackMUD the Town Crier | app/mods/md-people.js:66 — JackMUD idle spoken words; silent actions excluded | OYEZ! The Millennium is coming! Back up your floppies! | uncast |
| `mud.trevor.1h2php` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:276 — JackMUD idle spoken words; silent actions excluded | Riddle me this! No, wait, that's my line. | uncast |
| `mud.trevor.ckj6u3` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:264 — JackMUD NPC conversation; no cast voice assigned | Ello! Toll bridge, this is. No gold needed. Just answer my riddle, and over you go! Ready? Here it is... {W}"I have keys, but I open no locks. I have space, but there's no room. You can enter, but you can't come inside. What am I?"{Y} Just SAY the answer! | uncast |
| `mud.trevor.dbhy07` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:266 — JackMUD NPC conversation; no cast voice assigned | Just buttons. Nobody ever pays in gold. It's fine. I like buttons. | uncast |
| `mud.trevor.lsa96p` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:266 — JackMUD NPC conversation; no cast voice assigned | Ooh, you want a clue? It's something you're using RIGHT NOW. Probably. Unless you're using a pen. | uncast |
| `mud.trevor.z07g1j` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:265 — JackMUD NPC conversation; no cast voice assigned | Ello again! You know the way. Off you go! Mind the wobbly plank. | uncast |
| `mud.trevor.z6xrzu` | JackMUD Trevor the Toll Troll | app/mods/md-people.js:266 — JackMUD NPC conversation; no cast voice assigned | My mom knitted it. She knits me one every birthday. I have three hundred. | uncast |
| `computer.sx-eggs.h3qj5f` | JackOS secret character | app/public/js/sx-eggs.js:123 — Existing computer / fake-web spoken character; voice choice awaits Jack | I'm sorry, Dave. I'm afraid I can't do that. | uncast |
| `computer.sx-eggs.x9005t` | JackOS secret character | app/public/js/sx-eggs.js:232 — Existing computer / fake-web spoken character; voice choice awaits Jack | Ex-ter-min-ate! | uncast |
| `c2.call.a1.18ehd2g` | mate1 | docs/SCRIPT.md:260 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Hello? Oh, it's you! What's up? | uncast |
| `c2.call.a3.6lgyqn` | mate1 | docs/SCRIPT.md:262 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | No WAY! Which one? What games have you got? I'm coming round NOW. | uncast |
| `c2.call.a4.1npqoko` | mate1 | docs/SCRIPT.md:263 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Stay there. Don't touch anything. I'm bringing my own controller. Is your mom in? Will she make us sandwiches? | uncast |
| `c2.call.a6.18t9l9s` | mate1 | docs/SCRIPT.md:265 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Level one?! You're ages behind. Back in a bit. Put the kettle on. | uncast |
| `c4.mill.mate1.ghbimp` | mate1 | docs/SCRIPT.md:570 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Is it midnight yet?! How long's left?! Is the telly still working?! | uncast |
| `mate.call.1.bzacne` | mate1 | docs/SCRIPT.md:798 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Hello? Hang on, my mom's shouting at me. ... Right. What's up? | uncast |
| `mate.call.13.oiexj` | mate1 | docs/SCRIPT.md:810 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Did you do the maths homework? No? Me neither. Copy mine tomorrow. | uncast |
| `mate.call.17.ou7p32` | mate1 | docs/SCRIPT.md:814 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Gotta go, my tea's ready! Speak later! Bye bye bye! | uncast |
| `mate.call.2.cje2e1` | mate1 | docs/SCRIPT.md:799 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Did you see the new demo disc? There's a bit where the dinosaur chases you. I was screaming. My mom thought I'd hurt myself. | uncast |
| `mate.call.3.1l813im` | mate1 | docs/SCRIPT.md:800 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Fancy a swap? I'll swap my racing game for yours. Honest. It's even got a scratch on it. Only a small one. | uncast |
| `c4.mill.mate2.1dfbw28` | mate2 | docs/SCRIPT.md:571 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Statistically, nothing is going to happen. But if the lights go out, I told you so. | uncast |
| `mate.call.14.1cjoyc1` | mate2 | docs/SCRIPT.md:811 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Issue nine of JACK ATTACK! has a poster of a space soldier with a very big gun. I've put it on my ceiling. | uncast |
| `mate.call.18.r2aef` | mate2 | docs/SCRIPT.md:815 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | I've got to go. Mom needs the phone. See you at school. | uncast |
| `mate.call.4.x4xmud` | mate2 | docs/SCRIPT.md:801 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | I read in the mag that the next one is going to have a hard drive. That's like a floppy, but you can't lose it. | uncast |
| `mate.call.5.younhc` | mate2 | docs/SCRIPT.md:802 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Four players, no waiting. And a stick in the middle that goes all the way round. It's basically a flight simulator for your thumb. | uncast |
| `mate.call.6.1x228pm` | mate2 | docs/SCRIPT.md:803 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | I found a secret on the Teletext. Up, up, down, down, left, right... no, wait. That's a different one. | uncast |
| `mate.call.15.1319uz` | mate3 | docs/SCRIPT.md:812 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Sleepover at mine on Friday? We can stay up playing the new game until my dad shouts. | uncast |
| `mate.call.7.1aj02pz` | mate3 | docs/SCRIPT.md:804 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Yeah, I've got that. Finished it. Twice. Got the secret ending as well. It's rubbish. | uncast |
| `mate.call.8.wxgpxs` | mate3 | docs/SCRIPT.md:805 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | The Segue? Cool. My cousin's got one. She says it's got a hedgehog who runs really fast. | uncast |
| `mate.call.9.qhkc6q` | mate3 | docs/SCRIPT.md:806 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | I'll lend you my spare controller. Don't break it. Don't lose it. Don't let your sister touch it. | uncast |
| `mate.call.10.6q7t7g` | mate4 | docs/SCRIPT.md:807 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Pocket Critters cards. I've got three Charbroilers. Don't ask where I got them. | uncast |
| `mate.call.11.12t00rv` | mate4 | docs/SCRIPT.md:808 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Heard the Daydream's £199. That's forty weeks of pocket money. I've done the maths. | uncast |
| `mate.call.12.doj1au` | mate4 | docs/SCRIPT.md:809 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | Do you want to come round? I've got the demo disc. We can't save but we can pretend. | uncast |
| `mate.call.16.1oyuaz6` | mate4 | docs/SCRIPT.md:813 — Script-only mate phone dialogue; no gameplay trigger or cast voice yet | I found a second-hand cartridge in a charity shop for 50p. It's called 'Golf Fever'. I'm not sure it works but it smells interesting. | uncast |
| `computer.toolbars-bars.17xq0la` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Why was the floppy disk sad? Nobody wanted to be its 1.44 MB-FF. | uncast |
| `computer.toolbars-bars.1dihdk` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Why did the modem go to bed early? It was all worn out from the screeching. | uncast |
| `computer.toolbars-bars.1kswtve` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Why did the racing car paint itself red? Because red ones go faster! | uncast |
| `computer.toolbars-bars.1r0r8hq` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Knock knock. Who is there? The Millennium Bug. The Millennium Bug who? Exactly, nobody knows. | uncast |
| `computer.toolbars-bars.ge2q31` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Why did the computer go to the doctor? It had a virus! | uncast |
| `computer.toolbars-bars.hrk38b` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | What do you call an Eggbert with no batteries? A keyring. | uncast |
| `computer.toolbars-bars.l8331q` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | Why did the Game Lad go to bed? Its batteries were flat. | uncast |
| `computer.toolbars-bars.vzq6s3` | MegaSearch | app/public/js/toolbars-bars.js:236, app/public/js/toolbars-bars.js:315 — Existing computer / fake-web spoken character; voice choice awaits Jack | How many programmers does it take to change a light bulb? None, that is a hardware problem. | uncast |
| `bark.mom.bed1` | mom | app/public/js/np-life.js:572 — Landing, 21:00, the player still up | It's gone nine! Bedtime for little ones! And the rest of you, don't stay up too late! | yes |
| `bark.mom.bed2` | mom | app/public/js/np-life.js:572 — 21:30 | Lights out, love. School tomorrow. Sleep tight. | yes |
| `bark.mom.bed3` | mom | app/public/js/np-life.js:572 — 22:00 | Right, I'm off up. Don't stay on that computer all night. | yes |
| `bark.mom.cut1` | mom | Catalogue only; trigger not found — Kitchen | Is everybody all right? Stay still! I'll find the candles. | yes |
| `bark.mom.cut2` | mom | Catalogue only; trigger not found — Lights back on | Phew. Lights are back. I'd forgotten what the kitchen looks like. | yes |
| `bark.mom.gran` | mom | Catalogue only; trigger not found — Hall, five minutes before Gran arrives | Gran's coming! Tidy the lounge! Quick! She'll look in the cupboards! | yes |
| `bark.mom.line1` | mom | app/public/js/np-life.js:574 — Hall, answering the phone | Hello? Oh, hello, Gran! Yes. Yes. They're being very good. Aren't you? | yes |
| `bark.mom.line2` | mom | app/public/js/np-life.js:574 — Hall, a long call | No, never! Well I never. And then what did she say? | yes |
| `bark.mom.line3` | mom | Catalogue only; trigger not found — Hall, call for the player | Phone! It's for you! One of your friends! And keep it short! | yes |
| `bark.mom.mess1` | mom | Catalogue only; trigger not found — Landing, bedroom door open, mess on the floor | Have you SEEN your room? There's a plate in there older than me! | yes |
| `bark.mom.mess2` | mom | app/public/js/np-life.js:571 — Hall, shoes on the floor | Whose shoes are these in the middle of the hall? I nearly broke my neck! | yes |
| `bark.mom.mess3` | mom | app/public/js/np-life.js:570 — Lounge, mess on the coffee table | Cups in the kitchen, please. They don't walk there on their own. | yes |
| `bark.mom.mess4` | mom | app/public/js/np-life.js:569 — Kitchen | Why is the sink always full? Where do all the plates come from? | yes |
| `bark.mom.react.cat` | mom | Catalogue only; trigger not found — Cat event | Whose cat is that on my table? Shoo! Shoo! | yes |
| `bark.mom.react.hoover` | mom | Catalogue only; trigger not found — Hoover bag bursts | Oh no. The bag's burst! There's dust everywhere! | yes |
| `bark.mom.react.nag` | mom | app/public/js/np-life.js:573 — Random, jobs not done by noon | I'll give you pocket money when the washing-up's done, not before. | yes |
| `bark.mom.react.phone` | mom | Catalogue only; trigger not found — Phone rings mid-washing-up | Answer that for me, my hands are wet! | yes |
| `bark.mom.react.praise` | mom | app/public/js/np-life.js:543, app/public/js/np-life.js:544, app/public/js/np-life.js:575 — Random, after a good streak | You've been such a help lately. I've noticed. | yes |
| `bark.mom.school1` | mom | app/public/js/np-life.js:566 — Kitchen, morning, muffled | Get up! You'll be late! The bus doesn't wait for anyone! | yes |
| `bark.mom.school2` | mom | app/public/js/np-life.js:566 — Hall | Where's your bag? Where's your PE kit? Have you got your dinner money? | yes |
| `bark.mom.school3` | mom | app/public/js/np-life.js:566 — Hall, door | Coat! Scarf! Don't forget your lunch! Have a good day! | yes |
| `bark.mom.tea1` | mom | app/public/js/np-life.js:565 — Kitchen, 17:30 to 18:30, the player upstairs, muffled | Tea's ready! Come down before it goes cold! | yes |
| `bark.mom.tea2` | mom | app/public/js/np-life.js:565 — Same | Wash your hands and come and sit down! | yes |
| `bark.mom.tea3` | mom | Catalogue only; trigger not found — Second call after 60 seconds | I'm not calling again! It's on the table! | yes |
| `bark.mom.tea4` | mom | app/public/js/np-life.js:565 — Kitchen, player in the room | Sit down, love. Eat it while it's hot. | yes |
| `bark.mom.tea5` | mom | app/public/js/np-life.js:565 — At the table | Ah, that's what I like to see. A clean plate. | yes |
| `bark.mom.tv1` | mom | Catalogue only; trigger not found — Lounge, TV volume high | Turn that down! I can hear it from the kitchen! | yes |
| `bark.mom.tv2` | mom | app/public/js/np-life.js:570 — Lounge | Is that the telly or a rocket launch? | yes |
| `bark.mom.wknd1` | mom | app/public/js/np-life.js:567 — Kitchen, Saturday morning | Pancakes? Who wants pancakes? Don't all shout at once. | yes |
| `bark.mom.wknd2` | mom | app/public/js/np-life.js:568 — Sunday | Roast on at one. Be in for one, not five past. | yes |
| `bf.already.food.otebpt` | mom | app/public/js/season-bonfire.js:319 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:319 | Supper is on the garden table. Help yourself. | missing |
| `bf.carry.food.1ar533q` | mom | app/public/js/season-bonfire.js:321 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:321 | E carries the tray to the little garden table. Gloves on, mind. | missing |
| `bf.cat.check.1q6dwpi` | mom | app/public/js/season-bonfire.js:575 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | The cat is indoors. Keep the bedroom window shut tonight. Give the cat a quiet place to hide when the bangs start. | missing |
| `bf.cat.check.3jrkba` | mom | app/public/js/season-bonfire.js:575 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. | missing |
| `bf.cat.check.p22a1x` | mom | app/public/js/season-bonfire.js:575 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | The cat is indoors. Keep the bedroom window shut for the display. Give the cat a quiet place to hide when the bangs start. | missing |
| `bf.cat.safe.1n6nrdc` | mom | app/public/js/season-bonfire.js:583 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:583 | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. We will feed the cat when the bangs have stopped. | missing |
| `bf.cat.w6iuui` | mom | app/public/js/season-bonfire.js:274 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:274 | The cat is indoors with the curtains shut. Let the cat hide under the bed; keep the noise down in here. No need to pull the cat out. | missing |
| `bf.day.5k1dof` | mom | app/public/js/season-bonfire.js:686 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:686 | Bonfire Night! Potatoes, parkin and warm gloves. The washing is in and Dad has put the whirly line away. Keep the cat indoors. | missing |
| `bf.finale.1gp0jav` | mom | app/public/js/season-bonfire.js:502 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | Ooooh! Look at those gold ones. Like golden rain! | missing |
| `bf.gloves.wait.prep.8fedwg` | mom | app/public/js/season-bonfire.js:252 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:252 | Hat, gloves, wellies ready for Bonfire Night. Do the Firework Code with Dad before the sparklers. | missing |
| `bf.gloves.wait.wmjtee` | mom | app/public/js/season-bonfire.js:252 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:252 | Hat, gloves, wellies. It will be cold tonight. Do the Firework Code with Dad before the sparklers. | missing |
| `bf.mom.talk.1ypwr09` | mom | app/public/js/season-bonfire.js:742 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:742 | Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Then warm clothes on. No cold fingers tonight. | missing |
| `bf.mom.talk.late.1ogjaal` | mom | app/public/js/season-bonfire.js:741 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:741 | It is getting late. Help me put the supper things away, then off to bed. | missing |
| `bf.mom.talk.prep.ouvann` | mom | app/public/js/season-bonfire.js:742 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:742 | Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Have warm clothes ready for Bonfire Night. No cold fingers when we watch the display. | missing |
| `bf.parkin.tzx22w` | mom | app/public/js/season-bonfire.js:220 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:220 | Sticky ginger cake. Best made a day or two ahead. There is treacle toffee too. You can help with the potatoes; I do the hot oven and hot sugar. | missing |
| `bf.sparkler.gloves.hhvm6u` | mom | app/public/js/season-bonfire.js:262 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:262 | Gloves first! They are on the stool by the back door. | missing |
| `bf.supper.1cixt9h` | mom | app/public/js/season-bonfire.js:213 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:213 | Cheese and beans in your jacket potato? Parkin in the tin, treacle toffee on the plate. Mind your teeth. Hot sugar is my job, thank you. | missing |
| `c1.bed.done` | mom | app/public/js/np-life.js:693 — Bed complete | Hospital corners. Nearly. That's an improvement. | yes |
| `c1.bed.give` | mom | app/public/js/np-life.js:541, app/public/js/np-life.js:692 — Bed objective starts, Mom pops her head round the door | Now the bed. And a duvet in a heap is not a made bed, before you try it. | yes |
| `c1.bin.done` | mom | app/public/js/np-life.js:694 — Bin complete, bag in the kitchen bin | Thank you. See? You're a natural. Don't let it go to your head. | yes |
| `c1.bin.give` | mom | app/public/js/np-life.js:541, app/public/js/np-life.js:693 — Bin objective starts | And that bin bag is going downstairs before it grows legs. | yes |
| `c1.car.engine` | mom | app/public/js/np-life.js:694 — In the kitchen when the car pulls up outside | That'll be your father. Oh, he's early. Go and see what he wants. | yes |
| `c1.logon.mom` | mom | app/public/js/np-life.js:697 — Mom pops in as JackNet logon appears | Right. Don't be on it all day. And if you need a break, come and find me. | yes |
| `c1.mom.carry` | mom | app/public/js/np-life.js:724 — Mom in the hall at the foot of the stairs | Careful, careful. Not on the paintwork! | yes |
| `c1.mom.carry2` | mom | app/public/js/np-life.js:724 — A second pass through the hall | Honestly, you'd think they were moving a piano. | yes |
| `c1.mom.give` | mom | app/public/js/np-life.js:539 — F on Mom, objective meetmom | Right. Room first, then you can do what you like. Clothes in the basket, rubbish in the bin, plates down to the kitchen. | yes |
| `c1.mom.give2` | mom | app/public/js/np-life.js:539 — Same conversation, second page | Do it properly and there's pocket money in it. Do it badly and there's nothing in it but my disappointment. | yes |
| `c1.mom.leave` | mom | app/public/js/np-life.js:539 — Mom walks off, heading downstairs | I'll be down the kitchen if you need me. And I will be checking! | yes |
| `c1.mom.up` | mom | app/public/js/np-life.js:630 — Mom walks into the room, stops at the door; REQUIRED RETAKE: exact words, no extra opening noises; standard neutral British, no regional accent. | Morning, love. Oh, look at this. A tip. An actual tip. | missing |
| `c1.tidy.done` | mom | app/public/js/np-life.js:692 — Tidy complete, Mom checks the room | Well. You can see the carpet. I'd forgotten it was green. | yes |
| `c1.tidy.hint` | mom | Catalogue only; trigger not found — From downstairs, 90 seconds after tidy begins with no progress | Are you tidying or are you reading comics? I can hear the pages turning! | yes |
| `c1.wake.mom.call` | mom | app/public/js/np-life.js:621 — Downstairs, calling up at the very start, muffled through the floor | Up you get! It's a lovely morning and you're wasting it! | yes |
| `c1.wake.mom.room` | mom | Catalogue only; trigger not found — Downstairs, a few seconds later, still muffled | And I know what your room looks like, don't think I don't! | yes |
| `c1.wake.mom.shout` | mom | Catalogue only; trigger not found — Downstairs, if the player is still standing in the doorway after 30 seconds | Breakfast's going cold! I'm not calling again! | yes |
| `c2.carry.mom` | mom | app/public/js/np-life.js:733 — Mom as the player carries the console up | Not the wallpaper, I said! Honestly. | yes |
| `c2.coin` | mom | Catalogue only; trigger not found — First time the player completes a job and pocket money is paid | There's your money. Spend it wisely. Or don't. It's yours. | yes |
| `c2.coin2` | mom | Catalogue only; trigger not found — Second payment | Don't spend it all in one shop. | yes |
| `c2.order.mom` | mom | app/public/js/np-life.js:709 — Mom passing the PC | You're spending your own money, so I'll say nothing. Nothing at all. | yes |
| `c2.phone.mom` | mom | Catalogue only; trigger not found — Mom, approving | Go on, ring one of your mates. But keep it short. | yes |
| `c2.play.mom` | mom | app/public/js/np-life.js:714 — Mom in the doorway while first game is played | Is that the sound of a happy household? It's a nice change. | yes |
| `c2.post.mom` | mom | app/public/js/np-life.js:710 — Mom from the kitchen | It's for you. It's very big. Mind where you put it. | yes |
| `c2.sell.mom` | mom | Catalogue only; trigger not found — Mom sees the player listing old toys | Selling your old toys? That is a good idea. Make a bit of room in here. | yes |
| `c3.ask.mom` | mom | Catalogue only; trigger not found — F on Mom in the kitchen | Phone cable up the stairs? I don't know. You'd have to earn it. And what happens if somebody needs to ring? | yes |
| `c3.ask.mom.yes` | mom | Catalogue only; trigger not found — Good books high enough | I can see you've been trying. All right. But your father has the last word. | yes |
| `c3.ask.mom2` | mom | Catalogue only; trigger not found — Same conversation, Mom's good books too low | Show me a few good days first. A full week would be better. | yes |
| `c3.bill.mom` | mom | Catalogue only; trigger not found — Mom after the bill | From now on, off-peak. After six. And on a Saturday. That's the deal. | yes |
| `c3.dial.mom` | mom | Catalogue only; trigger not found — Mom on the landing | Is that a robot being strangled? Honestly. | yes |
| `c3.end.mom` | mom | Catalogue only; trigger not found — Chapter complete, Mom at the doorway | Well, you've done it. Now don't make me regret it. | yes |
| `c3.hangup.mom` | mom | Catalogue only; trigger not found — Mom, same moment | It's like living with a dial-up goblin. | yes |
| `c3.isp.mom` | mom | Catalogue only; trigger not found — Mom in the doorway | Free internet? Now I've heard everything. | yes |
| `c3.mag.mom` | mom | Catalogue only; trigger not found — Mom on the hall table with the post | There's your magazine. It's got a free disc taped to it. Don't lose it; it's worth more than the magazine. | yes |
| `c3.run.landing` | mom | Catalogue only; trigger not found — Cable reaches the landing | Very neat. Almost professional. | yes |
| `c3.run.trip` | mom | Catalogue only; trigger not found — The sister gets tangled in the cable on the stairs (comic) | Oh, for goodness' sake! Are you all right? Mind the cable! | yes |
| `c4.bon.mom` | mom | app/public/js/season-bonfire.js:253 — Mom, quiet warning | Gloves on! And nobody waves one near anyone else. | yes |
| `c4.bon.mom2` | mom | Catalogue only; trigger not found — Hot dogs | Hot dogs and a cup of tea. That's what Bonfire Night's all about. | yes |
| `c4.dd.mom` | mom | Catalogue only; trigger not found — Mom in the kitchen reading the paper | Everyone's talking about this Daydream thing. I told your father it's a phase. Then he asked to try one. | yes |
| `c4.dd.mom.deal` | mom | Catalogue only; trigger not found — The deal, Mom at the table | Here's the deal. You save half. I'll put in half. But only if I see you keep up the jobs. No slacking. And no whinging. | yes |
| `c4.dd.mom.deal2` | mom | Catalogue only; trigger not found — If good books are high | I'm proud of how hard you've worked. Go on, then. | yes |
| `c4.dd.mom.end` | mom | Catalogue only; trigger not found — Daydream played for ten minutes | Dinner in five. And I mean five. Not "after this level". | yes |
| `c4.dd.mom.no` | mom | Catalogue only; trigger not found — If good books are low | Not yet, love. Show me a few good weeks and we'll talk again. | yes |
| `c4.dd.shop` | mom | Catalogue only; trigger not found — Optional shop window moment | The queue goes round the corner. No, we're not queuing. Pixel Post, remember? | yes |
| `c4.dd.unbox.mom` | mom | Catalogue only; trigger not found — Mom | Please keep the box. I'll need something to put the Christmas decorations in. | yes |
| `c4.game2.mom` | mom | Catalogue only; trigger not found — A second game is ordered | Another one? Is the first one broken already? | yes |
| `c4.hal.mom` | mom | app/public/js/season-halloween.js:1176 — Mom in the kitchen, morning | It's Halloween! Don't worry, I've got a bowl of sweets. Sweets for them, not for you. | yes |
| `c4.hal.treat` | mom | app/public/js/season-halloween.js:989 — Doorbell, trick-or-treaters | Trick or treat, here they come. Be nice. Give them a handful, not the whole bowl. | yes |
| `c4.hal.treat.mom` | mom | app/public/js/season-halloween.js:535 — Mom sees Dad | Put them back! | yes |
| `c4.mill.mom` | mom | Catalogue only; trigger not found — Mom | It's a bug in a computer, not the end of the world. But if it's a good excuse for a party, I'll take it. | yes |
| `c4.mill.mom.cheer` | mom | Catalogue only; trigger not found — At the last second of the countdown; the screen fades to white as the cheer plays (nothing after 31/12/1999 is shown) | Happy New Year, everyone! | yes |
| `c4.mill.mom.yes` | mom | Catalogue only; trigger not found — Mom concedes | Just this once. Now where are my slippers? | yes |
| `c4.start.mom` | mom | Catalogue only; trigger not found — Chapter 4 title card ends, Mom pops her head round | Look at you. A PC, a console and a phone line. What's next, a spaceship? | yes |
| `c4.tourney.end` | mom | Catalogue only; trigger not found — Tourney over | Right, that's enough noise for one night. Thank you for being so lovely and polite. | yes |
| `c4.tourney.mom` | mom | Catalogue only; trigger not found — Mom agrees to friends round | Fine. But shoes off, no running, and I'm doing sandwiches, not a restaurant. | yes |
| `c4.trade.mom` | mom | Catalogue only; trigger not found — Mom sees a swap | A swap? Fair, I hope. Don't let anyone take advantage of you. | yes |
| `c4.xmas.carol` | mom | Catalogue only; trigger not found — Carol singers at the door | Oh, carol singers! How lovely. Quick, find some change. | yes |
| `c4.xmas.eve` | mom | Catalogue only; trigger not found — Christmas Eve, bedtime | Hang your stocking up and off to bed. Father Christmas won't come if you're awake. | yes |
| `c4.xmas.list.mom` | mom | Catalogue only; trigger not found — Mom reading the list | A Daydream. A games magazine subscription. A new game. Is that it? That's not a list, it's a ransom note. | yes |
| `c4.xmas.mom` | mom | Catalogue only; trigger not found — 01/12 morning, Mom | It's December! Time for the lights, the tree and your Christmas list. And a little less moaning. | yes |
| `c4.xmas.morn.mom` | mom | Catalogue only; trigger not found — Mom, a minute after | It's six in the morning. Go back to bed. Oh, who am I kidding? Go on, then. | yes |
| `c4.xmas.thanks` | mom | Catalogue only; trigger not found — After opening presents | Right. Who's making tea? Not me. I'm doing the dinner. | yes |
| `chore.allfour` | mom | app/public/js/np-life.js:543, app/public/js/np-life.js:752 — All four jobs on today's list done | All four done? Well! Here's a little extra for you. | yes |
| `chore.bed.done` | mom | Catalogue only; trigger not found — Bed handed in | Lovely. Looks like a hotel. A cheap one. | yes |
| `chore.bed.give` | mom | Catalogue only; trigger not found — Bed | Make that bed. Pillow, pyjamas, duvet. Properly. | yes |
| `chore.bin.done` | mom | Catalogue only; trigger not found — Bin handed in | Thank you. Smell that? That's fresh air. | yes |
| `chore.bin.give` | mom | Catalogue only; trigger not found — Bin | The bin in your room. Down to the kitchen before it walks. | yes |
| `chore.bins.done` | mom | Catalogue only; trigger not found — Bins done | Thank you. The kitchen smells better already. | yes |
| `chore.bins.give` | mom | Catalogue only; trigger not found — Bins out | The kitchen bin needs taking out. Round the back to the wheelie bin. And a new bag in. | yes |
| `chore.car.done` | mom | Catalogue only; trigger not found — Car done | It's shining. Your father will be thrilled. And suspicious. | yes |
| `chore.car.give` | mom | Catalogue only; trigger not found — Car | Your father's car is a disgrace. Bucket, sponge, rinse. Watch out for the pigeon. | yes |
| `chore.cat.done` | mom | Catalogue only; trigger not found — Cat handed in | There. Fed and happy. Now it's going to want a cuddle. | yes |
| `chore.cat.give` | mom | Catalogue only; trigger not found — Cat | Next door's cat is on your bed again. Feed it, and then please remove it. | yes |
| `chore.cushions.done` | mom | Catalogue only; trigger not found — Cushions done | Like diamonds. Very good. | yes |
| `chore.cushions.give` | mom | Catalogue only; trigger not found — Cushions | The cushions, please. Plump them. On their corners, like diamonds. | yes |
| `chore.hoover.done` | mom | Catalogue only; trigger not found — Hoover done | Spotless. You can see the stripes. | yes |
| `chore.hoover.give` | mom | Catalogue only; trigger not found — Hoover | The vacuum's in the cupboard under the stairs. Every crumb, please. | yes |
| `chore.lawn.done` | mom | Catalogue only; trigger not found — Lawn done | Stripes like a cricket pitch. Very smart. | yes |
| `chore.lawn.give` | mom | Catalogue only; trigger not found — Lawn | The front lawn. Straight stripes, please. Mind the cable. Mind the gnome. | yes |
| `chore.oops` | mom | Catalogue only; trigger not found — A dropped plate or spilt water | Oh, careful! That's the good dish! | yes |
| `chore.plant.done` | mom | Catalogue only; trigger not found — Plant handed in | It looks greener already. Gran would be proud. | yes |
| `chore.plant.give` | mom | Catalogue only; trigger not found — Plant | Gran's spider plant needs a drink. Water it, and talk to it. Gran says it helps. | yes |
| `chore.rate.0a` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating below 70 | Hmm. I'll be checking that. | yes |
| `chore.rate.0b` | mom | app/public/js/np-life.js:746 — Rating below 70 | Did you actually do it, or just move it about? | yes |
| `chore.rate.70a` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 70 to 84 | That'll do. Just about. | yes |
| `chore.rate.70b` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 70 to 84 | Thank you. Eventually. | yes |
| `chore.rate.70c` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 70 to 84 | Was that so hard? Don't answer that. | yes |
| `chore.rate.85a` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 85 to 94 | That's lovely, thank you, love. | yes |
| `chore.rate.85b` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 85 to 94 | See, that wasn't so hard, was it? | yes |
| `chore.rate.85c` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 85 to 94 | Ta, love. You're a star. | yes |
| `chore.rate.95a` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 95 to 100, Mom checks | Ooh! Who are you and what have you done with my real helper? | yes |
| `chore.rate.95b` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 95 to 100 | Gold star. GOLD STAR. | yes |
| `chore.rate.95c` | mom | app/public/js/ch-cat.js:131, app/public/js/np-life.js:746 — Rating 95 to 100 | Well I never. That is PERFECT. | yes |
| `chore.rating.16wxa7r` | mom | app/public/js/ch-cat.js:131 — Server-selected chore rating; app/public/js/ch-cat.js:131 | Did you actually do it or just move it about? | missing |
| `chore.shopping.done` | mom | Catalogue only; trigger not found — Shopping done | Everything where it belongs. And the carrier bags folded. A miracle. | yes |
| `chore.shopping.give` | mom | Catalogue only; trigger not found — Shopping | The shopping needs putting away. Fridge, freezer, cupboard. Not your bedroom. | yes |
| `chore.shout.106ah51` | mom | app/public/js/ch-core.js:144 — Chore completion / reminder; app/public/js/ch-core.js:144 | Ooh, ta! | missing |
| `chore.shout.12cu3fo` | mom | app/public/js/ch-core.js:194 — Chore completion / reminder; app/public/js/ch-core.js:194 | Ta, love. | missing |
| `chore.shout.1lof225` | mom | app/public/js/ch-core.js:547 — Chore completion / reminder; app/public/js/ch-core.js:547 | Those jobs won't do themselves! | missing |
| `chore.shout.1of6vkv` | mom | app/public/js/ch-core.js:153 — Chore completion / reminder; numerical rating stays written; app/public/js/ch-core.js:153 | Have you done ALL your jobs? Who are you and what have you done with my real helper? | missing |
| `chore.shout.1ss7a6t` | mom | app/public/js/ch-core.js:547 — Chore completion / reminder; app/public/js/ch-core.js:547 | I can hear you NOT doing your jobs! | missing |
| `chore.shout.1y83zff` | mom | app/public/js/ch-core.js:144 — Chore completion / reminder; app/public/js/ch-core.js:144 | Thank you! | missing |
| `chore.shout.9bcrpq` | mom | app/public/js/ch-core.js:547 — Chore completion / reminder; app/public/js/ch-core.js:547 | Love? The list on the fridge? Remember the list? | missing |
| `chore.shout.a506t6` | mom | app/public/js/ch-core.js:547 — Chore completion / reminder; app/public/js/ch-core.js:547 | Get off that computer and do your jobs! | missing |
| `chore.shout.bdi29n` | mom | app/public/js/ch-core.js:144 — Chore completion / reminder; app/public/js/ch-core.js:144 | Good helper! | missing |
| `chore.shout.y5q1ps` | mom | app/public/js/ch-core.js:547 — Chore completion / reminder; app/public/js/ch-core.js:547 | Have you done your jobs yet? | missing |
| `chore.shout.zuxo6x` | mom | app/public/js/ch-core.js:144 — Chore completion / reminder; app/public/js/ch-core.js:144 | Ta, love! | missing |
| `chore.streak` | mom | Catalogue only; trigger not found — Daily streak bonus awarded | A bonus! You've done it every day this week. I'm impressed. | yes |
| `chore.sweep.done` | mom | Catalogue only; trigger not found — Sweep done | Lovely and tidy. The neighbours will be jealous. | yes |
| `chore.sweep.give` | mom | Catalogue only; trigger not found — Sweep | The drive's covered in leaves. Brush them up, dustpan, dustbin. | yes |
| `chore.table.done` | mom | Catalogue only; trigger not found — Table done | Perfect. Everything in the right place. For once. | yes |
| `chore.table.give` | mom | Catalogue only; trigger not found — Lay the table | Lay the table for tea, please. Four places. And the ketchup, for your father. | yes |
| `chore.tidy.done` | mom | Catalogue only; trigger not found — Tidy handed in | The carpet's visible again. Marvellous. | yes |
| `chore.tidy.give` | mom | app/public/js/np-life.js:541 — Mom on the list, tidy | Your room, please. Clothes in the basket, rubbish in the bin, plates down to the kitchen. | yes |
| `chore.videos.done` | mom | Catalogue only; trigger not found — Videos done | That's better. I can find the film I want now. | yes |
| `chore.videos.give` | mom | Catalogue only; trigger not found — Videos | The videos are all over the floor. Back on the shelf, and rewind them. Be kind. | yes |
| `chore.washup.done` | mom | Catalogue only; trigger not found — Washing up handed in | Not a plate left. You're a lifesaver. | yes |
| `chore.washup.give` | mom | Catalogue only; trigger not found — Washing up | The washing-up, please. Hot water, a squirt of liquid, and the pans too. | yes |
| `dialer.01632960777.1wxgtgo` | mom | Catalogue only; trigger not found — JackOS Phone Dialer call; app/public/js/apps-programs.js:2132 | Have you done your homework? | missing |
| `dialer.01632960777.n7bz0i` | mom | app/public/js/apps-programs.js:2132 — JackOS Phone Dialer call; app/public/js/apps-programs.js:2132 | Hello? Is everything alright? You're not on the Internet, are you? I can't ring home when you're on the Internet! | missing |
| `house.moment.14u1i62` | mom | app/public/js/hs-life.js:71 — Time-of-day house shout; app/public/js/hs-life.js:71 | Get off the Internet! I need to ring your Nan! | missing |
| `house.moment.18qfxaa` | mom | app/public/js/hs-life.js:72 — Time-of-day house shout; app/public/js/hs-life.js:72 | I'm popping to the shops. Do you want anything? ...Besides a Daydream. | missing |
| `house.moment.1dd6ufc` | mom | app/public/js/hs-life.js:68 — Time-of-day house shout; app/public/js/hs-life.js:68 | It's a school night. Not too late, eh? | missing |
| `house.moment.1gm6uua` | mom | app/public/js/hs-life.js:71 — Time-of-day house shout; app/public/js/hs-life.js:71 | Are you on that computer AGAIN? | missing |
| `house.moment.1hou2xu` | mom | app/public/js/hs-life.js:64 — Time-of-day house shout; app/public/js/hs-life.js:64 | You'll be late for school! Have you had any breakfast? | missing |
| `house.moment.1ibhhmo` | mom | app/public/js/hs-life.js:64 — Time-of-day house shout; app/public/js/hs-life.js:64 | Are you up? It's gone eight! Lazybones! | missing |
| `house.moment.1kgk76z` | mom | app/public/js/hs-life.js:69 — Time-of-day house shout; app/public/js/hs-life.js:69 | Turn that light off, love, it's late. | missing |
| `house.moment.1qhk3rh` | mom | app/public/js/hs-life.js:67 — Time-of-day house shout; app/public/js/hs-life.js:67 | Set the table please, love! | missing |
| `house.moment.1qsooir` | mom | app/public/js/hs-life.js:67 — Time-of-day house shout; app/public/js/hs-life.js:67 | Tea in five minutes! Wash your hands! | missing |
| `house.moment.1trq0u8` | mom | app/public/js/hs-life.js:66 — Time-of-day house shout; app/public/js/hs-life.js:66 | Come and get your washing, it's on the stairs! | missing |
| `house.moment.1wxgtgo` | mom | app/public/js/apps-programs.js:2132, app/public/js/hs-life.js:66 — Time-of-day house shout; app/public/js/hs-life.js:66 | Have you done your homework? | missing |
| `house.moment.hypeuv` | mom | app/public/js/hs-life.js:65 — Time-of-day house shout; app/public/js/hs-life.js:65 | Why aren't you at school? ...Oh, it's an INSET day. Right. Well don't sit on that computer all day. | missing |
| `house.moment.p8fwe0` | mom | app/public/js/hs-life.js:64 — Time-of-day house shout; app/public/js/hs-life.js:64 | Have you seen my car keys? | missing |
| `house.moment.qrvops` | mom | app/public/js/hs-life.js:73 — Time-of-day house shout; app/public/js/hs-life.js:73 | We're going to Gran's for Sunday dinner at one! Wear something clean! | missing |
| `house.moment.uar218` | mom | app/public/js/hs-life.js:67 — Time-of-day house shout; app/public/js/hs-life.js:67 | TEA'S READY! It'll go cold! | missing |
| `house.moment.y9voiz` | mom | app/public/js/hs-life.js:66 — Time-of-day house shout; app/public/js/hs-life.js:66 | Your friend's Mom rang. Are you going round there? | missing |
| `house.moment.zpcfic` | mom | app/public/js/hs-life.js:68 — Time-of-day house shout; app/public/js/hs-life.js:68 | Do you want a cup of tea? | missing |
| `house.voice.19srweb` | mom | app/public/js/hs-life.js:388 — House welcome, shout or event; app/public/js/hs-life.js:388 | Is that you? Tea's nearly ready! | missing |
| `house.voice.1o2t39k` | mom | app/public/js/hs-life.js:376 — House welcome, shout or event; app/public/js/hs-life.js:376 | School! Shoes on, bag ready, out you go! | missing |
| `house.voice.1p91ht0` | mom | app/public/js/hs-life.js:376 — House welcome, shout or event; app/public/js/hs-life.js:376 | Tea is ready! Come and get it before it goes cold! | missing |
| `house.voice.1pe2qdm` | mom | app/public/js/hs-life.js:388 — House welcome, shout or event; app/public/js/hs-life.js:388 | Is that you coming down? Put the kettle on, love! | missing |
| `house.voice.1wn5usl` | mom | app/public/js/hs-life.js:115 — House welcome, shout or event; app/public/js/hs-life.js:115 | Wrong number. AGAIN. Someone wanting a Chinese. | missing |
| `house.voice.52jrk6` | mom | app/public/js/hs-life.js:115 — House welcome, shout or event; app/public/js/hs-life.js:115 | That was your friend! Are you coming out? | missing |
| `house.voice.6sjah6` | mom | app/public/js/hs-life.js:376 — House welcome, shout or event; app/public/js/hs-life.js:376 | Saturday pocket money! Check with me when your jobs are done. | missing |
| `house.voice.c27ds0` | mom | app/public/js/hs-life.js:239 — House welcome, shout or event; app/public/js/hs-life.js:239 | Here's your pocket money. Five pounds. Don't spend it all on games magazines. | missing |
| `house.voice.dg5evy` | mom | app/public/js/hs-life.js:115 — House welcome, shout or event; app/public/js/hs-life.js:115 | That was your Gran. She says you never ring her. | missing |
| `house.voice.v8d3ia` | mom | app/public/js/hs-life.js:376 — House welcome, shout or event; app/public/js/hs-life.js:376 | Time for bed. Save your game. | missing |
| `house.voice.y87tqf` | mom | app/public/js/hs-life.js:115 — House welcome, shout or event; app/public/js/hs-life.js:115 | Was that the phone? Did you not hear it?! | missing |
| `house.voice.zrj5mn` | mom | app/public/js/hs-life.js:217 — House welcome, shout or event; app/public/js/hs-life.js:217 | Ooh, have you done ALL your jobs? Who are you and what have you done with my real helper? | missing |
| `hw.mom.clocks.1ekmlu0` | mom | app/public/js/season-halloween.js:1176 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1174 | And the clocks went back last night. An extra hour in bed, and I'm STILL tired. | missing |
| `hw.mom.door.7duwbw` | mom | app/public/js/season-halloween.js:990 — Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | Door! I've got my hands full. | missing |
| `hw.mom.door.iezetz` | mom | app/public/js/season-halloween.js:990 — Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | Door! More of them! | missing |
| `hw.mom.door.le11aj` | mom | app/public/js/season-halloween.js:990 — Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | That'll be the Witch Brigade again. Door! | missing |
| `hw.mom.door.p08w90` | mom | app/public/js/season-halloween.js:990 — Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | Can you get that? | missing |
| `hw.mom.door2.1c95o5l` | mom | app/public/js/season-halloween.js:991 — Halloween, physical preparation / door; app/public/js/season-halloween.js:991 | They're still waiting at the door! | missing |
| `hw.mom.five.1eab0yr` | mom | app/public/js/season-halloween.js:1100 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1098 | Five lots! The neighbours will think we're ever so organised. | missing |
| `hw.mom.hand.1x0lkzj` | mom | app/public/js/season-halloween.js:745 — Halloween, physical preparation / door; app/public/js/season-halloween.js:745 | Away from your hand! Saw AWAY from your hand. | missing |
| `hw.mom.lead.1roevnu` | mom | app/public/js/season-halloween.js:1175 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1173 | I've got a pumpkin for you two to carve. It's on the kitchen table. Newspaper down first, please! | missing |
| `hw.mom.porch.d7yfts` | mom | app/public/js/season-halloween.js:1090 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1088 | Porch light on, love. No light, no trick-or-treaters. That's the rule. | missing |
| `hw.mom.tail.ourgck` | mom | app/public/js/season-halloween.js:1178 — Halloween, physical preparation / door; app/public/js/season-halloween.js:1176 | Look at the state of this hall. Wrappers everywhere! Bin, please. And who ate all the Choc Bits? | missing |
| `st.opening.bed.hra5bz` | mom | app/public/js/st-engine.js:139 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:139 | Much better. Now straighten that bed, please. | missing |
| `st.opening.bin.lnlsdo` | mom | app/public/js/st-engine.js:140 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:140 | One last job: bring the bin bag down to the kitchen. | missing |
| `st.opening.meetmom.p0ty2g` | mom | app/public/js/st-engine.js:137 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:137 | Morning, love. Room first, then you can do what you like. Clothes in the basket, rubbish in the bin, plates down to the kitchen. | missing |
| `st.opening.tidy.1d8mogt` | mom | app/public/js/st-engine.js:138 — Story fallback when family cannot deliver in person; app/public/js/st-engine.js:138 | First things first: clothes in the basket, rubbish in the bin. And bring your dishes down! | missing |
| `dialer.01632960222.fwuct7` | Nan | app/public/js/apps-programs.js:2133 — JackOS Phone Dialer call | Hello? HELLO? Who is it? Speak up! | uncast |
| `dialer.01632960222.g5ml94` | Nan | app/public/js/apps-programs.js:2133 — JackOS Phone Dialer call | Oh it's you! Are you eating properly? I've knitted you a jumper. It's brown. | uncast |
| `dialer.01632960222.s416er` | Nan | app/public/js/apps-programs.js:2133 — JackOS Phone Dialer call | I'll put a fiver in your birthday card. Don't tell your mother. | uncast |
| `phone.in.6.18nmdv1` | Nan | app/public/js/hs-life.js:95 — Incoming landline call | Hello duck, it's your Nan. Did you get the card? There's a postal order in it. Don't lose it. | uncast |
| `phone.in.6.reply.0.bbp2o` | Nan | app/public/js/hs-life.js:95 — Caller responds to player choice | You're welcome, love. Spend it on something nice. Not sweets. Bye bye now! | uncast |
| `phone.out.01632960584.tfah21` | Nan | app/public/js/hs-life.js:175 — Outgoing landline call | Hello duck! Oh how lovely. I've just put the kettle on. Did you get my card? There's a postal order in it. Don't lose it. | uncast |
| `dialer.100.16zk9th` | Operator | app/public/js/apps-programs.js:2135 — JackOS Phone Dialer call | And who is paying for this call, caller? | uncast |
| `dialer.100.rxgbhy` | Operator | app/public/js/apps-programs.js:2135 — JackOS Phone Dialer call | Operator services, how can I help? | uncast |
| `game.critters.clockmaker.12oiv44` | Pocket Critters clockmaker | app/public/js/rm-g-mon.js:1173 — Pocket Critters character dialogue | {clockmaker}: The old clock in LOST SOCK TUNNEL has slept for years. Earn the KILN BADGE and I will lend you my winding key. | uncast |
| `game.critters.clockmaker.1mmoikh` | Pocket Critters clockmaker | app/public/js/rm-g-mon.js:1177 — Pocket Critters character dialogue | {clockmaker}: ALARMAGEDDON waits northeast in LOST SOCK TUNNEL. Wind it with A. Save your cakes and cubes; legends have never heard of bedtime. | uncast |
| `game.critters.clockmaker.1nvbdek` | Pocket Critters clockmaker | app/public/js/rm-g-mon.js:1176 — Pocket Critters character dialogue | {clockmaker}: Four badges! Take my WINDING KEY, five CRITTER CUBES and two SQUASHES. The clock sleeps in the northeast corner of LOST SOCK TUNNEL. | uncast |
| `game.critters.momTalk.10ppabs` | Pocket Critters momTalk | app/public/js/rm-g-mon.js:1190 — Pocket Critters character dialogue | MOM: Morning, love! PROFESSOR {professor} popped round. He's waiting for you at his lab. Off you go! | uncast |
| `game.critters.momTalk.5awto5` | Pocket Critters momTalk | app/public/js/rm-g-mon.js:1193 — Pocket Critters character dialogue | MOM: There. All better. Now don't stay out too late! | uncast |
| `game.critters.momTalk.c02uhv` | Pocket Critters momTalk | app/public/js/rm-g-mon.js:1191 — Pocket Critters character dialogue | MOM: JACK! You look shattered. Sit down and have a rest, and give your critters a cuddle. | uncast |
| `game.critters.nurseTalk.175e02a` | Pocket Critters nurseTalk | app/public/js/rm-g-mon.js:1255 — Pocket Critters character dialogue | NURSE {nurse}: Come back any time! | uncast |
| `game.critters.nurseTalk.1c3ouxn` | Pocket Critters nurseTalk | app/public/js/rm-g-mon.js:1256 — Pocket Critters character dialogue | NURSE {nurse}: Pop them in the machine... | uncast |
| `game.critters.nurseTalk.2ket6k` | Pocket Critters nurseTalk | app/public/js/rm-g-mon.js:1258 — Pocket Critters character dialogue | NURSE {nurse}: All done! Your critters are fighting fit. Bye bye! | uncast |
| `game.critters.profTalk.13863ja` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1213 — Pocket Critters character dialogue | PROF {professor}: Some critters only live in the MOSS VERSION, you know. And some only change after a trip down a LINK CABLE! Try the CABLE CLUB at the CRITTER CENTRE. | uncast |
| `game.critters.profTalk.1ccqlkh` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1212 — Pocket Critters character dialogue | PROF {professor}: How's your CRITTERDEX? {dynamic} caught! Brilliant work. Keep it up! | uncast |
| `game.critters.profTalk.1l0gk44` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1213 — Pocket Critters character dialogue | PROF {professor}: Some critters only live in the PUDDLE VERSION, you know. And some only change after a trip down a LINK CABLE! Try the CABLE CLUB at the CRITTER CENTRE. | uncast |
| `game.critters.profTalk.1oeygip` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1197 — Pocket Critters character dialogue | PROF {professor}: Ah, JACK! On the table are three CRITTER CUBES, each with a critter inside. Go on, pick one! | uncast |
| `game.critters.profTalk.bjuycr` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1203 — Pocket Critters character dialogue | PROF {professor}: A MOSS BADGE! Well done, JACK. You know, there's a CRITTER CUBE nobody ever picked. {dynamic} would love a trainer like you. | uncast |
| `game.critters.profTalk.cpgo2z` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1212 — Pocket Critters character dialogue | PROF {professor}: How's your CRITTERDEX? {dynamic} caught! Keep at it. The WHISPERING WOODS are full of them. | uncast |
| `game.critters.profTalk.ecuwa2` | Pocket Critters profTalk | app/public/js/rm-g-mon.js:1212 — Pocket Critters character dialogue | PROF {professor}: How's your CRITTERDEX? {dynamic} caught! All of them! You're a proper critter expert! | uncast |
| `game.critters.rivalTalk.16q8mo2` | Pocket Critters rivalTalk | app/public/js/rm-g-mon.js:1216 — Pocket Critters character dialogue | JACKK: The Prof said I could have one too. But you can choose first. Go on. (Not that one. Joking!) | uncast |
| `game.critters.rivalTalk.5ibx58` | Pocket Critters rivalTalk | app/public/js/rm-g-mon.js:1217 — Pocket Critters character dialogue | JACKK: My critter is going to be the best one in the whole of Moss Town! | uncast |
| `game.critters.shopTalk.1k83bb8` | Pocket Critters shopTalk | app/public/js/rm-g-mon.js:1270 — Pocket Critters character dialogue | Here you go: one {dynamic}. {dynamic} | uncast |
| `game.critters.shopTalk.1wp6lrz` | Pocket Critters shopTalk | app/public/js/rm-g-mon.js:1273 — Pocket Critters character dialogue | SHOPKEEPER: Ta-ra! | uncast |
| `game.critters.shopTalk.1yuou1s` | Pocket Critters shopTalk | app/public/js/rm-g-mon.js:1268 — Pocket Critters character dialogue | SHOPKEEPER: Ooh, you can't afford that, love. | uncast |
| `game.critters.shopTalk.sdoix6` | Pocket Critters shopTalk | app/public/js/rm-g-mon.js:1262 — Pocket Critters character dialogue | SHOPKEEPER: Hiya! What can I get you? | uncast |
| `dialer.01632960777.1gm01gb` | Receptionist | app/public/js/apps-programs.js:2132 — JackOS Phone Dialer call | Good afternoon, putting you through... | uncast |
| `dialer.01632960888.1w08cme` | Recorded voice | app/public/js/apps-programs.js:2134 — JackOS Phone Dialer call | For this week's films, press 1. For prices, press 2. For a very long wait, press 3. | uncast |
| `dialer.01632960888.ti8ori` | Recorded voice | app/public/js/apps-programs.js:2134 — JackOS Phone Dialer call | Welcome to the Multiplex information line. Please choose from the following options. | uncast |
| `dialer.1471.1gy7vbz` | Recorded voice | app/public/js/apps-programs.js:2137 — JackOS Phone Dialer call | Telephone number... 01632 960123... called today... at... 4:42 pm. | uncast |
| `bark.sis.bed1` | sister | app/public/js/np-life.js:592 — 20:30 | I'm not tired! I don't wanna go to bed! | yes |
| `bark.sis.bed2` | sister | app/public/js/np-life.js:592 — 21:00 | Can I have a drink of water? And a story? And the landing light? | yes |
| `bark.sis.cut1` | sister | Catalogue only; trigger not found — Dark | Mom? It's dark! I don't like it! | yes |
| `bark.sis.cut2` | sister | Catalogue only; trigger not found — Lights back | They're back! It's magic! | yes |
| `bark.sis.line1` | sister | Catalogue only; trigger not found — Hall, ringing phone | I'll get it! I'll get it! Hello? Who's calling? | yes |
| `bark.sis.line2` | sister | Catalogue only; trigger not found — Hall | Mom, it's for you. Someone who talks a lot. | yes |
| `bark.sis.mess1` | sister | Catalogue only; trigger not found — Hall | Mom! They left their socks in the lounge again! | yes |
| `bark.sis.mess2` | sister | app/public/js/np-life.js:591 — Hall | I tidied my room. Look. I've done everything. Where's my pound? | yes |
| `bark.sis.react.console` | sister | app/public/js/np-life.js:555, app/public/js/np-life.js:594 — Beside the console | Can I be player two? I'll let you win. Maybe. | yes |
| `bark.sis.react.drawing` | sister | app/public/js/np-life.js:555, app/public/js/np-life.js:594 — Showing a drawing | Look at my picture! It's a dog. Or a horse. You choose. | yes |
| `bark.sis.react.lounge` | sister | app/public/js/np-life.js:591 — Hall | Nobody ever plays with me! | yes |
| `bark.sis.react.peek` | sister | app/public/js/np-life.js:593 — Doorway | I'm not spying. I'm just standing here. Normally. | yes |
| `bark.sis.school1` | sister | app/public/js/np-life.js:588 — Hall | I can't find my shoe. It was right there. Someone moved it. | yes |
| `bark.sis.school2` | sister | app/public/js/np-life.js:588 — Kitchen | I don't wanna go. I've got a spelling test. | yes |
| `bark.sis.tea1` | sister | app/public/js/np-life.js:587 — At the table | I don't like the green bits. Can I have just the orange bits? | yes |
| `bark.sis.tea2` | sister | app/public/js/np-life.js:587 — At the table | Can I leave the table? I've finished. I mean I've pushed it round. | yes |
| `bark.sis.tea3` | sister | Catalogue only; trigger not found — At the table, a sibling quarrel | They're looking at me! Mom, they're looking at me! | yes |
| `bark.sis.tv1` | sister | app/public/js/np-life.js:590 — Lounge | I want cartoons! It's my turn! You had it yesterday! | yes |
| `bark.sis.tv2` | sister | app/public/js/np-life.js:590 — Lounge | I can't hear it. Turn it up. Turn it UP. | yes |
| `bark.sis.wknd1` | sister | app/public/js/np-life.js:589 — Saturday morning | Cartoons! Saturday morning telly! The best! | yes |
| `bark.sis.wknd2` | sister | app/public/js/np-life.js:589 — Sunday | Can we go to the park? Can we? Pleeease? | yes |
| `bf.already.guy.1f4ztpk` | sister | app/public/js/season-bonfire.js:319 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:319 | Our Guy is sitting in the garden, guarding the parkin. | missing |
| `bf.carry.guy.13p6v71` | sister | app/public/js/season-bonfire.js:320 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:320 | E carries him out to his garden chair. Careful with his head! | missing |
| `bf.display.done.1lj1fzs` | sister | app/public/js/season-bonfire.js:477 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:477 | The golden one was my favourite! | missing |
| `bf.guy.135iti6` | sister | app/public/js/season-bonfire.js:313 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:313 | Dad said we could have his OLD clothes. Not his work trousers. I have checked twice. | missing |
| `bf.guy.ready.16vdl6h` | sister | app/public/js/season-bonfire.js:188 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:188 | He looks just like Dad on a Sunday. Can we keep him? Penny for the Guy! He only takes pretend pennies. | missing |
| `bf.sister.talk.1gj0870` | sister | app/public/js/season-bonfire.js:743 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:743 | Will you help me stuff the Guy? Dad's old shirt is on the kitchen table. He says it was fashionable once. | missing |
| `bf.sister.talk.1kq0e9g` | sister | app/public/js/season-bonfire.js:743 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:743 | Remember, remember, the fifth of November! I remembered. Dad forgot where he put his hat. | missing |
| `bf.wheel.qsib2` | sister | app/public/js/season-bonfire.js:502 — Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | A Catherine wheel! It is doing cartwheels! | missing |
| `c1.lad.sis.in` | sister | app/public/js/np-life.js:741 — Bedroom door bursts open while the Game Lad is on | Ooh, what are you playing? Can I have a go? Go on, go on, go on! | yes |
| `c1.lad.sis.no` | sister | app/public/js/np-life.js:741 — After the player's reply, in the doorway | You never let me do anything! I'm telling! | yes |
| `c1.lad.sis.out` | sister | app/public/js/np-life.js:741 — Walking away down the landing | I'm telling Mom it's all your fault anyway. | yes |
| `c1.logon.sis` | sister | app/public/js/np-life.js:697 — The sister peers round the door as the desktop appears | Wow. Can I come in? Pleeeease? When can I have a go? | yes |
| `c1.sis.stairs` | sister | app/public/js/np-life.js:726 — The sister blocks the landing when the player carries a part | Is that a computer? Is it mine? I want a go! It's not fair! | yes |
| `c1.sis.stairs2` | sister | app/public/js/np-life.js:726 — After the player squeezes past | Fine. I'll just sit on the stairs and watch. | yes |
| `c2.play.sis` | sister | app/public/js/np-life.js:714 — Sister behind the player at the first game's title screen | Whoa. Is that the actual game? It looks like a film! | yes |
| `c2.post.sis` | sister | app/public/js/np-life.js:710 — Sister runs through the hall after the letterbox rattles | Mom! Mom! Something's come! It's a big box! | yes |
| `c2.sell.sis` | sister | Catalogue only; trigger not found — The sister sees a particular toy on the list | That's mine! You said I could have that! | yes |
| `c2.sell.sold` | sister | Catalogue only; trigger not found — Item sells, sister overhears | Ha ha, someone bought your teddy. | yes |
| `c2.unbox.sis` | sister | app/public/js/np-life.js:711 — Sister hovering over the box | Can I carry it? I'll be really careful. Promise. | yes |
| `c3.cable.sis` | sister | Catalogue only; trigger not found — Sister sees the coil | What's that for? Is it a skipping rope? | yes |
| `c3.dial.sis` | sister | Catalogue only; trigger not found — Sister at the door as the modem screeches | Whoa. That's the loudest noise I've ever heard. | yes |
| `c3.mag.sis` | sister | Catalogue only; trigger not found — The sister waving the mag | I've had a look at the pictures, and it's got a free sticker. I'm having the sticker. | yes |
| `c3.run.trip.sis` | sister | Catalogue only; trigger not found — Same moment | Whoa! Nobody told me about the wire! | yes |
| `c4.bon.sis` | sister | app/public/js/season-bonfire.js:338 — The sister writes in the air with her sparkler | Look! I'm writing in the air! Can you read it? | yes |
| `c4.dd.first` | sister | Catalogue only; trigger not found — Sister at the first level | It's so shiny. It looks like a real film. | yes |
| `c4.dd.parcel` | sister | Catalogue only; trigger not found — Sister at the door when the parcel arrives | IT'S HERE! IT'S HERE! IT'S THE BIG ONE! | yes |
| `c4.dd.sis` | sister | Catalogue only; trigger not found — The sister overhears the plan | Can I have a go when you get it? I'll be really good. I'll do your jobs. | yes |
| `c4.hal.night2` | sister | app/public/js/season-halloween.js:1090 — The sister hiding behind the settee | I'm not scared. I'm just hiding. For fun. | yes |
| `c4.hal.sis` | sister | app/public/js/season-halloween.js:1177 — The sister in costume at the door; REQUIRED RETAKE: exact words, no extra opening noises; standard neutral British, no regional accent. | Wooooo! I'm a ghost! Do I look scary? Say yes. | missing |
| `c4.mag.sis` | sister | Catalogue only; trigger not found — The sister sees the magazine cover | Is that the new one? Let me see! Let me see! | yes |
| `c4.mill.sis` | sister | Catalogue only; trigger not found — The sister | Can I stay up until midnight? Pleeease? It's the millennium! | yes |
| `c4.mill.sis.cheer` | sister | Catalogue only; trigger not found — Same moment | It's the new millennium! It's the future! | yes |
| `c4.tourney.sis` | sister | Catalogue only; trigger not found — The sister wants in | I want to play! I'll be quiet! I'll be good! Pleeease! | yes |
| `c4.xmas.morn` | sister | Catalogue only; trigger not found — 25/12 very early, sister at the door | HE'S BEEN! HE'S BEEN! GET UP! GET UP! | yes |
| `c4.xmas.sis` | sister | Catalogue only; trigger not found — The sister and the tree | Can I put the star on? Can I? Can I? It's my turn this year! | yes |
| `house.moment.1ci1e5k` | sister | app/public/js/hs-life.js:68 — Time-of-day house shout; app/public/js/hs-life.js:68 | Can I have a go on the Game Lad? Pleeeeease? | missing |
| `house.moment.vtvqfy` | sister | app/public/js/hs-life.js:66 — Time-of-day house shout; app/public/js/hs-life.js:66 | MOM! They're being annoying! | missing |
| `hw.sis.bat.1p6s4es` | sister | app/public/js/season-halloween.js:434 — Halloween, physical preparation / door; app/public/js/season-halloween.js:434 | Higher! No, lower! Perfect. It's watching you. | missing |
| `hw.sis.ghost.b0szgt` | sister | app/public/js/season-halloween.js:434 — Halloween, physical preparation / door; app/public/js/season-halloween.js:434 | Now the whole street can see him. His name is Gerald. | missing |
| `hw.sis.scoop.j7h9ib` | sister | app/public/js/season-halloween.js:746 — Halloween, physical preparation / door; app/public/js/season-halloween.js:746 | Ewww! It looks like brains. Can I keep the seeds? | missing |
| `phone.out.01632960500.k9igoj` | The doctors | app/public/js/hs-life.js:182 — Outgoing landline call | "Surgery. The next appointment is in three weeks." You're not even ill. You put the phone down. | uncast |
| `phone.out.01632960888.1iib9g7` | The Golden Dragon | app/public/js/hs-life.js:180 — Outgoing landline call | "Golden Dragon, can I help you?" ...You panic and order prawn crackers to be delivered to {mate1}'s house. Then you put the phone down. | uncast |
| `phone.out.01632960400.n8bayd` | The Odyssey Pictures | app/public/js/hs-life.js:181 — Outgoing landline call | Recorded message: "Welcome to the Odyssey Pictures. For this week's films, press 1. To book, hold the line. You are caller number... forty... seven." | uncast |
| `phone.out.123.igf9ib` | The speaking clock | app/public/js/hs-life.js:172 — Outgoing landline call | At the third stroke, it will be 12 {dynamic} and {dynamic} seconds. Beep. Beep. Beep. | uncast |
| `dialer.01632960555.m5er5q` | Tony | app/public/js/apps-programs.js:2131 — JackOS Phone Dialer call | Tony's Pizza, what can I get you? | uncast |
| `dialer.01632960555.wil44o` | Tony | app/public/js/apps-programs.js:2131 — JackOS Phone Dialer call | Thirty minutes. Cash on the door. Is your Mom paying? | uncast |
| `computer.era-sites-witch.18l5uy2` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Welcome... to Jackbo. | uncast |
| `computer.era-sites-witch.1aabsn0` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Yes. This is Jackbo. | uncast |
| `computer.era-sites-witch.1fz0xp2` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | The possible is ALSO possible at Jackbo. | uncast |
| `computer.era-sites-witch.1sj3252` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | You can do ANYTHING at Jackbo. | uncast |
| `computer.era-sites-witch.1tg9qqn` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Anything at all. | uncast |
| `computer.era-sites-witch.1x0gxzh` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | This is Jackbo. Welcome. | uncast |
| `computer.era-sites-witch.6mw5x8` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Please wait. Anything takes a while. | uncast |
| `computer.era-sites-witch.8jlcav` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Welcome. | uncast |
| `computer.era-sites-witch.b4575x` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | And welcome to YOU, who have come to Jackbo. | uncast |
| `computer.era-sites-witch.bxmwqe` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Welcome to Jackbo. | uncast |
| `computer.era-sites-witch.dpk6mb` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Anything is possible at Jackbo. | uncast |
| `computer.era-sites-witch.fzgsah` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | The impossible is possible at Jackbo. | uncast |
| `computer.era-sites-witch.howbve` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | The only limit... is yourself. | uncast |
| `computer.era-sites-witch.kw8qot` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | Jackbo is still loading anything. | uncast |
| `computer.era-sites-witch.uwom4d` | Witch | app/public/js/era-sites-witch.js:170 — Existing computer / fake-web spoken character; voice choice awaits Jack | This... is Jackbo. | uncast |
| `game.wobble.speaker.gc7013` | Wobble Party COUNT CRUMBLE | app/public/js/rm-g-party.js:1208 — Wobble Party character dialogue | SEVEN COINS FOR CRUMBS ON MY CARPET! AND DO NOT ASK FOR A BISCUIT RECEIPT. | uncast |
| `game.wobble.speaker.wazk9d` | Wobble Party SHOP | app/public/js/rm-g-party.js:1145 — Wobble Party character dialogue | {dynamic} BUYS A {dynamic}. | uncast |

## Static expressions needing review

- app/public/js/ch-core.js:218: `HouseLife.voice('MOM', text, ms)`
- app/public/js/hs-life.js:79: `voice(w, cast(t))`

These two variable dispatchers forward lines already enumerated at the chore/shout pools. They contain no additional authored sentence. The inventory includes structured NPC dialogue and script-only phone conversations; it does not assign voices to uncast people. Arbitrary prose with embedded quotations and user-authored posts are not recording requests.

## Every rewritten family line

| Source | Before | After |
|---|---|---|
| app/public/js/hs-life.js:63 | {me.NAME}! You'll be late for school! Have you had any breakfast? | You'll be late for school! Have you had any breakfast? |
| app/public/js/hs-life.js:63 | {me}, are you up? It's gone eight! Lazybones! | Are you up? It's gone eight! Lazybones! |
| app/public/js/hs-life.js:63 | {me}, have you seen my car keys? | Have you seen my car keys? |
| app/public/js/hs-life.js:64 | {me}? Why aren't you at school? ...Oh, it's an INSET day. Right. Well don't sit on that computer all day. | Why aren't you at school? ...Oh, it's an INSET day. Right. Well don't sit on that computer all day. |
| app/public/js/hs-life.js:65 | {me}, have you done your homework? | Have you done your homework? |
| app/public/js/hs-life.js:65 | {me}! Come and get your washing, it's on the stairs! | Come and get your washing, it's on the stairs! |
| app/public/js/hs-life.js:65 | MOOOOOM! {me}'s being annoying! | MOM! They're being annoying! |
| app/public/js/hs-life.js:65 | {me}, {mate1}'s Mom rang. Are you going round there? | Your friend's Mom rang. Are you going round there? |
| app/public/js/hs-life.js:66 | {me.NAME}! TEA'S READY! It'll go cold! | TEA'S READY! It'll go cold! |
| app/public/js/hs-life.js:66 | {me}, set the table please, love! | Set the table please, love! |
| app/public/js/hs-life.js:67 | {me}, it's a school night. Not too late, eh? | It's a school night. Not too late, eh? |
| app/public/js/hs-life.js:67 | {me}! Have you been using the phone? The bill came. | Have you been using the phone? The bill came. |
| app/public/js/hs-life.js:67 | {me}, do you want a cup of tea? | Do you want a cup of tea? |
| app/public/js/hs-life.js:67 | {me}, can I have a go on the Game Lad? Pleeeeease? | Can I have a go on the Game Lad? Pleeeeease? |
| app/public/js/hs-life.js:68 | {me}! Bed! Now! | Bed! Now! |
| app/public/js/hs-life.js:68 | {me}, turn that light off, love, it's late. | Turn that light off, love, it's late. |
| app/public/js/hs-life.js:70 | {me}, are you on that computer AGAIN? | Are you on that computer AGAIN? |
| app/public/js/hs-life.js:70 | {me}! Get off the Internet! I need to ring your Nan! | Get off the Internet! I need to ring your Nan! |
| app/public/js/hs-life.js:71 | {me}, I'm popping to the shops. Do you want anything? ...Besides a Daydream. | I'm popping to the shops. Do you want anything? ...Besides a Daydream. |
| app/public/js/hs-life.js:72 | {me}, we're going to Gran's for Sunday dinner at one! Wear something clean! | We're going to Gran's for Sunday dinner at one! Wear something clean! |
| app/public/js/hs-life.js:88 | Are you eating properly? You're a growing {me.lad}. I've knitted you a jumper. It's got a reindeer on it. | Are you eating properly? You're still growing. I've knitted you a jumper. It's got a reindeer on it. |
| app/public/js/hs-life.js:114 | {me}! That was {mate1}! {mate1.He} says are you coming out? | That was your friend! Are you coming out? |
| app/public/js/hs-life.js:114 | {me}, that was your Gran. She says you never ring her. | That was your Gran. She says you never ring her. |
| app/public/js/hs-life.js:172 | Hello? Who is it? {me.NAME}! Ooh, you never ring! Is everything all right? Are you eating? Your Grandad says hello. HE SAYS HELLO. Bye love! Bye! Bye bye! | Hello? Ooh, you never ring! Eating properly? Grandad says hello. HE SAYS HELLO. Bye, love! Bye! Bye bye! |
| app/public/js/hs-life.js:215 | Ooh, have you done ALL your jobs? Who are you and what have you done with {me}? | Ooh, have you done ALL your jobs? Who are you and what have you done with my real helper? |
| app/public/js/hs-life.js:237 | {me}! Here's your pocket money. Five pounds. Don't spend it all on games magazines. | Here's your pocket money. Five pounds. Don't spend it all on games magazines. |
| app/public/js/hs-life.js:373 | Time for bed, {me}. Save your game. | Time for bed. Save your game. |
| app/public/js/hs-life.js:386 | {me}! Is that you? Tea's nearly ready! | Is that you? Tea's nearly ready! |
| app/public/js/hs-life.js:386 | {me}? Is that you coming down? Put the kettle on, love! | Is that you coming down? Put the kettle on, love! |
| app/public/js/hs-telly.js:411 | {me.NAME}! TURN THAT DOWN! IT'S THE MIDDLE OF THE NIGHT! | TURN THAT DOWN! IT'S THE MIDDLE OF THE NIGHT! |
| app/public/js/season-bonfire.js:273 | {cat} is indoors with the curtains shut. Let {cat.him} hide under the bed; keep the noise down in here. No need to pull {cat.him} out. | The cat is indoors with the curtains shut. Let the cat hide under the bed; keep the noise down in here. No need to pull the cat out. |
| app/public/js/season-bonfire.js:313 | Guy Fawkes was part of the Gunpowder Plot in 1605. They planned to blow up Parliament, but the plot was stopped. We remember the fifth of November. Our Guy is just old clothes and newspaper. | Bonfire Night remembers a plot in 1605 to blow up Parliament. Our Guy is old clothes and newspaper. Dad nearly donated his good trousers. |
| app/public/js/season-bonfire.js:574 | {cat} is safely indoors, hiding under the bed. Let {cat.him} stay cosy. | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. |
| app/public/js/season-bonfire.js:574 | {cat} is indoors. Keep the bedroom window shut tonight. Give {cat.him} a quiet place to hide when the bangs start. | The cat is indoors. Keep the bedroom window shut tonight. Give the cat a quiet place to hide when the bangs start. |
| app/public/js/season-bonfire.js:574 | {cat} is indoors. Keep the bedroom window shut for the display. Give {cat.him} a quiet place to hide when the bangs start. | The cat is indoors. Keep the bedroom window shut for the display. Give the cat a quiet place to hide when the bangs start. |
| app/public/js/season-bonfire.js:582 | {cat} is safely indoors, hiding under the bed. Let {cat.him} stay cosy. We will feed {cat.him} when the bangs have stopped. | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. We will feed the cat when the bangs have stopped. |
| app/public/js/ch-cat.js:132 | Ooh! Who are you and what have you done with {me}? | Ooh! Who are you and what have you done with my real helper? |
| app/public/js/ch-cat.js:132 | Gold star, love. GOLD STAR. | Gold star. GOLD STAR. |
| app/public/js/ch-cat.js:133 | Good {me.lad}. See, that wasn't so hard, was it? | See, that wasn't so hard, was it? |
| app/public/js/ch-core.js:144 | Thank you, {me}! | Thank you! |
| app/public/js/ch-core.js:144 | Good {me.lad}! | Good helper! |
| app/public/js/ch-core.js:153 | Have you done ALL your jobs? Who are you and what have you done with {me}? | Have you done ALL your jobs? Who are you and what have you done with my real helper? |
| app/public/js/ch-core.js:538 | {me.NAME}! Have you done your jobs yet? | Have you done your jobs yet? |
| app/public/js/ch-core.js:538 | {me}! Those jobs won't do themselves! | Those jobs won't do themselves! |
| app/public/js/ch-core.js:538 | {me.NAME}! Get off that computer and do your jobs! | Get off that computer and do your jobs! |
| app/public/js/ch-core.js:538 | {me}, love? The list on the fridge? Remember the list? | Love? The list on the fridge? Remember the list? |
| app/public/js/ch-core.js:538 | {me.NAME}! I can hear you NOT doing your jobs! | I can hear you NOT doing your jobs! |
| app/public/js/season-halloween.js:744 | Away from your hand, {me}! Saw AWAY from your hand. | Away from your hand! Saw AWAY from your hand. |
| app/public/js/season-halloween.js:989 | {me}, can you get that? | Can you get that? |
| app/public/js/season-halloween.js:989 | Door, {me}! More of them! | Door! More of them! |
| app/public/js/season-halloween.js:989 | {me}! Door! I've got my hands full. | Door! I've got my hands full. |
| app/public/js/season-halloween.js:990 | {me}! They're still waiting at the door! | They're still waiting at the door! |
| app/public/js/season-halloween.js:1175 | Look at the state of this hall. Wrappers everywhere! Bin, please, {me}. And who ate all the Choc Bits? | Look at the state of this hall. Wrappers everywhere! Bin, please. And who ate all the Choc Bits? |

## Recording preparation

The four required retakes are `c2.pocket.dad4`, `c2.unbox.dad`, `c1.mom.up`, `c4.hal.sis`. `c4.xmas.eve.dad.neutral` replaces the gendered legacy Christmas line; its old ID aliases to the neutral entry and cannot reach the old MP3. Existing audio bytes are untouched. The planning report marks existing recordings verified only after checking the exact approved release hashes.

Bonfire’s old `c4.bon.mom2` says “Hot dogs and a cup of tea”; current `bf.supper` serves jacket potatoes, parkin and toffee. Old `c4.bon.end` says bed in half an hour; current `bf.end` says Dad is making the display safe. The current wording has separate content-qualified IDs, so those old clips cannot substitute for it.

The Wobble Party host uses generic name/score/control variants listed in SCRIPT.md. Its original writing remains until a clip exists; then its writing agrees with that clip. Remote game cues without clips keep their existing text. Family lines use the existing positional bubble/mouth queue. Uncast people still require Jack’s voice decisions; no voices were invented for them.

## Every conditional announcer rewrite

These substitutions take effect only when the matching recording exists. `{dynamic}` marks a live name, total or control label in the original writing.

| ID | Original display variants | Recorded / future display words |
|---|---|---|
| `game.wobble.host.146dks4` | SWAP KAZOO! YOU SWAPS PLACES WITH {dynamic}! / SWAP SHOP! YOU SWAPS COINS WITH {dynamic}! / {dynamic} {dynamic} {dynamic}! | LET'S SEE WHAT THE REELS HAVE DECIDED! |
| `game.wobble.host.14iizcv` | ...BUT {dynamic} HAS NO COINS! PHEW. | NO COINS TO GIVE! PHEW. |
| `game.wobble.host.1n2x0pa` | A COIN GEYSER! WHOOSH! 6 COINS FOR YOU! | A COIN GEYSER! WHOOSH! |
| `game.wobble.host.1syds4j` | WELCOME TO WOBBLE ISLAND! I'M MC WOBBLE, YOUR HOST WITH THE MOST. (PRESS {dynamic}) | WELCOME TO WOBBLE ISLAND! I'M MC WOBBLE, YOUR HOST WITH THE MOST! |
| `game.wobble.host.1w75573` | {dynamic} ONLY HAS {dynamic} COINS. COME BACK RICHER! / OH DEAR, YOU ONLY HAVE {dynamic} COINS. COME BACK RICHER! | OH DEAR. COME BACK WITH MORE COINS! |
| `game.wobble.host.1wafoa1` | {dynamic} HAS FOUND THE STAR! | THE STAR HAS BEEN FOUND! |
| `game.wobble.host.1wf6wxm` | {dynamic} USES THE TWIN DICE! TWO BLOCKS! / YOU USE THE TWIN DICE! TWO BLOCKS! | TWIN DICE! TWO BLOCKS! |
| `game.wobble.host.1yrfw5o` | WHOEVER HAS THE MOST STARS AT THE END WINS. I'LL SWAP YOU A STAR FOR {dynamic} COINS. | WHOEVER HAS THE MOST STARS AT THE END WINS. I'LL SWAP YOU A STAR FOR COINS. |
| `game.wobble.host.1yus1o0` | {dynamic} EACH GET 10 COINS! / {dynamic} GETS 10 COINS! | THE WINNERS GET TEN COINS! |
| `game.wobble.host.2n6itx` | SWAP KAZOO! YOU SWAP PLACES WITH {dynamic}! | SWAP KAZOO! TIME TO SWAP PLACES! |
| `game.wobble.host.5steas` | THANK YOU! ONE {dynamic}. COME AGAIN! | THANK YOU! COME AGAIN! |
| `game.wobble.host.6pkgli` | ...BUT {dynamic} HAS NO STARS TO GIVE! PHEW. | NO STARS TO GIVE! PHEW. |
| `game.wobble.host.8oxsmd` | {dynamic} GOES FIRST, THEN {dynamic}, {dynamic} AND {dynamic}. EVERYBODY STARTS WITH 10 COINS. | LET'S SEE WHO GOES FIRST! EVERYBODY STARTS WITH TEN COINS. |
| `game.wobble.host.ar7z9n` | YOU FOUND THE COUNT'S DISCOUNT LEVER! STARS NOW COST {dynamic} COINS. | THE COUNT'S DISCOUNT LEVER! BARGAIN STARS! |
| `game.wobble.host.e7lqoo` | BAD LUCK, {dynamic}! 1ST PLACE THIS TIME. / BAD LUCK, {dynamic}! 2ND PLACE THIS TIME. / BAD LUCK, {dynamic}! 3RD PLACE THIS TIME. / BAD LUCK, {dynamic}! 4TH PLACE THIS TIME. | BAD LUCK! BETTER LUCK NEXT TIME! |
| `game.wobble.host.g6mio8` | THE {dynamic} GOES TO WHOEVER {dynamic}... | TIME FOR A BONUS STAR! |
| `game.wobble.host.gt3to3` | YOU GOT A STAR! THAT'S {dynamic}! | YOU GOT A STAR! SPARKLY! |
| `game.wobble.host.h7wc9x` | {dynamic} STOPS THE REELS. ANYTHING CAN HAPPEN! / STOP THE REELS WITH {dynamic}! ANYTHING CAN HAPPEN! | STOP THE REELS! ANYTHING CAN HAPPEN! |
| `game.wobble.host.it4hyq` | YOU FOUND THE STAR! I'LL SWAP IT FOR {dynamic} COINS. | YOU FOUND THE STAR! FANCY A SWAP? |
| `game.wobble.host.kj0owm` | ...NOBODY! NO {dynamic} THIS TIME. | NOBODY! NO BONUS STAR THIS TIME. |
| `game.wobble.host.ogoqhi` | WOBBLE WARP! WHEEE! OFF {dynamic} GOES! / WOBBLE WARP! WHEEE! OFF YOU GO! | WOBBLE WARP! WHEEE! OFF WE GO! |
| `game.wobble.host.q55w08` | DING DONG! THE CLOCKWORK JACKPOT: 0 COINS! | DING DONG! THE CLOCKWORK JACKPOT PAYS OUT! |
| `game.wobble.host.qm0di3` | SWAP SHOP! YOU SWAP COINS WITH {dynamic}! | SWAP SHOP! TIME TO SWAP COINS! |
| `game.wobble.host.t96fyl` | WELL DONE, {dynamic}! YOU'RE THE WOBBLE SUPERSTAR! | WELL DONE! YOU'RE THE WOBBLE SUPERSTAR! |
| `game.wobble.host.vvc01w` | {dynamic} IS IN LAST PLACE... HAVE 10 COINS TO CATCH UP! | LAST PLACE? HAVE TEN COINS TO CATCH UP! |

## Verification record

No TTS, transcription, paid API, secret-key read, audio generation, deploy, commit or push was performed. The existing audio symlink and all recording bytes are unchanged. Work stayed on voices2 and used disposable data only.

Part 1: the original independent 40 ms interval was delivered about 0.8–2.5 seconds apart on the software renderer. It compared an older painted mouth with a different 11 ms analyser window, then included zeros while the test suspended audio for a screenshot. A failing run advanced its audio clock only 3.77 seconds during an 18-second observation. This was a test artefact, not evidence of an inaudible line: the actual post-panner/filter audio-thread probe and analyser both proved signal. The corrected test observes the analyser value consumed by the production rig, checks its real smoothing equation, ignores suspended samples and leaves audio running during screenshots.

Counts: original branch 3/5 complete speak passes; live 2.66.0 np-bubble.js substituted alone 0/2, reproducing the same mouth failure without tablet balloon changes. Corrected native sampling passed the mouth checks 3/3; 2/3 complete focused cases passed, with one later ducking cleanup failure during newly queued dialogue. Fixture speech cleanup and waiting for duck release were corrected. The final complete voice-suite attempt passed speak (including far/subtitles), adding another corrected mouth pass. Source files were not reverted.

Generation: node tools/audio/gen-lines.mjs --dry-run is offline. It plans the missing approved-cast lines only; the four requested retakes and a neutral Christmas Eve replacement are included. Existing recorded lines are recognised only after their approved release hashes were verified. Generator limits, splitter and transcription verification are unchanged.

| Command | Actual result |
|---|---|
| `node tests/voices.mjs http://localhost:18080 --only=speak` | Original sampler: 3 runs exit 0; 2 runs exit 1. Detailed logs copied to tests/shots/voices2/. |
| `VOICES_REVERT_FILE=/tmp/voices2-live/np-bubble.js VOICES_PROBE_ONLY=1 node tests/voices.mjs http://localhost:18080 --only=speak` | Two runs exit 1 at the same mouth assertion; only the release balloon file was substituted. |
| `VOICES_SYNC_SAMPLES=1 VOICES_PROBE_ONLY=1 node tests/voices.mjs http://localhost:18080 --only=speak` | Two runs exit 0; one exit 1 at duck cleanup after passing mouth. Mouth checks 3/3 passed. |
| `git diff --name-only -- '*.js' '*.mjs' '*.cjs' \| xargs -n1 node --check` | exit 0; all touched tracked JavaScript parsed. |
| `node --check tools/audio/voice-audit.mjs` | exit 0. |
| `for f in tests/*-unit.cjs; do node "$f"; done` | Final 48/48 exit 0. Earlier regression findings were fixed: the neutral bedtime test expectation, and scene-history deduplication across story steps. Final per-file results: tests/shots/voices2/unit-results.txt. |
| `node --expose-internals tests/parody-audit.cjs` | exit 0; 0 authored text spans require changes. |
| `node tools/audio/test-split.mjs` | exit 0; offline splitter suite passed. |
| `node tools/audio/gen-lines.mjs --dry-run` | exit 0; 309/523 verified, 214 pending, 19 planned requests covering all 214. No API calls made. |
| `FIXTURE_RASTER_RATIO=0.25 SMOKE_SCALE=1 timeout 600s node tests/voices.mjs http://localhost:18080` | exit 124; 8/9 passed, including audio, layout, speak, muted, names, edge, two, prompt. Global timeout closed the last phone fixture. |
| `node tests/voice-recordings.mjs` | exit 0; all five characters, real decoding/source/level/panner/ducking and exact approved manifest. |
| `FIXTURE_RASTER_RATIO=0.25 BONFIRE_NO_SHOTS=1 timeout 360s node tests/events-bonfire.mjs http://localhost:18080` | exit 124; real wood stacking and preparations progressed to the display finale. No complete event/persistence pass. |
| `FIXTURE_RASTER_RATIO=0.25 REGRESSION_NO_SHOTS=1 STORY_SCALE=1 timeout 180s node tests/story-ch1.mjs http://localhost:18080` | exit 124; interrupted during real bed making. No complete Chapter 1 pass. |
| `FIXTURE_RASTER_RATIO=0.25 SMOKE_SCALE=1 timeout 240s node tests/smoke.mjs` | exit 124; 5/8 checks passed before SIGTERM at 240 seconds. Walk-refresh hit a loading-state timeout; it was not rerun alone, so it is unconfirmed and not classified as a game defect. The later phone-typing check passed. |
| `node tests/mobile.mjs` | DID NOT RUN: insufficient serial-browser time. |

Reviewed screenshots: `tests/shots/voices/dad-near.png`, `tests/shots/voices/name-mom-call.png`, `tests/shots/voices/phone-name-mom-shout.png`, `tests/shots/voices/phone-name-landscape.png`.

Limitations: The bounded full voice suite reached 8/9 and was terminated at 600 seconds during the separate phone fixture; the names case already includes portrait/landscape phone captures. This is not a full-suite pass. Final browser gates use FIXTURE_RASTER_RATIO=0.25 for functional coverage; they do not certify native-resolution visual quality or physical phone/tablet performance. Native diagnostic views were reviewed earlier. The complete mobile suite did not run. New clips have not been generated, listened to or transcript/accent audited. Playback of every newly prepared sentence, every refresh during a seasonal/remote call, every floor/room combination and every rapid-input path is not verified. Uncast NPCs need Jack’s casting decisions. Legacy computer speech and all free-form adventure/server dialogue have not all been migrated to the new recording queue. Structured MUD dialogue is inventoried, but MUD transport still lacks recording IDs. Treat those as remaining work, not shipped voice coverage. The final duplicate-line/F-press and stricter room/floor-muffle adjustments passed the unit suites, but a complete subsequent browser matrix did not fit the time box.

# SCRIPT: Jack Attack 1999, Chapters 1 to 4 (story script, objectives, voice and barks)

Written 2026-10-26. Source of truth for all spoken and on-screen story text. Follows docs/STORY.md (Revision 2026-10-26), docs/AUDIO.md and the AGENTS.md people rules. Machine-readable recorded lines: tools/audio/voice-lines.json (generated from this file).

## Conventions
- Setting: UK, 1999. Prices in pounds and pence; Rupees only via JackNet Bank (20 Rupees = £1). Mom, Dad and Gran are titles. Consoles use the parody names (Game Lad, Segue, PlaySpace, Ultra 64, Daydream); the magazine is JACK ATTACK!; the shop is Pixel Post; the PC is JackOS. Only the Daydream launch (14/10/1999) and the millennium countdown are real events, used lightly. No location clues, no birthday, nothing after 31/12/1999.
- On-screen text may use Cast placeholders: {me}, {me.his}, {sister}, {mate1}..{mate4}. Recorded voice lines never contain the player's name, the sister's name, or a gendered word for the player (no "lad", "he", "she"); they are the exact subtitle text.
- Name call-outs: a line marked `callout=mom-shout|mom-call|dad-shout|sis-whine` plays the player's name clip ("SARAH!") first, then the line (subtitle: "{me.NAME}! " + line). With no matching name clip the line plays alone.
- Emotion tag = the leading [bracket tag] given to the TTS (short, one or two words). fx=downstairs means the muffle filter (speaking from another room); fx=console is the crunchy console filter.
- Table columns: id | speaker | when/where | emotion | line. Rows for mates and the player's thoughts are on-screen text only (no recording): id | who | when/where | text.
- Mates by slot: {mate1} hyper and loyal, {mate2} the know-it-all, {mate3} has everything already, {mate4} the sneaky swapper. Family: Mom warm and brisk, Dad exasperated and good-humoured, sister cheeky and whiny, Gran sweet and slightly outdated.


---

# Ch1 "Just a Game Lad"

First session, about 10 minutes. Doubles as the tutorial. No PC yet: an empty desk with a dust outline and a cable hole. Everything guided (highlight, marker, arrow).

## Beats

1. Title card "1999", then "Chapter 1: Just a Game Lad". Fade up on the bedroom, early morning light through the curtains. The desk is empty except a dust outline where a computer once sat (or never did) and a dangling cable hole.
2. Diary opens itself once (first-time hint): "Dear Diary. Nothing to do. No PC, no telly in my room worth mentioning, just my Game Lad. Pathetic." Controls shown once: WASD walk, F use, E carry, R turn, Q back.
3. Game Lad tutorial: one quick go on the bedside Game Lad (teaches F to play, Enter to start, Q to lean back). Sister bursts in during it to ask for a turn (comic).
4. Mom comes upstairs in person (wandering NPC), checks the room, gives the first jobs: tidy, bed, bin. Each has give and hand-in lines. Mom's star rating is shown after each.
5. Engine noise outside (Dad's car on the drive). Mom: "That'll be your father." Objective points to the front door. Dad at the car boot: the office is chucking out the old computers.
6. Carry chain, all highlighted: tower, heavy CRT (slow walk, Dad winces), keyboard and mouse box, speakers. Dad, Mom and the sister each have reactions on the stairs (mind the wallpaper; "I want a go").
7. Plug the three leads into highlighted ports, press the power button, JackOS Setup from floppies (Dad hands the box; disk 3 always sticks), JackNet logon. Dad: "Not too long on it." Chapter-complete sting. Diary: "Next goal: save up for a console."

## Objectives (18)

| id | diary text (first person) | hint | notes / test |
|---|---|---|---|
| `wake` | I woke up. My desk is empty. Where is everything fun? | Look around. WASD walks, the mouse looks. The empty desk is marked. | NEW. Test: walk 2 metres or look at the desk. |
| `lad` | One quick go on my Game Lad. | F plays the Game Lad. E carries, R turns, Q leans back. Enter starts the game. | existing, test play.gb |
| `meetmom` | Mom is coming up the stairs. Better look busy. | NEW, Mom walks in and F talks to her. Talk to Mom with F. | NEW. Test: talk.mom |
| `tidy` | Mom wants my room tidy first. | Clothes in the basket, rubbish in the bin, dishes in the kitchen sink. | existing, test chore.tidy |
| `bed` | Make the bed. A duvet heap does not count. | E carries the pillow and pyjamas to their places. F straightens the duvet. | existing, test chore.bed |
| `bin` | Take my bin bag downstairs. | F ties the bag. E carries it to the kitchen bin; E puts it in. | existing, test chore.bin |
| `dad` | Dad is home! Meet him at the car. | F opens doors. Follow the stairs to the hall, then the front door to the drive. | existing, test room.drive |
| `boot` | Open the boot of Dad's car. | F opens the boot. There is an entire computer in there! | existing, test physical.boot |
| `part.tower` | Carry the tower up to my desk. | E picks it up. R turns it. Carry it upstairs, aim at the marked place on my desk and E sets it down. Q returns it safely. | existing |
| `part.monitor` | Careful! Carry the heavy monitor upstairs. | Same as before, but it is heavy: you walk slowly. Take the stairs gently. | existing |
| `part.keys` | Bring up the keyboard and mouse. | E picks up the box. Set it down at the marked place on the desk. | existing |
| `part.speakers` | Last trip: the speakers. | E picks them up and puts them either side of the desk. | existing |
| `lead.power` | Plug in the power lead. | F plugs the marked connector into its matching port. The mouse and speakers are already paired. | existing |
| `lead.video` | Connect the monitor lead. | F at the marked port on the back of the tower. | existing |
| `lead.keyboard` | Connect the keyboard lead. | F at the marked port. Purple one, the keyboard one. | existing |
| `power` | The big moment. Press the power button. | F at the tower switches it on. Dad left the JackOS recovery floppies beside it. | existing, test physical.power |
| `install` | Install JackOS from the recovery floppies. | Follow JackOS Setup on the monitor. Insert each numbered recovery disk when asked. | existing |
| `pc` | Log on to JackNet. My own PC! | Finish Setup and log on to the desktop. Time to save for a console. | existing, test pc.use |

### Wake up (bedroom, morning)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.wake.mom.call` | mom | Downstairs, calling up at the very start, muffled through the floor [downstairs] | warmly | Up you get! It's a lovely morning and you're wasting it! |
| `c1.wake.mom.shout` | mom | Downstairs, if the player is still standing in the doorway after 30 seconds [downstairs] | shouting | Breakfast's going cold! I'm not calling again! |
| `c1.wake.mom.room` | mom | Downstairs, a few seconds later, still muffled | suspicious | And I know what your room looks like, don't think I don't! |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c1.wake.me1` | me | bedroom, first look at the desk | There's a rectangle of dust where a computer should be. Mates have PCs. I have a Game Lad and a rectangle. |
| `c1.wake.me2` | me | bedroom, after F on the bedside table | Okay. One quick go on the Game Lad. Just to wake up my thumbs. |

### Game Lad cameo (sister interrupts)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.lad.sis.in` | sister | Bedroom door bursts open while the Game Lad is on | cheeky | Ooh, what are you playing? Can I have a go? Go on, go on, go on! \| |
| `c1.lad.sis.no` | sister | After the player's reply, in the doorway | whiny | You never let me do anything! I'm telling! \| |
| `c1.lad.sis.out` | sister | Walking away down the landing | smug | I'm telling Mom it's all your fault anyway. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c1.lad.done` | me | Game Lad closed, objective complete | Level two next time. Maybe. If I don't get told off first. |

### Mom comes up and sets the first jobs

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.mom.up` | mom | Mom walks into the room, stops at the door | warmly | Morning, love. Oh, look at this. A tip. An actual tip. \| |
| `c1.mom.give` | mom | F on Mom, objective meetmom | firmly | Right. Room first, then you can do what you like. Clothes in the basket, rubbish in the bin, plates down to the kitchen. \| |
| `c1.mom.give2` | mom | Same conversation, second page | warmly | Do it properly and there's pocket money in it. Do it badly and there's nothing in it but my disappointment. \| |
| `c1.mom.leave` | mom | Mom walks off, heading downstairs | cheerful | I'll be down the kitchen if you need me. And I will be checking! \| |
| `c1.tidy.hint` | mom | From downstairs, 90 seconds after tidy begins with no progress | calling | Are you tidying or are you reading comics? I can hear the pages turning! |
| `c1.tidy.done` | mom | Tidy complete, Mom checks the room | pleased | Well. You can see the carpet. I'd forgotten it was green. \| |
| `c1.bed.give` | mom | Bed objective starts, Mom pops her head round the door | firmly | Now the bed. And a duvet in a heap is not a made bed, before you try it. \| |
| `c1.bed.done` | mom | Bed complete | pleased | Hospital corners. Nearly. That's an improvement. \| |
| `c1.bin.give` | mom | Bin objective starts | firmly | And that bin bag is going downstairs before it grows legs. \| |
| `c1.bin.done` | mom | Bin complete, bag in the kitchen bin | warmly | Thank you. See? You're a natural. Don't let it go to your head. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c1.pay` | sys | After first Mom payment | Mom: "Here you go." + 20p coin. (Pocket money is real pounds and pence. Save it!) |

### Dad arrives

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.car.engine` | mom | In the kitchen when the car pulls up outside | surprised | That'll be your father. Oh, he's early. Go and see what he wants. \| |
| `c1.dad.hello` | dad | At the car, Dad waves you over | excited | There you are! Come here. You are not going to believe what I've got in the boot. \| |
| `c1.dad.story` | dad | Dad leans on the car | amused | The office is chucking out all the old computers. New ones on Monday, all grey and flat and very fancy. Nobody wanted the old ones. Except me. \| |
| `c1.dad.offer` | dad | Dad opens the conversation to the offer | proud | So. Do you want one? Your very own computer? It's no beast but it works. Mostly. \| |
| `c1.dad.yes` | dad | If the player says yes (any answer leads here) | laughing | Ha ha! I thought you might. Right. It's heavy, so listen. \| |
| `c1.dad.boot` | dad | Dad steps back from the boot | pointing | Pop the boot, go on. Everything's in there. \| |
| `c1.dad.brief` | dad | Boot open, Dad points at the house | instructing | Tower first, then the monitor, then the little box with the keyboard and mouse, and the speakers last. Take your time, mind the stairs. \| |
| `c1.dad.mom` | dad | Mom appears at the door, scowling at the mess | grumpy | Your mother says mind the wallpaper. And so do I. \| |

### Carry chain (parts)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.tower.pick` | dad | Player picks up the tower | encouraging | That's it, bend your knees. It's heavier than it looks. \| |
| `c1.tower.done` | dad | Tower placed on the desk | pleased | Perfect. First one up. Off you go, next one. \| |
| `c1.mon.pick` | dad | Player picks up the monitor, walk speed drops | worried | Gently, gently! That's the heavy one. It weighs about as much as a small elephant. \| |
| `c1.mon.stairs` | dad | Halfway up the stairs with the monitor | nervous | Mind the banister! And mind the wall! Your mother will have us both! \| |
| `c1.mon.drop` | dad | If the player drops the monitor (it bounces, no damage) | alarmed | Oh, my heart! Don't drop it! Pick it up, slowly. \| |
| `c1.mon.done` | dad | Monitor placed on the desk | relieved | Phew. Right. That's the worst of it over. \| |
| `c1.keys.pick` | dad | Player picks up the keyboard box | casual | Easy one. Careful with the mouse, it's got a wire on it like a tail. \| |
| `c1.speak.pick` | dad | Speakers picked up | cheerful | Last trip! Put one each side of the screen, like bookends. \| |
| `c1.sis.stairs` | sister | The sister blocks the landing when the player carries a part | whiny | Is that a computer? Is it mine? I want a go! It's not fair! \| |
| `c1.sis.stairs2` | sister | After the player squeezes past | grumbling | Fine. I'll just sit on the stairs and watch. \| |
| `c1.mom.carry` | mom | Mom in the hall at the foot of the stairs | worried | Careful, careful. Not on the paintwork! \| |
| `c1.mom.carry2` | mom | A second pass through the hall | exasperated | Honestly, you'd think they were moving a piano. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c1.parts.me` | me | Each part placed on the desk | The desk is slowly turning into a computer. Spotting a big beige tower on it makes me grin. |

### Leads, power, install

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c1.lead.dad` | dad | Desk filled, Dad appears behind the player | helpful | Now the leads. They only go one way in. If it doesn't fit, don't force it. \| |
| `c1.lead.dad.power` | dad | After the power lead is plugged in | amused | Power. Do not plug the monitor lead into the power socket. I've seen it done. \| |
| `c1.power.dad` | dad | All leads connected, Dad rubs his hands | excited | Moment of truth. Hit the button. Fingers crossed. \| |
| `c1.power.boot` | dad | PC beeps and the screen flickers | delighted | It's alive! It's alive! \| |
| `c1.floppy.dad` | dad | JackOS Setup asks for the first disk | calm | Setup wants the floppies. They're in that box. Number one first. They have to go in order. \| |
| `c1.floppy.stick` | dad | The third disk fails the first time (scripted fun) | amused | Disk three. It always sticks. Give it a gentle poke. \| |
| `c1.install.done` | dad | Installation finished | proud | That's it. You're a computer owner. Look at you. \| |
| `c1.logon.mom` | mom | Mom pops in as JackNet logon appears | warmly | Right. Don't be on it all day. And if you need a break, come and find me. \| |
| `c1.logon.dad` | dad | Dad, leaving the room | cautious | One more thing. It's the phone line downstairs. If I need it, you're off. Not a word. Deal? \| |
| `c1.logon.sis` | sister | The sister peers round the door as the desktop appears | jealous | Wow. Can I come in? Pleeeease? When can I have a go? \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c1.end.me` | me | Logon complete, chapter title card | My very own PC. Right. Now. What I really need is a console. Saving up starts today. |


---

# Ch2 "Saving up"

About 15 to 30 minutes of play. Earn, choose, order, wait for the parcel, set it up, ring a mate.

## Beats

1. Title card. The PC is on, the diary shows a new page headed "Save up for a console". A coin jar appears on the shelf and fills as the player earns.
2. Dad explains pocket money in person (Saturday, plus chores pay): Mom's daily list of four jobs, the streak bonus, a weekly big job (wash the car, clear the shed) and selling old toys on JackBay. Mom's good books gets its first mention.
3. Player browses Pixel Post on the PC (prices in pounds, games listed separately) and chooses which console. The choice matters: PlaySpace, Segue, Ultra 64. Mates react by phone depending on the choice.
4. Order placed. A day of waiting is skipped by playing (post comes "after the next job"). Dad or the sister calls out when the parcel lands on the mat.
5. Unbox by the front door, carry upstairs, connect beside the telly (highlighted slot), first game goes in. Big moment.
6. The phone: a mate must hear. First scripted phone call. Numbers swapped into the phonebook. Chapter complete.

## Objectives (10)

| id | diary text (first person) | hint | notes / test |
|---|---|---|---|
| `save` | Save enough for my first console. Every penny counts. | Mom's jobs pay cash. There are games and jobs on JackOS too. JackNet Bank swaps £1 for 20 Rupees. The Segue costs 360 Rupees; keep saving for a different one if I fancy it. | existing, test money.console |
| `pocket` | Ask Dad how pocket money works. | NEW. Dad is in the lounge in his chair. F talks to him. | NEW. Test: talk.dad (once) |
| `bigjob` | Do this week's big job for Dad. | NEW. Dad's weekly job: wash the car or clear the shed. It pays extra and counts toward Mom's good books. | NEW, optional. Test: chore.bigjob |
| `sell` | Sell something old on JackBay. | NEW, optional. Open JackBay on the PC and list a toy I have outgrown. Pays straight into pocket money. | NEW, optional. Test: jackbay.sale |
| `order` | Choose a console and order it from Pixel Post. | www.pixelpost.jnet sells console hardware and games. Pick any console that is out. I will need a game for it too. | existing, test order.console |
| `unbox` | My parcel! Open it by the front door. | Stand up from the PC. F opens the Pixel Post parcel in the hall. | existing, test parcel.console |
| `carry` | Carry my new console up to my room. | E picks it up. Walk upstairs with it. Q returns a carried thing to where I picked it up. | existing, test carry.console |
| `connect` | Set it up beside the telly. | Carry the console to the highlighted place beside my telly, then E connects it. | existing, test connect.console |
| `play` | First game on my own console. YES. | Order a matching game if I need one. Put its case down, F opens it, E takes the game. E inserts it in the highlighted console slot; F plays. | existing, test play.console |
| `mate` | Add a mate to my phonebook. They need to hear about this. | F uses my phone. Ask a JackNet mate for their private number, then Phonebook > Add name. Sending a text works too. | existing, test phone.mate |

### Dad explains pocket money

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.pocket.dad` | dad | Dad in the lounge in his chair, objective pocket | warm | Saving up, eh? Right. Here's how it works. Your mother's jobs on the list pay cash. Do all four and there's a bonus. \| |
| `c2.pocket.dad2` | dad | Same conversation | amused | And on a Saturday I'll sling you a bit extra if I'm in a good mood. Tell me nicely. \| |
| `c2.pocket.dad3` | dad | Same conversation | knowing | There's the big job as well. Wash the car, clear out the shed. Pays proper money. Rubbish money, obviously, but proper rubbish money. \| |
| `c2.pocket.dad4` | dad | Closing line | conspiratorial | And keep on the right side of your mother. Her good books are worth more than any pound coin. \| |
| `c2.coin` | mom | First time the player completes a job and pocket money is paid | warmly | There's your money. Spend it wisely. Or don't. It's yours. \| |
| `c2.coin2` | mom | Second payment | firmly | Don't spend it all in one shop. \| |

### Weekly big job

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.bigjob.give` | dad | Dad on the drive with a bucket, Saturday | cheerful | Big job day. Car's a disgrace, look at it. I'll pay you properly. \| |
| `c2.bigjob.shed` | dad | Alternative big job, shed | grumpy | The shed. Everything out, everything swept, everything back in the right order. Don't ask me how the lawnmower got behind the paint. \| |
| `c2.bigjob.done` | dad | Big job complete | impressed | Now that is a car. I can see my face in it. Which is a bit upsetting, actually. \| |

### Selling on JackBay

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.sell.mom` | mom | Mom sees the player listing old toys | pleased | Selling your old toys? That is a good idea. Make a bit of room in here. \| |
| `c2.sell.sis` | sister | The sister sees a particular toy on the list | horrified | That's mine! You said I could have that! \| |
| `c2.sell.sold` | sister | Item sells, sister overhears | smug | Ha ha, someone bought your teddy. \| |

### Choosing a console (Pixel Post)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.order.dad` | dad | Dad when the order is placed | amused | Ordering a console, are we? I hope it comes with an instruction manual. Nobody reads them, but I like to know they exist. \| |
| `c2.order.mom` | mom | Mom passing the PC | wry | You're spending your own money, so I'll say nothing. Nothing at all. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c2.shop.me` | me | Opening the Pixel Post catalogue | So many boxes. The Segue is cheap. The PlaySpace has the best games. The Ultra 64 has four ports for four players. Decisions, decisions. |
| `c2.shop.hint` | sys | Console page | Only consoles that are out in 1999 are listed. Games are sold separately. You can change your mind later. |

### Waiting for the post

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.post.sis` | sister | Sister runs through the hall after the letterbox rattles | excited | Mom! Mom! Something's come! It's a big box! \| |
| `c2.post.dad` | dad | Dad from the lounge | calling | That'll be the postie. Go on, don't leave it on the mat. \| |
| `c2.post.mom` | mom | Mom from the kitchen | amused | It's for you. It's very big. Mind where you put it. \| |

### Unbox, carry, connect

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.unbox.dad` | dad | Dad leaning in the doorway as the parcel opens | impressed | Look at the size of that. Right. Mind your back on those stairs. \| |
| `c2.unbox.sis` | sister | Sister hovering over the box | begging | Can I carry it? I'll be really careful. Promise. \| |
| `c2.carry.mom` | mom | Mom as the player carries the console up | worried | Not the wallpaper, I said! Honestly. \| |
| `c2.connect.dad` | dad | Console reaches the room | helpful | Telly's there. Console goes next to it. The cable's the yellow one. Don't worry about the red and white ones just yet. \| |
| `c2.connect.done` | dad | Console connected | satisfied | Brilliant. Does it do anything? Go on, switch it on. \| |
| `c2.play.sis` | sister | Sister behind the player at the first game's title screen | thrilled | Whoa. Is that the actual game? It looks like a film! \| |
| `c2.play.mom` | mom | Mom in the doorway while first game is played | amused | Is that the sound of a happy household? It's a nice change. \| |
| `c2.play.announcer` | announcer | The console boot screen, first power on, with the crunchy console filter | booming | Welcome to the next level. Press start. |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c2.play.me` | me | First game, title screen | First go. I can't believe it. A real console. In my room. Mine. |

### The phone

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c2.phone.dad` | dad | Dad when the player picks up the hall phone while he is waiting for a call | grumpy | Oi! I'm expecting a call! Don't tie up the line! \| |
| `c2.phone.mom` | mom | Mom, approving | gently | Go on, ring one of your mates. But keep it short. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c2.mate.hint` | sys | Phonebook | Choose a mate from JackNet, ask for their number, add it to the phonebook, then F on the phone and dial. |

### Mates' first call (mate1 always answers; the other three text later)

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c2.call.a1` | mate1 | Phone call, mate1 answers, first call, player says they have a console | {mate1}: "Hello? Oh, it's you! What's up?" |
| `c2.call.a2` | me | player replies | "I got a console!" |
| `c2.call.a3` | mate1 | excited | "No WAY! Which one? What games have you got? I'm coming round NOW." |
| `c2.call.a4` | mate1 | joking | "Stay there. Don't touch anything. I'm bringing my own controller. Is your mom in? Will she make us sandwiches?" |
| `c2.call.a5` | me | player replies | "Hurry up then! I've just got to the first level." |
| `c2.call.a6` | mate1 | on the phone | "Level one?! You're ages behind. Back in a bit. Put the kettle on." |
| `c2.call.b1` | mate2 | text message, an hour later, knowing | {mate2}: "Heard you got a console. Is it the one with the good games or the one with the other ones?" |
| `c2.call.b2` | mate3 | text message | {mate3}: "Is that the one you were on about? I've got that. Mine's better. Ha ha. Joking. Sort of." |
| `c2.call.b3` | mate4 | text message | {mate4}: "Got any spare cartridges to swap? I've got loads. Some of them even work." |
| `c2.callend` | me | Chapter complete card | I have a console. I have mates. I have a PC. This is turning into a good year. |

### Console reactions (mates, by choice)

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c2.react.ps1` | mate1 | player bought the PlaySpace | "A PlaySpace?! The one with the discs? Wicked!" |
| `c2.react.ps2` | mate3 | player bought the PlaySpace | "I'll come round and we'll do split-screen. Mine's in for repairs." |
| `c2.react.sg1` | mate2 | player bought the Segue | "A Segue. Brave. They've got some amazing games. Just not many of them." |
| `c2.react.sg2` | mate4 | player bought the Segue | "I can swap you a Segue game. I only want something good in return." |
| `c2.react.u64a` | mate1 | player bought the Ultra 64 | "Four players on one console? We'll play all night!" |
| `c2.react.u64b` | mate3 | player bought the Ultra 64 | "Only four buttons on the pad and nine hundred ways to play. Respect." |


---

# Ch3 "Getting online upstairs"

Trigger: first console owned + enough chores done + Mom's good books high enough. The PC has no phone line in the bedroom. Lay a real cable.

## Beats

1. Title card. The player tries the Dial-up icon on the bedroom PC: "No dial tone." Diary: the only phone socket is in the hall, down the stairs.
2. Dad's rule from Ch1 returns: the phone line is for calls. The player asks Mom and Dad. Dad: "Not on my phone bill." Mom's good books decides: the player has to earn it with a streak (three days of jobs) and a big job.
3. Mom or Dad agrees. Pixel Post sells a 10 metre phone extension cable and a double adaptor (a few pounds), or Dad has one in the shed (shed job unlocks it). The cable arrives as a physical coil. The cover-CD ISP disc from the JACK ATTACK! magazine (this month's issue) is also needed: it is stuck to the front, along with a sticker.
4. The run: plug one end in the hall socket (highlighted), clip the cable along the skirting up the stairs (clips mark each metre), through the landing, under the door to the bedroom. Each clip is a mini-task. Trip hazard: the sister gets tangled once (comic, no harm).
5. Plug into the PC's modem, insert the ISP disc, install, dial. The modem noise (the classic screech) plays; the first connection is a big moment. Then the first JackNet chat with a mate from the bedroom.
6. The "Get off the internet" moment: while the player is online, Dad needs the phone. Hang up in time (a quick F) for Dad's good humour. Phone bill lecture. Chapter complete.

## Objectives (13)

| id | diary text (first person) | hint | notes / test |
|---|---|---|---|
| `nodial` | Dial-up doesn't work in my room. No phone socket. | NEW. Open Dial-up on the PC. The only phone socket is in the hall. | NEW. Test: pc.dial.fail |
| `askline` | Ask Mom or Dad if I can get the phone line upstairs. | NEW. F on Mom or Dad. They'll say no at first. Mom's good books matter. | NEW. Test: talk.line |
| `goodbooks` | Get into Mom's good books: do three days of jobs. | NEW. Do Mom's list three days running, plus one big job for Dad. The streak shows in the jar. | NEW. Test: streak.3 + chore.bigjob |
| `cable` | Get a phone extension cable. | NEW. Buy a 10 metre cable from Pixel Post, or find the old one in Dad's shed once the shed is tidy. | NEW. Test: cable.owned |
| `mag` | Pick up this month's JACK ATTACK! magazine for the free CD. | NEW. The magazine is on the hall table or in the next Pixel Post parcel. The ISP disc is taped to the front. | NEW. Test: mag.disc |
| `socket` | Plug the cable into the hall phone socket. | NEW. F on the highlighted socket by the front door. | NEW. Test: cable.socket |
| `clips` | Run the cable up the stairs, clipping it to the skirting. | NEW. Aim at each marked clip spot and F. Nine clips from hall to landing. Don't trip the sister. | NEW. Test: cable.clips |
| `roomend` | Feed the cable into my room and under the desk. | NEW. Bring the end through the door to the marked modem port. | NEW. Test: cable.room |
| `modem` | Plug the cable into the PC's modem. | NEW. F at the back of the tower, the port marked LINE. | NEW. Test: cable.modem |
| `isp` | Install the free ISP disc. | NEW. Put the cover CD in the PC's drive. Follow the installer: it asks for a username and a password. | NEW. Test: isp.install |
| `dial` | Dial up and get online upstairs! | NEW. Open Dial-up, press Connect and listen. | NEW. Test: pc.dial.ok |
| `chat` | Chat with a mate on JackNet from my own room. | NEW. Open JackNet Chat. Say hello. | NEW. Test: chat.sent |
| `hangup` | Hang up! Dad needs the phone. | NEW. Event. Dad shouts up. Press the Hang up button in Dial-up before he comes upstairs. | NEW, an event. Test: pc.dial.hangup |

### First failed dial

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c3.nodial.me` | me | Dial-up fails: no dial tone | Nothing. Just a hiss. Not even the engaged tone. The phone socket's miles away. |
| `c3.nodial.me2` | me | Diary entry | I have a PC AND a console. All I need now is the internet in my room, so I don't have to do everything on the stairs. |

### Asking permission

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.ask.mom` | mom | F on Mom in the kitchen | thinking | Phone cable up the stairs? I don't know. You'd have to earn it. And what happens if somebody needs to ring? \| |
| `c3.ask.mom2` | mom | Same conversation, Mom's good books too low | firmly | Show me a few good days first. A full week would be better. \| |
| `c3.ask.mom.yes` | mom | Good books high enough | warmly | I can see you've been trying. All right. But your father has the last word. \| |
| `c3.ask.dad` | dad | F on Dad | grumpy | Phone bill! That thing costs by the minute. I remember what it was like last time. Four hours on a Sunday. Four. \| |
| `c3.ask.dad2` | dad | After Mom said yes | softening | Hmm. Fine. But if I'm expecting a call, off you come. Deal? \| |
| `c3.ask.dad.deal` | dad | Player agrees | satisfied | Good. And you pay for the cable. No arguments. \| |

### Getting the cable

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.cable.shed` | dad | Dad on the drive, shed job done | thoughtful | There's an old extension cable in here somewhere. Under the paint. Behind the lawnmower. In the box marked "Misc." \| |
| `c3.cable.found` | dad | Player finds the cable in the shed | pleased | That's the one. Ten metres of telephone lead. I bought it for the 1995 Christmas lights. Don't ask. \| |
| `c3.cable.sis` | sister | Sister sees the coil | curious | What's that for? Is it a skipping rope? \| |

### The magazine and the ISP disc

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.mag.mom` | mom | Mom on the hall table with the post | wry | There's your magazine. It's got a free disc taped to it. Don't lose it; it's worth more than the magazine. \| |
| `c3.mag.sis` | sister | The sister waving the mag | cheeky | I've had a look at the pictures, and it's got a free sticker. I'm having the sticker. \| |

### Running the cable

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.run.dad` | dad | Dad in the hall, objective socket | cheerful | Right. The socket's by the front door. Plug it in there and run it up the stairs, along the skirting. Neat. Nice and flat. \| |
| `c3.run.clip` | dad | After a few clips | encouraging | Good. That's it. Nice and tight. Don't staple through it, whatever you do. \| |
| `c3.run.trip` | mom | The sister gets tangled in the cable on the stairs (comic) | alarmed | Oh, for goodness' sake! Are you all right? Mind the cable! \| |
| `c3.run.trip.sis` | sister | Same moment | squeaking | Whoa! Nobody told me about the wire! \| |
| `c3.run.trip.dad` | dad | Same moment | amused | Right. That's why we clip it to the wall. \| |
| `c3.run.landing` | mom | Cable reaches the landing | proud | Very neat. Almost professional. \| |
| `c3.run.done` | dad | Cable at the desk | satisfied | Right. Plug that into the back of your PC. The port with the little phone on it. \| |

### Install and dial

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.isp.dad` | dad | Dad as the ISP installer runs | curious | It says it's free. It's never free. Read the small print. \| |
| `c3.isp.mom` | mom | Mom in the doorway | wry | Free internet? Now I've heard everything. \| |
| `c3.dial.dad` | dad | Dad at the PC as the player presses Connect | proud | Ready? Here goes... \| |
| `c3.dial.modem` | announcer | Modem handshake, crunchy filter, no voice, played as an effect cue | flat | (the classic dial-up screech: handled as an effect, not a voice) |
| `c3.dial.ok` | dad | Connected | amazed | We're online! In the bedroom! Good heavens. \| |
| `c3.dial.mom` | mom | Mom on the landing | amused | Is that a robot being strangled? Honestly. \| |
| `c3.dial.sis` | sister | Sister at the door as the modem screeches | amazed | Whoa. That's the loudest noise I've ever heard. \| |

### First chat

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c3.chat.me` | me | JackNet Chat opens | Right. Say hello. Not "hello". Something cool. Like "sup". |
| `c3.chat.a1` | mate1 | JackNet Chat reply | {mate1}: "WHO IS THIS? ARE YOU ONLINE? FROM YOUR ROOM?" |
| `c3.chat.a2` | mate2 | JackNet Chat | {mate2}: "Look at you. Welcome to the information superhighway. Mind the speed bumps." |
| `c3.chat.a3` | mate3 | JackNet Chat | {mate3}: "I've been online for ages. I've seen everything. There's a website about ducks." |
| `c3.chat.a4` | mate4 | JackNet Chat | {mate4}: "Can you download things? I know a place for free games. Bit risky though." |
| `c3.chat.me2` | me | After the first message | This is the future. Right here, in my bedroom. |

### Get off the internet

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c3.hangup.dad` | dad | The player has been online for 5 minutes, Dad downstairs, muffled [downstairs] | shouting | Oi! I need the phone! Get off the internet! |
| `c3.hangup.dad2` | dad | If the player doesn't hang up within 20 seconds | urgent | I'm expecting an important call! Off! Off! Off! |
| `c3.hangup.mom` | mom | Mom, same moment | dryly | It's like living with a dial-up goblin. |
| `c3.hangup.ok` | dad | Player hangs up in time | relieved | Thank you. See? We can all get along. \| |
| `c3.hangup.late` | dad | Player was late (comic penalty: Dad stomps up) | grumpy | You were on there for twenty minutes! Do you know what that costs? Do you? It's like feeding pound coins into a shredder. \| |
| `c3.bill.dad` | dad | Later the same day, Dad at the bottom of the stairs, optional | despairing | The phone bill came. I won't say how much. I'll just say it's enough to buy a console. \| |
| `c3.bill.mom` | mom | Mom after the bill | firm | From now on, off-peak. After six. And on a Saturday. That's the deal. \| |
| `c3.end.mom` | mom | Chapter complete, Mom at the doorway | warmly | Well, you've done it. Now don't make me regret it. \| |
| `c3.end.dad` | dad | Chapter complete | proud | Not bad. Proper little engineer. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c3.end.me` | me | Chapter complete card | My own PC, my own console, my own line. Now I want everything. |


---

# Ch4 "The Collector"

Open-ended, the rest of 1999. Goals rotate; the calendar (same day and month as today in 1999) layers dated events on top. Always one clear next thing plus optional extras.

## Beats

1. Title card. The diary page becomes "Collection": console shelf, games tally, trading cards, magazine issue count. Each rotating goal is a quick tangible target (a game, a card set, a tournament with mates).
2. Rotating goals (pick 1 main, 2 optional): second game, a second controller for a mate, read the new magazine issue, swap with mates, Pocket Critters trading (JackK), tournament night (mates round, Mom's sandwiches), Teletext cheat codes, secret hunts.
3. DAYDREAM LAUNCH, 14/10/1999 (dated). Morning: a Teletext page and mates' texts: it is out today. Optional: save (£199.99 in the shop). Mom's deal: she puts in half if the player saves half and Mom's good books are high. Optional: the shop window (displays Zip Adventure; kids queue). Order from Pixel Post; arrives like Ch2. Build a very big moment: bigger parcel, unboxing with the announcer jingle.
4. HALLOWEEN, 31/10 (dated): pumpkin carving (seasonal chore, Dad with a bad torch joke), a doorbell trick-or-treat mini-event (sister dressed up, Mom hands out sweets), a spooky TV special, a mate texts "scary game night".
5. BONFIRE NIGHT, 5/11 (dated): sparklers in the garden with Dad, rocket noises over the road, Mom: "gloves on", the sister writes her name in the air with a sparkler. Hot dogs.
6. CHRISTMAS (dated, from 01/12): the Christmas list (a physical notepad on the desk and a letter to Father Christmas), decorations seasonal chore (tree, lights, tinsel), carol singers at the door, the school play (sister), Gran's visit, Christmas Eve, Christmas morning (a parcel under the tree maps to what the player wished for and earned in good books).
7. MILLENNIUM COUNTDOWN (dated, 31/12, ends BEFORE midnight since the game never shows after 31/12/1999): everyone is excited and slightly worried about "the millennium bug". Dad's supplies (torch, candles, bath full of water, "just in case"). Evening: the telly special, mates ring at 11pm, countdown on screen, all the clocks. The final countdown ends on the last seconds of 31/12/1999: cheer audio, fireworks, fade to white and a closing diary page. No date after 31/12/1999 is ever displayed.

## Objectives (21)

| id | diary text (first person) | hint | notes / test |
|---|---|---|---|
| `coll2` | Get a second game for my console. | NEW. A console with one game is a sad console. Browse Pixel Post and pick a new game. | NEW. Test: order.game2 |
| `ctl2` | Buy a second controller for when mates come round. | NEW. Two players is twice the fun. | NEW, optional. Test: order.pad2 |
| `mag.issue` | Read this month's JACK ATTACK! magazine cover to cover. | NEW. Open it on the shelf (F), turn the pages. | NEW, optional. Test: mag.read |
| `trade` | Swap a game or a Pocket Critters card with a mate. | NEW. Ring or chat a mate, agree a swap, hand it over. | NEW, optional. Test: trade.done |
| `tourney` | Hold a tournament night with the mates. | NEW. Needs two controllers and Mom's good books for "friends round". | NEW. Test: tourney.done |
| `dd.news` | The Daydream is out TODAY! Find out all about it. | NEW, dated 14/10. Check Teletext, or ring a mate. | NEW, dated 14/10. Test: dd.news |
| `dd.save` | Save up for a Daydream: about £200! | NEW. Pocket money, jobs, JackBay. Mom will pay half if I keep my good books up. | NEW. Test: money.daydream |
| `dd.deal` | Strike a deal with Mom about the Daydream. | NEW. F on Mom. She names her price. | NEW. Test: talk.mom.daydream |
| `dd.order` | Order the Daydream from Pixel Post. | NEW. Order the console with Zip Adventure if the budget stretches. | NEW. Test: order.daydream |
| `dd.unbox` | The big box! Open the Daydream parcel. | NEW. Stand up from the PC and F in the hall. | NEW. Test: parcel.daydream |
| `dd.setup` | Carry it up and connect it. Cable to telly, cable to phone socket. | NEW. The Daydream has a modem built in: plug the phone lead from the hall line. | NEW. Test: connect.daydream |
| `dd.play` | First game on the Daydream. This is the future. | NEW. Insert the disc and F to play. | NEW. Test: play.daydream |
| `hal.carve` | Carve a pumpkin with Dad. | NEW, dated 31/10. Seasonal chore. | NEW. Test: chore.pumpkin |
| `hal.treat` | Answer the door to the trick-or-treaters. | NEW, dated 31/10 evening. Bowl of sweets by the front door. | NEW. Test: event.treat |
| `bon.spark` | Light sparklers in the garden with Dad. | NEW, dated 05/11. F to light each sparkler with Dad's help. | NEW. Test: event.sparkler |
| `xmas.list` | Write my Christmas list. | NEW, dated from 01/12. Notepad on the desk: pick up to six things. | NEW. Test: xmas.list |
| `xmas.decor` | Put up the Christmas decorations. | NEW, dated from 01/12. Seasonal chore: tree, lights, tinsel. | NEW. Test: chore.xmas |
| `xmas.gran` | Gran is visiting for Christmas! Tidy the lounge. | NEW, dated 20 to 24/12. Quick tidy before Gran's key in the door. | NEW. Test: event.gran |
| `xmas.day` | It's Christmas morning! Open my presents. | NEW, dated 25/12. Mom and Dad at the tree. | NEW. Test: event.xmasday |
| `mill.prep` | Help Dad get the house ready for the millennium. | NEW, dated 31/12. Torch, candles, water in the bath, "just in case". | NEW. Test: event.millprep |
| `mill.count` | The countdown! Stay up until midnight. | NEW, dated 31/12 evening. Telly special, mates ring, the clock ticks. | NEW. Test: event.millcount |

### Collector hooks (any time)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.start.mom` | mom | Chapter 4 title card ends, Mom pops her head round | warmly | Look at you. A PC, a console and a phone line. What's next, a spaceship? \| |
| `c4.start.dad` | dad | Chapter 4 title card ends | amused | Don't expect me to be your bank. Anything else you want, you save up for. \| |
| `c4.game2.mom` | mom | A second game is ordered | wry | Another one? Is the first one broken already? \| |
| `c4.game2.dad` | dad | Dad at the door | knowing | A collector. Your mother had a thing for teaspoons. Look where that got us. \| |
| `c4.mag.sis` | sister | The sister sees the magazine cover | cheeky | Is that the new one? Let me see! Let me see! \| |
| `c4.mag.dad` | dad | Dad peeking at the magazine | amused | Cheat codes, hints, tips. In my day we just got stuck. \| |
| `c4.trade.mom` | mom | Mom sees a swap | wary | A swap? Fair, I hope. Don't let anyone take advantage of you. \| |
| `c4.trade.dad` | dad | Swap done | cheerful | Look at that. Wheeler-dealer. Careful, or you'll end up on the telly. \| |
| `c4.tourney.mom` | mom | Mom agrees to friends round | pleased | Fine. But shoes off, no running, and I'm doing sandwiches, not a restaurant. \| |
| `c4.tourney.sis` | sister | The sister wants in | whiny | I want to play! I'll be quiet! I'll be good! Pleeease! \| |
| `c4.tourney.dad` | dad | Dad passes the door during the tourney | cheeky | Who's winning? No, don't tell me. I'll be disappointed either way. \| |
| `c4.tourney.end` | mom | Tourney over | warmly | Right, that's enough noise for one night. Thank you for being so lovely and polite. \| |

### Daydream launch day (14/10/1999)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.dd.mom` | mom | Mom in the kitchen reading the paper | wry | Everyone's talking about this Daydream thing. I told your father it's a phase. Then he asked to try one. \| |
| `c4.dd.dad` | dad | Dad at breakfast | cagey | A hundred and ninety-nine pounds? For a games machine? I'd want a holiday thrown in for that. \| |
| `c4.dd.dad2` | dad | After the player makes the case | cautious | It does the internet too? Does it do my tax return? No? Pity. \| |
| `c4.dd.mom.deal` | mom | The deal, Mom at the table | firmly | Here's the deal. You save half. I'll put in half. But only if I see you keep up the jobs. No slacking. And no whinging. \| |
| `c4.dd.mom.deal2` | mom | If good books are high | warmly | I'm proud of how hard you've worked. Go on, then. \| |
| `c4.dd.mom.no` | mom | If good books are low | gently | Not yet, love. Show me a few good weeks and we'll talk again. \| |
| `c4.dd.sis` | sister | The sister overhears the plan | begging | Can I have a go when you get it? I'll be really good. I'll do your jobs. \| |
| `c4.dd.shop` | mom | Optional shop window moment | cautious | The queue goes round the corner. No, we're not queuing. Pixel Post, remember? \| |
| `c4.dd.parcel` | sister | Sister at the door when the parcel arrives | shrieking | IT'S HERE! IT'S HERE! IT'S THE BIG ONE! \| |
| `c4.dd.unbox.dad` | dad | Dad at the doorway | awed | That's one big box. It's like a fridge. \| |
| `c4.dd.unbox.mom` | mom | Mom | amused | Please keep the box. I'll need something to put the Christmas decorations in. \| |
| `c4.dd.setup.dad` | dad | Dad as the Daydream is set up | helpful | The phone lead goes in the back. That's the modem. Don't ring a premium number. \| |
| `c4.dd.boot` | announcer | The Daydream first boot, crunchy console filter | booming | Daydream. It's thinking. |
| `c4.dd.boot2` | announcer | After the boot logo | epic | Welcome to the future. Press start. |
| `c4.dd.zip` | announcer | Zip Adventure title card | epic | Zip Adventure! Get ready to run! |
| `c4.dd.first` | sister | Sister at the first level | amazed | It's so shiny. It looks like a real film. \| |
| `c4.dd.mom.end` | mom | Daydream played for ten minutes | warmly | Dinner in five. And I mean five. Not "after this level". \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c4.dd.tele` | sys | Teletext page, morning of 14/10 | PAGE 150: DAYDREAM LAUNCH TODAY. About £200. Built-in modem. Queues expected. Mind the shop doors. |
| `c4.dd.me` | me | First Daydream game | I've been waiting for this since forever. Zip Adventure looks AMAZING. |
| `c4.dd.mate1` | mate1 | Text, launch day | {mate1}: "Are you getting one?! I'm going to the shop right now. They won't let me have one but I'm going." |
| `c4.dd.mate2` | mate2 | Text | {mate2}: "I've read the specs. Sixteen megabytes. Three D graphics. I'm basically a scientist." |
| `c4.dd.mate3` | mate3 | Text | {mate3}: "Mine's on order. Delivery in two weeks. Mine's better when it comes." |
| `c4.dd.mate4` | mate4 | Text | {mate4}: "If you get one, I've got a game you'll want. It costs a lot. I'm joking. It costs a bit." |

### Halloween (31/10)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.hal.mom` | mom | Mom in the kitchen, morning | cheerful | It's Halloween! Don't worry, I've got a bowl of sweets. Sweets for them, not for you. \| |
| `c4.hal.dad` | dad | Dad with a pumpkin on the drive | joking | Right, pumpkin. How hard can it be? Mind your fingers, now. \| |
| `c4.hal.dad.carve` | dad | Carving | amused | Is it supposed to look like that? Maybe it's meant to be scary. Because it is. \| |
| `c4.hal.sis` | sister | The sister in costume at the door | spooky | Wooooo! I'm a ghost! Do I look scary? Say yes. \| |
| `c4.hal.treat` | mom | Doorbell, trick-or-treaters | warmly | Trick or treat, here they come. Be nice. Give them a handful, not the whole bowl. \| |
| `c4.hal.treat.dad` | dad | Dad sneaks a sweet from the bowl | hungry | What? I'm checking quality. \| |
| `c4.hal.treat.mom` | mom | Mom sees Dad | scolding | Put them back! \| |
| `c4.hal.night` | dad | Evening, Dad switching the lights off | spooky | Everyone ready? Spooky telly, lights off. Who's brave enough? \| |
| `c4.hal.night2` | sister | The sister hiding behind the settee | frightened | I'm not scared. I'm just hiding. For fun. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c4.hal.mate` | mate1 | Text | {mate1}: "Halloween night! Come round and we'll play the scariest game we've got in the dark. Bring a torch." |

### Bonfire Night (05/11)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.bon.dad` | dad | Dad in the garden with a box of sparklers | excited | Right. Sparklers. Gloves on, everyone. Hold it by the bottom, point it away, stay back. \| |
| `c4.bon.mom` | mom | Mom, quiet warning | firm | Gloves on! And nobody waves one near anyone else. \| |
| `c4.bon.sis` | sister | The sister writes in the air with her sparkler | thrilled | Look! I'm writing in the air! Can you read it? \| |
| `c4.bon.dad2` | dad | Rockets over the road | peaceful | Oooh. That's a good one. Better than ours, bless them. \| |
| `c4.bon.mom2` | mom | Hot dogs | warmly | Hot dogs and a cup of tea. That's what Bonfire Night's all about. \| |
| `c4.bon.end` | dad | Sparklers burn out | warmly | That's your lot. Good night, everybody. Bed in half an hour. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c4.bon.mate` | mate2 | Text | {mate2}: "Did you hear the bang? That was MY rocket. I think it went the wrong way." |

### Christmas (December)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.xmas.mom` | mom | 01/12 morning, Mom | cheerful | It's December! Time for the lights, the tree and your Christmas list. And a little less moaning. \| |
| `c4.xmas.dad` | dad | Dad with a tangle of fairy lights | grumbling | Every year the lights are tangled. Every single year. I put them away neatly. They break into a knot overnight. \| |
| `c4.xmas.sis` | sister | The sister and the tree | excited | Can I put the star on? Can I? Can I? It's my turn this year! \| |
| `c4.xmas.list.mom` | mom | Mom reading the list | wry | A Daydream. A games magazine subscription. A new game. Is that it? That's not a list, it's a ransom note. \| |
| `c4.xmas.list.dad` | dad | Dad sees the list | amused | Ask Father Christmas. He's got a lot of paperwork. \| |
| `c4.xmas.carol` | mom | Carol singers at the door | warmly | Oh, carol singers! How lovely. Quick, find some change. \| |
| `c4.xmas.carol.dad` | dad | Dad, same moment | joking | They're not bad. A bit flat in the second verse. \| |
| `c4.xmas.gran` | gran | Gran arrives (20 to 24/12) | delighted | Hello, my darlings! Merry Christmas! Look at you all. You've grown a foot! \| |
| `c4.xmas.gran2` | gran | Gran, second line | warm | I've brought mince pies and a bit of everything. And a little something for the stocking. \| |
| `c4.xmas.gran3` | gran | Gran about the PC | amused | What's that? The internet? Does it do crosswords? \| |
| `c4.xmas.gran4` | gran | Gran about the console | cheerful | A games machine? In my day we had a ball and a bit of string. And we were grateful. \| |
| `c4.xmas.eve` | mom | Christmas Eve, bedtime | whisper | Hang your stocking up and off to bed. Father Christmas won't come if you're awake. \| |
| `c4.xmas.eve.dad` | dad | Dad on the landing | whisper | Is he asleep yet? Good. Shh. I'm eating the mince pie. \| |
| `c4.xmas.morn` | sister | 25/12 very early, sister at the door | shrieking | HE'S BEEN! HE'S BEEN! GET UP! GET UP! \| |
| `c4.xmas.morn.mom` | mom | Mom, a minute after | sleepy | It's six in the morning. Go back to bed. Oh, who am I kidding? Go on, then. \| |
| `c4.xmas.morn.dad` | dad | Dad at the tree | jolly | Merry Christmas, everyone! Let's see what he's brought. \| |
| `c4.xmas.thanks` | mom | After opening presents | warmly | Right. Who's making tea? Not me. I'm doing the dinner. \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c4.xmas.me` | me | Presents opened | That's the best Christmas ever. A new game, a box of chocolates and nobody shouting. Brilliant. |

### Millennium countdown (31/12)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `c4.mill.dad` | dad | Dad with a torch at the cupboard | prepping | Right. Torch, candles, tin opener, water in the bath. The millennium bug won't catch us out. \| |
| `c4.mill.mom` | mom | Mom | wry | It's a bug in a computer, not the end of the world. But if it's a good excuse for a party, I'll take it. \| |
| `c4.mill.dad2` | dad | Dad, ironic | joking | Everyone's been very nervous. I've told the PC it's been a very good PC. Just in case. \| |
| `c4.mill.sis` | sister | The sister | excited | Can I stay up until midnight? Pleeease? It's the millennium! \| |
| `c4.mill.mom.yes` | mom | Mom concedes | smiling | Just this once. Now where are my slippers? \| |
| `c4.mill.tv` | announcer | The telly special, evening | booming | Tonight is the night. Ten minutes to go. The whole country is counting. |
| `c4.mill.count` | dad | Countdown, final ten seconds | excited | Ten! Nine! Eight! Seven! Six! Five! Four! Three! Two! One! \| |
| `c4.mill.mom.cheer` | mom | At the last second of the countdown; the screen fades to white as the cheer plays (nothing after 31/12/1999 is shown) | joyful | Happy New Year, everyone! \| |
| `c4.mill.dad.cheer` | dad | Same moment | cheering | HAPPY NEW YEAR! And the lights are still on! \| |
| `c4.mill.sis.cheer` | sister | Same moment | squealing | It's the new millennium! It's the future! \| |
| `c4.mill.gran` | gran | Gran on the phone, if the line is free | warm | Happy New Year, my darlings! I've seen the fireworks on the television. Aren't they lovely? \| |

| id | who | when / where | on-screen text |
|---|---|---|---|
| `c4.mill.mate1` | mate1 | Phone call, 11pm | {mate1}: "Is it midnight yet?! How long's left?! Is the telly still working?!" |
| `c4.mill.mate2` | mate2 | Phone call | {mate2}: "Statistically, nothing is going to happen. But if the lights go out, I told you so." |
| `c4.mill.mate3` | mate3 | Text at 23:50 | {mate3}: "Still here. Nothing has blown up. Ten minutes!" |
| `c4.mill.mate4` | mate4 | Text at 23:55 | {mate4}: "Almost! New game, new swap deals, same me. Happy New Year in advance." |
| `c4.mill.me` | me | Diary, last page of the year | Nothing exploded. The lights are still on. Nearly a brand new millennium, and I have a PC, a console and the whole world to play with. |


---

# Ambient house life, chores and mates

Not tied to a chapter. Barks fire from NPC routines (time of day, room, state). Each bark has a cooldown; never repeat the same bark twice in a row. Name call-outs: a line with callout= plays the name clip first ("SARAH!") then the line; if no name clip exists the line plays alone.

## Beats

1. Tea time (about 17:30 to 18:30): Mom calls the player down, Dad grumbles about the telly, the sister bangs the table.
2. Phone line: Dad guarding it, the phone ringing, Mom talking to Gran.
3. Telly too loud, mess, bedtime (21:00 onwards), school morning (Monday to Friday, 07:30), weekend (Saturday and Sunday mornings), visits (Gran), power cut.

### Tea time

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.tea1` | mom | Kitchen, 17:30 to 18:30, the player upstairs, muffled [downstairs] | shouting | Tea's ready! Come down before it goes cold! |
| `bark.mom.tea2` | mom | Same [downstairs] | calling | Wash your hands and come and sit down! |
| `bark.mom.tea3` | mom | Second call after 60 seconds | impatient | I'm not calling again! It's on the table! |
| `bark.mom.tea4` | mom | Kitchen, player in the room | warmly | Sit down, love. Eat it while it's hot. \| |
| `bark.mom.tea5` | mom | At the table | pleased | Ah, that's what I like to see. A clean plate. \| |
| `bark.dad.tea1` | dad | Lounge to kitchen | hungry | Smells good. What's for tea? No, don't tell me. Let me guess. Chips? \| |
| `bark.dad.tea2` | dad | At the table | cheerful | The ketchup is in the middle, I see. Good. The system works. \| |
| `bark.dad.tea3` | dad | At the table | amused | Pass the salt. No, not that. The other salt. \| |
| `bark.sis.tea1` | sister | At the table | whiny | I don't like the green bits. Can I have just the orange bits? \| |
| `bark.sis.tea2` | sister | At the table | cheeky | Can I leave the table? I've finished. I mean I've pushed it round. \| |
| `bark.sis.tea3` | sister | At the table, a sibling quarrel | whiny | They're looking at me! Mom, they're looking at me! \| |

### Phone line

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.dad.line1` | dad | Hall, the player is on the phone | firm | Oi, don't hog the phone. I might be getting a call. \| |
| `bark.dad.line2` | dad | Hall, player online on the PC | grumbling | Is that the internet again? It sounds like a kettle with a cold. \| |
| `bark.dad.line3` | dad | Hall | muttering | The bill. The bill. I dread the bill. \| |
| `bark.mom.line1` | mom | Hall, answering the phone | brisk | Hello? Oh, hello, Gran! Yes. Yes. They're being very good. Aren't you? \| |
| `bark.mom.line2` | mom | Hall, a long call | gossiping | No, never! Well I never. And then what did she say? \| |
| `bark.mom.line3` | mom | Hall, call for the player [downstairs] | calling | Phone! It's for you! One of your friends! And keep it short! |
| `bark.sis.line1` | sister | Hall, ringing phone | bossy | I'll get it! I'll get it! Hello? Who's calling? \| |
| `bark.sis.line2` | sister | Hall | gossiping | Mom, it's for you. Somebody called Doreen. She talks a lot. \| |

### Telly too loud

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.tv1` | mom | Lounge, TV volume high | shouting | Turn that down! I can hear it from the kitchen! |
| `bark.mom.tv2` | mom | Lounge | exasperated | Is that the telly or a rocket launch? \| |
| `bark.dad.tv1` | dad | Lounge | grumpy | Hang on, I'm watching that. Dad's choice. It's the football. \| |
| `bark.dad.tv2` | dad | Lounge | muttering | It's all adverts these days. Four minutes of programme, ten of adverts. \| |
| `bark.dad.tv3` | dad | Lounge, Teletext | pleased | Page one-oh-one, for the news. Page three-two-six, for the scores. Wonderful stuff. \| |
| `bark.sis.tv1` | sister | Lounge | whiny | I want cartoons! It's my turn! You had it yesterday! \| |
| `bark.sis.tv2` | sister | Lounge | cheeky | I can't hear it. Turn it up. Turn it UP. \| |

### Mess

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.mess1` | mom | Landing, bedroom door open, mess on the floor [downstairs] | exasperated | Have you SEEN your room? There's a plate in there older than me! |
| `bark.mom.mess2` | mom | Hall, shoes on the floor | grumbling | Whose shoes are these in the middle of the hall? I nearly broke my neck! \| |
| `bark.mom.mess3` | mom | Lounge, mess on the coffee table | firm | Cups in the kitchen, please. They don't walk there on their own. \| |
| `bark.mom.mess4` | mom | Kitchen | tired | Why is the sink always full? Where do all the plates come from? \| |
| `bark.dad.mess1` | dad | Hall | grumbling | I've lost my keys. Has anyone seen my keys? They were here a minute ago. \| |
| `bark.dad.mess2` | dad | Lounge | muttering | Who's been using my chair? It's still warm. \| |
| `bark.sis.mess1` | sister | Hall | tattling | Mom! They left their socks in the lounge again! \| |
| `bark.sis.mess2` | sister | Hall | smug | I tidied my room. Look. I've done everything. Where's my pound? \| |

### Bedtime

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.bed1` | mom | Landing, 21:00, the player still up | calling | It's gone nine! Bedtime for little ones! And the rest of you, don't stay up too late! |
| `bark.mom.bed2` | mom | 21:30 [downstairs] | gentle | Lights out, love. School tomorrow. Sleep tight. |
| `bark.mom.bed3` | mom | 22:00 | sleepy | Right, I'm off up. Don't stay on that computer all night. \| |
| `bark.dad.bed1` | dad | 21:30 | yawning | Is it bedtime yet? I'm shattered. Night night. \| |
| `bark.dad.bed2` | dad | 22:00, the player still on the PC [downstairs] | warning | I can hear that keyboard clicking. Lights out. I mean it. |
| `bark.sis.bed1` | sister | 20:30 | whiny | I'm not tired! I don't wanna go to bed! \| |
| `bark.sis.bed2` | sister | 21:00 | sleepy | Can I have a drink of water? And a story? And the landing light? \| |

### School morning (Monday to Friday, 07:30)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.school1` | mom | Kitchen, morning, muffled [downstairs] | shouting | Get up! You'll be late! The bus doesn't wait for anyone! |
| `bark.mom.school2` | mom | Hall | frantic | Where's your bag? Where's your PE kit? Have you got your dinner money? \| |
| `bark.mom.school3` | mom | Hall, door | calling | Coat! Scarf! Don't forget your lunch! Have a good day! \| |
| `bark.dad.school1` | dad | Hall | rushed | Morning, morning! I'm late! Where's my tie? Never mind! \| |
| `bark.sis.school1` | sister | Hall | whiny | I can't find my shoe. It was right there. Someone moved it. \| |
| `bark.sis.school2` | sister | Kitchen | grumbling | I don't wanna go. I've got a spelling test. \| |

### Weekend (Saturday and Sunday)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.wknd1` | mom | Kitchen, Saturday morning | relaxed | Pancakes? Who wants pancakes? Don't all shout at once. \| |
| `bark.mom.wknd2` | mom | Sunday | briskly | Roast on at one. Be in for one, not five past. \| |
| `bark.dad.wknd1` | dad | Saturday | cheerful | Right. The car won't wash itself. Or will it? Let's find out. \| |
| `bark.dad.wknd2` | dad | Sunday, in the chair | relaxed | Sunday. A day of rest. Do not disturb the rest. \| |
| `bark.dad.wknd3` | dad | Saturday | generous | It's Saturday. Pocket money day. Don't spend it all at once. \| |
| `bark.sis.wknd1` | sister | Saturday morning | cheeky | Cartoons! Saturday morning telly! The best! \| |
| `bark.sis.wknd2` | sister | Sunday | excited | Can we go to the park? Can we? Pleeease? \| |

### Gran visits (event)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.gran.hello` | gran | Doorbell, Gran at the door | delighted | Hello, my darlings! It's only me! Don't get up! \| |
| `bark.gran.hug` | gran | Hallway | warm | Give your Gran a cuddle! Let me look at you. Aren't you tall? \| |
| `bark.gran.coin` | gran | Gran slips the player a coin | secretive | Here's a little something. Don't tell your mother. Spend it on something sensible. \| |
| `bark.gran.plant` | gran | Gran sees the spider plant | proud | Ah, my spider plant! You've kept it going. Good. It likes a chat. \| |
| `bark.gran.tea` | gran | Kitchen, Gran | cheerful | I'll have a cup of tea. And a biscuit. Or three. \| |
| `bark.gran.pc` | gran | Bedroom, Gran sees the PC | puzzled | Is that a typewriter with a television? Whatever next? \| |
| `bark.gran.bye` | gran | Gran leaving | warm | Right, I'll be off. Be good for your mother. Ta ta! \| |
| `bark.mom.gran` | mom | Hall, five minutes before Gran arrives [downstairs] | flustered | Gran's coming! Tidy the lounge! Quick! She'll look in the cupboards! |

### Power cut (event)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.dad.cut1` | dad | Everything goes dark | calm | Fuse has gone. Don't panic. Stay where you are. I'll find the torch. \| |
| `bark.dad.cut2` | dad | Cupboard under the stairs | muttering | Where's the torch? I put it exactly here. I put it exactly here. \| |
| `bark.mom.cut1` | mom | Kitchen | calling | Is everybody all right? Stay still! I'll find the candles. \| |
| `bark.mom.cut2` | mom | Lights back on | relieved | Phew. Lights are back. I'd forgotten what the kitchen looks like. \| |
| `bark.sis.cut1` | sister | Dark | scared | Mom? It's dark! I don't like it! \| |
| `bark.sis.cut2` | sister | Lights back | thrilled | They're back! It's magic! \| |

### General reactions (any room)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `bark.mom.react.praise` | mom | Random, after a good streak | warmly | You've been such a help lately. I've noticed. \| |
| `bark.mom.react.nag` | mom | Random, jobs not done by noon | wry | I'll give you pocket money when the washing-up's done, not before. \| |
| `bark.mom.react.cat` | mom | Cat event | amused | Whose cat is that on my table? Shoo! Shoo! \| |
| `bark.mom.react.hoover` | mom | Hoover bag bursts | exasperated | Oh no. The bag's burst! There's dust everywhere! \| |
| `bark.mom.react.phone` | mom | Phone rings mid-washing-up | amused | Answer that for me, my hands are wet! \| |
| `bark.dad.react.garden` | dad | Garden | pleased | A fine lawn. I should enter it in a competition. \| |
| `bark.dad.react.gnome` | dad | Gnome | proud | I've named the gnome Kevin. He's very quiet. \| |
| `bark.dad.react.joke` | dad | Random | deadpan | Why did the computer go to the doctor? It had a virus. Thank you, I'm here all week. \| |
| `bark.dad.react.pc` | dad | Bedroom doorway | curious | Are you doing homework on that? I can hear a lot of explosions. \| |
| `bark.sis.react.lounge` | sister | Hall | cheeky | Nobody ever plays with me! \| |
| `bark.sis.react.peek` | sister | Doorway | whispering | I'm not spying. I'm just standing here. Normally. \| |
| `bark.sis.react.drawing` | sister | Showing a drawing | proud | Look at my picture! It's a dog. Or a horse. You choose. \| |
| `bark.sis.react.console` | sister | Beside the console | begging | Can I be player two? I'll let you win. Maybe. \| |

### Mom's chore feedback by rating (replaces MOMSAYS in ch-cat.js for recorded players)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `chore.rate.95a` | mom | Rating 95 to 100, Mom checks | amazed | Ooh! Who are you and what have you done with my real helper? \| |
| `chore.rate.95b` | mom | Rating 95 to 100 | proud | Gold star. GOLD STAR. \| |
| `chore.rate.95c` | mom | Rating 95 to 100 | delighted | Well I never. That is PERFECT. \| |
| `chore.rate.85a` | mom | Rating 85 to 94 | warm | That's lovely, thank you, love. \| |
| `chore.rate.85b` | mom | Rating 85 to 94 | pleased | See, that wasn't so hard, was it? \| |
| `chore.rate.85c` | mom | Rating 85 to 94 | warm | Ta, love. You're a star. \| |
| `chore.rate.70a` | mom | Rating 70 to 84 | dry | That'll do. Just about. \| |
| `chore.rate.70b` | mom | Rating 70 to 84 | wry | Thank you. Eventually. \| |
| `chore.rate.70c` | mom | Rating 70 to 84 | teasing | Was that so hard? Don't answer that. \| |
| `chore.rate.0a` | mom | Rating below 70 | suspicious | Hmm. I'll be checking that. \| |
| `chore.rate.0b` | mom | Rating below 70 | sceptical | Did you actually do it, or just move it about? \| |
| `chore.oops` | mom | A dropped plate or spilt water | gasping | Oh, careful! That's the good dish! \| |
| `chore.streak` | mom | Daily streak bonus awarded | delighted | A bonus! You've done it every day this week. I'm impressed. \| |
| `chore.allfour` | mom | All four jobs on today's list done | proud | All four done? Well! Here's a little extra for you. \| |

### Chore give and hand-in lines (Mom gives the job, then reacts on completion; the star rating line plays after the hand-in line)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `chore.tidy.give` | mom | Mom on the list, tidy | firm | Your room, please. Clothes in the basket, rubbish in the bin, plates down to the kitchen. \| |
| `chore.tidy.done` | mom | Tidy handed in | pleased | The carpet's visible again. Marvellous. \| |
| `chore.bed.give` | mom | Bed | firm | Make that bed. Pillow, pyjamas, duvet. Properly. \| |
| `chore.bed.done` | mom | Bed handed in | satisfied | Lovely. Looks like a hotel. A cheap one. \| |
| `chore.bin.give` | mom | Bin | firm | The bin in your room. Down to the kitchen before it walks. \| |
| `chore.bin.done` | mom | Bin handed in | pleased | Thank you. Smell that? That's fresh air. \| |
| `chore.cat.give` | mom | Cat | amused | Next door's cat is on your bed again. Feed it, and then please remove it. \| |
| `chore.cat.done` | mom | Cat handed in | amused | There. Fed and happy. Now it's going to want a cuddle. \| |
| `chore.plant.give` | mom | Plant | warm | Gran's spider plant needs a drink. Water it, and talk to it. Gran says it helps. \| |
| `chore.plant.done` | mom | Plant handed in | warm | It looks greener already. Gran would be proud. \| |
| `chore.washup.give` | mom | Washing up | firm | The washing-up, please. Hot water, a squirt of liquid, and the pans too. \| |
| `chore.washup.done` | mom | Washing up handed in | relieved | Not a plate left. You're a lifesaver. \| |
| `chore.table.give` | mom | Lay the table | brisk | Lay the table for tea, please. Four places. And the ketchup, for your father. \| |
| `chore.table.done` | mom | Table done | pleased | Perfect. Everything in the right place. For once. \| |
| `chore.shopping.give` | mom | Shopping | brisk | The shopping needs putting away. Fridge, freezer, cupboard. Not your bedroom. \| |
| `chore.shopping.done` | mom | Shopping done | pleased | Everything where it belongs. And the carrier bags folded. A miracle. \| |
| `chore.bins.give` | mom | Bins out | firm | The kitchen bin needs taking out. Round the back to the wheelie bin. And a new bag in. \| |
| `chore.bins.done` | mom | Bins done | satisfied | Thank you. The kitchen smells better already. \| |
| `chore.hoover.give` | mom | Hoover | brisk | The vacuum's in the cupboard under the stairs. Every crumb, please. \| |
| `chore.hoover.done` | mom | Hoover done | pleased | Spotless. You can see the stripes. \| |
| `chore.videos.give` | mom | Videos | patient | The videos are all over the floor. Back on the shelf, and rewind them. Be kind. \| |
| `chore.videos.done` | mom | Videos done | warm | That's better. I can find the film I want now. \| |
| `chore.cushions.give` | mom | Cushions | firm | The cushions, please. Plump them. On their corners, like diamonds. \| |
| `chore.cushions.done` | mom | Cushions done | pleased | Like diamonds. Very good. \| |
| `chore.car.give` | mom | Car | cheerful | Your father's car is a disgrace. Bucket, sponge, rinse. Watch out for the pigeon. \| |
| `chore.car.done` | mom | Car done | impressed | It's shining. Your father will be thrilled. And suspicious. \| |
| `chore.lawn.give` | mom | Lawn | firm | The front lawn. Straight stripes, please. Mind the cable. Mind the gnome. \| |
| `chore.lawn.done` | mom | Lawn done | pleased | Stripes like a cricket pitch. Very smart. \| |
| `chore.sweep.give` | mom | Sweep | brisk | The drive's covered in leaves. Brush them up, dustpan, dustbin. \| |
| `chore.sweep.done` | mom | Sweep done | pleased | Lovely and tidy. The neighbours will be jealous. \| |

### Dad's weekly big job and Saturday pocket money

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `chore.saturday` | dad | Saturday, Dad hands over weekly money | generous | Here you go. Saturday money. Don't say I never give you anything. \| |
| `chore.weekly.give` | dad | Dad assigns this week's big job | cheerful | Big job this week. Pays properly. Interested? \| |

### Announcer cues (console voice, crunchy filter)

| id | who | when / where | emotion | line |
|---|---|---|---|---|
| `ann.start` | announcer | Any console game start | booming | Player one. Get ready. |
| `ann.go` | announcer | Race and fighting start | booming | Go! |
| `ann.win` | announcer | Win screen | cheering | You win! |
| `ann.over` | announcer | Game over | dramatic | Game over. |
| `ann.continue` | announcer | Continue screen | urgent | Continue? |
| `ann.press` | announcer | Title screens | booming | Press start. |
| `ann.new` | announcer | New high score | excited | New high score! |
| `ann.lucky` | announcer | Bonus round | cheerful | Bonus round. Good luck! |

### Mates' phone calls about consoles and games (on-screen text only, no recorded voice; mates are not in the cast)

| id | who | when / where | on-screen text |
|---|---|---|---|
| `mate.call.1` | mate1 | Dials mate1 any time, hype | {mate1}: "Hello? Hang on, my mom's shouting at me. ... Right. What's up?" |
| `mate.call.2` | mate1 | Mate1 about the PlaySpace | {mate1}: "Did you see the new demo disc? There's a bit where the dinosaur chases you. I was screaming. My mom thought I'd hurt myself." |
| `mate.call.3` | mate1 | Mate1 about swaps | {mate1}: "Fancy a swap? I'll swap my racing game for yours. Honest. It's even got a scratch on it. Only a small one." |
| `mate.call.4` | mate2 | Mate2 knows everything | {mate2}: "I read in the mag that the next one is going to have a hard drive. That's like a floppy, but you can't lose it." |
| `mate.call.5` | mate2 | Mate2 about the Ultra 64 | {mate2}: "Four players, no waiting. And a stick in the middle that goes all the way round. It's basically a flight simulator for your thumb." |
| `mate.call.6` | mate2 | Mate2 about cheat codes | {mate2}: "I found a secret on the Teletext. Up, up, down, down, left, right... no, wait. That's a different one." |
| `mate.call.7` | mate3 | Mate3 has everything | {mate3}: "Yeah, I've got that. Finished it. Twice. Got the secret ending as well. It's rubbish." |
| `mate.call.8` | mate3 | Mate3 about the Segue | {mate3}: "The Segue? Cool. My cousin's got one. She says it's got a hedgehog who runs really fast." |
| `mate.call.9` | mate3 | Mate3 offering to lend | {mate3}: "I'll lend you my spare controller. Don't break it. Don't lose it. Don't let your sister touch it." |
| `mate.call.10` | mate4 | Mate4 swapping | {mate4}: "Pocket Critters cards. I've got three Charzards. Don't ask where I got them." |
| `mate.call.11` | mate4 | Mate4 about prices | {mate4}: "Heard the Daydream's £199. That's forty weeks of pocket money. I've done the maths." |
| `mate.call.12` | mate4 | Mate4 about demos | {mate4}: "Do you want to come round? I've got the demo disc. We can't save but we can pretend." |
| `mate.call.13` | mate1 | Mate1 after school | {mate1}: "Did you do the maths homework? No? Me neither. Copy mine tomorrow." |
| `mate.call.14` | mate2 | Mate2 about the magazine | {mate2}: "Issue nine of JACK ATTACK! has a poster of a space soldier with a very big gun. I've put it on my ceiling." |
| `mate.call.15` | mate3 | Mate3 about sleepovers | {mate3}: "Sleepover at mine on Friday? We can stay up playing the new game until my dad shouts." |
| `mate.call.16` | mate4 | Mate4 about bargains | {mate4}: "I found a second-hand cartridge in a charity shop for 50p. It's called 'Golf Fever'. I'm not sure it works but it smells interesting." |
| `mate.call.17` | mate1 | Mate1 goodbye | {mate1}: "Gotta go, my tea's ready! Speak later! Bye bye bye!" |
| `mate.call.18` | mate2 | Mate2 goodbye | {mate2}: "I've got to go. Mom needs the phone. See you at school." |


---

# Engine needs (not built yet)

- Objective tests marked NEW above (talk.*, streak.3, cable.*, isp.*, pc.dial.*, chat.sent, order.game2/pad2, trade.done, tourney.done, dd.*, event.*, xmas.*, mill.*) and a dated-objective scheduler (calendar events on the 1999 date).
- Dialogue runner: speaker, subtitle text, optional voice id, optional callout type; plays name clip then line; falls back gracefully.
- NPC routines and barks (cooldown, no immediate repeat, room/time/state triggers), Mom's good books meter, Dad's weekly big job, Saturday pocket money.
- Phone-extension cable as a physical, clip-by-clip placeable object; modem/ISP installer; dial-up connection with a hang-up event.
- Mates' phone-call and text engine with Cast slots; sister, Gran as characters.
- Voice id convention: audio/voice/<id>.mp3 and <id>.name-<key>.mp3; fx filters at playback or at render time.

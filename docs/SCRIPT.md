# SCRIPT: Jack Attack 1999, Chapters 1 to 4 (story script, objectives, voice and barks)

Written 2026-10-26. Source of truth for all spoken and on-screen story text. Follows docs/STORY.md (Revision 2026-10-26), docs/AUDIO.md and the AGENTS.md people rules. Machine-readable recorded lines: tools/audio/voice-lines.json (generated from this file).

## Conventions
- Setting: UK, 1999. Prices in pounds and pence; Rupees only via JackNet Bank (20 Rupees = £1). Mom, Dad and Gran are titles. Consoles use the parody names (Game Lad, Segue, PlaySpace, Ultra 64, Daydream); the magazine is JACK ATTACK!; the shop is Pixel Post; the PC is JackOS. Only the Daydream launch (14/10/1999) and the millennium countdown are real events, used lightly. No location clues, no birthday, nothing after 31/12/1999.
- On-screen text may use Cast placeholders: {me}, {me.his}, {sister}, {mate1}..{mate4}. Recorded voice lines never contain the player's name, the sister's name, or a gendered word for the player (no "lad", "he", "she"); the `line` field keeps their exact recorded words. A separate `display` template may restore the player's name on screen without changing the recording.
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
| `c4.xmas.eve.dad.neutral` | dad | Dad on the landing; old ID aliases to this neutral recording | whisper | Is everyone asleep yet? Good. Shh. I am eating the mince pie. |
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
| `mate.call.10` | mate4 | Mate4 swapping | {mate4}: "Pocket Critters cards. I've got three Charbroilers. Don't ask where I got them." |
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

# Runtime voice additions

Audited 4 November 2026. These rows reconcile the spoken runtime with the recording catalogue. Neutral British only. Name-dependent family shouts now work without a name; the existing name call-outs remain supported. The four required retakes keep their IDs. The old Christmas Eve Dad ID remains an alias to the neutral replacement, with the old clip suppressed until that replacement exists.

The Wobble Party host uses generic phrases for player names, scores and live button labels. Its original writing remains until the matching clip is installed, then the displayed line uses the recording’s exact words. Silent scores, objectives, diary pages, notes, chat and text messages are not voices. Uncast characters remain in VOICE-AUDIT.md for Jack’s decision.

| id | speaker | when / where | emotion | line |
|---|---|---|---|---|
| `arena.announcer.14a4q40` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | You have lost the match. |
| `arena.announcer.1cztk1n` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | rampage! |
| `arena.announcer.1f8e5lv` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Red team scores! |
| `arena.announcer.1rkro3l` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Multi Poof! |
| `arena.announcer.1y252m8` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Combo! |
| `arena.announcer.2fn0rj` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | You have won the match! |
| `arena.announcer.3lg1q9` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | unstoppable! |
| `arena.announcer.3vxdme` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | dominating! |
| `arena.announcer.7r5nkd` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | godlike! |
| `arena.announcer.d7miq8` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Blue team scores! |
| `arena.announcer.e6muxl` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | poofing spree! |
| `arena.announcer.gc44jq` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Play! |
| `arena.announcer.jrwjvq` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | First poof! |
| `arena.announcer.lcj2l7` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Double Poof! |
| `arena.announcer.mktc0m` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | MONSTER POOF! |
| `arena.announcer.yjtj8i` | announcer | Jackreal Tournament announcer; derived from server events, never player names; app/public/js/pcgames-jrt.js:534 | booming, neutral British | Ultra Poof! |
| `game.wobble.host.110fa57` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2666 | booming, neutral British | NOBODY WON THAT ONE. NO COINS! |
| `game.wobble.host.143a1lf` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2531 | booming, neutral British | THE SECRET MARBLE MISCHIEF DOOR IS OPEN IN THE MINIGAME HOUSE! |
| `game.wobble.host.14iizcv` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1255 | booming, neutral British | NO COINS TO GIVE! PHEW. |
| `game.wobble.host.15r76nk` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1232 | booming, neutral British | PICNIC TIME! EVERYBODY GETS 5 COINS. LOVELY! |
| `game.wobble.host.1bhurkg` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2564 | booming, neutral British | WIN EVERY SINGLE MINIGAME AND YOU'RE A PROPER LEGEND. RIGHT, LET'S SEE WHO GOES FIRST! |
| `game.wobble.host.1czxqcu` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1114 | booming, neutral British | THE STAR HAS FLOWN OFF TO A NEW SPOT! |
| `game.wobble.host.1d2y5jj` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2569 | booming, neutral British | AND THE FIRST STAR IS... OVER THERE! GO AND GET IT! |
| `game.wobble.host.1f6ot00` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2617 | booming, neutral British | YOU HAVEN'T GOT ANY ITEMS. THE SHOP SELLS THEM! |
| `game.wobble.host.1fya5t0` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2710 | booming, neutral British | AND NOW... THE WINNER OF THIS WOBBLE PARTY IS... |
| `game.wobble.host.1ja2uxa` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1093 | booming, neutral British | SUIT YOURSELF! IT'LL STILL BE HERE... PROBABLY. |
| `game.wobble.host.1rkqxmi` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1214 | booming, neutral British | HONK! A GOOSE WADDLES UP AND PINCHES 5 COINS! |
| `game.wobble.host.1syds4j` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2559 | booming, neutral British | WELCOME TO WOBBLE ISLAND! I'M MC WOBBLE, YOUR HOST WITH THE MOST! |
| `game.wobble.host.1v12lh` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2738 | booming, neutral British | AND YOU WON EVERY SINGLE MINIGAME! A CLEAN SWEEP! LEGENDARY! |
| `game.wobble.host.1w75573` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1090 | booming, neutral British | OH DEAR. COME BACK WITH MORE COINS! |
| `game.wobble.host.1yrfw5o` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2562 | booming, neutral British | WHOEVER HAS THE MOST STARS AT THE END WINS. I'LL SWAP YOU A STAR FOR COINS. |
| `game.wobble.host.1ysq7rd` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2685 | booming, neutral British | WHAT A PARTY! EVERYBODY TO THE PARTY STAGE FOR THE BONUS STARS! |
| `game.wobble.host.2asyz9` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2563 | booming, neutral British | BLUE SPACES GIVE YOU 3 COINS, RED ONES TAKE 3 AWAY. AFTER EVERY TURN THERE'S A MINIGAME: WIN IT FOR 10 COINS! |
| `game.wobble.host.2n6itx` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1171 | booming, neutral British | SWAP KAZOO! TIME TO SWAP PLACES! |
| `game.wobble.host.5steas` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1148 | booming, neutral British | THANK YOU! COME AGAIN! |
| `game.wobble.host.66rpmg` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2600 | booming, neutral British | ONLY THREE TURNS LEFT! FROM NOW ON, BLUE AND RED SPACES COUNT DOUBLE! |
| `game.wobble.host.6pkgli` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1257 | booming, neutral British | NO STARS TO GIVE! PHEW. |
| `game.wobble.host.6qi9t6` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1146 | booming, neutral British | YOU CAN'T AFFORD THAT ONE, SORRY! |
| `game.wobble.host.ar7z9n` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1204 | booming, neutral British | THE COUNT'S DISCOUNT LEVER! BARGAIN STARS! |
| `game.wobble.host.e7lqoo` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2737 | booming, neutral British | BAD LUCK! BETTER LUCK NEXT TIME! |
| `game.wobble.host.g6mio8` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2697 | booming, neutral British | TIME FOR A BONUS STAR! |
| `game.wobble.host.gt3to3` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1103 | booming, neutral British | YOU GOT A STAR! SPARKLY! |
| `game.wobble.host.h6mg4g` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1165 | booming, neutral British | COIN MAGNET! 3 COINS FROM EVERYBODY! |
| `game.wobble.host.h7wc9x` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1241 | booming, neutral British | STOP THE REELS! ANYTHING CAN HAPPEN! |
| `game.wobble.host.it4hyq` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1089 | booming, neutral British | YOU FOUND THE STAR! FANCY A SWAP? |
| `game.wobble.host.kj0owm` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2698 | booming, neutral British | NOBODY! NO BONUS STAR THIS TIME. |
| `game.wobble.host.mju42` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1203 | booming, neutral British | THE CLOCK IS STILL WINDING! IT ADDS 9 COINS EACH ROUND. |
| `game.wobble.host.nzkznm` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1138 | booming, neutral British | YOUR POCKETS ARE FULL! (THREE ITEMS MAX.) |
| `game.wobble.host.qm0di3` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1227 | booming, neutral British | SWAP SHOP! TIME TO SWAP COINS! |
| `game.wobble.host.t96fyl` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:2737 | booming, neutral British | WELL DONE! YOU'RE THE WOBBLE SUPERSTAR! |
| `game.wobble.host.vy6gev` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1223 | booming, neutral British | STAR SHUFFLE! THE STAR GETS BORED AND HOPS AWAY! |
| `game.wobble.host.ydyoml` | announcer | Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists; app/public/js/rm-g-party.js:1205 | booming, neutral British | THE WINDMILL PAYS ITS RENT! 5 COINS FOR EVERYBODY! |
| `bf.code.wait.7q2fba` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:244 | firm, neutral British | Closed tin, water, pets indoors, watching line. Check all four first. Then we can talk about the taper. |
| `bf.cooled.15r44gg` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:269 | firm, neutral British | Hot end down. Lovely. You remembered the important bit. Leave the wires in the water. |
| `bf.dad.talk.1dguuhl` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:740 | firm, neutral British | Tin shut, bucket full, pets indoors, everyone behind the rope, long taper. Five checks. No cutting corners. |
| `bf.dad.talk.1wfrt7z` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:740 | firm, neutral British | Safety checks all done. Dry wood only on the stack. Friday evening: torch at the rope, then supper. I do the lighting. |
| `bf.display.away.15tnmi0` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:538 | firm, neutral British | The display will carry on. Come back behind the rope when you are ready; you can still finish watching. |
| `bf.display.checks.1fqatvb` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:480 | firm, neutral British | Finish the dry stack and all five Firework Code checks first. |
| `bf.display.resume.1lc7fy1` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:483 | firm, neutral British | You are back! All finished safely. Stay at the rope while I check everything. |
| `bf.display.resume.z6a2bk` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:483 | firm, neutral British | The display carried on. Come back behind the rope and look up. |
| `bf.display.start.14xltvy` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:482 | firm, neutral British | Missed Friday? I saved a few. No jobs tonight: just stay behind the rope and watch. I do all the lighting. The show carries on if you leave; come back here to finish. |
| `bf.display.start.f55ktr` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:482 | firm, neutral British | I have checked for animals. Torch this way, everyone behind the rope. I light one, then come back. The display carries on if you leave; come back to the rope to finish. |
| `bf.display.time.1dhhkkv` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:479 | firm, neutral British | Half past six until ten in the evening. Warm things on, and watch from the rope. |
| `bf.end.aqcnqs` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:753 | firm, neutral British | All finished. I am making everything safe. Stay here while I check. Thank you for watching from the rope! |
| `bf.history.18sdxer` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:314 | firm, neutral British | Bonfire Night remembers a plot in 1605 to blow up Parliament. Our Guy is old clothes and newspaper. Dad nearly donated his good trousers. |
| `bf.lead.2w6y11` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:685 | firm, neutral British | Bonfire Night on Friday. Help me stack the dry garden wood, and you two can make a Guy. Closed firework tin stays with me. |
| `bf.line.2cmfdz` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:238 | firm, neutral British | Everyone stays behind the rope. Always follow the distance on the box. Never throw fireworks and NEVER go back to one, even if it has gone quiet. Leave it to me. |
| `bf.rocket.1a6z6bq` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | firm, neutral British | Here comes the rocket. Stay back. Never go back to a firework, even if it seems to have stopped. |
| `bf.sparkler.done.110908g` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:263 | firm, neutral British | Hot wire into the bucket now, please. |
| `bf.sparkler.done.72262s` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:263 | firm, neutral British | That was lovely. All the hot wires are in the water. Supper time. |
| `bf.sparkler.wait.1o96ayr` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:261 | firm, neutral British | Display first, sparklers afterwards. I have not forgotten. |
| `bf.tail.talk.times.8y9bbq` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:739 | firm, neutral British | Cold sticks in the bin. Leave the ash alone. If you missed Friday, I saved leftovers for the evening, half past six until ten. |
| `bf.tail.tw78cy` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:687 | firm, neutral British | I have damped the fire right down and checked the cold rubbish. Sticks and wrappers into the bin, please. Leave the ash alone; I will check it again. |
| `bf.taper.te7i05` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:245 | firm, neutral British | A long taper, at arm length. One adult in charge: me. Check! We light the bonfire after checking it for animals. No petrol or paraffin. All ready for Friday evening. |
| `bf.tin.1dmucg3` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:228 | firm, neutral British | Shop-bought, in their closed tin, up out of reach. No fireworks in pockets. I read the instructions and light one at a time. You watch from behind the rope. |
| `bf.water.1vy2tmp` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:231 | firm, neutral British | Bucket filled and parked behind the rope. Used sparklers go in hot end first. The wire stays hot, even when it looks cold. |
| `bf.wood.ncj5f5` | dad | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:122 | firm, neutral British | Dry wood and cardboard only. Paper, then kindling. No aerosols, glass, paint, plastic or fireworks on the fire. We check for hedgehogs before lighting. |
| `house.moment.1djssky` | dad | Time-of-day house shout; app/public/js/hs-life.js:69 | calling, neutral British | Bed! Now! |
| `house.moment.hwj5im` | dad | Time-of-day house shout; app/public/js/hs-life.js:71 | calling, neutral British | Is that the Internet on? Do you know how much those phone calls cost? |
| `house.moment.wd8c5e` | dad | Time-of-day house shout; app/public/js/hs-life.js:68 | calling, neutral British | Have you been using the phone? The bill came. |
| `house.voice.h701ve` | dad | House welcome, shout or event; app/public/js/hs-telly.js:411 | calling, neutral British | TURN THAT DOWN! IT'S THE MIDDLE OF THE NIGHT! |
| `hw.dad.match.hliuf7` | dad | Halloween, physical preparation / door; app/public/js/season-halloween.js:678 | warm, neutral British | Hang on, matches are my job. Long match, arm's length... there we go. |
| `hw.dad.safe.l28lnk` | dad | Halloween, physical preparation / door; app/public/js/season-halloween.js:1015 | warm, neutral British | Only knock on doors with the lights on, and never go in anyone's house. Mom's rules. And mine. |
| `st.carry.4c83tp` | dad | Dad explains computer carrying; app/public/js/st-opening.js:50 | warm, neutral British | E carries it. Take it to the marked place on your desk. Q puts it back safely. |
| `st.carry.wzg82y` | dad | Dad explains computer carrying; app/public/js/st-opening.js:50 | warm, neutral British | Plug in the marked leads, then press the power button. |
| `st.opening.dad.165n9l8` | dad | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:141 | warm, neutral British | The office is chucking out the old computers. Mine is in the boot if you want it. Mind the monitor: it weighs a ton! |
| `st.opening.lead.power.1h9zqa3` | dad | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:143 | warm, neutral British | Everything on the desk? Plug the leads into the matching sockets, then try the big button. |
| `st.opening.part.monitor.inylew` | dad | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:142 | warm, neutral British | Both hands on that monitor. No running on the stairs. |
| `st.opening.pc.oltv5s` | dad | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:144 | warm, neutral British | There you go. Your own computer. Try not to fill it with games. |
| `phone.in.0.17arros` | gran | Incoming landline call; app/public/js/hs-life.js:89 | warm, neutral British | Hello love! It's Gran. Is your Mom there? ...No? Never mind. |
| `phone.in.0.1fq2uuq` | gran | Incoming landline call; app/public/js/hs-life.js:89 | warm, neutral British | Are you still playing on that computer? Your Grandad says it'll make your eyes go square. |
| `phone.in.0.1qgwsdv` | gran | Incoming landline call; app/public/js/hs-life.js:89 | warm, neutral British | Are you eating properly? You're still growing. I've knitted you a jumper. It's got a reindeer on it. |
| `phone.in.0.reply.0.tcd887` | gran | Caller responds to player choice; app/public/js/hs-life.js:89 | warm, neutral British | Lovely. I'll send it in the post. Bye love! Bye! Bye bye! Bye! |
| `phone.in.0.reply.1.isje3h` | gran | Caller responds to player choice; app/public/js/hs-life.js:89 | warm, neutral British | Ooh. Well, as long as you're happy. Love to your Mom. Bye love! Bye bye! |
| `phone.out.01632960213.1c5kgqp` | gran | Outgoing landline call; app/public/js/hs-life.js:174 | warm, neutral British | Hello? Ooh, you never ring! Eating properly? Grandad says hello. HE SAYS HELLO. Bye, love! Bye! Bye bye! |
| `bf.already.food.otebpt` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:319 | warm, neutral British | Supper is on the garden table. Help yourself. |
| `bf.carry.food.1ar533q` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:321 | warm, neutral British | E carries the tray to the little garden table. Gloves on, mind. |
| `bf.cat.check.1q6dwpi` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | warm, neutral British | The cat is indoors. Keep the bedroom window shut tonight. Give the cat a quiet place to hide when the bangs start. |
| `bf.cat.check.3jrkba` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | warm, neutral British | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. |
| `bf.cat.check.p22a1x` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:575 | warm, neutral British | The cat is indoors. Keep the bedroom window shut for the display. Give the cat a quiet place to hide when the bangs start. |
| `bf.cat.safe.1n6nrdc` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:583 | warm, neutral British | The cat is safely indoors, hiding under the bed. Let the cat stay cosy. We will feed the cat when the bangs have stopped. |
| `bf.cat.w6iuui` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:274 | warm, neutral British | The cat is indoors with the curtains shut. Let the cat hide under the bed; keep the noise down in here. No need to pull the cat out. |
| `bf.day.5k1dof` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:686 | warm, neutral British | Bonfire Night! Potatoes, parkin and warm gloves. The washing is in and Dad has put the whirly line away. Keep the cat indoors. |
| `bf.finale.1gp0jav` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | warm, neutral British | Ooooh! Look at those gold ones. Like golden rain! |
| `bf.gloves.wait.prep.8fedwg` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:252 | warm, neutral British | Hat, gloves, wellies ready for Bonfire Night. Do the Firework Code with Dad before the sparklers. |
| `bf.gloves.wait.wmjtee` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:252 | warm, neutral British | Hat, gloves, wellies. It will be cold tonight. Do the Firework Code with Dad before the sparklers. |
| `bf.mom.talk.1ypwr09` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:742 | warm, neutral British | Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Then warm clothes on. No cold fingers tonight. |
| `bf.mom.talk.late.1ogjaal` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:741 | warm, neutral British | It is getting late. Help me put the supper things away, then off to bed. |
| `bf.mom.talk.prep.ouvann` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:742 | warm, neutral British | Jacket potatoes with cheese and beans, sticky parkin and treacle toffee. Help at the kitchen worktop. Have warm clothes ready for Bonfire Night. No cold fingers when we watch the display. |
| `bf.parkin.tzx22w` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:220 | warm, neutral British | Sticky ginger cake. Best made a day or two ahead. There is treacle toffee too. You can help with the potatoes; I do the hot oven and hot sugar. |
| `bf.sparkler.gloves.hhvm6u` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:262 | warm, neutral British | Gloves first! They are on the stool by the back door. |
| `bf.supper.1cixt9h` | mom | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:213 | warm, neutral British | Cheese and beans in your jacket potato? Parkin in the tin, treacle toffee on the plate. Mind your teeth. Hot sugar is my job, thank you. |
| `chore.rating.16wxa7r` | mom | Server-selected chore rating; app/public/js/ch-cat.js:131 | warm, neutral British | Did you actually do it or just move it about? |
| `chore.shout.106ah51` | mom | Chore completion / reminder; app/public/js/ch-core.js:144 | warm, neutral British | Ooh, ta! |
| `chore.shout.12cu3fo` | mom | Chore completion / reminder; app/public/js/ch-core.js:194 | warm, neutral British | Ta, love. |
| `chore.shout.1lof225` | mom | Chore completion / reminder; app/public/js/ch-core.js:547 | warm, neutral British | Those jobs won't do themselves! |
| `chore.shout.1ss7a6t` | mom | Chore completion / reminder; app/public/js/ch-core.js:547 | warm, neutral British | I can hear you NOT doing your jobs! |
| `chore.shout.1y83zff` | mom | Chore completion / reminder; app/public/js/ch-core.js:144 | warm, neutral British | Thank you! |
| `chore.shout.9bcrpq` | mom | Chore completion / reminder; app/public/js/ch-core.js:547 | warm, neutral British | Love? The list on the fridge? Remember the list? |
| `chore.shout.a506t6` | mom | Chore completion / reminder; app/public/js/ch-core.js:547 | warm, neutral British | Get off that computer and do your jobs! |
| `chore.shout.bdi29n` | mom | Chore completion / reminder; app/public/js/ch-core.js:144 | warm, neutral British | Good helper! |
| `chore.shout.y5q1ps` | mom | Chore completion / reminder; app/public/js/ch-core.js:547 | warm, neutral British | Have you done your jobs yet? |
| `chore.shout.zuxo6x` | mom | Chore completion / reminder; app/public/js/ch-core.js:144 | warm, neutral British | Ta, love! |
| `dialer.01632960777.1wxgtgo` | mom | JackOS Phone Dialer call; app/public/js/apps-programs.js:2132 | warm, neutral British | Have you done your homework? |
| `dialer.01632960777.n7bz0i` | mom | JackOS Phone Dialer call; app/public/js/apps-programs.js:2132 | warm, neutral British | Hello? Is everything alright? You're not on the Internet, are you? I can't ring home when you're on the Internet! |
| `house.moment.14u1i62` | mom | Time-of-day house shout; app/public/js/hs-life.js:71 | calling, neutral British | Get off the Internet! I need to ring your Nan! |
| `house.moment.18qfxaa` | mom | Time-of-day house shout; app/public/js/hs-life.js:72 | calling, neutral British | I'm popping to the shops. Do you want anything? ...Besides a Daydream. |
| `house.moment.1dd6ufc` | mom | Time-of-day house shout; app/public/js/hs-life.js:68 | calling, neutral British | It's a school night. Not too late, eh? |
| `house.moment.1gm6uua` | mom | Time-of-day house shout; app/public/js/hs-life.js:71 | calling, neutral British | Are you on that computer AGAIN? |
| `house.moment.1hou2xu` | mom | Time-of-day house shout; app/public/js/hs-life.js:64 | calling, neutral British | You'll be late for school! Have you had any breakfast? |
| `house.moment.1ibhhmo` | mom | Time-of-day house shout; app/public/js/hs-life.js:64 | calling, neutral British | Are you up? It's gone eight! Lazybones! |
| `house.moment.1kgk76z` | mom | Time-of-day house shout; app/public/js/hs-life.js:69 | calling, neutral British | Turn that light off, love, it's late. |
| `house.moment.1qhk3rh` | mom | Time-of-day house shout; app/public/js/hs-life.js:67 | calling, neutral British | Set the table please, love! |
| `house.moment.1qsooir` | mom | Time-of-day house shout; app/public/js/hs-life.js:67 | calling, neutral British | Tea in five minutes! Wash your hands! |
| `house.moment.1trq0u8` | mom | Time-of-day house shout; app/public/js/hs-life.js:66 | calling, neutral British | Come and get your washing, it's on the stairs! |
| `house.moment.1wxgtgo` | mom | Time-of-day house shout; app/public/js/hs-life.js:66 | calling, neutral British | Have you done your homework? |
| `house.moment.hypeuv` | mom | Time-of-day house shout; app/public/js/hs-life.js:65 | calling, neutral British | Why aren't you at school? ...Oh, it's an INSET day. Right. Well don't sit on that computer all day. |
| `house.moment.p8fwe0` | mom | Time-of-day house shout; app/public/js/hs-life.js:64 | calling, neutral British | Have you seen my car keys? |
| `house.moment.qrvops` | mom | Time-of-day house shout; app/public/js/hs-life.js:73 | calling, neutral British | We're going to Gran's for Sunday dinner at one! Wear something clean! |
| `house.moment.uar218` | mom | Time-of-day house shout; app/public/js/hs-life.js:67 | calling, neutral British | TEA'S READY! It'll go cold! |
| `house.moment.y9voiz` | mom | Time-of-day house shout; app/public/js/hs-life.js:66 | calling, neutral British | Your friend's Mom rang. Are you going round there? |
| `house.moment.zpcfic` | mom | Time-of-day house shout; app/public/js/hs-life.js:68 | calling, neutral British | Do you want a cup of tea? |
| `house.voice.19srweb` | mom | House welcome, shout or event; app/public/js/hs-life.js:388 | calling, neutral British | Is that you? Tea's nearly ready! |
| `house.voice.1pe2qdm` | mom | House welcome, shout or event; app/public/js/hs-life.js:388 | calling, neutral British | Is that you coming down? Put the kettle on, love! |
| `house.voice.1wn5usl` | mom | House welcome, shout or event; app/public/js/hs-life.js:115 | calling, neutral British | Wrong number. AGAIN. Someone wanting a Chinese. |
| `house.voice.52jrk6` | mom | House welcome, shout or event; app/public/js/hs-life.js:115 | calling, neutral British | That was your friend! Are you coming out? |
| `house.voice.c27ds0` | mom | House welcome, shout or event; app/public/js/hs-life.js:239 | calling, neutral British | Here's your pocket money. Five pounds. Don't spend it all on games magazines. |
| `house.voice.dg5evy` | mom | House welcome, shout or event; app/public/js/hs-life.js:115 | calling, neutral British | That was your Gran. She says you never ring her. |
| `house.voice.y87tqf` | mom | House welcome, shout or event; app/public/js/hs-life.js:115 | calling, neutral British | Was that the phone? Did you not hear it?! |
| `hw.mom.clocks.1ekmlu0` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:1174 | warm, neutral British | And the clocks went back last night. An extra hour in bed, and I'm STILL tired. |
| `hw.mom.door.7duwbw` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | warm, neutral British | Door! I've got my hands full. |
| `hw.mom.door.iezetz` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | warm, neutral British | Door! More of them! |
| `hw.mom.door.le11aj` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | warm, neutral British | That'll be the Witch Brigade again. Door! |
| `hw.mom.door.p08w90` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:990 | warm, neutral British | Can you get that? |
| `hw.mom.door2.1c95o5l` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:991 | warm, neutral British | They're still waiting at the door! |
| `hw.mom.five.1eab0yr` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:1098 | warm, neutral British | Five lots! The neighbours will think we're ever so organised. |
| `hw.mom.hand.1x0lkzj` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:745 | warm, neutral British | Away from your hand! Saw AWAY from your hand. |
| `hw.mom.lead.1roevnu` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:1173 | warm, neutral British | I've got a pumpkin for you two to carve. It's on the kitchen table. Newspaper down first, please! |
| `hw.mom.porch.d7yfts` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:1088 | warm, neutral British | Porch light on, love. No light, no trick-or-treaters. That's the rule. |
| `hw.mom.tail.ourgck` | mom | Halloween, physical preparation / door; app/public/js/season-halloween.js:1176 | warm, neutral British | Look at the state of this hall. Wrappers everywhere! Bin, please. And who ate all the Choc Bits? |
| `st.opening.bed.hra5bz` | mom | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:139 | warm, neutral British | Much better. Now straighten that bed, please. |
| `st.opening.bin.lnlsdo` | mom | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:140 | warm, neutral British | One last job: bring the bin bag down to the kitchen. |
| `st.opening.meetmom.p0ty2g` | mom | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:137 | warm, neutral British | Morning, love. Room first, then you can do what you like. Clothes in the basket, rubbish in the bin, plates down to the kitchen. |
| `st.opening.tidy.1d8mogt` | mom | Story fallback when family cannot deliver in person; app/public/js/st-engine.js:138 | warm, neutral British | First things first: clothes in the basket, rubbish in the bin. And bring your dishes down! |
| `bf.already.guy.1f4ztpk` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:319 | cheeky, neutral British | Our Guy is sitting in the garden, guarding the parkin. |
| `bf.carry.guy.13p6v71` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:320 | cheeky, neutral British | E carries him out to his garden chair. Careful with his head! |
| `bf.display.done.1lj1fzs` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:477 | cheeky, neutral British | The golden one was my favourite! |
| `bf.guy.135iti6` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:313 | cheeky, neutral British | Dad said we could have his OLD clothes. Not his work trousers. I have checked twice. |
| `bf.guy.ready.16vdl6h` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:188 | cheeky, neutral British | He looks just like Dad on a Sunday. Can we keep him? Penny for the Guy! He only takes pretend pennies. |
| `bf.sister.talk.1gj0870` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:743 | cheeky, neutral British | Will you help me stuff the Guy? Dad's old shirt is on the kitchen table. He says it was fashionable once. |
| `bf.sister.talk.1kq0e9g` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:743 | cheeky, neutral British | Remember, remember, the fifth of November! I remembered. Dad forgot where he put his hat. |
| `bf.wheel.qsib2` | sister | Bonfire Night, physical preparation / display; app/public/js/season-bonfire.js:502 | cheeky, neutral British | A Catherine wheel! It is doing cartwheels! |
| `house.moment.1ci1e5k` | sister | Time-of-day house shout; app/public/js/hs-life.js:68 | cheeky, neutral British | Can I have a go on the Game Lad? Pleeeeease? |
| `house.moment.vtvqfy` | sister | Time-of-day house shout; app/public/js/hs-life.js:66 | cheeky, neutral British | MOM! They're being annoying! |
| `hw.sis.bat.1p6s4es` | sister | Halloween, physical preparation / door; app/public/js/season-halloween.js:434 | cheeky, neutral British | Higher! No, lower! Perfect. It's watching you. |
| `hw.sis.ghost.b0szgt` | sister | Halloween, physical preparation / door; app/public/js/season-halloween.js:434 | cheeky, neutral British | Now the whole street can see him. His name is Gerald. |
| `hw.sis.scoop.j7h9ib` | sister | Halloween, physical preparation / door; app/public/js/season-halloween.js:746 | cheeky, neutral British | Ewww! It looks like brains. Can I keep the seeds? |
| `c4.xmas.eve.dad.neutral` | dad | Christmas Eve, Dad whispers while eating Father Christmas’s mince pie; replaces the gendered player reference in the legacy recording. | warm, neutral British | Is everyone asleep yet? Good. Shh. I am eating the mince pie. |
| `chore.shout.1of6vkv` | mom | Chore completion / reminder; numerical rating stays written; app/public/js/ch-core.js:153 | warm, neutral British | Have you done ALL your jobs? Who are you and what have you done with my real helper? |
| `house.voice.1o2t39k` | mom | House welcome, shout or event; app/public/js/hs-life.js:376 | calling, neutral British | School! Shoes on, bag ready, out you go! |
| `house.voice.1p91ht0` | mom | House welcome, shout or event; app/public/js/hs-life.js:376 | calling, neutral British | Tea is ready! Come and get it before it goes cold! |
| `house.voice.6sjah6` | mom | House welcome, shout or event; app/public/js/hs-life.js:376 | calling, neutral British | Saturday pocket money! Check with me when your jobs are done. |
| `house.voice.v8d3ia` | mom | House welcome, shout or event; app/public/js/hs-life.js:376 | calling, neutral British | Time for bed. Save your game. |
| `house.voice.zrj5mn` | mom | House welcome, shout or event; app/public/js/hs-life.js:217 | calling, neutral British | Ooh, have you done ALL your jobs? Who are you and what have you done with my real helper? |
| `fight.announcer.17hxufs` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | FIGHT! |
| `fight.announcer.1b3s3ij` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | FINAL ROUND |
| `fight.announcer.1bpvjq6` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | RING OUT! |
| `fight.announcer.1gqag2d` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | K.O. |
| `fight.announcer.1i0ze0n` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | TRAINING |
| `fight.announcer.1s3wltc` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 1 |
| `fight.announcer.1snvt7a` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 3 |
| `fight.announcer.1sxvew9` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 2 |
| `fight.announcer.1t7v0l8` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 5 |
| `fight.announcer.1thuma7` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 4 |
| `fight.announcer.1tru7z6` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 7 |
| `fight.announcer.1u1tto5` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 6 |
| `fight.announcer.1ubtfd4` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 9 |
| `fight.announcer.1ult123` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | ROUND 8 |
| `fight.announcer.1vahgr4` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | DOUBLE K.O. |
| `fight.announcer.mnmu8j` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | DRAW |
| `fight.announcer.mwpmc1` | announcer | Shared console fighting-game announcer; round/result cue; app/public/js/rm-g-fightkit.js:943 | booming, neutral British | TIME UP |
| `game.wobble.host.146dks4` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:867, app/public/js/rm-g-party.js:1183, app/public/js/rm-g-party.js:1239 | booming, neutral British | LET'S SEE WHAT THE REELS HAVE DECIDED! |
| `game.wobble.host.1n2x0pa` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:861, app/public/js/rm-g-party.js:1222 | booming, neutral British | A COIN GEYSER! WHOOSH! |
| `game.wobble.host.1wafoa1` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:856, app/public/js/rm-g-party.js:1101 | booming, neutral British | THE STAR HAS BEEN FOUND! |
| `game.wobble.host.1wf6wxm` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:859, app/public/js/rm-g-party.js:1175 | booming, neutral British | TWIN DICE! TWO BLOCKS! |
| `game.wobble.host.1yus1o0` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:866, app/public/js/rm-g-party.js:2677 | booming, neutral British | THE WINNERS GET TEN COINS! |
| `game.wobble.host.8oxsmd` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:864, app/public/js/rm-g-party.js:2605 | booming, neutral British | LET'S SEE WHO GOES FIRST! EVERYBODY STARTS WITH TEN COINS. |
| `game.wobble.host.ogoqhi` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:862, app/public/js/rm-g-party.js:1230 | booming, neutral British | WOBBLE WARP! WHEEE! OFF WE GO! |
| `game.wobble.host.q55w08` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:860, app/public/js/rm-g-party.js:1215 | booming, neutral British | DING DONG! THE CLOCKWORK JACKPOT PAYS OUT! |
| `game.wobble.host.vvc01w` | announcer | Wobble Party generic announcer variant; original writing remains until recorded; app/public/js/rm-g-party.js:865, app/public/js/rm-g-party.js:2615 | booming, neutral British | LAST PLACE? HAVE TEN COINS TO CATCH UP! |

## Every family wording change

These remove chosen names or gendered player references, retain the joke, or remove a real historical person from the recording. Cat names also become generic so one clip works for every cast.

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

The legacy Christmas Eve line “Is he asleep yet? Good. Shh. I’m eating the mince pie.” becomes “Is everyone asleep yet? Good. Shh. I am eating the mince pie.”

## Announcer variants

These changes appear only after their recording exists; the live name, score or control is generic in the recording.

| ID | Existing writing | Recording and future writing |
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

## Personalised family writing (round 2)

The recorded bodies below are unchanged. `callout` adds an approved name clip before that body when available; without a name clip the plain body plays. `display` keeps the player's name on screen, including names without a clip. Mid-sentence names are display only; a call-out, where marked, still precedes the body. These templates are also listed by the re-runnable voice audit.

| ID | Call-out | Display |
|---|---|---|
| `chore.rate.95a` | display only | Ooh! Who are you and what have you done with {me}? |
| `house.moment.1djssky` | dad-shout | {me.NAME}! Bed! Now! |
| `house.moment.wd8c5e` | dad-shout | {me.NAME}! Have you been using the phone? The bill came. |
| `house.voice.h701ve` | dad-shout | {me.NAME}! TURN THAT DOWN! IT'S THE MIDDLE OF THE NIGHT! |
| `phone.out.01632960213.1c5kgqp` | display only | Hello? {me}! Ooh, you never ring! Eating properly? Grandad says hello. HE SAYS HELLO. Bye, love! Bye! Bye bye! |
| `chore.shout.1lof225` | mom-shout | {me.NAME}! Those jobs won't do themselves! |
| `chore.shout.1ss7a6t` | mom-shout | {me.NAME}! I can hear you NOT doing your jobs! |
| `chore.shout.1y83zff` | mom-call | Thank you, {me}! |
| `chore.shout.9bcrpq` | mom-shout | {me.NAME}! Love? The list on the fridge? Remember the list? |
| `chore.shout.a506t6` | mom-shout | {me.NAME}! Get off that computer and do your jobs! |
| `chore.shout.y5q1ps` | mom-shout | {me.NAME}! Have you done your jobs yet? |
| `dialer.01632960777.1wxgtgo` | mom-call | {me}, love? Have you done your homework? |
| `house.moment.14u1i62` | mom-shout | {me.NAME}! Get off the Internet! I need to ring your Nan! |
| `house.moment.18qfxaa` | mom-shout | {me.NAME}! I'm popping to the shops. Do you want anything? ...Besides a Daydream. |
| `house.moment.1dd6ufc` | mom-shout | {me.NAME}! It's a school night. Not too late, eh? |
| `house.moment.1gm6uua` | mom-shout | {me.NAME}! Are you on that computer AGAIN? |
| `house.moment.1hou2xu` | mom-shout | {me.NAME}! You'll be late for school! Have you had any breakfast? |
| `house.moment.1ibhhmo` | mom-shout | {me.NAME}! Are you up? It's gone eight! Lazybones! |
| `house.moment.1kgk76z` | mom-shout | {me.NAME}! Turn that light off, love, it's late. |
| `house.moment.1qhk3rh` | mom-shout | {me.NAME}! Set the table please, love! |
| `house.moment.1trq0u8` | mom-shout | {me.NAME}! Come and get your washing, it's on the stairs! |
| `house.moment.1wxgtgo` | mom-call | {me}, love? Have you done your homework? |
| `house.moment.hypeuv` | mom-shout | {me.NAME}! Why aren't you at school? ...Oh, it's an INSET day. Right. Well don't sit on that computer all day. |
| `house.moment.p8fwe0` | mom-call | {me}, love? Have you seen my car keys? |
| `house.moment.qrvops` | mom-shout | {me.NAME}! We're going to Gran's for Sunday dinner at one! Wear something clean! |
| `house.moment.uar218` | mom-shout | {me.NAME}! TEA'S READY! It'll go cold! |
| `house.moment.y9voiz` | mom-shout | {me.NAME}! Your friend's Mom rang. Are you going round there? |
| `house.moment.zpcfic` | mom-call | {me}, love? Do you want a cup of tea? |
| `house.voice.19srweb` | mom-shout | {me.NAME}! Is that you? Tea's nearly ready! |
| `house.voice.1pe2qdm` | mom-shout | {me.NAME}! Is that you coming down? Put the kettle on, love! |
| `house.voice.52jrk6` | mom-shout | {me.NAME}! That was your friend! Are you coming out? |
| `house.voice.c27ds0` | mom-call | {me}, love? Here's your pocket money. Five pounds. Don't spend it all on games magazines. |
| `house.voice.dg5evy` | mom-shout | {me.NAME}! That was your Gran. She says you never ring her. |
| `hw.mom.door.7duwbw` | mom-shout | {me.NAME}! Door! I've got my hands full. |
| `hw.mom.door.iezetz` | mom-shout | Door, {me}! More of them! |
| `hw.mom.door.p08w90` | mom-shout | {me.NAME}! Can you get that? |
| `hw.mom.door2.1c95o5l` | mom-shout | {me.NAME}! They're still waiting at the door! |
| `hw.mom.hand.1x0lkzj` | mom-shout | Away from your hand, {me}! Saw AWAY from your hand. |
| `hw.mom.tail.ourgck` | mom-shout | Look at the state of this hall. Wrappers everywhere! Bin, please, {me}. And who ate all the Choc Bits? |
| `house.moment.1ci1e5k` | sis-whine | {me}! Can I have a go on the Game Lad? Pleeeeease? |
| `house.moment.vtvqfy` | display only | MOM! {me}'s being annoying! |
| `chore.shout.1of6vkv` | display only | Have you done ALL your jobs? Who are you and what have you done with {me}? |
| `house.voice.v8d3ia` | mom-call | Time for bed, {me}. Save your game. |
| `house.voice.zrj5mn` | display only | Ooh, have you done ALL your jobs? Who are you and what have you done with {me}? |

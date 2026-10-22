/* office-docs: the contents of Jack's documents, spreadsheets and cardfiles (loaded the first time one is opened).
 * Documents use the little markup in apps-office.js (K.md). Spreadsheets: { cells, fmt, colW }. Cardfiles: { cards: [[index, text]] }.
 * Anything dated later in 1999 than "today" only appears once its day has come (the site's endless 1999). */
(function () {
  'use strict';
  const K = window.OfficeKit;
  const md = () => K.today().md;
  const upto = (rows) => rows.filter(r => !r[0] || r[0] <= md()).map(r => r.slice(1));
  const D = window.OfficeDocs = {};
  const N = id => Cast.n(id); // the visitor's cast (js/cast.js)

  // ================================================================ WordPad documents
  D.plans = { font: 'Courier New', size: 11, md: `# TOP SECRET PLANS
> {c=red;b|DO NOT READ}  {c=red;b|DO NOT READ}  {c=red;b|DO NOT READ}
> (this means you, Dave)

## OPERATION MIDNIGHT
**Objective:** Be awake at 00:00:00 on 01/01/2000 to see if the computers all explode.
**Problem:** Mom.
**Plan:**
* Have a nap after school on the 31st. (Say I'm "reading".)
* Dave's party starts at 7. Mom says we're leaving "by half past twelve at the LATEST". That is AFTER midnight. She has not realised this. DO NOT REMIND HER.
* Bring the torch in case the lights go off. Bring the Game Lad in case the torch goes off.
* At 23:59:50 everybody counts down. At 00:00:00 I look at Dave's video recorder. If it says 1900 I win £1 off Dave.

## OPERATION DAYDREAM
**Objective:** Own a Daydream. (Out 14/10/99. £199.99. That's a LOT of pocket money.)
**Plan:**
* Save all my pocket money. (Current savings: see Pocket Money 1999.wks. It's not enough.)
* Wash the car EVERY week, not just when Dad remembers.
* Christmas list: put it at the top, in red, in 72 point.
* If that fails: get Nan to "have a word" with Mom.

## OPERATION GUBBINZ
**Objective:** Find out who keeps feeding Gubbinz pizza after midnight.
**Suspects:** Dave. Everyone on the Internet. Gubbinz himself (he can't reach the keyboard... CAN he?)
**Plan:** Watch the website. Write it down. Tell nobody. Especially Gubbinz.

## OPERATION BITS BOX
**Objective:** Paint EVERYTHING in the bits box before the year 2000.
**Progress:** Not great. The bits box is mostly arms.

{hide|P.S. If you can read this, you highlighted the whole page. Respect, secret agent.}
{hide|The password to my REAL secret folder is a riddle: what do Gorks spend instead of money?}
{hide|(It's not "pounds". It's not "pizza". Think about what's in their mouths.)}

>> Jack (Agent 00-Jack)
>> 02/10/99` };

  D.nan = { font: 'Comic Sans MS', size: 12, md: `>> 4th January 1999

Dear Nan,

Thank you very much for the Christmas jumper. It is very warm and it is very **brown**. Mom says it will "last for years", which I think is the plan.

I wore it on Boxing Day and Dave said I looked like a chocolate digestive. I told him it's a //designer// jumper. He didn't believe me but he also didn't have a jumper, so who's laughing now.

Thank you also for the £10. I am going to spend it **wisely** (in the January sales, on a Rubrick's cube). Mom says "wisely" means "not on sweets".

I hope your hip is better. Next time we come round I will show you how to use the remote for the new video recorder. It's easy. You press the button with the red circle. Not the other one. The other one tapes over the wedding.

Lots of love,

{f=Comic Sans MS;s=16;c=navy|Jack}
{s=9;c=gray|xxx}

P.S. I've invented a little green character called Gubbinz. One day he's going to live on my website. I'll explain at Easter.` };

  D.xmas = () => ({ font: 'Arial', size: 12, md: `> {s=28;c=red;f=Impact|JACK'S CHRISTMAS LIST 1999}
> {c=green|(the last Christmas of the millennium!!!)}

{s=72;c=red;f=Impact|DAYDREAM}

* A Daydream. (Out 14/10/99, £199.99. It has a modem IN IT. You can go on the Internet ON THE TELLY.)
* If not a Daydream: a Daydream.
* Donkey Wrong 64 (it comes with the Expansion Pak!)
* A new Rubrick's cube (the stickers on mine are peeling off the yellow side)
* Red paint for my models. Lots of red. (Red ones go faster.)
* A graphics card with 16MB on it (I'll write down which one. Don't let the shop man choose.)
* Batteries (for the Game Lad, the torch, and the Y2K emergency radio)
* A Intergalactic Battles lightspatula. A proper one. With the noise.
* ${md() >= 1019 ? 'Anything Episode I that I haven\'t already got. (See Intergalactic Battles Toys.wks.)' : 'Episode I toys (see Intergalactic Battles Toys.wks so you don\'t get me two Jar Jars)'}
* **NOT** another jumper. (Sorry Nan. Unless it's red.)

## For other people (so it's fair)
* Mom: bubble bath and "peace and quiet" (I can do the second one for one evening)
* Dad: a book about Championship Manager. (Does that exist? He'd read it.)
* Nan: a new remote for the video that only has ONE button
* Dave: a book of riddles. He needs the practice.
* Gubbinz: a pizza. A small one.

>> Love Jack xxx
>> P.S. I have been good. Mostly. Check the website logs.` });

  D.issue8 = { font: 'Arial', size: 10, md: `> {f=Impact;s=36;c=purple|JACK ATTACK!}
> {f=Arial Black;s=11|ISSUE 8 - DRAFT - DO NOT PUBLISH YET}
---
## CONTENTS (so far)
\tReviews\t\tpage 1
\tCheats corner\t\tpage 2
\tModel of the Month\t\tpage 3
\tLetters\t\tpage 4
\tGubbinz's Agony Column\t\tpage 5

## FIRST LOOK: THE DREAMCAST
It comes out on **14 October** and it's got a modem built in, which means you can go on the Internet through your TELLY. Dad says "what's wrong with the computer". The computer is upstairs, Dad. The telly is downstairs. That's what's wrong with it.

It costs £199.99, which is about 17 months of pocket money. I've done the maths (see Pocket Money 1999.wks). I'm not going to say how far off I am.

//TODO: ask Dave's cousin if he's getting one. Borrow it. For research.//

## MODEL OF THE MONTH
This month's model is an Ork Nob with a big choppa. He's red, because red ones go faster. I painted his teef with a cocktail stick. One of them is crooked on purpose. (It was not on purpose.)

## GUBBINZ'S AGONY COLUMN
**Dear Gubbinz, my brother keeps reading my diary. What should I do?** - Worried, age (secret)
//GUBBINZ SAYS:// hide it in the Recycle Bin. nobody looks in there. well, i do.

**Dear Gubbinz, what's your favourite food?** - Hungry
//GUBBINZ SAYS:// pizza. then more pizza. next question.

## NOTES TO SELF
* Make the reviews scores out of 10, not out of "Wicked"
* Spell check!!! (Mrs Hargreaves found 4 mistakes in issue 7. She READS IT.)
* Remember to put the date on. It's still 1999. It's always 1999.` };

  D.volcano = { font: 'Times New Roman', size: 12, md: `# VOLCANOES
> Geography homework - by Jack

## What is a volcano?
A volcano is a gap in the Earth's crust where hot melted rock comes out. When the melted rock is still underground it is called **magma**. When it comes out of the top it is called **lava**. (It's the same stuff. It just gets a new name when it goes outside, like how Dave is "David" at school.)

## The parts of a volcano
* **Magma chamber** - the big pool of magma underneath
* **Main vent** - the pipe the magma goes up
* **Crater** - the hole at the top
* **Ash cloud** - the dust that comes out and blocks out the Sun

## Famous eruptions
**Vesuvius (AD 79)** - this volcano in Italy erupted and buried the Roman town of Pompeii under ash. The ash kept everything exactly how it was, so now you can walk round it. (We did the Romans in History. They had central heating. We don't have central heating in my bedroom. Who's advanced now.)

**Krakatoa (1883)** - an island volcano in Indonesia. The explosion was so loud that people heard it thousands of kilometres away.

**Mount St Helens (18 May 1980)** - in America. The whole side of the mountain fell off and the top went with it.

**Montserrat (since 1995)** - the Soufriere Hills volcano on the island of Montserrat in the Caribbean started erupting in 1995 and the capital town, Plymouth, had to be abandoned. Lots of people had to leave the island.

## Are there volcanoes in Britain?
Not working ones. There used to be, millions of years ago. Edinburgh Castle is sat on an old one. (I asked Mom if we can go and see it. She said "it's a long way for a rock".)

## My model volcano
I made one out of papier mache and a squeezy bottle. You put in bicarbonate of soda and vinegar and red food colouring and it ERUPTS. It erupted on the kitchen table. Then on the floor. Mom has asked me to "describe the clean-up" in my homework. **The clean-up was long.**

---
{c=red;f=Comic Sans MS|Mr Fenwick: "Excellent research, Jack. 9/10. Please don't bring the volcano in."}` };

  D.persuade = { font: 'Times New Roman', size: 12, md: `>> Jack
>> 27th April 1999

Dear Head Teacher,

## Why our school needs MORE COMPUTERS

I am writing to persuade you that our school needs more computers, and I have **five** very good reasons.

**Reason 1: There are not enough.** We have eight computers in the computer room and there are thirty of us in the class. That means we take turns, and by the time it's my turn the bell goes. I have done the maths. I get **one minute and forty seconds** of computer a lesson. That is not even long enough to load the Internet.

**Reason 2: It is nearly the year 2000.** In the year 2000 everybody will need to use computers for their jobs. Even people who aren't programmers. Even //dentists//. If we don't practise now, the future will happen and we won't know how to double-click.

**Reason 3: The computers we have are slow.** Some of them still have 8MB of RAM. When you open a picture of a dinosaur it draws it one line at a time from the top. By the time you see the feet, it's home time.

**Reason 4: Computer Club is full.** ${N('teacher')} says there is a waiting list. A waiting list for a club! People are //waiting to learn//. Isn't that what school is for?

**Reason 5: It would be fair.** Not everybody has a computer at home. My mate Dave doesn't. (He comes round to mine and uses it, which uses up //my// computer time.) If the school had more computers, everybody could have a go.

In conclusion, I think the school should buy more computers. If you can't afford it, I have also had an idea: a sponsored Blockology marathon. I would do it. I would do it for //hours//.

Yours sincerely,

Jack

---
{c=red;f=Comic Sans MS|Mrs Hargreaves: "Very persuasive, Jack! Good use of rhetorical questions. I'm not sure about the sponsored Blockology. B+"}` };

  D.website = { font: 'Arial', size: 11, md: `# HOW I MADE MY WEB SITE
> Computer Club project - for ${N('teacher')}

## What is a web site?
A web site is a bunch of pages that live on a computer called a **server**, and anyone in the world can look at them with a **browser**, like JackNet Explorer. My web site is called **JACK ATTACK! Online** and it's a games magazine. It's got reviews, cheats, a hobby corner, a guestbook and a virtual pet called Gubbinz.

## What I used
* **Notepad** (you don't need anything fancy, you just type the code)
* **Paint** (for the pictures - I saved them as GIFs so they're small)
* The modem (to send the files to the server - it took AGES)

## The code
Web pages are written in **HTML**. You put words in pointy brackets called **tags**. Here are my favourites:
* <B> makes things **bold**
* <I> makes things //italic//
* <CENTER> puts things in the middle
* <IMG> puts a picture in
* <A HREF> makes a link you can click on
* <MARQUEE> makes words scroll across the screen (everybody loves it)
* <BLINK> makes words flash on and off (${N('teacher')} said "please, no". I used it once. Just once.)

## Things I learned
* Every tag you open, you have to close. If you forget to close the <B> tag, THE WHOLE PAGE GOES BOLD.
* Big pictures take forever to load on a 56K modem. Keep them small.
* Put "best viewed at 800x600" at the bottom. Everyone does.
* Always put a visitor counter on. It makes you feel popular.
* Spell check everything. (Mrs Hargreaves reads my site. She sent me a list.)

## What I want to add next
* A chat room (DONE!)
* A virtual pet (DONE! That's Gubbinz)
* A secret page that only clever people can find (DONE. I'm not telling you where.)

---
{c=red;f=Comic Sans MS|${N('teacher')}: "Fantastic work, Jack. Can you help me with the school web site? It still says 'under construction'. It has said that since 1997."}` };

  D.hobbit = { font: 'Times New Roman', size: 12, md: `# BOOK REPORT: THE HOBBIT
> by J.R.R. Tolkien - report by Jack

**What it's about:**
Bilbo Baggins is a hobbit. Hobbits are small, they like food and they don't like adventures. Then a wizard called Gandalf turns up with **thirteen dwarves** (thirteen! In one little house!) and they eat all Bilbo's food and take him on an adventure to get their treasure back from a dragon called **Smaug**, who lives in the Lonely Mountain.

**Best bits:**
* The riddle game with Gollum in the dark under the mountain. Bilbo finds a magic ring that makes you invisible. It seems like it will be important later. (Dad says there's a much longer book about it. He said "much" in a scary way.)
* The giant spiders in Mirkwood. Bilbo names his sword "Sting" after he fights them. That is the coolest naming of a sword ever.
* Bilbo talking to Smaug and being really clever and polite while being terrified.

**Worst bit:**
The goblins sing a lot. If I was a goblin I would not sing. I would be doing goblin stuff.

**Characters I liked:**
* Bilbo - he starts off scared of everything and ends up the bravest one. Good character development (Mrs Hargreaves says to always write that).
* Thorin - the leader of the dwarves. Grumpy. A bit like Dad on a Monday.
* Bard - because he's an archer and he gets the most important shot in the whole book. No spoilers. (It's the dragon. He shoots the dragon.)

**Would the goblins win against Dark Mole?**
Mrs Hargreaves said this "isn't part of the report" but I've done it anyway: **no**. Dark Mole has a lightspatula with TWO blades and he can do flips. The goblins would be fine in a riddle contest though.

**Score:** {b;c=green|9/10.} (Minus one for the singing.)

---
{c=red;f=Comic Sans MS|Mrs Hargreaves: "A lively, thoughtful report. Please stop comparing every book to Intergalactic Battles." A-}` };

  D.review = { font: 'Arial', size: 11, md: `> {f=Impact;s=26|INTERGALACTIC BATTLES EPISODE I}
> {f=Impact;s=20;c=red|THE PHANTOM NUISANCE}
> {f=Arial Black;s=10|JACK'S REVIEW - WRITTEN THE SAME NIGHT, AT 11:48pm, DON'T TELL MOM}

## I HAVE SEEN IT
I HAVE SEEN IT. I HAVE ACTUALLY SEEN IT. Friday the 16th of July 1999, the 6:30 showing, with Dave and Dad, row G, seats 12, 13 and 14. Dad bought the large popcorn. Dad ate most of the large popcorn.

We waited SO long for this. America got it on the 19th of May. We had to wait **eight weeks** while everyone on the Internet talked about it. I had to switch off the computer for some of it. Do you know how hard that is? For me?

## The story (no spoilers)
It's set **before** the old films. Two Space Cadet, Qui-Gon Gym and his apprentice Obi-Wan Cannoli (young Obi-Wan! He's Scottish now!), have to protect Queen Amidala of the planet Naboo from the Trade Federation, who have blockaded her planet with loads of battle droids. They end up stuck on **Tattyween** and meet a little boy called **Anklekin Skywobbler**. If you know the old films you know who he grows up to be. I'm not saying. But you know. You KNOW.

## THE POD RACE
The pod race is the best thing I have ever seen in a cinema. Anakin flies a pod that's basically two massive engines on strings with a little seat at the back, against a cheating pod racer called Sebulba. It's so fast and so loud that Dad grabbed the armrest. DAD. I'm going to get the ULTRA 64 game and practise.

## DARK MOLE
Red and black face, horns, yellow eyes and a lightspatula with **two blades**. TWO. One on each end. He barely says anything, he just does flips. He's the best baddie since the one in the black helmet. The music in the big lightspatula fight at the end has a choir singing in it, and every hair on my arms stood up.

## JAR JAR JAMS
Jar Jar Jams is a Gungan. He's clumsy and he talks funny. Dave thinks he is the funniest thing ever made. I think he is... a lot. Half the cinema laughed. The other half went very quiet. We have agreed not to talk about it.

## THE BITS I DIDN'T GET
* Some of it is about taxes and trade routes and a lot of people sitting in a big round room arguing. Dad said "that's what politics is like". If that's what politics is like I'm going to be a pod racer.
* There's something with a blood test and "midi-chlorians". Dave says it's science. I'm not sure it's science.
* Something happens in the end fight that I WILL NOT WRITE DOWN. Go and see it.

## SCORES
\tPod race:\t{b|10/10}
\tDarth Maul:\t{b|10/10}
\tLightsaber fight:\t{b|11/10} (allowed, it's my magazine)
\tSpace battle:\t{b|8/10}
\tJar Jar:\t{b|?/10} (Dave says 10. I say we agreed not to talk about it)
\tPoliticians in a round room:\t{b|3/10}

> {f=Impact;s=36;c=green|9/10}
> {b|GO AND SEE IT. THEN GO AND SEE IT AGAIN.}

>> - Jack
>> P.S. I want a lightspatula with two blades for Christmas. I've written it on the list.` };

  D.fanfic = { font: 'Book Antiqua', size: 12, md: `> {f=Impact;s=24|GUBBINZ WARS}
> {f=Impact;s=16;c=red|EPISODE I: THE PHANTOM PIZZA}
> //a story by Jack (NOT for English homework, this is just for fun)//

---
Long ago, in a pizza shop far, far away...

It was a time of great hunger. The evil ROBOT FEDERATION had blockaded the planet of Crumbo, and nobody had had a pizza for **three whole days**.

Young Gubbinz was polishing his ears in the junk shop of a grumpy old robot called Scrapbolt, when two strangers walked in. They wore brown dressing gowns and carried glowing sticks.

"We are Pizza Knights," said the tall one. "We are looking for a part for our ship. It is a **hyperdrive** flux... thing."

"Haven't got one," said Scrapbolt. "Got a bucket though."

Gubbinz had a feeling. A tingly feeling, in his ears. "I can fly anything," he said. "Even a bucket."

That was how Gubbinz entered **THE BIG BUCKET RACE**.

---
The race was nine laps of the Dune Sea. The favourite was Grumbleguts the Cheater, who had a pod with eight engines and no brakes. Gubbinz had a bucket with two engines strapped on with string. And a Blobbit. For luck.

On lap three, Grumbleguts threw a spanner at him. On lap five, the Blobbit ate the string. On lap eight, Gubbinz held the two engines together **with his own ears**.

On the last lap, the Blobbit, who had eaten so much string it was basically an engine itself, let out an enormous **BURP** and blasted them over the finish line.

Gubbinz won. The crowd went wild. Scrapbolt said "that's my bucket" and nobody listened to him.

---
"You have great power, little Gubbinz," said the tall Pizza Knight. "Come with us. You will be trained."

"Can the Blobbit come?" said Gubbinz.

The Pizza Knight looked at the Blobbit. The Blobbit looked at the Pizza Knight. The Blobbit burped.

"...Fine," said the Pizza Knight.

> {b|THE END}
> //(to be continued in EPISODE II: ATTACK OF THE BLOBBITS, if Mom doesn't take the computer off me)//` };

  D.swquiz = { font: 'Arial', size: 12, md: `# THE ULTIMATE INTERGALACTIC BATTLES QUIZ
> by Jack, for Dave (who says he knows "everything")
> //written 20/05/99: Episode I came out in America YESTERDAY. UK: 16 July. 57 DAYS.//

**Rules:** one point per answer. No looking in the Intergalactic Battles books. No ringing your cousin.

* 1. What is the name of Ham Solo's ship?
* 2. Which planet is Luke Skywobbler from?
* 3. What sort of creature is Chew Biscuit?
* 4. Where does Yoga live?
* 5. What was Ham Solo frozen in?
* 6. Which bounty hunter took frozen Han to Jabba the Hutt?
* 7. What are the small furry ones on the forest moon of Endor called?
* 8. What colour is Luke's new lightspatula in Return of the Space Cadets?
* 9. Which city in the clouds does Lando Calrissian run?
* 10. What is the name of the Emperor's giant battle station? (There are two of them.)
* 11. Who is Luke's father? (If you get this wrong we can't be friends.)
* 12. BONUS: what's the name of the new baddie with the two-bladed lightspatula in Episode I?

---
{c=white|ANSWERS (highlight to see): 1. Millennium Pigeon 2. Tattyween 3. A Wookiee 4. Dagobah 5. Carbonite 6. Boba Fett 7. Ewoks 8. Green 9. Cloud City (on Bespin) 10. The Dread Scone 11. Dark Vapour 12. Dark Mole}

**Dave's score:** {b;c=red|9/12.} He said Luke's new lightspatula was "lightspatula coloured". He also said question 12 was "not fair because it's not out yet". It's in the MAGAZINES, Dave.` };

  // ================================================================ Write (JackOS 3.1) documents from Dad's old computer
  D.readme = { font: 'Times New Roman', size: 12, md: `# README - DAD'S COMPUTER
> PLEASE READ THIS BEFORE TOUCHING ANYTHING
> 14 March 1994

## Turning it on
1. Switch on at the wall.
2. Press the big button on the front. Wait. It will beep once. One beep is GOOD. More than one beep is BAD. Get Dad.
3. It will say C:\\> on the screen. Type **WIN** and press Enter.
4. JackOS will start. This takes about a minute. Make a cup of tea.

## What's on it
* **Program Manager** - the window with all the little pictures in groups. Double-click a picture to start a program. Do not drag the pictures around. It took me an afternoon to get them like this.
* **File Manager** - for finding files. Please do not "tidy up" the files. Last time somebody tidied up the files, the computer did not start for a week.
* **Write** - for letters. This is Write. You're using it now.
* **Cardfile** - Mom's recipes are in RECIPES.CRD. Please do not delete the fruit cake. Nan will know.
* **Reversi** - a game. ONE game. Then back to work.

## Rules
* Do not eat near the keyboard. (The "J" key is still sticky from Christmas.)
* Do not use the computer while anybody is on the phone. It doesn't affect anything yet. But one day we'll get a modem and THEN it will.
* Floppy disks go in label side up, metal end first. Don't force them. They're £1 each.
* Do not press Ctrl+Alt+Delete "to see what happens". We know what happens.

## If it goes wrong
* Turn it off and on again.
* If that doesn't work, turn it off and leave it for a bit. It might be tired.
* If that doesn't work, ring ${N('uncle')}. Do not ring ${N('uncle')} after 9pm.

>> - Dad
>> //P.S. this computer has a 386 processor, 4 MEGABYTES of memory and a 120 megabyte hard disk. We will NEVER fill that up.//` };

  D.cv = { font: 'Times New Roman', size: 12, md: `> {s=16;b|CURRICULUM VITAE}
> November 1993

**Personal details:** (removed by Jack for privacy reasons and because it's embarrassing)

## Skills
* Word processing (very fast: 40 words per minute, with two fingers)
* Spreadsheets (can make a column add itself up)
* Can program a video recorder, including the timer
* Can fix the photocopier when it says "paper jam" (most of the time)
* Can do the Rubrick's cube (one side) (nearly)

## Hobbies and interests
* Computers
* Football (watching, mainly, from the sofa)
* Telling people about the time I got a high score at the arcade in 1982
* Gardening (Mom says I have to put this)

## References
Available on request. (Not ${N('uncle')}.)

---
//Note from Jack, 1999: Dad got the job. He says it was the video recorder bit that did it.//` };

  D.dadxmas = { font: 'Times New Roman', size: 12, md: `# CHRISTMAS PRESENTS 1993 - TOP SECRET
> do NOT leave this on the screen

* Wife: perfume (the one in the blue bottle, NOT the one from last year)
* Mom (Nan): slippers. And a video tape for recording her programmes.
* Jack: the dinosaur he keeps pointing at in the catalogue. The BIG one. With the noise.
* Jack (stocking): a little puzzle, satsuma, chocolate coins, a torch
* ${N('uncle')}: socks. ${N('uncle')} gets socks. It's tradition.
* Me: a modem? (ask "Father Christmas") - no, too expensive. Maybe next year.

## Where they are hidden
Top of the wardrobe, behind the suitcase. If anyone is reading this: they are NOT there. I moved them.

//(I moved them again.)//` };

  // ================================================================ spreadsheets
  // fmt keys are cells or ranges; values are tokens: b i u cur pct num int date al=c|r|l c=#hex bg=#hex
  D.money = () => {
    const M = [
      [101, 'January', 12, 2, 10, 9.99, 'Rubrick\'s cube (Jan sales!)'], [201, 'February', 12, 0, 0, 9.0, 'Controller Pak (Mom paid half)'], [301, 'March', 12, 3, 0, 11.5, 'AirMix Spitfire + glue'],
      [401, 'April', 12, 1.5, 5, 8.97, '3 pots of red paint'], [501, 'May', 12, 2, 0, 11.98, 'Episode I figures x2'], [601, 'June', 12, 4, 0, 3.5, 'Ice pops (it was HOT)'],
      [701, 'July', 12, 0, 0, 9.8, 'Episode I ticket + sweets'], [801, 'August', 15, 5, 0, 2, 'Eclipse viewer glasses'], [901, 'September', 12, 0, 0, 2.5, 'School pens (boring)'],
      [1001, 'October', 12, 2, 0, 0, 'NOTHING - saving for Daydream'], [1101, 'November', 12, 0, 0, 5, 'Sparklers (Mom said no rockets)'], [1201, 'December', 12, 0, 20, 18, 'Presents for everyone'],
    ].filter(r => r[0] <= md());
    const c = { A1: 'JACK\'S POCKET MONEY 1999', A2: 'Month', B2: 'Pocket money', C2: 'Odd jobs', D2: 'Gifts', E2: 'Spent', F2: 'What on', G2: 'Balance' };
    M.forEach((r, i) => { const n = i + 3; Object.assign(c, { ['A' + n]: r[1], ['B' + n]: r[2], ['C' + n]: r[3], ['D' + n]: r[4], ['E' + n]: r[5], ['F' + n]: r[6], ['G' + n]: n === 3 ? '=B3+C3+D3-E3' : `=G${n - 1}+B${n}+C${n}+D${n}-E${n}` }); });
    const t = M.length + 4, last = M.length + 2;
    Object.assign(c, { ['A' + t]: 'TOTAL', ['B' + t]: `=SUM(B3:B${last})`, ['C' + t]: `=SUM(C3:C${last})`, ['D' + t]: `=SUM(D3:D${last})`, ['E' + t]: `=SUM(E3:E${last})`, ['G' + t]: `=G${last}`,
      ['A' + (t + 2)]: 'Daydream costs', ['B' + (t + 2)]: 199.99, ['A' + (t + 3)]: 'I have saved', ['B' + (t + 3)]: `=G${last}`, ['A' + (t + 4)]: 'Still need', ['B' + (t + 4)]: `=MAX(0,B${t + 2}-B${t + 3})`,
      ['A' + (t + 5)]: 'Months to go', ['B' + (t + 5)]: `=ROUND(B${t + 4}/12,1)`, ['C' + (t + 5)]: '(at £12 a month, if I buy NOTHING)', ['A' + (t + 6)]: 'Got so far', ['B' + (t + 6)]: `=B${t + 3}/B${t + 2}` });
    return { cells: c, colW: { A: 96, B: 92, C: 70, D: 56, E: 64, F: 210, G: 76 }, fmt: { A1: 'b c=#000080', 'A2:G2': 'b bg=#ffff80', [`B3:E${t}`]: 'cur', [`G3:G${t}`]: 'cur b', ['A' + t]: 'b', [`B${t}:G${t}`]: 'b', [`B${t + 2}:B${t + 4}`]: 'cur', ['B' + (t + 6)]: 'pct b c=#008000', ['C' + (t + 5)]: 'i c=#808080' } };
  };
  D.paint = { cells: {
    A1: 'PAINT POTS (the stock take)', A2: 'Colour', B2: 'Pots', C2: 'How full', D2: 'Status', E2: 'Used for',
    A3: 'Ork skin green', B3: 2, C3: 0.4, E3: 'Skin. Lots of skin.',
    A4: 'Dark green', B4: 1, C4: 0.8, E4: 'Shading the skin',
    A5: 'Red (goes faster)', B5: 3, C5: 0.15, E5: 'EVERYTHING',
    A6: 'Metal (shiny)', B6: 1, C6: 0.6, E6: 'Choppas, shootas, teef caps',
    A7: 'Mud brown', B7: 1, C7: 0.9, E7: 'Boots, belts, Spitfire camo',
    A8: 'Teef white', B8: 1, C8: 0.5, E8: 'Teef (obviously)',
    A9: 'Black undercoat', B9: 1, C9: 0.3, E9: 'Spray. Outside only (Mom rule)',
    A10: 'Yellow', B10: 1, C10: 1, E10: 'Checks. Never opened. Checks are hard',
    A11: 'Blue', B11: 1, C11: 0.7, E11: 'Space Marines (Gorks don\'t do blue)',
    A12: 'Glue', B12: 1, C12: 0.05, E12: 'Fingers (mostly)',
    A14: 'TOTAL POTS', B14: '=SUM(B3:B12)', A15: 'Need buying', B15: '=COUNTIF(C3:C12,"<0.25")', A16: 'Average fullness', C16: '=AVERAGE(C3:C12)',
    ...Object.fromEntries([3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ['D' + n, `=IF(C${n}<0.25,"BUY MORE!",IF(C${n}=1,"unopened","ok"))`])),
  }, colW: { A: 130, B: 46, C: 70, D: 84, E: 220 }, fmt: { A1: 'b c=#008000', 'A2:E2': 'b bg=#c0ffc0', 'C3:C16': 'pct', 'A14:A16': 'b', 'B14:B15': 'b', A5: 'c=#ff0000 b' } };
  D.tetris = () => {
    const R = upto([[102, '02/01/99', 38140, 9, 'new Game Lad batteries'], [130, '30/01/99', 51900, 11, 'in the car'], [227, '27/02/99', 64220, 12, ''], [328, '28/03/99', 80505, 13, 'got a BLOCKOLOGY on level 13!!!'], [418, '18/04/99', 88010, 14, 'after making JackTris'], [522, '22/05/99', 102330, 15, 'OVER 100,000!!!'], [620, '20/06/99', 148320, 18, 'PHOTO TAKEN AS PROOF'], [830, '30/08/99', 141800, 17, 'not as good as the lost one'], [1111, '11/11/99', 150060, 18, 'NEW RECORD!!!'], [1226, '26/12/99', 156440, 19, 'Boxing Day, Gran watched']]);
    const c = { A1: 'BLOCKOLOGY HIGH SCORES (Game Lad, A-type)', A2: 'Date', B2: 'Score', C2: 'Level', D2: 'Notes' };
    R.forEach((r, i) => { const n = i + 3; c['A' + n] = r[0]; c['B' + n] = r[1]; c['C' + n] = r[2]; c['D' + n] = r[3]; });
    const e = R.length + 2, s = e + 2;
    Object.assign(c, { ['A' + s]: 'Best', ['B' + s]: `=MAX(B3:B${e})`, ['A' + (s + 1)]: 'Average', ['B' + (s + 1)]: `=AVERAGE(B3:B${e})`, ['A' + (s + 2)]: 'Worst', ['B' + (s + 2)]: `=MIN(B3:B${e})`, ['A' + (s + 3)]: 'Highest level', ['B' + (s + 3)]: `=MAX(C3:C${e})`, ['A' + (s + 4)]: 'Dave\'s best', ['B' + (s + 4)]: 11203, ['A' + (s + 5)]: 'Me vs Dave', ['B' + (s + 5)]: `=ROUND(B${s}/B${s + 4},1)`, ['C' + (s + 5)]: 'times better. (Just saying.)' });
    return { cells: c, colW: { A: 92, B: 84, C: 50, D: 220 }, fmt: { A1: 'b c=#800080', 'A2:D2': 'b bg=#e0e0ff', [`B3:B${s + 4}`]: 'num0', [`A${s}:A${s + 5}`]: 'b', ['B' + s]: 'b c=#ff0000', ['C' + (s + 5)]: 'i' }, chart: { type: 'bar', range: `A3:B${e}` } };
  };
  D.rubik = () => {
    const R = upto([[403, '03/04/99', 10800, 'first ever! (library book)'], [404, '04/04/99', 7200, ''], [420, '20/04/99', 1560, ''], [530, '30/05/99', 492, ''], [730, '30/07/99', 340, ''], [918, '18/09/99', 231, 'Dad timed it with the oven clock'], [1127, '27/11/99', 182, ''], [1229, '29/12/99', 168, 'new cube, much smoother']]);
    const c = { A1: 'RUBRICK\'S CUBE SOLVE TIMES', A2: 'Date', B2: 'Seconds', C2: 'Minutes', D2: 'Notes' };
    R.forEach((r, i) => { const n = i + 3; c['A' + n] = r[0]; c['B' + n] = r[1]; c['C' + n] = `=ROUND(B${n}/60,2)`; c['D' + n] = r[2]; });
    const e = R.length + 2, s = e + 2;
    Object.assign(c, { ['A' + s]: 'Best (seconds)', ['B' + s]: `=MIN(B3:B${e})`, ['A' + (s + 1)]: 'First (seconds)', ['B' + (s + 1)]: '=B3', ['A' + (s + 2)]: 'Times faster', ['B' + (s + 2)]: `=ROUND(B${s + 1}/B${s},0)`, ['C' + (s + 2)]: 'x faster than the first go!', ['A' + (s + 3)]: 'Target', ['B' + (s + 3)]: 60, ['C' + (s + 3)]: 'under a minute by 2000?? (no chance)' });
    return { cells: c, colW: { A: 110, B: 70, C: 64, D: 230 }, fmt: { A1: 'b c=#e10600', 'A2:D2': 'b bg=#ffe0a0', [`B3:B${s + 1}`]: 'num0', ['B' + s]: 'b c=#008000', [`A${s}:A${s + 3}`]: 'b', [`C${s + 2}:C${s + 3}`]: 'i' }, chart: { type: 'bar', range: `A3:B${e}` } };
  };
  D.party = { cells: {
    A1: 'MILLENNIUM PARTY AT DAVE\'S - BUDGET', A2: 'Item', B2: 'How many', C2: 'Price each', D2: 'Total', E2: 'Who\'s buying',
    A3: 'Crisps (big bags)', B3: 6, C3: 0.99, E3: 'me', A4: 'Pop (2 litre)', B4: 4, C4: 0.89, E4: 'Dave', A5: 'Party poppers', B5: 2, C5: 1.49, E5: 'me',
    A6: 'Sparklers', B6: 1, C6: 1.99, E6: 'Dave\'s dad (adults only for lighting)', A7: 'Torch batteries (Y2K!)', B7: 4, C7: 0.75, E7: 'me', A8: 'Emergency beans', B8: 2, C8: 0.32, E8: 'Mom (she insisted)',
    A9: 'Party hats', B9: 10, C9: 0.2, E9: 'Dave', A10: 'Disposable camera', B10: 1, C10: 4.99, E10: 'me (for evidence)',
    ...Object.fromEntries([3, 4, 5, 6, 7, 8, 9, 10].map(n => ['D' + n, `=B${n}*C${n}`])),
    A12: 'GRAND TOTAL', D12: '=SUM(D3:D10)', A13: 'Each (me and Dave)', D13: '=D12/2', A14: 'Days to go', D14: '=DATE(1999,12,31)-TODAY()', E14: '=IF(D14<=0,"IT\'S PARTY TIME!!!","not long now")',
  }, colW: { A: 160, B: 70, C: 76, D: 72, E: 240 }, fmt: { A1: 'b c=#800080', 'A2:E2': 'b bg=#ffd0ff', 'C3:D13': 'cur', 'A12:D14': 'b', D14: 'num0 b c=#ff0000' } };
  D.swtoys = () => {
    const R = upto([[508, 'Qui-Gon Gym', '08/05/99', 5.99, 'NO', 8], [515, 'Obi-Wan Cannoli (Space Cadet)', '15/05/99', 5.99, 'NO', 9], [522, 'Battle Droid', '22/05/99', 4.99, 'YES', 7],
      [529, 'Jar Jar Jams', '29/05/99', 0, 'YES', 3], [605, 'Watto', '05/06/99', 5.99, 'NO', 6], [619, 'Anklekin Skywobbler (Tattyween)', '19/06/99', 5.99, 'NO', 8], [626, 'Queen Amidala', '26/06/99', 5.99, 'YES', 6],
      [710, 'Sebulba\'s pod racer', '10/07/99', 14.99, 'NO', 9], [717, 'Anakin\'s pod racer', '17/07/99', 14.99, 'NO', 10], [904, 'R2-D2 (the old one, from a car boot sale)', '04/09/99', 1.5, 'NO', 9], [1116, 'Dark Mole (FINALLY!!!)', '16/11/99', 5.99, 'NO', 10]]);
    const c = { A1: 'MY INTERGALACTIC BATTLES COLLECTION', A2: 'Figure', B2: 'Got it', C2: 'Price', D2: 'Still in box?', E2: 'Coolness /10' };
    R.forEach((r, i) => { const n = i + 3; c['A' + n] = r[0]; c['B' + n] = r[1]; c['C' + n] = r[2]; c['D' + n] = r[3]; c['E' + n] = r[4]; });
    const e = R.length + 2, s = e + 2;
    if (R.length > 4) c['F7'] = '<- Dave bought it me as a JOKE';
    Object.assign(c, { ['A' + s]: 'Total spent', ['C' + s]: `=SUM(C3:C${e})`, ['A' + (s + 1)]: 'Still in box', ['C' + (s + 1)]: `=COUNTIF(D3:D${e},"YES")`, ['A' + (s + 2)]: 'Average coolness', ['C' + (s + 2)]: `=ROUND(AVERAGE(E3:E${e}),1)`, ['A' + (s + 3)]: 'Worth when I\'m grown up', ['C' + (s + 3)]: `=C${s}*10`, ['D' + (s + 3)]: '(only if I keep them in the boxes. I won\'t.)' });
    return { cells: c, colW: { A: 200, B: 70, C: 64, D: 84, E: 84, F: 200 }, fmt: { A1: 'b c=#000080', 'A2:F2': 'b bg=#000000 c=#ffd400', [`C3:C${s}`]: 'cur', ['C' + (s + 3)]: 'cur b', [`A${s}:A${s + 3}`]: 'b', F7: 'i c=#808080', ['D' + (s + 3)]: 'i' }, chart: { type: 'pie', range: `A3:A${e}`, vals: `E3:E${e}` } };
  };
  D.countdown = { cells: {
    A1: 'INTERGALACTIC BATTLES EPISODE I COUNTDOWN', A3: 'UK release', B3: '=DATE(1999,7,16)', A4: 'America got it', B4: '=DATE(1999,5,19)', A5: 'Today', B5: '=TODAY()',
    A7: 'Days to go', B7: '=B3-B5', C7: '=IF(B7>0,"days to go!!!",IF(B7=0,"IT\'S TODAY!!! GET YOUR COAT!!!","SEEN IT!!! (twice)"))',
    A8: 'Hours to go', B8: '=MAX(0,B7*24)', A9: 'Weeks to go', B9: '=MAX(0,ROUND(B7/7,1))', A10: 'Days America got it first', B10: '=B3-B4', C10: 'NOT FAIR',
    A12: 'Times I\'ve watched the trailer', B12: 41, C12: '(on the PC, it is the size of a stamp)', A13: 'Pocket money saved for ticket', B13: 4.5, A14: 'Ticket + popcorn costs', B14: 6.8, A15: 'Still need', B15: '=MAX(0,B14-B13)',
  }, colW: { A: 190, B: 84, C: 300 }, fmt: { A1: 'b c=#ff0000', 'B3:B5': 'date', B7: 'num0 b', 'B8:B10': 'num0', C7: 'b c=#000080', 'A7:A15': 'b', 'B13:B15': 'cur', C10: 'i c=#ff0000', C12: 'i' } };
  D.accounts = { cells: {
    A1: 'HOUSEHOLD ACCOUNTS 1994', A2: '(typed in by Dad, Lotus-style, the old way)', A4: 'Item', B4: 'Jan', C4: 'Feb', D4: 'Mar', E4: 'Total',
    A5: 'Gas', B5: 48.2, C5: 51.9, D5: 40.1, A6: 'Electric', B6: 36.75, C6: 35.5, D6: 33.2, A7: 'Phone', B7: 22.4, C7: 19.95, D7: 21.1, A8: 'Food', B8: 210, C8: 198.6, D8: 205.3, A9: 'COMPUTER (386)', B9: 0, C9: 0, D9: 899, A10: 'Jack\'s dinosaurs', B10: 4.99, C10: 7.99, D10: 12.5,
    ...Object.fromEntries([5, 6, 7, 8, 9, 10].map(n => ['E' + n, `@SUM(B${n}..D${n})`])), A12: 'TOTAL', B12: '@SUM(B5..B10)', C12: '@SUM(C5..C10)', D12: '@SUM(D5..D10)', E12: '@SUM(E5..E10)', A14: 'Note', B14: 'March was expensive. It was worth it. - Dad',
  }, colW: { A: 130, B: 64, C: 64, D: 64, E: 76 }, fmt: { A1: 'b', A2: 'i c=#808080', 'A4:E4': 'b u', 'B5:E12': 'cur', 'A12:E12': 'b', B14: 'i' } };

  // ================================================================ cardfiles
  D.mates = { cards: Cast.deep([
    ['DAVE', 'Best mate. Lives round the corner.\nPhone: 01632 960123 (his Mom answers. Always.)\nFave game: Goldenballs. Always picks Oddjob. (Banned in our house.)\nFave film: Episode I. Fave character: Jar Jar Jams. (We don\'t talk about it.)\nGood at: Kart Kaos, eating\nBad at: riddles, giving floppy disks back\nOwes me: 1 floppy disk, £1 (Y2K bet), 3 Pocket Critters cards'],
    ['COUSIN {cousin.NAME}', 'Older cousin. Has a PlaySpace AND a CD Walkman.\nLends me CDs if I promise not to scratch them.\nCan do the robot dance. Badly.\nSays the Internet is "for nerds". Uses it every day.\nPhone: 01632 960404 (ask for {cousin}, not {uncle})'],
    ['COUSIN RYAN', 'Thinks he knows EVERYTHING about computers.\nSent us a virus by e-mail and said it wasn\'t him.\nTips for computers: "turn it off and on again" (that\'s all of them)\nPhone: 01632 960356'],
    ['{kidEp1.NAME}', 'Computer Club. Makes web pages in Notepad, like me.\n{kidEp1.His} site has a MIDI that plays the second you open it. Loud.\nWants to be a games programmer. Me too. We\'re going to start a company.\nCompany name ideas: Pixel Soft, Blobbit Games, Jack & {kidEp1} Ltd (my idea, {kidEp1.he} wants {kidEp1} & Jack Ltd)'],
    ['{club4.NAME}', 'Best at Blockology in our class. Beat me ONCE. (Level 16. I was ill.)\nKnows every Pocket Critters. In order.\nThinks War Hamster is "weird". Thinks Gubbinz is "cute". Gubbinz is NOT cute. (He is a bit cute.)'],
    ['BIG {kidSoon.NAME}', 'Not actually big.\nGoalkeeper. Brilliant at football, rubbish at Kart Kaos.\nOwns a real lightspatula toy. The noise is AMAZING.\nWill swap it for: nothing. I asked.'],
    ['GUBBINZ', 'Species: not sure (half alien, half gremlin, all ears)\nLives: on my website (and possibly in the computer)\nLikes: pizza, shiny things, being fed by strangers\nDislikes: bath time, Dave, the Recycle Bin\nPhone: none. He just shouts.'],
    ['{teacher.NAME}', 'Runs Computer Club (Wednesdays after school).\nSays I can help with the school web site.\nTold me <BLINK> is "never the answer". It is sometimes the answer.'],
    ['NAN', 'Phone: 01632 960222. Ring on Sundays. Speak up.\nKnits jumpers (brown).\nPuts a fiver in cards. Says "don\'t tell your mother".\nHas never pressed the right button on the video recorder. Ever.'],
    ['DAVE\'S DOG (BISCUIT)', 'Eats socks.\nAte one of my Ork arms. It was a GOOD arm.\nWagging tail can knock a can of pop off a table at 3 metres.'],
  ]) };
  D.cheats = { cards: [
    ['GLOOM (PC)', 'Type these while you\'re playing (no Enter key):\nIDDQD - god mode (your face goes gold!)\nIDKFA - all keys, all weapons, full ammo\n\nDad\'s copy. Dad\'s best on level 1 is 47 seconds. He brings this up at Christmas.'],
    ['GOLDENBALLS 007 (ULTRA 64)', 'Cheats unlock when you beat levels fast enough:\nPaintball Mode - beat DAM on Secret Agent in under 2:40\nInvincibility - beat FACILITY on 00 Agent in under 2:05\nDK Mode - beat RUNWAY on Agent in under 5:00\n\nOddjob is banned at mine. He\'s too short. It\'s not fair.'],
    ['CONTRA (NES)', 'On the title screen press:\nUP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A START\nYou get 30 lives. (Dave\'s brother taught us. On his old NES.)\nIt works in loads of other games too. Try it everywhere.'],
    ['POCKET CRITTERS RED/BLUE (GB)', 'MissingNo trick:\n1. In Viridian City, talk to the old man who shows you how to catch Pocket Critters.\n2. Fly to Cinnabar Island.\n3. Surf up and down the east coast (the edge where land meets water).\n4. A weird glitchy Pocket Critters appears. The 6th item in your bag goes up to loads!\n\nWARNING: Dave says it can mess up your save. Do it at your own risk.'],
    ['JACKTRIS (PC)', 'My own game! Cheats (made by me, so they\'re REAL):\nHold DOWN to drop faster (not a cheat, it\'s the controls)\nThe only real cheat is practice.\n(OK there\'s one more. It\'s a secret. It involves the long bar.)'],
    ['MARLO 64 - RUMOUR', 'UNCONFIRMED PLAYGROUND RUMOUR!!!\nA boy at school says his cousin unlocked LOUIE G by getting all 120 stars and going to the fountain.\nI have looked. Dave has looked. Dave\'s cousin has looked.\nVERDICT: probably not true. (Keep looking though.)'],
    ['GUBBINZ', 'Feed him a pizza and press the speaker icon in the tray. He burps.\n(This isn\'t really a cheat. It\'s just funny.)'],
    ['JACKOS 98', 'Things to type in Start > Run:\n- "waaagh" (obviously)\n- "red ones go faster"\nThere are LOADS more. I\'m not putting them all on a card. Dave might read it.'],
  ] };
  D.swcards = { cards: [
    ['DARK MOLE', 'Episode I\'s big baddie. A Sulk.\nRed and black face, little horns, yellow eyes.\nLightsaber: RED, with a blade at BOTH ENDS.\nSays about three lines in the whole film. Doesn\'t need to.'],
    ['QUI-GON GYM', 'Space Cadet Master. Obi-Wan\'s teacher.\nGreen lightspatula. Calm. Bends the rules.\nFinds Anakin on Tattyween and thinks he\'s "the chosen one".\nPlayed by a very tall actor (Dad says he was in loads of films).'],
    ['OBI-WAN CANNOLI', 'Young in Episode I! Qui-Gon\'s apprentice.\nBlue lightspatula. Has a little plait in his hair (Space Cadet learners have them).\nOld Obi-Wan is the one in the first film who goes "use the Force" (sort of).'],
    ['ANKLEKIN SKYWOBBLER', 'A slave boy on Tattyween who builds his own pod racer.\nWins the Boonta Eve pod race against Sebulba.\nBUILT C-3PO HIMSELF out of bits!!!\nGrows up to be... you know who. (Heavy breathing.)'],
    ['QUEEN AMIDALA', 'Queen of Naboo. Elected! (She\'s a teenager. A teenage queen!)\nHas about fifty amazing outfits and a face painted white.\nHas handmaidens who look a LOT like her. That\'s a clue.'],
    ['JAR JAR JAMS', 'A Gungan from Naboo. Floppy ears, long tongue.\nClumsy. Banished from the underwater city by Boss Nass.\nDave\'s favourite. We have agreed not to talk about it.'],
    ['WATTO', 'Junk dealer in Mos Espa on Tattyween.\nA Toydarian: flies with tiny fast wings, like a blue flying pot belly.\nOwns Anakin and his mom. Bets on pod races. Grumpy.\nJedi mind tricks don\'t work on him!'],
    ['SEBULBA', 'Pod racer. A Dug (walks on his hands!).\nBig orange pod. CHEATS. Always.\nGets his pod broken in the end. Serves him right.'],
    ['R2-D2', 'Astromech droid (the little blue and white one that beeps).\nIn Episode I he fixes the Queen\'s ship\'s shields under fire and gets a medal (well, a thank you).\nFavourite droid. Doesn\'t talk. Doesn\'t need to.'],
    ['C-3PO', 'Protocol droid. Gold (later on). Worries a lot.\nFluent in over six million forms of communication.\nIn Episode I he hasn\'t got his gold covers on yet. You can see his wires!'],
    ['YOGA', 'Space Cadet Master. Small, green, about 900 years old.\nLives on Dagobah (swampy) in the old films.\nTalks backwards, he does.\nIn Episode I he\'s on the Space Cadet Council and he is NOT sure about Anakin.'],
    ['HAM SOLO', 'Pilot of the Millennium Pigeon.\nFlew the Kessel Run in less than twelve parsecs (Dave says a parsec is distance not time. Dave read that in a magazine).\nGot frozen in carbonite in Empire.'],
    ['BOBA FETT', 'Bounty hunter. Green armour, jetpack.\nTook frozen Han to Jabba the Hutt.\nSays hardly anything. Everybody loves him anyway.\nFalls into the Sarlacc pit in Space Cadet. (Dave thinks he got out.)'],
    ['ADMIRAL ACKBAR', 'Leads the rebel fleet at the Battle of Endor.\nFish-headed (he\'s a Mon Calamari).\nMost famous line is three words long and he says it at exactly the right time. "It\'s a trap!"'],
  ] };
  D.recipes = { cards: [
    ['CHEESE ON TOAST', 'Dad\'s recipe:\n1. Toast\n2. Cheese\n3. Put cheese on toast\n4. Grill until it bubbles\n5. Burn roof of mouth\n\n(Mom says this isn\'t a recipe. Dad says it\'s a CLASSIC.)'],
    ['NAN\'S FRUIT CAKE', 'DO NOT DELETE. NAN WILL KNOW.\n8oz flour, 6oz butter, 6oz sugar, 3 eggs, 1lb dried fruit, a splash of milk.\nGas mark 3 for "about two hours, until it smells right".\n(Nan never measures anything. These measurements are Mom\'s guess.)'],
    ['PANCAKES', 'For Pancake Day.\n4oz flour, 1 egg, half a pint of milk, pinch of salt.\nWhisk. Rest. Fry thin. Flip.\nThe first pancake is always rubbish. That\'s the rule. Dad eats it.'],
    ['SHEPHERD\'S PIE', 'Mince, onion, carrots, gravy at the bottom.\nMashed potato on top. Fork lines on the potato (very important).\nOven until brown on top.\nJack only eats it if the peas are on the side.'],
    ['EMERGENCY TEA', 'Beans on toast.\nIf no bread: beans.\nIf no beans: ring Tony\'s Pizza (01632 960555).'],
  ] };
})();

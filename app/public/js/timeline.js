/* The living 1999: what Jack is playing, watching, saving up for and going on about RIGHT NOW (in "1999").
 * Loaded straight after calendar.js and before anything renders, so it can add posts + countdowns to window.CAL.
 * Dates are 'MM-DD' in 1999. Every real-world fact here is dated as it happened (UK dates unless it says otherwise).
 * window.Timeline = { now(kind), all, today(), render() }  kinds: playing craze tv space chart saving hype mood mom blurb into */
(function () {
  'use strict';
  const CAL = window.CAL = window.CAL || { posts: [], hype: [] };
  const md = s => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
  const dayNo = s => { const [m, d] = s.split('-').map(Number); return Math.round((new Date(1999, m - 1, d) - new Date(1999, 0, 1)) / 864e5); };
  const keyOf = n => { const dt = new Date(1999, 0, 1 + n); return String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  // ------------------------------------------------------------------ today (same day/month as the real clock, but 1999)
  function today() {
    if (window.Desk && Desk.today99) { const t = Desk.today99(); return Object.assign({ key: String(t.m).padStart(2, '0') + '-' + String(t.d).padStart(2, '0') }, t); }
    const n = new Date(); let m = n.getMonth() + 1, d = n.getDate(); if (m === 2 && d === 29) d = 28;
    return { m, d, md: m * 100 + d, date: new Date(1999, m - 1, d), key: String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') };
  }

  // ================================================================== MORE POSTS for "What's New"
  // [MM-DD, TAG, html, optional regex: skip this post if calendar.js already has a matching post within 3 days]
  const POSTS = [
    // ---------------------------------------------------------------- January: still living in Christmas 1998
    ['01-01', 'GAMES', "New Year's resolution: FINISH <b>Kazoo of Time</b>. Got it for Christmas and I'm stuck in the Water Tempura. Everyone in the whole world is stuck in the Water Tempura."],
    ['01-02', 'TOYS', "More Christmas presents: <b>Zeldo</b>, a <b>Game Lad Color</b> (purple, you can see the insides!), Blockology DX and a selection box. My cousin got a <b>Furbo</b>. It talks in Furbosh and it NEVER goes to sleep."],
    ['01-03', 'SPACE', "NASSA launched the <b>Mars Polar Landlord</b> tonight! It lands near the south pole of Mars on <b>3 December</b>. I've written it on my calendar in red pen."],
    ['01-03', 'MUSIC', "<b>Stairs</b> are number one with <i>Heartbleat / Comedy</i>. Mom does the hand dance in the kitchen. Every time. EVERY time."],
    ['01-04', 'GAMES', "<b>Half-Loaf</b> on Dad's PC: got to the bit with the giant tentacle things. Turned the light off to play it. Turned it back on again quite quickly."],
    ['01-05', 'SITE', "Back to school. Christmas survey of our class: four people got Zeldo, two got Furbos, one got an Eggbert (in 1999!!!) and Dave got socks."],
    ['01-06', 'TOYS', "My Eggbert died AGAIN. That's the fourth one. It was called Gubbinz II. I give up on Eggberts. Dave says everyone gave up on them last year anyway."],
    ['01-07', 'TV', "Dave's uncle brought back loads of <b>Tikeshi's Castle</b> tapes from Japan. 100 people try to storm a castle and nearly all of them fall in the water. We don't understand a single word. Best telly EVER."],
    ['01-08', 'TV', "<b>Robo Rumble</b> series 2 is MENTAL. Sir Killalotta picked a whole robot up in his claws and carried it into the flame pit. Dad watched the whole thing and pretended he wasn't."],
    ['01-10', 'MUSIC', "<b>Chubby Slim</b> is number one with <i>Phrase You</i>. The video is just people dancing outside a cinema. You could make a video like that. I might."],
    ['01-11', 'GAMES', "Still playing <b>Warp Wombat: Warped</b> from Christmas. The motorbike levels are great, but Coco riding a tiger along the Great Wall of China is the best bit. Don't tell Crash."],
    ['01-12', 'GAMES', "<b>Crypt Raider III</b> has a level in LONDON on the Underground! Clara Loft goes to Aldwych. I've been on the Underground. It didn't have any traps. Disappointing."],
    ['01-13', 'SPACE', "The new space station is only two bits so far (Zaryer and Unitea, joined together in December), but you can see it go over at night. It looks like a star that's in a hurry."],
    ['01-14', 'TECH', "Dave's cousin's dad bought a <b>Celery-on 300A</b> and OVERCLOCKED it to <b>450MHz</b>. That's faster than our Pent-Yum II! For less money! If I tried it Mom would overclock ME."],
    ['01-15', 'GAMES', "<b>Goldenballs</b> four-player at Dave's. Rules: no Oddbob (he's too short, it's cheating). Proximity mines in the Facility. Dave says I'm a camper. I say I'm a TACTICIAN."],
    ['01-17', 'MUSIC', "<b>999</b> are number one with <i>A Little Bit Less</i>. Three blokes in matching outfits. Our music teacher says this is what pop is now."],
    ['01-18', 'GORKS', "New Gork in progress: a boy with a big choppa. A choppa is an axe. A big axe. Painted his teef white and now he looks like he's smiling. He is NOT smiling."],
    ['01-19', 'TOYS', "Yo-yos are the big thing in the playground. I can Walk the Dog and Around the World. I cannot Rock the Baby without hitting myself in the face."],
    ['01-20', 'TECH', "Our 56K modem never actually connects at 56K. It's usually <b>44,000</b> bits a second. Dad says it's the phone line. I say it's the phone line but LOUDER."],
    ['01-22', 'GAMES', "Blockology DX on the Game Lad Color: Ultra mode gives you <b>3 minutes</b> to get as many points as you can. Did it on the bus. Missed my stop."],
    ['01-24', 'MUSIC', "<b>The Offcuts</b> are number one with <i>Pretty Spry (for a Tall Guy)</i>. The big kids sing it in the corridor. Badly."],
    ['01-25', 'SW', "Watched the <b>Episode I teaser trailer</b> AGAIN. It came out in November and I have seen it about 80 times. It's a bit over two minutes long. That's about 160 minutes of my life. Worth it."],
    ['01-26', 'GAMES', "<b>BEAT THE WATER TEMPURA!!!</b> It took three weeks. I am never taking the Iron Wellies off ever again."],
    ['01-28', 'TECH', "<b>2001: A Space Oddity</b> is only two years away now! In the film there's a moon base, a giant spinning space station with a hotel on it, and a computer that talks. We've got a space station with two rooms. Hurry UP, NASSA."],
    ['01-31', 'MUSIC', "<b>Armand van Hedgen</b> is number one with <i>You Don't Know Us</i>. It's quite good for a song with no robots in it."],
    // ---------------------------------------------------------------- February
    ['02-01', 'GAMES', "Still haven't finished Kazoo. Got distracted by the fishing pond. The fishing pond is better than most whole games. Caught a <b>14 pounder</b> and got a Piece of Heart for it!"],
    ['02-02', 'TECH', "Dave's cousin has TWO <b>Hoodoo2</b> cards joined together (it's called SLI). <b>24MB</b> of graphics memory. He plays Jaquake II at <b>1024x768</b>. I play it at 512x384 and pretend it's modern art."],
    ['02-03', 'TOYS', "My cousin's Furbo has learnt English words. Well, it says 'me love you' in the middle of the night. My cousin has put it in the garage. You can still hear it."],
    ['02-07', 'MUSIC', "<b>Blondini</b> are number one with <i>Marcia</i>! Mom says she liked them the FIRST time, back in the 1970s. Ancient history."],
    ['02-08', 'GAMES', "Played the <b>Metal Gear Wobbly</b> demo off a magazine disc about 40 times. You can hide in a cardboard box. I tried hiding in a box in real life. Mom found me straight away."],
    ['02-10', 'MOM', "New house rule: no Internet between 6 and 8 because Mom needs the phone. That's PRIME TIME, Mom."],
    ['02-14', 'MUSIC', "<b>Lenny Kravitzel</b> is number one with <i>Fly Away</i>. It's from a car advert. All the best songs are from adverts now."],
    ['02-14', 'SITE', "Valentine's Day: got zero cards. Gubbinz got one. I think Mom sent it. (Mom says she didn't. Mom is a terrible liar.)"],
    ['02-16', 'SITE', "<b>PANCAKE DAY!!!</b> Ate six. Flipped one so high it stuck to the ceiling. It's still there. Mom says it can stay till Easter as a lesson."],
    ['02-17', 'MUSIC', "The Brit Awards were on and <b>Robbie Wilkins</b> won THREE. Mom cheered every time. Dad pretended to read the paper."],
    ['02-20', 'SPACE', "A French astronaut called <b>Jean-Pierre Haigneray</b> went up to the <b>Mirth</b> space station today. He's staying for SIX MONTHS. I couldn't stay in my room for six hours."],
    ['02-20', 'TV', "One year ago today the very first <b>Robo Rumble</b> was on telly. Happy birthday Robo Rumble! Sir Killalotta didn't get a cake. He'd crush it."],
    ['02-21', 'MUSIC', "<b>Brittany Spheres</b> is number one with <i>...Baby Two More Times</i>. Every girl in our class is doing the dance. Some of the boys are too. I'm not saying who."],
    ['02-23', 'SITE', "Learnt the two most important bits of HTML: &lt;BLINK&gt; and &lt;MARQUEE&gt;. This website will never be the same again. You're welcome."],
    ['02-28', 'GAMES', "Finished <b>Metal Gear Wobbly</b> in two days. <b>Pyjama Mantis READ MY MEMORY CARD</b> and knew which other Konamy games I'd played. HOW?! Had to plug the controller into port 2 to beat him. Genius.", /mantis|memory card/i],
    // ---------------------------------------------------------------- March
    ['03-01', 'GAMES', "The <b>ULTRA 64</b> came out here two years ago today (1 March 1997). Still the best console ever made. Mom says it's 'a phase'. Mom, it's been TWO YEARS."],
    ['03-03', 'TOYS', "The yo-yo craze is over. Our head teacher banned them after Liam's went through the staff room window. Thanks Liam."],
    ['03-04', 'GAMES', "A new handheld called the <b>WonderSwine</b> came out in Japan. The company of the man who invented the Game Lad helped make it. It can go sideways AND longways. Not coming here though."],
    ['03-07', 'FILMS', "Stanley Cubrick died today. He made <b>2001: A Space Oddity</b>, the best space film ever. Watched my taped copy again tonight. The bone that turns into a spaceship. Every time. Goosepimples."],
    ['03-07', 'MUSIC', "<b>Boyzown</b> are number one with <i>When the Going Gets Rough</i> for Comic Reliefs. It's for charity, so you're not allowed to say it's rubbish. (Red Nose Day on Friday!)"],
    ['03-10', 'SPACE', "<b>Mars Global Surfer</b> has finished slowing down into its proper orbit round Mars, and yesterday it started mapping the WHOLE planet. Every crater. Every rock. Probably no Martians."],
    ['03-12', 'TV', "<b>Robo Rumble: The Grudge Matches</b> tonight on BBQ Two: robots with a score to settle. AND it's Red Nose Day. Best Friday ever."],
    ['03-14', 'MOM', "Mother's Day! Made Mom breakfast in bed: toast (a bit black), tea (a bit cold) and a card with R2-B2 on it holding flowers. She said it was the best breakfast she'd ever had. She was being nice."],
    ['03-15', 'TOYS', "A kid in Year 8 has some <b>Pocket Critters cards</b> his uncle sent from America. He charges 10p just to LOOK at his Chargrillizard. He's going to be a millionaire."],
    ['03-19', 'TV', "<b>The Best of Robo Rumble</b> was on tonight. All the best fights and the biggest flips. Last one till the next series. That could be MONTHS."],
    ['03-21', 'MUSIC', "<b>B*Stitched</b> are number one with <i>Blame It on the Weathervane</i>. Four Irish girls in double denim. " + Cast.n('jsister') + " has learnt the whole dance. In Mom's jeans."],
    ['03-24', 'GAMES', "<b>FINISHED KAZOO OF TIME!!!</b> Beat Baron Meatballo! Three months of my life! The ending made me feel weird and sad and happy. Now going back for all <b>100 Gold Skulltoolas</b>. See you in the year 2000."],
    ['03-28', 'MUSIC', "<b>Mr. Ooze</b> is number one with <i>Flat Feet</i>, the song from the jeans advert with the yellow puppet called Flat Derek. It has NO WORDS. Number one with no words! Respect."],
    ['03-28', 'MOM', "The clocks went forward last night. The video is flashing 12:00 again. I'm the only person in this house who can fix it. Charging Dad 20p."],
    ['03-31', 'TV', "Watched <b>Pocket Critters</b> at Dave's (his mom tapes it off Sky Won for him). Ashley's Zapachu won't go in its Pok&eacute; Ball. Ash is a RUBBISH trainer. I'd be loads better."],
    // ---------------------------------------------------------------- April
    ['04-01', 'SPACE', "<b>Mars Global Surfer</b> has been mapping all of Mars for three weeks now. (Not an April Fool. I checked. Twice. It's 1 April, you can't trust anything.)"],
    ['04-02', 'SITE', "<b>EASTER HOLIDAYS!!!</b> Two weeks of no school. Plans: Rubrick's cube, Zeldo, Marlo Party, Zeldo, Rubrick's cube."],
    ['04-04', 'SITE', "Easter Sunday: four Easter eggs eaten before lunch. Mom has hidden the rest. I WILL find them. I found the Christmas presents in November."],
    ['04-08', 'TOYS', "Built a <b>K'Nix rollercoaster</b> right round my bedroom with a loop. The ball falls off at the loop. Every. Single. Time. The guests are not happy (the guests are BLOCKO men)."],
    ['04-11', 'MUSIC', "<b>Martina McCrutchen</b> is number one with <i>Perfect Minute</i>. She was Tiffany in WestEnders. Mom knows ALL the words."],
    ['04-12', 'SPACE', "On this day in 1961 Yuri Garglin became the first person in space. And on this day in 1981 the very first Space Shuttlebus launched. Same day, 20 years apart. Space has a sense of humour."],
    ['04-13', 'TECH', "Our <b>6.4GB</b> hard drive is nearly FULL. Half-Loaf, Worms, Championship Mangler and about a thousand screenshots of Worms. Mom was wrong. People DO need 6.4GB."],
    ['04-15', 'SPACE', "NASSA launched <b>Landsnap 7</b> today, a satellite that takes photos of the whole Earth. I wonder if it can see our house. I'm going to wave tomorrow. Just in case."],
    ['04-18', 'GORKS', "Easter hols painting marathon: six Gorks, one trukk wheel and most of my fingers. Red ones go faster, so most of it's red."],
    ['04-20', 'TOYS', "Got the <b>Micro Mechanics</b> out of the loft and built a whole city on the landing. Mom stood on a petrol tanker. We don't talk about it."],
    ['04-24', 'SPACE', "<b>Mars</b> is opposite the Sun tonight, so it's the brightest it's been for two years. It's the orange star low down in the south-east after dark. Saw it from the back garden! Dad saw it too and said 'that's an aeroplane'."],
    ['04-24', 'SPACE', "The <b>Hubbly Space Telescope</b> went up nine years ago today (24 April 1990). It's still up there taking the best photos ever. Even after they had to give it glasses."],
    ['04-25', 'MUSIC', "<b>Westloaf</b> are number one with <i>Spare It Again</i>, their first single! Five Irish lads who stand up off stools at the key change."],
    ['04-28', 'TECH', "In 2001: A Space Oddity, the HOL 9000 computer can talk, play chess and lip-read. Our PC can play chess but it takes ten minutes a move and crashed when I castled. Only two years to catch up..."],
    // ---------------------------------------------------------------- May
    ['05-02', 'SPACE', "There's a website where you can see a photo of Mars from Mars Global Surfer almost every week now. Downloading one takes about four minutes. Worth it. It's MARS."],
    ['05-06', 'TOYS', "Went to the toy shop for the <b>Dark Mole</b> figure. SOLD OUT. Got Qui-Gon Gym and a Battle Toaster instead. That's all my money gone till June. Dark Mole hunt continues...", /darth maul.*(figure|sold)|got.*maul/i],
    ['05-09', 'MUSIC', "<b>Backalley Boys</b> are number one with <i>I Want It This Way</i>. In the video they're in an airport. I've never been in an airport."],
    ['05-10', 'CUBE', "Rubrick's cube personal best: <b>8 minutes 12 seconds</b>. Dave timed it on his digital watch. He timed it in the wrong mode at first, so it might have been 8 minutes 12 HOURS."],
    ['05-14', 'SW', "Five days till Episode I opens in America. Some fans have been queuing outside one cinema in Los Angeles for over a MONTH. That's commitment. (Or madness. Mom says madness.)"],
    ['05-16', 'MUSIC', "<b>Boyzown</b> are number one again with <i>You Kneaded Me</i>. Boyzown and Westloaf are taking it in turns. It's an Irish boyband invasion."],
    ['05-20', 'SW', "Americans have seen Episode I and the Internet has OPINIONS. Lots of people say Jar Jar Jams is annoying. CAN'T BE. I'm not reading any more spoilers. Fingers in ears. LA LA LA."],
    ['05-21', 'MOM', "Mom went to see <b>Knotting Hill</b> with her friends. I asked her if it had spaceships in it. No spaceships. She still said it was 'lovely'. That's not a review, Mom."],
    ['05-22', 'TOYS', "<b>BLOCKO INTERGALACTIC BATTLES</b> is in the toy shop!!! A Z-Wing, a Naboodle fighter, a Sulk Infiltrator, a whole peapod race set... I stood there for 40 minutes. My savings are in a crisis."],
    ['05-23', 'MUSIC', "<b>Shins &amp; Bigtoe</b> are number one with <i>Sweet Like Custard</i>. Perfect summer song, and it's not even summer yet."],
    ['05-26', 'TV', "Mancake United won the European Cup with two goals in injury time! That's the Treble. Dave's dad cried. Dave's dad ALSO cried at the end of Toy Storey, so that's not saying much."],
    ['05-27', 'SPACE', "Space Shuttlebus <b>Dishcovery</b> took off for the new International Space Stationery! Mission STX-96. They're taking up clothes, tools and food so it's ready for the first crew. Space shopping!"],
    ['05-29', 'TV', "<b>Eurovizzion</b> was on, all the way from Jerusalem. Sweden won. Mom gave every song a mark out of ten. Gubbinz gave Sweden <i>douze points</i>."],
    // ---------------------------------------------------------------- June
    ['06-03', 'GAMES', "<b>Blockology</b> was invented 15 years ago this month, in 1984, by a Russian man called Alexey Pyjamanov on a computer that couldn't even do graphics. And it's STILL the best game ever made. Fight me."],
    ['06-06', 'SPACE', "Dishcovery landed back in Florida in the middle of the night after visiting the space station. Nearly ten days in space! Then home for a cup of tea, probably. (Americans don't drink tea.)"],
    ['06-06', 'MUSIC', "<b>Baz Lurkman</b> is number one with <i>Everyone Is Free (To Wear Sunhats)</i>. It's not even singing. It's a man TALKING. Mom says it's very wise. Mom is now putting sun cream on me twice a day."],
    ['06-08', 'GAMES', "Episode I Racer: won the Boomta Classic! You can upgrade your peapodracer with parts from Wotto's junk shop. Spent all my peapodracing money on a new engine and exploded straight away."],
    ['06-13', 'MUSIC', "<b>Z Club 7</b> are number one with <i>Bring Them All Back</i>. They've got their own TV show where they live in Miami. We live in a cul-de-sac."],
    ['06-15', 'CUBE', "Rubrick's cube: <b>6 minutes 50</b>! The secret is not panicking at the last layer. I always panic at the last layer."],
    ['06-20', 'MUSIC', "<b>Vengaboats</b> are number one with <i>Zoom, Zoom, Zoom, Zoom!!</i>. Four exclamation marks. FOUR. Respect."],
    ['06-20', 'MOM', "Father's Day: gave Dad a mug that says WORLD'S BEST DAD. He's using it for pens. Mom says that means he loves it."],
    ['06-24', 'SPACE', "NASSA launched <b>FUSE</b>, a telescope that sees in ultraviolet light. It's going to look for the stuff left over from the Big Bang. Big Bang leftovers. Like Christmas leftovers but in SPACE."],
    ['06-27', 'MUSIC', "<b>ATC</b> are number one with <i>9 PM (Till I Get Home)</i>. It's a dance song. I'm in bed by 9pm, so I'll never know what happens at 9pm."],
    ['06-30', 'SW', "16 days to go. I have avoided ALL Phantom Menace spoilers for six weeks. Changed the channel on the news twice. Left the room when Dave's cousin started talking. I am a SPACE CADET."],
    // ---------------------------------------------------------------- July
    ['07-04', 'TOYS', "Bought the BLOCKO Intergalactic Battles <b>Z-Wing</b> with my saved money! Loads of pieces. Built it in one go. The wings go into attack position. Mom hoovered up R2-B2's head. FOUND IT."],
    ['07-11', 'MUSIC', "<b>Rickie Martini</b> is number one with <i>Livin' la Vida Cocoa</i>. Mom dances to it with the vacuum. This house is a nightmare."],
    ['07-15', 'SW', "<b>TOMORROW.</b> Can't sleep. Laid my clothes out like it's the first day of school. Mom says we're going to the first showing in the morning. I've set THREE alarms."],
    ['07-16', 'SPACE', "30 years ago today <b>Apolly 11</b> took off for the Moon (16 July 1969). On the same day as The Phantom Nuisance comes out. Space AND Intergalactic Battles. Best day of the year."],
    ['07-17', 'SW', "Saw Episode I AGAIN. Second time I noticed: Dark Mole hardly says anything. He doesn't NEED to. Also Jar Jar Jams is... OK, Jar Jar Jams is a bit annoying. Fine. FINE. The Internet was right."],
    ['07-20', 'SPACE', "30 years since <b>Apolly 11 landed on the Moon</b>! Tonight NASSA tried to launch Columbun with the first woman shuttle commander, but stopped it with <b>7 seconds</b> to go. SO close. Also today they lifted <b>Liberty Bell 7</b>, Gus Grizzum's old space capsule, off the bottom of the Atlantic after 38 years!"],
    ['07-22', 'SPACE', "Columbun launch tried AGAIN tonight. Called off because of the weather. Third time lucky?"],
    ['07-26', 'GAMES', "Summer holiday plan: get every peapodracer in Episode I Racer, get the Rubrick's cube under 5 minutes, paint 20 minis, and NOT go outside unless I have to."],
    ['07-28', 'SPACE', "Columbun landed in Florida in the middle of the night. Eileen Collinz = first woman to command a Space Shuttlebus, and the Chandruff X-ray telescope is up there now. Mission: complete."],
    // ---------------------------------------------------------------- August
    ['08-01', 'MUSIC', "<b>Ronan Keeping</b> is number one with <i>When You Say Something at All</i>, from Mom's Knotting Hill film. Mom has now said Knotting Hill is 'lovely' 400 times."],
    ['08-03', 'GAMES', "Rainy day, so I dug the <b>Mega Glide</b> out of the loft. <b>Zip the Badger 2</b> still holds up. Got all six Time Stones once in 1994 and nobody believes me."],
    ['08-05', 'SPACE', "Got my <b>eclipse viewer glasses</b> for next week (from the newsagent, &pound;2). Mom has made me promise about a thousand times: NEVER look at the Sun without them. Not even a tiny peek."],
    ['08-10', 'SPACE', "The eclipse is TOMORROW morning! It's only fully total in Cornwall (and a bit of Devon), but everywhere else gets a big chunk of the Sun covered too. Praying for no clouds. Mom has made a pinhole viewer out of a cereal box."],
    ['08-12', 'SPACE', "Eclipse aftermath: the cereal box pinhole viewer actually worked! You could see a tiny crescent Sun on the bottom of the box. Next total eclipse in Britain: 2090. I'll be OLD."],
    ['08-15', 'MUSIC', "<b>Westloaf</b> are number one AGAIN with <i>If I Let You Stay</i>. Two singles, two number ones. Two. Stools."],
    ['08-18', 'SPACE', "The <b>Cassiny</b> probe flew past Earth early this morning, using our gravity like a slingshot to fling it out to Saturn. It gets there in <b>2004</b>! I'll be practically a grown-up."],
    ['08-22', 'MUSIC', "<b>Gerri Hallowed</b> is number one with <i>Mi Chico Bambino</i>. Ginger Slice left the Slice Girls and she's STILL getting number ones. The Slice Girls are going to have to get a new Ginger."],
    ['08-25', 'MOM', "Back-to-school shopping. Mom bought me shoes two sizes too big 'to grow into'. I'm wearing clown shoes for a YEAR."],
    ['08-29', 'MUSIC', "<b>Lou Bagel</b> is number one with <i>Bongo No. 5</i>. Every grown-up at the barbecue danced to it. Every. Grown-up."],
    ['08-30', 'SITE', "Last bank holiday of the summer. One more week of holidays. I haven't done my holiday homework. I've built 40 models though (AirMix, BLOCKO, Gorks), which is basically art homework."],
    ['08-31', 'TECH', "A company called nVidia announced the <b>GeFarce 256</b> and they're calling it 'the world's first GPU'. GPU! It does the 3D maths itself so the processor doesn't have to. I need one. I don't know what for. I just NEED one."],
    // ---------------------------------------------------------------- September
    ['09-04', 'SW', "Episode I is STILL on at the cinema and I've seen it five times. Final opinion: Peapod Race 10/10. Dark Mole 10/10. The lightspatula fight 11/10. Trade disputes 2/10. Jar Jar Jams 1/10."],
    ['09-12', 'MUSIC', "<b>Vengaboats</b> are number one with <i>We're Going to Majorca!</i>. Nobody in our class has ever been to Ibiza. We went to a caravan in the rain."],
    ['09-14', 'GAMES', "The Pocket Critters games aren't even out here yet and the playground is ALREADY arguing about Moss or Puddle. Three weeks to go."],
    ['09-19', 'MUSIC', "<b>Eiffle 56</b> are number one with <i>Green (Da Ba Doo)</i>. Everything is blue. The whole school is singing it. Our teacher threatened to cancel music forever."],
    ['09-21', 'GAMES', "Pre-ordered <b>Pocket Critters Puddle</b> at the shop in town with my saved pocket money. They gave me a ticket. I keep the ticket under my pillow."],
    ['09-24', 'Y2K', "Joke: if HAL from 2001 had the Millennium Bug he'd say 'I'm sorry Dave, I'm afraid it's 1900.' (My mate Dave says it isn't funny. My mate Dave is not THAT Dave.)"],
    ['09-27', 'CUBE', "Rubrick's cube: <b>3 minutes 58</b>!!! Under four minutes! Did a lap of the garden. Mom asked if I was OK."],
    ['09-29', 'GAMES', "The <b>PlaySpace</b> came out here four years ago today (29 September 1995). Still going strong. My memory card is still full."],
    // ---------------------------------------------------------------- October
    ['10-02', 'GAMES', "Three days till Pocket Critters! Dave's getting Moss Version, I'm getting Puddle Version, so we can trade the ones that are only in each game. That's how they get you."],
    ['10-04', 'SPACE', "42 years ago today Russia launched <b>Spudnik</b>, the first satellite ever. All it did was go 'beep'. Like our microwave. But in SPACE."],
    ['10-06', 'GAMES', "Caught a <b>ZAPACHU</b> in Whispering Woods!!! It took 45 minutes of walking up and down in the grass. Named it Gubbinz. Obviously."],
    ['10-08', 'TOYS', "Pocket Critters trading at lunch with Game Lad link cables. Six people round one bench. A dinner lady asked if we were building a bomb."],
    ['10-10', 'MUSIC', "<b>Christina Aquilina</b> is number one with <i>Genie in a Jar</i>. If I had a genie I'd wish for a Daydream and two more wishes."],
    ['10-12', 'SPACE', "The <b>Galilayo</b> probe just swooped really close past <b>Io</b>, the moon of Jupiter covered in volcanoes. ACTUAL SPACE VOLCANOES. Sending photos back right now. Very slowly."],
    ['10-13', 'GAMES', "Beat Soggy! Squirturtle evolved into Wartless Turtle at level 16 and now nothing can stop us. Tomorrow: the Daydream comes out. Two big things in one week. My brain is full."],
    ['10-16', 'GAMES', "Played a <b>Daydream</b> on the demo stand in the electrical shop in town: Zip Adventure for ten minutes until a man asked if I was 'actually buying it'. The whale bit is REAL."],
    ['10-20', 'GAMES', "Pocket Critters: beat Lt. Zapp, got the Spark Badge. Dave's still stuck on the bit where you have to find the Cut HM on the ship. Ha."],
    ['10-24', 'MUSIC', "<b>Westloaf</b> are number one with <i>Flying Without Strings</i>. Three singles, three number ones. That's a record or something. Stools are clearly the secret."],
    ['10-25', 'TECH', "Inkle's new <b>Pent-Yum III 'Copperpine'</b> chips are out, up to <b>733MHz</b>! The cache is inside the chip now, so it's loads faster. Our PC is a Pent-Yum II 350. It's basically an abacus."],
    ['10-26', 'GAMES', "Got to <b>Laundry Town</b> in Pocket Critters. The music is the creepiest thing I've ever heard. Played it with the sound off. Then the light on. Then not at all."],
    ['10-31', 'MUSIC', "<b>Fyve</b> are number one with <i>Keep On Moovin'</i>. Also the clocks went back last night so I got an extra hour of sleep. (I used it for Pocket Critters.)"],
    // ---------------------------------------------------------------- November
    ['11-01', 'GAMES', "Dave says if you talk to the old man in Gravel City then surf up and down the coast of Custard Island you get a glitchy Pocket Critters that copies your items. NOT trying it on MY save."],
    ['11-03', 'TOYS', "<b>Pocket Critters cards</b> are EVERYWHERE now. Dave swapped a holographic Macho Champ for three of my best ones. I think I got done. Chargrillizard is the one everybody wants and nobody has."],
    ['11-07', 'MUSIC', "<b>Gerri Hallowed</b> is number one again with <i>Lift Me Down</i>. She beat Baby Slice's song to it. Slice Girls vs Slice Girls! The playground is split down the middle."],
    ['11-09', 'GAMES', "Pocket Critters Puddle: <b>7 badges</b> and 94 Pocket Critters. Blame's quiz machines on Cinnabar are the hardest exam I've ever done and I've done SATs."],
    ['11-14', 'MUSIC', "<b>Robbie Wilkins</b> is number one with <i>She's the Two</i>. Mom is very happy. Dad is still pretending to read the paper."],
    ['11-14', 'SPACE', "30 years ago today <b>Apolly 12</b> took off and got hit by LIGHTNING. Twice! And it still went to the Moon. Tough rocket."],
    ['11-15', 'SPACE', "The <b>Hubbly Space Telescope</b> has put itself to sleep after another of its gyroscopes broke. It can't point properly. Don't worry, Hubbly: Space Shuttlebus Dishcovery is coming to fix you next month."],
    ['11-17', 'SPACE', "The <b>Leonid meteor storm</b> is tonight! Mom says I can get up at 2am if I go to bed at 8. Deal. Got my sleeping bag ready on the patio."],
    ['11-20', 'TOYS', "<b>Christmas list version 3:</b> a Daydream (+ Zip Adventure + a VMG), Donkey Wrong 64, BLOCKO Mindstorms, a Scaletrix set, more red paint. Mom says 'we'll see'. 'We'll see' means NO."],
    ['11-21', 'MUSIC', "<b>Wamdoo Project</b> are number one with <i>King of My Cottage</i>. I'm king of my cottage too. Well, my bedroom. Mom is queen of the house and she has the final say about the bedroom."],
    ['11-24', 'GAMES', "<b>Pocket Critters Puddle: FABULOUS FOUR BEATEN!!!</b> Blastortoise did most of the work. Gubbinz the Zapachu was level 61 and fought last. 120 caught. Still no MewOne. Nobody has MewOne. Dave says his cousin has MewOne. Dave's cousin also says he's been to space."],
    ['11-28', 'MUSIC', "<b>Cliff Richer</b> is number one with <i>The Millennium Plea</i>. Mom bought it. MY MOM BOUGHT IT. I can't go to school ever again."],
    ['11-30', 'Y2K', "ONE MONTH LEFT of the 1900s. Dad has printed out all the bank statements 'just in case'. Mom has bought another 20 tins of beans. I've backed up my Pocket Critters save by... writing it all down."],
    // ---------------------------------------------------------------- December
    ['12-01', 'GORKS', "December Gorks: painting a whole trukk mob for when the Millennium comes. If the Millennium Bug wipes out all the computers, Gorks don't need computers. Gorks need WHEELS."],
    ['12-02', 'SPACE', "TOMORROW the Mars Polar Landlord lands on Mars! I've had it in red pen on my calendar since January. They're going to listen for it with a radio dish as big as a football pitch."],
    ['12-05', 'MUSIC', "Cliff Richer is STILL number one. It's going to be the Christmas number one. Westloaf are coming for him though. Christmas chart WAR."],
    ['12-08', 'CUBE', "Rubrick's cube: <b>3 minutes 12</b>! It took a whole year to get from 'nearly one side' to this. Next year: under one minute. (Predictions for the year 2000: hoverboards, AND a sub-one-minute cube.)"],
    ['12-10', 'SPACE', "Europe launched <b>XMN</b>, the biggest science satellite Europe has ever built, on an Arianna 5 rocket from French Guiana. It sees X-rays. Like the dentist, but for black holes."],
    ['12-13', 'TECH', "Spec nerding: Dad says next year's computers will have <b>1GHz</b> chips. ONE GIGAHERTZ. That's a thousand megahertz. Our PC will be a museum piece. It's already a museum piece."],
    ['12-17', 'SITE', "<b>BROKE UP FOR CHRISTMAS!!!</b> Last school day of the 1900s. Teachers let us play hangman all afternoon. The word was 'MILLENNIUM'. Nobody could spell it. Not even the teacher."],
    ['12-18', 'SPACE', "NASSA launched <b>Terra</b>, a giant satellite that's going to watch the whole Earth's weather, oceans and forests for years. Like a giant Landsnap 7 that also does the weather."],
    ['12-19', 'MUSIC', "<b>WESTLOAF ARE THE CHRISTMAS NUMBER ONE</b> with <i>I Have a Scheme / Reasons in the Sun</i>! They knocked off Cliff! The last Christmas number one of the 1900s! (Mom is gutted about Cliff.)"],
    ['12-23', 'SPACE', "Hubbly got <b>six new gyroscopes</b> yesterday AND a new computer today. It's a <b>486 running at 25MHz</b>. Our PC is a Pent-Yum II 350. Our PC is FASTER than the Hubbly Space Telescope's brain!!!"],
    ['12-24', 'SPACE', "On Christmas Eve 1968, Apolly 8 became the first people ever to fly round the Moon, and they took the photo of the Earth rising over it. Looking at it in my space book under the duvet with a torch."],
    ['12-24', 'SITE', "Christmas Eve. Can't sleep. Can hear rustling downstairs. It's either Father Christmas or Dad trying to wrap something the shape of a Daydream. (Please be a Daydream.)"],
    ['12-26', 'SPACE', "The astronauts let Hubbly go again on Christmas Day, all fixed and shiny. Best Christmas present the Universe ever got."],
    ['12-28', 'SPACE', "Dishcovery landed back in Florida just after midnight our time. Last Space Shuttlebus mission of the 1900s. See you in the year 2000, NASSA."],
    ['12-29', 'MOM', "Mom's Millennium Bug checklist: 40 tins of beans, candles, a torch, a WIND-UP RADIO, and all the clocks set right. Dad's checklist: 'it'll be fine'. My checklist: save the game."],
    ['12-30', 'SITE', "Last proper update of 1999. Top 5 of the year: 1. The Phantom Nuisance. 2. Pocket Critters Puddle. 3. Kazoo of Time (Christmas 98 counts). 4. The eclipse. 5. Solving the Rubrick's cube. Worst: Jar Jar Jams. And The Millennium Plea."],
  ];

  // ================================================================== ERAS: [kind, from, to, text, extra]
  // Things only hang around while they're relevant: late-1998 stuff fades out by spring, 1999 stuff rises as it arrives.
  const ERAS = [
    // ---- NOW PLAYING (p = machine)
    ['playing', '01-01', '01-26', '<b>Zeldo: Kazoo of Time</b>', { p: 'ULTRA 64', n: 'Christmas 1998! Stuck in the Water Tempura.', y98: 1 }],
    ['playing', '01-27', '03-23', '<b>Zeldo: Kazoo of Time</b>', { p: 'ULTRA 64', n: "Past the Water Tempura! Baron Meatballo's Castle is SCARY.", y98: 1 }],
    ['playing', '03-24', '05-12', '<b>Kazoo of Time</b> (again)', { p: 'ULTRA 64', n: 'FINISHED IT! Now hunting the 100 Gold Skulltoolas.', y98: 1 }],
    ['playing', '01-01', '02-25', '<b>Half-Loaf</b>', { p: 'PC', n: "On Dad's PC, lights off. Then lights back on.", y98: 1 }],
    ['playing', '01-01', '02-07', '<b>Warp Wombat: Warped</b>', { p: 'PS', n: 'The motorbike levels!', y98: 1 }],
    ['playing', '01-01', '02-20', '<b>Intergalactic Battles: Rogue Squadrilla</b>', { p: 'ULTRA 64', n: 'Christmas present! Down the trench in a Z-Wing.', y98: 1 }],
    ['playing', '04-17', '12-31', '<b>JACKTRIS</b>', { p: 'PC', n: 'My own Blockology (on the Games page). Beat me.', lo: 1 }],
    ['playing', '01-01', '01-31', '<b>Crypt Raider III</b>', { p: 'PS', n: 'Clara Loft on the London Underground', y98: 1 }],
    ['playing', '01-01', '03-08', '<b>Blockology DX</b>', { p: 'GBC', n: 'Christmas present. In COLOUR.', y98: 1 }],
    ['playing', '01-01', '04-30', '<b>Goldenballs 007</b>', { p: 'ULTRA 64', n: "Four-player at Dave's. No Oddbob.", y98: 1 }],
    ['playing', '01-29', '04-20', '<b>Squirms Armageddon</b>', { p: 'PC', n: 'Banana bombs. Holy Hand Grenade.' }],
    ['playing', '02-26', '03-25', '<b>Metal Gear Wobbly</b>', { p: 'PS', n: "Pyjama Mantis is in my head (and my memory card)" }],
    ['playing', '03-09', '05-20', '<b>Marlo Party</b>', { p: 'ULTRA 64', n: 'Blisters from the stick-spinning games' }],
    ['playing', '04-12', '06-24', '<b>RollerCoaster Rupeecoon</b>', { p: 'PC', n: 'Ride with no ending. Sorry, guests.' }],
    ['playing', '05-13', '07-15', '<b>Blockology</b> (classic, the grey Game Lad)', { p: 'GB', n: 'Going for the 148,000 high score' }],
    ['playing', '06-04', '09-05', '<b>Episode I: Racer</b>', { p: 'ULTRA 64', n: 'Now THIS is peapodracing!' }],
    ['playing', '06-25', '10-20', '<b>Driver</b>', { p: 'PS', n: 'STILL stuck on the car park test' }],
    ['playing', '06-25', '08-20', '<b>Dungeon Keepa 2</b>', { p: 'PC', n: 'Slapping imps to make them work faster' }],
    ['playing', '07-23', '09-05', '<b>Blockology</b> (summer marathon edition)', { p: 'GB', n: 'Level 19. Thumbs hurt.' }],
    ['playing', '08-03', '08-31', '<b>Zip 2</b>', { p: 'MD', n: 'The Mega Glide came out of the loft' }],
    ['playing', '09-03', '10-04', '<b>Soul Weaver</b>', { p: 'PS', n: "Borrowed from Dave's cousin. Eats souls." }],
    ['playing', '09-06', '10-04', '<b>Goldenballs</b> (again)', { p: 'ULTRA 64', n: "Back to school = back to Dave's" }],
    ['playing', '10-05', '10-23', '<b>Pocket Critters Puddle</b>', { p: 'GB', n: 'Squirturtle! Caught a Zapachu called Gubbinz.' }],
    ['playing', '10-24', '11-23', '<b>Pocket Critters Puddle</b>', { p: 'GB', n: 'Badges, badges, badges. Gotta stash em all.' }],
    ['playing', '11-24', '12-31', '<b>Pocket Critters Puddle</b>', { p: 'GB', n: 'Fabulous Four beaten! Still no MewOne.' }],
    ['playing', '10-14', '10-26', '<b>Zip Adventure</b>', { p: 'DC', n: 'On the demo stand in the shop. Ten minutes at a time.' }],
    ['playing', '10-27', '12-10', '<b>Finally Fantasy VIII</b>', { p: 'PS', n: 'Four discs. Addicted to the card game.' }],
    ['playing', '11-05', '12-18', '<b>Spike the Stegosaur 2</b>', { p: 'PS', n: 'The dragon is back' }],
    ['playing', '11-19', '12-31', '<b>Super Smush Bros.</b>', { p: 'ULTRA 64', n: 'Four-player Zapachu vs Blobby vs Lingo' }],
    ['playing', '12-17', '12-31', '<b>Jaquake III Arena</b>', { p: 'PC', n: 'In a window the size of a stamp' }],
    ['playing', '12-25', '12-31', '<b>Donkey Wrong 64</b>', { p: 'ULTRA 64', n: 'CHRISTMAS!!! The DK Rap will not leave my head' }],
    // ---- CURRENT CRAZE (in the playground)
    ['craze', '01-01', '01-31', 'Eggberts', { n: 'RIP Gubbinz II.', y98: 1, dying: 1 }],
    ['craze', '01-01', '03-10', 'Furbos', { n: "Christmas 98's big thing. My cousin's won't shut up.", y98: 1 }],
    ['craze', '01-01', '03-03', 'Yo-yos', { n: 'Walk the Dog, Around the World, banned from the staff room', y98: 1 }],
    ['craze', '01-25', '05-18', 'The Episode I trailer', { n: 'Everyone can recite it. EVERYONE.' }],
    ['craze', '02-21', '04-30', 'The Brittany dance', { n: 'Half the class. Some of the boys too.' }],
    ['craze', '03-15', '06-30', 'American Pocket Critters cards', { n: '10p to look at the Chargrillizard' }],
    ['craze', '03-28', '05-15', 'Flat Derek impressions', { n: 'Nodding your head to Flat Feet with a yellow face' }],
    ['craze', '05-06', '09-05', 'Episode I figures', { n: 'Dark Mole is worth three Qui-Gons in a swap' }],
    ['craze', '05-19', '07-16', 'Avoiding Episode I spoilers', { n: 'Fingers in ears. LA LA LA.' }],
    ['craze', '07-16', '09-30', 'lightspatula duels', { n: 'Wrapping paper tubes. Double-bladed if you are hard.' }],
    ['craze', '08-01', '08-12', 'Eclipse glasses', { n: 'Everyone has a pair. Nobody looks at the Sun without them.' }],
    ['craze', '08-29', '10-10', 'Bongo No. 5 at every barbecue', { n: 'The grown-ups have caught it too' }],
    ['craze', '09-06', '10-04', 'Moss or Puddle?', { n: "The Pocket Critters games aren't even out and we're already arguing" }],
    ['craze', '09-19', '11-14', 'Singing Green (Da Ba Doo)', { n: 'The music teacher has had ENOUGH' }],
    ['craze', '10-05', '12-31', 'Pocket Critters trading', { n: 'Link cables at lunch. Six people, one bench.' }],
    ['craze', '11-01', '12-31', 'Pocket Critters cards', { n: 'Holographics are currency. Chargrillizard is a myth.' }],
    ['craze', '11-15', '12-31', 'Millennium Bug panic', { n: 'Beans. Candles. Wind-up radios. Mostly Mom.' }],
    // ---- ON THE BOX (c = channel)
    ['tv', '01-01', '03-05', '<b>Robo Rumble</b> series 2', { c: 'BBQ Two, Friday nights', y98: 1 }],
    ['tv', '03-06', '03-19', '<b>Robo Rumble</b> specials', { c: 'Grudge Matches, then The Best Of' }],
    ['tv', '12-03', '12-31', '<b>ROBO RUMBLE SERIES 3!!!</b>', { c: 'BBQ Two, Friday nights' }],
    ['tv', '01-01', '12-31', "<b>Tikeshi's Castle</b>", { c: "Dave's uncle's tapes from Japan", lo: 1 }],
    ['tv', '01-01', '12-31', '<b>SM:TW Live</b>', { c: 'ITB, Saturday mornings', lo: 1 }],
    ['tv', '01-01', '12-31', '<b>The Simpsocks</b>', { c: 'BBQ Two', lo: 2 }],
    ['tv', '01-01', '12-31', '<b>Who Wants to Be a Squillionaire?</b>', { c: "ITB (Mom's favourite, she shouts the answers)", lo: 2 }],
    ['tv', '01-01', '12-31', '<b>Top of the Pots</b>', { c: 'BBQ One, Fridays', lo: 3 }],
    ['tv', '02-18', '04-05', '<b>Red Dork VIII</b>', { c: 'BBQ Two. The whole crew is back!' }],
    ['tv', '03-12', '03-12', '<b>Red Nose Day</b>', { c: 'BBQ One. Doctor Whoops on Comic Reliefs!' }],
    ['tv', '03-28', '05-31', '<b>Futurarma</b>', { c: "Dave's cousin tapes it off the satellite" }],
    ['tv', '06-01', '12-31', '<b>Futurarma</b>', { c: "Dave's cousin's tapes (worn out)", lo: 1 }],
    ['tv', '03-29', '12-31', '<b>Pocket Critters</b>', { c: "Sky Won (at Dave's, or he tapes it)" }],
    ['tv', '05-29', '05-29', '<b>Eurovizzion</b>', { c: 'BBQ One. Mom has a score sheet.' }],
    ['tv', '07-23', '09-05', 'Summer holiday morning telly', { c: 'Cartoons in pyjamas till 11' }],
    ['tv', '08-11', '08-11', '<b>THE ECLIPSE</b>', { c: 'Live on every channel!' }],
    ['tv', '10-04', '11-08', '<b>Strolling with Dinosaurs</b>', { c: 'BBQ One. It looks REAL.' }],
    ['tv', '11-13', '11-13', '<b>Doctor Whoops Night</b>', { c: 'BBQ Two. Allowed to stay up!' }],
    ['tv', '11-29', '12-31', '<b>Farscope</b>', { c: 'BBQ Two. Puppets in space.' }],
    ['tv', '12-18', '12-31', 'Christmas telly', { c: 'Radio Crimes circled in red pen' }],
    // ---- SAVING UP FOR (price in pounds; got = bought on the 'to' date)
    ['saving', '01-01', '02-26', 'Metal Gear Wobbly', { price: 39.99, got: 1 }],
    ['saving', '01-01', '03-26', 'A second ULTRA 64 controller (for Goldenballs)', { price: 19.99 }],
    ['saving', '01-25', '06-04', 'Episode I: Racer', { price: 44.99, got: 1 }],
    ['saving', '03-01', '12-31', 'BLOCKO Mindstorms', { price: 149.99, rate: 0.12 }],
    ['saving', '04-05', '11-16', 'Dark Mole figure', { price: 5.99, rate: 0.2, n: 'Money: ready. Shops: SOLD OUT.' }],
    ['saving', '05-08', '12-31', 'A 3dfix <b>Hoodoo3</b> (16MB!)', { price: 99.99, rate: 0.25 }],
    ['saving', '05-22', '07-04', 'BLOCKO Intergalactic Battles Z-Wing', { price: 29.99, got: 1 }],
    ['saving', '06-16', '07-16', 'Episode I ticket + popcorn', { price: 6.5, got: 1 }],
    ['saving', '07-05', '10-05', 'Pocket Critters Puddle', { price: 24.99, got: 1 }],
    ['saving', '07-20', '12-31', 'A <b>DAYDREAM</b>', { price: 199.99, rate: 0.35 }],
    ['saving', '08-01', '08-05', 'Eclipse glasses', { price: 2, got: 1 }],
    ['saving', '09-01', '12-31', 'A bigger hard drive (<b>13GB</b>!)', { price: 119.99, rate: 0.08 }],
    ['saving', '10-06', '11-19', 'Super Smush Bros.', { price: 39.99, got: 1 }],
    ['saving', '11-01', '12-25', 'Donkey Wrong 64 (Christmas list)', { price: 49.99, got: 1 }],
    // ---- FILMS (for the "currently into" sentence)
    ['film', '01-01', '02-15', "Mom's <i>Tightanic</i> video (she's watched it eleven times)", { y98: 1 }],
    ['film', '01-25', '05-18', 'the <b>Episode I trailer</b>'],
    ['film', '03-07', '03-31', 'my taped copy of <b>2001: A Space Oddity</b>'],
    ['film', '06-11', '07-15', '<b>The Modemtrix</b> (there is no spoon)'],
    ['film', '07-16', '09-30', '<b>THE PHANTOM NUISANCE</b>'],
    ['film', '11-29', '12-31', '<b>The Modemtrix</b> on video'],
    // ---- JACK'S STATUS / MOOD
    ['mood', '01-01', '01-10', 'Full of Christmas chocolate. Stuck in the Water Tempura.'],
    ['mood', '01-01', '01-31', 'New year, new Eggbert... no. NO MORE EGGBERTS.'],
    ['mood', '01-11', '02-25', 'Playing Half-Loaf with the lights ON now, thank you very much.'],
    ['mood', '02-01', '02-26', 'Counting down to Metal Gear Wobbly. Hiding in boxes.'],
    ['mood', '02-26', '03-15', 'Hearing the Codec noise in my sleep.'],
    ['mood', '03-24', '04-15', 'Kazoo is FINISHED. Feeling empty inside. Need a new quest.'],
    ['mood', '04-03', '05-31', 'Can SOLVE A RUBRICK\'S CUBE. Am basically a genius.'],
    ['mood', '05-01', '05-18', 'Trailer watched: 140 times. Days until America gets Episode I: not many.'],
    ['mood', '05-19', '07-15', 'Avoiding spoilers. Trusting no one. Space Cadet mode.'],
    ['mood', '07-16', '07-31', 'JUST SEEN THE PHANTOM NUISANCE. Still vibrating.'],
    ['mood', '07-23', '09-05', 'SUMMER HOLIDAYS. Pyjamas till lunchtime.'],
    ['mood', '08-06', '08-12', 'Eclipse fever. Checking the weather forecast every hour.'],
    ['mood', '09-06', '10-04', 'Back at school. Counting days to Pocket Critters on a ruler.'],
    ['mood', '10-05', '11-23', 'Gotta Stash \'Em All. Haven\'t stashed \'em all.'],
    ['mood', '10-14', '12-24', 'Daydream: wanting one so much it hurts.'],
    ['mood', '11-24', '12-24', 'Christmas list rewritten for the fourth time.'],
    ['mood', '12-25', '12-31', 'Christmas! Donkey Wrong 64! Then: THE MILLENNIUM.'],
    ['mood', '01-01', '12-31', 'Painting minis. Red ones go faster.'],
    ['mood', '01-01', '12-31', 'Trying to beat my Jacktris high score.'],
    // ---- MOM SAYS
    ['mom', '01-01', '01-20', '"You do NOT need another Eggbert."'],
    ['mom', '01-01', '02-28', '"That Furbo is going in the garage if it talks at 3am again."'],
    ['mom', '01-01', '03-24', '"Have you finished that elf game yet?" (He is NOT an elf, Mom.)'],
    ['mom', '02-10', '12-31', '"Get off the Internet, I need the phone!"'],
    ['mom', '03-28', '04-10', '"Why is the video flashing 12:00 again?"'],
    ['mom', '04-03', '12-31', '"Put that cube down and eat your tea."'],
    ['mom', '05-01', '07-16', '"It\'s only a film." (IT IS NOT ONLY A FILM.)'],
    ['mom', '05-21', '08-31', '"Knotting Hill was lovely."'],
    ['mom', '06-06', '08-31', '"Sun cream! Both arms!"'],
    ['mom', '07-17', '09-30', '"If I hear that peapod race noise one more time..."'],
    ['mom', '08-01', '08-11', '"Do NOT look at the Sun. I mean it."'],
    ['mom', '09-06', '12-17', '"Homework first, Pocket Critters after."'],
    ['mom', '10-05', '12-31', '"Turn that Game Lad off, it\'s gone 9!"'],
    ['mom', '10-14', '12-24', '"We\'ll see." (about the Daydream)'],
    ['mom', '11-02', '12-31', '"We need more tins of beans. For the Millennium."'],
    ['mom', '11-28', '12-31', '"Cliff Richer is a lovely man."'],
    ['mom', '01-01', '12-31', '"Mind that glue on the carpet!"'],
    ['mom', '01-01', '12-31', '"Open a window, it smells of paint in here."'],
    ['mom', '01-01', '12-31', '"Ten more minutes on the computer. TEN."'],
    // ---- WELCOME BLURB (top of the home page; the newest one that's active wins)
    ['blurb', '01-01', '01-15', "<b>Happy New Year!</b> 1999 is going to be MASSIVE: Intergalactic Battles Episode I, a new Segue console, and Pocket Critters is coming over from Japan. Plus I still haven't finished Zeldo."],
    ['blurb', '01-16', '02-25', "Winter update: still playing all my Christmas games, still stuck in Zeldo, and only <b>a few weeks till Metal Gear Wobbly</b>. Also learning HTML properly. Look out."],
    ['blurb', '02-26', '03-31', "Big month! Metal Gear Wobbly is out, a new Phantom Menace trailer, and I'm nearly at the end of Kazoo of Time. Spring is here and so am I."],
    ['blurb', '04-01', '05-02', "<b>I FINISHED KAZOO OF TIME</b> and <b>SOLVED THE RUBRICK'S CUBE</b> in the same fortnight. What a time to be alive. Now it's all about Episode I..."],
    ['blurb', '05-03', '05-18', "<b>INTERGALACTIC BATTLES FEVER!!!</b> The toys are out, the soundtrack is out, and America gets the film on 19 May. We have to wait till JULY. Stay strong."],
    ['blurb', '05-19', '05-19', "<b>THE PHANTOM NUISANCE IS OUT IN AMERICA TODAY.</b> Not here. Not till 16 July. That's 58 more days. I'm fine. I'm FINE."],
    ['blurb', '05-20', '07-15', "America has seen The Phantom Nuisance. I have NOT. Spoiler-free zone in here, please. Meanwhile: peapodracing, the summer, and The Modemtrix."],
    ['blurb', '07-16', '07-22', "<b>I HAVE SEEN THE PHANTOM NUISANCE!!!</b> Dark Mole. The peapod race. That lightspatula fight. Summer holidays start next week and I'm going to watch it again. And again."],
    ['blurb', '07-23', '07-31', "<b>SCHOOL'S OUT!!!</b> Six weeks of summer. I've seen The Phantom Nuisance (more than once), Episode I Racer is on the ULTRA 64, and the eclipse is in August. Best. Summer. Ever."],
    ['blurb', '08-01', '08-10', "Summer holidays and the <b>TOTAL ECLIPSE</b> is coming on 11 August! It's only totally total in Cornwall and a bit of Devon, but the whole country goes dim. Glasses at the ready."],
    ['blurb', '08-11', '08-11', "<b>ECLIPSE DAY!!!</b> The Moon is going right in front of the Sun this morning. Totally total in Cornwall, a massive bite everywhere else. Glasses ON. Do NOT look at it without them."],
    ['blurb', '08-12', '09-08', "Summer's nearly over. Racer, Driver, Blockology marathons and loads of BLOCKO. Next up: the American Daydream on 9/9/99 and Pocket Critters in October!!!"],
    ['blurb', '09-09', '10-04', "Back at school, but the best bit of the year is coming: <b>Pocket Critters Moss &amp; Puddle</b> on 5 October and the <b>Daydream</b> on the 14th. My pocket money can't take it."],
    ['blurb', '10-05', '10-31', "<b>Pocket Critters IS HERE!!!</b> I've got Puddle Version. And 14 October is DAYDREAM DAY. October 1999 is officially the best month in history."],
    ['blurb', '11-01', '11-30', "The Pocket Critters craze has gone MENTAL, Smush Bros. is nearly here, and there's only a few weeks left of the 1900s. Is your computer Millennium Bug-proof? Mine is. (I think.)"],
    ['blurb', '12-01', '12-24', "<b>The last Christmas of the 1900s!</b> Robo Rumble is back, Donkey Wrong 64 is out, and the Millennium countdown is ticking. Write your Christmas lists!"],
    ['blurb', '12-25', '12-31', "<b>MERRY CHRISTMAS!!!</b> And in a few days: THE YEAR 2000. If the Millennium Bug gets us, it's been an honour."],
  ];

  // ================================================================== THE CHARTS: UK number one singles of 1999
  // [first day at No.1 (the Sunday the chart came out), artist, title, Jack's verdict]
  const CHART = [
    ['01-03', 'Stairs', 'Heartbleat / Comedy', 'Mom does the hand dance. 4/10'],
    ['01-10', 'Chubby Slim', 'Phrase You', 'Good for doing your homework to. 8/10'],
    ['01-17', '999', 'A Little Bit Less', 'Matching outfits. 3/10'],
    ['01-24', 'The Offcuts', 'Pretty Spry (for a Tall Guy)', 'The big kids love it. 7/10'],
    ['01-31', 'Armand van Hedgen ft. Dwayne Hardwood', "You Don't Know Us", 'Not bad. No robots. 6/10'],
    ['02-07', 'Blondini', 'Marcia', 'Mom liked them the FIRST time. 6/10'],
    ['02-14', 'Lenny Kravitzel', 'Fly Away', 'From a car advert. 7/10'],
    ['02-21', 'Brittany Spheres', '...Baby Two More Times', 'The whole class does the dance. 5/10'],
    ['03-07', 'Boyzown', 'When the Going Gets Rough', "It's for charity, so it's 10/10 (it's 4/10)"],
    ['03-21', 'B*Stitched', 'Blame It on the Weathervane', 'Double denim. 4/10'],
    ['03-28', 'Mr. Ooze', 'Flat Feet', 'No words! A yellow puppet! 9/10'],
    ['04-11', 'Martina McCrutchen', 'Perfect Minute', 'Mom knows all the words. 3/10'],
    ['04-25', 'Westloaf', 'Spare It Again', 'Stools. Key change. 3/10'],
    ['05-09', 'Backalley Boys', 'I Want It This Way', 'Airport video. 5/10'],
    ['05-16', 'Boyzown', 'You Kneaded Me', 'Boyzown again?! 3/10'],
    ['05-23', 'Shins &amp; Bigtoe', 'Sweet Like Custard', 'Summer song! 8/10'],
    ['06-06', 'Baz Lurkman', "Everyone Is Free (To Wear Sunhats)", "It's a man talking. 6/10"],
    ['06-13', 'Z Club 7', 'Bring Them All Back', 'They live in Miami. 5/10'],
    ['06-20', 'Vengaboats', 'Zoom, Zoom, Zoom, Zoom!!', 'Four exclamation marks. 7/10'],
    ['06-27', 'ATC', '9 PM (Till I Get Home)', "I'm in bed by 9pm. 7/10"],
    ['07-11', 'Rickie Martini', "Livin' la Vida Cocoa", 'Mom dances with the vacuum. 6/10'],
    ['08-01', 'Ronan Keeping', 'When You Say Something at All', "From Mom's Knotting Hill. 4/10"],
    ['08-15', 'Westloaf', 'If I Let You Stay', 'MORE stools. 3/10'],
    ['08-22', 'Gerri Hallowed', 'Mi Chico Bambino', 'Ginger Slice, solo. 5/10'],
    ['08-29', 'Lou Bagel', 'Bongo No. 5', 'Every grown-up at every barbecue. 7/10'],
    ['09-12', 'Vengaboats', "We're Going to Majorca!", "We went to a caravan. 6/10"],
    ['09-19', 'Eiffle 56', 'Green (Da Ba Doo)', 'The whole school is blue. 9/10'],
    ['10-10', 'Christina Aquilina', 'Genie in a Jar', 'I wish for a Daydream. 6/10'],
    ['10-24', 'Westloaf', 'Flying Without Strings', 'Stools: the sequel. 3/10'],
    ['10-31', 'Fyve', "Keep On Moovin'", 'Not bad actually. 6/10'],
    ['11-07', 'Gerri Hallowed', 'Lift Me Down', 'Slice vs Slice! 5/10'],
    ['11-14', 'Robbie Wilkins', "She's the Two / It's Only Them", 'Mom is happy. 7/10'],
    ['11-21', 'Wamdoo Project', 'King of My Cottage', 'King of my bedroom. 7/10'],
    ['11-28', 'Cliff Richer', 'The Millennium Plea', 'MOM BOUGHT IT. 0/10'],
    ['12-19', 'Westloaf', 'I Have a Scheme / Reasons in the Sun', 'Christmas number one! Beat Cliff! 5/10'],
  ];

  // ================================================================== SPACE WATCH: [date, upcoming text or '', what happened]
  const SPACE = [
    ['01-03', 'Mars Polar Landlord launch', 'Mars Polar Landlord launched! Lands on Mars on 3 December.'],
    ['02-07', 'Stardusty launch (comet dust catcher!)', 'Stardusty launched to catch comet dust and bring it home.'],
    ['02-20', 'Soyuse to the Mirth space station', 'A French astronaut, Jean-Pierre Haigneray, flew up to Mirth for six months.'],
    ['03-09', '', 'Mars Global Surfer started mapping the whole of Mars.'],
    ['04-15', 'Landsnap 7 launch', 'Landsnap 7 launched: photos of the whole Earth.'],
    ['04-24', 'Mars at its brightest (opposition)', 'Mars is opposite the Sun: the bright orange "star" in the south-east.'],
    ['05-27', 'Shuttle Dishcovery to the space station', 'Dishcovery (STX-96) launched to the new International Space Stationery.'],
    ['05-29', 'First shuttle docking with the ISSY', 'Dishcovery docked with the International Space Stationery: a first!'],
    ['06-06', 'Dishcovery comes home', 'Dishcovery landed safely after nearly ten days in space.'],
    ['06-24', 'FUSE ultraviolet telescope launch', 'FUSE launched to hunt for Big Bang leftovers.'],
    ['07-16', '30 years since Apolly 11 launched', '30 years ago Apolly 11 left for the Moon.'],
    ['07-20', 'Columbun launch: first woman shuttle commander', 'Columbun launch stopped at T-7 seconds! Liberty Bell 7 raised from the sea bed.'],
    ['07-23', '', 'Columbun launched! Eileen Collinz: first woman to command a Space Shuttlebus. Chandruff is up.'],
    ['07-28', '', 'Columbun landed at night. Chandruff X-ray telescope is working.'],
    ['07-29', 'Deep Space Won flies past an asteroid', 'Deep Space Won flew past the asteroid Braille.'],
    ['07-31', 'Lunar Prospectus crashes into the Moon (on purpose)', 'Lunar Prospectus crashed into the Moon looking for ice.'],
    ['08-11', 'THE TOTAL ECLIPSE', 'TOTAL ECLIPSE! Total in Cornwall, a big bite out of the Sun everywhere else.'],
    ['08-18', 'Cassiny slingshots past Earth', 'Cassiny flew past Earth on its way to Saturn (arrives 2004).'],
    ['08-28', '', 'The last crew left Mirth. Nobody home.'],
    ['09-23', 'Mars Climate Orbiteer arrives at Mars', 'Mars Climate Orbiteer LOST: someone mixed up pounds and metric!'],
    ['10-12', '', 'Galilayo swooped past the volcanoes of Io.'],
    ['11-15', '', 'Hubbly is asleep (broken gyroscope). Repair mission coming in December.'],
    ['11-18', 'The Leonid meteor storm', 'Leonids: thousands of shooting stars an hour (above the clouds).'],
    ['11-19', '', "China launched its first spacecraft, Shenzoo 1."],
    ['12-03', 'Mars Polar Landlord lands on Mars!', 'Mars Polar Landlord: no signal. Lost. Mars is cursed.'],
    ['12-10', 'XMN X-ray telescope launch (Europe!)', 'XMN launched on Arianna 5: Europe\'s biggest science satellite.'],
    ['12-18', 'Terra Earth-watching satellite launch', 'Terra launched to watch the whole Earth.'],
    ['12-20', 'Shuttle Dishcovery: fix the Hubbly!', 'Dishcovery launched to fix Hubbly. Space mechanics!'],
    ['12-23', '', 'Hubbly got six new gyroscopes and a new computer (a 486!).'],
    ['12-25', '', 'Hubbly let go again on Christmas Day, fixed!'],
    ['12-28', '', 'Dishcovery landed. Last shuttle mission of the 1900s.'],
  ];
  // what's up in the night sky when nothing's happening (by month)
  const SKY = ['Orion is up in the south after tea. Find the three stars of his belt!', 'Orion and the bright star Sirius, low in the south-east. Twinkly.', 'The Plough is high up after dark. Follow the end two stars to the Pole Star.',
    'The Plough is right overhead. Mars is getting brighter every night.', 'Mars is still bright in the evening. It\'s the orange one.', 'It barely gets dark at all. Bedtime is before the stars come out. Unfair.',
    'The Summer Triangle: three bright stars high up late at night.', 'Perseid shooting stars around the 12th! Plus: eclipse month!', 'Jupiter and Saturn are rising in the evening. Get the binoculars out.',
    'Jupiter is the brightest "star" in the sky all night. Saturn is just behind it.', 'Leonid meteors this month! And Jupiter is really bright.', 'Orion is back for the winter. Look for the space station going over.'];

  // ================================================================== extra COUNTDOWNS for the hype-o-meter (and the countdown box)
  const HYPE = [
    ['01-29', '<b>Squirms Armageddon</b>', 10],
    ['02-16', '<b>PANCAKE DAY</b>', 5],
    ['02-18', '<b>Red Dork VIII</b>', 10],
    ['03-05', 'the <b>Robo Rumble</b> Grand Final', 7],
    ['03-14', "Mother's Day (DON'T FORGET)", 5],
    ['04-02', 'the <b>Easter holidays</b>', 10],
    ['05-27', 'Shuttle <b>Dishcovery</b> to the space station', 6],
    ['09-09', 'the <b>American Daydream</b> (9/9/99)', 14],
    ['09-23', '<b>Mars Climate Orbiteer</b> reaching Mars', 10],
    ['10-31', '<b>Halloween</b>', 7],
    ['12-20', 'the <b>Hubbly repair mission</b>', 7],
  ];

  // ------------------------------------------------------------------ merge posts + countdowns into CAL (skipping anything calendar.js already has)
  (function merge() {
    const near = (a, b) => Math.abs(dayNo(a) - dayNo(b)) <= 3;
    const plain = h => h.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const existing = CAL.posts.map(p => [p[0], plain(p[2])]);
    let added = 0;
    for (const [d, tag, html, dup] of POSTS) {
      const pl = plain(html);
      if (existing.some(([ed, et]) => et === pl || (dup && near(ed, d) && dup.test(et)))) continue;
      CAL.posts.push([d, tag, html]); added++;
    }
    const hk = new Set(CAL.hype.map(h => h[0] + plain(h[1])));
    for (const h of HYPE) if (!hk.has(h[0] + plain(h[1]))) CAL.hype.push(h);
    CAL.timelineAdded = added;
  })();

  // ------------------------------------------------------------------ the engine
  const ALL = ERAS.map(([kind, from, to, text, x]) => Object.assign({ kind, from, to, text }, x || {}));
  const between = (e, m) => md(e.from) <= m && m <= md(e.to);
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  // how far through its life a thing is (0 = brand new, 1 = about to vanish)
  const age = (e, t) => { const a = dayNo(e.from), b = dayNo(e.to); return b > a ? (dayNo(t.key) - a) / (b - a) : 0; };
  function chartAt(m) { let i = -1; CHART.forEach((c, j) => { if (md(c[0]) <= m) i = j; }); return i; }
  function hypeNow(t) {
    const now = dayNo(t.key), list = [];
    for (const [d, name, before] of (CAL.hype || [])) { const left = dayNo(d) - now; if (left >= 0) list.push({ d, name, before, left, inWin: left <= before }); }
    list.sort((a, b) => (b.inWin - a.inWin) || (a.left - b.left));
    return list;
  }
  function now(kind, at) {
    const t = at ? Object.assign({}, today(), { key: at, md: md(at) }) : today(), m = t.md;
    if (kind === 'chart') { const i = chartAt(m); if (i < 0) return []; const c = CHART[i], next = CHART[i + 1], end = next ? dayNo(next[0]) : 365;
      return [{ artist: c[1], title: c[2], verdict: c[3], from: c[0], week: Math.floor((dayNo(t.key) - dayNo(c[0])) / 7) + 1, weeks: Math.max(1, Math.round((end - dayNo(c[0])) / 7)), prev: CHART[i - 1] ? { artist: CHART[i - 1][1], title: CHART[i - 1][2] } : null }]; }
    if (kind === 'space') {
      const n = dayNo(t.key);
      const past = SPACE.filter(s => dayNo(s[0]) <= n && n - dayNo(s[0]) <= 24).map(s => ({ d: s[0], text: s[2], ago: n - dayNo(s[0]) })).reverse();
      const next = SPACE.filter(s => s[1] && dayNo(s[0]) > n && dayNo(s[0]) - n <= 75).map(s => ({ d: s[0], text: s[1], left: dayNo(s[0]) - n }));
      return [{ past, next, sky: SKY[t.m - 1] }];
    }
    if (kind === 'hype') return hypeNow(t);
    if (kind === 'into') {
      const short = h => h.replace(/\s*\([^)]*\)/g, '').replace(/<\/?b>/g, '');
      const film = now('film', at)[0], tv = now('tv', at).filter(e => !e.lo)[0], cr = now('craze', at).filter(e => !e.fading && !e.dying)[0];
      const p = now('playing', at).filter(e => !e.fading).slice(0, film ? 2 : 3).map(e => '<b>' + short(e.text) + '</b>');
      return [(film ? [film.text] : []).concat(p, !film && tv ? [short(tv.text)] : [], cr ? [short(cr.text)] : [])];
    }
    let list = ALL.filter(e => e.kind === kind && between(e, m));
    if (kind === 'blurb') return list.sort((a, b) => md(b.from) - md(a.from)).slice(0, 1);
    if (kind === 'mood' || kind === 'mom') { // a different line each day, favouring the topical ones
      const top = list.filter(e => !(e.from === '01-01' && e.to === '12-31'));
      const pool = (top.length && hash(t.key + kind) % 4) ? top : list;
      return pool.length ? [pool[hash(t.key + kind + '!') % pool.length]] : [];
    }
    // newest things first; the old evergreen ones (lo) sink to the bottom
    return list.sort((a, b) => ((a.lo || 0) - (b.lo || 0)) || (md(b.from) - md(a.from))).map(e => Object.assign({ fading: age(e, t) > 0.8 && dayNo(e.to) - dayNo(e.from) > 20 && e.to !== '12-31' }, e));
  }
  const Timeline = window.Timeline = { now, today, all: { eras: ALL, posts: POSTS, chart: CHART, space: SPACE, hype: HYPE }, render: () => render(true) };

  // ================================================================== WIDGETS on the HOME page
  const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const money = n => '&pound;' + n.toFixed(2);
  const MACHINE = { N64: '#e10600', PS: '#2a2a9a', PC: '#6b6b6b', GB: '#7b8b2a', GBC: '#8a2be2', MD: '#111', DC: '#ff7a00' };
  // 1999 web embeds, not JackOS 98 windows: CGI boxes, a Java applet and a Shockwave movie (classes from site.css)
  const KIND = { play: ['cgi', 'NOW PLAYING'], craze: ['cgi', 'CURRENT CRAZE'], tv: ['cgi', 'ON THE BOX'], space: ['java', 'SPACE WATCH'], chart: ['cgi', 'THE CHARTS'], saving: ['cgi', 'SAVING UP FOR'], hype: ['shock', 'HYPE-O-METER'] };
  function box(cls, file, ico, body) {
    const [type, title] = KIND[cls], name = file.replace(/\..*$/, '');
    const head = type === 'cgi' ? `${title} <small>${file}</small>` : type === 'java' ? `&#9749; ${file}` : `${title} <small>${file}</small>`;
    return `<div class="win applet ${type} tl-w tl-${cls}"${type === 'cgi' ? '' : ` data-applet="${name}"`}><div class="tb"><span class="t">${head}</span></div><div class="body tl-body">${body}</div></div>`;
  }
  function wPlaying(t) {
    const list = now('playing').slice(0, 4);
    return box('play', 'nowplaying.cgi', 'play', `<ul class="tl-list">${list.map(e => `<li class="${e.fading ? 'tl-fading' : ''}"><span class="tl-mach" style="background:${MACHINE[e.p] || '#444'}">${e.p}</span><span>${e.text}${e.y98 ? ' <span class="tl-98">98</span>' : ''}<small>${e.n || ''}</small></span></li>`).join('') || '<li>Nothing! Mom confiscated everything.</li>'}</ul>`);
  }
  function wCraze() {
    const list = now('craze');
    const hot = list.filter(e => !e.fading && !e.dying), dying = list.filter(e => e.fading || e.dying);
    const top = hot[0] || list[0];
    return box('craze', 'craze.cgi', 'craze', top ? `<div class="tl-hot"><span class="tl-burst">HOT!</span><b>${top.text}</b><small>${top.n || ''}</small></div>`
      + (hot.slice(1, 3).length ? `<div class="tl-also"><b>Also big:</b> ${hot.slice(1, 3).map(e => e.text).join(', ')}</div>` : '')
      + (dying.length ? `<div class="tl-dying"><b>Dying out:</b> <s>${dying.slice(0, 2).map(e => e.text).join('</s>, <s>')}</s></div>` : '') : 'Nothing. Everyone is just standing around.');
  }
  function wTV() {
    const list = now('tv'), main = list.filter(e => !e.lo), pad = list.filter(e => e.lo).sort((a, b) => a.lo - b.lo || hash(a.text + today().key) % 3 - 1);
    const show = main.slice(0, 3).concat(pad).slice(0, 3);
    return box('tv', 'telly.cgi', 'tv', `<ul class="tl-tv">${show.map((e, i) => `<li>${i === 0 && !e.lo ? '<span class="tl-new">MUST WATCH</span> ' : ''}${e.text}<small>${e.c || ''}</small></li>`).join('')}</ul>`);
  }
  function wSpace() {
    const s = now('space')[0], last = s.past[0], next = s.next[0];
    const dd = k => { const [m, d] = k.split('-'); return d + '/' + m; };
    return box('space', 'spacewatch.class', 'space', `<div class="tl-stars">`
      + (last ? `<div class="tl-sline"><span class="tl-lbl">${last.ago === 0 ? 'TODAY' : 'LATEST'}</span> ${esc(last.text)} <i>${dd(last.d)}</i></div>` : `<div class="tl-sline"><span class="tl-lbl">TONIGHT</span> ${esc(s.sky)}</div>`)
      + (next ? `<div class="tl-sline"><span class="tl-lbl tl-next">${next.left === 1 ? 'TOMORROW' : 'T-' + next.left + ' DAYS'}</span> ${esc(next.text)}</div>` : `<div class="tl-sline"><span class="tl-lbl tl-next">SKY</span> ${esc(s.sky)}</div>`)
      + `<div class="tl-2001">Only <b>${731 - dayNo(today().key)}</b> days till <i>2001</i>. Where's my moon base, NASSA?</div></div>`);
  }
  function wChart() {
    const c = now('chart')[0];
    if (!c) return box('chart', 'top40.cgi', 'chart', '<div class="tl-no1"><span class="tl-badge">No.<b>?</b></span><div><b class="tl-song">New chart on Sunday!</b><small>The first chart of 1999. Mom says it\'s still Christmas.</small></div></div>');
    return box('chart', 'top40.cgi', 'chart', `<div class="tl-no1"><span class="tl-badge">No.<b>1</b></span><div><b class="tl-song">${c.title}</b><span class="tl-art">${c.artist}</span>`
      + `<small>${c.week > 1 ? `${c.week}${['', 'st', 'nd', 'rd'][c.week] || 'th'} week at No.1` : 'NEW at No.1 this week!'}</small></div></div>`
      + `<div class="tl-verdict">Jack says: ${c.verdict}</div>${c.prev ? `<div class="tl-prev">Last No.1: ${c.prev.title} (${c.prev.artist})</div>` : ''}`);
  }
  function wSaving() {
    const t = today(), list = now('saving').sort((a, b) => (md(a.to) - md(b.to))).slice(0, 3);
    const rows = list.map(e => {
      const done = e.got && md(e.to) === t.md;
      const span = dayNo(e.to) - dayNo(e.from) || 1, gone = dayNo(t.key) - dayNo(e.from);
      const saved = done ? e.price : e.got ? e.price * Math.min(0.97, 0.15 + 0.85 * gone / span) : Math.min(e.price * 0.93, e.price * 0.04 + gone * (e.rate || 0.1));
      const pct = Math.max(2, Math.min(100, Math.round(saved / e.price * 100))), blocks = Math.round(pct / 100 * 14);
      return `<li><div class="tl-sv"><span>${e.text}</span><b>${money(e.price)}</b></div><div class="prog tl-prog"><span style="display:flex;gap:2px">${'<i></i>'.repeat(blocks)}</span></div>`
        + `<small>${done ? '<b class="tl-got">GOT IT TODAY!!!</b>' : e.n ? e.n : `${money(saved)} saved (${pct}%)${e.got ? '' : pct < 30 ? ' ...at this rate, 2003' : ''}`}</small></li>`;
    });
    return box('saving', 'piggybank.cgi', 'saving', `<ul class="tl-save">${rows.join('') || '<li>Nothing! (Spent it all on ULTRA 64 games.)</li>'}</ul>`);
  }
  function wHype() {
    const h = now('hype')[0];
    if (!h) return box('hype', 'hype-o-meter.dcr', 'hype', 'Nothing to look forward to. Except the year 2000.');
    const span = Math.max(h.before, h.left, 1), lvl = h.left === 0 ? 100 : Math.max(4, Math.round((1 - h.left / Math.max(span, 30)) * 100));
    const word = lvl >= 100 ? 'MAXIMUM!!!' : lvl > 85 ? 'MEGA' : lvl > 60 ? 'HIGH' : lvl > 30 ? 'BUILDING' : 'warming up';
    return box('hype', 'hype-o-meter.dcr', 'hype', `<div class="tl-hname">${h.left === 0 ? 'TODAY:' : 'NEXT BIG THING:'} ${h.name}</div>`
      + `<div class="tl-meter"><div class="tl-fill" style="width:${lvl}%;--w:${lvl}"></div><div class="tl-ticks"></div></div>`
      + `<div class="tl-hrow"><span class="tl-lcd">${h.left === 0 ? 'NOW!' : String(h.left).padStart(3, '0')}</span><span>${h.left === 0 ? 'IT\'S HERE!!!' : h.left === 1 ? 'day to go!!!' : 'days to go'}</span><b class="tl-lvl">HYPE: ${word}</b></div>`);
  }
  function strip() {
    const mood = now('mood')[0], mom = now('mom')[0];
    return `<div class="tl-strip"><div class="tl-status"><span class="tl-k">JACK'S STATUS:</span> ${mood ? mood.text : 'Busy.'}</div><div class="tl-mom"><span class="tl-k">MOM SAYS:</span> ${mom ? mom.text : '"Bed."'}</div></div>`;
  }
  const join = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  let lastKey = '';
  function render(force) {
    const t = today(); if (!force && t.key === lastKey) return; lastKey = t.key;
    const home = document.getElementById('s-home'); if (!home) return;
    let board = document.getElementById('tlBoard');
    if (!board) {
      board = document.createElement('div'); board.id = 'tlBoard'; board.className = 'tl-board';
      const ed = home.querySelector('.ed'), head = home.querySelector('.sechead');
      if (ed) ed.after(board); else if (head) head.after(board); else home.prepend(board);
    }
    board.innerHTML = `<div class="tl-head"><span class="tl-title">JACK'S WORLD THIS WEEK</span><span class="tl-date">${t.d}/${t.m}/99 &middot; updated every day!</span></div>`
      + strip() + `<div class="tl-grid">${wHype()}${wPlaying(t)}${wCraze()}${wTV()}${wChart()}${wSpace()}${wSaving()}</div>`;
    // the welcome blurb + "currently into" sentence change through the year
    const copy = home.querySelector('.ed .copy');
    if (copy) {
      let p = copy.querySelector('.tl-blurb');
      if (!p) { p = document.createElement('p'); p.className = 'tl-blurb'; const first = copy.querySelector('p'); first ? first.after(p) : copy.prepend(p); }
      const b = now('blurb')[0], into = now('into')[0] || [];
      p.innerHTML = (b ? b.text + ' ' : '') + (into.length ? `<span class="tl-into"><b>Currently into:</b> ${join(into)}.</span>` : '');
    }
  }
  // fade out older news in What's New (it's still there, it's just... old)
  function fadeNews() {
    const ul = document.getElementById('news'); if (!ul) return;
    const n = dayNo(today().key);
    ul.querySelectorAll('li').forEach(li => {
      const b = li.querySelector('b'); const m = b && /^(\d\d)\/(\d\d)\/99$/.exec(b.textContent.trim()); if (!m) return;
      const ago = n - dayNo(m[2] + '-' + m[1]);
      li.classList.toggle('tl-old', ago > 30); li.classList.toggle('tl-ancient', ago > 90);
    });
  }
  function boot() {
    render(true); fadeNews();
    const ul = document.getElementById('news');
    if (ul && window.MutationObserver) new MutationObserver(fadeNews).observe(ul, { childList: true });
    setInterval(() => render(false), 30000); // ticks over at midnight
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();

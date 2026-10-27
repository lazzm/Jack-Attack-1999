/* seasons-web: the PC and the fake Web dress up for the time of year (lazy: seasons.js loads it when a season is on).
 * The seasons and their lead-up/peak/tail come from Seasons.season() (seasons.js, which follows ?date99, the owner's
 * clock and the real date). seasons.js puts html.ssw-<season> / .ssw-l1..3 / .ssw-lead|peak|tail / .ssw-night on the page
 * and loads css/seasons-web.css; this file adds the bits that need markup:
 *  - JACK ATTACK! (www.jackattack.jnet): masthead scenery and animated pixel sprites, a hat on the logo, a seasonal
 *    marquee with a countdown, a "special" news box, a dressed-up hit counter, 88x31 buttons, the letters page and forums
 *  - lighter touches on popular sites (search engines get a "holiday logo", JSN, Pixel Post, Dave's page, Homepagez)
 *  - JackOS: decorated desktop icons, a tray icon with the countdown, a suggested Plus! Seasons desktop theme, the
 *    FunCursor seasonal trail, a seasonal start-up chime, desktop bats in Halloween week, the Haunted Hill screen saver.
 * Everything animated is CSS (steps() sprite sheets and transforms), paused by the house when nobody is at the PC
 * (html.hs-screen-idle) and by the browser when the tab is hidden. SeasonsWeb.set(Seasons.season()) re-dresses. */
(function () {
  'use strict';
  const SS = window.Seasons; if (!SS || !window.Apps || window.SeasonsWeb) return;
  const A = Apps, $ = id => document.getElementById(id), esc = A.esc, store = A.store, html = document.documentElement;
  const h = (tag, cls, inner) => { const e = document.createElement(tag); if (cls) e.className = cls; if (inner != null) e.innerHTML = inner; return e; };
  const YEAR = new Date().getFullYear();
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 'S'}`;
  let ART = null, state = null, mounted = [], bound = false;

  // ================================================================ the seasons: words and pictures
  // ban: [sprite, animation ('fly' | 'bob' | 'burst' | ''), css position, scale, delay seconds]
  const SEA = {
    halloween: {
      name: 'Halloween', day: 'HALLOWEEN', theme: 'spooky', themeName: 'Spooky Halloween', logo: 'witchhat', ico: 'pumpkinS', tray: 'pumpkinS', snd: 'halloween', cur: 'pumpkinS',
      ban: [['bat', 'fly', 'top:12px', 2, 0], ['bat', 'fly', 'top:40px', 2, -6.5], ['bat', 'fly', 'top:24px', 1, -12], ['ghost', 'bob', 'right:456px;bottom:22px', 2, 0], ['pumpkin', 'flick', 'right:336px;bottom:0', 2, 0], ['pumpkin', 'flick', 'right:590px;bottom:2px', 2, -0.7], ['spider', 'dangle', 'left:40%;top:0', 2, 0]],
      strip: s => s.phase === 'peak' ? ['HAPPY HALLOWEEN!!!', 'TRICK OR TREAT?', 'ONLY KNOCK WHERE THERE\'S A PUMPKIN OUT', 'THE CLOCKS WENT BACK LAST NIGHT: IT\'S DARK BY HALF FOUR', 'THIS PAGE IS HAUNTED (A BIT)']
        : s.phase === 'tail' ? ['HALLOWEEN IS OVER (SOB)', 'SWEETS COUNTED: 47', 'BONFIRE NIGHT IS ON FRIDAY!!!']
          : [plural(s.left, 'DAY') + ' TO HALLOWEEN!!!', 'SPOOKY SEASON ON JACK ATTACK!', 'WHAT ARE YOU GOING AS?', 'THIS PAGE IS HAUNTED (A BIT)', 'BEWARE OF THE BATS'],
      news: s => s.phase === 'peak' ? { t: 'HAPPY HALLOWEEN!!!', p: 'It\'s HALLOWEEN! And it\'s a Sunday, so no school tomorrow worries until tomorrow. The clocks went back last night, so it gets dark at half four and trick-or-treating starts as soon as it\'s dark. Mom says back by seven. Dad says leave him some sweets.', li: ['My costume: a Space Cadet. Again. (Third year running. It still fits. Just.)', 'Dave is going as a bin bag. It is a bin bag.', 'The rule: only knock where there\'s a pumpkin out. No pumpkin, no knock.', 'Crystal\'s witch hat has glitter on it. The glitter is now on everything.'] }
        : s.phase === 'tail' ? { t: 'THE MORNING AFTER HALLOWEEN', p: 'The pumpkin has gone soft and smells a bit. I got 47 sweets. Crystal got 62 (she did the big houses at the end of the road). It\'s not a competition. (It is.)', li: ['Best sweets: the fizzy ones. Worst: an apple. An actual apple.', 'BONFIRE NIGHT is on Friday! Dad has already bought the box of fireworks.'] }
          : { t: s.lvl >= 2 ? `${plural(s.left, 'DAY')} TO HALLOWEEN!!!` : 'SPOOKY SEASON IS HERE!!!', p: 'JACK ATTACK! has gone SPOOKY for Halloween week! Mom has bought a pumpkin (it\'s on the kitchen table and it is MASSIVE). Crystal wants to go trick-or-treating as a witch. I\'m going as a Space Cadet. Again.', li: ['Pumpkin carving: Saturday. Dad is in charge of the knife. I\'m in charge of the face.', 'Wednesday\'s Hangout Theme Night is a spooky one. Come in costume (well, your Hangout person can).', 'Halloween is on a SUNDAY this year, and the clocks go back that night. An extra hour of Halloween!', 'Try the new Spooky Halloween desktop theme: Start, Programs, Accessories, Desktop Themes.'] },
      badges: [['HAPPY', 'HALLOWEEN', 'pumpkinS', 'linear-gradient(#2a0a40,#000)', '#ff9a2a'], ['SPOOKY', 'SITE 99!', 'ghost', 'linear-gradient(#ff8a00,#c84800)', '#1a001a']],
      gb: ['pumpkinS', 'bat'], forum: 'SPOOKY SEASON on the Forums: what are you going as? Post your costume in Off Topic. (Best one gets a mention in the mag!)',
      site: { search: 'Happy Halloween!', jsn: '<b>JSN Halloween:</b> costume ideas, pumpkin carving tips and the Spooky Hangout. Be safe: go round with a grown-up!', pp: '<b>SPOOKY SAVINGS!</b> Scary games are on the shelf. Order by Thursday for delivery before the weekend!', dave: 'HAPPY HALLOWEEN FROM DAVE!!! IM GOING AS A BIN BAG!!! (BOO)' },
    },
    bonfire: {
      name: 'Bonfire Night', day: 'BONFIRE NIGHT', theme: 'bonfire', themeName: 'Bonfire Night', logo: '', ico: 'sparkler', tray: 'bonfire', snd: 'bonfire', cur: 'sparkler',
      ban: [['bonfire', 'sheet', 'right:400px;bottom:0', 4, 0], ['fwPink', 'burst', 'right:190px;top:2px', 4, 0], ['fwGold', 'burst', 'right:560px;top:4px', 3, -1.1], ['fwCyan', 'burst', 'right:48%;top:2px', 3, -2.2], ['fwGreen', 'burst', 'right:300px;top:10px', 2, -0.6], ['rocket', 'rise', 'right:660px;bottom:0', 2, 0]],
      strip: s => s.phase === 'peak' ? ['REMEMBER, REMEMBER, THE FIFTH OF NOVEMBER', 'IT\'S BONFIRE NIGHT!!!', 'KEEP YOUR PETS INDOORS', 'NEVER GO BACK TO A LIT FIREWORK']
        : s.phase === 'tail' ? ['STILL GOT TWO ROCKETS LEFT', 'THE GARDEN SMELLS OF SMOKE', 'FIREWORKS DONE SAFELY: 6 OUT OF 6']
          : [plural(s.left, 'DAY') + ' TO BONFIRE NIGHT!!!', 'REMEMBER, REMEMBER...', 'READ THE FIREWORK CODE', 'SPARKLERS: WEAR GLOVES'],
      news: s => s.phase === 'peak' ? { t: 'IT\'S BONFIRE NIGHT!!!', p: 'Remember, remember, the fifth of November! It\'s a Friday too. Tonight: jacket potatoes, sparklers and Dad\'s back-garden display (all six fireworks). Spike the Stegosaur 2 is out today as well. Dad says fireworks FIRST.', li: ['Light at arm\'s length. Stand well back. NEVER go back to a lit firework.', 'Sparklers: gloves on, hold it at arm\'s length, and put it in the bucket of water when it\'s done (they stay hot!).', 'Gubbinz is staying indoors under the desk with the radio on.'] }
        : s.phase === 'tail' ? { t: 'THE AFTERNOON AFTER', p: 'Dad\'s display was BRILLIANT (five out of six went up; one just fizzed). We\'ve still got two rockets left. Dad\'s saving them for Saturday night.', li: ['Sparkler writing: I managed JACK and half of ATTACK.', 'Mom says the toffee apple stuck her teeth together for a whole hour.'] }
          : { t: s.left <= 2 ? `${plural(s.left, 'DAY')} TO BONFIRE NIGHT!!!` : 'REMEMBER, REMEMBER...', p: 'Bonfire Night is on Friday! Dad has bought a box of fireworks (the family one, not the big one) and has read the Firework Code out loud THREE times. He keeps the box in a tin in the garage.', li: ['The Firework Code: a grown-up lights them, one at a time, at arm\'s length. Everyone else stands well back.', 'Keep your pets in! Bangs are scary for them.', 'Bonfire Night is about Guy Fawkes and the Gunpowder Plot of 1605 (we did it in History).'] },
      badges: [['REMEMBER', 'REMEMBER!', 'fwGold', 'linear-gradient(#141428,#000)', '#ffd400'], ['FIREWORK', 'CODE OK', 'sparkler', 'linear-gradient(#c84800,#6a2400)', '#fff']],
      gb: ['bonfire', 'sparkler'], forum: 'BONFIRE NIGHT on the Forums: did your display go off? Tell everyone your best sparkler writing. (Safely!)',
      site: { search: 'Remember, remember!', jsn: '<b>JSN Bonfire Night:</b> the Firework Code, find a display near you and keep your pets safe.', pp: '<b>BONFIRE NIGHT:</b> sorry, we don\'t sell fireworks! But we do sell games you can play indoors while it\'s noisy.', dave: 'REMEMBER REMEMBER THE 5TH OF NOVEMBER!!! MY DAD SAYS IM NOT ALLOWED TO HOLD THE ROCKETS' },
    },
    xmas: {
      name: 'Christmas', day: 'CHRISTMAS', theme: 'winter', themeName: 'Winter Wonderland', logo: 'santahat', ico: 'holly', tray: 'tree', snd: 'xmas', cur: 'snowflake',
      ban: [['snowman', '', 'right:150px;bottom:2px', 3, 0], ['tree', 'sheet', 'right:690px;bottom:4px', 3, 0], ['present', '', 'right:676px;bottom:2px', 2, 0], ['present', '', 'right:736px;bottom:2px', 2, 0]],
      fall: 'snow',
      strip: s => s.phase === 'peak' ? ['MERRY CHRISTMAS!!!', 'HAPPY CHRISTMAS FROM JACK, GUBBINZ AND THE BLOBBITS', 'PRESENTS OPENED AT 6:42AM', 'DINNER AT TWO']
        : s.phase === 'tail' ? ['IT\'S BOXING DAY', 'TURKEY SANDWICHES FOR EVER', 'THE MILLENNIUM IS NEARLY HERE!']
          : [s.left === 1 ? 'IT\'S CHRISTMAS EVE!!!' : plural(s.left, 'SLEEP') + ' TILL CHRISTMAS!!!', 'THE JACK ATTACK! CHRISTMAS SPECIAL', 'HAVE YOU WRITTEN YOUR LIST?', 'DON\'T SHAKE THE PRESENTS (MOM IS WATCHING)'],
      news: s => s.phase === 'peak' ? { t: 'MERRY CHRISTMAS!!!', p: 'Happy Christmas from me, Gubbinz and the Blobbits! Presents were opened at 6:42am (Mom said not before seven, Crystal did not listen). Dinner is at two, then the big film, then Gran falls asleep.', li: ['Nan\'s present: socks. It is always socks. I love them really.', 'The cracker joke: what do you call a deer with no eyes? No idea. (Dad laughed for five minutes.)'] }
        : s.phase === 'tail' ? { t: 'BOXING DAY', p: 'Turkey sandwiches. Leftover crackers. The cousins are coming round and they WILL want a go on everything. Only six days left of the 1900s!', li: ['Christmas telly: watched it all. Twice.'] }
          : s.left === 1 ? { t: 'IT\'S CHRISTMAS EVE!!!', p: 'Stocking is up. A mince pie and a drink are out for Father Christmas and a carrot for the reindeer. Mom says bed by ten or he won\'t come. (I\'m sixteen. I\'m still going to bed by ten.)', li: ['Last present wrapped: 11:04pm. Not by me.'] }
            : { t: s.lvl >= 2 ? `${plural(s.left, 'SLEEP')} TILL CHRISTMAS!!!` : 'IT\'S DECEMBER!!!', p: s.lvl >= 2 ? 'The tree is up! Dad untangled the lights for an HOUR and then one bulb didn\'t work, so none of them worked. School breaks up on Friday 17th. My Christmas list is on version nine.' : 'It\'s December, so it\'s officially CHRISTMAS on JACK ATTACK! Advent calendar door 1 was a chocolate bell. The tree comes down from the loft in a couple of weeks (Dad will moan about the fibreglass).', li: ['My list so far: a Daydream, a Rumble Pouch, Kart Kaos 64 and a new Rubrick\'s cube (mine squeaks).', 'Pixel Post says order by Monday 20th to get it before Christmas!', 'Try the Winter Wonderland desktop theme in Desktop Themes!'] },
      badges: [['MERRY', 'CHRISTMAS', 'tree', 'linear-gradient(#c8102e,#7a0010)', '#fff'], ['SNOW', 'ZONE 99', 'snowflake', 'linear-gradient(#1c3c70,#0a1a40)', '#fff']],
      gb: ['holly', 'present'], forum: 'THE CHRISTMAS LIST THREAD is up in Off Topic. What are you hoping for? (No peeking at your presents.)',
      site: { search: 'Season\'s Greetings!', jsn: '<b>JSN Christmas:</b> gift ideas, last posting dates and the Christmas telly guide.', pp: '<b>CHRISTMAS ORDERS:</b> order by Monday 20th December for delivery before Christmas Day! Gift wrap FREE.', dave: 'MERRY XMAS FROM DAVE!!! I KNOW WHAT IM GETTING (I LOOKED)' },
    },
    millennium: {
      name: 'the Millennium', day: 'THE YEAR 2000', theme: '', themeName: 'Millennium', logo: 'partyhat', ico: 'clock', tray: 'clock', snd: 'millennium', cur: 'clock',
      ban: [['fwGold', 'burst', 'right:170px;top:2px', 4, 0], ['fwPink', 'burst', 'right:560px;top:6px', 3, -1.4], ['fwCyan', 'burst', 'right:44%;top:2px', 3, -2.6], ['bug', 'crawl', 'right:30%;bottom:2px', 2, 0]],
      fall: 'confetti',
      strip: s => [plural(s.left, 'DAY') + ' LEFT OF THE 1900s!!!', 'IS YOUR PC Y2K READY?', 'BACK UP YOUR SAVES ONTO FLOPPIES', 'PARTY AT DAVE\'S ON THE 31ST'],
      news: s => ({ t: s.left <= 1 ? 'THE LAST NIGHT OF THE 1900s!!!' : `THE MILLENNIUM: ${plural(s.left, 'DAY')} TO GO!!!`, p: 'The year 2000 is nearly here. Will the Millennium Bug make all the computers think it\'s 1900? Dad thinks it might, so he\'s going to fill the bath "just in case". Mom has bought 40 tins of beans.', li: ['My Y2K plan: back up every save onto floppies. ALL of them.', 'Party at Dave\'s on the 31st. Luke wants to be racing at the exact second it turns midnight.', 'Callum is unplugging his PC at 11:58. He\'s putting a tea towel over it.'] }),
      badges: [['Y2K', 'COUNTDOWN!', 'clock', 'linear-gradient(#1a1a5a,#000)', '#ffd400'], ['BUG', 'FREE (?)', 'bug', 'linear-gradient(#2a6a12,#0a3a04)', '#fff']],
      gb: ['clock', 'partyhat'], forum: 'MILLENNIUM COUNTDOWN on the Forums: where will you be at midnight? Will your PC survive? Discuss!',
      site: { search: 'Countdown to 2000!', jsn: '<b>JSN Millennium:</b> Y2K tips, party ideas and where it\'s already the year 2000.', pp: '<b>MILLENNIUM SALE:</b> stock up on games before the year 2000 (in case the shops\' computers go funny).', dave: 'PARTY AT MINE ON THE 31ST!!! BRING CRISPS!!! AND A CONTROLLER!!!' },
    },
    newyear: {
      name: 'New Year', day: 'NEW YEAR', theme: '', themeName: 'Millennium', logo: 'partyhat', ico: 'partyhat', tray: 'partyhat', snd: 'millennium', cur: 'partyhat',
      ban: [['fwGold', 'burst', 'right:170px;top:4px', 3, 0], ['fwCyan', 'burst', 'right:420px;top:6px', 3, -1.5], ['fwPink', 'burst', 'right:46%;top:2px', 3, -2.4]],
      fall: 'confetti',
      strip: s => ['HAPPY NEW YEAR!!!', 'WELCOME TO 1999', 'IT FEELS LIKE WE\'VE DONE THIS BEFORE...', 'NEW YEAR\'S RESOLUTION: UPDATE THIS SITE MORE'],
      news: s => ({ t: s.phase === 'peak' ? 'HAPPY NEW YEAR!!!' : 'HAPPY NEW YEAR (STILL)', p: 'It\'s 1999! The LAST year of the 1900s. My resolutions: finish Kazoo of Time, beat Luke at Kart Kaos 64 (once) and keep this site updated. Weird thing: I think I\'ve written these before.', li: ['Twelfth Night is the 6th: the decorations have to come down, or it\'s bad luck (says Gran).', 'The Christmas tree is shedding. Mom is hoovering every hour.'] }),
      badges: [['HAPPY', 'NEW YEAR!', 'partyhat', 'linear-gradient(#1a1a5a,#000)', '#ffd400'], ['1999', 'IS HERE', 'clock', 'linear-gradient(#c8a000,#6a4a00)', '#fff']],
      gb: ['partyhat', 'confetti'], forum: 'NEW YEAR on the Forums: post your resolutions! (We\'ll check on them in December.)',
      site: { search: 'Happy New Year!', jsn: '<b>JSN New Year:</b> resolutions, the January sales and the year ahead.', pp: '<b>JANUARY SALE!</b> Everything in the bargain bin must go!', dave: 'HAPPY NEW YEAR!!! RESOLUTION: GET A FOURTH CONTROLLER' },
    },
    valentine: {
      name: 'Valentine\'s Day', day: 'VALENTINE\'S DAY', theme: 'valentine', themeName: 'Be My Valentine', logo: 'arrowheart', ico: 'heart', tray: 'heart', snd: 'valentine', cur: 'heart',
      ban: [['heart', 'bob', 'right:170px;bottom:14px', 4, 0], ['heartP', 'bob', 'right:300px;bottom:40px', 3, -1], ['heart', 'bob', 'right:430px;bottom:10px', 2, -0.5], ['heartP', 'bob', 'right:46%;bottom:30px', 2, -1.6]],
      fall: 'hearts',
      strip: s => s.phase === 'peak' ? ['HAPPY VALENTINE\'S DAY', 'GOT ONE CARD (IT\'S FROM NAN)', 'ROSES ARE RED, VIOLETS ARE BLUE...'] : [plural(s.left, 'DAY') + ' TO VALENTINE\'S DAY', 'HAVE YOU SENT A CARD?', 'NOT THAT I CARE'],
      news: s => s.phase === 'peak' ? { t: 'HAPPY VALENTINE\'S DAY', p: 'I got ONE card. It\'s from Nan. Still counts. Dad bought Mom flowers from the garage AGAIN, and she pretended to be surprised AGAIN.', li: ['Crystal made a card for everyone in her class. Even the boys. Even the one who eats glue.'] }
        : { t: 'VALENTINE\'S DAY IS COMING', p: 'Valentine\'s Day is on Sunday. I am not sending any cards. (I might send one.) Crystal is making cards for her whole class and there is glitter in the carpet.', li: ['Pancake Day is on Tuesday! Mind the ceiling.'] },
      badges: [['BE MY', 'VALENTINE', 'heart', 'linear-gradient(#ff4a9a,#c0005a)', '#fff'], ['LOVE', 'BUG 99', 'heartP', 'linear-gradient(#80003a,#400018)', '#ffd6e6']],
      gb: ['heart', 'heartP'], forum: 'VALENTINE\'S on the Forums: send an anonymous "I like your website" message. Keep it nice!',
      site: { search: 'Happy Valentine\'s Day!', jsn: '<b>JSN Valentine\'s:</b> e-cards, poems and a horoscope special.', pp: '<b>VALENTINE\'S:</b> games for two players! (Two controllers not included.)', dave: 'ROSES R RED VIOLETS R BLUE I DIDNT GET ANY CARDS DID YOU' },
    },
    easter: {
      name: 'Easter', day: 'EASTER', theme: 'spring', themeName: 'Spring Has Sprung', logo: 'bunnyears', ico: 'eggA', tray: 'eggB', snd: '', cur: 'chick',
      ban: [['chick', 'sheet', 'right:300px;bottom:4px', 2, 0], ['chick', 'sheet', 'right:350px;bottom:2px', 2, -0.3], ['eggA', '', 'right:470px;bottom:2px', 2, 0], ['eggB', '', 'right:500px;bottom:6px', 2, 0], ['eggC', '', 'right:200px;bottom:2px', 2, 0]],
      strip: s => s.phase === 'peak' ? ['HAPPY EASTER!!!', 'EGG HUNT IN THE GARDEN AT TEN', 'CHOCOLATE FOR BREAKFAST (MOM SAID JUST THIS ONCE)'] : s.phase === 'tail' ? ['EASTER EGGS EATEN: ALL OF THEM', 'BACK TO SCHOOL SOON (BOO)'] : [plural(s.left, 'DAY') + ' TO EASTER!!!', 'IT\'S THE EASTER HOLIDAYS', 'HOT CROSS BUNS ON FRIDAY'],
      news: s => s.phase === 'peak' ? { t: 'HAPPY EASTER!!!', p: 'Easter Sunday! Dad has hidden twelve eggs in the garden. Crystal has already found nine. Gran and Grandad are coming for a roast.', li: ['Mom has hidden eggs on the computer too. Look carefully!'] }
        : { t: 'THE EASTER HOLIDAYS!!!', p: 'Two weeks off school! The clocks went forward on the 28th (I lost an hour of sleep and Dad changed every clock in the house except the oven). Good Friday is the 2nd: hot cross buns!', li: ['Easter egg count so far: three. Target: eleven.', 'Try the Spring Has Sprung desktop theme!'] },
      badges: [['HAPPY', 'EASTER!', 'eggA', 'linear-gradient(#7ac03a,#3a8a1a)', '#fff'], ['EGG', 'HUNTER', 'chick', 'linear-gradient(#ffe24a,#e0a000)', '#4a2a00']],
      gb: ['eggA', 'chick'], forum: 'EASTER on the Forums: how many eggs did you get? Any good cheats for the holidays?',
      site: { search: 'Happy Easter!', jsn: '<b>JSN Easter:</b> things to do in the holidays and an egg-decorating competition.', pp: '<b>EASTER HOLIDAYS:</b> two weeks of gaming! New games in this week.', dave: 'HAPPY EASTER!!! I ATE ALL MY EGGS BEFORE BREAKFAST' },
    },
    summer: {
      name: 'the summer holidays', day: 'SUMMER', theme: 'summer', themeName: 'Summer Holidays', logo: '', ico: 'sun', tray: 'sun', snd: '', cur: 'lolly',
      ban: [['beachball', 'bounce', 'right:340px;bottom:6px', 3, 0], ['bucket', '', 'right:560px;bottom:2px', 2, 0]],
      strip: s => ['SCHOOL\'S OUT FOR SUMMER!!!', 'SIX WEEKS OF NO SCHOOL', 'THE ICE-CREAM VAN PLAYS GREENSLEEVES WHEN IT\'S RUN OUT', 'SUN CREAM ON (MOM\'S ORDERS)'],
      news: s => ({ t: 'THE SUMMER HOLIDAYS!!!', p: 'Six weeks off school! The plan: beat everything, paint loads of minis, a Kart Kaos tournament at Luke\'s and go outside "sometimes" (Mom\'s rule, not mine).', li: ['Ice-cream van count this week: 4. Ice creams bought: 4.', 'The paddling pool is up for Crystal. Dad fell in it. On purpose, he says.', 'Try the Summer Holidays desktop theme!'] }),
      badges: [['SUMMER', 'HOLS 99', 'sun', 'linear-gradient(#2ab8e8,#0a5a9a)', '#fff'], ['SUN CREAM', 'ON!', 'lolly', 'linear-gradient(#ffe8a8,#e0b860)', '#4a2a00']],
      gb: ['sun', 'beachball'], forum: 'SUMMER HOLIDAYS on the Forums: what are you playing? Tournament sign-ups in Video Games!',
      site: { search: 'Happy holidays!', jsn: '<b>JSN Summer:</b> days out, rainy-day ideas and the holiday telly guide.', pp: '<b>SUMMER SALE!</b> Six weeks to fill: pick up a bargain.', dave: 'SCHOOLS OUT!!! SIX WEEKS OF WRESTLING!!!' },
    },
    eclipse: {
      name: 'the eclipse', day: 'THE ECLIPSE', theme: 'eclipse', themeName: 'Total Eclipse', logo: '', ico: 'eclipse', tray: 'eclipse', snd: '', cur: 'eclipse',
      ban: [],
      strip: s => s.phase === 'peak' ? ['TODAY: THE ECLIPSE!!!', 'MAXIMUM AT ABOUT TEN PAST ELEVEN', 'NEVER LOOK AT THE SUN', 'USE A PINHOLE VIEWER OR PROPER ECLIPSE VIEWERS'] : s.phase === 'tail' ? ['IT WAS CLOUDY (OF COURSE)', 'IT STILL WENT DARK THOUGH!', 'NEXT ONE IN BRITAIN: 2090'] : [plural(s.left, 'DAY') + ' TO THE ECLIPSE!!!', 'DON\'T LOOK AT THE SUN!!!', 'MAKE A PINHOLE VIEWER OUT OF A CEREAL BOX'],
      news: s => s.phase === 'peak' ? { t: 'TODAY: THE TOTAL ECLIPSE!!!', p: 'This morning the Moon goes right in front of the Sun! Only the far south-west gets the whole thing, but we get a massive bite out of it at about ten past eleven. It goes dim and cold and the birds go quiet.', li: ['DON\'T LOOK AT IT. Not even with sunglasses. Not even for a second.', 'I made a pinhole viewer out of a cereal box, foil and a pin. You look at the white card, not the Sun.'] }
        : s.phase === 'tail' ? { t: 'WE SAW (MOST OF) THE ECLIPSE', p: 'It was cloudy. Of course it was cloudy. But it STILL went dark and cold at eleven o\'clock in the morning, and the birds stopped singing. Spooky. The next total eclipse in Britain is in 2090.', li: ['My pinhole viewer showed a tiny crescent Sun on the card!'] }
          : { t: 'THE ECLIPSE IS COMING!!!', p: 'On Wednesday morning the Moon goes in front of the Sun: the first total eclipse in Britain since 1927! Everyone\'s talking about it. Mom has bought a pack of eclipse viewers.', li: ['NEVER look straight at the Sun. Use proper eclipse viewers or a pinhole viewer.', 'Try the Total Eclipse desktop theme. (Much safer than looking up.)'] },
      badges: [['ECLIPSE', '11.08.99', 'eclipse', 'linear-gradient(#202040,#000)', '#ffe9a0'], ['DON\'T', 'LOOK UP!', 'sun', 'linear-gradient(#e10600,#7a0000)', '#fff']],
      gb: ['eclipse', 'sun'], forum: 'THE ECLIPSE on the Forums: was it cloudy where you are? (Don\'t say where. Just say if it was cloudy.)',
      site: { search: 'Eclipse day!', jsn: '<b>JSN Eclipse:</b> how to watch safely, and live pictures on the telly.', pp: '<b>ECLIPSE SPECIAL:</b> space games for space fans.', dave: 'THE ECLIPSE IS WEDNESDAY!!! I MADE A PINHOLE VIEWER OUT OF A CRISP TUBE' },
    },
    backtoschool: {
      name: 'back to school', day: 'BACK TO SCHOOL', theme: '', themeName: '', logo: '', ico: 'apple', tray: 'apple', snd: '', cur: 'pencil',
      ban: [['satchel', '', 'right:150px;bottom:6px', 3, 0], ['apple', '', 'right:240px;bottom:10px', 2, 0], ['pencil', '', 'right:320px;bottom:12px', 2, 0]],
      strip: s => s.phase === 'peak' ? ['FIRST DAY BACK', 'NEW SHOES (THEY PINCH)', 'SAME OLD MATHS TEACHER'] : s.phase === 'tail' ? ['SURVIVED THE FIRST WEEK', 'HOMEWORK ALREADY. IN THE FIRST WEEK.'] : [plural(s.left, 'DAY') + ' OF THE HOLIDAYS LEFT :(', 'BACK TO SCHOOL', 'HAVE YOU DONE YOUR HOLIDAY HOMEWORK?'],
      news: s => s.phase === 'tail' ? { t: 'SURVIVED THE FIRST WEEK', p: 'Homework already. In the FIRST WEEK. Anyway, the mag will still be updated every day. Mostly in the evenings now.', li: ['New timetable: double science on Monday mornings. Help.'] }
        : { t: s.phase === 'peak' ? 'FIRST DAY BACK' : 'BACK TO SCHOOL :(', p: 'The summer holidays are over. New pencil case, new shoes (they pinch), new ruler, same old maths teacher. Mom says I have to be in bed by ten on school nights.', li: ['JACK ATTACK! will still be updated every day. Just later.', 'Holiday homework: done. (Last night. All of it.)'] },
      badges: [['BACK TO', 'SCHOOL :(', 'apple', 'linear-gradient(#1e4a2a,#0a2a14)', '#fff'], ['HOMEWORK', 'DONE (?)', 'pencil', 'linear-gradient(#fff,#d8d8d8)', '#000']],
      gb: ['apple', 'pencil'], forum: 'BACK TO SCHOOL on the Forums: homework help in Off Topic. (We will not do it for you.)',
      site: { search: 'Back to school!', jsn: '<b>JSN Back to School:</b> homework help, timetables and the new term.', pp: '<b>BACK TO SCHOOL:</b> games for after your homework. (After.)', dave: 'BACK TO SCHOOL!!! THE WRESTLING WILL CONTINUE AT WEEKENDS' },
    },
  };

  // ================================================================ helpers
  const sprite = (name, scale, cls, extra) => {
    const s = ART.sheet(name); if (!s) return null;
    const e = h('i', 'ssw-spr' + (cls ? ' ' + cls : '')); e.setAttribute('aria-hidden', 'true');
    const k = scale || 1;
    e.style.cssText = `width:${s.w * k}px;height:${s.h * k}px;background-image:${s.url};background-size:${s.w * s.n * k}px ${s.h * k}px;--sw:${s.w * s.n * k}px;--fwf:${s.w * k}px;--n:${s.n}` + (extra ? ';' + extra : '');
    return e;
  };
  const mount = (el, parent, how) => { if (!parent) return null; if (how === 'prepend') parent.prepend(el); else if (how === 'after') parent.after(el); else if (how === 'before') parent.before(el); else parent.appendChild(el); mounted.push(el); return el; };
  const dirt = () => { mounted.forEach(e => { if (e._off) e._off(); e.remove(); }); mounted = []; document.querySelectorAll('.ssw-mark').forEach(e => e.classList.remove('ssw-mark')); };
  const resting = () => document.hidden || html.classList.contains('hs-screen-idle');
  const main = () => state && state.main;
  const conf = () => main() && SEA[main().key];

  // ================================================================ JACK ATTACK!: the masthead
  function dressBanner(s, c) {
    const ban = document.querySelector('#browser .disc-banner'); if (!ban) return;
    const lay = h('div', 'ssw-ban'); lay.setAttribute('aria-hidden', 'true');
    if (c.fall) lay.appendChild(h('div', 'ssw-fall ssw-fall-' + c.fall));
    // the scenery and the sprites live in the "sky": the part of the banner above the headline ticker and the live bar
    const sky = h('div', 'ssw-sky'); sky.appendChild(h('div', 'ssw-scene')); lay.appendChild(sky);
    const fit = () => { const hl = ban.querySelector('.headlines') || ban.querySelector('.livebar'); sky.style.height = (hl && hl.offsetTop > 40 ? hl.offsetTop - 2 : ban.clientHeight) + 'px'; };
    c.ban.forEach(([n, anim, pos, sc, delay], i) => {
      const sp = sprite(n, sc, anim === 'sheet' || anim === 'flick' ? 'ssw-anim' : anim === 'burst' ? 'ssw-burst' : '', ''); if (!sp) return;
      if (anim === 'flick') sp.classList.add('ssw-flick');
      if (anim === 'fly') { const tr = h('div', 'ssw-track'); tr.style.cssText = pos + `;animation-delay:${delay}s`; tr.appendChild(sp); sky.appendChild(tr); return; }
      const w = h('div', 'ssw-at' + (anim && !/^(sheet|flick|burst)$/.test(anim) ? ' ssw-' + anim : '')); w.style.cssText = pos + `;animation-delay:${delay}s`;
      if (anim === 'burst') sp.style.animationDelay = delay + 's';
      if (anim === 'dangle') w.appendChild(h('span', 'ssw-thread'));
      w.appendChild(sp); sky.appendChild(w);
    });
    mount(lay, ban, 'prepend'); fit();
    if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(ban); lay._off = () => ro.disconnect(); }
    // a hat (or ears, or an arrow) on the logo, sized in em so it scales with the logo
    const logo = ban.querySelector('.logo');
    if (logo && c.logo) { const sh = ART.sheet(c.logo), d = h('span', 'ssw-logodec ssw-ld-' + c.logo); d.setAttribute('aria-hidden', 'true'); d.style.backgroundImage = sh.url; d.style.setProperty('--ar', (sh.h / sh.w).toFixed(3)); mount(d, logo); }
    // the marquee, with the countdown
    const words = c.strip(main()), strip = h('div', 'ssw-strip');
    const sep = ` <span class="ssw-sep">&#9733;</span> `;
    strip.innerHTML = `<marquee scrollamount="5" truespeed>${words.map(esc).join(sep)}${sep}${words.map(esc).join(sep)}</marquee>`;
    mount(strip, ban, 'after'); // a stripe right across the page, under the masthead
  }

  // ---- the home page: a seasonal special box, the hit counter and the 88x31 buttons
  function dressHome(s, c) {
    const home = $('s-home'); if (!home) return;
    if (!(main().key === 'millennium' && s.md === 1231)) { // 31/12 has its own Millennium Eve box (seasons.js)
      const n = c.news(main()), box = h('div', 'ssw-news');
      const head = h('div', 'ssw-nh');
      const a = sprite(c.gb[0], 2, ART.sheet(c.gb[0]).n > 1 ? 'ssw-anim' : ''), b = sprite(c.gb[1] || c.gb[0], 2, ART.sheet(c.gb[1] || c.gb[0]).n > 1 ? 'ssw-anim' : '');
      if (a) head.appendChild(a);
      head.appendChild(h('b', 'ssw-nt', esc(n.t)));
      if (b) head.appendChild(b);
      const m = main();
      if (m.peakMd && m.phase === 'lead') head.appendChild(h('span', 'ssw-cd', `<b>${m.left}</b>${m.left === 1 ? 'DAY' : 'DAYS'} TO GO`));
      else if (m.phase === 'peak') head.appendChild(h('span', 'ssw-cd ssw-today', '<b>!!!</b>TODAY'));
      box.appendChild(head);
      box.appendChild(h('div', 'ssw-nb', `<p>${esc(n.p)}</p>${n.li && n.li.length ? `<ul>${n.li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<p class="ssw-sig">&mdash; Jack</p>`));
      const lp = $('lastPost'); // at the very top of the home page, like the Millennium Eve note
      if (lp && lp.parentNode === home) mount(box, lp, 'after'); else mount(box, home, 'prepend');
    }
    // a second, smaller box when another season is on too (the Millennium countdown during Christmas week)
    const also = state.list[1];
    if (also && SEA[also.key] && also.key === 'millennium' && s.md !== 1231) {
      const ac = SEA[also.key], n2 = ac.news(also), b2 = h('div', 'ssw-news ssw-also ssw-c-' + also.key);
      b2.innerHTML = `<div class="ssw-nh"><b class="ssw-nt">${esc(n2.t)}</b></div><div class="ssw-nb"><p>${esc(n2.p)}</p></div>`;
      const first = home.querySelector('.ssw-news'); if (first) mount(b2, first, 'after');
    }
    // the hit counter gets dressed (a sprite either side)
    const rn = $('readerNo');
    if (rn && c.gb[0]) { const l = sprite(c.gb[0], 2, 'ssw-cntdec'), r = sprite(c.gb[1] || c.gb[0], 2, 'ssw-cntdec'); if (l) mount(l, rn, 'before'); if (r) mount(r, rn, 'after'); }
    // 88x31 buttons at the front of the footer row
    const row = document.querySelector('#browser .badges88');
    if (row) c.badges.slice().reverse().forEach(([b1, b2, ic, bg, fg]) => { const sh = ART.sheet(ic), e = h('span', 'b88 ic ssw-b88', `<b>${esc(b1)}</b>${esc(b2)}`); e.style.cssText = `--ic:${sh.still};background:${bg};color:${fg}`; mount(e, row, 'prepend'); });
  }

  // ---- the letters page (the guestbook) and the forums
  function garland(names) {
    const g = h('div', 'ssw-garland'); g.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i++) { const nm = names[i % names.length], sp = sprite(nm, 2, ART.sheet(nm).n > 1 ? 'ssw-anim' : ''); if (sp) { sp.style.animationDelay = (-i * 0.17) + 's'; g.appendChild(sp); } }
    return g;
  }
  function dressPages(s, c) {
    const gb = $('gbForm'); if (gb) { mount(garland(c.gb), gb, 'before'); gb.classList.add('ssw-gb', 'ssw-mark'); }
    const fv = $('forumView');
    if (fv) { const bar = h('div', 'ssw-forumbar'); const sp = sprite(c.gb[0], 2, ART.sheet(c.gb[0]).n > 1 ? 'ssw-anim' : ''); if (sp) bar.appendChild(sp); bar.appendChild(h('span', '', esc(c.forum))); mount(bar, fv, 'before'); }
  }

  // ================================================================ other sites: lighter touches (search engines stay calm: no animation)
  const SEARCH = { 'waaaghooo.find': '.wg-logo', 'jackgle.find': '.jg-logo', 'askgubbinz.find': '.ag-logo', 'jacksearch.find': '.gs-logo' };
  const TAGLINE = { 'waaaghooo.find': '.wg-tagl', 'jackgle.find': '.jg-n', 'askgubbinz.find': '.ag-tag', 'jacksearch.find': '.gs-tag' };
  function dressSite(detail) {
    const c = conf(); if (!c) return;
    const sec = $('s-secret'); if (!sec || sec.querySelector('.ssw-site')) return;
    const m = /^site:(?:www\.)?([^/]+)(\/.*)?$/.exec(detail || ''); if (!m) return;
    const host = m[1].toLowerCase(), path = m[2] || '/';
    const now = String(($('addrBar') || {}).value || '').toLowerCase().replace(/^\w+:\/\//, '').replace(/^www\./, '');
    if (now.split(/[/?#]/)[0] !== host) return; // the page has changed since (a later retry for an old page)
    const tag = el => { el.classList.add('ssw-site'); return el; };
    if (SEARCH[host] && (path === '/' || path === '')) { // a holiday logo: a little picture on the logo, a greeting by the tagline
      const logo = sec.querySelector(SEARCH[host]); if (!logo) return;
      const d = tag(h('span', 'ssw-doodle')); const sp = sprite(c.gb[0], 2, 'ssw-still'); if (sp) d.appendChild(sp);
      logo.classList.add('ssw-dlogo'); logo.appendChild(d); logo.title = c.site.search;
      const tl = sec.querySelector(TAGLINE[host]); if (tl) tl.appendChild(tag(h('span', 'ssw-cap', esc(c.site.search))));
      return;
    }
    if (host === 'jsn.jnet') {
      const top = sec.querySelector('.jp-top'); if (!top) return;
      const bar = tag(h('div', 'ssw-sitebar ssw-calm')); const sp = sprite(c.gb[0], 2, 'ssw-still'); if (sp) bar.appendChild(sp); bar.appendChild(h('span', '', c.site.jsn)); top.after(bar); return;
    }
    if (host === 'pixelpost.jnet') {
      const st = sec.querySelector('.ppo-strip') || sec.querySelector('.ppo-top'); if (!st) return;
      const bar = tag(h('div', 'ssw-sitebar ssw-pp'));
      const a = sprite(c.gb[0], 2, ART.sheet(c.gb[0]).n > 1 ? 'ssw-anim' : ''), b = sprite(c.gb[1] || c.gb[0], 2, ART.sheet(c.gb[1] || c.gb[0]).n > 1 ? 'ssw-anim' : '');
      if (a) bar.appendChild(a); bar.appendChild(h('span', '', c.site.pp)); if (b) bar.appendChild(b);
      st.after(bar); return;
    }
    if (host === 'davesplace.jnet') { // Dave goes completely over the top, obviously
      const pg = [...sec.children].find(e => !e.classList.contains('su-strip')) || sec;
      const box = tag(h('div', 'ssw-dave'));
      const row = () => { const r = h('div', 'ssw-daverow'); for (let i = 0; i < 7; i++) { const nm = c.gb[i % c.gb.length], sp = sprite(nm, 2, ART.sheet(nm).n > 1 ? 'ssw-anim' : ''); if (sp) { sp.style.animationDelay = (-i * 0.13) + 's'; r.appendChild(sp); } } return r; };
      box.appendChild(row()); box.appendChild(h('div', 'ssw-daveblink', esc(c.site.dave))); box.appendChild(row());
      pg.prepend(box); return;
    }
    if (/(^|\.)homepagez(\.webcom)?$/.test(host)) {
      const pg = [...sec.children].find(e => !e.classList.contains('su-strip')); if (!pg) return;
      const g = tag(garland(c.gb)); g.classList.add('ssw-hpz'); pg.prepend(g);
    }
  }

  // ================================================================ JackOS: desktop icons, tray, cursor, theme suggestion, bats, sounds, saver
  function dressDesktop(s, c) {
    const ico = ART.sheet(c.ico), ik = 20 / Math.max(ico.w, ico.h, 15);
    html.style.setProperty('--ssw-ico', ico.url); html.style.setProperty('--ssw-icow', Math.round(ico.w * ik) + 'px'); html.style.setProperty('--ssw-icoh', Math.round(ico.h * ik) + 'px');
    const cur = ART.sheet(c.cur || c.ico);
    // a seasonal pointer on the desktop itself on the big day (never inside web pages: serious sites stay calm)
    if (cur) html.style.setProperty('--ssw-cur', `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" shape-rendering="crispEdges"><path d="M1 1v15l4-4 3 7 3-1-3-7h6z" fill="#fff" stroke="#000"/>${cur.stillSvg.replace(/^<svg [^>]*>/, `<svg x="11" y="11" width="15" height="15" viewBox="0 0 ${cur.w} ${cur.h}" preserveAspectRatio="xMidYMax meet">`)}</svg>`)}") 1 1, default`);
    // a corner of the desktop gets dressed too (a cobweb, holly...), peeking out from behind the Channel bar
    const cs = { halloween: ['cobweb', 4], xmas: ['holly', 3], valentine: ['arrowheart', 3], easter: ['daffodil', 3], bonfire: ['sparkler', 3] }[main().key], desk = $('desktop');
    if (cs && desk) { const sp = sprite(cs[0], cs[1], 'ssw-deskdeco ssw-dd-' + cs[0]); if (sp) mount(sp, desk, 'append'); }
    const tray = $('tray'), clock = $('clock');
    if (tray && clock) {
      const t = h('span', 'ssw-tray'); t.setAttribute('role', 'button'); t.tabIndex = 0;
      const ts = ART.sheet(c.tray), sp = sprite(c.tray, Math.min(1, 16 / Math.max(ts.w, ts.h)), ts.n > 1 ? 'ssw-anim' : ''); if (sp) t.appendChild(sp);
      const m = main();
      t.title = m.phase === 'lead' && m.left ? `${m.left} day${m.left === 1 ? '' : 's'} to ${c.name}!` : m.phase === 'peak' ? `It's ${c.name}!` : c.name;
      const open = () => trayBox();
      t.addEventListener('click', open); t.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
      tray.insertBefore(t, clock); mounted.push(t);
    }
  }
  function trayBox() {
    const c = conf(), m = main(); if (!c) return;
    const when = m.phase === 'lead' && m.left ? `${m.left} day${m.left === 1 ? '' : 's'} to go until ${c.name}!` : m.phase === 'peak' ? `It's ${c.name} today!` : m.phase === 'tail' ? `${c.name.replace(/^the /, 'The ')} is over for another year. (It'll be back.)` : `It's ${c.name}!`;
    const btns = [['OK']];
    if (c.theme) btns.unshift(['Desktop Themes...', () => A.open('system.themes', c.theme)]);
    Desk.msgbox(c.name.replace(/^the /, 'The ').replace(/^./, x => x.toUpperCase()), `${when}\n\nJACK ATTACK! has dressed up for it, and so has the desktop.${c.themeName && c.theme ? `\n\nWant the whole desktop to match? Try the "${c.themeName}" theme in Desktop Themes.` : ''}`, 'info', btns);
  }
  function suggest() {
    const c = conf(), m = main(); if (!c || !m) return;
    const seen = store.get('jhp_ssw_seen', {}) || {}, k = m.key + '-' + YEAR;
    if (seen[k]) return;
    seen[k] = 1; store.set('jhp_ssw_seen', seen);
    SS.whenBooted(() => setTimeout(() => {
      const b = Desk.toast(`JACK ATTACK! has dressed up for ${c.name}!`, c.theme ? `Have a look at the magazine. Want the desktop to match? Click here to try the "${c.themeName}" desktop theme.` : 'Have a look at the magazine!', 9000);
      if (b && c.theme) b.addEventListener('click', () => A.open('system.themes', c.theme));
    }, 2500));
  }
  // Halloween week: now and then a few bats flap across the desktop (the 31st already has its own, more often: apps-fun.js)
  let batT = 0;
  function bats() {
    clearTimeout(batT);
    const m = main(); if (!m || m.key !== 'halloween' || m.phase !== 'lead') return;
    batT = setTimeout(() => {
      const busy = resting() || (window.Savers && Savers.running) || !SS.booted() || document.querySelector('.logon');
      if (!busy && A.cmds.bats && !SS.reduced()) A.cmds.bats();
      bats();
    }, (m.lvl >= 2 ? 150 : 300) * 1000 * (0.7 + Math.random() * 0.6));
  }
  const SAVER = 'Haunted Hill (Halloween)';
  function savers(s) {
    const on = s.list.some(x => x.key === 'halloween');
    if (!window.Savers || !Savers.add) return;
    if (on) { Savers.add(SAVER, (g, W, H, o) => ART.hauntedHill(g, W, H, o)); Savers.seasonDefault = SAVER; A.cmd(['hauntedhill', 'haunted hill', 'spooky.scr', 'halloween.scr'], () => setTimeout(() => Savers.start(SAVER), 250)); }
    else if (Savers.list().includes(SAVER)) Savers.remove(SAVER);
  }
  function sounds(c) {
    if (!window.Sound) return;
    const key = c && c.snd;
    Sound.variant = key ? n => ((n === 'startup' || n === 'shutdown') && Sound.has && Sound.has(n + '_' + key) ? n + '_' + key : null) : null;
  }

  // ================================================================ switching
  function apply() {
    dirt();
    ['--ssw-scene', '--ssw-spin', '--ssw-corner', '--ssw-cw', '--ssw-ico', '--ssw-cur'].forEach(k => html.style.removeProperty(k));
    const s = state, c = conf();
    clearTimeout(batT);
    if (!s || !c) { sounds(null); if (s) savers(s); return; }
    const m = main();
    html.style.setProperty('--ssw-scene', ART.scene(m.key) || 'none');
    const spin = { eclipse: 'eclipse', millennium: 'clock', xmas: 'snowflake', summer: 'sun', valentine: 'heart', easter: 'eggB' }[m.key];
    if (spin) html.style.setProperty('--ssw-spin', ART.sheet(spin).url);
    const corner = { halloween: ['cobweb', 110], xmas: ['holly', 64], valentine: ['arrowheart', 64], easter: ['daffodil', 40], newyear: ['confetti', 108], millennium: ['confetti', 108] }[m.key];
    if (corner) { html.style.setProperty('--ssw-corner', ART.sheet(corner[0]).url); html.style.setProperty('--ssw-cw', corner[1] + 'px'); }
    try { dressBanner(s, c); } catch (e) { console.error(e); }
    try { dressHome(s, c); } catch (e) { console.error(e); }
    try { dressPages(s, c); } catch (e) { console.error(e); }
    try { dressDesktop(s, c); } catch (e) { console.error(e); }
    if (window.IE && IE.current === 'secret') { const a = $('addrBar'); if (a) dressSite('site:' + String(a.value).replace(/^\w+:\/\//, '')); }
    sounds(c); savers(s); bats(); suggest();
  }
  function bind() {
    if (bound) return; bound = true;
    document.addEventListener('section', ev => { const d = String(ev.detail || ''); if (/^site:/.test(d)) [40, 400, 1200, 2500].forEach(ms => setTimeout(() => { try { if (IE.current === 'secret') dressSite(d); } catch (e) { console.error(e); } }, ms)); /* some sites draw themselves a moment later */ });
  }
  let trailCache = null;
  window.SeasonsWeb = {
    set(s) {
      state = s;
      const go = () => { bind(); trailCache = null; apply(); };
      if (ART) go(); else A.load('js/seasons-art.js').then(() => { ART = window.SeasonsArt; go(); }).catch(e => console.error(e));
    },
    trail() { const m = main(); if (!m || !ART) return null; if (!trailCache || trailCache.k !== m.key) trailCache = { k: m.key, v: ART.trail(m.key) }; return trailCache.v; },
    get state() { return state; }, SEA, trayBox,
  };
})();

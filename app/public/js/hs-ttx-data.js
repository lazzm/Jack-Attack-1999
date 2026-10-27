/* hs-ttx-data: what's on TELLY-TEXT in 1999 (js/hs-ttx.js draws the pages). Every dated item only shows from its date
 * (the site's 1999 "today" is the same day and month as the real one). Facts were checked (UK dates); where a date was
 * less certain the item is left out rather than guessed. Nothing after 31 December 1999. Kid friendly.
 * Sources for the shared bits: the same checked lists as js/news99-b.js (charts, sport, space, films), plus UK release
 * dates for the games, Comic Relief (12 Mar 1999) and Children in Need (26 Nov 1999). */
(function () {
  'use strict';
  if (window.TTXData) return;
  const md = s => { const [m, d] = String(s).split('-').map(Number); return m * 100 + d; };
  // [date mm-dd, headline (short, capitals are fine), the story (a sentence or two)]
  const news = [
    ['01-01', 'THE EURO IS BORN', 'Eleven European countries switched to the new euro currency today. Britain is keeping the pound for now. Notes and coins come in 2002.'],
    ['01-13', 'JORDON QUITS BASKETBALL', 'Michael Jordon, the most famous basketball player in the world, has retired from the Chicago Bullocks (again).'],
    ['02-02', 'HOODLE OUT AS ENGLAND BOSS', 'Glenn Hoodle has left his job as England football manager. The FA will look for a new boss.'],
    ['02-07', 'COMET DUST CATCHER LAUNCHED', 'NASSA\'s Stardust probe has blasted off to fly through the tail of a comet and bring a sample of its dust back to Earth.'],
    ['02-18', 'KEAGAN TAKES ENGLAND JOB', 'Kevin Keagan will take charge of England for the next four games while staying in his job at Fullham.'],
    ['03-01', 'ROUND-THE-WORLD BALLOON BID', 'Bertram Piccaro and Brian Jonas have taken off from Switzerland in Breitlung Orbiter 3, trying to fly round the world non-stop.'],
    ['03-12', 'RED NOSE DAY!', 'It\'s Comic Reliefs. Red noses on cars, teachers in silly costumes, and a big night of telly on BBQ One from 7pm.'],
    ['03-21', 'BALLOON GOES ROUND THE WORLD', 'Breitlung Orbiter 3 has landed in the Egyptian desert after the first ever non-stop balloon flight around the world.'],
    ['03-22', 'OSKAR FOR SHAKESPEER', 'Shakespeare in Glove won Best Picture at the Oskars in Los Angeles last night.'],
    ['03-24', 'NATO ACTION OVER KOSOVO', 'NATO aircraft have begun action against Yugoslavia over the crisis in Kosovo. More on the main news.'],
    ['04-01', 'MINIMUM WAGE STARTS TODAY', 'From today most adults in Britain must be paid at least 3.60 pounds an hour. (Paper rounds: still not much.)'],
    ['04-24', 'MARS AT ITS BRIGHTEST', 'Mars is opposite the Sun this week: look for a bright orange "star" in the south-east after dark.'],
    ['05-06', 'SCOTLAND AND WALES VOTE', 'People in Scotland and Wales are voting today for the first ever Scottish Parliament and Welsh Assembly.'],
    ['05-19', 'INTERGALACTIC BATTLES OPENS IN AMERICA', 'Intergalactic Battles Episode I: The Phantom Nuisance opens in America today. Fans have queued for weeks. It reaches Britain on 16 July.'],
    ['05-27', 'SHUTTLE OFF TO SPACE STATION', 'Space Shuttle Discovery has launched with supplies for the new International Space Station.'],
    ['05-29', 'SHUTTLE DOCKS WITH STATION', 'Discovery has docked with the International Space Station for the first time.'],
    ['05-30', 'SWEDEN WIN EUROVIZZION', 'Sweden won the Eurovizzion Song Contest in Jerusalem last night. The UK came 12th.'],
    ['06-19', 'ROYAL WEDDING AT WINDSOR', 'Prince Edmund has married Sophie Rhys-Joans at St George\'s Chapel, Windsor. They are now the Earl and Countess of Essex-ish.'],
    ['07-01', 'QUEEN OPENS SCOTTISH PARLIAMENT', 'The Queen has officially opened the new Scottish Parliament in Edinburgh.'],
    ['07-11', 'SHOEMAKER HURT IN CRASH', 'Michael Shoemaker broke his leg in a crash at the British Grand Prix. David Coalhard won the race.'],
    ['07-16', 'INTERGALACTIC BATTLES: THE WAIT IS OVER', 'The Phantom Nuisance opens in British cinemas today. Some fans have taken the day off. (Some "ill" pupils were seen in the queue.)'],
    ['07-20', 'SHUTTLE STOPPED AT T-7 SECONDS', 'Columbia\'s launch was called off seven seconds before lift-off after the computers spotted a problem. They will try again.'],
    ['07-23', 'FIRST WOMAN SHUTTLE COMMANDER', 'Columbia has launched with Eileen Collinz in command, the first woman to command a Space Shuttle. On board: the Chandra X-ray telescope.'],
    ['08-11', 'THE ECLIPSE!', 'The Moon covered the Sun this morning. It was total in Cornwall (where it was mostly cloudy!) and a big bite was taken out of the Sun everywhere else.'],
    ['08-26', 'JOHNSTON SMASHES 400M RECORD', 'Michael Johnston ran 400 metres in 43.18 seconds at the World Championships in Seville: a new world record.'],
    ['09-09', 'DAYDREAM LAUNCHES IN AMERICA', 'Segue\'s Daydream went on sale in America on 9/9/99. It comes to Britain on 14 October.'],
    ['09-24', 'MARS PROBE LOST', 'NASSA has lost contact with the Mars Climate Orbiter as it arrived at Mars.'],
    ['10-01', 'RUGBY WORLD CUP KICKS OFF', 'The Rugby World Cup starts today in Wales, at the brand new Millennium Stadium in Cardiff.'],
    ['10-05', 'POCKET CRITTERS ARRIVES', 'Pocket Critters Moss and Pocket Critters Puddle are out on the Game Lad in Europe. Playgrounds will never be the same again.'],
    ['10-12', 'SIX BILLION PEOPLE', 'The United Nations says the number of people in the world has reached six billion today.'],
    ['10-14', 'DAYDREAM OUT TODAY', 'Segue\'s Daydream is in the shops today for 199 pounds, with a built-in modem for going online.'],
    ['10-31', 'HACKINEN IS CHAMPION AGAIN', 'Mika Hackinen has won the Formula One world championship for the second year running.'],
    ['11-07', 'AUSTRALIA WIN RUGBY WORLD CUP', 'Australia beat France 35-12 in Cardiff yesterday to win the Rugby World Cup.'],
    ['11-14', 'LOUIS IS UNDISPUTED CHAMP', 'Lennox Louis beat Evander Holyfeld in Las Vegas and is now the undisputed heavyweight champion of the world.'],
    ['11-14', 'SCOTS 0 ENGLAND 2', 'Paul Scoles scored twice at Hampden Park in the first leg of the Euro 2000 play-off.'],
    ['11-18', 'ENGLAND THROUGH TO EURO 2000', 'Scotland won 1-0 at Wembley last night but England go through 2-1 on aggregate.'],
    ['11-18', 'SHOOTING STAR STORM', 'The Leonid meteors put on a show early this morning: thousands of shooting stars an hour at the peak, for anyone under a clear sky.'],
    ['11-26', 'CHILDREN IN GREED TONIGHT', 'Pudsey Pear is back. Children in Greed is on BBQ One tonight.'],
    ['12-04', 'MARS LANDER SILENT', 'NASSA has heard nothing from the Mars Polar Lander since it arrived at Mars yesterday.'],
    ['12-20', 'SHUTTLE OFF TO FIX HUBBLY', 'Space Shuttle Discovery has launched to repair the Hubbly Space Telescope.'],
    ['12-28', 'HUBBLY FIXED', 'Discovery is home after astronauts replaced all six of Hubbly\'s gyroscopes on spacewalks.'],
    ['12-31', 'GOODBYE 1999!', 'The Queen opens the Millennium Dome in Greenwich tonight, there are fireworks on the Thames, and the computers had better not go wrong at midnight.'],
  ];
  // [date, sport, the result]
  const sport = [
    ['03-07', 'MOTOR RACING', 'AUSTRALIAN GP: Eddie Ervine won in Melbourne: his first Formula One win.'],
    ['03-21', 'FOOTBALL', 'LEAGUE CUP FINAL: Totterham 1 Lester City 0 (Nielson, in injury time).'],
    ['04-03', 'ROWING', 'THE BOAT RACE: Cambridge beat Oxford.'],
    ['04-10', 'RACING', 'THE GRAND NATIONAL: won by Bobbyjoe, ridden by Paul Carbury.'],
    ['05-03', 'SNOOKER', 'WORLD CHAMPIONSHIP: Stephen Hendrix beat Mark Willems 18-11 for his seventh world title.'],
    ['05-16', 'FOOTBALL', 'PREMIER LEAGUE: Mancake Utd 2 Totterham 1. Mancake United are champions, one point ahead of Arsenic.'],
    ['05-22', 'FOOTBALL', 'FA CUP FINAL: Mancake Utd 2 Newcastel 0 (Sheringdon, Scoles). The Double!'],
    ['05-26', 'FOOTBALL', 'EUROPEAN CUP FINAL: Mancake Utd 2 Bavaria Munchen 1. Two goals in injury time (Sheringdon, Solskjar). THE TREBLE!'],
    ['05-29', 'FOOTBALL', 'SCOTTISH CUP FINAL: Rovers 1 Keltic 0.'],
    ['06-20', 'CRICKET', 'WORLD CUP FINAL at Lord\'s: Australia beat Pakistan by 8 wickets.'],
    ['07-04', 'TENNIS', 'WIMBLEDON: Pete Samprass beat Andre Agassy. Lindsay Davenham won the women\'s title, beating Steffi Graph.'],
    ['07-11', 'MOTOR RACING', 'BRITISH GP at Silverstone: 1 Coalhard 2 Ervine 3 R Shoemaker.'],
    ['07-18', 'GOLF', 'THE OPEN at Carnoustie: Paul Lorry wins in a play-off after starting the last day ten shots behind.'],
    ['08-26', 'ATHLETICS', 'WORLD CHAMPIONSHIPS: Michael Johnston 43.18 secs, a 400 metres world record.'],
    ['09-26', 'GOLF', 'RYDER CUP at Brookline: the USA beat Europe.'],
    ['10-31', 'MOTOR RACING', 'JAPANESE GP: Mika Hackinen wins at Suzuka and is world champion again.'],
    ['11-06', 'RUGBY UNION', 'WORLD CUP FINAL in Cardiff: Australia 35 France 12.'],
    ['11-13', 'BOXING', 'HEAVYWEIGHT: Lennox Louis beat Evander Holyfeld on points to become undisputed champion.'],
    ['11-13', 'FOOTBALL', 'EURO 2000 PLAY-OFF: Scotland 0 England 2 (Scoles 2).'],
    ['11-17', 'FOOTBALL', 'EURO 2000 PLAY-OFF: England 0 Scotland 1 (Hutchinson). England through 2-1 on aggregate.'],
  ];
  // the Premier League's top and bottom, end of 1998-99 (shown from the last day of the season)
  const table = { from: '05-16', top: [['Mancake Utd', 79], ['Arsenic', 78], ['Chelsey', 75], ['Leads', 67]], down: ['Charlston', 'Blackbun', 'Nottm Florest'] };
  // UK number ones of 1999: [the Sunday it was announced, artist, song] (the same checked list as js/news99-b.js)
  const chart = [
    ['01-03', 'Stairs', 'Heartbleat / Comedy'], ['01-10', 'Chubby Slim', 'Phrase You'], ['01-17', '999', 'A Little Bit Less'], ['01-24', 'The Offcuts', 'Pretty Spry (for a Tall Guy)'],
    ['01-31', 'Armand van Hedgen', "You Don't Know Us"], ['02-07', 'Blondini', 'Marcia'], ['02-14', 'Lenny Kravitzel', 'Fly Away'], ['02-21', 'Brittany Spheres', '...Baby Two More Times'],
    ['03-07', 'Boyzown', 'When the Going Gets Rough'], ['03-21', 'B*Stitched', 'Blame It on the Weathervane'], ['03-28', 'Mr. Ooze', 'Flat Feet'], ['04-11', 'Martina McCrutchen', 'Perfect Minute'],
    ['04-25', 'Westloaf', 'Spare It Again'], ['05-09', 'Backalley Boys', 'I Want It This Way'], ['05-16', 'Boyzown', 'You Kneaded Me'], ['05-23', 'Shins & Bigtoe', 'Sweet Like Custard'],
    ['06-06', 'Baz Lurkman', "Everyone Is Free (To Wear Sunhats)"], ['06-13', 'Z Club 7', 'Bring Them All Back'], ['06-20', 'Vengaboats', 'Zoom, Zoom, Zoom, Zoom!!'], ['06-27', 'ATC', '9 PM (Till I Get Home)'],
    ['07-11', 'Rickie Martini', "Livin' la Vida Cocoa"], ['08-01', 'Ronan Keeping', 'When You Say Something at All'], ['08-15', 'Westloaf', 'If I Let You Stay'], ['08-22', 'Gerri Hallowed', 'Mi Chico Bambino'],
    ['08-29', 'Lou Bagel', 'Bongo No. 5'], ['09-12', 'Vengaboats', "We're Going to Majorca!"], ['09-19', 'Eiffle 56', 'Green (Da Ba Doo)'], ['10-10', 'Christina Aquilina', 'Genie in a Jar'],
    ['10-24', 'Westloaf', 'Flying Without Strings'], ['10-31', 'Fyve', "Keep On Moovin'"], ['11-07', 'Gerri Hallowed', 'Lift Me Down'], ['11-14', 'Robbie Wilkins', "She's the Two / It's Only Them"],
    ['11-21', 'Wamdoo Project', 'King of My Cottage'], ['11-28', 'Cliff Richer', 'The Millennium Plea'], ['12-19', 'Westloaf', 'I Have a Scheme / Reasons in the Sun'],
  ];
  // UK cinema releases: [date, title, a line]
  const films = [
    ['01-01', 'Galaxy Walk: Insubordination', 'The Next Instalment crew, film number three.'], ['02-05', "A Bug's Strife", 'Pixer\'s ants versus grasshoppers.'],
    ['05-21', 'Knotting Hill', 'Romantic comedy in a London bookshop.'], ['06-11', 'The Modemtrix', 'Kung fu, slow-motion bullets and a world that isn\'t real.'],
    ['06-25', 'The Mommy', 'Adventure in Egypt. Mind the beetles.'], ['07-16', 'Intergalactic Battles Episode I: The Phantom Nuisance', 'The first new Intergalactic Battles film for 16 years.'],
    ['10-22', 'Tarzon', 'Dizzney\'s jungle cartoon. Tree surfing!'], ['11-12', 'The Sixth Scents', 'Spooky. Don\'t tell anyone the ending.'], ['11-26', 'The World Is Plenty', 'The new James Bland.'],
  ];
  // games out this year in the UK: [date, format, title]
  const games = [
    ['02-22', 'PS', 'Metal Gear Wobbly'], ['03-09', 'ULTRA 64', 'Marlo Party'], ['04-23', 'ULTRA 64', 'Micro Mechanics 64 Turbo'], ['06-04', 'ULTRA 64', 'Intergalactic Battles Episode I: Racer'],
    ['06-25', 'PS', 'Driver'], ['07-02', 'PS', 'Ape Escapade'], ['08-01', 'PS', 'Silent Hull'], ['09-10', 'PS', 'Hover Havoc 3'], ['09-14', 'ULTRA 64', 'Marlo Golf'],
    ['10-01', 'PS', 'Dino Cries'], ['10-05', 'GL', 'Pocket Critters Moss and Puddle'], ['10-14', 'DD', 'Daydream + Zip Adventure'], ['10-18', 'PS', "Tony Squawk's Skateboarding"],
    ['10-27', 'PS', 'Finally Fantasy VIII'], ['10-29', 'ULTRA 64', 'Jet Pack Twins'], ['11-05', 'PS', "Spike the Stegosaur 2: Gateway to Glimmer"], ['11-19', 'ULTRA 64', 'Super Smush Bros.'],
    ['12-03', 'PS', 'Crypt Raider: The Last Revelation'], ['12-03', 'PC', 'Jackreal Tournament'], ['12-06', 'ULTRA 64', 'Donkey Wrong 64'], ['12-17', 'PC', 'Jaquake III Arena'],
  ];
  // the telly. "What's on" by kind of day (shows that were on in 1999 and their usual slots), and special days.
  const tv = {
    week: [
      ['BBQ1', [['7.00', 'Breakfast News'], ['3.30', "Children's BBQ"], ['5.00', 'Newsbound'], ['5.35', 'Neighbourhood'], ['6.00', 'Six O\'Clock News'], ['9.00', 'Nine O\'Clock News']]],
      ['BBQ2', [['7.00', 'Telly Tumblers'], ['6.00', 'The Simpsocks'], ['10.30', 'Newsnite']]],
      ['ITB', [['6.00', 'GMTW'], ['10.30', 'This Brunch'], ['3.20', 'CITW']]],
      ['CF', [['7.00', 'The Big Brunch'], ['4.30', 'Countdown'], ['7.00', 'Channel Fore News']]],
      ['CV', [['6.00', 'Smoothie!'], ['6.30', 'Family Mishaps']]],
    ],
    sat: [
      ['BBQ1', [['9.00', 'Live & Wriggling'], ['12.15', 'Grandstank'], ['8.00', 'The National Raffle'], ['8.30', 'Casualtea']]],
      ['BBQ2', [['9.00', 'Saturday morning cartoons'], ['8.00', 'Film']]],
      ['ITB', [['9.25', 'SMTW Live'], ['11.30', 'CD:OK'], ['7.00', 'Blind Plate']]],
      ['CF', [['9.00', 'T4: Saturday morning']]],
      ['CV', [['6.00', 'Smoothie!']]],
    ],
    sun: [
      ['BBQ1', [['6.40', 'Songs of Phrase'], ['7.15', 'Antiques Roadshaw'], ['8.00', 'Last of the Summer Squash']]],
      ['BBQ2', [['3.00', 'Sunday Grandstank']]],
      ['ITB', [['8.00', 'Heartbeet'], ['10.45', 'The South Bank Slow']]],
      ['CF', [['9.00', 'Sunday morning cartoons']]],
      ['CV', [['6.00', 'Smoothie!']]],
    ],
    // on top of the usual: [date, channel, time, what]
    special: [
      ['03-12', 'BBQ1', '7.00', 'COMIC RELIEFS: Red Nose Day, all night'], ['05-22', 'BBQ1', 'LIVE', 'FA CUP FINAL: Mancake Utd v Newcastle'], ['05-26', 'ITB', 'LIVE', 'EUROPEAN CUP FINAL: Mancake Utd v Bavaria Munchen'],
      ['05-29', 'BBQ1', '8.00', 'EUROVIZZION SONG CONTEST from Jerusalem'], ['06-19', 'BBQ1', 'LIVE', 'THE ROYAL WEDDING from Windsor'], ['07-04', 'BBQ1', '2.00', 'WIMBLEDON: the men\'s final'],
      ['08-11', 'BBQ1', 'LIVE', 'THE ECLIPSE, live'], ['10-31', 'C4', '5.00', "The Witch's Wobbly Cauldron (Halloween special)"], ['10-31', 'BBQ1', '6.30', 'SPOOKY SPECIAL: the Haunted House Party, live'], ['10-31', 'ITB', '9.00', 'Tales of the Unexpectedly Odd: Halloween night'], ['10-31', 'BBQ2', '11.15', 'FILM: The Lost Camcorder Film'], ['11-26', 'BBQ1', '7.00', 'CHILDREN IN GREED'], ['12-25', 'BBQ1', '3.00', 'THE QUEEN'], ['12-31', 'BBQ1', 'ALL DAY', '2000 TODAY: the millennium round the world'],
    ],
    newsAtTenEnds: '03-05', // ITV's News at Ten moved after 5 March 1999
  };
  // the weather: generic by month (it's a forecast for "most of the country")
  const weather = ['Cold and frosty. Snow on high ground. Max 4C', 'Grey, cold, a bit of drizzle. Max 6C', 'Blustery with April-ish showers already. Max 10C', 'Sunshine and showers. Max 13C', 'Warm spells, the odd thundery shower. Max 18C', 'Mostly dry and warm. Max 21C',
    'Hot and sunny. Max 25C. Sun cream!', 'Warm, some sunshine, heavy showers later. Max 23C', 'Mild and bright, misty mornings. Max 19C', 'Wet and windy. Leaves everywhere. Max 14C', 'Damp, chilly, foggy at times. Max 9C', 'Cold, frosty nights. Max 6C'];
  window.TTXData = { md, news, sport, table, chart, films, games, tv, weather };
})();

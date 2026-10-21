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
    ['01-13', 'JORDAN QUITS BASKETBALL', 'Michael Jordan, the most famous basketball player in the world, has retired from the Chicago Bulls (again).'],
    ['02-02', 'HODDLE OUT AS ENGLAND BOSS', 'Glenn Hoddle has left his job as England football manager. The FA will look for a new boss.'],
    ['02-07', 'COMET DUST CATCHER LAUNCHED', 'NASA\'s Stardust probe has blasted off to fly through the tail of a comet and bring a sample of its dust back to Earth.'],
    ['02-18', 'KEEGAN TAKES ENGLAND JOB', 'Kevin Keegan will take charge of England for the next four games while staying in his job at Fulham.'],
    ['03-01', 'ROUND-THE-WORLD BALLOON BID', 'Bertrand Piccard and Brian Jones have taken off from Switzerland in Breitling Orbiter 3, trying to fly round the world non-stop.'],
    ['03-12', 'RED NOSE DAY!', 'It\'s Comic Relief. Red noses on cars, teachers in silly costumes, and a big night of telly on BBC One from 7pm.'],
    ['03-21', 'BALLOON GOES ROUND THE WORLD', 'Breitling Orbiter 3 has landed in the Egyptian desert after the first ever non-stop balloon flight around the world.'],
    ['03-22', 'OSCAR FOR SHAKESPEARE', 'Shakespeare in Love won Best Picture at the Oscars in Los Angeles last night.'],
    ['03-24', 'NATO ACTION OVER KOSOVO', 'NATO aircraft have begun action against Yugoslavia over the crisis in Kosovo. More on the main news.'],
    ['04-01', 'MINIMUM WAGE STARTS TODAY', 'From today most adults in Britain must be paid at least 3.60 pounds an hour. (Paper rounds: still not much.)'],
    ['04-24', 'MARS AT ITS BRIGHTEST', 'Mars is opposite the Sun this week: look for a bright orange "star" in the south-east after dark.'],
    ['05-06', 'SCOTLAND AND WALES VOTE', 'People in Scotland and Wales are voting today for the first ever Scottish Parliament and Welsh Assembly.'],
    ['05-19', 'STAR WARS OPENS IN AMERICA', 'Star Wars Episode I: The Phantom Menace opens in America today. Fans have queued for weeks. It reaches Britain on 16 July.'],
    ['05-27', 'SHUTTLE OFF TO SPACE STATION', 'Space Shuttle Discovery has launched with supplies for the new International Space Station.'],
    ['05-29', 'SHUTTLE DOCKS WITH STATION', 'Discovery has docked with the International Space Station for the first time.'],
    ['05-30', 'SWEDEN WIN EUROVISION', 'Sweden won the Eurovision Song Contest in Jerusalem last night. The UK came 12th.'],
    ['06-19', 'ROYAL WEDDING AT WINDSOR', 'Prince Edward has married Sophie Rhys-Jones at St George\'s Chapel, Windsor. They are now the Earl and Countess of Wessex.'],
    ['07-01', 'QUEEN OPENS SCOTTISH PARLIAMENT', 'The Queen has officially opened the new Scottish Parliament in Edinburgh.'],
    ['07-11', 'SCHUMACHER HURT IN CRASH', 'Michael Schumacher broke his leg in a crash at the British Grand Prix. David Coulthard won the race.'],
    ['07-16', 'STAR WARS: THE WAIT IS OVER', 'The Phantom Menace opens in British cinemas today. Some fans have taken the day off. (Some "ill" pupils were seen in the queue.)'],
    ['07-20', 'SHUTTLE STOPPED AT T-7 SECONDS', 'Columbia\'s launch was called off seven seconds before lift-off after the computers spotted a problem. They will try again.'],
    ['07-23', 'FIRST WOMAN SHUTTLE COMMANDER', 'Columbia has launched with Eileen Collins in command, the first woman to command a Space Shuttle. On board: the Chandra X-ray telescope.'],
    ['08-11', 'THE ECLIPSE!', 'The Moon covered the Sun this morning. It was total in Cornwall (where it was mostly cloudy!) and a big bite was taken out of the Sun everywhere else.'],
    ['08-26', 'JOHNSON SMASHES 400M RECORD', 'Michael Johnson ran 400 metres in 43.18 seconds at the World Championships in Seville: a new world record.'],
    ['09-09', 'DREAMCAST LAUNCHES IN AMERICA', 'Sega\'s Dreamcast went on sale in America on 9/9/99. It comes to Britain on 14 October.'],
    ['09-24', 'MARS PROBE LOST', 'NASA has lost contact with the Mars Climate Orbiter as it arrived at Mars.'],
    ['10-01', 'RUGBY WORLD CUP KICKS OFF', 'The Rugby World Cup starts today in Wales, at the brand new Millennium Stadium in Cardiff.'],
    ['10-05', 'POKEMON ARRIVES', 'Pokemon Red and Pokemon Blue are out on the Game Boy in Europe. Playgrounds will never be the same again.'],
    ['10-12', 'SIX BILLION PEOPLE', 'The United Nations says the number of people in the world has reached six billion today.'],
    ['10-14', 'DREAMCAST OUT TODAY', 'Sega\'s Dreamcast is in the shops today for 199 pounds, with a built-in modem for going online.'],
    ['10-31', 'HAKKINEN IS CHAMPION AGAIN', 'Mika Hakkinen has won the Formula One world championship for the second year running.'],
    ['11-07', 'AUSTRALIA WIN RUGBY WORLD CUP', 'Australia beat France 35-12 in Cardiff yesterday to win the Rugby World Cup.'],
    ['11-14', 'LEWIS IS UNDISPUTED CHAMP', 'Lennox Lewis beat Evander Holyfield in Las Vegas and is now the undisputed heavyweight champion of the world.'],
    ['11-14', 'SCOTS 0 ENGLAND 2', 'Paul Scholes scored twice at Hampden Park in the first leg of the Euro 2000 play-off.'],
    ['11-18', 'ENGLAND THROUGH TO EURO 2000', 'Scotland won 1-0 at Wembley last night but England go through 2-1 on aggregate.'],
    ['11-18', 'SHOOTING STAR STORM', 'The Leonid meteors put on a show early this morning: thousands of shooting stars an hour at the peak, for anyone under a clear sky.'],
    ['11-26', 'CHILDREN IN NEED TONIGHT', 'Pudsey Bear is back. Children in Need is on BBC One tonight.'],
    ['12-04', 'MARS LANDER SILENT', 'NASA has heard nothing from the Mars Polar Lander since it arrived at Mars yesterday.'],
    ['12-20', 'SHUTTLE OFF TO FIX HUBBLE', 'Space Shuttle Discovery has launched to repair the Hubble Space Telescope.'],
    ['12-28', 'HUBBLE FIXED', 'Discovery is home after astronauts replaced all six of Hubble\'s gyroscopes on spacewalks.'],
    ['12-31', 'GOODBYE 1999!', 'The Queen opens the Millennium Dome in Greenwich tonight, there are fireworks on the Thames, and the computers had better not go wrong at midnight.'],
  ];
  // [date, sport, the result]
  const sport = [
    ['03-07', 'MOTOR RACING', 'AUSTRALIAN GP: Eddie Irvine won in Melbourne: his first Formula One win.'],
    ['03-21', 'FOOTBALL', 'LEAGUE CUP FINAL: Tottenham 1 Leicester 0 (Nielsen, in injury time).'],
    ['04-03', 'ROWING', 'THE BOAT RACE: Cambridge beat Oxford.'],
    ['04-10', 'RACING', 'THE GRAND NATIONAL: won by Bobbyjo, ridden by Paul Carberry.'],
    ['05-03', 'SNOOKER', 'WORLD CHAMPIONSHIP: Stephen Hendry beat Mark Williams 18-11 for his seventh world title.'],
    ['05-16', 'FOOTBALL', 'PREMIER LEAGUE: Man Utd 2 Tottenham 1. Manchester United are champions, one point ahead of Arsenal.'],
    ['05-22', 'FOOTBALL', 'FA CUP FINAL: Man Utd 2 Newcastle 0 (Sheringham, Scholes). The Double!'],
    ['05-26', 'FOOTBALL', 'EUROPEAN CUP FINAL: Man Utd 2 Bayern Munich 1. Two goals in injury time (Sheringham, Solskjaer). THE TREBLE!'],
    ['05-29', 'FOOTBALL', 'SCOTTISH CUP FINAL: Rangers 1 Celtic 0.'],
    ['06-20', 'CRICKET', 'WORLD CUP FINAL at Lord\'s: Australia beat Pakistan by 8 wickets.'],
    ['07-04', 'TENNIS', 'WIMBLEDON: Pete Sampras beat Andre Agassi. Lindsay Davenport won the women\'s title, beating Steffi Graf.'],
    ['07-11', 'MOTOR RACING', 'BRITISH GP at Silverstone: 1 Coulthard 2 Irvine 3 R Schumacher.'],
    ['07-18', 'GOLF', 'THE OPEN at Carnoustie: Paul Lawrie wins in a play-off after starting the last day ten shots behind.'],
    ['08-26', 'ATHLETICS', 'WORLD CHAMPIONSHIPS: Michael Johnson 43.18 secs, a 400 metres world record.'],
    ['09-26', 'GOLF', 'RYDER CUP at Brookline: the USA beat Europe.'],
    ['10-31', 'MOTOR RACING', 'JAPANESE GP: Mika Hakkinen wins at Suzuka and is world champion again.'],
    ['11-06', 'RUGBY UNION', 'WORLD CUP FINAL in Cardiff: Australia 35 France 12.'],
    ['11-13', 'BOXING', 'HEAVYWEIGHT: Lennox Lewis beat Evander Holyfield on points to become undisputed champion.'],
    ['11-13', 'FOOTBALL', 'EURO 2000 PLAY-OFF: Scotland 0 England 2 (Scholes 2).'],
    ['11-17', 'FOOTBALL', 'EURO 2000 PLAY-OFF: England 0 Scotland 1 (Hutchison). England through 2-1 on aggregate.'],
  ];
  // the Premier League's top and bottom, end of 1998-99 (shown from the last day of the season)
  const table = { from: '05-16', top: [['Man Utd', 79], ['Arsenal', 78], ['Chelsea', 75], ['Leeds', 67]], down: ['Charlton', 'Blackburn', 'Nottm Forest'] };
  // UK number ones of 1999: [the Sunday it was announced, artist, song] (the same checked list as js/news99-b.js)
  const chart = [
    ['01-03', 'Steps', 'Heartbeat / Tragedy'], ['01-10', 'Fatboy Slim', 'Praise You'], ['01-17', '911', 'A Little Bit More'], ['01-24', 'The Offspring', 'Pretty Fly (for a White Guy)'],
    ['01-31', 'Armand van Helden', "You Don't Know Me"], ['02-07', 'Blondie', 'Maria'], ['02-14', 'Lenny Kravitz', 'Fly Away'], ['02-21', 'Britney Spears', '...Baby One More Time'],
    ['03-07', 'Boyzone', 'When the Going Gets Tough'], ['03-21', 'B*Witched', 'Blame It on the Weatherman'], ['03-28', 'Mr. Oizo', 'Flat Beat'], ['04-11', 'Martine McCutcheon', 'Perfect Moment'],
    ['04-25', 'Westlife', 'Swear It Again'], ['05-09', 'Backstreet Boys', 'I Want It That Way'], ['05-16', 'Boyzone', 'You Needed Me'], ['05-23', 'Shanks & Bigfoot', 'Sweet Like Chocolate'],
    ['06-06', 'Baz Luhrmann', "Everybody's Free (To Wear Sunscreen)"], ['06-13', 'S Club 7', 'Bring It All Back'], ['06-20', 'Vengaboys', 'Boom, Boom, Boom, Boom!!'], ['06-27', 'ATB', '9 PM (Till I Come)'],
    ['07-11', 'Ricky Martin', "Livin' la Vida Loca"], ['08-01', 'Ronan Keating', 'When You Say Nothing at All'], ['08-15', 'Westlife', 'If I Let You Go'], ['08-22', 'Geri Halliwell', 'Mi Chico Latino'],
    ['08-29', 'Lou Bega', 'Mambo No. 5'], ['09-12', 'Vengaboys', "We're Going to Ibiza!"], ['09-19', 'Eiffel 65', 'Blue (Da Ba Dee)'], ['10-10', 'Christina Aguilera', 'Genie in a Bottle'],
    ['10-24', 'Westlife', 'Flying Without Wings'], ['10-31', 'Five', "Keep On Movin'"], ['11-07', 'Geri Halliwell', 'Lift Me Up'], ['11-14', 'Robbie Williams', "She's the One / It's Only Us"],
    ['11-21', 'Wamdue Project', 'King of My Castle'], ['11-28', 'Cliff Richard', 'The Millennium Prayer'], ['12-19', 'Westlife', 'I Have a Dream / Seasons in the Sun'],
  ];
  // UK cinema releases: [date, title, a line]
  const films = [
    ['01-01', 'Star Trek: Insurrection', 'The Next Generation crew, film number three.'], ['02-05', "A Bug's Life", 'Pixar\'s ants versus grasshoppers.'],
    ['05-21', 'Notting Hill', 'Romantic comedy in a London bookshop.'], ['06-11', 'The Matrix', 'Kung fu, slow-motion bullets and a world that isn\'t real.'],
    ['06-25', 'The Mummy', 'Adventure in Egypt. Mind the beetles.'], ['07-16', 'Star Wars Episode I: The Phantom Menace', 'The first new Star Wars film for 16 years.'],
    ['10-22', 'Tarzan', 'Disney\'s jungle cartoon. Tree surfing!'], ['11-12', 'The Sixth Sense', 'Spooky. Don\'t tell anyone the ending.'], ['11-26', 'The World Is Not Enough', 'The new James Bond.'],
  ];
  // games out this year in the UK: [date, format, title]
  const games = [
    ['02-22', 'PS', 'Metal Gear Solid'], ['03-09', 'N64', 'Mario Party'], ['04-23', 'N64', 'Micro Machines 64 Turbo'], ['06-04', 'N64', 'Star Wars Episode I: Racer'],
    ['06-25', 'PS', 'Driver'], ['07-02', 'PS', 'Ape Escape'], ['08-01', 'PS', 'Silent Hill'], ['09-10', 'PS', 'Wipeout 3'], ['09-14', 'N64', 'Mario Golf'],
    ['10-01', 'PS', 'Dino Crisis'], ['10-05', 'GB', 'Pokemon Red and Blue'], ['10-14', 'DC', 'Dreamcast + Sonic Adventure'], ['10-18', 'PS', "Tony Hawk's Skateboarding"],
    ['10-27', 'PS', 'Final Fantasy VIII'], ['10-29', 'N64', 'Jet Force Gemini'], ['11-05', 'PS', "Spyro 2: Gateway to Glimmer"], ['11-19', 'N64', 'Super Smash Bros.'],
    ['12-03', 'PS', 'Tomb Raider: The Last Revelation'], ['12-03', 'PC', 'Unreal Tournament'], ['12-06', 'N64', 'Donkey Kong 64'], ['12-17', 'PC', 'Quake III Arena'],
  ];
  // the telly. "What's on" by kind of day (shows that were on in 1999 and their usual slots), and special days.
  const tv = {
    week: [
      ['BBC1', [['7.00', 'Breakfast News'], ['3.30', "Children's BBC"], ['5.00', 'Newsround'], ['5.35', 'Neighbours'], ['6.00', 'Six O\'Clock News'], ['9.00', 'Nine O\'Clock News']]],
      ['BBC2', [['7.00', 'Teletubbies'], ['6.00', 'The Simpsons'], ['10.30', 'Newsnight']]],
      ['ITV', [['6.00', 'GMTV'], ['10.30', 'This Morning'], ['3.20', 'CITV']]],
      ['C4', [['7.00', 'The Big Breakfast'], ['4.30', 'Countdown'], ['7.00', 'Channel 4 News']]],
      ['C5', [['6.00', 'Milkshake!'], ['6.30', 'Family Affairs']]],
    ],
    sat: [
      ['BBC1', [['9.00', 'Live & Kicking'], ['12.15', 'Grandstand'], ['8.00', 'The National Lottery'], ['8.30', 'Casualty']]],
      ['BBC2', [['9.00', 'Saturday morning cartoons'], ['8.00', 'Film']]],
      ['ITV', [['9.25', 'SMTV Live'], ['11.30', 'CD:UK'], ['7.00', 'Blind Date']]],
      ['C4', [['9.00', 'T4: Saturday morning']]],
      ['C5', [['6.00', 'Milkshake!']]],
    ],
    sun: [
      ['BBC1', [['6.40', 'Songs of Praise'], ['7.15', 'Antiques Roadshow'], ['8.00', 'Last of the Summer Wine']]],
      ['BBC2', [['3.00', 'Sunday Grandstand']]],
      ['ITV', [['8.00', 'Heartbeat'], ['10.45', 'The South Bank Show']]],
      ['C4', [['9.00', 'Sunday morning cartoons']]],
      ['C5', [['6.00', 'Milkshake!']]],
    ],
    // on top of the usual: [date, channel, time, what]
    special: [
      ['03-12', 'BBC1', '7.00', 'COMIC RELIEF: Red Nose Day, all night'], ['05-22', 'BBC1', 'LIVE', 'FA CUP FINAL: Man Utd v Newcastle'], ['05-26', 'ITV', 'LIVE', 'EUROPEAN CUP FINAL: Man Utd v Bayern Munich'],
      ['05-29', 'BBC1', '8.00', 'EUROVISION SONG CONTEST from Jerusalem'], ['06-19', 'BBC1', 'LIVE', 'THE ROYAL WEDDING from Windsor'], ['07-04', 'BBC1', '2.00', 'WIMBLEDON: the men\'s final'],
      ['08-11', 'BBC1', 'LIVE', 'THE ECLIPSE, live'], ['11-26', 'BBC1', '7.00', 'CHILDREN IN NEED'], ['12-25', 'BBC1', '3.00', 'THE QUEEN'], ['12-31', 'BBC1', 'ALL DAY', '2000 TODAY: the millennium round the world'],
    ],
    newsAtTenEnds: '03-05', // ITV's News at Ten moved after 5 March 1999
  };
  // the weather: generic by month (it's a forecast for "most of the country")
  const weather = ['Cold and frosty. Snow on high ground. Max 4C', 'Grey, cold, a bit of drizzle. Max 6C', 'Blustery with April-ish showers already. Max 10C', 'Sunshine and showers. Max 13C', 'Warm spells, the odd thundery shower. Max 18C', 'Mostly dry and warm. Max 21C',
    'Hot and sunny. Max 25C. Sun cream!', 'Warm, some sunshine, heavy showers later. Max 23C', 'Mild and bright, misty mornings. Max 19C', 'Wet and windy. Leaves everywhere. Max 14C', 'Damp, chilly, foggy at times. Max 9C', 'Cold, frosty nights. Max 6C'];
  window.TTXData = { md, news, sport, table, chart, films, games, tv, weather };
})();

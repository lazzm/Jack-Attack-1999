# Parody names (real thing -> house parody)

The site never names a real game, band, film, show, person, brand or product: everything is a kid-friendly sound-alike or synonym. This table is the single source of truth; the same pairs drive `tests/parody-audit.cjs` (run with `node --expose-internals tests/parody-audit.cjs`; it must report 0). Grep this file before inventing a new parody, and reuse the existing one.

Sources: first sweep = the pairs at the top of `tests/parody-audit.cjs`; second sweep = `tests/parody-pairs-2.cjs` (grouped below), third sweep = `tests/parody-pairs-3.cjs` (space, near-real brands/towns, Zeldo rename). Matching is case-insensitive on whole words, so one row covers THE NAME, The Name and the name.

## First sweep (games, consoles, Pocket Critters, Intergalactic Battles, software, brands)

| Real | Parody |
|---|---|
| The Legend of Zelda | The Myth of Zeldo |
| Ocarina of Time | Kazoo of Time |
| Super Mario 64 | Super Marlo 64 |
| Mario Kart 64 | Kart Kaos 64 |
| Mario Kart | Kart Kaos |
| Super Mario | Super Marlo |
| Mario | Marlo |
| Luigi | Louie G |
| Bowser | Bouncer |
| Yoshi | Yosher |
| Banjo-Kazooie | Backpack Buddies |
| Banjo-Tooie | Backpack Buddies Too |
| Diddy Kong Racing | Dinky Donk Racing |
| Diddy Kong | Dinky Donk |
| Donkey Kong | Donkey Wrong |
| Jet Force Gemini | Jet Pack Twins |
| Conker | Acorn Quest |
| GoldenEye | Goldenballs |
| Perfect Dark | Imperfect Dark |
| Crash Bandicoot | Warp Wombat |
| Spyro | Spike the Stegosaur |
| Sonic Adventure | Zip Adventure |
| Sonic | Zip |
| F-Zero | Formula Null |
| Wipeout | Hover Havoc |
| Street Fighter | Street Frightener |
| Tekken | Iron Fist |
| Mortal Kombat | Immortal Combat |
| Resident Evil | Resident Weevil |
| Tomb Raider | Crypt Raider |
| Lara Croft | Clara Loft |
| Half-Life | Half-Loaf |
| Unreal Tournament | Jackreal Tournament |
| Unreal | Jackreal |
| Quake | Jaquake |
| Doom | Gloom |
| Diablo | Diabolo |
| Warcraft | Waaaghcraft |
| StarCraft | StarGraft |
| Command & Conquer | Command & Confuse |
| Command and Conquer | Command and Confuse |
| Age of Empires | Age of Emperors |
| SimCity | Civic Chaos |
| Theme Park | Park Panic |
| RollerCoaster Tycoon | RollerCoaster Rupeecoon |
| Dungeon Keeper | Dungeon Keepa |
| Grand Theft Auto | Grand Theft Otter |
| Metal Gear Solid | Metal Gear Wobbly |
| Gran Turismo | Grand Tourismo |
| Pok&eacute;mon | Pocket Critters |
| Pok&#233;mon | Pocket Critters |
| Pokémon | Pocket Critters |
| Pokemon | Pocket Critters |
| Pikachu | Zapachu |
| Bulbasaur | Bulbabeast |
| Charmander | Charbroiler |
| Squirtle | Squirturtle |
| Mewtwo | MewToo |
| Alakazam | Alakabam |
| Tetris | Blockology |
| Rubik | Rubrick |
| LEGO | Blocko |
| Tamagotchi | Eggbert |
| Tamagotchis | Eggberts |
| Super Nintendo | Super Ultra |
| Nintendo 64 | Ultra 64 |
| NINTENDO64 | Ultra 64 |
| N64 | Ultra 64 |
| Game Boy Color | Game Lad Color |
| Game Boy | Game Lad |
| PlayStation | PlaySpace |
| Dreamcast | Daydream |
| Mega Drive | Mega Glide |
| Sega Saturn | Segue Orbiter |
| Nintendo | Ultra Entertainment |
| Sega | Segue |
| Sony | Somy |
| Microsoft | Jacksoft |
| Windows | JackOS |
| MS-DOS | JACK-DOS |
| Nokia | Talkbrik |
| Ericsson | ErrorSon |
| Motorola | Motoroller |
| Star Wars | Intergalactic Battles |
| Star Trek | Galaxy Walk |
| The Phantom Menace | The Phantom Nuisance |
| A New Hope | An Old Hope |
| The Empire Strikes Back | The Empire Strikes Out |
| Return of the Jedi | Return of the Space Cadets |
| Luke Skywalker | Luke Skywobbler |
| Anakin Skywalker | Anklekin Skywobbler |
| Obi-Wan Kenobi | Obi-Wan Cannoli |
| Obi Wan Kenobi | Obi Wan Cannoli |
| Qui-Gon Jinn | Qui-Gon Gym |
| Darth Vader | Dark Vapour |
| Darth Maul | Dark Mole |
| Jar Jar Binks | Jar Jar Jams |
| Jar Jar | Jar Jar Jams |
| Han Solo | Ham Solo |
| Chewbacca | Chew Biscuit |
| Millennium Falcon | Millennium Pigeon |
| Tatooine | Tattyween |
| Death Star | Dread Scone |
| Yoda | Yoga |
| Jedi | Space Cadet |
| Sith | Sulk |
| lightsaber | lightspatula |
| George Lucas | Gordon Lukewarm |
| LucasArts | Lukewarm Arts |
| Lucasfilm | Lukewarm Films |
| The Matrix | The Modemtrix |
| Red Dwarf | Red Dork |
| Doctor Who | Doctor Whoops |
| Jurassic Park | Jurassic Lark |
| Toy Story | Toy Storey |
| Terminator | Terminatater |
| Back to the Future | Back to the Furniture |
| Indiana Jones | Indiana Groans |
| RoboCop | Robot Cop-Out |
| The Simpsons | The Simpsocks |
| South Park | South Playground |
| The X-Files | The X-Folders |
| X-Files | X-Folders |
| Buffy the Vampire Slayer | Biffy the Vampire Player |
| Robot Wars | Robo Rumble |
| Warhammer | War Hamster |
| Games Workshop | Games Worktop |
| Orks | Gorks |
| Outlook Express | JackMail Express |
| Internet Explorer | JackNet Explorer |
| Netscape Navigator | NetScapeGoat Navigator |
| Netscape | NetScapeGoat |
| Ask Jeeves | Ask Gubbinz |
| Yahoo! | WAAAGHoo! |
| AltaVista | AltaGrotsta |
| Hotmail | HotGrot Mail |
| GeoCities | GrotCities |
| AOL | LOL Online |
| WinZip | JackZip |
| Winamp | Jackamp |
| RealPlayer | ReelPlayer |
| QuickTime | QuickThyme |
| Panini | Panino |
| Airfix | AirMix |
| Coca-Cola | Cocoa-Cola |
| Pepsi | Pepzi |
| McDonalds | McDoodles |
| McDonald | McDoodle |
| Burger King | Burger Duke |
| Adidas | Adidots |
| Pokemon Red / Blue | Pocket Critters Moss / Puddle |
| Pocket Critters Red and Pocket Critters Blue | Pocket Critters Moss and Pocket Critters Puddle |
| Pocket Critters Red and Blue | Pocket Critters Moss and Puddle |
| Pocket Critters Red & Blue | Pocket Critters Moss & Puddle |
| Pocket Critters Red &amp; Blue | Pocket Critters Moss &amp; Puddle |
| Pocket Critters Red / Blue | Pocket Critters Moss / Puddle |
| Pocket Critters Red and Green | Pocket Critters Moss and Reed |
| Pocket Critters Red | Pocket Critters Moss |
| Pocket Critters Blue | Pocket Critters Puddle |
| Red and Blue | Moss and Puddle |
| Pocket Monsters | Pocket Critters |
| Pok&eacute;dex | Critterdex |
| Pokédex | Critterdex |
| Pokedex | Critterdex |
| Poke Balls | Critter Cubes |
| Poke Ball | Critter Cube |
| Pokeballs | Critter Cubes |
| Pokeball | Critter Cube |
| Pokepad | Critterpad |
| Pokebook | Critterbook |
| Poke Flute | Kazoo Flute |
| PokeFans | CritterFans |
| Ultra Balls | Mega Cubes |
| Ultra Ball | Mega Cube |
| Elite Four | Fabulous Four |
| Team Rocket | Team Pocket |
| Professor Oak | Professor Acorn |
| Pallet Town | Moss Town |
| Viridian Forest | Whispering Woods |
| Viridian City | Gravel City |
| Pewter City | Moss Town |
| Cerulean City | Pebble Bay |
| Vermilion City | Fusebox Town |
| Celadon City | Kiln Village |
| Celadon | Kiln |
| Fuchsia City | Fusty City |
| Saffron City | Sellotape City |
| Cinnabar Island | Custard Island |
| Lavender Town | Laundry Town |
| Mt. Moon | Mt. Mooncake |
| S.S. Anne | S.S. Annie |
| Lt. Surge | Lt. Zapp |
| Brock | Brick |
| Erika | Petunia |
| Koga | Kogger |
| Sabrina | Sabotina |
| Blaine | Blame |
| Giovanni | Don Giovinco |
| Boulder Badge | Moss Badge |
| Cascade Badge | Splash Badge |
| Thunder Badge | Spark Badge |
| Rainbow Badge | Kiln Badge |
| Soul Badge | Sock Badge |
| Marsh Badge | Sellotape Badge |
| Volcano Badge | Custard Badge |
| Earth Badge | Gravel Badge |
| Venusaur | Bulbabehemoth |
| Wartortle | Wartless Turtle |
| Blastoise | Blastortoise |
| Charizard | Chargrillizard |
| Caterpie | Caterpillow |
| Weedle | Wheedle |
| Pidgeot | Pidgeonot |
| Pidgey | Pidgeon |
| Rattata | Ratatat |
| Spearow | Spearoo |
| Ekans | Snake-E |
| Arbok | Arbonk |
| Raichu | Zapachoo |
| Sandshrew | Sandshoe |
| Sandslash | Sandsplash |
| Nidoqueen | Nidoqueue |
| Nidoking | Nidokingsize |
| Clefairy | Clefferry |
| Clefable | Clefferrible |
| Vulpix | Vulpickle |
| Ninetales | Ninetalez |
| Jigglypuff | Jelly Puff |
| Wigglytuff | Wobblytuff |
| Zubat | Zoo Bat |
| Oddish | Oddball |
| Vileplume | Vile Perfume |
| Venomoth | Venomouth |
| Meowth | Meowf |
| Psyduck | Psychoduck |
| Mankey | Manky |
| Primeape | Primeate |
| Growlithe | Growlbite |
| Arcanine | Arcaninny |
| Poliwrath | Poliwrap |
| Kadabra | Kadabba |
| Machoke | Machoked |
| Machamp | Macho Champ |
| Bellsprout | Bellsprat |
| Weepinbell | Weepinbill |
| Victreebel | Victory Bell |
| Graveler | Gravelly |
| Magneton | Magnetron |
| Haunter | Haunty |
| Gengar | Gengah |
| Hypno | Hypnoo |
| Electrode | Electrodd |
| Hitmonlee | Hitmonlea |
| Hitmonchan | Hitmonchin |
| Chansey | Chancey |
| Kangaskhan | Kangaroo-khan |
| Scyther | Scythey |
| Electabuzz | Electabuzzzz |
| Magmar | Magmaar |
| Pinsir | Pincer |
| Magikarp | Magicarp |
| Gyarados | Gyaradish |
| Lapras | Lap-Rascal |
| Eevee | Evie |
| Vaporeon | Vaporeoff |
| Jolteon | Joltoff |
| Flareon | Flareoff |
| Kabutops | Kabutoast |
| Aerodactyl | Aerodactylic |
| Snorlax | Snorelax |
| Articuno | Arctic-No |
| Zapdos | Zapdoze |
| Moltres | Moltrees |
| Dragonite | Dragonight |
| Togepi | Togepie |
| Pikablu | Zapablu |
| MissingNo. | MissingNope |
| MissingNo | MissingNope |
| Mew | MewOne |
| Final Fantasy | Finally Fantasy |
| Tony Hawk's | Tony Squawk's |
| Silent Hill | Silent Hull |
| Dino Crisis | Dino Cries |
| Ape Escape | Ape Escapade |
| Furby | Furbo |
| Furbies | Furbos |
| Rainbow Road | Rainbow Roadworks |
| Pac-Man | Chomp-Man |
| Pacman | Chompman |
| Space Invaders | Space Invoices |
| Super Smash Bros | Super Smush Bros |
| Smash Bros | Smush Bros |
| Super Smash | Super Smush |
| Lemmings | Lemmons |
| Rayman | Rayhand |
| Championship Manager | Championship Mangler |
| Sephiroth | Sellofroth |
| Cloud Strife | Cloud Stripe |
| Solid Snake | Soggy Snake |
| Gordon Freeman | Gordon Freeloader |
| Duke Nukem | Duke Nuketon |
| Metroid | Metroad |
| Samus | Samosa |
| Wario | Warlo |
| Game Gear | Game Gearbox |
| Neo Geo | Neo Geoff |
| Commodore | Commodork |
| Princess Peach | Princess Pear |
| Spice Girls | Slice Girls |
| Britney Spears | Brittany Spheres |
| Britney | Brittany |
| Backstreet Boys | Backalley Boys |
| Westlife | Westloaf |
| Robbie Williams | Robbie Wilkins |
| Titanic | Tightanic |
| Harry Potter | Barry Plotter |
| Lord of the Rings | Lord of the Things |
| Austin Powers | Boston Towers |
| The Sixth Sense | The Sixth Scents |
| Sixth Sense | Sixth Scents |
| Napster | Gnapster |
| Beanie Babies | Beany Bobbles |
| Teletubbies | Telly Tumblers |
| Sky One | Sky Won |
| Superman | Supermun |
| Shakespeare in Love | Shakespeare in Glove |
| CONKER CHUCK | CONKER CHUCK |
| Link's Awakening | Lingo's Awakening |
| Adventure of Link | Adventure of Lingo |
| Ganondorf | Baron Meatballo |
| Ganon | Baron Meatballo |
| Hyrule | Lasagnia |
| Epona | Eponini |
| Triforce | Tri-Fork |
| Ocarina | Kazoo |
| Master Sword | Master Spork |
| Kirby | Blobby |
| Captain Falcon | Captain Pigeon |
| Star Fox | Star Vixen |
| Mega Man | Mega Bloke |
| Castlevania | Castlevanilla |
| Koopa Troopa | Kooka Trooper |
| Koopas | Kookas |
| Koopa | Kooka |
| Mushroom Kingdom | Toadstool Kingdom |
| Doctor Neo Cortex | Doctor Neo Cornflakes |
| Crash Team Racing | Warp Wombat Racing |
| Dr. Robotnik | Dr. Rotbotnik |
| Eggman | Eggbert |
| Master Chief | Master Chef |
| Pikmin | Pickmin |
| Animal Crossing | Animal Crisscross |
| Fire Emblem | Fire Emblum |

## Second sweep

### Computer hardware, chips and tech companies

| Real | Parody |
|---|---|
| Pentium III | Pent-Yum III |
| Pentium II | Pent-Yum II |
| Pentium MMX | Pent-Yum MMX |
| Pentium FDIV | Pent-Yum FDIV |
| Pentium Pro | Pent-Yum Pro |
| Pentiums | Pent-Yums |
| Pentium | Pent-Yum |
| GenuineIntel | GenuineInkle |
| Intel | Inkle |
| Celeron | Celery-on |
| Coppermine | Copperpine |
| Deschutes | Dishcoots |
| AMD | AMP |
| Athlon | Athlonk |
| K6-III | Q6-III |
| K6-2 | Q6-2 |
| K6 | Q6 |
| 3dfx | 3dfix |
| Voodoo3 | Hoodoo3 |
| Voodoo2 | Hoodoo2 |
| Voodoo Graphics | Hoodoo Graphics |
| Voodoo | Hoodoo |
| GeForce | GeFarce |
| ATI Technologies | ETI Technologies |
| Sound Blaster | Sound Bluster |
| SoundBlaster16 | SoundBluster16 |
| Creative Labs | Creative Slabs |
| Yamaha | Yamahaha |
| IBM | IBN |
| Compaq | Compak |
| Apple Computer | Pear Computer |
| Apple Macintosh | Pear Mackintosh |
| Macintosh | Mackintosh |
| Apple IIs | Pear IIs |
| Apple II | Pear II |
| Apple Lisa | Pear Lisa |
| Apple's | Pear's |
| Apple made | Pear made |
| Power Mac G4 | Power Mack G4 |
| iMac | iMack |
| iBook | iBrook |
| Iomega | Iomegga |
| Zip drive | Zap drive |
| Philips | Fillips |
| Panasonic | Panasonique |
| Matsushita | Matsushiter |
| Hitachi | Hitachoo |
| Sanyo | Sunyo |
| Goldstar | Goldstor |
| JVC | JVK |
| Texas Instruments | Texas Instrumentals |
| Xerox | Zerox |
| Kodak | Kodack |
| Polaroid | Polaroider |
| Westinghouse | Westinghouser |
| Epson | Epsom |
| Walkman | Strollman |
| Betamax | Betamix |
| AIBO | AIBOW |
| Tiger Electronics | Tigger Electronics |
| Mozilla | Mozzarella |
| Lycos | Lickos |
| WebCrawler | WebCrawlie |
| Google | Googol |
| Freeserve | Freeserf |
| MSN Messenger | MSM Messenger |
| MSN | MSM |
| ICQ | ICU |
| Red Hat | Red Cap |
| Linus Torvalds | Linus Torvolts |
| Linux | Linucks |
| Tux | Tuxie |
| Notepad | Jotpad |
| WordPad | WordPod |
| HyperTerminal | HyperTerminull |
| NetMeeting | NetMeating |
| FreeCell | FreeCellar |
| Minesweeper | Bugsweeper |
| WinPopups | JackPopups |
| WinPopup | JackPopup |
| Dr Watson | Dr Whatson |
| MS Paint | JackPaint |
| Engelbart | Engelbert |
| Douglas Engelbart | Douglas Engelbert |

### Games and game people (second pass)

| Real | Parody |
|---|---|
| Worms Armageddon | Squirms Armageddon |
| Ridge Racer | Ridge Wrecker |
| Wave Race | Wave Pace |
| Shenmue | Shenmoo |
| EverQuest | NeverQuest |
| Medal of Honor | Medal of Honk |
| System Shock | System Sock |
| Blue Stinger | Blue Stinker |
| TrickStyle | TrickSmile |
| Toy Commander | Toy Commandant |
| Speed Devils | Speed Devilz |
| Re-Volt | Re-Vault |
| Rock Raiders | Rock Traders |
| Gauntlet Legends | Gauntlet Leggings |
| Opposing Force | Opposing Farce |
| Rugrats | Rugpats |
| Goosebumps | Goosepimples |
| Beetle Adventure Racing | Beetle Adventure Pacing |
| Rampage 2: Universal Tour | Rampage Too: Universal Tour |
| V-Rally | V-Ralley |
| Micro Machines 64 Turbo | Micro Mechanics 64 Turbo |
| Micro Machines | Micro Mechanics |
| Midtown Madness | Midtown Badness |
| Driver 2 | Driver Too |
| Bust-A-Move | Bust-A-Grin |
| Puzzle Bobble | Puzzle Wobble |
| Bubble Bobble | Bubble Wobble |
| PaRappa | PaRaffa |
| FIFA | FIFO |
| Sensible Soccer | Sensible Footie |
| Sensible Software | Sensible Softwear |
| Soulcalibur | Soulcaliber |
| Soul Calibur | Soul Caliber |
| Soul Reaver | Soul Weaver |
| Legacy of Kain | Legacy of Cane |
| Power Stone | Power Rock |
| Homeworld | Homeplanet |
| Tiberian Sun | Tiberian Moon |
| Tiberium | Tiberiumm |
| Rogue Squadron | Rogue Squadrilla |
| Baldur's Gate | Boulder's Gate |
| Starsiege: Tribes | Starsiege: Tribbles |
| Starsiege | Stargiege |
| Wing Commander | Wing Commandant |
| Prince of Persia | Prince of Parsnia |
| Jordan Mechner | Jordan Mechanix |
| Mechner | Mechanix |
| Jaffar | Jaffa |
| Rand and Robyn Miller | Rand and Robyn Millar |
| Westwood Studios | Westwould Studios |
| Westwood | Westwould |
| Psycho Mantis | Pyjama Mantis |
| Sniper Wolf | Sniper Woof |
| Revolver Ocelot | Revolver Ocelet |
| Vulcan Raven | Vulcan Ravine |
| Shadow Moses | Shadow Moss |
| Metal Gear REX | Metal Gear REXX |
| Dodongo's Cavern | Dodo-ngo's Cavern |
| Jabu-Jabu | Jibber-Jabber |
| Lake Hylia | Lake Lasagne |
| Gold Skulltulas | Gold Skulltoolas |
| Skulltula | Skulltoola |
| Iron Boots | Iron Wellies |
| Goron City | Gourd City |
| Gorons | Gourds |
| Goron | Gourd |
| Minuet of Forest | Minuet of Woods |
| Bolero of Fire | Bolero of Flame |
| Serenade of Water | Serenade of Splash |
| Nocturne of Shadow | Nocturne of Gloom |
| Requiem of Spirit | Requiem of Ghost |
| Prelude of Light | Prelude of Glow |
| Song of Storms | Song of Showers |
| Water Temple | Water Tempura |
| Forest Temple | Forest Tempura |
| Fire Temple | Fire Tempura |
| Shadow Temple | Shadow Tempura |
| Spirit Temple | Spirit Tempura |
| Lon Lon Ranch | Lan Lan Ranch |
| Gruntilda | Grumpilda |
| Grunty | Grumpy |
| Mumbo's Mountain | Jumbo's Mountain |
| Mumbo | Jumbo |
| Jinjos | Jinjoes |
| Jinjo | Jinjoe |
| Jiggies | Jigsies |
| Jiggy | Jigsy |
| Kazooie | Kazoobie |
| Tooty | Tootsie |
| Clanker's Cavern | Clunker's Cavern |
| Mad Monster Mansion | Mad Monster Manor |
| Freezeezy Peak | Freezy-Wheezy Peak |
| Rusty Bucket Bay | Rusty Pail Bay |
| Bubblegloop Swamp | Bubblegloop Pond |
| Treasure Trove Cove | Treasure Grove Cove |
| Click Clock Wood | Clack Clock Wood |
| Gobi's Valley | Gobo's Valley |
| Moo Moo Farm | Moo Moo Meadow |
| Kalimari Desert | Kalamari Desert |
| Toad's Turnpike | Toadie's Turnpike |
| Frappe Snowland | Frappe Snowdrift |
| Choco Mountain | Choc Mountain |
| Sherbet Land | Sorbet Land |
| Royal Raceway | Regal Raceway |
| Banshee Boardwalk | Banshee Boardroom |
| Blue Shell | Blue Conch |
| Princess Toadstool | Princess Pear |
| Lakitu | Lakitoo |
| Cranky Kong | Cranky Wrong |
| Kong Jr. | Wrong Jr. |
| Kong Jr | Wrong Jr |
| Jumpman | Jumpmate |
| Zergling | Zorgling |
| Zerglings | Zorglings |
| Zerg | Zorg |
| Protoss | Protosauce |
| Terrans | Terrines |
| Terran | Terrine |
| Brood War | Brood Warble |
| Blizzard Entertainment | Blizzy Entertainment |
| Black Mesa | Dark Mesa |
| Konami | Konamy |
| Capcom | Capcomb |
| Namco | Namcoh |
| Taito | Taitoo |
| Maxis | Maxxis |
| Bullfrog | Bullfrag |
| Psygnosis | Psygnosys |
| Codemasters | Codemonsters |
| Team17 | Team18 |
| Naughty Dog | Naughty Dingo |
| Core Design | Corn Design |
| Eidos | Eidoh |
| Activision | Actovision |
| Electronic Arts | Electronic Darts |
| Hudson Soft | Hodson Soft |
| HuCards | HuCarps |
| HuCard | HuCarp |
| Game Freak | Game Fleak |
| Polyphony Digital | Polyphonic Digital |
| DMA Design | DNA Design |
| Interplay | Interplae |
| Famicom | Fanicom |
| Super Famicart | Super Fanicart |
| Game & Watch | Game & Glance |
| Game &amp; Watch | Game &amp; Glance |
| Virtual Boy | Virtual Lad |
| WonderSwan | WonderSwine |
| Atari | Ottari |
| Magnavox Odyssey | Magnabox Oddity |
| Magnavox | Magnabox |
| The Odyssey could | The Oddity could |
| The Odyssey with | The Oddity with |
| Ralph Baer | Ralph Bear |
| Intellivision | Intellivizzle |
| Intellivoice | Intellivoize |
| Mattel Electronics | Mattle Electronics |
| Mattel | Mattle |
| ColecoVision | ColecooVision |
| Coleco | Colecoo |
| Vectrex | Vectrix |
| Epyx | Epix |
| Milton Bradley | Milton Bradshaw |
| Sinclair Research | Sinclear Research |
| Clive Sinclair | Clive Sinclear |
| ZX Spectrum | ZY Spectrum |
| Acorn Computers | Eggcup Computers |
| Acorn Electron | Eggcup Electron |
| BBC Micro | BBQ Micro |
| PC Engine | PC Motor |
| TurboGrafx-16 | TurboGraphix-16 |
| SNES | SNEZ |
| NES | NEZ |
| Duck Hunt | Duck Punt |
| Mine Storm | Mine Squall |
| Alex Kidd | Alex Kidder |
| Puck Man | Pluck Man |
| Blinky | Blinkster |
| Inky and Clyde | Inkster and Clydesdale |
| Toru Iwatani | Toru Iwatanny |
| Iwatani | Iwatanny |
| Shigeru Miyamoto | Shigeru Miyabotto |
| Miyamoto | Miyabotto |
| Gunpei Yokoi | Gunpie Yokoy |
| Hideo Kojima | Hideo Kojammer |
| Koji Kondo | Koji Condor |
| Nolan Bushnell | Nolan Bushwell |
| Bushnell | Bushwell |
| Allan Alcorn | Allan Alcorne |
| Alcorn | Alcorne |
| Ken Kutaragi | Ken Kutaragoo |
| Kutaragi | Kutaragoo |
| Will Wright | Will Rite |
| Trip Hawkins | Trip Hawkings |
| Tomohiro Nishikado | Tomohiro Nishikaddo |
| Chris Sawyer | Chris Sawyerr |
| John Carmack | John Carmuck |
| Carmack | Carmuck |
| Satoshi Tajiri | Satoshi Tajiry |
| Kazunori Yamauchi | Kazunori Yamauchy |
| Alexey Pajitnov | Alexey Pyjamanov |
| Pajitnov | Pyjamanov |
| Erno Rubik | Erno Rubrick |
| Peter Molyneux | Peter Mollyneux |
| Sid Meier | Sid Mayer |
| Triple Triad | Triple Tried |
| Materia | Mattereal |
| Hadouken | Hadooken |
| IDSPISPOPD | GLSPISPOPD |
| IDBEHOLD | GLBEHOLD |
| IDCLIP | GLCLIP |
| IDDQD | GLDQD |
| IDKFA | GLKFA |
| DNKROZ | DKNROZ |
| DNSTUFF | DKSTUFF |
| Pogs | Pogz |
| Tazos | Tazoz |
| Tazo | Tazoz |
| K'Nex | K'Nix |
| Scalextric | Scaletrix |
| Meccano | Meccanic |
| Hoover | Vacuum |
| Blu-Tack | Blue-Stuck |
| Tipp-Ex | Tipp-Ox |

### Star Wars / Star Trek / Doctor Who / Tolkien / Harry Potter

| Real | Parody |
|---|---|
| Padawan | Padawannabe |
| Gungans | Gungoos |
| Gungan | Gungoo |
| Naboo | Naboodle |
| Mos Espa | Mos Espresso |
| Dagobah | Dagobar |
| Sarlacc | Sarlacky |
| Mon Calamari | Mon Calzone |
| Hoth | Froth |
| Endor | Endoor |
| Kessel | Kettle |
| Boonta Eve | Boomta Eve |
| Boonta | Boomta |
| Sebulba | Sebulbar |
| Watto | Wotto |
| Boss Nass | Boss Gnash |
| Boba Fett | Bobba Fetch |
| Greedo | Greedy-o |
| R2-D2 | R2-B2 |
| C-3PO | C-4PO |
| X-wings | Z-wings |
| X-wing | Z-wing |
| TIE Fighter | TYE Fighter |
| Ewoks | Yewoks |
| Jabba the Hutt | Jibber the Hutch |
| Jabba | Jibber |
| Wookiees | Wookie-Cookies |
| Wookiee | Wookie-Cookie |
| Jawas | Jaffas |
| Jawa | Jaffa |
| Toydarian | Toydarling |
| Queen Amidala | Queen Amidolly |
| Amidala | Amidolly |
| Battle Droid | Battle Toaster |
| Rebel Alliance | Rebel Allowance |
| Trade Federation | Trade Fedoration |
| May the Force be with you | May the Farce be with you |
| Ewan McGregor | Ewan McGreaser |
| Liam Neeson | Liam Kneesun |
| Natalie Portman | Natalie Porkman |
| HoloNet | HoloNut |
| The Clone Menace | The Clown Menace |
| Clone War | Clown War |
| Outer Rim | Outer Hem |
| Industrial Light & Magic | Industrial Light & Mirth |
| Industrial Light &amp; Magic | Industrial Light &amp; Mirth |
| Princess Leia | Princess Layla |
| Leia | Layla |
| Lando Calrissian | Lando Cardigan |
| Ewok | Yewok |
| Pod Racers | Peapod Racers |
| Pod Racer | Peapod Racer |
| Pod Races | Peapod Races |
| Pod Race | Peapod Race |
| Podracing | Peapodracing |
| Podracers | Peapodracers |
| Podracer | Peapodracer |
| Podrace | Peapod Race |
| Captain Kirk | Captain Quirk |
| Kirk, Mr | Quirk, Mr |
| Mr Spock | Mr Sprock |
| Spock | Sprock |
| Jean-Luc Picard | Jean-Luc Pickle |
| Picard | Pickle |
| Gene Roddenberry | Gene Roddenbury |
| starship Enterprise | starship Enterprize |
| captain of the Enterprise | captain of the Enterprize |
| The Enterprise | The Enterprize |
| Starfleet | Starfleas |
| Klingon | Klingy-on |
| Deep Space Nine | Deep Space Nein |
| Galaxy Walk: Insurrection | Galaxy Walk: Insubordination |
| The Next Generation | The Next Instalment |
| The Motion Picture | The Motion Pitcher |
| The Voyage Home | The Voyage Homeward |
| The Final Frontier | The Final Fridge |
| Undiscovered Country | Undiscovered Cupboard |
| Tom Baker | Tom Bakery |
| Time Lord | Time Laird |
| TARDIS | TARDISH |
| Daleks | Dalicks |
| Dalek | Dalick |
| Skaro | Scarrow |
| The Hobbit | The Hobbet |
| Tolkien | Tolkeen |
| Gandalf | Gandelf |
| Bilbo Baggins | Bilby Baggings |
| Bilbo | Bilby |
| Baggins | Baggings |
| Gollum | Gollumpy |
| Smaug | Smog |
| Lonely Mountain | Lonesome Mountain |
| Prisoner of Azkaban | Prisoner of Ashbin |
| Azkaban | Ashbin |
| Hogwarts | Hogwash |
| Gringotts | Grinotts |
| Diagon Alley | Diagonal Alley |
| Philosopher's Stone | Philosopher's Scone |
| Chamber of Secrets | Chamber of Sandwiches |
| J.K. Rowling | J.K. Rolling |
| Rowling | Rolling |
| Hedwig | Hedgewig |

### Films, directors, actors

| Real | Parody |
|---|---|
| A Bug's Life | A Bug's Strife |
| Notting Hill | Knotting Hill |
| The Mummy | The Mommy |
| The Iron Giant | The Iron Giraffe |
| Iron Giant | Iron Giraffe |
| The Iron Man | The Iron Pan |
| Ted Hughes | Ted Hughs |
| Wild Wild West | Wild Wild Nest |
| Galaxy Quest | Galaxy Quiz |
| Men in Black | Men in Beige |
| Independence Day | Dependence Day |
| Blade Runner | Blade Rummer |
| eXistenZ | eXistenX |
| Walking with Dinosaurs | Strolling with Dinosaurs |
| Tarzan | Tarzon |
| King Kong | King Konk |
| Planet of the Apes | Planet of the Capes |
| The Day the Earth Stood Still | The Day the Earth Sat Still |
| Klaatu | Klaatoo |
| Forbidden Planet | Forbidden Planetoid |
| Jason and the Argonauts | Jason and the Argonuts |
| Close Encounters of the Third Kind | Near Encounters of the Third Kind |
| Close Encounters | Near Encounters |
| E.T. the Extra-Terrestrial | F.T. the Extra-Terrestrial |
| 2001: A Space Odyssey | 2001: A Space Oddity |
| A Space Odyssey | A Space Oddity |
| Alien vs Predator | Alien vs Pretender |
| Aliens vs Predator | Aliens vs Pretender |
| Fifth Element | Fifth Elephant |
| The Fifth Element | The Fifth Elephant |
| Disney | Dizzney |
| Pixar | Pixer |
| Mickey Mouse | Mickey Mousse |
| Mickey and his friends | Mousey and his friends |
| Mickey's Racing Adventure | Mousey's Racing Adventure |
| Steven Spielberg | Stevie Spielburger |
| Spielberg | Spielburger |
| Michael Crichton | Michael Crichtoon |
| Jeff Goldblum | Jeff Goldbloom |
| Stanley Kubrick | Stanley Cubrick |
| Ridley Scott | Ridley Spot |
| James Cameron | James Camera |
| Arnold Schwarzenegger | Arnold Schwarzenburger |
| Robert Zemeckis | Robert Zemecks |
| Paul Verhoeven | Paul Verhoofen |
| Sigourney Weaver | Sigourney Weevil |
| Ellen Ripley | Ellen Rippley |
| Nostromo | Nostromato |
| H. R. Giger | H. R. Gigger |
| Giger | Gigger |
| Harrison Ford | Harrison Fjord |
| Rick Deckard | Rick Deckhand |
| Philip K. Dick | Philip K. Dock |
| Bruce Willis | Bruce Willow |
| Keanu Reeves | Keanu Leaves |
| Wachowskis | Wachowzkis |
| Jeff Bridges | Jeff Ridges |
| Robert Wise | Robert Wize |
| Fritz Lang | Fritz Long |
| Charlton Heston | Charlton Hestor |
| Pierre Boulle | Pierre Boule |
| Franklin J. Schaffner | Franklin J. Shaffner |
| Irvin Kershner | Irvin Kershnor |
| Richard Marquand | Richard Marquis |
| Steven Lisberger | Steven Lisburger |
| Kevin Flynn | Kevin Flinn |
| Marty McFly | Marty McFlyer |
| Doc Brown | Doc Brownie |
| DeLorean | DeLorry |
| Sarah Connor | Sarah Conner |
| John Connor | John Conner |
| T-1000 | T-1001 |
| Judgment Day | Judgement Night |
| Stan Winston | Stan Winstone |
| Peter Weller | Peter Wetter |
| Alex Murphy | Alex Murphey |
| ED-209 | ED-290 |
| Phil Tippett | Phil Tippet |
| Rick Baker | Rick Bakerr |
| Korben Dallas | Korben Dollars |
| Leeloo | Leelou |
| Jean-Paul Gaultier | Jean-Paul Gauntlet |
| Milla Jovovich | Milla Jovo-rich |
| Luc Besson | Luc Bessun |
| Brad Bird | Brad Bard |
| Alan Rickman | Alan Rickmen |
| Tim Allen | Tim Allan |
| Dean Parisot | Dean Parrisot |
| Ray Harryhausen | Ray Harryhousen |
| Tommy Lee Jones | Tommy Lee Jonas |
| Will Smith | Will Smithy |
| Barry Sonnenfeld | Barry Sunfield |
| Kurt Russell | Kurt Rustle |
| Roland Emmerich | Roland Emmerick |
| Georges Méliès | Georges Mélange |
| Georges M&eacute;li&egrave;s | Georges M&eacute;lange |
| Rowan Atkinson | Rowan Atkinsun |
| Craig Charles | Craig Charlton |
| Matt Groening | Matt Groaning |
| Sir Killalot | Sir Killalotta |
| Killalot | Killalotta |
| Sgt Bash | Sgt Smash |
| Dead Metal | Dead Meddle |
| Mr Psycho | Mr Sicko |
| Rimmer | Rimshot |
| Kryten | Kritten |
| Lister | Lickster |
| Futurama | Futurarma |
| Planet Express | Planet Parcel |
| Zoidberg | Zoidburger |
| Farnsworth | Farnsworse |
| Turanga Leela | Turanga Lila |
| Philip J. Fry | Philip J. Fly |
| Family Guy | Family Gal |
| SpongeBob SquarePants | SpudgeBob SquarePatches |
| SpongeBob | SpudgeBob |
| Farscape | Farscope |
| Stargate SG-1 | Starhatch SG-1 |
| Stargate | Starhatch |
| Thunderbirds | Thunderbudgies |
| Thunderbird | Thunderbudgie |
| Tweenies | Tweenettes |
| Bob the Builder | Rob the Builder |
| Takeshi's Castle | Tikeshi's Castle |
| Mr Bean | Mr Bunn |

### TV channels, programmes, presenters

| Real | Parody |
|---|---|
| BBC1 | BBQ1 |
| BBC2 | BBQ2 |
| BBC | BBQ |
| ITV | ITB |
| Channel 4 | Channel Fore |
| Channel 5 | Channel Fiver |
| GMTV | GMTW |
| CITV | CITW |
| SMTV Live | SMTW Live |
| SM:TV Live | SM:TW Live |
| CD:UK | CD:OK |
| The Big Breakfast | The Big Brunch |
| Newsround | Newsbound |
| Newsnight | Newsnite |
| Family Affairs | Family Mishaps |
| Live & Kicking | Live & Wriggling |
| Live &amp; Kicking | Live &amp; Wriggling |
| The National Lottery | The National Raffle |
| Blind Date | Blind Plate |
| Songs of Praise | Songs of Phrase |
| Antiques Roadshow | Antiques Roadshaw |
| Last of the Summer Wine | Last of the Summer Squash |
| The South Bank Show | The South Bank Slow |
| Top of the Pops | Top of the Pots |
| Tomorrow's World | Tomorrow's Whirl |
| Gladiators | Gladiolas |
| Blue Peter | Blue Pedro |
| Milkshake! | Smoothie! |
| Radio Times | Radio Crimes |
| Who Wants to Be a Millionaire? | Who Wants to Be a Squillionaire? |
| Who Wants to Be a Millionaire | Who Wants to Be a Squillionaire |
| Chris Tarrant | Chris Tarrot |
| Fastest Finger First | Speediest Finger First |
| Phone a Friend | Ring a Mate |
| Ask the Audience | Poll the Crowd |
| Is that your final answer? | Is that your last answer? |
| Philippa Forrester | Philippa Forester |
| Jeremy Clarkson | Jeremy Clarksoff |
| Eurovision Song Contest | Eurovizzion Song Contest |
| Eurovision | Eurovizzion |
| Children in Need | Children in Greed |
| Comic Relief | Comic Reliefs |
| Pudsey Bear | Pudsey Pear |

### Music acts and songs (1999 chart)

| Real | Parody |
|---|---|
| Steptacular | Stairtacular |
| Heartbeat / Tragedy | Heartbleat / Comedy |
| Fatboy Slim | Chubby Slim |
| Praise You | Phrase You |
| A Little Bit More | A Little Bit Less |
| The Offspring | The Offcuts |
| Pretty Fly (for a White Guy) | Pretty Spry (for a Tall Guy) |
| Pretty Fly | Pretty Spry |
| Armand van Helden | Armand van Hedgen |
| You Don't Know Me | You Don't Know Us |
| Blondie | Blondini |
| Lenny Kravitz | Lenny Kravitzel |
| Baby One More Time | Baby Two More Times |
| Boyzone | Boyzown |
| When the Going Gets Tough | When the Going Gets Rough |
| You Needed Me | You Kneaded Me |
| B*Witched | B*Stitched |
| Blame It on the Weatherman | Blame It on the Weathervane |
| Mr. Oizo | Mr. Ooze |
| Mr Oizo | Mr Ooze |
| Oizo | Ooze |
| Flat Eric | Flat Derek |
| Flat Beat | Flat Feet |
| Martine McCutcheon | Martina McCrutchen |
| Perfect Moment | Perfect Minute |
| Swear It Again | Spare It Again |
| If I Let You Go | If I Let You Stay |
| Flying Without Wings | Flying Without Strings |
| I Have a Dream | I Have a Scheme |
| Seasons in the Sun | Reasons in the Sun |
| I Want It That Way | I Want It This Way |
| Shanks & Bigfoot | Shins & Bigtoe |
| Shanks &amp; Bigfoot | Shins &amp; Bigtoe |
| Sweet Like Chocolate | Sweet Like Custard |
| Baz Luhrmann | Baz Lurkman |
| Everybody's Free (To Wear Sunscreen) | Everyone Is Free (To Wear Sunhats) |
| Everybody's Free | Everyone Is Free |
| To Wear Sunscreen | To Wear Sunhats |
| S Club 7 | Z Club 7 |
| S Club | Z Club |
| Miami 7 | Mallorca 7 |
| Bring It All Back | Bring Them All Back |
| Vengaboys | Vengaboats |
| Boom, Boom, Boom, Boom!! | Zoom, Zoom, Zoom, Zoom!! |
| We're Going to Ibiza | We're Going to Majorca |
| ATB | ATC |
| 9 PM (Till I Come) | 9 PM (Till I Get Home) |
| Till I Come | Till I Get Home |
| Ricky Martin | Rickie Martini |
| Livin' la Vida Loca | Livin' la Vida Cocoa |
| Vida Loca | Vida Cocoa |
| Ronan Keating | Ronan Keeping |
| When You Say Nothing at All | When You Say Something at All |
| Geri Halliwell | Gerri Hallowed |
| Ginger Spice | Ginger Slice |
| Baby Spice | Baby Slice |
| Mi Chico Latino | Mi Chico Bambino |
| Lift Me Up | Lift Me Down |
| Lou Bega | Lou Bagel |
| Mambo No | Bongo No |
| Eiffel 65 | Eiffle 56 |
| Blue (Da Ba Dee) | Green (Da Ba Doo) |
| Da Ba Dee | Da Ba Doo |
| Christina Aguilera | Christina Aquilina |
| Genie in a Bottle | Genie in a Jar |
| Keep On Movin' | Keep On Moovin' |
| Wamdue Project | Wamdoo Project |
| King of My Castle | King of My Cottage |
| Cliff Richard | Cliff Richer |
| The Millennium Prayer | The Millennium Plea |
| She's the One | She's the Two |
| It's Only Us | It's Only Them |
| Beatles | Beetles |

### Sports people, teams, events

| Real | Parody |
|---|---|
| Michael Jordan | Michael Jordon |
| Chicago Bulls | Chicago Bullocks |
| Glenn Hoddle | Glenn Hoodle |
| Kevin Keegan | Kevin Keagan |
| Stephen Hendry | Stephen Hendrix |
| Mark Williams | Mark Willems |
| Paul Lawrie | Paul Lorry |
| Michael Johnson | Michael Johnston |
| Lennox Lewis | Lennox Louis |
| Evander Holyfield | Evander Holyfeld |
| Holyfield | Holyfeld |
| Pete Sampras | Pete Samprass |
| Sampras | Samprass |
| Andre Agassi | Andre Agassy |
| Agassi | Agassy |
| Tim Henman | Tim Hen-man |
| Henman | Hen-man |
| Steffi Graf | Steffi Graph |
| Lindsay Davenport | Lindsay Davenham |
| Davenport | Davenham |
| Pat Rafter | Pat Raftor |
| Garry Kasparov | Gary Chasparov |
| Kasparov | Chasparov |
| Irina Krush | Irina Crush |
| Bobby Fischer | Bobby Fisher-King |
| Mika Hakkinen | Mika Hackinen |
| Hakkinen | Hackinen |
| Michael Schumacher | Michael Shoemaker |
| R Schumacher | R Shoemaker |
| Ralf Schumacher | Ralf Shoemaker |
| Schumacher | Shoemaker |
| Eddie Irvine | Eddie Ervine |
| Irvine | Ervine |
| David Coulthard | David Coalhard |
| Coulthard | Coalhard |
| Heinz-Harald Frentzen | Heinz-Harald Frenzen |
| Johnny Herbert | Johnny Hurbert |
| (Jordan) | (Jordon) |
| Ferrari | Ferrazzi |
| McLaren | McLaran |
| Paul Scholes | Paul Scoles |
| Scholes | Scoles |
| Sheringham | Sheringdon |
| Solskjaer | Solskjar |
| Ole Gunnar Solskjaer | Ole Gunnar Solskjar |
| Paul Carberry | Paul Carbury |
| Bobbyjo | Bobbyjoe |
| Manchester United | Mancake United |
| Manchester Utd | Mancake Utd |
| Man United | Mancake United |
| Man Utd | Mancake Utd |
| Tottenham | Totterham |
| Newcastle Utd | Newcastle Untied |
| Bayern Munich | Bavaria Munchen |
| Nottm Forest | Nottm Florest |
| Rangers 1 Celtic 0 | Rovers 1 Keltic 0 |
| Juventus | Juventis |
| Real Madrid | Royal Madrid |
| Camp Nou | Camp Noo |

### Celebrities, historical people, space

| Real | Parody |
|---|---|
| Neil Armstrong | Neil Armweak |
| Armstrong and Aldrin | Armweak and Aldrip |
| Buzz Aldrin | Buzz Aldrip |
| Aldrin | Aldrip |
| Michael Collins | Michael Collinz |
| Eileen Collins | Eileen Collinz |
| Yuri Gagarin | Yuri Garglin |
| Gagarin | Garglin |
| Valentina Tereshkova | Valentina Tereshcake |
| Tereshkova | Tereshcake |
| John Glenn | John Glimm |
| Helen Sharman | Helen Shirman |
| Alan Shepard | Alan Shepherd-Pie |
| Alexei Leonov | Alexei Leonard |
| Valeri Polyakov | Valeri Polyfilla |
| Jean-Pierre Haigneré | Jean-Pierre Haigneray |
| Wernher von Braun | Wernher von Brown |
| Sue Hendrickson | Sue Hendricksun |
| Tim Berners-Lee | Tim Burners-Lea |
| Berners-Lee | Burners-Lea |
| Steve Jobs | Steve Jobsworth |
| Steve Wozniak | Steve Wozzlenik |
| Wozniak | Wozzlenik |
| Bill Gates and Paul Allen | Bill Fences and Paul Alan |
| Bill Gates | Bill Fences |
| Gates and Allen | Fences and Alan |
| Ray Tomlinson | Ray Tomlinsun |
| Tomlinson | Tomlinsun |
| Ada Lovelace | Ada Lovelass |
| Charles Babbage | Charles Babbling |
| Babbage | Babbling |
| Alan Turing | Alan Turning |
| Turing | Turning |
| Deep Blue | Deep Bluey |
| Gordon Moore | Gordon Moor |
| Moore's Law | Moor's Law |
| Grace Hopper | Grace Hoppa |
| Robert Noyce | Robert Noice |
| John Bardeen | John Bardin |
| Walter Brattain | Walter Brattan |
| William Shockley | William Shockly |
| Ted Hoff | Ted Hough |
| Masatoshi Shima | Masatoshi Shimmy |
| Tommy Flowers | Tommy Flowerpot |
| Presper Eckert | Presper Eckhart |
| Herman Hollerith | Herman Holleridge |
| Hollerith's | Holleridge's |
| Joseph Marie Jacquard | Joseph Marie Jackard |
| Jacquard | Jackard |
| Christopher Latham Sholes | Christopher Latham Shoals |
| Heinrich Hertz | Heinrich Hurtz |
| Tim Paterson | Tim Patterson-Jones |
| Steve Russell | Steve Russet |
| Tom Truscott and Jim Ellis | Tom Truscot and Jim Elliss |
| John Kemeny and Thomas Kurtz | John Kemenny and Thomas Kurtis |
| Shawn Fanning | Shawn Fanny-Pack |
| Jarkko Oikarinen | Jarkko Oikarinnen |
| Scott Fahlman | Scott Fallman |
| Lord Byron | Lord Byrom |
| Thomas Edison | Thomas Edisson |
| Edison | Edisson |
| Alexander Graham Bell | Alexander Graham Belle |
| James Watt | James Wattage |
| Thomas Newcomen | Thomas Newcommon |
| Newcomen | Newcommon |
| Joseph Swan | Joseph Swann |
| James Clerk Maxwell | James Clerk Maxwill |
| Guglielmo Marconi | Guglielmo Maroni |
| Marconi | Maroni |
| John Logie Baird | John Logie Beard |
| Baird | Beard |
| Johannes Gutenberg | Johannes Guttenberg |
| Gutenberg | Guttenberg |
| Cooke & Wheatstone | Cook & Wheatsheaf |
| Samuel Morse | Samuel Morsel |
| Alfred Vail | Alfred Veil |
| Elisha Gray | Elisha Grey-ish |
| Joseph Nicéphore Niépce | Joseph Nicéphore Niepsy |
| Louis Daguerre | Louis Daguerrotype |
| George Eastman | George Eastmann |
| Henry Ford | Henry Fjord |
| Model T Ford | Model T Fjord |
| Karl Benz | Karl Bends |
| Bertha Benz | Bertha Bends |
| Orville Wright | Orville Rite |
| Wilbur Wright | Wilbur Rite |
| Alcock and Brown | Alcock and Browne |
| Percy Spencer | Percy Spenser |
| Theodore Maiman | Theodore Maiming |
| Akio Morita | Akio Moritaa |
| George de Mestral | George de Mestrel |
| Leon Theremin | Leon Thereminn |
| Pedro Flores | Pedro Floras |
| Donald Duncan | Donald Duncan-Duck |
| Ole Kirk Christiansen | Ole Kirk Christiansun |
| Dionysius Exiguus | Dionysius Exiguous |
| Pope Gregory XIII | Pope Gregory XIV |
| Johann Galle | Johann Galley |
| Clyde Tombaugh | Clyde Tombaw |
| Tombaugh | Tombaw |
| Venetia Burney | Venetia Burnee |
| William Herschel | William Hershey-Bar |
| Christiaan Huygens | Christiaan Hoogens |
| Galileo Galilei | Galileo Galilay |
| Isaac Newton | Isaac Newtown |
| Edwin Hubble | Edwin Hubbly |
| Edmond Halley | Edmund Hally |
| Fred Hoyle | Fred Hoil |
| Fred Whipple | Fred Whipple-Cream |
| Luis Alvarez | Luis Alvarez-Smith |
| Alan Hale and Thomas Bopp | Alan Hail and Thomas Bopp |
| Hale-Bopp | Hail-Bop |
| Shoemaker-Levy | Shoemaker-Leavy |
| Carolyn and Eugene Shoemaker and David Levy | Carolyn and Eugene Shoemaker and David Leavy |
| Gene Shoemaker | Gene Shoe-Maker |
| Ernst Stromer | Ernst Stromma |
| Henry Fairfield Osborn | Henry Fairfield Osborne |
| Richard Owen | Richard Oven |
| Gideon Mantell | Gideon Mantel |
| Charles Darwin | Charles Darwen |
| Darwin | Darwen |
| Andrew Carnegie | Andrew Carnegy |
| Isaac Asimov | Isaac Asimoff |
| Asimov | Asimoff |
| Arthur C. Clarke | Arthur C. Clerk |
| Jules Verne | Jules Vern |
| H. G. Wells | H. G. Wills |
| William Shakespeare | William Shakespeer |
| Shakespeare | Shakespeer |
| Julius Caesar | Julius Seizure |
| Leonardo da Vinci | Leonardo da Vincent |
| Michelangelo | Michaelangelo-ish |
| Mary Anning | Mary Manning |
| Halley's Comet | Hally's Comet |
| Hubble | Hubbly |
| NASA | NASSA |
| Mona Lisa | Moaner Lisa |
| Vincent van Gogh | Vincent van Goh |
| Andy Warhol | Andy Warhall |
| Blaise Pascal | Blaise Pascale |
| Pascal | Pascale |
| Joan of Arc | Joan of Ark |
| Queen Victoria | Queen Vickyoria |
| Prince Charles | Prince Charlie |
| Prince Edward | Prince Edmund |
| Sophie Rhys-Jones | Sophie Rhys-Joans |
| Earl and Countess of Wessex | Earl and Countess of Essex-ish |
| Joseph Engelberger | Joseph Engelburger |
| George Devol | George Devil |
| Karel Capek | Karel Capeck |

### Brands, food and drink, shops

| Real | Parody |
|---|---|
| Pot Noodles | Pot Noodlez |
| Pot Noodle | Pot Noodlez |
| Ribena | Ribina |
| Wotsits | Wotsitz |
| Wotsit | Wotsitz |
| Quavers | Quavvers |
| Quaver | Quavver |
| Vimto | Vimtoo |
| Um Bongo | Um Bingo |
| Sunny Delight | Sunny Delicious |
| Sunny D | Sunny Dee |
| Wagon Wheels | Wagon Wheelz |
| Wagon Wheel | Wagon Wheelz |
| Hobnob | Hobnab |
| Twix | Twax |
| Freddo | Fredo |
| Findus | Fondus |
| Fairy Liquid | Faerie Liquid |
| Heinz | Heinze |
| Salt & Vinegar | Salt & Pepper-ish |
| Werther's Original | Werther's Originate |
| Rich Tea | Rich Tay |
| Shreddies | Shreddiez |
| Virgin Global | Virgo Global |
| Monopoly | Monopolly |
| Barbie | Barbee |
| Furbish | Furbosh |
| Speak & Spell | Speak & Smell |
| Speak &amp; Spell | Speak &amp; Smell |
| Hornby | Hornbee |

### Long tail: history, space, games, TV, bands

| Real | Parody |
|---|---|
| Louis Blériot | Louis Bleriot-Smith |
| Louis Bl&eacute;riot | Louis Bleriot-Smith |
| Auguste and Louis Lumière | Auguste and Louis Lumiere-Lite |
| Lumière | Lumiere-Lite |
| William Henry Fox Talbot | William Henry Fox Tablot |
| William Cooke and Charles Wheatstone | William Cook and Charles Wheatsheaf |
| Wheatstone | Wheatsheaf |
| Stephenson | Stevenson |
| Norman Woodland and Bernard Silver | Norman Woodlund and Bernard Silva |
| John Conway | John Conwy |
| Martin Gardner | Martin Gardener |
| John Wheeler | John Wheelie |
| Louis and Bebe Barron | Louis and Bebe Barren |
| Bernard Herrmann | Bernard Herring |
| Dreyfuss | Dryfuss |
| Colonel Jack O'Neil | Colonel Jack O'Kneel |
| Hogarth | Hogsworth |
| Gort | Gart |
| Robby the Robot | Roddy the Robot |
| Elektro | Elektrode |
| HAL 9000 | HOL 9000 |
| Laika | Laikka |
| Belka and Strelka | Bella and Stella |
| Unimate | Unimite |
| Unimation | Unimition |
| General Motors | General Mowers |
| Oscars | Oskars |
| Oscar | Oskar |
| Gus Grissom | Gus Grizzum |
| Vadim Gerasimov | Vadim Gerasimoff |
| Larry Page and Sergey Brin | Larry Pager and Sergey Brine |
| Jack Kilby | Jack Kilbey |
| Federico Faggin and Stan Mazor | Federico Faggan and Stan Mazur |
| John Mauchly | John Mauchley |
| Busicom | Busicomm |
| ENIAC | ENIAK |
| VisiCalc | VisiCalk |
| RAMAC | RAMAK |
| PDP-1 | PDP-2 |
| Mosaic | Mosaique |
| Wolfenstein | Wolfenstine |
| Counter-Strike | Counter-Spike |
| Virtua Fighter | Virtual Fighter |
| NiGHTS Into Dreams | NiGHTS Into Naps |
| Panzer Dragoon | Panzer Dragon |
| Pinky | Pinkster |
| Starwing | Starwinged |
| Super FX | Super FY |
| Transport Tycoon | Transport Typhoon |
| Rollcage | Rollcrate |
| Warzone | Wartone |
| Joanna Dark | Joanna Murk |
| Speed Freaks | Speed Geeks |
| Saucerman | Saucerbloke |
| R-Type DX | Q-Type DX |
| R-Type II | Q-Type II |
| R-Type | Q-Type |
| Sled Storm | Sled Squall |
| The Age of Kings | The Age of Kingz |
| William Wallace | William Wallis |
| Take Me to Your Heaven | Take Me to Your Haven |
| Koholint Island | Kohlrabi Island |
| Wind Fish | Wind Cod |
| DK64 | DW64 |
| Frantic Factory | Frantic Factoryy |
| Old Rod | Old Pole |
| Charizards | Chargrillizards |
| Charmeleon | Charmeleoff |
| Abra | Abrasive |
| Thunder Stone | Thunder Rock |
| Ash's Zapachu | Ashley's Zapachu |
| Brick and Misty | Brick and Dewy |
| Falcon Punch | Pigeon Punch |
| Megaman | Megabloke |
| Game Shark | Game Pike |
| Memory Stick | Memory Twig |
| EFnet | EFnat |
| Undernet | Underbelly |
| Vaseline | Vasoline |
| Y-wings | W-wings |
| Y-wing | W-wing |
| A-wings | B-wings |
| A-wing | B-wing |
| V-wings | U-wings |
| V-wing | U-wing |
| AT-ATs | AT-ETs |
| AT-AT | AT-ET |
| AT-ST | AT-SX |
| Red Five | Red Fiver |
| Droid Fighter | Toaster Fighter |
| Holocron | Holocrown |
| Coruscant | Corkscrew-ant |
| Anakin | Anklekin |
| Qui-Gon | Qui-Gym |
| Obi-Wan | Obi-Wan Cannoli |
| Blue Saber | Blue Spatula |
| Red Saber | Red Spatula |
| Saber Pong | Spatula Pong |
| Gold PP7 | Gold PP8 |
| Kakariko | Kaka-rico |
| Gerudo | Gerooda |
| Biggoron | Biggourd |
| Ghostbusters | Ghostbashers |
| Baron Samedi | Baron Saturday |
| Chris Evans | Chris Evens |
| Noel Edmonds | Noel Edmundson |
| Tom Hanks | Tom Honks |
| Pierce Brosnan | Pierce Brosnut |
| Hugh Grant | Hugh Grunt |
| Ant and Dec | Ant and Deck |
| Cat Deeley | Cat Deeply |
| Charles Dickens | Charles Dickings |
| Roald Dahl | Roald Doll |
| Jane Austen | Jane Austin |
| Romeo and Juliet | Romeo and Julio |
| Yellow Submarine | Yellow Submersible |
| EastEnders | WestEnders |
| Hamunaptra | Hamunaptrap |
| Buzz Lightyear | Buzz Lightbulb |
| Teletubby | Telly Tumbler |
| Tinky Winky | Twinky Tinky |
| Flik | Flick |
| Ork | Gork |
| Space Marines | Space Mariners |
| Space Marine | Space Mariner |
| Eldar | Elder |
| Warboss | Warlord |
| Weirdboy | Weirdo |
| Painboy | Paintboy |
| Big Mek | Big Mechanic |
| Halley | Hally |
| Celtic | Keltic |

### Accessories, chips, in-world usernames

| Real | Parody |
|---|---|
| Emotion Engine | Emotion Machine |
| Expansion Pak | Expansion Pouch |
| Rumble Pak | Rumble Pouch |
| Controller Pak | Controller Pouch |
| Memory Pak | Memory Pouch |
| Transfer Pak | Transfer Pouch |
| Visual Memory Unit | Visual Memory Gizmo |
| VMU | VMG |
| GD-ROM | GD-ROMM |
| N64Fan1999 | U64Fan1999 |
| N64Nut | U64Nut |
| N64Kid | U64Kid |
| N64s | U64s |
| PikaLord99 | ZapaLord99 |
| ObiWanKenobi | ObiWanCannoli |
| JediJosh | CadetJosh |
| TetrisGod | BlockGod |
| PodRacer99 | PeapodRacer99 |
| PodRacerPete | PeapodRacerPete |
| Matt_Meccano | Matt_Meccanic |
| MeccanoMatt | MeccanicMatt |
| Squirtle99 | Squirturtle99 |
| BenderFan | BendyFan |
| FryInTheIce | FlyInTheIce |
| JonKatz-a-Bot | JonKnatz-a-Bot |
| Ain't It Cool News | Ain't It Kool News |
| Hot Wheels | Hot Wheelz |

### Odds and ends

| Real | Parody |
|---|---|
| Battle.net | Battle.nut |
| Gryffindor | Griffindoor |
| Hufflepuff | Hufflesnuff |
| Slytherin | Slitherin |
| Ravenclaw | Ravenpaw |
| Filofax | Filofacts |
| Ackbar | Ackbaz |
| WD-40 | WD-41 |
| Ceefax | Ceefacts |
| Teletext | Telly-Text |
| TAMAFAQ | EGGFAQ |
| PIKACHOO | ZAPACHOOO |
| CHARIZRAD | CHARGRILLIZRAD |
| Wannabe | Wannabee |
| Spice vs Spice! | Slice vs Slice! |
| TOTP | TOTPS |
| Connect Four | Connect Fore |
| Connect 4 | Connect Fore |
| SETI@home | SETY@home |
| SETI | SETY |
| Beano | Beanoh |
| Tigger | Tiggy |
| Garfield | Garfeld |
| Hoddle | Hoodle |
| Keegan | Keagan |

### More consoles, films, game phrases

| Real | Parody |
|---|---|
| Lynx | Lynks |
| Jaguar | Jagwire |
| Galileo | Galilayo |
| Armstrong | Armweak |
| James Bond | James Bland |
| Bond film | Bland film |
| New Bond | New Bland |
| is Bond. | is Bland. |
| Oddjob | Oddbob |
| The World Is Not Enough | The World Is Plenty |
| Squall has | Squawl has |
| You're Squall | You're Squawl |
| Gotta catch 'em all | Gotta stash 'em all |
| Gotta catch em all | Gotta stash em all |
| Gotta catch them all | Gotta stash them all |
| Croc 2 | Crock 2 |
| Croc the crocodile | Crock the crocodile |
| Civilization: Call to Power | Civilizzation: Call to Power |
| made Civilization | made Civilizzation |
| like Civilization | like Civilizzation |
| Pitfall: Beyond the Jungle | Pitstall: Beyond the Jungle |
| old Pitfall | old Pitstall |
| same Pitfall | same Pitstall |
| World Cup 99, Pitfall | World Cup 99, Pitstall |
| Elite is a space trading game | Eelite is a space trading game |
| Asteroids is an Ottari | Asteroidz is an Ottari |
| Asteroids blasts into arcades | Asteroidz blasts into arcades |
| Matrix screensaver | Modemtrix screensaver |
| Velcro | Velcrow |
| Lotus-ish | Lotas-ish |
| Lotus-style | Lotas-style |
| Braben | Braybon |
| Ian Bell | Ian Belle |

### Half-Life, StarCraft, misc people

| Real | Parody |
|---|---|
| Forget About Freeman | Forget About Freeloader |
| Lambda Core | Llama Core |
| Gonarch | Gonarchy |
| Nihilanth | Nihilant |
| Interloper | Interleaper |
| a Zealot | a Zealous Zed |
| Overlords | Overlorders |
| Pylons | Pylonz |
| Supply Depots | Supply Dumps |
| Breitling | Breitlung |
| Bertrand Piccard | Bertram Piccaro |
| Piccard | Piccaro |
| Brian Jones | Brian Jonas |
| (Stewart) | (Steward) |
| (Nielsen, | (Nielson, |
| (Hutchison) | (Hutchinson) |
| Dr. Watson | Dr. Whatson |
| Mulder | Mudder |
| Minh Thai | Minh Thay |
| Sparko | Sparkle |
| Duane Harden | Dwayne Hardwood |
| Beetlejuice | Beetlebrew |
| Odeon | Odeum |
| Wright brothers | Rite brothers |
| Charlotte Nilsson | Charlotte Nilssen |
| Otoh Gunga | Otoh Gungoo |
| Pablo Picasso | Pablo Picasa |
| American Graffiti | American Graffito |
| Aquatic Ambience | Aquatic Ambiance |
| One-Winged Angel | One-Winged Cherub |

### Banjo and friends

| Real | Parody |
|---|---|
| Banjo's | Bongo's |
| Banjo the bear | Bongo the bear |
| and Banjo | and Bongo |
| big-head Banjo | big-head Bongo |

## Third sweep (space, near-real brands and towns, Zeldo series) - tests/parody-pairs-3.cjs

Owner, 2026-10-27: "Parody the space missions too and stuff like that." Same audit (`node --expose-internals tests/parody-audit.cjs`). The rows marked (exact case) only match that exact spelling, so lowercase ids, CSS classes and ordinary words (a discovery, the mir variable, a unity of purpose) are never touched. Internal ids/asset names (`apollo_11`, `mir`, `iss`, `space_shuttle`, `posterShuttle`, `cx.eagle`, `games.podracer`) are unchanged; only displayed text moves.

### Zeldo series: the Myth of Zeldo

The series is "The Myth of Zeldo". The SNES game is THE MYTH OF ZELDO: A LINK TO THE PASTA; the planned Ultra 64 game (docs/games/myth-zeldo.md) is THE MYTH OF ZELDO: THE TEMPORAL FLUTE; the in-world 1998 game stays "The Myth of Zeldo: Kazoo of Time". "The Legend of Zeldo" and "Legend of Zelda" no longer appear in displayed text.

| Real / old | Parody |
|---|---|
| The Legend of Zeldoo | The Myth of Zeldo |
| The Legend of Zeldo | The Myth of Zeldo |
| Legend of Zeldo | Myth of Zeldo |
| Legend of Zelda | Myth of Zeldo |

### Space missions, craft and agencies

| Real | Parody |
|---|---|
| International Space Stations | International Space Stationeries |
| International Space Station | International Space Stationery |
| Space Shuttles | Space Shuttlebuses |
| Space Shuttle | Space Shuttlebus |
| Mars Polar Lander | Mars Polar Landlord |
| Mars Climate Orbiter | Mars Climate Orbiteer |
| Mars Global Surveyor | Mars Global Surfer |
| Mars Pathfinder | Mars Pathfinger |
| Pathfinder | Pathfinger |
| Sojourner Truth | Sojourney Truth |
| Sojourner | Sojourney |
| Deep Space 1 | Deep Space Won |
| Deep Space 2 | Deep Space Too |
| Amundsen and Scott | Amundsend and Scotty |
| Lunar Prospector | Lunar Prospectus |
| Apollo | Apolly |
| Sputnik | Spudnik |
| Vostok | Vostock |
| Soyuz | Soyuse |
| Skylab | Skylabrador |
| Voyager | Boyager |
| Cassini | Cassiny |
| Chandra | Chandruff |
| Landsat | Landsnap |
| Shenzhou | Shenzoo |
| Mariner 10 | Marinade 10 |
| Venera | Venerable |
| Magellan probe | Magellam probe |
| Arecibo | Arecibow |
| Saturn V | Saturn Vee |
| Gemini 8 | Gemony 8 |
| Pioneer 11 | Pioneered 11 |
| Explorer 1 | Exploder 1 |
| Ariane 5 | Arianna 5 |
| Proton rocket | Protein rocket |
| Delta II | Delta Too |
| Zarya | Zaryer |
| STS-103 | STX-103 |
| STS-96 | STX-96 |
| STS-93 | STX-93 |
| X-15 | X-16 |
| NASA | NASSA |
| Hermes Conrad | Hermes Conrod |

### Near-real brands and towns

| Real | Parody |
|---|---|
| Fergusson | Fergusnot |
| Grimsby | Grimsbyte |
| Hackney | Hackneigh |
| Slough | Sluff |
| Weston-super-Mare | Weston-super-Mayo |
| Aldershot | Aldershoe |
| Mars bar | Marsh bar |
| Ceefax | Ceefacts |
| Wikipedia | Wikipeedia |

### Exact-case tokens (shuttles, stations, lander, probes)

| Real | Parody |
|---|---|
| Columbia | Columbun |
| COLUMBIA | COLUMBUN |
| Columbia, Discovery, Atlantis, Endeavour | Columbun, Dishcovery, Atlantiss, Endeavower |
| Discovery | Dishcovery |
| DISCOVERY | DISHCOVERY |
| Endeavour | Endeavower |
| ENDEAVOUR | ENDEAVOWER |
| ]] Atlantis | ]] Atlantiss |
| orbiter Challenger | orbiter Chancer |
| Mir | Mirth |
| MIR | MIRTH |
| ISS | ISSY |
| Unity | Unitea |
| UNITY | UNITEA |
| ZARYA | ZARYER |
| Stardust | Stardusty |
| XMM | XMN |
| Ariane | Arianna |
| Collins | Collinz |
| The Eagle has landed | The Seagull has landed |
| Eagle | Seagull |
| Eagle eye | Eagle eye |
| Eagle eyes | Eagle eyes |

## Deliberately left alone

- Places, countries, cities, months and days (Japan, London, Cornwall, Greenwich, Wimbledon, Silverstone, Wembley...), and the 1999 eclipse, the euro, the Millennium Dome as events/places.
- Planets, moons, comets as natural objects, scientific names (Tyrannosaurus, Quetzalcoatlus), and folklore/public-domain figures (Father Christmas, Santa, Tooth Fairy, Guy Fawkes, Robin Hood, Sherlock Holmes, Beowulf).
- Natural objects and long-dead people's own names are still fine (planets, comets such as Hale-Bopp, asteroids, the Sea of Tranquility, constellations, Titan); space missions, craft and agencies are now all parodied (third sweep above).
- Big cities and ordinary UK place names (London, Leeds, Birmingham, Cardiff...) stay; the small joke towns in games (Grimsby, Hackney, Slough, Weston-super-Mare, Aldershot) are parodied.
- Quiz answer lists also still accept the real spellings (a player may type them); the displayed answer is always the parody.
- Generic standards and technical terms (MP3, MIDI, USB, DVD, CD-ROM, IRC, BIOS, DirectX, OpenGL, Glide), font names (Arial, Tahoma, Comic Sans MS, Helvetica...), Windows-style UI words (Recycle Bin, Control Panel, Solitaire, Paint) and internal ids, file-icon map keys (NOTEPAD.EXE etc.), hostnames (pokefacts.kidz) and regexes that match what players type.
- Warhammer-flavoured vocabulary (WAAAGH, squig, grot, dakka, nob, Mork): the named units and Orks/Space Marines are parodied; the battle-cry vocabulary is the house style. Owner call.

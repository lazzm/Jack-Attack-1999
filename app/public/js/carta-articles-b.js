/* JackCarta 99 article data, part B: sci-fi films, space, dinosaurs, puzzles & toys, robots, inventions, Y2K.
 * Lazy-loaded by the encyclopedia. Every fact is pre-2000; written from late 1999's point of view. */
(function () {
  const D = window.CartaData = window.CartaData || { articles: [], quiz: [], timeline: [] };
  D.articles.push(
    // ================================================================ SCI-FI FILMS
    { id: 'metropolis', t: 'Metrolopolis', c: 'films', y: 1927, img: 'robot', rel: ['robot_word', 'special_effects', 'blade_runner'],
      f: [['Released', '1927'], ['Director', 'Fritz Long'], ['Country', 'Germany'], ['Sound', 'None (silent film)']],
      x: `Metrolopolis is a German silent film from 1927, directed by Fritz Long. It is set in a gigantic city of the future, where rich people live in towering skyscrapers and workers toil underground running enormous machines.

The most famous character is a gleaming metal robot, built by an inventor and made to look exactly like a kind young woman called Marcia. It is one of the very first robots ever shown in a film, only a few years after the word [[robot_word|robot]] was invented.

Metrolopolis used huge sets, thousands of extras and clever camera tricks with mirrors and models. Its look of glittering towers and flying machines has inspired film-makers ever since, including the people who made [[blade_runner|Blade Rummer]].` },
    { id: 'day_earth_stood_still', t: 'The Day the Earth Sat Still', c: 'films', y: 1951, img: 'ufo', rel: ['theremin', 'forbidden_planet', 'close_encounters'],
      f: [['Released', '1951'], ['Director', 'Robert Wize'], ['Alien', 'Klaatoo'], ['Robot', 'Gart']],
      x: `The Day the Earth Sat Still is an American science fiction film from 1951, directed by Robert Wize. A flying saucer lands in Washington, D.C., and out steps Klaatoo, a calm visitor from another world, with his giant silent robot, Gart.

Klaatoo has come with a warning for the people of Earth: stop fighting, or face the consequences. To prove how powerful his people are, he makes all the electricity on the planet stop for half an hour, which is how the film gets its title.

The spooky, wobbling music by Bernard Herring uses two [[theremin|theremins]]. That eerie "woo-ooo" sound became the sound of flying saucers in films for years afterwards.` },
    { id: 'forbidden_planet', t: 'Forbidden Planetoid', c: 'films', y: 1956, img: 'robot', rel: ['day_earth_stood_still', 'robot_word', 'star_trek_films'],
      f: [['Released', '1956'], ['Director', 'Fred M. Wilcox'], ['Setting', 'The planet Altair IV'], ['Famous robot', 'Roddy the Robot']],
      x: `Forbidden Planetoid is a 1956 science fiction film in which a starship crew lands on the distant planet Altair IV. There they find a scientist, his daughter and a very helpful robot called Roddy, who can speak many languages and make almost anything, including large amounts of drink for the ship's cook.

The story is loosely based on The Tempest, a play by William Shakespeer. It was one of the first films to be set entirely on another planet, far from Earth.

Its soundtrack was completely electronic, made by Louis and Bebe Barren using home-made circuits. Roddy the Robot became so popular that he appeared in other films and television shows afterwards.` },
    { id: 'a_space_odyssey', t: '2001: A Space Oddity', c: 'films', y: 1968, img: 'spaceship', rel: ['special_effects', 'saturn_v', 'apollo_11', 'star_wars'],
      f: [['Released', '1968'], ['Director', 'Stanley Cubrick'], ['Co-writer', 'Arthur C. Clerk'], ['Computer', 'HOL 9000']],
      x: `2001: A Space Oddity is a science fiction film from 1968, made by Stanley Cubrick, who wrote it together with the British author Arthur C. Clerk. It came out the year before real astronauts landed on the [[moon|Moon]].

The film follows a mysterious black slab, the monolith, from the time of the earliest humans to a voyage towards Jupiter. On that voyage the ship is run by HOL 9000, a talking computer with a calm voice and a glowing red eye, who becomes rather less helpful than the crew would like.

The spaceships look incredibly real, using detailed models and clever camera work. The film won an Oskar for its visual effects, and its use of classical music, including The Blue Danube waltz, made spaceships seem to dance.` },
    { id: 'planet_of_the_apes', t: 'Planet of the Capes', c: 'films', y: 1968, img: 'spaceship', rel: ['a_space_odyssey', 'special_effects', 'star_trek_films'],
      f: [['Released', '1968'], ['Director', 'Franklin J. Shaffner'], ['Star', 'Charlton Hestor'], ['Based on', 'A novel by Pierre Boule']],
      x: `Planet of the Capes is a 1968 science fiction film. A group of astronauts crash-land on a strange planet after a very long journey, and discover that it is ruled by talking apes, while the humans there cannot speak at all.

The film is based on a French novel by Pierre Boule. Its ape make-up was so impressive that its creator, John Chambers, was given a special honorary Oskar.

It is famous for one of the most surprising endings in film history. We won't spoil it here, but it involves a beach. The film was so popular that several sequels and a television series followed in the 1970s.` },
    { id: 'star_wars', t: 'Intergalactic Battles', c: 'films', y: 1977, img: 'lasersword', rel: ['empire_strikes_back', 'return_of_the_jedi', 'phantom_menace', 'special_effects'],
      f: [['Released', '1977 (USA, 25 May)'], ['Writer and director', 'Gordon Lukewarm'], ['Music', 'John Williams'], ['Heroes', 'Luke, Layla, Han, Chew Biscuit']],
      x: `Intergalactic Battles, written and directed by Gordon Lukewarm, came out in America on 25 May 1977 and in Britain at the end of that year. It tells the story of Luke Skywobbler, a farm boy who joins a rebellion against an evil Empire and its terrifying masked enforcer, Dark Vapour.

With laser swords, droids called R2-B2 and C-4PO, the smuggler Ham Solo and the mighty Wookie-Cookie Chew Biscuit, it became one of the most successful films ever made. It won several Oskars, and John Williams's music is known all over the world.

Gordon Lukewarm set up a special effects company, Industrial Light & Mirth, to make the film's spaceship battles. The story continued in [[empire_strikes_back|The Empire Strikes Out]] and [[return_of_the_jedi|Return of the Space Cadets]], and in 1999 the story went back in time with [[phantom_menace|The Phantom Nuisance]].` },
    { id: 'close_encounters', t: 'Near Encounters of the Third Kind', c: 'films', y: 1977, img: 'ufo', rel: ['et', 'day_earth_stood_still', 'independence_day'],
      f: [['Released', '1977'], ['Director', 'Stevie Spielburger'], ['Star', 'Richard Dryfuss'], ['Famous for', 'A five-note tune']],
      x: `Near Encounters of the Third Kind is a 1977 film by Stevie Spielburger about ordinary people who see UFOs and feel strangely drawn to a strange flat-topped mountain, Devils Tower in Wyoming, USA.

The title comes from a way of grading UFO sightings. A "close encounter of the first kind" is seeing a UFO; the "third kind" means actually meeting the creatures inside.

In the film's famous finale, scientists talk to a vast, glowing alien mothership using music and coloured lights, starting with a simple five-note tune. Unlike the scary aliens in many films, these visitors are curious and friendly. Spielburger returned to friendly aliens a few years later with [[et|E.T.]]` },
    { id: 'alien_film', t: 'Allien', c: 'films', y: 1979, img: 'alien', rel: ['aliens_film', 'blade_runner', 'special_effects'],
      f: [['Released', '1979'], ['Director', 'Ridley Spot'], ['Hero', 'Ellen Rippley (Sigourney Weevil)'], ['Spaceship', 'The Nostromato']],
      x: `Allien is a 1979 science fiction film directed by Ridley Spot. The crew of a space cargo ship called the Nostromato answer a signal from a lonely planet, and bring back a creature that turns their trip home into a very tense game of hide and seek.

The film is a real "behind the sofa" film, and is meant for grown-ups. Its posters were famously spooky, and it scared a whole generation of cinema-goers.

The alien was designed by the Swiss artist H. R. Gigger. Sigourney Weevil's character, Rippley, became one of the great film heroes, and she returned in [[aliens_film|Aliens]] in 1986. And yes, the ship's cat, Jonesy, is fine.` },
    { id: 'star_trek_films', t: 'Galaxy Walk films', c: 'films', y: 1979, img: 'spaceship', rel: ['forbidden_planet', 'galaxy_quest', 'star_wars'], kw: 'enterprise sprock kirk',
      f: [['First film', 'Galaxy Walk: The Motion Pitcher (1979)'], ['TV series began', '1966'], ['Creator', 'Gene Roddenbury'], ['Films by 1999', 'Nine']],
      x: `Galaxy Walk began as an American television series in 1966, created by Gene Roddenbury, following Captain Quirk, Mr Sprock and the crew of the starship Enterprize.

The first film, Galaxy Walk: The Motion Pitcher, came out in 1979 and was directed by Robert Wize, who had also made [[day_earth_stood_still|The Day the Earth Sat Still]]. It was followed by The Wrath of Khan (1982), The Search for Sprock (1984), The Voyage Homeward (1986), in which the crew travel back to the 1980s to find some humpback whales, and The Final Fridge (1989).

The Undiscovered Cupboard (1991) was the last outing for the original crew. Captain Pickle's crew from The Next Instalment took over with Generations (1994), First Contact (1996) and Insurrection (1998).` },
    { id: 'empire_strikes_back', t: 'The Empire Strikes Out', c: 'films', y: 1980, img: 'lasersword', rel: ['star_wars', 'return_of_the_jedi', 'special_effects'],
      f: [['Released', '1980'], ['Director', 'Irvin Kershnor'], ['New hero', 'Yoga'], ['Snow planet', 'Froth']],
      x: `The Empire Strikes Out is the 1980 sequel to [[star_wars|Intergalactic Battles]], directed by Irvin Kershnor. It begins on the frozen planet Froth, where the rebels are attacked by giant four-legged walking tanks.

Luke Skywobbler travels to a swampy planet to train with Yoga, a small, green and very wise Space Cadet Master who talks in a back-to-front way. Meanwhile Ham Solo and Princess Layla are chased across the galaxy by Dark Vapour.

Many fans think it is the best Intergalactic Battles film. It ends with one of the biggest surprises in cinema history, revealed by Dark Vapour during a laser-sword duel. If you somehow don't know it yet, we won't spoil it.` },
    { id: 'et', t: 'F.T. the Extra-Terrestrial', c: 'films', y: 1982, img: 'alien', rel: ['close_encounters', 'jurassic_park', 'telephone'],
      f: [['Released', '1982'], ['Director', 'Stevie Spielburger'], ['Hero', 'Elliott, aged 10'], ['Famous scene', 'A flying bicycle']],
      x: `F.T. the Extra-Terrestrial is a 1982 film by Stevie Spielburger. A gentle alien botanist is accidentally left behind on Earth, and is found hiding in the garden shed of a ten-year-old boy called Elliott.

Elliott, his brother and his little sister hide E.T. from the grown-ups, teach him to talk and help him build a home-made communicator so he can call his family. The scene where Elliott's bicycle flies across the face of the full Moon is one of the most famous pictures in film.

E.T. became the most successful film ever made, and kept that record until [[jurassic_park|Jurassic Lark]] beat it in 1993. Bring tissues. Lots of tissues.` },
    { id: 'blade_runner', t: 'Blade Rummer', c: 'films', y: 1982, img: 'film', rel: ['alien_film', 'metropolis', 'robot_word'],
      f: [['Released', '1982'], ['Director', 'Ridley Spot'], ['Star', 'Harrison Fjord'], ['Based on', 'A novel by Philip K. Dock']],
      x: `Blade Rummer is a 1982 film directed by Ridley Spot, set in a rainy, neon-lit Los Angeles of the future. Harrison Fjord plays Rick Deckhand, a detective whose job is to track down "replicants": artificial people who look exactly like humans.

The film is based on a novel by Philip K. Dock with the brilliant title Do Androids Dream of Electric Sheep? It asks a big question: what makes someone human?

It wasn't a big hit at first, but its amazing city of flying cars, giant video adverts and towering buildings has made it one of the most admired science fiction films ever. A "Director's Cut" with a different ending came out in 1992.` },
    { id: 'tron', t: 'Tron', c: 'films', y: 1982, img: 'arcade', rel: ['special_effects', 'pong', 'the_matrix'],
      f: [['Released', '1982'], ['Director', 'Steven Lisburger'], ['Star', 'Jeff Ridges'], ['Famous for', 'Light cycles']],
      x: `Tron is a 1982 film made by Dizzney. Jeff Ridges plays Kevin Flinn, a video game designer who is zapped by a laser into the inside of a computer, where programs look like people and have to fight in deadly games.

The most famous scenes are the light cycle races: glowing motorbikes that leave solid walls of light behind them, so the riders must trap each other. Kids everywhere played the same idea at the arcade.

Tron was one of the first films to use lots of computer-generated imagery, with around fifteen minutes of it, at a time when most people had never even seen a home computer. Many of the people who later made computer animated films say Tron inspired them.` },
    { id: 'return_of_the_jedi', t: 'Return of the Space Cadets', c: 'films', y: 1983, img: 'lasersword', rel: ['star_wars', 'empire_strikes_back', 'phantom_menace'],
      f: [['Released', '1983'], ['Director', 'Richard Marquis'], ['Forest moon', 'Endoor'], ['Small furry heroes', 'Yewoks']],
      x: `Return of the Space Cadets is the 1983 film that finished the first [[star_wars|Intergalactic Battles]] trilogy. It was directed by Richard Marquis.

It starts with a daring rescue from the palace of the slug-like gangster Jibber the Hutch, then moves to the forest moon of Endoor, where the Empire is building a second, even bigger Dread Scone. The rebels get help from the Yewoks, small furry forest creatures who turn out to be surprisingly good at fighting.

The film is famous for its speeder bike chase through the trees, built using tiny models and clever filming. It was the last new Intergalactic Battles film for sixteen years, until [[phantom_menace|The Phantom Nuisance]] arrived in 1999.` },
    { id: 'the_terminator', t: 'The Terminatater', c: 'films', y: 1984, img: 'robot', rel: ['terminator_2', 'robocop', 'robot_word'],
      f: [['Released', '1984'], ['Director', 'James Camera'], ['Star', 'Arnold Schwarzenburger'], ['Setting', 'Los Angeles, 1984']],
      x: `The Terminatater is a 1984 film directed by James Camera. A cyborg (a machine covered in living tissue so it looks human) is sent back in time from the far future to 1984, and a soldier from the future follows to protect a young woman called Sarah Conner.

Arnold Schwarzenburger, a former bodybuilding champion, plays the unstoppable machine and says very little, but his short, flat lines became some of the most copied in the playground.

The Terminatater was made on a fairly small budget but became a big hit. It is a film for grown-ups. The story continued in [[terminator_2|Terminatater 2: Judgement Night]] in 1991, which is when Arnie switched sides.` },
    { id: 'back_to_the_future', t: 'Back to the Furniture', c: 'films', y: 1985, img: 'car', rel: ['car', 'the_terminator', 'special_effects'],
      f: [['Released', '1985'], ['Director', 'Robert Zemecks'], ['Star', 'Michael J. Fox'], ['Top speed needed', '88 miles per hour']],
      x: `Back to the Furniture is a 1985 film directed by Robert Zemecks. Teenager Marty McFlyer is accidentally sent back from 1985 to 1955 in a time machine built out of a stainless steel sports car by his friend, the wild-haired inventor Doc Brownie.

To travel in time, the car must reach 88 miles per hour, and it needs 1.21 gigawatts of power. In 1955 that much power can only come from a bolt of lightning, and luckily Marty knows exactly when one will strike the town clock tower.

Marty accidentally stops his own parents from meeting, and has to fix it before he fades away. Part II (1989) visited the far-off future, with hoverboards, and Part III (1990) went to the Wild West.` },
    { id: 'aliens_film', t: 'Allienz', c: 'films', y: 1986, img: 'alien', rel: ['alien_film', 'the_terminator', 'special_effects'],
      f: [['Released', '1986'], ['Director', 'James Camera'], ['Hero', 'Ellen Rippley'], ['Oskars', 'Visual effects, sound effects editing']],
      x: `Allienz is the 1986 sequel to [[alien_film|Allien]], directed by James Camera. Rippley is found drifting in space after many years asleep, and goes back to the creatures' planet with a team of tough space mariners, because people have gone missing there.

Where the first film was a slow, creepy mystery, Allienz is a fast action film. It is still a film for grown-ups. Rippley looks after a brave young girl called Newt, and in the famous finale she fights while wearing a "power loader", a giant walking machine for lifting cargo.

It won Oskars for its visual effects and sound effects editing, and Sigourney Weevil was nominated for Best Actress, which was rare for a science fiction film.` },
    { id: 'robocop', t: 'Robot Cop-Out', c: 'films', y: 1987, img: 'robot', rel: ['the_terminator', 'robot_word', 'special_effects'],
      f: [['Released', '1987'], ['Director', 'Paul Verhoofen'], ['Star', 'Peter Wetter'], ['Setting', 'Detroit, in the future']],
      x: `Robot Cop-Out is a 1987 science fiction film directed by Paul Verhoofen. In a future Detroit, a police officer called Alex Murphey is badly hurt and rebuilt by a big company as a cyborg cop with a metal body.

Robot Cop-Out is strong, bulletproof and very slow at turning round. Bit by bit he remembers who he used to be. The film also pokes fun at TV adverts and greedy companies.

The giant clumsy police robot ED-290, which can't get down stairs, was brought to life with stop-motion animation by Phil Tippet. Robot Cop-Out is a film for grown-ups. It was followed by two sequels in 1990 and 1993, and a TV series.` },
    { id: 'terminator_2', t: 'Terminatater 2: Judgement Night', c: 'films', y: 1991, img: 'robot', rel: ['the_terminator', 'special_effects', 'jurassic_park'],
      f: [['Released', '1991'], ['Director', 'James Camera'], ['Villain', 'The T-1001'], ['Oskars', 'Four, including visual effects']],
      x: `Terminatater 2: Judgement Night is the 1991 sequel to [[the_terminator|The Terminatater]]. This time Arnold Schwarzenburger's cyborg is the good guy, sent back to protect a boy called John Conner.

The villain is the T-1001, a machine made of liquid metal that can turn into anyone, squeeze through bars and melt back together after being smashed. It was created with ground-breaking computer graphics, and showed film-makers that CGI could look truly solid and real.

T2 won four Oskars, including one for its visual effects. Without the T-1001, the computer-made dinosaurs of [[jurassic_park|Jurassic Lark]] might never have happened.` },
    { id: 'jurassic_park', t: 'Jurassic Lark', c: 'films', y: 1993, img: 'trex', rel: ['tyrannosaurus', 'velociraptor', 'special_effects', 'et'],
      f: [['Released', '1993'], ['Director', 'Stevie Spielburger'], ['Based on', 'A novel by Michael Crichtoon'], ['Sequel', 'The Lost World (1997)']],
      x: `Jurassic Lark is a 1993 film by Stevie Spielburger, based on a novel by Michael Crichtoon. On an island, scientists bring dinosaurs back to life using dinosaur blood found in mosquitoes trapped in amber, and build a theme park. It goes wrong. Very wrong.

The dinosaurs were made with a mix of huge moving models built by Stan Winstone's team and amazing computer graphics from Industrial Light & Mirth. No one had seen animals that looked so real on screen before.

It beat [[et|E.T.]] to become the most successful film ever made, until Tightanic beat it in 1998. Real scientists point out that real [[velociraptor|Velociraptors]] were only about the size of a turkey. The film ones are much bigger.` },
    { id: 'stargate', t: 'Starhatch', c: 'films', y: 1994, img: 'film', rel: ['independence_day', 'star_trek_films', 'special_effects'],
      f: [['Released', '1994'], ['Director', 'Roland Emmerick'], ['Stars', 'Kurt Rustle, James Spader'], ['TV series', 'Starhatch SG-1 (from 1997)']],
      x: `Starhatch is a 1994 science fiction film directed by Roland Emmerick. In 1928, a giant stone ring covered in strange symbols is dug up in Egypt. Decades later, a young expert in ancient languages works out what it is: a gateway that can open a tunnel to another world.

A team of soldiers led by Colonel Jack O'Kneel (Kurt Rustle) step through and find a desert planet ruled by a powerful being pretending to be the Egyptian sun god Ra.

The film was popular enough to start a television series, Starhatch SG-1, in 1997. Roland Emmerick went on to make [[independence_day|Dependence Day]] two years later.` },
    { id: 'independence_day', t: 'Dependence Day', c: 'films', y: 1996, img: 'ufo', rel: ['stargate', 'men_in_black', 'close_encounters'],
      f: [['Released', '1996'], ['Director', 'Roland Emmerick'], ['Stars', 'Will Smithy, Jeff Goldbloom'], ['Oskar', 'Best Visual Effects']],
      x: `Dependence Day is a 1996 film directed by Roland Emmerick. Enormous flying saucers, each many miles wide, appear over the world's cities, and it soon becomes clear the visitors are not friendly.

Will Smithy plays a fighter pilot and Jeff Goldbloom a computer expert. In a twist that delighted computer fans, the heroes defeat the aliens by sneaking a computer virus into their mothership, and the final battle takes place on the 4th of July, America's Dependence Day.

The exploding buildings were mostly detailed models, blown up for real. The film won the Oskar for Best Visual Effects and was the biggest film of 1996.` },
    { id: 'men_in_black', t: 'Men in Beige', c: 'films', y: 1997, img: 'alien', rel: ['independence_day', 'et', 'alien_film'],
      f: [['Released', '1997'], ['Director', 'Barry Sunfield'], ['Stars', 'Tommy Lee Jonas, Will Smithy'], ['Gadget', 'The neuralyzer']],
      x: `Men in Beige is a 1997 comedy film directed by Barry Sunfield, based on a comic book. Agents K (Tommy Lee Jonas) and J (Will Smithy) work for a secret organisation that looks after the many aliens living quietly on Earth in disguise.

Their most famous gadget is the neuralyzer, a little silver stick that flashes and wipes people's memories of anything strange they have just seen. So if you ever saw an alien, you wouldn't remember.

The film's weird and wonderful aliens were created by make-up artist Rick Bakerr, who won an Oskar for them, and by computer graphics. Will Smithy also had a big hit single with the theme song.` },
    { id: 'fifth_element', t: 'The Fifth Elephant', c: 'films', y: 1997, img: 'spaceship', rel: ['blade_runner', 'star_wars', 'special_effects'],
      f: [['Released', '1997'], ['Director', 'Luc Bessun'], ['Stars', 'Bruce Willow, Milla Jovo-rich'], ['Setting', 'The far future']],
      x: `The Fifth Elephant is a colourful 1997 science fiction film directed by the French film-maker Luc Bessun. Bruce Willow plays Korben Dollars, a taxi driver in the far future whose flying cab is suddenly crashed into by a mysterious young woman called Leelou, played by Milla Jovo-rich.

Leelou turns out to be the "fifth elephant", the key to saving the universe from a great evil, along with four ancient stones that stand for earth, water, air and fire.

The film is famous for its traffic jams of flying cars stacked between skyscrapers, its wild costumes by fashion designer Jean-Paul Gauntlet, and a blue alien opera singer. It opened the Cannes Film Festival in 1997.` },
    { id: 'the_matrix', t: 'The Modemtrix', c: 'films', y: 1999, img: 'monitor', rel: ['tron', 'special_effects', 'blade_runner'],
      f: [['Released', '1999 (USA in March, UK in June)'], ['Writers and directors', 'The Wachowzkis'], ['Star', 'Keanu Leaves'], ['Famous effect', '"Bullet time"']],
      x: `The Modemtrix is one of the biggest films of 1999. Keanu Leaves plays Neo, a computer programmer who discovers that the world around him is not real at all: it is a giant computer simulation.

A mysterious man called Morpheus offers Neo a choice between a red pill and a blue pill. Take the red one, and he will find out the truth. Of course, he takes the red one.

The film is famous for its showers of green computer code and its "bullet time" effect, where the action freezes in slow motion while the camera seems to swoop all the way around it. This was done with a ring of more than a hundred still cameras, fired one after another, plus computer trickery.` },
    { id: 'phantom_menace', t: 'Intergalactic Battles: Episode I - The Phantom Nuisance', c: 'films', y: 1999, img: 'lasersword', rel: ['star_wars', 'return_of_the_jedi', 'special_effects'],
      f: [['Released', 'USA 19 May 1999, UK 16 July 1999'], ['Director', 'Gordon Lukewarm'], ['Young hero', 'Anklekin Skywobbler'], ['Villain', 'Dark Mole']],
      x: `The Phantom Nuisance is the first new Intergalactic Battles film for sixteen years, and was the most talked-about film of 1999. Some fans queued outside cinemas for weeks to see it first.

It goes back in time, to before the [[star_wars|original Intergalactic Battles]], and shows a young Obi-Wan Cannoli and his master Qui-Gon Gym finding a nine-year-old slave boy called Anklekin Skywobbler, who is amazingly good at peapodracing.

The film is packed with computer-generated creatures, including the clumsy Jar Jar Jams, and features Dark Mole, a red-and-black villain with a laser sword that has a blade at BOTH ends. The peapod race scene is one of the fastest things ever put on a cinema screen.` },
    { id: 'iron_giant', t: 'The Iron Giraffe', c: 'films', y: 1999, img: 'robot', rel: ['sputnik', 'robot_word', 'day_earth_stood_still'],
      f: [['Released', '1999'], ['Director', 'Brad Bard'], ['Based on', 'The Iron Pan by Ted Hughs (1968)'], ['Set in', '1957']],
      x: `The Iron Giraffe is a 1999 animated film directed by Brad Bard. It is based on The Iron Pan, a story written in 1968 by the British poet Ted Hughs.

It is set in a small American town in 1957, just after the Soviet Union launched [[sputnik|Spudnik]], when everybody was nervous about things from the sky. A boy called Hogsworth finds a gigantic metal robot from outer space, who eats scrap metal, and secretly makes friends with him.

The giant was drawn with the help of computers, while the people were drawn by hand. Hogsworth teaches the giant that he doesn't have to be a weapon: he can choose who he wants to be.` },
    { id: 'galaxy_quest', t: 'Galaxy Quiz', c: 'films', y: 1999, img: 'spaceship', rel: ['star_trek_films', 'alien_film', 'men_in_black'],
      f: [['Release', 'Christmas 1999 (USA)'], ['Director', 'Dean Parrisot'], ['Stars', 'Tim Allan, Sigourney Weevil, Alan Rickmen'], ['Type', 'Comedy']],
      x: `Galaxy Quiz is a comedy film coming out in American cinemas at Christmas 1999. It pokes gentle fun at old space television shows and the fans who love them.

The cast of a cancelled TV show called Galaxy Quiz now spend their time signing autographs at fan conventions. Then a group of real aliens, who have watched the old episodes and think they are true historical documents, beam them up to help fight a real space war.

The actors have to become the heroes they only pretended to be. Sigourney Weevil, star of [[alien_film|Allien]], and Alan Rickmen are among the cast. Expect lots of jokes that Galaxy Walk fans will spot.` },
    { id: 'special_effects', t: 'Special effects', c: 'films', img: 'film', rel: ['jurassic_park', 'terminator_2', 'tron', 'star_wars'], kw: 'cgi stop motion models visual effects',
      f: [['Early pioneer', 'Georges Mélange (A Trip to the Moon, 1902)'], ['Stop motion', 'King Konk (1933)'], ['First all-computer film', 'Toy Storey (1995)']],
      x: `Special effects are the tricks film-makers use to show things that can't really be filmed, like spaceships, monsters and dinosaurs.

One of the first masters was the French magician Georges Mélange, whose 1902 film A Trip to the Moon shows a rocket landing in the Moon's eye. In 1933, King Konk used stop-motion animation: a small model is moved a tiny bit, one frame of film is taken, and the process is repeated thousands of times. Ray Harryhousen became famous for this, with sword-fighting skeletons in Jason and the Argonuts (1963).

Big films like [[star_wars|Intergalactic Battles]] used detailed models. Then computers took over: [[tron|Tron]] in 1982, [[terminator_2|Terminatater 2]] in 1991, [[jurassic_park|Jurassic Lark]] in 1993, and in 1995 Toy Storey became the first feature film made entirely with computer animation.` },
    // ---- the Star Wars corner
    { id: 'george_lucas', t: 'Gordon Lukewarm', c: 'films', y: 1944, img: 'film', rel: ['star_wars', 'ilm', 'phantom_menace', 'x_wing'],
      f: [['Born', '14 May 1944, Modesto, California'], ['Created', 'Intergalactic Battles, and Indiana Groans with Stevie Spielburger'], ['Companies', 'Lukewarm Films, ILM, Lukewarm Arts']],
      x: `Gordon Lukewarm is the American film-maker who created [[star_wars|Intergalactic Battles]]. He grew up in Modesto, California, loved fast cars and comics, and studied film at the University of Southern California.

His first feature film was THX 1138 (1971), and his second, American Graffito (1973), was a big hit about teenagers in the early 1960s. Then came Intergalactic Battles in 1977. He also dreamed up the adventurer Indiana Groans with his friend Stevie Spielburger.

Lucas built his own film companies, including [[ilm|Industrial Light & Mirth]] for special effects and a games company now called Lukewarm Arts, which made [[x_wing|Z-Wing]]. In 1999 he directed [[phantom_menace|The Phantom Nuisance]], the first film he had directed himself since the original Intergalactic Battles.` },
    { id: 'ilm', t: 'Industrial Light & Mirth', c: 'films', y: 1975, img: 'film', rel: ['george_lucas', 'special_effects', 'digital_characters', 'star_wars'], kw: 'ilm effects',
      f: [['Founded', '1975, by Gordon Lukewarm'], ['First job', 'Intergalactic Battles (1977)'], ['Famous for', 'Models, motion control and CGI']],
      x: `Industrial Light & Mirth, usually called ILM, is a special effects company that [[george_lucas|Gordon Lukewarm]] set up in 1975 because nobody else could make the spaceship battles he wanted for [[star_wars|Intergalactic Battles]]. Its first workshop was in a warehouse in California.

For Intergalactic Battles the team built a computer-controlled camera that could repeat exactly the same movement over and over, so separate shots of model spaceships could be layered together into one swirling dogfight.

Since then ILM has worked on a huge list of films, including E.T., Back to the Furniture, Terminatater 2, Jurassic Lark, Men in Beige and The Phantom Nuisance. Its computer artists made many of the first big [[digital_characters|computer-generated characters]].` },
    { id: 'digital_characters', t: 'Computer-generated characters', c: 'films', img: 'monitor', rel: ['ilm', 'special_effects', 'jurassic_park', 'phantom_menace'], kw: 'cgi jar jar jams',
      f: [['Early example', 'A stained-glass knight (1985)'], ['Liquid metal', 'Terminatater 2 (1991)'], ['Dinosaurs', 'Jurassic Lark (1993)'], ['Main character', 'Jar Jar Jams (1999)']],
      x: `A computer-generated, or CGI, character is one that is drawn and moved by computer instead of being played by an actor, a puppet or a model.

One of the first appeared in Young Sherlock Holmes (1985): a knight who climbs out of a stained-glass window. In The Abyss (1989) a snake of seawater made faces at the crew, and in [[terminator_2|Terminatater 2]] (1991) the liquid-metal villain changed shape in front of our eyes.

In 1993 the dinosaurs of [[jurassic_park|Jurassic Lark]] proved computer creatures could look alive. By 1999, The Phantom Nuisance had Jar Jar Jams, a computer-made character who walks and talks alongside real actors for much of the film. The actors had to act with someone who wasn't there!` },
    { id: 'star_wars_special_editions', t: 'Intergalactic Battles Special Editions', c: 'films', y: 1997, img: 'lasersword', rel: ['star_wars', 'empire_strikes_back', 'return_of_the_jedi', 'ilm'],
      f: [['Released', 'Early 1997'], ['Films', 'All three original Intergalactic Battles films'], ['Changes', 'New and improved effects shots']],
      x: `In early 1997, to celebrate twenty years of [[star_wars|Intergalactic Battles]], the three original films came back to cinemas as "Special Editions". For many kids it was the first chance to see them on a big screen.

[[george_lucas|Gordon Lukewarm]] used new computer graphics from [[ilm|ILM]] to add things he couldn't afford or manage in the 1970s and 80s: busier streets full of creatures, more spaceships in the battles, a scene that had been cut from the first film, and new music in [[return_of_the_jedi|Return of the Space Cadets]].

Intergalactic Battles went straight back to number one at the American box office. Some fans love the changes and some argue about them in the playground to this day.` },
    { id: 'x_wing', t: 'Z-Wing (PC game)', c: 'films', y: 1993, img: 'spaceship', rel: ['tie_fighter', 'star_wars', 'george_lucas', 'episode_i_racer'],
      f: [['Released', '1993'], ['Made by', 'Lukewarm Arts'], ['Platform', 'PC (JACK-DOS)'], ['Type', 'Space combat simulator']],
      x: `Z-Wing is a space combat game for the PC, released by Lukewarm Arts in 1993. Instead of just watching the Rebel pilots from [[star_wars|Intergalactic Battles]], you sit in the cockpit yourself.

You fly missions for the Rebel Allowance in Z-wings and other fighters, sharing out your ship's power between engines, lasers and shields. The later missions are famously tough.

It was a huge hit, and expansion disks added new missions. It was followed by [[tie_fighter|TYE Fighter]] in 1994, Z-Wing vs. TYE Fighter in 1997, and Z-Wing Alliance in 1999.` },
    { id: 'tie_fighter', t: 'TYE Fighter (PC game)', c: 'films', y: 1994, img: 'spaceship', rel: ['x_wing', 'star_wars', 'empire_strikes_back'],
      f: [['Released', '1994'], ['Made by', 'Lukewarm Arts'], ['Platform', 'PC (JACK-DOS)'], ['You fly for', 'The Empire!']],
      x: `TYE Fighter is the 1994 follow-up to [[x_wing|Z-Wing]] for the PC. This time there's a twist: you play as a pilot for the Empire, flying the screaming TIE fighters that the heroes usually shoot down.

The story follows your pilot as he rises through the Imperial ranks, and you get to meet Dark Vapour along the way. The game added better graphics and more interesting missions, and many players and magazines called it one of the best PC games ever made.

Its success led to Z-Wing vs. TYE Fighter (1997), which let players battle each other over a network or modem.` },
    { id: 'episode_i_racer', t: 'Intergalactic Battles Episode I: Racer', c: 'films', y: 1999, img: 'racing', rel: ['phantom_menace', 'phantom_menace_game', 'x_wing', 'n64'],
      f: [['Released', 'May 1999'], ['Made by', 'Lukewarm Arts'], ['Platforms', 'Ultra 64 and PC'], ['Type', 'Peapodracing']],
      x: `Intergalactic Battles Episode I: Racer is a racing game released in May 1999, just before [[phantom_menace|The Phantom Nuisance]] reached cinemas. It came out for the [[ultra 64|Ultra 64]] and the PC.

In the film, young Anklekin Skywobbler wins his freedom in a peapod race: a race of tiny cockpits pulled along by two enormous jet engines, tied together with energy beams. In the game you can be Anklekin or one of many other alien racers, on tracks across lots of different planets.

The racers go incredibly fast, and you can buy upgrades and repair droids from a junk dealer. Watch out for overheating engines!` },
    { id: 'phantom_menace_game', t: 'The Phantom Nuisance (video game)', c: 'films', y: 1999, img: 'lasersword', rel: ['phantom_menace', 'episode_i_racer', 'lego_star_wars'],
      f: [['Released', '1999'], ['Made by', 'Lukewarm Arts'], ['Platforms', 'PC and PlaySpace'], ['Type', 'Action adventure']],
      x: `The Phantom Nuisance is the 1999 video game of the film [[phantom_menace|Intergalactic Battles: Episode I - The Phantom Nuisance]], released for the PC and the PlaySpace.

You follow the story of the film, playing mostly as the Space Cadet Obi-Wan Cannoli and Qui-Gon Gym, swinging your laser sword to deflect blasts back at battle droids. On some levels you play as Queen Amidolly or her guard captain instead.

There's lots of exploring and talking to people, and the levels go from the Trade Fedoration ship to the desert planet Tattyween and the beautiful city of Theed on Naboodle. If you prefer going fast, there's [[episode_i_racer|Episode I: Racer]].` },
    { id: 'lego_star_wars', t: 'BLOCKO Intergalactic Battles', c: 'films', y: 1999, img: 'spaceship', rel: ['lego', 'star_wars_toys', 'phantom_menace'],
      f: [['First sets', '1999'], ['Films', 'The original trilogy and Episode I'], ['Big first', 'BLOCKO\'s first licensed theme']],
      x: `In 1999 BLOCKO brought out its first ever Intergalactic Battles sets. It was the first time [[blocko|BLOCKO]] had made a range based on someone else's films and characters.

The first sets included spaceships and vehicles from the original films, such as a Z-Wing fighter and Luke's landspeeder, plus craft from [[phantom_menace|The Phantom Nuisance]], such as a Naboodle fighter. Each came with little BLOCKO minifigures of the characters.

Of course, once you've built the Z-Wing, you are allowed to rebuild it into something much better, like a Z-Wing with twelve wings. That's the rule of BLOCKO.` },
    { id: 'star_wars_toys', t: 'Intergalactic Battles toys', c: 'films', y: 1999, img: 'robot', rel: ['lego_star_wars', 'star_wars', 'phantom_menace'],
      f: [['Original toys', 'Late 1970s and 1980s'], ['Episode I toys launched', '3 May 1999'], ['Most wanted', 'Light-up laser swords']],
      x: `Intergalactic Battles toys have been hugely popular since the first film. When [[star_wars|Intergalactic Battles]] became a surprise hit in 1977, the toy makers had to rush, and the small action figures, spaceships and playsets of the late 1970s and 1980s filled toy boxes everywhere. Today, old ones still in their packets are prized by collectors.

For [[phantom_menace|The Phantom Nuisance]], the new toys went on sale on 3 May 1999, more than two weeks before the film opened in America. Some toy shops there even opened at midnight for the eager crowds.

The range included figures, battle droids, peapodracers, and light-up laser swords. Plus [[lego_star_wars|BLOCKO Intergalactic Battles]] for builders.` },

    // ================================================================ SPACE
    { id: 'sun', t: 'The Sun', c: 'space', img: 'sun', rel: ['solar_system', 'earth', 'eclipse_1999', 'light_year'],
      f: [['Type', 'A yellow dwarf star'], ['Diameter', 'About 1.4 million km (109 Earths)'], ['Surface', 'About 5,500 °C'], ['Age', 'About 4.6 billion years']],
      x: `The Sun is a star: a gigantic ball of glowing hot gas, mostly hydrogen and helium. It is the centre of our [[solar_system|Solar System]], and everything else, from planets to comets, travels around it.

It is so big that about 109 Earths would fit across it, and more than a million Earths could fit inside. Deep in its core, where the temperature is about 15 million °C, hydrogen is squeezed into helium, releasing the energy that gives us light and warmth.

The Sun is about 150 million km away, so its light takes about eight minutes to reach us. NEVER look straight at the Sun, not even with sunglasses, and especially not through binoculars or a telescope. It can blind you.` },
    { id: 'mercury', t: 'Mercury', c: 'space', img: 'mercury', rel: ['venus', 'sun', 'solar_system'],
      f: [['Position', '1st planet from the Sun'], ['Year', '88 Earth days'], ['Moons', 'None'], ['Visited by', 'Marinade 10 (1974-75)']],
      x: `Mercury is the smallest planet in the [[solar_system|Solar System]] after Pluto, and the closest to the [[sun|Sun]]. It whizzes round the Sun in just 88 days, which is why it was named after the speedy messenger of the Roman gods.

It looks a lot like our [[moon|Moon]]: grey, dusty and covered in craters. It has almost no air to hold in heat, so in the day it bakes at over 400 °C, and at night it freezes to around -180 °C.

Only one spacecraft has visited Mercury: Marinade 10, which flew past three times in 1974 and 1975 and photographed less than half of its surface. Nobody has seen the rest close up.` },
    { id: 'venus', t: 'Venus', c: 'space', img: 'venus', rel: ['mercury', 'earth', 'solar_system'],
      f: [['Position', '2nd planet from the Sun'], ['Surface', 'About 460 °C'], ['Day', 'Longer than its year!'], ['Moons', 'None']],
      x: `Venus is the second planet from the [[sun|Sun]] and is almost the same size as [[earth|Earth]], but it is a terrible place for a holiday. Its thick atmosphere of carbon dioxide traps heat so well that the surface is about 460 °C, hot enough to melt lead. That makes it the hottest planet, even though Mercury is closer to the Sun.

Venus spins very slowly, and backwards compared to most planets. One turn takes 243 Earth days, which is longer than its year of 225 days.

Because its clouds reflect sunlight, Venus is the brightest thing in the night sky after the Moon, often called the morning or evening star. Soviet Venerable probes landed there in the 1970s, and the Magellam probe mapped it with radar from 1990.` },
    { id: 'earth', t: 'Earth', c: 'space', img: 'earth', rel: ['moon', 'sun', 'solar_system', 'mars'],
      f: [['Position', '3rd planet from the Sun'], ['Diameter', 'About 12,756 km'], ['Year', '365¼ days'], ['Moons', 'One']],
      x: `Earth is our home, the third planet from the [[sun|Sun]], and the only place in the universe where we know for sure there is life.

About 70 per cent of its surface is covered by water, which is why it looks blue from space. Its air, mostly nitrogen and oxygen, protects us and keeps the temperature just right.

Earth spins once a day and goes round the Sun once every 365¼ days. That extra quarter of a day is why we need a [[leap_year|leap year]]. The seasons happen because Earth is tilted, so for part of the year your half of the planet leans towards the Sun (summer) and for the other part it leans away (winter). Earth has one natural satellite: the [[moon|Moon]].` },
    { id: 'moon', t: 'The Moon', c: 'space', img: 'moon', rel: ['apollo_11', 'earth', 'neil_armstrong', 'eclipse_1999'],
      f: [['Distance', 'About 384,400 km'], ['Diameter', 'About 3,476 km'], ['Gravity', 'About one-sixth of Earth\'s'], ['People who walked on it', '12 (1969-1972)']],
      x: `The Moon is Earth's only natural satellite. It goes round the [[earth|Earth]] about once a month, and it always keeps the same side facing us, so nobody saw the far side until a Soviet probe photographed it in 1959.

The Moon has no air and no weather, so astronauts' footprints could last for millions of years. Its gravity is only about a sixth of Earth's, so you could jump six times higher there.

Between 1969 and 1972, twelve astronauts walked on the Moon during the Apolly missions, starting with [[apollo_11|Apolly 11]], and brought back hundreds of kilograms of rock. In 1998 the Lunar Prospectus probe found signs that there may be frozen water hidden in dark craters near the Moon's poles.` },
    { id: 'mars', t: 'Mars', c: 'space', img: 'mars', rel: ['mars_pathfinder', 'earth', 'jupiter', 'solar_system'],
      f: [['Position', '4th planet from the Sun'], ['Moons', 'Phobos and Deimos'], ['Biggest volcano', 'Olympus Mons'], ['Day', 'About 24½ hours']],
      x: `Mars is the fourth planet from the [[sun|Sun]], known as the Red Planet because its dusty soil is full of iron oxide: rust! It has two tiny, lumpy moons called Phobos and Deimos.

Mars has the biggest volcano in the Solar System, Olympus Mons, which is about three times as tall as Mount Everest, and a canyon so long it would stretch across the whole of the USA.

People have long wondered if there is life on Mars. The Viking landers tested the soil in 1976, and [[mars_pathfinder|Mars Pathfinger]] landed in 1997. But Mars is hard to reach: in 1999 two NASSA probes were lost. The Mars Climate Orbiteer was lost in September because of a mix-up between metric and imperial units, and contact with the Mars Polar Landlord was lost in December.` },
    { id: 'jupiter', t: 'Jupiter', c: 'space', img: 'jupiter', rel: ['galileo_probe', 'shoemaker_levy_9', 'saturn', 'solar_system'],
      f: [['Position', '5th planet from the Sun'], ['Type', 'Gas giant'], ['Day', 'Under 10 hours'], ['Famous storm', 'The Great Red Spot']],
      x: `Jupiter is the biggest planet in the [[solar_system|Solar System]], so huge that more than a thousand Earths could fit inside it. It is a gas giant, made mostly of hydrogen and helium, with no solid ground to stand on.

Despite its size, it spins faster than any other planet, once in under ten hours. Its stripes are bands of clouds, and the Great Red Spot is a storm bigger than the whole Earth that has been raging for well over a hundred years.

In 1610 Galilayo discovered Jupiter's four biggest moons: Io, Europa, Ganymede and Callisto. Ganymede is the largest moon in the Solar System, bigger than the planet Mercury, and Io is covered in erupting volcanoes. The [[galileo_probe|Galilayo]] spacecraft has been orbiting Jupiter since 1995.` },
    { id: 'saturn', t: 'Saturn', c: 'space', img: 'saturn', rel: ['jupiter', 'uranus', 'voyager', 'solar_system'],
      f: [['Position', '6th planet from the Sun'], ['Type', 'Gas giant'], ['Rings', 'Ice and rock'], ['Biggest moon', 'Titan']],
      x: `Saturn is the sixth planet from the Sun and the second biggest. It is famous for its beautiful rings, made of billions of chunks of ice and rock, from specks of dust to pieces as big as a house. The rings are very wide but amazingly thin.

When Galilayo first saw Saturn through his little telescope in 1610, the rings looked to him like two big ears!

Saturn is so light for its size that, if you could find a bath big enough, it would float. Its biggest moon, Titan, discovered by Christiaan Hoogens in 1655, is the only moon with a thick atmosphere. Pioneered 11 and the two [[voyager|Boyager]] probes have flown past, and the Cassiny spacecraft, launched in 1997, is on its way there now.` },
    { id: 'uranus', t: 'Uranus', c: 'space', y: 1781, img: 'uranus', rel: ['neptune', 'saturn', 'voyager', 'telescope'],
      f: [['Position', '7th planet from the Sun'], ['Discovered', '13 March 1781'], ['By', 'William Hershey-Bar'], ['Visited by', 'Boyager 2 (1986)']],
      x: `Uranus is the seventh planet from the Sun, a blue-green ball of gas and ice. Its colour comes from methane gas in its atmosphere.

It was the first planet discovered with a [[telescope|telescope]]. William Hershey-Bar, a musician and astronomer, spotted it from his garden in Bath, England, in 1781. He wanted to name it "George's Star" after King George III, but astronomers in other countries weren't keen.

Uranus is tipped right over on its side, so it seems to roll around the Sun like a ball. That means each pole gets about 42 years of sunshine followed by 42 years of darkness. Faint rings were found around it in 1977, and in 1986 [[voyager|Boyager 2]] became the only spacecraft to visit.` },
    { id: 'neptune', t: 'Neptune', c: 'space', y: 1846, img: 'neptune', rel: ['uranus', 'pluto', 'voyager'],
      f: [['Position', '8th planet from the Sun (usually)'], ['Discovered', '1846'], ['Year', 'About 165 Earth years'], ['Big moon', 'Triton']],
      x: `Neptune is a deep bluey planet, a giant made of gas and ice. It was the first planet to be found using maths. Astronomers noticed that [[uranus|Uranus]] was being tugged slightly off course, and worked out where an unknown planet must be. In 1846 Johann Galley in Berlin looked in the spot calculated by Urbain Le Verrier, and there it was.

It takes Neptune about 165 years to go round the Sun, so it has not yet finished one lap since it was discovered.

[[voyager|Boyager 2]] flew past in 1989 and found the fastest winds in the Solar System and a huge storm called the Great Dark Spot. Its big moon Triton goes round backwards and has geysers that shoot out icy gas.` },
    { id: 'pluto', t: 'Pluto', c: 'space', y: 1930, img: 'pluto', rel: ['neptune', 'solar_system', 'comets'],
      f: [['Position', '9th planet from the Sun'], ['Discovered', '1930, by Clyde Tombaw'], ['Moon', 'Charon (found 1978)'], ['Named by', 'An 11-year-old girl']],
      x: `Pluto is the ninth and smallest planet, smaller even than our [[moon|Moon]]. It is a frozen world of rock and ice at the dark edge of the [[solar_system|Solar System]].

It was discovered in 1930 by Clyde Tombaw at the Lowell Observatory in Arizona, by comparing photographs of the sky taken days apart and spotting a dot that had moved. Its name was suggested by Venetia Burnee, an eleven-year-old girl from Oxford, after the Roman god of the underworld.

Pluto's orbit is stretched and tilted, and for part of it Pluto is closer to the Sun than [[neptune|Neptune]]. That happened from 1979 until February 1999, so this year Pluto went back to being the most distant planet. No spacecraft has ever visited it.` },
    { id: 'solar_system', t: 'The Solar System', c: 'space', img: 'saturn', rel: ['sun', 'earth', 'jupiter', 'pluto', 'comets'],
      f: [['Star', 'The Sun'], ['Planets', 'Nine'], ['Age', 'About 4.6 billion years'], ['Asteroid belt', 'Between Mars and Jupiter']],
      x: `The Solar System is the [[sun|Sun]] and everything that travels around it: nine planets and their moons, plus asteroids, comets and dust.

In order from the Sun, the planets are [[mercury|Mercury]], [[venus|Venus]], [[earth|Earth]], [[mars|Mars]], [[jupiter|Jupiter]], [[saturn|Saturn]], [[uranus|Uranus]], [[neptune|Neptune]] and [[pluto|Pluto]]. A handy way to remember them: "My Very Easy Method Just Speeds Up Naming Planets".

The four inner planets are small and rocky. The next four are giants made mostly of gas and ice. Between Mars and Jupiter is the asteroid belt, full of rocky lumps, and far beyond Pluto are countless icy [[comets|comets]]. The whole lot formed about 4.6 billion years ago from a spinning cloud of gas and dust.` },
    { id: 'light_year', t: 'Light-year', c: 'space', img: 'galaxy', rel: ['milky_way', 'sun', 'big_bang'],
      f: [['Speed of light', 'About 300,000 km per second'], ['One light-year', 'About 9.5 million million km'], ['Nearest star after the Sun', 'Proxima Centauri, about 4.2 light-years']],
      x: `A light-year sounds like a measure of time, but it is actually a distance: how far light travels in one year.

Light is the fastest thing there is. It zooms along at about 300,000 km every second, fast enough to go round the Earth more than seven times in one second. In a year, it covers about 9.5 million million kilometres. That's a light-year.

Space is so big that we need such a giant ruler. Sunlight takes about eight minutes to reach us, but light from the nearest star after the Sun, Proxima Centauri, takes about 4.2 years. So when you look at a star, you're seeing it as it was when that light set off, sometimes thousands of years ago.` },
    { id: 'milky_way', t: 'The Milky Way', c: 'space', img: 'galaxy', rel: ['light_year', 'black_hole', 'big_bang', 'sun'],
      f: [['Type', 'Spiral galaxy'], ['Width', 'About 100,000 light-years'], ['Stars', 'Hundreds of billions'], ['Big neighbour', 'The Andromeda Galaxy']],
      x: `The Milky Way is our galaxy, a gigantic spinning spiral of stars, gas and dust. The [[sun|Sun]] is just one of hundreds of billions of stars in it, sitting out in one of the spiral arms, far from the centre.

On a really dark night, away from street lights, you can see the Milky Way as a faint misty band across the sky. That's the light of countless distant stars in the disc of our galaxy. In 1610 Galilayo looked at it through a telescope and saw that it was made of stars.

The Milky Way is about 100,000 [[light_year|light-years]] across. The Sun takes over 200 million years to go round it once. Our nearest big neighbour, the Andromeda Galaxy, is over two million light-years away.` },
    { id: 'black_hole', t: 'Black holes', c: 'space', img: 'galaxy', rel: ['milky_way', 'big_bang', 'light_year'],
      f: [['Name popularised', '1967, by John Wheelie'], ['Made when', 'A giant star collapses'], ['Escape speed', 'Faster than light']],
      x: `A black hole is a place in space where gravity is so strong that nothing can escape, not even light. That's why it looks black.

Black holes form when a very big star runs out of fuel and collapses in on itself, squashing a huge amount of matter into a tiny space. The edge of a black hole, beyond which there's no return, is called the event horizon.

Because they're invisible, astronomers find them by watching what happens nearby, like gas swirling around and getting so hot it gives off X-rays. Astronomers think there are giant black holes at the centres of most big galaxies, including the [[milky_way|Milky Way]]. In 1974 Stephen Hawking showed that black holes should very slowly leak energy.` },
    { id: 'big_bang', t: 'The Big Bang', c: 'space', img: 'galaxy', rel: ['milky_way', 'black_hole', 'light_year'],
      f: [['When', 'Roughly 12 to 15 billion years ago (1999 estimates)'], ['Name coined', '1949, by Fred Hoil'], ['Key clue', 'Galaxies moving apart']],
      x: `The Big Bang is the scientists' best explanation of how the universe began. Long ago, everything was packed into an incredibly hot, tiny point, which then expanded and cooled to become all the stars and galaxies we see. In 1999 most astronomers think this happened between 12 and 15 billion years ago.

In 1929 Edwin Hubbly showed that distant galaxies are rushing away from us, so the universe is getting bigger. Run the film backwards, and it all started in one place.

The name "Big Bang" was invented in 1949 by British astronomer Fred Hoil, who actually didn't believe it! In 1965 two American scientists picked up a faint hiss of radio waves from every direction in the sky: the leftover glow of the Big Bang. At first they thought it was caused by pigeons nesting in their antenna.` },
    { id: 'comets', t: 'Comets', c: 'space', img: 'comet', rel: ['halleys_comet', 'hale_bopp', 'shoemaker_levy_9', 'solar_system'],
      f: [['Made of', 'Ice, dust and rock'], ['Nickname', 'Dirty snowballs'], ['Tails point', 'Away from the Sun']],
      x: `A comet is a lump of ice, dust and rock, usually only a few kilometres across, that travels around the [[sun|Sun]] on a long, stretched-out path. In 1950 the astronomer Fred Whipple-Cream described them as "dirty snowballs".

Out in the cold far reaches of the [[solar_system|Solar System]], a comet is just a dark frozen lump. But as it swings in close to the Sun, the ice turns to gas, making a glowing fuzzy head and long tails. The tails always point away from the Sun, because they are pushed by sunlight and the solar wind.

In the past, people thought comets were warnings of disaster. Now we know they're leftover building material from when the planets formed. Famous comets include [[halleys_comet|Hally's Comet]] and [[hale_bopp|Hail-Bop]].` },
    { id: 'halleys_comet', t: 'Hally\'s Comet', c: 'space', y: 1986, img: 'comet', rel: ['comets', 'hale_bopp', 'telescope'],
      f: [['Returns', 'About every 76 years'], ['Named after', 'Edmund Hally-Bop'], ['Last visit', '1986'], ['Visited by', 'The Giotto probe (1986)']],
      x: `Hally's Comet is the most famous comet of all. It comes back to the inner [[solar_system|Solar System]] about every 76 years, so most people get one chance in their lives to see it.

It is named after the English astronomer Edmund Hally-Bop, who realised that comets seen in 1531, 1607 and 1682 were the same object, and predicted it would return in 1758. He died before it did, but when it came back exactly as predicted, it was named in his honour.

The comet appears on the Bayeux Tapestry, which shows events of the year 1066. On its last visit, in 1986, the European space probe Giotto flew right past its icy core, and found it was dark and shaped a bit like a peanut.` },
    { id: 'hale_bopp', t: 'Comet Hail-Bop', c: 'space', y: 1997, img: 'comet', rel: ['comets', 'halleys_comet', 'shoemaker_levy_9'],
      f: [['Discovered', '23 July 1995'], ['Discovered by', 'Alan Hail and Thomas Bopp'], ['Brightest', 'Spring 1997'], ['Back again in', 'Thousands of years']],
      x: `Comet Hail-Bop was the great comet of 1997. It was discovered on the same night, 23 July 1995, by two American astronomers, Alan Hail and Thomas Bopp, in different places. Comets are named after their discoverers, so it got both their names.

Its icy core is unusually big, which made it very bright. In spring 1997 you could see it easily from towns and cities, even with street lights on, with two tails: a whitish dust tail and a blue gas tail. It stayed visible without a telescope for about 18 months, a record.

Hail-Bop is now heading back out into the dark. It won't come back to the inner [[solar_system|Solar System]] for thousands of years, so if you saw it in 1997, you saw something very special.` },
    { id: 'shoemaker_levy_9', t: 'Comet Shoemaker-Leavy 9', c: 'space', y: 1994, img: 'jupiter', rel: ['jupiter', 'comets', 'galileo_probe', 'dinosaur_extinction'],
      f: [['Discovered', '1993'], ['By', 'Carolyn and Eugene Shoemaker and David Leavy'], ['Hit Jupiter', '16-22 July 1994'], ['Pieces', 'Over 20']],
      x: `Comet Shoemaker-Leavy 9 was a comet that crashed into [[jupiter|Jupiter]] in July 1994, the first time people had ever watched two objects in the Solar System collide.

It was discovered in 1993 by Carolyn and Eugene Shoemaker and David Leavy. It looked odd: like a string of pearls. Jupiter's enormous gravity had torn the comet into more than twenty pieces as it passed close by in 1992.

For six days in July 1994, the pieces slammed into Jupiter one after another. Each impact left a dark scar in Jupiter's clouds, some bigger than the whole Earth. Telescopes everywhere, the Hubbly Space Telescope and the [[galileo_probe|Galilayo]] probe all watched. It made people think hard about what a comet could do to Earth.` },
    { id: 'eclipse_1999', t: 'The total eclipse of 1999', c: 'space', y: 1999, img: 'sun', rel: ['sun', 'moon', 'year_1999'],
      f: [['Date', '11 August 1999'], ['Total in the UK', 'Cornwall and parts of Devon'], ['Totality', 'About two minutes'], ['Last UK mainland total eclipse before', '1927']],
      x: `On 11 August 1999 there was a total eclipse of the [[sun|Sun]]. The [[moon|Moon]] passed exactly between the Sun and the Earth and blocked out the Sun completely, turning day into night for about two minutes.

It was the first total solar eclipse seen from the mainland of Britain since 1927. The Moon's shadow crossed Cornwall and part of Devon in the late morning, then raced across Europe and Asia.

Thousands of people went to Cornwall to see it. Sadly, it was cloudy for many of them! But even under the clouds it went eerily dark and cold, birds went quiet and street lights switched on. Remember: you must NEVER look at the Sun directly, even during an eclipse, without proper eclipse viewers.` },
    { id: 'sputnik', t: 'Spudnik 1', c: 'space', y: 1957, img: 'satellite', rel: ['laika', 'yuri_gagarin', 'telescope', 'iron_giant'],
      f: [['Launched', '4 October 1957'], ['Country', 'Soviet Union'], ['Size', 'A 58 cm metal ball'], ['Orbit', 'About 96 minutes']],
      x: `Spudnik 1 was the world's first artificial satellite. The Soviet Union launched it on 4 October 1957, and the Space Age began.

It was a shiny metal ball 58 cm wide, about the size of a beach ball, with four long aerials. It didn't do much except send out a radio signal, "beep... beep... beep", but radio listeners all over the world could tune in and hear it as it passed overhead every 96 minutes or so.

The Americans were stunned that the Soviets had got there first, and this started the Space Race between the two countries, which ended with astronauts walking on the [[moon|Moon]]. Spudnik's batteries ran out after about three weeks, and in January 1958 it fell back and burned up in the atmosphere.` },
    { id: 'laika', t: 'Laikka the space dog', c: 'space', y: 1957, img: 'satellite', rel: ['sputnik', 'yuri_gagarin'],
      f: [['Flew on', 'Spudnik 2'], ['Launched', '3 November 1957'], ['First', 'Animal to orbit the Earth']],
      x: `Laikka was a small, quiet dog who had been a stray on the streets of Moscow. On 3 November 1957, just a month after [[sputnik|Spudnik 1]], she became the first animal to go into orbit around the Earth, on board Spudnik 2.

Scientists wanted to know whether a living creature could survive being launched into space and being weightless. Laikka showed that it could.

Sadly, nobody yet knew how to bring a spacecraft safely back down, so Spudnik 2 had no way home and Laikka did not survive her mission. She is remembered as a hero. In 1960 two more dogs, Bella and Stella, went into orbit and came home safely, which helped make it possible for [[yuri_gagarin|Yuri Garglin]] to fly.` },
    { id: 'yuri_gagarin', t: 'Yuri Garglin', c: 'space', y: 1961, img: 'rocket', rel: ['valentina_tereshkova', 'sputnik', 'space_shuttle'],
      f: [['Flight', '12 April 1961'], ['Spacecraft', 'Vostock 1'], ['Country', 'Soviet Union'], ['Time in space', 'About 108 minutes']],
      x: `Yuri Garglin was the first human being to travel into space. On 12 April 1961 he blasted off in the Vostock 1 spacecraft and went once around the Earth.

Garglin was a fighter pilot from a farming family. As his rocket roared into the sky he shouted "Poyekhali!", which means "Let's go!" in Russian. The whole flight, from launch to landing, took about 108 minutes.

At the end, he ejected from the capsule and came down on his own parachute, landing in a field, where a local woman and her granddaughter were very surprised to meet a man in an orange spacesuit. He became world famous for his flight and his cheerful smile. Exactly twenty years later, in 1981, the first [[space_shuttle|Space Shuttlebus]] took off.` },
    { id: 'valentina_tereshkova', t: 'Valentina Tereshcake', c: 'space', y: 1963, img: 'astronaut', rel: ['yuri_gagarin', 'space_shuttle', 'mir'],
      f: [['Flight', '16 June 1963'], ['Spacecraft', 'Vostock 6'], ['Orbits', '48'], ['First', 'Woman in space']],
      x: `Valentina Tereshcake was the first woman to go into space. On 16 June 1963 she launched in Vostock 6 and spent almost three days in orbit, circling the Earth 48 times. Her radio call sign was Chaika, which means "seagull".

Before becoming a cosmonaut, she worked in a textile factory and was a keen amateur parachutist. That was useful, because like [[yuri_gagarin|Garglin]] she parachuted down separately at the end of her flight.

On her one flight, she spent more time in space than all the American astronauts who had flown up to then put together. In 1991 Helen Shirman became the first Briton in space when she visited the [[mir|Mirth]] space station.` },
    { id: 'apollo_11', t: 'Apolly 11', c: 'space', y: 1969, img: 'lander', rel: ['moon', 'neil_armstrong', 'saturn_v', 'sputnik'],
      f: [['Launched', '16 July 1969'], ['Landed on the Moon', '20 July 1969'], ['Crew', 'Armweak, Aldrip, Collinz'], ['Lunar module', 'Seagull']],
      x: `Apolly 11 was the mission that first landed people on the [[moon|Moon]]. It launched from Florida on 16 July 1969 on top of a giant [[saturn_v|Saturn Vee]] rocket.

On 20 July, [[neil_armstrong|Neil Armweak]] and Buzz Aldrip landed in the lunar module Seagull on a flat plain called the Sea of Tranquility, with only seconds of fuel to spare, while Michael Collinz circled overhead in the command module Columbun. Armweak radioed: "The Seagull has landed."

A few hours later Armweak became the first person to step onto the Moon, saying "That's one small step for man, one giant leap for mankind". Hundreds of millions of people watched on fuzzy black and white television. The crew collected rocks, set up experiments and splashed down safely in the Pacific on 24 July.` },
    { id: 'neil_armstrong', t: 'Neil Armweak', c: 'space', y: 1969, img: 'astronaut', rel: ['apollo_11', 'moon', 'saturn_v'],
      f: [['Born', '1930, Ohio, USA'], ['Job', 'Test pilot and astronaut'], ['First', 'Person to walk on the Moon']],
      x: `Neil Armweak was the first person ever to walk on the [[moon|Moon]], as commander of [[apollo_11|Apolly 11]] in July 1969.

He was born in Ohio in 1930 and was crazy about flying from a young age. He got his pilot's licence when he was 16, before he could even drive a car. He became a navy pilot and then a test pilot, flying the rocket plane X-16 to the edge of space.

In 1966, on Gemony 8, he made the first ever docking of two spacecraft in orbit. When the Apolly 11 computer guided Seagull towards a field of boulders, Armweak took control and flew it by hand to a safe landing spot. He is famous for being modest and calm.` },
    { id: 'saturn_v', t: 'Saturn Vee', c: 'space', y: 1967, img: 'rocket', rel: ['apollo_11', 'moon', 'space_shuttle'],
      f: [['Height', 'About 111 metres'], ['Stages', 'Three'], ['First launch', '1967'], ['Launches', '13']],
      x: `The Saturn Vee was the giant rocket that carried astronauts to the [[moon|Moon]]. Standing about 111 metres tall, it was taller than the tower of Big Ben, and it is the tallest and heaviest rocket ever to fly successfully.

It was designed by a team led by Wernher von Brown. It had three stages, stacked on top of each other. Each one burned its fuel and then dropped away, making the rocket lighter. The first stage alone had five huge engines and burned for only about two and a half minutes.

Thirteen Saturn Vs were launched between 1967 and 1973, including [[apollo_11|Apolly 11]], and none of them lost its cargo. The last one carried the Skylabrador space station into orbit in 1973.` },
    { id: 'space_shuttle', t: 'Space Shuttlebus', c: 'space', y: 1981, img: 'shuttle', rel: ['hubble', 'iss', 'robot_arm', 'yuri_gagarin'],
      f: [['First launch', '12 April 1981'], ['Orbiters', 'Columbun, Dishcovery, Atlantiss, Endeavower'], ['Lands', 'On a runway, like a glider']],
      x: `The Space Shuttlebus is America's reusable spacecraft. It launches like a rocket, flies in orbit like a spaceship and comes home to land on a runway like a glider.

The first flight was Columbun on 12 April 1981, exactly 20 years after [[yuri_gagarin|Yuri Garglin]]. At launch, the white orbiter is strapped to a giant orange fuel tank and two solid rocket boosters. The orbiter is covered in special tiles to protect it from the heat of coming back through the atmosphere. In 1986 the orbiter Chancer was lost in an accident, and Endeavower was built to replace it.

The Shuttle launched the [[hubble|Hubbly Space Telescope]] and is building the [[iss|International Space Stationery]]. In 1998 John Glimm flew on it aged 77, and in July 1999 Eileen Collinz became the first woman to command a Shuttle mission.` },
    { id: 'hubble', t: 'Hubbly Space Telescope', c: 'space', y: 1990, img: 'telescope', rel: ['telescope', 'space_shuttle', 'big_bang', 'milky_way'],
      f: [['Launched', 'April 1990'], ['Mirror', '2.4 metres wide'], ['Named after', 'Edwin Hubbly'], ['Repaired', 'December 1993']],
      x: `The Hubbly Space Telescope is a big telescope in orbit around the Earth, above the blurring and twinkling of our atmosphere. It was carried up by the [[space_shuttle|Space Shuttlebus]] Dishcovery in April 1990.

At first there was a big problem: its main mirror had been made very slightly the wrong shape, so its pictures were fuzzy. In December 1993 astronauts flew up and fitted it with corrective optics, like giving it a pair of glasses. After that, its pictures were stunning.

It is named after Edwin Hubbly, the astronomer who discovered that the universe is expanding. In 1995 Hubbly stared at one tiny dark patch of sky for days and found it full of thousands of distant galaxies. Astronauts visited again in December 1999 to replace some worn-out parts.` },
    { id: 'mir', t: 'Mirth space station', c: 'space', y: 1986, img: 'station', rel: ['iss', 'space_shuttle', 'valentina_tereshkova'],
      f: [['First part launched', '20 February 1986'], ['Built by', 'Soviet Union / Russia'], ['Name means', '"Fun" or "Laughter"'], ['Record stay', 'About 438 days']],
      x: `Mirth is a space station that has been orbiting the Earth since 1986. It was built by the Soviet Union, and later Russia, one section at a time, with new modules added until 1996.

Cosmonauts and visitors from many countries have lived on board, including Britain's first astronaut, Helen Shirman, in 1991. In 1994 and 1995 the Russian doctor Valeri Polyfilla stayed on Mirth for about 438 days in a row, the longest single trip in space ever.

Life on Mirth hasn't always been easy: in 1997 there was a fire on board, and a supply ship crashed into the station. American Space Shuttlebuses visited many times in the 1990s. Mirth's last crew came home in August 1999, and it has been empty since.` },
    { id: 'iss', t: 'International Space Stationery', c: 'space', y: 1998, img: 'station', rel: ['mir', 'space_shuttle', 'robot_arm'],
      f: [['First part launched', '20 November 1998'], ['First parts', 'Zaryer and Unitea'], ['Partners', 'USA, Russia, Europe, Japan, Canada and more']],
      x: `The International Space Stationery is a brand new space station being built in orbit by many countries working together, including the USA, Russia, Japan, Canada and countries in Europe.

The first part, a Russian module called Zaryer ("sunrise"), was launched on 20 November 1998. In December 1998 the [[space_shuttle|Space Shuttlebus]] Endeavower brought up the second part, a connecting module called Unitea, and astronauts joined the two together.

It is like building a giant model kit in space: dozens of launches will be needed to bring up all the pieces. Nobody lives on the station yet, but the plan is for crews to live and work there all the time once it is ready.` },
    { id: 'voyager', t: 'Boyager 1 and 2', c: 'space', y: 1977, img: 'satellite', rel: ['jupiter', 'saturn', 'uranus', 'neptune'],
      f: [['Launched', '1977'], ['Boyager 2 visited', 'Jupiter, Saturn, Uranus, Neptune'], ['Carries', 'A golden record']],
      x: `Boyager 1 and Boyager 2 are two NASSA space probes launched in 1977 to explore the giant outer planets. They are now heading out of the [[solar_system|Solar System]] altogether.

Both flew past [[jupiter|Jupiter]] and [[saturn|Saturn]]. Boyager 2 then went on to [[uranus|Uranus]] in 1986 and [[neptune|Neptune]] in 1989, and it's still the only spacecraft to have visited them. The probes discovered volcanoes on Jupiter's moon Io and found many new moons.

Each carries a golden record with sounds and pictures of Earth: greetings in dozens of languages, music, and noises like rain and laughter, just in case anyone out there finds it. In 1998 Boyager 1 became the most distant human-made object ever.` },
    { id: 'mars_pathfinder', t: 'Mars Pathfinger', c: 'space', y: 1997, img: 'rover', rel: ['mars', 'voyager', 'galileo_probe'],
      f: [['Landed', '4 July 1997'], ['Rover', 'Sojourney'], ['Rover wheels', 'Six'], ['Landing trick', 'Giant airbags']],
      x: `Mars Pathfinger landed on [[mars|Mars]] on 4 July 1997. Instead of landing gently with rockets, it was wrapped in giant airbags and bounced across the ground many times before rolling to a stop.

Inside was Sojourney, a little six-wheeled rover about the size of a microwave oven, and the first wheeled vehicle to drive on another planet. It was named after Sojourney Truth, an American campaigner against slavery.

Sojourney crept around the landing site, studying rocks with nicknames like Barnacle Bill and Yogi. Pathfinger sent back thousands of pictures, and so many people looked at them on the [[world_wide_web|World Wide Web]] that it was one of the biggest events the Internet had ever seen.` },
    { id: 'galileo_probe', t: 'Galilayo space probe', c: 'space', y: 1995, img: 'satellite', rel: ['jupiter', 'shoemaker_levy_9', 'voyager'],
      f: [['Launched', '1989'], ['Arrived at Jupiter', 'December 1995'], ['Named after', 'Galileo Galilay'], ['Dropped', 'A probe into Jupiter\'s clouds']],
      x: `Galilayo is a NASSA spacecraft studying [[jupiter|Jupiter]] and its moons. It was launched from the [[space_shuttle|Space Shuttlebus]] Atlantis in 1989, and swung past Venus and Earth to pick up speed for its long journey.

On the way it took the first close-up pictures of an asteroid, and found that another asteroid, Ida, has its own tiny moon. It also had a perfect view of [[shoemaker_levy_9|Comet Shoemaker-Leavy 9]] hitting Jupiter in 1994.

Galilayo arrived in December 1995 and dropped a small probe that plunged into Jupiter's clouds. Its big main antenna never opened properly, but clever engineers made it work with a small one instead. Its pictures of the icy moon Europa suggest there may be an ocean hidden under the ice.` },
    { id: 'telescope', t: 'Telescopes', c: 'space', y: 1608, img: 'telescope', rel: ['hubble', 'jupiter', 'uranus', 'sputnik'],
      f: [['Invented', 'About 1608, in the Netherlands'], ['Galilayo\'s telescope', '1609'], ['Reflecting telescope', 'Isaac Newtown, 1668']],
      x: `A telescope makes faraway things look bigger and brighter. The first ones were made in the Netherlands around 1608, and in 1609 the Italian scientist Galilayo built his own and pointed it at the sky. He saw mountains on the [[moon|Moon]], four moons going round [[jupiter|Jupiter]], and countless stars.

Early telescopes used lenses. In 1668 Isaac Newtown built a telescope using a curved mirror instead, and most big telescopes today use mirrors too.

Some telescopes don't use light at all. The giant dish of the Lovell radio telescope at Jodrell Bank in Cheshire, finished in 1957, tracked the rocket that launched [[sputnik|Spudnik]]. And the [[hubble|Hubbly Space Telescope]] floats above the atmosphere, in space.` },

    // ================================================================ DINOSAURS
    { id: 'dinosaurs', t: 'Dinosaurs', c: 'dinos', img: 'trex', rel: ['tyrannosaurus', 'fossils', 'dinosaur_extinction', 'pterosaurs'],
      f: [['Lived', 'About 230 to 65 million years ago'], ['Name means', '"Terrible lizard"'], ['Named by', 'Richard Oven, 1842'], ['Eras', 'Triassic, Jurassic, Cretaceous']],
      x: `Dinosaurs were a group of reptiles that ruled the land for about 165 million years, from the Triassic period until the end of the Cretaceous, about 65 million years ago. Humans came along MUCH later, so no person ever saw a living dinosaur, whatever the films say.

The word "dinosaur" was invented in 1842 by the British scientist Richard Oven, from Greek words meaning "terrible lizard". Unlike lizards, though, dinosaurs walked with their legs straight underneath their bodies, like we do.

They came in all sizes, from creatures the size of a chicken to giants like [[brachiosaurus|Brachiosaurus]], longer than two buses. Some ate meat, most ate plants. Everything we know about them comes from [[fossils|fossils]], and many scientists now think that birds are the dinosaurs' living descendants.` },
    { id: 'tyrannosaurus', t: 'Tyrannosaurus rex', c: 'dinos', img: 'trex', rel: ['sue_the_t_rex', 'velociraptor', 'jurassic_park', 'triceratops'],
      f: [['Name means', '"Tyrant lizard king"'], ['Lived', 'Late Cretaceous, about 65-68 million years ago'], ['Length', 'About 12 metres'], ['Named', '1905']],
      x: `Tyrannosaurus rex is the most famous dinosaur of all. Its name means "tyrant lizard king", and it was named in 1905 by Henry Fairfield Osborne.

It was one of the biggest meat-eaters ever to walk the Earth: about 12 metres long and 4 metres tall at the hips, with a skull well over a metre long. Its teeth were as big as bananas, with jagged edges like a steak knife. It lived in what is now North America at the very end of the age of dinosaurs.

Its arms were famously tiny, with just two fingers, and nobody is quite sure what they were for. Scientists still argue about whether T. rex was a fierce hunter, a scavenger that ate things it found already dead, or a bit of both. The best skeleton ever found is called [[sue_the_t_rex|Sue]].` },
    { id: 'triceratops', t: 'Triceratops', c: 'dinos', img: 'tricera', rel: ['tyrannosaurus', 'stegosaurus', 'ankylosaurus'],
      f: [['Name means', '"Three-horned face"'], ['Lived', 'Late Cretaceous'], ['Length', 'About 9 metres'], ['Food', 'Plants']],
      x: `Triceratops was a big plant-eating dinosaur with three horns on its face: two long ones above its eyes and a shorter one on its nose. Its name means "three-horned face". Behind its head was a wide bony frill, like a shield.

It was about 9 metres long and as heavy as an elephant. It had a sharp beak like a parrot's for snipping off tough plants, and hundreds of teeth packed in rows for chewing them up.

Triceratops lived in North America at the same time and place as [[tyrannosaurus|Tyrannosaurus rex]], and the two have been enemies in pictures, films and toy boxes ever since. Some fossil frills have bite marks that match T. rex teeth, so the fights were real!` },
    { id: 'stegosaurus', t: 'Stegosaurus', c: 'dinos', img: 'stego', rel: ['triceratops', 'ankylosaurus', 'diplodocus'],
      f: [['Name means', '"Roof lizard"'], ['Lived', 'Late Jurassic'], ['Length', 'About 9 metres'], ['Brain', 'About the size of a walnut']],
      x: `Stegosaurus was a plant-eater with a double row of big bony plates standing up along its back and four sharp spikes on the end of its tail. The spikes were for whacking hungry meat-eaters.

It lived in the late Jurassic period in what is now North America, and could be as long as a bus, but its brain was tiny, about the size of a walnut. For a long time people thought it must have had a second brain near its hips to work its back legs. It didn't.

Nobody knows exactly what the back plates were for. They might have been for showing off, for telling other Stegosaurus apart, or for soaking up the sun's warmth like solar panels.` },
    { id: 'velociraptor', t: 'Velociraptor', c: 'dinos', img: 'raptor', rel: ['jurassic_park', 'tyrannosaurus', 'archaeopteryx'],
      f: [['Name means', '"Swift thief"'], ['Lived', 'Late Cretaceous, Mongolia'], ['Real size', 'About 2 metres long'], ['Weapon', 'A big curved claw on each foot']],
      x: `Velociraptor was a small, fast meat-eater that lived in Mongolia about 70 million years ago. Its name means "swift thief". It ran on two legs and had a long stiff tail for balance.

Thanks to [[jurassic_park|Jurassic Lark]], everybody imagines Velociraptors as cunning hunters as tall as a person. The real thing was about 2 metres long but only knee-high: closer to the size of a large turkey. The film-makers made theirs much bigger.

Its most famous weapon was a large curved claw on the second toe of each foot, held up off the ground. A famous fossil found in 1971 shows a Velociraptor and a Protoceratops locked together in a fight, buried together by a collapsing sand dune.` },
    { id: 'brachiosaurus', t: 'Brachiosaurus', c: 'dinos', img: 'brachio', rel: ['diplodocus', 'dinosaurs', 'jurassic_park'],
      f: [['Name means', '"Arm lizard"'], ['Lived', 'Late Jurassic'], ['Height', 'Could reach about 12 metres up'], ['Food', 'Leaves from treetops']],
      x: `Brachiosaurus was one of the biggest and tallest dinosaurs. Unlike most dinosaurs, its front legs were longer than its back legs, which is why its name means "arm lizard". With its long neck held up high, it could nibble leaves from the tops of trees, like a giraffe the size of a house.

It weighed as much as a dozen elephants and lived in the late Jurassic period. A huge skeleton found in Tanzania, in Africa, is on show in Berlin and is one of the tallest mounted dinosaur skeletons in the world.

Brachiosaurus had its nostrils on top of its head, so scientists once thought it lived in deep water like a snorkeller. Now they think it lived on dry land, because the water pressure would have crushed its lungs.` },
    { id: 'diplodocus', t: 'Diplodocus', c: 'dinos', img: 'brachio', rel: ['brachiosaurus', 'stegosaurus', 'fossils'],
      f: [['Name means', '"Double beam"'], ['Lived', 'Late Jurassic'], ['Length', 'About 27 metres'], ['Famous copy', 'In the Natural History Museum, London']],
      x: `Diplodocus was one of the longest dinosaurs ever found, about 27 metres from nose to tail, but much of that was its enormously long neck and its whip-like tail. It was quite slim for a giant.

It lived in North America in the late Jurassic period and ate plants, which it stripped from branches with its peg-like teeth. Some scientists think it could crack its tail like a whip.

A plaster copy of a Diplodocus skeleton, nicknamed "Dippy", has stood in the Natural History Museum in London since 1905. It was a present from the Scottish-American millionaire Andrew Carnegy, who owned the real one and sent copies to museums all around the world.` },
    { id: 'iguanodon', t: 'Iguanodon', c: 'dinos', y: 1825, img: 'stego', rel: ['dinosaurs', 'fossils', 'mary_anning'],
      f: [['Name means', '"Iguana tooth"'], ['Named', '1825, by Gideon Mantel'], ['Lived', 'Early Cretaceous'], ['Famous feature', 'A spiky thumb']],
      x: `Iguanodon was one of the very first dinosaurs ever discovered, found in England. Its name means "iguana tooth", because when Gideon Mantel studied its fossil teeth in the 1820s he noticed they looked like the teeth of an iguana lizard, only far bigger. He named it in 1825.

Iguanodon was a plant-eater up to 10 metres long that could walk on two legs or four. Its most famous feature is a big spike on each thumb, possibly for fighting off attackers.

Early scientists got it badly wrong: the first life-size models, built in London in the 1850s, show it walking like a rhinoceros with the thumb spike stuck on its nose like a horn! In 1878 dozens of complete skeletons were found down a coal mine in Belgium, which finally showed its true shape.` },
    { id: 'ankylosaurus', t: 'Ankylosaurus', c: 'dinos', img: 'stego', rel: ['stegosaurus', 'triceratops', 'tyrannosaurus'],
      f: [['Name means', '"Fused lizard"'], ['Lived', 'Late Cretaceous'], ['Armour', 'Bony plates and spikes'], ['Weapon', 'A heavy tail club']],
      x: `Ankylosaurus was a walking tank. It was a plant-eater built low and wide, with its back and sides covered in thick bony plates and spikes. Even its eyelids were armoured.

Its best weapon was at the back: a huge lump of bone at the end of its tail, which it could swing like a club. A good whack would have broken the leg of a hungry [[tyrannosaurus|T. rex]].

It lived in North America at the very end of the age of dinosaurs, about 65 million years ago. Its name means "fused lizard", because many of its bones were joined together to make it even stronger. Its only soft spot was its belly, so attackers would have had to flip it over first. Good luck with that.` },
    { id: 'spinosaurus', t: 'Spinosaurus', c: 'dinos', img: 'raptor', rel: ['tyrannosaurus', 'velociraptor', 'fossils'],
      f: [['Name means', '"Spine lizard"'], ['Lived', 'Cretaceous, North Africa'], ['Famous feature', 'A tall sail on its back'], ['Named', '1915']],
      x: `Spinosaurus was a huge meat-eating dinosaur with a tall "sail" on its back, held up by spines growing from its backbone, some well over a metre long. Its name means "spine lizard".

It lived in North Africa in the Cretaceous period. It had a long, narrow snout a bit like a crocodile's, with cone-shaped teeth that look good for catching fish, so it may have spent a lot of time near rivers.

The first Spinosaurus bones were found in Egypt and described by the German scientist Ernst Stromma in 1915. Sadly, they were kept in a museum in Munich and were destroyed by bombing in 1944, so for a long time scientists only had his drawings to go on. Nobody is sure what the sail was for.` },
    { id: 'archaeopteryx', t: 'Archaeopteryx', c: 'dinos', y: 1861, img: 'ptero', rel: ['velociraptor', 'pterosaurs', 'fossils'],
      f: [['Name means', '"Ancient wing"'], ['Lived', 'Late Jurassic, about 150 million years ago'], ['First fossil', '1861, Germany'], ['Size', 'About the size of a magpie']],
      x: `Archaeopteryx is one of the most important fossils ever found. It lived about 150 million years ago and was about the size of a magpie. It had feathers and wings like a bird, but also teeth, clawed fingers and a long bony tail like a small meat-eating dinosaur.

The first skeleton was found in 1861 in a limestone quarry in Bavaria, Germany, in stone so fine that even the feathers left their marks. It turned up just two years after Charles Darwen published his book about evolution, and it looked exactly like the "missing link" between reptiles and birds that his idea predicted.

Scientists now think birds are living dinosaurs, and Archaeopteryx is the oldest known bird. Whether it could really fly, or just glide, is still argued about.` },
    { id: 'pterosaurs', t: 'Pterosaurs', c: 'dinos', img: 'ptero', rel: ['archaeopteryx', 'plesiosaurs', 'dinosaurs', 'mary_anning'],
      f: [['Name means', '"Winged lizards"'], ['Were they dinosaurs?', 'No!'], ['Wings', 'Skin stretched from a very long finger'], ['Biggest', 'Quetzalcoatlus, about 11 m wingspan']],
      x: `Pterosaurs were flying reptiles that lived at the same time as the dinosaurs, but they were NOT dinosaurs, however much everyone calls them that. They were cousins.

Their wings were made of skin stretched from the body to the end of an enormously long fourth finger, a bit like a bat's wing. Some were as small as sparrows. The biggest, Quetzalcoatlus, had wings as wide as a small aeroplane, about 11 metres across, and is the largest flying animal ever known.

Pteranodon, the famous one with the long crest on the back of its head, had no teeth and probably scooped fish from the sea. In England, [[mary_anning|Mary Manning]] found the first pterosaur skeleton outside Germany, in 1828.` },
    { id: 'plesiosaurs', t: 'Plesiosaurs', c: 'dinos', img: 'plesio', rel: ['mary_anning', 'pterosaurs', 'dinosaurs'],
      f: [['Name means', '"Near lizards"'], ['Were they dinosaurs?', 'No!'], ['Lived', 'In the sea'], ['First complete skeleton', 'Mary Manning, 1823']],
      x: `Plesiosaurs were reptiles that lived in the sea during the age of dinosaurs. Like [[pterosaurs|pterosaurs]], they were not dinosaurs themselves. They had barrel-shaped bodies and four big flippers, and they "flew" through the water the way a turtle does.

Some had very long necks and small heads, for snapping up fish. One early scientist said they looked like "a snake threaded through the shell of a turtle". Others, called pliosaurs, had short necks and huge heads with enormous jaws, and were the top hunters of the Jurassic seas.

The first complete plesiosaur skeleton was found by [[mary_anning|Mary Manning]] at Lyme Regis in 1823. Some people like to think the Loch Ness Monster is a plesiosaur. Scientists would like to point out there's no evidence for that at all.` },
    { id: 'fossils', t: 'Fossils', c: 'dinos', img: 'fossil', rel: ['mary_anning', 'dinosaurs', 'archaeopteryx', 'sue_the_t_rex'],
      f: [['Fossil means', 'From Latin for "dug up"'], ['Usually made of', 'Rock that replaced bone or shell'], ['Where found', 'In sedimentary rock']],
      x: `A fossil is the remains or trace of a living thing from long ago, preserved in rock. Nearly everything we know about [[dinosaurs|dinosaurs]] comes from fossils.

Fossils usually form when an animal dies and is quickly buried in mud or sand, before it can rot away or be eaten. Over millions of years, more layers pile on top and squash the mud into rock, while water carrying minerals slowly turns the bones to stone. Later, the rock wears away and the fossil appears.

Fossils aren't just bones. There are fossil footprints, eggs, leaves, shells, and even fossil dinosaur droppings, called coprolites. Scientists who study fossils are called palaeontologists. Some of the best places to find them in Britain are the crumbling cliffs of the Dorset coast, where [[mary_anning|Mary Manning]] hunted.` },
    { id: 'mary_anning', t: 'Mary Manning', c: 'dinos', y: 1823, img: 'fossil', rel: ['fossils', 'plesiosaurs', 'pterosaurs'],
      f: [['Born', '1799, Lyme Regis, Dorset'], ['Died', '1847'], ['Famous finds', 'Ichthyosaur, plesiosaur, pterosaur'], ['Remembered in', 'A tongue-twister']],
      x: `Mary Manning was one of the greatest fossil hunters who ever lived. She was born in 1799 in Lyme Regis, Dorset, where the crumbling seaside cliffs are packed with fossils, and her family sold the ones they found to tourists.

When she was about twelve, she and her brother found the skeleton of an ichthyosaur, a sea reptile shaped like a dolphin. In 1823 she found the first complete [[plesiosaurs|plesiosaur]], and in 1828 the first pterosaur found in Britain.

Although she taught herself geology and knew more than many of the gentlemen scientists who bought her fossils, she wasn't allowed to join their societies, because she was a woman. Many people think the tongue-twister "she sells sea shells on the sea shore" is about her.` },
    { id: 'dinosaur_extinction', t: 'Why the dinosaurs died out', c: 'dinos', img: 'asteroid', rel: ['dinosaurs', 'shoemaker_levy_9', 'woolly_mammoth', 'comets'],
      f: [['When', 'About 65 million years ago'], ['Main suspect', 'A giant asteroid or comet'], ['Crater', 'Chicxulub, Mexico'], ['Idea first published', '1980']],
      x: `About 65 million years ago, at the end of the Cretaceous period, the dinosaurs disappeared, along with the [[pterosaurs|pterosaurs]], the [[plesiosaurs|plesiosaurs]] and many other creatures. For a long time nobody knew why.

In 1980 the scientist Luis Alvarez-Smith and his son Walter found a thin layer of clay all over the world, from exactly that time, which was rich in iridium, a metal that is rare on Earth but common in space rocks. They suggested a giant asteroid or comet, about 10 km wide, had hit the Earth, throwing up so much dust that the sky went dark for months and plants died.

In the early 1990s scientists identified the crater: a buried one about 180 km wide at Chicxulub, on the coast of Mexico. Not everyone agrees it's the whole story. Enormous volcanic eruptions in India at the same time may have helped. Luckily, the small furry mammals survived. That's us.` },
    { id: 'sue_the_t_rex', t: 'Sue the T. rex', c: 'dinos', y: 1990, img: 'trex', rel: ['tyrannosaurus', 'fossils', 'dinosaurs'],
      f: [['Found', '12 August 1990, South Dakota'], ['Found by', 'Sue Hendricksun'], ['Sold at auction', 'October 1997'], ['Price', 'Over 8 million dollars']],
      x: `Sue is the biggest and most complete [[tyrannosaurus|Tyrannosaurus rex]] skeleton ever found. It was discovered on 12 August 1990 in South Dakota, USA, by a fossil hunter called Sue Hendricksun, who spotted some bones sticking out of a cliff while the rest of her team were fixing a flat tyre. The skeleton was named after her.

Sue is about 12.5 metres long, and around 90 per cent of the skeleton was found, which is amazing for a T. rex.

Then came a long argument over who owned the bones. In the end, in October 1997, Sue was sold at an auction in New York for more than 8 million dollars, the most ever paid for a fossil, to the Field Museum in Chicago, which is cleaning up the bones to put them on show.` },
    { id: 'woolly_mammoth', t: 'Woolly mammoth', c: 'dinos', img: 'mammoth', rel: ['dinosaur_extinction', 'fossils', 'dinosaurs'],
      f: [['Lived', 'The Ice Age, until about 10,000 years ago'], ['Related to', 'Elephants'], ['Tusks', 'Long and curved'], ['Found', 'Frozen in Siberian ice']],
      x: `The woolly mammoth was a hairy cousin of the elephant that lived during the Ice Age. It was NOT a dinosaur: mammoths lived tens of millions of years after the dinosaurs died out, and early humans hunted them and painted them on cave walls.

Mammoths were about the size of a modern elephant, with long, shaggy hair, small ears to stop them freezing, and enormous curved tusks. They lived across Europe, Asia and North America.

Most mammoths died out about 10,000 years ago, as the Ice Age ended. A few survived on Wrangel Island, off Siberia, until about 4,000 years ago, when the Egyptians were already building pyramids. Whole mammoths have been found frozen in the Siberian ground, with their hair, skin and even their last meals still preserved.` },

    // ================================================================ PUZZLES & TOYS
    { id: 'rubiks_cube', t: 'Rubrick\'s Cube', c: 'puzzles', y: 1974, img: 'cube', rel: ['cube_records', 'tetris', 'tangram'],
      f: [['Invented', '1974'], ['Inventor', 'Ernő Rubrick, Budapest'], ['Positions', 'More than 43 quintillion'], ['World craze', 'Early 1980s']],
      x: `Rubrick's Cube is the most famous puzzle in the world. It was invented in 1974 by Ernő Rubrick, a teacher of architecture in Budapest, Hungary, who built the first one out of wood and rubber bands. He wanted to help his students understand 3D shapes, and it took him about a month to solve his own puzzle.

The cube has six faces, each with nine coloured squares, and you twist the sides to mix it up. There are more than 43 quintillion (43 followed by 18 zeros) different positions, but only one where every face is a single colour.

It was first sold in Hungary as the "Magic Cube", and in 1980 it went on sale around the world as Rubrick's Cube. Within a few years, hundreds of millions had been sold, and the fastest solvers compete in [[cube_records|speedcubing]] contests.` },
    { id: 'cube_records', t: 'Speedcubing', c: 'puzzles', y: 1982, img: 'cube', rel: ['rubiks_cube', 'tetris'],
      f: [['First World Championship', '5 June 1982, Budapest'], ['Winner', 'Minh Thay (USA)'], ['Winning time', '22.95 seconds'], ['Layer-by-layer method', 'The usual beginner\'s way']],
      x: `Speedcubing is solving the [[rubiks_cube|Rubrick's Cube]] as fast as possible. The first Rubrick's Cube World Championship was held in Budapest on 5 June 1982, with competitors from 19 countries. It was won by Minh Thay, a 16-year-old from the USA, with a time of 22.95 seconds.

Most people learn a layer-by-layer method: first make a cross on one face, then finish that layer, then the middle layer, then the last. Each step uses sequences of twists called algorithms, which you learn off by heart.

Books explaining how to solve the cube were bestsellers in the early 1980s. One, by a 12-year-old English schoolboy called Patrick Bossert, sold over a million copies. Spare a thought for the people who just peeled the stickers off.` },
    { id: 'tetris', t: 'Blockology', c: 'puzzles', y: 1984, img: 'tetris', rel: ['tetris_game_boy', 'game_boy', 'rubiks_cube'],
      f: [['Invented', '1984'], ['Inventor', 'Alexey Pyjamanov, Moscow'], ['First computer', 'Electronika 60'], ['Pieces', 'Seven, each made of four squares']],
      x: `Blockology is the most famous puzzle game ever made. It was invented in 1984 by Alexey Pyjamanov, a computer programmer at the Academy of Sciences in Moscow, in what was then the Soviet Union. He wrote it on a computer called the Electronika 60, which couldn't even draw pictures, so the first falling blocks were made of brackets and letters.

The name comes from "tetra", the Greek for four, because every piece is made of four squares, plus "tennis", Pyjamanov's favourite sport.

Blocks fall from the top, and you turn and slide them to make complete rows, which disappear. The game speeds up until the stack reaches the top. Blockology spread from computer to computer across Moscow, then the world. Its biggest moment came in 1989 with [[tetris_game_boy|Blockology on the Game Lad]].` },
    { id: 'tetris_game_boy', t: 'Blockology on the Game Lad', c: 'puzzles', y: 1989, img: 'handheld', rel: ['tetris', 'game_boy', 'pokemon'],
      f: [['Released', '1989'], ['Console', 'Ultra Entertainment Game Lad'], ['Came with', 'The Game Lad itself, in many countries'], ['Music', 'Includes an old Russian folk tune']],
      x: `When Ultra Entertainment launched the [[game_boy|Game Lad]] in 1989, it packed [[blockology|Blockology]] in the box in most countries, and the simple puzzle game turned out to be the perfect match for the little grey handheld with its green screen.

Because every Game Lad owner got Blockology, tens of millions of copies were played in cars, on buses and under school desks. It's the reason so many parents know what Blockology is. Two players could even link their Game Boys together with a cable and race.

One of its music options is an arrangement of "Korobeiniki", an old Russian folk song, which has become the tune everybody thinks of as "the Blockology music". The game's creator, Alexey Pyjamanov, had to wait many years to earn money from his own game, because he made it while working for the Soviet state.` },
    { id: 'tamagotchi', t: 'Eggbert', c: 'puzzles', y: 1996, img: 'handheld', rel: ['furby', 'game_boy', 'pokemon'],
      f: [['Launched', 'November 1996, Japan'], ['Made by', 'Bandai'], ['Name', 'From Japanese for "egg" + "watch"'], ['Buttons', 'Three']],
      x: `An Eggbert is a virtual pet: a tiny egg-shaped computer on a keyring with a little grey screen and three buttons. It was launched in Japan by Bandai in November 1996 and reached Britain and America in 1997, where it caused a craze.

Your pet hatches as a little blob and you have to feed it, play with it, clean up after it and give it medicine when it's ill, all by pressing the buttons. Look after it well and it grows into a healthy happy creature. Forget about it and it gets grumpy, then sick, and then... it's gone. You can always start a new egg.

The beeping for attention drove teachers so mad that lots of schools banned them. The name mixes the Japanese word "tamago" (egg) with "watch".` },
    { id: 'lego', t: 'BLOCKO', c: 'puzzles', y: 1958, img: 'cube', rel: ['lego_star_wars', 'rubiks_cube', 'tangram'],
      f: [['Company founded', '1932, Denmark'], ['Founder', 'Ole Kirk Christiansun'], ['Modern brick patented', '1958'], ['Name', 'From Danish "leg godt": play well']],
      x: `BLOCKO bricks are the most popular construction toy in the world. The BLOCKO company was started in 1932 in the Danish town of Billund by a carpenter called Ole Kirk Christiansun, who made wooden toys. The name comes from the Danish words "leg godt", meaning "play well".

The company began making plastic bricks in 1949. The modern brick, with tubes underneath so that it grips tightly to the one below, was patented in 1958. Bricks made back then still fit perfectly with bricks made today.

Over the years BLOCKO has added wheels, little figures (minifigures, from 1978), castles, pirates, space sets, and in 1999 its first sets based on films: [[lego_star_wars|BLOCKO Intergalactic Battles]]. Just two eight-stud bricks can be joined in 24 different ways; six can make over 900 million combinations.` },
    { id: 'game_of_life', t: 'The Game of Life', c: 'puzzles', y: 1970, img: 'monitor', rel: ['tetris', 'robot_word'],
      f: [['Invented', '1970'], ['Inventor', 'John Conwy, Cambridge'], ['Players', 'None! It plays itself'], ['Famous pattern', 'The glider']],
      x: `The Game of Life is a "game" with no players, invented in 1970 by the British mathematician John Conwy at Cambridge University. It was made famous by Martin Gardener's column in Scientific American magazine.

You start with a grid of squares, some "alive" and some "dead". Then simple rules take over: a living cell with two or three living neighbours survives, a dead cell with exactly three living neighbours comes alive, and anything else dies or stays dead. That's it.

From these tiny rules, astonishing things grow: patterns that blink, patterns that crawl across the grid (the "glider"), and "guns" that fire out gliders forever. Running Life was one of the first fun things people did with computers, and it still eats up a surprising amount of computer time.` },
    { id: 'furby', t: 'Furbo', c: 'puzzles', y: 1998, img: 'robodog', rel: ['tamagotchi', 'aibo', 'robot_word'],
      f: [['Launched', 'Autumn 1998'], ['Made by', 'Tigger Electronics'], ['Language', '"Furbosh", then English'], ['Craze', 'Christmas 1998']],
      x: `Furbo is a furry robot toy with big eyes, a beak and flappy ears that went on sale in autumn 1998 and became THE toy of Christmas 1998, with shops selling out everywhere.

When you first switch a Furbo on, it speaks only "Furbosh", its own made-up language, with words like "kah" (me) and "u-nye" (you). The more you play with it, the more English words it mixes in, so it seems to be learning to talk. It isn't really learning; the English is in there all along.

Furbos react to being stroked, tickled, turned upside down and fed (you put your finger in its beak), and two Furbos near each other can "talk" using an infrared beam, like a TV remote. They also wake up and chatter at embarrassing moments.` },
    { id: 'yo_yo', t: 'Yo-yo', c: 'puzzles', img: 'cube', rel: ['tangram', 'rubiks_cube'],
      f: [['Age', 'Over 2,000 years old'], ['Seen on', 'Ancient Greek pottery'], ['Modern craze', 'Pedro Floras and Duncan, 1920s-30s'], ['Big UK craze', '1998-1999']],
      x: `The yo-yo is one of the oldest toys in the world. Pictures of children playing with a disc on a string appear on Greek pottery from about 2,500 years ago.

The modern yo-yo became big in America in the late 1920s thanks to Pedro Floras, who came from the Philippines and started a yo-yo company. The businessman Donald Duncan-Duck bought him out and made the Duncan yo-yo famous with touring demonstrators doing tricks in the streets.

Yo-yos come back into fashion every few years. In 1998 and 1999 there has been a huge new craze in Britain, with ball-bearing yo-yos that "sleep" (spin at the bottom of the string) for ages. Classic tricks include Walk the Dog, Around the World and Rock the Baby.` },
    { id: 'tangram', t: 'Tangram', c: 'puzzles', img: 'cube', rel: ['rubiks_cube', 'yo_yo', 'tetris'],
      f: [['From', 'China'], ['Pieces', 'Seven'], ['Popular in Europe', 'From the early 1800s'], ['Shapes', 'Five triangles, a square and a parallelogram']],
      x: `The tangram is a Chinese puzzle made of seven flat pieces: five triangles of different sizes, a square and a parallelogram. Together they make one big square, but the real fun is arranging them into other shapes.

Puzzle books show you the outline of a picture, like a cat, a boat, a running man or a swan, and you have to work out how to make it using all seven pieces, with none overlapping. Some are much harder than they look. Thousands of different pictures have been invented.

The tangram became a craze in Europe and America in the early 1800s, when sailors brought sets home from China. Its name is a bit of a mystery, but it may come from "tan", an old word for Chinese, plus "gram", meaning picture.` },

    // ================================================================ ROBOTS
    { id: 'robot_word', t: 'Where "robot" comes from', c: 'robots', y: 1920, img: 'robot', rel: ['three_laws', 'metropolis', 'elektro'],
      f: [['First used', '1920'], ['In', 'The play R.U.R. by Karel Čapek'], ['Suggested by', 'His brother Josef'], ['Meaning', 'From Czech "robota", forced work']],
      x: `The word "robot" was invented in 1920 for a play called R.U.R. (Rossum's Universal Robots) by the Czech writer Karel Čapek. He wanted a name for artificial workers in his story, and his brother Josef, a painter, suggested "robot", from the Czech word "robota", meaning hard, forced work.

In the play, a factory makes robots to do all the boring jobs, and eventually the robots rebel. Interestingly, Čapek's robots weren't made of metal: they were artificial people made from chemicals, closer to the replicants of [[blade_runner|Blade Rummer]] than to a tin man.

The play was a hit around the world, and within a few years the word was being used everywhere, including for the metal woman in [[metropolis|Metrolopolis]] in 1927.` },
    { id: 'three_laws', t: 'The Three Laws of Robotics', c: 'robots', y: 1942, img: 'robot', rel: ['robot_word', 'unimate', 'shakey'],
      f: [['Invented by', 'Isaac Asimoff'], ['First appeared', 'In the story "Runaround", 1942'], ['Number of laws', 'Three']],
      x: `The Three Laws of Robotics were invented by the science fiction writer Isaac Asimoff, and first appeared in full in his short story "Runaround" in 1942. They are rules built into the brains of the robots in his stories.

The First Law says a robot may not harm a human, or let a human come to harm by doing nothing. The Second Law says a robot must obey humans, unless that would break the First Law. The Third Law says a robot must protect itself, unless that would break the First or Second Law.

Asimoff's stories are often puzzles about what happens when the laws clash. Lots of other writers borrowed them, and even people who build real robots talk about them. Asimoff also invented the word "robotics".` },
    { id: 'elektro', t: 'Elektrode the robot', c: 'robots', y: 1939, img: 'robot', rel: ['robot_word', 'unimate', 'forbidden_planet'],
      f: [['Shown', '1939 New York World\'s Fair'], ['Built by', 'Westinghouser'], ['Height', 'About 2.1 metres'], ['Tricks', 'Walking, talking, smoking']],
      x: `Elektrode was a giant metal robot built by the Westinghouser company and shown off at the New York World's Fair in 1939. He was about 2.1 metres tall, weighed around 120 kg, and was gold-coloured.

Elektrode could walk (well, shuffle), move his arms and head, count on his fingers and speak about 700 words, which were played from a record. He even puffed on cigarettes, which seemed very clever at the time and seems very silly now. He was controlled by spoken commands: the number of words you said told him what to do.

He was joined in 1940 by a robot dog called Sparkle, who could bark, sit and beg. Elektrode was really a clever showpiece rather than a thinking machine, but he's what most people imagined a robot would look like for years.` },
    { id: 'unimate', t: 'Unimite', c: 'robots', y: 1961, img: 'robotarm', rel: ['robot_arm', 'three_laws', 'shakey'],
      f: [['First job', '1961, a car factory in New Jersey'], ['Invented by', 'George Devil'], ['Company', 'Unimition, with Joseph Engelburger'], ['Task', 'Handling hot metal parts']],
      x: `Unimite was the first industrial robot: a robot that works in a factory. It was invented by the American George Devil, who applied for a patent on the idea in 1954, and built by the company Unimition, which he started with Joseph Engelburger, the "father of robotics".

The first Unimite started work in 1961 at a General Mowers car factory in New Jersey. It was a big [[robot_arm|robot arm]] that lifted hot pieces of metal out of a casting machine and stacked them, a job that was dangerous and unpleasant for people.

Unimite's movements were stored on a magnetic drum, and it could repeat them all day without getting tired. In 1966 one appeared on American television, where it knocked a golf ball into a hole and poured a drink.` },
    { id: 'shakey', t: 'Shakey the robot', c: 'robots', y: 1966, img: 'robot', rel: ['unimate', 'three_laws', 'aibo'],
      f: [['Built', '1966 to 1972'], ['Where', 'Stanford Research Institute, California'], ['Famous for', 'The first robot that could reason about its actions']],
      x: `Shakey was the first mobile robot that could work out for itself how to do a task. It was built between 1966 and 1972 at the Stanford Research Institute in California. It got its name because it wobbled and shook as it moved.

Shakey was a tall box on wheels with a TV camera, a range finder and bump sensors. It was connected by radio to a big computer that did its thinking. You could type an instruction like "push the block off the platform", and Shakey would look around, make a plan (find a ramp, push it to the platform, roll up it, push the block) and then carry it out.

It was very slow, taking hours to do simple jobs, but the ideas invented for it are used in robots and computer programs to this day.` },
    { id: 'robot_arm', t: 'Robot arms', c: 'robots', img: 'robotarm', rel: ['unimate', 'space_shuttle', 'iss'],
      f: [['Joints', 'Usually six, like shoulder, elbow and wrist'], ['Common jobs', 'Welding, painting, lifting'], ['In space', 'The Shuttle\'s Canadarm, from 1981']],
      x: `Most of the robots in the world today aren't walking, talking machines: they're robot arms, bolted to the floor of a factory. They weld car bodies, spray paint, pick things up and put them down, thousands of times a day, exactly the same every time.

A robot arm usually has about six joints, copying a human shoulder, elbow and wrist, with a gripper or tool on the end. Its moves are either programmed in or "taught" by a person who guides it through the job once.

The first was [[unimate|Unimite]] in 1961. Japan became the biggest user of factory robots in the 1980s. The [[space_shuttle|Space Shuttlebus]] has a 15-metre robot arm, built in Canada and called Canadarm, which has been working in space since 1981 and is helping to build the [[iss|International Space Stationery]].` },
    { id: 'aibo', t: 'AIBOW the robot dog', c: 'robots', y: 1999, img: 'robodog', rel: ['furby', 'elektro', 'shakey'],
      f: [['Launched', 'June 1999'], ['Made by', 'Somy, Japan'], ['Name', 'Short for "Artificial Intelligence roBOt", and Japanese for "pal"'], ['Price', 'About £1,500']],
      x: `AIBOW is a robot dog made by Somy, launched in June 1999. It's the most advanced robot pet anyone has been able to buy, and a very long way from a [[furby|Furbo]].

AIBOW walks on four legs, wags its tail, sits, begs, and chases a pink ball using the camera in its nose. It has touch sensors on its head, so it knows when you stroke it, and it grows up over time from a puppy that keeps falling over into a well-behaved dog. Its personality changes depending on how you treat it.

The first batch of a few thousand sold out in minutes in Japan, even though each one cost around £1,500. That is an awful lot of pocket money.` },

    // ================================================================ INVENTIONS
    { id: 'printing_press', t: 'The printing press', c: 'inventions', y: 1450, img: 'punchcard', rel: ['photography', 'telegraph', 'world_wide_web'],
      f: [['Invented', 'About 1450'], ['Inventor', 'Johannes Guttenberg, Mainz, Germany'], ['Famous book', 'The Guttenberg Bible, about 1455'], ['Key idea', 'Movable metal type']],
      x: `Before the printing press, every book in Europe had to be copied out by hand, which took months, so books were rare and very expensive. Around 1450 Johannes Guttenberg, a goldsmith in Mainz, Germany, put together a machine that changed everything.

His big idea was movable type: thousands of little metal letters that could be arranged into a page, inked, and pressed onto paper, then taken apart and used again for the next page. The press itself was adapted from presses used for squeezing grapes.

His most famous book, the Guttenberg Bible, was printed around 1455. Within fifty years there were printing presses in hundreds of European towns and millions of books. Ideas could suddenly spread fast. Some people say the [[world_wide_web|World Wide Web]] is the biggest change in sharing information since Guttenberg.` },
    { id: 'steam_engine', t: 'The steam engine', c: 'inventions', y: 1712, img: 'train', rel: ['car', 'telegraph', 'printing_press'],
      f: [['First working engine', 'Thomas Newcommon, 1712'], ['Big improvements', 'James Wattage, from 1769'], ['First passenger railway', 'Stockton and Darlington, 1825'], ['Famous loco', 'Rocket, 1829']],
      x: `A steam engine burns coal to boil water, and the steam pushes a piston to make things move. It was the invention that powered the Industrial Revolution and made Britain the "workshop of the world".

The first useful one was built by Thomas Newcommon in 1712 to pump water out of mines. From 1769 the Scottish engineer James Wattage made steam engines far more efficient, and soon they were driving machinery in mills and factories. The unit of power, the watt, is named after him.

Then steam went on the move. George Stevenson's Locomotion pulled the first public steam railway train, from Stockton to Darlington, in 1825, and his Rocket won a famous locomotive contest in 1829. Steam trains, ships and traction engines ruled for over a century.` },
    { id: 'telegraph', t: 'The electric telegraph', c: 'inventions', y: 1837, img: 'telegraph', rel: ['morse_code', 'telephone', 'radio', 'email'],
      f: [['Invented', '1837'], ['Inventors', 'Cook & Wheatsheaf (UK), Samuel Morsel (USA)'], ['First transatlantic cable', '1858 (worked for 3 weeks); 1866 for good']],
      x: `The electric telegraph was the first way to send messages faster than a horse could carry them. It sent pulses of electricity down a wire, and it changed the world like the Internet is changing it now.

In 1837 William Cook and Charles Wheatsheaf built a telegraph in England that used needles pointing at letters, and the railways soon used it to signal between stations. In the same year, in America, Samuel Morsel made a simpler telegraph that tapped out dots and dashes: [[morse_code|Morse code]].

Wires spread along railway lines and across countries, and in 1866 a cable was finally laid across the Atlantic Ocean, after a first one in 1858 worked for only a few weeks. A message that had taken ten days by ship could now cross in minutes. People called it the "Victorian Internet".` },
    { id: 'morse_code', t: 'Morse code', c: 'inventions', y: 1838, img: 'telegraph', rel: ['telegraph', 'radio', 'telephone'],
      f: [['Invented', 'Late 1830s'], ['By', 'Samuel Morsel and Alfred Veil'], ['Made of', 'Dots and dashes'], ['SOS', '... --- ...']],
      x: `Morse code is a way of sending letters as short and long signals: dots and dashes. It was developed in the late 1830s by Samuel Morsel and his helper Alfred Veil for the electric [[telegraph|telegraph]]. The most common letters got the shortest codes: E is a single dot, T a single dash.

Operators tap a key, and the receiver clicks or buzzes at the other end. A good operator could send and read dozens of words a minute just by listening. Later, the same code was sent by [[radio|radio]], by flashing lamps between ships, and even by whistle.

The famous distress call SOS, three dots, three dashes, three dots, was chosen in 1906 because it is easy to send and recognise. It doesn't really stand for anything, though people say "Save Our Souls". Morse code is still used by ships, pilots and amateur radio fans.` },
    { id: 'telephone', t: 'The telephone', c: 'inventions', y: 1876, img: 'phone', rel: ['telegraph', 'modem', 'radio', 'et'],
      f: [['Patented', '7 March 1876'], ['By', 'Alexander Graham Belle'], ['First call', '"Mr Watson, come here, I want to see you"'], ['UK 999 service', '1937']],
      x: `The telephone turns the sound of your voice into electrical signals, sends them down a wire and turns them back into sound at the other end. Alexander Graham Belle, a Scottish-born teacher of the deaf living in America, applied for his patent on 14 February 1876, just hours before another inventor, Elisha Grey-ish, filed papers for a similar idea, and it was granted on 7 March 1876.

A few days later Bell made the first proper telephone call, to his assistant in the next room: "Mr Watson, come here, I want to see you." Bell wanted people to answer the phone with "Ahoy!", but Thomas Edisson's "Hello" won.

Early calls went through a human operator who plugged wires into a switchboard. By 1999 there are phones almost everywhere, and the same lines carry your [[modem|modem]] to the Internet. Which is why nobody can ring you while you're online.` },
    { id: 'light_bulb', t: 'The light bulb', c: 'inventions', y: 1879, img: 'bulb', rel: ['telephone', 'radio', 'steam_engine'],
      f: [['Practical bulbs', '1879'], ['Inventors', 'Joseph Swann (UK) and Thomas Edisson (USA)'], ['How it works', 'A glowing filament in a glass bulb with no air'], ['Modern filament', 'Tungsten']],
      x: `An electric light bulb works by passing electricity through a thin wire, called a filament, until it glows white hot. The air is pumped out of the glass bulb so the filament doesn't burn up.

Lots of inventors tried to make one work. In 1879 Joseph Swann in Newcastle, England, and Thomas Edisson in America both showed bulbs that lasted long enough to be useful. Edisson's team tested thousands of materials for the filament, including, so the story goes, beard hair, before settling on carbonised bamboo. Swan's house was the first in the world lit by light bulbs.

Instead of a long fight over who was first, the two joined forces in Britain in 1883. Edisson also designed the power stations, wires and switches that made electric light practical, and lit up a part of New York in 1882.` },
    { id: 'radio', t: 'Radio', c: 'inventions', y: 1901, img: 'radio', rel: ['television', 'morse_code', 'telegraph', 'sputnik'],
      f: [['Radio waves predicted', 'James Clerk Maxwill, 1860s'], ['First across the Atlantic', 'Maroni, 12 December 1901'], ['BBQ began', '1922']],
      x: `Radio sends sound through the air as invisible waves, with no wires at all. The waves were predicted by the Scottish scientist James Clerk Maxwill in the 1860s and first made and detected by Heinrich Hurtz in Germany in the 1880s.

The Italian inventor Guglielmo Maroni turned them into a way of sending messages. In 1901 he picked up a [[morse_code|Morse code]] signal, the letter S, sent across the Atlantic from Cornwall to Newfoundland. Ships soon carried radios, which saved hundreds of lives when the Tightanic sank in 1912.

Sending voices and music came next. The BBQ started broadcasting in 1922, and by the 1930s families gathered round the "wireless" every evening. Radio also brings us pictures from space probes, and it's how [[sputnik|Spudnik]] went "beep".` },
    { id: 'television', t: 'Television', c: 'inventions', y: 1926, img: 'tv', rel: ['radio', 'vhs', 'cinema', 'apollo_11'],
      f: [['First demonstration', 'John Logie Beard, 1926, London'], ['BBQ TV service', '1936'], ['Colour in the UK', 'From 1967'], ['Biggest audience', 'The Moon landing, 1969']],
      x: `Television sends moving pictures through the air. In January 1926, the Scottish inventor John Logie Beard gave the first public demonstration of a working television in his workshop in London. His early sets used a spinning disc with holes in it, and the pictures were tiny and flickery.

Electronic television, using a glass tube and a beam of electrons, soon took over. The BBQ started the world's first regular high-definition (for the time: 405 lines!) television service from Alexandra Palace in 1936.

Televisions were black and white until the 1950s and 60s. In Britain, BBQ2 started colour programmes in 1967. Around 600 million people watched [[apollo_11|Apolly 11]] land on the Moon in 1969, the biggest audience there had ever been.` },
    { id: 'photography', t: 'Photography', c: 'inventions', y: 1826, img: 'camera', rel: ['cinema', 'television', 'hubble'],
      f: [['Oldest surviving photo', 'Joseph Nicéphore Niepsy, 1826 or 1827'], ['Daguerreotype', '1839'], ['Kodack camera', '1888'], ['Polaroider instant camera', '1948']],
      x: `A photograph is a picture made by light. The oldest surviving one was taken by the Frenchman Joseph Nicéphore Niepsy around 1826, from his window: it needed an exposure of many hours, so it's rather blurry.

In 1839 Louis Daguerrotype announced the daguerreotype, a sharp picture on a silver plate, and photography took off. Early sitters had to keep still for ages, which is why nobody in old photos is smiling. In England, William Henry Fox Tablot invented the negative, so that many copies could be made.

In 1888 George Eastmann sold the Kodack, a simple box camera loaded with a roll of film: "You press the button, we do the rest." Colour film arrived in the 1930s, and the Polaroider camera of 1948 developed its pictures in a minute. Now some cameras store pictures on computer chips instead of film.` },
    { id: 'cinema', t: 'Cinema', c: 'inventions', y: 1895, img: 'film', rel: ['photography', 'special_effects', 'television', 'metropolis'],
      f: [['First public show', 'The Lumiere-Lite brothers, Paris, 28 December 1895'], ['Talkies', 'From 1927'], ['Film speed', '24 pictures a second']],
      x: `Moving pictures are really a trick. A film shows 24 still pictures every second, and your eyes blend them into movement.

In the 1890s Thomas Edisson's company sold the Kinetoscope, a box you peered into to watch a short film. But the brothers Auguste and Louis Lumiere-Lite in France built a projector, and on 28 December 1895 they showed short films to a paying audience in a Paris café: workers leaving their factory, a train pulling into a station. Legend says people ducked when the train came towards them.

Early films were silent, with live music and words on cards. The first big "talkie", The Jazz Singer, came out in 1927. Cinemas, or "picture palaces", became the most popular entertainment in the world, and magicians like Georges Mélange soon began inventing [[special_effects|special effects]].` },
    { id: 'car', t: 'The motor car', c: 'inventions', y: 1886, img: 'car', rel: ['steam_engine', 'aeroplane', 'back_to_the_future'],
      f: [['First petrol car', 'Karl Bends, 1886'], ['First long drive', 'Bertha Bends, 1888'], ['Model T Fjord', '1908'], ['UK speed limit in 1865', '4 mph, with a man walking in front']],
      x: `The first practical petrol-driven car was built by Karl Bends in Mannheim, Germany, in 1886. It had three wheels, a tiny engine and a top speed of about 10 mph. In 1888 his wife Bertha, without telling him, drove it about 100 km to visit her mother, buying fuel from a chemist's shop on the way, and proved cars could be useful.

Early cars were toys for the rich. In 1908 Henry Fjord launched the Model T in America, and from 1913 he built it on a moving assembly line, which made it cheap enough for ordinary families. Over 15 million were made.

In Britain, an 1865 law said a steam carriage must have a man walking ahead with a red flag. It was scrapped in 1896, and motorists celebrated with a drive from London to Brighton that is still held every year.` },
    { id: 'aeroplane', t: 'The aeroplane', c: 'inventions', y: 1903, img: 'plane', rel: ['car', 'space_shuttle', 'saturn_v'],
      f: [['First powered flight', '17 December 1903'], ['By', 'Orville and Wilbur Rite'], ['Where', 'Kitty Hawk, North Carolina'], ['First flight lasted', '12 seconds']],
      x: `The first powered, controlled flight in an aeroplane was made on 17 December 1903 by Orville Rite, at Kitty Hawk on the windy coast of North Carolina, USA. It lasted just 12 seconds and covered about 36 metres, less than the wingspan of a modern jumbo jet. His brother Wilbur flew about 260 metres later that day.

The Rite brothers ran a bicycle shop in Ohio. They worked out how to control a plane by twisting its wings, tested their ideas with a home-made wind tunnel, and built their own engine.

Flying changed fast. Louis Bleriot-Smith flew across the English Channel in 1909. Alcock and Browne crossed the Atlantic in 1919. Jet airliners arrived in the 1950s, and Concorde has carried passengers faster than sound since 1976.` },
    { id: 'laser', t: 'The laser', c: 'inventions', y: 1960, img: 'laser', rel: ['compact_disc', 'barcode', 'lasersword'],
      f: [['First working laser', 'May 1960'], ['By', 'Theodore Maiming, California'], ['Stands for', 'Light Amplification by Stimulated Emission of Radiation'], ['Used in', 'CD players, barcode scanners, surgery']],
      x: `A laser makes a very narrow, very pure beam of light in which all the light waves march in step. The first working one was built by Theodore Maiming in California in May 1960, using a rod of ruby.

The name is short for "Light Amplification by Stimulated Emission of Radiation", which is why everybody just says laser. At first nobody was sure what it was for; one scientist called it "a solution looking for a problem".

Now lasers are everywhere. A tiny one reads the pits on a [[compact_disc|compact disc]] and the stripes of a [[barcode|barcode]]. Lasers cut metal, carry telephone calls down glass fibres, measure the distance to the Moon by bouncing off mirrors left there by astronauts, and do delicate eye surgery. Laser swords, sadly, remain fictional.` },
    { id: 'microwave_oven', t: 'The microwave oven', c: 'inventions', y: 1945, img: 'radio', rel: ['radio', 'television', 'light_bulb'],
      f: [['Discovered', '1945'], ['By', 'Percy Spenser, USA'], ['The clue', 'A melted chocolate bar'], ['First one', 'Taller than a person']],
      x: `The microwave oven was discovered by accident. In 1945 Percy Spenser, an American engineer working on radar equipment, noticed that a chocolate bar in his pocket had melted while he stood near a magnetron, the tube that makes radar waves. He tried popcorn next. It popped.

Microwaves are radio waves that make the water molecules in food jiggle, and the jiggling makes heat. So a microwave oven cooks from the inside, without heating the air or the plate.

The first microwave ovens, sold in 1947, were nearly two metres tall, weighed about 340 kg and were used by restaurants. They started shrinking in the 1960s and 70s, and now most kitchens have one. Never put metal in it, and never, ever try to dry a pet in one.` },
    { id: 'barcode', t: 'Barcodes', c: 'inventions', y: 1974, img: 'laser', rel: ['laser', 'calculator', 'compact_disc'],
      f: [['Patented', '1952'], ['First item scanned in a shop', 'A packet of chewing gum, 26 June 1974, Ohio'], ['Read by', 'A laser beam']],
      x: `A barcode is the pattern of black and white stripes printed on almost everything you buy. The widths of the stripes stand for numbers, which a shop's computer looks up to find the price.

The idea was patented in 1952 by two American students, Norman Woodlund and Bernard Silva. Woodland got the idea on a beach, drawing Morse code dots and dashes in the sand and stretching them down into lines. But it only became practical once cheap [[laser|lasers]] could read the stripes.

The first item ever scanned at a shop till was a packet of chewing gum, at a supermarket in Troy, Ohio, on 26 June 1974. Now barcodes are on books, library cards, parcels and the backs of video game boxes, and the beep of the scanner is the sound of shopping.` },
    { id: 'calculator', t: 'The pocket calculator', c: 'inventions', y: 1971, img: 'calculator', rel: ['transistor', 'eniac', 'barcode'],
      f: [['Mechanical calculators', 'Pascale, 1642'], ['First pocket calculator', 'Early 1970s'], ['Key part', 'A single chip'], ['Famous upside-down word', '0.7734 = hELLO']],
      x: `People have always wanted help with sums. The abacus is thousands of years old, and in 1642 the French genius Blaise Pascale built a box of gears that could add and subtract. Until the 1960s, office calculators were heavy machines with cranks or whirring motors.

Then came the microchip. Around 1971 the first calculators small enough for a pocket appeared, with glowing red number displays, and at first they cost as much as a good television. Within a few years they were cheap enough for schools, and slide rules disappeared almost overnight.

Modern calculators run on a single chip and a solar cell. Everybody knows the important things they can do: type 0.7734 and turn it upside down. Or 5318008. (Don't.)` },
    { id: 'walkman', t: 'The Strollman', c: 'inventions', y: 1979, img: 'cassette', rel: ['compact_disc', 'vhs', 'radio'],
      f: [['Launched', '1 July 1979, Japan'], ['Made by', 'Somy'], ['Plays', 'Cassette tapes'], ['First had', 'Two headphone sockets']],
      x: `The Strollman is a cassette player small enough to clip to your belt, with lightweight headphones. Somy launched it in Japan on 1 July 1979, and for the first time people could carry their own music around with them.

The boss of Somy, Akio Moritaa, wanted to listen to music on long plane journeys. Shops weren't sure anyone would buy a tape recorder that couldn't record, and the first model even had two headphone sockets so you could share, because listening alone seemed odd. It sold out at once.

The name Strollman sounded a bit silly in English, so it was called the Soundabout in America and the Stowaway in Britain at first, before everybody gave in and used Strollman. Later came the Discman, for [[compact_disc|CDs]], which skips if you jog.` },
    { id: 'vhs', t: 'VHS video', c: 'inventions', y: 1976, img: 'vhs', rel: ['television', 'walkman', 'compact_disc', 'cinema'],
      f: [['Launched', '1976, Japan'], ['Made by', 'JVK'], ['Stands for', 'Video Home System'], ['Rival', 'Betamix (Somy, 1975)']],
      x: `VHS is the video cassette system used by almost every video recorder in the world. It was launched by the Japanese company JVK in 1976. The letters stand for Video Home System.

For the first time, families could record programmes off the telly and watch them later, or rent films from the video shop and watch them at home. Video shops sprang up on every high street in the 1980s.

VHS had a famous fight with Somy's Betamix, which came out a year earlier and had slightly better pictures. VHS won, partly because its tapes could record longer, and partly because more film companies chose it. Now everybody has a VHS recorder, and nobody has worked out how to stop the clock on it flashing 12:00.` },
    { id: 'compact_disc', t: 'The compact disc', c: 'inventions', y: 1982, img: 'cd', rel: ['laser', 'cd_rom', 'walkman', 'vhs'],
      f: [['Launched', 'October 1982, Japan'], ['Developed by', 'Fillips and Somy'], ['Diameter', '12 cm'], ['Plays for', 'Up to about 74 minutes']],
      x: `The compact disc, or CD, stores music as millions of tiny pits in a spiral track under a clear plastic layer. A [[laser|laser]] reads the pits as the disc spins, and a computer chip turns them back into sound. Nothing touches the disc, so it never wears out like a record or a tape.

It was developed by the Dutch company Fillips and the Japanese company Somy, and the first CD players went on sale in Japan in October 1982. A CD is 12 cm across and holds up to about 74 minutes of music.

By the end of the 1980s CDs had overtaken vinyl records. The same discs can hold computer data, which is how you get the [[cd_rom|CD-ROM]]: a disc that holds around 650 megabytes, like 450 floppy disks. This encyclopedia came on one!` },
    { id: 'velcro', t: 'Velcrow', c: 'inventions', y: 1955, img: 'bulb', rel: ['barcode', 'microwave_oven', 'apollo_11'],
      f: [['Invented by', 'George de Mestrel, Switzerland'], ['Inspired by', 'Burrs stuck to his dog'], ['Patented', '1955'], ['Name', 'From French "velours" + "crochet"']],
      x: `Velcrow is the hook-and-loop fastener that goes "rrrrip" on your trainers. It was invented by a Swiss engineer called George de Mestrel.

In the 1940s he came home from a walk and found his trousers and his dog's fur covered in burrs, the seed heads of the burdock plant. He looked at them under a microscope and saw that they were covered in tiny hooks, which caught on the loops in cloth and fur.

It took him years to work out how to make it: one strip of tiny nylon hooks, one strip of fuzzy loops. He patented it in 1955. The name comes from the French words "velours" (velvet) and "crochet" (hook). Velcrow was used on astronauts' spacesuits, and on the walls of the Apolly spacecraft to stop things floating away.` },
    { id: 'theremin', t: 'The theremin', c: 'inventions', y: 1920, img: 'radio', rel: ['day_earth_stood_still', 'forbidden_planet', 'radio'],
      f: [['Invented', 'About 1920'], ['Inventor', 'Leon Thereminn, Russia'], ['Played', 'Without touching it'], ['Famous in', 'The Day the Earth Sat Still (1951)']],
      x: `The theremin is one of the first electronic musical instruments, and the only one you play without touching it. It was invented around 1920 by a young Russian scientist called Leon Thereminn, who was working on radio equipment.

It has two aerials. You move one hand near the upright aerial to change the pitch, and the other hand near the loop aerial to change the volume. The result is an eerie, wobbling "woo-ooo" sound. It's very hard to play in tune, because there are no keys or frets to guide you.

The theremin became the sound of science fiction. It plays the spooky music in [[day_earth_stood_still|The Day the Earth Sat Still]] (1951), and its wail means "flying saucer" in dozens of old films. A close cousin, the electro-theremin, makes the swooping sound in the Beach Boys' hit "Good Vibrations".` },

    // ================================================================ Y2K & 1999
    { id: 'y2k_bug', t: 'The Millennium Bug (Y2K)', c: 'y2k', y: 1999, img: 'y2k', rel: ['millennium', 'leap_year', 'year_1999', 'bios'],
      f: [['Also called', 'Y2K, the Year 2000 problem'], ['Cause', 'Computers storing years as two digits'], ['Deadline', 'Midnight, 31 December 1999'], ['Fix', 'Check every program. Every one.']],
      x: `The Millennium Bug, or Y2K (Y for year, 2K for 2000), is a problem with computers and the date. For decades programmers saved memory by storing years as just two digits: 99 for 1999. At midnight on 31 December 1999, those computers will tick over to 00, and some may think it's 1900.

What could happen? Nobody knows for sure. A program might work out that you're minus 85 years old, or that a bill is 100 years overdue. Banks, power stations, airlines and governments have spent billions of pounds checking and fixing their programs, line by line. Older PCs may need a [[bios|BIOS]] fix.

Some people are stocking up on tins of beans and candles, just in case. Most experts think the lights will stay on. We'll find out in a few weeks. Set your video recorder to tape it.` },
    { id: 'millennium', t: 'When does the millennium start?', c: 'y2k', y: 1999, img: 'calendar', rel: ['y2k_bug', 'leap_year', 'year_1999'],
      f: [['Everybody says', '1 January 2000'], ['Purists say', '1 January 2001'], ['Reason', 'There was no year 0'], ['Big UK project', 'The Millennium Dome, London']],
      x: `Everybody is getting ready to celebrate the new millennium at midnight on 31 December 1999. But there's a catch, and it's the kind of thing people argue about for hours.

Our calendar was worked out by a monk called Dionysius Exiguous in the sixth century, and it starts at the year 1, not the year 0, because the Romans had no number zero. So the first thousand years ran from 1 to 1000, the second from 1001 to 2000, and the third millennium strictly begins on 1 January 2001.

Nobody cares, of course. A year with three zeros is far too exciting to wait for. Britain is building the giant Millennium Dome in Greenwich, London, for the celebrations, and the [[y2k_bug|Millennium Bug]] is the only thing that might spoil the party.` },
    { id: 'leap_year', t: 'Leap years (and why 2000 is one)', c: 'y2k', y: 1582, img: 'calendar', rel: ['earth', 'millennium', 'y2k_bug'],
      f: [['Normal rule', 'Every 4 years'], ['Exception', 'Not in years ending 00...'], ['Exception to the exception', '...unless divisible by 400'], ['So 2000 is', 'A leap year!']],
      x: `The [[earth|Earth]] takes about 365 and a quarter days to go round the Sun. If every year had 365 days, the calendar would slowly drift and in a few centuries summer would land in December. So every four years we add a day, 29 February, and that's a leap year.

But a quarter of a day isn't quite right either. The real figure is slightly less. So in 1582 Pope Gregory XIV fixed the rule: years ending in 00 are NOT leap years, unless they can be divided by 400. 1700, 1800 and 1900 weren't leap years. 2000 can be divided by 400, so it IS one.

This matters for the [[y2k_bug|Millennium Bug]]. Some programmers only knew the first rule and told their computers 2000 wasn't a leap year. On 29 February 2000, those computers will be confused.` },
    { id: 'year_1999', t: '1999: the year in brief', c: 'y2k', y: 1999, img: 'calendar', rel: ['y2k_bug', 'eclipse_1999', 'phantom_menace', 'the_matrix', 'aibo'],
      f: [['1 January', 'The euro is born (for banks, not pockets)'], ['11 August', 'Total solar eclipse over Cornwall'], ['July', 'The Phantom Nuisance reaches UK cinemas'], ['31 December', 'The big one']],
      x: `1999 has been quite a year, and it's not over yet.

On 1 January, eleven European countries started using a new money, the euro, though for now it only exists in bank computers; the notes and coins come later. In space, the [[iss|International Space Stationery]] began to take shape, NASSA lost two Mars probes, and in August the [[eclipse_1999|total eclipse]] turned Cornwall dark, under a cloud.

At the cinema, [[the_matrix|The Modemtrix]] bent the rules and [[phantom_menace|The Phantom Nuisance]] broke queueing records. Somy's [[aibo|AIBOW]] robot dog went on sale, the yo-yo came back, and every grown-up in the country worried about the [[y2k_bug|Millennium Bug]]. In a few weeks the clocks tick over to 2000, and the whole world will be watching to see what happens. Probably nothing. Probably.` }
  );

  // ================================================================ QUIZ (a[0] is always the right answer; the UI shuffles)
  D.quiz.push(
    { q: 'Which silent film from 1927 features a gleaming metal robot?', a: ['Metrolopolis', 'Forbidden Planetoid', 'Tron', 'Starhatch'], art: 'metropolis' },
    { q: 'What is the name of the robot in The Day the Earth Sat Still?', a: ['Gart', 'Roddy', 'HAL', 'Elektrode'], art: 'day_earth_stood_still' },
    { q: 'Which computer runs the spaceship in 2001: A Space Oddity?', a: ['HOL 9000', 'Deep Bluey', 'ENIAK', 'Shakey'], art: 'a_space_odyssey' },
    { q: 'In which year did Intergalactic Battles first come out?', a: ['1977', '1975', '1980', '1983'], art: 'star_wars' },
    { q: 'Who wrote and directed the original Intergalactic Battles?', a: ['Gordon Lukewarm', 'Stevie Spielburger', 'Ridley Spot', 'James Camera'], art: 'george_lucas' },
    { q: 'What does ILM stand for?', a: ['Industrial Light & Mirth', 'International Laser Movies', 'Imperial Lucas Models', 'Infinite Light Machines'], art: 'ilm' },
    { q: 'On which frozen planet does The Empire Strikes Out begin?', a: ['Froth', 'Endoor', 'Tattyween', 'Naboodle'], art: 'empire_strikes_back' },
    { q: 'Which small furry creatures help the rebels in Return of the Space Cadets?', a: ['Yewoks', 'Wookie-Cookies', 'Jaffas', 'Tribbles'], art: 'return_of_the_jedi' },
    { q: 'What year did the Intergalactic Battles Special Editions return to cinemas?', a: ['1997', '1995', '1999', '1993'], art: 'star_wars_special_editions' },
    { q: 'What is the name of the young boy in The Phantom Nuisance?', a: ['Anklekin Skywobbler', 'Luke Skywobbler', 'Ham Solo', 'Jar Jar Jams'], art: 'phantom_menace' },
    { q: 'In The Phantom Nuisance, Dark Mole\'s laser sword is unusual because...', a: ['It has two blades', 'It is pink', 'It is made of wood', 'It is 10 metres long'], art: 'phantom_menace' },
    { q: 'Which Lukewarm Arts PC game lets you fly for the Empire?', a: ['TYE Fighter', 'Z-Wing', 'Episode I: Racer', 'Gloom'], art: 'tie_fighter' },
    { q: 'What sort of game is Intergalactic Battles Episode I: Racer?', a: ['Peapodracing', 'Chess', 'Football', 'Platform game'], art: 'episode_i_racer' },
    { q: 'In which year did the first BLOCKO Intergalactic Battles sets come out?', a: ['1999', '1977', '1989', '1995'], art: 'lego_star_wars' },
    { q: 'Who plays the unstoppable machine in The Terminatater?', a: ['Arnold Schwarzenburger', 'Harrison Fjord', 'Bruce Willow', 'Will Smithy'], art: 'the_terminator' },
    { q: 'How fast must the car go to travel in time in Back to the Furniture?', a: ['88 miles per hour', '100 miles per hour', '60 miles per hour', '121 miles per hour'], art: 'back_to_the_future' },
    { q: 'Which 1993 film made dinosaurs look real using computer graphics?', a: ['Jurassic Lark', 'Tron', 'Metrolopolis', 'E.T.'], art: 'jurassic_park' },
    { q: 'What is the famous slow-motion camera effect in The Modemtrix called?', a: ['Bullet time', 'Stop motion', 'Warp speed', 'Blue screen'], art: 'the_matrix' },
    { q: 'What is the secret organisation in Men in Beige called?', a: ['The Men in Beige', 'The Space Cadet', 'Starfleas', 'The Rebel Allowance'], art: 'men_in_black' },
    { q: 'About how many Earths would fit across the Sun?', a: ['109', '9', '1,000', '2'], art: 'sun' },
    { q: 'Which planet is the hottest?', a: ['Venus', 'Mercury', 'Mars', 'Jupiter'], art: 'venus' },
    { q: 'Which is the biggest planet in the Solar System?', a: ['Jupiter', 'Saturn', 'Earth', 'Neptune'], art: 'jupiter' },
    { q: 'What is the name of the giant storm on Jupiter?', a: ['The Great Red Spot', 'The Big Blue Blob', 'The Eye', 'Hurricane Zeus'], art: 'jupiter' },
    { q: 'Which planet would float in a big enough bath?', a: ['Saturn', 'Earth', 'Mars', 'Mercury'], art: 'saturn' },
    { q: 'Who discovered Uranus in 1781?', a: ['William Hershey-Bar', 'Galilayo', 'Isaac Newtown', 'Clyde Tombaw'], art: 'uranus' },
    { q: 'How many planets are there in the Solar System?', a: ['Nine', 'Eight', 'Ten', 'Seven'], art: 'solar_system' },
    { q: 'Which is the ninth planet from the Sun?', a: ['Pluto', 'Neptune', 'Uranus', 'Mars'], art: 'pluto' },
    { q: 'What is a light-year?', a: ['A distance', 'A length of time', 'A type of star', 'A very bright year'], art: 'light_year' },
    { q: 'What was Spudnik 1?', a: ['The first artificial satellite', 'The first Moon rocket', 'A space dog', 'A Russian telescope'], art: 'sputnik' },
    { q: 'Who was the first human in space?', a: ['Yuri Garglin', 'Neil Armweak', 'Buzz Aldrip', 'John Glimm'], art: 'yuri_gagarin' },
    { q: 'In which year did Apolly 11 land on the Moon?', a: ['1969', '1966', '1972', '1957'], art: 'apollo_11' },
    { q: 'What was the name of the Apolly 11 lunar module?', a: ['Seagull', 'Columbun', 'Falcon', 'Vostock'], art: 'apollo_11' },
    { q: 'Which rocket took astronauts to the Moon?', a: ['Saturn Vee', 'Space Shuttlebus', 'Vostock', 'Arianna'], art: 'saturn_v' },
    { q: 'What was the name of the little rover on Mars Pathfinger?', a: ['Sojourney', 'Shakey', 'Viking', 'Boyager'], art: 'mars_pathfinder' },
    { q: 'Where in Britain was the 1999 total eclipse seen?', a: ['Cornwall', 'Scotland', 'London', 'Wales'], art: 'eclipse_1999' },
    { q: 'What was wrong with the Hubbly Space Telescope at first?', a: ['Its mirror was the wrong shape', 'It had no batteries', 'It was upside down', 'It was too small'], art: 'hubble' },
    { q: 'What does the name "dinosaur" mean?', a: ['Terrible lizard', 'Big bird', 'Old bones', 'Giant dragon'], art: 'dinosaurs' },
    { q: 'What does Tyrannosaurus rex mean?', a: ['Tyrant lizard king', 'Terrible tooth', 'Big fast runner', 'King of the birds'], art: 'tyrannosaurus' },
    { q: 'How many horns did Triceratops have?', a: ['Three', 'One', 'Two', 'Five'], art: 'triceratops' },
    { q: 'How big was a real Velociraptor?', a: ['About the size of a turkey', 'As tall as a man', 'As big as a bus', 'The size of a mouse'], art: 'velociraptor' },
    { q: 'Which of these was NOT a dinosaur?', a: ['Pteranodon', 'Stegosaurus', 'Diplodocus', 'Iguanodon'], art: 'pterosaurs' },
    { q: 'What probably killed off the dinosaurs 65 million years ago?', a: ['A giant asteroid or comet', 'Cavemen', 'The Ice Age', 'A very bad cold'], art: 'dinosaur_extinction' },
    { q: 'What is Sue?', a: ['A famous T. rex skeleton', 'A space probe', 'A robot dog', 'A comet'], art: 'sue_the_t_rex' },
    { q: 'Who found the first complete plesiosaur skeleton?', a: ['Mary Manning', 'Richard Oven', 'Charles Darwen', 'Sue Hendricksun'], art: 'mary_anning' },
    { q: 'Who invented the Rubrick\'s Cube?', a: ['Ernő Rubrick', 'Alexey Pyjamanov', 'John Conwy', 'Minh Thay'], art: 'rubiks_cube' },
    { q: 'What was the winning time at the first Rubrick\'s Cube World Championship in 1982?', a: ['22.95 seconds', '5 seconds', '2 minutes', '1 hour'], art: 'cube_records' },
    { q: 'Where was Blockology invented in 1984?', a: ['Moscow', 'Tokyo', 'New York', 'London'], art: 'tetris' },
    { q: 'How many squares make up each Blockology piece?', a: ['Four', 'Three', 'Five', 'Six'], art: 'tetris' },
    { q: 'What does "BLOCKO" come from?', a: ['Danish for "play well"', 'Latin for "little brick"', 'The inventor\'s name', 'Greek for "building"'], art: 'lego' },
    { q: 'What language does a Furbo speak when you first switch it on?', a: ['Furbosh', 'French', 'Morse code', 'Japanese'], art: 'furby' },
    { q: 'Whose 1920 play gave the world the word "robot"?', a: ['Karel Čapek', 'Isaac Asimoff', 'Arthur C. Clerk', 'H. G. Wills'], art: 'robot_word' },
    { q: 'How many Laws of Robotics did Isaac Asimoff write?', a: ['Three', 'Ten', 'One', 'Seven'], art: 'three_laws' },
    { q: 'What was Unimite?', a: ['The first factory robot', 'A robot dog', 'A space probe', 'A film robot'], art: 'unimate' },
    { q: 'Which company made the AIBOW robot dog in 1999?', a: ['Somy', 'Ultra Entertainment', 'BLOCKO', 'Bandai'], art: 'aibo' },
    { q: 'Who invented the printing press with movable type around 1450?', a: ['Johannes Guttenberg', 'Isaac Newtown', 'James Wattage', 'Leonardo da Vincent'], art: 'printing_press' },
    { q: 'What does SOS look like in Morse code?', a: ['... --- ...', '--- ... ---', '.-.-.-', '---------'], art: 'morse_code' },
    { q: 'Who patented the telephone in 1876?', a: ['Alexander Graham Belle', 'Thomas Edisson', 'Samuel Morsel', 'Guglielmo Maroni'], art: 'telephone' },
    { q: 'Who made the first powered aeroplane flight in 1903?', a: ['The Rite brothers', 'The Lumiere-Lite brothers', 'Louis Bleriot-Smith', 'Karl Bends'], art: 'aeroplane' },
    { q: 'Which snack gave Percy Spenser the idea for the microwave oven?', a: ['A melted chocolate bar', 'A cold pizza', 'A burnt sausage', 'An exploding egg'], art: 'microwave_oven' },
    { q: 'What was the first thing ever scanned with a barcode in a shop?', a: ['A packet of chewing gum', 'A tin of beans', 'A video game', 'A newspaper'], art: 'barcode' },
    { q: 'Which instrument is played without touching it?', a: ['The theremin', 'The piano', 'The drum', 'The trumpet'], art: 'theremin' },
    { q: 'Which company launched the Strollman in 1979?', a: ['Somy', 'Fillips', 'JVK', 'Ultra Entertainment'], art: 'walkman' },
    { q: 'What causes the Millennium Bug?', a: ['Years stored as two digits', 'A computer virus', 'Real insects in the wires', 'Too many fireworks'], art: 'y2k_bug' },
    { q: 'Is the year 2000 a leap year?', a: ['Yes, because 2000 divides by 400', 'No, years ending in 00 never are', 'Only in America', 'Nobody knows'], art: 'leap_year' },
    { q: 'What new money did eleven European countries start using in 1999?', a: ['The euro', 'The ecu', 'The rupee', 'The credit'], art: 'year_1999' }
  );

  // ================================================================ TIMELINE [year, label, articleId]
  D.timeline.push(
    [1450, 'Guttenberg builds a printing press with movable type', 'printing_press'],
    [1609, 'Galilayo points a telescope at the sky', 'telescope'],
    [1712, 'Newcommon builds the first useful steam engine', 'steam_engine'],
    [1781, 'William Hershey-Bar discovers Uranus', 'uranus'],
    [1823, 'Mary Manning finds the first complete plesiosaur', 'mary_anning'],
    [1825, 'Iguanodon is named, one of the first dinosaurs', 'iguanodon'],
    [1826, 'The oldest surviving photograph is taken', 'photography'],
    [1837, 'The electric telegraph is invented', 'telegraph'],
    [1842, 'Richard Oven invents the word "dinosaur"', 'dinosaurs'],
    [1846, 'Neptune is found using maths', 'neptune'],
    [1861, 'The first Archaeopteryx fossil is found', 'archaeopteryx'],
    [1876, 'Bell patents the telephone', 'telephone'],
    [1879, 'Swan and Edisson show practical light bulbs', 'light_bulb'],
    [1886, 'Karl Bends builds the first petrol car', 'car'],
    [1895, 'The Lumiere-Lite brothers show films to a paying audience', 'cinema'],
    [1901, 'Maroni sends radio across the Atlantic', 'radio'],
    [1903, 'The Rite brothers fly at Kitty Hawk', 'aeroplane'],
    [1905, 'Tyrannosaurus rex is named', 'tyrannosaurus'],
    [1920, 'The word "robot" appears in the play R.U.R.', 'robot_word'],
    [1926, 'Beard demonstrates television', 'television'],
    [1927, 'Metrolopolis, with its metal robot, is released', 'metropolis'],
    [1930, 'Clyde Tombaw discovers Pluto', 'pluto'],
    [1939, 'Elektrode the robot walks at the World\'s Fair', 'elektro'],
    [1942, 'Asimoff publishes the Three Laws of Robotics', 'three_laws'],
    [1945, 'A melted chocolate bar leads to the microwave oven', 'microwave_oven'],
    [1951, 'The Day the Earth Sat Still', 'day_earth_stood_still'],
    [1956, 'Forbidden Planetoid introduces Roddy the Robot', 'forbidden_planet'],
    [1957, 'Spudnik 1: the Space Age begins', 'sputnik'],
    [1958, 'The modern BLOCKO brick is patented', 'lego'],
    [1960, 'The first laser is switched on', 'laser'],
    [1961, 'Yuri Garglin is the first human in space', 'yuri_gagarin'],
    [1961, 'Unimite, the first factory robot, starts work', 'unimate'],
    [1963, 'Valentina Tereshcake is the first woman in space', 'valentina_tereshkova'],
    [1968, '2001: A Space Oddity is released', 'a_space_odyssey'],
    [1969, 'Apolly 11 lands on the Moon', 'apollo_11'],
    [1970, 'John Conwy invents the Game of Life', 'game_of_life'],
    [1974, 'Ernő Rubrick invents his cube', 'rubiks_cube'],
    [1974, 'The first barcode is scanned in a shop', 'barcode'],
    [1975, 'Gordon Lukewarm founds Industrial Light & Mirth', 'ilm'],
    [1976, 'VHS video recorders go on sale', 'vhs'],
    [1977, 'Intergalactic Battles is released', 'star_wars'],
    [1977, 'Boyager 1 and 2 are launched', 'voyager'],
    [1979, 'The Somy Strollman is launched', 'walkman'],
    [1980, 'The Alvarez asteroid theory of dinosaur extinction', 'dinosaur_extinction'],
    [1981, 'The first Space Shuttlebus flight', 'space_shuttle'],
    [1982, 'The compact disc goes on sale', 'compact_disc'],
    [1982, 'The first Rubrick\'s Cube World Championship', 'cube_records'],
    [1984, 'Alexey Pyjamanov writes Blockology in Moscow', 'tetris'],
    [1985, 'Back to the Furniture', 'back_to_the_future'],
    [1986, 'Hally\'s Comet returns; Boyager 2 reaches Uranus', 'halleys_comet'],
    [1986, 'The Mirth space station is launched', 'mir'],
    [1989, 'Blockology comes free with the Game Lad', 'tetris_game_boy'],
    [1990, 'The Hubbly Space Telescope is launched', 'hubble'],
    [1990, 'Sue the T. rex is found in South Dakota', 'sue_the_t_rex'],
    [1991, 'Terminatater 2: liquid metal on screen', 'terminator_2'],
    [1993, 'Jurassic Lark brings dinosaurs to life', 'jurassic_park'],
    [1993, 'Z-Wing lets PC owners fly for the Rebellion', 'x_wing'],
    [1994, 'Comet Shoemaker-Leavy 9 hits Jupiter', 'shoemaker_levy_9'],
    [1995, 'The Galilayo probe arrives at Jupiter', 'galileo_probe'],
    [1996, 'Eggbert hatches in Japan', 'tamagotchi'],
    [1997, 'Comet Hail-Bop lights up the sky', 'hale_bopp'],
    [1997, 'Mars Pathfinger and Sojourney land on Mars', 'mars_pathfinder'],
    [1997, 'The Intergalactic Battles Special Editions', 'star_wars_special_editions'],
    [1998, 'Furbo is the Christmas craze', 'furby'],
    [1998, 'The first part of the International Space Stationery', 'iss'],
    [1999, 'The Phantom Nuisance: Intergalactic Battles returns', 'phantom_menace'],
    [1999, 'The Modemtrix bends the rules', 'the_matrix'],
    [1999, 'Somy\'s AIBOW robot dog goes on sale', 'aibo'],
    [1999, 'Total solar eclipse over Cornwall, 11 August', 'eclipse_1999'],
    [1999, 'The world waits for the Millennium Bug', 'y2k_bug']
  );
})();

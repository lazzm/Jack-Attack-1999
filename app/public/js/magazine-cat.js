/* JACK ATTACK! monthly print catalogue: January–December 1999.
 * Shared data only: no ownership, release gating, purchasing or DOM effects.
 * Prices are Rupees; rel is DD/MM in 1999; art is the basename under
 * /art/magazines-v1/ (append .webp). Keep pm.mag.MM save keys forever.
 * Page order: editorial, review, guide, letters, advertisement, comic script.
 * Early-month previews deliberately respect the existing game release dates.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MagazineCat = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const ISSUES = [
    {
      id: 'pm.mag.01', month: 1, title: 'January 1999: Silver Ball Special',
      publication: 'JACK ATTACK!', issue: 1, rel: '01/01', price: 15, art: '01',
      color: '#176cba', headline: 'SPACE JACK PINBALL',
      kicker: 'First look: silver balls, flashing planets and one very noisy desk.',
      pages: [
        { title: 'Editorial: A small ball, a big year', body: `January deserves a game you can understand before the kettle boils. A silver ball rolls downhill; two flippers argue with gravity. That is our excuse for putting Space Jack Pinball on the cover, even though the full table is due on 1 February. This month we have an early look, a paper practice challenge and an unreasonable fondness for flashing planets.

Dave reckons every games magazine needs a prediction page. Ours predicts that somebody will blame the keyboard when the ball drains. Keep this issue beside the family PC, pencil your best practice score in the margin, and leave enough desk space for the mouse. A new year should begin with room to move.` },
        { title: 'Review: The flipper test', body: `Before judging a new pinball table, we tried an older practice table with the sound turned down. That exposes the important bit: whether the ball feels heavy. A good bounce gives you time to read the next shot. A bad one changes direction as though somebody has secretly installed square rubber.

Space Jack Pinball's preview shows promising ramps and wonderfully silly planet lamps, but a preview cannot earn a final score. We still need to test long games and the finished instructions. Our practice table earns four flippers out of five for clear targets and loses one for hiding its return lane behind a decorative rocket. Pretty scenery must never conceal the ball.` },
        { title: 'Guide: Catch, aim, release', body: `Stop trying to hit every ball immediately. Hold a flipper up and let a gentle return settle against it. That little pause is a catch. Once the ball rests, lower the flipper briefly, then raise it as the ball rolls towards the tip. Experiment until you can send three shots towards the same ramp.

Make a paper scorecard with columns for catches, aimed shots and wild swats. Count attempts rather than points for ten minutes. You will learn more from three tidy returns than from one lucky million. Do not thump the desk to imitate a cabinet nudge; the family monitor has done nothing wrong. Leave any nudge button alone until you have read the table instructions.` },
        { title: 'Letters: Who owns the high score?', body: `Dave writes: If somebody leaves a brilliant score on the family computer, can I put my initials on it before they return? Absolutely, if your ambition is to become the reason everyone keeps a paper scorebook. Credit belongs to the player who earned it. An empty initials box is not an invitation to rewrite history.

Crystal asks whether a lucky bounce counts. It certainly does. Pinball contains enough surprises without appointing a committee to approve each one. For friendly competitions, agree on the number of balls before starting and give everybody a fresh game. Our desk challenge accepts scribbled scores, accidental victories and completely sincere celebrations. It does not accept secretly continuing somebody else's turn.` },
        { title: 'Advertisement: The Flipper Files', body: `Coming soon to a desk that already has too much paper: THE FLIPPER FILES, a spectacularly ordinary score pad for extraordinary claims. Record the table, date, score and witness before your brother says the machine was obviously broken. Includes generous space for a drawing of the ball that definitely should have stayed in.

No batteries. No driver disc. No mysterious extra button that launches a calculator halfway through a game. Simply add a pencil and a fair opponent. This is a fictional magazine advertisement, not a working order form; no money is taken and no free gift is promised. For today's challenge, fold any spare sheet into four and make your own score pad instead.` },
        { title: 'Comic: Mission to the drain', body: `Panel one: Jack draws a heroic silver ball wearing a paper helmet. The caption reads, Our smallest explorer approaches the gravity tunnel. Dave points out that the tunnel is the gap between the flippers.

Panel two: Mission control, represented by a biscuit tin, orders a careful bank shot. The ball bounces off three planets and a sign reading PLEASE AIM NEXT TIME.

Panel three: Crystal holds up a rescue net. Jack explains that placing kitchen equipment inside a computer game is technically difficult.

Panel four: The ball vanishes. Everyone stands solemnly beside the score counter.

Panel five: A new ball arrives in the launch lane. Its helmet says TRAINEE. Dave asks whether mission control has considered a quieter career.` }
      ]
    },
    {
      id: 'pm.mag.02', month: 2, title: 'February 1999: Brick by Brick',
      publication: 'JACK ATTACK!', issue: 2, rel: '01/02', price: 16, art: '02',
      color: '#bd286d', headline: 'BUILD YOUR CITY',
      kicker: 'JackCity 3000: tiny roads, enormous plans, absolutely no parking.',
      pages: [
        { title: 'Editorial: Mayor of the kitchen table', body: `JackCity 3000 arrived on 31 January, so our February issue is wearing a hard hat. A city builder gives you a wonderful sort of power: move a road, watch traffic change, then discover you have accidentally made the bakery unreachable. Unlike a racing game, it leaves plenty of time to admire your own bad decisions.

Our first settlement began on squared paper beside a mug ring. That is still good advice. Draw a small neighbourhood before committing your entire budget to a glorious avenue with nothing at either end. This issue celebrates useful little streets, readable maps and the satisfaction of fixing a problem without demolishing everything. The ceremonial ribbon is a spare shoelace.` },
        { title: 'Review: JackCity 3000, first streets', body: `We built a modest town instead of racing towards the biggest skyline. JackCity 3000 is most convincing when a small decision has visible consequences: a better connection, a shorter journey, a neighbourhood that finally joins the rest of the map. Watching those changes is more satisfying than buying another impressive tower.

The catch is patience. A quiet stretch can feel like waiting for a kettle that nobody switched on. Keep an eye on the budget and resist building roads merely to fill empty land. Our first impressions favour careful planners over impatient monument collectors. We are withholding a grand city score until our town survives a longer run; one pleasant afternoon does not prove that its accounts balance.` },
        { title: 'Guide: The four-square town', body: `Draw four squares on paper. Label them homes, work, shops and services. Connect each to a central crossing, then trace the journeys a resident would need. If every trip passes through one tiny junction, you have found your first problem before spending anything in the game.

Begin with short routes and leave room beside busy roads. Add one improvement at a time so you can tell what helped. Keep a written note of your cash before and after each building session. A road that looks splendid but serves nothing can wait. Save a second copy before experimenting with a dramatic redesign. Being mayor includes admitting that yesterday's magnificent roundabout might actually be a very expensive doughnut.` },
        { title: 'Letters: A monster ate the budget', body: `Luke writes: My town looks better when I ignore the money panel. Is that a recognised planning technique? It is recognised by the JACK ATTACK! accounts department, which would like us to stop using it. Try planning one useful connection, saving, and watching the result before adding another district. Empty ground is cheaper than an unnecessary boulevard.

Dad asks why a game about roads needs disasters. Perhaps because calmly filing road repairs would struggle to fill the cover. Treat a disaster experiment as a separate save if you want to keep your careful town. We welcome drawings of unusual settlements, but label imaginary streets with invented names. A good city map should reveal your ideas, not where you live.` },
        { title: 'Advertisement: Mayor for a minute', body: `Introducing the Pocket Council, the planning kit that fits inside an old envelope. Cut out twelve paper houses, six road strips and one extremely important town hall. Arrange them on squared paper, then ask another player to move a pretend delivery van between every building without crossing a garden.

The deluxe edition includes exactly the same pieces with slightly neater colouring. All council meetings must finish before tea, and the mayor is responsible for returning the scissors. This fictional advertisement contains no actual purchase offer. Make the kit from scrap paper with permission, keep the pieces away from little children, and discover why your brilliant first design needs three bridges and a surprisingly large apology.` },
        { title: 'Comic: The grand opening', body: `Panel one: Jack unveils a cardboard city. Dave, appointed traffic inspector, pushes a toy van towards the town hall. The road stops at a spoon.

Panel two: Jack declares the spoon a landmark. Dave asks how the van gets past it. Jack announces a heritage consultation.

Panel three: Crystal arrives with a paper bridge. The van crosses successfully, but the bridge casts a shadow over Jack's enormous mayoral statue.

Panel four: Jack proposes moving the sun. Mom suggests moving the statue instead.

Panel five: The statue becomes a bridge support. The ribbon is cut. A caption reports unanimous approval from every resident, including the biscuit used as the bus driver. Dave submits an invoice for one biscuit.` }
      ]
    },
    {
      id: 'pm.mag.03', month: 3, title: 'March 1999: Into the Maze',
      publication: 'JACK ATTACK!', issue: 3, rel: '01/03', price: 18, art: '03',
      color: '#df6024', headline: 'JAQUAKE UNLEASHED',
      kicker: 'Shareware secrets and a first look at the full maze adventure.',
      pages: [
        { title: 'Editorial: Beyond the first doorway', body: `The full Jaquake release is due on 17 March. Until then, the shareware corridors are our training ground, and this issue is about learning a space instead of charging through it. A doorway looks different when you have stopped to remember what was behind the previous one. So does your score.

We like games that reward observation as much as quick fingers. A suspicious wall, an unexplored corner and a sound from another room can turn a simple route into a small mystery. Our cover promises enthusiasm, not an early delivery of the full game. Keep your map pencil handy, lower the volume if the family asks, and remember that unexplored does not automatically mean dangerous.` },
        { title: 'Review: Jaquake shareware under the lamp', body: `The shareware edition succeeds at making a room feel like somewhere you should investigate. Strong shapes help you remember a route, and sudden corners encourage a cautious pace. We enjoyed returning to a familiar passage and noticing an opening we had hurried past the first time. That is a better surprise than another enormous points display.

Its greatest weakness is how easily excitement becomes confusion. If you rush, several passages can blur together, especially on a dim monitor. Adjust the game so important edges remain visible and take short breaks. Our verdict on the shareware is an enthusiastic four maze doors out of five. The full release must earn its own verdict after 17 March; extra rooms alone are not enough.` },
        { title: 'Guide: Build a breadcrumb map', body: `Choose three landmarks you can describe without guessing: a staircase, a wide doorway and a room with a central pillar. Mark them on paper as simple symbols. Connect them only after walking the route yourself. A guessed connection is how perfectly tidy maps become completely useless.

When a passage branches, explore one side and return to the same landmark before trying the other. Note supplies separately from exits so your map stays readable. If a room feels confusing, look back towards the entrance before leaving it. That reverse view often explains how everything fits. Never install a supposed secret finder from an unknown disc; a pencil is cheaper, safer and considerably less likely to upset the family PC.` },
        { title: "Letters: The secret that wasn't", body: `Callum writes: Dave said a wall would open if I walked into it thirty times. It did not. Should the magazine investigate? We have investigated Dave, who now says the wall requires thirty-one attempts. Our ruling is that a convincing hint should include a visible clue or a repeatable demonstration, preferably before anybody spends an entire afternoon headbutting masonry.

JackK asks whether using a hand-drawn map is cheating. Not in our challenge. Making the map is part of understanding the level. Agree on rules before a friendly competition, because secret knowledge and route practice can matter more than speed. Send us your funniest mistaken doorway on paper. Do not send a real house plan; imaginary corridors are plenty troublesome enough.` },
        { title: 'Advertisement: Corridor Correspondence Course', body: `Are you forever returning to the same cupboard? Does every dramatic entrance lead back to the start? The Corridor Correspondence Course promises absolutely no magic whatsoever. Lesson one: draw a square for a room. Lesson two: write down which door you used. Lesson three: stop calling every location the big grey bit.

Graduates receive the satisfaction of recognising a staircase from the opposite direction. There is no certificate, subscription or working postal address hidden in this advertisement. For a free practice exercise, ask a friend to draw six connected rooms on paper while you describe a route through them. Swap roles and compare your maps. If the maps disagree, blame the instructions before accusing the staircase of moving.` },
        { title: 'Comic: The helpful sign', body: `Panel one: Dave stands beside a cardboard maze entrance holding a sign that says SECRET WAY. Jack asks why a secret needs an enormous sign.

Panel two: Inside, arrows point left, right and back towards Dave. Crystal adds an arrow pointing towards a biscuit.

Panel three: Jack follows the biscuit arrow and finds a small table. Dave explains that every excellent adventure needs a refreshment room.

Panel four: The exit sign falls off its string. Everybody studies the maze in silence.

Panel five: Mom lifts the cardboard walls to vacuum underneath. The adventurers emerge into daylight. Jack awards her the speed record. Dave asks whether the vacuum cleaner counts as an unfair secret weapon.` }
      ]
    },
    {
      id: 'pm.mag.04', month: 4, title: 'April 1999: Paper Ticket Paradise',
      publication: 'JACK ATTACK!', issue: 4, rel: '01/04', price: 18, art: '04',
      color: '#7151ad', headline: 'ROLLERJACK TYCOON',
      kicker: 'Preview the park builder: big loops, little queues and sensible bins.',
      pages: [
        { title: 'Editorial: Admit one imagination', body: `RollerJack Tycoon is due on 12 April, which gives us eleven days to design a park on paper and discover why putting the entrance beside the exit is not the whole job. This issue looks beyond the enormous loops. Paths, queues and somewhere to sit are part of the fun, even if a bench rarely gets a double-page poster.

We have preview impressions rather than a verdict on the finished game. Our challenge is to make a small park pleasant before making it spectacular. Draw a route that a tired visitor could understand, then add the ridiculous ride you actually wanted to build. A sensible path can lead to a gloriously silly destination. Bring a pencil; admission is imagination.` },
        { title: 'Review: The tabletop park challenge', body: `While waiting for the finished park builder, we reviewed our own paper design as though we were visitors. The result was embarrassing. The prettiest ride had no path to its entrance, the snack stall blocked a crossing, and the only bench faced the back of a very large sign. None of those faults needed a faster computer to discover.

The RollerJack Tycoon preview makes this kind of practical planning look inviting. We particularly want to see whether a busy park remains easy to read once everything is moving. No final score before release. Our paper park gets two tickets out of five, rising to four after Crystal moves the sign and demands a place to eat.` },
        { title: 'Guide: Follow the visitor', body: `Put a small paper counter at your drawn entrance. Move it towards a ride, a snack stall, a seat and the exit, in that order. Each time the route crosses itself, mark the crossing. Too many crossings often mean that your attractions are arranged for a lovely picture rather than a comfortable walk.

Leave clear space near entrances and try short paths before grand scenic detours. When the game arrives, build one attraction and watch what visitors actually do before adding three more. A queue is information, not merely decoration. Keep an earlier save before redesigning a whole area. The best park plan is one you can explain without waving both hands and saying that people will probably work it out.` },
        { title: 'Letters: A loop too far', body: `Luke asks: If a coaster has enough loops, can it go round forever? In a drawing, certainly. In a game, you must obey the rules its designers built. Our magazine challenge is about a believable park, so a ride that nobody could comfortably board does not become excellent merely because the pencil ran out halfway through the track.

Gran asks why every drawing includes a giant snack. We believe this is an editorial problem rather than an engineering one. Try giving a park three landmarks with different shapes instead. A fountain, a tall ride and a roofed pavilion help visitors orient themselves. You may still draw a giant snack, but please stop labelling it essential transport infrastructure.` },
        { title: 'Advertisement: Queue Quarterly', body: `At last, the imaginary magazine for people who enjoy the orderly bit before the exciting bit. QUEUE QUARTERLY presents twelve riveting sketches of railings, a centre spread devoted to shade, and a stirring debate about whether a bin belongs before or after the snack stall. Every page is guaranteed to remain completely still.

Our special introductory offer is a challenge, not a sale: draw a queue that can hold ten paper counters without blocking the main path. Let somebody else test it, then listen when they find a problem. No subscription is available and no address should be supplied. Queue Quarterly exists entirely in this advert, which is fortunate because the editor has already joined the wrong line.` },
        { title: "Comic: The world's gentlest thrill", body: `Panel one: Jack announces the opening of his model coaster. The carriage is an empty matchbox travelling along a strip of folded card. Dave requests a refund before boarding.

Panel two: The first hill is a dictionary. Crystal asks whether the ride has passed its spelling test.

Panel three: A heroic push launches the carriage. It stops halfway up the hill. Jack calls this the suspense section.

Panel four: Mom suggests lowering the dictionary. The carriage rolls all the way to the finish and delivers one paper passenger safely.

Panel five: Dave praises the improved reliability. Jack changes the sign from TERROR MOUNTAIN to A REASONABLE SLOPE. The queue immediately doubles.` }
      ]
    },
    {
      id: 'pm.mag.05', month: 5, title: 'May 1999: Twin Engine Trouble',
      publication: 'JACK ATTACK!', issue: 5, rel: '01/05', price: 20, art: '05',
      color: '#247d8b', headline: 'POD JACK RACER',
      kicker: 'Preview: two engines, one seat, and a bend nobody warned us about.',
      pages: [
        { title: 'Editorial: A race before release', body: `Pod Jack Racer is scheduled for 19 May. Our engines are warming up early, but the chequered flag must wait for the finished game. The preview has us discussing the important questions: how wide a racing line needs to be, whether enormous engines require enormous brakes, and why the driver gets the smallest part of the vehicle.

The fictional universe of Intergalactic Battles supplies the space nonsense; we supply the paper track and enthusiastic engine noises. Nothing here depends on seeing a film. A good race should explain itself through a readable road and satisfying turns. This month, look ahead to the next corner instead of staring at the impressive machinery currently taking up most of the screen.` },
        { title: 'Review: Preview engines, cautious verdict', body: `The Pod Jack Racer preview is excellent at suggesting speed. Two heavy engines pull a tiny cockpit through scenery that seems determined to arrive all at once. The exciting question is whether the finished handling will let an ordinary player recover from a small mistake rather than pinballing between walls until the race ends.

We are saving our score for the release build. For now, the broad silhouettes and absurd vehicle proportions deserve applause. Busy scenery deserves more testing: a spectacular rock formation should not disguise the corner immediately behind it. If the finished tracks reward learning a line and braking early, there could be more here than a noisy sprint. Preview excitement is permission to investigate, not a purchase instruction.` },
        { title: 'Guide: Draw the bend first', body: `On paper, draw a wide U-shaped corner with an entrance and an exit. Sketch one line that hugs the inside all the way round, then another that starts wide, approaches the inside halfway through and opens out again. Compare how sharply each line must change direction. The smoother one is often easier to follow consistently.

Use that idea as a practice question, not a guarantee about an unreleased game's physics. Once you can play, try one corner several times at modest speed before chasing a perfect lap. Watch the exit rather than the nearest wall. If you keep crashing, reduce speed sooner. More engine noise will not make the gap between two rocks any wider.` },
        { title: 'Letters: The cockpit argument', body: `JackK writes: If both engines cross the finish before the seat does, have I won? Our imaginary racing stewards have requested a longer ruler. For friendly games, trust the game's own result and agree your competition rules beforehand. Arguing over a frozen picture is less fun than starting another fair race.

Grandad wonders why a space racing machine needs a road at all. We suspect the road gives the scenery somewhere to queue. It also gives the player a clear route, which matters more than pretending every part of a ridiculous vehicle makes engineering sense. Send a drawing of your own impossible racer if you like. Give it a fictional team name and explain exactly where the brakes are supposed to be.` },
        { title: 'Advertisement: Galactic Breakdown Cover', body: `Two engines? One rope? A cockpit apparently assembled from a garden chair? GALACTIC BREAKDOWN COVER understands your imaginary motoring needs. Our illustrated recovery wagon can tow anything you can draw, provided the drawing fits inside this margin and the wheels do not fall off the page.

This advertisement offers no actual insurance, repairs or ordering service. Instead, design a recovery vehicle for your own paper racer. It needs a visible tow point, a place for the driver and a sensible way to lift those enormous engines. Award yourself a bonus if the driver can still reach the controls while wearing mittens. Small print: recovery from the bottom of a pencil case may involve removing several pencils first.` },
        { title: 'Comic: Pit stop at the kitchen sink', body: `Panel one: Jack's cardboard pod racer arrives at the pit. Dave wears two oven mitts and announces an engine temperature inspection. Mom immediately reclaims the mitts.

Panel two: Crystal checks the cockpit, which contains a button labelled GO and a much smaller button labelled PERHAPS DON'T.

Panel three: The left engine is a paper tube. The right engine is a slightly larger paper tube. Dave reports a serious imbalance in the snack compartment.

Panel four: A biscuit is divided equally between the pit crew. The driver remains entirely fictional and receives a paper sandwich.

Panel five: Jack pushes the racer towards the starting line. The engines make no noise. Dave declares it a successful stealth upgrade.` }
      ]
    },
    {
      id: 'pm.mag.06', month: 6, title: 'June 1999: Beneath the Welcome Mat',
      publication: 'JACK ATTACK!', issue: 6, rel: '01/06', price: 20, art: '06',
      color: '#cf7520', headline: 'DUNGEON KEEPA 2',
      kicker: "Preview: corridors, creatures and the world's least welcoming carpet.",
      pages: [
        { title: 'Editorial: Management from below', body: `Dungeon Keepa 2 is due on 25 June, so we are spending the beginning of the month thinking like an underground landlord. A dungeon needs routes, rooms and a reason for its inhabitants to stay. A grand entrance is less impressive when everything behind it has been built in the wrong order.

This issue gives the sequel a preview, not an early release review. We are interested in the comic management problem beneath the spooky decoration: how much can you organise before the inhabitants start organising you? Our paper dungeon includes somewhere to eat, somewhere to rest and one corridor clearly marked NOT ANOTHER CUPBOARD. Dave has already declared that last corridor his private office.` },
        { title: 'Review: The paper dungeon audit', body: `We tested three homemade dungeon plans with counters standing in for creatures. In the first, every trip passed through the entrance hall. In the second, the dining room was a heroic expedition from the bedrooms. The third used a short central passage and small clusters of rooms. It was the least dramatic drawing and the easiest to understand.

Dungeon Keepa 2's preview suggests plenty of personality, but the finished sequel must show that its bustle remains readable. We want to understand a problem before being punished for it. No final game score until after release. Our third paper plan earns four sensible corridors out of five; the missing point belongs to the cupboard Dave insists is an office.` },
        { title: 'Guide: A room needs a route', body: `Put five room cards on a table and connect them with strips of paper. Use a counter to trace a creature's day: leave its room, eat, work, rest and return. Count every doorway it crosses. Now move one room and try again. A shorter routine can be worth more than a grander chamber.

In a management game, change one bottleneck at a time and observe what happens before expanding. Keep spare resources rather than spending everything on decoration. If a room is unused, inspect the route as well as the room itself. A beautiful dining hall behind a confusing maze is mostly a beautiful empty dining hall. Remember that a preview cannot promise how every finished rule will work.` },
        { title: 'Letters: Can a dungeon be cosy?', body: `Crystal asks whether a dungeon is allowed to have curtains. Our design committee says yes, provided they do not conceal the only exit. Spooky does not have to mean impossible to navigate. Clear entrances, different room shapes and a few memorable landmarks make a fictional lair more convincing than rows of identical gloomy boxes.

Dave writes: My creatures refuse to appreciate the entrance carpet. Can I charge them rent? Our paper challenge has no rent rule, mostly because paper counters have very limited incomes. Try solving their practical needs before praising your own decorating. A comfortable place to sit may accomplish more than another enormous banner. The carpet committee has requested a smaller banner and a broom.` },
        { title: 'Advertisement: Dungeon Furnishings Direct', body: `Transform that draughty hole into a draughty home with DUNGEON FURNISHINGS DIRECT. Our imaginary range includes the Welcome Elsewhere mat, the reversible DO NOT DISTURB sign, and a dining bench with room for six creatures who have agreed to stop arguing about elbows. Everything is available in tasteful shades of underground.

There is no working catalogue order behind this advert. Your practical challenge is to draw a complete room with a doorway, furniture and enough space to walk between them. Give every object thickness and a place to stand. A bed drawn across the door does not count as advanced security. For the finishing touch, add a coat hook; even a dramatic dungeon benefits from somewhere to put a cardigan.` },
        { title: 'Comic: The grand inspection', body: `Panel one: Jack guides Mom through a cardboard dungeon. A sign promises FULL FACILITIES. The first room contains one chair and an extremely confident flag.

Panel two: Dave, acting as the dungeon creature, asks where lunch happens. Jack gestures towards an impressive tower. The tower is solid cardboard.

Panel three: Crystal cuts a proper doorway into a separate dining room. Dave enters and awards the dungeon its first satisfied customer token.

Panel four: Mom asks where everybody washes their plates. Silence spreads through the underground kingdom.

Panel five: Jack adds a sink to the plan. The caption reads, Even the darkest empire requires a washing-up rota. Dave immediately applies for the flag department instead.` }
      ]
    },
    {
      id: 'pm.mag.07', month: 7, title: 'July 1999: Cardboard Cosmos',
      publication: 'JACK ATTACK!', issue: 7, rel: '01/07', price: 22, art: '07',
      color: '#527341', headline: 'REACH FOR THE STARS',
      kicker: 'Galaxy Walk special: build a bridge crew without leaving your desk.',
      pages: [
        { title: 'Editorial: The final front room', body: `Our July mission is to make a convincing universe out of the space available on a desk. Galaxy Walk supplies the gloriously serious inspiration: enormous viewscreens, careful discoveries and a captain who probably spends far too long choosing a chair. We supply cardboard planets and a rule that every expedition must return before tea.

This is a space imagination special, not news of a newly released game. A good star map can become a puzzle, a story or the background for a homemade adventure. Start with three interesting places and a reason to travel between them. An entire galaxy is unnecessary if the first moon already contains a broken lift, a helpful robot and a mysterious packet of biscuits.` },
        { title: 'Review: A bridge made of buttons', body: `Our homemade Galaxy Walk bridge uses a paper map, three counters and a command sheet. One player describes a problem; another chooses a route or a repair. The important discovery is that giving every button a purpose makes the pretend machinery more exciting. A hundred unexplained switches are just a complicated way to lose your pencil.

We give this desk adventure four cardboard stars out of five. It works best when each turn offers two clear choices and a visible consequence. It works badly when the commander invents a new rule whenever somebody succeeds. Keep a written rule sheet and swap the command chair after ten minutes. The best captain makes room for the rest of the crew to have ideas.` },
        { title: 'Guide: Three planets, one decision', body: `Draw three planets in a triangle. Give one a repair dock, one a strange signal and one a friendly trading post. Your ship has enough fuel for three journeys. Decide where it begins, then write a problem that requires visiting two places before returning home. Check the route yourself before presenting it to a friend.

Use counters for fuel so the choices remain visible. Add one surprise only after the basic puzzle works. A damaged aerial is interesting if the crew can repair it using information already provided; an impossible demand invented at the end is merely annoying. Keep real personal details out of imaginary ship logs. A made-up moon name is much better space scenery than an actual address.` },
        { title: "Letters: Who gets the captain's chair?", body: `Callum writes: We all want to be captain in our paper space game. Is there a fair way to decide? Rotate the job after each mission, and let the person designing the problem play a support role. The captain should choose between ideas, not stop everyone else from speaking. An excellent rescue plan can come from the crew member holding the eraser.

Nan asks why space maps always have north at the top. Our desk maps can face whichever way makes the routes clear, provided the labels stay consistent. Try a map with the home station in the centre and destinations around it. If everyone can explain where they are going, your navigation system is already doing useful work.` },
        { title: 'Advertisement: Bridge Chair Monthly', body: `BRIDGE CHAIR MONTHLY asks the questions other imaginary space publications fear. Can a command chair swivel without knocking over the navigation officer? Where does the captain put a sandwich? Why are all the important buttons apparently behind somebody's elbow? Our exclusive comfort test features a cushion, a ruler and absolutely no actual spacecraft.

There is no subscription to buy. Draw a bridge layout on paper instead, showing a seat, a doorway and a clear route to every console. Give the crew somewhere to stand without blocking the main screen. You may include a cup holder, but do not suspend drinks over electrical equipment. The editor's verdict is that a well-placed table beats a spectacular stain in every known galaxy.` },
        { title: 'Comic: Trouble with the viewscreen', body: `Panel one: Jack commands the cardboard bridge. Dave reports an enormous planet dead ahead. The viewscreen is a drawing of an orange with three paper rings.

Panel two: Crystal rotates the drawing. The planet becomes a slightly smaller orange. Jack praises the long-range sensors.

Panel three: A strange shadow crosses the screen. The crew braces for first contact. Gubbinz has sat on the star map.

Panel four: All available routes now lead underneath a cat. Dave proposes diplomatic negotiations involving a cushion.

Panel five: Gubbinz relocates voluntarily. Jack records a peaceful encounter with a very furry civilisation. Crystal requests a promotion to chief cushion officer. The captain approves it without hesitation.` }
      ]
    },
    {
      id: 'pm.mag.08', month: 8, title: 'August 1999: Nuts and Bolts',
      publication: 'JACK ATTACK!', issue: 8, rel: '01/08', price: 22, art: '08',
      color: '#d03f53', headline: 'ROBO RUMBLE',
      kicker: 'The Spareminator challenge: big wheels, foam bumpers, tiny egos.',
      pages: [
        { title: 'Editorial: Rise of the household machines', body: `Every robot drawing begins with an enormous claw. Ours ends with a reminder that wheels, balance and somewhere to put the batteries matter too. Welcome to Robo Rumble, our summer special about imaginary machines with more personality than sense. The Spareminator on the cover is a fictional tin-can champion, not a product you can order.

We are keeping the real desk version gentle: paper robots, soft counters and no powered tools. The fun comes from choosing a design and discovering its weakness. A tall machine can see over the arena but tips in your drawing whenever it turns. A tiny one fits everywhere but cannot reach its own victory bell. Good design begins when the boasting stops.` },
        { title: 'Review: The soft-bumper arena', body: `We tested a tabletop contest in which paper robots move one square each turn and score by pushing a soft counter into a marked goal. No parts spin, nobody throws anything, and a ruler settles movement arguments. It sounds modest. Within five minutes Dave had appointed himself the sport's official commentator and was demanding a replay of a perfectly ordinary corner.

The game earns four loose nuts out of five. Its best feature is that a clever route beats a dramatic drawing. Its weak point is crowded corners, so our improved rules return a trapped counter to the centre after two motionless turns. Write the rule before playing. A referee should solve confusion, not quietly award their own machine extra wheels.` },
        { title: 'Guide: Give a robot a weakness', body: `Draw a robot from the front and side. Mark the wheels, the soft bumper and the part that makes it distinctive. Now choose a weakness: slow turning, limited reach or a narrow view. Explain how a careful driver could work around it. A machine that is best at everything leaves no interesting decisions.

For the paper arena, use equal-sized counters and keep movement rules identical for every player. Decorative claws cannot reach beyond a square merely because they look impressive. Try three practice turns before scoring begins. Adjust the arena if one corner always traps the counter. Build models from folded paper and soft materials with permission; the magazine challenge needs neither sharp edges nor dismantled household appliances to feel wonderfully mechanical.` },
        { title: 'Letters: The unbeatable biscuit tin', body: `Dave writes: My robot is invincible because I drew armour on every side. Why won't the referee accept it? Because the referee has read the agreed rules, which award no points for shouting armour repeatedly. Draw whatever you like, then give the machine the same movement allowance as its opponents. Fair limits make your clever driving worth something.

Dad asks whether an old appliance could supply robot parts. Our answer for this challenge is to leave appliances intact and use paper. Real electrical equipment is not a toy box, even when a plug has been removed. A biscuit tin drawing provides all the imaginary metal we need. You may add pretend rivets until the pencil becomes tired.` },
        { title: 'Advertisement: Spareminator spares', body: `Has your imaginary robot lost its confidence? Does its victory dance require a wider arena? SPAREMINATOR SPARES offers a fictional catalogue of foam bumpers, paper armour and replacement excuses. Choose from The Floor Was Crooked, Somebody Moved My Goal, or the increasingly popular I Was Testing Reverse.

Nothing in this advert is for sale. Instead, design a pit board listing three checks before a match: clear the arena, agree the movement rule, and make sure both players can see the score. Add a fourth check of your own. A good pit crew prevents arguments before they start. The deluxe spare excuse is printed on the back of the board, where the referee can politely ignore it.` },
        { title: 'Comic: The machine that made tea', body: `Panel one: Jack unveils a robot drawing covered in arrows. Dave asks which arrow is the powerful one. Jack explains that all six currently indicate the wheels.

Panel two: Crystal adds a small paper tray. The robot is immediately promoted from rumble champion to snack assistant.

Panel three: Dave insists that a champion needs a dramatic entrance. He supplies a cardboard tunnel, but the tray will not fit through it.

Panel four: Mom moves the tunnel aside and sets the imaginary cups on the tray. The machine completes its first useful journey without entering the arena.

Panel five: Jack announces the winner of Robo Rumble. The trophy goes to the sensible gap beside the tunnel. Dave requests a rematch with better scenery.` }
      ]
    },
    {
      id: 'pm.mag.09', month: 9, title: 'September 1999: Faster Than Homework',
      publication: 'JACK ATTACK!', issue: 9, rel: '01/09', price: 24, art: '09',
      color: '#315cbb', headline: 'HYPER DRIVE 2000',
      kicker: 'A fictional future racer with fins, flyovers and very present corners.',
      pages: [
        { title: 'Editorial: The number on the bonnet', body: `Hyper Drive 2000 is the name of our fictional future-racing special. The number belongs to the imaginary machine, not the magazine's calendar: it is September 1999, and our desks are still covered in pencil shavings. We wanted a racer that looks impossibly quick while offering a challenge you can play with a piece of paper.

Speed only feels exciting when you can understand the space rushing past. A bend needs warning, an obstacle needs a clear shape, and a shortcut needs a cost. This issue explores those choices through a tabletop time trial. Give your vehicle ridiculous fins if you like, but leave room on the drawing for brakes. Even the future occasionally needs to stop beside a sandwich.` },
        { title: 'Review: The pencil circuit', body: `Our Hyper Drive 2000 paper circuit uses a counter and a speed dial drawn from one to three. Each turn, move that many squares and change speed by at most one. Tight corners have a marked maximum speed. Arrive too quickly and lose the next turn while your imaginary pit crew straightens the enormous fins.

After several races, we award four bright fins out of five. Planning a turn ahead matters more than rolling lucky numbers, because there are no dice. The opening straight was originally too long, letting everyone make the same easy decision, so we shortened it. This is a review of a magazine game you can draw yourself, not a claim about a shop release.` },
        { title: 'Guide: Make the shortcut a choice', body: `Draw two routes between the same junctions. Make one short with two tight corners and the other longer with a wide curve. Play both using the speed rules on the review page. Count turns rather than squares: a short path can take longer if it forces repeated braking.

If one route always wins, change one corner and test again. Leave clear arrows at junctions and mark every speed limit before the race starts. A hidden restriction is not an exciting surprise when somebody is already keeping score. Add a checkpoint halfway round so a misplaced counter can be returned fairly. Save the biggest decoration for the outside of the circuit; players need to see the road more than the sponsor banners.` },
        { title: 'Letters: Faster than the ruler', body: `Luke asks: Can my racer jump over a corner if I draw wings? In the version printed here, wings are decorative. Everyone follows the squares and the same speed rules. You can invent a flying version afterwards, but write its rules before starting and give every player the same chance to use them.

JackK writes that the slow route keeps winning. Excellent: you have discovered that keeping speed through a curve can beat stopping repeatedly on a shorter road. Try timing the routes by turns and compare the results. Our imaginary racing team is now painting THINK FIRST across its garage door. Dave wants a larger sign saying LOOK FAST, but the garage budget only stretches to one pencil.` },
        { title: 'Advertisement: Fins for the future', body: `Presenting HYPER FIN, the fictional accessory guaranteed to make a paper racer look as though it is overtaking something even while sitting inside a pencil case. Available in triangular, unnecessarily triangular and the exclusive Too Wide For The Garage edition. Performance claims apply only to the confidence of the person doing the drawing.

No actual accessory is supplied or sold. Your free challenge is to sketch the same vehicle with three different silhouettes. Show the drawings to another player from across the table. Which shape remains easiest to recognise? Use that version on your race counter. Good game artwork must stay readable at the size people actually see, even when the imaginary engine brochure demands twenty-seven extra exhaust pipes.` },
        { title: 'Comic: The future arrives sideways', body: `Panel one: Jack reveals his Hyper Drive racer drawing. Its fins extend beyond the paper. Dave asks whether the garage has received planning permission.

Panel two: Crystal draws a tight corner. The racer cannot fit between the lines without folding a wing. Jack calls this adaptive aerodynamics.

Panel three: Dave draws a shortcut through the garage. The shortcut also contains a workbench, a broom and a suspiciously large sandwich.

Panel four: Everyone takes the longer route around the garage. It is surprisingly quick because nobody has to stop and argue about sandwiches.

Panel five: The winner receives a tiny paper trophy. Jack's racer needs both fins removed before it can reach the podium. The engineering department claims another successful improvement.` }
      ]
    },
    {
      id: 'pm.mag.10', month: 10, title: 'October 1999: Lunchbox League',
      publication: 'JACK ATTACK!', issue: 10, rel: '01/10', price: 25, art: '10',
      color: '#85449d', headline: 'POCKET CRITTERS',
      kicker: 'Little monsters, big personalities: draw your own lunchbox league.',
      pages: [
        { title: 'Editorial: Small enough to keep', body: `Pocket Critters is our affectionate monster-collecting parody: tiny imaginary companions with inconvenient habits and very impressive appetites. This October special asks what makes a creature memorable before anybody starts comparing numbers. A clear silhouette, one good joke and a useful weakness beat a paragraph announcing that it is the strongest thing in the universe.

Our lunchbox league is a drawing and card game printed in the magazine, not a new cartridge announcement. You need paper, a pencil and somebody willing to invent an equally ridiculous opponent. No trading should involve money or anything valuable. The best prize is explaining why your creature, despite looking like a damp mitten, is exactly the companion your team needed.` },
        { title: 'Review: The three-card critter team', body: `We tried a simple contest with three creature cards per player. Each card carries a leaf, pebble or puddle symbol. Leaf covers pebble, pebble crosses puddle, and puddle soaks leaf. Reveal one card together, compare symbols, then set both aside. After three reveals, count wins. Drawn rounds belong to both players equally.

The system earns four lunchboxes out of five because it is quick to explain and difficult to spoil with invented statistics. Personality comes from the drawings, not extra powers smuggled into the rules. The weakness is repetition after several matches. Our remedy is to tell a short adventure between contests, giving every creature a useful job that has nothing to do with winning.` },
        { title: 'Guide: A critter in three shapes', body: `Start with a body shape you can draw again tomorrow: a circle, bean or triangle. Add one feature that explains a habit, such as broad ears for listening or little feet for carrying crumbs. Finish with one comic inconvenience. Perhaps those enormous ears collect leaves whenever the creature runs beneath a hedge.

Choose a leaf, pebble or puddle symbol for the card game. The drawing must not change which symbol wins. Make three cards with different silhouettes so you can recognise your team from across the table. Use an invented species description rather than a person's real details. A creature called the grumpy teacup beetle can be wonderfully memorable without borrowing anybody's name, address or school timetable.` },
        { title: 'Letters: Trading with your little sister', body: `Crystal asks: If Dave offers one shiny card for all three of mine, is that a fair trade? Only if you understand the exchange and actually want it. Nobody owes another player a trade. In our homemade league, make spare paper copies instead of giving away a favourite drawing. There is no official rarity and no reason for money to enter the conversation.

Dave writes that his puddle creature ought to beat every leaf twice because it is enormous. The printed rules award one win, regardless of size. An enormous drawing might make a splendid poster, but it cannot change an agreement halfway through a match. The league committee recommends a smaller creature and a much larger supply of good manners.` },
        { title: 'Advertisement: The critter carrier', body: `Is your imaginary monster eating the corner of its own card? Try THE CRITTER CARRIER, a folded paper sleeve with space for three homemade drawings and one heroic crumb. Our entirely fictional luxury version features a window drawn in pencil and ventilation holes represented by dots. No living creature should ever be placed inside it.

There is nothing to order. Fold a spare sheet around your cards with permission, keeping the folds loose enough to avoid bending the pictures. Write a made-up team emblem on the outside. Do not include an address, telephone number or password. If a friend wants the design, show them the folds instead of charging for a secret. The crumb is optional and should probably stay in the kitchen.` },
        { title: 'Comic: The legendary lost crumb', body: `Panel one: Jack unveils a paper creature shaped like a mitten. Dave asks what it does. Jack explains that it finds missing crumbs with remarkable confidence.

Panel two: Crystal draws a rival creature shaped like a teacup. Its special talent is listening politely while other creatures describe crumbs.

Panel three: The explorers discover a mysterious mark on the desk. Jack declares it a legendary footprint. Dave identifies a pencil shaving.

Panel four: Gubbinz walks past without contributing any useful evidence. The investigation becomes extremely dramatic anyway.

Panel five: Mom wipes the desk. The legendary crumb is never found. Crystal's creature receives a badge for excellent listening, while Jack's mitten retires to pursue a quieter career as a bookmark.` }
      ]
    },
    {
      id: 'pm.mag.11', month: 11, title: 'November 1999: Dial-Up Dreams',
      publication: 'JACK ATTACK!', issue: 11, rel: '01/11', price: 28, art: '11',
      color: '#bd552b', headline: 'THE MODEM BOYS',
      kicker: 'Backscreen Boys parody special: pop hooks, busy lines and homemade pages.',
      pages: [
        { title: 'Editorial: Please hold for the chorus', body: `The Modem Boys are our imaginary pop group for anyone who has heard a connection noise and thought it needed a stronger chorus. Their fictional cousins, the Backscreen Boys, already own the matching jackets; our lot have a borrowed microphone, a very long cable and a timetable negotiated with the family telephone.

This November issue is about making a fan page with personality. We are inventing the band, the artwork and every line of its songs. Nobody needs a real celebrity photograph to build something worth reading. Start with one clear idea, keep the page small enough to arrive before tea, and remember that a spinning decoration cannot rescue a paragraph nobody wants to finish.` },
        { title: 'Review: A fan page that loads before tea', body: `We reviewed a paper mock-up of a Modem Boys fan page before anybody wrote the finished version. It has a bold heading, one original band illustration, a short news column and a plainly labelled song list. Every link has a job. The result feels more welcoming than our first design, which buried the actual writing beneath six boxes announcing that writing would arrive soon.

Four blinking cursors out of five for the improved version. The missing point belongs to a giant background pattern that makes the smaller text difficult to read. A fan page should reward a visitor's curiosity quickly. Make the first screen useful, then put the extended jacket discussion on a separate page for the truly committed reader.` },
        { title: 'Guide: Plan a page in pencil', body: `Draw a rectangle for a browser window. Place the page heading at the top, then write one sentence explaining what a visitor will find. Add three clear links: news, songs and artwork. Under each, note what belongs there. If two links lead to the same empty promise, combine them and finish one useful section first.

For our fictional band, invent a logo and draw the picture yourself. Do not borrow somebody else's photographs or lyrics. Keep personal contact details off the page, and use the account tools approved for the game rather than sharing passwords. Test small lettering against the background. If you must squint at the paper version, adding flashing stars will not improve the finished one.` },
        { title: 'Letters: The family telephone chart', body: `Mom asks: Can an imaginary pop group have a rehearsal that does not occupy the telephone? Happily, yes. Write the chorus on paper, practise the rhythm away from the computer, and agree computer time before connecting. The Modem Boys have discovered that family harmony is more valuable than leaving a fan page open while everybody goes looking for a biscuit.

Luke wants to know whether a page needs a visitor counter. Our answer is that a useful page remains useful without one. Count the sections you have finished instead. A hundred visitors cannot read an unfinished review, while one friend can enjoy a complete drawing today. Send original band artwork to your own notebook first; even imaginary fame benefits from a second draft.` },
        { title: 'Advertisement: Chorus on a floppy', body: `THE MODEM BOYS present their imaginary rehearsal kit: one blank song sheet, four matching pencil lines and a cable drawn much longer than necessary. Featuring the completely invented hits Busy Signal, Hold My Place and Everybody Disconnect Before Dinner. No real recordings, performers or borrowed lyrics are included.

This is a parody advertisement with no working order form. Your challenge is to write four original lines about an everyday computer problem, then read them aloud to check the rhythm. Avoid real names and private details. Draw a sleeve with a title that remains readable at arm's length. The fictional deluxe edition contains exactly the same silence as the ordinary edition, but its imaginary jacket has shinier buttons.` },
        { title: 'Comic: The unplugged performance', body: `Panel one: Jack announces that the Modem Boys will perform live in the bedroom. Dave holds a cardboard microphone. Crystal has already made a sign requesting an encore.

Panel two: The opening sound is a highly ambitious imitation of a connecting modem. Mom appears in the doorway and requests a quieter musical direction.

Panel three: The band tries whispering the chorus. Nobody can hear the rhythm, so Crystal keeps time by pointing at four enormous pencil marks.

Panel four: Dad applauds the first performance to leave the telephone entirely available. Dave claims this was always the artistic plan.

Panel five: The encore consists of putting the cardboard equipment away. Mom calls it their strongest number. The review awards five tidy shelves.` }
      ]
    },
    {
      id: 'pm.mag.12', month: 12, title: 'December 1999: A Proper Winter Annual',
      publication: 'JACK ATTACK!', issue: 12, rel: '01/12', price: 30, art: '12',
      color: '#237c68', headline: 'THE BIG WINTER ISSUE',
      kicker: 'The Legend of Gubbinz: Ocarina of Tea leads our year-end desk adventure.',
      pages: [
        { title: 'Editorial: Twelve issues on the shelf', body: `A complete year of JACK ATTACK! now fits in a satisfyingly uneven stack. We began with silver balls and finish with a winter adventure called The Legend of Gubbinz: Ocarina of Tea. It is our fictional paper quest about finding a missing teapot, not a promise of a cartridge that secretly exists somewhere else.

December is a good time to enjoy what is already on the shelf. Revisit a clever guide, finish a half-drawn map or invite somebody to try the game you made in September. This issue looks back only at 1999 and leaves the next calendar unopened. There is no need to rush the final page. A proper annual should last longer than the first plate of biscuits.` },
        { title: 'Review: Ocarina of Tea, the paper quest', body: `Our winter quest places three room cards around a central hall. The pantry holds a cup, the study holds a tune, and the conservatory holds a sleeping cat. Read each room's clue before moving an object. The goal is to assemble a peaceful tea break, not defeat the furniture or wake everybody in the house.

Five warm cups out of five for the finished puzzle, provided the clue writer checks every step. Our first draft let the player lose the cup permanently, which was unfair rather than mysterious. The revised quest always lets you retrieve an object. A gentle adventure still needs firm rules; kindness and good puzzle design get on remarkably well when somebody remembers to test the ending.` },
        { title: 'Guide: Write the ending first', body: `Begin your winter adventure with the final scene: a teapot on a table, a cup beside it and a cat comfortably asleep elsewhere. List the three things needed to reach that scene. Now place each in a different room and write a clue that points towards the next useful action.

Make every clue available before it is required. If a player needs a tune, put its pattern somewhere they can revisit instead of asking them to guess. Test the quest with someone who has not seen your notes. Watch where they hesitate, then improve the wording. Never solve confusion by announcing that the player should simply have known. A good ending feels earned because the path was understandable all along.` },
        { title: 'Letters: The best thing we finished', body: `Gran writes: My favourite part of the year was the paper town, because everybody could move a building and explain why. That is an excellent award category. Our year-end prize goes to the thing you actually finished and shared, whether it was a map, a tiny game or a drawing with a properly readable title.

JackK asks whether an unfinished project counts as a failure. Certainly not. Keep a note of what works, choose one small section to complete, and save the grand improvements for another session. Dave nominates his dungeon office for outstanding architecture. Crystal reminds the judges that it remains a cupboard. The committee is willing to recognise it for outstanding confidence, a category with extremely strong competition this year.` },
        { title: 'Advertisement: The annual annual keeper', body: `Protect your imaginary magazine collection with THE ANNUAL ANNUAL KEEPER, a cardboard sleeve for twelve issues and several extremely important scraps of paper. Includes space on the spine for a year, a title and a drawing of whatever keeps wandering off your desk. The fictional deluxe model has a second label to cover the first spelling mistake.

No storage product is being sold here. If you make a real paper sleeve with permission, measure the stack before folding and leave enough room to remove an issue without bending its cover. Store it somewhere dry, away from drinks and heaters. The finest collection is one you can read again. A pristine box nobody can open is merely a very tidy obstacle.` },
        { title: 'Comic: The last cup of the year', body: `Panel one: Jack arranges twelve magazine drawings into a grand winter castle. Dave claims the January tower is structurally suspicious. Crystal supplies a cardboard bridge and requests a tea room.

Panel two: The heroes search for the legendary teapot. A clue points towards the study, where a paper tune is hidden underneath an extremely ordinary book.

Panel three: Gubbinz sleeps beside the final doorway. Nobody wakes the cat. Mom moves the tea room to a quieter part of the castle.

Panel four: Everyone reaches the ending without a battle. Dave asks whether the adventure needs a larger monster.

Panel five: The castle wobbles. Crystal adds a sensible support. Jack writes THE END on a small flag, leaving the kettle to the grown-ups.` }
      ]
    }
  ];

  const byId = Object.create(null);
  ISSUES.forEach(function (issue) { byId[issue.id] = issue; });
  // Physical prop IDs are aliases only, never additional inventory/save keys.
  // ch.m.comic is deliberately outside this monthly magazine collection.
  const LEGACY_ALIASES = {
    mags: 'pm.mag.01',
    'reading.mag.floor1': 'pm.mag.02',
    'reading.mag.floor2': 'pm.mag.03',
    'reading.mag.bed': 'pm.mag.04',
    'reading.mag.back1': 'pm.mag.05',
    'reading.mag.back2': 'pm.mag.06'
  };
  return { ISSUES: ISSUES, byId: byId, STARTER: ['pm.mag.01', 'pm.mag.02'], LEGACY_ALIASES: LEGACY_ALIASES };
});

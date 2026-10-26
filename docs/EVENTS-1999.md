# In-house seasonal and dated events for 1999 (design spec)

Status: written 2026-10-26 (real date). Priorities are by real date: HALLOWEEN (31 Oct, 5 days away) then BONFIRE NIGHT
(5 Nov), then everything else in calendar order.

Built (2.53.0, branch `halloween`): the engine of section 1 (`js/season-cat.js`, `js/season.js`, `mods/season.js`, owner
"Jump to event" / "Start this event again", the diary "This week" page, seasonal guidance through `js/st-guide.js`) and
HALLOWEEN (`js/season-halloween.js`): objectives `hw-pumpkin`, `hw-decorate`, `hw-lights`, `hw-bowl`, `hw-treat` (bonus at
10), `hw-clean` (tail). Deviations: the sweets bowl sits on a small side table by the front door (the hall table holds the
keys bowl); the carved lantern goes on the front gatepost (the mower parks by the doorstep); the loop is one real year of
play until the 4.14 glitch exists. Not built yet: 2.3 C-F, `hw-crystal`, `hw-video`, keepsakes, Crystal's own trip, the
joke tax, Gran's visit, the loft fright, recorded audio for the new `hw.*` lines; Bonfire Night is catalogued (window,
phases, owner jump) with no content.

Read first: `AGENTS.md` (hard rules), `docs/STORY.md` (chapters, quest guidance, chores 2.0 "seasonal jobs"),
`docs/GRAPHICS.md` (draw-call and light budgets), `docs/AUDIO.md`. Existing dated content: `app/public/js/calendar.js`
(`window.CAL.posts` as `[MM-DD, TAG, html]` plus `hype`) already has `10-31` "Happy Halloween! Went as a Space Cadet" and `11-05`
"Spike the Stegosaur 2 is out! Bonfire Night tonight too". The weekly `events-cat.js` timetable has a "Monster Mash" Hangout
theme; both stay and these in-house events layer on top.

## 0. Ground rules for every event

- **1999 forever.** The site's "today" is the same day and month in 1999. Weekdays are the 1999 weekdays (31 Oct 1999 was a
  SUNDAY, 5 Nov a FRIDAY, 25 Dec a SATURDAY, 31 Dec a FRIDAY). Nothing after 31/12/1999.
- **The house is the player's.** Events dress the player's own house and garden; the family reacts to them. Nobody else's
  house is needed (neighbours knock on YOUR door; the street beyond the front garden is seen, not visited, unless the street
  is already walkable).
- **Nothing 2D.** Every decoration is a solid low-poly object with thickness and contact shadow: bats are extruded wings with a
  body, cobwebs are thin tubes/strands (never a flat textured plane), paper chains are real loops, banners are folded cloth
  boxes, fireworks in the sky are small emissive spheres/streaks with additive glow (they are light in the sky, not
  surfaces; keep them high and far so nobody walks round them).
- **Kid friendly, Mom spelling.** No gore, no real scares beyond a friendly "boo". Nobody gets hurt: Dad's safety lines are
  the game. No real brands: sweets, films, TV and shops use fictional parody names (sample lists below; check them against
  `calendar.js` for names already used). Neighbours and visiting kids come from `Cast` (`Cast.n('neighbour')`, `Cast.t(...)`),
  never hardcoded. Fixed people: Mom, Dad, Crystal (sister), Gran, Grandad, Nan, Dave, Luke, Callum, JackK, Gubbinz.
- **No location clues.** Say "the field", "the park", "the big display", never a town. Weather and sunrise are generic UK
  autumn, never tied to a place. For the eclipse nobody says where the house is (see section 3).
- **Server holds rewards.** Rupees come only through capped server earn paths; pocket money/wages are integer pence held by the
  server. Event rewards are server-validated, once per account per event per year-loop (see section 1.6). The browser never mints.
- **Guidance.** Use the STORY.md quest guidance: pulsing highlight on the target object, floating marker if far, edge arrow if
  behind, "F: carve the pumpkin" prompts, first-time hints once, completion sting + diary tick + "Objective complete" banner.
- **Phones/tablets** play the whole game (device policy 2026-10-26): every mini-game below needs a touch scheme (left thumb move,
  right drag look, one contextual action button; drag gestures for carving/pouring), and Low-tier fallbacks (section 1.7).
- **Refresh safe.** Event state (carved pumpkin, sweets bowl contents, rockets left) is server state; refresh never changes it.

## 1. The event engine (one shared system, built once)

### 1.1 Data: a table of events
New file `public/js/season-cat.js` (guarded for browser globals so the server mod can `require` it):

```
{ id:'halloween99', from:'10-24', to:'11-01', peak:'10-31',      // MM-DD, inclusive, any year (the loop-year is 1999)
  phases:[ {id:'lead', from:'10-24'}, {id:'day', from:'10-31'}, {id:'tail', from:'11-01'} ],
  needs:{ chapter:'ch1-done' }, // gate to keep the tutorial clean; veterans always pass
  decor:'halloween', objectives:[...], rewards:[...], audio:{...}, tv:[...], teletext:[...], mag:[...] }
```

### 1.2 Date and the owner's clock
- One function `Season.today()` returns `{mm,dd,dow,hour}` from `OwnerTools.now()` when the owner has a 1999 clock override
  (`clock.date` as `1999-MM-DD` plus `clock.hour`), otherwise from the normal 1999 calendar and the local hour. The owner clock
  already fires `ownerclock`; Season listens and re-evaluates (no reload; decorations pop in/out with a short fade).
  The server-side check (rewards) uses the same override only for the owner account.
- `Season.active()` returns the events whose window contains today (several can overlap, e.g. Remembrance and Christmas
  build-up). Each event has a phase; decorations are applied per phase (e.g. Halloween "lead" = pumpkin on the doorstep and a few
  cobwebs, "day" = full dress plus trick-or-treaters, "tail" = leftover sweets, pumpkin going soft, Mom tidies up).
- Daylight matters: clocks go back at 02:00 on 31 Oct 1999 (UK), so on and after that day it is dark by about half past four
  and sunset is around 16:35. Use that for the Halloween and Bonfire mood. (Clocks went forward on 28 Mar 1999; Season applies
  the same BST/GMT rule to the in-house sun for every event.)
- Owner tools: add a "Jump to event" dropdown beside the 1999 clock (pick an event and a phase and the clock is set to that
  day at the event's peak hour), so Jack can test any event without typing dates.

### 1.3 Decor system
- `Decor.apply(setId)`: each set is a list of `{room, make(B), at:[x,y,z], rot, tag}` entries built with the normal house
  kit (`B.at(...)`), tagged `seasonal:<id>` so they are added/removed as a group. Built once during `prewarm()` (hidden) and
  toggled by `visible`, so there are no shader rebuilds or hitches (GRAPHICS.md 1.9).
- Budget: a dress set adds at most ~40 draw calls. Merge repeated small props (bunting flags, paper chain links) into one
  geometry per room; use InstancedMesh in chunks for garden items (GRAPHICS.md section 1.1/1.3). No new lights: use the existing
  pooled lights (re-colour the hall/porch light, add a flicker to an existing point light) and emissive materials for glow.
- Mood: per event a `mood` block: hemisphere/ambient tint, fog colour/density outdoors, sky dome gradient, window glow, a
  porch-light colour. Low tier keeps the colours and drops the animation.

### 1.4 Family routines hook
Mom, Dad and Crystal (STORY.md "real characters") get a `seasonRoutine(eventId, phase)` that overrides their daily route for
that day (e.g. Mom at the door with the bowl at 17:00, Dad in the garden at 18:30). They have event-only barks (subtitle line
plus the audio-id hook so voice can be recorded later). Always a F-to-talk option that gives the current hint.

### 1.5 Quest hook
Events register optional **objectives** with the story engine: id, text (as written in Jack's diary), done-test (an
`H.on` event: grab/place/snap/use, a chore completed, a mini-game result), and reward. They show in the diary on a
"This week" page and as the single HUD objective line when no chapter objective is urgent. Seasonal objectives never block
chapter progress, are never "come back tomorrow" only, and expire quietly (a diary note "missed it, see you next year" is
NOT shown, because the loop returns; just remove it).

### 1.6 Rewards and the 1999 loop
- Rewards per event per account per loop-year: server stores `state.mods.season[acct][eventId][loop]`. The 1999 loop restarts after the
  glitch (section 4.14), so events return every real "year" of play; objectives reset each loop, the one-off collectibles
  (see per-event "keepsakes") are not re-awarded but replaced by a small Rupee bonus.
- Reward types: capped Rupees (small; seasonal jobs also pay pence from Mom/Dad), a keepsake object that physically appears
  in the house (placed in Jack's bedroom and kept), a magazine/Teletext secret, an extra Hangout costume/hat, Mom's-good-books
  trust points, and a one-off wallpaper/screensaver/JackOS sound scheme.

### 1.7 Low tier and phones
Drop animated emissive flicker and particles to static; fewer garden props; fireworks reduced to 6 simultaneous streaks; keep
every gameplay prop. Touch: carving is a drag along the outline then lift; the sweets bowl is a tap-to-hand-over with a
drag-to-choose; sparklers are hold-to-light and a wave gesture.

---

## 2. HALLOWEEN (Sunday 31 Oct 1999; window 24 Oct to 1 Nov; peak 16:30 to 19:30)

Tone: warm, funny, a bit spooky, Dad groaning at the cost of sweets, Mom half-pretending she disapproves of "that American
thing" while secretly loving it. In 1999 UK trick-or-treating was a growing import, not universal, so the family is
unsure and the street is quiet at first and then busier: perfect for a game that ramps. Also: clocks go back at 02:00 so Sunday
has an extra hour in bed, and it is dark by about 16:35.

### 2.1 What changes (by phase)
**Lead (24 to 30 Oct)** - the house slowly dresses itself. Each day Mom or Crystal adds something; Jack can add his own.
- Front doorstep: a pumpkin-sized empty spot with a highlight ("Mom's bought a pumpkin, it's in the kitchen"). A turnip with
  a face on it (the old way; Gran's idea) can appear next to it.
- Hall and lounge: 3D paper chains of orange and black loops along the picture rails, a string of battery pumpkin lights
  (emissive beads on a cord, one pooled-light flicker), a cardboard-and-card witch hat on the hat stand (thick, folded
  cone with brim), a cauldron (lathe-turned black pot, green emissive "brew" disc inside with a gentle bob) on the coffee table
  holding the sweets bowl.
- Windows: cobwebs as thin tube strands in corners with a small solid spider (4 spheres + 8 thin legs), bats on cords from the
  ceiling (extruded body and two angled wings, swaying slowly). Crystal's window has a paper lantern.
- Kitchen: Mom's pumpkin soup on the hob, pumpkin seeds roasting (steam particles on Medium+), a witch's-fingers biscuit tray.
- Garden: two carved pumpkins on the patio wall, a fake gravestone made from cardboard and foil by Crystal (a solid slab with
  thickness and "R.I.P. MY HOMEWORK"), orange fairy lights on the shed, a ghost made from a bedsheet over a broom and bucket (cloth
  lathe with arms; sways in wind), leaves blowing across the lawn (the existing autumn rake job).
- Mood: fog colour a cool grey-purple outdoors, hemisphere cooler, porch light a warm orange, sky dome deep blue at dusk.
- Audio: a quiet wind bed in the garden, distant creaky-door loop from the cupboard under the stairs (a visible "something
  behind the door", it is just Dad's tool box falling), cat hiss. Music: a spooky-organ original loop for the radio and the
  Hangout, not a copy of any real tune.

**Day (Sun 31 Oct)** - everything above plus: Mom is out of bed late, a "spare hour" joke ("an extra hour in bed, I'm still
tired"), Gran and Grandad visit for an early tea (optional chore: lay the table), trick-or-treaters from 17:00 to 19:30 (game
time), the telly is full of Halloween specials, and a candle-lit (battery) glow in every window. A tiny friendly "fright"
at the loft hatch (a dangling plastic skeleton that falls when Jack passes, with Crystal giggling) - scripted, once.

**Tail (Mon 1 Nov)** - the morning after: sweet wrappers on the floor (a clean-up chore), the pumpkin sagging, Dad has
eaten the good sweets, Mom is taking down the decor. After the tail ends the decor fades and Bonfire Night items start.

### 2.2 What the family does
- **Mom**: buys the pumpkin (or a swede, Gran's instruction), makes soup and "ghost" cupcakes, sets the rule "porch light on
  means we're open, off means we're not", supervises the bowl, wears a witch hat she pretends is for the cold.
- **Dad**: grumbles about the sweets budget, then does an embarrassing glow-stick scarecrow in the garden; he tests the porch
  light and tells Jack "no tricks, no eggs, no nonsense, and stay where I can see you" (all the safety lines).
- **Crystal**: dresses up (a bin-bag witch costume with a hat she made; her costume changes each year-loop), designs the
  gravestone, wants to go out trick-or-treating with a grown-up (Mom or Dad), asks for help with her face-paint (a tiny mini-game).
- **Gran/Grandad (optional visit)**: tell the "swede lantern" and ghost-story-with-a-twist (a harmless joke ending).
- **Mates** by phone (in-world phone): Dave has a mask, Luke is "too old for this" and then turns up as a mummy in toilet roll,
  Callum "has the scariest video" (a parody horror VHS everyone is too scared to watch; see TV).

### 2.3 Interactive activities and mini-games
**A. Carve the pumpkin (real steps).** Mom puts the pumpkin and tools on the newspaper-covered kitchen table.
1. *Spread the newspaper* (place sheets on the table; snap spots).
2. *Cut the lid*: drag a serrated carving knife (a safe plastic-handled saw) in a circle round the stalk; Mom: "away from
   your hand, Jack".
3. *Scoop*: use the big spoon to scoop seeds and stringy guts into the bowl (rub-to-scoop; star rating by how clean it is).
4. *Draw the face*: pick a face template from Crystal's drawn sheet (grinning, surprised, cat, spooky house, or "free draw" with
   a marker on the curved surface) and trace on the shell; the stencil is a real piece of paper stuck on the pumpkin.
5. *Carve*: trace the lines with the small saw; cut pieces fall inside (a lopsided cut makes a funny face; a perfect one earns
   stars). Quick rule: carving never hurts; mistakes make the face "more characterful".
6. *Candle*: put a tea-light inside, replace the lid, carry it (E) to the doorstep or garden wall and place (R turns). Lighting
   it with a long match is Dad's job (safety: the player asks Dad).
Rating: neatness + creativity (number of cut features) + time. Reward: stars, Mom's remark, and the pumpkin glows
for the whole night. Bonus: roast the pumpkin seeds on the tray for Crystal.
The turnip variant (Gran) is a harder, slower carve that earns an extra "old fashioned" stamp.

**B. Trick-or-treaters at the front door.** From 17:00 to 19:30 (game time, a 6-to-8-minute window compressed), knocks come
at the front door; Mom: "Jack, can you get that?"
- The porch light must be on (Mom's rule). If it is off nobody knocks (teaches the switch).
- Doorbell/knock sound; the door is a normal shut door (solid), Jack opens it (F), the group stands on the step: 2 to 5 kids
  in simple costumes (bin-bag ghosts, a wizard, a skeleton onesie, a small "dragon"), from `Cast` first names; a nervous parent
  waits at the gate. They say "Trick or treat!" (a few get the words wrong: "Treat or trick"). Different groups have different
  chatter and a short rhyme.
- **Sweets bowl**: a real object on the hall table. Hold it (E carry) and use F to hand sweets: a close-up of the bowl with
  fun-size parody sweets (Choc Bits, Fizzy Fangs, Sherbet Dib-Dabs, Jelly Eyeballs, Toffee Chewers, "Sour Slugs")
  each with a count. Each group asks for a number (one each, "two for the little one") or an allergy ("no nuts, please"),
  so the player picks the right sweet; wrong pick = a polite "no thanks, I can't have that" (safe, no fail).
  Running out: Dad keeps a **reserve tin** upstairs; the player can take a refill from the tin (limited), or give out the
  satsumas and pencils emergency stash (the kids groan; Mom proud).
- Stretch: a **joke tax**: the kids must tell a joke to get sweets (Jack gets a random joke list); correct laughter rating.
- If Jack refuses all (door shut, lights off) the trick is harmless (a rubber spider on the doormat, a chalked smiley), never
  vandalism.
- Scoring: *Neighbourly* meter (kids who left happy), a streak bonus, a rare "best costume" group gives a unique
  sticker. Total of up to ~12 groups; the peak at 18:00 to 19:00.
- Dad's safety lines through the night ("only knock on doors with lights on", "never go in anyone's house", "stay with Mom").
- Crystal's own go: she leaves with Mom around 17:30 and returns with a bag; sweet-swap negotiation at the table (a haggling mini-game).

**C. Spooky bobbing for apples.** A bowl of water in the kitchen with floating apples; hands behind back, hold the mouse/finger
to dunk; hold-time and aim. Towels provided by Mom (wet floor chore). A cheaper alternative is "doughnuts on strings" for Crystal.

**D. Ghost-story hour / lights out.** Optional: after tea Dad turns the lights off, Jack, Crystal and mates tell stories with a
torch (a real object); the camera and torch beam scare-free; punch-line gives a Rupee sticker.

**E. The haunted lounge (hide and seek).** A short toy-sized game: Crystal hides a plastic spider/bat in the house; Jack finds
all six in the dark with the torch (F to inspect). Gentle. Timed bonus.

**F. Costume dress-up.** At the wardrobe pick a costume (Space Cadet, mummy, skeleton, wizard, "a Pocket Critter") -
real clothing objects, applied to Jack's body model/viewmodel and Hangout avatar. Keepsake: the costume stays in the
wardrobe for the year-loop.

### 2.4 Objectives for the quest system ("This week" diary page)
1. `hw-pumpkin`: "Mom's got a pumpkin. Help carve it." (done: carved pumpkin placed outside) - reward 20 Rupees + stars.
2. `hw-decorate`: "Decorate the house for Halloween" (place 5 decor props from Crystal's box: bat, cobweb, spider, lantern, ghost).
3. `hw-lights`: "Put the porch light on before 5 o'clock." (a switch)
4. `hw-bowl`: "Fill the sweets bowl and put it on the hall table." (carry the tin from the cupboard, tear the bags)
5. `hw-treat`: "Answer the door to 5 trick-or-treaters." (counter; completes at 5, bonus at 10)
6. `hw-crystal`: "Help Crystal with her costume" (face paint and hat).
7. `hw-video`: "Watch the scary video with Callum on the phone" (optional TV link).
8. `hw-clean`: (tail, Mon 1 Nov) "Clear up the wrappers" - a normal chore, +pence.
Reward summary: ~60 to 90 Rupees (capped), a **Halloween keepsake** (a glow-in-the-dark skeleton model for the bedroom shelf
that fills in once all objectives are done), Mom's good books +1, Hangout "monster" hat, a Halloween JackOS sound scheme and
screensaver (floating pumpkins), and a magazine secret (see mag).

### 2.5 TV, Teletext, radio, magazine
- **TV (the family telly)**: Sunday 31 Oct evening schedule on the existing TV listings mod: "SPOOKY SPECIAL" (a parody
  haunted-house gameshow), a spoof horror anthology (parody of an old British "tales of the unexpected" show), and a "Witch's
  Wobbly Cauldron" kids' show. Late on: a parody found-footage film trailer (a nod to the late-October 1999 horror
  craze; name it as a parody, e.g. "The Blare Witch Project" - use only if the owner approves the pun, else "The Lost Camcorder
  Film"). One show triggers a house reaction: Mom switches it over.
- **Teletext**: Halloween page 4xx ("Spooky Facts", a joke page, the sweets recipe, "the clocks go back tonight!").
  Include a Teletext joke quiz of 5 questions (Rupee reward).
- **Radio (Radio Jack)**: an original spooky-organ loop and a one-hour "Monster Mash Request Hour" on Halloween evening (reuses
  the timetable slot: Request Hour is Thursdays, Halloween is Sunday, so add a one-off `req-halloween` special in
  `events-cat.js`).
- **Magazine (JACK ATTACK!)**: the November issue (on the doormat from the start of November) has a cover feature "SCARIEST
  GAMES EVER" and a cut-out mask on the cover page (a real card mask the player can pick up and wear: a thick cut-out
  with elastic, 3D). The October issue has a Halloween cheat page; the secret code appears in the tail phase.
- **PC / JackNet**: a spooky Hangout theme night (reuse Monster Mash on the Wednesday before: 27 Oct), a "Haunted Site" Easter
  egg page on the fake web; the "Space Cadet" costume callback ("Went as a Space Cadet. Again.").

### 2.6 Start and end by date, and the clock override
- Start: `Season.today()` reaches 24 Oct (lead). Day: 31 Oct (peak at 16:30 to 19:30 game hour). End: after 1 Nov tail, all decor
  fades out at 12:00 on 1 Nov, the pumpkin goes soft and is removed as part of the tail clean-up.
- Owner clock override: setting the clock to 1999-10-31 hour 17 puts the world at peak instantly (decor applied, the porch
  light ON by default if not set by the player, trick-or-treaters begin). Setting it to 1999-11-02 removes all of it. Progress
  per account (objectives) is stored by server; the override only changes what the owner sees and may complete with the owner
  account; real players are never moved by it.
- If the player is not in the house at the time (e.g. only using the PC), the objectives can be done later on until the tail;
  trick-or-treaters appear if the player enters the house during their window.

---

## 3. BONFIRE NIGHT / GUY FAWKES NIGHT (Friday 5 Nov 1999; window 31 Oct to 7 Nov; peak 17:30 to 20:30)

Tone: cold, smoky, crackly, cosy. Friday night after school or college, a hot meal in the garden, the family together. The
Fireworks Code is the game rule (Dad's lessons are real gameplay, with a "Dad's safety check" gating each step). Facts:
Bonfire Night marks the 1605 Gunpowder Plot (Guy Fawkes); traditional food: jacket potatoes, hot dogs/sausages, parkin
(sticky gingerbread cake), treacle/bonfire toffee, toffee apples, hot soup/tomato soup in mugs, mulled-fruit punch; "Penny for
the Guy" (kids asking for pennies with a stuffed Guy) was fading by 1999 but still known; the rhyme "Remember, remember, the
fifth of November". Many families go to a public display; in the game the family prefers a **back-garden display** with a
small bonfire and fireworks bought in a box (a "family selection box" parody).
Safety (real, 1999-appropriate): fireworks only bought from a shop in a box by an adult; keep them in a closed tin box;
light at arm's length with a taper, one at a time; stand well back; NEVER go back to a lit firework; keep pets indoors;
a bucket of water/sand and a hose near; sparklers: wear gloves, hold at arm's length, put used sparklers in a bucket of
water (they stay hot); no fireworks in pockets; never throw fireworks; one adult in charge; fire safety near the bonfire, with
a guard. In the 1990s Dad's torch and "Safety first" leaflet on the box are period-correct.

### 3.1 What changes (by phase)
**Lead (31 Oct to 4 Nov)**
- The garden: a **bonfire** built from real objects (pallets, branches, an old chair, boxes; Dad assembles it over days from
  the garden clear-out chore), a **Guy** in old clothes (stuffed trousers, shirt, a hat, a newspaper-ball head with a face)
  sitting on a garden chair or wheelbarrow in the front garden for "Penny for the Guy", two **buckets (water, sand)** and the hose,
  a **firework box** locked in the shed (Dad has the key).
- House: a smell-of-smoke window glow (orange flicker on the garden-facing windows), jacket potatoes in the oven, parkin in
  the tin, a mug rack with bowls of soup, Mom's flask and gloves on the radiator.
- Mood: fog denser and warmer in the garden; low orange glow near the bonfire; the sky almost black by 17:00; neighbours'
  fireworks pop and whistle in the distance from 30 Oct (ambient loops with random timing; "Crystal flinches, Dad says it's
  just next door").
- Audio: distant bangs, whistles, crackling fire, kids cheering; cat hiding under the stairs (a tiny gag).
- Magazine/TV promos: "Where's your nearest display?" (a fake local public display advert that never names a place).

**Day (Fri 5 Nov)** - the build-up all day at school/college (summary), then the evening: Dad comes home at 17:00, the bonfire is
lit at 18:00, fireworks at 18:30 to 19:30, then supper. Neighbours' fireworks go off too. A big red-glow sky.

**Tail (6 to 7 Nov)** - Saturday morning: ash and burnt matches, the black smudge on the lawn (a lawn mark decal that becomes
a thin, thick dark patch object), the stick of a burnt rocket in the flower bed (a pick-up-and-bin clean-up chore), leftover
fireworks (sparklers, a fountain) for next weekend (Sat 6 Nov), at which Dad lets Jack do a second smaller display.

### 3.2 What the family does
- **Dad** is chief of the display: shed key, taper, torch, wellies, flat cap; he reads the box instructions aloud and
  gives the safety talk. He lights the fireworks; Jack helps by carrying and positioning (never lighting alone).
- **Mom**: hot food and drinks, sparkler gloves, keeps Crystal back, reminds everyone to wrap up warm. Brings the tray of
  jacket potatoes with cheese and beans; the toffee apples.
- **Crystal**: makes the Guy with Jack (a sidequest), writes her name in the air with a sparkler, wants a "Catherine wheel" and is
  scared of the bangers, so Dad moves her to Mom's side and she holds her ears. She falls asleep on the sofa at the end.
- **Gran/Grandad/Nan (optional)**: come round for the bonfire; Grandad tells the rhyme and the Gunpowder Plot story in one
  funny breath.
- **Mates**: phone call, "we're having ours in the field, you coming?" - a brief alternative/optional social night
  (a cutscene), always with "Mom said no", then they come round and join the garden display on Saturday.

### 3.3 Interactive activities and mini-games
**A. Build the bonfire (Dad's chore).** Carry branches and pallets from the shed and the side path; place them on the pile in
the right pattern: stack in a wigwam shape with tinder (newspaper, kindling) at the middle; Dad inspects it ("a bonfire's only
as good as its stack"). A star rating by stability (physics-lite: the pile wobbles if you place heavy items on top).
Rule: no aerosols, no glass, no fireworks, no paraffin (shown on a "Don't burn" board; placing a forbidden item makes Dad
say "Not that!" and the item bounces away, with no penalty).

**B. Make the Guy.** At the kitchen table: stuff an old shirt and trousers with newspaper (stuffing mini-game), tie the ends
with string (knot tracing), draw a face on the paper-bag head, add a hat, sit him on the chair. Optional **Penny for the Guy**
at the front gate (a bored Guy and Jack): passers-by (via `Cast`) may give a few pence (small capped pence reward, 1999
sums like 10p and 20p; never real money), but only with Mom watching. Hand over the Guy to Dad at the bonfire: he sits on
top (a lift with a ladder). He doesn't burn in-game; he "goes up in smoke" with a funny send-off line, because it's a doll, not a person.

**C. The jacket potato and sausages.** In the kitchen: wash, prick with a fork (so they don't burst; a prick-the-skin
mini-game), rub with oil and salt, put on the oven tray, set the timer, take them out with oven gloves (oven-glove rule: pulling out
without them = a short ouch and a penalty to stars; no injury). Foil-wrapped potatoes in the embers by the fire later (Dad
raking). Hot dogs on sticks over the fire with a guard and gloves. Toffee apple dip: use the pan on the hob with Mom (hot sugar
= Mom does the hot part; Jack dips the apples on lolly sticks and twirls them). Parkin: measure, mix, bake.

**D. The Firework Code (Dad's briefing).** A short interactive rehearsal: Dad's leaflet on the shed door; Jack must
tick 5 safety items (close the box, stand back, bucket ready, pets in, taper not lighter) before Dad gives permission. Skipping
means Dad says "Not until we've done it properly". It teaches and makes every later step safe.

**E. The display (viewed from the garden).** Jack and Crystal stand at the line (a rope on pegs, a solid line) behind
which Dad lights fireworks. Types, appropriate to 1999 boxes: *fountains*, *Roman candles* (a series of coloured balls),
*Catherine wheels* (pinned to the fence post; spin with sparks), *rockets* (stick in a bottle; whistle then burst),
*mines* and *cakes* (multi-shot), *banger strings* (rare, Dad refuses the loud ones), and a **finale box**. Rendered as
particle bursts/streaks (emissive spheres, additive, high in the sky), reflections on windows, shadows pulsing from the bonfire,
and the crowd noises "oooh" and "aaah". The player's job:
- hand Dad the next firework (choose from the box in order of the cheat sheet on the lid: "light the small ones first, big
  ones last");
- hold the torch for Dad (move the beam), or watch the sky with a free camera (look up);
- count bursts for Crystal ("how many reds?" mini-quiz for stars);
- put out stray sparks with the bucket if a firework is a dud (Dad: "never go back"; Jack waits the full 5 minutes, a fun
  waiting gag; then Dad pours water on it with the hose).
A **dud** firework occurs once (real: it happens); a quick lesson: "stay away" shown by a UI hint, then the water.

**F. Sparklers.** Gloves on (wardrobe pick-up), light from a taper held by Dad (safety), wave and write letters in the air
(a short-exposure trail, each letter lights up fading; draw your name or a shape; "write JACK" earns a star). Put each used
sparkler tip-down in the bucket of water (they stay hot). 2 sparklers at a time maximum; Crystal's turn with Mom. The **sparkler
photo** mini-game: Mom with the disposable camera; tilt to frame, click; the photo is saved as an in-house item (a pinboard
photo).

**G. Penny for the Guy / Guy competition.** Optional: the road's Guy competition on the fake neighbourhood noticeboard (cast
neighbours' Guy images are described). The best Guy gets a prize voucher. Skip if the street isn't walkable.

**H. Catherine wheel pin (precision).** Pin the wheel to the post with a single nail: aim and tap (a hammer mini-game
where the wheel must spin freely); wrong nailing (too tight) makes the wheel stick; learn from Dad.

### 3.4 Objectives for the quest system
1. `bf-guy`: "Make a Guy for the bonfire." -> place on the chair/wheelbarrow. Reward 15 Rupees.
2. `bf-wood`: "Help Dad build the bonfire (10 pieces)." -> Dad's sticker + 25 Rupees.
3. `bf-code`: "Learn the Firework Code with Dad." (the checklist) -> Mom's good books +1.
4. `bf-food`: "Get the jacket potatoes and parkin ready by 6 o'clock." (oven timer)
5. `bf-light`: "Hold the torch for Dad during the display." (hold 3 minutes) -> unlocks the finale.
6. `bf-sparkler`: "Write your name with a sparkler." (letters recognised or free-draw accepted)
7. `bf-bucket`: "Put all sparklers in the water bucket." (no leftover lit item)
8. `bf-clean`: (tail) "Tidy up the garden: burnt matches, rocket sticks, wrappers." (chore, +pence)
Rewards: ~70 to 100 Rupees (capped), a **Bonfire keepsake** (a toasted marshmallow on a stick for the shelf? safer: a "Guy"
plush model for Crystal's shelf and a burnt-edge bonfire photo on Jack's wall), Hangout "firework" hat/effect, JackOS firework
screensaver, Mom's good books +1, a magazine secret.

### 3.5 TV, Teletext, radio, magazine
- **TV**: the news has a "firework safety" public-information film (a parody character called "Captain Cinder" who spoke to
  kids), the Friday night films, and a parody kids' sketch show with a "sparkler spelling" gag. Bonfire Night on Friday
  means Fri night TV is on in the background of the garden window.
- **Teletext**: page "Bonfire Night safety and recipes" with parkin and toffee; a short quiz about the Gunpowder Plot and the
  Firework Code. Weather page: "cold, clear, perfect for fireworks" or "wet, display moved to Saturday" (an alternate
  deterministic outcome; the weather outcome is stored per account so a refresh never changes it).
- **Radio Jack**: "Bonfire Beats" evening show with an original music loop and a countdown "5, 4, 3, 2, 1" synced to the display
  start.
- **Magazine**: the Nov issue's Bonfire special: "Make your own sparkler-safe controller cover" or "Guy Fawkes in games", a
  cut-out Guy mask. Mention "Spike the Stegosaur 2 is out today" (already in `calendar.js` 11-05) and use it as the TV/PC
  distraction (Jack wants to play it instead; Dad insists on the display first: a gentle family choice).

### 3.6 Start and end by date, owner clock
- Lead from 31 Oct 17:00 (right after Halloween ends so the decor swap is clean), peak 5 Nov, tail 6 to 7 Nov (the second small
  display on Sat 6 Nov at 18:00 with the leftover fireworks), gone by 8 Nov 06:00.
- Owner clock: set 1999-11-05 hour 19 for the display; the gate (Dad's code) still applies for the owner so the flow is
  testable; a "skip to finale" debug button appears only for the owner.
- If the player is in the PC or elsewhere during the display, the sky outside the window still shows the fireworks, the sound
  plays quietly, and the bonfire glows.

---

## 4. The rest of 1999, shorter (all dates 1999; weekdays are the real ones)

Each entry: window / what changes / what to do / reward / tie-ins. Every item follows section 0 and uses the same engine.

### 4.1 New Year 1999 (Fri 1 Jan; window 31 Dec 1998 to 3 Jan)
- Start of the loop. Fireworks on the telly; a hangover Dad on the sofa; the euro starts today (existing calendar line). Decor:
  a "1999" banner, party streamers, the Christmas tree is still up until Twelfth Night (6 Jan), when Mom makes Jack carry the
  decorations to the loft (a chore). Resolutions: Jack writes three resolutions on his diary page (choose from a list; the
  game checks them at New Year 2000 as an Easter egg). Sales: shops (Pixel Post) show "January sales" discounts.
- This is also the 1999 reset point for the glitch rule (see 4.14).

### 4.2 Valentine's Day (Sun 14 Feb; window 10 to 15 Feb)
- Decor: red card hearts on the fridge, Dad's bunch of petrol-station roses (a joke), a postman delivery: **cards** through
  the letterbox (the player reads: some are from a "secret admirer", always PG, always a joke or a sister). Mom's card from Dad.
- Activities: make a card for Mom (craft mini-game: fold card, glue, glitter - a "glitter everywhere" cleanup chore), buy
  chocolates with pocket money, Crystal's anonymous card guess. Reward: Mom's good books, a pink JackOS wallpaper.
- Tie-ins: radio love-song dedication slot; Teletext horoscope; no romance beyond family and friends vibes.

### 4.3 Pancake Day / Shrove Tuesday (Tue 16 Feb; window 15 to 17 Feb)
- Kitchen event: Mom hands over the frying pan. Mini-game: mix batter (flour, eggs, milk; whisking), heat the pan, pour, **toss**
  (flick the stick/swipe; the pancake must land in the pan; it may stick to the ceiling, Dad's face), flip and plate with lemon and
  sugar. Crystal's pancake race (a race around the garden with a pan; a timer). Reward: stars, 10 Rupees, a pan spatter stain decal
  that Mom makes you clean. Ash Wednesday 17 Feb: Gran mentions Lent (a short chat).
- Tie-ins: TV cookery programme; Teletext recipe.

### 4.4 Mothering Sunday (Sun 14 Mar; window 8 to 15 Mar) [UK Mother's Day: three weeks before Easter]
- Make breakfast in bed for Mom (toast, tea, a flower in a glass); Crystal's card; the daffodils from the garden. Mom
  "never expected it" (always). Reward: Mom's good books +2, a "world's best Mom" mug for the kitchen shelf (keepsake).
- Clocks forward on Sunday 28 Mar (lose an hour; the in-house sun shifts; Dad grumbles about the oven clock).

### 4.5 Easter (Good Friday 2 Apr; Easter Sunday 4 Apr; Easter Monday 5 Apr; window 26 Mar to 6 Apr)
- Decor: daffodils, a bonnet, a paper egg tree (real tiny egg ornaments on twigs in a jar), bunnies/chicks made from
  card-and-felt (thick, 3D), hot cross buns on Good Friday morning (a bake or just eat).
- Activities: **egg hunt** in the garden on Easter Sunday (hidden foil eggs: 12 hidden placed by Dad in fixed-per-loop
  spots, found with a little basket; a hot-cold hint from Crystal), **egg decoration** (boiled eggs, felt-tip, wax crayon
  resist - paint mini-game), a family roast lunch with Gran and Grandad. The April Fools on Thu 1 Apr is a separate mini-event
  (Crystal's whoopee cushion; "your shoelace is undone" - Jack gets a harmless prank; reward Rupees if he spots 3 pranks;
  fool's rule: pranks only until noon).
- Reward: chocolate egg keepsakes (parody brand on the box), Mom's good books, Hangout "bunny ears".
- Tie-ins: bank holiday TV (a big film on Easter Monday), the TV schedule is full of parody family classics; radio Easter
  top-of-the-pops style countdown.

### 4.6 May bank holidays and Father's Day (May Day Mon 3 May; Spring bank holiday Mon 31 May; Father's Day Sun 20 Jun)
- Garden season starts: the barbecue (Dad's apron; sausages; the "burnt offerings" gag), the paddling pool for Crystal,
  car washing (the existing `car` chore as an event with a sponge fight). Father's Day: make Dad a card and a "world's okayest
  Dad" gift; breakfast in bed. Reward: Dad's good books, a new tool (his "thank you" present: a cheap spirit-level).
- Wimbledon-style sporting weeks and the cricket World Cup (existing 06-20 calendar item) are TV tie-ins only.

### 4.7 THE TOTAL SOLAR ECLIPSE (Wed 11 Aug 1999; window 9 to 12 Aug; peak about 11:10 BST)
Facts (accurate to 1999): a total solar eclipse crossed the Atlantic, the far south-west tip of the UK (Cornwall) and Alderney,
France, central Europe, Turkey, Iraq, Iran, Pakistan and India. In the UK only the far south-west saw totality; the rest saw
a deep partial eclipse, with the maximum around 11:10 BST (British Summer Time), partial phase beginning roughly 10:10 and ending
about 12:30. Millions of eclipse viewers were advised to use certified viewers or indirect methods; eclipse glasses were handed out
by newspapers and shops. Weather was cloudy in many parts of the UK. NEVER look at the sun without proper protection.
**No location clues:** the game never says where the house is. The totality is seen on the family telly ("the live broadcast
from the far end of the country") and the house itself gets a big partial: sky goes strange and dim, birds go quiet, it gets
cold.
- **Lead (9 and 10 Aug)**: Dad reads the newspaper article; Mom buys a pack of **eclipse viewers** (card glasses with silver
  film); Gran says "see you at breakfast". The magazine has a "DON'T LOOK AT THE SUN" page. Jack must make or find a pinhole viewer.
- **Day (11 Aug)**:
  - *Make the pinhole viewer* at the kitchen table (Cereal box, foil, pin, white card): cut a window in one end, tape foil
    over it, prick a hole with a pin, tape white card inside the other end. A real object. Aim it away from the sun's direction (the
    viewer's back to the sun) and look at the white card: a tiny sun (or crescent!) projects onto the card. The projection
    changes with the eclipse phase (a bitten sun, a thin crescent, a ring of dappled crescents under the leafy tree - a lovely
    real effect: the tree's gaps act as pinholes; render as crescent-shaped dapples on the patio).
  - *Watch on telly*: the living room TV shows the live special (parody channels); the totality moment on TV: crowd gasp,
    ring of light (the corona), "diamond ring", with stars and a planet visible. The family counts down from 10.
  - *In the garden*: the light goes silvery and dim; shadows get sharp; the temperature drops (a cold wind sound and breath
    visible? no, it's August, a mild chill: "goosebumps"); street lights may come on; a bird chorus dies and a dog barks. At
    max (around 11:10) the sky is dusk-like. Rendering: the sun disc is an emissive sphere with a black occluder; ambient and
    hemisphere intensity drop by an easing curve; fog warm becomes cool. At 11:10 the sky dome deepens and a few stars fade in on
    High tier. (Never render a real "look at the sun" camera; the camera can't be pointed at the sun without the viewer.)
  - *Safety*: Dad: "Never look straight at it, not even for a second; use the glasses or the box." Without a viewer, the
    camera fades to a polite "ouch, spots!" screen with Dad's rebuke (no harm, no damage).
- **Objectives**: `ec-viewer` "Make a pinhole viewer"; `ec-watch` "Watch the eclipse on the telly with the family"; `ec-garden`
  "See the crescents under the tree"; `ec-note` "Write down what happened in your diary" (fill a diary page: temperature,
  birds). Reward: 40 Rupees (capped), Mom's good books, a **commemorative eclipse glasses** item (a keepsake in
  Jack's room), a JackOS wallpaper (a corona), a Teletext secret, and a sticker for the diary.
- **Cloud mechanic**: the cloud level is deterministic from the account seed ("it's mostly cloudy, will it clear?"): either
  clear (see the sun), or thick cloud (see the darkening and hear the animals, with the telly as the best view). Both are fun.
- **Owner clock**: set 1999-08-11 hour 10 and advance the hour field to 11 to preview.

### 4.8 Summer holidays (window about 21 Jul to early Sep)
- School ends around 21 Jul. Decor: paddling pool, sun cream, deck chair and ice-lolly freezer; the garden BBQ; **holiday
  jobs**: ice-cream van chime (Dad gives pound coins; the van arrives and the player queues, picks a lolly with 99p flake), washing
  the car for pennies. **Family day trip**: a packed picnic day (a summary scene, no destination named), sandcastle
  mini-game on the sand in a bucket (a 3D patio "beach" in a tray?) or a river picnic in the park. Optional **Gran's holiday**
  postcards (come through the door with a mystery stamp; they never say where). Sports day, Wimbledon on TV in late June/early July.
- Aug: bank holiday weekend (Mon 30 Aug), A-level results day (Thu 19 Aug) and GCSE results (Thu 26 Aug) as small phone-call
  moments with mates (optional, never about Jack's own results specifics).
- Reward: summer-stamp collection in the diary, a deck-chair prop.

### 4.9 Back to school (early Sep; window 1 to 8 Sep)
- Uniform laid out, a new bag, pencil case (items to pack from a list; "tick the bag" mini-game), shoes polished, Mom's
  early alarm. The school bus/walk is a short scripted transition, not a fully playable school, unless already built. Reward:
  Mom's good books, stationery items for the desk; diary "new term" page. Tie-ins: Teletext "back to school" page, new
  magazine issue with a school-bag cover gift.

### 4.10 Daydream UK launch week (Thu 14 Oct) - exists; link only
- Already in `calendar.js` (10-14). Hook the Season engine so the launch day has a doormat parcel/queue scene (see STORY.md Ch4),
  then Halloween follows directly.

### 4.11 Remembrance Sunday and Armistice Day (Thu 11 Nov 11am; Sun 14 Nov Remembrance Sunday; window 8 to 14 Nov)
- Quiet, respectful, optional. A red paper poppy on the coat hook; at 11:00 on 11 Nov the telly or the school marks the two-minute
  silence (the house goes quiet; sounds duck; Mom and Dad stand still). No gameplay pressure. A reward is not offered;
  a Dad line about Grandad. Keep it very light and kid-appropriate.

### 4.12 Charity telethon night (mid-Nov, Fri 19 Nov) - parody
- A parody of the big annual children's-charity night on telly ("Kids in Need" with a bear mascot): the family donates
  small change into a jar; Jack can do a sponsored challenge (tidy the whole room, 3 stars) for pence. Reward: a pin badge on
  the school bag.

### 4.13 Christmas build-up (window 28 Nov, Advent Sunday, to 26 Dec)
- Advent: Mom's **advent calendar** (a 3D cardboard card with doors 1 to 24; each day a tiny chocolate, which is both
  a keepsake and a collectible; the correct door per date follows `Season.today()` and the owner's clock).
- 28 Nov to 24 Dec: Christmas list (STORY.md: Ch5, the Christmas list in December), putting up the tree (the tree comes from
  the loft; Jack carries boxes; hang baubles, tinsel, lights that sometimes don't work: a bulb-fixing mini-game with fuses, Dad's
  untangling the lights each year), the cards from relatives (hang on string), the carol singers at the door (like trick-or-treaters
  but sing; hand out mince pies or 10p), wrapping presents (a wrapping mini-game: cut, fold, tape, tag), Dad's shopping panic on
  Christmas Eve, school nativity or Christmas play for Crystal (Jack attends), the last day of term (about Fri 17 Dec),
  Christmas jumper day.
- Christmas Eve (Fri 24 Dec): stockings, mince pie and sherry for Father Christmas, carrots for the reindeer; Jack stays up until
  Mom says no. Christmas Day (Sat 25 Dec): wake up, presents (the unwrapping flows from the Christmas list: shape of the
  gifts and what Jack chose; always some surprise), the Christmas dinner (roast turkey, sprouts, pigs in blankets, pudding on fire,
  a paper crown from a cracker with a joke), the Queen's speech (3pm) on TV, the family board game (a parody property-trading board game, "Moneypoly"),
  Gran's snoring after dinner, the Christmas special on TV and a call from the mates. Boxing Day (Sun 26 Dec): leftover turkey
  sandwiches, sales on TV, the cousins visit (Cast).
- Rewards: gifts as real physical items; Mom's good books; unique keepsakes (the tree topper: add one every loop).

### 4.14 The millennium countdown (window 20 to 31 Dec 1999) and the glitch back to 01/01/99
- Context (accurate): the Millennium Bug (Y2K) worry about computers mis-reading 00 as 1900; a lot of fuss, shops selling
  torches/candles/bottled water; Dad fills the bath (he thinks the water might stop), Mom's tinned food; Dad's work PC tested; the
  "Millennium Dome"-style big tent opens for the night on the telly (named in-game as "the Big Tent"; no location). 31 Dec 1999 is
  a Friday. Fireworks, midnight chimes, the song "Auld Lang Syne" (traditional) are on the telly; "Is it really the start of
  the millennium or is it 2001?" (the pub argument).
- **Countdown objectives** (diary): `y2k-bath` "Fill the bath with water for Dad", `y2k-torch` "Find the torch and batteries and
  candles" (place them in the hall cupboard), `y2k-backup` "Back up your files onto floppies" (a real PC mini-game, ties to
  the floppy disk drawer in calendar.js), `y2k-snacks` "Stock the snack cupboard for the party", `y2k-party` "Help Mom with
  the party food". Existing Teletext/calendar gags (the BIOS test line on 12-10 in `calendar.js`) are reused.
- **Decor**: a countdown banner on the wall, balloons, party streamers, glitter, a large clock (a real 3D wall clock) ticking down
  to midnight, a silver-and-gold "1999 > 2000" display; a snack table; bottles of fizzy pop and grape juice for the kids.
- **Midnight on 31 Dec**: the family gathers; Mom counts; the clock reaches 23:59:50; the countdown from 10; at 0 the telly cheers;
  the lights flicker (the bug?), all the house electronics flash 00:00, the screen goes to static, a gentle "glitch" sequence
  (a rotating clock, a few blue-screen-like frames in JackOS style (not "Windows")), and then everything is **back to 01/01/1999**:
  the tree gone, decorations reset, a fresh New Year: the existing rule "glitch back to 01/01/99". Play it as funny, not
  scary: Gubbinz comment; the diary page says "Did we just live the whole year twice?". Keep objectives, keepsakes and Rupees; reset the
  event-per-loop flags so every event is available again; achievements record "Loop N completed".
- Rule: the site never shows a 2000 date. The glitch is the only way the year turns over. The owner's clock can't be set after
  1999-12-31 23:59 either (it is clamped, and the glitch fires if the hour field passes the end).

---

## 5. Build order (suggested)
1. **Engine** (Season.today/active, `season-cat.js`, owner "Jump to event" dropdown, decor toggle + prewarm, diary "This week",
   server mod `season` with per-account/per-event/per-loop reward keys). Test: `node --check`, a tests/ script that sets the
   owner clock to each peak day and asserts the decor flags and objective list.
2. **Halloween** (due first: decor, pumpkin carve, sweets bowl + trick-or-treaters, porch light, TV/Teletext/radio lines).
3. **Bonfire Night** (decor, bonfire, Guy, Firework Code, display, sparklers, food, tail clean-up).
4. Christmas build-up and the millennium countdown/glitch (largest, needed before 20 Dec in real time? No: the site loops, so
   anytime; but do it before real December for the players).
5. Eclipse, Easter, Valentine's, Pancake Day, Mothering Sunday, summer, back to school, Remembrance, charity night.
6. Polish pass: sound, voice hooks, audio ids per AUDIO.md, Low tier and phone passes, screenshot QA at 1366x860 and
   390x844 for every phase.

## 6. Open questions for the owner
- Parody name for the late-October found-footage horror film: use the pun title or the safer "The Lost Camcorder Film"?
- Is trick-or-treating allowed to include walking to neighbours (needs the street walkable) or only the door? (This spec assumes
  the door only.)
- Should seasonal Rupee rewards be tuned against the existing daily earn caps? (Proposal: events add up to 100 Rupees per event
  per loop outside the daily cap, but never convert to pounds.)
- Is Remembrance appropriate to include at all? (Low-key and optional; easy to cut.)

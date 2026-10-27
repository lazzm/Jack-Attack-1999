# THE MYTH OF ZELDO: THE TEMPORAL FLUTE (Ultra 64) - design spec

Status: design only. Owner request 2026-10-26: a NEW full 3D game for the Ultra 64 in Jack's room, an original parody of the
1998 3D action-adventure classic. Sister game: the SNES "The Myth of Zeldo: A Link to the Pasta" (`app/public/js/rm-g-zeldo.js`).
Everything here is original: names, characters, songs, maps and art. No real Nintendo names, characters, music or assets.
This is a parody of the genre's famous ideas (lock-on, a song-playing instrument, two eras, a hub field), not a copy: tunes are
new, maps are new, jokes are ours.

Read with: `AGENTS.md` (1999 forever, nothing 2D in the 3D world, period-correct, kid friendly, no real brands, console fakes:
Ultra 64), `docs/GRAPHICS.md` (r128 budgets), `docs/games/mon.md` (the honest-scope-table habit: never call a slice "the full game").

## 1. Pitch

Long before Grandad's old sword, before the Baron's meatball army, the kingdom of Lasagnia had a different problem: an egg-timer
the size of a tower. A small kitchen-boy called **LINGO** (an ancestor of the SNES Lingo) plays a flute made from a stick of
penne, and the flute's songs can bend the kitchen's clocks. Baron Meatballo's great-great-grandfather, **DUKE MEATBALLO** (the
Baron's ancestor, rounder and angrier), wants the **Three Stones of Seasoning** (Salt, Pepper, Oregano) to open the Great Pantry and
make the kingdom's Sauce his alone. Lingo must travel between the **DRY ERA** (everything uncooked, he is a kid) and the **BOILED
ERA** (seven simmers later: the world is soggy, he is grown up, the Duke has taken over), awakening eight Guardians in eight
temples and kitchens, playing songs to change time, weather and place, and finally storming the Duke's Tower of Takeaway.

The Easter egg tie-in: pulling the **Wooden Master Ladle** from its stone is how the "Grandad's old sword" of the SNES game
begins, and the last image is the ladle being left in a drawer where Grandad will one day find it.

Tone: warm kitchen humour, pasta puns, silly sound effects, a surprising amount of heart. Kid friendly, no gore (enemies "go
soggy", "burst into flour", or "turn to crumbs"). Mom spelling in all dialogue.

## 2. Scope table vs the 1998 original (be honest)

| Feature | The original (reference) | Our full target | Vertical slice (Stage 1) |
| --- | --- | --- | --- |
| Era travel | Child and adult eras, ~7 years apart | Dry Era and Boiled Era, seven simmers apart; same map, changed state | Dry Era only plus one timed jump in the first dungeon |
| Hub field | One huge field linking everything | **The Great Plate**: a round-ish plain with 8 exits | A quarter of the Plate (the south meadow + village gate) |
| Towns and villages | ~8 towns/villages | 6 towns (Broccoli Hollow, Market Square, Lava Larder, Anchovy Cove, Crouton Dunes, Tin Town) | 1 (Broccoli Hollow) |
| Dungeons | 9 main (3 child, 5 adult, 1 castle) + 3 optional | 8 main + final Tower + 2 optional (Freezer, Drain) | 1 (the Great Broccoli) |
| Items | ~25 | 14 core items, 6 upgrades | 3 (pea-shooter, bombs, shield) |
| Songs | 12 plus a free-form tune | 12 plus the Bin-Man's Ditty (create-your-own, 8 notes) | 3 songs |
| Targeting | Lock-on (Z) with a floating fairy | FOCUS (Z) with a spiral-pasta fairy, FUSSY | Full |
| Transport | Horse with carrots and a dash | **Gnocchi the donkey** (carrot dash, jump over fences, a "stuck on the road" gag) | Not in slice |
| Heart pieces | 36 | 24 (4 pieces = 1 heart) | 3 |
| Collectibles | 100 hidden spiders | 40 **Flour Weevils** (hidden, collect for rewards) | 5 |
| Minigames | ~8 (shooting gallery, fishing, mask trade, etc.) | 8 (below) | 1 (the Pea-Shooting Gallery) |
| Day and night | Real-time cycle changing enemies and shops | 8-minute cycle, Breakfast Bell song | Full |
| Saves | Battery cart, 3 files | 3 files on the cart (see section 14) | Full |
| Length | ~25 to 30 hours | Target 8 to 12 hours | ~30 minutes |

Rule for the doc and the changelog: the first release may be a slice; it must say "chapter one of eight" in-game and must
not be advertised as the full game (same discipline as `mon.md`).

## 3. Characters

All original. Pasta puns where the pun is a joke, not the only joke.
- **LINGO** (hero): a kitchen-boy of about 10 (Dry) / 17 (Boiled). Silent in the game except grunts, shouts and "hup!". Wears a
  paper chef's hat that gets cooler as he grows. Carries the **Wooden Master Ladle** from the Boiled Era, the **Dry Ladle** (a
  short wooden spoon) in the Dry Era.
- **FUSSY**: a tiny floating spiral of fusilli with a bell voice, Lingo's guide and lock-on companion. Lines: "Oi! Over here!",
  "Look out, look out, look out!", "Press Z, press Z!" (her catchphrase shows the control hint). She always overshares.
- **PRINCESS ZELDO**: in the Dry Era a clever girl hiding in the Pantry Palace as a servant called "Spud"; in the Boiled Era
  she is the Pastry Queen in exile who guides Lingo as the mystery fighter **THE WHISK** (a masked, veiled figure with a
  whisk-shaped staff). Reveal at the end of the Boiled Era's third temple.
- **DUKE MEATBALLO**: the villain: a vast, shiny, orange-red noble; a booming, over-polite voice; wants the Stones for all
  the Sauce; his lieutenant is **SIGNOR BREADCRUMB**, a nervous fat crumb-cloud. Final: the Duke turns into the **MEGA MEATBALL**.
- **GNOCCHI**: a stout donkey who loves carrots; Lingo's mount; has opinions (braying subtitles).
- **GRANNY GRATER**: the Dry Era's wise old woman who teaches songs; her Boiled Era self is a statue in the Temple of Timers.
- **OLD MAN OREGANO**: a herbalist, hands out hints and cooking items; sells bottled soups (potions).
- **The Broccolini** (forest people): tiny green sprout folk; cheerful, afraid of the outside world. Their elder is **MAYOR
  FLORET**.
- **The Pepper Clan** (mountain people): tall, red, hot-tempered chilli-folk who eat rocks and roll like cannonballs; their
  chief is **BIG CHILLI**.
- **The Anchovies** (water people): silvery fish folk with a reservoir; their queen is **QUEEN SARDINA**; the prince, **Sprat**,
  needs rescuing.
- **The Crouton Gang** (desert people): a gang of toasty bandits who steal anything; led by **MADAM CRUSTY**; they all look
  alike and speak in rhyming couplets.
- **The Tin Town residents**: a robot-like tinned-food community; the shopkeeper **TINA TIN**.
- **The Pantry Spirits**: ghostly jars and cans in the shadow temple; harmless, whiny.
- **Enemies (soggy, never gory)**: Scrap-Slugs, Soggy Noodles (tangles), Crumblings (night walkers, break into crumbs),
  Cheese Mites (flying), Pepper Pots (shoot pepper bursts), Fork-Flies (stab dives), Spoon Knights (armoured, shield),
  Ravioli Blobs (split in two), Dishcloth Ghosts (drain), Butter Slimes, Burnt Toast Soldiers, Meatball Minions (rolls at you).

## 4. World map

Top-down plan (not to scale). The **Great Plate** is a round hub; each of eight exits ends at a village or a dungeon.

```
                         N
          [Tower of Takeaway]  (Duke's Tower - Boiled Era only)
                   |
 [Pepper Peak]--[Lava Larder] -------+
 (Fire temple)      |                |
                    |        [Market Square]-- (Boiled Era: ruined market)
 [Anchovy Cove]-----+---[THE GREAT PLATE]-----[Crouton Dunes]
 (Water temple)      |    (hub, day/night)       (Spirit-ish temple)
                    |        |        \
        [Tin Town]--+   [Broccoli Hollow]  [The Pantry Cellar]
       (Shadow temple)   (start, Great Broccoli) (Shadow temple)
                         S
```

- **The Great Plate**: a gently bowl-shaped plain 280 x 280 world units across with a central **Egg-Timer Tower** (the Temple of
  Timers is under it). Day/night cycle; Crumblings walk at night; Gnocchi can be called anywhere on it; the road ring is the
  "rim"; four landmark trees; a "spaghetti junction" crossroads gag.
- **Broccoli Hollow** (village, start): a treehouse village under a hill; the Broccolini; the Great Broccoli dungeon entrance;
  a shop; Lingo's treehouse; a swing (for a mini-game).
- **Market Square** (town): an indoor-outdoor market under awnings; shops, the Pea-Shooting Gallery, a mask-stall (the hat trade).
  Dry Era: bustling; Boiled Era: a ruined market overrun with Burnt Toast Soldiers and a hidden refugee camp.
- **Lava Larder** (mountain town): hot springs, Pepper Clan; the Cheddar Cavern entrance; the Furnace Fortress up the mountain.
- **Anchovy Cove** (lake town): a reservoir with the water temple (the plug and chain); fishing; the Anchovy bazaar.
- **Crouton Dunes** (desert): wind, mirages, the Crouton Gang's fort; the Sandwich Sphinx temple.
- **Tin Town** (the shadow-side district beyond a cemetery of old cans): tinned citizens, lantern-lit; the entrance to the
  Pantry of Shadows.
- **The Tower of Takeaway** (final): the Duke's tower; only reachable after all eight guardians are free.

Era differences: the Dry Era is bright, green, sunlit; the Boiled Era is greyer, steamier, overgrown with giant mould and
soggy ground; NPCs age; some places are destroyed (the market), some are healed (the forest), and one road is flooded (water level
changes). Rule: the same world map, two states; the world is loaded from one data set with era variants (see section 12).

## 5. Dungeons: items and bosses

Eight main plus the final. The first three are in the Dry Era, five in the Boiled Era (the original's structure, with our own
temples). Each has a map, compass, a mini-boss, a key item and a boss; one optional heart piece in each.

| # | Dungeon | Era | Theme and mechanic | Item gained | Boss |
| --- | --- | --- | --- | --- | --- |
| 1 | **The Great Broccoli** | Dry | Inside a hollow giant broccoli; web-puzzles, vines to climb, light the lanterns | **Pea-Shooter** (ranged; also hits switches) | **QUEEN CABBAGE MOTH**: a giant moth with powder wings, fight by shooting its eyes then tailspin |
| 2 | **Cheddar Cavern** | Dry | A cheese mine; holes (Swiss-cheese floor), rolling cheese-wheel boulders, crumble walls | **Pepper Bombs** (bag; also a hot lure) | **KING GRATER**: a dragon-shaped grater that shreds; drop a bomb in its mouth when it inhales |
| 3 | **Inside Gulp the Whale-Fish** | Dry | A swallowed-whole dungeon: wet tunnels, stomach acid pools (lemon), a heart/lung rhythm | **The Whisk-a-Rang** (boomerang with whisk: stuns, cuts, grabs) | **BARFY NOODLE**: a giant tangle-worm; cut its tendrils with the whisk-a-rang |
| 4 | **Sprout Temple** | Boiled | A mouldy greenhouse of long lawns and twisted corridors; rooms rotate on a crank | **The Long Tongs** (hookshot) | **PHANTOM CHEF**: a ghostly chef who leaps out of paintings; duel then arena |
| 5 | **Furnace Fortress** | Boiled | A kitchen oven gone wild; fire rooms, conveyor belts, flame jets, moving grills | **The Meat Tenderiser** (hammer) | **SIR CHILLI-SAUCE**: a flame-knight dragon; smash the pots under it, hit when it dives |
| 6 | **Sink Temple** | Boiled | The great sink: water levels controlled by a plug chain, soap bubbles, rubber ducks, cutlery | **The Washing-Up Wellies** (heavy boots: walk under water) and **Extension Tongs** (long hookshot) | **DARK SUDS**: Lingo's soapy dark twin (mirrors your moves; beat it by tricking it into the plug) |
| 7 | **Sandwich Sphinx** | Boiled | A dune-pyramid; mirrors, beams of light, a sand maze, both eras (use the flute) | **The Frying-Pan Shield** (reflects beams, a mirror) | **TWIN TOASTERS**: two witch-toasters, one hot one frosty; reflect their beams back |
| 8 | **The Pantry of Shadows** | Boiled | A dark cellar of jars and cans: invisible walkways, haunted trapdoors, a spinning chamber | **Specs of Truth** (reading glasses: see invisible things; costs magic) | **MOULD DRUMMER**: a shadow-mould percussionist; hit its drum arms to silence them |
| Final | **The Tower of Takeaway** | Boiled | A 7-floor tower with five trials, then the escape | n/a | **DUKE MEATBALLO** (phase 1), then **MEGA MEATBALL** (phase 2) |
| Opt A | **The Chest Freezer** | either | Slippery ice, frozen enemies, a freezer-burn timer | **Ice-Cube Arrows** (freeze enemies and water) | Mini-boss: a frost-covered ice-lolly golem |
| Opt B | **The Bottom of the Drain** | Dry | A drain beneath the village; a haunted, grumbly sewer | A **Bag of Pepper Pots** (pepper bomb capacity) | Mini-boss: a fat sewer-rat king |

Ordering: 1, 2, 3 any order after the first; the Boiled-Era temples 4 to 8 are open after the Temple of Timers; the Tower after 8.
Each boss drops a **Seasoning Stone** (Salt / Pepper / Oregano come from the first three; the later ones are the **Five
Pans**, one per Guardian) and a **heart container**.

### 5.1 Items summary
Core: Dry Ladle / Master Ladle (sword), Wooden Shield / Frying-Pan Shield, Pea-Shooter, Pepper Bombs, Whisk-a-Rang, Long Tongs,
Meat Tenderiser, Washing-Up Wellies, Specs of Truth, Ice-Cube Arrows, a **Bow of Spaghetti** (the bow, arrows from fine
spaghetti), Magic Spoon (magic meter), Magic Jar upgrades. Upgrades: Pea Bag (capacity), Bomb Bag, Money Wallet (coins), Strength
Gloves (oven mitts to lift), Scale (swim badge). Bottles: bottled soup (heal), bottled jam (magic), bottled fairy (revive).

## 6. Songs of the Temporal Flute (all original, notes are the five flute buttons)

The flute has five notes: **A** and the four **C buttons** (C-Up, C-Down, C-Left, C-Right). The stick bends pitch a little (a
vibrato). Learn a song by hearing it from a teacher, then replaying it on a staff (a five-line staff drawn in a handwritten
cookbook page, the notes shown as ingredient icons). Each song is 5 to 7 notes (written in the 1999-era note shorthand).
Tunes are our own melodies (no copied phrases); the arrangement is a chip-synth with a recorder-like triangle wave.

| # | Song | Notes | Taught by | Effect |
| --- | --- | --- | --- | --- |
| 1 | **Granny's Hum** | C-Left, C-Up, C-Right, C-Left, C-Up, C-Right | Granny Grater | Opens "royal" and "sealed" doors; calms sleeping guards |
| 2 | **Gnocchi's Jingle** | C-Up, C-Left, C-Right, C-Up, C-Left, C-Right | Granny Grater | Calls Gnocchi from anywhere on the Plate |
| 3 | **The Sprout Song** | C-Down, C-Right, C-Left, C-Down, C-Right, C-Left | Mayor Floret | Speak to and calm the Broccolini and animals; opens sprout doors |
| 4 | **The Breakfast Bell** | C-Right, C-Down, C-Up, C-Right, C-Down, C-Up | Old Man Oregano | Skips time to day or night; reveals/freezes Crumblings for a while |
| 5 | **Song of the Egg Timer** | C-Right, A, C-Down, C-Right, A, C-Down | Granny Grater (Dry Era) | Opens timer blocks, resets puzzle rooms, works as the era switch at the Pedestal |
| 6 | **Song of Gravy Storms** | C-Down, C-Up, A, C-Down, C-Up, A | A hidden windmill's ghost | Brings rain (fills wells, wakes plants, makes the sand mushy), stops with another note |
| 7 | **Minestrone Minuet** | A, C-Up, C-Left, C-Right, C-Left, C-Right | Learned at the Sprout Temple | Warp to the Sprout Temple's entrance |
| 8 | **Bolero of Boil** | C-Down, A, C-Down, A, C-Right, C-Down, C-Right, C-Down | Furnace Fortress | Warp to the Furnace Fortress (Lava Larder) |
| 9 | **Serenade of Soup** | A, C-Down, C-Right, C-Right, C-Left | Sink Temple | Warp to the Anchovy Cove lake |
| 10 | **Requiem of Rye** | A, C-Down, A, C-Right, C-Down, A | Sandwich Sphinx | Warp to the Crouton Dunes |
| 11 | **Nocturne of Noodles** | C-Left, C-Right, C-Right, A, C-Left, C-Right, C-Down | Pantry of Shadows | Warp to Tin Town / the Pantry |
| 12 | **Prelude of Parmesan** | C-Up, C-Right, C-Up, C-Right, C-Left, C-Up | The Whisk | Warp to the Temple of Timers (the era hub) |
| + | **The Bin-Man's Ditty** | (any 8 notes the player composes) | The Bin Man | Plays to a scarecrow-bin "ditty gate"; used to unlock secrets and as a free-play instrument in the menu |

Rules: the in-game flute plays back with a short chiptune voice; songs are tied to the cartridge save file; the game never plays
any real tune and nothing in this list reproduces the original's 12-note patterns; the 12-song count and the idea of warp
songs are the "genre homage". A "song book" in the pause menu shows each learned song with its notes. A repeating-note shortcut
lets the player replay the last song with one button (Start+C).

## 7. Era travel: the Egg-Timer

- **The Temple of Timers** sits under the Egg-Timer Tower in the hub. In the Dry Era Lingo finds the **Wooden Master Ladle**
  in the Pedestal of Time (a large kitchen timer stone) with the Song of the Egg Timer; pulling it is the era jump (seven
  "simmers" later). In the Boiled Era Lingo is grown and meets The Whisk; he can **go back** by placing the Ladle in the Pedestal.
- **Rules**: a few doors and puzzles only work in one era. Seeds planted as a child (Dry) grow into big plants in the Boiled
  Era (a magic bean gag) and can be climbed; an item hidden in the Dry Era can be dug up in the Boiled Era; a flooded
  tunnel in the Boiled Era is dry in the Dry Era. Era-hopping is limited to the Temple of Timers pedestal (and the Timer Stones
  scattered about, unlocked as the player progresses) to avoid soft-locks.
- **Data**: each era is the same level layout with a per-object `era` mask (`D` Dry, `B` Boiled, `*` both). The loader builds
  the scene once per zone, toggles visibility by era mask, swaps the fog/sky preset and plays an iris-wipe transition with a
  "tick-tock" and a "DING!". Persistent state (opened chests, killed bosses) is per era and stored in the save.
- **Soft-lock safety**: the player can always return to the pedestal from any dungeon exit; the Prelude of Parmesan warps.

## 8. Controls on the Ultra 64 pad

The pad (as the Ultra 64 in the house): analog stick, D-pad, A, B, four C buttons, Z trigger (under the handle), L, R, START.
Map to the house's keyboard/gamepad scheme (do not invent a new one; follow how the existing n64 games map keys in
`rm-tv.js`/`rm-g-*.js`, and the house controls: Q and T stay house controls; shoulder L uses U).

| Pad | Action |
| --- | --- |
| Stick | Move/walk/run (speed scales with tilt); in water: swim; in flute mode: bends pitch |
| A | Context action: talk, open, lift, climb, roll (while moving), dive, confirm |
| B | Attack with the Ladle; hold for charge and spin attack |
| Z (hold) | FOCUS: lock onto the nearest target (the fairy's light turns the target yellow); strafe, side-hop, back-flip, shield |
| R | Raise shield (hold); also the dash while on Gnocchi |
| L | Show the map overlay and shuffle target (the Pause map is on START) |
| C-Up | First-person look (peek, shoot with the pea-shooter), flute note |
| C-Left / C-Down / C-Right | Item slots 1 to 3 (assign items on the Pause screen); as flute notes while the flute is out |
| START | Pause menu: items, equipment, map, song book, quest, options, save |
| D-pad | Quick-swap the last two items; navigate menus; on Gnocchi, change gait |
Flute mode: select the flute on a C slot, press its C button to bring it out, then play A and C buttons; B puts it away.
Keyboard defaults (match the existing console key map): arrows/WASD stick, X B, Z A, V Z, C = C-Down, etc.; the sheet in the box
manual (an in-game manual page) lists them. Touch: virtual stick, A/B, C buttons in a diamond, Z as a hold button, START on
top; landscape and portrait layouts via the house's contextual button style.

## 9. Core mechanics

- **FOCUS (lock-on)**: Z locks to the closest valid target in a cone (enemy, NPC, sign, chest); a small yellow triangle
  floats above; camera frames both Lingo and the target; the stick strafes around the target; when released the camera returns
  to behind-the-shoulder. In indoor rooms the camera is semi-fixed ("cinematic" angles) with manual override on C-Up. Each
  target type has a priority (enemy > object > NPC).
- **Combat**: 3-hit ladle combo, jump-slash, spin charge, shield blocks front attacks, roll to avoid. Enemies telegraph. Enemy
  AI: a state machine (idle, notice, circle, strike, stagger, die), hit stun, drops (coin, heart, magic crumb).
- **Health**: starts with 3 hearts (each heart has 2 half-hearts), max 20 hearts (hearts from boss containers and 24 heart pieces).
- **Magic**: a green meter; used by Specs of Truth, Ice-Cube Arrows, spin attack (optional large version).
- **Coins**: "Gold Coins" (the 1999 `Rupees`-like currency in this game is **Coins**, not the site's Rupees; the game keeps its own
  wallet; completing it earns a one-time Rupees reward through the site's capped server paths).
- **Day/night**: 8-minute cycle; night spawns Crumblings on the Great Plate; shops close; the owl-like **Wise Whisk Owl**
  gives hints at night; the Breakfast Bell changes time.
- **Gnocchi (horse-riding parody)**: after the ranch quest (a hide-and-seek in Market Square's ranch, a carrot minigame), Lingo
  rides across the Plate: a stamina of 3 carrots (dash for ~2 seconds each, recharge over ~5 seconds), hop over low fences, and
  call with Gnocchi's Jingle. Comic quirks: Gnocchi sometimes stops to eat the grass; a "stubborn donkey" meter; he won't enter
  deep water; in the Boiled Era he's an old donkey who still jumps one more fence than he should.
- **Swimming/diving** (Anchovy Cove): a scale badge for diving; the Wellies for sinking.
- **Climbing**: ledge grabs, vines (Broccoli), ladders, and the Long Tongs for hook-grabbing at anchors.
- **Mini-games (8)**: Pea-Shooting Gallery, Fishing at the Cove (catch Sardines for a heart piece), Spoon-and-Egg Race (carry an
  egg on a spoon), Pasta Cook-Off (timing), Market Hat Trade (trade hats for a chain of rewards), Carrot Dash (Gnocchi race),
  Bomb-Bowling in Cheddar Cavern, and the Bin-Man's Ditty composer.
- **Heart pieces (24)**: 4 pieces = 1 heart; hidden in grottos, tree stumps, races; each has a small pun sign.
- **Flour Weevils (40)**: tiny golden weevils (Specs of Truth reveals them), 10/20/30/40 give rewards (a bigger wallet, a free
  heart piece, a bottle, an infinite pea bag).
- **Secrets**: 12 hidden grottos, cracked walls (bombs), singing stones for Granny's Hum, a "dry fountain" where you throw coins.

## 10. Hub field and the quest spine

1. **Prologue**: Lingo is a kitchen-boy in Broccoli Hollow. A dream: a giant meatball rolling over the Plate; Fussy wakes him.
2. **The Great Broccoli**: dungeon 1, gets the Pea-Shooter and Salt Stone; Mayor Floret teaches the Sprout Song.
3. **Granny Grater** teaches Gnocchi's Jingle and Granny's Hum in Market Square. The Duke's soldiers arrive.
4. **Cheddar Cavern**: dungeon 2 (Pepper Peak), Pepper Bombs and Pepper Stone.
5. **Inside Gulp**: dungeon 3, Whisk-a-Rang and Oregano Stone.
6. **The Pedestal of Time**: meet the Dry Era's Princess (Spud), play the Song of the Egg Timer, pull the Master Ladle, wake in
   the Boiled Era seven simmers later. The Whisk meets Lingo.
7. **Free the five Guardians** (Sprout, Furnace, Sink, Sandwich Sphinx, Pantry): any order after the first two; each Guardian
   gives a Pan. In between: the Market ruins, the flooded road, the Crouton Dunes, Tin Town, and the song warps.
8. **Princess reveal** after the Sandwich Sphinx; she gives the **Pan of Light**.
9. **The Tower of Takeaway** (five trials then the escape sequence: the tower collapses into a pot, 3 minutes timer).
10. **Duke Meatballo**: phase 1 (duel), phase 2 (Mega Meatball: roll away with Gnocchi, bounce shots back with the Frying-Pan Shield).
11. **Epilogue**: the Ladle is left in the drawer for the SNES game's Grandad. Credits (original chiptune), the song book plays.

## 11. Look and feel (3D art direction for the era)

The brief is "authentic low-poly Ultra 64 look", not a modern game with filters.
- **Models**: 200 to 700 triangles per character, 150 to 400 per enemy, ~1500 for a boss; blocky hands/feet with mitten
  hands; a big head, big eyes (painted on a 32 x 32 face texture), coloured by vertex colour and a small texture.
  All solid, thick, with every face; no flat sprites standing in the 3D world (trees are real cones/lathes; grass blades are
  tufts of crossed *thick* prisms, not billboard planes).
- **Textures**: tiny. 32 x 32 or 64 x 64 canvas-generated textures (the site generates art at runtime), drawn with a cohesive
  palette of 16 to 32 colours, **bilinear** filtering (the blurry N64 look, `LinearFilter`, NOT nearest); with painted shading and
  baked ambient occlusion in vertex colours. Walls and ground use repeated tile textures; characters use small atlases.
- **Fog**: heavy, coloured per area: warm yellow-white haze in the Plate by day, purple at dusk, black at night, green in the
  Broccoli, orange-red in the Fortress. Fog is also the draw-distance hide (`camera.far` equals fog far).
- **Lighting**: no real-time shadows. One hemisphere + one directional light on the mesh; baked vertex colours for
  dungeon rooms; **blob shadows** (a soft dark disc, depth-biased, a *thick* flat cylinder not a plane) under characters.
  A flicker on lamps using emissive.
- **Camera**: third-person behind-the-shoulder with a soft spring, a fixed "cinematic" angle in rooms, a first-person peek.
  Letterbox bars (black bands) for cutscenes, as a period touch; FOV ~60.
- **Animation**: skeletal-lite: pre-baked vertex animation or simple rig of 8 to 12 bones (hierarchical `Object3D` joints, no
  skinning on Low), 12 to 20 fps animation cycles, with hit-stop and squash/stretch.
- **UI**: chunky 1999 UI: hearts, a magic bar, three C-button slots, a coin counter, the fairy; font a bold rounded
  sans in a canvas atlas (no modern font), menus as flat panels with outlines; no modern overlays.
- **Resolution**: render at 320 x 240 (or 4:3 at 384 x 288) and upscale to the telly's screen texture (smooth, not nearest) with
  a slight scanline-free CRT-ish blur provided by the house screen shader. 30 fps-feel animation, 60 Hz render only when cheap.
- **Music and sound**: original chiptune/synth in WebAudio (square/triangle/noise + a wavetable "pipe" voice for the flute),
  a "tempo" per area; reverb-lite in caves; cartoon Foley (boing, splat, sizzle). Per `docs/AUDIO.md`. No sampled copyrighted
  material. Tunes are original, e.g. a ragtime-ish "Plate Theme", a minor-key "Pantry of Shadows", a fast "Furnace".
- **Era shift look**: Dry: saturated, warm, bright; Boiled: desaturated, steam clouds, more fog, tilted world props (everything is
  a bit sagging).

## 12. Technical plan (three.js r128, house constraints)

- **Where it runs**: as an Ultra 64 cartridge game in `rm-g-zeldo64.js` (new file; registry entry in `rm-cat.js` with a gold-shell
  cartridge, a parody box art, a magazine review, Teletext tip). The game renders into the house's 3D telly screen as a live
  texture ("Lean into the screen"); LOCK IN (T / Esc menu) makes it full-screen without restarting. The cartridge is
  taken from the real shelf and inserted by the grab API; Esc and Q behave as for any console game; **no 2D TV overlay**.
- **Renderer strategy** (decide in the Stage 0 spike):
  - Option A (preferred): render the game scene to a `WebGLRenderTarget` with the **house's own renderer**, then map that texture onto the
    telly (no extra WebGL context; works on phones). In r128 the target is `new THREE.WebGLRenderTarget(w,h,{minFilter:LinearFilter,
    magFilter:LinearFilter, format:RGBAFormat, depthBuffer:true})`. The house scene render is paused or throttled (GRAPHICS.md: rate by tier and
    by projected screen size) while the game fills the screen.
  - Option B (fallback): a second small `WebGLRenderer` on an offscreen canvas and `drawImage` into the telly's 2D canvas texture (cost: a second
    context and a copy; many phones allow 8 to 16 contexts; keep to one extra).
- **Fixed pipeline per frame**: input -> fixed-step 30 Hz simulation (accumulator) -> render at display rate with interpolation. Low
  tier: render at 30 Hz.
- **Budgets (per frame, game scene)**: High: <= 120 draw calls and <= 40k tris; Medium: <= 80 draw calls and <= 25k tris; Low (phones,
  potato): <= 50 draw calls and <= 12k tris, 20 fps cap. Keep a single `MeshLambertMaterial` per vertex-colour/atlas group
  (avoid Phong), flat shading where cheap. `THREE.Fog` linear; `camera.far` = fog far. Frustum culling on, and zone chunking: the
  Great Plate is split into 8 x 8 cells of 35 world units; only cells within the fog radius are visible. Props repeated
  (trees, rocks, grass tufts) use `InstancedMesh` in **chunks** (r128 has no per-instance culling; GRAPHICS.md 1.1/1.3), or merged geometry per cell via
  `BufferGeometryUtils.mergeBufferGeometries`.
- **No shadow maps**, no post-processing, no per-frame allocation (pool vectors, enemies, particles). All textures drawn once at boot at
  small sizes (64 max), `renderer.initTexture` and `renderer.compile` during a loading screen so there are no first-use hitches
  (GRAPHICS.md 1.9). Dispose of zone geometry/textures when leaving a zone (`geometry.dispose()`, `texture.dispose()`),
  keep a total texture memory budget <= 12 MB (High) and <= 4 MB (Low).
- **Collision**: a 2D-heightfield plus capsule-vs-AABB/ramp for dungeons, simple triangle ray casts only for ground snapping on small chunks.
  Precomputed per zone at build into compact arrays. Enemies use circle-vs-circle.
- **Data-driven**: zone JSON-like JS objects (`zones.plate`, `zones.broccoli`...) with `objects`, `era` mask, `triggers`, `spawns`,
  `doors`, `camera` hints; tools (an in-house editor is optional) for placing. Built by a generator script in the repo (`tools/` or inline) that
  writes the compact data into the JS file.
- **Save format**: a versioned record `{v:1, slot, era, zone, pos, hearts, items, songs, flags, heartPieces, weevils, time}`
  with stable IDs; additive migrations only. Follow how `rm-g-zeldo.js` and `mon.md` store progress (3 files, checkpoints on new
  zone entry and from START); the server (per account) holds the authoritative blob; the browser never mints rewards. Refresh
  resumes exactly (a refresh never changes state or shows black).
- **Input**: reuse the house's console input layer so keyboard, PC gamepad and touch all work; phones show the on-screen pad.
- **Audio**: WebAudio, one shared context from the house; instrument voices defined in a data table; the flute is a triangle wave +
  noise breath + vibrato LFO; keep voices <= 12 at once on Low.
- **Testing** (Playwright scripts in `tests/`, run later by whoever builds it; not now): boot to title, new file, walk the south meadow, FOCUS an enemy,
  take 10 hits (death and continue), play 3 songs, enter and leave the dungeon, save and refresh, LOCK IN; check `info.render.calls`
  and `triangles` against the budgets; zero console errors.
- **Cart tie-ins**: Pixel Post / shop price in 1999 pounds (about 50 pounds in a mail order), a JACK ATTACK! magazine review (score
  95 percent? decide), Teletext tips page, a hint line phone number (fake), the cartridge manual page as a real prop (the cartridge's
  "instruction booklet", opened with F), a gold cartridge shell, release already out (the original-genre game was already out in 1999:
  our game is "out now" in the 1999 calendar from the start, no later release dates).

## 13. Quality bar

All AGENTS.md rules apply: professional models and textures, nothing 2D/flat in the 3D house (the game screen is a screen), period
UI, no modern overlays, zero console errors, screenshots at 1366x860 and phone sizes during build QA, refresh safe. Also: no real
names (a search over the source for the original's character, place and song names must come back empty), every title and joke is
original, and a Cast rule: the game uses only its own characters; when the player's name is needed, the game uses Lingo.

## 14. Staged build plan

Each stage ends with a working, deployed, honest game, a CHANGELOG entry, a version bump and a tests/ script.

**Stage 0: Spike (1 to 2 days)**. Prove the render path: a spinning low-poly Lingo and a fogged ground plane rendered in a
`WebGLRenderTarget` onto the telly via the house renderer; input from the pad; FOCUS camera prototype; confirm performance on a Low
tier, a mid phone, and a desktop; decide Option A or B; measure draw calls and fps. Output: numbers in this doc.

**Stage 1: Vertical slice, "Chapter One" (about 2 weeks)**. Title screen and save select, the opening cutscene, the south meadow
of the Great Plate (day/night, Crumblings at night), Broccoli Hollow (NPCs, shop, 3 songs: Granny's Hum, Sprout Song, Breakfast
Bell), the FOCUS system with 3 enemy types, ladle combat, the shield, the Pea-Shooter, the Pea-Shooting Gallery, **Dungeon 1 (the
Great Broccoli) with its boss (Queen Cabbage Moth)**, heart pieces (3), pause menu with song book, save/continue, audio (music for
meadow, Hollow, dungeon, boss), and the cartridge/shelf/box art. Ends with a "To be continued in Chapter Two" card, honest in the
scope table.

**Stage 2: The Plate and the Dry Era (2 weeks)**. The full Great Plate, Market Square, Gnocchi (riding), Pepper Bombs,
Cheddar Cavern and King Grater, the Whisk-a-Rang and Inside Gulp with Barfy Noodle, and 8 more heart pieces, 10 weevils, 3 mini-games.

**Stage 3: The Egg-Timer (1 to 2 weeks)**. The Temple of Timers, the Pedestal, the Song of the Egg Timer, the era shift transition,
Boiled-Era variants of Broccoli Hollow and the Plate, The Whisk, the song warps (the first two).

**Stage 4: Boiled Era dungeons, in chunks (2 weeks each)**. 4a Sprout Temple + Long Tongs + Phantom Chef; 4b Furnace Fortress +
Meat Tenderiser + Sir Chilli-Sauce; 4c Sink Temple + Wellies + Dark Suds; 4d Sandwich Sphinx + Frying-Pan Shield + Twin Toasters;
4e Pantry of Shadows + Specs of Truth + Mould Drummer. After each chunk: its town, songs, heart pieces, weevils, a bonus mini-game.

**Stage 5: The Tower of Takeaway and the ending (2 weeks)**. Five trials, the escape, the two-phase final boss, credits and
the post-game (the Hat Trade, the Bin-Man's Ditty gates, the optional Freezer and Drain).

**Stage 6: Polish (1 to 2 weeks)**. Balance, hints, difficulty (a "Cooking for Kids" easy mode), accessibility (a toggle for
camera shake and flashing), localisation (UK English), phone controls, audio mix, a full playthrough test, performance pass on Low.

Risks: scope creep (hold to the staged table; ship the slice first), performance on phones (budgets and Low tier first-class),
camera quality (indoors especially; allow a manual camera), soft-locks (era-return rules, warps always available), asset size
(canvas-generated textures at runtime; no external assets), and avoiding anything too close to the original: review each
dungeon, item and song against the reference list in a final originality check.

## 15. Open questions for the owner
Series naming (owner, 2026-10-27): "The Myth of Zeldo" is the SERIES name. The SNES game is "THE MYTH OF ZELDO: A LINK TO THE PASTA"
(`rm-g-zeldo.js`, `docs/games/zeldo.md`); this Ultra 64 game is "THE MYTH OF ZELDO: THE TEMPORAL FLUTE". "Legend of" must never
appear in displayed text for the series (the audit catches "The Legend of Zeldo" and "The Legend of Zelda").

APPROVED by the owner (2026-10-27):
- Era names stay **Dry** and **Boiled** ("Moulded by cooking").
- The game costs **GBP 50 in Pixel Post** (a big-ticket mail-order item), not a chapter unlock.
- **12 songs** (plus the Bin-Man's Ditty), not 10.

Still open:
- Are the optional minor dungeons (Freezer, Drain) wanted in the first full release?

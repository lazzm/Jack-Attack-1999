# Story mode: "1999" (design spec)

Owner's brief (Jack, 2026-10-26): make the game super interactive and story based: you start with only a Game Lad,
get a PC later "and it goes from there"; expand all parts of the chores gameplay. "Fun and nostalgic with good
progression but never boring." NO birthday (Jack's rule: never mention Jack's birthday), so the PC comes from Dad's
office upgrade instead.

## Pillars
1. **Always a next thing.** At every moment the player has one clear next goal (and 1-2 optional ones). Never a dead end,
   never "come back tomorrow" as the only option.
2. **You own it physically.** Every step of progress is a real object that arrives, gets carried, set up and used
   (parcels, the PC, cables, the phone extension). The house fills up as you play.
3. **Short loops, varied.** Chores are 1-3 minute mini-games with variety, streaks and Mom's star ratings, not grind.
   Daily list changes; random household events interrupt in fun ways.
4. **1999 is the setting, not a skin.** Real 1999 rhythms: pocket money on Saturday, the phone line vs the internet,
   cover CDs, mail order, Teletext, the telly schedule, the Daydream launch (14/10), Christmas list.
5. **Nothing is lost.** Existing accounts keep everything (they are "veterans": all chapters complete, new content
   still available). Refresh never loses story state. Server holds progress; the browser never grants itself rewards.

## Who the player is
You are Jack, 16, in his family house in 1999 (see AGENTS.md people rules: Mom, Dad, Crystal, Gran, Grandad, Nan, mates
Dave, Luke, Callum, JackK; everyone else via Cast). Device policy unchanged: desktop = full house; phones/tablets =
JackOS only (on phones the JackOS desktop is "the family PC" and story gating never blocks it).

## Chapters (milestone-gated, not date-gated; 1999 calendar events layer on top)
**Ch1 "Just a Game Lad"** (first session, ~20 min, doubles as the tutorial)
- Wake up in your room (sparse start). Game Lad on the bedside table with one game: play it (teaches F/E/Q).
- Mom shouts up: breakfast / "tidy that room first" -> first chores teach carrying, placing, bins, drawers.
- Downstairs: the **family PC in the lounge corner** (beige, shared). JackOS works there from day one (JackNet logon,
  the fake web, Pixel Post). Light family flavour, never hard limits: Crystal wants a turn, Dad needs the phone line,
  Mom: "not too long on that thing".
- Pocket money explained (Dad, Saturday) + chores pay. Goal set in Jack's diary: "Save up for a console".

**Ch2 "Saving up"**
- Earn: chores, a weekly "big job" (wash the car, clear the shed), selling old toys on JackBay.
- Buy the first console from Pixel Post (exists: parcel by the front door, carry up, connect). Choice matters: which
  console first. Mates react on the phone ("you got the PlaySpace?! I'm coming round").
- First mate phone call via the in-world phone (scripted conversation; numbers swapped into the phonebook).

**Ch3 "Dad's old work PC"**
- Trigger: first console owned + N chores done (tunable). Dad: the office is getting new computers; you can have his
  old one if you clear a space and help carry.
- Quest chain: clear the desk in your room; carry the beige tower, CRT monitor (heavy: slow walk), keyboard, mouse and
  speakers up from the car on the drive; place each on the desk; plug the leads; switch on: it boots to the existing
  installer (setup.js) to install JackOS from floppies. From now on your bedroom PC is yours.

**Ch4 "Getting online upstairs"**
- The bedroom PC has no phone line. Buy/borrow a long phone extension cable, run it from the hall socket up the stairs
  (physical cable you lay), dial-up from your room. Phone-bill and "get off the internet" moments (Dad's line above).
- Cover-CD ISP disc from a JACK ATTACK! magazine. JackNet chat with mates from your own room.

**Ch5 "The Collector" (open-ended, the rest of 1999)**
- More consoles and games, the Daydream pre-order and launch day, trading-card craze, tournaments with mates, secrets,
  monthly magazine issues, Christmas list in December. Chapter goals rotate so there is always something to chase.

## Chores 2.0
- Each chore = a mini-game with a **star rating** (speed + care: dropped plates, missed crumbs), Mom's comment, pay.
- **Daily list** of 4 from all areas (exists) + **streak bonus** + **weekly big job** + **seasonal jobs** (rake leaves in
  autumn, frost on the car, Christmas decorations).
- **Household events** (random, short, fun): phone rings mid-washing-up, the cat brings something in, power cut (fuse
  box), Gran visits (tidy the lounge NOW), the hoover bag bursts.
- **Mom's good books** (trust meter from chores/behaviour) unlocks privileges: bigger pocket money, later bedtime,
  friends allowed round, the extension cable.
- New chores to add over time: hang the washing out, sort the recycling, clean the bathroom, dust the ornaments,
  wash the car (exists as `car`), paper round (later, if the street becomes walkable).

## Systems to build (in order)
1. **Story engine** (server mod `story` + client `st-*.js`): per-account state {chapter, steps done, flags, trust},
   veteran detection (non-sparse accounts = all chapters complete), objective model (id, text, done-test from existing
   events: H.on grab/place/snap, chores done, PM orders/parcels, Room tv open, phone), server-validated rewards.
2. **Diary + objective UI**: Jack's diary as a real prop on the bedside table (F opens it: handwritten pages listing
   chapter goals and ticks) + one small period-styled objective line in the existing HUD/job-tracker area.
3. **Dialogue**: short subtitle lines (existing Room.say/subtitles) with optional voice audio ids, so the audio pass
   can attach recorded lines later (docs/AUDIO.md).
4. **Family PC in the lounge** for story players; bedroom PC absent until Ch3 (veterans unchanged).
5. Ch3 PC delivery chain, Ch4 extension cable, mates' phone calls, Chores 2.0.

## Rules for every story change
- Follow AGENTS.md (1999 only, nothing 2D, period UI, Mom spelling, Cast, no brands, no location clues, no birthday).
- Never strip anything from an existing account; migrations are additive.
- Every step testable in tests/ (a scripted playthrough of each chapter), and `node tests/smoke.mjs` must pass.

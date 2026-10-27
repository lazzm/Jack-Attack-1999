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

## Revision 2026-10-26 (owner): no PC at the start, proper game progression
Owner: "for new player I want them to start with no PC - only a Game Lad and then they unlock the PC like pretty much
immediately - like a whole story thing. Also for any story related things needed in the quest - ensure things are
highlighted and pointed out etc especially at the start, make it seem like proper video game progression." Also:
"implement real characters wandering around that give you tasks".

New opening (replaces Ch1/Ch3 PC structure; the lounge family PC is dropped):
- **Ch1 "Just a Game Lad" (~10 min):** wake up in a room with NO PC on the desk (empty desk, a dust outline/cable
  hole where a computer will go). Game Lad tutorial. Mom gives the first jobs in person. Dad comes home: "the office
  is chucking out the old computers... it's in the boot if you want it". Climax quest chain, all guided:
  go out to Dad's car on the drive, carry the tower, then the heavy CRT (slow walk), keyboard/mouse box and speakers
  up to your room; place each on the desk (highlighted snap spots); plug the leads in (highlighted ports); press the
  power button; the existing boot + installer (setup.js) installs JackOS from floppies; JackNet logon -> chapter done.
  Target: PC working within ~10 minutes of signup.
- **Ch2 "Saving up"** (as before: consoles via Pixel Post), **Ch3 "Getting online upstairs"** (phone extension
  cable), **Ch4 "The Collector"**.
- Veterans and the owner unaffected; mobile = JackOS only, never gated.

Quest guidance (applies to every story step, strongest at the start):
- The current objective's target object(s) get a clear in-world highlight (soft pulsing outline/glow that fits the
  period look), a small floating marker above it when off-screen or far, and an edge-of-screen arrow when behind you.
- Contextual prompt when in range ("F: pick up the monitor"), first-time control hints shown once (E carry, R turn,
  F use, Q back), short Mom/Dad subtitle lines + voice hook when a step starts and finishes, a satisfying completion
  sting (sound + diary tick + small "Objective complete" banner in period style), and a chapter title card.
- Highlights and hints fade as the player shows they know the controls; a setting turns guidance down/off.

Characters (next phase): real 3D Mom, Dad and sister who move between rooms on simple daily routines, play idle
animations, face you when near, and give/hand in tasks (F to talk -> subtitle dialogue + voice). Low-poly, solid,
period clothing, original look; no 2D sprites.

## Quest robustness and tracking (2026-10-26 play-test revision)

The diary's display order is not an action prerequisite. Server story reconciliation checks every eligible step on
hello, login and chore/media updates. Chores count as physically finished even when Mom refuses their payment for
speed; this never changes ratings, wages, daily caps or balances. `ch.finished` preserves that evidence across daily
rollover and adopts existing daily completion records. Partial jobs do not count. Existing story ticks are permanent. Restarted bed/bin jobs restore visible pickup origins;
loading the kitchen preserves the bedroom CD return slot despite its legacy shared rack ID.

PC assembly has explicit prerequisites in the shared story catalogue: the boot follows Dad; each independent part
needs the boot; each independent lead needs all four parts; power needs all three leads; installation needs power;
JackNet needs installation. Parts and leads can be fitted in any order. Completed purchases themselves prove the
console savings objective after the money has been spent. Successful phone actions are remembered even if done early.
Consumed items are restored from the server's chore steps on reconnect, and completed pillow/pyjamas/bags never remain
guidance targets while the next story acknowledgement is in flight.

Press **J**, or click the small objective line, for a ruled diary page containing the current main objective and
unfinished jobs on Mom's list (plus jobs already started and the opening bedroom chores). Choose a row to track it;
arrow keys, Tab and Enter work too; J, Q or Esc closes the page. The selection is saved with the account profile.
Completing the tracked job falls back to the main objective. The desktop diary copy has a **Things to do** button,
including on a phone using the JackOS fallback. The standing device policy is the full game on phones/tablets;
JackOS-only is a last-resort fallback, not a story restriction.

Only the tracked task's unfinished targets receive a subtle warm surface rim. No guidance bounds/wireframe helpers
are constructed. The compass uses target hysteresis, eased screen position/shortest-angle rotation, distance fading,
safe edge margins and a centre exclusion zone. Screens, LOCK IN, close-ups and menus suppress guidance; speech also
suppresses compass text. Light guidance keeps the objective line; Off also hides it. The picker remains available.

Regression checks: `node tests/story-order-unit.cjs` covers all six chore permutations, partial work, old zero-pay
records, reconnects, reversed parts/leads and economic isolation. `node tests/story-order.mjs http://localhost:PORT`
uses real physical chore interactions on disposable accounts, refreshes, tracking controls, desktop/narrow captures
and the phone diary picker. Captures go to `tests/shots/quest-ux/`. Run the existing story unit and Chapter 1 playthrough
as well as `node tests/smoke.mjs` before release.

The compact job-progress strip temporarily takes priority over compass ink while a chore is in progress.
For separate browser runs, `story-order.mjs URL half-tidy-bed --skip-phone` saves the temporary account checkpoint
to `/tmp/jhp-quest-ux-browser.json`. On the same disposable server data, `story-ch1.mjs URL pc /tmp/jhp-quest-ux-browser.json`
checks reversed PC parts/leads and Setup; `story-order.mjs URL phone` checks the portrait/landscape touch picker.

Characters (built, 2.57.0): js/np-rig.js (procedural skinned people + costumes), js/np-nav.js (walkable clearance fields, routes,
doors, stairs), js/np-life.js (routines on the 1999 clock, talking with SCRIPT lines, Mom's jobs given and taken in, story beats in
person, barks). Ch1 gains the `meetmom` step (test `talk.mom`: talking to Mom, or real progress past it, completes it; no 3D house
means it completes itself). Tests: tests/characters.mjs.

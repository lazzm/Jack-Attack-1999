# Super Plumbo World — cartridge depth and review

Worker run: 27 October 2026. Original code, pixel art and note sequences; no imported assets, new dependencies, deployment, version change or live-data access. Cartridge ID `sn.plumb`, save version 1, old file names, six old level IDs, high scores and `lk.plumb.castle` / `lk.plumb.secret` remain compatible.

## Scope against the reference

This is an expansion run, **not full reference parity**. The six-course cartridge becomes a 24-course, 32-exit adventure. Existing main-story completion remains valid; the optional content feeds back into the island through coloured blocks, shortcuts, extra lives and a permanent autumn-map medal.

| Feature/content | Original has | Before this run | Delivered now / remaining gap |
| --- | --- | --- | --- |
| Campaign/map | Multiple regions, 96 exits, connected submaps and branching routes | One island, six courses, seven exits | Three connected maps, 24 individually authored courses, **32 exits**. Main story still six courses; most additional volume is optional. Full campaign remains the largest gap |
| Switch palaces | Four permanent coloured switches and corresponding world blocks | None | Four switch halls: stair/coin challenge, cup chain, submerged maze and jelly climb. Permanent custard/mint/berry/sky blocks provide useful routes in old and new courses |
| Haunted houses | Several door puzzles with normal and secret routes | One two-room house, normal door exit | Original pantry gains a key exit; Phantom Pantry adds a looping low door and an upstairs room route. Three haunted courses total including Sheet Street |
| Fortresses/castles | Several castles and fortresses, distinct encounters | Bourbon Castle and a three-hit King | Crumble Foundry adds crushers, lava ferry and a four-hit helmeted foreman with a committed pound pattern. King/credits remain. More distinct boss families still needed |
| Secret world | Five interconnected courses with alternate exits | None | Five Crumb Constellation courses: flight/upper key route, descending key cave, underwater delivery, haunted loop and companion course. Each has its own ordinary and keyhole exit |
| Special zone | Eight harder courses and a transformed world reward | None | Eight Oddly Zone courses with crumble rhythm, cup chains, lava, swimming, ghosts, flight, crushers and a final mixed exam. All five constellation keys open the zone; its ending saves autumn island colours and a medal |
| Goal/bonus loop | Moving goal tape, goal-star accumulation, matching bonus game | Tape/time score only | Tape height awards 1–40 stars when hit. At 100 stars, Tea Break presents eight timed shutters around a fixed centre; matching rows/columns/diagonals pay up to eight lives. A miss gives ten in-game coins. Reward and paid flag save together |
| Movement | Variable jump, spin, running, slopes and special traversal surfaces | Variable jump, buffer/coyote time, run meter, spin, swim, moving/falling platforms | Retained and exercised. Analogue controller directions added. Slopes, wall-running surfaces and more traversal gadgets remain absent |
| Cape | Flight, glide, swoops and sustained flight control | Bin-bag lift and glide | Existing launch/glide preserved; long runway and high/low route in Bin-Bag Ballet. Full dive/pull-up flight remains future work |
| Ride-on companion | Mount/dismount, tongue/carry/spit and colour-dependent abilities | Crumpet hatching, ride, gulp and dismount | Retained, new companion course, mount and carried references resume correctly. Colour variants and spit abilities remain absent |
| Items/collectables | Growth, projectile/cape powers, reserve, 1-ups, midway gates and five large coins in many courses | Core items and six sets of biscuits | Same mechanics across 24 courses, **120 golden biscuits**, best counts per course, durable reserve/projectiles/checkpoints. Cup chains now reach the same extra-life threshold as stomp chains |
| Play modes | One player and alternating two-player campaign | Solo, three battery files and high-score table | Solo, three independently suspended files, high-score table, playable bonus game. Alternating two-player campaign remains absent |
| Persistence | Battery progression | Exit/best-biscuit flags only; active play lost on refresh | Additive packed suspend snapshots: pose/velocity, lives/coins/score, power/reserve, timer, tile changes, entities, platform motion, carried/ridden objects, doors, checkpoint, clear tally, map travel/reveal, bonus reward, credits and pause. All three populated files stay below the 20 KB roaming envelope in the regression |
| Display/devices | 16-bit console CRT and controller | Native 256×224 canvas in legacy overlay | Physical cupboard telly by default; same-instance LOCK IN at native aspect. Cartridge-owned moulded touch controller reserves space outside the image in portrait/landscape/tablet. Keyboard and standard pad retained; Q/T remain house controls |

## Course/route ledger

IDs 1–6 remain Custard Meadows, Crumbly Caves, Wafer Heights, Gloomy Pantry, Fizzy Lagoon and Bourbon Castle. New IDs append; no existing clear flags or save indices are renumbered.

| IDs | Courses | Routing |
| --- | --- | --- |
| 7–10 | Custard, Mint, Berry and Sky Switch Halls | Branches after island exits 1, 2, 5 and 3 respectively. Pantry secret also reaches Sky Hall |
| 11 | Crumble Foundry | Branch after Pantry, fortress clear opens a second castle approach |
| 12–16 | Comet Causeway; Keystone Crunch; Soda Star; Phantom Pantry; Crumpet Express | Lagoon roof key opens the constellation. Normal exits link the five courses; all five independent keyholes open Oddly Zone |
| 17–24 | Crumble Rumble; Cup Run; Hot Cross Fort; Fizzics Exam; Sheet Street; Bin-Bag Ballet; Crunch Time; The Last Crumb | Eight-course chain, with a return portal to the shed after the last clear |

The Berry Hall makes the lagoon roof bridge solid: the lagoon message explains the requirement. Red dots/house stars mark alternate exits. Cross-map portals have their own selectable direction; returning along them does not restart a course. Credits return to the saved island map so optional routes remain playable.

## Ranked critique and iterations

1. **High, fixed: refresh destroyed the active attempt.** Suspend serialization reconnects object/platform/door/boss references, preserves consumed blocks and checkpoint state, and saves clear/bonus transactions without paying twice. Construction paints the initial/restored screen before the console wrapper uploads its first texture; restored maps, bonus and pause also choose their correct music cue. Version 1 saves retain their old progress.
2. **High, scope improved but not complete: six courses were far short of the target.** Eighteen authored courses, four switches, five secret courses, eight challenges, another encounter and a bonus mode now form a connected loop. The 96-exit campaign, more regions/boss families and two-player mode remain an explicit depth gap.
3. **Medium, fixed: generic overlay hand-over and no cartridge touch controller.** Opt into the existing physical-screen API; use the same instance for LOCK IN. Touch controls sit outside the locked picture, and touch camera framing reserves their space in the physical view.
4. **Medium, fixed: draw calls advanced particles, ghost/boss presentation and ending dust.** Simulation now owns those changes; draw is observational. Screen shake uses a deterministic frame phase rather than consuming gameplay randomness.
5. **Medium, fixed during review: new routes had unreachable or ambiguous edges.** Gave the lagoon portal its own direction; added intermediate ledges on two high key routes; exposed the Berry dependency; gave the constellation haunted house an actual map icon. A fully unlocked graph audit verifies that every route has a selectable direction from both ends.
6. **Medium, fixed: inconsistent rewards/presentation.** Sliding cups now use the same score/1-up chain function as stomps; UI labels follow keyboard/pad/touch input; complete course names fit the entry screen; map records have their own row. Switch halls gained distinct masonry/window art and an original music cue. Secret-map and Oddly cues are also original. Map land/sea tests use one cached bitmap read, removing repeated Canvas2D readback warnings.
7. **Low, follow-up:** add more bespoke scenery to constellation courses, longer attract gameplay, additional companion expressions and a sound/music listening pass on real speakers. These do not substitute for the larger campaign gap above.

## Verification and captures

`node tests/games/plumb.mjs http://localhost:18086` runs only against a supplied disposable localhost server. Start that server with a port in 18080–18099 and a fresh `DATA_DIR` under `/tmp`, in the **same shell command** as the browser test; kill only that server PID afterward. The script rejects non-localhost URLs. `--native`, `--room-only`, `--routes` and `--perf` select focused diagnostics; `--before` loads `PLUMB_BASELINE` or the preserved `/tmp/plumb-before/rm-g-plumb.js`, falling back to the committed script.

The test uses real browser keys for menus, motion, jumps, power/block interactions, carried-key traversal, physical goal/door contacts, bonus timing, pause and room controls. It also exercises actual controller polling and pointer/touch controls. The first course has an input-driven end-to-end run with one retry and no placement after its start. Deeper branches use the existing placement API to isolate approaches, with damage protection for item/AI fixtures, the long cave-key route and boss approaches. **This is not an unaided end-to-end completion of all 24 courses.** All 32 exit flags are asserted through production goal, plunger, door, keyhole and boss collisions; the debug win/hurt-boss commands are not used.

Coverage includes every course start/middle, five biscuits per course, map gates, four switches/bridge collision, companion hatch/mount/dismount, cape launch, original/secret exits, both boss encounters, ending/credits/postgame, bonus save/payment replay, door transition refresh, consumed-block refresh, midway death/respawn, platform suspension, all-five biscuit/1-up persistence, reserve release, sherbet projectiles, ghost shyness/chase, crusher landings, old-save migration, browser reload, room surface/LOCK IN identity, Esc freeze, foreground/background refresh, keyboard/pad/touch simultaneous direction/run/jump contacts, cartridge ejection/replacement, and portrait/landscape/tablet layouts.

Shots and short frame sequences: `tests/shots/games/plumb/before/` and `tests/shots/games/plumb/after/`. Each native review view also has a `-native.png` at 256×224. Key comparisons:

- `before/title.png` → `after/title.png`: existing original logo/art retained.
- `before/map.png` → `after/constellation-map.png`, `after/oddly-map.png`, `after/postgame-autumn.png`: actual expanded routes and persistent reward.
- `after/start-7.png`, `after/start-9.png`, `after/switch-7.png`, `after/switch-bridge.png`: distinct hall art and permanent blocks.
- `after/walk-sequence-1-*.png`, `after/jump-*.png`, `after/cape-flight.png`, `after/companion-gulp.png`: movement frame sequences and powers.
- `after/tea-break-start.png`, `after/tea-break-restored.png`, `after/tea-break-eight-lines.png`: playable, refresh-safe bonus.
- `after/boss-11.png`, `after/boss-6.png`, `after/boss-hit-*.png`, `after/credits.png`: encounter/ending progression.
- `before/in-room-game.png` → `after/in-room-game.png`; `after/lock-in.png`, `after/touch-*.png`, `after/room-refresh-*.png`: physical screen, device layouts and state preservation.

Native update/draw CPU timings and frame-interval diagnostics are written to each capture directory's `performance.json`. They measure software Chromium at 256×224, **not hardware FPS or the whole-house renderer**. Regenerate before/after serially on the same host; do not compare a run beside another software-WebGL browser. The measured before/after results and smoke status follow below.

## Final validation

- `node --check app/public/js/rm-g-plumb.js` and `node --check tests/games/plumb.mjs`: passed; `git diff --check`: passed.
- Full `tests/games/plumb.mjs` run: native play, all 32 exit collisions, save/bonus replay, old files, real room surface, LOCK IN/Q, Esc, foreground/background refresh, simulated standard pad, touch/multitouch and cartridge replacement. Native mode also verifies a painted frame before the first animation callback.
- Three sampled full suspend files: **10,677 bytes** together, below the 20,000-byte roaming limit.
- `node tests/smoke.mjs`: **12/12 passed**, with no browser errors or fatal server log entries. An earlier run passed 11/12 and hit the PC-controls time budget; the isolated PC check and subsequent complete default run both passed. No shared source or smoke time limit was changed.
- Renderer: ANGLE / Vulkan SwiftShader Device (Subzero), SwiftShader driver. All servers used disposable `/tmp` state and ports 18080–18099; no `mod failed to load` was reported.

Native software-rendering samples, measured serially at 256×224 (milliseconds):

| Measurement | Before | After |
| --- | ---: | ---: |
| Animation-frame interval, median | 16.7 | 16.7 |
| Animation-frame interval, P95 | 16.8 | 16.7 |
| Presented update/draw CPU, median | 0.4 | 0.4 |
| Presented update/draw CPU, P95 | 0.5 | 0.5 |
| Meadow tight-loop CPU, P95 | 1.1 | 1.4 |
| Lagoon tight-loop CPU, P95 | 0.5 | 1.1 |
| Castle tight-loop CPU, P95 | 0.5 | 1.0 |

The animation-frame sample contains 240 frames; both runs had a maximum interval of 16.8 ms. Tight-loop stress batches also record occasional individual CPU samples up to 32.0 ms, outside the presented-frame sample; the raw JSON retains these maxima rather than hiding them. This is a short native-canvas comparison, not a whole-house or physical-device performance claim.

## Next chunk

Expand the **main campaign**, rather than adding more postgame trials: a second island/submap with four normal courses, an alternate-exit ghost puzzle and a distinct boss/castle, then several further regions toward 96 exits. Append stable IDs and connect old completed files to the new region without invalidating the existing ending. Add sloped terrain with grounded collision and complete cape swoop/dive control before designing courses around those mechanics. Follow with alternating two-player campaign state, colour-dependent companion abilities and additional boss families.

## Limits

Physical gamepad hardware, actual phone/tablet GPUs, a subjective sound/music listening session, every optional biscuit route and an unaided complete campaign have not been verified. Automated controller tests simulate the standard browser API. Existing shared room assets and house/device policy are outside this cartridge's files. No claim of full reference scope is made.

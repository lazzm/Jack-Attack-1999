# Bounce Quest 64 — scope and depth review

Pass 4 starts at HEAD `3e63b8f` (main 2.81.0); passes 1–3 and the input-buffer repair are live. This pass adds four rewards and retains all 50 existing reward IDs. Original code, procedural models, textures, compositions and music only. The cartridge stays vertex-lit at 320×240 with low-resolution textures, fog and no blur or graphics menu. No shared kits, account/economy code, versions, changelog, deployment or commits are part of this pass.

## Scope against the 1996 reference

The reference has fifteen main courses, miniature courses, 120 rewards, swimming, acrobatic movement and three switch-unlocked caps ([official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_8/Manual_Nintendo64_SuperMario64_EN.pdf), [official game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Super-Mario-64-269745.html)). Its volume and movement freedom remain the target; this cartridge is substantially smaller.

| Feature/content | Reference has | Before pass 4 | Current / remaining gap |
| --- | --- | --- | --- |
| Campaign | 15 main courses, miniature courses, 120 rewards | 50 acorns across the hub, five main courses, three outfit stages and Crown | **54 acorns**: hub 9; Cove/Manor/Grotto 8 each; Peaks/Tower 7 each; three outfit stages 1 each; Cocoa Coaster 3; Crown 1. All 50 prior IDs and every old door threshold retained. Main-course volume remains the largest gap. |
| Hub | Exploration, movement lessons, secrets, course entrances | Eight rewards, six doors, three secret rings; no movement school | Soft Landings Club adds a supported boardwalk, walkable steps, a Cast-named coach and twelve real move/landing challenges. Completed lessons persist; all twelve earn a diploma acorn. Original hub routes and switch ladder retained. |
| Beach | Vertical routes, exploration, cap revisits | Sandcastle, chest, chimney, clam, offshore rocks, red/100 coins, Bell Buoy Dash | Adds a reusable Brolly box, updraft and separate cloud ledge/reward. The original open sea retains its old fallout rule. |
| Snow | Mountain, enclosed slide, slippery surfaces, rival, interior | Seven outdoor rewards, exposed mountain race, sealed igloo | Old seven rewards retained. The igloo now enters a furnished cocoa lodge and roughly 500-metre enclosed Cocoa Coaster: five bends, a narrower middle, three snow ridges, steering, tuck/brake, buffered hops, practice, fair Cast-named rival, win/loss/rematch, saved bests and finish chamber. Three new rewards: mittens, completion and rival win. |
| Haunted course | Mansion rooms, puzzles, ghosts, cap secrets, boss | Two floors, foyer/library/dining/stairs/study, exterior lift/roof, maze, lanterns, Boohoo, bell puzzle | Library gets candle fixtures, warm light/pool geometry, varied books, patterned solid rug, reading table and a sealed glowing ledger. Peekaboo return objective requires crossing the violet grille and bringing its reward back to the open rug. More room puzzles remain useful. |
| Swimming | Breath, depth, wreck exploration, cap-dependent seabed travel | Grotto with eight objectives, vents, wreck/chest, pearls, current hoops, jelly enemies, roost, red/100 coins and Tin weight-plate safe | Adds Tin box and a submerged weight-plate safe/reward. Foreground coins thin away from the player; embossed faces, rims, spin and periodic glints replace flat blobs. Legacy Cove/hub water is not converted to swimming. |
| Clockwork | Moving platforms, conveyors, timing, route mastery | Gears, lifts, hands, belt, shortcut, slow-clock trial | Retained. A second full layout and a verified complete natural timed ascent remain absent. |
| Three power-ups | Permanent switches, temporary wing/metal/invisibility abilities, revisits | Three switch-unlocked outfits, six required rewards | **Brolly Bonnet** glides and uses updrafts; **Tin Biscuit** sinks, walks without air and operates weight plates; **Peekaboo Hood** crosses marked violet grilles. Each has a permanent pound switch in its own secret stage, reusable boxes, timed outfit, unique silhouette and two required rewards. Brolly is a glider with launch fans, not unrestricted flight. |
| Secret stages | Distinct cap-switch miniature courses | Belfry, Pantry and Parlour with permanent switches | **Brolly Belfry**: floating islands/bridge/fan/three wind hoops/bell. **Tin Pan Pantry**: dry switch landing, flooded aisle, biscuit tins, weight plate and lunch safe. **Peekaboo Parlour**: candlelit hall, two full-height violet grilles and return reward. Secret rewards return to their hub ring after celebration. More miniature courses remain absent. |
| Moves/camera | Chained jumps, long jump, wall kick, swimming, ledge grab, adaptive camera | Full acrobatics and 140 ms pound buffer; no ledge grab | Static box edges and round platform rims can be caught, hung from, climbed with a buffered A or released with Z. A short catch settle feeds the 140 ms climb buffer. Slide physics and chase camera share one arc-length centreline; complete descents assert camera/sightline volume and player projection. New dialogue frames both faces; reward camera checks the whole bounce arc. Moving/terrain ledges remain a gap. |
| Rewards/presentation | Clear celebration, contrast, music/feedback | Ink-outlined HUD, readable signs, raised trophy, framed typed boss intro | Retained. Outfits have distinct pickup/unlock/expiry cues and frozen timers on pause. Reward pose puts head accessories away to preserve the face and trophy separation; Tin/Peekaboo body treatment remains. Home-painting prompts join the footer instead of clipping at the screen edge. Four help pages, dynamic course counts and compact nine-objective cards/pause lists. |
| Bosses/ending | Milestone encounters and ending | Big Boohoo, King Grumpus, Crown and credits | Retained. More milestone bosses remain absent. |
| Saving | Persistent rewards/unlocks and safe suspension | v2 progress / run.v1 suspension, powers, detailed course state | Adds a twelve-bit permanent school record; active lesson, every coaster timer/speed/lane/jump/rival/mitten field, and ledge catch/climb state live in suspension. Existing keys/schema and old reward IDs retained. New stages, active descent, pending hop, hanging/climbing, pause and device refresh are checked. |
| Devices | Controller-first play | Keyboard, standard pad, phone/tablet controls | Same actions and 140 ms input pattern. Coaster gamepad/touch checks cover steer, brake, hop and pause; phone refresh checks the full paused slide state. Native harness advances fixed simulation and refreshes matrices; every shot and benchmark renders explicitly. Room/touch tests keep the real production render/input loop. |

## Ranked critique and response

1. **High: coins erased the hero.** The old underwater faces were uniformly emissive discs. A dense chest ring passed through the lens and filled the screen with yellow circles. Coins now have a dark recessed face, bright rim, raised central stamp, thickness, spin and small periodic glints. A deterministic render-only scale mask removes coins in the lens-to-player corridor and thins nearby ones. Positions, collision and saved coin progress stay unchanged. Eight actual camera turns at the wreck assert the view remains clear and distant coins remain visible.
2. **High: the library was a dark box with a plain rectangle on its floor.** Large floor triangles barely responded to the existing point lights. It now has a solid patterned rug, subdivided wooden floor carrying painted warm light, three candle fixtures, a warm reading light, varied book heights/leans and stacked books, a round reading table and a visible locked ledger. This adds both atmosphere and an authored reason to revisit the room. No blur or modern lighting effects. Tin uses original painted 32-pixel reflection bands.
3. **High: no power-up discovery or return loop.** Three linked secret stages now permanently wake their matching boxes. Each temporary form changes traversal, has its own required secret reward, and opens a separate return objective in an existing course. Solid boxes and interior refills make that progression usable without trapping a player after expiry. Unlocks are saved independently of outfit timers.
4. **High during development: a new ring approached the old lethal shoreline.** Real input traversal caught the hidden life loss. Rings were moved onto dry inland ground and given broad steps; the regression compares lives before/after entry. The Cove fan was also raised to clear its destination rather than merely pointing at it.
5. **Medium during development: new head accessories confused the reward proof.** The test was counting children of an invisible umbrella group. It now projects visible descendants only; actual trophy/head separation is still asserted at the get frame, three early frames and settled pose. Accessories are put away during the pose.
6. **Remaining depth/art gaps.** Five main courses and three brief secret stages still fall far short of the reference. The new stages teach one mechanic each; they do not substitute for complete additional courses. Indoor geometry/material variation and a dedicated snow slide are more valuable next than post effects.

Pass-1/2 movement, camera, slope-aligned shadows, Cast identities, reward hierarchy, sign lettering and boss-intro fixes are retained. The side flip reuses the skid window, needs a fresh jump press, rolls around the body and does not manufacture a triple-jump chain. Its rise, turn, landing and mid-flip refresh are captured. The sign atlas now has room for 64 full headings, without truncation.

## New required routes

| Outfit | Unlock and duration | Secret reward | Return reward |
| --- | --- | --- | --- |
| Brolly Bonnet | Pound Brolly Belfry's switch; 50 seconds per box | The Brolly Postal Service: launch, hold jump to glide and pass three ordered wind hoops to the far belfry. | Over the Custard Clouds: use the Cove updraft and steer to the separated cloud ledge. |
| Tin Biscuit | Belfry switch wakes Tin Pan Pantry's ring; pound its switch; 60 seconds | Both Boots Before Biscuits: walk down the flooded aisle, hold the pressure plate, enter the opened safe and fetch its lunch. | The Heavy Lunch Safe: descend into Grotto's eastern safe, weight its plate, fetch the lunch and return outside for the acorn. |
| Peekaboo Hood | Tin switch wakes Peekaboo Parlour's ring; pound its switch; 45 seconds | Now You See My Biscuits: walk through two violet grilles to the far reward. | The Overdue Afterlife: cross the library grille, fetch the glowing ledger and return to the rug. |

Boxes work repeatedly after their switch unlock. Brolly holds jump while falling; crouch folds it. Tin keeps full air, sinks, moves more slowly, jumps lower and withstands enemy contact. Peekaboo protects against contact and passes only marked grilles. Ordinary walls/floors remain solid. Timers freeze in pause, dialogue, reward and transitions. The final seconds have a clear warning; expiry restores ordinary movement and safely pushes a player out of a grille. Refill boxes inside each phase compartment and the ledger alcove prevent expiry from trapping a player; the far belfry also has a refill. Leaving/restarting a course clears the temporary outfit, while permanent switches remain on File A.

## Save compatibility

`v2`, `got`, `ac`, `records`, `score`, `lives`, options, high scores, world/door and detailed `run.v=1` remain readable. New `powers` records the three switch bits. Player suspension already copies its full plain state, now including outfit, remaining duration and glide state. `powerRun` adds wind-hoop index, pressure charge, safe latch/loot and ledger flag. These fields restore before the derived power meshes are posed. Collision support still resolves at the saved feet; new world definitions are appended so old world RNG seeds stay unchanged. New authored scenery does not consume the old patrol RNG.

The controller regression also saves and refreshes an active Tin outfit through the real account/server path, comparing its exact timer and permanent switch flags. Touch jump/pound input is held until the corresponding physics state rather than relying on a short wall-clock press on a software renderer.

Coin thinning/glints are derived from the saved camera and world clock and never mutate pickup positions or saved collection state. Audio tails and cosmetic particles remain unsuspended, as before. Real f913c7b and pass-2 HEAD saves are used by the compatibility regression; no live account or data directory is touched.

## Review and verification

Only disposable localhost servers in ports 18080–18099 with `/tmp` data; one browser at a time. The script finds source, historical snapshots and shots relative to `__dirname`, including runs launched from `/tmp`. Browser input is real keyboard, injected standard gamepad or CDP touch. Branch encounters use explicit position staging; switches and rewards are triggered through actual actions/collision, never the debug grant helper. This is targeted coverage, not an unaided complete 54-acorn campaign.

Before: `tests/shots/games/hop/pass3-before/` contains a title-to-hub/Cove/Peaks play-through, real indoor/water routes and timing JSON from committed HEAD. After: `tests/shots/games/hop/pass3-after/`. Earlier pass-1/2 captures remain untouched.

Reviewed pairs: `grotto-open-chest-native.png` and `manor-library-native.png`. New coin evidence: `wreck-coin-view-0/2/4/6-native.png`. New content evidence: outfit `*-model-front/side/back-native.png`, each `*-secret-card/start-native.png`, switch/unlock, flight, safe, grille, ledger, six reward sequences, refill recovery, safe expiry and refresh captures. Side-flip evidence is `side-flip-rise/turn/land-native.png` and `refresh-side-flip-native.png`. Device shots remain in the same pass-3 folder. Secret-stage entry shots precede the last home-prompt footer fix; the deadline-cut benchmark did not recapture them. `--feel-only` now runs the movement/camera/ground-pound checks its name describes; full native still runs every content check.

## Test results

All browser commands ran sequentially on disposable data, with a deadline wrapper that terminates remaining work before the report. The raster ratio is a house-fixture software-host cap; the cartridge remains 320×240. Baseline title/Cove/Peaks flow and the baseline manor/swim focused routes also exited 0. No shared kit changed.

| Command | Actual result |
| --- | --- |
| `node --check app/public/js/rm-g-hop.js && node --check tests/games/hop.mjs` | Exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; zero authored violations. |
| `git diff --check` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --powers-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --swim-only` | Exit 0. |
| `FIXTURE_RASTER_RATIO=0.35 node tests/games/hop.mjs http://localhost:18088 --room-only` | Exit 0. |
| `FIXTURE_RASTER_RATIO=0.35 FIXTURE_DEBUG=1 node tests/games/hop.mjs http://localhost:18088 --phone-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --legacy-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --manor-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --boss-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --trials-only` | Exit 0. |
| `node tests/games/hop.mjs http://localhost:18088 --native --edges-only` | Not independently completed before the reporting deadline. |
| `node tests/games/hop.mjs http://localhost:18088 --native --feel-only` | Not independently completed before the reporting deadline. |
| `node tests/mobile.mjs http://localhost:18088 --only=gate` | Exit 0. |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | Exit 0. |
| `node /opt/stacks/landing-hop/tests/games/hop.mjs http://localhost:18088 --before --bench` | Exit 0 earlier in the run; final repeat skipped at the deadline. |
| `node /opt/stacks/landing-hop/tests/games/hop.mjs http://localhost:18088 --bench` | Exit 124: reporting-deadline wrapper stopped the run. |

The final native run covers title/attract/continue, real Cove/Peaks/Grotto and secret-ring entries, old and new movements, camera sweeps, mansion routes, four trials, both bosses/credits, all seven original Grotto rewards, all six new outfit rewards and detailed suspension. The room test includes actual standard-pad switch/box/glide actions, Tin seabed walking, exact active-outfit/timer and permanent-switch preservation through production refresh, no repeated score submission, Esc/Q and CDP phone/tablet controls. Separate focused options exercise the same helpers; any budget-cut option is reported above rather than treated as a pass.

Development failures were corrected before these final runs: the shoreline entrance, insufficient fan lift, roof spawn, pedestal-target navigation, a red-coin path through the new safe, and short touch timing under software rendering. The latter now holds jump/pound until the observed physics state. GPU readback diagnostic messages are excluded by the existing fixture; cartridge-caused console errors/warnings remain assertions. Server logs are checked for “mod failed to load”.

## Measured frame cost

320×240, DPR 1, 60 warm-up + 120 measured frames/view, actual RoomTV RNG; update + draw/HUD + synchronous GPU readback. ANGLE/SwiftShader on a shared machine, house excluded. These are software-renderer costs, not hardware FPS guarantees; host load and readback contribute to timing tails. Raw baseline: `pass3-before/paired-performance.json`; raw after: `pass3-after/performance.json` under `tests/shots/games/hop/`.

| View | Before median / p95 ms | After median / p95 ms | After update median / p95 ms | Calls / triangles |
| --- | --- | --- | --- | --- |
| hub | 20.5 / 29.1 | 18.3 / 26.6 | 0.2 / 0.6 | 57 / 51,317 |
| cove | 18.4 / 29.0 | 22.7 / 43.6 | 1.0 / 1.5 | 40 / 55,942 |
| peaks | 21.9 / 30.5 | 22.6 / 38.8 | 1.3 / 1.9 | 36 / 58,934 |
| manor | 27.3 / 38.1 | 28.2 / 47.2 | 1.7 / 2.9 | 70 / 59,154 |
| tower | 13.2 / 22.8 | 9.9 / 16.7 | 0.6 / 0.9 | 23 / 29,575 |
| boss | 12.7 / 26.0 | 9.9 / 17.7 | 0.3 / 0.5 | 24 / 17,257 |
| grotto | 24.8 / 35.5 | 25.9 / 45.1 | 1.2 / 1.8 | 51 / 55,830 |
| manor-interior | 17.0 / 26.4 | 18.9 / 29.2 | 1.8 / 3.1 | 37 / 49,488 |
| grotto-wreck | 21.0 / 35.9 | 29.1 / 46.3 | 1.8 / 2.2 | 24 / 48,620 |
| brolly | — | 9.3 / 15.4 | 0.2 / 0.3 | 33 / 14,704 |
| pantry | — | 13.0 / 23.0 | 0.6 / 0.7 | 27 / 18,310 |
| peekaboo | — | 13.5 / 30.1 | 0.5 / 0.6 | 34 / 20,628 |
| brolly-flight | — | 8.3 / 13.1 | 0.4 / 0.6 | 24 / 13,578 |
| pantry-tin | — | 11.1 / 16.3 | 0.9 / 1.0 | 20 / 17,816 |
| library-peek | — | 20.5 / 36.9 | 2.2 / 3.9 | 39 / 50,472 |

Peak sampled resources: 70 calls, 59,154 triangles, 67 geometries and 41 textures. Original 32-pixel tin reflection, one sign atlas and shared outfit geometry/materials; no post passes, blur or shadow maps.

After values are from the full native run, which includes unlocked boxes and acquired-reward state. A fresh paired after benchmark did not finish before this report; the measurements are not a controlled host-load comparison.

## Next chunk and limits

Build a sixth full main course and milestone boss. Expand ledge catches to moving platforms and terrain edges, and add a risky authored shortcut to the Cocoa Coaster. Retune the old coast/hub challenges before extending swimming to them. Expand Brolly routes into longer altitude-management courses; the current bonnet is controlled gliding from launch fans. Preserve existing reward IDs, door thresholds and cold-cache save compatibility.

No claim of full reference scope or a modern showcase renderer. Physical controllers, mobile GPU performance and a listening session are not available in headless validation. Camera checks sample recorded routes/orbits rather than every geometry/input combination. Every cheat/outfit combination, unaided 54-acorn progression and the full natural clockwork timed ascent remain unverified.


## 2.80.0 ground-pound release blocker

The intermittent failure was in the phone portion of the default room/controller run. An instrumented replay of the original gesture reproduced it: the height poll returned at browser time 47002.1 ms, with feet at 13.185 and downward velocity −1.3. C arrived at 47448.1 ms, **446 ms later**, with feet at 11.085, floor at 10.56 (clearance **0.525**, below the required 0.9), and downward velocity −12.1. The cartridge read the C edge at 47461.7 ms, **13.6 ms after pointerdown**, at that same height. It then landed and crouched with C held, matching both supplied failure logs. The pending input reached simulation; the test had spent its remaining airtime on the fixture's 200 ms polling/handle round trips, release and button-layout lookup. The power flag is set synchronously by a successful pound landing before saving; this failure never entered the pound state.

There was also a separate player-facing rejection: real keyboard C down/up before a simulation step, sent on airborne jump frames 1–5, was discarded below the clearance gate; frames 6 and 12 worked. The cartridge now remembers that airborne edge for 140 ms, consumes it once clearance permits, and clears it on landing, respawn, hurt or death. Sampling eligibility before jump processing preserves grounded crouch+jump as backflip/long jump. The timer uses simulation time and the existing player snapshot, so pause and refresh retain it. No shared input kit or save schema/key changed.

The phone regression resolves both button positions before takeoff and waits in the browser animation loop for **rising** clearance above 1.1. It still sends actual touch events. A capture listener records the state at C pointerdown, and an assertion requires actual airborne clearance above 0.9; there is no retry, extended eligibility or direct unlock. Native coverage requests pounds on frames 1–6 and 12 after takeoff, releases C before stepping, refreshes with a pending request, checks single consumption, and checks the grounded backflip chord. A supplemental production-runtime check dispatches down/up within one JavaScript task and verifies the edge is consumed with the button already released, independently of render pacing.

Evidence: `tests/shots/games/hop/input-blocker/early-press-before.json`, `original-touch-failure.json`, and `performance-before.json`. The instrumented original-gesture run is `/tmp/cmp-hop-input-diagnosis-full.log` (node exit 1, expected reproduction); two preceding phone-only diagnostic runs passed. Validation results below are recorded only after completion. The original diagnosis used a 5-second failure cap after the same gesture so it did not wait out the fixture's long timeout; the captured input timing precedes that cap. Campaign/content scope and the next content chunk above are unchanged.

Release-blocker verification (all four cmp runs used identical game/test source hashes):

- `node --check app/public/js/rm-g-hop.js`: exit 0.
- `node --check tests/games/hop.mjs`: exit 0.
- `node --expose-internals tests/parody-audit.cjs`: exit 0; zero authored text spans.
- Four consecutive `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop <label> games/hop.mjs` runs, with these labels and actual node results:

| Label | Node exit | C clearance at actual touch | Vertical velocity | Same-task production pulse |
| --- | --- | --- | --- | --- |
| `hop-blocker-1` | 0 | 1.648 | 6.5 | 0.3 ms; read with C released |
| `hop-blocker-2` | 0 | 1.747 | 5.9 | 0.4 ms; read with C released |
| `hop-blocker-3` | 0 | 1.540 | 7.1 | 0.2 ms; read with C released |
| `hop-blocker-4` | 0 | 1.547 | 7.3 | 0.3 ms; read with C released |

Per-run logs: `/tmp/cmp-hop-blocker-{1,2,3,4}.log`; each includes the native campaign, between-frame input regression, physical-room/controller play, production save/refresh and real phone touch. Each has `POUND INPUT PASS`, `RUNTIME INPUT PASS`, `ROOM PASS`, `PHONE PASS` and `HOP AFTER PASS`. Runtime/touch/performance JSON for each run is preserved under `tests/shots/games/hop/input-blocker/run-{1,2,3,4}-*.json`. The four cmp server logs have no module-load failures.

- `node tests/games/hop.mjs http://localhost:18088 --native`: exit 0; `/tmp/hop-blocker-native.log`.
- `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` (no URL): exit 0; **12/12 passed**, including browser errors and server log; `/tmp/hop-blocker-smoke.log`.


Release-blocker frame samples, in milliseconds (same 320×240 software renderer, update + draw + synchronous GPU readback; 60 warmup + 120 samples):

| Course | Before median / p95 | After median / p95 | Update median before → after |
| --- | --- | --- | --- |
| hub | 11.9 / 13.1 | 11.9 / 13.5 | 0.2 → 0.2 |
| brolly | 5.9 / 6.9 | 6.1 / 6.8 | 0.2 → 0.2 |
| grotto | 16.8 / 19.2 | 17.7 / 19.7 | 1.2 → 1.2 |
| manor-interior | 14.6 / 18.2 | 15.1 / 17.7 | 1.7 → 1.7 |

Both JSON files are under `tests/shots/games/hop/input-blocker/performance-{before,after}.json`. Render cost varies between samples; the measured update medians did not increase. No render code changed in this repair. Before/after evidence shots are `input-blocker/original-touch-failure.png` (original gesture landed and crouched), `input-blocker/buffered-pound-after.png` (early airborne request now starts the pound), and `input-blocker/phone-brolly-after.png` (successful real-touch switch unlock and glide), relative to `tests/shots/games/hop/`.


## Pass 4 — critique, implementation and evidence

1. **High: snow lacked its defining enclosed descent.** The existing rival followed a short exposed mountain path. Cocoa Coaster is a separate complete miniature course inside the igloo, with five bends, a narrower middle, three readable snow ridges, lane inertia, tuck/brake, wall scrapes and a 140 ms hop buffer. The rival uses acceleration, curvature braking and physical ridge hops; there is no rubber-band teleport or player-state damage shortcut. An original faster synth piece follows the descent and restores after pause. Practice completion and winning the rival race are separate rewards; losing leads to a real rematch.
2. **High: the igloo was a sealed shell.** Its old plug/reward remain intact. B at its front enters a solid timber-and-ice lodge with frosted windows, roof beams, woven rug pattern, vertex-painted warm floor light, cocoa counter and mugs, stove/flue, benches and drying rack. Three lost mittens use actual jumps/climbs and collision, then reveal an acorn on the rug. Return from the finish chamber and exit back to the same Peaks entrance are explicit.
3. **High: the island did not teach the moves.** A Cast-named coach now starts twelve challenges: hop, double/triple hop, twirl, long hop, backflip, side flip, wall kick, ground pound, punch, ledge climb and camera. Each requires its action and a marked landing/target, with saved completion and a diploma reward. Early play caught a lethal shoreline gap before the school; a supported boardwalk and small walkable steps now connect the yard to dry land.
4. **High: ledges offered no recovery.** Static rectangular and round ledges now catch a descending player with room to climb. A short settling motion and contact tone lead into hanging; an A edge is retained for 140 ms through the catch, climbs once, and survives suspension. Z drops once without also triggering a pound or immediate re-grab. Headroom checks reject blocked climbs. Moving platforms and terrain silhouettes are explicitly outside this first ledge implementation.
5. **Medium, caught by shots: the finish banner blocked the reward camera as Bopper bounced.** Selecting a clear starting angle was insufficient. The reward camera now chooses clearance across the full rise, and the new course uses a slightly wider celebration lens. The unchanged title/head/trophy native-pixel checks still run on every reward capture. Friendly dialogue also uses a two-character angle; the rival is no longer hidden behind Bopper, and intro shots wait for the first line to finish typing.
6. **Remaining depth:** the campaign is still five main courses plus smaller stages, far short of the reference. There is no sixth full course in this pass. The coaster has a complete continuous route and fair race, but lacks a secret shortcut and alternate line. Physical hardware and a listening session remain unverified.

Before evidence: `tests/shots/games/hop/pass4-before/` (`title`, `hub-movement`, `peaks-start`, `peaks-mid`, `igloo-front`, `old-rival-dialogue`, `old-mountain-race`, each with native PNG). After evidence: `tests/shots/games/hop/pass4-after/` (`cocoa-lodge`, `lodge-view-*`, mitten reward, practice/loss/race 16/38/62/86% sequences, rival intro, all three snow rewards, school approach/playground/12 lessons/diploma, ledge hang/climb/drop/round rim, gamepad coaster and phone paused/refresh captures).

### Pass-4 frame samples and test method

The baseline ran committed HEAD before edits. Native after profiling uses the same 320×240 DPR-1 update/draw/HUD + synchronous GPU readback method, 60 warm-up and 120 samples per view. ANGLE/SwiftShader and other workers share this host; these are not hardware FPS guarantees or a controlled load comparison. Raw data: `pass4-before/performance.json` and `pass4-proof/native-performance.json` beneath `tests/shots/games/hop/`.

| View | Before median / p95 ms | After median / p95 ms | After update median / p95 ms | After calls / triangles |
| --- | --- | --- | --- | --- |
| Hub | 53.7 / 160.3 | 33.1 / 63.4 | 0.6 / 1.2 | 57 / 52,769 |
| Peaks | 54.7 / 185.9 | 60.9 / 120.6 | 1.6 / 4.0 | 36 / 58,934 |
| Cocoa lodge | — | 60.9 / 121.8 | 1.1 / 2.7 | 26 / 34,860 |
| Coaster descent | — | 60.7 / 110.5 | 0.5 / 0.9 | 20 / 32,142 |

Full frame sampling remains under `--native` and `--bench`. Default repeated regressions still run all campaign/challenge/input/save/camera assertions, screenshots, room/controller and phone paths, plus a separate 54-reward inventory assertion; they do not repeat the GPU profiler. Their `run-N-performance.json` files explicitly identify themselves as inventory records, not timings. Native fixture waits advance each fixed physics/input step and refresh matrices in the browser, and screenshots/benchmarks render explicitly. Production room/touch tests retain the real animation loop. Direction levels remain held between navigation batches, avoiding redundant browser-protocol key round trips; edge-action tests still send real released-between-frame presses.

### Pass-4 validation

Source hashes in `pass4-proof/source-hashes.json` were recorded before the first consecutive run. No game or test source changes follow that recording. One browser at a time; disposable data only. The requested `cmp.sh` helper allocates its own disposable port/data and starts server and test in the same shell; standalone runs use ports 18088/18089. Its shell exit alone does not prove a pass: the reported node exit and final `HOP AFTER PASS` are checked.

| Command | Actual result |
| --- | --- |
| `node --check app/public/js/rm-g-hop.js` | Exit 0. |
| `node --check tests/games/hop.mjs` | Exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; zero authored text spans. |
| `git diff --check` | Exit 0 after removing an extra documentation EOF newline. |
| `node tests/games/hop.mjs http://localhost:18088 --native` | Exit 0; full native campaign and 17 profile views, `/tmp/hop4-native-final.log`. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop4-final-features-v2 games/hop.mjs --native --pass4-only` | Node exit 0; new-course, school, ledge and suspension checks. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop4-stable-1 games/hop.mjs` | Node exit 0; native, runtime pulse, room/controller and phone/tablet all passed. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop4-stable-2 games/hop.mjs` | Node exit 0; full native, room/controller and phone/tablet passed. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop4-stable-3 games/hop.mjs` | Node exit 0; third consecutive full native, room/controller and phone/tablet pass. |

The three full cmp runs used identical source hashes and all ended with `HOP AFTER PASS`; server logs contain no module-load failures. Per-run inventory and input traces are preserved in `pass4-proof/run-{1,2,3}-{performance,runtime,touch}.json`. Phone pound clearance at input was 2.335 / 1.547 / 1.852 metres; all were airborne and rising. Same-task production down/up pulses lasted 0.8 / 0.2 / 0.2 ms and were consumed with the button already released. New production slide steering, braking, hopping, pause and exact phone-refresh state passed each time.

`cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` (no URL): exit 0, **12/12 passed**, including browser errors and server log. Log: `/tmp/hop4-smoke.log`. `node tests/mobile.mjs http://localhost:18089 --only=gate`: exit 0, **1/1 passed** (59 seconds); `/tmp/hop4-mobile.log`. Reviewed phone portrait, phone landscape and tablet gate shots under `tests/shots/mobile/`, plus the native/room/phone cartridge captures above. Its disposable server log has no module-load failures.

Development runs are not counted as final proof: focus 1–7 exited 1 while exposing missing reward reveal conditions, test navigation continuing after automatic slide entry, camera-relative mitten navigation, a solid-sign target, reward-camera clipping on the bounce, and the unsafe approach to the school. Those were fixed; focus 8, the school probe, reward diagnostic and both feature preflights exited 0. An older long preflight was deliberately cancelled (130) after driver optimization; a later multi-test wrapper ended with SIGTERM (143) during its first cmp without an assertion failure, and its server was confirmed down. Neither interrupted run counts toward the consecutive proof. Logs are `/tmp/cmp-hop4-{focus-1..8,school-1,reward-diag,final-features,final-features-v2,proof-1,stable-1-interrupted}.log`.

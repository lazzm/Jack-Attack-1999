# Bounce Quest 64 — scope and depth review

Pass 3 starts at HEAD `f8ead82` (main 2.79.0); passes 1–2 shipped in 2.78.0. Original code, procedural models, textures, compositions and music only. The cartridge stays vertex-lit at 320×240 with low-resolution textures, fog and no blur or graphics menu. No shared kits, account/economy code, versions, changelog, deployment or commits are part of this pass.

## Scope against the 1996 reference

The reference has fifteen main courses, miniature courses, 120 rewards, swimming, acrobatic movement and three switch-unlocked caps ([official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_8/Manual_Nintendo64_SuperMario64_EN.pdf), [official game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Super-Mario-64-269745.html)). Its volume and movement freedom remain the target; this cartridge is substantially smaller.

| Feature/content | Reference has | Before pass 3 | Current / remaining gap |
| --- | --- | --- | --- |
| Campaign | 15 main courses, miniature courses, 120 rewards | Five seven-acorn courses, hub eight, Crown: 44 | **50 acorns**: hub 8; Cove/Manor/Grotto 8 each; Peaks/Tower 7 each; three secret stages 1 each; Crown 1. Original doors, thresholds and all 44 reward IDs preserved. Campaign volume remains the largest gap. |
| Hub | Exploration, movement lessons, secrets, course entrances | Eight routes, six course/boss doors | Three additional secret rings in the landscape; Brolly → Tin → Peekaboo switch ladder. Grounded stepped approaches. Dedicated movement school remains absent. |
| Beach | Vertical routes, exploration, cap revisits | Sandcastle, chest, chimney, clam, offshore rocks, red/100 coins, Bell Buoy Dash | Adds a reusable Brolly box, updraft and separate cloud ledge/reward. The original open sea retains its old fallout rule. |
| Snow | Mountain, slides, slippery surfaces, rival | Summit, penguin race, igloo, berg, snowballs, Flapjack Post Run | Retained. A dedicated enclosed snow slide and interior remain next-tier content. |
| Haunted course | Mansion rooms, puzzles, ghosts, cap secrets, boss | Two floors, foyer/library/dining/stairs/study, exterior lift/roof, maze, lanterns, Boohoo, bell puzzle | Library gets candle fixtures, warm light/pool geometry, varied books, patterned solid rug, reading table and a sealed glowing ledger. Peekaboo return objective requires crossing the violet grille and bringing its reward back to the open rug. More room puzzles remain useful. |
| Swimming | Breath, depth, wreck exploration, cap-dependent seabed travel | Grotto with seven objectives, vents, wreck/chest, pearls, current hoops, jelly enemies, roost, red/100 coins | Adds Tin box and a submerged weight-plate safe/reward. Foreground coins thin away from the player; embossed faces, rims, spin and periodic glints replace flat blobs. Legacy Cove/hub water is not converted to swimming. |
| Clockwork | Moving platforms, conveyors, timing, route mastery | Gears, lifts, hands, belt, shortcut, slow-clock trial | Retained. A second full layout and a verified complete natural timed ascent remain absent. |
| Three power-ups | Permanent switches, temporary wing/metal/invisibility abilities, revisits | None | **Brolly Bonnet** glides and uses updrafts; **Tin Biscuit** sinks, walks without air and operates weight plates; **Peekaboo Hood** crosses marked violet grilles. Each has a permanent pound switch in its own secret stage, reusable boxes, timed outfit, unique silhouette and two required rewards. Brolly is a glider with launch fans, not unrestricted flight. |
| Secret stages | Distinct cap-switch miniature courses | None | **Brolly Belfry**: floating islands/bridge/fan/three wind hoops/bell. **Tin Pan Pantry**: dry switch landing, flooded aisle, biscuit tins, weight plate and lunch safe. **Peekaboo Parlour**: candlelit hall, two full-height violet grilles and return reward. Secret rewards return to their hub ring after celebration. More miniature courses remain absent. |
| Moves/camera | Chained jumps, long jump, wall kick, swimming, adaptive camera | Repaired moves/coyote/buffer, scene collision, indoor recovery, readable shadows | Retained; gliding and a running reverse-and-jump side flip added. The 2.80.0 blocker repair buffers airborne pound requests for 140 ms through early takeoff. Wind ribbons are rendered separately from camera blockers. Marked grilles are ignored by camera collision only during Peekaboo, while normal walls/floors remain solid. Ledge grab remains absent. |
| Rewards/presentation | Clear celebration, contrast, music/feedback | Ink-outlined HUD, readable signs, raised trophy, framed typed boss intro | Retained. Outfits have distinct pickup/unlock/expiry cues and frozen timers on pause. Reward pose puts head accessories away to preserve the face and trophy separation; Tin/Peekaboo body treatment remains. Home-painting prompts join the footer instead of clipping at the screen edge. Four help pages, dynamic course counts and compact eight-objective cards/pause lists. |
| Bosses/ending | Milestone encounters and ending | Big Boohoo, King Grumpus, Crown and credits | Retained. More milestone bosses remain absent. |
| Saving | Persistent rewards/unlocks and safe suspension | Detailed v2/run.v1 suspension, production refresh safety | Adds permanent `powers`, player outfit/time/glide state and per-visit hoop/pressure/safe/ledger state. No old save key or reward ID removed. Expiry inside a grille ejects beside it. |
| Devices | Controller-first play | Keyboard, standard pad, phone/tablet controls | Uses the same jump/punch/crouch actions; no new button or chord. Native routes plus physical-room/controller/touch regressions and mobile gate are recorded below. |

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

Only disposable localhost servers in ports 18080–18099 with `/tmp` data; one browser at a time. The script finds source, historical snapshots and shots relative to `__dirname`, including runs launched from `/tmp`. Browser input is real keyboard, injected standard gamepad or CDP touch. Branch encounters use explicit position staging; switches and rewards are triggered through actual actions/collision, never the debug grant helper. This is targeted coverage, not an unaided complete 50-acorn campaign.

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

Build a complete enclosed snow slide and a richer snow interior, then another full course and milestone boss. Add a hub movement school and ledge grab. Retune the old coast/hub challenges before extending swimming to them. Expand Brolly routes into longer altitude-management courses; the current bonnet is controlled gliding from launch fans. Preserve existing reward IDs, door thresholds and cold-cache save compatibility.

No claim of full reference scope or a modern showcase renderer. Physical controllers, mobile GPU performance and a listening session are not available in headless validation. Camera checks sample recorded routes/orbits rather than every geometry/input combination. Every cheat/outfit combination, unaided 50-acorn progression and the full natural clockwork timed ascent remain unverified.


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

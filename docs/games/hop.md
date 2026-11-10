# Bounce Quest 64 — scope and depth review

Pass 6 starts at HEAD `90d8639` (main 2.85.0). Passes 1–5 and the input/QA repairs are live at 60 acorns across six main courses. This pass adds the physical Cocoa Express shortcut and the seventh main course, Sherbet Sandstorm, bringing the inventory to 66. All 60 existing reward IDs, old door thresholds, world seeds and save keys remain intact. Original code, procedural models, textures, compositions and music only; vertex-lit 320×240, low-resolution textures, fog, no blur or graphics menu. No shared kit, account/economy, version/changelog, deployment or commit changes.

## Scope against the 1996 reference

The reference has fifteen main courses, miniature courses, 120 rewards, swimming, acrobatic movement and three switch-unlocked caps ([official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_8/Manual_Nintendo64_SuperMario64_EN.pdf), [official game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Super-Mario-64-269745.html)). Its volume and movement freedom remain the target; this cartridge is substantially smaller.

| Feature/content | Reference has | Before pass 6 | Current / remaining gap |
| --- | --- | --- | --- |
| Campaign | 15 main courses, miniature courses, 120 rewards | 60 acorns across six main courses, hub, outfits, coaster and Crown | **66 acorns**: hub 9; Cove/Manor/Grotto 8 each; Peaks/Tower 7 each; Troubleworks/Sandstorm 6 each; three outfit stages 1 each; Cocoa Coaster 3; Crown 1. All prior IDs and existing thresholds retained. Eight more main courses remain against the reference. |
| Hub | Exploration, movement lessons, secrets, course entrances | Nine rewards, seven doors, three secret rings and the twelve-lesson school | Eighth door appended at 21 acorns; old seven doors, thresholds and return positions stay fixed. QA7 real-move checks, glove contact and one-time coach greeting are retained. |
| Beach | Vertical routes, exploration, cap revisits | Sandcastle, chest, chimney, clam, offshore rocks, red/100 coins, Bell Buoy Dash | Retains a reusable Brolly box, updraft and separate cloud ledge/reward. The original open sea retains its old fallout rule. |
| Snow | Mountain, enclosed slide, slippery surfaces, rival, interior | Seven outdoor rewards plus the enclosed Cocoa Coaster/lodge and its three rewards | Cocoa Express is a real enclosed alternate centreline, with a signed fork, a committed nine-metre gap, visible safety net, free recovery to the approach and physical rejoin. A clean jump earns a shorter race line; the rival stays on its authored route. Branch/net/count-in state is suspended. |
| Haunted course | Mansion rooms, puzzles, ghosts, cap secrets, boss | Two floors, foyer/library/dining/stairs/study, exterior lift/roof, maze, lanterns, Boohoo, bell puzzle | Retains candle fixtures, warm light/pool geometry, varied books, patterned solid rug, reading table and a sealed glowing ledger. Peekaboo return objective requires crossing the violet grille and bringing its reward back to the open rug. More room puzzles remain useful. |
| Swimming | Breath, depth, wreck exploration, cap-dependent seabed travel | Grotto with eight objectives, vents, wreck/chest, pearls, current hoops, jelly enemies, roost, red/100 coins and Tin weight-plate safe | Retains Tin box and a submerged weight-plate safe/reward. Foreground coins thin away from the player; embossed faces, rims, spin and periodic glints replace flat blobs. Legacy Cove/hub water is not converted to swimming. |
| Clockwork | Moving platforms, conveyors, timing, route mastery | Gears, lifts, hands, belt, shortcut, slow-clock trial | Retained. A second full layout and a verified complete natural timed ascent remain absent. |
| Foundry | Distinct hot course, vertical routes, hazards, boss | Six Troubleworks objectives and foreman boss | **Treacle Troubleworks** retains its original syrup-foundry theme, two original tunes, kettle enemies with visible steam wind-up, eighteen-step popping stack, three cooling valves and changing pan, six-stage timed mint gantry, ferries/elevator, eight red coins and 186 authored normal coins. Six named rewards; all course and boss state is suspended. |
| Desert | Different terrain/traversal theme, exploration and revisits | Absent | **Sherbet Sandstorm**: rolling authored dunes, two marked sand-wind lanes, nine solid temple tiers, buried courtyard/parcel, three pound drums and bells, five-hoop timed post round, original scarab tell/charge enemies and new music. Six named rewards, eight reds and 150+ normal coins. Raised platforms are calm; missed jumps land on safe sand. |
| Three power-ups | Permanent switches, temporary wing/metal/invisibility abilities, revisits | Three switch-unlocked outfits, six required rewards | **Brolly Bonnet** glides and uses updrafts; **Tin Biscuit** sinks, walks without air and operates weight plates; **Peekaboo Hood** crosses marked violet grilles. Each has a permanent pound switch in its own secret stage, reusable boxes, timed outfit, unique silhouette and two required rewards. Brolly is a glider with launch fans, not unrestricted flight. |
| Secret stages | Distinct cap-switch miniature courses | Belfry, Pantry and Parlour with permanent switches | **Brolly Belfry**: floating islands/bridge/fan/three wind hoops/bell. **Tin Pan Pantry**: dry switch landing, flooded aisle, biscuit tins, weight plate and lunch safe. **Peekaboo Parlour**: candlelit hall, two full-height violet grilles and return reward. Secret rewards return to their hub ring after celebration. More miniature courses remain absent. |
| Moves/camera | Chained jumps, long jump, wall kick, swimming, ledge grab, adaptive camera | Full acrobatics, 140 ms buffers and static/moving/terrain ledge catches | Retains local-space grips on translating, lifting and rotating platforms; climb/drop carries platform motion. Discontinuous height-field cliffs can be caught with headroom/floor checks; the foundry toffee mesa is a real terrain surface. Smooth hills remain slopes. A wide foreman camera preserves steering yaw and avoids body occlusion; the new courtyard uses the established indoor clearance rules. |
| Rewards/presentation | Clear celebration, contrast, music/feedback | Ink-outlined HUD, readable signs, raised trophy, framed typed boss intro | Retained. Outfits have distinct pickup/unlock/expiry cues and frozen timers on pause. Reward pose puts head accessories away to preserve the face and trophy separation; Tin/Peekaboo body treatment remains. Home-painting prompts join the footer instead of clipping at the screen edge. Four help pages, dynamic course counts and compact nine-objective cards/pause lists. |
| Bosses/ending | Milestone encounters and ending | Big Boohoo, King Grumpus/Crown and the foreman | Troubleworks opens at 15 acorns, before the unchanged 18-acorn finale. Its Cast-named foreman, the Big Softy, gives tells, expanding steam rings and five-second cooling windows; backflip onto the blue lid and pound three times. Two/three/four-stomp batches escalate consistently. Foreman is one of the six course rewards; old saves are not given an extra finale gate. |
| Saving | Persistent rewards/unlocks and safe suspension | v2 progress / run.v1 suspension, powers, school, coaster, foundry and moving ledges | Adds Express route/net recovery and Sandstorm bell/post/parcel state. All 60 prior reward IDs, world seeds, old solid/NPC indices and save keys remain. Real 2.85 coaster intro/descent and school-grip saves exercise compatibility; new route and parcel refresh use the production account path. |
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

Only disposable localhost servers in ports 18080–18099 with `/tmp` data; one browser at a time. The script finds source, historical snapshots and shots relative to `__dirname`, including runs launched from `/tmp`. Browser input is real keyboard, injected standard gamepad or CDP touch. Branch encounters use explicit position staging; switches and rewards are triggered through actual actions/collision, never the debug grant helper. This is targeted coverage, not an unaided complete 66-acorn campaign.

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

Build an eighth full main course around a tree-canopy traversal loop and six complete objectives, then extend existing courses with deeper return routes and room puzzles. Cocoa Express and the seventh course are now implemented; their new route and save validation is recorded in pass 6 below. Broaden terrain-ledge coverage beyond the new discontinuous cliff; smooth slopes remain walking/sliding surfaces. Retune the old coast/hub challenges before extending swimming to them. Expand Brolly routes into longer altitude-management courses; the current bonnet is controlled gliding from launch fans. Preserve existing reward IDs, door thresholds and cold-cache save compatibility.

No claim of full reference scope or a modern showcase renderer. Physical controllers, mobile GPU performance and a listening session are not available in headless validation. Camera checks sample recorded routes/orbits rather than every geometry/input combination. Every cheat/outfit combination, unaided 66-acorn progression and the full natural clockwork timed ascent remain unverified.


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

## Pass 5 — critique and implementation

1. **High: five main courses left the campaign short of both volume and variety.** Treacle Troubleworks is a complete sixth course, with a recognisable syrup-foundry silhouette, original industrial melody, mint transport machinery, copper vats, steaming stacks and dangerous treacle. Its six objectives use exploration, repeated climbing, cooling machinery, timed gantry jumps, a boss and the two coin routes.
2. **High: the stretch before the finale needed a readable milestone fight.** Foreman `{mate4}` is the Big Softy, an original walking kettle. The 15-acorn course sits before the retained 18-acorn final door. Every stomp has a 1.15-second squash/amber-ring tell; white steam rings can be jumped. Batches contain two, then three, then four stomps. The blue lid stays cool for five seconds. Real backflip/ground-pound contact is required for three hits; hot punches do not count. No homing attack, random damage or rubber-banding.
3. **Medium, caught during play: a raised bridge stopped a walking approach.** Three small copper steps now join the lower bridge to the stack yard. Spiral steps were narrowed to leave headroom between neighbours. The scripted jump pilot also needed to brake in air rather than release directions and coast past a landing; it now uses actual direction keys to steer and brake. It never sets jump or boss states.
4. **Medium: steam could erase the hero near the chimney.** Steam remains solid low-poly geometry, with a render-only mask in the camera-to-player corridor. Coins retain the prior rim/spin/sparkle and lens thinning. No blur or extra render pass is introduced. The foreman has a separate body model so the climbable blue lid is the visible landing surface, with no hidden knob passing through Bopper.

The seven-door thresholds are 0 / 3 / 7 / 12 / 18 / 5 / 15 in persistent door-index order; the seventh door is appended, so all six old entrances and return positions remain fixed. New world definitions are appended, preserving old procedural seeds. The new encounter is a pre-finale milestone available at 15, without a retroactive key requirement on existing 18-acorn saves. The QA7 school action checks, glove contact and one-time coach greeting are retained.

Before captures and raw frame samples: `tests/shots/games/hop/pass5-before/`. Final route captures: `tests/shots/games/hop/pass5-after/`. Development captures are retained separately in `pass5-development/`; final validation and measured frame costs are recorded below.

5. **Medium, caught by the coin route:** the new home door initially overlapped a coin loop. It now sits in the quiet rear corner of the entrance platform, so following a coin trail cannot unexpectedly leave the course. Revisiting the defeated foreman also clears its physical lid, instead of leaving an invisible obstacle.
6. **Remaining scope:** the risky Cocoa Coaster shortcut is deferred to a dedicated branch/camera pass. There are six main courses, nine fewer than the reference; the next main course is still absent. No hardware controller, mobile GPU benchmark or listening session is claimed.

Moving grips store local hang/climb endpoints against the existing solid index and rebuild them from platform translation/rotation every step. Drop velocity is sampled from the authored motion function, including rotation and the tower slow-clock rate. The 100 ms grip settle retains the existing 140 ms climb buffer. A moving surface that removes head/floor space releases the player instead of crushing or trapping them. Terrain grabs require a genuine height discontinuity and clear landing/head space; ordinary smooth hills do not become invisible hanging walls. The new octagonal mesa has a closed top, cliff sides and bottom, with its physical height field matching the rendered rim.

The production controller test arms each wave jump inside the browser animation loop, recording radius, distance, simulation time and cartridge frame. The earlier polling attempt could dispatch after the wave had reached Bopper; the replacement sends actual standard-pad levels in an observed safe window, without retries or simulation/boss-state mutation. The old released-between-frame pound regression remains unchanged. Production refresh compares all foundry fields exactly after a real lid pound.

### The six Troubleworks acorns

| ID / acorn | Required route |
| --- | --- |
| `stack` — The Top of the Popping Stack | Jump around eighteen authored platforms; a skilled higher landing is allowed. |
| `gantry` — The Great Gantry Tea Break | Talk beside the brass start, walk the real timed route and jump six mint platforms within 45 seconds. Timeout and rematch are covered; pause freezes the clock. |
| `valves` — Three Turns for the Cooler | Ground pound three brass valves on separate yards; the pan visibly cools. |
| `foreman` — The Big Softy Cools Down | Read the stomp pattern, jump its rings, backflip onto the cool lid and pound three times. Retreat resets the pattern; damage/intro/waves survive refresh. |
| `reds` — Eight Red Hot Pay Packets | Search the entrance, toffee mesa, west yard, stack, gantry and cooling yard. |
| `c100` — A Hundred Sweet Pennies | Collect 100 coins from the course's 180+ authored coins; jump for the reward where it appears. |

The shift boss stands at the actual start. The final regression takes the entire timed route after starting the clock, deliberately loses once, cold-refreshes the loss, and wins a real rematch. Its jump pilot presses and releases real keys, steers/brakes in air and takes run-ups; it never modifies movement or boss simulation state. Branch encounters are positioned explicitly, as in the earlier passes. This is targeted route coverage, not an unaided sixty-acorn campaign.

### Pass-5 validation

Before: `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-before games/.hop-pass5-before.mjs --native --before` exited 0; the temporary probe was removed. It played title/attract, hub, real Cove/Peaks entries and pickups, movement/camera checks, then profiled hub/tower/finale from committed HEAD. Before images and JSON are in `pass5-before/`.

The new option is `--foundry-only`. `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-final-focused-2 games/hop.mjs --native --foundry-only` exited 0, covering all six objectives, timeout/rematch, real exit/revisit, camera sweeps, terrain grip, translating ferry, vertical elevator, rotating rim/drop, buffered climbing and cold refresh. Earlier `hop5-focus-14` and `hop5-focus-15` default focused runs also exited 0, including real room/controller and phone/tablet paths. The latter added typed phone boss presentation and terrain-grip save/refresh/climb. Final full-run results follow below.

The broad native run hashes are in `pass5-proof/native-source-hashes.json`; the final profile probe and consecutive cmp proof hashes are in `pass5-proof/source-hashes.json`, beneath `tests/shots/games/hop/`. The final proof source adds a sign-font width guard and a camera early exit when the first angle is already fully clear. All three full cmp runs repeat the complete native functional flow on that final source. `cmp.sh` reports the real node exit separately from its own shell exit. Only a node exit 0 plus `HOP AFTER PASS` counts as a pass. Servers use disposable data, and only their own PID is stopped. The requested helper chooses its own disposable port; standalone servers use the owner-approved 18080–18099 range.

Development failures are preserved rather than counted as proof: focus 1–13 exited 1 while exposing the bridge join, tight spiral/headroom and jump-pilot braking, a missed airborne reward-capture state, a native-predicate closure error, overly strict landing assertions, missing run-ups, backflip staging, coin-route pickup heights, the accidental home-exit overlap and a late production wave input. Those were corrected. `hop5-final-focused` exited 1 because navigation stopped just outside the talk radius; the target now leaves a real interaction margin, without widening the game's affordance or retrying a lost press. Logs are `/tmp/cmp-hop5-{focus-1..15,final-focused,final-focused-2}.log`.

The first complete `--native` attempt exited 1 on the real new-door entry: the foundry palette was missing from the course-card table. The card palette is now present; the six-row card and its objective hints render through the real entrance. A second complete attempt was deliberately interrupted (130) before proof while correcting one kettle that intersected a vat. That kettle now stands on open floor, cancels its tell when the player leaves range, and the tea challenge gives a one-second safe start after dialogue. The final source hashes were re-recorded after those corrections, before the replacement native run and the three-run cmp sequence. These earlier attempts are not counted as passes.

A third native attempt was interrupted (130) to apply the existing boss-footer reservation to the foundry encounter. Hanging from the lid can now show its climb/drop prompt above the boss bar. `foundry-foreman-ledge-hud-native.png` captures that actual grip state. The source-hash file was refreshed after this final HUD change; subsequent full validation uses those hashes.

### Pass-5 frame measurements

320×240, DPR 1, update + draw/HUD + synchronous GPU readback, 60 warm-up + 120 samples per view, ANGLE/SwiftShader, house excluded. The shared machine's load varies, so these are measured software-renderer costs rather than hardware FPS promises or a controlled overall speedup. Baseline `pass5-before/performance.json` came from committed HEAD. Final `pass5-proof/final-performance.json` uses the same profiler on the final source; its fresh-file views are not identical progression states to the completed-campaign 19-view profile retained in `pass5-proof/native-performance.json`.

| View | Before median / p95 ms | Final median / p95 ms | Final update median / p95 ms |
| --- | --- | --- | --- |
| Hub | 28.7 / 70.5 | 15.3 / 30.7 | 0.4 / 0.7 |
| Tower | 18.4 / 49.8 | 9.1 / 11.0 | 0.6 / 0.8 |
| Finale arena | 17.1 / 40.4 | 7.6 / 10.4 | 0.3 / 0.5 |
| Troubleworks | — | 17.2 / 38.8 | 0.8 / 1.0 |
| Foreman fight | — | 13.0 / 17.4 | 1.4 / 1.8 |

The first 19-view profile exposed 8.1 / 16.6 ms median/p95 simulation cost in the foreman camera. It tested all candidate views even when the current one was fully clear. A fully clear first angle already beats every penalised alternate, so that case now exits early; blocked views retain the complete search. Final simulation cost in the same authored fight view is 1.4 / 1.8 ms. The final five-view profile probe exited 0 (`/tmp/cmp-hop5-final-profile.log`); its temporary script was removed. No post passes, blur or shadow maps were added.

The broad `node tests/games/hop.mjs http://localhost:18088 --native` run exited 0 (`/tmp/hop5-native-4.log`) before the final font-fitting and clear-camera early-exit guards. `hop5-final-sign --native --foundry-only` then exited 0 with the sign guard; the final full cmp sequence repeats every native gameplay assertion with both guards. The required smoke/mobile and consecutive-run results are recorded below.


### Final pass-5 release checks

| Command | Actual result |
| --- | --- |
| `node --check app/public/js/rm-g-hop.js` | Exit 0. |
| `node --check tests/games/hop.mjs` | Exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; zero authored rewrites. |
| `node tests/games/hop.mjs http://localhost:18088 --native` | Exit 0, full native campaign and 19 profile views; `/tmp/hop5-native-4.log`. The two final guards and exact source distinction are described above. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-final-sign games/hop.mjs --native --foundry-only` | Node exit 0; final font-fitting feature pass. Earlier default focused room/controller/phone runs also exited 0 as recorded above. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-proof-1 games/hop.mjs` | Node exit 0; complete native, production controller and real touch paths. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-proof-2 games/hop.mjs` | Node exit 0; second consecutive complete pass. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop5-proof-3 games/hop.mjs` | Node exit 0; third consecutive complete native/room/controller/phone pass. |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` (no URL) | Exit 0; 12/12 passed, including browser errors and server log; `/tmp/hop5-smoke.log`. |
| `node tests/mobile.mjs http://localhost:18089 --only=gate` | Exit 0; 1/1 gate passed across five device sizes in 61 seconds; `/tmp/hop5-mobile.log`. |

All three runs used the same frozen game/test hashes and end with `HOP AFTER PASS`; their actual node exits were separately checked as 0. Per-run inventory, released-button pulse, touch clearance and wave-jump traces are in `pass5-proof/run-{1,2,3}-*.json`. Released-before-step C pulses lasted 0.4 / 1.2 / 0.3 ms, all consumed with C already released. Actual phone C clearance was 1.835 / 1.747 / 2.498 metres, with rising velocity 5.3 / 5.9 / 1.1 m/s. All controller wave jumps were observed grounded in the safe radius window at distance 9 metres, avoiding polling-induced late dispatch without bypassing the move. All three disposable cmp server logs contain no module-load failures.

Final after PNGs were recaptured by the third frozen-source run. Earlier development-only PNGs, including failure captures and obsolete route samples, are preserved under `pass5-development/`. Earlier passes and their screenshots are untouched.

Reviewed fresh `tests/shots/mobile/gate-signup-galaxy-360x740.png`, `gate-signup-iphone-844x390.png` and `gate-logon-ipad-768x1024.png`, plus the final native stack-reward pose, foreman lid-grip HUD and real-touch foreman arena. Mobile server log has no module-load failures. The final source-hash comparison and `git diff --check` pass. No shared kit changed, so no other cartridge-specific kit test is required. No commit, deploy, version/changelog edit or live data access occurred.


## Pass 6 — ranked critique and implementation

1. **High: Cocoa Coaster had one line to master.** The Cocoa Express is a physical second tunnel, not an invisible wall trick or an instantaneous skip. Both mouths join the existing tube; overlapping convex tunnel cells are trimmed to produce a single enclosed fork. Gold lamps and a lettered sign mark the entrance. A nine-metre gap needs a committed hop at speed. A thick visible net catches a miss without health/life loss, holds the player in view, then uses the existing iris to return to the approach. The race clock and rival continue, so failure costs time. A clean line physically rejoins the lower bend and records a successful use without adding a seventh coaster reward.
2. **High: six main courses still lacked grounded terrain variety.** Sherbet Sandstorm adds rolling dunes and readable wind lanes, rather than another collection of isolated factory platforms. Bare sand carries the player with the wind; steering against it or hopping away remains possible. The nine-tier temple, open buried courtyard, three bell yards and five post hoops spread six objectives across the map. Its tune, scarab model and fixed-direction charge pattern are original.
3. **Medium, found by play: the first wind force was cancelled by the ordinary stop acceleration.** It is now part of the cartridge's desired ground velocity in this course only. The next run caught wind moving a player off a raised drum while lining up a pound. Raised solid platforms are now calm; only bare sand carries wind. Both fixes are checked through actual movement/pound inputs.
4. **Medium, found by the recovery replay: the driver pressed talk before the recovery iris finished.** The driver now waits for the transition state, without retrying the action or changing input duration. The successful branch race and missed-jump recovery both pass the camera/sightline checks. The slide's existing 140 ms hop buffer now also retains a press during the final 140 ms of its count-in.
5. **Remaining scope:** seven main courses remain eight below the reference. The shortcut adds route choice without changing acorn counts. The desert is an outdoor terrain course; it does not claim a temple interior or a new ending. Physical controllers, mobile GPU performance, listening and an unaided complete 66-acorn campaign remain unverified.

### Six Sandstorm rewards

| ID | Acorn / required route |
| --- | --- |
| `summit` | The Sherbet on Top — actual jumps up nine broad solid temple tiers. |
| `bells` | Three Bells Before Tea — pound three separated mint drums; their brass bells and saved turns show progress. |
| `post` | The Express Sand Post — start with the Cast postmaster, then traverse five marked hoops in order within 55 seconds. Timeout, rematch and paused clock are covered. |
| `parcel` | Return to Sender — find the stamped tea parcel in the northwest courtyard, press B beside it and physically return it to the postmaster. |
| `reds` | Eight Red Desert Stamps — search dunes, temple, courtyard and bell yards. |
| `c100` | A Hundred Sherbet Pennies — follow the ground coin routes and climb the temple for 100 real pickups. |

New `run.sands` fields retain bells/turn times, post phase/time/next hoop and parcel state. New coaster fields retain route, branch distance, successful use and net recovery time. Missing fields default to the main route, preserving existing coaster saves. No old reward, door index, threshold or world-seed index is moved. The eight thresholds in persistent order are **0 / 3 / 7 / 12 / 18 / 5 / 15 / 21**. The unchanged finale remains available at 18.

Before shots and native timing JSON: `tests/shots/games/hop/pass6-before/`. Final after captures: `tests/shots/games/hop/pass6-after/`; obsolete development captures: `tests/shots/games/hop/pass6-development/`. The baseline snow run and three-view profile exited 0 (`/tmp/cmp-hop6-before-2.log`); the first temporary probe exited 1 on a syntax error in its replacement branch, before opening a browser. Shortcut-only replay 1 exited 1 on the premature post-iris driver input; replay 2 exited 0. Feature run 1 exited 1 on cancelled wind, and run 2 exited 1 on wind interfering with the first drum. These are development findings, not final proof. Final validation and frame costs are recorded below.


The first complete native feature run exited 0 as `hop6-features-7`, after fixing a red coin inside an obelisk, flattening courtyard terrain to match its floor, applying the existing interior camera policy there and moving the third drum off the post route. Runs 3–6 exited 1 while exposing a driver route through a raised bell pad, that inaccessible coin, close courtyard camera framing and the moved drum obstructing the timed route. The production preflight follows on the final model/layout. Screenshot review also replaced the reused low tortoise with an original upright postmaster model, cap and satchel; its Cast name remains dynamic. The new hub entrance has extra space from the windmill crates; all seven prior doors retain their positions.

Compatibility is structural as well as numeric: new hub-door solids append after the original school, and the Express placard is a separate, noninteractive model above the clear head space, leaving every original coaster NPC untouched. That preserves suspended ledge support indices, typed dialogue indices and their callbacks. The full regression includes real HEAD coaster intro/descent saves and an actual paused HEAD school ledge, restored and climbed in the changed build. The crown door stays at 18; the mayor mentions it while also pointing toward the optional 21-acorn desert.


The default `--pass6-only` device preflight exited 0 (`/tmp/cmp-hop6-device-preflight.log`): native new routes, real 2.85 school-grip restoration/climb, standard-pad branch steering/gap hop and branch refresh, desert wind/drum/parcel and account refresh, then real phone touch/rotation/parcel refresh. No simultaneous browser was used. Review then changed the Express sign to an overhead placard reading HOP THE GAP: it no longer advertises a B interaction that a moving rider cannot use. Parcel pickup now has a contextual footer at the actual reach distance.

A final gap regression intentionally reproduced a real defect, node exit 1 (`/tmp/cmp-hop6-gap-regression-before.log`). The inherited `air <= 0` hop check treated a fall below the upper track as grounded: one released press changed hops **1 → 2**, with air **−0.172**, upward velocity **6.767**, and buffer consumed. Raw evidence is `pass6-proof/before-gap-falling-hop.json`. Eligibility and the rendered grounded state now compare against the actual route support floor; an unavailable press still retains 140 ms without manufacturing a midair hop. The branch/net now also participate in the floor query, preserving Bopper's readable depth shadow. Rope strands follow the sloped net and its bank rather than intersecting a flat grid.

The full native profile captures an Express snapshot during the real race, then samples that view with the same profiler. Fresh `--bench` skips the route-dependent Express view because it deliberately does not run gameplay; its other course profiles remain available. The first and repeat native source hashes are retained separately. The frozen proof build additionally has a small post-completion dialogue guard: after the post acorn, the guide points to the remaining parcel rather than offering an unavailable first-time round. Rendering, movement, input and save code match the repeat native build. Final consecutive runs use identical game/test hashes.


The corrected falling-hop trace retains hops **1 → 1**, air **−0.556**, downward velocity **−4.767**, buffer **0.123 s**, and `gnd: false` after the two observed frames. A clean scripted Express is physically **142.886 m** versus **163.855 m** along the bypassed main section. Native route records are `express-route.json` and `sands-post-route.json` under `pass6-after/`; the latter records a fully walked 24.9-second post round, including real ordered-hoop collision and a paused/cold-refresh stop. These are targeted route drivers, not an unaided first-time player claim.

Phone coverage includes the existing coaster steer/brake/hop/pause/refresh flow plus new desert wind, actual drum jump/pound, parcel pickup, portrait/landscape framing and exact parcel-state refresh. The complete Express gap route is exercised by native keys and the production standard-pad driver; a complete CDP thumb replay of that branch is not claimed. Physical-controller hardware, mobile-GPU timing and a listening session remain unavailable.


### Pass-6 frame cost and final proof

The first complete `node tests/games/hop.mjs http://localhost:18088 --native` exited 0, including all 21 profile views. Its new complete tunnel cost 32.6 / 66.5 ms median/p95 versus baseline 20.5 / 40.6, so the render path was improved before proof. The unchanged tunnel surfaces are now divided into 32-metre sections; sections wholly beyond the opaque fog are omitted. The enclosed stage uses its fog colour as the distant background, preventing a visible sky opening at the cull boundary. Both camera collision checks and rendering derive section visibility from the current player position; visibility is not saved or synced.

The repeat complete native command also exited 0, including the original practice/rival/coaster paths, every new objective, actual 2.85 saves, boss/ending and 21 profiles. Final native timings use the same 320×240 DPR-1 update + draw/HUD + synchronous GPU readback method, 60 warm-up + 120 samples. ANGLE/SwiftShader and other workers share the host; these are measured software costs, not a controlled overall speedup or hardware FPS promises. Old and new progression states differ. Raw baseline: `pass6-before/performance.json`; first full profile: `pass6-proof/pre-cull-native-performance.json`; repeat: `pass6-proof/native-performance.json`, under `tests/shots/games/hop/`.

| View | HEAD before median / p95 ms | Repeat native median / p95 ms | Calls / triangles |
| --- | --- | --- | --- |
| Hub | 27.9 / 57.7 | 25.6 / 45.3 | 59 / 52,893 |
| Coaster descent | 20.5 / 40.6 | 22.9 / 42.8 | 23 / 34,734 |
| Cocoa Express | — | 21.2 / 46.6 | 23 / 34,734 |
| Troubleworks | 30.6 / 61.4 | 25.1 / 36.3 | 48 / 48,793 |
| Sandstorm | — | 18.5 / 23.4 | 43 / 78,370 |

The pre-cull descent submitted 52,264 triangles; section culling submits 34,734 in this view with three additional draws. No blur, post pass, shadow map, graphics option or shared-kit change was added. A real clean main-route race took 21.1 seconds; the Express took 20.3 seconds with the same maximum speed. `native-express-route.json` preserves both times and actual route lengths. The shortcut gains distance, rather than teleporting the player or slowing its Cast rival.

Final `cmp.sh` proof uses `/tmp/cmp-hop6-proof-{1,2,3}.log`, with `source-hashes.json` checked before/after each run. A helper shell exit is insufficient: the real reported node exit and final `HOP AFTER PASS` are both checked. Inventory, released-button input, phone clearance, foreman wave jumps, Express controller input and route/post/falling-hop traces are copied to `pass6-proof/run-N-*.json`. Results are recorded below only after completion.

| Command | Actual result |
| --- | --- |
| `node --check app/public/js/rm-g-hop.js` | Exit 0. |
| `node --check tests/games/hop.mjs` | Exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; zero authored rewrites. |
| `node tests/games/hop.mjs http://localhost:18088 --native` | Exit 0 twice; first profile exposed cost, repeat verifies section culling and final frame samples. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop6-device-preflight games/hop.mjs --pass6-only` | Node exit 0; native routes, controller, production refresh and phone/tablet. Final repeated runs exercise the same helpers after the render-only cull and copy fixes. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop6-proof-1 games/hop.mjs` | Node exit 0; complete native campaign, controller and phone pass. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop6-proof-2 games/hop.mjs` | Node exit 0; second consecutive complete native/controller/phone pass. |
| `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-hop hop6-proof-3 games/hop.mjs` | Node exit 0; third consecutive complete native/controller/phone pass, identical frozen source hashes. |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` (no URL) | Exit 0; 12/12 including browser errors and server log; `/tmp/hop6-smoke.log`. |
| `node tests/mobile.mjs http://localhost:18089 --only=gate` | Exit 0; 1/1 gate across five sizes in 62 seconds; `/tmp/hop6-mobile.log`. |

Run 1 ended with actual node exit 0 and `HOP AFTER PASS`; its server has zero module-load failures. The released C pulse lasted 0.3 ms and was consumed with the button already released. Phone C arrived airborne/rising at 1.540 m clearance and +7.1 m/s. Its production Express hop was observed on the floor at branch distance 24.591 m, 3.409 m before the lip, speed 26; branch pause was at 8.124 m and restored exactly. Per-run JSON is retained rather than treating helper shell success as proof.

All three frozen-source runs ended with actual node exit 0 and `HOP AFTER PASS`; each server log has zero module-load failures. Released C pulses lasted 0.3 / 0.2 / 0.3 ms and were consumed after release, entering pound. Phone C arrived rising at 1.540 / 2.145 / 1.747 m clearance. Each production Express route steered into the branch, paused/restored it exactly and hopped the real gap at speed 26. Final after PNGs come from the third run; obsolete prototype/failure PNGs are retained separately in `pass6-development/`.

Next valuable chunk: an eighth full main course built around tree-canopy traversal and return routes, followed by additional authored mansion/temple room puzzles. Keep the six-objective course bar, readable camera/shadows and real-input refresh proof; do not count unfinished interiors as delivered content. Physical-controller hardware, mobile GPU frame timing, listening, a complete CDP-thumb Express branch race and an unaided full 66-acorn campaign are NOT VERIFIED.

Final mobile gate captures reviewed: `tests/shots/mobile/gate-signup-galaxy-360x740.png`, `gate-signup-iphone-844x390.png` and `gate-logon-ipad-768x1024.png`. They are fresh captures from this run. Also reviewed the final native Express gap/net, Sandstorm postmaster and portrait/landscape phone course shots. The mobile server has zero module-load failures and its owned process exited via the queue cleanup. Full command/result metadata is `pass6-proof/validation-results.json`; all three frozen-source hashes were rechecked after the gates. No commit, deploy, version/changelog edit, shared-kit change or live data access occurred; the pre-existing untracked voice directory is untouched.

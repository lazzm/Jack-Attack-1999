# Bounce Quest 64 — scope and depth review

Starting point: main 2.77.0, worktree `hop`. This is a focused depth pass on the original Ultra 64 cartridge. Original procedural models, textures, level layouts, compositions and sound effects only. Native rendering remains 320×240 with filtered low-resolution textures, vertex-lit forms and distance fog; no screen blur, post-processing blur or graphics menu.

## Scope against the 1996 genre reference

The reference manual describes fifteen main courses, extra miniature courses, acrobatic jumps, adjustable camera distance and special caps ([official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_8/Manual_Nintendo64_SuperMario64_EN.pdf)). The full collectible target is 120 ([official game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Super-Mario-64-269745.html)). These are depth targets, not a claim of commercial-scale completeness.

| Feature/content | Original has | Before | This pass / remaining gap |
| --- | --- | --- | --- |
| Overall progression | Fifteen main courses, miniature courses, 120 rewards | Island hub, four six-acorn worlds, final arena; 33 acorns | Four seven-acorn worlds, hub and final arena; 37 acorns. The full campaign-volume gap remains high priority. Original door thresholds and all old IDs/saves survive. |
| Hub | A place to explore, learn movement, discover secrets and reach courses | Eight acorns across lighthouse, hill, windmill, tree, pond, sea rocks, pier and enemy hunt | Same routes with repaired jump chaining, clearer slope shadows and reliable camera; a dedicated optional movement lesson remains absent. |
| Beach | Exploration, vertical routes, distinctive challenges | Sandcastle, mast/chest, wall-kick chimney, clam, offshore rocks, crabs, red/100 coins | Adds Bell Buoy Dash: switch, countdown, ordered offshore hoops, time limit, retry and saved best. Swimming/diving and underwater exploration are still absent. |
| Snow | Climbing, slippery ground, slides and a rival | Terraced mountain, penguin race, igloo plug, berg long jump, snowball throwers | Adds Flapjack Post Run: five downhill delivery hoops and saved best. Existing race remains separate. A dedicated enclosed slide/interior is still absent. |
| Haunted world | Exploration, ghosts, puzzles and a boss | Exterior mansion/roof, maze, lanterns, shy ghosts, Big Boohoo | Adds Butler Bell Blues: four physical chimes and three increasingly long call-and-response tunes; wrong input repeats the current tune. A playable mansion interior remains absent. |
| Clockwork world | Moving platforms, timing, route mastery | Gears, cable car, lifts, clock arms, conveyor, wall-kick shortcut and summit | Adds Clock Out Before Tea: base switch, temporary slow clockwork, four climbing hoops, deadline and best time. No alternate complete tower layout yet. |
| Moves | Precise variable-height jumps, chaining, long/back/side jumps, wall kicks, attacks | Broad moveset, but repeated grounded landing reset the jump-chain window | Genuine touchdown events, 380 ms chain window, 100 ms ledge grace, 140 ms landing buffer, early wall-contact detection, wall-kick separation and crouch momentum memory. Side-flip, ledge grab, swimming and free flight remain absent. |
| Camera | Player-controlled camera with scene-sensitive framing | Eight-point obstruction sampling; camera smoothed through walls; auto-follow turned steering axes | Continuous oriented-box/cylinder boom tests, decorative geometry rays, terrain clearance, immediate retraction, damped extension, close-quarters overhead pitch, stable lateral steering and manual 45° turns. Reward framing checks sixteen possible angles. Flatter and overhead alternatives preserve useful distance beside ceilings and posts. |
| Rewards | Strong, readable victory pause and fanfare | Fanfare/pose, but sandcastle flagpole hid the hero | Safe reward-camera angle, forward-facing final pose, retained original music and short spin. The player can continue exploring without a level reset. |
| Bosses/ending | Multiple milestone fights and an ending | Big Boohoo plus King Grumpus; Crown Acorn and scrolling credits | Existing encounters retained; full fight, shockwave/dizzy state, dialogue and credits can be suspended. Additional milestone bosses remain a content gap. |
| Replay/secrets | Optional rewards and mastery routes | 100-coin/red-coin tasks, big-head cheat, local scores and secrets | Three timed trial bests and a memory puzzle; Cast-based seeded score rows and credit play testers. No cap-unlock ladder or substantial postgame yet. |
| Saving | Persistent course rewards and progression | Acorns/lives and a coarse coordinate; boss and live course state discarded | Separate suspension retains player/camera, health, velocities, jump chain, pause, world clock, movers, coins, enemies, puzzles, trial phases, boss, dialogue, rewards, transitions and credits. Legacy v2 progress remains compatible. Texture randomness is independent from reproducible world generation, and the patrol random stream is checkpointed. |
| Controls/devices | Controller-focused console play | Shared keyboard, standard pad and phone controller | Same shared actions, game-local radial deadzone and normalized movement. Arrows run; Z jump; X punch/talk/chime; C crouch/pound; U/E camera; Enter pause. Q/T/Esc remain house controls. |

## Ranked baseline critique and fixes

1. **High: the camera could become the obstacle.** Eight samples missed thin/rotated geometry; cartesian smoothing could pass through a wall after a valid target had been chosen. Lateral running could cause automatic camera rotation, changing steering under the held direction. Replaced the boom solver, constrained the actual camera before rendering, limited automatic rotation to forward travel, and added overhead framing when the wall is too close for a normal boom.
2. **High: the advertised triple jump was practically a one-frame trick.** `land()` ran on every grounded tick and erased `chain` on the tick after landing. Punch and pound recovery were also reset. Landing now means a real air-to-ground transition. Delayed double/triple jumps, crouch-to-long-jump, coyote and buffered landing jumps are regression cases.
3. **High: ordinary hub/beach enemies had invalid heights.** Enemy construction indexed a scalar floor height as an array, leaving Grumpies and Snippers invisible/inactive and the hub enemy-hunt acorn unreachable. Heights are finite now; real punches, damage and enemy-drop coin budgets are tested. Exact-centre box/cylinder overlaps also get a definite escape direction.
4. **High: refresh erased the run.** Health, coins, enemy defeats, moving-platform phase, open chest/plug, boss, dialogue, pause and reward presentation were missing. Added a compact suspension record while preserving legacy progress and independently retained title presentation. Cold-cache layout comparisons cover previously visited worlds; texture generation no longer consumes the world random stream.
5. **Medium: the star-get moment hid the star of the game.** The sandcastle's flagpole stood between camera and hero. Reward framing evaluates clear angles and checks the interpolated view; the finished pose looks toward the viewer.
6. **Medium: too much repetition within four worlds.** Half of many course goals were coin collection/enemy clearing. Added a platforming delivery, downhill route, musical memory puzzle and timed slow-clock climb, with distinct physical controls and feedback. Four courses are still far below the full reference's volume.
7. **Medium: white beach/snow surfaces lost form.** Reduced overbright course lights; strengthened and slope-aligned the player's contact shadow. The model now flashes warm on damage instead of disappearing.
8. **Medium: authored identities ignored the account Cast.** Seeded records, new signatures, course guides, the penguin rival, their dialogue/race labels and credits now resolve Cast roles. Original model/save IDs and existing player-written high-score strings are preserved. A real guide conversation and its suspended dialogue are regression cases.

The retained HEAD baseline reproduces three ordinary `jump` states from delayed chaining, a `back` flip after a seven-frame running crouch, and 0.851 radians (48.8°) of unwanted camera rotation while holding sideways. The final regression requires the actual jump/double/triple chain, a long jump with that same crouch delay, and less than 0.01 radians of camera rotation on the strafe. See `before/movement.json`, `before/jump-attempt-*.png`, `after/jump3-rise.png`, `before/crouch-jump-grace.png`, `after/long-jump-rise.png`, `before/camera-strafe.png` and `after/stable-strafe.png`.

## Save design

Existing `v2`, `got`, `ac`, `score`, `lives`, `opt`, `hs`, `boss`, `w`, `p` and `door` stay readable. `records` adds timed-course bests. `run.v=1` is a serializable suspension, separate from title-menu `ui`; returning to title or watching attract mode cannot overwrite the live run with title scenery. No meshes, callbacks, materials or renderer objects are serialized. Transient particle bursts and already sounding audio tails are presentation only and are not serialized. World geometry is reproducible from its own seed; texture painters use independent per-texture seeds so a warm cache cannot move scenery. The world random-stream position is saved for patrol continuation. Transition operations and dialogue completion are reconstructed by world/state. Native simulation time, rather than the host's wall clock, drives moving platforms; tower trial slowdown has a separately saved motion clock.

File A is written periodically, on relevant input, pause, collection, puzzle changes and page lifecycle events. Lifecycle listeners are removed when the cartridge closes. The regression checks the record remains below the 20 KB roaming limit. Existing score submission still uses the shared server-held scoring window; no shared economy or account code changes.

## Reproducible review and evidence

`node tests/games/hop.mjs http://localhost:PORT` requires a disposable localhost server. Files resolve relative to the test's own folder. `--native`, `--room-only`, `--before`, `--bench`, `--feel-only`, `--trials-only` and `--boss-only` support focused review. `--before` loads the committed HEAD cartridge. Only one browser is open at a time; native, authenticated house and touch fixtures run sequentially.

`tests/shots/games/hop/before/` and `after/` hold 1366×860 and native 320×240 captures. These include title, attract, menu, course cards/starts/midpoints, pickups, short jump/reward sequences, pause, camera angles, puzzles, boss/ending and physical-telly/device views. Scripted keys genuinely walk from the hub through the Cove and Peaks doors; pickups use collision. Branch tests stage the player at encounters, then use real movement, jump, punch and pound input. Staging does not award acorns or damage bosses. This is targeted regression coverage, not a claim of an unaided complete campaign run.

### Visual review

The scorecard uses the skill's three calibration images as anchors and the complete game/phone capture set. This remains a period 320×240 cartridge, not a modern showcase renderer. Scores are deliberately below the skill's 2.3 average premium threshold.

| Category | Before → after | Evidence |
| --- | --- | --- |
| Art direction | 2 → 2 | Cohesive biscuit island, beach, snow, gingerbread and brass-clock themes. |
| Hero | 2 → 2.25 | Original cap/boots/rucksack silhouette; working chained poses, landing compression and visible damage flash. |
| Obstacles/enemies | 1 → 2 | Grounded enemies work; bells have solid frames, hangers, bodies and readable note counts. |
| Rewards | 2 → 2.5 | Clear reward framing, late victory pose, original fanfare, personal-best readout. |
| World | 2 → 2 | Existing layered landscapes plus four physical trial layouts; campaign volume remains small. |
| Materials | 2 → 2 | Low-resolution original textures and vertex-colour roles; stable per-texture noise. |
| Lighting | 1.5 → 2 | Beach/snow retain surface detail; slope-aligned player shadow; manor deliberately uses a darker value range. |
| VFX/motion | 1.5 → 2.5 | Reliable triple/long/wall jumps, dust, squash, ringing bell pivots and proportional impact shake. |
| UI/HUD | 1.5 → 2.25 | Native objective cards, trial timers/records and Cast-based records; actual phone controls and rotation captured. |
| Performance evidence | 1 → 2.5 | Native GPU-readback timings, update costs, draw/resource counts and scene pixel diagnostics. |

Average: 1.65 → 2.2. The manor spawn's intentionally dark palette has lower measured luminance contrast; this pass does not claim cinematic lighting or full commercial art/content volume.

The game test's local canvas diagnostics inspect the native scene before HUD composition: 4-bit RGB histogram entropy/dominance, horizontal neighbour luminance edges above 20, and the 95th–5th percentile luminance range. They accompany renderer resource counts in the timing JSON; these are described measurements, not a claim that an external inspector package was executed. Reviewed reward poses, tower obstruction angles, front/side/back bells and switch models, physical-telly captures, phone portrait/landscape and tablet gameplay. `node tests/mobile.mjs http://localhost:18088 --only=gate` passed all five account-gate profiles (49 seconds); reviewed the phone/tablet captures in `tests/shots/mobile/`. The full mobile story/performance suite was not run; cartridge touch coverage is in the game test.

### Verification log

Final cartridge syntax, test syntax, whitespace checks and `node --expose-internals tests/parody-audit.cjs` pass; the audit reports zero authored spans in zero files. No shared kit changed. The final `node tests/games/hop.mjs http://localhost:18088 --native` passes, including two genuinely entered courses, real collision pickups, all four new challenges, both boss encounters, pause/continue and cold-cache suspension comparisons. The combined `FIXTURE_RASTER_RATIO=0.45 node tests/games/hop.mjs http://localhost:18088` authenticated-room, injected standard-gamepad and actual CDP touch regression also passed. The final `FIXTURE_RASTER_RATIO=0.35 node tests/games/hop.mjs http://localhost:18088 --room-only` rerun passed physical case/telly, keyboard, injected pad, real production refresh/results without duplicate score submission, phone touch, rotation and tablet framing, with no server module failures. That rerun and the smoke checks preceded the final Cast-only NPC naming cleanup; the final native regression includes that cleanup. The baseline was regenerated with `FIXTURE_RASTER_RATIO=0.35 node /opt/stacks/landing-hop/tests/games/hop.mjs http://localhost:18088 --before`, launched from `/tmp`, and passed its native flow plus physical case/telly and LOCK IN checks.

Back-to-back `--before --bench` and `--bench` runs both passed. Each scene uses 60 warmup and 120 measured frames, native 320×240, DPR 1, SwiftShader, update + draw + synchronous GPU readback; no house, post passes or shadow maps. Exact resource/pixel counters are in `before/paired-performance.json` and `after/paired-performance.json`.

| World | Before median / p95 ms | After median / p95 ms |
| --- | --- | --- |
| Hub | 9.3 / 10.7 | 10.1 / 12.7 |
| Cove | 10.9 / 12.8 | 11.9 / 13.7 |
| Peaks | 11.4 / 13.2 | 12.4 / 14.1 |
| Manor | 9.9 / 11.9 | 10.9 / 12.7 |
| Tower | 7.0 / 8.9 | 6.6 / 7.4 |
| Boss | 5.5 / 6.4 | 5.5 / 6.0 |

The continuous camera and active enemies/new challenges add about 0.8–1.0 ms to the larger course medians in this pair. In the paired run, update p95 remained at or below 1.4 ms; maximum draw calls 43, triangles 48,274, geometries 44, textures 33. Host contention varied considerably during the run; an earlier contended capture is retained in `after/contended-performance.json`. The last full native run after Cast cleanup passed but measured higher median/p95 values: hub 15.8/20.3, Cove 17.1/22.8, Peaks 17.9/23.9, manor 15.5/19.9, tower 9.0/12.3 and boss 8.3/13.9 ms (`after/performance.json`, update p95 at most 2.0 ms). The paired samples are useful for relative cost, and the final contended samples prevent reading them as a guaranteed frame rate.

Useful visual comparisons under `tests/shots/games/hop/`: `before/` versus `after/` for `title.png`, `hub-start.png`, `cove-start.png`, `peaks-start.png`, `manor-start.png`, `tower-start.png`, `boss-start.png` and `sandcastle-pose-native.png`. Final-only evidence includes `after/camera-tower-3-0-4-native.png`, `after/model-bell-{front,side,back}.png`, `after/model-switch-{front,side,back}.png`, the four trial reward sequences, `after/in-room-play.png`, `after/phone-touch-{portrait,landscape}.png` and `after/tablet-touch-game.png`. Native reward frames are deliberately copied immediately after drawing, before WebGL can discard its buffer.

The required uncapped `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` failed (exit 1): three of eleven checks passed before the 1,200-second watchdog. Signup, account-house and walk-refresh passed; PC controls and subsequent room fixtures timed out, with very few house frames on SwiftShader. These failures happened before this cartridge was selected. The separate diagnostic `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 FIXTURE_RASTER_RATIO=0.35 node smoke.mjs` passed all 12 checks (exit 0), including browser errors and server log. The existing fixture cap changes house raster cost, retaining CSS layout and input coordinates; the cartridge remains native 320×240. This does not turn the required uncapped run green.

Limits: no physical gamepad, real mobile GPU, audio listening session or unaided 37-acorn campaign marathon was performed. Native timing excludes the house and includes synchronous GPU readback; it is a repeatable software-renderer workload, not hardware FPS. Branch encounters use explicitly staged positions, including the final boss and tower-trial gate approaches; a natural full timed tower ascent and a natural eighteen-acorn unlock route are not verified. The game still has four main courses, no swimming/interior courses/power-up progression, and a deliberately modest visual scorecard. Camera coverage is extensive but cannot prove every arbitrary obstruction configuration. Already-sounding audio tails and cosmetic particles restart across suspension. The manor miniboss resumes the course soundtrack after pause/refresh; matching that encounter's ongoing music is a follow-up.

## Next chunk

Build more complete, distinct courses before describing the game as reference-scale: an underwater custard grotto with swimming/diving, a proper snow slide/interior, an explorable haunted mansion, and additional milestone encounters. Add an original power-up progression (gliding, weight and phase puzzles), side-flip/ledge-grab traversal and a hub movement school. Keep the current acorn/save IDs, all old thresholds and the suspension regression intact. Further courses should introduce mechanics and authored routes rather than increase the count with repeated coin rings.

# Warp Wombat — campaign expansion and review

This is a substantial campaign pass, **not full reference-depth completion**. All artwork, geometry, music, stage layouts and gameplay code are original. Existing `rm.ps.run`, `L0`–`L4`, `B0`/`B1`, achievements and records are retained. The cartridge also owns its virtual controller and its scoped styles. No shared runtime, account data or deployment files are changed.

## Scope against the late-1990s corridor-platformer target

The reference column describes the requested warp-room-era target. Relic trials combine the later disc's period mechanics with the corridor/warp-room structure; they are not a claim that every earlier disc had every feature. The publisher's [manual](https://support.activision.com/servlet/servlet.FileDownload?file=00P0B0000166KeeUAE&retURL=%2Fapex%2Fmanuals) documents warp rooms, bonus paths, gems and time trials. No assets, layouts, code, dialogue or music were taken from it.

| Feature/content | Original target has | Before this run | Current implementation (after run 2) |
| --- | --- | --- | --- |
| Main progression | 25 main stages, five warp rooms and five boss encounters | Five stages, one room, two bosses | **20 authored stages, four five-door rooms, four bosses**; the ending now follows the room-4 final boss; post-ending replay |
| Travel/camera | Into-screen corridors, toward-camera chases and side sections | Into-screen corridors and one boulder chase | Corridor, four toward-camera chases (boulder, snowball, animal stampede, a giant rolling scone), four side-on main courses, side-on challenges |
| Movement | Responsive steering, variable jump, spin and further movement abilities | Jump/spin, coyote time and jump buffer | Longer variable jump, normalized diagonal movement, spin without a speed penalty, aerial belly flop with stack/area damage; no slide/crouch/crawl yet |
| Crates | Plain, mystery, bounce, spring, metal, explosive, green hazard, checkpoint, lives, mask, switch and clock varieties | Most base varieties; no remote disarm or clock boxes | All listed varieties; simulation-clock explosion chains, visible end switches and two-second trial boxes |
| Mask/lives/fruit | Three-mask invincibility; accumulating fruit and lives | A single mask per stage made three-mask power unreachable | Three masks per main course, global fruit counter, 100-fruit lives; trial fruit does not consume campaign fruit |
| Optional paths | Bonus rounds, death routes, coloured-gem gates and secret entrances | None | **Nine routes**: two bonus rounds, three death routes, four colour gates; all **five coloured gems** (red, blue, green, yellow, purple) with Adventure Book hints |
| All-crate gems | Crate completion includes bonus rounds; green crates have a safe clear path | Base gems, with hazardous green crates; no bonus rounds | 15 main gems; bonus crates count; all green crates disarm at the end switch; chase destruction is credited |
| Relics/records | Sapphire/gold/platinum targets, clock crates and best times | Five trial courses without clock boxes | 15 courses, clock freezes, best adjusted times, three relic grades; trial death restarts the attempt without charging a life |
| Boss variety | Five distinct attack/punish patterns | Charge/stun and flying-pod fights | Charge/stun, targeted flying pod, Admiral Waddle's hops/radial waves/spin window, and the **Dingotron 9000** walker: stomp shock rings, a telegraphed full-circle ankle laser to jump, a mortar volley, then a kneeling cool-down where you bounce on the dome |
| Menus/attract | Title, demo, options, instructions, records and collection status | Title/demo/options/instructions/scores | Revised four-page instructions, cast-only records and four-page Adventure Book; collection hints |
| Persistence | Campaign records; this game's requirement also demands exact refresh recovery | Hub milestones only; zero lives became four on load | Exact menu, hub, jump, checkpoint, fuse, route parent, boss/projectile/wave, result, credits and pause state; zero lives and a pending final death survive; compact saves designed for the existing roaming limit |
| Environments | Jungle, river, ruins, snow, factory, castle/night, dark stages | Jungle, river, temple, chase, snow | Those plus factory dusk and a new **night castle** set (cobbles, curtain walls with merlons, torches, banners, towers, moat water), a **lights-out** stage where each tiki mask pushes the darkness back, an original castle march and the **Lab Rat** enemy |
| Presentation | Solid low-poly models, legible native raster, effects, distinct environments | Brown pointed-ear hero, washed-out hub, small signs | Rounded ears, rust-orange fur, articulated hands, stronger hub palette, solid signs, clear side camera, factory dusk, particles and new original boss |
| Platforms/vehicles | Broader ride/vehicle/underwater variety across the era's discs | Moving platforms, logs, lilies and ice | Those retained; no new riding, swimming, jet-pack or vehicle mode in this pass |
| Touch devices | Intentional phone/tablet play is an owner requirement | No cartridge touch input | Cartridge-owned two-thumb controller, contextual menu labels, room shoulders, pointer cancellation and portrait/landscape LOCK IN margins; desktop controls unchanged |
| Completion reward | Secret completion ending/unlocks | Basic ending | Normal ending, all-gem/relic/colour ending text and post-ending replay; no new playable character or earned movement unlocks yet |

## Harsh baseline critique, ranked

1. **High — depth:** five short stages and two bosses were far below the requested full campaign. This pass triples stage count, adds a complete middle chapter and adds optional replay goals. Ten main stages, two bosses and the remaining reference breadth still belong in the next content runs.
2. **High — persistence:** refresh discarded the current course, checkpoint and hazards. Exact snapshots now include parent challenges and active boss attacks; wall-clock explosion timers were removed.
3. **High — collectible logic:** a typical course could never supply three masks; green-crate destruction lacked an intentional safe route; a rolling hazard silently removed crates without credit. All three are corrected.
4. **Medium — camera and feel:** the old jump had a tight maximum span. The first new side camera was obscured by foreground trees. Jump reach, diagonal speed, spin momentum, side visibility, reversible foreground pickup/crate hiding and forgiving arch exits were revised after continuous keyboard play.
5. **Medium — identity/parody:** fixed real-person score names and reference-identical stage titles were authored into the game. All table identities now come from `Cast.me()` and `mate1`–`mate4`/`sister`; renamed titles preserve their internal IDs. The repository parody audit reports zero authored replacements.
6. **Medium — presentation:** pointed ears read as a cat, tiny arms disappeared into the body, the hub was pale and signs were flat planes. The model, hands, colours and solid sign geometry were revised and inspected from front, rear, low and side views.

Additional adversarial checks fixed challenge retries losing their parent, one-frame attack/contact ordering, and falling boss crates detonating above the player before contact. Model review corrected intersecting chest panels; moving enemies now begin at their actual patrol positions. The final capture pass also separates the end-floor extension from authored tiles to remove coincident surfaces. Route pads have solid tops and clear shore positions; successful exits commit earned fruit, lives and masks while abandoned attempts grant nothing. Legacy numeric hub indices migrate once, and old ending saves continue in an unlocked chapter without losing their earned records. Mate labels use full cast names so the owner’s similarly named mate keeps the distinguishing suffix.

No high/medium correctness defect was observed in the tested flows. Full-course relic balancing and exhaustive interruption coverage remain unverified. **Content completeness remains a high-priority scope gap**, not a claim of parity or an item concealed by the current stage count. A further art pass could add more distinct canopy silhouettes, hub architecture per chapter, character idle gags and richer original percussion.

## Stage and secret inventory

Room 1, The Lost Lunchbox: Jungle Jumble, Rapid River, Temple Tumble, Canopy Catastrophe, Splash for Cash; Sir Snortalot.

Room 2, The Big Chill: Boulder Bolt, Snow Joke, Frostbite Fright, Snowball Effect, Ruin Your Dinner; Admiral Waddle.

Room 3, Dingo Industries: Boiler Room Boogie, Packing a Punch, Overtime Slime, Stampede Indeed, Last Orders; Doctor Dingo.

Lunchbox Bonus and Cold Lunch Bonus have free retries. No Second Helpings and The Last Crumb require a clean approach and yield red/green gems. Red Sky at Snacktime requires red and yields blue. Blue Plate Special and The Emergency Biscuit use blue/green. Challenge failures restore their parent course; abandoned bonuses cannot mint wallet fruit/lives or crate totals.

## Reproduce and review

`node tests/games/run.mjs` owns a disposable server on a free port in 18080–18099 (preferring 18088) and a unique `/tmp/jhp-run-*` data directory. It uses the production renderer and game logic at 320×240, actual browser key edges and separate desktop/touch real-room integration. The room tests take the physical case off the shelf, place/open it, remove the disc, and insert it into the console before testing refresh; they do not rely on direct game loading. It records viewport/native pairs under `tests/shots/games/run/after/`. `--native`, `--room-only`, `--room-only --touch`, `--flows`, `--bosses`, `--legacy`, `--art`, `--pilot`, and `--benchmark` select focused passes. `--baseline` uses the original script copied to `/tmp/warp-wombat-before/rm-g-run.js` (or `RUN_BASELINE`), with the current Git HEAD as a fallback when that snapshot is unavailable. `RUN_PORT` selects a specific port in 18080–18099.

The scripted campaign checks use debug placement at branch entrances and level exits to bound duration. They verify locks, state changes and every chapter's tally/credits flow; **they do not constitute an unassisted 15-stage completion**. Arena fixtures also earn every boss hit through real jump/spin input and the production collision code, using bounded dodge/approach placements rather than forced health changes. The separate keyboard pilot completes the opening and side-on courses using only observed geometry and real movement/jump/spin keys, with no debug wins or invulnerability. Native PNG export forces a fresh WebGL draw before readback and rejects an effectively black capture; the initial cleared-buffer export bug was fixed and the art captures regenerated. Some failed review runs are retained as diagnostic captures; final successful runs overwrite the named review shots.

Before/after review pairs: `before/title.png` ↔ `after/title.png`, `before/model-0.png` ↔ `after/model-0.png`, `before/hub.png` ↔ `after/hub.png`. New evidence includes `level-5-start.png`, `level-10-start.png`, `belly-flop-stack.png`, `red-gem-path.png`, `boss-wave.png`, `refresh-boss-wave.png`, `relic-results.png`, `credits.png`, `in-room.png`, `lock-in.png`, `touch-walk-jump.png`, `touch-portrait-paused.png` and `touch-landscape.png` in the `after/` directory.

Performance measurements are native update/draw plus a synchronized one-pixel GPU readback on Chromium SwiftShader, excluding house rendering. `rafMs` also samples displayed native frames using requestAnimationFrame. The final benchmark uses fresh pages, so old-world allocation/compilation from the exhaustive art pass does not contaminate the comparison. A fresh matched benchmark is recorded in each `performance.json`; these are software-render diagnostics, not hardware FPS promises. The final display sample discards 20 warm-up frames and then measures 90 intervals.

## Run 2 (castle chapter)

Added room 4, CASTLE CUSTARD: Moat a Problem (castle moat corridor), Battlement Boogaloo (side-on ramparts), Rolling Scones (scone chase), Lights Out Larder (dark stage; masks widen the light) and Tower of Flour; the Dingotron 9000 final boss; Custard Cream Crawl (death route, yellow gem) and Jammy Dodger Dungeon (needs yellow, gives purple). Doctor Dingo's room-3 defeat now says he fled to the castle and points to the lift; the credits follow the Dingotron. Save keys L15–L19/B3 are new; **disc version 3** moves stored challenge-route keys from 15+ to 20+ (and any saved in-route snapshot), tested by the legacy pass. Review shots: `after/level-15..19-start/mid.png`, `boss-3-aim.png`, `boss-3-beam.png`, `boss-3-kneel.png`, `refresh-boss-3-beam.png`, `boss-3-combat-clear.png`, `model-rat-*.png`, `model-scone-*.png`, `model-mech-*.png`, `adventure-book-3/4.png`, `credits.png`.

Boss fairness: the walker keeps 3.6 m away while stomping, stomps every 1.6 s (minus 0.1 per hit), rings travel 4.2 m/s and the laser starts behind the player with a 0.9 s harmless flicker. `bossCombat` now beats it with real jump inputs over every ring and laser pass (placement only to choose a clear standing spot). Run-2 critique, fixed in the pass: the kneeling walker sank its legs through the roof (now sits with legs forward); the arena centre was a flat purple puddle (now a stone emblem); the new route pad in Tower of Flour sat on a high-mango row (moved to a clear row); the scone read as a plain bun (cream and jam layers added). Remaining low items: the Dingotron arena's purple centre disc is plain; the Lab Rat reads small at corridor distance; Rolling Scones reuses the chase tune.

## Next chunk

Build room 5 with five genuinely distinct longer courses and the true final encounter (for example a rooftop/airship or volcano set), plus a new Dingo sidekick boss for room 4/5 so all five boss slots are distinct. Add secret-room entrances (a hidden warp-room door), ride/swim/vehicle mechanics and earned movement abilities. Extend the successful real-input pilot to every main course and all optional routes, tune platinum targets from clean human-like runs, and add a richer completion reward. Keep this scope table and the save migration additive; do not present reskinned copies as the missing content.


## Final verification

Before: five courses, two bosses, hub-only saves and unreachable three-mask power. After: 15 courses, three bosses, seven optional routes, exact cartridge recovery, functioning collectible/relic loops and an owned touch controller. The remaining reference-depth gap is explicit in the scope table.

The final combined `node tests/games/run.mjs` passed the production-renderer captures, all crate types and first-course crate gem, seven route gates/exits and reward transfer, three real boss-damage flows, two full keyboard courses, legacy migrations and final-death reload, then desktop and touch physical-disc/room/LOCK IN/gamepad/refresh flows. The two keyboard runs finished in about 32 and 39 seconds, with one and three deaths respectively; the test does not use invulnerability.

| Exact command | Result |
| --- | --- |
| `node --check app/public/js/rm-g-run.js` | exit 0 |
| `node --check tests/games/run.mjs` | exit 0 |
| `node tests/games/run.mjs` | exit 0 |
| `node tests/games/run.mjs --native --flows` | exit 0 |
| `node tests/games/run.mjs --native --legacy` | exit 0 |
| `node tests/games/run.mjs --native --benchmark --baseline` | exit 0 |
| `node tests/games/run.mjs --native --benchmark` | exit 0 |
| `node --expose-internals tests/parody-audit.cjs` | exit 0; zero authored replacements |
| `node tests/smoke.mjs` | exit 0; 12/12 checks |

An earlier overlapping smoke run had one house-refresh readiness timeout (11/12); isolated full reruns passed. All test data was disposable localhost data, and no server log reported a failed module load. No live deployment, Docker operation, version/change-log edit, commit or push was performed.

Matched native software-render measurements (320×240, SwiftShader; shared-host load is recorded in each JSON):

| Measurement | Before | After |
| --- | ---: | ---: |
| Update/render + readback median | 10.70 ms | 7.50 ms |
| Update/render + readback p95 | 21.50 ms | 8.10 ms |
| Displayed interval median | 16.70 ms | 16.70 ms |
| Displayed interval p95 | 33.40 ms | 33.40 ms |
| Submitted triangles | 26,310 | 19,122 |
| Draw calls | 36 | 46 |

Render cost improved in the matched sample, with a roughly 27% reduction in submitted triangles. Display pacing still has occasional 33 ms intervals on this software/shared-host setup; these measurements do not promise a fixed hardware frame rate.

Not verified: an unassisted full 15-stage/all-secret run; every relic target’s human difficulty; all interruption permutations; physical phones, tablets and controllers; listening to the audio on real speakers. Real touch events were exercised through Chromium device emulation, and standard gamepad polling through a controlled virtual pad.

## Run 2 verification (2026-10-27)

| Exact command | Result |
| --- | --- |
| `node --check app/public/js/rm-g-run.js` / `node --check tests/games/run.mjs` | exit 0 |
| `node tests/games/run.mjs` (20 stages, 9 routes, 4 rooms, credits after the Dingotron, v2→v3 save migration, desktop + touch room flows) | exit 0 |
| `node tests/games/run.mjs --native --bosses` (all four bosses with earned hits, no deaths) | exit 0 |
| `node --expose-internals tests/parody-audit.cjs` | 0 rewrites |
| `node tests/smoke.mjs` | exit 0, 12/12 |

Not verified in run 2: an unassisted human play of the five castle courses end to end; relic targets for the new courses are formula-derived, not tuned.

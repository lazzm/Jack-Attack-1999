# Zip the Badger: depth and review ledger

Run: 26 October 2026. Both original game IDs (`md.zip`, `dc.dash`), secret IDs, account records and save versions remain unchanged. No deployment, version bump or live data changes belong to this worker run.

## Scope against the reference games

The campaign counts are checked against [the publisher’s description of the original game](https://games.sega.com/3dclassics/sonic.html) and [the original Adventure instruction manual](https://www.digitpress.com/library/manuals/dreamcast/sonic_adventure.pdf). These were read for scope only; no source artwork, music or code was used.

“Original has” describes the full 1991–92 speed-platformer and 1998–99 adventure reference target, not a claim that the parody has reached it. Existing published stories describe an eventual six-character Adventure; those are the target, not six playable campaigns in this build.

| Feature/content | Original has / target | Before this run | This run |
| --- | --- | --- | --- |
| Mascot | Distinct, expressive character across sprites, model, packaging and printed material | Blue, swept-quill character; inconsistent references | Original purple badger: ivory stripe, dark face mask, round ears, short punk crest, pilot goggles, yellow scarf, teal trainers. Every 2D pose/roll/icon/sign, 3D rig/roll/HUD, cases, illustrated cartridge/disc labels, encyclopedia and October cover updated |
| 16-bit campaign | 1991 reference: six zones × three acts and a separate final stage (19 stages); the 1992 sequel adds partner/race play and a larger campaign | Three zones × two acts; three machines | Six zones × two acts, six machine encounters; six new authored routes, three scenery palettes, original melodies and decorations; celebration and scrolling credits |
| 16-bit route design | Fast lower paths and rewarding elevated routes; momentum, springs, loops, hazards | Slopes, loops, corkscrews, platforms, springs, conveyors, crushers | Preserved; new forest canopy paths, aqueduct platforms/vents and conveyor airbase routes. New acts are 4,290–5,080 pixels long; old acts remain 7,000–10,660 pixels |
| Special stages | Distinct bonus challenges, complete stone set and ultimate ability | Six seeded sky courses, six Time Stones | Six stone/save keys preserved; new zones provide another attempt at the corresponding stone. Six stones + 50 rings unlock Shift / pad Select “Burrow Power”: speed, higher jumps, protection and one-ring-per-second drain |
| 16-bit modes | Main campaign, replay/time attack, secrets; sequel adds partner/multiplayer | Campaign, time attack, passwords, level-select cheat, sound test, records | All retained; extended time attack/level select covers twelve acts. Old four-letter passwords preserved for the first six acts; later acts use memory-card continue. Partner/two-player mode remains absent |
| Adventure campaign | Six different character stories, hubs, upgrades, varied stage objectives and final story | Zip only: four speed stages + final boss | Zip's five-stage campaign retained; final boss homing pursuit fixed. Other five stories, hubs, upgrade puzzles and final super-story remain absent |
| Adventure replay | Stage replays with multiple objectives and completion rewards | Stage trials, score ranks, nine badges | Goal, finish-with-100-rings and par-time objectives on all four action stages; seventeen badges, best times/ranks, existing stage gating |
| Adventure set pieces | Loops, homing chains, city descent, snowboarding and spectacular chase scenes | Whale, avalanche, loops, rails, wall run, ramps/tricks | Preserved; rounded coastal islands replace cones; compact visible-ring instances, distance culling, scenery chunks and cheaper character lighting reduce rendering work |
| Pet garden | Raising, appearance changes, breeding and races / memory-card activities | Fruit, patting, rescued animals, three Chums and appearance changes | Existing garden preserved. Breeding, races and a separate memory-card game remain absent |
| Pause and persistence | Stable pause and saved progression | Act-start continue only in 2D; reached stages/records only in 3D; some draw calls advanced 2D hazards | Compact additive run snapshots (checked below the 20 KB roaming limit) preserve pose, rings, enemies/pickups, checkpoints, power-ups, loop/grind/homing references and boss state. Hide/exit, pause and periodic saves. 3D result continuation retains the next story stage |
| Presentation | Era-native aspect, menus, attract, audio and endings | Original generated art/music, attract and menus | Renamed and redesigned mascot, readable labels for keyboard/pad, 2D credits, mission screens, coherent printed illustration; original music/code/art only |

## Ranked critique and work performed

1. **High, fixed:** the 3D boss continuously teleported ahead of the player during its swoop. Homing could not close the distance. It now commits to a slower flight path; six actual homing collisions reach the saved ending.
2. **High, fixed:** refreshing lost active 3D adventure state; 2D only remembered an act start. Snapshot saves are additive and reconnect references to rebuilt geometry. Existing gems, records, badges, options and account saves remain.
3. **High, fixed:** the blue quill silhouette read as a recolour. Original badger designs now agree across the animation rig, sprites, title, HUD and authored material.
4. **High, fixed:** the 2D hopping machine retained horizontal velocity while resting, allowing it to slide outside the player arena. Landing now stops it, and re-entry resets its movement. All six machines accept their full set of spinning collisions.
5. **Medium, fixed:** 2D effect movement and wave collision ran inside rendering. Rendering now leaves gameplay state alone; pause/LOCK IN/capture frequency cannot move a hazard.
6. **Medium, improved:** 2D act count doubled, with distinct locations and authored routes; Adventure replay objectives now reward ring conservation and speed separately.
7. **High, outstanding depth:** Adventure still lacks five character campaigns, hubs, upgrade progression, additional boss/story arcs and the final story. This run does not claim full-reference parity.
8. **Medium, outstanding depth:** unique new boss machines for the three added 2D zones, a partner/co-op mode and additional special-stage mechanics would distinguish the second half further. Current later encounters reuse the three original machines with extra health.
9. **Performance:** measured software-WebGL results, reviewed captures and remaining performance risks are recorded below after the final verification pass.

## Verification approach

- `node tests/games/zip-logic.mjs`: production simulation and real THREE geometry with raster/audio replaced; all twelve acts have finite objects/platforms and move, pause and resume. All six 2D capsule/tally/next-act paths and the 3D six-hit homing boss/ending are asserted. Positioning hooks bound travel to encounters; this is not a claim of twelve unassisted complete runs.
- `node tests/games/zip.mjs`: own disposable localhost server/account, production console wrapper and real keyboard/gamepad events; native and browser captures under `tests/shots/games/zip/after/`. `--baseline` routes the two original game scripts from `/tmp/zip-before/`; `--quick` and `--flows` are focused diagnostics; `--gallery` captures animation/print/model/ending art; `--shared` checks the unaffected kart, taxi and fighting games.
- Each screenshot has a browser view and a `-native.png` companion. Numbered sequence frames record animation. Physical case and cartridge/disc prints are exported directly from the game's print textures; the complete 43-frame animation sheet is reviewed too.
- Native 3D timing forces a one-pixel GPU readback; displayed rAF includes the house and screen presentation. These are software-renderer diagnostics, not hardware FPS promises. Compare matching resolution/position and host load.

## Next chunk

Build the first actual Adventure hub and Whirly's complete race campaign, with character selection, its own movement/flight rig, stage routing, mission records and saved upgrade gates. Then add the radar hunt, hammer chase, fishing and robot campaigns, before the final story. Do not relabel recoloured Zip stages as six finished character campaigns.

For 2D, add a third act to each zone and a separate final encounter to reach the 1991 reference volume, replace the second-tour machine repeats with three original machines, and add partner/race play. Append IDs or introduce an explicit progression list rather than renumbering saves. Retain the twelve act indices and all existing stone/secret/save keys.


## Before/after captures and timing

- Before: `tests/shots/games/zip/before/zip-title-native.png`, `dash-title-native.png`, `dash-run-native.png` and each original act/stage.
- After: `tests/shots/games/zip/after/zip-animation-sheet.png`, `zip-act-6-mid-native.png`, `zip-act-8-mid-native.png`, `zip-act-10-mid-native.png`, `dash-model-front-native.png`, `dash-missions-native.png`, `zip-ending-native.png`, `zip-credits-native.png`, `dash-ending-native.png`, `dash-credits-native.png`, both `*-title-room.png`, `md.zip-case.png`, `dc.dash-case.png`, both `*-medium.png`, `october-cover.png` and `zip-encyclopedia.png`.
- The 3D badger was checked from front/rear/side, plus whale and monitor views. The complete 2D sheet caught leftover red shoes in the fastest run animation; those are now teal. The print review caught cover lettering over the face; the portrait moved clear. Credits now appear immediately on entering their scroll.
- The first reference capture measured 138.6 ms per 640×480 native render and 309.8 ms per displayed frame. A later matched-position reference capture measured 486.7 ms / 687.2 ms during severe host contention. These are separate observations, not a stable benchmark baseline.
- Final timing JSON files record render/display mean, median and p95, output and scene dimensions, renderer, triangle/draw counts and host load. The software fallback keeps a 640×480 HUD over a 320×240 scene; the test also forces a separate full 640×480 scene measurement. Hardware retains full resolution. Native PNGs composite the scene and HUD at the HUD resolution.
- Remaining limits: no hardware GPU, physical controller, actual phone/tablet startup or second-device profile transfer was verified. Portrait/landscape captures resize the desktop console session. The bounded input and terrain checks do not establish twelve unassisted full runs. All full-reference depth gaps remain explicit in the table.

The default smoke gate remains `node tests/smoke.mjs`. The optional `zip-smoke-load.cjs` preload extends only Playwright action/navigation waits by the existing `SMOKE_SCALE`; it preserves every gameplay assertion and is a diagnostic for heavily oversubscribed hosts, not a substitute claim that an unscaled run passed.

## Final run record — 26 October 2026

- Passed: production-logic checks; full browser game suite; final art gallery (including projected character bounds during whale and avalanche chases); shared kart/taxi/fighting renderer checks; magazine catalogue checks; syntax checks for every changed JavaScript file.
- Smoke: the unscaled `node tests/smoke.mjs` timed out on browser actions/navigation under host contention. `SMOKE_SCALE=4 NODE_OPTIONS=--require=./tests/games/zip-smoke-load.cjs node tests/smoke.mjs` completed **12/12**, including browser errors and server log, exit 0. This does not establish an unscaled pass.
- Observed after timings varied substantially: a warmed full-resolution render averaged 20.8 ms (display 38.7 ms), and the 320×240 fallback averaged 14.6 ms (display 34.6 ms). The later full-suite sample measured 57.1/101.8 ms and 48.4/85.7 ms respectively. Host load and camera/visibility differ between historical samples; no fixed speedup ratio or smoothness guarantee is claimed. The benchmark now settles the camera and fixes its FOV before future measurements.
- Final art corrections include full-height jump framing, faster chase-camera tracking, forward-facing whale, dark forest pit/loop palettes, and illustrated loose-media labels. Reviewed chase captures: `after/dash-whale-chase-reviewed-native.png` and `after/dash-avalanche-reviewed-native.png`.
- High-priority scope gaps remain: full original campaign volume, distinct later 2D bosses, additional playable Adventure campaigns/hubs and expanded Chum activities. This run improves the existing games and establishes saved progression; it does not claim full reference parity. No deployment, version change, commit or live-data access was performed.

# Bounce Quest 64 — scope and depth review

Pass 2 starts at `f913c7b` on branch `hop` (pass 1 was based on main 2.77.0). Original procedural models, textures, layouts, compositions and effects only. Native rendering remains 320×240, vertex-lit, with low-resolution textures and distance fog. No blur pass or graphics menu. No shared kit, account, economy or server code changed.

## Scope against the 1996 reference

The reference has fifteen main courses, miniature courses, 120 rewards, acrobatic movement, swimming and special caps ([official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_8/Manual_Nintendo64_SuperMario64_EN.pdf), [official game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Super-Mario-64-269745.html)). Those are depth targets, not a claim that this cartridge is reference-scale.

| Feature/content | Reference has | Before pass 2 | Current / remaining gap |
| --- | --- | --- | --- |
| Campaign | 15 main courses, miniature courses, 120 rewards | Hub, four seven-acorn courses, final arena; 37 rewards | Five seven-acorn courses, eight hub rewards and Crown Acorn: **44 total**. Existing five doors/indices/thresholds and every old acorn ID survive. New sixth door opens at five acorns. Campaign volume remains far below the reference. |
| Hub | Exploration, movement lessons, discoveries, course entrances | Eight routes; five magic doors | Adds the Grotto painting at the end of the existing door order. Old routes and door positions stay intact. A dedicated movement school remains absent. |
| Beach | Exploration, vertical routes, distinctive challenges | Sandcastle, mast/chest, chimney, clam, offshore rocks, red/100 coins, Bell Buoy Dash | Retained. Dedicated swimming is in the new Grotto; the legacy open sea still uses its original fallout rule. |
| Snow | Mountain climbing, slippery routes, slides and rival | Summit, penguin race, igloo, berg, snowball enemies, Flapjack Post Run | Retained. An enclosed slide/interior remains absent. |
| Haunted course | Mansion interior, ghosts, puzzles, boss | Exterior mansion/roof, hedge maze, four lanterns, ghosts, Big Boohoo, Butler Bell Blues | Real foyer, library, dining parlour, stairway and upper study/gallery. Solid reversible front door; two red coins moved indoors, two additional indoor ghosts. Outside lift/roof route and all seven reward IDs retained. More authored room puzzles remain useful. |
| Swimming course | Water movement, breath management, underwater navigation | None | **Custard Grotto**: shore-to-water entry, held rise/dive, gentle float, surface breach, air/coin recovery, three bubble vents, physical wreck/chest, three pearls, ordered current hoops, jelly enemies, dry-roost jumps, red/100 coins. Seven rewards. |
| Clockwork course | Moving platforms, timing, route mastery | Gears, lifts, hands, conveyor, shortcut, slow-clock trial | Retained. A second complete layout remains absent; the full natural timed ascent is not established by staged gate coverage. |
| Movement/camera | Responsive jumps, wall kicks, swimming, scene-sensitive camera | Repaired triple/long/wall jumps, coyote/buffer, continuous obstruction solver | Adds buoyancy, drag, strokes, dive/ascent and breach poses. Reward camera/held trophy and two-character boss intro framing improved. Side flip, ledge grab and free flight remain absent. |
| Rewards/HUD | Clear hierarchy, readable counters and celebration | Lives collided with reward heading; weak shadows lost text over scenery; trophy covered face | Opaque one-pixel ink around every cartridge pixel-font string and icon; separated lives/title/subtitle/total rows, raised side-held trophy, filled boss introduction, lettered solid signs on both sides. HUD remains a separate canvas composited after WebGL. |
| Bosses/ending | Milestone encounters and ending | Big Boohoo, King Grumpus, Crown, credits | Retained; Boohoo's intro mesh now starts at its actual position. Ongoing manor fight music resumes correctly after pause/refresh. More milestone bosses remain absent. |
| Power-ups/replay | Cap unlock ladder, secrets, postgame | Trials, memory puzzle, cheats, local scores | Retained. No original power-up progression yet. This is the next major mechanics chunk. |
| Saving | Persistent rewards and course state | Legacy progress plus detailed run suspension | Adds air/stroke state, pearl mask/current progress, chest state, and reversible door phase/target. Old save keys, names, balances and acorns are preserved. No live data touched. |
| Devices | Controller-first play | Keyboard, standard pad, phone/tablet controls | Uses the existing actions and radial deadzone. Swimming uses held jump to rise and held crouch to dive; a fresh jump at the surface breaches. Punch opens the submerged chest and manor door. No new device-specific options. |

## Pass 2 art-direction critique and fixes

1. **High: reward layout collided with the lives display.** The old heading occupied the same rows as the long Bopper label. Lives now has its own short top-right row; the reward heading and full objective name start below all counters. The total and optional trial result have separate bottom rows.
2. **High: scenery destroyed HUD readability.** The HUD was already drawn after WebGL, but one-sided shadows left bright glyphs apparently cut by tombstones/windows. Cartridge-local font ink now draws opaque outlines on all sides; acorn/coin silhouettes also have dark edging. Regression checks composite opaque HUD pixels over the world and preserve a transparent HUD-only capture.
3. **High: the trophy hid the hero's face.** The smaller acorn is raised beside the head, above the extended mitten, rather than centred over it. Camera-facing pose and trophy placement use the current camera orientation, including on suspension restore.
4. **High: Boohoo's intro lost its subject.** The ghost became visible at the world origin because its mesh position was only updated once fighting began. Intro now places the mesh correctly, chooses a clear two-character view and waits for typed text before capture. The test checks the actual boss mesh is framed.
5. **Medium: the bell sign was a blank board.** Original solid wooden signs now carry bordered pixel lettering on both faces, using one shared atlas. Short headings use larger lettering; long headings wrap without abbreviation. The full instructions remain interactive.
6. **High content gap: no swimming and no playable mansion.** This pass adds one distinct swimming course and opens the existing mansion into two furnished, navigable floors. The remaining volume and power-up gaps are explicit above.

The pass-1 fixes remain: real touchdown events preserve chained jumps and recovery; 100 ms coyote time, 140 ms input buffering and crouch momentum memory; stable sideways camera steering; continuous box/cylinder/decorative geometry obstruction tests; grounded hub/beach enemies; exact-centre collision escape; slope-aligned player shadows; Cast-derived authored identities; independent world/texture random streams.

## New course objectives

| Custard Grotto reward | Route/mechanic |
| --- | --- |
| Your First Proper Dip | Leave the shore and dive to the first acorn. |
| The Captain's Lost Lunch | Enter the solid wreck through its open end and open the physical chest with punch. |
| Three Pearls for Tea | Visit three shells at distinct depths; bubble vents offer recovery points. |
| Ride the Custard Current | Steer through three ordered hoops while the current helps toward the next. |
| Up to the Dry Roost | Surface-breach onto the stepping rocks, then climb with normal jumps. |
| Eight Red Sea Coins | Explore the basin, shelf and surface; breach for the reward. |
| A Hundred Sunken Coins | Follow five depth-varying coin lanes. Coins restore some air and health. |

Coins, red coins, pearls, current hoops and reward positions are checked against the sloping seabed. The wreck has a keel/deck, ribs, broken side planks, mast and chest; coral/kelp have thickness; bubbles are instanced and driven by saved world time. The swim course's air clock pauses with the game. Swimming is restricted to Grotto so the old coastal challenges retain their existing rules.

## Save and compatibility design

Existing `v2`, `got`, `ac`, `score`, `lives`, `opt`, `hs`, `boss`, `w`, `p`, `door` and records stay readable. `run.v=1` remains separate from title-menu `ui`. Player suspension includes air, stroke and movement. `run.grotto` stores the pearl bitmask and current index; ordinary chest fields retain the wreck lid. `propTargets` accompanies existing numeric prop phases so a door can resume while opening or closing. Physical support is resolved at the saved feet position, allowing added course geometry without attaching an old save to an unrelated collider index.

The detailed suspension still covers camera/lens, health, coins/drops, enemies, platforms/world clock, puzzles, trials, boss/shockwaves, dialogue, rewards, transitions, results and credits. Procedural textures have independent seeds, and the world patrol RNG position is checkpointed. No meshes or callbacks are serialized. Already-sounding audio tails and cosmetic particle bursts are not serialized. Save listeners are removed when the cartridge closes. The regression checks the roaming record remains below 20 KB and production result refresh does not resubmit a score.

## Review and verification

Only disposable localhost servers on ports 18080–18099 and `/tmp` data are used. One browser is open at a time. Test paths resolve from `__dirname`. No dependencies, shared kits, version/changelog edits, deployment or commits.

Pass-2 baseline: `tests/shots/games/hop/pass2-before/` preserves the reviewed pass-1 Boohoo/reward/bell captures and HEAD timing JSON. Current captures go to `tests/shots/games/hop/pass2-after/`. Existing `before/` and `after/` pass-1 artifacts remain intact.

The test uses actual browser keys, injected standard gamepad input and actual CDP touch. Branch encounters use explicitly staged positions; rewards are awarded only by real collision, never by the debug grant helper. Grotto entry is through its real unlocked hub door. The course regression swims the routes, opens the chest, collects pearls/red/100 coins and climbs the roost. Low-air edge setup accelerates only the resource clock. Manor coverage exercises the real door, room routes, stairs, study coin, camera turns and exit. This is targeted coverage, not an unaided full 44-acorn campaign.

### Test results

All results below are from disposable servers with `/tmp` data. Native test commands used `http://localhost:18088`; smoke started its own default throwaway fixture. Browser suites ran sequentially.

| Command | Actual result |
| --- | --- |
| `node --check app/public/js/rm-g-hop.js` | Exit 0. |
| `node --check tests/games/hop.mjs` | Exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0, zero authored violations. |
| `node tests/games/hop.mjs http://localhost:18088 --native` | Exit 0: title/continue, real hub/Cove/Peaks doors, chained jumps/wall kicks, camera sweeps, four trials, both bosses/credits, all seven Grotto pickups, indoor routes/wall-jump/ceiling-backflip clearance, reward projection and HUD compositing, pause/refresh. Final capture rerun passed after the visual-pivot, low-ceiling camera and help-spacing adjustments. |
| `node tests/games/hop.mjs http://localhost:18088 --native --manor-only` | Exit 0: focused solid door, library, real stairs/study, camera sectors, coasting wall jump and stationary ceiling backflip. |
| `node tests/games/hop.mjs http://localhost:18088 --native --legacy-only` | Exit 0. Builds actual f913c7b saves, then restores the hub pier and moving manor lift with old pose, health, coins, flags, pause, world clock, RNG and camera intact. |
| `FIXTURE_RASTER_RATIO=0.35 node tests/games/hop.mjs http://localhost:18088 --room-only` | Exit 0. Real physical cartridge/telly, LOCK IN, standard gamepad, underwater pause/production refresh, no result resubmission, Game Over, Q, CDP touch and phone/tablet rotation. Raster cap applies to the house fixture; native game remains 320×240. |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | Exit 0, 12/12. No URL and no fixture raster override. |
| `node tests/mobile.mjs http://localhost:18088 --only=gate` | Exit 0. Phone/tablet portrait/landscape account gates. |
| `node /opt/stacks/landing-hop/tests/games/hop.mjs http://localhost:18088 --before --bench` and the same command with `--bench` | Both exit 0, invoked from `/tmp` to verify folder-relative resource lookup. Paired timing JSON below. |
| `git diff --check` | Exit 0. |

The new camera-distance assertion initially exposed a coasting wall-jump squeeze. Matching the recovery probe and boom heights, with stick-released angle recovery, fixed it; focused and full native reruns passed.

No browser errors/warnings attributable to the cartridge and no server “mod failed to load” entries. GPU readback diagnostics are filtered by the harness. No shared kit changed, so no additional kit-dependent game regression was needed beyond smoke.

### Measured frame cost

Paired baseline is committed f913c7b; after uses this working tree. Actual RoomTV RNG, identical 320×240 renderer/DPR 1, 60 warm-up and 120 measured frames per view, including update, draw/HUD and synchronous GPU readback. Chromium uses ANGLE/SwiftShader on this shared machine; these are software-renderer costs, **not hardware frame-rate guarantees**. The house is excluded. Raw results: `pass2-before/paired-performance.json` and `pass2-after/paired-performance.json` under `tests/shots/games/hop/`.

| View | Before median / p95 ms | After median / p95 ms | After update median / p95 ms | Calls / triangles |
| --- | --- | --- | --- | --- |
| Hub | 9.6 / 10.8 | 9.7 / 10.9 | 0.2 / 0.3 | 45 / 40,365 |
| Cove | 10.4 / 11.2 | 10.7 / 12.0 | 0.9 / 1.1 | 37 / 44,222 |
| Peaks | 11.2 / 12.7 | 11.3 / 13.1 | 1.1 / 1.2 | 35 / 48,854 |
| Manor exterior | 9.9 / 11.5 | 11.9 / 12.9 | 1.3 / 1.5 | 58 / 47,110 |
| Tower | 6.0 / 6.4 | 6.2 / 7.2 | 0.5 / 0.6 | 22 / 18,847 |
| Final arena | 5.1 / 5.5 | 5.3 / 5.7 | 0.3 / 0.4 | 23 / 12,793 |
| Grotto | — | 13.0 / 14.6 | 1.1 / 1.3 | 42 / 42,038 |
| Manor interior | — | 10.3 / 11.3 | 1.4 / 1.6 | 25 / 37,444 |
| Grotto wreck | — | 11.1 / 12.3 | 1.2 / 1.4 | 23 / 35,956 |

The manor's extra geometry/lights increase cost. Timing tails vary between runs on this shared machine; the separate full-playthrough timing JSON is retained as well. Peak sampled resources: 58 draw calls, 48,854 triangles, 55 geometries and 36 textures. No post passes, blur or shadow maps. The sign atlas and instanced bubbles limit added resources.

### Capture review and limits

Before: `pass2-before/boohoo-sequence-0.png`, `boohoo-intro.png`, `bells-round-1.png`, `sandcastle-pose-native.png`. After: corresponding `pass2-after/boohoo-sequence-0-native.png`, `boohoo-intro-native.png`, `bells-round-1-native.png`, `sandcastle-pose-native.png`; enlarged browser captures accompany native images. `model-sign-front/back/side-native.png` prove the solid sign and both faces. New content: `grotto-start-native.png`, `grotto-dive-native.png`, `grotto-open-chest-native.png`, `grotto-bubble-vent-native.png`, `manor-library-native.png`, `manor-upper-study-native.png`. Device evidence: `phone-swimming.png`, `phone-touch-landscape.png`, `tablet-touch-game.png`, `tablet-in-room.png`.

Reviewed native and enlarged reward/intro/bell/sign/interior/water views, plus phone/tablet framing. Reward checks cover first-get, three early frames and settled pose: trophy clears the head and remains between the title/footer bands. Dark indoor materials remain deliberately compressed and deserve richer environmental lighting in a future art pass. Camera checks cover the recorded routes and orbit sectors, rather than every possible obstruction/input combination. No physical controller, mobile GPU or listening session was available. Branch staging means an unaided full 44-acorn campaign, every cheat combination and a complete natural clockwork trial ascent are not verified. Power-up progression and swimming in the original coastal courses are not implemented.

## Next chunk

Build an original power-up unlock ladder with useful return visits: a glide badge, a heavy biscuit form for current/weight puzzles and a phase trick for authored ghost routes. Add distinct milestone bosses, a dedicated snow slide and further complete courses. Retune the original coast/hub challenges before extending swimming to them. Side flip and ledge grab remain valuable movement additions. Keep the current IDs, original door thresholds and suspension compatibility regression.

### Visual review

The pass-2 baseline is scored more strictly than pass 1's self-review: overlapping reward UI was a visible failure. This is a period cartridge, with intentionally simple polygonal forms; it is not being presented as a modern showcase renderer.

| Category | Before → after | Evidence / limit |
| --- | --- | --- |
| Art direction | 2 → 2.25 | Biscuit, snow, gingerbread, brass and aquatic-limestone courses have distinct palettes and landmarks. |
| Hero | 2.25 → 2.25 | Original cap/rucksack silhouette retained; swimming, treading and raised-mitten poses added. Somersaults turn around body height. |
| Obstacles/enemies | 2 → 2 | Solid wreck, jelly silhouettes, furnishings, actual stairs and rotating door; still deliberately low-poly. |
| Rewards | 1.75 → 2.5 | Trophy/face separation and playfield fit checked through the get sequence; clear fanfare/title/objective/total hierarchy. |
| World | 2 → 2.25 | Complete swim basin and two furnished mansion floors add genuine traversable volume; five courses remain a modest campaign. |
| Materials | 2 → 2 | Shared original low-res textures and one sign atlas; book bindings, timber, limestone and brass remain economical. |
| Lighting/render | 1.75 → 2 | Warm practical lights indoors and blue depth fog underwater; manor still has a deliberately compressed night palette. |
| Motion/feedback | 2.5 → 2.5 | Existing chained jumps plus strokes/breach, door reversal, bubbles, hits and trophy pose. |
| UI/HUD | 1.5 → 2.5 | Opaque ink, separate reward bands, stacked activity prompts, filled dialogue and three help pages. |
| Performance evidence | 2.5 → 2.5 | Baseline/after native readback timings, update costs, renderer/resource and pixel diagnostics, plus indoor/wreck views. |

Average: 2.025 → 2.275. No whole-game premium/showcase claim. The remaining art work is richer environmental modelling and lighting, especially indoors, rather than extra post effects.

The manor camera uses a wider, lower lens and limits rotation at obstructed room views; recovery with the stick released stops when directional input resumes. Projection/FOV is saved. Indoor ceiling collision covers the whole normal head. Coasting wall jumps and separate stationary backflips have captured clearance checks. The jump camera follows smoothed height so a ceiling contact cannot force the lens into a somersault; its clearance is asserted. The tree crown has a continuous swept support behind the standing platform and room for the victory jump. Hit flashes draw below the HUD. Boss bars, race/trial prompts and door/chest prompts occupy separate footer lanes; pause owns its HUD.

The native harness now uses the actual RoomTV random algorithm and action-edge contract. Pixel-inspection canvases request frequent-readback contexts so the inspection itself emits no Canvas2D warnings. The geometry proof projects actual model vertices, rather than an excessively loose world-aligned bounding box.

# Metal Gerbil Solid — scope and review

This run starts from 2.73.0 on `sneak`. All artwork, maps, dialogue and compositions are original. The comparison below is a depth target, not a claim that this cartridge contains a full commercial campaign's volume.

## Scope against the 1998/1999 genre reference

The original manual documents [stealth training, time attack and limited-ammunition target training](https://metalgear.konami.net/manual/mc1/mgs1/pc/en/page15.html), [equipment selection and supplies](https://metalgear.konami.net/manual/mc1/mgs1/pc/en/page06.html), and [binoculars, thermal optics, rations, boxes and access cards](https://metalgear.konami.net/manual/mc1/mgs1/pc/en/page17.html). The separate 1999 training expansion has [300 exercises in four categories](https://metalgear.konami.net/manual/mc1/mgs1_special_missions/pc/en/page09.html); that expansion is a further depth target, not included in the base campaign comparison.

| Feature/content | Original has | Before this run | We have now / remaining gap |
| --- | --- | --- | --- |
| Main campaign | Long infiltration, revisits and varied encounters | Six compact, mostly linear areas | Nine areas: dock → helipad → basement → duct → lab → freezer → packing hall → tea tower → hangar. Still much shorter and more linear than the reference. |
| Distinct encounters | Multiple bosses and set pieces | One walking-wheel boss | Wheel Rex plus a rooftop security shutdown against the Spinning Stoat; freezer circuit and packing-hall fuse puzzles. More bespoke boss mechanics remain a major gap. |
| Stealth | Sight, sound, cover, suspicion, pursuit and evasion | Patrols, cones, crawling, wall cover/knocking, boxes, cameras and searchlights | Same production systems used by campaign and training; walls block close-range detection; box investigations recover correctly. No footprints tracked by AI yet. |
| Equipment | Broad selectable tool set | Darts, automatic rations, box, three access-card levels | Field equipment menu, manual/automatic rations, first-person look, collectible binoculars and Crumb Vision optics; original nonviolent dart tool. More nonviolent tools and inventory puzzles remain. |
| Training | Separate learning, timed and ammunition-limited modes | None | Twelve graded exercises over four authored layouts: reach, crawling/seed retrieval, box inspection, limited-ammunition snoozing, switches and guard luring. Sequential unlocks, best times and bronze/silver/gold medals. These are combined exercises, not all three original mode ladders. |
| Difficulty | Multiple difficulty settings | One | Tea Break, Field Agent and Night Shift change sight range, starting supplies and damage. Radar range agrees with guard detection. |
| Radio/story | Extensive optional calls and story scenes | Intro, hints, scientist and ending calls; vent conversations | New freezer, packing and rooftop calls/hints; inventory/view controls; existing conversations retained. Optional relationship/story branches remain absent. |
| Ending/replay | Ending, staff roll, ranks and special equipment | Result tally and local rankings | Cast-signed ranking, scrolling cast credits, per-difficulty best clears, dinner suit and gold delivery box unlocks. One ending; no extraction vehicle sequence yet. |
| Secrets | Hidden interactions and replay rewards | Six seeds, ghost and box secrets | Seeds and secrets retained; six seeds or all twelve course medals unlock the gold box; mission clear unlocks dinner suit. No invisibility/infinite-supply unlocks. |
| Save | Save/resume and persistent records | Area-entry checkpoint only | Separate checkpoint, suspension and menu-presentation records: position, inventory, guards, alert/search timers, projectiles, doors, radio, interrupted lever pulls, transitions, pause, equipment/optics, training results, score tally, credits, title/course lists and mission orders. Legacy `ck`/`hi` cards still load. |
| Presentation | Low-resolution 3D, tactical HUD, radio portraits and menus | Strong original art and native 320×240 rendering | Existing art retained; coherent period equipment/course/dossier screens, cast credits and cosmetic rewards. Invulnerability flashes the suit instead of making the agent vanish. |
| Controls/devices | Controller-focused console interface | Keyboard/shared standard-pad/touch routes | Arrows move; Z crawl, X use/knock, C snooze dart, V box, U equipment, E look/return, Enter pause. Standard gamepad and shared phone pad use the same actions. Q/T/Esc remain house controls. |

The two new encounters supplement the existing six-area run; older saves already in the hangar remain in the hangar. Internal original area IDs, secret IDs and save version are preserved. Training IDs are 6–17; added campaign IDs are 18–20. No account, cash, Rupee, family, house lighting or shared sound code is changed.

## Ranked baseline critique

1. **High — lost progress on refresh.** Checkpoints recorded only area entry; live position, puzzles, alerts and UI modes were discarded. Added a separate serializable suspension record, periodic/action saves and lifecycle saves, keeping retry checkpoints separate.
2. **High — shallow progression after learning the controls.** One short linear campaign and no training/replay ladder. Added three campaign areas, twelve graded exercises, three difficulties, career records, credits and two unlocks. Full reference-scale content is still unfinished; see next chunk.
3. **High — authored leaderboard identities.** Seeded real household names and manual initials defaulted to a fixed owner name. New seeded rows, signatures and credits use Cast roles; existing player-authored records survive.
4. **Medium — stealth fairness.** Close proximity could detect through walls; stationary-box suspicion could leave guards stuck. Sight now checks obstruction at close range; boxed investigations decay suspicion and return guards to their route.
5. **Medium — feedback and inspection.** The agent vanished during starting invulnerability, and there was no first-person inspection or selectable equipment. Suit flashes retain the silhouette; equipment and optics provide a readable inspection loop.
6. **Medium — unsafe course entrances discovered during testing.** Patrol head turns could see a new trainee before an introduction finished. Added solid entrance cover; reset transient dart/pull state on area entry.
7. **Low — supply handling.** Full dart pickups were consumed. Full supplies now stay in the world.

## Save design

`ck` is the current campaign area's retry checkpoint; `run` is the suspension snapshot; `ui` retains title/course/dossier/order screens without overwriting the live mission; `career` contains clears, per-difficulty records, medals and equipment unlocks. The original `hi` array remains compatible. Training carries a separate campaign suspension, restores it on leaving the course, and never writes over its retry checkpoint. No renderer objects, callbacks or meshes are serialized. Radio completion reconstructs the scientist's access-card award and the ending callback by call ID. Hazard time freezes while paused, on the radio and in equipment menus.

## Reproducible review

Use a free port in 18080–18099 and a fresh DATA_DIR under `/tmp`; keep server and test in the same shell command. `tests/games/sneak.mjs http://localhost:PORT` runs the native scripted flow, then closes that browser before opening the authenticated house and phone fixtures. `--native`, `--room-only`, `--phone-only`, `--bench` and `--before` select diagnostics; `--before` loads the committed HEAD cartridge. Never point this at live state.

Shots: `tests/shots/games/sneak/before/` and `tests/shots/games/sneak/after/`. Each native shot also has a `-native.png` at 320×240. `dart-flight-*` is a short motion sequence. Branch placement uses the debug API; actions, equipment, switches, darts, pickups, exit crossings, menus and result confirmation use production code and real browser keys. This is targeted branch coverage, not a claim of a human-length, unaided campaign speedrun.

Desktop room checks use 1366×860. The baseline physical-room shots use full house raster resolution; final combined functional room/phone checks use `FIXTURE_RASTER_RATIO=0.45` to bound the software renderer cost of the surrounding house. The cartridge remains at native 320×240 throughout, including LOCK IN and the exported native PNGs. Phone checks use a mobile/touch browser at 390×844 and 844×390, then resize to 768×1024 for tablet framing and press the actual shared controller through DevTools touch events. The host's account gate and broader phone layout checks are additionally covered by `mobile.mjs --only=gate`.

### Verification log

All 59 `tests/*-unit.cjs` passed (exit 0). `node --expose-internals tests/parody-audit.cjs` reported zero authored spans in zero files (exit 0). Both touched JavaScript files pass `node --check`; `git diff --check` passes. `node tests/mobile.mjs http://localhost:18087 --only=gate` passed all five device profiles (exit 0).

`FIXTURE_RASTER_RATIO=0.45 node tests/games/sneak.mjs http://localhost:18087` passed its combined native, desktop-room, standard-pad, refresh, phone and tablet checks (exit 0). Desktop gamepad shoulders open equipment and first-person look; phone fingers operate all six actions. Menus, active alerts, half-pulled levers, optics, training results, credits and legacy checkpoint cards are covered. Final small restore fixes also retain door-clearance lamp colours and the scientist's visible model.

| Native software rendering, ms | Before median / p95 | After median / p95 |
| --- | --- | --- |
| Dock, paired benchmark | 3.2 / 3.7 | 3.2 / 3.6 |
| Wheel Rex hangar, paired benchmark | 3.4 / 4.1 | 3.3 / 3.7 |
| Cold storage | — | 2.9 / 3.8 |
| Packing hall | — | 2.6 / 3.0 |
| Tea tower | — | 3.1 / 3.7 |

The paired benchmark is 60 warm-up frames followed by 120 samples, each including cartridge update, drawing and synchronous GPU readback at 320×240. JSON evidence: `before/paired-performance.json` and `after/paired-performance.json` below the shot directory. SwiftShader reports 53 dock draw calls and 2,716 triangles in the paired final frame; the fully equipped story test also exercised 98 hangar calls / 3,964 triangles. These timings exclude the house and are software-host diagnostics, not hardware FPS. The initial, busier-host sample was 6.8 / 10.0 ms (`before/initial-performance.json`); use the paired samples for comparison.

`node tests/smoke.mjs` exited 1 after its 400-second watchdog: sparse signup and account/house passed, then artwork preload and room setup exceeded the default budgets. `SMOKE_SCALE=4 FIXTURE_RASTER_RATIO=0.35 node tests/smoke.mjs` exited 0 with **12/12** checks, including all six canonical views, mobile/desktop, browser errors and server log. The repeat uses existing test-runner controls; no check was removed and no shared house code was changed. All throwaway server logs checked have no `mod failed to load`.

The before native diagnostic was also extended through the actual three-switch boss, plans pickup, ending call, score tally and ranking screens (exit 0). The final native story regression passes after the restore-lamp/scientist fixes and explicitly checks that a distant noticed box is inspected and the guard returns to patrol. Development fixture mistakes (a private TV-screen pointer, account-name length and browser-evaluation arguments) were corrected before the successful combined run; these were test errors, not suppressed product exceptions.

Reviewed captures include the title, all nine area starts/midpoints, locked doors/card pickup, wall knocks, snooze-dart flight/impact, box inspection, each new puzzle and security shutdown, both optics, ration use, both encounters' completion, score/signature/ranking/credits, pause, menu and active-state refreshes, legacy cards, dinner suit/gold box, physical telly and LOCK IN, standard pad, and phone/tablet layouts. Freezer, fuse, goggles, Stoat and dinner-suit geometry were inspected from front, side and back. Hardware phones/controllers and a complete unaided campaign marathon were not tested; the scripted flow stages encounters and then uses real actions. Main-campaign volume, additional bosses/branches and separate training ladders remain the scope work in the next chunk.

The final fully equipped story benchmark records 3.3 / 4.1 ms median / p95 at the dock, 3.3 / 4.3 in cold storage, and 3.5 / 3.9 in the hangar (`after/performance.json`). A busier-host run was 4.3 / 7.6 at the dock (`after/contended-performance.json`); use the fresh-context `paired-performance.json` files for before/after comparison.

## Next chunk

Build the missing middle-act boss progression and a playable extraction: two new encounters using sound/decoys and optical puzzles, a rescue/alternate-ending branch, a vehicle escape with original nonviolent hazards, and equipment-specific revisits of earlier areas. Add distinct learning/time-attack/snooze training ladders with more authored layouts, rather than merely recolouring the same rooms. Then build AI footprint tracking and a patrol-remix replay option. Keep the same checkpoint/suspension compatibility and test every new ending and unlock before calling the full depth target complete.

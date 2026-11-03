# Tekno Fist — scope and review

Run: 2026-11-03, worktree `game-fight`, starting at live 2.64.0 / R184. No deployment, version change, live-data access or commit.

The reference is the **home-console version** of the late-1990s 3D fighter, including its extra modes and unlock loop. This pass substantially expands the existing cartridge; it does **not** claim full content parity. The [original manual, reproduced as text](https://manuals.plus/m/7b1b2db2b3232607587ce1b74d3a19b58decd8633b096721026dd036175a7d96) describes Arcade, versus, teams, Survival, Time Attack, practice and the scrolling campaign. The [platform holder’s developer interview](https://blog.playstation.com/archive/2017/06/08/extended-play-how-tekken-3-made-everybody-love-kung-fu-fighting/) identifies the home release’s ball and scrolling extras, and its animation/music emphasis. The [official product description](https://store.playstation.com/en-us/concept/10015791) confirms individual character endings and the home modes. These are scope references only: no assets, names, choreography, code or music were imported.

## Scope table

| Feature/content | Original has | Before this run | This run / remaining difference |
| --- | --- | --- | --- |
| Arcade | Full ladder, final opponents, continues and character endings | Six regular matches including rival/boss; optional challenger | **Ten matches**, plus the optional Gubbinz challenge; rival, boss, continue, individual ending, unlocks and credits. The playable King gets the mirror final promised by his ending. A separate transforming final boss is still absent. |
| Versus | Human versus human | Versus CPU | CPU choice, stage choice and rematches retained. **Local second player remains missing.** |
| Team battle | Ordered teams; survivors carry health | Absent | **1–8 unique fighters**, random CPU team, survivor health +12 recovery on either side, replacement fighters, wins/losses/draws and saved team order. Draws replace both fighters. CPU opponent only. |
| Survival | Endless single-round opponents with health recovery | Present | Preserved; shared normal difficulty, fixed 40-second rounds, +30 energy, best streak and stage unlock. |
| Time Attack | Complete ladder against a common clock/rules | Six fights; clock included pause and menu time | **Ten single-round fights**, common normal difficulty / 40-second rounds; only active combat adds to the run clock. The old six-fight `ta` record survives; new ten-fight records use additive `ta10`. |
| Practice | Opponent choice, command learning and dummy controls | Training with five dummy choices and move list | Preserved; tested normal hits, guard, launcher, sidestep, jump, throw and recovery. Input recording, playback and guided lessons remain absent. |
| Ball bonus | Combat moves charge/return a ball | Absent | **Fist Ball**, unlocked by an Arcade ending: Beach / Moon / Biscuit balls, separate gravity/speed, charged returns, CPU rallies, floor/body damage, records, rounds, rematch and airborne save recovery. Single-player; bonus rounds omit the normal fight replay. |
| Scrolling bonus | Campaign through several areas with crowds and bosses | Absent | **Absent — next major chunk.** Must be a genuine scrolling campaign, not a chain of ordinary duels. |
| Roster | Core roster plus numerous secret identities and forms | Ten starters + Gubbinz + Tekno King | **12 fighters retained**, existing IDs untouched. Roster volume still falls short; no filler recolours were added. |
| Move volume | Large individual move sets, distinctive stances and strings | Shared normals plus individual attacks, strings, three specials and two throws | Preserved and exercised. More individual stance/move depth is still needed. |
| Arenas | Distinct home arenas and practice | Nine arenas + training grid | All nine photographed; rendered sign text fits; softer contact shadows, painted faces, cached trails. No new arena this pass. |
| Endings / theatre | Individual endings and viewing extras | Twelve text/pose endings, no viewer or credits | **Ending theatre**, earned endings only, no repeated rewards; Cast-based credits and a solid golden cup. These remain original real-time tableaux rather than animated films. |
| Secrets / costumes | Continued play reveals extra content | Two secret fighters, costumes, secret stage and menu codes | Preserved; Ball added to the reward chain. Big heads, disco trails and all-fighter code retained. A longer unlock ladder needs the expanded roster/campaign. |
| Input | Four limb buttons, direction/guard, pad play | Keyboard and pad buttons; analogue movement ignored | **Analogue movement and dash/parry flicks fixed**, stick menu navigation/repeat added, existing ★ / @ / # / ~ legends retained; house Q/T/Esc ownership preserved. |
| Memory card | Persistent options and earned content | v1 options/unlocks/endings/high scores; no live match recovery | Additive `live` checkpoint on the **same v1 `rm.ps.fight` card**. Attack, throw references, teams, menus, ball trajectory and compressed replay survive; recovered combat waits in Pause. Existing names, scores, unlocks, endings and unknown fields remain intact. |
| Presentation | Attract sequence, clear menus, impact timing, music | Attract CPU fight, procedural music/sfx, clipped text, hard shadows | R184 spacing/bounds, real card detection, bounded full lettering, wrapped descriptions, legible saving panel, credits, result-camera cut, frozen pause clocks/effects and original synthesized sound retained. No speech/TTS. |

## Harsh critique and iteration

Baseline ranking:

1. **High — incomplete session persistence.** Refresh abandoned the active match/run. Replaced with an additive checkpoint and GameSave lifecycle integration; tested through attacks, throws, replay, selection, story, continues, credits, teams and full document reload.
2. **High — content loop was too short.** Team battle, the bonus ball game, theatre and credits were absent; Arcade/Time Attack were short. Those chunks are now implemented. The campaign, roster and local multiplayer gaps remain explicit scope work above.
3. **Medium — real gamepad analogue movement failed.** The room test exposed that the pad axes only reached the weapon-fighter input path. Tekno now uses the stick for movement and menu selection, including directional flicks.
4. **Medium — lettering was crowded.** R184 had already received a partial baseline fix. Added more separation, safe complete heading bounds, accurate existing-card detection, a wider saving notice, bounded select labels and wrapped footer text. No titles are truncated. The two longest prologues now have enough panel height, and their continue prompt sits below the copy. Two future-year ending jokes now stay within 1999; ending IDs and earned flags stay the same.
5. **Medium — pause and replay presentation mutated during drawing.** Message/flash clocks now run in simulation; pause freezes the simulation clock, shake, trails and arena motion. Replays restore their index and compressed poses, with sub-pixel quantisation.
6. **Low — hard circular shadows, redundant 3D face detail and allocations.** Soft procedural contact shadows replace discs; features stay painted; trail meshes are cached with their fighter models. A solid cup gives the ending pose the object its story describes.
7. **Medium found in the second art pass — ball results could blend the camera through a body.** Result entry now places the camera outside the fighters immediately. Versus-card actors are also positioned before disc loading, instead of waiting for a frame-one callback that loading had already skipped.

The next pass must address the missing campaign/content volume before calling the cartridge a full counterpart. Within the implemented modes, final test and visual-review status is recorded below; unresolved failures must stay listed rather than being described as polish completion.

## Save design and compatibility

The cartridge save format stays **v1**. Existing `unl`, `cos`, `st`, `end`, `hi`, `ta`, `sv`, options and unrecognised fields are merged, never reset or reseeded. Only a new card gets Cast-based score entries; authored legacy initials remain the player's data. A completed result refreshes as a result; explicit **Play again** starts a fresh go while preserving earned content.

Geometry, materials and pose caches are rebuilt from stable fighter IDs. References between thrower/victim and winner/loser reconnect to rebuilt actors. Replay data uses original delta, zero-run and back-reference coding so the full recorder fits the 20 KB roaming-card boundary in the regression. Physics numbers use 1/10,000 precision; replay joints use 1/1,000. Particle clouds and already-played sound tails are cosmetic and are not replayed on refresh. A restored fight is paused until an explicit resume; it does not automatically open a new scoring window.

The live checkpoint registers with the existing GameSave flush lifecycle, so logoff and explicit flushes see current state, as do browser unload and cartridge close. Ordinary profile autosaves see the cartridge’s two-second checkpoints; the room test explicitly flushes and waits for JackNet’s save acknowledgement. Economy and server earn paths are unchanged. Expanded modes/persistence are opted in by Tekno’s config. The other actual fight-kit consumer, Soul Sabre, retains its modes and save schema. Street Scrapper II has its own engine in `rm-g-scrap.js`; its production physical-screen path is still tested as requested.

## Test and capture recipe

`node tests/games/fight.mjs` owns a disposable server on 18080–18099, creates only throwaway accounts/data, closes one browser before starting another and kills only its own server PID. `--native` skips the room; `--room-only` runs integration; `--flows` skips the arena/model gallery; `--ball` focuses the bonus mode. `--before --native` uses the original two scripts from `/tmp/fight-before/` for this run's comparison. Browser inputs drive movement, attacks, menu choices, guard, jumps, throws and the first Arcade victory. Existing encounter hooks bound later KOs; this is **not** a claim of an unaided human tournament clear. The pad is simulated through the real console polling path; phone controls use DevTools touch events.

Captures: `tests/shots/games/fight/before/` and `after/`. Native composites are 320×240. Full screenshots include 1366×860 desktop, 1024×768, phone portrait/landscape and tablet portrait/landscape. Each fighter has a six-angle contact sheet; each arena has a start view. Sequences cover attacks and the bonus ball. Room captures show the physical telly, LOCK IN, global pause, gamepad pause, touch controls and refresh. General phone/tablet regression captures are under `tests/shots/mobile/`.

Performance artifacts: `performance.json` (same fixed arena, fighters and camera before/after) and `combat-performance.json` (active practice, including periodic saves). Samples include update, draw and `gl.finish()` at native resolution on Chromium/SwiftShader; they exclude the house and are not hardware-FPS claims. Room checks may use `FIXTURE_RASTER_RATIO=.35` to cap house software raster cost; the game still renders at 320×240 and layout/input use full CSS viewport sizes.

Verification in this run:

| Command | Observed result |
| --- | --- |
| `FIXTURE_RASTER_RATIO=.35 node tests/games/fight.mjs` | Exit 0: native progression/gallery plus real-room integration; newer record/art assertions receive a focused rerun below. |
| `node tests/games/fight.mjs --before --native` | Exit 0: baseline captures, combat inputs, all arenas and all model sheets. |
| `node tests/fixes3-unit.cjs` | Exit 0: existing controller-symbol/font and identity regressions. |
| `node --check` on both cartridge JS files and the new test | Exit 0. |
| `git diff --check` | Exit 0 after removing one trailing space. |
| Source brand/name/controller-symbol/future-date audit of the two game scripts | Exit 0: zero prohibited matches; rendered lettering and model sheets reviewed. |
| `FIXTURE_RASTER_RATIO=.35 node tests/smoke.mjs` | Exit 1, 11/12: walking-refresh timed out with the house loading layer still present; this occurred before a fighting cartridge was loaded. Console, other controls, browser errors and server log passed. |
| `FIXTURE_RASTER_RATIO=.35 SMOKE_SCALE=3 node tests/smoke.mjs --only=walk-refresh --keep-shots` | Exit 0: isolated rerun, 1/1; walking-refresh took 69.5 seconds. |
| `FIXTURE_RASTER_RATIO=.35 SMOKE_SCALE=3 node tests/smoke.mjs --keep-shots` | Exit 0, **12/12**, browser errors/server log clean. |
| `node tests/mobile.mjs http://127.0.0.1:18080 --only=full,tablet --throttle=1` | Exit 0, **2/2**: full phone path 466 s, tablet 153 s; real touch, portrait/landscape and captures reviewed. The URL was an owned disposable server. |
| `FIXTURE_RASTER_RATIO=.35 node tests/console-fallback-frame.mjs http://127.0.0.1:18080` | Exit 0: existing Street Scrapper physical-TV regression in six sizes, Q/resume and same cartridge instance. Captures moved into `after/shared-fallback/`. Temporary server log clean. |
| `node tests/games/fight.mjs --before --native --flows` | Exit 0: final comparable baseline sample. |
| `node tests/games/fight.mjs --native --flows` | Exit 0: latest options/record preservation, old-card boot, longest prologues, team wins/losses/draws, three different ball models/materials, locked bonus, full progression, mirror boss and refresh/replay checks. |
| `FIXTURE_RASTER_RATIO=.35 node tests/games/fight.mjs --room-only` | Exit 0: latest analogue menu navigation, explicit JackNet save receipt, same-cartridge LOCK IN, phone touch controls, refresh, Street Scrapper and Soul Sabre weapon combat/pause/card checks. |

The final native rerun also passed the King’s distinct-model/costume mirror final and its saved recovery.

| Native 320×240 SwiftShader sample | Before | After |
| --- | ---: | ---: |
| Fixed arena update/draw/GPU-finish median | 0.30 ms | 0.60 ms |
| Fixed arena p95 / max | 0.50 / 1.20 ms | 0.90 / 0.90 ms |
| Active practice median | 0.60 ms | 0.80 ms |
| Active practice p95 / max | 2.70 / 5.20 ms | 1.60 / 8.80 ms |
| Practice card size | 419 bytes | 7,813 bytes including the live checkpoint/recorder |
| Fixed arena draw calls / triangles | 16 / 5,940 | 16 / 5,888 |

The after sample includes periodic live saves; the before engine did not have them. Both stay within a 16.7 ms native-frame budget in these samples. Shared-host timing varies, so these numbers establish a retained budget, not a promised speedup or full-house/hardware FPS. Real phone/tablet GPU performance, physical controllers, every character/costume matchup, every special/throw, every menu code and an uninterrupted human clear were not exhaustively verified. The captured model sheets and arena shots were visually reviewed.

## Next chunk

Build **Fist Force** as four substantial scrolling areas with three-dimensional traversal, multiple simultaneous readable enemies, recovery snacks, stage bosses, an ending and repeated-clear keys that unlock an original secret fighter. Save each wave, pickup, boss state and key. Add a second final-boss form and distinct new fighters/move sets, then local two-pad play. Keep all existing IDs and card fields. A further presentation pass can add a choreographed martial-arts attract routine, authored ending animation and richer original percussion/announcer stings without speech synthesis.

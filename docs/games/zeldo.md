# The Myth of Zeldo: A Link to the Pasta

## Scope ledger — 26 October 2026, start of this run

The reference is the full 1991–92 16-bit action adventure. This cartridge currently has a complete short adventure, not the reference game's campaign volume. All code, maps, sprites, melodies and dialogue are original kitchen-themed parody work.

| Feature/content | Original has | We have at start of run |
| --- | --- | --- |
| Campaign | Opening rescue, three early dungeons, alternate-world quest, seven later dungeons, final tower and ending | Home opening, nine overworld screens, one 11-room dungeon, two bosses, feast/credits |
| Worlds | Large light and dark worlds, interconnected routes | One 3 × 3 overworld; no alternate world |
| Dungeon progression | 8+ themed dungeons; local maps, compasses, keys, signature equipment and bosses | Colander Keep, map/compass/small and big keys, crystals, blocks, breadstick boomerang |
| Equipment | Many tools that change exploration; several sword/shield upgrades | Sword/shield, charged spin, bombs, boomerang, one soup bottle; no upgrades |
| Combat | Directional arcs, stun, knockback, invulnerability, varied bosses | Arc/spin combat, knockback, shield reflection, stun; Big Cheese and Meatballo |
| Side content | Villages, shops, caves, heart pieces, secret walls/trees, optional challenges | Village with shop and NPCs, caves, four heart pieces, bomb walls and push grave |
| Presentation | Pixel art, scrolling screens, layered music, file menu, maps, ending | Original 256 × 224 pixel art and music, scrolling, three files, menus, feast/credits |
| Persistence | Durable progression and sensible continue points | Saves on room entry/menu and some rewards; no automatic active-file restore; transient puzzle/combat refresh needs audit |
| Controls | Controller movement, sword, contextual action, item, pause/map | Shared console keyboard/gamepad/touch controls; prompts use controller labels even on keyboard |
| Verification | Full campaign, secrets and boss routes | No dedicated Zeldo regression at start |

## Run plan

First capture and critique the existing cartridge. Prioritise durable continuation and a substantial second chapter: alternate-world exploration, a fully keyed themed dungeon, a new tool and boss, and a meaningful sword upgrade. Preserve old files and the existing ending. Test actual input decisions, puzzle routes, combat, save/reload, menus, the room telly, LOCK IN and software rendering cost. Record the exact delivered depth and remaining campaign gap below before finishing.

## Next chunk

After the delivered chapter is verified, expand toward the full 8+ dungeon campaign with individually designed puzzle identities and equipment gates. Do not count palette swaps or empty rooms as completed dungeons.

## Delivered in this run

**The Second Helping** continues after the original feast. The village well leads to the Salt-Beyond, with nine original overworld screens, a second shop and the Al Dente Forge. The 12-room Ravioli Reservoir has its own keys, map, compass and big key. Its armoury block puzzle awards the Ravioli Recurve; arrows operate a sluice, reveal a key and expose Count Crouton's jam eye. A bombable larder and twin weighing plates provide optional and required branches. The two-phase boss opens the Ovenheart shrine; the forge turns Grandad's sword into the Al Dente Blade and grants Oven Boots, followed by a second feast/credits/results sequence. The boots reveal an additional tree secret after the ending.

The old Keep inventory remains in its original save fields; switching dungeons stashes and restores each local inventory. Version 1 files, names, default mate files, flags, balances, doors, collected treasures and the original ending remain compatible. The new campaign uses in-game gems only; shared score reporting still goes through the existing server rate/cap checks.

| Feature/content | Original has | We have after this run |
| --- | --- | --- |
| Campaign volume | Full multi-stage quest with 8+ themed dungeons and final areas | Two complete chapters/endings; **2 dungeons, 23 dungeon rooms**. The full campaign target is still outstanding. |
| Worlds | Large light and alternate overworlds | Two connected 3 × 3 overworlds, **18 outdoor screens**, plus 8 interiors/caves; 49 screens total |
| Dungeon identities | Many distinct tools, puzzles, bosses and local treasure sets | 11-room Colander Keep and 12-room Ravioli Reservoir; separate maps/compasses/keys, block/crystal/plate/arrow puzzles; 3 boss encounters including the original mini-boss |
| Equipment | Broad tool collection, several sword/shield tiers, bottles and upgrades | Five selectable tools: boomerang, bombs, soup, bow, boots; two sword tiers, one shield, one refillable bottle |
| Exploration rewards | Many heart pieces, containers, secret walls/trees and side quests | 9 heart pieces across both chapters, 3 boss containers, bomb secrets, push grave, boomerang island retrievals, dash tree, two shops and forge quest |
| Combat feel | Directional sword arcs, charge/spin, shield, stun, knockback, i-frames | Existing arcs/spin/shield plus normalized diagonal movement, analog-stick walking, a short sword input buffer and three-frame impact stops; Crouton has telegraphed swoops, volleys, an arrow-only opening and a faster second phase |
| Presentation | Detailed pixel environments, attract animation, menus, maps, music and credits | Original native 256 × 224 art, teal/brass aqueduct architecture, custom toasted-moth sprites, arrow/eye/boot/coal art, two new original music loops, expanded item menu and second ending |
| Physical display | Game plays on the console TV | Zeldo opts into the cupboard CRT via a backwards-compatible screen hook; camera frames the entire set; T keeps the same cartridge instance and native shape |
| Devices | Controller and responsive modern hosting | Keyboard, standard gamepad buttons/analog stick, original controller-style touch pad; portrait/landscape/tablet layouts reserve space outside the game image |
| Persistence | Durable progression and continuation | Active-file restore, half-second snapshots plus pagehide/visibility/close flushes, tiles/push blocks/bombs/projectiles/enemy phases/inventory/menu/map/death/credits; foreground/background physical-display sessions use an account-bound tab record as well as the shared session record, and wait for room artwork/profile readiness |

### Baseline correction

The original source contains **11** Keep rooms (there is no `d2`), not 12. The initial scope estimate above has been corrected to match the room registry. No additional rooms are counted for recolours, animation frames or credits scenes.

## Critique and ranking

| Priority at start | Harsh finding | Result of this pass |
| --- | --- | --- |
| High | One small dungeon cannot stand in for the remembered full campaign. | A substantial, fully connected second chapter added; **the 8+ dungeon/content-volume gap remains high priority for subsequent runs**. |
| High | Continue files existed, but refreshing did not resume the active cartridge; transient puzzles and consumables were vulnerable. | Settled progression and live room state persist. Reward grants are atomic, soup heals before its animation, and restoring a trap re-draws its solid shutters. Scripted dialogue resumes at a safe settled state rather than serializing generators. Opening fades now advance on the fixed simulation clock, so slow rendering cannot leave the world dark. |
| High | The Super Ultra used a detached overlay instead of the real cupboard screen. | Opt-in physical surface, same-instance LOCK IN/lean-back, camera framing, clean cartridge ejection and surface-session restore. Other cartridges keep their existing route. |
| Medium | The expanded adventure needs genuine tool gates, not just more rooms with enemies. | Earned bow → arrow sluice → second small key → weighted big-key vault → arrow-exposed boss → forge upgrade → dash secret. |
| Medium | Uniform grey stone made rooms feel like one long cellar. | A distinct aqueduct palette, brass cornices, floor mosaics, blue channels and eye-operated bridges. |
| Medium | Keyboard prompts displayed controller letters; analog movement and phone controls were incomplete. | Device-aware prompts, analog stick, diagonal normalization and a cartridge-owned touch controller. |
| Low | Sword impacts lacked a crisp pause and fast follow-up presses could be lost. | Three-frame impact stop and six-frame sword input buffer; damage, knockback and invulnerability remain separate. |

Assessment against the full reference: presentation and core feel are substantially stronger; campaign depth is still the limiting factor. This is a complete additional chapter, not a claim that the full reference scope has been reached. Racing lines, rubber-banding, karts and character selection are not applicable; this game's equivalents are file/name selection, enemy pursuit, boss tells and equipment selection.

## Verification and captures

Run from the repository root, with a disposable server started in the same shell:

```sh
(cd app && exec env PORT=18094 DATA_DIR=/tmp/zeldo-review ADMIN_TOKEN=testtoken node server.js > /tmp/zeldo-review.log 2>&1) & server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
sleep 2
node tests/games/zeldo.mjs http://localhost:18094
```

`--native` runs the isolated cartridge route without the house; `--room-only` runs console/device checks; `--before` loads the repository baseline (or `ZELDO_BASELINE`) for comparable captures. Branch fixtures use the existing cartridge debug placement API and a completed first-chapter save. Movement, fights, menu decisions, block pushes, bow shots, bombs, locks and rewards use browser inputs. This is not an uninterrupted, unaided completion of the original Keep.

Captures go to `tests/shots/games/zeldo/` (ignored generated artifacts):

- Before/after title, attract animation, files, naming, opening, sword reward, village, inventory, map and Keep/Cheese room.
- Every new outdoor screen and all 12 Reservoir room starts; local map/compass, armoury bow, arrow frames, sluice, bomb secret, plates/big key, each Crouton phase, Ovenheart, forge feast, credits, results and dash secret.
- `after-in-room-title.png`, `after-in-room-game.png`, `after-lean-back.png`, LOCK IN, pause, phone-sized portrait/landscape and tablet views; `after-shared-formula-null.png` checks an unchanged Super Ultra cartridge.
- `after-touch-portrait.png`, `after-touch-landscape.png`, `after-touch-tablet.png`, `after-touch-items.png`; controller movement and menu/map interaction use touch input.
- `after-refresh-running.png` and `after-refresh-background.png` cover physical-display session restoration.

Baseline software Chromium native update/draw cost: **0.20 ms median / 0.30 ms p95** at 256 × 224. Measurements include cartridge simulation, canvas drawing and persistence; they exclude 3D house rendering. Later samples varied with host load (roughly 0.10–0.20 ms median / 0.20–1.00 ms p95). The final full cartridge run measured **0.20 ms median / 0.70 ms p95**, versus the initial baseline **0.20 / 0.30 ms**. Exact results are recorded in `before-performance.json` and `after-performance.json`; these are CPU timings, not claims of hardware FPS. Large isolated maxima include scheduling/GC stalls.

## Next chunk to build

1. Add a third fully designed dungeon beyond the Salt-Beyond forge, with a grappling kitchen tool and vertical/floodgate route identity. Use the existing `dg` namespace and per-dungeon inventory instead of adding global key flags.
2. Connect the new tool to multiple existing overworld secrets and a meaningful route to the next chapter. Expand the overworld beyond the present 18 screens, with distinct settlements and optional quest chains.
3. Continue toward at least eight substantial themed dungeons, with individually designed tools/bosses, several sword/shield tiers, more bottles, more heart pieces and a final multi-dungeon resolution. Avoid counting reskins or empty connecting rooms as completed content.
4. The host's real handheld user-agent entry still routes to JackOS (`pc-only.js`/`mobile-desktop.js`). Zeldo's touch controls are exercised in a touch-capable Chromium house session; enabling the whole house on actual phone entry is a separate host-policy migration outside this cartridge's scope.

## Remaining verification limits

Physical gamepad hardware, real phone/tablet GPUs and subjective music listening are not covered by browser automation. Full old-Keep completion and every optional secret have not been re-played end to end. The final report records smoke gate results and any unresolved physical-session checks honestly.

## Final verification record

- `node tests/games/zeldo.mjs http://localhost:18094` — **exit 0**, full native chapter route, all room starts, real inventory selection, both boss phases, heart container, forge/ending, physical CRT/LOCK IN/Q/pause, analog standard-pad simulation, touch inputs/layouts, foreground and background page refresh, preserved standing pose/PC power and unchanged Formula Null cartridge path. Throwaway server log: no mod-load failures or runtime errors.
- `node --check` on all three changed application JavaScript files and the cartridge test; `git diff --check` — **exit 0**.
- Stock `node tests/smoke.mjs` attempts reached **11/12** with no browser-error or server-log failures; the remaining mobile-desktop check timed out. Higher `SMOKE_SCALE` retries also hit the runner's fixed eight-second action / twenty-second navigation limits under a host load of roughly 28–65 on 12 CPUs. These are recorded failures, not a green stock gate. A separate diagnostic scaled those nested defaults consistently with the runner's documented scaling setting. It completed **11/12**, including mobile-desktop; pc-controls encountered an execution-context/navigation race. All browser-error and server-log checks passed. The stock runner itself was not edited.

No deployment, version bump, changelog edit, commit, push, live-data access or container changes were performed.

Final unmodified gate attempt: `node tests/smoke.mjs` — **exit 1, 11/12**. All house/PC/console/control/canonical/browser-error/server-log checks passed; mobile-desktop exceeded its 25-second check budget. The gate remains unverified as a complete green run. No smoke assertions or repository smoke-runner settings were changed.

# The Myth of Zeldo: A Link to the Pasta

## Current scope — pass 2, 10 November 2026

The reference is the full 1991–92 action adventure. This original kitchen parody now has four substantial dungeons; it still falls short of that reference's complete campaign. All maps, sprites, dialogue, melodies and effects are authored here. Human names come from Cast. The approved series name stays **The Myth of Zeldo**; the separate Temporal Flute design does not change this cartridge's native pixel presentation.

| Feature | Reference scope | Current cartridge |
| --- | --- | --- |
| Campaign | Opening, three early dungeons, alternate-world quest, seven later dungeons, final tower and ending | Home rescue, Salt-Beyond forge, Tidebell expedition and **Cold Pantry/Living Starter chapter**. Two feast/credits sequences; third and fourth chapter resolutions. Full campaign remains outstanding. |
| Worlds | Large interconnected light/alternate worlds and settlements | **30 outdoor screens**: nine daylight, fifteen Salt-Beyond, six cold-region screens. **17 interiors/caves**. Farfalle, Salt counterpart, Scouring Quay and the Last Crust bakery settlement. |
| Dungeons | Many distinct dungeons with local treasure, keys and tools | **4 dungeons / 50 rooms**: Colander Keep 11, Ravioli Reservoir 12, Pothook Pumpworks 13, **Cold Pantry 14**. **97 authored screens total**; animation frames and credits do not count. |
| Local inventory | Dungeon maps, compasses, small/big keys | Each dungeon owns all four. Cold Pantry thermal flues, foil orientations, melted ice and weight gates use `S.dungeons.pantry.puzzles`. Existing `dg` room namespace and inventory swapping remain intact. |
| Equipment | New tools change puzzles, combat and old exploration | Boomerang, bombs, minestrone, Ravioli Recurve, Oven Boots, Spool Spork and **Cayenne Caster**. The Caster melts sugar ice, heats pans, reflects from turnable foil and damages small enemies. Enchanted pepper needs no ammunition. |
| Combat/upgrades | Directional sword/shields, varied enemies/bosses, equipment tiers | Directional swings, charged spins, knockback and i-frames; **5 boss encounters including the original mini-boss**. **Three sword tiers**, optional Tinned Apron armour, **two independently usable/refillable soup vessels**. |
| Secrets/quests | Heart pieces, containers, caves, delivery chains, shortcuts | **17 heart pieces, 5 boss containers**, bomb walls, graves, dash trees, Spork islands, forge/mender chain and insulated-lid delivery. **Twelve-heart cap**. Existing rewards retain IDs; four new pieces extend the campaign. |
| Presentation | Readable sprites, area music, maps and cues | Native **256 × 224**, crisp pixels, no blur/options. Cold storage tiles, copper flues, foil, tin weights, sugar ice and original frozen-trifle boss. New cold-dungeon, bakery/road and boss melodies; layered heat/rotation/melt/reward cues. |
| Inputs | Keyboard/controller movement, sword, action, selected tool, map/menu | Existing keyboard, standard pad and cartridge touch controller. Distinct repeated action edges queue through animation/hit stop; all three rapid heat puffs fire. Mid-slide/projectile/boss/menu states pause and restore. Q/T retain house behavior. |
| Saves | Compatible durable files and exact continuation | Three version-1 files remain compatible. Additive Caster/flask defaults and old item-menu action-row migration; old vessels never refill during migration. Melted caves and the north-wall passage merge into older live terrain without moving unaffected saved poses. Earlier one-time Spork terrain migration remains. Rewards commit before fanfare. |
| Physical display/devices | Native console screen and portable controls | Real cupboard CRT, same-instance LOCK IN/Q; touch layouts reserve space outside the image in portrait, landscape and tablet. No shared house/display/input modules changed. |

## Delivered: the Cold Pantry

The Cooler Road's north-wall passage leads to the Chilly Doormat. Paths connect the Last Crust bakery and supplies shop, Icing Orchard, the Cold Pantry entrance and the Jammed Flue. Returning through the doormat leads back to the established Cooler Road ferry. The expanded map has its own six-screen region, rather than shrinking the already crowded Salt-Beyond map.

The dungeon's identity is **cold storage and directed heat**, with a loop and an earned return shortcut:

1. **Frosted Door → Labelled Aisles:** a west combat branch earns the first small key; the east Stocktake Spiral holds the map. A bombable Cold Receipts branch shows a compass behind sugar ice, giving a reason to return with the new tool.
2. **Chilling Crossroads → Pepper Mill Vault:** push a storage weight onto its brass track. It glides several squares and is caught by the weighing plate. The open vault awards the **Cayenne Caster**. Leaving and returning resets an unsolved arrangement; earned gates persist.
3. **First Warm Flue:** a visible ice curtain blocks the warming pan. One hot puff makes a passage; a second lights the pan and opens the north shutter. The two actions give distinct melt and flue feedback. The tool is unlimited so experimentation cannot consume the route's only ammunition.
4. **Polished Foil:** the next pan is enclosed behind shelves. Its foil starts facing the wrong way. ACTION turns it; an upward puff reflects right into the remote pan and opens the second small-key vault. The key pays for the west lock.
5. **Warm Return:** heat the pan to open a shortcut back down to the Crossroads. The return works in both directions. The boss's big-key door is visible here before its key is found.
6. **Gliding Weights:** slide two weights onto separate plates, warm the icy landing, then switch to the **Spool Spork** to reach the big-key shelf. A return ring prevents stranding. The old tool remains useful after the new one arrives.
7. **Double Fold:** a bombable optional room asks for two deliberately turned foil reflectors. Direct access to the remote pan is walled off. Correctly routed heat opens a heart-piece vault; it rewards understanding the tool rather than merely owning it.
8. **Grand Glace:** a giant frozen trifle commits its frosting lane before firing. Lane marks and a cue precede the volley; they do not follow the player. After pouring it clears its projectiles and exposes the crown. **Two hot puffs**, then sword attacks on the softened custard. The crown cracks after the first puff, with a readable remaining-puff cue. At half health, Double Scoop adds lanes and shortens cooling; every cycle retains a tell and a punish window.
9. The boss leaves a once-only heart container and opens the east **Living Starter** shrine. Bring the Starter to the Last Crust baker for the **Smoulder Blade** (three damage per ordinary sword hit) and a raised bread bridge across the Jammed Flue.
10. The bridge reaches the **Proving Grounds**, supplies and the bread-lift post. Riding the lift unlocks a two-way daylight shortcut. The next expedition is named on the post's sign and in dialogue, but **the Sourdough Foundry is not yet a playable dungeon**.

## Familiar places reward a second look

- **Crouton Grove:** a sugar-iced opening in the old tree wall hides a new heart piece. Its mouth replaces an already impassable tile, so old saved positions remain valid.
- **Salt Flats:** lift the rock below the iced cliff mouth, then melt it. A second heart-piece cave rewards combining an old action with the new tool. The exit returns to clear ground beside the rock.
- **Spoonbill Reeds:** melt a conspicuous iced recess for the **Insulated Lid**. The baker returns the lid with a filled **second soup flask**. This optional delivery works before or after the Starter reward; neither reward can repeat.
- **Icing Orchard:** a fourth new heart piece lies behind sugar ice. Together with Double Fold and the two old-region caves, the pass adds four pieces.
- The soup item drinks the first full vessel, then the other. Each refill costs twenty gems once the original bottle is owned. Full vessels refuse another purchase. The kit shows both vessels and full/empty indicators; refresh never fills either one.

## Harsh critique against the reference

| Priority | Finding | Response / remaining gap |
| --- | --- | --- |
| High | Three dungeons did not provide the reference's campaign scale. | A fourteen-room fourth dungeon, new region and chapter resolution now exist. **Four dungeons still do not meet full reference scope.** Continue the campaign before cosmetic expansion. |
| High | Another remote switch tool could repeat the bow or Spork. | Directed heat has melt-then-warm teaching, rotatable foil, a two-reflection secret, sliding-weight staging and an old-tool combination. The boss requires two timed heat hits before sword damage. |
| Medium | An item corridor without circulation becomes a chore to backtrack. | Early side branches, upper key loop, warm return shortcut, returning compass branch, optional folded-heat vault and two-way overworld shortcuts. Actual thresholds are exercised, not just room-start placements. |
| Medium | Cold effects can conceal unfair attacks. | Fixed lane warning, sharp projectiles, contrasting warm crown, cleared projectiles during vulnerability, audible cues and explicit first/second puff feedback. Native art has no blur. |
| High | Added terrain and bottle slots could damage old files. | Additive defaults, unchanged legacy IDs, explicit entry/ice merging on restore, no automatic refills, per-dungeon state, exact mid-slide/heat/boss saves and once-only rewards. Legacy fixtures retain pose, names, balances and inactive saves, and load genuine older live terrain for all four newly modified entrance screens. |
| Medium | A larger item menu could lose controls or cover text. | Seven tools fit three rows; actions remain in a separate row. Keyboard, simulated pad and touch exercise the new tool. Kit, quest and dungeon information remain readable at native resolution. |
| Remaining | Salt-Beyond is an authored alternate region, not a full reversible paired-world system. | Do not claim an implemented world-shift campaign. Plan paired geography and persistent cross-world consequences in the next campaign chunk. |

## Verification protocol and captures

Run one browser at a time through the required wrapper:

```sh
CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo <label> games/zeldo.mjs
```

This machine's wrapper delegates port choice to `~/bin/freeport`, which normally chooses an arbitrary ephemeral port. For the final run, `BASH_ENV=/tmp/zeldo-p2-portenv` overrides only that shell command with a free port in **18080–18099**. The wrapper still starts its disposable `/tmp` server and test together, then kills its own server PID. Smoke/mobile use their existing self-managed throwaway servers with no URL. The initial baseline and first three focused diagnostics used the wrapper's default ephemeral ports; all later browser runs use the required port range.

The complete gate includes older chapters, legacy files/terrain migration, the new chapter, physical cartridge insertion and its **gold placement ghost**, CRT/LOCK IN/Q, pause, foreground/background refresh, cartridge ejection/change, simulated pad and touch at phone/tablet sizes. `--cold-only --native` is the new focused diagnostic, not a substitute for complete gates. Room-start fixtures seed completed chapters and place the player near branches; keys, locks, movement, puzzles, equipment, combat, rewards and actual threshold checks use browser inputs. This is not an uninterrupted unaided campaign play-through.

Captures are in `tests/shots/games/zeldo/`:

- Before: `pass2-before-{title,menu,keep-start}-native.png`, `pass2-before-performance.json`.
- Region: `after-cold-world-k_*-native.png`, `after-cold-region-map-native.png`, `after-rising-road-native.png`.
- Every new room: `after-cold-start-f*-native.png`.
- Tool/puzzles: `after-cayenne-caster-native.png`, `after-cold-sliding-weight-native.png`, `after-cold-first-flue-native.png`, `after-cold-foil-turn-native.png`, `after-cold-double-fold-native.png`, `after-cold-big-key-native.png`, `after-cold-map-native.png`.
- Boss/rewards: `after-glace-*-native.png`, `after-living-starter-native.png`, `after-smoulder-blade-native.png`, `after-cold-heart-container-native.png`, `after-cold-complete-kit-native.png`.
- Optional: `after-heat-secret-k_cave_*-native.png`, `after-second-soup-flask-native.png`.
- Devices/display: `after-gamepad-caster.png`, `after-touch-caster.png`, `after-touch-cold-kit.png`, `after-touch-{portrait,landscape,tablet}.png`, `after-in-room-game.png`, `after-lock-in.png`, `after-refresh-{running,background}.png`.

Pass-2 baseline native CPU time: **0.10 ms median / 0.20 ms p95**. Focused fourth-chapter sample: **0.20 / 0.70 ms** meadow and **0.20 / 0.50 ms** active Grand Glace. These are 256 × 224 update/draw CPU samples in software Chromium, including save work; they exclude the house and are not hardware FPS measurements. Host scheduling and GC affect maxima. Final complete-gate timings/results are recorded below.

## Next chunk

1. **Sourdough Foundry:** a fifth substantial dungeon reached from the Proving Grounds. Aim for 14–16 rooms around proofing lifts, kneading machinery and oven bays. A **Bun Bouncer** kneading mallet can compress dough pads for committed launches, flatten soft barriers and stun armoured foes; teach safe launches before combining them with old tools. Design its own boss, local map/compass/keys/container and an earned return loop rather than reusing the Pantry's heat switches. Keep all dungeon keys/maps local.
2. Develop the alternate-world campaign into genuinely paired spaces: one reversible world-shift mechanism, consequences that change a route in its counterpart, safe return rules and old-save migration. Salt-Beyond currently supplies an alternate region, not that full system.
3. Continue toward at least eight distinct dungeons and a final multi-dungeon resolution. Add another meaningful shield tier and further town chains as the campaign grows; four chapters and twelve hearts remain substantially below reference volume.
4. Verify uninterrupted unaided start-to-fourth-dungeon completion, real gamepad hardware, actual phone/tablet GPUs and subjective music playback. Current fixtures and software Chromium cannot establish those claims.

No deployment, commit/push, container commands, version/changelog edits or live-data access are part of this pass. The unrelated untracked `app/public/audio/voice` is untouched.

## Pass-2 test record

Final game/test source hashes and every exact command, real exit, raw log, server port and CPU sample are archived in `tests/shots/games/zeldo/verification-pass2.json`; logs are under `diagnostics/pass2-*`. The wrapper's printed inner exit is authoritative; its own shell exit can mask test failures.

Earlier diagnostic results (all retained, including failures):

| Label | Flags | Inner exit | Finding / disposition |
| --- | --- | --- | --- |
| `zeldo-p2-before` | `--before --native` | 0 | Baseline before edits. |
| `zeldo-p2-cold-dev1` | `--cold-only --native` | 1 | Driver released the push before its required charge; fixed driver to wait for the actual moving weight. |
| `zeldo-p2-cold-dev2` | `--cold-only --native` | 1 | Driver tried to keep walking during heart-container dialogue; fixed approach and dialogue handling. |
| `zeldo-p2-cold-dev3` | `--cold-only --native` | 1 | Driver approached a cliff mouth through the original rock; added real lift/throw and approach. |
| `zeldo-p2-cold-dev4` | `--cold-only --native` | 0 | Complete focused fourth chapter. |
| `zeldo-p2-cold-dev5` | `--cold-only --native` | 0 | Additional actual thresholds, paid refills and return lift. |
| `zeldo-p2-full-review` | `none` | 0 | Complete native, physical insertion/ghost, gamepad, refresh and touch review before final input/save refinements. |
| `zeldo-p2-cold-final` | `--cold-only --native` | 1 | Old-menu fixture was overwritten by the normal end flush. Corrected fixture to close first, inject the legacy snapshot, then restore. |
| `zeldo-p2-cold-final2` | `--cold-only --native` | 0 | Old action-row migration, three individually queued ITEM edges, atomic puff consumption, and scope counts. |
| `zeldo-p2-gate-1` | `none` | 0 | Review before final cave-map heading correction. |
| `zeldo-p2-gate-2` | `none` | 0 | Review before final cave-map heading correction. |
| `zeldo-p2-gate-3` | `none` | 0 | Review before final cave-map heading correction. |
| `zeldo-p2-gate-4` | `none` | 0 | Review before final cave-map heading correction. |
| `zeldo-p2-gate-5` | `none` | 0 | Review before final cave-map heading correction. |

Final **three consecutive complete passes on unchanged game/test code**:

- `BASH_ENV=/tmp/zeldo-p2-portenv CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-p2-gate-6 games/zeldo.mjs` — **exit 0**.
- `BASH_ENV=/tmp/zeldo-p2-portenv CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-p2-gate-7 games/zeldo.mjs` — **exit 0**.
- `BASH_ENV=/tmp/zeldo-p2-portenv CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-p2-gate-8 games/zeldo.mjs` — **exit 0**.

Each complete run includes the old chapters, all fourteen new rooms, actual thresholds and exits, both local keys, the tool, map/compass/big key, sliding/foil/melt puzzles, old-tool combination, fixed-lane boss/two phases/heart/Starter rewards, blade/bridge/lift, four pieces, two separately paid soup refills, true old live terrain, old menu-row migration, three queued item edges and rapid MAP closing. Physical cartridge insertion and its **gold placement ghost**, CRT/LOCK IN/Q, foreground/background refresh, another cartridge, simulated pad heat and touch heat/menus/orientation changes also pass. Browser error/warning assertions pass and final server logs have **no mod-load failures**.

- `BASH_ENV=/tmp/zeldo-p2-portenv CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-p2-cold-release games/zeldo.mjs --cold-only --native` — **exit 0**; the new focused option on the final build.
- `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` — **exit 0, 12/12**; browser-errors and server-log checks included.
- `cd tests && node mobile.mjs --only=gate` — **exit 0, 1/1** (63 seconds); phone portrait/landscape and tablet gate captures reviewed.
- `node --check app/public/js/rm-g-zeldo.js && node --check tests/games/zeldo.mjs && node --expose-internals tests/parody-audit.cjs && git diff --check` — **exit 0**, parody audit **0 authored spans**.

CPU milliseconds, median / p95 (native update/draw/save work, software Chromium; excludes the 3D house):

| Sample | Meadow | Active Grand Glace | Active Stockpot |
| --- | --- | --- | --- |
| Pass-2 baseline | 0.10 / 0.20 | Not present | Not sampled |
| Final gate 6 | 0.10 / 0.40 | 0.10 / 0.40 | 0.10 / 0.40 |
| Final gate 7 | 0.20 / 0.40 | 0.20 / 0.50 | 0.20 / 0.40 |
| Final gate 8 | 0.10 / 0.30 | 0.20 / 0.40 | 0.10 / 0.30 |

Before: **0.10 / 0.20 ms** meadow. Final gate 8: **0.10 / 0.30 ms** meadow; Grand Glace **0.20 / 0.40 ms**. Raw maxima, including scheduling/GC spikes, are retained in JSON and the logs. These are CPU timings, not real-device GPU or whole-house FPS measurements.

Final raw timing files: `after-pass2-gate-{6,7,8}-performance.json`, `after-pass2-gate-{6,7,8}-cold-performance.json`, `after-pass2-gate-{6,7,8}-pressure-performance.json`. Before captures use the preserved `pass2-before-*` prefix. Desktop native puzzles/boss/town/channel/menu and phone portrait/landscape/tablet captures were visually reviewed; controller visibility, bounds, overlap and actual MAP input after each rotation are asserted.

**Not verified:** real gamepad hardware, actual phone/tablet GPUs, subjective music listening and uninterrupted unaided start-to-fourth-dungeon completion. Cleared-boss music selection/refresh is checked programmatically. The final build remains in the working tree; no commit/deploy/version/changelog changes were made.

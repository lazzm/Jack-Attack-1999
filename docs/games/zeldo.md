# The Myth of Zeldo: A Link to the Pasta

## Current scope — depth pass, 10 November 2026

The reference is the full 1991–92 16-bit action adventure. This is an original kitchen-themed parody with three substantial dungeons, not the reference game's full campaign volume. Maps, sprites, dialogue, melodies and effects are authored here; human names come from Cast. Existing file names and legacy save identifiers remain unchanged.

| Feature/content | Reference scope | Current cartridge |
| --- | --- | --- |
| Campaign | Opening rescue, three early dungeons, alternate-world quest, seven later dungeons, final tower and ending | Home rescue, Salt-Beyond forge chapter, Scouring Quay/Tidebell chapter; two feast/credits sequences and a third chapter resolution. The full campaign remains outstanding. |
| Worlds | Large light and alternate overworlds, multiple settlements | **24 outdoor screens**: nine daylight and fifteen Salt-Beyond; **11 interiors/caves**. Farfalle, its Salt counterpart, and distinct Scouring Quay. |
| Dungeons | Many individually themed dungeons with local treasure, keys and tools | **3 dungeons, 36 rooms**: Colander Keep (11), Ravioli Reservoir (12), Pothook Pumpworks (13). **71 screens total**, including interiors and dungeons. Animation frames and credits do not count. |
| Dungeon inventory | Local maps, compasses, small and big keys | Each dungeon has its own map, compass and keys. Pumpworks floodgates and counterweights live in `S.dungeons.pumpworks.puzzles`; no global key flags. Existing Keep fields migrate through the established `activeDg` inventory swap. |
| Tool identities | Equipment changes how old and new spaces are explored | Boomerang, bombs, soup bottle, Ravioli Recurve, Oven Boots, **Spool Spork**. The Spork reels to moorings, pulls forked handles, stuns small enemies and opens Stockpot's cooling lid. |
| Combat/upgrades | Directional sword, shields, varied enemies/bosses, several equipment tiers | Directional swings, charge/spin, stun, knockback, i-frames; **4 boss encounters** including the original mini-boss. Two sword tiers and an optional Tinned Apron armour upgrade; one refillable soup bottle. |
| Exploration/quests | Heart pieces, containers, hidden caves, town chains, useful shortcuts | **13 heart pieces, 4 boss containers**, bomb walls, push grave, dash trees, mooring islands, shops/forge, bell-mender delivery chain and a two-way daylight/Cooler Road ferry. Ten-heart maximum remains appropriate to these three chapters. |
| Presentation | Readable native sprites, musical identities, dungeon maps, transitions and rewards | Native **256 × 224**, crisp pixel art with no blur/options. Copper pipes, tide gauges and lower/upper galleries distinguish Pumpworks; original quay, pump and pressure-boss music plus launch/latch/reel/flood cues. |
| Inputs | Controller movement, sword, action, selected item, menu/map | Keyboard, simulated standard pad and cartridge touch controller. Sword/action/item/map/menu edges survive short animations, hit stops and scrolling; menus freeze and save a reel in progress. Q/T remain house controls. |
| Saves | Durable progression and safe continuation | Three compatible version-1 files. Half-second snapshots, pagehide/close flush, live tool/crossing/boss/menu state. Rewards commit before presentation. Older live snapshots of modified outdoor screens rebuild terrain once; affected pre-Spork positions move to the mainland once, preserving inventory, hearts, gems and quest flags. Other old room snapshots retain puzzle state. |
| Physical display/devices | Console game presentation | Real cupboard CRT by default, same-instance LOCK IN. Portrait/landscape/tablet controller layouts reserve space outside the image. Host real-phone entry policy remains separate from this cartridge. |

## Delivered: the Tidebell route

After the Al Dente Forge awards the blade and Oven Boots, its dialogue points east. Glinting trees at the Biscuit Breakers' eastern boundary open the road to Dishcloth Marsh, Scouring Quay, the Pumpworks, Spoonbill Reeds, High Water Stairs and the Cooler Road. The expanded Salt map fits all fifteen outdoor screens.

The Pumpworks route is designed as a lower-to-upper loop across two real floors (paired A/B stairs on the map):

1. The Lower Siphon offers a west combat/key branch and an east map/compass branch. The first small key opens the Winding Landing.
2. In Spring Cutlery, pushing a physical counterweight onto its plate opens the Spool Spork vault. This introduces the tower's counterweight vocabulary in safety rather than copying the Reservoir armoury.
3. First Lift teaches the new tool across a water gap with forward and return moorings. A forked handle fills the lift, lays a central crossing and exposes the A stairs to the upper floor. Door mouths enter the lower bank; automatic collision recovery cannot put the player on the prize ledge.
4. Upper Spillway asks the player to cross, claim the second local key and use the return mooring. That key pays for the west lock into Headwater Walk.
5. The upper handle opens the B stairs down to Winding Landing; the earned shortcut works in both directions. Counterweight Loft combines two weights, a raised gate and a grapple to a big-key island. It has its own return ring. The bombable Dry Attic is an optional heart-piece branch.
6. The big key opens Admiral Stockpot's hob. A whistle and fixed lane marks precede steam; the lane stops tracking before the blast. Steam clears when the lid ring opens. Spork the ring, then strike the open pot with the sword. The second phase boils longer and cools for less time. Hits have brief feedback, while discrete action edges remain buffered.
7. The defeated pot leaves a once-only heart container and opens Tidebell Bower. Ringing the bell raises the High Water Stairs' shutters. A final grapple reaches the Cooler Road, whose ferry opens a real two-way shortcut to daylight Farfalle. The Cold Pantry is a future expedition, not a claimed fourth playable dungeon.

Every grapple destination has a clear landing and return route. Real doorway checks also caught a pre-existing collision ambiguity: `X` means a boulder outdoors but the south exit in a dungeon. All three dungeon exits now accept walking; overworld boulders stay solid, and the exit hint describes stairs. A missed shot retracts promptly; enemies can be stunned, and solid walls/shutters stop the line. During the actual reel, damage cannot strand the hero over water. Pause and refresh preserve the reel's exact position and destination.

## Old places matter again

- **Brinewater Quay:** a Spork crossing reaches the brass spindle chest; the original island heart piece keeps its save ID. A separate return mooring leads back to the mainland.
- **Daylight forest:** a mooring enclosure offers a new heart piece and retains the existing gem chest. The old enemy at the new landing has moved onto the mainland.
- **Salt Flats:** a moored little island offers a gem cache. The nearby original heart piece remains collectible under its original ID.
- **Bell mender:** accept the request in Scouring Quay's west cottage, recover the Brinewater spindle, return to fit it, ask the forge for a silent washer, and return again. The mender awards 60 gems, a heart piece and the Tinned Apron. The apron appears on the hero and in the kit panel and reduces two-point impacts to one. The complete reward commits atomically and cannot repeat after reload.

## Harsh critique against the reference

| Priority | Finding at the start of this pass | Delivered response / remaining gap |
| --- | --- | --- |
| High | Two dungeons and eighteen outdoor screens still lacked the campaign breadth of the reference. | Thirteen designed dungeon rooms, six outdoor screens, a settlement and town chain added. **The multi-dungeon campaign gap remains high priority.** This pass does not claim the full reference is finished. |
| High | A new tool must change movement and old-world exploration, not operate one isolated switch. | Spool Spork traversal, remote handles, return moorings, the boss lid, three old-world reward routes and the raised-stairs chapter route. |
| Medium | A tower needs coherent circulation, not a sequence of watery fight rooms. | Lower hub → tool → lift → upper key → counterweights → boss, with an earned lower return shortcut and an optional attic. Copper pipes/gauges and floor labels make the levels readable. |
| Medium | A pressure boss could hide its vulnerability behind steam or attack without a committed tell. | The whistle commits the lane; lane marks remain visible; the blast clears for a contrasting ring/cooling window. No homing steam during the punish window. |
| Medium | Item/action presses could disappear during hit stop or item animation. | Buffered named actions, including a regression that queues a second item press during hook retraction. Menu/map edges remain immediate. |
| Medium | New islands can trap players if an anchor's landing is water, a chest or a wall. | Every forward and return landing is exercised, including save/restore while reeling. Door entry alcoves stay on the intended bank. |
| High | Old saves could stand on ground that the new secret moats would enclose before they owned a Spork. | A one-time `terrainRev` migration moves just affected forest/Salt Flats positions to safe mainland entries. Legacy fixtures verify retained hearts, gems, sword, name and inactive file, then verify the next refresh stays put. |
| Low | Author-written default names and old dialogue bypassed Cast. | New defaults and authored dialogue/credits/epitaphs use Cast; existing file names/Hall of Fame data remain intact. |

## Verification and captures

Use the disposable-server wrapper from the repository root, one browser at a time:

```sh
CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo <label> games/zeldo.mjs
```

The required gate is three consecutive complete passes, including cartridge insertion/gold placement ghost, native chapters, physical CRT/LOCK IN/Q, shared cartridge ejection, refresh, gamepad and touch. `--native --third-only` is an additional focused diagnostic, not a substitute for the full gate. Branch fixtures seed completed prior chapters and place the player at room starts; movement, weights, locks, item selection, tool use, boss fights and rewards use real browser inputs. This is not a claim of uninterrupted unaided completion of the old Keep.

Captures are in `tests/shots/games/zeldo/`:

- Baseline: `before-title-native.png`, `before-keep-start-native.png`, `before-menu-native.png`, `before-performance.json`.
- New region: `after-quay-q_*.png`, `after-quay-road-open.png`, `after-expanded-salt-map-native.png`.
- Every new room: `after-pump-start-t*-native.png`; map/keys/counterweights/attic: `after-pump-map-native.png`, `after-pump-small-key-native.png`, `after-pump-big-key-native.png`, `after-pump-dry-attic-native.png`, `after-pump-return-stairs-native.png`.
- New tool: `after-spool-spork-found-native.png`, `after-spork-extension-native.png`, `after-spork-paused-native.png`, `after-spork-north-landing-native.png`, `after-lower-floodgate-native.png`, `after-upper-shortcut-native.png`.
- Boss/rewards: `after-stockpot-*-native.png`, `after-pump-heart-container-native.png`, `after-tidebell-native.png`, `after-high-water-route-native.png`, `after-cooler-road-arrival-native.png`.
- Old secrets/quest: `after-brinewater-spindle-native.png`, `after-old-forest-spork-secret-native.png`, `after-salt-flats-spork-secret-native.png`, `after-mender-reward-native.png`.
- Physical/device checks: `after-in-room-game.png`, `after-lock-in.png`, `after-gamepad-spork.png`, `after-touch-spork.png`, `after-touch-{portrait,landscape,tablet}.png`, `after-refresh-{running,background}.png`.

Baseline native update/draw CPU cost on this run: **0.10 ms median / 0.20 ms p95**. After the first complete third-chapter diagnostic: **0.20 / 0.60 ms**; host load and scheduling varied. These timings include cartridge drawing/simulation/save work and exclude the 3D house; they are not hardware FPS measurements. Final gate results and timing samples are recorded below. The native runner stubs audio synthesis; neither native sample includes 3D house rendering.

## Next chunk to build

1. **Cold Pantry expedition:** a fourth substantial dungeon reached from the Cooler Road. Design a cold/storage route identity and a new tool with a different movement/combat role; preserve Pumpworks' local inventory and the ferry's usefulness. Build a real next region rather than counting the current Cold Pantry dialogue as content.
2. Continue toward at least eight distinct dungeons, larger interconnected worlds and a final multi-dungeon resolution. Add further sword/shield tiers, a second usable bottle and more secrets with permanent exploration rewards. Revisit the heart cap as campaign length grows.
3. Add more authored town quest chains and multi-tool overworld loops. Keep new people Cast-backed and keep old reward/save IDs stable.
4. Complete an uninterrupted start-to-third-bell play-through, real physical gamepad testing, real phone/tablet GPU checks and a subjective audio listening pass. Real handheld user-agent entry and GPU behavior require the host device suite; this cartridge pass exercises touch-capable Chromium. Host entry routing remains outside this cartridge's scope.

No deployment, version bump, changelog edit, commit, push, container command or live-data access is part of this run.

## Diagnostic history for this pass

Each label below was run as `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo <label> games/zeldo.mjs <flags>`. Results are the inner test's real result, not the wrapper's last shell command. Intermediate failures are retained here rather than reported as passing gates.

| Label | Flags | Real result | Finding / disposition |
| --- | --- | --- | --- |
| `zeldo-before` | `--before --native` | 0 | Baseline captures and CPU timing. |
| `zeldo-native-check` | `--native` | 1 | Missing styles for newly introduced NPC roles; added original role sprites. |
| `zeldo-third-check` | `--native --third-only` | 1 | Combat driver chased rather than striking; replaced it with real charged-spin combat and retained survival/clear assertions. |
| `zeldo-third-check2` | `--native --third-only` | 1 | The queued second item press correctly fired; the diagnostic now asserts that firing and then waits for its retraction. |
| `zeldo-third-check3` | `--native --third-only` | 1 | Driver stopped below the fallen container; added the actual approach/collection input. |
| `zeldo-third-check4` | `--native --third-only` | Interrupted, 143 | No completed test verdict. |
| `zeldo-third-check5` | `--native --third-only` | 1 | Spindle chest obstructed the incoming grapple ray; moved it beside the landing. |
| `zeldo-third-check6` | `--native --third-only` | 1 | Old forest enemy occupied the new reward landing; moved it onto the mainland. |
| `zeldo-third-check7` | `--native --third-only` | 0 | Complete third-course diagnostic before the final floor/stair refinement. |
| `zeldo-full-review` | none | Interrupted, 143 | Reached physical-display foreground refresh; no completed test verdict. Subsequent long runs stayed continuously polled. |
| `zeldo-gate-1` | none | 0 | Complete native, physical display, refresh, gamepad and touch suite before the final stair refinement. |
| `zeldo-stairs-review` | `--native --third-only` | 0 | Actual A/B stairs, local inventory without global puzzle leakage, legacy migration and active-boss CPU sample. |

`--routes --native --third-only` adds real doorway approaches, lower-bank entry assertions, A-stair descent, cave entrance/exit, the attic doorway and the boss/shrine connection. It supplements the normal branch fixtures without weakening them. The final results and archived timings follow below.

Additional completed diagnostic results:

| Label | Flags | Real result | Disposition |
| --- | --- | --- | --- |
| `zeldo-gate-2`, `zeldo-gate-3`, `zeldo-gate-4` | none | 0 each | Three complete consecutive passes before the final old-terrain migration/exit review; the final build is repeated below. |
| `zeldo-routes-final` | `--native --third-only --routes` | 1 | Real door traversal exposed the `X` exit/boulder collision ambiguity. |
| `zeldo-routes-final2` | `--native --third-only --routes` | 0 | All three dungeon exits, new door banks, actual floor connections, side branches, attic and shrine; both old-moat save migrations. |

## Final verification record

- `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-gate-5 games/zeldo.mjs` — **exit 0**.
- `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-gate-6 games/zeldo.mjs` — **exit 0**.
- `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-gate-7 games/zeldo.mjs` — **exit 0**.

Those are three consecutive complete gates on the final migration/exit implementation. Each includes legacy fields/poses/balances, both prior/new chapter routes, real combat and puzzle inputs, grapple pause/refresh, boss phases, heart/Tidebell rewards, optional quest/secrets, physical cartridge insertion and its gold placement ghost, CRT/LOCK IN/Q, foreground/background refresh, standard-pad grapple, touch grapple and portrait/landscape/tablet layouts. Browser error/warning assertions pass; throwaway server logs contain no mod-load failures.

- `CMP_T=2100 ~/codex-runs/cmp.sh /opt/stacks/landing-zeldo zeldo-routes-final2 games/zeldo.mjs --native --third-only --routes` — **exit 0**; additional real door/cave/exit and stair approaches.
- `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` — **exit 0, 12/12**, including browser-errors and server-log. The smoke runner was not edited.
- `cd tests && node mobile.mjs --only=gate` — **exit 0, 1/1** (61 seconds). Phone portrait/landscape and tablet gate captures reviewed, alongside cartridge touch captures.
- `node --check app/public/js/rm-g-zeldo.js && node --check tests/games/zeldo.mjs && node --expose-internals tests/parody-audit.cjs && git diff --check` — **exit 0**; parody audit **0** authored spans.

Native timing, milliseconds (median / p95):

| Sample | Meadow update/draw | Active pressure boss update/draw |
| --- | --- | --- |
| Final gate 5 | 0.10 / 0.30 | 0.10 / 0.30 |
| Final gate 6 | 0.10 / 0.30 | 0.10 / 0.30 |
| Final gate 7 | 0.10 / 0.30 | 0.10 / 0.30 |

Baseline: **0.10 / 0.20 ms**. Final gate 7: **0.10 / 0.30 ms**, with the pressure boss also **0.10 / 0.30 ms**. Raw maxima and sample scope remain in the JSON files; isolated maxima include host scheduling/GC. These are CPU samples at native resolution, not 3D-house FPS or real-device GPU measurements.

Exact commands, every failed/interrupted intermediate diagnostic and all final exit codes are archived in `tests/shots/games/zeldo/verification.json`, with raw test logs in `diagnostics/`. Final timing samples are `after-gate-{5,6,7}-performance.json` and `after-gate-{5,6,7}-pressure-performance.json`; baseline is `before-performance.json`.

**Not verified:** physical gamepad hardware, actual phone/tablet GPUs, subjective music listening, and an uninterrupted unaided start-to-third-bell run of the old campaign. The new and prior chapters use targeted fixtures as described above. No live data, site files, version, changelog, deployment, commit, push or container commands were changed/performed. The unrelated untracked `app/public/audio/voice` was left untouched.

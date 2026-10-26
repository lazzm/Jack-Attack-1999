# Pocket Critters: Moss Version — cartridge review

All changes stay in `rm-g-mon.js`; the shared Cable Club rules, species IDs,
move keys and version-1 save format remain compatible. The test also boots
Puddle Version because both cartridges use this file.

## Ranked baseline critique

1. **High — shallow combat attrition:** unlimited moves and no persistent
   conditions removed the preparation and capture setup central to this genre.
2. **High — interrupted progress:** refresh could save a partial reward or an
   unfinished starter scene. A replacement trainer critter could inherit its
   predecessor's queued turn. Trainer names could read `undefined`.
3. **Medium — illegible information:** long battle names collided with levels,
   move descriptions competed for space, dex portraits covered list entries,
   and long dex descriptions ran below the screen.
4. **Medium — incomplete adventure framing:** the first badge rolled credits;
   the second region lacked a returning rival and usable field ability.
5. **Medium — presentation:** your critter used a mirrored front sprite, the
   title used a system font, and multi-colour art lost the four-shade identity.
6. **Low — reward ceremony:** badges needed their own artwork and fanfare scene.

## After

PP and recovery items create route attrition; sleep, static and pong offer
capture and combat tactics. Types, priority, stat stages, trainer sight,
evolutions, six-member parties and PC storage remain intact. AI avoids wasted
full-health healing and redundant sleep. Healthy critters resist cubes;
low HP and conditions improve the original shake-based catch sequence.

Battle command checkpoints persist HP, PP, conditions, enemy teams and turn
stages. An interrupted animation resumes its last command checkpoint; starter
selection rolls back as one transaction until the introductory battle and
starter gifts finish. Victories commit rewards and badges before presentation
or evolution can be interrupted. Old saves gain PP and IDs additively.

There are still two badge regions and 23 original critters, now with a return
rival battle, durable SHOVE shortcuts, a progression journal and a final ending
after the second badge. Four exact LCD shades are the default; colour tints
are an explicit saved option. There are 23 hand-authored rear portraits,
original badge sprites, species cries, pixel title lettering and separately
paginated dex portraits/descriptions. Native enemy portraits fit the screen.

No high/medium issues remain in the scripted cartridge flows and inspected
screens. This is not a claim that a full hour of unaccelerated balance testing
or physical-device testing has been completed.

## Captures and regression

Run against disposable localhost data only:

```
node tests/games/mon.mjs http://localhost:18098
```

The final full game run passed with `node tests/games/mon.mjs http://localhost:18085`
and a fresh throwaway server. The normal run uses `room-fixture.mjs`, grabs the real Game Lad, boots the real
runtime, captures the held device and LOCK IN, tests simulated standard-gamepad
Start and checks that Esc freezes its frame counter. Then an isolated browser
page runs the exact production cartridge and pixel font at 160×144. Real
browser keys choose every dialogue option and combat action; the test advances
fixed simulation steps and uses existing debug placement/party fixtures to
cover later regions without grinding. `--native` skips the house integration
for quick cartridge iterations. There are no new dependencies or production
QA endpoints. `--before` loads the repository HEAD cartridge; `MON_BASELINE`
can supply an explicit earlier file.

Coverage: starter/rival; overworld and trainer spotting; type moves and PP;
conditions, cubes and capture IDs; seventh-capture PC overflow; medicines; command-checkpoint continuation;
shop purchases, healing and storage; evolution; returning rival; both leaders;
badge rewards, field clearing, saving, interrupted-evolution reward atomicity, old-save migration, tint options;
portrait/landscape/large aspect; sibling cartridge. It captures short impact,
cube and attract frame sequences, all rear/front portraits, and milestone
screens under `tests/shots/games/mon/`.

Start with `before-title-native.png` / `after-title-native.png`,
`before-rival-native.png` / `after-rival-native.png`, `after-moves-native.png`,
`after-dex-native.png`, `after-moss-award-native.png`,
`after-splash-award-native.png`, `after-in-room.png` and `after-lock-in.png`.
The `after-portraits-*.png` sheets cover all 23 species from both sides.

The full site gate passed 12/12 with `SMOKE_SCALE=6 node tests/smoke.mjs`.
Earlier attempts hit loading timeouts (first signup/refresh, then mobile); the
passing gate ran alone with an increased timeout allowance. Its server-log and
browser-error checks passed.

## Software rendering timings

Matched native update/draw probes, 1,200 warmed samples per scene, software
Chromium. Milliseconds, median / p95; timer resolution rounds some samples to
zero. These exclude house rendering, texture upload and audio, and do not
represent physical hardware FPS.

| Scene | Before | After |
| --- | --- | --- |
| Title | 0.0 / 0.1 | 0.1 / 0.2 |
| Overworld | 0.1 / 0.2 | 0.2 / 0.3 |
| Battle command | 0.0 / 0.1 | 0.1 / 0.2 |

The added presentation remains far inside a 16.7 ms native simulation budget.
Raw samples are summarised in `before-performance.json` and
`after-performance.json` beside the captures.

## Further optional pass

More optional cave puzzles, unique walk cycles per species and a post-badge
challenge roster would expand replay value. Physical controller/touch devices,
listening through real speakers, live two-person Cable Club sessions and an
unaccelerated hour-long balance play-through remain unverified. Linked battles
retain the existing server referee's full-health rules; campaign PP and
conditions deliberately stay local.

## Run 2 — four-badge mid-game (2026-10-26)

Before: two gyms, two towns, two routes, one cave and 23 species. The second
badge ended the adventure; no villain team, third starter stage or rival
beyond the bay existed. These were high content-depth gaps against the owner's scope.
See `docs/games/mon.md` for the full reference comparison and next build chunk.

After: four gyms, four towns, four routes, two caves and the parcel depot;
60 species with 120 distinct original front/rear portraits. Starter families
have third stages; fifteen new two-stage families and three old single-stage
critter evolutions fill the middle of the dex. The final new species is
ALARMAGEDDON, a repeatable-until-caught level-35 rare encounter unlocked by the
clockmaker after badge four. Version exclusives still encourage trading.

Team Pocket introduces a pocket-subscription scam on Peg Path, blocks Lost
Sock Tunnel and steals Kiln's heating regulator. Winning at the depot restores
the gym's access. The extra rival battle uses the player's opposing starter.
Fusebox's third badge grants INSULATE for cable shortcuts; SHOVE remains useful
in the second cave and fourth gym. New towns have healing, shops, PC storage,
Cable Club and local hint dialogue. All named new people use Cast.

The second badge now points east. Chapter credits occur after badge four and
explicitly say four of eight; no champion/full-ending claim. The journal lists
current story objectives. Save v1, old IDs, balances, party data and positions
remain compatible. Victories, regulator recovery, badge flags and the unique
clockmaker gift commit before their presentation can be interrupted.

### Iteration findings

- First structural pass found a depot pickup on a solid plant; moved it.
- First rare-hunt test double-confirmed its prompt; corrected the test's input
  handling to accommodate the existing dialogue helper advancing held text.
- Capture review found tall enemy ground shadows behind the player's name;
  the battle status area now clears its background before drawing lettering.
- Separated the overlapping stats/EXP rows on the party summary.
- Added original radio masts and brick kilns to distinguish the new towns.
  Clear C/S/G roof plaques identify centres, shops and gyms before entry.
- Contact sheets now explicitly select GREEN SHADES to review the default art.

No high/medium presentation or correctness items remain in the tested run-2
flows. The full-classic scope remains incomplete: badges 5–8, elite final,
champion, tower, reserve, more types/species and a full post-game are next work.
Unaccelerated campaign balance, real touch/controllers/audio and live
multi-person Cable Club remain outside this scripted verification.

### Captures

`tests/shots/games/mon/` contains before/after title and starter captures,
impact/cube/attract sequences, menus/dex, all old regions, both old leaders,
`after-team-pocket-intro`, `after-pocket-road-cleared`, `after-fuse-overview`,
`after-gym3-start`, `after-spark-award`, `after-cable-warning`,
`after-insulated-crossing`, `after-tunnel-blockade`, `after-kiln-overview`,
`after-rival-kiln`, `after-regulator-gate`, `after-pocket-lieutenant`,
`after-depot-recovered`, `after-gym4-start`, `after-kiln-award`,
`after-credits-middle`, `after-clockmaker-hunt`, `after-alarmageddon`,
`after-rare-caught`, `after-new-evolution-23`, `after-new-evolution-30` and
`after-legacy-continued`. Each gameplay capture has an enlarged PNG and a
`-native.png` at 160×144. `after-roster-contact.png` and 20 portrait pages show
all 60 species from both sides. `after-region-atlas.png` shows all eight new field/gym/depot layouts; `after-new-summary.png` and `after-rare-dex-entry.png` cover their data screens. Room, LOCK IN, pause, three viewport sizes and
Puddle title captures cover the real runtime and sibling cartridge.

### Validation and performance

The native test and full room-integrated test passed on disposable localhost
servers. Server logs had no `mod failed to load`; browser error lists were
empty. Shared rules cover legal levels 2/22/32/50 for every species, every
evolution's inherited moves, unchanged legacy trade evolutions, 60 resolved
referee battles and rejection of out-of-range species. Browser tests cover
single-entrance map reachability, solid/NPC placement, gates before/after
rewards, actual input at all four leaders, saved villain battles, one-time
rewards, rare capture, both new evolution classes and old-save continuation.

Matched native CPU update/draw, 1,200 warmed samples, software Chromium:

| Scene | Before median / p95 ms | After median / p95 ms |
| --- | --- | --- |
| Title | 0.1 / 0.3 | 0.2 / 0.3 |
| Overworld | 0.3 / 0.5 | 0.3 / 0.5 |
| Battle command | 0.1 / 0.2 | 0.2 / 0.3 |

These figures exclude house rendering, texture uploads and audio; timer
resolution is coarse. They are budget diagnostics, not a physical-device FPS
claim. Raw summaries remain `before-performance.json` / `after-performance.json`.
`SMOKE_SCALE=6 node tests/smoke.mjs` passed 12/12. The first attempt passed
11/12 but its existing mobile handoff reported that the account profile did
not upload. The unchanged full gate passed on the next attempt.

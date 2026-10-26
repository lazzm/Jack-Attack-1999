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

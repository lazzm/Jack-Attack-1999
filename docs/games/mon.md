# Pocket Critters — campaign scope, run 2

The comparison below uses the owner's supplied 1998 reference scope. All code,
creatures, portraits, maps, dialogue and music here are original parodies.

| Feature/content | Original has | Before run 2 | After run 2 |
| --- | --- | --- | --- |
| Badge journey | 8 gyms, elite final, champion | 2 gyms; credits after badge 2 | 4 gyms; honest chapter ending after badge 4 |
| Roster | About 150, evolution families across all types | 23, six types | 60, six types; three-stage starters and new complete pairs |
| World | About 25 routes/towns, caves, tower, safari zone | 2 towns, 2 routes, woods, cave | 4 towns, 4 routes, woods, 2 caves, villain depot |
| Field traversal | Multiple HMs gating the map | SHOVE, first cave badge gate | SHOVE, badge gates, INSULATE cable crossings |
| Rival | Recurring arc through champion | Starter and bay rematch | Additional level-scaled fourth-region rematch |
| Villains | Multi-location team plot and boss | None | Team Pocket cave blockade, depot, lieutenant and recovery story |
| Rare encounters | Legendary hunts | Rare wild spawns | One fixed rare critter and a field-secret reward |
| Ending/post-game | League credits, optional dungeon | Two-badge credits, collection | Four-badge chapter credits, collection, rare hunt; league still to build |
| Cable Club | Trading, trade evolutions, linked battles | Server-refereed trading/battles | Same protocol, new species legal in shared rule book |
| Combat | PP, status, type strategy, storage, items | Six types, PP/status, six party, PC, cubes | Existing systems retained with expanded teams/learnsets |
| Saves | Persistent adventure | v1 command checkpoints | v1 additive badge flags, stable species IDs, old saves retained |

## Ranked critique before this run

1. High: two badges trigger credits; there is no substantial mid-game journey.
2. High: 23 species leave later encounters and trainer teams repetitive.
3. High: no villain storyline or escalating rival beyond the bay.
4. Medium: no third/fourth gym identity, traversal puzzle or new town services.
5. Medium: expanded roster needs distinct front/rear silhouettes at four shades.

## Next chunk

Build badges 5–6 with a tower, marsh/safari-style reserve, more map traversal,
Team Pocket's next operation and rival encounters. Grow toward 100 species and
more type variety. Then badges 7–8, elite final/champion, full ending and post-game.
Do not describe this four-badge chapter as the full classic's scope.

## Validation and before/after

Two gyms/23 species became four gyms/60 species, with the first Team Pocket
story, an extra rival rematch, INSULATE traversal, a one-time clockmaker gift
and a catchable rare clock. Credits moved from badge two to an explicit
four-of-eight chapter ending. Old saves retain their party, IDs, money and
map position. The shared Cable Club rules accept the appended species and
inherited moves without changing the protocol or old trade evolutions.

`node tests/games/mon.mjs http://localhost:18098` passed with a throwaway server
under `/tmp`, including the real held Game Lad, LOCK IN, simulated gamepad
Start and Esc pause. The isolated cartridge plays all four leader wins,
Team Pocket battles/recovery, the rival, new evolutions and rare capture with
browser keys. Branch fixtures skip grinding; this is not a claim of a full
unaccelerated balance run. It also checks map access, gates, all 120 distinct
four-shade portraits, 60 shared-rule battles, one-time rewards and v1 migration.

Inspected captures: `tests/shots/games/mon/after-in-room.png`,
`after-lock-in.png`, `after-gym3-start.png`, `after-kiln-award.png`,
`after-roster-contact.png` and the regional/story frames listed in
`tests/games/mon-review.md`. Native scene CPU p95 before/after: title 0.3/0.3 ms,
world 0.5/0.5 ms, battle 0.2/0.3 ms (software Chromium, 1,200 samples, 160×144;
excludes house/texture uploads/audio). Full site smoke: `SMOKE_SCALE=6 node tests/smoke.mjs` passed 12/12.
The first run passed 11/12 and failed at the existing mobile profile upload;
the unchanged gate passed on its next full run.

Physical phone/tablet/controller play, speaker listening and live two-person
Cable Club sessions are unverified. The remaining full-classic gaps are in the
scope table and next chunk above; no deployment, commit or live data changes.

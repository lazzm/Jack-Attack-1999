# Wobble Party 64 — cartridge depth and review

Run: 27 October 2026. Original code/art/tunes only. No deployment, version change, changelog edit, commit, push, Docker, `site/` or production-data access.

This pass expands the existing eight-attraction cartridge into a 41-attraction collection with practice, team rules, three board rule sets and a 40-stage solo expedition. It is **not yet the full scope of the reference**. The next major investment is genuinely different board layouts and a four-human input/session model; multiplying attractions does not substitute for those.

Reference scope: Nintendo's [original-game page](https://www.nintendo.com/en-gb/Games/Nintendo-64/Mario-Party-269569.html) describes eight boards, more than fifty minigames, free-for-all, 2v2 and 1v3 play. Its [retrospective](https://www.nintendo.com/us/whatsnew/party-like-its-1999-mario-party-and-mario-party-2-hit-the-dice-block-for-nintendo-switch-online-expansion-pack-on-nov-2/) specifies 56 minigames. The board count in that retrospective differs from the original-game page; this comparison uses eight competitive boards and keeps the solo island separate. These sources inform scope only; no assets, music, text or code were taken from them.

| Feature/content | Original has | Before this run | After this run |
| --- | --- | --- | --- |
| Board variety | Eight competitive boards, distinct routes/gimmicks, secret boards | One 40-space branching island | **Three rule variants of the existing island**, not three independently designed layouts: Wobble Island windmill dividend; Clockwork Carnival reversible central route and accumulating jackpot; Count Crumble Keep variable star prices, discount events and villain tax spaces. Original coast/path geometry retained. |
| Minigame volume | 56 attractions across several formats | Eight free-for-all games | **41 distinct playable attractions**: original eight plus 33 new mechanics. 15 short of the original's volume. |
| Player formats | Up to four humans or CPUs; FFA, 1v3, 2v2 and solo | One human plus three CPUs, FFA | One human plus three cast CPUs; FFA, **six 1v3 and seven 2v2** attractions. Human remains the solo role in asymmetric games. Four-human multiplayer/variable assignments remain outstanding. |
| Party duration | Long configurable board matches | 5, 8 or 12 turns | 5, 8, 12 or **20 turns**; difficulty easy/normal/hard; existing shops, items, forks, chance reels and final-three-turn catch-up retained. |
| Rules and practice | Each attraction explains its objective and controls; practice | Rules only | Every attraction has a fitted rules card, actual keyboard/controller labels, role assignment and **non-scoring practice**, returning to fresh rules/state. |
| Minigame house | Collection/free play and additional competition modes | None | Six-page, 41-entry house; seen markers and durable play/win/best records. A separate stadium/cup ladder and collectible minigame purchasing are still absent. |
| Solo adventure | Substantial island campaign with lives and progression | None | **40-stage linear expedition**, four lives, durable stage checkpoints and cleared stamps, three map pages, ending/credits and secret Marble Mischief unlock. No branching nine-world overworld, separate solo boss or all-clear bonus trilogy yet. |
| Characters | Six principal playable characters | Six original modelled characters | Six retained and relit: Bolt, Pip, Wisp, Sir Sprout, Comet, Chompy. Human/CPU identities use `Cast.me()` and `mate1..mate4`, not authored owner names. |
| Economy and events | Coins, stars, board hazards and character services | Coin/star economy, three items, chance/happening events | Original economy retained with 10/20/30-coin Keep stars, discounts, a 9-coin-per-round Carnival jackpot, 7-coin Count tax and windmill dividends. This is cartridge currency; no client minting of account cash/Rupees. |
| Finale | Bonus stars, ranking, ending and records | Three bonus stars, podium, results, legends | Same ending with fitted full names, safe replay, board-win records and original comic credits. `lk.party.star` and `lk.party.sweep` IDs retained. |
| Persistence | Saved party/progression | Restart current turn/minigame from checkpoint | Fixed 60 Hz simulation, per-segment deterministic controller journal, compact binary/RLE persistence, exact replay, silent restoration and pagehide/visibility/end flush. Menu, practice and pause states persist. Existing version-one saves still continue with balances, items, stats and internal IDs intact. |
| Presentation | Native late-90s 3D, readable menus, feedback and music | Original 320×240 scene, small clipped HUD, bright lighting | Same 4:3 native resolution, original solid models, biscuit-tyrant Count model/portrait, softer lighting, fitted names/counters, scrolling roulette, solid themed backdrops, rounded toy karts, connected robot/knight greaves, contact shadows and instanced confetti/space geometry. |
| Devices | Original controllers; modern host compatibility expected here | Keyboard and shared gamepad input | Shared keyboard/gamepad path plus **cartridge-owned period controller** with directional drag, A, B and Start outside the picture; portrait/landscape/tablet layouts. Actual phone user-agent entry still belongs to the host's JackOS-only route. |

## Attraction inventory

IDs and existing saves remain stable. Display names are original parodies; no title is silently cut off to fit a panel.

- Existing FFA: **Balloony Bin** (`balloon`, pump/leak race), Hot Floor (collapsing safe tiles), **Small Change Weather** (coins/anvils), **Bumper Grumps** (impulse barging), **Quick Quack** (flag reaction/fouls), Wobble Says (directional memory), Paint Panic (territory), **Dinky Derby** (two-lap steering).
- New FFA: Rope Nope (timed skipping); Goose on Guard (movement/stopping); Crate Expectations (overlap stacking); Crumb Curling (aim/charge/friction); Limelight Loafers (moving scoring zone and shoves); Pass the Parcel (proximity passes and fuse); Dizzy Delivery (steady/fast trade-off); Plank You Very Much (checkpoint zigzag crossing); Hedge Your Bets (solid-wall ordered maze); Hook Line and Stinker (bite/tension/reeling); Pin Panic (aim/charge and persistent knocked pins); Buried Pleasure (finite shared excavation); Snow Me Mercy (pack/release projectiles); Disco Infernoodle (timed direction notes/combo); Doodle Bugs (ordered outline tracing); Jump to Conclusions (jump/duck obstacle runner); Crumbled from Above (telegraphed crumb storm); Colour Me Confused (called-colour platforms); Putt a Sock in It (friction, gutters and putting).
- 1v3: Barrel of Laughs (launcher vs dodgers); Seed Siege (defender cannon vs raiders); Under Pressure (code-solving vs three pumps); Hide and Beak (seeker vs hiding crew); Boot Camp (aimed delayed stomp vs dodgers); Current Affairs (wire blocking vs pulses).
- 2v2: Net Profit (shared net endpoints); Sock It to Them (puck/goal physics); The Great Plate Escape (two-axis shared balance); Balloon Brigade (alternating turns); Oar You Serious (independent oars/yaw); Sandwich Sorcery (selection/serving roles); Step on It (switch/bridge relay).
- Secret FFA: Marble Mischief (inertial tabletop maze and counter-steering), opened by completing the expedition.

The inventory is authoritative: **28 FFA including the secret, six 1v3, seven 2v2 = 41**.

## Ranked critique and iteration

| Priority | Baseline / review finding | Action and remaining scope |
| --- | --- | --- |
| High | Eight games and one board could only support a short sample of the reference. | Added 33 mechanically distinct attractions and two alternative rule sets, free play and solo progression. **Eight independent boards, 56-game volume, four humans and stadium remain a substantive depth gap.** |
| High | A refresh rerolled/restarted the active turn and lost transient play. | Deterministic segment checkpoint + compact controller replay; consume no account rewards during reconstruction. Captured an off-by-one warm-up error and fixed it before extending refresh tests. |
| High | Authored player names impersonated the owner and mates for every visitor. | Cast-based identity at creation and continuation; old balances/characters/items/stats preserved. Existing personal high-score strings remain player data. |
| Medium | No way to learn a game without committing board coins/progress. | Rules → practice → clean rules → ready/countdown. Practice never awards board coins, expedition stamps or house wins. |
| Medium | New maze routes could strand the AI; bridge relay could finish a leg early. | Route clearances corrected, inertial maze wall moved, and four-leg switch relay replaces the premature two-leg completion. |
| Medium | First rope sweep and first colour call gave almost no reaction time. | Earlier visible rope approach; dedicated colour-round timer no longer reuses the engine countdown. |
| Medium | Board spaces and confetti multiplied draw calls on software WebGL. | Solid side/cap space instances and coloured particle instances; lighter cloud/terrain geometry and shared helmet geometry. The island/title remain heavier than the small arenas on SwiftShader. No shared kit changes. |
| Medium | Names, coin totals and long controls overflowed the native HUD. | Width-aware fitted text, new rules layout, scrolling roulette and fitted result rows. Full text remains available. |
| Medium | Golf claimed walls that did not exist; crossing minigames looked like safe checker floors. | Solid golf gutters, visible aim/charge arrows, custard hazard surface and darker bridge channel; props and collision affordances agree. |
| Medium | The final wire game asked the solo player to guess invisible random choices. | Visible, staggered wind-up pulses and an incoming-wire cue make blocks a timed decision; a real-input script wins the final encounter. |
| Low | The board ending stopped at tables. | Comic original credits and durable board-win records. More bespoke board victory scenes and an announcer would improve a future pass. |

This is a large playable expansion, not a declaration that the reference's full depth has been reached. Camera/drift/rubber-banding criteria from the kart template are relevant only to Dinky Derby; the primary party-game criteria are timing readability, fair CPU decisions, route choice, coin/star transactions and correct team outcomes.

## Persistence implementation and compatibility

The cartridge owns its PRNG and fixed simulation clock. Logical party/player state and the initial seed anchor each turn, roulette/minigame and finale. Plain actor/camera state plus the segment's short controller journal reconstruct the active script without serializing generator closures or THREE objects. Texture-cache misses cannot consume gameplay randomness. Replaying suppresses sounds, score submissions, secrets and already-recorded results. Normal actions continue to use the existing server-held score window.

Standalone attractions preserve a suspended board match in `SAVE.party`. Clearing a standalone attraction restores that match as an explicit Continue choice. Old `SAVE.game.G/P` checkpoints without a journal still load through their existing turn/minigame continuation path. The save version and cartridge ID stay unchanged. House records and expedition progress add fields instead of replacing existing data.

Journals use run-length encoding and a compact controller byte stream. Keyboard play compresses strongly. Very long continuous analogue input can approach the host's 20 KB per-save roaming threshold; the host retains larger saves locally rather than discarding them. Cross-device maximum-size analogue sessions require a dedicated stress/profile-sync pass.

## Verification

Final commands/results and the complete performance comparison are recorded below. Tests use system Chromium/SwiftShader with disposable localhost accounts and `/tmp` server data. The native harness uses the production THREE renderer and cartridge update/draw code. It sends real keyboard events, then uses the existing debug entry/placement API to bound independent branches. CPU autoplay finishes attractions after a short human-input sequence; this does **not** claim 41 uninterrupted expert human victories.

Run from the repository root; keep the server and browser in the same shell:

```sh
( cd app && exec env PORT=18091 DATA_DIR=/tmp/jhp-party-review ADMIN_TOKEN=testtoken node server.js > /tmp/jhp-party-review.log 2>&1 ) & party_server=$!
trap 'kill "$party_server" 2>/dev/null || true' EXIT
sleep 2
node tests/games/party.mjs http://localhost:18091
```

`--native` isolates cartridge testing; `--room-only` isolates physical controls/devices. `--before --native --benchmark` loads the repository baseline, while `--persistence`, `--progression`, `--match`, `--skills` and `--art` diagnose individual branches. Every route rejects non-localhost/non-test-port URLs and checks that the server serves this worktree. No new test dependencies are required.

The full suite writes `tests/shots/games/party/`:

- `before-*` title, selection, board and all eight original rules/play views.
- `after-<id>-rules`, `-practice`, `-start`, `-motion-0..2`, `-result` and `-refresh` native PNGs and 1366×860 browser captures.
- Board choices/maps, physical dice-hop sequence, shop, host/star purchase, mid-hop refresh, bonus/podium/results/credits, solo maps/life loss/last-stage ending/unlock.
- Six character close-ups, the Count's tax portrait, three kart model angles and fitted three-row kart rules.
- Physical CRT, same-instance LOCK IN, Q/background, Esc, gamepad, touch portrait 390×844, landscape 844×390, tablet 768×1024 and desktop 1366×860 / 1920×1080.
- `before-performance.json` / `after-performance.json`: identical native title/board/three original-attraction scenarios, CPU/GPU-readback timings, renderer and host load. Excludes house rendering; never a hardware-FPS claim.

An additional test completes a whole five-turn party with real input decisions and no turn/score/finish mutation. The isolated endgame and solo-last-stage branches seed accumulated match scores or prior expedition stamps. Those fixtures verify the production rewards/credits/unlock scripts; they do not substitute for an unaided full 40-stage campaign or a full twenty-turn human party. The earned marble unlock survives starting the expedition again.

## Next chunk to build

1. Build five additional, independently routed and modelled boards; then replace the two shared-island variants with dedicated scenery/topology. Add board-specific host services, hazards and endings, with two boards earned through durable progression.
2. Add the remaining 15 distinct attractions toward 56, prioritising genuinely solo challenges, more shared-object teamwork and CPU roles that vary with board space colours. Keep the existing internal IDs stable.
3. Add a stadium/cup ladder and a branching, multi-world solo map with checkpoints, a bespoke final rival/boss and further secrets. Existing expedition stamps should migrate into the new route without resetting lives or clears.
4. Implement up to four human pads with per-seat character/input ownership and per-CPU difficulty. Global pause/house controls must retain priority.
5. Stress maximum-duration analogue journals through actual roaming profile sync; test real controllers, phone GPUs and audio listening. The host's phone-only JackOS entry policy is outside this cartridge patch.


## Software rendering comparison

The final paired diagnostic uses the same 320 × 240 SwiftShader renderer, fixed input route and normal CPU tier. Host load was 11.58 before / 10.62 after on 12 available CPUs. Each sample includes update, draw and a one-pixel GPU readback; it excludes the house. These are measured frame costs, not a promise of hardware or whole-house FPS.

| Scene | Before median / p95 ms | After median / p95 ms | Draw calls before → after | Triangles before → after |
| --- | --- | --- | --- | --- |
| Title / stage | 20.2 / 26.3 | 18.3 / 23.0 | 115 → 65 | 71764 → 57808 |
| Board close view | 13.5 / 17.3 | 13.0 / 16.9 | 37 → 40 | 59018 → 47610 |
| Dinky Derby | 6.6 / 10.2 | 6.7 / 10.7 | 14 → 14 | 18364 → 13224 |
| Hot Floor | 8.5 / 12.3 | 5.6 / 9.2 | 140 → 65 | 15232 → 7992 |
| Balloony Bin | 11.1 / 15.0 | 5.4 / 8.5 | 87 → 35 | 27862 → 13928 |

`paired-before-performance.json` and `paired-after-performance.json` preserve this back-to-back comparison. `before-performance.json` / `after-performance.json` also record the latest diagnostic run. `performance-history.json` retains the earlier busy-host console summaries rather than hiding them. The narrow board view submits **40 calls instead of 37**: instancing helps the wider view and effects, but does not lower every camera's draw count.

Earlier host load reached 21–31 on 12 CPUs. In that environment title median/p95 went from 39.9/76.1 ms to 56.7/96.2 ms, while minigame medians were roughly 17–20 ms after the changes. Large isolated scheduling/GC/GPU-readback maxima remain in the JSON. The lighter-load pair supports lower rendering work and smooth small arenas; **uniform smoothness under an overloaded software host is not verified**. Real GPUs, real phone entry and full house+game frame timing still need their own pass.

## Final verification record

- `node tests/games/party.mjs http://localhost:18091` — **exit 0** on the final integration run: 41 rules/practice/play/result flows; every attraction's exact actor/score/camera/PRNG refresh; pause; old save compatibility; full five-turn keyboard party through credits; board and solo ending fixtures; earned secret retained on replay; real-input wire victory; all three item inventory paths; six character close-ups, Count tax and three kart angles; physical F/E case-to-cartridge insertion; analogue menu navigation and movement; standard-pad Start; same-instance Q/T; Esc; foreground/background refresh; touch controls and five sizes. Browser errors/warnings caused by the cartridge: none.
- `node tests/games/party.mjs http://localhost:18091 --native --compatibility` — **exit 0** after the final live-cast correction. Changing the cast provider before starting another attraction changes CPU names; scripts no longer cache the first visitor's mates. Legacy coins/stars/items/stats/turn count remain intact.
- `node tests/games/party.mjs http://localhost:18091 --native --skills` and `--native --art` — **exit 0**, focused item/counterplay and visual review. The later complete integration run includes both routes.
- `node tests/games/party.mjs http://localhost:18091 --before --native --benchmark` and `--native --benchmark` — **exit 0**, paired measurements preserved in the JSON files above. Later all-flow diagnostics retain the observed load-related variation.
- `node tests/smoke.mjs` — **exit 0, 12/12**, including account/house, walking and refresh, PC controls, physical console, phone typing, prop refresh, Esc, canonical art views, mobile desktop, browser errors and server logs. No smoke assertions or shared kits were changed.
- `node --check app/public/js/rm-g-party.js`, `node --check tests/games/party.mjs`, and `git diff --check` — **exit 0**. Disposable server logs have no mod-load failures, unhandled exceptions or fatal errors.

Earlier diagnostics caught and resolved an input-harness setup issue, rules/countdown timer reuse, one-frame checkpoint warm-up, a confetti state leak affecting replay randomness, cached mate identities, early rope timing, blocked AI maze paths and incomplete bridge legs. Historical failure captures are retained under `tests/shots/games/party/iterations/`; they are not current unresolved failures.

Remaining verification limits: real gamepad/phone/tablet hardware and subjective audio listening; an unaided 40-stage solo clear and full twenty-turn human party; maximum-length analogue journals through roaming profile sync; and uniform frame times during host overload. Actual phone user-agent entry is still controlled by the host's separate JackOS-only policy. The larger reference-scope gaps remain in the table and next-chunk list rather than being counted as delivered features.

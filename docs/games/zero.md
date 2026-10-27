# Formula Null (Super Ultra) — depth pass 1

Parody of the 16-bit Mode-7 hover-racing launch classic. All code, art, models and tunes are original and drawn in code.
Cartridge `sn.zero`; save keys, the four original track ids (best-lap tables) and secrets `lk.zero.gold` / `lk.zero.jump`
are unchanged. Every person's name comes from `window.Cast` (`me`, `mate1`–`mate4`); tables store `@mate2`-style ids that
are resolved when drawn, so only the owner ever sees "Jack". Old saves (fixed names, the single NULL CUP) migrate once in place.

## Scope: the original vs this cartridge

| Feature / content | Original has | Before this run | After this run |
| --- | --- | --- | --- |
| Leagues / tracks | 3 leagues × 5 = 15 tracks | 1 cup, 4 tracks | **3 leagues × 5 = 15 tracks** (NIGHTLIGHT, QUEEN BEE, KINGSIZE); old cup = league 1 |
| Worlds | ~7 (city, harbour, desert, ice, fire, wind, silence) | 4 (city, port, canyon, biscuit) | **7**: + FROSTY FLATS (ice), TOASTY FIELD (lava, cycling palette), BREEZY BLOCKS (side wind), CHROME CITY at dawn |
| Laps / rank limits | 5 laps, a tighter rank limit each lap | 3 laps | **5 laps**, per-lap limits per class (e.g. PRO 8/7/6/6/5) |
| Difficulty classes | Beginner/Standard/Expert + unlockable Master | 3 classes | 3 classes + **hidden NULL class** (win all leagues on MASTER) |
| Machines | 4 with stats | 4 | 4 (unchanged) + endings-seen count on the select screen |
| Field | 4 rivals + slow generic cars | 8 racers | 8 racers + **5 slow backmarker tugs** (lapped traffic, bump costs power, not ranked) |
| Hazards | dash/jump plates, rough, pit, mines, magnets, ice, wind | dash, jump, ramp, rough, pit | + **mines** (blinking, throw you up, cost power), **magnet strips**, **ice**, **side wind** with HUD wind sock; AI and autopilot dodge mines |
| Energy / pit / boost | yes | yes | yes (autopilot also uses the pit lane when low) |
| Ending | per machine, staff roll | trophy card only | trophy → **two-page ending per machine** → **staff roll** (test drivers from Cast); per-machine, per-league seen flags saved |
| Trophies | per league and class | per class | **per league × class** (class, league and records screens) |
| Practice / records | practice, best times | ghost practice, best laps | same over 15 tracks; ghost is `mate1` |
| Refresh safety | n/a | refresh restarted the race | **snapshot every 3 s and on pause; refresh resumes the race paused** |
| In-room display | n/a | legacy overlay | **physical cupboard telly** (screen/screenPose opt-in), same instance in LOCK IN |
| Music | per track | 6 tunes | + 2 original tunes (frost, lava) |

## Critique (ranked) and what was fixed

1. **High — names:** LUKE/JACK/DAVE/CAL/JK hard-coded in tables, practice ghost, tips and ending text. Fixed (Cast ids + migration).
2. **High — depth:** 4 tracks, 3 laps, one cup, no ending. Fixed: 15 tracks/3 leagues, 5 laps, endings, staff roll, secret class.
3. **High — refresh:** a refresh lost the race in progress. Fixed (paused resume, verified in the room).
4. **Medium — field felt empty / no traffic:** added backmarkers. **Medium — hazards:** mines/ice/magnets/wind added.
5. **Medium — presentation fixes from review:** practice HUD showed a raw `@MATE2` token; staff roll ran under its own hint line;
   four-class layout overlapped text and trophies; ceremony still said "NULL CUP". All fixed and re-shot.
6. **Low, left:** name tags can overlap each other or the mini-map when a rival sits right beside you; the intro's
   "SPARE CARS" text can be crossed by a car sprite; timer text is less legible on the very pale frost sky.

## Next chunk to build

- Proper **track art per new track** (unique landmarks/decor in the texture, e.g. frozen lake cabins, lava bridges), and a
  "silence"-style night track; more distinct layouts for CHROME CITY II/III.
- AI personality: rivals using boosts, the four main machines attacking (side-bumps) like the original.
- A short **attract demo per league** and a per-track replay of your best lap ghost (saved compactly).
- Touch controller layout for phones/tablets (the plumb cartridge's pattern) — not built here.
- Tune rank limits/damage after real human play (balancing was autopilot-based).

## Reproduce

Throwaway server in the same shell command, then: `node tests/games/zero.mjs http://localhost:$P` (and `--before` to
capture the committed HEAD cartridge into `before/`). The script: physical telly + LOCK IN, attract, every menu, GP flow via
real keys (class → league → machine → fly-by → countdown → throttle/steer/brake → pause freeze), every one of the 15 tracks
(start + autopilot stretch, AI sanity), mines/ice/magnet/wind with real throttle, backmarker, practice + ghost name check,
records, finish/results/standings, rank-out + spare cars, a league final won → ceremony → ending pages → staff roll → name
entry, save flags, secret class, Cast-only tables, perf, mid-race refresh resume, lean back with Q.
Headless check of all 15 tracks (autopilot finishes 5 laps, AI completes, no NaN) was run with production `update()`.

## Performance (software Chromium, native 256×224)

`dbg.bench()` (30 draws / 60 updates): before draw 0.59 ms, update 0.008 ms; after draw 1.2 ms, update 0.08–0.19 ms
(5 extra cars, mines/hazard checks). The whole-house rAF interval in the room was p50 33 ms in both runs (SwiftShader host
load dominates; the cartridge is ~4% of a frame). Shots: `tests/shots/games/zero/before/` and `after/` (`*-native.png` 256×224).

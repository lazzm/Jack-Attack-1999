# Render audit, 11 November 2026 (2.91.0 + perf2)

Scorecard item 10 (Performance evidence, 2/3): find what each main view pays for and does not show, remove the unseen
work, keep every visible pixel. No physical phone was available, so everything below is SwiftShader on a shared host
(load 6-17) and is evidence of *work submitted*, not of hardware frame rates.

## Method

`node tests/perf/view-audit.mjs [--ab] [--profile]` (own throwaway server and /tmp data). Desktop 1366x860 and portrait
390x844 (touch, Android UA, DPR 1), adaptation pinned at rung 0 (the best look), 18 views: every room station plus the
walking bedroom pose the release gate uses (`bedroom-walk`), the garden (patio, shed, the house) and the front (car,
the house, the street).

- **Unseen draws**: each view is rendered twice. The second render keeps the first render's depth and wraps every draw
  call in an `ANY_SAMPLES_PASSED` occlusion query (LESS widened to LEQUAL). A draw with zero samples contributes no
  pixel to that frame: hidden behind walls, other floors, closed doors, fences or furniture.
- **Texture residency**: a texImage2D/texStorage2D tracker installed before the app loads counts the bytes uploaded to
  each GL texture (mip levels included), so the numbers are what the house context really holds, not an estimate.
  "Used" is what the view's draws bind.
- **CPU split** (`--profile`): a slowly turning walking camera at 4x CPU throttle; every requestAnimationFrame callback
  is timed by name, plus a CDP sampling profile.
- **A/B** (`--ab`): the same frame, same JS task, clocks frozen, drawn with the new culling off then on; the native
  drawing buffers are compared pixel by pixel. Raw JSON: `tests/shots/perf/view-audit.json` (when run without --out).

## Biggest costs found (before)

1. **The street is drawn from every room.** The neighbourhood (`root > neighbourhood`) is owned by whichever room you
   stand in, so it is submitted in every view: about 25 calls and 116k triangles, all of them unseen from the
   bedroom, hall, cupboard and lounge (occlusion query). 17 of those calls / 90.8k triangles are HouseStatic batches in
   the `big` bucket: merged across the whole neighbourhood per material, so no frustum test can ever reject them.
2. **Outdoor rooms seen through a window are drawn whole.** From the landing, the front (`drive`) is 125 calls, 121 of
   them unseen; from the bedroom the garden is 24-39 calls, all unseen.
3. **Interiors from outside.** "The house" views draw both interiors behind the windows: garden-2 1,129 calls (1,033
   unseen), drive-1 567 (440 unseen). These are the worst views in the game.
4. **Shelf media.** Each boxed game, case or magazine on a shelf is 7-14 draws (one per face material); about half are
   hidden by its neighbours (spine-out). ~100 calls in the bedroom.
5. **Texture residency.** 175-191 MB uploaded to the house context against the skill's 128 MB mobile budget. 16.7-25 MB
   of it is never sampled in any of the 18 views (mostly game prints/case art and magazine art on items stored away),
   0.7-7.6 MB is not referenced by any scene material at all (catalogue art uploaded by `pm-gl` at load).
6. **CPU (4x, before).** The house loop is 24-49 ms per frame, of which `render()` is 6-26 ms; the story guide's
   `frame` rAF callback is 17-49 ms per frame (10 Hz `getComputedStyle`/`getBoundingClientRect` over ~25 HUD selectors;
   at SwiftShader's 3-4 FPS that is every frame). Family rigs (`np-rig`) are under 0.3% of samples, `HouseStatic.verify`
   0.4-3%. Most of the frame is native GPU/raster time in SwiftShader ("(program)" 66-85%), so triangles and draws, not
   JS, dominate the software frame.
7. No shadow maps, reflection or post passes exist in the house, so there were none to remove. A second canvas
   (`ren2`, the held-object layer) only draws while something is held.

## What changed

**Aperture narrowing** (`hs-world.js`, `apertureCull`, before both room passes). From indoors, an outdoor room that is
reached only through bounded window apertures (the existing `windowViews` boxes), and the outdoor scenery
(`neighbourhood`, `family-house-roof`, `night-light-pools`), submit only the meshes whose bounds meet the view through
those apertures. Each aperture box is projected to a screen rectangle widened by 4 px; a sub-frustum is built from it;
a leaf mesh is skipped for that frame when its sphere, and for non-instanced meshes also its cached AABB (follows the
position attribute's version), misses every sub-frustum. Never narrowed: the room you stand in, doorways (no box),
anything when you stand outside (indoor rooms own outward faces of their window frames: narrowing them from outside
changed 31-987 pixels, so it was withdrawn), meshes with children, skinned meshes and `frustumCulled = false` objects.
Visibility is restored in the same frame. Test-harness switch only: `House._.aperture(false)` (no player setting).

## Per-view budget (after; same-session before -> after)

Calls and triangles are the whole visible scene. Unseen = drawn but zero samples after the change. Texture MB = bound by
this view / resident in the house context. Px diff = changed pixels between culling off and on (native buffer).

### Portrait 390x844

| View | Calls | Triangles | Unseen calls / tris | Texture MB | Rooms drawn | Px diff |
|---|---:|---:|---:|---:|---|---:|
| bedroom-0 | 199 -> **176** | 238k -> **206k** | 69 / 155k | 40.8 / 156 | bedroom, garden | 0 |
| bedroom-walk | 285 -> **267** | 247k -> **241k** | 79 / 107k | 35.5 / 158 | bedroom, garden | 0 |
| landing-0 | 253 -> **179** | 362k -> **352k** | 129 / 254k | 36.5 / 161 | landing, hall, drive | 0 |
| landing-1 | 140 -> **138** | 168k -> **168k** | 99 / 144k | 32.2 / 161 | landing, hall, drive | 0 |
| hall-0 | 145 -> **144** | 175k -> **175k** | 105 / 151k | 35.9 / 161 | landing, hall, drive | 0 |
| hall-1 | 148 -> **145** | 172k -> **172k** | 88 / 144k | 35.3 / 161 | landing, hall, drive | 0 |
| cupboard-0 | 91 -> **83** | 165k -> **154k** | 64 / 144k | 29.9 / 161 | landing, hall, cupboard, drive | 0 |
| lounge-0 | 173 -> **164** | 164k -> **152k** | 80 / 141k | 32.8 / 169 | lounge, drive | 0 |
| lounge-1 | 237 -> **196** | 175k -> **64k** | 56 / 31k | 30.2 / 172 | lounge, drive | 0 |
| lounge-2 | 94 -> **91** | 337k -> **336k** | 27 / 36k | 26.4 / 172 | lounge, drive | 0 |
| kitchen-0 | 195 -> **191** | 205k -> **204k** | 48 / 75k | 30.1 / 174 | garden, kitchen | 0 |
| kitchen-2 | 256 -> **254** | 203k -> **203k** | 102 / 113k | 34.8 / 176 | garden, kitchen | 0 |
| garden-0 | 72 | 185k | 34 / 29k | 24.2 / 176 | bedroom, garden, kitchen | 0 |
| garden-1 | 46 | 166k | 36 / 165k | 10.7 / 176 | bedroom, garden, kitchen | 0 |
| garden-2 (the house) | 1028 | 376k | 924 / 215k | 114.5 / 180 | bedroom, garden, kitchen | 0 |
| drive-0 | 56 | 134k | 25 / 21k | 27.3 / 180 | hall, lounge, drive | 0 |
| drive-1 (the house) | 513 | 385k | 404 / 111k | 63 / 182 | hall, lounge, drive | 0 |
| drive-2 (street) | 93 | 312k | 31 / 14k | 20.3 / 182 | hall, lounge, drive | 0 |

### Desktop 1366x860

| View | Calls | Triangles | Unseen calls / tris | Texture MB | Px diff |
|---|---:|---:|---:|---:|---:|
| bedroom-0 | 348 -> **344** | 236k -> **234k** | 136 / 170k | 53.3 / 170 | 0 |
| bedroom-walk | 279 -> **258** | 256k -> **243k** | 78 / 102k | 41.7 / 170 | 0 |
| landing-0 | 260 -> **165** | 364k -> **351k** | 119 / 274k | 36.3 / 173 | 0 |
| landing-1 | 130 -> **126** | 167k -> **160k** | 70 / 52k | 32.0 / 173 | 0 |
| hall-0 / hall-1 | 132 -> **130** / **127** | 172k / 168k (same) | 78 / 144k | 35.4 / 173 | 0 / 0 |
| cupboard-0 | 92 -> **84** | 165k -> **154k** | 67 / 144k | 29.9 / 173 | 0 |
| lounge-0 | 255 -> **245** | 165k -> **154k** | 93 / 128k | 33.8 / 182 | 0 |
| lounge-1 / lounge-2 | 252 -> **250** / 126 -> **111** | 345k / 339k -> 336k | 74 / 72k | 36.6 / 184 | 0 / 0 |
| kitchen-0 | 218 -> **214** | 212k -> **211k** | 36 / 43k | 32.4 / 185 | 0 |
| kitchen-2 | 319 -> **314** | 221k -> **220k** | 102 / 121k | 41.2 / 188 | **1** |
| garden-0 / 1 / 2 | 71 / 46 / 1129 (unchanged) | 184k / 166k / 378k | 30 / 21 / 1033 calls | 21 / 11 / 115 | 0 |
| drive-0 / 1 / 2 | 160 / 567 / 87 (unchanged) | 352k / 385k / 309k | 86 / 440 / 26 calls | 46 / 63 / 12 | 0 |

The one changed pixel (kitchen-2, desktop) is the last column of the screen (x = 1365): a garden pixel seen through a
one-pixel seam in the kitchen wall at the screen edge (green 77,84,77 without the change, wall-coloured 102,96,82
with it). It is not seen through the window aperture. Every other view at both sizes is pixel-identical.

## Tradeoffs

None visible apart from that seam pixel. CPU: the narrowing walks the narrowed outdoor room and the street each drawn
frame (one sphere and one box test per leaf mesh). Paired gate numbers are below.

## Paired gate numbers (mobile.mjs --only=perf, main first)

Phone 412x915 (Pixel profile), adaptation free (both settled at rung 5), the release gate's bedroom walk. Main is
`/opt/stacks/landing-train21` (2.91.0); each perf2 run directly follows its main run. Host load 16-21.

| Pair | Build | Profile | Calls | Triangles | Frame p50 / p95 ms | render() p50 ms |
|---|---|---|---:|---:|---:|---:|
| 1 | main | walk-cpu4x | 182 | 194k | 333 / 383 | 31.9 |
| 1 | perf2 | walk-cpu4x | 180 | 193k | 350 / 417 | 32.2 |
| 2 | main | walk-cpu4x | 182 | 194k | 317 / 383 | 30.7 |
| 2 | perf2 | walk-cpu4x | 180 | 193k | 317 / 417 | 31.3 |
| 1 | main | walk-cpu1x | 64 | 173k | 167 / 217 | 7.0 |
| 1 | perf2 | walk-cpu1x | 60 | 160k | 167 / 200 | 6.8 |
| 2 | main | walk-cpu1x | 64 | 173k | 150 / 217 | 6.7 |
| 2 | perf2 | walk-cpu1x | 60 | 160k | 167 / 200 | 7.0 |

The gate's walk looks west across the bedroom; the garden window is barely in view, and what it still pays for is the
neighbourhood's `big` batches (item 1 below), which this change cannot reject. Calls -1% to -6%, triangles -1% to
-8%; frame and render times are unchanged within this host's noise (the narrowing adds no measurable render() cost).

## Tests run on perf2

`node --check` (hs-world.js, view-audit.mjs); all 92 `tests/*-unit.cjs` pass; `door-walk.mjs` PASS; `mobile.mjs
--only=gate` PASS; `mobile.mjs --only=perf` PASS x2 (paired above); `cupboard.mjs` PASS; `ui-hud.mjs` PASS (touch and
desktop); `tests/perf/check.mjs` ONE LOOK PASS; smoke (`SMOKE_SCALE=3 STORY_SCALE=3`) 12/12; `events-bonfire.mjs` PASS;
`bonfire-art.mjs` PASS (desktop, phone, potato). Not run in this pass: characters.mjs, people-pass.mjs.

## Round 2 (same day): CPU, texture upload, street batching

### Story guide marker (st-guide.js)

The compass arrow measured the HUD (getComputedStyle on every matching element, getBoundingClientRect) after writing
its own styles in the same frame, at a 10 Hz wall-clock rate that is every frame below 10 FPS; it also re-ran two
document-wide `querySelector`s (speech, loading screen) and read `innerWidth` (forces layout), hid then re-showed the
marker and prompt and replaced unchanged text every frame, and recomputed every target mesh's bounding box five times
a second. Now:
- Other ink, the safe area and the label size are cached and re-measured only after a change (MutationObserver on
  added/removed elements and class/hidden/style changes inside the HUD roots; resize; the label's ResizeObserver), at
  most 10 Hz, in a task after the frame has painted, so no read ever forces a layout. Until the first measurement the
  marker waits hidden rather than guess.
- Speech and loading checks re-run only after a class/hidden/element change; the cached viewport width replaces
  `innerWidth`.
- The marker moves by `transform` only (left/top fixed at 0, `will-change: transform, opacity`); hidden flags, text,
  data attributes and styles are written only when they change.
- Target bounds use each geometry's box, recomputed only when its position data changes.
- Without MutationObserver (old browsers, the unit tests) it samples synchronously as 2.91 did.
  `tests/story-order.mjs` reads the marker position from its transform.

Portrait 390x844, 4x CPU, slowly turning walking camera (`view-audit.mjs --cpu-only --profile --only=portrait`),
ms per frame of each requestAnimationFrame callback, house loop / guide / all rAF:

| Run | bedroom | lounge | kitchen | garden | street |
|---|---|---|---|---|---|
| main 2.91 | 43.5 / 38.2 / 81.9 | 33.2 / 9.3 / 43.2 | 37.8 / 36.1 / 74.3 | 29.6 / 34.7 / 64.4 | 24.3 / 37.1 / 61.6 |
| perf2 round 1 (guide as 2.91) | 41.6 / 35.6 / 77.5 | 33.3 / 9.6 / 43.2 | 37.2 / 40.6 / 78.1 | 33.7 / 37.5 / 71.5 | 24.8 / 35.3 / 60.2 |
| perf2 round 2 | 36.1 / 7.5 / 44.1 | 28.1 / 5.4 / 33.8 | 41.0 / 8.0 / 49.4 | 24.8 / 3.9 / 28.7 | 20.1 / 4.3 / 24.4 |

The guide falls from 35-41 ms to 4-8 ms per frame wherever the arrow is on the screen edge (lounge: target on screen,
9 -> 5 ms). Total rAF time per frame falls 34-60%. The house loop is within noise (20-41 ms). A software renderer at
3-6 FPS makes every 10 Hz task a per-frame task, so a phone at 30 FPS saves proportionally less per frame.

### Texture upload on first use (hs-world.js `warmTextures`, pm-gl.js)

Loading no longer uploads every texture any material holds plus the whole media catalogue. It uploads the art of
things that are shown (a mesh whose own visibility chain is on; room groups and doors count as shown, so every room
is ready before its door opens). Art on stored, boxed or undelivered things and catalogue art nothing uses uploads when
first drawn: three.js uploads before that draw, so it never appears blank (no pop-in; at worst a one-off upload of a
512 px image on the frame it first appears). Every 5 s an idle pass warms newly shown things in the rooms you can see
and the rooms next door. Desktop, after the 18 views: resident 190.6 -> **177.0 MB**, never sampled 25.1 -> **11.6 MB**
(6.4 MB of it is no longer held by any material; 1.6 MB is only on hidden things).

### Street batching (tried, withdrawn)

Coarse 12 m (and 24 m) cells for the neighbourhood's big merged pieces, compared in the same frame against main's
street-wide buckets: pixel-identical everywhere (0 changed pixels; one pixel at 24 m in lounge-2), triangles -20k to
-32k in every indoor view, but **draw calls +15 to +25** in every view (bedroom 344 -> 365, kitchen-0 214 -> 235,
garden-0 71 -> 95), because each row of houses becomes its own unmerged draw. With CPU the bigger phone cost, that
is the wrong trade, so it is not shipped. A merge that keeps rows together per half of the plot (front / rear) is the
version worth trying.

### Round 2 paired gate numbers (mobile.mjs --only=perf, main first; load 12-19)

| Pair | Build | 4x calls / tris | 4x frame p50 / p95 | 4x render() p50 | 1x calls / tris | 1x frame p50 |
|---|---|---|---|---|---|---|
| 1 | main | 182 / 194k | 333 / 400 | 33.2 | 64 / 173k | 150 |
| 1 | perf2 | 180 / 193k | 317 / 383 | 31.6 | 60 / 160k | 100 |
| 2 | main | 182 / 194k | 200 / 217 | 19.6 | 64 / 173k | 100 |
| 2 | perf2 | 180 / 193k | 200 / 283 | 22.6 | 60 / 160k | 117 |

The gate's SwiftShader frame time is GPU-bound and swings with host load; it cannot show the guide saving (the
rAF table above can).

### Round 2 tests

All 92 units pass (`story-order-unit`, `ui-hud-pass2-unit` included); `ui-hud-pass2.mjs` PASS, 0 findings (its first
run failed "Notice overlaps the objective 390,844 carrying"; main 2.91 failed the same check, 768x1024 carrying, in
the paired rerun, so that check is flaky on main too); `ui-hud.mjs` PASS (touch, desktop; 0 layout findings);
`characters.mjs --only=day,space,bump` 3/3; `people-pass.mjs --desktop --skip-perf` 18/18; `tests/perf/check.mjs` ONE
LOOK PASS; smoke 12/12; `mobile.mjs --only=perf` 4/4 (pairs above). `story-order.mjs` (marker position now read from its transform) times out
at its first step, `House.interact('gb')` never opening the Game Lad telly; main 2.91 times out at the same step, so
the marker jitter check after it was not reached on either.

### Other

The aperture switch is test-harness only (`House._.aperture()`); no localStorage setting exists.

## Not done; next, in order of payoff

1. **Neighbourhood `big` batches** (90.8k triangles, 17 calls, unseen from every indoor view): see round 2; split
   only front / rear so calls do not rise.
2. **Interiors from outside** (garden-2, drive-1: 900-1,000 unseen calls): narrow indoor rooms from outside too, but
   exempt every mesh whose box touches an expanded window box (frames, sills, curtains); re-run the A/B.
3. **Shelf media faces**: hidden spine/back faces of boxed media, ~100 calls in the bedroom.
4. **Texture residency**: done in round 2 (190.6 -> 177.0 MB).
5. **Story guide marker**: done in round 2.

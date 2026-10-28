# Jack Attack 1999: graphics and performance plan

Date: 2026-10-26. Scope: better lighting and shading AND maximum FPS on phones, tablets and potato PCs, for the three.js r128 house.
Status of evidence: facts about THIS codebase were read from `app/public/js/hs-world.js`, `hs-kit.js` and `tests/` today. Facts about three.js r128 were checked against the r128 tag source on GitHub today (flagged "[r128 src]"). Vendor and engine references are from the named public documents; I confirmed the URLs resolve but did not re-read every page, so treat any numeric rule of thumb as a heuristic. All numeric budgets in sections 3 and 4 are my recommended targets, not vendor-stated limits.

---------------------------------------------------------------------
## ONE LOOK (owner decision, 2026-10-27) - supersedes the tiers in sections 0, 3 and Stage 0

"Lower makes things too blurry": there are no graphics options, presets or tiers any more. Every device draws the best
look (the old High: Phong, the five-lamp rig, MSAA, full-resolution mipmapped textures with 8x anisotropy, portal depth
1, 60 Hz live screens, full grass, the standard family rigs) and is kept fast by real optimisation instead of blur.

- Drawing buffer: device pixels up to 2 on desktop, 1.75 on handhelds (`PCOnly.handheld`). No pixel caps, no CRT/retro
  mode, no 0.5x dynamic resolution. `Q.tier` is always `'high'` for the scripts that still read it.
- Settings: `jhp_hs_gfx` / `jhp_hs_graphics` are deleted on load (a saved "show FPS" moves to `jhp_hs_fps`). The pause
  menu GRAPHICS OPTIONS page, Start > Room graphics and the G key are gone. The frame counter is a hidden debug option:
  Owner tools > World / testing > Frame counter, `House.showFps(true)` or `localStorage.jhp_hs_fps = 'true'`.
  The JackOS-only fallback stays: no usable WebGL, the player's own choice, or the too-slow offer on a handheld once
  every adaptation rung is in use and the median frame is still over 125 ms.
- Invisible adaptation (`ADAPT` in hs-world.js; `Q.adapt`, `House.adapt(level, {pin})` for tests). Down one rung after
  two ~1 s windows of continuous frames under 40 FPS (26 FPS after a phone has settled to its 30 Hz cap; at most every 4 s); up after 12 good windows (>= 55 FPS), never
  within 20 s of a step down. Remembered per device + GPU string (`jhp_hs_adapt`, starting one rung lower than saved).
  Rungs: 0 everything; 1 outdoor fog/far plane 30 m and portal depth 0, live screens 30 Hz; 2 three per-pixel lamps
  instead of five; 3 screens 20 Hz; 4 resolution 0.925; 5 resolution 0.85 (the floor). The resolution rungs apply only
  where the native ratio is >= 1.5, so the floor is still more than one drawn pixel per CSS pixel (no visible blur; a
  1x desktop never scales). Programs for the current and next rung are compiled ahead (`compileVariants`). There is
  no shadow map and no particle system in the house, so those rungs from the brief have nothing to scale.
  A software renderer (SwiftShader/llvmpipe: the test browsers) starts at rung 3 without MSAA; `jhp_hs_msaa` forces
  MSAA on for like-for-like benchmarks.
- Static merge (js/hs-static.js): after a room is built, plain opaque meshes are merged per material, render order,
  attribute set and ~3 m cell (large shells in their own bucket) into 16-bit indexed batches. Originals stay in the
  graph on layer 30 (never drawn; every raycaster here enables all layers), so picking, the editor, physics and held
  references keep working. Before each frame `HouseStatic.verify` checks each source's visible chain, world matrix,
  material, geometry and layers; any change dissolves that batch in the same frame and marks the changed mesh
  unstable (never merged again). Idle-time `maintain` re-batches a room 6 s after a dissolve and adopts late
  additions every 20 s. Also merged: the neighbourhood and the exterior roof. Kill switch: `jhp_hs_nomerge = '1'`.
- Visibility: open-door connectivity, the stairwell and permanent window sight lines select rooms. Whole-room
  aperture-frustum rejection is unsafe for this house: room groups also own shared wall faces and window reveals.
  Keep those rooms intact and let three.js frustum-cull individual meshes and ~3 m static batches. The rendered
  doorway audit compares this result with mesh frustum rejection disabled, from both sides at three angles.
  Dense grass fields alone may skip drawing when every open-door/window route to them is off screen;
  a conservative 20 cm aperture margin and a rendered-reference comparison protect window-edge views.
- Adaptation, FPS, MSAA and batching debug settings are device-only in roam.js. House pose and inventory still roam.

Results and before/after numbers: see "One look results" at the end of this file.

---------------------------------------------------------------------
## 0. What the code already does (so the plan does not re-invent it)

- `hs-world.js`: three tiers (`low/medium/high`), `PRMAX` pixel-ratio caps 1/1.5/2, auto pick from `deviceMemory`, `hardwareConcurrency`, DPR and the unmasked GPU string (SwiftShader, llvmpipe, Mali-3/4xx, Adreno 3-5xx, PowerVR SGX, GMA force Low), dynamic resolution (`renderScale` 0.5..1 in 1/8 steps; down below 28 fps, up above 52 fps after 5 good seconds), auto tier step-down, background cadence, render-on-demand (`dirty()`, `continuous`, `backgroundCovered()`), the GL canvas hidden while seated at the PC.
- Room visibility: `visCalc()` shows the current room plus rooms reachable through open doors (depth 1, depth 0 on Low) plus permanent window sight lines (`windowViews`, with bounds). So door-based room culling exists; what is missing is frustum/portal narrowing, which is where the next saving is.
- `prewarm()` already builds every room, runs `ren.compile`, `ren.initTexture` on every texture and renders once while a black reveal holds. Good; that is the correct pattern for r128 (see 1.9).
- Lighting: a FIXED rig (1 hemisphere, 1 directional, 5 point lights, 3 on Low), moved per room from `roomRigs` slots, so the light count never changes and shaders never rebuild. Materials are `MeshPhongMaterial` (Lambert on Low) from `hs-kit.js`. Grep counts across the whole tree: ~40 Lambert, 26 Standard, 26 Phong, 94 Basic, 20 Toon (mostly games), 58 ShaderMaterial, 76 InstancedMesh, 2 `mergeBufferGeometries`, 940 `fog` mentions, 32 `castShadow` (none of it active in the house: there is no shadow map, the house uses "AO" quads from `B.ao` as contact shadows).
- Per-fragment cost today on Medium/High: every lit pixel evaluates hemisphere + 1 directional + 5 point lights with Phong specular. That is the single biggest fragment ALU cost and the best thing to remove (section 2).
- Bake-friendly facts: geometry is procedural and made of boxes, lathes and extrusions, there are room `area` rectangles and a collision/box set, and there is an owner-only layout editor (`hs-edit.js`) that changes layout, so any bake MUST be invalidated by a geometry hash.

---------------------------------------------------------------------
## 1. Biggest CPU/GPU wins, ranked (impact vs effort)

Legend: CPU = JS + driver per-draw cost (dominant on phones and old PCs when you have 400-900 calls), GPU-F = fragment/fill cost, GPU-V = vertex cost, MEM = memory/bandwidth.

| # | Change | Hits | Expected impact | Effort | Risk | Verdict |
|---|--------|------|-----------------|--------|------|---------|
| 1 | Static merge per room x material x spatial chunk, colour via vertex colours into ONE shared material | CPU | Draw calls 400-900 -> ~100-200 per view; render() CPU time down ~50-70% | M-L (1-2 wk) | M (picking, editor, runtime-mutated materials) | DO FIRST |
| 2 | Baked lighting (lightmap + vertex layers) replacing Phong + 5 point lights on potato/low/medium | GPU-F, look | Fragment ALU per pixel down ~4-8x; large visual gain | L (2-3 wk) | M (bake pipeline, editor, door spill) | DO SECOND (biggest visual win) |
| 3 | Portal frustum culling on top of existing `visCalc` | CPU+GPU | 15-40% fewer draws in multi-room views (hall, landing, front garden) | S-M (3-5 d) | L | DO WITH #1 |
| 4 | Pixel budget: fixed render-target caps per tier (e.g. potato <= ~0.35 MP, "640x480 CRT mode") + dynamic scale | GPU-F | Linear in pixels; the only lever that always works on fill-bound mobile | S (1-2 d) | L | DO NOW |
| 5 | Live-screen throttling (TV/CRT/monitor canvases): rate, size, visibility, screen-footprint | CPU+MEM | Removes per-frame texImage2D + canvas redraw of 1-3 textures; often 2-6 ms on weak CPUs | S (1-2 d) | L | DO NOW |
| 6 | InstancedMesh with chunked instances for repeated outdoor/indoor props | CPU | Street/garden 908 -> ~150-250 | M | M (InstancedMesh culls as one object in r128, chunk it) | with #1 |
| 7 | Frame cap + frame pacing (30 Hz cap on potato, 60 Hz on 120 Hz screens) | CPU+GPU+thermal | Stable 30 beats 40-55 jitter; avoids thermal throttle on phones | S | L | DO NOW |
| 8 | Render-on-demand tightening (zero frames when idle and no live screen visible) | all | 0% GPU when standing still | S | L | mostly done; extend |
| 9 | Runtime atlas for small textures + vertex-colour-only flat props | CPU | Material count down 3-6x (feeds #1) | M | M (tiling textures cannot be atlased; mip bleed) | only for non-tiling |
| 10 | Shader/material count reduction (one baked-lit program, one prop program) | CPU, hitching | Fewer program switches (r128 sorts by program id then material id) | M | L | falls out of #2 |
| 11 | Per-frame allocation audit | CPU, GC hitches | Removes periodic 10-60 ms GC stalls on phones | S-M | L | DO in stage 0 |
| 12 | Texture memory diet (sizes, free canvas backings, no mips on live screens) | MEM | Prevents tab kills on iOS/Android; faster uploads | S-M | L | DO in stage 0/1 |
| 13 | Precision (fragment mediump on potato) | GPU-F | Small on modern GPUs, real on very old ones | S | M (artifacts at large coords) | optional, test on device |
| 14 | KTX2/Basis compressed textures | MEM, bandwidth | 4-8x less GPU memory | M-L | M | only for baked/atlas assets, later |
| 15 | OffscreenCanvas/worker rendering | CPU | Moves render off main thread | XL | H | NO |
| 16 | three.js upgrade from r128 | mixed | Mostly not perf | L-XL | H | NOT NOW (1.13) |

### 1.1 Static merge (BufferGeometryUtils) - rank 1
- Mechanism: draw-call overhead (state validation, uniform uploads, driver work, three.js per-object `projectObject`, matrix and sort work) is paid per object, not per triangle. three.js manual "Optimize lots of objects" and the Discover three.js "Tips and tricks" page both lead with merging/instancing as the first CPU fix. WebGL best practices (MDN, Khronos wiki) say the same: minimise draw calls and state changes; batch by state.
- r128 API: `BufferGeometryUtils.mergeBufferGeometries(geoms, useGroups)` lives in `examples/jsm/utils/BufferGeometryUtils.js` [r128 src]. It requires all geometries to have the same attribute set (add a dummy `uv`/`color` to the ones that lack it). Bake each object's world matrix into positions/normals first (`geometry.applyMatrix4`).
- Design for this game:
  1. Mark objects `static` at build time (`B.box` etc. already go through `HouseKit`; add a flag, default static unless the object is a door pivot, pickup, drawer, screen, animated or has a custom material).
  2. After `build(r)`, run `mergeRoom(r)`: group static meshes by (material "kind") and by a spatial chunk key (floor(x/400), floor(z/400) in cm, i.e. roughly 4 m cells). Chunking keeps frustum culling useful: one batch per whole room can never be culled when you stand in it.
  3. Flat-coloured procedural props (the majority) go into ONE shared material per lit-style with `vertexColors: true`; the object's colour is multiplied into the vertex colour at merge time. That alone can collapse ~100 draws per room to ~1-3.
  4. Textured props keep one batch per (texture, chunk). Tiled textures (wallpaper, carpet, lino) stay separate materials with `RepeatWrapping` (they cannot go in an atlas without a shader `fract()`).
  5. Picking/interaction: keep a lightweight pick proxy list (the original meshes stay in memory but not in the scene, or only their world-AABB plus an id) and raycast against that. `Raycaster` on merged geometry has no object identity. The existing `F`/`E` interaction code needs to be pointed at the proxy list.
  6. Layout editor (`hs-edit.js`): while editing, skip merging (mark the room `dirty`); re-merge on exit or on a debounce. A room tagged `merged` must be rebuilt from its source meshes, so never discard the sources.
  7. Dispose the source geometries after the merge but keep the transform and descriptor needed for the proxy.
- Triangle cost: merging does not reduce triangles; frustum-cull granularity gets coarser. With ~4 m chunks the extra triangles drawn are small versus draw-call savings. Set `geometry.computeBoundingSphere()` per chunk.
- Already present in places: 2 `mergeBufferGeometries` uses and "independently culled static batches for the neighbourhood". Extend the same helper to rooms.
- Expected: 400-900 -> roughly 100-200 draws per view (hypothesis from the measured counts, to be confirmed by Stage 0 instrumentation per room).

### 1.2 Portal / room culling - rank 3
- Current: door-state based room set. Add per-frame (or when the camera moved/rotated more than ~1 degree / 5 cm) portal narrowing, the classic Teller/Sequin PVS and Luebke/Georges 1995 "Portals and Mirrors" technique:
  1. Start with the current room and the camera frustum.
  2. For each portal (open door aperture, window, stair opening) of a visible room, project its 4 corners; if the polygon is behind the camera or outside the frustum, skip the neighbour. Otherwise build a narrowed screen-space rectangle (or a clipped frustum) and recurse with depth limit 2 (1 on Low, as today).
  3. Set `room.group.visible` by the result. Doors that are closed are already opaque, so they stay a hard stop.
- The data you have: `ROOMS[id].links`, `DOORS[id].rooms`, `windowViews` with bounds. You need apertures as boxes; the door and window geometry already exist, so deriving an AABB per portal is cheap.
- Do not forget the safety net already written in visCalc (hall+landing+cupboard stairwell rule): wrong guesses must never black out the view. Add a debug flag that draws the portal rectangles and a test that walks a path and asserts no pixel-black frames (the project's own rule: refresh must never show black).
- Outdoors (front garden 908 draws): distance cull. Set `camera.far` to the fog end distance so geometry beyond the fog is never submitted, and subdivide neighbourhood batches into 20-40 m cells (they are already "independently culled").
- Expected: 15-40% fewer draws in landing/hall/garden views; no gain in a closed bedroom.

### 1.3 InstancedMesh - rank 6
- [r128 src] `InstancedMesh` has no per-instance bounds; `frustumCulled` tests the whole mesh using the geometry bounding sphere of ONE instance. So either set `frustumCulled = false` (draws always) or split instances into spatial chunks, each its own InstancedMesh with a correct `boundingSphere` set manually. Use `setColorAt` for per-instance colour (exists in r128) so one material serves variants.
- Best candidates: fence palings, bricks/tiles if modelled, hedges, street lamps, parked cars of one model, bins, bollards, roof tiles, books on shelves, skirting segments. Anything repeated more than ~8 times in view.
- Do not instance tiny counts; merging is better (no per-instance matrix upload, culls per chunk).
- Case reference: the three.js manual's instancing sections and the Discover three.js tips; the common field rule is "merge what is static and unique, instance what is repeated".

### 1.4 Atlases, materials and state sorting
- [r128 src] opaque sort key order is `groupOrder`, `renderOrder`, `program.id`, `material.id`, then z (front to back), then object id (`painterSortStable`). Transparent: back to front. So the order you can influence is: fewer distinct materials, then `renderOrder` to cluster. There is no per-material sort-key API in r128.
- Because textures are canvas-generated at load, a runtime atlas is feasible: draw all small non-tiling textures (posters, signs, labels, box art, wood grain tiles for props) into one 1024 or 2048 canvas with 2-4 px gutters (and mip-aware padding; or disable mips for atlased UI-ish things), remap UVs when merging. Keep tiled surfaces out.
- Target after this: per room 3-8 materials instead of dozens. An "array of materials" on one mesh with geometry groups gives one draw per group in three.js, so it does NOT save draw calls compared with separate meshes; do not use it for that purpose (use it only to keep one mesh object).

### 1.5 Render on demand, frame pacing, rAF
- three.js manual "Rendering on demand" (the pattern the project already uses via `dirty()`): render only when something changed. With baked static lighting plus no dynamic lights, a standing player costs zero GPU except live screens.
- Frame pacing: for potato/low, run a 30 Hz budget loop: in rAF, accumulate time and skip when `now - last < 33.3 - 2`. Prefer a locked 30 over a floating 40-55 (Chrome rendering performance guidance on jank). On high-refresh phones (90/120 Hz), cap to 60. Keep background cadence (`backgroundFps`) as is; also pause fully on `visibilitychange` hidden.
- Dynamic resolution (exists): improvements in 3.4. Do not step by frame count of dirty-only frames.

### 1.6 Canvas-texture update throttling - rank 5
- Each `CanvasTexture.needsUpdate = true` triggers `texImage2D` from the canvas (copy of w*h*4 bytes, plus mip regeneration if `generateMipmaps` is true). There are 26 `CanvasTexture` uses.
- Rules:
  1. Live screens: `generateMipmaps = false`, `minFilter = LinearFilter`, `anisotropy = 1`. No mip rebuild per update.
  2. Resolution: CRT console image at 256x224 or 320x240 is both period-correct and enough; the monitor texture only matters while the PC close-up is on (and then DOM is shown anyway).
  3. Rate by tier: potato 12-15 Hz, low 20, medium 30, high 60, and divide further when the screen's projected size is under ~64 px or it is outside the frustum or in a hidden room (`room.group.visible === false`), or when the console is off (draw once, stop).
  4. Do the game's own drawing at its native cadence, but upload only on the scheduled ticks.
  5. If a canvas is 2D-accelerated and read often, set `willReadFrequently` only when you really read pixels; otherwise leave GPU-backed so the upload is a GPU copy.
- The TV spill light (see 2.5) needs a 1x1 or 4x4 downsample at 5-10 Hz, never per frame.

### 1.7 Per-frame allocation
- Allocation per frame leads to major GC stalls on phones. Audit: temp `Vector3/Matrix4/Quaternion/Color` created in loops, array `.map/.filter/.slice` in `render` paths (the snippet `EVS[ev].slice().forEach` per emit is an example; fine if rare, bad if per frame), closures in animation callbacks, `new Box3` in `visCalc` for window bounds (built per call). Cache, reuse, or build once per room.
- Test: run 600 frames of a scripted path in Chromium with `--enable-precise-memory-info`, sample `performance.memory.usedJSHeapSize` each 30 frames; assert the sawtooth amplitude below a threshold (e.g. under 2 MB per 10 s) and use the DevTools allocation sampling profile to find the top allocators.
- `renderer.info.autoReset`: leave on; read `info.render.calls/triangles` after each render in the test harness; `info.memory.geometries/textures`, `info.programs.length`.

### 1.8 Overdraw and mobile GPU architecture
- Mobile GPUs (Arm Mali, Qualcomm Adreno, Apple, PowerVR) are tile-based: all vertex work happens first, then fragments are shaded per tile. Consequences from the vendor guides (Arm Mali GPU Best Practices; Apple "Tailor your apps for Apple GPUs and tile-based deferred rendering"; Imagination PowerVR Performance Recommendations; Qualcomm Adreno docs):
  - Opaque overdraw is mostly resolved by hidden surface removal on PowerVR and Apple, and by early-Z/forward-pixel-kill on Mali. Still, keep opaque draws sorted front-to-back (three does that within a material).
  - `discard`/alpha-test and writing `gl_FragDepth` disable early-Z/HSR on many tilers. Avoid alpha-tested foliage in shaders for potato; use real geometry.
  - Alpha blending is expensive (read-modify-write in tile memory, no HSR). Keep transparent objects few and small: windows (glass), steam, glow. Make glass opaque tinted on potato.
  - Framebuffer round trips are expensive: any post-process (EffectComposer, outline pass) forces render-to-texture and extra full-screen passes with bandwidth cost. Avoid on low tiers.
  - MSAA: Arm documents 4x MSAA as cheap on Mali because the resolve happens in tile memory; on old Intel/AMD iGPUs it multiplies bandwidth. Policy: AA on for mobile tilers at medium+, test rather than assume; off for potato.
  - Bandwidth is the mobile budget: 8-bit render targets, no float RTs, fewer and smaller textures, mip maps on (they improve cache hit rate), compressed textures where possible.
- Also: precision mediump cuts ALU/register pressure; see 1.11.
- Pixel count is the lever: DPR 3 phones have 3-9x the pixels of a 1080p layout; always cap the drawing buffer (4) rather than trust `devicePixelRatio`.

### 1.9 Shader precompile (r128)
- [r128 src] `renderer.compile(scene, camera)` does `scene.traverseVisible` for lights and `scene.traverse` (ALL objects, visible or not) for materials, and calls `getProgram` for each. It is synchronous. `renderer.initTexture(texture)` exists. The project's `prewarm()` already uses both: keep it, but note the stall is on the main thread; run it behind the loading screen (already so).
- `compileAsync` and `KHR_parallel_shader_compile` handling were added in later versions; r128 compiles on the calling thread, though browsers compile/link shaders off-thread in the GPU process and stall only when the program is first used or its status is queried. Mitigation in r128: precompile, keep the light count constant (done) so programs never change, and keep the number of distinct programs small (under ~15-20).
- Hitch source to fix: `buildRoom()` is lazy-called from `visCalc()`; `prewarm()` builds all rooms at load, so this is fine unless rooms are rebuilt (editor, state change). Keep the rule: no material property that changes the program (e.g. toggling `vertexColors`, `map` presence, `fog`, `flatShading`, `side` is fine, `transparent` is fine) after warm-up.

### 1.10 Textures: mipmaps, anisotropy, compression
- Mipmaps: keep ON for world textures (cache-friendly, no shimmer), +33% memory. OFF for live screens and UI quads.
- Anisotropy: cost scales with the anisotropy level on slanted surfaces (floors, long walls seen at grazing angles, i.e. exactly this game). Potato 1, low 1-2, medium 4, high 8 (16 is rarely visible). Already set per tier via `wantedAniso()`; keep.
- Sizes: canvas-generated textures are RGBA8 uncompressed. A 512x512 with mips is 1.4 MB; 100 of them is 140 MB. Budget per tier in section 3. Set texture size by tier at generation time (the generator draws at 256 on potato, which is also period-appropriate).
- Free memory: after upload set the CanvasTexture's `image` canvas to 0x0 size only if the texture will never be re-uploaded (context loss restore needs the source; so keep for important ones, or regenerate on context restore since generation is procedural and deterministic).
- KTX2/Basis in r128: `KTX2Loader` exists at `examples/jsm/loaders/KTX2Loader.js` (+ Basis transcoder files under `examples/js/libs/basis`) [r128 src]. It needs `detectSupport(renderer)` and loads `.ktx2` files. Our textures are runtime canvases, so this only helps if the pipeline produces image files offline (baked lightmaps, atlases): e.g. headless Chromium dumps PNGs, `toktx` or the Basis encoder compresses to ETC1S (small) or UASTC (higher quality; use for gradients and lightmaps). Mobile support: ASTC (most modern phones), ETC2, BC on desktop; Basis transcodes to whichever exists. Verdict: moderate memory win, medium effort, non-urgent. A lightmap shell is only ~1 MB anyway.

### 1.11 Precision
- `new WebGLRenderer({ precision: 'mediump' })` and the per-material `material.precision` override exist in r128 [r128 src: Material.js `this.precision`]. But three's prefix applies the precision to BOTH vertex and fragment shaders; mediump vertex positions in cm-scale world coordinates (up to 4000) jitter (fp16 has 10 mantissa bits). So: custom baked-lit ShaderMaterial/onBeforeCompile program: add `precision highp float;` at the top of the vertex shader body and leave fragment `mediump` on potato. On any GPU supporting WebGL2 (ES 3.0) highp fragment is guaranteed, so the gain is mainly on older GPUs. Test on a real low-end Android; skip if no measurable change.

### 1.12 OffscreenCanvas / worker rendering - NO
- r128 can draw to an OffscreenCanvas (there is a three.js `webgl_worker_offscreencanvas` example). But this app's game logic, DOM interaction (JackOS desktop, pointer lock, prompts), hundreds of canvas-texture painters using `document.createElement('canvas')`, and the DOM-projected monitor are all main-thread. A worker render split needs a messaging architecture over ~300 files. And the weakest devices have 2 cores, where a second thread buys the least. iOS support for OffscreenCanvas WebGL is only recent (16.4+).
- Worth using workers for: the lighting bake fallback and atlas packing (pure compute). Not for rendering.

### 1.13 WebGL1 vs WebGL2 in r128, and whether to upgrade
- [r128 src] `WebGLRenderer` tries `['webgl2','webgl','experimental-webgl']`; r128 therefore already uses WebGL2 when available and falls back to WebGL1. The detection `ren.capabilities.isWebGL2` exists. In WebGL2 you get NPOT mipmaps + repeat, 3D/array textures (not used by three r128 materials), MSAA renderbuffer samples, instanced arrays core, `gl_VertexID`.
- Later three.js: WebGL1 support was dropped around r163; the renderer got `compileAsync`, `BatchedMesh` (r159-ish, relies on `WEBGL_multi_draw`, unreliable on mobile), colour management by default (r152: `ColorManagement.enabled`, sRGB output, `outputEncoding` -> `outputColorSpace`), physically based light units by default (r155, `useLegacyLights` removed later), geometry/attribute API renames (`mergeBufferGeometries` -> `mergeGeometries`, `uv2` -> channel-based UV sets). See the three.js Migration Guide wiki.
- Risk for this project: 300 files with authored colours and materials tuned in r128's legacy lighting; r152+ changes colour and light intensity globally. Gains for THIS bottleneck (draw count, fill rate): essentially none; per-draw overhead did not fundamentally change between r128 and the 2024-26 releases, and the real fix is to submit fewer draws and cheaper shaders. BatchedMesh needs multi-draw support and does not help the weakest GPUs.
- **Recommendation: stay on r128 now.** Do the merge/instance/bake work on r128. After the baked pipeline lands, most visible surfaces will use a tiny custom unlit/baked shader that does not depend on three's lighting or colour management, which dramatically lowers the upgrade risk. Then, if wanted, do a separate branch upgrade to a conservative pre-colour-management release (about r148-r150; verify the exact tag's `compileAsync` and API names before choosing) rather than latest, and only for compileAsync and tooling. Do not upgrade to chase performance.

---------------------------------------------------------------------
## 2. Lighting that looks much better and is cheap

### 2.1 The key idea: a "layered baked light" model
Because the geometry is procedural and made of boxes, you can bake in a few seconds offline (or on first load in a worker), and shading at runtime becomes one texture/vertex fetch and a multiply: roughly the cost of MeshBasicMaterial. This is also historically exactly right for 1999: Quake 2/3 and Unreal used lightmaps and vertex lighting; id Tech 3 mixed baked lightmaps with vertex light for models; Valve Source used a baked "ambient cube" for props (Mitchell, "Shading in Valve's Source Engine", SIGGRAPH 2006). Abrash's Graphics Programming Black Book describes lightmapped surface caching. A baked look will feel 1999 rather than modern PBR.

Stored layers (each is a scalar 0..1 in an RGBA8 texel or vertex; colours come from uniforms):
- R: sky/ambient visibility (hemisphere AO). Runtime colour = mix(groundColour, skyColour, normal.y*0.5+0.5) can be baked into the texel directly for simplicity, or applied as uniform per time-of-day.
- G: direct sun/daylight through windows (shadowed, NdotL included).
- B: room lamp group A (main ceiling light / current room lamp), colour and intensity from a per-room uniform, so switching the light on/off is a uniform change.
- A: lamp group B or TV/CRT/monitor glow.
- Final: `light = R*uSky + G*uSun + B*uLampA + A*uLampB` (uniform colours include intensity). With 8-bit storage store in gamma (sRGB-ish) space or apply a sqrt/pow curve to avoid banding in the darks; do the bake maths in linear.
- Run-time cost: 1 texture fetch + 4 mults. That is lower than a Lambert with a single light.

Where to store:
- Room shells (floors, ceilings, walls: planar rectangles): a lightmap atlas. Area estimate: ~720 m^2 of shell surface for a two-storey house at about 20 texels/m (5 cm texels) = 288k texels = about one 1024x1024 texture; at 10 texels/m about 512x512. That is small. Use `DataTexture` (Uint8, no premultiply issues) uploaded from a binary blob; `LinearFilter`, no mips, with 1-2 texel gutters per chart to avoid seams.
- Props: per-vertex layers in a `Uint8` normalized 4-component attribute (4 bytes/vertex). Large flat prop faces (table tops, bed) need subdivision to roughly 20-25 cm grid for a decent vertex-lit result; or give big props their own small lightmap charts.
- Outdoor (garden, drive, street): sky/sun vertex layers with a coarse sun-shadow bake; no lamps except street lamps at night (lamp layer with a uniform).

### 2.2 Offline/at-load bake (feasible because geometry is boxes)
- Rays: AABB slab test against the room's solids (collision boxes + furniture boxes; lathes and extrusions use their bounding boxes or a coarse proxy). For a bake with ~300k texels x (1 sun + ~16 cosine-weighted AO rays + ~8 lamp shadow rays) against ~100-200 boxes per room, that is order 10^8-10^9 slab tests: seconds to a minute in Node, or in a headless Chromium via the existing Playwright set-up, using the real `HouseKit` builders so the bake sees exactly the live geometry. If you need a BVH (lathes), use `three-mesh-bvh` (Garrett Johnson), which works with older three versions; verify the compatible version for r128.
- Bounces: add one cheap fake bounce: sample the hit surface's albedo and its direct light (a single-bounce gather with fewer rays) or just add a constant coloured ambient by room (warm magnolia walls bleed warm light). One bounce at 8 rays is enough to remove the "CG-flat" look.
- Pipeline: `tools/bake-lighting.mjs` (Playwright + system Chromium) loads the page with `?bake=1`, iterates rooms, writes `data/lightbake/<hash>.bin` (+ manifest) which `deploy.sh` copies into `site/`. The runtime loads `<hash>.bin`; if the geometry hash does not match (layout editor changed something), fall back to a coarse analytic vertex-light and queue a rebake in a worker/idle callback, caching the result in IndexedDB keyed by hash. Never block the game or the "refresh never shows black" rule on it.
- Bake variants: (a) day sun azimuth/elevation keyframes, (b) lamps per room, (c) TV/monitor. Because layers are separate, you do NOT need combinatorial bakes. The sun layer needs 2-3 sun directions (morning/noon/evening) blended by uniform, or one noon bake plus a shading offset; with windows in a UK house, 3 is plenty.
- Door-open spill: bake with all doors in their default (closed) state. At runtime, a door opening between a lit room and a dark one gets a small "spill" lift: an additive uniform on the neighbour's lamp layer scaled by door angle, or a second bake of the door-aperture region only. Start with the uniform lift; it is invisible at 1999-style fidelity.
- Honest limits: 8-bit layers cause mild banding in dark gradients (dither the bake by +-0.5 LSB noise); coarse lightmap texel size shows blocky shadow edges (acceptable and period-correct; bilinear smooths them).
- r128 built-in alternative to get started: `MeshBasicMaterial` supports `lightMap` (UV2 set required; `uv2` attribute) and `vertexColors` [r128 src: meshbasic_frag: `reflectedLight.indirectDiffuse += lightMapTexel * lightMapIntensity; ... *= diffuseColor`]. So Stage 2 can start with ZERO custom shader: baked RGB lightmap multiplied by map/colour, plus fog. Move to the layered shader (via `onBeforeCompile`, 22 existing uses show the pattern is known here) once day/night and lamp switching are needed.

### 2.3 Baked AO and soft shadows
- AO bake = the R layer. It gives contact darkening in corners, under furniture and at skirting, which is the single biggest "looks richer" gain per cost. Existing `B.ao` quad decals can be removed from merged batches or kept for dynamic props.
- Soft shadows: baked sun/lamp shadows have soft edges for free from texel interpolation (add 2-3 jittered shadow rays or a small blur in the bake).
- Dynamic objects (player body is invisible in first person; carried items, moved furniture, doors): 
  - Potato/low: blob contact shadow, a flattened dark solid disc/box under the item with `depthWrite:false` and polygon offset (keep it a thin solid, consistent with the "nothing 2D" rule: a squashed dark ellipsoid on the floor).
  - Medium: planar projected shadow: draw the item a second time with a matrix that flattens it onto the floor plane in the light direction using a dark `MeshBasicMaterial` (1 extra draw per item).
  - High: a single `DirectionalLight`/`SpotLight` shadow map, 1024 (512 on mobile), PCF soft (`BasicShadowMap`/`PCFShadowMap`), `autoUpdate = false` and `needsUpdate` only when a caster moved; only the few carried/moving casters set `castShadow`; receivers only the floor/table near the player.
- Shadow map cost for reference: an extra full scene pass of casters, plus per-fragment shadow lookups; this is why it is high tier only.

### 2.4 Probes / hemisphere / fake GI
- Keep `HemisphereLight` as the ambient for DYNAMIC props only (cheap: no light loop). For dynamic props near baked light, sample the baked "ambient cube" at the prop's position: 6 colours per probe, probes on a coarse 1 m grid per room, baked from the same layers. A prop shader (or even `AmbientLight` colour set per prop each frame) uses the interpolated colour. This is Valve's ambient cube approach and is what prevents moved objects looking pasted in. Cost: a handful of vec3 uniforms.
- Fake GI: coloured room ambient bake (walls tint), floor bounce on the underside of tables, window light patches with warm/cool difference (cool daylight vs warm tungsten ~2700 K 1999 bulbs, plus the blue-white CRT flicker).

### 2.5 Dynamic lights without per-pixel lights
- Lamp on/off: uniform change on the lamp layer, per-room (materials cloned per room sharing the same program via a fixed `customProgramCacheKey`, so no recompile).
- TV/CRT/monitor spill: downsample the live canvas to 1x1 at 5-10 Hz (drawImage into a tiny canvas), set `uTV` colour; the baked A layer provides the spatial falloff and occlusion. This is cheap dynamic GI that makes the CRT clearly light the room.
- Torch/flashlight or other genuinely dynamic point light: limit to 1 per-pixel light on high only.
- Remove the 5-point-light Phong rig on potato, low and medium (keep for high on shiny props only).

### 2.6 Time of day, windows, atmosphere
- Time-of-day: sun layer blended between 2-3 baked sun directions, sky/ambient tint, sun colour and lamp usage by uniform. Since the site's "today" is a fixed 1999 date, drive it from the real clock hour (or the existing environment code `hs-environment.js`).
- Emissive windows: neighbouring houses at night use a seeded random set of lit windows (vertex colour flag + `MeshBasicMaterial`/layer), cars' headlights as emissive boxes, street lamps with a warm emissive head. Daytime windows are bright emissive glass panes/outdoor view planes only as solid geometry thickness (no 2D cards).
- Fog/atmosphere: linear `Fog` (cheap in three: one mix per fragment) doubles as far-plane culling and hides pop-in; tint warm for evening; a vertex-coloured sky dome (1 draw) with horizon gradient; sun disc as small emissive sphere. Avoid volumetric rays on weak tiers; on high, a few additive solid light-shaft prisms near windows are an option.
- Tone: keep LinearEncoding output in r128; do all colour work in the bake in linear then write gamma-encoded 8-bit, and decode in shader (cheap `pow` or a sqrt approximation).

### 2.7 Stylised options compared (cost on tilers, fit for a 1999 house)

| Option | Per-pixel cost | Pros | Cons | Fit |
|--------|----------------|------|------|-----|
| Baked lightmap + vertex AO ("Classic 1999") | ~1 fetch | Period-correct; huge quality jump; cheapest | Needs the bake pipeline | RECOMMENDED default for all tiers |
| `MeshToonMaterial` with `gradientMap` | Same light loop as Phong (all dynamic lights) | Built into r128; easy | No saving; banding per light is ugly with 5 pooled lights swapping; `gradientMap` needs `NearestFilter`, no mips; gradient texture fetch per light | Only for the games/hero props; not the house shell |
| Banded baked light (posterise the lightmap luminance in shader) | +~6 ALU | Free toon look; keeps hue; consistent in every room; works on potato | Only as good as the bake | RECOMMENDED "Cartoon" look |
| Custom toon + rim light | +~8-15 ALU, needs normal and view in fragment | Nice on hero props (controller, toys, figurines) | Per-pixel normals cost; box props look flat-rimmed | Medium/high, few props |
| Inverted-hull outlines | +1 draw and 2x vertices per outlined object; fragment cost low | Cheap on GPU; stylish | Needs smooth/extra normal data; breaks on hard-edged boxes without a smoothed normal attribute; not for large shells | Medium/high, <= ~30 hero objects |
| Post-process edge detection (depth/normal Sobel via EffectComposer/OutlinePass) | Extra full-scene pass for normals/depth + 1-2 full-screen passes | Outlines everything | Extra render targets, bandwidth, tilers hate it, multiplies pixel cost | High tier optional only; NEVER on mobile |
| Outline drawn into procedural textures (dark edge strokes on canvas faces) | 0 | Free; period-feeling hand-drawn look; you control every texture | Does not give silhouette outlines | RECOMMENDED for all tiers in Cartoon look |
| Soft toon / painterly | Texture overlay = +1 fetch (+ noise) | Warm illustrated feel | Hard to do on flat boxes; can look muddy | Optional: soft smoothstep banding + paper noise only on high |

Reference for what makes cel shading read well: Mitchell, McTaggart and Green, "Illustrative Rendering in Team Fortress 2" (NPAR 2007): baked diffuse, rim lights, a warm-cool ramp (the "Lambert ramp" in Valve's case), strong silhouettes; three.js docs for `MeshToonMaterial`/`gradientMap`.

### 2.8 Recommendation for the art direction
- Default "Classic": baked soft lightmaps + AO + warm/cool 1999 colour grading, CRT glow, fog. Period feeling comes from low-res lightmap blocks, vertex-lit props, warm tungsten bulbs, bright cool windows.
- Optional setting "Look: Classic / Cartoon" (the owner suggested cel): same baked data, but with 3-4 band posterisation of luminance (smoothstep width ~0.08), dark edge strokes in textures, inverted-hull outlines on a small hero set at medium+ (not the shell), rim on hero props at high. Banding snippet (applied to the sampled light, not N.L):
  ```glsl
  float l = dot(light, vec3(0.299, 0.587, 0.114));
  float b = floor(l * BANDS + 0.5) / BANDS;           // hard
  b = mix(l, b, uToon);                                // uToon 0..1 = soft..hard
  light *= (b / max(l, 1e-3));                        // keep hue
  ```
- Why not make cel the global default: a 1999 UK house is a place of wallpaper, carpets and beige plastic; toon outlines on everything change the tone from nostalgic-realistic to cartoon. Provide it as a user look, not the baseline.

---------------------------------------------------------------------
## 3. Quality tiers, exactly

Add `potato` below `low` (the code has `low/medium/high`). Tiers are cumulative.

| Setting | Potato | Low | Medium | High |
|---------|--------|-----|--------|------|
| Max drawing buffer | <= ~0.35 MP (about 640x480), upscaled with CSS (`image-rendering: pixelated` option = CRT retro) | <= ~0.8 MP | DPR <= 1.5 | DPR <= 2 |
| Dynamic resolution floor | 0.6 | 0.5 | 0.6 | 0.75 |
| Frame cap | 30 | 30-60 (auto) | 60 | display rate up to 120 |
| MSAA | off | off (mobile tilers: test, 4x often cheap) | on | on |
| Surface shader | baked only (Basic + lightMap/vertexColor or layered shader) | baked layered | baked layered | baked layered + Phong specular on shiny props |
| Dynamic per-pixel lights | 0 | 0 (uniform lamps only) | 1 (nearest) | up to 5 |
| Hemisphere/ambient for props | ambient-cube uniforms | ambient-cube | ambient-cube | ambient-cube + light probes |
| Shadows | baked + blob | baked + blob | baked + planar for carried items | baked + 1 shadow map (1024; 512 on mobile) |
| Cartoon outlines | texture strokes only | texture strokes | + hull outlines <= 20 hero | + rim, optional post edge |
| Time-of-day | one baked mix, lamps on/off | layered | layered | layered + exposure adapt |
| Fog | linear, also sets `camera.far` | same | same | same + sky dome detail |
| Room set (portals) | current + 1 portal level (depth 0 beyond) | depth 1 | depth 1-2 | depth 2 |
| Outdoor draw distance | short (fog end ~ 60 m) | 90 m | 140 m | full |
| Transparent objects | none (opaque tinted glass) | glass only | glass + few | all |
| Live screens | 12 Hz, 128-256 px, off when < 64 px on screen | 20 Hz | 30 Hz | 60 Hz |
| Anisotropy | 1 | 1-2 | 4 | 8 (16 on request) |
| Max texture size / atlas | 256 / 1024 | 512 / 1024 | 512-1024 / 2048 | 1024 / 2048 |
| Texture memory budget | <= 96 MB | <= 160 MB | <= 320 MB | <= 640 MB |
| Particles/decor | off | minimal | on | on |
| Background cadence | 5 | 10 | 10 | 15 |
| Precision | fragment mediump | mediump if tested | highp | highp |
| Power preference | default (let the OS pick) on phones | same | high-performance | high-performance |

### 3.1 Automatic tier pick (extends `Q` in `hs-world.js`)
1. Static signals (instant): GPU string (existing regexes), `deviceMemory` (Chromium only), `hardwareConcurrency`, DPR x screen size, `maxTextureSize`, WebGL2 yes/no, `MAX_TEXTURE_IMAGE_UNITS`/`MAX_FRAGMENT_UNIFORM_VECTORS`, touch device. On iOS `deviceMemory` is absent: use screen/DPR and the string "Apple GPU". Optionally add `detect-gpu` (pmndrs, MIT) to map GPU string to a benchmark tier (0-3) from a published benchmark table; self-host its JSON so it works offline and obeys the site's CSP (`script-src 'self'`).
2. Micro-benchmark (1.5-3 s, hidden behind the existing loading/reveal): render the heaviest scripted view (the front-garden and bedroom-door views) for N frames per candidate tier starting from the static guess. Per tier: discard 10 frames (shader compile, upload), measure 40 frames. To measure GPU-inclusive time without extension support, end each frame with a 1x1 `gl.readPixels` (forces a sync; benchmark only, never in play) and take the median of `performance.now()` deltas. Where `EXT_disjoint_timer_query_webgl2` exists (not on Safari; sometimes disabled for security), use GPU time instead. Choose the highest tier whose p50 <= 13 ms (60 fps target) or p95 <= 28 ms (30 fps target); else step down. Cap the whole probe at 3 s and fall back to the static guess.
3. Persist the result in `localStorage` keyed by `{gpuString, screen, dpr, version}`; re-probe if the key changes or after a version change; allow manual override (the existing menu).

### 3.2 Runtime adaptation (replace the plain fps rule)
- Measure per-frame time over a rolling window of RENDERED frames (not idle ones), keep p50/p95; ignore frames after tab visibility changes or loading.
- Down-step order when p95 > budget for 2 s: (1) render scale -0.125 to the floor, (2) turn off MSAA and anisotropy, (3) drop dynamic lights/shadows/outlines, (4) lower live-screen rate, (5) step tier down (guard: no more than one tier per 8 s).
- Up-step only after 20 s stable with p95 under 70% of budget, one thing at a time, and never within 60 s of a down-step (prevents oscillation). Count thermal throttling (frame-time slope rising over 3-5 minutes on phones) as a reason to step down and hold.
- Log each step to the existing perf overlay and `localStorage` so the next session starts at the stable point.

---------------------------------------------------------------------
## 4. Measurement plan (headless Chromium without a real GPU)

### 4.1 What each tool can and cannot tell you
- SwiftShader (CPU-based Vulkan via ANGLE) and llvmpipe (Mesa software GL) both run shaders on the CPU. They are good for: correctness, draw-call/triangle/texture counts, relative fragment-cost comparisons (a change that halves ALU shows as a big drop), and CPU-side submit cost. They are poor for absolute fps and for anything that depends on tiler behaviour or bandwidth.
- Flags (the tests already use these; extend):
  - SwiftShader: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (the repo already uses `--use-gl=swiftshader` and `--enable-unsafe-swiftshader` variants; `lean-qa.mjs` uses the ANGLE form).
  - llvmpipe via system Mesa/EGL: `--use-gl=angle --use-angle=gl-egl` (or `--use-angle=gl`), `--headless=new`. Control its threads with `LP_NUM_THREADS=2` (env) to mimic a 2-core potato; `taskset -c 0,1` pins the whole browser.
  - Always log `UNMASKED_RENDERER_WEBGL` into the result file so runs are comparable; do not compare numbers between the two backends.
- CPU throttling (DevTools protocol, Playwright `page.context().newCDPSession(page)`): `Emulation.setCPUThrottlingRate {rate: 4}` (Lighthouse's "mid-tier mobile" assumption) and `6` (low-end). It slows the renderer main thread, which is where the draw-call, matrix, culling and JS cost live; it does NOT slow the GPU process/SwiftShader threads.

### 4.2 Three separate benchmarks (so causes are not mixed)
1. CPU-submit benchmark: set the viewport to tiny (e.g. 64x48) so fill is negligible, throttle CPU 4x and 6x, wrap `renderer.render` with `performance.now()` for 300 frames at each fixed view, and report p50/p95 ms per render() call. This isolates draw-call, culling, sorting and uniform-upload cost and is the right proxy for phones with weak CPUs.
2. Fill benchmark: no throttle, SwiftShader/llvmpipe, same views at 1x and 0.5x render scale. The delta approximates per-pixel cost; compare shader variants (Phong vs baked) as a ratio.
3. Whole-frame benchmark: rAF delta histogram over 600 frames on a scripted walk path (bedroom -> landing -> stairs -> hall -> lounge -> kitchen -> garden -> drive -> street) with `graphics.dynamic=false`, fixed time of day, seeded `Math.random`, `House.gfx('<tier>')`. Record p50/p95/p99 frame time, % frames > 33 ms and > 50 ms (jank), and long tasks (`PerformanceObserver({type:'longtask'})`).

### 4.3 Deterministic gates (these never flake, put them in CI)
- Per fixed view and per tier assert `renderer.info.render.calls`, `.triangles`, `info.programs.length`, `info.memory.textures/geometries`, and an estimated texture memory (sum of w*h*4*1.33 for tracked textures).
- Existing baseline from the smoke runs: bedroom-door 815, desk-pc 506, tv 427, landing 496, kitchen 260, front garden 908.
- Proposed budgets (draw calls / triangles / programs), per view:

| Tier | Draw calls | Triangles | Programs | Texture memory |
|------|-----------|-----------|----------|----------------|
| Potato | <= 120 | <= 60k | <= 8 | <= 96 MB |
| Low | <= 200 | <= 120k | <= 12 | <= 160 MB |
| Medium | <= 350 | <= 250k | <= 20 | <= 320 MB |
| High | <= 600 | <= 500k | <= 30 | <= 640 MB |

- Per-room sub-budgets: sum of visible rooms (current + portal neighbours) must fit the table; give each room a budget row in a JSON file (`tests/budgets.json`) and fail the test when a change exceeds it by more than 10%.
- Allocation gate (1.7), overdraw gate (below), and "no black frame" gate on the walk path (read back a downscaled framebuffer or use `screenshot` and assert mean luminance above a threshold).
- Overdraw visualisation: debug flag that overrides all materials with `MeshBasicMaterial({color:0x101010, blending: AdditiveBlending, depthTest:false, depthWrite:false, transparent:true})` for one frame, then reads the canvas and computes the mean/95th percentile brightness; calibrate so that brightness 16 = one layer. Keep average overdraw under about 2.5 and 95th percentile under 6 on potato views.
- Tooling for deep dives: Spector.js (draw-call capture), Chrome DevTools Performance and WebGL inspector, `chrome://tracing`, on real phones remote debugging (`chrome://inspect`) and Safari Web Inspector; Arm Performance Studio (Streamline), Qualcomm Snapdragon Profiler for the vendor counters. Plan at least a few real devices: a cheap Android (Mali-G52 or Adreno 610 class), an older iPhone, a 2013-2016 Intel HD laptop.

### 4.4 Reporting
- `tests/perf-matrix.mjs` writes `shots/perf-<date>.json`: one row per (view, tier, backend, throttle) with calls, triangles, programs, textures, p50/p95 render ms and p50/p95 frame ms. A short script diffs two files and prints regressions. Keep results versioned in `docs/`.

---------------------------------------------------------------------
## 5. Staged implementation plan

### Stage 0: instrument and cheap wins (2-4 days)
- Add the perf matrix, budgets file, allocation and no-black-frame gates (section 4). Add a developer overlay (calls, triangles, programs, ms p50/p95, tier, scale).
- Cheap wins: pixel budget caps and the `potato` tier (4); frame cap and pacing (1.5); live-screen throttling and footprint skip (1.6); `camera.far` = fog end plus outdoor distance cull; confirm static objects have `matrixAutoUpdate=false` and `scene.autoUpdate` behaviour; remove per-frame allocations found by the audit; canvas texture memory diet.
- Expected gain: 10-30% frame time on weak CPUs, smoother pacing, big win on high-DPR phones. Risk: low.

### Stage 1: geometry submission (1-2 weeks)
- Static room merge with chunking and vertex-colour flat props; pick proxies; editor bypass; portal narrowing; InstancedMesh chunks for outdoor repeats; runtime atlas for small non-tiling textures.
- Expected: draw calls 400-900 -> 100-200; CPU render time -50-70%; triangle count unchanged. Risks: interaction/picking regressions, editor, runtime material mutation (colour changes of merged objects need a vertex-colour update path), seams/gaps in culling, z-fighting if merge changes depth precision (it does not), memory spikes while building (merge one room at a time in idle slices).
- Exit criteria: all per-view draw budgets met for medium; all interaction tests (`tests/` suite) pass; walk path shows no black frames.

### Stage 2: baked lighting (2-3 weeks) - the look upgrade
- Build the bake tool (rays vs room solids), the `.bin` format, runtime loader, `MeshBasicMaterial+lightMap/vertexColors` first, then the layered shader with lamp/sun/TV uniforms, ambient-cube probes for props, blob and planar shadows, remove dynamic lights from potato/low/medium.
- Expected: fragment ALU down ~4-8x on the house shell; room look gains AO, soft shadows, light bleed, window patches, lamp pools. Risks: bake time and tool robustness, editor invalidation (hash fallback), door-spill artefacts, lightmap seams, 8-bit banding (dither), keeping bake in sync with procedural builders; mitigate with golden screenshots per tier and keeping the old Phong path as the "High" tier until parity is proven.

### Stage 3: style and atmosphere (1 week)
- "Classic / Cartoon" look switch (banding, texture strokes, hull outlines for hero props, rim), time-of-day blending, emissive windows/street lamps, sky dome, fog tuning, TV/monitor spill. Per-tier fallbacks per the table.
- Expected: strong perceived quality for little runtime cost. Risks: art direction taste calls; hull outlines on box meshes need smoothed normals; keep behind the look option.

### Stage 4: auto-tier and polish (1 week, then optional items)
- Micro-benchmark tier pick plus the new adaptation policy (3.1, 3.2); persist per GPU key.
- Optional: offline KTX2 for baked assets; evaluate a three.js upgrade on a branch only after Stage 2 (see 1.13); consider `detect-gpu` data.
- Not planned: worker rendering.

---------------------------------------------------------------------
## Stage 0 results (2026-10-26)

Implemented in the working tree; no deployment. `tests/perf/matrix.mjs` owns a disposable server and records the three separate probes, actual backend, deterministic scene/resource gates, room budgets, sampled black-frame/heap checks and canonical PNGs. See `tests/perf/README.md` for the one-command matrix, comparison, CPU throttling and Mesa options.

The recorded full runs use SwiftShader, CPU rate 1, 300 tiny-buffer submissions per view, 30 synchronised fill samples per scale and 600 rendered route frames at 854×536. CPU/fill values below are medians of the six per-view medians, **not** pooled frame percentiles. Texture MB estimates referenced RGBA images plus mipmaps, rather than total process RAM or measured VRAM.

| Run | Maximum canonical draws | Texture MB, warmed house | CPU submit p50 ms | Fill 1× / 0.5× ms | Route p50 / p95 / p99 ms |
|---|---:|---:|---:|---:|---:|
| Before Low | 908 | 93.7 | 15.5 | 662.3 / 381.9 | 233.4 / 916.7 / 1266.7 |
| After Low | 939 | 91.6 | 13.1 | 595.3 / 412.6 | 233.3 / 1000.0 / 1399.9 |
| After Potato | 937 | 50.6 | 9.2 | 346.2 / 230.8 | 116.6 / 333.3 / 516.6 |

Raw evidence: `docs/perf-stage0-{before,after}-swiftshader.json`; screenshots under `tests/shots/perf/{before,after}/`. Low's route median is unchanged and its p95 is higher. Host load varied roughly 30–90 on 12 CPUs, so these timings do not establish a reliable Low FPS gain or predict hardware FPS. Potato trades detail for a smaller buffer and simpler lighting; it is a new tier, not an equal-quality comparison with Low.

Potato caps each house drawing buffer at 350,000 pixels and 30 Hz, offers a pixelated picture bounded by 640×480, uses zero point lights, Low grass density, portal depth equal to Low and outdoor fog ending at 3000 cm with the same camera far plane. Medium/High keep their original distance and original texture rasters. Static weak-tier rasters are capped at 256/512; original sources remain available for repaint, context recovery and higher settings. Live CRT/Game Lad pictures are limited to 12/20/30/60 Hz by tier and projected size, with no mipmaps and anisotropy 1. Simulation/input retain their own cadence.

The renderer reuses visibility/material/node records and projection scratch storage; media-slot matrices and home records are reused. Idle callbacks can report no change, and the watchdog avoids drawing an unchanged idle room. The downstream house pack is compiled/warmed after loading. The saved menu adds Potato, optional CRT pixels and an FPS/frame-time/call counter. `node tests/perf/check.mjs` passed pixel caps at 1366×860, 2560×1440, 390×844 and 844×390; texture restoration, live uploads, menu/refresh, fire-off, idle draws and frame-cap checks.

Stage 0 budgets are regression ceilings for the existing unmerged scene, with 10% tolerance. The section 4 draw-reduction targets still require Stage 1. Warm-up makes more resources resident early; the Low front view increased from 908 to 939 calls, within its gate. The camera rail samples every room and street scenery; it does not test a collision-valid walked route. Movement/collision code was left untouched. Heap gating covers retained growth, with raw heap samples and a sampled retained-allocation profile; this does not prove zero transient allocations in three.js, DOM strings or picking/movement paths.

Full timed evidence in this run covers Low and Potato. The before Medium/High capture/count run completed; the after capture run stopped after its first Medium view at the worker time limit, so Medium/High visual parity is NOT verified. Full smoke was interrupted after passing signup, account/house, walk-refresh, PC controls, console play, phone typing, prop-refresh and menus. `tests/story-ch1.mjs` was not reached and remains required before shipping. Optional 4×/6× throttled runs, a full llvmpipe matrix, physical devices and thermal behaviour remain unverified. No claim of a GPU bake, batching or portal-frustum implementation is made here.

---------------------------------------------------------------------

## 6. Sources (all public; URLs checked to resolve on 2026-10-26 unless noted)

three.js
- three.js docs: https://threejs.org/docs/ (WebGLRenderer, InstancedMesh, MeshToonMaterial, MeshBasicMaterial `lightMap`, BufferGeometryUtils). The manual pages "Optimize lots of objects" and "Rendering on demand" exist under https://threejs.org/manual/ (two direct links I tried returned 404 today; search the manual index).
- r128 source (read today): https://github.com/mrdoob/three.js/tree/r128 (`WebGLRenderer.js` compile/initTexture/context names, `WebGLRenderLists.js` sort, `meshbasic_frag.glsl.js` lightmap, `Material.js` precision, `examples/jsm/utils/BufferGeometryUtils.js`, `examples/jsm/loaders/KTX2Loader.js`).
- Migration guide (colour management, light units, API renames): https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Discover three.js, tips and tricks: https://discoverthreejs.com/tips-and-tricks/
- three-mesh-bvh: https://github.com/gkjohnson/three-mesh-bvh ; detect-gpu: https://github.com/pmndrs/detect-gpu

WebGL / browser
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- Khronos extension registry: KHR_parallel_shader_compile https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/ ; EXT_disjoint_timer_query_webgl2 https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
- web.dev rendering performance: https://web.dev/articles/rendering-performance

GPU vendor guidance
- Arm Mali GPU Best Practices: https://developer.arm.com/documentation/101897/latest/
- Apple, tile-based deferred rendering: https://developer.apple.com/documentation/metal/tailor-your-apps-for-apple-gpus-and-tile-based-deferred-rendering
- Imagination Technologies, PowerVR Performance Recommendations (alpha test/discard, hidden surface removal); Qualcomm Adreno developer docs and Snapdragon Profiler (cited from their developer sites; not fetched today).

Engine and technique references (cited from memory, not re-fetched)
- Mitchell, "Shading in Valve's Source Engine", SIGGRAPH 2006 (ambient cube, baked radiosity).
- Mitchell, McTaggart, Green, "Illustrative Rendering in Team Fortress 2", NPAR 2007 (ramped diffuse, rim light, baked lighting for stylisation).
- Luebke and Georges, "Portals and Mirrors: Simple, Fast Evaluation of Potentially Visible Sets", I3D 1995; Teller and Sequin, "Visibility Preprocessing for Interactive Walkthroughs", SIGGRAPH 1991.
- Abrash, "Graphics Programming Black Book" (lightmaps and surface caching in Quake).
- Lighthouse CPU throttling guidance (4x mid-tier, 6x low-end) in the Chrome DevTools / Lighthouse docs.

Caveats: I did not run device benchmarks; every "expected impact" figure is an estimate from the measured draw counts and mechanism, to be confirmed by the Stage 0 matrix. Version details of later three.js releases (compileAsync, BatchedMesh, colour management dates) are from memory of the changelog and should be re-verified against the Migration Guide before any upgrade work.


## One look results (2026-10-28, release gate in progress)

Equal-quality, same-session batch/unbatch comparison on the current scene: SwiftShader,
adaptation rung 0, all doors open, first station in each room. Counts include the whole
visible scene, not just the named room.

| View | Unbatched draws | Batched draws | Reduction |
|---|---:|---:|---:|
| Bedroom | 532 | 360 | 32.3% |
| Landing | 870 | 729 | 16.2% |
| Hall | 855 | 674 | 21.2% |
| Cupboard | 273 | 210 | 23.1% |
| Lounge | 812 | 660 | 18.7% |
| Garden | 144 | 94 | 34.7% |
| Drive | 544 | 408 | 25.0% |
| Kitchen | 288 | 224 | 22.2% |

Evidence: `/tmp/gate-HzG0/gfx-probe.mjs.log`, zero browser errors, 378.7 ms cumulative
batch construction work during the session. Spatial batching can submit extra triangles
at a cell boundary; these measurements establish fewer draw calls, not hardware FPS.
Hall/landing remain above the aspirational draw targets in section 4. Whole-room aperture
rejection is unsuitable for the current shared-wall geometry; only vegetation uses it.

The 72-view doorway comparison and 54 room/time/device lighting captures passed in
`/tmp/gate-LMG5`, with zero image differences in the doorway comparisons. A focused
follow-up covers the final vegetation path. GL-rebuild regression in `/tmp/gate-HzG0`
retained all 235 static batches, exact camera pose/zoom and PC power; before/after captures
in `tests/shots/gfx-context/` were reviewed and match.

The Stage 0 timing files above predate the approved plot and new props and are historical
evidence, not a timing baseline for this release. Physical Edge/Android devices, gamepads,
thermal behaviour and an independent hardware GPU benchmark remain unverified.

Final smoke and focused vegetation/small-phone follow-ups are still required before deployment.

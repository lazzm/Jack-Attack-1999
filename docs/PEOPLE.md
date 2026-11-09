# People v2: how the family is drawn (design notes)

Owner's verdict on v1 (2.57.0 RC): "Oh no they look cursed!" This file is the research behind the redesign and the
rules the rig (`app/public/js/np-rig.js`) now follows. Keep it up to date when the people change.

## Why v1 looked cursed
- Semi-realistic features on primitive heads: a protruding nose blob, glossy separate lips, realistic eyeballs with
  whites, irises and moving lids, all on a plain egg. Realistic parts on a simplified whole is the classic uncanny mix
  (Polycount threads on stylised heads: "realistic eyes pulled an otherwise stylised head into the valley").
- Mannequin proportions (7+ heads tall, thin stiff limbs, small head) with toy-like simplification: neither real nor
  cartoon. The eye reads "doll", then "corpse".
- A notched, hard-edged fringe and a shiny helmet of hair.

## Research takeaways (sources at the end)
1. **Pick one level of abstraction and apply it everywhere.** Appeal comes from consistency: if the body is simple,
   the face must be equally simple. Minimal stylisation (dot/oval eyes, a short curve for a mouth, a hint of a nose)
   avoids the valley entirely; the valley lives in "almost real".
2. **Baby-schema cues read as friendly** (Lorenz 1943; Glocker et al. 2009, *Ethology*, which manipulated face width,
   forehead height and eye size in real infant photos: higher baby schema = rated cuter, more caretaking motivation):
   a big round head, high forehead, large low-set eyes, round cheeks, small nose and mouth. Use them strongly on the
   children and gently on the grown-ups (so Mom and Dad still read as parents).
3. **Silhouette first, detail on top** (Valve, TF2 "Stylization with a purpose", GDC 2008, and the Gamasutra write-up):
   each person must be recognisable as a black shape (Mom's bob, Dad's height + glasses + tie, the sister's bunches),
   put detail on the head and chest where the eye goes, keep the lower body darker/simpler, and lift figures off the
   background with a rim light instead of crushing shadows to black (Mitchell et al., "Illustrative Rendering in TF2",
   NPAR 2007).
4. **Late-90s characters painted their faces.** N64/PS1/Dreamcast-era characters were low-poly heads with small
   painted face textures (often 32-64 px), and swapped eye and mouth frames from an atlas for blinking and talking
   (texture swap or UV offset driven by code). Modern stylised games (Animal Crossing's villagers, many indie
   "PSX-style" packs) still do the same: the head is split into eye and mouth regions whose texture changes, so
   expressions cost no geometry.
5. **Hair as a few chunky masses**, not strands: one rounded cap plus 1-3 big shapes (a fringe, bunches, a quiff).
   Soft rounded edges, no notches, a matte finish.
6. **Toon-ish shading in three.js r128**: per-material `onBeforeCompile` injections keep the stock lighting (so the
   people sit in the same light as the house) and add a cheap rim term on Medium/High; `MeshToonMaterial` bands badly
   with the house's swapped point lights (docs/GRAPHICS.md 2.x), so it is not used. Inverted-hull outlines double the
   triangle count; not used (the 1999 look did not have them).

## The decision: rebuilt procedural meshes + painted canvas atlas faces (option a)
- Billboards/paper dolls (b) break the house rule "nothing 2D in the 3D world" and look wrong from the side.
- Imported or AI-generated face art (Gemini was available) would not match the procedural bodies and could not be
  re-coloured per kid; hand-written canvas painting gives crisp, consistent, tintable art at any tier size for 0 bytes
  of downloads. So no image files are shipped for v2 (no `art/people-v1/` needed).
- Each person: ONE skinned mesh (vertex colours + one per-person atlas texture, one material: one draw call) + the
  contact-shadow mesh (second call). Same skeleton, IK walk, actions and props as v1.

### Proportions (real heights kept: the house is real scale)
| | height | head (skull) | heads tall | notes |
|---|---|---|---|---|
| Mom | 163 | ~30 cm | ~5.4 | round face, chunky bob with side fringe |
| Dad | 178 | ~31 cm | ~5.7 | squarer jaw, glasses, side parting |
| Sister (9) | 133 | ~30 cm | ~4.4 | eyes lower, rounder cheeks, bunches |
| Trick-or-treater (7) | 122 | ~29 cm | ~4.2 | |
Legs stay long enough to sit on 45 cm seats with the feet on the floor (adults); children's feet may dangle.

### Faces (per-person 512 px atlas; 256 on Potato)
- Face base cell: cheeks (soft blush), brows, a nose shadow; the nose itself is only a small smooth bump in the head.
- Eye frames: open / half (reading, washing up) / closed (blink) / happy. Big dark ovals with two catchlights, a
  lash flick for Mom; no whites, no eyeballs. Gaze = the painted eye shifts a little (no 3D eyeballs).
- Mouth frames: closed smile / small open / open / "oh". With a recorded line playing (js/st-voice.js) the frame follows
  the recording's loudness (an AnalyserNode on the voice chain) and the "oh" shape comes from the vowel at the current
  point of the line; without a recording (or with sound off) it keeps time from the line's vowels and punctuation.
- Speech bubbles (js/np-bubble.js, css/np-bubble.css): a white comic balloon with a coloured name tab hangs over the
  speaker's head (projected each frame), its tail at the mouth, typed on in step with the audio; off-screen, behind you
  or in another room it sits at the screen edge with its tail pointing their way. It keeps clear of the crosshair, carry
  panel, objective line, map and touch controls. The bottom box is the "Subtitles" setting (pause menu) and the
  fallback for lines with nobody in the house to hang a balloon on.
- The fragment shader picks the frames from uniforms, so blinking and talking cost no geometry or texture uploads.
- Round 7: the front-of-head mask also supplies a warm minimum face brightness in the existing Lambert/Phong
  material. It preserves brighter room lighting and the painted dark eyes/lips; hair, clothing and the back of the
  head keep their world shading. No light, material, draw or geometry is added. Mouth width is 1.4 times the round-6
  range, with a larger continuous aperture, broader brows and stronger smile squash. The painted happy-eye curve is
  reserved for a smile's peak.
- Forty priority recordings have clip-time painted-mouth cues in `app/public/audio/voice-phonemes.json`: two welcomes,
  23 Chapter 1 lines and fifteen time-of-day talk lines. These are a curated priority set, not measured production
  frequency rankings. The offline helper `tools/audio/author-mouth-cues.py` constrains directed phonetic sequences
  to recorded word spans using the host's existing acoustic model; sub-word timings remain estimates. It never writes
  recordings. The source review is in `tests/shots/models/r7-phoneme-alignment.json` after running it. Playback rejects
  a different file/duration, accounts for the actual joined-name duration and gap, and retains activity-weighted
  articulation for other clips, names and unmatched voiced lead-ins. Contact closures can reach their frame within
  16 ms; other mouths retain a short blend. Recorded phrase endings and joke cues share that same source clock.
- Listening targets hold for 850 ms through a turn gap, then release; a new nearby speaker takes over immediately.
  Small eye darts and head roll stay restrained while listening. Warm line endings and heard punchlines can produce
  a bounded response smile that survives the turn boundary. These presentation layers do not select speech, change
  dialogue history or consume additional shared random numbers.

### Budgets
- Draw calls per person: 2 (body + contact shadow).
- 4 November 2026 animation/model pass: Low/Potato near/far, **including** the six shadow triangles: Mom **2,778 / 1,726**; Dad work/home/weekend **2,958 / 1,890**; sister **2,954 / 1,830**. Other costumes are unchanged, maximum **2,998**. The family still fits six draws and 9,000 triangles. Original grouped fingers, broader skull/jaw forms, Mom's solid nape locks and the sister's parted/tapered hair reuse the existing skeleton. Detailed research, ranked critique, paired CPU timings and verification are in [ANIMATION-RESEARCH.md](ANIMATION-RESEARCH.md) and [ANIMATION-REVIEW.md](ANIMATION-REVIEW.md).
- Low/Potato: at most **3,000 triangles per person in every outfit**, at both near and far detail. Measured 28 October with `characters.mjs --only=budget`:
  | person | body near | body far |
  |---|---:|---:|
  | Mom | 2,592 | 1,576 |
  | Dad (all three outfits) | 2,880 | 1,800 |
  | Sister | 2,876 | 1,740 |
  | Children (all costumes) | 2,292–2,992 | 1,488–1,822 |
  | Grown-up in coat | 2,992 | 1,864 |
  Each contact shadow adds six triangles; the enforced limit includes those too. Medium/High near uses the more detailed meshes. The Low kitchen `draws` regression independently asserts no more than six family draw calls and 9,000 total triangles; the outfit test enforces each person's limit.
- Atlas: 512 px (Low and up), 256 px on Potato; one per person per outfit worn (about 1.4 MB with mips at 512).
- Props are only built into the people who use them (Mom: mug, sponge, spoon, magazine, can, phone; Dad: paper, mug,
  remote, sponge, briefcase; sister: mug, yo-yo, bag; kids: pail, ray gun; the grown-up: a torch).

## Sources
- Unity glossary, "Uncanny valley": https://unity.com/glossary/uncanny-valley
- Polycount discussion on realistic eyes in stylised heads: https://polycount.com/discussion/comment/2295604
- Glocker et al. 2009, "Baby schema in infant faces induces cuteness perception and motivation for caretaking in
  adults", Ethology: https://pmc.ncbi.nlm.nih.gov/articles/PMC3105163 (and https://repository.upenn.edu/cog_neuro_pubs/11)
- Disney Research, "Designing Animated Characters for Children of Different Ages" (head/eye size and spacing variants):
  https://la.disneyresearch.com/wp-content/uploads/Designing-Animated-Characters-for-Children-of-Different-Ages-Paper.pdf
- Mitchell, Francke, Eng, "Illustrative Rendering in Team Fortress 2", NPAR 2007:
  https://www.cs.princeton.edu/courses/archive/fall07/cos597B/papers/mitchell-team-fortress.pdf
- "In-depth: how Valve makes art to enhance gameplay" (silhouette, detail placement, value):
  https://www.gamedeveloper.com/art/in-depth-how-valve-makes-art-to-enhance-gameplay
- Face texture swapping for blinks/talking (N64-style eye atlases, texture swapping threads):
  https://opengameart.org/content/n64-eyes-1png , https://leadwerks.com/community/topic/13209-facial-expressions-via-texture-swapping ,
  https://discussions.unity.com/t/blinking-eyes-texture-animations/8105
- Animal Crossing-style rig with swapped eye/mouth textures: https://80.lv/articles/custom-animal-crossing-villager-3d-rig-built-in-blender
- three.js MeshToonMaterial docs: https://threejs.org/docs/pages/MeshToonMaterial.html

## Behaviour rules (owner feedback, 27 Oct)
- **Nobody pops into view.** `np-life.js` never spawns a person where the camera can see the spot (`seenAt`); they
  wait until you look away. Coming into Jack's room (Mom's first visit, her later visits, Dad for the leads, the
  sister's Game Lad cameo) goes through `entrance()`: they're got onto the landing behind the shut door out of sight
  (or walk there if you can see them), knock (the sister bursts in), the door opens, and only then do they walk in.
  On Mom's first visit the doorway is softly held from your side (the door can't be opened, walking out stops, with a
  "Mom's coming up the stairs..." hint) until she's in and has spoken. `characters.mjs --only=entrance` checks it.
- The trick-or-treaters come along the pavement from down the road before turning up the path.
- **Talking to someone mid-job** (`rig.set({ engage })` while you hold a conversation): the job pauses, they turn
  their whole body (little steps) to face you, keep one-handed things (mug, sponge, spoon, can, remote, phone), put
  two-handed things down (paper, magazine, yo-yo, drawing), and go back to the job afterwards; seated people stay
  seated and turn their head. `characters.mjs --only=interrupt` talks to everyone during every job in their routines.
- Clothes: shaped upper trouser legs meet under a rounded, rolled-under hem. Their hidden waist stays inside the top at the front, sides and back; no extra pelvis wedge, projecting waistband or rigid ledge. Dad keeps a tucked shirt and belt. `characters.mjs --only=hips` captures all sides and close waist views, plus phone/tablet portrait and landscape; `--only=hip-motion` adds real stride phases and seated views.
- Hand targets use the skeleton’s positive-X left side and negative-X right side. Lap, paper, mug, phone and job poses keep wrists on their own side; the seated gallery asserts this so crossed forearms cannot return.
- Walk: heel-strike/toe-off, pelvis sway, roll and turn with the stride, shoulders counter-turning, arm swing with
  relaxed elbows, a soft bob, leaning into stairs going up.
- November contact polish: short initial strides, heel/toe roll about the sole contact, exclusive support feet during lateral adjustment/turns, and planned stair landings that fit the forefoot uphill and heel downhill. Descending feet move clear before lowering. Stand-up retains the previous seat pose until the blend finishes; the torso transfers weight forward. Eyes use the animated head's residual angle, blinks include a half-lid phase, and secondary motion is limited to hairstyles with vertices on those bones. These changes introduce no saved fields or outfit IDs.

- Personal space: standing bodies use radii of 25 cm (Dad), 22 cm (Mom) and 18 cm (the sister). Route sampling must stop a blocked walker rather than let them creep through another body. People walk around one another, ask a standing person to move, or retreat into reachable open space; an aside uses its checked avoidance route. They resume when the other person has passed and their destination is free. `characters.mjs --only=day,space` checks three routine days, body separation and kitchen/hall crossings; seated transitions are measured separately.

Foot IK uses the solid 25 cm treads / 20 cm rises from the family house; the navigation body retains its continuous ramp. The small callback in `np-life.js` crosses the floor-level seam without changing navigation or the space below the flight.
The same height test now keeps a person on the flight in the hall's open stair render parent, independently of the
route's changing floor tag. Their logical floor/room remains available to dialogue and sound. Both ends of the open
stair air volume remain visible when either one is seen through a neighbouring doorway, including on short-distance
tiers. A cupboard occupant below the flight retains the cupboard's parent and ground height.
An initial/restored foot point inside a doorway reveal gets the nearest room on its floor (within navigation
clearance), so it cannot inherit an unrelated hidden parent and advance on the coarse off-screen timer. After an
avoidance has cleared its route, an ambient spoken line can finish while the person resumes their destination;
explicit player conversations retain their normal hold.

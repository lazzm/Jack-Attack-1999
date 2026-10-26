# Audio (generation pipeline and cast)

Owner approved the Gemini test tape (2026-10-26): "voices and audio is great".

## Tools
- Generator lives outside the repo: `~/jack-audio/gen.mjs` + `batch.json` (key in `~/.secrets/gemini.env`, never in git).
  Every generated file is logged with model, voice, prompt and filters in `~/jack-audio/out/provenance.jsonl`.
- Music: Google Lyria via the Gemini API (`/v1beta/interactions`): `lyria-3-clip-preview` for 30 s clips/tests,
  `lyria-3.5` for full tracks. Always "Instrumental only" unless we supply ORIGINAL kid-safe lyrics; never name real
  artists, songs, games or brands. Output carries an inaudible SynthID watermark.
- Voices: `gemini-3.8-flash-tts`. Put the performance direction in a short leading `[bracket tag]`; a long
  "Say this like ...: line" prompt gets read aloud. Verify every line by transcribing it back (`transcribe.mjs`).
- Post: ffmpeg loudnorm (music -16 LUFS, voice -18), optional period filters (through-the-floor muffle, console crunch).
  Ship MP3 (q4) in `app/public/audio/...`, lazy-loaded.
- Console/cartridge music that must sound like real 1998 hardware can still be written as note data and rendered in code.

## Voice cast (Gemini prebuilt voices)
| Character | Voice | Notes |
|---|---|---|
| Mom | Sulafat | Approved (take A). Upstairs lines use the "downstairs" muffle filter when she shouts from the kitchen. |
| Dad | Algenib | Exasperated, good-humoured. |
| Gran | Vindemiatrix / Achernar / Despina | Owner picking; Gacrux was dropped (sounds Northern = location clue). |
| Crystal (little sister) | Leda | Cheeky, whiny. Transcribes as "Mum" when shouted: write lines as "Mom". |
| Game announcers | Fenrir | + crunchy console filter. |

Rules: neutral British accents only for family (no regional accent = no location clue); kid-safe; no cloning real people.

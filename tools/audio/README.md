# Audio tools

Generators for Jack Attack 1999 audio (see docs/AUDIO.md for the pipeline, cast and rules).
The Gemini API key is read from `~/.secrets/gemini.env` (`GEMINI_API_KEY=...`) and is never stored in the repo.

- `gen.mjs [id ...]` - music (Lyria) and voice lines (Gemini TTS) from `batch.json` -> `out/` + `out/provenance.jsonl`
- `transcribe.mjs id ...` - transcribe generated clips back to text to verify them
- `build-page.mjs` - builds the private listening page (`listen.html`) used for owner review
- `names/gen-names.mjs [speaker ...]` - per-first-name call-outs (mom-shout, mom-call, dad-shout, sis-whine) for
  `names/names.txt`, trimmed, loudness-normalised and verified by sound-alike transcription -> `names/out/<speaker>/`

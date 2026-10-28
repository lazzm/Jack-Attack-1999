# Audio tools

Generators for Jack Attack 1999 audio (see docs/AUDIO.md for the pipeline, cast, quota and schedule).
The Gemini API key is read from `~/.secrets/gemini.env` (`GEMINI_API_KEY=...`) by the scripts themselves and is never
stored in the repo, a command line or an environment variable.

- `gen.mjs [id ...]` - music (Lyria) and voice lines (Gemini TTS) from `batch.json` -> `out/` + `out/provenance.jsonl`
- `transcribe.mjs id ...` - transcribe generated clips back to text to verify them
- `build-page.mjs` - builds the private listening page (`listen.html`) used for owner review
- `gen-lines.mjs` - story voice lines from `voice-lines.json`, batched per (character, fx), split, verified by
  transcription -> `--out` (default `app/public/audio/voice/`) + `--report`; `--dry-run`, `--max-requests N`,
  `--resplit`, `--raw DIR`, `--install DIR`
- `names/gen-names.mjs [speaker ...]` - per-first-name call-outs (mom-shout, mom-call, dad-shout, sis-whine) for
  `names/names.txt`, batched 15 per request, verified by sound-alike transcription -> `names/out/<speaker>/`;
  `--dry-run`, `--max-requests N` (or env `MAX_REQ`), `--resplit`, `--raw DIR`, `--per-name`
- `lines-lib.mjs` - shared: robust batch splitter, duration model, matcher, raw archive, Gemini client (request cap)
- `test-split.mjs` - offline tests for the above (ffmpeg only, no API)

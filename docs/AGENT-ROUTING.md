# Agent Routing Policy (Jack Attack 1999)

Goal: max quality per task. Cost is secondary; local CPU is the scarce resource (every local worker runs headless Chromium with software WebGL on a busy 12-core box).

## Evidence quality warning

Public evidence for the exact models (Codex gpt-6.1-sol; Claude Opus/Sonnet/Haiku 5.5) is mostly secondary blogs and aggregators, and they disagree. Treat the numbers below as directional. This project's own history (section 3) outranks them.

## 1. Summary of external evidence

- SWE-bench Pro: vendor-reported Opus 5.5 about 89.9%, Sonnet 5.5 about 81.3% ([CodingFleet](https://codingfleet.com/blog/swe-bench-pro-leaderboard-2026/)). No verified score found for gpt-6.1-sol. Scale had not independently scored the 5.5 or GPT-6 models as of late Sept.
- Terminal-Bench 4.0: Opus 5.5 66.4% (Anthropic) vs GPT-6 Astra 57.9% ([Vellum](https://www.vellum.ai/blog/claude-opus-5-5-benchmarks-explained)). Independent Vals run: 61.6% vs 57.1%, but Astra costs about $8/task vs about $19 for Opus ([NeuralTrust](https://neuraltrust.ai/blog/codex-vs-claude-code-benchmark)). One roundup puts Sonnet 5.5 higher still ([Morph](https://www.morphllm.com/best-ai-model-for-coding)). Harness choice moves scores by several points.
- gpt-6.1-sol: near-Astra scores at lower cost; 75.2% on DeepSWE ([Vellum](https://www.vellum.ai/blog/gpt-6-1-sol-benchmarks-explained), [Emergent](https://emergent.sh/learn/gpt-6-1-sol-benchmarks)). Vendor-reported; nearest family member used where thin.
- Frontend Code Arena: GPT-6 Astra #1, a Claude model second ([Morph](https://www.morphllm.com/best-ai-model-for-coding)). Design Arena data for 5.5 not found.
- Developer comparisons: Claude favoured for multi-file refactors, architecture, long-context reasoning and interactive work; Codex for token efficiency, sandboxed fire-and-forget runs, test generation and scoped features ([Superblocks](https://www.superblocks.com/blog/codex-vs-claude-code), [SitePoint](https://www.sitepoint.com/claude-code-vs-codex-2026/)). Weak sources; no solid head-to-head found for code review, WebGL/shaders, vision critique, or creative writing. Those rows rest on project history and general model-family reputation.

## 2. Routing table

| Task | Primary | Second opinion | Runs | Why |
|---|---|---|---|---|
| (a) Large multi-file feature, long autonomous run | Codex gpt-6.1-sol, high | Opus 5.5 review of diff | Local (Codex is local-only); cap 90 min, split work | Proven here; Claude Opus cloud as alternative for cross-cutting features |
| (b) Debug / flaky test triage | Sonnet 5.5 | Opus 5.5 if unresolved after 2 tries | Cloud (CPU-free) or local for repro | Fast, cheap, good here; Terminal-Bench favours Claude |
| (c) 3D/WebGL/shader/perf | Opus 5.5 (cloud), or Codex high for measured perf loops | Screenshot check by Sonnet/Opus | Cloud for authoring; one local run for GPU-less verification | Evidence thin; software WebGL limits profiling, so verify on real frame times |
| (d) Game design, feel, UI/UX polish | Opus 5.5 | Sonnet 5.5 playtest review from screenshots | Cloud | Claude strong on taste and iteration; Codex arenas competitive on frontend, so test both for big UI |
| (e) Screenshot art critique | Sonnet 5.5 (routine), Opus 5.5 (final) | Different model family if disputed | Cloud or local (no browser load needed beyond capture) | Multimodal reviews worked well here; evidence otherwise thin |
| (f) Story, dialogue, parody writing | Sonnet 5.5 | Opus 5.5 for dialect/location pass | Cloud | Efficient, fits 1999 voice; Opus catches slips |
| (g) Code and security review | Opus 5.5 | Codex high (cross-model) | Cloud/manager | Opus caught security and data-safety issues here |
| (h) Refactor / mechanical edits | Codex medium (scripted, codemod) | Sonnet 5.5 skim + tests | Local | Cheap and thorough; use scripts over hand edits |
| (i) Writing tests | Codex medium/high | Sonnet 5.5 for flaky-test fixes | Local, but run Playwright serially | Tests must actually run; keep Chromium load low |
| (j) Research / synthesis, design docs | Sonnet 5.5 | Opus 5.5 for decisions | Cloud | Efficient, concise output |
| Trivial lookups, renames, summaries | Haiku 5.5 | none | Cloud | Cheapest; not for logic |

## 3. Project history (given evidence)

- Codex workers: strong at long autonomous implement-and-test runs (story engine, owner tools, identity sweep, games). Weaknesses: very long changelog-style prose, occasional overruns of the 2h limit, and one null-dereference bug in a server loop.
- Claude Sonnet subagents: efficient for writing (story script, 313 lines), design docs, research, quick debugging of flaky tests, and screenshot art reviews.
- Claude Opus as manager: caught security and data-safety issues and dialect/location slips in review.

## 4. Rules

1. Cross-model review for risky server, WebSocket, persistence or data changes: author and reviewer are different vendors. Codex writes, Opus reviews, or the reverse. Null/undefined guards in server loops are an explicit review item.
2. Art and UI sign-off requires a multimodal model looking at real screenshots, never code alone. Authoring model should not be the sole judge of its own visuals.
3. CPU budget: at most 2 concurrent Chromium-running local workers. Prefer cloud Claude agents (clone, branch, push) for anything not needing Codex; they cost no local CPU. Cloud agents run tests on their own machine, so require them to report test output.
4. Codex: ask for terse output (no changelog prose, summary under 200 words), a hard stop at 90 minutes, and commit checkpoints so an overrun loses nothing.
5. Effort: Codex high for new systems and hard bugs, medium for refactors and tests, low for chores. Opus for decisions and review only; Sonnet is the default workhorse.
6. Always bump version and changelog before deploying (see version-bumps rule). Reviewers check this.
7. Escalate: Haiku to Sonnet to Opus after two failed attempts, not before.
8. Re-evaluate quarterly: record per-task outcomes here and update the table. Project data beats benchmarks.

## 5. Cost notes

Opus 5.5 per token is about 2.5x cheaper than GPT-6 Astra, yet independent per-task cost favoured Astra (about $8 vs $19) because of token use. gpt-6.1-sol is positioned as cheaper than Astra. Since the user wants max quality, spend on Opus review for risky changes and Codex high for long runs, and economise on Haiku/Sonnet for chores.

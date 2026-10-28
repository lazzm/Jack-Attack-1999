// Keep the completed room/time lighting gallery; recheck changes to batching and vegetation visibility.
process.argv.push('--checks-only');
await import('./gfx-integrity.mjs');

// Focused forced-High retry; longer software-renderer time budget.
process.argv.push('--only=desktop-high');
await import('./props-matrix.mjs');

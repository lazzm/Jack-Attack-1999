// Chapter 1's real tidy/bed/bin path against the new prop models, on gate's disposable server.
process.argv[3]='first';
process.argv[4]='/tmp/jhp-props-story-'+process.pid+'.json';
await import('./story-ch1.mjs');

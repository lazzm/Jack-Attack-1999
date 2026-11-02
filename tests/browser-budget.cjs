// The review host is shared: monitor only this runner's own Chromium descendants.
'use strict';
const fs = require('node:fs');
const {chromium} = require('playwright'), launch = chromium.launch.bind(chromium);
let active = 0;
chromium.launch = async function (...args) {
  if (active) throw Error('Only one browser may run at a time');
  const browser = await launch(...args); active++;
  let peak = 0, over = false, last = 0;
  const descendants = pid => {
    let children = []; try { children = fs.readFileSync(`/proc/${pid}/task/${pid}/children`, 'utf8').trim().split(/\s+/).filter(Boolean); } catch {}
    return children.flatMap(child => [child, ...descendants(child)]);
  };
  const timer = setInterval(() => {
    for (const pid of descendants(process.pid)) {
      try {
        if (!fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').includes('--type=renderer')) continue;
        const rss = +(fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/VmRSS:\s+(\d+)/)?.[1] || 0); peak = Math.max(peak, rss);
        if(Date.now()-last>30000){last=Date.now();console.log('BROWSER current renderer RSS MiB:',Math.round(rss/1024));}
        if (rss > 3 * 1024 * 1024 && !over) { over = true; console.error('FAIL renderer exceeds 3 GB:', rss); browser.close().finally(() => process.exit(1)); }
      } catch {}
    }
  }, 3000); timer.unref();
  browser.once('disconnected', () => { clearInterval(timer); active--; console.log('BROWSER renderer peak RSS MiB:', Math.round(peak / 1024)); });
  return browser;
};

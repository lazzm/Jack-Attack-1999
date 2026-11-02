// Local test fixture for source checkouts without the generated voice pack.
// Also usable with NODE_OPTIONS=--require=... for self-starting regression runners.
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const disposable = /^180(?:8\d|9\d)$/.test(process.env.PORT || '') && path.resolve(process.env.DATA_DIR || '').startsWith('/tmp/');
if (disposable) {
  const emit = http.Server.prototype.emit;
  http.Server.prototype.emit = function (event, req, res, ...rest) {
    if (event === 'request' && req.url.split('?')[0] === '/audio/voice/manifest.json' && !fs.existsSync(path.join(__dirname, '../app/public/audio/voice/manifest.json'))) {
      res.writeHead(200, {'Content-Type':'application/json'}); res.end('{}'); return true;
    }
    return emit.call(this, event, req, res, ...rest);
  };
}
if (require.main === module) {
  if (!disposable) throw Error('Require PORT 18080–18099 and disposable /tmp data');
  require('../app/server.js');
}

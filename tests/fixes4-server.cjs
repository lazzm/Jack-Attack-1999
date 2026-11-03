// Disposable Chapter 1 checkpoint; never loaded by the production application.
'use strict';
const path = require('node:path'), http = require('node:http');
if (!/^180(?:8\d|9\d)$/.test(process.env.PORT || '') || !path.resolve(process.env.DATA_DIR || '').startsWith('/tmp/') || process.env.ADMIN_TOKEN !== 'testtoken') throw Error('Disposable localhost server only');
require('./bonfire-server.cjs');
const story = require('../app/mods/story.js'), init = story.init;
let ctx;
story.init = function (c) { ctx = c; return init.call(this, c); };
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function (event, req, res, ...rest) {
  if (event === 'request' && req.url === '/admin/fixes4-checkpoint' && req.method === 'POST') {
    if (req.headers['x-admin-token'] !== 'testtoken') { res.writeHead(403); res.end(); return true; }
    let body = ''; req.on('data', b => { body += b; }); req.on('end', () => {
      const name = JSON.parse(body).name.toLowerCase();
      if (!ctx.state.members[name]) { res.writeHead(404); res.end(); return; }
      ctx.data.p[name] = { ch: 1, v: 2, trust: 3, flags: {}, done: Object.fromEntries(['lad','meetmom','tidy','bed','bin','dad'].map(k => [k, Date.now()])) };
      ctx.markDirty(); res.end('checkpoint');
    }); return true;
  }
  return emit.call(this, event, req, res, ...rest);
};
require('../app/server.js');

// Disposable baseline server: compile the original server at its original filename so
// relative module paths stay correct. No original source or account data is rewritten.
'use strict';
const path=require('node:path'),Module=require('node:module'),{execFileSync}=require('node:child_process');
if(!/^180(?:8\d|9\d)$/.test(process.env.PORT||'')||!path.resolve(process.env.DATA_DIR||'').startsWith('/tmp/')||process.env.ADMIN_TOKEN!=='testtoken')throw Error('Disposable localhost server only');
require('./bonfire-server.cjs');
const filename=require.resolve('../app/server.js'),original=new Module(filename,module);
original.filename=filename;original.paths=Module._nodeModulePaths(path.dirname(filename));
original._compile(execFileSync('git',['show','2040234d249f2be56f8a9a4f5bb18f6950a71201:app/server.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8',maxBuffer:2**22}),filename);

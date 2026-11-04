// Offline spoken-word inventory. No network, keys, media writes or new dependencies.
// node tools/audio/voice-audit.mjs [--write] [--json FILE] [--prepare]
// Reuses Node's bundled Acorn, as tests/parody-audit.cjs does.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const require = createRequire(import.meta.url);
let acorn;
try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); }
catch {
  const r = spawnSync(process.execPath, ['--expose-internals', fileURLToPath(import.meta.url), ...process.argv.slice(2)], {stdio:'inherit'});
  process.exit(r.status ?? 1);
}
const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = f => JSON.parse(read(f));
const catalogue = json('tools/audio/voice-lines.json');
const manifest = fs.existsSync(path.join(ROOT,'app/public/audio/voice/manifest.json')) ? json('app/public/audio/voice/manifest.json') : {};
const cast = new Set(['mom','dad','sister','gran','announcer']);
export const clean = s => String(s).replace(/\s*\|\s*$/, '').replace(/<[^>]*>/g,'').replace(/&(?:quot|#34);/g,'"').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
export function hash(s) { let h=2166136261; for (const c of clean(s)) { h^=c.charCodeAt(0);h=Math.imul(h,16777619); } return (h>>>0).toString(36); }
const person = s => /^mom\b/i.test(s) ? 'mom' : /^dad\b/i.test(s) ? 'dad' : /^gran$/i.test(s) ? 'gran' : s === '{sister}' || s === 'sister' ? 'sister' : s;
const canonical = new Map(catalogue.lines.map(l=>[l.character+'\0'+clean(l.line),l.id]));
const byId = new Map(catalogue.lines.map(l=>[l.id,l]));
const rows = new Map(), unresolved = [], scanned = [];
function add(base, speaker, text, where, context='', extra={}) {
  text=clean(text);speaker=person(speaker);
    if (!text || text.length<2 || /^\([^)]*\)$/.test(text) || /^(?:me|sys|My diary|You|you|Jack's thoughts|999)$/.test(speaker)) return;
  const old=byId.get(base), exact=old&&old.character===speaker&&clean(old.line)===text;
  const id=exact?base:canonical.get(speaker+'\0'+text)||String(base).replace(/\.+$/,'')+'.'+hash(text);
  if (!rows.has(id)) rows.set(id,{id,speaker,text,chapter:/^c([1-4])\./.exec(base)?.[1]||(/^bf\.|^hw\./.test(base)?'4':'ambient'),where:[],context,cast:cast.has(speaker),recorded:!!manifest[id],...extra});
  const row=rows.get(id); if(where&&!row.where.includes(where))row.where.push(where);
  if(extra.displayText&&clean(extra.displayText)!==text){row.displayVariants=row.displayVariants||[];if(!row.displayVariants.includes(extra.displayText))row.displayVariants.push(extra.displayText);}
  if(old&&!exact)row.differsFrom={id:base,text:clean(old.line),recorded:!!manifest[base]};
}
for(const l of catalogue.lines) rows.set(l.id,{id:l.id,speaker:l.character,text:clean(l.line),chapter:l.chapter==='5'?'ambient':l.chapter,where:[],context:l.context,cast:cast.has(l.character),recorded:!!manifest[l.id],catalogued:true});

function source(file) {
  const src=read(file), ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',locations:true}), nodes=[], scopes=new WeakMap();
  const root={parent:null,bindings:new Map()};
  function walk(n,scope,parent=null,key='') {
    if(!n||typeof n!=='object'||!n.type)return;
    if(/Function/.test(n.type))scope={parent:scope,bindings:new Map(),name:n.id?.name||parent?.id?.name||parent?.key?.name||''};
    scopes.set(n,scope);nodes.push({n,parent,key,scope});
    if(n.type==='VariableDeclarator'&&n.id.type==='Identifier')scope.bindings.set(n.id.name,n.init);
    for(const[k,v]of Object.entries(n))if(k!=='loc'){if(Array.isArray(v))for(const x of v)walk(x,scope,n,k);else if(v?.type)walk(v,scope,n,k);}
  } walk(ast,root);
  const lookup=(name,n)=>{let s=scopes.get(n);while(s){if(s.bindings.has(name))return s.bindings.get(name);s=s.parent;}return null;};
  function values(n,depth=0) {
    if(!n||depth>16)return [];
    const rec=x=>values(x,depth+1), unique=a=>[...new Set(a)].slice(0,150);
    switch(n.type) {
      case 'Literal': return typeof n.value==='string'||typeof n.value==='number'?[String(n.value)]:[];
      case 'Identifier': if(n.name==='M')return ['mom'];if(n.name==='Dd')return ['dad'];if(n.name==='Sis')return ['sister'];return rec(lookup(n.name,n));
      case 'ChainExpression': return rec(n.expression);
      case 'ConditionalExpression': return unique([...rec(n.consequent),...rec(n.alternate)]);
      case 'LogicalExpression': return unique([...rec(n.left),...rec(n.right)]);
      case 'ArrayExpression': return unique(n.elements.flatMap(rec));
      case 'ArrowFunctionExpression': case 'FunctionExpression': return n.body.type==='BlockStatement'?n.body.body.filter(x=>x.type==='ReturnStatement').flatMap(x=>rec(x.argument)):rec(n.body);
      case 'ObjectExpression':return unique(n.properties.flatMap(p=>rec(p.value)));
      case 'TemplateLiteral': {
        let out=[''];for(let i=0;i<n.quasis.length;i++){out=out.map(s=>s+n.quasis[i].value.cooked);if(i<n.expressions.length){const vs=rec(n.expressions[i]);out=out.flatMap(s=>(vs.length?vs:['{dynamic}']).map(v=>s+v));}}return unique(out);
      }
      case 'BinaryExpression': if(n.operator==='+'){let a=rec(n.left),b=rec(n.right);if(!a.length)a=['{dynamic}'];if(!b.length)b=['{dynamic}'];return unique(a.flatMap(x=>b.map(y=>x+y)));}return [];
      case 'CallExpression': {
        const name=n.callee.name||n.callee.property?.name;
        if(['cast','esc','clean','t','voiceText','pick'].includes(name))return rec(n.arguments[name==='voiceText'?1:0]);
        if(name==='toUpperCase'||name==='toLowerCase')return rec(n.callee.object).map(s=>name==='toUpperCase'?s.toUpperCase():s.toLowerCase());
        if(name==='sis')return ['sister'];if(name==='clock')return rec(lookup(name,n));return [];
      }
      case 'MemberExpression': {
        let obj=n.object;if(obj.type==='Identifier')obj=lookup(obj.name,obj);
        if(obj?.type==='ArrayExpression') {if(n.computed&&n.property.type==='Literal')return rec(obj.elements[n.property.value]);return unique(obj.elements.flatMap(rec));}
        if(obj?.type==='ObjectExpression'){const k=n.computed?rec(n.property)[0]:n.property.name;if(k===undefined)return unique(obj.properties.flatMap(p=>rec(p.value)));const prop=obj.properties.find(p=>(p.key.name??p.key.value)===k);return prop?rec(prop.value):[];}return [];
      }
      default:return [];
    }
  }
  const at=n=>file+':'+n.loc.start.line;
  function calls(name, fn) {for(const {n,scope}of nodes)if(n.type==='CallExpression'&&(n.callee.name||n.callee.property?.name)===name)fn(n,scope);}
  function callRows(n,base,who,text,context) {
    const ws=values(who), ts=values(text);
    if(!ws.length||!ts.length){unresolved.push({where:at(n),call:src.slice(n.start,n.end).slice(0,220)});return;}
    for(const w of ws)for(const t of ts)add(base.replace(/\{dynamic\}/g,''),w,t,at(n),context);
  }
  if(/season-(bonfire|halloween)\.js$/.test(file)) calls('say',n=>{
    if(n.callee.type!=='Identifier'||n.arguments.length<3)return;
    const bases=values(n.arguments[0]),prefix=file.includes('bonfire')?'bf.':'';
    callRows(n,(bases[0]||'season.dynamic').startsWith('c4.')?bases[0]:prefix+(bases[0]||'dynamic'),n.arguments[1],n.arguments[2],file.includes('bonfire')?'Bonfire Night, physical preparation / display':'Halloween, physical preparation / door');
  });
  calls('voice',n=>{if((file.endsWith('hs-life.js')&&n.callee.type==='Identifier')||src.slice(n.callee.start,n.callee.end).includes('life().voice')||src.slice(n.callee.start,n.callee.end).includes('HouseLife.voice'))callRows(n,'house.voice',n.arguments[0],n.arguments[1],'House welcome, shout or event');});
  if(file.endsWith('hs-life.js')) {
    calls('push',n=>{for(const a of n.arguments)if(a.type==='ArrayExpression'&&a.elements.length===2&&['M','Dd','Sis'].includes(a.elements[0]?.name))callRows(n,'house.moment',a.elements[0],a.elements[1],'Time-of-day house shout');});
    for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='CALLS'&&n.init.type==='ArrayExpression')for(const [i,entry]of n.init.elements.entries()) {
      const props=Object.fromEntries(entry.properties.map(p=>[p.key.name,p.value])),who=values(props.who)[0];
      for(const t of values(props.lines))add('phone.in.'+i,who,t,at(entry),'Incoming landline call');
      for(const [j,reply]of (props.replies?.elements||[]).entries())for(const t of values(reply.elements[1]))add('phone.in.'+i+'.reply.'+j,who,t,at(reply),'Caller responds to player choice');
    }
    for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='ANS'&&n.init.type==='ObjectExpression')for(const p of n.init.properties)if(p.value.type==='ArrayExpression')callRows(p,'phone.out.'+(p.key.value||p.key.name),p.value.elements[0],p.value.elements[1],'Outgoing landline call');
  }
  if(file.endsWith('ch-core.js'))calls('mom',n=>{const ts=values(n.arguments[0]);for(const t of ts)add('chore.shout','mom',t.replace(/\s*\(\{dynamic\}%\)$/,''),at(n),'Chore completion / reminder; numerical rating stays written');});
  if(file.endsWith('ch-cat.js'))for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='MOMSAYS')for(const t of values(n.init).filter(s=>!/^\d+$/.test(s)))add('chore.rating','mom',t,at(n),'Server-selected chore rating');
  if(file.endsWith('st-engine.js'))for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='dialogue'&&n.init?.type==='MemberExpression'&&n.init.object.type==='ObjectExpression')for(const p of n.init.object.properties)callRows(p,'st.opening.'+(p.key.value||p.key.name),p.value.elements[0],p.value.elements[1],'Story fallback when family cannot deliver in person');
  if(file.endsWith('st-opening.js'))calls('speakLine',n=>{if(n.arguments.length>=3)callRows(n,'st.carry',n.arguments[1],n.arguments[2],'Dad explains computer carrying');});
  if(file.endsWith('apps-programs.js'))for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='CALLS'&&n.init.type==='ObjectExpression')for(const p of n.init.properties){const who=values(p.value.elements[0])[0];for(const t of values(p.value.elements[1])){const m=/^([^:]+):\s*"([\s\S]+)"$/.exec(t);if(m&&m[1]!=='You')add('dialer.'+(p.key.value||p.key.name),m[1]==='Mom'?'mom':m[1],m[2],at(p),'JackOS Phone Dialer call');}}
  // Explicit NPC speech arrays are different from objectives, battle logs and menus.
  for(const{n,parent}of nodes)if(n.type==='Property'&&['talk','dialogue','dialog'].includes(n.key.name)&&n.value.type==='ArrayExpression') {
    const props=parent?.properties||[],id=props.find(p=>p.key.name==='id'),name=props.find(p=>['name','n'].includes(p.key.name));
    if(!id&&!name)continue;
    const who=values(name?.value)[0]||values(id?.value)[0]||'NPC';
    for(const t of values(n.value))add('game.'+path.basename(file,'.js')+'.'+who,'game '+who,t,at(n),'In-game character conversation (cast approval needed)');
  }
  if(file.endsWith('rm-g-mon.js'))calls('msg',(n,scope)=>{
    if(!/Talk$|clockmaker|trainerBattle|rivalBattle/.test(scope.name||''))return;
    for(const t of values(n.arguments[0]))if(!/^JACK |^You |^YOU |^Received|^Got |^Found |^Saved|^Your |^Party |^CRITTER/.test(t))add('game.critters.'+scope.name,'Pocket Critters '+scope.name,t,at(n),'Pocket Critters character dialogue');
  });
  if(file.endsWith('rm-g-party.js')){
    const fn=nodes.find(({n})=>n.type==='FunctionDeclaration'&&n.id.name==='hostVoiceText')?.n;
    const spoken=fn?vm.runInNewContext('('+src.slice(fn.start,fn.end)+')'):s=>s;
    const rules=nodes.find(({n,scope})=>n.type==='VariableDeclarator'&&n.id.name==='rules'&&scope.name==='hostVoiceText')?.n;
    if(rules)for(const entry of rules.init.elements)for(const t of values(entry.elements[1]))add('game.wobble.host','announcer',t,at(entry),'Wobble Party generic announcer variant; original writing remains until recorded');
    calls('host',n=>{for(const t of values(n.arguments[0]))add('game.wobble.host','announcer',/^\{dynamic\} \{dynamic\} \{dynamic\}!$/.test(t)?"LET'S SEE WHAT THE REELS HAVE DECIDED!":spoken(t),at(n),'Wobble Party host MC Wobble; variable names/totals stay written until the generic clip exists',{displayText:t});});
    calls('say',n=>{if(n.arguments.length>2)for(const t of values(n.arguments[0]))for(const w of values(n.arguments[2]))add('game.wobble.speaker',w==='MC WOBBLE'?'announcer':'Wobble Party '+w,t,at(n),'Wobble Party character dialogue');});
  }
  if(file.endsWith('rm-g-fightkit.js'))for(const t of ['DOUBLE K.O.','K.O.','RING OUT!','FINAL ROUND','TRAINING','FIGHT!','DRAW','TIME UP',...Array.from({length:9},(_,i)=>'ROUND '+(i+1))])add('fight.announcer','announcer',t,file+':943','Shared console fighting-game announcer; round/result cue');
  if(file.endsWith('season-halloween.js')){
    calls('kidsTalk',n=>{for(const arg of n.arguments)for(const t of values(arg))add('hw.kids','Halloween trick-or-treaters',t,at(n),'Halloween doorstep chorus / request; children have no assigned cast voices');});
    for(const{n}of nodes)if(n.type==='AssignmentExpression'&&n.left.name==='ask')for(const t of values(n.right))add('hw.kids','Halloween trick-or-treaters',t,at(n),'Halloween doorstep request, including named/gendered child variants; casting pending');
  }
  if(file.endsWith('pcgames-jrt.js')) {
    const phrases=['First poof!','Double Poof!','Multi Poof!','Ultra Poof!','MONSTER POOF!','Play!','Combo!','Red team scores!','Blue team scores!','poofing spree!','rampage!','dominating!','unstoppable!','godlike!','You have won the match!','You have lost the match.'];
    for(const t of phrases)add('arena.announcer','announcer',t,file+':534','Jackreal Tournament announcer; derived from server events, never player names');
  }
  // Computer and fake-web characters which already had browser speech. Their
  // existing cast identities are reported, never silently assigned family voices.
  const synth={ 'sx-eggs.js':['say','JackOS secret character'], 'sx-hunt.js':['say','Hint line'], 'era-apps-dodgy3.js':['speak','Y2K oracle'], 'era-sites-witch.js':['speak','Witch'], 'era-sites-fan.js':['speak','Pocket pet'], 'toolbars-bars.js':['talk','Toolbar character'] }[path.basename(file)];
  if(synth)calls(synth[0],n=>{if(n.callee.type!=='Identifier')return;for(const t of values(n.arguments[0]))if(t.length>2)add('computer.'+path.basename(file,'.js'),file.endsWith('toolbars-bars.js')?values(n.arguments[1])[0]||synth[1]:synth[1],t,at(n),'Existing computer / fake-web spoken character; voice choice awaits Jack');});
  if(file.endsWith('dos-quest.js'))for(const{n,scope}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='T'&&scope.name==='talk'&&n.init.type==='ObjectExpression')for(const p of n.init.properties)for(const t of values(p.value))for(const m of t.matchAll(/"([^"]+)"/g))add('game.adventure.'+p.key.name,'Adventure '+p.key.name,m[1],at(p),'Text adventure character spoken words; written stage directions excluded; cast approval needed');
  if(/discs-(rts|squigs)\.js$/.test(file)) {
    for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='SAY')for(const t of values(n.init))add('game.'+path.basename(file,'.js'),'Game '+path.basename(file,'.js')+' unit',t,at(n),'In-game unit speech bubble; no cast voice assigned');
    calls('say',n=>{if(n.arguments.length>1)for(const t of values(n.arguments[1]))if(t.length>3&&!/^(sel|move|atk|build|gather)$/.test(t))add('game.'+path.basename(file,'.js'),'Game '+path.basename(file,'.js')+' unit',t,at(n),'In-game unit speech bubble; no cast voice assigned');});
  }
  if(file.endsWith('games-cards.js'))for(const{n}of nodes)if(n.type==='VariableDeclarator'&&n.id.name==='LINES'&&n.init.type==='ObjectExpression')for(const p of n.init.properties)for(const t of values(p.value))add('game.hearts.'+p.key.value,'Hearts '+({1:'Dave',2:'cousin',3:'Gubbinz'}[p.key.value]||'player'),t,at(p),'Hearts opponent speech bubble; no cast voice assigned');
  if(file.endsWith('md-people.js')) {
    const names=new Map();calls('N',n=>names.set(values(n.arguments[0])[0],values(n.arguments[1])[0]));
    calls('N',n=>{const id=values(n.arguments[0])[0],name=values(n.arguments[1])[0],o=n.arguments[3];if(o?.type!=='ObjectExpression')return;
      for(const p of o.properties){const key=p.key.name;if(['greet','again','topics'].includes(key))for(const t of values(p.value))add('mud.'+id,'JackMUD '+name,t,at(p),'JackMUD NPC conversation; no cast voice assigned');
        if(key==='chat')for(const t of values(p.value))for(const m of t.matchAll(/"([^"]+)"/g))add('mud.'+id,'JackMUD '+name,m[1],at(p),'JackMUD idle spoken words; silent actions excluded');
        if(key==='shop')for(const q of p.value.properties||[])if(q.key.name==='thanks')for(const t of values(q.value))add('mud.'+id,'JackMUD '+name,t,at(q),'JackMUD shopkeeper thanks; no cast voice assigned');
      }
    });
    for(const{n,parent}of nodes)if(n.type==='Property'&&n.key.name==='say'&&parent?.type==='ObjectExpression'){
      const to=parent.properties.find(p=>p.key.name==='to'),id=values(to?.value)[0];
      for(const t of values(n.value))add('mud.'+(id||'quest'),'JackMUD '+(names.get(id)||id||'quest speaker'),t,at(n),'JackMUD quest completion dialogue; cast approval and spoken-only review pending');
    }
  }
  // All catalogue references, including talk pools and dynamically composed chore ids.
  for(const{n}of nodes)if(n.type==='Literal'&&typeof n.value==='string'&&rows.has(n.value))rows.get(n.value).where.push(at(n));
  scanned.push(file);
}
// Text games remain text by owner decision; their dialogue is not missing audio.
const textGames = /^(?:md-|dos-quest\.js|rm-g-mon\.js|games-cards\.js|discs-(?:rts|squigs)\.js)/;
for(const f of fs.readdirSync(path.join(ROOT,'app/public/js')).filter(f=>f.endsWith('.js')&&!textGames.test(f)&&!/^(?:np-lines|three\.min|vendor)/.test(f)).sort())source('app/public/js/'+f);
// JackMUD is intentionally text only.
// Script-only phone conversations are spoken dialogue too. Messages/chat and
// player thoughts stay out, even when their text happens to quote a character.
let section='';for(const [i,line]of read('docs/SCRIPT.md').split('\n').entries()){
  if(/^### /.test(line))section=line;
  const m=/^\| `([^`]+)` \| (mate[1-4]) \| ([^|]+) \| (.+) \|$/.exec(line);
  if(m&&/phone|call/i.test(section+' '+m[3])&&!/text|chat|message/i.test(m[3]))add(m[1],m[2],m[4].replace(/^\{mate\d\}:\s*/, '').replace(/^"|"$/g,''),'docs/SCRIPT.md:'+(i+1),'Script-only mate phone dialogue; no gameplay trigger or cast voice yet');
}

const all=[...rows.values()].sort((a,b)=>a.speaker.localeCompare(b.speaker)||a.id.localeCompare(b.id));
for(const row of all)row.where=[...new Set(row.where)];
const countBy=(key,filter=()=>true)=>Object.fromEntries([...new Set(all.map(r=>r[key]))].sort().map(k=>[k,all.filter(r=>r[key]===k&&filter(r)).length]));
const pending=all.filter(r=>r.cast&&!r.recorded), safe=pending.filter(r=>!/[{}]/.test(r.text)), unsafe=pending.filter(r=>/[{}]/.test(r.text));
const groups={};for(const row of safe){const l=byId.get(row.id),k=row.speaker+' / '+(l?.fx||'plain');groups[k]=(groups[k]||0)+1;}
const requests=Object.values(groups).reduce((n,v)=>n+Math.ceil(v/13),0);
const result={speakers:countBy('speaker'),chapters:countBy('chapter'),total:all.length,recorded:all.filter(r=>r.recorded).length,pending:pending.length,ready:safe.length,requests,groups,unsafe,uncast:all.filter(r=>!r.cast),unresolved,scanned,lines:all};
if(process.argv.includes('--prepare')){
  // Drop only this work's ungenerated obsolete host variants, never a recorded
  // clip, old family id, save key or player content.
  catalogue.lines=catalogue.lines.filter(l=>!(l.id.startsWith('game.wobble.host.')&&!manifest[l.id]&&!rows.get(l.id)?.where.length));
  for(const row of safe)if(!byId.has(row.id))catalogue.lines.push({id:row.id,character:row.speaker,tag:(row.speaker==='sister'?'cheeky':row.speaker==='announcer'?'booming':'conversational')+', neutral British',line:row.text,context:row.context+'; '+row.where.join(', '),chapter:row.chapter==='ambient'?'5':row.chapter,...(row.speaker==='announcer'?{fx:'console'}:{})});
  const pools=new Map();for(const l of catalogue.lines){const k=l.character+'-'+(l.fx||'plain');if(!pools.has(k))pools.set(k,[]);pools.get(k).push(l);}
  catalogue.batches={};for(const[k,pool]of pools)pool.forEach((l,i)=>{l.batch=k+'-'+String(1+Math.floor(i/13)).padStart(2,'0');catalogue.batches[l.batch]=(catalogue.batches[l.batch]||0)+1;});
  catalogue.totals={lines:catalogue.lines.length,batches:Object.keys(catalogue.batches).length};
  fs.writeFileSync(path.join(ROOT,'tools/audio/voice-lines.json'),JSON.stringify(catalogue,null,1)+'\n');
}
const j=process.argv.indexOf('--json');if(j>=0)fs.writeFileSync(process.argv[j+1],JSON.stringify(result,null,2)+'\n');
const cell=s=>String(s??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
if(process.argv.includes('--write')){
  let out='# Voice audit\n\nRe-run `node tools/audio/voice-audit.mjs --write`. Offline source inventory; no API calls. JackMUD, text adventures, Pocket Critters, Hearts, and the RTS/Squigs text bubbles stay text and are excluded from missing voice totals. The manifest totals below describe clips installed for playback here, not the external recording backlog: the manager reports 183 additional lines already recorded and audited. Do not regenerate those solely because they are absent from this checkout’s manifest.\n\n';
  out+='Counts include the existing script catalogue and runtime speech. A catalogue-only row is marked explicitly; it is not proof of a wired gameplay trigger. Diary pages, notes, objectives, player thoughts, chat and text messages are excluded. Game NPCs are kept separate from the approved family cast.\n\n';
  out+=`${all.length} lines; ${result.recorded} manifest recordings; ${pending.length} missing approved-cast lines, of which ${safe.length} are generation-ready and ${unsafe.length} still contain dynamic words. ${requests} requests at 13 lines maximum, grouped by character/effect, before retries.\n\n`;
  out+='## Totals by speaker\n\n| Speaker | Lines | Recorded | Missing |\n|---|---:|---:|---:|\n';for(const [speaker,n]of Object.entries(result.speakers))out+=`| ${cell(speaker)} | ${n} | ${all.filter(r=>r.speaker===speaker&&r.recorded).length} | ${all.filter(r=>r.speaker===speaker&&!r.recorded).length} |\n`;
  out+='\n## Totals by chapter\n\n| Chapter | Lines |\n|---|---:|\n';for(const[k,n]of Object.entries(result.chapters))out+=`| ${k} | ${n} |\n`;
  out+='\n## Characters awaiting Jack’s casting decision\n\n'+Object.keys(result.speakers).filter(s=>!cast.has(s)).map(s=>`- ${s}: ${result.speakers[s]} lines; no voice assigned.`).join('\n')+'\n';
  out+='\n## Words which differ from an existing recording / catalogue entry\n\n';const drift=all.filter(r=>r.differsFrom);out+=drift.length?drift.map(r=>`- \`${r.id}\`: “${r.text}”; old \`${r.differsFrom.id}\`: “${r.differsFrom.text}” (${r.differsFrom.recorded?'old recording exists':'not recorded'}).`).join('\n'):'None detected by exact catalogue comparison.';
  out+='\n\n## Spoken line inventory\n\n| ID | Speaker | Where it plays / context | Text | Manifest |\n|---|---|---|---|---|\n';for(const r of all)out+=`| \`${r.id}\` | ${cell(r.speaker)} | ${cell((r.where.length?r.where.join(', '):'Catalogue only; trigger not found')+' — '+r.context)} | ${cell(r.text)} | ${r.recorded?'yes':r.cast?'missing':'uncast'} |\n`;
  out+='\n## Static expressions needing review\n\n'+(unresolved.length?unresolved.map(r=>`- ${r.where}: \`${cell(r.call)}\``).join('\n'):'None in the recognised speech entry points.')+'\n';
  out+='\nThese two variable dispatchers forward lines already enumerated at the chore/shout pools. They contain no additional authored sentence. The inventory includes structured NPC dialogue and script-only phone conversations; it does not assign voices to uncast people. Arbitrary prose with embedded quotations and user-authored posts are not recording requests.\n';
  if(fs.existsSync(path.join(ROOT,'tools/audio/voice-rewrites.json'))){out+='\n## Previous recorded-body rewrites (unchanged in round 2)\n\n| Source | Before | After |\n|---|---|---|\n';for(const r of json('tools/audio/voice-rewrites.json'))out+=`| ${cell(r.file+':'+r.line)} | ${cell(r.from)} | ${cell(r.to)} |\n`;}
  out+='\n## Recording preparation\n\nThe four required retakes are `c2.pocket.dad4`, `c2.unbox.dad`, `c1.mom.up`, `c4.hal.sis`. `c4.xmas.eve.dad.neutral` replaces the gendered legacy Christmas line; its old ID aliases to the neutral entry and cannot reach the old MP3. Existing audio bytes are untouched. The planning report marks existing recordings verified only after checking the exact approved release hashes.\n\nBonfire’s old `c4.bon.mom2` says “Hot dogs and a cup of tea”; current `bf.supper` serves jacket potatoes, parkin and toffee. Old `c4.bon.end` says bed in half an hour; current `bf.end` says Dad is making the display safe. The current wording has separate content-qualified IDs, so those old clips cannot substitute for it.\n\nThe Wobble Party host uses generic name/score/control variants listed in SCRIPT.md. Its original writing remains until a clip exists; then its writing agrees with that clip. Remote game cues without clips keep their existing text. Family lines use the existing positional bubble/mouth queue. Uncast people still require Jack’s voice decisions; no voices were invented for them.\n';
  out+='\n## Round 2 name restoration\n\nNo recorded `line` words changed. A separate `display` template restores names on screen, including names without a clip; approved name clips precede the unchanged body when available. Dynamic house shouts carry the style and keep their old procedural sound when unrecorded.\n\n| ID | Call-out | On-screen writing |\n|---|---|---|\n';for(const l of catalogue.lines.filter(l=>l.display))out+=`| \`${l.id}\` | ${l.callout||'display only'} | ${cell(l.display)} |\n`;
  out+='\n## Every conditional announcer rewrite\n\nThese substitutions take effect only when the matching recording exists. `{dynamic}` marks a live name, total or control label in the original writing.\n\n| ID | Original display variants | Recorded / future display words |\n|---|---|---|\n';for(const r of all.filter(r=>r.displayVariants?.length))out+=`| \`${r.id}\` | ${cell(r.displayVariants.join(' / '))} | ${cell(r.text)} |\n`;
  if(fs.existsSync(path.join(ROOT,'tools/audio/voice-checks.json'))){const checks=json('tools/audio/voice-checks.json');
    if(checks.round2){const r=checks.round2;out+='\n## Round 2 verification\n\n'+r.summary.join('\n\n')+'\n\n| Command | Actual result |\n|---|---|\n'+r.tests.map(t=>`| \`${cell(t.command)}\` | ${cell(t.result)} |`).join('\n')+'\n\nReviewed screenshots: '+r.screenshots.map(s=>'`'+s+'`').join(', ')+'.\n\nLimitations: '+r.limitations.join(' ')+'\n';}
    out+='\n## Round 1 verification record (historical)\n\nThe round 1 results and limitations below predate the manager review. Text-game voicing has since been dropped; MUD and the other excluded text games are not outstanding recording work. See the round 2 report for current verification.\n\n'+checks.summary.join('\n\n')+'\n\n| Command | Actual result |\n|---|---|\n'+checks.tests.map(t=>`| \`${cell(t.command)}\` | ${cell(t.result)} |`).join('\n')+'\n\nReviewed screenshots: '+checks.screenshots.map(s=>'`'+s+'`').join(', ')+'.\n\nLimitations: '+checks.limitations.join(' ')+'\n';}
  fs.writeFileSync(path.join(ROOT,'docs/VOICE-AUDIT.md'),out);
}
console.log(JSON.stringify({total:result.total,recorded:result.recorded,pending:result.pending,ready:result.ready,requests,unsafe:unsafe.length,uncast:result.uncast.length,unresolved:unresolved.length,speakers:result.speakers,chapters:result.chapters},null,2));

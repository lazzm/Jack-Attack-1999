// Run with node --expose-internals; no installed parser dependency.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),acorn=require('internal/deps/acorn/acorn/dist/acorn');
const dir=path.join(__dirname,'../app/public/js'),findings=[],games=[];
const keyboard=/\b(?:PRESS\s+(?:ENTER|SHIFT|SPACE)|(?:ARROWS|WASD)\s*(?::|-|MOVE|CHANGE)|[ZXCV]\s+(?:SELECT|BACK|JUMP|PUNCH|SPECIAL)|(?:SQUARE|CIRCLE|TRIANGLE)\s+(?:OR|WHILE)|KEYS:\s*[ZXCV]|SHIFT\s*=)/i;
for(const file of fs.readdirSync(dir).filter(f=>/^rm-g-.*\.js$/.test(f))){
 const source=fs.readFileSync(path.join(dir,file),'utf8');
 const ast=acorn.parse(source,{ecmaVersion:'latest',locations:true});
 function walk(node,parent){
  if(!node||typeof node!=='object')return;
  if(node.type==='Literal'&&typeof node.value==='string'||node.type==='TemplateElement'){
   const text=node.type==='TemplateElement'?node.value.cooked:node.value;
   // The runtime deliberately keeps definition.help as the keyboard-only line;
   // touch replaces that entire line with the controller instructions.
   const help=parent?.type==='Property'&&parent.key?.name==='help';
   if(!help&&keyboard.test(text))findings.push({file,line:node.loc.start.line,text});
  }
  if(node.type==='CallExpression'&&node.callee?.type==='MemberExpression'&&node.callee.property?.name==='game')games.push({file,id:node.arguments[0]?.value||'catalogue ID'});
  for(const [key,value]of Object.entries(node))if(key!=='loc'){
   if(Array.isArray(value))for(const child of value)walk(child,node);
   else if(value&&typeof value==='object')walk(value,node);
  }
 }
 walk(ast,null);
}
console.log(JSON.stringify({games,findings},null,2));
assert.deepEqual(findings,[],'Authored cartridge instructions still name keyboard keys without an input-aware helper');
console.log('PASS authored instruction audit: '+games.length+' cartridge registrations; zero hardcoded keyboard prompts');

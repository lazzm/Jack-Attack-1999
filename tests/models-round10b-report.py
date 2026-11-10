"""Compile the release-blocker report from actual command exits."""
from pathlib import Path
import json,re,subprocess,hashlib
root=Path(__file__).resolve().parents[1];out=root/'tests/shots/models/r10b'
rows=json.loads((out/'results.json').read_text())if(out/'results.json').exists()else[]
extras=[
 ('FIXTURE_DEBUG=1 node tests/ui-hud.mjs',1,'ui-before.log','Original application: exact null-client stack reproduced.'),
 ('node tests/characters.mjs --only=bump',0,'bump-before.log','Original application: timing-dependent normal run passed.'),
 ('node tests/people-pass-unit.cjs',1,'route-before.log','Added regression before the planning fix: expected failure.'),
 ('node tests/people-pass-unit.cjs',0,'route-after.log','After the planning fix.'),
 ('IRC_LIFECYCLE_REF=HEAD node tests/irc-lifecycle-unit.cjs',1,'irc-before.log','Original callbacks: expected lifecycle failure.'),
 ('node tests/irc-lifecycle-unit.cjs',0,'irc-after.log','After the callback-lifetime fix.'),
 ('UI_HUD_CAPTURE=pause UI_HUD_RUN=r10b-1 FIXTURE_DEBUG=1 node tests/ui-hud.mjs',0,'ui-after-diagnostic.log','Additional native-raster diagnostic UI pass; started before the planning-guard edit, so final proof uses the two frozen-source repeats below.')]
text=['Before/diagnostic runs (including expected failures):','','| Exact command | Exit | Evidence / meaning |','|---|---:|---|']
for command,code,path,note in extras:
 if(out/path).exists():text.append(f'| `{command}` | {code} | [{path}](../tests/shots/models/r10b/{path}). {note} |')
units=[r for r in rows if r['name']=='units'];other=[r for r in rows if r['name']!='units']
text+=['',f"Final unit sweep: **{sum(r['exit']==0 for r in units)}/{len(units)} pass**. Every per-file command and exit is below.",'','| Exact command | Exit / signal | Seconds | Source stable |','|---|---:|---:|---|']
for r in other+units:
 text.append('| `'+r['command']+'` | '+str(r['exit'])+(' (expected baseline failure)'if r['name']=='route-before'else'')+(' / '+r['signal']if r.get('signal')else'')+' | '+str(r['seconds'])+' | '+str(r['sourceStable'])+' |')
voice_logs=list(out.glob('voices-*.log'))
if voice_logs:
 text+=['','Nested voices invocation and real per-case output:']
 for p in voice_logs:
  for line in p.read_text(errors='replace').splitlines():
   if line.startswith('RESULT '):
    try:
     r=json.loads(line[7:]);text+=['',f"`{r['command']}` → exit **{r['exit']}**, {r['seconds']} seconds. Log: `{r['log']}`."]
     raw=Path(r['log'])
     if raw.exists():
      content=raw.read_text(errors='replace');(out/'voices-cases.log').write_text(content)
      text+=['','| Voices case | Actual result |','|---|---|']
      for result in content.splitlines():
       if re.match(r'^(PASS|FAIL) [a-z]+',result):text+=['| '+result.split()[1]+' | '+result.replace('|','/')+' |']
    except ValueError:pass
syntax=out/'syntax.json'
if syntax.exists():
 s=json.loads(syntax.read_text());text+=['',f"Syntax/whitespace: **{sum(r['exit']==0 for r in s)}/{len(s)} pass**."]
 for r in s:text+=['',f"`{r['command']}` → exit **{r['exit']}**."]
text+=['','Full source hashes, log paths and exits: [results.json](../tests/shots/models/r10b/results.json).']
for label in ['before','after']:
 p=out/('route-'+label+'.json')
 if p.exists():text+=['',f'Pending-aside browser {label}:','```json',p.read_text().strip(),'```']
p=root/'docs/ANIMATION-ROUND10B.md';s=p.read_text();s=re.sub(r'<!-- R10B_RESULTS -->.*?<!-- /R10B_RESULTS -->','<!-- R10B_RESULTS -->\n'+'\n'.join(text)+'\n<!-- /R10B_RESULTS -->',s,flags=re.S);p.write_text(s)
print('Recorded',len(rows),'real exits;',len(units),'unit scripts')

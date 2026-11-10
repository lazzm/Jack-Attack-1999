#!/usr/bin/env python3
"""Extend the source-qualified mouth pack; preserve all forty approved tracks.
Host-only Pocketsphinx/ffmpeg, original recordings untouched. Sub-word boundaries
are estimated within recorded word spans. Inspect the saved alignment review.
"""
import pathlib,json,re,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
source=(root/'tools/audio/author-mouth-cues.py').read_text()
# Reuse the established phonetic aligner, not a new runtime dependency.
__file__=str(root/'tools/audio/author-mouth-cues.py')
exec(compile(source[:source.index('report={};data={}')].replace('/tmp/r7-','/tmp/r10-'),__file__,'exec'))
original=json.loads((root/'app/public/audio/voice-phonemes.json').read_text())
old=json.loads(subprocess.check_output(['git','show','HEAD:app/public/audio/voice-phonemes.json'],cwd=root))
extra=['c2.pocket.dad'+n for n in ['', '2','3','4']]+[k for k in lines if k.startswith('chore.') and not k.startswith('chore.shout.')]+['house.voice.c27ds0','house.voice.6sjah6','house.moment.zpcfic','house.moment.1wxgtgo','house.moment.p8fwe0']
extra += ['talk.mom.morning.02','talk.mom.afternoon.06','talk.dad.morning.03','talk.dad.evening.05','talk.sister.afternoon.02','talk.sister.evening.06','talk.sister.context.console.u64']
extra += [k for k in lines if re.match(r'talk\.mom\.job\.(bed|bin|washup|shopping|hoover|videos|cushions|car)\.give\.0[12]$',k)]
ids=list(dict.fromkeys(k for k in extra if k in manifest and k not in old['lines']))
# British words and playful elongations absent from this host's US dictionary.
pron.update({'marvellous':['M','AA','R','V','AH','L','AH','S'],'pyjamas':['P','AH','JH','AA','M','AH','Z'],'duvet':['D','UW','V','EY'],'plump':['P','L','AH','M','P'],'settee':['S','EH','T','IY'],'lifesaver':['L','AY','F','S','EY','V','ER'],'neighbours':['N','EY','B','ER','Z'],'wheelie':['W','IY','L','IY'],'dustpan':['D','AH','S','T','P','AE','N']})
unknown={}
for id in ids:
 for w in re.findall(r"[a-z]+(?:'[a-z]+)?",lines[id][1].lower()):
  if w not in pron and w.endswith("'s") and w[:-2] in pron:pron[w]=pron[w[:-2]]+['S' if pron[w[:-2]][-1] in ['P','T','K','F','TH'] else 'Z']
  if w not in pron:unknown[w]=id
if unknown:raise ValueError(unknown)
# Keep rejects explicit; a missing or unaligned clip retains production fallback.
body=source[source.index('report={};data={}'):source.index('p.ps_free(decoder);')]
loop=body[body.index('for id in ids:')+len('for id in ids:\n'):]
loop=loop[:loop.index(" pathlib.Path('/tmp/r7-aligned.json')")]
report={};data={};rejects={}
for id in ids:
 try:exec(compile(__import__('textwrap').dedent(loop), '<round10-line>', 'exec'))
 except Exception as e:
  data.pop(id,None);report.pop(id,None);rejects[id]=str(e);print('REJECT',id,str(e),flush=True)
p.ps_free(decoder);p.ps_free(wordDecoder)
# Reuse the original source qualification, phrase spans and leading-audio guard.
finish=source[source.index('aligned=data;review=report'):source.index('assert len(aligned)==40')]
exec(compile(finish,'<round10-qualify>','exec'))
original['lines']={**old['lines'],**data}
original['selection']='Original forty priority tracks plus round 10 chores, cash, repeat-visit questions and common family questions. Authored priorities, not telemetry rankings.'
metadata={k:v for k,v in original.items() if k!='lines'}
content=json.dumps(metadata,indent=2)[:-2]+',\n  \"lines\": {\n'+',\n'.join('    '+json.dumps(k)+': '+json.dumps(v,separators=(',',':')) for k,v in original['lines'].items())+'\n  }\n}\n'
(root/'app/public/audio/voice-phonemes.json').write_text(content)
review={'lines':report,'rejected':rejects,'originalPreserved':all(original['lines'][k]==v for k,v in old['lines'].items())}
(root/'tests/shots/models/r10-phoneme-alignment.json').write_text(json.dumps(review,indent=2)+'\n')
print('ADDED',len(data),'TOTAL',len(original['lines']),'CONTACTS',sum(r['contacts'] for r in report.values()),'REJECTS',rejects,flush=True)

#!/usr/bin/env python3
"""Author 80 explicit line performances using the existing offline word aligner.

No clips or subtitle/selection data are changed. Requires the same host-only
Pocketsphinx/ffmpeg tools as author-mouth-cues.py; no runtime dependency.
"""
import pathlib,json,re,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
__file__=str(root/'tools/audio/author-mouth-cues.py')
source=(root/'tools/audio/author-mouth-cues.py').read_text();exec(compile(source[:source.index('report={};data={}')].replace('/tmp/r7-','/tmp/r8-beat-'),str(root/'tools/audio/author-mouth-cues.py'),'exec'))
# Explicit performance direction: anchor is the word/phrase that earns the beat.
# Not a keyword classifier; these are reviewed line-by-line.
spec={
'house.voice.19srweb':[('question','you'),('warm','ready')],
'house.voice.1pe2qdm':[('question','down'),('warm','love')],
'c1.wake.mom.call':[('phrase','get'),('firm','wasting')],
'c1.wake.mom.shout':[('firm','cold'),('firm','again')],
'c1.wake.mom.room':[('firm','looks'),('question',"don't")],
'c1.dad.mom':[('firm','wallpaper'),('joke','I')],
'c1.mom.give':[('phrase','first'),('phrase','basket'),('phrase','kitchen')],
'c1.mom.give2':[('warm','money'),('joke','disappointment')],
'c1.mom.leave':[('warm','need'),('firm','checking')],
'c1.tidy.done':[('warm','carpet'),('joke','green')],
'c1.bed.give':[('phrase','bed'),('firm','try')],
'c1.bed.done':[('question','Nearly'),('warm','improvement')],
'c1.bin.done':[('warm','Thank'),('joke','head')],
'c1.dad.hello':[('warm','are'),('warm','boot')],
'c1.dad.story':[('phrase','computers'),('joke','me')],
'c1.dad.offer':[('question','one'),('question','computer'),('joke','Mostly')],
'c1.dad.yes':[('warm','Ha'),('firm','listen')],
'c1.dad.boot':[('phrase','boot'),('warm','there')],
'c1.dad.brief':[('phrase','Tower'),('phrase','monitor'),('phrase','speakers'),('firm','stairs')],
'c1.lead.dad':[('phrase','leads'),('firm','force')],
'c1.power.dad':[('thought','truth'),('warm','crossed')],
'c1.install.done':[('warm','owner'),('warm','you')],
'c1.logon.dad':[('firm','off'),('question','Deal')],
'c1.sis.stairs':[('question','computer'),('question','mine'),('firm','fair')],
'c1.logon.sis':[('warm','Wow'),('question','in'),('question','Pleeeease'),('question','go')],
}
anchors={
'mom':{
'morning':['decision','sums','practice','disappearance',"doesn't",'style'],
'afternoon':['sound effects','dangerous','sadly','pen','exploring','about','trouble'],
'evening':['good bit','retired','sandwich','tea','sigh','reason']},
'dad':{
'morning':['qualified','ahead','alarm','first thing','free','sleep'],
'afternoon':['two-biscuit','argument','buttons','working','attention','filing','repairs'],
'evening':['adventure','supervision','useful hours','crossword','answers']},
'sister':{
'morning':['counts','yellow','more cereal','cross','business','agree'],
'afternoon':['biscuit shop','potato','win','crayons','coat back','breathing','Mostly'],
'evening':['Bigger','tonight','stretching','villain','difference']}}
for person,parts in anchors.items():
 for part,phrases in parts.items():
  for i,anchor in enumerate(phrases,1):
   id=f'talk.{person}.{part}.{i:02d}';text=lines[id][1];beats=[]
   if '?' in text:
    before=text.split('?')[0];ws=re.findall(r"[a-z]+(?:'[a-z]+)?",before.lower());beats.append(('question',ws[-1]))
   kind='warm' if (person,part,i) in [('mom','evening',1),('mom','evening',4),('mom','evening',6),('dad','evening',1),('sister','evening',2)] else 'joke'
   beats.append((kind,anchor));spec[id]=beats
assert len(spec)==80,len(spec)
pron.update({'tidied':['T','AY','D','IY','D'],'crayons':['K','R','EY','AA','N','Z'],'organised':['AO','R','G','AH','N','AY','Z','D'],'colour':['K','AH','L','ER'],'practising':['P','R','AE','K','T','AH','S','IH','NG'],'draughty':['D','R','AE','F','T','IY']})
cache=root/'tests/shots/models/r7-phoneme-alignment.json'
old=json.loads(cache.read_text()) if cache.exists() else {};out={};review={}
for id,beats in spec.items():
 text=lines[id][1];words=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower())
 if id in old:spans=old[id]['words'];duration=old[id]['dur']
 else:
  for w in words:
   if w not in pron and w.endswith("'s") and w[:-2] in pron:pron[w]=pron[w[:-2]]+['Z']
   if w not in pron:raise ValueError((id,w))
   p.ps_add_word(wordDecoder,w.encode(),' '.join(pron[w]).encode(),1)
  clip=root/'app/public/audio/voice'/manifest[id]['file'];pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(clip),'-ar','16000','-ac','1','-f','s16le','-'])
  duration=len(pcm)/32000
  spans=decode(wordDecoder,'#JSGF V1.0; grammar line; public <line> = '+' '.join(words)+';',pcm)
  spans=[(a,b,re.sub(r'\(\d+\)$','',w)) for a,b,w in spans if not w.startswith(('<','('))]
 assert [w for a,b,w in spans]==words,id
 directed=[]
 for kind,anchor in beats:
  aw=re.findall(r"[a-z]+(?:'[a-z]+)?",anchor.lower());matches=[i for i in range(len(words)) if words[i:i+len(aw)]==aw]
  if not matches:raise ValueError((id,anchor,text))
  # Last occurrence earns punchlines, avoiding an earlier repeated setup word.
  ix=matches[-1];a=spans[ix][0];b=spans[ix+len(aw)-1][1]
  # Question/phrase peaks on their final word; smiles begin on the actual joke.
  at=round(a+min(.12,(b-a)*.3),2);finish=round(b+.42 if kind in ('warm','joke') else b+.18,2)
  # Text-only fallback uses the same explicitly chosen word, in reading order.
  positions=list(re.finditer(r"[a-z]+(?:'[a-z]+)?",text.lower()));fraction=positions[ix].start()/len(text)
  directed.append([kind,at,finish,round(fraction,4),anchor])
 out[id]={'dur':round(duration,3),'file':manifest[id]['file'],'beats':sorted(directed,key=lambda x:x[1])}
 review[id]={'text':text,'words':spans,'beats':out[id]['beats']}
(root/'app/public/js/np-beats.js').write_text('/* Authored acting for 80 priority lines; source seconds exclude joined names.\n * Anchors are explicit direction, not humour inferred from keywords.\n * Timings use recorded word spans (10ms estimated alignment); text-only uses anchor fractions.\n * Curated opening/welcome/time-of-day set; no player frequency telemetry. */\n(function () {\n  \'use strict\';\n  window.NPCBeats = Object.freeze('+json.dumps(out,ensure_ascii=False,separators=(',',':'))+');\n})();\n')
(root/'tests/shots/models/r8-beat-alignment.json').write_text(json.dumps(review,indent=2))
print('AUTHORED',len(out),'lines',sum(len(x['beats']) for x in out.values()),'beats')

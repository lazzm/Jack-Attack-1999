#!/usr/bin/env python3
"""Author 133 explicit line performances using the existing offline word aligner.

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
# Round 9: the remaining 53 everyday lines, directed individually. A warm
# invitation earns a held smile; jokes peak on the payoff, never their setup.
extra={
'mom.morning.07':[('thought','list'),('joke','organised')],
'mom.morning.08':[('phrase','time'),('warm','as much as you')],
'mom.morning.09':[('question','birds'),('joke','than I am')],
'mom.morning.10':[('phrase','once'),('joke','heirloom')],
'mom.morning.11':[('warm','jam'),('phrase','jar')],
'mom.morning.12':[('warm','see you'),('joke','adopted you')],
'mom.afternoon.08':[('question','came in for'),('joke','showing off')],
'mom.afternoon.09':[('thought','already'),('joke','clock')],
'mom.afternoon.10':[('warm','whenever you like'),('warm','listen')],
'mom.afternoon.11':[('phrase','kept it'),('joke','long gone')],
'mom.afternoon.12':[('warm','lovely quiet minute'),('warm','allowed to speak')],
'mom.evening.07':[('thought','tonight'),('joke','dramatic episode')],
'mom.evening.08':[('question','today'),('joke','electricity bill')],
'mom.evening.09':[('phrase','sensible'),('joke','where')],
'mom.evening.10':[('warm','lovely'),('joke','glue')],
'mom.evening.11':[('warm','ask me'),('joke','cheese tower')],
'mom.evening.12':[('warm','everyone about'),('joke','remote')],
'dad.morning.07':[('thought','important job'),('joke','after breakfast')],
'dad.morning.08':[('warm','champion'),('warm','encouraging')],
'dad.morning.09':[('phrase','safe'),('joke','too safe')],
'dad.morning.10':[('question','knows'),('joke','hardest worker')],
'dad.morning.11':[('phrase','rush'),('joke','years of practice')],
'dad.morning.12':[('thought','screw'),('joke','very brave')],
'dad.afternoon.08':[('phrase','ten minutes'),('joke','holding'),('joke',"Don't tell Mom")],
'dad.afternoon.09':[('warm','always ask'),('joke','pencil first')],
'dad.afternoon.10':[('thought','faster'),('joke','investigate')],
'dad.afternoon.11':[('warm','excellent idea'),('joke','enough excellent shelves')],
'dad.afternoon.12':[('phrase','No news'),('joke','sticky tape')],
'dad.evening.06':[('warm','together'),('warm','anything special')],
'dad.evening.07':[('phrase','glasses'),('question',"aren't they")],
'dad.evening.08':[('thought','invents'),('joke','solve one')],
'dad.evening.09':[('warm','Evening'),('joke','before the clock')],
'dad.evening.10':[('thought','tunes'),('joke','unhelpful bit')],
'dad.evening.11':[('warm','bring it here'),('joke','electrical')],
'dad.evening.12':[('thought','tomorrow'),('joke','yesterday')],
'sister.morning.07':[('warm','animal'),('joke',"can't be wrong")],
'sister.morning.08':[('question','win'),('joke','washing my bowl')],
'sister.morning.09':[('phrase','ages ago'),('joke','legs yet')],
'sister.morning.10':[('question','later'),('warm','secret')],
'sister.morning.11':[('thought','middle'),('joke','brilliant')],
'sister.morning.12':[('thought','teddy'),('joke','tired he looks')],
'sister.afternoon.08':[('warm','paper boat'),('joke','decorations')],
'sister.afternoon.09':[('warm','join'),('joke','better name')],
'sister.afternoon.10':[('phrase','other hand'),('joke','spider went shopping')],
'sister.afternoon.11':[('question','you know'),('joke','homework')],
'sister.afternoon.12':[('warm','other best ones'),('joke','ages')],
'sister.evening.06':[('question','later'),('warm','funny voices')],
'sister.evening.07':[('thought','draughty'),('joke','I said it')],
'sister.evening.08':[('warm',"everyone's home"),('warm','everyone is')],
'sister.evening.09':[('thought','good things'),('warm','at least four')],
'sister.evening.10':[('question','extra afternoon'),('warm','inventing')],
'sister.evening.11':[('phrase','sensible place'),('joke','each')],
'sister.evening.12':[('warm','my story'),('thought','ending')],
}
assert len(extra)==53
spec.update({'talk.'+id:beats for id,beats in extra.items()})
assert len(spec)==133,len(spec)
pron.update({'reheated':['R','IY','HH','IY','T','IH','D'],'tidied':['T','AY','D','IY','D'],'crayons':['K','R','EY','AA','N','Z'],'organised':['AO','R','G','AH','N','AY','Z','D'],'colour':['K','AH','L','ER'],'practising':['P','R','AE','K','T','AH','S','IH','NG'],'draughty':['D','R','AE','F','T','IY']})
cache=root/'tests/shots/models/r7-phoneme-alignment.json'
old=json.loads(cache.read_text()) if cache.exists() else {};out={};review={}
# Retain already reviewed spans exactly; only the added lines need decoding.
prior=json.loads(subprocess.check_output(['node','-e',"global.window=global;require('./app/public/js/np-beats.js');console.log(JSON.stringify(NPCBeats))"],cwd=root))
prior_path=root/'tests/shots/models/r8-beat-alignment.json'
prior_review=json.loads(prior_path.read_text()) if prior_path.exists() else {}
for id,r in prior_review.items():
 if id in prior:old.setdefault(id,{'words':r['words'],'dur':prior[id]['dur']})
for id,beats in spec.items():
 text=lines[id][1];words=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower())
 if id not in manifest:
  # Three lines have no installed recording. Their explicit anchors still
  # direct sound-off/subtitle speech; do not invent an audio alignment.
  duration=max(2.3,min(7.6,(900+len(words)*340)/1000));weight=sum(max(2,len(w)) for w in words);cursor=0;spans=[]
  for w in words:
   end=cursor+max(2,len(w))/weight*duration;spans.append((cursor,end,w));cursor=end
 elif id in old:spans=old[id]['words'];duration=old[id]['dur']
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
 out[id]={'dur':round(duration,3),'file':manifest.get(id,{}).get('file'),'beats':sorted(directed,key=lambda x:x[1])}
 review[id]={'text':text,'source':'recorded word spans' if id in manifest else 'text-only; no installed recording','words':spans,'beats':out[id]['beats']}
(root/'app/public/js/np-beats.js').write_text('/* Authored acting for 133 lines; source seconds exclude joined names.\n * Anchors are explicit direction, not humour inferred from keywords.\n * Timings use recorded word spans (10ms estimated alignment); text-only uses anchor fractions.\n * Opening/welcome set and all 108 time-of-day lines; no player frequency telemetry. */\n(function () {\n  \'use strict\';\n  window.NPCBeats = Object.freeze('+json.dumps(out,ensure_ascii=False,separators=(',',':'))+');\n})();\n')
(root/'tests/shots/models/r9-beat-alignment.json').write_text(json.dumps(review,indent=2))
print('AUTHORED',len(out),'lines',sum(len(x['beats']) for x in out.values()),'beats')

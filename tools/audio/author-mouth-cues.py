#!/usr/bin/env python3
"""Rebuild the forty original mouth-cue directions from the recorded clips.

Offline authoring helper: uses the host's existing ffmpeg, libpocketsphinx and
English acoustic model. Adds no application dependencies and never writes clips.
Run from any directory. The intermediate alignment review is diagnostic only;
voiced lead-ins outside the matched words deliberately retain activity fallback.
Phonetic sub-word boundaries are estimates, constrained to actual word spans.
"""
import ctypes as C,json,subprocess,re,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
# Word pronunciations are used offline only; runtime receives timestamped painted-mouth classes.
dictfile=pathlib.Path('/usr/share/pocketsphinx/model/en-us/cmudict-en-us.dict')
pron={}
for l in dictfile.read_text().splitlines():
 q=l.split();pron.setdefault(re.sub(r'\(\d+\)$','',q[0]),q[1:])
pron.update({'peckish':['P','EH','K','IH','SH'],'telly':['T','EH','L','IY'],'duvet':['D','UW','V','EY'],'pleeeease':['P','L','IY','Z'],"tea's":['T','IY','Z']})
lines=json.loads(subprocess.check_output(['node','-e',"global.window=global; require('./app/public/js/np-lines.js'); console.log(JSON.stringify(NPCLines))"],cwd=root))
manifest=json.loads((root/'app/public/audio/voice/manifest.json').read_text())
ids=['house.voice.19srweb','house.voice.1pe2qdm']+['c1.'+x for x in ['wake.mom.call','wake.mom.shout','wake.mom.room','dad.mom','mom.give','mom.give2','mom.leave','tidy.done','bed.give','bed.done','bin.done','dad.hello','dad.story','dad.offer','dad.yes','dad.boot','dad.brief','lead.dad','power.dad','install.done','logon.dad','sis.stairs','logon.sis']]+['talk.'+person+'.'+s for person in ['mom','dad','sister'] for s in ['morning.01','afternoon.01','evening.01','evening.02','afternoon.03']]
assert len(ids)==40
# Single-phone words let the installed acoustic model constrain each directed
# mouth sequence within the already aligned word boundaries. No model or
# pronunciation dictionary is shipped to the browser.
phones=sorted(set(p for v in pron.values() for p in v)|{'SIL'})
pathlib.Path('/tmp/r7-word.dict').write_text(dictfile.read_text()+'\n'+ '\n'.join(w+' '+' '.join(pron[w]) for w in ['pleeeease','duvet','peckish','telly',"tea's"])+ '\nsil SIL\n')
pathlib.Path('/tmp/r7-phone.dict').write_text('\n'.join(p.lower()+' '+p for p in phones)+'\n')
p=C.CDLL('libpocketsphinx.so.3');s=C.CDLL('libsphinxbase.so.3')
def sig(lib,name,rest,args):
 f=getattr(lib,name);f.restype=rest;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;char=C.c_char_p
sig(p,'ps_args',ptr,[]);sig(s,'cmd_ln_parse_r',ptr,[ptr,ptr,I,C.POINTER(char),I]);sig(p,'ps_init',ptr,[ptr]);sig(p,'ps_set_jsgf_string',I,[ptr,char,char]);sig(p,'ps_set_search',I,[ptr,char]);sig(p,'ps_start_utt',I,[ptr]);sig(p,'ps_process_raw',I,[ptr,ptr,C.c_size_t,I,I]);sig(p,'ps_end_utt',I,[ptr]);sig(p,'ps_seg_iter',ptr,[ptr,ptr]);sig(p,'ps_seg_word',char,[ptr]);sig(p,'ps_seg_frames',None,[ptr,C.POINTER(I),C.POINTER(I)]);sig(p,'ps_seg_next',ptr,[ptr]);sig(p,'ps_free',I,[ptr])
a=['align','-hmm','/usr/share/pocketsphinx/model/en-us/en-us','-dict','/tmp/r7-phone.dict','-samprate','16000','-remove_silence','no','-remove_noise','no','-fsgusefiller','no','-fsgusealtpron','no','-beam','1e-100','-wbeam','1e-80','-logfn','/tmp/r7-sphinx.log']
a=(char*len(a))(*[x.encode() for x in a]);decoder=p.ps_init(s.cmd_ln_parse_r(None,p.ps_args(),len(a),a,1));assert decoder
a2=['align','-hmm','/usr/share/pocketsphinx/model/en-us/en-us','-dict','/tmp/r7-word.dict','-samprate','16000','-remove_silence','no','-remove_noise','no','-fsgusefiller','yes','-fsgusealtpron','yes','-beam','1e-100','-wbeam','1e-80','-logfn','/tmp/r7-sphinx-word.log']
a2=(char*len(a2))(*[x.encode() for x in a2]);wordDecoder=p.ps_init(s.cmd_ln_parse_r(None,p.ps_args(),len(a2),a2,1));assert wordDecoder
sig(p,'ps_add_word',I,[ptr,char,char,I])
def decode(dec,grammar,pcm):
 assert p.ps_set_jsgf_string(dec,b'line',grammar.encode())==0
 assert p.ps_set_search(dec,b'line')==0
 buf=C.create_string_buffer(pcm);assert p.ps_start_utt(dec)==0;p.ps_process_raw(dec,buf,len(pcm)//2,0,1);p.ps_end_utt(dec)
 seg=p.ps_seg_iter(dec,None);result=[]
 while seg:
  word=p.ps_seg_word(seg).decode();a,b=I(),I();p.ps_seg_frames(seg,C.byref(a),C.byref(b));result.append([a.value/100,(b.value+1)/100,word]);seg=p.ps_seg_next(seg)
 return result
report={};data={}
for id in ids:
 text=lines[id][1];wordphones=[];words=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower());seq=[]
 for w in words:
  if w not in pron and w.endswith("'s") and w[:-2] in pron:pron[w]=pron[w[:-2]]+['S' if pron[w[:-2]][-1] in ['P','T','K','F','TH'] else 'Z']
  if w not in pron:raise ValueError((id,w))
  seq+=pron[w];wordphones.append(pron[w])
 clip=root/'app/public/audio/voice'/manifest[id]['file']
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(clip),'-ar','16000','-ac','1','-f','s16le','-'])
 for w in words:p.ps_add_word(wordDecoder,w.encode(),' '.join(pron[w]).encode(),1)
 grammar='#JSGF V1.0; grammar line; public <line> = '+' '.join(words)+';'
 wordspans=decode(wordDecoder,grammar,pcm)
 wordspans=[(a,b,re.sub(r'\(\d+\)$','',w)) for a,b,w in wordspans if not w.startswith(('<','('))]
 assert [w for a,b,w in wordspans]==words,(id,wordspans)
 clean=[];previous=0
 for a,b,w in wordspans:
  if a>previous:clean.append([previous,a,'SIL'])
  grammar='#JSGF V1.0; grammar line; public <line> = '+' '.join(x.lower() for x in pron[w])+';'
  pad=.09;part=b'\0'*round(pad*32000)+pcm[round(a*16000)*2:round(b*16000)*2]+b'\0'*round(pad*32000)
  aligned=decode(decoder,grammar,part)
  aligned=[(x,y,ph.upper()) for x,y,ph in aligned if not ph.startswith(('<','(')) and ph.upper()!='SIL']
  assert [ph for x,y,ph in aligned]==pron[w],(id,w,a,b,aligned)
  first,last=aligned[0][0],aligned[-1][1]
  clean.extend([round(a+(x-first)/(last-first)*(b-a),2),round(a+(y-first)/(last-first)*(b-a),2),ph] for x,y,ph in aligned)
  previous=b
 if previous<len(pcm)/32000:clean.append([previous,round(len(pcm)/32000,2),'SIL'])
 # Original painted atlas classes: rest, small, A, OU, EI, FV, MBP.
 def shape(ph):
  if ph in ['M','B','P']:return 6
  if ph in ['F','V']:return 5
  if ph in ['AA','AE','AH','AY','AW']:return 2
  if ph in ['OW','UW','UH','W','OY','AO']:return 3
  if ph in ['IY','IH','EY','EH','Y']:return 4
  if ph=='SIL':return 0
  return 1
 marks=[]
 for a,b,ph in clean:
  sh=shape(ph)
  if not marks or marks[-1][1]!=sh:marks.append([round(a,2),sh])
 # Explicit clip tail rest; audio envelope still closes real pauses.
 marks.append([round(clean[-1][1],2),0]);duration=len(pcm)/32000
 data[id]={'file':manifest[id]['file'],'dur':round(duration,3),'cues':marks}
 report[id]={'text':text,'phones':' '.join(seq),'words':wordspans,'alignment':clean,'dur':duration,'contacts':sum(x[2] in ['M','B','P','F','V'] for x in clean)}
 print(id,len(seq),'phones',len(marks),'cues',duration,flush=True)
 pathlib.Path('/tmp/r7-aligned.json').write_text(json.dumps(data,indent=2)+'\n');pathlib.Path('/tmp/r7-alignment-review.json').write_text(json.dumps(report,indent=2)+'\n')
p.ps_free(decoder);p.ps_free(wordDecoder)

# Build the small, source-qualified runtime pack.
aligned=data;review=report
for id,t in aligned.items():
 r=review[id];text=r['text'];matches=list(re.finditer(r"[a-z]+(?:'[a-z]+)?",text.lower()));phrases=[]
 for i,m in enumerate(matches):
  after=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]
  if re.search(r'[.!?;]',after):phrases.append(r['words'][i][1])
 t['phrases']=phrases
 joke=re.search(r'\b(funny|joke|haha|secret)\b|ha ha|only joking|just kidding|bet you|think.*retired|working out how I win',text,re.I)
 if joke:
  i=next((i for i,m in enumerate(matches) if m.end()>=joke.end()),len(matches)-1);t['beats']={'joke':r['words'][i][1]}
 path=root/'app/public/audio/voice'/t['file'];t['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
 first=r['words'][0][0]
 if first>.3:
  a=__import__('array').array('f');a.frombytes(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar','16000','-ac','1','-f','f32le','-']));lead=a[:round(first*16000)]
  if sum(abs(x)>.02 for x in lead)>1600*.15:
   for cue in t['cues']:
    if cue[0]>=first:break
    cue[1]=-1
   r['unmatchedLeadIn']=first
 # Collapse coincident HMM frame boundaries, keeping the arriving phoneme.
 cues=[]
 for cue in t['cues']:
  if cue[0]>t['dur']:continue
  if cues and cue[0]==cues[-1][0]:cues[-1]=cue
  else:cues.append(cue)
 t['cues']=cues
 if cues[-1][1]!=0:cues.append([t['dur'],0])
assert len(aligned)==40
meta={'version':1,'timing':'Seconds in base clip, excluding a joined first-name callout. Painted classes: -1 activity fallback, 0 rest, 1 small, 2 A, 3 OU, 4 EI, 5 FV, 6 MBP. Directed phonetic sequences constrained to recorded word spans; source boundaries at 10ms. Unmatched voiced lead-ins retain activity fallback.','selection':'2 repeat-visit welcomes, 23 recorded Chapter 1 instructions, 15 common time-of-day talk lines (five per family member). No production frequency telemetry was available.'}
content=json.dumps(meta,indent=2)[:-2]+',\n  "lines": {\n'+',\n'.join('    '+json.dumps(k)+': '+json.dumps(v,separators=(',',':')) for k,v in aligned.items())+'\n  }\n}\n'
(root/'app/public/audio/voice-phonemes.json').write_text(content)
(root/'tests/shots/models/r7-phoneme-alignment.json').write_text(json.dumps(review,indent=2)+'\n')
print('40 lines',sum(len(x['cues']) for x in aligned.values()),'cues;',sum(x['contacts'] for x in review.values()),'MBP/FV contacts; unmatched lead-ins',[(id,r['unmatchedLeadIn']) for id,r in review.items() if 'unmatchedLeadIn' in r])

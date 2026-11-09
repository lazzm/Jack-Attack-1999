#!/usr/bin/env python3
"""Align the joined first-name recordings to the existing painted mouth classes.

Offline only: reuses the host tools from author-mouth-cues.py, changes no clips,
and retains estimated phonetic boundaries in a small source-qualified pack.
"""
import pathlib,json,subprocess,re,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
helper=root/'tools/audio/author-mouth-cues.py';source=helper.read_text()
__file__=str(helper)
exec(compile(source[:source.index('report={};data={}')].replace('/tmp/r7-','/tmp/r8-name-'),str(helper),'exec'))
pron.update({
 'anjali':['AA','N','JH','AH','L','IY'],'bethan':['B','EH','TH','AH','N'],
 'bilal':['B','IH','L','AA','L'],'conor':['K','AA','N','ER'],'declan':['D','EH','K','L','AH','N'],
 'imran':['IH','M','R','AA','N'],'kirsty':['K','ER','S','T','IY'],'kwame':['K','W','AA','M','EY'],
 'maryam':['M','AE','R','IY','AH','M'],'pooja':['P','UW','JH','AH'],'priya':['P','R','IY','AH'],
 'rhiannon':['R','IY','AE','N','AH','N'],'usman':['UH','S','M','AA','N'],'vikram':['V','IH','K','R','AH','M'],
 'zainab':['Z','EY','N','AH','B']})
names=json.loads((root/'app/public/audio/voice/names/manifest.json').read_text());result={};review={}
def shape(ph):
 if ph in ['M','B','P']:return 6
 if ph in ['F','V']:return 5
 if ph in ['AA','AE','AH','AY','AW']:return 2
 if ph in ['OW','UW','UH','W','OY','AO']:return 3
 if ph in ['IY','IH','EY','EH','Y']:return 4
 if ph=='SIL':return 0
 return 1
for speaker,pool in names.items():
 for name,meta in pool.items():
  seq=pron[name]+(pron['love'] if speaker=='mom-call' else [])
  clip=root/'app/public/audio/voice/names'/meta['file']
  pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(clip),'-ar','16000','-ac','1','-f','s16le','-'])
  grammar='#JSGF V1.0; grammar line; public <line> = '+' '.join(ph.lower() for ph in seq)+';'
  aligned=decode(decoder,grammar,pcm)
  clean=[(a,b,ph.upper()) for a,b,ph in aligned if not ph.startswith(('<','(')) and ph.upper()!='SIL']
  assert [ph for a,b,ph in clean]==seq,(speaker,name,clean)
  duration=len(pcm)/32000;marks=[[0,0]]
  for a,b,ph in clean:
   if marks[-1][1]!=shape(ph):marks.append([round(a,2),shape(ph)])
  marks.append([round(clean[-1][1],2),0]);marks.append([round(duration,3),0])
  id=speaker+'/'+name;result[id]={'file':meta['file'],'dur':round(duration,3),'sha256':hashlib.sha256(clip.read_bytes()).hexdigest(),'cues':marks}
  review[id]={'phones':seq,'alignment':clean,'dur':duration};print(id,flush=True)
p.ps_free(decoder);p.ps_free(wordDecoder)
pack={'version':1,'timing':'Seconds from the start of the decoded name prefix. Directed phones aligned to each original recording; boundaries estimated at 10ms. Mom-call includes the recorded love. Source file/duration qualified; never applied across the 100ms join gap.','names':result}
(root/'app/public/audio/voice-name-phonemes.json').write_text(json.dumps(pack,separators=(',',':'))+'\n')
(root/'tests/shots/models/r8-name-alignment.json').write_text(json.dumps(review,indent=2)+'\n')
print('PASS',len(result),'name clips')

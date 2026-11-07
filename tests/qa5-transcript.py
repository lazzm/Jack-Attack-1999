"""Summarise the captured observations; this never opens a browser or changes game data."""
import json, collections, datetime
from pathlib import Path
root=Path(__file__).resolve().parent/'shots'/'qa5'
events=json.loads((root/'report.json').read_text())['events']
lines=['# QA5 delivered dialogue, in order','','The raw capture is report.json. These are delivered subtitles, not a source catalogue. Automatic speech can coincide with F; the attempt table records the target and the active/queued speech 700 ms after each real F press. A blank target response means none was active or queued at that observation point. Name prefixes are kept exactly.','']
summary={}
for tag,lo,hi in [('10am','qa5-dialogue.js','MORNING-MATRIX-COMPLETE'),('14_3','time-change-14_3','AFTERNOON-MATRIX-COMPLETE'),('19pm','time-change-19','EVENING-MATRIX-COMPLETE')]:
    start=next((i for i,e in enumerate(events) if (e['label']=='command' and lo in str(e['data'])) or e['label']==lo),None)
    stop=next((i for i,e in enumerate(events) if e['label']==hi),len(events))
    subset=events[start:stop] if start is not None else []
    spoken=[e for e in subset if e['label']=='speech']
    attempts=[e['data'] for e in subset if e['label']=='talk-attempt' and e['data']['tag']==tag]
    by={}
    lines += ['## '+tag,'','| # | UTC | speaker | line ID | exact delivered text |','|---|---|---|---|---|']
    for n,e in enumerate(spoken,1):
        a=e['data']['args'];lines.append('| '+str(n)+' | '+e['time'][11:23]+' | '+str(a[1])+' | '+str(a[0])+' | '+str(a[2]).replace('|','\\|').replace('\n','<br>')+' |')
        by.setdefault(a[1],collections.Counter())[a[0]]+=1
    lines += ['','| requested person | F press | actual crosshair target | target speaker active/queued at +700ms |','|---|---|---|---|']
    for a in attempts:
        s=a['speech'];responses=([s['cur']] if s['cur'] and s['cur']['id']==a['id'] else [])+[q for q in s['q'] if q['id']==a['id']]
        lines.append('| '+a['id']+' | '+str(a['n'])+' | '+str(a.get('pick',{}).get('spot'))+' | '+('; '.join(q['line'] for q in responses) or 'NONE')+' |')
    stats={who:{'utterances':sum(c.values()),'uniqueIDs':len(c),'repeatUtterances':sum(c.values())-len(c),'counts':dict(c)} for who,c in by.items()}
    silent={who:sum(not (a['speech']['cur'] and a['speech']['cur']['id']==who) and not any(q['id']==who for q in a['speech']['q']) for a in attempts if a['id']==who) for who in ['mom','dad','sister']}
    summary[tag]={'presses':len(attempts),'validTargets':sum(a.get('pick',{}).get('spot')=='np.'+a['id'] for a in attempts),'noTargetResponseAt700ms':silent,'delivered':stats}
    lines += ['','Delivered counts (including automatic speech during this period): `'+json.dumps(stats,ensure_ascii=False)+'`','']
start=next((i for i,e in enumerate(events) if e['label']=='ambient-start'),None)
stop=next((i for i,e in enumerate(events) if e['label']=='ambient-complete'),len(events))
ambient=events[start:stop] if start is not None else []
lines += ['## Twenty-minute ambient walk','','| # | UTC | speaker | line ID | exact delivered text |','|---|---|---|---|---|']
counts=collections.Counter()
prior={}
for e in events[:start if start is not None else 0]:
    if e['label']=='speech': prior[e['data']['args'][0]]=e['time']
gaps=[]
for n,e in enumerate([e for e in ambient if e['label']=='speech'],1):
    a=e['data']['args'];counts[a[0]]+=1
    if a[0] in prior:
        gap=(datetime.datetime.fromisoformat(e['time'].replace('Z','+00:00'))-datetime.datetime.fromisoformat(prior[a[0]].replace('Z','+00:00'))).total_seconds()
        gaps.append({'id':a[0],'utc':e['time'],'previousUTC':prior[a[0]],'gapSeconds':gap,'text':a[2]})
    prior[a[0]]=e['time']
    lines.append('| '+str(n)+' | '+e['time'][11:23]+' | '+str(a[1])+' | '+str(a[0])+' | '+str(a[2]).replace('|','\\|').replace('\n','<br>')+' |')
summary['ambient']={'delivered':sum(counts.values()),'uniqueIDs':len(counts),'repeatUtterances':sum(counts.values())-len(counts),'counts':dict(counts),'complete':any(e['label']=='ambient-complete' for e in events),'previouslyHeardUtterances':len(gaps),'repeatsWithGaps':gaps}
(root/'dialogue-transcript.md').write_text('\n'.join(lines)+'\n')
(root/'dialogue-counts.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(summary,indent=2,ensure_ascii=False))

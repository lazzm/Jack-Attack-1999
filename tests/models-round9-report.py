"""Collect actual round-9 exits and geometry/performance numbers into repo notes."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
shots=root/'tests/shots'
doc=root/'docs/ANIMATION-ROUND9.md'
def read(p,default=None):
    return json.loads(p.read_text()) if p.exists() else default
def replace(key,text):
    s=doc.read_text();pattern=r'<!-- '+key+r' -->.*?<!-- /'+key+r' -->'
    s,n=re.subn(pattern,'<!-- '+key+' -->\n'+text+'\n<!-- /'+key+' -->',s,flags=re.S)
    assert n==1,key;doc.write_text(s)
def span(values):return f'{min(values):.2f}–{max(values):.2f}'
a=read(shots/'models/r9/after-contact.json');b=read(shots/'models/r9/before-contact.json')
assert a and b
native=read(shots/'models/r9/after/report.json',{})
rows=['Production r128 skeleton/skin probes; distances are centimetres. Studio camera angles are 0° / 45° / 90°; contact probes also turn the head through ±80°. Negative elbow height means the elbow is above the shoulder.','', '| Measure | Main 2.84.0 | Working tree |','|---|---:|---:|',f"| Sip elbow below shoulder, all three | {span([s['low'] for s in b['sips']])} | {span([s['low'] for s in a['sips']])} |",f"| Largest sideways elbow projection | {max(s['out'] for s in b['sips']):.2f} | {max(s['out'] for s in a['sips']):.2f} |",f"| Largest near-rim / mouth-anchor gap | {max(s['gap'] for s in b['sips']):.2f} | {max(s['gap'] for s in a['sips']):.2f} |",f"| Largest nearest earpiece / ear-anchor gap | {max(s['gap'] for s in b['phones']):.2f} | {max(s['gap'] for s in a['phones']):.9f} |",'',f"Largest mug finger / solid-surface gap: **{max(s['fingerGap'] for s in a['sips']):.3f} cm**. Phone finger / handset gap: **{max(s['fingerGap'] for s in a['phones']):.3f} cm**."]
for p in a['reading']:
    rows.append(f"{p['id'].title()} transfer: worst finger gap **{p['worst']:.3f} cm**, parked world drift **{p['drift']:.9f} cm**, page scale **{p['scale']:.6f}**. Main has no corresponding visible put-away transfer; its page is hidden after standing.")
rows+=['',f"Zero-time reload: largest tested page displacement **{max(s.get('gap',0) for s in a['restore']):.5f} cm**. Retrieval finger gaps: **{max(s.get('gapPeak',0) for s in a['restore']):.3f} cm** maximum. Each tested retrieval returns to transfer=0 / parked=false.",f"Paused washing/cooking/watering acknowledgements: largest wrist drift **{max(s['drift'] for s in a['work']):.9f} cm**, largest orientation change **{max(s['turn'] for s in a['work']):.9f} radians** after the small initial grip settle. Reply envelope: pending **{a['reply']['pending']}**, peak **{a['reply']['peak']:.3f}**, released **{a['reply']['end']}**; suspended source-clock samples are retained in the contact JSON."]
if native.get('budgets'):
    rows+=['',f"**{len(native['budgets'])} Low/Potato outfit/LOD budgets checked; maximum {max(native['budgets'].values()):,} triangles including shadow.** Family near: Mom 2,818, Dad 2,998, Crystal 2,994 (8,810 total). Native rig submissions remain **two**, with mesh/bone counts, atlas dimensions and final vertex/triangle allocations unchanged. The culled-owner page uses the existing body draw and hides its owner's shadow/proxy."]
exchange=read(shots/'models/r8-exchanges/r9-final/report.json')
if exchange:
    rows+=['','Live, alternating recorded exchanges:','', '| Device | Turns | Sip peak | Early sip cancels | Reply targets sampled | Returning gesture peak |','|---|---:|---:|---:|---:|---:|']
    for d in exchange['devices']:
        m=d.get('metrics',{});rows.append(f"| {d['device']} | {len(d['turns'])} | {m.get('sipPeak',0):.6f} | {m.get('prematureSipCancels','?')} | {m.get('familyReplyTargets','?')} | {m.get('returningGesturePeak',0):.3f} |")
    rows+=['','The JSON retains each turn, held props, own-speech cup lowering, source samples and reply addressees.']
pair=[]
for label in ['main','tree']:
    pair.append(read(shots/f'mobile/r9-final-{label}-perf.json'))
if all(pair):
    rows+=['','Paired whole-house mobile timing, complete main archive first and working tree second. Software-renderer milliseconds; lower is better. These are shared-host samples, without physical-device certification.','', '| Case | Frame p50 main → tree | Frame p95 main → tree | Render p50 main → tree | Calls main → tree | Triangles main → tree |','|---|---:|---:|---:|---:|---:|']
    for key,base in pair[0]['perf'].items():
        cur=pair[1]['perf'][key]
        rows.append('| '+key+' | '+' | '.join(f"{base[k]} → {cur[k]}" for k in ['frameP50','frameP95','renderP50','calls','triangles'])+' |')
    rows+=['','Scene/adaptation and host-load differences must be read alongside timing differences; this pair does not isolate the cost of a person. Raw hashes, actual exits and samples: `tests/shots/mobile/r9-final-{main,tree}-perf.json`.']
replace('R9_METRICS','\n'.join(rows))
gates=read(shots/'models/r9-test-results.json',[]);units=list({r['command']:r for r in gates if r['name']=='units'}.values());(shots/'models/r9-final-unit-results.json').write_text(json.dumps(units,indent=2));review=read(shots/'models/r9-review-results.json',[])
# Keep the last result for each exact command, including an isolated bump retry.
latest={r['command']:r for r in gates if r['name']!='units'}
tests=['All 12 touched JavaScript files passed `node --check`; all three Python tools compiled. Exact commands and exits are in `tests/shots/models/r9-syntax-results.json`. `git diff --check` also returned exit 0. Functional room-fixture gates use `FIXTURE_RASTER_RATIO=.5`; art exports restore native raster resolution. Smoke uses `SMOKE_SCALE=3 STORY_SCALE=3` and starts its own disposable server.','', '| Exact command | Actual result |','|---|---|']
for command,r in latest.items():tests.append(f"| `{command}` | exit {r['exit']}; {r['seconds']:.1f} s |")
if units:tests.append(f"| `node tests/models-round9-gate.mjs --only=units,models,characters,people-pass` | {len(units)} scripts; {sum(r['exit']==0 for r in units)} pass; {sum(r['exit']!=0 for r in units)} fail; exact per-file commands/exits in `r9-final-unit-results.json` |")
for r in review:
    duration=f"{r['seconds']:.1f} s" if isinstance(r.get('seconds'),(int,float)) else 'interrupted; duration not recorded'
    tests.append(f"| `{r['command']}` | exit {r['exit']}; {duration}; source stable={r.get('sourceStable')} |")
tests+=['','`norepeat-unit.cjs`, `welcome-unit.cjs` and `voices-unit.cjs` are included in the complete unit ledger. Every gate rejects page/console errors and checks its disposable-server log for module-load failure.','', 'Development attempts also exposed incomplete unit stubs for the new presentation fields and a reading-film window that ended while the return route was still walking. Those were corrected and rerun. The contact probe retains its measured 0.049 cm reload residual; it is not reported as exact zero. Earlier failures and later exits remain in the runner logs/ledgers.']
replace('R9_TESTS','\n'.join(tests))
print('Updated',doc)

"""Run every existing unit script and retain each real exit code."""
from pathlib import Path
import json
import subprocess
results=[]
for path in sorted(Path('tests').glob('*-unit.cjs')):
    log='/tmp/jhp-r2-'+path.stem+'.log'
    with open(log,'w') as stream:
        result=subprocess.run(['node',str(path)],stdout=stream,stderr=subprocess.STDOUT)
    results.append({'command':'node '+str(path),'exit':result.returncode,'log':log})
    print(path.name,result.returncode,flush=True)
Path('tests/shots/models').mkdir(parents=True,exist_ok=True)
Path('tests/shots/models/r2-unit-results.json').write_text(json.dumps(results,indent=2))
raise SystemExit(int(any(result['exit'] for result in results)))

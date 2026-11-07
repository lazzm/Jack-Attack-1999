"""Run every existing unit script and retain each real exit code."""
from pathlib import Path
import json
import os
import subprocess
import re
round=os.environ.get('MODELS_ROUND','r3')
assert re.fullmatch(r'r[0-9]+[a-z]?',round)
root=Path(__file__).resolve().parent.parent
# Older unit artifact names use numbered rounds; the ledger retains the pass suffix.
unit_env={**os.environ, 'MODELS_ROUND':re.match(r'r[0-9]+',round)[0]}
results=[]
for path in sorted((root/'tests').glob('*-unit.cjs')):
    log='/tmp/jhp-'+round+'-'+path.stem+'.log'
    with open(log,'w') as stream:
        result=subprocess.run(['node',str(path)],stdout=stream,stderr=subprocess.STDOUT,cwd=root,env=unit_env)
    results.append({'command':'node '+str(path),'exit':result.returncode,'log':log})
    print(path.name,result.returncode,flush=True)
(root/'tests/shots/models').mkdir(parents=True,exist_ok=True)
(root/('tests/shots/models/'+round+'-unit-results.json')).write_text(json.dumps(results,indent=2))
raise SystemExit(int(any(result['exit'] for result in results)))

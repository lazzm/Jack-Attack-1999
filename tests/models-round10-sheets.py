"""Matched native frame strips: labels/crops only, no pixel resampling."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path(__file__).resolve().parent
out=root/'shots/models/r10';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
ledger=[]
def strip(name,files,source,crop):
 frames=[[Image.open(source/label/f).convert('RGB').crop(crop)for f in files]for label in ['before','after']]
 w,h=frames[0][0].size;img=Image.new('RGB',(w*len(files),2*(h+26)),'#e5dfd3');d=ImageDraw.Draw(img)
 for row,label in enumerate(['Main 2.87.0','Working tree']):
  for col,p in enumerate(frames[row]):
   x,y=col*w,row*(h+26);img.paste(p,(x,y+26));d.text((x+7,y+5),label+' | '+str(col+1),font=font,fill='#302d28')
 img.save(out/(name+'.png'));ledger.append({'name':name+'.png','source':str(source.relative_to(root)),'files':files,'crop':crop,'resampled':False})
house=root/'shots/models/r10-final-house'
for action in ['washup','cook','water','paper']:
 for angle in ([110,-110]if action in ['washup','cook']else[35,75]):
  strip('compare-'+action+'-'+str(angle),[f'{action}-{angle}-{i}.png'for i in (range(7)if angle in [110,35]else[0,3,6])],house,(333,80,1033,780))
paper=root/'shots/models/r10-paper'
for angle in [0,45,90]:
 strip('paper-turn-'+str(angle),[f'turn-{angle}-{i}.png'for i in range(7)],paper,(120,170,600,650))
 strip('paper-transfer-'+str(angle),[f'reading-dad-{angle}-{i}.png'for i in range(9)],paper,(120,170,600,650))
for view in ['wide','close']:
 strip('drawing-'+view,[f'{view}-{i}.png'for i in range(8)],root/'shots/models/r10-drawing',(310,120,1060,800))
(out/'strips.json').write_text(json.dumps(ledger,indent=2)+'\n')
print('Wrote',len(ledger),'matched strips; no screenshot pixels resampled')

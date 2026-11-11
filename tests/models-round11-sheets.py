"""Native before/after strips: crop and label, never resample screenshot pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parent
source=root/'shots/models/r11-final-house';out=root/'shots/models/r11';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
ledger=[]
for action,angles in [('cook',[110,-110]),('washup',[110,-110]),('water',[35,75]),('wipe',[110,-110]),('carwash',[118,-118])]:
 for angle in angles:
  files=[f'{action}-{angle}-{i}.png'for i in [0,3,6]]
  crop=(300,40,1050,810);w,h=750,770
  image=Image.new('RGB',(w*3,(h+27)*2),'#e7dfd1');d=ImageDraw.Draw(image)
  for row,label in enumerate(['before','after']):
   for col,f in enumerate(files):
    frame=Image.open(source/label/f).convert('RGB');assert frame.size==(1366,860)
    image.paste(frame.crop(crop),(col*w,row*(h+27)+27));d.text((col*w+7,row*(h+27)+6),('Main 2.89.0'if label=='before'else'Round 11')+' | '+action+' | frame '+str(col+1),font=font,fill='#302d28')
  name=f'compare-{action}-{angle}.png';image.save(out/name)
  ledger.append({'name':name,'source':str(source.relative_to(root)),'files':files,'crop':crop,'resampled':False})
(out/'strips.json').write_text(json.dumps(ledger,indent=2)+'\n')
print('Wrote',len(ledger),'native matched strips; no resampling')

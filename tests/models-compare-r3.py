"""Matched, unchanged screenshot crops: HEAD above the corresponding after batch."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, sys
round=sys.argv[1] if len(sys.argv)>1 else 'r3'
assert round in ['r3','r4']
root=Path(__file__).resolve().parent/'shots'/'models'
def read(label):
    path=root/label/'house'
    return {f['name']:(path/f['name'],f) for f in json.loads((path/'report.json').read_text())['frames']}
before=read(round+'-before');after=read(round+'-after')
if round=='r4':
 for label in ['r4-neck-final','r4-stair-final']:
  if (root/label/'house/report.json').exists():after.update(read(label))
out=root/(round+'-comparisons');out.mkdir(exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
states=['walk','stairs-up','stairs-down','door','job','sit','stand','talk','carry','stop','turn','idle']
if round=='r4':states=['walk','sit','stand','job','talk','stairs-turn-up','stairs-turn-down']
count=0
for device in ['desktop','phone','landscape','tablet']:
 for person in ['mom','dad','sister']:
  for distance in ['near','far']:
   available=[state for state in states if all('-'.join([device,person,state,distance,str(i)])+'.png' in before and '-'.join([device,person,state,distance,str(i)])+'.png' in after for i in range(4))]
   for batch in range((len(available)+2)//3):
    wanted=available[batch*3:batch*3+3]
    if not wanted:continue
    if any('-'.join([device,person,state,distance,str(i)])+'.png' not in before or '-'.join([device,person,state,distance,str(i)])+'.png' not in after for state in wanted for i in range(4)):continue
    if any(before['-'.join([device,person,state,distance,str(i)])+'.png'][1]['eye'] != after['-'.join([device,person,state,distance,str(i)])+'.png'][1]['eye'] for state in wanted for i in range(4)):
     rejected=out/f'{device}-{person}-{distance}-{batch+1}.jpg';rejected.unlink(missing_ok=True)
     print('REJECT camera mismatch',device,person,distance,batch+1);continue
    rh=465 if device=='desktop' else 550 if device=='phone' else 210 if device=='landscape' else 300
    sheet=Image.new('RGB',(960,40+rh*2*len(wanted)),'#24272a');draw=ImageDraw.Draw(sheet)
    draw.text((6,8),f'HEAD / AFTER | {device} {person} {distance} | production house, native raster',font=font,fill='white')
    for row,state in enumerate(wanted):
     for i in range(4):
      name='-'.join([device,person,state,distance,str(i)])+'.png'
      bp,b=before[name];ap,a=after[name]
      assert b['target']==a['target'],(name,'camera aim changed');assert b['eye']==a['eye'],(name,'camera changed',b['eye'],a['eye'])
      assert abs(b['time']-a['time'])<1e-8,(name,'time changed')
      for side,(path,frame) in enumerate([(bp,b),(ap,a)]):
       im=Image.open(path).convert('RGB')
       if device=='desktop':
        x=(im.width-480)//2;im=im.crop((x,0,x+480,im.height))
       im.thumbnail((238,rh-28),Image.Resampling.LANCZOS)
       x=i*240;y=40+(row*2+side)*rh
       sheet.paste(im,(x+(240-im.width)//2,y+25))
       label='HEAD' if not side else 'FINAL' if round=='r3' or 'neck-final' in str(path) or 'stair-final' in str(path) else 'R4 BATCH'
       draw.text((x+3,y+4),f"{label} {state} {frame['time']:.2f}s {frame['range']/100:.1f}m",font=font,fill='white')
    sheet.save(out/f'{device}-{person}-{distance}-{batch+1}.jpg',quality=92);count+=1
print('Matched comparison sheets',count)

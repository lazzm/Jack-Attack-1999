from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parent/'shots/models/r3-real-seats/house'
j=json.loads((root/'report.json').read_text());font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
for person in ['mom','dad','sister']:
 seats=[s['id'] for s in j['seatInventory']]
 for start in range(0,len(seats),3):
  subset=seats[start:start+3];canvas=Image.new('RGB',(1600,35+len(subset)*520),'#22272a');d=ImageDraw.Draw(canvas)
  d.text((8,8),'R3 real seats / '+person+' / staged transitions, native desktop',font=font,fill='white')
  for row,seat in enumerate(subset):
   for stateIndex,state in enumerate(['sit','stand']):
    frames=sorted([f for f in j['seatFrames'] if (f['id'],f['seat'],f['state'])==(person,seat,state)],key=lambda f:f['time'])
    assert len(frames)==4,(person,seat,state)
    for col,f in enumerate(frames):
     im=Image.open(root/f['name']).convert('RGB');im.thumbnail((398,232));x=col*400;y=35+(row*2+stateIndex)*260
     canvas.paste(im,(x,y+25));d.text((x+4,y+4),seat+' '+state+' '+str(f['time'])+'s',font=font,fill='white')
  canvas.save(root/f'seats-{person}-{start//3+1}.jpg',quality=92)
print('12 real-seat sheets')

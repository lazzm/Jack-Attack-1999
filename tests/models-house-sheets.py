"""Contact sheets of unchanged production-house screenshot frames."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, sys
p=Path(__file__).resolve().parent/'shots'/'models'/sys.argv[1]/'house'
j=json.loads((p/'report.json').read_text()); frames=j['frames']
fnt=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
for dev,person,dist in dict.fromkeys((f['device'],f['id'],f['dist'])for f in frames):
 states=list(dict.fromkeys(f['state']for f in frames if(f['device'],f['id'],f['dist'])==(dev,person,dist)))
 for start in range(0,len(states),4):
  ss=states[start:start+4];w=1600 if dev=='desktop' else 960;cell=w//4;rh=280 if dev=='desktop' else 550
  sheet=Image.new('RGB',(w,35+rh*len(ss)),'#24272a');d=ImageDraw.Draw(sheet)
  d.text((8,8),f"{j['label']} / {dev} / {person} / {dist} / production house / raster cap {j.get('rasterCap')}",font=fnt,fill='white')
  for row,state in enumerate(ss):
   matches=[f for f in frames if(f['device'],f['id'],f['dist'],f['state'])==(dev,person,dist,state)]
   for col,f in enumerate(matches):
    im=Image.open(p/f['name']).convert('RGB');im.thumbnail((cell-2,rh-30));x=col*cell;y=35+row*rh
    sheet.paste(im,(x+(cell-im.width)//2,y+27));d.text((x+5,y+5),f"{state} {f['time']:.2f}s / {f['range']/100:.1f}m",font=fnt,fill='white')
  sheet.save(p/f'sheet-{dev}-{person}-{dist}-{start//4+1}.jpg',quality=92)
print(p)

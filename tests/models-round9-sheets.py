"""Native screenshot strips: crop empty margins; never resample game pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,sys
root=Path(__file__).resolve().parent
out=root/'shots/models/r9'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
rows=[]
def strip(name,files,source=out,crop=(80,100,620,800)):
    frames=[[Image.open(source/label/file).convert('RGB').crop(crop) for file in files] for label in ['before','after']]
    w,h=frames[0][0].size
    image=Image.new('RGB',(w*len(files),2*(h+28)), '#e5dfd3')
    d=ImageDraw.Draw(image)
    for row,label in enumerate(['Main 2.84.0','Working tree']):
        y=row*(h+28)
        for col,picture in enumerate(frames[row]):
            image.paste(picture,(col*w,y+28));d.text((col*w+8,y+5),label+' | '+str(col+1),font=font,fill='#302d28')
    image.save(out/(name+'.png'))
    rows.append({'name':name+'.png','files':files,'crop':crop,'resampled':False})
for person in ['mom','dad','sister']:
    for angle in [0,45,90]:strip('compare-sip-'+person+'-'+str(angle),[f'sip-{person}-{angle}-{i}.png' for i in range(5)])
for angle in [0,45,90]:strip('compare-phone-'+str(angle),[f'phone-mom-{angle}-{i}.png' for i in range(4)])
for person in ['mom','dad']:
    for angle in [0,45,90]:strip('compare-reading-'+person+'-'+str(angle),[f'reading-{person}-{angle}-{i}.png' for i in range(9)])
if '--studio-only' not in sys.argv:
    for person in ['mom','dad']:
        files=[person+'-reading-00.png']+[person+f'-put-away-{i}.png' for i in [1,2,3,4]]+[person+'-owner-away.png']+[person+f'-recover-{i}.png' for i in [1,3,5]]
        strip('house-reading-'+person,files,root/'shots/models/r9-house',(330,40,1030,820))
    strip('house-phone',[f'phone-{angle}-{i}.png' for angle in [0,45,90] for i in [0,1,2]],root/'shots/models/r9-house',(330,40,1030,820))
(out/'strips.json').write_text(json.dumps(rows,indent=2))
print('Wrote',len(rows),'native strips; no screenshot pixels resampled')

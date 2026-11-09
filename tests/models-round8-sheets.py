"""Matched native-pixel crops only; no upscaling/downscaling of evidence."""
from PIL import Image,ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parent/'shots/models/r8'
def strip(files,dest,w=360,h=400):
 sheet=Image.new('RGB',(w*len(files),h+36),'#d8d0c1');draw=ImageDraw.Draw(sheet)
 for i,(path,label,eye) in enumerate(files):
  im=Image.open(path).convert('RGB');cx,cy=eye or (im.width/2,im.height/2)
  box=(round(cx-w/2),round(cy-h*.52),round(cx+w/2),round(cy+h*.48))
  # Preserve source pixels and use the same harmless border outside short views.
  crop=im.crop((max(0,box[0]),max(0,box[1]),min(im.width,box[2]),min(im.height,box[3])))
  sheet.paste(crop,(i*w+max(0,-box[0]),max(0,-box[1])));draw.text((i*w+7,h+9),label,fill='#312d29')
 sheet.save(dest)
for label in ['before','after']:
 base=root/label
 if not (base/'report.json').exists():continue
 r=json.loads((base/'report.json').read_text())
 for person in ['mom','dad','sister']:
  for angle in [0,45,80,-80]:
   rows=[x for x in r['profiles'] if x['device']=='desktop' and x['id']==person and x['angle']==angle]
   if rows:strip([(base/x['name'],x['shape'],(x['eye']['x'],x['eye']['y'])) for x in rows],base/f'strip-profile-{person}-{angle}.png')
  acting=next((x for x in r['acting'] if x['id']==person),None)
  if acting:strip([(base/x['name'],f"{x['source']:.2f}s",None) for x in acting['frames']],base/f'strip-beat-{person}.png')
 for p in r['props']:
  # These retain the entire native screenshot so hands and real furniture can
  # be judged together; crops in the profile sheets never substitute for this.
  ims=[Image.open(base/x['name']).convert('RGB') for x in p['frames']]
  w,h=ims[0].size;out=Image.new('RGB',(w*len(ims),h+28),'#d8d0c1');d=ImageDraw.Draw(out)
  for i,(im,f) in enumerate(zip(ims,p['frames'])):out.paste(im,(i*w,0));d.text((i*w+10,h+8),f['state'],fill='#312d29')
  out.save(base/f"strip-prop-{p['id']}-{p['action']}-{p['angle']}.png")
 if r['groups']:
  chosen=[(i,x) for i,x in enumerate(r['groups']) if i in [0,2,4,6]]
  ims=[Image.open(base/x['name']).convert('RGB') for _,x in chosen];w,h=ims[0].size
  out=Image.new('RGB',(w*len(ims),h+30),'#d8d0c1');d=ImageDraw.Draw(out)
  for n,(im,(i,x)) in enumerate(zip(ims,chosen)):
   out.paste(im,(n*w,0));dad=x['people']['dad']['h']*180/3.141592653589793;sis=x['people']['sister']['h']*180/3.141592653589793
   d.text((n*w+10,h+8),f'frame {i}: Dad {dad:.0f} deg, sister {sis:.0f} deg',fill='#312d29')
  out.save(base/'strip-group.png')
for person in ['mom','dad','sister']:
 for angle in [0,45,80,-80]:
  files=[]
  for shape in ['rest','A','EI','OU','FV','question']:
   pair=[]
   for label in ['before','after']:
    base=root/label
    if not (base/'report.json').exists():continue
    r=json.loads((base/'report.json').read_text());x=next((x for x in r['profiles'] if x['device']=='desktop' and x['id']==person and x['angle']==angle and x['shape']==shape),None)
    if x:pair.append((base/x['name'],label+' '+shape,(x['eye']['x'],x['eye']['y'])))
   if len(pair)==2:files.extend(pair)
  if files:strip(files,root/f'compare-{person}-{angle}.png')
print('Native crops/strips in',root)

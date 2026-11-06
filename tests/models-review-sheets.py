"""Overview unchanged frame sheets for exhaustive art review (no generated art)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys
folder=Path('tests/shots/models')/sys.argv[1]
files=sorted(folder.glob(sys.argv[2] if len(sys.argv)>2 else 'sheet-*.jpg'))
out=folder/'review';out.mkdir(exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
for start in range(0,len(files),6):
 images=[]
 for p in files[start:start+6]:
  im=Image.open(p).convert('RGB');im.thumbnail((510,1780));images.append((p,im))
 h=max(im.height for _,im in images)+25;canvas=Image.new('RGB',(1536,h*2),'#202428');d=ImageDraw.Draw(canvas)
 for n,(p,im)in enumerate(images):
  x=n%3*512;y=n//3*h;canvas.paste(im,(x,y+25));d.text((x+2,y+3),p.stem,font=font,fill='white')
 canvas.save(out/f'overview-{start//6+1:02}.jpg',quality=94)
print(folder,len(files),'sheets',flush=True)

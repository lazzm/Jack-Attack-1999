"""Contact sheets from native screenshots; originals are retained unmodified."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

root = Path(__file__).parent / 'shots/world-art-round3'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
groups = {
    'contact-desktop': [('full', n) for n in ['mantel-front','mantel-side','pictures-close','certificate-close','hall-family','landing-family','street-noon','street-crowns','street-dusk','street-trees-green','street-trees-close','street-trees-dusk','kitchen-left','kitchen-right','kitchen-border']],
    'contact-fallback': [('fallback', n) for n in ['mantel-front','mantel-side','pictures-close','certificate-close','street-noon','street-dusk','street-trees-green','street-trees-dusk','kitchen-left','kitchen-right','kitchen-border']],
    'contact-mobile': [(p,n) for p in ['portrait','landscape','tablet'] for n in ['mantel-front','kitchen-right','street-trees-green','street-trees-dusk']],
}
for name, views in groups.items():
    width, height = 600, 390
    sheet = Image.new('RGB',(width*2,(height+30)*len(views)), '#23282c')
    draw = ImageDraw.Draw(sheet)
    for row,(profile,view) in enumerate(views):
        for col,tag in enumerate(['before','after']):
            path=root/tag/f'{profile}-{view}.png'
            if not path.exists():
                draw.text((col*width+8,row*(height+30)+5), f'MISSING {tag}: {profile} {view}', fill='#ffb897', font=font)
                continue
            im=Image.open(path).convert('RGB');im.thumbnail((width,height),Image.Resampling.LANCZOS)
            draw.text((col*width+8,row*(height+30)+5), f'{tag.upper()} | {profile} | {view}',fill='#f4e8ce',font=font)
            sheet.paste(im,(col*width+(width-im.width)//2,row*(height+30)+30))
    sheet.save(root/f'{name}.jpg',quality=93)

before=json.loads((root/'before/metrics.json').read_text())
after=json.loads((root/'after/metrics.json').read_text())
old={(r['mode'],r['name']):r for r in before['views']}
rows=[]
for r in after['views']:
    a=old.get((r['mode'],r['name']))
    if not a: continue
    rows.append({'mode':r['mode'],'name':r['name'],'callsBefore':a['calls'],'callsAfter':r['calls'],'callDelta':r['calls']-a['calls'],'trianglesBefore':a['triangles'],'trianglesAfter':r['triangles'],'trianglePercent':round((r['triangles']/a['triangles']-1)*100,3),'textureBytesBefore':a['textureBytes'],'textureBytesAfter':r['textureBytes'],'texturePercent':round((r['textureBytes']/a['textureBytes']-1)*100,3),'budgetPass':r['calls']<=a['calls']+2 and r['triangles']<=a['triangles']*1.08 and r['textureBytes']<=a['textureBytes']*1.1})
(root/'comparison.json').write_text(json.dumps(rows,indent=2))
print(json.dumps({'views':len(rows),'maxCallDelta':max(r['callDelta'] for r in rows),'maxTrianglePercent':max(r['trianglePercent'] for r in rows),'maxTexturePercent':max(r['texturePercent'] for r in rows),'failures':[r for r in rows if not r['budgetPass']]},indent=2))

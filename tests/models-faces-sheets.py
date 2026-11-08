"""Lossless source frames retained; these labelled sheets/GIFs are review aids."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parent/'shots/models/r6-faces'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
for label in ['before','after']:
    path=root/label/'report.json'
    if not path.exists(): continue
    report=json.loads(path.read_text())
    for person,recording in report['people'].items():
        sheet=Image.new('RGB',(11*160,55+6*184),'#252725');draw=ImageDraw.Draw(sheet)
        draw.text((8,6),f"{label.upper()} {person} | recorded {recording['id']} | 60Hz, every 2 frames, 0..2s",font=font,fill='white')
        draw.text((8,28),'Controlled production rig; real playback envelope trace. Native frames retained beside this sheet.',font=font,fill='white')
        frames=[]
        for i,frame in enumerate(recording['frames']):
            im=Image.open(root/label/frame['name']).convert('RGB');frames.append(im.resize((240,240),Image.Resampling.LANCZOS))
            x=(i%11)*160;y=55+(i//11)*184;sheet.paste(im.resize((160,160),Image.Resampling.LANCZOS),(x,y))
            draw.text((x+3,y+162),f"f{frame['frame']:03} {frame['t']:.3f}s",font=font,fill='white')
        sheet.save(root/f'{label}-{person}-strip.jpg',quality=94)
        frames[0].save(root/f'{label}-{person}-2sec.gif',save_all=True,append_images=frames[1:],duration=[33,34,33]*20+[33],loop=0,optimize=False)
    if report.get('expressions'):
        sheet=Image.new('RGB',(8*220,3*250+40),'#252725');draw=ImageDraw.Draw(sheet)
        draw.text((8,8),'Facial acting | Mom / Dad / Crystal | same lighting, camera and closed-mouth expression hold',font=font,fill='white')
        for i,frame in enumerate(report['expressions']):
            im=Image.open(root/label/frame['name']).convert('RGB').resize((220,220),Image.Resampling.LANCZOS)
            x=(i%8)*220;y=40+(i//8)*250;sheet.paste(im,(x,y));draw.text((x+5,y+224),frame['person']+' / '+frame['mood'],font=font,fill='white')
        sheet.save(root/'expressions.jpg',quality=95)
    if report.get('visemes'):
        sheet=Image.new('RGB',(7*220,3*250+40),'#252725');draw=ImageDraw.Draw(sheet)
        draw.text((8,8),'Six stylised speech classes + rest | same aperture input, atlas and camera',font=font,fill='white')
        for i,frame in enumerate(report['visemes']):
            im=Image.open(root/label/frame['name']).convert('RGB').resize((220,220),Image.Resampling.LANCZOS)
            x=(i%7)*220;y=40+(i//7)*250;sheet.paste(im,(x,y));draw.text((x+5,y+224),frame['person']+' / '+frame['shape'],font=font,fill='white')
        sheet.save(root/'visemes.jpg',quality=95)
    if report.get('listening'):
        sheet=Image.new('RGB',(5*260,3*290+40),'#252725');draw=ImageDraw.Draw(sheet)
        draw.text((8,8),'Recorded joke | speaker left, listener right | before / punchline / response / hold / settled',font=font,fill='white')
        for row,entry in enumerate(report['listening']):
            for col,frame in enumerate(entry['frames']):
                im=Image.open(root/label/frame['name']).convert('RGB').resize((260,260),Image.Resampling.LANCZOS)
                x=col*260;y=40+row*290;sheet.paste(im,(x,y));draw.text((x+5,y+264),entry['person']+' '+frame['label']+' '+str(round(frame['time'],2))+'s',font=font,fill='white')
        sheet.save(root/'listeners.jpg',quality=95)
print('Facial strip sheets and GIFs written to',root)
layouts=root.parent/'r6-layouts'
if (layouts/'report.json').exists():
    report=json.loads((layouts/'report.json').read_text())
    for device in sorted({f['device'] for f in report['cases']}):
        cases=[f for f in report['cases'] if f['device']==device]
        sheet=Image.new('RGB',(1100,40+400*((len(cases)+1)//2)),'#252725');draw=ImageDraw.Draw(sheet)
        draw.text((8,8),device+' | real F conversations, carried video + current-job reminder | native sources retained',font=font,fill='white')
        for i,frame in enumerate(cases):
            im=Image.open(layouts/frame['filename']).convert('RGB');im.thumbnail((540,370),Image.Resampling.LANCZOS)
            x=(i%2)*550;y=40+(i//2)*400;sheet.paste(im,(x+(550-im.width)//2,y+25))
            draw.text((x+5,y+3),frame['name'],font=font,fill='white')
        sheet.save(layouts/(device+'-contact.jpg'),quality=94)
    print('Conversation layout contact sheets written to',layouts)

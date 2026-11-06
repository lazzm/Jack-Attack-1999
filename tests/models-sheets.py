"""Arrange unmodified screenshot frames for visual review; no image generation."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, sys

root = Path(__file__).resolve().parent / 'shots' / 'models'
label = sys.argv[1] if len(sys.argv) > 1 else 'after'
folder = root / label
frames = json.loads((folder / 'metrics.json').read_text())['frames']
states = list(dict.fromkeys(f['state'] for f in frames))
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font = ImageFont.truetype(font_path, 15)
small = ImageFont.truetype(font_path, 12)
for device in ['desktop', 'phone']:
    for person in ['mom', 'dad', 'sister']:
        person_states = list(dict.fromkeys(f['state'] for f in frames if f['id']==person))
        for distance in [200, 400]:
            for batch in range((len(person_states) + 3) // 4):
                subset = person_states[batch*4:batch*4+4]
                sheet = Image.new('RGB', (960, 40+len(subset)*460), '#292c30')
                d = ImageDraw.Draw(sheet)
                d.text((10, 10), f'{label} / {device} / {person} / {distance//100} m / Low / production rig probe', fill='white', font=font)
                for row, state in enumerate(subset):
                    for col in range(4):
                        matches = [f for f in frames if f['device']==device and f['id']==person and f['dist']==distance and f['state']==state and f['name'].endswith(f'-{col}.png')]
                        if not matches:
                            continue
                        f = matches[0]
                        im = Image.open(folder / f['name']).convert('RGB')
                        im.thumbnail((238, 430), Image.Resampling.LANCZOS)
                        x, y = col*240, 40+row*460
                        sheet.paste(im, (x+(240-im.width)//2, y+24))
                        d.text((x+7, y+5), f'{state}  {f["frame"]/60:.2f}s', fill='white', font=small)
                sheet.save(folder / f'sheet-{device}-{person}-{distance}-{batch+1}.jpg', quality=90)
print(f'Sheets: {folder}')

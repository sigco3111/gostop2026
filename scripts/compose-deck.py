from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
folder=Path('public/assets/cards')
manifest=json.loads((folder/'deck-manifest.json').read_text())
regular='/home/sandbox/.fonts/NotoSansKR-Regular.otf'
bold='/home/sandbox/.fonts/NotoSansKR-Bold.otf'
font=ImageFont.truetype(bold,28); small=ImageFont.truetype(regular,18)
for a in manifest:
 sheet=Image.open(f'/downloads/deck-sheet-{a["month"]:02}.png').convert('RGB')
 w,h=sheet.size;q=a['id']%4;x=q%2;y=q//2
 crop=sheet.crop((int(w*x/2)+2,int(h*y/2)+2,int(w*(x+1)/2)-2,int(h*(y+1)/2)-2)).resize((320,480),Image.Resampling.LANCZOS)
 draw=ImageDraw.Draw(crop)
 k=a['type']; col='#edc55b' if '광' in k else '#64d4df' if k=='열끗' else '#d998ec' if k.endswith('단') or k=='띠' else '#cbd1ce'
 draw.rounded_rectangle((2,2,317,477),radius=10,outline='#0b1017',width=8)
 draw.rounded_rectangle((5,5,314,474),radius=8,outline=col,width=3)
 draw.rounded_rectangle((10,10,83,49),radius=5,fill='#10151d')
 draw.text((46,27),f'{a["month"]:02}',font=font,fill=col,anchor='mm')
 draw.rounded_rectangle((229,10,310,49),radius=5,fill='#10151d')
 draw.text((270,27),k,font=font,fill=col,anchor='mm')
 draw.rounded_rectangle((10,444,310,469),radius=4,fill='#10151d')
 draw.text((160,455),f'{a["month"]}월 · {k}',font=small,fill='#f4e5c9',anchor='mm')
 # Hongdan/Cheongdan inscriptions, with type label mirrored in top corner.
 if k in ('홍단','청단'):
  # Matching exact word is added deliberately rather than trusting generated glyphs.
  draw.rounded_rectangle((143,192,212,231),radius=4,fill='#121722')
  draw.text((177,209),k,font=font,fill='#f9e3be',anchor='mm')
 crop.save(folder/f'card-{a["id"]:02}.webp',quality=89,method=6)
print('composed 48 labelled artwork cards')

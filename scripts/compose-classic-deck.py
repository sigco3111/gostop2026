from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
folder=Path('public/assets/cards')
manifest=json.loads((folder/'deck-manifest.json').read_text())
regular='/home/sandbox/.fonts/NotoSansKR-Regular.otf'
bold='/home/sandbox/.fonts/NotoSansKR-Bold.otf'
font=ImageFont.truetype(bold,35); small=ImageFont.truetype(regular,20)
for a in manifest:
 sheet=Image.open(f'assets/card-sheets/classic/classic-sheet-{a["month"]:02}.png').convert('RGB')
 w,h=sheet.size;q=a['id']%4;x=q%2;y=q//2
 crop=sheet.crop((int(w*x/2)+2,int(h*y/2)+2,int(w*(x+1)/2)-2,int(h*(y+1)/2)-2)).resize((320,480),Image.Resampling.LANCZOS)
 draw=ImageDraw.Draw(crop)
 k=a['type']; col='#171717'
 draw.rounded_rectangle((2,2,317,477),radius=10,outline='#0b1017',width=8)
 # No grade-coloured frame: retain conventional printed hwatu edges.
 draw.rounded_rectangle((10,10,83,49),radius=5,fill='#f7f0dc')
 draw.text((46,27),f'{a["month"]:02}',font=font,fill=col,anchor='mm')
 draw.rounded_rectangle((229,10,310,49),radius=5,fill='#f7f0dc')
 draw.text((270,27),k,font=font,fill=col,anchor='mm')
 draw.rounded_rectangle((10,444,310,469),radius=4,fill='#f7f0dc')
 draw.text((160,455),f'{a["month"]}월 · {k}',font=small,fill='#171717',anchor='mm')
 # Hongdan/Cheongdan inscriptions, with type label mirrored in top corner.
 if k in ('홍단','청단'):
  # Matching exact word is added deliberately rather than trusting generated glyphs.
  draw.rounded_rectangle((143,192,212,231),radius=4,fill='#f7f0dc')
  draw.text((177,209),k,font=font,fill='#8f1117',anchor='mm')
 crop.save(folder/f'card-{a["id"]:02}.webp',quality=89,method=6)
print('composed 48 labelled artwork cards')

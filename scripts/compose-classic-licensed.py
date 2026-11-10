"""Extract licensed Korean hwatu artwork without embellishing.
Source: Marcus Richert / Louie Mantia Jr.; optimized by Spenĉjo.
CC BY-SA 4.0. See assets/licensed/hwatu/ATTRIBUTION.md.
Raster source rendered in Chrome at exactly 3x from master SVG.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
im=Image.open('/downloads/korean-hwatu-reference/overview.png').convert('RGB')
xs=[(0,308),(326,634),(654,961),(979,1287),(1342,1650),(1668,1975),(1995,2303),(2321,2629),(2688,2995),(3013,3321),(3341,3648),(3666,3974)]
ys=[(0,503),(559,1062),(1122,1624),(1691,2194)]
out=Path('public/assets/cards/classic');out.mkdir(exist_ok=True)
for m in range(1,13):
 pos=m-1 if m<11 else (11 if m==11 else 10)
 row,group=divmod(pos,3)
 order=[0,2,1,3] if m<=10 else ([0,1,3,2] if m==11 else [0,1,2,3])
 for q,offset in enumerate(order):
  x1,x2=xs[group*4+offset];y1,y2=ys[row]
  card=im.crop((x1,y1,x2+1,y2+1));card.save(out/f'card-{(m-1)*4+q:02}.webp',lossless=True,method=6)
# Contact sheet uses external labels, never overlays licensed art.
f=ImageFont.truetype('/home/sandbox/.fonts/NotoSansKR-Bold.otf',18)
contact=Image.new('RGB',(12*112,4*204),'#ddd');d=ImageDraw.Draw(contact)
for m in range(1,13):
 for q in range(4):
  c=Image.open(out/f'card-{(m-1)*4+q:02}.webp').resize((103,168))
  contact.paste(c,((m-1)*112,q*204+26));d.text(((m-1)*112+3,q*204+1),f'{m}월 #{(m-1)*4+q:02}',font=f,fill='#111')
contact.save('/downloads/deck-variants/classic-licensed-contact.png')

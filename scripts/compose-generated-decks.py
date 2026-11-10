"""Export original comic and minimal 2x2 month artwork, canonical ID order."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
manifest=json.loads(Path('public/assets/cards/deck-manifest.json').read_text())
f=ImageFont.truetype('/home/sandbox/.fonts/NotoSansKR-Bold.otf',23)
for style in ['comic','minimal']:
 folder=Path('public/assets/cards')/style;src=Path('assets/card-sheets')/(style+'-v3');src.mkdir(parents=True,exist_ok=True)
 for m in range(1,13):
  p=Path(f'/downloads/{style}-v3-month-{m:02}.png')
  if not p.exists():continue
  (src/p.name).write_bytes(p.read_bytes())
  im=Image.open(p).convert('RGB');w,h=im.size
  for item in [i for i in manifest if i['month']==m]:
   q=item['id']%4;x,y=q%2,q//2;k=item['type']
   card=im.crop((x*w//2+3,y*h//2+3,(x+1)*w//2-3,(y+1)*h//2-3)).resize((320,480),Image.Resampling.LANCZOS);d=ImageDraw.Draw(card)
   d.rounded_rectangle((2,2,317,477),radius=7,outline='#111',width=3)
   d.rounded_rectangle((8,8,58,39),radius=3,fill='white');d.text((33,23),str(m),font=f,fill='#111',anchor='mm')
   d.rounded_rectangle((239,8,312,39),radius=3,fill='white');d.text((276,23),k,font=f,fill='#111',anchor='mm')
   if k in ['홍단','청단']:
    d.rounded_rectangle((128,200,192,234),radius=3,fill='white');d.text((160,217),k,font=f,fill='#111',anchor='mm')
   if '광' in k:
    d.ellipse((260,418,309,467),fill='#d21d22');d.text((284,441),'光',font=f,fill='white',anchor='mm')
   card.save(folder/f'card-{item["id"]:02}.webp',quality=92,method=6)
 contact=Image.new('RGB',(12*112,4*194),'#ddd');d=ImageDraw.Draw(contact)
 for item in manifest:
  m=item['month'];q=item['id']%4;c=Image.open(folder/f'card-{item["id"]:02}.webp').resize((108,162));contact.paste(c,((m-1)*112,q*194+26));d.text(((m-1)*112+3,q*194+1),f'{m}월',font=f,fill='#111')
 contact.save(f'/downloads/deck-variants/{style}-v3-contact.png')

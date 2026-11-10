"""Original alternate decks. Shared monthly icon vocabulary, distinct page geometry and drawing treatment."""
from pathlib import Path
import math,json
scope={};exec(Path('scripts/draw-deck.py').read_text().split('manifest=[]')[0].replace("out.mkdir(parents=True,exist_ok=True)",''),scope)
flora,special=scope['flora'],scope['special'];kinds=scope['kind'];names=scope['names']
for style in ['classic','comic','minimal']:
 out=Path('public/assets/cards')/style;out.mkdir(exist_ok=True)
 for m in range(1,13):
  for v,k in enumerate(kinds[m-1]):
   n=(m-1)*4+v;bot=flora(m,v);symbol=special(m,k)
   base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" rx="8" fill="#171717"/><rect x="5" y="5" width="190" height="290" rx="4" fill="#fffaf0"/>'
   if style=='classic':
    # White printed field, bold red/black/green, botanical lower mass and scoring icon on top.
    bot=bot.replace('#7656a4','#171717').replace('#94465b','#cf2528').replace('#e8a6ac','#ed5c64')
    base+='<g transform="translate(0 66) scale(1 .74)">'+bot+'</g>'
    if k in ['홍단','청단','초단','띠']:base+=symbol
    elif symbol:base+='<g transform="translate(0 -33)">'+symbol+'</g>'
    if '광' in k:base+='<rect x="142" y="227" width="40" height="45" fill="#cd2428"/><text x="162" y="260" text-anchor="middle" fill="white" font-size="30" font-weight="900">光</text>'
   elif style=='comic':
    base+='<defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.6" fill="#e8c7a2"/></pattern></defs><path d="M5 5H195V295H5Z" fill="#fff0c9"/><path d="M5 75L195 25V220L5 277Z" fill="#ffd85c"/><rect x="5" y="5" width="190" height="290" fill="url(#dots)"/>'
    base+='<g transform="translate(-14 37) rotate(-7 100 150) scale(1.13 .83)" stroke="#17222b" stroke-width="2.5" stroke-linejoin="round">'+bot+'</g>'
    if symbol:base+='<g transform="translate(-10 -10) scale(1.1)" stroke="#17222b" stroke-width="2.5" stroke-linejoin="round">'+symbol+'</g>'
    # Expressive mascot eyes on the botanical trunk, separate from scoring marks.
    base+='<ellipse cx="78" cy="245" rx="14" ry="18" fill="white" stroke="#17222b" stroke-width="3"/><ellipse cx="108" cy="245" rx="14" ry="18" fill="white" stroke="#17222b" stroke-width="3"/><circle cx="82" cy="247" r="5"/><circle cx="111" cy="247" r="5"/><path d="M83 268Q96 280 110 266" fill="none" stroke="#17222b" stroke-width="3"/>'
    base+=f'<path d="M118 45L184 45L184 79L149 79L133 92L136 79L118 79Z" fill="white" stroke="#17222b" stroke-width="3"/><text x="151" y="69" text-anchor="middle" font-size="19" font-weight="900">{k}</text>'
   else:
    base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" rx="12" fill="#fcfbf5"/><rect x="4" y="4" width="192" height="292" rx="10" fill="none" stroke="#142c2b" stroke-width="6"/>'
    # Compact botanical medallion plus isolated scoring icon, not a hue filter.
    base+='<circle cx="100" cy="127" r="72" fill="#edf0e6"/><g transform="translate(33 44) scale(.67)">'+bot+'</g>'
    if symbol:base+='<rect x="20" y="183" width="160" height="77" rx="10" fill="#fff"/><g transform="translate(45 95) scale(.55)">'+symbol+'</g>'
    base+=f'<text x="100" y="276" text-anchor="middle" font-size="25" fill="#142c2b" font-weight="900">{k}</text>'
   if k=='쌍피':base+='<path d="M20 206L44 185L70 206L99 184L128 206L156 184L181 206V257H20Z" fill="#c5272d"/><path d="M35 222H166M35 238H166" stroke="#fff4dc" stroke-width="5"/>'
   base+=f'<rect x="9" y="9" width="51" height="31" rx="4" fill="#fffdf4"/><text x="34" y="32" text-anchor="middle" font-size="25" font-weight="900" fill="#111">{m}</text>'
   if style!='comic':base+=f'<text x="182" y="32" text-anchor="end" font-size="18" font-weight="900" fill="#111">{k}</text>'
   base=base.replace('<svg xmlns=', '<svg xmlns=',1).replace('viewBox="0 0 200 300">','viewBox="0 0 200 300"><style>text{stroke:none;font-family:sans-serif}</style>',1);base+='</svg>';(out/f'card-{n:02}.svg').write_text(base)
 print(style,'48 original layouts written')

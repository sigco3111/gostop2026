# Original vector hwatu production deck. No borrowed drawings.
from pathlib import Path
import math,json
out=Path('public/assets/cards'); out.mkdir(parents=True,exist_ok=True)
names=['송학','매조','벚꽃','흑싸리','난초','모란','홍싸리','공산','국화','단풍','오동','비']
kind=[['광','홍단','피','피'],['열끗','홍단','피','피'],['광','홍단','피','피'],['열끗','초단','피','피'],['열끗','초단','피','피'],['열끗','청단','피','피'],['열끗','초단','피','피'],['광','열끗','피','피'],['열끗','청단','피','피'],['열끗','청단','피','피'],['광','피','피','쌍피'],['비광','열끗','띠','쌍피']]
def path(d,fill='#16232a',stroke=None,w=2):return f'<path d="{d}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"' if stroke else '')+'/>'
def ellipse(x,y,rx,ry,fill,rotate=0):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" transform="rotate({rotate} {x} {y})"/>'
def flower(x,y,col,size=12):
 s=''
 for k in range(5):
  a=k*math.tau/5; s+=ellipse(x+math.cos(a)*size*.55,y+math.sin(a)*size*.55,size*.5,size*.5,col)
 return s+ellipse(x,y,size*.17,size*.17,'#d9a744')
def flora(m,v):
 s=''
 # main angular botanical stems, varied composition for paired pi
 shift=14 if v==3 else -5
 if m==1:
  s+=path(f'M {42+shift} 275 L {66+shift} 190 L {58+shift} 118 L {110+shift} 45 L {98+shift} 145 L {112+shift} 210 L {94+shift} 285','#18252b')
  for x,y in [(58,105),(105,58),(119,155),(48,208),(139,215)]:
   s+=path(f'M{x-36} {y+8} Q{x} {y-42} {x+40} {y+8} Q{x} {y-4} {x-36} {y+8}','#264437')
   for i in range(-4,5):s+=path(f'M{x} {y+4} l{i*8} {-20-abs(i)*2}','none','#6b8562',1)
 elif m in (2,3,6,9):
  s+=path(f'M25 288 Q80 185 135 65 M70 211 L37 135 M100 147 L166 120','none','#29332e',8)
  colors={2:'#cc273e',3:'#e8a6ac',6:'#ba214a',9:'#d6a82e'}
  for i,(x,y) in enumerate([(135,69),(104,121),(158,127),(53,151),(78,201),(45,252)]):
   x+=shift*.4
   s+=flower(x,y,colors[m],20 if m in (6,9) else 13)
   if m in (6,9):s+=flower(x,y,'#f4c851' if m==9 else '#e06478',12)
   s+=path(f'M{x-9} {y+22} q-36 -18 -25 -30 q22 3 25 30','#254b40')
 elif m in (4,7,11):
  for j in range(5):
   x=22+j*37+shift*.3
   s+=path(f'M{x} 284 Q{x+35} 180 {x+7} 52','none','#273d34',3)
   for y in range(65,270,24):
    col=('#7656a4' if m==4 else '#94465b' if m==7 else '#4a6c44')
    s+=ellipse(x+9,y,13,6,col,-35)+ellipse(x+24,y+10,13,6,col,35)
 elif m==5:
  for j in range(5):
   x=25+j*36
   s+=path(f'M{x} 288 Q{x+28} 176 {x+15} {65+j%2*32}','none','#284b3e',5)
   s+=path(f'M{x+15} {80+j%2*32} q-34 -42 -36 0 q2 24 34 8 q25 25 32 0 q-8 -26 -30 -8','#454ca2')
   s+=ellipse(x+14,86+j%2*32,4,11,'#e3b543')
 elif m==8:
  s+=path('M0 225 Q90 160 200 208 L200 292 L0 292 Z','#222934')
  for j in range(18):
   x=12+j*12
   s+=path(f'M{x} 287 Q{x-9} 237 {x+8} {175+j%3*9}','none','#aaa28a',1.8)
   s+=path(f'M{x+7} {180+j%3*9} l-13 -16 l15 6 l-9 -16 l12 10','none','#d4cbb1',3)
 elif m==10:
  s+=path('M24 285 Q70 195 155 56 M75 192 L25 115 M103 139 L177 146','none','#28302b',7)
  for x,y in [(155,60),(122,104),(41,124),(172,155),(84,205),(38,256)]:
   s+=path(f'M{x} {y-19} l6 12 l13 -5 l-4 13 l14 7 l-21 4 l-7 13 l-5 -14 l-19 -7 l15 -8 l-3 -14 Z','#b82e2f')
 elif m==12:
  s+=path('M174 285 Q145 190 167 45 M166 72 Q88 34 33 83 M165 101 Q88 65 21 125','none','#202f30',7)
  for j in range(12):
   x=20+j*14
   s+=path(f'M{x} {83+j%3*12} Q{x+13} 162 {x-6} 238','none','#326052',2)
   for y in range(110,230,20):s+=ellipse(x+4,y,3,10,'#326052',-20)
  for j in range(15):s+=path(f'M{j*17} 55 l-7 27 M{j*17+9} 158 l-6 21','none','#8eacb0',1)
 return s

def bird(x,y,scale=1,color='#ece4cd',crane=False):
 s=ellipse(x,y,30,16,color,-12)
 s+=path(f'M{x-6} {y} q-28 -55 -46 -44 q7 35 36 51',color,'#172832',2)
 s+=path(f'M{x+17} {y-6} q35 -16 21 -39 q-14 -6 -17 12 q14 11 -7 24',color,'#172832',2)
 s+=path(f'M{x+39} {y-39} l21 5 l-21 3','#c73b34')
 if crane:s+=ellipse(x+33,y-42,7,4,'#c52831')
 s+=ellipse(x+38,y-38,2,2,'#16232a')
 s+=path(f'M{x-7} {y+12} l-8 37 M{x+4} {y+11} l2 36','none','#172832',3)
 return s

def special(m,k):
 if k in ('홍단','청단','초단','띠'):
  col='#2447a6' if k=='청단' else '#b71d36'
  return path('M18 90 Q85 74 178 99 L175 210 Q95 183 21 203 Z',col,'#1e2934',2)+(f'<text x="98" y="137" fill="#fff1ce" font-size="21" font-weight="bold" text-anchor="middle">{k if k!="띠" else ""}</text>' if k!='초단' else '')
 if m==1 and k=='광':return ellipse(139,79,29,29,'#bd2a39')+bird(88,210,crane=True)
 if m==2 and k=='열끗':return bird(105,195,color='#b79a48')
 if m==3 and k=='광':return path('M15 170 Q100 185 185 166 L185 244 Q100 224 15 244 Z','#b82338')+path('M20 191 H181 M59 173 L59 235 M142 173 L142 235','none','#f0d6ae',3)
 if m==4 and k=='열끗':return bird(102,189,color='#e5dfcc')
 if m==5 and k=='열끗':return path('M4 220 Q99 132 196 205 L196 227 Q100 177 4 247 Z','#9a7143','#27342d',3)+path('M15 218 L15 180 M58 195 L58 161 M105 185 L105 154 M153 197 L153 169 M187 210 L187 181','none','#29342f',4)
 if m==6 and k=='열끗':return ellipse(85,160,21,14,'#51a6b4',-35)+ellipse(117,160,21,14,'#51a6b4',35)+ellipse(88,182,13,11,'#c49b43')+ellipse(114,182,13,11,'#c49b43')+path('M100 147 L100 193 M100 151 l-9 -14 M100 151 l10 -14','none','#20303a',4)
 if m==7 and k=='열끗':return ellipse(101,214,53,29,'#57463c')+path('M55 202 L28 228 L61 235 M66 235 l-8 27 M135 235 l11 25 M122 194 l10 -22 l10 28','#57463c','#17232a',4)+ellipse(51,213,3,3,'#eddec0')
 if m==8 and k=='광':return ellipse(104,101,41,41,'#dfb94b')
 if m==8 and k=='열끗':return path('M40 130 q26 -37 42 0 q14 -24 40 -7 q-25 2 -35 15 Z M92 94 q28 -32 40 -2 q17 -18 39 -3 q-25 -1 -37 12 Z M38 79 q23 -22 34 1 q17 -17 36 -4 q-20 3 -33 11 Z','#e6dfcb','#26353e',2)
 if m==9 and k=='열끗':return path('M46 195 L152 195 L138 246 Q97 271 60 246 Z','#f5e9d4','#243239',3)+f'<text x="98" y="231" text-anchor="middle" fill="#aa2b36" font-size="27" font-weight="bold">壽</text>'
 if m==10 and k=='열끗':return ellipse(102,223,41,20,'#a57548')+path('M126 219 l13 -46 l15 -4 l7 10 l-12 12 l-7 40 M77 235 l-6 30 M120 237 l8 29','none','#a57548',8)+path('M144 173 l-12 -22 l-14 -4 M142 163 l15 -21 l14 -3','none','#40352a',3)
 if m==11 and k=='광':return path('M97 179 Q57 112 20 107 Q28 161 78 197 Q48 211 25 255 Q70 243 105 209 Q145 235 181 268 Q161 211 121 193 Q176 153 186 96 Q133 111 110 177 L118 145 L105 129 L94 141 Z','#c79c3f','#3d2b23',3)+ellipse(108,141,2,2,'#121c22')
 if m==12 and k=='비광':return path('M37 164 Q79 100 124 166 Z','#303246','#151f2b',3)+path('M80 163 L80 207 M70 199 L96 199 L114 260 L60 260 Z','#7d5541','#17252a',3)+ellipse(83,188,12,13,'#c3a380')
 if m==12 and k=='열끗':return path('M24 185 Q71 132 102 182 Q142 145 182 170 Q141 181 107 204 L63 222 L79 198 Z','#1b2e3b')
 return ''
manifest=[]
for m in range(1,13):
 for v,k in enumerate(kind[m-1]):
  i=(m-1)*4+v; col='#e9bd50' if '광' in k else '#43b8c6' if k=='열끗' else '#ba74c8' if '단' in k or k=='띠' else '#b3b6b5'
  marks=2 if k=='쌍피' else 1
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#f7ead1"/><stop offset="1" stop-color="#cfc0a8"/></linearGradient></defs><rect width="200" height="300" rx="11" fill="#0b141c"/><rect x="5" y="5" width="190" height="290" rx="8" fill="url(#paper)"/>'
  svg+=flora(m,v)+special(m,k)
  if k=='쌍피':svg+=path('M12 203 L45 180 L75 206 L108 179 L144 205 L186 176 L186 265 L12 265 Z','#b02137','#211e28',3)
  svg+=f'<rect x="8" y="8" width="184" height="284" rx="6" fill="none" stroke="{col}" stroke-width="4"/><rect x="11" y="11" width="54" height="29" rx="4" fill="#101a24"/><text x="38" y="32" text-anchor="middle" font-family="sans-serif" font-size="19" font-weight="bold" fill="{col}">{m:02}</text><rect x="128" y="11" width="61" height="29" rx="4" fill="#101a24"/><text x="159" y="31" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="{col}">{k}</text>'
  svg+=f'<rect x="10" y="267" width="180" height="23" rx="3" fill="#101a24"/><text x="100" y="284" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#eee3cc">{m}월 · {names[m-1]} · {k}</text>'
  if k=='피':
   for j in range(v-1 if m==11 else (1 if v==2 else 2)):svg+=ellipse(23+j*9,251,3,3,'#27333c')
  svg+='</svg>'
  (out/f'card-{i:02}.svg').write_text(svg)
  manifest.append(dict(id=i,month=m,type=k,path=f'card-{i:02}.svg'))
(out/'deck-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('48 original vector cards written')

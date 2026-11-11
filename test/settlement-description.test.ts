import { it,expect } from 'vitest';
import { buildDeck } from '../src/engine/cards';
import { settle } from '../src/engine/scoring';
import { settlementDescription } from '../src/data/settlementDescription';
const d=buildDeck();
it('explains an unmultiplied stop without inventing a bonus',()=>{expect(settlementDescription({base:7,finalScore:7,multipliers:[],goAdd:0})).toBe('기본 7점 · 추가 배수 없음 = 7점');});
it('names every actual multiplier and includes go addition before multipliers',()=>{const r=settle({winner:d.filter(c=>c.kind==='pi'),loser:[],goCount:3,loserGoCount:1,shakes:2,nagariCarry:8});const before=JSON.stringify(r),text=settlementDescription(r);expect(text).toContain(`(기본 ${r.base}점 + 고 3점)`);for(const m of r.multipliers)expect(text).toContain(m);expect(text.endsWith(`= ${r.finalScore}점`)).toBe(true);expect(JSON.stringify(r)).toBe(before);});
it('uses the selected settlement base for gukjin rather than raw-score assumptions',()=>{for(let n=0;n<=48;n++)for(let go=0;go<=4;go++){const r=settle({winner:d.slice(0,n),loser:d.slice(n),goCount:go,loserGoCount:0,shakes:0,nagariCarry:1});const text=settlementDescription(r);expect(text).toContain(`기본 ${r.base}점`);expect(text).toContain(`= ${r.finalScore}점`);expect(text.includes('고 '+go+'점')).toBe(go>0);}});

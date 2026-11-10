import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {buildDeck} from '../src/engine/cards';
describe('canonical48card art manifest',()=>{
 const cards=buildDeck();
 for(const style of ['','classic/','comic/','minimal/']){
  it(`${style||'original'} matches all48 scoring classifications`,()=>{
   const rows=JSON.parse(readFileSync(`public/assets/cards/${style}deck-manifest.json`,'utf8'));
   expect(rows).toHaveLength(48);expect(new Set(rows.map((r:any)=>r.id)).size).toBe(48);
   for(const c of cards){const r=rows.find((r:any)=>r.id===c.id);expect(r.month).toBe(c.month);const expected=c.kind==='gwang'?(c.isBi?'비광':'광'):c.kind==='yeol'?'열끗':c.kind==='tti'?(c.dan==='hong'?'홍단':c.dan==='cheong'?'청단':c.dan==='cho'?'초단':'띠'):c.piValue===2?'쌍피':'피';expect(r.type).toBe(expected);if(style)expect(r.path).toBe(`card-${String(c.id).padStart(2,'0')}.webp`);expect(existsSync(`public/assets/cards/${style}card-${String(c.id).padStart(2,'0')}.webp`)).toBe(true);}
   expect(cards.filter(c=>c.kind==='gwang').map(c=>c.month)).toEqual([1,3,8,11,12]);
   expect(cards.filter(c=>c.isGodori).map(c=>c.month)).toEqual([2,4,8]);
   expect(cards.filter(c=>c.piValue===2).map(c=>c.month)).toEqual([11,12]);
  });
 }
});

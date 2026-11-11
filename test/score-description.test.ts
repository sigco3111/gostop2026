import {it,expect} from 'vitest';
import {buildDeck} from '../src/engine/cards';
import {score} from '../src/engine/scoring';
import {scoreItems,scoreDescription} from '../src/data/scoreDescription';
const d=buildDeck();
it('explains no-score captures without inventing points',()=>{expect(scoreItems(score([]))).toEqual([]);expect(scoreDescription(score(d.filter(c=>c.kind==='pi').slice(0,9)))).toBe('아직 점수가 나는 족보가 없습니다. 현재 0점입니다.');});
it('lists scoring combinations and card-count points separately',()=>{const sc=score(d.filter(c=>c.kind==='tti'));expect(scoreItems(sc)).toEqual([['홍단',3],['청단',3],['초단',3],['띠',6]]);expect(scoreDescription(sc)).toBe('점수 내역: 홍단 3점 + 청단 3점 + 초단 3점 + 띠 6점 = 15점');});
it('descriptions add to the engine total for every whole-deck prefix in both gukjin designations',()=>{for(let n=0;n<=48;n++)for(const mode of ['auto','yeol','pi'] as const){const sc=score(d.slice(0,n),mode);expect(scoreItems(sc).reduce((s,[,points])=>s+points,0)).toBe(sc.total);expect(scoreItems(sc).every(([,points])=>points>0)).toBe(true);}});
it('rain-light and godori explanations use existing engine values without changing metadata',()=>{const cards=d.filter(c=>c.isGodori||c.kind==='gwang'&&[1,3,12].includes(c.month));const before=JSON.stringify(cards);expect(scoreItems(score(cards))).toEqual([['광',2],['고도리',5]]);expect(JSON.stringify(cards)).toBe(before);});

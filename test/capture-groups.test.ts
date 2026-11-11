import {it,expect} from 'vitest';
import {buildDeck} from '../src/engine/cards';
import {score} from '../src/engine/scoring';
import {captureGroups} from '../src/data/captureGroups';
const d=buildDeck(),gukjin=d.find(c=>c.isGukjin)!;
it('moves gukjin into pi and counts two units when chosen as pi',()=>{const groups=captureGroups([gukjin],score([gukjin],'pi'));expect(groups.map(g=>[g.label,g.count])).toEqual([['피',2]]);expect(groups[0].cards).toEqual([gukjin]);});
it('keeps gukjin in yeol when chosen as yeol',()=>{expect(captureGroups([gukjin],score([gukjin],'yeol')).map(g=>[g.label,g.count])).toEqual([['열끗',1]]);});
it('uses engine counts and preserves every physical card exactly once in all modes',()=>{const before=JSON.stringify(d);for(let n=0;n<=48;n++)for(const mode of ['auto','pi','yeol'] as const){const cards=d.slice(0,n),sc=score(cards,mode),groups=captureGroups(cards,sc);expect(groups.flatMap(g=>g.cards).map(c=>c.id).sort((a,b)=>a-b)).toEqual(cards.map(c=>c.id).sort((a,b)=>a-b));for(const group of groups)expect(group.count).toBe(({광:sc.counts.gwang,열끗:sc.counts.yeol,띠:sc.counts.tti,피:sc.counts.piUnits})[group.label]);}expect(JSON.stringify(d)).toBe(before);});
it('does not invent empty groups and still counts ordinary double pi',()=>{expect(captureGroups([],score([]))).toEqual([]);const cards=d.filter(c=>c.kind==='pi');expect(captureGroups(cards,score(cards)).map(g=>[g.label,g.count])).toEqual([['피',cards.reduce((s,c)=>s+c.piValue,0)]]);});

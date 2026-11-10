import {describe,it,expect} from 'vitest';
import {Tournament} from '../src/engine/tournament';
import {OPPONENTS} from '../src/data/opponents';
import {parseSave} from '../src/data/save';
describe('eight-player tournament',()=>{
 it('three best-of-three rounds produce one champion',()=>{
  const t=new Tournament(OPPONENTS,()=>.4);expect(t.alive.length).toBe(8);
  for(let r=0;r<3;r++){
   expect(t.opponent).not.toBe(null);expect(t.recordPlayerGame(null)).toBe('continue');expect(t.series).toEqual([0,0]);
   expect(t.recordPlayerGame(0)).toBe('continue');expect(t.recordPlayerGame(1)).toBe('continue');
   expect(t.recordPlayerGame(0)).toBe(r===2?'champion':'roundWon');expect(t.alive.length).toBe(2**(2-r));
  }
  expect(t.history.map(r=>r.length)).toEqual([4,2,1]);expect(t.champion).toBe('ME');expect(()=>t.recordPlayerGame(0)).toThrow();
 });
 it('two losses eliminate player, no third-round retry without restarting',()=>{
  const t=new Tournament(OPPONENTS);t.recordPlayerGame(1);expect(t.recordPlayerGame(1)).toBe('eliminated');expect(t.opponent).toBe(null);expect(()=>t.recordPlayerGame(0)).toThrow();
 });
});
describe('save schema',()=>{
 it('12단계 돌파 칭호는 재로딩 뒤에도 보존된다',()=>{const s=parseSave(JSON.stringify({version:1,clearedStages:Array.from({length:12},(_,i)=>i+1),trophies:1,nagariCarry:1}));expect(s.titles).toEqual(['어둠의 판의 챔피언','어둠의 판의 새 전설']);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('malformed, null, wrong version and arrays are safe',()=>{for(const raw of ['bad','null','[]','{"version":99}',null])expect(parseSave(raw).clearedStages).toEqual([]);});
 it('legacy save migrates, gaps cannot silently unlock later stages',()=>{expect(parseSave('{"clearedStages":[1,2,5],"trophies":2,"nagariCarry":4}')).toEqual({version:1,clearedStages:[1,2],titles:['어둠의 판의 챔피언'],trophies:2,nagariCarry:4});});
 it('negative counts and invalid carry are reset, genuine progress survives reload',()=>{const s=parseSave('{"clearedStages":[1,2,3],"trophies":-2,"nagariCarry":3}');expect(s.trophies).toBe(0);expect(s.nagariCarry).toBe(1);expect(parseSave(JSON.stringify(s))).toEqual(s);});
});

import {describe,it,expect} from 'vitest';
import {Tournament} from '../src/engine/tournament';
import {OPPONENTS} from '../src/data/opponents';
import {parseTournament,tournamentSnapshot} from '../src/data/tournamentSave';
const restore=(t:Tournament,carry=1)=>parseTournament(JSON.stringify(tournamentSnapshot(t,carry)));
describe('between-game tournament checkpoints',()=>{
 it('restores all three rounds, partial series and draw carry using canonical opponents',()=>{
  let t=new Tournament(OPPONENTS,()=>.4);
  for(let r=0;r<3;r++){
   t.recordPlayerGame(0);const loaded=restore(t,4)!;expect(loaded.carry).toBe(4);expect(loaded.t.series).toEqual([1,0]);expect(loaded.t.opponent).toBe(t.opponent);expect(loaded.t.history).toEqual(t.history);t=loaded.t;
   expect(t.recordPlayerGame(0)).toBe(r===2?'champion':'roundWon');
  }
  expect(restore(t)).toBe(null);
 });
 it('rejects finished, malformed, duplicate, unknown and inconsistent brackets',()=>{
  const t=new Tournament(OPPONENTS);t.recordPlayerGame(0);t.recordPlayerGame(0);const v=tournamentSnapshot(t,1);
  for(const patch of [{series:[2,0]},{carry:3},{alive:['ME','ME','ME','ME']},{alive:['ME','unknown','x','y']},{version:2},{history:[]},{history:[[{a:'ME',b:'ME',winner:'ME',score:[2,0]}]]}])expect(parseTournament(JSON.stringify({...v,...patch}))).toBe(null);
  for(const raw of [null,'bad','null','[]','{}'])expect(parseTournament(raw)).toBe(null);
  const lost=new Tournament(OPPONENTS);lost.recordPlayerGame(1);lost.recordPlayerGame(1);expect(restore(lost)).toBe(null);
 });
 it('does not mutate snapshot while a resumed hand is unfinished',()=>{const t=new Tournament(OPPONENTS);t.recordPlayerGame(1);const raw=JSON.stringify(tournamentSnapshot(t,8));const restored=parseTournament(raw)!;restored.t.recordPlayerGame(null);expect(JSON.stringify(tournamentSnapshot(restored.t,restored.carry))).toBe(raw);});
});

import {describe,it,expect} from 'vitest';import {AI} from '../src/engine/ai';import {MatgoGame} from '../src/engine/game';import {buildDeck} from '../src/engine/cards';
describe('공정한3단계AI',()=>{
 it('달인은 상대 손패와 더미 순서를 바꿔도 같은 공개 정보에서 같은 결정을 한다',()=>{
  const g=new MatgoGame(()=>.382),a=new AI(3,()=>.5);g.deal();const first=a.decide(g,0);
  [g.players[1].hand[0],g.deck[0]]=[g.deck[0],g.players[1].hand[0]];g.deck.reverse();
  expect(new AI(3,()=>.5).decide(g,0)).toEqual(first);
 });
 it('두 바닥패 중 실제로 하나만 얻는 선택을 평가한다',()=>{
  const d=buildDeck(),g=new MatgoGame();g.turn=0;g.players[0].hand=[d[2]];g.floor=[d[0],d[1]];g.deck=[d[4]];
  const a=new AI(2,()=>.5);expect(a.decide(g,0).chooseFloorId).toBe(d[0].id);
  g.play(0,d[2].id);expect(a.choose(g,0)).toBe(d[0].id);
 });
 it('손패가 없고 폭탄 빈패가 남았으면 빈패를 낸다',()=>{const g=new MatgoGame();g.players[0].bombPasses=1;expect(new AI(3).decide(g,0).cardId).toBe(-1);});
});

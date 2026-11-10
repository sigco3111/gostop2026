import {describe,it,expect} from 'vitest';import {MatgoGame} from '../src/engine/game';import {buildDeck,Card} from '../src/engine/cards';
const d=buildDeck(),m=(n:number)=>d.filter(c=>c.month===n);
function game(hand:Card[],floor:Card[],deck:Card[]){const g=new MatgoGame();g.players[0].hand=[...hand];g.floor=[...floor];g.deck=[...deck];return g;}
describe('특수룰 회귀',()=>{
 it('세 번째 뻑은7점 특별 승리, 이월은 적용',()=>{
  const a=m(1),g=game([a[0]],[a[1]],[a[2],m(2)[0]]);g.players[0].ppeoks=2;g.nagariCarry=4;
  const ev=g.play(0,a[0].id),end=ev.find(e=>e.type==='gameOver');expect(g.over).toBe(true);expect(end?.type==='gameOver'&&end.reason).toBe('3뻑');expect(end?.type==='gameOver'&&end.result?.finalScore).toBe(28);
 });
 it('같은 월 흔들기는 중복 배수가 되지 않고 잘못된 선언은 패를 쓰지 않는다',()=>{
  const a=m(1),g=game(a.slice(0,3),[],[m(2)[0],m(3)[0],m(4)[0]]);
  g.play(0,a[0].id,undefined,{shakeMonth:1});expect(g.players[0].shakes).toBe(1);g.turn=0;
  const before=JSON.stringify(g);expect(()=>g.play(0,a[1].id,undefined,{shakeMonth:1})).toThrow();expect(JSON.stringify(g)).toBe(before);
 });
 it('마지막 뒤집기 아닌 쪽은 피를 뺏는다',()=>{
  const a=m(1),g=game([a[0]],[m(3)[0]],[a[1],m(2)[0]]);g.players[1].captured=[m(4)[2]];
  const ev=g.play(0,a[0].id);expect(ev.some(e=>e.type==='captured'&&e.via==='jjok')).toBe(true);expect(ev.filter(e=>e.type==='stealPi')).toHaveLength(1);
 });
 it('마지막 뒤집기 쪽은 피를 뺏지 않는다',()=>{
  const a=m(1),g=game([a[0]],[m(3)[0]],[a[1]]);g.players[1].captured=[m(4)[2]];
  const ev=g.play(0,a[0].id);expect(ev.some(e=>e.type==='stealPi')).toBe(false);expect(g.over).toBe(true);
 });
 it('일반 뻑 회수는피1장, 일반피가 쌍피보다 우선',()=>{
  const a=m(1),g=game([a[0]],a.slice(1),[m(2)[0],m(3)[0]]);g.stacks=[{month:1,owner:1}];g.players[1].captured=[m(11)[3],m(5)[2]];
  const ev=g.play(0,a[0].id),steal=ev.filter(e=>e.type==='stealPi');expect(steal).toHaveLength(1);expect(steal[0].type==='stealPi'&&steal[0].card.id).toBe(m(5)[2].id);
 });
 it('판쓸기는 뒤집은 뒤 바닥이 빈 경우에만 피를 뺏는다',()=>{
  const a=m(1),b=m(2),g=game([a[0]],[a[1],b[0]],[b[1],m(3)[0]]);g.players[1].captured=[m(4)[2]];
  const ev=g.play(0,a[0].id);expect(g.floor).toHaveLength(0);expect(ev.some(e=>e.type==='sseul')).toBe(true);expect(ev.filter(e=>e.type==='stealPi')).toHaveLength(1);
 });
 it('7점 고/스톱 질문은 다음 행동을 막고 점수가 오르기 전에는 반복하지 않는다',()=>{
  const a=m(1),g=game([a[0]],[a[1]],[m(2)[0],m(3)[0],m(4)[0]]);g.players[0].captured=d.filter(c=>c.kind==='pi'&&c.piValue===1&&c.month>3).slice(0,16);
  g.play(0,a[0].id);expect(g.awaitingGoStop).toBe(true);expect(()=>g.play(0,a[0].id)).toThrow();g.answer(0,true);expect(g.players[0].goCount).toBe(1);expect(g.turn).toBe(1);expect(g.awaitingGoStop).toBe(false);
 });
 it('더미가 끝났는데 마지막 고를 선택하면 나가리다',()=>{
  const a=m(1),g=game([a[0]],[a[1]],[m(2)[0]]);g.players[0].captured=d.filter(c=>c.kind==='pi'&&c.piValue===1&&c.month>3).slice(0,16);
  g.play(0,a[0].id);expect(g.awaitingGoStop).toBe(true);const ev=g.answer(0,true);expect(g.over).toBe(true);expect(g.winner).toBe(null);expect(ev.some(e=>e.type==='nagari')).toBe(true);
 });
});

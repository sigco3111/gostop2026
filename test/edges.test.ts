import {describe,it,expect} from 'vitest';
import {buildDeck, Card} from '../src/engine/cards';
import {MatgoGame} from '../src/engine/game';
import {AI} from '../src/engine/ai';
import {readFileSync} from 'node:fs';
const deck=buildDeck();
const cs=(m:number)=>deck.filter(c=>c.month===m);
function fixture(h:Card[],floor:Card[],draw:Card[]){
 const g=new MatgoGame();g.players[0].hand=[...h];g.floor=[...floor];g.deck=[...draw];return g;
}
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
describe('phase integrity',()=>{
 it('pending play choice cannot be skipped or answered by wrong player',()=>{
  const a=cs(1),g=fixture([a[0],cs(2)[0]],[a[1],a[2]],[cs(3)[0]]);
  g.play(0,a[0].id);expect(g.awaitingChoice?.length).toBe(2);
  expect(()=>g.play(0,cs(2)[0].id)).toThrow();expect(()=>g.choose(1,a[1].id)).toThrow();
  expect(()=>g.choose(0,47)).toThrow();expect(g.awaitingChoice?.length).toBe(2);
  g.choose(0,a[1].id);expect(g.players[0].captured.map(c=>c.id)).toContain(a[1].id);
 });
 it('flipped card with 2 matches also asks the player, then advances once',()=>{
  const a=cs(1),b=cs(2),g=fixture([b[0]],[a[1],a[2]],[a[0],cs(3)[0]]);
  g.play(0,b[0].id);expect(g.awaitingChoice?.length).toBe(2);expect(g.turn).toBe(0);
  g.choose(0,a[2].id);expect(g.turn).toBe(1);expect(g.players[0].captured.map(c=>c.id)).toEqual([a[0].id,a[2].id]);
 });
 it('bad selection is atomic',()=>{
  const a=cs(1),g=fixture([a[0]],[a[1]],[cs(2)[0]]);const before=JSON.stringify(g);
  expect(()=>g.play(0,a[0].id,47)).toThrow();expect(JSON.stringify(g)).toBe(before);
 });
});
describe('special captures',()=>{
 it('ppeok leaves three cards; self recapture steals two ordinary pi',()=>{
  const a=cs(1),b=cs(2),g=fixture([a[0],a[3]],[a[1]],[a[2],b[0],b[1]]);
  g.players[1].captured=deck.filter(c=>c.kind==='pi'&&c.month>3).slice(0,3);
  g.play(0,a[0].id);expect(g.floor.filter(c=>c.month===1)).toHaveLength(3);expect(g.players[0].ppeoks).toBe(1);
  g.turn=0;const ev=g.play(0,a[3].id);expect(ev.filter(e=>e.type==='stealPi')).toHaveLength(2);expect(g.turn).toBe(1);
 });
 it('ttadak takes all four, steal suppressed on final draw',()=>{
  const a=cs(1),g=fixture([a[0]],[a[1],a[2]],[a[3]]);g.players[1].captured=[cs(2)[2]];
  const ev=g.play(0,a[0].id,a[1].id);expect(g.players[0].captured).toHaveLength(4);expect(ev.some(e=>e.type==='stealPi')).toBe(false);expect(g.over).toBe(true);
 });
 it('bomb consumes three cards, adds two empty turns, flips only once',()=>{
  const a=cs(1),g=fixture(a.slice(0,3),[a[3]],[cs(2)[0],cs(3)[0],cs(4)[0]]);
  const ev=g.play(0,-1,undefined,{bombMonth:1});expect(g.players[0].bombPasses).toBe(2);expect(g.deck.length).toBe(2);
  expect(g.turn).toBe(1);expect(ev.filter(e=>e.type==='goStopPrompt')).toHaveLength(0);
  g.turn=0;g.play(0,-1);expect(g.players[0].bombPasses).toBe(1);expect(g.deck.length).toBe(1);
 });
 it('reusing a game resets over and pending state',()=>{
  const g=new MatgoGame(rng(12));g.deal();g.over=true;g.winner=1;const ev=g.deal();expect(g.over).toBe(ev.some(e=>e.type==='gameOver'));if(!g.over)expect(g.winner).toBe(null);expect(g.awaitingChoice).toBe(null);
 });
});
describe('48 card artwork data',()=>{
 it('manifest IDs, months and grades agree with engine',()=>{
  const manifest=JSON.parse(readFileSync('public/assets/cards/deck-manifest.json','utf8'));
  const kindLabel={gwang:'광',yeol:'열끗',tti:'띠',pi:'피'};
  expect(manifest.length).toBe(48);
  for(const c of deck){const a=manifest[c.id];expect(a.id).toBe(c.id);expect(a.month).toBe(c.month);expect(a.type).toBe(c.piValue===2?'쌍피':c.isBi?'비광':c.dan==='hong'?'홍단':c.dan==='cheong'?'청단':c.dan==='cho'?'초단':kindLabel[c.kind]);}
 });
});
describe('seeded complete-game stress',()=>{
 it('1000 rounds finish without dropped or duplicated cards and no skipped pending phase',()=>{
  for(let seed=1;seed<=1000;seed++){
   const rnd=rng(seed),g=new MatgoGame(rnd),ai=new AI(3,rnd);g.deal();let steps=0;
   while(!g.over&&steps++<150){
    const p=g.turn;
    if(g.awaitingGoStop)g.answer(p,rnd()<.4);
    else if(g.awaitingChoice)g.choose(p,g.awaitingChoice[0].id);
    else {const dec=ai.decide(g,p);g.play(p,dec.cardId,dec.chooseFloorId,dec.bombMonth!==undefined?{bombMonth:dec.bombMonth}:dec.shakeMonth!==undefined?{shakeMonth:dec.shakeMonth}:undefined);}
   }
   expect(g.over,`seed ${seed} stuck`).toBe(true);
   const all=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])];
   expect(all.length,`seed ${seed} card count`).toBe(48);expect(new Set(all.map(c=>c.id)).size).toBe(48);
  }
 });
});

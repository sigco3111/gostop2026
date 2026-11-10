import {it,expect} from 'vitest';
import {AI} from '../src/engine/ai';
import {MatgoGame} from '../src/engine/game';
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function hidePermutation(g:MatgoGame,p:number){const hand=g.players[1-p].hand,hidden=[...hand,...g.deck].reverse();g.players[1-p].hand=hidden.slice(0,hand.length);g.deck=hidden.slice(hand.length);}
it('all policy decisions ignore hidden card identities and deck order at every phase',()=>{
 let comparisons=0,choices=0,prompts=0,plays=0;
 for(let seed=1;seed<=150;seed++){
  const r=rng(seed),g=new MatgoGame(r);g.deal();let step=0;
  while(!g.over&&step++<150){
   const p=g.turn,decisions=[];
   for(const level of [1,2,3] as const){
    const a=new AI(level,rng(seed*17+step)),b=new AI(level,rng(seed*17+step));
    const decide=(ai:AI)=>g.awaitingChoice?ai.choose(g,p):g.awaitingGoStop?ai.decideGoStop(g,p):ai.decide(g,p);
    const first=decide(a),before=JSON.stringify(g);const hand=g.players[1-p].hand,deck=g.deck;hidePermutation(g,p);const second=decide(b);g.players[1-p].hand=hand;g.deck=deck;
    expect(second).toEqual(first);expect(JSON.stringify(g)).toBe(before);decisions.push(first);comparisons++;
   }
   if(g.awaitingChoice){choices++;g.choose(p,decisions[seed%3] as number);}
   else if(g.awaitingGoStop){prompts++;g.answer(p,decisions[seed%3] as boolean);}
   else{plays++;const d=decisions[seed%3] as ReturnType<AI['decide']>;g.play(p,d.cardId,d.chooseFloorId,d.bombMonth!==undefined?{bombMonth:d.bombMonth}:d.shakeMonth!==undefined?{shakeMonth:d.shakeMonth}:undefined);}
  }
  expect(g.over).toBe(true);
 }
 expect(comparisons).toBeGreaterThan(6000);expect(choices).toBeGreaterThan(40);expect(prompts).toBeGreaterThan(80);expect(plays).toBeGreaterThan(1500);
});

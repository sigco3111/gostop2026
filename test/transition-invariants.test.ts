import {describe,it,expect} from 'vitest';
import {MatgoGame} from '../src/engine/game';
import {AI} from '../src/engine/ai';
import {buildDeck,Card} from '../src/engine/cards';
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const canonical=buildDeck();
/** Pending selections hold a real card outside the public piles until answered. */
function audit(g:MatgoGame,context:string){
 const pending=JSON.parse(JSON.stringify(g)).pending as {phase:'play'|'flip';card:Card;options:Card[]}|null;
 const all=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured]),...(pending?[pending.card]:[])];
 const fail=(message:string)=>{throw Error(`${context}: ${message}`);};
 if(all.length!==48||new Set(all.map(c=>c.id)).size!==48)fail('48-card conservation');
 for(const c of all)if(JSON.stringify(c)!==JSON.stringify(canonical[c.id]))fail(`card ${c.id} changed`);
 if(g.awaitingGoStop&&pending)fail('overlapping prompts');
 if(g.over&&(pending||g.awaitingGoStop))fail('terminal pending action');
 if(g.turn!==0&&g.turn!==1)fail('invalid actor');
 const turns=g.players.reduce((n,p)=>n+p.hand.length+p.bombPasses,0);
 if(turns!==g.deck.length-(pending?.phase==='play'?1:0))fail('turn accounting');
 for(const st of g.stacks)if(g.floor.filter(c=>c.month===st.month).length!==3)fail('invalid three-card pile');
 if(new Set(g.stacks.map(s=>s.month)).size!==g.stacks.length)fail('duplicate pile');
 if(pending&&(![2].includes(pending.options.length)||pending.options.some(c=>c.month!==pending.card.month||!g.floor.some(f=>f.id===c.id))))fail('invalid selection');
 for(let p=0;p<2;p++){
  const s=g.scoreOf(p);if(!Number.isFinite(s.total)||s.total<0)fail('invalid score');
  if(g.players[p].bombPasses<0||!Number.isInteger(g.players[p].bombPasses))fail('invalid bomb passes');
 }
}
describe('every-transition state invariants',()=>{
 it('3000 mixed-level seeded rounds preserve all cards, prompts, piles and turn accounting',()=>{
  const coverage=new Set<string>();let transitions=0;
  for(let seed=1;seed<=3000;seed++){
   const r=rng(seed),g=new MatgoGame(r),ai=[new AI((seed%3+1) as 1|2|3,r),new AI(((seed+1)%3+1) as 1|2|3,r)];
   g.deal().forEach(e=>coverage.add(e.type));audit(g,`seed${seed} deal`);let step=0;
   while(!g.over&&step++<150){
    const p=g.turn,before=JSON.stringify(g);
    // Wrong-player and invalid input must not partially consume a pending card or deck.
    const illegal=()=>g.awaitingGoStop?g.answer(1-p,false):g.awaitingChoice?g.choose(1-p,g.awaitingChoice[0].id):g.play(1-p,g.players[p].hand[0]?.id??-1);
    expect(illegal).toThrow();expect(JSON.stringify(g)).toBe(before);
    const bad=()=>g.awaitingChoice?g.choose(p,999):g.awaitingGoStop?g.play(p,999):g.play(p,999);
    expect(bad).toThrow();expect(JSON.stringify(g)).toBe(before);
    let events;
    if(g.awaitingGoStop)events=g.answer(p,ai[p].decideGoStop(g,p));
    else if(g.awaitingChoice)events=g.choose(p,ai[p].choose(g,p));
    else{const d=ai[p].decide(g,p);events=g.play(p,d.cardId,undefined,d.bombMonth!==undefined?{bombMonth:d.bombMonth}:d.shakeMonth!==undefined?{shakeMonth:d.shakeMonth}:undefined);}
    events.forEach(e=>coverage.add(e.type));audit(g,`seed${seed} step${step}`);transitions++;
   }
   expect(g.over,`seed${seed} stalled`).toBe(true);
   const final=JSON.stringify(g);expect(()=>g.play(g.turn,0)).toThrow();expect(()=>g.answer(g.turn,false)).toThrow();expect(JSON.stringify(g)).toBe(final);
  }
  for(const type of ['needChoice','goStopPrompt','go','stop','ppeok','shake','sseul','stealPi','nagari','chongtong'])expect(coverage.has(type),type).toBe(true);
  expect(transitions).toBeGreaterThan(50000);
 },120000);
});

import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {MatgoGame,GameEvent} from '../src/engine/game';
import {AI} from '../src/engine/ai';
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
it('measures seeded AI matchups with paired seats, without human-difficulty claims',()=>{
 const result=[];
 for(const [low,high] of [[1,2],[1,3],[2,3]] as const){
  const count={low,high,rounds:0,lowWins:0,highWins:0,draws:0,seat0Wins:0,seat1Wins:0,stalled:0,totalActions:0,highPoints:0,lowPoints:0};
  for(let seed=1;seed<=1000;seed++)for(const highSeat of [0,1]){
   const g=new MatgoGame(rng(seed));const levels=highSeat===0?[high,low]:[low,high];const a=levels.map((level,p)=>new AI(level as 1|2|3,rng(seed*101+levels[p]*19)));
   let events:GameEvent[]=g.deal(),actions=0;let final=events.find(e=>e.type==='gameOver') as Extract<GameEvent,{type:'gameOver'}>|undefined;
   while(!g.over&&actions++<150){const p=g.turn;if(g.awaitingChoice)events=g.choose(p,a[p].choose(g,p));else if(g.awaitingGoStop)events=g.answer(p,a[p].decideGoStop(g,p));else{const d=a[p].decide(g,p);events=g.play(p,d.cardId,d.chooseFloorId,d.bombMonth!==undefined?{bombMonth:d.bombMonth}:d.shakeMonth!==undefined?{shakeMonth:d.shakeMonth}:undefined);}final=events.find(e=>e.type==='gameOver') as typeof final??final;}
   count.rounds++;count.totalActions+=actions;if(!g.over)count.stalled++;else if(g.winner===null)count.draws++;else{g.winner===0?count.seat0Wins++:count.seat1Wins++;if(g.winner===highSeat){count.highWins++;count.highPoints+=final?.result?.finalScore??0;}else{count.lowWins++;count.lowPoints+=final?.result?.finalScore??0;}}
  }
  expect(count.stalled).toBe(0);expect(count.highWins+count.lowWins+count.draws).toBe(count.rounds);result.push(count);
 }
 mkdirSync('/downloads/ai-matchups',{recursive:true});writeFileSync('/downloads/ai-matchups/report.json',JSON.stringify({method:'1000 seeded deals per pair, both seat assignments; independent seeded policy randomness; heuristic bot versus bot, not human testing',result},null,2));console.log(JSON.stringify(result));
},120000);

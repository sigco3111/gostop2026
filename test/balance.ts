// Reproducible automated AI comparison, not a human difficulty measurement.
import {AI} from '../src/engine/ai';import{MatgoGame}from'../src/engine/game';
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const report=[];
for(const[a,b]of [[1,2],[1,3],[2,3]] as const){const count={a:0,b:0,draw:0,steps:0,special:0};
for(let seed=1;seed<=2000;seed++){const g=new MatgoGame(rng(seed)),ais=[new AI(seed%2?a:b,rng(seed*17+1)),new AI(seed%2?b:a,rng(seed*17+2))];g.deal();if(g.over)count.special++;let steps=0;
while(!g.over&&steps++<150){const p=g.turn,ai=ais[p];if(g.awaitingGoStop)g.answer(p,ai.decideGoStop(g,p));else if(g.awaitingChoice)g.choose(p,ai.choose(g,p));else{const d=ai.decide(g,p);g.play(p,d.cardId,d.chooseFloorId,d.bombMonth!==undefined?{bombMonth:d.bombMonth}:d.shakeMonth!==undefined?{shakeMonth:d.shakeMonth}:undefined);}}
if(!g.over)throw new Error(`seed${seed} stuck`);count.steps+=steps;if(g.winner===null)count.draw++;else if((seed%2?g.winner===0:g.winner===1))count.a++;else count.b++;
}report.push({levels:[a,b],rounds:2000,...count});}
console.log(JSON.stringify(report,null,2));

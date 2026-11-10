import {Opponent} from '../data/opponents';
import {shuffle} from './cards';
export type Entrant=Opponent|'ME';
export interface PairResult {a:Entrant;b:Entrant;winner:Entrant;score:[number,number];}
/** Eight entrants, three rounds, best of three per pairing. No hidden player match simulation. */
export class Tournament {
 alive:Entrant[];
 history:PairResult[][]=[];
 series:[number,number]=[0,0];
 eliminated=false;
 champion:Entrant|null=null;
 private rnd:()=>number;
 constructor(pool:Opponent[],rnd:()=>number=Math.random){if(pool.length<7)throw new Error('requires 7 opponents');this.rnd=rnd;this.alive=['ME',...shuffle(pool,rnd).slice(0,7)];}
 get round(){return this.history.length;}
 get opponent():Opponent|null{if(this.champion||this.eliminated)return null;const i=this.alive.indexOf('ME');if(i<0)return null;return this.alive[i%2===0?i+1:i-1] as Opponent;}
 recordPlayerGame(winner:0|1|null):'continue'|'roundWon'|'eliminated'|'champion'{
  if(this.eliminated||this.champion)throw new Error('tournament is over');
  if(winner===null)return 'continue';
  this.series[winner]++;
  if(Math.max(...this.series)<2)return 'continue';
  const results:PairResult[]=[];
  for(let i=0;i<this.alive.length;i+=2){
   const a=this.alive[i],b=this.alive[i+1];
   if(a==='ME'||b==='ME'){
    const meWon=this.series[0]===2;
    results.push({a,b,winner:meWon?'ME':a==='ME'?b:a,score:a==='ME'?[...this.series]:[this.series[1],this.series[0]]});
   }else{
    let aw=0,bw=0;
    const prob=.5+(a.difficulty-b.difficulty)*.12;
    while(aw<2&&bw<2){if(this.rnd()<prob)aw++;else bw++;}
    results.push({a,b,winner:aw===2?a:b,score:[aw,bw]});
   }
  }
  this.history.push(results);this.alive=results.map(r=>r.winner);this.series=[0,0];
  if(!this.alive.includes('ME')){this.eliminated=true;return 'eliminated';}
  if(this.alive.length===1){this.champion=this.alive[0];return 'champion';}
  return 'roundWon';
 }
}

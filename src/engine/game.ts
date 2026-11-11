// 맞고 게임 상태 머신. UI/AI와 분리된 순수 로직.
import { Card, buildDeck, shuffle } from './cards';
import { score, settle, SettleResult, ScoreBreakdown } from './scoring';

export type GameEvent =
  | { type: 'dealt' }
  | { type: 'chongtong'; player: number }                       // 총통 즉시 승리
  | { type: 'played'; player: number; card: Card }
  | { type: 'flipped'; player: number; card: Card }              // 공개된 더미패, 상태 변경 없는 연출 이벤트
  | { type: 'captured'; player: number; cards: Card[]; via: 'play' | 'flip' | 'stack' | 'jjok' | 'ttadak' | 'bomb' }
  | { type: 'placed'; player: number; card: Card }              // 바닥에 내려놓음
  | { type: 'ppeok'; player: number; month: number }            // 뻑(쌌다)
  | { type: 'threePpeok'; player: number }                      // 3뻑 승리
  | { type: 'stealPi'; from: number; to: number; card: Card }
  | { type: 'sseul'; player: number }                           // 판 쓸기
  | { type: 'shake'; player: number; month: number }            // 흔들기/폭탄 선언
  | { type: 'needChoice'; options: Card[] }                     // 바닥 2장 중 선택 필요
  | { type: 'goStopPrompt'; player: number; score: number }
  | { type: 'go'; player: number; count: number }
  | { type: 'stop'; player: number }
  | { type: 'nagari' }
  | { type: 'gameOver'; winner: number | null; result?: SettleResult; reason: string };

export interface PlayerState {
  hand: Card[];
  captured: Card[];
  goCount: number;
  lastScoreMilestone: number;  // 마지막으로 고/스톱을 제안받은 점수
  shakes: number;
  ppeoks: number;
  bombPasses: number;
  shakenMonths: number[];
}

export interface StackInfo { month: number; owner: number }    // 뻑으로 쌓인 더미

// All state transitions are synchronous and validate actor/phase before changing cards.
export class MatgoGame {
 deck:Card[]=[];
 floor:Card[]=[];
 players:[PlayerState,PlayerState];
 turn=0; over=false; winner:number|null=null; nagariCarry=1;
 stacks:StackInfo[]=[];
 private pending:{phase:'play'|'flip';card:Card;options:Card[]}|null=null;
 private prompt=false;
 private acted=false;
 private rnd:()=>number;
 constructor(rnd:()=>number=Math.random){this.rnd=rnd;this.players=[this.newPlayer(),this.newPlayer()];}
 private newPlayer():PlayerState{return {hand:[],captured:[],goCount:0,lastScoreMilestone:0,shakes:0,ppeoks:0,bombPasses:0,shakenMonths:[]};}
 deal():GameEvent[]{
  // A four-of-a-month floor is an invalid initial board, not a live four-card pile.
  for(let attempt=0;attempt<100;attempt++){
   const d=shuffle(buildDeck(),this.rnd);
   this.players=[this.newPlayer(),this.newPlayer()];
   this.floor=d.splice(0,8);this.players[0].hand=d.splice(0,10);this.players[1].hand=d.splice(0,10);this.deck=d;
   const four=(cs:Card[])=>Array.from({length:12},(_,i)=>i+1).some(m=>cs.filter(c=>c.month===m).length===4);
   if(four(this.floor))continue;
   const winners=[0,1].filter(p=>four(this.players[p].hand));
   if(winners.length===2)continue;
   this.over=false;this.winner=null;this.turn=0;this.pending=null;this.prompt=false;this.acted=false;this.stacks=[];
   for(let m=1;m<=12;m++)if(this.floor.filter(c=>c.month===m).length===3)this.stacks.push({month:m,owner:-1});
   const ev:GameEvent[]=[{type:'dealt'}];
   if(winners.length){ev.push({type:'chongtong',player:winners[0]});this.specialWin(winners[0],'총통',ev);}
   return ev;
  }
  throw new Error('could not deal a legal board');
 }
 scoreOf(p:number):ScoreBreakdown{return score(this.players[p].captured);}
 get awaitingChoice():Card[]|null{return this.pending?.options??null;}
 get awaitingGoStop(){return this.prompt;}
 private assertActor(p:number){if(p!==0&&p!==1)throw new Error('invalid player');if(this.over||p!==this.turn)throw new Error('not your turn');}
 canShake(p:number):number[]{return Array.from({length:12},(_,i)=>i+1).filter(m=>this.players[p].hand.filter(c=>c.month===m).length===3);}
 canBomb(p:number){return this.canShake(p).filter(m=>this.floor.filter(c=>c.month===m).length===1);}
 canShakeOnly(p:number){return this.canShake(p).filter(m=>!this.floor.some(c=>c.month===m)&&!this.players[p].shakenMonths.includes(m));}
 private markShake(p:number,m:number,ev:GameEvent[]){const ps=this.players[p];if(!ps.shakenMonths.includes(m)){ps.shakenMonths.push(m);ps.shakes++;}ev.push({type:'shake',player:p,month:m});}
 play(p:number,cardId:number,chooseFloorId?:number,opts?:{shakeMonth?:number;bombMonth?:number}):GameEvent[]{
  this.assertActor(p);if(this.pending||this.prompt)throw new Error('pending choice must be answered');
  const ps=this.players[p],ev:GameEvent[]=[];
  if(opts?.bombMonth!==undefined){
   const m=opts.bombMonth;if(!this.canBomb(p).includes(m))throw new Error('cannot bomb');
   const won=[...ps.hand.filter(c=>c.month===m),...this.floor.filter(c=>c.month===m)];
   ps.hand=ps.hand.filter(c=>c.month!==m);this.floor=this.floor.filter(c=>c.month!==m);ps.bombPasses+=2;
   this.markShake(p,m,ev);this.capture(p,won,'bomb',ev);this.stealPi(1-p,p,ev);
   this.flip(p,null,ev);return ev;
  }
  if(cardId===-1){
   if(!ps.bombPasses)throw new Error('no bomb pass');ps.bombPasses--;this.flip(p,null,ev);return ev;
  }
  const idx=ps.hand.findIndex(c=>c.id===cardId);if(idx<0)throw new Error('card not in hand');
  const card=ps.hand[idx],matches=this.floor.filter(c=>c.month===card.month);
  if(chooseFloorId!==undefined&&!matches.some(c=>c.id===chooseFloorId))throw new Error('invalid floor selection');
  if(opts?.shakeMonth!==undefined){if(!this.canShakeOnly(p).includes(opts.shakeMonth))throw new Error('cannot shake');this.markShake(p,opts.shakeMonth,ev);}
  ps.hand.splice(idx,1);ev.push({type:'played',player:p,card});
  if(matches.length===2&&chooseFloorId===undefined){this.pending={phase:'play',card,options:matches};ev.push({type:'needChoice',options:matches});return ev;}
  this.resolvePlay(p,card,chooseFloorId,ev);return ev;
 }
 choose(p:number,id:number):GameEvent[]{
  this.assertActor(p);const pc=this.pending;if(!pc||!pc.options.some(c=>c.id===id))throw new Error('invalid pending choice');
  this.pending=null;const ev:GameEvent[]=[];
  if(pc.phase==='play')this.resolvePlay(p,pc.card,id,ev);
  else{const chosen=pc.options.find(c=>c.id===id)!;this.floor=this.floor.filter(c=>c.id!==id);this.capture(p,[pc.card,chosen],'flip',ev);this.afterTurn(p,ev);}
  return ev;
 }
 private capture(p:number,cards:Card[],via:'play'|'flip'|'stack'|'jjok'|'ttadak'|'bomb',ev:GameEvent[]){this.players[p].captured.push(...cards);this.acted=true;ev.push({type:'captured',player:p,cards,via});}
 private takeStack(p:number,month:number,ev:GameEvent[]){const st=this.stacks.find(s=>s.month===month);this.stacks=this.stacks.filter(s=>s.month!==month);this.stealPi(1-p,p,ev,st?.owner===p?2:1);}
 private resolvePlay(p:number,card:Card,choice:number|undefined,ev:GameEvent[]){
  const matches=this.floor.filter(c=>c.month===card.month);
  if(matches.length===0){this.floor.push(card);ev.push({type:'placed',player:p,card});this.flip(p,{card,original:0,pair:[]},ev);}
  else if(matches.length===3){this.floor=this.floor.filter(c=>c.month!==card.month);this.capture(p,[card,...matches],'stack',ev);this.takeStack(p,card.month,ev);this.flip(p,null,ev);}
  else{
   const chosen=matches.find(c=>c.id===choice)??matches[0];this.floor=this.floor.filter(c=>c.id!==chosen.id);
   this.flip(p,{card,original:matches.length,pair:[card,chosen]},ev);
  }
 }
 private flip(p:number,info:{card:Card;original:number;pair:Card[]}|null,ev:GameEvent[]){
  const flip=this.deck.shift();
  if(!flip){if(info?.pair.length)this.capture(p,info.pair,'play',ev);this.afterTurn(p,ev);return;}
  ev.push({type:'flipped',player:p,card:flip});
  if(info&&flip.month===info.card.month){
   if(info.original===0){this.floor=this.floor.filter(c=>c.id!==info.card.id);this.capture(p,[info.card,flip],'jjok',ev);if(this.deck.length)this.stealPi(1-p,p,ev);}
   else if(info.original===1){this.floor.push(...info.pair,flip);this.stacks.push({month:flip.month,owner:p});this.players[p].ppeoks++;ev.push({type:'ppeok',player:p,month:flip.month});if(this.players[p].ppeoks===3){ev.push({type:'threePpeok',player:p});this.specialWin(p,'3뻑',ev);return;}}
   else{const rem=this.floor.filter(c=>c.month===flip.month);this.floor=this.floor.filter(c=>c.month!==flip.month);this.capture(p,[...info.pair,...rem,flip],'ttadak',ev);if(this.deck.length)this.stealPi(1-p,p,ev);}
   this.afterTurn(p,ev);return;
  }
  if(info?.pair.length)this.capture(p,info.pair,'play',ev);
  const matches=this.floor.filter(c=>c.month===flip.month);
  if(!matches.length){this.floor.push(flip);ev.push({type:'placed',player:p,card:flip});}
  else if(matches.length===3){this.floor=this.floor.filter(c=>c.month!==flip.month);this.capture(p,[flip,...matches],'stack',ev);this.takeStack(p,flip.month,ev);}
  else if(matches.length===2){this.pending={phase:'flip',card:flip,options:matches};ev.push({type:'needChoice',options:matches});return;}
  else{this.floor=this.floor.filter(c=>c.id!==matches[0].id);this.capture(p,[flip,matches[0]],'flip',ev);}
  this.afterTurn(p,ev);
 }
 private stealPi(from:number,to:number,ev:GameEvent[],count=1){
  const f=this.players[from];
  for(let i=0;i<count;i++){
   // A captured gukjin is not silently stolen as pi when scoring it as yeol.
   const ordinary=f.captured.findIndex(c=>c.kind==='pi'&&c.piValue===1);
   const anyPi=f.captured.findIndex(c=>c.kind==='pi');const use=ordinary>=0?ordinary:anyPi;
   if(use<0)return;const [card]=f.captured.splice(use,1);this.players[to].captured.push(card);ev.push({type:'stealPi',from,to,card});
  }
 }
 private afterTurn(p:number,ev:GameEvent[]){
  if(this.over)return;
  const ps=this.players[p];
  if(this.floor.length===0&&this.acted&&this.deck.length){ev.push({type:'sseul',player:p});this.stealPi(1-p,p,ev);}
  this.acted=false;
  const s=this.scoreOf(p).total;
  if(s>=7&&s>ps.lastScoreMilestone){ps.lastScoreMilestone=s;this.prompt=true;ev.push({type:'goStopPrompt',player:p,score:s});return;}
  if(this.deck.length===0){this.drawGame(ev);return;}
  this.turn=1-p;
 }
 private drawGame(ev:GameEvent[]){this.over=true;this.winner=null;ev.push({type:'nagari'},{type:'gameOver',winner:null,reason:'나가리'});}
 private specialWin(p:number,reason:string,ev:GameEvent[]){this.over=true;this.winner=p;ev.push({type:'gameOver',winner:p,reason,result:{base:7,finalScore:7*this.nagariCarry,multipliers:this.nagariCarry>1?[`나가리 이월 ×${this.nagariCarry}`]:[]}});}
 answer(p:number,go:boolean):GameEvent[]{
  this.assertActor(p);if(!this.prompt)throw new Error('no pending go/stop');this.prompt=false;
  const ps=this.players[p],ev:GameEvent[]=[];
  if(go){ps.goCount++;ev.push({type:'go',player:p,count:ps.goCount});if(!this.deck.length)this.drawGame(ev);else this.turn=1-p;}
  else{this.over=true;this.winner=p;ev.push({type:'stop',player:p},{type:'gameOver',winner:p,reason:'스톱',result:settle({winner:ps.captured,loser:this.players[1-p].captured,goCount:ps.goCount,loserGoCount:this.players[1-p].goCount,shakes:ps.shakes,nagariCarry:this.nagariCarry})});}
  return ev;
 }
}

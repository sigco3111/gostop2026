// AI 3단계: 입문 / 숙련 / 달인
import { Card } from './cards';
import { MatgoGame } from './game';
import { score } from './scoring';

export interface AIDecision {
  cardId: number;
  chooseFloorId?: number;
  shakeMonth?: number;
  bombMonth?: number;
}

function cardValue(c: Card): number {
  let v = 0;
  if (c.kind === 'gwang') v += 10;
  if (c.isGodori) v += 6;
  if (c.kind === 'yeol') v += 3;
  if (c.dan) v += 3.5;
  if (c.kind === 'tti') v += 1.5;
  if (c.kind === 'pi') v += c.piValue;
  if (c.isGukjin) v += 3;
  return v;
}

export class AI {
  constructor(public level: 1 | 2 | 3, private rnd: () => number = Math.random) {}

  decide(g: MatgoGame, p: number): AIDecision {
    const ps = g.players[p];
    if (!ps.hand.length) return { cardId: -1 };
    // 폭탄 사용: 숙련 이상
    if (this.level >= 2) {
      const bombs = g.canBomb(p);
      if (bombs.length && (this.level === 3 || this.rnd() < 0.8)) {
        return { cardId: -1, bombMonth: bombs[0] };
      }
    }
    // 흔들기: 달인은 상황 봐서, 숙련은 확률적
    let shakeMonth: number | undefined;
    const shakes = g.canShakeOnly(p);
    if (shakes.length) {
      if (this.level === 3 && this.rnd() < 0.9) shakeMonth = shakes[0];
      else if (this.level === 2 && this.rnd() < 0.5) shakeMonth = shakes[0];
    }

    let best: Card | null = null;
    let bestScore = -Infinity;
    for (const c of ps.hand) {
      const s = this.evalPlay(g, p, c);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    const dec: AIDecision = { cardId: best!.id, shakeMonth };
    const matches = g.floor.filter((f) => f.month === best!.month);
    if (matches.length === 2) {
      dec.chooseFloorId = this.bestCapture(g,p,matches,best!).id;
    }
    return dec;
  }

  // Choice uses only own captured cards and visible floor cards.
  choose(g:MatgoGame,p:number):number {
    const choices=g.awaitingChoice;if(!choices?.length)throw new Error('no choice');
    return this.bestCapture(g,p,choices).id;
  }

  private bestCapture(g:MatgoGame,p:number,options:Card[],played?:Card):Card {
    if(this.level===1)return options[Math.floor(this.rnd()*options.length)];
    const captured=g.players[p].captured;
    return options.slice().sort((a,b)=>{
      const value=(c:Card)=>score([...captured,...(played?[played]:[]),c]).total*5+cardValue(c);
      return value(b)-value(a);
    })[0];
  }

  private evalPlay(g: MatgoGame, p: number, c: Card): number {
    if (this.level === 1) return this.rnd() * 2 + (g.floor.some((f) => f.month === c.month) ? 1 : 0);
    const matches = g.floor.filter((f) => f.month === c.month);
    const captured=g.players[p].captured;
    // Unknown cards are counted from visible information only. Never inspect deck order or opponent hand identities.
    const known=[...g.floor,...g.players[p].hand,...captured,...g.players[1-p].captured];
    const unseen=48-known.length;
    const unseenMonth=4-known.filter(k=>k.month===c.month).length;
    let value=this.rnd()*.3;
    if(matches.length){
      const take=matches.length===2?[this.bestCapture(g,p,matches,c)]:matches;
      value+=5+take.reduce((s,k)=>s+cardValue(k),0);
      const gain=score([...captured,c,...take]).total-score(captured).total;
      value+=gain*4;
      if(this.level===3&&matches.length===1&&unseen>0)value-=unseenMonth/unseen*14; // 뻑 위험
    }else{
      value-=cardValue(c)*.5;
      if(this.level===3&&unseen>0){
        const handSize=g.players[1-p].hand.length;
        let miss=1;
        for(let i=0;i<handSize&&i<unseen;i++)miss*=Math.max(0,(unseen-unseenMonth-i)/(unseen-i));
        value-=(1-miss)*(cardValue(c)+3);
        // Keep a pair in our own hand when no floor match is available.
        if(g.players[p].hand.some(k=>k.id!==c.id&&k.month===c.month))value-=1;
      }
    }
    return value;
  }

  decideGoStop(g: MatgoGame, p: number): boolean {
    const my = g.scoreOf(p).total;
    const opp = g.scoreOf(1 - p).total;
    const turnsLeft = g.players[0].hand.length + g.players[1].hand.length;
    if (this.level === 1) return this.rnd() < 0.45; // 무리한 고를 섞음
    if (this.level === 2) {
      if (my >= 10) return this.rnd() < 0.2;
      if (opp >= 5) return this.rnd() < 0.15;
      return this.rnd() < 0.55;
    }
    // 달인: 기대값 + 허세
    const goCount = g.players[p].goCount;
    let goProb = 0.5;
    if (my >= 12) goProb -= 0.35;
    if (opp >= 6) goProb -= 0.3;
    if (turnsLeft <= 4) goProb -= 0.3;
    if (goCount >= 2) goProb += 0.15;
    if (this.rnd() < 0.1) goProb += 0.3; // 허세성 고
    return this.rnd() < Math.max(0.05, Math.min(0.95, goProb));
  }
}

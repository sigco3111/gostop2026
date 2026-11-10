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
      dec.chooseFloorId = (this.level === 1
        ? matches[Math.floor(this.rnd() * 2)]
        : matches.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]).id;
    }
    return dec;
  }

  private evalPlay(g: MatgoGame, p: number, c: Card): number {
    if (this.level === 1) return this.rnd() * 2 + (g.floor.some((f) => f.month === c.month) ? 1 : 0);
    const matches = g.floor.filter((f) => f.month === c.month);
    let s = this.rnd() * 0.3;
    if (matches.length > 0) {
      s += 5 + Math.max(...matches.map(cardValue));
      // 족보 완성 가치
      const after = [...g.players[p].captured, c, ...matches];
      const before = score(g.players[p].captured).total;
      const gain = score(after).total - before;
      s += gain * 4;
    } else {
      // 내버리는 패: 위험도 평가 (달인)
      s -= cardValue(c) * 0.5;
      if (this.level === 3) {
        // 바닥에 같은 월 2장이 되면 상대에게 따닥 위험
        const sameOnFloor = g.floor.filter((f) => f.month === c.month).length;
        if (sameOnFloor === 1) s -= 1.5;
      }
    }
    return s;
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

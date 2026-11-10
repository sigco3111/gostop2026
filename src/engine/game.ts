// 맞고 게임 상태 머신. UI/AI와 분리된 순수 로직.
import { Card, buildDeck, shuffle } from './cards';
import { score, settle, SettleResult, ScoreBreakdown } from './scoring';

export type GameEvent =
  | { type: 'dealt' }
  | { type: 'chongtong'; player: number }                       // 총통 즉시 승리
  | { type: 'played'; player: number; card: Card }
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
}

export interface StackInfo { month: number; owner: number }    // 뻑으로 쌓인 더미

export class MatgoGame {
  deck: Card[] = [];
  floor: Card[] = [];
  players: [PlayerState, PlayerState];
  turn = 0;
  over = false;
  nagariCarry = 1;
  winner: number | null = null;
  stacks: StackInfo[] = [];
  private pendingChoice: { played: Card; options: Card[] } | null = null;
  private rnd: () => number;

  constructor(rnd: () => number = Math.random) {
    this.rnd = rnd;
    this.players = [this.newPlayer(), this.newPlayer()];
  }
  private newPlayer(): PlayerState {
    return { hand: [], captured: [], goCount: 0, lastScoreMilestone: 0, shakes: 0, ppeoks: 0 };
  }

  deal(): GameEvent[] {
    const d = shuffle(buildDeck(), this.rnd);
    this.players = [this.newPlayer(), this.newPlayer()];
    this.floor = d.splice(0, 8);
    this.players[0].hand = d.splice(0, 10);
    this.players[1].hand = d.splice(0, 10);
    this.deck = d;
    this.turn = 0;
    this.stacks = [];
    const ev: GameEvent[] = [{ type: 'dealt' }];
    for (const p of [0, 1] as const) {
      const byMonth = new Map<number, number>();
      for (const cd of this.players[p].hand) byMonth.set(cd.month, (byMonth.get(cd.month) ?? 0) + 1);
      if ([...byMonth.values()].includes(4)) {
        this.over = true; this.winner = p;
        ev.push({ type: 'chongtong', player: p });
        ev.push({ type: 'gameOver', winner: p, reason: '총통' });
        return ev;
      }
    }
    return ev;
  }

  scoreOf(p: number): ScoreBreakdown { return score(this.players[p].captured); }

  canShake(p: number): number[] {
    const hand = this.players[p].hand;
    const byMonth = new Map<number, number>();
    for (const cd of hand) byMonth.set(cd.month, (byMonth.get(cd.month) ?? 0) + 1);
    const out: number[] = [];
    for (const [m, n] of byMonth) if (n === 3) out.push(m);
    return out;
  }
  canBomb(p: number): number[] {
    return this.canShake(p).filter((m) => this.floor.some((f) => f.month === m));
  }
  canShakeOnly(p: number): number[] {
    return this.canShake(p).filter((m) => !this.floor.some((f) => f.month === m));
  }

  get awaitingChoice(): Card[] | null { return this.pendingChoice?.options ?? null; }
  get awaitingGoStop(): boolean { return this._awaitGoStop; }
  private _awaitGoStop = false;

  /** 손패 한 장 내기. 바닥에 같은 월 2장이면 chooseFloorId로 선택. */
  play(p: number, cardId: number, chooseFloorId?: number, opts?: { shakeMonth?: number; bombMonth?: number }): GameEvent[] {
    if (this.over || p !== this.turn) throw new Error('not your turn');
    const ps = this.players[p];
    const ev: GameEvent[] = [];

    // 폭탄: 같은 월 3장을 한꺼번에 내서 바닥 1장과 함께 먹기
    if (opts?.bombMonth !== undefined) {
      const m = opts.bombMonth;
      if (!this.canBomb(p).includes(m)) throw new Error('cannot bomb');
      const trio = ps.hand.filter((c) => c.month === m);
      ps.hand = ps.hand.filter((c) => c.month !== m);
      const floorOne = this.floor.find((f) => f.month === m)!;
      this.floor = this.floor.filter((f) => f !== floorOne);
      ps.shakes++;
      ev.push({ type: 'shake', player: p, month: m });
      const won = [...trio, floorOne];
      ps.captured.push(...won);
      ev.push({ type: 'captured', player: p, cards: won, via: 'bomb' });
      this.stealPi(1 - p, p, ev);
      // 폭탄 후에도 덱 뒤집기는 진행
      this.flipDeck(p, null, ev);
      return this.afterTurn(p, ev);
    }

    const idx = ps.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error('card not in hand');
    // 흔들기는 내기 전 손패 기준으로 판정
    const shakeOk = opts?.shakeMonth !== undefined && this.canShakeOnly(p).includes(opts.shakeMonth);
    const played = ps.hand.splice(idx, 1)[0];
    ev.push({ type: 'played', player: p, card: played });
    if (shakeOk) {
      ps.shakes++;
      ev.push({ type: 'shake', player: p, month: opts!.shakeMonth! });
    }

    const matches = this.floor.filter((f) => f.month === played.month);
    if (matches.length === 2 && chooseFloorId === undefined) {
      // 선택이 필요하지만 따닥 가능성이 있으므로 일단 보류하지 않고 UI 선택 요구
      this.pendingChoice = { played, options: matches };
      ev.push({ type: 'needChoice', options: matches });
      return ev;
    }
    return this.resolvePlay(p, played, matches, chooseFloorId, ev);
  }

  /** needChoice 이후 선택 적용 */
  choose(p: number, floorCardId: number): GameEvent[] {
    const pc = this.pendingChoice;
    if (!pc) throw new Error('no pending choice');
    this.pendingChoice = null;
    const ev: GameEvent[] = [];
    return this.resolvePlay(p, pc.played, pc.options, floorCardId, ev);
  }

  private resolvePlay(p: number, played: Card, matches: Card[], chooseFloorId: number | undefined, ev: GameEvent[]): GameEvent[] {
    const ps = this.players[p];
    let placedOnFloor = false;
    let capturedFromPlay: Card[] = [];

    if (matches.length === 0) {
      this.floor.push(played);
      placedOnFloor = true;
      ev.push({ type: 'placed', player: p, card: played });
    } else if (matches.length === 1) {
      this.floor = this.floor.filter((f) => f !== matches[0]);
      capturedFromPlay = [played, matches[0]];
    } else if (matches.length === 2) {
      // 먼저 뒤집을 패를 확인하지 않고 선택을 적용 (따닥은 flip 단계에서 전부 회수)
      const chosen = matches.find((m) => m.id === chooseFloorId) ?? matches[0];
      this.floor = this.floor.filter((f) => f !== chosen);
      capturedFromPlay = [played, chosen];
      // 따닥 판정을 위해 남은 한 장을 기억
      (this as any)._ttadakRemainder = matches.find((m) => m !== chosen)!;
    } else {
      // 뻑 더미(3장)를 4번째 패로 먹기
      this.floor = this.floor.filter((f) => f.month !== played.month);
      capturedFromPlay = [played, ...matches];
      const stackIdx = this.stacks.findIndex((s) => s.month === played.month);
      const owner = stackIdx >= 0 ? this.stacks[stackIdx].owner : 1 - p;
      if (stackIdx >= 0) this.stacks.splice(stackIdx, 1);
      ps.captured.push(...capturedFromPlay);
      ev.push({ type: 'captured', player: p, cards: capturedFromPlay, via: 'stack' });
      this.stealPi(1 - p, p, ev, owner === p ? 2 : 1); // 자뻑이면 2장
      this.flipDeck(p, null, ev);
      return this.afterTurn(p, ev);
    }

    return this.flipDeck(p, { played, placedOnFloor, capturedFromPlay }, ev);
  }

  private flipDeck(p: number, playInfo: { played: Card; placedOnFloor: boolean; capturedFromPlay: Card[] } | null, ev: GameEvent[]): GameEvent[] {
    const ps = this.players[p];
    const flip = this.deck.shift();
    if (!flip) {
      if (playInfo && playInfo.capturedFromPlay.length) {
        ps.captured.push(...playInfo.capturedFromPlay);
        ev.push({ type: 'captured', player: p, cards: playInfo.capturedFromPlay, via: 'play' });
      }
      return this.afterTurn(p, ev);
    }

    if (playInfo && flip.month === playInfo.played.month) {
      // 쪽 / 뻑 / 따닥
      if (playInfo.placedOnFloor) {
        // 쪽: 바닥에 둔 패를 뒤집은 패로 바로 먹기
        this.floor = this.floor.filter((f) => f !== playInfo.played);
        ps.captured.push(playInfo.played, flip);
        ev.push({ type: 'captured', player: p, cards: [playInfo.played, flip], via: 'jjok' });
        this.stealPi(1 - p, p, ev);
      } else if ((this as any)._ttadakRemainder) {
        // 따닥: 4장 전부 회수
        const rem: Card = (this as any)._ttadakRemainder;
        this.floor = this.floor.filter((f) => f !== rem);
        const won = [...playInfo.capturedFromPlay, rem, flip];
        ps.captured.push(...won);
        ev.push({ type: 'captured', player: p, cards: won, via: 'ttadak' });
        this.stealPi(1 - p, p, ev);
      } else {
        // 뻑: 낸 패+먹으려던 패+뒤집은 패를 바닥에 쌓음
        const stackCards = [...playInfo.capturedFromPlay, flip];
        this.floor.push(...stackCards);
        this.stacks.push({ month: flip.month, owner: p });
        ps.ppeoks++;
        ev.push({ type: 'ppeok', player: p, month: flip.month });
        if (ps.ppeoks >= 3) {
          this.over = true; this.winner = p;
          ev.push({ type: 'threePpeok', player: p });
          ev.push({ type: 'gameOver', winner: p, reason: '3뻑' });
          return ev;
        }
      }
      (this as any)._ttadakRemainder = undefined;
      return this.afterTurn(p, ev);
    }
    (this as any)._ttadakRemainder = undefined;

    if (playInfo && playInfo.capturedFromPlay.length) {
      ps.captured.push(...playInfo.capturedFromPlay);
      ev.push({ type: 'captured', player: p, cards: playInfo.capturedFromPlay, via: 'play' });
    }

    // 뒤집은 패 매칭
    const fm = this.floor.filter((f) => f.month === flip.month);
    if (fm.length === 0) {
      this.floor.push(flip);
      ev.push({ type: 'placed', player: p, card: flip });
    } else if (fm.length === 3) {
      this.floor = this.floor.filter((f) => f.month !== flip.month);
      const won = [flip, ...fm];
      ps.captured.push(...won);
      ev.push({ type: 'captured', player: p, cards: won, via: 'stack' });
      const stackIdx = this.stacks.findIndex((s) => s.month === flip.month);
      const owner = stackIdx >= 0 ? this.stacks[stackIdx].owner : 1 - p;
      if (stackIdx >= 0) this.stacks.splice(stackIdx, 1);
      this.stealPi(1 - p, p, ev, owner === p ? 2 : 1);
    } else {
      const chosen = fm[0];
      this.floor = this.floor.filter((f) => f !== chosen);
      ps.captured.push(flip, chosen);
      ev.push({ type: 'captured', player: p, cards: [flip, chosen], via: 'flip' });
    }
    return this.afterTurn(p, ev);
  }

  private stealPi(from: number, to: number, ev: GameEvent[], count = 1): void {
    const f = this.players[from];
    for (let i = 0; i < count; i++) {
      const piIdx = f.captured.findIndex((c) => c.kind === 'pi' && c.piValue === 1);
      const anyPi = f.captured.findIndex((c) => c.kind === 'pi' || (c.isGukjin));
      const use = piIdx >= 0 ? piIdx : anyPi;
      if (use < 0) return;
      const [card] = f.captured.splice(use, 1);
      this.players[to].captured.push(card);
      ev.push({ type: 'stealPi', from, to, card });
    }
  }

  private afterTurn(p: number, ev: GameEvent[]): GameEvent[] {
    const ps = this.players[p];
    // 판 쓸기: 마지막 턴이 아니면 피 1장
    const lastTurn = this.deck.length === 0 && this.players[0].hand.length === 0 && this.players[1].hand.length === 0;
    if (this.floor.length === 0 && !lastTurn && !this.over) {
      ev.push({ type: 'sseul', player: p });
      this.stealPi(1 - p, p, ev);
    }
    // 고/스톱 판정
    if (!this.over) {
      const s = this.scoreOf(p).total;
      if (s >= 7 && s > ps.lastScoreMilestone) {
        ps.lastScoreMilestone = s;
        this._awaitGoStop = true;
        ev.push({ type: 'goStopPrompt', player: p, score: s });
        return ev;
      }
      // 턴 종료 조건
      if (this.deck.length === 0 && this.players[0].hand.length === 0 && this.players[1].hand.length === 0) {
        this.over = true;
        ev.push({ type: 'nagari' });
        ev.push({ type: 'gameOver', winner: null, reason: '나가리' });
        return ev;
      }
      this.turn = 1 - p;
    }
    return ev;
  }

  /** 고/스톱 응답 */
  answer(p: number, go: boolean): GameEvent[] {
    if (!this._awaitGoStop || p !== this.turn) throw new Error('no pending go/stop');
    this._awaitGoStop = false;
    const ps = this.players[p];
    const ev: GameEvent[] = [];
    if (go) {
      ps.goCount++;
      ev.push({ type: 'go', player: p, count: ps.goCount });
      // 판이 끝났는데도 고를 한 경우(마지막 턴) 처리
      if (this.deck.length === 0 && this.players[0].hand.length === 0 && this.players[1].hand.length === 0) {
        this.over = true;
        ev.push({ type: 'nagari' });
        ev.push({ type: 'gameOver', winner: null, reason: '나가리' });
        return ev;
      }
      this.turn = 1 - p;
    } else {
      ev.push({ type: 'stop', player: p });
      this.over = true;
      this.winner = p;
      const result = settle({
        winner: this.players[p].captured,
        loser: this.players[1 - p].captured,
        goCount: ps.goCount,
        loserGoCount: this.players[1 - p].goCount,
        shakes: ps.shakes,
        nagariCarry: this.nagariCarry,
      });
      ev.push({ type: 'gameOver', winner: p, result, reason: '스톱' });
    }
    return ev;
  }
}

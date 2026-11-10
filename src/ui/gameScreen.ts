import { MatgoGame, GameEvent } from '../engine/game';
import { AI } from '../engine/ai';
import { Card } from '../engine/cards';
import { Opponent } from '../data/opponents';
import { cardEl, cardBackEl } from './cards';

const BASE = import.meta.env.BASE_URL;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface MatchResult {
  winner: 0 | 1 | null;   // 0 = 플레이어
  finalScore?: number;
  reason: string;
  multipliers?: string[];
  base?: number;
}

export class GameScreen {
  private g = new MatgoGame();
  private dbg() { (window as any).__game = this.g; }
  private ai: AI;
  private el!: HTMLElement;
  private busy = false;
  private awaitingUser = false;
  private selectedCard: Card | null = null;

  constructor(
    private root: HTMLElement,
    private opponent: Opponent,
    private onEnd: (r: MatchResult) => void,
    nagariCarry = 1,
  ) {
    this.ai = new AI(opponent.difficulty);
    this.g.nagariCarry = nagariCarry;
  }

  async start() {
    this.el = document.createElement('div');
    this.el.id = 'game-screen';
    this.el.className = 'screen';
    this.root.innerHTML = '';
    this.root.appendChild(this.el);
    const ev = this.g.deal(); this.dbg();
    this.render();
    await this.processEvents(ev);
    await this.loop();
  }

  private async loop() {
    while (!this.g.over) {
      if (this.g.awaitingGoStop) {
        if (this.g.turn === 1) {
          await delay(900);
          const go = this.ai.decideGoStop(this.g, 1);
          const ev = this.g.answer(1, go);
          this.render();
          await this.processEvents(ev);
        } else {
          this.showGoStop();
          return; // 사용자 입력 대기
        }
      } else if (this.g.turn === 1) {
        this.awaitingUser = false;
        await delay(750);
        const dec = this.ai.decide(this.g, 1);
        let ev: GameEvent[];
        if (dec.bombMonth !== undefined) {
          ev = this.g.play(1, -1, undefined, { bombMonth: dec.bombMonth });
        } else {
          ev = this.g.play(1, dec.cardId, dec.chooseFloorId, dec.shakeMonth !== undefined ? { shakeMonth: dec.shakeMonth } : undefined);
        }
        this.render();
        await this.processEvents(ev);
        if (this.g.awaitingChoice) {
          await delay(500);
          const ch = this.g.awaitingChoice!;
          const ev2 = this.g.choose(1, ch[0].id);
          this.render();
          await this.processEvents(ev2);
        }
      } else {
        this.awaitingUser = true;
        this.render(); // 사용자 입력 대기 상태
        return;
      }
    }
  }

  private async processEvents(events: GameEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case 'captured': case 'stealPi': case 'placed': case 'played':
          this.render();
          if (e.type !== 'played') await delay(420);
          break;
        case 'ppeok': this.flash('뻑!'); await delay(900); break;
        case 'threePpeok': this.flash('3뻑 승리!'); await delay(1100); break;
        case 'sseul': this.flash('쓸!'); await delay(900); break;
        case 'shake': this.flash(e.month ? '흔들기!' : '폭탄!'); await delay(900); break;
        case 'chongtong': this.flash('총통!'); await delay(1100); break;
        case 'go': this.flash(`고 ×${e.count}`); await delay(900); break;
        case 'stop': this.flash('스톱!'); await delay(800); break;
        case 'nagari': this.flash('나가리'); await delay(1000); break;
        case 'goStopPrompt':
          this.render();
          break;
        case 'gameOver':
          await delay(600);
          this.showSettle(e);
          break;
      }
    }
  }

  private flash(text: string) {
    const f = document.createElement('div');
    f.className = 'flash';
    f.textContent = text;
    this.el.appendChild(f);
    setTimeout(() => f.remove(), 950);
  }

  private showGoStop() {
    const score = this.g.scoreOf(0).total;
    const ov = document.createElement('div');
    ov.className = 'gostop-overlay';
    ov.innerHTML = `<div class="gostop-panel">
      <div class="pts">${score}점</div>
      <div class="ask">고 하시겠습니까?</div>
      <div class="row">
        <button class="btn go" data-a="go">고!</button>
        <button class="btn stop" data-a="stop">스톱!</button>
      </div></div>`;
    ov.querySelectorAll('button').forEach((b) => b.addEventListener('click', async () => {
      ov.remove();
      const ev = this.g.answer(0, (b as HTMLElement).dataset.a === 'go');
      this.render();
      await this.processEvents(ev);
      this.loop();
    }));
    this.el.appendChild(ov);
  }

  private showSettle(e: Extract<GameEvent, { type: 'gameOver' }>) {
    const ov = document.createElement('div');
    ov.className = 'settle-overlay';
    const winnerName = e.winner === 0 ? '나' : e.winner === 1 ? this.opponent.name : '없음';
    let rows = '';
    if (e.result) {
      const s = this.g.scoreOf(e.winner!).constructor; void s;
      const br = this.g.scoreOf(e.winner!);
      const items: [string, number][] = [
        ['광', br.gwang], ['고도리', br.godori], ['홍단', br.hongdan], ['청단', br.cheongdan],
        ['초단', br.chodan], ['열끗', br.yeol], ['띠', br.tti], ['피', br.pi],
      ];
      rows = items.filter(([, v]) => v > 0).map(([k, v]) => `<div class="settle-row"><span>${k}</span><span class="v">${v}점</span></div>`).join('');
    }
    const mults = (e.result?.multipliers ?? []).map((m) => `<span class="mult-tag">${m}</span>`).join('');
    ov.innerHTML = `<div class="settle-panel">
      <h3>${e.reason === '나가리' ? '나가리' : e.winner === 0 ? '승리!' : '패배'}</h3>
      <div class="winner-line">${e.reason}${e.winner !== null ? ` · 승자: ${winnerName}` : ''}</div>
      ${rows}
      ${mults ? `<div class="mult-tags">${mults}</div>` : ''}
      ${e.result ? `<div class="settle-total"><span>최종</span><span class="v">${e.result.finalScore}점</span></div>` : ''}
      <div class="settle-actions"><button class="btn primary" id="settle-ok">확인</button></div>
    </div>`;
    ov.querySelector('#settle-ok')!.addEventListener('click', () => {
      this.onEnd({ winner: e.winner as 0 | 1 | null, finalScore: e.result?.finalScore, reason: e.reason, multipliers: e.result?.multipliers, base: e.result?.base });
    });
    this.el.appendChild(ov);
  }

  private onHandClick(card: Card) {
    if (this.busy || !this.awaitingUser || this.g.turn !== 0 || this.g.over || this.g.awaitingGoStop) return;
    const matches = this.g.floor.filter((f) => f.month === card.month);
    if (matches.length === 2) {
      this.selectedCard = card;
      this.render();
      return;
    }
    this.playUser(card.id);
  }

  private onFloorClick(floorCard: Card) {
    if (!this.selectedCard || floorCard.month !== this.selectedCard.month) return;
    const sel = this.selectedCard;
    this.selectedCard = null;
    this.playUser(sel.id, floorCard.id);
  }

  private async playUser(cardId: number, chooseFloorId?: number, opts?: { shakeMonth?: number; bombMonth?: number }) {
    this.busy = true;
    this.awaitingUser = false;
    try {
      const ev = this.g.play(0, cardId, chooseFloorId, opts);
      this.render();
      await this.processEvents(ev);
      await this.loop();
    } finally {
      this.busy = false;
      this.render();
    }
  }

  private render() { this.dbg();
    if (this.g.over) return;
    const g = this.g;
    const me = g.players[0], opp = g.players[1];
    const myScore = g.scoreOf(0), oppScore = g.scoreOf(1);

    const capGroup = (cards: Card[]) => {
      const groups: [string, Card[]][] = [
        ['광', cards.filter((c) => c.kind === 'gwang')],
        ['열끗', cards.filter((c) => c.kind === 'yeol' || c.isGukjin)],
        ['띠', cards.filter((c) => c.kind === 'tti')],
        ['피', cards.filter((c) => c.kind === 'pi')],
      ];
      return groups.filter(([, cs]) => cs.length).map(([label, cs]) =>
        `<div class="cap-group"><div class="cap-stack">${cs.map((c) => `<img class="mini" src="${(window as any).__base}assets/cards/month-${String(c.month).padStart(2, '0')}.webp" alt="${c.label}">`).join('')}</div><div class="cap-label">${label} ${label === '피' ? cs.reduce((s, c) => s + c.piValue, 0) : cs.length}</div></div>`).join('');
    };
    (window as any).__base = BASE;

    this.el.innerHTML = `
      <div class="opp-bar">
        <img src="${BASE}${this.opponent.portrait}" alt="${this.opponent.name}">
        <div><div class="opp-name">${this.opponent.name}<span class="go-badge">${opp.goCount ? `고×${opp.goCount}` : ''}</span></div>
        <div class="opp-title">${this.opponent.title}</div></div>
        <div class="spacer"></div>
        <div class="score-pill">${this.opponent.name} <b>${oppScore.total}</b>점</div>
        <div class="score-pill">나 <b>${myScore.total}</b>점${me.goCount ? ` <span class="go-badge">고×${me.goCount}</span>` : ''}</div>
      </div>
      <div class="table-area">
        <div class="opp-zone">
          <div class="opp-hand">${opp.hand.map(() => '<div class="card-back"></div>').join('')}</div>
          <div class="spacer" style="flex:1"></div>
          <div class="opp-captured">${capGroup(opp.captured)}</div>
        </div>
        <div class="floor-zone" id="floor"></div>
        <div class="opp-zone" style="justify-content:flex-end">
          <div class="my-captured">${capGroup(me.captured)}</div>
        </div>
        <div class="action-bar" id="actionbar"></div>
        <div class="my-hand" id="hand"></div>
      </div>`;

    // 바닥
    const floorEl = this.el.querySelector('#floor')!;
    const byMonth = new Map<number, Card[]>();
    for (const f of g.floor) {
      if (!byMonth.has(f.month)) byMonth.set(f.month, []);
      byMonth.get(f.month)!.push(f);
    }
    const cells: HTMLElement[] = [];
    for (const [, cards] of [...byMonth.entries()].sort((a, b) => a[0] - b[0])) {
      const cell = document.createElement('div');
      cell.className = 'floor-cell';
      cards.forEach((c, i) => {
        const ce = cardEl(c);
        if (i > 0) { ce.style.position = 'absolute'; ce.style.transform = `translate(${i * 5}px, ${i * -4}px)`; }
        if (this.selectedCard && c.month === this.selectedCard.month) {
          cell.classList.add('target');
          ce.addEventListener('click', () => this.onFloorClick(c));
        }
        cell.appendChild(ce);
      });
      floorEl.appendChild(cell);
      cells.push(cell);
    }
    // 덱 더미 표시
    const pile = document.createElement('div');
    pile.className = 'deck-pile';
    pile.appendChild(cardBackEl());
    const count = document.createElement('div');
    count.style.cssText = 'color:#8a84a0;font-size:11px;text-align:center;margin-top:2px';
    count.textContent = `${g.deck.length}`;
    pile.appendChild(count);
    this.el.querySelector('.floor-zone')!.appendChild(pile);

    // 내 손패
    const handEl = this.el.querySelector('#hand')!;
    for (const c of me.hand.slice().sort((a, b) => a.month - b.month || a.id - b.id)) {
      const ce = cardEl(c, { big: true });
      if (this.selectedCard?.id === c.id) ce.classList.add('playable-hint');
      ce.addEventListener('click', () => this.onHandClick(c));
      handEl.appendChild(ce);
    }

    // 액션 바: 흔들기/폭탄
    const ab = this.el.querySelector('#actionbar')!;
    if (g.turn === 0 && !g.awaitingGoStop && !g.over) {
      for (const m of g.canBomb(0)) {
        const b = document.createElement('button');
        b.className = 'btn small danger';
        b.textContent = `폭탄! (${m}월)`;
        b.addEventListener('click', () => this.playUser(-1, undefined, { bombMonth: m }));
        ab.appendChild(b);
      }
      for (const m of g.canShakeOnly(0)) {
        const b = document.createElement('button');
        b.className = 'btn small';
        b.textContent = `흔들기 (${m}월)`;
        b.addEventListener('click', () => {
          const trio = me.hand.filter((c) => c.month === m);
          if (trio.length === 3) this.playUser(trio[0].id, undefined, { shakeMonth: m });
        });
        ab.appendChild(b);
      }
      if (this.selectedCard) {
        const hint = document.createElement('span');
        hint.style.cssText = 'color:var(--neon-c);font-size:13px';
        hint.textContent = '가져올 바닥 패를 선택하세요';
        ab.appendChild(hint);
      }
    }
  }
}

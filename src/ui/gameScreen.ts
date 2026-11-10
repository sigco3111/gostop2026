import { focusDialog } from './dialog';
import { sfx, soundEnabled, setSound } from './audio';
import { MatgoGame, GameEvent } from '../engine/game';
import { AI } from '../engine/ai';
import { settle } from '../engine/scoring';
import { Card } from '../engine/cards';
import { Opponent } from '../data/opponents';
import { cardEl, cardBackEl, cardUrl } from './cards';

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
  private effectLayer!: HTMLElement;
  private busy = false;
  private awaitingUser = false;
  private selectedCard: Card | null = null;
  private keyboardNavigation = false;

  constructor(
    private root: HTMLElement,
    private opponent: Opponent,
    private onEnd: (r: MatchResult) => void,
    nagariCarry = 1,
    private onExit?: () => void,
    private tournamentCheckpoint = false,
  ) {
    this.ai = new AI(opponent.difficulty);
    this.g.nagariCarry = nagariCarry;
  }

  async start() {
    this.keyboardNavigation = document.activeElement instanceof HTMLElement && document.activeElement!==document.body && document.activeElement.matches(':focus-visible');
    this.el = document.createElement('div');
    this.el.id = 'game-screen';
    this.el.className = 'screen';
    this.el.addEventListener('keydown',()=>{this.keyboardNavigation=true;},true);
    this.el.addEventListener('pointerdown',()=>{this.keyboardNavigation=false;},true);
    this.el.style.backgroundImage=`linear-gradient(#07060aaf,#07060af5),url(${BASE}${this.opponent.background})`;
    this.el.style.backgroundSize='cover';
    this.el.style.backgroundPosition='center';
    this.root.innerHTML = '';
    this.root.appendChild(this.el);
    this.effectLayer=document.createElement('div');this.effectLayer.className='fx-layer';this.effectLayer.setAttribute('aria-hidden','true');this.root.appendChild(this.effectLayer);
    const ev = this.g.deal(); this.dbg(); sfx('shuffle');
    this.render();
    await this.processEvents(ev);
    await this.loop();
  }

  private async loop() {
    while (!this.g.over) {
      if(this.g.awaitingChoice){
        if(this.g.turn===0){this.render();return;}
        const ev=this.g.choose(1,this.ai.choose(this.g,1));this.render();await this.processEvents(ev);continue;
      }
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
          sfx(e.type === 'played' ? 'play' : 'draw');
          this.render();
          this.animateCards(e);
          if (e.type === 'captured' && ['jjok','ttadak','stack','bomb'].includes(e.via)) this.flash(({jjok:'쪽!',ttadak:'따닥!',stack:'뻑 회수!',bomb:'폭탄!'} as Record<string,string>)[e.via]);
          if (e.type !== 'played') await delay(420);
          break;
        case 'ppeok': this.flash('뻑!'); await delay(900); break;
        case 'threePpeok': this.flash('3뻑 승리!'); await delay(1100); break;
        case 'sseul': this.flash('쓸!'); await delay(900); break;
        case 'shake': this.flash(`흔들기 / 폭탄 · ${e.month}월`); await delay(900); break;
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

  private animateCards(e: Extract<GameEvent,{type:'played'|'captured'|'placed'|'stealPi'}>) {
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const center=(selector:string)=>{const r=this.el.querySelector(selector)?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null;};
    const floor=center('#floor');if(!floor)return;
    const cards=e.type==='captured'?e.cards:[e.card];
    const player=e.type==='stealPi'?e.to:e.player;
    const destination=e.type==='captured'||e.type==='stealPi'?center(player===0?'.my-captured':'.opp-captured'):floor;
    const origin=e.type==='played'?center(player===0?'#hand':'.opp-hand'):e.type==='placed'?center('.deck-pile'):floor;
    if(!origin||!destination)return;
    for(const [i,c] of cards.entries()){
      const ghost=document.createElement('img');ghost.className='fx-card';ghost.src=cardUrl(c.id);ghost.alt='';
      ghost.style.left=`${origin.x-28+i*7}px`;ghost.style.top=`${origin.y-42}px`;
      ghost.style.setProperty('--flight-x',`${destination.x-origin.x}px`);ghost.style.setProperty('--flight-y',`${destination.y-origin.y}px`);ghost.style.setProperty('--flight-rot',`${(i-1)*7}deg`);
      this.effectLayer.appendChild(ghost);setTimeout(()=>ghost.remove(),430);
    }
  }

  private flash(text: string) {
    const f = document.createElement('div');
    f.className = 'flash';
    f.textContent = text;
    this.effectLayer.appendChild(f);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const burst=document.createElement('div');burst.className='fx-burst';burst.setAttribute('aria-hidden','true');
      for(let i=0;i<10;i++){const sp=document.createElement('img');sp.src=`${BASE}assets/fx/${i%2?'spark':'star'}.png`;sp.style.setProperty('--angle',`${i*36}deg`);sp.style.setProperty('--travel',`${90+(i%3)*40}px`);burst.appendChild(sp);}
      this.effectLayer.appendChild(burst);setTimeout(()=>burst.remove(),950);
    }
    setTimeout(() => f.remove(), 950);
  }

  private showGoStop() {
    this.el.querySelector('.gostop-overlay')?.remove();
    this.effectLayer.replaceChildren();
    const score = this.g.scoreOf(0).total;
    const now=settle({winner:this.g.players[0].captured,loser:this.g.players[1].captured,goCount:this.g.players[0].goCount,loserGoCount:this.g.players[1].goCount,shakes:this.g.players[0].shakes,nagariCarry:this.g.nagariCarry});
    const ov = document.createElement('div');
    ov.className = 'gostop-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','고 또는 스톱 선택');
    ov.innerHTML = `<div class="gostop-panel">
      <div class="pts">${score}점</div>
      <div class="ask">고 하시겠습니까?</div>
      <p class="stop-preview">지금 스톱하면 <strong>${now.finalScore}점</strong></p>
      <p class="go-risk">${this.g.deck.length===0?'마지막 뒤집기입니다. 고를 하면 나가리로 끝납니다.':`남은 더미 ${this.g.deck.length}장 · 고를 한 뒤 상대가 먼저 나면 고박입니다.`}</p>
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
    this.el.appendChild(ov);focusDialog(ov,ov.querySelector<HTMLElement>('.stop'));
  }

  private showSettle(e: Extract<GameEvent, { type: 'gameOver' }>) {
    const ov = document.createElement('div');
    ov.className = 'settle-overlay';ov.setAttribute('aria-label','대국 결과');
    const winnerName = e.winner === 0 ? '나' : e.winner === 1 ? this.opponent.name : '없음';
    let rows = '';
    if (e.result) {
      const br = e.result.breakdown ?? this.g.scoreOf(e.winner!);
      const items: [string, number][] = [
        ['광', br.gwang], ['고도리', br.godori], ['홍단', br.hongdan], ['청단', br.cheongdan],
        ['초단', br.chodan], ['열끗', br.yeol], ['띠', br.tti], ['피', br.pi],
      ];
      rows = ['총통','3뻑'].includes(e.reason) ? `<div class="settle-row"><span>${e.reason} 기본 승리</span><span class="v">7점</span></div>` : items.filter(([, v]) => v > 0).map(([k, v]) => `<div class="settle-row"><span>${k}</span><span class="v">${v}점</span></div>`).join('');
    }
    if(e.result?.goAdd) rows += `<div class="settle-row"><span>고 가산 (${e.result.goAdd}회)</span><span class="v">+${e.result.goAdd}점</span></div>`;
    if(e.result?.breakdown && this.g.players[e.winner!].captured.some(c=>c.isGukjin)) rows += `<div class="settle-note">국진: ${e.result.breakdown.gukjinAsPi?'쌍피':'열끗'} (최종 점수 기준 자동 선택)</div>`;
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
    this.el.appendChild(ov);focusDialog(ov);
  }

  private showExit() {
    if(this.busy||this.g.over||this.g.turn!==0||this.g.awaitingChoice||this.g.awaitingGoStop||!this.onExit)return;
    const ov=document.createElement('div');ov.className='exit-overlay';ov.setAttribute('aria-label','대국 나가기 확인');
    ov.innerHTML='<div class="exit-panel"><h3>이 대국을 나갈까요?</h3><p>현재 판과 토너먼트 대진은 이어할 수 없습니다. 이미 저장한 시나리오 돌파·칭호·트로피는 유지됩니다. 승리나 점수는 기록하지 않습니다.</p><div><button class="btn small" data-exit="cancel">계속하기</button><button class="btn small danger" data-exit="confirm">대국 나가기</button></div></div>';
    const cancel=()=>{ov.remove();(this.el.querySelector('.exit-toggle') as HTMLElement)?.focus();};
    ov.querySelector('[data-exit=cancel]')!.addEventListener('click',cancel);
    ov.querySelector('[data-exit=confirm]')!.addEventListener('click',()=>{this.effectLayer.remove();this.onExit?.();});
    if(this.tournamentCheckpoint)ov.querySelector('p')!.textContent='진행 중인 한 판의 손패는 저장되지 않습니다. 완료한 판까지의 대진·승수·나가리 이월은 저장되어 타이틀의 토너먼트 이어하기로 돌아올 수 있습니다. 현재 판의 승리나 점수는 기록하지 않습니다.';
    this.el.appendChild(ov);focusDialog(ov,ov.querySelector<HTMLElement>('[data-exit=cancel]'),cancel);
  }

  private showCaptured() {
    if(this.g.over || this.g.turn!==0 || this.g.awaitingGoStop || this.g.awaitingChoice || this.busy)return;
    const ov=document.createElement('div');ov.className='capture-overlay';ov.setAttribute('aria-label','먹은 패와 점수');
    const panel=document.createElement('div');panel.className='capture-panel';
    const close=document.createElement('button');close.className='btn small capture-close';close.textContent='판으로 돌아가기';
    const dismiss=()=>{ov.remove();(this.el.querySelector('.capture-toggle') as HTMLElement)?.focus();};close.addEventListener('click',dismiss);panel.appendChild(close);
    for(const player of [0,1] as const){
      const heading=document.createElement('h3');const sc=this.g.scoreOf(player);heading.textContent=`${player===0?'나':this.opponent.name} · ${sc.total}점`;panel.appendChild(heading);
      const detail=document.createElement('p');detail.textContent=`광 ${sc.counts.gwang}장 · 열끗 ${sc.counts.yeol}장 · 띠 ${sc.counts.tti}장 · 피 ${sc.counts.piUnits}장분`;panel.appendChild(detail);
      const note=document.createElement('p');note.className='capture-note';note.textContent='현재 원점수입니다. 고·박·흔들기 배수는 마지막 정산에서 적용합니다.';panel.appendChild(note);
      const grid=document.createElement('div');grid.className='captured-grid';
      for(const card of this.g.players[player].captured.slice().sort((a,b)=>a.month-b.month||a.id-b.id)){const item=cardEl(card);item.removeAttribute('tabindex');grid.appendChild(item);}
      if(!grid.children.length)grid.textContent='아직 먹은 패가 없습니다.';panel.appendChild(grid);
    }
    ov.appendChild(panel);this.el.appendChild(ov);focusDialog(ov,close,dismiss);
  }

  private onHandClick(card: Card) {
    if (this.busy || !this.awaitingUser || this.g.turn !== 0 || this.g.over || this.g.awaitingGoStop) return;
    this.playUser(card.id);
  }

  private onFloorClick(floorCard: Card) {
    if (!this.selectedCard || floorCard.month !== this.selectedCard.month) return;
    const sel = this.selectedCard;
    this.selectedCard = null;
    this.playUser(sel.id, floorCard.id);
  }

  private async playUser(cardId: number, chooseFloorId?: number, opts?: { shakeMonth?: number; bombMonth?: number }) {
    if(this.busy||this.g.turn!==0||this.g.over)return;
    this.busy = true;
    this.awaitingUser = false;
    try {
      const ev = this.g.play(0, cardId, chooseFloorId, opts);
      this.render();
      await this.processEvents(ev);
      await this.loop();
    } finally {
      this.busy = false;
    }
  }

  private render() { this.dbg();
    const previousFocus=document.activeElement instanceof HTMLElement&&this.el.contains(document.activeElement)?document.activeElement:null;
    const focusCard=previousFocus?.dataset.cardId;
    const focusSound=previousFocus?.classList.contains('sound-toggle');
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
        `<div class="cap-group"><div class="cap-stack">${cs.map((c) => `<img class="mini" src="${cardUrl(c.id)}" alt="${c.label}">`).join('')}</div><div class="cap-label">${label} ${label === '피' ? cs.reduce((s, c) => s + c.piValue, 0) : cs.length}</div></div>`).join('');
    };
    (window as any).__base = BASE;

    this.el.innerHTML = `
      <div class="opp-bar">
        <img src="${BASE}${this.opponent.portrait}" alt="${this.opponent.name}">
        <div><div class="opp-name">${this.opponent.name}<span class="go-badge">${opp.goCount ? `고×${opp.goCount}` : ''}</span></div>
        <div class="opp-title">${this.opponent.title}</div></div>
        <div class="spacer"></div><button class="sound-toggle" aria-pressed="${soundEnabled()}">${soundEnabled()?'소리 켬':'소리 끔'}</button>
        <div class="score-pill">${this.opponent.name} <b>${oppScore.total}</b>점</div>
        <div class="score-pill">나 <b>${myScore.total}</b>점${me.goCount ? ` <span class="go-badge">고×${me.goCount}</span>` : ''}</div>
      </div>
      <div class="turn-bar"><span role="status" aria-live="polite">${g.turn===0?(g.awaitingChoice?'가져올 패를 고르세요':g.awaitingGoStop?'고 / 스톱을 결정하세요':'내 차례 · 손패를 내세요'):`${this.opponent.name}의 차례`}</span><div class="turn-actions"><button class="capture-toggle" ${g.turn!==0||g.awaitingChoice||g.awaitingGoStop?'disabled':''}>먹은 패 · 점수</button><button class="exit-toggle" ${g.turn!==0||g.awaitingChoice||g.awaitingGoStop?'disabled':''} aria-label="대국 나가기">나가기</button></div></div>
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

    this.el.querySelector('.sound-toggle')?.addEventListener('click', () => {setSound(!soundEnabled());this.render();});
    this.el.querySelector('.capture-toggle')?.addEventListener('click',()=>this.showCaptured());
    this.el.querySelector('.exit-toggle')?.addEventListener('click',()=>this.showExit());
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
        const ce = cardEl(c,{interactive:!!this.selectedCard&&c.month===this.selectedCard.month});
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
    handEl.addEventListener('keydown',(event)=>{
      const e=event as KeyboardEvent;if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      const cards=[...handEl.querySelectorAll<HTMLElement>('[role=button]')];const at=cards.indexOf(document.activeElement as HTMLElement);if(at<0)return;
      e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?cards.length-1:(at+(e.key==='ArrowRight'?1:-1)+cards.length)%cards.length;cards[next]?.focus();
    });
    for (const c of me.hand.slice().sort((a, b) => a.month - b.month || a.id - b.id)) {
      const active=g.turn===0&&!g.awaitingChoice&&!g.awaitingGoStop;
      const ce = cardEl(c, { big: true,interactive:active });
      if(!active)ce.setAttribute('aria-disabled','true');
      if(active){const mark=(on:boolean)=>this.el.querySelectorAll<HTMLElement>('.floor-cell').forEach(cell=>cell.classList.toggle('matching-month',on&&!!cell.querySelector(`[data-card-id="${g.floor.find(f=>f.month===c.month)?.id}"]`)));ce.addEventListener('mouseenter',()=>mark(true));ce.addEventListener('mouseleave',()=>mark(false));ce.addEventListener('focus',()=>mark(true));ce.addEventListener('blur',()=>mark(false));}
      if (this.selectedCard?.id === c.id) ce.classList.add('playable-hint');
      ce.addEventListener('click', () => this.onHandClick(c));
      handEl.appendChild(ce);
    }

    // Pending flip choices must expose each physical card, not just a covered stack.
    if(g.awaitingChoice && g.turn===0){
      const chooser=document.createElement('div');chooser.className='choice-overlay';chooser.setAttribute('aria-label','가져올 패 선택');
      const label=document.createElement('div');label.textContent='가져올 패를 선택하세요';chooser.appendChild(label);
      const row=document.createElement('div');row.className='choice-row';
      g.awaitingChoice.forEach(c=>{const ce=cardEl(c,{big:true,interactive:true});ce.addEventListener('click',async()=>{if(this.busy)return;this.busy=true;try{const ev=g.choose(0,c.id);this.render();await this.processEvents(ev);await this.loop();}finally{this.busy=false;}});row.appendChild(ce);});
      chooser.appendChild(row);this.el.appendChild(chooser);focusDialog(chooser);
    }
    // 액션 바: 흔들기/폭탄
    const ab = this.el.querySelector('#actionbar')!;
    if (g.turn === 0 && !g.awaitingGoStop && !g.awaitingChoice && !g.over) {
      if(me.bombPasses){const b=document.createElement('button');b.className='btn small';b.textContent=`폭탄 빈패 (${me.bombPasses})`;b.addEventListener('click',()=>this.playUser(-1));ab.appendChild(b);}
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
    if(this.keyboardNavigation&&!g.awaitingChoice&&!g.awaitingGoStop){
      const target=focusSound?this.el.querySelector<HTMLElement>('.sound-toggle'):g.turn===0&&this.awaitingUser?(this.el.querySelector<HTMLElement>(`#hand [data-card-id="${focusCard}"][role=button]`)??this.el.querySelector<HTMLElement>('#hand [role=button]')):null;
      target?.focus();
    }
  }
}

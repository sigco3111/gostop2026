import { Opponent, OPPONENTS } from '../data/opponents';
import { GameScreen, MatchResult } from './gameScreen';

const BASE = import.meta.env.BASE_URL;
const SAVE_KEY = 'gostop2026-save-v1';

export interface SaveData {
  clearedStages: number[];
  titles: string[];
  trophies: number;
  nagariCarry: number;
}
export function loadSave(): SaveData {
  try { return { clearedStages: [], titles: [], trophies: 0, nagariCarry: 1, ...JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') }; }
  catch { return { clearedStages: [], titles: [], trophies: 0, nagariCarry: 1 }; }
}
export function store(s: SaveData) { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }

export class App {
  private root: HTMLElement;
  private save = loadSave();

  constructor() {
    this.root = document.getElementById('app')!;
    this.showTitle();
  }

  private setScreen(el: HTMLElement) {
    this.root.innerHTML = '';
    this.root.appendChild(el);
  }
  private mk(id: string, cls = 'screen'): HTMLElement {
    const el = document.createElement('div');
    el.id = id; el.className = cls;
    return el;
  }

  showTitle() {
    const el = this.mk('title-screen');
    el.style.backgroundImage = `url(${BASE}assets/keyart.webp)`;
    el.innerHTML = `<div class="title-inner">
      <div class="game-title">고스톱 2026</div>
      <div class="game-sub">어둠의 판 · 12인의 고수</div>
      <div class="menu">
        <button class="btn primary" id="m-scenario">시나리오 - 밑바닥에서 전설로</button>
        <button class="btn" id="m-tournament">토너먼트</button>
        <button class="btn" id="m-free">자유 대국</button>
      </div></div>`;
    el.querySelector('#m-scenario')!.addEventListener('click', () => this.showScenario());
    el.querySelector('#m-tournament')!.addEventListener('click', () => this.showTournament());
    el.querySelector('#m-free')!.addEventListener('click', () => this.showFreePlay());
    this.setScreen(el);
  }

  showScenario() {
    const el = this.mk('scenario-screen');
    const maxOpen = Math.max(1, ...this.save.clearedStages.map((s) => s + 1), 1);
    el.innerHTML = `<div class="screen-head"><h2>시나리오 - 밑바닥에서 전설로</h2><span class="sub">12인의 고수를 순서대로 꺾어라</span></div>
      <div class="stage-grid"></div>
      <button class="btn small" id="back">← 타이틀</button>`;
    const grid = el.querySelector('.stage-grid')!;
    for (const o of OPPONENTS) {
      const locked = o.stage > maxOpen;
      const cleared = this.save.clearedStages.includes(o.stage);
      const card = document.createElement('div');
      card.className = `stage-card${locked ? ' locked' : ''}`;
      card.innerHTML = `<div class="num">${o.stage}</div>${cleared ? '<div class="cleared">CLEARED</div>' : ''}
        <img src="${BASE}${o.portrait}" alt="${o.name}">
        <div class="meta"><div class="name">${o.name}</div><div class="title">${o.title}</div></div>`;
      if (!locked) card.addEventListener('click', () => this.showDialogue(o, () => this.startMatch(o, 'scenario')));
      grid.appendChild(card);
    }
    el.querySelector('#back')!.addEventListener('click', () => this.showTitle());
    this.setScreen(el);
  }

  showDialogue(o: Opponent, next: () => void) {
    const el = this.mk('dialogue-screen');
    el.style.backgroundImage = `url(${BASE}${o.background})`;
    const lines = [...o.intro];
    let i = 0;
    const render = () => {
      el.innerHTML = `<img class="dialogue-portrait" src="${BASE}${o.portrait}" alt="">
        <div class="dialogue-box">
          <div class="dialogue-name">${o.name} - ${o.title}</div>
          <div class="dialogue-text">${lines[i]}</div>
          <div class="dialogue-next">${i < lines.length - 1 ? '클릭하여 계속 ▼' : '클릭하여 대국 시작 ▶'}</div>
        </div>`;
    };
    render();
    el.addEventListener('click', () => { i++; if (i >= lines.length) next(); else render(); });
    this.setScreen(el);
  }

  startMatch(o: Opponent, mode: 'scenario' | 'free' | 'tournament', after?: (r: MatchResult) => void) {
    const gs = new GameScreen(this.root, o, (r) => {
      if (mode === 'scenario') {
        if (r.winner === 0) {
          if (!this.save.clearedStages.includes(o.stage)) this.save.clearedStages.push(o.stage);
          this.save.nagariCarry = 1;
          store(this.save);
          this.showResultDialogue(o, 'lose', () => this.showScenario());
        } else if (r.winner === 1) {
          this.save.nagariCarry = 1;
          store(this.save);
          this.showResultDialogue(o, 'win', () => this.showScenario());
        } else {
          this.save.nagariCarry = Math.min(8, (this.save.nagariCarry ?? 1) * 2);
          store(this.save);
          this.showResultDialogue(o, 'win', () => this.showScenario(), `나가리 - 다음 판 ×${this.save.nagariCarry}`);
        }
      } else if (after) {
        after(r);
      } else {
        this.showTitle();
      }
    }, mode === 'scenario' ? this.save.nagariCarry ?? 1 : 1);
    gs.start();
  }

  private showResultDialogue(o: Opponent, kind: 'win' | 'lose', back: () => void, override?: string) {
    const el = this.mk('dialogue-screen');
    el.style.backgroundImage = `url(${BASE}${o.background})`;
    const text = override ?? o[kind][0];
    el.innerHTML = `<img class="dialogue-portrait" src="${BASE}${o.portrait}" alt="">
      <div class="dialogue-box">
        <div class="dialogue-name">${o.name}</div>
        <div class="dialogue-text">${text}</div>
        <div class="dialogue-next">클릭하여 계속 ▶</div>
      </div>`;
    el.addEventListener('click', back);
    this.setScreen(el);
  }

  showFreePlay() {
    const el = this.mk('free-screen');
    el.innerHTML = `<div class="setup-panel"><h2>자유 대국</h2>
      <div class="sub" style="color:var(--dim);font-size:13px">상대를 고르세요 (시나리오에서 만난 고수와 다시 대국)</div>
      <div class="stage-grid" style="margin-top:16px"></div>
      <button class="btn small" id="back">← 타이틀</button></div>`;
    const grid = el.querySelector('.stage-grid')!;
    for (const o of OPPONENTS) {
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.innerHTML = `<img src="${BASE}${o.portrait}" alt="${o.name}">
        <div class="meta"><div class="name">${o.name}</div><div class="title">${o.title} · 난이도 ${o.difficulty}</div></div>`;
      card.addEventListener('click', () => this.startMatch(o, 'free'));
      grid.appendChild(card);
    }
    el.querySelector('#back')!.addEventListener('click', () => this.showTitle());
    this.setScreen(el);
  }

  showTournament() {
    // 12인 중 랜덤 7인 + 나 = 8강, 각 라운드 3판 2승
    const pool = [...OPPONENTS].sort(() => Math.random() - 0.5).slice(0, 7);
    const bracket: (Opponent | 'ME' | null)[] = ['ME', ...pool];
    const state = { round: 0, alive: bracket.slice(), champ: null as Opponent | 'ME' | null };

    const renderBracket = () => {
      const el = this.mk('tournament-screen');
      el.innerHTML = `<div class="setup-panel"><h2>토너먼트 - 8강</h2>
        <div class="sub" style="color:var(--dim);font-size:13px">각 라운드 3판 2승 · 우승 시 트로피 기록 (보유: ${this.save.trophies})</div>
        <div class="bracket">${state.alive.map((p) => p === 'ME'
          ? '<div class="bracket-slot me">나</div>'
          : p ? `<div class="bracket-slot">${p.name}</div>` : '').join('')}</div>
        <div style="margin-top:18px;display:flex;gap:10px">
          <button class="btn primary" id="next">다음 대국</button>
          <button class="btn small" id="back">← 타이틀</button></div></div>`;
      el.querySelector('#back')!.addEventListener('click', () => this.showTitle());
      el.querySelector('#next')!.addEventListener('click', () => playNext());
      this.setScreen(el);
    };

    const playNext = () => {
      // 내 다음 상대를 찾기: 살아있는 상대 중 첫 번째
      const opp = state.alive.find((p): p is Opponent => p !== null && p !== 'ME');
      if (!opp) return;
      let wins = 0, losses = 0;
      const playMatch = () => {
        this.startMatch(opp, 'tournament', (r) => {
          if (r.winner === 0) wins++; else if (r.winner === 1) losses++;
          if (wins === 2 || losses === 2) {
            if (wins === 2) {
              state.alive = state.alive.filter((p) => p !== opp);
              if (state.alive.length === 1 && state.alive[0] === 'ME') {
                this.save.trophies++;
                store(this.save);
                const el = this.mk('tournament-screen');
                el.innerHTML = `<div class="setup-panel" style="text-align:center"><h2>🏆 토너먼트 우승!</h2>
                  <p style="color:var(--dim);margin:12px 0 20px">칭호: 어둠의 판의 챔피언 (누적 트로피 ${this.save.trophies})</p>
                  <button class="btn primary" id="back">타이틀로</button></div>`;
                el.querySelector('#back')!.addEventListener('click', () => this.showTitle());
                this.setScreen(el);
                return;
              }
            } else {
              renderBracket();
              return;
            }
            renderBracket();
          } else {
            playMatch();
          }
        });
      };
      playMatch();
    };
    renderBracket();
  }
}

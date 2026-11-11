import { deckSettingsScreen } from './deckSettings';
import { audioSaveWarning, musicEnabled, setMusic } from './audio';
import { guideScreen } from './guide';
import { loadSave, refreshSave, store } from '../data/save';
import { loadTournament, tournamentSession } from '../data/tournamentSave';
import { Tournament } from '../engine/tournament';
import { Opponent, OPPONENTS } from '../data/opponents';
import { GameScreen, MatchResult } from './gameScreen';

const BASE = import.meta.env.BASE_URL;
export class App {
  private root: HTMLElement;
  private save = loadSave();
  private saveAvailable = store(this.save);
  private persistSave(){this.saveAvailable=store(this.save);}
  private keyboardNavigation = false;

  constructor() {
    this.root = document.getElementById('app')!;
    this.root.addEventListener('keydown',()=>{this.keyboardNavigation=true;},true);
    this.root.addEventListener('pointerdown',()=>{this.keyboardNavigation=false;},true);
    this.showTitle();
  }

  private setScreen(el: HTMLElement) {
    this.root.innerHTML = '';
    this.root.appendChild(el);
    if(this.keyboardNavigation){const target=el.matches('[role=button]')?el:el.querySelector<HTMLElement>('h2,button,[role=button]');if(target){if(!target.matches('button,[role=button]'))target.tabIndex=-1;target.focus();}}
    if(!this.saveAvailable){const notice=document.createElement('div');notice.className='save-warning';notice.textContent='이 브라우저에서는 진행을 저장할 수 없습니다.';el.appendChild(notice);}
  }
  private mk(id: string, cls = 'screen'): HTMLElement {
    const el = document.createElement('div');
    el.id = id; el.className = cls;
    return el;
  }

  showTitle() {
    this.save=refreshSave(this.save,!this.saveAvailable);
    const el = this.mk('title-screen');
    el.style.backgroundImage = `url(${BASE}assets/keyart.webp)`;
    el.innerHTML = `<div class="title-inner">
      <h1 class="game-title">맞고2026 : 패담</h1>
      <div class="game-sub">12인의 고수</div>
      <div class="menu">
        <button class="btn primary" id="m-scenario">시나리오 - 밑바닥에서 전설로</button>
        <button class="btn" id="m-tournament">${loadTournament()?'토너먼트 이어하기':'토너먼트'}</button>
        <button class="btn" id="m-free">자유 대국</button>
        <button class="btn small" id="m-settings">설정 · 화투패</button><button class="btn small" id="m-guide">게임 방법 · 패 도감 · 기록</button><button class="btn small music-choice" id="m-music" aria-pressed="${musicEnabled()}">배경음악 ${musicEnabled()?'켬':'끔'}</button>
      <p class="audio-save-status" role="status" aria-live="polite">${audioSaveWarning()}</p></div></div>`;
    el.querySelector('#m-music')!.addEventListener('click',(event)=>{setMusic(!musicEnabled());const button=event.currentTarget as HTMLButtonElement;button.textContent=`배경음악 ${musicEnabled()?'켬':'끔'}`;button.setAttribute('aria-pressed',String(musicEnabled()));el.querySelector('.audio-save-status')!.textContent=audioSaveWarning();});
    el.querySelector('#m-scenario')!.addEventListener('click', () => this.showScenario());
    el.querySelector('#m-tournament')!.addEventListener('click', () => this.showTournament());
    el.querySelector('#m-free')!.addEventListener('click', () => this.showFreePlay());
    el.querySelector('#m-settings')!.addEventListener('click',()=>this.setScreen(deckSettingsScreen(()=>this.showTitle())));
    el.querySelector('#m-guide')!.addEventListener('click',()=>this.setScreen(guideScreen(()=>this.showTitle(),refreshSave(this.save,!this.saveAvailable),this.saveAvailable)));
    this.setScreen(el);
  }

  showScenario() {
    this.save=refreshSave(this.save,!this.saveAvailable);
    const el = this.mk('scenario-screen');
    const maxOpen = Math.max(1, ...this.save.clearedStages.map((s) => s + 1), 1);
    el.innerHTML = `<div class="screen-head"><h2>시나리오 - 밑바닥에서 전설로</h2><span class="sub">12인의 고수를 순서대로 꺾어라</span></div><nav class="roster-navigation" aria-label="시나리오 이동"><span>시나리오</span><button class="btn small" id="back">← 타이틀</button></nav>
      <div class="stage-grid"></div>`;
    const grid = el.querySelector('.stage-grid')!;
    for (const o of OPPONENTS) {
      const locked = o.stage > maxOpen;
      const cleared = this.save.clearedStages.includes(o.stage);
      const card = document.createElement('div');
      card.className = `stage-card${locked ? ' locked' : ''}`;
      card.setAttribute('role','button');card.tabIndex=locked?-1:0;card.setAttribute('aria-disabled',String(locked));
      card.addEventListener('keydown',e=>{if(!locked&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
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
      el.setAttribute('aria-label',`${el.textContent?.replace(/\s+/g,' ').trim()}. Enter 키로 진행`);
    };
    render();
    el.tabIndex=0;el.setAttribute('role','button');
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
    el.addEventListener('click', () => { i++; if (i >= lines.length) next(); else render(); });
    this.setScreen(el);
  }

  startMatch(o: Opponent, mode: 'scenario' | 'free' | 'tournament', after?: (r: MatchResult) => void) {
    const gs = new GameScreen(this.root, o, (r) => {
      if (mode === 'scenario') {
        if (r.winner === 0) {
          if (!this.save.clearedStages.includes(o.stage)) this.save.clearedStages.push(o.stage);
          if(o.stage===12&&!this.save.titles.includes('패담의 새 전설'))this.save.titles.push('패담의 새 전설');
          this.save.nagariCarry = 1;
          this.persistSave();
          this.showResultDialogue(o, 'lose', () => o.stage===12?this.showEnding():this.showScenario());
        } else if (r.winner === 1) {
          this.save.nagariCarry = 1;
          this.persistSave();
          this.showResultDialogue(o, 'win', () => this.showScenario());
        } else {
          this.save.nagariCarry = Math.min(8, (this.save.nagariCarry ?? 1) * 2);
          this.persistSave();
          this.showResultDialogue(o, 'win', () => this.showScenario(), `나가리 - 다음 판 ×${this.save.nagariCarry}`);
        }
      } else if (after) {
        after(r);
      } else {
        this.showTitle();
      }
    }, mode === 'scenario' ? this.save.nagariCarry ?? 1 : 1,()=>mode==='scenario'?this.showScenario():this.showTitle());
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
    el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`${el.textContent?.replace(/\s+/g,' ').trim()}. Enter 키로 진행`);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
    el.addEventListener('click', back);
    this.setScreen(el);
  }

  private showEnding() {
    const el=this.mk('ending-screen');el.style.backgroundImage=`linear-gradient(#08060d66,#08060df5),url(${BASE}assets/keyart.webp)`;
    el.innerHTML=`<div class="ending-copy"><p class="eyebrow">THE LAST HAND</p><h2>전설은 자리를 비웠다.</h2><p>열두 개의 판을 지나, 마지막 패를 내려놓았다.<br>처음 이 골목에 들어왔을 때처럼, 두 손은 가벼웠다.</p><p>남은 것은 빚도, 왕관도 아니다.<br>다음 판 앞에서도 떨리지 않는 손.</p><strong>12인의 고수 돌파 · 패담의 새 전설</strong><button class="btn primary" id="ending-back">시나리오 목록으로</button></div>`;
    el.querySelector('#ending-back')!.addEventListener('click',()=>this.showScenario());this.setScreen(el);
  }

  showFreePlay() {
    const el = this.mk('free-screen');
    el.innerHTML = `<div class="setup-panel"><h2>자유 대국</h2>
      <div class="sub" style="color:var(--dim);font-size:13px;word-break:keep-all">12명 모두 선택할 수 있습니다. 시나리오 진행과 별개입니다.</div><nav class="roster-navigation" aria-label="자유 대국 이동"><span>상대 선택</span><button class="btn small" id="back">← 타이틀</button></nav>
      <div class="stage-grid" style="margin-top:16px"></div></div>`;
    const grid = el.querySelector('.stage-grid')!;
    for (const o of OPPONENTS) {
      const card = document.createElement('div');
      card.className = 'stage-card';card.setAttribute('role','button');card.tabIndex=0;card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}});
      card.innerHTML = `<img src="${BASE}${o.portrait}" alt="${o.name}">
        <div class="meta"><div class="name">${o.name}</div><div class="title">${o.title} · 난이도 ${o.difficulty}</div></div>`;
      card.addEventListener('click', () => this.startMatch(o, 'free'));
      grid.appendChild(card);
    }
    el.querySelector('#back')!.addEventListener('click', () => this.showTitle());
    this.setScreen(el);
  }

  showTournament() {
    const session=tournamentSession(),checkpoint=session.checkpoint;
    const t=checkpoint?.t??new Tournament(OPPONENTS);
    let carry=checkpoint?.carry??1,credited=false,checkpointSaved=false;
    const conflict=()=>{
      const el=this.mk('tournament-conflict-screen');
      el.innerHTML='<div class="setup-panel"><h2 style="word-break:keep-all">다른 탭에서 대회가 변경되었습니다</h2><p class="tourney-note" role="alert">다른 탭의 최신 기록을 보호하기 위해 이전 대진으로 계속할 수 없습니다. 이 탭의 대국 결과는 최신 기록에 덮어쓰지 않습니다. 최신 대진을 확인하고 이어해 주세요. 진행 중인 손패는 복원되지 않습니다.</p><div class="tourney-actions"><button class="btn primary" id="latest">최신 대진 확인</button><button class="btn small" id="back">타이틀로</button></div></div>';
      el.querySelector('#latest')!.addEventListener('click',()=>this.showTournament());
      el.querySelector('#back')!.addEventListener('click',()=>this.showTitle());
      this.setScreen(el);
      (el.querySelector('h2') as HTMLElement).tabIndex=-1;(el.querySelector('h2') as HTMLElement).focus();
    };
    const name=(p:import('../engine/tournament').Entrant)=>p==='ME'?'나':p.name;
    const render=(stored=session.write(t,carry))=>{
      if(stored==='conflict'){conflict();return;}
      checkpointSaved=stored==='saved';
      const el=this.mk('tournament-screen');
      const roundNames=['8강','4강','결승'];
      const history=t.history.map((r,i)=>`<div class="bracket-round"><h3>${roundNames[i]}</h3>${r.map(p=>`<div class="bracket-match"><span>${name(p.a)} <b>${p.score[0]} : ${p.score[1]}</b> ${name(p.b)}</span><small>승자: ${name(p.winner)}</small></div>`).join('')}</div>`).join('');
      const finished=t.eliminated||t.champion;
      el.innerHTML=`<div class="tourney-wrap"><div class="screen-head"><h2>토너먼트 · ${t.champion?'우승':t.eliminated?'탈락':roundNames[t.round]}</h2></div>
        <nav class="tourney-actions" aria-label="토너먼트 이동">${!finished?'<button class="btn primary" id="next">대국 시작</button>':''}<button class="btn small" id="back">타이틀로</button></nav>
        <p class="tourney-note">각 대진 3판 2승. 다른 AI 대진은 결과를 계산합니다. 토너먼트 도중 나가리는 해당 대진의 다음 판에만 이월됩니다.</p>
        ${history}
        ${!finished?`<div class="bracket-round"><h3>${roundNames[t.round]} 대진</h3>${Array.from({length:t.alive.length/2},(_,i)=>`<div class="bracket-match bracket-upcoming"><span>${name(t.alive[i*2])}</span><span class="versus">VS</span><span>${name(t.alive[i*2+1])}</span></div>`).join('')}</div>
          <p class="series">나 ${t.series[0]}승 : ${t.series[1]}승 ${t.opponent?.name} ${carry>1?` · 나가리 ×${carry}`:''}</p>`:''}
        ${t.champion?`<h3 class="champion-label">트로피 ${this.save.trophies}개 · 패담의 챔피언</h3>`:''}
        <small class="tourney-note">${finished?'대회가 종료되었습니다. 타이틀에서 토너먼트를 선택하면 새 대회를 시작합니다.':'완료한 판까지 자동 저장합니다. 타이틀이나 새로고침 후 이어할 수 있습니다. 진행 중인 한 판의 손패는 저장하지 않습니다.'}</small>
      </div>`;
      el.querySelector('#back')!.addEventListener('click',()=>this.showTitle());
      el.querySelector('#next')?.addEventListener('click',()=>{
        if(session.check()==='conflict'){conflict();return;}
        const opp=t.opponent;if(!opp)return;
        const gs=new GameScreen(this.root,opp,(r)=>{
          if(session.check()==='conflict'){conflict();return;}
          if(r.winner===null)carry=Math.min(8,carry*2);else carry=1;
          const result=t.recordPlayerGame(r.winner);
          if(result==='roundWon')carry=1;
          const stored=session.write(t,carry);if(stored==='conflict'){conflict();return;}
          if(result==='champion'&&!credited){credited=true;this.save=refreshSave(this.save,!this.saveAvailable);this.save.trophies++;if(!this.save.titles.includes('패담의 챔피언'))this.save.titles.push('패담의 챔피언');this.persistSave();}
          render(stored);
        },carry,()=>this.showTitle(),checkpointSaved);gs.start();
      });
      this.setScreen(el);
      if(!checkpointSaved){const warning=document.createElement('p');warning.className='tourney-note';warning.setAttribute('role','alert');warning.textContent='토너먼트를 저장하지 못했습니다. 새로고침하면 대진을 잃을 수 있습니다.';el.querySelector('.tourney-wrap')!.appendChild(warning);}
    };
    render();
  }
}

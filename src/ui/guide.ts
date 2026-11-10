import { loadSave } from '../data/save';
import { buildDeck, MONTH_NAME } from '../engine/cards';
import { cardEl } from './cards';
export function guideScreen(back:()=>void):HTMLElement {
 const el=document.createElement('div');el.className='screen guide-screen';el.id='guide-screen';
 el.innerHTML=`<div class="guide-wrap"><header><p class="eyebrow">HOW TO PLAY</p><h2>판에 들어가기 전에</h2><p class="guide-lead">같은 월의 패를 모아 7점. 더 갈지, 지금 멈출지.</p></header>
 <nav class="guide-tabs" aria-label="안내 항목"><button class="btn small" data-tab="rules">게임 방법</button><button class="btn small" data-tab="deck">48장 도감</button><button class="btn small" data-tab="credits">제작·기록</button></nav><div id="guide-content"></div><button class="btn small guide-back">← 타이틀</button></div>`;
 const content=el.querySelector('#guide-content')!;
 const show=(tab:string)=>{
  el.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.tab===tab)));
  if(tab==='deck'){
   content.innerHTML=`<p class="guide-note">같은 월은 네 장씩입니다. 금색은 광, 시안은 열끗, 보라는 띠. 등급과 월은 패에도 적혀 있습니다.</p><div class="deck-guide"></div>`;
   const deck=buildDeck(),grid=content.querySelector('.deck-guide')!;
   for(let m=1;m<=12;m++){
    const section=document.createElement('section');section.innerHTML=`<h3>${m}월 · ${MONTH_NAME[m]}</h3><div class="deck-row"></div>`;
    for(const c of deck.filter(c=>c.month===m)){const card=cardEl(c);card.removeAttribute('role');card.removeAttribute('tabindex');section.querySelector('.deck-row')!.appendChild(card);}grid.appendChild(section);
   }
  }else if(tab==='credits'){
   const saved=loadSave();
   content.innerHTML=`<section class="guide-block"><h3>나의 기록</h3><p>시나리오 ${saved.clearedStages?.length??0} / 12인 돌파 · 토너먼트 트로피 ${saved.trophies??0}개</p><p>${saved.titles?.join(' · ')||'아직 얻은 칭호가 없습니다.'}</p><p class="guide-note">기록은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우거나 기기를 바꾸면 이어지지 않습니다. 토너먼트 중간 대진은 저장하지 않습니다.</p></section>
   <section class="guide-block"><h3>오리지널 아트와 이야기</h3><p>12인의 고수, 장소, 키아트와 48장의 화투는 이 게임을 위해 만든 오리지널 그림입니다. 특정 작품의 캐릭터나 기존 제품의 카드 그림을 사용하지 않았습니다.</p></section>
   <section class="guide-block"><h3>사용한 외부 에셋</h3><p>Card Game sounds · HaelDB · CC0<br>UI Audio / Particle Pack · Kenney · CC0</p><p class="guide-links"><a href="https://opengameart.org/content/card-game-sounds" target="_blank" rel="noopener">효과음 원본 ↗</a> <a href="https://kenney.nl/assets/ui-audio" target="_blank" rel="noopener">UI Audio ↗</a> <a href="https://kenney.nl/assets/particle-pack" target="_blank" rel="noopener">Particle Pack ↗</a></p></section>
   <section class="guide-block"><h3>개발판 안내</h3><p>싱글 플레이 전용. 실제 돈·구매·현금 보상은 없습니다. 규칙과 연출은 검증·개선 중입니다.</p></section>`;
  }else{
   content.innerHTML=`<section class="guide-block"><h3>01 · 내 패를 한 장 내세요</h3><p>바닥에 같은 월이 있으면 가져옵니다. 같은 월 두 장 중에는 원하는 패를 고릅니다. 낸 다음 더미에서 한 장을 자동으로 뒤집고, 같은 방법으로 짝을 맞춥니다.</p><p>손패를 누르거나 키보드 Tab으로 이동해 Enter / Space로 냅니다. 가져올 패 선택 화면에서도 같은 방법을 씁니다. 좁은 화면은 대국판 안을 세로로 스크롤할 수 있습니다.</p></section>
   <section class="guide-block"><h3>02 · 족보를 모아 7점</h3><dl class="rule-list"><dt>광</dt><dd>삼광 3점, 비삼광 2점, 사광 4점, 오광 15점</dd><dt>열끗</dt><dd>5장부터 1점, 한 장마다 +1. 2·4·8월 새 열끗은 고도리 5점. 7장 이상이면 멍따 ×2</dd><dt>띠</dt><dd>5장부터 1점, 한 장마다 +1. 홍단(1·2·3월), 청단(6·9·10월), 초단(4·5·7월)은 각각 3점</dd><dt>피</dt><dd>10단위부터 1점, 한 단위마다 +1. 11·12월 쌍피는 2단위. 국진은 열끗 또는 쌍피로 유리하게 자동 계산</dd></dl></section>
   <section class="guide-block"><h3>03 · 고 또는 스톱</h3><p>7점 이상이면 선택합니다. 고를 부르면 계속하고, 다음 점수 상승 때 다시 선택합니다. 1·2고는 +1점씩, 3고부터 (기본 점수 + 고 횟수) ×2, ×4, ×8…입니다. 상대가 먼저 스톱하면 고박 ×2입니다.</p><p>최종 정산에서 국진은 7점 승리 조건을 유지하면서 승자의 최종 점수를 높이는 쪽으로 자동 계산합니다. 패자는 피박을 피할 수 있으면 국진을 쌍피로 셉니다.</p></section>
   <section class="guide-block"><h3>배수와 특별한 패</h3><p>피로 점수를 낸 승자와 피 7단위 이하 패자: 피박 ×2 (0장도 포함). 광 점수를 낸 승자와 광 없는 패자: 광박 ×2. 흔들기·폭탄은 해당 월당 한 번 ×2. 배수는 겹치면 곱합니다.</p><p>같은 월 세 장을 들고 바닥에 그 월이 없으면 흔들기, 나머지 한 장이 바닥에 있으면 폭탄입니다. 폭탄 뒤에는 빈패 버튼으로 두 차례 손패 없이 뒤집을 수 있습니다.</p><p>뻑 회수·따닥·쪽·쓸은 상대 피를 가져옵니다. 자뻑 회수는 두 장. 피를 뺏을 때는 일반 피부터 가져오며 국진은 빼앗지 않습니다. 마지막 뒤집기의 쪽·따닥·쓸에는 피를 뺏지 않습니다. 총통과 3뻑은 7점 승리로 정했습니다.</p><p>끝까지 승자가 없으면 나가리. 시나리오는 다음 판, 토너먼트는 같은 대진의 다음 판에 ×2, 최대 ×8입니다. 자유 대국은 한 판만 진행해 이월하지 않습니다.</p></section>
   <section class="guide-block"><h3>이 게임의 채택 규칙</h3><p>화투 48장, 보너스패 없음. 2인 맞고. 규칙은 서비스·지역마다 다릅니다. 이 게임의 선택을 위에 명시했습니다.</p><p class="guide-links"><a href="https://moamoang.co.kr/gostop-rules/" target="_blank" rel="noopener">맞고 룰·점수 계산 ↗</a> <a href="https://mgostop.hangame.com/guide/combine/02_03_rule.html" target="_blank" rel="noopener">한게임 족보 안내 ↗</a></p></section>`;
  }
 };
 el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>show((b as HTMLElement).dataset.tab!)));
 el.querySelector('.guide-back')!.addEventListener('click',back);show('rules');return el;
}

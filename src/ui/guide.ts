import { OPPONENTS } from '../data/opponents';
import { PROFILES } from '../data/profiles';
import { focusDialog } from './dialog';
const BASE=import.meta.env.BASE_URL;
import { loadSave, SaveData } from '../data/save';
import { buildDeck, MONTH_NAME } from '../engine/cards';
import { cardEl } from './cards';
import { cardFallbackLines } from '../data/cardFallback';
export function guideScreen(back:()=>void, sessionSave?:SaveData, saved=true):HTMLElement {
 const el=document.createElement('div');el.className='screen guide-screen';el.id='guide-screen';
 el.innerHTML=`<div class="guide-wrap"><header><p class="eyebrow">HOW TO PLAY</p><h2>판에 들어가기 전에</h2><p class="guide-lead">같은 월의 패를 모아 7점. 더 갈지, 지금 멈출지.</p></header>
 <div class="guide-navigation"><div class="guide-nav-head"><span>안내 항목</span><button class="btn small guide-back">← 타이틀</button></div><nav class="guide-tabs" aria-label="안내 항목"><button class="btn small" data-tab="rules">게임 방법</button><button class="btn small" data-tab="deck">48장 도감</button><button class="btn small" data-tab="rivals">고수 열전</button><button class="btn small" data-tab="credits">제작·기록</button></nav><div class="deck-month-navigation" hidden><label for="deck-month">찾을 월</label><select id="deck-month">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}월 · ${MONTH_NAME[i+1]}</option>`).join('')}</select><button class="btn small" id="deck-month-go">이동</button></div></div><div id="guide-content"></div></div>`;
 const content=el.querySelector('#guide-content')!;
 const monthNavigation=el.querySelector<HTMLElement>('.deck-month-navigation')!;
 const show=(tab:string)=>{
  monthNavigation.hidden=tab!=='deck';
  const openRival=(index:number,origin:HTMLElement)=>{
  const ov=document.createElement('div');ov.className='rival-overlay';ov.setAttribute('aria-label','고수 열전');
  const render=(action:'close'|'prev'|'next'='close')=>{const o=OPPONENTS[index],p=PROFILES[index];ov.innerHTML=`<div class="rival-dossier"><div class="rival-controls"><button class="btn small" data-action="prev" aria-label="이전 고수">◀</button><span>${index+1} / 12</span><button class="btn small" data-action="next" aria-label="다음 고수">▶</button><button class="btn small" data-action="close">닫기</button></div><div class="rival-detail"><img src="${BASE}assets/characters/fullbody/opp-${String(o.stage).padStart(2,'0')}.webp" alt="${o.name} 전신 일러스트"><section><p class="eyebrow">${p[0]}</p><h3>${o.name} <small>${o.title}</small></h3><p>${p[1]}</p><p class="guide-note">${p[2]}</p><blockquote>"${o.intro[0]}"</blockquote></section></div></div>`;
   ov.querySelector('[data-action=prev]')!.addEventListener('click',()=>{index=(index+11)%12;render('prev');});ov.querySelector('[data-action=next]')!.addEventListener('click',()=>{index=(index+1)%12;render('next');});ov.querySelector('[data-action=close]')!.addEventListener('click',close);ov.querySelector<HTMLElement>(`[data-action=${action}]`)?.focus({preventScroll:true});
  };
  const close=()=>{ov.remove();origin.focus();};render();el.appendChild(ov);focusDialog(ov,ov.querySelector<HTMLElement>('[data-action=close]'),close);
 };
 el.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.tab===tab)));
  if(tab==='deck'){
   content.innerHTML=`<p class="guide-note">같은 월은 네 장씩입니다. 화투 고유의 붉은색·검정·초록 도상을 사용합니다. 월별 도상과 광·열끗·띠·피 구성을 함께 확인하세요.</p><div class="deck-guide"></div>`;
   const deck=buildDeck(),grid=content.querySelector('.deck-guide')!;
   for(let m=1;m<=12;m++){
    const section=document.createElement('section');section.dataset.month=String(m);section.innerHTML=`<h3 tabindex="-1">${m}월 · ${MONTH_NAME[m]}</h3><div class="deck-row"></div>`;
    for(const c of deck.filter(c=>c.month===m)){
     const figure=document.createElement('figure');figure.className='deck-card-entry';figure.dataset.cardId=String(c.id);
     const card=cardEl(c);card.removeAttribute('tabindex');figure.appendChild(card);
     const caption=document.createElement('figcaption');caption.setAttribute('aria-hidden','true');
     const lines=cardFallbackLines(c);for(const text of lines.slice(1,3).filter(Boolean)){const line=document.createElement('span');line.textContent=text;caption.appendChild(line);}
     figure.appendChild(caption);section.querySelector('.deck-row')!.appendChild(figure);
    }grid.appendChild(section);
   }
  }else if(tab==='rivals'){
   content.innerHTML='<p class="guide-note">열두 개의 판, 열두 명의 고수. 인물을 눌러 전신 일러스트와 이야기를 보세요. 모두 오리지널 캐릭터입니다. 같은 난이도의 상대는 공통 AI 규칙을 사용하며 아래 배경은 이야기 설정입니다.</p><div class="rival-gallery"></div>';
   const gallery=content.querySelector('.rival-gallery')!;
   OPPONENTS.forEach((o,i)=>{const button=document.createElement('button');button.className='rival-entry';button.innerHTML=`<img loading="lazy" src="${BASE}assets/characters/fullbody/opp-${String(o.stage).padStart(2,'0')}.webp" alt="${o.name} 전신"><span>${o.stage}. ${o.name}</span><small>${o.title}</small>`;button.addEventListener('click',()=>openRival(i,button));gallery.appendChild(button);});
  }else if(tab==='credits'){
   const records=sessionSave??loadSave();
   content.innerHTML=`<section class="guide-block"><h3>나의 기록</h3>${!saved?'<p role="alert" class="pending-record-warning">저장되지 않은 세션 기록입니다. 저장하지 못한 최신 기록은 새로고침하거나 닫으면 사라질 수 있습니다.</p>':''}<p>시나리오 ${records.clearedStages?.length??0} / 12인 돌파 · 토너먼트 트로피 ${records.trophies??0}개</p><p>${records.titles?.join(' · ')||'아직 얻은 칭호가 없습니다.'}</p><p class="guide-note">기록은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우거나 기기를 바꾸면 이어지지 않습니다. 토너먼트는 완료한 판까지 대진·승수를 자동 저장합니다. 진행 중인 한 판의 손패는 저장하지 않습니다.</p></section>
   <section class="guide-block"><h3>오리지널 아트와 이야기</h3><p>12인의 고수, 장소, 키아트, 누아르·코믹·심플 화투패는 이 게임을 위해 만든 오리지널 그림입니다. 특정 작품의 캐릭터를 가져오지 않았습니다.</p></section>
   <section class="guide-block"><h3>클래식 화투패 출처</h3><p>Marcus Richert · Louie Mantia Jr., SVG 최적화 Spenĉjo. CC BY-SA 4.0. 공개 도안을 크롭·WebP 변환하고 한국식11·12월 및 게임의 패 순서를 적용했습니다. 해당 이미지에 같은 라이선스가 적용됩니다.</p><p class="guide-links"><a href="https://commons.wikimedia.org/wiki/File:Hwatu_overview.svg" target="_blank" rel="noopener">클래식 원본 ↗</a> <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0 ↗</a></p></section><section class="guide-block"><h3>사용한 외부 에셋</h3><p>Hit Animation · Sinestesia · CC0<br>2DFX Impact · Inguz Media / Esteban Díaz · CC0 선택<br>AlotofImpacts - 6 Frame Impacts - 4 Additional variations · JoesAlotofthings · CC-BY 4.0<br>타격 효과 3종: 투명 여백 크롭·크기·WebP·재생 속도 조정<br>Card Game sounds · HaelDB · CC0<br>UI Audio / Particle Pack · Kenney · CC0<br>tension and distress · allen yatsura · CC0 (음량 조절·OGG 변환)</p><p class="guide-links"><a href="https://opengameart.org/content/hit-animation-frame-by-frame" target="_blank" rel="noopener">A 타격 효과 원본 ↗</a> <a href="https://opengameart.org/content/2dfx-impact-spritesheets" target="_blank" rel="noopener">B 원본 ↗</a> <a href="https://opengameart.org/content/alotofimpacts-6-frame-impacts-4-additional-variations" target="_blank" rel="noopener">C 원본 ↗</a> <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">C 라이선스 CC-BY 4.0 ↗</a> <a href="https://opengameart.org/content/card-game-sounds" target="_blank" rel="noopener">효과음 원본 ↗</a> <a href="https://kenney.nl/assets/ui-audio" target="_blank" rel="noopener">UI Audio ↗</a> <a href="https://kenney.nl/assets/particle-pack" target="_blank" rel="noopener">Particle Pack ↗</a> <a href="https://opengameart.org/content/tension-and-distress" target="_blank" rel="noopener">배경음악 ↗</a></p></section>
   <section class="guide-block"><h3>개발판 안내</h3><p>싱글 플레이 전용. 실제 돈·구매·현금 보상은 없습니다. 규칙과 연출은 검증·개선 중입니다.</p></section>`;
  }else{
   content.innerHTML=`<section class="guide-block"><h3>01 · 내 패를 한 장 내세요</h3><p>바닥에 같은 월이 있으면 가져옵니다. 같은 월 두 장 중에는 원하는 패를 고릅니다. 낸 다음 더미에서 한 장을 자동으로 뒤집고, 같은 방법으로 짝을 맞춥니다.</p><p>손패를 누르거나 키보드 Tab으로 이동해 Enter / Space로 냅니다. 가져올 패 선택 화면에서도 같은 방법을 씁니다. 좁은 화면은 대국판 안을 세로로 스크롤할 수 있습니다. 내 차례 · 손패 보기 버튼은 패를 내지 않고 손패 위치로 이동합니다. 먹은 패·점수 버튼으로 패를 크게 볼 수 있습니다. 손패에 마우스나 키보드 포커스를 두면 같은 월 바닥 위치를 표시합니다. 내 차례의 나가기 버튼은 확인 후 현재 판을 종료하며, 이미 저장한 기록은 유지합니다. 타이틀의 배경음악은 처음에는 꺼져 있으며, 대국 중 소리 끔은 음악도 멈춥니다.</p></section>
   <section class="guide-block"><h3>02 · 족보를 모아 7점</h3><dl class="rule-list"><dt>광</dt><dd>삼광 3점, 비삼광 2점, 사광 4점, 오광 15점</dd><dt>열끗</dt><dd>5장부터 1점, 한 장마다 +1. 2·4·8월 새 열끗은 고도리 5점. 7장 이상이면 멍따 ×2</dd><dt>띠</dt><dd>5장부터 1점, 한 장마다 +1. 홍단(1·2·3월), 청단(6·9·10월), 초단(4·5·7월)은 각각 3점</dd><dt>피</dt><dd>10단위부터 1점, 한 단위마다 +1. 11·12월 쌍피는 2단위. 국진은 열끗 또는 쌍피로 유리하게 자동 계산</dd></dl></section>
   <section class="guide-block"><h3>03 · 고 또는 스톱</h3><p>7점 이상이면 선택합니다. 고를 부르면 계속하고, 다음 점수 상승 때 다시 선택합니다. 1·2고는 +1점씩, 3고부터 (기본 점수 + 고 횟수) ×2, ×4, ×8…입니다. 상대가 먼저 스톱하면 고박 ×2입니다.</p><p>최종 정산에서 국진은 7점 승리 조건을 유지하면서 승자의 최종 점수를 높이는 쪽으로 자동 계산합니다. 패자는 피박을 피할 수 있으면 국진을 쌍피로 셉니다.</p></section>
   <section class="guide-block"><h3>배수와 특별한 패</h3><p>피로 점수를 낸 승자와 피 7단위 이하 패자: 피박 ×2 (0장도 포함). 광 점수를 낸 승자와 광 없는 패자: 광박 ×2. 흔들기·폭탄은 해당 월당 한 번 ×2. 배수는 겹치면 곱합니다.</p><p>같은 월 세 장을 들고 바닥에 그 월이 없으면 흔들기, 나머지 한 장이 바닥에 있으면 폭탄입니다. 폭탄 뒤에는 빈패 버튼으로 두 차례 손패 없이 뒤집을 수 있습니다.</p><p>뻑 회수·따닥·쪽·쓸은 상대 피를 가져옵니다. 자뻑 회수는 두 장. 피를 뺏을 때는 일반 피부터 가져오며 국진은 빼앗지 않습니다. 마지막 뒤집기의 쪽·따닥·쓸에는 피를 뺏지 않습니다. 총통과 3뻑은 7점 승리로 정했습니다.</p><p>끝까지 승자가 없으면 나가리. 시나리오는 다음 판, 토너먼트는 같은 대진의 다음 판에 ×2, 최대 ×8입니다. 자유 대국은 한 판만 진행해 이월하지 않습니다.</p></section>
   <section class="guide-block"><h3>이 게임의 채택 규칙</h3><p>화투 48장, 보너스패 없음. 2인 맞고. 규칙은 서비스·지역마다 다릅니다. 이 게임의 선택을 위에 명시했습니다.</p><p class="guide-links"><a href="https://moamoang.co.kr/gostop-rules/" target="_blank" rel="noopener">맞고 룰·점수 계산 ↗</a> <a href="https://mgostop.hangame.com/guide/combine/02_03_rule.html" target="_blank" rel="noopener">한게임 족보 안내 ↗</a></p></section>`;
  }
 };
 el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  show((b as HTMLElement).dataset.tab!);
  const navigation=el.querySelector<HTMLElement>('.guide-navigation')!;
  // New sections start below the pinned controls, not at the old section's scroll depth.
  el.scrollTop+=content.getBoundingClientRect().top-navigation.offsetHeight-20;
  (b as HTMLElement).focus({preventScroll:true});
 }));
 el.querySelector('#deck-month-go')!.addEventListener('click',()=>{
  const month=(el.querySelector('#deck-month') as HTMLSelectElement).value;
  const heading=content.querySelector<HTMLElement>(`[data-month="${month}"] h3`);
  if(!heading)return;
  heading.focus({preventScroll:true});
  el.scrollTop+=heading.getBoundingClientRect().top-el.querySelector<HTMLElement>('.guide-navigation')!.getBoundingClientRect().bottom-8;
 });
 el.querySelector('.guide-back')!.addEventListener('click',back);show('rules');return el;
}

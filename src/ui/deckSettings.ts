import { effectSettingsPanel } from './effectSettings';
import { cardDescription } from '../data/cardDescription';
import { buildDeck } from '../engine/cards';
export const DECKS=[{id:'original',name:'누아르',description:'처음 제작한 누아르 웹툰 그림.'},{id:'classic',name:'클래식',description:'익숙한 한국식 화투. 흰 바탕과 검정 도상, 빨간 테두리.'},{id:'comic',name:'코믹',description:'굵은 윤곽선과 망점, 익살스러운 새와 동물.'},{id:'minimal',name:'심플',description:'넓은 여백과 큰 도상으로 알아보기 쉬운 그림.'}] as const;
export type DeckId=typeof DECKS[number]['id'];
const KEY='gostop2026-deck';
export function selectedDeck():DeckId{try{const s=localStorage.getItem(KEY);return DECKS.find(d=>d.id===s)?.id??'classic';}catch{return 'classic';}}
export function deckCardUrl(id:number,deck:DeckId=selectedDeck()):string{return `${import.meta.env.BASE_URL}assets/cards/${deck==='original'?'':deck+'/'}card-${String(id).padStart(2,'0')}.webp`;}
export function deckSettingsScreen(back:()=>void):HTMLElement{
 const el=document.createElement('div');el.className='screen deck-settings';el.id='settings-screen';let preview=selectedDeck();
 const render=()=>{
  el.innerHTML=`<div class="settings-wrap"><h2>설정 · 화투패와 이펙트</h2><p>패의 그림만 바뀝니다. 48장 구성과 점수·규칙은 같습니다. 기본 패는 클래식입니다. 직접 고른 패는 계속 유지됩니다.</p><div class="deck-options" role="group" aria-label="화투패 디자인">${DECKS.map(d=>`<button class="deck-option ${d.id===preview?'selected':''}" data-deck="${d.id}" aria-pressed="${d.id===preview}"><img src="${deckCardUrl(0,d.id)}" alt="${d.name} 1월 광"><strong>${d.name}</strong>${selectedDeck()===d.id?'<span>사용 중</span>':''}</button>`).join('')}</div><h3>${DECKS.find(d=>d.id===preview)!.name} 미리보기</h3><p>${DECKS.find(d=>d.id===preview)!.description}</p><div class="deck-setting-actions"><button class="btn primary" id="deck-apply">${DECKS.find(d=>d.id===preview)!.name} 사용하기</button><button class="btn small" id="settings-back">← 타이틀</button><p id="deck-status" role="status" aria-live="polite"></p></div>${preview==='classic'?'<p class="deck-credit">도안: Marcus Richert · Louie Mantia Jr. · 최적화: Spenĉjo. <a href="https://commons.wikimedia.org/wiki/File:Hwatu_overview.svg" target="_blank" rel="noopener">원본</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. 크롭·WebP 변환 및 한국식 월 순서 적용.</p>':''}<div class="deck-preview-grid">${buildDeck().map(c=>`<img src="${deckCardUrl(c.id,preview)}" alt="${cardDescription(c)}" loading="lazy">`).join('')}</div></div>`;
  el.querySelector('.deck-preview-grid')!.before(effectSettingsPanel());
  el.querySelectorAll<HTMLElement>('[data-deck]').forEach(b=>b.addEventListener('click',()=>{preview=b.dataset.deck as DeckId;render();el.querySelector<HTMLElement>(`[data-deck=${preview}]`)?.focus();}));
  el.querySelector('#deck-apply')!.addEventListener('click',()=>{try{localStorage.setItem(KEY,preview);el.querySelectorAll<HTMLElement>('[data-deck]').forEach(button=>{button.querySelector('span')?.remove();if(button.dataset.deck===preview){const badge=document.createElement('span');badge.textContent='사용 중';button.appendChild(badge);}});el.querySelector('#deck-status')!.textContent='선택한 패를 저장했습니다. 다음 대국부터 적용됩니다.';(el.querySelector('#deck-apply') as HTMLElement).focus({preventScroll:true});}catch{el.querySelector('#deck-status')!.textContent='패 선택을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';}});
  el.querySelector('#settings-back')!.addEventListener('click',back);
 };render();return el;
}

import { buildDeck } from '../engine/cards';
export const DECKS=[{id:'original',name:'누아르',description:'현재 사용 중인 웹툰 그림. 기본값은 변경하지 않았습니다.'},{id:'classic',name:'클래식',description:'흰 바탕, 붉은 띠와 검정 테두리, 전통 도상의 배치.'},{id:'comic',name:'코믹',description:'굵은 윤곽선과 망점, 표정이 있는 식물과 말풍선.'},{id:'minimal',name:'심플',description:'여백과 큰 월·종류 표기, 식물과 득점 도상을 분리한 배치.'}] as const;
export type DeckId=typeof DECKS[number]['id'];
const KEY='gostop2026-deck';
export function selectedDeck():DeckId{try{const s=localStorage.getItem(KEY);return DECKS.find(d=>d.id===s)?.id??'original';}catch{return 'original';}}
export function deckCardUrl(id:number,deck:DeckId=selectedDeck()):string{return `${import.meta.env.BASE_URL}assets/cards/${deck==='original'?'':deck+'/'}card-${String(id).padStart(2,'0')}.webp`;}
export function deckSettingsScreen(back:()=>void):HTMLElement{
 const el=document.createElement('div');el.className='screen deck-settings';el.id='settings-screen';let preview=selectedDeck();
 const render=()=>{
  el.innerHTML=`<div class="settings-wrap"><h2>설정 · 화투패</h2><p>패의 그림만 바뀝니다. 48장 구성과 점수·규칙은 같습니다. 현재 기본 패는 누아르이며, 새 기본값은 직접 플레이한 뒤 정합니다.</p><div class="deck-options" role="group" aria-label="화투패 디자인">${DECKS.map(d=>`<button class="deck-option ${d.id===preview?'selected':''}" data-deck="${d.id}" aria-pressed="${d.id===preview}"><img src="${deckCardUrl(0,d.id)}" alt="${d.name} 1월 광"><strong>${d.name}</strong>${selectedDeck()===d.id?'<span>사용 중</span>':''}</button>`).join('')}</div><h3>${DECKS.find(d=>d.id===preview)!.name} 미리보기</h3><p>${DECKS.find(d=>d.id===preview)!.description}</p><div class="deck-setting-actions"><button class="btn primary" id="deck-apply">이 패 사용하기</button><button class="btn small" id="settings-back">← 타이틀</button></div><p id="deck-status" role="status" aria-live="polite"></p><div class="deck-preview-grid">${buildDeck().map(c=>`<img src="${deckCardUrl(c.id,preview)}" alt="${c.label} ${c.kind} ${c.piValue===2?'쌍피':''}" loading="lazy">`).join('')}</div></div>`;
  el.querySelectorAll<HTMLElement>('[data-deck]').forEach(b=>b.addEventListener('click',()=>{preview=b.dataset.deck as DeckId;render();el.querySelector<HTMLElement>(`[data-deck=${preview}]`)?.focus();}));
  el.querySelector('#deck-apply')!.addEventListener('click',()=>{try{localStorage.setItem(KEY,preview);render();el.querySelector('#deck-status')!.textContent='선택한 패를 저장했습니다. 다음 대국부터 적용됩니다.';(el.querySelector('#deck-apply') as HTMLElement).focus();}catch{el.querySelector('#deck-status')!.textContent='패 선택을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';}});
  el.querySelector('#settings-back')!.addEventListener('click',back);
 };render();return el;
}

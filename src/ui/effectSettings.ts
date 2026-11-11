export const EFFECTS=[
 {id:'a',name:'A 금빛 파열',description:'날카로운 금빛 타격과 잔광.',author:'Sinestesia',license:'CC0',source:'https://opengameart.org/content/hit-animation-frame-by-frame',file:'sinestesia-hit',frames:16,columns:4,rows:4,peak:7},
 {id:'b',name:'B 광구·불꽃',description:'둥근 충격파와 불꽃 파편.',author:'Inguz Media / Esteban Díaz',license:'CC0',source:'https://opengameart.org/content/2dfx-impact-spritesheets',file:'inguz-impact',frames:64,columns:8,rows:8,peak:17},
 {id:'c',name:'C 짧은 섬광',description:'흰빛 코어가 강하게 터지는 짧은 섬광.',author:'JoesAlotofthings',license:'CC-BY 4.0',source:'https://opengameart.org/content/alotofimpacts-6-frame-impacts-4-additional-variations',file:'joes-yellow',frames:6,columns:3,rows:2,peak:3},
] as const;
export type EffectId=typeof EFFECTS[number]['id'];
const KEY='gostop2026-impact';
let session:EffectId|undefined;
export function selectedEffect():EffectId{if(session)return session;try{return EFFECTS.find(e=>e.id===localStorage.getItem(KEY))?.id??'a';}catch{return 'a';}}
export function effectUrl(file:string){return `${import.meta.env.BASE_URL}assets/effects/${file}.webp`;}
export function effectDefinition(){return EFFECTS.find(e=>e.id===selectedEffect())!;}
export function saveEffect(id:EffectId){session=id;try{localStorage.setItem(KEY,id);return true;}catch{return false;}}
export function effectSettingsPanel():HTMLElement{
 const section=document.createElement('section');section.className='effect-settings';section.setAttribute('aria-labelledby','impact-title');
 const render=()=>{
  section.innerHTML=`<h3 id="impact-title">타격 이펙트</h3><p>기본값은 A입니다. 효과만 바뀌며 규칙과 턴 길이는 같습니다. 움직임 줄이기 설정에서는 모두 생략합니다.</p><div class="effect-options" role="group" aria-label="타격 이펙트 선택">${EFFECTS.map(e=>`<button class="effect-option ${e.id===selectedEffect()?'selected':''}" data-effect="${e.id}" aria-pressed="${e.id===selectedEffect()}"><span class="effect-thumb" aria-hidden="true" style="background-image:url('${effectUrl(e.file)}');background-size:${e.columns*100}% ${e.rows*100}%;background-position:${e.peak%e.columns*100/(e.columns-1)}% ${Math.floor(e.peak/e.columns)*100/(e.rows-1)}%"></span><strong>${e.name}</strong><span>${e.description}</span><small>${e.author} · ${e.license}</small></button>`).join('')}</div><p id="impact-status" role="status" aria-live="polite"></p><p class="deck-credit">패 주변에서만 재생합니다. 각 효과의 원본·라이선스는 게임 방법의 제작·기록에서 확인할 수 있습니다.</p>`;
  section.querySelectorAll<HTMLElement>('[data-effect]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.effect as EffectId,saved=saveEffect(id);render();section.querySelector<HTMLElement>(`[data-effect=${id}]`)?.focus();section.querySelector('#impact-status')!.textContent=saved?'선택한 효과를 저장했습니다. 다음 대국부터 적용됩니다.':'현재 화면에만 적용했습니다. 효과 선택을 저장하지 못해 새로 열면 이전 설정으로 돌아갑니다.';}));
 };render();return section;
}

import { cardDescription } from '../data/cardDescription';
import { deckCardUrl } from './deckSettings';
import { Card } from '../engine/cards';
import { cardFallbackLines } from '../data/cardFallback';

const BASE = import.meta.env.BASE_URL;
const KIND_LABEL: Record<string, string> = { gwang: '광', yeol: '열끗', tti: '띠', pi: '피' };

export function cardImageUrl(month: number): string {
  return `${BASE}assets/cards/month-${String(month).padStart(2, '0')}.webp`;
}

export function cardUrl(id: number): string { return deckCardUrl(id); }

/** Keep known public cards legible if their picture cannot be downloaded. */
export function attachCardFallback(host:HTMLElement,img:HTMLImageElement,card:Card):void {
  const show=()=>{
    if(host.querySelector('.card-fallback'))return;
    const fallback=document.createElement('div');fallback.className='card-fallback';fallback.setAttribute('aria-hidden','true');
    cardFallbackLines(card).forEach((line,index)=>{const text=document.createElement(index===0?'strong':index===3?'em':'span');text.textContent=line;fallback.appendChild(text);});
    host.appendChild(fallback);host.classList.add('card-image-failed');
  };
  img.addEventListener('error',show);
  img.addEventListener('load',()=>{host.classList.remove('card-image-failed');host.querySelector('.card-fallback')?.remove();});
  if(img.complete&&!img.naturalWidth&&img.getAttribute('src'))show();
}

export function cardEl(card: Card, opts: { big?: boolean; interactive?: boolean } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = `hcard k-${card.kind}${opts.big ? ' big' : ''}${card.piValue === 2 ? ' ssang' : ''}${card.isBi ? ' bi' : ''}${card.dan ? ` dan-${card.dan}` : ''}`;
  el.dataset.cardId = String(card.id);
  if(opts.interactive){el.setAttribute('role','button');el.tabIndex=0;}
  else el.setAttribute('role','img');
  el.setAttribute('aria-label',cardDescription(card));
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
  const img = document.createElement('img');
  attachCardFallback(el,img,card);
  img.src = cardUrl(card.id);
  img.alt = cardDescription(card);
  img.draggable = false;
  el.appendChild(img);
  // 등급별 시각 구분 레이어
  const ov = document.createElement('div');
  ov.className = 'typeov';
  el.appendChild(ov);
  const badge = document.createElement('div');
  badge.className = `badge ${card.kind}`;
  badge.textContent = card.piValue === 2 ? '쌍피' : (card.isBi ? '비광' : KIND_LABEL[card.kind]);
  el.appendChild(badge);
  const lbl = document.createElement('div');
  lbl.className = 'monthlbl';
  lbl.textContent = `${card.month}월`;
  el.appendChild(lbl);
  return el;
}

export function miniCardEl(card: Card): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'mini';
  img.src = cardUrl(card.id);
  img.alt = cardDescription(card);
  return img;
}

export function cardBackEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card-back';
  return el;
}

import { Card } from '../engine/cards';

const BASE = import.meta.env.BASE_URL;
const KIND_LABEL: Record<string, string> = { gwang: '광', yeol: '열끗', tti: '띠', pi: '피' };

export function cardImageUrl(month: number): string {
  return `${BASE}assets/cards/month-${String(month).padStart(2, '0')}.webp`;
}

export function cardEl(card: Card, opts: { big?: boolean } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = `hcard k-${card.kind}${opts.big ? ' big' : ''}`;
  el.dataset.cardId = String(card.id);
  const img = document.createElement('img');
  img.src = cardImageUrl(card.month);
  img.alt = card.label;
  img.draggable = false;
  el.appendChild(img);
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
  img.src = cardImageUrl(card.month);
  img.alt = card.label;
  return img;
}

export function cardBackEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card-back';
  return el;
}

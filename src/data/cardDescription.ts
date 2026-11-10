import { Card, MONTH_NAME } from '../engine/cards';
const kinds={gwang:'광',yeol:'열끗',tti:'띠',pi:'피'};
const ribbons={hong:'홍단',cheong:'청단',cho:'초단'};
/** Public scoring information only. Never describe an unrevealed hand card. */
export function cardDescription(card:Card):string{
 const motif=card.label.replace(/^\d+월\s*/, '').replace(/\s*(비광|쌍피|광|열끗)$/, '').trim()||MONTH_NAME[card.month];
 const grade=card.isBi?'비광':card.piValue===2?'쌍피':card.dan?`${ribbons[card.dan]} 띠`:kinds[card.kind];
 return `${card.month}월 ${motif} · ${grade}${card.isGodori?' · 고도리':''}${card.isGukjin?' · 쌍피로도 자동 계산':''}`;
}

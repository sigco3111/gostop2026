import { Card } from '../engine/cards';
const kinds={gwang:'광',yeol:'열끗',tti:'띠',pi:'피'};
const ribbons={hong:'홍단 띠',cheong:'청단 띠',cho:'초단 띠'};
/** Concise face text, derived only from the same public card as its image. */
export function cardFallbackLines(card:Card):[string,string,string,string]{
 if(card.isGukjin)return [`${card.month}월`,'국진','열끗/쌍피','그림 없음'];
 return [`${card.month}월`,card.isBi?'비광':card.piValue===2?'쌍피':card.dan?ribbons[card.dan]:kinds[card.kind],card.isGodori?'고도리':'','그림 없음'];
}

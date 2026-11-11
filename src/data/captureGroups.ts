import { Card } from '../engine/cards';
import { ScoreBreakdown } from '../engine/scoring';
export interface CaptureGroup {label:string;cards:Card[];count:number;}
/** Current scoring designation, not the printed category, determines 국진's group. */
export function captureGroups(cards:Card[],breakdown:ScoreBreakdown):CaptureGroup[]{
 const asPi=breakdown.gukjinAsPi;
 const groups:[string,Card[],number][]=[
  ['광',cards.filter(c=>c.kind==='gwang'),breakdown.counts.gwang],
  ['열끗',cards.filter(c=>c.kind==='yeol'&&(!c.isGukjin||!asPi)),breakdown.counts.yeol],
  ['띠',cards.filter(c=>c.kind==='tti'),breakdown.counts.tti],
  ['피',cards.filter(c=>c.kind==='pi'||c.isGukjin&&asPi),breakdown.counts.piUnits],
 ];
 return groups.filter(([,group])=>group.length).map(([label,group,count])=>({label,cards:group,count}));
}

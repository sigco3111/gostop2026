import { ScoreBreakdown } from '../engine/scoring';
/** Point contributions, shared by current-score detail and final settlement. */
export function scoreItems(score:ScoreBreakdown):[string,number][]{
 return ([['광',score.gwang],['고도리',score.godori],['홍단',score.hongdan],['청단',score.cheongdan],['초단',score.chodan],['열끗',score.yeol],['띠',score.tti],['피',score.pi]] as [string,number][]).filter(([,points])=>points>0);
}
export function scoreDescription(score:ScoreBreakdown):string{
 const items=scoreItems(score);
 return items.length?`점수 내역: ${items.map(([label,points])=>`${label} ${points}점`).join(' + ')} = ${score.total}점`:'아직 점수가 나는 족보가 없습니다. 현재 0점입니다.';
}

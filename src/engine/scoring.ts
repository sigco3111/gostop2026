// 점수 계산. 표준 맞고 (검증 출처: moamoang/한게임, 2026-11-10).
import { Card } from './cards';

export interface ScoreBreakdown {
  gwang: number;       // 광 점수
  godori: number;      // 고도리 5
  hongdan: number;
  cheongdan: number;
  chodan: number;
  yeol: number;        // 열끗 장수 점수
  tti: number;         // 띠 장수 점수
  pi: number;          // 피 장수 점수
  total: number;
  counts: { gwang: number; yeol: number; tti: number; piUnits: number; piCards: number };
  gukjinAsPi: boolean; // 국진을 피로 썼는지
}

// 국진(9월 열끗)은 열끗 또는 쌍피(피 2장) 중 유리한 쪽을 선택.
export function score(cards: Card[]): ScoreBreakdown {
  const gwang = cards.filter((k) => k.kind === 'gwang');
  const bi = gwang.some((k) => k.isBi);
  const yeols = cards.filter((k) => k.kind === 'yeol' && !k.isGukjin);
  const gukjin = cards.find((k) => k.isGukjin) ?? null;
  const ttis = cards.filter((k) => k.kind === 'tti');
  const pis = cards.filter((k) => k.kind === 'pi');

  function totals(gukjinAsPi: boolean): ScoreBreakdown {
    const g = gwang.length;
    let gwangScore = 0;
    if (g === 5) gwangScore = 15;
    else if (g === 4) gwangScore = 4;
    else if (g === 3) gwangScore = bi ? 2 : 3;

    const yeolCount = yeols.length + (gukjinAsPi ? 0 : gukjin ? 1 : 0);
    const godori = yeols.filter((k) => k.isGodori).length === 3 ? 5 : 0;
    const yeol = yeolCount >= 5 ? yeolCount - 4 : 0;

    const hongdan = ttis.filter((k) => k.dan === 'hong').length === 3 ? 3 : 0;
    const cheongdan = ttis.filter((k) => k.dan === 'cheong').length === 3 ? 3 : 0;
    const chodan = ttis.filter((k) => k.dan === 'cho').length === 3 ? 3 : 0;
    const tti = ttis.length >= 5 ? ttis.length - 4 : 0;

    const piUnits = pis.reduce((s, k) => s + k.piValue, 0) + (gukjinAsPi && gukjin ? 2 : 0);
    const piCards = pis.length + (gukjinAsPi && gukjin ? 1 : 0);
    const pi = piUnits >= 10 ? piUnits - 9 : 0;

    const total = gwangScore + godori + hongdan + cheongdan + chodan + yeol + tti + pi;
    return {
      gwang: gwangScore, godori, hongdan, cheongdan, chodan, yeol, tti, pi, total,
      counts: { gwang: g, yeol: yeolCount, tti: ttis.length, piUnits, piCards },
      gukjinAsPi,
    };
  }

  const asYeol = totals(false);
  if (!gukjin) return asYeol;
  const asPi = totals(true);
  return asPi.total >= asYeol.total ? asPi : asYeol;
}

export interface SettleInput {
  winner: Card[];
  loser: Card[];
  goCount: number;          // 승자의 고 횟수
  loserGoCount: number;     // 패자가 고를 했으면 고박
  shakes: number;           // 승자의 흔들기+폭탄 횟수
  nagariCarry: number;      // 이월된 나가리 배수 (1 = 없음)
}

export interface SettleResult {
  base: number;
  finalScore: number;
  multipliers: string[];    // 적용된 배수 설명
}

export function settle(input: SettleInput): SettleResult {
  const w = score(input.winner);
  const l = score(input.loser);
  const base = w.total;
  const multipliers: string[] = [];
  let mult = 1;

  // 고 점수: 1·2고 +1씩, 3고부터 ×2^(n-2)
  let goAdd = 0;
  if (input.goCount >= 3) {
    goAdd = input.goCount;
    mult *= Math.pow(2, input.goCount - 2);
    multipliers.push(`${input.goCount}고 ×${Math.pow(2, input.goCount - 2)}`);
  } else {
    goAdd = input.goCount;
  }

  // 피박: 승자가 피로 점수를 냈고 패자 피 7장(단위) 이하
  if (w.pi > 0 && l.counts.piUnits <= 7) { mult *= 2; multipliers.push('피박 ×2'); }
  // 광박: 승자 광 점수가 났고 패자 광 0장
  if (w.gwang > 0 && l.counts.gwang === 0) { mult *= 2; multipliers.push('광박 ×2'); }
  // 멍따: 승자 열끗 7장 이상
  if (w.counts.yeol >= 7) { mult *= 2; multipliers.push('멍따 ×2'); }
  // 흔들기/폭탄
  for (let i = 0; i < input.shakes; i++) { mult *= 2; }
  if (input.shakes > 0) multipliers.push(`흔들기/폭탄 ${input.shakes}회 ×${Math.pow(2, input.shakes)}`);
  // 고박: 패자가 고를 한 상태에서 짐
  if (input.loserGoCount > 0) { mult *= 2; multipliers.push('고박 ×2'); }
  // 나가리 이월
  if (input.nagariCarry > 1) { mult *= input.nagariCarry; multipliers.push(`나가리 이월 ×${input.nagariCarry}`); }

  return { base, finalScore: (base + goAdd) * mult, multipliers };
}

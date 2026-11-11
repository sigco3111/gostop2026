import type { SettleResult } from '../engine/scoring';

// Describe the exact settlement result, not a second calculation of the rules.
export function settlementDescription(result: SettleResult): string {
  const base = result.goAdd ? `(기본 ${result.base}점 + 고 ${result.goAdd}점)` : `기본 ${result.base}점`;
  const multipliers = result.multipliers.length ? result.multipliers.join(' · ') : '추가 배수 없음';
  return `${base} · ${multipliers} = ${result.finalScore}점`;
}

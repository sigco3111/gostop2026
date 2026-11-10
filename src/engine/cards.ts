// 화투 48장 정의. 표준 맞고 구성 (moamoang/한게임 기준 검증, 2026-11-10).
export type CardKind = 'gwang' | 'yeol' | 'tti' | 'pi';
export type DanType = 'hong' | 'cheong' | 'cho' | null;

export interface Card {
  id: number;          // 0..47
  month: number;       // 1..12
  kind: CardKind;
  piValue: 1 | 2;      // 쌍피 = 2 (피로 셀 때)
  dan: DanType;        // 띠의 단 종류
  isBi: boolean;       // 12월 비광
  isGodori: boolean;   // 2·4·8월 새 열끗
  isGukjin: boolean;   // 9월 국진 (열끗 or 쌍피 선택)
  label: string;       // 표시 이름
}

const MONTH_NAMES = ['', '송학', '매조', '벚꽃', '흑싸리', '난초', '모란', '홍싸리', '공산', '국화', '단풍', '오동', '비'];

let _id = 0;
function c(month: number, kind: CardKind, opt: Partial<Card> = {}): Card {
  return {
    id: _id++, month, kind,
    piValue: opt.piValue ?? 1,
    dan: opt.dan ?? null,
    isBi: opt.isBi ?? false,
    isGodori: opt.isGodori ?? false,
    isGukjin: opt.isGukjin ?? false,
    label: opt.label ?? `${month}월 ${MONTH_NAMES[month]}`,
  };
}

export function buildDeck(): Card[] {
  _id = 0;
  return [
    c(1, 'gwang', { label: '1월 송학 광' }), c(1, 'tti', { dan: 'hong' }), c(1, 'pi'), c(1, 'pi'),
    c(2, 'yeol', { isGodori: true, label: '2월 매조' }), c(2, 'tti', { dan: 'hong' }), c(2, 'pi'), c(2, 'pi'),
    c(3, 'gwang', { label: '3월 벚꽃 광' }), c(3, 'tti', { dan: 'hong' }), c(3, 'pi'), c(3, 'pi'),
    c(4, 'yeol', { isGodori: true, label: '4월 두견새' }), c(4, 'tti', { dan: 'cho' }), c(4, 'pi'), c(4, 'pi'),
    c(5, 'yeol', { label: '5월 난초 열끗' }), c(5, 'tti', { dan: 'cho' }), c(5, 'pi'), c(5, 'pi'),
    c(6, 'yeol', { label: '6월 나비' }), c(6, 'tti', { dan: 'cheong' }), c(6, 'pi'), c(6, 'pi'),
    c(7, 'yeol', { label: '7월 멧돼지' }), c(7, 'tti', { dan: 'cho' }), c(7, 'pi'), c(7, 'pi'),
    c(8, 'gwang', { label: '8월 공산 광' }), c(8, 'yeol', { isGodori: true, label: '8월 기러기' }), c(8, 'pi'), c(8, 'pi'),
    c(9, 'yeol', { isGukjin: true, label: '9월 국진' }), c(9, 'tti', { dan: 'cheong' }), c(9, 'pi'), c(9, 'pi'),
    c(10, 'yeol', { label: '10월 사슴' }), c(10, 'tti', { dan: 'cheong' }), c(10, 'pi'), c(10, 'pi'),
    c(11, 'gwang', { label: '11월 오동 광' }), c(11, 'pi'), c(11, 'pi'), c(11, 'pi', { piValue: 2, label: '11월 쌍피' }),
    c(12, 'gwang', { isBi: true, label: '12월 비광' }), c(12, 'yeol', { label: '12월 제비' }), c(12, 'tti'), c(12, 'pi', { piValue: 2, label: '12월 쌍피' }),
  ];
}

export const MONTH_NAME = MONTH_NAMES;

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

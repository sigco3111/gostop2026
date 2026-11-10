import {it,expect} from 'vitest';
import {buildDeck} from '../src/engine/cards';
import {cardDescription} from '../src/data/cardDescription';
const deck=buildDeck();
it('describes every public card without repeating its month or grade',()=>{for(const c of deck){const s=cardDescription(c);expect(s.startsWith(c.month+'월 ')).toBe(true);expect(s.match(/\d+월/g)).toHaveLength(1);expect(s).not.toMatch(/광.*광|열끗.*열끗|쌍피.*쌍피/);}});
it('names scoring ribbon sets, rain light, godori and gukjin',()=>{expect(cardDescription(deck[1])).toBe('1월 송학 · 홍단 띠');expect(cardDescription(deck[21])).toBe('6월 모란 · 청단 띠');expect(cardDescription(deck[13])).toBe('4월 흑싸리 · 초단 띠');expect(cardDescription(deck[4])).toBe('2월 매조 · 열끗 · 고도리');expect(cardDescription(deck[32])).toBe('9월 국진 · 열끗 · 쌍피로도 자동 계산');expect(cardDescription(deck[44])).toBe('12월 비 · 비광');expect(cardDescription(deck[43])).toBe('11월 오동 · 쌍피');});
it('does not mutate any card metadata',()=>{const before=JSON.stringify(deck);deck.forEach(cardDescription);expect(JSON.stringify(deck)).toBe(before);});

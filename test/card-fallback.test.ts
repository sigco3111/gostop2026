import {it,expect} from 'vitest';
import {buildDeck} from '../src/engine/cards';
import {cardFallbackLines} from '../src/data/cardFallback';
const deck=buildDeck();
it('keeps month and scoring type legible for all 48 failed card faces',()=>{for(const c of deck){const lines=cardFallbackLines(c);expect(lines[0]).toBe(`${c.month}월`);expect(lines[1].length).toBeGreaterThan(0);expect(lines[3]).toBe('그림 없음');}});
it('preserves scoring distinctions in the short fallback',()=>{expect(cardFallbackLines(deck[1])[1]).toBe('홍단 띠');expect(cardFallbackLines(deck[21])[1]).toBe('청단 띠');expect(cardFallbackLines(deck[13])[1]).toBe('초단 띠');expect(cardFallbackLines(deck[4])[2]).toBe('고도리');expect(cardFallbackLines(deck[32])).toEqual(['9월','국진','열끗/쌍피','그림 없음']);expect(cardFallbackLines(deck[43])[1]).toBe('쌍피');expect(cardFallbackLines(deck[44])[1]).toBe('비광');});
it('never changes the card to compensate for a missing picture',()=>{const before=JSON.stringify(deck);deck.forEach(cardFallbackLines);expect(JSON.stringify(deck)).toBe(before);});

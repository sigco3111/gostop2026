import { describe, it, expect } from 'vitest';
import { buildDeck } from '../src/engine/cards';
import { score, settle } from '../src/engine/scoring';
import { MatgoGame } from '../src/engine/game';

const deck = buildDeck();
const byMonth = (m: number) => deck.filter((c) => c.month === m);
const gwang = (m: number) => byMonth(m).find((c) => c.kind === 'gwang')!;

describe('덱 구성', () => {
  it('48장, 월별 4장', () => {
    expect(deck.length).toBe(48);
    for (let m = 1; m <= 12; m++) expect(byMonth(m).length).toBe(4);
  });
  it('광 5, 열끗 9, 띠 10, 피 24(쌍피 2)', () => {
    expect(deck.filter((c) => c.kind === 'gwang').length).toBe(5);
    expect(deck.filter((c) => c.kind === 'yeol').length).toBe(9);
    expect(deck.filter((c) => c.kind === 'tti').length).toBe(10);
    expect(deck.filter((c) => c.kind === 'pi').length).toBe(24);
    expect(deck.filter((c) => c.piValue === 2).length).toBe(2);
  });
});

describe('점수 계산', () => {
  it('삼광(비광 없음) 3점', () => {
    expect(score([gwang(1), gwang(3), gwang(8)]).total).toBe(3);
  });
  it('비삼광 2점', () => {
    expect(score([gwang(1), gwang(3), gwang(12)]).total).toBe(2);
  });
  it('사광 4, 오광 15', () => {
    expect(score([gwang(1), gwang(3), gwang(8), gwang(11)]).total).toBe(4);
    expect(score([gwang(1), gwang(3), gwang(8), gwang(11), gwang(12)]).total).toBe(15);
  });
  it('고도리 5점', () => {
    const godori = [2, 4, 8].map((m) => byMonth(m).find((c) => c.isGodori)!);
    expect(score(godori).total).toBe(5);
  });
  it('홍단·청단·초단 각 3점', () => {
    const dan = (t: string) => deck.filter((c) => c.dan === t);
    expect(score(dan('hong')).total).toBe(3);
    expect(score(dan('cheong')).total).toBe(3);
    expect(score(dan('cho')).total).toBe(3);
  });
  it('열끗 5장=1점, 피 10장(단위)=1점', () => {
    const yeol5 = deck.filter((c) => c.kind === 'yeol' && !c.isGukjin).slice(0, 5);
    expect(score(yeol5).yeol).toBe(1);
    const pi10 = deck.filter((c) => c.kind === 'pi' && c.piValue === 1).slice(0, 10);
    expect(score(pi10).pi).toBe(1);
  });
  it('국진은 유리한 쪽으로', () => {
    const gukjin = byMonth(9).find((c) => c.isGukjin)!;
    const pi9 = deck.filter((c) => c.kind === 'pi' && c.piValue === 1 && c.month !== 9).slice(0, 9);
    // 피 9 + 국진(피 2) = 11단위 → 2점
    expect(score([...pi9, gukjin]).pi).toBe(2);
  });
});

describe('정산 배수', () => {
  it('3고 ×2, 피박 ×2', () => {
    const winner = [...deck.filter((c) => c.kind === 'pi').slice(0, 10)];
    const loser = deck.filter((c) => c.kind === 'pi').slice(10, 15);
    const r = settle({ winner, loser, goCount: 3, loserGoCount: 0, shakes: 0, nagariCarry: 1 });
    // 피 1점 + 3고 = 4, ×2(3고) ×2(피박) = 16
    expect(r.finalScore).toBe(16);
  });
  it('광박: 패자 광 0장', () => {
    const winner = [gwang(1), gwang(3), gwang(8)];
    const loser = deck.filter((c) => c.kind === 'pi').slice(0, 8);
    const r = settle({ winner, loser, goCount: 0, loserGoCount: 0, shakes: 0, nagariCarry: 1 });
    expect(r.finalScore).toBe(6); // 삼광 3 ×2
  });
});

describe('게임 진행', () => {
  it('한 판이 정상 종료된다 (랜덤 플레이)', () => {
    let seed = 42;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const g = new MatgoGame(rnd);
    g.deal();
    let guard = 0;
    while (!g.over && guard++ < 500) {
      const p = g.turn;
      if (g.awaitingGoStop) { g.answer(p, rnd() < 0.5); continue; }
      const ch = g.awaitingChoice;
      if (ch) { g.choose(p, ch[0].id); continue; }
      const hand = g.players[p].hand;
      if (!hand.length) break;
      g.play(p, hand[Math.floor(rnd() * hand.length)].id);
    }
    expect(g.over).toBe(true);
  });
  it('총통 판은 실제 deal 이벤트로7점 승리한다', () => {
    let found=false;
    for(let seed=1;seed<2000&&!found;seed++){
      let x=seed;
      const g=new MatgoGame(()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;});
      const ev=g.deal();
      if(ev.some(e=>e.type==='chongtong')){
        expect(g.over).toBe(true);
        const end=ev.find(e=>e.type==='gameOver');
        if(end?.type==='gameOver'){expect(end.reason).toBe('총통');expect(end.result?.finalScore).toBe(7);}
        found=true;
      }
    }
    expect(found).toBe(true);
  });
});

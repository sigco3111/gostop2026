import {describe,it,expect} from 'vitest';
import {buildDeck} from '../src/engine/cards';
import {score,settle} from '../src/engine/scoring';
const d=buildDeck(),pi=d.filter(c=>c.kind==='pi'&&c.piValue===1),g=d.find(c=>c.isGukjin)!;
const opts={goCount:0,loserGoCount:0,shakes:0,nagariCarry:1};
describe('점수 경계와 국진 최종 정산',()=>{
 it('국진의 원점수 선택과 최종 배수 선택을 구분한다',()=>{
  const six=[...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori),d.find(c=>c.isGodori)!];
  expect(six).toHaveLength(6);
  const winner=[...six,g,...pi.slice(0,13)],loser=pi.slice(13,21);
  expect(score(winner).gukjinAsPi).toBe(true);
  const r=settle({...opts,winner,loser});
  expect(r.breakdown?.gukjinAsPi).toBe(false);expect(r.base).toBe(7);expect(r.finalScore).toBe(14);expect(r.multipliers).toContain('멍따 ×2');
 });
 it('정산 중 국진 전환으로7점 승리 조건을 잃으면 그 전환은 쓰지 않는다',()=>{const six=[...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori),d.find(c=>c.isGodori)!];const r=settle({...opts,winner:[...six,g,...pi.slice(0,12)],loser:pi.slice(12,20)});expect(r.base).toBe(7);expect(r.breakdown?.gukjinAsPi).toBe(true);});
 it('패자 국진은 쌍피로 피박을 피할 수 있다',()=>{
  const winner=pi.slice(0,12),loser=[...pi.slice(12,18),g,...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori)];
  expect(score(loser).gukjinAsPi).toBe(false);
  const r=settle({...opts,winner,loser});expect(r.finalScore).toBe(3);expect(r.multipliers).not.toContain('피박 ×2');
 });
 it.each([0,1,7])('피 %i단위는 이 게임의 피박 범위',n=>{
  expect(settle({...opts,winner:pi.slice(0,10),loser:pi.slice(10,10+n)}).multipliers).toContain('피박 ×2');
 });
 it('피8단위부터 피박이 아니다',()=>expect(settle({...opts,winner:pi.slice(0,10),loser:pi.slice(10,18)}).multipliers).not.toContain('피박 ×2'));
 it.each([[0,7],[1,8],[2,9],[3,20],[4,44],[5,96]])('%i고 원점수7점 정산은%i', (go,expected)=>{
  const r=settle({...opts,winner:pi.slice(0,16),loser:pi.slice(16),goCount:go});
  // 패자 피6단위이므로 피박×2를 제외한 고 점수를 확인.
  expect(r.base).toBe(7);expect(r.finalScore/2).toBe(expected);expect(r.goAdd).toBe(go);
 });
 it('고박 흔들기 나가리 배수는 곱한다',()=>{
  const r=settle({...opts,winner:pi.slice(0,10),loser:pi.slice(10),loserGoCount:1,shakes:2,nagariCarry:8});
  expect(r.finalScore).toBe(64);expect(r.multipliers).toHaveLength(3);
 });
 it('열끗과 띠는4장까지0점,5장부터1점',()=>{
  const ys=d.filter(c=>c.kind==='yeol'&&!c.isGukjin),ts=d.filter(c=>c.kind==='tti');
  for(let n=0;n<=8;n++){expect(score(ys.slice(0,n),'yeol').yeol).toBe(Math.max(0,n-4));expect(score(ts.slice(0,n)).tti).toBe(Math.max(0,n-4));}
 });
});

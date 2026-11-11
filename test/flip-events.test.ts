import {describe,it,expect} from 'vitest';
import {MatgoGame} from '../src/engine/game';
import {buildDeck} from '../src/engine/cards';
const d=buildDeck(),month=(m:number)=>d.filter(c=>c.month===m);
describe('public flip feedback events',()=>{
 it('reveals only the actual removed top card before resolving its match',()=>{
  const g=new MatgoGame(),a=month(1),b=month(2),hidden=month(3)[0];
  g.players[0].hand=[a[0]];g.floor=[a[1],b[0]];g.deck=[b[1],hidden];
  const events=g.play(0,a[0].id),flip=events.findIndex(e=>e.type==='flipped');
  expect(flip).toBeGreaterThan(0);expect(events.filter(e=>e.type==='flipped')).toEqual([{type:'flipped',player:0,card:b[1]}]);
  expect(events.slice(flip+1).some(e=>e.type==='captured'&&e.cards.some(c=>c.id===b[1].id))).toBe(true);
  expect(g.deck).toEqual([hidden]);expect(g.players[0].captured.map(c=>c.id).sort()).toEqual([a[0],a[1],b[0],b[1]].map(c=>c.id).sort());
 });
 it('does not invent a flip when the deck is empty',()=>{
  const g=new MatgoGame(),a=month(1);g.players[0].hand=[a[0]];g.floor=[a[1]];g.deck=[];
  expect(g.play(0,a[0].id).some(e=>e.type==='flipped')).toBe(false);
 });
 it('does not reveal a flip while the first capture still needs a choice',()=>{
  const g=new MatgoGame(),a=month(1),b=month(2);g.players[0].hand=[a[0]];g.floor=[a[1],a[2]];g.deck=[b[0],b[1]];
  const first=g.play(0,a[0].id);expect(first.some(e=>e.type==='flipped')).toBe(false);expect(g.deck).toHaveLength(2);
  const second=g.choose(0,a[1].id);expect(second.filter(e=>e.type==='flipped')).toEqual([{type:'flipped',player:0,card:b[0]}]);
 });
 it('reveals the card once when its match requires a later choice',()=>{
  const g=new MatgoGame(),a=month(1),b=month(2);g.players[0].hand=[a[0]];g.floor=[b[0],b[1]];g.deck=[b[2],a[1]];
  const first=g.play(0,a[0].id);expect(first.filter(e=>e.type==='flipped')).toHaveLength(1);expect(g.awaitingChoice).toEqual([b[0],b[1]]);
  expect(g.choose(0,b[0].id).some(e=>e.type==='flipped')).toBe(false);expect(g.deck).toEqual([a[1]]);
 });
});

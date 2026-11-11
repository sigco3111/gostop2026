import {it,expect,vi,afterEach} from 'vitest';
import {freshSave,mergeSave,parseSave,store,refreshSave,SAVE_KEY} from '../src/data/save';
afterEach(()=>vi.unstubAllGlobals());
const saved=(stages:number,trophies=0,carry=1)=>parseSave(JSON.stringify({version:1,clearedStages:Array.from({length:stages},(_,i)=>i+1),trophies,nagariCarry:carry}));
it('a stale save cannot erase cleared stages, trophies or the advanced-stage carry',()=>{expect(mergeSave(saved(0),saved(2,3,4))).toEqual(saved(2,3,4));});
it('winning a new stage resets carry and keeps earlier trophies',()=>{expect(mergeSave(saved(3,0,1),saved(2,3,8))).toEqual(saved(3,3,1));});
it('same-stage result intentionally controls the next-hand carry',()=>{expect(mergeSave(saved(2,3,8),saved(2,3,4))).toEqual(saved(2,3,8));expect(mergeSave(saved(2,3,1),saved(2,3,8))).toEqual(saved(2,3,1));});
it('persist reads current storage and updates the caller only after successful write',()=>{let raw=JSON.stringify(saved(2,3,4));vi.stubGlobal('localStorage',{getItem:(k:string)=>k===SAVE_KEY?raw:null,setItem:(_k:string,v:string)=>{raw=v;}});const stale=freshSave();expect(store(stale)).toBe(true);expect(stale).toEqual(saved(2,3,4));expect(JSON.parse(raw)).toEqual(stale);});
it('failed storage writes do not replace in-memory progress',()=>{const s=saved(1),before=JSON.stringify(s);vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved(2,3,4)),setItem:()=>{throw Error('quota');}});expect(store(s)).toBe(false);expect(JSON.stringify(s)).toBe(before);});
it('titles remain derived from real milestones after merging',()=>{expect(mergeSave(saved(12),saved(2,3)).titles).toEqual(['패담의 챔피언','패담의 새 전설']);});

it('failed writes preserve pending draw carry through screen refreshes',()=>{vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved(0,0,1))});const pending=saved(0,0,2);expect(refreshSave(pending,true).nagariCarry).toBe(2);expect(refreshSave(refreshSave(pending,true),true).nagariCarry).toBe(2);});
it('failed writes preserve a pending carry reset after a loss',()=>{vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved(1,0,8))});expect(refreshSave(saved(1,0,1),true).nagariCarry).toBe(1);});
it('failed local writes still respect genuinely advanced stored progress and trophies',()=>{vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved(2,3,4))});expect(refreshSave(saved(1,0,8),true)).toEqual(saved(2,3,4));});
it('successful saves continue to refresh same-stage carry changes from another tab',()=>{vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved(1,0,4))});expect(refreshSave(saved(1,0,8),false).nagariCarry).toBe(4);});
it('unreadable storage retains in-session carry when writing also failed',()=>{vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked')}});expect(refreshSave(saved(0,0,8),true).nagariCarry).toBe(8);});

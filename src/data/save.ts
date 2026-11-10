export interface SaveData {version:1;clearedStages:number[];titles:string[];trophies:number;nagariCarry:number;}
export const SAVE_KEY='gostop2026-save-v1';
export function freshSave():SaveData{return {version:1,clearedStages:[],titles:[],trophies:0,nagariCarry:1};}
export function parseSave(raw:string|null):SaveData{
 try{
  const v=JSON.parse(raw??'null');if(!v||typeof v!=='object'||Array.isArray(v))return freshSave();
  if(v.version!==undefined&&v.version!==1)return freshSave();
  const saved=Array.isArray(v.clearedStages)?v.clearedStages:[];
  const clearedStages:number[]=[];for(let i=1;i<=12&&saved.includes(i);i++)clearedStages.push(i);
  const trophies=Number.isSafeInteger(v.trophies)&&v.trophies>=0&&v.trophies<=1e6?v.trophies:0;
  return {version:1,clearedStages,trophies,titles:[...(trophies?['어둠의 판의 챔피언']:[]),...(clearedStages.length===12?['어둠의 판의 새 전설']:[])],nagariCarry:[1,2,4,8].includes(v.nagariCarry)?v.nagariCarry:1};
 }catch{return freshSave();}
}
export function loadSave():SaveData{try{return parseSave(localStorage.getItem(SAVE_KEY));}catch{return freshSave();}}
/** Preserve best progress from an older open tab; carry follows the selected stage. */
export function mergeSave(candidate:SaveData,existing:SaveData):SaveData{
 const a=parseSave(JSON.stringify(candidate)),b=parseSave(JSON.stringify(existing));
 return parseSave(JSON.stringify({...a,clearedStages:a.clearedStages.length>=b.clearedStages.length?a.clearedStages:b.clearedStages,trophies:Math.max(a.trophies,b.trophies),nagariCarry:b.clearedStages.length>a.clearedStages.length?b.nagariCarry:a.nagariCarry}));
}
export function store(s:SaveData):boolean{try{const merged=mergeSave(s,loadSave());localStorage.setItem(SAVE_KEY,JSON.stringify(merged));Object.assign(s,merged);return true;}catch{console.warn('진행 저장 불가: 이 브라우저에서 저장 공간을 사용할 수 없습니다.');return false;}}

/** A failed write leaves a pending in-memory carry; navigation must not reset it.
 * Newer completed stages/trophies still win through mergeSave. */
export function refreshSave(current:SaveData,writeFailed=false):SaveData{const saved=loadSave();return writeFailed?mergeSave(current,saved):mergeSave(saved,current);}

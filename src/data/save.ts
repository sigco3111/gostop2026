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
  return {version:1,clearedStages,trophies,titles:trophies?['어둠의 판의 챔피언']:[],nagariCarry:[1,2,4,8].includes(v.nagariCarry)?v.nagariCarry:1};
 }catch{return freshSave();}
}
export function loadSave():SaveData{try{return parseSave(localStorage.getItem(SAVE_KEY));}catch{return freshSave();}}
export function store(s:SaveData):boolean{try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{console.warn('진행 저장 불가: 이 브라우저에서 저장 공간을 사용할 수 없습니다.');return false;}}

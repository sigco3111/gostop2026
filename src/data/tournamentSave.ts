import { Tournament, Entrant, PairResult } from '../engine/tournament';
import { OPPONENTS } from './opponents';
export const TOURNAMENT_KEY='gostop2026-tournament-v1';
const id=(p:Entrant)=>p==='ME'?'ME':p.id;
const entrant=(v:unknown):Entrant|null=>v==='ME'?'ME':OPPONENTS.find(o=>o.id===v)??null;
export function tournamentSnapshot(t:Tournament,carry:number){return {version:1,alive:t.alive.map(id),history:t.history.map(r=>r.map(p=>({a:id(p.a),b:id(p.b),winner:id(p.winner),score:p.score}))),series:t.series,carry};}
/** Accept only a coherent, unfinished bracket. Stored objects never supply opponent data. */
export function parseTournament(raw:string|null):{t:Tournament;carry:number}|null{
 try{
  const v=JSON.parse(raw??'null');if(!v||v.version!==1||!Array.isArray(v.history)||v.history.length>2||!Array.isArray(v.alive)||!Array.isArray(v.series)||v.series.length!==2||!v.series.every((n:unknown)=>n===0||n===1)||![1,2,4,8].includes(v.carry))return null;
  const decode=(a:unknown[]):Entrant[]=>a.map(p=>{const e=entrant(p);if(!e)throw Error('entrant');return e;});
  const alive=decode(v.alive);if(alive.length!==8/(2**v.history.length)||new Set(alive.map(id)).size!==alive.length||!alive.includes('ME'))return null;
  let expected:Entrant[]|null=null;const history:PairResult[][]=[];
  for(let round=0;round<v.history.length;round++){
   const rows=v.history[round];if(!Array.isArray(rows)||rows.length!==4/(2**round))return null;
   const pairs:PairResult[]=rows.map((p:any)=>{
    const [a,b,winner]=decode([p.a,p.b,p.winner]);const s=p.score;
    if(a===b||(winner!==a&&winner!==b)||!Array.isArray(s)||s.length!==2||!s.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<=2)||s[winner===a?0:1]!==2||s[winner===a?1:0]>=2)throw Error('score');
    return {a,b,winner,score:[s[0],s[1]]};
   });
   const participants=pairs.flatMap(p=>[p.a,p.b]);if(new Set(participants.map(id)).size!==participants.length||!participants.includes('ME'))return null;
   if(expected&&participants.some((p,i)=>p!==expected![i]))return null;
   expected=pairs.map(p=>p.winner);if(!expected.includes('ME'))return null;history.push(pairs);
  }
  if(expected&&alive.some((p,i)=>p!==expected![i]))return null;
  const t=new Tournament(OPPONENTS);t.alive=alive;t.history=history;t.series=[v.series[0],v.series[1]];return {t,carry:v.carry};
 }catch{return null;}
}
export function loadTournament(){try{return parseTournament(localStorage.getItem(TOURNAMENT_KEY));}catch{return null;}}
export function storeTournament(t:Tournament,carry:number):boolean{try{if(t.champion||t.eliminated)localStorage.removeItem(TOURNAMENT_KEY);else localStorage.setItem(TOURNAMENT_KEY,JSON.stringify(tournamentSnapshot(t,carry)));return true;}catch{return false;}}

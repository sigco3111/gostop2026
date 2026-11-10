const BASE=import.meta.env.BASE_URL;
const paths={play:'playcard.wav',draw:'draw.wav',shuffle:'shuffle.wav',click:'click4.ogg'};
let enabled=true;try{enabled=localStorage.getItem('gostop2026-sound')!=='off';}catch{}
export function setSound(on:boolean){enabled=on;try{localStorage.setItem('gostop2026-sound',on?'on':'off');}catch{}}
export function soundEnabled(){return enabled;}
export function sfx(name:keyof typeof paths){
 if(!enabled)return;
 const audio=new Audio(`${BASE}assets/audio/${paths[name]}`);
 audio.volume=.32;
 audio.play().catch(()=>{});
}

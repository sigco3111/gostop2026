const BASE=import.meta.env.BASE_URL;
const paths={play:'playcard.wav',draw:'draw.wav',shuffle:'shuffle.wav',click:'click4.ogg'};
let soundSaved=true,musicSaved=true;
export function audioSaveWarning(){
 const names=[!soundSaved?'소리':'',!musicSaved?'배경음악':''].filter(Boolean).join('·');
 return names?`${names} 선택을 저장하지 못했습니다. 현재 탭에만 적용되며 새로고침하면 이전 선택으로 돌아갑니다.`:'';
}
let enabled=true;try{enabled=localStorage.getItem('gostop2026-sound')!=='off';}catch{}
export function setSound(on:boolean){enabled=on;try{localStorage.setItem('gostop2026-sound',on?'on':'off');soundSaved=true;}catch{soundSaved=false;}syncMusic();}
export function soundEnabled(){return enabled;}
export function sfx(name:keyof typeof paths){
 if(!enabled)return;
 const audio=new Audio(`${BASE}assets/audio/${paths[name]}`);
 audio.volume=.32;
 audio.play().catch(()=>{});
}

let musicOn=false;try{musicOn=localStorage.getItem('gostop2026-music')==='on';}catch{}
let music:HTMLAudioElement|null=null;
export function musicEnabled(){return musicOn;}
export function syncMusic(){
 if(!musicOn||!enabled||document.hidden){music?.pause();return;}
 if(!music){music=new Audio(`${BASE}assets/audio/tension.ogg`);music.loop=true;music.volume=.12;music.preload='none';}
 music.play().catch(()=>{});
}
export function setMusic(on:boolean){musicOn=on;try{localStorage.setItem('gostop2026-music',on?'on':'off');musicSaved=true;}catch{musicSaved=false;}syncMusic();}
export function setupMusic(){document.addEventListener('pointerdown',syncMusic);document.addEventListener('keydown',syncMusic);document.addEventListener('visibilitychange',syncMusic);}

const BASE=import.meta.env.BASE_URL;
const paths={play:'playcard.wav',draw:'draw.wav',shuffle:'shuffle.wav',click:'click4.ogg'};
let enabled=true;try{enabled=localStorage.getItem('gostop2026-sound')!=='off';}catch{}
export function setSound(on:boolean){enabled=on;try{localStorage.setItem('gostop2026-sound',on?'on':'off');}catch{}syncMusic();}
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
export function setMusic(on:boolean){musicOn=on;try{localStorage.setItem('gostop2026-music',on?'on':'off');}catch{}syncMusic();}
export function setupMusic(){document.addEventListener('pointerdown',syncMusic);document.addEventListener('keydown',syncMusic);document.addEventListener('visibilitychange',syncMusic);}

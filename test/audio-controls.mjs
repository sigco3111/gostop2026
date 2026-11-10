import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/audio-controls';mkdirSync(out,{recursive:true});
const url=process.env.GAME_URL??'https://sigco3111.github.io/gostop2026/';
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:15000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
const report={url,errors:[],decoded:[],states:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle0'});
 report.decoded=await page.evaluate(async()=>{const context=new AudioContext();const data=[];for(const name of ['click4.ogg','draw.wav','playcard.wav','shuffle.wav','tension.ogg']){const response=await fetch(new URL('assets/audio/'+name,location.href));if(!response.ok)throw Error('audio HTTP '+response.status);const b=await context.decodeAudioData(await response.arrayBuffer());data.push({name,duration:b.duration,channels:b.numberOfChannels,sampleRate:b.sampleRate,length:b.length});}await context.close();return data;});
 if(report.decoded.some(x=>x.duration<=0||!x.length))throw Error('empty audio');
 const click=async selector=>{await page.focus(selector);await page.keyboard.press('Enter');};
 await click('#m-music');report.states.push(await page.$eval('#m-music',e=>({text:e.textContent,focused:document.activeElement===e})));
 if(!report.states[0].focused)throw Error('music toggle lost focus');
 if(await page.evaluate(()=>localStorage.getItem('gostop2026-music'))!=='on')throw Error('music choice not saved');
 await click('#m-scenario');await click('.stage-card:not(.locked)');
 for(let i=0;i<6&&!await page.$('#game-screen');i++){await click('#dialogue-screen');}
 await page.waitForSelector('.sound-toggle');
 for(const expected of ['off','on','off']){await click('.sound-toggle');const state=await page.$eval('.sound-toggle',e=>({text:e.textContent,focused:document.activeElement===e,value:localStorage.getItem('gostop2026-sound')}));report.states.push(state);if(!state.focused||state.value!==expected)throw Error('sound toggle focus/value mismatch');}
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:out+'/muted-390.png'});
 await page.reload({waitUntil:'networkidle0'});await click('#m-scenario');await click('.stage-card:not(.locked)');for(let i=0;i<6&&!await page.$('#game-screen');i++)await click('#dialogue-screen');await page.waitForSelector('.sound-toggle');
 report.reload=await page.$eval('.sound-toggle',e=>({text:e.textContent,value:localStorage.getItem('gostop2026-sound'),music:localStorage.getItem('gostop2026-music')}));if(report.reload.value!=='off'||report.reload.music!=='on')throw Error('audio preferences lost on reload');
 if(report.errors.length)throw Error('page runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}

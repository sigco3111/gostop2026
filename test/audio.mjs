import puppeteer from 'puppeteer-core';import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));const report={errors:[]};
try{for(let i=0;i<50;i++){try{if((await fetch('http://localhost:4173/gostop2026/')).ok)break;}catch{}await pause(100);}
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:390,height:844}});const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{window.__audio=[];const Original=window.Audio;window.Audio=class extends Original{constructor(...args){super(...args);window.__audio.push(this);}};});
 await page.goto('http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});
 if(await page.evaluate(()=>window.__audio.length))throw new Error('music loads before opt-in');
 await page.click('#m-music');await page.waitForFunction(()=>window.__audio.some(a=>a.src.includes('tension.ogg')&&!a.paused&&a.duration>0));
 report.playing=await page.evaluate(()=>window.__audio.filter(a=>a.src.includes('tension.ogg')).map(a=>({duration:a.duration,loop:a.loop,volume:a.volume,paused:a.paused,currentTime:a.currentTime})));
 await page.click('#m-free');await page.click('.stage-card');await page.waitForSelector('.sound-toggle');await page.click('.sound-toggle');
 if(!await page.evaluate(()=>window.__audio.filter(a=>a.src.includes('tension.ogg')).every(a=>a.paused)))throw new Error('master mute did not pause music');report.masterMutePauses=true;
 await page.reload({waitUntil:'networkidle0'});if(!await page.$eval('#m-music',el=>el.textContent.includes('켬')))throw new Error('preference not persisted');report.preferencePreserved=true;
 console.log(JSON.stringify(report));
}finally{writeFileSync('/downloads/audio-report.json',JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}

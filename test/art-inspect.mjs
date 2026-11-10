import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('/downloads/art-check',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
let browser;
try {
 await new Promise(r=>setTimeout(r,800));
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:1200,height:1400}});
 const page=await browser.newPage();
 await page.goto('http://localhost:4173/gostop2026/');
 await page.evaluate(()=>{document.body.style.overflow='auto';document.body.innerHTML=`<div style="padding:20px;display:grid;grid-template-columns:repeat(8,1fr);gap:14px;background:#10101a">${Array.from({length:48},(_,i)=>`<img style="width:125px;height:187.5px" src="/gostop2026/assets/cards/card-${String(i).padStart(2,'0')}.webp">`).join('')}</div>`;});
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:'/downloads/art-check/deck-contact.png',fullPage:true});
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await page.goto('http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});
 await page.tap('#m-scenario');await page.tap('.stage-card');
 for(let i=0;i<4;i++){if(await page.$('#game-screen'))break;await page.tap('#dialogue-screen');}
 await page.waitForSelector('#hand .hcard');
 await page.screenshot({path:'/downloads/art-check/mobile-board.png'});
 console.log(await page.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth,floor:document.querySelector('#floor').scrollWidth,floorWidth:document.querySelector('#floor').clientWidth,cards:document.querySelectorAll('#hand .hcard').length})));
}finally {if(browser)await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

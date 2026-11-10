import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/downloads/storage-failure-carry';
const url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';
mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost:4173/')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:10000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===950?950:Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el){await el.focus();await page.keyboard.press('Enter');}};
 await page.goto(url,{waitUntil:'networkidle0'});
 await page.keyboard.press('Tab');if(!await page.$eval('#m-scenario',e=>e===document.activeElement))throw Error('initial Tab did not enter menu');await page.keyboard.press('Enter');if(!await page.evaluate(()=>document.activeElement?.tagName==='H2'))throw Error('screen heading not focused');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 if(!await page.$eval('#dialogue-screen',e=>e.getAttribute('aria-label').includes(e.querySelector('.dialogue-text').textContent)))throw Error('dialogue hidden from accessible name');
 for(let i=0;i<5&&!(await page.$('#game-screen'));i++){await click('#dialogue-screen');await pause(25);}
 await page.waitForSelector('#hand [role=button]');
 // Deliberately injected terminal-draw fixture, not a naturally played full round.
 await page.evaluate(()=>{const g=window.__game;g.deck=[];g.floor=[];g.players[0].captured=[];g.players[1].captured=[];Storage.prototype.setItem=function(){throw Error('quota fixture')};});
 await click('#hand .hcard');await page.waitForSelector('.settle-overlay');report.result=await page.$eval('.settle-panel',e=>e.textContent);await click('#settle-ok');report.drawMessage=await page.$eval('.dialogue-text',e=>e.textContent);await click('#dialogue-screen');for(const width of [320,390,1280]){await page.setViewport({width,height:width===320?568:844,isMobile:true,hasTouch:true});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/after-draw-${width}.png`});}report.warning=await page.$eval('.save-warning',e=>e.textContent);await click('#back');await click('#m-scenario');await click('.stage-card:not(.locked)');for(let i=0;i<6&&!await page.$('#game-screen');i++)await click('#dialogue-screen');report.nextCarry=await page.evaluate(()=>window.__game.nagariCarry);if(report.nextCarry!==2)throw Error('failed save lost in-session draw carry');if(report.errors.length)throw Error('runtime error');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();if(server){server.kill();await new Promise(r=>server.once('exit',r));}}

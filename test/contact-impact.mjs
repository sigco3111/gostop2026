import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/contact-impact',url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
const pause=ms=>new Promise(r=>setTimeout(r,ms));let browser;const report={errors:[],views:[],reduced:null};
try{
 await pause(600);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const width of [320,390,1280]){
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.setViewport({width,height:width===320?568:844});
  await page.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const t=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>t(fn,ms===110?650:ms,...args);});
  await page.goto(url,{waitUntil:'networkidle0'});await page.click('#m-free');await page.click('.stage-card');await page.waitForSelector('#hand [role=button]');
  const id=await page.evaluate(()=>{const g=window.__game;return g.players[0].hand.find(c=>g.floor.filter(f=>f.month===c.month).length===1).id;});
  await page.click(`#hand [data-card-id="${id}"]`);await page.waitForSelector('.motion-contact');
  const effect=await page.evaluate(()=>{const ring=document.querySelector('.motion-contact');for(const el of [ring,...ring.children,...document.querySelectorAll('.motion-match img')])for(const a of el.getAnimations()){a.pause();a.currentTime=70;}const r=ring.getBoundingClientRect();return {rays:ring.children.length,ring:{x:r.x,y:r.y,width:r.width,height:r.height},bounce:document.querySelector('.motion-match img')?.getAnimations().length,ariaHidden:document.querySelector('.fx-layer').getAttribute('aria-hidden'),locked:document.querySelector('#game-screen').inert};});
  await page.screenshot({path:`${out}/impact-${width}.png`});
  if(effect.rays!==8||!effect.bounce||effect.ariaHidden!=='true'||!effect.locked)throw Error('contact feedback missing or interactive');
  if(effect.ring.x<0||effect.ring.x+effect.ring.width>width+1)throw Error('contact ring clipped');
  await page.waitForFunction(()=>!document.querySelector('#game-screen').inert&&!document.querySelector('.motion-card,.motion-contact'),{timeout:12000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('horizontal overflow');report.views.push({width,...effect,overflow});await page.close();
 }
 const p=await browser.newPage();await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await p.goto(url,{waitUntil:'networkidle0'});await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand [role=button]');
 await p.evaluate(()=>{window.__spatial=0;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n instanceof Element&&n.matches('.motion-contact,.motion-card,.motion-impact'))window.__spatial++;}).observe(document.querySelector('.fx-layer'),{childList:true});});
 await p.click('#hand [role=button]');await pause(1100);report.reduced=await p.evaluate(()=>({spatial:window.__spatial,activeAnimations:document.getAnimations().length}));if(report.reduced.spatial||report.reduced.activeAnimations)throw Error('reduced motion emitted contact feedback');
 if(report.errors.length)throw Error(report.errors.join(';'));console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server?.kill();}

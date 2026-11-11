import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/table-motion',url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
const pause=ms=>new Promise(r=>setTimeout(r,ms));let browser;const report={errors:[],views:[],reduced:null};
try{
 await pause(700);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const width of [320,390,1280]){
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.setViewport({width,height:width===320?568:844});
  await page.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const t=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>t(fn,[190,280,110,300].includes(ms)?900:ms,...args);});
  await page.goto(url,{waitUntil:'networkidle0'});await page.click('#m-free');await page.click('.stage-card');await page.waitForSelector('#hand [role=button]');
  const id=await page.evaluate(()=>{const g=window.__game;return g.players[0].hand.find(c=>g.floor.filter(f=>f.month===c.month).length===1)?.id??g.players[0].hand[0].id;});
  await page.click(`#hand [data-card-id="${id}"]`);
  await page.waitForSelector('.motion-play');
  const locked=await page.evaluate(()=>{const g=window.__game,before=JSON.stringify(g),el=document.querySelector('#hand [data-card-id]');for(let i=0;i<12;i++)el?.dispatchEvent(new MouseEvent('click',{bubbles:true}));return document.querySelector('#game-screen').inert&&before===JSON.stringify(g);});if(!locked)throw Error('input not locked');
  await pause(70);await page.screenshot({path:`${out}/play-${width}.png`});
  await page.waitForSelector('.motion-flip');await pause(130);await page.screenshot({path:`${out}/flip-${width}.png`});
  await page.waitForSelector('.motion-impact');await pause(70);await page.screenshot({path:`${out}/match-${width}.png`});
  const impact=await page.$eval('.motion-impact',e=>e.textContent);
  await page.waitForSelector('.motion-capture');
  const destination=await page.$eval('.motion-capture',e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {x:parseFloat(e.style.left)+28+parseFloat(s.getPropertyValue('--dx')),y:parseFloat(e.style.top)+42+parseFloat(s.getPropertyValue('--dy')),floorBottom:document.querySelector('#floor').getBoundingClientRect().bottom};});
  if(destination.x<0||destination.x>width||destination.y<destination.floorBottom-35)throw Error('first capture flies away from player zone');
  await pause(110);await page.screenshot({path:`${out}/capture-${width}.png`});
  await page.waitForFunction(()=>!document.querySelector('#game-screen').inert&&!document.querySelector('.motion-card'),{timeout:15000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('horizontal overflow');
  report.views.push({width,locked,impact,overflow,destination});await page.close();
 }
 const page=await browser.newPage();await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.goto(url,{waitUntil:'networkidle0'});await page.click('#m-free');await page.click('.stage-card');await page.waitForSelector('#hand [role=button]');
 await page.evaluate(()=>{window.__spatial=0;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n instanceof Element&&n.matches('.motion-card,.motion-impact'))window.__spatial++;}).observe(document.querySelector('.fx-layer'),{childList:true});});
 await page.click('#hand [role=button]');await pause(1000);report.reduced=await page.evaluate(()=>({spatial:window.__spatial,ghosts:document.querySelectorAll('.motion-card,.motion-impact').length}));if(report.reduced.spatial||report.reduced.ghosts)throw Error('reduced motion uses spatial animation');
 if(report.errors.length)throw Error(report.errors.join(';'));console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server?.kill();}

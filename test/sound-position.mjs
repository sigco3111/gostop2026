import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {readyImages} from './ready-images.mjs';
const out=process.env.QA_OUT??'/tmp/sound-position';mkdirSync(out,{recursive:true});
const url=process.env.GAME_URL??'http://localhost:4178/gostop2026/';
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4178'],{stdio:'ignore'});
let b;const report={errors:[],views:[]};
try{
 b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 for(const [width,height,touch]of[[320,568,true],[390,844,true],[844,320,true],[1280,844,false]]){
  const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});await p.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};});
  await p.goto(url);await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand');await readyImages(p);
  await p.$eval('.table-area',e=>e.scrollTop=e.scrollHeight);
  const before=await p.evaluate(()=>{window.__soundNodes={table:document.querySelector('.table-area'),hand:document.querySelector('#hand'),button:document.querySelector('.sound-toggle')};return{scroll:window.__soundNodes.table.scrollTop,game:JSON.stringify(window.__game),save:localStorage.getItem('gostop2026-save-v1'),pressed:window.__soundNodes.button.getAttribute('aria-pressed')};});
  for(let i=0;i<2;i++){
   if(touch){const pt=await p.$eval('.sound-toggle',e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width-5,y:r.y+r.height-5};});await p.touchscreen.tap(pt.x,pt.y);}
   else{await p.focus('.sound-toggle');await p.keyboard.press('Enter');}
   const after=await p.evaluate(()=>({sameTable:window.__soundNodes.table===document.querySelector('.table-area'),sameHand:window.__soundNodes.hand===document.querySelector('#hand'),sameButton:window.__soundNodes.button===document.querySelector('.sound-toggle'),scroll:document.querySelector('.table-area').scrollTop,pressed:document.querySelector('.sound-toggle').getAttribute('aria-pressed'),text:document.querySelector('.sound-toggle').textContent,savedSound:localStorage.getItem('gostop2026-sound'),focused:document.activeElement===document.querySelector('.sound-toggle'),game:JSON.stringify(window.__game),save:localStorage.getItem('gostop2026-save-v1')}));
   if(!after.sameTable||!after.sameHand||!after.sameButton||Math.abs(after.scroll-before.scroll)>1||after.game!==before.game||after.save!==before.save)throw Error('sound disturbed board');
   const expected=i===0?(before.pressed==='true'?'false':'true'):before.pressed;if(after.savedSound!==(expected==='true'?'on':'off')||after.pressed!==expected||after.text!==(expected==='true'?'소리 켬':'소리 끔')||(!touch&&!after.focused))throw Error('sound state/focus');
  }
  await p.screenshot({path:`${out}/board-${width}.png`});await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const a=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations);if(a.length)throw Error('axe');
  report.views.push({width,height,touch,scroll:before.scroll,stableBoard:true,toggleBothWays:true,axe:0,scripts:await p.$$eval('script[src]',es=>es.map(e=>e.src))});await p.close();
 }
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}

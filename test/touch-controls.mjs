import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {readyImages} from './ready-images.mjs';
const out=process.env.QA_OUT??'/tmp/touch-controls';mkdirSync(out,{recursive:true});
const url=process.env.GAME_URL??'http://localhost:4178/gostop2026/';
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4178'],{stdio:'ignore'});
let browser;const report={errors:[],views:[],scripts:[]};
try{
 await new Promise(r=>setTimeout(r,400));browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};});
 for(const [width,height] of [[320,568],[390,844],[844,320]]){
  await p.setViewport({width,height,isMobile:true,hasTouch:true});await p.goto(url);report.scripts=await p.$$eval('script[src]',es=>es.map(e=>e.src));await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand .hcard');await readyImages(p);
  if(!await p.evaluate(()=>matchMedia('(pointer:coarse)').matches))throw Error('not a coarse-pointer test');
  const targets=await p.$$eval('.sound-toggle,.capture-toggle,.exit-toggle',es=>es.map(e=>({name:e.className,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));if(targets.some(e=>e.w<44||e.h<44))throw Error('small touch target '+JSON.stringify(targets));
  const tap=async selector=>{const point=await p.$eval(selector,e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width-5,y:r.y+r.height-5};});await p.touchscreen.tap(point.x,point.y);};
  const before=await p.evaluate(()=>JSON.stringify(window.__game));
  await tap('.sound-toggle');await tap('.capture-toggle');await p.waitForSelector('.capture-overlay');await tap('.capture-close');await p.waitForFunction(()=>!document.querySelector('.capture-overlay'));
  await tap('.exit-toggle');await p.waitForSelector('.exit-overlay');await tap('[data-exit=cancel]');await p.waitForFunction(()=>!document.querySelector('.exit-overlay'));
  if(before!==await p.evaluate(()=>JSON.stringify(window.__game)))throw Error('auxiliary touch controls changed game');
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('axe '+JSON.stringify(axe.violations));

  const cdp=await p.createCDPSession();
  // A real touch swipe begins on a hand card and scrolls instead of playing it.
  const point=await p.$eval('#hand .hcard',e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:Math.min(innerHeight-12,r.y+30)};});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-i*10}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const scroll=await p.$eval('.table-area',e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));console.log(JSON.stringify({width,scroll}));
  if(scroll.max>2){await p.waitForFunction(()=>document.querySelector('.table-area').scrollTop>0,{timeout:2000});}
  if(before!==await p.evaluate(()=>JSON.stringify(window.__game)))throw Error('swipe played a hand card');
  await p.$eval('.table-area',e=>{e.scrollTop=e.scrollHeight;});
  const last=await p.$eval('#hand .hcard:last-child',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,fullyVisible:r.top>=document.querySelector('.table-area').getBoundingClientRect().top&&r.bottom<=innerHeight,id:Number(e.dataset.cardId)};});if(!last.fullyVisible)throw Error('last hand card cannot be reached');
  await p.screenshot({path:`${out}/hand-${width}.png`});
  await p.touchscreen.tap(last.x,last.y);await p.waitForFunction(id=>!window.__game.players[0].hand.some(c=>c.id===id),{},last.id);
  const played=await p.evaluate(()=>window.__game.players[0].hand.length);if(played!==9)throw Error('single touch did not play exactly one card');
  await p.waitForFunction(()=>!document.querySelector('#game-screen')?.inert);
  report.views.push({width,height,targets,swipeDidNotPlay:true,lastCardReachable:true,singleTapPlayedOnce:true,axe:0,auxiliaryTouchControls:true});await cdp.detach();
 }
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server?.kill();}

import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {readyImages} from './ready-images.mjs';
const out=process.env.QA_OUT??'/tmp/special-touch-controls';mkdirSync(out,{recursive:true});
const url=process.env.GAME_URL??'http://localhost:4178/gostop2026/';
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4178'],{stdio:'ignore'});
const report={errors:[],cases:[]};let b;
try{
 b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,568],[390,844],[844,320]])for(const [kind,seed] of [['shake',8],['bomb',49]]){
  const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.setViewport({width,height,isMobile:true,hasTouch:true});
  await p.evaluateOnNewDocument(seed=>{let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};},seed);
  await p.goto(url);await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#actionbar button');await readyImages(p);
  const save=await p.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
  const inspect=async tag=>{
   await p.$eval('#actionbar button',e=>e.scrollIntoView({block:'center'}));
   const box=await p.$eval('#actionbar button',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent};});
   if(box.w<44||box.h<44||box.y<0||box.y+box.h>height||box.x<0||box.x+box.w>width)throw Error('unreachable small action '+JSON.stringify(box));
   if(await p.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('overflow');
   await readyImages(p);await p.screenshot({path:`${out}/${tag}-${width}.png`});return box;
  };
  const before=await p.evaluate(()=>({hand:window.__game.players[0].hand.length,shakes:window.__game.players[0].shakes,passes:window.__game.players[0].bombPasses}));
  const box=await inspect(kind);const cdp=await p.createCDPSession();
  // Swipe from the special action itself: scrolling must not trigger it.
  const state=await p.evaluate(()=>JSON.stringify(window.__game));
  const origin={x:box.x+box.w/2,y:box.y+box.h/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:origin.x,y:origin.y-i*7}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  if(state!==await p.evaluate(()=>JSON.stringify(window.__game)))throw Error('swipe triggered action');
  const target=await inspect(kind);await p.touchscreen.tap(target.x+target.w-5,target.y+target.h-5);
  await p.waitForFunction(()=>window.__game.players[0].hand.length<10);
  const immediate=await p.evaluate(()=>({hand:window.__game.players[0].hand.length,shakes:window.__game.players[0].shakes,passes:window.__game.players[0].bombPasses}));
  if(immediate.shakes!==before.shakes+1||immediate.hand!==(kind==='bomb'?7:9))throw Error('special action wrong '+JSON.stringify(immediate));
  await p.waitForFunction(()=>!document.querySelector('#game-screen').inert&&!window.__game.awaitingChoice&&(window.__game.turn===0||window.__game.over),{timeout:15000});
  let pass=null;
  if(kind==='bomb'){
   pass=await inspect('pass');if(!pass.text.includes('폭탄 빈패'))throw Error('no natural bomb pass');
   const a=await p.evaluate(()=>({hand:window.__game.players[0].hand.length,passes:window.__game.players[0].bombPasses,shakes:window.__game.players[0].shakes}));
   await p.touchscreen.tap(pass.x+pass.w-5,pass.y+pass.h-5);await p.waitForFunction(n=>window.__game.players[0].bombPasses===n-1,{},a.passes);
   const z=await p.evaluate(()=>({hand:window.__game.players[0].hand.length,shakes:window.__game.players[0].shakes}));if(z.hand!==a.hand||z.shakes!==a.shakes)throw Error('pass played extra hand');
   await p.waitForFunction(()=>!document.querySelector('#game-screen').inert&&window.__game.turn===0&&!window.__game.awaitingChoice&&document.querySelector('#hand [role=button]'),{timeout:15000});
  }
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const violations=await p.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations);if(violations.length)throw Error('axe '+JSON.stringify(violations));
  if(save!==await p.evaluate(()=>localStorage.getItem('gostop2026-save-v1')))throw Error('progress changed');
  report.cases.push({width,height,kind,seed,target,immediate,pass,swipeSafe:true,axe:0,scripts:await p.$$eval('script[src]',es=>es.map(e=>e.src))});await cdp.detach();await p.close();
 }
 if(report.errors.length)throw Error('runtime');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}

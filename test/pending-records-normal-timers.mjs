import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/pending-records-normal-timers';mkdirSync(out,{recursive:true});
const server=process.env.GAME_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
let browser;const report={errors:[],rounds:[],pending:null,reloaded:null,views:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  // Production timers retained for save-failure boundary coverage.
 });
 const click=async selector=>{const el=await page.$(selector);if(el){await el.focus();await page.keyboard.press('Enter');}};

 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<6000;k++){
   if(await page.$('.settle-overlay')){
    const text=await page.$eval('.settle-panel',el=>el.innerText);report.rounds.push({tag,played,choices,prompts,text});
    if(report.rounds.length<=4)await page.screenshot({path:`${out}/${tag}-settled.png`});
    await click('#settle-ok');await pause(30);return text;
   }
   if(await page.$('.gostop-overlay')){prompts++;if(prompts===1)await page.screenshot({path:`${out}/gostop-${tag}.png`});await click('.btn.stop');}
   else if(await page.$('.choice-overlay')){choices++;if(choices===1)await page.screenshot({path:`${out}/choice-${tag}.png`});await click('.choice-overlay .hcard');}
   else if(await page.$('.floor-cell.target .hcard')){await click('.floor-cell.target .hcard');}
   else{
    const s=await page.evaluate(()=>window.__game?{turn:window.__game.turn,pending:!!window.__game.awaitingChoice,go:window.__game.awaitingGoStop,over:window.__game.over,hand:window.__game.players[0].hand.length}:null);
    if(s&&s.turn===0&&!s.pending&&!s.go&&!s.over){await page.waitForFunction(()=>document.activeElement?.closest('#hand')||document.activeElement?.classList.contains('capture-toggle')||document.querySelector('[role=dialog]'),{timeout:4000});
     // Use current public state to choose a sensible capture. This is test-driver strategy, not a hidden-state AI.
     const id=await page.evaluate(()=>{const g=window.__game;const vals={gwang:12,yeol:5,tti:3,pi:1};let best=null,v=-1e3;for(const c of g.players[0].hand){const ms=g.floor.filter(f=>f.month===c.month);const value=ms.length?10+Math.max(...ms.map(x=>vals[x.kind])):-vals[c.kind];if(value>v){v=value;best=c.id;}}return best;});
     if(id!==null){await click(`#hand [data-card-id="${id}"]`);played++;}else await click('#actionbar button');
    }
   }
   await pause(15);
  }
  throw new Error(`round stalled: ${tag} `+await page.evaluate(()=>JSON.stringify(window.__game)));
 }
 await page.goto(process.env.GAME_URL??'http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});report.scripts=await page.$$eval('script[src]',es=>es.map(e=>e.src));
 await page.keyboard.press('Tab');if(!await page.$eval('#m-scenario',e=>e===document.activeElement))throw Error('initial Tab did not enter menu');await page.keyboard.press('Enter');if(!await page.evaluate(()=>document.activeElement?.tagName==='H2'))throw Error('screen heading not focused');await page.focus('.stage-card');await page.keyboard.press('Enter');
 if(!await page.$eval('#dialogue-screen',e=>e.getAttribute('aria-label').includes(e.querySelector('.dialogue-text').textContent)))throw Error('dialogue hidden from accessible name');
 for(let i=0;i<5&&!(await page.$('#game-screen'));i++){await click('#dialogue-screen');await pause(25);}
 await page.waitForSelector('#hand [role=button]');await page.waitForFunction(()=>document.activeElement?.closest('#hand'));const first=await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'));await page.keyboard.press('ArrowRight');if(await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'))===first)throw Error('arrow did not move');await page.keyboard.press('Home');if(await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'))!==first)throw Error('Home failed');await page.screenshot({path:`${out}/mobile-start.png`});
 await page.evaluate(()=>{const original=Storage.prototype.setItem;window.__restoreProgressWrites=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(k,v){if(k==='gostop2026-save-v1')throw new DOMException('QA quota failure','QuotaExceededError');return original.call(this,k,v);};});
 await playRound('story');await click('#dialogue-screen');await pause(25);await click('#back');await click('#m-guide');await click('[data-tab=credits]');
 report.pending=await page.$eval('#guide-content',e=>e.innerText);if(!report.pending.includes('시나리오 1 / 12인')||!report.pending.includes('저장되지 않은 세션 기록'))throw Error('pending record/warning missing');
 for(const[width,height]of[[320,568],[568,320],[390,844],[1280,844]]){await page.setViewport({width,height,isMobile:true,hasTouch:true});await click('[data-tab=deck]');await page.$eval('#guide-screen',e=>e.scrollTop=e.scrollHeight);await click('[data-tab=credits]');const text=await page.$eval('#guide-content',e=>e.innerText);if(text!==report.pending)throw Error('section switch lost pending record');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});await page.screenshot({path:`${out}/pending-${width}.png`});await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const a=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations);if(a.length)throw Error('axe '+JSON.stringify(a));report.views.push({width,height,pendingPreserved:true,axe:0});}
 if(process.env.RECOVER_SAVE==='1'){
  // Restore only the storage method, never inject cards, wins or progress.
  await page.evaluate(()=>window.__restoreProgressWrites());await click('.guide-back');await click('#m-scenario');
  for(let attempt=0;attempt<6;attempt++){
   await click('[data-stage="2"]');for(let i=0;i<6&&!await page.$('#game-screen');i++){await click('#dialogue-screen');await pause(25);}
   await page.waitForSelector('#hand [role=button]');await playRound(`recovery-${attempt}`);await click('#dialogue-screen');await pause(30);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));report.recovery={attempt:attempt+1,saved};
   if(saved.clearedStages.length===2)break;
  }
  if(report.recovery.saved.clearedStages.length!==2)throw Error('no naturally earned second win within recovery budget');
  await click('#back');await click('#m-guide');await click('[data-tab=credits]');report.recovered=await page.$eval('#guide-content',e=>e.innerText);
  if(!report.recovered.includes('시나리오 2 / 12인')||report.recovered.includes('저장되지 않은 세션 기록')||await page.$('.save-warning'))throw Error('save recovery warning or progress wrong');
  await page.setViewport({width:320,height:568,isMobile:true,hasTouch:true});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});await page.screenshot({path:`${out}/recovered-320.png`});
 }
 await page.reload({waitUntil:'networkidle0'});await click('#m-guide');await click('[data-tab=credits]');report.reloaded=await page.$eval('#guide-content',e=>e.innerText);if(!report.reloaded.includes(process.env.RECOVER_SAVE==='1'?'시나리오 2 / 12인':'시나리오 0 / 12인')||report.reloaded.includes('저장되지 않은 세션 기록'))throw Error('false persisted record');if(report.errors.length)throw Error('runtime');

 report.errors=report.errors.filter(Boolean);console.log(JSON.stringify({errors:report.errors,rounds:report.rounds.length,userPrompts:report.rounds.reduce((s,r)=>s+r.prompts,0),choices:report.rounds.reduce((s,r)=>s+r.choices,0),views:report.views.length,pendingWarning:report.pending.includes('저장되지 않은 세션 기록'),reloadCorrect:report.reloaded.includes(process.env.RECOVER_SAVE==='1'?'시나리오 2 / 12인':'시나리오 0 / 12인'),recovery:report.recovery??null}));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();if(server){server.kill();await new Promise(r=>server.once('exit',r));}}

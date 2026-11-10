import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/accessibility';mkdirSync(out,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===950?950:Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<2500;k++){
   if(!report.fx && await page.$('.fx-burst')){await page.evaluate(()=>document.querySelectorAll('.fx-burst img,.flash').forEach(el=>{for(const a of el.getAnimations()){a.pause();a.currentTime=300;}}));await page.screenshot({path:`${out}/special-effect.png`});report.fx=true;}
   if(!report.captured && await page.evaluate(()=>window.__game?.turn===0 && !window.__game?.awaitingChoice && !window.__game?.awaitingGoStop && window.__game?.players[0].captured.length>3)){
    await pause(100);await click('.capture-toggle');if(await page.$('.capture-overlay')){
     await page.screenshot({path:`${out}/captured-390.png`});
     const start=await page.evaluate(()=>document.activeElement?.className);await page.keyboard.press('Tab');const trapped=await page.evaluate(()=>!!document.activeElement?.closest('.capture-overlay'));if(!trapped)throw new Error('capture focus escaped');
     await page.keyboard.press('Escape');if(await page.$('.capture-overlay'))throw new Error('Escape failed');report.captured={start,trapped};
    }
   }
   if(await page.$('.settle-overlay')){
    const text=await page.$eval('.settle-panel',el=>el.innerText);report.rounds.push({tag,played,choices,prompts,text});
    if(report.rounds.length<=4)await page.screenshot({path:`${out}/${tag}-settled.png`});
    await click('#settle-ok');await pause(30);return text;
   }
   if(await page.$('.gostop-overlay')){prompts++;if(prompts===1)await pause(350);if(prompts===1)await page.screenshot({path:`${out}/gostop-${tag}.png`});await click('.btn.stop');}
   else if(await page.$('.choice-overlay')){choices++;if(choices===1)await page.screenshot({path:`${out}/choice-${tag}.png`});await click('.choice-overlay .hcard');}
   else if(await page.$('.floor-cell.target .hcard')){await click('.floor-cell.target .hcard');}
   else{
    const s=await page.evaluate(()=>window.__game?{turn:window.__game.turn,pending:!!window.__game.awaitingChoice,go:window.__game.awaitingGoStop,over:window.__game.over,hand:window.__game.players[0].hand.length}:null);
    if(s&&s.turn===0&&!s.pending&&!s.go&&!s.over){
     // Use current public state to choose a sensible capture. This is test-driver strategy, not a hidden-state AI.
     const id=await page.evaluate(()=>{const g=window.__game;const vals={gwang:12,yeol:5,tti:3,pi:1};let best=null,v=-1e3;for(const c of g.players[0].hand){const ms=g.floor.filter(f=>f.month===c.month);const value=ms.length?10+Math.max(...ms.map(x=>vals[x.kind])):-vals[c.kind];if(value>v){v=value;best=c.id;}}return best;});
     if(id!==null){await click(`#hand [data-card-id="${id}"]`);played++;}else await click('#actionbar button');
    }
   }
   await pause(15);
  }
  throw new Error(`round stalled: ${tag} `+await page.evaluate(()=>JSON.stringify(window.__game)));
 }
 await page.goto('http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});
 await click('#m-scenario');await click('.stage-card');
 for(let i=0;i<5&&!(await page.$('#game-screen'));i++){await click('#dialogue-screen');await pause(25);}
 await page.waitForSelector('#hand');await page.screenshot({path:`${out}/mobile-start.png`});
 await playRound('story');await click('#dialogue-screen');await pause(25);
 const before=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
 await page.reload({waitUntil:'networkidle0'});const after=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
 const a=JSON.parse(before),b=JSON.parse(after);const same=JSON.stringify(Object.keys(a).sort().map(k=>[k,a[k]]))===JSON.stringify(Object.keys(b).sort().map(k=>[k,b[k]]));if(!same)throw new Error('save changed after reload');report.story={before,after,valuesPreserved:same};
 report.errors=report.errors.filter(Boolean);console.log(JSON.stringify({errors:report.errors,rounds:report.rounds.length,userPrompts:report.rounds.reduce((s,r)=>s+r.prompts,0),choices:report.rounds.reduce((s,r)=>s+r.choices,0),story:report.story,tournament:report.tournament}));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const start=Number(process.env.QA_START??1),end=Number(process.env.QA_END??12);
if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>12||end<start)throw Error('QA_START/QA_END must be an ordered range within1..12');
const url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';
const out=process.env.QA_OUT??`/tmp/natural-opponents-${start}-${end}`;mkdirSync(out,{recursive:true});
let browser;const report={url,normalTimers:true,start,end,errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:15000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  // Production timers retained, no accelerated animation or AI waits.
 });
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<2500;k++){
   if(await page.evaluate(()=>document.querySelector('#game-screen')?.inert)){await pause(25);continue;}
   const state=await page.evaluate(()=>{const g=window.__game;if(!g||document.querySelector('#game-screen')?.inert)return null;const ids=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])].map(c=>c.id);return {expected:g.awaitingChoice?47:48,count:ids.length,unique:new Set(ids).size,spatial:document.querySelectorAll('.motion-card,.motion-contact,.motion-impact').length};});if(state&&(state.count!==state.expected||state.unique!==state.expected||state.spatial))throw Error('cards or settled motion invariant failed: '+JSON.stringify(state));
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
 await page.goto(url,{waitUntil:'networkidle0'});
 const before=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));report.opponents=[];
 for(let i=start-1;i<end;i++){
  await click('#m-free');const el=await page.$(`.stage-card:nth-child(${i+1})`);const name=await el.evaluate(e=>e.textContent);await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();const text=await playRound(`free-${i+1}`);await page.waitForSelector('#title-screen');report.opponents.push({i:i+1,name,text});console.log(`opponent ${i+1} complete`);
 }
 const after=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));report.saveUnchanged=before===after;if(!report.saveUnchanged||report.errors.length)throw Error('freeplay modified progress or errored');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();}

import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/full-story';mkdirSync(out,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<2500;k++){
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
 await click('#m-scenario');report.stages=[];
 for(let stage=1;stage<=12;stage++){
  let won=false;
  for(let attempt=1;attempt<=30;attempt++){
   
   const el=await page.$(`.stage-card:nth-child(${stage})`);await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();
   for(let i=0;i<5&&!(await page.$('#game-screen'));i++){await click('#dialogue-screen');await pause(25);}
   const text=await playRound(`stage-${stage}-try-${attempt}`);await click('#dialogue-screen');await pause(40);
   if(text.startsWith('승리')){report.stages.push({stage,attempt});won=true;break;}
  }
  if(!won)throw new Error(`stage ${stage} not cleared`);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));
  if(save.clearedStages.length!==stage)throw new Error('bad save progression');
  if(stage===12){await page.waitForSelector('#ending-screen');await page.screenshot({path:`${out}/ending.png`});await click('#ending-back');}
  if(stage===4||stage===8){await page.reload({waitUntil:'networkidle0'});await click('#m-scenario');}
  await page.screenshot({path:`${out}/cleared-${stage}.png`});
 }
 report.save=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));
 writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

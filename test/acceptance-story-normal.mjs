// Production-timer story acceptance in bounded completed-round batches. Isolated profile retains only naturally earned saves.
const GAME_URL=process.env.GAME_URL||'https://sigco3111.github.io/gostop2026/';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
const out=process.env.QA_OUT||'/tmp/story-normal-acceptance';mkdirSync(out,{recursive:true});

const report=existsSync(out+'/report.json')?JSON.parse(readFileSync(out+'/report.json','utf8')):{errors:[],rounds:[],productionTimers:true,stages:[],seed:23};let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,userDataDir:out+'/profile',timeout:10000,protocolTimeout:15000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(seed=>{let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;window.__qaRandomState=n;return n/4294967296;};window.__qaRandomState=n;},report.seed);
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<2500;k++){
   if(await page.$('.settle-overlay')){
    const text=await page.$eval('.settle-panel',el=>el.innerText);report.rounds.push({tag,played,choices,prompts,text});
    await page.screenshot({path:`${out}/${tag}-settled.png`});
    await click('#settle-ok');await pause(30);return text;
   }
   if(await page.$('.gostop-overlay')){prompts++;if(prompts===1)await pause(350);if(prompts===1)await page.screenshot({path:`${out}/gostop-${tag}.png`});await click('.btn.stop');}
   else if(await page.$('.choice-overlay')){choices++;if(choices===1)await page.screenshot({path:`${out}/choice-${tag}.png`});await click('.choice-overlay .hcard');}
   else if(await page.$('.floor-cell.target .hcard')){await click('.floor-cell.target .hcard');}
   else{
    const s=await page.evaluate(()=>window.__game?{turn:window.__game.turn,pending:!!window.__game.awaitingChoice,go:window.__game.awaitingGoStop,over:window.__game.over,inert:document.querySelector('#game-screen')?.inert,hand:window.__game.players[0].hand.length}:null);
    if(s&&s.turn===0&&!s.pending&&!s.go&&!s.over&&!s.inert){
     // Use current public state to choose a sensible capture. This is test-driver strategy, not a hidden-state AI.
     const id=await page.evaluate(()=>{const g=window.__game;const vals={gwang:12,yeol:5,tti:3,pi:1};let best=null,v=-1e3;for(const c of g.players[0].hand){const ms=g.floor.filter(f=>f.month===c.month);const value=ms.length?10+Math.max(...ms.map(x=>vals[x.kind])):-vals[c.kind];if(value>v){v=value;best=c.id;}}return best;});
     if(id!==null){await click(`#hand [data-card-id="${id}"]`);played++;await page.waitForFunction(n=>document.querySelector('#game-screen')?.inert||window.__game.players[0].hand.length<n||document.querySelector('.choice-overlay,.gostop-overlay,.settle-overlay'),{timeout:15000,polling:30},s.hand);}else await click('#actionbar button');
    }
   }
   await pause(15);
  }
  throw new Error(`round stalled: ${tag} `+await page.evaluate(()=>JSON.stringify(window.__game)));
 }
 await page.goto(GAME_URL,{waitUntil:'networkidle0'});
 const scripts=await page.$$eval('script[src]',es=>es.map(e=>e.src));if(report.scripts&&JSON.stringify(scripts)!==JSON.stringify(report.scripts))throw Error('public build changed during run');report.scripts=scripts;
 const loaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));if((loaded?.clearedStages.length??0)!==report.stages.length)throw Error('profile and earned report disagree');
 if(report.save&&JSON.stringify(loaded)!==JSON.stringify(report.save))throw Error('reload changed earned save');
 await click('#m-scenario');const budget=Number(process.env.ROUND_BUDGET??2);const initialRounds=report.rounds.length;
 while(report.stages.length<12&&report.rounds.length-initialRounds<budget){
  const stage=report.stages.length+1,attempt=report.rounds.filter(r=>r.tag.startsWith(`stage-${stage}-`)).length+1;if(attempt>30)throw Error('stage attempts exhausted');
  const el=await page.$(`[data-stage="${stage}"]`);await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();
  for(let i=0;i<5&&!await page.$('#game-screen');i++){await click('#dialogue-screen');await pause(25);}
  const text=await playRound(`stage-${stage}-try-${attempt}`);await click('#dialogue-screen');await pause(40);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));
  if(text.startsWith('승리')){if(save.clearedStages.length!==stage)throw Error('earned win not saved');report.stages.push({stage,attempt});
   if(stage===12){await page.waitForSelector('#ending-screen');await page.screenshot({path:out+'/ending.png'});await click('#ending-back');}
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:`${out}/cleared-${stage}.png`});
  }else if(save.clearedStages.length!==stage-1)throw Error('loss or draw falsely cleared stage');
  report.save=save;report.seed=await page.evaluate(()=>window.__qaRandomState);
  writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
 }
 if(report.errors.length)throw Error('runtime errors');
 report.complete=report.stages.length===12;
 if(report.complete){if(!report.save.titles.includes('패담의 새 전설'))throw Error('ending title missing');await page.reload({waitUntil:'networkidle0'});const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));if(JSON.stringify(saved)!==JSON.stringify(report.save))throw Error('final reload changed save');await click('#m-guide');await click('[data-tab=credits]');report.records=await page.$eval('#guide-content',e=>e.innerText);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations);if(violations.length)throw Error('axe '+JSON.stringify(violations));report.axe=0;await page.screenshot({path:out+'/final-records.png'});}
 console.log(JSON.stringify({rounds:report.rounds.length,stages:report.stages,save:report.save,complete:report.complete,errors:report.errors}));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();}

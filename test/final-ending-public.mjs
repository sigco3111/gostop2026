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

 await page.setCacheEnabled(false);await page.goto(GAME_URL,{waitUntil:'networkidle0'});report.scripts=await page.$$eval('script[src]',es=>es.map(e=>e.src));if(!report.scripts.some(x=>x.includes('index-TV1gja6D.js')))throw Error('final build not reached');
 const before=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));report.saveBefore=before;
 await click('#m-scenario');
 for(let attempt=1;attempt<=2;attempt++){
  const el=await page.$('[data-stage="12"]');await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();for(let i=0;i<5&&!await page.$('#game-screen');i++)await click('#dialogue-screen');
  const result=await playRound('final-'+(report.rounds.length+1));await click('#dialogue-screen');
  if(result.startsWith('승리')){await page.waitForSelector('#ending-screen');report.endingViews=[];report.wordBreak=await page.$eval('.ending-copy p',e=>getComputedStyle(e).wordBreak);if(report.wordBreak!=='keep-all')throw Error('final wrap not live');
   for(const[width,height]of[[320,568],[390,844],[568,320],[844,390]]){await page.setViewport({width,height,isMobile:true,hasTouch:true});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:`${out}/ending-top-${width}.png`});await page.$eval('#ending-back',e=>e.scrollIntoView({block:'center'}));await page.screenshot({path:`${out}/ending-bottom-${width}.png`});const ok=await page.$eval('#ending-back',e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth;});if(!ok)throw Error('final ending inaccessible');report.endingViews.push({width,height,returnReachable:true});}
   await click('#ending-back');await page.waitForSelector('#scenario-screen');report.finalEnding=true;break;
  }
 }
 report.saveAfter=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));if(before!==report.saveAfter)throw Error('replay changed completed progress');await page.reload({waitUntil:'networkidle0'});if(before!==await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1')))throw Error('final save reload mismatch');
 console.log(JSON.stringify({finalEnding:report.finalEnding,rounds:report.rounds.length,views:report.endingViews,errors:report.errors,scripts:report.scripts}));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();}

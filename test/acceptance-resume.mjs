// Isolated seeded UI acceptance. No stage/win/trophy injection. Resume adds malformed/failed-storage fixtures.
const GAME_URL=process.env.GAME_URL||'https://sigco3111.github.io/gostop2026/';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT||'/tmp/gostop-acceptance/resume';mkdirSync(out,{recursive:true});

let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:15000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===950?950:Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<2500;k++){
   if(!report.fx && await page.$('.fx-burst')){await page.screenshot({path:`${out}/special-effect.png`});report.fx=true;}
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
 await page.goto(GAME_URL,{waitUntil:'networkidle0'});
 await click('#m-tournament');await click('#next');await playRound('before-reload');
 const before=await page.evaluate(()=>localStorage.getItem('gostop2026-tournament-v1'));
 const text=await page.$eval('#tournament-screen',el=>el.innerText);
 await page.reload({waitUntil:'networkidle0'});
 if(!await page.$eval('#m-tournament',e=>e.innerText.includes('이어하기')))throw Error('resume menu missing');
 for(const width of [320,390,1280]){await page.setViewport({width,height:width===320?568:844,isMobile:true,hasTouch:true});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/title-${width}.png`});}
 await click('#m-tournament');
 if(await page.$eval('#tournament-screen',el=>el.innerText)!==text)throw Error('bracket not restored');
 for(const width of [320,390,1280]){await page.setViewport({width,height:width===320?568:844,isMobile:true,hasTouch:true});await page.screenshot({path:`${out}/bracket-${width}.png`,fullPage:true});if(await page.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('overflow');}
 await click('#next');await page.waitForSelector('.exit-toggle:not([disabled])');await click('.capture-toggle');await page.keyboard.press('Escape');await click('.exit-toggle');await page.screenshot({path:`${out}/exit.png`});
 if(!await page.$eval('.exit-panel',e=>e.innerText.includes('완료한 판까지')))throw Error('wrong exit explanation');
 await click('[data-exit=confirm]');await page.waitForSelector('#title-screen');await click('#m-tournament');
 const after=await page.evaluate(()=>localStorage.getItem('gostop2026-tournament-v1'));
 if(before!==after)throw Error('unfinished hand changed checkpoint');
 await click('#next');await playRound('after-resume');
 report.tournament={restored:true,unfinishedHandPreserved:true,text};
 await page.goto(GAME_URL);await page.evaluate(()=>localStorage.setItem('gostop2026-tournament-v1','bad'));await page.reload();if(await page.$eval('#m-tournament',e=>e.innerText.includes('이어하기')))throw Error('invalid save advertised');await click('#m-tournament');if(!await page.$('#next'))throw Error('invalid save blocked new tournament');
 await page.goto(GAME_URL);await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('quota')};Storage.prototype.removeItem=function(){throw new Error('blocked')};});await click('#m-tournament');if(!await page.$('[role=alert]'))throw Error('save failure hidden');await page.screenshot({path:`${out}/storage-blocked.png`});report.storageFailureVisible=true;if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();}

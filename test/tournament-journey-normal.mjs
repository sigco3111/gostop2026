// Public UI journey with real timers, naturally earned checkpoints and bounded batches.
import puppeteer from 'puppeteer-core';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/tournament-stock-journey';mkdirSync(out,{recursive:true});
const report=existsSync(out+'/report.json')?JSON.parse(readFileSync(out+'/report.json')):{rounds:[],seed:23,errors:[],productionTimers:true};
let browser;const saveReport=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
try{
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,userDataDir:out+'/profile',args:['--no-sandbox'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.evaluateOnNewDocument(seed=>{let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;window.__qaRandomState=n;return n/4294967296;};window.__qaRandomState=n;},report.seed);
 await p.goto(process.env.GAME_URL??'https://sigco3111.github.io/gostop2026/',{waitUntil:'networkidle0'});
 const scripts=await p.$$eval('script[src]',es=>es.map(e=>e.src));if(report.scripts&&JSON.stringify(report.scripts)!==JSON.stringify(scripts))throw Error('build changed');report.scripts=scripts;
 const saved=await p.evaluate(()=>({checkpoint:localStorage.getItem('gostop2026-tournament-v1'),progress:localStorage.getItem('gostop2026-save-v1')}));
 if(report.checkpoint!==undefined&&saved.checkpoint!==report.checkpoint)throw Error('checkpoint reload mismatch');
 if(report.progress!==undefined&&saved.progress!==report.progress)throw Error('progress reload mismatch');
 await p.tap('#m-tournament');
 const first=await p.$eval('#tournament-screen',e=>e.innerText);if(report.bracket&&report.bracket!==first)throw Error('visible bracket reload mismatch');
 const budget=Number(process.env.ROUND_BUDGET??2);
 for(let batch=0;batch<budget;batch++){
  if(!await p.$('#next'))break;
  const prior=await p.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-tournament-v1')));
  const round={number:report.rounds.length+1,plays:0,choices:0,goStop:0,prior};await p.tap('#next');
  for(let turn=0;turn<45;turn++){
   await p.waitForFunction(()=>document.querySelector('.settle-overlay,.gostop-overlay,.choice-overlay')||(!document.querySelector('#game-screen')?.inert&&window.__game?.turn===0),{timeout:25000,polling:100});
   if(await p.$('.settle-overlay'))break;
   if(await p.$('.gostop-overlay')){round.goStop++;await p.tap('.btn.stop');continue;}
   if(await p.$('.choice-overlay')){round.choices++;await p.tap('.choice-overlay [role=button]');continue;}
   const before=await p.evaluate(()=>{const g=window.__game,vals={gwang:12,yeol:5,tti:3,pi:1};let best=null,v=-1e3;for(const c of g.players[0].hand){const ms=g.floor.filter(f=>f.month===c.month);const value=ms.length?10+Math.max(...ms.map(x=>vals[x.kind])):-vals[c.kind];if(value>v){v=value;best=c.id;}}return{id:best,hand:g.players[0].hand.length};});
   const selector=before.id!==null?`#hand [data-card-id="${before.id}"]`:'#actionbar button';await p.$eval(selector,e=>e.scrollIntoView({block:'center'}));await p.tap(selector);
   await p.waitForFunction(n=>window.__game.players[0].hand.length<n||document.querySelector('.choice-overlay,.gostop-overlay,.settle-overlay'),{timeout:20000,polling:100},before.hand);round.plays++;
  }
  await p.waitForSelector('.settle-overlay');round.result=await p.$eval('.settle-panel',e=>e.innerText);await p.screenshot({path:`${out}/round-${round.number}-result.png`});
  await p.tap('#settle-ok');await p.waitForSelector('#tournament-screen');report.bracket=await p.$eval('#tournament-screen',e=>e.innerText);
  const after=await p.evaluate(()=>({checkpoint:localStorage.getItem('gostop2026-tournament-v1'),progress:localStorage.getItem('gostop2026-save-v1'),seed:window.__qaRandomState}));
  round.after=after.checkpoint?JSON.parse(after.checkpoint):null;report.checkpoint=after.checkpoint;report.progress=after.progress;report.seed=after.seed;report.rounds.push(round);
  if(!report.bracket.includes('우승')&&JSON.parse(after.progress??'null')?.trophies)throw Error('early trophy');
  if(!round.after){report.outcome=report.bracket.includes('우승')?'champion':'eliminated';const progress=JSON.parse(after.progress??'null');if(report.outcome==='champion'&&(progress?.trophies!==1||!progress?.titles.includes('패담의 챔피언')))throw Error('champion not credited exactly once');if(report.outcome==='eliminated'&&progress?.trophies)throw Error('elimination trophy');report.complete=true;}
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await p.screenshot({path:`${out}/round-${round.number}-bracket.png`,fullPage:true});saveReport();if(report.complete)break;
 }
 if(report.complete){await p.tap('#back');await p.reload({waitUntil:'networkidle0'});if(await p.evaluate(()=>localStorage.getItem('gostop2026-save-v1'))!==report.progress)throw Error('completion reload changed trophy');if(await p.$eval('#m-tournament',e=>e.innerText.includes('이어하기')))throw Error('finished tournament advertised resume');report.completionReload=true;await p.tap('#m-guide');await p.tap('[data-tab=credits]');await p.screenshot({path:out+'/final-records.png'});await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations);if(violations.length)throw Error('axe '+JSON.stringify(violations));report.axe=0;}
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify({rounds:report.rounds.length,latest:report.rounds.at(-1),complete:report.complete,outcome:report.outcome,completionReload:report.completionReload,errors:report.errors}));
}finally{saveReport();await browser?.close();}

import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/tournament-sync';mkdirSync(out,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:10000,args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-crash-reporter','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===950?950:Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el)await el.click().catch(()=>{});};
 async function playRound(tag){
  let played=0,choices=0,prompts=0;
  for(let k=0;k<1500;k++){
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
 const url='http://localhost:4173/gostop2026/';
 page.setDefaultTimeout(10000);const other=await browser.newPage();await other.goto(url,{waitUntil:'networkidle0'});
 const key='gostop2026-tournament-v1';
 const change=async(clear=false)=>other.evaluate(({key,clear})=>{if(clear){localStorage.removeItem(key);return null;}const v=JSON.parse(localStorage.getItem(key));v.carry=v.carry===8?4:8;const raw=JSON.stringify(v);localStorage.setItem(key,raw);return raw;},{key,clear});
 await page.goto(url,{waitUntil:'networkidle0'});await page.bringToFront();await page.waitForSelector('#m-tournament');await click('#m-tournament');await page.waitForSelector('#tournament-screen');
 let newer=await change();await click('#next');await page.waitForSelector('#tournament-conflict-screen');
 if(await page.evaluate(key=>localStorage.getItem(key),key)!==newer)throw Error('pre-start conflict overwrote checkpoint');
 report.preStartConflict=true;
 for(const width of [320,390,1280]){await page.setViewport({width,height:width===320?568:844,isMobile:true,hasTouch:true});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/conflict-${width}.png`,fullPage:true});if(await page.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('conflict overflow');
 await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const audit=await page.evaluate(async()=>{const r=await axe.run(document.querySelector('#tournament-conflict-screen'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact}));});if(audit.length)throw Error(JSON.stringify(audit));}
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await page.keyboard.press('Tab');if(await page.evaluate(()=>document.activeElement?.id)!=='latest')throw Error('conflict focus sequence');await page.keyboard.press('Enter');await page.waitForSelector('#next');
 await click('#next');newer=await change();await playRound('changed-during-hand');await page.waitForSelector('#tournament-conflict-screen');if(await page.evaluate(key=>localStorage.getItem(key),key)!==newer)throw Error('midhand conflict overwrote checkpoint');report.midHandConflict=true;
 await page.evaluate(key=>{const v=JSON.parse(localStorage.getItem(key));const rounds=[];let alive=v.alive;for(let r=0;r<2;r++){const rows=[];for(let i=0;i<alive.length;i+=2)rows.push({a:alive[i],b:alive[i+1],winner:alive[i],score:[2,0]});rounds.push(rows);alive=rows.map(p=>p.winner);}localStorage.setItem(key,JSON.stringify({version:1,alive,history:rounds,series:[1,0],carry:1}));},key);
 await page.reload({waitUntil:'networkidle0'});await click('#m-tournament');await page.waitForSelector('#next');await click('#next');await change(true);const finalText=await playRound('cleared-during-final');if(!finalText.startsWith('승리'))throw Error('fixture must win final hand');if(await page.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')||'{}').trophies))throw Error('conflicting final awarded trophy');report.noConflictingTrophy=true;await page.waitForSelector('#tournament-conflict-screen');if(await page.evaluate(key=>localStorage.getItem(key),key)!==null)throw Error('deleted checkpoint resurrected');report.deletedNotResurrected=true;
 await click('#latest');await page.waitForSelector('#next');const final=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);if(final.history.length||final.series.some(Boolean)||final.carry!==1)throw Error('fresh tournament not fresh');report.latestRecovery=true;console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

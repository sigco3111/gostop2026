import puppeteer from 'puppeteer-core';
import {readyImages} from './ready-images.mjs';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/stop-preview';
const url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';
const continueGo=process.env.CONTINUE_GO==='1',multiplierFixture=process.env.MULTIPLIER_FIXTURE==='1';
const reducedMotion=process.env.REDUCED_MOTION==='1',rapidInput=process.env.RAPID_INPUT==='1';mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost:4173/')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
let browser;const report={errors:[],rounds:[],story:null,tournament:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await pause(800);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,timeout:10000,protocolTimeout:10000,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true}});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===950?950:Math.min(ms??0,20),...args);
 });
 const click=async selector=>{const el=await page.$(selector);if(el){await el.focus();if(rapidInput&&selector.startsWith('#hand ')){await el.evaluate(e=>{for(let i=0;i<12;i++)e.dispatchEvent(new MouseEvent('click',{bubbles:true}));});}else await page.keyboard.press('Enter');}};
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
    if(!await page.evaluate(()=>window.__eventLog===document.querySelector('[role=log]')))throw Error('event log remounted');
    const text=await page.$eval('.settle-panel',el=>el.innerText);if(report.stopExpected){const expected=report.stopExpected;if(!text.includes('최종\n'+expected+'점'))throw Error('stop result differs from preview');}report.rounds.push({tag,played,choices,prompts,text});
    if(report.rounds.length<=4)await page.screenshot({path:`${out}/${tag}-settled.png`});
    await click('#settle-ok');await pause(30);return text;
   }
   if(await page.$('.gostop-overlay')){prompts++;if(prompts===1)await pause(350);if(prompts===1){
     report.stopPreview=await page.$eval('.gostop-panel',e=>e.innerText);
     const expected=await page.$eval('.stop-preview strong',e=>e.textContent);if(!await page.$eval('.stop-breakdown',(e,expected)=>e.textContent.endsWith('= '+expected),expected))throw Error('preview formula final mismatch');
     for(const [width,height]of [[320,568],[390,844],[844,320],[1280,844]]){await page.setViewport({width,height,isMobile:true,hasTouch:true});await page.$eval('.gostop-panel',e=>e.scrollTop=0);await readyImages(page);await page.screenshot({path:`${out}/stop-${width}.png`});await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('preview axe '+JSON.stringify(axe.violations));if(await page.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('preview overflow');const bounds=await page.$eval('.gostop-panel',e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};});if(bounds.top<0||bounds.bottom>height+1)throw Error('panel outside viewport');const stop=await page.$('.btn.stop');await stop.focus();if(!await stop.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}))throw Error('stop action unreachable');await page.screenshot({path:`${out}/stop-actions-${width}.png`});await page.keyboard.press('Tab');if(!await page.evaluate(()=>document.activeElement.matches('.btn.go')))throw Error('preview Tab escaped');}
     await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    }if(continueGo&&prompts===1){await click('.btn.go');report.choseGo=true;}else{report.stopExpected=(await page.$eval('.stop-preview strong',e=>e.textContent)).replace('점','');await click('.btn.stop');}}
   else if(await page.$('.choice-overlay')){choices++;if(choices===1)await page.screenshot({path:`${out}/choice-${tag}.png`});await click('.choice-overlay .hcard');}
   else if(await page.$('.floor-cell.target .hcard')){await click('.floor-cell.target .hcard');}
   else{
    const s=await page.evaluate(()=>window.__game?{turn:window.__game.turn,pending:!!window.__game.awaitingChoice,go:window.__game.awaitingGoStop,over:window.__game.over,hand:window.__game.players[0].hand.length}:null);
    if(s&&s.turn===0&&!s.pending&&!s.go&&!s.over){if(await page.$('#game-screen > [inert]'))throw Error('background remained inert after answer');await page.waitForFunction(()=>document.activeElement?.closest('#hand')||document.activeElement?.classList.contains('capture-toggle')||document.querySelector('[role=dialog]'),{timeout:4000});
     // Use current public state to choose a sensible capture. This is test-driver strategy, not a hidden-state AI.
     const id=await page.evaluate(()=>{const g=window.__game;const vals={gwang:12,yeol:5,tti:3,pi:1};let best=null,v=-1e3;for(const c of g.players[0].hand){const ms=g.floor.filter(f=>f.month===c.month);const value=ms.length?10+Math.max(...ms.map(x=>vals[x.kind])):-vals[c.kind];if(value>v){v=value;best=c.id;}}return best;});
     if(id!==null){await click(`#hand [data-card-id="${id}"]`);played++;}else await click('#actionbar button');
    }
   }
   await pause(15);
  }
  throw new Error(`round stalled: ${tag} `+await page.evaluate(()=>JSON.stringify(window.__game)));
 }
 if(reducedMotion){await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.evaluateOnNewDocument(()=>{window.__flightNodes=0;new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&(n.matches?.('.fx-card,.fx-burst')||n.querySelector?.('.fx-card,.fx-burst')))window.__flightNodes++;}).observe(document,{childList:true,subtree:true});});}
 await page.goto(url,{waitUntil:'networkidle0'});
 await page.keyboard.press('Tab');if(!await page.$eval('#m-scenario',e=>e===document.activeElement))throw Error('initial Tab did not enter menu');await page.keyboard.press('Enter');if(!await page.evaluate(()=>document.activeElement?.tagName==='H2'))throw Error('screen heading not focused');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 if(!await page.$eval('#dialogue-screen',e=>e.getAttribute('aria-label').includes(e.querySelector('.dialogue-text').textContent)))throw Error('dialogue hidden from accessible name');
 for(let i=0;i<5&&!(await page.$('#game-screen'));i++){await click('#dialogue-screen');await pause(25);}
 await page.waitForSelector('#hand [role=button]');await page.waitForFunction(()=>document.activeElement?.closest('#hand'));const first=await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'));await page.keyboard.press('ArrowRight');if(await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'))===first)throw Error('arrow did not move');await page.keyboard.press('Home');if(await page.evaluate(()=>document.activeElement?.getAttribute('data-card-id'))!==first)throw Error('Home failed');for(const width of [320,390,1280]){await page.setViewport({width,height:width===320?568:844,isMobile:true,hasTouch:true});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/board-${width}.png`});if(await page.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('overflow');}await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await page.evaluate(()=>{window.__initialOpponentIds=window.__game.players[1].hand.map(c=>c.id);if(document.querySelector('[role=log]').textContent)throw Error('initial hidden hand disclosure');window.__eventLog=document.querySelector('[role=log]');window.__logLines=[];new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)window.__logLines.push(n.textContent);}).observe(window.__eventLog,{childList:true});});
 const names=await page.$$eval('#hand .hcard',els=>els.map(e=>e.getAttribute('aria-label')));if(names.some(s=>(s.match(/\d+월/g)||[]).length!==1))throw Error('duplicated month name');report.cardNames=names;
 report.zones=await page.evaluate(()=>({opponent:document.querySelector('.opp-hand').getAttribute('aria-label'),floor:document.querySelector('#floor').getAttribute('aria-label'),hand:document.querySelector('#hand').getAttribute('aria-label'),deck:document.querySelector('.deck-pile').getAttribute('aria-label')}));if(!report.zones.opponent.includes('뒷면')||!report.zones.deck.includes('남은 더미'))throw Error('board state names missing');
 if(multiplierFixture){await page.evaluate(()=>{const g=window.__game;g.players[0].goCount=5;g.players[0].shakes=2;g.nagariCarry=8;g.players[1].goCount=1;});report.multiplierFixture=true;}
 await playRound('story');
 if(reducedMotion){report.reducedMotion=await page.evaluate(()=>({matches:matchMedia('(prefers-reduced-motion:reduce)').matches,flightNodes:window.__flightNodes,animations:document.getAnimations().length}));if(!report.reducedMotion.matches||report.reducedMotion.flightNodes!==0||report.reducedMotion.animations!==0)throw Error('reduced motion emitted animations');}
 if(rapidInput){const cards=await page.evaluate(()=>{const g=window.__game;return [...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])].map(c=>c.id);});if(cards.length!==48||new Set(cards).size!==48)throw Error('rapid repeat input corrupted48-card accounting');report.rapidInput={repeatsPerUserPlay:12,cardCount:cards.length,unique:new Set(cards).size};}
 report.log=await page.evaluate(()=>({lines:window.__logLines,clearedAfterEnd:!document.querySelector('[role=log]'),role:window.__eventLog.getAttribute('role'),live:window.__eventLog.getAttribute('aria-live'),recent:window.__eventLog.children.length}));if(report.log.lines.length<20)throw Error('public events not logged');if(!report.log.clearedAfterEnd)throw Error('log leaked into next screen');if(report.log.recent>12)throw Error('unbounded log');if(!report.log.lines.some(s=>s.startsWith('빈패:')))throw Error('opponent events missing');
await click('#dialogue-screen');await pause(25);
 const before=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
 await page.reload({waitUntil:'networkidle0'});const after=await page.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
 const a=JSON.parse(before),b=JSON.parse(after);const same=JSON.stringify(Object.keys(a).sort().map(k=>[k,a[k]]))===JSON.stringify(Object.keys(b).sort().map(k=>[k,b[k]]));if(!same)throw new Error('save changed after reload');report.story={before,after,valuesPreserved:same};
 report.errors=report.errors.filter(Boolean);console.log(JSON.stringify({log:report.log,cardNames:report.cardNames,errors:report.errors,rounds:report.rounds.length,userPrompts:report.rounds.reduce((s,r)=>s+r.prompts,0),choices:report.rounds.reduce((s,r)=>s+r.choices,0),story:report.story,tournament:report.tournament}));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();if(server){server.kill();await new Promise(r=>server.once('exit',r));}}

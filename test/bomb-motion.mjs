import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT??'/tmp/bomb-motion',url=process.env.GAME_URL??'http://localhost:4173/gostop2026/';mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
const pause=ms=>new Promise(r=>setTimeout(r,ms));let browser;const report={errors:[],views:[],opponent:null};
try{
 await pause(600);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const width of [320,390,1280]){
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.setViewport({width,height:width===320?568:844});
  await page.evaluateOnNewDocument(()=>{let n=49;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const t=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>t(fn,[110,300].includes(ms)?900:ms,...args);});
  await page.goto(url,{waitUntil:'networkidle0'});await page.click('#m-free');await page.click('.stage-card');await page.waitForSelector('#actionbar .danger');
  const expected=await page.evaluate(()=>{const g=window.__game,m=g.canBomb(0)[0];return {month:m,hand:g.players[0].hand.filter(c=>c.month===m).map(c=>{const r=document.querySelector(`#hand [data-card-id="${c.id}"]`).getBoundingClientRect();return {id:c.id,x:r.x+r.width/2,y:r.y+r.height/2};})};});
  await page.click('#actionbar .danger');await page.waitForSelector('.motion-capture',{timeout:10000});
  const origins=await page.$$eval('.motion-capture',nodes=>nodes.map(n=>({id:Number(n.dataset.cardId),x:parseFloat(n.style.left)+28,y:parseFloat(n.style.top)+42})));
  await page.screenshot({path:`${out}/bomb-${width}.png`});
  const correct=expected.hand.every(h=>origins.some(n=>n.id===h.id&&Math.abs(n.x-h.x)<1&&Math.abs(n.y-h.y)<1));
  report.views.push({width,expected,origins,correct});
  if(!correct)throw Error('bomb hand cards originate from the floor instead of their visible hand positions');
  await page.waitForFunction(()=>!document.querySelector('#game-screen').inert&&!document.querySelector('.motion-card'),{timeout:20000});
  const state=await page.evaluate(()=>{const g=window.__game,all=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])];return {count:all.length,unique:new Set(all.map(c=>c.id)).size,overflow:document.documentElement.scrollWidth>innerWidth,busy:document.querySelector('#game-screen').inert};});
  if(state.count!==48||state.unique!==48||state.overflow||state.busy)throw Error('bomb final state invalid');report.views.at(-1).state=state;await page.close();
 }
 const page=await browser.newPage();await page.setViewport({width:390,height:844});page.on('pageerror',e=>report.errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{let n=43;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const t=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>t(fn,[110,300].includes(ms)?900:ms,...args);});
 await page.goto(url,{waitUntil:'networkidle0'});await page.click('#m-free');await page.click('.stage-card:nth-child(5)');await page.waitForSelector('#hand [role=button]');
 const backs=await page.$$eval('.opp-hand .card-back',ns=>ns.slice(0,3).map(n=>{const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};}));
 await page.click('#hand [data-card-id="7"]');
 await page.waitForFunction(()=>document.querySelector('.motion-impact')?.textContent==='7월 · 4장 획득',{timeout:15000});
 await page.waitForSelector('.motion-capture');
 const origins=await page.$$eval('.motion-capture',ns=>ns.slice(0,3).map(n=>({x:parseFloat(n.style.left)+28,y:parseFloat(n.style.top)+42})));
 await page.screenshot({path:`${out}/opponent-bomb-390.png`});
 if(!backs.every((b,i)=>Math.abs(b.x-origins[i].x)<1&&Math.abs(b.y-origins[i].y)<1))throw Error('opponent bomb did not start from face-down hand slots');
 await page.waitForFunction(()=>!document.querySelector('#game-screen').inert&&!document.querySelector('.motion-card'),{timeout:20000});
 report.opponent={seed:43,backs,origins,correct:true};await page.close();
 if(report.errors.length)throw Error(report.errors.join(';'));console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server?.kill();}

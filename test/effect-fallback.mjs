// Production-timer fault matrix: unavailable atlases and reduced motion must not change a turn.
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const url=process.env.GAME_URL??'https://sigco3111.github.io/gostop2026/',out=process.env.QA_OUT??'/tmp/effect-fallback';mkdirSync(out,{recursive:true});
let browser;const report={url,productionTimers:true,cases:[],errors:[]};
try{
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const effect of ['a','b','c']){
  let expected;
  for(const mode of ['normal','missing','reduce']){
   const p=await browser.newPage();await p.setViewport({width:390,height:844});p.on('pageerror',e=>report.errors.push(e.message));
   if(mode==='reduce')await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   let blocked=0;if(mode==='missing'){await p.setRequestInterception(true);p.on('request',r=>{if(r.url().includes('/assets/effects/')){blocked++;r.abort();}else r.continue();});}
   await p.evaluateOnNewDocument(effect=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};localStorage.setItem('gostop2026-impact',effect);},effect);
   await p.goto(url,{waitUntil:'networkidle0'});const build=await p.$$eval('script[src]',xs=>xs.map(x=>x.src));await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand [role=button]');
   await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
   const save=await p.evaluate(()=>localStorage.getItem('gostop2026-save-v1'));
   await p.evaluate(()=>{window.__contacts=0;window.__flights=0;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(n.matches('.motion-contact'))window.__contacts++;if(n.matches('.motion-card'))window.__flights++;}}).observe(document.querySelector('.fx-layer'),{childList:true});});
   const id=await p.evaluate(()=>{const g=window.__game;return g.players[0].hand.find(c=>g.floor.filter(f=>f.month===c.month).length===1).id;});
   const start=Date.now();await p.click(`#hand [data-card-id="${id}"]`);
   await p.waitForFunction(()=>!document.querySelector('#game-screen').inert&&window.__game.turn===0&&!document.querySelector('.motion-card,.motion-contact'),{timeout:15000});
   const result=await p.evaluate(()=>{const g=window.__game,all=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])];return {state:JSON.stringify(g),cards:all.length,unique:new Set(all.map(c=>c.id)).size,contacts:window.__contacts,flights:window.__flights,ghosts:document.querySelectorAll('.motion-card,.motion-contact,.motion-impact').length,save:localStorage.getItem('gostop2026-save-v1'),inert:document.querySelector('#game-screen').inert,overflow:document.documentElement.scrollWidth>innerWidth};});
   if(mode==='normal')expected=result.state;else if(result.state!==expected)throw Error(`${effect}/${mode}: turn changed`);
   if(result.cards!==48||result.unique!==48||result.ghosts||result.inert||result.overflow||result.save!==save)throw Error(`${effect}/${mode}: invariant failed`);
   if(mode==='missing'&&blocked!==3)throw Error(`${effect}: atlas fault fixture did not block all three images`);
   if(mode!=='normal'&&result.contacts!==0)throw Error(`${effect}/${mode}: forbidden contact created`);
   if(mode==='reduce'&&result.flights!==0)throw Error(`${effect}/${mode}: flight created`);
   if(mode==='normal'&&result.contacts!==2)throw Error(`${effect}: expected two ordinary contacts`);
   await p.screenshot({path:`${out}/${effect}-${mode}.png`});
   const {state,...small}=result;report.cases.push({effect,mode,id,blockedAtlases:blocked,durationMs:Date.now()-start,build,...small,sameTurnState:true});console.log(JSON.stringify(report.cases.at(-1)));await p.close();
  }
 }
 if(report.errors.length)throw Error(report.errors.join(';'));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();}

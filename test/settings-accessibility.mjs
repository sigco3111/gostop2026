// Public card labels and a stable save-status region. No screen-reader speech claim.
import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT||'/tmp/settings-accessibility';mkdirSync(out,{recursive:true});
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4176'],{stdio:'ignore'});
const url=process.env.GAME_URL||'http://localhost:4176/gostop2026/';let browser;const report={errors:[],decks:[],views:[],failedStorage:false};
try{
 await new Promise(r=>setTimeout(r,500));browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2']});
 const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.click('#m-settings');
 for(const deck of ['original','classic','comic','minimal']){
  await p.click(`[data-deck=${deck}]`);
  const alts=await p.$$eval('.deck-preview-grid img',is=>is.map(i=>i.alt));
  if(alts.length!==48||alts.some(a=>/gwang|yeol|tti|\bpi\b/.test(a)||(a.match(/\d+월/g)||[]).length!==1))throw Error('uncanonical settings card labels');
  if(!alts.some(a=>a.includes('홍단'))||!alts.some(a=>a.includes('고도리'))||!alts.some(a=>a.includes('비광'))||!alts.some(a=>a.includes('쌍피로도 자동 계산')))throw Error('missing public scoring descriptions');
  await p.evaluate(()=>{window.__status=document.querySelector('#deck-status');window.__apply=document.querySelector('#deck-apply');});
  await p.click('#deck-apply');
  const state=await p.evaluate(()=>({statusSame:window.__status===document.querySelector('#deck-status'),buttonSame:window.__apply===document.querySelector('#deck-apply'),text:document.querySelector('#deck-status').textContent,badges:[...document.querySelectorAll('[data-deck]')].filter(b=>b.querySelector('span')).map(b=>b.dataset.deck),focused:document.activeElement===document.querySelector('#deck-apply')}));
  if(!state.statusSame||!state.buttonSame||!state.focused||!state.text.includes('저장했습니다')||state.badges.join()!==deck)throw Error('save status/focus/badge regressed');report.decks.push({deck,...state});
 }
 for(const width of [320,390,1280]){await p.setViewport({width,height:width===320?568:844});await p.click('[data-deck=classic]');await p.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager')});await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.click('#deck-apply');await p.screenshot({path:`${out}/settings-${width}.png`});if(await p.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('horizontal overflow');report.views.push(width);}
 await p.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota')}});await p.click('[data-deck=comic]');await p.evaluate(()=>window.__status=document.querySelector('#deck-status'));await p.click('#deck-apply');
 if(!await p.evaluate(()=>window.__status===document.querySelector('#deck-status')&&document.querySelector('#deck-status').textContent.includes('저장하지 못했습니다')&&document.querySelector('[data-deck=classic] span')?.textContent==='사용 중'&&!document.querySelector('[data-deck=comic] span')))throw Error('failed save lost previous choice or warning');report.failedStorage=true;
 await p.screenshot({path:`${out}/storage-failed.png`});if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server?.kill();}

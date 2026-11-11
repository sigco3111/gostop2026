// Deliberate public-capture fixture, not a naturally played round or saved progress.
import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT||'/tmp/captured-score-detail';mkdirSync(out,{recursive:true});
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4177'],{stdio:'ignore'});let b;const report={errors:[],views:[],cases:[]};
try{
 await new Promise(r=>setTimeout(r,500));b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2']});const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};});
 await p.goto(process.env.GAME_URL||'http://localhost:4177/gostop2026/');await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand');
 await p.evaluate(()=>{const g=window.__game;window.__canonical=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])].sort((a,b)=>a.id-b.id);});
 for(const mode of ['pi','yeol','zero']){
  await p.evaluate(mode=>{const g=window.__game,d=window.__canonical;let captured=[];if(mode==='pi')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='pi'&&c.piValue===1).slice(0,13),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori),d.find(c=>c.isGodori)];if(mode==='yeol')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin)];const ids=new Set(captured.map(c=>c.id));const remaining=d.filter(c=>!ids.has(c.id));g.players[0].captured=captured;g.players[1].captured=[];g.players[0].hand=remaining.splice(0,1);g.players[1].hand=remaining.splice(0,1);g.floor=remaining.splice(0,4);g.deck=remaining;g.turn=0;g.awaitingChoice=null;g.awaitingGoStop=false;g.over=false;},mode);
  await p.click('.sound-toggle');await p.click('.capture-toggle');await p.waitForSelector('.capture-overlay');
  const texts=await p.$$eval('.capture-breakdown',els=>els.map(e=>e.textContent));const note=await p.$eval('.capture-panel',e=>e.innerText);
  if(texts.length!==2||!texts[1].includes('현재 0점'))throw Error('missing two-player score descriptions');
  if(mode==='pi'&&(!note.includes('쌍피 2장분')||!texts[0].includes('= 8점')))throw Error('pi raw score designation wrong');
  if(mode==='yeol'&&(!note.includes('열끗 1장')||!texts[0].includes('고도리 5점')))throw Error('yeol designation missing');
  if(mode==='zero'&&await p.$('.capture-gukjin'))throw Error('invented gukjin');
  report.cases.push({mode,texts,note});
  if(mode==='pi')for(const [width,height]of [[320,568],[390,844],[844,320],[1280,844]]){await p.setViewport({width,height});await p.screenshot({path:`${out}/capture-${width}.png`});await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('axe violations '+JSON.stringify(axe.violations));if(await p.evaluate(()=>document.body.scrollWidth>innerWidth||document.querySelector('.capture-panel').getBoundingClientRect().height>innerHeight))throw Error('overflow');await p.keyboard.press('Tab');if(!await p.evaluate(()=>!!document.activeElement.closest('.capture-overlay')))throw Error('focus escaped');report.views.push({width,height,axe:0});}
  await p.keyboard.press('Escape');if(await p.$('.capture-overlay'))throw Error('Escape failed');if(!await p.evaluate(()=>document.activeElement.classList.contains('capture-toggle')))throw Error('focus not returned');
 }
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}
